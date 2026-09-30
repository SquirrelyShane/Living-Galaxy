import { sim } from "../sim/sim.js";
import { stationById } from "../station/stations.js";
import { corps, corpById } from "../corp/corps.js";
import { currentSystem } from "../world/bodies.js";
import { nearbyRocks, wearRock, depleted } from "../world/field.js";
import { deliver, lift } from "../economy/economy.js";
import { rngFromSeed } from "../world/generate.js";
import { droneDoorGoal, startDroneBay, stepDroneBay } from "../npc/bay.js";
import { DRONE_ROLES, LANE_SPEED, NEAR_SPEED, LANE_OVER, JUMP_SPEED, JUMP_OVER, DOCK_SECS } from "./roles.js";
import { openFreight, claim, touch, release, releaseAll } from "./board.js";

export const npcDrones = { units: [], lastT: null };

const d3 = (a, b) => Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z);
const STEP = 1;
export const DRONE_LINE = {
  deliveryCap: 3,
  major: ["miner", "haul", "repair"],
  alt: ["miner", "combat"],
  hostile: ["combat"],
  guardReach: 3500, guardRange: 1400, guardRate: 1.3, guardDamage: 6,
  repairReach: 2600, repairRate: 0.8, quietFor: 20,
};
export const npcDroneHooks = { fire: null, patchFor: null, hostiles: null };

function beltPointNear(p, rnd) {
  const b = currentSystem.belt ?? currentSystem.outerBelt;
  if (!b) return null;
  const rad = Math.hypot(p.x, p.z) || 1;
  const r = Math.max(b.inner + 2000, Math.min(b.outer - 2000, rad + (rnd() - 0.5) * (b.outer - b.inner) * 0.4));
  const a = Math.atan2(p.z, p.x) + (rnd() - 0.5) * 0.25;
  return { x: Math.cos(a) * r, y: 0, z: Math.sin(a) * r };
}

export function populateNpcDrones(seed) {
  npcDrones.units.length = 0;
  npcDrones.lastT = null;
  const rnd = rngFromSeed(`${seed}:corpdrones`);
  let haulers = 0;
  for (const c of corps) {
    const homes = c.ports.map((id) => stationById(id)).filter((s) => s && !s.gnn);
    if (!homes.length) continue;
    const line = DRONE_LINE[c.tier] ?? ["combat"];
    const tag = c.name.split(/\s+/)[0].toUpperCase().slice(0, 8);
    for (let i = 0; i < line.length; i++) {
      const home = homes[Math.floor(rnd() * homes.length)];
      let role = line[i];
      if (role === "haul") role = haulers < DRONE_LINE.deliveryCap ? (haulers++, "hauler") : "combat";
      const r = DRONE_ROLES[role];
      const site = role === "miner" ? beltPointNear(home, rnd) : null;
      npcDrones.units.push({
        id: `cd:${c.id}:${i}`, corpId: c.id, tier: c.tier, role, name: `${tag} ${r.label.toUpperCase()}-${String(i + 1).padStart(2, "0")}`,
        seed: `${seed}:${c.id}:${i}`, home: home.id, sector: home.sector, site, hostile: c.tier === "hostile",
        hold: 0, holdCap: r.hold, hp: r.hp, hpMax: r.hp, state: "docked", t: rnd() * 40, assign: null, fleg: null, target: null,
        x: home.x, y: home.y, z: home.z, yaw: 0, pitch: 0, dockedAt: home.id, note: "docked", good: null, cut: null, cutting: -1e9,
        stats: { mined: 0, hauled: 0, trips: 0 },
      });
    }
  }
  return npcDrones.units;
}

export function resetNpcDrones() { npcDrones.units.length = 0; npcDrones.lastT = null; }

function flyTo(u, p, dt, stopR = 40) {
  if (p.vx || p.vy || p.vz) { u.x += (p.vx ?? 0) * dt; u.y += (p.vy ?? 0) * dt; u.z += (p.vz ?? 0) * dt; }
  const dx = p.x - u.x, dy = p.y - u.y, dz = p.z - u.z;
  const d = Math.hypot(dx, dy, dz);
  if (d <= stopR) return true;
  const sp = d > JUMP_OVER ? JUMP_SPEED : d > LANE_OVER ? LANE_SPEED : Math.min(NEAR_SPEED, Math.max(40, d * 1.2));
  const k = Math.min(1, (sp * dt) / d);
  u.x += dx * k; u.y += dy * k; u.z += dz * k;
  u.yaw = Math.atan2(-dx, -dz);
  u.pitch = Math.atan2(dy, Math.hypot(dx, dz));
  return d - sp * dt <= stopR;
}

