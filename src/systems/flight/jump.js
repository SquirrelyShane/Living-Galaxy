// Living Galaxy — leaving one system for another.
//
// The galaxy has been real since v1.02.44 — the system you are in is a node on it, derived
// from `(galaxySeed, node)` and persisted as two integers. What has never existed is a way to
// *go* anywhere: `GALAXY.jumpRange` and the fuel constants were exercised by the suite and by
// nothing else, and `docs/OPEN_ENDS.md` lists that as the one genuinely inert mechanic left in
// the tree. This is it.
//
// ## The hard part is not the arithmetic
//
// Deciding whether a jump is allowed is ten lines. Arriving is the work, because
// `createSystem()` **appends** — it has only ever been called once, at boot, into an empty
// scene. Calling it a second time without a teardown gives you two stars, two sets of berths
// and two belts occupying the same space, all of which the broadphase, the LOD registry, the
// interpolator and every targeting query would happily walk.
//
// So a jump is: verify, tear the old system out by the roots, rebuild from the new node's
// seed, and re-seed everything that is keyed to *this* system rather than to the flight.
//
// ## What survives a jump, and what does not
//
// **Survives** — the pilot, the ship, the hold, the crew, credits, the company, its hulls,
// standing with every power, the career ladder, research, and the contracts already accepted.
// Those are facts about *you*, and carrying them is the entire point of having a galaxy rather
// than a series of unrelated maps.
//
// **Does not** — the station boards, the market, the population sim and the asteroid field.
// Those are facts about *a place*, and a place you have left keeps them; the contract board at
// a berth two thousand light-years behind you is not your board any more. This is the same
// distinction the save schema has drawn since v1.02.33 between the flight and the layout.

import { S } from '../../core/state.js';
import { GALAXY } from '../../core/config.js';
import { scene } from '../../world/scene.js';
import { nodeAt, jumpCost, designation } from '../../world/galaxy.js';
import { planFor } from '../../world/genesis.js';
import { seedWorld } from '../../core/rng.js';
import { createSystem } from '../../world/system.js';
import { createAsteroids } from '../../world/asteroids.js';
import { spawn } from '../../core/spawn.js';
import { createShoal, resetShoal } from '../npc/shoal.js';
import { buildWells } from '../../world/wells.js';
import { clearAllFields } from '../../world/pointfield.js';
import { resetParticles } from '../../world/particles.js';
import { resetLod } from '../../world/lod.js';
import { untrack } from '../../world/interpolate.js';
import { initMarket } from '../trade/market.js';
import { initContracts } from '../trade/contracts.js';
import { initWorldSim } from '../platform/worldsim.js';
import { clearTarget } from './targeting.js';
import { toast, status } from '../../core/notify.js';
import { sfx } from '../platform/audio.js';

/** Where the flight is now. */
export const currentNode = () =>
  nodeAt((S.galaxy && S.galaxy.seed) >>> 0, (S.galaxy && S.galaxy.node) | 0);

/** Fuel this jump would cost, or 0 for a node you are already at. */
export function costTo(node) {
  const here = currentNode();
  return node && node.i !== here.i ? jumpCost(here, node) : 0;
}

/**
 * Why this jump cannot happen — or null.
 *
 * Every refusal names its number, because "JUMP" greyed out with no reason is the thing this
 * project has spent four patches removing from other screens.
 */
export function jumpBlocker(node) {
  if (!node) return 'No destination selected';
  const here = currentNode();
  if (node.i === here.i) return 'You are already here';
  const d = Math.hypot(node.x - here.x, node.y - here.y, node.z - here.z);
  if (d > GALAXY.jumpRange) {
    return `Out of range — ${Math.round(d)} ly, drive reaches ${GALAXY.jumpRange}`;
  }
  const cost = jumpCost(here, node);
  const have = Math.floor(S.player.energy);
  if (have < cost) return `Not enough charge — needs ${cost}, core holds ${have}`;
  if (S.docked) return 'Undock before jumping';
  return null;
}

