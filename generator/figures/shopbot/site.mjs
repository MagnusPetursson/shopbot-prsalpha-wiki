// Builds the multi-page teaching site: site/index.html + 9 pages + webgl.html, editorial layout.
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import * as k from "../../kit/iso-kit.mjs";
import { PROSE_CSS, AFTER_FIGURE, MAINTENANCE, FAULTS_DOC, SOURCES, faultsHtml } from "./prose.mjs";
import { SYMPTOMS, FEEDS, CAM, QUIZ, PREFLIGHT, CALL_STAFF, LAB_SOURCES } from "./wiki-content.mjs";
import * as V from "./visuals.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
// handbook.mjs imports this module with SB_NO_WRITE=1 to reuse page bodies and CSS without rewriting the site
const NO_WRITE = process.env.SB_NO_WRITE === "1";
export const BODIES = {};
const THEME = process.argv.includes("--light") ? "light" : "dark";
const OUT = join(HERE, THEME === "light" ? "site-light" : "site");
if (!NO_WRITE) mkdirSync(OUT, { recursive: true });
const figure = readFileSync(join(HERE, THEME === "light" ? "fragment-figure-light.html" : "fragment-figure.html"), "utf8");
const figScript = readFileSync(join(HERE, "fragment-script.js"), "utf8");
const glHtml = readFileSync(join(HERE, THEME === "light" ? "shopbot-3d-light.html" : "shopbot-3d.html"), "utf8");
const procPath = join(HERE, "..", "..", "research", "procedures.md");
const procedures = existsSync(procPath) ? readFileSync(procPath, "utf8").replace(/;:/g, ";") : "";

// --------------------------------------------------------------- markdown subset (shared with wiki.mjs)
const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const inline = (s) => esc(s).replace(/`([^`]+)`/g, "<code>$1</code>").replace(/\*\*([^*]+)\*\*/g, "<b>$1</b>").replace(/(^|[^*])\*([^*\n]+)\*/g, "$1<i>$2</i>")
  .replace(/\[((?:(?:[A-Z]{2} p\.?\s?[0-9A-Za-z–-]+|R(?::[^\]]*)?)\s*;?\s*)+)\]/g, (m, body) => '<span class="sb-cite">[' + body.replace(/\s*;\s*/g, "; ").replace(/ p\.?\s?/g, " ").trim() + "]</span>")
  .replace(/LAB PRACTICE \(unverified\):/g, '<span class="sb-labpractice">Lab practice (unverified):</span>');
const slug = (t) => t.toLowerCase().replace(/<[^>]+>/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
export function md(text, { shift = 0 } = {}) {
  const lines = text.replace(/\r/g, "").split("\n"); const out = []; let i = 0; const para = [];
  const flush = () => { if (para.length) out.push(`<p>${inline(para.join(" "))}</p>`); para.length = 0; };
  while (i < lines.length) {
    const l = lines[i];
    if (/^\s*$/.test(l)) { flush(); i++; continue; }
    const h = l.match(/^(#{1,4})\s+(.*)$/);
    if (h) { flush(); const t = h[2].replace(/^\d+[.)]\s*/, ""); out.push(`<h${Math.min(6, h[1].length + shift)} id="${slug(t)}">${inline(t)}</h${Math.min(6, h[1].length + shift)}>`); i++; continue; }
    if (/^\s*\|/.test(l)) { flush(); const rows = []; while (i < lines.length && /^\s*\|/.test(lines[i])) rows.push(lines[i++]);
      const cells = (r) => r.trim().replace(/^\||\|$/g, "").split("|").map((c) => c.trim());
      out.push(`<table class="sb-mdtable"><thead><tr>${cells(rows[0]).map((h) => `<th>${inline(h)}</th>`).join("")}</tr></thead><tbody>${rows.slice(1).filter((r) => !/^\s*\|?\s*:?-{2,}/.test(r)).map(cells).map((r) => `<tr>${r.map((c) => `<td>${inline(c)}</td>`).join("")}</tr>`).join("")}</tbody></table>`); continue; }
    const li = l.match(/^(\s*)([-*]|\d+[.)])\s+(.*)$/);
    if (li) { flush(); const ordered = /\d/.test(li[2]); const items = [];
      while (i < lines.length) { const m = lines[i].match(/^(\s*)([-*]|\d+[.)])\s+(.*)$/);
        if (m && m[1].length === li[1].length) { items.push(m[3]); i++; continue; }
        if (lines[i].match(/^\s{2,}\S/) && items.length && !lines[i].match(/^(\s*)([-*]|\d+[.)])\s+/)) { items[items.length - 1] += " " + lines[i].trim(); i++; continue; }
        if (lines[i].match(/^(\s+)([-*]|\d+[.)])\s+/) && lines[i].match(/^(\s+)/)[1].length > li[1].length) { const sub = []; while (i < lines.length && (lines[i].match(/^\s+\S/) || (/^\s*$/.test(lines[i]) && lines[i + 1]?.match(/^\s+\S/)))) sub.push(lines[i++]); items[items.length - 1] += "\u0000" + md(sub.map((s) => s.slice(li[1].length + 2)).join("\n")); continue; }
        break; }
      out.push(`<${ordered ? "ol" : "ul"}>${items.map((t) => { const [h, ...r] = t.split("\u0000"); return `<li>${inline(h)}${r.join("")}</li>`; }).join("")}</${ordered ? "ol" : "ul"}>`); continue; }
    if (/^>\s?/.test(l)) { flush(); const q = []; while (i < lines.length && /^>\s?/.test(lines[i])) q.push(lines[i++].replace(/^>\s?/, "")); out.push(`<blockquote>${inline(q.join(" "))}</blockquote>`); continue; }
    para.push(l.trim()); i++;
  }
  flush(); return out.join("\n");
}
const procParts = procedures ? procedures.split(/^## /m).slice(1) : [];
export const proc = (re) => { const p = procParts.find((p) => re.test(p.split("\n")[0])); return p ? md("## " + p, { shift: 1 }).replace(/<h3[^>]*>[^<]*<\/h3>/, "") : ""; };
export const details = (title, html, open = false, id = "") => `<details class="sb-more"${id ? ` id="${id}"` : ""}${open ? " open" : ""}><summary><span>${title}</span></summary><div class="sb-more-body">${html}</div></details>`;
export const stripH2 = (html) => html.replace(/^\s*<h2[^>]*>[^<]*<\/h2>/, "").replace(/<h2>/g, "<h3>").replace(/<\/h2>/g, "</h3>");
export const c = (...n) => `<span class="sb-cite">[${n.join(",")}]</span>`;
// links written for the single-page wiki point at anchors that now live on other pages
export const relink = (html) => html
  .replace(/href="#(stops|spindle-start)"/g, 'href="rules.html#$1"')
  .replace(/href="#(E\d\d)"/g, 'href="trouble.html#$1"')
  .replace(/href="#feeds"/g, 'href="feeds.html"')
  .replace(/<a class="sb-showfault" href="#fig-anatomy" data-show-fault="(\w+)">/g, '<a class="sb-showfault" href="webgl.html#fault=$1">');

// --------------------------------------------------------------- pages
export const PAGES = [
  { file: "rules.html", nav: "Rules", title: "Before you touch it", sub: "Ten rules and two procedures. Know them before the induction." },
  { file: "machine.html", nav: "The machine", title: "What moves, and why", sub: "Four motors, three axes, one spindle. Turn the model; pick one of the ten faults in its side panel to watch it happen." },
  { file: "run.html", nav: "Run a job", title: "Your first job", sub: "Eleven steps from CAM to a finished part, with the command at each step." },
  { file: "zero.html", nav: "Zeroing", title: "Home, job zero and Z zero", sub: "Three different zeros. Mixing them up is the most common first-week crash." },
  { file: "preflight.html", nav: "Pre-flight", title: "Pre-flight checklist", sub: "Print it. Tick it, in order, every time." },
  { file: "trouble.html", nav: "Something’s wrong", title: "Something went wrong", sub: "Start from what you see. Stop first, diagnose second." },
  { file: "feeds.html", nav: "Feeds & CAM", title: "Feeds, speeds and the post", sub: "One number decides most cuts. Most machine failures are decided at the computer." },
  { file: "maintain.html", nav: "Maintenance", title: "Maintenance and reference", sub: "The published schedule, the command glossary, the I/O table, the sources." },
  { file: "quiz.html", nav: "Sign-off", title: "Self-check", sub: "Twelve questions. Passing is part of the sign-off." },
];
PAGES.forEach((p, i) => { p.n = String(i + 1).padStart(2, "0"); });

export const FONTS = `<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500&family=IBM+Plex+Sans:ital,wght@0,400;0,500;0,600;1,400&family=Source+Serif+4:ital,opsz,wght@0,8..60,400;0,8..60,600;1,8..60,400&display=swap">`;

