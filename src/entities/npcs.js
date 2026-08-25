// Living Galaxy — the "living" part. Hostiles hunt the player and Coalition patrols;
// patrols hunt hostiles. Fights break out with nobody watching.

import { scene } from '../world/scene.js';
import { S } from '../core/state.js';
import { NPC_TYPES, NPC_RESPAWN_INTERVAL, AMBUSH, ENGAGE, POP, LOCK, ORBIT_SCALE, RENDER_RANGE } from '../core/config.js';
import { rand, TAU } from '../core/utils.js';
import { wrand, wnext, stream, hashString, makeRng } from '../core/rng.js';
import { fire } from '../systems/combat/projectiles.js';
import { damageNpc } from '../systems/combat/combat.js';
import { rangeScale } from '../systems/combat/damage.js';
import { appraise, spendShot, support, bandScale, callForHelp } from '../systems/npc/npc-tactics.js';
import { dealsFor, settle } from '../systems/trade/deals.js';
import { loadHold, holdCap, holdMass, holdFree, unloadHold } from '../systems/trade/holds.js';
import { applyTrade, marketPrice } from '../systems/trade/market.js';
import { creditExtraction, extractionBerth } from '../systems/company/fleet.js';
import { HOLD } from '../core/config.js';
import { sfx } from '../systems/platform/audio.js';
import { track as trackInterp, untrack as untrackInterp } from '../world/interpolate.js';
import { attachGlow } from '../world/lightrig.js';
import { buildShip } from './shipmesh.js';
import { register as registerLod } from '../world/lod.js';
import { registerFactory } from '../core/spawn.js';
import { playerSignature, ambushRange, detectionRange } from '../systems/combat/detection.js';
import { isHostileTo, blocOf } from '../systems/company/reputation.js';
import { addBeam, deliverToSite, captureNpc } from '../systems/platform/worldsim.js';
import { nearestAsteroid, mineAsteroid } from '../world/asteroids.js';
import { SIM } from '../core/config.js';
import { toast } from '../core/notify.js';

const _dir = new THREE.Vector3();
const _tan = new THREE.Vector3();
const _aim = new THREE.Vector3();
const _prev = new THREE.Vector3();
const _dummy = new THREE.Object3D();
// How far out an NPC is still simulated in full. Beyond it only the ones with real
// accumulated work keep stepping.
//
// This was a bare 9,000 — a distance that only made sense against the system it was written
// for. Widening the system at v1.02.10 left the belts, and therefore the miners working
// them, outside it: company hulls stopped extracting, patrols never met anything, and two
// suites caught it. A cull radius is a fraction of the world, not a constant, so it scales
// with the world. Cost is roughly flat, because spreading the same number of ships over a
// wider system drops the density by about as much as the radius adds.
const FAR = 9000 * ORBIT_SCALE, FAR2 = FAR * FAR;

let respawnTimer = 0;

export function createNpcs() {
  for (const key in NPC_TYPES) {
    for (let i = 0; i < NPC_TYPES[key].count; i++) spawnNpc(key, i + 1);
  }
  // patrols fly in wings of three: shared route, staggered spacing
  const patrols = S.world.npcs.filter(n => n.userData.type === 'patrol');
  for (let i = 0; i < patrols.length; i++) {
    const u = patrols[i].userData, lead = patrols[i - (i % 3)].userData;
    u.orbitR = lead.orbitR;
    u.patrolAngle = lead.patrolAngle + (i % 3) * 0.02;
    u.wing = Math.floor(i / 3);
  }
}

