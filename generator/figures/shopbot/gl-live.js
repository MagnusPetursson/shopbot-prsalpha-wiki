// ShopBot PRSalpha 144-60 in raw WebGL2 (no libraries): per-group materials, hemispheric + key light with a wrap term,
// soft planar shadows, a fading ground grid, depth-faded edges, staged fault sequences with callouts, and a camera with
// sliders, orthographic mode, keyboard orbit, saved views and a shareable URL hash. Same model, program and faults as the SVG page.
const D = __DATA__;
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const stage = $(".sb-gl-stage");
const canvas = stage.querySelector("canvas");
const fallback = $(".sb-gl-fallback");
const calloutLayer = $("[data-callouts]");
const readout = $("[data-readout]");
const status = $("[data-status]");
const runButton = $("[data-run]");
const runLabel = $("[data-run-label]");
const scrub = $("[data-scrub]");
const timeLabel = $("[data-time]");
const speedSelect = $("[data-speed]");
const tourButton = $("[data-tour]");
const followButton = $("[data-follow]");
const footButton = $("[data-foot]");
const capBeat = $("[data-beat]");
const capText = $("[data-caption]");
const capTodo = $("[data-todo]");
const capNav = $("[data-beatnav]");
const autoButton = $("[data-beat-auto]");
const faultButtons = $$("[data-fault]");
const faultDetail = $("[data-fault-detail]");
const viewButtons = $$("[data-view]");
const projButtons = $$("[data-proj]");
const themeButtons = $$("[data-theme-set]");
const savedList = $("[data-saved]");
const linkOut = $("[data-link]");
const still = matchMedia("(prefers-reduced-motion: reduce)");
let SPEED = D.speed;
const PROG = D.program;
const FAULT_LIST = D.faults;
const STAGES = D.stages;
const LAYER = D.layers;
const TIP0 = [D.rest.gx + D.rest.spx, D.rest.cy, D.rest.stockTop + D.safeZ];
const ST = D.rest.stockTop;
const DEG = Math.PI / 180;

const gl = canvas.getContext("webgl2", { antialias: true, alpha: false, stencil: true, powerPreference: "high-performance" });
if (!gl) {
  fallback.hidden = false;
  throw new Error("WebGL2 unavailable");
}

// ---------------------------------------------------------------- math (no per-frame allocation in the hot path)
const v3 = {
  sub: (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]],
  add: (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]],
  mul: (a, s) => [a[0] * s, a[1] * s, a[2] * s],
  dot: (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2],
  cross: (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]],
  len: (a) => Math.hypot(a[0], a[1], a[2]),
  unit: (a) => { const l = Math.hypot(a[0], a[1], a[2]) || 1; return [a[0] / l, a[1] / l, a[2] / l]; },
};
const M4 = () => { const m = new Float32Array(16); m[0] = m[5] = m[10] = m[15] = 1; return m; };
const TMP = M4(), TMP2 = M4();
function ident(o) { o.fill(0); o[0] = o[5] = o[10] = o[15] = 1; return o; }
function mulInto(o, a, b) {
  for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) TMP[j * 4 + i] = a[i] * b[j * 4] + a[4 + i] * b[j * 4 + 1] + a[8 + i] * b[j * 4 + 2] + a[12 + i] * b[j * 4 + 3];
  o.set(TMP); return o;
}
function translation(o, x, y, z) { ident(o); o[12] = x; o[13] = y; o[14] = z; return o; }
// rotation by ang about a unit axis through a pivot: T(p) R T(-p)
function rotAbout(o, ax, ang, p) {
  const [x, y, z] = ax; const c = Math.cos(ang), s = Math.sin(ang), t = 1 - c;
  ident(o);
  o[0] = t * x * x + c; o[1] = t * x * y + s * z; o[2] = t * x * z - s * y;
  o[4] = t * x * y - s * z; o[5] = t * y * y + c; o[6] = t * y * z + s * x;
  o[8] = t * x * z + s * y; o[9] = t * y * z - s * x; o[10] = t * z * z + c;
  o[12] = p[0] - (o[0] * p[0] + o[4] * p[1] + o[8] * p[2]);
  o[13] = p[1] - (o[1] * p[0] + o[5] * p[1] + o[9] * p[2]);
  o[14] = p[2] - (o[2] * p[0] + o[6] * p[1] + o[10] * p[2]);
  return o;
}
function perspectiveInto(o, fovy, aspect, near, far) {
  const f = 1 / Math.tan(fovy / 2), nf = 1 / (near - far);
  o.fill(0); o[0] = f / aspect; o[5] = f; o[10] = (far + near) * nf; o[11] = -1; o[14] = 2 * far * near * nf; return o;
}
function orthoInto(o, halfW, halfH, near, far) {
  o.fill(0); o[0] = 1 / halfW; o[5] = 1 / halfH; o[10] = -2 / (far - near); o[14] = -(far + near) / (far - near); o[15] = 1; return o;
}
function lookAtInto(o, eye, target) {
  let zx = eye[0] - target[0], zy = eye[1] - target[1], zz = eye[2] - target[2];
  let l = Math.hypot(zx, zy, zz) || 1; zx /= l; zy /= l; zz /= l;
  let xx = -zy, xy = zx, xz = 0; // up (0,0,1) x z
  l = Math.hypot(xx, xy) || 1; if (l < 1e-6) { xx = 1; xy = 0; l = 1; } xx /= l; xy /= l;
  const yx = zy * xz - zz * xy, yy = zz * xx - zx * xz, yz = zx * xy - zy * xx;
  o[0] = xx; o[1] = yx; o[2] = zx; o[3] = 0; o[4] = xy; o[5] = yy; o[6] = zy; o[7] = 0; o[8] = xz; o[9] = yz; o[10] = zz; o[11] = 0;
  o[12] = -(xx * eye[0] + xy * eye[1] + xz * eye[2]); o[13] = -(yx * eye[0] + yy * eye[1] + yz * eye[2]); o[14] = -(zx * eye[0] + zy * eye[1] + zz * eye[2]); o[15] = 1;
  return o;
}
const xform = (m, p, out) => { out[0] = m[0] * p[0] + m[4] * p[1] + m[8] * p[2] + m[12]; out[1] = m[1] * p[0] + m[5] * p[1] + m[9] * p[2] + m[13]; out[2] = m[2] * p[0] + m[6] * p[1] + m[10] * p[2] + m[14]; return out; };
const clamp01 = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);
const ease = (t, a, b) => { const x = clamp01((t - a) / (b - a)); return x * x * (3 - 2 * x); };
const lin = (t, a, b) => clamp01((t - a) / (b - a));
const wrapPi = (a) => Math.atan2(Math.sin(a), Math.cos(a));

// ---------------------------------------------------------------- materials (physical colours, linear-ish 0..1) by part name
const MATS = [
  ["steel", [0.30, 0.32, 0.35], 0.35], ["alu", [0.70, 0.72, 0.74], 0.55], ["rail", [0.55, 0.57, 0.60], 0.7], ["mdf", [0.60, 0.48, 0.33], 0.04],
  ["ply", [0.82, 0.68, 0.46], 0.04], ["plate", [0.22, 0.35, 0.52], 0.35], ["motor", [0.13, 0.13, 0.14], 0.45], ["gearbox", [0.40, 0.41, 0.43], 0.45],
  ["spindle", [0.86, 0.86, 0.84], 0.4], ["carbide", [0.36, 0.37, 0.39], 0.8], ["collet", [0.70, 0.64, 0.50], 0.7], ["foot", [0.22, 0.23, 0.25], 0.2],
  ["brush", [0.08, 0.08, 0.08], 0], ["hose", [0.56, 0.58, 0.59], 0.35], ["collector", [0.20, 0.22, 0.24], 0.3], ["bag", [0.84, 0.82, 0.76], 0],
  ["cable", [0.07, 0.07, 0.08], 0.15], ["box", [0.80, 0.81, 0.78], 0.25], ["vfd", [0.17, 0.18, 0.19], 0.2], ["pc", [0.22, 0.23, 0.25], 0.3],
  ["clamp", [0.56, 0.58, 0.61], 0.5], ["knob", [0.09, 0.09, 0.10], 0.2], ["zplate", [0.78, 0.76, 0.70], 0.7], ["prox", [0.72, 0.60, 0.34], 0.6],
  ["chip", [0.88, 0.74, 0.50], 0], ["led", [0.20, 0.21, 0.22], 0.9], ["red", [0.72, 0.13, 0.11], 0.3], ["label", [0.92, 0.92, 0.88], 0],
  ["yellow", [0.86, 0.70, 0.12], 0.3], ["copper", [0.80, 0.46, 0.24], 0.8], ["blue", [0.12, 0.32, 0.78], 0.4], ["green", [0.14, 0.60, 0.24], 0.4], ["tray", [0.05, 0.05, 0.055], 0.15],
  ["groove", [0.10, 0.07, 0.05], 0], ["cut", [0.22, 0.15, 0.08], 0], ["cutBad", [0.85, 0.20, 0.16], 0],
  ["kerfFloor", [0.17, 0.11, 0.06], 0], ["plyA", [0.70, 0.53, 0.32], 0.1], ["plyB", [0.34, 0.22, 0.11], 0.1], ["shard", [0.62, 0.64, 0.67], 0.75],
];
const MAT = Object.fromEntries(MATS.map(([n], i) => [n, i]));
const MAT_RULES = [
  [/^stock/, "ply"], [/^deck\.ruler/, "alu"], [/^deck/, "mdf"], [/^side\./, "alu"], [/^(xrail|xrack|yrail|yrack|zrack)/, "rail"],
  [/^stand\.(nut|stem)/, "rail"], [/^stand\./, "steel"], [/^(endplate|car\.plate)/, "plate"], [/\.mount$|^zmotor\.arm/, "alu"], [/\.gearbox$/, "gearbox"],
  [/^[xyz]motor/, "motor"], [/^(roller|axle|pinion|shaft)/, "rail"], [/^beam/, "alu"], [/^prox\.x\.target/, "steel"], [/^prox\.x\.bracket/, "alu"],
  [/^prox/, "prox"], [/^zbearing/, "gearbox"], [/^zextrusion/, "alu"], [/^spindle\.(plate|clamp)/, "alu"], [/^spindle\.plug/, "motor"],
  [/^spindle\.nose/, "rail"], [/^spindle/, "spindle"], [/^collet/, "collet"], [/^tool/, "carbide"], [/^dustfoot\.brush/, "brush"], [/^dustfoot/, "foot"],
  [/^hose\.bracket/, "alu"], [/^hose/, "hose"], [/^(xchain|ychain|cable)/, "cable"], [/^box\.disconnect$/, "red"], [/^box\.(key|gland|ledstrip)/, "motor"],
  [/^box\.label/, "label"], [/^box/, "box"], [/^pendant\.estop\.(base|collar)/, "yellow"], [/^pendant\.estop/, "red"], [/^pendant\.reset/, "blue"], [/^pendant\.start/, "green"], [/^pendant\.(ring|gland)/, "knob"], [/^pendant/, "box"], [/^tray/, "tray"], [/^vfd\.screen/, "led"], [/^vfd/, "vfd"],
  [/^pc\.cart/, "steel"], [/^pc/, "pc"], [/^boom/, "steel"], [/^collector\.bag/, "bag"], [/^collector\.motor/, "spindle"], [/^collector/, "collector"],
  [/^screw\.\d\.torx/, "groove"], [/^screw\.\d\.gouge/, "alu"], [/^screw/, "rail"], [/^clamp\.\d\.screw/, "rail"], [/^clamp\.\d\.knob/, "knob"], [/^clamp/, "clamp"], [/^zplate\.stored\.holder/, "alu"], [/^zplate/, "zplate"], [/^zclip.*boot/, "knob"], [/^zclip/, "copper"], [/^zlead/, "cable"], [/^tick/, "label"], [/^floor\.bad/, "cutBad"], [/^floor/, "groove"],
  [/^led/, "led"], [/^chip/, "chip"], [/^passes\.bad/, "cutBad"], [/^(passes|kerf|burn)/, "groove"], [/^cut/, "cut"],
];
const matOf = (name) => { for (const [re, m] of MAT_RULES) if (re.test(name)) return MAT[m]; return MAT.steel; };

// ---------------------------------------------------------------- parts registry and tessellation
const GROUP_IDS = ["static", "gantryFar", "motorFar", "gantry", "motorNear", "car", "zaxis", "tool", "part", "clamp", "screw", "pathghost"];
const PART = { names: [], index: new Map(), group: [], lo: [], hi: [] };
function partId(name, group) {
  let i = PART.index.get(name);
  if (i === undefined) { i = PART.names.length; PART.index.set(name, i); PART.names.push(name); PART.group.push(group); PART.lo.push([1e9, 1e9, 1e9]); PART.hi.push([-1e9, -1e9, -1e9]); }
  return i;
}
const TONE = { lo: 0, mid: 1, hi: 2 };
function frameAlong(a) { const up = Math.abs(a[2]) < 0.9 ? [0, 0, 1] : [1, 0, 0]; const u = v3.unit(v3.cross(up, a)); return { u, v: v3.cross(a, u) }; }
class Builder {
  constructor(group, track = true) { this.group = group; this.s = []; this.l = []; this.track = track; }
  grow(id, p) { if (!this.track) return; const lo = PART.lo[id], hi = PART.hi[id]; for (let k = 0; k < 3; k++) { if (p[k] < lo[k]) lo[k] = p[k]; if (p[k] > hi[k]) hi[k] = p[k]; } }
  v(p, n, tone, id, mat, smooth) { this.s.push(p[0], p[1], p[2], n[0], n[1], n[2], tone, id, mat, smooth); this.grow(id, p); }
  tri(a, b, c, tone, id, mat) { const n = v3.unit(v3.cross(v3.sub(b, a), v3.sub(c, a))); this.v(a, n, tone, id, mat, 0); this.v(b, n, tone, id, mat, 0); this.v(c, n, tone, id, mat, 0); }
  triN(a, b, c, na, nb, nc, tone, id, mat) { this.v(a, na, tone, id, mat, 1); this.v(b, nb, tone, id, mat, 1); this.v(c, nc, tone, id, mat, 1); }
  quad(a, b, c, d, tone, id, mat) { this.tri(a, b, c, tone, id, mat); this.tri(a, c, d, tone, id, mat); }
  seg(a, b, tone, id, mat) { this.l.push(a[0], a[1], a[2], tone, id, mat, b[0], b[1], b[2], tone, id, mat); this.grow(id, a); this.grow(id, b); }
  ids(entry) { return [TONE[entry.tone] ?? 1, partId(entry.name, this.group), entry.mat ?? matOf(entry.name)]; }
  box(entry) {
    const [t, id, m] = this.ids(entry);
    const [x0, y0, z0] = entry.min; const [x1, y1, z1] = entry.max;
    const P = [[x0, y0, z0], [x1, y0, z0], [x1, y1, z0], [x0, y1, z0], [x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1]];
    for (const [a, b, c, d] of [[0, 3, 2, 1], [4, 5, 6, 7], [0, 1, 5, 4], [1, 2, 6, 5], [2, 3, 7, 6], [3, 0, 4, 7]]) this.quad(P[a], P[b], P[c], P[d], t, id, m);
    for (const [a, b] of [[0, 1], [1, 2], [2, 3], [3, 0], [4, 5], [5, 6], [6, 7], [7, 4], [0, 4], [1, 5], [2, 6], [3, 7]]) this.seg(P[a], P[b], t, id, m);
  }
  prism(entry) {
    const [t, id, m] = this.ids(entry);
    const { F, poly, s0, s1 } = entry;
    const at = (s, [x, y]) => [F.o[0] + F.a[0] * s + F.u[0] * x + F.v[0] * y, F.o[1] + F.a[1] * s + F.u[1] * x + F.v[1] * y, F.o[2] + F.a[2] * s + F.u[2] * x + F.v[2] * y];
    let area = 0;
    for (let i = 0; i < poly.length; i++) { const [x0, y0] = poly[i]; const [x1, y1] = poly[(i + 1) % poly.length]; area += x0 * y1 - x1 * y0; }
    const ring = area < 0 ? [...poly].reverse() : poly;
    const low = ring.map((p) => at(s0, p)), high = ring.map((p) => at(s1, p));
    const n = ring.length;
    for (let i = 0; i < n; i++) {
      const j = (i + 1) % n;
      this.quad(low[i], low[j], high[j], high[i], t, id, m);
      if (!entry.smoothRing || i === 1 || i === 3) { this.seg(low[i], low[j], t, id, m); this.seg(high[i], high[j], t, id, m); }
      if (!entry.smoothRing) this.seg(low[i], high[i], t, id, m);
    }
    for (let i = 1; i < n - 1; i++) { this.tri(low[0], low[i + 1], low[i], t, id, m); this.tri(high[0], high[i], high[i + 1], t, id, m); }
  }
  lathe(entry) {
    const [t, id, m] = this.ids(entry);
    const { F, profile } = entry; const steps = entry.steps ?? 28;
    const { u, v, a, o } = F;
    const radial = (ang) => [u[0] * Math.cos(ang) + v[0] * Math.sin(ang), u[1] * Math.cos(ang) + v[1] * Math.sin(ang), u[2] * Math.cos(ang) + v[2] * Math.sin(ang)];
    const point = (s, r, ang) => { const q = radial(ang); return [o[0] + a[0] * s + q[0] * r, o[1] + a[1] * s + q[1] * r, o[2] + a[2] * s + q[2] * r]; };
    const mer = [[profile[0][0], 0], ...profile, [profile[profile.length - 1][0], 0]];
    const dir = Math.sign(profile[profile.length - 1][0] - profile[0][0]) || 1;
    for (let k = 0; k < mer.length - 1; k++) {
      const [sA, rA] = mer[k]; const [sB, rB] = mer[k + 1];
      if (rA === 0 && rB === 0) continue;
      const ds = sB - sA, dr = rB - rA; const L = Math.hypot(ds, dr) || 1;
      const ns = (-dr / L) * dir, nr = (ds / L) * dir;
      const nrm = (ang) => { const q = radial(ang); return [a[0] * ns + q[0] * nr, a[1] * ns + q[1] * nr, a[2] * ns + q[2] * nr]; };
      for (let i = 0; i < steps; i++) {
        const a0 = (i / steps) * Math.PI * 2, a1 = ((i + 1) / steps) * Math.PI * 2;
        const p00 = point(sA, rA, a0), p01 = point(sA, rA, a1), p10 = point(sB, rB, a0), p11 = point(sB, rB, a1);
        const n0 = nrm(a0), n1 = nrm(a1);
        if (rA === 0) this.triN(p00, p10, p11, n0, n0, n1, t, id, m);
        else if (rB === 0) this.triN(p00, p01, p11, n0, n1, n1, t, id, m);
        else { this.triN(p00, p01, p11, n0, n1, n1, t, id, m); this.triN(p00, p11, p10, n0, n1, n0, t, id, m); }
      }
    }
    for (let k = 0; k < profile.length; k++) {
      const [s, r] = profile[k];
      if (r <= 0) continue;
      const prev = profile[k - 1], next = profile[k + 1];
      const corner = !prev || !next || Math.abs((r - prev[1]) * (next[0] - s) - (next[1] - r) * (s - prev[0])) > 1e-6;
      if (!corner) continue;
      for (let i = 0; i < steps; i++) this.seg(point(s, r, (i / steps) * Math.PI * 2), point(s, r, ((i + 1) / steps) * Math.PI * 2), t, id, m);
    }
  }
  tube(entry) {
    const [t, id, m] = this.ids(entry);
    const { route: pts, r } = entry; const around = entry.around ?? 10; const rings = entry.rings ?? 0;
    if (pts.length < 2) return;
    let prev = null, prevN = null, u = null, v = null;
    for (let k = 0; k < pts.length; k++) {
      const dir = v3.unit(v3.sub(pts[Math.min(k + 1, pts.length - 1)], pts[Math.max(k - 1, 0)]));
      if (!u) ({ u, v } = frameAlong(dir));
      else { u = v3.unit(v3.sub(u, v3.mul(dir, v3.dot(u, dir)))); v = v3.cross(dir, u); }
      const ring = [], nrm = [];
      for (let i = 0; i < around; i++) { const ang = (i / around) * Math.PI * 2; const q = v3.add(v3.mul(u, Math.cos(ang)), v3.mul(v, Math.sin(ang))); nrm.push(q); ring.push(v3.add(pts[k], v3.mul(q, r))); }
      if (prev) for (let i = 0; i < around; i++) { const j = (i + 1) % around; this.triN(prev[i], prev[j], ring[j], prevN[i], prevN[j], nrm[j], t, id, m); this.triN(prev[i], ring[j], ring[i], prevN[i], nrm[j], nrm[i], t, id, m); }
      if (rings && k % rings === 0 && k > 0 && k < pts.length - 1) for (let i = 0; i < around; i++) this.seg(ring[i], ring[(i + 1) % around], t, id, m);
      prev = ring; prevN = nrm;
    }
  }
  segs(entry) { const [t, id, m] = this.ids(entry); for (const [a, b] of entry.segments) this.seg(a, b, t, id, m); }
  add(entry) { this[entry.kind === "lines" ? "segs" : entry.kind](entry); }
}

