/* LIVING GALAXY — drone operations.
 *
 * Your work drones: built at a port whose lines make that role (roles.js),
 * set up with a few questions when they roll off the line, then left to work
 * on sim time — so TIME ×8 and ×40 fast-forward them like everything else.
 *
 * Every drone is a small state machine over the same world the ships fly in:
 * real stations (their live positions, stock and lockers), real belt rocks
 * (field.js — the same key a rock wears down under your own cutter), real
 * debris chunks, real pirates on the timetable. Near you the fights are real
 * rounds (turrets.js); out of contact range they resolve on the numbers.
 *
 *   state        what it is doing: setup · outbound · working · returning ·
 *                docked · waiting · holding · patrol · engage · following
 *   home         the port it docks at, stashes into (sim.stash) and repairs at
 *   site         where it works: a mark, a vein, a belt band, a world
 *   mode         the role's orders (passive haul, patrol, gas, route …)
 *   guard        a slot it looks after: your ship, a drone, a port, a mark
 *
 * A drone is company property: you need a charter (company.js) before a port
 * will build you one, the treasury pays for it, and everything it earns —
 * freight, bounties, a courier's margin — lands in the treasury. Freight is
 * taken off the shared work board (board.js), so a slot your hauler holds is
 * one an NPC corporation's drone or a crewed hull cannot.
 *
 * Reports go to the chat bus (channel "drones"); kills and big finds also go
 * to GNN's contractors desk. Saved per sky and callsign in localStorage.
 */

import { sim, logEvent, addWaypointAt, waypointPosition } from "../sim.js";
import { cargoTotal } from "../ship.js";
import { stations, stationById } from "../stations.js";
import { nearbyRocks, wearRock, depleted, CELL } from "../field.js";
import { BODIES, bodyPosition, currentSystem } from "../bodies.js";
import { chunks, removeChunk, chunkMass, burst } from "../debris.js";
import { traffic, HOSTILE_ROLES, markVesselDown } from "../npc/traffic.js";
import { pirateKilled } from "../npc/battles.js";
import { contacts, contactById, fireRound } from "../turrets.js";
import { stockOf, lift, deliver, askPrice, bidPrice, shortagesOf } from "../economy.js";
import { goodName } from "../materials.js";
import { droneSummary } from "../dronespec.js";
import { assayPoint, fileReport } from "../probes.js";
import { post } from "../chat.js";
import { gnnPost } from "../gnn.js";
import { droneDoorGoal, startDroneBay, stepDroneBay } from "../npc/bay.js";
import { DRONE_ROLES, DRONE_CAP, LANE_SPEED, NEAR_SPEED, LANE_OVER, JUMP_SPEED, JUMP_OVER, DOCK_SECS, PRICE_K, rolesAt } from "./roles.js";
import { company, hasCompany, treasuryPay, treasuryEarn } from "../company.js";
import { openFreight, claim, touch, release, releaseAll, freightKey, FREIGHT_RATE as BOARD_RATE } from "./board.js";
/* `claim` is already the freight board's — the underwriter's is aliased */
import { claim as settleClaim, insure, droneKey, premiumFor, TIER_BY_ID, release as dropPolicy } from "../insurance.js";

export const FREIGHT_RATE = BOARD_RATE; // of the buyer's bid, per unit hauled, paid to the company (board.js)
export const BOUNTY_DRONE = 180;      // what the charters pay when your drone downs a pirate out of your sight
export const THREAT_R = 1400;         // inside this a raider is shooting at a drone
const STEP = 0.5;                     // sim-seconds per substep
const SAVE_EVERY = 20;

export const droneOps = { units: [], queue: [], seq: 1, sky: null, lastT: null, savedAt: 0, foes: new Map(), alert: null, onBuilt: null, cover: null };

/** How full the ship's hold is, 0…1 — the drones' own limit, not just the cutter's. */
function holdFrac() {
  const ship = sim.ship;
  const cap = Math.max(1, ship?.cargoCap ?? 1);
  return ship ? cargoTotal(ship) / cap : 0;   // 0.3.52: by bulk, like the hold
}

const d3 = (a, b) => Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z);
const _p = { x: 0, y: 0, z: 0 };
const roleOf = (u) => DRONE_ROLES[u.role];
const pad = (n) => String(n).padStart(2, "0");

/* ---- positions ------------------------------------------------------------ */

/** Live position of a reference: station, drone, your ship, a body, a mark, a point. */
export function posOf(ref, out = { x: 0, y: 0, z: 0 }) {
  if (!ref) return null;
  if (ref.kind === "station") { const st = stationById(ref.id); if (!st) return null; out.x = st.x; out.y = st.y; out.z = st.z; return out; }
  if (ref.kind === "drone") { const u = unitById(ref.id); if (!u) return null; out.x = u.x; out.y = u.y; out.z = u.z; return out; }
  if (ref.kind === "ship") { out.x = sim.ship.pos.x; out.y = sim.ship.pos.y; out.z = sim.ship.pos.z; return out; }
  if (ref.kind === "body") return bodyPosition(ref.id, sim.time, out);
  if (ref.kind === "wp") { const w = sim.waypoints.find((x) => x.id === ref.id); if (w) return waypointPosition(w, out); }
  if (Number.isFinite(ref.x)) { out.x = ref.x; out.y = ref.y; out.z = ref.z; return out; }
  return null;
}

function nearestBeltPoint(p) {
  const belts = [currentSystem.belt, currentSystem.outerBelt].filter(Boolean);
  let best = null, bd = Infinity;
  for (const b of belts) {
    const rad = Math.hypot(p.x, p.z) || 1;
    const r = Math.max(b.inner + 2000, Math.min(b.outer - 2000, rad));
    const q = { x: (p.x / rad) * r, y: 0, z: (p.z / rad) * r };
    const d = d3(p, q);
    if (d < bd) { bd = d; best = { ...q, belt: b === currentSystem.outerBelt ? "outer" : "inner" }; }
  }
  return best;
}

/* ---- build ------------------------------------------------------------------ */

export function priceOf(roleId, seed) {
  const s = droneSummary(roleId, seed);
  return Math.max(800, Math.min(14000, Math.round((s.costCr * PRICE_K) / 50) * 50));
}

/** What this port's lines will build you, with price, time and why not. */
export function buildOptions(st) {
  if (!st) return [];
  const seed = `${sim.callsign || "pilot"}:${droneOps.seq}`;
  return rolesAt(st).map((id) => {
    const r = DRONE_ROLES[id];
    const price = priceOf(id, `${seed}:${id}`);
    const design = droneSummary(id, `${seed}:${id}`);
    let blocker = null;
    if (!hasCompany()) blocker = "Register a company first";
    else if (droneOps.units.length + droneOps.queue.length >= DRONE_CAP) blocker = `Drone cap ${DRONE_CAP}`;
    else if (company.treasury < price) blocker = `Treasury needs ${price.toLocaleString()} cr`;
    else if (droneOps.queue.some((q) => q.stId === st.id)) blocker = "Line busy";
    return { role: id, label: r.label, blurb: r.blurb, price, secs: r.buildSecs, design, blocker };
  });
}

