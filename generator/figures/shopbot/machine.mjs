// Shared truth for the ShopBot PRSalpha 144-60 figure. World units are centimetres, z up.
// World axes: machine X runs along -world x (machine X = 0 at the +x end, nearest the viewer), machine Y runs
// along -world y (Y = 0 at the front side, nearest the viewer). Sources: research/prsalpha.md.

export const MACHINE = {
  name: "ShopBot PRSalpha 144-60",
  travel: { x: 388.6, y: 155, z: 20.3 }, // 153 x 61 x 8 in movement area, 2023 spec sheet
  rapid: { xy: 76.2, z: 38.1 }, // 1800 in/min XY, 900 in/min Z
  stepsPerCm: 977.5, // 2482.8 steps/in with 30-tooth pinions through 7.2:1 alphaStep gearboxes
  gearbox: 7.2,
  rpm: 12000,
  flutes: 2,
  toolDia: 0.6, // 6 mm compression bit, ER25 collet
};

// Table geometry that the toolpath needs
export const TABLE = { x0: 0, x1: 419, farOuter: 20, nearOuter: 217.6, sideW: 10, deckTop: 90 }; // 165 in footprint; 77-13/16 in rail spacing
export const ORIGIN = { x: TABLE.x1 - 14, y: TABLE.nearOuter - TABLE.sideW - 11 }; // machine (0,0) in world cm
export const DECK_TOP = TABLE.deckTop;
export const STOCK = { w: 244, d: 122, t: 1.8 }; // 2440 x 1220 x 18 plywood, corner at machine (2, 2)
export const STOCK_AT = { x: 2, y: 2 }; // machine cm
export const STOCK_TOP = DECK_TOP + STOCK.t;
export const machineToWorld = (mx, my) => [ORIGIN.x - mx, ORIGIN.y - my];

export const FEED = { xy: 6.0, z: 2.0 }; // MS 60 mm/s, 20 mm/s plunge
export const SAFE_Z = 1.5;
export const PARK = { x: 150, y: 70 }; // where the gantry waits between files (machine cm)
export const SPEED = 12; // figure seconds run this many times faster than machine seconds

// A posted job: two-pass profile of a 60 x 40 rectangle, then a pocket, then park.
export function program() {
  const segs = [];
  let at = [PARK.x, PARK.y, SAFE_Z];
  const go = (x, y, z, speed, cut) => {
    const d = Math.hypot(x - at[0], y - at[1], z - at[2]);
    segs.push({ from: at, to: [x, y, z], speed, cut, t0: 0, t1: 0, length: d });
    at = [x, y, z];
  };
  const rapid = (x, y) => go(x, y, SAFE_Z, MACHINE.rapid.xy, false);
  const plunge = (z) => go(at[0], at[1], z, FEED.z, true);
  const lift = () => go(at[0], at[1], SAFE_Z, MACHINE.rapid.z, false);
  const feed = (x, y) => go(x, y, at[2], FEED.xy, true);
  const R = { x0: 30, y0: 26, x1: 90, y1: 66 };
  rapid(R.x0, R.y0);
  for (const z of [-0.9, -1.8]) {
    plunge(z);
    feed(R.x1, R.y0);
    feed(R.x1, R.y1);
    feed(R.x0, R.y1);
    feed(R.x0, R.y0);
  }
  lift();
  const K = { x0: 120, y0: 36, x1: 150, y1: 56 };
  rapid(K.x0 + 0.3, K.y0 + 0.3);
  plunge(-0.6);
  let y = K.y0 + 0.3;
  let dir = 1;
  while (y <= K.y1 - 0.3 + 1e-6) {
    feed(dir > 0 ? K.x1 - 0.3 : K.x0 + 0.3, y);
    y += 0.45; // 6 mm bit, 4.5 mm stepover: the passes overlap, no ridges left
    if (y <= K.y1 - 0.3 + 1e-6) feed(at[0], y);
    dir = -dir;
  }
  feed(K.x0 + 0.3, K.y1 - 0.3);
  feed(K.x0 + 0.3, K.y0 + 0.3);
  lift();
  rapid(PARK.x, PARK.y);
  let t = 0;
  for (const s of segs) {
    s.t0 = t;
    t += s.length / s.speed;
    s.t1 = t;
  }
  return { segs, total: t };
}

