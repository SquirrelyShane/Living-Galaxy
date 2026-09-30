import { generateAsteroid, SHAPE_LABELS, SHAPE_KINDS } from "../asteroidgen/generator.js";
import { bakeLattice } from "./bake.js";
import { CLASSES } from "./classes.js";
import { oreLook } from "../world/rockgen.js";
import { ORES } from "../economy/materials.js";

export { SHAPE_LABELS, SHAPE_KINDS };

const ORE_BY_ID = new Map(ORES.map((o) => [o.id, o]));

export const DETAIL = { placeholder: 5, far: 7, near: 10, high: 12, assay: 9, survey: 18 };
export const faceCount = (n) => 12 * n * n;

export const FEATURE_SCALE = 4;
export const FEATURE_DENSITY = 4;

export const MESH_RADIUS = 1.65;

export function rockParams(rock) {
  return {
    seed: String(rock.key ?? rock.id ?? "rock"),
    classId: CLASSES[rock.cls] ? rock.cls : "S",
    radiusM: Math.max(10, (rock.r ?? 60) * 10),
    richness: rock.rich ? 1.15 : 0.85,
  };
}

export function rogueParams(m, cls) {
  const s = m.seed ?? 0.5;
  const p = {
    seed: m.bodySeed ?? `rogue:${m.name || m.id}`,
    classId: CLASSES[cls] ? cls : "S",
    radiusM: Math.max(10, (m.r ?? 300) * 10),
    craterDensity: 0.8 + s * 0.2,
    roughness: 0.22 + s * 0.2,
    richness: 0.95,
  };
  if (m.shape) p.shapeKind = m.shape;
  return p;
}

export function generateBody(_THREE, opts = {}) {
  const radius = opts.radius ?? (opts.radiusM != null ? opts.radiusM / 10 : 120);
  const params = {
    seed: String(opts.seed ?? "rock"),
    classId: opts.classId ?? (CLASSES[opts.cls] ? opts.cls : "S"),
    radiusM: opts.radiusM ?? radius * 10,
    detail: opts.detail ?? DETAIL.near,
    featureScale: opts.featureScale ?? FEATURE_SCALE,
    featureDensity: opts.featureDensity ?? FEATURE_DENSITY,
  };
  const roughness = opts.roughness;
  const craters = opts.craterDensity ?? opts.craters;
  if (roughness != null) params.roughness = roughness;
  if (craters != null) params.craterDensity = craters;
  if (opts.richness != null) params.richness = opts.richness;
  const shape = opts.shapeKind ?? opts.shape;
  if (shape) params.shapeKind = shape;

  const a = generateAsteroid(params);
  const cls = a.classId;
  return {
    geometry: a.geometry,
    asteroid: a,
    cls,
    klass: CLASSES[cls],
    scale: radius / a.meshRadius,
    shape: a.shapeKind,
    shapeLabel: SHAPE_LABELS[a.shapeKind] ?? a.shapeKind,
    frostPct: a.frostPct,
    craterCount: a.craterCount,
    grooveCount: a.grooveCount,
    iceAffinity: a.iceAffinity,
    triangles: a.triangleCount,
    outcrops: outcropsOf(a),
    ...assayOf(a.composition, a.vertexCount, cls, radius, a.richness, opts.favour ?? null),
  };
}

export const BAKE = {
  proto: { H: 32, L: [8, 4, 2] },
  belt: { off: { H: 32, L: [8] }, low: { H: 32, L: [8] }, full: { H: 48, L: [16] }, high: { H: 64, L: [16] } },
  rogue: { off: { H: 32, L: [8] }, low: { H: 48, L: [12] }, full: { H: 64, L: [16] }, high: { H: 72, L: [24] } },
};

export const featureAt = (H) => Math.max(1, 56 / H);

export function growBaked(opts = {}) {
  const H = opts.H ?? 48;
  const Ls = Array.isArray(opts.L) ? opts.L : [opts.L ?? 16];
  const fs = featureAt(H);
  const built = generateBody(null, { ...opts, detail: H, featureScale: opts.featureScale ?? fs, featureDensity: opts.featureDensity ?? fs });
  const a = built.asteroid;
  const at = a.geometry.attributes;
  const src = { position: at.position.array, normal: at.normal.array, color: at.color.array, metal: at.aMetal.array, rough: at.aRough.array, emit: at.aEmit.array };
  const bake = bakeLattice(src, H, Ls[0]);
  const meshes = [{ L: Ls[0], positions: bake.positions, normals: bake.normals, colors: bake.colors, uvs: bake.uvs, index: bake.index }];
  for (const L of Ls.slice(1)) {
    const m = bakeLattice(src, H, L);
    meshes.push({ L, positions: m.positions, normals: m.normals, colors: m.colors, uvs: m.uvs, index: m.index });
  }
  const { geometry: _g, asteroid: _a, klass: _k, ...meta } = built;
  return {
    H, W: bake.W, Ht: bake.Ht, texA: bake.texA, texB: bake.texB, texC: bake.texC, emitScale: bake.emitScale, meshes,
    meta: {
      ...meta,
      seed: a.seed, meshRadius: a.meshRadius, maxRadius: a.maxRadius, iceAffinity: a.iceAffinity,
      triangles: meshes[0].index.length / 3, grownTriangles: a.triangleCount,
    },
  };
}

