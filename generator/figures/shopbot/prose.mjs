// Prose of the explainer page. Facts and citation numbers follow research/prsalpha.md; [n] = its source list.
export const PROSE_CSS = `
.sb-doc{color:var(--anatomy-text);font-size:14.5px;line-height:1.65}
.sb-doc h1{font-size:26px;line-height:1.2;letter-spacing:-.01em;color:var(--anatomy-strong);margin:0 0 6px;font-weight:650}
.sb-doc .sb-kicker{font-family:var(--anatomy-mono);font-size:10.5px;letter-spacing:.12em;text-transform:uppercase;color:var(--anatomy-muted);margin-bottom:14px}
.sb-doc h2{font-size:17px;color:var(--anatomy-strong);margin:44px 0 10px;font-weight:600}
.sb-doc h3{font-size:14.5px;color:var(--anatomy-strong);margin:22px 0 6px;font-weight:600}
.sb-doc p{margin:0 0 12px}
.sb-doc ul{margin:0 0 12px;padding-left:18px}
.sb-doc li{margin:0 0 5px}
.sb-doc b{color:var(--anatomy-strong);font-weight:600}
.sb-doc .sb-lead{font-size:15.5px;color:var(--anatomy-strong);margin:0 0 26px}
.sb-doc .sb-cite{font-family:var(--anatomy-mono);font-size:10px;color:var(--anatomy-muted);vertical-align:super;line-height:0}
.sb-doc .sb-table{display:grid;grid-template-columns:max-content 1fr;gap:4px 18px;margin:8px 0 16px;font-size:13.5px}
.sb-doc .sb-table dt{color:var(--anatomy-muted);font-family:var(--anatomy-mono);font-size:11.5px;letter-spacing:.04em;padding-top:2px}
.sb-doc .sb-table dd{margin:0;color:var(--anatomy-text)}
.sb-doc .sb-fault-list{margin:12px 0 0;padding:0;list-style:none;display:grid;gap:10px}
.sb-doc .sb-fault-list li{padding:12px 14px;border-radius:12px;box-shadow:var(--anatomy-lift);background:var(--anatomy-card)}
.sb-doc .sb-fault-list .sb-fid{font-family:var(--anatomy-mono);font-size:10.5px;letter-spacing:.08em;color:var(--anatomy-muted);margin-right:8px}
.sb-doc .sb-fault-list .sb-ftitle{color:var(--anatomy-strong);font-weight:600}
.sb-doc .sb-fault-list .sb-row{display:grid;grid-template-columns:62px 1fr;gap:2px 10px;margin-top:6px;font-size:13.5px}
.sb-doc .sb-fault-list .sb-row span:first-child{font-family:var(--anatomy-mono);font-size:10.5px;letter-spacing:.06em;text-transform:uppercase;color:var(--anatomy-muted);padding-top:3px}
.sb-doc .sb-note-box{padding:12px 14px;border-radius:12px;box-shadow:var(--anatomy-lift);background:var(--anatomy-card);margin:14px 0 18px;font-size:13.5px}
.sb-doc .sb-sources{font-size:12.5px;color:var(--anatomy-muted);line-height:1.5}
.sb-doc .sb-sources li{margin:0 0 3px;overflow-wrap:anywhere}
.sb-doc a{color:var(--anatomy-text);text-decoration-color:var(--anatomy-faint)}
.sb-doc .sb-figure-wrap{margin:24px 0 8px}
@media print{.sb-doc .sb-fault-list li{break-inside:avoid}}
`;

const c = (...n) => `<span class="sb-cite">[${n.join(",")}]</span>`;

export const INTRO = `
<div class="sb-kicker">Anatomy · Fab Lab / University of Iceland · ShopBot PRSalpha 144-60</div>
<h1>The ShopBot PRSalpha 144-60, taken apart</h1>
<p class="sb-lead">A moving-gantry router for 12 × 5 ft sheets. Four closed-loop stepper motors pull a bridge, a car and a Z plate along racks on hardened V-rails; a 3 kW (4 hp) HSD spindle does the cutting; the figure below acts out the ten most common ways it goes wrong. The figure below is a working model: run the file, then press a fault key to see which part fails, why, and what cures it.</p>
`;

