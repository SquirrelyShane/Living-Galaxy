// Living Galaxy — what a fleet objective actually makes a ship do.
//
// v1.01.90 gave `extract` a real body: the hull flew to a rock, cut it, ran the load in and
// paid the company. The other five order types were left as they had always been — a
// countdown that expired and a line of status text. They dispatched, bound a hull, ran and
// completed correctly, and in between they did nothing at all.
//
// This file is the missing half. Each order type gets a step function that moves the hull,
// reads the world, and produces something that outlives the objective: standing, assay,
// revenue, a contact report. The shapes deliberately mirror `minerStep()` in
// `entities/npcs.js`, because that routine was the one worked example of a working ship and
// it is the pattern the rest should follow.
//
// ── the rule this file follows ───────────────────────────────────────
//
// An objective must not invent value out of time. A patrol that pays a stipend for existing
// is an idle-clicker; a patrol that pays for *hostiles actually driven off a lane* is a
// decision about where to put a ship. So every accrual below is gated on something being
// true in the world — a hostile in sensor range, a body under the scanner, cargo in a hold,
// distance closed — and never on the clock alone.

import { S } from '../../core/state.js';
import { ORDERS, COMPANY, COMMODITIES } from '../../core/config.js';
import { fmtCr } from '../../core/utils.js';
import { status, toast } from '../../core/notify.js';
import { hasCompany, book } from './company.js';
import { roster, hullShip, creditExtraction, undockHull, dockHull } from './fleet.js';
import { adjust } from './reputation.js';
import { holdOf, holdCap, holdMass, loadHold, unloadHold } from '../trade/holds.js';
import { applyTrade, marketPrice } from '../trade/market.js';
import { recordDiagnostic } from '../../data/npc-kb/index.js';
import { HOLD } from '../../core/config.js';
import { fmtKm } from '../../core/utils.js';
import { fieldContacts, fieldPoint } from '../flight/fields.js';
import { nearestAsteroid, mineAsteroid } from '../../world/asteroids.js';
import { transmit } from '../npc/comms.js';
import { planRoute, routeClear, segmentDistance } from '../flight/navplan.js';
import { wellRadius, inGravityWell } from '../flight/warp.js';
import { projects, nextProject, advanceProject, completeProject } from './fleet-projects.js';
import { deliverToSite } from '../platform/worldsim.js';
import { attachModule } from '../../world/system.js';

// ── tuning ───────────────────────────────────────────────────────────
// Kept here rather than in config.js because every number is a property of *this* file's
// accrual rules and means nothing without them.

export const WORK = {
  patrolRadius: 2600,      // units — what a patrolling hull is considered to be covering
  patrolStipend: 3.2,      // cr per second, only while a hostile is inside the radius
  patrolDeterred: 140,     // cr per hostile actually pushed off the lane
  escortRadius: 900,       // units — inside this the escort is doing its job
  escortStipend: 2.4,      // cr per second on station
  surveyRadius: 1400,      // units — close enough for a pass to resolve detail
  surveyRate: 0.012,       // assay fraction per second on station
  keepRadius: 1200,        // units from the station being held
  keepStipend: 1.1,        // cr per second, only while something is on the board to report
  arrive: 260,             // units — close enough to count as arrived
  logisticsLoad: 1400,     // kg a logistics hull picks up per run when a source has stock

  // ── extraction (1.01.92) ───────────────────────────────────────────
  beltArrive: 1800,        // units — close enough to the seam to start hunting rock
  // A hull under orders crosses open space faster than it cuts. Raised with warpMin: this
  // is what flies the sub-bubble hops and the last stretch after drop-out, and at 2.2 the
  // drop-out approach alone took a minute and a half.
  transitBoost: 5.0,
  payCycle: 300,           // s — the outside limit before a load comes home regardless

  // ── the flight cycle (1.01.93) ─────────────────────────────────────
  // A contracted hull flies the same sequence a pilot would: leave the pad, get clear,
  // spool, warp, approach, work, and come back the same way. Every one of these is a state
  // the Ops panel can name, which is the point — "running in" told you nothing about
  // whether the ship was moving.
  padClear: 900,           // units from the station before a drive will engage
  undockSpeed: 0.6,        // fraction of cruise while still on the pad approach
  spoolTime: 6,            // s to build a bubble, mirroring the player's own drive
  warpSpeed: 2600,         // units/s in the bubble
  // Shorter than this and it is not worth spooling. This was 4,000 — and station-to-station
  // in Solaris is often 2,000–3,500, so the most common trip a hauler makes fell *under*
  // the bar and was flown at cruise: about 7 u/s with the transit boost, which is six
  // minutes of real time to cross a gap the player warps in seconds. Every logistics run
  // in the game has been doing that. A six-second spool to save five minutes is worth it
  // at almost any distance, so the bar sits just above the range where the approach phase
  // would handle it anyway.
  warpMin: 1600,
  dropOut: 1400,           // units from the destination the bubble collapses

  // ── the approach ramp (1.02.32) ────────────────────────────────────
  // What the bubble collapsing into cruise used to cost. `dropOut` is 1,400 units and a
  // station-to-station hop in Solaris is often 3,000 — so a hull warped for *half the
  // trip*, dropped out, and then crawled the rest at `u.speed * transitBoost`, which for a
  // hauler is about 15 u/s. Ninety seconds to close the last 1,400 units, sitting next to
  // nothing the whole time. That is the "ships only warp about halfway" report: the warp
  // was working, the arrival was not.
  //
  // The fix is a decel ramp instead of a cliff. Approach speed falls off with the distance
  // left — floored at cruise so the last few units still close, capped at warp speed so it
  // can never exceed the bubble it just left. 1,400 units now takes about two seconds and
  // reads as a ship slowing down rather than as one giving up.
  decel: 1.2,              // per second — approach speed is (distance × this), clamped
  arriveAt: 90,            // units — close enough to count as arrived

  // ── pilotage (1.02.34) ─────────────────────────────────────────────
  // A contracted hull flew a straight line at whatever speed the leg allowed and took no
  // notice of what was in the way. The player's drive has never worked like that: it plans
  // a visibility graph around every gravity well and cannot hold a bubble inside one. The
  // planner in systems/navplan.js is pure — "positions in, waypoints out, so the same
  // function plans a warp course, a nav-map preview, and an NPC route" is a comment that
  // has been sitting at the top of that file since v0.2 describing a caller that did not
  // exist. It exists now.
  //
  // Planning is not free — it is a bounded A* over a visibility graph — so it is cached per
  // leg and only redone when something makes the cached route wrong.
  waypointAt: 240,         // units — close enough to a waypoint to take the next one
  replanEvery: 6,          // s — the outside interval between route checks
  replanDrift: 900,        // units the destination may move before the route is stale

  // ── route variety (1.02.32) ────────────────────────────────────────
  // How many recent endpoints a hauler holds against itself, and what visiting one again
  // costs in the scoring. `bestMarket` was a pure argmax over a price field that moves
  // slowly, so it re-elected the same winner every single run: every hauler in the game
  // flew Fortress Omega ↔ Foundry Alpha and nothing else, forever. The penalty is a
  // *tiebreak*, not a ban — a station paying genuinely more still wins, it just has to
  // actually be worth the repeat.
  // ── the six new jobs (1.02.35) ─────────────────────────────────────
  // Every rate here is "per second on station", and every one of them converts into
  // something that exists rather than into a stipend for elapsed time.
  buildRate: 34,           // credits of module value installed per second by one builder
  siteRate: 2.4,           // scaffold progress per second on a world construction site
  sitePayPerUnit: 26,      // credits per unit of somebody else's scaffold advanced
  salvageRate: 260,        // kg/s across the recovery arm
  salvageValue: 3.2,       // cr/kg for scrap no market keeps a book on
  huntRange: 9000,         // units — how far a hunter will look for a target
  engageRange: 420,        // units — close enough to be in the merge
  huntDps: 9,              // damage per second a company hull puts out
  huntReturnFire: 0.55,    // fraction of the quarry's output that lands on the hunter
  huntBreakOff: 0.34,      // hull fraction at which a hunter disengages and lives
  huntFallbackBounty: 240, // for a kill whose type declares no bounty
  prospectRate: 0.02,      // assay fraction per second on the field
  prospectPay: 5200,       // credits for taking a field from nothing to full
  minSpread: 4,            // cr/kg below which an arbitrage run is not worth the fuel
  tenderThreshold: 0.85,   // hull fraction below which a tender is dispatched
  tenderRate: 1.6,         // hull points per second alongside
  tenderCost: 42,          // credits per hull point

  routeMemory: 3,
  routePenalty: 26,        // credits-equivalent, against the most recent endpoint

  matchRange: 320,         // units — close enough to match and request a pad
  dockTime: 4,             // s on the pad before cargo starts moving
  transferRate: 900,       // kg/s across the arm
  rockRange: 140,          // units — cutting distance
  cutRate: 34              // kg/s at the head, matching HOLD's own miner rate
};

