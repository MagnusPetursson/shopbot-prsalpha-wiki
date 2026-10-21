// Builds the printed student handbook: handbook.html (light, print-first, A4) -> shopbot-handbook.pdf.
// Content comes from the same modules as the site (site.mjs exports, visuals.mjs, wiki-content.mjs, prose.mjs,
// research/procedures.md); nothing is retyped here except captions for the 3D-viewer stills.
//   node handbook.mjs            -> handbook.html + shopbot-handbook.pdf (two passes: the second fills in page numbers)
//   node handbook.mjs --html     -> handbook.html only
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { execFileSync } from "node:child_process";

process.env.SB_NO_WRITE = "1";                       // reuse the site's pages without rewriting site/ or site-light/
if (!process.argv.includes("--light")) process.argv.push("--light");
const S = await import("./site.mjs");
const k = await import("../../kit/iso-kit.mjs");
const V = await import("./visuals.mjs");
const { PROSE_CSS, AFTER_FIGURE, MAINTENANCE, FAULTS_DOC } = await import("./prose.mjs");
const { CAM, QUIZ, CALL_STAFF } = await import("./wiki-content.mjs");

const HERE = dirname(fileURLToPath(import.meta.url));
const ASSETS = join(HERE, "print-assets");
const HTML_OUT = join(HERE, "handbook.html");
const PDF_OUT = join(HERE, "shopbot-handbook.pdf");
const CHROME = process.env.CHROME || "chromium";
const TODAY = new Date().toISOString().slice(0, 10);
const FOOT = "ShopBot PRSalpha 144-60 · Prototyping Lab, University of Iceland";

// ------------------------------------------------------------------ helpers
// drop @media blocks (screen breakpoints and the site's own print block) so the print layout below is the only one
function stripMedia(css) {
  let out = "", i = 0;
  while (i < css.length) {
    const j = css.indexOf("@media", i);
    if (j < 0) { out += css.slice(i); break; }
    out += css.slice(i, j);
    let depth = 0, n = css.indexOf("{", j);
    for (; n < css.length; n++) { if (css[n] === "{") depth++; else if (css[n] === "}" && --depth === 0) break; }
    i = n + 1;
  }
  return out;
}
// the one-page preflight print rules from the site (body.pf, inside its @media print), re-scoped to the handbook page
const PF_CSS = S.SITE_CSS.split("\n").filter((l) => /^\s*body\.pf /.test(l)).map((l) => l.trim().replace(/body\.pf /g, ".hb-pf ")).join("\n");
const dataUri = (file, mime) => `data:${mime};base64,${readFileSync(file).toString("base64")}`;
const fontCss = readFileSync(join(ASSETS, "fonts", "fonts.css"), "utf8").replace(/url\(([^)]+\.woff2)\)/g, (m, f) => `url(${dataUri(join(ASSETS, "fonts", f), "font/woff2")})`);
const img = (name) => dataUri(join(ASSETS, name + ".jpg"), "image/jpeg");
const openAll = (html) => html.replace(/<details(?![^>]*\sopen)/g, "<details open");
// site links point at other pages; in the handbook every target is in the same document (or not printable)
const localLinks = (html) => html
  .replace(/\s*·\s*<a class="sb-showfault" href="[^"]*"[^>]*>[^<]*<\/a>/g, "")
  .replace(/<a class="sb-showfault" href="[^"]*"[^>]*>([^<]*)<\/a>/g, "")
  .replace(/href="(?:rules|trouble|feeds|zero|run|maintain|machine|quiz|preflight)\.html#([^"]+)"/g, 'href="#$1"')
  .replace(/href="(?:rules|trouble|feeds|zero|run|maintain|machine|quiz|preflight)\.html"/g, (m) => `href="#ch-${m.match(/(\w+)\.html/)[1]}"`)
  .replace(/<a href="webgl\.html[^"]*">([^<]*)<\/a>/g, "$1");
const P = Object.fromEntries(S.PAGES.map((p) => [p.file.replace(".html", ""), { ...p }]));
// two page subtitles describe the web version; the printed book says what is on paper instead
P.machine.sub = "Four motors, three axes, one spindle. What each part does, and what the motors cannot see.";
P.maintain.title = "Looking after the machine";
P.maintain.sub = "The published schedule and why it matters here. Glossary, I/O table and sources are in the appendix.";
const cite = S.c;

// ------------------------------------------------------------------ chapters
const chapter = (key, inner, cls = "") => {
  const p = P[key];
  return `<section class="hb-ch ${cls}" id="ch-${key}"><header class="hb-chh"><div class="sb-kicker"><span>${p.n}</span>${p.nav}</div><h1>${p.title}</h1><p class="sb-lead">${p.sub}</p></header>${inner}</section>`;
};
const still = (name, cap, cls = "") => `<figure class="hb-still ${cls}"><img src="${img(name)}" alt=""><figcaption>${cap}</figcaption></figure>`;
const hsec = (eyebrow, title, intro, inner, cls = "") => `<section class="hb-sec ${cls}"><div class="sb-sec-h">${eyebrow ? `<span class="sb-eyebrow">${eyebrow}</span>` : ""}<h2>${title}</h2>${intro ? `<p>${intro}</p>` : ""}</div>${inner}</section>`;

// 01 Rules: ten rules, how to stop, how to start
const rules = chapter("rules", `<ol class="sb-tenrules">${S.RULES.map(([t, x]) => `<li><b>${t}</b><span>${x}</span></li>`).join("")}</ol>${S.stopsBox}${S.startBox}`);

