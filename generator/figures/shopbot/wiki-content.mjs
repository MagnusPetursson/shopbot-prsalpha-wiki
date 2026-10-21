// Wiki-only prose: safety, symptom index, feeds primer, CAM checklist, instructor notes, self-check.
// Facts carry the source numbers of prose.mjs SOURCES plus the lab sources appended in wiki.mjs ([56]+).
const c = (...n) => `<span class="sb-cite">[${n.join(",")}]</span>`;
const fig = (id, text) => `<a class="sb-showfault" href="#fig-anatomy" data-show-fault="${id}">${text}</a>`;

export const SAFETY = `
<p>A 4 HP spindle turning a 6 mm cutter at 12 000 rpm does not know you are there. The machine moves at up to 760 mm/s between cuts and has no idea what a hand is. The rules below are ShopBot's own safety list plus the lab's; each one is there because the alternative is an injury, a broken machine or a fire.</p>
<ul class="sb-rules">
<li><b>Trained and signed off.</b> You run this machine only after the lab's induction and with the instructor's sign-off. Students who have not been signed off operate the machine only with a signed-off person at the E-stop.${c(4, 60)}</li>
<li><b>Never alone, never tired.</b> Two people in the room; the second person knows where the E-stop is: the red button on the wall-mounted pendant by the monitor, the only one on this machine.${c(60, 63, 64)}</li>
<li><b>Eye and ear protection for you and anyone watching</b>, from the moment the machine is powered. No gloves, loose clothing, hair, lanyards anywhere near the gantry.${c(4)}</li>
<li><b>Hands off the rails and out of the cutting area whenever the control box is on</b> — unless the spindle is stopped, the interlock key is OFF and in your pocket, the keypad is closed and no file is loaded or paused. The machine can move without warning, in any direction.${c(4)}</li>
<li><b>Key out for hands-on work.</b> Spindle off and stopped, interlock key OFF and in your pocket before you change a bit, touch the collet, or load, move or clamp material.${c(4, 11, 63)}</li>
<li><b>Never leave a running job.</b> Fires start in dust under the brush when a tool rubs, hits a screw, or a dull cutter burns hardwood. Stand where you can see the cut and reach the E-stop.${c(4, 36, 43)}</li>
<li><b>Know the two ways to stop</b> — the box below. Use them without hesitating; a ruined sheet is cheaper than anything else.${c(4, 10, 11)}</li>
<li><b>Spindle at speed before OK.</b> When the screen says “Press START on control before pressing OK”, start the spindle from the pendant; it must be running at the commanded speed before you click OK — the box below. A still bit dragged through plywood snaps and the pieces fly.${c(4)}</li>
<li><b>Extraction on.</b> Switch the dust collector on at the collector itself (it is manual; the software does not switch it). It runs whenever the spindle runs. If the hose comes off the foot or the brush skirt is damaged, stop and tell staff.${c(13)}</li>
<li><b>Clean up; leave the machine powered.</b> Stop the file and spindle, remove the key before reaching in, brush the rails and racks, vacuum the deck, put the bits back and report problems. Users never power down the machine; leave it for lab staff. Use E-stop in an emergency, not to finish a session.${c(13)}</li>
</ul>

<div class="sb-box sb-box-stop" id="stops"><h4>How to stop a PRSalpha</h4>
<dl class="sb-table">
<dt>Spacebar (or Enter, or the on-screen Stop)</dt><dd><b>Routine stop.</b> Motion ramps down, Z lifts to its safe height, position is kept, so you can resume. <b>Treat the spindle as live</b>: depending on setup it may keep turning, coast down, or restart when you resume. A spacebar stop is not isolation. Before reaching in: spindle stopped, key OFF and removed, keypad closed, no file loaded or paused. Keep clear before restarting.${c(4, 11)}</dd>
<dt>E-stop (the red mushroom on the wall-mounted pendant by the monitor — the only E-stop on this machine. The red-and-yellow rotary handle on the control cabinet is the power disconnect, not an E-stop)</dt><dd><b>When something is wrong.</b> Cuts spindle power immediately and motor power about 5 s later. Afterwards the machine no longer knows where it is: twist the E-stop to release it, press pendant <b>Reset</b>, then <code>C3</code> and <code>C2</code> before cutting again. There is no soft "Stop" button on an alpha pendant; its three buttons are <b>Reset · Start · E-stop</b>.${c(2, 10, 11)}</dd>
<dt>If the software has frozen or lost the controller</dt><dd>The spacebar does nothing and the spindle keeps running. <b>E-stop</b> is the only control that still kills the spindle.${c(10)}</dd>
</dl></div>

<div class="sb-box sb-box-start" id="spindle-start"><h4>How to start a job on a PRSalpha</h4>
<ol>
<li>Spindle RPM Control window open (Tools → Spindle RPM Control, or type <code>TR</code>), RPM typed, <b>Enter</b>. Leave the window open all session.${c(4)}</li>
<li><code>FP</code>, pick the file, check Offset = <b>No Offset</b>, Start.${c(4)}</li>
<li>The screen prompts “Press START on control before pressing OK”. Press the green <b>START on the three-button pendant</b>.${c(4, 63)}</li>
<li>Check the spindle is running at the commanded speed; the VFD's rpm display should show the number you typed. There is no separate RUN step on the VFD.${c(4, 63)}</li>
<li>Only then: <b>OK</b> on the screen. Cutting begins. Hand near the stop for the first plunge.${c(4, 63)}</li>
</ol>
</div>
`;

