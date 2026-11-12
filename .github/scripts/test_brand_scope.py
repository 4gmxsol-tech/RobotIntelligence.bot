from pathlib import Path
import re

html = Path("index.html").read_text(encoding="utf-8")

# Keep the RobotIntelligence acquisition page focused on its own brand.
discord_ctas = re.findall(
    r'<a\b[^>]*href=["\']https://discord\.gg/[^"\']+["\'][^>]*>[\s\S]*?</a>',
    html,
    re.I,
)
assert not discord_ctas, "Unrelated Discord CTA must not appear on the RobotIntelligence landing page"
assert "Discord · Domainzax" not in html, "Domainzax Discord label must not appear on the acquisition page"

# Preserve legitimate portfolio and acquisition paths.
assert "https://Domainzax.com" in html, "Relevant portfolio links must remain available"
assert "mailto:sales@Domainzax.com" in html, "Acquisition contact must remain available"
assert 'href="#contact"' in html, "Primary acquisition CTA must remain available"
assert "Request acquisition terms" in html, "Acquisition CTA label must remain available"

print("RobotIntelligence acquisition brand-scope checks passed.")