export function orderBuild(roleId, st, tier = null) {
  const opt = buildOptions(st).find((o) => o.role === roleId);
  if (!opt) return { ok: false, why: "This port has no line for that drone" };
  if (opt.blocker) return { ok: false, why: opt.blocker };
  const seed = `${sim.callsign || "pilot"}:${droneOps.seq}:${roleId}`;
  /* 0.3.33 — cover is bought with the hull, not after it. The premium comes
   * out of the treasury with the build price, in one transaction, because a
   * drone that rolls off uninsured and dies on its first run is exactly the
   * case the player meant to avoid. */
  const cover = TIER_BY_ID[tier] ? tier : null;
  const premium = cover ? premiumFor(opt.price, cover) : 0;
  const why = treasuryPay(opt.price + premium, `${opt.label} drone commissioned at ${st.name}${cover ? ` · ${TIER_BY_ID[cover].name} cover` : ""}`);
  if (why) return { ok: false, why };
  const job = { id: `q${droneOps.seq}`, n: droneOps.seq++, role: roleId, stId: st.id, seed, price: opt.price, cover, premium, start: sim.time, done: sim.time + opt.secs };
  droneOps.queue.push(job);
  logEvent(`${st.name}: ${opt.label} drone on the line — ${opt.secs} s, ${opt.price.toLocaleString()} cr`, "port");
  post({ channel: "drones", from: st.name, text: `${opt.label} drone on the line. Ready in ${opt.secs} s.` });
  save();
  return { ok: true, job };
}

export function queueAt(stId) { return droneOps.queue.filter((q) => q.stId === stId); }

function rollOff(job) {
  const st = stationById(job.stId) ?? stations.find((s) => !s.hostile);
  const r = DRONE_ROLES[job.role];
  const count = droneOps.units.filter((u) => u.role === job.role).length + 1;
  const design = droneSummary(job.role, job.seed);
  const u = {
    id: `d${job.n}`, role: job.role, seed: job.seed, corp: "player",
    name: `${r.label.toUpperCase()}-${pad(count)}`, designation: design.designation,
    home: st?.id ?? null, site: null, mode: r.defaultMode ?? null, guard: null,
    patrol: [], patrolIx: 0, assign: null, route: null, hauler: null,
    hold: {}, holdCap: r.hold, hp: r.hp, hpMax: r.hp, charge: r.charge ?? 0,
    state: "setup", answered: { home: false, site: false, mode: false, guard: false },
    x: st?.x ?? sim.ship.pos.x, y: st?.y ?? sim.ship.pos.y, z: st?.z ?? sim.ship.pos.z,
    yaw: 0, pitch: 0, dockedAt: st?.id ?? null, t: 0, target: null, sweep: 0, lastScan: 0,
    stats: { mined: 0, hauled: 0, earned: 0, kills: 0, trips: 0, marks: 0 }, note: "awaiting orders",
  };
  if (r.id === "repair") u.guard = { kind: "ship", label: "your ship" };
  /* the cover was paid for at commission; it attaches to the hull that
   * actually exists, which is only now */
  u.cover = job.cover ?? null;
  u.value = job.price;
  if (u.cover) insure(droneKey(u.id), u.cover, job.price, sim.time);
  droneOps.units.push(u);
  const ask = r.asks.map((a) => ({ home: "home port", site: "start location", mode: "orders", guard: "who to look after" }[a])).join(", ");
  post({
    channel: "drones", from: u.name, tone: "ok",
    text: `Built at ${st?.name ?? "the yard"} — ${design.designation}, ${design.massKg} kg. Home is ${st?.name ?? "unset"}; confirm ${ask} and I start.`,
    links: [{ label: `Set up ${u.name}`, run: () => droneOps.openDrone?.(u.id) }],
  });
  sim.toast = `${u.name} is off the line at ${st?.name ?? "the yard"} — set it up`;
  sim.lastToastAt = sim.time;
  droneOps.onBuilt?.(u);
  save();
  return u;
}

/* ---- orders --------------------------------------------------------------- */

export function unitById(id) { return droneOps.units.find((u) => u.id === id) ?? null; }
export function unitsHomedAt(stId) { return droneOps.units.filter((u) => u.home === stId); }

export function setHome(u, stId) {
  const st = stationById(stId);
  if (!u || !st) return false;
  u.home = st.id;
  u.answered.home = true;
  say(u, `Home set to ${st.name}.`);
  save();
  return true;
}

export function setSite(u, site) {
  if (!u || !site) return false;
  u.site = site;
  u.answered.site = true;
  u.recalled = false;
  if (u.state !== "setup") { u.state = "outbound"; u.target = null; }
  say(u, `Start location: ${site.label}.`);
  save();
  return true;
}

export function setMode(u, mode) {
  const r = roleOf(u);
  if (!u || !r.modes || !r.modes[mode]) return false;
  u.mode = mode;
  u.answered.mode = true;
  if (u.role === "hauler" && mode === "passive") u.assign = null;
  if (u.role === "courier" && mode === "auto") u.route = null;
  say(u, `Orders: ${r.modes[mode]}.`);
  if (u.state !== "setup") replan(u);
  save();
  return true;
}

export function setGuard(u, guard) {
  if (!u || !guard) return false;
  u.guard = guard;
  u.answered.guard = true;
  if (u.role === "combat") { u.mode = "guard"; u.answered.mode = true; }
  say(u, `Looking after ${guard.label}.`);
  if (u.state !== "setup") replan(u);
  save();
  return true;
}

export function addPatrol(u, pt) {
  if (!u || !pt) return false;
  u.patrol.push(pt);
  if (u.role === "combat") { u.mode = "patrol"; u.answered.mode = true; }
  say(u, `Patrol point ${u.patrol.length}: ${pt.label}.`);
  save();
  return true;
}
export function clearPatrol(u) { if (!u) return false; u.patrol.length = 0; u.patrolIx = 0; say(u, "Patrol route cleared."); save(); return true; }

/** A hauler takes a slot: under one of your miners, or an NPC freight lane. */
export function assignSlot(u, slot) {
  if (!u || u.role !== "hauler" || !slot) return false;
  releaseSlot(u);
  if (slot.kind === "freight" && !claim(slot.key ?? freightKey(slot), u.id)) { say(u, "Somebody took that slot first.", [], "warn"); return false; }
  u.assign = slot;
  if (slot.kind === "miner") { const m = unitById(slot.id); if (m) m.hauler = u.id; }
  u.answered.mode = true;
  if (u.mode !== "manual" && u.mode !== "passive") u.mode = "manual";
  say(u, slot.kind === "miner" ? `Hauling for ${slot.label}.` : `Freight: ${slot.label}.`);
  if (u.state !== "setup") replan(u);
  save();
  return true;
}
function releaseSlot(u) {
  if (u.assign?.kind === "miner") { const m = unitById(u.assign.id); if (m && m.hauler === u.id) m.hauler = null; }
  if (u.assign?.kind === "freight") release(u.assign.key ?? freightKey(u.assign), u.id);
  u.assign = null;
  u.fleg = null;
}

export function setRoute(u, route) {
  if (!u || u.role !== "courier" || !route) return false;
  u.route = route; u.mode = "route"; u.answered.mode = true;
  say(u, `Route: ${route.label}.`);
  if (u.state !== "setup") replan(u);
  save();
  return true;
}

