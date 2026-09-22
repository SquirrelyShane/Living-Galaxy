/* Prefabs — stores, fluid interfaces, thermal louvers, cargo, robots, beacons.
 * Added with the 21-domain catalog; same contract as every other prefab file. */
import * as THREE from "three";
import { G, addMesh } from "../core/geometry.js";
import { ALL_FACES } from "./_common.js";

export default {
  /* spherical COPV / pressurant bottle in a cradle */
  sphereTank: { faces: ALL_FACES, fp: (s) => ({ w: s * 1.5, h: s * 1.6, d: s * 1.5 }),
    build(g, s, p, S, rng) {
      const m = S.mats; const skin = m[p.tint] || m.light;
      addMesh(g, G.box(), m.dark, 0, s * 0.08, 0, 0, 0, 0, s * 1.1, s * 0.16, s * 1.1);
      for (let i = 0; i < 4; i++) { const a = i * Math.PI / 2 + Math.PI / 4;
        addMesh(g, G.box(), m.metal, Math.cos(a) * s * 0.42, s * 0.42, Math.sin(a) * s * 0.42, 0, -a, 0.55, s * 0.08, s * 0.7, s * 0.08); }
      addMesh(g, G.sphere(), skin, 0, s * 0.85, 0, 0, 0, 0, s * 0.62, s * 0.62, s * 0.62);
      addMesh(g, G.torus(0.06), p.hazard ? m.hazard : m.metal, 0, s * 0.85, 0, Math.PI / 2, 0, 0, s * 0.63, s * 0.63, s * 0.3);
      addMesh(g, G.cyl(8), m.metal, 0, s * 1.52, 0, 0, 0, 0, s * 0.08, s * 0.16, s * 0.08);
      S.lamp(g, { color: p.hazard ? "#ffb03a" : "#7dffbe", y: s * 1.62, r: s * 0.05, mode: "pulse", period: 3.4, base: 3.5 });
    } },

  /* umbilical / quick-disconnect panel: recessed plate, QD rows, hose stubs */
  umbilical: { faces: ALL_FACES.concat(["stern"]), fp: (s) => ({ w: s * 1.5, h: s * 0.5, d: s * 1.2 }),
    build(g, s, p, S, rng) {
      const m = S.mats;
      addMesh(g, G.box(), m.dark, 0, s * 0.08, 0, 0, 0, 0, s * 1.4, s * 0.16, s * 1.1);
      addMesh(g, G.box(), m.hazard, 0, s * 0.17, -s * 0.5, 0, 0, 0, s * 1.4, s * 0.02, s * 0.08);
      for (let i = 0; i < 3; i++) for (let j = 0; j < 2; j++) {
        const x = (i - 1) * s * 0.4, z = (j - 0.5) * s * 0.4;
        addMesh(g, G.cyl(10), m.metal, x, s * 0.24, z, 0, 0, 0, s * 0.14, s * 0.16, s * 0.14);
        addMesh(g, G.cyl(10), j ? m.rubber : m.glassDark, x, s * 0.33, z, 0, 0, 0, s * 0.1, s * 0.04, s * 0.1);
      }
      addMesh(g, G.cyl(6), m.rubber, s * 0.6, s * 0.3, s * 0.2, 0.9, 0, 0, s * 0.05, s * 0.5, s * 0.05);
      S.lamp(g, { color: p.lamp || "#7dffbe", x: -s * 0.6, y: s * 0.22, z: s * 0.45, r: s * 0.05, mode: "steady", base: 3.5 });
      S.lamp(g, { color: "#ffb03a", x: s * 0.6, y: s * 0.22, z: s * 0.45, r: s * 0.05, mode: "blink", period: 1.4, duty: 0.3, base: 5 });
      g.userData.dock = { kind: "fuel", arms: [], blinkers: [], status: null, umbilical: true };
    } },

  /* louvered radiator: slats that open with the deploy toggle */
  louver: { faces: ALL_FACES, fp: (s) => ({ w: s * 2.0, h: s * 0.6, d: s * 1.5 }),
    build(g, s, p, S, rng) {
      const m = S.mats;
      addMesh(g, G.box(), m.dark, 0, s * 0.06, 0, 0, 0, 0, s * 1.9, s * 0.12, s * 1.4);
      addMesh(g, G.box(), m.light, 0, s * 0.14, 0, 0, 0, 0, s * 1.8, s * 0.04, s * 1.3);
      for (let i = -3; i <= 3; i++) {
        const slat = new THREE.Group(); slat.position.set(i * s * 0.25, s * 0.2, 0);
        slat.userData.deploy = { axis: "z", from: 0, to: 1.2 };
        addMesh(slat, G.box(), m.panel, 0, s * 0.12, 0, 0, 0, 0, s * 0.22, s * 0.24, s * 1.25);
        g.add(slat);
      }
      S.lamp(g, { box: true, color: "#ff6a3a", y: s * 0.16, z: s * 0.68, r: 1, sx: s * 1.7, sy: s * 0.03, sz: s * 0.05, mode: "pulse", period: 3, base: 2 });
    } },

  /* MLI blanket — gold foil with strap grid */
  mli: { faces: ALL_FACES, fp: (s) => ({ w: s * 1.8, h: s * 0.18, d: s * 2.0 }),
    build(g, s, p, S, rng) {
      const m = S.mats;
      addMesh(g, G.box(), m.foil, 0, s * 0.07, 0, 0, 0, 0, s * 1.7, s * 0.12, s * 1.9);
      for (let i = -1; i <= 1; i++) addMesh(g, G.box(), m.dark, i * s * 0.55, s * 0.14, 0, 0, 0, 0, s * 0.03, s * 0.012, s * 1.9);
      for (let j = -1; j <= 1; j++) addMesh(g, G.box(), m.dark, 0, s * 0.14, j * s * 0.6, 0, 0, 0, s * 1.7, s * 0.012, s * 0.03);
    } },

  /* emergency beacon: dome, cage, hard white strobe */
  beacon: { faces: ALL_FACES, fp: (s) => ({ w: s * 0.8, h: s * 0.9, d: s * 0.8 }),
    build(g, s, p, S, rng) {
      const m = S.mats;
      addMesh(g, G.cyl(10), m.dark, 0, s * 0.1, 0, 0, 0, 0, s * 0.35, s * 0.2, s * 0.35);
      addMesh(g, G.dome(), m.hazard, 0, s * 0.2, 0, 0, 0, 0, s * 0.3, s * 0.34, s * 0.3);
      for (let i = 0; i < 4; i++) { const a = i * Math.PI / 2;
        addMesh(g, G.cyl(4), m.metal, Math.cos(a) * s * 0.3, s * 0.4, Math.sin(a) * s * 0.3, 0, 0, 0, s * 0.02, s * 0.5, s * 0.02); }
      addMesh(g, G.torus(0.06), m.metal, 0, s * 0.65, 0, Math.PI / 2, 0, 0, s * 0.3, s * 0.3, s * 0.2);
      S.lamp(g, { color: p.lamp || "#ffffff", y: s * 0.62, r: s * 0.12, mode: "strobe", period: 1.0, base: 12 });
    } },

  /* standard cargo rack / container stack */
  container: { faces: ALL_FACES, fp: (s) => ({ w: s * 1.7, h: s * 1.3, d: s * 2.2 }),
    build(g, s, p, S, rng) {
      const m = S.mats;
      addMesh(g, G.box(), m.dark, 0, s * 0.08, 0, 0, 0, 0, s * 1.6, s * 0.16, s * 2.1);
      const cols = [m.panel, m.light, m.metal, m.hull];
      for (let i = 0; i < 2; i++) for (let j = 0; j < 2; j++) {
        const box = addMesh(g, G.box(), cols[(i * 2 + j + rng.int(0, 3)) % 4], (i - 0.5) * s * 0.78, s * 0.16 + (j + 0.5) * s * 0.5, 0, 0, 0, 0, s * 0.74, s * 0.46, s * 2.0);
        addMesh(g, G.box(), m.hazard, (i - 0.5) * s * 0.78, s * 0.16 + (j + 0.5) * s * 0.5, -s * 1.01, 0, 0, 0, s * 0.5, s * 0.04, s * 0.02);
        box.castShadow = true;
      }
      for (const sgn of [-1, 1]) addMesh(g, G.box(), m.metal, sgn * s * 0.8, s * 0.7, 0, 0, 0, 0, s * 0.05, s * 1.1, s * 2.1);
      addMesh(g, G.box(), m.metal, 0, s * 1.22, 0, 0, 0, 0, s * 1.65, s * 0.05, s * 2.1);
      S.lamp(g, { color: "#7dffbe", x: s * 0.7, y: s * 1.26, z: s * 0.95, r: s * 0.05, mode: "steady", base: 3 });
      S.lamp(g, { color: "#ffb03a", x: -s * 0.7, y: s * 1.26, z: -s * 0.95, r: s * 0.05, mode: "blink", period: 2.2, duty: 0.2, base: 5 });
    } },

  /* pressurized transfer tunnel stub with bellows */
  tunnel: { faces: ALL_FACES.concat(["bow", "stern"]), fp: (s) => ({ w: s * 1.5, h: s * 1.7, d: s * 1.5 }),
    build(g, s, p, S, rng) {
      const m = S.mats;
      addMesh(g, G.box(), m.dark, 0, s * 0.08, 0, 0, 0, 0, s * 1.4, s * 0.16, s * 1.4);
      addMesh(g, G.cyl(16), m.hull, 0, s * 0.7, 0, 0, 0, 0, s * 0.55, s * 1.1, s * 0.55);
      for (let i = 0; i < 4; i++) addMesh(g, G.torus(0.08), m.rubber, 0, s * 0.35 + i * s * 0.25, 0, Math.PI / 2, 0, 0, s * 0.58, s * 0.58, s * 0.3);
      addMesh(g, G.torus(0.12), m.metal, 0, s * 1.3, 0, Math.PI / 2, 0, 0, s * 0.6, s * 0.6, s * 0.35);
      const iris = addMesh(g, G.cyl(16), m.glassDark, 0, s * 1.32, 0, 0, 0, 0, s * 0.42, s * 0.05, s * 0.42); iris.castShadow = false;
      for (let i = 0; i < 3; i++) { const a = (i / 3) * Math.PI * 2;
        S.lamp(g, { color: "#ffb03a", x: Math.cos(a) * s * 0.66, y: s * 1.2, z: Math.sin(a) * s * 0.66, r: s * 0.06, mode: "blink", period: 1.1, duty: 0.33, phase: i / 3, base: 6 }); }
      S.lamp(g, { color: "#5fd0ff", y: s * 1.36, z: -s * 0.3, r: s * 0.07, mode: "pulse", period: 2.6, base: 5 });
      g.userData.dock = { kind: "crew", arms: [], blinkers: [], status: null, iris };
    } },

  /* hull crawler robot — body on a short rail, patrols back and forth */
  crawler: { faces: ALL_FACES, fp: (s) => ({ w: s * 0.9, h: s * 0.6, d: s * 2.6 }),
    build(g, s, p, S, rng) {
      const m = S.mats;
      addMesh(g, G.box(), m.metal, 0, s * 0.06, 0, 0, 0, 0, s * 0.25, s * 0.12, s * 2.5);
      const bot = new THREE.Group(); bot.position.set(0, s * 0.3, 0);
      bot.userData.patrol = { axis: "z", amp: s * 0.95, speed: rng.range(0.3, 0.6), phase: rng.next() * 6.28 };
      addMesh(bot, G.box(), m.panel, 0, 0, 0, 0, 0, 0, s * 0.7, s * 0.3, s * 0.8);
      for (const sx of [-1, 1]) for (const sz of [-1, 1]) addMesh(bot, G.cyl(8), m.rubber, sx * s * 0.36, -s * 0.1, sz * s * 0.3, 0, 0, Math.PI / 2, s * 0.1, s * 0.08, s * 0.1);
      addMesh(bot, G.box(), m.metal, 0, s * 0.25, -s * 0.2, 0.5, 0, 0, s * 0.08, s * 0.08, s * 0.5);
      S.lamp(bot, { color: "#ffb03a", y: s * 0.22, r: s * 0.06, mode: "blink", period: 0.8, duty: 0.5, base: 6 });
      S.lamp(bot, { color: "#5fd0ff", y: s * 0.05, z: -s * 0.42, r: s * 0.05, mode: "steady", base: 4 });
      g.add(bot);
    } }
};
