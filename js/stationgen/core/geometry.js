/* Shared geometry: cached unit primitives, lathe profiles, truss lattices,
 * the material factory, per-material static merging and instanced batches.
 *
 * Everything here is scale-agnostic: a "unit" cylinder is scaled per mesh.
 * The cache is page-lifetime; nothing in it is ever disposed. Geometry a
 * station owns outright (merged batches, lathes with custom profiles) is
 * flagged `owned` so releaseStation() can free it. */
import * as THREE from "three";

const cache = new Map();
export function cached(key, make) {
  let g = cache.get(key);
  if (!g) { g = make(); g.userData.shared = true; cache.set(key, g); }
  return g;
}

export const G = {
  box: () => cached("box", () => new THREE.BoxGeometry(1, 1, 1)),
  cyl: (seg = 16) => cached(`cyl${seg}`, () => new THREE.CylinderGeometry(1, 1, 1, seg, 1, false)),
  tube: (seg = 16) => cached(`tube${seg}`, () => new THREE.CylinderGeometry(1, 1, 1, seg, 1, true)),
  taper: (r, seg = 16) => cached(`taper${r}:${seg}`, () => new THREE.CylinderGeometry(1, r, 1, seg, 1, false)),
  frustum: (r, seg = 4) => cached(`frustum${r}:${seg}`, () => new THREE.CylinderGeometry(r, 1, 1, seg, 1, false)),
  cone: (seg = 12) => cached(`cone${seg}`, () => new THREE.ConeGeometry(1, 1, seg)),
  sphere: (w = 16, h = 12) => cached(`sph${w}x${h}`, () => new THREE.SphereGeometry(1, w, h)),
  dome: (w = 16) => cached(`dome${w}`, () => new THREE.SphereGeometry(1, w, 9, 0, Math.PI * 2, 0, Math.PI / 2)),
  torus: (tube = 0.1, radial = 10, tubular = 48) => cached(`tor${tube}:${radial}:${tubular}`, () => new THREE.TorusGeometry(1, tube, radial, tubular)),
  ring: (inner = 0.7) => cached(`ring${inner}`, () => new THREE.RingGeometry(inner, 1, 40)),
  disc: () => cached("disc", () => new THREE.CircleGeometry(1, 24)),
  octa: () => cached("octa", () => new THREE.OctahedronGeometry(1, 0)),
  ico: (d = 1) => cached(`ico${d}`, () => new THREE.IcosahedronGeometry(1, d)),
  /* a cylinder open at one end: the hangar throat, seen from inside */
  throat: (seg = 4) => cached(`throat${seg}`, () => new THREE.CylinderGeometry(1, 1, 1, seg, 1, true)),
};

/* ---- lathe profiles ---------------------------------------------------- */
/* Points are (radius, y) in unit space: y from −0.5 to 0.5. Lathes are per
 * profile-key cached; a profile with random jitter should be keyed by its
 * rounded numbers so a repeated shape shares geometry. */
export function lathe(key, points, seg = 24) {
  return cached(`lathe:${key}`, () => new THREE.LatheGeometry(points.map(([r, y]) => new THREE.Vector2(r, y)), seg));
}
export const PROFILES = {
  tank: [[0, -0.5], [0.72, -0.5], [0.98, -0.34], [1, 0], [0.98, 0.34], [0.72, 0.5], [0, 0.5]],
  drum: [[0, -0.5], [0.9, -0.5], [1, -0.42], [1, 0.42], [0.9, 0.5], [0, 0.5]],
  pod: [[0, -0.5], [0.55, -0.48], [0.95, -0.2], [1, 0.1], [0.8, 0.42], [0.3, 0.5], [0, 0.5]],
  bell: [[0.2, -0.5], [0.55, -0.4], [0.9, -0.1], [1, 0.3], [0.85, 0.5]],
  reactor: [[0, -0.5], [0.6, -0.5], [0.66, -0.3], [1, -0.2], [1, 0.2], [0.66, 0.3], [0.6, 0.5], [0, 0.5]],
  dish: [[0, -0.05], [0.4, 0.02], [0.75, 0.18], [1, 0.42]],
};