// 02 Machine: the WebGL viewer becomes a captioned still; the spec line; how the mechanisms work; the numbers
const machine = chapter("machine", `<div class="hb-hero"><figure class="hb-still"><img src="${img("operator")}" alt=""></figure><div class="hb-hero-side"><p class="hb-cap"><b>The machine in 3D.</b> Still from the site's 3D model: table and spoilboard, the gantry (X bridge), the Y car carrying the spindle, the control PC and the wall pendant with the only <span class='nw'>E-stop</span>. Online the model turns and acts out ten faults; five are frozen in chapter 06.</p>${V.stats([["Sheet", "12 × 5 ft"], ["Travel", "153 × 61 in"], ["Motors", "4 closed-loop alphaStep"], ["Drive", "7.2 : 1, rack and pinion"], ["Rapid", "30 in/s · 760 mm/s"], ["Spindle", "12 000 rpm typical, 6–18k"], ["Resolution", "0.0004 in ≈ 0.01&nbsp;mm"]])}</div></div>
<p class="sb-aside hb-note"><b>Staff only, not part of the student course:</b> the rotary-axis chuck standing beside the table belongs to this machine but is not used in student jobs. Leave it alone; ask staff.</p>
${hsec("How it works", "How the mechanisms work", "", `<div class="hb-cols">${S.mech.replace(/^[\s\S]*?<h3>[^<]*How the mechanisms work<\/h3>/, "").replace(/<h3>Zeroing and homing<\/h3>[\s\S]*$/, "")}</div><p class="sb-aside hb-note">Zeroing and homing are chapter 04; dust extraction and hold-down are chapters 01 and 03.</p>`)}
${hsec("Reference", "The machine in numbers", "", S.numbersHtml, "hb-numbers")}`);