export const AFTER_FIGURE = `
<h2>1 · What it is, in numbers</h2>
<p>“144-60” is the nominal sheet class, not the footprint. The 2023 specification sheet lists a <b>153 × 61 × 8 in (3.89 × 1.55 × 0.20 m) movement area</b> and a <b>168 × 91 × 67 in (4.27 × 2.31 × 1.70 m) footprint</b>; the May 2022 assembly guide still describes the conventional <b>6 in (152 mm) Z</b>, with 12 in and 24 in tall-Z options.${c(1, 2)} Which Z this machine has is not something a spec sheet can tell you — measure it.</p>
<dl class="sb-table">
<dt>table</dt><dd>bolted steel legs and supports with aluminium T-slot side extrusions; <b>not</b> a welded one-piece frame. Base layer 3/4 in plywood on 3/8 in carriage bolts, replaceable 3/4 in MDF spoilboard on top.${c(1, 2, 3)}</dd>
<dt>rails</dt><dd>hardened steel <b>V-rails</b> with <b>V-roller</b> bearings on X and Y; eccentric rollers set the preload on the YZ car. Z rides a captured rail on five bearings per side (three concentric, two eccentric).${c(1, 13, 18, 19)}</dd>
<dt>drive</dt><dd><b>rack and pinion on all three axes</b>, including Z. Two X motors (one per side), one Y, one Z. Pinions: 30 teeth on X and Y, 25 on Z. Gearboxes 7.2:1 low-backlash tapered-hob.${c(1, 2, 27)}</dd>
<dt>motors</dt><dd>Oriental Motor <b>alphaStep</b> closed-loop steppers (ASM98AA-T7.2 legacy; ARM98AC-T7.2 / ASM98ACE-T7.2 on later builds; this machine: <b>ARM98AC-T7.2</b>, instructor-confirmed and photographed on the nameplate). Feedback is at the motor shaft — not at the rack, the bit or the workpiece.${c(2, 23, 27)}</dd>
<dt>resolution</dt><dd>2482.8 steps/in on X and Y (0.0004 in ≈ 0.010 mm), 2979.4 steps/in on Z, resolution multiple 5.${c(1, 27)}</dd>
<dt>speed</dt><dd>positioning 1800 in/min (30 in/s, 762 mm/s) XY and 900 in/min Z; up to 720 in/min (12 in/s) XY and 360 in/min Z under full cutting force; about 150 lbf of cutting force at 60 in/min.${c(1)}</dd>
<dt>control</dt><dd>Windows PC → USB → PRSalpha control box (control board, four drivers, contactors) → motors. Files are OpenSBP <code>.sbp</code> text. 8 inputs / 8 outputs at 5 V logic (~5 mA). This machine's control box: Alpha control Box Model# <b>10372</b>, firmware 224; SB3 version 3.8.70. Build year unknown (the instructor estimates 2022/23).${c(1, 2, 10, 11)}</dd>
<dt>spindle</dt><dd>This machine: <b>HSD AT/MT 1073-140</b> (instructor-confirmed model; unique identifier omitted). Nameplate photograph: 3 kW / 4 hp <b>S6</b>, 220 V three-phase, 300 Hz, 18,000 rpm, 13 A. S6 is an intermittent periodic duty rating, not an S1 continuous-power claim, and 18,000 rpm is the nameplate operating speed, not a confirmed maximum. Spindle controller: <b>Yaskawa V1000, CIMR-VU2A0020GAA</b>. <b>ER25</b> collets; which ER25 nut is fitted is not yet identified. 24 V cooling fan. (ShopBot's packages: HSD 2.2 or 4 HP, or Colombo 5 HP.)${c(2, 20, 21, 41)}</dd>
<dt>sensors</dt><dd>input 1 Z-zero plate, input 2 X proximity, input 3 Y proximity, input 4 stop circuit, input 5 Z proximity; output 1 spindle, output 4 safety/spindle-enable.${c(2)}</dd>
</dl>

<h2>2 · How the mechanisms work</h2>
<h3>The gantry (X)</h3>
<p>The bridge is an aluminium extrusion between two end plates. Each plate hangs four V-rollers on the hardened rail that runs along the top of the side plate; two ride above, two below, so the car cannot lift. A motor on each end plate sits on a hinged mount pulled by a spring (3.5 turns past contact on spring mounts; on bolted motor plates, hold the pinion into the rack with 15–20 lb while tightening the four plate screws) so its pinion stays pressed into the rack on the outside of the side plate.${c(2, 13)} Both X motors receive identical step trains. If one side stalls, its driver alarms and everything stops. If a pinion jumps teeth or slips on its shaft, the motor still turns the commanded amount: the bridge racks out of square <i>silently</i>.</p>
<h3>The car (Y) and the Z plate</h3>
<p>The YZ car repeats the same idea rotated 90°: rollers on a V-rail across the face of the beam, one motor on a pinion in the beam's rack. The Z plate rides one captured rail between two rows of five V-bearings (three fixed, two eccentric) per side and is lifted by a vertical rack — no leadscrew — so it moves at the same 7.2:1 ratio as the other axes. Because the gear train back-drives, Z can drop when unpowered; never push any axis by hand with the motors connected — position is lost and the drivers can be damaged.${c(2, 18, 27)} Too tight on the Z eccentrics means binding and lost position; too loose means a lateral slop you will see as a bad fourth side on every pocket.${c(18)}</p>
<h3>Closed loop, but closed around the motor</h3>
<p>An alphaStep motor runs open-loop until rotor position deviates by ±1.8° from command; at that point the driver switches to closed-loop correction. If correction cannot hold (an obstruction, a wrong feed, a damaged cable), the driver alarms, the control board stops everything, and the software says the location is no longer accurate.${c(1, 22, 23, 30)} Red LED blink codes on the AS driver: 1 overheat (~85 °C heatsink), 2 overload (>5 s above max torque), 3 overvoltage, 4 speed error, 5 overcurrent, 6 overspeed, 7 EEPROM, 8 sensor.${c(22)} What the loop cannot see: a pinion slipping on its shaft, a bit creeping in the collet, or a sheet moving under the clamps.</p>
<h3>Spindle and VFD</h3>
<p>The VFD makes the spindle's three-phase supply; the control box only tells it <i>on</i> (output 1 through the key interlock and the pendant Start) and, on packages with the RPM controller, <i>how fast</i> (the <code>TR</code> window or <code>TR,12000</code> in a file, SB3.5.5 or newer).${c(4, 21, 53)} The lab's full sequence: the screen prompts “Press START on control before pressing OK” → pendant Start → check the spindle runs at the commanded speed → OK → cutting begins. There is no separate RUN step on the VFD.${c(4)} Warm-up (<code>C5</code>, the lab's standard routine): 9000, 10 000 and 12 000 rpm for 3 min each at the start of the day or after more than 4 h idle.${c(4, 13)} Chipload = feed ÷ (rpm × flutes); the figure runs a 6 mm two-flute bit at 60 mm/s and 12 000 rpm, 0.15 mm per tooth.${c(11)}</p>
<h3>Zeroing and homing</h3>
<p><code>C3</code> drives to the X and Y proximity switches and backs off to the configured home. <code>C2</code> touches the Z-zero plate twice; input 1 must light when plate meets bit and clear when they separate. Zero can be the <b>material top</b> or the <b>table surface</b> — it has to match what the CAM post expects. If CAM assumed the stock top and you zeroed on the bed, every rapid and retract runs <i>inside</i> the material and every cut goes a sheet thickness into the spoilboard: crashes and broken bits. The reverse mismatch cuts air. Check <code>&amp;PWZorigin</code> in the file header against the surface you touched.${c(4, 6)} In this lab the ground clip stays clamped on the aluminium carriage plate; the circuit runs through plate → spindle → collet → bit, and <code>C2</code> is the only way students zero Z. <code>Z2</code> sets a temporary job origin where the tool stands; <code>SA</code>/<code>SR</code> switch absolute/relative, and units are set in Values → Display (<code>VD</code>), not by any of those.${c(10, 47)}</p>
<h3>Dust extraction and hold-down</h3>
<p>The brush skirt under the spindle is clamped to the spindle collar; a 4 in flex hose runs to the collector. The dust collector is switched manually at the collector itself and is on whenever the spindle runs.${c(13)} Hold-down is a separate matter and, in this lab, mechanical only: screws into the spoilboard through the waste, clamps and shims for bowed stock, and tabs or an onion skin of 0.25–0.75 mm for every part that will be freed from the sheet.${c(12)}</p>

<h2>3 · Failure modes</h2>
<p>Each entry: what you see, why, what to do. Numbers in brackets are the sources at the end. The ten the figure can act out are marked with their key.</p>
`;

