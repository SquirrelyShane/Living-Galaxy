// Living Galaxy — four asteroid belts, each with its own mineral profile.
// Instanced per belt so 660 rocks cost a handful of draw calls.

import { scene } from './scene.js';
import { S } from '../core/state.js';
import { TAU } from '../core/utils.js';
import { wrand, makeRng } from '../core/rng.js';
<<<<<<< HEAD
import { ORBITAL_V, ORBIT_SCALE, BANDS, CLUTTER } from '../core/config.js';
import { setField, clearField, ringBand } from './pointfield.js';
=======
import { ORBITAL_V, ORBIT_SCALE } from '../core/config.js';
>>>>>>> 1935cd184c7779d3b421a28a48b3b29b1c83bc44
import { BELTS, ringFieldFor, rollComposition, compositionValue } from '../data/belts.js';

const VARIANTS = 3;
const dummy = new THREE.Object3D();
const ORIGIN = { x: 0, y: 0, z: 0 };
const color = new THREE.Color();
let meshes = [];
<<<<<<< HEAD
const bands = [];
=======
>>>>>>> 1935cd184c7779d3b421a28a48b3b29b1c83bc44

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
  // Scale the heliocentric belts here, once, before anything reads them. Everything
  // downstream — the rock placement below, `fieldMid`, the nav map's belt band, ARIA's
  // "warp to the belt" waypoint, the targeting reticle — goes through `S.world.belts`, so
  // scaling at the rock loop alone would have put the rocks in one place and every
  // waypoint pointing at them in another. Rings are already in world units: they are
  // derived from a planet's own radius by `ringFieldFor`, and that planet has been scaled
  // already, so scaling them again would push a ring outside its own parent.
  // v1.02.33: the belt table comes off the system plan, not out of data/belts.js. A
  // generated system's fields sit in that system's orbital gaps and carry a mineral profile
  // interpolated from that system's temperature gradient; the authored four are still the
  // plan for a Solaris layout. `BELTS` stays as the fallback for anything that builds rock
  // before a plan exists, which in practice is only a bare unit test.
  const source = (S.systemPlan && S.systemPlan.belts && S.systemPlan.belts.length)
    ? S.systemPlan.belts : BELTS;
  const belts = source.map(b => Object.assign({}, b, {
    inner: b.inner * ORBIT_SCALE,
    width: b.width * ORBIT_SCALE
  }));
  const fields = belts.concat(rings);
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
<<<<<<< HEAD
      // The emissive floor is not decoration. Rock is lit by the star and nothing else, and
      // an outer field sits far enough out that a MeshStandardMaterial with no emissive
      // resolves to very nearly black — which is indistinguishable from "there are no rocks
      // here", the exact complaint this slice is about. It is small enough that an inner
      // belt is still lit by the sun rather than by itself.
      const mat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.94, metalness: 0.2,
        emissive: 0x0a0906, emissiveIntensity: 1,
=======
      const mat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.94, metalness: 0.2,
>>>>>>> 1935cd184c7779d3b421a28a48b3b29b1c83bc44
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
<<<<<<< HEAD
      // `belt` is carried so the band tier can hide exactly this belt's meshes and no others.
      meshes.push({ mesh, bucket, belt });
=======
      meshes.push({ mesh, bucket });
>>>>>>> 1935cd184c7779d3b421a28a48b3b29b1c83bc44
    });
  }

  S.world.asteroids = records;
  S.world.belts = fields;
<<<<<<< HEAD
  buildBands(fields);
  buildClutter();
  updateAsteroids(0);
}

// ── the clutter tier (v1.02.53) ──────────────────────────────────────
//
// Gravel around the ship while it is inside a field. See `CLUTTER` in `config/render.js`
// for why this exists rather than more mineable rock.
//
// **Nothing in the simulation can see it.** There is no record, no index, no ore and no
// entry in `S.world.asteroids`; the cutter, the broadphase, `nearestAsteroid()` and every
// NPC miner walk that array and this is not in it. That is the whole safety property: a
// tier that is purely presentational cannot change what a save has to store, cannot change
// what a mining run yields, and cannot be blamed for a physics bug. It is the same split
// the band tier below it relies on — drawing, and nothing else.
//
// Recycling rather than regeneration: a chip that falls behind the ship is moved to a
// random point in front of it, so the shell is populated forever with one fixed instance
// count and no allocation. Each chip carries its own drift so the field is not a rigid
// lattice being dragged along.

let clutterMesh = null;
const chips = [];
let clutterRng = null;

function buildClutter() {
  clearClutter();
  if (!CLUTTER.show || !CLUTTER.count) return;
  clutterRng = makeRng((S.seed ^ hash('clutter')) >>> 0);
  const geo = lumpyRock(1);
  const mat = new THREE.MeshStandardMaterial({
    color: new THREE.Color().setHSL(CLUTTER.color[0] * 0.14, 0.14, 0.34),
    roughness: 0.97, metalness: 0.12,
    emissive: new THREE.Color(CLUTTER.emissive, CLUTTER.emissive * 0.92, CLUTTER.emissive * 0.8)
  });
  clutterMesh = new THREE.InstancedMesh(geo, mat, CLUTTER.count);
  clutterMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  clutterMesh.frustumCulled = false;
  clutterMesh.visible = false;
  for (let i = 0; i < CLUTTER.count; i++) {
    chips.push({
      pos: new THREE.Vector3(),
      rot: new THREE.Euler(),
      spin: new THREE.Vector3(),
      scale: 1,
      placed: false
    });
  }
  scene.add(clutterMesh);
}

