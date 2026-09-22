/* Prefabs — Docking, airlocks, bays and surface interfaces.
 * Each prefab: faces (default mount faces), fp(s, part, face) → footprint {w,h,d} in ship units
 * (w along the face u-axis, d along v, h outward), build(g, s, part, S, rng) where g is a group
 * whose +Y points away from the hull and S is the StarshipBuilder (mats, lamp, dockBody…). */
import * as THREE from "three";
import { G, addMesh } from "../core/geometry.js";
import { ALL_FACES } from "./_common.js";

export default {
  dock: { faces: ALL_FACES.concat(["stern", "bow"]), fp: (s, p) => { const k = p.kind === "cargo" ? 1.1 : p.kind === "fuel" ? 0.9 : 1.0; return { w: s * 2.3 * k, h: s * (p.kind === "fuel" ? 1.5 : 0.9) * k, d: s * 2.3 * k }; },
    build(g, s, p, S, rng) { S.dockBody(g, s * (p.kind === "cargo" ? 1.1 : p.kind === "fuel" ? 0.9 : 1.0), p.kind); } },

  airlock: { faces: ALL_FACES, fp: (s) => ({ w: s * 1.6, h: s * 0.55, d: s * 1.9 }),
    build(g, s, p, S, rng) {
      const m = S.mats;
      addMesh(g, G.box(), m.dark, 0, s * 0.1, 0, 0, 0, 0, s * 1.5, s * 0.2, s * 1.8);
      addMesh(g, G.box(), m.hull, 0, s * 0.25, 0, 0, 0, 0, s * 1.0, s * 0.12, s * 1.4);
      const w = addMesh(g, G.cyl(12), m.glassDark, 0, s * 0.32, -s * 0.3, 0, 0, 0, s * 0.22, s * 0.04, s * 0.22); w.castShadow = false;
      S.lamp(g, { color: "#ffdca8", y: s * 0.3, z: -s * 0.3, r: s * 0.09, mode: "steady", base: 2.2 });
      for (const sgn of [-1, 1]) { addMesh(g, G.cyl(6), m.metal, sgn * s * 0.62, s * 0.4, 0, Math.PI / 2, 0, 0, s * 0.03, s * 1.4, s * 0.03);
        for (const z of [-0.6, 0.6]) addMesh(g, G.cyl(6), m.metal, sgn * s * 0.62, s * 0.3, z * s, 0, 0, 0, s * 0.03, s * 0.2, s * 0.03); }
      addMesh(g, G.box(), m.hazard, 0, s * 0.21, s * 0.8, 0, 0, 0, s * 1.4, s * 0.02, s * 0.12);
      S.lamp(g, { color: "#7dffbe", x: s * 0.45, y: s * 0.34, z: s * 0.5, r: s * 0.06, mode: "steady", base: 4 });
      S.lamp(g, { color: "#ff4a5a", x: -s * 0.45, y: s * 0.34, z: s * 0.5, r: s * 0.06, mode: "blink", period: 1.6, duty: 0.2, base: 5 });
      g.userData.dock = { kind: "crew", arms: [], blinkers: [], status: null, airlock: true };
    } },

  bay: { faces: ["top", "bottom", "port", "star"], fp: (s) => ({ w: s * 2.4, h: s * 0.55, d: s * 2.4 }),
    build(g, s, p, S, rng) {
      const m = S.mats;
      addMesh(g, G.box(), m.dark, 0, s * 0.08, 0, 0, 0, 0, s * 2.3, s * 0.16, s * 2.3);
      addMesh(g, G.box(), m.rubber, 0, s * 0.17, 0, 0, 0, 0, s * 1.9, s * 0.02, s * 1.9);
      // payload sitting in the bay
      if (p.drones) for (const sgn of [-1, 1]) { addMesh(g, G.box(), m.metal, sgn * s * 0.5, s * 0.3, 0, 0, 0, 0, s * 0.5, s * 0.22, s * 0.7);
        S.lamp(g, { color: "#ffb03a", x: sgn * s * 0.5, y: s * 0.44, z: -s * 0.3, r: s * 0.05, mode: "blink", period: 1.0, duty: 0.4, phase: sgn * 0.25, base: 6 }); }
      else { addMesh(g, G.sphere(), m.light, 0, s * 0.35, 0, 0, 0, 0, s * 0.3, s * 0.3, s * 0.3);
        S.lamp(g, { color: "#5fd0ff", y: s * 0.68, r: s * 0.06, mode: "pulse", period: 2, base: 5 }); }
      // sliding door halves
      for (const sgn of [-1, 1]) {
        const door = new THREE.Group(); door.position.set(sgn * s * 0.5, s * 0.5, 0);
        door.userData.deploy = { kind: "pos", axis: "x", from: sgn * s * 0.5, to: sgn * s * 1.45 };
        addMesh(door, G.box(), m.hull, 0, 0, 0, 0, 0, 0, s * 0.98, s * 0.08, s * 1.95);
        addMesh(door, G.box(), m.hazard, sgn * -0.46 * s, s * 0.045, 0, 0, 0, 0, s * 0.06, s * 0.01, s * 1.9);
        g.add(door);
      }
      for (const z of [-1, 1]) S.lamp(g, { color: "#ffb03a", x: 0, y: s * 0.2, z: z * s * 1.05, r: s * 0.05, mode: "blink", period: 1.2, duty: 0.5, phase: z > 0 ? 0.5 : 0, base: 5 });
    } },

  landerClamp: { faces: ["bottom"], fp: (s) => ({ w: s * 2.2, h: s * 1.3, d: s * 2.2 }),
    build(g, s, p, S, rng) {
      const m = S.mats;
      addMesh(g, G.cyl(12), m.dark, 0, s * 0.1, 0, 0, 0, 0, s * 0.7, s * 0.2, s * 0.7);
      addMesh(g, G.torus(0.14), m.metal, 0, s * 0.25, 0, Math.PI / 2, 0, 0, s * 0.6, s * 0.6, s * 0.3);
      for (let i = 0; i < 4; i++) {
        const a = i * Math.PI / 2 + Math.PI / 4;
        const leg = new THREE.Group(); leg.position.set(Math.cos(a) * s * 0.55, s * 0.25, Math.sin(a) * s * 0.55); leg.rotation.y = -a;
        leg.userData.deploy = { axis: "z", from: -1.35, to: -0.45 };
        addMesh(leg, G.box(), m.metal, s * 0.45, 0, 0, 0, 0, 0, s * 0.9, s * 0.1, s * 0.1);
        addMesh(leg, G.cyl(8), m.dark, s * 0.9, -s * 0.05, 0, 0, 0, 0, s * 0.2, s * 0.06, s * 0.2);
        g.add(leg);
      }
      S.lamp(g, { color: "#ffb03a", y: s * 0.32, r: s * 0.08, mode: "blink", period: 1.4, duty: 0.3, base: 6 });
    } }
};