export const FAULTS_DOC = [
  ["E01", "1", "Alpha driver fault — “location no longer ACCURATE”", "Abrupt stop, driver-fault dialog, red LED on the box; coordinates untrustworthy.", "Obstruction or excessive load, chips in the rack, a struck clamp, a damaged motor cable; AS drivers also trip on heat, voltage, speed and sensor faults.", "Note the LED blink code and axis, remove the cause, reset, re-home (C3) and re-zero. Reduce feed or depth if it was the cut.", [1, 22, 30]],
  ["E02", "8", "USB disconnect / communications failure", "SB3 loses the controller mid-file; spindle keeps running.", "PC power management (USB selective suspend, sleep), long or damaged cable.", "Dedicated PC with sleep and selective suspend off, direct cable under 10 ft, no extension; rehome afterwards.", [7, 55]],
  ["E03", "8", "Dust hose off the foot / skirt torn", "Chips everywhere, dust in the air, the brush not sweeping.", "Hose pulled off the foot by a long move; brush skirt torn or lost.", "Stop, spindle off, refit the hose or tell staff; never cut without the foot on.", [13]],
  ["E04", "3", "C3 homes early, fails, or asks to “move off prox”", "Wrong zero, stop before the target, or a nagging prox dialog.", "Misaligned target, swapped input polarity, bad switch or cable, dead input channel.", "Trip the switch with a screwdriver and watch inputs 2/3; fix alignment or the fault, don't disable limits.", [2, 6, 49]],
  ["E05", "2", "Z plate not detected", "Input 1 stays dark; the bit keeps descending.", "Clip knocked off the carriage plate or on paint/dust, a dirty plate or bit, dirty contact, open lead or connector.", "Plate-to-bit test with clip on before every C2; watch input 1 light and clear.", [4, 6]],
  ["E06", "2", "C2 touches but stops", "First touch registers, routine halts.", "Plate moved before the second touch; or (staff: check the C2 settings) a zero Safe-Z pull-up.", "Positive pull-up in the active units; leave the plate until both touches finish.", [4, 6]],
  ["E07", "4", "Spindle will not start", "Axes move; spindle stays still; a still bit snaps instantly.", "Interlock key off, no output 1 / pendant Start, VFD in LOCAL, or a drive fault.", "Key on, output 1, Start; check the VFD command source; listen before the bit enters stock.", [4, 21, 24, 25]],
  ["E08", "4", "RPM will not change", "Typed value ignored; speed stays as before.", "RPM window closed, Enter not pressed, wrong VFD selected, RPM-board USB lost, legacy keypad-only VFD.", "Open TR, pick the fitted drive, type, Enter; confirm on the VFD display.", [4, 6, 52]],
  ["E09", "4", "Wrong spindle-start order", "File starts with a still spindle.", "Pendant green START pressed after OK (alpha wants it before), or not at all.", "At the spindle prompt: pendant START, hear it reach speed, read the rpm on the VFD, then OK.", [4]],
  ["E10", "5", "Bit slips in the collet", "Cuts get deeper pass by pass; Z zero seems to drift.", "Dirty or worn ER25 collet, nut not snapped onto the collet first, wrong torque, wrong shank size.", "Clean taper/collet/nut; collet into nut first; torque for <i>this</i> nut (ShopBot: ER25 mini-nut 29 ft·lb, ER25 E-type nut 95 ft·lb — identify which nut is fitted; never guess between them); replace collets after 400–700 h or any incident.", [4, 13, 16, 31]],
  ["E11", "5", "Tool pull-out read as axis drift", "Depth changes while coordinates look right; witness mark on the shank has moved.", "Inadequate grip; the motor encoder cannot see a bit sliding.", "Compare Z zero before/after a test cut; replace suspect collet and bit; don't clamp on the flutes.", [1, 13, 16]],
  ["E12", "", "Broken bits — chipload, plunge, ramping", "Snapped cutter, chatter, spindle bogging.", "Wrong feed/rpm/depth, aggressive straight plunge, dull cutter — or a spindle that was never running.", "Maker's chipload chart, ramped entries, reduce depth; distinguish VR acceleration ramping from CAM entry ramps.", [10, 11, 25, 26]],
  ["E13", "", "Plastic melts / aluminium welds to the cutter", "Gummed flutes, fused chips, repeated breakage.", "Feed too low for rpm, recutting chips, heat.", "Make chips not heat: faster feed, shallower depth, proper evacuation; practitioner cutting aluminium fixed it with less depth and more feed.", [11, 35]],
  ["E14", "", "Plywood tear-out", "Frayed veneer, rough edges.", "Cut direction, dull or wrong geometry, grain, feed.", "Sharp compression or down-cut tooling, test both directions on scrap; don't slow down until it burns.", [11]],
  ["E15", "", "Burning in hardwood", "Scorched edge, smoke, hot dust.", "Too slow, rubbing with a dull tool.", "Sharp tool, correct chipload; stop and check for embers; never leave a running job.", [4, 11]],
  ["E16", "7", "Dust packed in rack teeth", "Ticking, uneven motion, erratic Z.", "Chips filling the gear mesh.", "Brush racks and pinions clean, then light grease (schedule: BB-sized blob every 6 in, run the axes, wipe excess).", [13, 32]],
  ["E17", "7", "Worn rack or pinion", "Oval circles, Z notches at certain heights, reversal play.", "Worn teeth or poor mesh.", "Push-pull test, inspect full travel, replace pinions as a set; CC circle test separates mechanics from bad CAD.", [13, 15, 16, 33]],
  ["E18", "7", "Loose pinion set screw / tired motor spring", "Clunks, sudden registration loss, backlash.", "Pinion moving on its shaft or not fully engaged.", "Tighten set screw and key, 3.5 turns past contact on spring mounts, full-width engagement; rehome.", [2, 13, 15]],
  ["E19", "", "Roller bearings loose or over-tight", "Lateral Z slop, bad fourth pocket wall, binding, axis faults.", "Eccentrics wrongly set, contamination, worn bearings.", "Adjust eccentrics incrementally with drives disengaged; replace rather than overtighten.", [13, 16, 18, 19]],
  ["E20", "", "Debris on the V-rails", "Bumps that repeat at one spot.", "Build-up on rail edges or rollers.", "Scotchbrite + WD-40 on rails, brass brush on rollers, every 40 h.", [13, 16]],
  ["E21", "9", "Crash into a clamp or screw", "Bang, broken cutter, alarm, shifted cut.", "Toolpath or rapid intersects hardware.", "Stop, inspect tool/mount/drives, fix clearance, rehome and re-zero; plan screw zones.", [1, 4, 12]],
  ["E22", "6", "Part lifts or flies", "Sheet rises or a cut-out catches the bit and is thrown.", "Poor hold-down, bowed stock, no tabs.", "Screws in the waste, tabs or 0.25–0.75 mm onion skin, never reach in.", [4, 12, 29]],
  ["E23", "6", "Clamps or shims let go", "Sheet shifts after the first passes; parts come out the right shape in the wrong place.", "Spring or pistol-grip clamps creeping, shims loosening as the sheet relaxes, too few screws, screws only at the edge.", "Screws into the spoilboard through the waste, at least every 300–400 mm and near every freed part; re-check clamps after the first pass; shim bowed stock flat before screwing.", [12, 11]],
  ["E24", "", "Climb vs conventional", "One direction chatters, the other is clean.", "Edge engagement changes with direction; looseness compounds it.", "Verify mechanics and hold-down first; climb on the finishing pass often helps, test on scrap.", [11, 12, 16]],
  ["E25", "", "Fire in the dust path", "Sparks, smoke, smouldering dust.", "Friction heat, screws hitting the impeller, hidden fasteners.", "Never unattended; keep fasteners out of the intake; extinguisher within reach.", [4, 36, 43]],
  ["E26", "", "Wrong XY zero / origin corner", "Right shape, wrong place.", "Job origin differs from the CAM origin; jogging confused with zeroing; Z2 and C3 mixed up.", "Home with C3, move to the chosen origin, Z2; verify the CAM corner; air-cut first.", [4, 26, 42, 47]],
  ["E27", "", "Inch/mm or SA/SR mismatch", "Toolpath scaled or offset; speeds absurd.", "Active units don't match the file; wrong distance mode; edited unit values.", "Check units in Values → Display before loading; the Autodesk post's CN,90 header only checks units, it doesn't set them.", [10, 11, 27, 54]],
  ["E28", "9", "Retract height too low for clamps", "Traverse hits a clamp though the contours clear.", "CAM clearance below fixture height, or Z reference changed.", "Clearance = tallest fixture + margin; preview rapid links.", [10, 12]],
  ["E29", "", "Retract beyond Z stroke", "Z-limit message, top-stop approach.", "Safe height + offset + tool length exceeds the Z travel (6 in on the 2022 guide, 8 in on the 2023 sheet; measure this machine).", "Revise fixtures/toolpath; don't disable limits to reach the unreachable.", [1, 2, 10]],
  ["E30", "", "“Stop button pressed” / won't resume", "Stopped dialog, no motion.", "Input 4 still active, E-stop latched, driver not reset.", "Clear the cause; after an electrical E-stop rehome and re-zero — positions did not survive.", [4, 11]],
  ["E31", "", "Restarting a broken job by line", "Half-cut part; restarting from line 1 recuts or collides.", "Restart point lacks speed, spindle, offset state.", "Re-establish zeros, FG (File Load in Goto mode), pick the line, approach at verified safe Z.", [10]],
  ["E32", "", "Table-surface vs part-surface zero", "Rapids and retracts run inside the stock, cuts go a sheet thickness into the spoilboard (bed zero, top-zero CAM) — or the whole job cuts air (the reverse).", "C2 zeroed to one surface, CAM assumed the other.", "Match CAM zero option to the touched surface at every setup.", [4, 13]],
  ["E33", "", "Stuck in Preview", "Animation, no motion.", "SP active instead of SM; or no controller connection.", "Check connection, then SM; never toggle with hands in the envelope.", [10, 34]],
  ["E34", "", "Accidental keyboard jog", "Axis moves when an arrow key is pressed.", "Keypad window has focus.", "Exit keypad when done; Fixed increments for fine approach.", [4, 47]],
  ["E35", "", "Table limit trips mid-cut", "Limit warning near an edge.", "Real limit, wrong base offset, VL/SF/VN settings, false input.", "Check coordinates and switch state; limits use the base system, not Z2 zero.", [2, 10, 11]],
  ["E36", "", "VFD overcurrent / overload", "Spindle stops with a drive code; gantry may keep moving.", "Load, acceleration demand, short, loose motor wiring.", "Stop, record model and code (Delta oc/oL vs Yaskawa oC/oL1/oL2 — different tables), fix the cause before resetting.", [24, 30, 39]],
  ["E37", "", "Motor/driver overheating, spindle fan dead", "AS code 1, thermal stop, no fan noise.", "Driver heatsink at ~85 °C, blocked cooling, failed 24 V fan.", "Cool down, check vents and fan cable, match load to capacity.", [2, 13, 22, 41]],
  ["E38", "1", "Gantry out of square", "Diagonals differ; corners not 90°.", "Gantry reset with sides misaligned; unequal mesh; table shifted.", "Pull the gantry to both stops before motor reset; check diagonals; cut a validation shape.", [2, 13, 16]],
  ["E39", "S", "Bit hits a hold-down screw", "A loud bang mid-cut with the spindle running; the bit breaks off and a screw head in the waste is chewed up.", "A screw placed on or too close to a toolpath, or the CAM clearance height set below the screw heads so a move between cuts runs into one. Carbide shatters on steel.", "Spacebar, spindle off, key OFF, tell staff; the bit and possibly the collet are scrap. Screws only in planned safe zones of the waste, drawn in CAM and checked against every toolpath and rapid; clearance above the tallest screw head.", [1, 4, 12]],
];

