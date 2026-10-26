"""Static/PDF and initial live service geometry must be identical."""
from pathlib import Path
from playwright.sync_api import sync_playwright
import json
root=Path(__file__).resolve().parents[2]
chrome=Path.home()/'.cache/ms-playwright/chromium_headless_shell-1248/chrome-headless-shell-linux64/chrome-headless-shell'
names=['hose.foot','hose.boom','xchain','ychain'];result=[]
with sync_playwright() as pw:
    browser=pw.chromium.launch(executable_path=str(chrome),args=['--no-sandbox'])
    for suffix in ['', '-light']:
        path=(root/'generator/figures/shopbot'/f'shopbot{suffix}.html').as_uri()
        static=browser.new_page(java_script_enabled=False);static.goto(path)
        markup={name:static.locator(f'[data-part="{name}-live"]').inner_html() for name in names}
        for name,svg in markup.items():
            assert '<path' in svg, f'{name}: missing static service route; PDF/no-JS drawing is disconnected'
        live=browser.new_page();live.goto(path);live.wait_for_timeout(300)
        for name,svg in markup.items():
            actual=live.locator(f'[data-part="{name}-live"]').inner_html()
            assert actual==svg, f'{name}: initial live route differs from static/PDF route'
            result.append({'theme':suffix or 'dark','route':name,'static_matches_live':True})
        static.close();live.close()
    browser.close()
(root/'qa/geometry-audit/static-services.json').write_text(json.dumps(result,indent=2))
print('Static services: 8 route/theme checks passed; PDF geometry matches initial live SVG.')