export function stepNpcDrones() {
  if (npcDrones.lastT == null) { npcDrones.lastT = sim.time; return; }
  let dt = Math.min(30, sim.time - npcDrones.lastT);
  npcDrones.lastT = sim.time;
  if (!(dt > 0)) return;
  while (dt > 1e-6) {
    const h = Math.min(STEP, dt);
    dt -= h;
    for (const u of npcDrones.units) stepUnit(u, h);
  }
}

const _door = {};
function stepUnit(u, dt) {
  const home = stationById(u.home);
  if (!home) { u.state = "lost"; u.note = "home port gone"; return; }
  if (u.state === "docked") {
    const at = stationById(u.dockedAt) ?? home;
    if (u.bay) {
      const leaving = u.bay.which === "out";
      if (stepDroneBay(u, at, dt)) return;
      if (leaving) { u.dockedAt = null; u.state = "outbound"; u.stats.trips++; return; }
    }
    u.x = at.x; u.y = at.y; u.z = at.z;
    u.hp = Math.min(u.hpMax, u.hp + u.hpMax * 0.05 * dt);
    u.t -= dt;
    if (u.t > 0) return;
    if (startDroneBay(u, at, "out")) return;
    u.dockedAt = null;
    u.state = "outbound";
    u.stats.trips++;
    return;
  }
  if (u.hp <= 0) {
    u.state = "docked"; u.dockedAt = home.id; u.t = 240; u.hp = 1; u.note = "limped home for repairs"; releaseAll(u.id); u.assign = null;
    if (u.hold > 0 && u.good) deliver(home, u.good, u.hold);
    u.hold = 0; u.good = null;
    return;
  }
  if (u.role === "miner") return stepMiner(u, dt, home);
  if (u.role === "hauler") return stepHauler(u, dt, home);
  if (u.role === "combat") return stepCombat(u, dt, home);
  if (u.role === "repair") return stepRepair(u, dt, home);
}

function stepMiner(u, dt, home) {
  const r = DRONE_ROLES.miner;
  if (u.hold >= u.holdCap - 0.5 || u.state === "returning") {
    u.state = "returning";
    u.note = `returning to ${home.name}`;
    const g = droneDoorGoal(home, u, _door);
    if (flyTo(u, g, dt, g.r)) {
      if (u.hold > 0 && u.good) deliver(home, u.good, u.hold);
      u.stats.mined += u.hold;
      u.hold = 0; u.good = null;
      u.state = "docked"; u.dockedAt = home.id; u.t = DOCK_SECS; u.note = "docked";
      startDroneBay(u, home, "in");
    }
    return;
  }
  const site = u.site ?? home;
  if (u.state === "outbound") { u.note = "outbound to the belt"; if (flyTo(u, site, dt, 600)) { u.state = "working"; u.target = null; } return; }
  let rock = u.cut && u.cut.key === u.target && (depleted.get(u.target) ?? 0) < 1 && sim.time - (u.scanAt ?? -1e9) < 2 ? u.cut : null;
  if (!rock) {
    u.scanAt = sim.time;
    const rocks = nearbyRocks(site, sim.time, 1).filter((k) => !k.ice && k.worn < 1);
    rock = (u.target && rocks.find((k) => k.key === u.target)) || rocks.sort((a, b) => d3(a, u) - d3(b, u))[0] || null;
    u.target = rock?.key ?? null;
    if (!rock) { u.note = "seam dry"; u.hold = Math.max(u.hold, 1); if (u.hold >= 1) u.state = "returning"; return; }
  }
  u.cut = rock;
  if (!flyTo(u, rock, dt, rock.r + 40)) { u.note = `closing on ${rock.oreName}`; return; }
  const got = Math.min(u.holdCap - u.hold, r.rate * (rock.rich ? 1.6 : 1) * dt);
  if (u.good && u.good !== rock.ore && u.hold > 0) { u.state = "returning"; return; }
  u.good = rock.ore;
  u.hold += got;
  wearRock(rock.key, (r.rate * dt) / Math.max(30, rock.r * 0.8));
  u.note = `cutting ${rock.oreName}`;
  u.cutting = sim.time;
}