export function spawnNpc(key, n) {
  const t = NPC_TYPES[key];
  // The name is drawn before the mesh because the mesh is chosen *from* it — which variant
  // this ship wears is part of its identity, not a separate roll.
  const name = `${t.name} ${String(n || Math.floor(rand(1, 99))).padStart(2, '0')}`;
  const g = buildMesh(key, t, name);
  const a = wrand(0, TAU);
  const r = wrand(t.spawn[0], t.spawn[1]);
  g.position.set(Math.cos(a) * r, wrand(-90, 90), Math.sin(a) * r);
  const ROLE = { merc: 'merc', miner: 'mine', hauler: 'haul', builderC: 'build', builderP: 'build', fort: 'fort' };
  g.userData = {
    kind: 'ship', type: key, role: ROLE[key] || 'combat', faction: t.faction,
    name,
    hp: t.hp, maxHp: t.hp, speed: t.speed, turn: t.turn, sensor: t.sensor, range: t.range,
    dmg: t.dmg, pspeed: t.pspeed, pcool: t.pcool, color: t.color, size: t.size,
    dtype: t.dtype || 'kinetic', armorProfile: t.armorProfile || 'shield',
    profile: t.profile || 'skirmish',
    weaponClass: t.weaponClass || 'standard',
    lockT: 0, locked: false,
    bounty: t.bounty, salvage: t.salvage,
    lastShot: 0, nextScan: wnext(), target: null, acc: 0,
    patrolAngle: a, orbitR: r, vel: new THREE.Vector3()
  };
  // A share of the hostiles lie in ambush — parked in the shadow of a belt rock
  // or on the night side of a planet, dark and off sensors until you get close.
  if ((key === 'pirate' || key === 'drone') && wnext() < AMBUSH.fraction) {
    const u = g.userData;
    const rocks = S.world.asteroids;
    const planets = S.world.bodies.filter(b => b.userData.kind === 'planet');
    if (rocks.length && (wnext() < 0.6 || !planets.length)) {
      u.anchorRock = rocks[Math.floor(wnext() * rocks.length)];
    } else if (planets.length) {
      u.anchorPlanet = planets[Math.floor(wnext() * planets.length)];
    }
    if (u.anchorRock || u.anchorPlanet) {
      u.ambush = true;
      u.triggered = false;
      u.jit = new THREE.Vector3(wrand(-45, 45), wrand(-16, 16), wrand(-45, 45));
    }
  }
  // Miners start their shift already parked on a rock — they're workers, not commuters.
  if (g.userData.role === 'mine') {
    const rock = nearestAsteroid(g.position, 6000);
    if (rock) {
      g.userData.rock = rock;
      g.position.copy(rock.position);
      g.position.x += 40;
      g.userData.locked = new THREE.Vector3(40, 0, 0);
    }
  }

  scene.add(g);
  // Registered for culling, not for tessellation levels — a hull is built from a handful
  // of small parts and swapping their detail would cost more bookkeeping than it saves.
  // The win is the cull: NPCs are scattered across orbital rings out to 30,000 km, so at
  // any moment most of them are a fraction of a pixel wide and were being drawn anyway.
  // The radius is the hull's own size scaled for the length of the cone, which is what
  // actually subtends the screen.
  // Ships get a far longer acquisition range than stations: a hull is the thing you most
  // need to see coming, and unlike a station it is small enough that LOD culls it honestly
  // once it is genuinely distant. The cap is a backstop against a contact rendered from
  // across the system, not the primary cull.
  registerLod(g, t.size * 1.6, null, RENDER_RANGE.ship);
  // NPCs move every simulation step and are the most visible thing on screen that is not
  // the player, so they benefit most from being drawn between steps.
  trackInterp(g);
  S.world.npcs.push(g);
  return g;
}

const _anchor = new THREE.Vector3();

function ambushHold(n, u) {
  if (u.anchorRock) {
    _anchor.copy(u.anchorRock.position);
  } else {
    const b = u.anchorPlanet;
    const L = b.position.length() || 1;
    // night side: along the star→planet line, past the planet
    _anchor.copy(b.position).multiplyScalar(1 + (b.userData.radius * 2.0) / L);
  }
  n.position.copy(_anchor).add(u.jit);
}

// ── hull assets ──────────────────────────────────────────────────────
// A hull's shape and its paint are properties of its *type*, not of the individual ship:
// every pirate is the same cone at the same size in the same colour. The builder used to
// mint fresh geometry and a fresh material for each of the sixty-seven hulls anyway, so
// the world booted with a hundred-odd buffers and sixty-seven materials that were pairwise
// identical — sixty-seven separate GPU uploads, sixty-seven uniform blocks, and no chance
// of the renderer batching any two of them.
//
// Cached per type key, so it is now one of each. Safe because nothing mutates an NPC's
// material: damage is a number, a lock is a HUD overlay, and death removes the hull rather
// than recolouring it. If that ever changes, the ship that wants its own colour must clone
// the material first — sharing is the default here, not an assumption.
const hullAssets = new Map();

/**
 * Which career class an NPC type flies, and how many silhouettes it may wear.
 *
 * `variants` is the whole reason this table exists rather than the forge being called once
 * per ship. Sixty-seven hulls each minting their own geometry and material was the fault the
 * cache above was built to fix — sixty-seven GPU uploads, sixty-seven uniform blocks, and no
 * chance of the renderer batching any two of them. Handing every raider a unique procedural
 * hull walks straight back into it, and the cost arrives exactly where it is hardest to
 * notice: in a system that is busy.
 *
 * So variety is bounded rather than free. A type gets a small fixed number of hulls, minted
 * once and shared, and each ship picks one from its own name. Four raider silhouettes across
 * eighteen raiders reads as a fleet with different ships in it; eighteen reads the same and
 * costs four times as much. Types the player only ever meets one of — the command ship, the
 * bastion — get a single hull, because a variant with nothing to compare against is a
 * geometry nobody can see.
 */
const HULL_KIND = {
  pirate:   { cls: 'military',   hostile: true,  variants: 4 },
  drone:    { cls: 'military',   hostile: true,  variants: 2 },
  command:  { cls: 'military',   hostile: true,  variants: 1 },
  patrol:   { cls: 'military',   hostile: false, variants: 3 },
  merc:     { cls: 'military',   hostile: true,  variants: 3 },
  miner:    { cls: 'industrial', hostile: false, variants: 3 },
  hauler:   { cls: 'logistics',  hostile: false, variants: 3 },
  builderC: { cls: 'logistics',  hostile: false, variants: 2 },
  builderP: { cls: 'logistics',  hostile: true,  variants: 2 },
  fort:     { cls: 'military',   hostile: true,  variants: 1 }
};

const DEFAULT_KIND = { cls: 'civilian', hostile: false, variants: 2 };

/**
 * Which variant a named ship wears. Deterministic on the name, so a raider that respawns —
 * or is met again after a jump out and back — comes back the same ship rather than
 * reshuffling into a different one.
 */
function variantFor(key, name) {
  const k = HULL_KIND[key] || DEFAULT_KIND;
  return k.variants <= 1 ? 0 : hashString(String(name)) % k.variants;
}

