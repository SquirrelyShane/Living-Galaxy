/* LIVING GALAXY — turret hardpoints, contacts and ordnance.
 *
 * Two hardpoint classes share one target list:
 *   combat   — modes off / castle / passive / neutral / enemies / allies / ffa
 *   industrial (mining laser) — modes off / closest / overdrive
 *
 * CASTLE is the default: the guns stay cold until something puts energy into
 * your shields or hull, then they answer it and nothing else.
 *
 * NPC rounds used to be theatre: `npcTracer` fired damage-0 shots and
 * `stepShots` skipped anything whose faction began "npc", because the seed
 * had already decided who was going down before the fight started. They are
 * real now. An NPC round carries damage and a `target` — the id it was aimed
 * at — and it lands on that hull and nothing else, which keeps a crowded
 * engagement from turning into a friendly-fire lottery without needing a
 * relation lookup per round per contact. The hull's own integrity is the
 * source of truth (npc/flight.js gives every hull hp, shields and a gun off
 * its registry entry); the contact mirrors it both ways, exactly as corp
 * drones already did.
 */

import { DRAW, addCargo, applyDamage, holdRoom } from "./ship.js";
import { nearbyRocks, wearRock } from "./field.js";

export const MINE_YIELD = 0.5;   // 0.3.11: half the old gather rate

/** sim.js hangs the stow here: the cutter cannot reach setMiningMode from a leaf. */
export const miningHooks = { onHoldFull: null };

import { chunks, removeChunk } from "./debris.js";
import { goodName } from "./materials.js";
import { currentSystem } from "./bodies.js";
import { rngFromSeed } from "./generate.js";
import { traffic, HOSTILE_ROLES, LAW_ROLES } from "./npc/traffic.js";
import { npcDrones } from "./drones/npcdrones.js";
import { engagementAt, ENGAGE_R } from "./npc/battles.js";
import { notePlayerChoice, handsOff } from "./aria.js";

const PIRATE_RANGE = 950;           // a lurking pirate opens up on anyone this close
export const CONTACT_R = 50000;     // hulls beyond this are on the board, not on the contact list
const PIRATE_RATE = 1.1;            // seconds between rounds

export const COMBAT_RANGE = 1500;
export const MINE_RANGE = 1100;
export const MINE_RANGE_OD = 1900;
const OVERDRIVE_BONUS = 800;
const DRONE_RANGE = 1100;
/* What a drone's gun does.
 *
 * 0.3.34 took this from 7 to 4 — and the measurement behind that number was
 * wrong, because it measured THIS loop while the drones actually killing
 * people were firing from stepPirates below at 6 on a 1.16 s cycle. See the
 * note there. Reported twice, and right both times.
 *
 * 0.3.35, with the routing corrected so every drone in the sky is on this
 * number, and lowered again to 3 because it had been asked for twice. Against
 * a trainer, with the 0.3.34 pools: a seven-drone pack takes 27 s and a full
 * fifteen-drone surge 10 s. A mid-tier hull gets 63 s and 21 s.
 *
 * Raise it here if the belt ever feels toothless — 4 puts the trainer back to
 * 19 s and 8 s, which is where 0.3.34 meant to leave it. */
const DRONE_DMG = 3;
const DRONE_CD_MIN = 1.5, DRONE_CD_SPAN = 1.4;
const MAX_DRONES = 7;
const DRONE_SPAWN_R = 4200;
const DRONE_DESPAWN_R = 16000;
const DRONE_ACCEL = 62;
const DRONE_TOP = 320;

export const contacts = [];      // ships/drones/peers the turrets can see
export const shots = [];         // tracer pool
/* onHit(contact, damage, ownerId, time) — raised for every round that lands
 * on a contact, whoever fired it. npc/security.js listens so a hull being
 * worked over can put out a call; npc/combat.js listens so a hull that is
 * being shot at knows to run or answer. */
export const combatHooks = { onHit: null };
let lastCutNote = -1;

