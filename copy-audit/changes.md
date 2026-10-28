# Copy pass: ShopBot wiki

Copy-only pass against the interface-copy rule: controls are verbs or verb + object; headings are nouns or states; helper text is one factual sentence. Teaching prose, procedures and safety wording were kept in substance; only taglines, teasers, rhetorical questions, duplicate headings and filler changed. Generated from `copy-audit/edits.py` (the same list that was applied to the source).

**86 source edits.** By kind:

- heading: 28
- helper: 10
- page title: 8
- heading + helper: 8
- lead: 7
- link: 5
- summary: 4
- button: 4
- caption: 2
- tooltip: 2
- nav + page title: 1
- lead + link: 1
- list title: 1
- step title: 1
- figure label: 1
- label: 1
- status message: 1
- helper (safety): 1

## Changes

| # | Where it shows | Kind | Before | After | Reason |
|---|---|---|---|---|---|
| 1 | rules.html h1, <title>; handbook ch. 01 (`site.mjs`) | page title | `title: "Before you touch it"` | `title: "Safety rules"` | tagline → noun |
| 2 | machine.html h1, <title>; handbook ch. 02 (`site.mjs`) | page title | `title: "What moves, and why"` | `title: "How the machine works"` | tagline → plain title |
| 3 | run.html h1, <title>; handbook ch. 03 (`site.mjs`) | page title | `title: "Your first job"` | `title: "Running a job"` | second-person tagline → task name |
| 4 | trouble.html nav, h1, <title>, pager, index TOC; handbook ch. 06 + contents (`site.mjs`) | nav + page title | `nav: "Something’s wrong", title: "Something went wrong"` | `nav: "Troubleshooting", title: "Troubleshooting"` | exclamation-style phrase → trade term |
| 5 | feeds.html h1, <title>; handbook ch. 07 (`site.mjs`) | page title | `title: "Feeds, speeds and the post"` | `title: "Feeds, speeds and CAM"` | match the nav label (Feeds & CAM) |
| 6 | handbook ch. 08 title (`handbook.mjs`) | page title | `P.maintain.title = "Looking after the machine";` | `P.maintain.title = "Machine maintenance";` | soft phrase → noun |
| 7 | machine.html lead; index contents (`site.mjs`) | lead | `sub: "Four motors, three axes, one spindle. Turn the model; pick one of the ten faults in its side panel to watch it happen."` | `sub: "Axes, drives, spindle and controls, with a 3D model that animates ten faults."` | slogan rhythm + instructions repeated in the viewer |
| 8 | preflight.html lead; index contents (`site.mjs`) | lead | `sub: "Print it. Tick it, in order, every time."` | `sub: "Print it and tick every item, in order, for every job."` | slogan rhythm → one sentence, same rule |
| 9 | trouble.html lead; index contents; handbook ch. 06 (`site.mjs`) | lead | `sub: "Start from what you see. Stop first, diagnose second."` | `sub: "Find the fault from the symptom. Stop the machine before diagnosing."` | slogan → plain instruction (stop-first kept) |
| 10 | feeds.html lead; index contents; handbook ch. 07 (`site.mjs`) | lead | `sub: "One number decides most cuts. Most machine failures are decided at the computer."` | `sub: "Chipload, starting feeds and the CAM checklist. Most machine failures start in CAM."` | teaser → contents + the same claim |
| 11 | handbook ch. 02 lead (`handbook.mjs`) | lead | `P.machine.sub = "Four motors, three axes, one spindle. What each part does, and what the motors cannot see.";` | `P.machine.sub = "Axes, drives and spindle: what each part does and what the motors cannot detect.";` | slogan rhythm |
| 12 | index.html hero lead + button link (`site.mjs`) | lead + link | `<p class="sb-lead">How it works, how to run it, what goes wrong.</p><a class="sb-cta" href="rules.html">New here? Start with the rules <i>→</i></a>` | `<p class="sb-lead">Operation, troubleshooting and maintenance.</p><a class="sb-cta" href="rules.html">Read the rules <i>→</i></a>` | triad tagline → contents; rhetorical question → verb |
| 13 | index.html quick-links heading + aria-label (`site.mjs`) | heading | `<nav class="sb-where" aria-label="Where are you now?"><div class="sb-where-h">Where are you now?</div>` | `<nav class="sb-where" aria-label="By situation"><div class="sb-where-h">By situation</div>` | question → noun |
| 14 | index.html quick link (`site.mjs`) | link | `["Learning how it works", "02 The machine"` | `["Learning the machine", "02 The machine"` | shorter, parallel |
| 15 | index.html quick link (`site.mjs`) | link | `["Standing at the machine, about to cut", "05 Pre-flight"` | `["At the machine, before cutting", "05 Pre-flight"` | shorter |
| 16 | index.html quick link (`site.mjs`) | link | `["It stopped, or the cut went wrong", "06 Something’s wrong"` | `["Machine stopped or bad cut", "06 Troubleshooting"` | shorter; new nav name |
| 17 | index.html quick link (`site.mjs`) | link | `["Choosing feeds, posting a file", "07 Feeds & CAM"` | `["Feeds and posting", "07 Feeds & CAM"` | shorter |
| 18 | index.html section eyebrow + h2 (`site.mjs`) | heading | `${sec("Before anything else", "Two ways to stop it", ""` | `${sec("Safety", "Stopping the machine", ""` | tagline → noun |
| 19 | index.html link (`site.mjs`) | link | `<a href="rules.html#stops">How to stop, in full</a>` | `<a href="rules.html#stops">Full stop procedure</a>` | noun label for the target |
| 20 | index.html section eyebrow, h2, intro (`site.mjs`) | heading + helper | `${sec("The route", "Your first time, in six pages", "Read them in this order before your first job. Then the pre-flight sheet does the remembering for you."` | `${sec("Reading order", "Before your first job", "Read these six pages in order; after that, use the pre-flight checklist at the machine."` | tagline + cute aside → plain |
| 21 | index.html reading-order card (`site.mjs`) | helper | `text: "Turn the model; play the ten faults from its side panel."` | `text: "3D model with ten animated faults."` | instruction → description |
| 22 | index.html reading-order card (`site.mjs`) | helper | `text: "Eleven steps. Read once, then use the pre-flight."` | `text: "Eleven steps, CAM to finished part."` | duplicate of the intro |
| 23 | index.html reading-order card (`site.mjs`) | helper | `text: "Three zeros; the first-week crash."` | `text: "Home, XY zero and Z zero."` | teaser → contents |
| 24 | index.html reading-order card (`site.mjs`) | helper | `text: "Printed, at the machine, every job."` | `text: "Printed checklist for every job."` | fragment → noun phrase |
| 25 | index.html h2 (`site.mjs`) | heading | `${sec("Contents", "The whole site", ""` | `${sec("Contents", "All pages", ""` | plainer noun |
| 26 | rules.html rule 3; handbook (`site.mjs`) | list title | `["Eyes and ears, for you and anyone watching."` | `["Eye and ear protection for you and onlookers."` | metaphor → the PPE it means |
| 27 | rules.html panel h2 + sub; handbook ch. 01 (`site.mjs`) | heading + helper | `<h2>How to stop</h2></div><p class="sb-panel-sub">Two controls, two meanings. Use them without hesitating.</p>` | `<h2>Stopping the machine</h2></div><p class="sb-panel-sub">Spacebar for a routine stop, E-stop when something is wrong. Use either without hesitating.</p>` | how-to → noun; slogan → facts (instruction kept) |
| 28 | rules.html panel h2 + sub; handbook ch. 01 (`site.mjs`) | heading + helper | `<h2>How to start a job</h2></div><p class="sb-panel-sub">The one sequence. The pendant comes before OK.</p>` | `<h2>Starting a job</h2></div><p class="sb-panel-sub">Pendant START before OK on the screen.</p>` | how-to → noun; drop "the one sequence" |
| 29 | rules.html disclosure (`site.mjs`) | summary | `details("ShopBot's own safety list, from the manuals"` | `details("ShopBot safety list (manuals)"` | shorter label |
| 30 | wiki PDF §1 h3 (`wiki.mjs`) | heading | `<h3>ShopBot's own list, from the manuals</h3>` | `<h3>ShopBot safety list (manuals)</h3>` | match the site |
| 31 | wiki PDF §1 box heading (`wiki-content.mjs`) | heading | `<h4>How to stop a PRSalpha</h4>` | `<h4>Stopping a PRSalpha</h4>` | how-to → noun |
| 32 | wiki PDF §1 box heading (`wiki-content.mjs`) | heading | `<h4>How to start a job on a PRSalpha</h4>` | `<h4>Starting a job on a PRSalpha</h4>` | how-to → noun |
| 33 | machine.html: "2 · How the mechanisms work" h3 inside the same-named disclosure (`site.mjs`) | heading | `${details("How the mechanisms work", mech)}` | `${details("How the mechanisms work", mech.replace(/<h3>[^<]*How the mechanisms work<\/h3>/, ""))}` | duplicate heading removed |
| 34 | machine.html h3; handbook ch. 02; wiki PDF §2 (`prose.mjs`) | heading | `<h3>Closed loop, but closed around the motor</h3>` | `<h3>Closed loop at the motor, not the tool</h3>` | quip → the fact |
| 35 | handbook ch. 02 caption (`handbook.mjs`) | caption | `Online the model turns and acts out ten faults; five are frozen in chapter 06.` | `Online, the model rotates and animates ten faults; chapter 06 shows five as stills.` | plainer verbs |
| 36 | wiki PDF §2 intro (`wiki.mjs`) | helper | `Learn the parts by name now: every fault later in this page is one of them failing.` | `Each fault later in this document is one of these parts failing.` | exhortation → fact |
| 37 | run.html h2 (`site.mjs`) | heading | `${sec("Manual", "The detail behind each step", ""` | `${sec("Manual", "Step details", ""` | shorter noun |
| 38 | run.html step 11; handbook ch. 03; wiki PDF §4 (`site.mjs`) | step title | `["Done", "Finish or stop the file` | `["Clean up", "Finish or stop the file` | state word → what the step is |
| 39 | run.html h4 (Power-up and leaving the machine); wiki PDF §3 (`generator/research/procedures.md`) | heading | `### When you are finished` | `### Leaving the machine` | match the parent section name |
| 40 | handbook ch. 03 section (`handbook.mjs`) | heading + helper | `hsec("Two drawings", "Hold-down and the collet, in section", "Get these two right and most first-job crashes do not happen."` | `hsec("Sections", "Hold-down and collet", "Most first-job crashes come from an error in one of these two."` | promise → fact |
| 41 | wiki PDF §4 intro (`wiki-content.mjs`) | helper | `Section 3 has the detail behind every line; this is the skeleton to hold in your head.` | `Section 3 has the detail behind every line.` | filler removed |
| 42 | zero.html figure eyebrow + h2; handbook ch. 04 (`site.mjs`) | heading | `${sec("Figure 3 · the classic crash", "Same file, wrong surface"` | `${sec("Figure 3 · Z mismatch", "Z zero on the wrong surface"` | tagline → what the figure shows |
| 43 | zero.html figure 3 labels; handbook ch. 04 (`visuals.mjs`) | figure label | `ok ? "you touched the stock top" : "you touched the bed"` | `ok ? "plate on the stock top" : "plate on the bed"` | second person → label |
| 44 | preflight.html button (`site.mjs`) | button | `onclick="print()">Print this page</button>` | `onclick="print()">Print checklist</button>` | verb + object |
| 45 | trouble.html h2 (`site.mjs`) | heading | `${sec("Index", "Start from what you see", symIntro` | `${sec("Index", "Symptoms", symIntro` | imperative tagline → noun |
| 46 | handbook ch. 06 h2 + intro (`handbook.mjs`) | heading + helper | `hsec("Index", "Start from what you see", "Find what you see, not what you suspect.` | `hsec("Index", "Symptoms", "Look up the symptom, not the suspected cause.` | tagline → noun; aphorism → plain |
| 47 | trouble.html intro; wiki PDF §6 (`wiki-content.mjs`) | heading + helper | `<h2 id="symptoms">6 · Something went wrong: start from the symptom</h2> <p>Find what you see, not what you suspect.` | `<h2 id="symptoms">6 · Troubleshooting by symptom</h2> <p>Look up the symptom, not the suspected cause.` | tagline → noun; aphorism → plain |
| 48 | handbook ch. 06 section (`handbook.mjs`) | heading + helper | `hsec("Seen in the 3D model", "Five faults, frozen", "Stills from the site's 3D model, which acts out ten faults.` | `hsec("3D model", "Five faults, as stills", "Stills from the site's 3D model, which animates ten faults.` | plainer |
| 49 | wiki PDF §6 title + contents (`wiki.mjs`) | heading | `section("symptoms", "Something went wrong: start from the symptom"` | `section("symptoms", "Troubleshooting by symptom"` | tagline → noun |
| 50 | wiki PDF §7 title + contents (`wiki.mjs`) | heading | `section("faults", "Failure modes, one by one"` | `section("faults", "Failure modes"` | filler removed |
| 51 | feeds.html h2 (`site.mjs`) | heading | `${sec("Starting points", "Used in Icelandic Fab Labs"` | `${sec("Starting points", "Icelandic Fab Lab settings"` | fragment → noun |
| 52 | handbook ch. 07 h2 (`handbook.mjs`) | heading | `hsec("Starting points", "Used in Icelandic Fab Labs"` | `hsec("Starting points", "Icelandic Fab Lab settings"` | fragment → noun |
| 53 | feeds.html disclosure (`site.mjs`) | summary | `details("Why chipload, with a worked example"` | `details("Chipload, with a worked example"` | shorter label |
| 54 | source h2 (dropped on the site) (`wiki-content.mjs`) | heading | `<h2 id="feeds">7 · Feeds, speeds and the one number that matters</h2>` | `<h2 id="feeds">7 · Feeds, speeds and chipload</h2>` | teaser → noun |
| 55 | wiki PDF §8 title + contents (`wiki.mjs`) | heading | `section("feeds", "Feeds, speeds and the one number that matters"` | `section("feeds", "Feeds, speeds and chipload"` | teaser → noun |
| 56 | feeds.html checklist intro; handbook ch. 07; wiki PDF §9 (`wiki-content.mjs`) | heading + helper | `<h2 id="cam">8 · From CAM to the machine: the post-processing checklist</h2> <p>Most "machine" failures are decided at the computer. Go through this list every time you post a file.` | `<h2 id="cam">8 · Post-processing checklist</h2> <p>Most "machine" failures start in CAM. Check this list every time you post a file.` | tagline → plain |
| 57 | maintain.html h2 (`site.mjs`) | heading | `${sec("Calendar", "What to do, and when"` | `${sec("Calendar", "Maintenance schedule"` | tagline → noun |
| 58 | maintain.html disclosure (`site.mjs`) | summary | `details("The published schedule, in full"` | `details("Full published schedule"` | shorter label |
| 59 | wiki PDF §10 h3 (`wiki.mjs`) | heading | `<h3>The published schedule, in full</h3>` | `<h3>Full published schedule</h3>` | match the site |
| 60 | source h2 (dropped on the site) (`prose.mjs`) | heading | `<h2>4 · Maintenance that prevents most of the above</h2>` | `<h2>4 · Preventive maintenance</h2>` | tagline → trade term |
| 61 | wiki PDF §10 title + contents (`wiki.mjs`) | heading | `section("maintenance", "Maintenance that prevents most of the above"` | `section("maintenance", "Preventive maintenance"` | tagline → trade term |
| 62 | quiz.html intro (`wiki-content.mjs`) | helper | `Answers are under each question; think before you open them.` | `Answer each question before opening its answer.` | chatter → instruction |
| 63 | wiki PDF §12 intro (print form) (`wiki.mjs`) | helper | `.replace("Answers are under each question; think before you open them.", "Answers follow each question; try answering before reading on.")` | `.replace("Answer each question before opening its answer.", "Answer each question before reading its answer.")` | kept in sync with the site sentence |
| 64 | handbook ch. 09 intro (print form) (`handbook.mjs`) | helper | `.replace("Answers are under each question; think before you open them.", "Answers follow each question; try answering before reading on.")` | `.replace("Answer each question before opening its answer.", "Answer each question before reading its answer.")` | kept in sync with the site sentence |
| 65 | wiki PDF h1 (`wiki.mjs`) | page title | `<h1>The ShopBot PRSalpha 144-60: how it works, how to run it, what goes wrong</h1>` | `<h1>ShopBot PRSalpha 144-60: operation, maintenance and troubleshooting</h1>` | triad tagline → subject |
| 66 | wiki PDF document title (`wiki.mjs`) | page title | `title: "ShopBot PRSalpha 144-60 — operating, maintenance and debugging"` | `title: "ShopBot PRSalpha 144-60 — operation, maintenance and troubleshooting"` | "debugging" → machine-shop term |
| 67 | wiki contents subtitle (`wiki.mjs`) | label | `<div class="sb-toc-sub">Operating, maintenance and debugging</div>` | `<div class="sb-toc-sub">Operation, maintenance and troubleshooting</div>` | "debugging" → machine-shop term |
| 68 | wiki PDF §1 title + contents (`wiki.mjs`) | heading | `section("rules", "Before you touch it: the rules"` | `section("rules", "Safety rules"` | tagline → noun |
| 69 | wiki PDF §4 title + contents (`wiki.mjs`) | heading | `section("firstjob", "Your first job, step by step"` | `section("firstjob", "Running a job, step by step"` | second person → task name |
| 70 | handbook cover lead (`handbook.mjs`) | lead | `<p class="sb-lead">How it works, how to run it, what goes wrong. The printed companion to the lab's teaching site.</p>` | `<p class="sb-lead">Operation, zeroing, troubleshooting, feeds and maintenance. Printed companion to the lab's teaching site.</p>` | triad tagline → contents |
| 71 | handbook appendix lead (`handbook.mjs`) | lead | `The full fault table, the command glossary and the sources. Look things up here; learn them from the chapters.` | `The full fault table, the command glossary and the sources.` | aside removed |
| 72 | webgl.html File panel button (`build.mjs`) | button | `"Tour the file and every fault")` | `"Guided tour")` | 6 words → 2 |
| 73 | webgl.html tour tooltip (`build.mjs`) | tooltip | `btn(`data-tour aria-pressed="false" aria-keyshortcuts="T"`` | `btn(`data-tour aria-pressed="false" aria-keyshortcuts="T" title="Play the job file, then every fault (T)"`` | keeps the lost detail out of the label |
| 74 | webgl.html Camera toggle (`build.mjs`) | button | `"Dust foot off")` | `"Hide dust foot")` | state phrase → verb + object |
| 75 | webgl.html preset (`build.mjs`) | button | `["top", "Plan, from above", ""]` | `["top", "Plan view", ""]` | drawing term |
| 76 | webgl.html Faults panel helper (`build.mjs`) | helper | `Pick a fault to stage it: the camera walks through what goes wrong, the culprit part turns red, the rest greys out. Keys 1–9 and S.` | `Select a fault to animate it; the faulty part turns red and the rest greys out. Keys 1–9 and S.` | shorter, plain verbs |
| 77 | webgl.html caption when the foot is hidden (`gl-live.js`) | status message | `"<b>Dust foot</b> Don\u2019t forget to put the vacuum head (dust foot) on, otherwise things get messy."` | `"<b>Dust foot</b> Hidden in the model only. On the machine, cut with the dust foot fitted."` | chatty → factual |
| 78 | webgl.html fault E02 step 2 caption (`machine.mjs`) | caption | `The PC dozes off, a plug works loose` | `The PC sleeps, a plug works loose` | plain verb |
| 79 | webgl.html fault-step Auto tooltip (`build.mjs`) | tooltip | `title="Advance through the steps by itself"` | `title="Advance the steps automatically"` | plainer |
| 80 | index.html <title> (was "The ShopBot PRSalpha 144-60 — ShopBot PRSalpha 144-60") (`site.mjs`) | page title | `title: `${p.title} — ShopBot PRSalpha 144-60`` | `title: p.file === "index.html" ? "ShopBot PRSalpha 144-60" : `${p.title} — ShopBot PRSalpha 144-60`` | duplicated name |
| 81 | feeds.html h2 (`site.mjs`) | heading | `${sec("Checklist", "From CAM to the machine"` | `${sec("Checklist", "CAM post-processing"` | phrase → trade term |
| 82 | handbook ch. 07 h2 (`handbook.mjs`) | heading | `${hsec("Checklist", "From CAM to the machine"` | `${hsec("Checklist", "CAM post-processing"` | phrase → trade term |
| 83 | wiki PDF §9 title + contents (`wiki.mjs`) | heading | `section("cam", "From CAM to the machine"` | `section("cam", "CAM post-processing checklist"` | phrase → trade term |
| 84 | maintain.html disclosure (`site.mjs`) | summary | `details("Why maintenance matters here"` | `details("Why maintenance matters"` | filler word |
| 85 | handbook ch. 08 h2 (`handbook.mjs`) | heading | `hsec("Why", "Why maintenance matters here"` | `hsec("Why", "Why maintenance matters"` | filler word |
| 86 | wiki PDF §1 intro (`wiki-content.mjs`) | helper (safety) | `A 4 HP spindle turning a 6 mm cutter at 12 000 rpm does not know you are there. The machine moves at up to 760 mm/s between cuts and has no idea what a hand is.` | `A 4 HP spindle turns a 6 mm cutter at 12 000 rpm, and the machine moves at up to 760 mm/s between cuts; nothing on it senses a hand in the way.` | personification → the same fact; warning intact |

