// Assembles the teaching wiki page: figure + explainer + procedures + troubleshooting + reference.
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import * as k from "../../kit/iso-kit.mjs";
import { PROSE_CSS, AFTER_FIGURE, MAINTENANCE, FAULTS_DOC, SOURCES, faultsHtml } from "./prose.mjs";
import { SAFETY, SYMPTOMS, FEEDS, CAM, QUIZ, PREFLIGHT, FIRSTJOB, CALL_STAFF, LAB_SOURCES } from "./wiki-content.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const THEME = process.argv.includes("--light") ? "light" : "dark";
const rawFigure = readFileSync(join(HERE, THEME === "light" ? "fragment-figure-light.html" : "fragment-figure.html"), "utf8");
const PRINT = process.argv.includes("--print");
const figure = PRINT ? rawFigure
  .replace(/<div class="sb-transport"[\s\S]*?<\/div>/, "")
  .replace(/<div class="sb-faults"[\s\S]*?<\/div>/, "")
  .replace(/Press Run to cut[\s\S]*?what cures it\./, "The figures are static illustrations. The online 3D model runs a 600 × 400 mm profile and a 300 × 200 mm pocket in an 18 mm plywood sheet and demonstrates ten faults.")
  .replace(/aria-label="ShopBot PRSalpha CNC router\.[^"]*"/, 'aria-label="Static illustration of the ShopBot PRSalpha CNC router"')
  .replace("The cut: the groove the bit leaves in the sheet, live from the toolpath", "The cut: the groove the bit leaves in the sheet")
  .replace(/The camera is fixed to the spindle,[^`]*?disappears into the sheet\./, "The tool detail shows the spindle nose, collet and cutter above the sheet.")
  : rawFigure;
const script = readFileSync(join(HERE, "fragment-script.js"), "utf8");
const procPath = join(HERE, "..", "..", "research", "procedures.md");
const procedures = existsSync(procPath) ? readFileSync(procPath, "utf8") : "";

// ---------------------------------------------------------------- tiny markdown → html (headings, lists, tables, para, inline)
const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
function inline(s) {
  return esc(s)
    .replace(/`([^`]+)`/g, "<code>$1</code>")
    .replace(/\*\*([^*]+)\*\*/g, "<b>$1</b>")
    .replace(/(^|[^*])\*([^*\n]+)\*/g, "$1<i>$2</i>")
    .replace(/\[((?:(?:[A-Z]{2} p\.?\s?[0-9A-Za-z–-]+|R)\s*;?\s*)+)\]/g, (m, body) => '<span class="sb-cite">[' + body.replace(/\s*;\s*/g, "; ").replace(/ p\.?\s?/g, " ").trim() + ']</span>')
;
}
function md(text, { shift = 0 } = {}) {
  const lines = text.replace(/\r/g, "").split("\n");
  const out = [];
  let i = 0;
  const flushPara = (buf) => { if (buf.length) out.push(`<p>${inline(buf.join(" "))}</p>`); buf.length = 0; };
  const para = [];
  while (i < lines.length) {
    const l = lines[i];
    if (/^\s*$/.test(l)) { flushPara(para); i++; continue; }
    const h = l.match(/^(#{1,4})\s+(.*)$/);
    if (h) { flushPara(para); const lvl = Math.min(6, h[1].length + shift); const t = h[2].replace(/^\d+[.)]\s*/, ""); out.push(`<h${lvl} id="${slug(t)}">${inline(t)}</h${lvl}>`); i++; continue; }
    if (/^\s*\|/.test(l)) {
      flushPara(para);
      const rows = [];
      while (i < lines.length && /^\s*\|/.test(lines[i])) { rows.push(lines[i]); i++; }
      const cells = (r) => r.trim().replace(/^\||\|$/g, "").split("|").map((c) => c.trim());
      const head = cells(rows[0]);
      const body = rows.slice(1).filter((r) => !/^\s*\|?\s*:?-{2,}/.test(r)).map(cells);
      out.push(`<table class="sb-mdtable"><thead><tr>${head.map((h) => `<th>${inline(h)}</th>`).join("")}</tr></thead><tbody>${body.map((r) => `<tr>${r.map((c) => `<td>${inline(c)}</td>`).join("")}</tr>`).join("")}</tbody></table>`);
      continue;
    }
    const li = l.match(/^(\s*)([-*]|\d+[.)])\s+(.*)$/);
    if (li) {
      flushPara(para);
      const ordered = /\d/.test(li[2]);
      const items = [];
      while (i < lines.length) {
        const m = lines[i].match(/^(\s*)([-*]|\d+[.)])\s+(.*)$/);
        if (m && m[1].length === li[1].length) { items.push(m[3]); i++; continue; }
        if (lines[i].match(/^\s{2,}\S/) && items.length && !lines[i].match(/^(\s*)([-*]|\d+[.)])\s+/)) { items[items.length - 1] += " " + lines[i].trim(); i++; continue; }
        if (lines[i].match(/^(\s+)([-*]|\d+[.)])\s+/) && lines[i].match(/^(\s+)/)[1].length > li[1].length) {
          // nested list: collect block and recurse
          const sub = [];
          while (i < lines.length && (lines[i].match(/^\s+\S/) || /^\s*$/.test(lines[i]) && lines[i + 1]?.match(/^\s+\S/))) { sub.push(lines[i]); i++; }
          items[items.length - 1] += "\u0000" + md(sub.map((s) => s.slice(li[1].length + 2)).join("\n"));
          continue;
        }
        break;
      }
      out.push(`<${ordered ? "ol" : "ul"}>${items.map((t) => { const [h, ...r] = t.split("\u0000"); return `<li>${inline(h)}${r.join("")}</li>`; }).join("")}</${ordered ? "ol" : "ul"}>`);
      continue;
    }
    if (/^>\s?/.test(l)) { flushPara(para); const q = []; while (i < lines.length && /^>\s?/.test(lines[i])) { q.push(lines[i].replace(/^>\s?/, "")); i++; } out.push(`<blockquote>${inline(q.join(" "))}</blockquote>`); continue; }
    para.push(l.trim());
    i++;
  }
  flushPara(para);
  return out.join("\n");
}
const slug = (t) => t.toLowerCase().replace(/<[^>]+>/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

// ---------------------------------------------------------------- procedures: split into the operating part and the reference part
let PROC_OPERATE = "", PROC_REFERENCE = "", PROC_MAINT = "", PROC_SAFETY = "";
if (procedures) {
  const parts = procedures.replace(/;:/g, ";").split(/^## /m).slice(1);
  const sec = (re) => parts.filter((p) => re.test(p.split("\n")[0])).map((p) => "## " + p).join("\n");
  PROC_SAFETY = sec(/^0\./);
  PROC_REFERENCE = sec(/glossary|command|input|output|LED|alarm|driver/i);
  PROC_MAINT = sec(/maintenance/i);
  PROC_OPERATE = sec(/^(?!0\.)(?!.*(glossary|command|input|output|LED|alarm|driver|maintenance)).*/i);
}
const stripFirstH3 = (html) => html.replace(/<h3[^>]*>[^<]*<\/h3>/, "");

// ---------------------------------------------------------------- numbering and TOC
const sections = [];
function section(id, title, html) { sections.push({ id, title, html }); }
const renumber = (html) => html.replace(/<h2( id="[^"]*")?>\s*\d+\s*·\s*/g, "<h2$1>");
const dropTitle = (html) => html.replace(/^\s*<h2[^>]*>[^<]*<\/h2>/, "");

section("rules", "Safety rules", dropTitle(SAFETY) + (PROC_SAFETY ? `<h3>ShopBot safety list (manuals)</h3>${stripFirstH3(md(PROC_SAFETY, { shift: 1 }))}` : ""));
section("machine", "The machine", `<p>The University's PRSalpha is a 12 × 5 ft moving-gantry router: the table stands still, a bridge carries the spindle along the table (X), a car carries it across the bridge (Y), and a plate lifts it (Z). Four closed-loop stepper motors turn pinions in racks; nothing is hydraulic, nothing is a ball screw. Each fault later in this document is one of these parts failing.</p><div class="sb-figure-wrap" id="fig-anatomy">${figure}</div><p class="sb-aside">Open the <a href="https://magnuspetursson.github.io/shopbot-prsalpha-wiki/webgl.html">online 3D model</a> to run the example job and view ten fault demonstrations.</p>${renumber(AFTER_FIGURE.split("<h2>3 · Failure modes</h2>")[0]).replace("<h2>The machine in numbers", "<h2>What it is, in numbers")}`);
section("procedures", "Standard procedures", PROC_OPERATE ? md(PROC_OPERATE, { shift: 1 }) : `<p class="sb-labpractice">Procedures section pending.</p>`);
section("firstjob", "Running a job, step by step", FIRSTJOB);
section("preflight", "Pre-flight checklist", PREFLIGHT);
section("symptoms", "Troubleshooting by symptom", dropTitle(SYMPTOMS).replaceAll("figure key", "online model key").replace("where the figure can act it out", "where the online model can demonstrate it") + `<h3 id="callstaff">When to stop and call staff</h3>${CALL_STAFF}`);
section("faults", "Failure modes", `<p>Each entry: what you see, why, what to do. Numbers in brackets are the sources at the end. Entries with a related online demonstration carry its keyboard shortcut.</p>${faultsHtml().replace(/<li>/g, (m, off, str) => { return m; })}`);
section("feeds", "Feeds, speeds and chipload", dropTitle(FEEDS));
section("cam", "CAM post-processing checklist", dropTitle(CAM));
section("maintenance", "Preventive maintenance", dropTitle(renumber(MAINTENANCE)).replace(/<h2>What this page does not know[\s\S]*$/, "") + (PROC_MAINT ? `<h3>Full published schedule</h3>${md(PROC_MAINT, { shift: 1 }).replace(/<h3[^>]*>[^<]*<\/h3>/, "")}` : ""));
section("reference", "Command and signal reference", PROC_REFERENCE ? md(PROC_REFERENCE, { shift: 1 }) : `<p class="sb-labpractice">Reference section pending.</p>`);
section("quiz", "Self-check before your first solo job", dropTitle(QUIZ).replace("Answer each question before opening its answer.", "Answer each question before reading its answer."));
section("sources", "Sources", `<ol class="sb-sources">${[...SOURCES, ...LAB_SOURCES].map(([n, label, url]) => `<li value="${n}">${label}${url ? ` — <a href="${url}">${url}</a>` : ""}</li>`).join("")}</ol><p class="sb-aside">Manual page tags in the procedures: AG Assembly Guide 2022 [2] · QS Quick Start 2016 [4] · UG User Guide 2015 [11] · CR Command Reference 2015 [10] · HD Holding Down 2016 [12] · MS Maintenance Schedule 2016 [13] · TM Troubleshooting Mechanicals 2014 [16] · XY Manually Setting XY Zero [47] · FAQ Z-zero plate [6].</p>`);

// give fault cards anchors E01…
let bodyHtml = sections.map((s, i) => `<section class="sb-sec" id="${s.id}"><h2 class="sb-h2" id="h-${s.id}"><span class="sb-secnum">${i + 1}</span>${s.title}</h2>${s.html.replace(/<h2( id="[^"]*")?>/g, "<h3>").replace(/<\/h2>/g, "</h3>")}</section>`).join("");
bodyHtml = bodyHtml.replace(/<li><span class="sb-fid">(E\d\d)/g, '<li id="$1"><span class="sb-fid">$1');
// the SAFETY/SYMPTOMS etc. came with their own h2 numbers; those are now h3 — strip their numbers
bodyHtml = bodyHtml.replace(/<h3( id="[^"]*")?>\s*\d+\s*·\s*/g, "<h3$1>");
// the figure's own h2 (none) fine. TOC:
const toc = `<nav class="sb-toc" aria-label="Contents"><div class="sb-toc-title">ShopBot PRSalpha 144-60</div><div class="sb-toc-sub">Operation, maintenance and troubleshooting</div><ol>${sections.map((s, i) => `<li><a href="#${s.id}"><span class="sb-secnum">${i + 1}</span>${s.title}</a></li>`).join("")}</ol><div class="sb-toc-foot">University of Iceland · prototyping lab · v1 · ${new Date().toISOString().slice(0, 10)}</div></nav>`;

const WIKI_CSS = `
.sb-wiki{display:grid;grid-template-columns:230px minmax(0,1fr);gap:40px;align-items:start}
.sb-toc{position:sticky;top:24px;font-size:13px;line-height:1.5;color:var(--anatomy-strong);max-height:calc(100vh - 48px);overflow:auto}
.sb-toc-title{font-weight:650;color:var(--anatomy-strong);font-size:15px}
.sb-toc-sub{color:var(--anatomy-muted);font-size:12px;margin-bottom:14px}
.sb-toc ol{list-style:none;margin:0;padding:0}
.sb-toc li{margin:0 0 6px}
.sb-toc a{color:var(--anatomy-text);filter:brightness(1.15);text-decoration:none;display:flex;gap:8px}
.sb-toc a:hover{color:var(--anatomy-strong)}
.sb-toc-foot{margin-top:18px;font-family:var(--anatomy-mono);font-size:10.5px;letter-spacing:.06em;text-transform:uppercase;color:var(--anatomy-muted)}
.sb-secnum{display:inline-block;min-width:1.6em;font-family:var(--anatomy-mono);font-size:11px;color:var(--anatomy-muted);letter-spacing:.04em}
.sb-doc .sb-h2{display:flex;align-items:baseline;gap:12px;font-size:22px;margin:56px 0 14px;padding-top:8px;border-top:1px solid var(--anatomy-faint)}
.sb-doc .sb-h2 .sb-secnum{font-size:13px}
.sb-sec:first-of-type .sb-h2{margin-top:12px;border-top:0}
.sb-doc h3{margin-top:26px}
.sb-doc h4{font-size:13.5px;color:var(--anatomy-strong);margin:16px 0 4px;font-weight:600}
.sb-rules li{margin:0 0 8px}
.sb-check li{margin:0 0 8px}
.sb-quiz li{margin:0 0 10px}
.sb-aside{color:var(--anatomy-muted);font-size:13px}
.sb-formula{font-family:var(--anatomy-mono);font-size:14px;color:var(--anatomy-strong);padding:10px 14px;border-radius:10px;background:var(--anatomy-card);box-shadow:var(--anatomy-lift);margin:10px 0 14px}
.sb-symptoms{display:grid;gap:8px;margin:12px 0}
.sb-sym{padding:10px 14px;border-radius:12px;background:var(--anatomy-card);box-shadow:var(--anatomy-lift);font-size:13.5px;color:var(--anatomy-strong)}
.sb-sym a{white-space:nowrap}
.sb-sym-h{color:var(--anatomy-strong);font-weight:600;margin-bottom:3px}
.sb-showfault{font-family:var(--anatomy-mono);font-size:11.5px;letter-spacing:.02em;margin-left:4px}
.sb-labpractice{color:var(--anatomy-red);font-weight:600}
.sb-doc .sb-cite{white-space:nowrap}
.sb-mdtable{border-collapse:collapse;width:100%;font-size:13px;margin:8px 0 16px}
.sb-mdtable th,.sb-mdtable td{text-align:left;vertical-align:top;padding:5px 10px 5px 0;border-bottom:1px solid var(--anatomy-faint)}
.sb-mdtable th{color:var(--anatomy-text);font-family:var(--anatomy-mono);font-size:11.5px;letter-spacing:.04em;font-weight:600}
.sb-mdtable code,.sb-doc code{font-family:var(--anatomy-mono);font-size:12px;color:var(--anatomy-strong);background:var(--anatomy-shade-1);padding:1px 5px;border-radius:5px}
.sb-doc blockquote{margin:10px 0;padding:8px 14px;border-left:2px solid var(--anatomy-lo);color:var(--anatomy-text)}
.sb-fault-list li:target,.sb-sec :target{scroll-margin-top:16px}
.sb-fault-list li:target{box-shadow:var(--anatomy-lift),0 0 0 1px var(--anatomy-mid)}
.sb-preflight{display:grid;grid-template-columns:1fr 1fr;gap:10px 24px;margin:12px 0}
.sb-pf-col h4{margin:8px 0 4px}
.sb-ticks{list-style:none;padding:0;margin:0;font-size:13.5px;color:var(--anatomy-strong)}
.sb-ticks li{position:relative;padding-left:24px;margin:0 0 5px}
.sb-ticks li::before{content:"";position:absolute;left:0;top:3px;width:12px;height:12px;border:1.5px solid var(--anatomy-muted);border-radius:3px}
@media (max-width:900px){.sb-wiki{grid-template-columns:1fr}.sb-toc{position:static;max-height:none;margin-bottom:20px}}.sb-box{padding:14px 18px;border-radius:14px;background:var(--anatomy-card);box-shadow:var(--anatomy-lift);margin:18px 0;border-left:3px solid var(--anatomy-mid)}
.sb-box-stop{border-left-color:var(--anatomy-red)}
.sb-box h4{margin:0 0 8px;font-size:14px}
.sb-box ol{margin:6px 0 0;padding-left:22px}
.sb-box ol li{margin:0 0 4px;color:var(--anatomy-strong)}
.sb-box .sb-table{display:block}
.sb-box .sb-table dt{font-family:var(--anatomy-sans,inherit);font-size:13.5px;letter-spacing:0;color:var(--anatomy-strong);font-weight:650;margin-top:10px}
.sb-box .sb-table dd{margin:2px 0 0;color:var(--anatomy-strong)}
.sb-doc h3{font-size:17px}
.sb-firstjob li{margin:0 0 8px;color:var(--anatomy-strong)}
.sb-quiz details{margin:4px 0 0;font-size:13px;color:var(--anatomy-text)}
.sb-quiz summary{cursor:pointer;color:var(--anatomy-muted);font-family:var(--anatomy-mono);font-size:11px;letter-spacing:.06em;text-transform:uppercase}
@media print{body{color:#222}.sb-doc,.sb-doc p,.sb-doc li,.sb-doc td,.sb-sym,.sb-ticks{color:#1a1a1a}.sb-doc .sb-cite,.sb-doc h4,.sb-mdtable th{color:#555}.sb-toc{position:static;max-height:none}.sb-wiki{display:block}.sb-preflight{grid-template-columns:1fr 1fr}#preflight{break-after:page}.sb-sec{break-before:page}.sb-sec:first-of-type{break-before:auto}.sb-fault-list li,.sb-sym,.sb-box{break-inside:avoid}.sb-quiz details{display:block}.sb-quiz>li{break-inside:avoid}.sb-sec h2,.sb-sec h3,.sb-sec h4{break-after:avoid}.sb-caption{break-inside:avoid}.sb-doc p{orphans:3;widows:3}.sb-transport,.sb-faults,.sb-views{display:none}}
`;
const WIKI_JS = `
const openAll = () => { for (const d of document.querySelectorAll('.sb-quiz details')) d.open = true; };
window.addEventListener('beforeprint', openAll);
if (window.matchMedia) { const mq = matchMedia('print'); if (mq.matches) openAll(); mq.addEventListener && mq.addEventListener('change', (e) => { if (e.matches) openAll(); }); }

for (const a of document.querySelectorAll('[data-show-fault]')) a.addEventListener('click', (e) => {
  const b = document.querySelector('[data-fault="' + a.dataset.showFault + '"]');
  if (b) { e.preventDefault(); document.getElementById('fig-anatomy').scrollIntoView({ behavior: 'smooth', block: 'start' }); setTimeout(() => { if (!b.hasAttribute('data-on')) b.click(); }, 350); }
});
const tocLinks = [...document.querySelectorAll('.sb-toc a')];
const secs = tocLinks.map((a) => document.querySelector(a.getAttribute('href')));
new IntersectionObserver((entries) => { for (const en of entries) if (en.isIntersecting) { const i = secs.indexOf(en.target); tocLinks.forEach((a, j) => a.style.color = j === i ? 'var(--anatomy-strong)' : ''); } }, { rootMargin: '-10% 0px -80% 0px' }).observe && secs.forEach((s) => s && new IntersectionObserver((entries) => { for (const en of entries) if (en.isIntersecting) { const i = secs.indexOf(en.target); tocLinks.forEach((a, j) => a.style.color = j === i ? 'var(--anatomy-strong)' : ''); } }, { rootMargin: '-10% 0px -80% 0px' }).observe(s));
`;
const intro = `<div class="sb-kicker">Teaching page · University of Iceland prototyping lab</div><h1>ShopBot PRSalpha 144-60: operation, maintenance and troubleshooting</h1><p class="sb-lead">Read sections 1, 2 and 4 before your induction; section 3 is the detail behind section 4. Print section 5 and keep it at the machine until the procedures are in your hands. When something goes wrong, go to section 6 and start from what you see. The figures in the PDF are static illustrations. The <a href="https://magnuspetursson.github.io/shopbot-prsalpha-wiki/webgl.html">online 3D model</a> demonstrates ten faults; all 39 are described in section 7.</p>`;
const body = `<style>${PROSE_CSS}${WIKI_CSS}</style><div class="sb-wiki">${toc}<article class="sb-doc">${intro}${bodyHtml}</article></div>`;
const page = k.pageHtml({ title: "ShopBot PRSalpha 144-60 — operation, maintenance and troubleshooting", theme: THEME, body, script: script + "\n" + WIKI_JS, width: 1060 });
const name = THEME === "light" ? "shopbot-wiki-light.html" : "shopbot-wiki.html";
writeFileSync(join(HERE, name), page);
console.log("wrote", name, `${(page.length / 1024).toFixed(0)} KB`, `${sections.length} sections`, procedures ? `procedures ${procedures.split("\n").length} lines` : "NO procedures.md yet");
