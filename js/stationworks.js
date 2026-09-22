/* LIVING GALAXY — station works: what a port makes, what it shoots, and how it takes you in.
 *
 * PRODUCTION. A port's fabrication lines (from its STATIONGEN manifest: drone
 * lines, munitions cells, armour presses) turn traded stock into the things
 * it defends itself with — slugs for the rails and the spinal gun, missiles
 * for the cells, drones for the bays — and armour plate and ammo cases for
 * the market. A line that is short of a material stalls and says which one:
 * fly it in and sell it, and the magazines fill again. A trickle of NPC
 * supply keeps the lines ticking over without you.
 *
 * DEFENCE. Every weapon mount on the hull (pdc, rail, laser, missile cells,
 * spinal driver, siege laser) tracks the nearest hostile of the CURRENT ship
 * — pirates, rogue drones, anyone flagged hostile — inside its range and
 * answers it, spending magazines as it goes. A hostile free port turns the
 * same guns on you until it is claimed. Drone bays put interceptors out on
 * sorties against anything hostile within reach and recover them after.
 *
 * TRACTOR. Fly into a hangar mouth — or ask for clearance inside TRACTOR_R —
 * and port control takes the helm: a tractor lock pulls the hull in by the
 * ENTRY door (the port half of the aperture), down the bay and onto the
 * clamps. Undocking pushes you out by the EXIT door (the starboard half), up
 * the exit lane and past the funnel before it lets go — and for the rest of
 * that departure the port neither reaches for you nor hails you: you are
 * outbound until you are off its exit lane or come back round onto the
 * entry lane. Undocking pushes you back
 * out along the exit ways. Pure sim: nothing here touches three.js. */

import { contacts, fireRound } from "./turrets.js";
import { traffic, HOSTILE_ROLES } from "./npc/traffic.js";
import { stations, stationById, TRACTOR_R, TRACTOR_V } from "./stations.js";
import { mouthCoords, worksOf } from "./stationyard.js";
import { laneOf, lanePoint, stationLane, FUNNEL_U, RELEASE_U } from "./npc/lanes.js";
import { goodName, priceAt, SECTORS } from "./materials.js";

/* ---- recipes: what a unit of each munition costs in traded stock ------------ */
export const RECIPES = {
  slug:    { batch: 20, secs: 18, needs: { steel: 1.0, titanium: 0.3 }, line: "munitions" },
  missile: { batch: 2,  secs: 30, needs: { steel: 1.2, wiring: 0.6, chip: 0.3, capacitor: 0.2 }, line: "munitions" },
  drone:   { batch: 1,  secs: 45, needs: { steel: 3, titanium: 1, wiring: 2, chip: 1, controller: 0.5, thruster_bell: 0.5, battery: 0.5 }, line: "drone" },
  plate:   { batch: 4,  secs: 40, needs: { steel: 2.4, titanium: 0.6 }, line: "press", sells: "armour_plate" },
};
const SUPPLY_S = 45;            // NPC supply trickle interval
const DRONE_REACH = 3200;       // how far a bay will send its drones
const DRONE_SPEED = 260;
const DRONE_ENDURANCE = 110;    // seconds out before a drone comes home
const DRONE_RANGE = 700;
const DEFENCE_WAKE_R = 6000;    // ballistic mounts are only stepped when the player is this close
const DEFENCE_REACH = 5200;     // and a port answers anything hostile inside this, seen or not
const SIEGE_HIT = 0.42;         // fraction of abstract battery fire that connects — the same as npc/combat.js

export const tractor = { active: false, stId: null, phase: null, t: 0, T: 0, path: null, seg: 0, hangar: 0, from: null, yaw: 0, pitch: 0, name: "" };
/* a berth you asked for: port control only reaches out for a hull that requested one */
export const dockRequest = { stId: null, at: -1, name: "" };
export const REQUEST_TTL = 900;      // seconds a request stands
export const PUSH_GRACE = 30;        // seconds after an undock push during which no lock is taken
/* the departure you are on: the port that pushed you out, and until when it leaves you alone by the clock */
export const departure = { stId: null, until: -1 };
let noCaptureUntil = -1;
export function requestDock(st, time) { dockRequest.stId = st.id; dockRequest.at = time; dockRequest.name = st.name; }
export function clearDockRequest() { dockRequest.stId = null; dockRequest.at = -1; dockRequest.name = ""; }
export function hasDockRequest(st, time) { return dockRequest.stId === st.id && time - dockRequest.at < REQUEST_TTL; }