## Verification

- `generator/scripts/test-copy.py` (new): renders all 22 pages (both themes) at 1440×900 and 390×844, opens every disclosure, every 3D-viewer tab and a fault beat; fails on any button/tab/acting link over 3 words or any heading/summary/eyebrow/print heading matching slogan patterns (`?`/`!` endings, "again", "let's", "we", "make it", marketing openers, teaser phrases). Allowances are documented in the script header. Green on this build (`logs/copy-check-green.log`); red on the previous build with 10 findings (`logs/copy-check-red-on-previous-build.log`).
- Existing checks green: publication verifier, teaching-wiki voice check (site + both PDFs), geometry-audit regression, static services, triage, browser layout/WebGL checks (66 page/viewport combinations, no overflow), PDF contact sheets. The geometry checks' reader-text guard now compares against the approved copy revision in `qa/READER_BASELINE` instead of the pre-copy commit.
- Rendered text before/after: `rendered-before.csv`, `rendered-after.csv`; screenshots in `screens/before`, `screens/after` and side-by-side `screens/pair-*.png`, reviewed for wrapping and overflow (two orphaned words found and fixed by shortening).
- Handbook chapter page map unchanged after the retitles (rules 2, machine 4, run 6, zero 8, pre-flight 10, troubleshooting 11, feeds 14, maintenance 16, quiz 17).

