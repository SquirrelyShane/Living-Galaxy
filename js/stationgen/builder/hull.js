/* Hull grammars — the bones a station's modules hang on.
 *
 * Every style lays its long axis along +Z: command end at −Z (zone 0),
 * power end at +Z (zone 1). Each returns the structure it drew plus the
 * slot list the placement solver fills and the AABBs it must not intrude on.
 *
 *   spindle    a pressurised spine, one rotating ring, a boom past the power end
 *   torus      a wide ring on spokes about a short hub — the agricultural classic
 *   lattice    an open truss keel with a small pressurised core; everything bolts on
 *   cross      a hub with radial arms in the plane, nodes at the tips
 *   drum       a long spine carrying the Tier III habitat drum amidships
 *   cluster    pressurised pods on a despun mast, joined by tubes
 *   cathedral  a nave with aisles, flying buttresses, a transept, a crossing spire,
 *              twin west towers and a rose window over the great door — the hangar
 *   bastion    an armoured octagonal core with a citadel belt, star-fort arms with
 *              faceted bastions at the tips, and a prow for the spinal gun
 *   ziggurat   a stepped hulk of welded holds, terraces on every face
 *
 * Spines are drawn *after* placement so a recessed hangar can notch the
 * skin and a throat can trim the end. A ring or a drum is added to any
 * style when the manifest calls for one. Every grammar rolls its own
 * proportions and counts, so no two hulls of a style match. */
import * as THREE from "three";
import { G, latheOf, addMesh, trussGeometry, extrude, extrudeOwned, archOutline, bittenDisc, instanced } from "../core/geometry.js";
import { slot } from "./frames.js";
import { vaultGeo, ribGeo } from "../prefabs/forms.js";

const V = (x, y, z) => new THREE.Vector3(x, y, z);
const Z = V(0, 0, 1);
const PI = Math.PI, H = PI / 2;

/* ---- shared pieces ------------------------------------------------------- */

/** A pressurised spine along Z: segments with bulkhead rings, and grid slots on its skin.
 * Drawing is deferred (B.deferred) so hangars placed on it can notch or trim it. */
function spine(B, root, R, L, z0, opts = {}) {
  const { mats, rng } = B;
  const g = new THREE.Group(); g.name = "spine"; root.add(g);
  const form = opts.form ?? B.styleArch.spine ?? "plain";
  const seg = Math.max(2, Math.round(L / rng.range(32, 48)));
  const segL = L / seg;
  const desc = { R, L, z0, form, notches: [], trim: { lo: 0, hi: 0 }, zc: z0 + L / 2 };
  const own = new THREE.Box3(V(-R, -R, z0), V(R, R, z0 + L));
  B.occ.push(own);
  /* per-segment looks rolled now (deterministic), drawn later */
  const segs = [];
  for (let i = 0; i < seg; i++) segs.push({ r: form === "welded" ? R * rng.range(0.86, 1.08) : form === "banded" ? R * (i % 2 ? 0.94 : 1) : R, mat: form === "welded" ? rng.pick([mats.hull, mats.panel, mats.hull, mats.dark]) : i % 3 === 1 ? mats.panel : mats.hull });
  B.deferred.push(() => {
    const zStart = z0 + desc.trim.lo, zEnd = z0 + L - desc.trim.hi;
    const sides = form === "armoured" ? 8 : form === "ribbed" ? 12 : 28;
    for (let i = 0; i < seg; i++) {
      const a = z0 + segL * i, b = a + segL;
      const s = segs[i];
      /* split the segment where notches start and end, so a bite is exactly as long as its bay */
      const cuts = [Math.max(a, zStart), Math.min(b, zEnd)];
      for (const n of desc.notches) for (const c of [n.z0, n.z1]) if (c > cuts[0] && c < cuts[cuts.length - 1]) cuts.push(c);
      cuts.sort((p, q) => p - q);
      for (let k = 0; k + 1 < cuts.length; k++) {
        const lo = cuts[k], hi = cuts[k + 1];
        if (hi - lo < 1.5) continue;
        const zc = (lo + hi) / 2, len = hi - lo;
        const bites = desc.notches.filter((n) => n.z0 < hi - 0.5 && n.z1 > lo + 0.5);
        if (bites.length) {
          const geo = extrudeOwned(bittenDisc(s.r, bites.map((n) => ({ a: n.a, w: n.w, sink: n.sink })), sides === 8 ? 8 : 48), len, [], { curveSegments: 4 });
          addMesh(g, geo, s.mat, 0, 0, zc, 0, 0, 0, 1, 1, 1);
        } else addMesh(g, G.cyl(sides), s.mat, 0, 0, zc, H, form === "armoured" ? PI / 8 : 0, 0, s.r, len * 0.985, s.r);
        B.count();
      }
      if (a >= zStart && a <= zEnd && !desc.notches.some((n) => n.z0 < a && n.z1 > a)) addMesh(g, form === "armoured" ? G.cyl(8) : G.torus(0.04, 8, 40), mats.dark, 0, 0, a, form === "armoured" ? H : 0, form === "armoured" ? PI / 8 : 0, 0, R * 1.03, form === "armoured" ? 2.2 : R * 1.03, R * 1.03);
      const zc = (a + b) / 2, len = segL;
      if (desc.notches.some((n) => n.z0 < b && n.z1 > a)) continue;
      /* style dressing along the segment */
      if (form === "ribbed") for (let k = 0; k < 6; k++) { const t = (k / 6) * PI * 2; addMesh(g, G.box(), mats.dark, Math.cos(t) * s.r, Math.sin(t) * s.r, zc, 0, 0, t, 1.6, 2.4, len * 0.9); }
      if (form === "armoured" && i % 2 === 0) addMesh(g, G.cyl(8), mats.armour, 0, 0, zc, H, PI / 8, 0, s.r * 1.06, len * 0.5, s.r * 1.06);
      if (form === "welded" && rng.chance(0.6)) addMesh(g, G.box(), rng.pick([mats.panel, mats.cargo, mats.dark]), Math.cos(i) * s.r, Math.sin(i) * s.r, zc, 0, 0, i, 1, rng.range(6, 14), rng.range(8, 20));
      if (form === "banded" && i % 2) addMesh(g, G.torus(0.006, 4, 64), mats.window, 0, 0, zc, 0, 0, 0, s.r * 1.005, s.r * 1.005, s.r * 1.005);
    }
    addMesh(g, G.torus(0.04, 8, 40), mats.dark, 0, 0, zEnd, 0, 0, 0, R * 1.03, R * 1.03, R * 1.03);
  });
  /* skin slots: rows along Z, spokes around */
  const around = opts.around ?? Math.max(6, Math.min(12, Math.round(R / 4)));
  const rows = Math.max(3, Math.round(L / 34));
  for (let i = 0; i < rows; i++) {
    const z = z0 + L * ((i + 0.5) / rows);
    const off = (i % 2) * (PI / around);
    for (let k = 0; k < around; k++) {
      const a = off + (k / around) * PI * 2;
      const n = V(Math.cos(a), Math.sin(a), 0);
      B.slots.push(slot("spine", n.clone().multiplyScalar(R * 0.98).setZ(z), n, Z, B.zoneOf(z), { width: (2 * PI * R) / around, owner: own, spine: desc }));
    }
  }
  desc.own = own;
  return desc;
}