/* ---- production --------------------------------------------------------------- */

export function worksFor(st) {
  if (!st.works && st.gen) st.works = worksOf(st);
  return st.works ?? null;
}

function stockLine(st, id) { return st.stock?.find((x) => x.id === id) ?? null; }
function takeStock(st, id, qty) {
  const l = stockLine(st, id);
  if (!l || l.qty < qty) return false;
  l.qty -= qty;
  return true;
}
function addStock(st, id, qty) {
  const l = stockLine(st, id);
  if (l) l.qty += qty;
  else st.stock.push({ id, qty, sell: priceAt(st.sector, id, "sell") });
}

/** One production pass for a port: every line runs its recipe when its magazine has room and the stock is there. */
export function stepProduction(st, dt, time) {
  const w = worksFor(st);
  if (!w) return;
  w.tick = (w.tick ?? 0) + dt;
  w.stalls = {};
  for (const [what, R] of Object.entries(RECIPES)) {
    const lines = w.lines[R.line] ?? 0;
    if (!lines) continue;
    if (what !== "plate" && !w.needs[what]) continue;            // no gun that eats it: no line for it
    if (what !== "plate" && w.stock[what] >= w.cap[what]) continue;
    w.timers ??= {};
    w.timers[what] = (w.timers[what] ?? 0) + dt * lines;
    if (w.timers[what] < R.secs) continue;
    /* the batch's bill, all or nothing */
    const short = Object.entries(R.needs).find(([id, q]) => (stockLine(st, id)?.qty ?? 0) < q);
    if (short) { w.stalls[what] = { what, need: short[0], needName: goodName(short[0]) }; w.timers[what] = R.secs; continue; }
    for (const [id, q] of Object.entries(R.needs)) takeStock(st, id, q);
    w.timers[what] = 0;
    if (what === "plate") { addStock(st, "armour_plate", R.batch); w.made.plate += R.batch; }
    else { w.stock[what] = Math.min(w.cap[what], w.stock[what] + R.batch); w.made[what] += R.batch; }
  }
  /* the first stalled line is the one the deck shouts about; drones and slugs before plate */
  w.stalled = w.stalls.slug ?? w.stalls.drone ?? w.stalls.missile ?? w.stalls.plate ?? null;
  /* the supply line: the sector's own buy list trickles in on the flow */
  if (time - (w.suppliedAt ?? -SUPPLY_S) >= SUPPLY_S) {
    w.suppliedAt = time;
    for (const id of Object.keys(SECTORS[st.sector]?.buys ?? {})) addStock(st, id, 1);
    for (const id of ["steel", "wiring"]) addStock(st, id, 1);
  }
}

/** What the port can tell you about its works. */
export function worksReport(st) {
  const w = worksFor(st);
  if (!w) return null;
  const mags = [];
  if (w.needs.slug) mags.push({ what: "slugs", have: Math.round(w.stock.slug), cap: w.cap.slug });
  if (w.needs.missile) mags.push({ what: "missiles", have: Math.round(w.stock.missile), cap: w.cap.missile });
  if (w.needs.drone) mags.push({ what: "drones", have: Math.round(w.stock.drone), cap: w.cap.drone, out: (st.dronesOut ?? []).length });
  const lines = [];
  if (w.lines.munitions) lines.push(`${w.lines.munitions}× munitions cell`);
  if (w.lines.drone) lines.push(`${w.lines.drone}× drone line`);
  if (w.lines.press) lines.push(`${w.lines.press}× armour press`);
  const mounts = (st.mounts ?? []).filter((m) => m.kind !== "dronebay" && m.kind !== "shield");
  const guns = {};
  for (const m of mounts) guns[m.kind] = (guns[m.kind] ?? 0) + 1;
  return { mags, lines, guns, bays: (st.mounts ?? []).filter((m) => m.kind === "dronebay").length, shielded: (st.mounts ?? []).some((m) => m.kind === "shield"), stalled: w.stalled, made: { ...w.made } };
}

/* ---- defence ------------------------------------------------------------------ */

const d3 = (a, b) => Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z);

