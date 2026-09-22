/* Prefabs — Structural, armor and stores.
 * Each prefab: faces (default mount faces), fp(s, part, face) → footprint {w,h,d} in ship units
 * (w along the face u-axis, d along v, h outward), build(g, s, part, S, rng) where g is a group
 * whose +Y points away from the hull and S is the StarshipBuilder (mats, lamp, dockBody…). */
import * as THREE from "three";
import { G, addMesh } from "../core/geometry.js";
import { ALL_FACES } from "./_common.js";

export default {
  truss: { faces: ALL_FACES, fp: (s, p) => ({ w: s * (p.gantry ? 1.6 : 0.8), h: s * 2.7, d: s * (p.gantry ? 1.6 : 0.8) }),
    build(g, s, p, S, rng) {
      const m = S.mats; const rod = m[p.tint] || m.metal; const H = s * 2.4;
      for (const sx of [-1, 1]) for (const sz of [-1, 1])
        addMesh(g, G.cyl(6), rod, sx * s * 0.3, H / 2, sz * s * 0.3, 0, 0, 0, s * 0.04, H, s * 0.04);
      for (let i = 0; i < 4; i++) { const y = s * 0.3 + i * s * 0.6;
        addMesh(g, G.box(), rod, 0, y, s * 0.3, 0, 0, 0.7, s * 0.03, s * 0.8, s * 0.03);
        addMesh(g, G.box(), rod, 0, y, -s * 0.3, 0, 0, -0.7, s * 0.03, s * 0.8, s * 0.03);
        addMesh(g, G.box(), rod, s * 0.3, y, 0, 0.7, 0, 0, s * 0.03, s * 0.8, s * 0.03);
        addMesh(g, G.box(), rod, -s * 0.3, y, 0, -0.7, 0, 0, s * 0.03, s * 0.8, s * 0.03); }
      addMesh(g, G.box(), m.dark, 0, s * 0.06, 0, 0, 0, 0, s * 0.8, s * 0.12, s * 0.8);
      if (p.gantry) {
        addMesh(g, G.box(), m.panel, 0, H + s * 0.1, 0, 0, 0, 0, s * 1.5, s * 0.2, s * 1.5);
        const head = new THREE.Group(); head.position.set(0, H + s * 0.35, 0); head.userData.spin = { axis: "y", speed: 0.6 };
        addMesh(head, G.box(), m.metal, s * 0.4, 0, 0, 0, 0, 0, s * 0.9, s * 0.12, s * 0.12);
        addMesh(head, G.cyl(8), m.dark, s * 0.7, -s * 0.15, 0, 0, 0, 0, s * 0.08, s * 0.3, s * 0.08);
        S.lamp(head, { color: "#ffb03a", x: s * 0.7, y: -s * 0.32, r: s * 0.06, mode: "blink", period: 0.6, duty: 0.5, base: 6 });
        g.add(head);
      } else if (p.optic) {
        addMesh(g, G.cyl(10), m.dark, 0, H + s * 0.15, 0, Math.PI / 2, 0, 0, s * 0.18, s * 0.6, s * 0.18);
        S.lamp(g, { color: "#bfe4ff", y: H + s * 0.15, z: -s * 0.32, r: s * 0.1, mode: "pulse", period: 3, base: 3 });
      } else {
        addMesh(g, G.box(), m.dark, 0, H + s * 0.05, 0, 0, 0, 0, s * 0.7, s * 0.1, s * 0.7);
        S.lamp(g, { color: p.lamp || "#ffffff", y: H + s * 0.14, r: s * 0.05, mode: "blink", period: 2.4, duty: 0.1, base: 7 });
      }
    } },

  whipple: { faces: ALL_FACES, fp: (s) => ({ w: s * 1.6, h: s * 0.34, d: s * 1.9 }),
    build(g, s, p, S, rng) {
      const m = S.mats; const skin = p.tint === "stealth" ? m.rubber : (m[p.tint] || m.light);
      addMesh(g, G.box(), m.dark, 0, s * 0.06, 0, 0, 0, 0, s * 1.5, s * 0.12, s * 1.8);
      addMesh(g, G.box(), m.metal, 0, s * 0.17, 0, 0, 0, 0, s * 1.42, s * 0.06, s * 1.72);
      addMesh(g, G.box(), skin, 0, s * 0.27, 0, 0, 0, 0, s * 1.5, s * 0.08, s * 1.8);
      for (let i = 0; i < 3; i++) addMesh(g, G.box(), m.dark, 0, s * 0.32, -s * 0.6 + i * s * 0.6, 0, 0, 0, s * 1.5, s * 0.012, s * 0.03);
      for (let i = 0; i < 4; i++) { const a = i * Math.PI / 2 + Math.PI / 4;
        addMesh(g, G.cyl(6), m.metal, Math.cos(a) * s * 0.65, s * 0.28, Math.sin(a) * s * 0.8, 0, 0, 0, s * 0.05, s * 0.1, s * 0.05); }
      if (p.lamp) S.lamp(g, { color: p.lamp, x: s * 0.62, y: s * 0.34, z: s * 0.8, r: s * 0.05, mode: "pulse", period: 3.5, base: 3 });
    } },

  shield: { faces: ["bottom"], fp: (s) => ({ w: s * 2.6, h: s * 0.24, d: s * 3.0 }),
    build(g, s, p, S, rng) {
      const m = S.mats;
      addMesh(g, G.box(), m.dark, 0, s * 0.06, 0, 0, 0, 0, s * 2.5, s * 0.12, s * 2.9);
      for (let i = 0; i < 4; i++) for (let j = 0; j < 5; j++)
        addMesh(g, G.box(), (i + j) % 2 ? m.rubber : m.panel, -s * 0.9 + i * s * 0.6, s * 0.17, -s * 1.1 + j * s * 0.55, 0, 0, 0, s * 0.56, s * 0.1, s * 0.5);
      S.lamp(g, { color: "#ff8a2a", x: s * 1.15, y: s * 0.2, z: s * 1.35, r: s * 0.05, mode: "pulse", period: 3, base: 3 });
    } },

  tank: { faces: ALL_FACES, fp: (s) => ({ w: s * 1.45, h: s * 1.5, d: s * 3.0 }),
    build(g, s, p, S, rng) {
      const m = S.mats; const skin = p.tint === "algae" ? m.algae : (m[p.tint] || m.light);
      addMesh(g, G.box(), m.dark, 0, s * 0.08, 0, 0, 0, 0, s * 1.2, s * 0.16, s * 2.4);
      addMesh(g, G.cyl(16), skin, 0, s * 0.75, 0, Math.PI / 2, 0, 0, s * 0.62, s * 2.2, s * 0.62);
      addMesh(g, G.sphere(), skin, 0, s * 0.75, -s * 1.1, 0, 0, 0, s * 0.62, s * 0.62, s * 0.62);
      addMesh(g, G.sphere(), skin, 0, s * 0.75, s * 1.1, 0, 0, 0, s * 0.62, s * 0.62, s * 0.62);
      for (let i = -1; i <= 1; i++) addMesh(g, G.torus(0.08), p.hazard ? m.hazard : m.metal, 0, s * 0.75, i * s * 0.75, 0, 0, 0, s * 0.64, s * 0.64, s * 0.3);
      for (const sgn of [-1, 1]) addMesh(g, G.box(), m.metal, sgn * s * 0.5, s * 0.3, 0, 0, 0, 0, s * 0.1, s * 0.5, s * 2.0);
      addMesh(g, G.cyl(8), m.metal, 0, s * 1.4, s * 0.6, 0, 0, 0, s * 0.08, s * 0.2, s * 0.08);
      S.lamp(g, { color: p.tint === "algae" ? "#74ffb8" : p.cold ? "#bfe4ff" : "#ffb03a", y: s * 1.52, z: s * 0.6, r: s * 0.06, mode: "pulse", period: 3.2, base: 3.5 });
    } },

  drum: { faces: ALL_FACES, fp: (s) => ({ w: s * 1.9, h: s * 2.0, d: s * 3.0 }),
    build(g, s, p, S, rng) {
      const m = S.mats; const skin = m[p.tint] || m.panel;
      addMesh(g, G.box(), m.dark, 0, s * 0.1, 0, 0, 0, 0, s * 1.4, s * 0.2, s * 2.6);
      for (const z of [-1.2, 1.2]) addMesh(g, G.box(), m.metal, 0, s * 0.6, z * s, 0, 0, 0, s * 1.6, s * 1.0, s * 0.16);
      const drum = new THREE.Group(); drum.position.set(0, s * 1.0, 0); drum.userData.spin = { axis: "z", speed: p.spin || 0.5 };
      addMesh(drum, G.cyl(18), skin, 0, 0, 0, Math.PI / 2, 0, 0, s * 0.85, s * 2.2, s * 0.85);
      for (let i = 0; i < 8; i++) { const a = (i / 8) * Math.PI * 2;
        addMesh(drum, G.box(), m.metal, Math.cos(a) * s * 0.86, Math.sin(a) * s * 0.86, 0, 0, 0, a, s * 0.12, s * 0.12, s * 2.3);
        if (p.windows) for (let k = -1; k <= 1; k++) {
          const w = addMesh(drum, G.box(), m.winLit, Math.cos(a + 0.39) * s * 0.87, Math.sin(a + 0.39) * s * 0.87, k * s * 0.6, 0, 0, a + 0.39, s * 0.05, s * 0.16, s * 0.28);
          w.castShadow = false; w.material = (p.green ? m.algaeLit : m.winLit).clone(); w.material.userData.cloned = true;
          S.tagLamp(w, { mode: rng.chance(0.15) ? "pulse" : "steady", period: rng.range(3, 6), phase: rng.next(), base: 1.8 });
        } }
      g.add(drum);
      if (p.hot) {
        addMesh(g, G.cyl(10), m.metal, 0, s * 1.0, s * 1.5, Math.PI / 2, 0, 0, s * 0.22, s * 0.5, s * 0.22);
        S.lamp(g, { color: "#ff5a2a", y: s * 1.0, z: s * 1.78, r: s * 0.17, mode: "pulse", period: 1.5, base: 5 });
        g.userData.reactor = true;
      }
      S.lamp(g, { color: p.green ? "#74ffb8" : "#ffb03a", x: s * 0.7, y: s * 1.15, z: -s * 1.2, r: s * 0.06, mode: "blink", period: 1.8, duty: 0.3, base: 6 });
    } }
};
