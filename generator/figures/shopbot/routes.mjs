// Routes rebuilt live as the gantry (gx = beam centre, world x), the car (cy = car centre, world y) and the
// Z extrusion (dz, cm above rest) move. Pure: inlined into the page as-is.

// X cable carrier: fixed end at the middle of the trough on the front side; the chain lies in the trough
// toward the gantry, turns up through a half circle and runs back to the upper X bracket on the near end plate.
export function xChainRoute(g, gx) {
  const { troughY, troughZ, fixedX, bracketZ, r } = g.xchain;
  const dir = gx >= fixedX ? 1 : -1;
  const bend = gx + dir * r;
  const pts = [[fixedX, troughY, troughZ]];
  if (Math.abs(bend - fixedX) > 2) pts.push([bend - dir * 1, troughY, troughZ]);
  for (let i = 0; i <= 8; i++) {
    const a = (i / 8) * Math.PI;
    pts.push([bend + dir * r * Math.sin(a), troughY, troughZ + r - r * Math.cos(a)]);
  }
  pts.push([gx, troughY, troughZ + 2 * r]);
  pts.push([gx - dir * 0.01, troughY, bracketZ]);
  return pts;
}

// Y cable carrier: fixed end on the beam top at the far end; chain lies on the beam top toward the car, turns up
// and comes back to the bracket on the car top.
export function yChainRoute(g, cy) {
  const { x, fixedY, topZ, r, carY } = g.ychain;
  const end = cy + carY; // bracket on the car
  const bend = end - r; // the car is always on the +y side of the fixed end
  const pts = [[x, fixedY, topZ], [x, bend - 1, topZ]];
  for (let i = 0; i <= 8; i++) {
    const a = (i / 8) * Math.PI;
    pts.push([x, bend + r * Math.sin(a), topZ + r - r * Math.cos(a)]);
  }
  pts.push([x, end, topZ + 2 * r]);
  return pts;
}

// Dust hose, part 1: dust foot port -> up the +y side of the spindle -> the hose bracket ring on top of the Z extrusion.
// Coordinates relative to the gantry group (the group carries gx); cy and dz are applied here.
export function hoseFootRoute(g, cy, dz) {
  const { portAt, portDir, bracketAt } = g.hose;
  const p0 = [portAt[0], portAt[1] + cy, portAt[2] + dz];
  const p1 = [p0[0] + portDir[0] * 6, p0[1] + portDir[1] * 6, p0[2] + portDir[2] * 6];
  const b = [bracketAt[0], bracketAt[1] + cy, bracketAt[2] + dz];
  return [p0, p1, [b[0], b[1] - 1, (p1[2] + b[2]) / 2], [b[0], b[1], b[2] - 8], b];
}

// Dust hose, part 2: from the bracket ring up to the boom tip (fixed in the world), hanging in a loop.
export function hoseBoomRoute(g, gx, cy, dz) {
  const { bracketAt } = g.hose;
  const b = [gx + bracketAt[0], bracketAt[1] + cy, bracketAt[2] + dz];
  const tip = g.boomTip;
  const span = Math.hypot(tip[0] - b[0], tip[1] - b[1]);
  const slack = Math.max(0, g.hoseLength - span - Math.abs(tip[2] - b[2]));
  const mid = [(b[0] + tip[0]) / 2, (b[1] + tip[1]) / 2, Math.min(b[2], tip[2]) + 10 - slack * 0.45];
  return [b, [b[0], b[1], b[2] + 8], mid, [tip[0], tip[1], tip[2] - 6], tip];
}
