"""Capture every rendered user-visible string (and optional screenshots) from the built site.

Usage: copy-capture.py --out copy-audit/rendered-before.csv [--shots copy-audit/screens/before]
Reads the dark root and light/ builds with headless Chromium at 1440x900 and 390x844, opens every
<details>, toggles the 3D viewer's panels, and records (page, viewport, kind, text) rows.
"""
from pathlib import Path
import argparse, csv
from playwright.sync_api import sync_playwright

ap = argparse.ArgumentParser()
ap.add_argument('--root', default='.')
ap.add_argument('--out', required=True)
ap.add_argument('--shots')
a = ap.parse_args()
root = Path(a.root).resolve()
chrome = Path.home()/'.cache/ms-playwright/chromium_headless_shell-1248/chrome-headless-shell-linux64/chrome-headless-shell'
PAGES = ['index','rules','machine','run','zero','preflight','trouble','feeds','maintain','quiz','webgl']
SHOTS = ['index','rules','run','zero','preflight','trouble','feeds','webgl','machine']

# Each visible element is classified once; text is its own normalised textContent.
JS = r"""() => {
  const rows = [], seen = new Set();
  const vis = el => { const r = el.getBoundingClientRect(); const s = getComputedStyle(el);
    return (r.width > 0 || r.height > 0) && s.visibility !== 'hidden' && s.display !== 'none'; };
  const norm = t => (t || '').replace(/\s+/g, ' ').trim();
  const add = (kind, text) => { text = norm(text); if (!text) return; const k = kind + '\u0000' + text; if (seen.has(k)) return; seen.add(k); rows.push([kind, text]); };
  add('title', document.title);
  const md = document.querySelector('meta[name=description]'); if (md) add('meta-description', md.content);
  const kinds = [
    ['button', 'button,[role=button],input[type=button],input[type=submit]'],
    ['tab', '[role=tab]'],
    ['summary', 'summary'],
    ['heading', 'h1,h2,h3,h4,h5,h6'],
    ['nav-link', 'nav a,.sb-mast a'],
    ['link', 'a'],
    ['label', 'label,legend,th,.lab,.sb-kicker,.sb-eyebrow,.sb-step-t,.sb-phase-h,.what,.sb-where-h'],
    ['figcaption', 'figcaption,caption'],
    ['helper', 'p,li,dd,td,blockquote,.sb-lead,.sb-panel-sub'],
  ];
  const claimed = new Set();
  for (const [kind, sel] of kinds) for (const el of document.querySelectorAll(sel)) {
    if (claimed.has(el) || !vis(el)) continue; claimed.add(el);
    if (kind === 'helper' && el.closest('button,summary,a,h1,h2,h3,h4,h5,h6')) continue;
    add(kind, el.innerText || el.textContent);
  }
  for (const el of document.querySelectorAll('[aria-label]')) add('aria-label', el.getAttribute('aria-label'));
  for (const el of document.querySelectorAll('[title]:not(title)')) add('tooltip', el.getAttribute('title'));
  for (const el of document.querySelectorAll('img[alt],svg[aria-label]')) add('alt', el.getAttribute('alt') || el.getAttribute('aria-label'));
  for (const el of document.querySelectorAll('[placeholder]')) add('placeholder', el.getAttribute('placeholder'));
  for (const el of document.querySelectorAll('svg text')) if (vis(el)) add('figure-label', el.textContent);
  return rows;
}"""

rows = []
shots = Path(a.shots) if a.shots else None
if shots: shots.mkdir(parents=True, exist_ok=True)
with sync_playwright() as pw:
    b = pw.chromium.launch(executable_path=str(chrome), headless=True, args=['--no-sandbox','--enable-unsafe-swiftshader'])
    for theme in ['', 'light']:
        for vw, vh in [(1440, 900), (390, 844)]:
            pg = b.new_page(viewport={'width': vw, 'height': vh}, device_scale_factor=1)
            for name in PAGES:
                pg.goto((root/theme/(name+'.html')).as_uri(), wait_until='load')
                pg.evaluate('document.fonts.ready')
                if name == 'webgl':
                    try: pg.wait_for_function('!!window.__gl', timeout=8000)
                    except Exception: pass
                    pg.wait_for_timeout(600)
                if shots and not theme and name in SHOTS:
                    pg.screenshot(path=str(shots/f'{name}-{vw}.png'))
                pg.evaluate("document.querySelectorAll('details').forEach(d=>d.open=true)")
                found = pg.evaluate(JS)
                if name == 'webgl':
                    # reveal each side panel in turn so runtime-built panel copy is captured
                    for tab in pg.query_selector_all('.sbx-tabs button,[role=tab],[data-tab]'):
                        try: tab.evaluate('e=>e.click()'); pg.wait_for_timeout(150); found += pg.evaluate(JS)
                        except Exception: pass
                    # one fault beat, so the step caption/controls copy is captured too
                    try:
                        pg.eval_on_selector('[role=tab][data-tab=faults]','e=>e.click()'); pg.evaluate("document.querySelectorAll('details').forEach(d=>d.open=false)")
                        pg.eval_on_selector('[data-fault=alpha]','e=>e.click()'); pg.wait_for_timeout(900); found += pg.evaluate(JS)
                        if shots and not theme: pg.screenshot(path=str(shots/f'webgl-fault-{vw}.png'))
                        pg.eval_on_selector('[data-beat-close]','e=>e.click()')
                    except Exception: pass
                for kind, text in found:
                    rows.append([(theme + '/' if theme else '') + name + '.html', f'{vw}x{vh}', kind, text])
            pg.close()
    b.close()
# de-duplicate across viewports/themes but keep where each first appears
out, seen = [], set()
for r in rows:
    k = (r[0].replace('light/', ''), r[2], r[3])
    if k in seen: continue
    seen.add(k); out.append(r)
Path(a.out).parent.mkdir(parents=True, exist_ok=True)
with open(a.out, 'w', newline='') as f:
    w = csv.writer(f); w.writerow(['location', 'viewport', 'kind', 'text']); w.writerows(out)
print(len(out), 'rendered strings ->', a.out)