const _v = { x: 0, y: 0, z: 0 };

/** Straight-line seek. Deliberately simple: these ships are not dogfighting. */
function seek(ship, u, dest, dt) {
  if (!dest) return Infinity;
  const dx = dest.x - ship.position.x, dy = dest.y - ship.position.y, dz = dest.z - ship.position.z;
  const len = Math.sqrt(dx * dx + dy * dy + dz * dz);
  if (len < 2) return 0;
  const step = Math.min(len, (u.speed || 1) * dt);
  ship.position.x += dx / len * step;
  ship.position.y += dy / len * step;
  ship.position.z += dz / len * step;
  return len;
}

const stations = () => (S.world && S.world.stations) || [];
const npcs = () => (S.world && S.world.npcs) || [];

function stationNamed(name) {
  return stations().find(s => s.userData && s.userData.name === name) || null;
}

function nearestStation(pos) {
  let best = null, bestD = Infinity;
  for (const st of stations()) {
    const d = st.position.distanceTo(pos);
    if (d < bestD) { bestD = d; best = st; }
  }
  return best;
}

/** The office if there is one, otherwise the nearest berth. */
function homeBerth(pos) {
  if (hasCompany() && S.company.hqStation) {
    const hq = stationNamed(S.company.hqStation);
    if (hq) return hq;
  }
  return nearestStation(pos);
}

/** Hostiles inside a radius of a point. */
function hostilesNear(pos, radius) {
  const out = [];
  const r2 = radius * radius;
  for (const n of npcs()) {
    const u = n.userData;
    if (!u || u.hp <= 0) continue;
    if (u.faction !== 'hostile' && u.faction !== 'pirate') continue;
    if (u.ambush && !u.triggered) continue;
    if (n.position.distanceToSquared(pos) <= r2) out.push(n);
  }
  return out;
}

/** Bank revenue against the company, in-charter where it applies. */
function earn(order, contract, amount, branch) {
  if (!hasCompany() || !(amount > 0)) return 0;
  const got = book(amount, branch || null);
  order.earned = (order.earned || 0) + got;
  if (contract) contract.earned = (contract.earned || 0) + got;
  return got;
}

// ── patrol ───────────────────────────────────────────────────────────
//
// A patrol is worth paying for when it is standing between somebody's cargo and somebody
// else's guns. So the hull flies a circuit around its assigned centre, and the stipend only
// runs while there is actually a hostile inside the radius it is covering. A quiet lane
// pays nothing, which is the correct answer — it is also the signal that the ship is in the
// wrong place.

function patrolStep(order, ship, u, dt) {
  if (!order.centre) {
    const berth = homeBerth(ship.position);
    order.centre = berth ? { x: berth.position.x, y: berth.position.y, z: berth.position.z }
                         : { x: ship.position.x, y: ship.position.y, z: ship.position.z };
    order.circuitAngle = 0;
  }
  // Get to the lane first. A patrol hull assigned a beat on the far side of the system used
  // to start circling from wherever it was standing, which meant it was "on patrol" and
  // earning nothing, several tens of thousands of units from the lane it was being paid to
  // hold. Circle only once you are there.
  if (dist(ship.position, order.centre) > WORK.patrolRadius) {
    order.onBeat = false;
    if (!travel(order, ship, u, order.centre, dt, 'the lane', 'to-beat')) return;
  }
  order.onBeat = true;

  order.circuitAngle = (order.circuitAngle || 0) + dt * 0.05;
  const r = WORK.patrolRadius * 0.6;
  _v.x = order.centre.x + Math.cos(order.circuitAngle) * r;
  _v.y = order.centre.y;
  _v.z = order.centre.z + Math.sin(order.circuitAngle) * r;
  seek(ship, u, _v, dt);

  const seen = hostilesNear(ship.position, WORK.patrolRadius);
  order.contacts = seen.length;
  if (!seen.length) { order.quietFor = (order.quietFor || 0) + dt; return; }
  order.quietFor = 0;

  order.onStation = (order.onStation || 0) + dt;
  earn(order, order.__contract, WORK.patrolStipend * dt, 'military');

  // Deterrence rather than a firefight. A patrol hull that is present and lit pushes a
  // raider off the lane; combat itself stays where combat lives, in entities/npcs.js.
  for (const h of seen) {
    const hu = h.userData;
    if (hu.__deterredBy === order.id) continue;
    if (h.position.distanceToSquared(ship.position) > (WORK.patrolRadius * 0.4) ** 2) continue;
    hu.__deterredBy = order.id;
    hu.target = null;
    order.deterred = (order.deterred || 0) + 1;
    earn(order, order.__contract, WORK.patrolDeterred, 'military');
    adjust('coalition', 0.4, 'fleet patrol');
    status(`${order.assetName} pushed ${hu.name} off the lane`);
  }
}

// ── escort ───────────────────────────────────────────────────────────
//
// Escort has a subject: something is being protected. The default is the player, because
// that is what a pilot means when they tell a hull to escort and name nothing.

function escortStep(order, ship, u, dt) {
  let target = null;
  if (order.protectId) {
    target = npcs().find(n => n.userData && n.userData.name === order.protectId) || null;
  }
  const pos = target ? target.position : (S.player && S.player.position);
  if (!pos) return;

  const d = dist(ship.position, pos);
  order.standoff = Math.round(d);
  if (d > WORK.escortRadius) {
    // Warp to catch up, then fly the last stretch. An escort that can only close at cruise
    // never catches anything that is moving, which is every subject worth escorting.
    order.offStation = (order.offStation || 0) + dt;
    travel(order, ship, u, pos, dt, 'the subject', 'to-subject');
    return;
  }
  seek(ship, u, pos, dt);

  order.onStation = (order.onStation || 0) + dt;
  earn(order, order.__contract, WORK.escortStipend * dt, 'military');

  // Pull hostiles off the protected ship. This is the actual service being bought.
  for (const h of hostilesNear(pos, WORK.escortRadius)) {
    const hu = h.userData;
    if (hu.target && hu.target !== ship) { hu.target = ship; order.pulled = (order.pulled || 0) + 1; }
  }
}

// ── logistics ────────────────────────────────────────────────────────
//
// A round trip with cargo in it. Load at a source berth, fly to the destination, sell,
// bank, and — if the objective is passive — go back and do it again. The same three-state
// shape as the miner, for the same reason: it is legible on the nav map.

