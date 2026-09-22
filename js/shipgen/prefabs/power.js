/* Prefabs — Power plants, arrays and thermal rejection.
 * Each prefab: faces (default mount faces), fp(s, part, face) → footprint {w,h,d} in ship units
 * (w along the face u-axis, d along v, h outward), build(g, s, part, S, rng) where g is a group
 * whose +Y points away from the hull and S is the StarshipBuilder (mats, lamp, dockBody…). */
import * as THREE from "three";
import { G, addMesh } from "../core/geometry.js";
import { ALL_FACES } from "./_common.js";

export default {
  reactor: { faces: ALL_FACES, fp: (s) => ({ w: s * 2.5, h: s * 2.3, d: s * 3.2 }),
    build(g, s, p, S, rng) {
      const m = S.mats;
      addMesh(g, G.box(), m.dark, 0, s * 0.1, 0, 0, 0, 0, s * 2.2, s * 0.2, s * 3.0);
      // shadow shield toward the ship's forward end
      addMesh(g, G.cyl(16), m.metal, 0, s * 1.05, -s * 1.3, Math.PI / 2, 0, 0, s * 1.1, s * 0.16, s * 1.1);
      if (p.torus) {
        const core = addMesh(g, G.torus(0.42), m.panel, 0, s * 1.05, 0, Math.PI / 2, 0, 0, s * 0.75, s * 0.75, s * 0.75);
        const coil = addMesh(g, G.torus(0.14), m.hot, 0, s * 1.05, 0, Math.PI / 2, 0, 0, s * 0.75, s * 0.75, s * 0.8);
        coil.castShadow = false; coil.userData.pulse = { amp: 0.12, speed: 3 };
        for (let i = 0; i < 8; i++) { const a = (i / 8) * Math.PI * 2;
          addMesh(g, G.box(), m.metal, Math.cos(a) * s * 0.75, s * 1.05, Math.sin(a) * s * 0.75, 0, -a, 0, s * 0.5, s * 0.8, s * 0.16); }
      } else {
        addMesh(g, G.cyl(16), m.panel, 0, s * 1.05, 0.2 * s, Math.PI / 2, 0, 0, s * 0.72, s * 2.0, s * 0.72);
        for (let i = 0; i < 4; i++) addMesh(g, G.torus(0.1), m.metal, 0, s * 1.05, -s * 0.5 + i * s * 0.45, 0, 0, 0, s * 0.74, s * 0.74, s * 0.3);
        const core = addMesh(g, G.cyl(14), m.hot, 0, s * 1.05, s * 1.25, Math.PI / 2, 0, 0, s * 0.3, s * 0.12, s * 0.3);
        core.castShadow = false; core.userData.pulse = { amp: 0.2, speed: 2.4 };
      }
      // radiator fins
      for (const sgn of [-1, 1]) {
        addMesh(g, G.box(), m.light, sgn * s * 1.0, s * 1.4, s * 0.4, 0, 0, sgn * 0.25, s * 0.06, s * 1.4, s * 1.8);
        for (let i = 0; i < 4; i++) addMesh(g, G.box(), m.accent, sgn * s * 1.0, s * 1.4, -s * 0.3 + i * s * 0.45, 0, 0, sgn * 0.25, s * 0.07, s * 1.3, s * 0.03);
      }
      g.userData.reactor = true;
      S.lamp(g, { color: "#ff4a5a", y: s * 2.15, z: -s * 1.3, r: s * 0.08, mode: "strobe", period: 1.2, base: 8 });
      S.lamp(g, { color: "#7dffbe", x: s * 0.6, y: s * 0.24, z: -s * 1.4, r: s * 0.06, mode: "steady", base: 4 });
    } },

  rtg: { faces: ALL_FACES, fp: (s) => ({ w: s * 1.1, h: s * 1.1, d: s * 2.0 }),
    build(g, s, p, S, rng) {
      const m = S.mats;
      addMesh(g, G.box(), m.dark, 0, s * 0.08, 0, 0, 0, 0, s * 0.6, s * 0.16, s * 1.6);
      addMesh(g, G.cyl(12), m.metal, 0, s * 0.55, 0, Math.PI / 2, 0, 0, s * 0.28, s * 1.7, s * 0.28);
      for (let i = 0; i < 8; i++) { const a = (i / 8) * Math.PI * 2;
        addMesh(g, G.box(), m.light, Math.cos(a) * s * 0.4, s * 0.55 + Math.sin(a) * s * 0.4, 0, 0, 0, a, s * 0.32, s * 0.03, s * 1.5); }
      const glow = addMesh(g, G.cyl(10), m.hot, 0, s * 0.55, s * 0.9, Math.PI / 2, 0, 0, s * 0.14, s * 0.1, s * 0.14);
      glow.castShadow = false; glow.userData.pulse = { amp: 0.1, speed: 1.4 };
      S.lamp(g, { color: p.lamp || "#ff8a2a", y: s * 1.0, z: -s * 0.8, r: s * 0.05, mode: "pulse", period: 4, base: 3 });
    } },

  /* deployable array: an accordion of panel segments on a root hinge.
   * Stowed: root lies flat, segments fold back over each other (alternating up/down).
   * Deployed: root stands the stack off the hull, segments unfold into one long wing. */
  array: { faces: ["port", "star", "top", "bottom"],
    fp: (s, p) => {
      const n = p.deploy ? (p.segs || 3) : 1;
      // stowedFp: hull flies through air with wings folded, so only the folded stack claims space
      const h = s * (p.deploy && !p.stowedFp ? 0.35 + n * 1.45 : 0.4);
      // edgewise: the wing is turned 90° about the face normal so its edge, not its face, meets the flow
      return p.edgewise ? { w: s * 1.6, h, d: s * 2.3 } : { w: s * 2.3, h, d: s * 1.6 };
    },
    build(g, s, p, S, rng) {
      const m = S.mats; const n = p.deploy ? (p.segs || 3) : 1;
      if (p.edgewise) { const inner = new THREE.Group(); inner.rotation.y = Math.PI / 2; g.add(inner); g = inner; }
      const segL = s * 1.4, segW = s * 2.05, th = s * 0.05;
      const face = p.tint === "solar" ? m.solar : p.tint === "radiator" ? m.light : m.glassDark;
      addMesh(g, G.box(), m.dark, 0, s * 0.08, -s * 0.6, 0, 0, 0, s * 2.1, s * 0.16, s * 0.3);
      addMesh(g, G.cyl(8), m.metal, 0, s * 0.2, -s * 0.6, 0, 0, Math.PI / 2, s * 0.07, s * 2.1, s * 0.07);
      const root = new THREE.Group(); root.position.set(0, s * 0.24, -s * 0.6);
      if (p.deploy) root.userData.deploy = { axis: "x", from: 0, to: -Math.PI / 2 };
      g.add(root);
      let parent = root;
      for (let k = 0; k < n; k++) {
        const seg = new THREE.Group();
        if (k > 0) {
          // hinge on the far edge of the previous segment; alternate the offset side so the folded stack climbs
          const side = k % 2 ? 1 : -1;
          seg.position.set(0, side * th * 3, segL);
          seg.userData.deploy = { axis: "x", from: side * Math.PI, to: 0 };
          addMesh(seg, G.cyl(8), m.metal, 0, 0, 0, 0, 0, Math.PI / 2, th * 1.4, segW * 0.9, th * 1.4);
        }
        addMesh(seg, G.box(), m.metal, 0, 0, segL / 2, 0, 0, 0, segW * 1.04, th * 1.5, segL * 0.98);
        const sheet = addMesh(seg, G.box(), face, 0, th * 1.1, segL / 2, 0, 0, 0, segW, th * 0.6, segL * 0.9); sheet.castShadow = false;
        if (p.tint === "solar") {
          for (let i = -3; i <= 3; i++) addMesh(seg, G.box(), m.metal, i * segW * 0.14, th * 1.45, segL / 2, 0, 0, 0, s * 0.012, th * 0.2, segL * 0.9);
          for (let j = 1; j < 4; j++) addMesh(seg, G.box(), m.metal, 0, th * 1.45, j * segL / 4, 0, 0, 0, segW, th * 0.2, s * 0.012);
        }
        if (p.tint === "radiator") {
          for (let i = -3; i <= 3; i++) addMesh(seg, G.box(), m.accent, i * segW * 0.14, th * 1.5, segL / 2, 0, 0, 0, s * 0.03, th * 0.3, segL * 0.85);
          // heat glow rides the far edge of every segment, not past it
          S.lamp(seg, { box: true, color: "#ff6a3a", y: th * 1.5, z: segL * 0.95, r: 1, sx: segW * 0.86, sy: th * 0.5, sz: th * 0.9, mode: "pulse", period: 3 + k * 0.4, base: 2 });
        }
        if (p.tint === "dark") S.lamp(seg, { color: "#5fd0ff", x: segW * 0.45, y: th * 1.6, z: segL * 0.5, r: s * 0.05, mode: "pulse", period: 2.8, base: 3.5 });
        parent.add(seg); parent = seg;
      }
      // tip lamp on the last segment's outer edge
      S.lamp(parent, { color: p.tint === "solar" ? "#ffffff" : "#ffb03a", y: th * 1.6, z: segL * 0.97, r: s * 0.05, mode: "blink", period: 1.8, duty: 0.15, base: 6 });
      if (p.deploy) S.lamp(g, { color: "#ffb03a", x: s * 1.0, y: s * 0.2, z: -s * 0.6, r: s * 0.05, mode: "blink", period: 1.6, duty: 0.2, base: 5 });
    } },

  sail: { faces: ["top", "bottom"], fp: (s) => ({ w: s * 2.6, h: s * 2.0, d: s * 2.6 }),
    build(g, s, p, S, rng) {
      const m = S.mats;
      addMesh(g, G.cyl(10), m.dark, 0, s * 0.1, 0, 0, 0, 0, s * 0.4, s * 0.2, s * 0.4);
      addMesh(g, G.cyl(8), m.metal, 0, s * 0.7, 0, 0, 0, 0, s * 0.07, s * 1.2, s * 0.07);
      const hub = new THREE.Group(); hub.position.set(0, s * 1.3, 0); g.add(hub);
      addMesh(hub, G.cyl(10), m.metal, 0, 0, 0, 0, 0, 0, s * 0.18, s * 0.2, s * 0.18);
      const N = 8;
      for (let i = 0; i < N; i++) {
        const vane = new THREE.Group(); vane.userData.deploy = { axis: "y", from: 0, to: (i / N) * Math.PI * 2 };
        addMesh(vane, G.box(), m.metal, 0, 0, -s * 0.6, 0, 0, 0, s * 0.03, s * 0.03, s * 1.2);
        const sheet = addMesh(vane, G.box(), m.sail, 0, 0, -s * 0.7, 0, 0, 0, s * 0.45, s * 0.012, s * 1.1);
        sheet.castShadow = false;
        hub.add(vane);
      }
      S.lamp(g, { color: "#ffffff", y: s * 1.45, r: s * 0.06, mode: "blink", period: 2.2, duty: 0.1, base: 7 });
    } }
};