/** A spin ring at z: torus + spokes + a hub collar. Slots on the outer rim (ring) and rim faces. */
function ring(B, root, R, tube, z, spokes = 6) {
  const { mats, rng } = B;
  const g = new THREE.Group(); g.name = "ring"; g.position.z = z; root.add(g);
  g.userData.spin = { axis: "z", speed: Math.sqrt(9.81 / R) * 0.35 * rng.pick([1, -1]) };
  const armoured = B.styleArch.forms.keep > 2;
  const sides = armoured ? 16 : 72;
  addMesh(g, G.torus(tube / R, armoured ? 8 : 14, sides), armoured ? mats.armour : mats.hull, 0, 0, 0, 0, 0, 0, R, R, R);
  addMesh(g, G.torus((tube * 0.35) / (R + tube * 0.9), 8, sides), mats.accent, 0, 0, 0, 0, 0, 0, R + tube * 0.9, R + tube * 0.9, R + tube * 0.9);
  const spokeKind = rng.pick(["cyl", "truss", "cyl", "paired"]);
  for (let i = 0; i < spokes; i++) {
    const a = (i / spokes) * PI * 2;
    const len = R - tube * 0.5;
    if (spokeKind === "truss") addMesh(g, trussGeometry(Math.max(4, Math.round(len / 14)), (tube * 0.5) / len, 0.5 / len), mats.truss, Math.cos(a) * len * 0.5, Math.sin(a) * len * 0.5, 0, 0, 0, a + H, len, len, len);
    else if (spokeKind === "paired") for (const s of [-1, 1]) addMesh(g, G.cyl(8), mats.dark, Math.cos(a) * len * 0.5 - Math.sin(a) * s * tube * 0.35, Math.sin(a) * len * 0.5 + Math.cos(a) * s * tube * 0.35, 0, 0, 0, a + H, tube * 0.14, len, tube * 0.14);
    else addMesh(g, G.cyl(10), mats.dark, Math.cos(a) * len * 0.5, Math.sin(a) * len * 0.5, 0, 0, 0, a + H, tube * 0.28, len, tube * 0.28);
    B.count();
  }
  addMesh(g, G.cyl(24), mats.panel, 0, 0, 0, H, 0, 0, tube * 1.6, tube * 2.2, tube * 1.6);
  B.count(spokes + 3);
  /* occupancy: the rim as four boxes, so the middle (spokes only) stays free for the spine's own business */
  const own = new THREE.Box3(V(-R - tube, R - tube, z - tube), V(R + tube, R + tube, z + tube));
  B.occ.push(own, new THREE.Box3(V(-R - tube, -R - tube, z - tube), V(R + tube, -R + tube, z + tube)), new THREE.Box3(V(R - tube, -R, z - tube), V(R + tube, R, z + tube)), new THREE.Box3(V(-R - tube, -R, z - tube), V(-R + tube, R, z + tube)));
  const rimOwner = (a) => { const c = Math.cos(a), sn = Math.sin(a); return Math.abs(sn) > Math.abs(c) ? (sn > 0 ? B.occ[B.occ.length - 4] : B.occ[B.occ.length - 3]) : (c > 0 ? B.occ[B.occ.length - 2] : B.occ[B.occ.length - 1]); };
  B.anim.spins.push(g);
  const n = Math.max(8, Math.round(R / 9));
  for (let i = 0; i < n; i++) {
    const a = (i / n) * PI * 2;
    const nrm = V(Math.cos(a), Math.sin(a), 0);
    const pos = nrm.clone().multiplyScalar(R + tube * 0.95).setZ(z);
    const tangent = V(-Math.sin(a), Math.cos(a), 0);
    B.slots.push(slot("ring", pos, nrm, tangent, B.zoneOf(z), { width: (2 * PI * R) / n, parent: g, local: { z }, owner: rimOwner(a) }));
  }
  return g;
}

/** A truss boom along Z from z0 for length L, with slots on all four faces. */
function boom(B, root, z0, L, width = 10, name = "boom") {
  const { mats } = B;
  const g = new THREE.Group(); g.name = name; root.add(g);
  const bays = Math.max(4, Math.round(L / 10));
  addMesh(g, trussGeometry(bays, width / L, 0.4 / L), mats.truss, 0, 0, z0 + L / 2, H, 0, 0, L, L, L);
  B.count();
  const own = new THREE.Box3(V(-width / 2, -width / 2, z0), V(width / 2, width / 2, z0 + L));
  B.occ.push(own);
  const rows = Math.max(2, Math.round(L / 45));
  for (let i = 0; i < rows; i++) {
    const z = z0 + L * ((i + 0.5) / rows);
    for (const [nx, ny] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const n = V(nx, ny, 0);
      B.slots.push(slot("truss", n.clone().multiplyScalar(width / 2).setZ(z), n, Z, B.zoneOf(z), { width: 70, owner: own }));
    }
  }
  return g;
}

