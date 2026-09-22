/* StarshipBuilder mixin — Hull silhouette — body, nose, superstructure, wings.
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
  /* ---- HULL -------------------------------------------------------- */
  addHull(root) {
    const { L, B, H, rng, cls, mats } = this;
    const body = new THREE.Group();
    body.name = "hull";
    const style = cls.body;

    if (style === "sleek") {
      this.vol(body, mats.hull, 0, 0, 0, B * 0.55, H * 0.72, L * 0.74);
      this.vol(body, mats.dark, 0, H * 0.26, L * 0.02, B * 0.40, H * 0.24, L * 0.50);
      addMesh(body, G.cyl(12), mats.light, 0, -H * 0.10, 0, Math.PI / 2, 0, 0, B * 0.28, L * 0.70, H * 0.38);
      addMesh(body, G.box(), mats.stripe, 0, H * 0.10, 0, 0, 0, 0, B * 0.57, H * 0.05, L * 0.40);
    } else if (style === "boxy" || style === "industrial") {
      this.vol(body, mats.hull, 0, 0, 0, B * 0.85, H * 0.85, L * 0.70);
      this.vol(body, mats.dark, 0, H * 0.14, L * 0.05, B * 0.70, H * 0.28, L * 0.44);
      for (const s of [-1, 1]) addMesh(body, G.box(), mats.metal, s * B * 0.43, 0, 0, 0, 0, 0, B * 0.03, H * 0.6, L * 0.55);
    } else if (style === "cargo") {
      this.vol(body, mats.dark, 0, -H * 0.15, L * 0.18, B * 0.45, H * 0.42, L * 0.36);
      const pods = 2 + rng.int(0, 2);
      for (let i = 0; i < pods; i++) {
        const z = -L * 0.28 + (i / Math.max(pods - 1, 1)) * L * 0.55;
        this.vol(body, i % 2 ? mats.hull : mats.light, 0, H * 0.05, z, B * 0.92, H * 0.72, L * 0.16);
        addMesh(body, G.box(), mats.accent, 0, H * 0.05, z, 0, 0, 0, B * 0.94, H * 0.05, L * 0.02);
        addMesh(body, G.box(), mats.metal, 0, H * 0.05, z + L * 0.08, 0, 0, 0, B * 0.9, H * 0.7, L * 0.012);
      }
    } else if (style === "tanks") {
      this.vol(body, mats.dark, 0, -H * 0.2, L * 0.22, B * 0.38, H * 0.36, L * 0.28);
      const n = 3 + rng.int(0, 2);
      for (let i = 0; i < n; i++) {
        const z = -L * 0.32 + i * (L * 0.58 / n);
        addMesh(body, G.cyl(16), mats.hull, 0, 0, z, Math.PI / 2, 0, 0, B * 0.38, L * 0.14, H * 0.42);
        addMesh(body, G.torus(0.09), mats.metal, 0, 0, z + L * 0.07, 0, 0, 0, B * 0.385, H * 0.425, B * 0.05);
        addMesh(body, G.cyl(16), mats.stripe, 0, 0, z + L * 0.01, Math.PI / 2, 0, 0, B * 0.383, L * 0.02, H * 0.423);
        this.hullVols.push({ x: 0, y: 0, z, w: B * 0.76, h: H * 0.84, d: L * 0.14, shape: "cyl" });   // curved: mounts stay on the tangent band
      }
      // spine
      this.vol(body, mats.metal, 0, -H * 0.3, 0, B * 0.12, H * 0.12, L * 0.8);
    } else if (style === "deck") {
      this.vol(body, mats.hull, 0, -H * 0.15, 0, B * 0.95, H * 0.55, L * 0.82);
      this.vol(body, mats.dark, 0, H * 0.18, 0, B * 0.98, H * 0.10, L * 0.86);
      addMesh(body, G.box(), mats.accent, 0, H * 0.24, L * 0.12, 0, 0, 0, B * 0.16, H * 0.02, L * 0.5);
      for (let i = 0; i < 8; i++) {
        addMesh(body, G.box(), mats.stripe, 0, H * 0.243, -L * 0.34 + i * L * 0.09, 0, 0, 0, B * 0.3, H * 0.015, L * 0.014);
      }
      // hangar mouth
      addMesh(body, G.box(), mats.metal, 0, -H * 0.1, -L * 0.41, 0, 0, 0, B * 0.5, H * 0.3, L * 0.02);
    } else if (style === "war" || style === "capital" || style === "layered") {
      this.vol(body, mats.hull, 0, -H * 0.08, 0, B * 0.70, H * 0.62, L * 0.78);
      this.vol(body, mats.dark, 0, H * 0.24, L * 0.04, B * 0.52, H * 0.28, L * 0.48);
      this.vol(body, mats.light, 0, H * 0.10, -L * 0.10, B * 0.44, H * 0.24, L * 0.38);
      for (const s of [-1, 1]) {
        addMesh(body, G.box(), mats.metal, s * B * 0.355, -H * 0.08, 0, 0, 0, 0, B * 0.02, H * 0.5, L * 0.7);
      }
      if (style === "capital") {
        this.vol(body, mats.panel, 0, -H * 0.30, 0, B * 0.56, H * 0.18, L * 0.64);
        this.vol(body, mats.dark, 0, -H * 0.42, L * 0.05, B * 0.30, H * 0.16, L * 0.46);
      }
      if (style === "war") {
        for (const s of [-1, 1]) this.vol(body, mats.panel, s * B * 0.42, -H * 0.05, L * 0.02, B * 0.16, H * 0.34, L * 0.5);
      }
    } else if (style === "needle") {
      // reconnaissance hull: one long pressure tube, two sensor pods, everything else is skin
      const r = Math.min(B, H) * 0.34;
      addMesh(body, G.cyl(18), mats.hull, 0, 0, L * 0.02, Math.PI / 2, 0, 0, r, L * 0.86, r);
      this.hullVols.push({ x: 0, y: 0, z: L * 0.02, w: 2 * r, h: 2 * r, d: L * 0.86, shape: "cyl" });
      addMesh(body, G.taper(0.55, 18), mats.light, 0, 0, -L * 0.5, -Math.PI / 2, 0, 0, r, L * 0.2, r);        // forward taper
      addMesh(body, G.taper(1.25, 18), mats.dark, 0, 0, L * 0.5, -Math.PI / 2, 0, 0, r, L * 0.1, r);          // engine flare
      for (let i = 0; i < 5; i++) addMesh(body, G.torus(0.06), mats.metal, 0, 0, -L * 0.3 + i * L * 0.16, 0, 0, 0, r * 1.02, r * 1.02, r * 0.5);
      for (const s of [-1, 1]) {
        const pr = r * 0.48, px = s * (r + pr * 1.1);
        addMesh(body, G.cyl(12), mats.light, px, -r * 0.2, L * 0.08, Math.PI / 2, 0, 0, pr, L * 0.46, pr);
        addMesh(body, G.taper(0.4, 12), mats.dark, px, -r * 0.2, -L * 0.2, -Math.PI / 2, 0, 0, pr, L * 0.1, pr);
        addMesh(body, G.box(), mats.metal, s * (r + pr * 0.4), -r * 0.2, L * 0.08, 0, 0, 0, pr * 1.4, pr * 0.3, L * 0.3);
        this.hullVols.push({ x: px, y: -r * 0.2, z: L * 0.08, w: 2 * pr, h: 2 * pr, d: L * 0.46, shape: "cyl" });
      }
      addMesh(body, G.box(), mats.glassDark, 0, r * 0.75, -L * 0.22, -0.3, 0, 0, r * 0.9, r * 0.35, L * 0.08);    // canopy strip
    } else if (style === "wedge") {
      // arrowhead lifting body: extruded triangle, chined, with slice volumes that follow the taper
      const half = B * 0.5, nose = -L * 0.48, tail = L * 0.36, thick = H * 0.55;
      const sh = new THREE.Shape(); sh.moveTo(0, nose); sh.lineTo(half, tail); sh.lineTo(half * 0.7, tail + L * 0.06); sh.lineTo(-half * 0.7, tail + L * 0.06); sh.lineTo(-half, tail); sh.closePath();
      const geo = new THREE.ExtrudeGeometry(sh, { depth: thick, bevelEnabled: true, bevelThickness: thick * 0.25, bevelSize: B * 0.05, bevelSegments: 2 });
      const wedge = new THREE.Mesh(geo, mats.hull); wedge.rotation.x = Math.PI / 2; wedge.position.y = thick * 0.5; wedge.castShadow = wedge.receiveShadow = true; body.add(wedge);
      for (let i = 0; i < 4; i++) {
        const z0 = nose + (i + 0.5) * (tail - nose) / 4; const w = half * 2 * ((i + 0.25) / 4);
        this.hullVols.push({ x: 0, y: 0, z: z0, w: w * 0.85, h: thick * 0.9, d: (tail - nose) / 4, shape: null });
      }
      addMesh(body, G.box(), mats.dark, 0, thick * 0.45, L * 0.05, 0, 0, 0, B * 0.3, thick * 0.35, L * 0.45);
      this.hullVols.push({ x: 0, y: thick * 0.45, z: L * 0.05, w: B * 0.3, h: thick * 0.35, d: L * 0.45 });
      addMesh(body, G.box(), mats.glassDark, 0, thick * 0.55, -L * 0.2, -0.35, 0, 0, B * 0.16, thick * 0.2, L * 0.1);
    } else if (style === "curved") {
      // sculpted yacht hull: stretched ellipsoid with a flat spine deck and chined belly
      addMesh(body, G.sphere(), mats.hull, 0, 0, 0, 0, 0, 0, B * 0.5, H * 0.5, L * 0.5);
      this.hullVols.push({ x: 0, y: 0, z: 0, w: B, h: H, d: L, shape: "cyl" });
      addMesh(body, G.box(), mats.light, 0, H * 0.42, L * 0.02, 0, 0, 0, B * 0.34, H * 0.16, L * 0.5);
      this.hullVols.push({ x: 0, y: H * 0.42, z: L * 0.02, w: B * 0.34, h: H * 0.16, d: L * 0.5 });
      addMesh(body, G.sphere(), mats.glassDark, 0, H * 0.3, -L * 0.3, 0, 0, 0, B * 0.26, H * 0.24, L * 0.14);
      for (const s of [-1, 1]) addMesh(body, G.box(), mats.accent, s * B * 0.46, -H * 0.05, L * 0.02, 0, 0, s * 0.35, B * 0.02, H * 0.06, L * 0.6);
    } else if (style === "sphere") {
      // sphere core with an equatorial service band and a spine aft
      const r = Math.min(B, H) * 0.48;
      addMesh(body, G.sphere(), mats.hull, 0, 0, -L * 0.1, 0, 0, 0, r, r, r);
      this.hullVols.push({ x: 0, y: 0, z: -L * 0.1, w: 2 * r, h: 2 * r, d: 2 * r, shape: "sphere" });
      addMesh(body, G.torus(0.12), mats.dark, 0, 0, -L * 0.1, Math.PI / 2, 0, 0, r * 1.02, r * 1.02, r * 0.6);
      // four flat service pads on the equator give the sphere real mounting surface
      for (const [px, py, rz] of [[0, r * 0.92, 0], [0, -r * 0.92, 0], [r * 0.92, 0, Math.PI / 2], [-r * 0.92, 0, Math.PI / 2]]) {
        addMesh(body, G.box(), mats.light, px, py, -L * 0.1, 0, 0, rz, r * 0.9, r * 0.16, r * 1.1);
        this.hullVols.push(rz ? { x: px, y: py, z: -L * 0.1, w: r * 0.16, h: r * 0.9, d: r * 1.1 } : { x: px, y: py, z: -L * 0.1, w: r * 0.9, h: r * 0.16, d: r * 1.1 });
      }
      addMesh(body, G.cyl(14), mats.dark, 0, 0, L * 0.25, Math.PI / 2, 0, 0, r * 0.45, L * 0.5, r * 0.45);
      this.hullVols.push({ x: 0, y: 0, z: L * 0.25, w: r * 0.9, h: r * 0.9, d: L * 0.5, shape: "cyl" });
      addMesh(body, G.box(), mats.light, 0, 0, L * 0.25, 0, 0, 0, r * 0.7, r * 0.7, L * 0.2);
      this.hullVols.push({ x: 0, y: 0, z: L * 0.25, w: r * 0.7, h: r * 0.7, d: L * 0.2 });
    } else if (style === "ring") {
      // liner: rotating habitat torus around a central hub, spokes, aft service block
      const R = B * 0.42, tube = Math.min(H * 0.5, B * 0.12) * 0.9;
      const ring = addMesh(body, G.torus(tube / R), mats.hull, 0, 0, -L * 0.05, 0, 0, 0, R, R, R);
      ring.userData.spin = { axis: "z", speed: 0.12 };
      this.hullVols.push({ x: 0, y: 0, z: -L * 0.05, w: 2 * (R + tube), h: 2 * (R + tube), d: 2 * tube, shape: "ring" });
      addMesh(body, G.cyl(16), mats.dark, 0, 0, 0, Math.PI / 2, 0, 0, tube * 1.3, L * 0.8, tube * 1.3);
      this.hullVols.push({ x: 0, y: 0, z: 0, w: tube * 2.6, h: tube * 2.6, d: L * 0.8, shape: "cyl" });
      for (let i = 0; i < 4; i++) { const a = i * Math.PI / 2 + Math.PI / 4;
        addMesh(body, G.box(), mats.metal, Math.cos(a) * R * 0.5, Math.sin(a) * R * 0.5, -L * 0.05, 0, 0, a, R, tube * 0.35, tube * 0.35); }
      addMesh(body, G.box(), mats.light, 0, 0, L * 0.3, 0, 0, 0, B * 0.4, H * 0.4, L * 0.24);
      this.hullVols.push({ x: 0, y: 0, z: L * 0.3, w: B * 0.4, h: H * 0.4, d: L * 0.24 });
    } else if (style === "jagged") {
      // raider: asymmetric angular armour slabs over a core box
      this.vol(body, mats.dark, 0, 0, 0, B * 0.5, H * 0.6, L * 0.7);
      const armor = new THREE.Group(); armor.name = "armor";
      for (let i = 0; i < 7; i++) {
        const s = rng.sign(), z = rng.range(-L * 0.35, L * 0.3);
        addMesh(armor, G.box(), i % 2 ? mats.hull : mats.panel, s * B * rng.range(0.2, 0.34), rng.range(-H * 0.1, H * 0.25), z,
          rng.range(-0.3, 0.3), rng.range(-0.25, 0.25), s * rng.range(0.15, 0.5), B * rng.range(0.25, 0.4), H * rng.range(0.06, 0.12), L * rng.range(0.15, 0.3));
      }
      for (const s of [-1, 1]) addMesh(armor, G.box(), mats.hull, s * B * 0.34, -H * 0.15, -L * 0.15, 0, 0, s * 0.7, B * 0.3, H * 0.08, L * 0.35);   // chines
      root.add(armor);
      this.count(9);
    } else if (style === "drum") {
      // worldship: one huge cylinder with end caps and a spine of windows
      const r = Math.min(B, H) * 0.5;
      addMesh(body, G.cyl(24), mats.hull, 0, 0, 0, Math.PI / 2, 0, 0, r, L * 0.8, r);
      this.hullVols.push({ x: 0, y: 0, z: 0, w: 2 * r, h: 2 * r, d: L * 0.8, shape: "cyl" });
      for (const z of [-L * 0.4, L * 0.4]) addMesh(body, G.cyl(24), mats.dark, 0, 0, z, Math.PI / 2, 0, 0, r * 1.04, L * 0.04, r * 1.04);
      for (let i = 0; i < 6; i++) addMesh(body, G.torus(0.05), mats.metal, 0, 0, -L * 0.35 + i * L * 0.14, 0, 0, 0, r * 1.02, r * 1.02, r * 0.5);
      addMesh(body, G.box(), mats.light, 0, r * 0.98, 0, 0, 0, 0, r * 0.4, r * 0.1, L * 0.7);
      this.hullVols.push({ x: 0, y: r * 0.98, z: 0, w: r * 0.4, h: r * 0.1, d: L * 0.7 });
    } else if (style === "science") {
      this.vol(body, mats.hull, 0, 0, L * 0.05, B * 0.55, H * 0.55, L * 0.55);
      addMesh(body, G.sphere(), mats.light, 0, H * 0.05, -L * 0.14, 0, 0, 0, B * 0.30, H * 0.32, B * 0.30);
      this.hullVols.push({ x: 0, y: H * 0.05, z: -L * 0.14, w: B * 0.5, h: H * 0.5, d: B * 0.5, shape: "sphere" });
      addMesh(body, G.torus(0.07), mats.accent, 0, H * 0.05, -L * 0.14, 0, 0, 0, B * 0.33, B * 0.33, B * 0.1);
      addMesh(body, G.cyl(12), mats.metal, 0, H * 0.02, -L * 0.05, Math.PI / 2, 0, 0, B * 0.12, L * 0.2, B * 0.12);
    }

    // ventral keel + belly plating
    this.vol(body, mats.dark, 0, -H * 0.44, L * 0.02, B * 0.18, H * 0.16, L * 0.55);
    root.add(body);
  },

  /* ---- NOSE -------------------------------------------------------- */
  addNose(root) {
    const { L, B, H, rng, cls, mats } = this;
    const nose = new THREE.Group();
    nose.name = "nose";
    const z = -L * 0.42;
    const kind = this.noseKind || cls.nose;

    if (kind === "ogive") {
      // power-series ogive lathe: the low-drag continuum nose the design regime asked for
      const pts = []; const n = 14, len = L * 0.34, rx = B * 0.24;
      for (let i = 0; i <= n; i++) { const t = i / n; pts.push(new THREE.Vector2(rx * Math.pow(t, 0.62) + 0.001, len * (1 - t))); }
      const geo = new THREE.LatheGeometry(pts, 20);
      const og = new THREE.Mesh(geo, mats.hull); og.rotation.x = -Math.PI / 2; og.scale.set(1, 1, H * 0.24 / rx); og.position.set(0, 0, z + L * 0.03);
      og.castShadow = og.receiveShadow = true; nose.add(og);
      addMesh(nose, G.torus(0.05), mats.accent, 0, 0, z + L * 0.03, 0, 0, 0, rx * 1.01, H * 0.24 * 1.01, rx * 0.3);
      addMesh(nose, G.box(), mats.glassDark, 0, H * 0.1, z - L * 0.05, -0.55, 0, 0, B * 0.14, H * 0.05, L * 0.08);
    } else if (kind === "spike") {
      addMesh(nose, G.cone(10), mats.hull, 0, 0, z - L * 0.08, -Math.PI / 2, 0, 0, B * 0.22, L * 0.28, H * 0.28);
      addMesh(nose, G.cone(10), mats.accent, 0, 0, z - L * 0.20, -Math.PI / 2, 0, 0, B * 0.07, L * 0.06, H * 0.09);
    } else if (kind === "cockpit") {
      addMesh(nose, G.box(), mats.hull, 0, H * 0.05, z, 0, 0, 0, B * 0.32, H * 0.42, L * 0.18);
      addMesh(nose, G.box(), mats.glass, 0, H * 0.20, z - L * 0.04, 0.15, 0, 0, B * 0.24, H * 0.20, L * 0.10);
      addMesh(nose, G.cone(8), mats.dark, 0, -H * 0.05, z - L * 0.10, -Math.PI / 2, 0, 0, B * 0.14, L * 0.12, H * 0.16);
    } else if (kind === "cabin") {
      addMesh(nose, G.box(), mats.dark, 0, H * 0.16, z + L * 0.02, 0, 0, 0, B * 0.40, H * 0.46, L * 0.16);
      addMesh(nose, G.box(), mats.glass, 0, H * 0.24, z - L * 0.04, 0, 0, 0, B * 0.28, H * 0.16, L * 0.06);
      addMesh(nose, G.box(), mats.hull, 0, -H * 0.10, z - L * 0.02, 0, 0, 0, B * 0.34, H * 0.24, L * 0.12);
    } else if (kind === "bridge") {
      addMesh(nose, G.box(), mats.hull, 0, H * 0.08, z, 0, 0, 0, B * 0.38, H * 0.40, L * 0.20);
      addMesh(nose, G.box(), mats.dark, 0, H * 0.40, z + L * 0.04, 0, 0, 0, B * 0.28, H * 0.22, L * 0.14);
      addMesh(nose, G.box(), mats.glass, 0, H * 0.42, z - L * 0.02, 0.2, 0, 0, B * 0.23, H * 0.10, L * 0.05);
      addMesh(nose, G.cone(6), mats.metal, 0, H * 0.02, z - L * 0.11, -Math.PI / 2, 0, 0, B * 0.16, L * 0.14, H * 0.2);
    } else if (kind === "armored") {
      addMesh(nose, G.box(), mats.hull, 0, 0, z, 0, 0, 0, B * 0.50, H * 0.56, L * 0.18);
      addMesh(nose, G.cone(6), mats.dark, 0, 0, z - L * 0.12, -Math.PI / 2, 0, 0, B * 0.24, L * 0.18, H * 0.30);
      for (const s of [-1, 1]) addMesh(nose, G.box(), mats.metal, s * B * 0.24, 0, z - L * 0.02, 0, 0, s * 0.35, B * 0.06, H * 0.4, L * 0.14);
    } else if (kind === "blunt") {
      addMesh(nose, G.box(), mats.hull, 0, 0, z, 0, 0, 0, B * 0.70, H * 0.50, L * 0.12);
      addMesh(nose, G.box(), mats.accent, 0, H * 0.16, z - L * 0.05, 0, 0, 0, B * 0.5, H * 0.03, L * 0.02);
    } else if (kind === "sensor") {
      addMesh(nose, G.sphere(), mats.glass, 0, H * 0.10, z - L * 0.02, 0, 0, 0, B * 0.22, H * 0.24, B * 0.22);
      addMesh(nose, G.torus(0.12), mats.accent, 0, H * 0.10, z - L * 0.02, Math.PI / 2, 0, 0, B * 0.24, B * 0.24, B * 0.08);
      addMesh(nose, G.cyl(10), mats.metal, 0, H * 0.10, z + L * 0.06, Math.PI / 2, 0, 0, B * 0.10, L * 0.12, B * 0.10);
    } else if (kind === "industrial") {
      addMesh(nose, G.box(), mats.dark, 0, 0, z, 0, 0, 0, B * 0.50, H * 0.46, L * 0.14);
      const arm = rng.range(0.6, 1.1);
      for (const s of [-1, 1]) {
        addMesh(nose, G.box(), mats.hull, s * B * 0.38, -H * 0.10, z - L * 0.08, 0.4 * s, 0, 0, B * 0.08, H * 0.08, L * 0.22 * arm);
        addMesh(nose, G.cone(8), mats.metal, s * B * 0.38, -H * 0.16, z - L * 0.20 * arm, -Math.PI / 2, 0, 0, B * 0.05, L * 0.08, B * 0.05);
      }
    }
    this.count();
    root.add(nose);
  },

  /* ---- SUPERSTRUCTURE ---------------------------------------------- */
  addSuperstructure(root) {
    const { L, B, H, rng, cls, mats, complexity } = this;
    const towers = Math.round(cls.towers * (0.5 + complexity));
    for (let i = 0; i < towers; i++) {
      const z = rng.range(-L * 0.15, L * 0.28);
      const w = B * rng.range(0.14, 0.30);
      const h = H * rng.range(0.35, 0.85);
      const d = L * rng.range(0.06, 0.14);
      const x = rng.range(-B * 0.10, B * 0.10);
      const y = H * 0.45 + h * 0.3;
      addMesh(root, G.box(), i % 2 ? mats.dark : mats.hull, x, y, z, 0, 0, 0, w, h, d);
      addMesh(root, G.box(), mats.glass, x, y + h * 0.28, z - d * 0.5, 0, 0, 0, w * 0.72, h * 0.14, d * 0.1);
      addMesh(root, G.box(), mats.accent, x, y - h * 0.42, z, 0, 0, 0, w * 1.02, h * 0.03, d * 0.9);
      this.hullVols.push({ x, y, z, w, h, d });
      this.count(2);
    }

    for (let i = 0; i < cls.cargo; i++) {
      const z = rng.range(-L * 0.2, L * 0.25);
      if (rng.chance(0.5)) {
        for (const s of [-1, 1]) {
          const x = s * B * 0.48;
          addMesh(root, G.box(), mats.panel, x, 0, z, 0, 0, 0, B * 0.22, H * 0.38, L * 0.12);
          addMesh(root, G.box(), mats.metal, x, 0, z, 0, 0, 0, B * 0.23, H * 0.06, L * 0.125);
          this.hullVols.push({ x, y: 0, z, w: B * 0.22, h: H * 0.38, d: L * 0.12 });
        }
      } else {
        addMesh(root, G.box(), mats.panel, 0, H * 0.44, z, 0, 0, 0, B * 0.40, H * 0.22, L * 0.14);
        this.hullVols.push({ x: 0, y: H * 0.44, z, w: B * 0.4, h: H * 0.22, d: L * 0.14 });
      }
      this.count();
    }
  },

  /* ---- WINGS ------------------------------------------------------- */
  addWings(root) {
    const { L, B, H, rng, cls, mats } = this;
    const kind = cls.wings;
    const wings = new THREE.Group();
    wings.name = "wings";

    if (kind === "swept" || kind === "delta" || kind === "fin") {
      const span = B * rng.range(0.7, 1.35);
      const rootC = L * rng.range(0.22, 0.38);
      const tipC = rootC * rng.range(0.28, 0.55);
      const sweep = L * (kind === "swept" ? rng.range(0.18, 0.34) : rng.range(0.08, 0.2));
      const thick = H * rng.range(0.08, 0.16);
      const geo = wingShape(span, rootC, tipC, sweep, thick);
      const y = kind === "fin" ? H * 0.05 : -H * 0.05;
      const z = kind === "delta" ? -L * 0.05 : L * 0.05;
      const left = new THREE.Mesh(geo, mats.hull);
      left.rotation.set(-Math.PI / 2, 0, 0);
      left.position.set(B * 0.22, y, z);
      left.castShadow = true; left.receiveShadow = true;
      const right = left.clone();
      right.scale.x = -1;
      right.position.x *= -1;
      wings.add(left, right);
      for (const s of [-1, 1]) {
        // leading-edge accent
        addMesh(wings, G.box(), mats.accent, s * (B * 0.22 + span * 0.55), y + thick * 0.55, z - sweep * 0.5, 0, 0, 0, span * 0.5, thick * 0.12, L * 0.02);
        if (rng.chance(0.7)) {
          addMesh(wings, G.box(), mats.dark, s * (B * 0.22 + span), y + H * 0.12, z - sweep * 0.5, 0, 0, s * 0.15, H * 0.05, H * 0.35, L * 0.08);
        }
        this.wingTips = this.wingTips || [];
        this.wingTips.push([s * (B * 0.22 + span * 0.75), y, z - sweep * 0.6]);
      }
    } else if (kind === "stub" || kind === "sponson") {
      for (const s of [-1, 1]) {
        addMesh(wings, G.box(), mats.hull, s * B * 0.55, -H * 0.05, L * 0.02, 0, 0, 0, B * 0.28, H * 0.22, L * 0.28);
        addMesh(wings, G.box(), mats.dark, s * B * 0.70, -H * 0.02, L * 0.04, 0, 0, 0, B * 0.12, H * 0.16, L * 0.18);
        addMesh(wings, G.box(), mats.accent, s * B * 0.55, -H * 0.05 + H * 0.115, L * 0.02, 0, 0, 0, B * 0.20, H * 0.02, L * 0.2);
        this.hullVols.push({ x: s * B * 0.55, y: -H * 0.05, z: L * 0.02, w: B * 0.28, h: H * 0.22, d: L * 0.28 });
        this.wingTips = this.wingTips || [];
        this.wingTips.push([s * B * 0.62, -H * 0.05, -L * 0.06]);
      }
    } else if (kind === "solar") {
      for (const s of [-1, 1]) {
        addMesh(wings, G.box(), mats.dark, s * B * 0.45, H * 0.05, 0, 0, 0, 0, B * 0.08, H * 0.05, L * 0.12);
        const panel = addMesh(wings, G.box(), mats.accent, s * B * 0.85, H * 0.05, 0, 0, 0, 0.15 * s, B * 0.70, H * 0.025, L * 0.45);
        panel.material = mats.accent;
        for (let i = 0; i < 4; i++) {
          addMesh(wings, G.box(), mats.metal, s * B * 0.85, H * 0.055, -L * 0.18 + i * L * 0.12, 0, 0, 0.15 * s, B * 0.72, H * 0.03, L * 0.012);
        }
      }
    }
    this.count();
    root.add(wings);
  },

  /* ---- FAIRINGS: wedge every superstructure block into the flow (atmospheric regimes) --------- */
  addFairings(root) {
    const { mats } = this;
    const blocks = root.children.filter(c => c.isMesh && c.geometry === G.box() && c.scale.y > this.H * 0.2 && c.scale.x > this.B * 0.1);
    for (const m of blocks) {
      const w = m.scale.x, h = m.scale.y, d = m.scale.z;
      const len = Math.max(d * 1.4, h * 1.6);
      // square pyramid (4-seg taper) spun 45° so its base matches the block, apex into the wind
      addMesh(root, G.taper(0.04, 4), m.material, m.position.x, m.position.y, m.position.z - d / 2 - len / 2, -Math.PI / 2, Math.PI / 4, 0, w / Math.SQRT2 * 1.02, len, h / Math.SQRT2 * 1.02);
      // gentle aft boat-tail
      addMesh(root, G.taper(0.35, 4), mats.dark, m.position.x, m.position.y, m.position.z + d / 2 + len * 0.3, Math.PI / 2, Math.PI / 4, 0, w / Math.SQRT2, len * 0.6, h / Math.SQRT2);
      this.count(2);
    }
  },

  /* ---- HEAT SHIELD: ventral ablator across the main body with a rounded leading edge ---------- */
  addHeatShield(root) {
    const { L, B, H, mats } = this;
    const pool = this.hullVols.filter(v => v.w > B * 0.3).sort((a, b) => (b.w * b.d) - (a.w * a.d));
    const V = pool[0]; if (!V) return;
    const g = new THREE.Group(); g.name = "heatshield";
    const y = V.y - V.h * 0.5 - H * 0.03, w = V.w * 1.12, d = V.d * 1.06;
    addMesh(g, G.box(), mats.rubber, V.x, y, V.z, 0, 0, 0, w, H * 0.06, d);
    addMesh(g, G.box(), mats.dark, V.x, y - H * 0.03, V.z, 0, 0, 0, w * 0.98, H * 0.012, d * 0.98);
    // tile grid
    for (let i = -3; i <= 3; i++) addMesh(g, G.box(), mats.hazard, V.x + i * w / 7, y - H * 0.032, V.z, 0, 0, 0, w * 0.006, H * 0.004, d * 0.96);
    for (let j = -4; j <= 4; j++) addMesh(g, G.box(), mats.hazard, V.x, y - H * 0.032, V.z + j * d / 9, 0, 0, 0, w * 0.96, H * 0.004, d * 0.006);
    // rounded leading edge wraps up over the nose
    addMesh(g, G.cyl(16), mats.rubber, V.x, y + H * 0.06, V.z - d / 2, 0, 0, Math.PI / 2, H * 0.12, w, H * 0.12);
    root.add(g);
    this.hullVols.push({ x: V.x, y: y, z: V.z, w, h: H * 0.06, d, shield: true });
    this.count(3);
  }
};
