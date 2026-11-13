#!/usr/bin/env python3
"""Keep Agent Console provider and contact-channel claims aligned with its browser implementation."""
from pathlib import Path
import re

ROOT = Path(__file__).resolve().parents[2]
html = (ROOT / "agent.html").read_text(encoding="utf-8")
runtime = (ROOT / "agent-runtime.js").read_text(encoding="utf-8")

stack = re.search(r'<div class="provider-stack" id="providerStack">(.*?)</div>', html, re.S)
assert stack, "Agent Console must expose its active source adapters."
providers = stack.group(1)
assert "GITHUB API" in providers, "GitHub public repository search must remain listed."
assert "HACKER NEWS API" in providers, "Hacker News via Algolia must remain listed."
assert "GDELT" not in providers, "Do not advertise an inactive GDELT provider."
assert "OPENAI VERIFICATION" not in providers, "Do not advertise an inactive OpenAI verification provider."
assert "ACTIVE SOURCE ADAPTERS" in providers, "The provider heading must distinguish active adapters from planned integrations."

assert "No GDELT or OpenAI verification provider is connected." in html
assert "CHANNEL SUGGESTIONS · UNVERIFIED" in html
assert "confirm each destination before outreach" in html
assert "CONTACT DISCOVERY" not in html

assert "CANDIDATES WITH SUGGESTED LINKS" in runtime
assert "CONTACTABLE OPPORTUNITIES" not in runtime
assert "SUGGESTED CHANNELS · VERIFY BEFORE USE" in runtime
assert "CONTACT CHANNELS</span>" not in runtime
assert "Suggested route (verify):" in runtime

# The actual browser adapters must remain limited to the documented public sources.
assert 'https://api.github.com/search/repositories?' in runtime
assert 'https://hn.algolia.com/api/v1/search?' in runtime

print("Agent Console active-provider and unverified-contact disclosure checks: PASS")
