import { traffic, vesselById, trafficHooks, markVesselDown, HOSTILE_ROLES, LAW_ROLES } from "./traffic.js";
import { armFlight, flyStep, faceAt } from "./flight.js";
import { npcTracer, contacts, contactById } from "../flight/turrets.js";
import { corpOfVessel, corpRelation } from "../corp/corps.js";
import { noteAttack, callForHelp } from "./security.js";
import { perf, tracerGate } from "../core/perf.js";

export const PROWL_R = 220000;
export const HUNT_R = 5200;
export const ENGAGE_R = 1500;
export const CLOSE_R = 12000;
export const STALK_TOP = 9000;
export const ALARM_R = 9000;
export const BREAK_R = 9000;
export const HUNT_FOR = 420;
export const FLEE_SPEED = 1.35;
export const FLEE_FOR = 90;
export const NEAR_R = 32000;
export const FAR_TICK = 2.0;
export const HIT_CHANCE = 0.42;

export const combatLog = [];
let farClock = 0;

export function resetNpcCombat() {
  combatLog.length = 0;
  farClock = 0;
}

const d3 = (a, b) => Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z);

export function hostileTo(a, b) {
  if (!a || !b || a === b || a.id === b.id) return false;
  if (b.job === "down" || a.job === "down") return false;
  const aH = HOSTILE_ROLES.has(a.role), bH = HOSTILE_ROLES.has(b.role);
  const aL = LAW_ROLES.has(a.role), bL = LAW_ROLES.has(b.role);
  if (a.rogue && b.rogue) return a.nest !== b.nest;
  if (a.rogue || b.rogue) return true;
  if (aH && bH) return false;
  if (aH) return true;
  if (bH) return aL || Boolean(a.gun);
  if (aL && bL) return false;
  const ca = corpOfVessel(a), cb = corpOfVessel(b);
  if (ca && cb && ca.id !== cb.id && corpRelation(ca, cb) <= -0.7) return true;
  return false;
}

function worth(n) {
  if (LAW_ROLES.has(n.role)) return 0.25;
  const cargo = n.carrying?.qty ?? n.cargo?.qty ?? 0;
  const base = n.role === "supply" ? 2.2 : n.role === "hauler" ? 2.0 : n.role === "trader" ? 1.6 : n.role === "miner" ? 1.2 : 0.8;
  return base + Math.min(1.6, cargo / 120);
}

function catchable(hunter, prey, d) {
  if (prey.drive && d > CLOSE_R) return false;
  if (d < CLOSE_R) return true;
  return prey.speed <= STALK_TOP * 0.55;
}

export function acquire(n, radius = HUNT_R) {
  let best = null, bestScore = 0;
  for (const m of traffic) {
    if (m === n || m.job === "down" || m.visible === false) continue;
    const dx = n.x - m.x, dy = n.y - m.y, dz = n.z - m.z;
    if (radius >= 0 && dx * dx + dy * dy + dz * dz > radius * radius) continue;
    if (!hostileTo(n, m)) continue;
    const d = d3(n, m);
    if (d > radius) continue;
    if (!catchable(n, m, d)) continue;
    if (m.huntedBy && m.huntedBy !== n.id && vesselById(m.huntedBy)?.hunt === m.id) continue;
    const score = worth(m) / (1 + d / radius);
    if (score > bestScore) { best = m; bestScore = score; }
  }
  return best;
}

export function setHunt(n, foe, t) {
  n.hunt = foe?.id ?? null;
  n.huntFrom = t;
  n.engagedWith = foe?.id ?? null;
  n.alarmed = false;
  if (foe) foe.huntedBy = n.id;
}

export function clearHunt(n) {
  const foe = n.hunt ? vesselById(n.hunt) : null;
  if (foe && foe.huntedBy === n.id) foe.huntedBy = null;
  n.hunt = null;
  n.engagedWith = null;
  n.alarmed = false;
}

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

