// Schematic SVG + HTML visuals for the ShopBot teaching site.
// Drawing language: hairline technical drawing, numbered callouts explained by an HTML caption list
// (so labels stay legible on a phone), colour only for meaning (red = danger, green = OK).
const S = (w, h, inner, cls = "", label = "") => `<svg class="sb-vis ${cls}" viewBox="0 0 ${w} ${h}" role="img"${label ? ` aria-label="${label}"` : ""} xmlns="http://www.w3.org/2000/svg">${inner}</svg>`;
const T = (x, y, t, o = "") => `<text x="${x}" y="${y}" ${o}>${t}</text>`;
const L = (x1, y1, x2, y2, o = "") => `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" ${o}/>`;
const R = (x, y, w, h, o = "") => `<rect x="${x}" y="${y}" width="${w}" height="${h}" ${o}/>`;
const C = (cx, cy, r, o = "") => `<circle cx="${cx}" cy="${cy}" r="${r}" ${o}/>`;
const P = (d, o = "") => `<path d="${d}" ${o}/>`;
const arrow = (id = "ah") => `<defs><marker id="${id}" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z" fill="var(--anatomy-strong)"/></marker></defs>`;
// numbered callout: leader from the bubble to the point, a dot on the point, the bubble on top
const co = (n, bx, by, px, py) => `${px != null ? `${L(bx, by, px, py, 'class="sb-leader"')}${C(px, py, 2.4, 'class="sb-leader-dot"')}` : ""}<g class="sb-co">${C(bx, by, 14)}${T(bx, by + 5.4, n, 'text-anchor="middle"')}</g>`;
const lbl = (x, y, t, o = "") => T(x, y, t, /class=/.test(o) ? o : `class="sb-vis-label" ${o}`);

// figure with numbered caption list; items = [html, ...] numbered from 1
export const fig = (svg, items = [], { id = "", cls = "", title = "", lead = "" } = {}) => `<figure class="sb-fig ${cls}"${id ? ` id="${id}"` : ""}>${title ? `<div class="sb-fig-t">${title}</div>` : ""}${lead ? `<p class="sb-fig-lead">${lead}</p>` : ""}<div class="sb-fig-art">${svg}</div>${items.length ? `<ol class="sb-callouts">${items.map((t, i) => `<li><span class="sb-callout-n">${i + 1}</span><span>${t}</span></li>`).join("")}</ol>` : ""}</figure>`;

export const ICONS = {
  stop: `<svg viewBox="0 0 24 24"><path d="M7.5 2h9L22 7.5v9L16.5 22h-9L2 16.5v-9z" fill="var(--anatomy-red)"/><rect x="8" y="8" width="8" height="8" fill="#fff"/></svg>`,
  play: `<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="11" fill="var(--anatomy-green)"/><path d="M9.5 7l7.5 5-7.5 5z" fill="#0b0b0b"/></svg>`,
  key: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="8" cy="12" r="4"/><path d="M12 12h10M18 12v3M21 12v2"/></svg>`,
  alarm: `<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" fill="var(--anatomy-red)"/><path d="M12 6v7M12 16v2" stroke="#fff" stroke-width="2.4" stroke-linecap="round"/></svg>`,
};
export const icon = (n, cls = "") => `<span class="sb-icon ${cls}" aria-hidden="true">${ICONS[n] || ""}</span>`;

// ---------- pendant with Reset · Start · E-stop
export const pendant = () => S(320, 166, `
${R(8, 8, 304, 150, 'rx="10" fill="var(--anatomy-shade-1)" stroke="var(--anatomy-muted)" stroke-width="1"')}
${C(70, 62, 22, 'fill="var(--anatomy-shade-3)" stroke="var(--anatomy-text)" stroke-width="1.2"')}${C(70, 62, 15, 'fill="none" stroke="var(--anatomy-muted)" stroke-width=".8"')}
${C(160, 62, 22, 'fill="var(--anatomy-green)"')}${P("M153 51l17 11-17 11z", 'fill="#0b0b0b"')}
${C(250, 62, 36, 'fill="#e8b923"')}${C(250, 62, 26, 'fill="var(--anatomy-red)"')}${C(250, 62, 26, 'fill="none" stroke="#00000033" stroke-width="3"')}
${lbl(70, 122, "RESET", 'text-anchor="middle" class="sb-vis-label sb-caps"')}${lbl(160, 122, "START", 'text-anchor="middle" class="sb-vis-label sb-caps"')}${lbl(160, 140, "spindle", 'text-anchor="middle" class="sb-vis-label sb-small sb-muted"')}${lbl(250, 122, "E-STOP", 'text-anchor="middle" class="sb-vis-label sb-caps"')}
`, "sb-pendant", "Pendant: Reset, green Start, red E-stop");