export function bakedTransfer(d) {
  const out = [d.texA.buffer, d.texB.buffer];
  if (d.texC) out.push(d.texC.buffer);
  for (const m of d.meshes) out.push(m.positions.buffer, m.normals.buffer, m.colors.buffer, m.uvs.buffer, m.index.buffer);
  return out;
}

function outcropsOf(a) {
  const out = [];
  const pos = a.geometry.attributes.position.array;
  const nrm = a.geometry.attributes.normal.array;
  const ids = a.oreAtVertex;
  const n = ids.length;
  const hits = [];
  for (let i = 0; i < n; i++) {
    const id = ids[i];
    if (!id) continue;
    const look = oreLook(id);
    const worth = ORE_BY_ID.get(id)?.value ?? 0;
    if (look.metal > 0.45 || look.glow > 0.08 || worth >= 12) hits.push(i);
  }
  const stride = Math.max(1, Math.ceil(hits.length / 40));
  for (let h = 0; h < hits.length && out.length < 40; h += stride) {
    const i = hits[h];
    const id = ids[i];
    const look = oreLook(id);
    const worth = ORE_BY_ID.get(id)?.value ?? 0;
    const lift = 0.02;
    out.push({
      id,
      x: pos[i * 3] + nrm[i * 3] * lift,
      y: pos[i * 3 + 1] + nrm[i * 3 + 1] * lift,
      z: pos[i * 3 + 2] + nrm[i * 3 + 2] * lift,
      size: 0.035 + Math.min(0.05, worth / 2400) + look.glow * 0.03,
      crystal: look.crystal,
      tint: look.tint,
      glow: look.glow,
    });
  }
  return out;
}

export const CUT_SECONDS = 31;
export function recoverableUnits(radius) {
  return (2.5 + Math.pow(radius / 60, 1.5) * 5) * CUT_SECONDS;
}

export function assayOf(composition, verts, cls, radius, richness = 1, favour = null) {
  const klass = CLASSES[cls] ?? CLASSES.S;
  const gross = recoverableUnits(radius) * (0.8 + richness * 0.25);
  const grade = Math.max(0.2, Math.min(0.96, (klass.grade ?? 0.55) * (0.82 + (richness - 0.85) * 0.9)));
  const shares = suiteShares(composition, verts, klass, favour);
  const rows = [];
  let value = 0, mass = 0;
  for (const [id, share] of shares) {
    const qty = gross * grade * share;
    const ore = ORE_BY_ID.get(id);
    const cr = qty * (ore?.value ?? 4);
    mass += qty * (ore?.mass ?? 2);
    rows.push({ id, name: ore?.name ?? id, pct: grade * share * 100, units: qty, value: cr });
    value += cr;
  }
  rows.sort((a, b) => b.value - a.value);
  const units = rows.reduce((a, r) => a + r.units, 0);
  let seen = 0;
  for (const [id, n] of Object.entries(composition)) if (id !== "_rock") seen += n;
  const metres = radius * 10;
  const massKg = (4 / 3) * Math.PI * Math.pow(metres, 3) * klass.density;
  return {
    composition, suite: rows, oreFrac: grade, surfaceFrac: seen / Math.max(1, verts),
    units, gross, holdMass: mass, massKg, value,
    headline: [...rows].sort((a, b) => b.units - a.units)[0]?.id ?? "regolith",
  };
}

function suiteShares(composition, verts, klass, favour) {
  const w = klass.ores;
  let wSum = 0;
  for (const [id, x] of Object.entries(w)) wSum += id === favour ? x * 2.5 : x;
  let seen = 0;
  for (const [id, n] of Object.entries(composition)) if (id !== "_rock" && w[id] != null) seen += n;
  const trust = Math.min(0.6, seen / Math.max(1, verts * 0.08));
  const out = new Map();
  let total = 0;
  for (const [id, x] of Object.entries(w)) {
    const prior = (id === favour ? x * 2.5 : x) / wSum;
    const surface = seen ? (composition[id] ?? 0) / seen : 0;
    const share = (1 - trust) * prior + trust * surface;
    if (share < 0.02) continue;
    out.set(id, share);
    total += share;
  }
  for (const [id, x] of out) out.set(id, x / total);
  return out;
}

const ASSAY_CACHE = new Map();
const ASSAY_CAP = 96;

