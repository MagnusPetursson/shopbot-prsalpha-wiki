# ShopBot PRSalpha 144-60: operating procedures
Machine: University of Iceland prototyping lab, PRSalpha 144-60, alpha controller, HSD-class spindle with VFD.
Audience: first-time CNC students. References use the source tags below.
**Source tags**
- [QS p.N] = Quick-Start Guide for PRSalpha and PRSstandard, Oct 2016 (printed page number)
- [UG p.N] = ShopBot User Guide, March 2015
- [CR p.N] = ShopBot Command Reference, 2015
- [HD p.N] = Holding Down Material for Cutting, 2016
- [MS p.N] = PRS Maintenance Schedule, 2016
- [TM p.N] = SBG00203 Troubleshooting Mechanicals, 2014
- [XY p.N] = Manually Setting X and Y Zero Locations, 2016
- [AG p.N] = PRSalpha Assembly Guide, May 2022
- [FAQ] = ShopBot Technical Q&A / FAQ, Z-zero plate
- [54] = Autodesk ShopBot OpenSBP post, listed in Sources

## 0. Safety rules that apply to every step
- Wear eye and ear protection. This applies to the operator and to everyone watching [QS p.5].
- Wear closed-toe shoes. Never wear gloves at the machine [QS p.5].
- Never put your hands on the rails. The machine can move without warning [QS p.5].
- Never leave the machine running unattended. A spinning tool makes heat and is a fire risk. Keep a working extinguisher within reach [QS p.5; UG p.5].
- Know where the E-stop is before operating. This machine has **one**: the red mushroom on the wall-mounted pendant by the monitor. The red-and-yellow rotary handle on the control cabinet is the power disconnect, not an E-stop [QS p.5].
- During a cut, stand within reach of the keyboard or the STOP button and away from the tool path [UG p.6].
- Position the dust skirt correctly. It guards against flying particles [UG p.6; UG p.45].
- Practise with the software before you turn on the spindle [UG p.5].
- Before reaching into the machine: spindle off and stopped, interlock key OFF and removed, keypad closed, no file loaded or paused. Keep the key in your pocket while loading or moving material, changing a bit or cleaning [UG p.5; QS p.5].