export const MAINTENANCE = `
<h2>4 · Maintenance that prevents most of the above</h2>
<ul>
<li><b>Daily:</b> C5 warm-up and listen for the fan; inspect bit, collet, nut, hose; pull the gantry against both stops before resetting the motors; jog, C3, C2.${c(13, 4)}</li>
<li><b>Every 40 h:</b> brush X/Y/Z racks and pinions, then a BB-sized blob of light grease every 6 in, run the axes ~10 times, wipe the excess; Scotchbrite + WD-40 on the V-rails, brass brush on the rollers; push-pull play check at every drive.${c(13)}</li>
<li><b>Quarterly / semiannually:</b> spin-test rollers, tighten pinion set screws, check Z eccentrics and spindle square; back up settings with US (restore with UR).${c(13, 18)}</li>
<li><b>Semiannually at 40 h/week:</b> all pinions replaced, Z extrusion stripped, cleaned and re-set, collets replaced as required.${c(13)}</li>
</ul>
<div class="sb-note-box"><b>On lubrication.</b> The received wisdom to run racks dry is not ShopBot's instruction. Their 2016 schedule says light grease; the 2014 troubleshooting guide says heavy grease; the 2022 assembly guide uses lithium grease on the pinions. The sources disagree on formulation, not on greasing — and all of them say clean first, never grease over packed chips.${c(2, 13, 15)}</div>

<h2>5 · What this page does not know about your machine</h2>
<p>The figure is drawn from manufacturer documents of several generations. Before trusting a number for the lab's own PRSalpha: photograph the serial plate, all four motor labels, one driver, the spindle plate and the VFD; measure actual Z stroke and under-gantry clearance; check which motor mount (spring or fixed), which VFD (Delta or Yaskawa) and which SB3 version are fitted. Forum evidence here is limited to indexed excerpts (TalkShopBot returned 403 during research) and is labelled as such in the source list.</p>
`;

