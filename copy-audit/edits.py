"""The copy pass as data: every source edit with where it shows, its kind and the reason.

python3 copy-audit/edits.py apply   -> applies each edit (asserts the exact expected occurrence count)
python3 copy-audit/edits.py report  -> writes copy-audit/changes.md
"""
import sys, collections
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
G = 'generator/figures/shopbot/'
# (source file, before, after, where it shows, kind, reason[, occurrences])
E = [
  # ---- page titles (h1 + <title>) and navigation
  (G+'site.mjs', 'title: "Before you touch it"', 'title: "Safety rules"', 'rules.html h1, <title>; handbook ch. 01', 'page title', 'tagline → noun'),
  (G+'site.mjs', 'title: "What moves, and why"', 'title: "How the machine works"', 'machine.html h1, <title>; handbook ch. 02', 'page title', 'tagline → plain title'),
  (G+'site.mjs', 'title: "Your first job"', 'title: "Running a job"', 'run.html h1, <title>; handbook ch. 03', 'page title', 'second-person tagline → task name'),
  (G+'site.mjs', 'nav: "Something’s wrong", title: "Something went wrong"', 'nav: "Troubleshooting", title: "Troubleshooting"', 'trouble.html nav, h1, <title>, pager, index TOC; handbook ch. 06 + contents', 'nav + page title', 'exclamation-style phrase → trade term'),
  (G+'site.mjs', 'title: "Feeds, speeds and the post"', 'title: "Feeds, speeds and CAM"', 'feeds.html h1, <title>; handbook ch. 07', 'page title', 'match the nav label (Feeds & CAM)'),
  (G+'handbook.mjs', 'P.maintain.title = "Looking after the machine";', 'P.maintain.title = "Machine maintenance";', 'handbook ch. 08 title', 'page title', 'soft phrase → noun'),
  # ---- page leads (also the index table of contents)
  (G+'site.mjs', 'sub: "Four motors, three axes, one spindle. Turn the model; pick one of the ten faults in its side panel to watch it happen."', 'sub: "Axes, drives, spindle and controls, with a 3D model that animates ten faults."', 'machine.html lead; index contents', 'lead', 'slogan rhythm + instructions repeated in the viewer'),
  (G+'site.mjs', 'sub: "Print it. Tick it, in order, every time."', 'sub: "Print it and tick every item, in order, for every job."', 'preflight.html lead; index contents', 'lead', 'slogan rhythm → one sentence, same rule'),
  (G+'site.mjs', 'sub: "Start from what you see. Stop first, diagnose second."', 'sub: "Find the fault from the symptom. Stop the machine before diagnosing."', 'trouble.html lead; index contents; handbook ch. 06', 'lead', 'slogan → plain instruction (stop-first kept)'),
  (G+'site.mjs', 'sub: "One number decides most cuts. Most machine failures are decided at the computer."', 'sub: "Chipload, starting feeds and the CAM checklist. Most machine failures start in CAM."', 'feeds.html lead; index contents; handbook ch. 07', 'lead', 'teaser → contents + the same claim'),
  (G+'handbook.mjs', 'P.machine.sub = "Four motors, three axes, one spindle. What each part does, and what the motors cannot see.";', 'P.machine.sub = "Axes, drives and spindle: what each part does and what the motors cannot detect.";', 'handbook ch. 02 lead', 'lead', 'slogan rhythm'),
  # ---- index (landing)
  (G+'site.mjs', '<p class="sb-lead">How it works, how to run it, what goes wrong.</p><a class="sb-cta" href="rules.html">New here? Start with the rules <i>→</i></a>', '<p class="sb-lead">Operation, troubleshooting and maintenance.</p><a class="sb-cta" href="rules.html">Read the rules <i>→</i></a>', 'index.html hero lead + button link', 'lead + link', 'triad tagline → contents; rhetorical question → verb'),
  (G+'site.mjs', '<nav class="sb-where" aria-label="Where are you now?"><div class="sb-where-h">Where are you now?</div>', '<nav class="sb-where" aria-label="By situation"><div class="sb-where-h">By situation</div>', 'index.html quick-links heading + aria-label', 'heading', 'question → noun'),
  (G+'site.mjs', '["Learning how it works", "02 The machine"', '["Learning the machine", "02 The machine"', 'index.html quick link', 'link', 'shorter, parallel'),
  (G+'site.mjs', '["Standing at the machine, about to cut", "05 Pre-flight"', '["At the machine, before cutting", "05 Pre-flight"', 'index.html quick link', 'link', 'shorter'),
  (G+'site.mjs', '["It stopped, or the cut went wrong", "06 Something’s wrong"', '["Machine stopped or bad cut", "06 Troubleshooting"', 'index.html quick link', 'link', 'shorter; new nav name'),
  (G+'site.mjs', '["Choosing feeds, posting a file", "07 Feeds & CAM"', '["Feeds and posting", "07 Feeds & CAM"', 'index.html quick link', 'link', 'shorter'),
  (G+'site.mjs', '${sec("Before anything else", "Two ways to stop it", ""', '${sec("Safety", "Stopping the machine", ""', 'index.html section eyebrow + h2', 'heading', 'tagline → noun'),
  (G+'site.mjs', '<a href="rules.html#stops">How to stop, in full</a>', '<a href="rules.html#stops">Full stop procedure</a>', 'index.html link', 'link', 'noun label for the target'),
  (G+'site.mjs', '${sec("The route", "Your first time, in six pages", "Read them in this order before your first job. Then the pre-flight sheet does the remembering for you."', '${sec("Reading order", "Before your first job", "Read these six pages in order; after that, use the pre-flight checklist at the machine."', 'index.html section eyebrow, h2, intro', 'heading + helper', 'tagline + cute aside → plain'),
  (G+'site.mjs', 'text: "Turn the model; play the ten faults from its side panel."', 'text: "3D model with ten animated faults."', 'index.html reading-order card', 'helper', 'instruction → description'),
  (G+'site.mjs', 'text: "Eleven steps. Read once, then use the pre-flight."', 'text: "Eleven steps, CAM to finished part."', 'index.html reading-order card', 'helper', 'duplicate of the intro'),
  (G+'site.mjs', 'text: "Three zeros; the first-week crash."', 'text: "Home, XY zero and Z zero."', 'index.html reading-order card', 'helper', 'teaser → contents'),
  (G+'site.mjs', 'text: "Printed, at the machine, every job."', 'text: "Printed checklist for every job."', 'index.html reading-order card', 'helper', 'fragment → noun phrase'),
  (G+'site.mjs', '${sec("Contents", "The whole site", ""', '${sec("Contents", "All pages", ""', 'index.html h2', 'heading', 'plainer noun'),
  # ---- rules
  (G+'site.mjs', '["Eyes and ears, for you and anyone watching."', '["Eye and ear protection for you and onlookers."', 'rules.html rule 3; handbook', 'list title', 'metaphor → the PPE it means'),
  (G+'site.mjs', '<h2>How to stop</h2></div><p class="sb-panel-sub">Two controls, two meanings. Use them without hesitating.</p>', '<h2>Stopping the machine</h2></div><p class="sb-panel-sub">Spacebar for a routine stop, E-stop when something is wrong. Use either without hesitating.</p>', 'rules.html panel h2 + sub; handbook ch. 01', 'heading + helper', 'how-to → noun; slogan → facts (instruction kept)'),
  (G+'site.mjs', '<h2>How to start a job</h2></div><p class="sb-panel-sub">The one sequence. The pendant comes before OK.</p>', '<h2>Starting a job</h2></div><p class="sb-panel-sub">Pendant START before OK on the screen.</p>', 'rules.html panel h2 + sub; handbook ch. 01', 'heading + helper', 'how-to → noun; drop "the one sequence"'),
  (G+'site.mjs', 'details("ShopBot\'s own safety list, from the manuals"', 'details("ShopBot safety list (manuals)"', 'rules.html disclosure', 'summary', 'shorter label'),
  (G+'wiki.mjs', '<h3>ShopBot\'s own list, from the manuals</h3>', '<h3>ShopBot safety list (manuals)</h3>', 'wiki PDF §1 h3', 'heading', 'match the site'),
  (G+'wiki-content.mjs', '<h4>How to stop a PRSalpha</h4>', '<h4>Stopping a PRSalpha</h4>', 'wiki PDF §1 box heading', 'heading', 'how-to → noun'),
  (G+'wiki-content.mjs', '<h4>How to start a job on a PRSalpha</h4>', '<h4>Starting a job on a PRSalpha</h4>', 'wiki PDF §1 box heading', 'heading', 'how-to → noun'),
  # ---- machine
  (G+'site.mjs', '${details("How the mechanisms work", mech)}', '${details("How the mechanisms work", mech.replace(/<h3>[^<]*How the mechanisms work<\\/h3>/, ""))}', 'machine.html: "2 · How the mechanisms work" h3 inside the same-named disclosure', 'heading', 'duplicate heading removed'),
  (G+'prose.mjs', '<h3>Closed loop, but closed around the motor</h3>', '<h3>Closed loop at the motor, not the tool</h3>', 'machine.html h3; handbook ch. 02; wiki PDF §2', 'heading', 'quip → the fact'),
  (G+'handbook.mjs', 'Online the model turns and acts out ten faults; five are frozen in chapter 06.', 'Online, the model rotates and animates ten faults; chapter 06 shows five as stills.', 'handbook ch. 02 caption', 'caption', 'plainer verbs'),
  (G+'wiki.mjs', 'Learn the parts by name now: every fault later in this page is one of them failing.', 'Each fault later in this document is one of these parts failing.', 'wiki PDF §2 intro', 'helper', 'exhortation → fact'),
  # ---- run
  (G+'site.mjs', '${sec("Manual", "The detail behind each step", ""', '${sec("Manual", "Step details", ""', 'run.html h2', 'heading', 'shorter noun'),
  (G+'site.mjs', '["Done", "Finish or stop the file', '["Clean up", "Finish or stop the file', 'run.html step 11; handbook ch. 03; wiki PDF §4', 'step title', 'state word → what the step is'),
  ('generator/research/procedures.md', '### When you are finished', '### Leaving the machine', 'run.html h4 (Power-up and leaving the machine); wiki PDF §3', 'heading', 'match the parent section name'),
  (G+'handbook.mjs', 'hsec("Two drawings", "Hold-down and the collet, in section", "Get these two right and most first-job crashes do not happen."', 'hsec("Sections", "Hold-down and collet", "Most first-job crashes come from an error in one of these two."', 'handbook ch. 03 section', 'heading + helper', 'promise → fact'),
  (G+'wiki-content.mjs', 'Section 3 has the detail behind every line; this is the skeleton to hold in your head.', 'Section 3 has the detail behind every line.', 'wiki PDF §4 intro', 'helper', 'filler removed'),
  # ---- zero
  (G+'site.mjs', '${sec("Figure 3 · the classic crash", "Same file, wrong surface"', '${sec("Figure 3 · Z mismatch", "Z zero on the wrong surface"', 'zero.html figure eyebrow + h2; handbook ch. 04', 'heading', 'tagline → what the figure shows'),
  (G+'visuals.mjs', 'ok ? "you touched the stock top" : "you touched the bed"', 'ok ? "plate on the stock top" : "plate on the bed"', 'zero.html figure 3 labels; handbook ch. 04', 'figure label', 'second person → label'),
  # ---- preflight
  (G+'site.mjs', 'onclick="print()">Print this page</button>', 'onclick="print()">Print checklist</button>', 'preflight.html button', 'button', 'verb + object'),
  # ---- trouble
  (G+'site.mjs', '${sec("Index", "Start from what you see", symIntro', '${sec("Index", "Symptoms", symIntro', 'trouble.html h2', 'heading', 'imperative tagline → noun'),
  (G+'handbook.mjs', 'hsec("Index", "Start from what you see", "Find what you see, not what you suspect.', 'hsec("Index", "Symptoms", "Look up the symptom, not the suspected cause.', 'handbook ch. 06 h2 + intro', 'heading + helper', 'tagline → noun; aphorism → plain'),
  (G+'wiki-content.mjs', '<h2 id="symptoms">6 · Something went wrong: start from the symptom</h2>\n<p>Find what you see, not what you suspect.', '<h2 id="symptoms">6 · Troubleshooting by symptom</h2>\n<p>Look up the symptom, not the suspected cause.', 'trouble.html intro; wiki PDF §6', 'heading + helper', 'tagline → noun; aphorism → plain'),
  (G+'handbook.mjs', 'hsec("Seen in the 3D model", "Five faults, frozen", "Stills from the site\'s 3D model, which acts out ten faults.', 'hsec("3D model", "Five faults, as stills", "Stills from the site\'s 3D model, which animates ten faults.', 'handbook ch. 06 section', 'heading + helper', 'plainer'),
  (G+'wiki.mjs', 'section("symptoms", "Something went wrong: start from the symptom"', 'section("symptoms", "Troubleshooting by symptom"', 'wiki PDF §6 title + contents', 'heading', 'tagline → noun'),
  (G+'wiki.mjs', 'section("faults", "Failure modes, one by one"', 'section("faults", "Failure modes"', 'wiki PDF §7 title + contents', 'heading', 'filler removed'),
  # ---- feeds
  (G+'site.mjs', '${sec("Starting points", "Used in Icelandic Fab Labs"', '${sec("Starting points", "Icelandic Fab Lab settings"', 'feeds.html h2', 'heading', 'fragment → noun'),
  (G+'handbook.mjs', 'hsec("Starting points", "Used in Icelandic Fab Labs"', 'hsec("Starting points", "Icelandic Fab Lab settings"', 'handbook ch. 07 h2', 'heading', 'fragment → noun'),
  (G+'site.mjs', 'details("Why chipload, with a worked example"', 'details("Chipload, with a worked example"', 'feeds.html disclosure', 'summary', 'shorter label'),
  (G+'wiki-content.mjs', '<h2 id="feeds">7 · Feeds, speeds and the one number that matters</h2>', '<h2 id="feeds">7 · Feeds, speeds and chipload</h2>', 'source h2 (dropped on the site)', 'heading', 'teaser → noun'),
  (G+'wiki.mjs', 'section("feeds", "Feeds, speeds and the one number that matters"', 'section("feeds", "Feeds, speeds and chipload"', 'wiki PDF §8 title + contents', 'heading', 'teaser → noun'),
  (G+'wiki-content.mjs', '<h2 id="cam">8 · From CAM to the machine: the post-processing checklist</h2>\n<p>Most "machine" failures are decided at the computer. Go through this list every time you post a file.', '<h2 id="cam">8 · Post-processing checklist</h2>\n<p>Most "machine" failures start in CAM. Check this list every time you post a file.', 'feeds.html checklist intro; handbook ch. 07; wiki PDF §9', 'heading + helper', 'tagline → plain'),
  # ---- maintenance
  (G+'site.mjs', '${sec("Calendar", "What to do, and when"', '${sec("Calendar", "Maintenance schedule"', 'maintain.html h2', 'heading', 'tagline → noun'),
  (G+'site.mjs', 'details("The published schedule, in full"', 'details("Full published schedule"', 'maintain.html disclosure', 'summary', 'shorter label'),
  (G+'wiki.mjs', '<h3>The published schedule, in full</h3>', '<h3>Full published schedule</h3>', 'wiki PDF §10 h3', 'heading', 'match the site'),
  (G+'prose.mjs', '<h2>4 · Maintenance that prevents most of the above</h2>', '<h2>4 · Preventive maintenance</h2>', 'source h2 (dropped on the site)', 'heading', 'tagline → trade term'),
  (G+'wiki.mjs', 'section("maintenance", "Maintenance that prevents most of the above"', 'section("maintenance", "Preventive maintenance"', 'wiki PDF §10 title + contents', 'heading', 'tagline → trade term'),
  # ---- quiz
  (G+'wiki-content.mjs', 'Answers are under each question; think before you open them.', 'Answer each question before opening its answer.', 'quiz.html intro', 'helper', 'chatter → instruction'),
  (G+'wiki.mjs', '.replace("Answers are under each question; think before you open them.", "Answers follow each question; try answering before reading on.")', '.replace("Answer each question before opening its answer.", "Answer each question before reading its answer.")', 'wiki PDF §12 intro (print form)', 'helper', 'kept in sync with the site sentence'),
  (G+'handbook.mjs', '.replace("Answers are under each question; think before you open them.", "Answers follow each question; try answering before reading on.")', '.replace("Answer each question before opening its answer.", "Answer each question before reading its answer.")', 'handbook ch. 09 intro (print form)', 'helper', 'kept in sync with the site sentence'),
  # ---- PDF wiki title/cover, handbook cover/appendix
  (G+'wiki.mjs', '<h1>The ShopBot PRSalpha 144-60: how it works, how to run it, what goes wrong</h1>', '<h1>ShopBot PRSalpha 144-60: operation, maintenance and troubleshooting</h1>', 'wiki PDF h1', 'page title', 'triad tagline → subject'),
  (G+'wiki.mjs', 'title: "ShopBot PRSalpha 144-60 — operating, maintenance and debugging"', 'title: "ShopBot PRSalpha 144-60 — operation, maintenance and troubleshooting"', 'wiki PDF document title', 'page title', '"debugging" → machine-shop term'),
  (G+'wiki.mjs', '<div class="sb-toc-sub">Operating, maintenance and debugging</div>', '<div class="sb-toc-sub">Operation, maintenance and troubleshooting</div>', 'wiki contents subtitle', 'label', '"debugging" → machine-shop term'),
  (G+'wiki.mjs', 'section("rules", "Before you touch it: the rules"', 'section("rules", "Safety rules"', 'wiki PDF §1 title + contents', 'heading', 'tagline → noun'),
  (G+'wiki.mjs', 'section("firstjob", "Your first job, step by step"', 'section("firstjob", "Running a job, step by step"', 'wiki PDF §4 title + contents', 'heading', 'second person → task name'),
  (G+'handbook.mjs', '<p class="sb-lead">How it works, how to run it, what goes wrong. The printed companion to the lab\'s teaching site.</p>', '<p class="sb-lead">Operation, zeroing, troubleshooting, feeds and maintenance. Printed companion to the lab\'s teaching site.</p>', 'handbook cover lead', 'lead', 'triad tagline → contents'),
  (G+'handbook.mjs', 'The full fault table, the command glossary and the sources. Look things up here; learn them from the chapters.', 'The full fault table, the command glossary and the sources.', 'handbook appendix lead', 'lead', 'aside removed'),
  # ---- 3D viewer
  (G+'build.mjs', '"Tour the file and every fault")', '"Guided tour")', 'webgl.html File panel button', 'button', '6 words → 2'),
  (G+'build.mjs', 'btn(`data-tour aria-pressed="false" aria-keyshortcuts="T"`', 'btn(`data-tour aria-pressed="false" aria-keyshortcuts="T" title="Play the job file, then every fault (T)"`', 'webgl.html tour tooltip', 'tooltip', 'keeps the lost detail out of the label'),
  (G+'build.mjs', '"Dust foot off")', '"Hide dust foot")', 'webgl.html Camera toggle', 'button', 'state phrase → verb + object'),
  (G+'build.mjs', '["top", "Plan, from above", ""]', '["top", "Plan view", ""]', 'webgl.html preset', 'button', 'drawing term'),
  (G+'build.mjs', 'Pick a fault to stage it: the camera walks through what goes wrong, the culprit part turns red, the rest greys out. Keys 1–9 and S.', 'Select a fault to animate it; the faulty part turns red and the rest greys out. Keys 1–9 and S.', 'webgl.html Faults panel helper', 'helper', 'shorter, plain verbs'),
  (G+'gl-live.js', '"<b>Dust foot</b> Don\\u2019t forget to put the vacuum head (dust foot) on, otherwise things get messy."', '"<b>Dust foot</b> Hidden in the model only. On the machine, cut with the dust foot fitted."', 'webgl.html caption when the foot is hidden', 'status message', 'chatty → factual'),
  (G+'machine.mjs', 'The PC dozes off, a plug works loose', 'The PC sleeps, a plug works loose', 'webgl.html fault E02 step 2 caption', 'caption', 'plain verb'),
  (G+'build.mjs', 'title="Advance through the steps by itself"', 'title="Advance the steps automatically"', 'webgl.html fault-step Auto tooltip', 'tooltip', 'plainer'),
  # ---- added after the rendered-text read
  (G+'site.mjs', 'title: `${p.title} — ShopBot PRSalpha 144-60`', 'title: p.file === "index.html" ? "ShopBot PRSalpha 144-60" : `${p.title} — ShopBot PRSalpha 144-60`', 'index.html <title> (was "The ShopBot PRSalpha 144-60 — ShopBot PRSalpha 144-60")', 'page title', 'duplicated name'),
  (G+'site.mjs', '${sec("Checklist", "From CAM to the machine"', '${sec("Checklist", "CAM post-processing"', 'feeds.html h2', 'heading', 'phrase → trade term'),
  (G+'handbook.mjs', '${hsec("Checklist", "From CAM to the machine"', '${hsec("Checklist", "CAM post-processing"', 'handbook ch. 07 h2', 'heading', 'phrase → trade term'),
  (G+'wiki.mjs', 'section("cam", "From CAM to the machine"', 'section("cam", "CAM post-processing checklist"', 'wiki PDF §9 title + contents', 'heading', 'phrase → trade term'),
  (G+'site.mjs', 'details("Why maintenance matters here"', 'details("Why maintenance matters"', 'maintain.html disclosure', 'summary', 'filler word'),
  (G+'handbook.mjs', 'hsec("Why", "Why maintenance matters here"', 'hsec("Why", "Why maintenance matters"', 'handbook ch. 08 h2', 'heading', 'filler word'),
  (G+'wiki-content.mjs', 'A 4 HP spindle turning a 6 mm cutter at 12 000 rpm does not know you are there. The machine moves at up to 760 mm/s between cuts and has no idea what a hand is.', 'A 4 HP spindle turns a 6 mm cutter at 12 000 rpm, and the machine moves at up to 760 mm/s between cuts; nothing on it senses a hand in the way.', 'wiki PDF §1 intro', 'helper (safety)', 'personification → the same fact; warning intact'),
]