function logisticsStep(order, ship, u, dt) {
  const commodity = order.commodity || 'ore';
  if (!COMMODITIES[commodity]) return;

  // `order.phase` is the state; `order.leg` is what the Ops panel prints. They used to be
  // the same field, which was survivable only while logistics moved with a bare `seek()`
  // that never wrote anything. The moment it started warping, `cruise()` overwrote the
  // phase with "warp to Meridian" and the run skipped loading entirely and tried to sell an
  // empty hold. Extraction has always kept the two apart; this now does too.
  if (!order.phase) {
    order.phase = 'load';
    order.leg = 'assigned';
    const src = homeBerth(ship.position);
    order.srcName = src ? src.userData.name : null;
    const dst = order.dest ? stationNamed(order.dest)
                           : bestMarket(commodity, src && src.position, order);
    order.dstName = dst ? dst.userData.name : null;
  }

  if (order.phase === 'load') {
    const src = stationNamed(order.srcName) || homeBerth(ship.position);
    if (!src) return;
    if (!travel(order, ship, u, src.position, dt, src.userData.name, 'to-source', src)) return;
    const room = Math.min(WORK.logisticsLoad, holdCap(u) - holdMass(u));
    if (room <= 1) { order.phase = 'run'; return; }
    loadHold(u, commodity, room);
    applyTrade(src, commodity, room, false);   // the station gives it up: stock falls
    order.phase = 'run';
    order.leg = `loaded ${Math.round(room)} kg at ${src.userData.name}`;
    noteEndpoint(order, src.userData.name);
    // Pick the market against where the cargo actually is now, not where the hull was
    // standing when the order was written.
    if (!order.dest) {
      const m = bestMarket(commodity, src.position, order);
      if (m) order.dstName = m.userData.name;
    }
    return;
  }

  const dst = stationNamed(order.dstName) || bestMarket(commodity, ship.position, order);
  if (!dst) return;
  if (!travel(order, ship, u, dst.position, dt, dst.userData.name, 'to-market', dst)) return;

  const carried = (holdOf(u)[commodity] || 0);
  if (carried > 0) {
    const sold = unloadHold(u, commodity, carried);
    const value = marketPrice(dst, commodity) * sold;
    applyTrade(dst, commodity, sold, true);
    const got = earn(order, order.__contract, value, 'logistic');
    order.delivered = (order.delivered || 0) + sold;
    order.runs = (order.runs || 0) + 1;
    order.leg = `delivered ${Math.round(sold)} kg to ${dst.userData.name}`;
    status(`${order.assetName} delivered ${Math.round(sold)} kg to ${dst.userData.name} · ${fmtCr(Math.round(got))}`);
    recordDiagnostic({
      subjectId: order.contractId || order.assetId,
      t: S.time || 0, kind: 'performance', situation: 'fleet:logistics',
      summary: `${order.assetName} ran ${Math.round(sold)} kg ${commodity} into ${dst.userData.name}`,
      salience: 0.4, tags: ['fleet', 'logistics', commodity]
    });
  }

  // Passive keeps the route running; active has done its leg. A passive hauler re-picks
  // both ends, so a route that stops paying is a route it stops flying.
  if (order.mode === 'passive') {
    order.phase = 'load';
    noteEndpoint(order, dst.userData.name);
    const src = bestSource(commodity, ship.position, order) || stationNamed(order.srcName);
    if (src) order.srcName = src.userData.name;
    order.dstName = null;
  } else { order.workDone = true; }
}

/**
 * Where this cargo is actually worth taking.
 *
 * The destination used to be `farthestFrom(source)` — the single most distant station in
 * the system, chosen for no reason but distance. It made every logistics objective the same
 * flight, ignored what anybody was paying, and sent hulls past three markets that wanted
 * the cargo to reach one that might not.
 *
 * Price per unit against the trip, so a nearer buyer paying nearly as much wins. `bestBuy`
 * is deliberately price-led rather than distance-led: the run is the job, and a hull that
 * only ever serves the next station along is a hull that never opens a route.
 */
function bestMarket(commodity, from, order) {
  let best = null, bestScore = -Infinity;
  for (const s of stations()) {
    if (from && s.position.distanceTo(from) < WORK.arrive) continue;   // not where we are
    const price = marketPrice(s, commodity);
    if (!(price > 0)) continue;
    const trip = from ? s.position.distanceTo(from) : 0;
    // One credit of price is worth about 4,000 units of travel. Tuned so a 10% better
    // price justifies crossing the inner system and not the whole of it.
    //
    // v1.02.32: minus what we already know about this station. A pure argmax over a price
    // field that drifts slowly re-elects the same winner every run — which is why every
    // hauler in the game flew the same two berths and the report reads "it only hauls
    // between Fortress Omega and the Foundry". The recency term is small enough that a
    // station genuinely paying more still wins.
    const score = price - trip / 4000 - recencyCost(order, s.userData.name);
    if (score > bestScore) { bestScore = score; best = s; }
  }
  return best || stations()[0] || null;
}

/**
 * Where to pick this cargo up. Cheapest station that actually has stock, weighted the same
 * way `bestMarket` weights price — a passive hauler that always returns to its home berth
 * runs one lane forever, which is the other half of "they will not go and work other
 * stations".
 */
function bestSource(commodity, from, order) {
  let best = null, bestScore = -Infinity;
  for (const s of stations()) {
    const price = marketPrice(s, commodity);
    if (!(price > 0)) continue;
    const trip = from ? s.position.distanceTo(from) : 0;
    const score = -price - trip / 4000 - recencyCost(order, s.userData.name);
    if (score > bestScore) { bestScore = score; best = s; }
  }
  return best;
}

function farthestFrom(st) {
  if (!st) return stations()[0] || null;
  let best = null, bestD = -1;
  for (const s of stations()) {
    const d = s.position.distanceTo(st.position);
    if (d > bestD) { bestD = d; best = s; }
  }
  return best;
}

// ── survey ───────────────────────────────────────────────────────────
//
// Deepens the assay on a body, which is a number the ground-order system already reads
// (`assayOf()` in systems/orders.js). That is the point: a survey pass is worth flying
// because it makes a later extraction order pay better, not because it fills a bar.

function surveyStep(order, ship, u, dt) {
  const bodies = (S.world && S.world.bodies) || [];
  if (!order.bodyName) {
    const body = bodies.find(b => b.userData && b.userData.kind === 'planet') || bodies[0];
    order.bodyName = body && body.userData ? body.userData.name : null;
  }
  const body = bodies.find(b => b.userData && b.userData.name === order.bodyName);
  if (!body) return;

  // Survey subjects are bodies, and a body is usually nowhere near where the hull is
  // standing when the order lands.
  const d = dist(ship.position, body.position);
  if (d > WORK.surveyRadius) { travel(order, ship, u, body.position, dt, body.userData.name, 'to-body', body); return; }
  seek(ship, u, body.position, dt);

  S.assay = S.assay || {};
  const before = S.assay[order.bodyName] || 0;
  const after = Math.min(ORDERS.maxAssay, before + WORK.surveyRate * dt);
  S.assay[order.bodyName] = after;
  order.assayGained = (order.assayGained || 0) + (after - before);
  order.onStation = (order.onStation || 0) + dt;

  if (after >= ORDERS.maxAssay && !order.workDone) {
    order.bodiesDone = (order.bodiesDone || 0) + 1;
    status(`${order.assetName} completed the assay on ${order.bodyName}`);

    // A quota of more than one body means move on to the next, rather than stop.
    //
    // The order used to end here, always, because one body was the only thing anything had
    // ever asked it for. A survey *contract* asks for one to three, and a hull that
    // resolves the first and then sits over it having declared victory would fail the
    // contract while reporting success — the worst pair of states a system can be in.
    // Clearing `bodyName` sends the next tick to pick the nearest unresolved body, exactly
    // the way the first one was chosen.
    if ((order.quotaBodies || 0) > order.bodiesDone) order.bodyName = null;
    else order.workDone = true;
  }
}

// ── station-keep ─────────────────────────────────────────────────────
//
// A picket. It holds a berth and reports what crosses its scope. The stipend only runs
// while there is something to report, so parking a hull somewhere nothing happens costs
// upkeep and returns nothing — which is the honest outcome and the reason to move it.

function keepStep(order, ship, u, dt) {
  const st = order.stationName ? stationNamed(order.stationName) : homeBerth(ship.position);
  if (!st) return;
  order.stationName = st.userData.name;

  const d = dist(ship.position, st.position);
  if (d > WORK.keepRadius) { travel(order, ship, u, st.position, dt, st.userData.name, 'to-post', st); return; }
  seek(ship, u, st.position, dt);

  const seen = hostilesNear(ship.position, WORK.keepRadius * 2);
  order.contacts = seen.length;
  order.onStation = (order.onStation || 0) + dt;
  if (!seen.length) return;

  earn(order, order.__contract, WORK.keepStipend * dt * seen.length, 'economic');
  for (const h of seen) {
    const hu = h.userData;
    if (hu.__reportedBy === order.id) continue;
    hu.__reportedBy = order.id;
    order.reported = (order.reported || 0) + 1;
    recordDiagnostic({
      subjectId: order.contractId || order.assetId,
      t: S.time || 0, kind: 'incident', situation: 'fleet:contact',
      summary: `${order.assetName} reports ${hu.name} inside the ${order.stationName} scope`,
      salience: 0.5, tags: ['fleet', 'picket']
    });
  }
}

// ── v1.02.35: the six that close the coverage matrix ─────────────────
//
// Every one of these follows the rule at the top of this file: the accrual is gated on
// something being true in the world. A construction order pays when a module is really
// bolted on; a hunt pays for a kill and not for looking; a salvage run pays for what was
// actually recovered and sold. None of them pay for elapsed time.