export const mining = { active: false, key: null, name: "", x: 0, y: 0, z: 0, r: 0, heat: 0, progress: 0, assayed: null };
export const turretAim = { combat: null, hasTarget: false, cooldown: 0, firing: false };

let droneSeed = 1;
let rng = Math.random;

export function resetCombat(seedKey) {
  contacts.length = 0;
  shots.length = 0;
  droneSeed = 1;
  rng = rngFromSeed(`${seedKey}:drones`);
  mining.active = false;
  mining.key = null;
  mining.progress = 0;
  turretAim.combat = null;
  turretAim.hasTarget = false;
}

function d3(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z);
}

/* ---- contacts ----------------------------------------------------------- */

/* The board is an ARRAY because everything that draws it or walks it wants an
 * array. It is also looked up by id three times a tick in syncContacts — once
 * per peer, once per hull, once per drone — and doing that with
 * `contacts.find()` is a linear scan with a fresh closure each time. In a busy
 * sky that is 120 hulls against a 120-entry board: fourteen thousand id
 * comparisons per pass, three passes, sixty times a second, on a phone.
 *
 * So syncContacts builds an index. The important part is that the index is
 * PRIVATE TO ONE CALL and rebuilt at the top of it.
 *
 * The first attempt at this kept the Map alive between calls and revalidated it
 * against `contacts.length`, on the theory that anything adding or removing a
 * contact changes the length. That is not true, and the failure is silent: swap
 * one contact for another — `contacts.length = 0` then push a different one, as
 * a test harness does and as any future caller might — and the length is
 * identical, the index is never rebuilt, and lookups return a contact that is
 * no longer on the board while missing the one that is.
 *
 * `contacts` is exported and anything can mutate it, so a long-lived index over
 * it cannot be validated cheaply without every mutator cooperating — and a
 * cache that is usually right is worse than no cache at all. Rebuilding once
 * per tick costs one O(n) pass and removes the whole class of problem: within a
 * call the index cannot go stale, because nothing else runs.
 */
const byId = new Map();
const liveNpc = new Set();
const liveCd = new Set();

/** One contact by id. Linear, and deliberately so — see the note above. */
export function contactById(id) {
  for (const c of contacts) if (c.id === id) return c;
  return null;
}

/** Push onto the board and into this call's index, so the next pass sees it. */
function addContact(c) {
  contacts.push(c);
  byId.set(c.id, c);
  return c;
}

