/* StarshipBuilder mixin — Surface greebles and the cosmetic light signature.
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
  /* ---- GREEBLES — flush to tracked hull surfaces -------------------- */
  addGreebles(root) {
    const { L, B, H, rng, mats, complexity } = this;
    const n = Math.round((22 + L * 0.8) * complexity);
    for (let i = 0; i < n; i++) {
      const surf = this.pickSurface(rng);
      if (!surf) break;
      const [x, y, z] = surf.pos;
      const w = rng.range(0.1, 0.5) * this.opts.scale + B * 0.02;
      const d = rng.range(0.1, 0.7) * this.opts.scale + L * 0.008;
      const t = rng.range(0.05, 0.22) * this.opts.scale + H * 0.01;
      const mat = rng.chance(0.14) ? mats.accent : rng.chance(0.45) ? mats.dark : rng.chance(0.5) ? mats.panel : mats.metal;
      const nrm = surf.face === "top" ? [0, 1, 0] : surf.face === "bottom" ? [0, -1, 0] : surf.face === "right" ? [1, 0, 0] : [-1, 0, 0];
      const sx = surf.face === "left" || surf.face === "right" ? t : w;
      const sy = surf.face === "top" || surf.face === "bottom" ? t : w;
      const gb = new THREE.Box3().setFromCenterAndSize(new THREE.Vector3(x + nrm[0] * t * 0.4, y + nrm[1] * t * 0.4, z), new THREE.Vector3(sx, sy, d));
      if (this.occ.some(o => o.tag !== "hull" && o.box.intersectsBox(gb))) continue;
      addMesh(root, G.box(), mat,
        x + nrm[0] * t * 0.4, y + nrm[1] * t * 0.4, z,
        0, 0, 0, sx, sy, d);
    }
    this.partCount += n;
  },

  /* ================================================================ *
   * LIGHT SIGNATURE                                                   *
   * steady navigation lights + flashing anti-collision + chase strips *
   * ================================================================ */
  addRunningLights(root) {
    const { L, B, H, rng } = this;
    const V = this.main || { x: 0, y: 0, z: 0, w: B * 0.6, h: H * 0.6, d: L * 0.7 };
    const g = new THREE.Group(); g.name = "lights";
    const hw = V.w * 0.5, hh = V.h * 0.5, hd = V.d * 0.5;
    const r0 = Math.max(H, B) * 0.026;

    /* --- steady navigation set: red port, green starboard, white stern */
    this.lamp(g, { color: "#ff2f45", x: V.x - hw * 1.04, y: V.y + hh * 0.15, z: V.z - hd * 0.62, r: r0 * 1.25, mode: "steady", base: 5.5 });
    this.lamp(g, { color: "#2fff72", x: V.x + hw * 1.04, y: V.y + hh * 0.15, z: V.z - hd * 0.62, r: r0 * 1.25, mode: "steady", base: 5.5 });
    this.lamp(g, { color: "#ffffff", x: V.x, y: V.y + hh * 1.03, z: V.z + hd * 0.92, r: r0 * 1.1, mode: "steady", base: 4.5 });
    this.lamp(g, { color: "#ffffff", x: V.x, y: V.y - hh * 1.03, z: V.z - hd * 0.88, r: r0 * 0.9, mode: "steady", base: 3.5 });

    /* --- anti-collision strobes: dorsal + ventral, out of phase ---- */
    this.lamp(g, { color: "#ffffff", x: V.x, y: V.y + hh * 1.06, z: V.z - hd * 0.05, r: r0 * 1.15, mode: "double", period: 1.5, base: 10 });
    this.lamp(g, { color: "#ffffff", x: V.x, y: V.y - hh * 1.06, z: V.z + hd * 0.12, r: r0 * 1.15, mode: "double", period: 1.5, phase: 0.5, base: 10 });

    /* --- amber rotating beacons over the working end -------------- */
    this.lamp(g, { color: "#ffb03a", x: V.x + hw * 0.55, y: V.y + hh * 1.04, z: V.z + hd * 0.45, r: r0, mode: "blink", period: 1.9, duty: 0.22, base: 7 });
    this.lamp(g, { color: "#ffb03a", x: V.x - hw * 0.55, y: V.y + hh * 1.04, z: V.z + hd * 0.45, r: r0, mode: "blink", period: 1.9, duty: 0.22, phase: 0.5, base: 7 });

    /* --- running chase strips down both flanks -------------------- */
    const n = 9;
    for (const sgn of [-1, 1])
      for (let i = 0; i < n; i++)
        this.lamp(g, { color: "#8fd8ff", x: V.x + sgn * hw * 1.01, y: V.y + hh * 0.36,
                       z: V.z - hd * 0.82 + (i / (n - 1)) * hd * 1.64, r: r0 * 0.6,
                       mode: "chase", period: 1.7, i, count: n, base: 3.6 });

    /* --- keel formation lights, slow steady ----------------------- */
    for (let i = 0; i < 5; i++)
      this.lamp(g, { color: "#cfe9ff", x: V.x, y: V.y - hh * 1.02, z: V.z - hd * 0.6 + i * hd * 0.3, r: r0 * 0.5, mode: "steady", base: 2.4 });

    /* --- drive-guard warning pair --------------------------------- */
    for (const sgn of [-1, 1])
      this.lamp(g, { color: "#ff4a3a", x: V.x + sgn * hw * 0.6, y: V.y - hh * 0.85, z: V.z + hd * 0.98, r: r0 * 0.8,
                     mode: "pulse", period: 1.2, phase: sgn > 0 ? 0 : 0.5, base: 4.5 });

    /* --- a few hull-marker lamps in the accent colour ------------- */
    for (let i = 0; i < 4; i++) {
      const [x, y, z] = this.hp(rng.chance(0.5) ? "top" : "bottom", rng.range(-0.6, 0.6), rng.range(-0.6, 0.6));
      this.lamp(g, { color: this.opts.accent, x, y, z, r: r0 * 0.55, mode: rng.chance(0.5) ? "pulse" : "steady",
                     period: rng.range(2, 5), phase: rng.next(), base: 3 });
    }
    root.add(g);
  }
};
