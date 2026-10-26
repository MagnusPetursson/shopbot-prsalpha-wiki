# ShopBot renderer geometry triage

**Result: 226 raw findings before → 0 after.** Work is on local branch `wip/geometry-audit`; nothing was pushed or publicly published. The private preview is **https://mptvpc.tailc30766.ts.net/shopbot-wip/**. A DNS-independent tailnet alternative is **http://100.105.58.60/shopbot-wip/**.

MPTVPC's local MagicDNS lookup failed during staging verification. The HTTPS route and certificate were therefore checked using the live Tailscale self-IP with an explicit per-request DNS mapping (normal TLS/SNI validation retained); the IP URL was also checked directly. No DNS or Caddy configuration was changed.

Baseline: `23d731b` (the reported findings predate this task). Reproduce with:

```sh
node generator/figures/shopbot/build.mjs --audit
```

## Counted triage

These are **emitted findings, not 226 independent mechanical defects**. One bad route or unmarked floor-supported assembly generates several findings. Every baseline finding has a stable ID, category, classification and explanation in [`qa/geometry-audit/FINDINGS.md`](qa/geometry-audit/FINDINGS.md) and [`triage.json`](qa/geometry-audit/triage.json).

| Primary classification | Baseline findings | Unresolved after |
|---|---:|---:|
| Real defect: exterior collision, detached support/terminal or impossible painter ordering | 113 | 0 |
| Cosmetic: overly close projected/service geometry, outline folds, missing ink/overlay audit geometry | 18 | 0 |
| False positive: unmarked floor support, intended through-shaft/join, filled brush proxy | 95 | 0 |
| **Total** | **226** | **0** |

| Raw audit category | Before | After |
|---|---:|---:|
| Clearance | 31 | 0 |
| Terminal seating | 12 | 0 |
| Loose ends | 2 | 0 |
| Screen folds | 1 | 0 |
| Unsupported solids | 61 | 0 |
| Hanging rigid tube | 1 | 0 |
| Sunk solid pairs | 63 | 0 |
| Painter depth ordering | 45 | 0 |
| Self-overlapping outlines | 2 | 0 |
| Crowding | 2 | 0 |
| Items missing analytic shape records | 6 | 0 |
| **Total** | **226** | **0** |

The six missing-shape entries **are included** in the original 226: `failures()` counts `depth.missing` even though the report prints them separately. Other audit categories were already zero and remain zero.

## What changed

- **Extraction:** routed the overhead service loop above the gantry instead of sagging through the beam/Y carrier; separated the return hose from the boom post, stay and collector. Moved the ancillary collector housing/motor outside the bag stack, added a saddle-ended discharge duct and explicit schematic supports, and seated the bands/bags axially.
- **Head:** made dust-foot collars, the nozzle and hose holders genuinely annular. SVG/WebGL use depth-sortable annular sectors, and the collision model uses the matching hollow meridian. The brush has an annular bristle envelope, not a filled collision cylinder through the bit/collet.
- **Carriers:** made the X trough a channel rather than a solid block, moved it clear of the drive, attached its brackets and upper end, and connected the Y carrier's raised bracket to the car. Cable endpoints now meet actual mounting faces.
- **Contacts and painter order:** represented only exposed through-shaft spans, segmented cart uprights at shelves/arms, made braces flush-ended, separated crowded motor/bearing/mount faces, and moved the proximity-switch mount clear of the rack. No new depth bias was used to hide a collision.
- **Audit semantics:** floor-contacting parts carry explicit ground metadata. Clevises identify their mechanical hosts, so an intentional stay/rod connection is not treated as unrelated crowding. `looseEnds()` now accepts a fully seated rim in a hollow holder **only when that holder shares the endpoint's displacement**. A holder moving away still fails.
- **Print rendering:** visual PDF review exposed an additional pre-existing blind spot: the four service routes were recorded by the audit but their initial SVG animation slots were empty. The PDF stripped scripts and therefore lost both hose legs and both carriers. The generator now seeds those slots with the exact initial live geometry. A separate red/green regression proves static/live parity in both themes.
- **Framing:** enlarged the SVG viewBox and included actual boom/collector extrema. Every static item fits inside it; the tool caption retains the original **11×** magnification. Refreshed the operator-side handbook still from the corrected WebGL model.