/** Rebuilds the contact list: live peers plus whatever drones are around. */
export function syncContacts(ship, remotes, relationOf, time, dt) {
  /* one O(n) pass to index the board, then every lookup below is O(1). The
   * Sets are module-level and cleared rather than rebuilt, so a steady sky
   * allocates nothing in here at all. */
  byId.clear();
  for (const c of contacts) byId.set(c.id, c);
  liveNpc.clear(); liveCd.clear();

  /* peers */
  for (const r of remotes.values()) {
    let c = byId.get(r.id);
    if (!c) {
      c = addContact({ id: r.id, kind: "peer", name: r.name, hp: 100, shield: 100, radius: 3 });
    }
    c.name = r.name;
    c.x = r.x;
    c.y = r.y;
    c.z = r.z;
    c.relation = relationOf(r.id);
  }
  for (let i = contacts.length - 1; i >= 0; i--) {
    const c = contacts[i];
    if (c.kind === "peer" && !remotes.has(c.id)) contacts.splice(i, 1);
  }

  /* CRADLE captains working this sky — traders, miners, haulers, pickets */
  for (const n of traffic) {
    if (n.visible === false) continue; // docked inside a ring, in a lane, or shot down: off the board
    if (d3(n, ship.pos) > CONTACT_R) continue; // sensors do not reach: the board knows it, the turrets do not
    liveNpc.add(n.id);
    let c = byId.get(n.id);
    if (!c) {
      /* the hull's own numbers, not one size for a picket and an ore barge */
      c = addContact({ id: n.id, kind: "npc", name: n.name, hp: n.hp ?? 120, shield: n.shield ?? 40, radius: n.radius ?? 6 });
    }
    /* two-way: rounds that land on the contact land on the hull, and damage
     * the hull took out of contact range is already on it when it comes back */
    if (n.hp != null) {
      if (c.hp < n.hp) n.hp = c.hp; else c.hp = n.hp;
      if (c.shield < (n.shield ?? 0)) n.shield = c.shield; else c.shield = n.shield ?? 0;
    }
    c.radius = n.radius ?? c.radius;
    c.name = n.name;
    c.role = n.role;
    c.job = n.job;
    c.ship = n.ship;
    c.x = n.x;
    c.y = n.y;
    c.z = n.z;
    c.vx = n.vx ?? 0;
    c.vy = n.vy ?? 0;
    c.vz = n.vz ?? 0;
    c.yaw = n.yaw;
    c.pitch = n.pitch;
    /* relationOf() was called twice per hull per tick to answer one question */
    const rel = relationOf(n.id);
    c.relation = rel === "neutral" ? (LAW_ROLES.has(n.role) ? "ally" : HOSTILE_ROLES.has(n.role) ? "hostile" : "neutral") : rel;
    c.cooldown = c.cooldown ?? Math.random() * PIRATE_RATE;
  }
  for (let i = contacts.length - 1; i >= 0; i--) {
    const c = contacts[i];
    if (c.kind === "npc" && !liveNpc.has(c.id)) contacts.splice(i, 1);
  }

  /* the corporations' drones (drones/npcdrones.js): hostile holds' gun drones join the board as
   * hostile "drone" contacts inside contact range, so the sentry sees them and they shoot back */
  for (const u of npcDrones.units) {
    if (u.dockedAt || u.hp <= 0 || d3(u, ship.pos) > CONTACT_R) continue;
    liveCd.add(u.id);
    let c = byId.get(u.id);
    if (!c) c = addContact({ id: u.id, kind: u.hostile ? "drone" : "cdrone", name: u.name, hp: u.hp, shield: 0, radius: 3, corpDrone: u });
    c.x = u.x; c.y = u.y; c.z = u.z; c.vx = 0; c.vy = 0; c.vz = 0; c.yaw = u.yaw; c.pitch = u.pitch;
    c.relation = u.hostile ? "hostile" : relationOf(u.id) === "hostile" ? "hostile" : "neutral";
    c.stationId = u.home;
    if (c.hp < u.hp) u.hp = c.hp;   // rounds landed on the contact land on the drone
    c.hp = u.hp;
    c.cooldown = (c.cooldown ?? Math.random() * 3) - dt;
    /* a hold's gun drone shoots at anyone inside its port's water */
    if (u.hostile && u.role === "combat" && c.cooldown <= 0 && d3(u, ship.pos) < 900) { c.cooldown = 2.4 + Math.random(); fire(c, ship.pos, 560, 4, c.id, "hostile"); }
  }
  for (let i = contacts.length - 1; i >= 0; i--) {
    const c = contacts[i];
    if ((c.kind === "cdrone" || c.corpDrone) && !liveCd.has(c.id)) contacts.splice(i, 1);
  }
  stepDrones(ship, time, dt);
  stepPirates(ship, time, dt);
}

/* Pirates shoot back. A lurker takes anyone inside PIRATE_RANGE; once you
 * have joined an engagement (npc/battles.js) the whole wing takes you
 * inside ENGAGE_R. */
