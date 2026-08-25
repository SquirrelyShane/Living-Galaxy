// Contracted hulls fly *around* things now.
//
// The report: "if the suite can get distance from a generated station and a straight line
// to the target, it should be able to decipher if it would encounter a grav well that would
// disrupt it and be able to plot a course to adjust for obstacles."
//
// It could. It just never did. `systems/navplan.js` has planned visibility-graph courses
// around gravity wells since v0.2, and the comment at the top of that file has said "the
// same function plans a warp course, a nav-map preview, and an NPC route" the entire time —
// describing a third caller that did not exist. Company hulls flew straight lines at warp
// speed through planets.
//
// Three properties, and the third is what makes the other two matter:
//
//   1. **The geometry is decidable.** Given a hull, a destination and the body list, the
//      suite can say whether the straight line crosses a well — the same test the planner
//      uses. Asserted directly, so a claim about routing is checkable rather than vibes.
//   2. **A blocked line produces a route that is clear.** Not "produces waypoints" — a
//      planner that emits garbage waypoints also produces waypoints.
//   3. **A well actually stops the bubble.** Routing around wells is decoration unless
//      being inside one costs something. It costs the same thing it costs the player.
//
// Run against generated systems as well as the authored one, because the whole point of a
// procedural map is that its geometry was not hand-checked by anybody.

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
<<<<<<< HEAD
// The entity factories are a boot step rather than an import side effect, so that a system
// asking `spawn('npc', …)` gets a null it can handle instead of depending on which modules
// happened to be loaded. See `core/spawn.js`. A suite that exercises spawning boots them.
(await imp('entities/npcs.js')).registerNpcFactories();
(await imp('entities/shipmesh.js')).registerHullFactory();
const { initMarket, updateMarket } = await imp('systems/trade/market.js');
const { createCharacter } = await imp('systems/crew/character.js');
const G = await imp('world/genesis.js');
const FL = await imp('systems/company/fleet.js');
const { dispatchFleet, updateFleetOrders } = await imp('systems/company/orders.js');
const { WORK } = await imp('systems/company/fleet-work.js');
const NP = await imp('systems/flight/navplan.js');
const { wellRadius, inGravityWell } = await imp('systems/flight/warp.js');
=======
const { initMarket, updateMarket } = await imp('systems/market.js');
const { createCharacter } = await imp('systems/character.js');
const G = await imp('world/genesis.js');
const FL = await imp('systems/fleet.js');
const { dispatchFleet, updateFleetOrders } = await imp('systems/orders.js');
const { WORK } = await imp('systems/fleet-work.js');
const NP = await imp('systems/navplan.js');
const { wellRadius, inGravityWell } = await imp('systems/warp.js');
>>>>>>> 1935cd184c7779d3b421a28a48b3b29b1c83bc44

initScene();
recalcStats();
seedWorld(20260814);
S.seed = 20260814;
S.systemPlan = G.solarisPlan();
createSystem();
createAsteroids();
createNpcs();
initMarket();

const wells = () => S.world.bodies.filter(b => {
  const k = b.userData && b.userData.kind;
  return k === 'planet' || k === 'moon' || k === 'star';
});

/** Does the straight line a→b cross any gravity well that is not the destination? */
function lineBlocked(a, b, destObj) {
  for (const body of wells()) {
    if (destObj && body === destObj) continue;
    const u = body.userData;
    const gap = NP.segmentDistance(a, b, body.position) - wellRadius(u);
    if (gap < 0) return u.name;
  }
  return null;
}

function freshExec() {
  S.company = null;
  S.fleetOrders = [];
  S.crew = [];
  createCharacter({ name: 'Skud', lineage: 'core', corp: 'meridian', career: 'executive' });
  S.credits = 900000;
  S.company.treasury = 900000;
  S.docked = S.world.stations[0];
}