// ---------- keyboard with spacebar highlighted
export const spacebar = () => {
  let keys = "";
  for (let r = 0; r < 3; r++) for (let c = 0; c < 12; c++) keys += R(20 + c * 23 + r * 7, 20 + r * 24, 19, 19, 'rx="3" fill="var(--anatomy-shade-3)" stroke="var(--anatomy-muted)" stroke-width=".7"');
  return S(320, 166, `${R(8, 8, 304, 150, 'rx="10" fill="var(--anatomy-shade-1)" stroke="var(--anatomy-muted)" stroke-width="1"')}${keys}
  ${R(78, 98, 164, 30, 'rx="4" fill="var(--anatomy-strong)"')}${T(160, 118, "SPACE", 'text-anchor="middle" class="sb-caps sb-on-strong"')}`, "sb-keys", "Keyboard with the spacebar highlighted");
};

// ---------- plan view of the table: axes, home, job zero, stock (grid squares = 1 ft)
export const tablePlan = () => {
  let grid = "";
  for (let x = 110; x < 550; x += 40) grid += L(x, 44, x, 254, 'class="sb-grid"');
  for (let y = 86; y < 254; y += 42) grid += L(70, y, 550, y, 'class="sb-grid"');
  return S(640, 330, `${arrow("ahp")}
${R(70, 44, 480, 210, 'fill="var(--anatomy-shade-1)" stroke="var(--anatomy-muted)" stroke-width="1.4"')}${grid}
${R(60, 34, 500, 7, 'fill="var(--anatomy-shade-3)" stroke="var(--anatomy-muted)" stroke-width=".8"')}${R(60, 257, 500, 7, 'fill="var(--anatomy-shade-3)" stroke="var(--anatomy-muted)" stroke-width=".8"')}
${R(330, 118, 190, 118, 'data-stock-plan="" fill="var(--anatomy-face)" stroke="var(--anatomy-strong)" stroke-width="1.2"')}${lbl(425, 140, "stock", 'text-anchor="middle" class="sb-vis-label sb-muted"')}
${L(330, 177, 520, 177, 'stroke="var(--anatomy-muted)" stroke-width=".8" stroke-dasharray="4 4"')}${L(425, 118, 425, 236, 'stroke="var(--anatomy-muted)" stroke-width=".8" stroke-dasharray="4 4"')}
${R(128, 24, 18, 250, 'fill="var(--anatomy-mid)" fill-opacity=".45" stroke="var(--anatomy-text)" stroke-width=".8"')}
${R(122, 128, 30, 26, 'rx="2" fill="var(--anatomy-face)" stroke="var(--anatomy-strong)" stroke-width="1.2"')}${C(137, 141, 6, 'fill="var(--anatomy-hi)"')}
${R(62, 100, 8, 20, 'fill="var(--anatomy-hi)"')}${R(128, 266, 18, 7, 'fill="var(--anatomy-hi)"')}
${C(70, 254, 7, 'fill="var(--anatomy-green)"')}
${L(411, 177, 439, 177, 'stroke="var(--anatomy-red)" stroke-width="1.6"')}${L(425, 163, 425, 191, 'stroke="var(--anatomy-red)" stroke-width="1.6"')}${C(425, 177, 6, 'data-job-zero="centre" fill="var(--anatomy-red)"')}
${L(390, 304, 520, 304, 'stroke="var(--anatomy-strong)" stroke-width="1.4" marker-end="url(#ahp)"')}${lbl(530, 309, "+X")}
${L(596, 254, 596, 130, 'stroke="var(--anatomy-strong)" stroke-width="1.4" marker-end="url(#ahp)"')}${lbl(596, 118, "+Y", 'text-anchor="middle"')}
${co(1, 186, 16, 146, 30)}${co(2, 206, 112, 152, 136)}${co(3, 30, 110, 62, 110)}${co(4, 186, 304, 146, 270)}${co(5, 36, 300, 66, 258)}${co(6, 472, 280, 431, 184)}
`, "sb-plan", "Plan view: machine home at the table reference, XY job zero at the centre of the material");
};

