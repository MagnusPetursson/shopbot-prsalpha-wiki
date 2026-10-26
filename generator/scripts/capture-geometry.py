"""Deterministic local geometry evidence; no external browser dependencies."""
from pathlib import Path
import argparse, json
from playwright.sync_api import sync_playwright

p = argparse.ArgumentParser()
p.add_argument('--label', required=True)
p.add_argument('--root', default='generator/figures/shopbot')
p.add_argument('--out', default='qa/geometry-audit')
a = p.parse_args()
chrome = Path.home()/'.cache/ms-playwright/chromium_headless_shell-1248/chrome-headless-shell-linux64/chrome-headless-shell'
out = Path(a.out); out.mkdir(parents=True, exist_ok=True)
results = []
with sync_playwright() as pw:
    browser = pw.chromium.launch(executable_path=str(chrome), headless=True, args=['--no-sandbox','--enable-unsafe-swiftshader'])
    for theme in ['dark','light']:
        for width, height, kind in [(1440,1000,'desktop'),(390,844,'phone')]:
            page = browser.new_page(viewport={'width':width,'height':height}, device_scale_factor=1)
            errors = []
            page.on('pageerror', lambda err: errors.append(str(err)))
            suffix = '-light' if theme == 'light' else ''
            url = (Path(a.root)/f'shopbot{suffix}.html').resolve().as_uri()
            page.goto(url); page.evaluate('document.fonts.ready'); page.wait_for_timeout(800)
            page.screenshot(path=str(out/f'{a.label}-{theme}-{kind}.png'), full_page=True)
            results.append({'theme':theme,'kind':kind,'errors':errors})
            page.close()
    browser.close()
(out/f'{a.label}-browser.json').write_text(json.dumps(results,indent=2))
print(json.dumps(results))