/** Who a port's guns are for: the player's hostiles, or the player when the port is a hostile free port. */
function targetsFor(st, ship) {
  if (st.hostile && !st.claimed) return [{ x: ship.pos.x, y: ship.pos.y, z: ship.pos.z, vx: ship.vel.x, vy: ship.vel.y, vz: ship.vel.z, id: "self", player: true }];
  return contacts.filter((c) => c.relation === "hostile" && c.hp > 0 && c.kind !== "sdrone" && (c.truceUntil ?? -1) <= 0);
}

/**
 * The hostile hulls actually inside a port's engagement envelope, whether or
 * not the player is anywhere near. `contacts` only exists within sensor range
 * of the player, so a port under attack on the far side of the system has to
 * be answered off the roster instead.
 */
function siegeOf(st) {
  let count = 0, hp = 0, dps = 0;
  for (const n of traffic) {
    if (n.job === "down" || n.visible === false) continue;
    if (!HOSTILE_ROLES.has(n.role)) continue;
    if (d3(n, st) > DEFENCE_REACH) continue;
    count++;
    hp += (n.hp ?? 0) + (n.shield ?? 0);
    if (n.gun) dps += (n.gun.dmg * (n.gun.mounts ?? 1)) / Math.max(0.2, n.gun.rate);
  }
  return { count, hp, dps };
}

/** A port's total effective firepower, for a fight resolved on the numbers. */
export function batteryDps(st) {
  let dps = 0;
  for (const m of st.mounts ?? []) {
    if (m.kind === "dronebay" || m.kind === "shield") continue;
    dps += ((m.damage ?? 0) * (m.barrels ?? 1)) / Math.max(0.2, m.rate ?? 1);
  }
  return dps;
}

/**
 * A port defending itself out of the player's sight. Same numbers as the
 * ballistic path, resolved in one multiplication per tick: the batteries put
 * their effective firepower onto the nearest raider, the raiders put theirs
 * into the port's magazines and its works. A port with no guns loses; a
 * military port with a full doctrine does not.
 */
function stepSiege(st, dt, time) {
  const siege = siegeOf(st);
  st.siege = siege.count ? { count: siege.count, at: time } : null;
  if (!siege.count) return;
  const guns = batteryDps(st);
  if (guns <= 0) return;
  const w = worksFor(st);
  /* the batteries need ammunition like they do up close */
  if (w?.stock && (w.stock.slug ?? 0) <= 0 && (w.stock.missile ?? 0) <= 0) { st.guns = { firing: 0, dry: true }; return; }
  if (w?.stock?.slug > 0) w.stock.slug = Math.max(0, w.stock.slug - dt * 1.4);
  st.guns = { firing: Math.min(st.mounts.length, siege.count), dry: false };
  st.lastFireAt = time;

  /* pick the nearest raider and put the whole battery on it, which is what a
   * fire-control mast is for */
  let best = null, bestD = DEFENCE_REACH;
  for (const n of traffic) {
    if (n.job === "down" || n.visible === false || !HOSTILE_ROLES.has(n.role)) continue;
    const d = d3(n, st);
    if (d < bestD) { best = n; bestD = d; }
  }
  if (best) worksHooks.onBatteryHit?.(best, guns * SIEGE_HIT * dt, st, time);
}

export const worksHooks = { onBatteryHit: null };

export function stepDefences(st, dt, time, ship) {
  if (!st.mounts?.length) return;
  const w = worksFor(st);
  const targets = targetsFor(st, ship);
  st.guns = st.guns ?? { firing: 0, dry: false };
  st.guns.firing = 0;
  st.guns.dry = false;
  for (const m of st.mounts) {
    if (m.kind === "dronebay" || m.kind === "shield") continue;
    m.cooldown = Math.max(0, (m.cooldown ?? 0) - dt);
    const mx = st.x + m.x, my = st.y + m.y, mz = st.z + m.z;
    let best = null, bestD = m.range;
    for (const c of targets) {
      const d = Math.hypot(c.x - mx, c.y - my, c.z - mz);
      if (d < bestD) { best = c; bestD = d; }
    }
    if (!best) continue;
    st.guns.firing++;
    if (m.cooldown > 0) continue;
    if (m.ammo && w) {
      const need = m.cost ?? 1;
      if ((w.stock[m.ammo] ?? 0) < need) { st.guns.dry = true; continue; }
      w.stock[m.ammo] -= need;
      w.spent = w.spent ?? {}; w.spent[m.ammo] = (w.spent[m.ammo] ?? 0) + need;
    }
    m.cooldown = m.rate * (0.85 + Math.random() * 0.3);
    const lead = m.kind === "missile" ? 0.9 : 0.45;
    const faction = best.player ? "hostile" : "station";
    for (let b = 0; b < (m.barrels ?? 1); b++) {
      fireRound({ x: mx + (Math.random() - 0.5) * 4, y: my + (Math.random() - 0.5) * 4, z: mz + (Math.random() - 0.5) * 4 },
        { x: best.x + (best.vx ?? 0) * lead, y: best.y + (best.vy ?? 0) * lead, z: best.z + (best.vz ?? 0) * lead },
        m.speed, m.damage, m.id, faction, m.kind);
    }
    st.lastFireAt = time;
  }
}

