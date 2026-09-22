/* StarshipBuilder mixin — Flight bridge, crew viewports, aft observation band.
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
  /* GLAZING — flight bridge, crew viewports, aft observation          */
  /* ================================================================ */
  addWindows(root) {
    const { L, B, H, rng, mats: m, eq } = this;
    if (eq.bridge === "none" && eq.crewWin <= 0) return;
    const g = new THREE.Group(); g.name = "glazing";
    const V = this.main;

    /* --- flight bridge ------------------------------------------- */
    if (eq.bridge !== "none") {
      const tower = eq.bridge === "tower";
      const bw = V.w * (tower ? 0.46 : 0.58);
      const bh = H * (tower ? 0.22 : 0.14);
      const bd = L * (tower ? 0.11 : 0.09);
      const by = V.y + V.h * 0.5 + (tower ? H * 0.16 : bh * 0.42);
      const bz = V.z - V.d * (tower ? 0.30 : 0.36);

      if (tower) {
        // pedestal below the bridge deck
        addMesh(g, G.box(), m.dark, V.x, by - bh * 1.1, bz + bd * 0.1, 0, 0, 0, bw * 0.7, bh * 1.3, bd * 0.8);
      }
      addMesh(g, G.box(), m.hull, V.x, by, bz, 0, 0, 0, bw * 1.04, bh * 1.18, bd * 1.05);
      this.occ.push({ box: new THREE.Box3().setFromCenterAndSize(new THREE.Vector3(V.x, by + bh * 0.1, bz), new THREE.Vector3(bw * 1.2, bh * 1.6, bd * 1.3)), tag: "bridge" });
      addMesh(g, G.box(), m.dark, V.x, by + bh * 0.62, bz, 0, 0, 0, bw * 0.9, bh * 0.14, bd * 0.9);

      // raked forward windscreen
      const wind = addMesh(g, G.box(), m.glassDark, V.x, by + bh * 0.06, bz - bd * 0.53, -0.13, 0, 0, bw * 0.92, bh * 0.72, bd * 0.07);
      wind.castShadow = false;
      // wrap-around quarter lights
      for (const sgn of [-1, 1]) {
        const q = addMesh(g, G.box(), m.glassDark, V.x + sgn * bw * 0.505, by + bh * 0.06, bz - bd * 0.16, 0, 0, 0, bd * 0.07, bh * 0.68, bd * 0.62);
        q.castShadow = false;
      }
      // mullions
      for (let i = -2; i <= 2; i++)
        addMesh(g, G.box(), m.metal, V.x + i * bw * 0.19, by + bh * 0.06, bz - bd * 0.56, -0.13, 0, 0, bw * 0.016, bh * 0.78, bd * 0.03);
      // console glow inside the bridge
      for (let i = 0; i < 4; i++)
        this.lamp(g, { color: "#bfe4ff", x: V.x + (i - 1.5) * bw * 0.21, y: by - bh * 0.10, z: bz - bd * 0.42,
                       r: H * 0.015, mode: "pulse", period: 2.4 + i * 0.5, phase: i * 0.7, base: 3.0 });
      // bridge roof beacon
      this.lamp(g, { color: "#ffffff", x: V.x, y: by + bh * 0.78, z: bz, r: H * 0.020, mode: "double", period: 1.5, base: 8 });
      this.count(6);
    }

    /* --- crew viewports down both flanks -------------------------- */
    const n = Math.max(0, Math.round(6 * eq.crewWin));
    for (const f of ["port", "star"]) {
      const nrm = faceNormal(f);
      for (let i = 0; i < n; i++) {
        const v = -0.52 + (n > 1 ? (i / (n - 1)) : 0.5) * 1.0;
        const [x, y, z] = this.hp(f, rng.range(0.66, 0.74), v);
        addMesh(g, G.box(), m.dark, x + nrm[0] * B * 0.004, y, z, 0, 0, 0, B * 0.014, H * 0.105, L * 0.032);
        this.occ.push({ box: new THREE.Box3().setFromCenterAndSize(new THREE.Vector3(x + nrm[0] * B * 0.02, y, z), new THREE.Vector3(B * 0.05, H * 0.11, L * 0.034)), tag: "viewport" });
        const w = addMesh(g, G.box(), m.winLit, x + nrm[0] * B * 0.011, y, z, 0, 0, 0, B * 0.008, H * 0.072, L * 0.024);
        w.castShadow = false;
        w.material = w.material.clone();
        w.material.userData.cloned = true;
        this.tagLamp(w, { mode: rng.chance(0.22) ? "pulse" : "steady", period: rng.range(3, 8), phase: rng.next(), base: 1.9 });
      }
    }

    /* --- aft observation band (crew watching the drives) ---------- */
    {
      const [x, y, z] = this.hp("stern", 0, 0.18);
      addMesh(g, G.box(), m.dark, x, y, z + L * 0.004, 0, 0, 0, V.w * 0.62, H * 0.15, L * 0.012);
      const band = addMesh(g, G.box(), m.glassDark, x, y, z + L * 0.010, 0, 0, 0, V.w * 0.54, H * 0.11, L * 0.008);
      band.castShadow = false;
      for (let i = 0; i < 4; i++)
        this.lamp(g, { color: "#ffd9a8", x: x + (i - 1.5) * V.w * 0.12, y, z: z + L * 0.014, r: H * 0.014,
                       mode: i === 3 ? "pulse" : "steady", period: 4 + i, base: 2.6 });
      this.count(2);
    }
    root.add(g);
  }
};