function clearClutter() {
  if (clutterMesh) {
    scene.remove(clutterMesh);
    // Guarded on the method rather than on the object: the headless stub in `test/stub.mjs`
    // implements enough of three.js to run the simulation and not the parts that free GPU
    // memory, and a teardown path that only works under WebGL is a teardown path the suite
    // cannot exercise.
    const g = clutterMesh.geometry, m = clutterMesh.material;
    if (g && typeof g.dispose === 'function') g.dispose();
    if (m && typeof m.dispose === 'function') m.dispose();
  }
  clutterMesh = null;
  chips.length = 0;
}

/** Put one chip somewhere in the shell, biased ahead of the ship rather than around it. */
function placeChip(c, centre, ahead) {
  const r = clutterRng;
  const t = r.next() * TAU;
  const u = r.next() * 2 - 1;
  const s = Math.sqrt(1 - u * u);
  const d = CLUTTER.inner + Math.pow(r.next(), 0.55) * (CLUTTER.outer - CLUTTER.inner);
  c.pos.set(centre.x + Math.cos(t) * s * d,
            centre.y + u * d * 0.35,          // flattened: a belt is a disc, not a ball
            centre.z + Math.sin(t) * s * d);
  if (ahead && ahead.lengthSq() > 1e-6) {
    // Nudge toward where the ship is going, so a moving hull flies *into* gravel rather
    // than watching it appear beside it.
    c.pos.addScaledVector(ahead, d * 0.55);
  }
  c.rot.set(r.next() * 6, r.next() * 6, r.next() * 6);
  c.spin.set((r.next() - 0.5) * 0.8, (r.next() - 0.5) * 0.8, (r.next() - 0.5) * 0.8);
  c.scale = CLUTTER.size[0] + r.next() * (CLUTTER.size[1] - CLUTTER.size[0]);
  c.placed = true;
}

const _ahead = new THREE.Vector3();

/** Is the ship inside any field's band right now? */
function inAField(pos) {
  for (const f of (S.world.belts || [])) {
    const parent = f.parentName
      ? (S.world.bodies || []).find(b => b.userData && b.userData.name === f.parentName) : null;
    const c = parent ? parent.position : ORIGIN;
    const r = Math.hypot(pos.x - c.x, pos.z - c.z);
    const dy = Math.abs(pos.y - c.y);
    if (r >= f.inner - CLUTTER.bandPad && r <= f.inner + f.width + CLUTTER.bandPad &&
        dy < (f.thickness || f.width * 0.06) + CLUTTER.bandPad) return f;
  }
  return null;
}

function updateClutter(dt, pos) {
  if (!clutterMesh) return;
  const inside = !!inAField(pos);
  if (!inside) {
    if (clutterMesh.visible) {
      clutterMesh.visible = false;
      // Forget the placements. Coming back into a field on the far side of the system and
      // finding the same gravel waiting is worse than a fresh scatter, and re-placing is
      // 340 cheap rolls.
      for (const c of chips) c.placed = false;
    }
    return;
  }
  clutterMesh.visible = true;
  _ahead.copy(S.player.velocity || ORIGIN);
  if (_ahead.lengthSq() > 1e-6) _ahead.normalize();
  const far2 = CLUTTER.outer * CLUTTER.outer;
  for (let i = 0; i < chips.length; i++) {
    const c = chips[i];
    if (!c.placed || c.pos.distanceToSquared(pos) > far2) placeChip(c, pos, _ahead);
    c.rot.x += c.spin.x * dt; c.rot.y += c.spin.y * dt; c.rot.z += c.spin.z * dt;
    dummy.position.copy(c.pos);
    dummy.rotation.copy(c.rot);
    dummy.scale.setScalar(c.scale);
    dummy.updateMatrix();
    clutterMesh.setMatrixAt(i, dummy.matrix);
  }
  clutterMesh.instanceMatrix.needsUpdate = true;
}

/** Diagnostics: how much gravel is being drawn, and whether the ship is in a field. */
export const clutterReport = () => ({
  drawn: clutterMesh && clutterMesh.visible ? chips.length : 0,
  field: (inAField(S.player.position) || {}).name || null
});