function groupOf(entry) {
  const n = entry.name;
  if (n === "stock.part") return "part";
  if (/^clamp\.1\./.test(n)) return "clamp";
  if (/^screw\.1\./.test(n)) return "screw";
  if (n === "tool") return "tool";
  if (/^(xmotor\.far|pinion\.x\.far|shaft\.x\.far)/.test(n)) return "motorFar";
  if (/^(xmotor\.near|pinion\.x\.near|shaft\.x\.near)/.test(n)) return "motorNear";
  if (entry.layer === LAYER.farGantry) return "gantryFar";
  if (entry.layer === LAYER.gantry) return "gantry";
  if (entry.layer === LAYER.car) return "car";
  if (entry.layer === LAYER.zaxis) return "zaxis";
  return "static";
}
const builders = Object.fromEntries(GROUP_IDS.map((g) => [g, new Builder(g)]));
for (const entry of D.meshes) builders[groupOf(entry)].add(entry);
// Extra parts the fault staging needs: indicator LEDs on the control box face, a pendant with its three buttons on the
// existing pendant body, chips in the near rack and the two offset profile passes.
{
  const b = builders.static;
  const ledZ = 43.5, ledY = 207.6;
  [["led.power", 330], ["led.fault", 335.5], ["led.in1", 341], ["led.in3", 346.5]].forEach(([name, x]) => b.add({ kind: "lathe", name, F: { o: [x, ledY, ledZ], a: [0, 1, 0], u: [1, 0, 0], v: [0, 0, 1] }, profile: [[0, 1.5], [0.4, 1.5], [0.4, 1.1], [0.9, 1.0], [1.1, 0.6]], tone: "hi", steps: 20 }));
  b.add({ kind: "box", name: "box.ledstrip", min: [327, ledY, ledZ - 2.9], max: [349.5, ledY + 0.15, ledZ + 2.9], tone: "lo" });
  b.add({ kind: "box", name: "vfd.screen", min: [256, 207.6, 62], max: [266, 207.9, 66.5], tone: "hi" });
  for (let i = 0; i < 26; i++) {
    const x = 262 + i * 2.6 + Math.sin(i * 7.1) * 0.9, y = 217.8 + ((i * 37) % 10) / 10 * 1.0, s = 0.35 + ((i * 53) % 7) / 20;
    b.add({ kind: "box", name: "chip", min: [x - s, y, 87], max: [x + s, y + s * 0.9, 87 + s * 0.8], tone: "hi" });
  }
  const R = [315.4, 131.0, 374.6, 170.2];
  const ribbon = (name, off, w, z0, z1) => {
    const [x0, y0, x1, y1] = [R[0] + off[0], R[1] + off[1], R[2] + off[0], R[3] + off[1]];
    b.add({ kind: "box", name, min: [x0 - w, y0 - w, z0], max: [x1 + w, y0 + w, z1], tone: "hi" });
    b.add({ kind: "box", name, min: [x0 - w, y1 - w, z0], max: [x1 + w, y1 + w, z1], tone: "hi" });
    b.add({ kind: "box", name, min: [x0 - w, y0 + w, z0], max: [x0 + w, y1 - w, z1], tone: "hi" });
    b.add({ kind: "box", name, min: [x1 - w, y0 + w, z0], max: [x1 + w, y1 - w, z1], tone: "hi" });
  };
  ribbon("kerf", [0, 0], 0.3, ST - 0.02, ST + 0.03);
  // the screw fault's toolpath from CAM: the cutter's 6 mm swath along the first profile pass, drawn only as a green ghost
  builders.pathghost.add({ kind: "box", name: "pathghost.swath", min: [D.screw.path[0], D.screw.pathY - D.machine.toolDia / 2, ST + 0.01], max: [D.screw.path[1], D.screw.pathY + D.machine.toolDia / 2, ST + 0.05], tone: "hi" });
  ribbon("passes.good", [0, 0], 0.3, ST + 0.02, ST + 0.08);
  ribbon("passes.bad", [-6, 2], 0.3, ST + 0.04, ST + 0.10);
  {
    const b = builders.zaxis, x = D.rest.gx + D.rest.spx, y = D.rest.cy, z = 95.4;
    const id = partId("tool.stub", "zaxis");
    b.add({ kind: "lathe", name: "tool.stub", F: { o: [x, y, z], a: [0, 0, 1], u: [1, 0, 0], v: [0, 1, 0] }, profile: [[0.65, 0.3], [1.9, 0.3]], tone: "hi", steps: 16 });
    const ring = Array.from({ length: 12 }, (_, i) => [x + Math.cos(i * Math.PI / 6) * 0.3, y + Math.sin(i * Math.PI / 6) * 0.3, z + (i % 3) * 0.23]);
    for (let i = 0; i < ring.length; i++) {
      const a = ring[i], c = ring[(i + 1) % ring.length];
      b.quad(a, c, [c[0], c[1], z + 0.65], [a[0], a[1], z + 0.65], 2, id, MAT.carbide);
      b.tri(a, [x, y, z + 0.36], c, 2, id, MAT.alu);
    }
  }
  {
    const T0 = PROG.segs.find((sg) => sg.to[0] > 110 && sg.cut)?.t0 ?? PROG.total * 0.55;
    const pz = poseFor(PROG, T0 + 10 * SPEED * 0.5);
    b.add({ kind: "lathe", name: "burn", F: { o: [D.origin.x - pz.x, D.origin.y - pz.y, ST + 0.03], a: [0, 0, 1], u: [1, 0, 0], v: [0, 1, 0] }, profile: [[0, 1.6], [0.04, 1.6]], tone: "lo", steps: 24 });
  }
  {
    const ax = D.rest.gx + D.rest.spx, cy = D.rest.cy, zb = D.rest.zb;
    builders.zaxis.add({ kind: "box", name: "tick.nut", min: [ax - 0.18, cy + 1.95, zb - 2.0], max: [ax + 0.18, cy + 2.4, zb - 0.6], tone: "hi" });
    builders.tool.add({ kind: "lathe", name: "tick.shank", F: { o: [ax, cy, zb - 2.35], a: [0, 0, 1], u: [1, 0, 0], v: [0, 1, 0] }, profile: [[0, 0.36], [0.3, 0.36]], tone: "hi", steps: 16 });
  }
  builders.tool.add({ kind: "lathe", name: "tool.shank", F: { o: [D.rest.gx + D.rest.spx, D.rest.cy, 97.2], a: [0, 0, 1], u: [1, 0, 0], v: [0, 1, 0] }, profile: [[0, 0.3], [3.3, 0.3]], tone: "hi", steps: 16 });
}
for (const n of ["hose.foot.live", "hose.live", "ychain.live", "xchain.live", "cut", "zlead.live", "floor.good", "floor.bad"]) partId(n, "static");
// The SB3 Position panel on the monitor face: one textured quad; its readouts and input tiles are registered as parts
// (bounds only, no geometry) so beats can focus them and callouts can point at them.
const SCREEN = { x: 461.04, y0: 92, y1: 132, z0: 105, z1: 129, W: 1000, H: 600 };
const SCREEN_LAYOUT = (() => {
  const L = { readout: [], inputs: [], outputs: [] };
  ["x", "y", "z"].forEach((k, i) => L.readout.push({ k, x: 26, y: 62 + i * 140, w: 548, h: 122 }));
  const tileX = (i) => 604 + i * 46 + (i >= 4 ? 14 : 0);
  for (let i = 0; i < 8; i++) { L.inputs.push({ x: tileX(i), y: 98, w: 42, h: 66 }); L.outputs.push({ x: tileX(i), y: 232, w: 42, h: 66 }); }
  L.cut = { x: 26, y: 506, w: 948, h: 76 };
  return L;
})();
function screenPart(name, r) {
  const i = partId(name, "static");
  const u0 = r.x / SCREEN.W, u1 = (r.x + r.w) / SCREEN.W, v0 = 1 - (r.y + r.h) / SCREEN.H, v1 = 1 - r.y / SCREEN.H;
  PART.lo[i] = [SCREEN.x, SCREEN.y0 + (SCREEN.y1 - SCREEN.y0) * u0, SCREEN.z0 + (SCREEN.z1 - SCREEN.z0) * v0];
  PART.hi[i] = [SCREEN.x + 0.05, SCREEN.y0 + (SCREEN.y1 - SCREEN.y0) * u1, SCREEN.z0 + (SCREEN.z1 - SCREEN.z0) * v1];
}
screenPart("screen", { x: 0, y: 0, w: SCREEN.W, h: SCREEN.H });
SCREEN_LAYOUT.readout.forEach((r) => screenPart(`screen.${r.k}`, r));
SCREEN_LAYOUT.inputs.forEach((r, i) => screenPart(`screen.in${i + 1}`, r));
SCREEN_LAYOUT.outputs.forEach((r, i) => screenPart(`screen.out${i + 1}`, r));
screenPart("screen.cut", SCREEN_LAYOUT.cut);
const SHARD_ID = partId("shatter.fragment", "static");
const NPARTS = PART.names.length;
const bboxOf = (prefix) => { const lo = [1e9, 1e9, 1e9], hi = [-1e9, -1e9, -1e9]; PART.names.forEach((n, i) => { if (n === prefix || n.startsWith(prefix + ".")) for (let k = 0; k < 3; k++) { lo[k] = Math.min(lo[k], PART.lo[i][k]); hi[k] = Math.max(hi[k], PART.hi[i][k]); } }); return { lo, hi }; };
const exact = (n) => { const i = PART.index.get(n); return { lo: PART.lo[i], hi: PART.hi[i] }; };
const DECK = exact("deck"), STOCK = exact("stock");

// ---------------------------------------------------------------- shaders (GLSL ES 3.00)
const HEAD = "#version 300 es\nprecision highp float;\nprecision highp int;\n";
const PARTS_GLSL = `uniform sampler2D uParts; uniform vec3 uMat[${MATS.length}]; uniform float uSpec[${MATS.length}];
vec4 partState(float id){ int i = int(id + 0.5); return texelFetch(uParts, ivec2(i % 256, i / 256), 0); }`;
const SOLID_VS = `${HEAD}layout(location=0) in vec3 aPos; layout(location=1) in vec3 aNrm; layout(location=2) in vec4 aAttr;
uniform mat4 uProj, uView, uModel; ${PARTS_GLSL}
out vec3 vW; out vec3 vN; out vec3 vCol; out vec3 vEmit; out float vSpec; out float vSmooth; flat out int vMode;
void main(){ vec4 st = partState(aAttr.y); vMode = int(st.r * 255.0 + 0.5); vEmit = st.gba;
  vec4 w = uModel * vec4(aPos, 1.0); vW = w.xyz; vN = mat3(uModel) * aNrm; int m = int(aAttr.z + 0.5);
  vCol = uMat[m] * (aAttr.x < 0.5 ? 0.92 : aAttr.x < 1.5 ? 1.0 : 1.05); vSpec = uSpec[m]; vSmooth = aAttr.w;
  gl_Position = vMode == 3 ? vec4(2.0, 2.0, 2.0, 1.0) : uProj * uView * w; }`;
const SOLID_FS = `${HEAD}in vec3 vW; in vec3 vN; in vec3 vCol; in vec3 vEmit; in float vSpec; in float vSmooth; flat in int vMode;
uniform vec3 uEye, uViewDir, uKeyDir, uKey, uSky, uGround, uNeutral, uAccent, uFog; uniform vec2 uFogRange;
uniform float uFocus, uPulse, uXray, uGhostA; uniform vec3 uGhostCol; uniform int uPass, uOrtho; out vec4 o;
void main(){
  if (uPass == 2) { o = vec4(uGhostCol, uGhostA); return; }
  if (uPass == 0 && vMode == 4) discard;
  if (uPass == 1 && vMode != 4) discard;
  vec3 n = normalize(vN); vec3 V = uOrtho == 1 ? -uViewDir : normalize(uEye - vW);
  if (vSmooth < 0.5 && dot(n, V) < 0.0) n = -n;
  vec3 amb = mix(uGround, uSky, n.z * 0.5 + 0.5);
  float wrap = max(0.0, (dot(n, uKeyDir) + 0.45) / 1.45);
  vec3 H = normalize(uKeyDir + V); float sp = pow(max(dot(n, H), 0.0), 48.0) * vSpec;
  float fres = pow(1.0 - clamp(abs(dot(n, V)), 0.0, 1.0), 3.0);
  vec3 c = vCol * (amb + uKey * wrap) + uKey * sp * 0.55 + uSky * fres * 0.05;
  if (vMode == 0) { float g = dot(c, vec3(0.3, 0.59, 0.11)); c = mix(c, uNeutral * (0.8 + 0.5 * g), 0.9 * uFocus); }
  if (vMode == 2) c = mix(c, uAccent * (0.55 + 0.6 * wrap), 0.62 + 0.18 * uPulse) + uAccent * fres * 0.4;
  if (vEmit.r + vEmit.g + vEmit.b > 0.01) c = vEmit * (0.9 + 0.3 * fres) + vec3(0.12);
  float d = distance(uEye, vW); c = mix(c, uFog, smoothstep(uFogRange.x, uFogRange.y, d) * 0.55);
  o = vec4(c, vMode == 4 ? uXray : 1.0); }`;
const LINE_VS = `${HEAD}layout(location=0) in vec3 aPos; layout(location=2) in vec4 aAttr;
uniform mat4 uProj, uView, uModel; ${PARTS_GLSL}
uniform vec2 uFade; uniform float uDepthBias, uEdge, uFocus, uLineAlpha; uniform int uGhost; uniform vec3 uAccent, uGhostCol; out vec4 vC;
void main(){ vec4 st = partState(aAttr.y); int mode = int(st.r * 255.0 + 0.5); vec4 w = uModel * vec4(aPos, 1.0); vec4 e = uView * w;
  float fade = 1.0 - smoothstep(uFade.x, uFade.y, -e.z - uDepthBias); int m = int(aAttr.z + 0.5);
  vec3 col = uMat[m] * uEdge; float a = uLineAlpha * fade;
  if (m >= ${MAT.cut}) { col = uMat[m]; a = 1.0; }
  if (mode == 0) a *= 1.0 - 0.94 * uFocus;
  if (mode == 2) { col = m >= ${MAT.cut} ? uMat[m] : uAccent; a = max(a, 0.95); }
  if (mode == 4) a *= 0.45;
  if (uGhost == 1) { col = uGhostCol; a = 0.95; }
  vC = vec4(col, a); gl_Position = mode == 3 ? vec4(2.0, 2.0, 2.0, 1.0) : uProj * e; }`;
const LINE_FS = `${HEAD}in vec4 vC; out vec4 o; void main(){ o = vC; }`;
// Soft planar shadows: casters are flattened along the key light onto a plane and rasterised into a small coverage
// texture in plane coordinates; the floor and an overlay quad on the deck and the sheet sample it with a Poisson disc.
const SHADOW_VS = `${HEAD}layout(location=0) in vec3 aPos; layout(location=2) in vec4 aAttr;
uniform mat4 uModel; uniform vec3 uL; uniform float uPlane; uniform vec4 uRect; ${PARTS_GLSL}
void main(){ vec4 st = partState(aAttr.y); int mode = int(st.r * 255.0 + 0.5); vec4 w = uModel * vec4(aPos, 1.0);
  float z = max(w.z, uPlane); vec2 p = w.xy - uL.xy * ((z - uPlane) / uL.z); vec2 uv = (p - uRect.xy) / (uRect.zw - uRect.xy);
  gl_Position = (mode == 3 || mode == 4) ? vec4(2.0, 2.0, 2.0, 1.0) : vec4(uv * 2.0 - 1.0, 0.0, 1.0); }`;
const SHADOW_FS = `${HEAD}out vec4 o; void main(){ o = vec4(1.0); }`;
const SOFT_GLSL = `uniform sampler2D uShTex; uniform vec4 uShRect;
vec4 cubicW(float v){ vec4 n = vec4(1.0, 2.0, 3.0, 4.0) - v; vec4 s = n * n * n; float x = s.x, y = s.y - 4.0 * s.x, z = s.z - 4.0 * s.y + 6.0 * s.x; return vec4(x, y, z, 6.0 - x - y - z) / 6.0; }
float shadowAt(vec2 xy){ vec2 uv = (xy - uShRect.xy) / (uShRect.zw - uShRect.xy); if (uv.x < 0.0 || uv.y < 0.0 || uv.x > 1.0 || uv.y > 1.0) return 0.0;
  // B-spline bicubic from four bilinear taps: no Mach bands when a low-resolution coverage texel spans many pixels
  vec2 ts = vec2(textureSize(uShTex, 0)); vec2 st = uv * ts - 0.5; vec2 f = fract(st); st -= f;
  vec4 xc = cubicW(f.x), yc = cubicW(f.y); vec4 c = st.xxyy + vec2(-0.5, 1.5).xyxy; vec4 s = vec4(xc.xz + xc.yw, yc.xz + yc.yw);
  vec4 o = (c + vec4(xc.yw, yc.yw) / s) / ts.xxyy;
  float a = texture(uShTex, o.xz).r, b = texture(uShTex, o.yz).r, cc = texture(uShTex, o.xw).r, d = texture(uShTex, o.yw).r;
  float sx = s.x / (s.x + s.y), sy = s.z / (s.z + s.w);
  return mix(mix(d, cc, sx), mix(b, a, sx), sy); }`;
const BLUR_VS = `${HEAD}layout(location=0) in vec3 aPos; out vec2 vUV; void main(){ vUV = aPos.xy; gl_Position = vec4(aPos.xy * 2.0 - 1.0, 0.0, 1.0); }`;
const BLUR_FS = `${HEAD}in vec2 vUV; uniform sampler2D uSrc; uniform vec2 uStep; out vec4 o;
void main(){ const float W[5] = float[5](0.2270, 0.1946, 0.1216, 0.0541, 0.0162); float s = texture(uSrc, vUV).r * W[0];
  for (int i = 1; i < 5; i++) { s += (texture(uSrc, vUV + uStep * float(i)).r + texture(uSrc, vUV - uStep * float(i)).r) * W[i]; } o = vec4(s, 0.0, 0.0, 1.0); }`;
const PLANE_VS = `${HEAD}layout(location=0) in vec3 aPos; uniform mat4 uProj, uView; uniform vec4 uQuad; uniform float uZ; out vec2 vXY;
void main(){ vXY = mix(uQuad.xy, uQuad.zw, aPos.xy); gl_Position = uProj * uView * vec4(vXY, uZ, 1.0); }`;
const PLANE_FS = `${HEAD}in vec2 vXY; ${SOFT_GLSL} uniform vec4 uShadow; out vec4 o;
void main(){ float a = shadowAt(vXY) * uShadow.a; if (a < 0.003) discard; o = vec4(uShadow.rgb, a); }`;
const FLOOR_VS = `${HEAD}layout(location=0) in vec3 aPos; uniform mat4 uProj, uView; out vec2 vXY; void main(){ vXY = aPos.xy; gl_Position = uProj * uView * vec4(aPos, 1.0); }`;
const FLOOR_FS = `${HEAD}in vec2 vXY; ${SOFT_GLSL} uniform vec3 uFloor, uGrid, uClear; uniform vec4 uShadow; uniform vec2 uCentre; uniform float uRadius; out vec4 o;
void main(){ vec2 q = vXY / 50.0; vec2 g = abs(fract(q - 0.5) - 0.5) / fwidth(q); float line = 1.0 - min(min(g.x, g.y), 1.0);
  vec2 q2 = vXY / 250.0; vec2 g2 = abs(fract(q2 - 0.5) - 0.5) / fwidth(q2); float major = 1.0 - min(min(g2.x, g2.y), 1.0);
  float r = length(vXY - uCentre) / uRadius; float fade = 1.0 - smoothstep(0.25, 1.0, r);
  vec3 c = mix(uFloor, uGrid, max(line * 0.55, major * 0.9) * fade);
  c = mix(c, uShadow.rgb, shadowAt(vXY) * uShadow.a);
  o = vec4(mix(uClear, c, fade), 1.0); }`;
function program(vs, fs) {
  const p = gl.createProgram();
  for (const [type, src] of [[gl.VERTEX_SHADER, vs], [gl.FRAGMENT_SHADER, fs]]) {
    const sh = gl.createShader(type); gl.shaderSource(sh, src); gl.compileShader(sh);
    if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(sh));
    gl.attachShader(p, sh);
  }
  gl.linkProgram(p);
  if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p));
  const u = {}; const n = gl.getProgramParameter(p, gl.ACTIVE_UNIFORMS);
  for (let i = 0; i < n; i++) { const info = gl.getActiveUniform(p, i); u[info.name.replace(/\[0\]$/, "")] = gl.getUniformLocation(p, info.name); }
  return { p, u };
}
const SCREEN_VS = `${HEAD}layout(location=0) in vec3 aPos; uniform mat4 uProj, uView; uniform vec3 uO, uU, uV; out vec2 vUV;
void main(){ vUV = aPos.xy; gl_Position = uProj * uView * vec4(uO + uU * aPos.x + uV * aPos.y, 1.0); }`;
const SCREEN_FS = `${HEAD}in vec2 vUV; uniform sampler2D uTex; uniform float uDim; uniform vec3 uNeutral; out vec4 o;
void main(){ vec3 c = texture(uTex, vUV).rgb; float g = dot(c, vec3(0.3, 0.59, 0.11)); o = vec4(mix(c, uNeutral * (0.8 + 0.5 * g), 0.88 * uDim), 1.0); }`;
const SOLID = program(SOLID_VS, SOLID_FS), LINE = program(LINE_VS, LINE_FS), SHADOW = program(SHADOW_VS, SHADOW_FS), FLOOR = program(FLOOR_VS, FLOOR_FS), PLANE = program(PLANE_VS, PLANE_FS), BLUR = program(BLUR_VS, BLUR_FS), SCRN = program(SCREEN_VS, SCREEN_FS);