/** Take the defaults for anything not answered and go to work. */
export function beginWork(u) {
  if (!u) return false;
  const r = roleOf(u);
  for (const a of r.asks) u.answered[a] = true;
  if (!u.site && (u.role === "miner" || u.role === "surveyor" || (u.role === "harvester" && u.mode === "ice") || u.role === "salvager")) {
    const home = posOf({ kind: "station", id: u.home }) ?? sim.ship.pos;
    const b = nearestBeltPoint(home);
    if (b) u.site = { kind: "point", x: b.x, y: b.y, z: b.z, label: `the ${b.belt} belt nearest ${stationById(u.home)?.name ?? "home"}` };
  }
  if (u.role === "harvester" && u.mode === "gas" && !u.site) {
    const g = nearestBody(u, (b) => b.kind === "gas");
    if (g) u.site = { kind: "body", id: g.id, label: g.name };
  }
  if (u.role === "relay" && !u.site) {
    const st = stationById(u.home);
    if (st) u.site = { kind: "point", x: st.x + 8000, y: st.y, z: st.z, label: `the approaches to ${st.name}` };
  }
  if (u.role === "repair" && !u.guard) u.guard = { kind: "ship", label: "your ship" };
  u.recalled = false;
  u.state = u.dockedAt ? "docked" : "outbound";
  u.t = u.dockedAt ? 2 : 0;
  u.next = "outbound";
  say(u, `Starting work. ${statusLine(u)}`);
  save();
  return true;
}

export function recall(u) {
  if (!u) return false;
  u.state = "returning"; u.recalled = true; u.target = null;
  say(u, `Recalled — heading home to ${stationById(u.home)?.name ?? "port"}.`);
  save();
  return true;
}

export function scrapDrone(u) {
  if (!u) return false;
  const ix = droneOps.units.indexOf(u);
  if (ix < 0) return false;
  releaseSlot(u);
  for (const m of droneOps.units) if (m.hauler === u.id) m.hauler = null;
  droneOps.units.splice(ix, 1);
  dropPolicy(droneKey(u.id));   // sold, not lost: the cover goes with it, unpaid
  const refund = Math.round(priceOf(u.role, u.seed) * 0.3);
  treasuryEarn(refund, `${u.name} decommissioned — parts sold`);
  releaseAll(u.id);
  post({ channel: "drones", from: u.name, text: `Decommissioned. The yard paid ${refund} cr for the parts.` });
  save();
  return true;
}

function replan(u) {
  u.recalled = false;
  if (u.state === "docked") { u.next = "outbound"; return; }
  u.state = "outbound"; u.target = null;
}

/* ---- slot and option lists (the deck reads these) --------------------------- */

export function homeOptions(u = null) {
  const from = u ?? sim.ship.pos;
  return stations.filter((s) => !s.hostile || s.claimed).map((s) => ({ id: s.id, label: s.name, sector: s.sector, km: Math.round(d3(from, s) / 100) }))
    .sort((a, b) => a.km - b.km);
}

/** Where a drone could start: your marks, known veins, the belts, the worlds, right here. */
export function siteOptions(u) {
  const out = [];
  const home = posOf({ kind: "station", id: u?.home }) ?? sim.ship.pos;
  out.push({ kind: "point", x: sim.ship.pos.x, y: sim.ship.pos.y, z: sim.ship.pos.z, label: "Where you are now" });
  for (const w of sim.waypoints) {
    const p = waypointPosition(w, {});
    out.push({ kind: "point", x: p.x, y: p.y, z: p.z, label: w.name, vein: /vein|survey/i.test(w.name) });
  }
  const b = nearestBeltPoint(home);
  if (b) out.push({ kind: "point", x: b.x, y: b.y, z: b.z, label: `Nearest ${b.belt} belt to home` });
  if (currentSystem.outerBelt && currentSystem.belt) {
    const ob = currentSystem.outerBelt;
    const rad = Math.hypot(home.x, home.z) || 1, r = (ob.inner + ob.outer) / 2;
    out.push({ kind: "point", x: (home.x / rad) * r, y: 0, z: (home.z / rad) * r, label: "Icy outer belt — frost pockets" });
  }
  for (const body of BODIES) {
    if (body.kind === "star") continue;
    if (u?.role === "harvester" && u.mode === "gas" && body.kind !== "gas") continue;
    out.push({ kind: "body", id: body.id, label: body.name + (body.kind === "gas" ? " (gas giant)" : "") });
  }
  return out;
}

/** Open work for a hauler: your miners without one, then NPC freight lanes. */
export function haulSlots(u) {
  const out = [];
  for (const m of droneOps.units) {
    if (m.role !== "miner" || (m.hauler && m.hauler !== u?.id)) continue;
    out.push({ kind: "miner", id: m.id, label: `${m.name} at ${m.site?.label ?? "its site"}`, pay: 0 });
  }
  return [...out, ...freightSlots(u)];
}

export function freightSlots(u, n = 8) {
  const home = posOf({ kind: "station", id: u?.home }) ?? sim.ship.pos;
  const cap = u ? roleOf(u).hold : DRONE_ROLES.hauler.hold;
  return openFreight({ home, cap, who: u?.id ?? null, n });
}

/** Who a combat or repair drone can look after. */
export function guardSlots(u) {
  const out = [{ kind: "ship", label: "Your ship" }];
  for (const m of droneOps.units) if (m !== u) out.push({ kind: "drone", id: m.id, label: `${m.name} (${roleOf(m).label.toLowerCase()})` });
  for (const s of homeOptions(u).slice(0, 6)) out.push({ kind: "station", id: s.id, label: s.label });
  for (const w of sim.waypoints) { const p = waypointPosition(w, {}); out.push({ kind: "point", x: p.x, y: p.y, z: p.z, label: `Mark: ${w.name}` }); }
  return out;
}

/** Profitable pairs near home for a courier: buy at A's ask, sell at B's bid. */
export function tradeRoutes(u, n = 8) {
  const home = posOf({ kind: "station", id: u?.home }) ?? sim.ship.pos;
  const ports = stations.filter((s) => !s.hostile || s.claimed).filter((s) => d3(s, home) < 400000);
  const out = [];
  for (const B of ports) {
    for (const sh of shortagesOf(B).slice(0, 4)) {
      for (const A of ports) {
        if (A === B || stockOf(A, sh.id) < 20) continue;
        const buy = askPrice(A, sh.id), sell = bidPrice(B, sh.id);
        if (!(sell > buy * 1.12)) continue;
        out.push({ a: A.id, b: B.id, good: sh.id, buy, sell, margin: sell / buy - 1, label: `${goodName(sh.id)}: ${A.name} ${Math.round(buy)} → ${B.name} ${Math.round(sell)} cr` });
      }
    }
  }
  return out.sort((x, y) => y.margin - x.margin).slice(0, n);
}

export function patrolOptions() {
  const out = [{ kind: "point", x: sim.ship.pos.x, y: sim.ship.pos.y, z: sim.ship.pos.z, label: "Where you are now" }];
  for (const w of sim.waypoints) { const p = waypointPosition(w, {}); out.push({ kind: "point", x: p.x, y: p.y, z: p.z, label: w.name }); }
  for (const s of homeOptions().slice(0, 6)) { const st = stationById(s.id); out.push({ kind: "point", x: st.x, y: st.y, z: st.z, label: `Off ${s.label}` }); }
  return out;
}

