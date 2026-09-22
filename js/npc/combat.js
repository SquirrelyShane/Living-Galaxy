/* LIVING GALAXY — NPC hulls that actually fight each other.
 *
 * What was here before was theatre with a verdict attached. `npc/battles.js`
 * rolled an engagement out of the sky seed, decided at roll time which hull
 * would be destroyed and when, flew everyone in decorative circles, and fired
 * damage-0 tracers between them until the clock reached the moment the seed
 * had already chosen. Nothing you did mattered unless you personally shot a
 * pirate, and nothing that happened out of your sight happened at all.
 *
 * Now the rounds decide. A pirate picks a target because it is worth taking,
 * closes on it, and fires real ordnance; the victim runs for the nearest
 * guns and puts out a call; whatever the directorate sends arrives when the
 * clock says it will and fights until one side is finished. Nobody knows the
 * outcome in advance, including this module.
 *
 * ---- near and far --------------------------------------------------------
 *
 * Simulating ballistics for every fight in a system, most of them hundreds of
 * kilometres from anyone who could see them, is work spent on nothing. So a
 * fight is resolved one of two ways depending on whether the player could
 * plausibly be watching it:
 *
 *   NEAR (inside sensor range)  real rounds, real flight, real misses. You
 *                               can fly into it, join it, finish it, or take
 *                               the loser's cargo out of the wreck.
 *   FAR                         resolved on the numbers, on a slow tick:
 *                               effective firepower against effective
 *                               integrity, with the same hp the near model
 *                               uses. A hull that loses a fight out of sight
 *                               is just as dead, and the survivor carries the
 *                               damage it took into the next one.
 *
 * The two agree because they share the hull's own numbers. Fly out to a fight
 * that started while you were elsewhere and you find it in progress, with the
 * damage already done still on the hulls.
 */

import { traffic, vesselById, trafficHooks, markVesselDown, HOSTILE_ROLES, LAW_ROLES } from "./traffic.js";
import { armFlight, flyStep, faceAt } from "./flight.js";
import { npcTracer, contacts, contactById } from "../turrets.js";
import { corpOfVessel, corpRelation } from "../corps.js";
import { noteAttack, callForHelp } from "./security.js";
import { perf, tracerGate } from "../perf.js";

/* ---- tuning -------------------------------------------------------------- */

/* A raider that only looks four kilometres finds nothing, ever. The sky is
 * hundreds of thousands of units across and traffic crosses it at speed, so a
 * pirate sitting on a belt claim waiting for something to wander past is a
 * pirate that never eats — which is exactly how the old sky behaved, and why
 * an "engagement" had to be scheduled out of the seed to make anything happen
 * at all.
 *
 * So a raider PROWLS. It picks something worth taking from most of the way
 * across the system, runs its own drive to get into the same volume, and
 * closes sublight for the kill. What it cannot do is catch a hull that is
 * already under drive mid-crossing — so it goes for the ends of a leg, where
 * traffic is slow, committed and close to a port. That is a real tactical
 * shape: the dangerous places are the approaches, and the safe part of a run
 * is the middle. */
export const PROWL_R = 220000;       // how far a raider will look for something worth taking
export const HUNT_R = 5200;          // and the range at which the law reacts to what is in front of it
export const ENGAGE_R = 1500;        // guns open inside this
export const CLOSE_R = 12000;        // inside this the stalk becomes an attack run
export const STALK_TOP = 9000;       // a raider's own drive, for getting into the same volume
export const ALARM_R = 9000;         // the victim notices it is being stalked at about here
export const BREAK_R = 9000;         // an engaged hull gives up past this
export const HUNT_FOR = 420;         // and a stalk expires after this long regardless
export const FLEE_SPEED = 1.35;      // a running hull's cruise multiplier
export const FLEE_FOR = 90;          // how long a hull keeps running after the last round
export const NEAR_R = 32000;         // inside this of the player, fights fly real rounds
export const FAR_TICK = 2.0;         // seconds between abstract resolutions
export const HIT_CHANCE = 0.42;      // fraction of aimed rounds that connect, near and far alike

