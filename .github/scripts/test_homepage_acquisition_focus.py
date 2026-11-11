from pathlib import Path
import re

html = Path("index.html").read_text(encoding="utf-8")

assert "discord.gg/ewUr2dmt" not in html, "Unrelated fixed Discord overlay must not compete with the acquisition CTA."
assert "Discord · Domainzax" not in html, "Homepage must not render the unrelated fixed Discord label."
assert re.search(r'<a\b[^>]*href="#contact"[^>]*>Inquire to acquire', html, re.I), "Primary acquisition CTA must remain visible."
assert 'mailto:sales@Domainzax.com?subject=RobotIntelligence.bot%20Acquisition%20Inquiry' in html, "Acquisition email CTA must remain intact."
assert html.count('href="buyer-radar.html"') >= 2, "Buyer Radar navigation and hero entry points must remain intact."
assert "https://Domainzax.com" in html, "Seller portfolio links must remain available."
assert '<section id="contact"' in html, "Acquisition contact section must remain intact."

print("Homepage acquisition focus and CTA integrity: PASS")
