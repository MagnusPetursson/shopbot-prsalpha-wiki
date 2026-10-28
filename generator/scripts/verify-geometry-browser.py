"""Publication/browser evidence for the geometry-only correction."""
from pathlib import Path
import argparse, hashlib, json, subprocess
from html.parser import HTMLParser
from playwright.sync_api import sync_playwright

parser = argparse.ArgumentParser()
parser.add_argument('--root', default='.')
parser.add_argument('--out', default='qa/geometry-audit')
a = parser.parse_args()
root = Path(a.root).resolve(); out = Path(a.out).resolve(); out.mkdir(parents=True, exist_ok=True)
chrome = Path.home()/'.cache/ms-playwright/chromium_headless_shell-1248/chrome-headless-shell-linux64/chrome-headless-shell'

class Reader(HTMLParser):
    def __init__(self, text):
        super().__init__(); self.skip = 0; self.words = []; self.feed(text)
    def handle_starttag(self, tag, attrs):
        if tag in ('script','style'): self.skip += 1
        if not self.skip:
            self.words += [v for k,v in attrs if k in ('alt','title','aria-label') and v]
    def handle_endtag(self, tag):
        if tag in ('script','style'): self.skip -= 1
    def handle_data(self, data):
        if not self.skip: self.words.append(data)
    def value(self): return ' '.join(' '.join(self.words).split())

# Reader-text guard: geometry-only work must not change reader text. The baseline is the last
# approved copy revision (qa/READER_BASELINE); 23d731b before the copy pass.
BASELINE = (lambda f: f.read_text().strip() if f.exists() else '23d731b')(Path(__file__).resolve().parents[2]/'qa/READER_BASELINE')
pages = ['index','rules','machine','run','zero','preflight','trouble','feeds','maintain','quiz','webgl']
voice = []
for theme in ['', 'light']:
    for name in pages:
        rel = (Path(theme)/(name+'.html')).as_posix()
        before = subprocess.check_output(['git','show',BASELINE+':'+rel], text=True)
        now = (root/rel).read_text()
        assert Reader(before).value() == Reader(now).value(), 'Reader text changed: '+rel
        voice.append(rel)

