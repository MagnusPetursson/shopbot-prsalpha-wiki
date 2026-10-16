const D = __DATA__;
const P = D.P;
const stage = document.querySelector(".sb-stage");
const svg = stage.querySelector("svg");
const $ = (sel) => svg.querySelector(sel);
const $$ = (sel) => [...svg.querySelectorAll(sel)];
const at = (p) => iso(p, P);
const readout = document.querySelector("[data-readout]");
const status = document.querySelector("[data-status]");
const note = document.querySelector("[data-note]");
const runButton = document.querySelector("[data-run]");
const runLabel = document.querySelector("[data-run-label]");
const scrub = document.querySelector("[data-scrub]");
const timeLabel = document.querySelector("[data-time]");
const speedSelect = document.querySelector("[data-speed]");
const tourButton = document.querySelector("[data-tour]");
const rewindButton = document.querySelector("[data-rewind]");
const backButton = document.querySelector("[data-back]");
const fwdButton = document.querySelector("[data-fwd]");
const still = matchMedia("(prefers-reduced-motion: reduce)");
let SPEED = D.speed;
const insetSvg = document.querySelector(".sb-inset svg");
const IP = D.inset.P;
const iat = (p) => iso(p, IP);

const el = {
  gantry: $('[data-group="gantry"]'),
  gantryFar: $('[data-group="gantry-far"]'),
  car: $('[data-group="car"]'),
  z: $('[data-group="zaxis"]'),
  cut: $('[data-part="cut"]'),
  part: $('[data-part="stock-part"]'),
  hoseFoot: $('[data-part="hose.foot-live"]'),
  hoseBoom: $('[data-part="hose.boom-live"]'),
  xchain: $('[data-part="xchain-live"]'),
  ychain: $('[data-part="ychain-live"]'),
  leds: Object.fromEntries($$(".sb-led").map((g) => [g.dataset.led, g])),
  items: [...$$(".it"), ...(insetSvg ? [...insetSvg.querySelectorAll(".it")] : [])],
  inset: insetSvg ? {
    stock: insetSvg.querySelector('[data-part="inset-stock"]'),
    groove: insetSvg.querySelector('[data-part="inset-groove"]'),
    grooveFloor: insetSvg.querySelector('[data-part="inset-groove-floor"]'),
    tool: insetSvg.querySelector('[data-part="inset-tool"]'),
    bit: insetSvg.querySelector('[data-part="inset-bit"]'),
    flutes: insetSvg.querySelector('[data-part="inset-flutes"]'),
    chips: insetSvg.querySelector('[data-part="inset-chips"]'),
  } : null,
};
const faultButtons = [...document.querySelectorAll("[data-fault]")];
const PROG = D.program;
const FAULT_LIST = D.faults;

const state = window.__sb = {
  clock: 0,
  running: false,
  fault: null,
  faultAge: 0,
  touring: false,
  tourClock: 0,
  shown: { dx: 0, dy: 0, dz: 0, rack: 0 },
  cutIndex: 0,
  spin: 0,
  chips: [],
};

// ---------------------------------------------------------------- pose from the model
function poseFor(prog, time) {
  const t = Math.max(0, Math.min(prog.total, time));
  let seg = prog.segs[prog.segs.length - 1];
  for (const s of prog.segs) if (t <= s.t1) { seg = s; break; }
  const share = seg.t1 > seg.t0 ? (t - seg.t0) / (seg.t1 - seg.t0) : 1;
  const p = seg.from.map((a, i) => a + (seg.to[i] - a) * share);
  return { x: p[0], y: p[1], z: p[2], speed: seg.speed, cut: seg.cut && p[2] < 0, seg };
}
// machine (x, y) -> world; machine X runs along -world x, Y along -world y
const worldXY = (mx, my) => [D.origin.x - mx, D.origin.y - my];
const toolOffsets = (pose) => {
  const [wx, wy] = worldXY(pose.x, pose.y);
  return { dx: wx - (D.rest.gx + D.rest.spx), dy: wy - D.rest.cy, dz: pose.z - D.safeZ };
};

