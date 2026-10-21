import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import * as k from "../../kit/iso-kit.mjs";
import * as G from "../../kit/lathe.mjs";
import * as A from "../../kit/audit.mjs";
import { kitScript } from "../../scripts/inline-kit.mjs";
import { makeKit } from "./kit-helpers.mjs";
import { buildInset } from "./inset.mjs";
import { MACHINE, TABLE, ORIGIN, DECK_TOP, STOCK, STOCK_AT, STOCK_TOP, SAFE_Z, PARK, FEED, FAULTS, FAULT_STAGES, SPEED, SCREWS, machineToWorld, program, chipload } from "./machine.mjs";
import { xChainRoute, yChainRoute, hoseFootRoute, hoseBoomRoute } from "./routes.mjs";
import { PROSE_CSS, INTRO, AFTER_FIGURE, MAINTENANCE, faultsHtml, sourcesHtml } from "./prose.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const THEME = process.argv.includes("--light") ? "light" : "dark";

// ---------------------------------------------------------------- camera
// Viewer stands off the X = 0 end on the front side: the end plates, the spindle face of the YZ car, the control box
// and the PC are all toward the viewer.
const W = 700;
const H = 470;
const AZIMUTH = Number(process.env.AZ ?? 46);
const ELEVATION = Number(process.env.EL ?? 26);

const T = TABLE;
const SIDE_Z = [72, 92];
const RAIL_Z = [92, 95];
const RACK_Z = [84, 87];
const RACK_T = 1.4;
const FAR = { outer: T.farOuter, inner: T.farOuter + T.sideW, sign: -1 };
const NEAR = { outer: T.nearOuter, inner: T.nearOuter - T.sideW, sign: 1 };
const LEG_XS = [12, 206, 400];
const PLATE = { bottomHalf: 25, topHalf: 15, z0: 78, z1: 126, t: 2, gap: 1.6 };
const BEAM = { half: 6, z: [101, 126] };
const CAR = { half: 20, z: [99, 134], x: [10, 12] }; // x relative to beam centre
const ZX = { x: [14.5, 20.5], half: 5, z: [-2, 68] }; // z relative to ZB
const SPX = 32.5; // spindle axis, relative to beam centre
const ZB_REST = STOCK_TOP + SAFE_Z + 6; // nose bottom when the tip sits at safe Z

// Rest pose: tool parked at PARK (machine cm)
const [parkX, parkY] = machineToWorld(PARK.x, PARK.y);
const GX = parkX - SPX;
const CY = parkY;

const FIT = [
  [-110, 0, 0], [480, 0, 0], [480, 300, 0], [-110, 300, 0],
  [-110, 0, 160], [480, 0, 160], [480, 300, 120], [-110, 300, 250],
  [GX, 20, 175], [GX, 230, 175],
];
const P = k.fitProjection(FIT, W, H, { pad: 22, azimuth: AZIMUTH, elevation: ELEVATION });
const LAYER = { farStatic: 0, farGantry: 1, nearStatic: 2, gantry: 3, car: 4, zaxis: 5, front: 6 };
const K = makeKit(P, LAYER);
const { R, record, ctx, put, mesh, MESH, box, prism, turned, disc, cable, rect, AX, AY, AZ, at, S, Ln, Dots, Faded, path3, V, KS } = K;
const setLayer = (layer, piece) => { ctx.layer = layer; if (piece) ctx.piece = piece; };

// ---------------------------------------------------------------- the table
const back = [];
const FLOOR = { x: -110, y: 0, w: 590, d: 300, r: 14 };
back.push(`<path class="iso-halo" d="${k.haloOf(FLOOR, -4, 4, P)}"/>`);

function leg(x, side) {
  setLayer(side === NEAR ? LAYER.nearStatic : LAYER.farStatic, "stand");
  const y0 = side === NEAR ? side.inner + 1 : side.outer + 1;
  const F = G.frameOf([x + 3.75, y0 + 3.75, 0], AZ, AX, AY);
  const pad = record(A.disc(F, 0, 1.4, 4.2, { name: "stand.pad", ground: true }));
  put("stand.pad", [x + 3.75, y0 + 3.75, 0.7], S(G.disc(0, 1.4, 4.2, F, P, { steps: 32 }), { tone: "lo" }), [pad]);
  disc("stand.nut", F, 1.4, 3, 2.6, { tone: "mid" }, { steps: 6 });
  disc("stand.stem", F, 3, 6, 1.1, { tone: "mid" });
  box("stand.leg", [x, y0, 6], [x + 7.5, y0 + 7.5, SIDE_Z[0]], { tone: "lo" }, { r: 0.6, steps: 3, inner: Ln(k.sideSeam({ x, y: y0, w: 7.5, d: 7.5, r: 0.6 }, 9, P, 3), { tone: "faint" }) });
  // gusset brace: a diagonal bar from the leg up to the side extrusion, on the +x side of the leg
  const a = [x + 7.5, y0 + 3.75, 34];
  const b = [x + 7.5 + 30, y0 + 3.75, SIDE_Z[0] + 1];
  const dirv = G.unit3(G.sub3(b, a));
  const BF = G.frameOf(a, dirv, AY, G.cross3(dirv, AY));
  prism("stand.brace", BF, rect(-2.2, 2.2, -1, 1), 0, G.len3(G.sub3(b, a)), { tone: "lo" });
  // upper table support: steel channel under the side at this station, reaching across to the other side
  if (side === NEAR) box("stand.support", [x, FAR.inner, SIDE_Z[0] - 6], [x + 7.5, NEAR.inner, SIDE_Z[0]], { tone: "lo" }, { r: 0.4, steps: 2 });
  // lower cross stretcher between the leg pair
  if (side === NEAR) box("stand.stretcher", [x + 1, FAR.outer + 8.5, 22], [x + 6.5, NEAR.inner + 1, 27], { tone: "lo" }, { r: 0.4, steps: 2 });
}
for (const x of LEG_XS) leg(x, FAR);
for (const x of LEG_XS) leg(x, NEAR);

function sideOf(side, tag) {
  setLayer(side === NEAR ? LAYER.nearStatic : LAYER.farStatic, "stand");
  const y0 = Math.min(side.outer, side.inner);
  const y1 = Math.max(side.outer, side.inner);
  // the 4 x 8 in aluminium table side, with T-slot grooves on the outer face
  const grooves = [SIDE_Z[0] + 5, SIDE_Z[0] + 10, SIDE_Z[0] + 15].map((z) => path3([[T.x0 + 1, side.outer + 0.01 * side.sign, z], [T.x1 - 1, side.outer + 0.01 * side.sign, z]])).join("");
  box(`side.${tag}`, [T.x0, y0, SIDE_Z[0]], [T.x1, y1, SIDE_Z[1]], { tone: "mid" }, { r: 0.6, steps: 3, bevel: 0.5, extra: side === NEAR ? Ln(grooves, { tone: "faint", free: true }) : "" });
  // hardened rail on top, V edge outward; flush with the inner face
  const ry = side === NEAR ? [side.inner + 0.5, side.outer - 0.5] : [side.outer + 0.5, side.inner - 0.5];
  box(`xrail.${tag}`, [T.x0 + 2, Math.min(...ry), RAIL_Z[0]], [T.x1 - 2, Math.max(...ry), RAIL_Z[1]], { tone: "hi" }, { r: 0.3, steps: 2, bevel: 0.5 });
  // rack on the outer face, teeth outward
  const rky = side === NEAR ? [side.outer, side.outer + RACK_T] : [side.outer - RACK_T, side.outer];
  const face = side === NEAR ? rky[1] + 0.01 : rky[0] - 0.01;
  const teeth = side === NEAR ? k.sideTicks(T.x0 + 6, T.x1 - 6, 1.6, 1e9, face, RACK_Z[1], [1.2, 1.2], P, "x") : { minor: "" };
  box(`xrack.${tag}`, [T.x0 + 4, rky[0], RACK_Z[0]], [T.x1 - 4, rky[1], RACK_Z[1]], { tone: "hi" }, { r: 0.2, steps: 2, extra: Ln(teeth.minor, { tone: "lo" }) });
  // rail end caps / bumpers
  for (const x of [T.x0 + 2, T.x1 - 6]) box(`stand.endcap.${tag}`, [x, y0 - 0.2, RAIL_Z[1]], [x + 4, y1 + 0.2, RAIL_Z[1] + 2.4], { tone: "lo" }, { r: 0.6, steps: 3 });
}
sideOf(FAR, "far");
sideOf(NEAR, "near");