/**
 * One shared hull per (type, variant), built on first sight and never rebuilt.
 *
 * Length comes from the type's own `size` at the same multiplier the old cone used, so the
 * scale ladder LG already balanced — a drone at 6, a command ship at 26 — survives the change
 * of geometry and nothing on screen jumps.
 */
function hullFor(key, t, variant) {
  const cacheKey = key + '#' + variant;
  let a = hullAssets.get(cacheKey);
  if (a) return a;
  const k = HULL_KIND[key] || DEFAULT_KIND;
  a = buildShip(k.cls, key + '/' + variant, { hostile: k.hostile, length: t.size * 1.6 });
  hullAssets.set(cacheKey, a);
  return a;
}

function buildMesh(key, t, name) {
  const g = hullFor(key, t, variantFor(key, name)).clone();
  // The engine glow is a registration, not a light. See `world/lightrig.js` — sixty-seven
  // hulls each carrying their own `PointLight` was the single largest cost in the frame.
  // A clone needs its own registration: the rig tracks objects, not geometries.
  attachGlow(g, t.color, 0.5, 120);
  return g;
}

export function updateNpcs(dt) {
  const npcs = S.world.npcs;
  let threat = false;
  let lockedOn = false;
  // One signature per frame, shared by every watcher — it is a property of the player,
  // not of the observer, and recomputing it 63 times would be 63 identical answers.
  const sig = playerSignature();

  for (let i = 0; i < npcs.length; i++) {
    const n = npcs[i], u = n.userData;
    if (u.hp <= 0) continue;
    // A hull on a pad is inside a station. It does not manoeuvre, acquire, get acquired or
    // collide, and the fleet layer moves it off the pad when it has somewhere to be.
    if (u.dockedAt) { u.acc = 0; continue; }

    const dPlayer2 = n.position.distanceToSquared(S.player.position);
    const far = dPlayer2 > FAR2;
    u.acc += dt;
    if (far && u.acc < 0.2) continue;
    const step = u.acc;
    u.acc = 0;

    // ── working roles run their own routines ─────────────────────
    // Snapshot position *before* the step so velocity is this ship this frame, not the
    // previous NPC's leftover in `_prev`. Getting that wrong did not throw, but it made
    // every miner and merc report a velocity that belonged to someone else.
    if (u.role === 'mine')  {
      _prev.copy(n.position);
      minerStep(n, u, step);
      u.vel.copy(n.position).sub(_prev).divideScalar(Math.max(step, 1e-4));
      continue;
    }
    if (u.role === 'build') {
      _prev.copy(n.position);
      builderStep(n, u, step);
      u.vel.copy(n.position).sub(_prev).divideScalar(Math.max(step, 1e-4));
      continue;
    }
    if (u.role === 'haul')  {
      _prev.copy(n.position);
      haulerStep(n, u, step);
      u.vel.copy(n.position).sub(_prev).divideScalar(Math.max(step, 1e-4));
      continue;
    }
    if (u.role === 'merc')  {
      if (u.contract && u.contract.kind === 'player' &&
          n.position.distanceToSquared(S.player.position) < u.sensor * u.sensor) {
        threat = true;
        lockedOn = true;
      }
      _prev.copy(n.position);
      mercStep(n, u, step);
      u.vel.copy(n.position).sub(_prev).divideScalar(Math.max(step, 1e-4));
      continue;
    }

    if (u.ambush && !u.triggered) {
      ambushHold(n, u);
      // Springing the trap is a detection contest, not a fixed line on the map. Coast in
      // cold with the guns quiet and you can slip past a picket that would have woken for
      // a laden hauler at full burn.
      const trig = ambushRange(u.sensor, sig);
      if (dPlayer2 < trig * trig) {
        u.triggered = true;
        toast('⚠ Ambush — ' + u.name);
      } else continue;
    }

    if (!far && u.faction === 'hostile') {
      const see = detectionRange(u.sensor, sig);
      if (dPlayer2 < see * see) threat = true;
    }

    u.nextScan -= step;
    if (u.nextScan <= 0) { u.nextScan = rand(0.4, 0.9); acquire(n, u, sig); }

    // A held firing solution, not merely a pointer at the player. This line used to have
    // no distance test in it at all, which is why a raider that noticed you once stayed
    // locked from anywhere in the system.
    const see = detectionRange(u.sensor, sig);
    if (updateLock(n, u, dPlayer2, see, step) && u.faction === 'hostile') lockedOn = true;

    // What this ship has decided to do about whatever it is looking at. Physical budgets
    // first, then nerve, then what its persona remembers about you — see
    // systems/npc-tactics.js. Called on a cadence inside `appraise`, not every frame.
    appraise(n, u, step);

    _prev.copy(n.position);
    if (u.stance === 'flee') disengage(n, u, step);
    else if (u.target) hunt(n, u, step);
    else patrol(n, u, step);
    u.vel.copy(n.position).sub(_prev).divideScalar(Math.max(step, 1e-4));
  }

  respawnTimer += dt;
  if (respawnTimer >= NPC_RESPAWN_INTERVAL) {
    respawnTimer = 0;
    topUpPopulation();
  }
  return { threat, lockedOn };
}

