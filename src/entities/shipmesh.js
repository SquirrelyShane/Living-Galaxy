<<<<<<< HEAD
// Living Galaxy — a visible hull.
//
// This file used to *be* the ship: a cone, two boxes and a colour lookup keyed by career,
// thirty-seven lines, and every hull in the galaxy was that cone in a different tint. It is
// now the seam between LG's vocabulary and `entities/shipforge.js`, which does the building.
//
// Three things live here and nothing else does, because each is an LG opinion rather than a
// property of the generator:
//
//   **Which silhouette a career flies.** The forge thinks in eight categories — trade,
//   military, economic, logistic, civilian, agriculture, medical, slavers. LG thinks in five
//   career classes. That is not a one-to-one map and should not be forced into one: an
//   economic career flies either a bulk freighter or a sleek courier depending on what it is
//   doing, and both are more specific than "economic".
//
//   **Which of them a player may fly.** `slavers` is in the forge's catalogue and is not in
//   the player's pool. A raider hull is a thing you meet, not a thing the career system
//   hands you for reaching a rank, and keeping that rule here rather than in the forge means
//   the forge stays a generator instead of acquiring a morality.
//
//   **Which way the nose points.** The forge builds nose at +Z, which is what
//   `Object3D.lookAt` wants and what `entities/npcs.js` has always assumed. The chase cam
//   uses the opposite basis. That flip is applied here, once, so exactly one file knows
//   there are two conventions.

import { buildHull, CATS } from './shipforge.js';
import { attachGlow } from '../world/lightrig.js';
import { hashString } from '../core/rng.js';
import { registerFactory } from '../core/spawn.js';

/**
 * Career class → the forge categories that class can present as.
 *
 * More than one entry is the point. A career is a job, and a job is flown in more than one
 * kind of hull — so which silhouette a given ship wears is part of that ship's identity
 * rather than a property of its career, and two economic haulers parked at the same berth
 * are allowed to be visibly different ships.
 */
const PLAYER_POOL = {
  military:   ['military'],
  industrial: ['agriculture', 'trade'],
  logistics:  ['logistic'],
  economic:   ['trade', 'economic'],
  civilian:   ['civilian', 'medical']
};

/**
 * The same map for hulls the world spawns rather than the player.
 *
 * `slavers` appears here and only here. It is the outlaw silhouette — a ram, cargo cages and
 * a heavily jittered hull — and it belongs to raiders, which is a statement about who flies
 * what rather than about what the forge can build.
 */
const HOSTILE_POOL = {
  military:   ['military', 'slavers'],
  industrial: ['agriculture', 'trade'],
  logistics:  ['logistic'],
  economic:   ['trade'],
  civilian:   ['civilian']
};

/** Fallback tint, still keyed by career. Used for the glow, which is not the hull. */
const GLOW = {
=======
// Living Galaxy — a visible hull. Used by the chase cam for your own ship and by
// the multiplayer layer for other pilots. Nose points -Z to match the flight basis.

import { attachGlow } from '../world/lightrig.js';

const COLORS = {
>>>>>>> 1935cd184c7779d3b421a28a48b3b29b1c83bc44
  military: 0xff5555, industrial: 0xffaa22, logistics: 0x55ff77,
  economic: 0xff66ff, civilian: 0x88ccff
};

<<<<<<< HEAD
/** Default hull length in world units — what the old cone measured, so nothing jumps. */
const DEFAULT_LENGTH = 11;

/**
 * Which forge category a ship identity presents as.
 *
 * Deterministic on the identity string, so a hull does not change silhouette between a
 * respawn and a system re-entry. Exported because `npcs.js` wants the answer for its own
 * cache key without building anything to get it.
 */
export function categoryFor(classKey, seed = '', hostile = false) {
  const pool = (hostile ? HOSTILE_POOL : PLAYER_POOL)[classKey] || PLAYER_POOL.civilian;
  if (pool.length === 1) return pool[0];
  return pool[hashString(String(seed)) % pool.length];
}

/**
 * Build a hull for a career class.
 *
 * `seed` is the ship's identity — a call sign, a fleet id, a save's ship name. Same identity
 * in, same hull out, forever. Callers with nothing to key on may omit it and get the class's
 * reference hull, which is stable and shared rather than random.
 */
export function buildShip(classKey, seed = classKey, opts = {}) {
  const cat = categoryFor(classKey, seed, !!opts.hostile);
  const forged = buildHull(seed, cat, {
    targetLength: opts.length > 0 ? opts.length : DEFAULT_LENGTH
  });

  const g = forged.root;
  g.rotation.order = 'YXZ';

  // The forge builds nose at +Z. The chase cam's basis is the other one, and which way the
  // world faces is not something a generator should have to know.
  if (opts.noseMinusZ) g.rotation.y = Math.PI;

  // The engine glow is a registration with the light rig, not a light of its own — sixty-odd
  // hulls each carrying a PointLight was once the single largest cost in the frame, and that
  // lesson does not stop applying because the hulls got prettier.
  attachGlow(g, (forged.cat.pal && forged.cat.pal.glow) || GLOW[classKey] || 0x88ccff, 0.5, 120);

  // Everything the forge measured off the geometry it actually built, carried on the group
  // so the dossier and the fitting screen can read it without rebuilding the hull to ask.
  g.userData.forge = {
    name: forged.name, role: forged.role, category: cat,
    stats: forged.stats, dna: forged.dna, radius: forged.radius
  };
  return g;
}

export { CATS };

// The multiplayer layer builds a mesh per remote pilot and used to import this directly.
// Through the factory registry now, for the same reason `npcs.js` registers its spawner —
// and as an explicit boot step for the same reason too. See the note there.
export function registerHullFactory() {
  registerFactory('hull', buildShip);
}
=======
export function buildShip(classKey) {
  const col = COLORS[classKey] || 0x88ccff;
  const g = new THREE.Group();
  g.rotation.order = 'YXZ';

  const hull = new THREE.Mesh(
    new THREE.ConeGeometry(3.2, 11, 6),
    new THREE.MeshStandardMaterial({ color: col, metalness: 0.6, roughness: 0.35,
      emissive: col, emissiveIntensity: 0.15 })
  );
  hull.rotation.x = -Math.PI / 2;          // tip +Y → -Z
  g.add(hull);

  const dark = new THREE.MeshStandardMaterial({ color: 0x223347, metalness: 0.8, roughness: 0.3 });
  const wing = new THREE.Mesh(new THREE.BoxGeometry(12, 0.7, 3.4), dark);
  wing.position.z = 2.2;
  g.add(wing);
  const fin = new THREE.Mesh(new THREE.BoxGeometry(0.7, 4.5, 3), dark);
  fin.position.set(0, 2, 2.4);
  g.add(fin);

  // Registered with the light rig rather than owning a light: in multiplayer this builder
  // runs once per remote pilot, and a busy system should not cost a shader recompile per
  // arrival. See `world/lightrig.js`.
  attachGlow(g, col, 0.5, 60);
  return g;
}
>>>>>>> 1935cd184c7779d3b421a28a48b3b29b1c83bc44
