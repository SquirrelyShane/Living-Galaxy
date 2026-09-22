/* Module prefabs. Each draws one module into a group whose frame is:
 * origin on the mount surface, +Y out of the hull, +Z along the structure,
 * +X across. `size` is [w, h, d] in metres. `C` is the build context:
 * mats, rng, style, G, add(geo, mat, x,y,z, rx,ry,rz, sx,sy,sz), lamp(), count().
 *
 * Every prefab rolls a body from the shape grammar (forms.js) — the family
 * says which forms make sense, the station's architecture style weights
 * them, the rng sets proportions — then hangs the family's own kit on the
 * envelope and lets the style decorate. No two modules come out the same. */
import { G, PROFILES, lathe, latheOf } from "../core/geometry.js";
import { FORMS, body, decorate } from "./forms.js";

const PI = Math.PI, H = PI / 2;

/* ---- helpers --------------------------------------------------------------- */
function pipeRun(C, y, z0, z1, x, r = 0.6, mat) {
  C.add(G.cyl(8), mat ?? C.mats.metal, x, y, (z0 + z1) / 2, H, 0, 0, r, Math.abs(z1 - z0), r);
  C.count();
}
function tank(C, x, y, z, r, len, mat, axis = "z") {
  const geo = latheOf(C.rng, "tank", 20, 0.6);
  if (axis === "z") C.add(geo, mat ?? C.mats.hull, x, y, z, H, 0, 0, r, len, r);
  else C.add(geo, mat ?? C.mats.hull, x, y, z, 0, 0, 0, r, len, r);
  C.count();
}
function rack(C, x, y, z, w, h, d, mat) {
  C.add(G.box(), mat ?? C.mats.panel, x, y, z, 0, 0, 0, w, h, d);
  C.add(G.box(), C.mats.dark, x, y + h * 0.45, z, 0, 0, 0, w * 1.02, h * 0.06, d * 1.02);
  C.count(2);
}
/** A gimballed turret: barbette, a body of some form, barrels — all in one child group that traverses. */
function turret(C, x, y, z, r, barrels, len, o = {}) {
  const { mats, rng } = C;
  C.add(G.cyl(12), mats.dark, x, y + 1, z, 0, 0, 0, r * 1.2, 2, r * 1.2);
  const t = C.child("turret");
  t.position.set(x, y + 2, z);
  const kind = o.kind ?? rng.pick(["dome", "prism", "faceted", "box"]);
  if (kind === "dome") C.addTo(t, G.dome(12), mats.armour, 0, 0, 0, 0, 0, 0, r, r * 0.9, r);
  else if (kind === "prism") C.addTo(t, G.cyl(rng.pick([6, 8])), mats.armour, 0, r * 0.4, 0, 0, 0, 0, r, r * 0.8, r);
  else if (kind === "faceted") C.addTo(t, G.ico(0), mats.armour, 0, r * 0.5, 0, 0, rng.range(0, 1), 0, r, r * 0.7, r);
  else C.addTo(t, G.box(), mats.armour, 0, r * 0.4, 0, 0, 0, 0, r * 1.8, r * 0.8, r * 1.6);
  for (let i = 0; i < barrels; i++) {
    const off = barrels === 1 ? 0 : (i - (barrels - 1) / 2) * r * 0.55;
    C.addTo(t, G.cyl(8), mats.dark, off, r * 0.6, r * 0.4 + len / 2, H, 0, 0, o.bore ?? 0.7, len, o.bore ?? 0.7);
  }
  t.userData.turret = { amp: o.amp ?? 0.5, speed: o.speed ?? rng.range(0.1, 0.25), phase: rng.range(0, 6) };
  C.count(2 + barrels);
  return t;
}