// ---------------------------------------------------------------- drawing
function moveGroups(dx, dy, dz, rack = 0) {
  el.gantry.setAttribute("transform", translateAlong(P, [dx, 0, 0]));
  el.gantryFar.setAttribute("transform", translateAlong(P, [dx - rack, 0, 0]));
  el.car.setAttribute("transform", translateAlong(P, [0, dy, 0]));
  el.z.setAttribute("transform", translateAlong(P, [0, 0, dz]));
}
function tubeGroup(points, r, bend, tone, maxLength, rings, proj = P, view = D.V) {
  const route = G.fillet(points, bend, 10, { P: proj, tube: r });
  const pieces = TUBE.tubePieces(route, r, proj, { maxLength, spacing: Math.min(1.6, Math.max(0.6, r)), ...(rings ? { rings } : {}) });
  pieces.sort((a, b) => G.dot3(a.mid, view) - G.dot3(b.mid, view));
  return pieces.map((piece) => TUBE.tubeSvg(piece, { tone })).join("");
}
const HOSE_RINGS = { pitch: 2.6, fade: [0.1, 0.55], tone: "lo" };
const CHAIN_RINGS = { pitch: 1.8, fade: [0.05, 0.6], tone: "lo" };
let lastKey = "";
function drawServices(dx, dy, dz) {
  const key = `${Math.round(dx * 2)}|${Math.round(dy * 2)}|${Math.round(dz * 2)}`;
  if (key === lastKey) return;
  lastKey = key;
  const g = D.routes;
  const gx = D.rest.gx + dx;
  const cy = D.rest.cy + dy;
  // in the zaxis group (which already carries dx, dy, dz): the foot hose at rest coordinates
  el.hoseFoot.innerHTML = tubeGroup(hoseFootRoute({ hose: g.hose }, 0, 0).map(([x, y, z]) => [x + D.rest.gx, y + D.rest.cy, z]), g.hose.r, 10, "hi", 16, HOSE_RINGS);
  // in the car group (carries dy): the y chain's fixed end is on the beam, so build it with the real cy and undo dy
  el.ychain.innerHTML = tubeGroup(yChainRoute({ ychain: g.ychain }, cy), 1.6, 5, "mid", 10, CHAIN_RINGS);
  el.ychain.setAttribute("transform", translateAlong(P, [0, -dy, 0]));
  // world: x chain and boom hose
  el.xchain.innerHTML = tubeGroup(xChainRoute({ xchain: g.xchain }, gx), 2.2, 6, "mid", 12, CHAIN_RINGS);
  el.hoseBoom.innerHTML = tubeGroup(hoseBoomRoute({ hose: g.hose, boomTip: g.boomTip, hoseLength: g.hoseLength }, gx, cy, dz), g.hose.r, 14, "hi", 20, HOSE_RINGS);
}
const stockTopZ = D.rest.stockTop;
const cutPoint = (x, y) => { const [wx, wy] = worldXY(x, y); return at([wx, wy, stockTopZ + 0.02]); };
function segEnd(s, i, current, time) {
  if (i !== current) return [s.to[0], s.to[1]];
  const share = (time - s.t0) / (s.t1 - s.t0);
  return [s.from[0] + (s.to[0] - s.from[0]) * share, s.from[1] + (s.to[1] - s.from[1]) * share];
}
let cutTime = -1;
function drawCut(time) {
  if (time < cutTime) { el.cut.innerHTML = ""; if (el.inset) { el.inset.groove.innerHTML = ""; el.inset.grooveFloor.innerHTML = ""; } state.cutIndex = 0; }
  cutTime = time;
  while (state.cutIndex < PROG.segs.length) {
    const s = PROG.segs[state.cutIndex];
    if (s.t0 > time) break;
    if (s.cut && s.to[2] < 0 && (s.from[0] !== s.to[0] || s.from[1] !== s.to[1])) {
      for (const parent of [el.cut, el.inset?.groove, el.inset?.grooveFloor]) {
        if (!parent) continue;
        const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
        if (s.to[2] > -0.7) path.setAttribute("data-pocket", "");
        path.dataset.seg = state.cutIndex;
        path.dataset.live = "";
        parent.appendChild(path);
      }
    }
    state.cutIndex++;
  }
  const current = PROG.segs.findIndex((s) => time <= s.t1 && time >= s.t0);
  for (const p of el.cut.querySelectorAll("path[data-live]")) {
    const i = Number(p.dataset.seg);
    const s = PROG.segs[i];
    const [x, y] = segEnd(s, i, current, time);
    p.setAttribute("d", pathOf([cutPoint(s.from[0], s.from[1]), cutPoint(x, y)]));
    if (i !== current) delete p.dataset.live;
  }
}
function resetCut() {
  el.cut.innerHTML = "";
  if (el.inset) { el.inset.groove.innerHTML = ""; el.inset.grooveFloor.innerHTML = ""; el.inset.chips.innerHTML = ""; }
  state.cutIndex = 0;
  cutTime = -1;
  state.chips = [];
}

