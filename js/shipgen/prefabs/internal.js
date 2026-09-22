/* Prefabs — Flush / boxed hardware for internal systems.
 * Each prefab: faces (default mount faces), fp(s, part, face) → footprint {w,h,d} in ship units
 * (w along the face u-axis, d along v, h outward), build(g, s, part, S, rng) where g is a group
 * whose +Y points away from the hull and S is the StarshipBuilder (mats, lamp, dockBody…). */
import { G, addMesh } from "../core/geometry.js";
import { ALL_FACES } from "./_common.js";

export default {
  hatch: { faces: ALL_FACES, fp: (s) => ({ w: s * 1.0, h: s * 0.16, d: s * 1.0 }),
    build(g, s, p, S, rng) {
      const m = S.mats;
      addMesh(g, G.box(), m.dark, 0, s * 0.04, 0, 0, 0, 0, s * 0.96, s * 0.08, s * 0.96);
      addMesh(g, G.box(), m.metal, 0, s * 0.09, 0, 0, 0, 0, s * 0.72, s * 0.03, s * 0.72);
      if (p.ring) addMesh(g, G.torus(0.08), m.accent, 0, s * 0.11, 0, Math.PI / 2, 0, 0, s * 0.34, s * 0.34, s * 0.2);
      if (p.hazard) for (const sgn of [-1, 1]) addMesh(g, G.box(), m.hazard, sgn * s * 0.42, s * 0.1, 0, 0, 0, 0, s * 0.06, s * 0.02, s * 0.9);
      for (let i = 0; i < 4; i++) { const a = i * Math.PI / 2 + Math.PI / 4;
        addMesh(g, G.cyl(6), m.metal, Math.cos(a) * s * 0.4, s * 0.1, Math.sin(a) * s * 0.4, 0, 0, 0, s * 0.05, s * 0.04, s * 0.05); }
      S.lamp(g, { color: p.lamp || "#7dffbe", y: s * 0.13, r: s * 0.06, mode: rng.chance(0.5) ? "steady" : "pulse", period: rng.range(2, 5), phase: rng.next(), base: 3 });
    } },

  module: { faces: ALL_FACES, fp: (s) => ({ w: s * 1.6, h: s * 0.95, d: s * 1.6 }),
    build(g, s, p, S, rng) {
      const m = S.mats; const body = m[p.tint] || m.panel;
      addMesh(g, G.box(), body, 0, s * 0.42, 0, 0, 0, 0, s * 1.5, s * 0.8, s * 1.5);
      addMesh(g, G.box(), m.metal, 0, s * 0.84, 0, 0, 0, 0, s * 1.3, s * 0.06, s * 1.3);
      for (let i = -1; i <= 1; i++) addMesh(g, G.box(), m.dark, s * 0.76, s * 0.45 + i * s * 0.16, 0, 0, 0, 0, s * 0.03, s * 0.06, s * 1.1);
      for (let i = -1; i <= 1; i++) addMesh(g, G.box(), m.dark, -s * 0.76, s * 0.45 + i * s * 0.16, 0, 0, 0, 0, s * 0.03, s * 0.06, s * 1.1);
      if (p.window) { const w = addMesh(g, G.box(), m.glassDark, 0, s * 0.5, -s * 0.755, 0, 0, 0, s * 0.9, s * 0.3, s * 0.03); w.castShadow = false;
        S.lamp(g, { color: "#ffdca8", y: s * 0.5, z: -s * 0.72, r: s * 0.06, mode: "steady", base: 2.4 }); }
      if (p.cold) for (let i = 0; i < 3; i++) addMesh(g, G.torus(0.06), m.light, 0, s * 0.2 + i * s * 0.22, s * 0.76, 0, 0, 0, s * 0.18, s * 0.18, s * 0.1);
      S.lamp(g, { color: p.lamp || "#5fd0ff", x: s * 0.55, y: s * 0.9, z: s * 0.55, r: s * 0.07, mode: "pulse", period: rng.range(1.8, 4), phase: rng.next(), base: 4 });
      S.lamp(g, { color: p.cold ? "#bfe4ff" : "#7dffbe", x: -s * 0.55, y: s * 0.9, z: s * 0.55, r: s * 0.05, mode: "steady", base: 3 });
    } },

  coilBank: { faces: ALL_FACES, fp: (s) => ({ w: s * 1.3, h: s * 1.25, d: s * 1.3 }),
    build(g, s, p, S, rng) {
      const m = S.mats;
      addMesh(g, G.cyl(12), m.dark, 0, s * 0.08, 0, 0, 0, 0, s * 0.6, s * 0.16, s * 0.6);
      for (let i = 0; i < 3; i++) {
        addMesh(g, G.torus(0.22), i % 2 ? m.metal : m.panel, 0, s * 0.3 + i * s * 0.3, 0, Math.PI / 2, 0, 0, s * 0.5, s * 0.5, s * 0.28);
      }
      addMesh(g, G.cyl(10), m.metal, 0, s * 0.6, 0, 0, 0, 0, s * 0.16, s * 1.1, s * 0.16);
      const halo = addMesh(g, G.torus(0.05), p.cold ? m.hot : m.accent, 0, s * 1.14, 0, Math.PI / 2, 0, 0, s * 0.42, s * 0.42, s * 0.2);
      halo.castShadow = false; halo.userData.pulse = { amp: 0.08, speed: 2.2 };
      S.lamp(g, { color: p.cold ? "#bfe4ff" : "#ffb03a", y: s * 1.18, r: s * 0.06, mode: "pulse", period: 2.4, base: 4 });
    } }
};