const navList = (current) => `<ol>${PAGES.map((p) => `<li><a href="${p.file}"${p.file === current ? ' aria-current="page"' : ""}><span class="n">${p.n}</span>${p.nav}</a></li>`).join("")}</ol>`;
const nav = (current) => {
  const cur = PAGES.find((p) => p.file === current);
  return `<header class="sb-mast">
<div class="sb-mast-top"><a class="sb-brand" href="index.html"${current === "index.html" ? ' aria-current="page"' : ""}><span class="sb-brand-name">ShopBot PRSalpha <span>144-60</span></span><span class="sb-brand-sub">Prototyping Lab · University of Iceland</span></a>
<details class="sb-navm"><summary><span>${cur ? `${cur.n} ${cur.nav}` : current === "webgl.html" ? "3D model" : "Contents"}</span><span class="sb-navm-k" aria-hidden="true">Contents</span></summary><nav aria-label="Site (compact)">${navList(current)}<a class="sb-navm-3d" href="webgl.html">3D model, full screen</a><a href="${THEME === "light" ? "../" : "light/"}${current}">${THEME === "light" ? "Dark" : "Light"} version</a><a href="${THEME === "light" ? "../" : ""}shopbot-handbook.pdf">Student handbook (PDF)</a><a href="${THEME === "light" ? "../" : ""}shopbot-wiki.pdf">Full wiki (PDF)</a></nav></details></div>
<nav class="sb-nav" aria-label="Site">${navList(current)}</nav>
<div class="sb-public-links" style="padding:8px 24px;font-size:13px;display:flex;gap:20px;flex-wrap:wrap"><a href="${THEME === "light" ? "../" : "light/"}${current}">${THEME === "light" ? "Dark" : "Light"} version</a><a href="${THEME === "light" ? "../" : ""}shopbot-handbook.pdf">Student handbook (PDF)</a><a href="${THEME === "light" ? "../" : ""}shopbot-wiki.pdf">Full wiki (PDF)</a></div>
</header>`;
};
const pager = (i) => {
  const prev = i > 0 ? PAGES[i - 1] : null, next = i < PAGES.length - 1 ? PAGES[i + 1] : null;
  return `<nav class="sb-pager" aria-label="Previous and next">${prev ? `<a class="prev" href="${prev.file}"><span>Previous · ${prev.n}</span>${prev.nav}</a>` : `<a class="prev" href="index.html"><span>Previous</span>Start</a>`}${next ? `<a class="next" href="${next.file}"><span>Next · ${next.n}</span>${next.nav}</a>` : `<a class="next" href="index.html"><span>Back to</span>Start</a>`}</nav>`;
};
const head = (p, extra = "") => `<header class="sb-phead"><div class="sb-kicker"><span>${p.n}</span>${p.nav}</div><h1>${p.title}</h1><p class="sb-lead">${p.sub}</p>${extra}</header>`;
export const colophon = `<footer class="sb-colophon"><span>ShopBot PRSalpha 144-60 · Prototyping Lab, University of Iceland</span><span>References: <a href="maintain.html#sources">Maintenance → Sources</a>.</span></footer>`;

// --------------------------------------------------------------- shell CSS (also injected into webgl.html)
export const SHELL_CSS = `
body.iso,.sb-mast{--sb-serif:"Source Serif 4","Iowan Old Style","Palatino Linotype",Georgia,serif;--sb-sans:"IBM Plex Sans","Helvetica Neue",Arial,sans-serif}
body.iso:not(.sbx-body){font-family:var(--sb-sans);font-size:16px;line-height:1.6;font-kerning:normal}
.sb-mast{font-family:var(--sb-sans);font-size:16px;line-height:1.6}
body.iso[data-theme=dark] :is(.sb-doc,.sb-mast){--anatomy-muted:#8d8d8d}
body.iso[data-theme=light] :is(.sb-doc,.sb-mast){--anatomy-muted:#6c6c71;--anatomy-red:#c4282d;--anatomy-green:#1d8350}
body.iso .sb-doc,body.iso .sb-mast{--anatomy-mono:"IBM Plex Mono",ui-monospace,Menlo,Consolas,monospace}
.sb-mast{container-type:inline-size;margin:0 0 56px}
.sb-mast-top{display:flex;align-items:flex-end;justify-content:space-between;gap:16px;padding:0 0 14px}
.sb-brand{display:flex;flex-direction:column;gap:2px;text-decoration:none;color:var(--anatomy-strong);min-height:44px;justify-content:center}
.sb-brand-name{font:600 21px/1.1 var(--sb-serif);letter-spacing:-.005em}
.sb-brand-name span{font-weight:400;color:var(--anatomy-text)}
.sb-brand-sub{font:500 11px/1.3 var(--sb-sans);letter-spacing:.14em;text-transform:uppercase;color:var(--anatomy-muted)}
.sb-nav{border-top:1.5px solid var(--anatomy-strong);border-bottom:1px solid var(--anatomy-faint)}
.sb-nav ol,.sb-navm ol{list-style:none;margin:0;padding:0}
.sb-nav ol{display:flex;justify-content:space-between}
.sb-nav a{position:relative;display:flex;align-items:baseline;gap:7px;padding:13px 2px 12px;color:var(--anatomy-text);text-decoration:none;font-size:14.5px;white-space:nowrap}
.sb-nav a .n,.sb-navm a .n{font:500 11px/1 var(--anatomy-mono);color:var(--anatomy-muted)}
.sb-nav a:hover{color:var(--anatomy-strong)}
.sb-nav a[aria-current]{color:var(--anatomy-strong);font-weight:600}
.sb-nav a[aria-current]::after{content:"";position:absolute;left:0;right:0;bottom:-1px;height:3px;background:var(--anatomy-strong)}
.sb-navm{display:none;position:relative}
.sb-navm summary{list-style:none;cursor:pointer;display:flex;align-items:center;gap:10px;min-height:44px;padding:0 0 0 14px;border-left:1px solid var(--anatomy-faint);color:var(--anatomy-strong);font-size:14.5px;font-weight:600}
.sb-navm summary::-webkit-details-marker{display:none}
.sb-navm-k{font:500 11px/1 var(--sb-sans);letter-spacing:.14em;text-transform:uppercase;color:var(--anatomy-muted);border:1px solid var(--anatomy-muted);padding:9px 10px;border-radius:3px}
.sb-navm[open] .sb-navm-k{background:var(--anatomy-strong);color:var(--anatomy-page);border-color:var(--anatomy-strong)}
.sb-navm nav{position:absolute;right:0;top:calc(100% + 10px);z-index:20;width:min(340px,calc(100vw - 32px));background:var(--anatomy-page);border:1px solid var(--anatomy-muted);border-top:1.5px solid var(--anatomy-strong);padding:6px 16px 10px;box-shadow:0 18px 40px -12px #0008}
.sb-navm li a,.sb-navm-3d{display:flex;align-items:baseline;gap:12px;min-height:46px;padding:13px 0 0;border-bottom:1px solid var(--anatomy-faint);color:var(--anatomy-text);text-decoration:none;font-size:16px}
.sb-navm a[aria-current]{color:var(--anatomy-strong);font-weight:600}
.sb-navm-3d{border-bottom:0;color:var(--anatomy-muted);font-size:14.5px}
@container (max-width:1060px){.sb-nav{display:none}.sb-navm{display:block}.sb-mast-top{border-bottom:1.5px solid var(--anatomy-strong);align-items:center}}
:where(.sb-mast,.sb-doc) a:focus-visible,:where(.sb-mast,.sb-doc) summary:focus-visible,:where(.sb-doc) input:focus-visible,:where(.sb-doc) button:focus-visible{outline:2px solid var(--anatomy-strong);outline-offset:3px;border-radius:2px}
@media (prefers-reduced-motion:reduce){*{scroll-behavior:auto!important;transition:none!important;animation:none!important}}
`;