/**
 * The three ranges, derived once per hull.
 *
 * `sensor` is the raw detection reach and is already scaled by the player's signature at
 * the call site. Lock is a fraction of it — seeing a ship and holding a firing solution on
 * it are not the same act, and conflating them is what let a raider on the far side of the
 * system keep a lock on you.
 *
 * Hit range is the one that can *exceed* lock, and only for hulls whose rounds guide
 * themselves the rest of the way in: seekers, drone shoals and fleet elements. A gunship
 * cannot shoot past what it can hold.
 */
export function lockRange(u, see) {
  const raw = (see !== undefined ? see : u.sensor) * LOCK.lockFactor;
  // Signature is unbounded above, so this product is too. Cap it — see LOCK.rangeCeiling.
  return Math.min(LOCK.rangeCeiling, raw);
}
export function hitRange(u) {
  const f = LOCK.hitFactor[u.weaponClass] || LOCK.hitFactor.standard;
  return Math.min(LOCK.hitCeiling, u.range * f);
}

/**
 * Advance a hull's firing solution on the player.
 *
 * A lock is built, held and broken rather than being a boolean read off a target pointer.
 * Building it takes LOCK.lockTime inside the envelope, so a fast pass does not hand anyone
 * a solution; breaking it needs you outside `breakFactor` times that envelope, so a lock
 * does not flicker on and off while you sit exactly on the line.
 *
 * @returns {boolean} whether a firing solution is currently held.
 */
function updateLock(n, u, dPlayer2, see, dt) {
  const onPlayer = !!(u.target && u.target.isPlayer);
  if (!onPlayer) { u.lockT = 0; u.locked = false; return false; }

  const lock = lockRange(u, see);
  const brk = lock * LOCK.breakFactor;

  if (dPlayer2 <= lock * lock) {
    u.lockT = Math.min(LOCK.lockTime, (u.lockT || 0) + dt);
  } else if (dPlayer2 > brk * brk) {
    // Well outside: the solution collapses and the contact is dropped entirely.
    u.lockT = 0; u.locked = false; u.target = null;
    return false;
  } else {
    u.lockT = Math.max(0, (u.lockT || 0) - LOCK.decay * dt);
  }

  u.locked = u.lockT >= LOCK.lockTime;
  return u.locked;
}

function acquire(n, u, sig) {
  const see = detectionRange(u.sensor, sig === undefined ? 1 : sig);
  let best = null, bd = see * see;

  if (u.faction === 'hostile') {
    if (S.player.hull > 0 && !S.docked) {
      const d = n.position.distanceToSquared(S.player.position);
      if (d < bd) { bd = d; best = { position: S.player.position, vel: S.player.velocity, isPlayer: true }; }
    }
    best = scanFor(n, 'friendly', bd, best);
    if (!best) best = scanFor(n, 'worker', bd, best);   // miners are soft targets
  } else {
    // Coalition ships hunt pirates by default — and hunt *you* if you have made yourself
    // one. This is the point of the reputation system: the same patrol that escorted you
    // last week opens fire once your standing falls far enough.
    if (isHostileTo(blocOf(u.faction)) && S.player.hull > 0 && !S.docked) {
      const d = n.position.distanceToSquared(S.player.position);
      if (d < bd) { bd = d; best = { position: S.player.position, vel: S.player.velocity, isPlayer: true }; }
    }
    if (!best) best = scanFor(n, 'hostile', bd, best);
  }
  u.target = best;
}

function scanFor(n, faction, bd, best) {
  for (const o of S.world.npcs) {
    const ou = o.userData;
    if (ou.faction !== faction || ou.hp <= 0 || o === n) continue;
    const d = n.position.distanceToSquared(o.position);
    if (d < bd) { bd = d; best = { position: o.position, vel: ou.vel, npc: o }; }
  }
  return best;
}

function hunt(n, u, dt) {
  const tp = u.target.position;
  _dir.copy(tp).sub(n.position);
  const dist = _dir.length();
  // Contacts are dropped past the sensor envelope, not past some multiple of it. Anything
  // still inside is a contact; whether it is a *target* is what the lock decides.
  if (dist > u.sensor * 1.5) { u.target = null; u.lockT = 0; u.locked = false; return; }
  _dir.divideScalar(dist || 1);

  faceToward(n, tp, u.turn * dt);

  // Engagement envelope. Every ship used to fly one profile — close to 80% of range,
  // then orbit — regardless of what it was holding. A drone with a 430-unit scatter
  // gun and a bastion with an 1150-unit driver wanted the same distance, which is why
  // fights all felt the same. A brawler now gets inside and stays there; a standoff
  // hull holds the edge of its reach and refuses to be dragged in.
  const env = ENGAGE[u.profile] || ENGAGE.skirmish;
  // Stance widens the band it wants to hold. `press` scales by 1, so a ship that has
  // decided nothing flies the profile it always flew.
  const band = u.range * env.hold * bandScale(u);

  // Regrouping: still facing the fight and still shooting, but moving toward company
  // rather than toward the target. A wounded ship that runs *to* somebody is far more
  // dangerous than one that simply backs off, and it is what turns a scattered patrol
  // into a formation halfway through a fight.
  if (u.stance === 'regroup') {
    const { nearest } = support(n, u);
    if (nearest) moveToward(n, u, nearest.position, dt, 1);
  }
  else if (dist > band * 1.08) n.position.addScaledVector(_dir, u.speed * dt);
  else if (dist < band * 0.72) n.position.addScaledVector(_dir, -u.speed * dt);
  else {
    _tan.set(-_dir.z, 0, _dir.x).normalize();
    n.position.addScaledVector(_tan, u.speed * env.orbit * dt);
  }

  // Firing needs both a solution and the reach to use it. Against anything that is not
  // the player there is no lock model, so the range test alone stands in for it.
  const reach = hitRange(u);
  const solved = !u.target.isPlayer || u.locked;
  if (solved && dist < reach && S.time - u.lastShot > u.pcool && spendShot(u)) {
    u.lastShot = S.time;
    const tof = dist / u.pspeed;
    _aim.copy(tp);
    if (u.target.vel) _aim.addScaledVector(u.target.vel, tof);
    _aim.sub(n.position).normalize();
    // Shooting from the far edge of your reach costs you: damage falls off past the
    // envelope's hold band, which is what gives holding the right range a payoff
    // beyond simply not being shot.
    const power = u.dmg * rangeScale({ optimal: band, falloff: Math.max(1, reach - band) }, dist);
    fire(n.position, _aim, u.pspeed, power,
         u.faction === 'hostile' ? 'hostile' : 'friendly', u.color, { dtype: u.dtype });
    // Someone else's gun, heard from wherever you happen to be. Out of earshot it is
    // not played at all, which is also why a 63-ship firefight two systems' width away
    // costs nothing.
    sfx.fireAt(n.position, u.vel, u.size > 14);
  }
}