/* WHO IS SHOOTING, AND WITH WHAT.
 *
 * 0.3.35. This loop takes everything in HOSTILE_ROLES, and js/npc/rogues.js
 * puts "rogue" in that set — so the 0.3.30 nest wave drones, the ones that
 * actually swarm the belt, were firing on the PIRATE profile: 6 damage on a
 * 1.16 s cycle, 5.19 dps each. The ambient swarm this file spawns itself fires
 * 4 on a 2.2 s cycle, 1.82 dps.
 *
 * So a nest drone was doing 2.9x what a drone does, and 0.3.34's "drone
 * damage 7 -> 4" never touched the ones doing the killing. A fifteen-strong
 * surge was landing 78 dps on a hull with about 260 effective points behind
 * it. Reported twice, correctly, and the second time was still right.
 *
 * A machine that wandered out of a derelict is not a crewed raider, and now
 * it does not shoot like one. The profile is per role rather than one number
 * for everything hostile, so this cannot quietly happen again the next time
 * something is added to HOSTILE_ROLES. */
const HOSTILE_GUN = {
  /* a crewed hull hunting you: fast, and worse once its wing is on you */
  pirate: { dmg: 6, wing: 8, speed: 560, cd: () => PIRATE_RATE * (0.8 + Math.random() * 0.5) },
  /* a nest drone: the same gun the ambient swarm carries, because it is the
   * same kind of thing — and no wing bonus, because a wave is not a wing */
  rogue: { dmg: DRONE_DMG, wing: DRONE_DMG, speed: 520, cd: () => DRONE_CD_MIN + Math.random() * DRONE_CD_SPAN },
};
const DEFAULT_GUN = HOSTILE_GUN.pirate;

function stepPirates(ship, time, dt) {
  const e = engagementAt(time);
  const joined = Boolean(e?.joined && time < e.end);
  for (const c of contacts) {
    if (c.kind !== "npc" || !HOSTILE_ROLES.has(c.role) || c.hp <= 0) continue;
    c.cooldown -= dt;
    const d = d3(c, ship.pos);
    const inWing = joined && e.wing.includes(c.id);
    if (d > (inWing ? ENGAGE_R : PIRATE_RANGE)) continue;
    if (c.cooldown > 0) continue;
    const gun = HOSTILE_GUN[c.role] ?? DEFAULT_GUN;
    c.cooldown = gun.cd();
    fire(c, ship.pos, gun.speed, inWing ? gun.wing : gun.dmg, c.id, "hostile");
  }
}

/**
 * A round between two NPC hulls. `damage` of 0 keeps the old cosmetic
 * behaviour for anything that still wants theatre; anything above 0 is real
 * and will only ever land on `to`.
 */
export function npcTracer(from, to, faction = "npc", damage = 0, speed = 760, spread = 0) {
  const lead = 0.4;
  const j = spread ? () => (Math.random() - 0.5) * spread : () => 0;
  fire(
    from,
    { x: to.x + (to.vx ?? 0) * lead + j(), y: to.y + (to.vy ?? 0) * lead + j(), z: to.z + (to.vz ?? 0) * lead + j() },
    speed, damage, from.id, faction, null, damage > 0 ? to.id : null,
  );
}

function spawnDrone(ship) {
  const a = rng() * Math.PI * 2;
  const r = DRONE_SPAWN_R * (0.55 + rng() * 0.45);
  contacts.push({
    id: `drone-${droneSeed++}`,
    kind: "drone",
    name: "Rogue drone",
    relation: "hostile",
    x: ship.pos.x + Math.cos(a) * r,
    y: ship.pos.y + (rng() - 0.5) * 1200,
    z: ship.pos.z + Math.sin(a) * r,
    vx: 0,
    vy: 0,
    vz: 0,
    hp: 40 + rng() * 40,
    shield: 20,
    radius: 4,
    cooldown: rng() * 3,
  });
}