// cross supports and the deck
setLayer(LAYER.nearStatic, "stand");
for (let i = 0; i < 9; i++) {
  const x = 6 + i * 50.5;
  box("stand.bearer", [x, FAR.inner, 80], [x + 5, NEAR.inner, 86], { tone: "mid" }, { r: 0.4, steps: 2 });
}
box("deck.ply", [T.x0 + 2, FAR.inner, 86], [T.x1 - 2, NEAR.inner, 88], { tone: "lo" }, { r: 0.3, steps: 2 });
{
  const zones = [0, 1, 2, 3].map((i) => k.planOutline({ x: 8 + i * 102, y: FAR.inner + 8, w: 96, d: NEAR.inner - FAR.inner - 16, r: 1.5 }, DECK_TOP, P, 3)).join("");
  const screws = Dots([0, 1, 2, 3].flatMap((i) => [at([8 + i * 102 + 3, FAR.inner + 4, DECK_TOP]), at([8 + i * 102 + 93, NEAR.inner - 4, DECK_TOP])]), { size: 0.45, tone: "lo" });
  box("deck", [T.x0 + 2, FAR.inner, 88], [T.x1 - 2, NEAR.inner, DECK_TOP], { tone: "lo" }, { r: 0.4, steps: 2, bevel: 0.4, extra: Ln(zones, { tone: "faint" }) + screws, ground: true });
}
// ruler strip on the near edge of the deck, machine X in 10 cm steps counting from the origin
{
  const STRIP = { x: ORIGIN.x - MACHINE.travel.x + 20, y: NEAR.inner - 5, w: MACHINE.travel.x - 20, d: 3.4, r: 0.4 };
  box("deck.ruler", [STRIP.x, STRIP.y, DECK_TOP], [STRIP.x + STRIP.w, STRIP.y + STRIP.d, DECK_TOP + 0.4], { tone: "lo", crease: "none" }, { r: 0.4, steps: 2 });
  const ticks = k.topTicks(STRIP.x, STRIP.x + STRIP.w, 10, 5, STRIP.y + STRIP.d, DECK_TOP + 0.4, [-1.3, -2.4], P, "x");
  put("deck.ruler.ticks", [200, STRIP.y, DECK_TOP + 0.4], Ln(ticks.minor, { tone: "lo" }) + Ln(ticks.major, { tone: "mid" }), [], { bias: 0.05 });
}
// the sheet
const [sx1, sy1] = machineToWorld(STOCK_AT.x, STOCK_AT.y);
const STOCK_W = { x0: sx1 - STOCK.w, x1: sx1, y0: sy1 - STOCK.d, y1: sy1 };
box("stock", [STOCK_W.x0, STOCK_W.y0, DECK_TOP], [STOCK_W.x1, STOCK_W.y1, STOCK_TOP], { tone: "mid" }, { r: 0.3, steps: 2, bevel: 0.3, slot: "cut" });
// the part the profile cuts out (lifts in the hold-down fault)
{
  const [px1, py1] = machineToWorld(30, 26);
  const [px0, py0] = machineToWorld(90, 66);
  mesh({ kind: "box", name: "stock.part", min: [px0 + 0.4, py0 + 0.4, DECK_TOP + 0.05], max: [px1 - 0.4, py1 - 0.4, STOCK_TOP], tone: "mid" });
  put("stock.part", [(px0 + px1) / 2, (py0 + py1) / 2, STOCK_TOP], `<g data-part="stock-part" class="sb-part">${S(k.slabOf({ x: px0 + 0.4, y: py0 + 0.4, w: px1 - px0 - 0.8, d: py1 - py0 - 0.8, r: 0.2 }, DECK_TOP + 0.05, STOCK.t, P, 1), { tone: "mid", crease: "none" })}</g>`, [], { bias: 0.02 });
}
// hold-down screws for the "bit hits a screw" fault (WebGL only; hidden in every other view): pan heads with a Torx
// recess, shank down through the sheet into the spoilboard. screw.1 sits on the first profile pass, screw.2 in a safe zone.
const SCREW_W = {};
for (const [i, tag] of [[1, "hit"], [2, "safe"]]) {
  const [x, y] = machineToWorld(SCREWS[tag].x, SCREWS[tag].y);
  SCREW_W[tag] = [x, y];
  const { r, h } = SCREWS.head;
  const F = { o: [x, y, STOCK_TOP], a: [0, 0, 1], u: [1, 0, 0], v: [0, 1, 0] };
  mesh({ kind: "lathe", name: `screw.${i}.head`, F, profile: [[0, r], [0.4 * h, r], [0.68 * h, r * 0.88], [0.9 * h, r * 0.66], [h, r * 0.4]], tone: "hi" });
  mesh({ kind: "lathe", name: `screw.${i}.shank`, F, profile: [[-SCREWS.shank.depth, 0.06], [-SCREWS.shank.depth + 0.3, SCREWS.shank.r], [0, SCREWS.shank.r]], tone: "mid" });
  for (const deg of [0, 60, 120]) {
    const a = (deg * Math.PI) / 180;
    mesh({ kind: "prism", name: `screw.${i}.torx`, F: { o: [x, y, STOCK_TOP], a: [0, 0, 1], u: [Math.cos(a), Math.sin(a), 0], v: [-Math.sin(a), Math.cos(a), 0] }, poly: rect(-0.15, 0.15, -0.045, 0.045), s0: h - 0.06, s1: h + 0.006, tone: "lo" });
  }
  // bright bare steel where the cutter chewed the head (shown only after the impact), on the side the bit came from
  if (i === 1) mesh({ kind: "box", name: "screw.1.gouge", min: [x + 0.22, y - 0.26, STOCK_TOP + 0.08], max: [x + 0.43, y + 0.12, STOCK_TOP + 0.27], tone: "hi" });
}
// the real file must run into screw.1 and stay clear of screw.2 (cutter radius + head radius), or the fault is a lie
{
  const segDist = (p, a, b) => { const dx = b[0] - a[0], dy = b[1] - a[1], L = dx * dx + dy * dy || 1; const t = Math.max(0, Math.min(1, ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / L)); return Math.hypot(p[0] - a[0] - t * dx, p[1] - a[1] - t * dy); };
  const reach = MACHINE.toolDia / 2 + SCREWS.head.r;
  const near = (tag) => Math.min(...program().segs.filter((sg) => sg.cut && sg.to[2] < 0).map((sg) => segDist([SCREWS[tag].x, SCREWS[tag].y], sg.from, sg.to)));
  if (!(near("hit") < reach)) throw new Error(`screw.1 is ${near("hit").toFixed(2)} cm from the toolpath: it must be hit`);
  if (!(near("safe") > reach + 2)) throw new Error(`screw.2 is only ${near("safe").toFixed(2)} cm from the toolpath`);
}
// clamps: four edge clamps on the far and near edges of the sheet
const CLAMPS = [[STOCK_W.x0 + 30, STOCK_W.y0, -1], [STOCK_W.x1 - 36, STOCK_W.y0, -1], [STOCK_W.x0 + 30, STOCK_W.y1, 1], [STOCK_W.x1 - 36, STOCK_W.y1, 1]];
CLAMPS.forEach(([x, y, s], i) => {
  const foot = s > 0 ? [y, y + 8] : [y - 8, y];
  const lip = s > 0 ? [y - 5, y + 1] : [y - 1, y + 5];
  box(`clamp.${i}.foot`, [x, foot[0], DECK_TOP], [x + 6, foot[1], DECK_TOP + 1.8], { tone: "mid" }, { r: 0.5, steps: 3 });
  box(`clamp.${i}.lip`, [x, lip[0], STOCK_TOP], [x + 6, lip[1], STOCK_TOP + 1.3], { tone: "mid" }, { r: 0.5, steps: 3 });
  const F = G.frameOf([x + 3, s > 0 ? y + 5.5 : y - 5.5, DECK_TOP + 1.8], AZ, AX, AY);
  disc(`clamp.${i}.screw`, F, 0, 2.6, 1.1, { tone: "hi" }, { steps: 6 });
  disc(`clamp.${i}.knob`, F, 2.6, 4.8, 1.6, { tone: "mid" }, { extra: Faded(G.ribsOf(F, 2.6, 4.8, 1.6, 14, P, { fade: [0.1, 0.55], seams: true }), { tone: "lo" }) });
});
// Z-zero plate: the plate and its clip live in a holder on the YZ car (drawn with the car). The fault staging in the
// WebGL viewer lays a second copy under the bit on the stock. The ground clip is NOT stored: in this lab it stays clamped on
// the aluminium spindle (carriage) plate edge (instructor, Oct 2026), drawn with the Z axis below.
let ZCLIP = null;
const ZZ = { plate: { min: [386, 184.35, STOCK_TOP], max: [400, 188.85, STOCK_TOP + 0.3] }, tip: [391, 186.6], post: [399, 186.6, STOCK_TOP + 0.3] };
mesh({ kind: "box", name: "zplate", min: ZZ.plate.min, max: ZZ.plate.max, tone: "hi" });
mesh({ kind: "lathe", name: "zplate.post", F: { o: ZZ.post, a: [0, 0, 1], u: [1, 0, 0], v: [0, 1, 0] }, profile: [[0, 0.45], [0.5, 0.45], [0.7, 0.3]], tone: "hi" });
// X proximity switch at the X = 0 end of the near side, target plate on the near end plate (drawn later)
{
  const PXx = ORIGIN.x - SPX + PLATE.bottomHalf + 4;
  box("prox.x.bracket", [PXx, NEAR.outer, SIDE_Z[1] - 8], [PXx + 2, NEAR.outer + 3, SIDE_Z[1] - 2], { tone: "mid" }, { r: 0.3, steps: 2 });
  const F = G.frameOf([PXx + 2, NEAR.outer + 1.5, SIDE_Z[1] - 5], [-1, 0, 0], AZ, AY);
  disc("prox.x", F, 0, 4, 0.9, { tone: "hi" }, { extra: Ln(G.arcOf(F, 3.2, 0.9, P), { tone: "faint" }) });
}