export const SYMPTOMS = `
<h2 id="symptoms">6 · Something went wrong: start from the symptom</h2>
<p>Find what you see, not what you suspect. Each card names the most likely causes in order and links to the fault card (E-numbers in the next section) and, where the figure can act it out, to the figure key that plays it.</p>
<div class="sb-symptoms">
<div class="sb-sym"><div class="sb-sym-h">Everything stopped dead, red LED on the box, "location no longer accurate"</div><div>Alpha driver alarm. Stop and call staff; do not open the cabinet. Staff check the driver alarm and cause (clamp strike, packed rack, cable). After recovery, <b>rehome and re-zero</b>. → <a href="#E01">E01</a> · ${fig("alpha", "figure key 1")}</div></div>
<div class="sb-sym"><div class="sb-sym-h">Software froze or says the controller disconnected; spindle still running</div><div>USB dropped: the PC went to sleep or the cable was knocked. <b>Press an E-stop</b>: the software can no longer stop the machine and the E-stop is the only control that kills the spindle. Then fix the cause, Reset, C3, C2, resume with FG. → <a href="#E02">E02</a>, <a href="#E03">E03</a> · ${fig("usb", "figure key 8")}</div></div>
<div class="sb-sym"><div class="sb-sym-h">C2 drives the bit into the plate and keeps going</div><div>Input 1 not seeing the touch: clip off, dirty plate, open lead. <b>Spacebar</b>; if Z still moves, <b>E-stop</b>. The circuit test (input 1 lights on contact) before C2 is the only guard against this. → <a href="#E05">E05</a> · ${fig("zzero", "figure key 2")}</div></div>
<div class="sb-sym"><div class="sb-sym-h">C2 touches once and then stops with an error</div><div>Plate moved before the second touch; or (staff: check the C2 settings) a zero Safe-Z pull-up. → <a href="#E06">E06</a></div></div>
<div class="sb-sym"><div class="sb-sym-h">C3 runs into the end of the table, or nags "move off prox"</div><div>Proximity switch gap, polarity, or input channel. Watch inputs 2 and 3 light while you hold a screwdriver on the switch. → <a href="#E04">E04</a> · ${fig("prox", "figure key 3")}</div></div>
<div class="sb-sym"><div class="sb-sym-h">Spindle did not start but the axes move</div><div>Interlock key, output 1, pendant START not pressed before OK, VFD in LOCAL. Spacebar before the bit reaches the stock; E-stop if it already has. → <a href="#E07">E07</a>, <a href="#E09">E09</a> · ${fig("rpm", "figure key 4")}</div></div>
<div class="sb-sym"><div class="sb-sym-h">Typed a new RPM, nothing changed</div><div>Enter not pressed in the Spindle RPM Control window, window closed, or RPM controller not talking to the VFD. Read the rpm on the spindle controller's display, not in the software. → <a href="#E08">E08</a></div></div>
<div class="sb-sym"><div class="sb-sym-h">Cut gets deeper every pass; the last pass goes through the spoilboard</div><div>Bit slipping in the collet. The motors cannot see it. Stop, re-torque or replace the collet, re-zero Z on an uncut area. → <a href="#E10">E10</a>, <a href="#E11">E11</a> · ${fig("collet", "figure key 5")}</div></div>
<div class="sb-sym"><div class="sb-sym-h">Snapped bit</div><div>Was the spindle turning? Then: chipload too high or too low, straight plunge too fast, dull cutter, or it hit a clamp/screw. → <a href="#E12">E12</a>, <a href="#E21">E21</a>, <a href="#E39">E39</a></div></div>
<div class="sb-sym"><div class="sb-sym-h">Loud bang, bit broke mid-cut</div><div>With the spindle running, the bit hit metal: a hold-down screw or a clamp on the path, or a clearance height below a screw head. <b>Spacebar</b>, spindle off, key OFF, tell staff; the bit and possibly the collet are scrap. Before the next run, check every screw and clamp position against the toolpaths in CAM. → <a href="#E39">E39</a>, <a href="#E21">E21</a>, <a href="#E28">E28</a> · ${fig("screw", "figure key S")}</div></div>
<div class="sb-sym"><div class="sb-sym-h">Melted plastic, aluminium welded to the flutes</div><div>Feed too slow for the rpm, chips being recut. Faster feed, shallower depth, single flute for plastics. → <a href="#E13">E13</a></div></div>
<div class="sb-sym"><div class="sb-sym-h">Frayed plywood veneer, fuzzy edges</div><div>Up-cut tooling on the top face, dull bit, wrong direction. Compression or down-cut bit, climb finishing pass. → <a href="#E14">E14</a>, <a href="#E24">E24</a></div></div>
<div class="sb-sym"><div class="sb-sym-h">Burn marks, smoke, hot dust</div><div>Rubbing, not cutting: too slow, dull. Stop and check the dust under the brush for embers. → <a href="#E15">E15</a>, <a href="#E25">E25</a></div></div>
<div class="sb-sym"><div class="sb-sym-h">Second pass offset from the first; circles come out oval; sides not square</div><div>Position creep: packed rack teeth, worn pinion, loose pinion set screw, tired motor spring, or roller wheels wrong. → <a href="#E16">E16</a>, <a href="#E17">E17</a>, <a href="#E18">E18</a>, <a href="#E19">E19</a>, <a href="#E38">E38</a> · ${fig("rack", "figure key 7")}</div></div>
<div class="sb-sym"><div class="sb-sym-h">Ticking or a bump at the same place every time</div><div>Debris on the V-rail or in the rack at that spot. Clean it; do not grease over it. → <a href="#E16">E16</a>, <a href="#E20">E20</a></div></div>
<div class="sb-sym"><div class="sb-sym-h">Part lifted, moved or flew; sheet wandered</div><div>Hold-down failed as the profile cut through: no tabs/onion skin, bowed stock, too few screws. → <a href="#E22">E22</a>, <a href="#E23">E23</a> · ${fig("holddown", "figure key 6")}</div></div>
<div class="sb-sym"><div class="sb-sym-h">Right shape, wrong place on the sheet</div><div>Job zero not where CAM thought: wrong corner, wrong Z surface (<code>&amp;PWZorigin</code> in the file header vs the surface you touched), zeroed with Z2 before homing. Air-cut first next time. → <a href="#E26">E26</a>, <a href="#E32">E32</a></div></div>
<div class="sb-sym"><div class="sb-sym-h">Everything is 25.4× too big or too small; feeds absurd</div><div>Inch/mm mismatch between the file and the software (VD). → <a href="#E27">E27</a></div></div>
<div class="sb-sym"><div class="sb-sym-h">Rapid move hit a clamp</div><div>CAM clearance height below the clamp. → <a href="#E28">E28</a>, <a href="#E21">E21</a> · ${fig("clampstrike", "figure key 9")}</div></div>
<div class="sb-sym"><div class="sb-sym-h">"Z limit" or "table limit" message</div><div>Retract height beyond the 6/8 in Z stroke, or the job runs past the table limits (VL). Never disable limits to get there. → <a href="#E29">E29</a>, <a href="#E35">E35</a></div></div>
<div class="sb-sym"><div class="sb-sym-h">Preview plays, nothing moves</div><div>Software in Preview (SP) instead of Move/Cut (SM), or no controller connection. → <a href="#E33">E33</a></div></div>
<div class="sb-sym"><div class="sb-sym-h">An axis moved when I touched the keyboard</div><div>The keypad window still had focus. Close it when you are done jogging. → <a href="#E34">E34</a></div></div>
<div class="sb-sym"><div class="sb-sym-h">Spindle stopped with a code on its controller display</div><div>Overcurrent/overload. Stop the file, record the code, find the cause before resetting. → <a href="#E36">E36</a>, <a href="#E37">E37</a></div></div>
<div class="sb-sym"><div class="sb-sym-h">I stopped the job and need to continue</div><div>Decide whether position survived (spacebar stop: yes; E-stop or driver fault: no → Reset, C3, re-zero). Then restart from a line with FG, spindle started by the start sequence. → <a href="#E30">E30</a>, <a href="#E31">E31</a></div></div>
</div>
`;