// ---------- Z-zero touch, side view: carriage plate, spindle, clip on the plate edge, one lead to the Z plate, SB3 input 1
export const zTouch = () => {
  const S1='fill="var(--anatomy-shade-1)" stroke="var(--anatomy-muted)" stroke-width="1"', S2='fill="var(--anatomy-shade-2)" stroke="var(--anatomy-text)" stroke-width="1"', S3='fill="var(--anatomy-shade-3)" stroke="var(--anatomy-text)" stroke-width="1"';
  const screws = [[300,16],[390,16],[300,114],[390,114]].map(([x,y]) => C(x, y, 2, 'fill="var(--anatomy-muted)"')).join("");
  const knurl = [320,328,336,344,352].map((x) => L(x, 114, x, 124, 'stroke="var(--anatomy-muted)" stroke-width=".8"')).join("");
  // coiled lead: clip boot -> three loops -> plate lug
  const coil = P("M206 104 c 11 0 11 7 0 7 c -11 0 -11 7 0 7 c 11 0 11 7 0 7 c -11 0 -11 7 0 7 c 11 0 11 7 0 7 c -11 0 -11 7 0 7", 'fill="none" stroke="var(--anatomy-strong)" stroke-width="1.8" stroke-linejoin="round"');
  const lead = P("M238 49 C 214 52, 206 72, 206 104", 'fill="none" stroke="var(--anatomy-strong)" stroke-width="1.8"') + coil + P("M206 146 C 206 178, 236 193, 268 193", 'fill="none" stroke="var(--anatomy-strong)" stroke-width="1.8"');
  // the sensing circuit: plate -> bit -> collet -> spindle -> carriage plate -> clip -> lead -> plate
  const G = 'fill="none" stroke="var(--anatomy-green)" stroke-width="1.3" stroke-dasharray="3 3" opacity=".9"';
  const circuit = P("M335 186 V 60 H 395 V 41 H 302 L 280 41 L 238 49 C 214 52, 206 72, 206 104 V 146 C 206 178, 236 193, 268 193 H 335 V 186", G);
  // SB3 screen with the input tiles, input 1 lit
  const tiles = [0,1,2,3].map((i) => R(480 + i * 24, 50, 18, 22, `rx="2" ${i === 0 ? 'fill="var(--anatomy-green)"' : 'fill="var(--anatomy-shade-3)" stroke="var(--anatomy-muted)" stroke-width=".7"'}`) + T(489 + i * 24, 65, i + 1, `text-anchor="middle" font-size="11" font-weight="600" fill="${i === 0 ? "var(--anatomy-page)" : "var(--anatomy-muted)"}" stroke="none" style="paint-order:normal"`)).join("");
  return S(640, 300, `
${R(30, 244, 580, 22, 'fill="var(--anatomy-shade-3)" stroke="var(--anatomy-faint)"')}${lbl(40, 290, "spoilboard", 'class="sb-vis-label sb-muted"')}
${R(170, 200, 380, 44, 'fill="var(--anatomy-face)" stroke="var(--anatomy-strong)" stroke-width="1.2"')}${lbl(536, 228, "stock", 'text-anchor="end" class="sb-vis-label sb-muted"')}
${R(262, 186, 120, 14, S2)}${C(268, 193, 3.2, 'fill="var(--anatomy-strong)"')}
${R(290, 4, 110, 122, `rx="2" ${S1}`)}${screws}${lbl(404, 14, "carriage plate", 'class="sb-vis-label sb-small sb-muted"')}
${R(300, 14, 70, 86, `rx="5" ${S2}`)}${L(300, 30, 370, 30, 'stroke="var(--anatomy-muted)" stroke-width=".8"')}
${P("M312 100 h46 l-6 14 h-34 z", S3)}${R(314, 114, 42, 10, S3)}${knurl}
${R(331, 124, 8, 62, 'fill="var(--anatomy-strong)"')}
${lead}
${P("M304 39 L284 31 L274 37 L280 41 Z", 'fill="var(--anatomy-hi)" stroke="var(--anatomy-text)" stroke-width=".8"')}${P("M304 43 L284 51 L274 45 L280 41 Z", 'fill="var(--anatomy-hi)" stroke="var(--anatomy-text)" stroke-width=".8"')}${L(290, 39, 304, 39, 'stroke="var(--anatomy-text)" stroke-width=".6"')}${L(290, 43, 304, 43, 'stroke="var(--anatomy-text)" stroke-width=".6"')}
${P("M272 38 L240 30 L238 36 L270 42 Z", 'fill="var(--anatomy-text)"')}${P("M272 44 L240 52 L238 46 L270 41 Z", 'fill="var(--anatomy-text)"')}${C(280, 41, 2, 'fill="var(--anatomy-text)"')}
${circuit}
${R(466, 20, 128, 72, `rx="4" ${S1}`)}${R(474, 28, 112, 56, 'rx="2" fill="var(--anatomy-shade-2)"')}${lbl(480, 44, "inputs", 'class="sb-vis-label sb-small sb-muted"')}${tiles}${lbl(530, 110, "SB3 screen", 'text-anchor="middle" class="sb-vis-label sb-small sb-muted"')}
${co(1, 440, 104, 364, 104)}${co(2, 440, 158, 340, 158)}${co(3, 232, 14, 276, 36)}${co(4, 480, 178, 384, 191)}${co(5, 616, 36, 498, 50)}${co(6, 160, 128, 201, 125)}
`, "sb-ztouch", "Side view: spindle on its carriage plate, ground clip clamped on the plate edge, one coiled lead to the Z-zero plate on the stock, the sensing circuit, and input 1 on the SB3 screen");
};