export const combatLog = [];         // recent kills, for the news desk and the console
let farClock = 0;

export function resetNpcCombat() {
  combatLog.length = 0;
  farClock = 0;
}

const d3 = (a, b) => Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z);

/* ---- who is somebody's enemy --------------------------------------------- */

/**
 * Whether `a` would shoot `b`. Role first — a pirate takes honest traffic and
 * the law takes pirates — then the corporations' own quarrels, so two outfits
 * at war really do open up on each other's hulls.
 */
export function hostileTo(a, b) {
  if (!a || !b || a === b || a.id === b.id) return false;
  if (b.job === "down" || a.job === "down") return false;
  const aH = HOSTILE_ROLES.has(a.role), bH = HOSTILE_ROLES.has(b.role);
  const aL = LAW_ROLES.has(a.role), bL = LAW_ROLES.has(b.role);
  /* Two nests building drones out of the same belt are competitors, so rogue
   * fights rogue when the nests differ — and a drone never shoots one of its
   * own wave, however crowded the engagement gets. */
  if (a.rogue && b.rogue) return a.nest !== b.nest;
  if (a.rogue || b.rogue) return true;
  if (aH && bH) return false;                   // raiders do not eat each other
  if (aH) return true;                          // a pirate takes anything honest
  if (bH) return aL || Boolean(a.gun);          // everyone else shoots back at raiders
  if (aL && bL) return false;
  const ca = corpOfVessel(a), cb = corpOfVessel(b);
  if (ca && cb && ca.id !== cb.id && corpRelation(ca, cb) <= -0.7) return true;
  return false;
}

/** How rich a target is — a pirate would rather take a laden hauler than a picket. */
function worth(n) {
  if (LAW_ROLES.has(n.role)) return 0.25;
  const cargo = n.carrying?.qty ?? n.cargo?.qty ?? 0;
  const base = n.role === "supply" ? 2.2 : n.role === "hauler" ? 2.0 : n.role === "trader" ? 1.6 : n.role === "miner" ? 1.2 : 0.8;
  return base + Math.min(1.6, cargo / 120);
}

/**
 * Can `hunter` realistically get its guns onto `prey`? A hull with its drive
 * lit mid-crossing is doing tens of thousands of units a second and nothing
 * is going to run it down; one on a port approach is doing a few hundred and
 * is committed to a lane. This is what pushes raiders onto the approaches.
 */
function catchable(hunter, prey, d) {
  if (prey.drive && d > CLOSE_R) return false;
  if (d < CLOSE_R) return true;
  return prey.speed <= STALK_TOP * 0.55;
}

/* ---- acquisition --------------------------------------------------------- */

/** Best thing within reach for `n` to attack, or null. */
export function acquire(n, radius = HUNT_R) {
  let best = null, bestScore = 0;
  for (const m of traffic) {
    if (m === n || m.job === "down" || m.visible === false) continue;
    if (!hostileTo(n, m)) continue;
    const d = d3(n, m);
    if (d > radius) continue;
    if (!catchable(n, m, d)) continue;
    /* somebody else's problem: a wing of four on one trader is not a sky, it
     * is a pile-on, and it strips the lanes bare in minutes */
    if (m.huntedBy && m.huntedBy !== n.id && vesselById(m.huntedBy)?.hunt === m.id) continue;
    /* close and fat beats far and empty */
    const score = worth(m) / (1 + d / radius);
    if (score > bestScore) { best = m; bestScore = score; }
  }
  return best;
}

/** Put `n` onto `foe`. */
export function setHunt(n, foe, t) {
  n.hunt = foe?.id ?? null;
  n.huntFrom = t;
  n.engagedWith = foe?.id ?? null;
  n.alarmed = false;
  if (foe) foe.huntedBy = n.id;
}