/* ---- drones ------------------------------------------------------------------- */

let droneSeq = 1;
export function stepStationDrones(st, dt, time, ship) {
  const w = worksFor(st);
  const bays = st.mounts?.filter((m) => m.kind === "dronebay") ?? [];
  st.dronesOut = st.dronesOut ?? [];
  if (!bays.length || !w) return;
  const hostileToPort = st.hostile && !st.claimed;
  const targets = hostileToPort ? [] : contacts.filter((c) => c.relation === "hostile" && c.hp > 0 && c.kind !== "sdrone" && d3(c, st) < DRONE_REACH);
  /* launch: one per bay per second while there is something to meet, up to the cells */
  if (targets.length && w.stock.drone >= 1) {
    for (const bay of bays) {
      bay.launchAt = bay.launchAt ?? 0;
      if (time - bay.launchAt < 1.1) continue;
      const out = st.dronesOut.filter((d) => d.bay === bay.id).length;
      if (out >= bay.cells) continue;
      bay.launchAt = time;
      w.stock.drone -= 1;
      const c = {
        id: `sdrone-${st.id}-${droneSeq++}`, kind: "sdrone", name: `${st.name} interceptor`, relation: "ally", stationId: st.id, bay: bay.id,
        x: st.x + bay.x, y: st.y + bay.y, z: st.z + bay.z, vx: st.vx + bay.nx * 40, vy: st.vy + bay.ny * 40, vz: st.vz + bay.nz * 40,
        hp: 30, shield: 10, radius: 2.5, cooldown: Math.random(), born: time, home: false,
      };
      contacts.push(c);
      st.dronesOut.push(c);
    }
  }
  /* fly: close on a hostile and shoot, or come home and land */
  for (let i = st.dronesOut.length - 1; i >= 0; i--) {
    const c = st.dronesOut[i];
    if (c.hp <= 0) { st.dronesOut.splice(i, 1); const k = contacts.indexOf(c); if (k >= 0) contacts.splice(k, 1); continue; }
    let tgt = null, td = Infinity;
    if (time - c.born < DRONE_ENDURANCE) for (const t of targets) { const d = d3(c, t); if (d < td) { td = d; tgt = t; } }
    const bay = bays.find((b) => b.id === c.bay) ?? bays[0];
    const home = { x: st.x + bay.x, y: st.y + bay.y, z: st.z + bay.z };
    const goal = tgt ?? home;
    const dx = goal.x - c.x, dy = goal.y - c.y, dz = goal.z - c.z;
    const d = Math.hypot(dx, dy, dz) || 1;
    const want = tgt ? 420 : 0;
    /* velocity matching: close at up to DRONE_SPEED, ease onto the standoff, and station-keep there */
    const cruise = Math.max(-DRONE_SPEED, Math.min(DRONE_SPEED, (d - want) * 0.9));
    const gvx = (tgt?.vx ?? st.vx), gvy = (tgt?.vy ?? st.vy), gvz = (tgt?.vz ?? st.vz);
    const wvx = gvx + (dx / d) * cruise, wvy = gvy + (dy / d) * cruise, wvz = gvz + (dz / d) * cruise;
    const ax = wvx - c.vx, ay = wvy - c.vy, az = wvz - c.vz;
    const am = Math.hypot(ax, ay, az) || 1, aMax = 140 * dt;
    const f = Math.min(1, aMax / am);
    c.vx += ax * f; c.vy += ay * f; c.vz += az * f;
    const rvx = c.vx - st.vx, rvy = c.vy - st.vy, rvz = c.vz - st.vz;
    c.x += c.vx * dt; c.y += c.vy * dt; c.z += c.vz * dt;
    c.yaw = Math.atan2(-rvx, -rvz); c.pitch = Math.atan2(rvy, Math.hypot(rvx, rvz));
    c.cooldown -= dt;
    if (tgt && td < DRONE_RANGE && c.cooldown <= 0) {
      c.cooldown = 1.1 + Math.random() * 0.8;
      fireRound(c, { x: tgt.x + (tgt.vx ?? 0) * 0.4, y: tgt.y + (tgt.vy ?? 0) * 0.4, z: tgt.z + (tgt.vz ?? 0) * 0.4 }, 540, 3, c.id, "station", "drone");
    }
    /* recovered: back in the cells */
    if (!tgt && d < 30) {
      st.dronesOut.splice(i, 1);
      const k = contacts.indexOf(c); if (k >= 0) contacts.splice(k, 1);
      w.stock.drone = Math.min(w.cap.drone, w.stock.drone + 1);
    }
  }
}