// ---------------------------------------------------------------- control box, VFD, pendant, PC (front side, X = 0 end)
{
  setLayer(LAYER.nearStatic, "stand");
  const CB = { x0: 312, x1: 372, y0: NEAR.inner - 25, y1: NEAR.inner, z0: 12, z1: 70 };
  const face = CB.y1 + 0.01;
  // brackets to the inside of the table side
  for (const x of [CB.x0 + 4, CB.x1 - 6]) box("box.bracket", [x, CB.y1 - 3, CB.z1], [x + 2, CB.y1 + 2, SIDE_Z[0]], { tone: "lo" }, { r: 0.3, steps: 2 });
  const seam = Ln(k.sideSeam({ x: CB.x0, y: CB.y0, w: CB.x1 - CB.x0, d: CB.y1 - CB.y0, r: 0.8 }, CB.z0 + 3, P, 3), { tone: "faint" });
  box("box.cabinet", [CB.x0, CB.y0, CB.z0], [CB.x1, CB.y1, CB.z1], { tone: "mid" }, { r: 0.8, steps: 3, bevel: 0.6, inner: seam });
  // door: hinge dots on the -x edge, handle on the +x edge, yellow disconnect, LEDs, label
  put("box.hinges", [CB.x0 + 2, face, 40], Dots([CB.z0 + 10, CB.z1 - 10].map((z) => at([CB.x0 + 2.5, face, z])), { size: 0.5, tone: "lo" }), [], { bias: 0.1 });
  box("box.handle", [CB.x1 - 5, face, 36], [CB.x1 - 3.6, face + 1.4, 46], { tone: "hi" }, { r: 0.5, steps: 3 });
  const DF = G.frameOf([CB.x0 + 10, face, CB.z1 - 10], AY, AZ, AX);
  disc("box.disconnect.base", DF, 0, 1.4, 3.6, { tone: "lo" }, { steps: 28 });
  const DH = G.frameOf([CB.x0 + 10, face + 1.4, CB.z1 - 10], AY, AZ, AX);
  prism("box.disconnect", DH, [[-1.2, -4], [1.2, -4], [1.2, 1], [-1.2, 1]], 0, 2.2, { tone: "hi" });
  [["pwr", CB.x0 + 22], ["run", CB.x0 + 27], ["led", CB.x0 + 32]].forEach(([id, x]) => {
    const F = G.frameOf([x, face, CB.z1 - 8], AY, AZ, AX);
    const shape = record(A.disc(F, 0, 0.8, 1, { name: `box.${id}` }));
    put(`box.${id}`, [x, face + 0.4, CB.z1 - 8], `<g class="sb-led" data-led="${id}">${S(G.disc(0, 0.8, 1, F, P, { steps: 16 }), { tone: "mid" })}</g>`, [shape], { bias: 0.1 });
  });
  const KF = G.frameOf([CB.x0 + 42, face, CB.z1 - 9], AY, AZ, AX);
  disc("box.key", KF, 0, 1.4, 1.6, { tone: "mid" }, { steps: 20, extra: Ln(path3([[CB.x0 + 42, face + 1.45, CB.z1 - 10.1], [CB.x0 + 42, face + 1.45, CB.z1 - 7.9]]), { tone: "hi", free: true }) });
  box("box.label", [CB.x0 + 20, face, CB.z1 - 22], [CB.x0 + 40, face + 0.3, CB.z1 - 16], { tone: "lo", crease: "none" }, { r: 0.4, steps: 2, extra: Ln([14, 10, 12].map((w, i) => path3([[CB.x0 + 22, face + 0.31, CB.z1 - 17.4 - i * 1.6], [CB.x0 + 22 + w, face + 0.31, CB.z1 - 17.4 - i * 1.6]])).join(""), { tone: "lo", free: true }) });
  // glands on the bottom, cables up into the side extrusion channel
  [CB.x0 + 12, CB.x0 + 20, CB.x0 + 28, CB.x0 + 36].forEach((x, i) => {
    const F = G.frameOf([x, CB.y0 + 8, CB.z0], [0, 0, -1], AX, AY);
    disc(`box.gland.${i}`, F, 0, 1.6, 1.2, { tone: "lo" }, { steps: 16 });
  });
  // VFD further along the side, same mounting
  const VB = { x0: 250, x1: 272, y0: NEAR.inner - 18, y1: NEAR.inner, z0: 40, z1: 70 };
  for (const x of [VB.x0 + 3, VB.x1 - 5]) box("vfd.bracket", [x, VB.y1 - 3, VB.z1], [x + 2, VB.y1 + 2, SIDE_Z[0]], { tone: "lo" }, { r: 0.3, steps: 2 });
  box("vfd", [VB.x0, VB.y0, VB.z0], [VB.x1, VB.y1, VB.z1], { tone: "mid" }, { r: 0.8, steps: 3, bevel: 0.5, inner: Ln(k.sideSeam({ x: VB.x0, y: VB.y0, w: VB.x1 - VB.x0, d: VB.y1 - VB.y0, r: 0.8 }, VB.z1 - 10, P, 3), { tone: "faint" }) });
  put("vfd.window", [VB.x0 + 11, VB.y1, VB.z1 - 5], `<g class="sb-window">${Ln(path3([[VB.x0 + 5, VB.y1 + 0.01, VB.z1 - 7], [VB.x0 + 17, VB.y1 + 0.01, VB.z1 - 7], [VB.x0 + 17, VB.y1 + 0.01, VB.z1 - 3.5], [VB.x0 + 5, VB.y1 + 0.01, VB.z1 - 3.5]], true), { tone: "lo" })}</g>`, [], { bias: 0.1 });
  put("vfd.keys", [VB.x0 + 11, VB.y1, VB.z1 - 14], Dots([VB.z1 - 12, VB.z1 - 15].flatMap((z) => [7, 11, 15].map((dx) => at([VB.x0 + dx, VB.y1 + 0.01, z]))), { size: 0.45, tone: "lo" }), [], { bias: 0.1 });
  cable("cable.box.in", [[CB.x0 + 30, CB.y0 + 6, CB.z1], [CB.x0 + 30, CB.y0 + 6, CB.z1 + 1.2], [CB.x0 + 30, CB.y1 - 6, SIDE_Z[0] - 1]], 0.7, { tone: "lo", bend: 2, ends: [true, false] });
  // PC on a cart beyond the X = 0 end, with the USB lead to the box
  setLayer(LAYER.front, "stand");
  const PC = { x: 452, y: 96 };
  box("pc.cart.base", [PC.x, PC.y, 0], [PC.x + 44, PC.y + 36, 2.4], { tone: "lo" }, { r: 1, steps: 3 });
  for (const [dx, dy] of [[3, 3], [38, 3], [3, 30], [38, 30]]) {
    const F = G.frameOf([PC.x + dx + 1.5, PC.y + dy + 1.5, 0], AZ, AX, AY);
    disc("pc.cart.caster", F, -0.1, 0.1, 2.6, { tone: "lo" }, { steps: 20 });
    box("pc.cart.post", [PC.x + dx, PC.y + dy, 2.4], [PC.x + dx + 3, PC.y + dy + 3, 88], { tone: "lo" }, { r: 0.4, steps: 2 });
  }
  box("pc.cart.shelf", [PC.x - 1, PC.y - 1, 40], [PC.x + 45, PC.y + 37, 42], { tone: "lo" }, { r: 0.8, steps: 3 });
  box("pc.cart.top", [PC.x - 1, PC.y - 1, 88], [PC.x + 45, PC.y + 37, 90.4], { tone: "mid" }, { r: 0.8, steps: 3, bevel: 0.4 });
  box("pc.tower", [PC.x + 22, PC.y + 6, 42], [PC.x + 40, PC.y + 30, 80], { tone: "mid" }, { r: 0.6, steps: 3, inner: Ln(k.sideSeam({ x: PC.x + 22, y: PC.y + 6, w: 18, d: 24, r: 0.6 }, 76, P, 3), { tone: "faint" }), extra: Dots([at([PC.x + 40, PC.y + 18, 72]), at([PC.x + 40, PC.y + 18, 69])], { size: 0.45, tone: "lo" }) });
  // monitor turned to face the operator at the X = 0 end (+x); the SB3 Position panel is drawn on it by the WebGL viewer
  box("pc.keyboard", [PC.x + 20, PC.y + 2, 90.4], [PC.x + 30, PC.y + 34, 91.8], { tone: "mid" }, { r: 0.6, steps: 3, extra: Ln(k.planOutline({ x: PC.x + 21, y: PC.y + 4, w: 8, d: 28, r: 0.3 }, 91.8, P, 2), { tone: "faint" }) });
  box("pc.monitor.foot", [PC.x + 2, PC.y + 8, 90.4], [PC.x + 14, PC.y + 24, 92], { tone: "lo" }, { r: 0.6, steps: 3 });
  box("pc.monitor.neck", [PC.x + 5, PC.y + 14, 92], [PC.x + 7.5, PC.y + 18, 104], { tone: "lo" }, { r: 0.3, steps: 2 });
  const scr = Ln(path3([[PC.x + 9.01, PC.y - 4, 105], [PC.x + 9.01, PC.y + 36, 105], [PC.x + 9.01, PC.y + 36, 129], [PC.x + 9.01, PC.y - 4, 129]], true), { tone: "lo" });
  box("pc.monitor", [PC.x + 7.5, PC.y - 5, 104], [PC.x + 9, PC.y + 37, 130], { tone: "mid" }, { r: 0.6, steps: 3, extra: `<g class="sb-window">${scr}</g>` });
  // black operator tray on two arms off the cart posts, right of the monitor (seen from the operator); the pendant lies on it face up
  const TR = { x0: PC.x + 2, x1: PC.x + 42, y0: PC.y + 38, y1: PC.y + 66, z0: 87.4, z1: 88.2 };
  for (const x of [PC.x + 3, PC.x + 38]) box("tray.arm", [x, PC.y + 30, 85.8], [x + 3, TR.y1 - 2, TR.z0], { tone: "lo" }, { r: 0.3, steps: 2 });
  box("tray", [TR.x0, TR.y0, TR.z0], [TR.x1, TR.y1, TR.z1], { tone: "lo" }, { r: 0.8, steps: 3 });
  for (const [x0, y0, x1, y1] of [[TR.x0, TR.y0, TR.x1, TR.y0 + 0.8], [TR.x0, TR.y1 - 0.8, TR.x1, TR.y1], [TR.x0, TR.y0 + 0.8, TR.x0 + 0.8, TR.y1 - 0.8], [TR.x1 - 0.8, TR.y0 + 0.8, TR.x1, TR.y1 - 0.8]]) box("tray.rim", [x0, y0, TR.z1], [x1, y1, TR.z1 + 1.2], { tone: "lo" }, { r: 0.3, steps: 2 });
  const PD = { x0: PC.x + 17, x1: PC.x + 26, y0: PC.y + 42, y1: PC.y + 60, z0: TR.z1, z1: TR.z1 + 4.6 };
  const pcx = (PD.x0 + PD.x1) / 2;
  box("pendant", [PD.x0, PD.y0, PD.z0], [PD.x1, PD.y1, PD.z1], { tone: "hi" }, { r: 0.9, steps: 3, bevel: 0.4, extra: Dots([[PD.x0 + 1, PD.y0 + 1], [PD.x1 - 1, PD.y0 + 1], [PD.x0 + 1, PD.y1 - 1], [PD.x1 - 1, PD.y1 - 1]].map(([x, y]) => at([x, y, PD.z1 + 0.01])), { size: 0.4, tone: "lo" }) });
  const up = (y) => G.frameOf([pcx, y, PD.z1], AZ, AX, AY);
  box("pendant.estop.base", [pcx - 3.2, PD.y0 + 1.2, PD.z1], [pcx + 3.2, PD.y0 + 7.6, PD.z1 + 0.5], { tone: "hi" }, { r: 0.4, steps: 2 });
  turned("pendant.estop.collar", up(PD.y0 + 4.4), [[0.5, 2.0], [1.6, 2.0]], { tone: "hi" }, { steps: 24 });
  turned("pendant.estop", up(PD.y0 + 4.4), [[1.6, 1.3], [2.0, 2.7], [3.0, 2.7], [3.5, 1.9]], { tone: "mid" }, { steps: 28 });
  for (const [name, y] of [["reset", PD.y0 + 10.6], ["start", PD.y0 + 15]]) {
    turned(`pendant.ring.${name}`, up(y), [[0, 1.6], [0.7, 1.6]], { tone: "lo" }, { steps: 20 });
    turned(`pendant.${name}`, up(y), [[0.7, 1.15], [1.1, 1.15], [1.2, 0.9]], { tone: "mid" }, { steps: 20 });
  }
  disc("pendant.gland", G.frameOf([pcx, PD.y1, PD.z0 + 2], AY, AZ, AX), 0, 1.8, 0.9, { tone: "lo" }, { steps: 16 });
  cable("cable.pendant", [[pcx, PD.y1 + 1.8, PD.z0 + 2], [pcx, TR.y1 + 3, TR.z1 + 1.6], [pcx + 1, TR.y1 + 5, 70], [PC.x + 16, TR.y1 + 9, 44], [404, 198, 44], [CB.x1, 199, 46]], 0.4, { tone: "lo", bend: 4, ends: [false, true] });
  cable("cable.usb", [[PC.x + 22, PC.y + 18, 60], [PC.x - 6, PC.y + 30, 50], [CB.x1 + 14, CB.y0 + 10, 30], [CB.x1 - 10, CB.y0 + 12, CB.z0 + 1]], 0.5, { tone: "lo", bend: 6, shells: [true, true] });
}

// ---------------------------------------------------------------- X cable carrier trough and brackets (front side)
const XCHAIN = { troughY: 224.5, troughZ: 67, fixedX: 203, bracketZ: 95, r: 14 };
{
  setLayer(LAYER.front, "stand");
  const TR = { y0: 221, y1: 228, z0: 64, z1: 70, x0: 15, x1: 391 };
  box("xchain.trough", [TR.x0, TR.y0, TR.z0], [TR.x1, TR.y1, TR.z1], { tone: "lo" }, { r: 0.3, steps: 2, inner: Ln(path3([[TR.x0 + 1, TR.y1 + 0.01, TR.z0 + 2], [TR.x1 - 1, TR.y1 + 0.01, TR.z0 + 2]]), { tone: "faint", free: true }) });
  for (const x of [60, 203, 350]) box("xchain.bracket", [x, NEAR.outer, TR.z0], [x + 2.4, TR.y0, TR.z0 + 2], { tone: "lo" }, { r: 0.3, steps: 2 });
  R.route("xchain", G.fillet(xChainRoute({ xchain: XCHAIN }, GX), 6, 10, { P, tube: 2.2 }), 2.2, { limp: true, piece: "stand", touch: ["xchain.trough", "endplate.near"] });
}

