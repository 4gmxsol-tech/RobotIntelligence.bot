from pathlib import Path
import re

pages = {
    "buyer-radar.html": (
        "Buyer Radar navigation",
        ("index.html", "#opportunities", "#triggers", "#evidence", "#scoring-methodology", "agent.html"),
    ),
    "agent.html": (
        "Agent Console navigation",
        ("index.html", "buyer-radar.html", "agent.html"),
    ),
}

for filename, (label, expected_links) in pages.items():
    html = Path(filename).read_text(encoding="utf-8")
    button = re.search(
        r'<button\b(?=[^>]*class="[^"]*mobile-menu-toggle[^"]*")([^>]*)>(.*?)</button>',
        html,
        re.I | re.S,
    )
    assert button, f"{label}: mobile menu toggle is missing"
    attrs, body = button.groups()
    assert 'aria-expanded="false"' in attrs, f"{label}: menu must start collapsed"
    assert 'aria-controls="primary-nav"' in attrs, f"{label}: toggle must control primary-nav"
    assert 'aria-label="Open navigation"' in attrs, f"{label}: collapsed toggle needs an accessible name"
    assert 'class="menu-label">Menu</span>' in body, f"{label}: visible Menu label is missing"

    nav = re.search(
        r'<nav\b(?=[^>]*id="primary-nav")([^>]*)>(.*?)</nav>',
        html,
        re.I | re.S,
    )
    assert nav, f"{label}: primary navigation landmark is missing"
    nav_attrs, nav_body = nav.groups()
    assert 'aria-label="Primary navigation"' in nav_attrs, f"{label}: primary nav needs an accessible label"
    for href in expected_links:
        assert re.search(r'href="' + re.escape(href) + r'"', nav_body), f"{label}: navigation link missing: {href}"

    assert 'href="mobile-nav.css"' in html, f"{label}: shared mobile navigation CSS is not loaded"
    assert 'src="mobile-nav.js"' in html, f"{label}: shared mobile navigation script is not loaded"

css = Path("mobile-nav.css").read_text(encoding="utf-8")
assert "@media(max-width:800px)" in css, "Mobile breakpoint is missing"
assert ".mobile-menu-toggle{display:inline-flex" in css, "Mobile toggle is not displayed"
assert ".product-nav{display:none" in css, "Mobile nav must start collapsed"
assert ".product-nav.is-open{display:flex}" in css, "Expanded mobile menu state is not styled"
assert ":focus-visible" in css, "Keyboard focus indicator is missing"

js = Path("mobile-nav.js").read_text(encoding="utf-8")
assert 'event.key === "Escape"' in js, "Escape key close behavior is missing"
assert 'nav.addEventListener("click"' in js, "Menu must close after a navigation link is selected"
assert 'button.setAttribute("aria-expanded", String(open))' in js, "Expanded state must stay synchronized"
assert "button.focus()" in js, "Focus must return to the menu toggle after Escape"
print("Buyer Radar and Agent Console mobile navigation checks passed.")