export const SITE_CSS = `
html{scroll-behavior:smooth}
.iso-page{margin-top:28px}
body[data-theme=dark]{--anatomy-text:#bdbdc0;--anatomy-muted:#8d8d92}
body[data-theme=light]{--anatomy-text:#45454a;--anatomy-muted:#75757a}
.sb-doc{font-size:16px;line-height:1.6;color:var(--anatomy-text)}
.sb-vis text{paint-order:stroke;stroke:var(--anatomy-page);stroke-width:4px;stroke-linejoin:round}
.sb-doc p{margin:0 0 14px}
.sb-doc b{color:var(--anatomy-strong);font-weight:600}
.sb-doc a{color:var(--anatomy-strong);text-decoration-color:var(--anatomy-muted);text-underline-offset:3px;text-decoration-thickness:1px}
.sb-doc a:hover{text-decoration-color:var(--anatomy-strong)}
.sb-doc code{font-family:var(--anatomy-mono);font-size:.875em;color:var(--anatomy-strong);background:var(--anatomy-shade-2);padding:1px 5px;border-radius:3px;white-space:nowrap}
.sb-doc .sb-cite{font-family:var(--anatomy-mono);font-size:10.5px;color:var(--anatomy-muted);vertical-align:super;line-height:0;white-space:nowrap;margin-left:1px}
.sb-doc h1,.sb-doc h2{font-family:var(--sb-serif);font-weight:600;color:var(--anatomy-strong);letter-spacing:-.012em;text-wrap:balance}
.sb-doc h2{font-size:clamp(25px,3vw,32px);line-height:1.15;margin:0 0 18px}
.sb-doc h3{font-family:var(--sb-sans);font-size:17px;font-weight:600;color:var(--anatomy-strong);margin:26px 0 8px}
.sb-doc h4{font-size:15.5px;font-weight:600;color:var(--anatomy-strong);margin:18px 0 6px}
.sb-doc ul,.sb-doc ol{padding-left:20px}
.sb-doc li{margin:0 0 6px}
.sb-measure{max-width:760px}
.sb-sec{margin:0 0 88px}
.sb-sec-h{display:grid;grid-template-columns:minmax(0,1fr);gap:4px;margin:0 0 26px;padding-top:18px;border-top:1px solid var(--anatomy-faint)}
.sb-sec-h h2{margin:0}
.sb-sec-h p{margin:4px 0 0;max-width:62ch}
.sb-eyebrow{font:600 11.5px/1 var(--sb-sans);letter-spacing:.16em;text-transform:uppercase;color:var(--anatomy-muted)}
.sb-aside{font-size:14.5px;color:var(--anatomy-text);max-width:68ch}
.nw{white-space:nowrap}
.sb-labpractice{color:var(--anatomy-red);font-weight:600}

/* page header */
.sb-phead{margin:0 0 64px;max-width:900px}
.sb-kicker{display:flex;gap:12px;align-items:baseline;font:600 12px/1 var(--sb-sans);letter-spacing:.16em;text-transform:uppercase;color:var(--anatomy-muted);margin:0 0 18px}
.sb-kicker span{font:500 12px/1 var(--anatomy-mono);letter-spacing:.04em;color:var(--anatomy-strong);padding-right:12px;border-right:1px solid var(--anatomy-muted)}
.sb-phead h1{font-size:clamp(38px,5.4vw,64px);line-height:1.02;margin:0 0 18px;letter-spacing:-.02em}
.sb-lead{font:400 clamp(18px,1.9vw,22px)/1.45 var(--sb-serif);color:var(--anatomy-text);max-width:44ch;margin:0}
.sb-phead-split{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:32px;align-items:end;max-width:none}

/* accordions */
.sb-more{border-top:1px solid var(--anatomy-faint)}
.sb-more:last-of-type{border-bottom:1px solid var(--anatomy-faint)}
.sb-more summary{cursor:pointer;list-style:none;display:flex;align-items:center;justify-content:space-between;gap:16px;min-height:56px;padding:8px 0;color:var(--anatomy-strong);font-weight:600;font-size:16.5px}
.sb-more summary::-webkit-details-marker{display:none}
.sb-more summary::after{content:"";flex:0 0 auto;width:12px;height:12px;background:linear-gradient(var(--anatomy-strong),var(--anatomy-strong)) center/12px 1.5px no-repeat,linear-gradient(var(--anatomy-strong),var(--anatomy-strong)) center/1.5px 12px no-repeat}
.sb-more[open] summary::after{background:linear-gradient(var(--anatomy-strong),var(--anatomy-strong)) center/12px 1.5px no-repeat}
.sb-more summary:hover span{text-decoration:underline;text-decoration-color:var(--anatomy-muted);text-underline-offset:4px}
.sb-more-body{padding:4px 0 28px;font-size:15px;max-width:800px}
.sb-more-body>:first-child{margin-top:0}
.sb-more-body .sb-fig{margin:8px 0 26px}
.sb-group{border-bottom:1px solid var(--anatomy-faint)}
.sb-measure.sb-group{max-width:none}
.sb-group .sb-more:last-of-type{border-bottom:0}

/* tables */
.sb-mdtable,.sb-ftab{border-collapse:collapse;width:100%;font-size:14.5px;margin:6px 0 18px}
.sb-mdtable th,.sb-mdtable td,.sb-ftab th,.sb-ftab td{text-align:left;vertical-align:top;padding:9px 16px 9px 0;border-bottom:1px solid var(--anatomy-faint)}
.sb-mdtable th,.sb-ftab th{font:600 11.5px/1.3 var(--sb-sans);letter-spacing:.1em;text-transform:uppercase;color:var(--anatomy-muted);border-bottom:1px solid var(--anatomy-text)}
.sb-doc .sb-table{display:grid;grid-template-columns:max-content 1fr;gap:0 22px;margin:8px 0 16px;font-size:15px}
.sb-doc .sb-table dt{font:500 12.5px/1.4 var(--anatomy-mono);color:var(--anatomy-muted);padding:10px 0;border-top:1px solid var(--anatomy-faint)}
.sb-doc .sb-table dd{margin:0;padding:9px 0;border-top:1px solid var(--anatomy-faint)}
.sb-doc .sb-note-box{padding:14px 18px;border:1px solid var(--anatomy-faint);border-radius:4px;margin:14px 0 18px;font-size:15px}
.sb-doc .sb-sources{font-size:13.5px;color:var(--anatomy-text);line-height:1.5;padding-left:34px;columns:2 380px;column-gap:40px}
.sb-doc .sb-sources li{margin:0 0 6px;overflow-wrap:anywhere;break-inside:avoid}
.sb-doc .sb-sources a{color:var(--anatomy-muted)}
.sb-doc blockquote{margin:12px 0;padding:0 0 0 18px;border-left:1px solid var(--anatomy-muted);font-family:var(--sb-serif);font-style:italic}

/* pager + colophon */
.sb-pager{display:grid;grid-template-columns:1fr 1fr;margin:96px 0 0;border-top:1.5px solid var(--anatomy-strong)}
.sb-pager a{display:flex;flex-direction:column;gap:6px;padding:18px 0 0;text-decoration:none;color:var(--anatomy-strong);font:600 clamp(20px,2.4vw,26px)/1.2 var(--sb-serif)}
.sb-pager a span{font:600 11.5px/1 var(--sb-sans);letter-spacing:.14em;text-transform:uppercase;color:var(--anatomy-muted)}
.sb-pager a.next{text-align:right;align-items:flex-end}
.sb-pager a:hover{text-decoration:underline;text-decoration-thickness:1px;text-underline-offset:5px}
.sb-colophon{display:flex;justify-content:space-between;gap:8px 24px;flex-wrap:wrap;margin:56px 0 0;padding-top:14px;border-top:1px solid var(--anatomy-faint);font-size:13px;color:var(--anatomy-muted)}
.sb-colophon a{color:var(--anatomy-text)}

/* ---------- index */
.sb-hero{display:grid;grid-template-columns:minmax(0,1.3fr) minmax(0,1fr);gap:72px;align-items:end;margin:24px 0 112px}
.sb-hero h1{font-size:clamp(46px,7.4vw,98px);line-height:.95;letter-spacing:-.03em;margin:0 0 26px}
.sb-hero h1 em{display:block;font-style:italic;font-weight:400;color:var(--anatomy-text);font-size:.62em;letter-spacing:-.015em;margin-top:.12em}
.sb-hero .sb-lead{max-width:24ch;font-size:clamp(19px,2vw,24px)}
.sb-cta{display:inline-flex;align-items:center;gap:14px;margin:28px 0 0;min-height:52px;padding:0 22px;background:var(--anatomy-strong);color:var(--anatomy-page)!important;text-decoration:none!important;font-weight:600;font-size:16px;border-radius:3px}
.sb-cta:hover{background:var(--anatomy-lit)}
.sb-cta i{font-style:normal;font-family:var(--sb-serif);font-size:20px}
.sb-where{border-top:1.5px solid var(--anatomy-strong)}
.sb-where-h{font:600 12px/1 var(--sb-sans);letter-spacing:.16em;text-transform:uppercase;color:var(--anatomy-muted);padding:16px 0 4px}
.sb-where a{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:4px 16px;align-items:baseline;padding:15px 4px 15px 0;border-bottom:1px solid var(--anatomy-faint);text-decoration:none;min-height:44px}
.sb-where a b{font:400 19px/1.3 var(--sb-serif);color:var(--anatomy-strong)}
.sb-where a span{font-size:14px;color:var(--anatomy-text);white-space:nowrap}
.sb-where a span::after{content:" →";font-family:var(--sb-serif)}
.sb-where a:hover b{text-decoration:underline;text-decoration-thickness:1px;text-underline-offset:4px}
.sb-where a.danger b{color:var(--anatomy-red)}
.sb-stops-teaser{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:56px}
.sb-stops-teaser figure{margin:0}
.sb-stops-teaser .sb-vis{max-width:440px}
.sb-stops-teaser figcaption{margin-top:16px;max-width:42ch}
.sb-stops-teaser figcaption b{display:block;font:600 22px/1.25 var(--sb-serif);margin-bottom:4px}
.sb-toc{list-style:none;margin:0;padding:0;display:grid;grid-template-columns:repeat(2,minmax(0,1fr));grid-template-rows:repeat(5,auto);grid-auto-flow:column;column-gap:56px;border-top:1.5px solid var(--anatomy-strong)}
.sb-toc li{display:grid;margin:0}
.sb-toc a{display:grid;align-content:start;grid-template-columns:48px minmax(0,1fr);gap:2px 8px;padding:16px 0 16px;border-bottom:1px solid var(--anatomy-faint);text-decoration:none;color:var(--anatomy-text);min-height:44px}
.sb-toc .n{grid-row:1/3;font:500 12.5px/1.9 var(--anatomy-mono);color:var(--anatomy-muted)}
.sb-toc b{font:600 19px/1.3 var(--sb-serif);color:var(--anatomy-strong)}
.sb-toc span:last-child{font-size:14.5px;line-height:1.45}
.sb-toc a:hover b{text-decoration:underline;text-decoration-thickness:1px;text-underline-offset:4px}

/* ---------- rules */
.sb-tenrules{list-style:none;margin:0 0 104px;padding:0;counter-reset:r;display:grid;grid-template-columns:repeat(2,minmax(0,1fr));grid-template-rows:repeat(5,auto);grid-auto-flow:column;column-gap:56px;border-top:1.5px solid var(--anatomy-strong)}
.sb-tenrules li{counter-increment:r;display:grid;grid-template-columns:64px minmax(0,1fr);grid-template-rows:auto 1fr;column-gap:12px;padding:22px 0 24px;margin:0;border-bottom:1px solid var(--anatomy-faint)}
.sb-tenrules li::before{content:counter(r);grid-row:1/3;text-align:right;padding-right:6px;font:400 48px/.9 var(--sb-serif);color:var(--anatomy-strong);font-variant-numeric:lining-nums}
.sb-tenrules b{font:600 clamp(20px,2vw,24px)/1.22 var(--sb-serif);letter-spacing:-.01em}
.sb-tenrules li>span{display:block;margin-top:6px;max-width:64ch}
.sb-tenrules{position:relative}
.sb-tenrules::after{content:"";position:absolute;top:0;bottom:0;left:50%;width:1px;background:var(--anatomy-faint)}
.sb-panel{margin:0 0 40px;padding:32px 36px 34px;border-radius:4px;background:var(--anatomy-card)}
.sb-panel-h{display:flex;align-items:center;gap:14px;margin:0 0 6px}
.sb-panel-h .sb-icon{width:30px;height:30px}
.sb-panel h2{margin:0;font-size:clamp(28px,3.4vw,40px)}
.sb-panel-sub{margin:0 0 30px;font:400 18px/1.4 var(--sb-serif);color:var(--anatomy-text)}
.sb-panel-stop{border:2px solid var(--anatomy-red)}
.sb-panel-stop .sb-panel-h h2{color:var(--anatomy-strong)}
.sb-stopgrid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:0}
.sb-stopgrid>div{padding:0 36px 0 0}
.sb-stopgrid>div+div{padding:0 0 0 36px;border-left:1px solid var(--anatomy-faint)}
.sb-stopgrid .sb-vis{max-width:420px;margin:0 0 22px}
.sb-stopgrid h3{font:600 23px/1.2 var(--sb-serif);margin:0 0 2px}
.sb-stopgrid .what{font:600 12px/1 var(--sb-sans);letter-spacing:.14em;text-transform:uppercase;margin:0 0 12px;display:block}
.sb-stopgrid .what.ok{color:var(--anatomy-green)}.sb-stopgrid .what.bad{color:var(--anatomy-red)}
.sb-panel-start{border:2px solid var(--anatomy-green);background:transparent}
.sb-panel-start .sb-seq{margin:8px 0 26px}

/* ---------- machine */
.sb-stage-wrap{margin:0 0 20px}
.sb-gl-frame{display:block;width:100%;height:min(78vh,760px);border:0;border-top:1.5px solid var(--anatomy-strong);border-bottom:1px solid var(--anatomy-faint);background:var(--anatomy-page)}
.sb-stage-note{display:flex;justify-content:space-between;gap:8px 24px;flex-wrap:wrap;font-size:14px;color:var(--anatomy-text);margin:12px 0 0}
.sb-stage-note kbd{font:500 12px/1 var(--anatomy-mono);padding:3px 6px;border:1px solid var(--anatomy-muted);border-radius:3px;color:var(--anatomy-strong)}
.sb-specrow{margin:0 0 96px;padding:16px 0;border-bottom:1px solid var(--anatomy-faint)}
.sb-figure-block{max-width:none}
.sb-figure-block{--anatomy-muted:#6e6e6e}
body[data-theme=light] .sb-figure-block{--anatomy-muted:#8c8c90}
.sb-figure-block .sb-figures{font-family:ui-sans-serif,system-ui,-apple-system,"Segoe UI",sans-serif;font-size:14px;line-height:1.6;--anatomy-mono:ui-monospace,"SF Mono",Menlo,Consolas,monospace}

/* ---------- run */
.sb-proc{max-width:1080px;margin:0 0 96px;border-top:1.5px solid var(--anatomy-strong)}
.sb-phase{display:grid;grid-template-columns:200px minmax(0,1fr);border-bottom:1px solid var(--anatomy-faint)}
.sb-phase-h{padding:24px 24px 0 0;font:600 12px/1.4 var(--sb-sans);letter-spacing:.14em;text-transform:uppercase;color:var(--anatomy-muted)}
.sb-phase ol{list-style:none;margin:0;padding:0}
.sb-step{display:grid;grid-template-columns:76px minmax(0,1fr) minmax(200px,300px);column-gap:24px;padding:22px 0 22px;margin:0!important;border-top:1px solid var(--anatomy-faint)}
.sb-phase li:first-child{border-top:0}
.sb-step-n{font:400 46px/.9 var(--sb-serif);color:var(--anatomy-strong);font-variant-numeric:lining-nums}
.sb-step-t{font:600 22px/1.25 var(--sb-serif);color:var(--anatomy-strong);margin:2px 0 6px}
.sb-step-x{font-size:15px;max-width:58ch}
.sb-step-cmd{display:flex;flex-wrap:wrap;gap:6px;align-content:flex-start;justify-content:flex-end;padding-top:4px}
.sb-step-cmd code{font-size:14px;padding:5px 9px;background:transparent;border:1px solid var(--anatomy-muted);border-radius:3px}
.sb-step-cmd i{font-style:normal;color:var(--anatomy-muted);align-self:center;font-family:var(--sb-serif)}
.sb-step.hot .sb-step-n{color:var(--anatomy-green)}

/* ---------- zero */
.sb-trio{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));margin:0 0 96px;border-top:1.5px solid var(--anatomy-strong)}
.sb-trio a{display:flex;flex-direction:column;gap:8px;padding:22px 28px 26px;border-right:1px solid var(--anatomy-faint);text-decoration:none;color:var(--anatomy-text)}
.sb-trio a:first-child{padding-left:0}
.sb-trio a:last-child{border-right:0;padding-right:0}
.sb-trio .cmd{font:500 34px/1 var(--anatomy-mono);color:var(--anatomy-strong);letter-spacing:-.02em}
.sb-trio b{font:600 24px/1.2 var(--sb-serif)}
.sb-trio span{font-size:15px}
.sb-trio a:hover b{text-decoration:underline;text-decoration-thickness:1px;text-underline-offset:4px}
.sb-zero-fig{max-width:1000px}
.sb-zero-fig .sb-vis{max-width:900px;margin:0 auto}
.sb-crash-cap{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px 32px;margin:16px 0 0;font-size:15px}
.sb-crash-cap b{display:block;font:600 18px/1.3 var(--sb-serif)}
.sb-crash-cap .ok b{color:var(--anatomy-green)}.sb-crash-cap .bad b{color:var(--anatomy-red)}

/* ---------- preflight */
.sb-pf-tools{display:flex;flex-wrap:wrap;align-items:center;gap:16px 28px;margin:-28px 0 40px}
.sb-print{display:inline-flex;align-items:center;min-height:48px;padding:0 20px;background:var(--anatomy-strong);color:var(--anatomy-page);border:0;border-radius:3px;font:600 15.5px/1 var(--sb-sans);cursor:pointer}
.sb-print:hover{background:var(--anatomy-lit)}
.sb-pf-fill{display:none}
.sb-preflight{columns:2;column-gap:56px;counter-reset:g}
.sb-pf-col{counter-increment:g;border-top:1.5px solid var(--anatomy-strong);padding:16px 0 36px;break-inside:avoid}
.sb-pf-col h4{display:flex;gap:14px;align-items:baseline;font:600 25px/1.2 var(--sb-serif);margin:0 0 10px}
.sb-pf-col h4::before{content:counter(g);font:400 34px/1 var(--sb-serif);color:var(--anatomy-strong)}
.sb-ticks{list-style:none;padding:0;margin:0;font-size:16px;color:var(--anatomy-strong)}
.sb-ticks li{position:relative;padding:11px 0 11px 44px;margin:0;border-bottom:1px solid var(--anatomy-faint);line-height:1.45;min-height:44px}
.sb-ticks li::before{content:"";position:absolute;left:0;top:9px;width:26px;height:26px;border:1.6px solid var(--anatomy-strong);border-radius:2px}

/* ---------- trouble */
.sb-trouble-tree{margin:0 0 104px}
.sb-filter{display:flex;gap:12px;align-items:center;margin:0 0 8px;max-width:560px}
.sb-filter input{flex:1;min-height:48px;padding:0 14px;font:400 16px var(--sb-sans);color:var(--anatomy-strong);background:transparent;border:1px solid var(--anatomy-muted);border-radius:3px}
.sb-filter input::placeholder{color:var(--anatomy-muted)}
.sb-filter output{font:500 12.5px var(--anatomy-mono);color:var(--anatomy-muted);white-space:nowrap}
.sb-symptoms{border-top:1.5px solid var(--anatomy-strong);margin:16px 0 0}
.sb-sym{display:grid;grid-template-columns:minmax(0,5fr) minmax(0,7fr);gap:6px 40px;padding:16px 0;border-bottom:1px solid var(--anatomy-faint);font-size:15px}
.sb-sym-h{font:600 18px/1.35 var(--sb-serif);color:var(--anatomy-strong)}
.sb-sym a{font-family:var(--anatomy-mono);font-size:13.5px;white-space:nowrap}
.sb-sym a.sb-showfault{font-family:var(--sb-sans);font-size:14px}
.sb-staff{padding:28px 32px 18px;border:2px solid var(--anatomy-red);border-radius:4px}
.sb-staff h2{display:flex;align-items:center;gap:12px}
.sb-staff .sb-icon{width:28px;height:28px}
.sb-staff ul{list-style:none;padding:0;margin:14px 0 0;display:grid;grid-template-columns:repeat(2,minmax(0,1fr));column-gap:40px}
.sb-staff li{padding:10px 0;border-top:1px solid var(--anatomy-faint);margin:0;color:var(--anatomy-strong)}
.sb-jump{display:grid;grid-template-columns:repeat(19,minmax(0,1fr));margin:0 0 24px;font:500 12.5px/1 var(--anatomy-mono)}
.sb-jump a{display:grid;place-items:center;min-height:40px;color:var(--anatomy-text);text-decoration:none;border:1px solid var(--anatomy-faint);margin:0 -1px -1px 0}
.sb-jump a.k{color:var(--anatomy-strong);font-weight:500}
.sb-jump a:hover{background:var(--anatomy-strong);color:var(--anatomy-page)}
.sb-faults{list-style:none;margin:0;padding:0;border-top:1.5px solid var(--anatomy-strong);font-size:14.5px}
.sb-frow{margin:0!important;border-bottom:1px solid var(--anatomy-faint);scroll-margin-top:24px}
.sb-frow summary{list-style:none;cursor:pointer;display:grid;grid-template-columns:76px minmax(0,1fr) auto 20px;column-gap:20px;align-items:baseline;min-height:52px;padding:14px 0}
.sb-frow summary::-webkit-details-marker{display:none}
.sb-frow summary::after{content:"+";font:300 22px/1 var(--sb-sans);color:var(--anatomy-strong);justify-self:end}
.sb-frow details[open] summary::after{content:"−"}
.sb-frow summary:hover .sb-ft{text-decoration:underline;text-decoration-color:var(--anatomy-muted);text-underline-offset:4px}
.sb-fid{font:500 15px/1.35 var(--anatomy-mono);color:var(--anatomy-strong)}
.sb-fkey{font:500 12px/1 var(--anatomy-mono);color:var(--anatomy-muted);white-space:nowrap}
.sb-ft{font:600 18px/1.35 var(--sb-serif);color:var(--anatomy-strong)}
.sb-fbody{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));column-gap:28px;row-gap:14px;padding:0 0 22px 96px}
.sb-frow .lab{display:block;font:600 11px/1 var(--sb-sans);letter-spacing:.12em;text-transform:uppercase;color:var(--anatomy-muted);margin:0 0 6px}
.sb-frow:target{background:color-mix(in srgb,var(--anatomy-strong) 7%,transparent);box-shadow:-12px 0 0 color-mix(in srgb,var(--anatomy-strong) 7%,transparent),12px 0 0 color-mix(in srgb,var(--anatomy-strong) 7%,transparent)}
.sb-hidden{display:none!important}

/* ---------- feeds */
.sb-calc-wrap{margin:0 0 104px}
.sb-ftab td:first-child{color:var(--anatomy-strong);font-weight:600}
.sb-ftab td.num{font-family:var(--anatomy-mono);font-size:14px;color:var(--anatomy-strong)}
.sb-ftab{table-layout:fixed}
.sb-ftab td.note{color:var(--anatomy-text);font-size:14px}
.sb-ftab-wrap{margin:0 0 24px}
.sb-check{list-style:none;padding:0!important;margin:16px 0 0;counter-reset:k;border-top:1.5px solid var(--anatomy-strong);max-width:900px}
.sb-check li{counter-increment:k;position:relative;padding:18px 0 18px 64px;margin:0;border-bottom:1px solid var(--anatomy-faint)}
.sb-check li::before{content:counter(k);position:absolute;left:0;top:16px;width:40px;text-align:right;font:400 30px/1 var(--sb-serif);color:var(--anatomy-strong)}

/* ---------- maintenance */
.sb-reflinks{display:flex;flex-wrap:wrap;gap:4px 28px;margin:0 0 18px;font-size:15px}
.sb-reflinks a{min-height:44px;display:inline-flex;align-items:center}

/* ---------- quiz */
.sb-quiz{list-style:none;padding:0!important;margin:0;counter-reset:q;border-top:1.5px solid var(--anatomy-strong);max-width:960px}
.sb-quiz>li{counter-increment:q;position:relative;padding:24px 0 22px 80px;margin:0;border-bottom:1px solid var(--anatomy-faint);font:400 20px/1.45 var(--sb-serif);color:var(--anatomy-strong)}
.sb-quiz>li::before{content:counter(q);position:absolute;left:0;top:24px;width:52px;text-align:right;font:400 40px/1 var(--sb-serif);color:var(--anatomy-strong)}
.sb-quiz details{margin:14px 0 0;font:400 15.5px/1.6 var(--sb-sans);color:var(--anatomy-text)}
.sb-quiz summary{cursor:pointer;list-style:none;display:inline-flex;align-items:center;gap:10px;min-height:44px;padding:0 16px;border:1px solid var(--anatomy-muted);border-radius:3px;font:600 13px/1 var(--sb-sans);letter-spacing:.08em;text-transform:uppercase;color:var(--anatomy-strong)}
.sb-quiz summary::-webkit-details-marker{display:none}
.sb-quiz summary::before{content:"Show"}
.sb-quiz summary::after{content:"+";font:400 18px/1 var(--sb-sans)}
.sb-quiz details[open] summary{background:var(--anatomy-strong);color:var(--anatomy-page);border-color:var(--anatomy-strong)}
.sb-quiz details[open] summary::before{content:"Hide"}
.sb-quiz details[open] summary::after{content:"−"}
.sb-quiz details[open]>:not(summary){display:block;margin-top:12px;padding:14px 0 0;border-top:1px solid var(--anatomy-faint);max-width:64ch}

@media (max-width:980px){
  .sb-hero{grid-template-columns:1fr;gap:48px}
  .sb-phase{grid-template-columns:1fr}
  .sb-phase-h{padding:20px 0 0}
  .sb-fbody{grid-template-columns:1fr;padding-left:96px}
}
@media (max-width:760px){
  .iso-page{margin-top:12px}
  .sb-mast{margin-bottom:36px}
  .sb-brand-name{font-size:18px}
  .sb-brand-sub{display:none}
  .sb-hero h1{font-size:44px}
  .sb-where a{grid-template-columns:1fr;gap:2px}
  .sb-where a span{white-space:normal}
  .sb-phead h1{font-size:38px}
  .sb-navm summary>span:first-child{display:none}
  .sb-phead{margin-bottom:44px}
  .sb-sec{margin-bottom:64px}
.sb-preflight{columns:1}
  .sb-toc{grid-auto-flow:row;grid-template-rows:none}
  .sb-stops-teaser,.sb-toc,.sb-stopgrid,.sb-trio,.sb-staff ul,.sb-crash-cap{grid-template-columns:1fr}
  .sb-stopgrid>div,.sb-stopgrid>div+div{padding:0;border-left:0}
  .sb-stopgrid>div+div{margin-top:28px;padding-top:28px;border-top:1px solid var(--anatomy-faint)}
  .sb-panel{padding:22px 18px 24px}
  .sb-tenrules{grid-template-columns:1fr;grid-auto-flow:row;grid-template-rows:none}
  .sb-tenrules::after{display:none}
  .sb-tenrules li{grid-template-columns:44px minmax(0,1fr)}
  .sb-tenrules li::before{font-size:34px;text-align:left}
  .sb-step{grid-template-columns:40px minmax(0,1fr);column-gap:12px}
  .sb-step-n{font-size:30px;grid-row:1/3}
  .sb-step-cmd{grid-column:2;justify-content:flex-start;padding-top:10px}
  .sb-trio a,.sb-trio a:first-child,.sb-trio a:last-child{padding:18px 0;border-right:0;border-bottom:1px solid var(--anatomy-faint)}
  .sb-sym{grid-template-columns:1fr}
  .sb-staff{padding:20px 18px 10px}
  .sb-frow summary{grid-template-columns:44px minmax(0,1fr) 18px;column-gap:10px}
  .sb-fkey{display:none}
  .sb-ft{font-size:16.5px}
  .sb-fbody{padding-left:54px}
  .sb-jump{grid-template-columns:repeat(6,minmax(0,1fr))}
  .sb-jump a{min-height:44px}
  .sb-quiz>li{padding-left:48px;font-size:18px}
  .sb-quiz>li::before{font-size:30px;width:32px}
  .sb-gl-frame{height:min(64vh,520px)}
  .sb-pager a{font-size:19px}
  .sb-pager{margin-top:72px}
  .sb-check li{padding-left:46px}
  .sb-check li::before{width:30px;font-size:26px}
  .sb-doc .sb-table{grid-template-columns:1fr}
  .sb-doc .sb-table dd{border-top:0;padding-top:0}
  .sb-mdtable{display:block;overflow-x:auto}
  .sb-ftab thead,.sb-ftab colgroup{display:none}
  .sb-ftab{table-layout:auto}
  .sb-ftab,.sb-ftab tbody,.sb-ftab tr,.sb-ftab td{display:block}
  .sb-ftab tr{padding:12px 0;border-bottom:1px solid var(--anatomy-faint)}
  .sb-ftab td{border:0;padding:2px 0}
  .sb-ftab td[data-l]::before{content:attr(data-l) " ";font:600 11px/1 var(--sb-sans);letter-spacing:.1em;text-transform:uppercase;color:var(--anatomy-muted)}
}
@media print{
  @page{size:A4;margin:10mm 13mm}
  body.iso{background:#fff!important;color:#111!important;font-size:11pt}
  .iso-page{width:auto!important;margin:0!important}
  .sb-mast,.sb-pager,.sb-colophon,.sb-pf-tools .sb-print,.sb-transport,.sb-faults .sb-fault,.sb-views,.sb-filter,.sb-jump,.sb-gl-frame,.sb-stage-note{display:none!important}
  .sb-more:not([open])>*:not(summary),.sb-frow details:not([open])>*:not(summary){display:block}
  .sb-doc,.sb-doc p,.sb-doc li,.sb-doc td,.sb-doc dd,.sb-lead,.sb-step-x{color:#111!important}
  .sb-doc h1,.sb-doc h2,.sb-doc h3,.sb-doc h4,.sb-doc b{color:#000!important}
  .sb-frow,.sb-step,.sb-ticks li,.sb-sym{break-inside:avoid}
  .sb-frow summary::after{display:none}
  body.pf .sb-phead{margin:0 0 4mm;display:flex;align-items:baseline;gap:6mm;flex-wrap:wrap}
  body.pf .sb-phead h1{font-size:20pt;margin:0}
  body.pf .sb-phead .sb-kicker,body.pf .sb-phead .sb-lead{display:none}
  body.pf .sb-pf-tools{margin:0 0 3mm;display:block}
  body.pf .sb-pf-tools .sb-aside{font-size:9.5pt;margin:0 0 2mm;color:#111!important;max-width:none}
  body.pf .sb-pf-fill{display:flex;gap:6mm;font-size:10pt;margin:0 0 3mm}
  body.pf .sb-pf-fill span{flex:1;border-bottom:.6pt solid #000;padding-bottom:1mm}
  body.pf .sb-preflight{columns:2;column-gap:7mm;column-fill:balance}
  body.pf .sb-pf-col{border-top:1.2pt solid #000;padding:1.5mm 0 2.5mm;break-inside:avoid}
  body.pf .sb-pf-col h4{font-size:13pt;margin:0 0 1mm;color:#000!important}
  body.pf .sb-ticks{font-size:10.5pt}
  body.pf .sb-ticks li{padding:.9mm 0 .9mm 7mm;min-height:0;border-bottom:.4pt solid #bbb;line-height:1.3}
  body.pf .sb-ticks li::before{width:4mm;height:4mm;top:1.1mm;border:.9pt solid #000}
  body.pf .sb-doc code{background:none;border:0;padding:0;color:#000}
}
`;

