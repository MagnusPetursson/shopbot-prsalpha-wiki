// Rebuild the complete static publication. No npm dependencies.
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync, readdirSync, cpSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
const ROOT = dirname(fileURLToPath(import.meta.url));
const FIG = join(ROOT, 'generator/figures/shopbot');
const chrome = process.env.CHROME || 'chromium';
const run = (name, args = []) => execFileSync(process.execPath, [join(FIG, name), ...args], {cwd: ROOT, stdio:'inherit'});
const fonts = join(FIG, 'print-assets/fonts');
const fontCss = readFileSync(join(fonts,'fonts.css'),'utf8').replace(/url\(([^)]+\.woff2)\)/g, (_, f) => `url(data:font/woff2;base64,${readFileSync(join(fonts,f)).toString('base64')})`);
const offlineFonts = html => html.replace(/<link\b[^>]*href="https:\/\/fonts\.(?:googleapis|gstatic)\.com[^>]*>/g, '').replace('</head>', `<style>${fontCss}</style></head>`);
for (const theme of ['dark','light']) {
  const args=theme==='light'?['--light']:[];
  run('build.mjs',args); run('site.mjs',args); run('wiki.mjs',args);
  const out=theme==='light'?join(ROOT,'light'):ROOT;
  mkdirSync(out,{recursive:true});
  const dir=join(FIG,theme==='light'?'site-light':'site');
  for (const f of readdirSync(dir).filter(f=>f.endsWith('.html'))) writeFileSync(join(out,f),offlineFonts(readFileSync(join(dir,f),'utf8')));
}
run('handbook.mjs');
run('wiki.mjs', ['--light', '--print']);
cpSync(join(FIG,'shopbot-handbook.pdf'),join(ROOT,'shopbot-handbook.pdf'));
const wiki=join(FIG,'shopbot-wiki-light.html');
// Printing needs the static figure and open answers, not the live animation loop.
writeFileSync(wiki,offlineFonts(readFileSync(wiki,'utf8')).replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi,'').replace(/<details(?![^>]*\sopen)/g,'<details open'));
// Use an explicit browser print operation, not Chrome's virtual-time CLI lifecycle.
execFileSync(process.env.PYTHON || 'python3',[join(ROOT,'generator/scripts/print-wiki.py'),wiki,join(ROOT,'shopbot-wiki.pdf')],{stdio:'inherit',env:{...process.env,CHROME:chrome},timeout:90000});
writeFileSync(join(ROOT,'.nojekyll'),'');
console.log('Built dark root, light/, student handbook and full wiki PDFs.');