/* ---- status ------------------------------------------------------------------ */

const holdQty = (u) => Object.values(u.hold).reduce((a, q) => a + q, 0);
export function holdOf(u) { return holdQty(u); }

export function statusLine(u) {
  const home = stationById(u.home)?.name ?? "no home";
  const hold = u.holdCap ? ` · hold ${Math.round(holdQty(u))}/${u.holdCap}` : "";
  const hp = ` · hull ${Math.round((u.hp / u.hpMax) * 100)}%`;
  return `${u.note}${hold}${hp} · home ${home}`;
}

export function pendingAsks(u) {
  return roleOf(u).asks.filter((a) => !u.answered[a]);
}

/* ---- the tick ---------------------------------------------------------------- */

export function stepDroneOps() {
  if (droneOps.lastT == null) { droneOps.lastT = sim.time; return; }
  let dt = sim.time - droneOps.lastT;
  droneOps.lastT = sim.time;
  if (!(dt > 0)) return;
  dt = Math.min(dt, 30);                      // a long pause resumes, it does not teleport
  for (let i = droneOps.queue.length - 1; i >= 0; i--) {
    const q = droneOps.queue[i];
    if (sim.time >= q.done) { droneOps.queue.splice(i, 1); rollOff(q); }
  }
  while (dt > 1e-6) {
    const h = Math.min(STEP, dt);
    dt -= h;
    for (const u of [...droneOps.units]) stepUnit(u, h);
  }
  if (droneOps.alert && sim.time > droneOps.alert.until) droneOps.alert = null;
  if (sim.time - droneOps.savedAt > SAVE_EVERY) save();
}

function say(u, text, links = [], tone = "neutral") {
  u.lastSaid = text;
  post({ channel: "drones", from: u.name, text, links, tone });
}

const _door = {};
function stepUnit(u, dt) {
  const r = roleOf(u);
  if (u.bay && u.state !== "docked") u.bay = null;   // pulled off the clamps mid-run (recall, scrap): the bay run is over
  if (!stationById(u.home)) { const h = homeOptions(u)[0]; if (h) { u.home = h.id; say(u, `Home port is gone — rehomed to ${h.label}.`); } }
  if (u.state !== "setup" && u.state !== "docked") danger(u, dt);
  if (!droneOps.units.includes(u)) return;     // it died of it
  switch (u.state) {
    case "setup": u.note = "awaiting orders"; holdAt(u, u.dockedAt); return;
    case "docked": return stepDocked(u, dt);
    case "returning": return goHome(u, dt);
    default: break;
  }
  if (u.hp < u.hpMax * 0.35 && u.role !== "combat" && u.state !== "returning") {
    u.state = "returning"; u.note = "damaged — limping home";
    say(u, `Hull ${Math.round((u.hp / u.hpMax) * 100)}%. Breaking off for repairs.`, [], "alert");
    return;
  }
  ROLE_STEP[u.role]?.(u, dt, r);
}

function holdAt(u, stId) {
  const st = stationById(stId);
  if (st) { u.x = st.x; u.y = st.y; u.z = st.z; }
}

function stepDocked(u, dt) {
  /* 0.3.15: the bay run — in through the entry door onto the clamps, or off them and out by the exit door */
  if (u.bay) {
    const leaving = u.bay.which === "out";
    if (stepDroneBay(u, stationById(u.dockedAt), dt)) return;
    if (leaving) { u.dockedAt = null; u.state = u.next ?? "outbound"; u.next = null; u.stats.trips++; return; }
  }
  holdAt(u, u.dockedAt);
  u.t -= dt;
  u.hp = Math.min(u.hpMax, u.hp + u.hpMax * 0.05 * dt);  // the yard patches it while it sits
  if (u.charge != null && roleOf(u).charge) u.charge = Math.min(roleOf(u).charge, u.charge + 40 * dt);
  if (u.t > 0) return;
  if (u.recalled) { u.note = "held at home"; return; }
  if (startDroneBay(u, stationById(u.dockedAt), "out")) return;
  u.dockedAt = null;
  u.state = u.next ?? "outbound";
  u.next = null;
  u.stats.trips++;
}

/** Fly toward a point. Returns true on arrival. */
function flyTo(u, p, dt, stopR = 40) {
  /* a port rides its orbit at hundreds of u/s: match its frame first, then close on it */
  if (p.vx || p.vy || p.vz) { u.x += (p.vx ?? 0) * dt; u.y += (p.vy ?? 0) * dt; u.z += (p.vz ?? 0) * dt; }
  const dx = p.x - u.x, dy = p.y - u.y, dz = p.z - u.z;
  const d = Math.hypot(dx, dy, dz);
  if (d <= stopR) return true;
  const sp = d > JUMP_OVER ? JUMP_SPEED : d > LANE_OVER ? LANE_SPEED : Math.min(NEAR_SPEED, Math.max(40, d * 1.2));
  const k = Math.min(1, (sp * dt) / d);
  u.x += dx * k; u.y += dy * k; u.z += dz * k;
  u.yaw = Math.atan2(-dx, -dz);
  u.pitch = Math.atan2(dy, Math.hypot(dx, dz));
  u.lane = d > LANE_OVER;
  return d - sp * dt <= stopR;
}

function goHome(u, dt) {
  const st = stationById(u.home);
  if (!st) return;
  u.note = u.recalled ? "recalled — heading home" : u.note.startsWith("damaged") ? u.note : `returning to ${st.name}`;
  const g = droneDoorGoal(st, u, _door);
  if (flyTo(u, g, dt, g.r)) { dock(u, st, u.recalled ? "held" : "outbound"); startDroneBay(u, st, "in"); }
}

function dock(u, st, next = "outbound") {
  u.state = "docked"; u.dockedAt = st.id; u.t = DOCK_SECS; u.next = next; u.lane = false;
  /* the hold goes to the locker below: a leg that thinks it still carries the goods must not sell them again */
  if (u.leg?.phase === "sell") u.leg = null;
  if (u.fleg === "drop") releaseSlot(u);
  const moved = stash(u, st);
  u.note = moved ? `docked at ${st.name} — stashed ${Math.round(moved)}` : `docked at ${st.name}`;
  if (moved) say(u, `Stashed ${Math.round(moved)} units at ${st.name}: ${stashLine(u._lastStash)}.`);
}

function stash(u, st) {
  let moved = 0;
  const locker = (sim.stash[st.id] ??= {});
  u._lastStash = {};
  for (const [id, q] of Object.entries(u.hold)) {
    if (q <= 1e-6) continue;
    locker[id] = (locker[id] ?? 0) + q;
    u._lastStash[id] = q;
    moved += q;
  }
  u.hold = {};
  return moved;
}
const stashLine = (m) => Object.entries(m ?? {}).map(([id, q]) => `${goodName(id)} ×${Math.round(q)}`).join(", ");

function load(u, id, q) {
  const room = u.holdCap - holdQty(u);
  const add = Math.max(0, Math.min(room, q));
  if (add > 0) u.hold[id] = (u.hold[id] ?? 0) + add;
  return add;
}

/* ---- danger ------------------------------------------------------------------ */