/**
 * Break off. Runs away from whatever it was fighting, and once it is far enough out it
 * stops being a contact at all: a ship that fled and then hung around at the edge of
 * sensors is a ship that did not really flee.
 *
 * It keeps its magazine and its damage. Nothing here heals or reloads — an NPC that got
 * away is a raider you will meet again in worse shape, which is more interesting than one
 * that quietly resets.
 */
function disengage(n, u, dt) {
  const from = (u.target && u.target.position) || S.player.position;
  _dir.copy(n.position).sub(from);
  const dist = _dir.length();
  if (dist > u.sensor * 1.6) { u.target = null; u.lockT = 0; u.locked = false; u.stance = 'press'; return; }
  _dir.divideScalar(dist || 1);
  n.position.addScaledVector(_dir, u.speed * dt);
  _aim.copy(n.position).addScaledVector(_dir, 120);
  faceToward(n, _aim, u.turn * dt);
}

function patrol(n, u, dt) {
  u.patrolAngle += 0.008 * dt;
  const tx = Math.cos(u.patrolAngle) * u.orbitR;
  const tz = Math.sin(u.patrolAngle) * u.orbitR;
  _dir.set(tx - n.position.x, -n.position.y * 0.02, tz - n.position.z);
  const len = _dir.length();
  if (len > 2) {
    _dir.divideScalar(len);
    n.position.addScaledVector(_dir, u.speed * 0.75 * dt);
    _aim.copy(n.position).addScaledVector(_dir, 100);
    faceToward(n, _aim, u.turn * dt);
  }
}

function faceToward(n, point, maxRadians) {
  _dummy.position.copy(n.position);
  _dummy.lookAt(point);
  n.quaternion.rotateTowards(_dummy.quaternion, maxRadians);
}

function moveToward(n, u, dest, step, speedMult = 1) {
  _dir.set(dest.x - n.position.x, dest.y - n.position.y, dest.z - n.position.z);
  const len = _dir.length();
  if (len < 2) return 0;
  _dir.divideScalar(len);
  n.position.addScaledVector(_dir, u.speed * speedMult * step);
  _aim.copy(n.position).addScaledVector(_dir, 120);
  faceToward(n, _aim, u.turn * step);
  return len;
}

/**
 * A hauler with an obligation flies it: out to whoever gave it the work, then to the
 * destination station, and the deal settles on arrival. A hauler without one runs a slow
 * circuit between stations, because a ship that only exists when it has a job is a ship the
 * player never sees idle — and a world where every hauler is always working is not a world
 * with an economy in it, it is a conveyor.
 *
 * The deal is the authority for where it goes. Nothing here decides anything: it reads the
 * ledger and flies to the next thing on it, which is why a deal that defaults while the
 * hauler is in transit simply stops being a destination.
 */
function haulerStep(n, u, step) {
  const mine = dealsFor(u.name).find(d => d.state === 'accepted');
  if (!mine) {
    // Idle circuit.
    if (!u.berth || n.position.distanceToSquared(u.berth.position) < 40000) {
      const list = S.world.stations;
      if (list.length) u.berth = list[Math.floor(wnext() * list.length)];
    }
    if (u.berth) moveToward(n, u, u.berth.position, step, 0.8);
    return;
  }

  if (mine.stage === 'pickup') {
    const src = S.world.npcs.find(x => x.userData && x.userData.name === mine.from);
    // A pickup whose counterparty is gone is not a pickup. The sweep will default it; in
    // the meantime the hauler stops flying to a corpse. A player job has no ship to fly to
    // — the pilot handed the load over at the dock, and their hold was debited then.
    const from = src ? src.position : null;
    if (!from) { loadRun(u, mine); mine.stage = 'deliver'; return; }
    if (moveToward(n, u, from, step, 1) < LOAD_RANGE) {
      // The cargo goes *aboard* here. Until v1.01.70 this stage was a waypoint and nothing
      // more: the mass appeared at the destination on settlement whether or not the ship
      // that was supposed to be carrying it ever existed.
      if (src.userData && holdMass(src.userData) > 0) {
        const off = unloadHold(src.userData, mine.commodity, mine.kg);
        if (off > 0) loadHold(u, mine.commodity, off);
      }
      loadRun(u, mine);
      mine.stage = 'deliver';
    }
    return;
  }

  const dest = S.world.stations.find(s => s.userData.name === mine.dest);
  if (!dest) { mine.stage = 'pickup'; return; }
  if (moveToward(n, u, dest.position, step, 1) < LOAD_RANGE) settle(mine);
}

