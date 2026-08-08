// Living Galaxy — four asteroid belts, each with its own mineral profile.
// Instanced per belt so 660 rocks cost a handful of draw calls.

import { scene } from './scene.js';
import { S } from '../core/state.js';
import { TAU } from '../core/utils.js';
import { wrand, makeRng } from '../core/rng.js';
import { ORBITAL_V } from '../core/config.js';
import { BELTS, ringFieldFor, rollComposition, compositionValue } from '../data/belts.js';

const VARIANTS = 3;
const dummy = new THREE.Object3D();
const ORIGIN = { x: 0, y: 0, z: 0 };
const color = new THREE.Color();
let meshes = [];

export function createAsteroids() {
  meshes = [];
  const records = [];
  let n = 0;

  // Rings are generated from whatever the world builder actually gave rings to, not from
  // a hardcoded list — `PLANET_TYPES.rings` is a probability and `world/system.js` rolls
  // it per body, so a list here would be wrong on most seeds. Same rule as everywhere
  // else in this project: read the world, do not restate it.
  const rings = (S.world.bodies || [])
    .filter(b => b.userData && b.userData.rings)
    .map(ringFieldFor);
  const fields = BELTS.concat(rings);
  S.world.rings = rings;

  for (const belt of fields) {
    const parentBody = belt.parentName
      ? S.world.bodies.find(b => b.userData && b.userData.name === belt.parentName) : null;
    const rng = makeRng((S.seed ^ hash(belt.key)) >>> 0);
    const buckets = Array.from({ length: VARIANTS }, () => []);

    for (let i = 0; i < belt.count; i++) {
      const radius = belt.rockR[0] + rng.next() * (belt.rockR[1] - belt.rockR[0]);
      const orbitR = belt.inner + rng.next() * belt.width;
      const comp = rollComposition(belt, rng);
      const v = VARIANTS > 1 ? i % VARIANTS : 0;
      const rec = {
        kind: 'asteroid',
        name: `${belt.name.split(' ')[0]}-${String(++n).padStart(3, '0')}`,
        belt: belt.key, beltName: belt.name,
        // A ring rock's orbit is about its planet. Everything downstream — the cutter, the
        // broadphase, the nav map, an NPC miner picking a rock — reads `position`, which
        // is written every frame either way, so nothing else needs to know.
        parent: parentBody,
        position: new THREE.Vector3(),
        radius,
        ore: Math.round(radius * (40 + rng.next() * 60)),
        oreMax: 0,
        comp,
        valuePerKg: compositionValue(comp),
        orbitRadius: orbitR,
        angle: rng.next() * TAU,
        orbitSpeed: wrand(ORBITAL_V.asteroid[0], ORBITAL_V.asteroid[1]) / orbitR,
        y: (rng.next() - 0.5) * (belt.parentName ? 6 : 130),
        rot: new THREE.Euler(rng.next() * 6, rng.next() * 6, rng.next() * 6),
        spin: new THREE.Vector3((rng.next() - .5), (rng.next() - .5), (rng.next() - .5)),
        variant: v,
        idx: buckets[v].length
      };
      rec.oreMax = rec.ore;
      buckets[v].push(rec);
      records.push(rec);
    }

    buckets.forEach((bucket, v) => {
      if (!bucket.length) return;
      const geo = lumpyRock(v);
      const mat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.94, metalness: 0.2,
        transparent: false, depthWrite: true });
      const mesh = new THREE.InstancedMesh(geo, mat, bucket.length);
      mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
      mesh.frustumCulled = false;
      bucket.forEach((rec, i) => {
        rec.mesh = mesh;
        color.setHSL(belt.hue, belt.sat, belt.light[0] + rng.next() * (belt.light[1] - belt.light[0]));
        mesh.setColorAt(i, color);
      });
      scene.add(mesh);
      meshes.push({ mesh, bucket });
    });
  }

  S.world.asteroids = records;
  S.world.belts = fields;
  updateAsteroids(0);
}

function lumpyRock(seed) {
  const geo = new THREE.DodecahedronGeometry(1, 0);
  const p = geo.attributes.position;
  for (let j = 0; j < p.count; j++) {
    const k = 0.6 + ((j * 37 + seed * 17) % 13) / 13 * 0.8;
    p.setXYZ(j, p.getX(j) * k, p.getY(j) * k, p.getZ(j) * k);
  }
  geo.computeVertexNormals();
  return geo;
}

export function updateAsteroids(dt) {
  for (const { mesh, bucket } of meshes) {
    for (let i = 0; i < bucket.length; i++) {
      const r = bucket[i];
      r.angle += r.orbitSpeed * dt;
      const p = r.parent ? r.parent.position : ORIGIN;
      r.position.set(p.x + Math.cos(r.angle) * r.orbitRadius,
                     p.y + r.y,
                     p.z + Math.sin(r.angle) * r.orbitRadius);
      r.rot.x += r.spin.x * dt; r.rot.y += r.spin.y * dt; r.rot.z += r.spin.z * dt;
      dummy.position.copy(r.position);
      dummy.rotation.copy(r.rot);
      dummy.scale.setScalar(r.radius * (r.ore > 0 ? 1 : 0.7));
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    }
    mesh.instanceMatrix.needsUpdate = true;
  }
}

export function mineAsteroid(rec, kg) {
  const got = Math.min(rec.ore, kg);
  rec.ore -= got;
  if (rec.ore <= 0 && rec.mesh) {
    rec.ore = 0;
    color.setHSL(0.07, 0.05, 0.12);
    rec.mesh.setColorAt(rec.idx, color);
    if (rec.mesh.instanceColor) rec.mesh.instanceColor.needsUpdate = true;
  }
  return got;
}

export function nearestAsteroid(pos, maxDist, includeSpent = false) {
  let best = null, bd = maxDist * maxDist;
  for (const r of S.world.asteroids) {
    if (!includeSpent && r.ore <= 0) continue;
    const d = r.position.distanceToSquared(pos);
    if (d < bd) { bd = d; best = r; }
  }
  return best;
}

function hash(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}

// ── persistence ──────────────────────────────────────────────────────
// The belt is generated from the world seed, so a save does not need to store 520 rocks —
// only which ones you have actually dug into. Storing the deltas rather than the field
// keeps the payload tiny and means a rock you never touched still comes back exactly as
// the seed says it should.

export function serializeBelt() {
  const out = [];
  const list = S.world.asteroids;
  for (let i = 0; i < list.length; i++) {
    const r = list[i];
    if (r.ore < r.oreMax) out.push([i, Math.round(r.ore)]);
  }
  return out;
}

export function restoreBelt(data) {
  if (!Array.isArray(data)) return 0;
  const list = S.world.asteroids;
  let applied = 0;
  for (const entry of data) {
    const [i, ore] = entry;
    const r = list[i];
    if (!r) continue;                       // a save from a different belt size
    r.ore = Math.max(0, Math.min(r.oreMax, ore));
    applied++;
  }
  return applied;
}