// ---------- the classic crash: same file, two Z zeros
export const crashPair = () => {
  const panel = (ox, z0, ok) => { ox = 0;
    const r = z0 - 16, cut = z0 + 52, col = ok ? "var(--anatomy-green)" : "var(--anatomy-red)";
    return `${R(ox + 20, 110, 270, 50, 'fill="var(--anatomy-face)" stroke="var(--anatomy-strong)" stroke-width="1.1"')}${R(ox + 20, 160, 270, 80, 'fill="var(--anatomy-shade-3)" stroke="var(--anatomy-faint)"')}
${lbl(ox + 282, 140, "stock", 'text-anchor="end" class="sb-vis-label sb-small sb-muted"')}${lbl(ox + 282, 233, "spoilboard", 'text-anchor="end" class="sb-vis-label sb-small sb-muted"')}
${L(ox + 8, z0, ox + 302, z0, `stroke="${col}" stroke-width="1.2" stroke-dasharray="5 4"`)}${lbl(ox + 10, z0 - 6, "Z0", 'class="sb-vis-label sb-small"')}
${P(`M${ox + 40} ${r} H${ox + 92} V${cut} H${ox + 226} V${r} H${ox + 280}`, `fill="none" stroke="${col}" stroke-width="2.4" stroke-linejoin="round"`)}
${R(ox + 88, r - 30, 8, 30, 'fill="var(--anatomy-strong)"')}
${lbl(ox + 20, 20, ok ? "you touched the stock top" : "you touched the bed", 'class="sb-vis-label"')}
${lbl(ox + 20, 42, ok ? "cuts as planned" : "every move a sheet too deep", `class="sb-vis-label sb-small" fill="${col}" style="fill:${col}"`)}`;
  };
  return `<div class="sb-crash-pair">${S(310, 250, panel(0, 110, true), "sb-crash", "Z zero on the stock top: cuts as planned")}${S(310, 250, panel(0, 160, false), "sb-crash", "Z zero on the bed: every move a sheet too deep")}</div>`;
};

// ---------- collet section with 75 % shank rule
export const collet = () => S(560, 210, `
${R(180, 20, 180, 60, 'rx="6" fill="var(--anatomy-shade-2)" stroke="var(--anatomy-text)" stroke-width="1"')}
${P("M200 80h140l-12 40H212z", 'fill="var(--anatomy-shade-3)" stroke="var(--anatomy-text)" stroke-width="1"')}
${P("M230 80h80l-6 34h-68z", 'fill="var(--anatomy-shade-1)" stroke="var(--anatomy-strong)" stroke-width="1"')}
${R(262, 56, 16, 114, 'fill="var(--anatomy-strong)"')}${P("M262 170h16l-4 16h-8z", 'fill="var(--anatomy-strong)"')}${P("M264 146l12 8M264 156l12 8", 'fill="none" stroke="var(--anatomy-page)" stroke-width="1.2"')}
${P("M180 80h-8v34h8", 'fill="none" stroke="var(--anatomy-green)" stroke-width="2.4"')}${P("M180 142h-8v44h8", 'fill="none" stroke="var(--anatomy-red)" stroke-width="2.4"')}
${P("M372 120h8v66h-8", 'fill="none" stroke="var(--anatomy-text)" stroke-width="1.4"')}
${co(1, 130, 40, 180, 44)}${co(2, 440, 104, 334, 104)}${co(3, 440, 64, 304, 90)}${co(4, 140, 97, 172, 97)}${co(5, 140, 164, 172, 164)}${co(6, 420, 154, 380, 154)}
`, "sb-collet", "Collet, nut and bit in section");

// ---------- hold-down side view
export const holddown = () => S(560, 220, `
${R(30, 150, 500, 30, 'fill="var(--anatomy-shade-3)" stroke="var(--anatomy-faint)"')}${lbl(40, 204, "spoilboard", 'class="sb-vis-label sb-small sb-muted"')}
${R(60, 110, 440, 40, 'fill="var(--anatomy-face)" stroke="var(--anatomy-strong)" stroke-width="1.1"')}${lbl(270, 135, "the part", 'text-anchor="middle" class="sb-vis-label sb-small sb-muted"')}
${R(95, 100, 6, 70, 'fill="var(--anatomy-strong)"')}${R(88, 97, 20, 5, 'fill="var(--anatomy-strong)"')}${R(445, 100, 6, 70, 'fill="var(--anatomy-strong)"')}${R(438, 97, 20, 5, 'fill="var(--anatomy-strong)"')}
${R(200, 110, 10, 36, 'fill="var(--anatomy-page)"')}${R(330, 110, 10, 36, 'fill="var(--anatomy-page)"')}
${R(200, 146, 10, 4, 'fill="var(--anatomy-green)"')}${R(330, 146, 10, 4, 'fill="var(--anatomy-green)"')}
${L(40, 62, 520, 62, 'stroke="var(--anatomy-red)" stroke-width="1.3" stroke-dasharray="6 4"')}
${co(1, 66, 76, 96, 99)}${co(2, 250, 92, 211, 116)}${co(3, 250, 196, 210, 149)}${co(4, 536, 62)}
`, "sb-holddown", "Hold-down in section: screws, profile cut, tabs, clearance");