/** A seeded lathe profile: `kind` picks the family, the rng bends it. Points
 * are rounded so near-identical shapes share one cached geometry. */
export function jitterProfile(rng, kind = "tank", amount = 1) {
  const base = PROFILES[kind] ?? PROFILES.tank;
  const j = (v, a) => +(v + rng.range(-a, a) * amount).toFixed(2);
  const pts = base.map(([r, y], i) => (i === 0 || i === base.length - 1 || r === 0) ? [r, y] : [Math.max(0.15, j(r, 0.14)), Math.max(-0.5, Math.min(0.5, j(y, 0.06)))]);
  /* a neck or a bulge, sometimes */
  if (rng.chance(0.35)) { const k = rng.int(1, pts.length - 2); pts[k][0] = +(pts[k][0] * rng.range(0.6, 1.25)).toFixed(2); }
  pts.sort((a, b) => a[1] - b[1]);
  return pts;
}
export function latheOf(rng, kind, seg = 20, amount = 1) {
  const pts = jitterProfile(rng, kind, amount);
  return lathe(`${kind}:${pts.map((p) => p.join("_")).join("|")}:${seg}`, pts, seg);
}

/* ---- extrusions ---------------------------------------------------------- */
/* Flat outlines extruded along +Z from z = 0 to z = depth (unit outlines are
 * scaled per mesh). `holes` are inner outlines. Keyed and cached. */
export function extrude(key, outline, depth = 1, holes = [], o = {}) {
  return cached(`ext:${key}`, () => {
    const sh = new THREE.Shape(outline.map(([x, y]) => new THREE.Vector2(x, y)));
    for (const h of holes) sh.holes.push(new THREE.Path(h.map(([x, y]) => new THREE.Vector2(x, y))));
    const g = new THREE.ExtrudeGeometry(sh, { depth, bevelEnabled: o.bevel ?? false, bevelThickness: o.bevelT ?? 0.02, bevelSize: o.bevelS ?? 0.02, bevelSegments: 1, steps: 1, curveSegments: o.curveSegments ?? 12 });
    if (o.center !== false) g.translate(0, 0, -depth / 2);
    return g;
  });
}

/** An extrusion the station owns outright (unique outlines: notched spine segments). */
export function extrudeOwned(outline, depth = 1, holes = [], o = {}) {
  const sh = new THREE.Shape(outline.map(([x, y]) => new THREE.Vector2(x, y)));
  for (const h of holes) sh.holes.push(new THREE.Path(h.map(([x, y]) => new THREE.Vector2(x, y))));
  const g = new THREE.ExtrudeGeometry(sh, { depth, bevelEnabled: false, steps: 1, curveSegments: o.curveSegments ?? 12 });
  if (o.center !== false) g.translate(0, 0, -depth / 2);
  g.userData.owned = true;
  return g;
}

