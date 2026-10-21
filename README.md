# ShopBot PRSalpha wiki

A teaching and reference site for the **HÍ (University of Iceland) ShopBot PRSalpha 144×60**: operating procedures, zeroing, pre-flight checks, feeds and CAM, maintenance, and illustrated fault scenarios. The interactive WebGL model is explanatory, not a machine simulator or a substitute for supervised induction.

**Read:** [Website](https://magnuspetursson.github.io/shopbot-prsalpha-wiki/) · [Light version](https://magnuspetursson.github.io/shopbot-prsalpha-wiki/light/) · [Student handbook PDF](https://magnuspetursson.github.io/shopbot-prsalpha-wiki/shopbot-handbook.pdf) · [Full wiki PDF](https://magnuspetursson.github.io/shopbot-prsalpha-wiki/shopbot-wiki.pdf)

This guide covers HÍ’s ShopBot PRSalpha 144-60, with SB3 3.8.70 and control-box firmware 224. Follow the lab’s current induction and the manufacturer’s current instructions. This is not an official ShopBot publication.

## Rebuild

Requirements: **Node.js 22+**, **Python 3.10+ with Playwright**, **Chromium/Chrome**, and Poppler's `pdfinfo` and `pdftotext` on `PATH`. No npm packages are needed. Use an isolated Python environment and point `CHROME` at an existing browser:

```sh
python3 -m venv .venv
.venv/bin/python -m pip install playwright==1.64.0
PYTHON=.venv/bin/python CHROME=/path/to/chromium node build.mjs
```

Playwright controls the supplied browser, so a separate Playwright browser download is not needed.

The command rebuilds the dark site in the repository root, the light site in `light/`, and both PDFs. It uses the selected source modules in `generator/figures/shopbot/`, the drawing helpers in `generator/kit/`, the operating procedures in `generator/research/`, and the rendered stills and fonts in `print-assets/`. Intermediate HTML and PDFs in the generator directory are ignored by Git. After rebuilding, run `python3 generator/scripts/verify-publication.py` to check local links and fragments, policy text, PDF text/fonts and fault-reference IDs.

To preview under the same project subpath, serve the parent directory of this checkout:

```sh
cd ..
python3 -m http.server 8000
# Open http://localhost:8000/shopbot-prsalpha-wiki/
```

GitHub Pages publishes the checked-in root of `main`. `.nojekyll` keeps the deployment plain static. Links are relative so the project URL, light theme, embedded model and downloads work without a domain-root assumption. Fonts are embedded; no runtime third-party JavaScript is required.

## Publication and licences

This public edition excludes private communication identifiers, internal research dumps, photographs and third-party manuals. All ten included JPGs are rendered stills from the site's own 3D model, not photographs of people. Source citations link to external documentation rather than redistributing it. Unique equipment identifiers and the staff question record are not included.

No blanket reuse licence is granted for the original teaching text, diagrams or project-specific code; rights remain with their respective holders pending an explicit licence choice. Publication alone is not an open-source licence. The included Anatomy drawing toolkit derives from [wheresryan22/anatomy](https://github.com/wheresryan22/anatomy), under its [MIT licence](licenses/anatomy-MIT.txt). IBM Plex Sans, IBM Plex Mono and Source Serif 4 are distributed under their SIL Open Font Licences in `licenses/`. ShopBot and other manufacturers retain their trademarks and documentation rights.