No broad allowlist was added, no clearance threshold was relaxed, and no failing category was removed. Raw reports are retained as [`before.log`](qa/geometry-audit/before.log) and [`after.log`](qa/geometry-audit/after.log).

## Verification

| Check | Observed result |
|---|---|
| Raw renderer audit | **PASS, 0 findings**; 9 tubes, 266 solids, 519 painter items; one parked depth state |
| Hollow-holder regression | **5 assertions pass**; the unchanged test first failed on the original centre-only support check |
| Static/PDF service parity | **8 route/theme checks pass**; the unchanged test first failed on the empty hose slot |
| Full `node build.mjs` | Dark/light site and both PDFs rebuilt successfully |
| Publication verifier | **22 pages, 914 local links**, 10 viewer faults matched to 39 reference entries; both PDFs have embedded fonts |
| Responsive browser checks | **66 page/viewport combinations**: all 22 pages at 1440, 390 and 320 CSS px; no horizontal overflow or page errors |
| WebGL checks | **90 checks** across both themes: four geometry views, a held sample in every fault beat, and live job-clock advancement; no WebGL errors |
| Private deployment readback | **24 reader files + 6 review files**, HTTP 200 and byte-identical to the local build; HTTPS verified with explicit live-IP mapping because local MagicDNS failed |
| Reduced motion/static geometry | Phone WebGL loads with reduced motion; standalone SVG renders without scripts; no static item is clipped |
| Reader text | All **22 HTML pages unchanged** against `23d731b`; both PDFs' prose unchanged after normalizing only the automatic cover date and the extraction position of the unchanged figure label |
| Visual review | Desktop/phone SVG and WebGL views inspected; all **65 PDF pages** rendered and reviewed on contact sheets, with enlarged machine/tool pages checked separately |

Re-run the additional checks using the existing `.venv` with Playwright/Pillow and the installed Chromium:

```sh
node generator/scripts/test-geometry-audit.mjs
.venv/bin/python generator/scripts/verify-static-services.py
.venv/bin/python generator/scripts/verify-geometry-browser.py
python3 generator/scripts/verify-publication.py
.venv/bin/python generator/scripts/verify-geometry-pdfs.py
python3 generator/scripts/triage-geometry.py
```

Build environment used:

```sh
CHROME="$HOME/.cache/ms-playwright/chromium-1248/chrome-linux64/chrome" \
PYTHON="$PWD/.venv/bin/python" node build.mjs
```

Detailed outputs live under `qa/geometry-audit/`. The browser harness uses the installed headless Chromium shell and the repository's real `__gl` hook, not fabricated renderer responses.

## Boundaries and remaining work

- The zero raw audit is **not a full-travel clearance or physical-machine certification**. It checks the parked schematic model. Normal live motion and all fault beats were exercised, but the service routes are illustrative, not fixed-length hose/cable simulations. Ancillary collector/boom/support corrections are schematic contact repairs, not a measurement-backed reconstruction of the installation.
- Fine faceting, low-contrast SVG linework, some crowded small joints and the default phone camera cropping peripheral structure remain presentation limitations; no obvious catastrophic intersection/disconnection remained in the final reviewed views. Existing whitespace-heavy PDF pagination was not rewritten.
- The nine archived fault close-ups remain unchanged; the operator overview was refreshed. Fault IDs, narratives, operating parameters, teaching prose, and source research were not edited.
- **Pre-existing no-JavaScript publication issue:** `machine.html` retains teaching text but its embedded WebGL model is blank with scripts disabled. The static generator SVG works; it is not wired into that publication path. This is separately routed to owner triage as **`t_339ab09a`**, with no implementation/publication permission implied.
- Public release remains Magnús's gate. This task only commits locally and stages the private tailnet preview.