## Kept deliberately (borderline)

| Where | Text | Why it stays |
|---|---|---|
| rules.html rule list, wiki §1 | "Never alone, never tired." / "Key out for hands-on work." / "Never leave a running job." | Safety rule titles; short imperative rules are the conventional form and their substance must not change. |
| rules.html, wiki §1 | "Use them without hesitating; a ruined sheet is cheaper than anything else." | Safety motivation with a concrete consequence; not filler. |
| rules/trouble/viewer | "Stop and call staff when", "Driver alarm · any VFD code · smoke · snapped or pulled bit → stop and call staff" | Safety and escalation wording, kept exactly. |
| zero.html lead | "Three different zeros. Mixing them up is the most common first-week crash." | Factual; states the consequence that motivates the page. |
| rules.html lead | "Ten rules and two procedures. Know them before the induction." | Contents plus a requirement; no tagline. |
| quiz.html lead | "Twelve questions. Passing is part of the sign-off." | Factual. |
| index kicker | "A teaching site for the prototyping lab" | Landing-state description; the rule allows brand voice there, and this is plain. |
| trouble.html labels | "What you see / Why / What to do" | Conventional fault-card column labels. |
| run.html step titles | "RPM typed, Enter", "Pendant START", "Spindle at speed", "OK" | Step + status composites in machine terms. |
| 3D viewer presets | "Whole machine", "Gantry", "At the tool", "Operator's end", "Under the table" | Noun labels for camera positions (≤ 3 words). |
| 3D viewer | "Follow tool", "Save view", "Copy link", "Replay", "Auto", "Run", "Inspector" | Already verb or noun labels. |
| 3D viewer fault list | "Bit hits a hold-down screw", "Spindle off / wrong RPM" (+ one-line symptom) | Fault names (states), matched to the fault table; the copy check treats these as list items, not control labels. |
| feeds.html heading | "Starting points used in Icelandic Fab Labs (6 mm two-flute unless stated)" | Table heading with the needed condition. |
| maintain.html summary | "Why maintenance matters" | Plain noun phrase for a background disclosure. |
| wiki PDF intro | "Read sections 1, 2 and 4 before your induction; …" | Reading instructions with concrete section numbers. |
| fault captions in the viewer | e.g. "C2 drives the bit into the plate." | Technical fault narration; this pass does not rewrite content. |
| procedures (run/zero/maintain pages) | Manual-derived headings such as "Spacebar vs the yellow/red STOP button", "Manual Z zero (ZZ): not taught" | Procedure headings tied to manual references; plain already. |