/* ---- prefabs -------------------------------------------------------------- */
export const PREFABS = {
  /* a pressurised plant: a body with tanks along one side, pipes, a service spine */
  plant(g, [w, h, d], C) {
    const e = body(C, ["block", "barrel", "prism", "stack", "keep", "wedge", "faceted", "vault"], w, h * 0.8, d);
    const n = C.rng.int(2, 4);
    for (let i = 0; i < n; i++) tank(C, e.faces.px + h * 0.12, h * 0.22, -d * 0.35 + (d * 0.7 * i) / n, h * 0.13, d * 0.7 / n * 0.8, C.mats.metal);
    pipeRun(C, e.top + 0.6, -d * 0.45, d * 0.45, -e.faces.px * 0.5, 0.5);
    C.add(G.box(), C.mats.accent, 0, e.top + 0.4, 0, 0, 0, 0, e.w * 0.4, 0.4, d * 0.3);
    C.count();
    decorate(C, e, { skip: ["glazing"] });
    C.lamp(e.faces.px, e.top + 1, d * 0.44, "#ff6a4a", "blink"); C.lamp(-e.faces.px, e.top + 1, -d * 0.44, "#ff6a4a", "blink");
  },
  /* tank farm: spheres and lathes on a frame, sometimes a faceted cryo block */
  tankfarm(g, [w, h, d], C) {
    const { mats, rng } = C;
    C.add(G.box(), mats.dark, 0, 1, 0, 0, 0, 0, w, 1.2, d);
    const layout = rng.pick(["row", "row", "quad", "stack"]);
    const spheres = rng.chance(0.55);
    if (layout === "row") {
      const n = rng.int(3, 5), r = Math.min(w / (n * 1.1) / 2, h * 0.38);
      for (let i = 0; i < n; i++) {
        const x = -w / 2 + (w / n) * (i + 0.5);
        if (spheres) C.add(rng.chance(0.3) ? G.ico(2) : G.sphere(16, 12), mats.metal, x, r + 2, -d * 0.2, 0, rng.range(0, 1), 0, r, r, r);
        else tank(C, x, r + 2, -d * 0.2, r * 0.9, d * 0.5, mats.metal);
        tank(C, x, r * 0.9 + 2, d * 0.28, r * 0.8, d * 0.42, mats.hull);
        C.add(G.cyl(8), mats.dark, x, 1, -d * 0.2, 0, 0, 0, r * 0.9, 2, r * 0.9);
        C.count(3);
      }
    } else if (layout === "quad") {
      const r = Math.min(w, d) * 0.22;
      for (const sx of [-1, 1]) for (const sz of [-1, 1]) { C.add(spheres ? G.sphere(16, 12) : latheOf(rng, "pod", 16), mats.metal, sx * w * 0.25, r + 2, sz * d * 0.25, 0, 0, 0, r, r * (spheres ? 1 : 1.3), r); C.count(); }
      C.add(G.box(), mats.panel, 0, h * 0.4, 0, 0, 0, 0, w * 0.2, h * 0.8, d * 0.2);
    } else {
      const e = FORMS.barrel(C, w, h * 0.5, d, { n: 2 });
      const e2 = FORMS.barrel(C, w * 0.7, h * 0.45, d * 0.9, { n: 1 });
      void e2;
      e.top = h * 0.95;
    }
    pipeRun(C, h * 0.75, -d * 0.45, d * 0.45, 0, 0.5);
    pipeRun(C, h * 0.6, -d * 0.45, d * 0.45, w * 0.3, 0.35);
    C.count();
    decorate(C, { kind: "tankfarm", w, h, d, top: h * 0.6, faces: { px: w / 2, nx: w / 2, pz: d / 2, nz: d / 2 } }, { max: 2, skip: ["bands", "arcade", "glazing", "terrace", "rose"] });
    C.lamp(0, h + 1, 0, "#ffd27a", "pulse");
  },
  /* a glazed hall: a vault, a dome or a barrel of glass with green inside */
  greenhouse(g, [w, h, d], C) {
    const { mats, rng } = C;
    C.add(G.box(), mats.dark, 0, 1.5, 0, 0, 0, 0, w, 3, d);
    const kind = C.rng.weighted([["vault", C.style.forms.vault + 1], ["dome", C.style.forms.dome + 0.5], ["barrel", 1]]);
    let e;
    if (kind === "vault") { e = FORMS.vault(C, w, h, d, { mat: mats.glass, kind: rng.pick(["round", "round", "pointed", "oct"]) }); e.body.material.side = 2; }
    else if (kind === "dome") { e = FORMS.dome(C, w, h, d, { mat: mats.glass }); e.dome.material.side = 2; }
    else {
      const ribs = Math.max(4, Math.round(d / 7));
      for (let i = 0; i <= ribs; i++) { C.add(G.torus(0.04, 6, 24), mats.metal, 0, 3, -d / 2 + (d * i) / ribs, 0, 0, 0, w * 0.5, h * 0.9, 1); C.count(); }
      const glass = C.add(G.tube(24), mats.glass, 0, 3, 0, H, 0, 0, w * 0.5, d, h * 0.9);
      glass.material.side = 2;
      e = { kind: "barrel", w, h, d, top: h, faces: { px: w / 2, nx: w / 2, pz: d / 2, nz: d / 2 } };
    }
    C.add(G.box(), mats.foliage, 0, 5, 0, 0, 0, 0, e.w * 0.86, 3.5, e.d * 0.92);
    const trees = rng.int(4, 9);
    for (let i = 0; i < trees; i++) C.add(rng.chance(0.5) ? G.sphere(8, 6) : G.cone(6), mats.foliage, rng.range(-e.w * 0.35, e.w * 0.35), 7 + rng.range(0, 3), rng.range(-e.d * 0.4, e.d * 0.4), 0, rng.range(0, 3), 0, 4, rng.range(4, 8), 4);
    C.count(2 + trees);
    decorate(C, e, { max: 2, skip: ["plates", "gunport", "patches", "stacks", "hazard", "spire", "rose"] });
    C.lamp(0, e.top + 1, d * 0.5, "#c8ff9a", "pulse");
  },
  /* lab decks: stacks, facets, lanterns — a lot of windows and a cold mast */
  labstack(g, [w, h, d], C) {
    const e = body(C, ["stack", "faceted", "lantern", "prism", "block", "vault", "dome"], w, h * 0.9, d);
    C.add(G.cyl(8), C.mats.metal, e.w * 0.3, e.top + 4, -e.d * 0.3, 0, 0, 0, 0.5, 8, 0.5);
    C.add(G.octa(), C.mats.accent, e.w * 0.3, e.top + 8.5, -e.d * 0.3, 0, 0, 0, 1.4, 1.4, 1.4);
    C.count(2);
    decorate(C, e, { force: C.style.decor.includes("bands") ? ["bands"] : [], skip: ["stacks", "hazard"] });
    C.lamp(-e.w * 0.4, e.top + 1, e.d * 0.4, "#6fc3ff", "blink");
  },
  observatory(g, [w, h, d], C) {
    const { mats, rng } = C;
    const variant = rng.pick(["dome", "dome", "twin", "lattice"]);
    if (variant === "lattice") {
      /* an open telescope on a yoke */
      C.add(G.cyl(10), mats.dark, 0, h * 0.2, 0, 0, 0, 0, w * 0.2, h * 0.4, w * 0.2);
      const yoke = C.add(G.box(), mats.metal, 0, h * 0.45, 0, 0, 0, 0, w * 0.5, 4, 6);
      yoke.userData.gimbal = { amp: 0.3, speed: 0.06 };
      const tube = C.add(G.tube(12), mats.panel, 0, h * 0.62, 0, 0.5, 0, 0, w * 0.14, h * 0.7, w * 0.14);
      tube.material.side = 2;
      C.add(G.cyl(12), mats.glass, 0, h * 0.62, 0, 0.5, 0, 0, w * 0.13, h * 0.02, w * 0.13);
      C.count(4);
    } else {
      const n = variant === "twin" ? 2 : 1;
      for (let i = 0; i < n; i++) {
        const x = n === 1 ? 0 : (i ? 1 : -1) * w * 0.24, r = n === 1 ? w * 0.45 : w * 0.24;
        C.add(G.cyl(10), mats.dark, x, h * 0.25, 0, 0, 0, 0, r * 0.4, h * 0.5, r * 0.4);
        const dome = C.add(G.dome(24), mats.panel, x, h * 0.5, 0, 0, rng.range(0, PI), 0, r, h * 0.45, r);
        C.add(G.box(), mats.dark, x, h * 0.72, 0, 0, rng.range(0, PI), 0, r * 0.25, h * 0.4, r * 2);   // slit
        C.add(G.cyl(12), mats.metal, x, h * 0.75, 0, 0.6, 0, 0, r * 0.2, h * 0.6, r * 0.2);       // scope
        dome.userData.spin = { axis: "y", speed: rng.range(0.01, 0.04) };
        C.count(4);
      }
    }
    C.add(lathe("dish", PROFILES.dish, 20), mats.accent, w * 0.4, h * 0.6, w * 0.3, 0.4, 0, 0.4, w * 0.25, w * 0.25, w * 0.25).userData.gimbal = { amp: 0.2, speed: 0.07 };
    C.count();
    C.lamp(0, h * 0.98, 0, "#a8dcff", "pulse");
  },
  /* the yard: open jigs on a truss frame, cranes, hulls on the jigs */
  shipyard(g, [w, h, d], C) {
    const { mats, rng } = C;
    C.add(G.box(), mats.truss, 0, 2, 0, 0, 0, 0, w, 3, d);
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) C.add(G.box(), mats.metal, sx * w * 0.42, h * 0.5, sz * d * 0.42, 0, 0, 0, 3, h, 3);
    for (const sx of [-1, 1]) C.add(G.box(), mats.metal, sx * w * 0.42, h * 0.95, 0, 0, 0, 0, 3, 3, d * 0.86);
    const beams = rng.int(1, 3);
    for (let i = 0; i < beams; i++) C.add(G.box(), mats.metal, 0, h * 0.95, -d * 0.3 + (d * 0.6 * i) / Math.max(1, beams - 1), 0, 0, 0, w * 0.86, 3, 3);
    C.count(6 + beams);
    /* hulls on the jigs: one or two, at different stages */
    const hulls = rng.int(1, 2);
    for (let k = 0; k < hulls; k++) {
      const x = hulls === 1 ? 0 : (k ? 1 : -1) * w * 0.22;
      const L = d * rng.range(0.4, 0.6), r = Math.min(w, h) * rng.range(0.1, 0.16);
      const stage = rng.next();
      C.add(latheOf(rng, rng.pick(["tank", "pod", "drum"]), 16), stage > 0.5 ? mats.hull : mats.truss, x, h * 0.42, 0, H, 0, 0, r, L, r);
      if (stage > 0.3) C.add(G.taper(0.3, 12), mats.panel, x, h * 0.42, -L * 0.62, -H, 0, 0, r, L * 0.25, r);
      C.add(G.box(), mats.hazard, x, h * 0.42 - r - 1.5, 0, 0, 0, 0, r * 2.4, 1.6, L * 0.9);
      const arms = rng.int(2, 5);
      for (let i = 0; i < arms; i++) C.add(G.box(), mats.metal, x + rng.range(-r * 1.5, r * 1.5), h * 0.42 + r * 0.8, rng.range(-L * 0.4, L * 0.4), 0, 0, 0, 1, 6, 1);
      C.count(3 + arms);
    }
    const crane = C.add(G.box(), mats.accent, 0, h * 0.9, 0, 0, 0, 0, 6, 4, 8);
    crane.userData.traffic = { axis: "z", amp: d * 0.35, speed: 0.15, phase: rng.range(0, 6) };
    for (let i = 0; i < 6; i++) C.lamp(rng.range(-w * 0.4, w * 0.4), h * 0.98, rng.range(-d * 0.4, d * 0.4), "#ffb070", "steady", 1.6);
  },
  /* refinery drums, furnace stacks, a lot of pipe */
  works(g, [w, h, d], C) {
    const { mats, rng } = C;
    const e = body(C, ["barrel", "cradle", "block", "prism", "cluster", "keep"], w, h * 0.75, d);
    const stacksN = rng.int(2, 4);
    for (let i = 0; i < stacksN; i++) {
      const z = -d * 0.35 + (d * 0.7 * i) / Math.max(1, stacksN - 1), x = rng.sign() * e.faces.px * rng.range(0.4, 0.9);
      const r = w * rng.range(0.035, 0.06), hh = h * rng.range(0.9, 1.15);
      C.add(G.cyl(10), mats.hull, x, hh * 0.5, z, 0, 0, 0, r, hh, r);
      C.add(G.cyl(10), mats.hot, x, hh, z, 0, 0, 0, r * 0.9, 1.5, r * 0.9).userData.pulse = { speed: rng.range(0.6, 1.4), amp: 0.3, phase: i };
      C.count(2);
    }
    pipeRun(C, e.top * 0.8, -d * 0.48, d * 0.48, 0, 0.8);
    pipeRun(C, e.top * 0.9, -d * 0.48, d * 0.48, w * 0.05, 0.5);
    decorate(C, e, { force: ["pipes"], skip: ["arcade", "rose", "glazing", "terrace"] });
    C.lamp(e.faces.px * 0.8, h * 1.15, 0, "#ff8a3d", "pulse", 2.5);
  },
  /* market concourse: a long hall with a glazed roof and a lot of light */
  concourse(g, [w, h, d], C) {
    const { mats } = C;
    const e = body(C, ["vault", "block", "prism", "stack", "keep", "lantern"], w, h * 0.75, d);
    if (e.kind !== "vault") { const roof = C.add(G.tube(20), mats.glass, 0, e.top, 0, H, 0, 0, e.w * 0.45, e.d * 0.85, h * 0.25); roof.material.side = 2; C.count(); }
    C.add(G.box(), mats.glow, 0, e.top - 0.4, 0, 0, 0, 0, e.w * 0.5, 0.5, e.d * 0.8);
    C.count();
    decorate(C, e, { force: C.style.decor.includes("arcade") ? ["arcade"] : C.style.decor.includes("bands") ? ["bands"] : [], skip: ["stacks", "hazard", "plates"] });
    C.lamp(0, e.top + 1.5, e.d * 0.5, "#ffd27a", "steady", 2);
  },
  warehouse(g, [w, h, d], C) {
    const { mats, rng } = C;
    const e = body(C, ["block", "prism", "keep", "wedge", "barrel", "cradle"], w, h * 0.85, d);
    /* containers stacked outside, in yard colours */
    const n = rng.int(3, 8);
    for (let i = 0; i < n; i++) C.add(G.box(), rng.chance(0.6) ? mats.cargo : rng.chance(0.5) ? mats.panel : mats.accent, rng.sign() * (e.faces.px + 3), 2 + rng.int(0, 2) * 3.2, rng.range(-0.4, 0.4) * d, 0, 0, 0, 4, 3, rng.range(6, 12));
    C.add(G.box(), mats.hazard, 0, 3, e.faces.pz + 0.2, 0, 0, 0, e.w * 0.4, h * 0.4, 0.4);
    C.count(n + 1);
    decorate(C, e, { max: 2, skip: ["arcade", "rose", "glazing", "spire"] });
    C.lamp(-e.faces.px, e.top + 1, 0, "#ff6a4a", "blink");
  },
  /* command deck: a lens of windows on a neck, in whatever body the style favours */
  command(g, [w, h, d], C) {
    const { mats, rng } = C;
    const variant = rng.pick(["lens", "lens", "lantern", "dome", "faceted", "keep"]);
    if (variant === "lens") {
      C.add(G.cyl(14), mats.dark, 0, h * 0.2, 0, 0, 0, 0, w * 0.25, h * 0.4, w * 0.25);
      const sides = rng.pick([8, 12, 24, 24]);
      C.add(G.cyl(sides), mats.hull, 0, h * 0.62, 0, 0, 0, 0, w * 0.5, h * 0.5, d * 0.5);
      C.add(G.cyl(sides), mats.window, 0, h * 0.62, 0, 0, 0, 0, w * 0.505, h * 0.14, d * 0.505);
      C.add(G.dome(sides), mats.panel, 0, h * 0.87, 0, 0, 0, 0, w * 0.5, h * 0.2, d * 0.5);
      C.count(4);
    } else {
      const e = FORMS[variant](C, w, h * 0.9, d);
      C.add(G.cyl(12), mats.window, 0, e.top * 0.7, 0, 0, 0, 0, e.w * 0.52, h * 0.1, e.d * 0.52);
      C.count();
      decorate(C, e, { max: 2, skip: ["stacks", "hazard", "pipes", "patches"] });
    }
    C.add(G.cyl(8), mats.metal, 0, h * 1.1, 0, 0, 0, 0, 0.6, h * 0.5, 0.6);
    C.count();
    C.lamp(0, h * 1.35, 0, "#ffffff", "strobe", 3);
  },
  tower(g, [w, h, d], C) {
    const { mats, rng } = C;
    const variant = rng.pick(["mast", "lantern", "prism", "lattice"]);
    if (variant === "lattice") {
      for (const sx of [-1, 1]) for (const sz of [-1, 1]) C.add(G.box(), mats.truss, sx * w * 0.2, h * 0.4, sz * w * 0.2, sx * 0.08, 0, -sz * 0.08, 1.2, h * 0.8, 1.2);
      C.count(4);
    } else if (variant === "lantern") FORMS.lantern(C, w, h * 0.85, d);
    else if (variant === "prism") FORMS.prism(C, w * 0.5, h * 0.8, d * 0.5, { upright: true });
    else C.add(G.cyl(10), mats.metal, 0, h * 0.4, 0, 0, 0, 0, w * 0.18, h * 0.8, w * 0.18);
    C.add(G.cyl(rng.pick([8, 12, 16])), mats.hull, 0, h * 0.86, 0, 0, 0, 0, w * 0.5, h * 0.2, w * 0.5);
    C.add(G.cyl(12), mats.window, 0, h * 0.9, 0, 0, 0, 0, w * 0.505, h * 0.06, w * 0.505);
    const radar = C.add(G.box(), mats.accent, 0, h * 1.02, 0, 0, 0, 0, w * 0.9, 0.6, 2.5);
    radar.userData.spin = { axis: "y", speed: rng.range(0.6, 1.2) };
    C.count(4);
    C.lamp(0, h * 1.08, 0, "#ff4a5a", "blink", 3);
  },
  /* tier I quarters: cabin pods clustered on a frame — rows, a hive or a stack */
  podblock(g, [w, h, d], C) {
    const { mats, rng } = C;
    C.add(G.box(), mats.dark, 0, 1.5, 0, 0, 0, 0, w * 0.9, 3, d * 0.9);
    const layout = rng.pick(["rows", "rows", "hive", "stack"]);
    const geo = latheOf(rng, "pod", 16, 0.8);
    if (layout === "stack") {
      const e = body(C, ["stack", "block", "prism", "keep"], w, h, d);
      decorate(C, e, { force: ["bands"].filter((k) => C.style.decor.includes(k)), skip: ["stacks", "hazard", "pipes"] });
    } else {
      const cols = layout === "hive" ? 4 : rng.int(2, 3), rows = Math.max(2, Math.round(d / (layout === "hive" ? 12 : 16)));
      const r = Math.min(w / (cols * 2.3), 7);
      for (let i = 0; i < cols; i++) for (let k = 0; k < rows; k++) {
        const x = -w / 2 + (w / cols) * (i + 0.5) + (layout === "hive" && k % 2 ? w / cols * 0.5 : 0), z = -d / 2 + (d / rows) * (k + 0.5);
        if (Math.abs(x) > w / 2 - r * 0.5) continue;
        C.add(geo, i % 2 ? mats.panel : mats.hull, x, r + 3, z, 0, 0, 0, r, r * 1.6, r);
        C.add(G.box(), rng.chance(0.8) ? mats.window : mats.dark, x, r + 3, z + r * 0.55, 0, 0, 0, r * 0.5, r * 0.4, 0.3);
        C.count(2);
      }
      C.add(G.box(), mats.panel, 0, h * 0.85, 0, 0, 0, 0, w * 0.7, 2, d * 0.8);
      C.count();
    }
    C.lamp(w * 0.45, h * 0.9, d * 0.45, "#ffe3b0", "steady");
  },
  /* tier II quarters: the ring section this sits on gets streets and windows */
  ringsection(g, [w, h, d], C) {
    const { mats, rng } = C;
    const e = body(C, ["block", "stack", "prism", "vault"], w, h * 0.5, d);
    C.add(G.box(), mats.window, 0, e.top + 0.2, 0, 0, 0, 0, e.w * 0.6, 0.4, e.d * 0.7);
    const towers = rng.int(2, 5);
    for (let i = 0; i < towers; i++) C.add(rng.chance(0.5) ? G.box() : G.cyl(8), i % 2 ? mats.panel : mats.hull, -e.w * 0.35 + (e.w * 0.7 * i) / Math.max(1, towers - 1), e.top + h * 0.15, rng.range(-0.2, 0.2) * e.d, 0, 0, 0, e.w * 0.12, h * 0.3 * rng.range(0.7, 1.3), e.d * 0.5);
    C.count(1 + towers);
    decorate(C, e, { force: C.style.decor.includes("bands") ? ["bands"] : C.style.decor.includes("arcade") ? ["arcade"] : [], skip: ["stacks", "hazard", "pipes"] });
    C.lamp(0, h * 0.72, d * 0.45, "#ffe3b0", "steady");
  },
  habdrum() { /* the drum is structure: see builder/hull.js habitatDrum */ },
  hall(g, [w, h, d], C) {
    const e = body(C, ["vault", "block", "prism", "stack", "keep", "dome", "barrel", "lantern"], w, h * 0.85, d);
    C.add(G.box(), C.mats.window, 0, e.top + 0.2, 0, 0, 0, 0, e.w * 0.5, 0.4, e.d * 0.6);
    C.count();
    decorate(C, e, { force: C.style.decor.includes("bands") ? ["bands"] : C.style.decor.includes("arcade") ? ["arcade"] : [], skip: ["stacks", "hazard"] });
  },
  brig(g, [w, h, d], C) {
    const e = body(C, ["keep", "block", "faceted", "wedge", "prism"], w, h, d);
    C.add(G.box(), C.mats.metal, 0, e.h * 0.5, 0, 0, 0, 0, e.w * 1.04, e.h * 0.25, e.d * 1.04);
    for (let i = 0; i < 4; i++) C.add(G.box(), C.mats.hazard, -e.w * 0.3 + i * e.w * 0.2, e.h * 0.5, e.faces.pz + 0.2, 0, 0, 0, 1.6, 1.6, 0.3);
    C.count(5);
    decorate(C, e, { max: 1, skip: ["arcade", "rose", "glazing", "bands", "spire"] });
    C.lamp(0, e.top + 1.5, 0, "#ff4a5a", "double");
  },
  shelter(g, [w, h, d], C) {
    const e = body(C, ["barrel", "faceted", "keep", "block"], w, h, d);
    C.add(G.box(), C.mats.hazard, 0, e.h * 0.5, 0, 0, 0, 0, e.w * 1.05, e.w * 0.3, 1.2);
    C.count();
  },
  /* solar wings on a tracking yoke — the panel plane faces +Y (the sun side); single, twin, split or twisted */
  solarwing(g, [w, h, d], C) {
    const { mats, rng } = C;
    C.add(G.cyl(10), mats.metal, 0, h * 0.5, 0, 0, 0, 0, 2, h, 2);
    const yoke = C.add(G.box(), mats.dark, 0, h, 0, 0, 0, 0, 6, 3, 6);
    const variant = rng.pick(["single", "twin", "split", "twisted", "ladder"]);
    const panels = variant === "twin" ? 2 : variant === "split" ? 4 : variant === "ladder" ? rng.int(3, 6) : 1;
    for (let i = 0; i < panels; i++) {
      let x = 0, z = 0, pw = w, pd = d * 0.92, rz = 0, ry = 0;
      if (variant === "twin") { x = (i ? 1 : -1) * w * 0.26; pw = w * 0.48; }
      if (variant === "split") { x = (i % 2 ? 1 : -1) * w * 0.26; z = (i < 2 ? -1 : 1) * d * 0.26; pw = w * 0.48; pd = d * 0.46; }
      if (variant === "ladder") { z = -d / 2 + (d * (i + 0.5)) / panels; pd = d / panels * 0.8; }
      if (variant === "twisted") { rz = rng.range(-0.25, 0.25); }
      C.add(G.box(), mats.solar, x, h + 1.5, z, 0, ry, rz, pw, 0.5, pd);
      C.add(G.box(), mats.metal, x, h + 1.9, z, 0, ry, rz, pw * 1.01, 0.3, 1.2);
      const cells = Math.max(3, Math.round(pw / 12));
      for (let k = 1; k < cells; k++) C.add(G.box(), mats.metal, x - pw / 2 + (pw * k) / cells, h + 1.9, z, 0, ry, rz, 0.3, 0.3, pd);
      C.count(2 + cells);
    }
    yoke.userData.gimbal = { amp: 0.12, speed: 0.05 };
    C.lamp(w * 0.5, h + 2, 0, "#ff6a4a", "blink"); C.lamp(-w * 0.5, h + 2, 0, "#33ff66", "blink");
  },
  /* a radial fan of petals on a hub */
  solarfan(g, [w, h, d], C) {
    const { mats, rng } = C;
    C.add(G.cyl(10), mats.metal, 0, h * 0.4, 0, 0, 0, 0, 2.5, h * 0.8, 2.5);
    const hub = C.add(G.cyl(12), mats.dark, 0, h, 0, 0, 0, 0, 6, 3, 6);
    const n = rng.int(7, 14), R = Math.min(w, d) * 0.48, tilt = rng.range(0, 0.2);
    for (let i = 0; i < n; i++) {
      const a = (i / n) * PI * 2;
      const pw = (2 * PI * R) / n * 0.8;
      C.add(G.box(), mats.solar, Math.cos(a) * R * 0.55, h + 1.5 + Math.sin(i) * 0.2, Math.sin(a) * R * 0.55, tilt * Math.sin(a), -a, tilt * Math.cos(a), R * 0.9, 0.4, pw);
      C.add(G.box(), mats.metal, Math.cos(a) * R * 0.55, h + 1.9, Math.sin(a) * R * 0.55, 0, -a, 0, R * 0.9, 0.3, 0.6);
    }
    hub.userData.gimbal = { amp: 0.1, speed: 0.04 };
    hub.userData.spin = { axis: "y", speed: 0.02 };
    C.count(2 + n * 2);
    C.lamp(0, h + 3, 0, "#ff6a4a", "blink");
  },
  /* a single thin-film sail on catenary booms */
  solarsail(g, [w, h, d], C) {
    const { mats, rng } = C;
    C.add(G.cyl(10), mats.metal, 0, h * 0.5, 0, 0, 0, 0, 2, h, 2);
    const yoke = C.add(G.box(), mats.dark, 0, h, 0, 0, 0, 0, 6, 3, 6);
    const sail = C.add(G.box(), mats.solar, 0, h + 3, 0, 0, 0, 0, w * 0.96, 0.25, d * 0.96);
    sail.userData.pulse = { speed: 0.3, amp: 0.3, phase: rng.range(0, 3) };
    for (const [sx, sz] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) {
      const L = Math.hypot(w * 0.48, d * 0.48);
      C.add(G.cyl(6), mats.metal, sx * w * 0.24, h + 2.5, sz * d * 0.24, H, 0, Math.atan2(-sx * w * 0.48, sz * d * 0.48), 0.6, L, 0.6);
      C.add(G.cyl(4), mats.dark, sx * w * 0.24, h + 1.5, sz * d * 0.24, 0.5 * sz, 0, -0.5 * sx, 0.15, L * 0.8, 0.15);
    }
    yoke.userData.gimbal = { amp: 0.08, speed: 0.04 };
    C.count(10);
    C.lamp(w * 0.48, h + 3.5, d * 0.48, "#ff6a4a", "blink"); C.lamp(-w * 0.48, h + 3.5, -d * 0.48, "#33ff66", "blink");
  },
  /* dishes that focus the sun on cells */
  concentrators(g, [w, h, d], C) {
    const { mats, rng } = C;
    C.add(G.box(), mats.truss, 0, 1.5, 0, 0, 0, 0, w, 3, d);
    const cols = rng.int(2, 3), rows = rng.int(2, 3);
    for (let i = 0; i < cols; i++) for (let k = 0; k < rows; k++) {
      const x = -w / 2 + (w / cols) * (i + 0.5), z = -d / 2 + (d / rows) * (k + 0.5);
      const r = Math.min(w / cols, d / rows) * 0.45;
      C.add(G.cyl(6), mats.metal, x, h * 0.35, z, 0, 0, 0, 0.8, h * 0.7, 0.8);
      const dish = C.add(lathe("dish", PROFILES.dish, 20), mats.solar, x, h * 0.7, z, 0, 0, 0, r, r * 0.8, r);
      dish.userData.gimbal = { amp: 0.08, speed: 0.05 };
      C.add(G.sphere(6, 4), mats.hot, x, h * 0.7 + r * 0.5, z, 0, 0, 0, 1.2, 1.2, 1.2).userData.pulse = { speed: 0.8, amp: 0.4, phase: i + k };
      C.count(3);
    }
    C.lamp(w * 0.5, h + 1, 0, "#ff6a4a", "blink");
  },
  reactor(g, [w, h, d], C) {
    const { mats, rng } = C;
    /* shadow shield first, then the vessel, then the turbomachinery */
    const shieldGeo = rng.chance(0.5) ? G.cyl(24) : G.cyl(8);
    C.add(shieldGeo, mats.dark, 0, h * 0.5, -d * 0.45, H, 0, 0, w * 0.55, 3, w * 0.55);
    const vesselGeo = rng.pick([latheOf(rng, "reactor", 24, 0.6), latheOf(rng, "drum", 24), G.sphere(20, 14), G.ico(1)]);
    C.add(vesselGeo, mats.metal, 0, h * 0.5, 0, H, 0, 0, w * 0.4, d * 0.7, w * 0.4);
    C.add(G.box(), mats.hazard, 0, h * 0.5, 0, 0, 0, 0, w * 0.82, w * 0.82, 1.2);
    const turbos = rng.int(2, 6);
    for (let i = 0; i < turbos; i++) {
      const a = (i / turbos) * PI * 2 + PI / 4;
      C.add(latheOf(rng, "drum", 14), mats.panel, Math.cos(a) * w * 0.32, h * 0.5 + Math.sin(a) * w * 0.32, d * 0.3, H, 0, 0, w * 0.1, d * 0.25, w * 0.1);
      C.count();
    }
    C.add(G.cyl(10), mats.hot, 0, h * 0.5, d * 0.46, H, 0, 0, w * 0.12, 3, w * 0.12).userData.pulse = { speed: 1.3, amp: 0.25, phase: 0 };
    C.count(4);
    if (rng.chance(0.5)) { for (let i = 0; i < 4; i++) { const a = (i / 4) * PI * 2; C.add(G.box(), mats.radiator, Math.cos(a) * w * 0.5, h * 0.5 + Math.sin(a) * w * 0.5, -d * 0.1, 0, 0, a, w * 0.35, 0.4, d * 0.4).userData.pulse = { speed: 0.4, amp: 0.2, phase: i }; } C.count(4); }
    C.lamp(w * 0.42, h * 0.95, 0, "#ff4a5a", "double", 2.5);
  },
  /* radiator array: flat fins, a vee, or a radial spray about a spine */
  radiators(g, [w, h, d], C) {
    const { mats, rng } = C;
    C.add(G.box(), mats.metal, 0, 1.5, 0, 0, 0, 0, 3, 3, d);
    const variant = rng.pick(["flat", "flat", "vee", "radial", "stagger"]);
    const n = Math.max(3, Math.round(w / rng.range(16, 26)));
    for (let i = 0; i < n; i++) {
      const x = -w / 2 + (w * (i + 0.5)) / n;
      let rz = 0, y = h + 1, pd = d * 0.95, px = x;
      if (variant === "vee") rz = (x / w) * 0.9;
      if (variant === "stagger") pd = d * (i % 2 ? 0.95 : 0.6);
      if (variant === "radial") { const a = (i / n) * PI; px = Math.cos(a) * w * 0.3; y = h * 0.5 + 1 + Math.sin(a) * w * 0.3; rz = a - H; }
      const p = C.add(G.box(), mats.radiator, px, y, 0, 0, 0, rz, w / n * 0.9, 0.35, pd);
      p.userData.pulse = { speed: 0.4, amp: 0.2, phase: i * 0.7 };
      if (variant !== "radial") C.add(G.box(), mats.metal, x, h * 0.5 + 1, 0, 0, 0, 0, 0.8, h, 0.8);
      C.count(2);
    }
    C.lamp(w * 0.5, h + 1.5, 0, "#ff6a4a", "blink"); C.lamp(-w * 0.5, h + 1.5, 0, "#33ff66", "blink");
  },
  dockcluster(g, [w, h, d], C) {
    const { mats, rng } = C;
    const hubKind = rng.pick(["cyl", "prism", "faceted", "sphere"]);
    const hub = hubKind === "cyl" ? G.cyl(12) : hubKind === "prism" ? G.cyl(rng.pick([6, 8])) : hubKind === "faceted" ? G.ico(1) : G.sphere(16, 12);
    C.add(hub, mats.hull, 0, h * 0.35, 0, 0, 0, 0, w * 0.35, h * 0.7 * (hubKind === "sphere" || hubKind === "faceted" ? 0.5 : 1), w * 0.35);
    const n = rng.int(4, 8);
    for (let i = 0; i < n; i++) {
      const a = (i / n) * PI * 2;
      const x = Math.cos(a) * w * 0.45, z = Math.sin(a) * w * 0.45;
      C.add(G.cyl(10), mats.metal, x, h * 0.4, z, H, 0, a + H, w * 0.06, w * 0.24, w * 0.06);
      C.add(G.torus(0.25, 8, 16), mats.accent, x * 1.2, h * 0.4, z * 1.2, H, 0, a + H, w * 0.09, w * 0.09, w * 0.09);
      C.count(2);
      C.lamp(x * 1.3, h * 0.4, z * 1.3, "#7fffd0", "blink");
    }
    C.add(G.cyl(12), mats.panel, 0, h * 0.8, 0, 0, 0, 0, w * 0.2, h * 0.2, w * 0.2);
    C.count(2);
  },
  /* comms: a dish mast, a lattice tower with drums, or a phased-array pylon */
  commsmast(g, [w, h, d], C) {
    const { mats, rng } = C;
    const variant = rng.pick(["dishes", "dishes", "lattice", "pylon"]);
    if (variant === "lattice") for (const sx of [-1, 1]) for (const sz of [-1, 1]) C.add(G.box(), mats.truss, sx * w * 0.18, h * 0.5, sz * w * 0.18, sx * 0.05, 0, -sz * 0.05, 1, h, 1);
    else C.add(G.cyl(8), mats.metal, 0, h * 0.5, 0, 0, 0, 0, 0.7, h, 0.7);
    C.add(G.box(), mats.dark, 0, h * 0.15, 0, 0, 0, 0, w * 0.5, 4, w * 0.5);
    const n = rng.int(2, 5);
    for (let i = 0; i < n; i++) {
      const y = h * (0.3 + (0.6 * i) / n);
      const a = i * 2.1 + rng.range(0, 1);
      if (variant === "pylon") { C.add(G.box(), mats.accent, Math.cos(a) * w * 0.25, y, Math.sin(a) * w * 0.25, 0, -a, 0, 1, w * 0.5, w * 0.6); }
      else if (variant === "lattice" && i % 2) { C.add(G.cyl(10), mats.panel, Math.cos(a) * w * 0.3, y, Math.sin(a) * w * 0.3, H, 0, a + H, w * 0.12, w * 0.4, w * 0.12); }
      else {
        const r = w * rng.range(0.25, 0.42);
        const dish = C.add(lathe("dish", PROFILES.dish, 18), mats.accent, Math.cos(a) * w * 0.3, y, Math.sin(a) * w * 0.3, 0.6, a, 0, r, r, r);
        dish.userData.gimbal = { amp: 0.25, speed: 0.08 + i * 0.03 };
      }
      C.add(G.cyl(6), mats.metal, Math.cos(a) * w * 0.15, y, Math.sin(a) * w * 0.15, H, 0, a + H, 0.4, w * 0.3, 0.4);
      C.count(2);
    }
    C.add(G.box(), mats.panel, 0, h * 0.8, 0, 0, 0, 0, w * 0.4, w * 0.4, 1.2);
    C.count(3);
    C.lamp(0, h + 1, 0, "#ff4a5a", "blink", 3);
  },
  /* a great dish on a yoke */
  bigdish(g, [w, h, d], C) {
    const { mats, rng } = C;
    C.add(G.cyl(12), mats.dark, 0, h * 0.15, 0, 0, 0, 0, w * 0.12, h * 0.3, w * 0.12);
    const yoke = C.add(G.box(), mats.metal, 0, h * 0.35, 0, 0, 0, 0, w * 0.2, 4, 4);
    const dishG = rng.chance(0.5) ? lathe("dish", PROFILES.dish, 32) : lathe("dish8", PROFILES.dish, 8);
    const dish = C.add(dishG, mats.panel, 0, h * 0.45, 0, rng.range(0.2, 0.6), rng.range(0, PI), 0, w * 0.48, w * 0.48, w * 0.48);
    dish.userData.gimbal = { amp: 0.15, speed: 0.03 };
    for (let i = 0; i < 3; i++) { const a = (i / 3) * PI * 2; C.add(G.cyl(5), mats.metal, Math.cos(a) * w * 0.3, h * 0.6, Math.sin(a) * w * 0.3, 0.9 * Math.sin(a), 0, -0.9 * Math.cos(a), 0.3, w * 0.45, 0.3); }
    C.add(G.box(), mats.accent, 0, h * 0.75, 0, 0, 0, 0, 3, 3, 3);
    yoke.userData.gimbal = { amp: 0.1, speed: 0.03 };
    C.count(7);
    C.lamp(0, h * 0.8, 0, "#ff4a5a", "blink", 2.5);
  },
  /* phased-array slabs at angles */
  phasedslab(g, [w, h, d], C) {
    const { mats, rng } = C;
    C.add(G.box(), mats.dark, 0, 1, 0, 0, 0, 0, w * 0.9, 2, d * 0.9);
    const n = rng.int(2, 4);
    for (let i = 0; i < n; i++) {
      const x = -w / 2 + (w * (i + 0.5)) / n;
      const p = C.add(G.box(), mats.accent, x, h * 0.6, 0, rng.range(-0.4, 0.4), 0, rng.range(-0.3, 0.3), w / n * 0.8, h * 0.9, 1.2);
      p.userData.pulse = { speed: 2 + i, amp: 0.3, phase: i };
      C.add(G.box(), mats.metal, x, h * 0.3, 0, 0, 0, 0, 1, h * 0.6, 1);
      C.count(2);
    }
    C.lamp(w * 0.45, h, 0, "#ff4a5a", "blink", 2);
  },
  sensormast(g, [w, h, d], C) {
    const { mats, rng } = C;
    C.add(G.cyl(8), mats.metal, 0, h * 0.5, 0, 0, 0, 0, 0.6, h, 0.6);
    const radome = C.add(rng.chance(0.5) ? G.sphere(14, 10) : G.ico(1), mats.panel, 0, h + w * 0.3, 0, 0, 0, 0, w * 0.35, w * 0.35, w * 0.35);
    const bars = rng.int(1, 3);
    for (let i = 0; i < bars; i++) { const bar = C.add(G.box(), mats.accent, 0, h * (0.5 + i * 0.2), 0, 0, i * 1.1, 0, w * (1.4 - i * 0.3), 0.5, 1.5); bar.userData.spin = { axis: "y", speed: rng.range(0.8, 1.8) * (i % 2 ? -1 : 1) }; }
    void radome;
    C.count(2 + bars);
    C.lamp(0, h + w * 0.7, 0, "#ff4a5a", "blink", 2.5);
  },
  /* railgun battery: a barbette, a turret of some form, twin rails */
  battery(g, [w, h, d], C) {
    const { mats } = C;
    C.add(G.cyl(12), mats.dark, 0, 1.5, 0, 0, 0, 0, w * 0.5, 3, w * 0.5);
    turret(C, 0, 3, 0, w * 0.3, 2, w * 0.8, { bore: 1.1 });
    C.add(G.box(), mats.armour, 0, h * 0.4, -w * 0.3, 0, 0, 0, w * 0.6, h * 0.35, w * 0.3);
    C.count(2);
    decorate(C, { kind: "battery", w, h, d, top: h * 0.5, faces: { px: w / 2, nx: w / 2, pz: d / 2, nz: d / 2 } }, { max: 1, skip: ["arcade", "rose", "bands", "glazing", "terrace", "spire", "glassstrip"] });
    C.lamp(0, h * 0.95, 0, "#ff4a5a", "double");
  },
  /* point-defence cluster: several small mounts on a plinth */
  pdc(g, [w, h, d], C) {
    const { mats, rng } = C;
    const plinthKind = rng.pick(["cyl", "prism", "box"]);
    C.add(plinthKind === "cyl" ? G.cyl(12) : plinthKind === "prism" ? G.cyl(6) : G.box(), mats.dark, 0, 1.5, 0, 0, 0, 0, w * 0.5, 3, w * 0.5);
    const n = rng.int(3, 5);
    for (let i = 0; i < n; i++) {
      const a = (i / n) * PI * 2, r = w * 0.3;
      turret(C, Math.cos(a) * r, 3, Math.sin(a) * r, w * 0.09, rng.pick([1, 2, 2]), w * 0.28, { bore: 0.35, amp: 0.8, speed: rng.range(0.3, 0.6) });
    }
    C.add(G.cyl(6), mats.metal, 0, h * 0.6, 0, 0, 0, 0, 0.5, h * 0.7, 0.5);
    C.add(G.octa(), mats.accent, 0, h + 1, 0, 0, 0, 0, 1.2, 1.6, 1.2).userData.spin = { axis: "y", speed: 2 };
    C.count(2);
    C.lamp(0, h + 2.5, 0, "#ff4a5a", "blink", 2);
  },
  /* laser battery: an armoured lens turret with radiator fins */
  laserturret(g, [w, h, d], C) {
    const { mats, rng } = C;
    C.add(G.cyl(12), mats.dark, 0, 1.5, 0, 0, 0, 0, w * 0.45, 3, w * 0.45);
    const t = C.add(rng.chance(0.5) ? G.sphere(14, 10) : G.ico(1), mats.armour, 0, 3 + w * 0.3, 0, 0, 0, 0, w * 0.3, w * 0.3, w * 0.3);
    t.userData.turret = { amp: 0.5, speed: rng.range(0.08, 0.2), phase: rng.range(0, 6) };
    C.add(G.cyl(10), mats.dark, 0, 3 + w * 0.3, w * 0.4, H, 0, 0, w * 0.1, w * 0.4, w * 0.1);
    C.add(G.cyl(10), mats.glass, 0, 3 + w * 0.3, w * 0.61, H, 0, 0, w * 0.09, 0.6, w * 0.09).userData.pulse = { speed: 2, amp: 0.5, phase: 0 };
    const fins = rng.int(3, 6);
    for (let i = 0; i < fins; i++) { const a = (i / fins) * PI + 0.2; C.add(G.box(), mats.radiator, Math.cos(a) * w * 0.15, 3 + w * 0.3 + Math.sin(a) * w * 0.15, -w * 0.25, 0, 0, a - H, w * 0.35, 0.3, w * 0.3).userData.pulse = { speed: 0.5, amp: 0.3, phase: i }; }
    C.count(4 + fins);
    C.lamp(0, 3 + w * 0.65, 0, "#ff4a5a", "double");
  },
  /* vertical launch cells: a flat block with a grid of lids, some open and lit */
  vls(g, [w, h, d], C) {
    const { mats, rng } = C;
    const e = body(C, ["block", "keep", "wedge"], w, h * 0.7, d);
    const cols = rng.int(3, 5), rows = rng.int(4, 7);
    for (let i = 0; i < cols; i++) for (let k = 0; k < rows; k++) {
      const x = -e.w * 0.4 + (e.w * 0.8 * (i + 0.5)) / cols, z = -e.d * 0.4 + (e.d * 0.8 * (k + 0.5)) / rows;
      const open = rng.chance(0.12);
      C.add(G.box(), open ? mats.glow : mats.dark, x, e.top + 0.3, z, 0, 0, 0, e.w * 0.8 / cols * 0.75, 0.6, e.d * 0.8 / rows * 0.75);
      if (open) C.add(G.cone(6), mats.metal, x, e.top + 2, z, 0, 0, 0, 0.6, 3, 0.6);
    }
    C.count(cols * rows);
    C.add(G.box(), mats.hazard, 0, e.top + 0.2, e.faces.pz * 0.95, 0, 0, 0, e.w * 0.8, 0.3, 0.6);
    C.count();
    C.lamp(e.faces.px, e.top + 1, e.faces.pz, "#ff4a5a", "double");
  },
  /* the spinal mass driver: rails out along +Y (the station axis at an end cap), capacitor rings, a muzzle */
  spinal(g, [w, h, d], C) {
    const { mats, rng } = C;
    const L = h * rng.range(3, 4.2), r = w * 0.18;
    C.add(G.cyl(rng.pick([8, 12, 16])), mats.armour, 0, h * 0.25, 0, 0, 0, 0, w * 0.5, h * 0.5, w * 0.5);   // breech housing
    const rails = rng.pick([2, 3, 4]);
    for (let i = 0; i < rails; i++) { const a = (i / rails) * PI * 2; C.add(G.box(), mats.metal, Math.cos(a) * r, h * 0.5 + L / 2, Math.sin(a) * r, 0, -a, 0, 2.4, L, 1.6); }
    C.add(G.cyl(12), mats.dark, 0, h * 0.5 + L / 2, 0, 0, 0, 0, r * 0.55, L, r * 0.55);   // bore
    const rings = rng.int(5, 9);
    for (let i = 0; i < rings; i++) {
      const y = h * 0.5 + (L * (i + 0.5)) / rings;
      const cap = C.add(G.torus(0.14, 8, 24), i % 3 === 2 ? mats.accent : mats.metal, 0, y, 0, H, 0, 0, r * 1.5, r * 1.5, r * 1.5);
      if (i % 3 === 2) cap.userData.pulse = { speed: 1.6, amp: 0.6, phase: i * 0.4 };
    }
    C.add(G.taper(1.3, 12), mats.armour, 0, h * 0.5 + L + 3, 0, PI, 0, 0, r * 1.4, 6, r * 1.4);   // muzzle brake
    C.add(G.cyl(12), mats.glow, 0, h * 0.5 + L + 6.2, 0, 0, 0, 0, r * 0.5, 0.6, r * 0.5).userData.pulse = { speed: 0.7, amp: 0.8, phase: 0 };
    for (let i = 0; i < 4; i++) { const a = (i / 4) * PI * 2 + PI / 4; C.add(G.box(), mats.radiator, Math.cos(a) * w * 0.45, h * 0.6, Math.sin(a) * w * 0.45, 0, -a, 0, w * 0.3, h * 0.5, 0.5).userData.pulse = { speed: 0.4, amp: 0.2, phase: i }; }
    C.count(6 + rails + rings);
    C.lamp(0, h * 0.5 + L + 7, 0, "#ff4a5a", "strobe", 3);
  },
  /* the siege laser: a driver stack, a yoke, a twelve-metre optic that gimbals */
  siege(g, [w, h, d], C) {
    const { mats, rng } = C;
    const e = body(C, ["keep", "block", "prism", "faceted"], w, h * 0.4, d);
    for (let i = 0; i < 4; i++) { const a = (i / 4) * PI * 2; C.add(G.box(), mats.radiator, Math.cos(a) * e.w * 0.55, e.top * 0.5, Math.sin(a) * e.d * 0.55, 0, -a, 0, 0.4, e.top * 0.8, d * 0.35).userData.pulse = { speed: 0.4, amp: 0.25, phase: i }; }
    const yoke = C.add(G.box(), mats.metal, 0, e.top + 3, 0, 0, 0, 0, w * 0.5, 6, 8);
    yoke.userData.gimbal = { amp: 0.25, speed: 0.06 };
    const r = w * 0.3;
    const optic = C.add(lathe("dish", PROFILES.dish, 24), mats.armour, 0, e.top + 6 + r * 0.3, 0, rng.range(0.3, 0.7), rng.range(0, PI), 0, r, r, r);
    optic.userData.turret = { amp: 0.4, speed: 0.07, phase: rng.range(0, 6) };
    C.add(G.cyl(16), mats.glass, 0, e.top + 6 + r * 0.3, 0, rng.range(0.3, 0.7), 0, 0, r * 0.85, 0.5, r * 0.85).userData.pulse = { speed: 1.2, amp: 0.7, phase: 0 };
    const caps = rng.int(4, 8);
    for (let i = 0; i < caps; i++) { const a = (i / caps) * PI * 2; C.add(G.cyl(8), mats.panel, Math.cos(a) * w * 0.4, e.top * 0.5, Math.sin(a) * d * 0.4, 0, 0, 0, 1.8, e.top * 0.8, 1.8); }
    C.count(7 + caps);
    C.lamp(0, e.top + 6 + r * 0.9, 0, "#ff4a5a", "double", 3);
  },
  /* shield emitter array: a generator body, emitter spines with lit tips, a translucent shield petal above */
  shieldnode(g, [w, h, d], C) {
    const { mats, rng } = C;
    const e = body(C, ["barrel", "faceted", "prism", "dome", "keep"], w, h * 0.35, d);
    const n = rng.int(3, 7);
    for (let i = 0; i < n; i++) {
      const a = (i / n) * PI * 2 + rng.range(-0.2, 0.2), rr = Math.min(w, d) * 0.3;
      const x = Math.cos(a) * rr, z = Math.sin(a) * rr, hh = h * rng.range(0.5, 0.75);
      C.add(G.taper(0.15, 6), mats.metal, x, e.top + hh / 2, z, 0, 0, 0, 1.2, hh, 1.2);
      C.add(G.octa(), mats.glow, x, e.top + hh + 1, z, 0, 0, 0, 1, 1.6, 1).userData.pulse = { speed: 2.2, amp: 0.7, phase: i * 0.9 };
    }
    const petal = C.add(G.cyl(6), mats.shield, 0, e.top + h * 0.75, 0, 0, rng.range(0, 1), 0, Math.min(w, d) * 0.55, 0.4, Math.min(w, d) * 0.55);
    petal.userData.shield = { phase: rng.range(0, 6), base: 0.28 };
    C.count(1 + n * 2);
    C.lamp(0, e.top + h * 0.8, 0, "#8fd6ff", "pulse", 2);
  },
  /* drone bay: launch tubes on the +Z face, drones that fly out and come back */
  dronebay(g, [w, h, d], C) {
    const { mats, rng } = C;
    const e = body(C, ["block", "keep", "prism", "wedge", "barrel"], w, h, d);
    const cols = rng.int(3, 4), rows = rng.int(2, 3);
    const tubeR = Math.min(e.w / cols, e.h / rows) * 0.22;
    const tubes = [];
    for (let i = 0; i < cols; i++) for (let k = 0; k < rows; k++) {
      const x = -e.w * 0.35 + (e.w * 0.7 * (i + 0.5)) / cols, y = e.h * 0.25 + (e.h * 0.5 * (k + 0.5)) / rows;
      C.add(G.tube(10), mats.dark, x, y, e.faces.pz + 1.5, H, 0, 0, tubeR, 3, tubeR).material.side = 2;
      C.add(G.torus(0.12, 6, 12), mats.glow, x, y, e.faces.pz + 3, 0, 0, 0, tubeR, tubeR, tubeR);
      tubes.push({ x, y });
    }
    C.count(cols * rows * 2);
    /* 0.3.15: no scenery sorties. The bay's drones are the port's real ones —
     * interceptors off the drone-bay mounts (stationworks.js) and corporate
     * work drones through the hangar (npc/bay.js). The draws stay, so the seed
     * grows the same module. */
    const flying = rng.int(2, 4);
    for (let i = 0; i < flying; i++) { rng.pick(tubes); rng.range(2.5, 4); rng.range(0.6, 1.2); rng.range(24, 40); rng.range(0, 1); rng.range(-0.6, 0.6); }
    decorate(C, e, { max: 1, skip: ["arcade", "rose", "bands", "glazing", "terrace", "spire", "glassstrip"] });
    C.lamp(e.faces.px, e.top + 1, e.faces.pz, "#4fd8b8", "blink"); C.lamp(-e.faces.px, e.top + 1, e.faces.pz, "#ffa040", "blink");
  },
  lifeboats(g, [w, h, d], C) {
    const { mats, rng } = C;
    C.add(G.box(), mats.dark, 0, 1.5, 0, 0, 0, 0, w, 3, d);
    const n = rng.int(3, 6), rows = rng.chance(0.4) ? 2 : 1;
    const geo = latheOf(rng, "pod", 12, 0.6);
    for (let r = 0; r < rows; r++) for (let i = 0; i < n; i++) {
      const x = -w / 2 + (w * (i + 0.5)) / n, y = h * 0.5 * (r + 1) + 3;
      C.add(geo, mats.hazard, x, y, 0, H, 0, 0, h * 0.4 / rows, d * 0.8, h * 0.4 / rows);
      C.count();
      if (r === rows - 1) C.lamp(x, y + h * 0.4, d * 0.4, "#ffb03a", "blink");
    }
  },
};