// ---------------------------------------------------------------- the inset: the sheet slides under a fixed tool
const TOOL_REST = () => [D.rest.gx + D.rest.spx, D.rest.cy];
function drawInset(pose, dt, effect) {
  if (!el.inset) return;
  const dz = pose.z + (effect?.dz ?? 0); // tip height above the stock top (negative = in the sheet)
  el.inset.tool.setAttribute("transform", translateAlong(IP, [0, 0, dz]));
  const [tx, ty] = TOOL_REST();
  const [wx, wy] = worldXY(pose.x, pose.y);
  // the sheet is fixed under a fixed camera; the groove pattern slides with the sheet's true position
  const slide = translateAlong(IP, [-(wx - tx), -(wy - ty), 0]);
  el.inset.groove.setAttribute("transform", slide);
  el.inset.grooveFloor.setAttribute("transform", slide);
  const gp = (mx, my) => { const [ax, ay] = worldXY(mx, my); return iat([ax - tx, ay - ty, 0.02]); };
  const current = PROG.segs.findIndex((s) => state.clock <= s.t1 && state.clock >= s.t0);
  for (const p of [...el.inset.groove.querySelectorAll("path[data-live]"), ...el.inset.grooveFloor.querySelectorAll("path[data-live]")]) {
    const i = Number(p.dataset.seg);
    const s = PROG.segs[i];
    const [x, y] = segEnd(s, i, current, state.clock);
    p.setAttribute("d", pathOf([gp(s.from[0], s.from[1]), gp(x, y)]));
    if (i !== current) delete p.dataset.live;
  }
  // the bit below the sheet surface is hidden by the sheet: draw it from the surface (or the tip) up to the shank
  const IF = G.frameOf([0, 0, 0], [0, 0, 1], [1, 0, 0], [0, 1, 0]);
  const bitBottom = Math.max(dz, 0);
  const bitTop = D.inset.Z0 - 1.0 + dz; // stop below the nut's near bottom rim, which sits in front of the axis
  el.inset.bit.innerHTML = bitTop > bitBottom + 0.05 ? solidSvg(G.disc(bitBottom, bitTop, D.inset.flute.r, IF, IP, { steps: 16 }), { tone: "hi" }) : "";
  const rpm = effect ? effect.rpm : state.running ? D.machine.rpm : 0;
  if (rpm) state.spin += dt * 2.4;
  const fl = D.inset.flute;
  const flutes = [0, Math.PI].map((ph) => {
    const pts = [];
    for (let i = 0; i <= 14; i++) {
      const t = i / 14;
      const z = fl.z0 + (fl.z1 - fl.z0) * t + dz;
      if (z < 0) continue;
      const a = ph + state.spin + t * fl.turns * Math.PI * 2;
      pts.push(iat([fl.r * 0.98 * Math.cos(a), fl.r * 0.98 * Math.sin(a), z]));
    }
    return pts.length > 1 ? `<path class="iso-line" data-tone="lo" d="${pathOf(pts)}"/>` : "";
  }).join("");
  el.inset.flutes.innerHTML = flutes;
  if (pose.cut && rpm && state.running && !still.matches) {
    for (let i = 0; i < 2; i++) {
      const a = Math.random() * Math.PI * 2;
      state.chips.push({ x: 0.4 * Math.cos(a), y: 0.4 * Math.sin(a), z: 0.1, vx: Math.cos(a) * (3 + Math.random() * 3), vy: Math.sin(a) * (3 + Math.random() * 3), vz: 6 + Math.random() * 6, life: 0.5 + Math.random() * 0.3 });
    }
  }
  for (const c of state.chips) {
    c.x += c.vx * dt; c.y += c.vy * dt; c.z += c.vz * dt; c.vz -= 30 * dt; c.life -= dt;
    if (c.z < -0.1) { c.z = -0.1; c.vz = 0; c.vx *= 0.5; c.vy *= 0.5; }
  }
  state.chips = state.chips.filter((c) => c.life > 0 && Math.hypot(c.x, c.y) < 9);
  el.inset.chips.innerHTML = state.chips.map((c) => { const [px, py] = iat([c.x, c.y, c.z]); return `<circle cx="${px.toFixed(1)}" cy="${py.toFixed(1)}" r="${(0.9 * c.life + 0.4).toFixed(2)}" opacity="${Math.min(1, c.life * 2).toFixed(2)}"/>`; }).join("");
}