// Hold-down screws for the "bit hits a screw" fault (machine cm). Pan/Torx heads, 8 mm across, driven through the waste
// into the spoilboard. "hit" sits on the first profile pass (machine Y 26, X 30 -> 90) so the real toolpath runs into it;
// "safe" is where it belonged, in the waste well clear of every path. build.mjs checks the intersection at build time.
export const SCREWS = { hit: { x: 60, y: 25.7 }, safe: { x: 60, y: 20 }, head: { r: 0.4, h: 0.3 }, shank: { r: 0.2, depth: 2.6 } };

export const chipload = (feedCmS, rpm = MACHINE.rpm, flutes = MACHINE.flutes) => (feedCmS * 10 * 60) / (rpm * flutes); // mm per tooth

export const FAULTS = [
  {
    id: "alpha", key: "1", e: "01", name: "Alpha fault",
    parts: ["xmotor.near", "xmotor.far", "endplate.near", "endplate.far", "box.led"],
    symptom: "Everything stops dead mid-cut; the red fault LED on the control box lights and the software reports an alpha alarm.",
    cause: "A closed-loop alphaStep motor was pushed past what its correction could hold: an obstruction, a clamp struck at speed, chips packed into the rack, or a damaged motor cable. (At 1.8° of lag the driver starts correcting; the alarm comes when correction fails.)",
    cure: "Stop and call staff; do not open the cabinet. Staff check the driver and clear the cause. Reset, re-home (C3) and re-zero after recovery; position is lost.",
  },
  {
    id: "zzero", key: "2", e: "05", name: "Z-zero not sensed",
    parts: ["zplate", "zclip", "zlead"],
    symptom: "C2 drives the bit down onto the plate without stopping, or refuses to start because input 1 is already on.",
    cause: "The circuit never closes: the lead broken inside its coil or at the clip, the clip knocked off the carriage plate or biting paint or dust instead of bare aluminium, a dirty plate or bit, or an open connector; or Safe-Z pull-up set to 0 so the routine halts after the first touch.",
    cure: "Clip stays clamped on bare aluminium of the carriage plate (circuit: plate → spindle → collet → bit), plate under the bit; before every C2 touch the plate to the bit and watch input 1 light and clear; clean contacts, check the lead; keep a positive safe pull-up. Store the plate and clip in their holder on the car.",
  },
  {
    id: "prox", key: "3", e: "04", name: "Homing switch missed",
    parts: ["prox.x", "prox.y"],
    symptom: "During C3 the gantry runs into the hard stop, or a limit trips mid-job and the cut stops.",
    cause: "Inductive switch misaligned to its metal target, input 2/3 polarity misconfigured, a bad switch or cable, or a failed input channel.",
    cure: "Test the switch with a metal target and watch inputs 2 and 3; fix alignment or the fault rather than disabling limits.",
  },
  {
    id: "rpm", key: "4", e: "07", name: "Spindle off / wrong RPM",
    parts: ["vfd", "spindle"],
    symptom: "A still bit is dragged through the sheet and snaps, or the cut burns at 12000 rpm when 8000 was typed.",
    cause: "Interlock key off, pendant Start not pressed at the “Press START on control before pressing OK” prompt, RPM typed in the TR window without Enter, the RPM window closed, or the VFD left in LOCAL.",
    cure: "Key on, output 1 on, pendant Start before OK; type the RPM and press Enter, confirm the VFD readout, listen before the bit enters the stock.",
  },
  {
    id: "collet", key: "5", e: "10", name: "Bit slips in collet",
    parts: ["collet", "tool"],
    symptom: "The cut gets deeper pass by pass; eventually the bit pulls out or breaks through the spoilboard.",
    cause: "Dirty or worn ER25 collet, nut not snapped onto the collet before the bit, wrong torque for the nut, a 1/4 in bit in a 6 mm collet, or too much stick-out; the motor encoder cannot see a bit sliding in its collet.",
    cure: "Clean taper, collet and nut; snap collet into nut first; match shank size; use the tightening method for the standard ER25 nut supplied for this HSD spindle; replace collets after 400–700 h or any crash; re-zero Z.",
  },
  {
    id: "holddown", key: "6", e: "22", name: "Part lifts off",
    parts: ["clamp", "stock.part"],
    symptom: "On the final pass the cut-out piece rises, catches the bit and is flung off the table; the bit breaks.",
    cause: "Nothing holds the part once the profile closes: no tabs or onion skin, no screws in the part, clamps only at the sheet edge, or bowed stock springing up as it is freed.",
    cure: "Leave tabs or a 0.25–0.75 mm onion skin; screw the part and the waste into the spoilboard (screws in planned safe zones); shim bowed stock flat under the clamps; cut through on the last pass only; never reach for a loose part while the tool moves.",
  },
  {
    id: "rack", key: "7", e: "16", name: "Rack dust / backlash",
    parts: ["xrack.near", "xrack.far", "pinion"],
    symptom: "Position creeps a few steps every pass; the second profile pass is offset from the first.",
    cause: "Chips packed in the rack teeth, a worn pinion, a loose pinion set screw, or a spring-loaded motor mount that has lost tension so the pinion skips.",
    cure: "Brush racks and pinions clean every 40 h, then a small blob of light grease every 150 mm and run the axes; check push-pull play, set screws and spring tension; replace pinions on schedule.",
  },
  {
    id: "usb", key: "8", e: "02", name: "USB lost",
    parts: ["pc", "cable.usb"],
    symptom: "The software freezes or reports a USB failure; the gantry stops dead mid-cut but the spindle keeps running.",
    cause: "PC power settings putting the PC or its USB port to sleep mid-file (sleep, screen saver, USB selective suspend); a loose or over-long USB cable (over 3 m, extensions, hubs); electrical noise (EMI) from the spindle, VFD or nearby equipment.",
    cure: "Dedicated PC with sleep, screen saver and USB selective suspend off; a short, direct, seated USB cable (under 3 m, no hub, ferrite), routed away from the spindle and VFD leads; on a dropout hit E-stop, then re-home and re-zero.",
  },
  {
    id: "clampstrike", key: "9", e: "21", name: "Clamp strike",
    parts: ["clamp", "tool"],
    symptom: "A rapid move at safe Z drags the bit into a clamp; an alpha fault or a broken bit follows.",
    cause: "CAM clearance height (15 mm here) is below the clamp height, or the Z reference changed between setup and post.",
    cure: "Set clearance above the tallest fixture plus margin, keep screws in planned safe zones, preview the rapid links (SP) before cutting (SM).",
  },
  {
    // Fault IDs match the teaching reference; keyboard shortcuts are independent.
    id: "screw", key: "S", e: "39", name: "Bit hits a hold-down screw",
    parts: ["tool", "collet"],
    symptom: "A loud bang mid-cut with the spindle running; the bit is broken off and a screw head in the waste is chewed up.",
    cause: "A hold-down screw sits on the toolpath (placed by eye, or the toolpath was changed after screwing down), or the CAM clearance height is below the screw heads so a move between cuts runs into one. Carbide is brittle: it shatters on steel.",
    cure: "Spacebar, spindle off, key OFF and removed before reaching in; tell staff; treat the bit and possibly the collet as scrap. Put screws only in planned safe zones of the waste, draw them in CAM and check every toolpath and rapid against them; set the clearance above the tallest screw head and clamp.",
  },
];