/** `n` breaks off. */
export function clearHunt(n) {
  const foe = n.hunt ? vesselById(n.hunt) : null;
  if (foe && foe.huntedBy === n.id) foe.huntedBy = null;
  n.hunt = null;
  n.engagedWith = null;
  n.alarmed = false;
}

/* ---- damage -------------------------------------------------------------- */

/**
 * The one place a hull loses integrity, whoever fired and however the fight is
 * being resolved. Raises the alarm, and hands the kill to `onDown`.
 */
export function damageHull(n, amount, byId, t) {
  if (!n || n.job === "down" || amount <= 0) return false;
  const by = byId ? vesselById(byId) : null;
  let left = amount;
  const soak = Math.min(n.shield ?? 0, left);
  n.shield = (n.shield ?? 0) - soak;
  left -= soak;
  n.hp = (n.hp ?? 1) - left;
  n.lastHitBy = byId ?? null;
  n.lastHitAt = t;
  /* being shot at is the thing that makes a hull do something other than its
   * timetable: run, shoot back, and get on the radio */
  if (!HOSTILE_ROLES.has(n.role) && !n.rogue) {
    noteAttack(n.id, by ?? (byId === "self" ? { id: "self", name: "an unidentified hull", player: true } : null), t,
      by?.rogue ? "rogue" : by && HOSTILE_ROLES.has(by.role) ? "pirate" : byId === "self" ? "player" : "unknown");
    if (!n.fleeFrom && !LAW_ROLES.has(n.role)) { n.fleeFrom = byId; n.fleeAt = t; }
  }
  if (LAW_ROLES.has(n.role) && by && !n.hunt) setHunt(n, by, t);
  if (n.hp <= 0) { downHull(n, byId, t); return true; }
  return false;
}

function downHull(n, byId, t) {
  markVesselDown(n.id, t);
  combatLog.push({ id: n.id, name: n.name, role: n.role, by: byId, at: t, x: n.x, y: n.y, z: n.z });
  if (combatLog.length > 40) combatLog.splice(0, combatLog.length - 40);
  combatHooksOut.onDown?.(n, byId, t);
}

export const combatHooksOut = { onDown: null, onFire: null };

/* ---- the flying ---------------------------------------------------------- */

/**
 * A hull with a fight on is flown by this instead of by its timetable.
 * Returns true if it took the hull over.
 */