// ---------------------------------------------------------------- the SB3 Position panel on the monitor (2D canvas -> texture)
const scr = { canvas: document.createElement("canvas"), tex: gl.createTexture(), key: "", vals: [0, 0, 0], frozen: false, last: 0 };
scr.canvas.width = SCREEN.W; scr.canvas.height = SCREEN.H;
const sctx = scr.canvas.getContext("2d");
const TILE = { off: ["#2a2c22", "#4d7a3c"], green: ["#57d94a", "#14240f"], yellow: ["#f5d63a", "#2b2306"], red: ["#ff3b2f", "#2a0806"] };
function drawScreen(st) {
  const c = sctx, L = SCREEN_LAYOUT, W = SCREEN.W, H = SCREEN.H;
  c.save();
  c.filter = st.frozen ? "grayscale(0.9) brightness(1.08)" : "none";
  c.fillStyle = "#f23b32"; c.fillRect(0, 0, W, H);
  c.fillStyle = "#8a8a8a"; c.fillRect(0, 0, W, 44);
  c.fillStyle = "#151515"; c.font = "600 28px system-ui, sans-serif"; c.textBaseline = "middle"; c.fillText(st.frozen ? "Position (Not Responding)" : "Position", 20, 23);
  c.fillStyle = "#c9c9c9"; c.fillRect(W - 62, 6, 52, 32); c.fillStyle = "#333"; c.fillText("×", W - 45, 22);
  L.readout.forEach((r, i) => {
    c.fillStyle = "#30266c"; c.beginPath(); c.roundRect(r.x, r.y, r.w, r.h, 8); c.fill();
    c.fillStyle = "#defa42"; c.font = "700 76px ui-monospace, Menlo, Consolas, monospace"; c.textBaseline = "middle";
    c.textAlign = "left"; c.fillText(r.k.toUpperCase(), r.x + 20, r.y + r.h / 2);
    c.textAlign = "right"; c.fillText(st.vals[i].toFixed(3), r.x + r.w - 22, r.y + r.h / 2 - 6);
    c.font = "600 22px system-ui, sans-serif"; c.fillText("mm", r.x + r.w - 14, r.y + r.h - 16);
  });
  c.textAlign = "left";
  const head = (t, y) => { c.fillStyle = "#f3f0d9"; c.font = "600 26px system-ui, sans-serif"; c.textBaseline = "middle"; c.fillText(t, 604, y); const w = c.measureText(t).width; c.fillRect(612 + w, y - 1, 970 - 612 - w, 2); };
  head("Inputs", 76); head("Outputs", 210);
  const tile = (r, n, fill, ink, ring) => { c.fillStyle = fill; c.beginPath(); c.roundRect(r.x, r.y, r.w, r.h, 5); c.fill(); c.lineWidth = 2; c.strokeStyle = "#111"; c.stroke(); if (ring) { c.lineWidth = 5; c.strokeStyle = "#ffffff"; c.strokeRect(r.x - 5, r.y - 5, r.w + 10, r.h + 10); } c.fillStyle = ink; c.font = "700 40px system-ui, sans-serif"; c.textAlign = "center"; c.fillText(String(n), r.x + r.w / 2, r.y + r.h / 2 + 2); c.textAlign = "left"; };
  L.inputs.forEach((r, i) => { const t = TILE[st.inputs[i]] ?? TILE.off; tile(r, i + 1, t[0], t[1], st.ring[i]); });
  L.outputs.forEach((r, i) => tile(r, i + 1, "#3a3070", "#8d8aa0", false));
  // four icon buttons and the Mode radios, simplified
  [604, 700, 796, 892].forEach((x, i) => { c.fillStyle = i === 3 ? "#cfe84a" : "#b9c3d6"; c.beginPath(); c.roundRect(x, 326, 80, 60, 6); c.fill(); c.strokeStyle = "#e0662a"; c.lineWidth = 5; c.beginPath(); c.moveTo(x + 20, 370); c.lineTo(x + 60, 340); c.stroke(); });
  c.fillStyle = "#f3f0d9"; c.font = "600 28px system-ui, sans-serif"; c.textBaseline = "middle";
  c.beginPath(); c.arc(622, 432, 11, 0, Math.PI * 2); c.fill(); c.fillStyle = "#222"; c.beginPath(); c.arc(622, 432, 5, 0, Math.PI * 2); c.fill();
  c.fillStyle = "#f3f0d9"; c.fillText("Move/Cut", 642, 433); c.beginPath(); c.arc(800, 432, 11, 0, Math.PI * 2); c.fill(); c.fillText("Preview", 820, 433);
  const k = L.cut; c.fillStyle = "#303426"; c.beginPath(); c.roundRect(k.x, k.y, k.w, k.h, 6); c.fill(); c.lineWidth = 3; c.strokeStyle = "#a6d93a"; c.stroke();
  c.fillStyle = "#c8f03c"; c.font = "700 46px system-ui, sans-serif"; c.textAlign = "center"; c.fillText("Cut Part", k.x + k.w / 2, k.y + k.h / 2 + 2); c.textAlign = "left";
  c.restore();
  if (st.frozen) {
    c.fillStyle = "rgba(235,235,235,0.38)"; c.fillRect(0, 44, W, H - 44);
    c.fillStyle = "rgba(30,30,30,0.85)"; c.beginPath(); c.roundRect(W / 2 - 290, H / 2 - 52, 580, 104, 10); c.fill();
    c.fillStyle = "#ffffff"; c.font = "600 34px system-ui, sans-serif"; c.textAlign = "center"; c.textBaseline = "middle"; c.fillText("USB lost · not responding", W / 2, H / 2 + 2); c.textAlign = "left";
  }
  gl.bindTexture(gl.TEXTURE_2D, scr.tex);
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, scr.canvas);
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
  gl.generateMipmap(gl.TEXTURE_2D);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  const an = gl.getExtension("EXT_texture_filter_anisotropic"); if (an) gl.texParameterf(gl.TEXTURE_2D, an.TEXTURE_MAX_ANISOTROPY_EXT, 8);
  gl.bindTexture(gl.TEXTURE_2D, null);
}

// ---------------------------------------------------------------- part state texture: r = mode, gba = emissive colour
// mode 0 dimmed, 1 normal, 2 culprit, 3 hidden, 4 x-ray
const PW = 256, PH = Math.ceil(NPARTS / PW);
const partData = new Uint8Array(PW * PH * 4);
const partTex = gl.createTexture();
gl.bindTexture(gl.TEXTURE_2D, partTex);
gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, PW, PH, 0, gl.RGBA, gl.UNSIGNED_BYTE, partData);
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
let partsDirty = true;
function uploadParts() { if (!partsDirty) return; gl.bindTexture(gl.TEXTURE_2D, partTex); gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, PW, PH, gl.RGBA, gl.UNSIGNED_BYTE, partData); partsDirty = false; }

// ---------------------------------------------------------------- buffers
function vaoFor(data, stride, normals) {
  const vao = gl.createVertexArray(); gl.bindVertexArray(vao);
  const buf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buf); gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
  gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 3, gl.FLOAT, false, stride * 4, 0);
  if (normals) { gl.enableVertexAttribArray(1); gl.vertexAttribPointer(1, 3, gl.FLOAT, false, stride * 4, 12); gl.enableVertexAttribArray(2); gl.vertexAttribPointer(2, 4, gl.FLOAT, false, stride * 4, 24); }
  else { gl.enableVertexAttribArray(2); gl.vertexAttribPointer(2, 3, gl.FLOAT, false, stride * 4, 12); }
  gl.bindVertexArray(null);
  return { vao, buf, count: data.length / stride };
}
const GROUP = {};
for (const g of GROUP_IDS) {
  const b = builders[g];
  GROUP[g] = { id: g, solid: vaoFor(new Float32Array(b.s), 10, true), lines: vaoFor(new Float32Array(b.l), 6, false), model: M4(), ideal: M4(), visible: true };
}
const ALL = GROUP_IDS.map((g) => GROUP[g]);
const MOVING = ["gantryFar", "motorFar", "gantry", "motorNear", "car", "zaxis", "tool", "part", "clamp", "screw"].map((g) => GROUP[g]);
GROUP.pathghost.visible = false; // never drawn solid: only through drawGhost
const live = { solid: vaoFor(new Float32Array(0), 10, true), lines: vaoFor(new Float32Array(0), 6, false), model: M4() };
// the kerf: removed material drawn as a stencilled channel (footprint at the stock top, then floor and banded ply walls)
const KERF = { w: 0.3, ply: 0.18, segMax: PROG.segs.length };
const KERF_WALL_Q = 4 * Math.ceil(2.0 / KERF.ply);
const cutMax = KERF.segMax * (1 + 1 + KERF_WALL_Q) * 6 * 10;
const cutData = new Float32Array(cutMax);
const cut = vaoFor(new Float32Array(cutMax), 10, true); cut.count = 0; cut.top = 0;
const floorVao = (() => { const R = 1200; const c = [200, 120]; const q = new Float32Array([c[0] - R, c[1] - R, 0, c[0] + R, c[1] - R, 0, c[0] + R, c[1] + R, 0, c[0] - R, c[1] - R, 0, c[0] + R, c[1] + R, 0, c[0] - R, c[1] + R, 0]); const vao = gl.createVertexArray(); gl.bindVertexArray(vao); const b = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, b); gl.bufferData(gl.ARRAY_BUFFER, q, gl.STATIC_DRAW); gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 12, 0); gl.bindVertexArray(null); return vao; })();

// ---------------------------------------------------------------- theme palette (read from the page's CSS variables)
const hex = (s) => { s = s.trim().replace("#", ""); if (s.length === 3) s = s.split("").map((c) => c + c).join(""); const n = parseInt(s.slice(0, 6), 16); return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255]; };
let PAL = null;
function readPalette() {
  const cs = getComputedStyle(document.body);
  const v = (name, fb) => { const s = cs.getPropertyValue(name); return s && s.trim().startsWith("#") ? hex(s) : fb; };
  const light = document.body.dataset.theme === "light";
  const page = v("--anatomy-page", light ? [0.95, 0.95, 0.94] : [0.043, 0.043, 0.043]);
  PAL = light ? {
    clear: page, floor: page.map((c) => c * 0.955), grid: page.map((c) => c * 0.74), sky: [0.80, 0.81, 0.84], ground: [0.42, 0.40, 0.37], key: [0.60, 0.58, 0.54],
    neutral: [0.80, 0.80, 0.79], accent: v("--anatomy-red", [0.9, 0.28, 0.3]), ghost: v("--anatomy-green", [0.19, 0.64, 0.42]), ghostA: 0.34, edge: 0.42, lineAlpha: 0.85, shadow: [0.16, 0.15, 0.13, 0.30], xray: 0.28,
  } : {
    clear: page, floor: [0.085, 0.085, 0.09], grid: [0.2, 0.2, 0.21], sky: [0.70, 0.72, 0.77], ground: [0.28, 0.27, 0.25], key: [0.66, 0.63, 0.58],
    neutral: [0.22, 0.22, 0.23], accent: v("--anatomy-red", [1, 0.42, 0.42]), ghost: v("--anatomy-green", [0.42, 0.88, 0.63]), ghostA: 0.42, edge: 0.42, lineAlpha: 0.8, shadow: [0, 0, 0, 0.55], xray: 0.24,
  };
  const mats = new Float32Array(MATS.length * 3), spec = new Float32Array(MATS.length);
  MATS.forEach(([, c, s], i) => { mats.set(c, i * 3); spec[i] = s; });
  if (!light) { mats.set([0.95, 0.86, 0.66], MAT.cut * 3); }
  else { mats.set([0.30, 0.31, 0.34], MAT.shard * 3); }
  for (const P of [SOLID, LINE, SHADOW, PLANE, FLOOR]) { gl.useProgram(P.p); if (P.u.uMat) gl.uniform3fv(P.u.uMat, mats); if (P.u.uSpec) gl.uniform1fv(P.u.uSpec, spec); if (P.u.uParts) gl.uniform1i(P.u.uParts, 0); }
  for (const b of themeButtons) b.setAttribute("aria-pressed", b.dataset.themeSet === (light ? "light" : "dark") ? "true" : "false");
}
function setTheme(theme) { document.body.dataset.theme = theme; readPalette(); saveHashSoon(); run(); }

// ---------------------------------------------------------------- camera
const BBOX = (() => { const lo = [1e9, 1e9, 1e9], hi = [-1e9, -1e9, -1e9]; for (const b of Object.values(builders)) for (let i = 0; i < b.s.length; i += 10) for (let k = 0; k < 3; k++) { lo[k] = Math.min(lo[k], b.s[i + k]); hi[k] = Math.max(hi[k], b.s[i + k]); } return { lo, hi, centre: lo.map((v, k) => (v + hi[k]) / 2), radius: Math.hypot(hi[0] - lo[0], hi[1] - lo[1], hi[2] - lo[2]) / 2 }; })();
const WHOLE = BBOX.radius / Math.sin(0.3) * 0.74;
const cam = { az: D.camera.azimuth * DEG, el: D.camera.elevation * DEG, dist: WHOLE, target: [...D.camera.target], fov: 34, ortho: false, follow: null, tau: 0.12 };
const goal = { az: cam.az, el: cam.el, dist: cam.dist, target: [...cam.target], fov: cam.fov };
const VIEWS = {
  whole: { az: D.camera.azimuth, el: D.camera.elevation, dist: WHOLE, target: [BBOX.centre[0] + 10, BBOX.centre[1], 92] },
  gantry: { az: 28, el: 40, dist: 320, follow: { kind: "gantry", off: [0, 0, 0] } },
  tool: { az: 70, el: 24, dist: 50, follow: { kind: "tool", off: [0, 0, 0] }, foot: false },
  operator: { az: 30, el: 17, dist: 250, target: [432, 150, 92] },
  under: { az: 46, el: -8, dist: 420, target: D.camera.under },
  top: { az: 90, el: 89, dist: WHOLE * 0.95, target: [BBOX.centre[0], BBOX.centre[1], 90] },
};
const eye = [0, 0, 0], viewDir = [0, 0, 0];
function eyeOf(c, out = [0, 0, 0]) { const ce = Math.cos(c.el); out[0] = c.target[0] + Math.cos(c.az) * ce * c.dist; out[1] = c.target[1] + Math.sin(c.az) * ce * c.dist; out[2] = c.target[2] + Math.sin(c.el) * c.dist; return out; }
const proj = M4(), view = M4(), viewProj = M4();
let orthoPush = 0;
function resize() {
  const ratio = Math.min(2, devicePixelRatio || 1);
  const w = Math.max(1, Math.round(canvas.clientWidth * ratio)), h = Math.max(1, Math.round(canvas.clientHeight * ratio));
  if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; }
  gl.viewport(0, 0, w, h);
}
function updateCamera() {
  const aspect = canvas.width / canvas.height;
  const fov = cam.fov * DEG;
  if (cam.ortho) {
    const halfH = cam.dist * Math.tan(fov / 2);
    orthoPush = BBOX.radius * 3;
    const c = { az: cam.az, el: cam.el, dist: cam.dist + orthoPush, target: cam.target };
    eyeOf(c, eye);
    orthoInto(proj, halfH * aspect, halfH, 1, cam.dist + orthoPush + BBOX.radius * 4);
  } else {
    orthoPush = 0;
    eyeOf(cam, eye);
    const near = Math.max(0.5, Math.min(60, cam.dist * 0.04));
    perspectiveInto(proj, fov, aspect, near, cam.dist + BBOX.radius * 5);
  }
  lookAtInto(view, eye, cam.target);
  mulInto(viewProj, proj, view);
  const l = Math.hypot(cam.target[0] - eye[0], cam.target[1] - eye[1], cam.target[2] - eye[2]) || 1;
  viewDir[0] = (cam.target[0] - eye[0]) / l; viewDir[1] = (cam.target[1] - eye[1]) / l; viewDir[2] = (cam.target[2] - eye[2]) / l;
}
function setGoal(v, instant = false) {
  if (v.az !== undefined) goal.az = cam.az + wrapPi(v.az * DEG - cam.az);
  if (v.el !== undefined) goal.el = Math.max(-0.35, Math.min(1.55, v.el * DEG));
  if (v.dist !== undefined) goal.dist = Math.max(8, Math.min(3000, v.dist));
  if (v.fov !== undefined) goal.fov = Math.max(8, Math.min(100, v.fov));
  if (v.ortho !== undefined) cam.ortho = !!v.ortho;
  if (v.target) goal.target = [...v.target];
  cam.follow = v.follow ? { ...v.follow } : v.target ? null : cam.follow;
  followButton?.setAttribute("aria-pressed", cam.follow?.kind === "tool" ? "true" : "false");
  for (const b of projButtons) b.setAttribute("aria-pressed", (b.dataset.proj === "ortho") === cam.ortho ? "true" : "false");
  if (instant) { cam.az = goal.az; cam.el = goal.el; cam.dist = goal.dist; cam.fov = goal.fov; if (!cam.follow) cam.target = [...goal.target]; cam.snap = true; }
  run();
}
function setView(name) {
  const v = VIEWS[name];
  if (!v) return;
  cam.tau = 0.3;
  setGoal({ ...v, follow: v.follow ?? null });
  if (!state.fault) setDustFoot(v.foot !== false);
  for (const b of viewButtons) b.setAttribute("aria-pressed", b.dataset.view === name ? "true" : "false");
}
const clearPreset = () => { for (const b of viewButtons) b.setAttribute("aria-pressed", "false"); };

// pointer: drag orbits, shift/right/middle drag pans, wheel zooms toward the cursor, pinch zooms
let drag = null;
const pointers = new Map();
canvas.addEventListener("pointerdown", (e) => {
  canvas.setPointerCapture(e.pointerId);
  pointers.set(e.pointerId, [e.clientX, e.clientY]);
  drag = { x: e.clientX, y: e.clientY, pan: e.button === 1 || e.button === 2 || e.shiftKey, pinch: pointers.size === 2 ? pinchState() : null };
  cam.tau = 0.08; clearPreset(); takeOver();
  stage.focus({ preventScroll: true });
});
function pinchState() { const [a, b] = [...pointers.values()]; return { d: Math.hypot(a[0] - b[0], a[1] - b[1]), cx: (a[0] + b[0]) / 2, cy: (a[1] + b[1]) / 2 }; }
canvas.addEventListener("pointermove", (e) => {
  if (!pointers.has(e.pointerId)) return;
  pointers.set(e.pointerId, [e.clientX, e.clientY]);
  if (pointers.size === 2 && drag) { const now = pinchState(); if (drag.pinch) { zoomBy(drag.pinch.d / now.d, now.cx, now.cy); panBy(now.cx - drag.pinch.cx, now.cy - drag.pinch.cy); } drag.pinch = now; return; }
  if (!drag) return;
  const dx = e.clientX - drag.x, dy = e.clientY - drag.y;
  drag.x = e.clientX; drag.y = e.clientY;
  if (drag.pan) panBy(dx, dy);
  else { goal.az -= dx * 0.006; goal.el = Math.max(-0.35, Math.min(1.55, goal.el + dy * 0.006)); }
  run();
});
const endDrag = (e) => { pointers.delete(e.pointerId); if (!pointers.size) drag = null; else drag = { ...drag, pinch: null }; };
canvas.addEventListener("pointerup", endDrag);
canvas.addEventListener("pointercancel", endDrag);
canvas.addEventListener("contextmenu", (e) => e.preventDefault());
function camAxes(c) { const e = eyeOf(c); const z = v3.unit(v3.sub(e, c.target)); const x = v3.unit(v3.cross([0, 0, 1], z)); return { e, z, x, y: v3.cross(z, x) }; }
function panBy(dx, dy) {
  const { x, y } = camAxes(goal);
  const scale = (2 * goal.dist * Math.tan(cam.fov * DEG / 2)) / canvas.clientHeight;
  if (cam.follow) { goal.target = [...cam.target]; cam.follow = null; followButton?.setAttribute("aria-pressed", "false"); }
  goal.target = v3.add(goal.target, v3.add(v3.mul(x, -dx * scale), v3.mul(y, dy * scale)));
  run();
}
function rayAt(clientX, clientY, c) {
  const rect = canvas.getBoundingClientRect();
  const nx = ((clientX - rect.left) / rect.width) * 2 - 1, ny = 1 - ((clientY - rect.top) / rect.height) * 2;
  const { e, x, y, z } = camAxes(c);
  const t = Math.tan(cam.fov * DEG / 2), aspect = rect.width / rect.height;
  if (cam.ortho) { const h = c.dist * t; return { eye: v3.add(v3.add(v3.add(c.target, v3.mul(x, nx * h * aspect)), v3.mul(y, ny * h)), v3.mul(z, c.dist)), dir: v3.mul(z, -1) }; }
  return { eye: e, dir: v3.unit(v3.add(v3.add(v3.mul(x, nx * t * aspect), v3.mul(y, ny * t)), v3.mul(z, -1))) };
}
function zoomBy(factor, clientX, clientY) {
  const { eye: e, dir } = rayAt(clientX, clientY, goal);
  const z = v3.mul(camAxes(goal).z, -1);
  const depth = v3.dot(v3.sub(goal.target, e), z) / Math.max(1e-6, v3.dot(dir, z));
  const under = v3.add(e, v3.mul(dir, depth));
  const next = Math.max(8, Math.min(3000, goal.dist * factor));
  const k = 1 - next / goal.dist;
  if (!cam.follow) goal.target = v3.add(goal.target, v3.mul(v3.sub(under, goal.target), k));
  goal.dist = next; cam.tau = 0.1;
  run();
}
canvas.addEventListener("wheel", (e) => { e.preventDefault(); clearPreset(); zoomBy(Math.exp(e.deltaY * (e.deltaMode === 1 ? 0.05 : 0.0016)), e.clientX, e.clientY); }, { passive: false });
canvas.addEventListener("dblclick", (e) => {
  const { eye: e0, dir } = rayAt(e.clientX, e.clientY, cam);
  if (Math.abs(dir[2]) < 1e-4) return;
  const t = (ST - e0[2]) / dir[2];
  if (t <= 0) return;
  cam.follow = null; goal.target = v3.add(e0, v3.mul(dir, t)); goal.dist = Math.max(40, goal.dist * 0.5); cam.tau = 0.3;
  followButton?.setAttribute("aria-pressed", "false"); clearPreset(); run();
});