// ---------------------------------------------------------------- gantry
function endPlate(side, tag) {
  setLayer(side === NEAR ? LAYER.gantry : LAYER.farGantry, "gantry");
  const sgn = side.sign;
  const rackOuter = side.outer + sgn * RACK_T;
  const py = sgn > 0 ? [rackOuter + PLATE.gap, rackOuter + PLATE.gap + PLATE.t] : [rackOuter - PLATE.gap - PLATE.t, rackOuter - PLATE.gap];
  const inner = sgn > 0 ? py[0] : py[1];
  const outer = sgn > 0 ? py[1] : py[0];
  // tapered plate: wide at the bottom over the rail and rack, narrow at the top where the beam bolts on
  const poly = [[-PLATE.bottomHalf, PLATE.z0], [PLATE.bottomHalf, PLATE.z0], [PLATE.topHalf, PLATE.z1], [-PLATE.topHalf, PLATE.z1]];
  const F = G.frameOf([GX, py[0], 0], AY, AX, AZ); // prism along y; polygon in (x, z)
  const bolts = sgn > 0 ? Dots([[-10, PLATE.z1 - 6], [10, PLATE.z1 - 6], [-10, PLATE.z1 - 20], [10, PLATE.z1 - 20], [-20, PLATE.z0 + 6], [20, PLATE.z0 + 6]].map(([dx, z]) => at([GX + dx, outer + 0.01, z])), { size: 0.55, tone: "lo" }) : "";
  prism(`endplate.${tag}`, F, poly, 0, PLATE.t, { tone: "lo" }, { extra: bolts });
  // V-wheels on the inner face riding the rail's outer edge
  const wy = sgn > 0 ? [side.outer - 1, inner] : [inner, side.outer + 1];
  for (const dx of [-15, 15]) {
    const WF = G.frameOf([GX + dx, wy[0], RAIL_Z[1] + 3.4], AY, AZ, AX);
    disc(`roller.x.${tag}`, WF, 0, wy[1] - wy[0], 3.8, { tone: "hi" }, { extra: Ln(G.circleOf(WF, sgn > 0 ? 0 : wy[1] - wy[0], 1.6, P, 16), { tone: "faint" }) });
    const AF = G.frameOf([GX + dx, py[0], RAIL_Z[1] + 3.4], AY, AZ, AX);
    disc(`axle.x.${tag}`, AF, 0, PLATE.t + (sgn > 0 ? 0.8 : 0), 1, { tone: "mid" }, { steps: 12 });
  }
  // pinion in the rack plane, meshing on top of the rack; shaft through the plate to the gearbox outside
  const pz = RACK_Z[1] + 2.3;
  const rky = sgn > 0 ? [side.outer, rackOuter] : [rackOuter, side.outer];
  const PF = G.frameOf([GX, rky[0], pz], AY, AZ, AX);
  disc(`pinion.x.${tag}`, PF, 0, RACK_T, 2.3, { tone: "hi" }, { steps: 30, extra: Faded(G.ribsOf(PF, 0, RACK_T, 2.3, 30, P, { fade: [0.1, 0.5] }), { tone: "lo" }) });
  const shy = sgn > 0 ? [rackOuter, outer + 1] : [outer - 1, rackOuter];
  disc(`shaft.x.${tag}`, G.frameOf([GX, shy[0], pz], AY, AZ, AX), 0, shy[1] - shy[0], 0.8, { tone: "mid" }, { steps: 12 });
  // blue slotted motor mount plate on the outer face
  const mpy = sgn > 0 ? [outer, outer + 1] : [outer - 1, outer];
  const mpFace = sgn > 0 ? mpy[1] + 0.01 : mpy[0] - 0.01;
  const slots = sgn > 0 ? Ln([[-5, pz + 4.5], [5, pz + 4.5], [-5, pz - 4.5], [5, pz - 4.5]].map(([dx, z]) => path3([[GX + dx - 1.2, mpFace, z], [GX + dx + 1.2, mpFace, z]])).join(""), { tone: "lo", free: true }) : "";
  box(`xmotor.${tag}.mount`, [GX - 6.5, mpy[0], pz - 6.5], [GX + 6.5, mpy[1], pz + 6.5], { tone: "lo" }, { r: 1, steps: 3, extra: slots });
  const gby = sgn > 0 ? [mpy[1], mpy[1] + 4.5] : [mpy[0] - 4.5, mpy[0]];
  const GF = G.frameOf([GX, gby[0], pz], AY, AZ, AX);
  turned(`xmotor.${tag}.gearbox`, GF, [[0, 3.4], [3.8, 3.4], [4, 3, 1], [4.5, 2.8]], { tone: "mid" }, { inner: Ln(G.arcOf(GF, 1.4, 3.4, P), { tone: "faint" }) });
  const my = sgn > 0 ? [gby[1], gby[1] + 9] : [gby[0] - 9, gby[0]];
  const MF = G.frameOf([GX, my[0], pz], AY, AZ, AX);
  prism(`xmotor.${tag}`, MF, rect(-4.2, 4.2, -4.2, 4.2), 0, 9, { tone: "hi" }, { extra: sgn > 0 ? Dots([[-3, -3], [3, -3], [-3, 3], [3, 3]].map(([u, v]) => at([GX + u, my[1] + 0.01, pz + v])), { size: 0.45, tone: "lo" }) : "" });
  const CF = G.frameOf([GX, sgn > 0 ? my[1] : my[0] - 1.6, pz], AY, AZ, AX);
  disc(`xmotor.${tag}.cap`, CF, 0, 1.6, 2, { tone: "lo" }, { steps: 16 });
  // upper X cable-carrier bracket and the proximity target on the near plate
  if (sgn > 0) box("xchain.upper", [GX - 2, outer, XCHAIN.bracketZ - 3], [GX + 2, XCHAIN.troughY + 1, XCHAIN.bracketZ - 1], { tone: "lo" }, { r: 0.3, steps: 2 });
  if (sgn > 0) box("prox.x.target", [GX + PLATE.bottomHalf - 4, outer, PLATE.z0 + 2], [GX + PLATE.bottomHalf + 4, outer + 0.4, PLATE.z0 + 8], { tone: "mid" }, { r: 0.2, steps: 2 });
  return { inner, outer };
}
const farEnd = endPlate(FAR, "far");
const nearEnd = endPlate(NEAR, "near");

setLayer(LAYER.gantry, "gantry");
const BEAM_Y = [farEnd.inner, nearEnd.inner];
{
  const faceX = GX + BEAM.half + 0.01;
  const ribs = [BEAM.z[0] + 7, BEAM.z[0] + 14, BEAM.z[0] + 21].map((z) => path3([[faceX, BEAM_Y[0] + 1, z], [faceX, BEAM_Y[1] - 1, z]])).join("");
  const topRib = [GX - 3.5, GX - 0.5].map((x) => path3([[x, BEAM_Y[0] + 1, BEAM.z[1] + 0.01], [x, BEAM_Y[1] - 1, BEAM.z[1] + 0.01]])).join("");
  box("beam", [GX - BEAM.half, BEAM_Y[0], BEAM.z[0]], [GX + BEAM.half, BEAM_Y[1], BEAM.z[1]], { tone: "mid" }, { r: 0.8, steps: 3, bevel: 0.6, extra: Ln(ribs + topRib, { tone: "faint", free: true }) });
  box("yrail.top", [GX + 2, BEAM_Y[0] + 2, BEAM.z[1]], [GX + BEAM.half + 0.5, BEAM_Y[1] - 2, BEAM.z[1] + 2.5], { tone: "hi" }, { r: 0.3, steps: 2, bevel: 0.4 });
  box("yrail.low", [GX + BEAM.half, BEAM_Y[0] + 2, BEAM.z[0]], [GX + BEAM.half + 2, BEAM_Y[1] - 2, BEAM.z[0] + 3], { tone: "hi" }, { r: 0.3, steps: 2, bevel: 0.4 });
  const RK = { x: [GX + BEAM.half, GX + BEAM.half + RACK_T], z: [108, 111] };
  const teeth = k.sideTicks(BEAM_Y[0] + 4, BEAM_Y[1] - 4, 1.6, 1e9, RK.x[1] + 0.01, RK.z[1], [1.2, 1.2], P, "y");
  box("yrack", [RK.x[0], BEAM_Y[0] + 2, RK.z[0]], [RK.x[1], BEAM_Y[1] - 2, RK.z[1]], { tone: "hi" }, { r: 0.2, steps: 2, extra: Ln(teeth.minor, { tone: "lo" }) });
  const F = G.frameOf([GX + BEAM.half, BEAM_Y[0] + 9, BEAM.z[0] + 18], AX, AZ, AY);
  disc("prox.y", F, 0, 3.6, 0.9, { tone: "hi" }, { extra: Ln(G.arcOf(F, 2.8, 0.9, P), { tone: "faint" }) });
  box("ychain.trough", [GX - BEAM.half, BEAM_Y[0] + 4, BEAM.z[1]], [GX + 1.2, BEAM_Y[1] - 4, BEAM.z[1] + 3], { tone: "lo" }, { r: 0.3, steps: 2 });
  box("ychain.fixed", [GX - 4, BEAM_Y[0] + 18, BEAM.z[1] + 3], [GX, BEAM_Y[0] + 22, BEAM.z[1] + 6], { tone: "lo" }, { r: 0.3, steps: 2 });
}
const YCHAIN = { x: GX - 2, fixedY: BEAM_Y[0] + 20, topZ: BEAM.z[1] + 3 + 1.6, r: 8, carY: -8 };