export function combatFly(n, t, dt, ctx) {
  /* running */
  if (n.fleeFrom) {
    const foe = vesselById(n.fleeFrom);
    const stale = t - (n.lastHitAt ?? n.fleeAt ?? t) > FLEE_FOR;
    if (!foe || foe.job === "down" || stale || d3(n, foe) > BREAK_R) {
      n.fleeFrom = null;
      return false;
    }
    armFlight(n);
    n.job = "fleeing";
    n.toName = foe.name;
    n.visible = true;
    /* toward the nearest thing with guns on it if there is one, else flat out
     * away — a hull running for a port is a hull the port's batteries can cover */
    const haven = nearestHaven(n, ctx?.stations);
    const top = (n.fly.top || 400) * FLEE_SPEED;
    if (haven) flyStep(n, dt, haven.x, haven.y, haven.z, { top, evade: 1 });
    else {
      const ux = n.x - foe.x, uy = n.y - foe.y, uz = n.z - foe.z;
      const l = Math.hypot(ux, uy, uz) || 1;
      flyStep(n, dt, n.x + (ux / l) * 20000, n.y + (uy / l) * 20000, n.z + (uz / l) * 20000, { top, evade: 1 });
    }
    return true;
  }

  /* hunting */
  if (n.hunt) {
    const foe = vesselById(n.hunt);
    const d = foe ? d3(n, foe) : Infinity;
    const raider = HOSTILE_ROLES.has(n.role) || n.rogue;
    /* a raider will follow across the system; anything else only fights what
     * is in front of it */
    const reach = raider ? PROWL_R : BREAK_R;
    if (!foe || foe.job === "down" || d > reach || t - (n.huntFrom ?? t) > HUNT_FOR) {
      clearHunt(n);
      return false;
    }
    /* it got its drive lit and is gone: not worth the fuel */
    if (foe.drive && d > CLOSE_R) { clearHunt(n); return false; }
    armFlight(n);
    n.visible = true;
    n.toName = foe.name;

    if (d > CLOSE_R) {
      /* the stalk: its own drive, aimed at where the target is going to be
       * rather than where it is, because a stern chase never closes */
      n.job = "hunting";
      const lead = Math.min(120, d / STALK_TOP);
      flyStep(n, dt, foe.x + (foe.vx ?? 0) * lead, foe.y + (foe.vy ?? 0) * lead, foe.z + (foe.vz ?? 0) * lead,
        { top: STALK_TOP, accel: STALK_TOP / 8, standoff: CLOSE_R * 0.6 });
      return true;
    }

    /* the attack run */
    n.job = "engaged";
    /* close enough that the victim knows: this is where the radio call goes
     * out, not the moment a raider a hundred kilometres away thought about it */
    if (!n.alarmed && d < ALARM_R && raider) {
      n.alarmed = true;
      callForHelp(foe, n, t, n.rogue ? "rogue" : "pirate");
      if (!foe.fleeFrom && !LAW_ROLES.has(foe.role) && !HOSTILE_ROLES.has(foe.role)) { foe.fleeFrom = n.id; foe.fleeAt = t; }
    }
    const stand = ENGAGE_R * 0.45;
    /* A raider has to be able to STAY on what it is shooting at. Sublight
     * cruise for a laden hauler runs to a couple of thousand units a second,
     * and an attack run pinned at its own nominal speed simply falls behind,
     * breaks off, re-stalks, and never lands a round. The run speed tracks the
     * target's, with enough margin to close the last of the gap. */
    n.fly.top = Math.max(760, n.fly.accel * 9, (foe.speed ?? 0) * 1.3 + 260);
    flyStep(n, dt, foe.x, foe.y, foe.z, {
      standoff: d < stand * 1.4 ? stand : 0,
      evade: d < ENGAGE_R ? 0.7 : 0,
      match: d < stand * 2 ? { vx: foe.vx ?? 0, vy: foe.vy ?? 0, vz: foe.vz ?? 0 } : null,
    });
    if (d < ENGAGE_R) faceAt(n, dt, foe.x, foe.y, foe.z);
    return true;
  }
  return false;
}

/** The nearest thing a frightened hull would rather be near: a friendly port. */
function nearestHaven(n, stationList) {
  if (!stationList) return null;
  let best = null, bestD = 90000;
  for (const st of stationList) {
    if (!st || st.sector === "pirate" || st.hostile) continue;
    const d = d3(n, st);
    if (d < bestD) { best = st; bestD = d; }
  }
  return best;
}

/* ---- gunnery ------------------------------------------------------------- */

function canShoot(n) {
  return Boolean(n.gun) && n.job !== "down" && n.visible !== false;
}

/** Everyone with a target in range takes their shot. Near field only. */
function stepGuns(t, dt, shipPos) {
  const gate = tracerGate();
  for (const n of traffic) {
    if (!canShoot(n)) continue;
    const foeId = n.hunt ?? n.engagedWith;
    if (!foeId) continue;
    const foe = vesselById(foeId);
    if (!foe || foe.job === "down" || foe.visible === false) continue;
    const d = d3(n, foe);
    if (d > n.gun.range) continue;
    n.gun.cool = (n.gun.cool ?? 0) - dt;
    if (n.gun.cool > 0) continue;
    n.gun.cool = n.gun.rate * (0.8 + Math.random() * 0.45);

    /* inside sensor range the round is a real object that can miss; outside
     * it, the far tick has already accounted for this hull's firepower and
     * drawing a tracer nobody can see is pure cost */
    const near = shipPos ? d3(n, shipPos) < NEAR_R : true;
    if (!near) continue;
    const dmg = n.gun.dmg * (n.gun.mounts ?? 1);
    const faction = HOSTILE_ROLES.has(n.role) || n.rogue ? "npc-pirate" : LAW_ROLES.has(n.role) ? "npc-law" : "npc";
    /* spread stands in for gunnery: a fraction of rounds are aimed to miss */
    const wild = Math.random() > HIT_CHANCE;
    if (gate < 1 && Math.random() > gate && wild) continue;   // thin the misses first when the budget is tight
    npcTracer(n, foe, faction, wild ? 0 : dmg, n.gun.speed, wild ? 90 : 0);
    combatHooksOut.onFire?.(n, foe, dmg);
  }
}