// ---------------------------------------------------------------- machine state (same model as the SVG page)
const state = window.__sb = { clock: 0, running: false, fault: null, beat: 0, beatT: 0, auto: true, touring: false, tourClock: 0, shown: { dx: 0, dy: 0, dz: 0, rack: 0 }, spin: 0 };
function poseFor(prog, time) {
  const t = Math.max(0, Math.min(prog.total, time));
  let seg = prog.segs[prog.segs.length - 1];
  for (const s of prog.segs) if (t <= s.t1) { seg = s; break; }
  const share = seg.t1 > seg.t0 ? (t - seg.t0) / (seg.t1 - seg.t0) : 1;
  return { x: seg.from[0] + (seg.to[0] - seg.from[0]) * share, y: seg.from[1] + (seg.to[1] - seg.from[1]) * share, z: seg.from[2] + (seg.to[2] - seg.from[2]) * share, speed: seg.speed, cut: seg.cut && seg.from[2] + (seg.to[2] - seg.from[2]) * share < 0, seg };
}
const worldXY = (mx, my) => [D.origin.x - mx, D.origin.y - my];

// fault effect: one object reused every frame
const fx = { dx: 0, dy: 0, dz: 0, rack: 0, liftFar: 0, liftNear: 0, slip: 0, bend: 0, drop: 0, creep: 0, part: false, partLift: 0, partTilt: 0, partYaw: 0, clampShift: 0, clampTilt: 0, screwTilt: 0, screwShift: 0, leds: { power: 1, fault: 0, in1: 0, in3: 0 }, flash: 0, flashAt: null, spark: 0, sparkAt: null, link: 0, spin: 0, vars: {}, mpos: null,
  emit: {}, inputs: ["off", "off", "off", "off", "off", "off", "off", "off"], ring: [false, false, false, false, false, false, false, false], frozen: false, fling: -1, smoke: 0, floor: [], zlead: false };
function resetFx() {
  fx.rack = fx.liftFar = fx.liftNear = fx.slip = fx.bend = fx.drop = fx.creep = fx.partLift = fx.partTilt = fx.partYaw = fx.clampShift = fx.clampTilt = fx.screwTilt = fx.screwShift = fx.flash = fx.spark = fx.link = fx.spin = 0;
  fx.part = false; fx.flashAt = fx.sparkAt = null; fx.leds.power = 1; fx.leds.fault = fx.leds.in1 = fx.leds.in3 = 0; fx.mpos = null;
  for (const k in fx.vars) delete fx.vars[k];
  for (const k in fx.emit) delete fx.emit[k];
  fx.fracture = -1;
  fx.inputs.fill("off"); fx.ring.fill(false); fx.frozen = false; fx.fling = -1; fx.smoke = 0; fx.floor.length = 0; fx.zlead = false;
}
const SLIP_DRAWN = 4; // the collet slip is drawn this many times larger than it is
const ZZ = D.zzero;
const SCREW = D.screw;
// contact: the 6 mm cutter on the path line touches the 8 mm head of screw.1
const SCREW_CONTACT = SCREW.hit[0] + Math.sqrt((D.machine.toolDia / 2 + SCREW.head.r) ** 2 - (SCREW.hit[1] - SCREW.pathY) ** 2);
const SCREW_IMPACT = [SCREW_CONTACT - D.machine.toolDia / 2, (SCREW.hit[1] + SCREW.pathY) / 2, ST + 0.15];
const SPARK_AT = [SCREW_IMPACT[0] + 0.2, SCREW_IMPACT[1] + 0.3, ST + 0.5];
const tipAt = (x, y, z) => { fx.dx = x - TIP0[0]; fx.dy = y - TIP0[1]; fx.dz = z - TIP0[2]; };
const fmt1 = (v) => v.toFixed(1);
const blink = (t, hz = 3) => ((t * hz) % 1 < 0.55 ? 1 : 0);
const ALPHA_MAX = 0.065;
const BEAT_LEN = 5.2, BEAT_HOLD = 1.8;
// Motion for each fault: b = beat index, t = seconds into the beat. Each beat starts where the previous one ended.
const steps = (k, n, from, to) => { let s = 0; for (let i = 1; i <= n; i++) { const p = (i - 0.5) / n; s += ease(k, p - 0.03, p + 0.03); } return from + (to - from) * s / n; };
// collet: the bit's passes along y = 130.6; each pass creeps in n jerks, the floor it leaves steps down with them
const COLLET = [{ x: [375, 345], depth: 0.9, slip: [0, 0] }, { x: [345, 375], depth: 1.8, slip: [0, 0.1] }, { x: [375, 345], depth: 1.8, slip: [0.1, 0.25] }];
function colletFloor(pass, k) {
  const P = COLLET[pass], n = 4;
  const xAt = (q) => P.x[0] + (P.x[1] - P.x[0]) * q;
  const cuts = P.slip[1] > P.slip[0] ? [0, ...Array.from({ length: n }, (_, i) => (i + 0.5) / n), 1] : [0, 1];
  for (let j = 0; j < cuts.length - 1; j++) {
    const q0 = cuts[j], q1 = Math.min(cuts[j + 1], k);
    if (q1 <= q0) break;
    const slip = P.slip[0] + (P.slip[1] - P.slip[0]) * (cuts.length > 2 ? j / n : 0);
    const a = xAt(q0), b = xAt(q1);
    fx.floor.push([Math.min(a, b), Math.max(a, b), ST - P.depth - SLIP_DRAWN * slip, slip > 0]);
  }
}
const MOTION = {
  alpha(b, t) {
    const y = 130.6, z = ST - 0.9;
    if (b === 0) tipAt(352 - 6 * lin(t, 0, 5), y, z);
    if (b >= 1) { tipAt(346 - 1.5 * (b === 1 ? lin(t, 0, 4) : 1), y, z); fx.liftFar = 1.5 * (b === 1 ? ease(t, 0.4, 1.0) - 0.35 * ease(t, 1.6, 2.0) + 0.35 * ease(t, 2.4, 2.8) : 1); }
    if (b >= 2) { fx.rack = ALPHA_MAX * (b === 2 ? ease(t, 0.3, 3.2) : 1); fx.vars.lag = fmt1((200 * Math.sin(fx.rack) * 10) / 20); }
    if (b === 3) {
      fx.leds.fault = t > 0.5 ? (t < 2 ? blink(t, 4) : 1) : 0;
      if (t > 0.6) { fx.inputs[3] = "red"; fx.ring[3] = true; }
      if (t > 2.4) fx.emit["pendant.reset"] = blink(t, 1.6) ? [0.35, 0.6, 1.0] : [0.10, 0.22, 0.55];
    }
  },
  zzero(b, t) {
    const [x, y] = ZZ.tip, top = ZZ.plate.max[2];
    // Compression followed by brittle fracture, not a cutter drilling through a flexible plate.
    // This is an illustrative sequence, not a failure-force or timing prediction.
    const z = b === 0 ? top + 8 - 4 * ease(t, 0.4, 4.5) : b === 1 ? top + 4 - 4 * lin(t, 0.2, 3.2) : top - 0.08 * ease(t, 0.2, 1.1);
    if (b >= 2) fx.fracture = b === 2 ? t - 1.1 : 6;
    fx.vars.fracture = fx.fracture >= 0 ? "Shattered cutter · broken shank remains" : "No signal · cutter under compression";
    tipAt(x, y, z);
    fx.zlead = true;
    fx.vars.over = fmt1(Math.max(0, (top - z) * 10));
    fx.inputs[0] = "off"; fx.ring[0] = b >= 1;
    if (b === 3) {
      if (t > 1.2) fx.emit["pendant.estop"] = t < 2.6 ? (blink(t, 4) ? [1, 0.2, 0.15] : [0.4, 0.05, 0.04]) : [1, 0.2, 0.15];
      if (t > 1.5) { fx.inputs[3] = "red"; fx.ring[3] = true; }
    }
  },
  prox(b, t) {
    const dx = b === 0 ? 110 + 38 * lin(t, 0, 5) : b === 1 ? 148 + 12 * lin(t, 0, 3) : b === 2 ? 160 + 8.5 * Math.min(1, t / 0.9) : 168.5;
    tipAt(TIP0[0] + dx, TIP0[1], TIP0[2]);
    if (b >= 1) { fx.inputs[1] = fx.inputs[2] = "yellow"; }
    if (b === 2) { fx.flash = t > 0.88 ? 0.3 + 0.7 * Math.exp(-(t - 0.88) * 1.5) : 0; fx.flashAt = [417.2, 214, 96.5]; }
    if (b === 3) { fx.leds.fault = t > 0.4 ? 1 : 0; fx.ring[1] = fx.ring[2] = true; }
  },
  rpm(b, t) {
    const x = 300, y = 150;
    if (b === 0) tipAt(x, y, TIP0[2]);
    if (b === 1) tipAt(x, y, TIP0[2] - (TIP0[2] - (ST - 0.9)) * ease(t, 0.3, 3.0));
    if (b >= 2) { const m = b === 2 ? ease(t, 0.2, 4.0) : 1; tipAt(x - 3 * m, y, ST - 0.9); fx.bend = -0.17 * m; }
    if (b === 3) { fx.bend = -0.17 - 1.2 * ease(t, 0.25, 0.8); fx.drop = 2.6 * ease(t, 0.25, 0.9); fx.flash = t > 0.25 ? Math.exp(-(t - 0.25) * 2.5) : 0; fx.flashAt = "tip"; }
    fx.vars.bend = Math.round(Math.abs(fx.bend) / DEG);
  },
  collet(b, t) {
    const y = 130.6;
    const k = b === 3 ? 1 : lin(t, 0.3, 4.6);
    const P = COLLET[Math.min(b, 2)];
    const x = b === 3 ? 345 : P.x[0] + (P.x[1] - P.x[0]) * k;
    fx.slip = b === 3 ? 0.25 : steps(k, P.slip[1] > P.slip[0] ? 4 : 1, P.slip[0], P.slip[1]);
    for (let p = 0; p < Math.min(b, 3); p++) colletFloor(p, 1);
    if (b < 3) colletFloor(b, k);
    tipAt(x, y, ST - P.depth);
    fx.vars.slip = fmt1(fx.slip * 10);
    fx.vars.depth = fmt1((P.depth + fx.slip) * 10); fx.vars.prog = b === 0 ? "9.0" : "18.0";
    fx.emit["tick.nut"] = [0.95, 0.95, 0.9]; fx.emit["tick.shank"] = [1.0, 0.82, 0.15];
  },
  holddown(b, t) {
    const y = 130.6, z = ST - 1.85;
    fx.part = true;
    const x = b === 0 ? 372 - 42 * lin(t, 0, 5) : b === 1 ? 330 - 8 * lin(t, 0, 4) : b === 2 ? 322 - 6 * lin(t, 0, 4) : 316;
    tipAt(x, y, z);
    fx.partTilt = b === 0 ? 0 : b === 1 ? 0.09 * ease(t, 0.4, 3.5) : b === 2 ? 0.09 + 0.12 * ease(t, 0.3, 2.5) : 0.21;
    fx.partLift = b === 0 ? 0 : b === 1 ? 0.3 * ease(t, 0.4, 3.5) : b === 2 ? 0.3 + 2.4 * ease(t, 0.3, 3) : 2.7;
    fx.partYaw = b === 2 ? 0.55 * ease(t, 0.5, 3.6) : b === 3 ? 0.55 : 0;
    if (b === 2) { fx.flash = t > 0.5 ? 0.3 + 0.7 * Math.exp(-(t - 0.5) * 1.2) : 0; fx.flashAt = "tip"; }
    if (b === 3) { fx.fling = t; fx.bend = -1.1 * ease(t, 0.12, 0.4); fx.drop = 2.4 * ease(t, 0.12, 0.5); fx.flash = t > 0.1 ? Math.exp(-(t - 0.1) * 3) : 0; fx.flashAt = "tip"; }
    fx.vars.lift = fmt1((fx.partLift + 40 * Math.sin(fx.partTilt)) * 10);
  },
  rack(b, t) {
    const y = 170.6, z = ST - 0.9;
    const x = b === 0 ? 360 - 10 * lin(t, 0, 5) : b === 1 ? 350 - 22 * lin(t, 0, 5) : 270;
    const bumps = b === 0 ? t * 1.6 : b === 1 ? 8 + t * 1.6 : 0;
    fx.liftNear = b <= 1 ? 0.7 * Math.pow(Math.max(0, Math.sin(bumps * Math.PI)), 6) : 0;
    fx.creep = b === 0 ? 0 : b === 1 ? 0.25 * Math.floor(Math.min(t, 5) * 1.6) : 2.0;
    tipAt(x, y, z);
    fx.vars.creep = fmt1(fx.creep * 10 / 10); fx.vars.offset = "6";
  },
  usb(b, t) {
    const T0 = PROG.segs.find((s) => s.to[0] > 110 && s.cut)?.t0 ?? PROG.total * 0.55;
    const rate = SPEED * 0.5, stall = 10;
    const tt = b === 0 ? 5 * lin(t, 0, BEAT_LEN) : b === 1 ? 5 + 5 * lin(t, 0, 2) : stall;
    const pose = poseFor(PROG, T0 + tt * rate);
    const [wx, wy] = worldXY(pose.x, pose.y);
    tipAt(wx, wy, ST + pose.z);
    fx.vars.pct = Math.round((T0 + tt * rate) / PROG.total * 100);
    fx.link = b >= 1 && tt >= stall ? 1 : 0;
    fx.frozen = b >= 1 && tt >= stall;
    const stopped = b === 3 && t > 1.2;
    fx.spin = stopped ? 0 : 1;
    if (b === 2) fx.smoke = 0.15 + 0.85 * ease(t, 0, 5);
    if (b === 3) { fx.smoke = stopped ? Math.max(0.25, 1 - 0.5 * (t - 1.2)) : 1; if (t > 1.0) fx.emit["pendant.estop"] = t < 2.4 ? (blink(t, 4) ? [1, 0.2, 0.15] : [0.4, 0.05, 0.04]) : [1, 0.2, 0.15]; }
    fx.vars.state = stopped ? "stopping" : "12000 rpm";
  },
  clampstrike(b, t) {
    const y = 67.1, z = TIP0[2];
    const x = b === 0 ? 250 + 80 * ease(t, 0.2, 3.4) : b === 1 ? 330 + 22 * lin(t, 0, 4) : b === 2 ? 352 + 18.4 * lin(t, 0.3, 0.6) : 370.4;
    tipAt(x, y, z);
    if (b >= 2) { const m = b === 2 ? ease(t, 0.55, 1.0) : 1; fx.clampShift = 0.3 * m; fx.clampTilt = 0.1 * m; fx.bend = 0.12 * m; }
    if (b === 2) { fx.flash = t > 0.55 ? 0.35 + 0.65 * Math.exp(-(t - 0.55) * 1.2) : 0; fx.flashAt = [368.4, 67.1, 95.4]; }
    if (b === 3) { fx.leds.fault = t > 0.4 ? 1 : 0; if (t > 0.6) { fx.inputs[3] = "red"; fx.ring[3] = true; } }
  },
  screw(b, t) {
    // Spindle RUNNING throughout (unlike zzero). The bit feeds along the first profile pass into screw.1; at contact the
    // carbide shatters (same fragments as zzero, thrown harder and swirled by the spin) and the head is gouged and tipped.
    // Illustrative slow motion; the tilt is exaggerated.
    const y = SCREW.pathY, z = ST - 0.9, cx = SCREW_CONTACT;
    const x = b === 0 ? cx + 14 - 8 * lin(t, 0, 5) : b === 1 ? cx + 6 - 5.88 * lin(t, 0.2, 4.6) : b === 2 ? cx + 0.12 - 0.12 * ease(t, 0.2, 1.1) - 1.2 * ease(t, 1.1, 4.5) : cx - 1.2;
    tipAt(x, y, z);
    fx.spin = 1;
    if (b >= 2) fx.fracture = b === 2 ? t - 1.1 : 6;
    const k = b === 2 ? ease(t, 1.1, 1.45) : b === 3 ? 1 : 0;
    fx.screwTilt = -0.38 * k; fx.screwShift = -0.12 * k;
    if (b === 2 && t > 1.1) { fx.flash = 0.35 + 0.65 * Math.exp(-(t - 1.1) * 0.9); fx.flashAt = SCREW_IMPACT; fx.spark = t < 3.2 ? Math.exp(-(t - 1.1) * 1.3) : 0; fx.sparkAt = SPARK_AT; }
    fx.vars.fracture = fx.fracture >= 0 ? "Carbide tip shattered · broken shank" : "Bit meets the screw";
  },
};

// ---------------------------------------------------------------- part modes for the current beat
const matchList = (list, name) => list && list.some((p) => name === p || name.startsWith(p + ".") || name.startsWith(p + ":"));
let HIDDEN = [];
const DUSTFOOT = ["dustfoot", "hose.bracket", "hose.foot.live"];
const LED_IDX = { power: PART.index.get("led.power"), fault: PART.index.get("led.fault"), in1: PART.index.get("led.in1"), in3: PART.index.get("led.in3") };
const LED_ON = { power: [0.25, 0.85, 0.45], fault: [1.0, 0.16, 0.12], in1: [0.25, 0.85, 0.45], in3: [0.25, 0.85, 0.45] };
const ledShown = { power: -1, fault: -1, in1: -1, in3: -1 };
function computeParts() {
  const s = state.fault ? STAGES[state.fault.id] : null;
  const beat = s ? s.beats[state.beat] : null;
  for (let i = 0; i < NPARTS; i++) {
    const n = PART.names[i];
    let mode = 1;
    if (matchList(HIDDEN, n)) mode = 3;
    else if (n === "chip" && state.fault?.id !== "rack") mode = 3;
    else if (n === "kerf" && state.fault?.id !== "holddown") mode = 3;
    else if (n === "tool.stub" && !(fx.fracture >= 0 || (state.beat === 3 && (state.fault?.id === "rpm" || state.fault?.id === "holddown")))) mode = 3;
    else if (n === "shatter.fragment") mode = 1;
    else if (n === "burn" && !(state.beat === 3 && state.fault?.id === "usb")) mode = 3;
    else if (n.startsWith("passes") && !(state.fault?.id === "rack" && state.beat >= 2)) mode = 3;
    else if (n === "stock.part" && state.fault?.id !== "holddown") mode = 3;
    else if (n.startsWith("screw.") && state.fault?.id !== "screw") mode = 3;
    else if (n.startsWith("screw.2") && state.fault?.id === "screw" && state.beat >= 2) mode = 0;
    else if (n === "screw.1.gouge" && !(fx.fracture >= 0)) mode = 3;
    else if (n.startsWith("zclip.flat")) mode = 3; // SVG-only stand-in; WebGL draws the profiled clip on the carriage plate
    else if (n.includes(".stored") && state.fault?.id === "zzero") mode = 3;
    else if (/^(zplate|zlead)/.test(n) && !n.includes(".stored") && state.fault?.id !== "zzero") mode = 3;
    else if (n.startsWith("floor.") && state.fault?.id !== "collet") mode = 3;
    else if (n.startsWith("tick.") && state.fault?.id !== "collet") mode = 3;
    else if (beat) {
      if (matchList(beat.xray, n)) mode = 4;
      else if (matchList(beat.culprit, n)) mode = 2;
      else if (matchList(beat.focus, n)) mode = 1;
      else mode = 0;
    }
    partData[i * 4] = mode;
    if (!n.startsWith("led.")) partData[i * 4 + 1] = partData[i * 4 + 2] = partData[i * 4 + 3] = 0;
  }
  // the screen follows the monitor: in focus whenever the PC is
  const si = PART.index.get("screen"), mi = PART.index.get("pc.monitor");
  if (partData[si * 4] === 0 && (partData[mi * 4] === 1 || partData[mi * 4] === 2)) partData[si * 4] = 1;
  if (partData[si * 4] === 0 && PART.names.some((n, i) => n.startsWith("screen.") && partData[i * 4] >= 1 && partData[i * 4] <= 2)) partData[si * 4] = 1;
  for (const k in ledShown) ledShown[k] = -1;
  for (const k in emitShown) emitShown[k] = "";
  partsDirty = true;
}
const EMIT_NAMES = ["pendant.estop", "pendant.reset", "pendant.start", "tick.nut", "tick.shank"];
const emitShown = Object.fromEntries(EMIT_NAMES.map((n) => [n, ""]));
function updateLeds() {
  for (const n of EMIT_NAMES) {
    const c = fx.emit[n] ?? null;
    const key = c ? c.join(",") : "0";
    if (emitShown[n] === key) continue;
    emitShown[n] = key;
    const i = PART.index.get(n);
    if (i === undefined) continue;
    const v = c ?? [0, 0, 0];
    partData[i * 4 + 1] = v[0] * 255; partData[i * 4 + 2] = v[1] * 255; partData[i * 4 + 3] = v[2] * 255;
    partsDirty = true;
  }
  for (const k in LED_IDX) {
    const on = fx.leds[k] ? 1 : 0;
    if (ledShown[k] === on) continue;
    ledShown[k] = on;
    const i = LED_IDX[k];
    const c = on ? LED_ON[k] : [0, 0, 0];
    partData[i * 4 + 1] = c[0] * 255; partData[i * 4 + 2] = c[1] * 255; partData[i * 4 + 3] = c[2] * 255;
    partsDirty = true;
  }
}
function setDustFoot(shown) {
  HIDDEN = shown ? [] : DUSTFOOT;
  footButton?.setAttribute("aria-pressed", shown ? "false" : "true");
  showCaption();
  computeParts(); run();
}

