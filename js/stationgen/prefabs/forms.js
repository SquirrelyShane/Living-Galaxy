/* Body forms and decorative kits — the shape grammar every module prefab
 * draws with. A prefab asks for a body of a family-appropriate form; the
 * style weights which forms are likely and the rng rolls the proportions,
 * segment counts, tiers and profiles, so every instance is its own shape.
 *
 * Frame: origin on the mount surface, +Y out of the hull, +Z along the
 * structure, +X across. A form draws inside [−w/2, w/2] × [0, h] × [−d/2, d/2]
 * and returns the envelope it actually used, which the kits and decor hang on:
 *
 *   { kind, w, h, d, top, faces: { px, nx, pz, nz } }   faces = half-extents where a side kit can attach
 */
import { G, PROFILES, lathe, latheOf, extrude, archOutline } from "../core/geometry.js";
import { roll } from "../data/styles.js";

const PI = Math.PI, H = PI / 2;
const env = (kind, w, h, d, extra = {}) => ({ kind, w, h, d, top: h, faces: { px: w / 2, nx: w / 2, pz: d / 2, nz: d / 2 }, ...extra });

/* ---- unit outlines (cached geometry, scaled per mesh) ------------------------ */
const vaultGeo = (kind) => extrude(`vault:${kind}`, archOutline(kind, 1, 1), 1, [], { curveSegments: 10 });
const ribGeo = (kind, t = 0.08) => extrude(`rib:${kind}:${t}`, archOutline(kind, 1, 1), 1, [archOutline(kind, 1 - 2 * t, 1 - t).map(([x, y]) => [x, y])], { curveSegments: 10 });
export { vaultGeo, ribGeo };

