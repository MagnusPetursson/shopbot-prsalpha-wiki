"""Interface-copy regression: fails on long control labels and slogan-style headings.

Rule: buttons, tabs and acting links are a verb or verb + object, at most 3 words. Headings,
step titles, disclosure summaries and eyebrow labels are nouns or states, never taglines.

Checked: every built page in both themes, rendered in headless Chromium at 1440x900 and 390x844
(all <details> opened; every 3D-viewer tab and one fault beat shown), plus the headings of the
two print sources (handbook.html, shopbot-wiki-light.html) when they exist after a build.

Documented allowances (not counted as control labels):
- 3D-viewer fault selectors ([data-fault]) are list items carrying an ID, the fault name and a
  one-line symptom; their fault name is checked with the heading rule instead.
- A trailing keyboard-shortcut glyph on a button ("Whole machine 0", "At the tool F") is not a word.
- Step navigation glyphs (‹ ›) are not words.
Run: .venv/bin/python generator/scripts/test-copy.py
"""
from pathlib import Path
import re, sys
from html.parser import HTMLParser
from playwright.sync_api import sync_playwright

root = Path(__file__).resolve().parents[2]
chrome = Path.home()/'.cache/ms-playwright/chromium_headless_shell-1248/chrome-headless-shell-linux64/chrome-headless-shell'
PAGES = ['index','rules','machine','run','zero','preflight','trouble','feeds','maintain','quiz','webgl']
MAX_WORDS = 3
SLOGAN = [
    (r'[?!]\s*$', 'ends with ? or !'),
    (r'\bagain\b', '"again"'),
    (r"\blet'?s\b", '"let\'s"'),
    (r"\bwe(?:'ll|'re| will)?\b", '"we" chatter'),
    (r'\bmake it\b', '"make it"'),
    (r'^(?:new here|start (?:here|with)|learn |get |discover |meet |your first|before you touch|where are you|something went wrong|what moves)', 'imperative/marketing opener'),
    (r'\b(?:the one number|that matters|the classic|in six pages|frozen|taken apart)\b', 'teaser phrase'),
]

CONTROLS_JS = r"""() => {
  const vis = el => { const r = el.getBoundingClientRect(); const s = getComputedStyle(el); return (r.width||r.height) && s.visibility!=='hidden' && s.display!=='none'; };
  const norm = t => (t||'').replace(/\s+/g,' ').trim();
  const out = [];
  for (const el of document.querySelectorAll('button,[role=button],[role=tab],a.sb-cta,input[type=button],input[type=submit]')) {
    if (!vis(el)) continue;
    if (el.matches('[data-fault]')) { const nm = el.querySelector('.sbx-fname'); const n = el.cloneNode(true); n.querySelectorAll('.sb-num').forEach(x=>x.remove()); out.push(['fault-name', norm(nm ? nm.textContent : n.textContent)]); continue; }
    if (el.matches('.sbx-saved-go')) continue; // user-named saved view
    out.push(['control', norm(el.innerText || el.value || el.getAttribute('aria-label'))]);
  }
  for (const el of document.querySelectorAll('h1,h2,h3,h4,h5,h6,summary,.sb-kicker,.sb-eyebrow,.sb-step-t,.sb-where-h,.sb-sym-h')) {
    if (!vis(el)) continue;
    const n = el.cloneNode(true); n.querySelectorAll('.sb-cite,.sb-key,.sb-showfault').forEach(x=>x.remove());
    out.push(['heading', norm(n.textContent)]);
  }
  return out;
}"""

def words(label):
    label = re.sub(r'[‹›→←]', ' ', label)
    label = re.sub(r'\s+(?:[0-9]|[A-Z])$', '', label.strip())   # trailing shortcut key
    return [w for w in label.split() if re.search(r'\w', w)]

def slogan(text):
    t = text.lower()
    return [why for pat, why in SLOGAN if re.search(pat, t)]

class Heads(HTMLParser):
    def __init__(self, s):
        super().__init__(); self.cur = None; self.out = []; self.skip = 0; self.feed(s)
    def handle_starttag(self, tag, attrs):
        if tag in ('script','style'): self.skip += 1
        elif re.fullmatch(r'h[1-6]', tag): self.cur = []
        elif tag == 'span' and self.cur is not None and ('class','sb-cite') in attrs: self.skip += 1
    def handle_endtag(self, tag):
        if tag in ('script','style'): self.skip -= 1
        elif tag == 'span' and self.skip and self.cur is not None: self.skip = max(0, self.skip-1)
        elif re.fullmatch(r'h[1-6]', tag) and self.cur is not None:
            self.out.append(' '.join(''.join(self.cur).split())); self.cur = None
    def handle_data(self, data):
        if self.cur is not None and not self.skip: self.cur.append(data)

fails, checked = [], set()
def check(where, kind, text):
    if not text or (kind, text) in checked: return
    checked.add((kind, text))
    if kind == 'control':
        w = words(text)
        if len(w) > MAX_WORDS: fails.append(f'{where}: control label {len(w)} words: "{text}"')
        if slogan(text): fails.append(f'{where}: control slogan ({", ".join(slogan(text))}): "{text}"')
    else:
        # self-check questions are numbered quiz items, not headings; none are in h/summary today
        why = slogan(text)
        if why: fails.append(f'{where}: {kind} ({", ".join(why)}): "{text}"')

with sync_playwright() as pw:
    b = pw.chromium.launch(executable_path=str(chrome), headless=True, args=['--no-sandbox','--enable-unsafe-swiftshader'])
    for theme in ['', 'light']:
        for vw, vh in [(1440, 900), (390, 844)]:
            pg = b.new_page(viewport={'width': vw, 'height': vh})
            for name in PAGES:
                where = f'{theme + "/" if theme else ""}{name}.html@{vw}'
                pg.goto((root/theme/(name+'.html')).as_uri(), wait_until='load')
                pg.evaluate("document.querySelectorAll('details').forEach(d=>d.open=true)")
                states = [pg.evaluate(CONTROLS_JS)]
                if name == 'webgl':
                    pg.wait_for_function('!!window.__gl', timeout=15000)
                    for tab in pg.query_selector_all('[role=tab]'):
                        tab.evaluate('e=>e.click()'); pg.wait_for_timeout(120); states.append(pg.evaluate(CONTROLS_JS))
                    pg.eval_on_selector('[role=tab][data-tab=faults]', 'e=>e.click()')
                    pg.eval_on_selector('[data-fault=alpha]', 'e=>e.click()'); pg.wait_for_timeout(700)
                    states.append(pg.evaluate(CONTROLS_JS))
                for st in states:
                    for kind, text in st: check(where, kind, text)
            pg.close()
    b.close()

for f in ['generator/figures/shopbot/handbook.html', 'generator/figures/shopbot/shopbot-wiki-light.html']:
    p = root/f
    if p.exists():
        for h in Heads(p.read_text()).out: check(Path(f).name, 'print heading', h)

n_controls = sum(1 for k, _ in checked if k == 'control')
n_heads = len(checked) - n_controls
if fails:
    print('\n'.join(fails)); print(f'copy check FAILED: {len(fails)} issue(s) in {n_controls} control labels and {n_heads} headings'); sys.exit(1)
print(f'copy check passed: {n_controls} distinct control labels <= {MAX_WORDS} words, {n_heads} distinct headings without slogan patterns')