/* ---- the far field ------------------------------------------------------- */

/**
 * Fights the player cannot see, settled on the numbers. Runs on a slow tick
 * and touches only hulls that are actually engaged, so an empty sky costs
 * nothing and a busy one costs a handful of multiplications.
 */
function stepFar(t, dt, shipPos) {
  farClock -= dt;
  if (farClock > 0) return;
  const slice = FAR_TICK - farClock;
  farClock = FAR_TICK;

  for (const n of traffic) {
    if (!canShoot(n)) continue;
    const foeId = n.hunt ?? n.engagedWith;
    if (!foeId) continue;
    if (shipPos && d3(n, shipPos) < NEAR_R) continue;      // the near model already handled it
    const foe = vesselById(foeId);
    if (!foe || foe.job === "down") continue;
    if (d3(n, foe) > n.gun.range) continue;
    /* effective firepower over the slice, with the same hit fraction the
     * ballistic model gets, so a fight resolves to the same place either way */
    const dps = (n.gun.dmg * (n.gun.mounts ?? 1) / Math.max(0.2, n.gun.rate)) * HIT_CHANCE;
    damageHull(foe, dps * slice, n.id, t);
  }
}

/* ---- acquisition tick ---------------------------------------------------- */

let lookClock = 0;
const LOOK_TICK = 1.4;               // how often a hull sweeps for something to attack

function stepLook(t, dt, shipPos) {
  lookClock -= dt;
  if (lookClock > 0) return;
  lookClock = LOOK_TICK;

  for (const n of traffic) {
    if (n.job === "down" || n.hunt || n.fleeFrom || n.respondTo) continue;
    if (HOSTILE_ROLES.has(n.role) || n.rogue) {
      /* raiders hunt from a lurk or a patrol, not while docked */
      if (n.job === "docked" || n.visible === false) continue;
      const prey = acquire(n, PROWL_R);
      /* no call goes out here: being picked out from two hundred kilometres
       * away is not something the victim can know. The radio call happens when
       * the raider is close enough to be seen coming (combatFly, ALARM_R). */
      if (prey) setHunt(n, prey, t);
      continue;
    }
    if (LAW_ROLES.has(n.role)) {
      /* the law does not need to be asked about something in front of it */
      if (n.visible === false) continue;
      const foe = acquire(n, HUNT_R * 1.3);
      if (foe) setHunt(n, foe, t);
    }
  }
}

/* ---- the tick ------------------------------------------------------------ */

export function stepNpcCombat(t, dt, shipPos = null) {
  stepLook(t, dt, shipPos);
  stepGuns(t, dt, shipPos);
  stepFar(t, dt, shipPos);
}

/** Install the flight director. Chain-safe. */
export function mountNpcCombat() {
  const prev = trafficHooks.director;
  trafficHooks.director = (n, t, dt, ctx) => {
    if (combatFly(n, t, dt, ctx)) return true;
    return prev ? prev(n, t, dt, ctx) : false;
  };
}

/** For the console: what is actually happening out there. */
export function combatReport() {
  let hunting = 0, fleeing = 0, engaged = 0;
  for (const n of traffic) {
    if (n.hunt) hunting++;
    if (n.fleeFrom) fleeing++;
    if (n.job === "engaged") engaged++;
  }
  return { hunting, fleeing, engaged, kills: combatLog.length, tier: perf.tier };
}