/* This runs for every undocked drone on every substep, and it used to build an
 * array, allocate a wrapper object per hostile in range, and then SORT it — to
 * answer two questions: how many are there (capped at three), and which is the
 * nearest. Twelve drones against a hundred and fifty hulls at timeScale 40 was
 * twenty-four sorts and twelve arrays a frame for two numbers.
 *
 * One pass, one reused result object, no sort. `nearest` is the closest hostile
 * and `count` stops climbing at the cap the caller uses, so the scan can stop
 * caring past three. */
const _threat = { count: 0, nearest: null, kind: "", d: Infinity };

function hostilesNear(p, R) {
  _threat.count = 0;
  _threat.nearest = null;
  _threat.kind = "";
  _threat.d = Infinity;
  for (const n of traffic) {
    if (!HOSTILE_ROLES.has(n.role) || n.visible === false || n.job === "down" || n.job === "docked") continue;
    const d = d3(n, p);
    if (d >= R) continue;
    _threat.count++;
    if (d < _threat.d) { _threat.d = d; _threat.nearest = n; _threat.kind = "npc"; }
  }
  for (const c of contacts) {
    if (c.kind !== "drone" || c.relation !== "hostile" || c.hp <= 0) continue;
    const d = d3(c, p);
    if (d >= R) continue;
    _threat.count++;
    if (d < _threat.d) { _threat.d = d; _threat.nearest = c; _threat.kind = "gun"; }
  }
  return _threat;
}

function danger(u, dt) {
  const near = hostilesNear(u, THREAT_R);
  if (!near.count) return;
  const k = u.role === "combat" ? 0.5 : 1;
  u.hp -= Math.min(3, near.count) * 2.5 * k * dt;
  u.underFire = sim.time;
  /* `_threat` is reused, and destroy() only wants the name — read it here, while
   * it is still this drone's threat and not the next one's */
  if (u.hp <= 0) destroy(u, near.nearest);
}

function destroy(u, by) {
  releaseSlot(u);
  releaseAll(u.id);
  for (const m of droneOps.units) if (m.hauler === u.id) m.hauler = null;
  droneOps.units.splice(droneOps.units.indexOf(u), 1);
  burst({ x: u.x, y: u.y, z: u.z, count: 6, speed: 20, size: 5, good: "steel", tint: 0.3 });
  const who = by?.name ?? "raiders";
  /* a drone is the one hull in this game that could always be lost for good,
   * which is why it is the one that most wanted covering */
  const { paid, tier } = settleClaim(droneKey(u.id), { at: sim.time, what: u.name, by: who });
  if (paid > 0) treasuryEarn(paid, `${TIER_BY_ID[tier]?.name ?? "Policy"} settlement on ${u.name}`, "insurance");
  const settled = paid > 0
    ? ` ${TIER_BY_ID[tier]?.name ?? "Cover"} settled ${paid.toLocaleString()} cr.`
    : " No cover on it.";
  say(u, `Lost to ${who}. Last known ${Math.round(u.x / 100)}, ${Math.round(u.z / 100)}.`, [{ label: "Mark wreck", run: () => addWaypointAt(`Wreck · ${u.name}`, u.x, u.y, u.z) }], "alert");
  logEvent(`${u.name} destroyed by ${who}.${settled}`, "combat");
  save();
}

/* ---- roles ----------------------------------------------------------------------- */

