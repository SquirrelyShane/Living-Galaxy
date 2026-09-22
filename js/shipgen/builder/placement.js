/* StarshipBuilder mixin — Occupancy (AABB) solver and loadout mounting.
 * Methods are installed onto StarshipBuilder.prototype by src/builder/StarshipBuilder.js. */
import * as THREE from "three";
import { RNG } from "../core/rng.js";
import { G, makeMat, addMesh, wingShape } from "../core/geometry.js";
import { faceNormal, faceEuler, faceRotation } from "./faces.js";
import { DRIVE_TYPES } from "../data/drives.js";
import { WEAPON_TYPES } from "../data/weapons.js";
import { PARTS } from "../data/catalog/index.js";
import { PREFABS, ALL_FACES, fpArea } from "../prefabs/index.js";
import { sunExposure } from "../data/environment.js";

/* conformal substitutions for hulls that fly through air: same part, flush geometry */
export const CONFORMAL_FLAGS = {
  dish:      { flush: true },        // parabolic dish → conformal phased-array plate
  radome:    { flush: true },        // tall radome → low blister
  mast:      { flush: true },        // whip → blade antenna
  sensorPod: { flush: true },        // spinning drum → flat aperture window
  optic:     { flush: true },        // gimballed tube → recessed window
  scanner:   { flush: true }         // sweep head → low fairing with a window
};

/* mounting priority: connection + mining hardware first, then heavy systems, then sensors, then fluff */
export function partPrio(p) {
  if (p.tags.some(t => ["dock", "landing", "mining"].includes(t))) return 3;
  if (p.tags.some(t => ["weapon", "launcher", "power", "reactor", "booster"].includes(t))) return 2;
  if (p.tags.some(t => ["sensor", "comm", "scanner", "acs", "thermal", "life", "habitat"].includes(t))) return 1;
  return 0;
}

/* world-space AABB of a prefab's declared work zone (local box on the prefab's node) */
export function workzoneBox(g, wz) {
  const node = wz.node || g;
  node.updateWorldMatrix(true, false);
  const sz = Array.isArray(wz.size) ? wz.size : [wz.size, wz.size, wz.size];
  const box = new THREE.Box3();
  for (const sx of [-1, 1]) for (const sy of [-1, 1]) for (const sz2 of [-1, 1])
    box.expandByPoint(node.localToWorld(new THREE.Vector3(wz.center[0] + sx * sz[0] / 2, wz.center[1] + sy * sz[1] / 2, wz.center[2] + sz2 * sz[2] / 2)));
  return box;
}

/* curved hull volumes only accept mounts where the bounding box actually touches the surface:
 * cylinders (axis along the ship) on the tangent band of each side face and inside the end discs,
 * spheres only around the six tangent points. */
export function shapeOk(V, face, u, v) {
  if (!V.shape) return true;
  const side = face !== "bow" && face !== "stern";
  if (V.shape === "cyl") return side ? Math.abs(u) <= 0.22 : (u * u + v * v) <= 0.55 * 0.55;
  if (V.shape === "sphere") return (u * u + v * v) <= 0.36 * 0.36;
  if (V.shape === "ring") { if (side) return Math.abs(u) <= 0.15; const r = Math.hypot(u, v); return r >= 0.62 && r <= 0.95; }
  return true;
}