// ---------------------------------------------------------------- callouts (HTML labels anchored to 3D points)
const POOL = [];
function callout(kind) {
  const el = document.createElement("div");
  el.className = "sbx-callout"; el.dataset.kind = kind; el.hidden = true;
  if (kind === "label") el.innerHTML = `<i class="sbx-dot"></i><svg class="sbx-leader" width="40" height="30" aria-hidden="true"><line x1="0" y1="30" x2="40" y2="0"/></svg><span class="sbx-label"></span>`;
  if (kind === "flash") el.innerHTML = `<svg viewBox="-30 -30 60 60" width="60" height="60" aria-hidden="true">${Array.from({ length: 10 }, (_, i) => { const a = (i / 10) * Math.PI * 2; const r0 = i % 2 ? 9 : 6, r1 = i % 2 ? 26 : 18; return `<line x1="${(Math.cos(a) * r0).toFixed(1)}" y1="${(Math.sin(a) * r0).toFixed(1)}" x2="${(Math.cos(a) * r1).toFixed(1)}" y2="${(Math.sin(a) * r1).toFixed(1)}"/>`; }).join("")}<circle r="4.5"/></svg>`;
  if (kind === "spark") el.innerHTML = `<svg viewBox="-24 -30 48 60" width="48" height="60" aria-hidden="true"><path d="M-4 -28 L6 -6 L-3 -4 L8 26 L-9 -2 L1 -4 Z"/><line x1="-18" y1="-14" x2="-11" y2="-10"/><line x1="12" y1="-18" x2="18" y2="-24"/><line x1="14" y1="6" x2="21" y2="8"/></svg>`;
  if (kind === "link") el.innerHTML = `<svg class="sbx-link-ok" viewBox="-26 -12 52 24" width="52" height="24" aria-hidden="true"><rect x="-22" y="-7" width="24" height="14" rx="7"/><rect x="-2" y="-7" width="24" height="14" rx="7"/></svg><svg class="sbx-link-broken" viewBox="-30 -14 60 28" width="60" height="28" aria-hidden="true"><rect x="-27" y="-7" width="22" height="14" rx="7" transform="rotate(-14 -16 0)"/><rect x="5" y="-7" width="22" height="14" rx="7" transform="rotate(14 16 0)"/><line x1="-2" y1="-12" x2="2" y2="-6"/><line x1="-3" y1="8" x2="3" y2="12"/></svg>`;
  if (kind === "spin") el.innerHTML = `<svg viewBox="-20 -20 40 40" width="40" height="40" aria-hidden="true"><path d="M14 -6 A15 15 0 1 1 3 -15"/><path class="sbx-head" d="M3 -15 L-3 -20 M3 -15 L-2 -9"/></svg>`;
  if (kind === "smoke") el.innerHTML = `<div class="sbx-smoke"><i class="sbx-char"></i><i class="sbx-puff"></i><i class="sbx-puff"></i><i class="sbx-puff"></i><i class="sbx-puff"></i></div>`;
  calloutLayer.append(el);
  const c = { el, kind, label: el.querySelector(".sbx-label"), text: "", w: 0, flip: "" };
  POOL.push(c);
  return c;
}
const LABELS = [callout("label"), callout("label"), callout("label")];
const FLASH = callout("flash"), SPARK = callout("spark"), LINK = callout("link"), SPIN = callout("spin"), SMOKE = callout("smoke");
{
  // styles for the smoke-and-char glyph (kept with the viewer code that owns it)
  const st = document.createElement("style");
  st.textContent = `.sbx-smoke{position:absolute;left:0;top:0;--k:0.5}
.sbx-char{position:absolute;left:calc(-34px*var(--k));top:calc(-11px*var(--k));width:calc(68px*var(--k));height:calc(22px*var(--k));border-radius:50%;background:radial-gradient(closest-side,#120a05 0%,#2a1607 55%,rgba(110,60,20,.55) 80%,rgba(110,60,20,0) 100%)}
.sbx-puff{position:absolute;left:-20px;top:-40px;width:40px;height:40px;border-radius:50%;background:radial-gradient(closest-side,rgba(64,60,56,.9),rgba(110,106,100,.55) 60%,rgba(110,106,100,0));opacity:0;animation:sbx-puff 1.6s linear infinite}
.sbx-smoke .sbx-puff{scale:calc(.5 + .9 * var(--k))}
.sbx-puff:nth-child(3){animation-delay:-.4s;left:-10px}.sbx-puff:nth-child(4){animation-delay:-.8s;left:-28px}.sbx-puff:nth-child(5){animation-delay:-1.2s;left:-16px}
.sbx-smoke{opacity:calc(.35 + .65 * var(--k))}
@keyframes sbx-puff{0%{transform:translate(0,0) scale(.5);opacity:.9}100%{transform:translate(14px,-70px) scale(2.4);opacity:0}}
@media (prefers-reduced-motion:reduce){.sbx-puff{animation:none;opacity:.7}}`;
  document.head.append(st);
}
let hoseMid = [150, 200, 160];
const tmpP = [0, 0, 0], tmpQ = [0, 0, 0];
function anchorPoint(a, out) {
  if (!a) return null;
  if (a === "tip" || a.tip) return xform(GROUP.tool.model, TIP0, out);
  if (a.ghostTip) return xform(GROUP.tool.ideal, TIP0, out);
  if (a === "hose" || a.point === "hose") { out[0] = hoseMid[0]; out[1] = hoseMid[1]; out[2] = hoseMid[2]; return out; }
  if (Array.isArray(a)) { out[0] = a[0]; out[1] = a[1]; out[2] = a[2]; return out; }
  if (Array.isArray(a.point)) { out[0] = a.point[0]; out[1] = a.point[1]; out[2] = a.point[2]; return out; }
  if (a.shard !== undefined) { const S = SHATTER[state.fault?.id]; if (!S || !(fx.fracture >= 0)) return null; shardAt(S, a.shard, out); return out; }
  if (a.part) {
    let i = PART.index.get(a.part);
    if (i === undefined) { const k = PART.names.findIndex((n) => n.startsWith(a.part + ".")); if (k < 0) return null; i = k; }
    const lo = PART.lo[i], hi = PART.hi[i];
    out[0] = (lo[0] + hi[0]) / 2; out[1] = (lo[1] + hi[1]) / 2; out[2] = a.at === "top" ? hi[2] : a.at === "bottom" ? lo[2] : (lo[2] + hi[2]) / 2;
    const g = GROUP[PART.group[i]] ?? GROUP.static;
    xform(g.model, out, tmpQ); out[0] = tmpQ[0]; out[1] = tmpQ[1]; out[2] = tmpQ[2];
    return out;
  }
  return null;
}
function project(p) {
  const m = viewProj;
  const x = m[0] * p[0] + m[4] * p[1] + m[8] * p[2] + m[12], y = m[1] * p[0] + m[5] * p[1] + m[9] * p[2] + m[13], w = m[3] * p[0] + m[7] * p[1] + m[11] * p[2] + m[15];
  if (w <= 1e-4) return null;
  const nx = x / w, ny = y / w;
  return [(nx * 0.5 + 0.5) * canvas.clientWidth, (0.5 - ny * 0.5) * canvas.clientHeight, nx, ny];
}
function placeAt(c, p, visible = true) {
  const s = p && project(p);
  const show = visible && s && Math.abs(s[2]) < 1.05 && Math.abs(s[3]) < 1.05;
  if (c.el.hidden === !!show) c.el.hidden = !show;
  if (!show) return null;
  c.el.style.transform = `translate(${s[0].toFixed(1)}px, ${s[1].toFixed(1)}px)`;
  return s;
}
function fillText(tpl) { return tpl.replace(/\{(\w+)\}/g, (_, k) => fx.vars[k] ?? ""); }
function updateCallouts() {
  const s = state.fault ? STAGES[state.fault.id] : null;
  const beat = s ? s.beats[state.beat] : null;
  const list = beat?.callouts ?? [];
  const used = [];
  LABELS.forEach((c, i) => {
    const spec = list[i];
    if (!spec) { if (!c.el.hidden) c.el.hidden = true; return; }
    const p = anchorPoint(spec, tmpP);
    const sp = placeAt(c, p, state.beatT > 0.25 || still.matches);
    if (!sp) return;
    const text = fillText(spec.text);
    if (c.text !== text) { c.text = text; c.label.textContent = text; c.w = 0; }
    // On a narrow canvas, wrap and clamp labels rather than choosing between two
    // off-screen placements. Keep the leader attached to the true 3D anchor.
    const leader = c.el.querySelector(".sbx-leader"), line = leader.querySelector("line");
    if (canvas.clientWidth < 620) {
      c.label.style.cssText = `white-space:normal;width:max-content;max-width:${Math.min(235, canvas.clientWidth - 32)}px;right:auto;`;
      const w = c.label.offsetWidth, h = c.label.offsetHeight;
      const bx = Math.max(12, Math.min(canvas.clientWidth - w - 12, sp[0] + 38));
      const by = Math.max(70, Math.min(canvas.clientHeight - h - 10, sp[1] + (i % 2 ? 24 : -h - 30)));
      c.label.style.left = `${bx - sp[0]}px`; c.label.style.top = `${by - sp[1]}px`;
      leader.style.cssText = "top:0;transform:none;";
      line.setAttribute("x1", "0"); line.setAttribute("y1", "0");
      line.setAttribute("x2", String(Math.max(bx, Math.min(bx + w, sp[0])) - sp[0]));
      line.setAttribute("y2", String(by + (i % 2 ? 0 : h) - sp[1]));
      c.w = 0;
      return;
    }
    if (c.label.style.cssText) { c.label.style.cssText = ""; leader.style.cssText = ""; line.setAttribute("x1", "0"); line.setAttribute("y1", "30"); line.setAttribute("x2", "40"); line.setAttribute("y2", "0"); c.w = 0; }
    if (!c.w) c.w = c.label.offsetWidth || text.length * 8;
    let flip = (sp[0] + 56 + c.w > canvas.clientWidth - 20 && sp[0] - 56 - c.w > 8 ? "l" : "r") + (sp[1] < 90 ? "d" : "u");
    for (const u of used) if (Math.abs(u[0] - sp[0]) < 170 && Math.abs(u[1] - sp[1]) < 34) flip = flip[0] + (flip[1] === "u" ? "d" : "u");
    used.push(sp);
    if (c.flip !== flip) { c.flip = flip; c.el.dataset.flip = flip; }
  });
  const fp = fx.flash > 0.02 ? anchorPoint(fx.flashAt, tmpP) : null;
  if (placeAt(FLASH, fp, !!fp)) FLASH.el.style.opacity = Math.min(1, fx.flash * 1.4).toFixed(2);
  const spk = fx.spark > 0.02 ? anchorPoint(fx.sparkAt, tmpP) : null;
  if (placeAt(SPARK, spk, !!spk)) SPARK.el.style.opacity = Math.min(1, fx.spark * 1.5).toFixed(2);
  const showLink = state.fault?.id === "usb" && state.beat <= 1;
  if (placeAt(LINK, showLink ? anchorPoint({ part: "pc.monitor" }, tmpP) : null, showLink)) { const k = fx.link ? "broken" : "ok"; if (LINK.el.dataset.state !== k) LINK.el.dataset.state = k; }
  const showSpin = fx.spin > 0 && ((state.fault?.id === "usb" && state.beat >= 2) || state.fault?.id === "screw");
  const showSmoke = fx.smoke > 0.01;
  if (placeAt(SMOKE, showSmoke ? anchorPoint("tip", tmpP) : null, showSmoke)) SMOKE.el.firstChild.style.setProperty("--k", fx.smoke.toFixed(2));
  placeAt(SPIN, showSpin ? anchorPoint({ part: "spindle", at: "bottom" }, tmpP) : null, showSpin);
}

// ---------------------------------------------------------------- staging: select, advance, caption
const faultById = (id) => FAULT_LIST.find((f) => f.id === id) ?? null;
let camBefore = null;
function setFault(id, beat = 0, at = null) {
  const fault = faultById(id);
  if (fault && !state.fault) camBefore = { az: goal.az / DEG, el: goal.el / DEG, dist: goal.dist, target: [...goal.target], follow: cam.follow, foot: HIDDEN.length === 0 };
  state.fault = fault;
  if (fault) {
    if (state.running) pause();
    state.beat = Math.max(0, Math.min(STAGES[fault.id].beats.length - 1, beat));
    state.beatT = at ?? (still.matches ? BEAT_LEN : 0);
    state.hold = false;
    applyBeat(at !== null);
    const f = fault;
    faultDetail.innerHTML = `<p>${f.symptom}</p><dl><dt>Cause</dt><dd>${f.cause}</dd><dt>Cure</dt><dd>${f.cure}</dd></dl>`;
    const li = faultButtons.find((x) => x.dataset.fault === f.id)?.parentElement;
    if (li && faultDetail.parentElement !== li) li.append(faultDetail);
    faultDetail.hidden = false;
    li?.scrollIntoView({ block: "nearest" });
  } else {
    resetFx(); updateLeds();
    HIDDEN = camBefore && !camBefore.foot ? DUSTFOOT : [];
    computeParts();
    faultDetail.innerHTML = ""; faultDetail.hidden = true;
    if (camBefore) { cam.tau = 0.5; setGoal(camBefore); camBefore = null; }
    showCaption();
  }
  for (const b of faultButtons) b.setAttribute("aria-pressed", fault && b.dataset.fault === fault.id ? "true" : "false");
  run();
}
function applyBeat(instant = false) {
  const s = STAGES[state.fault.id];
  const beat = s.beats[state.beat];
  HIDDEN = [...(beat.foot === false ? DUSTFOOT : []), ...(beat.hide ?? [])];
  footButton?.setAttribute("aria-pressed", beat.foot === false ? "true" : "false");
  resetFx(); MOTION[state.fault.id](state.beat, state.beatT);
  computeParts();
  const c = beat.cam;
  cam.tau = 0.55;
  if (c.rel === "gantry") setGoal({ az: c.az, el: c.el, dist: c.dist, follow: { kind: "gantry", off: c.target } }, instant);
  else if (c.rel === "tool" || c.rel === "spindle") setGoal({ az: c.az, el: c.el, dist: c.dist, follow: { kind: c.rel, off: c.target } }, instant);
  else setGoal({ az: c.az, el: c.el, dist: c.dist, target: c.target, follow: null }, instant);
  clearPreset();
  showCaption();
}
function showCaption() {
  if (state.fault) {
    const s = STAGES[state.fault.id];
    const beat = s.beats[state.beat];
    const n = s.beats.length;
    capBeat.textContent = `E${state.fault.e ?? state.fault.key} · ${state.beat + 1} / ${n}`;
    capText.textContent = beat.caption;
    const last = state.beat === n - 1;
    capTodo.hidden = !last;
    if (last) capTodo.innerHTML = `<b>What to do</b> ${s.todo}`;
    capNav.hidden = false;
    $("[data-beat-prev]").disabled = state.beat === 0;
    $("[data-beat-next]").disabled = last;
    status.textContent = `${state.fault.name}, step ${state.beat + 1} of ${n}. ${beat.caption}${last ? ` What to do: ${s.todo}` : ""}`;
    fitCaption();
  } else {
    capBeat.textContent = state.running ? "File" : "Ready";
    capText.textContent = "Drag to orbit · wheel to zoom · shift-drag to pan · 1–9 or S stage a fault · Run button plays · Space pauses.";
    const messy = HIDDEN.includes("dustfoot");
    capTodo.hidden = !messy; capNav.hidden = true;
    if (messy) capTodo.innerHTML = "<b>Dust foot</b> Hidden in the model only. On the machine, cut with the dust foot fitted.";
    fitCaption();
  }
}
function stepBeat(d) {
  if (!state.fault) return;
  const n = STAGES[state.fault.id].beats.length;
  const b = Math.max(0, Math.min(n - 1, state.beat + d));
  if (b === state.beat) return;
  state.beat = b; state.beatT = still.matches ? BEAT_LEN : 0; applyBeat(); run();
}
function replay() { if (!state.fault) return; state.beat = 0; state.beatT = still.matches ? BEAT_LEN : 0; applyBeat(); run(); }
function setAuto(on) { state.auto = on; autoButton?.setAttribute("aria-pressed", on ? "true" : "false"); run(); }

// ---------------------------------------------------------------- readout and transport
const f0 = (v) => Math.round(v).toString();
const screenVals = [0, 0, 0];
function say(pose) {
  let text;
  if (state.fault) {
    const mx = D.origin.x - (TIP0[0] + state.shown.dx), my = D.origin.y - (TIP0[1] + state.shown.dy), mz = TIP0[2] + state.shown.dz - fx.slip - ST;
    text = `E${state.fault.e ?? state.fault.key} ${state.fault.name.toLowerCase()} · X ${f0(mx * 10)} Y ${f0(my * 10)} Z ${(mz * 10).toFixed(0)} mm`;
    screenVals[0] = mx * 10; screenVals[1] = my * 10; screenVals[2] = (TIP0[2] + state.shown.dz - ST) * 10;
  } else {
    const rpm = state.running ? D.machine.rpm : 0;
    const feed = pose.speed ? `${Math.round(pose.speed * 10)} mm/s` : "";
    const chip = pose.cut && rpm ? ` · ${((pose.speed * 10 * 60) / (rpm * D.machine.flutes)).toFixed(2)} mm/tooth` : "";
    const word = state.running ? (pose.cut ? "cutting" : pose.speed >= D.machine.rapid.z ? "rapid" : "plunge") : state.clock >= PROG.total ? "done" : state.clock > 0 ? "paused" : "idle";
    screenVals[0] = pose.x * 10; screenVals[1] = pose.y * 10; screenVals[2] = pose.z * 10;
    text = `${word} · X ${f0(pose.x * 10)} Y ${f0(pose.y * 10)} Z ${(pose.z * 10).toFixed(0)} mm${feed && state.running ? ` · ${feed}` : ""}${rpm ? ` · ${rpm} rpm` : ""}${state.running ? chip : ""}`;
  }
  if (readout.textContent !== text) readout.textContent = text;
}
const mmss = (t) => `${Math.floor(t / 60)}:${String(Math.floor(t % 60)).padStart(2, "0")}`;
let lastTime = "";
function showTransport() {
  if (scrub && document.activeElement !== scrub) { const v = state.clock.toFixed(1); if (scrub.value !== v) scrub.value = v; }
  const text = `${mmss(state.clock)} / ${mmss(PROG.total)}`;
  if (lastTime !== text) { lastTime = text; timeLabel.textContent = text; }
}
function seek(time) { if (state.fault) setFault(null); state.clock = Math.max(0, Math.min(PROG.total, time)); if (state.clock >= PROG.total && state.running) pause(); run(); }
function pause() { state.running = false; runButton.removeAttribute("data-on"); runButton.setAttribute("aria-pressed", "false"); runLabel.textContent = state.clock > 0 && state.clock < PROG.total ? "Resume" : "Run"; showCaption(); }
function play() { if (state.fault) setFault(null); if (state.clock >= PROG.total) state.clock = 0; state.running = true; runButton.setAttribute("data-on", ""); runButton.setAttribute("aria-pressed", "true"); runLabel.textContent = "Pause"; showCaption(); run(); }
function toggleRun() { if (state.fault) { setFault(null); return; } if (state.running) pause(); else play(); }
function reset() { setFault(null); state.running = false; state.clock = 0; pause(); runLabel.textContent = "Run"; run(); }
const TOUR = ["run", ...FAULT_LIST.map((f) => f.id)];
let tourStep = 0;
function setTour(on) { state.touring = on && !still.matches; state.tourClock = 0; tourButton?.setAttribute("aria-pressed", state.touring ? "true" : "false"); if (state.touring) { tourStep = 0; nextTour(); } run(); }
function nextTour() { const step = TOUR[tourStep++ % TOUR.length]; if (step === "run") { setFault(null); state.clock = 0; play(); } else { state.auto = true; setFault(step); } }
function takeOver() { if (state.touring) setTour(false); }

