"""Refresh the handbook's operator still from the current local WebGL build."""
from pathlib import Path
from playwright.sync_api import sync_playwright

root=Path(__file__).resolve().parents[2]
chrome=Path.home()/'.cache/ms-playwright/chromium_headless_shell-1248/chrome-headless-shell-linux64/chrome-headless-shell'
out=root/'generator/figures/shopbot/print-assets/operator.jpg'
with sync_playwright() as pw:
    browser=pw.chromium.launch(executable_path=str(chrome),headless=True,args=['--no-sandbox','--enable-unsafe-swiftshader'])
    page=browser.new_page(viewport={'width':1440,'height':1000},device_scale_factor=1)
    errors=[]; page.on('pageerror',lambda e:errors.append(str(e)))
    page.goto((root/'webgl.html').as_uri()); page.wait_for_function('!!window.__gl')
    page.evaluate('__gl.setView("operator")'); page.wait_for_timeout(3000)
    state=page.evaluate('__gl.inspect()')
    assert state['fault'] is None and state['clock']==0 and state['glError']==0 and not errors
    page.locator('canvas').screenshot(path=str(out),type='jpeg',quality=94)
    browser.close()
print('Refreshed',out)
