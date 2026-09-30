import { DRAW, addCargo, applyDamage, holdRoom } from "./ship.js";
import { nearbyRocks, wearRock } from "../world/field.js";

export const MINE_YIELD = 0.38;

export const miningHooks = { onHoldFull: null };

import { chunks, removeChunk } from "../world/debris.js";
import { goodName } from "../economy/materials.js";
import { currentSystem } from "../world/bodies.js";
import { rngFromSeed } from "../world/generate.js";
import { traffic, HOSTILE_ROLES, LAW_ROLES } from "../npc/traffic.js";
import { npcDrones } from "../drones/npcdrones.js";
import { engagementAt, ENGAGE_R } from "../npc/battles.js";
import { notePlayerChoice, handsOff } from "../aria/aria.js";

const PIRATE_RANGE = 950;
export const CONTACT_R = 50000;
const PIRATE_RATE = 1.1;

export const COMBAT_RANGE = 1500;
export const MINE_RANGE = 1100;
export const MINE_RANGE_OD = 1900;
const OVERDRIVE_BONUS = 800;
const DRONE_RANGE = 1100;
const DRONE_DMG = 3;
const DRONE_CD_MIN = 1.5, DRONE_CD_SPAN = 1.4;
const MAX_DRONES = 7;
const DRONE_SPAWN_R = 4200;
const DRONE_DESPAWN_R = 16000;
const DRONE_ACCEL = 62;
const DRONE_TOP = 320;

export const contacts = [];
export const shots = [];
export const combatHooks = { onHit: null, onFire: null };
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

const byId = new Map();
const liveNpc = new Set();
const liveCd = new Set();

export function contactById(id) {
  for (const c of contacts) if (c.id === id) return c;
  return null;
}

function addContact(c) {
  contacts.push(c);
  byId.set(c.id, c);
  return c;
}

export function syncContacts(ship, remotes, relationOf, time, dt) {
  byId.clear();
  for (const c of contacts) byId.set(c.id, c);
  liveNpc.clear(); liveCd.clear();

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

  for (const n of traffic) {
    if (n.visible === false) continue;
    if (d3(n, ship.pos) > CONTACT_R) continue;
    liveNpc.add(n.id);
    let c = byId.get(n.id);
    if (!c) {
      c = addContact({ id: n.id, kind: "npc", name: n.name, hp: n.hp ?? 120, shield: n.shield ?? 40, radius: n.radius ?? 6 });
    }
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
    const rel = relationOf(n.id);
    c.relation = rel === "neutral" ? (LAW_ROLES.has(n.role) ? (ship.outlaw ? "hostile" : "ally") : HOSTILE_ROLES.has(n.role) ? "hostile" : "neutral") : rel;
    c.cooldown = c.cooldown ?? Math.random() * PIRATE_RATE;
  }
  for (let i = contacts.length - 1; i >= 0; i--) {
    const c = contacts[i];
    if (c.kind === "npc" && !liveNpc.has(c.id)) contacts.splice(i, 1);
  }

  for (const u of npcDrones.units) {
    if (u.dockedAt || u.hp <= 0 || d3(u, ship.pos) > CONTACT_R) continue;
    liveCd.add(u.id);
    let c = byId.get(u.id);
    if (!c) c = addContact({ id: u.id, kind: u.hostile ? "drone" : "cdrone", name: u.name, hp: u.hp, shield: 0, radius: 3, corpDrone: u });
    c.x = u.x; c.y = u.y; c.z = u.z; c.vx = 0; c.vy = 0; c.vz = 0; c.yaw = u.yaw; c.pitch = u.pitch;
    c.relation = u.hostile ? "hostile" : relationOf(u.id) === "hostile" ? "hostile" : "neutral";
    c.stationId = u.home;
    if (c.hp < u.hp) u.hp = c.hp;
    c.hp = u.hp;
    c.cooldown = (c.cooldown ?? Math.random() * 3) - dt;
    if (u.hostile && u.role === "combat" && c.cooldown <= 0 && d3(u, ship.pos) < 900) { c.cooldown = 2.4 + Math.random(); fire(c, ship.pos, 560, 4, c.id, "hostile"); }
  }
  for (let i = contacts.length - 1; i >= 0; i--) {
    const c = contacts[i];
    if ((c.kind === "cdrone" || c.corpDrone) && !liveCd.has(c.id)) contacts.splice(i, 1);
  }
  stepDrones(ship, time, dt);
  stepPirates(ship, time, dt);
}

const HOSTILE_GUN = {
  pirate: { dmg: 6, wing: 8, speed: 560, cd: () => PIRATE_RATE * (0.8 + Math.random() * 0.5) },
  rogue: { dmg: DRONE_DMG, wing: DRONE_DMG, speed: 520, cd: () => DRONE_CD_MIN + Math.random() * DRONE_CD_SPAN },
};
const DEFAULT_GUN = HOSTILE_GUN.pirate;