// ---------------------------------------------------------------- live geometry: hose and cable carriers
function rebuildLive(dx, dy, dz) {
  const g = D.routes;
  const gx = D.rest.gx + dx, cy = D.rest.cy + dy;
  const b = new Builder("static", false);
  const T = (name, pts, r, bend, rings) => b.tube({ name, route: G.fillet(pts, bend, 8), r, tone: "hi", rings });
  T("hose.foot.live", hoseFootRoute({ hose: g.hose }, 0, 0).map(([x, y, z]) => [x + gx, y + cy, z + dz]), g.hose.r, 10, 3);
  T("ychain.live", yChainRoute({ ychain: g.ychain }, cy).map(([x, y, z]) => [x + dx, y, z]), 1.6, 5, 2);
  T("xchain.live", xChainRoute({ xchain: g.xchain }, gx), 2.2, 6, 2);
  const boom = hoseBoomRoute({ hose: g.hose, boomTip: g.boomTip, hoseLength: g.hoseLength }, gx, cy, dz);
  T("hose.live", boom, g.hose.r, 14, 3);
  hoseMid = boom[Math.floor(boom.length * 0.12)];
  if (fx.zlead) {
    // Z-zero lead from the clip on the carriage plate down to the plate's terminal post, with some slack on the sheet
    const c = [ZZ.clip[0] + dx, ZZ.clip[1] + dy, ZZ.clip[2] + dz], p = [ZZ.post[0], ZZ.post[1], ZZ.post[2] + 0.5];
    const pts = [c, [c[0] + 0.3, c[1] + 0.6, c[2] - 2.5], [c[0] + 2.5, c[1] + 3.5, ST + 0.35], [p[0] + 1.5, p[1] + 5.5, ST + 0.2], [p[0] + 1.8, p[1] + 1.2, ST + 0.25], [p[0] + 0.6, p[1], p[2]], p];
    b.tube({ name: "zlead.live", route: G.fillet(pts, 1.2, 8), r: 0.13, tone: "lo", around: 8 });
  }
  for (const [x0, x1, z, bad] of fx.floor) {
    const y = 130.6, w = 0.3;
    b.box({ name: bad ? "floor.bad" : "floor.good", min: [x0, y - w, z - 0.07], max: [x1, y + w, z + 0.07], tone: "hi" });
    b.box({ name: bad ? "floor.bad" : "floor.good", min: [x0 - 0.04, y - w, z], max: [x0 + 0.04, y + w, z + 0.4], tone: "hi" });
  }
  for (const [o, data] of [[live.solid, b.s], [live.lines, b.l]]) { gl.bindBuffer(gl.ARRAY_BUFFER, o.buf); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(data), gl.DYNAMIC_DRAW); }
  live.solid.count = b.s.length / 10; live.lines.count = b.l.length / 6;
}
let lastLiveKey = "", lastCutKey = "";
const CUT_ID = PART.index.get("cut");
const kq = { n: 0 };
function kv(x, y, z, nx, ny, nz, mat) { const o = kq.n; cutData[o] = x; cutData[o + 1] = y; cutData[o + 2] = z; cutData[o + 3] = nx; cutData[o + 4] = ny; cutData[o + 5] = nz; cutData[o + 6] = 2; cutData[o + 7] = CUT_ID; cutData[o + 8] = mat; cutData[o + 9] = 0; kq.n += 10; }
// a quad a-b-c-d wound so its face (normal n) points toward the viewer that should see it
function kquad(a0, a1, a2, b0, b1, b2, c0, c1, c2, d0, d1, d2, nx, ny, nz, mat) {
  kv(a0, a1, a2, nx, ny, nz, mat); kv(b0, b1, b2, nx, ny, nz, mat); kv(c0, c1, c2, nx, ny, nz, mat);
  kv(a0, a1, a2, nx, ny, nz, mat); kv(c0, c1, c2, nx, ny, nz, mat); kv(d0, d1, d2, nx, ny, nz, mat);
}
// one wall from p to q (world xy), inward normal (nx, ny), banded in plies from the stock top down to zf
function kwall(px, py, qx, qy, nx, ny, zf) {
  for (let z1 = ST, i = 0; z1 > zf + 1e-4; z1 -= KERF.ply, i++) {
    const z0 = Math.max(zf, z1 - KERF.ply), m = i % 2 ? MAT.plyA : MAT.plyB;
    // counter-clockwise seen from the inward side
    const cx = (qy - py) * nx - (qx - px) * ny; // sign of (q-p) x n in z
    if (cx > 0) kquad(px, py, z0, qx, qy, z0, qx, qy, z1, px, py, z1, nx, ny, 0, m);
    else kquad(qx, qy, z0, px, py, z0, px, py, z1, qx, qy, z1, nx, ny, 0, m);
  }
}
const KSEG = [];
function kerfSeg(ax, ay, bx, by, zf, part) {
  let ux = bx - ax, uy = by - ay; const l = Math.hypot(ux, uy) || 1; ux /= l; uy /= l;
  const nx = -uy, ny = ux, w = KERF.w;
  const sx = ax - ux * w, sy = ay - uy * w, ex = bx + ux * w, ey = by + uy * w;
  const p0x = sx + nx * w, p0y = sy + ny * w, p1x = ex + nx * w, p1y = ey + ny * w, p2x = ex - nx * w, p2y = ey - ny * w, p3x = sx - nx * w, p3y = sy - ny * w;
  if (part !== 2) {
    // footprint (part 0, at the stock top) or floor (part 1); wound to face up
    const z = part === 0 ? ST + 0.004 : zf - 0.03; // the floor sits a hair below the wall feet so it always wins GREATER
    kquad(p3x, p3y, z, p2x, p2y, z, p1x, p1y, z, p0x, p0y, z, 0, 0, 1, MAT.kerfFloor);
    return;
  }
  kwall(p0x, p0y, p1x, p1y, -nx, -ny, zf);
  kwall(p2x, p2y, p3x, p3y, nx, ny, zf);
  kwall(p3x, p3y, p0x, p0y, ux, uy, zf);
  kwall(p1x, p1y, p2x, p2y, -ux, -uy, zf);
}
const KEND = new Float32Array(PROG.segs.length * 2), KIN = new Uint8Array(PROG.segs.length);
const KORDER = PROG.segs.map((s, i) => i).sort((a, b) => PROG.segs[a].to[2] - PROG.segs[b].to[2]); // deepest first
function updateCut(time) {
  const current = PROG.segs.findIndex((s) => time <= s.t1 && time >= s.t0);
  const key = `${current}|${current >= 0 ? Math.round(((time - PROG.segs[current].t0) / Math.max(1e-6, PROG.segs[current].t1 - PROG.segs[current].t0)) * 60) : -1}`;
  if (key === lastCutKey) return;
  lastCutKey = key;
  KIN.fill(0);
  PROG.segs.forEach((s, i) => {
    if (s.t0 > time || !s.cut || s.to[2] >= 0 || (s.from[0] === s.to[0] && s.from[1] === s.to[1])) return;
    let x = s.to[0], y = s.to[1];
    if (i === current) { const share = (time - s.t0) / (s.t1 - s.t0); x = s.from[0] + (s.to[0] - s.from[0]) * share; y = s.from[1] + (s.to[1] - s.from[1]) * share; }
    if (Math.hypot(x - s.from[0], y - s.from[1]) < 1e-3) return;
    KIN[i] = 1; KEND[i * 2] = x; KEND[i * 2 + 1] = y;
  });
  kq.n = 0;
  for (let part = 0; part < 3; part++) {
    for (const i of KORDER) {
      if (!KIN[i]) continue;
      const s = PROG.segs[i];
      const [ax, ay] = worldXY(s.from[0], s.from[1]); const [bx, by] = worldXY(KEND[i * 2], KEND[i * 2 + 1]);
      kerfSeg(ax, ay, bx, by, Math.max(ST + s.to[2], DECK.hi[2] - 0.3), part);
    }
    if (part === 0) cut.top = kq.n / 10;
    if (part === 1) cut.floors = kq.n / 10;
  }
  gl.bindBuffer(gl.ARRAY_BUFFER, cut.buf); gl.bufferSubData(gl.ARRAY_BUFFER, 0, cutData, 0, kq.n);
  cut.count = kq.n / 10;
}
const IDENT = M4();
// Inside the opening the visible surface is where the view ray leaves the union of channels: with only the faces that
// look into a channel kept (back faces culled), that is the farthest of them, so the interior is drawn with GREATER.
function drawKerf() {
  if (!cut.count || state.fault) return;
  commonSolid(0);
  gl.uniformMatrix4fv(SOLID.u.uModel, false, IDENT);
  gl.bindVertexArray(cut.vao);
  gl.enable(gl.STENCIL_TEST); gl.clearStencil(0); gl.clear(gl.STENCIL_BUFFER_BIT);
  // 1 · the opening, where the stock top is visible
  gl.stencilFunc(gl.ALWAYS, 1, 0xff); gl.stencilOp(gl.KEEP, gl.KEEP, gl.REPLACE);
  gl.colorMask(false, false, false, false); gl.depthMask(false);
  gl.drawArrays(gl.TRIANGLES, 0, cut.top);
  // 2 · reset depth to near inside the opening
  gl.disable(gl.POLYGON_OFFSET_FILL);
  gl.stencilFunc(gl.EQUAL, 1, 0xff); gl.stencilOp(gl.KEEP, gl.KEEP, gl.KEEP);
  gl.depthMask(true); gl.depthFunc(gl.ALWAYS); gl.depthRange(0, 0);
  gl.drawArrays(gl.TRIANGLES, 0, cut.top);
  gl.depthRange(0, 1); gl.colorMask(true, true, true, true);
  // 3 · floors and ply walls, farthest inward-facing face wins
  gl.depthFunc(gl.GREATER); gl.enable(gl.CULL_FACE); gl.cullFace(gl.BACK);
  gl.drawArrays(gl.TRIANGLES, cut.top, cut.count - cut.top);
  gl.disable(gl.CULL_FACE); gl.depthFunc(gl.LEQUAL);
  // 4 · the bit, inside the opened channel
  for (const g of [GROUP.tool]) { if (!g.visible || !g.solid.count) continue; gl.uniformMatrix4fv(SOLID.u.uModel, false, g.model); gl.bindVertexArray(g.solid.vao); gl.drawArrays(gl.TRIANGLES, 0, g.solid.count); }
  gl.disable(gl.STENCIL_TEST);
  gl.enable(gl.POLYGON_OFFSET_FILL);
}


// ---------------------------------------------------------------- chips: a CPU particle spray from the bit plus a settled scatter, one dynamic buffer
const CHIP_VS = `${HEAD}layout(location=0) in vec3 aPos; layout(location=1) in vec2 aA; uniform mat4 uProj, uView; uniform float uK; out vec2 vA;
void main(){ vA = aA; gl_Position = uProj * uView * vec4(aPos, 1.0); gl_PointSize = clamp(uK * (0.09 + 0.09 * aA.y) / gl_Position.w, 1.5, 14.0); }`;
const CHIP_FS = `${HEAD}in vec2 vA; uniform vec3 uLight, uDark; out vec4 o;
void main(){ vec2 c = gl_PointCoord - 0.5; c.x *= 1.0 + 0.8 * fract(vA.y * 7.0); if (dot(c, c) > 0.25) discard; o = vec4(mix(uDark, uLight, vA.y), vA.x); }`;
const CHIPP = program(CHIP_VS, CHIP_FS);
const CH = { fly: 700, settle: 2400 };
const chip = {
  x: new Float32Array(CH.fly), y: new Float32Array(CH.fly), z: new Float32Array(CH.fly), vx: new Float32Array(CH.fly), vy: new Float32Array(CH.fly), vz: new Float32Array(CH.fly),
  age: new Float32Array(CH.fly), life: new Float32Array(CH.fly), shade: new Float32Array(CH.fly), n: 0,
  sx: new Float32Array(CH.settle), sy: new Float32Array(CH.settle), sz: new Float32Array(CH.settle), ss: new Float32Array(CH.settle), sa: new Float32Array(CH.settle), sn: 0, si: 0,
  data: new Float32Array((CH.fly + CH.settle) * 5), count: 0, carry: 0, lastClock: 0, seed: 12345,
};
const chipVao = (() => { const vao = gl.createVertexArray(); gl.bindVertexArray(vao); const buf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buf); gl.bufferData(gl.ARRAY_BUFFER, chip.data.byteLength, gl.DYNAMIC_DRAW); gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 20, 0); gl.enableVertexAttribArray(1); gl.vertexAttribPointer(1, 2, gl.FLOAT, false, 20, 12); gl.bindVertexArray(null); return { vao, buf }; })();
const rnd = () => { chip.seed = (chip.seed * 1664525 + 1013904223) >>> 0; return chip.seed / 4294967296; };
const STOCK_BOX = exact("stock"), DECK_BOX = exact("deck");
const chipTip = [0, 0, 0];
function clearChips() { chip.n = 0; chip.sn = 0; chip.si = 0; chip.carry = 0; chip.emitted = 0; }
function groundAt(x, y) {
  if (x > STOCK_BOX.lo[0] && x < STOCK_BOX.hi[0] && y > STOCK_BOX.lo[1] && y < STOCK_BOX.hi[1]) return ST;
  if (x > DECK_BOX.lo[0] && x < DECK_BOX.hi[0] && y > DECK_BOX.lo[1] && y < DECK_BOX.hi[1]) return DECK_BOX.hi[2];
  return 0;
}
function updateChips(dt, pose) {
  if (state.fault) { chip.count = 0; return; }
  if (state.clock < chip.lastClock - 1e-6 || state.clock === 0) clearChips();
  chip.lastClock = state.clock;
  const footOn = !HIDDEN.includes("dustfoot");
  xform(GROUP.tool.model, TIP0, chipTip);
  const tx = chipTip[0], ty = chipTip[1];
  // emit while the bit is in the stock and moving sideways
  const seg = pose.seg, cutting = state.running && pose.cut && (seg.from[0] !== seg.to[0] || seg.from[1] !== seg.to[1]);
  if (cutting && dt > 0) {
    let fxw = -(seg.to[0] - seg.from[0]), fyw = -(seg.to[1] - seg.from[1]); const l = Math.hypot(fxw, fyw) || 1; fxw /= l; fyw /= l;
    chip.carry += dt * (footOn ? 40 : 320);
    while (chip.carry >= 1) {
      chip.carry -= 1;
      if (chip.n >= CH.fly) break;
      const i = chip.n++; chip.emitted = (chip.emitted || 0) + 1;
      const spread = (rnd() - 0.5) * (footOn ? 2.2 : 3.4), side = rnd() < 0.5 ? -1 : 1;
      const ca = Math.cos(spread), sa = Math.sin(spread);
      const dx = fxw * ca - fyw * sa * side, dy = fyw * ca + fxw * sa * side;
      const sp = footOn ? 12 + 26 * rnd() : 50 + 150 * rnd() * rnd() + 40 * rnd();
      chip.x[i] = tx + dx * 0.35; chip.y[i] = ty + dy * 0.35; chip.z[i] = ST + 0.1;
      chip.vx[i] = dx * sp; chip.vy[i] = dy * sp; chip.vz[i] = footOn ? 35 + 40 * rnd() : 25 + 110 * rnd();
      chip.age[i] = 0; chip.life[i] = footOn ? 0.5 + 0.4 * rnd() : 1.6 + 1.4 * rnd(); chip.shade[i] = rnd();
    }
  }
  // fly, land (to the settled scatter), or get swallowed by the brush
  for (let i = 0; i < chip.n; ) {
    chip.age[i] += dt;
    chip.z[i] += chip.vz[i] * dt - 0.5 * 981 * dt * dt;
    chip.vz[i] -= 981 * dt; chip.vx[i] *= 1 - 0.8 * dt; chip.vy[i] *= 1 - 0.8 * dt;
    chip.x[i] += chip.vx[i] * dt; chip.y[i] += chip.vy[i] * dt;
    const r = Math.hypot(chip.x[i] - tx, chip.y[i] - ty), gz = groundAt(chip.x[i], chip.y[i]);
    let dead = chip.age[i] > chip.life[i];
    if (footOn && r > 5.6 && rnd() < 0.92) dead = true; // the brush ring holds them and the hose takes them
    if (!dead && chip.z[i] <= gz) {
      if (!(footOn && r < 7.4)) { const k = chip.si; chip.sx[k] = chip.x[i]; chip.sy[k] = chip.y[i]; chip.sz[k] = gz + 0.05; chip.ss[k] = chip.shade[i]; chip.sa[k] = 0.95; chip.si = (k + 1) % CH.settle; chip.sn = Math.min(CH.settle, chip.sn + 1); }
      dead = true;
    }
    if (dead) { const j = --chip.n; chip.x[i] = chip.x[j]; chip.y[i] = chip.y[j]; chip.z[i] = chip.z[j]; chip.vx[i] = chip.vx[j]; chip.vy[i] = chip.vy[j]; chip.vz[i] = chip.vz[j]; chip.age[i] = chip.age[j]; chip.life[i] = chip.life[j]; chip.shade[i] = chip.shade[j]; }
    else i++;
  }
  // with the foot on, the brush passing over settled chips clears them
  // with the foot on, the hose clears the scatter: chips under the brush vanish, the rest fade out over a couple of seconds
  if (footOn && chip.sn) for (let k = 0; k < chip.sn; k++) { if (chip.sz[k] > 0 && Math.hypot(chip.sx[k] - tx, chip.sy[k] - ty) < 7.4 && chipTip[2] < ST + 3) chip.sz[k] = -1e4; chip.sa[k] -= dt * 0.5; }
  if (footOn && chip.sn && state.running) { let alive = 0; for (let k = 0; k < chip.sn; k++) if (chip.sa[k] > 0 && chip.sz[k] > -1) alive++; if (!alive) { chip.sn = 0; chip.si = 0; } }
  let o = 0;
  for (let i = 0; i < chip.n; i++) { const a = 1 - Math.max(0, (chip.age[i] - chip.life[i] * 0.6) / (chip.life[i] * 0.4)); chip.data[o] = chip.x[i]; chip.data[o + 1] = chip.y[i]; chip.data[o + 2] = chip.z[i]; chip.data[o + 3] = a; chip.data[o + 4] = chip.shade[i]; o += 5; }
  for (let k = 0; k < chip.sn; k++) { if (chip.sz[k] < -1 || chip.sa[k] <= 0) continue; chip.data[o] = chip.sx[k]; chip.data[o + 1] = chip.sy[k]; chip.data[o + 2] = chip.sz[k]; chip.data[o + 3] = Math.min(0.95, chip.sa[k]); chip.data[o + 4] = chip.ss[k]; o += 5; }
  chip.count = o / 5;
  if (chip.count) { gl.bindBuffer(gl.ARRAY_BUFFER, chipVao.buf); gl.bufferSubData(gl.ARRAY_BUFFER, 0, chip.data, 0, o); }
}
function drawChips() {
  if (!chip.count || state.fault) return;
  const u = CHIPP.u, fov = cam.fov * DEG;
  gl.useProgram(CHIPP.p);
  gl.uniformMatrix4fv(u.uProj, false, proj); gl.uniformMatrix4fv(u.uView, false, view);
  gl.uniform1f(u.uK, cam.ortho ? canvas.height / (2 * cam.dist * Math.tan(fov / 2)) : canvas.height / (2 * Math.tan(fov / 2)));
  gl.uniform3f(u.uLight, 0.93, 0.80, 0.56); gl.uniform3f(u.uDark, 0.62, 0.45, 0.25);
  gl.bindVertexArray(chipVao.vao); gl.drawArrays(gl.POINTS, 0, chip.count);
}