// 03 Run a job: the eleven-step strip and the two drawings from the manual section (the manual prose itself is cut)
const runBody = S.BODIES["run.html"].body;
const runFigs = runBody.match(/<figure class="sb-fig [\s\S]*?<\/figure>/g) || [];
const run = chapter("run", `${S.procHtml}${hsec("Two drawings", "Hold-down and the collet, in section", "Get these two right and most first-job crashes do not happen.", `<div class="hb-figpair">${runFigs.join("")}</div>`)}`);

// 04 Zeroing: the trio and the three figures (detail accordions cut)
const zeroBody = S.BODIES["zero.html"].body.replace(/<div class="sb-measure sb-group">[\s\S]*$/, "");
const zero = chapter("zero", zeroBody);

// 05 Pre-flight: exactly one A4 page, the site's body.pf print rules re-scoped
const preflight = `<section class="hb-ch hb-pf" id="ch-preflight"><header class="sb-phead"><div class="sb-kicker"><span>${P.preflight.n}</span>${P.preflight.nav}</div><h1>${P.preflight.title}</h1><span class="hb-tear">Tear-off sheet · keep it at the machine</span></header>
<div class="sb-pf-tools"><p class="sb-aside">${S.pfAside}</p></div>
<div class="sb-pf-fill"><span>Operator</span><span>Second person</span><span>Date</span><span>Job / file</span></div>${S.pfBody}</section>`;

// 06 Trouble: decision tree, fault stills, symptom index, call staff (the full fault table is Appendix A)
const beat = (n, t) => `<li><img src="${img("screw-b" + n)}" alt=""><span><b>${n}</b> ${t}</span></li>`;
const trouble = chapter("trouble", `<div class="sb-trouble-tree">${V.stoppedFlow()}</div>
<section class="hb-sec sb-staff" id="callstaff"><h2>${V.icon("alarm")}Stop and call staff when</h2>${CALL_STAFF}</section>
${hsec("Seen in the 3D model", "Five faults, frozen", "Stills from the site's 3D model, which acts out ten faults. The E-number leads to the row in Appendix A.", `<div class="hb-stills">
${still("zzero-shatter", "<b><a href=\"#E05\">E05</a> · C2 does not see the plate.</b> Input 1 stays dark, Z keeps driving down and the cutter shatters on the plate. Test input 1 before every C2.")}
${still("collet-slip", "<b><a href=\"#E10\">E10</a> · Bit slips in the collet.</b> 2.5 mm of slip turns an 18 mm cut into 20.5 mm. The motors cannot see it.")}
${still("part-fling", "<b><a href=\"#E22\">E22</a> · Part lifts off.</b> No tabs or onion skin: the freed part is thrown clear of the table and the bit snaps.")}
${still("usb-stopped", "<b><a href=\"#E02\">E02</a> · USB lost.</b> Motion stops but the spindle keeps turning and burns in one spot. Only the <span class='nw'>E-stop</span> kills it.")}
</div>
<figure class="hb-beats"><ol>${beat(1, "Screw on the toolpath, bit cutting at 12 000 rpm.")}${beat(2, "The CAM toolpath runs over the screw head.")}${beat(3, "Impact: carbide tip shatters, a bang like a gunshot.")}${beat(4, "Aftermath: broken shank, fragments, a chipped screw.")}</ol>
<figcaption><b><a href="#E39">E39</a> · Bit hits a hold-down screw</b>, in four beats (key S in the online 3D model). Check every screw and clamp against the toolpaths in CAM before you run.</figcaption></figure>`, "hb-frozen")}
${hsec("Index", "Start from what you see", "Find what you see, not what you suspect. Each card names the most likely causes in order and points to the fault entry (E-number) in Appendix A.", S.symHtml, "hb-symptoms")}`);

// 07 Feeds: the calculator as a static still at the worked example; table; rules of thumb; CAM checklist
const X = (v) => 12 + Math.min(1, v / 0.5) * 376, lo = 0.13 * 6 / 6.35, hi = 0.5 * 6 / 6.35;
const calcStill = V.chipCalc()
  .replace(/<input[^>]*>/g, "")
  .replace('<rect data-band x="12" y="24" width="0"', `<rect data-band x="${X(lo).toFixed(1)}" y="24" width="${(X(hi) - X(lo)).toFixed(1)}"`)
  .replace('transform="translate(12,0)"', `transform="translate(${X(0.15).toFixed(1)},0)"`)
  .replace('<div class="sb-calc-verdict" data-verdict></div>', '<div class="sb-calc-verdict">In range. Plunge at 2100 mm/min or less.</div>');
const thumbs = (S.feedsNotes.match(/<p><b>Rules of thumb\.[\s\S]*?<\/p>/) || [""])[0];
const feeds = chapter("feeds", `<figure class="hb-calc">${calcStill}<figcaption>The site's chipload calculator, frozen at the worked example: 6 mm two-flute, 14 000 rpm, 4200 mm/min.</figcaption></figure>
<div class="hb-cols hb-why">${S.feedsIntro}<div class="sb-formula">f<sub>z</sub> = feed ÷ (rpm × flutes)</div>${S.feedsWorked}${thumbs}</div>
${hsec("Starting points", "Used in Icelandic Fab Labs", "6 mm two-flute unless stated. Record the material, cutter, feed, rpm and any fault in your job notes and report problems to staff.", `<table class="sb-ftab"><colgroup><col style="width:17%"><col style="width:13%"><col style="width:8%"><col style="width:11%"><col style="width:10%"><col></colgroup><thead><tr><th>Material</th><th>Cutter</th><th>rpm</th><th>Feed mm/min</th><th>mm/tooth</th><th>Notes</th></tr></thead><tbody>${S.FEEDTAB.map(([m, cu, r, f, z, n]) => `<tr><td>${m}</td><td>${cu}</td><td class="num">${r}</td><td class="num">${f}</td><td class="num">${z}</td><td class="note">${n}</td></tr>`).join("")}</tbody></table>`)}
${hsec("Checklist", "From CAM to the machine", "", S.stripH2(CAM))}`);

// 08 Maintenance: calendar + why (the full published schedule is cut; glossary and I/O are Appendix B)
const maintain = chapter("maintain", `${V.maintGrid(S.maintCols)}${hsec("Why", "Why maintenance matters here", "", `<div class="hb-cols">${S.stripH2(MAINTENANCE).replace(/<h3>What this page does not know[\s\S]*$/, "")}</div>`)}
`);

// 09 Quiz, answers open
const quiz = chapter("quiz", openAll(S.relink(S.stripH2(QUIZ)).replace(/<summary>Answer<\/summary>/g, "<summary>Answer</summary><div>").replace(/<\/details>/g, "</div></details>")));

// Appendix: A faults E01-E39, B glossary, C sources  (9.5 pt, two columns)
const fnum = (id) => Number(id.slice(1));
const faults = [...FAULTS_DOC].sort((a, b) => fnum(a[0]) - fnum(b[0])).map(([id, key, title, sym, cause, cure, refs]) =>
  `<div class="hb-f" id="${id}"><div class="hb-fh"><span class="hb-fid">${id}</span><b>${title}</b>${cite(...refs)}${key ? `<span class="hb-fkey">3D key ${key}</span>` : ""}</div><p><span class="lab">See</span>${sym}</p><p><span class="lab">Why</span>${cause}</p><p><span class="lab">Do</span>${cure}</p></div>`).join("");
const glossary = S.proc(/^11\./);
// printed form of a source URL: the host only (the PDF link keeps the full address)
const shortUrl = (u) => { const m = u.match(/^https?:\/\/(?:www\.)?([^/]+)/); return m ? m[1] : u; };
const appendix = `<section class="hb-ch hb-app" id="ch-appendix"><header class="hb-chh"><div class="sb-kicker"><span>A–C</span>Appendix</div><h1>Reference</h1><p class="sb-lead">The full fault table, the command glossary and the sources. Look things up here; learn them from the chapters.</p></header>
<section class="hb-asec" id="faults"><h2><span>A</span>All 39 failure modes</h2><p class="hb-aintro">What you see, why, what to do. Faults the 3D model can act out carry their key. Numbers in brackets are sources (Appendix C).</p><div class="hb-acols">${faults}</div></section>
<section class="hb-asec" id="glossary"><h2><span>B</span>Command glossary</h2><div class="hb-acols hb-gloss">${glossary}</div><h3 class="hb-ah3" id="io">Inputs, outputs and status LEDs</h3><div class="hb-acols hb-io">${S.proc(/^12\./)}</div></section>
<section class="hb-asec" id="sources"><h2><span>C</span>Sources</h2><div class="hb-acols">${S.allSources.replace(/<a href="([^"]+)">[^<]+<\/a>/g, (m, u) => `<a href="${u}">${shortUrl(u)}</a>`)}</div></section></section>`;

// ------------------------------------------------------------------ cover + contents
const identity = (AFTER_FIGURE.match(/This machine's control box:[\s\S]*?SB3 version [\d.]+\./) || [""])[0];
const TOC = [["rules"], ["machine"], ["run"], ["zero"], ["preflight"], ["trouble"], ["feeds"], ["maintain"], ["quiz"]]
  .map(([key]) => ({ id: `ch-${key}`, n: P[key].n, label: P[key].nav, find: P[key].title }))
  .concat([{ id: "faults", n: "A", label: "All 39 failure modes", find: "All 39 failure modes" }, { id: "glossary", n: "B", label: "Command glossary", find: "Command glossary" },
    { id: "sources", n: "C", label: "Sources", find: "\nC Sources", exact: "Sources" }]);
const cover = (pages) => `<section class="hb-cover"><div class="hb-cover-top"><div class="sb-kicker"><span>Handbook</span>For first-course students</div>
<h1>The ShopBot PRSalpha <em>144-60</em></h1><p class="sb-lead">How it works, how to run it, what goes wrong. The printed companion to the lab's teaching site.</p></div>
<div class="hb-cover-meta"><div><span>Lab</span>Prototyping Lab, University of Iceland</div><div><span>Date</span>${TODAY}</div><div><span>Version</span>Handbook 2 · this machine: ${identity.replace(/^This machine's control box: /, "").replace(/Model# (\d+)/, '<span class="nw">Model# $1</span>').replace(/SB3 version ([\d.]+)/, '<span class="nw">SB3 version $1</span>')}</div></div>
<nav class="hb-toc" aria-label="Contents"><div class="hb-toc-h">Contents</div><ol>${TOC.map((t) => `<li><a href="#${t.id}"><span class="n">${t.n}</span><b>${t.label}</b><span class="pg">${pages?.[t.id] ?? ""}</span></a></li>`).join("")}</ol></nav>
<p class="hb-cover-foot">References: Appendix C. Read chapters 01–05 before your induction, tear out the pre-flight sheet (page ${pages?.["ch-preflight"] ?? "—"}) and keep it at the machine.</p></section>`;

// ------------------------------------------------------------------ print CSS
const HB_CSS = `
@page{size:A4;margin:14mm 14mm 16mm;
  @bottom-left{content:"${FOOT}";font:400 7.5pt/1 "IBM Plex Sans",sans-serif;color:#6c6c71;vertical-align:top;padding-top:4mm}
  @bottom-right{content:counter(page) " / " counter(pages);font:500 7.5pt/1 "IBM Plex Mono",monospace;color:#18181a;vertical-align:top;padding-top:4mm}}
@page:first{@bottom-left{content:none}@bottom-right{content:none}}
/* kit PAGE_CSS sets html{color-scheme:dark}, which paints the @page margin area dark in Chrome print */
html{color-scheme:light}
html,body{background:#fff}
body.iso[data-theme=light]{--anatomy-page:#fff;--anatomy-card:#f4f4f1;--anatomy-text:#2e2e33;--anatomy-strong:#111114;--anatomy-muted:#66666b;--anatomy-faint:#cfcfd2;--anatomy-shade-2:#efefec;-webkit-print-color-adjust:exact;print-color-adjust:exact}
body.iso{font-size:10pt;line-height:1.45}
.iso-page{width:auto!important;margin:0!important}
.sb-doc{font-size:10pt;line-height:1.45;color:var(--anatomy-text)}
.sb-doc p{margin:0 0 2.2mm}
.sb-doc li{margin:0 0 1mm}
.sb-doc code{font-size:.9em;padding:0 3px}
.sb-doc .sb-cite{font-size:6.5pt}
.sb-doc h2{font-size:15pt;margin:0 0 2mm}
.sb-doc h3{font-size:10.5pt;margin:3.5mm 0 1.2mm}
.sb-doc h4{font-size:10pt;margin:3mm 0 1mm}
.sb-doc a{color:inherit;text-decoration:none}
h1,h2,h3,h4,.sb-sec-h,.hb-chh,.sb-panel-h,.sb-eyebrow,summary{break-after:avoid;page-break-after:avoid}
p,li{orphans:3;widows:3}
.hb-key{font-family:var(--sb-sans);font-size:8.5pt;color:var(--anatomy-muted);white-space:nowrap}

/* chapters */
.hb-ch{break-before:page}
.hb-chh{margin:0 0 6mm;padding:0 0 4mm;border-bottom:1.5px solid var(--anatomy-strong)}
.sb-kicker{font-size:8pt;margin:0 0 3mm}
.sb-kicker span{font-size:8pt}
.hb-chh h1{font-size:27pt;line-height:1.05;margin:0 0 2mm;letter-spacing:-.02em}
.sb-lead{font-size:12.5pt;max-width:60ch}
.hb-sec{margin:6mm 0 0}
.sb-sec-h{margin:0 0 3.5mm;padding-top:2.5mm}
.sb-sec-h p{font-size:10pt}
.sb-eyebrow{font-size:7.5pt}
.sb-aside{font-size:9.5pt}
.hb-cols{columns:2;column-gap:7mm;font-size:9.6pt}
.hb-cols>h3:first-child{margin-top:0}
.hb-cols h3{break-after:avoid}
.hb-cols p{break-inside:auto}

/* figures, cards, steps: never split */
figure,.sb-fig,.hb-still,.hb-beats,.sb-panel,.sb-step,.sb-sym,.sb-tenrules li,.sb-cal-col,.sb-check li,.sb-quiz>li,.hb-f,.sb-pf-col,.sb-trio a,.sb-staff,.sb-tree,.hb-calc,.sb-specrow,tr,.sb-seq li,.sb-crash-cap>div,.sb-sources li,.sb-table dd{break-inside:avoid;page-break-inside:avoid}
.sb-fig-art{padding:3mm 0 2.5mm}
.sb-callouts{margin:2.5mm 0 0;gap:1.2mm 6mm;font-size:9pt;grid-template-columns:repeat(2,minmax(0,1fr))}
.sb-callouts li{grid-template-columns:5mm 1fr;gap:2mm;margin:0}
.sb-callout-n{width:4.2mm;height:4.2mm;font-size:7pt;transform:translateY(.6mm)}
.sb-fig-t{font-size:7.5pt;margin:0 0 1.5mm}
.hb-still{margin:0}
.hb-still img{display:block;width:100%;height:auto;border:.5pt solid var(--anatomy-faint)}
.hb-still figcaption{font-size:9pt;line-height:1.4;margin:1.8mm 0 0;color:var(--anatomy-text)}
.hb-still figcaption b{color:var(--anatomy-strong)}
.hb-hero{display:grid;grid-template-columns:104mm minmax(0,1fr);gap:5mm;align-items:start;margin:0 0 3mm;break-inside:avoid}
.hb-hero img{height:66mm;object-fit:cover;object-position:50% 40%}
.hb-cap{font-size:9pt;line-height:1.38;margin:0 0 2.5mm!important}
.hb-hero-side .sb-spec{grid-template-columns:1fr;gap:0;border-top:1.5px solid var(--anatomy-strong)}
.hb-hero-side .sb-spec>div{flex-direction:row;align-items:baseline;gap:2mm;padding:1.1mm 0;border-bottom:1px solid var(--anatomy-faint)}
.hb-hero-side .sb-spec dt{flex:0 0 21mm;font-size:6.8pt}
.hb-hero-side .sb-spec dd{font-size:9pt;line-height:1.25;text-wrap:wrap}

/* 01 rules */
.sb-tenrules{margin:0 0 6mm;column-gap:8mm}
.sb-tenrules li{grid-template-columns:10mm minmax(0,1fr);column-gap:2mm;padding:2.6mm 0 2.8mm}
.sb-tenrules li::before{font-size:22pt}
.sb-tenrules b{font-size:11.5pt}
.sb-tenrules li>span{margin-top:.8mm;font-size:9.5pt;line-height:1.4}
.sb-panel{margin:0 0 5mm;padding:5mm 6mm 5mm}
.sb-panel h2{font-size:17pt}
.sb-panel-h .sb-icon{width:6mm;height:6mm}
.sb-panel-sub{font-size:11pt;margin:0 0 3.5mm}
.sb-stopgrid>div{padding:0 5mm 0 0}.sb-stopgrid>div+div{padding:0 0 0 5mm}
.sb-stopgrid .sb-vis{max-width:62mm;margin:0 0 3mm}
.sb-stopgrid h3{font-size:13pt}
.sb-stopgrid .what{font-size:7.5pt;margin:0 0 1.5mm}
.sb-stopgrid p{font-size:9.5pt}
.sb-panel-start .sb-seq{margin:2mm 0 0}
.sb-seq li{padding:4mm 3mm 0 0;gap:1mm}
.sb-seq-n{font-size:20pt}
.sb-seq-t{font-size:10pt}
.sb-seq-x{font-size:9pt;line-height:1.35}

/* 02 machine */
.sb-specrow{margin:4mm 0 3mm;padding:3mm 0}
.sb-spec{grid-template-columns:repeat(7,minmax(0,1fr));gap:2mm 3mm}
.sb-spec dt{font-size:6.5pt;line-height:1.2}
.sb-spec dd{font-size:9pt}
.hb-note{margin:0 0 2mm}
.hb-numbers .sb-table{display:block;columns:2;column-gap:7mm;font-size:9.3pt;margin:0}
.hb-numbers .sb-table dt{border-top:1px solid var(--anatomy-faint);break-after:avoid}
.hb-numbers .sb-table dd{border-top:0;padding-top:0!important;break-before:avoid}
.hb-numbers .sb-table dt{font-size:8pt;padding:1.4mm 0 .4mm}
.hb-numbers .sb-table dd{padding:1.4mm 0}

/* 03 run */
.sb-proc{margin:0}
.sb-phase{grid-template-columns:28mm minmax(0,1fr)}
.sb-phase-h{padding:3mm 3mm 0 0;font-size:7.5pt}
.sb-step{grid-template-columns:10mm minmax(0,1fr) 38mm;column-gap:3mm;padding:2.6mm 0}
.sb-step-n{font-size:19pt}
.sb-step-t{font-size:11.5pt;margin:0 0 .6mm}
.sb-step-x{font-size:9.5pt;line-height:1.4}
.sb-step-cmd{gap:1.2mm;padding-top:.6mm}
.sb-step-cmd code{font-size:8pt;padding:.4mm 1.4mm}
.hb-figpair{display:grid;grid-template-columns:1fr;gap:5mm}
.hb-figpair .sb-fig{display:grid;grid-template-columns:78mm minmax(0,1fr);column-gap:6mm;align-items:start}
.hb-figpair .sb-fig-t{grid-column:1/-1}
.hb-figpair .sb-callouts{grid-template-columns:1fr;margin:0;align-self:center}

/* 04 zero */
.sb-trio{margin:0 0 6mm}
.sb-trio a{padding:3mm 4mm 3.5mm;gap:1mm}
.sb-trio .cmd{font-size:18pt}
.sb-trio b{font-size:12.5pt}
.sb-trio span{font-size:9.5pt}
#ch-zero .sb-sec{margin:0 0 5mm}
#ch-zero .sb-sec-h p{max-width:none;font-size:9.5pt}
.sb-zero-fig .sb-vis{max-width:150mm}
#home .sb-zero-fig .sb-vis{max-width:118mm}
#z .sb-zero-fig .sb-vis{max-width:118mm}
.sb-crash-cap{gap:2mm 6mm;margin:2mm 0 0;font-size:9pt}
.sb-crash-cap b{font-size:10.5pt}

/* 05 preflight: the site's body.pf rules, re-scoped */
.hb-pf .sb-phead{margin:0 0 4mm}
.hb-pf .sb-phead .sb-kicker{display:none}
.hb-tear{font:600 7.5pt/1 var(--sb-sans);letter-spacing:.14em;text-transform:uppercase;color:var(--anatomy-muted);margin-left:auto}
.hb-pf .sb-pf-tools .sb-aside{max-width:none}
.hb-pf .sb-ticks li::before{content:""}
${PF_CSS}
.hb-pf .sb-preflight{columns:2;column-gap:7mm}
/* the site's sheet is set for 10 mm margins; with the handbook's 14 mm margins and footer it needs a slightly tighter tick list */
.hb-pf .sb-ticks{font-size:9.8pt}
.hb-pf .sb-ticks li{padding:.75mm 0 .75mm 6.5mm;line-height:1.27}
.hb-pf .sb-ticks li::before{width:3.6mm;height:3.6mm;top:1mm}
.hb-pf .sb-pf-col{padding:1.2mm 0 2mm}
.hb-pf .sb-pf-col h4::before{font-size:15pt}

/* 06 trouble */
.sb-trouble-tree{margin:0 0 6mm}
.sb-tree{font-size:9pt}
.sb-tree-root{font-size:12.5pt;padding:2mm 4mm}
.sb-tree-branches{gap:4mm;padding-top:8mm}
.sb-tree-branches::before{top:4mm;left:calc((100% - 8mm) / 6);right:calc((100% - 8mm) / 6)}
.sb-tree-root::after{height:4mm}
.sb-branch::before{top:-4mm;height:4mm}
.sb-branch::after{bottom:-5mm;height:5mm}
.sb-tree-q,.sb-tree-a{padding:2mm 3mm}
.sb-tree-q span,.sb-tree-a span{font-size:9pt}
.sb-tree-a{margin-top:5mm}.sb-tree-a::before{top:-5mm;height:5mm}.sb-tree-a::after{top:-4mm;font-size:7pt}
.sb-tree-a a{font-size:9pt}
.sb-tree-end{margin-top:5mm;padding:2.5mm 4mm}.sb-tree-end b{font-size:11pt;margin:0 0 1mm}
.sb-chain{line-height:1.7}
.sb-tree-staff{margin-top:5mm;padding:2mm 3mm}.sb-tree-staff::before{top:-5.2mm;height:5mm}
/* chapter 06 = three pages: tree + staff box | stills + beats | the whole symptom index */
.hb-frozen{break-inside:avoid}
.hb-symptoms{break-before:page;margin-top:0}
.hb-symptoms>.sb-sec-h{margin-bottom:2mm;padding-top:0}
.hb-symptoms>.sb-sec-h p{margin:0;font-size:9pt}
.hb-symptoms>.sb-sec-h .sb-eyebrow{display:none}
.hb-symptoms .sb-symptoms{margin:0}
.hb-stills{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:4mm 6mm}
.hb-stills img{aspect-ratio:16/9;object-fit:cover;object-position:50% 58%}
.hb-beats{margin:5mm 0 0}
.hb-beats ol{list-style:none;margin:0;padding:0;display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:3mm}
.hb-beats li{margin:0}
.hb-beats img{display:block;width:100%;aspect-ratio:1/1;object-fit:cover;border:.5pt solid var(--anatomy-faint)}
.hb-beats li span{display:block;font-size:9pt;line-height:1.35;margin-top:1.2mm}
.hb-beats li span b{font:400 12pt/1 var(--sb-serif);color:var(--anatomy-strong);margin-right:1mm}
.hb-beats figcaption{font-size:9pt;margin-top:2mm}
.sb-symptoms{margin:0}
.hb-symptoms .sb-symptoms{columns:2;column-gap:7mm;border-top:1.5px solid var(--anatomy-strong)}
.sb-sym{display:block;padding:1.1mm 0 1.2mm;font-size:9pt;line-height:1.27}
.sb-sym-h{font-size:9.3pt;line-height:1.25;margin:0 0 .3mm}
.sb-sym a{font-size:9pt}
.sb-staff{margin:5mm 0 0;padding:3mm 5mm 1.5mm}
.sb-staff h2{font-size:15pt;margin:0}
.sb-staff .sb-icon{width:6mm;height:6mm}
.sb-staff p{font-size:9.2pt;margin:1.5mm 0 0}
.sb-staff ul{column-gap:6mm;margin:2mm 0 0}
.sb-staff li{padding:1mm 0;font-size:9.2pt;line-height:1.35}

/* 07 feeds */
.hb-calc{margin:0 0 5mm}
.hb-calc figcaption{font-size:9pt;color:var(--anatomy-muted);margin-top:1.5mm}
.sb-calc-in{padding:2mm 6mm 3mm 0}
.sb-calc-row{grid-template-columns:1fr auto auto;padding:2.2mm 0;border-bottom:1px solid var(--anatomy-faint)}
.sb-calc-row label{font-size:10pt}
.sb-calc-row output{font-size:13pt}
.sb-calc-row .u{font-size:8.5pt;min-width:14mm}
.sb-calc-out{padding:3.5mm 0 3mm 6mm}
.sb-calc-k{font-size:7.5pt}
.sb-calc-v{margin:2mm 0 1mm}
.sb-calc-v [data-chip]{font-size:34pt}
.sb-calc-verdict{font-size:10.5pt;min-height:0}
.sb-calc-f{font-size:11pt;padding-top:2mm}
.sb-calc-note{font-size:9pt;margin:2mm 0 2.5mm!important}
.sb-formula{font:400 12pt/1.3 var(--sb-serif);font-style:italic;color:var(--anatomy-strong);margin:1mm 0 2.5mm;break-inside:avoid}
.sb-ftab{font-size:9pt;margin:0}
.sb-ftab th{font-size:7pt;padding:1.5mm 2.5mm 1.5mm 0}
.sb-ftab td{padding:1.8mm 2.5mm 1.8mm 0}
.sb-ftab td.num{font-size:9pt}
.sb-ftab td.note{font-size:9pt}
.sb-check{margin:0;max-width:none;columns:2;column-gap:7mm}
.sb-check li{padding:2mm 0 2mm 8mm;font-size:9.5pt;line-height:1.4}
.sb-check li::before{width:6mm;top:1.8mm;font-size:14pt}

/* 08 maintenance */
.sb-cal-col{padding:2.5mm 3mm 3mm}
.sb-cal-h{font-size:11.5pt;margin:0 0 2mm}
.sb-cal ul{font-size:9.3pt}
.sb-cal li{padding:1.4mm 0;line-height:1.38}
.sb-doc .sb-note-box{font-size:9.5pt;padding:2.5mm 3.5mm;margin:2mm 0;break-inside:avoid}
.hb-io .sb-mdtable{font-size:9.3pt}
.sb-mdtable{margin:0 0 2mm}
.sb-mdtable th{font-size:7pt;padding:1.4mm 3mm 1.4mm 0}
.sb-mdtable td{padding:1.4mm 3mm 1.4mm 0}
.hb-io ul{font-size:9.5pt;padding-left:4mm}
.hb-ah3{font-size:10.5pt!important;margin:4mm 0 1.5mm!important}
.hb-io .sb-mdtable td:last-child{font-family:var(--anatomy-mono);font-size:7.5pt;color:var(--anatomy-muted)}
.hb-io .sb-mdtable thead{display:none}
.hb-io .sb-mdtable td:first-child{white-space:nowrap;color:var(--anatomy-strong)}
.hb-io h4,.hb-io h3{margin:2mm 0 1mm}

/* 09 quiz */
.sb-quiz{max-width:none;columns:2;column-gap:7mm}
.sb-quiz>li{padding:2.2mm 0 2.2mm 8mm;font-size:10.3pt;line-height:1.36}
.sb-quiz>li::before{top:2mm;width:6mm;font-size:15pt}
.sb-quiz details{margin:1mm 0 0;font-size:9.2pt;line-height:1.38}
.sb-quiz summary{display:none}
.sb-quiz details[open]>:not(summary){margin:0;padding:1.2mm 0 0 3mm;border-top:0;border-left:1.5pt solid var(--anatomy-faint);max-width:none}
.sb-quiz details>div::before{content:"Answer · ";font:600 7.5pt/1 var(--sb-sans);letter-spacing:.12em;text-transform:uppercase;color:var(--anatomy-muted)}
.sb-quiz>li>p{margin:0}

/* appendix: 9.5 pt, two columns */
.hb-app{font-size:9.5pt;line-height:1.33}
.hb-asec{margin:0 0 5mm}
.hb-asec+.hb-asec{margin-top:6mm}
.hb-asec>h2{display:flex;gap:3mm;align-items:baseline;font-size:15pt;margin:0 0 1.5mm;padding-top:2mm;border-top:1.5px solid var(--anatomy-strong)}
.hb-asec>h2 span{font:500 9pt/1 var(--anatomy-mono);color:var(--anatomy-muted)}
.hb-aintro{font-size:9.5pt;margin:0 0 3mm!important}
.hb-acols{columns:2;column-gap:7mm;font-size:9.5pt}
.hb-f{padding:1.4mm 0 1.2mm;border-top:.5pt solid var(--anatomy-faint)}
.hb-fh{display:flex;flex-wrap:wrap;gap:0 2mm;align-items:baseline;margin:0 0 .6mm;color:var(--anatomy-strong)}
.hb-fh b{font-size:9.8pt}
.hb-fid{font:500 9pt/1.3 var(--anatomy-mono);color:var(--anatomy-strong)}
.hb-fkey{font:500 7.5pt/1 var(--anatomy-mono);color:var(--anatomy-muted);margin-left:auto}
.hb-f p{margin:0!important;font-size:9.5pt;line-height:1.33}
.hb-f .lab{display:inline-block;width:8mm;font:600 6.8pt/1 var(--sb-sans);letter-spacing:.1em;text-transform:uppercase;color:var(--anatomy-muted)}
.hb-gloss .sb-mdtable{font-size:9.5pt;margin:0}
.hb-gloss .sb-mdtable thead{display:none}
.hb-gloss .sb-mdtable td{padding:1.1mm 2mm 1.1mm 0}
.hb-gloss .sb-mdtable td:first-child{font-family:var(--anatomy-mono);color:var(--anatomy-strong);white-space:nowrap;font-size:9pt}
.hb-gloss .sb-mdtable td:last-child{font-family:var(--anatomy-mono);font-size:7.5pt;color:var(--anatomy-muted);white-space:normal}
.hb-acols .sb-sources{columns:auto;font-size:9pt;padding-left:7mm;margin:0;line-height:1.35}
.hb-acols .sb-sources li{margin:0 0 1.2mm}
.hb-acols .sb-sources a{font-family:var(--anatomy-mono);font-size:7.5pt}
.hb-acols>.sb-aside{font-size:9pt;margin-top:2mm}

/* cover */
.hb-cover{display:flex;flex-direction:column;height:258mm}
.hb-cover-top{padding:6mm 0 6mm;border-bottom:1.5px solid var(--anatomy-strong)}
.hb-cover h1{font-size:44pt;line-height:.95;letter-spacing:-.03em;margin:0 0 5mm}
.hb-cover h1 em{display:block;font-style:italic;font-weight:400;font-size:.62em;color:var(--anatomy-text);margin-top:2mm}
.hb-cover .sb-lead{font-size:14pt;max-width:52ch}
.hb-cover-meta{display:grid;grid-template-columns:1fr .7fr 2fr;gap:6mm;padding:4mm 0 5mm;font-size:9.5pt;color:var(--anatomy-strong);border-bottom:1px solid var(--anatomy-faint)}
.hb-cover-meta span{display:block;font:600 7pt/1 var(--sb-sans);letter-spacing:.14em;text-transform:uppercase;color:var(--anatomy-muted);margin:0 0 1.5mm}
.hb-cover-meta b{font-weight:600}
.hb-cover-meta .nw{display:inline;font:inherit;letter-spacing:0;text-transform:none;color:inherit;margin:0;white-space:nowrap}
.hb-toc{margin:6mm 0 0}
.hb-toc-h{font:600 7.5pt/1 var(--sb-sans);letter-spacing:.16em;text-transform:uppercase;color:var(--anatomy-muted);margin:0 0 2mm}
.hb-toc ol{list-style:none;margin:0;padding:0;border-top:1.5px solid var(--anatomy-strong)}
.hb-toc li{margin:0}
.hb-toc a{display:grid;grid-template-columns:12mm minmax(0,1fr) 12mm;align-items:baseline;padding:1.6mm 0;border-bottom:1px solid var(--anatomy-faint);text-decoration:none}
.hb-toc .n{font:500 9pt/1 var(--anatomy-mono);color:var(--anatomy-muted)}
.hb-toc b{font:400 13pt/1.25 var(--sb-serif);color:var(--anatomy-strong)}
.hb-toc .pg{font:500 10pt/1 var(--anatomy-mono);color:var(--anatomy-strong);text-align:right}
.hb-cover-foot{margin-top:auto;font-size:9.5pt;color:var(--anatomy-text);padding-top:5mm}
`;

// ------------------------------------------------------------------ assemble, print, number, print again
function build(pages) {
  const body = `<style>${fontCss}${PROSE_CSS}${S.SHELL_CSS}${stripMedia(V.VIS_CSS)}${stripMedia(S.SITE_CSS)}${HB_CSS}</style><article class="sb-doc">${cover(pages)}${[rules, machine, run, zero, preflight, trouble, feeds, maintain, quiz].map((h) => localLinks(openAll(h))).join("\n")}${localLinks(appendix)}</article>`;
  const html = k.pageHtml({ title: "ShopBot PRSalpha 144-60 — student handbook", theme: "light", body, width: 1200 });
  writeFileSync(HTML_OUT, html);
  return html;
}
function print() {
  execFileSync(CHROME, ["--headless=new", "--no-sandbox", "--disable-gpu", "--virtual-time-budget=8000", "--no-pdf-header-footer", `--print-to-pdf=${PDF_OUT}`, pathToFileURL(HTML_OUT).href], { stdio: "pipe", timeout: 90000 });
}
function locate() {
  const n = Number(execFileSync("pdfinfo", [PDF_OUT]).toString().match(/Pages:\s+(\d+)/)[1]);
  const text = execFileSync("pdftotext", ["-layout", PDF_OUT, "-"]).toString().split("\f");
  const pages = {};
  for (const t of TOC) {
    for (let i = 1; i < n; i++) {
      const lines = text[i].split("\n").map((l) => l.trim().replace(/\s+/g, " "));
      const hit = t.exact ? lines.some((l) => /^C\s+Sources$/.test(l)) : lines.some((l) => l.includes(t.find.trim()));
      if (hit) { pages[t.id] = i + 1; break; }
    }
  }
  return { n, pages };
}
build(null);
if (!process.argv.includes("--html")) {
  print();
  let { pages } = locate();
  for (let pass = 0; pass < 3; pass++) {
    build(pages); print();
    const again = locate();
    if (JSON.stringify(again.pages) === JSON.stringify(pages)) { console.log("pages", again.n, JSON.stringify(pages)); break; }
    pages = again.pages;
  }
}
console.log("wrote", HTML_OUT, existsSync(PDF_OUT) ? PDF_OUT : "");