export const FEEDS = `
<h2 id="feeds">7 · Feeds, speeds and the one number that matters</h2>
<p>The cutter removes a chip every time a flute passes. The thickness of that chip, the <b>chipload</b> f<sub>z</sub>, decides almost everything: too thin and the edge rubs, heats, dulls and burns; too thick and the cutter deflects, chatters and snaps.</p>
<div class="sb-formula">f<sub>z</sub> = feed ÷ (rpm × flutes) &nbsp;&nbsp;&nbsp; feed = rpm × flutes × f<sub>z</sub></div>
<p>Worked example (the calculator's default): 4200 mm/min ÷ (14 000 rpm × 2 flutes) = <b>0.15 mm per tooth</b>, a reasonable chip for a 6 mm cutter in plywood. <b>CAM works in mm/min; SB3 and the .sbp file use mm/s — divide by 60</b> (4200 mm/min = 70 mm/s).${c(11)}</p>
<h3>Starting points used in Icelandic Fab Labs (6 mm two-flute unless stated)</h3>
<dl class="sb-table">
<dt>birch / spruce plywood</dt><dd><b>Start at 14 000 rpm, 4200 mm/min (0.15 mm/tooth)</b>, 3 mm pass, 40 % stepover. Icelandic labs report 2000–6500 mm/min working (0.07–0.23 mm/tooth), but below ~3600 mm/min at 14 000 rpm you are under ShopBot's plywood chipload range (0.13–0.5 mm/tooth for a ¼ in cutter): if you need to go gentler, drop rpm, not feed.${c(11)} down-cut to 3 mm then up-cut to 0.2 mm past the thickness, tabs 12 × 3 mm.${c(56, 57, 58)}</dd>
<dt>MDF</dt><dd>similar feeds, expect fine dust: extraction and a mask. MIT's table: ¼ in cutter 0.33–0.40 mm/tooth, plunge ≤ 50 % of the XY feed.${c(59)}</dd>
<dt>EB700 epoxy tooling board, 12 mm 3-flute</dt><dd>8000 rpm, 8400 mm/min (0.35 mm/tooth), plunge 300 mm/min, adaptive 20 mm max / 5 mm fine stepdown — one worked job, not a validated recipe; respirator.${c(61)}</dd>
<dt>PU foam / tooling foam</dt><dd>0.28–0.33 mm/tooth; it cuts easily but the dust is the hazard.${c(59)}</dd>
<dt>plastics (HDPE, acrylic)</dt><dd>single-flute O-flute, high feed, low rpm; the test is a clean curl, not a weld.${c(11, 35)}</dd>
<dt>aluminium</dt><dd>possible but marginal on a router: shallow depth, high feed, lubricant, single flute; lower depth and raise feed if it welds.${c(35)}</dd>
</dl>
<p><b>Rules of thumb.</b> Plunge at half the XY feed or less; ramp into pockets. Keep the bit's stick-out as short as the job allows. If depth of cut is 2× the diameter, reduce chipload 25 %; at 3× diameter, 50 %. A spindle loses torque at low rpm: if it bogs, raise rpm and feed together to keep the chip the same. Record the material, cutter, feed, rpm and any fault in your job notes and report problems to staff.${c(11, 59)}</p>
`;