function page(p, i, body, script = "", { bodyClass = "" } = {}) {
  let html = k.pageHtml({ title: `${p.title} — ShopBot PRSalpha 144-60`, theme: THEME, body: `<style>${PROSE_CSS}${SHELL_CSS}${V.VIS_CSS}${SITE_CSS}</style>${nav(p.file)}<article class="sb-doc">${p.noHead ? "" : head(p, p.headExtra || "")}${body}${i >= 0 ? pager(i) : ""}${colophon}</article>`, script, width: 1200 });
  html = html.replace("</title>", `</title>${FONTS}`);
  if (bodyClass) html = html.replace('<body class="iso"', `<body class="iso ${bodyClass}"`);
  BODIES[p.file] = { body, script };
  if (!NO_WRITE) writeFileSync(join(OUT, p.file), html);
  return html.length;
}
export const sec = (eyebrow, title, intro, inner, { id = "", cls = "" } = {}) => `<section class="sb-sec ${cls}"${id ? ` id="${id}"` : ""}><div class="sb-sec-h">${eyebrow ? `<span class="sb-eyebrow">${eyebrow}</span>` : ""}<h2>${title}</h2>${intro ? `<p>${intro}</p>` : ""}</div>${inner}</section>`;
// open a <details> when its id (or something inside it) is the URL hash
const OPEN_JS = `const openHash=()=>{const id=decodeURIComponent(location.hash.slice(1));if(!id)return;const el=document.getElementById(id);if(!el)return;let d=el.closest('details');while(d){d.open=true;d=d.parentElement&&d.parentElement.closest('details');}if(el.tagName==='DETAILS')el.open=true;const inner=el.querySelector(':scope>details');if(inner)inner.open=true;};addEventListener('hashchange',openHash);openHash();`;