// ---------------------------------------------------------------- brittle cutter fragments (world-space, deterministic slow motion)
// Jagged solids rather than sparks: C2 probes with the spindle stopped. The screw strike reuses them with the spindle
// running: thrown harder, swirled sideways by the spin, landing on the sheet.
const SHARDS = Array.from({ length: 14 }, (_, i) => {
  const a = i * 2.3999632297, speed = 18 + (i * 13 % 23);
  return { vx: Math.cos(a) * speed, vy: Math.sin(a) * speed, vz: 13 + (i * 7 % 20),
    axis: v3.unit([Math.sin(i + 1), Math.cos(i * 3 + 1), 0.6]), size: 0.65 + (i % 4) * 0.16 };
});
const shardMesh = (() => {
  const v = [[-0.24, -0.13, -0.35], [0.23, -0.12, -0.19], [0.07, 0.22, -0.12], [-0.06, 0.03, 0.48]], data = [];
  for (const face of [[0, 2, 1], [0, 1, 3], [1, 2, 3], [2, 0, 3]]) {
    const [a, b, c] = face.map(i => v[i]), n = v3.unit(v3.cross(v3.sub(b, a), v3.sub(c, a)));
    for (const p of [a, b, c]) data.push(...p, ...n, 2, SHARD_ID, MAT.shard, 0);
  }
  return vaoFor(new Float32Array(data), 10, true);
})();
const shardModel = M4(), shardRot = M4(), shardShift = M4(), shardOrigin = [0, 0, 0];
// per fault: where the cutter breaks, what the fragments land on, how hard they fly and how much the spin swirls them
const SHATTER = {
  zzero: { at: [ZZ.tip[0], ZZ.tip[1], ZZ.plate.max[2] + 1.0], ground: ZZ.plate.max[2] + 0.28, k: 1, up: 1, swirl: 0, turn: 10 },
  screw: { at: [SCREW_IMPACT[0], SCREW.pathY, ST + 0.25], ground: ST + 0.06, k: 1.4, up: 1.25, swirl: 8, turn: 22 },
};
// world position of fragment i at the current shatter age (also anchors the "fragments" callout)
function shardAt(S, i, out) {
  const age = still.matches ? 0.2 : Math.min(fx.fracture * 0.18, 0.85), ground = S.ground;
  const s = SHARDS[i], z0 = S.at[2] + (i % 3) * 0.22, vz = s.vz * S.up;
  // spindle running: add a tangential (clockwise from above) component around the cutter axis
  const r = Math.hypot(s.vx, s.vy) || 1, vx = s.vx * S.k + (s.vy / r) * S.swirl, vy = s.vy * S.k - (s.vx / r) * S.swirl;
  const hit = (vz + Math.sqrt(vz * vz + 2 * 180 * (z0 - ground))) / 180;
  const t = Math.min(age, hit);
  out[0] = S.at[0] + vx * t; out[1] = S.at[1] + vy * t; out[2] = Math.max(ground, z0 + vz * t - 90 * t * t);
  return t;
}
const shardP = [0, 0, 0];
function drawShards() {
  const S = SHATTER[state.fault?.id];
  if (!(fx.fracture >= 0) || !S) return;
  commonSolid(0);
  gl.bindVertexArray(shardMesh.vao);
  for (let i = 0; i < SHARDS.length; i++) {
    const s = SHARDS[i], t = shardAt(S, i, shardP);
    rotAbout(shardRot, s.axis, t * (S.turn + i), shardOrigin);
    for (let k = 0; k < 12; k++) shardRot[k] *= s.size;
    mulInto(shardModel, translation(shardShift, shardP[0], shardP[1], shardP[2]), shardRot);
    gl.uniformMatrix4fv(SOLID.u.uModel, false, shardModel);
    gl.drawArrays(gl.TRIANGLES, 0, shardMesh.count);
  }
}

// ---------------------------------------------------------------- group matrices from the shown offsets and the fault effect
const AX = [1, 0, 0], AY = [0, 1, 0], AZ = [0, 0, 1];
const R1 = M4(), R2 = M4();
const TOOL_TOP = [TIP0[0], TIP0[1], TIP0[2] + 4];
const CLAMP_PIVOT = [373, 71, 90];
const SCREW_PIVOT = [SCREW.hit[0] - SCREW.head.r, SCREW.hit[1], ST];
const PART_HINGE = [345, 170.2, 90];
function setMatrices(dx, dy, dz, rack) {
  const G0 = GROUP;
  for (const [set, ideal] of [["model", false], ["ideal", true]]) {
    const gx = ideal ? dx + fx.creep : dx;
    const r = ideal ? 0 : rack;
    rotAbout(R1, AZ, r, [D.rest.gx, 218, 0]);
    mulInto(G0.gantry[set], translation(R2, gx, 0, 0), R1);
    G0.gantryFar[set].set(G0.gantry[set]);
    mulInto(G0.motorFar[set], G0.gantryFar[set], translation(R2, 0, 0, ideal ? 0 : fx.liftFar));
    mulInto(G0.motorNear[set], G0.gantry[set], translation(R2, 0, 0, ideal ? 0 : fx.liftNear));
    mulInto(G0.car[set], G0.gantry[set], translation(R2, 0, dy, 0));
    mulInto(G0.zaxis[set], G0.car[set], translation(R2, 0, 0, dz));
    if (ideal) G0.tool[set].set(G0.zaxis[set]);
    else { rotAbout(R1, AY, fx.bend, TOOL_TOP); mulInto(R1, translation(R2, 0, 0, -fx.slip * SLIP_DRAWN - fx.drop), R1); mulInto(G0.tool[set], G0.zaxis[set], R1); }
  }
  // the freed part: hinge tilt and lift, then a yaw about the bit it rides; on the last beat it is flung off the table
  partMatrix(GROUP.part.model, fx.fling, dx, dy);
  rotAbout(R1, AY, fx.clampTilt, CLAMP_PIVOT);
  mulInto(GROUP.clamp.model, translation(R2, fx.clampShift, 0, 0), R1);
  // the struck screw tips away from the bit (bit travels toward -x) about the far edge of its head
  rotAbout(R1, AY, fx.screwTilt, SCREW_PIVOT);
  mulInto(GROUP.screw.model, translation(R2, fx.screwShift, 0, 0), R1);
  GROUP.part.visible = fx.part;
  GROUP.tool.visible = !(fx.fracture >= 0);
}

const PART_C0 = [345, 150.6, (ST - 1.8 + ST) / 2 + 0.03];
const FLING = { t0: 0.12, dur: 0.8, land: [322, 262, 0.92], apex: 58, turns: 3, axis: v3.unit([0.9, 0.35, 0.3]) };
const R3 = M4(), R4 = M4(), R5 = M4(), cEnd = [0, 0, 0];
function partBase(out, dx, dy) {
  rotAbout(R3, AX, -fx.partTilt, PART_HINGE);
  mulInto(R3, translation(R4, 0, 0, fx.partLift), R3);
  return mulInto(out, rotAbout(R4, AZ, fx.partYaw, [TIP0[0] + dx, TIP0[1] + dy, 0]), R3);
}
function partMatrix(out, t, dx, dy) {
  partBase(out, dx, dy);
  if (t < FLING.t0) return out;
  xform(out, PART_C0, cEnd);
  const u = clamp01((t - FLING.t0) / FLING.dur);
  const after = Math.max(0, t - FLING.t0 - FLING.dur);
  const skid = 14 * (1 - Math.exp(-after * 5));
  const L = FLING.land;
  const c = [cEnd[0] + (L[0] - cEnd[0]) * u, cEnd[1] + (L[1] - cEnd[1]) * u + skid, cEnd[2] + (L[2] - cEnd[2]) * u + 4 * FLING.apex * u * (1 - u)];
  const ang = FLING.turns * Math.PI * 2 * (1 - (1 - u) * (1 - u));
  rotAbout(R3, AX, -fx.partTilt * (1 - u), [0, 0, 0]);
  mulInto(R3, rotAbout(R4, AZ, fx.partYaw, [0, 0, 0]), R3);
  mulInto(R3, rotAbout(R4, FLING.axis, ang, [0, 0, 0]), R3);
  mulInto(R3, R3, translation(R4, -PART_C0[0], -PART_C0[1], -PART_C0[2]));
  return mulInto(out, translation(R5, c[0], c[1], c[2]), R3);
}

// ---------------------------------------------------------------- drawing
const KEY_DIR = v3.unit([-0.10, 0.565, 0.82]);
let focusAmt = 0, pulse = 0;
function commonSolid(pass) {
  const u = SOLID.u;
  gl.useProgram(SOLID.p);
  gl.uniformMatrix4fv(u.uProj, false, proj); gl.uniformMatrix4fv(u.uView, false, view);
  gl.uniform3fv(u.uEye, eye); gl.uniform3fv(u.uViewDir, viewDir); gl.uniform3fv(u.uKeyDir, KEY_DIR); gl.uniform3fv(u.uKey, PAL.key);
  gl.uniform3fv(u.uSky, PAL.sky); gl.uniform3fv(u.uGround, PAL.ground); gl.uniform3fv(u.uNeutral, PAL.neutral); gl.uniform3fv(u.uAccent, PAL.accent);
  gl.uniform3fv(u.uFog, PAL.clear); gl.uniform2f(u.uFogRange, cam.dist + orthoPush + BBOX.radius * 0.4, cam.dist + orthoPush + BBOX.radius * 2.6);
  gl.uniform1f(u.uFocus, focusAmt); gl.uniform1f(u.uPulse, pulse); gl.uniform1f(u.uXray, PAL.xray); gl.uniform1i(u.uPass, pass); gl.uniform1i(u.uOrtho, cam.ortho ? 1 : 0);
}
function drawSolids(pass) {
  commonSolid(pass);
  for (const g of ALL) { if (!g.visible || !g.solid.count) continue; gl.uniformMatrix4fv(SOLID.u.uModel, false, g.model); gl.bindVertexArray(g.solid.vao); gl.drawArrays(gl.TRIANGLES, 0, g.solid.count); }
  if (live.solid.count) { gl.uniformMatrix4fv(SOLID.u.uModel, false, live.model); gl.bindVertexArray(live.solid.vao); gl.drawArrays(gl.TRIANGLES, 0, live.solid.count); }
}
function lineUniforms(ghost) {
  const u = LINE.u;
  gl.useProgram(LINE.p);
  gl.uniformMatrix4fv(u.uProj, false, proj); gl.uniformMatrix4fv(u.uView, false, view);
  gl.uniform2f(u.uFade, WHOLE * 0.3, WHOLE * 2.0); gl.uniform1f(u.uDepthBias, orthoPush);
  gl.uniform1f(u.uEdge, PAL.edge); gl.uniform1f(u.uFocus, focusAmt); gl.uniform1f(u.uLineAlpha, PAL.lineAlpha);
  gl.uniform1i(u.uGhost, ghost ? 1 : 0); gl.uniform3fv(u.uAccent, PAL.accent); gl.uniform3fv(u.uGhostCol, PAL.ghost);
}
function drawLines() {
  lineUniforms(false);
  for (const g of ALL) { if (!g.visible || !g.lines.count) continue; gl.uniformMatrix4fv(LINE.u.uModel, false, g.model); gl.bindVertexArray(g.lines.vao); gl.drawArrays(gl.LINES, 0, g.lines.count); }
  gl.uniformMatrix4fv(LINE.u.uModel, false, live.model);
  if (live.lines.count) { gl.bindVertexArray(live.lines.vao); gl.drawArrays(gl.LINES, 0, live.lines.count); }
}
function drawGhost(list, through) {
  commonSolid(2);
  gl.uniform3fv(SOLID.u.uGhostCol, PAL.ghost); gl.uniform1f(SOLID.u.uGhostA, PAL.ghostA);
  gl.enable(gl.STENCIL_TEST); gl.clear(gl.STENCIL_BUFFER_BIT); gl.stencilFunc(gl.EQUAL, 0, 0xff); gl.stencilOp(gl.KEEP, gl.KEEP, gl.INCR);
  gl.enable(gl.POLYGON_OFFSET_FILL); gl.polygonOffset(4, 16); gl.depthFunc(gl.LESS);
  if (through) gl.disable(gl.DEPTH_TEST);
  for (const id of list) { const g = GROUP[id]; if (!g || !g.solid.count) continue; gl.uniformMatrix4fv(SOLID.u.uModel, false, g.ideal); gl.bindVertexArray(g.solid.vao); gl.drawArrays(gl.TRIANGLES, 0, g.solid.count); }
  gl.disable(gl.STENCIL_TEST); gl.disable(gl.POLYGON_OFFSET_FILL); gl.depthFunc(gl.LEQUAL); gl.enable(gl.DEPTH_TEST);
  lineUniforms(true);
  for (const id of list) { const g = GROUP[id]; if (!g || !g.lines.count) continue; gl.uniformMatrix4fv(LINE.u.uModel, false, g.ideal); gl.bindVertexArray(g.lines.vao); gl.drawArrays(gl.LINES, 0, g.lines.count); }
}
const unitQuad = (() => { const vao = gl.createVertexArray(); gl.bindVertexArray(vao); const b = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, b); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([0, 0, 0, 1, 0, 0, 1, 1, 0, 0, 0, 0, 1, 1, 0, 0, 1, 0]), gl.STATIC_DRAW); gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 12, 0); gl.bindVertexArray(null); return vao; })();
function shadowTarget(rect, z, maxRes, blurCm, groups) {
  // pick the resolution so the 9-tap blur (±4 texels, 1-texel steps) spans about ±blurCm: no stepped penumbra
  const size = Math.max(rect[2] - rect[0], rect[3] - rect[1]);
  const res = Math.max(128, Math.min(maxRes, 2 ** Math.round(Math.log2(size / (blurCm / 4)))));
  const tex = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, tex); gl.texStorage2D(gl.TEXTURE_2D, 1, gl.R8, res, res);
  for (const [k, v] of [[gl.TEXTURE_MIN_FILTER, gl.LINEAR], [gl.TEXTURE_MAG_FILTER, gl.LINEAR], [gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE], [gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE]]) gl.texParameteri(gl.TEXTURE_2D, k, v);
  const fb = gl.createFramebuffer(); gl.bindFramebuffer(gl.FRAMEBUFFER, fb); gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
  const tmp = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, tmp); gl.texStorage2D(gl.TEXTURE_2D, 1, gl.R8, res, res);
  for (const [k, v] of [[gl.TEXTURE_MIN_FILTER, gl.LINEAR], [gl.TEXTURE_MAG_FILTER, gl.LINEAR], [gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE], [gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE]]) gl.texParameteri(gl.TEXTURE_2D, k, v);
  const fbTmp = gl.createFramebuffer(); gl.bindFramebuffer(gl.FRAMEBUFFER, fbTmp); gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tmp, 0); gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  // blur step in uv: the 9-tap kernel spans about ±blurCm
  return { tex, fb, tmp, fbTmp, rect, z, res, stepU: 1 / res, stepV: 1 / res, groups };
}
const KEY_SH = v3.unit([-0.10, 0.565, 0.82]);
let SH = null;
function initShadows() {
  const hz = BBOX.hi[2];
  const floorRect = [BBOX.lo[0] - 40 + Math.min(0, KEY_SH[0] / KEY_SH[2] * -hz), BBOX.lo[1] - 40, BBOX.hi[0] + 40, BBOX.hi[1] + 40 - (KEY_SH[1] / KEY_SH[2]) * -hz];
  SH = [
    shadowTarget(floorRect, 0, 1024, 7, ALL),
    shadowTarget([DECK.lo[0], DECK.lo[1], DECK.hi[0], DECK.hi[1]], DECK.hi[2], 1024, 2.5, MOVING),
    shadowTarget([STOCK.lo[0], STOCK.lo[1], STOCK.hi[0], STOCK.hi[1]], STOCK.hi[2], 1024, 2.0, MOVING),
  ];
}
function bakeShadows() {
  const u = SHADOW.u;
  gl.useProgram(SHADOW.p);
  gl.disable(gl.DEPTH_TEST); gl.disable(gl.BLEND); gl.disable(gl.STENCIL_TEST);
  gl.uniform3fv(u.uL, KEY_SH);
  gl.clearColor(0, 0, 0, 0);
  for (const t of SH) {
    gl.bindFramebuffer(gl.FRAMEBUFFER, t.fb); gl.viewport(0, 0, t.res, t.res); gl.clear(gl.COLOR_BUFFER_BIT);
    gl.uniform1f(u.uPlane, t.z); gl.uniform4f(u.uRect, t.rect[0], t.rect[1], t.rect[2], t.rect[3]);
    for (const grp of t.groups) { if (!grp.visible || !grp.solid.count) continue; gl.uniformMatrix4fv(u.uModel, false, grp.model); gl.bindVertexArray(grp.solid.vao); gl.drawArrays(gl.TRIANGLES, 0, grp.solid.count); }
    if (t.z === 0 && live.solid.count) { gl.uniformMatrix4fv(u.uModel, false, live.model); gl.bindVertexArray(live.solid.vao); gl.drawArrays(gl.TRIANGLES, 0, live.solid.count); }
  }
  gl.useProgram(BLUR.p); gl.uniform1i(BLUR.u.uSrc, 1); gl.activeTexture(gl.TEXTURE1); gl.bindVertexArray(unitQuad);
  for (const t of SH) {
    gl.viewport(0, 0, t.res, t.res);
    gl.bindFramebuffer(gl.FRAMEBUFFER, t.fbTmp); gl.bindTexture(gl.TEXTURE_2D, t.tex); gl.uniform2f(BLUR.u.uStep, t.stepU, 0); gl.drawArrays(gl.TRIANGLES, 0, 6);
    gl.bindFramebuffer(gl.FRAMEBUFFER, t.fb); gl.bindTexture(gl.TEXTURE_2D, t.tmp); gl.uniform2f(BLUR.u.uStep, 0, t.stepV); gl.drawArrays(gl.TRIANGLES, 0, 6);
  }
  gl.bindTexture(gl.TEXTURE_2D, null); gl.activeTexture(gl.TEXTURE0);
  gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  gl.viewport(0, 0, canvas.width, canvas.height);
}
function softUniforms(P, t, unit) {
  gl.activeTexture(gl.TEXTURE0 + unit); gl.bindTexture(gl.TEXTURE_2D, t.tex);
  gl.uniform1i(P.u.uShTex, unit); gl.uniform4f(P.u.uShRect, t.rect[0], t.rect[1], t.rect[2], t.rect[3]);
  gl.activeTexture(gl.TEXTURE0);
}
function shadowOverlay(t, alpha) {
  const u = PLANE.u;
  gl.useProgram(PLANE.p);
  gl.uniformMatrix4fv(u.uProj, false, proj); gl.uniformMatrix4fv(u.uView, false, view);
  gl.uniform4f(u.uQuad, t.rect[0], t.rect[1], t.rect[2], t.rect[3]); gl.uniform1f(u.uZ, t.z);
  const [r, g, b] = PAL.shadow; gl.uniform4f(u.uShadow, r, g, b, alpha);
  softUniforms(PLANE, t, 1);
  gl.bindVertexArray(unitQuad); gl.drawArrays(gl.TRIANGLES, 0, 6);
}
// motion trail of the flung part: earlier poses as fading accent ghosts
const TRAIL = M4();
function drawTrail() {
  const t = fx.fling;
  if (t < FLING.t0 + 0.03 || t > FLING.t0 + FLING.dur + 0.35) return;
  commonSolid(2);
  gl.uniform3fv(SOLID.u.uGhostCol, PAL.accent);
  gl.depthMask(false); gl.enable(gl.BLEND);
  const g = GROUP.part;
  gl.bindVertexArray(g.solid.vao);
  const fade = 1 - clamp01((t - FLING.t0 - FLING.dur) / 0.35);
  for (let k = 7; k >= 1; k--) {
    const tk = t - k * 0.045;
    if (tk < FLING.t0) continue;
    partMatrix(TRAIL, tk, state.shown.dx, state.shown.dy);
    gl.uniform1f(SOLID.u.uGhostA, 0.32 * (1 - k / 8) * fade);
    gl.uniformMatrix4fv(SOLID.u.uModel, false, TRAIL); gl.drawArrays(gl.TRIANGLES, 0, g.solid.count);
  }
}
function drawScreenQuad() {
  const si = PART.index.get("screen"), mode = partData[si * 4];
  if (mode === 3) return;
  const u = SCRN.u;
  gl.useProgram(SCRN.p);
  gl.uniformMatrix4fv(u.uProj, false, proj); gl.uniformMatrix4fv(u.uView, false, view);
  gl.uniform3f(u.uO, SCREEN.x, SCREEN.y0, SCREEN.z0); gl.uniform3f(u.uU, 0, SCREEN.y1 - SCREEN.y0, 0); gl.uniform3f(u.uV, 0, 0, SCREEN.z1 - SCREEN.z0);
  gl.uniform1f(u.uDim, mode === 0 ? focusAmt : 0); gl.uniform3fv(u.uNeutral, PAL.neutral);
  gl.activeTexture(gl.TEXTURE2); gl.bindTexture(gl.TEXTURE_2D, scr.tex); gl.uniform1i(u.uTex, 2); gl.activeTexture(gl.TEXTURE0);
  gl.bindVertexArray(unitQuad); gl.drawArrays(gl.TRIANGLES, 0, 6);
}
function updateScreen(now) {
  { scr.vals[0] = screenVals[0]; scr.vals[1] = screenVals[1]; scr.vals[2] = screenVals[2]; }
  const key = `${fx.inputs.join("")}|${fx.ring.join("")}|${fx.frozen}|${scr.vals.map((v) => v.toFixed(1)).join(",")}`;
  if (key === scr.key) return;
  if (now - scr.last < 90 && key.split("|").slice(0, 3).join("|") === scr.key.split("|").slice(0, 3).join("|")) return;
  scr.key = key; scr.last = now;
  drawScreen({ vals: scr.vals, inputs: fx.inputs, ring: fx.ring, frozen: fx.frozen });
}
// grow the caption strip when a long caption plus its "What to do" line would overflow the 76 px default
function fitCaption() {
  const view = capText.closest(".sbx-view"), body = capText.parentElement;
  if (!view || !body) return;
  view.style.removeProperty("--sbx-cap");
  const need = Math.ceil(body.scrollHeight + 18);
  if (need > 76) view.style.setProperty("--sbx-cap", `${Math.min(150, need)}px`);
}
function render(xrayOn, ghostList, ghostThrough) {
  bakeShadows();
  const [cr, cg, cb] = PAL.clear;
  gl.clearColor(cr, cg, cb, 1); gl.clearStencil(0);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT | gl.STENCIL_BUFFER_BIT);
  gl.enable(gl.DEPTH_TEST); gl.depthFunc(gl.LEQUAL); gl.depthMask(true); gl.disable(gl.BLEND); gl.disable(gl.CULL_FACE);
  gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, partTex);
  const above = eye[2] > 1;
  if (above) {
    gl.useProgram(FLOOR.p);
    gl.uniformMatrix4fv(FLOOR.u.uProj, false, proj); gl.uniformMatrix4fv(FLOOR.u.uView, false, view);
    gl.uniform3fv(FLOOR.u.uFloor, PAL.floor); gl.uniform3fv(FLOOR.u.uGrid, PAL.grid); gl.uniform3fv(FLOOR.u.uClear, PAL.clear);
    const [r, g, b, a] = PAL.shadow; gl.uniform4f(FLOOR.u.uShadow, r, g, b, a);
    softUniforms(FLOOR, SH[0], 1);
    gl.uniform2f(FLOOR.u.uCentre, BBOX.centre[0], BBOX.centre[1]); gl.uniform1f(FLOOR.u.uRadius, BBOX.radius * 1.5);
    gl.bindVertexArray(floorVao); gl.drawArrays(gl.TRIANGLES, 0, 6);
  }
  gl.enable(gl.POLYGON_OFFSET_FILL); gl.polygonOffset(1.2, 2.0);
  drawSolids(0);
  drawShards();
  gl.polygonOffset(-1.0, -4.0);
  drawScreenQuad();
  drawKerf();
  gl.enable(gl.BLEND); gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA); gl.depthMask(false);
  if (eye[2] > DECK.hi[2]) { shadowOverlay(SH[1], PAL.shadow[3] * 0.8); shadowOverlay(SH[2], PAL.shadow[3] * 0.8); }
  gl.disable(gl.POLYGON_OFFSET_FILL);
  drawLines();
  drawChips();
  if (xrayOn) { drawSolids(1); }
  if (ghostList) drawGhost(ghostList, ghostThrough);
  drawTrail();
  gl.depthMask(true); gl.disable(gl.BLEND); gl.bindVertexArray(null);
}