export const CAM = `
<h2 id="cam">8 · From CAM to the machine: the post-processing checklist</h2>
<p>Most "machine" failures are decided at the computer. Go through this list every time you post a file. Post with Autodesk Fusion's official ShopBot (OpenSBP) post processor. The correct machine settings are already loaded on the control PC; setup is then checked by hand at the machine.${c(54, 63)}</p>
<ol class="sb-check">
<li><b>Units.</b> File and software agree (mm). If SB3 stops with UNIT_ERROR, the file and SB3 disagree on mm/inch: re-post the file in mm. Do not change or reload the machine settings — they are already correct on the control PC; ask staff if the units still disagree.${c(10, 54, 63)}</li>
<li><b>Origin corner and Z reference.</b> Which corner is X0 Y0? Is Z0 the <b>material top</b> or the <b>table surface</b> (<code>&amp;PWZorigin</code> in the posted file)? It must match what you touch with C2. Bed zero with a top-zero file puts every rapid and retract <i>inside</i> the stock and every cut a sheet thickness into the spoilboard; the reverse cuts air.${c(4, 6, 54)}</li>
<li><b>Stock thickness measured</b>, not assumed. Plywood sold as 18 mm is 17.4–18.6 mm; through-cuts and onion skins depend on it.${c(56)}</li>
<li><b>Clearance / retract height</b> above the tallest clamp or screw head, with margin — and below the Z stroke.${c(10, 12)}</li>
<li><b>Hold-down planned in the CAM</b>: screw positions in the waste, screws and clamps clear of every toolpath including the tool's radius; tabs or a 0.25–0.75 mm onion skin for every part that will be freed. Plan the full cutter envelope in CAM and check it in the simulation.${c(12, 63)}</li>
<li><b>Feeds, rpm, flutes, depth per pass</b> computed, not copied; check the first-pass depth in the simulation and posted file before running.${c(11, 62)}</li>
<li><b>Simulate</b> and look for: straight plunges into solid stock, rapids posted as feed moves above the stock (slow and dangerous at clamp height), curves turned into thousands of tiny steps (the machine stutters) — ask staff about the post settings.${c(62)}</li>
<li><b>One file per tool</b> unless you are sure of the tool-change prompts; name files with the tool and the date.${c(62)}</li>
<li><b>Open the .sbp in a text editor</b> and read the header: units, <code>MS</code> feed, <code>TR</code> rpm, <code>&amp;PWZorigin</code>, the first <code>JZ</code> and <code>M3</code>. If a number surprises you, it will surprise the machine.${c(10, 62)}</li>
</ol>
`;