export default {
  /* ================================================================ */
  /* OCCUPANCY — every placed object owns an AABB; nothing overlaps    */
  /* ================================================================ */
  occInit(root) {
    this.occ = [];
    for (const v of this.hullVols) {
      const b = new THREE.Box3(
        new THREE.Vector3(v.x - v.w / 2, v.y - v.h / 2, v.z - v.d / 2),
        new THREE.Vector3(v.x + v.w / 2, v.y + v.h / 2, v.z + v.d / 2));
      const raw = b.clone();
      b.expandByScalar(-Math.min(v.w, v.h, v.d) * 0.06);      // mounts may sit flush on the skin
      this.occ.push({ box: b, raw, tag: v.shield ? "heatshield" : "hull", vol: v });
    }
    // exhaust plumes are exclusion zones: nothing mounts inside a drive's cone aft of the nozzle
    for (const e of this.enginePods || []) {
      const reach = e.len * 3.2, spread = e.r * 2.2 + reach * Math.tan((this.driveDef.halfAngle || 12) * Math.PI / 180);
      this.occ.push({ box: new THREE.Box3().setFromCenterAndSize(new THREE.Vector3(e.x, e.y, e.exitZ + reach / 2), new THREE.Vector3(spread * 2, spread * 2, reach)), tag: "plume" });
    }
    // nose, drives, wings and loose superstructure meshes are real obstacles too
    for (const c of root.children) {
      if (c.name === "armor") { for (const m of c.children) this.occAddObject(m, "armor"); continue; }   // slab by slab, not one giant box
      if (c.isMesh || ["nose", "drives", "wings"].includes(c.name)) this.occAddObject(c, c.name || "structure");
    }
  },

  occAddObject(obj, tag) {
    const b = new THREE.Box3().setFromObject(obj);
    if (!b.isEmpty()) { const raw = b.clone(); b.expandByScalar(-Math.min(...b.getSize(new THREE.Vector3()).toArray()) * (tag === "nose" ? 0.18 : tag === "armor" ? 0.3 : 0.05)); this.occ.push({ box: b, raw, tag }); }
  },

  occFree(box, margin, ignore) {
    const t = box.clone().expandByScalar(margin);
    return !this.occ.some(o => !(ignore && ignore(o)) && o.box.intersectsBox(t));
  },

  fpBox(face, pos, fp) {
    const n = faceNormal(face);
    const c = new THREE.Vector3(pos[0] + n[0] * fp.h / 2, pos[1] + n[1] * fp.h / 2, pos[2] + n[2] * fp.h / 2);
    const sz = (face === "top" || face === "bottom") ? [fp.w, fp.h, fp.d]
             : (face === "port" || face === "star") ? [fp.h, fp.w, fp.d] : [fp.w, fp.d, fp.h];
    return new THREE.Box3().setFromCenterAndSize(c, new THREE.Vector3(sz[0], sz[1], sz[2]));
  },

  faceExtents(face, V) {
    return (face === "top" || face === "bottom") ? [V.w, V.d] : (face === "port" || face === "star") ? [V.h, V.d] : [V.w, V.h];
  },

  /* find a free spot on a face near (u,v); spirals outward if occupied */
  place(face, u, v, fp, opts = {}) {
    const V = opts.vol || this.main;
    const [uL, vL] = this.faceExtents(face, V);
    if (fp.w > uL * 1.02 || fp.d > vL * 1.02) return null;
    const uMax = Math.max(0, 1 - fp.w / uL), vMax = Math.max(0, 1 - fp.d / vL);
    // booms may overhang the leading edge (negative v = toward the bow)
    const vMin = opts.overhang ? -(1 + 0.45 * fp.d / vL) : -vMax;
    const margin = opts.margin ?? this.U * 0.07;
    const du = (fp.w + margin * 2) / uL * 1.1, dv = (fp.d + margin * 2) / vL * 1.1;
    const tryAt = (uu, vv) => {
      uu = THREE.MathUtils.clamp(uu, -uMax, uMax); vv = THREE.MathUtils.clamp(vv, vMin, vMax);
      if (!shapeOk(V, face, uu, vv)) return null;
      const pos = this.hp(face, uu, vv, V);
      const box = this.fpBox(face, pos, fp);
      // the volume we stand on is never an obstacle to what stands on it
      const ignore = (o) => o.vol === V || (opts.ignore && opts.ignore(o));
      return this.occFree(box, margin, ignore) ? { pos, box, face, u: uu, v: vv, vol: V } : null;
    };
    let r = tryAt(u, v);
    for (let ring = 1; ring <= 6 && !r; ring++) {
      const steps = 8 * ring;
      for (let k = 0; k < steps && !r; k++) {
        const a = (k / steps) * Math.PI * 2 + ring * 0.37;
        r = tryAt(u + Math.cos(a) * du * ring, v + Math.sin(a) * dv * ring);
      }
    }
    // locality failed: sweep the whole face on a footprint-sized grid
    if (!r) {
      const nu = Math.min(24, Math.max(1, Math.floor(2 * uMax / Math.max(du, 0.02)) + 1));
      const nv = Math.min(24, Math.max(1, Math.floor((vMax - vMin) / Math.max(dv, 0.02)) + 1));
      for (let i = 0; i < nu && !r; i++) for (let j = 0; j < nv && !r; j++) {
        const uu = nu === 1 ? 0 : -uMax + (2 * uMax) * (i / (nu - 1));
        const vv = nv === 1 ? 0 : vMin + (vMax - vMin) * (j / (nv - 1));
        r = tryAt(uu, vv);
      }
    }
    return r;
  },

  /* ================================================================ */
  /* LOADOUT — mount every catalog part in the manifest                */
  /* ================================================================ */
  mountLoadout(root) {
    this.mounted = []; this.unmounted = [];
    const grp = new THREE.Group(); grp.name = "modules";
    const entries = [];
    for (const [id, n] of Object.entries(this.opts.loadout || {})) {
      const p = PARTS[id];
      if (!p || p.drive || !PREFABS[p.prefab]) continue;
      for (let i = 0; i < n; i++) entries.push(p);
    }
    // mission-critical hardware first, then biggest footprints; stable tiebreak keeps seeds reproducible
    entries.sort((a, b) => (partPrio(b) - partPrio(a)) || (fpArea(b) - fpArea(a)) || a.id.localeCompare(b.id));
    this.displaced = {};
    for (const p of entries) this.mountPart(grp, p);
    root.add(grp);
  },

  mountPart(grp, p) {
    // full-size unit first; if no face has clearance, refit a compact variant before giving up
    for (const k of [1, 0.8, 0.64]) if (this.mountScaled(grp, p, k)) return true;
    // connection hardware must always fit: displace low-priority kit to make room
    if (partPrio(p) >= 3 && this.mountEvicting(grp, p)) return true;
    this.unmounted.push(p);
    return false;
  },
  mountEvicting(grp, p) {
    const pf = PREFABS[p.prefab];
    const faces = p.faces || pf.faces || ALL_FACES;
    const vols = this.mainPool && this.mainPool.length ? this.mainPool : [this.main];
    const evictable = (o) => o.mount && partPrio(o.mount.part) <= 1;
    for (const k of [1, 0.8, 0.64, 0.5]) {
      const s = this.U * (p.size || 1) * k;
      for (const face of faces) {
        const fp = pf.fp(s, p, face);
        for (const vol of vols) {
          const spot = this.place(face, 0, 0, fp, { vol, overhang: p.overhang, ignore: evictable });
          if (!spot) continue;
          const zone = spot.box.clone().expandByScalar(this.U * 0.07);
          for (const o of this.occ.filter(o => evictable(o) && o.box.intersectsBox(zone))) this.evict(o.mount, p);
          this.buildAt(grp, p, pf, s, spot, false, k);
          return true;
        }
      }
    }
    return false;
  },
  evict(m, by) {
    m.group.parent?.remove(m.group);
    this.mounted.splice(this.mounted.indexOf(m), 1);
    this.occ = this.occ.filter(o => o.mount !== m);
    this.unmounted.push(m.part);
    this.displaced[m.part.id] = (this.displaced[m.part.id] || 0) + 1;
    this.count(-4);
  },

  /* regime adapts the part before it is built: flush sensors in airflow, edge-on wings in VLEO */
  adaptPart(p) {
    const A = this.aero || {};
    let q = p;
    if (A.conformal && CONFORMAL_FLAGS[p.prefab]) q = { ...q, ...CONFORMAL_FLAGS[p.prefab] };
    if (A.edgewise && p.prefab === "array" && p.deploy) q = { ...q, edgewise: true };
    if (A.conformal && p.prefab === "array" && p.deploy) q = { ...q, stowedFp: true };
    return q;
  },
  mountScaled(grp, p0, k) {
    const p = this.adaptPart(p0);
    const pf = PREFABS[p.prefab];
    const s = this.U * (p.size || 1) * k;
    let faces = p.faces || pf.faces || ALL_FACES;
    // re-entry: nothing hangs below the shield line except the landing gear
    if (this.aero && this.aero.noVentral && !p.tags.includes("landing")) faces = faces.filter(f => f !== "bottom");
    // streamlined regimes: no equipment on the bow face (it would sit in the stagnation flow)
    if (this.aero && (this.aero.fairings) && !p.tags.includes("mining")) faces = faces.filter(f => f !== "bow");
    if (!faces.length) faces = ALL_FACES;
    const rng = this.rng;
    // doctrine bias: sensors ride high, docks and mining ride low or forward
    const bias = p.tags.includes("dock") ? ["port", "star", "bottom", "top"]
               : p.tags.includes("sensor") || p.tags.includes("comm") ? ["top", "port", "star", "bottom"] : null;
    let order = bias ? bias.filter(f => faces.includes(f)).concat(faces.filter(f => !bias.includes(f))) : faces.slice();
    // light logic: solar collectors take the sunlit faces, radiators the shaded ones — strictly, no seed rotation
    let start = rng.int(0, Math.max(0, order.length - 1));
    if (p.sun === "seek") { order = faces.slice().sort((a, b) => sunExposure(b) - sunExposure(a)); start = 0; }
    if (p.sun === "avoid") { order = faces.slice().sort((a, b) => sunExposure(a) - sunExposure(b)); start = 0; }
    const vols = this.mainPool && this.mainPool.length ? this.mainPool : [this.main];
    // wings ride the outer edge of the flank (u toward the sunlit / shaded edge) so nothing dorsal shades them
    const u0 = p.sun === "seek" ? 0.6 : p.sun === "avoid" ? -0.6 : rng.range(-0.75, 0.75);
    // streamlined hulls keep tall kit aft, in the lee of the nose; everything else may sit anywhere
    const tall = pf.fp(s, p, faces[0]).h > this.U * 1.2;
    const v0 = p.overhang ? -0.85 : (this.aero && this.aero.fairings && tall) ? rng.range(0.15, 0.8) : rng.range(-0.75, 0.75);
    const blockers = [];
    try {
      for (let fi = 0; fi < order.length; fi++) {
        const face = order[(start + fi) % order.length];
        const fp = pf.fp(s, p, face);
        for (const vol of vols) {
          // a part with a work zone (drill) may need several tries: its zone must not swallow other kit
          for (let attempt = 0; attempt < 6; attempt++) {
            const spot = this.place(face, u0, v0, fp, { vol, overhang: p.overhang });
            if (!spot) break;
            const mount = this.buildAt(grp, p, pf, s, spot, false, k);
            if (!this.zoneClear(mount)) {
              this.unbuild(mount);
              blockers.push({ box: spot.box, tag: "blocked" }); this.occ.push(blockers[blockers.length - 1]);
              continue;
            }
            if (p.mirror && (face === "port" || face === "star")) {
              const twin = this.place(face === "port" ? "star" : "port", spot.u, spot.v, fp, { vol, overhang: p.overhang });
              if (twin) { const tm = this.buildAt(grp, p, pf, s, twin, true, k); if (!this.zoneClear(tm)) this.unbuild(tm); }
            }
            return true;
          }
        }
      }
      return false;
    } finally {
      if (blockers.length) this.occ = this.occ.filter(o => !blockers.includes(o));
    }
  },
  /* true when the mount's work zone (if any) touches no other mounted part */
  zoneClear(mount) {
    const zone = this.occ.find(o => o.tag === "workzone" && o.mount === mount);
    if (!zone) return true;
    return !this.occ.some(o => o.mount && o.mount !== mount && o.tag !== "workzone" && o.box.intersectsBox(zone.box));
  },
  unbuild(mount) {
    mount.group.parent?.remove(mount.group);
    this.mounted.splice(this.mounted.indexOf(mount), 1);
    this.occ = this.occ.filter(o => o.mount !== mount);
    this.count(-4);
  },
  buildAt(grp, p, pf, s, spot, mirror, k = 1) {
    const n = faceNormal(spot.face), e = faceEuler(spot.face);
    const g = new THREE.Group(); g.name = p.id;
    g.position.set(spot.pos[0] + n[0] * s * 0.01, spot.pos[1] + n[1] * s * 0.01, spot.pos[2] + n[2] * s * 0.01);
    g.rotation.set(e[0], e[1], e[2]);
    g.userData.part = { id: p.id, face: spot.face, mirror, compact: k < 1, flush: !!p.flush, edgewise: !!p.edgewise };
    pf.build(g, s, p, this, new RNG(this.rng.int(1, 1e9)));
    grp.add(g);
    const mount = { part: PARTS[p.id] || p, face: spot.face, box: spot.box, mirror, group: g, compact: k < 1, flush: !!p.flush, edgewise: !!p.edgewise };
    this.occ.push({ box: spot.box, tag: p.id, mount });
    this.mounted.push(mount);
    // parts that need clear space around them (drill cutting envelope) reserve it as an obstacle
    const wz = g.userData.workzone;
    if (wz) this.occ.push({ box: workzoneBox(g, wz), tag: "workzone", mount });
    this.count(4);
    return mount;
  }
};