/** A radial arm from the axis in the XY plane at angle a, out to length L, with slots along its top/bottom. */
function arm(B, root, a, L, z, width = 12, o = {}) {
  const { mats, rng } = B;
  const dir = V(Math.cos(a), Math.sin(a), 0);
  const g = new THREE.Group(); g.name = "arm"; root.add(g);
  if (o.solid) {
    /* a wedge arm: a tapered armoured box */
    addMesh(g, G.frustum(0.6, 4), mats.armour, dir.x * L * 0.5, dir.y * L * 0.5, z, 0, 0, a - H, width * 0.95, L, width * 0.95);   // a diamond section: sloped faces
  } else {
    const bays = Math.max(4, Math.round(L / 12));
    addMesh(g, trussGeometry(bays, width / L, 0.45 / L), mats.truss, dir.x * L * 0.5, dir.y * L * 0.5, z, 0, 0, a - H, L, L, L);
  }
  B.count();
  const tip = dir.clone().multiplyScalar(L).setZ(z);
  const node = o.node ?? rng.pick(["sphere", "sphere", "faceted", "pod"]);
  if (node === "faceted") addMesh(g, G.ico(1), mats.armour, tip.x, tip.y, tip.z, 0, 0, a, width * 1.2, width * 1.2, width * 1.2);
  else if (node === "pod") addMesh(g, latheOf(rng, "pod", 16), mats.hull, tip.x, tip.y, tip.z, 0, 0, a - H, width * 1.1, width * 2.2, width * 1.1);
  else addMesh(g, G.sphere(14, 10), mats.hull, tip.x, tip.y, tip.z, 0, 0, 0, width * 1.1, width * 1.1, width * 1.1);
  /* occupancy in short lengths along the arm, so a diagonal arm does not fence off the whole quadrant */
  const r0 = o.from ?? 0;
  const segs = Math.max(1, Math.ceil((L - r0) / 45));
  let own = null;
  for (let i = 0; i < segs; i++) {
    const a0 = dir.clone().multiplyScalar(r0 + ((L - r0) * i) / segs).setZ(z), a1 = dir.clone().multiplyScalar(r0 + ((L - r0) * (i + 1)) / segs).setZ(z);
    const box = new THREE.Box3().setFromPoints([a0, a1]).expandByVector(V(width * 0.8, width * 0.8, width));
    B.occ.push(box);
    own = box;
  }
  const tipBox = new THREE.Box3().setFromCenterAndSize(tip, V(width * 2.4, width * 2.4, width * 2.4));
  B.occ.push(tipBox);
  const n = Math.max(2, Math.round(L / 55));
  for (let i = 0; i < n; i++) {
    const t = (i + 0.6) / (n + 0.2);
    const p = dir.clone().multiplyScalar(L * t).setZ(z);
    for (const nrm of [Z, Z.clone().negate()]) B.slots.push(slot("arm", p.clone().add(nrm.clone().multiplyScalar(width / 2)), nrm, dir, B.zoneOf(z), { width: 50, owner: own }));
  }
  B.slots.push(slot("end", tip.clone().add(dir.clone().multiplyScalar(width * 1.2)), dir, Z, B.zoneOf(z), { width: 40, tip: true, owner: tipBox, hard: o.hard }));
  if (o.hard) for (const nrm of [Z, Z.clone().negate()]) B.slots.push(slot("surface", tip.clone().add(nrm.clone().multiplyScalar(width * 1.2)), nrm, dir, B.zoneOf(z), { width: 30, owner: tipBox, hard: true }));
  return g;
}

/** End caps: a slot facing straight along the axis at each end. */
function endSlots(B, zMin, zMax, R, sp = null) {
  const lo = sp && Math.abs(sp.z0 - zMin) < 5 ? sp : null, hi = sp && Math.abs(sp.z0 + sp.L - zMax) < 5 ? sp : null;
  B.slots.push(slot("end", V(0, 0, zMin - 1), Z.clone().negate(), V(0, 1, 0), 0, { width: R * 2.2, cap: true, owner: B.occ[0], spine: lo }));
  B.slots.push(slot("end", V(0, 0, zMax + 1), Z, V(0, 1, 0), 1, { width: R * 2.2, cap: true, owner: B.occ[B.occ.length - 1], spine: hi }));
}

/* ---- styles ---------------------------------------------------------------- */

