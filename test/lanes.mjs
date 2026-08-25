// Contracted hulls that actually arrive, actually undock, and actually open routes.
//
// Four faults reported off the device at v1.02.31, all of them things a green suite had no
// opinion about, because every existing check asserted that an objective *produced* rather
// than that the ship behaved:
//
//   1. **Ships warped about halfway and then stopped.** They did not stop. The bubble
//      collapses at 1,400 units and a station hop in Solaris is often 3,000, so the hull
//      warped half the trip and crawled the rest at `u.speed * transitBoost` — about
//      15 u/s for a hauler, ninety seconds to cover the last stretch, parked beside
//      nothing the whole way. Asserted here as an arrival deadline, not as a speed.
//   2. **A travelling hull reported "docked".** `undockHull` was called from exactly one
//      place — the miner's own phase ladder — so everything else flew with `dockedAt` set,
//      which is also what hides the mesh and holds the ship out of the collision pass.
//   3. **A hauler served two stations forever.** `bestMarket` was an argmax over a price
//      field that drifts slowly, so it re-elected the same winner every run.
//   4. **Passive objectives expired anyway.** Every type but extraction carried a default
//      clock, so "until recalled" lasted ninety seconds.

import { installGlobals } from './stub.mjs';

const ROOT = new URL('../', import.meta.url);
installGlobals(new URL('index.html', ROOT).pathname);

let pass = 0, fail = 0;
const ok = (name, cond, extra = '') => {
  if (cond) { pass++; console.log('  ok   ' + name); }
  else { fail++; console.log('  FAIL ' + name + (extra ? ' — ' + extra : '')); }
};
const imp = p => import(new URL('src/' + p, ROOT).href);

const { S, recalcStats } = await imp('core/state.js');
const { seedWorld } = await imp('core/rng.js');
const { initScene } = await imp('world/scene.js');
const { createSystem, updateSystem } = await imp('world/system.js');
const { createAsteroids } = await imp('world/asteroids.js');
const { createNpcs, updateNpcs } = await imp('entities/npcs.js');
// The entity factories are a boot step rather than an import side effect, so that a system
// asking `spawn('npc', …)` gets a null it can handle instead of depending on which modules
// happened to be loaded. See `core/spawn.js`. A suite that exercises spawning boots them.
(await imp('entities/npcs.js')).registerNpcFactories();
(await imp('entities/shipmesh.js')).registerHullFactory();
const { initMarket, updateMarket } = await imp('systems/trade/market.js');
const { createCharacter } = await imp('systems/crew/character.js');
const FL = await imp('systems/company/fleet.js');
const { dispatchFleet, updateFleetOrders } = await imp('systems/company/orders.js');
const { WORK } = await imp('systems/company/fleet-work.js');
const CREW = await imp('systems/crew/crew.js');

initScene();
recalcStats();
seedWorld(20260814);
S.seed = 20260814;
createSystem();
createAsteroids();
createNpcs();
initMarket();

function freshExec() {
  S.company = null;
  S.fleetOrders = [];
  S.crew = [];
  createCharacter({ name: 'Skud', lineage: 'core', corp: 'meridian', career: 'executive' });
  S.credits = 900000;
  S.company.treasury = 900000;
  S.docked = S.world.stations[0];
}

/** Commission a hull of `role` and put a passive objective of `type` on it. */
function dispatchOn(role, type) {
  const r = FL.commissionHull(role);
  if (!r.ok) throw new Error('commission refused: ' + r.reason);
  const hull = S.company.fleet[S.company.fleet.length - 1];
  const o = dispatchFleet(type,
    { id: hull.id, role: hull.role, name: hull.name, contractId: hull.id },
    { mode: 'passive' });
  if (typeof o === 'string') throw new Error('dispatch refused: ' + o);
  return { hull, order: o, ship: FL.hullShip(hull) };
}

function run(seconds, dt = 0.25, each) {
  for (let t = 0; t < seconds; t += dt) {
    updateSystem(dt); updateNpcs(dt); updateMarket(dt);
    updateFleetOrders(dt);
    if (each) each(t + dt);
  }
}

// ── 1. the approach ramp ─────────────────────────────────────────────
console.log('\n— the arrival —');

// Pure arithmetic first: what the ramp does at each distance, independent of any world.
{
  const speed = 3;                                  // a hauler's own sublight speed
  const cruise = speed * WORK.transitBoost;
  const at = d => Math.min(WORK.warpSpeed, Math.max(cruise, d * WORK.decel));
  ok('the ramp never exceeds warp speed', at(1e9) === WORK.warpSpeed);
  ok('the ramp never falls below cruise', at(0) === cruise, String(at(0)));
  ok('the ramp is faster far out than close in', at(1200) > at(200));
  // The regression itself: at the drop-out radius the old code moved at cruise. Anything
  // near that is the ninety-second crawl coming back.
  ok('at drop-out the ramp is much faster than cruise',
     at(WORK.dropOut) > cruise * 8, `${at(WORK.dropOut)} vs ${cruise}`);
  // Closing time is the integral of a proportional decel: ~ln(d0/d1)/k seconds.
  const closeTime = Math.log(WORK.dropOut / WORK.arriveAt) / WORK.decel;
  ok('drop-out to arrival takes seconds, not minutes', closeTime < 15, closeTime.toFixed(1) + 's');
}