export const QUIZ = `
<p>Passing this is part of the sign-off. Answers are under each question; think before you open them.</p>
<ol class="sb-quiz">
<li>The file is loaded, you clicked OK on the spindle prompt and the gantry is moving toward the stock — but the spindle is silent. What do you do in the next two seconds, and what went wrong?<details><summary>Answer</summary>Spacebar now; E-stop if the bit is already in the stock. You clicked OK before pressing START on the pendant (or the key/output 1 was off). See <a href="#spindle-start">the start sequence</a> and <a href="#E07">E07</a>, <a href="#E09">E09</a>.</details></li>
<li>You press the E-stop halfway through a job. Which of X, Y and Z zero can you trust afterwards, and what must you do before restarting?<details><summary>Answer</summary>None. Release, pendant Reset, C3 to rehome, jog to the recorded job-origin coordinates and Z2 again, C2 for Z, then FG from a line before the stop. See <a href="#stops">Stops</a>, <a href="#E30">E30</a>.</details></li>
<li>C2 ran and reported Z zero, but the first pass cuts 2 mm too deep across the whole sheet. Name three possible causes and the test for each.<details><summary>Answer</summary>Wrong plate thickness in the settings (staff measure the plate and check TS); zeroed on the wrong surface for the file's <code>&amp;PWZorigin</code> (read the header); bit slipping in the collet (witness mark on the shank, staff check after correct tightening). <a href="#E05">E05</a>, <a href="#E10">E10</a>, <a href="#E32">E32</a>.</details></li>
<li>The second profile pass is 1 mm to the left of the first. The alpha drivers did not alarm. Why could they not have noticed, and where do you look?<details><summary>Answer</summary>The loop is closed around the motor shaft: a pinion that jumps teeth or slips on its shaft, or packed chips in the rack, move the gantry without the motor knowing. Look at rack teeth, pinion set screws, motor spring tension, roller wheels. <a href="#E16">E16</a>–<a href="#E19">E19</a>.</details></li>
<li>Your CAM file has Z0 at the material top; the lab convention for through-cuts is Z0 on the bed. What happens if you zero on the bed and run it anyway?<details><summary>Answer</summary>Every rapid and retract runs inside the stock and every cut goes a full sheet thickness into the spoilboard: crashed clamps, broken bit. Match <code>&amp;PWZorigin</code> to the surface you touch, every time. <a href="#E32">E32</a>.</details></li>
<li>You want 0.15 mm/tooth with a 6 mm two-flute at 14 000 rpm. What feed in mm/min? What plunge?<details><summary>Answer</summary>14 000 × 2 × 0.15 = 4200 mm/min; plunge at half or less, ≤ 2100 mm/min, ramped if possible. <a href="#feeds">Feeds</a>.</details></li>
<li>You pressed the spacebar to pause and want to check the cut. What must you confirm before your hand goes near the bit?<details><summary>Answer</summary>A spacebar stop is not isolation. Before reaching near the bit, confirm that the spindle has stopped, the interlock key is OFF and removed, the keypad is closed and no file is loaded or paused. Keep clear before re-engaging the key or restarting. <a href="#stops">Stops</a>.</details></li>
<li>The part you are cutting out is 300 × 200 mm. List three ways to keep it from flying on the last pass, and the drawback of each.<details><summary>Answer</summary>Tabs (hand finishing); onion skin 0.25–0.75 mm (hand finishing, needs accurate thickness); screws through the part into the spoilboard (holes, must be clear of toolpaths). <a href="#E22">E22</a>, <a href="#E23">E23</a>.</details></li>
<li>What does the alphaStep driver's closed loop see, and what does it not see? Give one failure from each category.<details><summary>Answer</summary>Sees rotor position vs command: a stalled motor from a clamp strike alarms (E01). Does not see anything downstream of the shaft: a slipping pinion, a creeping bit, a moving sheet (E17, E10, E22).</details></li>
<li>After the job: name five things you do before you walk away.<details><summary>Answer</summary>Finish or stop the file and stop the spindle; raise Z and jog clear with everyone outside the cutting area; close the keypad, end the loaded/paused file and remove the key; clear and clean the deck and stow the bit; report faults. Leave the machine powered for lab staff. Users never power down the machine; E-stop is for emergencies.</details></li>
<li>Name the three buttons on our pendant and what each does.<details><summary>Answer</summary>Reset re-enables the drives after an E-stop (twist the E-stop to release it first); green Start starts the spindle (when output 1 and the key allow it); E-stop cuts spindle power at once and motor power about 5 s later. <a href="#stops">Stops</a>.</details></li>
<li>Where does the Z-plate's clip go, and where does the plate go back to?<details><summary>Answer</summary>Nowhere new: the clip stays clamped on the aluminium carriage plate; the circuit runs through plate → spindle → collet → bit. The plate goes back in its holder on the YZ car with the lead coiled. Never put the clip on the bit or nut: the spindle whips it off.</details></li>
</ol>
`;