function dispatchOn(role, type, opts = {}) {
  const r = FL.commissionHull(role);
  if (!r.ok) throw new Error('commission refused: ' + r.reason);
  const hull = S.company.fleet[S.company.fleet.length - 1];
  const o = dispatchFleet(type,
    { id: hull.id, role: hull.role, name: hull.name, contractId: hull.id },
    Object.assign({ mode: 'passive' }, opts));
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

// ── 1. the geometry is decidable ─────────────────────────────────────
console.log('\n— the suite can read the geometry —');
{
  const star = S.world.bodies.find(b => b.userData.kind === 'star');
  const V = (x, y, z) => new THREE.Vector3(x, y, z);

  // A line straight through the star is blocked, and one well off to the side is not.
  const R = star.userData.radius + wellRadius(star.userData) + 500;
  ok('a line through the star is blocked',
     lineBlocked(V(-20000, 0, 0), V(20000, 0, 0), null) === star.userData.name);
  ok('a line clear of every well is not blocked',
     lineBlocked(V(-20000, R * 4, 0), V(20000, R * 4, 0), null) === null);
  // Named rather than "nothing blocks it": planets orbit at seeded angles and one may
  // legitimately sit on the +x axis. The claim is about the star we just flew past.
  ok('a body behind you does not block the road ahead',
     lineBlocked(V(R * 2, 0, 0), V(30000, 0, 0), null) !== star.userData.name,
     String(lineBlocked(V(R * 2, 0, 0), V(30000, 0, 0), null)));

  // And the planner agrees with the test — if these two disagreed, everything below would
  // be measuring the wrong thing.
  const wp = NP.planRoute(V(-20000, 0, 0), V(20000, 0, 0), S.world.bodies, wellRadius, null);
  ok('the planner routes around a blocked line', wp.length > 0, String(wp.length));
  ok('and its route is clear',
     NP.routeClear(V(-20000, 0, 0), wp, V(20000, 0, 0), S.world.bodies, wellRadius, null));
  const straight = NP.planRoute(V(-20000, R * 4, 0), V(20000, R * 4, 0),
                                S.world.bodies, wellRadius, null);
  ok('a clear line gets no waypoints at all', straight.length === 0, String(straight.length));
}

// ── 2. a hull given a blocked leg routes around it ───────────────────
console.log('\n— the hull goes around —');
{
  freshExec();
  const { order, ship } = dispatchOn('haul', 'logistics');

  // Let it clear the pad *first*. `travel()` undocks before it moves anything, and
  // `undockHull()` puts the hull back beside its own station — so a position set before
  // the first tick is silently thrown away. This cost three red assertions to find and is
  // exactly the kind of ordering the harness has to respect rather than fight.
  run(2);

  // Now park it so its next leg has to cross the star.
  const far = S.world.stations.reduce((a, b) =>
    (a.position.length() > b.position.length() ? a : b));
  ship.position.set(-far.position.x, -far.position.y, -far.position.z);
  order.phase = 'run';
  order.dstName = far.userData.name;
  order.route = null;
  order.routeDest = null;

  const wasBlocked = lineBlocked(ship.position, far.position, far);
  ok('the straight line to the far berth is blocked', !!wasBlocked, String(wasBlocked));

  run(1);
  ok('the objective planned a route', Array.isArray(order.route) && order.route.length > 0,
     JSON.stringify(order.route));
  ok('and names what it is going around', !!order.routeAround, String(order.routeAround));
  ok('and says so in the leg readout', /routing around/.test(order.leg || ''), order.leg);
  ok('the planned route is actually clear',
     NP.routeClear(ship.position, order.route.map(w => new THREE.Vector3(w.x, w.y, w.z)),
                   far.position, S.world.bodies, wellRadius, far));
}

// ── 3. it does not fly through anything on the way ───────────────────
console.log('\n— and never crosses a well in flight —');
{
  freshExec();
  const { order, ship } = dispatchOn('haul', 'logistics');
  let breaches = 0, worst = null, sampled = 0;

  run(600, 0.25, () => {
    sampled++;
    // The destination's own well is excluded — a berth in a planet's pocket sits inside
    // one by definition, and arriving is not a breach.
    const dest = S.world.bodies.find(b => b.userData &&
      (b.userData.name === order.dstName || b.userData.name === order.srcName));
    for (const body of wells()) {
      if (dest && body === dest) continue;
      const u = body.userData;
      const gap = ship.position.distanceTo(body.position) - u.radius - wellRadius(u);
      // Deep inside, not merely grazing the edge: the ramp and the corner-cutting on a
      // planned polyline both put a hull slightly inside the margin, which the planner's
      // own NAV.margin exists to absorb.
      if (gap < -wellRadius(u) * 0.5) { breaches++; if (!worst) worst = u.name; }
    }
  });
  ok('the flight was actually sampled', sampled > 1000, String(sampled));
  ok('it never flew deep inside a well it was not going to',
     breaches === 0, `${breaches} samples, first at ${worst}`);
  ok('and it still got work done', (order.runs || 0) > 0, String(order.runs));
}

// ── 4. a well stops the bubble ───────────────────────────────────────
// Without this the routing is decoration: a hull that can warp through a planet has no
// reason to go around one.
console.log('\n— a well collapses the bubble —');
{
  freshExec();
  const { order, ship } = dispatchOn('haul', 'logistics');
  const planet = S.world.bodies.find(b => b.userData.kind === 'planet');

  run(2);                                     // off the pad first — see the note above
  // Drop the hull inside a planet's well with a long way still to go.
  ship.position.copy(planet.position);
  ship.position.x += planet.userData.radius + wellRadius(planet.userData) * 0.4;
  const far = S.world.stations.reduce((a, b) =>
    (a.position.distanceTo(ship.position) > b.position.distanceTo(ship.position) ? a : b));
  order.phase = 'run';
  order.dstName = far.userData.name;
  order.route = null; order.routeDest = null; order.warpT = 0;

  ok('the hull starts inside a well', !!inGravityWell(ship.position, null));
  order.warpT = WORK.spoolTime + 5;          // pretend it had a bubble up
  run(0.5);
  ok('the spool timer was reset by the well', (order.warpT || 0) < WORK.spoolTime,
     String(order.warpT));
  ok('and the leg says why', /well/i.test(order.leg || ''), order.leg);

  // It gets out, and once out it warps normally.
  run(120);
  ok('it climbs out of the well eventually', !inGravityWell(ship.position, null));
}

// ── 5. generated systems, not just the authored one ──────────────────
// The authored map's geometry was checked by hand a hundred patches ago. A generated one
// never has been, and it is the one that can put a berth directly behind a gas giant.
console.log('\n— and it holds in generated systems —');
{
  let planned = 0, clear = 0, arrived = 0, tried = 0;
  for (const seed of [7, 42, 1337, 999999]) {
    S.world.bodies = []; S.world.stations = []; S.world.asteroids = [];
    S.world.belts = []; S.world.npcs = [];
    seedWorld(seed); S.seed = seed;
    S.systemPlan = G.generateSystem(seed);
    createSystem(); createAsteroids(); createNpcs(); initMarket();
    freshExec();

    const { order, ship } = dispatchOn('haul', 'logistics');
    run(2);                                   // off the pad before we place it
    const far = S.world.stations.reduce((a, b) =>
      (a.position.distanceTo(ship.position) > b.position.distanceTo(ship.position) ? a : b));
    order.phase = 'run';
    order.dstName = far.userData.name;
    order.route = null; order.routeDest = null;

    tried++;
    const blocked = lineBlocked(ship.position, far.position, far);
    run(1);
    if (blocked) {
      planned++;
      const wps = (order.route || []).map(w => new THREE.Vector3(w.x, w.y, w.z));
      if (wps.length && NP.routeClear(ship.position, wps, far.position,
                                      S.world.bodies, wellRadius, far)) clear++;
    } else {
      // An unblocked line should get no waypoints — a planner that always emits some is
      // spending A* on nothing.
      if (!(order.route || []).length) clear++, planned++;
    }
    run(500);
    if ((order.runs || 0) > 0) arrived++;
  }
  ok('every generated system produced a decision', planned === tried, `${planned}/${tried}`);
  ok('and every decision was correct', clear === tried, `${clear}/${tried}`);
  ok('and hulls still complete deliveries in all of them', arrived === tried,
     `${arrived}/${tried}`);
}

// ── 5b. no dead band between the ramp and the bubble ─────────────────
// `dropOut` (1,400) ran the decel ramp and `warpMin` (1,600) ran the bubble, and the 200
// units between them ran a *flat* cruise at about 15 u/s — thirteen seconds of crawl on
// every leg. In a generated system, where berths pack far closer than Solaris ever put
// them, that band was 46% of a hauler's working life.
console.log('\n— no crawl band —');
{
  const speed = 3;
  const cruise = speed * WORK.transitBoost;
  const at = d => Math.min(WORK.warpSpeed, Math.max(cruise, d * WORK.decel));
  ok('the ramp covers everything below the bubble threshold',
     at(WORK.warpMin - 1) > cruise * 8, `${at(WORK.warpMin - 1)} vs ${cruise}`);
  ok('there is no gap between the ramp and the bubble',
     WORK.dropOut <= WORK.warpMin, `${WORK.dropOut} / ${WORK.warpMin}`);
  // The whole band, at ramp speed, is seconds.
  ok('crossing the whole sub-bubble band takes seconds',
     Math.log(WORK.warpMin / WORK.arriveAt) / WORK.decel < 15,
     (Math.log(WORK.warpMin / WORK.arriveAt) / WORK.decel).toFixed(1) + 's');
}

// ── 6. the cache does not lie ────────────────────────────────────────
console.log('\n— the route cache —');
{
  ok('a replan interval is declared', WORK.replanEvery > 0);
  ok('a drift tolerance is declared', WORK.replanDrift > 0);
  ok('waypoints have an arrival radius', WORK.waypointAt > 0);
  // The drift tolerance has to be tighter than the distance a station covers between
  // replans, or a route to an orbiting berth is stale before it is checked.
  ok('drift tolerance is smaller than the well margin the planner leaves',
     WORK.replanDrift < 4000, String(WORK.replanDrift));

  // Switching legs must throw the old route away. A route to the source is not a route to
  // the market, and inheriting one sends the hull back where it came from.
  freshExec();
  const { order, ship } = dispatchOn('haul', 'logistics');
  run(2);
  const first = JSON.stringify(order.route || []);
  const firstLeg = order.__routeLeg;
<<<<<<< HEAD
  // 900 seconds, not 400. v1.02.53 put a berth on every mining field, and a logistics leg
  // picks its source and market on price rather than proximity — so the best pair in a
  // system can now legitimately be a belt berth out past 20,000 units. The assertion is
  // about the *cache*, not about how fast a hauler is; the window only has to be long
  // enough for one leg change to happen.
  run(900);
=======
  run(400);
>>>>>>> 1935cd184c7779d3b421a28a48b3b29b1c83bc44
  ok('the leg key changed as the run progressed', order.__routeLeg !== firstLeg ||
     JSON.stringify(order.route || []) !== first, `${firstLeg} → ${order.__routeLeg}`);
  ok('the route is a plain serialisable array',
     (order.route || []).every(w => typeof w.x === 'number' && !(w instanceof THREE.Vector3)));
  ok('and survives a JSON round trip',
     JSON.parse(JSON.stringify({ r: order.route || [] })).r.length === (order.route || []).length);
}

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