// ---------------------------------------------------------------- the loop
let frame = 0, last = 0, visible = true, fractureVisible = false;
function tick(now) {
  const dt = Math.min(0.1, last ? (now - last) / 1000 : 0);
  last = now;
  resize();
  const calm = still.matches;
  // file clock and tour
  if (state.running) { state.clock += dt * SPEED; if (state.clock >= PROG.total) { state.clock = PROG.total; pause(); if (state.touring) nextTour(); } }
  // staging
  let beat = null;
  if (state.fault) {
    const s = STAGES[state.fault.id];
    beat = s.beats[state.beat];
    if (!calm && !state.hold) state.beatT += dt;
    if (state.auto && !calm && state.beatT > BEAT_LEN + BEAT_HOLD) {
      if (state.beat < s.beats.length - 1) { state.beat++; state.beatT = 0; applyBeat(); beat = s.beats[state.beat]; }
      else if (state.touring && state.beatT > BEAT_LEN + BEAT_HOLD * 3) nextTour();
    }
    if (state.fault) { resetFx(); MOTION[state.fault.id](state.beat, Math.min(state.beatT, BEAT_LEN + BEAT_HOLD)); }
  }
  const pose = poseFor(PROG, state.clock);
  let tx, ty, tz;
  if (state.fault) { tx = fx.dx; ty = fx.dy; tz = fx.dz; }
  else { const [wx, wy] = worldXY(pose.x, pose.y); tx = wx - TIP0[0]; ty = wy - TIP0[1]; tz = pose.z - D.safeZ; }
  const k = calm || cam.snap ? 1 : 1 - Math.exp(-dt / (state.fault ? 0.03 : 0.08));
  const S = state.shown;
  S.dx += (tx - S.dx) * k; S.dy += (ty - S.dy) * k; S.dz += (tz - S.dz) * k; S.rack += (fx.rack - S.rack) * k;
  setMatrices(S.dx, S.dy, S.dz, S.rack);
  if (cam.snap) lastLiveKey = "";
  if (fractureVisible !== (fx.fracture >= 0)) { fractureVisible = fx.fracture >= 0; computeParts(); }
  updateLeds(); uploadParts();
  focusAmt += ((state.fault ? 1 : 0) - focusAmt) * (calm ? 1 : 1 - Math.exp(-dt / 0.25));
  pulse = calm ? 0.5 : 0.5 + 0.5 * Math.sin(now / 260);
  // camera
  if (cam.follow) {
    const o = cam.follow.off ?? [0, 0, 0];
    if (cam.follow.kind === "gantry") goal.target = [D.rest.gx + S.dx + o[0], o[1] || D.rest.cy + S.dy * 0.3 + 10, o[2] || D.rest.zb + 10];
    else { xform(cam.follow.kind === "spindle" ? GROUP.zaxis.model : GROUP.tool.model, TIP0, tmpP); goal.target = [tmpP[0] + o[0], tmpP[1] + o[1], tmpP[2] + o[2]]; }
  }
  const kc = calm || cam.snap ? 1 : 1 - Math.exp(-dt / cam.tau);
  cam.snap = false;
  cam.az += (goal.az - cam.az) * kc; cam.el += (goal.el - cam.el) * kc; cam.dist += (goal.dist - cam.dist) * kc; cam.fov += (goal.fov - cam.fov) * kc;
  for (let i = 0; i < 3; i++) cam.target[i] += (goal.target[i] - cam.target[i]) * kc;
  updateCamera();
  // live geometry and the cut
  const key = `${Math.round(S.dx * 2)}|${Math.round(S.dy * 2)}|${Math.round(S.dz * 4)}|${state.fault?.id}|${fx.zlead}|${fx.floor.length}|${fx.floor.length ? fx.floor[fx.floor.length - 1][0].toFixed(1) + fx.floor[fx.floor.length - 1][1].toFixed(1) : ""}`;
  if (key !== lastLiveKey) { lastLiveKey = key; rebuildLive(S.dx, S.dy, S.dz); }
  if (!state.fault) updateCut(state.clock);
  else if (cut.count) cut.count = 0, lastCutKey = "";
  updateChips(calm ? 0 : dt, pose);
  render(!!beat?.xray, beat?.ghost && (state.beat > 0 || state.beatT > 0.6) ? beat.ghost : null, !!beat?.ghostThrough);
  updateCallouts();
  say(pose);
  updateScreen(now);
  showTransport();
  syncControls();
  const camMoving = Math.abs(goal.az - cam.az) + Math.abs(goal.el - cam.el) > 1e-4 || Math.abs(goal.dist - cam.dist) > 0.02 || Math.abs(goal.fov - cam.fov) > 0.01 || v3.len(v3.sub(goal.target, cam.target)) > 0.02;
  const moving = Math.abs(tx - S.dx) + Math.abs(ty - S.dy) + Math.abs(tz - S.dz) + Math.abs(fx.rack - S.rack) > 0.005;
  const alive = chip.n > 0 || (chip.sn > 0 && !HIDDEN.includes("dustfoot")) || state.running || state.touring || !!state.fault || moving || camMoving || !!drag || focusAmt > 0.002;
  if (!camMoving && !drag) saveHashSoon();
  frame = visible && alive ? requestAnimationFrame(tick) : 0;
}
function run() { if (!frame && visible) { last = 0; frame = requestAnimationFrame(tick); } }
new IntersectionObserver((entries) => { visible = entries[entries.length - 1].isIntersecting; if (visible) run(); }).observe(stage);
new ResizeObserver(() => run()).observe(canvas);

// ---------------------------------------------------------------- Views tab: sliders, projection, presets, saved views, link
const camInputs = {};
for (const el of $$("[data-cam]")) camInputs[el.dataset.cam] = { range: el, num: $(`[data-cam-num="${el.dataset.cam}"]`), shown: "" };
const DMIN = 12, DMAX = 3000, distToRange = (d) => (Math.log(d / DMIN) / Math.log(DMAX / DMIN)) * 1000, rangeToDist = (v) => DMIN * Math.exp((v / 1000) * Math.log(DMAX / DMIN));
const camValue = { az: () => ((((goal.az / DEG) % 360) + 540) % 360) - 180, el: () => goal.el / DEG, dist: () => goal.dist, fov: () => goal.fov };
function syncControls() {
  for (const k in camInputs) {
    const c = camInputs[k];
    const v = camValue[k]();
    const s = k === "dist" ? Math.round(v).toString() : v.toFixed(0);
    if (c.shown === s) continue;
    c.shown = s;
    if (document.activeElement !== c.range) c.range.value = k === "dist" ? distToRange(v).toFixed(0) : s;
    if (document.activeElement !== c.num) c.num.value = s;
  }
}
for (const [k, c] of Object.entries(camInputs)) {
  const apply = (v) => { if (!Number.isFinite(v)) return; cam.tau = 0.08; clearPreset(); takeOver(); setGoal({ [k]: v }); };
  c.range.addEventListener("input", () => apply(k === "dist" ? rangeToDist(Number(c.range.value)) : Number(c.range.value)));
  c.num.addEventListener("change", () => apply(Number(c.num.value)));
}
for (const b of projButtons) b.addEventListener("click", () => { setGoal({ ortho: b.dataset.proj === "ortho" }); saveHashSoon(); });
for (const b of themeButtons) b.addEventListener("click", () => setTheme(b.dataset.themeSet));
for (const b of viewButtons) b.addEventListener("click", () => { takeOver(); setView(b.dataset.view); stage.focus({ preventScroll: true }); });
followButton?.addEventListener("click", () => { const on = cam.follow?.kind !== "tool"; cam.tau = 0.3; setGoal(on ? { follow: { kind: "tool", off: [0, 0, 0] } } : { target: [...cam.target] }); });
footButton?.addEventListener("click", () => setDustFoot(HIDDEN.length > 0));
const viewState = () => ({ az: +(camValue.az()).toFixed(1), el: +(goal.el / DEG).toFixed(1), dist: Math.round(goal.dist), target: (cam.follow ? cam.target : goal.target).map((v) => +v.toFixed(1)), fov: Math.round(goal.fov), ortho: cam.ortho, theme: document.body.dataset.theme });
const encodeView = (v) => `v=${[v.az, v.el, v.dist, ...v.target, v.fov].join(",")},${v.ortho ? "o" : "p"},${v.theme}`;
function decodeView(hash) {
  const m = /v=([^&]+)/.exec(hash || "");
  if (!m) return null;
  const p = m[1].split(",");
  const n = p.slice(0, 7).map(Number);
  if (n.some((x) => !Number.isFinite(x))) return null;
  return { az: n[0], el: n[1], dist: n[2], target: [n[3], n[4], n[5]], fov: n[6], ortho: p[7] === "o", theme: p[8] === "light" ? "light" : p[8] === "dark" ? "dark" : null };
}
let hashTimer = 0, lastHash = "";
function saveHashSoon() {
  if (hashTimer) return;
  hashTimer = setTimeout(() => {
    hashTimer = 0;
    const h = "#" + encodeView(viewState()) + (state.fault ? `&fault=${state.fault.id}` : "");
    if (h !== lastHash) { lastHash = h; history.replaceState(null, "", h); if (linkOut) linkOut.value = location.href; }
  }, 450);
}
const STORE = "shopbot-3d.views";
const loadSaved = () => { try { return JSON.parse(localStorage.getItem(STORE) || "[]"); } catch { return []; } };
function renderSaved() {
  const list = loadSaved();
  savedList.innerHTML = list.length ? list.map((v, i) => `<li><button type="button" class="sbx-saved-go" data-i="${i}"><span>${v.name}</span><span class="sbx-num">${Math.round(v.az)}° · ${Math.round(v.el)}° · ${Math.round(v.dist)} cm${v.ortho ? " · ortho" : ""}</span></button><button type="button" class="sbx-saved-x" data-x="${i}" aria-label="Delete ${v.name}">×</button></li>`).join("") : `<li class="sbx-empty">No saved views yet.</li>`;
}
$("[data-save-view]")?.addEventListener("click", () => {
  const list = loadSaved();
  const v = viewState();
  list.push({ ...v, name: `View ${list.length + 1}` });
  try { localStorage.setItem(STORE, JSON.stringify(list.slice(-12))); } catch { /* storage full or blocked */ }
  renderSaved();
});
savedList?.addEventListener("click", (e) => {
  const go = e.target.closest("[data-i]"), x = e.target.closest("[data-x]");
  const list = loadSaved();
  if (x) { list.splice(Number(x.dataset.x), 1); try { localStorage.setItem(STORE, JSON.stringify(list)); } catch { /* ignore */ } renderSaved(); return; }
  if (go) { const v = list[Number(go.dataset.i)]; if (v) { cam.tau = 0.35; setGoal({ ...v, follow: null }); clearPreset(); } }
});
$("[data-copy-link]")?.addEventListener("click", async (e) => {
  const h = "#" + encodeView(viewState()) + (state.fault ? `&fault=${state.fault.id}` : "");
  lastHash = h; history.replaceState(null, "", h);
  const url = location.href; if (linkOut) { linkOut.value = url; linkOut.select(); }
  let ok = false;
  try { await navigator.clipboard.writeText(url); ok = true; } catch { try { ok = document.execCommand("copy"); } catch { ok = false; } }
  e.currentTarget.textContent = ok ? "Copied" : "Link selected";
  setTimeout(() => { $("[data-copy-link]").textContent = "Copy link"; }, 1600);
});

// ---------------------------------------------------------------- tabs, drawer, faults list, caption bar, transport
for (const t of $$("[data-tab]")) t.addEventListener("click", () => {
  for (const o of $$("[data-tab]")) o.setAttribute("aria-selected", o === t ? "true" : "false");
  for (const p of $$("[data-panel]")) p.hidden = p.dataset.panel !== t.dataset.tab;
});
$("[data-drawer-toggle]")?.addEventListener("click", (e) => {
  const app = $(".sbx"); const open = app.dataset.drawer !== "closed";
  app.dataset.drawer = open ? "closed" : "open"; e.currentTarget.setAttribute("aria-expanded", open ? "false" : "true");
  requestAnimationFrame(() => run());
});
for (const b of faultButtons) b.addEventListener("click", () => { takeOver(); setFault(state.fault && state.fault.id === b.dataset.fault ? null : b.dataset.fault); });
$("[data-beat-prev]")?.addEventListener("click", () => { takeOver(); stepBeat(-1); });
$("[data-beat-next]")?.addEventListener("click", () => { takeOver(); stepBeat(1); });
$("[data-beat-replay]")?.addEventListener("click", () => { takeOver(); replay(); });
$("[data-beat-close]")?.addEventListener("click", () => { takeOver(); setFault(null); stage.focus({ preventScroll: true }); });
autoButton?.addEventListener("click", () => setAuto(!state.auto));
$("[data-rewind]")?.addEventListener("click", () => { takeOver(); seek(0); });
$("[data-back]")?.addEventListener("click", () => { takeOver(); seek(state.clock - 10); });
$("[data-fwd]")?.addEventListener("click", () => { takeOver(); seek(state.clock + 10); });
runButton.addEventListener("click", () => { takeOver(); toggleRun(); });
scrub?.addEventListener("input", () => { takeOver(); seek(Number(scrub.value)); });
speedSelect?.addEventListener("change", () => { SPEED = Number(speedSelect.value); });
tourButton?.addEventListener("click", () => setTour(!state.touring));

// keyboard on the viewer: orbit, pan, zoom, transport, faults and beats
stage.addEventListener("keydown", (event) => {
  if (event.metaKey || event.ctrlKey || event.altKey) return;
  const key = event.key;
  const stop = () => event.preventDefault();
  const fault = FAULT_LIST.find((f) => f.key.toLowerCase() === key.toLowerCase());
  const r = canvas.getBoundingClientRect();
  const step = event.shiftKey ? 40 : 0;
  if (fault) { stop(); takeOver(); setFault(state.fault && state.fault.id === fault.id ? null : fault.id); }
  else if (key === "ArrowLeft" || key === "ArrowRight") { stop(); clearPreset(); cam.tau = 0.12; if (step) panBy(key === "ArrowLeft" ? step : -step, 0); else { goal.az += (key === "ArrowLeft" ? -1 : 1) * 7.5 * DEG; run(); } }
  else if (key === "ArrowUp" || key === "ArrowDown") { stop(); clearPreset(); cam.tau = 0.12; if (step) panBy(0, key === "ArrowUp" ? step : -step); else { goal.el = Math.max(-0.35, Math.min(1.55, goal.el + (key === "ArrowUp" ? 5 : -5) * DEG)); run(); } }
  else if (key === "+" || key === "=") { stop(); zoomBy(0.8, r.left + r.width / 2, r.top + r.height / 2); }
  else if (key === "-" || key === "_") { stop(); zoomBy(1.25, r.left + r.width / 2, r.top + r.height / 2); }
  else if (key === " " || key === "Enter") { stop(); takeOver(); pause(); if (state.fault) { state.hold = true; setAuto(false); } run(); }
  else if (key === "Escape") { stop(); takeOver(); if (state.fault) setFault(null); else reset(); }
  else if (key === "Home" || key === "r" || key === "R") { stop(); takeOver(); seek(0); }
  else if (key === "End") { stop(); takeOver(); seek(PROG.total); }
  else if (key === "[" || key === "]") { stop(); takeOver(); seek(state.clock + (key === "[" ? -10 : 10)); }
  else if (key === "," || key === ".") { stop(); takeOver(); pause(); seek(state.clock + (key === "," ? -1 : 1)); }
  else if (key === "n" || key === "N" || key === "PageDown") { stop(); takeOver(); stepBeat(1); }
  else if (key === "p" || key === "P" || key === "PageUp") { stop(); takeOver(); stepBeat(-1); }
  else if (key === "t" || key === "T") { stop(); setTour(!state.touring); }
  else if (key === "o" || key === "O") { stop(); setGoal({ ortho: !cam.ortho }); }
  else if (key === "f" || key === "F") { stop(); setView("tool"); }
  else if (key === "0") { stop(); setView("whole"); }
});

// ---------------------------------------------------------------- start
initShadows();
const fromHash = decodeView(location.hash);
if (fromHash?.theme && fromHash.theme !== document.body.dataset.theme) document.body.dataset.theme = fromHash.theme;
readPalette();
computeParts();
setView("whole");
if (fromHash) { setGoal({ ...fromHash, follow: null }, true); clearPreset(); }
else setGoal({}, true);
cam.target = [...goal.target];
renderSaved();
setAuto(true);
showCaption();
resize();
showTransport();
// #fault=<id> (alone or with #v=...&fault=<id>): open the Faults tab and stage that fault from its first step
const hashParams = (hash) => Object.fromEntries((hash || "").replace(/^#/, "").split("&").filter(Boolean).map((kv) => { const i = kv.indexOf("="); return i < 0 ? [kv, ""] : [kv.slice(0, i), decodeURIComponent(kv.slice(i + 1))]; }));
function faultFromHash(fromLoad) {
  const id = hashParams(location.hash).fault;
  if (id && faultById(id)) {
    if (state.fault?.id === id && !fromLoad) return;
    $("[data-tab=\"faults\"]")?.click();
    takeOver(); setAuto(true); setFault(id, 0);
  } else if (!fromLoad && state.fault && !id) setFault(null);
}
addEventListener("hashchange", () => faultFromHash(false));
window.__gl = {
  cam, goal, state, parts: PART,
  inspect() { return { fault: state.fault?.id ?? null, beat: state.beat, beatTime: state.beatT,
    fractured: fx.fracture >= 0, fragmentCount: fx.fracture >= 0 ? SHARDS.length : 0,
    toolVisible: GROUP.tool.visible, stubMode: partData[PART.index.get("tool.stub") * 4],
    spinRate: fx.spin, inputs: [...fx.inputs], screenFrozen: fx.frozen,
    kerfVertices: cut.count, kerfWidthMm: KERF.w * 20, chipsFlying: chip.n, chipsSettled: chip.sn, chipsEmitted: chip.emitted || 0,
    dustFootOn: !HIDDEN.includes("dustfoot"), clock: state.clock, total: PROG.total,
    toolMatrix: Array.from(GROUP.tool.model), zAxisMatrix: Array.from(GROUP.zaxis.model),
    fling: fx.fling, slip: fx.slip, caption: capText.textContent, beatLabel: capBeat.textContent,
    screwTilt: fx.screwTilt, screwMode: partData[PART.index.get("screw.1.head") * 4], decoyMode: partData[PART.index.get("screw.2.head") * 4], gougeMode: partData[PART.index.get("screw.1.gouge") * 4], screwMatrix: Array.from(GROUP.screw.model),
    glError: gl.getError() }; },
  setView(v) { if (typeof v === "string") setView(v); else { setGoal({ ...v, follow: v.follow ?? null }, v.instant !== false); clearPreset(); } return viewState(); },
  playFault(id, beat = 0, at = null) { setFault(id, beat, at); state.hold = at !== null; if (at !== null) { state.auto = false; autoButton?.setAttribute("aria-pressed", "false"); } return { fault: state.fault?.id ?? null, beat: state.beat }; },
  clearFault() { setFault(null); },
  view: viewState,
  encode: () => encodeView(viewState()),
};
drawScreen({ vals: scr.vals, inputs: fx.inputs, ring: fx.ring, frozen: false });
run();
requestAnimationFrame(() => requestAnimationFrame(() => faultFromHash(true)));