function stepDrones(ship, time, dt) {
  const belt = currentSystem.belt;
  const rad = Math.hypot(ship.pos.x, ship.pos.z);
  const nearBelt = belt && rad > belt.inner - 20000 && rad < belt.outer + 20000;
  const live = contacts.filter((c) => c.kind === "drone");
  if (nearBelt && live.length < MAX_DRONES && rng() < dt * 0.35) spawnDrone(ship);

  for (let i = contacts.length - 1; i >= 0; i--) {
    const c = contacts[i];
    if (c.kind !== "drone" || c.corpDrone) continue;
    const d = d3(c, ship.pos);
    if (d > DRONE_DESPAWN_R || c.hp <= 0) {
      if (c.hp <= 0 && !c.eaten) { // a hole's kill leaves nothing to salvage
        addCargo(ship, "steel", 4 + Math.round(rng() * 7));
        addCargo(ship, "wiring", 1 + Math.round(rng() * 3));
      }
      contacts.splice(i, 1);
      continue;
    }
    /* A guard under truce (toll paid over comms) holds station and holds fire. */
    if ((c.truceUntil ?? -1) > time) {
      c.x += c.vx * dt;
      c.y += c.vy * dt;
      c.z += c.vz * dt;
      continue;
    }
    /* Close to standoff range, then hold and shoot. */
    const want = 620;
    const k = d > want ? 1 : -0.4;
    const ux = (ship.pos.x - c.x) / (d || 1);
    const uy = (ship.pos.y - c.y) / (d || 1);
    const uz = (ship.pos.z - c.z) / (d || 1);
    const acc = DRONE_ACCEL * k;
    c.vx += ux * acc * dt;
    c.vy += uy * acc * dt;
    c.vz += uz * acc * dt;
    const sp = Math.hypot(c.vx, c.vy, c.vz);
    const cap = DRONE_TOP;
    if (sp > cap) {
      c.vx *= cap / sp;
      c.vy *= cap / sp;
      c.vz *= cap / sp;
    }
    c.x += c.vx * dt;
    c.y += c.vy * dt;
    c.z += c.vz * dt;
    c.cooldown -= dt;
    if (d < DRONE_RANGE && c.cooldown <= 0) {
      c.cooldown = DRONE_CD_MIN + rng() * DRONE_CD_SPAN;
      fire(c, ship.pos, 520, DRONE_DMG, c.id, "hostile");
    }
  }
}

/* ---- engagement rules --------------------------------------------------- */

function engages(mode, contact, ship, time) {
  switch (mode) {
    case "off":
    case "passive":
      return false;
    case "castle":
      return ship.lastHitBy === contact.id && time - ship.lastHitAt < (ship.tune?.retaliateFor ?? 22);
    case "neutral":
      return contact.relation === "neutral";
    case "enemies":
      return contact.relation === "hostile";
    case "allies":
      return contact.relation === "ally";
    case "ffa":
      return true;
    default:
      return false;
  }
}

/** Nearest contact the current rules allow us to shoot. */
export function pickCombatTarget(ship, time) {
  if (!ship.powered.turrets) return null;
  let best = null;
  let bestD = ship.tune?.turretRange ?? COMBAT_RANGE;
  for (const c of contacts) {
    if (c.hp <= 0) continue;
    const d = d3(c, ship.pos);
    if (d > bestD) continue;
    if (!engages(ship.turretMode, c, ship, time)) continue;
    best = c;
    bestD = d;
  }
  return best;
}

/** Tracked-but-not-engaged contact, so PASSIVE still earns its power. */
export function nearestContact(ship) {
  let best = null;
  let bestD = (ship.tune?.turretRange ?? COMBAT_RANGE) * 1.6;
  for (const c of contacts) {
    const d = d3(c, ship.pos);
    if (d < bestD) {
      best = c;
      bestD = d;
    }
  }
  return best;
}

/* ---- ordnance ----------------------------------------------------------- */