/* ---- the works tick ------------------------------------------------------------ */

export function stepStationWorks(dt, time, ship) {
  for (const st of stations) {
    if (!st.gen) continue;
    stepProduction(st, dt, time);
    const d = d3(st, ship.pos);
    if (d > DEFENCE_WAKE_R && !(st.dronesOut?.length)) {
      /* Out of the player's sight the guns still work. They have to: rogue
       * waves pick their targets off the whole station list, and a port that
       * only defends itself when somebody is watching would be dismantled the
       * first time a wave went somewhere quiet. */
      stepSiege(st, dt, time);
      continue;
    }
    stepDefences(st, dt, time, ship);
    stepStationDrones(st, dt, time, ship);
  }
}

/* ---- the tractor -------------------------------------------------------------- */

/** Is the ship on a port's entry lane inside the funnel, or in its mouth? { st, hangar, m, where } */
export function approachOf(ship, st) {
  const hit = mouthAround(ship, st);
  if (hit) return { ...hit, where: "mouth" };
  if (!st.port) return null;
  const L = laneOf(st, ship.pos);
  if (L && L.which === "entry" && L.u < FUNNEL_U * 1.1 && L.along > 0 && outboundSpeed(ship, st) < 4) return { st, hangar: 0, m: st.hangars[0], c: null, where: "lane", lane: L };
  return null;
}

/** Speed away from the port along its lane axis (u/s, relative to the port): + outbound, − inbound. */
export function outboundSpeed(ship, st) {
  const f = stationLane(st);
  return (ship.vel.x - st.vx) * f.dir.x + (ship.vel.y - st.vy) * f.dir.y + (ship.vel.z - st.vz) * f.dir.z;
}

/** Is the hull still on the departure the port pushed it onto? By the clock, or by riding the exit lane outbound. */
export function inDeparture(st, ship, time) {
  if (!st || departure.stId !== st.id) return false;
  if (time < departure.until) return true;
  const L = laneOf(st, ship.pos);
  return Boolean(L && L.which === "exit" && outboundSpeed(ship, st) > 2);
}

/** Which hangar mouth the ship is inside, if any: { st, hangar, m } */
export function mouthAround(ship, only = null) {
  for (const st of only ? [only] : stations) {
    if (!st.hangars?.length) continue;
    if (d3(st, ship.pos) > st.radius * 3 + 400) continue;
    for (let i = 0; i < st.hangars.length; i++) {
      const m = st.hangars[i];
      const c = mouthCoords(st, m, ship.pos);
      /* the mouth's reach: a bay-depth out in front of the aperture, and the bay itself */
      if (c.along < m.d && c.along > -m.d * 0.95 && Math.abs(c.lat) < m.w * 0.5 && Math.abs(c.vert) < m.h * 0.55) return { st, hangar: i, m, c };
    }
  }
  return null;
}

function easeInOut(u) { return u < 0.5 ? 2 * u * u : 1 - Math.pow(-2 * u + 2, 2) / 2; }