// ── construction ─────────────────────────────────────────────────────
//
// Three sources of work, because the `build` role had none at all and one source would
// have made it a single-purpose ship. See systems/fleet-projects.js for the state.
//
//   company  — a module the executive has on order. Converts treasury into a real
//              hardpoint on a station you hold. This is the one that compounds.
//   contract — labour on somebody else's scaffold (`S.sim.sites`). Pays credits, builds
//              their thing. Always available, never improves your position.
//   auto     — company work if there is any, contract work otherwise.

function worldSites() {
  return ((S.sim && S.sim.sites) || []).filter(s => !s.done);
}

function constructStep(order, ship, u, dt) {
  const source = order.source || 'auto';

  // Pick the job once and hold it. Re-picking every frame makes a builder oscillate
  // between two sites on opposite sides of the system and never reach either.
  if (!order.job || order.jobDone) {
    order.jobDone = false;
    const co = hasCompany() ? nextProject(order.station || null) : null;
    if (source !== 'contract' && co) {
      order.job = { kind: 'company', id: co.id };
    } else if (source !== 'company') {
      const site = worldSites()[0];
      if (site) order.job = { kind: 'contract' };
      else order.job = null;
    } else {
      order.job = null;
    }
    if (!order.job) {
      order.leg = source === 'company'
        ? 'nothing on the company order book'
        : 'no scaffold needs a crew';
      return;
    }
  }

  if (order.job.kind === 'company') {
    const p = projects().find(x => x.id === order.job.id && !x.done);
    if (!p) { order.job = null; return; }
    const st = stationNamed(p.station);
    if (!st) { order.job = null; return; }
    order.leg = `to ${p.station}`;
    if (!travel(order, ship, u, st.position, dt, p.station, 'to-project', st)) return;

    // On site. Convert time into installed value, billed to the treasury as it goes.
    const put = advanceProject(p, WORK.buildRate * dt);
    order.built = (order.built || 0) + put;
    if (put <= 0) {
      order.leg = `${p.name} — treasury will not cover the next stage`;
      return;
    }
    order.leg = `building ${p.name} · ${Math.round(p.progress / p.need * 100)}%`;
    if (p.readyToFit && completeProject(p, st, attachModule)) {
      order.completed = (order.completed || 0) + 1;
      order.jobDone = true;
      recordDiagnostic({
        subjectId: order.contractId || order.assetId,
        t: S.time || 0, kind: 'performance', situation: 'fleet:construct',
        summary: `${order.assetName} completed ${p.name}`,
        salience: 0.6, tags: ['fleet', 'construct']
      });
      status(`${order.assetName} completed ${p.name}`);
      if (order.mode !== 'passive') order.workDone = true;
    }
    return;
  }

  // Contract labour on a world scaffold.
  const site = worldSites()[0];
  if (!site) { order.job = null; order.leg = 'no scaffold needs a crew'; return; }
  if (!travel(order, ship, u, site.pos, dt, 'the scaffold', 'to-site')) return;

  const before = site.progress;
  deliverToSite(site, WORK.siteRate * dt);
  const put = site.progress - before;
  if (put > 0) {
    order.delivered = (order.delivered || 0) + put;
    earn(order, order.__contract, put * WORK.sitePayPerUnit, 'industrial');
    order.leg = `crewing a scaffold · ${Math.round(site.progress / site.need * 100)}%`;
  }
  if (site.done) {
    order.completed = (order.completed || 0) + 1;
    order.jobDone = true;
    status(`${order.assetName} finished a contract build`);
    if (order.mode !== 'passive') order.workDone = true;
  }
}

// ── salvage ──────────────────────────────────────────────────────────
//
// The field is already full of wreckage: `S.world.loot` is populated by every kill in the
// game and, until now, could only be collected by the player flying over it. A company
// hull that recovers it turns somebody else's firefight into your revenue.

function nearestLoot(pos) {
  let best = null, bd = Infinity;
  for (const l of (S.world.loot || [])) {
    if (!l || !l.mesh || l.kg <= 0) continue;
    const d = l.mesh.position.distanceToSquared(pos);
    if (d < bd) { bd = d; best = l; }
  }
  return best;
}

function salvageStep(order, ship, u, dt) {
  const cap = holdCap(u);
  const aboard = holdMass(u);

  // Full, or the field is clear and we are carrying something: run it in.
  const target = nearestLoot(ship.position);
  if (aboard >= cap * 0.92 || (!target && aboard > 0) || order.phase === 'run') {
    order.phase = 'run';
    const home = homeBerth(ship.position);
    if (!home) return;
    if (!travel(order, ship, u, home.position, dt, home.userData.name, 'salvage-home', home)) return;
    const hold = holdOf(u);
    let value = 0;
    for (const key of Object.keys(hold)) {
      const kg = hold[key];
      if (!(kg > 0)) continue;
      const moved = unloadHold(u, key, kg);
      if (COMMODITIES[key]) {
        value += marketPrice(home, key) * moved;
        applyTrade(home, key, moved, true);
      } else {
        value += moved * WORK.salvageValue;      // scrap the market has no book for
      }
      order.recovered = (order.recovered || 0) + moved;
    }
    if (value > 0) {
      earn(order, order.__contract, value, 'industrial');
      order.runs = (order.runs || 0) + 1;
      order.leg = `landed salvage at ${home.userData.name} · ${fmtCr(Math.round(value))}`;
      status(`${order.assetName} landed ${Math.round(order.recovered)} kg of salvage`);
    }
    order.phase = 'hunt';
    if (order.mode !== 'passive' && order.quotaKg > 0 &&
        (order.recovered || 0) >= order.quotaKg) order.workDone = true;
    return;
  }

  if (!target) { order.leg = 'field is clear — nothing to recover'; return; }

  if (!travel(order, ship, u, target.mesh.position, dt, 'wreckage', 'to-wreck', null)) {
    order.leg = `closing on wreckage · ${Math.round(dist(ship.position, target.mesh.position))}u`;
    return;
  }

  // Alongside. Take what fits.
  const room = cap - holdMass(u);
  const take = Math.min(target.kg, room, WORK.salvageRate * dt);
  if (take > 0) {
    loadHold(u, target.commodity || 'salvage', take);
    target.kg -= take;
    order.leg = `recovering · ${Math.round(holdMass(u))}/${Math.round(cap)} kg`;
  }
  if (target.kg <= 0.5) {
    // Spent containers leave the world the same way the player's pickup removes them.
    const i = (S.world.loot || []).indexOf(target);
    if (i >= 0) {
      if (target.mesh.parent) target.mesh.parent.remove(target.mesh);
      S.world.loot.splice(i, 1);
    }
  }
}

// ── bounty hunting ───────────────────────────────────────────────────
//
// A patrol waits on a lane and is paid for deterrence. A hunt goes and finds the thing.
// It pays the bounty and only the bounty — a sweep that finds nobody earns nothing, which
// is the same rule patrol follows and the reason neither is an idle-clicker.

function huntStep(order, ship, u, dt) {
  let quarry = order.__quarry;
  if (!quarry || !quarry.userData || quarry.userData.hp <= 0 || quarry.parent === null) {
    quarry = hostilesNear(ship.position, WORK.huntRange)[0] || null;
    order.__quarry = quarry;
  }
  if (!quarry) {
    order.leg = 'sweeping — no contact';
    order.quietFor = (order.quietFor || 0) + dt;
    // Drift toward the busiest part of the system rather than sitting still.
    const berth = homeBerth(ship.position);
    if (berth && dist(ship.position, berth.position) > WORK.huntRange) {
      travel(order, ship, u, berth.position, dt, 'the lane', 'to-hunt', berth);
    }
    return;
  }
  order.quietFor = 0;

  const d = dist(ship.position, quarry.position);
  if (d > WORK.engageRange) {
    travel(order, ship, u, quarry.position, dt, quarry.userData.name, 'to-quarry', null);
    order.leg = `closing on ${quarry.userData.name} · ${Math.round(d)}u`;
    return;
  }

  // In the merge. Damage is applied here rather than routed through the projectile system
  // because a company hull is not rendered as a combatant — the outcome is what matters,
  // and the outcome has to be able to go badly, so the quarry shoots back.
  const hu = quarry.userData;
  hu.hp -= WORK.huntDps * dt;
  u.hp = Math.max(1, u.hp - (hu.dmg || 4) * WORK.huntReturnFire * dt);
  order.leg = `engaging ${hu.name} · ${Math.round(100 * hu.hp / (hu.maxHp || 1))}%`;

  if (u.hp <= u.maxHp * WORK.huntBreakOff) {
    order.__quarry = null;
    order.leg = 'broke off — hull too low to press';
    order.brokeOff = (order.brokeOff || 0) + 1;
    return;
  }

  if (hu.hp <= 0) {
    hu.hp = 0;
    order.kills = (order.kills || 0) + 1;
    order.__quarry = null;
    const bounty = hu.bounty || WORK.huntFallbackBounty;
    earn(order, order.__contract, bounty, 'military');
    adjust('coalition', 0.6, 'fleet bounty');
    status(`${order.assetName} killed ${hu.name} — ${fmtCr(Math.round(bounty))}`);
    recordDiagnostic({
      subjectId: order.contractId || order.assetId,
      t: S.time || 0, kind: 'performance', situation: 'fleet:hunt',
      summary: `${order.assetName} killed ${hu.name}`,
      salience: 0.5, tags: ['fleet', 'hunt']
    });
    if (order.mode !== 'passive' && order.quotaKills > 0 &&
        order.kills >= order.quotaKills) order.workDone = true;
  }
}

