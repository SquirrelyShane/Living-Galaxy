// Living Galaxy — the shoal. The other nine hundred and fifty ships.
//
// See `SHOAL` in `core/config/world.js` for why the population is two tiers. This file is
// the cheap tier and the machinery that moves ships between them.
//
// ## What a record is
//
// Eleven numbers and three strings. No mesh, no material, no LOD registration, no
// interpolation slot, no broadphase entry, no persona, no tactics. A record is stepped six
// times a second and its whole step is a couple of trigonometric calls, so nine hundred and
// fifty of them cost less than the asteroid belt does.
//
// ## Promotion is the whole contract
//
// A record is not a fake ship. It is a *claim that a ship is there*, and the claim is made
// good before anybody can check: promotion happens at 7,000 units, and the longest sensor in
// the game reaches 5,200 while a hull mesh is culled past 2,600. So by the time any
// instrument in the game could report on a ship, it is a real one — with a mesh, a persona,
// hit points and an opinion about you.
//
// That is why this file does not have to lie anywhere. The nav chart does not plot records;
// the contact list does not carry them; nothing can lock one. What the interface *does* say
// is how many hulls are in the system versus how many the array can resolve, which is a true
// statement about a real population and reads as a busy system rather than as a claim.
//
// ## Why demotion has hysteresis, and an exemption list
//
// A ship on the boundary that flips between a mesh and a number every few seconds is the
// most expensive possible state — every flip is a clone, a registration and a teardown. The
// gap between `promoteAt` and `demoteAt` is 2,800 units, which at a hull's cruise is the
// better part of a minute.
//
// The exemption list matters more. A hull that is **engaged, contracted, hired, dead or
// docked** is never demoted however far away it drifts, because those are exactly the ships
// whose absence would be noticed: a company hauler mid-extraction, a mercenary under
// contract to hunt you, a raider that has been shot and is running. Demoting one of those
// would not save a frame worth having.

import { S } from '../../core/state.js';
import { SHOAL, NPC_TYPES, ORBIT_SCALE } from '../../core/config.js';
import { makeRng, worldSeed } from '../../core/rng.js';
import { TAU } from '../../core/utils.js';
import { spawn } from '../../core/spawn.js';

const _v = new THREE.Vector3();
let stepAcc = 0;
let nextId = 1;

/** The records. Lives on `S.world` so a save and the diagnostics can both reach it. */
const shoal = () => (S.world.shoal || (S.world.shoal = []));

const ROLE = {
  merc: 'merc', miner: 'mine', hauler: 'haul',
  builderC: 'build', builderP: 'build', fort: 'fort'
};

function weighted(rng, table) {
  let total = 0;
  for (const row of table) total += row[1];
  let r = rng.next() * total;
  for (const row of table) { r -= row[1]; if (r <= 0) return row[0]; }
  return table[table.length - 1][0];
}

/**
 * Build the shoal.
 *
 * **Draws from its own stream, never the world stream.** `wrand`/`wnext` in
 * `entities/npcs.js` walk the shared world RNG, and every seeded decision made after them —
 * belt composition, ambush placement, faction rolls — depends on how many draws came before.
 * Adding nine hundred and fifty ships to that stream would silently move every one of them.
 * A dedicated stream makes the shoal *additive*: every existing seed produces exactly the
 * world it did in v1.02.56, with a thousand ships in it instead of sixty-seven.
 */
export function createShoal() {
  shoal().length = 0;
  nextId = 1;
  if (!SHOAL.enabled || !SHOAL.count) return 0;
  // `worldSeed()`, not `S.seed`. They are usually the same and `seedWorld()` is what
  // actually sets the generator — `S.seed` is a copy the boot path writes, and a caller that
  // seeded the world without updating it (every test harness, and `jump.js` before it
  // assigns) would build the same shoal for every system. Ask the generator what it is
  // seeded with rather than asking somebody's copy.
  const rng = makeRng((worldSeed() ^ 0x5104a1) >>> 0);

  // Where lanes run: the orbital radii that actually have something at them. A hauler that
  // shuttles between two arbitrary radii is a ship going nowhere; between two berths it is
  // trade.
  const berths = (S.world.bodies || [])
    .filter(b => b.userData && b.userData.kind === 'station')
    .map(b => b.userData.orbitRadius)
    .filter(r => r > 0)
    .sort((a, b) => a - b);

  for (let i = 0; i < SHOAL.count; i++) {
    shoal().push(makeRecord(rng, berths));
  }
  return shoal().length;
}