// ---- 1 Rules
export const RULES = [
  ["Trained and signed off.", "You run this machine only after the induction and the instructor's sign-off. Until then, only with a signed-off person at the <span class='nw'>E-stop</span>."],
  ["Never alone, never tired.", "Two people in the room; the second one knows where the <span class='nw'>E-stop</span> is: the red button on the wall-mounted pendant by the monitor. It is the only one."],
  ["Eyes and ears, for you and anyone watching.", "From the moment the machine is powered. No gloves, loose clothing, hair or lanyards near the gantry."],
  ["Hands out of the cutting area while the control box is on.", "The only exception: spindle stopped, keypad closed, no file loaded or paused, and the key OFF in your pocket. It can move without warning, in any direction."],
  ["Key out for hands-on work.", "Spindle stopped, interlock key OFF and in your pocket before you change a bit, touch the collet, or load, move or clamp material."],
  ["Never leave a running job.", "Dust under the brush catches when a tool rubs, hits a screw or burns hardwood. Stand where you can see the cut and reach the <span class='nw'>E-stop</span>."],
  ["Know the two ways to stop.", "Spacebar for routine; <span class='nw'>E-stop</span> when something is wrong. Use them without hesitating; a ruined sheet is cheap."],
  ["Spindle at speed before OK.", "When the screen says “Press START on control before pressing OK”: pendant START, check the spindle runs at the commanded speed, then OK — cutting begins. No separate RUN on the VFD. A still bit dragged through plywood snaps."],
  ["Extraction on.", "Switch the dust collector on at the collector itself (manual; SB3 does not switch it). It runs whenever the spindle runs. If the hose comes off the foot or the brush skirt is damaged, stop and tell staff."],
  ["Clean up; leave the machine powered.", "Stop the file and spindle; key out before cleanup. Clear and clean the deck, stow the bit, report faults. Users never power down the machine; leave it for lab staff. Use E-stop in an emergency, not to finish a session."],
];
export const stopsBox = `<section class="sb-panel sb-panel-stop" id="stops"><div class="sb-panel-h">${V.icon("stop")}<h2>How to stop</h2></div><p class="sb-panel-sub">Two controls, two meanings. Use them without hesitating.</p><div class="sb-stopgrid">
<div>${V.spacebar()}<span class="what ok">Routine · position kept</span><h3>Spacebar</h3><p>Or Enter, or on-screen Stop. Motion ramps down, Z lifts, position is kept, you can resume. <b>Treat the spindle as live</b> — it may keep turning, coast, or restart on resume. Before reaching in: spindle stopped, key OFF and removed, keypad closed, no file loaded or paused. Keep clear before restarting.${c(4, 11)}</p></div>
<div>${V.pendant()}<span class="what bad">Something is wrong · position lost</span><h3><span class='nw'>E-stop</span></h3><p>The red button on the wall-mounted pendant by the monitor — the only <span class='nw'>E-stop</span> on this machine (the red-and-yellow rotary handle on the control cabinet is the power disconnect, not an <span class='nw'>E-stop</span>). Spindle power off at once, motors ~5 s later. Position is <b>lost</b>: twist to release → pendant <b>Reset</b> → <code>C3</code> → <code>C2</code>. If the software has frozen, <span class='nw'>E-stop</span> is the only control that still kills the spindle.${c(2, 10, 11)}</p></div>
</div></section>`;
export const startBox = `<section class="sb-panel sb-panel-start" id="spindle-start"><div class="sb-panel-h">${V.icon("play")}<h2>How to start a job</h2></div><p class="sb-panel-sub">The one sequence. The pendant comes before OK.</p>${V.flow([
  { title: "RPM typed, Enter", text: "Spindle RPM Control window (Tools menu or <code>TR</code>); leave it open." },
  { title: "<code>FP</code>, pick file, Start", text: "Offset = No Offset." },
  { title: "Pendant START", text: "When the screen says “Press START on control before pressing OK”. Green button.", hot: true },
  { title: "Spindle at speed", text: "Check it runs at the commanded rpm (the VFD display). There is no separate RUN step on the VFD." },
  { title: "OK", text: "Cutting begins. Hand near the spacebar for the first plunge." },
])}</section>`;
page(PAGES[0], 0, `<ol class="sb-tenrules">${RULES.map(([t, x]) => `<li><b>${t}</b><span>${x}</span></li>`).join("")}</ol>${stopsBox}${startBox}<div class="sb-measure" style="margin-top:72px">${details("ShopBot's own safety list, from the manuals", proc(/^0\./))}</div>`);