// ── prospecting ──────────────────────────────────────────────────────
//
// Deepens the assay on a *field* rather than a body, which is the number `assayOf()` in
// systems/orders.js already reads to decide what an extraction order is worth. So a
// prospecting run is worth flying because it makes a later order pay more — the same
// justification survey_pass has, aimed at the belt instead of at a world.

function prospectStep(order, ship, u, dt) {
  const fields = fieldContacts(ship.position, Infinity);
  if (!fields.length) { order.leg = 'no field on the charts'; return; }
  const f = (order.fieldKey && fields.find(x => x.field && x.field.key === order.fieldKey)) || fields[0];
  order.fieldName = f.name;
  if (!order.fieldKey && f.field) order.fieldKey = f.field.key;

  if (!travel(order, ship, u, f.obj.position, dt, f.name, 'to-field', null)) return;

  S.assay = S.assay || {};
  const was = S.assay[f.name] || 0;
  const now = Math.min(1, was + WORK.prospectRate * dt);
  S.assay[f.name] = now;
  order.assay = now;
  order.leg = `prospecting ${f.name} · assay ${Math.round(now * 100)}%`;

  // Paid on the *gain*, not on the time. A field already fully surveyed pays nothing and
  // says so, which is the signal to move the ship.
  const gain = now - was;
  if (gain > 0) earn(order, order.__contract, gain * WORK.prospectPay, 'industrial');
  else order.leg = `${f.name} is fully surveyed — nothing left to learn here`;

  if (order.mode !== 'passive' && now >= 1) order.workDone = true;
}

// ── arbitrage ────────────────────────────────────────────────────────
//
// A logistics run moves cargo and is paid for the mass delivered. Arbitrage picks the
// *pair* — the widest spread in the system for a commodity — and books the difference.
// The distinction matters because it makes the trade role a different ship from the
// freight role rather than a reskin of it.

function bestPair(commodity) {
  let buy = null, sell = null, lo = Infinity, hi = -Infinity;
  for (const s of stations()) {
    const p = marketPrice(s, commodity);
    if (!(p > 0)) continue;
    if (p < lo) { lo = p; buy = s; }
    if (p > hi) { hi = p; sell = s; }
  }
  if (!buy || !sell || buy === sell) return null;
  return { buy, sell, lo, hi, spread: hi - lo };
}

function arbitrageStep(order, ship, u, dt) {
  const commodity = order.commodity || 'ore';
  if (!COMMODITIES[commodity]) return;

  if (!order.phase) order.phase = 'pick';

  if (order.phase === 'pick') {
    const pair = bestPair(commodity);
    if (!pair || pair.spread < WORK.minSpread) {
      order.leg = `no spread worth flying on ${commodity}`;
      order.idleFor = (order.idleFor || 0) + dt;
      return;
    }
    order.idleFor = 0;
    order.buyName = pair.buy.userData.name;
    order.sellName = pair.sell.userData.name;
    order.openSpread = Math.round(pair.spread);
    order.phase = 'buy';
    order.leg = `${commodity}: buy ${order.buyName} ${Math.round(pair.lo)} → sell ${order.sellName} ${Math.round(pair.hi)}`;
    return;
  }

  if (order.phase === 'buy') {
    const st = stationNamed(order.buyName);
    if (!st) { order.phase = 'pick'; return; }
    if (!travel(order, ship, u, st.position, dt, st.userData.name, 'arb-buy', st)) return;
    const room = Math.min(WORK.logisticsLoad, holdCap(u) - holdMass(u));
    if (room <= 1) { order.phase = 'sell'; return; }
    const unit = marketPrice(st, commodity);
    const cost = unit * room;
    if (!hasCompany() || S.company.treasury < cost) {
      order.leg = 'treasury will not cover the buy';
      return;
    }
    S.company.treasury -= cost;
    S.company.spend = (S.company.spend || 0) + cost;
    order.bookCost = cost;
    loadHold(u, commodity, room);
    applyTrade(st, commodity, room, false);
    order.phase = 'sell';
    order.leg = `bought ${Math.round(room)} kg at ${st.userData.name}`;
    return;
  }

  const st = stationNamed(order.sellName);
  if (!st) { order.phase = 'pick'; return; }
  if (!travel(order, ship, u, st.position, dt, st.userData.name, 'arb-sell', st)) return;

  const carried = holdOf(u)[commodity] || 0;
  if (carried > 0) {
    const sold = unloadHold(u, commodity, carried);
    const gross = marketPrice(st, commodity) * sold;
    applyTrade(st, commodity, sold, true);
    // Profit is the interesting number, and it can be negative — prices move while the
    // ship is in transit, which is the actual risk of the trade.
    const profit = gross - (order.bookCost || 0);
    earn(order, order.__contract, gross, 'economic');
    order.profit = (order.profit || 0) + profit;
    order.runs = (order.runs || 0) + 1;
    order.bookCost = 0;
    order.leg = `sold at ${st.userData.name} · profit ${fmtCr(Math.round(profit))}`;
    status(`${order.assetName} cleared ${fmtCr(Math.round(profit))} on ${commodity}`);
  }
  order.phase = order.mode === 'passive' ? 'pick' : 'pick';
  if (order.mode !== 'passive') order.workDone = true;
}

// ── fleet tender ─────────────────────────────────────────────────────
//
// The company's own hulls take damage and have no way to fix it short of abandoning an
// objective and flying home. A tender goes to them. It is the first order type whose
// subject is the fleet itself, which is exactly the sort of thing an executive should be
// able to buy instead of micromanaging.

function tenderStep(order, ship, u, dt) {
  // The neediest hull that is not this one and is actually out there.
  let worst = null, worstFrac = 1;
  for (const c of roster()) {
    if (c.id === (order.contractId || '')) continue;
    const s = hullShip(c);
    if (!s || !s.userData || s.userData.hp <= 0) continue;
    if (s.userData.dockedAt) continue;                 // on a pad, it can fix itself
    const frac = s.userData.hp / (s.userData.maxHp || 1);
    if (frac < worstFrac) { worstFrac = frac; worst = s; }
  }

  if (!worst || worstFrac >= WORK.tenderThreshold) {
    order.leg = 'fleet is sound — holding at the berth';
    const berth = homeBerth(ship.position);
    if (berth && dist(ship.position, berth.position) > WORK.keepRadius) {
      travel(order, ship, u, berth.position, dt, berth.userData.name, 'tender-home', berth);
    }
    order.idleFor = (order.idleFor || 0) + dt;
    return;
  }
  order.idleFor = 0;

  const wu = worst.userData;
  if (!travel(order, ship, u, worst.position, dt, wu.name, 'to-casualty', null)) {
    order.leg = `running to ${wu.name} · hull ${Math.round(worstFrac * 100)}%`;
    return;
  }

  // Alongside. Repairs are billed to the treasury, because a tender is a cost centre that
  // buys uptime — the point is that the ship it is fixing keeps earning.
  const heal = WORK.tenderRate * dt;
  const fee = heal * WORK.tenderCost;
  if (hasCompany() && S.company.treasury >= fee) {
    S.company.treasury -= fee;
    S.company.spend = (S.company.spend || 0) + fee;
    wu.hp = Math.min(wu.maxHp || wu.hp, wu.hp + heal);
    order.repaired = (order.repaired || 0) + heal;
    order.leg = `patching ${wu.name} · ${Math.round(100 * wu.hp / (wu.maxHp || 1))}%`;
    if (wu.hp >= (wu.maxHp || wu.hp)) {
      order.restored = (order.restored || 0) + 1;
      status(`${order.assetName} returned ${wu.name} to full`);
      if (order.mode !== 'passive') order.workDone = true;
    }
  } else {
    order.leg = 'treasury will not cover the repair';
  }
}

