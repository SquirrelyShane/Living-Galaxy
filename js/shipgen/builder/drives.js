/* StarshipBuilder mixin — Main drive cluster and one builder per drive family.
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
  /* ================================================================ */
  /* ENGINES — one builder per drive family                            */
  /* ================================================================ */
  addEngines(root) {
    const { L, B, H, rng, cls } = this;
    const n = rng.int(cls.engines[0], cls.engines[1]);
    const group = new THREE.Group();
    group.name = "drives";
    const z = L * 0.42;
    const layouts = {
      1: [[0, 0]],
      2: [[-1, 0], [1, 0]],
      3: [[-1, 0], [1, 0], [0, 0.7]],
      4: [[-1, 0], [1, 0], [-1, 0.75], [1, 0.75]],
      5: [[-1.1, 0], [1.1, 0], [0, 0], [-0.7, 0.8], [0.7, 0.8]],
      6: [[-1.2, 0], [0, 0], [1.2, 0], [-1.2, 0.75], [0, 0.75], [1.2, 0.75]],
      7: [[-1.3, 0], [-0.45, 0], [0.45, 0], [1.3, 0], [-0.8, 0.8], [0, 0.8], [0.8, 0.8]],
      8: [[-1.3, 0], [-0.45, 0], [0.45, 0], [1.3, 0], [-1.3, 0.8], [-0.45, 0.8], [0.45, 0.8], [1.3, 0.8]]
    };
    const layout = layouts[Math.min(8, Math.max(1, n))];
    this.enginePods = [];
    const r = Math.min(B, H) * rng.range(0.12, 0.18);
    const len = L * rng.range(0.10, 0.18);

    // mounting pylon shelf across the stern
    addMesh(group, G.box(), this.mats.dark, 0, -H * 0.02, z - len * 0.6, 0, 0, 0, B * 0.62, H * 0.34, L * 0.06);

    let lights = 0;
    for (const [lx, ly] of layout) {
      const x = lx * B * 0.28;
      const y = -H * 0.05 + ly * H * 0.28;
      const pod = new THREE.Group();
      pod.position.set(x, y, z);
      this.enginePods.push({ x, y, z, r, len, exitZ: z + len * 0.9 });
      this[`drive_${this.drive}`] ? this[`drive_${this.drive}`](pod, r, len) : this.drive_fusion(pod, r, len);
      group.add(pod);
      this.count(3);

      if (lights < 4) {
        const light = new THREE.PointLight(this.opts.engine, this.driveDef.light * 2.2, L * 2.0, 2);
        light.position.set(x, y, z + len * 0.9);
        group.add(light);
        lights++;
      }
    }
    root.add(group);
  },

  /* layered exhaust anchored at the nozzle exit: soft outer sheath, hot core, exit bloom,
   * and (for chemical / pulse drives) a row of shock diamonds. Every layer is throttle-driven. */
  plume(pod, radius, length, opts = {}) {
    const mats = this.mats;
    const z = opts.z ?? 0, type = this.drive;
    const mk = (mat, r, len, op, intensity, layer) => {
      const m = mat.clone(); m.transparent = true; m.opacity = op; m.emissiveIntensity = intensity; m.depthWrite = false;
      m.userData.cloned = true;
      const p = addMesh(pod, G.plume(16), m, 0, 0, z, Math.PI / 2, 0, 0, r, len, r);
      p.castShadow = false;
      p.userData.plume = { type, base: 1, amp: opts.amp ?? 0.2, op, layer };
      return p;
    };
    const outer = mk(mats.glow, radius, length, opts.opacity ?? 0.34, opts.intensity ?? 2.4, "outer");
    mk(mats.hot, radius * 0.45, length * 0.72, Math.min(0.9, (opts.opacity ?? 0.34) + 0.35), (opts.intensity ?? 2.4) + 1.5, "core");
    // exit bloom disc
    const dm = mats.hot.clone(); dm.transparent = true; dm.opacity = 0.55; dm.depthWrite = false; dm.side = THREE.DoubleSide; dm.userData.cloned = true;
    const disc = addMesh(pod, G.disc(), dm, 0, 0, z + radius * 0.02, 0, 0, 0, radius * 0.95, radius * 0.95, 1);
    disc.castShadow = false; disc.userData.plume = { type, base: 1, amp: 0.1, op: 0.55, layer: "disc" };
    // shock diamonds on chemical-family exhausts
    if (["hydrogen", "vector", "pulse", "fusion"].includes(type)) {
      for (let i = 0; i < 3; i++) {
        const sm = mats.hot.clone(); sm.transparent = true; sm.opacity = 0.7; sm.depthWrite = false; sm.userData.cloned = true;
        const d = addMesh(pod, G.sphere(), sm, 0, 0, z + length * (0.18 + i * 0.22), 0, 0, 0, radius * (0.42 - i * 0.08), radius * (0.42 - i * 0.08), radius * (0.9 - i * 0.15));
        d.castShadow = false; d.userData.plume = { type, base: 1, amp: 0.3, op: 0.7, layer: "diamond", frac: 0.18 + i * 0.22, baseZ: z, len: length };
      }
    }
    return outer;
  },

  drive_fusion(pod, r, len) {
    const m = this.mats;
    addMesh(pod, G.cyl(16), m.engine, 0, 0, -len * 0.15, Math.PI / 2, 0, 0, r, len, r);
    addMesh(pod, G.torus(0.12), m.metal, 0, 0, -len * 0.55, 0, 0, 0, r * 1.12, r * 1.12, r * 0.4);
    // flared bell
    const bell = addMesh(pod, G.taper(1.55, 18), m.engine, 0, 0, len * 0.5, Math.PI / 2, 0, 0, r * 1.05, len * 0.7, r * 1.05);
    bell.material = m.engine;
    addMesh(pod, G.taper(1.4, 18), m.glow, 0, 0, len * 0.52, Math.PI / 2, 0, 0, r * 0.86, len * 0.62, r * 0.86);
    addMesh(pod, G.sphere(), m.hot, 0, 0, len * 0.35, 0, 0, 0, r * 0.5, r * 0.5, r * 0.5).castShadow = false;
    this.plume(pod, r * 1.0, len * 2.0 * this.driveDef.plume, { z: len * 0.85, opacity: 0.4, amp: 0.24 });
  },

  drive_ion(pod, r, len) {
    const m = this.mats;
    addMesh(pod, G.box(), m.engine, 0, 0, 0, 0, 0, 0, r * 2.3, r * 2.3, len);
    addMesh(pod, G.box(), m.metal, 0, 0, -len * 0.5, 0, 0, 0, r * 2.5, r * 2.5, len * 0.14);
    // emitter grid
    for (let i = -1; i <= 1; i++) {
      for (let j = -1; j <= 1; j++) {
        const cell = addMesh(pod, G.cyl(8), m.glow, i * r * 0.72, j * r * 0.72, len * 0.52, Math.PI / 2, 0, 0, r * 0.28, len * 0.06, r * 0.28);
        cell.castShadow = false;
      }
    }
    addMesh(pod, G.box(), m.accent, 0, r * 1.18, 0, 0, 0, 0, r * 2.0, r * 0.08, len * 0.7);
    this.plume(pod, r * 2.0, len * 2.6 * this.driveDef.plume, { z: len * 0.6, opacity: 0.16, intensity: 1.4, amp: 0.08 });
  },

  drive_plasma(pod, r, len) {
    const m = this.mats;
    addMesh(pod, G.cyl(16), m.engine, 0, 0, 0, Math.PI / 2, 0, 0, r * 0.85, len * 1.2, r * 0.85);
    for (let i = 0; i < 4; i++) {
      const ring = addMesh(pod, G.torus(0.16), m.accent, 0, 0, -len * 0.5 + i * len * 0.34, 0, 0, 0, r * 1.05, r * 1.05, r * 0.4);
      ring.userData.coil = { phase: i * 0.6 };
    }
    addMesh(pod, G.taper(0.55, 16), m.metal, 0, 0, len * 0.75, Math.PI / 2, 0, 0, r * 0.95, len * 0.4, r * 0.95);
    addMesh(pod, G.cyl(14), m.hot, 0, 0, len * 0.9, Math.PI / 2, 0, 0, r * 0.34, len * 0.16, r * 0.34).castShadow = false;
    this.plume(pod, r * 0.5, len * 3.2 * this.driveDef.plume, { z: len * 0.95, opacity: 0.5, intensity: 3.2, amp: 0.32 });
  },

  drive_antimatter(pod, r, len) {
    const m = this.mats;
    addMesh(pod, G.cyl(14), m.engine, 0, 0, -len * 0.35, Math.PI / 2, 0, 0, r * 0.7, len * 0.6, r * 0.7);
    const ring = addMesh(pod, G.torus(0.2), m.metal, 0, 0, len * 0.35, 0, 0, 0, r * 1.5, r * 1.5, r * 0.55);
    ring.userData.spin = { axis: "z", speed: 1.4 };
    const inner = addMesh(pod, G.torus(0.09), m.glow, 0, 0, len * 0.35, 0, 0, 0, r * 1.2, r * 1.2, r * 0.35);
    inner.castShadow = false;
    const core = addMesh(pod, G.sphere(), m.hot, 0, 0, len * 0.35, 0, 0, 0, r * 0.42, r * 0.42, r * 0.42);
    core.castShadow = false;
    core.userData.pulse = { amp: 0.25, speed: 5 };
    for (let i = 0; i < 3; i++) {
      const a = (i / 3) * Math.PI * 2;
      addMesh(pod, G.box(), m.metal, Math.cos(a) * r * 1.5, Math.sin(a) * r * 1.5, len * 0.05, 0, 0, 0, r * 0.16, r * 0.16, len * 0.7);
    }
    this.plume(pod, r * 0.62, len * 3.6 * this.driveDef.plume, { z: len * 0.6, opacity: 0.42, intensity: 3.6, amp: 0.3 });
  },

  drive_pulse(pod, r, len) {
    const m = this.mats;
    addMesh(pod, G.cyl(12), m.engine, 0, 0, -len * 0.2, Math.PI / 2, 0, 0, r * 1.0, len * 0.9, r * 1.0);
    for (let i = 0; i < 3; i++) {
      const seg = addMesh(pod, G.cyl(12), i % 2 ? m.metal : m.engine, 0, 0, len * 0.25 + i * len * 0.24, Math.PI / 2, 0, 0, r * (1.0 - i * 0.12), len * 0.2, r * (1.0 - i * 0.12));
      const glowRing = addMesh(pod, G.torus(0.07), m.glow, 0, 0, len * 0.25 + i * len * 0.24, 0, 0, 0, r * (1.02 - i * 0.12), r * (1.02 - i * 0.12), r * 0.3);
      glowRing.castShadow = false;
      glowRing.userData.pulse = { amp: 0.3, speed: 6, phase: i * 1.1 };
      seg.castShadow = true;
    }
    this.plume(pod, r * 0.75, len * 1.7 * this.driveDef.plume, { z: len * 0.9, opacity: 0.34, intensity: 2.6, amp: 0.5 });
  },

  drive_vector(pod, r, len) {
    const m = this.mats;
    addMesh(pod, G.cyl(14), m.engine, 0, 0, -len * 0.1, Math.PI / 2, 0, 0, r * 0.95, len * 0.9, r * 0.95);
    addMesh(pod, G.torus(0.18), m.metal, 0, 0, len * 0.32, 0, 0, 0, r * 1.1, r * 1.1, r * 0.45);
    const gimbal = new THREE.Group();
    gimbal.position.set(0, 0, len * 0.36);
    gimbal.userData.gimbal = { amp: 0.12 };
    addMesh(gimbal, G.taper(1.5, 16), m.engine, 0, 0, len * 0.25, Math.PI / 2, 0, 0, r * 0.85, len * 0.5, r * 0.85);
    addMesh(gimbal, G.taper(1.35, 16), m.glow, 0, 0, len * 0.26, Math.PI / 2, 0, 0, r * 0.66, len * 0.42, r * 0.66).castShadow = false;
    const pm = m.glow.clone();
    pm.transparent = true; pm.opacity = 0.32; pm.depthWrite = false; pm.emissiveIntensity = 2.2;
    const p = addMesh(gimbal, G.coneOpen(14), pm, 0, 0, len * 0.9, Math.PI / 2, 0, 0, r * 0.9, len * 1.4 * this.driveDef.plume, r * 0.9);
    p.castShadow = false;
    p.userData.plume = { type: "vector", base: 1, amp: 0.22, op: pm.opacity };
    pod.add(gimbal);
  },

  /* ---- HYDROGEN CHEM: cryo tank + clustered bell nozzles ---------- */
  drive_hydrogen(pod, r, len) {
    const m = this.mats;
    // cryogenic feed tank with frost ribs
    addMesh(pod, G.cyl(16), m.light, 0, 0, -len * 0.55, Math.PI / 2, 0, 0, r * 1.25, len * 0.7, r * 1.25);
    for (let i = 0; i < 3; i++)
      addMesh(pod, G.torus(0.09), m.metal, 0, 0, -len * 0.85 + i * len * 0.3, 0, 0, 0, r * 1.3, r * 1.3, r * 0.3);
    addMesh(pod, G.box(), m.dark, 0, 0, -len * 0.1, 0, 0, 0, r * 2.1, r * 2.1, len * 0.3);
    // turbopump plumbing
    for (let i = 0; i < 4; i++) {
      const a = (i / 4) * Math.PI * 2 + 0.4;
      addMesh(pod, G.cyl(6), m.metal, Math.cos(a) * r * 1.15, Math.sin(a) * r * 1.15, len * 0.05,
        Math.PI / 2, 0, 0, r * 0.1, len * 0.55, r * 0.1);
    }
    // 3-bell cluster
    const bells = [[0, 0, 1.0], [-0.72, -0.42, 0.72], [0.72, -0.42, 0.72]];
    for (const [bx, by, bs] of bells) {
      const x = bx * r, y = by * r;
      addMesh(pod, G.taper(1.9, 16), m.engine, x, y, len * 0.55, Math.PI / 2, 0, 0, r * 0.5 * bs, len * 0.62, r * 0.5 * bs);
      const throat = addMesh(pod, G.taper(1.7, 16), m.glow, x, y, len * 0.58, Math.PI / 2, 0, 0, r * 0.4 * bs, len * 0.5, r * 0.4 * bs);
      throat.castShadow = false;
      addMesh(pod, G.torus(0.14), m.metal, x, y, len * 0.86, 0, 0, 0, r * 0.94 * bs, r * 0.94 * bs, r * 0.22);
      const pl = this.plume(pod, r * 0.85 * bs, len * 1.9 * this.driveDef.plume,
        { z: len * 0.9, opacity: 0.4, intensity: 2.6, amp: 0.34 });
      pl.position.x = x; pl.position.y = y;
    }
    this.count(6);
  },

  /* ---- HALL / ION ARRAY: annular emitter rings (barge doctrine) ---- */
  drive_hall(pod, r, len) {
    const m = this.mats;
    addMesh(pod, G.box(), m.engine, 0, 0, -len * 0.15, 0, 0, 0, r * 2.4, r * 2.4, len * 0.8);
    addMesh(pod, G.box(), m.dark, 0, 0, -len * 0.55, 0, 0, 0, r * 2.7, r * 2.7, len * 0.16);
    // three concentric emitter halos — the lit rings
    for (let i = 0; i < 3; i++) {
      const rr = r * (1.05 - i * 0.26);
      const ring = addMesh(pod, G.torus(0.10), m.glow, 0, 0, len * 0.42 + i * len * 0.16, 0, 0, 0, rr, rr, r * 0.22);
      ring.castShadow = false;
      ring.userData.pulse = { amp: 0.06, speed: 2.2, phase: i * 0.9 };
      addMesh(pod, G.torus(0.16), m.metal, 0, 0, len * 0.42 + i * len * 0.16, 0, 0, 0, rr * 1.16, rr * 1.16, r * 0.16);
    }
    // magnet spines
    for (let i = 0; i < 4; i++) {
      const a = (i / 4) * Math.PI * 2 + Math.PI / 4;
      addMesh(pod, G.box(), m.metal, Math.cos(a) * r * 1.3, Math.sin(a) * r * 1.3, len * 0.35, 0, 0, 0, r * 0.13, r * 0.13, len * 0.7);
    }
    addMesh(pod, G.cyl(16), m.hot, 0, 0, len * 0.72, Math.PI / 2, 0, 0, r * 0.42, len * 0.08, r * 0.42).castShadow = false;
    this.plume(pod, r * 1.5, len * 2.8 * this.driveDef.plume, { z: len * 0.75, opacity: 0.15, intensity: 1.5, amp: 0.07 });
    this.count(5);
  },

  /* ---- MICRO-EMITTERS: FEEP / electrospray needle arrays ---------- */
  drive_micro(pod, r, len) {
    const m = this.mats;
    addMesh(pod, G.box(), m.engine, 0, 0, -len * 0.1, 0, 0, 0, r * 2.2, r * 2.2, len * 0.7);
    addMesh(pod, G.box(), m.dark, 0, 0, -len * 0.5, 0, 0, 0, r * 2.4, r * 2.4, len * 0.12);
    for (let i = -2; i <= 2; i++) for (let j = -2; j <= 2; j++) {
      addMesh(pod, G.cone(6), m.metal, i * r * 0.42, j * r * 0.42, len * 0.32, Math.PI / 2, 0, 0, r * 0.09, len * 0.16, r * 0.09);
      const tip = addMesh(pod, G.sphere(), m.glow, i * r * 0.42, j * r * 0.42, len * 0.42, 0, 0, 0, r * 0.05, r * 0.05, r * 0.05);
      tip.castShadow = false;
    }
    addMesh(pod, G.box(), m.accent, 0, r * 1.15, 0, 0, 0, 0, r * 1.8, r * 0.06, len * 0.5);
    this.plume(pod, r * 1.1, len * 1.6 * this.driveDef.plume, { z: len * 0.45, opacity: 0.10, intensity: 1.2, amp: 0.05 });
    this.count(4);
  },

  /* ---- NUCLEAR THERMAL: reactor drum, radiator fins, long nozzle --- */
  drive_ntr(pod, r, len) {
    const m = this.mats;
    addMesh(pod, G.cyl(14), m.dark, 0, 0, -len * 0.5, Math.PI / 2, 0, 0, r * 1.15, len * 0.6, r * 1.15);
    // shadow shield
    addMesh(pod, G.cyl(14), m.metal, 0, 0, -len * 0.16, Math.PI / 2, 0, 0, r * 1.45, len * 0.1, r * 1.45);
    addMesh(pod, G.cyl(14), m.engine, 0, 0, len * 0.12, Math.PI / 2, 0, 0, r * 0.85, len * 0.5, r * 0.85);
    // radiator fins
    for (const sgn of [-1, 1]) {
      addMesh(pod, G.box(), m.panel, sgn * r * 1.9, 0, -len * 0.35, 0, 0, 0, r * 1.5, r * 0.06, len * 0.7);
      for (let i = 0; i < 3; i++)
        addMesh(pod, G.box(), m.accent, sgn * r * 1.9, r * 0.04, -len * 0.6 + i * len * 0.25, 0, 0, 0, r * 1.4, r * 0.03, len * 0.05);
    }
    const bell = addMesh(pod, G.taper(2.1, 18), m.engine, 0, 0, len * 0.6, Math.PI / 2, 0, 0, r * 0.5, len * 0.85, r * 0.5);
    bell.castShadow = true;
    addMesh(pod, G.taper(1.95, 18), m.glow, 0, 0, len * 0.62, Math.PI / 2, 0, 0, r * 0.42, len * 0.76, r * 0.42).castShadow = false;
    this.plume(pod, r * 0.95, len * 2.4 * this.driveDef.plume, { z: len * 1.0, opacity: 0.36, intensity: 2.6, amp: 0.18 });
    this.count(5);
  },

  /* ---- GRAVITIC: no exhaust, counter-rotating coils ---------------- */
  drive_gravitic(pod, r, len) {
    const m = this.mats;
    addMesh(pod, G.cyl(16), m.engine, 0, 0, 0, Math.PI / 2, 0, 0, r * 0.7, len * 0.9, r * 0.7);
    for (let i = 0; i < 3; i++) {
      const cage = new THREE.Group();
      cage.position.set(0, 0, -len * 0.2 + i * len * 0.32);
      cage.userData.spin = { axis: "z", speed: (i % 2 ? 1 : -1) * (0.8 + i * 0.4) };
      addMesh(cage, G.torus(0.13), m.metal, 0, 0, 0, 0, 0, 0, r * (1.5 - i * 0.16), r * (1.5 - i * 0.16), r * 0.3);
      const halo = addMesh(cage, G.torus(0.06), m.glow, 0, 0, 0, 0, 0, 0, r * (1.5 - i * 0.16), r * (1.5 - i * 0.16), r * 0.24);
      halo.castShadow = false;
      halo.userData.pulse = { amp: 0.05, speed: 2.6, phase: i * 1.2 };
      pod.add(cage);
    }
    const core = addMesh(pod, G.sphere(), m.hot, 0, 0, len * 0.3, 0, 0, 0, r * 0.34, r * 0.34, r * 0.34);
    core.castShadow = false;
    core.userData.pulse = { amp: 0.22, speed: 3.2 };
    this.count(5);
  }
};