const ROLE_STEP = {
  miner(u, dt, r) {
    const site = posOf(u.site, {}) ?? posOf({ kind: "station", id: u.home }, {});
    if (holdQty(u) >= u.holdCap - 0.5) {
      const h = u.hauler ? unitById(u.hauler) : null;
      if (h && h.assign?.id === u.id) { u.state = "waiting"; u.note = `hold full — waiting on ${h.name}`; return; }
      u.state = "returning"; u.note = "hold full — heading home";
      return;
    }
    if (u.state === "waiting") {
      const h = u.hauler ? unitById(u.hauler) : null;
      if (!h || h.assign?.id !== u.id) { u.state = "returning"; return; }
      if (holdQty(u) < u.holdCap * 0.5) u.state = "working";
      return;
    }
    if (u.state === "outbound") {
      u.note = `outbound to ${u.site?.label ?? "site"}`;
      if (flyTo(u, site, dt, 600)) { u.state = "working"; u.target = null; }
      return;
    }
    /* working: find a rock near the site, close to it, cut it (the found rock is kept; rescan when it is gone or every ~2 s) */
    let rock = u.cut && u.cut.key === u.target && (depleted.get(u.target) ?? 0) < 1 && sim.time - (u.scanAt ?? -1e9) < 2 ? u.cut : null;
    if (!rock) {
      u.scanAt = sim.time;
      const all = nearbyRocks(site, sim.time, 1).filter((k) => !k.ice && k.worn < 1);
      /* 0.3.22: a contract that named an ore is what the crew is out here for.
       * Miners work that ore while there is any at the site and go back to the
       * nearest rock when there is not — a free run is unchanged. */
      const want = sim.autoPlan?.seamOre ?? null;
      const onOre = want ? all.filter((k) => k.ore === want) : null;
      /* 0.3.24: and when there is none of it at their site, they do not go on
       * packing the hold with something else — the order needs the room. A
       * contract that cannot be finished because the crew filled the hold with
       * a better rock is the crew's fault, not the belt's. */
      if (want && !onOre.length && holdFrac() > 0.7) {
        u.note = `holding — the hold is spoken for (${want.replace(/_/g, " ")})`;
        u.cut = null;
        u.target = null;
        return;
      }
      const rocks = onOre?.length ? onOre : all;
      rock = (u.target && rocks.find((k) => k.key === u.target)) || null;
      if (!rock) { rocks.sort((a, b) => d3(a, u) - d3(b, u)); rock = rocks[0] ?? null; }
      u.target = rock?.key ?? null;
      if (!rock) {
        if (!u.dryAt || sim.time - u.dryAt > 120) { u.dryAt = sim.time; say(u, `Nothing to cut at ${u.site?.label ?? "the site"}. Send me somewhere with rock.`, [{ label: "Pick a site", run: () => droneOps.openDrone?.(u.id, "site") }], "warn"); }
        u.note = "site dry — holding";
        return;
      }
    }
    u.cut = rock;
    if (!flyTo(u, rock, dt, rock.r + 40)) { u.note = `closing on ${rock.oreName}`; return; }
    const rate = r.rate * (rock.rich ? 1.6 : 1);
    const got = load(u, rock.ore, rate * dt);
    u.stats.mined += got;
    wearRock(rock.key, (rate * dt) / Math.max(30, rock.r * 0.8));
    u.note = `cutting ${rock.oreName}${rock.rich ? " (rich)" : ""}`;
    u.cutting = sim.time;
  },

  hauler(u, dt, r) {
    if (!u.assign && (u.mode === "passive" || !u.mode)) {
      if (!u.lookAt || sim.time - u.lookAt > 10) {
        u.lookAt = sim.time;
        const slot = haulSlots(u).find((s) => s.kind === "miner") ?? freightSlots(u, 1)[0];
        if (slot) { assignSlot(u, slot); u.mode = "passive"; }
      }
      if (!u.assign) { u.note = "no work on the board — holding"; return; }
    }
    if (!u.assign) { u.note = "waiting for a slot"; return; }
    if (u.assign.kind === "miner") return haulForMiner(u, dt);
    return runFreight(u, dt);
  },

  combat(u, dt, r) {
    const anchor = combatAnchor(u, dt);
    if (!anchor) return;
    const found = hostilesNear(anchor, r.range);
    /* `_threat` is shared scratch — take what this branch needs off it now */
    const foe = found.nearest;
    const foeKind = found.kind;      // "npc" = a traffic hull, "gun" = a board contact
    if (!foe) {
      u.state = u.mode === "patrol" ? "patrol" : "holding";
      if (flyTo(u, { x: anchor.x + 260, y: anchor.y + 60, z: anchor.z }, dt, 120)) u.note = u.mode === "patrol" ? `patrolling — point ${u.patrolIx + 1}/${Math.max(1, u.patrol.length)}` : `holding over ${anchorLabel(u)}`;
      else u.note = `moving to ${anchorLabel(u)}`;
      return;
    }
    u.state = "engage";
    const tgt = foe;
    u.note = `engaging ${tgt.name}`;
    flyTo(u, { x: tgt.x + 380, y: tgt.y + 90, z: tgt.z + 200 }, dt, 180);
    if (d3(u, tgt) > 900) return;          // in guns range from the standoff, not from the anchor
    u.cool = (u.cool ?? 0) - dt;
    const byBoard = contactById(foe.id);
    const live = byBoard && byBoard.hp > 0 ? byBoard : null;
    if (live) {
      if (u.cool <= 0) {
        u.cool = 1.1;
        fireRound(u, { x: live.x + (live.vx ?? 0) * 0.5, y: live.y + (live.vy ?? 0) * 0.5, z: live.z + (live.vz ?? 0) * 0.5 }, 900, r.dps * 1.1, `pdrone-${u.id}`, "station");
      }
      return;
    }
    /* out of your contact range: the fight resolves on the numbers */
    if (foeKind !== "npc") return;
    const hp = (droneOps.foes.get(foe.id) ?? 120) - r.dps * dt;
    droneOps.foes.set(foe.id, hp);
    if (hp > 0) return;
    droneOps.foes.delete(foe.id);
    markVesselDown(foe.id, sim.time);
    pirateKilled(foe.id, sim.time);
    treasuryEarn(BOUNTY_DRONE, `${u.name}: bounty on ${foe.name}`, "bounty");
    u.stats.kills++; u.stats.earned += BOUNTY_DRONE;
    say(u, `Downed ${foe.name}. Bounty ${BOUNTY_DRONE} cr.`, [], "ok");
    gnnPost({ desk: "security", title: `${foe.name} downed`, body: `A contracted combat drone, ${u.name}, put the pirate hull down near ${anchorLabel(u)}. The charters paid the standing bounty.` });
  },

  salvager(u, dt, r) {
    if (holdQty(u) >= u.holdCap - 0.5) { u.state = "returning"; u.note = "hold full — heading home"; return; }
    const home = posOf({ kind: "station", id: u.home }, {});
    const centre = u.mode === "site" ? (posOf(u.site, {}) ?? home) : (u.state === "working" && u.chaseAt ? u.chaseAt : home);
    let chunk = u.target && chunks.includes(u.target) && d3(u, u.target) < 4000 ? u.target : null;
    if (!chunk) {
      let bd = u.mode === "site" ? 9000 : 60000;
      for (const c of chunks) { const d = d3(c, centre); if (d < bd) { bd = d; chunk = c; } }
      u.target = chunk;
      if (chunk) u.chaseAt = { x: chunk.x, y: chunk.y, z: chunk.z };
    }
    if (!chunk) { u.state = "holding"; u.note = u.mode === "site" ? "site picked clean — holding" : "no wreckage near home — holding"; flyTo(u, { x: centre.x + 300, y: centre.y, z: centre.z }, dt, 200); return; }
    u.state = "working";
    if (!flyTo(u, chunk, dt, (chunk.r ?? 10) + 30)) { u.note = "closing on wreckage"; return; }
    u.t += dt;
    u.note = "tractoring wreckage";
    if (u.t < 3) return;
    u.t = 0;
    const q = load(u, chunk.good ?? "steel", chunkMass(chunk));
    u.stats.hauled += q;
    removeChunk(chunk);
    u.target = null;
  },

  surveyor(u, dt, r) {
    const site = posOf(u.site, {}) ?? posOf({ kind: "station", id: u.home }, {});
    if (u.state === "outbound") { u.note = `outbound to ${u.site?.label ?? "site"}`; if (flyTo(u, site, dt, 500)) { u.state = "working"; u.sweep = 0; } return; }
    u.sweep += dt;
    const R = Math.min(r.sweepR, 800 + u.sweep * 22);
    const a = u.sweep * (NEAR_SPEED / Math.max(1500, R)) * 0.9;
    flyTo(u, { x: site.x + Math.cos(a) * R, y: site.y + Math.sin(a * 0.3) * 400, z: site.z + Math.sin(a) * R }, dt, 20);
    u.note = `sweeping ${Math.round(R / 100)} km around ${u.site?.label ?? "site"}`;
    if (sim.time - u.lastScan < 20) return;
    u.lastScan = sim.time;
    const rich = nearbyRocks(u, sim.time, 1).find((k) => k.rich);
    if (rich) {
      const cell = `${Math.floor(rich.x / CELL)}|${Math.floor(rich.z / CELL)}`;
      droneOps.veins ??= new Set();
      if (!droneOps.veins.has(cell)) {
        droneOps.veins.add(cell);
        const wp = addWaypointAt(`Survey · ${rich.oreName} vein`, rich.x, rich.y, rich.z);
        u.stats.marks++;
        const a2 = assayPoint(rich.x, rich.y, rich.z);
        fileReport("survey", u.name, a2);
        const miners = droneOps.units.filter((m) => m.role === "miner");
        say(u, `Rich ${rich.oreName} vein — marked on your chart.`, miners.length ? [{ label: `Send ${miners[0].name}`, run: () => setSite(miners[0], { kind: "wp", id: wp.id, label: wp.name }) }] : [], "ok");
        if (/platinum|iridium|uraninite/.test(rich.ore)) gnnPost({ desk: "drones", title: `${rich.oreName} strike`, body: `Survey contractor ${u.name} reports a rich ${rich.oreName} vein. Claim holders are on notice.` });
      }
    }
    if (u.sweep > 900) { u.state = "returning"; u.note = "sweep filed — heading home"; }
  },

  harvester(u, dt, r) {
    if (holdQty(u) >= u.holdCap - 0.5) { u.state = "returning"; u.note = "tanks full — heading home"; return; }
    if (u.mode === "gas") {
      const body = BODIES.find((b) => b.id === u.site?.id && b.kind === "gas") ?? nearestBody(u, (b) => b.kind === "gas");
      if (!body) { u.note = "no gas giant in this sky"; return; }
      const c = bodyPosition(body.id, sim.time, {});
      u.sweep += dt;
      const R = body.radius * 1.35, a = u.sweep * 0.02;
      const p = { x: c.x + Math.cos(a) * R, y: c.y, z: c.z + Math.sin(a) * R };
      if (!flyTo(u, p, dt, 200)) { u.note = `outbound to ${body.name}`; return; }
      const got = load(u, Math.random() < 0.08 ? "helium3_r" : "hydrogen_r", r.rate * dt);
      u.stats.mined += got;
      u.note = `skimming ${body.name}`;
      return;
    }
    const site = posOf(u.site, {}) ?? posOf({ kind: "station", id: u.home }, {});
    if (u.state === "outbound") { u.note = `outbound to ${u.site?.label ?? "site"}`; if (flyTo(u, site, dt, 600)) u.state = "working"; return; }
    let rock = u.cut && u.cut.key === u.target && (depleted.get(u.target) ?? 0) < 1 && sim.time - (u.scanAt ?? -1e9) < 2 ? u.cut : null;
    if (!rock) {
      u.scanAt = sim.time;
      const rocks = nearbyRocks(site, sim.time, 1).filter((k) => k.ice && k.worn < 1);
      rock = (u.target && rocks.find((k) => k.key === u.target)) || rocks.sort((a, b) => d3(a, u) - d3(b, u))[0] || null;
      u.target = rock?.key ?? null;
      if (!rock) { u.note = "no ice here — try the outer belt"; if (!u.dryAt || sim.time - u.dryAt > 120) { u.dryAt = sim.time; say(u, "No ice at this site. The outer belt's frost pockets are the place.", [{ label: "Pick a site", run: () => droneOps.openDrone?.(u.id, "site") }], "warn"); } return; }
    }
    u.cut = rock;
    if (!flyTo(u, rock, dt, rock.r + 40)) { u.note = `closing on ${rock.oreName}`; return; }
    const MELT = { water_ice: "water", methane_ice: "methane", nitrogen_ice: "nitrogen", ammonia_ice: "ammonia", tholins: "organics" };
    const got = load(u, MELT[rock.ore] ?? "water", r.rate * dt);
    u.stats.mined += got;
    wearRock(rock.key, (r.rate * dt) / Math.max(30, rock.r * 0.8));
    u.note = `melting ${rock.oreName}`;
    u.cutting = sim.time;
  },

  courier(u, dt, r) {
    if (!u.leg) {
      const route = u.mode === "route" && u.route ? u.route : tradeRoutes(u, 1)[0];
      if (!route) { u.note = "no margin on the board — holding"; return; }
      u.leg = { ...route, phase: "buy" };
    }
    const leg = u.leg;
    const A = stationById(leg.a), B = stationById(leg.b);
    if (!A || !B) { u.leg = null; return; }
    if (leg.phase === "buy") {
      u.note = `to ${A.name} to buy ${goodName(leg.good)}`;
      if (!flyTo(u, A, dt, (A.radius ?? 100) * 1.2)) return;
      const price = askPrice(A, leg.good);
      const afford = Math.floor(Math.min(r.budget, company.treasury) / Math.max(1, price));
      const qty = lift(A, leg.good, Math.min(u.holdCap, afford, stockOf(A, leg.good)));
      if (qty <= 0) { u.leg = null; say(u, `Could not buy at ${A.name} — ${afford <= 0 ? "treasury is dry" : "shelf is empty"}.`, [], "warn"); return; }
      treasuryPay(qty * price, `${u.name}: bought ${goodName(leg.good)} ×${Math.round(qty)} at ${A.name}`, "trade");
      leg.paid = qty * price; leg.qty = qty; leg.phase = "sell";
      u.hold = { [leg.good]: qty };
      return;
    }
    u.note = `to ${B.name} to sell ${goodName(leg.good)}`;
    if (!flyTo(u, B, dt, (B.radius ?? 100) * 1.2)) return;
    const sale = leg.qty * bidPrice(B, leg.good);
    deliver(B, leg.good, leg.qty);
    treasuryEarn(sale, `${u.name}: sold ${goodName(leg.good)} ×${Math.round(leg.qty)} at ${B.name}`, "trade");
    u.hold = {};
    const profit = Math.round(sale - leg.paid);
    u.stats.earned += profit; u.stats.trips++;
    say(u, `Sold ${goodName(leg.good)} ×${Math.round(leg.qty)} at ${B.name}: ${profit >= 0 ? "+" : ""}${profit} cr.`, [], profit >= 0 ? "ok" : "warn");
    u.leg = u.mode === "route" ? { ...leg, phase: "buy" } : null;
  },

  relay(u, dt, r) {
    const site = posOf(u.site, {}) ?? posOf({ kind: "station", id: u.home }, {});
    if (!flyTo(u, site, dt, 150)) { u.note = `outbound to ${u.site?.label ?? "post"}`; return; }
    u.state = "holding";
    const watch = hostilesNear(u, r.watchR);
    const raiders = watch.count;
    /* `_threat` is a shared scratch object — read what this branch needs off it
     * NOW, because the next drone's scan overwrites it */
    const f = watch.nearest;
    const fd = watch.d;
    u.note = raiders ? `watching ${raiders} raider${raiders > 1 ? "s" : ""}` : `on watch at ${u.site?.label ?? "post"}`;
    if (sim.time - u.lastScan < 30) return;
    u.lastScan = sim.time;
    if (!raiders || !f) return;
    droneOps.alert = { x: f.x, y: f.y, z: f.z, until: sim.time + 90, by: u.id, label: f.name ?? "raider" };
    const mine = droneOps.units.filter((m) => m !== u && d3(m, f) < 40000).length;
    say(u, `${raiders} raider${raiders > 1 ? "s" : ""} inside ${Math.round(r.watchR / 100)} km — nearest ${droneOps.alert.label}, ${Math.round(fd / 100)} km.${mine ? ` ${mine} of your drones in the area.` : ""}`,
      [{ label: "Mark raiders", run: () => addWaypointAt(`Raiders · ${droneOps.alert?.label ?? "contact"}`, f.x, f.y, f.z) }], "alert");
  },

  repair(u, dt, r) {
    if ((u.charge ?? 0) <= 1) { u.state = "returning"; u.note = "charge spent — refilling at home"; return; }
    const tgtPos = posOf(u.guard ?? { kind: "ship" }, {});
    if (!tgtPos) { u.guard = { kind: "ship", label: "your ship" }; return; }
    u.state = "following";
    if (!flyTo(u, { x: tgtPos.x + 200, y: tgtPos.y + 80, z: tgtPos.z - 150 }, dt, 120)) { u.note = `moving to ${u.guard?.label ?? "your ship"}`; return; }
    const g = u.guard ?? { kind: "ship" };
    let patched = 0;
    if (g.kind === "ship" && sim.ship.hull < 100 && !sim.ship.dockedAt) { patched = Math.min(r.rate * dt, 100 - sim.ship.hull, u.charge); sim.ship.hull += patched; }
    const drones = droneOps.units.filter((m) => m !== u && m.hp < m.hpMax && d3(m, u) < 600);
    for (const m of drones) { const p = Math.min(r.rate * dt, m.hpMax - m.hp, u.charge - patched); if (p > 0) { m.hp += p; patched += p; } }
    u.charge -= patched;
    u.note = patched > 0 ? `patching ${g.label ?? "hull"} — charge ${Math.round(u.charge)}` : `standing by ${g.label ?? "your ship"}`;
  },
};