export const FIRSTJOB = `
<p>The whole flow for one plywood part, in order, with the command you type at each step. Section 3 has the detail behind every line; this is the skeleton to hold in your head.</p>
<ol class="sb-firstjob">
<li><b>At the computer.</b> Autodesk Fusion (the lab's usual CAM): stock measured (write the thickness down), origin corner chosen, Z0 on the surface you will touch (lab convention for through-cuts: bed), screws placed in the waste, tabs or onion skin on every freed part, feeds computed (plywood: 14 000 rpm, 4200 mm/min, 3 mm per pass). Post with the ShopBot OpenSBP post, mm.</li>
<li><b>Read the .sbp</b> in a text editor: <code>&amp;PWZorigin</code>, units, <code>MS</code>, <code>TR</code>, the first <code>JZ</code> and <code>M3</code>. Anything surprising: back to step 1.</li>
<li><b>Power.</b> Control box on → PC and SB3 (Move/Cut mode, <code>SM</code>) → Spindle RPM Control window open → key ENGAGED → E-stop twisted to release, pendant <b>Reset</b> → dust collector on, at the collector. The machine settings are already loaded; do not reload them.</li>
<li><b><code>C5</code></b>, the standard warm-up, if the spindle is cold. <b><code>C3</code></b> home.</li>
<li><b>Stock on.</b> Spindle stopped, key OFF and removed, keypad closed, no file loaded or paused. Sheet flat, screwed down where the CAM said. Key back in.</li>
<li><b>Bit.</b> Spindle stopped, key OFF and removed, keypad closed, no file loaded or paused. ER25 collet snapped into the nut, bit in (shank ≥ 75 % in the collet), then thread the assembly onto the spindle. Use the tightening method demonstrated for the standard ER25 nut supplied for this HSD spindle. Key back in.</li>
<li><b>XY zero.</b> <code>K</code> to jog to the origin corner, close the keypad, <code>Z2</code>. Write the base coordinates down (you will need them after any E-stop).</li>
<li><b>Z zero.</b> Clip stays on the carriage plate; plate on the bed (or stock top — whatever <code>&amp;PWZorigin</code> says), input 1 test, <code>C2</code> (always C2 — no manual zeroing), plate stowed.</li>
<li><b>Air cut.</b> <code>FP</code>, Offset = 3D, bit raised above the stock by more than the deepest cut, run it with the spindle off and watch the path. Then Offset = No Offset; <code>C2</code> again if Z was moved.</li>
<li><b>Cut.</b> RPM typed, Enter → <code>FP</code> → at the prompt “Press START on control before pressing OK”: pendant <b>START</b> → spindle running at the commanded speed, its display shows the rpm → <b>OK</b> → cutting begins. Hand at the spacebar for the first plunge. Watch the chips. Stay.</li>
<li><b>Done.</b> Finish or stop the file; stop the spindle. With everyone clear, raise Z and jog clear; use <code>JH</code> only if the route to working XY 0,0 is clear. Close the keypad, end any loaded/paused file and remove the key before cleanup. Collector off; parts out, screws out, deck vacuumed, racks brushed, bit stowed. Report faults. Leave the machine powered for lab staff; users never power down. Use E-stop in an emergency.</li>
</ol>
`;