/** Outline of an aperture / arch, width w, height h (base on y = 0), as [x,y] points. */
export function archOutline(kind, w = 1, h = 1, n = 14) {
  const pts = [];
  const hw = w / 2;
  if (kind === "rect") return [[-hw, 0], [hw, 0], [hw, h], [-hw, h]];
  if (kind === "hex") { const c = Math.min(hw, h) * 0.3; return [[-hw + c, 0], [hw - c, 0], [hw, h * 0.5], [hw - c, h], [-hw + c, h], [-hw, h * 0.5]]; }
  if (kind === "oct") { const c = Math.min(hw, h) * 0.35; return [[-hw + c, 0], [hw - c, 0], [hw, c], [hw, h - c], [hw - c, h], [-hw + c, h], [-hw, h - c], [-hw, c]]; }
  if (kind === "round") {
    /* straight jambs then a semicircle (or a flatter segment when h < w/2) */
    const rise = Math.min(hw, h * 0.6);
    const y0 = h - rise;
    pts.push([-hw, 0], [hw, 0], [hw, y0]);
    for (let i = 1; i < n; i++) { const a = (i / n) * Math.PI; pts.push([Math.cos(a) * hw, y0 + Math.sin(a) * rise]); }
    pts.push([-hw, y0]);
    return pts;
  }
  if (kind === "pointed" || kind === "ogee") {
    /* two arcs meeting at the apex: the gothic arch. Centres at ±(hw·k) on the springing line. */
    const rise = Math.min(h * 0.55, hw * 1.15);
    const y0 = h - rise;
    pts.push([-hw, 0], [hw, 0], [hw, y0]);
    const R = hw * 1.5, cx = hw - R;           // right arc centred at (hw−R, y0): passes through (hw, y0)
    const aTop = Math.acos((0 - cx) / R);      // where x = 0
    const m = Math.floor(n / 2);
    for (let i = 1; i <= m; i++) { const a = (i / m) * aTop; pts.push([cx + Math.cos(a) * R, y0 + Math.sin(a) * R * (rise / (Math.sin(aTop) * R))]); }
    for (let i = m - 1; i >= 1; i--) { const a = (i / m) * aTop; pts.push([-(cx + Math.cos(a) * R), y0 + Math.sin(a) * R * (rise / (Math.sin(aTop) * R))]); }
    pts.push([-hw, y0]);
    return pts;
  }
  return archOutline("rect", w, h);
}

/** A circle of radius R with rectangular bites taken out of the rim (for notched spine segments). Bites: { a, w, sink }. */
export function bittenDisc(R, bites = [], n = 48) {
  const pts = [];
  const spans = bites.map((b) => ({ ...b, w: Math.min(b.w, R * 1.9), ha: Math.asin(Math.min(0.95, Math.min(b.w, R * 1.9) / 2 / R)) }));
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    const inside = spans.find((b) => { let d = a - b.a; d = Math.atan2(Math.sin(d), Math.cos(d)); return Math.abs(d) < b.ha; });
    if (!inside) pts.push([Math.cos(a) * R, Math.sin(a) * R]);
    else if (!inside.done) {
      inside.done = true;
      const yr = Math.sqrt(Math.max(0, R * R - (inside.w / 2) ** 2)), yi = R - inside.sink;
      const rot = ([x, y]) => [x * Math.cos(inside.a - Math.PI / 2) - y * Math.sin(inside.a - Math.PI / 2), x * Math.sin(inside.a - Math.PI / 2) + y * Math.cos(inside.a - Math.PI / 2)];
      /* walking anticlockwise: enter at +x side of the bite (x = +w/2) … no: at angle a−ha we are at x = +w/2 in the bite frame */
      pts.push(rot([inside.w / 2, yr]), rot([inside.w / 2, yi]), rot([-inside.w / 2, yi]), rot([-inside.w / 2, yr]));
    }
  }
  return pts;
}

/* ---- materials --------------------------------------------------------- */
export const FINISHES = {
  brushed: {},
  matte: { metalness: 0.2, roughness: 0.85 },
  chrome: { metalness: 1.0, roughness: 0.08 },
  ceramic: { metalness: 0.05, roughness: 0.55 },
  weathered: { metalness: 0.35, roughness: 0.78 },
};
export function makeMat(color, o = {}) {
  const m = new THREE.MeshStandardMaterial({
    color,
    metalness: o.metalness ?? 0.6,
    roughness: o.roughness ?? 0.45,
    emissive: o.emissive ?? 0x000000,
    emissiveIntensity: o.emissiveIntensity ?? 0,
    transparent: o.transparent ?? false,
    opacity: o.opacity ?? 1,
    side: o.side ?? THREE.FrontSide,
    flatShading: o.flat ?? false,
    envMapIntensity: o.envMapIntensity ?? 1,
  });
  if (o.depthWrite === false) m.depthWrite = false;
  return m;
}