function fire(from, to, speed, damage, owner, faction, kind = null, target = null) {
  const d = d3(from, to) || 1;
  shots.push({
    target,
    x: from.x,
    y: from.y,
    z: from.z,
    vx: ((to.x - from.x) / d) * speed,
    vy: ((to.y - from.y) / d) * speed,
    vz: ((to.z - from.z) / d) * speed,
    life: kind === "missile" ? 6 : kind === "spinal" ? 4 : 3.2,
    damage,
    owner,
    faction,
    kind,
  });
  if (shots.length > 220) shots.splice(0, shots.length - 220);
}
/** A round from something that is not the player's ship: station mounts and drones (stationworks.js). */
export function fireRound(from, to, speed, damage, owner, faction, kind = null, target = null) { fire(from, to, speed, damage, owner, faction, kind, target); }

/** Closest approach of the segment travelled this tick to a point. */
function sweptMiss(px, py, pz, ax, ay, az, dx, dy, dz) {
  const len2 = dx * dx + dy * dy + dz * dz;
  let t = len2 > 0 ? ((px - ax) * dx + (py - ay) * dy + (pz - az) * dz) / len2 : 0;
  t = Math.max(0, Math.min(1, t));
  return Math.hypot(px - (ax + dx * t), py - (ay + dy * t), pz - (az + dz * t));
}

export function stepShots(ship, dt, time, onKill) {
  for (let i = shots.length - 1; i >= 0; i--) {
    const s = shots[i];
    const ax = s.x;
    const ay = s.y;
    const az = s.z;
    const dx = s.vx * dt;
    const dy = s.vy * dt;
    const dz = s.vz * dt;
    s.x += dx;
    s.y += dy;
    s.z += dz;
    s.life -= dt;
    if (s.life <= 0) {
      shots.splice(i, 1);
      continue;
    }
    /* An NPC round with no target is theatre (something still firing tracers);
     * one with a target is real, and lands on that hull alone. */
    if (s.faction.startsWith("npc")) {
      if (!s.target || s.damage <= 0) continue;
      /* through the index, never a scan: stepShots runs immediately after
       * syncContacts rebuilt it, and a target that is not on the board is a
       * round with nothing to land on */
      const c = byId.get(s.target);
      if (!c || c.hp <= 0) { if (!c) shots.splice(i, 1); continue; }
      if (sweptMiss(c.x, c.y, c.z, ax, ay, az, dx, dy, dz) < c.radius + 7) {
        const soak = Math.min(c.shield ?? 0, s.damage);
        c.shield = (c.shield ?? 0) - soak;
        const was = c.hp;
        c.hp -= s.damage - soak;
        shots.splice(i, 1);
        combatHooks.onHit?.(c, s.damage, s.owner, time);
        if (was > 0 && c.hp <= 0 && onKill) onKill(c, s);
      }
      continue;
    }
    /* Rounds move hundreds of units a frame, so test the whole segment. */
    if (s.faction === "hostile") {
      if (sweptMiss(ship.pos.x, ship.pos.y, ship.pos.z, ax, ay, az, dx, dy, dz) < 10) {
        /* a round is mass on a trajectory: kinetic, which is exactly what a
         * screen is worst at and plate is best at (js/defence.js) */
        applyDamage(ship, s.damage, s.owner, time, s.dmgKind ?? "kinetic");
        shots.splice(i, 1);
      }
      continue;
    }
    for (const c of contacts) {
      if (c.id === s.owner) continue;
      /* a port's guns and drones only ever hit what is hostile; your own rounds hit whatever they meet */
      if (s.faction === "station" && (c.relation !== "hostile" || c.kind === "sdrone")) continue;
      if (sweptMiss(c.x, c.y, c.z, ax, ay, az, dx, dy, dz) < c.radius + 7) {
        const soak = Math.min(c.shield ?? 0, s.damage);
        c.shield = (c.shield ?? 0) - soak;
        const was = c.hp;
        c.hp -= s.damage - soak;
        shots.splice(i, 1);
        /* somebody just shot somebody: whoever cares about that hears it here */
        combatHooks.onHit?.(c, s.damage, s.owner, time);
        if (was > 0 && c.hp <= 0 && onKill) onKill(c, s);
        break;
      }
    }
  }
}

