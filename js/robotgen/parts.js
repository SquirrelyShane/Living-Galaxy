// robotgen/src/parts.js — shared primitives: material/geometry kit and the two
// node helpers. Imported by build.js and attach.js so attachments can be added
// without reaching into the builder.

/* ---------- small helpers ---------- */
export function makeKit(THREE, spec, opts) {
  const P = spec.palette;
  const cache = new Map();
  const mats = [];
  function mat(key, color, o = {}) {
    const id = key + '|' + color + '|' + JSON.stringify(o);
    if (cache.has(id)) return cache.get(id);
    const m = new THREE.MeshStandardMaterial({
      color: new THREE.Color(color),
      metalness: o.metalness !== undefined ? o.metalness : P.metalness,
      roughness: o.roughness !== undefined ? o.roughness : P.roughness
    });
    if (o.emissive) {
      m.emissive = new THREE.Color(o.emissive);
      m.emissiveIntensity = o.emissiveIntensity !== undefined ? o.emissiveIntensity : 1.0;
    }
    if (o.transparent) { m.transparent = true; m.opacity = o.opacity !== undefined ? o.opacity : 0.5; }
    m.name = key;
    cache.set(id, m);
    mats.push(m);
    return m;
  }
  const geos = [];
  // every geometry carries its volume and half-extents, so the physics layer can
  // weigh and box parts without knowing which THREE build made them
  const keep = (g, vol, half) => {
    geos.push(g);
    g.userData = g.userData || {};
    g.userData.vol = vol;
    g.userData.half = half;
    return g;
  };
  return {
    mats, geos, materialList: mats,
    base: mat('base', P.base),
    second: mat('second', P.secondary),
    trim: mat('trim', P.trim, { metalness: 0.35, roughness: 0.85 }),
    accent: mat('accent', P.accent, { emissive: P.accent, emissiveIntensity: 0.55, metalness: 0.2, roughness: 0.4 }),
    glow: (c, i) => mat('glow', c, { emissive: c, emissiveIntensity: i === undefined ? 1.4 : i, metalness: 0.0, roughness: 0.25 }),
    dark: mat('dark', '#0b0c0e', { metalness: 0.5, roughness: 0.7 }),
    rubber: mat('rubber', '#141416', { metalness: 0.05, roughness: 0.95 }),
    mat,
    box: (w, h, d) => keep(new THREE.BoxGeometry(w, h, d), w * h * d, [w / 2, h / 2, d / 2]),
    cyl: (rt, rb, h, s = 12, open = false) => {
      const r = (rt + rb) / 2, rm = Math.max(rt, rb);
      return keep(new THREE.CylinderGeometry(rt, rb, h, s, 1, open), Math.PI * r * r * h, [rm, h / 2, rm]);
    },
    sph: (r, s = 14) => keep(new THREE.SphereGeometry(r, s, Math.max(6, s >> 1)), 4 / 3 * Math.PI * r * r * r, [r, r, r]),
    cone: (r, h, s = 10) => keep(new THREE.ConeGeometry(r, h, s), Math.PI * r * r * h / 3, [r, h / 2, r]),
    torus: (r, t, s = 8, rs = 16) => keep(new THREE.TorusGeometry(r, t, s, rs), 2 * Math.PI * Math.PI * r * t * t, [r + t, r + t, t])
  };
}

export function put(THREE, parent, geo, mat, x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0, name) {
  const m = new THREE.Mesh(geo, mat);
  m.position.set(x, y, z);
  m.rotation.set(rx, ry, rz);
  if (name) m.name = name;
  m.castShadow = true; m.receiveShadow = true;
  parent.add(m);
  return m;
}
export function group(THREE, parent, name, x = 0, y = 0, z = 0) {
  const g = new THREE.Group();
  g.name = name;
  g.position.set(x, y, z);
  if (parent) parent.add(g);
  return g;
}