const STEPS = {
  extract: extractStep,
  patrol: patrolStep,
  escort: escortStep,
  logistics: logisticsStep,
  survey_pass: surveyStep,
  station_keep: keepStep,
  construct: constructStep,
  salvage: salvageStep,
  hunt: huntStep,
  prospect: prospectStep,
  arbitrage: arbitrageStep,
  tender: tenderStep
};

/**
 * Run one frame of work for every objective that has a hull to do it with.
 *
 * Called from `updateFleetOrders()` before the completion checks, so an objective that
 * finished its work this frame is seen as finished on the same pass.
 */
export function stepFleetWork(orders, dt) {
  if (!(dt > 0) || !Array.isArray(orders)) return;
  for (const o of orders) {
    if (o.status !== 'running') continue;
    const step = STEPS[o.type];
    if (!step) continue;

    const contract = o.contractId ? roster().find(c => c.id === o.contractId) : null;
    if (!contract) continue;                    // a synthetic wing has no ship to move
    const ship = hullShip(contract);
    if (!ship || !ship.userData || ship.userData.hp <= 0) continue;

    o.__contract = contract;
    step(o, ship, ship.userData, dt);
    o.__contract = null;
  }
}

/** A one-line account of what an objective has produced, for Ops and ARIA. */
export function workReport(o) {
  if (!o) return '';
  switch (o.type) {
    case 'patrol':
      return `${o.deterred || 0} pushed off · ${o.contacts || 0} on scope · ${fmtCr(Math.round(o.earned || 0))}`;
    case 'escort':
      return `${Math.round(o.onStation || 0)}s on station · ${o.pulled || 0} pulled · ${fmtCr(Math.round(o.earned || 0))}`;
    case 'logistics':
      return `${o.runs || 0} runs · ${Math.round(o.delivered || 0)} kg · ${fmtCr(Math.round(o.earned || 0))}`;
    case 'survey_pass':
      return `${o.bodyName || 'body'} assay +${Math.round((o.assayGained || 0) * 100)}%`;
    case 'extract':
      return `${o.target || 'no belt'} · ${o.leg || 'assigning'} · ` +
             `${o.returns || 0} runs · ${Math.round(o.delivered || 0)} kg · ${fmtCr(Math.round(o.earned || 0))}`;
    case 'station_keep':
      return `${o.reported || 0} reported · ${o.contacts || 0} on scope · ${fmtCr(Math.round(o.earned || 0))}`;
    default:
      return `${Math.round(o.delivered || 0)} kg · ${fmtCr(Math.round(o.earned || 0))}`;
  }
}

// ── extraction assignment ────────────────────────────────────────────
//
// The reported failure: commission a miner, give it a passive extract objective, and the
// objective reads `Target belt` — the literal word from the menu leaf — while the hull is
// 9.8 Mm away doing something of its own. Warp out and scan it and its manifest holds
// 2,344 kg of ore that the Ops roster never showed and the objective never counted.
//
// Three separate gaps behind one symptom:
//
//   1. **Nothing ever chose a belt.** `order.target` was the string 'belt', not a field, so
//      there was no waypoint to fly to, nothing to broadcast, and nothing for the Executive
//      screen to display.
//   2. **`minerStep()` only looks 5,000 units around itself.** A hull commissioned at a
//      station is nowhere near a seam, so it either wandered or found rock by accident —
//      which is exactly why the ore in that hold was real but unaccounted for.
//   3. **Nothing brought a hull home on a schedule.** Ore became money only at a berth, and
//      the run in was triggered solely by the hold crossing `HOLD.minerRunAt`.
//
// `assignExtraction()` closes the first two. `extractionDue()` closes the third, with the
// rule the pilot asked for: come home early **if the hold is full**, rather than sitting on
// a full hold waiting for a clock — and keep cutting if there is room and time left.

/** The nearest field with rock still in it. */
export function pickBelt(from) {
  const list = fieldContacts(from, Infinity);
  if (!list.length) return null;
  // Prefer a field with unmined rock near its mid-orbit; fall back to simply nearest.
  for (const c of list) {
    const point = fieldPoint(c.field, from);
    if (nearestAsteroid(point, 6000)) return c;
  }
  return list[0];
}

/**
 * Give an extraction objective a real destination, and tell the company about it.
 * Called when the objective starts, and again if the seam it was working runs dry.
 */
function assignExtraction(order, ship) {
  const chosen = pickBelt(ship.position);
  if (!chosen) return false;

  order.target = chosen.name;
  order.beltKey = chosen.field.key;
  const p = fieldPoint(chosen.field, ship.position);
  order.waypoint = { x: p.x, y: p.y, z: p.z };
  order.assignedAt = S.time || 0;

  // Broadcast. The company channel is how a pilot learns what their own ships are doing
  // without opening a panel, and it is the band the rest of the fleet already talks on.
  const berth = homeBerth(ship.position);
  transmit({
    from: order.assetName,
    faction: 'company',
    channel: 'trade',
    text: `${order.assetName} — working ${chosen.name}, ${fmtKm(chosen.d)} out. ` +
          `Loads to ${berth && berth.userData ? berth.userData.name : 'the office'}.`
  });
  status(`${order.assetName} assigned to ${chosen.name}`);
  return true;
}

/**
 * Should this hull break off and run its load in?
 *
 * Full hold wins over the clock, which is the whole point: a hull that cannot carry any
 * more should not keep sitting on the rock until a timer says otherwise.
 */
export function extractionDue(order, u) {
  const cap = holdCap(u);
  if (cap > 0 && holdMass(u) >= cap * HOLD.minerRunAt) return 'full';
  if (order.payT != null && order.payT <= 0 && holdMass(u) > 0) return 'payday';
  return null;
}

/**
 * Where and when. The cutting and the run-in themselves still belong to `minerStep()` in
 * entities/npcs.js — this decides which seam, and when to come home.
 */
/**
 * The extraction flight cycle.
 *
 * ── why this is a state machine and not two branches ─────────────────
 *
 * Up to v1.01.92 this function did one thing — fly the hull to the belt — and then handed
 * the entire rest of the job to `minerStep()` in entities/npcs.js by setting `u.runningIn`
 * and a berth. That handoff was the bug in the report. `minerStep()` only runs for NPCs the
 * world is actively stepping, which means near the player; a company miner working a belt
 * 11 Mm from its owner stopped being stepped the moment the owner left. So the screenshot:
 * hold 2,344 / 2,600 kg, *full*, "running in to Trade Platform" — and 0 runs, 0 kg, 0 cr,
 * forever, because nothing was moving it and nothing ever would.
 *
 * A ship the company is paying upkeep on has to work whether or not anyone is watching it.
 * So the whole cycle lives here, owns its own movement, and never depends on proximity:
 *
 *   docked → undock → clear → spool → warp → approach → mine
 *          → lock home → spool → warp → approach → match → dock → transfer → (hold | repeat)
 *
 * Each state is a word the Ops panel prints, which is the other half of the report: "running
 * in" said nothing about whether the ship was actually moving. "warp 34%" does.
 */