// And end to end: a real hull, a real objective, on the clock.
{
  freshExec();
  const { order, ship } = dispatchOn('haul', 'logistics');
  let firstRunAt = null;
  run(300, 0.25, t => { if (firstRunAt === null && (order.runs || 0) > 0) firstRunAt = t; });
  ok('a passive hauler completes a delivery', (order.runs || 0) > 0, String(order.runs));
  ok('and it does so inside five minutes of game time',
     firstRunAt !== null && firstRunAt < 300, String(firstRunAt));
  ok('the hull is somewhere real', isFinite(ship.position.x));
}

// ── 2. it is not docked while it is flying ───────────────────────────
console.log('\n— off the pad —');
{
  freshExec();
  const { hull, order, ship } = dispatchOn('haul', 'logistics');
  const u = ship.userData;
  ok('a freshly commissioned hull starts on a pad', !!u.dockedAt, String(u.dockedAt));
  ok('and the roster agrees', FL.fleetRoster().find(h => h.id === hull.id).docked === true);

  // One step of work is enough: `travel()` clears the pad before it moves anything.
  run(2);
  ok('one tick of an objective takes it off the pad', !u.dockedAt, String(u.dockedAt));
  ok('and the roster agrees again',
     FL.fleetRoster().find(h => h.id === hull.id).docked === false);

  // The regression in full: it must not silently re-dock while crossing the system.
  let sawDockedWhileMoving = false;
  let last = { x: ship.position.x, y: ship.position.y, z: ship.position.z };
  run(240, 0.25, () => {
    const moved = Math.hypot(ship.position.x - last.x, ship.position.y - last.y,
                             ship.position.z - last.z);
    last = { x: ship.position.x, y: ship.position.y, z: ship.position.z };
    if (moved > 1 && u.dockedAt) sawDockedWhileMoving = true;
  });
  ok('it never reports docked while it is moving', sawDockedWhileMoving === false);
  ok('it kept working', (order.runs || 0) > 0, String(order.runs));
}

// ── 3. more than two stations ────────────────────────────────────────
console.log('\n— the route opens —');
{
  freshExec();
  const { order } = dispatchOn('haul', 'logistics');
  const seen = new Set();
  run(900, 0.25, () => {
    if (order.srcName) seen.add(order.srcName);
    if (order.dstName) seen.add(order.dstName);
  });
  ok('the hauler ran many deliveries', (order.runs || 0) >= 5, String(order.runs));
  // The reported fault was exactly two — a fixed pair, forever.
  ok('it used more than two berths', seen.size > 2, [...seen].join(', '));
  ok('it used at least four', seen.size >= 4, `${seen.size}: ${[...seen].join(', ')}`);
  ok('the route memory is bounded',
     (order.recent || []).length <= WORK.routeMemory, String((order.recent || []).length));

  // The penalty is a tiebreak, not a ban: every endpoint it chose is a real station.
  const names = new Set(S.world.stations.map(s => s.userData.name));
  ok('every endpoint it chose exists', [...seen].every(n => names.has(n)));
}

// ── 4. passive means until recalled ──────────────────────────────────
console.log('\n— passive is not a countdown —');
{
  freshExec();
  const { order } = dispatchOn('haul', 'logistics');
  ok('a passive objective carries no clock', order.durationSec === 0, String(order.durationSec));
  run(400);
  ok('it is still running long past the old ninety-second default',
     S.fleetOrders.includes(order) && order.status === 'running', order.status);
}
{
  // ...and an explicitly requested duration still wins, because the caller meant it.
  freshExec();
  const r = FL.commissionHull('haul');
  const hull = S.company.fleet[S.company.fleet.length - 1];
  const o = dispatchFleet('logistics',
    { id: hull.id, role: hull.role, name: hull.name, contractId: hull.id },
    { mode: 'passive', durationSec: 45 });
  ok('an explicit duration survives passive mode', o.durationSec === 45, String(o.durationSec));
  ok('and the commission went through', r.ok === true);
}

// ── 5. an executive has no ship's crew ───────────────────────────────
console.log('\n— nobody aboard —');
{
  S.crew = [];
  createCharacter({ name: 'Rook', lineage: 'core', corp: 'meridian', career: 'prospector' });
  CREW.initCrew();
  ok('a pilot is issued a starting crew', (S.crew || []).length === 2, String((S.crew || []).length));
  ok('and a payroll to go with it', CREW.payroll() > 0);

  // The reported case: the deck read "Crew 2 · payroll" for a founder with no ship.
  createCharacter({ name: 'Skud', lineage: 'core', corp: 'meridian', career: 'executive' });
  ok('a founder is issued none', (S.crew || []).length === 0, String((S.crew || []).length));
  ok('and draws no payroll', CREW.payroll() === 0, String(CREW.payroll()));
  ok('and no rations', CREW.mouths() === 0, String(CREW.mouths()));

  // initCrew() runs at boot, before creation on a new game — so it has to refuse too, not
  // just be undone afterwards.
  S.crew = [];
  CREW.initCrew();
  ok('and initCrew refuses to issue one to a founder', (S.crew || []).length === 0);

  // Switching back re-arms it: the rule is the capability, not a one-way door.
  createCharacter({ name: 'Rook', lineage: 'core', corp: 'meridian', career: 'hauler' });
  S.crew = [];
  CREW.initCrew();
  ok('a licensed career gets a crew again', (S.crew || []).length === 2);
}

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