## 1. Power-up and leaving the machine
### Power-up order
1. Check the area first. Inspect the wiring, the dust hoses and the table surface [MS p.3]. Check the rails and racks. They must be clean, with no chips or scraps [QS p.18]. Do not run the machine if a motor cable is damaged [QS p.18].
2. Do not push the gantry by hand. If it looks out of square against the end stops, tell staff; squaring and pinion alignment are a staff task [MS p.3; TM p.19].
3. Turn on the control box. The box must be on before SB3 opens, or the software cannot connect [UG p.10; QS p.11]. A "thunk" when the motors power up and a hum at standstill are normal [UG p.64].
4. Release the E-stop by **twisting** it if it was latched, then press **Reset** on the wall-mounted pendant by the monitor (its three buttons are Reset, Start and E-stop). Input 4 on the screen must stop flashing before the machine will move [CR p.39; UG p.47].
5. Start the PC and launch SB3 (version 3.8.70 on this machine). Double-click the ShopBot 3 icon [QS p.10]. The correct machine settings are already loaded on the control PC; do not reload or change them. The ShopBot USB should use the same port every time [QS p.9]. **Sleep mode and screen savers must be off.** If they are on, a long file can stop mid-cut [UG p.10]. If SB3 starts in Preview mode, the tool is not connected. Check the box and the USB [UG p.10; CR p.27].
6. Open Spindle RPM Control (Tools → Spindle RPM Control). Keep this window open the whole session: SB3 talks to the VFD — the spindle's speed controller, the box with the rpm display — only while it is open [QS p.15].
7. With everyone clear of the machine, insert the spindle interlock key into the safety lockout next to the power switch and turn it to **ENGAGED** [QS p.12]. Before hands-on work, stop the spindle, turn the key OFF and remove it. Keep it in your pocket [UG p.5].
8. Switch the dust collector on **at the collector itself**; it is switched manually, not by SB3. It stays on for the whole job [MS p.3].
9. Warm up, home, then zero: C5 (the lab's standard warm-up), then C3, then C2 [MS p.3].
### Leaving the machine
**Users never power down the machine.** Finish or stop the file and leave the machine powered for lab staff. Do not exit SB3, turn off the control cabinet or switch off the spindle controller. Use the E-stop in an emergency, not as an end-of-session switch. Follow “After the job” for spindle stopping, key removal and cleanup.
## 2. Keypad and jogging (K / SK)
### Opening and closing the keypad
- Type **K** (shortcut for **SK**) or click the yellow keypad icon in the red Position window [QS p.11; CR p.26].
- The keypad works **only in Move/Cut mode** and not in Preview [CR p.26]. If the icon is missing, select Mode → move/cut [QS p.11].
- Opening the keypad lights **output 4** in the Position window [QS p.12].
- Close it with the X in the corner [QS p.11].
- If a part file called SK, the file continues when you press Esc [CR p.27].
- Esc generally steps you back one level in SB3 [UG p.11].
### Moving the axes
- **← →** move X. **↑ ↓** move Y. **Page Up / Page Down** move Z [CR p.26; QS p.11].
- You can also click the blue arrows on screen [QS p.11].
- **/** moves on the +X+Y diagonal; **`\`** moves on the +Y−X diagonal. Add Alt to reverse the diagonal [CR p.26].
- Hold **Ctrl** with an arrow to move at **Jog** speed instead of Move speed [CR p.26].
### Speeds
- Move (feed) and Jog (rapid) speeds appear on the left of the Control Console. You can type new values there [UG p.10].
- You can also set them with **MS** (move), **JS** (jog) or **VS** (all eight speeds) [CR p.16; CR p.20; CR p.42].
- Units are in/s or mm/s, not per minute [CR p.20].
- Jog speed is normally faster than Move speed and is used for positioning [UG p.39].
### Continuous vs Fixed keypad modes
- **Continuous (normal):** the axis moves while you hold the key [XY p.5].
- **Fixed:** click **Fixed** or press **D**. Each tap then moves one set increment. Set the increment in the box that appears, or in VD under "KeyPad Fixed Distance" [CR p.26; XY p.5]. Click Fixed again or press Esc to return to continuous motion [XY p.5]. Use Fixed for fine positioning near the stock.
### Before a test move
- Park Z at a safe height below the Z proximity switch, near the middle of the deck [QS p.11].
### Spacebar vs the yellow/red STOP button
- **Spacebar (and Enter, or the on-screen Stop button):** a ramped software stop. Z pulls out of the material and position is kept, so you can continue [CR p.39]. **Treat the spindle as live afterwards**: it may keep turning, coast, or restart when you resume. A spacebar stop is not isolation. Before reaching near the bit, confirm that the spindle has stopped, the interlock key is OFF and removed, the keypad is closed and no file is loaded or paused. Keep clear before re-engaging the key or restarting [UG p.5; QS p.5; QS p.17].
- **Yellow-and-red E-stop on the pendant:** a true E-stop wired to ES1–ES4 on the control board. It cuts power to the motors **and** the spindle [UG p.47]. On this machine it is the only E-stop; twist to release.
### Limits while jogging
- If a limit (input 2 or 3) stops the keypad, the next keypad move ignores limits so you can drive off the switch. A new limit will **not** stop that move [CR p.38].

## 3. Homing (C3, XY with proximity switches)
- **C3** homes X and Y. The machine touches off each proximity switch, giving a repeatable start point [QS p.15]. It also sets the table base coordinates correctly [UG p.20].
- **Input 2** is the X proximity switch and **input 3** is the Y proximity switch. Both are configured as limit switches [CR p.39; UG p.46]. By default, when either one triggers, motion stops and a "table limit" message asks whether to continue [UG p.46–47]. **VN** configures what these inputs do [UG p.47; CR p.38].
- Students never change VN or disable limits; report a limit fault to staff [CR p.39].
- If the machine stops with a limit message and nothing is at the end of the table, tell staff.
- "Move off prox" prompt: C3 asks you to move the spindle carriage off a switch if it starts out sitting on one. Repeated prompts while the carriage is clear mean an input or target fault (polarity, target alignment, wiring). Report it rather than defeating the limits.
- A proximity target must be met before the hard stop.
- Where C3 lands (its offset from the switches) is set in **TS** (Tools → ShopBot Setup) [QS p.15; XY p.3–6; CR p.30].
### When to rehome (C3)
- At the start of every session [MS p.3].
- Whenever the power has been off [UG p.20].
- After the gantry was pushed by hand or moved with the motors unpowered [UG p.20].
- After an E-stop on an alpha. Re-home XY and re-zero Z before cutting again [CR p.39; QS p.17].
- After a driver fault or "location no longer accurate".
- After you have moved the zero point and want the standard one back [UG p.20].

## 4. Material setup and hold-down
### General rules
- Never cut material that is not firmly secured. This includes any cutouts or offcuts the file will free [UG p.5].
- Never push material by hand into a moving bit [UG p.5].
- Small cut-free parts can be caught by the bit and thrown. Choose the hold-down method as part of planning [HD p.5; QS p.16].
- The worst hazard is the bit hitting a clamp or screw. Plan every path, including rapids, so clamps are clear [UG p.44; HD p.6].
### Screws
- Screw into the spoilboard. This is quick and suits most materials [HD p.5].
- Keep every screw clear of the cut path [HD p.5].
- For larger jobs, run a separate drilling file first to make screw holes in safe places, then screw down and run the main cut [HD p.5; UG p.44].
- While that drilling file runs, one clamp at each end is enough. An end mill drilling puts little sideways force on the stock [HD p.5].
### Clamps
- Clamps hold strongly where there is no spare material for screws. Plan carefully so the bit avoids them [HD p.6].
- Rapids need enough clearance height to pass over clamps [UG p.44].
- Scrap-wood clamps can work: a rabbeted block, with the rabbet slightly shallower than the stock [HD p.6]; a flexible strip with a stop glued on [HD p.6].
- Spring clamps and pistol-grip clamps tend to move. Check that they actually hold rigidly [UG p.44].
### Tabs and onion skin (holding parts inside the sheet)
- **Tabs** are bridges of material left between the part and the sheet. CAM programs add them automatically [HD p.8]. SB3 can also add tabs when a file runs (FP Tab option, sized in VB) [CR p.11–12; UG p.45].
- **Onion skin:** set the final depth slightly short of the stock thickness, typically **.010″–.030″** depending on material and part size [HD p.8]. It holds better and is easier to sand off than thick tabs [HD p.8]. It fails if stock thickness varies or the table is not flat [HD p.8].
### What this lab uses
- Use **screws through the waste into the spoilboard, clamps, and shims under bowed stock**. Retain freed parts with tabs or an onion skin. Plan every screw and clamp position in CAM, clear of the full cutter envelope, and verify all paths.

## 5. Tool (bit) change
1. Make the spindle safe. Turn the spindle off [UG p.5]. Change bits only with the spindle stopped and the key OFF in your pocket [UG p.5]. Disengage the interlock key during bit changes.
2. Clean everything. The collet, nut, spindle taper and shaft must be completely clean. Use a wire or brass brush, compressed air and/or mineral spirits to remove dust or excess grease [QS p.15; QS p.18]. Small contamination causes misalignment, imbalance and slippage [MS p.3].
3. Assemble the ER25 collet into the nut **first**. Press the collet into the nut until it **clicks**. If it will not seat, press it in at a slight angle [QS p.15; TM p.15]. Check it: hold the nut upside down. The collet should hang without falling out [QS p.15].
4. Insert the bit into the collet [QS p.15]. The collet must grip **only the shank**. No part of the flute may enter the collet. Ideally the shank fills **at least 75 %** of the collet length.
5. Thread the nut, collet and bit together onto the spindle **without compressing the collet** [QS p.15].
6. Hand-tighten the nut [QS p.15; TM p.15]. It must go on easily. If it resists, **do not force it**. Back it off and start again. Once it is finger-tight, check the bit has not slipped.
7. Tighten the matching ER25 collet nut using the hook spanner on the nut and the 27 mm wrench on the shaft. Follow the tightening method demonstrated during induction; do not use a torque value for a different nut [QS p.15; TM p.15].
8. Do not over-tighten to stop a slipping bit. That damages the threads. A slipping bit means a dirty or worn collet [MS p.3].
9. **Re-zero Z after every bit change** [QS p.14].
### Collet facts
- This spindle uses **ER25 collets with the matching ER25 collet nut**. Select a collet that matches the tool shank [TM p.15].
- The collet size must match the bit shank. Metric and inch collets are not interchangeable [TM p.15].
- **Collet life:** collets are consumables; staff replace them on schedule or after any crash [MS p.3; TM p.13].
- Replace the collet immediately after any "event": it was dropped, a bit broke inside it, or a plunge bottomed out on it [MS p.3; TM p.13].
- Signs of a worn collet [TM p.14]: the bit creeps up into the collet and Z position is lost; bits break at sane feeds; a bit falls out; a bit is hard to pull out.

## 6. Z zero
### Choose the reference to match your CAM file
- **Material top:** best when depth must be precise, for example an inlay pocket [QS p.14].
- **Table (spoilboard) surface:** best for through-cutting wood, because sheet thickness varies [QS p.14].
- **The CAM setting and what you do at the table must match.** A mismatch ruins material and breaks bits [QS p.14].
- Z must be zeroed every time the machine is turned on and every time the bit is changed [QS p.14].
### C2 with the Z-zero plate
1. Work in Move/Cut mode [QS p.14].
2. Check that the ground clip remains clamped to bare aluminium on the carriage-plate edge. The circuit runs through plate → spindle → collet → bit. Never clip onto the bit or nut.
3. Place the plate directly under the bit, on the surface you chose [QS p.14].
4. **Test the circuit.** Touch the plate to the stationary bit. **Input 1** must light on screen and go out as soon as contact breaks [QS p.14]. If input 1 does not light and clear, **do not run C2; call staff**. ShopBot’s FAQ warns that a failed contact circuit lets the bit keep descending [FAQ]. If the bit reaches the plate during C2 and does not reverse, press the **spacebar**; if Z still moves, use the **E-stop**. Do not rely on C2 to detect a failed contact circuit.
5. Run **C2** or click the Z-zero button. Z touches the plate **twice**, then pulls up to a safe height [QS p.14].
6. Leave the clip on the carriage plate, coil the lead, and put the plate back in its holder on the YZ car — the carriage that carries the spindle across the gantry [QS p.14].
7. If the zero looks wrong, stop and call staff. Staff can check **MZ,0** over an open area and verify the plate thickness in **TS** (default **3.073 mm**) [TM p.11–12; MS p.3]. Keep hands clear during every commanded move. Before a hands-on check: spindle off and stopped, key OFF and removed, keypad closed, no file loaded or paused [UG p.5; QS p.5].
### Manual Z zero (ZZ): not taught
- Use **C2** for Z zero. Manual **ZZ** with a paper feeler is not part of the student procedure; ZZ is listed in the glossary for reference only [CR p.45].

## 7. XY zero: machine home vs job zero
### Home vs job zero
- **Machine home (C3):** a repeatable XY origin taken from the proximity switches [QS p.15]. C2 and C3 also set the **table base coordinates**, which software limit checking (SF/VL) uses [UG p.20; CR p.26].
- **Job (working) zero:** wherever you zero X and Y for this job. **Z2** zeros X and Y [CR p.43]. **ZX** zeros X only and **ZY** zeros Y only [CR p.44–45]. On the keypad, the blue **"Zero Axes"** button does the same [XY p.5]. **VA** sets the axes to any chosen value. VA 0,0 is equivalent to Z2 [UG p.18].
- Re-zeroing the working coordinates does not lose the base coordinates. **ZT** sets the base zero [CR p.44]. **ST** restores the working display to base coordinates [CR p.28; UG p.19].
- After setting a temporary 0,0, **write down the coordinates** so you can find it again [QS p.15].
- **2D offset in FP:** the current XY becomes the file's 0,0 for that run only, and Z is not shifted. Use it to place or nest parts [UG p.18–19; CR p.12].
### Fixed C3 offsets
- Where C3 lands relative to the switches is a staff setting (TS). Students never change it.

## 8. Loading and running a file
### Preview first (SP)
- **SP** switches to Preview mode. Running SP again clears the preview [CR p.28; UG p.11].
- **FP** opens the Part File dialog. Pick the `.sbp` file, then press Enter to accept the fill-in sheet and Enter again to run it in preview [UG p.13].
- FP also runs most G-code files (.tap, .nc). Select "ALL" file types to see them [CR p.12].
- In preview the tool does not move. The position readouts reset when you leave Preview [CR p.28].
- Use preview with software limit checking (SF/VL) to confirm every move stays inside the table [UG p.20; CR p.38].
### Move/Cut mode (SM)
- **SM** makes all commands drive the real machine [CR p.27].
- Click "Cut Part" or use File → Part File Load (FP) [QS p.16–17].
### What the FP fill-in sheet asks [CR p.12; QS p.16–17]
- Proportion X, Y, Z (default 1,1,1).
- Repetitions (default 1).
- **Offset: none / 1 = 3D / 2 = 2D.** None is the default.
- Plunge, used for template files.
- Tab feature on/off.
- Plunge from Z 0.
- Then click START or press Enter.
### Spindle warm-up (C5)
- Before cutting at the start of the day or after more than **4 h idle**, open Spindle RPM Control and run **C5**. It runs **9000, 10 000 and 12 000 rpm for 3 min each**, then stops the spindle [QS p.16]. Check that the cooling fan runs [MS p.3].
### Setting RPM (TR / Spindle RPM Control)
- **TR** opens the Spindle RPM Control window. In a part file, `TR,12000` requests 12000 RPM. This is a request, not a measured speed.
- To change speed by hand: with the spindle running, click the RPM value, type the new value, press **Enter**. The VFD display must match [QS p.16].
### Spindle-start order on a PRSalpha
- **Keypad test:** turn output 1 on in the keypad, then press the green **START** on the three-button pendant [QS p.12–13].
- **Running a file:** after Start/Enter in FP, SB3 shows the prompt “Press START on control before pressing OK”. **PRSalpha:** press the pendant **Start BEFORE clicking OK** [QS p.17].
- Start a job in this order: **1.** Spindle RPM Control window open, RPM typed, Enter [QS p.15]. **2.** FP → Start. **3.** Screen prompt “Press START on control before pressing OK” → pendant green **START** [QS p.17]. **4.** Verify the spindle is running at the commanded speed; the VFD (Yaskawa V1000) display should show the RPM you typed [QS p.16]. **5.** OK on screen → cutting begins. There is no separate RUN step on the VFD.
- Never assume the spindle is turning because the axes move; a stationary cutter can break when driven into stock.
### Air-cut practice
**Method 1, 3D offset** [QS p.16]:
- Raise the bit above the material and run FP with **3D offset**. The current XYZ becomes 0,0,0 and the file runs in the air.
- The gap between the bit and the stock **must be larger than the file's maximum cut depth**.
**Method 2, spindle off** [UG p.13]: run the file in Move/Cut with the spindle **off**, above the material, to check the motion.
Before the real cut, set Offset back to **"No Offset"** [QS p.17].
### Watch the first plunge
- Stay at the keyboard with your hand near the spacebar, and know where the E-stop is [UG p.6; QS p.5].
- Be ready to pause if anything looks wrong [QS p.5].
- Burning, smoke or excessive tool heat means something is wrong. Stop and report it; do not touch the cutter to test its temperature.

## 9. Pausing, stopping and resuming
### Software (soft) stop
- Press the **spacebar** (or Enter, or the on-screen Stop). Motion ramps down and Z lifts out of the material [CR p.39; QS p.17].
- Position and zero are **kept**, so you can resume with no loss of location [CR p.39; QS p.17].
- SB3 then prompts you for what to do next [UG p.14].
- At very slow speeds the stop is immediate [UG p.14].
- After a spacebar stop you can resume **without resetting the drivers** [UG p.47]. This is not isolation: before reaching in, stop the spindle, remove the interlock key, close the keypad and end the loaded/paused file. Keep clear before restarting.
### Emergency stop (PRSalpha)
- The E-stop **immediately** stops the tool and removes spindle power. After about **5 s**, motor power is removed too [CR p.39].
- **Position is lost:** rehome XY with C3 and re-zero Z with C2 before cutting again [CR p.39; QS p.17].
- Use the E-stop for emergencies. Use the spacebar for routine stops [CR p.39].
### Resuming a file
- **FG** loads a file in Goto/Single-Step mode. You can single-step or start from a chosen line [CR p.11].
- FG can jump automatically to the **last line executed**, for example after a broken bit [CR p.11].
- After an E-stop or driver fault: have staff clear the cause, rehome and re-zero first, then use FG [CR p.39; CR p.11].
- Before resuming, enter the required RPM and press Enter. Confirm the actual speed on the VFD display before allowing cutting to continue; do not assume the previous RPM was retained.
- **3D offset** (Offset = 1) treats the current X, Y and Z as 0,0,0 for that run [CR p.11–12]. Do not use it to resume a real cut unless you have deliberately set the start position. It shifts Z [QS p.16].
- A file can contain **PAUSE**, which waits for a key, or **PAUSE n**, which waits n seconds. A comment line just before it is displayed as the message, for example "Change bits" [UG p.27].

## 10. After the job
1. Finish or stop the file. Stop the spindle (output 1 off) and wait until the bit has stopped [QS p.13].
2. With everyone clear, raise Z to a safe height and jog the gantry clear of the work. **JH** raises Z to Safe-Z, then jogs to the current **working** XY 0,0, not the proximity-switch home; use it only if that route is clear [CR p.17].
3. Close the keypad and end any loaded or paused file. Turn the interlock key OFF and remove it before reaching in. Keep it in your pocket during cleanup [UG p.5; QS p.5]. Switch the dust collector off at the collector.
4. Remove parts, hold-downs and loose offcuts. Vacuum the deck and brush chips from the rails and racks. Remove, clean and stow the bit; inspect the collet and nut [QS p.18].
5. Record the material, cutter, feed, rpm and any fault in your job notes. Report faults or damage to staff.
6. **Leave the machine powered for lab staff. Users never power down the machine.** Do not exit SB3 or switch off the control cabinet or spindle controller. In an emergency, press the **E-stop**.
## 11. Command glossary
| Command | Meaning | Src |
|---|---|---|
| MS | Set Move (feed) speed, XY/Z/A/B, in/s or mm/s | [CR p.20] |
| JS | Set Jog (rapid) speed, XY/Z/A/B | [CR p.16] |
| VS | Set all 8 move and jog speeds in one sheet | [CR p.42] |
| TR | Opens Spindle RPM Control; `TR,n` requests n RPM in a file (SB3.5.5+) | [QS p.15–16] |
| C2 | Z-zero with the plate (input 1): two touches, then pull-up | [QS p.14] |
| C3 | XY homing using the proximity switches (inputs 2/3) | [QS p.15; UG p.20] |
| C5 | Spindle warm-up: 9000/10000/12000 RPM for 3 min each, then off | [QS p.16] |
| C6, C7, C9 | Custom-cut slots. Student procedures use the standard C2, C3 and C5 routines. Do not remove C-commands from posted files | — |
| JZ | Jog Z to a location (or by a distance in relative mode) | [CR p.17] |
| JH | Safe-Z, then jog to XY 0,0 | [CR p.17] |
| J2 | Jog X,Y at Jog speed | [CR p.15] |
| J3 | Jog X,Y,Z at Jog speed | [CR p.16] |
| M2 / M3 | Move XY / XYZ at Move (cutting) speed | [CR p.17–18] |
| MZ | Move Z at Move speed (`MZ,0` checks Z zero) | [CR p.21; TM p.11] |
| SA / SR | Absolute / relative distances; use absolute in part files | [CR p.25; CR p.28] |
| VD | Display values: linear units 0 = in, 1 = mm (3rd field), keypad fixed distance, logs | [CR p.35; UG p.21] |
| VL | Staff only: table limits in base coordinates, plus a limit-check flag | [CR p.38; UG p.20] |
| VN | Staff only: input assignment: limits on/off, input 4 stop mode, input modes | [CR p.38–39] |
| VI | Comm port and driver channel settings (staff only) | [CR p.37] |
| VO | Temporary tool offset (dual Z / air drill) | [CR p.40] |
| SO | Set output n on/off: `SO,1,1` = output 1 on | [CR p.27; UG p.48] |
| SK (K) | Keypad arrow control; Move mode only | [CR p.26] |
| ZZ | Zero Z here (reference only; students use C2) | [CR p.45] |
| Z2 | Zero X and Y here | [CR p.43] |
| Z3 | Zero X, Y and Z here | [CR p.44] |
| ZX / ZY | Zero X only / Y only | [CR p.44–45] |
| ZT | **Staff only.** Redefines the table base coordinates that limit checking and C3 rely on; never use it for a job origin (use Z2). ST resets the working display to base | [CR p.44; CR p.28] |
| FP | Load and run a part file (fill-in sheet: proportion, reps, offset, tabs) | [CR p.12] |
| FG | Run a file in Goto/single-step mode; resume from the last line | [CR p.11] |
| SP / SM | Preview mode / Move-Cut mode | [CR p.28; CR p.27] |
| PAUSE | In a file: wait for a key (`PAUSE n` = n seconds) | [UG p.27] |
| CN,90 | Calls custom cut 90; the CAM post uses it to expose controller variables for a units check | [54] |
| &var | Part-file variable, e.g. `&Zdepth = -0.52` then `MZ,&Zdepth` | [UG p.28] |
| MO | Staff only: motors off and all outputs off. Not an end-of-job command | [CR p.20] |
| TS | Staff only: ShopBot Setup: plate thickness, prox-switch offsets | [CR p.30; TM p.12] |
| SF | Staff only: file and move limit checking on/off | [CR p.26] |

## 12. Inputs, outputs and status indicators
| I/O | Function on this machine | Src |
|---|---|---|
| Input 1 | Z-zero plate. Lights when bit and plate touch | [QS p.14] |
| Input 2 | X proximity switch, configured as a limit (VN) | [CR p.39; UG p.46] |
| Input 3 | Y proximity switch, configured as a limit (VN) | [CR p.39; UG p.46] |
| Input 4 | Stop circuit. On an alpha: normally-closed E-stop, wired ES1–ES4; cannot be reassigned | [CR p.39; UG p.47] |
| Input 5 | Z proximity switch | [2] |
| Output 1 | Spindle/router (on an alpha, used with the pendant Start) | [QS p.12–13; UG p.74–75] |
| Output 4 | Safety/"tool active" output; on during motion and with the keypad open | [CR p.27; UG p.48; QS p.12] |

### Reading the indicators
- An active input turns **green** in the input section of the Position window [UG p.46].
- Output 4 lights when the keypad opens [QS p.12]. Its default mode is −1: on with the warning signal before a move, off at the end of it [CR p.27].
- Inputs are 5 V TTL. An input reads ON when pulled to ground, which is why the Z-plate clip closes input 1 [UG p.46].
- Outputs are 5 V TTL, about 5 mA. They signal relays and must not power accessories directly [UG p.47].
- **Motor driver LEDs (alpha AS-type drivers):** green **OPERATION**, red **ALARM**. The red LED blinks a fault code.

## 13. Driver and controller alarm handling (alpha)
- If an obstruction or heavy cutting load makes a closed-loop alpha driver fall behind, it tries to correct, then raises an **alarm**, stops the machine and shows an alarm message.
- Typical SB3 wording: **"Driver fault! (location no longer ACCURATE)"**.
- What to do:

1. **Stop.** Do not restart the file. The displayed coordinates can no longer be trusted [QS p.17].
2. Make the spindle safe: off and stopped, key OFF and removed, keypad closed, no file loaded or paused [UG p.5; QS p.13].
3. Record the screen message and tell staff which axis faulted. Staff read the **red LED blink pattern** on the driver; students do not open the control cabinet.
4. Staff find and remove the cause: a collision, clamp, bound axis, too deep or too fast a cut, or damaged cable. Motor and driver faults can show only during movement.
5. **Never unplug a motor cable with power on.** It can destroy the driver [UG p.64].
6. Reset the drivers. A software spacebar stop does not need this; a driver or E-stop event does [UG p.47].
7. **Rehome with C3 and re-zero Z with C2**, then resume with FG if appropriate [CR p.39; CR p.11].
8. Do not reset repeatedly into the same fault. Report it to staff.
- If an axis is not powered or locked after reset, stop and call staff. Connector and driver checks are staff tasks [UG p.69–70].
- Drivers and motors run warm. Excessive heat indicates a fault; report it rather than touching electrical equipment [UG p.64].

## 14. Maintenance checklist
Students clean accessible surfaces, inspect tooling and report problems. Mechanical adjustments, electrical checks, lubrication and servicing below are **staff tasks**, not permission to power down or open the machine.
### Daily, before cutting [MS p.3]
1. Run C5 (9000, 10 000 and 12 000 rpm for 3 min each). Confirm the spindle fan runs.
2. Check the bit, collet and collet nut for wear and debris. Keep the spindle body, fans and airways clean. Tapers, shafts and collets must be scrupulously clean. Use the tightening method demonstrated during induction; do not substitute a torque for another nut.
3. Square the gantry against the end stops, hold it there, and press reset.
4. Push-pull test each motor area: X1, X2, Y, Z. A slight click is acceptable, but no movement beyond a few thousandths. If there is play, adjust the motor-mount spring (**3½ turns after slack is removed**) and/or tighten the set screws.
5. Move the machine around at both M and J speeds, or run a short warm-up routine.
6. Run C3.
7. Run C2.
8. Verify the zero with MZ,0 over the surface.
9. Visually inspect the machine, wiring, dust hoses and table.
10. Check that the dust collector works.
Also daily [QS p.18]:
- Clean bits with solvent and discard dull or damaged ones.
- Check cables for cuts and pinch points.
- Keep the rails and gear racks clear of chips.
### Every 40 h of use [MS p.3]
1. **Rack greasing:** Clean the X, Y and Z racks and pinions with a small brush. Add a **BB-sized blob of light grease every 6″**. Run each axis to its extents about **10 times**. Wipe off the excess and redo the X/Y push-pull test.
2. Clean the Z-assembly V-bearing edges with Scotch-Brite and WD-40, then wipe with light grease or machine oil. Clean and adjust the V-rollers as needed.
3. Scrub the X and Y V-rails with Scotch-Brite soaked in WD-40, then wipe clean. Clean roller buildup with a small brass brush.
4. Repeat the push-pull test and adjust the motor-mount springs (3½ turns past contact) or set screws.
**Grease (staff):**
- MS says **light** grease [MS p.3].
- TM recommends **heavy automotive or industrial** grease [TM p.7].
- UG says **any regular bearing grease**, and that grease does not trap debris badly [UG p.63].
- The Quick-Start, by contrast, says to **remove** excess grease from the collet and nut, so keep grease off tooling [QS p.15].
### Monthly (from Troubleshooting Mechanicals)
- Drop and re-engage the X and Y pinions, at least monthly or whenever there is play. Press with 15–20 lb while tightening the 4 motor-plate screws [TM p.4–5].
- Check that the YZ-car lower rollers are seated [TM p.9].
- Check that the spindle is tight in its bracket [TM p.17].
### Quarterly (40 h/week) to semi-annual (20 h/week): everything above, plus [MS p.3–4]
1. With the motors removed or disengaged from the racks, move each axis through its full travel. Check for looseness or binding.
2. With the motors removed, spin-test every X and Y car V-roller.
3. Tighten all pinion set screws. Replace pinions and key stock if they show movement.
4. **Adjust the Z-axis V-roller bearing eccentrics** with the provided flat wrench.
5. Check the spindle is square and aligned.
6. **Remove the lower YZ-car V-roller dust covers and adjust the eccentrics.**
7. Update software and firmware.
8. Back up settings with **US** (a `C:\SB BKUP` folder exists if ShopBot did a support visit). Restore with **UR**.
### Semi-annual (40 h/week) to annual (20 h/week): everything above, plus [MS p.4]
1. Replace all pinions. TM also says pinions are consumables, to be replaced every 6–12 months [TM p.7].
2. Remove, clean, inspect, reassemble, lubricate and adjust the complete Z extrusion assembly.
3. Replace the collets, and the collet nuts if they are damaged.
### Z bearing adjustment outline (staff task)
- **Too loose:** the top or lower bearings spin freely and do not touch the inner captured rail. The Z axis shows sideways "slop" [TM p.18].
- **Too tight:** Z loses steps, binds or stops abruptly. The inner rail wears early [TM p.18].
- Adjust the eccentrics with the flat wrench a little at a time [MS p.4]. The full procedure is ShopBot's "Adjust PRS Z Car Bearings" document [TM p.18].
- Uneven or slanted step-downs: first check the spindle is tight in its bracket, then the Z bearings [TM p.17].
### YZ-car lower wheel adjustment outline (staff task)
- **Test:** grip the bottom of the YZ car and pull it toward you. It must not move away from the cross-beam [TM p.9].
- **Symptom when wrong:** a part cuts correctly on 3 sides with a bad 4th side, consistent with cut direction [TM p.9].
- **Hint:** drop the Y pinion out of the rack first, so you can feel how freely the car rolls while held against the beam. Re-engage the pinion afterwards [TM p.10].
- **Adjustment:** the two lower bearings have eccentric nuts. Rotate each **slightly counter-clockwise** to tighten [UG p.64]. The full procedure is "Adjusting the Lower Wheels on the YZ car" [TM p.10].
### Squareness check
- Cut or scribe a large rectangle (for example 30″×50″) and compare the diagonals. They should be equal [TM p.19].
- If they differ, first re-square the gantry against the end stops [TM p.19–20].