export const SOURCES = [
  [1, "ShopBot PRSalpha Specifications, JUL 2023 (FabLab Nepal mirror)", "https://www.fablabnepal.org/storage/uploads/66f01f7b-e155-498b-b9c1-ededefd3f47d/PRSalphaSpecSheet_JUN2023.pdf"],
  [2, "ShopBot SBG00443 PRSalpha Assembly Guide, May 2022 (incl. dust-foot and maintenance appendices)", "https://shopbottools.com/wp-content/uploads/2024/01/SBG00443_PRSalpha_Assembly.pdf"],
  [3, "ShopBot PRS Assembly Manual, legacy edition", "https://wiki.makesantafe.org/shopbotassembly.pdf"],
  [4, "ShopBot Quick-Start Guide, PRSalpha and PRSstandard, Oct 2016", "https://shopbottools.com/wp-content/uploads/2024/01/QuickstartGuidePRSAlphaStandard.pdf"],
  [6, "ShopBot Technical Q&A / FAQ (Z-zero plate, connections, RPM controller, XY homing)", "https://shopbottools.com/support-resources/faq"],
  [7, "ShopBot Communication Issues FAQ", "https://shopbottools.com/ufaq/communication-issues"],
  [10, "ShopBot Command Reference, Control Software and OpenSBP, 2015", "https://shopbottools.com/wp-content/uploads/2024/01/SBG00253150707CommandRefV3.pdf"],
  [11, "ShopBot SBG00142 User Guide, March 2015", "https://shopbottools.com/wp-content/uploads/2024/01/SBG-00142-User-Guide-20150317.pdf"],
  [12, "ShopBot Holding Down Material for Cutting, Aug 2016", "https://shopbottools.com/wp-content/uploads/2024/01/holdingdown.pdf"],
  [13, "ShopBot PRS Maintenance Schedule, Sept 2016", "https://shopbottools.com/wp-content/uploads/2024/01/PRSMaintenanceSchedule.pdf"],
  [15, "ShopBot Replacing Pinion Gears", "https://shopbottools.com/wp-content/uploads/2024/01/SBG00264_Replacing_Pinion_Gears-2.pdf"],
  [16, "ShopBot SBG00203 Troubleshooting Mechanicals, Oct 2014", "https://shopbottools.com/wp-content/uploads/2024/01/SBG-00203-TroubleShooting-Mechanicals-2014-10-24.pdf"],
  [17, "ShopBot Static Reduction in CNC Dust Collection Systems", "https://shopbottools.com/wp-content/uploads/2024/01/Static_Reduction_in_CNC_Dust_Collection_Systems.pdf"],
  [18, "ShopBot Adjusting the PRS Z-Axis Bearings, Oct 2016", "https://shopbottools.com/wp-content/uploads/2024/01/AdjustPRSZBearings.pdf"],
  [19, "ShopBot Adjusting the Lower Wheels on the YZ-Car", "https://shopbottools.com/wp-content/uploads/2024/01/Adjusting-the-Lower-Wheels-on-the-YZ-Car.pdf"],
  [20, "ShopBot spindle packages (HSD, Colombo, ER25, RPM controller)", "https://shopbottools.com/products/spindles"],
  [21, "ShopBot Installing an HSD Spindle: PRS Alpha / Yaskawa V1000", "https://shopbottools.com/wp-content/uploads/2024/01/HSDSpindleInstallPRSAlpha.pdf"],
  [22, "Oriental Motor AS-Series Connection and Operation (alarm codes)", "https://www.orientalmotor.com/products/pdfs/connection/AS-RoHS_connection_operation.pdf"],
  [23, "Oriental Motor AS-Series alphaStep catalog 2012/2013 (closed-loop changeover)", "https://www.orientalmotor.com/products/pdfs/2012-2013/A/usa_st_as.pdf"],
  [24, "Yaskawa V1000 Technical Manual (ShopBot-hosted)", "https://shopbottools.com/wp-content/uploads/2024/01/V1000.pdf"],
  [25, "Fab Academy UAE 2020: ShopBot feeds/speeds, broken tool with spindle off", "http://fabacademy.org/2020/labs/uae/shopbot/shopbot.html"],
  [26, "Fab Academy, R. Shan 2024: cutting setup and 16 in X datum offset", "https://fabacademy.org/2024/labs/charlotte/students/richard-shan/lessons/week7/cutting"],
  [27, "ShopBot SBG00171 Settings / Unit Values, Dec 2014 (motors, pinions, steps/in)", "https://shopbottools.com/wp-content/uploads/2024/01/SBG-00171-Settings-Unit-Values-2014-12-17.pdf"],
  [28, "ShopBot vacuum hold-down products (Fein Turbo II)", "https://shopbottools.com/products/vacuum"],
  [29, "ShopBot blog: Holding Things Down (2006), Fein Turbo III and bowed plywood", "https://shopbottools.com/2006/09/09/holding-things-down"],
  [30, "TalkShopBot t-25063: PRSalpha driver fault, damaged cable [indexed excerpt]", "https://www.talkshopbot.com/forum/archive/index.php/t-25063.html"],
  [31, "TalkShopBot t-24846: bit slipping ~0.5 in [indexed excerpt]", "https://www.talkshopbot.com/forum/printthread.php?page=1&t=24846"],
  [32, "TalkShopBot t-8151: HDU dust packed in Z rack [indexed excerpt]", "https://www.talkshopbot.com/forum/archive/index.php/t-8151.html"],
  [33, "TalkShopBot t-2897: worn rack/pinion, Z position errors [indexed excerpt]", "https://www.talkshopbot.com/forum/archive/index.php/t-2897.html"],
  [34, "TalkShopBot t-2666: Preview vs Move/Cut mode [indexed excerpt]", "https://www.talkshopbot.com/forum/archive/index.php/t-2666.html"],
  [35, "TalkShopBot t-9779: aluminium welding to cutter [indexed excerpt]", "https://www.talkshopbot.com/forum/archive/index.php/t-9779.html"],
  [36, "TalkShopBot t-14808: drilling heat / fire with vacuum hold-down [indexed excerpt]", "https://www.talkshopbot.com/forum/printthread.php?page=1&t=14808"],
  [39, "Delta VFD-S User Manual, 2008 (ShopBot-hosted)", "https://shopbottools.com/wp-content/uploads/2024/01/VFD-S_manual_en.pdf"],
  [41, "HSD AT/MT Operating Manual (Sorotec mirror)", "https://www.upload.sorotec.de/doku/manuals/Operating_Manual_HSD_AT-MT.pdf"],
  [42, "100kGarages: Machining a two-sided 3D model (C3, Z2 workflow)", "http://www.100kgarages.com/blog/2017/01/machining-two-sided-3d-model-solidworks"],
  [43, "TalkShopBot t-16772: screws at the collector impeller [indexed excerpt]", "https://www.talkshopbot.com/forum/archive/index.php/t-16772.html"],
  [44, "TalkShopBot t-8987: vacuum through MDF, onion skins, blowers [indexed excerpt]", "https://www.talkshopbot.com/forum/archive/index.php/t-8987.html"],
  [47, "ShopBot Manually Setting XY Zero Locations (Fixed keypad, C3 offsets)", "https://shopbottools.com/wp-content/uploads/2024/01/ManuallySettingXYZeroLocations.pdf"],
  [49, "TalkShopBot t-25095: proximity input mismatch / “move off prox” [indexed excerpt]", "https://www.talkshopbot.com/forum/printthread.php?page=1&t=25095"],
  [52, "TalkShopBot t-3077 (2005): Delta VFD speed set at keypad [indexed excerpt]", "https://www.talkshopbot.com/forum/archive/index.php/t-3077.html"],
  [53, "ShopBot SBG00338 Installing the Spindle RPM Controller (Yaskawa), 2015", "https://shopbottools.com/wp-content/uploads/2024/01/RPMControllerYaskawa-2015-04-06.pdf"],
  [54, "Autodesk ShopBot OpenSBP post (SA / CN,90 unit check)", "https://cam.autodesk.com/posts/post.php?name=shopbot"],
  [55, "ShopBot Desktop Quick-Start (Windows sleep / USB power settings)", "https://shopbottools.com/wp-content/uploads/2024/01/DTQuickStartGuide.pdf"],
];

export function faultsHtml() {
  return `<ol class="sb-fault-list">${FAULTS_DOC.map(([id, key, title, sym, cause, cure, refs]) =>
    `<li><span class="sb-fid">${id}${key ? ` · key ${key}` : ""}</span><span class="sb-ftitle">${title}</span>${c(...refs)}<div class="sb-row"><span>see</span><span>${sym}</span><span>why</span><span>${cause}</span><span>do</span><span>${cure}</span></div></li>`).join("")}</ol>`;
}
export function sourcesHtml() {
  return `<h2>Sources</h2><ol class="sb-sources">${SOURCES.map(([n, label, url]) => `<li value="${n}">${label} — <a href="${url}">${url}</a></li>`).join("")}</ol>`;
}