export const STYLES = {
  spindle(B, root, needs) {
    const { rng } = B;
    const L = B.L, R = B.R;
    const z0 = -L / 2;
    const spineL = L * rng.range(0.7, 0.84);
    const sp = spine(B, root, R, spineL, z0);
    const zRing = z0 + L * rng.range(0.28, 0.42);
    if (needs.ring) ring(B, root, R * rng.range(3.2, 4), R * 0.55, zRing, rng.int(5, 8));
    if (needs.drum) B.drumSlot = { z: z0 + L * 0.34, R };
    boom(B, root, z0 + spineL, L - spineL, R * rng.range(0.5, 0.7));
    if (rng.chance(0.4)) { /* a keel fin */ const zf = z0 + spineL * 0.5; addMesh(root, G.box(), B.mats.panel, 0, -R * 1.2, zf, 0, 0, 0, 3, R * 0.8, spineL * 0.4); B.occ.push(new THREE.Box3(V(-2, -R * 1.6, zf - spineL * 0.2), V(2, -R, zf + spineL * 0.2))); }
    endSlots(B, z0, z0 + L, R, sp);
  },
  torus(B, root, needs) {
    const { rng } = B;
    const L = B.L * 0.7, R = B.R * 0.9;
    const z0 = -L / 2;
    const sp = spine(B, root, R, L, z0, { around: 8 });
    const big = Math.max(B.L * rng.range(0.26, 0.34), R * 4.5);
    ring(B, root, big, R * rng.range(0.7, 0.9), z0 + L * rng.range(0.36, 0.48), rng.int(6, 10));
    if (needs.ring) ring(B, root, big * 0.62, R * 0.5, z0 + L * 0.62, 6);
    if (needs.drum) B.drumSlot = { z: z0 + L * 0.2, R };
    boom(B, root, z0 + L, B.L * 0.18, R * 0.5);
    endSlots(B, z0, z0 + L + B.L * 0.18, R, sp);
  },
  lattice(B, root, needs) {
    const { rng } = B;
    const L = B.L * 1.15, w = B.R * 1.3;
    const z0 = -L / 2;
    boom(B, root, z0, L, w, "keel");
    const { mats } = B;
    const planes = rng.int(2, 3);
    for (let i = 0; i < planes; i++) {
      const zc = z0 + L * (0.5 + 0.34 * i / Math.max(1, planes - 1));
      const span = w * rng.range(5.5, 8);
      const rz = i % 2 ? H : rng.pick([H, 0, PI / 4]);
      addMesh(root, trussGeometry(10, w * 0.6 / span, 0.4 / span), mats.truss, 0, 0, zc, 0, 0, rz, span, span, span);
      const ax = V(Math.cos(rz + H), Math.sin(rz + H), 0), nrm0 = V(-Math.sin(rz + H), Math.cos(rz + H), 0);
      const own = new THREE.Box3().setFromPoints([ax.clone().multiplyScalar(span / 2).setZ(zc - w * 0.3), ax.clone().multiplyScalar(-span / 2).setZ(zc + w * 0.3)]).expandByVector(V(w * 0.3, w * 0.3, 0));
      B.occ.push(own);
      for (const s of [-1, 1]) for (const nrm of [nrm0, nrm0.clone().negate()]) B.slots.push(slot("truss", ax.clone().multiplyScalar(s * span * 0.32).add(nrm.clone().multiplyScalar(w * 0.3)).setZ(zc), nrm, Z, B.zoneOf(zc), { width: 60, owner: own }));
      B.count();
    }
    const sp = spine(B, root, B.R * 0.85, L * 0.28, z0 + L * 0.12, { around: 8 });
    if (needs.ring) ring(B, root, B.R * 3.2, B.R * 0.5, z0 + L * 0.3, 6);
    if (needs.drum) B.drumSlot = { z: z0 + L * 0.3, R: B.R * 0.85 };
    endSlots(B, z0, z0 + L, w, sp);
  },
  cross(B, root, needs) {
    const { rng } = B;
    const L = B.L * 0.6, R = B.R * 1.15;
    const z0 = -L / 2;
    const sp = spine(B, root, R, L, z0, { around: 8 });
    const armL = B.L * rng.range(0.45, 0.6);
    const zArms = z0 + L * (needs.drum ? 0.78 : rng.range(0.4, 0.6));
    const arms = rng.pick([3, 4, 4, 5, 6]);
    const off = rng.range(0, PI * 2);
    for (let i = 0; i < arms; i++) arm(B, root, (i / arms) * PI * 2 + off, armL * (arms > 4 ? 0.85 : 1), zArms, R * 0.55, { from: R * 0.9 });
    if (needs.ring) ring(B, root, armL * 0.55, R * 0.45, zArms + R * 1.6, 8);
    if (needs.drum) B.drumSlot = { z: z0 + L * 0.3, R };
    boom(B, root, z0 + L, B.L * 0.3, R * 0.5);
    endSlots(B, z0, z0 + L + B.L * 0.3, R, sp);
  },
  drum(B, root, needs) {
    /* without the drum to carry, the spine is a fatter city core */
    const L = B.L * 1.6, R = B.R * (needs.drum ? 0.8 : 1.4);
    const z0 = -L / 2;
    const sp = spine(B, root, R, L * 0.82, z0, { around: needs.drum ? undefined : 10 });
    B.drumSlot = { z: z0 + L * 0.4, R };
    if (needs.ring && !needs.drum) ring(B, root, R * 3.6, R * 0.55, z0 + L * 0.36, 6);
    boom(B, root, z0 + L * 0.82, L * 0.18, R * 0.6);
    endSlots(B, z0, z0 + L, R, sp);
  },
  cluster(B, root, needs) {
    const L = B.L * 0.95, R = B.R * 0.7;
    const z0 = -L / 2;
    const { mats, rng } = B;
    boom(B, root, z0, L, R * 0.9, "mast");
    const n = 4 + rng.int(0, 3);
    const podKind = B.styleArch.forms.faceted > 2 ? "faceted" : B.styleArch.forms.barrel > 2 ? "pod" : rng.pick(["sphere", "sphere", "faceted", "pod"]);
    for (let i = 0; i < n; i++) {
      const a = (i / n) * PI * 2 + rng.range(-0.2, 0.2);
      const z = z0 + L * (0.25 + 0.5 * (i / Math.max(1, n - 1)));
      const rs = R * rng.range(1.6, 2.4);
      const d = rs + R * 1.4;
      const c = V(Math.cos(a) * d, Math.sin(a) * d, z);
      if (podKind === "faceted") addMesh(root, G.ico(rng.pick([1, 2])), mats.hull, c.x, c.y, c.z, rng.range(0, 1), rng.range(0, 1), 0, rs, rs, rs);
      else if (podKind === "pod") addMesh(root, latheOf(rng, rng.pick(["pod", "tank", "drum"]), 20), mats.hull, c.x, c.y, c.z, H, 0, 0, rs, rs * rng.range(1.4, 2.2), rs);
      else addMesh(root, G.sphere(20, 14), mats.hull, c.x, c.y, c.z, 0, 0, 0, rs, rs, rs);
      addMesh(root, G.torus(0.05, 8, 40), mats.dark, c.x, c.y, c.z, H, 0, 0, rs * 1.01, rs * 1.01, rs * 1.01);
      addMesh(root, G.cyl(10), mats.panel, c.x * 0.5, c.y * 0.5, z, 0, 0, a + H, R * 0.35, d, R * 0.35);
      B.count(3);
      const own = new THREE.Box3(c.clone().subScalar(rs), c.clone().addScalar(rs));
      B.occ.push(own);
      for (let k = 0; k < 7; k++) {
        const t = (k / 7) * PI * 2 + a;
        const nrm = V(Math.cos(a) * 0.8 + Math.cos(t) * 0.5, Math.sin(a) * 0.8 + Math.sin(t) * 0.5, (k % 2 ? 0.5 : -0.5)).normalize();
        B.slots.push(slot("surface", c.clone().add(nrm.clone().multiplyScalar(rs * 0.97)), nrm, Z, B.zoneOf(z), { width: rs * 0.9, owner: own }));
      }
    }
    if (needs.ring) ring(B, root, R * 4, R * 0.55, z0 + L * 0.5, 6);
    if (needs.drum) B.drumSlot = { z: z0 + L * 0.5, R };
    endSlots(B, z0, z0 + L, R);
  },

  /* the cathedral: nave, aisles, buttresses, transept, crossing spire, west towers, rose, apse */
  cathedral(B, root, needs) {
    const { mats, rng } = B;
    const L = B.L * 1.1, R = B.R;
    const W = Math.max(150, R * rng.range(2.6, 3.2)), Hn = Math.max(190, R * rng.range(3.8, 4.6));   // nave section: always wide enough for the great door
    const Ln = L * 0.72, z0 = -L / 2;
    const nave = { W, H: Hn, z0, L: Ln, trim: { lo: 0, hi: 0 }, notches: [], R: W / 2, zc: z0 + Ln / 2, notchable: false };
    const naveOwn = new THREE.Box3(V(-W / 2, -Hn / 2, z0), V(W / 2, Hn / 2, z0 + Ln));
    B.occ.push(naveOwn);
    /* the nave body is drawn after placement so the great door (a throat hangar) can trim it */
    B.deferred.push(() => {
      const zs = z0 + nave.trim.lo, ze = z0 + Ln - nave.trim.hi, len = ze - zs;
      addMesh(root, vaultGeo("pointed"), mats.hull, 0, -Hn / 2, (zs + ze) / 2, 0, 0, 0, W, Hn, len);
      const ribs = Math.max(4, Math.round(len / rng.range(24, 34)));
      for (let i = 0; i <= ribs; i++) {
        const z = zs + (len * i) / ribs;
        addMesh(root, ribGeo("pointed", 0.05), mats.dark, 0, -Hn / 2 - Hn * 0.02, z, 0, 0, 0, W * 1.06, Hn * 1.05, 3);
        /* flying buttresses: a pier out from each aisle and a strut up to the clerestory */
        for (const s of [-1, 1]) {
          const px = s * (W / 2 + Wa + Hn * 0.12);
          addMesh(root, G.box(), mats.panel, px, -Hn / 2 + Hn * 0.2, z, 0, 0, 0, 4, Hn * 0.55, 6);
          addMesh(root, G.cone(4), mats.dark, px, -Hn / 2 + Hn * 0.5, z, 0, PI / 4, 0, 4, 8, 4);
          const x1 = s * W / 2, y1 = Hn * 0.18, x0 = px, y0 = -Hn / 2 + Hn * 0.45;
          addMesh(root, G.box(), mats.panel, (x0 + x1) / 2, (y0 + y1) / 2, z, 0, 0, Math.atan2(-(x1 - x0), y1 - y0), 2.4, Math.hypot(x1 - x0, y1 - y0), 4);
        }
        B.count(7);
      }
      /* window bands along the clerestory: lit, pointed */
      const win = extrude("win:pointed", archOutline("pointed", 1, 1), 1, [], { curveSegments: 6 });
      const n = Math.floor(len / 9);
      for (let i = 0; i < n; i++) for (const s of [-1, 1]) addMesh(root, win, rng.chance(0.9) ? mats.window : mats.dark, s * (W / 2 - 0.5), Hn * 0.05, zs + 9 * (i + 0.5), 0, s * H, 0, 4, 10, 1.4);
      B.count(n * 2);
    });
    /* aisles: lower round vaults along both sides */
    const Wa = R * rng.range(1.0, 1.4), Ha = Hn * 0.42;
    for (const s of [-1, 1]) {
      addMesh(root, vaultGeo("round"), mats.panel, s * (W / 2 + Wa / 2), -Hn / 2, z0 + Ln / 2, 0, 0, 0, Wa, Ha, Ln);
      const own = new THREE.Box3(V(s > 0 ? W / 2 : -W / 2 - Wa, -Hn / 2, z0), V(s > 0 ? W / 2 + Wa : -W / 2, -Hn / 2 + Ha, z0 + Ln));
      B.occ.push(own);
      const rows = Math.max(3, Math.round(Ln / 60));
      for (let i = 0; i < rows; i++) { const z = z0 + Ln * ((i + 0.5) / rows); B.slots.push(slot("spine", V(s * (W / 2 + Wa / 2), -Hn / 2 + Ha, z), V(0, 1, 0), Z, B.zoneOf(z), { width: Wa * 0.9, owner: own })); }
      B.count();
    }
    /* nave roof ridge and floor: rows of big slots; clerestory walls: side slots */
    const rows = Math.max(4, Math.round(Ln / 50));
    for (let i = 0; i < rows; i++) {
      const z = z0 + Ln * ((i + 0.5) / rows);
      B.slots.push(slot("spine", V(0, Hn / 2, z), V(0, 1, 0), Z, B.zoneOf(z), { width: W * 0.7, owner: naveOwn, spine: nave }));
      B.slots.push(slot("spine", V(0, -Hn / 2, z), V(0, -1, 0), Z, B.zoneOf(z), { width: W * 0.9, owner: naveOwn, spine: nave }));
      if (i % 2) for (const s of [-1, 1]) B.slots.push(slot("surface", V(s * W / 2, Hn * 0.25, z), V(s, 0, 0), Z, B.zoneOf(z), { width: Hn * 0.3, owner: naveOwn }));
    }
    /* transept across the nave, and the crossing: a lantern with spires both ways */
    const zc = z0 + Ln * rng.range(0.58, 0.7), Wt = W * 0.9, Ht = Hn * 0.92, Lt = W * rng.range(2.4, 3.2);
    addMesh(root, vaultGeo("pointed"), mats.hull, 0, -Ht / 2, zc, 0, H, 0, Wt, Ht, Lt);
    const tOwn = new THREE.Box3(V(-Lt / 2, -Ht / 2, zc - Wt / 2), V(Lt / 2, Ht / 2, zc + Wt / 2));
    B.occ.push(tOwn);
    for (const s of [-1, 1]) {
      addMesh(root, ribGeo("pointed", 0.05), mats.dark, s * Lt * 0.5, -Ht / 2 - Ht * 0.02, zc, 0, s * H, 0, Wt * 1.06, Ht * 1.05, 3);
      B.slots.push(slot("end", V(s * (Lt / 2 + 1), 0, zc), V(s, 0, 0), Z, B.zoneOf(zc), { width: Wt * 0.9, owner: tOwn, hard: true }));
      for (const sy of [-1, 1]) B.slots.push(slot("spine", V(s * Lt * 0.3, sy * Ht / 2, zc), V(0, sy, 0), V(1, 0, 0), B.zoneOf(zc), { width: Wt * 0.7, owner: tOwn }));
    }
    const lr = W * rng.range(0.26, 0.34);
    for (const sy of [-1, 1]) {
      addMesh(root, G.cyl(8), mats.hull, 0, sy * (Hn / 2 + lr * 0.6), zc, sy > 0 ? 0 : PI, 0, 0, lr, lr * 1.2, lr);
      addMesh(root, G.cyl(8), mats.window, 0, sy * (Hn / 2 + lr * 0.8), zc, 0, 0, 0, lr * 1.02, lr * 0.25, lr * 1.02);
      const sh = Hn * rng.range(0.7, 1.1);
      addMesh(root, G.cone(8), mats.panel, 0, sy * (Hn / 2 + lr * 1.2 + sh / 2), zc, sy > 0 ? 0 : PI, 0, 0, lr * 1.15, sh, lr * 1.15);
      B.lamp(root, 0, sy * (Hn / 2 + lr * 1.2 + sh + 1), zc, B.styleArch.lampColor, "pulse", 3);
      B.count(3);
    }
    B.occ.push(new THREE.Box3(V(-lr * 1.2, -Hn / 2 - lr * 1.2 - Hn * 1.1, zc - lr * 1.2), V(lr * 1.2, Hn / 2 + lr * 1.2 + Hn * 1.1, zc + lr * 1.2)));
    /* west front: twin towers flanking the great door, a rose window above it */
    const tw = R * rng.range(0.9, 1.2), th = Hn * rng.range(1.15, 1.4);
    for (const s of [-1, 1]) {
      const x = s * (W / 2 + tw * 0.5 + 2);
      addMesh(root, rng.chance(0.5) ? G.box() : G.cyl(8), mats.hull, x, 0, z0 + tw * 0.5, 0, 0, 0, tw, th, tw);
      for (const sy of [-1, 1]) { addMesh(root, G.cone(8), mats.panel, x, sy * (th / 2 + Hn * 0.35), z0 + tw * 0.5, sy > 0 ? 0 : PI, 0, 0, tw * 0.6, Hn * 0.7, tw * 0.6); B.lamp(root, x, sy * (th / 2 + Hn * 0.7 + 1), z0 + tw * 0.5, "#ff4a5a", "blink", 3); }
      const own = new THREE.Box3(V(x - tw / 2, -th / 2 - Hn * 0.7, z0), V(x + tw / 2, th / 2 + Hn * 0.7, z0 + tw));
      B.occ.push(own);
      for (const sy of [-1, 1]) B.slots.push(slot("surface", V(x, sy * (th / 2 + Hn * 0.7), z0 + tw * 0.5), V(0, sy, 0), Z, 0, { width: tw * 0.6, owner: own }));
      B.slots.push(slot("surface", V(x + s * tw / 2, 0, z0 + tw * 0.5), V(s, 0, 0), Z, 0, { width: tw * 0.8, owner: own }));
      B.count(3);
    }
    const rr = W * 0.22;
    addMesh(root, G.torus(0.12, 8, 32), mats.glow, 0, Hn * 0.28, z0 - 0.5, 0, 0, 0, rr, rr, rr);
    for (let i = 0; i < 8; i++) addMesh(root, G.box(), mats.glow, 0, Hn * 0.28, z0 - 0.5, 0, 0, (i / 8) * PI, rr * 1.9, 0.5, 0.4);
    B.count(9);
    /* the great west door: the nave's own end slot, marked so the hangar bores in as a throat */
    B.slots.push(slot("end", V(0, 0, z0 - 1), Z.clone().negate(), V(0, 1, 0), 0, { width: W, cap: true, owner: naveOwn, nave: { W: W * 0.93, H: Hn * 0.96 }, spine: nave }));
    /* apse and the power boom behind it */
    addMesh(root, G.dome(24), mats.hull, 0, 0, z0 + Ln, H, 0, 0, W / 2, W / 2, Hn / 2);
    B.occ.push(new THREE.Box3(V(-W / 2, -Hn / 2, z0 + Ln), V(W / 2, Hn / 2, z0 + Ln + W / 2)));
    /* the halo: a ring about the apse; a Tier III drum sits behind it on a longer boom */
    const Rd = Math.min(330, Math.max(R * 4.5, 120)), LdMax = Rd * 1.5;
    const boomL = needs.drum ? Math.max(L - Ln - W / 2, LdMax + R * 3.5) : L - Ln - W / 2;
    boom(B, root, z0 + Ln + W / 2, boomL, R * 0.6);
    B.slots.push(slot("end", V(0, 0, z0 + Ln + W / 2 + boomL + 1), Z, V(0, 1, 0), 1, { width: R * 2.2, cap: true, owner: B.occ[B.occ.length - 1] }));
    if (needs.ring) ring(B, root, Math.max(Hn * 0.62, R * 3.4), R * 0.5, z0 + Ln + W * 0.3, 8);
    if (needs.drum) B.drumSlot = { z: z0 + Ln + W / 2 + R * 1.4 + LdMax / 2, R };
    B.count(2);
  },

  /* the bastion: armoured octagonal core, citadel belt, star-fort arms, faceted bastions, a prow */
  bastion(B, root, needs) {
    const { mats, rng } = B;
    const L = B.L * 0.8, R = B.R * 1.25;
    const z0 = -L / 2;
    const sp = spine(B, root, R, L * 0.8, z0 + L * 0.1, { form: "armoured", around: 8 });
    /* the citadel: a belt of sloped plate amidships, hard points on its faces */
    const zc = z0 + L * (needs.drum ? 0.72 : rng.range(0.42, 0.55)), Rc = R * rng.range(1.9, 2.4), Lc = R * rng.range(1.4, 1.9);
    addMesh(root, G.cyl(8), mats.armour, 0, 0, zc, H, PI / 8, 0, Rc, Lc * 0.5, Rc);
    for (const s of [-1, 1]) addMesh(root, G.taper(0.55, 8), mats.armour, 0, 0, zc + s * Lc * 0.5, s > 0 ? H : -H, PI / 8, 0, Rc, Lc * 0.5, Rc);
    addMesh(root, G.cyl(8), mats.hull, 0, 0, zc, H, PI / 8, 0, Rc * 1.03, Lc * 0.12, Rc * 1.03);
    const cOwn = new THREE.Box3(V(-Rc, -Rc, zc - Lc), V(Rc, Rc, zc + Lc));
    B.occ.push(cOwn);
    for (let k = 0; k < 8; k++) { const a = (k / 8) * PI * 2; const n = V(Math.cos(a), Math.sin(a), 0); B.slots.push(slot("surface", n.clone().multiplyScalar(Rc * 0.97).setZ(zc), n, Z, B.zoneOf(zc), { width: Rc * 0.7, owner: cOwn, hard: true })); }
    B.count(4);
    /* star-fort arms with faceted bastions */
    const arms = rng.pick([4, 4, 5, 6]);
    const off = rng.range(0, PI * 2);
    const armL = B.L * rng.range(0.32, 0.45);
    for (let i = 0; i < arms; i++) arm(B, root, (i / arms) * PI * 2 + off, armL, zc, R * 0.6, { solid: true, node: "faceted", hard: true, from: Rc * 0.9 });
    /* armour belts on the core between the arms and the prow */
    const plates = [];
    const nP = Math.round(28 * B.tier.hullScale);
    for (let i = 0; i < nP; i++) { const a = rng.range(0, PI * 2), z = z0 + L * rng.range(0.14, 0.86); if (Math.abs(z - zc) < Lc) continue; plates.push({ x: Math.cos(a) * R * 1.02, y: Math.sin(a) * R * 1.02, z, rz: a, sx: rng.range(4, 9), sy: 1.6, sz: rng.range(8, 20) }); }
    if (plates.length) instanced(root, G.box(), mats.armour, plates, "belt");
    /* the prow: an armoured cone with the spinal gun's slot at its tip */
    const pL = R * rng.range(1.4, 2.2);
    B.deferred.push(() => { if (!sp.noProw) addMesh(root, G.taper(0.35, 8), mats.armour, 0, 0, z0 + L * 0.1 - pL / 2, -H, PI / 8, 0, R, pL, R); });
    B.occ.push(new THREE.Box3(V(-R, -R, z0 + L * 0.1 - pL), V(R, R, z0 + L * 0.1)));
    B.slots.push(slot("end", V(0, 0, z0 + L * 0.1 - pL - 1), Z.clone().negate(), V(0, 1, 0), 0, { width: R * 0.8, cap: true, owner: B.occ[B.occ.length - 1], spine: sp, prow: true, hard: true }));
    /* stern boom and its cap */
    boom(B, root, z0 + L * 0.9, L * 0.1 + B.L * 0.12, R * 0.55);
    B.slots.push(slot("end", V(0, 0, z0 + L + B.L * 0.12 + 1), Z, V(0, 1, 0), 1, { width: R * 2, cap: true, owner: B.occ[B.occ.length - 1] }));
    if (needs.ring) ring(B, root, Math.max(Rc * 1.4, R * 3.2), R * 0.55, z0 + L * 0.25, 8);
    if (needs.drum) B.drumSlot = { z: z0 + L * 0.3, R };
    B.count(1);
  },

  /* the ziggurat: a stepped hulk — tiers of welded holds along the axis, terraces on every face */
  ziggurat(B, root, needs) {
    const { mats, rng } = B;
    const L = B.L * 0.9, R = B.R;
    const z0 = -L / 2;
    const tiers = rng.int(4, 6);
    const W0 = R * rng.range(2.8, 3.6), H0 = R * rng.range(2.2, 3);
    const zcs = [];
    let zc = z0 + L * 0.08;
    let lastOwn = null;
    for (let i = 0; i < tiers; i++) {
      const k = 1 - Math.abs(i - (tiers - 1) / 2) / ((tiers - 1) / 2 + 0.6);   // fattest in the middle
      const w = W0 * (0.45 + 0.55 * k) * rng.range(0.9, 1.1), h = H0 * (0.45 + 0.55 * k) * rng.range(0.9, 1.1), len = (L * 0.84) / tiers;
      const z = zc + len / 2;
      const kind = rng.pick(["box", "box", "prism", "frustum"]);
      const mat = rng.pick([mats.hull, mats.hull, mats.panel, mats.dark]);
      if (kind === "prism") addMesh(root, G.cyl(rng.pick([6, 8])), mat, 0, 0, z, H, 0, 0, Math.min(w, h) / 2, len * 0.98, Math.min(w, h) / 2);
      else if (kind === "frustum") addMesh(root, G.frustum(0.75, 4), mat, 0, 0, z, H, PI / 4, 0, w / 1.414, len * 0.98, h / 1.414);
      else addMesh(root, G.box(), mat, 0, 0, z, 0, 0, 0, w, h, len * 0.98);
      addMesh(root, G.box(), mats.dark, 0, 0, zc, 0, 0, 0, w * 1.03, h * 1.03, 1.5);
      const own = new THREE.Box3(V(-w / 2, -h / 2, zc), V(w / 2, h / 2, zc + len));
      B.occ.push(own);
      lastOwn = own;
      /* terraces: slots on all four faces of this tier */
      const cols = Math.max(1, Math.round(len / 40));
      for (let c = 0; c < cols; c++) {
        const zz = zc + len * ((c + 0.5) / cols);
        for (const [nx, ny, wd] of [[0, 1, w * 0.8], [0, -1, w * 0.8], [1, 0, h * 0.8], [-1, 0, h * 0.8]]) {
          const n = V(nx, ny, 0);
          B.slots.push(slot("spine", V(nx * w / 2, ny * h / 2, zz), n, Z, B.zoneOf(zz), { width: wd, owner: own }));
        }
      }
      zcs.push({ z, w, h });
      zc += len;
      B.count(2);
    }
    /* a keel girder the length of the hulk, a mast off the fat tier */
    boom(B, root, z0, L, R * 0.5, "keel");
    const fat = zcs.reduce((a, b) => (b.w > a.w ? b : a));
    addMesh(root, G.cyl(6), mats.metal, 0, fat.h / 2 + R * 1.2, fat.z, 0, 0, 0, R * 0.12, R * 2.4, R * 0.12);
    B.slots.push(slot("end", V(0, fat.h / 2 + R * 2.4, fat.z), V(0, 1, 0), Z, B.zoneOf(fat.z), { width: R, tip: true, owner: lastOwn }));
    endSlots(B, z0, z0 + L, R);
    if (needs.ring) ring(B, root, Math.max(fat.w * 0.8, R * 3.4), R * 0.5, fat.z, 8);
    if (needs.drum) B.drumSlot = { z: fat.z, R };
    B.count(1);
  },
};

