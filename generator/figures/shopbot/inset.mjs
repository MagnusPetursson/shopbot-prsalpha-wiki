// The tool close-up: a second camera on the spindle nose, collet, bit, dust-foot brush (cut away) and the groove it leaves.
import * as k from "../../kit/iso-kit.mjs";
import * as G from "../../kit/lathe.mjs";
import * as A from "../../kit/audit.mjs";
import { makeKit } from "./kit-helpers.mjs";

export function buildInset({ azimuth, elevation = 20, W = 300, H = 232, toolR = 0.3, stockT = 1.8 }) {
  const FIT = [[-8, -8, -stockT], [8, -8, -stockT], [8, 8, -stockT], [-8, 8, -stockT], [-8, -8, 9.5], [8, -8, 9.5], [8, 8, 9.5], [-8, 8, 9.5]];
  const P = k.fitProjection(FIT, W, H, { pad: 14, azimuth, elevation });
  const LAYER = { stock: 0, tool: 1 };
  const T = makeKit(P, LAYER);
  const { R, ctx, put, turned, disc, box, at, S, Ln, Faded, Dots, AX, AY, AZ, KS } = T;

  // Stock: a slab of the sheet, oversize; the page clips it to the card and slides it under the tool.
  ctx.layer = LAYER.stock;
  ctx.piece = "stock";
  const SLAB = 40;
  put("inset.stock.slot", [0, 0, 0], `<g data-part="inset-stock">${S(k.slabOf({ x: -SLAB, y: -SLAB, w: 2 * SLAB, d: 2 * SLAB, r: 0 }, -stockT, stockT, P, 1), { tone: "mid", crease: "none" })}</g><g data-part="inset-groove"></g><g data-part="inset-groove-floor" class="sb-groove-floor"></g>`, [], { slotOnly: true });

  // Tool group: spindle nose, collet nut, bit, dust-foot ring and the back half of the brush; translated by Z live.
  ctx.layer = LAYER.tool;
  ctx.piece = "tool";
  const F = G.frameOf([0, 0, 0], AZ, AX, AY);
  const Z0 = 4; // nose bottom at rest, tip at 0 => bit 4 cm out of the collet nut... tip at z=0 at the stock top
  const items = [];
  const grab = (name, svg) => items.push(`<g class="it" data-name="${name}">${svg}</g>`);
  // the dust foot's lower brush half is pulled off (it is held on by magnets, exactly so the collet can be reached);
  // the upper collar stays clamped on the nose. Painter order: lowest part first, since the camera looks down on the stack.
  grab("inset.tool", `<g data-part="inset-shank">${S(G.disc(Z0 - 1.1, Z0 + 0.2, toolR, F, P, { steps: 16 }), { tone: "hi" })}</g>`);
  grab("inset.collet", S(G.solidOf([[Z0, 2.0], [Z0 + 0.4, 2.3], [Z0 + 3.6, 2.3]], F, P, { steps: 8 }), { tone: "mid", inner: Faded(G.ribsOf(F, Z0 + 0.4, Z0 + 3.6, 2.3, 8, P, { fade: [0.1, 0.5] }), { tone: "lo" }) }));
  
  grab("inset.foot", S(G.solidOf([[Z0 + 2.4, 6.2], [Z0 + 3.2, 6.2], [Z0 + 3.4, 5.6, 1], [Z0 + 4.4, 4.4], [Z0 + 4.6, 3.9]], F, P, { steps: 48 }), { tone: "mid", inner: Ln(G.arcOf(F, Z0 + 2.8, 6.2, P), { tone: "faint" }) }));
  grab("inset.nose", S(G.solidOf([[Z0 + 4.55, 3.8], [Z0 + 9.6, 3.8]], F, P, { steps: 40 }), { tone: "hi", inner: Ln(G.arcOf(F, Z0 + 6, 3.8, P), { tone: "faint" }) }));
  const toolSvg = `<g data-part="inset-tool">${items.join("")}</g><g class="it" data-name="inset.tool"><g data-part="inset-bit"></g><g data-part="inset-flutes"></g></g><g data-part="inset-chips" class="sb-chips"></g>`;

  const label = "Close-up of the tool: the HSD spindle nose, the dust-foot collar, the ER25 collet nut and a 6 mm two-flute bit over the plywood sheet; the brush half of the dust foot is pulled off. The sheet slides under the bit as the file runs and the groove the bit leaves is drawn into it.";
  const svg = k.figureSvg({ width: W, height: H, label, body: [`<clipPath id="inset-clip"><rect x="0" y="0" width="${W}" height="${H}"/></clipPath>`, `<g clip-path="url(#inset-clip)">${R.items.map((it) => it.svg).join("")}${toolSvg}</g>`] });
  return { svg, P, W, H, KS, Z0, toolR, flute: { r: toolR, z0: 0, z1: Z0 - 1.0, turns: 1.6 } };
}