export const CALL_STAFF = `
<p>Stop (E-stop in an emergency). Before reaching in: spindle off and stopped, key OFF and removed, keypad closed, no file loaded or paused. Get a signed-off staff member before continuing if you see any of these:</p>
<ul class="sb-rules">
<li>A driver alarm (red LED, "location no longer accurate") for the second time in a session.</li>
<li>Any fault code on the spindle controller's display.</li>
<li>C3 nags "move off prox" or runs into the end of the table.</li>
<li>Input 4 keeps flashing after Reset; input 1 does not light in the circuit test.</li>
<li>A damaged, pinched or hot motor or spindle cable; the dust hose off the foot or split.</li>
<li>Smoke, embers, burning smell, or hot dust under the brush.</li>
<li>A bit that pulled out, snapped, or hit a screw or clamp.</li>
<li>Anything in the glossary marked <b>staff only</b> (VN, VL, SF, ZT, TS offsets, eccentrics, pinion re-engagement, VFD parameters).</li>
</ul>
`;

export const PREFLIGHT = `
<p class="sb-aside">Print this section on its own and keep it at the machine. Tick every line, in order, every time. If a line cannot be ticked, stop and ask.</p>
<div class="sb-preflight">
<div class="sb-pf-col"><h4>Before power</h4>
<ul class="sb-ticks">
<li>Signed-off operator present; second person knows the E-stop (wall pendant by the monitor)</li>
<li>Glasses, ear protection; no gloves, loose sleeves, hair, lanyards</li>
<li>Table and rails clear of tools, offcuts, clamps from the last job</li>
<li>Dust hose on the foot, brush skirt intact</li>
<li>Key OFF and in your pocket for the bit change; bit correct and sharp, collet clean, nut torqued, stick-out minimal</li>
<li>Stock: thickness measured and written down, flat on the deck</li>
<li>Hold-down planned: screws/clamps outside every toolpath, tabs or onion skin for freed parts</li>
</ul></div>
<div class="sb-pf-col"><h4>Power and zeroing</h4>
<ul class="sb-ticks">
<li>Control box on → E-stop twisted to release, pendant <b>Reset</b> pressed (input 4 not flashing) → PC on, SB3 open in Move/Cut mode (SM)</li>
<li>Spindle RPM Control window open; interlock key in and ENGAGED; dust collector switched on at the collector</li>
<li>C5 warm-up at the start of the day or after 4 h idle</li>
<li>C3: machine homes on both proximity switches without complaint</li>
<li>Read the .sbp header: mm, and which surface is Z0 (<code>&amp;PWZorigin</code>: material top or table), feed, rpm, first Z move sane</li>
<li>Jog to the CAM file’s XY origin (centre or corner); Z2 (or ZX/ZY). The drawing uses the material centre</li>
<li>C2: clip in place on the carriage plate, plate under the bit on the surface the file expects; touch plate to bit — <b>input 1 lights and goes out</b>; run C2 (two touches, lift); clip stays on the plate, Z-zero plate back in its holder on the car</li>
<li>Keypad closed before FP</li>
</ul></div>
<div class="sb-pf-col"><h4>Running</h4>
<ul class="sb-ticks">
<li>Air cut a new file: FP with Offset = <b>3D</b>, bit raised above the stock by <b>more than the file's deepest cut</b>, spindle may stay off; then Offset = <b>No Offset</b> and C2 again if you moved Z</li>
<li>RPM typed in the Spindle RPM Control window and <b>Enter</b></li>
<li>FP → prompt “Press START on control before pressing OK”: pendant <b>START</b>, spindle at commanded speed, VFD shows the rpm, <b>then</b> OK (no separate VFD RUN)</li>
<li>Hand near the spacebar, E-stop in reach, for the first plunge and the first pass</li>
<li>Watch the chips: ribbons/curls good, dust and smoke bad</li>
<li>Never leave the room while it runs</li>
</ul></div>
<div class="sb-pf-col"><h4>After</h4>
<ul class="sb-ticks">
<li>File finished/stopped, spindle stopped; raise Z and jog clear with everyone outside the cutting area; collector off</li>
<li>Key OFF and removed, keypad closed, no loaded/paused file before clearing parts, screws and offcuts; deck vacuumed, racks and rails brushed</li>
<li>Bit removed, cleaned, back in its place; collet checked</li>
<li>Material, cutter, feed, rpm and any fault recorded in your job notes; problems told to staff</li>
<li>Machine left powered for staff. Users never power down; E-stop is for emergencies</li>
</ul></div>
</div>
`;