export function assayRock(rock) {
  if (!rock) return null;
  const p = rockParams(rock);
  const key = `${p.seed}|${p.classId}|${p.radiusM}|${p.richness}|${rock.ore ?? ""}`;
  let base = ASSAY_CACHE.get(key);
  if (!base) {
    const a = generateAsteroid({ ...p, detail: DETAIL.assay, featureScale: FEATURE_SCALE, featureDensity: FEATURE_DENSITY });
    base = {
      cls: a.classId,
      shape: a.shapeKind,
      shapeLabel: SHAPE_LABELS[a.shapeKind] ?? a.shapeKind,
      frostPct: a.frostPct,
      craterCount: a.craterCount,
      ...assayOf(a.composition, a.vertexCount, a.classId, rock.r ?? 60, p.richness, rock.ice ? null : rock.ore),
    };
    a.geometry.dispose();
    ASSAY_CACHE.set(key, base);
    if (ASSAY_CACHE.size > ASSAY_CAP) ASSAY_CACHE.delete(ASSAY_CACHE.keys().next().value);
  }
  const worn = rock.worn ?? 0;
  return { ...base, klass: CLASSES[base.cls], worn, value: base.value * (1 - worn), units: base.units * (1 - worn) };
}

export function bodyMaterial(THREE, { map = null, bump = 2.2, tile = 0.3 } = {}) {
  const mat = new THREE.MeshStandardMaterial({
    vertexColors: true, color: 0xffffff, metalness: 0.35, roughness: 0.62,
    emissive: 0xffffff, emissiveIntensity: 1,
  });
  const detail = map ? { value: map } : null;
  if (map) {
    map.wrapS = map.wrapT = THREE.RepeatWrapping;
    map.needsUpdate = true;
  }
  mat.onBeforeCompile = (shader) => {
    let vs = shader.vertexShader
      .replace("#include <common>", "#include <common>\nattribute float aMetal;\nattribute float aRough;\nattribute vec3 aEmit;\nvarying float vMetal;\nvarying float vRough;\nvarying vec3 vEmit;" + (map ? "\nvarying vec3 vObjPos;\nvarying vec3 vObjN;" : ""))
      .replace("#include <begin_vertex>", "#include <begin_vertex>\nvMetal = aMetal;\nvRough = aRough;\nvEmit = aEmit;" + (map ? "\nvObjPos = position;\nvObjN = normal;" : ""));
    let fs = shader.fragmentShader
      .replace("#include <common>", "#include <common>\nvarying float vMetal;\nvarying float vRough;\nvarying vec3 vEmit;")
      .replace("#include <roughnessmap_fragment>", "#include <roughnessmap_fragment>\nroughnessFactor = clamp(vRough, 0.04, 1.0);")
      .replace("#include <metalnessmap_fragment>", "#include <metalnessmap_fragment>\nmetalnessFactor = clamp(vMetal, 0.0, 1.0);")
      .replace("#include <emissivemap_fragment>", "#include <emissivemap_fragment>\ntotalEmissiveRadiance = vEmit;");
    if (map) {
      shader.uniforms.tDetail = detail;
      fs = fs
        .replace("#include <common>", `#include <common>
uniform sampler2D tDetail;
varying vec3 vObjPos;
varying vec3 vObjN;
float gDetailH;
float detailAt(vec3 p, vec3 w) {
  return texture2D(tDetail, p.yz * ${tile.toFixed(3)}).r * w.x
       + texture2D(tDetail, p.zx * ${tile.toFixed(3)} + 0.37).r * w.y
       + texture2D(tDetail, p.xy * ${tile.toFixed(3)} + 0.71).r * w.z;
}`)
        .replace("#include <color_fragment>", `#include <color_fragment>
{
  vec3 w = pow(abs(normalize(vObjN)), vec3(4.0));
  w /= (w.x + w.y + w.z + 1e-5);
  gDetailH = detailAt(vObjPos, w);
  diffuseColor.rgb *= 0.55 + gDetailH * 0.9;
}`)
        .replace("#include <normal_fragment_maps>", `#include <normal_fragment_maps>
{
  /* bump off the same crater field: floors sink, rims stand */
  vec3 sp = -vViewPosition;
  vec3 sx = dFdx(sp), sy = dFdy(sp);
  vec2 dH = vec2(dFdx(gDetailH), dFdy(gDetailH)) * ${bump.toFixed(3)};
  vec3 r1 = cross(sy, normal), r2 = cross(normal, sx);
  float det = dot(sx, r1) * faceDirection;
  vec3 grad = sign(det) * (dH.x * r1 + dH.y * r2);
  normal = normalize(abs(det) * normal - grad);
}`);
    }
    shader.vertexShader = vs;
    shader.fragmentShader = fs;
  };
  mat.customProgramCacheKey = () => (map ? "lg-rockbody:detail" : "lg-rockbody");
  return mat;
}