def apply():
    for f, before, after, *_ in E:
        p = ROOT / f; s = p.read_text()
        n = s.count(before)
        assert n == 1, (f, before[:60], n)
        p.write_text(s.replace(before, after))
    print(len(E), 'edits applied')

def report():
    kinds = collections.Counter(e[4] for e in E)
    out = ['# Copy pass: ShopBot wiki', '',
           'Copy-only pass against the interface-copy rule: controls are verbs or verb + object; headings are nouns or states; helper text is one factual sentence. Teaching prose, procedures and safety wording were kept in substance; only taglines, teasers, rhetorical questions, duplicate headings and filler changed. Generated from `copy-audit/edits.py` (the same list that was applied to the source).', '',
           f'**{len(E)} source edits.** By kind:', '']
    out += [f'- {k}: {v}' for k, v in sorted(kinds.items(), key=lambda kv: -kv[1])]
    out += ['', '## Changes', '', '| # | Where it shows | Kind | Before | After | Reason |', '|---|---|---|---|---|---|']
    clean = lambda s: s.replace('|', '\\|').replace('\n', ' ')
    for i, (f, b, a, where, kind, why) in enumerate(E, 1):
        out.append(f'| {i} | {clean(where)} (`{f.replace(G, "")}`) | {kind} | `{clean(b)}` | `{clean(a)}` | {why} |')
    out += ['', '## Verification', '',
            '- `generator/scripts/test-copy.py` (new): renders all 22 pages (both themes) at 1440×900 and 390×844, opens every disclosure, every 3D-viewer tab and a fault beat; fails on any button/tab/acting link over 3 words or any heading/summary/eyebrow/print heading matching slogan patterns (`?`/`!` endings, "again", "let\'s", "we", "make it", marketing openers, teaser phrases). Allowances are documented in the script header. Green on this build (`logs/copy-check-green.log`); red on the previous build with 10 findings (`logs/copy-check-red-on-previous-build.log`).',
            '- Existing checks green: publication verifier, teaching-wiki voice check (site + both PDFs), geometry-audit regression, static services, triage, browser layout/WebGL checks (66 page/viewport combinations, no overflow), PDF contact sheets. The geometry checks\' reader-text guard now compares against the approved copy revision in `qa/READER_BASELINE` instead of the pre-copy commit.',
            '- Rendered text before/after: `rendered-before.csv`, `rendered-after.csv`; screenshots in `screens/before`, `screens/after` and side-by-side `screens/pair-*.png`, reviewed for wrapping and overflow (two orphaned words found and fixed by shortening).',
            '- Handbook chapter page map unchanged after the retitles (rules 2, machine 4, run 6, zero 8, pre-flight 10, troubleshooting 11, feeds 14, maintenance 16, quiz 17).',
            '', Path(ROOT/'copy-audit/kept.md').read_text() if (ROOT/'copy-audit/kept.md').exists() else '']
    (ROOT/'copy-audit/changes.md').write_text('\n'.join(out))
    print('wrote copy-audit/changes.md')

{'apply': apply, 'report': report}[sys.argv[1]]()