// ---------------------------------------------------------------- YZ car
setLayer(LAYER.car, "car");
const CX = [GX + CAR.x[0], GX + CAR.x[1]];
{
  for (const dy of [-14, 14]) {
    const WF = G.frameOf([GX + 7.4, CY + dy, BEAM.z[1] + 2.5 + 3.1], AX, AZ, AY);
    disc("roller.y.top", WF, 0, 2.2, 3.5, { tone: "hi" }, { extra: Ln(G.circleOf(WF, 2.2, 1.4, P, 16), { tone: "faint" }) });
    disc("axle.y.top", G.frameOf([GX + 9.6, CY + dy, BEAM.z[1] + 5.6], AX, AZ, AY), 0, CX[1] - GX - 9.6 + 0.6, 1, { tone: "mid" }, { steps: 12 });
  }
  for (const dy of [-17, 17]) {
    const WF = G.frameOf([GX + 7.8, CY + dy, BEAM.z[0] - 2.6], AX, AZ, AY);
    disc("roller.y.low", WF, 0, 2.2, 3, { tone: "hi" }, { extra: Ln(G.circleOf(WF, 2.2, 1.2, P, 16), { tone: "faint" }) });
    disc("axle.y.low", G.frameOf([GX + 10, CY + dy, BEAM.z[0] - 2.6], AX, AZ, AY), 0, CX[1] - GX - 10 + 0.6, 1, { tone: "mid" }, { steps: 12 });
  }
  const poly = [[-CAR.half, CAR.z[0]], [-7, CAR.z[0]], [-5, CAR.z[0] + 4], [5, CAR.z[0] + 4], [7, CAR.z[0]], [CAR.half, CAR.z[0]], [CAR.half, CAR.z[1]], [-CAR.half, CAR.z[1]]];
  const F = G.frameOf([CX[0], CY, 0], AX, AY, AZ);
  const bolts = Dots([[-16, CAR.z[1] - 4], [16, CAR.z[1] - 4], [-16, CAR.z[0] + 8], [16, CAR.z[0] + 8]].map(([dy, z]) => at([CX[1] + 0.01, CY + dy, z])), { size: 0.55, tone: "lo" });
  prism("car.plate", F, poly, 0, CAR.x[1] - CAR.x[0], { tone: "lo" }, { extra: bolts });
  // Y motor: pinion behind the plate on the rack, slotted mount, gearbox and motor pointing at the viewer
  const pz = 111 + 2.3;
  const my = CY + 14;
  const PF = G.frameOf([GX + BEAM.half, my, pz], AX, AZ, AY);
  disc("pinion.y", PF, 0, RACK_T, 2.3, { tone: "hi" }, { steps: 30, extra: Faded(G.ribsOf(PF, 0, RACK_T, 2.3, 30, P, { fade: [0.1, 0.5] }), { tone: "lo" }) });
  disc("shaft.y", G.frameOf([GX + BEAM.half + RACK_T, my, pz], AX, AZ, AY), 0, CX[1] + 1 - (GX + BEAM.half + RACK_T), 0.8, { tone: "mid" }, { steps: 12 });
  box("ymotor.mount", [CX[1], my - 6, pz - 6], [CX[1] + 1, my + 6, pz + 6], { tone: "lo" }, { r: 1, steps: 3, extra: Ln([[-4.5, pz + 4], [4.5, pz + 4], [-4.5, pz - 4], [4.5, pz - 4]].map(([dy, z]) => path3([[CX[1] + 1.01, my + dy - 1, z], [CX[1] + 1.01, my + dy + 1, z]])).join(""), { tone: "lo", free: true }) });
  const GF = G.frameOf([CX[1] + 1, my, pz], AX, AZ, AY);
  turned("ymotor.gearbox", GF, [[0, 3.2], [3.6, 3.2], [3.8, 2.8, 1], [4.2, 2.6]], { tone: "mid" }, { inner: Ln(G.arcOf(GF, 1.3, 3.2, P), { tone: "faint" }) });
  const MF = G.frameOf([CX[1] + 5.2, my, pz], AX, AZ, AY);
  prism("ymotor", MF, rect(-4, 4, -4, 4), 0, 8.5, { tone: "hi" }, { extra: Dots([[-2.8, -2.8], [2.8, -2.8], [-2.8, 2.8], [2.8, 2.8]].map(([u, v]) => at([CX[1] + 13.71, my + u, pz + v])), { size: 0.45, tone: "lo" }) });
  disc("ymotor.cap", G.frameOf([CX[1] + 13.7, my, pz], AX, AZ, AY), 0, 1.6, 2, { tone: "lo" }, { steps: 16 });
  // Z bearing blocks either side of the Z extrusion
  for (const s of [-1, 1]) for (const z of [103, 125]) {
    const y = s > 0 ? [CY + ZX.half + 0.5, CY + ZX.half + 4] : [CY - ZX.half - 4, CY - ZX.half - 0.5];
    box(`zbearing.${s > 0 ? "near" : "far"}`, [CX[1], y[0], z], [GX + ZX.x[0] + 0.2, y[1], z + 6], { tone: "mid" }, { r: 0.4, steps: 2, extra: Dots([at([GX + ZX.x[0] + 0.21, (y[0] + y[1]) / 2, z + 3])], { size: 0.5, tone: "hi" }) });
  }
  // Z motor on a bracket from the car top, pinion on the Z rack
  const zpz = 152;
  const zmy = CY + ZX.half + RACK_T + 2.3;
  box("zmotor.arm", [CX[0], CY + ZX.half + 2.6, CAR.z[1]], [CX[1] + 1, CY + ZX.half + 12, zpz + 6], { tone: "lo" }, { r: 0.4, steps: 2 });
  box("zmotor.mount", [CX[1] + 1, CY + ZX.half + 2.6, zpz - 6], [GX + ZX.x[0] + 5.5, zmy + 6, zpz + 6], { tone: "lo" }, { r: 1, steps: 3 });
  const ZPF = G.frameOf([GX + ZX.x[0] + 1.5, zmy, zpz], AX, AZ, AY);
  disc("pinion.z", ZPF, 0, 3, 2.3, { tone: "hi" }, { steps: 30, extra: Faded(G.ribsOf(ZPF, 0, 3, 2.3, 30, P, { fade: [0.1, 0.5] }), { tone: "lo" }) });
  const ZGF = G.frameOf([GX + ZX.x[0] + 5.5, zmy, zpz], AX, AZ, AY);
  turned("zmotor.gearbox", ZGF, [[0, 3.2], [3.6, 3.2], [3.8, 2.8, 1], [4.2, 2.6]], { tone: "mid" }, { inner: Ln(G.arcOf(ZGF, 1.3, 3.2, P), { tone: "faint" }) });
  const ZMF = G.frameOf([GX + ZX.x[0] + 9.7, zmy, zpz], AX, AZ, AY);
  prism("zmotor", ZMF, rect(-4, 4, -4, 4), 0, 8.5, { tone: "hi" });
  disc("zmotor.cap", G.frameOf([GX + ZX.x[0] + 18.2, zmy, zpz], AX, AZ, AY), 0, 1.6, 2, { tone: "lo" }, { steps: 16 });
  // Z-zero plate stored upright in a two-strip holder on the car's front face, its coiled lead hanging down. The ground
  // clip is not stored here: it stays on the spindle (carriage) plate edge (see the Z-axis block).
  {
    const fx0 = CX[1];
    const py = [CY - 17.25, CY - 12.75], pz = [113, 127];
    box("zplate.stored", [fx0 + 0.05, py[0], pz[0]], [fx0 + 0.35, py[1], pz[1]], { tone: "hi" }, { r: 0.5, steps: 3 });
    for (const y of [py[0] - 0.5, py[1] - 0.7]) box("zplate.stored.holder", [fx0, y, 116], [fx0 + 0.8, y + 1.2, 124], { tone: "mid" }, { r: 0.2, steps: 2 });
    const coil = [[fx0 + 0.6, CY - 13.6, pz[1] + 0.2], [fx0 + 1.2, CY - 13.6, pz[1] + 0.6], [fx0 + 1.4, CY - 13.6, 123.2]];
    const turns = 22, top = 123, bottom = 104.5, rr = 0.55;
    for (let i = 0; i <= turns * 10; i++) { const a = (i / 10) * Math.PI * 2; coil.push([fx0 + 1.4 + rr * Math.sin(a), CY - 13.6 + rr * (1 - Math.cos(a)) - rr, top - (top - bottom) * (i / (turns * 10))]); }
    coil.push([fx0 + 1.3, CY - 14.6, 103.4], [fx0 + 0.9, CY - 15, 105], [fx0 + 0.85, CY - 15, 109.4]);
    mesh({ kind: "tube", name: "zlead.stored", route: coil, r: 0.12, tone: "lo" });
    put("zlead.stored", [fx0 + 1.4, CY - 13.6, 114], Ln(path3([[fx0 + 1.4, CY - 13.6, 123], [fx0 + 1.4, CY - 13.6, 104.5]]), { tone: "lo", free: true }), [], { bias: 0.2 });
  }
  // Y cable-carrier bracket from the beam top to the car top
  box("ychain.car", [GX - 3, CY + YCHAIN.carY - 1, YCHAIN.topZ + 2 * YCHAIN.r - 2], [CX[1], CY + YCHAIN.carY + 1, YCHAIN.topZ + 2 * YCHAIN.r], { tone: "lo" }, { r: 0.3, steps: 2 });
  R.route("ychain", G.fillet(yChainRoute({ ychain: YCHAIN }, CY), 5, 10, { P, tube: 1.6 }), 1.6, { limp: true, piece: "car", touch: ["ychain.trough", "ychain.car"] });
}