// ---------------------------------------------------------------- faults
function light(prefixes) {
  for (const item of el.items) {
    const name = item.dataset.name;
    const on = prefixes.some((p) => name === p || name.startsWith(p + ".") || name.startsWith(p + ":") || name === "inset." + p);
    if (on) item.setAttribute("data-on", "");
    else item.removeAttribute("data-on");
  }
}
function setFault(id) {
  const fault = FAULT_LIST.find((f) => f.id === id) ?? null;
  state.fault = fault;
  state.faultAge = 0;
  if (fault) {
    stage.setAttribute("data-fault", fault.id);
    light(fault.parts);
    note.innerHTML = `<span><b>${fault.name}.</b> ${fault.symptom}</span><span><b>Cause.</b> ${fault.cause}</span><span><b>Cure.</b> ${fault.cure}</span>`;
    runButton.setAttribute("data-fault", "");
    runButton.removeAttribute("data-on");
    state.running = false;
    runLabel.textContent = "Clear fault";
  } else {
    stage.removeAttribute("data-fault");
    light([]);
    note.innerHTML = "";
    runButton.removeAttribute("data-fault");
    runLabel.textContent = state.running ? "Pause" : state.clock > 0 && state.clock < PROG.total ? "Resume" : "Run";
  }
  for (const b of faultButtons) b.toggleAttribute("data-on", fault && b.dataset.fault === fault.id);
  run();
}
function faultEffect(fault, age) {
  const e = { dx: 0, dy: 0, dz: 0, rack: 0, rpm: D.machine.rpm, word: fault.name.toLowerCase(), lift: 0 };
  const ease = Math.min(1, age / 0.8);
  switch (fault.id) {
    case "alpha": e.rack = 7 * ease; e.word = "alpha alarm · stopped"; break;
    case "zzero": e.dz = -1.2 * ease; e.word = "C2 · plate not sensed"; break;
    case "prox": e.word = "C3 · switch missed"; break;
    case "rpm": e.rpm = 0; e.word = "spindle off · feed on"; break;
    case "collet": e.dz = -0.8 * ease; e.word = "bit slipping"; break;
    case "holddown": e.lift = 7 * ease; e.word = "part lifted"; break;
    case "rack": e.dx = 0.6 * ease; e.word = "position creep"; break;
    case "usb": e.word = "USB lost · spindle running"; break;
    case "clampstrike": e.word = "clamp strike at safe Z"; break;
    case "screw": e.word = "bit hit a hold-down screw · spindle running"; break;
  }
  return e;
}

// ---------------------------------------------------------------- readout
const f0 = (v) => Math.round(v).toString();
function say(pose, effect) {
  const X = f0(pose.x * 10 + (effect?.dx ?? 0) * 10);
  const Y = f0(pose.y * 10);
  const Z = (pose.z * 10 + (effect?.dz ?? 0) * 10).toFixed(0);
  const rpm = effect ? effect.rpm : state.running ? D.machine.rpm : 0;
  const feed = pose.speed ? `${Math.round(pose.speed * 10)} mm/s` : "";
  const chip = pose.cut && rpm ? ` · ${((pose.speed * 10 * 60) / (rpm * D.machine.flutes)).toFixed(2)} mm/tooth` : "";
  const word = state.fault ? effect.word : state.running ? (pose.cut ? "cutting" : pose.speed >= D.machine.rapid.z ? "rapid" : "plunge") : state.clock >= PROG.total ? "done" : state.clock > 0 ? "paused" : "idle";
  const text = `${word} · X ${X} Y ${Y} Z ${Z} mm${feed && state.running ? ` · ${feed}` : ""}${rpm ? ` · ${rpm} rpm` : ""}${state.running ? chip : ""}`;
  if (readout.textContent !== text) {
    readout.textContent = text;
    status.textContent = text;
  }
}