// ── the band tier (v1.02.42) ─────────────────────────────────────────
//
// One additive ring of points per belt, standing in for its rocks when the player is too far
// away for individual rocks to be the point.
//
// This is a **new bottom tier under `world/lod.js`**, not a replacement for anything. The rocks
// are untouched: they still orbit, still hold ore, are still claimed by NPC miners and still
// answer `nearestAsteroid()`. Only the drawing changes, which is the same split the render gate
// has relied on since v1.02.31 — simulation is not what LOD is about.
//
// It looks like *more* detail rather than less, which is the part worth stating. Instanced rocks
// cull one at a time, so a belt used to thin to nothing as you left it; a band holds its shape,
// which is how a belt actually reads from a distance.
function buildBands(fields) {
  clearBands();
  if (!BANDS.show) return;
  for (const belt of fields) {
    // Deterministic in the belt's own seed, like everything else about a system since v1.02.33.
    // `Math.random()` here would give a belt a different shape every time it re-entered range.
    const rng = makeRng((S.seed ^ hash('band:' + belt.key)) >>> 0);
    const rand = () => rng.next();
    const mid = belt.inner + belt.width * 0.5;
    const parent = belt.parentName
      ? (S.world.bodies.find(b => b.userData && b.userData.name === belt.parentName) || null)
      : null;
    const c = parent ? parent.position : ORIGIN;
    bands.push({
      key: 'band:' + belt.key,
      belt, parent, mid,
      pts: ringBand(c.x, c.y, c.z, belt.inner, belt.width, BANDS.points,
                    belt.thickness || belt.width * 0.06, () => rand()),
      on: false
    });
  }
}

function clearBands() {
  for (const b of bands) clearField(b.key);
  bands.length = 0;
}

/**
 * Flip each belt between meshes and its band.
 *
 * Hysteresis on purpose: a single threshold makes a belt flicker between four hundred meshes and
 * a point band every time the player drifts across it, which is both ugly and the most expensive
 * possible way to sit still — every crossing repacks the field buffer *and* re-shows the
 * instanced meshes.
 */
let bandT = 0;
function updateBands(dt, camPos) {
  if (!BANDS.show || !bands.length) return;
  bandT += dt;
  if (bandT < 0.4) return;                 // distance changes slowly; four checks a second is plenty
  bandT = 0;

  for (const b of bands) {
    const c = b.parent ? b.parent.position : ORIGIN;
    const d = Math.abs(camPos.distanceTo(c) - b.mid);
    const want = b.on ? d > BANDS.enterAt - BANDS.hysteresis : d > BANDS.enterAt;
    if (want === b.on) continue;
    b.on = want;
    if (want) {
      // The band is rebuilt at the parent's current position rather than reused, because a ring
      // belongs to a planet that has moved since the system was built.
      setField(b.key, ringBand(c.x, c.y, c.z, b.belt.inner, b.belt.width, BANDS.points,
                               b.belt.thickness || b.belt.width * 0.06,
                               i => Math.sin(i * 78.233) * 43758.5453 % 1),
               { color: BANDS.color, size: BANDS.pointSize, alpha: BANDS.alpha });
    } else {
      clearField(b.key);
    }
    for (const m of meshes) if (m.belt === b.belt) m.mesh.visible = !want;
  }
}

=======
  updateAsteroids(0);
}

>>>>>>> 1935cd184c7779d3b421a28a48b3b29b1c83bc44
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
<<<<<<< HEAD
  updateBands(dt, S.player.position);
  updateClutter(dt, S.player.position);
  for (const { mesh, bucket } of meshes) {
    // **The orbit runs whether or not the meshes are drawn.**
    //
    // The first cut of the band tier put `if (!mesh.visible) continue` at the top of this loop,
    // and `test/celestial.mjs` caught it in one run: a ring rock stopped travelling with its
    // planet the moment the belt dropped to its band, so a player who flew away and came back
    // found Titanus's ring left behind in space. Position is *simulation* — the cutter, the
    // broadphase, `nearestAsteroid()` and every NPC miner read it — and the whole premise of an
    // LOD tier is that it changes drawing and nothing else.
    //
    // What the band tier actually saves is the second half: four hundred `setMatrixAt` calls
    // and a full instance-matrix upload per belt per frame, for meshes nobody is looking at.
    const drawing = mesh.visible;
=======
  for (const { mesh, bucket } of meshes) {
>>>>>>> 1935cd184c7779d3b421a28a48b3b29b1c83bc44
    for (let i = 0; i < bucket.length; i++) {
      const r = bucket[i];
      r.angle += r.orbitSpeed * dt;
      const p = r.parent ? r.parent.position : ORIGIN;
      r.position.set(p.x + Math.cos(r.angle) * r.orbitRadius,
                     p.y + r.y,
                     p.z + Math.sin(r.angle) * r.orbitRadius);
      r.rot.x += r.spin.x * dt; r.rot.y += r.spin.y * dt; r.rot.z += r.spin.z * dt;
<<<<<<< HEAD
      if (!drawing) continue;
=======
>>>>>>> 1935cd184c7779d3b421a28a48b3b29b1c83bc44
      dummy.position.copy(r.position);
      dummy.rotation.copy(r.rot);
      dummy.scale.setScalar(r.radius * (r.ore > 0 ? 1 : 0.7));
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    }
<<<<<<< HEAD
    if (drawing) mesh.instanceMatrix.needsUpdate = true;
=======
    mesh.instanceMatrix.needsUpdate = true;
>>>>>>> 1935cd184c7779d3b421a28a48b3b29b1c83bc44
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