function extractStep(order, ship, u, dt) {
  if (!order.target || order.target === 'belt' || !order.waypoint) {
    if (!assignExtraction(order, ship)) return;
  }
  if (order.payT == null) order.payT = WORK.payCycle;
  if (!order.phase) order.phase = u.dockedAt ? 'docked' : 'outbound';

  const home = homeBerth(ship.position);
  const wp = order.waypoint;

  switch (order.phase) {

    // ── on the pad ─────────────────────────────────────────────────
    case 'docked': {
      // Passive keeps the rotation going; an active objective that has delivered is done.
      if (order.mode !== 'passive' && order.workDone) { order.leg = 'docked'; return; }
      undockHull(ship, u);
      order.payT = WORK.payCycle;
      order.warpT = 0;
      order.phase = 'undock';
      order.leg = 'undocking';
      status(`${order.assetName} undocking from ${u.lastDock || 'the pad'}`);
      return;
    }

    // ── getting clear of the station ───────────────────────────────
    case 'undock': {
      const from = u.padFrom || (home && home.position);
      const clear = from ? dist(ship.position, from) : Infinity;
      if (clear < WORK.padClear) {
        // Straight out along the pad bearing, at manoeuvring speed. A drive does not
        // engage inside a station's keep-out and neither does this.
        pushAway(ship, from, u.speed * WORK.undockSpeed * dt);
        order.leg = `undocking · ${Math.round(clear)}u`;
        return;
      }
      order.phase = 'outbound';
      order.leg = 'clear of the pad';
      return;
    }

    // ── to the belt ────────────────────────────────────────────────
    case 'outbound': {
      if (cruise(order, ship, u, wp, dt, 'belt')) {
        order.phase = 'approach-rock';
        order.leg = 'approaching the seam';
      }
      return;
    }

    // ── pick a rock and close on it ────────────────────────────────
    case 'approach-rock': {
      if (!order.rock || order.rock.ore <= 0) {
        order.rock = nearestAsteroid(ship.position, 9000);
        if (!order.rock) {
          // Seam exhausted where we are. Ask for another rather than sitting still.
          order.leg = 'seam dry — reassigning';
          order.target = null;
          order.waypoint = null;
          order.phase = 'outbound';
          return;
        }
      }
      const d = seek(ship, u, order.rock.pos || order.rock.position || order.rock, dt);
      order.leg = `closing on rock · ${Math.round(d)}u`;
      if (d <= WORK.rockRange) { order.phase = 'mining'; order.leg = 'cutting'; }
      return;
    }

    // ── cutting ────────────────────────────────────────────────────
    case 'mining': {
      const cap = holdCap(u);
      const room = cap - holdMass(u);
      if (room <= 1) { beginRunHome(order, ship, u, home, 'full'); return; }
      if (!order.rock || order.rock.ore <= 0) { order.phase = 'approach-rock'; return; }

      // The pay cycle measures time *at the face*, not elapsed wall time.
      //
      // It used to decrement every frame from dispatch, which meant undocking, the run out
      // and the warp all spent it — so a hull arrived at the seam with the clock already
      // expired, cut for one frame, and turned straight round. Seven complete round trips
      // delivered sixty kilograms between them and the treasury went *down*, because upkeep
      // outran a cargo hold that never filled. Only cutting spends the cycle.
      order.payT -= dt;

      const cut = mineAsteroid(order.rock, Math.min(room, WORK.cutRate * dt));
      if (cut > 0) {
        loadHold(u, 'ore', cut);
        order.cutTotal = (order.cutTotal || 0) + cut;
      }
      order.leg = `cutting · ${Math.round(holdMass(u))}/${cap} kg`;

      const due = extractionDue(order, u);
      if (due) beginRunHome(order, ship, u, home, due);
      return;
    }

    // ── home again ─────────────────────────────────────────────────
    case 'homebound': {
      if (!home) { order.leg = 'no berth to run to'; return; }
      if (cruise(order, ship, u, home.position, dt, 'home')) {
        order.phase = 'match';
        order.leg = 'matching';
      }
      return;
    }

    case 'match': {
      if (!home) return;
      const d = seek(ship, u, home.position, dt);
      order.leg = `matching · ${Math.round(d)}u`;
      if (d <= WORK.matchRange) {
        order.phase = 'docking';
        order.dockT = WORK.dockTime;
        order.leg = 'docking';
      }
      return;
    }

    case 'docking': {
      order.dockT -= dt;
      if (order.dockT > 0) { order.leg = 'docking'; return; }
      dockHull(ship, u, home);
      order.phase = 'transfer';
      order.leg = 'transferring';
      return;
    }

    // ── the arm ────────────────────────────────────────────────────
    case 'transfer': {
      const aboard = (holdOf(u).ore || 0);
      if (aboard <= 0) {
        order.returns = (order.returns || 0) + 1;
        order.payT = WORK.payCycle;
        if (order.mode === 'passive') {
          order.phase = 'docked';
          order.leg = 'turning around';
        } else {
          order.workDone = true;
          order.phase = 'docked';
          order.leg = 'docked';
        }
        return;
      }
      const moved = unloadHold(u, 'ore', Math.min(aboard, WORK.transferRate * dt));
      if (moved > 0) {
        const value = marketPrice(home, 'ore') * moved;
        applyTrade(home, 'ore', moved, true);
        creditExtraction(order.contractId, 'ore', moved, value, home);
      }
      order.leg = `transferring · ${Math.round(holdOf(u).ore || 0)} kg left`;
      return;
    }
  }
}

const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z);

/** Straight out along the bearing from a point, for leaving a pad. */
function pushAway(ship, from, step) {
  if (!from) return;
  const dx = ship.position.x - from.x, dy = ship.position.y - from.y, dz = ship.position.z - from.z;
  const len = Math.hypot(dx, dy, dz) || 1;
  ship.position.x += dx / len * step;
  ship.position.y += dy / len * step;
  ship.position.z += dz / len * step;
}

/**
 * Spool, warp, drop out, close. Returns true once the hull has arrived.
 *
 * Short hops skip the bubble entirely — spooling for six seconds to cross 2,000 units is
 * something no pilot would do and it reads as a stutter rather than as travel.
 */
function cruise(order, ship, u, dest, dt, tag, finalDest) {
  if (!dest) return true;
  const d = dist(ship.position, dest);
  // The distance the Ops panel and the chart read is the distance to where the leg is
  // *going*, not to whichever bypass node the hull happens to be steering at. A readout
  // that counts down to a waypoint and then jumps back up reads as a fault.
  order[tag + 'Dist'] = Math.round(dist(ship.position, finalDest || dest));

  // Inside the bubble's collapse radius: decelerate onto the mark rather than falling
  // straight to cruise. `seek` scales by `u.speed`, so the multiplier below is the ratio
  // between the speed we want and the speed the hull has.
  // Everything below the bubble threshold flies on the ramp.
  //
  // These used to be two branches with a dead band between them: the ramp ran below
  // `dropOut` (1,400) and a *flat* cruise ran between there and `warpMin` (1,600). Two
  // hundred units at 15 u/s is thirteen seconds of crawl on every single leg, and in a
  // generated system — where berths are packed far closer together than Solaris ever put
  // them — that band was 46% of a hauler's working life. One branch: below the threshold
  // you are manoeuvring, and manoeuvring decelerates onto the mark.
  if (d < WORK.warpMin) {
    order.warpT = 0;
    const cruiseSpeed = (u.speed || 1) * WORK.transitBoost;
    const want = Math.min(WORK.warpSpeed, Math.max(cruiseSpeed, d * WORK.decel));
    seek(ship, u, dest, dt * (want / Math.max(0.01, u.speed || 1)));
    order.leg = d <= WORK.dropOut
      ? `approaching ${tag} · ${Math.round(d)}u`
      : `running to ${tag} · ${Math.round(d)}u`;
    return dist(ship.position, dest) <= WORK.arriveAt;
  }

  // A gravity well collapses the bubble. This is the rule the player's drive has always
  // obeyed and company hulls never did — and without it the route planning above is pure
  // decoration, because a hull that can warp straight through a planet has no reason to go
  // around one. With it, the planner is what makes the leg fast.
  //
  // The well the *destination* projects is excluded: a course to a station in a planet's
  // pocket ends inside that planet's well by definition, and treating it as a wall would
  // make the last berth of every inner system unreachable.
  const held = inGravityWell(ship.position, null);
  // ...unless it is the well we are flying *into*. A berth sits in a planet's pocket by
  // design, so the last leg of half the routes in a generated system ends inside a well.
  // Treating that as a brake means a hull crawls the final approach to its own destination
  // — and the same rule kept it crawling on the way back out again.
  const arriving = held && dist(held.position, dest) - held.userData.radius < wellRadius(held.userData);
  if (held && !arriving) {
    order.warpT = 0;
    seek(ship, u, dest, dt * WORK.transitBoost);
    order.leg = `${held.userData.name}'s well — cruising clear · ${Math.round(d)}u`;
    return false;
  }

  order.warpT = (order.warpT || 0) + dt;
  if (order.warpT < WORK.spoolTime) {
    order.leg = `spooling · ${Math.round(order.warpT / WORK.spoolTime * 100)}%`;
    return false;
  }
  seek(ship, u, dest, dt * (WORK.warpSpeed / Math.max(0.01, u.speed)));
  order.leg = `warp to ${tag} · ${fmtKm(d)}`;
  return false;
}

