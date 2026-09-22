/* StarshipBuilder mixin — Weapon family geometry (turret / launcher tags drive the Ops fire control).
 * Methods are installed onto StarshipBuilder.prototype by src/builder/StarshipBuilder.js. */
import * as THREE from "three";
import { RNG } from "../core/rng.js";
import { G, makeMat, addMesh, wingShape } from "../core/geometry.js";
import { faceNormal, faceEuler, faceRotation } from "./faces.js";
import { DRIVE_TYPES } from "../data/drives.js";
import { WEAPON_TYPES } from "../data/weapons.js";
import { PARTS } from "../data/catalog/index.js";
import { PREFABS, ALL_FACES, fpArea } from "../prefabs/index.js";

export default {
  wpn_railgun(g, u, rng) {
    const m = this.mats;
    addMesh(g, G.box(), m.dark, 0, u * 0.16, 0, 0, 0, 0, u * 1.7, u * 0.32, u * 2.0);
    addMesh(g, G.cyl(12), m.metal, 0, u * 0.45, 0, 0, 0, 0, u * 0.62, u * 0.5, u * 0.62);
    const yoke = new THREE.Group();
    yoke.position.set(0, u * 0.72, 0);
    yoke.rotation.y = rng.range(-0.25, 0.25);
    yoke.userData.scan = { base: yoke.rotation.y, yawAmp: rng.range(0.3, 0.9), yawSpeed: rng.range(0.12, 0.3),
                           pitchAmp: rng.range(0.03, 0.1), pitchSpeed: rng.range(0.15, 0.3), phase: rng.next() * 6.283 };
    yoke.userData.turret = { kind: "rail", muzzle: [0, u * 0.06, -u * 3.3], rate: 1.4 };
    addMesh(yoke, G.box(), m.hull, 0, 0, u * 0.35, 0, 0, 0, u * 0.95, u * 0.62, u * 1.2);
    for (const s of [-1, 1]) {
      addMesh(yoke, G.box(), m.metal, s * u * 0.30, u * 0.06, -u * 1.5, 0, 0, 0, u * 0.13, u * 0.13, u * 3.4);
    }
    for (let i = 0; i < 4; i++) {
      addMesh(yoke, G.box(), m.accent, 0, u * 0.06, -u * 0.6 - i * u * 0.65, 0, 0, 0, u * 0.72, u * 0.09, u * 0.12);
    }
    addMesh(yoke, G.box(), m.dark, 0, u * 0.06, -u * 3.15, 0, 0, 0, u * 0.8, u * 0.34, u * 0.3);
    g.add(yoke);
  },

  wpn_beam(g, u, rng) {
    const m = this.mats;
    addMesh(g, G.cyl(14), m.dark, 0, u * 0.18, 0, 0, 0, 0, u * 0.95, u * 0.36, u * 0.95);
    const turret = new THREE.Group();
    turret.position.set(0, u * 0.5, 0);
    turret.rotation.y = rng.range(-0.4, 0.4);
    turret.userData.turret = { kind: "beam", muzzle: [0, u * 0.18, -u * 2.1], rate: 0.55 };
    turret.userData.scan = { base: turret.rotation.y, yawAmp: rng.range(0.5, 1.7), yawSpeed: rng.range(0.20, 0.5),
                             pitchAmp: rng.range(0.05, 0.18), pitchSpeed: rng.range(0.25, 0.5), phase: rng.next() * 6.283 };
    addMesh(turret, G.dome(), m.hull, 0, 0, 0, 0, 0, 0, u * 0.8, u * 0.8, u * 0.8);
    addMesh(turret, G.box(), m.metal, 0, u * 0.18, -u * 0.9, 0, 0, 0, u * 0.34, u * 0.34, u * 1.5);
    addMesh(turret, G.cyl(12), m.metal, 0, u * 0.18, -u * 1.6, Math.PI / 2, 0, 0, u * 0.14, u * 0.9, u * 0.14);
    const lens = addMesh(turret, G.sphere(), m.hot, 0, u * 0.18, -u * 2.05, 0, 0, 0, u * 0.17, u * 0.17, u * 0.17);
    lens.castShadow = false;
    addMesh(turret, G.torus(0.2), m.accent, 0, u * 0.18, -u * 1.2, 0, 0, 0, u * 0.26, u * 0.26, u * 0.2);
    g.add(turret);
  },

  wpn_missile(g, u, rng) {
    const m = this.mats;
    addMesh(g, G.box(), m.dark, 0, u * 0.5, 0, 0, 0, 0, u * 2.0, u * 1.0, u * 2.4);
    addMesh(g, G.box(), m.metal, 0, u * 1.02, 0, 0, 0, 0, u * 2.06, u * 0.08, u * 2.46);
    const cols = 3, rows = 3;
    for (let i = 0; i < cols; i++) {
      for (let j = 0; j < rows; j++) {
        const cx = (i - 1) * u * 0.6;
        const cz = (j - 1) * u * 0.72;
        addMesh(g, G.cyl(8), m.metal, cx, u * 1.04, cz, 0, 0, 0, u * 0.22, u * 0.06, u * 0.22);
        if (rng.chance(0.4)) {
          const cell = addMesh(g, G.cyl(8), m.accent, cx, u * 1.08, cz, 0, 0, 0, u * 0.15, u * 0.05, u * 0.15);
          cell.castShadow = false;
        }
      }
    }
    addMesh(g, G.box(), m.accent, 0, u * 0.5, u * 1.22, 0, 0, 0, u * 1.6, u * 0.1, u * 0.05);
    const cells = [];
    for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) cells.push([(i - 1) * u * 0.6, u * 1.1, (j - 1) * u * 0.72]);
    g.userData.launcher = { kind: "missile", cells, rate: 0.5, up: [0, 1, 0] };
  },

  wpn_plasma(g, u, rng) {
    const m = this.mats;
    addMesh(g, G.box(), m.dark, 0, u * 0.2, 0, 0, 0, 0, u * 1.5, u * 0.4, u * 1.6);
    const barrel = new THREE.Group();
    barrel.position.set(0, u * 0.7, 0);
    barrel.rotation.y = rng.range(-0.2, 0.2);
    barrel.userData.turret = { kind: "plasma", muzzle: [0, 0, -u * 2.1], rate: 0.8 };
    barrel.userData.scan = { base: barrel.rotation.y, yawAmp: rng.range(0.35, 1.1), yawSpeed: rng.range(0.15, 0.4),
                             pitchAmp: rng.range(0.04, 0.12), pitchSpeed: rng.range(0.2, 0.4), phase: rng.next() * 6.283 };
    addMesh(barrel, G.box(), m.hull, 0, 0, u * 0.3, 0, 0, 0, u * 1.1, u * 0.85, u * 1.1);
    addMesh(barrel, G.cyl(14), m.metal, 0, 0, -u * 0.9, Math.PI / 2, 0, 0, u * 0.34, u * 1.6, u * 0.34);
    for (let i = 0; i < 3; i++) {
      const ring = addMesh(barrel, G.torus(0.22), m.accent, 0, 0, -u * 0.5 - i * u * 0.5, 0, 0, 0, u * 0.46, u * 0.46, u * 0.24);
      ring.userData.pulse = { amp: 0.3, speed: 3.4, phase: i * 0.8 };
    }
    addMesh(barrel, G.taper(1.6, 14), m.metal, 0, 0, -u * 1.85, Math.PI / 2, 0, 0, u * 0.3, u * 0.5, u * 0.3);
    const muzzle = addMesh(barrel, G.sphere(), m.hot, 0, 0, -u * 2.05, 0, 0, 0, u * 0.24, u * 0.24, u * 0.24);
    muzzle.castShadow = false;
    g.add(barrel);
  },

  wpn_pdc(g, u, rng) {
    const m = this.mats;
    addMesh(g, G.cyl(10), m.dark, 0, u * 0.2, 0, 0, 0, 0, u * 0.7, u * 0.4, u * 0.7);
    const head = new THREE.Group();
    head.position.set(0, u * 0.55, 0);
    head.rotation.y = rng.range(-0.6, 0.6);
    head.userData.turret = { kind: "pdc", muzzle: [0, u * 0.05, -u * 1.25], rate: 0.09 };
    head.userData.scan = { base: head.rotation.y, yawAmp: rng.range(1.2, 3.0), yawSpeed: rng.range(0.5, 1.1),
                           pitchAmp: rng.range(0.08, 0.25), pitchSpeed: rng.range(0.6, 1.2), phase: rng.next() * 6.283 };
    addMesh(head, G.box(), m.hull, 0, 0, 0, 0, 0, 0, u * 0.9, u * 0.6, u * 0.9);
    const hub = new THREE.Group();
    hub.position.set(0, u * 0.05, -u * 0.7);
    hub.userData.spin = { axis: "z", speed: 6 };
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2;
      addMesh(hub, G.cyl(6), m.metal, Math.cos(a) * u * 0.18, Math.sin(a) * u * 0.18, 0, Math.PI / 2, 0, 0, u * 0.06, u * 1.0, u * 0.06);
    }
    addMesh(hub, G.cyl(10), m.dark, 0, 0, 0, Math.PI / 2, 0, 0, u * 0.14, u * 0.3, u * 0.14);
    head.add(hub);
    addMesh(head, G.box(), m.accent, 0, u * 0.32, u * 0.2, 0, 0, 0, u * 0.5, u * 0.06, u * 0.3);
    g.add(head);
  },

  wpn_torpedo(g, u, rng) {
    const m = this.mats;
    addMesh(g, G.box(), m.dark, 0, u * 0.35, 0, 0, 0, 0, u * 1.1, u * 0.8, u * 2.6);
    for (const s of [-1, 1]) {
      addMesh(g, G.cyl(12), m.metal, s * u * 0.28, u * 0.35, -u * 0.4, Math.PI / 2, 0, 0, u * 0.24, u * 2.2, u * 0.24);
      const mouth = addMesh(g, G.torus(0.3), m.accent, s * u * 0.28, u * 0.35, -u * 1.5, 0, 0, 0, u * 0.27, u * 0.27, u * 0.2);
      mouth.userData.pulse = { amp: 0.4, speed: 2.2, phase: s };
    }
    addMesh(g, G.box(), m.hull, 0, u * 0.78, u * 0.3, 0, 0, 0, u * 0.9, u * 0.3, u * 1.4);
    g.userData.launcher = { kind: "torpedo", cells: [[-u * 0.28, u * 0.35, -u * 1.6], [u * 0.28, u * 0.35, -u * 1.6]], rate: 1.6, up: [0, 0, -1] };
  },

  /* ---- COILGUN: rail-style yoke with a stack of drive coils, blue slug ------------------- */
  wpn_coil(g, u, rng) {
    const m = this.mats;
    addMesh(g, G.box(), m.dark, 0, u * 0.16, 0, 0, 0, 0, u * 1.6, u * 0.32, u * 1.9);
    addMesh(g, G.cyl(12), m.metal, 0, u * 0.45, 0, 0, 0, 0, u * 0.6, u * 0.5, u * 0.6);
    const yoke = new THREE.Group(); yoke.position.set(0, u * 0.72, 0); yoke.rotation.y = rng.range(-0.25, 0.25);
    yoke.userData.scan = { base: yoke.rotation.y, yawAmp: rng.range(0.3, 0.9), yawSpeed: rng.range(0.12, 0.3), pitchAmp: rng.range(0.03, 0.1), pitchSpeed: rng.range(0.15, 0.3), phase: rng.next() * 6.283 };
    yoke.userData.turret = { kind: "coil", muzzle: [0, u * 0.06, -u * 3.1], rate: 0.9 };
    addMesh(yoke, G.box(), m.hull, 0, 0, u * 0.35, 0, 0, 0, u * 0.9, u * 0.6, u * 1.1);
    addMesh(yoke, G.cyl(10), m.metal, 0, u * 0.06, -u * 1.4, Math.PI / 2, 0, 0, u * 0.16, u * 3.0, u * 0.16);
    for (let i = 0; i < 7; i++) {
      const ring = addMesh(yoke, G.torus(0.22), i % 2 ? m.metal : m.accent, 0, u * 0.06, -u * 0.3 - i * u * 0.42, 0, 0, 0, u * 0.36, u * 0.36, u * 0.3);
      if (i % 2 === 0) ring.userData.pulse = { amp: 0.25, speed: 4, phase: i * 0.5 };
    }
    addMesh(yoke, G.box(), m.dark, 0, u * 0.06, -u * 3.0, 0, 0, 0, u * 0.5, u * 0.5, u * 0.2);
    g.add(yoke);
  },

  /* ---- AUTOCANNON: twin barrels, box magazine, ejection port -------------------------- */
  wpn_auto(g, u, rng) {
    const m = this.mats;
    addMesh(g, G.cyl(12), m.dark, 0, u * 0.2, 0, 0, 0, 0, u * 0.9, u * 0.4, u * 0.9);
    const head = new THREE.Group(); head.position.set(0, u * 0.55, 0); head.rotation.y = rng.range(-0.5, 0.5);
    head.userData.scan = { base: head.rotation.y, yawAmp: rng.range(0.8, 2.0), yawSpeed: rng.range(0.4, 0.9), pitchAmp: rng.range(0.06, 0.2), pitchSpeed: rng.range(0.4, 0.9), phase: rng.next() * 6.283 };
    head.userData.turret = { kind: "auto", muzzle: [0, u * 0.05, -u * 1.9], rate: 0.5 };
    addMesh(head, G.box(), m.hull, 0, 0, 0, 0, 0, 0, u * 1.1, u * 0.7, u * 1.2);
    addMesh(head, G.box(), m.dark, u * 0.65, u * 0.1, u * 0.2, 0, 0, 0, u * 0.3, u * 0.5, u * 0.8);   // magazine
    for (const sgn of [-1, 1]) {
      addMesh(head, G.cyl(8), m.metal, sgn * u * 0.18, u * 0.05, -u * 1.0, Math.PI / 2, 0, 0, u * 0.09, u * 1.7, u * 0.09);
      addMesh(head, G.cyl(8), m.dark, sgn * u * 0.18, u * 0.05, -u * 1.85, Math.PI / 2, 0, 0, u * 0.13, u * 0.2, u * 0.13);
    }
    addMesh(head, G.box(), m.accent, 0, u * 0.38, u * 0.1, 0, 0, 0, u * 0.5, u * 0.05, u * 0.4);
    g.add(head);
  },

  /* ---- FLAK: short twin barrels + ranging dish, proximity-fused shells ------------------ */
  wpn_flak(g, u, rng) {
    const m = this.mats;
    addMesh(g, G.cyl(12), m.dark, 0, u * 0.2, 0, 0, 0, 0, u * 1.0, u * 0.4, u * 1.0);
    const head = new THREE.Group(); head.position.set(0, u * 0.6, 0); head.rotation.y = rng.range(-0.5, 0.5);
    head.userData.scan = { base: head.rotation.y, yawAmp: rng.range(0.6, 1.6), yawSpeed: rng.range(0.3, 0.6), pitchAmp: rng.range(0.1, 0.3), pitchSpeed: rng.range(0.3, 0.6), phase: rng.next() * 6.283 };
    head.userData.turret = { kind: "flak", muzzle: [0, u * 0.1, -u * 1.5], rate: 0.7 };
    addMesh(head, G.box(), m.hull, 0, 0, 0, 0, 0, 0, u * 1.3, u * 0.8, u * 1.1);
    for (const sgn of [-1, 1]) addMesh(head, G.cyl(10), m.metal, sgn * u * 0.3, u * 0.1, -u * 0.9, Math.PI / 2, 0, 0, u * 0.16, u * 1.3, u * 0.16);
    const dish = addMesh(head, G.dome(), m.light, 0, u * 0.6, u * 0.2, -0.6, 0, 0, u * 0.3, u * 0.2, u * 0.3);
    dish.userData.spin = { axis: "y", speed: 3 };
    g.add(head);
  },

  /* ---- PLASMA LANCE: long confinement barrel, continuous beam -------------------------- */
  wpn_lance(g, u, rng) {
    const m = this.mats;
    addMesh(g, G.box(), m.dark, 0, u * 0.2, 0, 0, 0, 0, u * 1.6, u * 0.4, u * 1.8);
    const barrel = new THREE.Group(); barrel.position.set(0, u * 0.75, 0); barrel.rotation.y = rng.range(-0.2, 0.2);
    barrel.userData.scan = { base: barrel.rotation.y, yawAmp: rng.range(0.3, 0.8), yawSpeed: rng.range(0.1, 0.3), pitchAmp: rng.range(0.04, 0.1), pitchSpeed: rng.range(0.15, 0.3), phase: rng.next() * 6.283 };
    barrel.userData.turret = { kind: "lance", muzzle: [0, 0, -u * 3.3], rate: 99 };
    addMesh(barrel, G.box(), m.hull, 0, 0, u * 0.4, 0, 0, 0, u * 1.2, u * 0.9, u * 1.3);
    addMesh(barrel, G.cyl(14), m.metal, 0, 0, -u * 1.4, Math.PI / 2, 0, 0, u * 0.3, u * 3.4, u * 0.3);
    for (let i = 0; i < 6; i++) { const ring = addMesh(barrel, G.torus(0.2), m.accent, 0, 0, -u * 0.4 - i * u * 0.5, 0, 0, 0, u * 0.4, u * 0.4, u * 0.24); ring.userData.pulse = { amp: 0.3, speed: 5, phase: i * 0.7 }; }
    const tip = addMesh(barrel, G.sphere(), m.hot, 0, 0, -u * 3.25, 0, 0, 0, u * 0.2, u * 0.2, u * 0.2); tip.castShadow = false;
    g.add(barrel);
  },

  /* ---- PARTICLE BEAM: accelerator ring behind a beam director --------------------------- */
  wpn_particle(g, u, rng) {
    const m = this.mats;
    addMesh(g, G.cyl(14), m.dark, 0, u * 0.18, 0, 0, 0, 0, u * 1.1, u * 0.36, u * 1.1);
    const turret = new THREE.Group(); turret.position.set(0, u * 0.5, 0); turret.rotation.y = rng.range(-0.4, 0.4);
    turret.userData.scan = { base: turret.rotation.y, yawAmp: rng.range(0.5, 1.4), yawSpeed: rng.range(0.15, 0.4), pitchAmp: rng.range(0.05, 0.15), pitchSpeed: rng.range(0.2, 0.4), phase: rng.next() * 6.283 };
    turret.userData.turret = { kind: "particle", muzzle: [0, u * 0.2, -u * 2.3], rate: 0.75 };
    const ring = addMesh(turret, G.torus(0.28), m.metal, 0, u * 0.2, u * 0.5, 0, 0, 0, u * 0.9, u * 0.9, u * 0.5);
    ring.userData.spin = { axis: "z", speed: 1.2 };
    const halo = addMesh(turret, G.torus(0.08), m.hot, 0, u * 0.2, u * 0.5, 0, 0, 0, u * 0.9, u * 0.9, u * 0.4); halo.castShadow = false; halo.userData.pulse = { amp: 0.2, speed: 3 };
    addMesh(turret, G.cyl(12), m.metal, 0, u * 0.2, -u * 1.0, Math.PI / 2, 0, 0, u * 0.28, u * 2.4, u * 0.28);
    addMesh(turret, G.taper(1.5, 12), m.dark, 0, u * 0.2, -u * 2.2, Math.PI / 2, 0, 0, u * 0.3, u * 0.4, u * 0.3);
    g.add(turret);
  },

  /* ---- LASER CIWS: PDC-class mount, tracking radome, rapid short pulses ----------------- */
  wpn_ciws(g, u, rng) {
    const m = this.mats;
    addMesh(g, G.cyl(10), m.dark, 0, u * 0.2, 0, 0, 0, 0, u * 0.8, u * 0.4, u * 0.8);
    const head = new THREE.Group(); head.position.set(0, u * 0.55, 0); head.rotation.y = rng.range(-0.6, 0.6);
    head.userData.scan = { base: head.rotation.y, yawAmp: rng.range(1.2, 3.0), yawSpeed: rng.range(0.6, 1.2), pitchAmp: rng.range(0.1, 0.3), pitchSpeed: rng.range(0.6, 1.2), phase: rng.next() * 6.283 };
    head.userData.turret = { kind: "ciws", muzzle: [0, u * 0.1, -u * 1.3], rate: 0.06 };
    addMesh(head, G.box(), m.hull, 0, 0, 0, 0, 0, 0, u * 0.9, u * 0.6, u * 0.9);
    addMesh(head, G.cyl(10), m.metal, 0, u * 0.1, -u * 0.8, Math.PI / 2, 0, 0, u * 0.2, u * 1.1, u * 0.2);
    const lens = addMesh(head, G.cyl(10), m.hot, 0, u * 0.1, -u * 1.32, Math.PI / 2, 0, 0, u * 0.14, u * 0.06, u * 0.14); lens.castShadow = false;
    addMesh(head, G.sphere(), m.light, 0, u * 0.6, u * 0.15, 0, 0, 0, u * 0.32, u * 0.32, u * 0.32);
    this.lamp(head, { color: "#ff4a5a", y: u * 0.95, z: u * 0.15, r: u * 0.06, mode: "strobe", period: 0.9, base: 8 });
    g.add(head);
  },

  /* ---- CHAFF / DECOY DISPENSER: angled tube bank ---------------------------------------- */
  wpn_chaff(g, u, rng) {
    const m = this.mats;
    addMesh(g, G.box(), m.dark, 0, u * 0.25, 0, 0, 0, 0, u * 1.4, u * 0.5, u * 1.0);
    const cells = [];
    for (let i = 0; i < 4; i++) for (let j = 0; j < 2; j++) {
      const x = (i - 1.5) * u * 0.3, z = (j - 0.5) * u * 0.4;
      addMesh(g, G.cyl(8), m.metal, x, u * 0.55, z, -0.5, 0, 0, u * 0.1, u * 0.6, u * 0.1);
      cells.push([x, u * 0.8, z - u * 0.25]);
    }
    addMesh(g, G.box(), m.hazard, 0, u * 0.51, -u * 0.52, 0, 0, 0, u * 1.4, u * 0.02, u * 0.05);
    g.userData.launcher = { kind: "chaff", cells, rate: 0.9, up: [0, 1, -0.6] };
  },

  /* ---- DRIFT-MINE LAYER: aft-facing rack of blinking mines ------------------------------- */
  wpn_mines(g, u, rng) {
    const m = this.mats;
    addMesh(g, G.box(), m.dark, 0, u * 0.3, 0, 0, 0, 0, u * 2.0, u * 0.6, u * 1.6);
    const cells = [];
    for (let i = 0; i < 3; i++) {
      const x = (i - 1) * u * 0.6;
      const mine = addMesh(g, G.sphere(), m.metal, x, u * 0.75, 0, 0, 0, 0, u * 0.24, u * 0.24, u * 0.24);
      mine.userData.spin = { axis: "y", speed: 0.6 };
      this.lamp(g, { color: "#ff4a5a", x, y: u * 1.0, z: 0, r: u * 0.05, mode: "blink", period: 1.4, duty: 0.15, phase: i / 3, base: 6 });
      cells.push([x, u * 0.75, u * 0.9]);
    }
    for (const sgn of [-1, 1]) addMesh(g, G.box(), m.metal, sgn * u * 0.95, u * 0.6, 0, 0, 0, 0, u * 0.08, u * 0.6, u * 1.5);
    g.userData.launcher = { kind: "mine", cells, rate: 1.4, up: [0, 0, 1] };
  },
};
