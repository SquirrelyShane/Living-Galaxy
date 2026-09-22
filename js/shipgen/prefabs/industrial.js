/* Prefabs — Mining, manipulation and labs.
 * Each prefab: faces (default mount faces), fp(s, part, face) → footprint {w,h,d} in ship units
 * (w along the face u-axis, d along v, h outward), build(g, s, part, S, rng) where g is a group
 * whose +Y points away from the hull and S is the StarshipBuilder (mats, lamp, dockBody…). */
import * as THREE from "three";
import { G, addMesh } from "../core/geometry.js";
import { ALL_FACES } from "./_common.js";

export default {
  drill: { faces: ["bottom", "port", "star", "bow"],
    fp: (s, p, face) => face === "bow" ? { w: s * 2.4, h: s * 5.6, d: s * 2.4 } : { w: s * 2.4, h: s * 1.9, d: s * 5.6 },
    build(g0, s, p, S, rng) {
      const face = g0.userData.part ? g0.userData.part.face : "bow";
      let g = g0;
      if (face !== "bow") {
        // lay the boom along the hull, shoulder aft, cutter head reaching past the bow
        g = new THREE.Group(); g.rotation.x = -Math.PI / 2; g.position.set(0, s * 0.35, s * 2.6); g0.add(g);
        addMesh(g0, G.box(), S.mats.dark, 0, s * 0.2, s * 2.0, 0, 0, 0, s * 1.6, s * 0.4, s * 1.4);
      }
      const m = S.mats; const r = s * 0.42, arm = s * 3.2;
      addMesh(g, G.box(), m.dark, 0, s * 0.35, 0, 0, 0, 0, r * 2.6, s * 0.7, r * 2.6);
      addMesh(g, G.cyl(10), m.metal, 0, s * 0.7 + arm * 0.35, 0, 0, 0, 0, r * 0.85, arm * 0.75, r * 0.85);
      // inner stage telescopes out when mining starts (see ops: dd.ext)
      const inner = addMesh(g, G.cyl(10), m.panel, 0, s * 0.7 + arm * 0.72, 0, 0, 0, 0, r * 0.62, arm * 0.5, r * 0.62);
      for (const sgn of [-1, 1]) addMesh(g, G.cyl(6), m.metal, sgn * r * 0.9, s * 0.7 + arm * 0.35, r * 0.5, 0, 0, 0, r * 0.16, arm * 0.55, r * 0.16);
      const head = new THREE.Group(); head.position.set(0, s * 0.7 + arm * 0.98, 0);
      head.userData.spin = { axis: "y", speed: rng.range(2.4, 4.0) * rng.sign() };
      addMesh(head, G.cyl(12), m.metal, 0, 0, 0, 0, 0, 0, r * 1.3, r * 1.1, r * 1.3);
      for (let j = 0; j < 6; j++) { const a = (j / 6) * Math.PI * 2;
        addMesh(head, G.box(), m.panel, Math.cos(a) * r * 0.95, r * 1.1, Math.sin(a) * r * 0.95, 0, -a, 0, r * 0.30, r * 2.4, r * 0.30); }
      addMesh(head, G.cone(12), m.metal, 0, r * 2.6, 0, 0, 0, 0, r * 1.0, r * 1.9, r * 1.0);
      const bit = addMesh(head, G.cone(8), m.hot, 0, r * 3.6, 0, 0, 0, 0, r * 0.28, r * 0.7, r * 0.28);
      bit.castShadow = false; bit.userData.pulse = { amp: 0.12, speed: 7 };
      g.add(head);
      const tipY = head.position.y + r * 3.9;
      g0.userData.drill = { head, tip: [0, tipY, 0], tipBase: tipY, emitter: [0, s * 0.7 + arm * 0.55, -r * 1.9], baseSpin: head.userData.spin.speed, node: g,
        inner, innerBaseY: inner.position.y, innerBaseScale: inner.scale.y, headBaseY: head.position.y, ext: 0, extTarget: 0, extMax: arm * 0.9 };
      // reserve the cutting envelope ahead of the head so nothing else mounts in the drill's swing
      g0.userData.workzone = { node: g, center: [0, tipY + s * 1.5, 0], size: [s * 1.7, s * 3.2, s * 1.7] };
      S.lamp(g, { color: "#fff0c8", y: s * 0.7 + arm * 0.55, z: -r * 1.9, r: r * 0.34, mode: "steady", base: 5 });
      S.lamp(g, { color: "#ff8a2a", x: r * 1.7, y: s * 0.7, z: r * 1.6, r: r * 0.30, mode: "blink", period: 0.9, duty: 0.3, phase: rng.next(), base: 7 });
    } },

  intake: { faces: ["bottom", "bow"], fp: (s) => ({ w: s * 2.8, h: s * 0.85, d: s * 2.6 }),
    build(g, s, p, S, rng) {
      const m = S.mats;
      addMesh(g, G.box(), m.dark, 0, s * 0.3, 0, 0, 0, 0, s * 2.6, s * 0.6, s * 2.4);
      const maw = addMesh(g, G.box(), m.glassDark, 0, s * 0.62, -s * 0.3, 0, 0, 0, s * 2.1, s * 0.08, s * 1.4); maw.castShadow = false;
      for (let i = 0; i < 5; i++) addMesh(g, G.box(), m.metal, -s * 0.9 + i * s * 0.45, s * 0.66, -s * 0.3, 0, 0, 0, s * 0.05, s * 0.06, s * 1.4);
      addMesh(g, G.box(), m.metal, 0, s * 0.62, s * 0.75, 0, 0, 0, s * 0.9, s * 0.16, s * 0.9);
      for (let i = 0; i < 6; i++) S.lamp(g, { color: "#ffb03a", x: -s * 1.1 + i * s * 0.44, y: s * 0.7, z: -s * 1.1, r: s * 0.06, mode: "chase", period: 1.3, i, count: 6, base: 6 });
      g.userData.intake = { mouth: [0, s * 0.7, -s * 0.3] };
    } },

  grapple: { faces: ALL_FACES, fp: (s) => ({ w: s * 1.2, h: s * 1.7, d: s * 3.0 }),
    build(g, s, p, S, rng) {
      const m = S.mats;
      addMesh(g, G.cyl(12), m.dark, 0, s * 0.12, 0, 0, 0, 0, s * 0.55, s * 0.24, s * 0.55);
      const yaw = new THREE.Group(); yaw.position.set(0, s * 0.35, 0);
      yaw.userData.scan = { base: 0, yawAmp: 0.35, yawSpeed: 0.12, pitchAmp: 0.05, pitchSpeed: 0.1, phase: rng.next() * 6 };
      addMesh(yaw, G.box(), m.hull, 0, s * 0.15, 0, 0, 0, 0, s * 0.6, s * 0.4, s * 0.6);
      addMesh(yaw, G.box(), m.metal, 0, s * 0.55, -s * 0.6, 0.5, 0, 0, s * 0.22, s * 0.22, s * 1.5);
      addMesh(yaw, G.cyl(8), m.dark, 0, s * 0.9, -s * 1.2, 0, 0, Math.PI / 2, s * 0.16, s * 0.4, s * 0.16);
      addMesh(yaw, G.box(), m.metal, 0, s * 0.9, -s * 0.2, 0, 0, 0, s * 0.18, s * 0.18, s * 2.0);
      for (const sgn of [-1, 1]) addMesh(yaw, G.box(), m.dark, sgn * s * 0.18, s * 0.8, s * 0.9, 0.6 * sgn, 0, 0, s * 0.08, s * 0.5, s * 0.1);
      S.lamp(yaw, { color: "#ffb03a", y: s * 1.02, z: s * 0.8, r: s * 0.06, mode: "blink", period: 1.1, duty: 0.4, base: 6 });
      g.add(yaw);
    } },

  lab: { faces: ALL_FACES, fp: (s) => ({ w: s * 1.8, h: s * 1.5, d: s * 2.0 }),
    build(g, s, p, S, rng) {
      const m = S.mats;
      addMesh(g, G.box(), m.panel, 0, s * 0.45, 0, 0, 0, 0, s * 1.7, s * 0.9, s * 1.9);
      addMesh(g, G.dome(), p.green ? m.algae : m.light, 0, s * 0.9, -s * 0.3, 0, 0, 0, s * 0.55, s * 0.5, s * 0.55);
      addMesh(g, G.torus(0.1), m.metal, 0, s * 0.9, -s * 0.3, Math.PI / 2, 0, 0, s * 0.56, s * 0.56, s * 0.2);
      for (let i = 0; i < 3; i++) { const w = addMesh(g, G.cyl(10), m.glassDark, s * 0.86, s * 0.5, -s * 0.5 + i * s * 0.5, 0, 0, Math.PI / 2, s * 0.14, s * 0.04, s * 0.14); w.castShadow = false;
        S.lamp(g, { color: "#ffdca8", x: s * 0.84, y: s * 0.5, z: -s * 0.5 + i * s * 0.5, r: s * 0.06, mode: "steady", base: 2.4 }); }
      addMesh(g, G.cyl(6), m.metal, s * 0.5, s * 1.2, s * 0.6, 0, 0, 0, s * 0.03, s * 0.6, s * 0.03);
      S.lamp(g, { color: "#7dffbe", x: s * 0.5, y: s * 1.52, z: s * 0.6, r: s * 0.05, mode: "blink", period: 2, duty: 0.15, base: 6 });
    } }
};