/**
 * Get to a place, warping if it is worth warping.
 *
 * `cruise()` was written for extraction at v1.01.93 and only extraction ever called it.
 * Every other objective moved with a bare `seek()` at the hull's own sublight speed —
 * roughly 2 u/s — which across a 20,000-unit gap between two stations is nearly three
 * hours of wall clock. That is the "they just drift and never get there" report, and it is
 * not a pathing bug: they were arriving, eventually, on a timescale nothing in the game
 * measures.
 *
 * Anything that has to cross open space now goes through here. `phaseKey` keeps each leg's
 * spool timer separate, so a hull that warps to a source, loads, and warps to a market does
 * not carry the first leg's bubble into the second.
 */
// ── pilotage ─────────────────────────────────────────────────────────
//
// Route planning for contracted hulls, over the same visibility graph the player's warp
// drive uses. Three things make this work rather than just look like it works:
//
//   1. **The route is cached per leg.** Planning is a bounded A* and there can be six
//      objectives running; doing it per frame per hull would be the most expensive thing
//      in the simulation by an order of magnitude.
//   2. **It is invalidated on the things that actually make it wrong** — the destination
//      drifting (stations orbit, so every route to one goes stale on its own), the current
//      route no longer being clear, and a slow heartbeat so nothing can be stale forever.
//   3. **A well genuinely stops the bubble.** Routing around wells is decoration unless
//      being in one costs something. `inGravityWell()` is the same check the player's drive
//      makes, and it now applies to company hulls too — which is what turns the planner
//      from a nicety into the thing that makes the leg fast.

/** Everything with a gravity well, for the planner. Same set `inGravityWell` walks. */
const wellBodies = () => S.world.bodies || [];

/**
 * Make sure `order` has a usable route to `dest`, and return the point to steer at.
 *
 * Returns the next waypoint if the hull has to go around something, or `dest` itself when
 * the straight line is clear — which is the common case and costs one visibility test.
 */
function steerPoint(order, ship, dest, destObj, dt, phaseKey) {
  const key = phaseKey || 'leg';
  // A new leg throws the old route away. A route planned to the source berth is not a
  // route to the market, and inheriting one is how a hull ends up flying to where it has
  // already been.
  if (order.__routeLeg !== key) {
    order.__routeLeg = key;
    order.route = null;
    order.routeT = 1e9;
    order.routeAround = null;
  }

  order.routeT = (order.routeT || 0) + dt;
  const moved = order.routeDest
    ? Math.hypot(dest.x - order.routeDest.x, dest.y - order.routeDest.y, dest.z - order.routeDest.z)
    : Infinity;

  // Re-plan when the cache is old, when the destination has drifted out from under it, or
  // when we have never planned this leg at all. `routeClear` is the expensive confirmation
  // and only runs on that schedule, never per frame.
  const due = order.routeT >= WORK.replanEvery || moved > WORK.replanDrift || !order.routeDest;
  if (due) {
    order.routeT = 0;
    order.routeDest = { x: dest.x, y: dest.y, z: dest.z };
    const bodies = wellBodies();
    const target = vec(dest);
    const stillGood = Array.isArray(order.route) && order.route.length &&
      routeClear(ship.position, order.route.map(vec), target, bodies, wellRadius, destObj);
    if (!stillGood) {
      const wp = planRoute(ship.position, target, bodies, wellRadius, destObj);
      // Stored as plain objects: fleet objectives are persisted, and a Vector3 does not
      // survive the round trip through JSON as a Vector3.
      order.route = wp.map(v => ({ x: v.x, y: v.y, z: v.z }));
      order.routeAround = wp.length ? blockerName(ship.position, target, bodies, destObj) : null;
    }
  }

  const route = order.route;
  if (!Array.isArray(route) || !route.length) return dest;

  // Waypoints are consumed as they are reached. A hull that has drifted past one — the
  // destination moved, the route was re-planned mid-leg — must not turn back for it.
  const next = route[0];
  const d = Math.hypot(next.x - ship.position.x, next.y - ship.position.y, next.z - ship.position.z);
  if (d <= WORK.waypointAt) { route.shift(); return route.length ? route[0] : dest; }
  return next;
}

/**
 * A real `THREE.Vector3` for the planner.
 *
 * Two different shapes of "a place" reach `travel()`: a live `body.position`, which is
 * already a Vector3, and `order.centre` — a plain `{x, y, z}` written by `patrolStep`
 * because the patrol centre is *persisted*, and a Vector3 does not survive a save. The
 * planner does real vector maths and needs the real thing, so everything is normalised on
 * the way in and stored back as plain objects on the way out.
 */
const vec = p => (p instanceof THREE.Vector3 ? p : new THREE.Vector3(p.x, p.y, p.z));

/** What the hull is going around, for the leg readout. Nearest well to the straight line. */
function blockerName(from, to, bodies, destObj) {
  let best = null, bestD = Infinity;
  for (const b of bodies) {
    const bu = b.userData;
    if (!bu || (bu.kind !== 'planet' && bu.kind !== 'moon' && bu.kind !== 'star')) continue;
    if (destObj && b === destObj) continue;
    const d = segmentDistance(from, to, b.position) - wellRadius(bu);
    if (d < 0 && d < bestD) { bestD = d; best = bu.name; }
  }
  return best;
}

function travel(order, ship, u, dest, dt, tag, phaseKey, destObj) {
  if (!dest) return true;

  // Leave the pad first.
  //
  // `dockedAt` is what the roster, the Ops fleet card and the executive deck all read to
  // decide whether a hull is on a pad, and it is also what holds the ship out of the
  // world's collision and combat passes and keeps its mesh hidden. Only `minerStep` ever
  // called `undockHull` — it has its own docked→clear→spool phase ladder — so every other
  // objective flew its hull across the system with the flag still set. The ship moved
  // correctly and reported "docked · Fortress Omega" the entire way, and was invisible on
  // the nav map while doing it. That is the report, and it is one line: anything that is
  // about to cross open space is by definition not on a pad.
  if (u.dockedAt) {
    undockHull(ship, u);
    order.leg = 'clearing the pad';
  }

  const key = phaseKey || 'leg';
  if (order.__warpLeg !== key) { order.__warpLeg = key; order.warpT = 0; }

  // Where to actually point. `dest` is where the leg ends; `aim` is the next place the hull
  // can reach in a straight line without crossing a gravity well.
  const aim = steerPoint(order, ship, dest, destObj, dt, key);
  const routing = aim !== dest;

  // Arrival is always judged against the real destination, never against a waypoint. A leg
  // that "completed" on reaching a bypass node is a hull that stops beside a planet and
  // reports that it has arrived at a station.
  const done = cruise(order, ship, u, aim, dt, tag, dest);
  if (routing && order.routeAround) order.leg = `routing around ${order.routeAround} · ${order.leg}`;
  return done && !routing;
}

/**
 * Endpoints this objective has used lately, most recent first.
 *
 * Held on the order rather than on the hull: the memory is about *this route*, and an
 * objective reassigned to a different hull should not inherit the last one's habits.
 */
function noteEndpoint(order, name) {
  if (!name) return;
  const list = order.recent = (order.recent || []).filter(n => n !== name);
  list.unshift(name);
  if (list.length > WORK.routeMemory) list.length = WORK.routeMemory;
}

/** What re-using this endpoint costs in the scoring. Newest visit is penalised hardest. */
function recencyCost(order, name) {
  const i = (order && order.recent || []).indexOf(name);
  if (i < 0) return 0;
  return WORK.routePenalty * (WORK.routeMemory - i) / WORK.routeMemory;
}

/** Stop cutting, lock the office, and start the run home. */
function beginRunHome(order, ship, u, home, why) {
  order.rock = null;
  u.rock = null;
  u.locked = null;
  order.warpT = 0;
  order.phase = 'homebound';
  order.leg = 'breaking off';
  order.homeName = home && home.userData ? home.userData.name : null;
  transmit({
    from: order.assetName,
    faction: 'company',
    channel: 'trade',
    text: why === 'full'
      ? `${order.assetName} — hold full at ${Math.round(holdMass(u))} kg, inbound to ${order.homeName || 'the office'}.`
      : `${order.assetName} — pay cycle up, inbound to ${order.homeName || 'the office'} with what I have.`
  });
  status(`${order.assetName} breaking off — inbound to ${order.homeName || 'the office'}`);
}
