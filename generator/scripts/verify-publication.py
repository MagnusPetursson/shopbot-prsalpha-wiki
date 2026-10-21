#!/usr/bin/env python3
"""Verify the checked-in student publication (standard library + Poppler).

Run after the README rebuild. An optional directory argument checks a downloaded
copy of the public site without requiring generator sources.
"""
import json
import re
import subprocess
import sys
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import unquote, urlsplit

ROOT = Path(sys.argv[1] if len(sys.argv) > 1 else Path(__file__).resolve().parents[2]).resolve()
PAGES = ('index', 'rules', 'machine', 'run', 'zero', 'preflight', 'trouble', 'feeds', 'maintain', 'quiz', 'webgl')


class Page(HTMLParser):
    def __init__(self, path):
        super().__init__(convert_charrefs=True)
        self.ids, self.refs, self.words = set(), [], []
        self.ignore = 0
        self.h1 = 0
        self.feed(path.read_text())

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if tag in ('script', 'style'):
            self.ignore += 1
        if tag == 'h1':
            self.h1 += 1
        if attrs.get('id'):
            self.ids.add(attrs['id'])
        for key in ('href', 'src'):
            if attrs.get(key):
                self.refs.append(attrs[key])
        for key in ('alt', 'aria-label', 'title'):
            if attrs.get(key):
                self.words.append(attrs[key])

    def handle_endtag(self, tag):
        if tag in ('script', 'style'):
            self.ignore -= 1

    def handle_data(self, data):
        if not self.ignore:
            self.words.append(data)

    @property
    def text(self):
        return re.sub(r'\s+', ' ', ' '.join(self.words))


def run(*args):
    return subprocess.check_output(args, text=True)


def main():
    paths = [ROOT / theme / (name + '.html') for theme in ('', 'light') for name in PAGES]
    assert all(p.is_file() for p in paths), 'Missing expected page'
    pages = {p: Page(p) for p in paths}
    assert len(pages) == 22
    links = 0
    banned = re.compile(r'For the instructor|instructor questions|I\d\d\s*[·:]|Q\d\d\s*[·:]|LAB PRACTICE|not yet identified|standard ER25 nut supplied|instructor-confirmed|canonical sequence|no machine log|key currently stays|Shutdown order', re.I)
    for path, page in pages.items():
        assert not banned.search(page.text), (path, 'process residue')
        assert 'instructor' not in page.ids, (path, 'old tracker anchor')
        assert page.h1 == 1, (path, 'expected one h1')
        for ref in page.refs:
            url = urlsplit(ref)
            if url.scheme or url.netloc:
                continue
            target = (path.parent / unquote(url.path)).resolve() if url.path else path
            if target.is_dir():
                target /= 'index.html'
            assert target.is_relative_to(ROOT), (path, 'link escapes publication', ref)
            assert target.exists(), (path, 'missing local target', ref)
            # Viewer state hashes are not document fragment IDs.
            if url.fragment and target.suffix == '.html' and '=' not in url.fragment:
                assert unquote(url.fragment) in pages[target].ids, (path, 'missing fragment', ref)
            links += 1
        if path.stem in ('run', 'rules', 'preflight', 'quiz'):
            assert 'never power down' in page.text.lower(), (path, 'missing end-of-job rule')
            assert re.search(r'key (?:OFF and )?(?:removed|out)|key (?:is )?OFF and (?:removed|in your pocket)', page.text, re.I), (path, 'missing key-out rule')
    for name in ('run', 'zero'):
        text = pages[ROOT / (name + '.html')].text
        assert 'input 1' in text.lower() and 'do not run C2' in text, (name, 'missing failed-contact action')
    pdf_results = []
    for name in ('shopbot-handbook.pdf', 'shopbot-wiki.pdf'):
        pdf = ROOT / name
        raw = run('pdftotext', '-raw', str(pdf), '-')
        text = re.sub(r'\s+', ' ', raw)
        assert not banned.search(text), (name, 'process residue')
        assert 'never power down' in text.lower(), (name, 'missing end-of-job rule')
        assert 'A spacebar stop is not isolation' in text, (name, 'missing isolation rule')
        assert 'ER25' in text and 'matching nut' in text, (name, 'missing collet guidance')
        assert not re.search(r'Press Run|Press any numbered fault|ShopBot-PRSalpha-144-60-3D-webgl\.html|instructor.*open questions', text, re.I), (name, 'interactive/draft print text')
        info = run('pdfinfo', str(pdf))
        page_match = re.search(r'^Pages:\s+(\d+)', info, re.M)
        assert page_match, (name, 'missing PDF page count')
        count = int(page_match[1])
        fonts = run('pdffonts', str(pdf)).splitlines()[2:]
        assert fonts and all(re.search(r'\byes\s+(?:yes|no)\s+(?:yes|no)\s+\d+\s+\d+\s*$', row) for row in fonts), (name, 'unembedded font')
        pdf_results.append({'file': name, 'pages': count, 'fonts_embedded': True})
    generator = ROOT / 'generator/figures/shopbot'
    if generator.is_dir():
        code = "import {FAULTS} from './generator/figures/shopbot/machine.mjs'; import {FAULTS_DOC} from './generator/figures/shopbot/prose.mjs'; if (FAULTS.length!==10 || FAULTS_DOC.length!==39) throw Error('fault count'); for (const f of FAULTS) { const doc=FAULTS_DOC.find(d=>d[0]==='E'+f.e); if(!doc || doc[1]!==f.key) throw Error('fault ID '+f.id); } console.log('10 viewer faults match the 39-entry reference');"
        subprocess.run(['node', '--input-type=module', '-e', code], cwd=ROOT, check=True)
        assert not (ROOT / 'generator/research/instructor-questions-audit.json').exists(), 'Public staff ledger remains'
    print(json.dumps({'html_pages': len(pages), 'local_links_checked': links, 'pdfs': pdf_results, 'publication_checks': 'PASS'}, indent=2))


if __name__ == '__main__':
    main()