// ---------------------------------------------------------------- Z axis: extrusion, rack, spindle plate, spindle, dust foot
setLayer(LAYER.zaxis, "zaxis");
const ZB = ZB_REST;
let HOSE = null;
{
  const zx = [GX + ZX.x[0], GX + ZX.x[1]];
  const grooves = [zx[0] + 1.5, zx[0] + 3, zx[0] + 4.5].map((x) => path3([[x, CY + ZX.half + 0.01, ZB + ZX.z[0] + 2], [x, CY + ZX.half + 0.01, ZB + ZX.z[1] - 2]])).join("");
  box("zextrusion", [zx[0], CY - ZX.half, ZB + ZX.z[0]], [zx[1], CY + ZX.half, ZB + ZX.z[1]], { tone: "mid" }, { r: 0.5, steps: 3, bevel: 0.4, extra: Ln(grooves, { tone: "faint", free: true }) });
  box("zrack", [zx[0] + 1.5, CY + ZX.half, ZB + 2], [zx[0] + 4.5, CY + ZX.half + RACK_T, ZB + 62], { tone: "hi" }, { r: 0.2, steps: 2 });
  // hose bracket on top of the extrusion: arm forward, ring the hose passes through
  box("hose.bracket.foot", [zx[0], CY - 4, ZB + ZX.z[1]], [zx[1], CY + 4, ZB + ZX.z[1] + 2], { tone: "lo" }, { r: 0.3, steps: 2 });
  box("hose.bracket.arm", [zx[0] + 2, CY - 16, ZB + ZX.z[1] + 2], [zx[0] + 4, CY + 2, ZB + ZX.z[1] + 4], { tone: "lo" }, { r: 0.3, steps: 2 });
  box("hose.bracket.arm2", [zx[0] + 2, CY - 16, ZB + ZX.z[1] + 2], [GX + SPX, CY - 14, ZB + ZX.z[1] + 4], { tone: "lo" }, { r: 0.3, steps: 2 });
  const HR = G.frameOf([GX + SPX, CY - 15, ZB + ZX.z[1] + 4], AZ, AX, AY);
  turned("hose.bracket.ring", HR, [[0, 5.6], [2.4, 5.6]], { tone: "lo" });
  // spindle mount plate and the two clamp blocks
  box("spindle.plate", [zx[1], CY - 11, ZB + 3], [zx[1] + 1.5, CY + 11, ZB + 40], { tone: "hi" }, { r: 0.6, steps: 3, bevel: 0.4, extra: Dots([[-8, ZB + 7], [8, ZB + 7], [-8, ZB + 36], [8, ZB + 36]].map(([dy, z]) => at([zx[1] + 1.51, CY + dy, z])), { size: 0.5, tone: "lo" }) });
  for (const z of [ZB + 8, ZB + 26]) box("spindle.clamp", [zx[1] + 1.5, CY - 7.8, z], [GX + SPX - 5.5, CY + 7.8, z + 4], { tone: "mid" }, { r: 0.4, steps: 2 });
  // HSD spindle: rectangular body with rounded corners, fan cowl on top, round nose below
  const SF = G.frameOf([GX + SPX, CY, 0], AZ, AX, AY);
  box("spindle", [GX + SPX - 5.5, CY - 7.5, ZB + 6], [GX + SPX + 5.5, CY + 7.5, ZB + 34], { tone: "hi" }, { r: 1.6, steps: 4, bevel: 0.6, inner: Ln(k.sideSeam({ x: GX + SPX - 5.5, y: CY - 7.5, w: 11, d: 15, r: 1.6 }, ZB + 12, P, 4) + k.sideSeam({ x: GX + SPX - 5.5, y: CY - 7.5, w: 11, d: 15, r: 1.6 }, ZB + 30, P, 4), { tone: "faint" }) });
  turned("spindle.cowl", SF, [[ZB + 34, 5.2], [ZB + 38.5, 5.2], [ZB + 39, 4.2, 1], [ZB + 39.2, 2.6]], { tone: "hi" }, { extra: Faded(G.ribsOf(SF, ZB + 34.5, ZB + 38.5, 5.2, 28, P, { fade: [0.1, 0.55], seams: true }), { tone: "lo" }) + Ln([1.2, 1.7, 2.2].map((r) => G.circleOf(SF, ZB + 39.21, r, P, 20)).join(""), { tone: "faint" }) });
  box("spindle.plug", [GX + SPX - 2, CY - 7.5 - 2.6, ZB + 28], [GX + SPX + 2, CY - 7.5, ZB + 33], { tone: "mid" }, { r: 0.5, steps: 2 });
  turned("spindle.nose", SF, [[ZB + 1.5, 2.6], [ZB + 2, 3.5], [ZB + 6, 3.5]], { tone: "hi" }, { steps: 32 });
  turned("collet", SF, [[ZB - 2, 2], [ZB - 1.6, 2.3], [ZB + 1.5, 2.3]], { tone: "mid" }, { steps: 8, extra: Faded(G.ribsOf(SF, ZB - 1.6, ZB + 1.5, 2.3, 8, P, { fade: [0.1, 0.55] }), { tone: "lo" }) });
  mesh({ kind: "lathe", name: "tool", F: { o: SF.o, a: SF.a, u: SF.u, v: SF.v }, profile: [[ZB - 6, 0.3], [ZB - 2, 0.3]], tone: "hi" });
  put("tool", [GX + SPX, CY, ZB - 4], `<g data-part="tool">${S(G.disc(ZB - 6, ZB - 2, 0.3, SF, P, { steps: 12 }), { tone: "hi" })}</g>`, [record(A.disc(SF, ZB - 6, ZB - 2, 0.3, { name: "tool" }))], { bias: 0.3 });
  // the lab's ground clip: permanently clamped on the +y vertical edge of the aluminium spindle (carriage) plate, a little
  // below its top corner (instructor + lab photos, Oct 2026; circuit plate -> spindle -> collet -> bit). WebGL meshes.
  // Profile (u = across the plate face, v = into the plate from the edge), extruded along z: the outer jaw lies on the
  // plate's front (+x) face, the inner jaw wraps the side edge, pivot and black-booted handles stick out sideways (+y).
  // Which side (+y vs -y) is not established from the photos; +y is a modelling choice.
  {
    const k = 1.35, O = [zx[1] + 1.5, CY + 11, ZB + 34];
    const F = { o: O, a: [0, 0, -1], u: [1, 0, 0], v: [0, -1, 0] };
    const sc = (poly) => poly.map(([y, z]) => [y * k, (z - 6) * k]);
    const part = (name, poly, w) => mesh({ kind: "prism", name, F, poly: sc(poly), s0: -w / 2, s1: w / 2, tone: name.endsWith("boot") ? "lo" : "hi" });
    part("zclip", [[0, 4.6], [0.35, 4.6], [0.42, 7.6], [0.18, 7.95], [0, 7.7]], 0.9); // outer jaw
    part("zclip", [[-1.3, 4.6], [-0.95, 4.6], [-0.35, 5.98], [-0.8, 5.98]], 0.9); // inner jaw
    part("zclip", [[-1.45, 4.15], [0.5, 4.15], [0.5, 4.75], [-1.45, 4.75]], 1.1); // pivot and spring
    part("zclip", [[0.0, 4.3], [0.4, 4.3], [0.85, 2.6], [0.45, 2.6]], 0.9); // handles
    part("zclip", [[-1.0, 4.3], [-1.4, 4.3], [-1.95, 2.6], [-1.55, 2.6]], 0.9);
    part("zclip.boot", [[0.3, 3.5], [0.95, 3.5], [1.25, 1.3], [0.45, 1.3]], 1.3);
    part("zclip.boot", [[-1.3, 3.5], [-1.95, 3.5], [-2.3, 1.3], [-1.5, 1.3]], 1.3);
    ZCLIP = [O[0] + 0.85 * k, O[1] - (1.3 - 6) * k, O[2]];
    // simplified clip for the static SVG figure (hidden in WebGL, which draws the profiled clip above)
    box("zclip.flat", [O[0], O[1] - 0.6, O[2] - 1.2], [O[0] + 1.2, O[1] + 1.8, O[2] + 1.2], { tone: "hi" }, { r: 0.3, steps: 2 });
    box("zclip.flat.boot", [O[0] + 0.1, O[1] + 1.8, O[2] - 1.1], [O[0] + 1.1, O[1] + 4.6, O[2] + 1.1], { tone: "lo" }, { r: 0.3, steps: 2 });
  }
  // two-part dust foot clamped on the nose collar, brush below, port on the +y side angled up
  turned("dustfoot.ring", SF, [[ZB - 1, 7.2], [ZB + 1.6, 7.2], [ZB + 1.6, 6.4], [ZB + 3.6, 6.4], [ZB + 3.8, 4.6, 1], [ZB + 4, 3.5]], { tone: "mid" }, { inner: Ln(G.arcOf(SF, ZB + 0.3, 7.2, P), { tone: "faint" }) });
  mesh({ kind: "lines", name: "dustfoot.brush", tone: "lo", segments: Array.from({ length: 64 }, (_, i) => { const a = (i / 64) * Math.PI * 2; const x = GX + SPX + 7.2 * Math.cos(a), y = CY + 7.2 * Math.sin(a); return [[x, y, ZB - 1], [x, y, ZB - 6.6]]; }) });
  put("dustfoot.brush", [GX + SPX, CY, ZB - 3.8], Faded(G.ribsOf(SF, ZB - 6.6, ZB - 1, 7.2, 64, P, { fade: [0.08, 0.5], seams: "last" }), { tone: "lo" }), [record(A.disc(SF, ZB - 6.6, ZB - 1, 7.2, { name: "dustfoot.brush" }))], { bias: -0.2 });
  const PORT_DIR = [0, -0.62, 0.78];
  const PORT_AT = [GX + SPX, CY - 6.6, ZB + 1.2];
  const HF = G.frameOf(PORT_AT, PORT_DIR, AX, G.cross3(PORT_DIR, AX));
  turned("dustfoot.port", HF, [[0, 4.4], [5, 4.4], [5, 4.9], [6.2, 4.9]], { tone: "mid" }, { steps: 32 });
  HOSE = { portAt: [SPX + PORT_DIR[0] * 6.2, -6.6 + PORT_DIR[1] * 6.2, ZB + 1.2 + PORT_DIR[2] * 6.2], portDir: PORT_DIR, bracketAt: [SPX, -15, ZB + ZX.z[1] + 5.2], r: 4.8 };
  R.route("hose.foot", G.fillet(hoseFootRoute({ hose: HOSE }, 0, 0).map(([x, y, z]) => [x + GX, y + CY, z]), 10, 10, { P, tube: HOSE.r }), HOSE.r, { limp: true, piece: "zaxis", touch: ["dustfoot.port", "hose.bracket.ring"] });
}

// ---------------------------------------------------------------- boom and dust collector (far corner of the front side)
const BOOM_TIP = [150, 140, 250];
const HOSE_LENGTH = 340;
{
  setLayer(LAYER.farStatic, "collector");
  const POST = [-34, 236];
  const PF = G.frameOf([POST[0], POST[1], 0], AZ, AX, AY);
  disc("boom.base", PF, 0, 2, 14, { tone: "lo" }, { steps: 32 });
  disc("boom.post", PF, 2, 250, 3.2, { tone: "mid" });
  const dir = G.unit3(G.sub3(BOOM_TIP, [POST[0], POST[1], 250]));
  const len = G.len3(G.sub3(BOOM_TIP, [POST[0], POST[1], 250]));
  const AF = G.frameOf([POST[0], POST[1], 250], dir, AZ, G.cross3(dir, AZ));
  disc("boom.arm", AF, 0, len, 2.4, { tone: "mid" });
  disc("boom.post.upper", PF, 250, 292, 2, { tone: "mid" });
  disc("boom.cap", PF, 292, 294, 2.6, { tone: "lo" });
  const stayTop = [POST[0], POST[1], 290];
  const stayEnd = G.add3([POST[0], POST[1], 250], G.mul3(dir, len * 0.62));
  cable("boom.stay", [stayTop, stayEnd], 0.35, { tone: "lo", bend: 1, limp: false });
  disc("boom.tip", G.frameOf(BOOM_TIP, AZ, AX, AY), -4, 0, 5.6, { tone: "lo" });
  // two-bag dust collector: frame on casters, impeller housing with the motor behind it, upper filter bag, lower bag, inlet
  const DC = { x: -70, y: 262 };
  for (const [dx, dy] of [[-24, -24], [24, -24], [-24, 24], [24, 24]]) disc("collector.caster", G.frameOf([DC.x + dx, DC.y + dy, 3], AX, AZ, AY), -1.4, 1.4, 3.2, { tone: "lo" }, { steps: 20 });
  box("collector.base", [DC.x - 30, DC.y - 30, 6], [DC.x + 30, DC.y + 30, 9], { tone: "lo" }, { r: 1, steps: 3 });
  for (const dx of [-26, 26]) box("collector.upright", [DC.x + dx - 2, DC.y - 2, 9], [DC.x + dx + 2, DC.y + 2, 215], { tone: "lo" }, { r: 0.4, steps: 2 });
  box("collector.crossbar", [DC.x - 28, DC.y - 2, 213], [DC.x + 28, DC.y + 2, 216], { tone: "lo" }, { r: 0.4, steps: 2 });
  const CF = G.frameOf([DC.x, DC.y, 0], AZ, AX, AY);
  turned("collector.bag.lower", CF, [[12, 20], [20, 25], [60, 26], [100, 25], [106, 23]], { tone: "mid" }, { inner: Ln(G.arcOf(CF, 50, 26, P), { tone: "faint" }) });
  disc("collector.band.lower", CF, 106, 108.5, 24, { tone: "lo" });
  const IH = G.frameOf([DC.x - 8, DC.y, 128], AX, AZ, AY);
  turned("collector.housing", IH, [[0, 17], [16, 17], [16, 6], [17, 6]], { tone: "mid" }, { inner: Ln(G.arcOf(IH, 8, 17, P), { tone: "faint" }) });
  const MH = G.frameOf([DC.x - 30, DC.y, 128], AX, AZ, AY);
  turned("collector.motor", MH, [[0, 9], [22, 9], [22.5, 7.5, 1], [23, 4]], { tone: "hi" }, { extra: Faded(G.ribsOf(MH, 2, 20, 9, 24, P, { fade: [0.1, 0.55], seams: true }), { tone: "lo" }) });
  const IN = G.frameOf([DC.x + 9, DC.y, 128], AX, AZ, AY);
  disc("collector.inlet", IN, 0, 7, 5.6, { tone: "mid" }, { extra: Dots(G.dotsOf(IN, 7, 4.6, 6, P, { fade: [0.04, 0.42] }), { size: 0.45, tone: "lo" }) });
  disc("collector.collar", CF, 108.5, 112, 20, { tone: "mid" });
  turned("collector.bag.upper", CF, [[112, 23], [118, 26], [160, 26], [206, 24], [212, 18]], { tone: "mid" }, { inner: Ln(G.arcOf(CF, 160, 26, P), { tone: "faint" }) });
  disc("collector.band.upper", CF, 110, 112.5, 24.5, { tone: "lo" });
  disc("collector.band.top", CF, 212, 214, 18, { tone: "lo" });
  // hose from the boom tip back along the arm, down the post, across the floor to the inlet
  cable("hose.floor", [[BOOM_TIP[0], BOOM_TIP[1], BOOM_TIP[2] + 2], [POST[0] + 6, POST[1] - 4, 252], [POST[0] + 4, POST[1] - 6, 180], [POST[0] + 2, POST[1] - 8, 60], [POST[0] - 6, POST[1] + 10, 24], [DC.x + 40, DC.y, 60], [DC.x + 24, DC.y, 128], [DC.x + 16, DC.y, 128]], HOSE.r, { tone: "hi", bend: 16, ends: [false, false], rings: { pitch: 2.6, fade: [0.1, 0.55], tone: "lo" }, maxLength: 22, pieceOf: "collector" });
  R.route("hose.boom", G.fillet(hoseBoomRoute({ hose: HOSE, boomTip: BOOM_TIP, hoseLength: HOSE_LENGTH }, GX, CY, 0), 14, 10, { P, tube: HOSE.r }), HOSE.r, { limp: true, piece: "stand", touch: ["boom.tip", "hose.bracket.ring"] });
}

