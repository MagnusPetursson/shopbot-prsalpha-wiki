"""Print the static wiki with an explicitly controlled browser lifecycle."""
from pathlib import Path
import os, shutil, sys
from playwright.sync_api import sync_playwright
chrome=shutil.which(os.environ.get('CHROME','chromium'))
if not chrome: raise SystemExit('Set CHROME to an installed Chromium/Chrome executable.')
with sync_playwright() as pw:
    browser=pw.chromium.launch(executable_path=chrome,headless=True,args=['--no-sandbox','--disable-gpu'])
    try:
        page=browser.new_page(java_script_enabled=False)
        page.goto(Path(sys.argv[1]).resolve().as_uri(),wait_until='load',timeout=30000)
        page.evaluate('document.fonts.ready')
        page.evaluate("document.querySelectorAll('details').forEach(d=>d.open=true)")
        page.pdf(path=str(Path(sys.argv[2]).resolve()),print_background=True,prefer_css_page_size=True)
    finally: browser.close()
print('Printed full wiki PDF.')