/* ---- the turret tick ---------------------------------------------------- */

export function stepTurrets(ship, dt, time) {
  turretAim.firing = false;
  turretAim.cooldown -= dt;

  const tracked = ship.turretsArmed && ship.turretMode !== "off" ? nearestContact(ship) : null;
  const target = ship.turretsArmed ? pickCombatTarget(ship, time) : null;
  turretAim.combat = target ?? tracked;
  turretAim.hasTarget = Boolean(target);

  if (target && ship.powered.turrets && turretAim.cooldown <= 0) {
    /* Local gravity on gives the mounts something to brace against. */
    const rate = (ship.powered.gravity ? 0.42 : 0.52) / ((ship.tune?.turretRate ?? 1) * (ship.mods?.turret ?? 1));
    turretAim.cooldown = rate;
    turretAim.firing = true;
    const lead = 0.35;
    fire(
      ship.pos,
      {
        x: target.x + (target.vx ?? 0) * lead,
        y: target.y + (target.vy ?? 0) * lead,
        z: target.z + (target.vz ?? 0) * lead,
      },
      900,
      11,
      "self",
      "friendly",
    );
  }
  /* Faster cycling costs proportionally more on the bus. Billed for the whole
   * engagement, not only the tick a round leaves: a one-tick 19 kW spike
   * averaged under 1 kW and cost twice as much at 30 fps as at 60. */
  return target && ship.powered.turrets ? (DRAW.turretFire - DRAW.turrets) * (ship.tune?.turretRate ?? 1) : 0;
}

/* ---- mining ------------------------------------------------------------- */

/** Impact debris the cutter can reach, shaped like a belt rock so one loop mines both. */
function minableDebris(ship, range) {
  const out = [];
  for (const c of chunks) {
    const d = Math.hypot(c.x - ship.pos.x, c.y - ship.pos.y, c.z - ship.pos.z) - c.r;
    if (d > range) continue;
    if (c.r0 == null) c.r0 = c.r;
    out.push({
      key: c.id, debris: c, x: c.x, y: c.y, z: c.z, vx: c.vx, vy: c.vy, vz: c.vz, r: c.r,
      seed: c.seed ?? 0, ice: /ice/.test(c.good ?? ""), rich: false,
      ore: c.good ?? "iron_ore", oreName: goodName(c.good ?? "iron_ore"), worn: 1 - c.r / c.r0,
    });
  }
  return out;
}

/**
 * The cutter works whatever is in reach: belt rocks and impact debris alike.
 * A locked rock or chunk is preferred over the merely nearest one, so P-LOCK
 * picks the cut. `lock` is the sim's lock record ({kind, id, locked}).
 */