function haulForMiner(u, dt) {
  const m = unitById(u.assign.id);
  if (!m) { releaseSlot(u); return; }
  if (holdQty(u) >= u.holdCap * 0.95 || (u.state === "delivering")) {
    u.state = "delivering";
    const st = stationById(m.home) ?? stationById(u.home);
    u.note = `hauling ${Math.round(holdQty(u))} to ${st?.name ?? "home"}`;
    const g = st && droneDoorGoal(st, u, _door);
    if (st && flyTo(u, g, dt, g.r)) { u.stats.hauled += holdQty(u); dock(u, st, "outbound"); startDroneBay(u, st, "in"); }
    return;
  }
  u.state = "outbound";
  u.note = `to ${m.name}`;
  if (!flyTo(u, m, dt, 160)) return;
  const q = holdQty(m);
  if (q < m.holdCap * 0.5 && m.state !== "waiting") { u.note = `standing by ${m.name} (${Math.round(q)}/${m.holdCap})`; return; }
  for (const [id, have] of Object.entries(m.hold)) {
    const took = load(u, id, have);
    m.hold[id] = have - took;
    if (m.hold[id] <= 1e-6) delete m.hold[id];
  }
  if (m.state === "waiting") m.state = "working";
  if (holdQty(u) >= u.holdCap * 0.6 || !Object.keys(m.hold).length) u.state = "delivering";
}