const LOAD_RANGE = 260;

/**
 * Top the hauler up to what the deal says it is carrying.
 *
 * A deal is an obligation, not a manifest, and a hauler taking one from a station or from a
 * player at a dock has nowhere to lift the mass *from* — the goods exist, they are simply
 * not modelled as a source hold. So the run is loaded here, capped by the ship's own
 * capacity, which is the property that matters downstream: an overweight job is carried
 * short and delivers short rather than teleporting.
 */
function loadRun(u, deal) {
  const have = ((u.hold || {})[deal.commodity]) || 0;
  const want = Math.max(0, deal.kg - have);
  if (want > 0) loadHold(u, deal.commodity, Math.min(want, holdFree(u)));
}

/**
 * A miner's shift, in two halves.
 *
 * The old version had one: park on a rock and accumulate `u.mined`, a counter nothing ever
 * read. The ore came out of the belt — `mineAsteroid()` really does deplete it — and then
 * ceased to exist. So the belt was being worked by ships whose work had no destination, and
 * the market never saw a kilogram of it.
 *
 * Now the ore goes into a hold, and a full hold goes to a station and is sold, which moves
 * that station's book the same way the player's load does. That is the difference between a
 * populated belt and a decorative one — and it is also what makes a laden miner worth
 * intercepting, since the hold is real from the moment the beam is on.
 */
function minerStep(n, u, step) {
  // ── the run to market ──
  if (u.runningIn) {
    const berth = u.berth;
    if (!berth) { u.runningIn = false; return; }
    if (moveToward(n, u, berth.position, step, 1) < HOLD.sellRange) {
      const sold = unloadHold(u, 'ore', (u.hold || {}).ore || 0);
      // `selling: true` from the station's side — its stock rises and its price comes down.
      // The same flag, and the same easy mistake, as settlement in systems/deals.js.
      if (sold > 0) {
        // A contracted hull is working for someone. Before v1.01.90 the ore it cut was
        // sold into the station and the proceeds went nowhere at all — the objective was
        // a timer, and an extraction run produced a price movement and no revenue. The
        // company that is paying upkeep on this hull gets the money.
        const value = marketPrice(berth, 'ore') * sold;
        applyTrade(berth, 'ore', sold, true);
        if (u.contracted) creditExtraction(u.contracted, 'ore', sold, value, berth);
      }
      u.runningIn = false;
      u.berth = null;
    }
    return;
  }

  if (!u.rock || u.rock.ore <= 0) {
    u.locked = null;
    u.repick = (u.repick || 0) - step;
    if (u.repick <= 0) { u.repick = 3; u.rock = nearestAsteroid(n.position, 5000); }
    if (!u.rock) { patrol(n, u, step); return; }
  }
  const d = n.position.distanceTo(u.rock.position);
  if (d < 60 || u.locked) {
    // alongside: hold a fixed offset in the rock's frame — belt work is stationary,
    // and this is the same problem the ship's MATCH feature solves for the player
    if (!u.locked) u.locked = n.position.clone().sub(u.rock.position);
    n.position.copy(u.rock.position).add(u.locked);
    const cut = mineAsteroid(u.rock, HOLD.minerRate * step);
    loadHold(u, 'ore', cut);
    addBeam(n.position, u.rock.position);
    if (u.rock.ore <= 0) { u.rock = null; u.locked = null; }
    // Full enough to be worth the trip. Not *completely* full, so the last rock does not
    // have to line up exactly with the last kilogram of capacity.
    if (holdMass(u) >= holdCap(u) * HOLD.minerRunAt) {
      // A company hull runs its ore in to the company's own office when there is one, so
      // the loop the player asked for — cut until full, drop off, go again — lands
      // somewhere they can watch rather than at a station picked at random.
      const berth = u.contracted ? extractionBerth(u, n.position) : null;
      const list = S.world.stations;
      if (berth) { u.berth = berth; u.runningIn = true; u.locked = null; }
      else if (list.length) {
        u.berth = list[Math.floor(wnext() * list.length)];
        u.runningIn = true;
        u.locked = null;
      }
    }
  } else {
    moveToward(n, u, u.rock.position, step);
  }
}

function builderStep(n, u, step) {
  const site = u.site;
  if (!site || site.done) { patrol(n, u, step); return; }
  const home = u.homeStation ? u.homeStation.position : u.home;
  if (!home) { patrol(n, u, step); return; }
  const dest = u.phase === 'toSite' ? site.pos : home;
  const d = moveToward(n, u, dest, step);
  if (d < 70) {
    u.holdT = (u.holdT || 0) + step;
    if (u.phase === 'toSite') {
      addBeam(n.position, site.pos);
      if (u.holdT > 2) { u.holdT = 0; u.phase = 'toHome'; deliverToSite(site, SIM.deliverAmt); }
    } else if (u.holdT > 1.5) { u.holdT = 0; u.phase = 'toSite'; }
  }
}

