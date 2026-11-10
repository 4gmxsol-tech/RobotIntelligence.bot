#!/usr/bin/env python3
"""Ensure Buyer Radar has a useful crawlable product overview before its JS scan runs."""
from html.parser import HTMLParser
from pathlib import Path
import json
import re

ROOT = Path(__file__).resolve().parents[2]
HTML = (ROOT / "buyer-radar.html").read_text(encoding="utf-8")
AGENT = (ROOT / "agent.html").read_text(encoding="utf-8")
WORKFLOW = (ROOT / ".github/workflows/validate-seo.yml").read_text(encoding="utf-8")

class SectionParser(HTMLParser):
    def __init__(self):
        super().__init__()
        self.depth = 0
        self.capture = False
        self.text = []
    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if tag == "section" and attrs.get("id") == "buyer-radar-overview":
            self.capture = True
            self.depth = 1
            return
        if self.capture and tag == "section":
            self.depth += 1
    def handle_endtag(self, tag):
        if self.capture and tag == "section":
            self.depth -= 1
            if self.depth == 0:
                self.capture = False
    def handle_data(self, data):
        if self.capture:
            self.text.append(data)

parser = SectionParser()
parser.feed(HTML)
overview_text = " ".join(" ".join(parser.text).split())
assert len(overview_text.split()) >= 120, "Buyer Radar needs substantive static overview text"
for phrase in (
    "public robotics and Physical AI market signals",
    "GitHub repository metadata",
    "Hacker News",
    "source-linked evidence",
    "heuristic",
    "not a verified buyer",
    "does not send email",
    "legal requirements",
):
    assert phrase.lower() in overview_text.lower(), f"Missing static overview detail: {phrase}"

section_start = HTML.index('id="buyer-radar-overview"')
dynamic_start = HTML.index('id="asset-intelligence"')
assert section_start < dynamic_start, "Static product overview must appear before dynamically populated panels"
assert 'href="agent.html"' in HTML[section_start:dynamic_start], "Overview must link to the Agent Console"
assert 'href="#scoring-methodology"' in HTML[section_start:dynamic_start], "Overview must link to scoring methodology"

json_blocks = re.findall(
    r'<script\s+type=["\']application/ld\+json["\']>(.*?)</script>',
    HTML,
    flags=re.I | re.S,
)
payloads = [json.loads(block) for block in json_blocks]
apps = [item for item in payloads if item.get("@type") == "WebApplication"]
assert len(apps) == 1, "Expected exactly one WebApplication JSON-LD entity"
app = apps[0]
assert app.get("name") == "RobotIntelligence.bot Buyer Radar"
assert app.get("url") == "https://robotintelligence.bot/buyer-radar.html"
assert "heuristic" in app.get("description", "").lower()
features = " ".join(app.get("featureList", []))
for feature in ("public GitHub", "Hacker News", "source-linked", "human-reviewed"):
    assert feature.lower() in features.lower(), f"Missing WebApplication feature: {feature}"

assert re.search(r'<a\b[^>]*href=["\']buyer-radar\.html["\']', AGENT, re.I), "Agent Console must link to Buyer Radar"
assert "test_buyer_radar_static_content.py" in WORKFLOW, "Static overview regression test must run in CI"
assert re.search(r'<meta\s+name=["\']robots["\']\s+content=["\'][^"\']*index', HTML, re.I), "Buyer Radar must remain indexable"

print("PASS: Buyer Radar static overview, internal discovery links and WebApplication metadata")