// ---- 2 Machine
const numbers = AFTER_FIGURE.split("<h2>3 · Failure modes</h2>")[0];
export const mech = stripH2(numbers).replace(/<h3>What it is, in numbers<\/h3>[\s\S]*?(?=<h3>)/, "");
export const numbersHtml = (numbers.match(/<h3>What it is, in numbers<\/h3>[\s\S]*?(?=<h3>)/) || [numbers.match(/<h2>[^<]*numbers<\/h2>[\s\S]*?(?=<h2>)/)?.[0] || ""])[0].replace(/<h[23]>[^<]*<\/h[23]>/, "");
page(PAGES[1], 1, `<div class="sb-stage-wrap"><iframe class="sb-gl-frame" src="webgl.html?embed" title="ShopBot PRSalpha 3D model: drag to orbit, wheel to zoom" loading="eager"></iframe>
<div class="sb-stage-note"><span>The machine in 3D</span><a href="webgl.html">Open the model full screen →</a></div></div>
<div class="sb-specrow">${V.stats([["Sheet", "12 × 5 ft"], ["Travel", "153 × 61 in"], ["Motors", "4 closed-loop alphaStep"], ["Drive", "7.2 : 1, rack and pinion"], ["Rapid", "30 in/s · 760 mm/s"], ["Spindle", "12 000 rpm typical, 6–18k"], ["Resolution", "0.0004 in ≈ 0.01&nbsp;mm"]])}</div>
<p class="sb-measure sb-aside" id="rotary-axis"><b>Staff only, not part of the student course:</b> the rotary-axis chuck standing beside the table belongs to this machine but is not used in student jobs and is not shown in the 3D model. Leave it alone; ask staff.</p>
<div class="sb-measure sb-group">${details("How the mechanisms work", mech)}${details("The machine in numbers", numbersHtml)}</div>`);

// ---- 3 Run a job
export const STEPS = [
  ["At the computer", [
    ["CAM", "Mostly Autodesk Fusion. Stock measured, origin corner, Z0 surface, screws and clamps clear of every toolpath, tabs. Post with the ShopBot OpenSBP post, mm.", "Fusion · OpenSBP · mm"],
    ["Read the .sbp", "<code>&amp;PWZorigin</code>, units, <code>MS</code>, <code>TR</code>, first <code>JZ</code>/<code>M3</code>.", "&amp;PWZorigin|MS|TR|JZ|M3"]]],
  ["Power and home", [
    ["Power", "Control box on → E-stop twisted to release, pendant Reset → PC on, open SB3 (the ShopBot program) in Move/Cut mode (<code>SM</code>); the correct settings are already loaded, do not reload them → Spindle RPM window → key ENGAGED → dust collector on, at the collector.", "Reset|SM"],
    ["Warm up, home", "<code>C5</code>, the standard warm-up, if the spindle is cold. <code>C3</code> homes on the prox switches.", "C5|C3"]]],
  ["Set up", [
    ["Stock on", "Spindle stopped, key OFF and removed, keypad closed, no file loaded or paused. Sheet flat, screwed where CAM said. Key back in, ENGAGED.", "key OFF"],
    ["Bit", "Spindle stopped, key OFF and removed, keypad closed, no file loaded or paused. ER25 collet snapped into the nut, bit in (≥ 75 % of the shank inside), then thread the assembly onto the spindle; torque. Key back in, ENGAGED.", "key OFF"],
    ["XY zero", "Jog to the file’s XY origin (<code>K</code>): centre in the zeroing example, or corner if CAM uses a corner. Close keypad, <code>Z2</code>. Record the base coordinates.", "K|Z2"],
    ["Z zero", "Clip stays on the carriage plate. Plate on the right surface, input 1 test, <code>C2</code> (always), plate back in its holder.", "C2"]]],
  ["Cut", [
    ["Air cut", "<code>FP</code> with Offset = 3D, bit raised more than the deepest cut, spindle off. Then No Offset.", "FP|Offset 3D"],
    ["Cut", "RPM + Enter → <code>FP</code> → screen prompt → pendant START → spindle at commanded speed → OK → cut. Hand on the spacebar. Stay at the machine until it finishes.", "TR|Enter|FP|START|OK"]]],
  ["Finish", [
    ["Done", "Finish or stop the file and stop the spindle. With everyone clear, raise Z and jog clear. Close the keypad, end any loaded/paused file and remove the key before cleanup. Collector off; clear, vacuum, brush and stow the bit. Report faults. Leave the machine powered for lab staff; users never power down. E-stop is for emergencies.", "Stop file|key out"]]],
];
let sn = 0;
export const procHtml = `<div class="sb-proc">${STEPS.map(([ph, steps]) => `<div class="sb-phase"><div class="sb-phase-h">${ph}</div><ol>${steps.map(([t, x, cmd, hot]) => { sn++; return `<li class="sb-step${hot ? " hot" : ""}" id="step-${sn}"><span class="sb-step-n">${sn}</span><div><div class="sb-step-t">${t}</div><div class="sb-step-x">${x}</div></div><div class="sb-step-cmd">${cmd.split("|").map((s) => `<code>${s}</code>`).join("")}</div></li>`; }).join("")}</ol></div>`).join("")}</div>`;
page(PAGES[2], 2, `${procHtml}
${sec("Manual", "The detail behind each step", "", `<div class="sb-measure sb-group">${details("Power-up and leaving the machine", proc(/^1\./))}${details("Keypad and jogging", proc(/^2\./))}${details("Homing (C3)", proc(/^3\./))}${details("Material and hold-down", proc(/^4\./) + V.fig(V.holddown(), ["Screw in the waste.", "Profile cut, 0.2 mm into the board.", "Tab or onion skin (0.25–0.75 mm) keeps the part from flying.", "Clearance height <b>above</b> every screw head and clamp."], { title: "Hold-down, in section" }))}${details("Tool change", V.fig(V.collet(), ["Spindle nose.", "Standard ER25 nut supplied for the HSD AT/MT 1073-140. Snap the collet into the nut <b>first</b>, insert the bit, then thread the assembly onto the spindle. Use the tightening method demonstrated during induction; do not use a torque for a different nut.", "Collet: clean, right size for the shank.", "Shank ≥ 75 % in the collet.", "Flutes never inside the nut.", "Stick-out as short as the job allows."], { title: "Collet, nut and bit, in section" }) + proc(/^5\./))}${details("Loading and running a file", proc(/^8\./))}${details("Pausing, stopping, resuming", proc(/^9\./))}${details("After the job", proc(/^10\./))}</div>`)}`);