function mercStep(n, u, step) {
  const c = u.contract;
  if (!c) { patrol(n, u, step); return; }

  if (c.kind === 'player') {
    if (S.player.hull <= 0 || S.docked) return;
    const tp = S.player.position;
    const dist = n.position.distanceTo(tp);
    if (S.sim.disabled) {                       // prey is dark — close and hold for boarding
      if (dist > 60) moveToward(n, u, tp, step);
      else faceToward(n, tp, u.turn * step);
      return;
    }
    faceToward(n, tp, u.turn * step);
    if (dist > u.range * 0.8) moveToward(n, u, tp, step);
    // Player-contract fire: the target *is* the player by definition, so the lock model
    // does not apply — range alone is the gate. The general hunt() path builds a solution
    // through acquire/updateLock; this branch never touches u.target, and reading
    // u.target.isPlayer here threw every frame a contract was live, parking the world
    // phase after DIAG.maxRepeats hits.
    const reach = hitRange(u);
    if (dist < reach && S.time - u.lastShot > u.pcool) {
      u.lastShot = S.time;
      const tof = dist / u.pspeed;
      _aim.copy(tp).addScaledVector(S.player.velocity, tof).sub(n.position).normalize();
      fire(n.position, _aim, u.pspeed, u.dmg, 'merc', u.color, { dtype: u.dtype });
    }
    return;
  }

  // contract on an NPC: run it down, then board (capture) or execute (kill)
  const tgt = c.target;
  if (!tgt || tgt.userData.hp <= 0 || S.world.npcs.indexOf(tgt) < 0) { u.contract = null; return; }
  const d = moveToward(n, u, tgt.position, step, 1.1);
  if (d < 150) {
    c.bt = (c.bt || 0) + step;
    addBeam(n.position, tgt.position);
    if (S.time - u.lastShot > 0.4) {            // muzzle flash theatre — the beam does the work
      u.lastShot = S.time;
      _aim.copy(tgt.position).sub(n.position).normalize();
      fire(n.position, _aim, u.pspeed, 0, 'fx', u.color);
    }
    if (c.bt > (c.mode === 'capture' ? 6 : 4)) {
      if (c.mode === 'kill') damageNpc(tgt, 1e5, false);
      else captureNpc(tgt, u.name);
      u.contract = null;
    }
  } else c.bt = 0;
}

/**
 * What the system currently supports, per type. Fixed counts meant the world had one
 * shape it always returned to: kill twelve pirates and twelve pirates came back, forever,
 * regardless of anything else happening. Pressure means the roster is an *outcome*.
 *
 * Pirates grow on undefended traffic — miners and builders in the field, plus whatever a
 * standing bastion supports. Patrols are dispatched in response to pirates, so a raid
 * wave draws a Coalition response and clearing the raiders lets the patrols thin out
 * again. Every band is bounded, because a feedback loop that can run away will.
 */
export function populationTargets() {
  const counts = {};
  for (const n of S.world.npcs) counts[n.userData.type] = (counts[n.userData.type] || 0) + 1;

  const workers = (counts.miner || 0) + (counts.builderC || 0);
  const claims = (S.sim.claims || []).length;
  const wantRaiders = workers * POP.piratePerWorker + claims * POP.claimPressure;
  const raidersOut = (counts.pirate || 0) + (counts.drone || 0);
  const wantPatrol = raidersOut * POP.patrolPerPirate + POP.patrolBase;

  const clampTo = (key, v) => {
    const b = POP.bounds[key];
    if (!b) return Math.round(v);
    return Math.round(Math.max(b[0], Math.min(b[1], v)));
  };

  return {
    counts,
    want: {
      pirate:   clampTo('pirate',   wantRaiders * 0.55),
      drone:    clampTo('drone',    wantRaiders * 0.45),
      patrol:   clampTo('patrol',   wantPatrol),
      miner:    clampTo('miner',    NPC_TYPES.miner.count),
      hauler:   clampTo('hauler',   NPC_TYPES.hauler.count),
      merc:     clampTo('merc',     NPC_TYPES.merc.count),
      builderC: clampTo('builderC', NPC_TYPES.builderC.count),
      builderP: clampTo('builderP', NPC_TYPES.builderP.count),
      command:  clampTo('command',  NPC_TYPES.command.count)
    }
  };
}

function topUpPopulation() {
  const { counts, want } = populationTargets();

  // One arrival per review, so a wave builds visibly instead of appearing at once.
  for (const key in want) {
    if ((counts[key] || 0) < want[key]) { spawnNpc(key); return; }
  }

  // Over quota: ships leave rather than accumulate. Only ones far from the player and
  // not currently fighting — a raider vanishing off your bow would be absurd.
  const rng = stream('population');
  if (!rng.chance(POP.decayChance)) return;
  for (const key in want) {
    if ((counts[key] || 0) <= want[key]) continue;
    for (let i = S.world.npcs.length - 1; i >= 0; i--) {
      const n = S.world.npcs[i], u = n.userData;
      if (u.type !== key || u.target) continue;
      // A ship the company signed or paid a yard to build is not ambient population. It
      // was culled like any other surplus miner, so a commissioned hull could evaporate
      // while it was out on an objective and the contract would close itself thirty
      // seconds later — the player's money gone, with a toast about losing contact.
      if (u.contracted) continue;
      if (n.position.distanceToSquared(S.player.position) < FAR2) continue;
      scene.remove(n);
      untrackInterp(n);
      S.world.npcs.splice(i, 1);
      return;
    }
  }
}