/** Port control takes the helm. Returns the tractor or null with a reason. */
export function engageTractor(st, ship, hangar = 0, why = "request") {
  if (!st?.hangars?.length) return { ok: false, why: "No hangar on this port" };
  if (st.hostile && !st.claimed) return { ok: false, why: `${st.guns?.firing ? "Its guns are on you" : "Hostile port"} — claim it first` };
  const m = st.hangars[hangar] ?? st.hangars[0];
  const door = { x: st.x + m.entry.x, y: st.y + m.entry.y, z: st.z + m.entry.z };        // the ENTRY door: port half of the aperture
  const gateD = m.d * 1.6;
  const gate = { x: door.x + m.dir.x * gateD, y: door.y + m.dir.y * gateD, z: door.z + m.dir.z * gateD };   // square on to the door before the sill
  const bay = { x: st.x + m.berth.x, y: st.y + m.berth.y, z: st.z + m.berth.z };
  const c = mouthCoords(st, m, ship.pos);
  const from = { x: ship.pos.x, y: ship.pos.y, z: ship.pos.z };
  /* the path: gather to the gate off the entry door if you are outside it, then the door, then the clamps */
  const pts = [from];
  if (c.along > gateD * 1.2) pts.push(gate);
  if (c.along > 0) pts.push(door);
  pts.push(bay);
  const segs = [];
  let T = 0;
  for (let i = 1; i < pts.length; i++) {
    const L = d3(pts[i - 1], pts[i]);
    const speed = i === pts.length - 1 ? 14 : i === 1 && pts.length > 2 ? 46 : 30;
    const t = Math.max(1.2, L / speed);
    segs.push({ a: pts[i - 1], b: pts[i], t });
    T += t;
  }
  Object.assign(tractor, { active: true, stId: st.id, hangar, phase: "pull", t: 0, T, path: segs, seg: 0, from, name: st.name, why, origin: { x: st.x, y: st.y, z: st.z },
    yaw: Math.atan2(m.dir.x, m.dir.z), pitch: Math.asin(Math.max(-1, Math.min(1, -m.dir.y))) });
  return { ok: true, tractor, why: `${st.name} control has the helm — tractor lock` };
}

export function releaseTractor() { tractor.active = false; tractor.stId = null; tractor.phase = null; tractor.path = null; tractor.rush = 1; }
/** No lock is taken for `secs`; with a port given, that port treats you as outbound until you are off its exit lane. */
export function holdOff(time, secs = PUSH_GRACE, stId = null) { noCaptureUntil = time + secs; departure.stId = stId; departure.until = time + secs; }

/** Advance the tractor: moves the ship along the path in the station's frame. Returns "docked" when it lands. */
export function stepTractor(dt, ship) {
  if (!tractor.active) return null;
  const st = stationById(tractor.stId);
  if (!st) { releaseTractor(); return null; }
  /* js/ui/dockboot.js sets rush while the canopy is covered by the boot sequence */
  tractor.t += dt * (tractor.rush ?? 1);
  /* the path was laid in world space at capture; the station has moved since — follow it */
  const drift = { x: st.x - tractor.origin.x, y: st.y - tractor.origin.y, z: st.z - tractor.origin.z };
  let t = Math.min(tractor.t, tractor.T), seg = tractor.path[0];
  for (const s of tractor.path) { if (t <= s.t) { seg = s; break; } t -= s.t; seg = s; }
  const u = Math.min(1, t / seg.t), e = easeInOut(u);
  const nx = seg.a.x + (seg.b.x - seg.a.x) * e + drift.x, ny = seg.a.y + (seg.b.y - seg.a.y) * e + drift.y, nz = seg.a.z + (seg.b.z - seg.a.z) * e + drift.z;
  ship.vel.x = st.vx + (nx - ship.pos.x) / Math.max(dt, 1e-3) * 0.5;
  ship.vel.y = st.vy + (ny - ship.pos.y) / Math.max(dt, 1e-3) * 0.5;
  ship.vel.z = st.vz + (nz - ship.pos.z) / Math.max(dt, 1e-3) * 0.5;
  ship.pos.x = nx; ship.pos.y = ny; ship.pos.z = nz;
  /* the nose comes round to the bay */
  const k = Math.min(1, dt * 1.6);
  let dy = tractor.yaw - ship.yaw; dy = Math.atan2(Math.sin(dy), Math.cos(dy));
  ship.yaw += dy * k; ship.aimYaw = ship.yaw;
  ship.pitch += (tractor.pitch - ship.pitch) * k; ship.aimPitch = ship.pitch;
  ship.roll = (ship.roll ?? 0) * (1 - k);
  ship.throttle = 0;
  tractor.progress = Math.min(1, tractor.t / tractor.T);
  tractor.left = Math.max(0, tractor.T - tractor.t);
  if (tractor.t >= tractor.T) {
    if (tractor.phase === "push") {
      /* let go with way on, pointed out along the exit line, and stay hands-off for a while */
      const d = tractor.exitDir;
      ship.vel.x = st.vx + d.x * 40; ship.vel.y = st.vy + d.y * 40; ship.vel.z = st.vz + d.z * 40;
      releaseTractor();
      return "released";   // the caller calls holdOff(time) so no lock is taken on the way out
    }
    const m = st.hangars[tractor.hangar];
    ship.pos.x = st.x + m.berth.x; ship.pos.y = st.y + m.berth.y; ship.pos.z = st.z + m.berth.z;
    ship.vel.x = st.vx; ship.vel.y = st.vy; ship.vel.z = st.vz;
    releaseTractor();
    return "docked";
  }
  return tractor.phase;
}