// ---------- decision tree: the machine stopped (HTML, so it reflows on a phone)
export const stoppedFlow = () => `<div class="sb-tree" role="group" aria-label="The machine stopped: what to do">
<div class="sb-tree-root">The machine stopped</div>
<div class="sb-tree-branches">
<div class="sb-branch"><div class="sb-tree-q">Red LED on the box?<span>“location no longer accurate”</span></div><div class="sb-tree-a">Driver alarm <a href="#E01">E01</a><span>clamp strike · packed rack · cable</span></div></div>
<div class="sb-branch"><div class="sb-tree-q">Software frozen?<span>controller disconnected</span></div><div class="sb-tree-a sb-tree-stop">E-STOP now <a href="#E02">E02</a><span>only it still kills the spindle</span></div></div>
<div class="sb-branch"><div class="sb-tree-q">Spindle fault code<span>on the VFD?</span></div><div class="sb-tree-a">Overload / overcurrent <a href="#E36">E36</a><span>record the code</span></div></div>
</div>
<div class="sb-tree-end"><b>Position is lost after any alarm or E-stop.</b><span class="sb-chain">Remove the cause <i>→</i> <code>Reset</code> <i>→</i> <code>C3</code> <i>→</i> re-zero (<code>Z2</code> from your notes, <code>C2</code>) <i>→</i> <code>FG</code> from a line before the stop</span></div>
<div class="sb-tree-staff">${icon("alarm")}<span>Second alarm in a session · any VFD code · smoke · snapped or pulled bit <b>→ stop and call staff</b></span></div>
</div>`;

// ---------- numbered sequence (horizontal on desktop, vertical on phones)
export const flow = (steps, cls = "") => `<ol class="sb-seq ${cls}" style="--n:${steps.length}">${steps.map((s, i) => `<li class="${s.hot ? "hot" : ""}"><span class="sb-seq-n">${i + 1}</span><span class="sb-seq-t">${s.href ? `<a href="${s.href}">${s.title}</a>` : s.title}</span>${s.text ? `<span class="sb-seq-x">${s.text}</span>` : ""}</li>`).join("")}</ol>`;

// ---------- spec line: [label, value]
export const stats = (items) => `<dl class="sb-spec">${items.map(([l, v]) => `<div><dt>${l}</dt><dd>${v}</dd></div>`).join("")}</dl>`;

// ---------- chipload calculator (interactive)
const ticks = [0, 0.1, 0.2, 0.3, 0.4, 0.5].map((t) => { const x = 12 + (t / 0.5) * 376; return `${L(x, 40, x, 46, 'stroke="var(--anatomy-muted)"')}<text x="${x}" y="62" text-anchor="middle" class="sb-vis-label sb-small sb-muted">${t.toFixed(1)}</text>`; }).join("");
export const chipCalc = () => `<div class="sb-calc" data-calc data-state="ok">
<div class="sb-calc-in">
<div class="sb-calc-row"><label for="c-rpm">Spindle speed</label><output data-o="rpm">14000</output><span class="u">rpm</span><input id="c-rpm" type="range" data-i="rpm" min="6000" max="18000" step="500" value="14000"></div>
<div class="sb-calc-row"><label for="c-feed">Feed</label><output data-o="feed">4200</output><span class="u">mm/min</span><input id="c-feed" type="range" data-i="feed" min="500" max="10000" step="100" value="4200"></div>
<div class="sb-calc-row"><label for="c-fl">Flutes</label><output data-o="fl">2</output><span class="u"></span><input id="c-fl" type="range" data-i="fl" min="1" max="3" step="1" value="2"></div>
<div class="sb-calc-row"><label for="c-dia">Cutter Ø</label><output data-o="dia">6</output><span class="u">mm</span><input id="c-dia" type="range" data-i="dia" min="3" max="12" step="1" value="6"></div>
</div>
<div class="sb-calc-out" aria-live="polite">
<div class="sb-calc-k">Chipload f<sub>z</sub></div>
<div class="sb-calc-v"><span data-chip>0.150</span><span class="u">mm per tooth</span></div>
<svg class="sb-gauge" viewBox="0 0 400 70" aria-hidden="true">${R(12, 24, 376, 14, 'fill="var(--anatomy-shade-3)"')}<rect data-band x="12" y="24" width="0" height="14" fill="var(--anatomy-green)" opacity=".6"/>${ticks}<g data-needle transform="translate(12,0)">${L(0, 14, 0, 46, 'stroke="var(--anatomy-strong)" stroke-width="2.4"')}${P("M0 14l-6-10h12z", 'fill="var(--anatomy-strong)"')}</g></svg>
<div class="sb-calc-verdict" data-verdict></div>
<div class="sb-calc-f">f<sub>z</sub> = feed ÷ (rpm × flutes)</div>
</div>
<p class="sb-aside sb-calc-note">Green band: ShopBot's plywood range for a ¼ in cutter (0.13–0.5 mm/tooth), scaled to the cutter Ø. Too thin: rubbing, heat, burn. Too thick: deflection, chatter, snapped bit. Plunge at ≤ half the feed.</p>
</div>`;
export const CALC_JS = `
for (const c of document.querySelectorAll('[data-calc]')) {
  const g = (k) => Number(c.querySelector('[data-i="' + k + '"]').value);
  const X = (v) => 12 + Math.min(1, v / 0.5) * 376;
  const upd = () => {
    for (const k of ['rpm','feed','fl','dia']) c.querySelector('[data-o="' + k + '"]').textContent = k === 'rpm' || k === 'feed' ? g(k).toLocaleString('en-US').replace(/,/g, '\\u2009') : g(k);
    const chip = g('feed') / (g('rpm') * g('fl'));
    const dia = g('dia'); const lo = 0.13 * dia / 6.35, hi = 0.5 * dia / 6.35;
    c.querySelector('[data-needle]').setAttribute('transform', 'translate(' + X(chip) + ',0)');
    const b = c.querySelector('[data-band]'); b.setAttribute('x', X(lo)); b.setAttribute('width', Math.max(0, X(hi) - X(lo)));
    c.querySelector('[data-chip]').textContent = chip.toFixed(3);
    c.dataset.state = chip < lo ? 'thin' : chip > hi ? 'thick' : 'ok';
    c.querySelector('[data-verdict]').textContent = chip < lo ? 'Too thin: rubbing and burning. Raise the feed or drop the rpm.' : chip > hi ? 'Too thick: chatter, deflection, snapped bit. Slow down.' : 'In range. Plunge at ' + Math.round(g('feed') / 2) + ' mm/min or less.';
  };
  c.addEventListener('input', upd); upd();
}`;