// ---------------------------------------------------------------- ORDER, SVG
A.settle(R, P);
R.items.sort((a, b) => a.layer - b.layer || a.key - b.key);
const itemSvg = (item) => `<g class="it" data-name="${item.name}" data-piece="${item.piece}"${item.attrs ?? ""}>${item.svg}</g>${item.slot ? `<g data-part="${item.slot}"></g>` : ""}`;
const ofLayer = (id) => R.items.filter((item) => item.layer === id).map(itemSvg).join("");
const live = (name, piece) => `<g class="it" data-name="${name}" data-piece="${piece}" data-part="${name}-live"></g>`;
const body = [
  ...back,
  `<g class="sb-static">${ofLayer(LAYER.farStatic)}</g>`,
  `<g class="sb-gantry-far" data-group="gantry-far">${ofLayer(LAYER.farGantry)}</g>`,
  `<g class="sb-static">${ofLayer(LAYER.nearStatic)}</g>`,
  `<g class="sb-gantry" data-group="gantry">${ofLayer(LAYER.gantry)}<g data-group="car">${ofLayer(LAYER.car)}<g data-group="zaxis">${ofLayer(LAYER.zaxis)}${live("hose.foot", "zaxis")}</g>${live("ychain", "car")}</g></g>`,
  `<g class="sb-front">${ofLayer(LAYER.front)}${live("xchain", "stand")}${live("hose.boom", "stand")}</g>`,
].join("");

const LABEL_TEXT = "A ShopBot PRSalpha 144-60 CNC router seen from the operator's corner: a blue steel-legged table with aluminium side extrusions carrying hardened V-rails and racks, a gantry on tapered blue end plates driven by a closed-loop stepper on each side, a YZ car on the gantry beam with its Y and Z motors facing the viewer, a Z extrusion carrying the spindle plate, an HSD spindle with collet, bit and brush dust foot, a 4-inch hose up to an overhead boom and down to a two-bag dust collector, cable carriers along the front side and over the gantry, and the control box, VFD, pendant and PC at the X = 0 end.";
const svg = k.figureSvg({ width: W, height: H, label: LABEL_TEXT, body: [body] });

// ---------------------------------------------------------------- the tool close-up
const INSET = buildInset({ azimuth: AZIMUTH, elevation: 18 });

const PROG = program();
const DATA = {
  P, V,
  inset: { P: INSET.P, KS: INSET.KS, Z0: INSET.Z0, flute: INSET.flute, W: INSET.W, H: INSET.H },
  rest: { gx: GX, cy: CY, zb: ZB, spx: SPX, stockTop: STOCK_TOP },
  origin: ORIGIN, machine: MACHINE, feed: FEED, safeZ: SAFE_Z, program: PROG, faults: FAULTS, stock: STOCK, speed: SPEED,
  routes: { xchain: XCHAIN, ychain: YCHAIN, hose: HOSE, boomTip: BOOM_TIP, hoseLength: HOSE_LENGTH },
};

const CSS = readFileSync(join(HERE, "shopbot.css"), "utf8");
const latheRaw = readFileSync(join(HERE, "..", "..", "kit", "lathe.mjs"), "utf8");
const latheNames = [...latheRaw.matchAll(/^export (?:function|const) (\w+)/gm)].map((m) => m[1]);
const latheScript = `const G = (() => {${latheRaw.replace(/^import .*$/m, "").replace(/^export /gm, "")}\nreturn { ${latheNames.join(", ")} };})();\n`;
const tubeSource = readFileSync(join(HERE, "..", "..", "kit", "tube.mjs"), "utf8").replace(/^import .*$/gm, "").replace(/^export /gm, "");
const tubeScript = `const TUBE = (() => {${tubeSource}\nreturn { tubePieces, tubeSvg };})();\n`;
const routesScript = readFileSync(join(HERE, "routes.mjs"), "utf8").replace(/^export /gm, "");
const LIVE = readFileSync(join(HERE, "live.js"), "utf8").replace("__DATA__", JSON.stringify(DATA));

const faultButtons = FAULTS.map((f) => `<button type="button" class="sb-fault" data-fault="${f.id}"><span class="sb-num">${f.key}</span>${f.name}</button>`).join("");
const speeds = [1, 4, 12, 30].map((v) => `<option value="${v}"${v === SPEED ? " selected" : ""}>×${v}</option>`).join("");
const controls = `<div class="sb-transport" role="group" aria-label="File transport">
<button type="button" class="sb-tb" data-rewind title="Rewind to the start (Home)" aria-label="Rewind"><svg viewBox="0 0 12 12" aria-hidden="true"><path d="M2 2v8M10 2 4 6l6 4z"/></svg></button>
<button type="button" class="sb-tb" data-back title="Back 10 s of machine time (←)" aria-label="Back"><svg viewBox="0 0 12 12" aria-hidden="true"><path d="M7 2 3 6l4 4zM11 2 7 6l4 4z"/></svg></button>
<button type="button" class="sb-tb sb-play" data-run title="Run / pause (space)" aria-label="Run"><span class="sb-lamp" aria-hidden="true"></span><svg class="sb-ico-play" viewBox="0 0 12 12" aria-hidden="true"><path d="M3 2v8l7-4z"/></svg><svg class="sb-ico-pause" viewBox="0 0 12 12" aria-hidden="true"><path d="M3 2v8M9 2v8"/></svg><span data-run-label>Run</span></button>
<button type="button" class="sb-tb" data-fwd title="Forward 10 s of machine time (→)" aria-label="Forward"><svg viewBox="0 0 12 12" aria-hidden="true"><path d="M5 2l4 4-4 4zM1 2l4 4-4 4z"/></svg></button>
<input type="range" class="sb-scrub" data-scrub min="0" max="${PROG.total.toFixed(2)}" step="0.1" value="0" aria-label="Position in the cutting file">
<span class="sb-time" data-time>0:00 / ${Math.floor(PROG.total / 60)}:${String(Math.round(PROG.total % 60)).padStart(2, "0")}</span>
<label class="sb-speed">clock <select data-speed aria-label="Clock speed">${speeds}</select></label>
<button type="button" class="sb-tb sb-tour" data-tour title="Automatic tour of the file and the faults" aria-pressed="false">tour</button>
</div>`;
const caption = `ShopBot PRSalpha 144-60, viewed from the operator’s corner. Catalogue reference movement area ${Math.round(MACHINE.travel.x)} × ${Math.round(MACHINE.travel.y)} × ${MACHINE.travel.z} cm (153 × 61 × 8 in). Two closed-loop alphaStep motors, one on each tapered end plate, pull the gantry along racks on the outside of the aluminium table sides through ${MACHINE.gearbox}:1 gearboxes and 30-tooth pinions; V-wheels on the inside of the plates ride hardened rails on top of the sides. The YZ car hangs on a top V-rail and a lower V-rail on the beam's front face and is driven by the Y motor through the rack between them; the Z extrusion runs in bearing blocks on the car and is lifted by the Z motor on a rack along its side. One step is 0.01 mm; rapids reach 760 mm/s. The HSD spindle holds a ${MACHINE.toolDia * 10} mm two-flute bit in an ER25 collet at ${MACHINE.rpm} rpm; at ${FEED.xy * 10} mm/s the chipload is ${chipload(FEED.xy).toFixed(2)} mm per tooth. Press Run to cut a 600 × 400 mm profile in two passes and a 300 × 200 mm pocket into an 18 mm plywood sheet (the clock runs ${SPEED}× faster than the machine by default; the transport bar scrubs, steps and changes the clock), or pick a fault to see which part fails, why, and what cures it.`;
const plate = k.plateHtml({
  fig: "Fig 1",
  title: "ShopBot PRSalpha 144-60",
  hint: "",
  readout: "idle",
  keys: [
    { mark: "lit", label: "The cut: the groove the bit leaves in the sheet, live from the toolpath" },
    { mark: "raised", label: "Drive train: V-rails, V-wheels, racks and pinions on all three axes" },
    { mark: "edge", label: "Services: dust hose, cable carriers, Z-zero lead, control box, VFD, pendant and PC" },
  ],
  caption,
  body: `<div class="iso-stage sb-stage" tabindex="0" role="group" aria-label="ShopBot PRSalpha CNC router. Press space to run the cutting file, digits 1 to 9 or S to show a fault mode, Escape to reset.">${svg}<span class="sb-sr" role="status" aria-live="polite" data-status></span></div>${controls}`,
});
const insetPlate = k.plateHtml({
  fig: "Fig 1b",
  title: "At the tool",
  hint: "",
  readout: "",
  caption: `The same moment, ${(INSET.KS / KS).toFixed(0)}× closer, with the brush half of the dust foot pulled off its magnets the way you do to reach the collet. The spindle nose with the foot's collar, the ER25 collet nut and the ${MACHINE.toolDia * 10} mm two-flute bit. The camera is fixed to the spindle, so the sheet's cut slides past underneath; what the bit has already cut is drawn into it, and the part of the bit below the surface disappears into the sheet.`,
  body: `<div class="iso-stage sb-inset" style="--sb-groove:${(MACHINE.toolDia * INSET.KS).toFixed(1)}px" aria-hidden="true">${INSET.svg}</div>`,
});
const faults = `<div class="sb-faults" role="group" aria-label="Fault modes">${faultButtons}</div><div class="sb-note" data-note aria-live="polite"></div>`;
const html = `<style>${CSS}</style><div class="sb-figures">${plate.replace(`<figcaption class="iso-legend">`, `<figcaption class="iso-legend">${faults}`)}${insetPlate}</div>`;