export function addMesh(parent, geo, mat, x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0, sx = 1, sy = 1, sz = 1) {
  const m = new THREE.Mesh(geo, mat);
  m.position.set(x, y, z);
  m.rotation.set(rx, ry, rz);
  m.scale.set(sx, sy, sz);
  parent.add(m);
  return m;
}

/* ---- truss lattices ---------------------------------------------------- */
/* A square-section girder along +Y of length 1 (unit), made of four chords
 * and X-bracing, merged into one owned geometry per (bays, width) key. */
export function trussGeometry(bays = 6, width = 0.12, rod = 0.012) {
  return cached(`truss:${bays}:${width}:${rod}`, () => {
    const parts = [];
    const push = (g, x, y, z, rx, ry, rz, sx, sy, sz) => {
      const m = new THREE.Matrix4().compose(new THREE.Vector3(x, y, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(rx, ry, rz)), new THREE.Vector3(sx, sy, sz));
      parts.push(g.clone().applyMatrix4(m));
    };
    const rodGeo = new THREE.CylinderGeometry(1, 1, 1, 5, 1);
    const h = width / 2;
    for (const [x, z] of [[-h, -h], [h, -h], [-h, h], [h, h]]) push(rodGeo, x, 0, z, 0, 0, 0, rod, 1, rod);
    const bay = 1 / bays;
    const diag = Math.hypot(bay, width);
    for (let i = 0; i < bays; i++) {
      const y0 = -0.5 + bay * i, yc = y0 + bay / 2;
      /* rungs on all four faces */
      for (const [x, z, ry] of [[0, -h, 0], [0, h, 0], [-h, 0, Math.PI / 2], [h, 0, Math.PI / 2]]) push(rodGeo, x, y0 + bay, z, 0, ry, Math.PI / 2, rod * 0.9, width, rod * 0.9);
      /* one diagonal per face, alternating direction */
      const s = i % 2 ? 1 : -1;
      const ang = Math.atan2(width, bay);
      push(rodGeo, 0, yc, -h, 0, 0, s * ang, rod * 0.8, diag, rod * 0.8);
      push(rodGeo, 0, yc, h, 0, 0, -s * ang, rod * 0.8, diag, rod * 0.8);
      push(rodGeo, -h, yc, 0, s * ang, 0, 0, rod * 0.8, diag, rod * 0.8);
      push(rodGeo, h, yc, 0, -s * ang, 0, 0, rod * 0.8, diag, rod * 0.8);
    }
    const merged = mergeGeometries(parts);
    for (const p of parts) p.dispose();
    rodGeo.dispose();
    return merged;
  });
}

/* ---- merging ------------------------------------------------------------- */
/* Non-indexed concatenation of position/normal/uv. Every input is consumed
 * as-is (already transformed). */
export function mergeGeometries(list) {
  let verts = 0;
  const prepped = list.map((g) => { const n = g.index ? g.toNonIndexed() : g; if (!n.attributes.normal) n.computeVertexNormals(); verts += n.attributes.position.count; return n; });
  const pos = new Float32Array(verts * 3), nor = new Float32Array(verts * 3), uv = new Float32Array(verts * 2);
  let off = 0;
  for (const g of prepped) {
    const n = g.attributes.position.count;
    pos.set(g.attributes.position.array.subarray(0, n * 3), off * 3);
    nor.set(g.attributes.normal.array.subarray(0, n * 3), off * 3);
    if (g.attributes.uv) uv.set(g.attributes.uv.array.subarray(0, n * 2), off * 2);
    off += n;
  }
  const out = new THREE.BufferGeometry();
  out.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  out.setAttribute("normal", new THREE.BufferAttribute(nor, 3));
  out.setAttribute("uv", new THREE.BufferAttribute(uv, 2));
  out.computeBoundingSphere();
  out.userData.owned = true;
  return out;
}