/**
 * Take the old system out of the world.
 *
 * Deliberately explicit rather than "remove everything from the scene": the scene also holds
 * the light rig, the starfield, the skybox, the particle layers and the player's own hull, and
 * a teardown that took those would leave a black screen with no ship in it. Each list below is
 * a thing `createSystem`, `createAsteroids` or `createNpcs` put there, and nothing else.
 */
function teardown() {
  const drop = obj => {
    if (!obj) return;
    untrack(obj);
    if (obj.parent) obj.parent.remove(obj);
    else scene.remove(obj);
  };

  for (const b of S.world.bodies) drop(b);
  for (const st of S.world.stations) drop(st);
  for (const n of S.world.npcs) drop(n);
  for (const l of S.world.loot) drop(l.mesh || l);
  for (const d of S.world.decoys) drop(d.mesh || d);
  // The rocks are instanced: one mesh per belt bucket, held by the records rather than by a
  // list of its own. Collected through a Set because several hundred records share a handful
  // of meshes and removing the same one four hundred times is four hundred scene walks.
  const rockMeshes = new Set();
  for (const r of S.world.asteroids) if (r.mesh) rockMeshes.add(r.mesh);
  for (const m of rockMeshes) drop(m);

  S.world.bodies = [];
  S.world.stations = [];
  S.world.asteroids = [];
  S.world.npcs = [];
  S.world.loot = [];
  S.world.decoys = [];
  S.world.belts = [];
  S.world.rings = [];
  // The other nine hundred and fifty. A shoal record holds a position in the system it was
  // made for, so carrying one across a jump would put a freighter in the middle of a star
  // two thousand light-years away. Cleared here rather than rebuilt, because the arrival
  // path below builds the new one from the new seed.
  resetShoal();

  resetLod();
  clearAllFields();     // well shells and belt bands belong to the system that had them
  resetParticles();     // and so does every spark still in flight
  clearTarget();
  S.orbit = null;
  S.docked = null;
}

/**
 * Go.
 *
 * Returns the arrival node, or null if it was refused. The refusal path must leave the world
 * exactly as it was — a half-torn-down system is the worst possible outcome, so nothing is
 * removed until the check has passed.
 */
export function jumpTo(node) {
  const why = jumpBlocker(node);
  if (why) { toast(why); sfx.deny(); return null; }

  const cost = costTo(node);
  S.player.energy = Math.max(0, S.player.energy - cost);

  teardown();

  // The new system, by the same road a new game takes: the node carries the seed, genesis
  // turns the seed into a plan, and everything else is built out of the plan.
  S.galaxy = { seed: S.galaxy.seed >>> 0, node: node.i };
  S.seed = node.seed >>> 0;
  seedWorld(S.seed);
  S.systemPlan = planFor(S.seed, 'procedural');
  S.systemPlan.designation = designation(node);

  createSystem();
  createAsteroids();
  buildWells();
  // Repopulating the destination. Through the factory registry rather than importing the
  // entity layer — a headless jump (a server tick, an economy test) gets no hulls and
  // carries on, which was impossible while this was a hard import. See `core/spawn.js`.
  spawn('npc-population');
  // ...and the second tier, from the destination's own seed. After the berths exist, because
  // lane traffic runs between them.
  createShoal();

  // Facts about a place, not about the pilot. A board two thousand light-years behind you is
  // not your board — see the header.
  initWorldSim();
  initMarket();
  initContracts();

  // Arrive off to one side of the star rather than inside it. `innerLimit` is the same number
  // genesis uses to decide where the first planet may sit, so an arrival is never inside a
  // gravity well the flight model would immediately fight.
  const out = (S.systemPlan.innerLimit || 4000) * 1.6;
  S.player.position.set(out, 0, out * 0.4);
  S.player.velocity.set(0, 0, 0);

  sfx.pickup();
  status(`Arrived — ${S.systemPlan.designation}`);
  toast(`${S.systemPlan.designation} · ${S.systemPlan.star.name} · ${S.systemPlan.star.className}`, 5200);
  return node;
}