// ── the two tiers ────────────────────────────────────────────────────
//
// `systems/npc/shoal.js` holds nine hundred and fifty ships as records and asks for one to
// become real when the player gets close. These two functions are the seam.
//
// The rule that shapes both of them: **a promoted ship is not a new ship**. It carries the
// record's name, faction, role, hull damage and position, so meeting the same raider twice
// means meeting the same raider — and a hull you shot to a third and watched run is at a
// third when it comes back. Everything else about it is built exactly as `spawnNpc` builds
// it, so nothing downstream can tell which tier a hull arrived from.
//
// Neither touches the world RNG. `spawnNpc` draws its position and its name number from
// `wrand`, and calling it a thousand times over a session would walk that stream past every
// seeded decision the world makes afterwards. A record already knows where it is.

/**
 * Build a live hull from a shoal record.
 *
 * @param {object} rec
 * @returns {THREE.Group|null}
 */
export function spawnFromRecord(rec) {
  if (!rec) return null;
  const t = NPC_TYPES[rec.key];
  if (!t) return null;
  const g = buildMesh(rec.key, t, rec.name);
  g.position.copy(rec.position);
  // Deterministic on the record's own seed, so a ship that promotes, demotes and promotes
  // again does not come back with a different heading each time.
  const rng = makeRng(rec.seed >>> 0);
  const a = rng.next() * TAU;
  g.userData = {
    kind: 'ship', type: rec.key, role: rec.role, faction: rec.faction,
    name: rec.name,
    hp: rec.hp, maxHp: rec.maxHp || t.hp,
    speed: t.speed, turn: t.turn, sensor: t.sensor, range: t.range,
    dmg: t.dmg, pspeed: t.pspeed, pcool: t.pcool, color: t.color, size: t.size,
    dtype: t.dtype || 'kinetic', armorProfile: t.armorProfile || 'shield',
    profile: t.profile || 'skirmish',
    weaponClass: t.weaponClass || 'standard',
    lockT: 0, locked: false,
    bounty: t.bounty, salvage: t.salvage,
    lastShot: 0, nextScan: rng.next(), target: null, acc: 0,
    patrolAngle: rec.angle, orbitR: rec.orbitR, vel: new THREE.Vector3(),
    // The back-reference. It is what marks this hull as demotable and what the shoal
    // matches on when it takes the ship back — see `demotable()` there for the five kinds
    // of ship that are never taken back.
    shoalId: rec.id
  };
  // A shoal miner is at work like any other. Without this, promoting one next to a belt
  // gives you a mining ship flying a patrol circle past the rocks it is supposed to be on.
  if (rec.role === 'mine') {
    const rock = nearestAsteroid(g.position, 4000);
    if (rock) {
      g.userData.rock = rock;
      g.userData.locked = new THREE.Vector3(Math.cos(a) * 40, 0, Math.sin(a) * 40);
    }
  }
  scene.add(g);
  registerLod(g, t.size * 1.6, null, RENDER_RANGE.ship);
  trackInterp(g);
  S.world.npcs.push(g);
  return g;
}

/**
 * Take a live hull back out of the world. The record keeps its state; this frees the mesh.
 *
 * Order matters and is the same teardown `topUpPopulation` does when a surplus ship leaves:
 * out of the scene, out of interpolation, out of the roster. Leaving it in any one of those
 * is a leak that only shows up as a slow frame an hour later.
 */
export function despawnToRecord(n) {
  if (!n) return false;
  const i = S.world.npcs.indexOf(n);
  if (i < 0) return false;
  scene.remove(n);
  untrackInterp(n);
  S.world.npcs.splice(i, 1);
  return true;
}

// ── the factory ──────────────────────────────────────────────────────
//
// `systems/` needs hulls to come into being — a fleet contract signing one, worldsim raising
// a bastion — and used to import `spawnNpc` directly, which is the simulation reaching up
// into the entity layer it is supposed to sit below. Registered here instead, so the arrow
// points down. See `core/spawn.js`.
//
// **An explicit call, not an import side effect.** Registering at module scope looks tidier
// and is a trap: nothing under `systems/` imports this file any more — that was the point —
// so in any context that does not happen to load it, the factory is silently absent and a
// fleet contract quietly fails to lay a hull down. That is precisely what happened to
// `test/boardroom.mjs` the moment the port landed. A named boot step is greppable, and a
// caller that forgets it gets a null from `spawn()` rather than a mystery.
export function registerNpcFactories() {
  registerFactory('npc', spawnNpc);
  registerFactory('npc-population', createNpcs);
  // The two tiers. Registered rather than imported for the same reason as the rest —
  // `systems/npc/shoal.js` sits below this layer and may not reach up into it.
  registerFactory('npc-promote', spawnFromRecord);
  registerFactory('npc-demote', despawnToRecord);
}