export function stepMining(ship, dt, time, lock = null, want = null) {
  mining.active = false;
  if (ship.miningMode === "off" || !ship.powered.mining) {
    mining.heat = Math.max(0, mining.heat - dt);
    mining.key = null;
    return;
  }
  const od = ship.miningMode === "overdrive";
  const base = ship.tune?.minerRange ?? MINE_RANGE;
  const range = od ? base + OVERDRIVE_BONUS : base;
  const rocks = [...nearbyRocks(ship.pos, time, 1), ...minableDebris(ship, range)];
  let best = null;
  let bestD = range;
  const wantKey = lock && (lock.kind === "asteroid" || lock.kind === "debris") ? lock.id : null;
  /* 0.3.22: `want` is an ore the pilot is under contract for, passed only while
   * something else is flying (the mining loop). A rock of that ore inside the
   * cutter's reach wins over a nearer rock of anything else — otherwise a loop
   * sent to cut nickel comes home with a hold of whatever it brushed past. It
   * is a preference, not a filter: with none in reach the cutter works the
   * belt as it always has, and a locked rock still overrides everything. */
  const hasWant = want ? rocks.some((r) => r.ore === want && Math.hypot(r.x - ship.pos.x, r.y - ship.pos.y, r.z - ship.pos.z) - r.r < range) : false;
  for (const r of rocks) {
    const d = Math.hypot(r.x - ship.pos.x, r.y - ship.pos.y, r.z - ship.pos.z) - r.r;
    if (d >= range) continue;
    if (wantKey && r.key === wantKey) { best = r; bestD = d; break; }
    if (hasWant && r.ore !== want) continue;
    if (d < bestD) {
      bestD = d;
      best = r;
    }
  }
  if (!best) {
    mining.key = null;
    mining.heat = Math.max(0, mining.heat - dt);
    return;
  }
  mining.active = true;
  mining.key = best.key;
  mining.x = best.x;
  mining.y = best.y;
  mining.z = best.z;
  mining.vx = best.vx ?? 0;
  mining.vy = best.vy ?? 0;
  mining.vz = best.vz ?? 0;
  mining.r = best.r;
  mining.dist = bestD;
  mining.heat = Math.min(1, mining.heat + dt * (od ? 1.6 : 0.9));

  /* 0.3.11 halved the pull. A hold used to fill faster than anything downstream
   * of it could consume — and now that ore is the input to a fabrication chain
   * rather than just a thing to sell, the cut rate is the tap on the whole
   * economy. One named constant, because this is the number to reach for when
   * the belt feels too generous or too mean. */
  const cut = (od ? 0.075 : 0.032) * dt;
  let worn;
  if (best.debris) {
    /* a chunk is finite: the cutter eats it down and it is gone */
    const c = best.debris;
    c.r = Math.max(0, c.r - c.r0 * cut * 2.2);
    worn = 1 - c.r / c.r0;
    if (c.r < Math.max(2, c.r0 * 0.08)) { removeChunk(c); worn = 1; }
  } else {
    worn = wearRock(best.key, cut);
  }
  /* Bigger rock, richer pull — same exponential logic as the worlds.
   * An overdriven cutter boils volatiles off an ice rock — faster, wasteful. */
  const boiloff = best.ice && od ? 0.75 : 1;
  const vein = best.rich ? 1.6 : 1;
  const yieldRate = (2.5 + Math.pow(best.r / 60, 1.5) * 5) * (od ? 2.1 : 1) * boiloff * vein * (ship.mods?.mine ?? 1) * MINE_YIELD;
  if (holdRoom(ship) > 0) {
    addCargo(ship, best.ore ?? "iron_ore", yieldRate * dt);
    /* what you actually point the cutter at, sampled rather than counted every
     * frame — one example a second is plenty and keeps the tally honest */
    if (!handsOff() && Math.floor(time) !== lastCutNote) { lastCutNote = Math.floor(time); notePlayerChoice("ore", best.ore ?? "iron_ore", 1); }
    /* the odd rock carries something better than what it looks like */
    if (best.seed > 0.86) addCargo(ship, best.ice ? "deuterium" : "platinum_ore", yieldRate * dt * (best.ice ? 0.05 : 0.12));
    mining.fullSince = 0;
  } else if (!mining.fullSince) {
    /* The hold is full and the cutter is still burning: power into a beam that
     * lands nothing. Stow it and say so, once per fill — the latch matters
     * because this runs every frame and a notice per frame is a strobe.
     * turrets.js is a leaf and may not import sim.js, so the actual stow goes
     * through the hook, which sim.js owns. */
    mining.fullSince = time;
    miningHooks.onHoldFull?.(mining.name || "ore");
  }
  mining.name = best.debris ? `${best.oreName} (debris)` : best.ice ? `${best.oreName} (ice)` : best.rich ? `${best.oreName} (VEIN)` : (best.oreName ?? "ore");
  /* the assay call every prospector lives for — sim picks this up and logs it */
  if (best.rich && mining.assayed !== best.key) {
    mining.assayed = best.key;
    mining.assay = `Assay: ${best.oreName} vein — rich cut, call it in`;
  }
  mining.progress = worn;
}
