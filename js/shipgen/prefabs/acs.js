/* Prefabs — Attitude control and boosters.
 * Each prefab: faces (default mount faces), fp(s, part, face) → footprint {w,h,d} in ship units
 * (w along the face u-axis, d along v, h outward), build(g, s, part, S, rng) where g is a group
 * whose +Y points away from the hull and S is the StarshipBuilder (mats, lamp, dockBody…). */
import * as THREE from "three";
import { G, addMesh } from "../core/geometry.js";
import { ALL_FACES } from "./_common.js";

export default {
  rcs: { faces: ALL_FACES, fp: (s) => ({ w: s * 0.9, h: s * 0.6, d: s * 0.9 }),
    build(g, s, p, S, rng) {
      const m = S.mats;
      addMesh(g, G.box(), m.dark, 0, s * 0.18, 0, 0, 0, 0, s * 0.7, s * 0.36, s * 0.7);
      const nozzles = [];
      const spec = [[s * 0.42, s * 0.18, 0, 0, 0, -Math.PI / 2, [1, 0, 0]], [-s * 0.42, s * 0.18, 0, 0, 0, Math.PI / 2, [-1, 0, 0]],
                    [0, s * 0.18, s * 0.42, Math.PI / 2, 0, 0, [0, 0, 1]], [0, s * 0.18, -s * 0.42, -Math.PI / 2, 0, 0, [0, 0, -1]],
                    [0, s * 0.46, 0, 0, 0, 0, [0, 1, 0]]];
      for (const [x, y, z, rx, ry, rz, dir] of spec) {
        addMesh(g, G.taper(1.8, 10), m.metal, x, y, z, rx, ry, rz, s * 0.08, s * 0.18, s * 0.08);
        nozzles.push({ pos: [x + dir[0] * s * 0.1, y + dir[1] * s * 0.1, z + dir[2] * s * 0.1], dir });
      }
      g.userData.rcs = { nozzles };
      S.lamp(g, { color: "#ffffff", x: s * 0.28, y: s * 0.38, z: s * 0.28, r: s * 0.04, mode: "steady", base: 2 });
    } },

  cmg: { faces: ALL_FACES, fp: (s) => ({ w: s * 1.2, h: s * 1.3, d: s * 1.2 }),
    build(g, s, p, S, rng) {
      const m = S.mats;
      addMesh(g, G.cyl(12), m.dark, 0, s * 0.08, 0, 0, 0, 0, s * 0.55, s * 0.16, s * 0.55);
      const cage = new THREE.Group(); cage.position.set(0, s * 0.68, 0); cage.userData.spin = { axis: "y", speed: p.fast ? 4.5 : 0.9 };
      addMesh(cage, G.torus(0.06), m.metal, 0, 0, 0, 0, 0, 0, s * 0.5, s * 0.5, s * 0.5);
      addMesh(cage, G.torus(0.06), m.metal, 0, 0, 0, Math.PI / 2, 0, 0, s * 0.5, s * 0.5, s * 0.5);
      const rotor = addMesh(cage, G.sphere(), p.fast ? m.metal : m.light, 0, 0, 0, 0, 0, 0, s * 0.36, s * 0.36, s * 0.36);
      rotor.userData.spin = { axis: "x", speed: p.fast ? 9 : 2.2 };
      g.add(cage);
      addMesh(g, G.cyl(8), m.metal, 0, s * 0.3, 0, 0, 0, 0, s * 0.06, s * 0.3, s * 0.06);
      S.lamp(g, { color: p.fast ? "#ffb03a" : "#7dffbe", x: s * 0.4, y: s * 0.18, z: s * 0.4, r: s * 0.05, mode: "pulse", period: 1.6, base: 4 });
    } },

  torquer: { faces: ALL_FACES, fp: (s) => ({ w: s * 0.45, h: s * 0.45, d: s * 2.6 }),
    build(g, s, p, S, rng) {
      const m = S.mats;
      for (const z of [-1, 1]) addMesh(g, G.box(), m.dark, 0, s * 0.1, z * s * 0.9, 0, 0, 0, s * 0.3, s * 0.2, s * 0.2);
      addMesh(g, G.cyl(10), m.metal, 0, s * 0.22, 0, Math.PI / 2, 0, 0, s * 0.12, s * 2.4, s * 0.12);
      for (let i = 0; i < 6; i++) addMesh(g, G.torus(0.1), m.accent, 0, s * 0.22, -s * 1.0 + i * s * 0.4, 0, 0, 0, s * 0.13, s * 0.13, s * 0.08);
      S.lamp(g, { color: "#cf8bff", y: s * 0.36, z: -s * 1.2, r: s * 0.04, mode: "pulse", period: 2.2, base: 3 });
    } },

  srb: { faces: ["port", "star", "bottom"], fp: (s) => ({ w: s * 1.6, h: s * 1.7, d: s * 5.0 }),
    build(g, s, p, S, rng) {
      const m = S.mats;
      for (const z of [-1.3, 1.3]) addMesh(g, G.box(), m.metal, 0, s * 0.3, z * s, 0, 0, 0, s * 0.5, s * 0.6, s * 0.2);
      addMesh(g, G.cyl(16), m.light, 0, s * 0.95, 0, Math.PI / 2, 0, 0, s * 0.62, s * 3.8, s * 0.62);
      addMesh(g, G.cone(16), m.light, 0, s * 0.95, -s * 2.4, -Math.PI / 2, 0, 0, s * 0.62, s * 1.0, s * 0.62);
      for (let i = -1; i <= 1; i++) addMesh(g, G.torus(0.06), m.hazard, 0, s * 0.95, i * s * 1.2, 0, 0, 0, s * 0.63, s * 0.63, s * 0.3);
      addMesh(g, G.taper(1.9, 14), m.engine, 0, s * 0.95, s * 2.2, Math.PI / 2, 0, 0, s * 0.35, s * 0.6, s * 0.35);
      // booster plume — only lit above 85% throttle
      const pm = m.glow.clone(); pm.transparent = true; pm.opacity = 0.42; pm.depthWrite = false; pm.emissiveIntensity = 2.6; pm.userData.cloned = true;
      const pl = addMesh(g, G.coneOpen(14), pm, 0, s * 0.95, s * 2.5 + s * 1.6, Math.PI / 2, 0, 0, s * 0.6, s * 3.2, s * 0.6);
      pl.castShadow = false; pl.userData.srb = { baseY: s * 3.2, op: 0.42 };
      S.lamp(g, { color: "#ff4a3a", y: s * 1.6, z: s * 1.9, r: s * 0.06, mode: "pulse", period: 1.1, base: 4 });
    } }
};