/** Port control reaches for a hull that asked for a berth once it is on the entry lane or in the mouth.
 * A hull that did not ask is left alone (the puck rings instead). Returns the station taken, or null. */
export function autoTractor(ship, relSpeedOf, time) {
  if (tractor.active || ship.dockedAt || time < noCaptureUntil) return null;
  if (!dockRequest.stId) return null;
  const st = stationById(dockRequest.stId);
  if (!st || !hasDockRequest(st, time)) { clearDockRequest(); return null; }
  if (inDeparture(st, ship, time)) return null;
  const hit = approachOf(ship, st);
  if (!hit) return null;
  if (relSpeedOf(st) > TRACTOR_V * 2.5) return null;
  const r = engageTractor(st, ship, hit.hangar, hit.where === "mouth" ? "flew in" : "lane");
  return r.ok ? st : null;
}

/** A hull in a mouth or on the entry lane with no berth asked for: who should be talking to it. */
export function unrequestedApproach(ship, time) {
  if (tractor.active || ship.dockedAt) return null;
  for (const st of stations) {
    if (!st.hangars?.length || (st.hostile && !st.claimed)) continue;
    if (hasDockRequest(st, time) || inDeparture(st, ship, time)) continue;
    if (d3(st, ship.pos) > st.radius * 3 + 1200) continue;
    const hit = approachOf(ship, st);
    if (hit) return hit;
  }
  return null;
}

/** Undocking: port control pushes the hull out of the bay, through the mouth and clear of the capture reach, then lets go. */
export function engagePush(st, ship, hangar = 0) {
  const m = st.hangars?.[hangar] ?? st.hangars?.[0];
  if (!m) return null;
  const door = { x: st.x + m.exit.x, y: st.y + m.exit.y, z: st.z + m.exit.z };          // the EXIT door: starboard half of the aperture
  const sill = { x: door.x + m.dir.x * m.d * 1.2, y: door.y + m.dir.y * m.d * 1.2, z: door.z + m.dir.z * m.d * 1.2 };
  /* the release point: up the exit lane's centre way, past the funnel and outside the tractor's reach */
  const clear = hangar === 0 && st.port ? lanePoint(st, "exit", RELEASE_U) : { x: door.x + m.dir.x * RELEASE_U * 500, y: door.y + m.dir.y * RELEASE_U * 500, z: door.z + m.dir.z * RELEASE_U * 500 };
  const exitDir = hangar === 0 && st.port ? { ...stationLane(st).dir } : { ...m.dir };
  const from = { x: ship.pos.x, y: ship.pos.y, z: ship.pos.z };
  const segs = [
    { a: from, b: door, t: Math.max(2.5, d3(from, door) / 12) },      // off the clamps and across to the exit door, dead slow
    { a: door, b: sill, t: Math.max(1.5, d3(door, sill) / 22) },      // over the sill
    { a: sill, b: clear, t: Math.max(3, d3(sill, clear) / 48) },      // up the exit lane, gathering way
  ];
  const T = segs.reduce((a, s) => a + s.t, 0);
  Object.assign(tractor, { active: true, stId: st.id, hangar, phase: "push", t: 0, T, path: segs, seg: 0, from, name: st.name, why: "undock", origin: { x: st.x, y: st.y, z: st.z },
    yaw: Math.atan2(-exitDir.x, -exitDir.z), pitch: Math.asin(Math.max(-1, Math.min(1, exitDir.y))), exitDir });
  return tractor;
}

export { TRACTOR_R, TRACTOR_V };