result = {'reader_text_unchanged':voice, 'pages':[], 'webgl':[], 'fallback':[]}
with sync_playwright() as pw:
    browser = pw.chromium.launch(executable_path=str(chrome), headless=True, args=['--no-sandbox','--enable-unsafe-swiftshader'])
    for theme in ['', 'light']:
        for width,height in [(1440,1000),(390,844),(320,740)]:
            page = browser.new_page(viewport={'width':width,'height':height}, device_scale_factor=1)
            errors=[]; page.on('pageerror',lambda e: errors.append(str(e)))
            for name in pages:
                page.goto((root/theme/(name+'.html')).as_uri(),wait_until='load')
                page.evaluate('document.fonts.ready')
                overflow = page.evaluate('Math.max(0,document.documentElement.scrollWidth-innerWidth)')
                result['pages'].append({'page':str(Path(theme)/(name+'.html')),'width':width,'overflow':overflow,'errors':errors[:]})
                assert not errors, (theme,name,width,errors)
                assert overflow <= 1, (theme,name,width,'overflow',overflow)
            page.close()
        page=browser.new_page(viewport={'width':1440,'height':1080},device_scale_factor=1)
        errors=[]; page.on('pageerror',lambda e: errors.append(str(e)))
        page.goto((root/theme/'webgl.html').as_uri()); page.wait_for_function('!!window.__gl'); page.wait_for_timeout(400)
        assert page.evaluate('__gl.inspect().glError') == 0
        for name,v in [
            ('whole',{'az':46,'el':26,'dist':940,'target':[190,160,125]}),
            ('collector',{'az':46,'el':22,'dist':365,'target':[-40,275,130]}),
            ('services',{'az':46,'el':30,'dist':325,'target':[235,150,142]}),
            ('cart',{'az':40,'el':22,'dist':215,'target':[466,130,60]})]:
            page.evaluate('(v)=>__gl.setView(v)',v); page.wait_for_timeout(160)
            page.screenshot(path=str(out/f'webgl-{theme or "dark"}-{name}.png'),full_page=True)
            state=page.evaluate('__gl.inspect()'); assert state['glError']==0
            result['webgl'].append({'theme':theme or 'dark','view':name,'state':state,'errors':errors[:]})
        # Exercise real fault controls with held timelines, not invented render data.
        scenarios = json.loads(subprocess.check_output(['node','--input-type=module','-e',"import {FAULT_STAGES} from './generator/figures/shopbot/machine.mjs'; console.log(JSON.stringify(Object.entries(FAULT_STAGES).map(([id,s])=>({id,beats:s.beats.length}))))"],text=True,cwd=root))
        for scenario in scenarios:
            fault = scenario['id']
            for beat in range(scenario['beats']):
                page.evaluate('([id,beat])=>__gl.playFault(id,beat,0.6)',[fault,beat])
                page.wait_for_timeout(180)
                state=page.evaluate('__gl.inspect()')
                result['webgl'].append({'theme':theme or 'dark','requested_fault':fault,'requested_beat':beat,'state':state})
                assert state['glError']==0 and state['fault']==fault and state['beat']==beat,(fault,beat,state)
                assert state['caption'],(fault,beat,'missing caption')
        page.evaluate('__gl.clearFault()')
        page.locator('[data-tab="job"]').click()
        page.locator('[data-run]').click()
        start = page.evaluate('__gl.inspect().clock')
        page.wait_for_timeout(600)
        finish = page.evaluate('__gl.inspect().clock')
        assert finish > start, ('live job did not advance',start,finish)
        page.locator('[data-run]').click()
        result['webgl'].append({'theme':theme or 'dark','live_job_clock_start':start,'live_job_clock_finish':finish})
        assert not errors,errors
        page.close()
        page=browser.new_page(viewport={'width':390,'height':844},reduced_motion='reduce')
        page.goto((root/theme/'webgl.html').as_uri()); page.wait_for_function('!!window.__gl')
        assert page.evaluate('__gl.inspect().glError')==0
        page.screenshot(path=str(out/f'webgl-{theme or "dark"}-phone.png'),full_page=True); page.close()
        page=browser.new_page(java_script_enabled=False,viewport={'width':390,'height':844})
        # The publication's machine page embeds WebGL; it has no no-JS model
        # fallback (pre-existing, outside this geometry lane). Its teaching text
        # remains readable. The standalone generator SVG is the static geometry
        # used by the print/wiki path, and must render with scripts disabled.
        page.goto((root/theme/'machine.html').as_uri())
        assert page.locator('h1').count()==1
        suffix = '-light' if theme else ''
        page.goto((root/'generator/figures/shopbot'/f'shopbot{suffix}.html').as_uri())
        assert page.locator('.sb-stage svg').count()>0, 'No static SVG figure'
        clipped = page.evaluate('''Array.from(document.querySelectorAll('.sb-stage .it')).map(e=>{const b=e.getBBox(),v=e.ownerSVGElement.viewBox.baseVal;return {name:e.dataset.name,x:b.x,y:b.y,right:b.x+b.width,bottom:b.y+b.height,width:v.width,height:v.height}}).filter(b=>b.x<0||b.y<0||b.right>b.width||b.bottom>b.height)''')
        assert not clipped, ('Static geometry cropped',clipped)
        page.screenshot(path=str(out/f'fallback-{theme or "dark"}-phone.png'),full_page=True)
        result['fallback'].append({'theme':theme or 'dark','svg_count':page.locator('.sb-stage svg').count(),'source':'generator SVG; not a no-JS WebGL fallback'});page.close()
    browser.close()
(out/'publication-browser.json').write_text(json.dumps(result,indent=2))
print(json.dumps({'reader_pages_unchanged':len(voice),'responsive_page_checks':len(result['pages']),'webgl_checks':len(result['webgl']),'fallbacks':len(result['fallback']),'status':'PASS'},indent=2))
