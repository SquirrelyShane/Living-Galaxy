/* Prefabs — Antennas, optics and scanning heads.
 * Each prefab: faces (default mount faces), fp(s, part, face) → footprint {w,h,d} in ship units
 * (w along the face u-axis, d along v, h outward), build(g, s, part, S, rng) where g is a group
 * whose +Y points away from the hull and S is the StarshipBuilder (mats, lamp, dockBody…). */
import * as THREE from "three";
import { G, addMesh } from "../core/geometry.js";
import { ALL_FACES } from "./_common.js";

export default {
  dish: { faces: ALL_FACES, fp: (s, p) => p.flush ? { w: s * 1.7, h: s * 0.28, d: s * 1.7 } : { w: s * 1.7, h: s * 1.9, d: s * 1.7 },
    build(g, s, p, S, rng) {
      const m = S.mats; const mastH = s * 0.7;
      if (p.flush) {
        // conformal phased-array plate in place of the parabolic dish
        addMesh(g, G.box(), m.dark, 0, s * 0.08, 0, 0, 0, 0, s * 1.6, s * 0.16, s * 1.6);
        const face = addMesh(g, G.box(), m.glassDark, 0, s * 0.19, 0, 0, 0, 0, s * 1.5, s * 0.05, s * 1.5); face.castShadow = false;
        for (let i = -2; i <= 2; i++) { addMesh(g, G.box(), m.metal, i * s * 0.3, s * 0.22, 0, 0, 0, 0, s * 0.012, s * 0.01, s * 1.5); addMesh(g, G.box(), m.metal, 0, s * 0.22, i * s * 0.3, 0, 0, 0, s * 1.5, s * 0.01, s * 0.012); }
        g.userData.sensor = { kind: "dish" };
        S.lamp(g, { color: "#7de9ff", x: s * 0.7, y: s * 0.25, z: s * 0.7, r: s * 0.05, mode: "pulse", period: 2.8, base: 4 });
        return;
      }
      addMesh(g, G.box(), m.dark, 0, s * 0.06, 0, 0, 0, 0, s * 0.6, s * 0.12, s * 0.6);
      addMesh(g, G.cyl(8), m.metal, 0, mastH / 2, 0, 0, 0, 0, s * 0.08, mastH, s * 0.08);
      const yaw = new THREE.Group(); yaw.position.set(0, mastH, 0);
      yaw.userData.spin = { axis: "y", speed: rng.range(0.18, 0.42) * rng.sign() };
      yaw.userData.sensor = { kind: "dish" };
      const tilt = new THREE.Group(); tilt.rotation.x = -rng.range(0.35, 0.75); yaw.add(tilt);
      addMesh(tilt, G.dome(), m.light, 0, 0, 0, 0, 0, 0, s * 0.8, s * 0.5, s * 0.8);
      addMesh(tilt, G.dome(), m.panel, 0, -s * 0.015, 0, Math.PI, 0, 0, s * 0.78, s * 0.42, s * 0.78);
      for (let k = 0; k < 3; k++) { const a = (k / 3) * Math.PI * 2;
        addMesh(tilt, G.cyl(4), m.metal, Math.cos(a) * s * 0.38, s * 0.3, Math.sin(a) * s * 0.38, 0, 0, 0, s * 0.03, s * 0.7, s * 0.03); }
      addMesh(tilt, G.cyl(8), m.metal, 0, s * 0.62, 0, 0, 0, 0, s * 0.09, s * 0.2, s * 0.09);
      S.lamp(tilt, { color: "#7de9ff", y: s * 0.76, r: s * 0.08, mode: "pulse", period: 2.8, phase: rng.next(), base: 5 });
      g.add(yaw);
    } },

  radome: { faces: ["top", "bottom"], fp: (s, p) => p.flush ? { w: s * 1.6, h: s * 0.55, d: s * 2.0 } : { w: s * 1.4, h: s * 1.55, d: s * 1.4 },
    build(g, s, p, S, rng) {
      const m = S.mats;
      if (p.flush) {
        // low teardrop blister
        addMesh(g, G.sphere(), m.light, 0, s * 0.05, 0, 0, 0, 0, s * 0.7, s * 0.42, s * 0.95);
        addMesh(g, G.torus(0.05), m.accent, 0, s * 0.08, 0, Math.PI / 2, 0, 0, s * 0.72, s * 0.96, s * 0.3);
        g.userData.sensor = { kind: "radome" };
        S.lamp(g, { color: "#ff4a5a", y: s * 0.5, r: s * 0.06, mode: "strobe", period: 1.7, base: 8 });
        return;
      }
      addMesh(g, G.box(), m.panel, 0, s * 0.35, 0, 0, 0, 0, s * 0.7, s * 0.7, s * 0.5);
      addMesh(g, G.sphere(), m.light, 0, s * 0.95, 0, 0, 0, 0, s * 0.55, s * 0.55, s * 0.55);
      addMesh(g, G.torus(0.08), m.accent, 0, s * 0.95, 0, Math.PI / 2, 0, 0, s * 0.57, s * 0.57, s * 0.2);
      g.userData.sensor = { kind: "radome" };
      S.lamp(g, { color: "#ff4a5a", y: s * 1.55, r: s * 0.1, mode: "strobe", period: 1.7, base: 9 });
    } },

  mast: { faces: ALL_FACES, fp: (s, p) => p.flush ? { w: s * 0.25, h: s * 0.7, d: s * 1.2 } : { w: s * 0.5, h: s * 2.7, d: s * 0.5 },
    build(g, s, p, S, rng) {
      const m = S.mats; const hh = s * 2.4;
      if (p.flush) {
        // swept blade antenna, edge-on to the flow
        addMesh(g, G.box(), m.dark, 0, s * 0.05, 0, 0, 0, 0, s * 0.2, s * 0.1, s * 1.1);
        addMesh(g, G.box(), m.light, 0, s * 0.36, s * 0.1, 0.5, 0, 0, s * 0.06, s * 0.6, s * 0.8);
        S.lamp(g, { color: "#ffffff", y: s * 0.62, z: s * 0.35, r: s * 0.04, mode: "blink", period: 2.2, duty: 0.12, phase: rng.next(), base: 6 });
        return;
      }
      addMesh(g, G.cyl(6), m.dark, 0, s * 0.08, 0, 0, 0, 0, s * 0.16, s * 0.16, s * 0.16);
      addMesh(g, G.cyl(5), m.metal, 0, hh / 2, 0, 0, 0, 0, s * 0.035, hh, s * 0.035);
      addMesh(g, G.box(), m.accent, 0, hh * 0.8, 0, 0, 0, 0, s * 0.4, s * 0.03, s * 0.03);
      if (p.id === "nav.ism") { addMesh(g, G.torus(0.08), m.metal, 0, hh, 0, 0, 0, 0, s * 0.18, s * 0.18, s * 0.18);
        addMesh(g, G.torus(0.08), m.metal, 0, hh, 0, Math.PI / 2, 0, 0, s * 0.18, s * 0.18, s * 0.18); }
      S.lamp(g, { color: "#ffffff", y: hh + s * 0.05, r: s * 0.06, mode: "blink", period: 2.2, duty: 0.12, phase: rng.next(), base: 7 });
    } },

  optic: { faces: ALL_FACES, fp: (s, p) => p.flush ? { w: s * 1.0, h: s * 0.3, d: s * 1.0 } : { w: s * 1.2, h: s * 1.6, d: s * 1.6 },
    build(g, s, p, S, rng) {
      const m = S.mats;
      if (p.flush) {
        // recessed aperture window with a shutter frame
        addMesh(g, G.box(), m.dark, 0, s * 0.08, 0, 0, 0, 0, s * 0.95, s * 0.16, s * 0.95);
        const w = addMesh(g, G.cyl(14), m.glassDark, 0, s * 0.18, 0, 0, 0, 0, s * 0.34, s * 0.04, s * 0.34); w.castShadow = false;
        addMesh(g, G.torus(0.1), m.metal, 0, s * 0.19, 0, Math.PI / 2, 0, 0, s * 0.36, s * 0.36, s * 0.2);
        g.userData.sensor = { kind: "optic" };
        S.lamp(g, { color: p.lamp || "#bfe4ff", y: s * 0.22, r: s * 0.06, mode: "pulse", period: 1.6, base: 3 });
        return;
      }
      addMesh(g, G.cyl(10), m.dark, 0, s * 0.1, 0, 0, 0, 0, s * 0.45, s * 0.2, s * 0.45);
      const yaw = new THREE.Group(); yaw.position.set(0, s * 0.55, 0);
      yaw.userData.scan = { base: rng.range(-0.5, 0.5), yawAmp: rng.range(0.3, 0.9), yawSpeed: rng.range(0.1, 0.25),
                            pitchAmp: rng.range(0.05, 0.15), pitchSpeed: rng.range(0.1, 0.3), phase: rng.next() * 6.283 };
      yaw.userData.sensor = { kind: "optic" };
      for (const sgn of [-1, 1]) addMesh(yaw, G.box(), m.metal, sgn * s * 0.32, -s * 0.05, 0, 0, 0, 0, s * 0.08, s * 0.7, s * 0.3);
      addMesh(yaw, G.cyl(12), m.panel, 0, 0.1 * s, -s * 0.1, Math.PI / 2 - 0.35, 0, 0, s * 0.22, s * 1.2, s * 0.22);
      addMesh(yaw, G.cyl(12), p.cold ? m.light : m.dark, 0, 0.1 * s + s * 0.2, -s * 0.66, Math.PI / 2 - 0.35, 0, 0, s * 0.26, s * 0.16, s * 0.26);
      S.lamp(yaw, { color: p.lamp || "#bfe4ff", y: s * 0.32, z: -s * 0.72, r: s * 0.12, mode: p.lamp ? "blink" : "pulse", period: 1.6, duty: 0.3, base: 4 });
      g.add(yaw);
    } },

  sensorPod: { faces: ALL_FACES, fp: (s, p) => p.flush ? { w: s * 1.1, h: s * 0.3, d: s * 1.1 } : { w: s * 1.1, h: s * 1.25, d: s * 1.1 },
    build(g, s, p, S, rng) {
      const m = S.mats;
      if (p.flush) {
        // flat aperture window; the scan stays in software
        addMesh(g, G.box(), m.dark, 0, s * 0.08, 0, 0, 0, 0, s * 1.0, s * 0.16, s * 1.0);
        const w = addMesh(g, G.box(), m.glassDark, 0, s * 0.19, 0, 0, 0, 0, s * 0.86, s * 0.05, s * 0.86); w.castShadow = false;
        const rot = new THREE.Group(); rot.position.set(0, s * 0.2, 0); rot.userData.spin = { axis: "y", speed: 1.4 }; rot.userData.sensor = { kind: "pod" };
        addMesh(rot, G.box(), m.accent, 0, s * 0.03, 0, 0, 0, 0, s * 0.7, s * 0.01, s * 0.05); g.add(rot);
        S.lamp(g, { color: p.lamp || "#5fd0ff", x: s * 0.4, y: s * 0.22, z: s * 0.4, r: s * 0.05, mode: "blink", period: 1.2, duty: 0.1, base: 6 });
        return;
      }
      addMesh(g, G.cyl(12), m.dark, 0, s * 0.1, 0, 0, 0, 0, s * 0.5, s * 0.2, s * 0.5);
      addMesh(g, G.cyl(8), m.metal, 0, s * 0.35, 0, 0, 0, 0, s * 0.12, s * 0.3, s * 0.12);
      const rot = new THREE.Group(); rot.position.set(0, s * 0.75, 0); rot.userData.spin = { axis: "y", speed: rng.range(1.2, 2.6) };
      rot.userData.sensor = { kind: "pod" };
      addMesh(rot, G.cyl(14), m.panel, 0, 0, 0, 0, 0, 0, s * 0.42, s * 0.5, s * 0.42);
      for (let i = 0; i < 6; i++) { const a = (i / 6) * Math.PI * 2;
        const slot = addMesh(rot, G.box(), m.glassDark, Math.cos(a) * s * 0.42, 0, Math.sin(a) * s * 0.42, 0, -a, 0, s * 0.03, s * 0.28, s * 0.22); slot.castShadow = false; }
      S.lamp(rot, { color: p.lamp || "#5fd0ff", x: s * 0.44, r: s * 0.06, mode: "steady", base: 4 });
      g.add(rot);
      S.lamp(g, { color: "#ffffff", y: s * 1.08, r: s * 0.06, mode: "blink", period: 1.2, duty: 0.1, base: 7 });
    } },

  scanner: { faces: ALL_FACES, fp: (s, p) => p.flush ? { w: s * 1.5, h: s * 0.6, d: s * 1.9 } : { w: s * 1.7, h: s * 1.6, d: s * 1.7 },
    build(g, s, p, S, rng) {
      const m = S.mats; const u = s * 0.9;
      if (p.flush) {
        // low fairing with a slit window; the head still sweeps inside
        addMesh(g, G.box(), m.dark, 0, s * 0.08, 0, 0, 0, 0, s * 1.4, s * 0.16, s * 1.8);
        addMesh(g, G.sphere(), m.hull, 0, s * 0.1, 0, 0, 0, 0, s * 0.7, s * 0.45, s * 0.9);
        const win = addMesh(g, G.box(), m.glassDark, 0, s * 0.3, -s * 0.35, -0.5, 0, 0, s * 1.0, s * 0.18, s * 0.06); win.castShadow = false;
        const yaw = new THREE.Group(); yaw.position.set(0, s * 0.25, 0);
        yaw.userData.scan = { base: 0, yawAmp: 0.6, yawSpeed: 0.5, pitchAmp: 0.05, pitchSpeed: 0.3, phase: rng.next() * 6.283 };
        yaw.userData.sensor = { kind: "scanner" };
        addMesh(yaw, G.box(), m.accent, 0, 0, -s * 0.2, 0, 0, 0, s * 0.3, s * 0.08, s * 0.4); g.add(yaw);
        S.lamp(g, { color: "#5fd0ff", y: s * 0.32, z: -s * 0.4, r: s * 0.06, mode: "pulse", period: 1.4, base: 5 });
        return;
      }
      addMesh(g, G.cyl(12), m.dark, 0, u * 0.22, 0, 0, 0, 0, u * 0.95, u * 0.44, u * 0.95);
      const yaw = new THREE.Group(); yaw.position.set(0, u * 0.5, 0);
      yaw.userData.scan = { base: 0, yawAmp: rng.chance(0.4) ? 6.283 : rng.range(1.6, 3.0), yawSpeed: rng.range(0.35, 0.8),
                            pitchAmp: rng.range(0.10, 0.28), pitchSpeed: rng.range(0.3, 0.7), phase: rng.next() * 6.283, spin: rng.chance(0.4) };
      yaw.userData.sensor = { kind: "scanner" };
      addMesh(yaw, G.box(), m.hull, 0, 0, 0, 0, 0, 0, u * 0.9, u * 0.6, u * 0.7);
      addMesh(yaw, G.box(), m.dark, 0, u * 0.35, -u * 0.18, -0.25, 0, 0, u * 1.5, u * 0.7, u * 0.10);
      const f = addMesh(yaw, G.box(), m.glassDark, 0, u * 0.36, -u * 0.24, -0.25, 0, 0, u * 1.35, u * 0.58, u * 0.06); f.castShadow = false;
      S.lamp(yaw, { color: "#5fd0ff", y: u * 0.36, z: -u * 0.30, r: u * 0.12, mode: "pulse", period: 1.4, phase: rng.next(), base: 5 });
      S.lamp(yaw, { color: "#ffffff", y: u * 0.72, r: u * 0.09, mode: "blink", period: 2.0, duty: 0.1, phase: rng.next(), base: 8 });
      g.add(yaw);
    } },

  /* weapons wrap the existing family builders */
};