export const LAB_SOURCES = [
  [56, "Fab Academy 2025 Reykjavík: computer-controlled machining (plywood settings, Z on bed, tabs)", "https://fabacademy.org/2025/labs/reykjavik/students/magnus-petursson/"],
  [57, "Fab Academy 2025 Ísafjörður group: 12 mm birch ply tests 10–18k rpm / 500–4000 mm/min", "https://fabacademy.org/2025/labs/isafjordur/group_assignments/group_week07/"],
  [58, "Fab Academy 2023 Akureyri, A. Sæmundsson: 6 mm 2-flute 14 000 rpm 5000 mm/min", "https://fabacademy.org/2023/labs/akureyri/students/andri-semundsson/assignments/08_ComputerControlledMachining/"],
  [59, "MIT CBA feeds and speeds table", "https://pub.pages.cba.mit.edu/feed_speeds/"],
  [60, "Fab Lab Reykjavík 2016 instructor material: screw clearance rule, Icelandic ShopBot safety manual (C2 requires input 1 indication)", "https://archive.fabacademy.org/2016/fablabreykjavik/students/112/Week7LessonsLearned.html"],
  [61, "Easy Composites EB700 tooling board datasheet (cutting data)", "https://media.easycomposites.co.uk/datasheets/EC-TDS-EB700-High-Temperature-Epoxy-Tooling-Board-v2.pdf"],
  [62, "Lab notes, University of Iceland PRSalpha, Oct 2026 (RPM after pause, Enter in the Spindle RPM Control window, Fusion post observations) — unpublished", ""],
  [63, "HÍ PRSalpha local configuration and operating procedures, October 2026 — unpublished", ""],
  [64, "Lab photographs of the HÍ PRSalpha, Oct 2026 (control-box, motor, spindle and VFD nameplates; wall-mounted pendant; cabinet rotary disconnect; ground clip on the carriage plate) — unpublished", ""],
];