// ---- 4 Zeroing
page(PAGES[3], 3, `<div class="sb-trio">
<a href="#home"><span class="cmd">C3</span><b>Machine home</b><span>Where the prox switches say 0,0. Fixed. Everything else is measured from here.</span></a>
<a href="#job"><span class="cmd">Z2</span><b>Job zero (X, Y)</b><span>The point your CAM file calls X0 Y0. This example uses the centre of the material. Z2 zeros X and Y, not Z.</span></a>
<a href="#z"><span class="cmd">C2</span><b>Z zero</b><span>Material top <i>or</i> table surface — whichever <code>&amp;PWZorigin</code> in the file says. Found with the plate.</span></a></div>
${sec("Figure 1 · plan", "Home and job zero, from above", "", `<span id="job"></span>${V.fig(V.tablePlan(), ["<b>Gantry</b> (X bridge): runs along the table on two X motors.", "<b>Spindle on the Y car</b>: runs across the gantry.", "<b>X proximity switch</b> · input 2.", "<b>Y proximity switch</b> · input 3.", "<b>Machine home 0,0.</b> <code>C3</code> finds it on the prox switches. Fixed.", "<b>XY job zero — <code>Z2</code> at the material centre.</b> Match the centre origin in CAM. A corner origin is also possible, but only when the file uses it. Z2 does not set Z height; use C2 for Z."], { cls: "sb-zero-fig" })}`, { id: "home" })}
${sec("Figure 2 · side", "Z zero with the plate", "", V.fig(V.zTouch(), ["<b>Spindle and collet nut</b> on the aluminium carriage plate.", "<b>Bit</b>: <code>C2</code> lowers it until it touches the plate, twice, then lifts.", "<b>Ground clip</b>: it stays clamped on the aluminium carriage plate, on the edge. Leave it there; never on the bit or nut.", "<b>Z-zero plate</b> on the surface the file expects (stock top here).", "<b>Input 1</b> on the SB3 screen lights on contact, goes out when lifted. The green dashes are the circuit: plate → bit → spindle → carriage plate → clip → lead → plate.", "<b>One coiled lead</b>, plate to clip. Nothing else to connect."], { cls: "sb-zero-fig" }), { id: "z" })}
${sec("Figure 3 · the classic crash", "Same file, wrong surface", `CAM assumed the <b>stock top</b>; you touched the plate on the <b>bed</b>. Every rapid and retract now runs <i>inside</i> the material and every cut goes a sheet thickness into the spoilboard: clamps hit, bit snaps. The reverse mismatch cuts air. Read <code>&amp;PWZorigin</code> in the file header before C2, every time.${c(4, 54)}`, `<figure class="sb-fig sb-zero-fig"><div class="sb-fig-art">${V.crashPair()}</div><div class="sb-crash-cap"><div class="ok"><b>Match</b>File and plate both on the stock top: the rapid clears the sheet, the cut ends just below it.</div><div class="bad"><b>Mismatch</b>File on the stock top, plate on the bed: the rapid runs inside the sheet, the cut goes a sheet thickness into the spoilboard.</div></div></figure>`)}
<div class="sb-measure sb-group">${details("Homing (C3) in detail", proc(/^3\./))}${details("Z zero in detail (C2, plate thickness)", proc(/^6\./))}${details("XY zero in detail (Z2, ZX/ZY, fixed offsets)", proc(/^7\./))}</div>`);

// ---- 5 Preflight
export const pfAside = (PREFLIGHT.match(/<p class="sb-aside">([\s\S]*?)<\/p>/) || [, ""])[1];
export const pfBody = PREFLIGHT.replace(/<p class="sb-aside">[\s\S]*?<\/p>/, "");
page(PAGES[4], 4, `<div class="sb-pf-tools"><button type="button" class="sb-print" onclick="print()">Print this page</button><p class="sb-aside" style="margin:0">${pfAside}</p></div>
<div class="sb-pf-fill" aria-hidden="true"><span>Operator</span><span>Second person</span><span>Date</span><span>Job / file</span></div>${pfBody}`, "", { bodyClass: "pf" });

// ---- 6 Trouble
export const symHtml = stripH2(SYMPTOMS).replace(/^\s*<p>[\s\S]*?<\/p>/, "")
  .replace(/<a class="sb-showfault" href="#fig-anatomy" data-show-fault="(\w+)">/g, '<a class="sb-showfault" href="webgl.html#fault=$1">');
export const symIntro = (SYMPTOMS.match(/<\/h2>\s*<p>([\s\S]*?)<\/p>/) || [, ""])[1];
const faultRows = FAULTS_DOC.map(([id, key, title, sym, cause, cure, refs]) => `<li class="sb-frow" id="${id}"><details><summary><span class="sb-fid">${id}</span><span class="sb-ft">${title}${c(...refs)}</span><span class="sb-fkey">${key ? `key ${key}` : ""}</span></summary><div class="sb-fbody"><div><span class="lab">What you see</span>${sym}</div><div><span class="lab">Why</span>${cause}</div><div><span class="lab">What to do</span>${cure}</div></div></details></li>`).join("");
const jump = `<nav class="sb-jump" aria-label="Jump to a fault">${FAULTS_DOC.map(([id, key]) => `<a href="#${id}"${key ? ' class="k"' : ""}>${id}</a>`).join("")}</nav>`;
const TROUBLE_JS = `const q=document.querySelector('[data-filter]'),out=document.querySelector('[data-count]');const items=[...document.querySelectorAll('.sb-sym,.sb-frow')];
q&&q.addEventListener('input',()=>{const t=q.value.trim().toLowerCase();let n=0;for(const el of items){const hit=!t||el.textContent.toLowerCase().includes(t);el.classList.toggle('sb-hidden',!hit);if(hit)n++;const d=el.querySelector('details');if(d)d.open=!!t&&hit&&t.length>2;}out.textContent=t?n+' match'+(n===1?'':'es'):'';});${OPEN_JS}`;
page(PAGES[5], 5, `<div class="sb-trouble-tree">${V.stoppedFlow()}</div>
${sec("Index", "Start from what you see", symIntro, `<div class="sb-filter"><input type="search" data-filter placeholder="Filter symptoms and faults — e.g. spindle, Z, plywood" aria-label="Filter symptoms and faults"><output data-count></output></div>${symHtml}`, { id: "symptoms" })}
<section class="sb-sec sb-staff" id="callstaff"><h2>${V.icon("alarm")}Stop and call staff when</h2>${CALL_STAFF}</section>
${sec("Reference", "All 39 failure modes", "Open a row for what you see, why, and what to do. Faults the 3D model on <a href=\"webgl.html\">The machine</a> can act out show their key (1–9 or S) and are bold in the index.", `${jump}<ol class="sb-faults">${faultRows}</ol>`, { id: "faults" })}
<div class="sb-measure sb-group">${details("Driver and controller alarms, in detail", proc(/^13\./))}</div>`, TROUBLE_JS);

// ---- 7 Feeds & CAM
export const FEEDTAB = [
  ["Birch / spruce plywood", "6 mm 2-flute", "14 000", "4 200", "0.15", `Labs report 2000–6500 mm/min (0.07–0.23 mm/tooth); below ~3600 mm/min at 14 000 rpm you are under ShopBot's range. 3 mm pass, 40 % stepover; down-cut to 3 mm then up-cut to 0.2 mm past the thickness; tabs 12 × 3 mm. To go gentler, drop rpm, not feed.${c(11, 56, 57, 58)}`],
  ["MDF", "¼ in", "—", "similar to plywood", "0.33–0.40", `Fine dust: extraction and a mask. MIT's table; plunge ≤ 50 % of the XY feed.${c(59)}`],
  ["EB700 epoxy tooling board", "12 mm 3-flute", "8 000", "8 400", "0.35", `Plunge 300 mm/min; adaptive 20 mm max / 5 mm fine stepdown. One worked job, not a validated recipe; respirator.${c(61)}`],
  ["PU foam / tooling foam", "—", "—", "—", "0.28–0.33", `Cuts easily; the dust is the hazard.${c(59)}`],
  ["Plastics (HDPE, acrylic)", "1-flute (O-flute)", "low", "high", "—", `The test is a clean curl, not a weld.${c(11, 35)}`],
  ["Aluminium", "1-flute", "—", "high", "—", `Marginal on a router: shallow depth, lubricant; if it welds, less depth and more feed.${c(35)}`],
];
export const feedsNotes = stripH2(FEEDS).replace(/<p>The cutter removes[\s\S]*?<\/p>\s*<div class="sb-formula">[\s\S]*?<\/div>\s*<p>Worked example[\s\S]*?<\/p>/, "");
export const feedsIntro = (FEEDS.match(/<p>The cutter removes[\s\S]*?<\/p>/) || [""])[0];
export const feedsWorked = (FEEDS.match(/<p>Worked example[\s\S]*?<\/p>/) || [""])[0];
page(PAGES[6], 6, `<div class="sb-calc-wrap">${V.chipCalc()}</div>
${sec("Starting points", "Used in Icelandic Fab Labs", "6 mm two-flute unless stated. Record the material, cutter, feed, rpm and any fault in your job notes and report problems to staff.", `<div class="sb-ftab-wrap"><table class="sb-ftab"><colgroup><col style="width:19%"><col style="width:13%"><col style="width:8%"><col style="width:11%"><col style="width:10%"><col></colgroup><thead><tr><th>Material</th><th>Cutter</th><th>rpm</th><th>Feed mm/min</th><th>mm/tooth</th><th>Notes</th></tr></thead><tbody>${FEEDTAB.map(([m, cu, r, f, z, n]) => `<tr><td>${m}</td><td data-l="Cutter">${cu}</td><td class="num" data-l="rpm">${r}</td><td class="num" data-l="Feed mm/min">${f}</td><td class="num" data-l="mm/tooth">${z}</td><td class="note">${n}</td></tr>`).join("")}</tbody></table></div>
<div class="sb-measure sb-group">${details("Why chipload, with a worked example", feedsIntro + feedsWorked)}${details("Ranges, sources and rules of thumb", feedsNotes)}</div>`)}
${sec("Checklist", "From CAM to the machine", "", `<div class="sb-measure" style="max-width:900px">${stripH2(CAM)}</div>`)}`, V.CALC_JS);