const LIVE_KEYS = ["spin", "lamp", "lamps", "chase", "traffic", "pulse", "door", "beacon", "gimbal", "drone", "shield", "turret"];
const _inv = new THREE.Matrix4();
/**
 * Bake every static mesh under `root` into one mesh per material, leaving
 * animated nodes alone. A live *group* (a spinning ring, a drum, a turret)
 * becomes its own merge root, so the modules riding it bake into that group
 * and keep turning with it. Returns the number of draws folded away. Merged
 * geometry is owned by the station.
 */
export function mergeStatic(root, liveKeys = LIVE_KEYS) {
  root.updateMatrixWorld(true);
  const isLive = (o) => liveKeys.some((k) => o.userData?.[k]) || o.isInstancedMesh;
  let folded = 0;
  const mergeUnder = (node) => {
    _inv.copy(node.matrixWorld).invert();
    const buckets = new Map();
    const doomed = [];
    const walk = (o) => {
      for (const c of o.children) {
        if (isLive(c)) { if (c.children.length) mergeUnder(c); continue; }
        if (c.isMesh && !c.children.length && !Array.isArray(c.material) && c.geometry?.attributes?.position) {
          if (!buckets.has(c.material)) buckets.set(c.material, []);
          buckets.get(c.material).push({ geo: c.geometry, matrix: new THREE.Matrix4().multiplyMatrices(_inv, c.matrixWorld) });
          doomed.push(c);
        } else walk(c);
      }
    };
    walk(node);
    const merged = new Set();
    for (const [mat, list] of buckets) {
      if (list.length < 2) continue;
      const xf = list.map(({ geo, matrix }) => (geo.index ? geo.toNonIndexed() : geo.clone()).applyMatrix4(matrix));
      const g = mergeGeometries(xf);
      for (const x of xf) x.dispose();
      const m = new THREE.Mesh(g, mat);
      m.name = "merged";
      node.add(m);
      merged.add(mat);
      folded += list.length - 1;
    }
    for (const o of doomed) {
      if (!merged.has(o.material)) continue;
      o.parent?.remove(o);
      if (o.geometry.userData?.owned) o.geometry.dispose();
    }
  };
  mergeUnder(root);
  return folded;
}

/* ---- instancing ---------------------------------------------------------- */
/** Build an InstancedMesh from a list of {x,y,z,rx,ry,rz,sx,sy,sz,color?}. */
export function instanced(parent, geo, mat, items, name = "instanced") {
  const im = new THREE.InstancedMesh(geo, mat, items.length);
  const d = new THREE.Object3D();
  const col = new THREE.Color();
  let colored = false;
  items.forEach((it, i) => {
    d.position.set(it.x ?? 0, it.y ?? 0, it.z ?? 0);
    d.rotation.set(it.rx ?? 0, it.ry ?? 0, it.rz ?? 0);
    d.scale.set(it.sx ?? 1, it.sy ?? it.sx ?? 1, it.sz ?? it.sx ?? 1);
    d.updateMatrix();
    im.setMatrixAt(i, d.matrix);
    if (it.color != null) { im.setColorAt(i, col.set(it.color)); colored = true; }
  });
  im.instanceMatrix.needsUpdate = true;
  if (colored && im.instanceColor) im.instanceColor.needsUpdate = true;
  im.name = name;
  im.frustumCulled = false;
  parent.add(im);
  return im;
}

/* ---- disposal ------------------------------------------------------------ */
export function disposeOwned(root) {
  const mats = new Set();
  root.traverse((o) => {
    if (o.geometry?.userData?.owned) o.geometry.dispose();
    if (o.isInstancedMesh) o.dispose();
    if (o.material) (Array.isArray(o.material) ? o.material : [o.material]).forEach((m) => mats.add(m));
  });
  for (const m of mats) if (!m.userData?.shared) m.dispose();
  return mats.size;
}