function makeRecord(rng, berths) {
  const key = weighted(rng, SHOAL.mix);
  const t = NPC_TYPES[key] || NPC_TYPES.hauler;
  const role = ROLE[key] || 'combat';
  const id = nextId++;

  const angle = rng.next() * TAU;
  const lo = t.spawn[0] * ORBIT_SCALE, hi = t.spawn[1] * ORBIT_SCALE;
  const orbitR = lo + rng.next() * Math.max(1, hi - lo);

  const rec = {
    id,
    key, role,
    faction: t.faction,
    // Named from the id rather than from a counter shared with the live roster, so a
    // promoted record cannot collide with an authored ship's name — two "Bulk Hauler 03"s
    // in one system is the kind of thing a player notices immediately.
    name: `${t.name} ${String(200 + id).padStart(3, '0')}`,
    hp: t.hp, maxHp: t.hp,
    angle,
    orbitR,
    y: (rng.next() - 0.5) * 220,
    // Angular rate, signed. A retrograde minority is free character and costs one bit.
    omega: (0.0006 + rng.next() * 0.0016) * (rng.next() < 0.12 ? -1 : 1) * (t.speed || 0.6),
    mode: 'orbit',
    live: null,          // the promoted group, while it is one
    position: new THREE.Vector3(),
    seed: (rng.next() * 0xffffffff) >>> 0
  };

  // Lane traffic. Only haulers, and only some of them — a system where every freighter is
  // in transit has no freighters at a berth, which is the wrong half of trade to show.
  if (key === 'hauler' && berths.length >= 2 && rng.next() < SHOAL.laneShare) {
    const a = Math.floor(rng.next() * berths.length);
    let b = Math.floor(rng.next() * berths.length);
    if (b === a) b = (a + 1) % berths.length;
    rec.mode = 'lane';
    rec.laneFrom = berths[a];
    rec.laneTo = berths[b];
    rec.laneT = rng.next();
    rec.laneDir = rng.next() < 0.5 ? 1 : -1;
    rec.laneRate = 1 / (SHOAL.laneSeconds[0] +
                        rng.next() * (SHOAL.laneSeconds[1] - SHOAL.laneSeconds[0]));
  } else if (role === 'mine' || role === 'build') {
    // Workers barely move. They are parked on something.
    rec.mode = 'work';
    rec.omega *= 0.15;
  }

  place(rec, 0);
  return rec;
}

/** Advance one record's rails and write its position. */
function place(rec, dt) {
  rec.angle += rec.omega * dt;
  if (rec.mode === 'lane') {
    rec.laneT += rec.laneRate * rec.laneDir * dt;
    if (rec.laneT > 1) { rec.laneT = 1; rec.laneDir = -1; }
    else if (rec.laneT < 0) { rec.laneT = 0; rec.laneDir = 1; }
    // Smoothstep, so a hauler eases off a berth and onto the next rather than crossing the
    // system at a constant radial rate. Cheap, and it is the difference between traffic and
    // a scanline.
    const k = rec.laneT * rec.laneT * (3 - 2 * rec.laneT);
    rec.orbitR = rec.laneFrom + (rec.laneTo - rec.laneFrom) * k;
  }
  rec.position.set(Math.cos(rec.angle) * rec.orbitR, rec.y, Math.sin(rec.angle) * rec.orbitR);
}

/**
 * Step the shoal, and move ships between the tiers.
 *
 * Called from the world phase. Records are stepped at `SHOAL.stepHz` rather than per frame:
 * they are on rails and their positions are analytic, so a coarser step is not an
 * approximation — accumulated `dt` gives exactly the same answer.
 */
export function updateShoal(dt) {
  if (!SHOAL.enabled) return;
  const list = shoal();
  if (!list.length) return;

  stepAcc += dt;
  const period = 1 / SHOAL.stepHz;
  if (stepAcc < period) return;
  const step = stepAcc;
  stepAcc = 0;

  const p = S.player.position;
  const promoteAt2 = SHOAL.promoteAt * SHOAL.promoteAt;
  const demoteAt2 = SHOAL.demoteAt * SHOAL.demoteAt;

  // Demote first, so the headroom freed this tick is available to the promotions below it.
  // The other order works too and spends a tick longer at the cap, which is exactly the
  // tick a player flying into traffic would notice.
  demotePass(demoteAt2, p);

  let promoted = 0;
  for (let i = 0; i < list.length; i++) {
    const rec = list[i];
    if (rec.live) continue;
    place(rec, step);
    if (promoted >= SHOAL.promotePerTick) continue;
    if (S.world.npcs.length >= SHOAL.liveCap) continue;
    if (rec.position.distanceToSquared(p) > promoteAt2) continue;
    if (promote(rec)) promoted++;
  }
}