// ---- 8 Maintenance + reference
export const maintCols = [
  ["Every session (you)", ["C5 warm-up at the start of the day", "Vacuum deck, brush racks and rails", "Check the brush skirt and that the hose is on the foot", "Listen: ticks and bumps are debris", "Record material, cutter, feed, rpm and faults in your job notes; report problems"]],
  ["Every 40 h (staff)", ["Wipe rails, light grease on the racks (BB-sized dab per 6 in, work in, wipe excess)", "Check pinion set screws and motor spring tension", "Check collet, nut and spindle nose for scoring"]],
  ["Quarterly (staff)", ["Roller/eccentric preload on the car and Z", "Rack and pinion wear, re-engagement", "Cable carriers and connectors", "VFD fan runs"]],
  ["Semiannual (staff)", ["Check gantry square (diagonal test), table flatness", "Spoilboard surfacing", "Proximity switch gap and function", "Replace collets at 400–700 h or any incident"]],
];
export const allSources = `<ol class="sb-sources">${[...SOURCES, ...LAB_SOURCES].map(([n, label, url]) => `<li value="${n}">${label}${url ? ` — <a href="${url}">${url}</a>` : ""}</li>`).join("")}</ol><p class="sb-aside">Manual tags: AG Assembly Guide 2022 [2] · QS Quick Start 2016 [4] · UG User Guide 2015 [11] · CR Command Reference 2015 [10] · HD Holding Down [12] · MS Maintenance Schedule [13] · TM Troubleshooting Mechanicals [16] · XY Manually Setting XY Zero [47].</p>`;
page(PAGES[7], 7, `${sec("Calendar", "What to do, and when", `Summary of ShopBot's PRS Maintenance Schedule and the maintenance appendix; the full published schedule, with the rack-greasing and bearing-adjustment procedures, is below.${c(2, 13)}`, `${V.maintGrid(maintCols)}<div class="sb-measure sb-group" style="margin-top:40px">${details("Why maintenance matters here", stripH2(MAINTENANCE).replace(/<h3>What this page does not know[\s\S]*$/, ""))}${details("The published schedule, in full", proc(/^14\./), false, "schedule")}</div>`)}
${sec("Reference", "Commands, signals and sources", "", `<nav class="sb-reflinks" aria-label="Reference sections"><a href="#glossary">Command glossary</a><a href="#io">Inputs, outputs and LEDs</a><a href="#sources">Sources</a></nav><div class="sb-group">${details("Command glossary", proc(/^11\./), false, "glossary")}${details("Inputs, outputs and status LEDs", proc(/^12\./), false, "io")}${details("Sources", allSources, false, "sources")}</div>`)}`, OPEN_JS);

// ---- 9 Quiz
page(PAGES[8], 8, `<div>${relink(stripH2(QUIZ)).replace(/<summary>Answer<\/summary>/g, "<summary>Answer</summary><div>").replace(/<\/details>/g, "</div></details>")}</div>`);

// ---- WebGL page: the viewer as built, with the site masthead injected (a slim bar when the viewer fills the window)
const GL_EMBED_JS = `<script>if (location.search.includes("embed")) document.body.classList.add("embed");</script>`;
let glOut = glHtml.replace("</title>", `</title>${FONTS}`);
if (glOut.includes('<main class="iso-page">')) {
  glOut = glOut.replace('<main class="iso-page">', `<style>${SHELL_CSS}
body:not(.embed) .iso-page{width:min(1200px,100% - 32px);margin-top:28px}
body.embed .sb-mast,body.embed .iso-legend,body.embed h1,body.embed .sb-kicker,body.embed .sb-lead,body.embed .sb-note{display:none}
html:has(body.embed),body.embed{height:100%;overflow:hidden}
body.embed .iso-page{margin:0 auto;width:100%;height:100%;display:flex;flex-direction:column}
body.embed .sb-figures{flex:1;display:flex;flex-direction:column;gap:0;min-height:0;margin:0}
body.embed .sb-figures>figure:first-child{flex:1;display:flex;flex-direction:column;min-height:0;margin:0}
body.embed .sb-figures>figure:not(:first-child){display:none}
body.embed .iso-plate{flex:1;display:flex;flex-direction:column;min-height:0;padding:0 0 10px;border-radius:0;box-shadow:none;background:transparent}
body.embed .iso-plate-corners{display:none}
body.embed .sb-gl-stage{flex:1;aspect-ratio:auto;min-height:240px;height:auto}</style><main class="iso-page">${nav("webgl.html")}`);
} else {
  // full-window viewer: masthead as a 64 px bar above it; hidden (with the viewer's own title) when embedded
  glOut = glOut.replace(/<body([^>]*)>/, `<body$1><style>${SHELL_CSS}
.sb-glbar{box-sizing:border-box;height:64px;padding:0 24px;border-bottom:1.5px solid var(--anatomy-strong);background:var(--anatomy-page);position:relative;z-index:30}
.sb-glbar .sb-mast{margin:0;height:100%;container-type:normal}
.sb-glbar .sb-mast-top{height:100%;padding:0;align-items:center;border:0}
.sb-glbar .sb-nav{display:none}.sb-glbar .sb-public-links{display:none!important}.sb-glbar .sb-navm{display:block}
body:not(.embed) .sbx{height:calc(100vh - 64px);height:calc(100dvh - 64px)}
body.embed .sb-glbar,body.embed .sbx-head h1,body.embed .sbx-meta{display:none}
@media (max-width:820px){body:not(.embed) .sbx{height:auto}}
@media (max-width:760px){.sb-glbar{padding:0 16px}}</style><div class="sb-glbar">${nav("webgl.html")}</div>`);
}
if (!NO_WRITE) writeFileSync(join(OUT, "webgl.html"), glOut.replace("</body>", `${GL_EMBED_JS}</body>`));

// ---- Index
const idx = { file: "index.html", title: "The ShopBot PRSalpha 144-60", noHead: true };
const where = [
  ["Before your induction", "01 Rules", "rules.html"],
  ["Learning how it works", "02 The machine", "machine.html"],
  ["Standing at the machine, about to cut", "05 Pre-flight", "preflight.html"],
  ["It stopped, or the cut went wrong", "06 Something’s wrong", "trouble.html", "danger"],
  ["Choosing feeds, posting a file", "07 Feeds & CAM", "feeds.html"],
];
page(idx, -1, `<header class="sb-hero"><div><div class="sb-kicker"><span>00</span>A teaching site for the prototyping lab</div><h1>The ShopBot PRSalpha <em>144-60</em></h1><p class="sb-lead">How it works, how to run it, what goes wrong.</p><a class="sb-cta" href="rules.html">New here? Start with the rules <i>→</i></a></div>
<nav class="sb-where" aria-label="Where are you now?"><div class="sb-where-h">Where are you now?</div>${where.map(([w, p, href, cls]) => `<a href="${href}"${cls ? ` class="${cls}"` : ""}><b>${w}</b><span>${p}</span></a>`).join("")}</nav></header>
${sec("Before anything else", "Two ways to stop it", "", `<div class="sb-stops-teaser"><figure>${V.spacebar()}<figcaption><b>Spacebar — routine stop</b>Motion ramps down, position is kept. Treat the spindle as live.</figcaption></figure><figure>${V.pendant()}<figcaption><b>E-stop — something is wrong</b>Spindle power off at once. Position is lost: Reset, <code>C3</code>, <code>C2</code>. <a href="rules.html#stops">How to stop, in full</a>.</figcaption></figure></div>`)}
${sec("The route", "Your first time, in six pages", "Read them in this order before your first job. Then the pre-flight sheet does the remembering for you.", V.flow([
  { title: "Rules", text: "Before the induction.", href: "rules.html" },
  { title: "The machine", text: "Turn the model; play the ten faults from its side panel.", href: "machine.html" },
  { title: "Run a job", text: "Eleven steps. Read once, then use the pre-flight.", href: "run.html" },
  { title: "Zeroing", text: "Three zeros; the first-week crash.", href: "zero.html" },
  { title: "Pre-flight", text: "Printed, at the machine, every job.", href: "preflight.html" },
  { title: "Sign-off", text: "Twelve questions, with answers.", href: "quiz.html" },
]))}
${sec("Contents", "The whole site", "", `<ol class="sb-toc">${PAGES.map((p) => `<li><a href="${p.file}"><span class="n">${p.n}</span><b>${p.nav}</b><span>${p.sub}</span></a></li>`).join("")}<li><a href="webgl.html"><span class="n">3D</span><b>3D model, full screen</b><span>Orbit, zoom and follow the tool through the posted job.</span></a></li></ol>`)}
`);

if (!NO_WRITE) console.log("wrote", OUT, PAGES.length + 2, "pages");