function runFreight(u, dt) {
  const s = u.assign;
  const A = stationById(s.from), B = stationById(s.to);
  if (!A || !B) { releaseSlot(u); return; }
  if (!u.fleg) u.fleg = "pickup";
  touch(s.key ?? freightKey(s), u.id);
  if (u.fleg === "pickup") {
    u.note = `to ${A.name} for ${goodName(s.good)}`;
    if (!flyTo(u, A, dt, (A.radius ?? 100) * 1.2)) return;
    const got = lift(A, s.good, Math.min(s.qty, u.holdCap));
    if (got <= 0) { say(u, `${A.name} has no ${goodName(s.good)} left. Looking for other work.`, [], "warn"); releaseSlot(u); u.fleg = null; return; }
    u.hold = { [s.good]: got };
    u.fleg = "drop";
    return;
  }
  u.note = `hauling ${goodName(s.good)} to ${B.name}`;
  if (!flyTo(u, B, dt, (B.radius ?? 100) * 1.2)) return;
  const qty = holdQty(u);
  deliver(B, s.good, qty);
  const pay = Math.round(qty * bidPrice(B, s.good) * FREIGHT_RATE);
  treasuryEarn(pay, `${u.name}: ${goodName(s.good)} ×${Math.round(qty)} to ${B.name}`);
  u.hold = {};
  u.stats.hauled += qty; u.stats.earned += pay; u.stats.trips++;
  say(u, `Delivered ${goodName(s.good)} ×${Math.round(qty)} to ${B.name}. Freight paid ${pay} cr to ${company.name}.`, [], "ok");
  u.fleg = null;
  if (u.mode === "passive") releaseSlot(u);      // passive haulers pick the next best job
}

function combatAnchor(u, dt) {
  if (droneOps.alert && (u.mode !== "guard") && d3(droneOps.alert, u) < 60000) return droneOps.alert;
  if (u.mode === "guard" && u.guard) {
    const p = posOf(u.guard, {});
    if (p) return p;
    say(u, `${u.guard.label ?? "My charge"} is gone — falling back to defending home.`, [], "warn");
    u.guard = null; u.mode = "defend";
  }
  if (u.mode === "patrol" && u.patrol.length) {
    const p = posOf(u.patrol[u.patrolIx % u.patrol.length], {});
    if (p && d3(u, p) < 400) u.patrolIx = (u.patrolIx + 1) % u.patrol.length;
    return p;
  }
  return posOf({ kind: "station", id: u.home }, {});
}
function anchorLabel(u) {
  if (droneOps.alert && u.mode !== "guard") return `the alert at ${droneOps.alert.label}`;
  if (u.mode === "guard") return u.guard?.label ?? "its charge";
  if (u.mode === "patrol" && u.patrol.length) return u.patrol[u.patrolIx % u.patrol.length].label;
  return stationById(u.home)?.name ?? "home";
}

function nearestBody(p, pred) {
  let best = null, bd = Infinity;
  for (const b of BODIES) {
    if (!pred(b)) continue;
    const q = bodyPosition(b.id, sim.time, _p);
    const d = d3(p, q);
    if (d < bd) { bd = d; best = b; }
  }
  return best;
}

/** turrets → sim onKill: a round from one of your drones made the kill. */
export function noteDroneKill(owner) {
  const id = String(owner).replace(/^pdrone-/, "");
  const u = unitById(id);
  if (u) { u.stats.kills++; say(u, "Target down.", [], "ok"); }
  return u;
}

/* ---- persistence --------------------------------------------------------------- */

const KEY = () => `lgaa.drones.v1:${sim.skySeed}:${sim.callsign || "pilot"}`;
const KEEP = ["id", "role", "seed", "name", "designation", "home", "site", "mode", "guard", "patrol", "patrolIx", "assign", "route", "hauler", "hold", "holdCap", "hp", "hpMax", "charge", "state", "answered", "x", "y", "z", "dockedAt", "stats", "note", "next", "recalled", "leg", "fleg", "cover", "value"];

export function save() {
  droneOps.savedAt = sim.time;
  try {
    if (typeof localStorage === "undefined") return false;
    const data = { v: 1, seq: droneOps.seq, t: sim.time, cover: droneOps.cover ?? null, units: droneOps.units.map((u) => Object.fromEntries(KEEP.map((k) => [k, u[k]]))), queue: droneOps.queue };
    localStorage.setItem(KEY(), JSON.stringify(data));
    return true;
  } catch { return false; }
}

export function resetDroneOps() {
  droneOps.units.length = 0;
  droneOps.queue.length = 0;
  droneOps.seq = 1;
  droneOps.lastT = null;
  droneOps.foes.clear();
  droneOps.alert = null;
  droneOps.veins = new Set();
  droneOps.sky = sim.skySeed;
}

/** Bring back this sky's drones. Queued builds finish on sim time as if you never left. */
export function loadDroneOps() {
  resetDroneOps();
  try {
    if (typeof localStorage === "undefined") return 0;
    const raw = localStorage.getItem(KEY());
    if (!raw) return 0;
    const data = JSON.parse(raw);
    droneOps.seq = data.seq ?? 1;
    droneOps.cover = data.cover ?? null;
    for (const s of data.units ?? []) {
      if (!DRONE_ROLES[s.role]) continue;
      droneOps.units.push({ ...s, t: 0, target: null, sweep: 0, lastScan: 0, yaw: 0, pitch: 0, answered: s.answered ?? {}, stats: s.stats ?? { mined: 0, hauled: 0, earned: 0, kills: 0, trips: 0, marks: 0 } });
      if (s.assign?.kind === "freight") claim(s.assign.key ?? freightKey(s.assign), s.id);   // the slot it held is still its
      /* Policies live in a Map in js/insurance.js, not in this save file, so
       * a reload would quietly void cover the treasury has already paid for.
       * The drone remembers what it carries; write the policy back from it. */
      if (s.cover && s.value > 0) insure(droneKey(s.id), s.cover, s.value, sim.time);
    }
    const shift = sim.time - (data.t ?? sim.time);
    for (const q of data.queue ?? []) droneOps.queue.push({ ...q, done: q.done + shift });
    return droneOps.units.length;
  } catch { return 0; }
}