function stepHauler(u, dt, home) {
  if (!u.assign) {
    u.lookAt ??= -1e9;
    if (sim.time - u.lookAt < 20) { u.note = "waiting on the board"; return; }
    u.lookAt = sim.time;
    const slot = openFreight({ home, cap: u.holdCap, who: u.id, n: 1, maxKm: 60000 })[0]
      ?? openFreight({ home, cap: u.holdCap, who: u.id, n: 1 })[0];
    if (!slot || !claim(slot.key, u.id)) { u.note = "no work on the board"; return; }
    u.assign = slot; u.fleg = "pickup";
  }
  const s = u.assign;
  const A = stationById(s.from), B = stationById(s.to);
  if (!A || !B) { release(s.key, u.id); u.assign = null; return; }
  touch(s.key, u.id);
  if (u.fleg === "pickup") {
    u.note = `to ${A.name} for freight`;
    if (!flyTo(u, A, dt, (A.radius ?? 100) * 1.2)) return;
    const got = lift(A, s.good, Math.min(s.qty, u.holdCap));
    if (got <= 0) { release(s.key, u.id); u.assign = null; return; }
    u.hold = got; u.good = s.good; u.fleg = "drop";
    return;
  }
  u.note = `hauling to ${B.name}`;
  const gB = droneDoorGoal(B, u, _door);
  if (!flyTo(u, gB, dt, gB.r)) return;
  deliver(B, u.good, u.hold);
  u.stats.hauled += u.hold;
  u.hold = 0; u.good = null;
  release(s.key, u.id);
  u.assign = null; u.fleg = null;
  u.state = "docked"; u.dockedAt = B.id; u.t = DOCK_SECS; u.note = "docked";
  if (!startDroneBay(u, B, "in")) { u.x = B.x; u.y = B.y; u.z = B.z; }
}

function patrol(u, dt, home, what) {
  u.t2 = (u.t2 ?? 0) + dt;
  const a = u.t2 * 0.05 + (u.seed?.length ?? 0);
  const R = (home.radius ?? 100) * 3.5;
  flyTo(u, { x: home.x + Math.cos(a) * R, y: home.y + Math.sin(a * 0.7) * 60, z: home.z + Math.sin(a) * R }, dt, 30);
  u.state = "patrol";
  u.note = `${what} ${home.name}`;
}

function stepCombat(u, dt, home) {
  if (u.hostile) return patrol(u, dt, home, "patrolling");
  const foes = npcDroneHooks.hostiles?.() ?? [];
  let best = null, bd = DRONE_LINE.guardReach;
  for (const c of foes) {
    if (d3(c, home) > DRONE_LINE.guardReach) continue;
    const d = d3(c, u);
    if (d < bd) { bd = d; best = c; }
  }
  if (!best) return patrol(u, dt, home, "guarding");
  u.state = "engaged";
  u.note = `engaging ${best.name ?? "a hostile"} off ${home.name}`;
  if (bd > DRONE_LINE.guardRange * 0.7) flyTo(u, best, dt, DRONE_LINE.guardRange * 0.6);
  u.gunCd = (u.gunCd ?? 0) - dt;
  if (bd < DRONE_LINE.guardRange && u.gunCd <= 0) {
    u.gunCd = DRONE_LINE.guardRate;
    const lead = bd / 800;
    npcDroneHooks.fire?.(u, { x: best.x + (best.vx ?? 0) * lead, y: best.y + (best.vy ?? 0) * lead, z: best.z + (best.vz ?? 0) * lead }, best.id);
  }
}

function stepRepair(u, dt, home) {
  const job = npcDroneHooks.patchFor?.(u, home) ?? null;
  if (!job) return patrol(u, dt, home, "standing by off");
  u.state = "repairing";
  if (!flyTo(u, job, dt, 90)) { u.note = `to ${job.name}`; return; }
  job.heal(DRONE_LINE.repairRate * dt);
  u.note = `patching ${job.name}`;
  u.patched = (u.patched ?? 0) + DRONE_LINE.repairRate * dt;
}

export function npcDronesNear(p, range) {
  const out = [];
  for (const u of npcDrones.units) if (!u.dockedAt && d3(u, p) < range) out.push(u);
  return out;
}

export function npcDroneReport() {
  return npcDrones.units.map((u) => ({ name: u.name, corp: corpById(u.corpId)?.name, role: u.role, state: u.state, note: u.note, hold: Math.round(u.hold), assign: u.assign?.label ?? null }));
}