// Staged fault sequences for the WebGL viewer. Each beat: camera (az/el in degrees, dist in cm, target in world cm;
// rel "gantry" adds the gantry's X travel, rel "tool" makes target an offset from the bit tip), parts kept in focus
// (everything else greys out), culprit parts (accent), optional ghost groups (true position), x-ray parts, callouts
// anchored to parts or points, and a one-line caption. The motion itself lives in gl-live.js, keyed by fault id and beat.
const GANTRY = ["endplate", "beam", "xmotor", "pinion.x", "shaft.x", "roller.x", "axle.x", "xrack", "xrail", "car.plate", "yrail", "yrack", "ychain"];
const TOOLZONE = ["tool", "collet", "spindle.nose"];
// The operator station seen from the operator's side: control box LEDs, the SB3 screen and the pendant on its tray.
const OPS = { az: 28, el: 17, dist: 270, target: [434, 150, 92] };
const SCREEN_ESTOP = ["screen", "pc.monitor", "pendant", "tray", "box", "led"];
const SCREWZONE = ["screw", "stock", ...TOOLZONE];
const IMPACT = [345.33, 170.75, 92.0]; // world cm: where the bit meets the head of screw.1 (see SCREWS)
export const FAULT_STAGES = {
  alpha: {
    short: "Stops dead mid-cut; the driver LED turns red.",
    todo: "Stop and call staff. Staff read the driver code and clear the cause; students do not open the cabinet. After recovery: Reset, C3, re-zero.",
    beats: [
      { cam: { az: 38, el: 30, dist: 560, target: [0, 118, 100], rel: "gantry" }, focus: GANTRY, culprit: [], caption: "Mid-cut, one closed-loop X motor on each end plate pulls the gantry along its rack. The two must stay in step." },
      { hide: ["hose", "endplate.far", "xmotor.far.mount"], cam: { az: -22, el: 16, dist: 38, target: [0, 18, 88], rel: "gantry" }, focus: ["xmotor.far", "pinion.x.far", "shaft.x.far", "xrack.far", "endplate.far", "roller.x.far"], culprit: ["pinion.x.far"], caption: "Chips packed in the far rack: the far pinion rides up out of the teeth and skips. (End plate removed to show it.)", callouts: [{ part: "pinion.x.far", at: "top", text: "Far pinion · skipping teeth" }] },
      { hide: ["hose"], cam: { az: 0, el: 76, dist: 470, target: [-40, 118, 105], rel: "gantry" }, focus: GANTRY, culprit: ["endplate.far", "xmotor.far", "pinion.x.far"], ghost: ["gantry", "gantryFar", "motorFar", "motorNear", "car", "zaxis", "tool"], caption: "The driver sees the lag only after 1.8°: the far end plate trails and the bridge racks out of square. Green is where it should be.", callouts: [{ part: "endplate.far", at: "top", text: "Far end trails {lag} mm (drawn ×20)" }, { part: "endplate.near", at: "top", text: "Near end · on position" }] },
      { cam: OPS, focus: SCREEN_ESTOP, culprit: ["led.fault", "screen.in4"], caption: "Correction fails: the driver trips, its LED turns red, input 4 turns red on the screen and every axis stops where it is.", callouts: [{ part: "led.fault", text: "Driver fault LED" }, { part: "screen.in4", text: "Input 4 · red" }, { part: "pendant.reset", text: "Reset · after the cause is cleared" }] },
    ],
  },
  zzero: {
    short: "C2 drives the bit into the plate.",
    todo: "Hit E-stop. Check the clip is still clamped on the carriage plate, plate under the bit; touch the plate to the bit and watch input 1 light before C2; clean the contacts, check the lead, keep a positive safe pull-up.",
    beats: [
      { foot: false, cam: { az: 34, el: 12, dist: 64, target: [392, 190, 100] }, focus: ["zplate", "zclip", "zlead", "spindle", ...TOOLZONE], culprit: [], caption: "The clip stays clamped on the carriage plate (plate → spindle → collet → bit); Z-zero plate under the bit; input 1 must light on contact.", callouts: [{ part: "zclip", text: "Ground clip · carriage plate" }, { part: "zplate", text: "Z-zero plate · under the bit" }] },
      { foot: false, cam: { az: 30, el: 8, dist: 54, target: [392, 190, 98] }, focus: ["zplate", "zclip", "zlead", "spindle", ...TOOLZONE], culprit: ["zlead"], caption: "C2 brings the bit down and it touches the plate — but the lead is broken inside its coil: the circuit stays open.", callouts: [{ tip: true, text: "Touching · input 1 dark" }, { point: [396.5, 193.5, 92.3], text: "Lead · open inside the coil" }] },
      { foot: false, cam: { az: 22, el: 25, dist: 66, target: [392, 189, 96.5] }, focus: ["zplate", "zclip", "zlead", "spindle", "shatter", ...TOOLZONE], culprit: ["tool"], caption: "No contact signal: Z keeps pushing. The brittle cutter shatters and throws sharp fragments before the plate visibly bends. Illustrative slow motion; spindle off.", callouts: [{ part: "tool.stub", at: "bottom", text: "{fracture}" }, { part: "zplate", at: "top", text: "Plate still flat · input 1 stayed dark" }] },
      { cam: OPS, focus: SCREEN_ESTOP, culprit: ["screen.in1", "pendant.estop"], caption: "Input 1 never lit on the screen. The bit has shattered. E-stop, wait for all movement to stop and call staff; inspect and replace the cutter before re-zeroing.", callouts: [{ part: "screen.in1", text: "Input 1 · never lit" }, { part: "pendant.estop", text: "E-stop" }, { part: "screen.in4", text: "Input 4 · E-stop" }] },
    ],
  },
  prox: {
    short: "C3 runs the gantry into the hard stop.",
    todo: "Hold a metal target to the switch and watch inputs 2 and 3 on the screen; align the switch to its target or replace it — never disable the limits.",
    beats: [
      { hide: ["xchain"], cam: { az: 64, el: 34, dist: 150, target: [385, 216, 84] }, focus: ["prox", "endplate.near", "xrack.near", "xrail.near", "stand.endcap.near", "side.near"], culprit: [], caption: "C3 homing: the gantry runs toward X 0 until the target on its end plate passes the proximity switch.", callouts: [{ part: "prox.x", text: "X proximity switch" }, { part: "prox.x.target", text: "Target" }] },
      { hide: ["xchain"], cam: { az: 14, el: 42, dist: 58, target: [400, 218, 91] }, focus: ["prox", "endplate.near", "xrack.near", "xrail.near"], culprit: ["prox.x"], caption: "The target sweeps right over the switch — misaligned, the switch never changes state and inputs 2 and 3 stay as they were.", callouts: [{ part: "prox.x", text: "Prox switch · no change" }] },
      { hide: ["xchain"], cam: { az: 52, el: 44, dist: 80, target: [409, 214, 91] }, focus: ["prox", "endplate.near", "stand.endcap.near", "xrail.near", "xrack.near", "side.near"], culprit: ["endplate.near", "stand.endcap.near"], caption: "With no signal the gantry overruns the switch and slams into the hard stop at the end of the rail.", callouts: [{ point: [417, 212.5, 96.5], text: "Hard stop" }] },
      { cam: OPS, focus: SCREEN_ESTOP, culprit: ["led.fault", "screen.in2", "screen.in3"], caption: "The motors stall against the stop and the driver trips. Inputs 2 and 3 never changed; the position the software shows is now wrong.", callouts: [{ part: "led.fault", text: "Driver fault LED" }, { part: "screen.in3", text: "Inputs 2 · 3 · prox switches" }] },
    ],
  },
  rpm: {
    short: "A still bit is dragged through the sheet.",
    todo: "Key on, output 1 on, pendant Start before you click OK; type the RPM and press Enter, check the VFD reads it, listen before the bit enters the stock.",
    beats: [
      { cam: { az: 64, el: 9, dist: 440, target: [362, 186, 72] }, focus: ["vfd", "spindle", "pendant", "tray", "box", ...TOOLZONE], culprit: ["vfd", "pendant.start"], caption: "Start on the pendant was pressed after OK, so output 1 never switched the spindle on. The VFD reads 0 Hz.", callouts: [{ part: "vfd", text: "VFD · 0 Hz" }, { part: "spindle", at: "top", text: "Spindle · 0 rpm" }, { part: "pendant.start", text: "Start · pressed too late" }] },
      { foot: false, xray: ["stock"], cam: { az: 62, el: 8, dist: 42, target: [0, 0, 1], rel: "tool" }, focus: ["stock", ...TOOLZONE], culprit: ["tool"], caption: "The file runs anyway: the still bit plunges into the sheet at 20 mm/s.", callouts: [{ tip: true, text: "Bit · 0 rpm" }] },
      { foot: false, xray: ["stock"], cam: { az: 96, el: 8, dist: 40, target: [0, 0, 1.5], rel: "tool" }, focus: ["stock", ...TOOLZONE], culprit: ["tool"], caption: "Feeding sideways, a bit that isn't turning cannot cut: it drags and bends.", callouts: [{ tip: true, text: "Bent {bend}°" }] },
      { foot: false, xray: ["stock"], cam: { az: 96, el: 10, dist: 44, target: [0, 0, 1.5], rel: "tool" }, focus: ["stock", ...TOOLZONE], culprit: ["tool"], caption: "…and snaps.", callouts: [{ part: "tool.stub", at: "bottom", text: "Broken bit" }] },
    ],
  },
  collet: {
    short: "Each pass cuts deeper than the last.",
    todo: "Clean taper, collet and nut; snap the collet into the nut first; match the shank size; torque the nut; replace collets after 400–700 h or any crash; re-zero Z.",
    beats: [
      { foot: false, xray: ["stock", "collet", "spindle.nose"], cam: { az: 80, el: 4, dist: 22, target: [-4, 0, 3.6], rel: "spindle" }, focus: ["stock", "deck", "tick", "floor", ...TOOLZONE], culprit: [], caption: "Pass 1, 9 mm deep. Only the friction of the ER25 collet holds the bit. A tick on the nut lines up with a tick on the shank.", callouts: [{ part: "tick.nut", text: "Fixed tick · on the nut" }, { part: "tick.shank", at: "bottom", text: "Shank tick · slipped {slip} mm" }] },
      { foot: false, xray: ["stock", "collet", "spindle.nose"], ghost: ["tool"], ghostThrough: true, cam: { az: 80, el: 4, dist: 22, target: [-4, 0, 3.6], rel: "spindle" }, focus: ["stock", "deck", "tick", "floor", ...TOOLZONE], culprit: ["tool", "collet"], caption: "Pass 2, 18 mm deep, twice the load: the whole bit — shank top and all — creeps down out of the nut. Green is where it should be.", callouts: [{ part: "tick.nut", text: "Fixed tick" }, { part: "tick.shank", at: "bottom", text: "Slipped {slip} mm of 2.5 (drawn ×4)" }] },
      { foot: false, xray: ["stock", "deck", "collet", "spindle.nose"], ghost: ["tool"], ghostThrough: true, cam: { az: 80, el: 4, dist: 24, target: [-4, 0, 3.2], rel: "spindle" }, focus: ["stock", "deck", "tick", "floor", ...TOOLZONE], culprit: ["tool", "collet"], caption: "Pass by pass it keeps sliding. The encoders notice nothing: every motor is exactly where it should be. Only the bit has moved.", callouts: [{ part: "tick.shank", at: "bottom", text: "Slipped {slip} mm of 2.5 (drawn ×4)" }, { tip: true, text: "Depth {depth} mm · programmed {prog}" }] },
      { foot: false, xray: ["stock", "deck", "collet", "spindle.nose"], ghost: ["tool"], ghostThrough: true, cam: { az: 90, el: 3, dist: 62, target: [12, 0, 1.2], rel: "spindle" }, focus: ["stock", "deck", "tick", "floor", ...TOOLZONE], culprit: ["floor", "tool"], caption: "Cut open: the floor of the groove steps deeper with every pass, toward the spoilboard. The extra depth is drawn ×4.", callouts: [{ point: [372, 130.6, 90.9], text: "Pass 1 · 9.0 mm" }, { point: [355, 130.6, 89.35], text: "Passes 2–3 · 18 → {depth} mm · programmed 18.0" }] },
    ],
  },
  holddown: {
    short: "The cut-out part is flung off the table.",
    todo: "Leave tabs or a 0.25–0.75 mm onion skin, screw the part and the waste into the spoilboard, shim bowed stock, cut through on the last pass only. Never reach for a loose part while the tool moves.",
    beats: [
      { cam: { az: -62, el: 30, dist: 190, target: [345, 150, 92] }, focus: ["stock", "kerf", "clamp", ...TOOLZONE], culprit: ["stock.part"], caption: "Final pass, cutting through. The clamps hold the edges of the sheet — nothing holds the part itself: no tabs, no screws.", callouts: [{ part: "stock.part", at: "top", text: "Part · nothing holds it" }, { part: "clamp.3.knob", at: "top", text: "Clamps · sheet edge only" }] },
      { cam: { az: -55, el: 22, dist: 200, target: [342, 148, 95] }, focus: ["stock", "kerf", ...TOOLZONE], culprit: ["stock.part"], caption: "The freed part lifts along the edge nearest the bit.", callouts: [{ part: "stock.part", at: "top", text: "Lifted {lift} mm" }] },
      { foot: false, cam: { az: -50, el: 20, dist: 190, target: [335, 145, 96] }, focus: ["stock", "kerf", ...TOOLZONE], culprit: ["stock.part", "tool"], caption: "Its edge catches the bit: the part kicks up and spins on the cutter.", callouts: [{ tip: true, text: "Edge caught on the bit" }, { part: "kerf", at: "top", text: "Where it was" }] },
      { foot: false, cam: { az: 12, el: 12, dist: 470, target: [334, 200, 84] }, focus: ["stock", "kerf", ...TOOLZONE], culprit: ["stock.part", "tool"], caption: "Flung off the table in a fraction of a second — and the bit snaps. Never reach for a loose part while the tool moves.", callouts: [{ part: "stock.part", at: "top", text: "Thrown clear of the table" }, { part: "tool.stub", at: "bottom", text: "Broken bit" }] },
    ],
  },
  rack: {
    short: "Pass 2 lands offset from pass 1.",
    todo: "Brush racks and pinions clean every 40 h, a small blob of light grease every 150 mm; check push-pull play, set screws and motor-mount spring tension; replace worn pinions.",
    beats: [
      { cam: { az: 76, el: 24, dist: 62, target: [282, 218, 87] }, focus: ["xrack.near", "pinion.x.near", "xmotor.near", "shaft.x.near", "chip", "endplate.near"], culprit: ["chip"], caption: "Chips packed between the teeth of the near rack.", callouts: [{ part: "chip", text: "Chips in the rack" }] },
      { ghost: ["gantry", "gantryFar", "motorFar", "motorNear", "car", "zaxis", "tool"], cam: { az: 62, el: 26, dist: 190, target: [0, 190, 96], rel: "gantry" }, focus: ["xrack.near", "pinion.x.near", "xmotor.near", "chip", ...GANTRY, ...TOOLZONE], culprit: ["pinion.x.near"], caption: "Each time the pinion rides over a chip it skips a few steps; the gantry falls a little short. Green is the commanded position.", callouts: [{ part: "pinion.x.near", at: "top", text: "Pinion skips" }, { tip: true, text: "Short by {creep} mm so far (drawn ×10)" }] },
      { cam: { az: 90, el: 88, dist: 175, target: [342, 151, 92] }, focus: ["passes", "stock"], culprit: ["passes.bad"], caption: "The second pass (red) lands offset from the first (dark): the error accumulates with every move.", callouts: [{ point: [315.4, 140, 92], text: "Pass 1" }, { point: [309.4, 162, 92], at: "l", text: "Pass 2 · {offset} mm off (drawn ×10)" }] },
      { cam: { az: 90, el: 88, dist: 175, target: [342, 151, 92] }, focus: ["passes", "stock"], culprit: ["passes.bad"], caption: "The part comes out stepped and undersize; the machine still believes it is in the right place.", callouts: [{ point: [368.6, 172.2, 92], text: "Stepped edge" }] },
    ],
  },
  usb: {
    short: "File freezes; the spindle keeps turning.",
    todo: "E-stop first. Then: dedicated PC with sleep, screen saver and USB selective suspend off; a short, direct, seated USB cable under 3 m, away from the spindle and VFD leads; re-home and re-zero after any dropout.",
    beats: [
      { cam: { az: 34, el: 20, dist: 420, target: [400, 150, 85] }, focus: ["pc", "screen", "cable.usb", "box", "spindle", ...TOOLZONE, ...GANTRY], culprit: [], caption: "The PC streams the file to the control box over USB, one move at a time, while the spindle cuts.", callouts: [{ part: "screen", at: "top", text: "USB · streaming {pct} %" }] },
      { cam: { az: 36, el: 18, dist: 330, target: [400, 140, 98] }, focus: ["pc", "screen", "cable.usb", "box", ...TOOLZONE, ...GANTRY], culprit: ["cable.usb", "screen"], caption: "The PC dozes off, a plug works loose or noise hits the cable: the USB link drops, the screen freezes and the gantry stops dead mid-cut.", callouts: [{ part: "screen", at: "top", text: "Frozen · file stalled at {pct} %" }, { part: "cable.usb", text: "USB link lost" }] },
      { foot: false, cam: { az: 58, el: 12, dist: 52, target: [0, 0, 6], rel: "tool" }, focus: ["spindle", ...TOOLZONE, "stock", "burn"], culprit: ["spindle", "tool", "burn"], caption: "The file has stopped; the spindle has not. E-stop is the only control that still kills it.", callouts: [{ part: "spindle", at: "top", text: "Still 12000 rpm" }, { part: "burn", text: "Burning in one spot" }] },
      { cam: OPS, focus: SCREEN_ESTOP, culprit: ["pendant.estop"], caption: "E-stop on the pendant cuts spindle power at once — the frozen screen cannot. Then re-home: the position is lost.", callouts: [{ part: "pendant.estop", text: "E-stop" }, { part: "screen", at: "top", text: "Still frozen" }] },
    ],
  },
  clampstrike: {
    short: "A rapid drags the bit into a clamp.",
    todo: "Set the CAM clearance above the tallest fixture plus margin, keep screws in planned safe zones, preview the rapid links (SP) before you cut (SM).",
    beats: [
      { foot: false, cam: { az: 66, el: 26, dist: 230, target: [320, 72, 92] }, focus: ["clamp", "stock", ...TOOLZONE], culprit: [], caption: "Between profiles the bit rapids across the sheet at the CAM clearance height: 15 mm above the surface.", callouts: [{ tip: true, text: "Bit tip · 15 mm up" }] },
      { foot: false, cam: { az: 94, el: 3, dist: 62, target: [362, 67, 94] }, focus: ["clamp", ...TOOLZONE], culprit: ["clamp.1"], caption: "Ahead stands a clamp whose knob tops out 48 mm above the sheet — far higher than the bit is lifted.", callouts: [{ part: "clamp.1.knob", at: "top", text: "Clamp knob · 48 mm" }, { tip: true, text: "Bit · 15 mm" }] },
      { foot: false, cam: { az: 100, el: 6, dist: 40, target: [367, 67, 95] }, focus: ["clamp", ...TOOLZONE], culprit: ["clamp.1"], caption: "At 760 mm/s the bit strikes the knob: the clamp is torn sideways and the bit bends.", callouts: [{ point: [368.4, 67.1, 95.4], text: "Impact at 760 mm/s" }] },
      { foot: false, cam: OPS, focus: SCREEN_ESTOP, culprit: ["led.fault", "screen.in4"], caption: "The X motors stall against the clamp; their driver trips an alpha fault, input 4 turns red and everything stops.", callouts: [{ part: "led.fault", text: "Driver fault LED" }, { part: "screen.in4", text: "Input 4 · red" }] },
    ],
  },
  screw: {
    short: "Loud bang: the bit hits a screw and breaks.",
    todo: "Spacebar, spindle off, key OFF; tell staff; the bit and possibly the collet are scrap; re-check every screw position against the toolpaths in CAM before the next run.",
    beats: [
      { foot: false, cam: { az: 58, el: 34, dist: 72, target: [349, 172.5, 92] }, focus: SCREWZONE, culprit: ["screw.1"], caption: "Screws hold the waste down to the spoilboard. A screw gets hit when the CAM clearance height is set below its head, or when it is placed on the toolpath — like this one, on the profile line.", callouts: [{ part: "screw.1.head", at: "top", text: "Screw on the toolpath" }, { part: "screw.2.head", at: "top", text: "Screw in a safe zone" }, { tip: true, text: "Bit cutting · 12000 rpm" }] },
      { foot: false, xray: ["stock"], ghost: ["pathghost"], cam: { az: 66, el: 16, dist: 30, target: [347.2, 170.9, 92.4] }, focus: SCREWZONE, culprit: ["screw.1"], caption: "Spindle running, the bit feeds along the profile at 60 mm/s, straight at the screw head. Green is the toolpath from CAM: it runs right across the screw.", callouts: [{ part: "screw.1.head", at: "top", text: "Culprit · screw head on the path" }, { tip: true, text: "Bit at 12000 rpm · 60 mm/s" }, { point: [350.5, 170.6, 91.86], text: "Toolpath in CAM" }] },
      { foot: false, xray: ["stock"], cam: { az: 62, el: 20, dist: 30, target: [345.6, 170.9, 92.6] }, focus: [...SCREWZONE, "shatter"], culprit: ["screw.1", "tool"], caption: "Impact at full speed: the brittle carbide tip shatters and throws fragments; the screw head is gouged and knocked over. Illustrative slow motion; tilt exaggerated.", callouts: [{ point: IMPACT, text: "BANG · loud as a gunshot" }, { part: "tool.stub", at: "bottom", text: "{fracture}" }, { part: "screw.1.head", at: "top", text: "Head gouged · tilted (exaggerated)" }] },
      { foot: false, cam: { az: 64, el: 20, dist: 40, target: [346.5, 170.6, 92.9] }, focus: [...SCREWZONE, "shatter", "spindle"], culprit: ["screw.1", "tool.stub"], caption: "Aftermath: a broken shank in the collet, a chipped screw and carbide fragments on the sheet. The spindle is still running until you stop it.", callouts: [{ part: "tool.stub", at: "bottom", text: "Broken shank · bit is scrap" }, { part: "screw.1.head", at: "top", text: "Chipped screw" }, { shard: 0, text: "Carbide fragments" }] },
    ],
  },
};
