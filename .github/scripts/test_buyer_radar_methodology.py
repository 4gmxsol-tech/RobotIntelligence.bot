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
EXPECTED_LASTMOD = "2026-11-14"

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

# Cache-bust the live scanner whenever its implementation has changed.
assert 'src="buyer-radar-live.js?v=20261114-1"' in HTML, "Buyer Radar must use the refreshed live-script cache key"

# Public-source scope and heuristic labels must remain accurate.
assert "source-disclosure" in HTML
for phrase in ("GitHub public repository search", "Hacker News via Algolia",
               "not independently verified", "purchase intent"):
    assert phrase.lower() in HTML.lower(), f"Missing public-source limitation: {phrase}"
assert "verify commercial entities" not in HTML.lower(), "Do not claim independent company verification"
assert "Company intelligence" not in HTML, "Use candidate language for heuristic entity resolution"
assert "CANDIDATE ORGANIZATIONS" in JS
assert "VERIFIED ENTITIES" not in JS
assert "function isPlausibleOrganizationCandidate(" in JS
assert "function verify(" not in JS
assert "No plausible organization candidates surfaced" in JS
assert "No organization candidate has enough evidence yet." in JS

docs = (ROOT / "BUYER-RADAR.md").read_text(encoding="utf-8")
for phrase in ("GitHub public repository search API", "Hacker News search through Algolia",
               "not independent company verification", "not a probability of purchase",
               "does not send messages or contact companies"):
    assert phrase.lower() in docs.lower(), f"Missing implementation limit in BUYER-RADAR.md: {phrase}"
assert "DEMO MODE" not in docs, "Documentation must describe the current live-source implementation"
assert "five-provider production agent" in docs

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
# The static agent console must expose the server-persisted CI run ledger without
# replacing or blocking the browser-local research session.
AGENT_HTML = (ROOT / "agent.html").read_text(encoding="utf-8")
AGENT_ALIAS_HTML = (ROOT / "agent/index.html").read_text(encoding="utf-8")
AGENT_RUNTIME = (ROOT / "agent-runtime.js").read_text(encoding="utf-8")
AGENT_STATE = json.loads((ROOT / "agent/state.json").read_text(encoding="utf-8"))

for page in (AGENT_HTML, AGENT_ALIAS_HTML):
    assert 'id="persistedRunState"' in page, "Agent page must expose persisted run history"
    assert 'id="persistedRunStatus"' in page, "Agent page must expose persisted-state status"
    assert 'aria-live="polite"' in page, "Persisted-state updates must be announced accessibly"
    assert "agent-runtime.js?v=20261110-1" in page, "Agent page must load the updated runtime"

assert "async function loadPersistedRunState()" in AGENT_RUNTIME
assert 'fetch("/agent/state.json"' in AGENT_RUNTIME
assert "loadPersistedRunState();" in AGENT_RUNTIME
assert "SERVER HISTORY UNAVAILABLE" in AGENT_RUNTIME
assert AGENT_STATE.get("version") == 2, "Unexpected persisted agent state schema"
assert isinstance(AGENT_STATE.get("runs"), list), "Persisted run history must be an array"
if AGENT_STATE.get("lastRun"):
    assert any(run.get("id") == AGENT_STATE["lastRun"] for run in AGENT_STATE["runs"]), "lastRun must identify a saved run"

PAGES_WORKFLOW = (ROOT / ".github/workflows/pages.yml").read_text(encoding="utf-8")
assert re.search(r'workflow_run:\s+workflows:\s+\["RobotIntelligence Agent"\]\s+types:\s+\[completed\]\s+branches:\s+\[main\]', PAGES_WORKFLOW), "Pages must rebuild after the trusted agent workflow completes on main"
assert "github.event.workflow_run.conclusion == 'success'" in PAGES_WORKFLOW, "Agent-triggered Pages deployment must require a successful agent run"

print("PASS: Buyer Radar indexability, methodology, score semantics, outreach safeguards and sitemap")