function stepPirates(ship, time, dt) {
  const e = engagementAt(time);
  const joined = Boolean(e?.joined && time < e.end);
  for (const c of contacts) {
    if (c.kind !== "npc" || !(HOSTILE_ROLES.has(c.role) || (ship.outlaw && LAW_ROLES.has(c.role))) || c.hp <= 0) continue;
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
      if (c.hp <= 0 && !c.eaten) {
        addCargo(ship, "steel", 4 + Math.round(rng() * 7));
        addCargo(ship, "wiring", 1 + Math.round(rng() * 3));
      }
      contacts.splice(i, 1);
      continue;
    }
    if ((c.truceUntil ?? -1) > time) {
      c.x += c.vx * dt;
      c.y += c.vy * dt;
      c.z += c.vz * dt;
      continue;
    }
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
export function fireRound(from, to, speed, damage, owner, faction, kind = null, target = null) { fire(from, to, speed, damage, owner, faction, kind, target); }

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
    if (s.faction.startsWith("npc")) {
      if (!s.target || s.damage <= 0) continue;
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
    if (s.faction === "hostile") {
      if (sweptMiss(ship.pos.x, ship.pos.y, ship.pos.z, ax, ay, az, dx, dy, dz) < 10) {
        applyDamage(ship, s.damage, s.owner, time, s.dmgKind ?? "kinetic");
        shots.splice(i, 1);
      }
      continue;
    }
    for (const c of contacts) {
      if (c.id === s.owner) continue;
      if (s.faction === "station" && (c.relation !== "hostile" || c.kind === "sdrone")) continue;
      if (sweptMiss(c.x, c.y, c.z, ax, ay, az, dx, dy, dz) < c.radius + 7) {
        const soak = Math.min(c.shield ?? 0, s.damage);
        c.shield = (c.shield ?? 0) - soak;
        const was = c.hp;
        c.hp -= s.damage - soak;
        shots.splice(i, 1);
        combatHooks.onHit?.(c, s.damage, s.owner, time);
        if (was > 0 && c.hp <= 0 && onKill) onKill(c, s);
        break;
      }
    }
  }
}

export function stepTurrets(ship, dt, time) {
  turretAim.firing = false;
  turretAim.cooldown -= dt;

  const tracked = ship.turretsArmed && ship.turretMode !== "off" ? nearestContact(ship) : null;
  const target = ship.turretsArmed ? pickCombatTarget(ship, time) : null;
  turretAim.combat = target ?? tracked;
  turretAim.hasTarget = Boolean(target);

  if (target && ship.powered.turrets && turretAim.cooldown <= 0) {
    const rate = (ship.powered.gravity ? 0.42 : 0.52) / ((ship.tune?.turretRate ?? 1) * (ship.mods?.turret ?? 1));
    turretAim.cooldown = rate;
    turretAim.firing = true;
    ship.lastFireAt = time;
    combatHooks.onFire?.(target, time);
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
  return target && ship.powered.turrets ? (DRAW.turretFire - DRAW.turrets) * (ship.tune?.turretRate ?? 1) : 0;
}

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

  const cut = (od ? 0.075 : 0.032) * dt;
  let worn;
  if (best.debris) {
    const c = best.debris;
    c.r = Math.max(0, c.r - c.r0 * cut * 2.2);
    worn = 1 - c.r / c.r0;
    if (c.r < Math.max(2, c.r0 * 0.08)) { removeChunk(c); worn = 1; }
  } else {
    worn = wearRock(best.key, cut);
  }
  const boiloff = best.ice && od ? 0.75 : 1;
  const vein = best.rich ? 1.6 : 1;
  const yieldRate = (2.5 + Math.pow(best.r / 60, 1.5) * 5) * (od ? 2.1 : 1) * boiloff * vein * (ship.mods?.mine ?? 1) * MINE_YIELD;
  if (holdRoom(ship) > 0) {
    addCargo(ship, best.ore ?? "iron_ore", yieldRate * dt);
    if (!handsOff() && Math.floor(time) !== lastCutNote) { lastCutNote = Math.floor(time); notePlayerChoice("ore", best.ore ?? "iron_ore", 1); }
    if (best.seed > 0.95) addCargo(ship, best.ice ? "deuterium" : "platinum_ore", yieldRate * dt * (best.ice ? 0.02 : 0.025));
    mining.fullSince = 0;
  } else if (!mining.fullSince) {
    mining.fullSince = time;
    miningHooks.onHoldFull?.(mining.name || "ore");
  }
  mining.name = best.debris ? `${best.oreName} (debris)` : best.ice ? `${best.oreName} (ice)` : best.rich ? `${best.oreName} (VEIN)` : (best.oreName ?? "ore");
  if (best.rich && mining.assayed !== best.key) {
    mining.assayed = best.key;
    mining.assay = `Assay: ${best.oreName} vein — rich cut, call it in`;
  }
  mining.progress = worn;
}
