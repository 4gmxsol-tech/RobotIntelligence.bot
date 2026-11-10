from pathlib import Path
import re

html = Path("index.html").read_text(encoding="utf-8")

button = re.search(r'<button\\b(?=[^>]*class="[^"]*mobile-menu-toggle[^"]*")([^>]*)>(.*?)</button>', html, re.I | re.S)
assert button, "Mobile navigation toggle button is missing"
attrs = button.group(1)
assert re.search(r'aria-expanded="false"', attrs), "Mobile menu must start collapsed"
assert re.search(r'aria-controls="primary-nav"', attrs), "Toggle must reference the primary nav"
assert re.search(r'aria-label="Open navigation"', attrs), "Collapsed toggle needs an accessible name"
assert 'class="menu-label">Menu</span>' in button.group(2), "Visible menu label is missing"

nav = re.search(r'<nav\\b(?=[^>]*id="primary-nav")([^>]*)>(.*?)</nav>', html, re.I | re.S)
assert nav, "Primary navigation landmark is missing"
assert 'aria-label="Primary navigation"' in nav.group(1), "Primary nav needs an accessible label"
for href in ("#positioning", "buyer-radar.html", "#uses", "#why", "#portfolio", "#contact"):
    assert re.search(r'href="' + re.escape(href) + r'"', nav.group(2)), f"Primary nav link missing: {href}"

assert "@media(max-width:850px)" in html, "Mobile breakpoint is missing"
assert ".mobile-menu-toggle{display:inline-flex}" in html, "Mobile toggle is not displayed at the mobile breakpoint"
assert ".navlinks.is-open{display:flex}" in html, "Expanded mobile menu state is not styled"
assert "event.key==='Escape'" in html, "Escape key close behavior is missing"
assert "navLinks.addEventListener('click'" in html, "Menu must close after a navigation link is selected"
assert "menuButton.setAttribute('aria-expanded',String(open))" in html, "Expanded state must stay synchronized"
assert "@media(prefers-reduced-motion:reduce)" in html, "Existing reduced-motion support must be preserved"

print("Mobile navigation accessibility checks passed.")