const script = kitScript() + latheScript + tubeScript + routesScript + LIVE;
const page = k.pageHtml({ title: "ShopBot PRSalpha 144-60", theme: THEME, body: html, script, width: 740 });
const name = THEME === "light" ? "shopbot-light.html" : "shopbot.html";
writeFileSync(join(HERE, name), page);
writeFileSync(join(HERE, THEME === "light" ? "fragment-figure-light.html" : "fragment-figure.html"), html);
writeFileSync(join(HERE, "fragment-script.js"), script);
const doc = `<style>${PROSE_CSS}</style><article class="sb-doc">${INTRO}<div class="sb-figure-wrap">${html}</div>${AFTER_FIGURE}${faultsHtml()}${MAINTENANCE}${sourcesHtml()}</article>`;
const docPage = k.pageHtml({ title: "ShopBot PRSalpha 144-60 — anatomy, mechanisms and failure modes", theme: THEME, body: doc, script, width: 740 });
writeFileSync(join(HERE, THEME === "light" ? "shopbot-explainer-light.html" : "shopbot-explainer.html"), docPage);
// ---------------------------------------------------------------- WebGL variant: a full-viewport inspect/operate surface
{
  const GL_CSS = readFileSync(join(HERE, "gl.css"), "utf8");
  const glData = {
    meshes: MESH, layers: LAYER,
    camera: { azimuth: AZIMUTH, elevation: ELEVATION, target: [200, 120, 95], operator: [ORIGIN.x - 40, ORIGIN.y - 20, 90], under: [340, 190, 50] },
    rest: DATA.rest, origin: ORIGIN, machine: MACHINE, safeZ: SAFE_Z, program: PROG, faults: FAULTS, stages: FAULT_STAGES, speed: SPEED, routes: DATA.routes,
    zzero: { ...ZZ, clip: ZCLIP },
    screw: { hit: SCREW_W.hit, safe: SCREW_W.safe, head: SCREWS.head, pathY: machineToWorld(0, 26)[1], path: [machineToWorld(90, 26)[0], machineToWorld(30, 26)[0]] },
  };
  const GL_LIVE = readFileSync(join(HERE, "gl-live.js"), "utf8").replace("__DATA__", JSON.stringify(glData));
  const esc = (t) => String(t).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  const btn = (attrs, label, extra = "") => `<button type="button" ${attrs}${extra}>${label}</button>`;
  const faultList = FAULTS.map((f) => `<li>${btn(`data-fault="${f.id}" aria-pressed="false"`, `<span class="sbx-e">E${f.e ?? f.key}</span><span class="sbx-fname">${esc(f.name)}</span><span class="sbx-fsym">${esc(FAULT_STAGES[f.id].short)}</span>`, ` aria-keyshortcuts="${f.key}"`)}</li>`).join("");
  const presets = [["whole", "Whole machine", "0"], ["gantry", "Gantry", ""], ["tool", "At the tool", "F"], ["operator", "Operator's end", ""], ["under", "Under the table", ""], ["top", "Plan, from above", ""]]
    .map(([id, label, key]) => `<li>${btn(`data-view="${id}" aria-pressed="false"`, `<span>${label}</span>${key ? `<kbd>${key}</kbd>` : ""}`)}</li>`).join("");
  const field = (id, label, min, max, step, unit, numMin = min, numMax = max) => `<div class="sbx-field"><label for="sbx-${id}">${label}</label><input id="sbx-${id}" type="range" data-cam="${id}" min="${min}" max="${max}" step="${step}"><input type="number" data-cam-num="${id}" min="${numMin}" max="${numMax}" step="1" aria-label="${label} value"><span class="sbx-unit">${unit}</span></div>`;
  const speeds = [1, 4, 12, 30].map((v) => `<option value="${v}"${v === SPEED ? " selected" : ""}>×${v}</option>`).join("");
  const total = `${Math.floor(PROG.total / 60)}:${String(Math.round(PROG.total % 60)).padStart(2, "0")}`;
  const ico = (d) => `<svg viewBox="0 0 12 12" aria-hidden="true"><path d="${d}"/></svg>`;
  const glBody = `<div class="sbx" data-drawer="open">
<section class="sbx-view" aria-label="3D viewer">
<div class="sb-gl-stage" tabindex="0" role="application" aria-label="ShopBot PRSalpha CNC router in 3D. Drag or arrow keys to orbit, wheel or plus and minus to zoom, shift-drag or shift-arrows to pan. Space pauses the simulation; use the Run button to start. On the real machine Space stops motion. 1 to 9 and S stage a fault, N and P step through it, Escape closes it."><canvas aria-hidden="true"></canvas><div class="sbx-callouts" data-callouts aria-hidden="true"></div><div class="sb-gl-fallback" hidden>This browser has no WebGL2; use the SVG version of the figure.</div><span class="sb-sr" role="status" aria-live="polite" data-status></span></div>
<header class="sbx-head"><h1>ShopBot PRSalpha 144-60</h1><span class="sbx-meta">Interactive 3D model</span><output class="sbx-readout" data-readout>idle</output></header>
<footer class="sbx-cap"><span class="sbx-cap-n" data-beat>Ready</span><div class="sbx-cap-body"><p class="sbx-cap-text" data-caption></p><p class="sbx-cap-todo" data-todo hidden></p></div><div class="sbx-cap-nav" data-beatnav hidden>${btn(`data-beat-prev aria-label="Previous step" aria-keyshortcuts="P"`, "‹ Prev")}${btn("data-beat-replay", "Replay")}${btn(`data-beat-auto aria-pressed="true" title="Advance through the steps by itself"`, "Auto")}${btn(`data-beat-next aria-label="Next step" aria-keyshortcuts="N"`, "Next ›")}${btn(`data-beat-close aria-keyshortcuts="Escape"`, "Close")}</div></footer>
${btn(`class="sbx-drawer-btn" data-drawer-toggle aria-expanded="true" aria-controls="sbx-inspector"`, "Inspector")}
</section>
<aside class="sbx-inspector" id="sbx-inspector" aria-label="Inspector">
<div class="sbx-tabs" role="tablist">${btn(`role="tab" data-tab="faults" aria-selected="true" aria-controls="sbx-p-faults"`, "Faults")}${btn(`role="tab" data-tab="views" aria-selected="false" aria-controls="sbx-p-views"`, "Views")}${btn(`role="tab" data-tab="job" aria-selected="false" aria-controls="sbx-p-job"`, "Job")}</div>
<section class="sbx-panel" id="sbx-p-faults" role="tabpanel" data-panel="faults">
<p class="sbx-lede">Pick a fault to stage it: the camera walks through what goes wrong, the culprit part turns red, the rest greys out. Keys 1–9 and S.</p>
<ol class="sbx-faults">${faultList}</ol>
<div class="sbx-detail" data-fault-detail aria-live="polite" hidden></div>
</section>
<section class="sbx-panel" id="sbx-p-views" role="tabpanel" data-panel="views" hidden>
<h2 class="sbx-h">Presets</h2><ul class="sbx-presets">${presets}</ul>
<h2 class="sbx-h">Camera</h2>
${field("az", "Azimuth", -180, 180, 0.5, "°")}${field("el", "Elevation", -20, 89, 0.5, "°")}${field("dist", "Distance", 0, 1000, 1, "cm", 12, 3000)}${field("fov", "Field of view", 10, 90, 1, "°")}
<div class="sbx-seg" role="group" aria-label="Projection">${btn(`data-proj="persp" aria-pressed="true"`, "Perspective")}${btn(`data-proj="ortho" aria-pressed="false" aria-keyshortcuts="O"`, "Orthographic")}</div>
<div class="sbx-seg" role="group" aria-label="Theme">${btn(`data-theme-set="dark" aria-pressed="${THEME === "dark"}"`, "Dark")}${btn(`data-theme-set="light" aria-pressed="${THEME === "light"}"`, "Light")}</div>
<div class="sbx-seg" role="group" aria-label="Options">${btn(`data-follow aria-pressed="false"`, "Follow tool")}${btn(`data-foot aria-pressed="false"`, "Dust foot off")}</div>
<h2 class="sbx-h">Saved views</h2>
<div class="sbx-seg">${btn("data-save-view", "Save view")}${btn("data-copy-link", "Copy link")}</div>
<input class="sbx-link" data-link readonly aria-label="Link to this view">
<ol class="sbx-saved" data-saved></ol>
<h2 class="sbx-h">Keys</h2>
<dl class="sbx-keys"><dt>← →</dt><dd>orbit</dd><dt>↑ ↓</dt><dd>tilt</dd><dt>Shift + arrows</dt><dd>pan</dd><dt>+ −</dt><dd>zoom</dd><dt>O</dt><dd>orthographic</dd><dt>0 · F</dt><dd>whole · tool</dd><dt>1–9 · S</dt><dd>stage a fault</dd></dl>
</section>
<section class="sbx-panel" id="sbx-p-job" role="tabpanel" data-panel="job" hidden>
<h2 class="sbx-h">File</h2>
<p class="sbx-lede">A two-pass 600 × 400 mm profile, then a 300 × 200 mm pocket, in 18 mm plywood. ${MACHINE.toolDia * 10} mm two-flute bit at ${MACHINE.rpm} rpm and ${FEED.xy * 10} mm/s (${chipload(FEED.xy).toFixed(2)} mm per tooth).</p>
<div class="sbx-transport" role="group" aria-label="File transport">
${btn(`data-rewind title="Rewind (Home)" aria-label="Rewind"`, ico("M2 2v8M10 2 4 6l6 4z"))}${btn(`data-back title="Back 10 s ([)" aria-label="Back 10 seconds"`, ico("M7 2 3 6l4 4zM11 2 7 6l4 4z"))}${btn(`class="sbx-run" data-run aria-pressed="false" title="Play / pause simulation (Space pauses only)"`, `${ico("M3 2v8l7-4z")}<span data-run-label>Run</span>`)}${btn(`data-fwd title="Forward 10 s (])" aria-label="Forward 10 seconds"`, ico("M5 2l4 4-4 4zM1 2l4 4-4 4z"))}
</div>
<div class="sbx-scrub"><input type="range" data-scrub min="0" max="${PROG.total.toFixed(2)}" step="0.1" value="0" aria-label="Position in the cutting file"><span class="sbx-num" data-time>0:00 / ${total}</span></div>
<div class="sbx-field sbx-field-2"><label for="sbx-speed">Clock</label><select id="sbx-speed" data-speed>${speeds}</select><span class="sbx-unit">machine time</span></div>
<div class="sbx-seg">${btn(`data-tour aria-pressed="false" aria-keyshortcuts="T"`, "Tour the file and every fault")}</div>
<h2 class="sbx-h">Keys</h2>
<dl class="sbx-keys"><dt>Space</dt><dd>pause only</dd><dt>Home</dt><dd>rewind</dd><dt>[ ]</dt><dd>±10 s</dd><dt>, .</dt><dd>±1 s</dd><dt>Esc</dt><dd>reset</dd></dl>
<p class="sbx-fine">Catalogue reference movement area ${Math.round(MACHINE.travel.x)} × ${Math.round(MACHINE.travel.y)} × ${MACHINE.travel.z} cm. The pendant carries Reset · Start · E-stop.</p>
</section>
</aside>
</div>`;
  const glPage = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>ShopBot PRSalpha 144-60 — 3D</title><style>${k.ISO_CSS}${GL_CSS}</style></head><body class="iso sbx-body" data-theme="${THEME}">${glBody}<script type="module">${(latheScript + routesScript + GL_LIVE).replace(/<\/(script)/gi, "<\\/$1")}</script></body></html>`;
  writeFileSync(join(HERE, THEME === "light" ? "shopbot-3d-light.html" : "shopbot-3d.html"), glPage);
  console.log("wrote 3d", `${(glPage.length / 1024).toFixed(0)} KB`, `${MESH.length} meshes`);
}
console.log("wrote", name, `${(page.length / 1024).toFixed(0)} KB`, `${R.items.length} items`, `scale ${KS.toFixed(3)}`, `${R.solids.length} solids`, `az ${AZIMUTH} el ${ELEVATION}`);

A.auditOrExit(R, P, {});