function demotePass(demoteAt2, p) {
  const npcs = S.world.npcs;
  for (let i = npcs.length - 1; i >= 0; i--) {
    const n = npcs[i], u = n.userData;
    if (!u || u.shoalId == null) continue;              // authored cast is never demoted
    if (!demotable(u)) continue;
    if (n.position.distanceToSquared(p) < demoteAt2) continue;
    const rec = byId(u.shoalId);
    if (!rec) continue;
    // Carry the state back. A raider that was shot down to a third of its hull and then
    // ran must still be at a third when you meet it again, or "it got away" means nothing.
    rec.hp = Math.max(1, u.hp);
    rec.position.copy(n.position);
    rec.angle = Math.atan2(n.position.z, n.position.x);
    rec.orbitR = Math.hypot(n.position.x, n.position.z);
    rec.y = n.position.y;
    rec.live = null;
    spawn('npc-demote', n);
  }
}

/**
 * Ships that are never demoted, however far they drift.
 *
 * Each entry is a case where the ship's absence would be a visible lie rather than an
 * invisible saving — see the header.
 */
function demotable(u) {
  if (u.hp <= 0) return false;          // dying is a live event with a payout attached
  if (u.dockedAt) return false;         // parked inside a station the fleet layer owns
  if (u.contract) return false;         // hired, by the player or against them
  if (u.contractId) return false;       // under company contract
  if (u.target === S.player) return false;
  if (u.stance === 'flee') return false;
  return true;
}

function byId(id) {
  const list = shoal();
  for (let i = 0; i < list.length; i++) if (list[i].id === id) return list[i];
  return null;
}

/**
 * Make a record real.
 *
 * Through `core/spawn.js` rather than by importing `entities/npcs.js` directly, and that is
 * the layer contract rather than a preference: `entities/` sits **above** `systems/` — a
 * hull imports thirteen systems because an actor uses the rules, and rules do not use
 * actors. The registry is how the simulation says "a ship should exist here" without
 * knowing what building one involves. With nothing registered — a headless economy test, a
 * server tick — `spawn` returns null and the shoal simply never promotes, which is a
 * correct state rather than a fault.
 */
function promote(rec) {
  const g = spawn('npc-promote', rec);
  if (!g) return false;
  rec.live = g;
  return true;
}

// ── what is out there ────────────────────────────────────────────────

/**
 * The population, both tiers, by faction and role.
 *
 * This is what makes the second tier *visible* without faking a contact: the telemetry pane
 * can say "1,014 hulls in system, 38 resolved" and every number in that sentence is true.
 */
export function shoalReport() {
  const list = shoal();
  const byFaction = {};
  const byRole = {};
  let lanes = 0, live = 0;
  for (const r of list) {
    byFaction[r.faction] = (byFaction[r.faction] || 0) + 1;
    byRole[r.role] = (byRole[r.role] || 0) + 1;
    if (r.mode === 'lane') lanes++;
    if (r.live) live++;
  }
  for (const n of S.world.npcs) {
    const u = n.userData;
    if (!u || u.hp <= 0) continue;
    if (u.shoalId != null) continue;                   // already counted as its record
    byFaction[u.faction] = (byFaction[u.faction] || 0) + 1;
    byRole[u.role] = (byRole[u.role] || 0) + 1;
  }
  return {
    records: list.length,
    live: S.world.npcs.length,
    promoted: live,
    total: list.length + S.world.npcs.length - live,
    lanes,
    byFaction, byRole,
    cap: SHOAL.liveCap
  };
}

/** One line for the telemetry pane. Every number in it is a real ship. */
export function trafficLine(resolved) {
  const r = shoalReport();
  return `${r.total.toLocaleString()} hulls under way in this system · ` +
         `${r.live} within the simulation envelope · ` +
         `${resolved == null ? '—' : resolved} resolved by the array`;
}

/** Records only, for the suite and for a save. */
export const shoalRecords = () => shoal();

/** Drop everything. A jump, a new game, a load. */
export function resetShoal() {
  for (const rec of shoal()) rec.live = null;
  shoal().length = 0;
  stepAcc = 0;
  nextId = 1;
}