// ---------------------------------------------------------------- loop
let frame = 0;
let last = 0;
let visible = true;
let idle = 0;
const TOUR = ["run", "alpha", "collet", "holddown", "rack", "rpm", "zzero", "usb", "prox", "clampstrike"];
let tourStep = 0;

function tick(now) {
  const dt = Math.min(0.12, last ? (now - last) / 1000 : 0);
  last = now;
  const calm = still.matches;
  if (state.touring && !state.fault && !state.running) {
    state.tourClock += dt;
    if (state.tourClock > 3) {
      state.tourClock = 0;
      const step = TOUR[tourStep % TOUR.length];
      tourStep++;
      if (step === "run") { resetCut(); state.clock = 0; state.running = true; runButton.setAttribute("data-on", ""); runLabel.textContent = "Pause"; }
      else setFault(step);
    }
  }
  if (state.touring && state.fault) {
    state.tourClock += dt;
    if (state.tourClock > 7) { state.tourClock = 0; setFault(null); }
  }
  if (state.running) {
    state.clock += dt * SPEED;
    if (state.clock >= PROG.total) {
      state.clock = PROG.total;
      state.running = false;
      runButton.removeAttribute("data-on");
      runLabel.textContent = "Run";
      state.tourClock = 0;
    }
  }
  const pose = poseFor(PROG, state.clock);
  let effect = null;
  if (state.fault) {
    state.faultAge += dt;
    effect = faultEffect(state.fault, state.faultAge);
  }
  const target = toolOffsets(pose);
  target.dx += effect?.dx ?? 0;
  target.dz += effect?.dz ?? 0;
  const rack = effect?.rack ?? 0;
  const k = calm ? 1 : 1 - Math.exp(-dt / 0.08);
  state.shown.dx += (target.dx - state.shown.dx) * k;
  state.shown.dy += (target.dy - state.shown.dy) * k;
  state.shown.dz += (target.dz - state.shown.dz) * k;
  state.shown.rack += (rack - state.shown.rack) * k;
  moveGroups(state.shown.dx, state.shown.dy, state.shown.dz, state.shown.rack);
  drawServices(state.shown.dx, state.shown.dy, state.shown.dz);
  drawCut(state.clock);
  if (el.part) {
    if (effect?.lift) el.part.setAttribute("transform", translateAlong(P, [0, 0, effect.lift]));
    else el.part.removeAttribute("transform");
  }
  drawInset(pose, dt, effect);
  el.leds.pwr?.setAttribute("data-on", "");
  el.leds.run?.toggleAttribute("data-on", state.running);
  el.leds.led?.toggleAttribute("data-red", !!state.fault && (Math.floor(state.faultAge * 2.5) % 2 === 0));
  say(pose, effect);
  showTransport();
  const moving = Math.abs(target.dx - state.shown.dx) + Math.abs(target.dy - state.shown.dy) + Math.abs(target.dz - state.shown.dz) + Math.abs(rack - state.shown.rack) > 0.01;
  const alive = state.running || state.touring || moving || state.chips.length || (state.fault && state.faultAge < 2);
  frame = visible && alive ? requestAnimationFrame(tick) : 0;
}
function run() {
  if (!frame && visible) {
    last = 0;
    frame = requestAnimationFrame(tick);
  }
}
function setTour(on) {
  state.touring = on && !still.matches;
  state.tourClock = 2.5;
  tourButton?.setAttribute("aria-pressed", state.touring ? "true" : "false");
  if (!state.touring && state.fault) setFault(null);
  run();
}
function takeOver() {
  if (state.touring) setTour(false);
}
const mmss = (t) => `${Math.floor(t / 60)}:${String(Math.floor(t % 60)).padStart(2, "0")}`;
function showTransport() {
  if (scrub && document.activeElement !== scrub) scrub.value = state.clock.toFixed(1);
  if (timeLabel) {
    const text = `${mmss(state.clock)} / ${mmss(PROG.total)}`;
    if (timeLabel.textContent !== text) timeLabel.textContent = text;
  }
}
function seek(time) {
  state.clock = Math.max(0, Math.min(PROG.total, time));
  if (state.fault) setFault(null);
  if (state.clock >= PROG.total && state.running) pause();
  run();
}
function pause() {
  state.running = false;
  runButton.removeAttribute("data-on");
  runLabel.textContent = state.clock > 0 && state.clock < PROG.total ? "Resume" : "Run";
}
function play() {
  if (state.fault) setFault(null);
  if (state.clock >= PROG.total) { state.clock = 0; resetCut(); }
  state.running = true;
  runButton.setAttribute("data-on", "");
  runLabel.textContent = "Pause";
  run();
}
function toggleRun() {
  if (state.fault) { setFault(null); return; }
  if (state.running) pause(); else play();
}
function reset() {
  setFault(null);
  state.running = false;
  state.clock = 0;
  resetCut();
  runButton.removeAttribute("data-on");
  runLabel.textContent = "Run";
  run();
}