/** The Tier III habitat drum: a rotating cylinder about the spine with end plates, bearings and window bands. */
export function habitatDrum(B, root, z, R) {
  const { mats, rng } = B;
  const Rd = Math.min(330, Math.max(R * 4.5, 120)), Ld = Rd * rng.range(1.15, 1.45);
  const g = new THREE.Group(); g.name = "drum"; g.position.z = z; root.add(g);
  g.userData.spin = { axis: "z", speed: Math.sqrt(9.81 / Rd) * 0.5 };
  const sides = B.styleArch.forms.keep > 2 ? 16 : B.styleArch.forms.faceted > 2 ? 24 : 48;
  addMesh(g, G.tube(sides), mats.hull, 0, 0, 0, H, 0, 0, Rd, Ld, Rd);
  addMesh(g, G.tube(sides), mats.dark, 0, 0, 0, H, 0, 0, Rd * 0.985, Ld * 1.004, Rd * 0.985).material.side = THREE.BackSide;
  for (const s of [-1, 1]) {
    addMesh(g, G.cyl(sides), mats.panel, 0, 0, s * Ld * 0.5, H, 0, 0, Rd, Rd * 0.02, Rd);
    addMesh(g, G.torus(0.06, 10, 64), mats.accent, 0, 0, s * Ld * 0.5, 0, 0, 0, Rd * 1.01, Rd * 1.01, Rd * 1.01);
    addMesh(g, G.cyl(32), mats.dark, 0, 0, s * (Ld * 0.5 + R * 0.8), H, 0, 0, R * 1.6, R * 1.6, R * 1.6); // bearing housings
    B.count(3);
  }
  const ribs = rng.int(8, 14);
  for (let i = 0; i < ribs; i++) {
    const zz = -Ld / 2 + (Ld * (i + 0.5)) / ribs;
    addMesh(g, G.torus(0.015, 6, 64), mats.dark, 0, 0, zz, 0, 0, 0, Rd * 1.005, Rd * 1.005, Rd * 1.005);
    if (i % 2 === 1) addMesh(g, G.torus(0.006, 4, 96), mats.window, 0, 0, zz + Ld / ribs * 0.35, 0, 0, 0, Rd * 1.006, Rd * 1.006, Rd * 1.006);
    B.count();
  }
  const own = new THREE.Box3(V(-Rd, -Rd, z - Ld / 2 - R), V(Rd, Rd, z + Ld / 2 + R));
  B.occ.push(own);
  B.anim.spins.push(g);
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * PI * 2;
    const nrm = V(Math.cos(a), Math.sin(a), 0);
    B.slots.push(slot("ring", nrm.clone().multiplyScalar(Rd * 0.99).setZ(z), nrm, Z, B.zoneOf(z), { width: (2 * PI * Rd) / 12, parent: g, local: { z }, owner: own }));
  }
  for (const s of [-1, 1]) for (const rf of [0.45, 0.78]) {
    const n = rf > 0.6 ? 14 : 8;
    for (let i = 0; i < n; i++) {
      const a = (i / n) * PI * 2 + (rf > 0.6 ? 0.2 : 0);
      const pos = V(Math.cos(a) * Rd * rf, Math.sin(a) * Rd * rf, z + s * (Ld * 0.5 + Rd * 0.02));
      const nrm = V(0, 0, s);
      B.slots.push(slot("ring", pos, nrm, V(Math.cos(a), Math.sin(a), 0), B.zoneOf(pos.z), { width: (2 * PI * Rd * rf) / n, parent: g, local: { z }, owner: own }));
    }
  }
  for (const s of B.slots) if ((s.kind === "spine" || s.kind === "surface") && Math.abs(s.pos.z - z) < Ld / 2 + R * 1.2 && Math.hypot(s.pos.x, s.pos.y) < Rd) s.taken = true;
  return { Rd, Ld };
}