// ---------- maintenance calendar: [interval, items]
export const maintGrid = (cols) => `<div class="sb-cal" role="table" aria-label="Maintenance calendar">${cols.map(([h, items], i) => `<div class="sb-cal-col" role="rowgroup"><div class="sb-cal-h" role="columnheader"><span class="sb-cal-i">${["I", "II", "III", "IV"][i] || ""}</span>${h}</div><ul>${items.map((t) => `<li role="cell">${t}</li>`).join("")}</ul></div>`).join("")}</div>`;

export const VIS_CSS = `
.sb-vis{width:100%;height:auto;display:block;overflow:visible}
.sb-vis text{fill:var(--anatomy-strong);font-family:var(--sb-sans);font-size:15px}
.sb-vis .sb-small{font-size:13px}
.sb-vis .sb-muted{fill:var(--anatomy-text)}
.sb-vis .sb-caps{font-size:12.5px;letter-spacing:.14em;font-weight:600}
.sb-vis .sb-on-strong{fill:var(--anatomy-page);font-size:13px}
.sb-gauge text{fill:var(--anatomy-text);font-family:var(--anatomy-mono);font-size:12px}
.sb-vis .sb-grid{stroke:var(--anatomy-faint);stroke-width:.7}
.sb-leader{stroke:var(--anatomy-strong);stroke-width:1}
.sb-leader-dot{fill:var(--anatomy-strong)}
.sb-co circle{fill:var(--anatomy-page);stroke:var(--anatomy-strong);stroke-width:1.2}
.sb-vis .sb-co text{font:600 15.5px var(--sb-sans);fill:var(--anatomy-strong)}
.sb-crash-pair{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:24px}
.sb-icon{display:inline-flex;width:22px;height:22px;vertical-align:-4px;flex:0 0 auto}
.sb-icon svg{width:100%;height:100%}

.sb-fig{margin:0}
.sb-fig-t{font:600 13px/1.3 var(--sb-sans);letter-spacing:.12em;text-transform:uppercase;color:var(--anatomy-muted);margin:0 0 10px}
.sb-fig-lead{max-width:62ch}
.sb-fig-art{padding:28px 0 20px;border-top:1px solid var(--anatomy-faint);border-bottom:1px solid var(--anatomy-faint)}
.sb-callouts{list-style:none;margin:18px 0 0;padding:0;display:grid;grid-template-columns:repeat(auto-fill,minmax(250px,1fr));gap:10px 32px;font-size:15px;color:var(--anatomy-text)}
.sb-callouts li{display:grid;grid-template-columns:28px 1fr;gap:10px;align-items:baseline}
.sb-callout-n{display:inline-grid;place-items:center;width:24px;height:24px;border:1.2px solid var(--anatomy-strong);border-radius:50%;font:600 12.5px/1 var(--sb-sans);color:var(--anatomy-strong);transform:translateY(5px)}
.sb-callouts b{color:var(--anatomy-strong)}

/* decision tree */
.sb-tree{--line:var(--anatomy-text);margin:8px 0 0;font-size:15px}
.sb-tree-root{width:max-content;max-width:100%;margin:0 auto;padding:12px 22px;border:1.5px solid var(--anatomy-strong);border-radius:4px;font:600 21px/1.2 var(--sb-serif);color:var(--anatomy-strong);position:relative}
.sb-tree-branches{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:20px;position:relative;padding-top:44px}
.sb-tree-branches::before{content:"";position:absolute;top:22px;left:calc((100% - 40px) / 6);right:calc((100% - 40px) / 6);border-top:1px solid var(--line)}
.sb-branch::after{content:"";position:absolute;left:50%;bottom:-30px;height:30px;border-left:1px solid var(--line)}
.sb-tree-root::after{content:"";position:absolute;left:50%;top:100%;height:22px;border-left:1px solid var(--line)}
.sb-branch{display:flex;flex-direction:column;align-items:stretch;position:relative}
.sb-branch::before{content:"";position:absolute;left:50%;top:-22px;height:22px;border-left:1px solid var(--line)}
.sb-tree-q,.sb-tree-a{padding:12px 16px;border-radius:4px;text-align:center;line-height:1.35}
.sb-tree-q{border:1px solid var(--anatomy-muted);color:var(--anatomy-strong);font-weight:600}
.sb-tree-q span,.sb-tree-a span{display:block;font-weight:400;color:var(--anatomy-text);font-size:14px;margin-top:3px}
.sb-tree-a{margin-top:30px;position:relative;background:var(--anatomy-card);color:var(--anatomy-strong);font-weight:600;flex:1}
.sb-tree-a::before{content:"";position:absolute;left:50%;top:-30px;height:30px;border-left:1px solid var(--line)}
.sb-tree-a::after{content:"yes";position:absolute;left:calc(50% + 8px);top:-24px;font:500 11.5px/1 var(--anatomy-mono);color:var(--anatomy-muted);letter-spacing:.06em}
.sb-tree-a a{font-family:var(--anatomy-mono);font-size:13.5px;font-weight:500}
.sb-tree-stop{background:color-mix(in srgb,var(--anatomy-red) 16%,var(--anatomy-card));border:1.5px solid var(--anatomy-red)}
.sb-tree-end{margin-top:30px;position:relative;padding:16px 20px;border:1.5px solid var(--anatomy-strong);border-radius:4px;color:var(--anatomy-strong);text-align:center}
.sb-tree-end b{display:block;font:600 19px/1.3 var(--sb-serif);margin-bottom:6px}
.sb-chain{color:var(--anatomy-text);line-height:2}
.sb-chain i{font-style:normal;color:var(--anatomy-muted);padding:0 4px}
.sb-tree-staff{margin-top:30px;position:relative;display:flex;gap:12px;align-items:center;justify-content:center;padding:12px 16px;border:1.5px solid var(--anatomy-red);border-radius:4px;color:var(--anatomy-strong)}
.sb-tree-staff::before{content:"";position:absolute;left:50%;top:-31px;height:30px;border-left:1px solid var(--line)}
.sb-tree-staff b{color:var(--anatomy-red)}

/* numbered sequence */
.sb-seq{list-style:none;margin:0;padding:0;display:grid;grid-template-columns:repeat(var(--n),minmax(0,1fr));gap:0}
.sb-seq li{position:relative;padding:22px 18px 4px 0;display:flex;flex-direction:column;gap:6px}
.sb-seq li:not(:last-child)::after{content:"";position:absolute;top:0;left:0;right:0;border-top:1px solid var(--anatomy-text)}
.sb-seq li::before{content:"";position:absolute;top:-5px;left:0;z-index:1;width:9px;height:9px;border-radius:50%;background:var(--anatomy-page);border:1px solid var(--anatomy-text)}
.sb-seq-n{font:400 40px/1 var(--sb-serif);color:var(--anatomy-strong);font-variant-numeric:lining-nums}
.sb-seq-t{font-weight:600;color:var(--anatomy-strong);font-size:16.5px;line-height:1.3}
.sb-seq-t a{color:inherit;text-decoration:none;border-bottom:1px solid var(--anatomy-muted)}
.sb-seq-t a:hover{border-bottom-color:var(--anatomy-strong)}
.sb-seq-x{color:var(--anatomy-text);font-size:14.5px;line-height:1.45}
.sb-seq li.hot::before{background:var(--anatomy-green);border-color:var(--anatomy-green)}
.sb-seq li.hot .sb-seq-n{color:var(--anatomy-green)}

/* spec line */
.sb-spec{display:grid;grid-template-columns:repeat(auto-fit,minmax(130px,1fr));gap:14px 24px;margin:0;padding:0}
.sb-spec>div{display:flex;flex-direction:column;gap:6px}
.sb-spec dt{font:600 11px/1 var(--sb-sans);letter-spacing:.12em;text-transform:uppercase;color:var(--anatomy-muted)}
.sb-spec dd{margin:0;font:400 14px/1.35 var(--anatomy-mono);color:var(--anatomy-strong);text-wrap:balance}

/* calculator */
.sb-calc{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:0;border-top:1.5px solid var(--anatomy-strong);border-bottom:1px solid var(--anatomy-faint)}
.sb-calc-in{padding:20px 40px 24px 0;border-right:1px solid var(--anatomy-faint)}
.sb-calc-row{display:grid;grid-template-columns:1fr auto auto;align-items:baseline;column-gap:8px;padding:12px 0 0}
.sb-calc-row label{color:var(--anatomy-strong);font-weight:500;font-size:15.5px}
.sb-calc-row output{font:500 22px/1 var(--anatomy-mono);color:var(--anatomy-strong);text-align:right}
.sb-calc-row .u{font-size:13px;color:var(--anatomy-muted);min-width:56px}
.sb-calc input[type=range]{grid-column:1/-1;width:100%;height:44px;margin:0;cursor:pointer;-webkit-appearance:none;appearance:none;background:transparent}
.sb-calc input[type=range]::-webkit-slider-runnable-track{height:2px;background:var(--anatomy-muted)}
.sb-calc input[type=range]::-moz-range-track{height:2px;background:var(--anatomy-muted)}
.sb-calc input[type=range]::-webkit-slider-thumb{-webkit-appearance:none;width:24px;height:24px;margin-top:-11px;border-radius:50%;background:var(--anatomy-strong);border:4px solid var(--anatomy-page);box-shadow:0 0 0 1.5px var(--anatomy-strong)}
.sb-calc input[type=range]::-moz-range-thumb{width:18px;height:18px;border-radius:50%;background:var(--anatomy-strong);border:4px solid var(--anatomy-page);box-shadow:0 0 0 1.5px var(--anatomy-strong)}
.sb-calc input[type=range]:focus-visible{outline:2px solid var(--anatomy-strong);outline-offset:2px}
.sb-calc-out{padding:28px 0 24px 40px;display:flex;flex-direction:column}
.sb-calc-k{font:600 12px/1 var(--sb-sans);letter-spacing:.14em;text-transform:uppercase;color:var(--anatomy-muted)}
.sb-calc-v{display:flex;align-items:baseline;gap:14px;margin:14px 0 10px;flex-wrap:wrap}
.sb-calc-v [data-chip]{font:500 clamp(56px,8vw,96px)/.95 var(--anatomy-mono);letter-spacing:-.03em;color:var(--anatomy-strong)}
.sb-calc-v .u{color:var(--anatomy-text);font-size:15px}
.sb-gauge{width:100%;height:auto;display:block;margin:6px 0 4px}
.sb-calc-verdict{font:600 17px/1.4 var(--sb-sans);color:var(--anatomy-green);min-height:2.8em}
.sb-calc[data-state=thin] .sb-calc-verdict,.sb-calc[data-state=thick] .sb-calc-verdict{color:var(--anatomy-red)}
.sb-calc-f{margin-top:auto;padding-top:14px;font:400 19px/1.3 var(--sb-serif);font-style:italic;color:var(--anatomy-text)}
.sb-calc-note{grid-column:1/-1;margin:14px 0 16px!important}

/* maintenance calendar */
.sb-cal{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));border-top:1.5px solid var(--anatomy-strong)}
.sb-cal-col{padding:16px 20px 18px;border-right:1px solid var(--anatomy-faint)}
.sb-cal-col:first-child{padding-left:0}
.sb-cal-col:last-child{border-right:0;padding-right:0}
.sb-cal-h{font:600 21px/1.2 var(--sb-serif);color:var(--anatomy-strong);margin:0 0 12px;display:flex;gap:10px;align-items:baseline}
.sb-cal-i{font:500 12px/1 var(--anatomy-mono);color:var(--anatomy-muted);letter-spacing:.06em;min-width:22px}
.sb-cal ul{list-style:none;margin:0;padding:0;font-size:14.5px;color:var(--anatomy-text)}
.sb-cal li{padding:8px 0;border-top:1px solid var(--anatomy-faint);line-height:1.45}

@media (max-width:760px){
  .sb-tree-branches{grid-template-columns:1fr;padding-top:22px;gap:26px}
  .sb-tree-branches::before{display:none}
  .sb-branch::before{top:-22px;height:22px}
  .sb-branch:not(:first-child)::before{display:none}
  .sb-branch::after{display:none}
  .sb-branch:last-child::after{display:block}
  .sb-tree-branches{gap:30px}
  .sb-seq{grid-template-columns:1fr}
  .sb-seq li{display:grid;grid-template-columns:36px 1fr;column-gap:10px;padding:12px 0 12px 18px}
  .sb-seq li:not(:last-child)::after{top:27px;bottom:-27px;left:0;right:auto;border-top:0;border-left:1px solid var(--anatomy-text)}
  .sb-seq li::before{top:22px;left:-5px}
  .sb-seq-n{grid-row:1/3;font-size:28px}
  .sb-crash-pair{grid-template-columns:1fr;gap:28px}
  .sb-calc{grid-template-columns:1fr}
  .sb-calc-in{padding:12px 0 16px;border-right:0;border-bottom:1px solid var(--anatomy-faint)}
  .sb-calc-out{padding:20px 0}
  .sb-cal{grid-template-columns:1fr}
  .sb-cal-col{padding:16px 0;border-right:0;border-bottom:1px solid var(--anatomy-faint)}
}
`;