new IntersectionObserver((entries) => {
  visible = entries[entries.length - 1].isIntersecting;
  if (visible) run();
}, { rootMargin: "120px 0px" }).observe(stage);

stage.addEventListener("keydown", (event) => {
  if (event.metaKey || event.ctrlKey || event.altKey) return;
  const key = event.key;
  const fault = FAULT_LIST.find((f) => f.key.toLowerCase() === key.toLowerCase());
  if (fault) {
    event.preventDefault();
    takeOver();
    setFault(state.fault && state.fault.id === fault.id ? null : fault.id);
  } else if (key === " " || key === "Enter") {
    event.preventDefault();
    takeOver();
    toggleRun();
  } else if (key === "Escape") {
    event.preventDefault();
    takeOver();
    reset();
  } else if (key === "Home" || key === "r" || key === "R") {
    event.preventDefault();
    takeOver();
    seek(0);
  } else if (key === "End") {
    event.preventDefault();
    takeOver();
    seek(PROG.total);
  } else if (key === "ArrowLeft" || key === "ArrowRight") {
    event.preventDefault();
    takeOver();
    seek(state.clock + (key === "ArrowLeft" ? -10 : 10));
  } else if (key === "," || key === ".") {
    event.preventDefault();
    takeOver();
    pause();
    seek(state.clock + (key === "," ? -1 : 1));
  } else if (key === "t" || key === "T") {
    event.preventDefault();
    setTour(!state.touring);
  }
});
rewindButton?.addEventListener("click", () => { takeOver(); seek(0); stage.focus({ preventScroll: true }); });
backButton?.addEventListener("click", () => { takeOver(); seek(state.clock - 10); stage.focus({ preventScroll: true }); });
fwdButton?.addEventListener("click", () => { takeOver(); seek(state.clock + 10); stage.focus({ preventScroll: true }); });
scrub?.addEventListener("input", () => { takeOver(); seek(Number(scrub.value)); });
scrub?.addEventListener("keydown", (event) => { if (event.key === " ") { event.preventDefault(); toggleRun(); } });
speedSelect?.addEventListener("change", () => { SPEED = Number(speedSelect.value); });
tourButton?.addEventListener("click", () => setTour(!state.touring));
runButton.addEventListener("click", () => { takeOver(); toggleRun(); stage.focus({ preventScroll: true }); });
for (const b of faultButtons) b.addEventListener("click", () => { takeOver(); setFault(state.fault && state.fault.id === b.dataset.fault ? null : b.dataset.fault); });
svg.addEventListener("click", (event) => {
  const hit = event.target.closest(".it");
  if (!hit) return;
  const name = hit.dataset.name;
  const fault = FAULT_LIST.find((f) => f.parts.some((p) => name === p || name.startsWith(p + ".") || name.startsWith(p + ":")));
  if (fault) { takeOver(); setFault(fault.id); stage.focus({ preventScroll: true }); }
});

moveGroups(0, 0, 0, 0);
drawServices(0, 0, 0);
drawInset(poseFor(PROG, 0), 0, null);
say(poseFor(PROG, 0), null);
showTransport();
run();