/* ---- the forms ---------------------------------------------------------------- */
export const FORMS = {
  /* a pressurised block: plinth, main box, chamfer rails, sometimes an ell */
  block(C, w, h, d) {
    const { mats, rng } = C;
    const bw = w * rng.range(0.78, 0.95), bh = h * rng.range(0.7, 0.9), bd = d * rng.range(0.8, 0.96);
    C.add(G.box(), mats.dark, 0, 1, 0, 0, 0, 0, w * 0.95, 2, d * 0.95);
    C.add(G.box(), mats.hull, 0, 2 + bh / 2, 0, 0, 0, 0, bw, bh, bd);
    /* chamfer rails on the long edges */
    for (const sx of [-1, 1]) C.add(G.box(), mats.dark, sx * bw * 0.5, 2 + bh, 0, 0, 0, 0, 1.4, 1.4, bd * 1.01);
    if (rng.chance(0.45)) { const ew = bw * rng.range(0.35, 0.6), eh = bh * rng.range(0.5, 1.3); C.add(G.box(), mats.panel, rng.sign() * (bw / 2 - ew / 2), 2 + eh / 2, rng.sign() * bd * 0.3, 0, 0, 0, ew * 1.08, eh, bd * 0.45); }
    C.count(4);
    return env("block", bw, 2 + bh, bd, { faces: { px: bw / 2, nx: bw / 2, pz: bd / 2, nz: bd / 2 } });
  },
  /* one to three lathed vessels along the long axis, on saddles */
  barrel(C, w, h, d, o = {}) {
    const { mats, rng } = C;
    const n = o.n ?? (w > d * 1.2 ? rng.int(1, 3) : rng.int(1, 2));
    const alongX = w > d * 1.25;
    const span = alongX ? d : w, len = alongX ? w : d;
    const r = Math.min(span / (n * 2.15), h * 0.46);
    const geo = latheOf(rng, rng.pick(o.profiles ?? ["tank", "drum", "pod", "tank"]), 20);
    for (let i = 0; i < n; i++) {
      const off = -span / 2 + (span / n) * (i + 0.5);
      const L = len * rng.range(0.82, 0.96);
      const x = alongX ? 0 : off, z = alongX ? off : 0;
      C.add(geo, i % 2 ? mats.panel : mats.hull, x, r + 1.5, z, alongX ? 0 : H, 0, alongX ? H : 0, r, L, r);
      C.add(G.box(), mats.dark, x, r * 0.5 + 0.75, z, 0, 0, 0, alongX ? L * 0.9 : r * 1.9, r, alongX ? r * 1.9 : L * 0.9);
      /* end collars */
      for (const s of [-1, 1]) C.add(G.torus(0.06, 6, 24), mats.metal, alongX ? s * L * 0.42 : x, r + 1.5, alongX ? z : s * L * 0.42, alongX ? 0 : 0, alongX ? H : 0, 0, r * 1.02, r * 1.02, r * 1.02);
      C.count(4);
    }
    return env("barrel", alongX ? len : n * r * 2.15, r * 2 + 1.5, alongX ? n * r * 2.15 : len);
  },
  /* a vertical lathe: tower, silo, bell */
  spindle(C, w, h, d) {
    const { mats, rng } = C;
    const r = Math.min(w, d) * rng.range(0.28, 0.42);
    const geo = latheOf(rng, rng.pick(["drum", "pod", "bell", "tank"]), 18);
    C.add(geo, mats.hull, 0, h * 0.5, 0, 0, 0, 0, r, h * 0.96, r);
    C.add(G.cyl(12), mats.dark, 0, 1.2, 0, 0, 0, 0, r * 1.25, 2.4, r * 1.25);
    const collars = rng.int(1, 3);
    for (let i = 0; i < collars; i++) C.add(G.torus(0.08, 6, 28), mats.metal, 0, h * (0.25 + 0.5 * i / collars), 0, H, 0, 0, r * 1.03, r * 1.03, r * 1.03);
    C.count(2 + collars);
    return env("spindle", r * 2, h, r * 2);
  },
  /* an n-gon prism, banded */
  prism(C, w, h, d, o = {}) {
    const { mats, rng } = C;
    const sides = o.sides ?? rng.pick([5, 6, 6, 7, 8, 8]);
    const upright = o.upright ?? rng.chance(0.45);
    if (upright) {
      const r = Math.min(w, d) * rng.range(0.4, 0.5);
      C.add(G.cyl(sides), mats.hull, 0, h * 0.5, 0, 0, rng.range(0, 1), 0, r, h * 0.94, r);
      const bands = rng.int(1, 3);
      for (let i = 0; i < bands; i++) C.add(G.cyl(sides), mats.dark, 0, h * (0.2 + 0.6 * i / bands), 0, 0, 0, 0, r * 1.03, 1.2, r * 1.03);
      C.count(1 + bands);
      return env("prism", r * 2, h, r * 2);
    }
    const r = Math.min(w, h) * rng.range(0.42, 0.5), L = d * rng.range(0.82, 0.96);
    C.add(G.cyl(sides), mats.hull, 0, r + 1, 0, H, 0, 0, r, L, r);
    C.add(G.box(), mats.dark, 0, r * 0.5, 0, 0, 0, 0, r * 1.8, r, L * 0.9);
    const bands = rng.int(1, 4);
    for (let i = 0; i < bands; i++) C.add(G.cyl(sides), mats.dark, 0, r + 1, -L * 0.4 + (L * 0.8 * i) / Math.max(1, bands - 1), H, 0, 0, r * 1.04, 1.5, r * 1.04);
    C.count(2 + bands);
    return env("prism", r * 2, r * 2 + 1, L);
  },
  /* a faceted armoured pod on a plinth */
  faceted(C, w, h, d) {
    const { mats, rng } = C;
    const geo = rng.pick([G.ico(1), G.ico(1), G.octa(), G.ico(0)]);
    const rx = w * 0.46, ry = h * 0.5, rz = d * rng.range(0.4, 0.5);
    C.add(G.cyl(8), mats.dark, 0, 1.5, 0, 0, 0, 0, Math.min(rx, rz) * 0.8, 3, Math.min(rx, rz) * 0.8);
    C.add(geo, mats.hull, 0, 2 + ry * 0.9, 0, rng.range(0, 0.4), rng.range(0, PI), 0, rx, ry, rz);
    /* a seam belt */
    C.add(G.torus(0.04, 6, 24), mats.dark, 0, 2 + ry * 0.9, 0, H, 0, 0, Math.max(rx, rz) * 1.02, Math.max(rx, rz) * 1.02, Math.max(rx, rz) * 1.02);
    C.count(3);
    return env("faceted", rx * 2, 2 + ry * 1.8, rz * 2);
  },
  /* the nave: an arched section extruded along z, with ribs */
  vault(C, w, h, d, o = {}) {
    const { mats, rng } = C;
    const kind = o.kind ?? roll(rng, C.style.mouth) ?? "pointed";
    const vw = w * rng.range(0.8, 0.95), vh = h * rng.range(0.8, 0.98), vd = d * rng.range(0.85, 0.97);
    const body = C.add(vaultGeo(kind), o.mat ?? mats.hull, 0, 1, 0, 0, 0, 0, vw, vh, vd);
    C.add(G.box(), mats.dark, 0, 0.5, 0, 0, 0, 0, vw * 1.06, 1, vd);
    const ribs = Math.max(2, Math.round(vd / rng.range(9, 16)));
    for (let i = 0; i <= ribs; i++) {
      const z = -vd / 2 + (vd * i) / ribs;
      C.add(ribGeo(kind), mats.dark, 0, 1, z, 0, 0, 0, vw * 1.05, vh * 1.04, 1.6);
    }
    C.count(2 + ribs);
    return env("vault", vw, vh + 1, vd, { body, arch: kind, faces: { px: vw / 2, nx: vw / 2, pz: vd / 2, nz: vd / 2 } });
  },
  /* a dome on a drum or an n-gon */
  dome(C, w, h, d, o = {}) {
    const { mats, rng } = C;
    const r = Math.min(w, d) * rng.range(0.38, 0.48);
    const baseH = h * rng.range(0.25, 0.45);
    const sides = rng.pick([8, 12, 24, 24]);
    C.add(G.cyl(sides), mats.hull, 0, baseH / 2, 0, 0, 0, 0, r, baseH, r);
    const dome = C.add(G.dome(sides), o.mat ?? mats.panel, 0, baseH, 0, 0, 0, 0, r, Math.min(h - baseH, r * rng.range(0.6, 1.1)), r);
    C.add(G.torus(0.05, 6, sides), mats.dark, 0, baseH, 0, H, 0, 0, r * 1.02, r * 1.02, r * 1.02);
    C.count(3);
    return env("dome", r * 2, baseH + dome.scale.y, r * 2, { dome, faces: { px: r, nx: r, pz: r, nz: r } });
  },
  /* stacked decks, each smaller, each turned a little */
  stack(C, w, h, d) {
    const { mats, rng } = C;
    const tiers = rng.int(2, 4);
    const nGon = rng.chance(0.4) ? rng.pick([6, 8]) : 0;
    let y = 1, ww = w * 0.95, dd = d * 0.95;
    let maxW = ww, maxD = dd;
    for (let i = 0; i < tiers; i++) {
      const th = (h * 0.95) / tiers * rng.range(0.8, 1.2);
      const mat = i % 2 ? mats.panel : mats.hull;
      if (nGon) C.add(G.cyl(nGon), mat, 0, y + th / 2, 0, 0, (i * PI) / nGon, 0, Math.min(ww, dd) / 2, th, Math.min(ww, dd) / 2);
      else C.add(G.box(), mat, rng.range(-1, 1) * (w - ww) * 0.4, y + th / 2, rng.range(-1, 1) * (d - dd) * 0.4, 0, 0, 0, ww, th, dd);
      C.add(G.box(), mats.dark, 0, y + th, 0, 0, 0, 0, ww * 1.03, 0.8, dd * 1.03);
      y += th + 0.8; ww *= rng.range(0.7, 0.9); dd *= rng.range(0.7, 0.92);
      C.count(2);
    }
    return env("stack", maxW, y, maxD, { tiers, faces: { px: maxW / 2, nx: maxW / 2, pz: maxD / 2, nz: maxD / 2 } });
  },
  /* pods bunched on a frame */
  cluster(C, w, h, d) {
    const { mats, rng } = C;
    const n = rng.int(3, 6);
    const r = Math.min(w, d, h * 1.6) * rng.range(0.2, 0.28);
    C.add(G.box(), mats.dark, 0, 1, 0, 0, 0, 0, w * 0.8, 2, d * 0.8);
    const geo = rng.chance(0.5) ? G.sphere(16, 12) : rng.chance(0.5) ? G.ico(1) : latheOf(rng, "pod", 14);
    for (let i = 0; i < n; i++) {
      const a = (i / n) * PI * 2 + rng.range(-0.3, 0.3);
      const rr = r * rng.range(0.8, 1.2);
      const x = Math.cos(a) * (w * 0.5 - rr) * rng.range(0.4, 0.9), z = Math.sin(a) * (d * 0.5 - rr) * rng.range(0.4, 0.9);
      C.add(geo, i % 3 === 2 ? mats.panel : mats.hull, x, rr + 2 + rng.range(0, h * 0.2), z, 0, rng.range(0, PI), 0, rr, rr * rng.range(0.9, 1.3), rr);
      C.add(G.cyl(8), mats.metal, x * 0.5, rr * 0.6 + 2, z * 0.5, H, 0, Math.atan2(-x, z), rr * 0.25, Math.hypot(x, z), rr * 0.25);
      C.count(2);
    }
    return env("cluster", w * 0.9, r * 2.6 + 2, d * 0.9);
  },
  /* a tapered block — the frustum */
  wedge(C, w, h, d) {
    const { mats, rng } = C;
    const taper = rng.range(0.45, 0.75);
    const bw = w * 0.92, bd = d * 0.92, bh = h * 0.9;
    C.add(G.frustum(taper, 4), mats.hull, 0, 1 + bh / 2, 0, 0, PI / 4, 0, bw / 1.414, bh, bd / 1.414);
    C.add(G.box(), mats.dark, 0, 0.5, 0, 0, 0, 0, bw * 1.05, 1, bd * 1.05);
    C.add(G.box(), mats.panel, 0, 1 + bh, 0, 0, 0, 0, bw * taper * 0.9, 1.5, bd * taper * 0.9);
    C.count(3);
    return env("wedge", bw, 1 + bh, bd, { taper });
  },
  /* a keep: sloped walls, a deck, battlements — military spec */
  keep(C, w, h, d) {
    const { mats, rng } = C;
    const bw = w * 0.95, bd = d * 0.95, bh = h * rng.range(0.6, 0.85);
    const taper = rng.range(0.7, 0.86);
    C.add(G.frustum(taper, 4), mats.armour, 0, 1 + bh / 2, 0, 0, PI / 4, 0, bw / 1.414, bh, bd / 1.414);
    C.add(G.box(), mats.dark, 0, 0.5, 0, 0, 0, 0, bw * 1.04, 1, bd * 1.04);
    /* deck with a parapet and teeth */
    const tw = bw * taper, td = bd * taper;
    C.add(G.box(), mats.hull, 0, 1 + bh + 1, 0, 0, 0, 0, tw, 2, td);
    const teeth = Math.max(3, Math.round(tw / 6));
    for (let i = 0; i < teeth; i++) for (const s of [-1, 1]) C.add(G.box(), mats.dark, -tw / 2 + (tw * (i + 0.5)) / teeth, 1 + bh + 3, s * td * 0.48, 0, 0, 0, tw / teeth * 0.5, 2.4, 1.2);
    /* an armoured citadel block on the deck */
    if (rng.chance(0.7)) C.add(G.box(), mats.armour, rng.range(-1, 1) * tw * 0.15, 1 + bh + 2 + (h - bh) * 0.35, 0, 0, 0, 0, tw * 0.55, (h - bh) * 0.7, td * 0.55);
    C.count(4 + teeth * 2);
    return env("keep", bw, h, bd, { taper, deck: 1 + bh + 2, faces: { px: bw / 2, nx: bw / 2, pz: bd / 2, nz: bd / 2 } });
  },
  /* an octagonal glazed tower under a spire */
  lantern(C, w, h, d) {
    const { mats, rng } = C;
    const r = Math.min(w, d) * rng.range(0.3, 0.42);
    const sides = rng.pick([6, 8, 8, 12]);
    const towerH = h * rng.range(0.5, 0.65);
    C.add(G.cyl(sides), mats.hull, 0, towerH / 2, 0, 0, 0, 0, r, towerH, r);
    C.add(G.cyl(sides), mats.window, 0, towerH * 0.62, 0, 0, 0, 0, r * 1.02, towerH * 0.22, r * 1.02);
    for (let i = 0; i < sides; i++) { const a = (i / sides) * PI * 2 + PI / sides; C.add(G.box(), mats.dark, Math.cos(a) * r, towerH / 2, Math.sin(a) * r, 0, -a, 0, 1.2, towerH, 1.2); }
    C.add(G.cone(sides), mats.panel, 0, towerH + (h - towerH) * 0.5, 0, 0, 0, 0, r * 1.1, h - towerH, r * 1.1);
    C.count(3 + sides);
    return env("lantern", r * 2.2, h, r * 2.2, { spireTop: h, r });
  },
  /* an open frame with a body inside — the works look */
  cradle(C, w, h, d, o = {}) {
    const { mats, rng } = C;
    const bw = w * 0.9, bd = d * 0.9, bh = h * 0.9;
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) C.add(G.box(), mats.truss, sx * bw * 0.48, bh / 2, sz * bd * 0.48, 0, 0, 0, 2, bh, 2);
    for (const sx of [-1, 1]) C.add(G.box(), mats.truss, sx * bw * 0.48, bh, 0, 0, 0, 0, 2, 2, bd * 0.97);
    for (const sz of [-1, 1]) C.add(G.box(), mats.truss, 0, bh, sz * bd * 0.48, 0, 0, 0, bw * 0.97, 2, 2);
    C.count(8);
    const inner = rng.pick(o.inner ?? ["barrel", "block", "prism"]);
    const e = FORMS[inner](C, bw * 0.8, bh * 0.85, bd * 0.85);
    return env("cradle", bw, bh, bd, { inner: e });
  },
};
export const FORM_KEYS = Object.keys(FORMS);