export function combatFly(n, t, dt, ctx) {
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

  if (n.hunt) {
    const foe = vesselById(n.hunt);
    const d = foe ? d3(n, foe) : Infinity;
    const raider = HOSTILE_ROLES.has(n.role) || n.rogue;
    const reach = raider ? PROWL_R : BREAK_R;
    if (!foe || foe.job === "down" || d > reach || t - (n.huntFrom ?? t) > HUNT_FOR) {
      clearHunt(n);
      return false;
    }
    if (foe.drive && d > CLOSE_R) { clearHunt(n); return false; }
    armFlight(n);
    n.visible = true;
    n.toName = foe.name;

    if (d > CLOSE_R) {
      n.job = "hunting";
      const lead = Math.min(120, d / STALK_TOP);
      flyStep(n, dt, foe.x + (foe.vx ?? 0) * lead, foe.y + (foe.vy ?? 0) * lead, foe.z + (foe.vz ?? 0) * lead,
        { top: STALK_TOP, accel: STALK_TOP / 8, standoff: CLOSE_R * 0.6 });
      return true;
    }

    n.job = "engaged";
    if (!n.alarmed && d < ALARM_R && raider) {
      n.alarmed = true;
      callForHelp(foe, n, t, n.rogue ? "rogue" : "pirate");
      if (!foe.fleeFrom && !LAW_ROLES.has(foe.role) && !HOSTILE_ROLES.has(foe.role)) { foe.fleeFrom = n.id; foe.fleeAt = t; }
    }
    const stand = ENGAGE_R * 0.45;
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

function canShoot(n) {
  return Boolean(n.gun) && n.job !== "down" && n.visible !== false;
}

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

    const near = shipPos ? d3(n, shipPos) < NEAR_R : true;
    if (!near) continue;
    const dmg = n.gun.dmg * (n.gun.mounts ?? 1);
    const faction = HOSTILE_ROLES.has(n.role) || n.rogue ? "npc-pirate" : LAW_ROLES.has(n.role) ? "npc-law" : "npc";
    const wild = Math.random() > HIT_CHANCE;
    if (gate < 1 && Math.random() > gate && wild) continue;
    npcTracer(n, foe, faction, wild ? 0 : dmg, n.gun.speed, wild ? 90 : 0);
    combatHooksOut.onFire?.(n, foe, dmg);
  }
}

function stepFar(t, dt, shipPos) {
  farClock -= dt;
  if (farClock > 0) return;
  const slice = FAR_TICK - farClock;
  farClock = FAR_TICK;

  for (const n of traffic) {
    if (!canShoot(n)) continue;
    const foeId = n.hunt ?? n.engagedWith;
    if (!foeId) continue;
    if (shipPos && d3(n, shipPos) < NEAR_R) continue;
    const foe = vesselById(foeId);
    if (!foe || foe.job === "down") continue;
    if (d3(n, foe) > n.gun.range) continue;
    const dps = (n.gun.dmg * (n.gun.mounts ?? 1) / Math.max(0.2, n.gun.rate)) * HIT_CHANCE;
    damageHull(foe, dps * slice, n.id, t);
  }
}

let lookClock = 0;
const LOOK_TICK = 1.4;

function stepLook(t, dt, shipPos) {
  lookClock -= dt;
  if (lookClock > 0) return;
  lookClock = LOOK_TICK;

  for (const n of traffic) {
    if (n.job === "down" || n.hunt || n.fleeFrom || n.respondTo) continue;
    if (HOSTILE_ROLES.has(n.role) || n.rogue) {
      if (n.job === "docked" || n.visible === false) continue;
      const prey = acquire(n, PROWL_R);
      if (prey) setHunt(n, prey, t);
      continue;
    }
    if (LAW_ROLES.has(n.role)) {
      if (n.visible === false) continue;
      const foe = acquire(n, HUNT_R * 1.3);
      if (foe) setHunt(n, foe, t);
    }
  }
}

export function stepNpcCombat(t, dt, shipPos = null) {
  stepLook(t, dt, shipPos);
  stepGuns(t, dt, shipPos);
  stepFar(t, dt, shipPos);
}

export function mountNpcCombat() {
  const prev = trafficHooks.director;
  trafficHooks.director = (n, t, dt, ctx) => {
    if (combatFly(n, t, dt, ctx)) return true;
    return prev ? prev(n, t, dt, ctx) : false;
  };
}

export function combatReport() {
  let hunting = 0, fleeing = 0, engaged = 0;
  for (const n of traffic) {
    if (n.hunt) hunting++;
    if (n.fleeFrom) fleeing++;
    if (n.job === "engaged") engaged++;
  }
  return { hunting, fleeing, engaged, kills: combatLog.length, tier: perf.tier };
}
