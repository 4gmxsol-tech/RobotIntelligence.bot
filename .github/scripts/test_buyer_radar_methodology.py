#!/usr/bin/env python3
"""Guard Buyer Radar's public methodology and prevent unsupported acquisition claims."""
from html.parser import HTMLParser
import json
from pathlib import Path
import re
import xml.etree.ElementTree as ET

ROOT = Path(__file__).resolve().parents[2]
HTML = (ROOT / "buyer-radar.html").read_text(encoding="utf-8")
JS = (ROOT / "buyer-radar-live.js").read_text(encoding="utf-8")
CSS = (ROOT / "buyer-radar.css").read_text(encoding="utf-8")
HOME = (ROOT / "index.html").read_text(encoding="utf-8")
SITEMAP_XML = (ROOT / "sitemap.xml").read_bytes()
SITEMAP_ALIAS = (ROOT / "sitemap").read_bytes()
PAGE_URL = "https://robotintelligence.bot/buyer-radar.html"
EXPECTED_LASTMOD = "2026-11-09"

class H1Counter(HTMLParser):
    def __init__(self):
        super().__init__()
        self.count = 0
    def handle_starttag(self, tag, attrs):
        if tag.lower() == "h1":
            self.count += 1

def meta(pattern):
    match = re.search(pattern, HTML, re.I)
    assert match, f"Missing metadata matching {pattern}"
    return match.group(1).strip()

assert meta(r'<link\s+rel=["\']canonical["\']\s+href=["\']([^"\']+)') == PAGE_URL
robots = meta(r'<meta\s+name=["\']robots["\']\s+content=["\']([^"\']+)')
assert "noindex" not in robots.lower()
description = meta(r'<meta\s+name=["\']description["\']\s+content=["\']([^"\']+)')
og_description = meta(r'<meta\s+property=["\']og:description["\']\s+content=["\']([^"\']+)')
twitter_description = meta(r'<meta\s+name=["\']twitter:description["\']\s+content=["\']([^"\']+)')
assert 70 <= len(description) <= 160
assert description == og_description == twitter_description

counter = H1Counter()
counter.feed(HTML)
assert counter.count == 1, f"Expected one H1, found {counter.count}"

# Breadcrumbs must be visible, accessible on mobile, and consistent with the canonical URL.
breadcrumb_blocks = []
for block in re.findall(r'<script\s+type=["\']application/ld\+json["\']>(.*?)</script>', HTML, re.I | re.S):
    payload = json.loads(block)
    if payload.get("@type") == "BreadcrumbList":
        breadcrumb_blocks.append(payload)
assert len(breadcrumb_blocks) == 1, "Expected exactly one BreadcrumbList"
expected_breadcrumbs = [
    {"@type": "ListItem", "position": 1, "name": "Home", "item": "https://robotintelligence.bot/"},
    {"@type": "ListItem", "position": 2, "name": "Buyer Radar", "item": PAGE_URL},
]
assert breadcrumb_blocks[0].get("itemListElement") == expected_breadcrumbs, "BreadcrumbList hierarchy or canonical URLs changed"
visible_breadcrumb = re.search(r'<nav\s+class=["\']breadcrumbs["\']\s+aria-label=["\']Breadcrumb["\']>(.*?)</nav>', HTML, re.I | re.S)
assert visible_breadcrumb, "Missing visible accessible breadcrumb navigation"
assert re.search(r'<a\s+href=["\']index\.html["\']>Home</a>', visible_breadcrumb.group(1), re.I)
assert re.search(r'<span\s+aria-current=["\']page["\']>Buyer Radar</span>', visible_breadcrumb.group(1), re.I)
assert re.search(r'\.breadcrumbs\s*\{[^}]*display\s*:\s*flex', CSS, re.I), "Breadcrumb must remain visible at narrow viewports"

assert "scoring-methodology" in HTML
assert "What the priority score means" in HTML
for phrase in ("Topical relevance", "Signal recency", "Commercial activity", "Evidence coverage"):
    assert phrase in HTML, f"Missing methodology dimension: {phrase}"
for phrase in ("not a probability of purchase", "sale authorization", "transfer scope",
               "does not send messages or contact companies"):
    assert phrase in HTML.lower(), f"Missing safety/meaning disclosure: {phrase}"

assert "RESEARCH PRIORITY" in JS
assert "not purchase probability" in JS.lower()
assert "HUMAN-REVIEWED RESEARCH ANGLE" in JS
assert "not a send-ready offer" in JS.lower()
assert "asset’s ownership" in JS
assert "not permission to contact" in JS
assert "I own " not in JS, "Generated research text must not assert asset ownership"
assert "sale authorization and transfer scope" in JS

for token in (
    "function relevance(",
    'recent=g.signals.filter(s=>ageDays(s.publishedAt)<=90).length',
    'commercial=g.signals.filter(s=>signalType(s)==="COMMERCIAL").length',
    "const evidence=g.signals.length",
    "Math.min(100,Math.round(30+rel*5+recent*7+commercial*10+Math.min(15,evidence*3)))",
):
    assert token in JS, f"Scoring implementation changed; review the public methodology: {token}"

assert SITEMAP_XML == SITEMAP_ALIAS, "Submitted sitemap alias must match sitemap.xml"
root = ET.fromstring(SITEMAP_XML)
ns = {"sm": "http://www.sitemaps.org/schemas/sitemap/0.9"}
entry = next((node for node in root.findall("sm:url", ns)
              if node.findtext("sm:loc", namespaces=ns) == PAGE_URL), None)
assert entry is not None, "Buyer Radar is missing from sitemap.xml"
assert entry.findtext("sm:lastmod", namespaces=ns) == EXPECTED_LASTMOD

assert len(re.findall(r'<a\b[^>]*href=["\']buyer-radar\.html["\']', HOME, re.I)) >= 2
print("PASS: Buyer Radar indexability, methodology, score semantics, outreach safeguards and sitemap")