/** Roll a body form for a family: the family's allowed forms weighted by the style. */
export function pickForm(C, allowed) {
  const table = {};
  for (const k of allowed) table[k] = (C.style.forms[k] ?? 0.5) + 0.05;
  return roll(C.rng, table) ?? allowed[0];
}
export function body(C, allowed, w, h, d, o = {}) {
  const kind = o.kind ?? pickForm(C, allowed);
  const e = FORMS[kind](C, w, h, d, o);
  e.kind = kind;
  return e;
}

/* ---- decorative kits ------------------------------------------------------------ */
export const DECOR = {
  buttress(C, e) {
    const { mats, rng } = C;
    const n = Math.max(2, Math.round(e.d / rng.range(10, 18)));
    for (let i = 0; i < n; i++) {
      const z = -e.d / 2 + (e.d * (i + 0.5)) / n;
      for (const s of [-1, 1]) {
        const x0 = s * (e.faces.px + e.h * 0.35), y0 = e.h * 0.25, x1 = s * e.faces.px, y1 = e.h * 0.78;
        const L = Math.hypot(x1 - x0, y1 - y0);
        C.add(G.box(), mats.panel, (x0 + x1) / 2, (y0 + y1) / 2, z, 0, 0, Math.atan2(-(x1 - x0), y1 - y0), 1.6, L, 2.2);
        C.add(G.box(), mats.dark, x0, y0 / 2, z, 0, 0, 0, 2.4, y0, 3);
        C.add(G.cone(4), mats.dark, x0, y0 + 2, z, 0, PI / 4, 0, 2, 4, 2);
      }
    }
    C.count(n * 6);
  },
  spire(C, e) {
    const { mats, rng } = C;
    const n = rng.int(1, 4);
    for (let i = 0; i < n; i++) {
      const x = (n === 1 ? 0 : (i % 2 ? 1 : -1) * e.faces.px * 0.7), z = (n <= 2 ? -e.d * 0.35 : (i < 2 ? -1 : 1) * e.d * 0.35);
      const hh = e.h * rng.range(0.4, 0.9), r = rng.range(1.6, 3.2);
      C.add(G.cyl(8), mats.hull, x, e.top + hh * 0.3, z, 0, 0, 0, r, hh * 0.6, r);
      C.add(G.cone(8), mats.panel, x, e.top + hh * 0.6 + hh * 0.35, z, 0, 0, 0, r * 1.15, hh * 0.7, r * 1.15);
      C.lamp(x, e.top + hh * 0.98, z, C.style.lampColor, "pulse", 1.8);
      C.count(2);
    }
  },
  arcade(C, e) {
    const { mats, rng } = C;
    const kind = e.arch ?? "pointed";
    const pitch = rng.range(4.5, 7);
    const n = Math.max(2, Math.floor(e.d / pitch) - 1);
    const y = e.h * rng.range(0.3, 0.5);
    const g = extrude(`win:${kind}`, archOutline(kind, 1, 1), 1, [], { curveSegments: 6 });
    for (let i = 0; i < n; i++) for (const s of [-1, 1]) C.add(g, rng.chance(0.85) ? mats.window : mats.dark, s * (e.faces.px + 0.15), y, -e.d / 2 + pitch * (i + 1), 0, s * H, 0, 2.2, 4.4, 0.3);
    C.count(n * 2);
  },
  finial(C, e) { C.lamp(0, e.top + 1.2, 0, C.style.lampColor, "pulse", 2); },
  rose(C, e) {
    const { mats } = C;
    const r = Math.min(e.w, e.h) * 0.22;
    for (const s of [-1, 1]) {
      C.add(G.torus(0.12, 6, 24), mats.glow, 0, e.h * 0.62, s * (e.faces.pz + 0.4), 0, 0, 0, r, r, r);
      for (let i = 0; i < 8; i++) { const a = (i / 8) * PI; C.add(G.box(), mats.glow, 0, e.h * 0.62, s * (e.faces.pz + 0.4), 0, 0, a, r * 1.9, 0.4, 0.3); }
    }
    C.count(18);
  },
  plates(C, e) {
    const { mats, rng } = C;
    const n = Math.max(2, Math.round(e.d / rng.range(9, 14)));
    for (let i = 0; i < n; i++) for (const s of [-1, 1]) {
      const z = -e.d / 2 + (e.d * (i + 0.5)) / n;
      C.add(G.box(), mats.armour, s * (e.faces.px + 1.2), e.h * 0.45, z, 0, 0, s * rng.range(0.25, 0.45), 1.6, e.h * 0.7, e.d / n * 0.9);
    }
    C.count(n * 2);
  },
  blister(C, e) {
    const { mats, rng } = C;
    const n = rng.int(1, 3);
    for (let i = 0; i < n; i++) { const r = rng.range(2, 4); C.add(G.dome(12), mats.dark, rng.range(-0.3, 0.3) * e.w, e.top, rng.range(-0.4, 0.4) * e.d, 0, 0, 0, r, r * 0.8, r); }
    C.count(n);
  },
  gunport(C, e) {
    const { mats, rng } = C;
    const n = rng.int(2, 4);
    for (let i = 0; i < n; i++) { const s = i % 2 ? 1 : -1; const z = rng.range(-0.4, 0.4) * e.d; C.add(G.cyl(8), mats.dark, s * (e.faces.px + 3), e.h * rng.range(0.3, 0.6), z, 0, 0, H, 0.7, 6, 0.7); C.add(G.box(), mats.armour, s * (e.faces.px + 0.6), e.h * 0.45, z, 0, 0, 0, 1.2, 4, 4); }
    C.count(n * 2);
  },
  sensorpod(C, e) { const { mats, rng } = C; const x = rng.range(-0.3, 0.3) * e.w, z = rng.range(-0.3, 0.3) * e.d; C.add(G.cyl(6), mats.metal, x, e.top + 2, z, 0, 0, 0, 0.4, 4, 0.4); C.add(G.octa(), mats.accent, x, e.top + 4.5, z, 0, 0, 0, 1.2, 1.8, 1.2); C.count(2); },
  bands(C, e) {
    const { mats, rng } = C;
    const rows = rng.int(1, 3), pitch = rng.range(2.6, 3.6);
    const n = Math.max(2, Math.floor(e.d / pitch) - 1);
    for (let r = 0; r < rows; r++) { const y = e.h * (0.25 + 0.5 * r / rows) + 1; for (let i = 0; i < n; i++) for (const s of [-1, 1]) C.add(G.box(), rng.chance(0.85) ? mats.window : mats.dark, s * (e.faces.px + 0.05), y, -e.d / 2 + pitch * (i + 1), 0, 0, 0, 0.2, 1.5, 2); }
    C.count(rows * n * 2);
  },
  terrace(C, e) { const { mats, rng } = C; const n = rng.int(1, 3); for (let i = 0; i < n; i++) C.add(G.box(), mats.panel, rng.range(-0.25, 0.25) * e.w, e.top + 1.2 + i * 2.4, rng.range(-0.2, 0.2) * e.d, 0, 0, 0, e.w * (0.7 - i * 0.15), 2.4, e.d * (0.7 - i * 0.15)); C.count(n); },
  antenna(C, e) { const { mats, rng } = C; const x = rng.range(-0.35, 0.35) * e.w, z = rng.range(-0.35, 0.35) * e.d, hh = rng.range(6, 16); C.add(G.cyl(5), mats.metal, x, e.top + hh / 2, z, 0, 0, 0, 0.25, hh, 0.25); C.lamp(x, e.top + hh + 0.5, z, "#ff4a5a", "blink", 2); C.count(); },
  panels(C, e) { const { mats, rng } = C; const n = rng.int(2, 5); for (let i = 0; i < n; i++) { const s = i % 2 ? 1 : -1; C.add(G.box(), rng.chance(0.5) ? mats.dark : mats.panel, s * (e.faces.px + 0.2), e.h * rng.range(0.3, 0.7), rng.range(-0.35, 0.35) * e.d, 0, 0, 0, 0.4, e.h * rng.range(0.2, 0.4), rng.range(4, 10)); } C.count(n); },
  pipes(C, e) {
    const { mats, rng } = C;
    const n = rng.int(2, 4);
    for (let i = 0; i < n; i++) {
      const s = i % 2 ? 1 : -1, r = rng.range(0.35, 0.9), y = e.h * rng.range(0.2, 0.9), x = s * (e.faces.px + r + 0.4);
      C.add(G.cyl(8), mats.metal, x, y, 0, H, 0, 0, r, e.d * rng.range(0.8, 1.05), r);
      if (rng.chance(0.6)) C.add(G.cyl(8), mats.metal, x, y / 2, rng.range(-0.4, 0.4) * e.d, 0, 0, 0, r, y, r);
    }
    C.count(n * 2);
  },
  stacks(C, e) { const { mats, rng } = C; const n = rng.int(1, 3); for (let i = 0; i < n; i++) { const x = rng.range(-0.35, 0.35) * e.w, z = rng.range(-0.35, 0.35) * e.d, hh = rng.range(8, 18), r = rng.range(1, 2.4); C.add(G.cyl(10), mats.metal, x, e.top + hh / 2, z, 0, 0, 0, r, hh, r); C.add(G.cyl(10), mats.hot, x, e.top + hh, z, 0, 0, 0, r * 0.9, 1.2, r * 0.9).userData.pulse = { speed: 0.9, amp: 0.3, phase: i }; } C.count(n * 2); },
  hazard(C, e) { const { mats } = C; for (const s of [-1, 1]) C.add(G.box(), mats.hazard, s * (e.faces.px + 0.1), 2.2, 0, 0, 0, 0, 0.3, 1.2, e.d * 0.8); C.count(2); },
  vents(C, e) { const { mats, rng } = C; const n = rng.int(3, 7); const s = rng.sign(); for (let i = 0; i < n; i++) C.add(G.box(), mats.dark, s * (e.faces.px + 0.15), e.h * 0.55, -e.d * 0.3 + (e.d * 0.6 * i) / n, 0, 0, 0, 0.3, 4, 1.2); C.count(n); },
  frame(C, e) { const { mats } = C; for (const sx of [-1, 1]) for (const sz of [-1, 1]) C.add(G.box(), mats.truss, sx * e.faces.px, e.h / 2, sz * e.faces.pz, 0, 0, 0, 1.6, e.h, 1.6); C.count(4); },
  patches(C, e) { const { mats, rng } = C; const n = rng.int(3, 7); const pool = [mats.panel, mats.dark, mats.cargo, mats.armour, mats.metal]; for (let i = 0; i < n; i++) { const s = rng.sign(); C.add(G.box(), rng.pick(pool), s * (e.faces.px + 0.25), e.h * rng.range(0.2, 0.8), rng.range(-0.4, 0.4) * e.d, 0, 0, rng.range(-0.1, 0.1), 0.5, rng.range(3, 8), rng.range(3, 9)); } C.count(n); },
  girders(C, e) { const { mats, rng } = C; for (const s of [-1, 1]) C.add(G.box(), mats.truss, s * (e.faces.px + 0.8), e.h / 2, 0, rng.sign() * 0.6, 0, 0, 1.2, 1.2, Math.hypot(e.h, e.d) * 0.7); C.count(2); },
  cables(C, e) { const { mats, rng } = C; const n = rng.int(2, 4); for (let i = 0; i < n; i++) { const s = rng.sign(), z = rng.range(-0.4, 0.4) * e.d; C.add(G.cyl(4), mats.dark, s * e.faces.px * 0.7, e.h * 0.5, z, 0, 0, s * 0.5, 0.15, e.h * 1.1, 0.15); } C.count(n); },
  glassstrip(C, e) { const { mats, rng } = C; const y = e.h * rng.range(0.4, 0.7); for (const s of [-1, 1]) C.add(G.box(), mats.window, s * (e.faces.px + 0.05), y, 0, 0, 0, 0, 0.2, 1.2, e.d * 0.8); C.count(2); },
  dish(C, e) { const { mats, rng } = C; const x = rng.range(-0.3, 0.3) * e.w, z = rng.range(-0.3, 0.3) * e.d, r = rng.range(2.5, 5); const d = C.add(lathe("dish", PROFILES.dish, 16), mats.accent, x, e.top + 3, z, 0.7, rng.range(0, PI), 0, r, r, r); d.userData.gimbal = { amp: 0.2, speed: 0.1 }; C.add(G.cyl(6), mats.metal, x, e.top + 1.5, z, 0, 0, 0, 0.4, 3, 0.4); C.count(2); },
  glazing(C, e) { const { mats } = C; const g = C.add(G.box(), mats.glass, 0, e.top + 0.6, 0, 0, 0, 0, e.w * 0.6, 1.2, e.d * 0.8); g.material.side = 2; C.count(); },
};

/** Apply 1–3 of the style's decors to an envelope, skipping any the family bars. */
export function decorate(C, e, { max = 3, skip = [], force = [] } = {}) {
  const { rng } = C;
  const pool = C.style.decor.filter((k) => !skip.includes(k) && DECOR[k]);
  const n = Math.min(pool.length, rng.int(1, max));
  const picked = new Set(force);
  for (let i = 0; i < n; i++) picked.add(rng.pick(pool));
  for (const k of picked) DECOR[k]?.(C, e);
  return [...picked];
}
