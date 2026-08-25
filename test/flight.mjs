// Slice 2 — flight model and navigation. The properties that are invisible from the
// outside: that assist is a powered system with limits rather than a rule that edits
// velocity, that the speed cap is an invariant and not a suggestion, and that the
// course planner's routes are geometrically clear rather than merely plausible.
import { installGlobals } from './stub.mjs';

const ROOT = new URL('../', import.meta.url);
installGlobals(new URL('index.html', ROOT).pathname);

let pass = 0, fail = 0;
const ok = (name, cond, extra = '') => {
  if (cond) { pass++; console.log('  ok   ' + name); }
  else { fail++; console.log('  FAIL ' + name + (extra ? ' — ' + extra : '')); }
};
const imp = p => import(new URL('src/' + p, ROOT).href);

const { S, recalcStats, totalMass } = await imp('core/state.js');
const { seedWorld } = await imp('core/rng.js');
const { FLIGHT, WARP, NAV } = await imp('core/config.js');
const { initScene } = await imp('world/scene.js');
const { createSystem, updateSystem } = await imp('world/system.js');
const { initPlayerFx, updatePlayer } = await imp('entities/player.js');
const { updateWarp, toggleWarp, setCourse, clearCourse, wellRadius,
        planCourse, courseLength, courseClear, inGravityWell } = await imp('systems/flight/warp.js');
const { planRoute, routeClear, routeLength, segmentDistance, collectObstacles } = await imp('systems/flight/navplan.js');
const { initProjectiles } = await imp('systems/combat/projectiles.js');
const { initCombat } = await imp('systems/combat/combat.js');
const { initMining } = await imp('systems/industry/mining.js');

initScene(); recalcStats(); seedWorld(1337); createSystem();
initProjectiles(); initCombat(); initMining(); initPlayerFx();
S.running = true;

const V = THREE.Vector3;
const p = S.player;

function reset(cls = 'military') {
  p.classKey = cls;
  S.cargo.ore = 0; S.cargo.salvage = 0; S.cargo.data = 0;
  recalcStats();
  p.position.set(0, 0, 40000);
  p.velocity.set(0, 0, 0);
  p.yaw = 0; p.pitch = 0; p.throttle = 0;
  p.energy = S.stats.energyCap;
  p.hull = S.stats.hullMax; p.armor = S.stats.armorMax; p.shield = S.stats.shieldMax;
  p.lastHit = -999;
  S.docked = null; S.sim.disabled = null;
  S.warp.state = 'idle'; S.warp.charge = 0; clearCourse();
  S.settings.assist = true;
}
const fly = (n, dt = 1 / 60) => { for (let i = 0; i < n; i++) { S.time += dt; updatePlayer(dt); } };

// ── the speed cap is an invariant ────────────────────────────────────
console.log('\n— terminal velocity —');
reset();
p.throttle = 1;
fly(1200);
ok('the engine alone never exceeds the cap', p.velocity.length() <= S.stats.maxSpeed + 1e-9,
   `${p.velocity.length().toFixed(4)} vs ${S.stats.maxSpeed}`);
ok('full throttle actually reaches the cap', p.velocity.length() > S.stats.maxSpeed * 0.98,
   p.velocity.length().toFixed(3));

// arriving over the cap from outside bleeds off instead of snapping
reset();
p.velocity.set(0, 0, -S.stats.maxSpeed * 4);   // as a warp drop-out leaves you
p.throttle = 0;
const overStart = p.velocity.length();
fly(1);
const afterOne = p.velocity.length();
ok('overspeed is not snapped away in one frame', afterOne > S.stats.maxSpeed,
   afterOne.toFixed(3));
ok('overspeed does fall immediately', afterOne < overStart, `${overStart.toFixed(2)} → ${afterOne.toFixed(2)}`);
fly(300);
ok('overspeed bleeds back under the cap within seconds', p.velocity.length() <= S.stats.maxSpeed + 1e-6,
   p.velocity.length().toFixed(4));
ok('the hard ceiling is respected throughout', afterOne <= S.stats.maxSpeed * FLIGHT.capHard * 4 + 1e-6);

// ── assist is powered hardware, not a free rule ──────────────────────
console.log('\n— flight assist —');

// A cold ship pointed sideways must not curve to follow the nose. This is the v0.2
// behaviour that was physically impossible: velocity rotated for free, at any energy,
// at any throttle. The check is that speed is *lost*, not redirected.
reset();
S.settings.assist = true;
p.velocity.set(0, 0, -2.5);        // moving along -Z
p.yaw = Math.PI / 2;               // nose pointing along -X
p.throttle = 0;
const before = p.velocity.clone();
fly(120);
ok('assist cannot rotate velocity onto the nose for free',
   Math.abs(p.velocity.x) < Math.abs(before.z) * 0.25,
   `vx ${p.velocity.x.toFixed(3)} after 2 s broadside`);
ok('killing drift costs speed rather than redirecting it',
   p.velocity.length() < before.length(),
   `${before.length().toFixed(2)} → ${p.velocity.length().toFixed(2)}`);

// assist off is genuinely Newtonian: nothing changes without thrust
reset();
S.settings.assist = false;
p.velocity.set(0.4, 0, -2.0);
p.throttle = 0;
const drift0 = p.velocity.clone();
fly(600);
ok('assist off holds velocity exactly', p.velocity.distanceTo(drift0) < 1e-9,
   p.velocity.distanceTo(drift0).toExponential(2));
S.settings.assist = true;

// RCS authority is finite and scales with the hull's rated acceleration
reset('military');
p.velocity.set(2.5, 0, 0); p.yaw = 0; p.throttle = 0;
fly(6);
const fastKill = 2.5 - Math.abs(p.velocity.x);
reset('industrial');
p.velocity.set(2.0, 0, 0); p.yaw = 0; p.throttle = 0;
fly(6);
const slowKill = 2.0 - Math.abs(p.velocity.x);
ok('correction authority is capped, not instant', fastKill < 2.5 && fastKill > 0,
   `killed ${fastKill.toFixed(3)} of 2.5 in 0.1 s`);
ok('a heavier hull corrects more slowly', slowKill < fastKill,
   `industrial ${slowKill.toFixed(3)} vs military ${fastKill.toFixed(3)}`);

// a full hold has less authority than an empty one
reset('industrial');
p.velocity.set(1.5, 0, 0); p.throttle = 0;
fly(6);
const emptyKill = 1.5 - Math.abs(p.velocity.x);
reset('industrial');
S.cargo.ore = S.stats.cargoCap * 0.95; recalcStats();
p.velocity.set(1.5, 0, 0); p.throttle = 0;
fly(6);
const ladenKill = 1.5 - Math.abs(p.velocity.x);
ok('a loaded hold handles worse', ladenKill < emptyKill,
   `laden ${ladenKill.toFixed(4)} vs empty ${emptyKill.toFixed(4)}`);
S.cargo.ore = 0; recalcStats();

// a flat battery degrades assist rather than switching it off
reset();
p.velocity.set(2.0, 0, 0); p.throttle = 0; p.energy = S.stats.energyCap;
fly(6);
const chargedKill = 2.0 - Math.abs(p.velocity.x);
reset();
p.velocity.set(2.0, 0, 0); p.throttle = 0; p.energy = 0;
fly(6);
const flatKill = 2.0 - Math.abs(p.velocity.x);
ok('a flat battery weakens assist', flatKill < chargedKill,
   `flat ${flatKill.toFixed(4)} vs charged ${chargedKill.toFixed(4)}`);
ok('a flat battery does not disable assist entirely', flatKill > 0, flatKill.toExponential(2));

// braking still works, and still costs energy
reset();
p.throttle = 1; fly(600);
const cruise = p.velocity.length();
p.throttle = 0; fly(120);
ok('assist brings the ship to rest when idle', p.velocity.length() < cruise * 0.5,
   `${cruise.toFixed(2)} → ${p.velocity.length().toFixed(2)}`);

reset();
p.velocity.set(2.0, 0, 0); p.throttle = 0;
fly(2);
const drawFiring = p.expend;
reset();
p.velocity.set(0, 0, 0); p.throttle = 0;
fly(2);
ok('running the RCS draws power', drawFiring >= FLIGHT.assistDrain && drawFiring > p.expend,
   `${drawFiring.toFixed(1)} MW correcting vs ${p.expend.toFixed(1)} MW coasting`);
// with the bank part-drained the draw is visible in the bank itself, not just the budget
reset();
p.velocity.set(2.0, 0, 0); p.throttle = 0; p.energy = S.stats.energyCap * 0.5;
const e0 = p.energy;
fly(4);
const withRcs = p.energy - e0;
reset();
p.velocity.set(0, 0, 0); p.throttle = 0; p.energy = S.stats.energyCap * 0.5;
fly(4);
ok('the RCS slows the recharge it competes with', withRcs < p.energy - e0,
   `${withRcs.toFixed(3)} vs ${(p.energy - e0).toFixed(3)} MJ`);

// ── handling telemetry ───────────────────────────────────────────────
console.log('\n— handling telemetry —');
reset();
p.throttle = 1; fly(600);
ok('clean flight reads no slip', p.slip > 0.99 && p.drift < 0.05,
   `slip ${p.slip.toFixed(3)} drift ${p.drift.toFixed(3)}`);
S.settings.assist = false;
p.velocity.set(2.0, 0, 0); p.yaw = 0; p.throttle = 0;
fly(2);
ok('flying sideways reads as drift', p.drift > 1.5 && Math.abs(p.slip) < 0.2,
   `slip ${p.slip.toFixed(3)} drift ${p.drift.toFixed(3)}`);
ok('speed telemetry matches the velocity', Math.abs(p.speed - p.velocity.length()) < 1e-9);
S.settings.assist = true;

// ── course planner geometry ──────────────────────────────────────────
console.log('\n— course planner —');
updateSystem(0.5);                                  // seat everything on its orbit
const star = S.world.bodies.find(b => b.userData.kind === 'star');
const bodies = S.world.bodies;

ok('segment distance ignores what is behind you',
   Math.abs(segmentDistance(new V(0, 0, 0), new V(0, 0, 100), new V(0, 0, -500)) - 500) < 1e-6);
ok('segment distance finds the closest approach',
   Math.abs(segmentDistance(new V(-100, 0, 0), new V(100, 0, 0), new V(0, 30, 0)) - 30) < 1e-6);

// the classic case: a destination directly behind the star
{
  // Pick a planet that actually sits outside the star's own mass shadow. An inner world
  // inside it is deliberately exempt from planning — you cannot route around a well the
  // destination lives in — so it would prove nothing here.
  const starWell = wellRadius(star.userData) * NAV.clear;
  const dest = bodies.filter(b => b.userData.kind === 'planet')
                     .find(b => b.position.distanceTo(star.position) > starWell * 1.5);
  ok('a planet outside the star well exists to test with', !!dest);
  const opposite = dest.position.clone().multiplyScalar(-1).normalize().multiplyScalar(38000);
  const wp = planCourse(opposite, dest);
  ok('a route past the star is planned', wp.length > 0, `${wp.length} waypoints`);
  ok('that route is clear of every well',
     routeClear(opposite, wp, dest.position, bodies, wellRadius, dest));
  const direct = opposite.distanceTo(dest.position);
  const planned = routeLength(opposite, wp, dest.position);
  ok('the detour is a detour, not a tour', planned < direct * 2.2,
     `${(planned / direct).toFixed(2)}x straight line`);
}

// every planet, from several directions, on this seed
{
  const starts = [new V(0, 0, 44000), new V(0, 0, -44000), new V(41000, 0, 9000),
                  new V(-33000, 1500, -25000)];
  let n = 0, clear = 0, routed = 0;
  for (const dest of bodies.filter(b => b.userData.kind === 'planet')) {
    for (const from of starts) {
      n++;
      const wp = planCourse(from, dest);
      if (wp.length) routed++;
      if (routeClear(from, wp, dest.position, bodies, wellRadius, dest)) clear++;
    }
  }
  ok(`every course on this seed is clear (${clear}/${n})`, clear === n);
  ok('some of them genuinely needed routing', routed > 0, `${routed}/${n} required waypoints`);
}

// planning is deterministic — a jittering planner cannot be tested or trusted
{
  const dest = bodies.find(b => b.userData.name && b.userData.kind === 'planet');
  const from = new V(0, 0, -40000);
  const a = planCourse(from, dest), b = planCourse(from, dest);
  let same = a.length === b.length;
  for (let i = 0; i < a.length && same; i++) same = a[i].distanceTo(b[i]) < 1e-9;
  ok('the same geometry plans the same route twice', same);
}

// a destination inside another body's well must stay reachable
{
  const moon = bodies.find(b => b.userData.kind === 'moon');
  const from = new V(0, 0, 46000);
  const wp = planCourse(from, moon);
  ok('a moon inside its parent well is still routable', Array.isArray(wp),
     `${wp.length} waypoints`);
  ok('the parent is not treated as a wall around its own moon',
     wp.length <= NAV.maxWaypoints);
}

// starting inside a well is legal — you spawn in one
{
  const inner = star.position.clone(); inner.z += wellRadius(star.userData) * 0.6;
  const dest = bodies.filter(b => b.userData.kind === 'planet').pop();
  const wp = planRoute(inner, dest.position, bodies, wellRadius, dest);
  ok('a route out of a well can be planned', Array.isArray(wp));
}

ok('courseLength agrees with the route it measures', (() => {
  const dest = bodies.find(b => b.userData.kind === 'planet');
  const from = new V(0, 0, 40000);
  const wp = planCourse(from, dest);
  return Math.abs(courseLength(from, dest, wp) - routeLength(from, wp, dest.position)) < 1e-6;
})());

ok('obstacle collection is bounded', (() => {
  const dest = bodies.filter(b => b.userData.kind === 'planet').pop();
  return collectObstacles(new V(0, 0, 46000), dest.position, bodies, wellRadius, dest).length
         <= NAV.maxObstacles;
})());

// ── warp behaviour ───────────────────────────────────────────────────
console.log('\n— warp —');

// a loaded hold costs more to hold in warp
{
  reset('industrial');
  const dest = bodies.filter(b => b.userData.kind === 'planet').pop();
  const runDrain = (oreKg) => {
    reset('industrial');
    S.cargo.ore = oreKg; recalcStats();
    p.position.set(0, 0, 46000); p.energy = S.stats.energyCap;
    setCourse(dest, dest.userData.name);
    S.warp.state = 'warping'; S.warp.charge = 100;
    const e = p.energy;
    for (let i = 0; i < 60; i++) { S.time += 1 / 60; updateWarp(1 / 60); }
    return e - p.energy;
  };
  const light = runDrain(0);
  const heavy = runDrain(S.stats.cargoCap * 0.9);
  ok('a full hold costs more to hold in warp', heavy > light * 1.05,
     `${light.toFixed(2)} vs ${heavy.toFixed(2)} MJ/s`);
  S.cargo.ore = 0; recalcStats();
}

// taking fire while spooling knocks the charge back
{
  reset();
  p.position.set(0, 0, 46000);
  const chargeAfter = (underFire) => {
    reset();
    p.position.set(0, 0, 46000);
    S.warp.state = 'spooling'; S.warp.charge = 0;
    for (let i = 0; i < 60; i++) {
      S.time += 1 / 60;
      if (underFire) p.lastHit = S.time;
      updateWarp(1 / 60);
    }
    return S.warp.charge;
  };
  const quiet = chargeAfter(false);
  const shot = chargeAfter(true);
  ok('spooling charges up when nobody is shooting', quiet > 20, quiet.toFixed(1));
  ok('incoming fire destabilises the spool', shot < quiet,
     `${quiet.toFixed(1)} → ${shot.toFixed(1)} charge in 1 s`);
}

// a stalled course is abandoned out loud rather than flown forever
{
  reset();
  const dest = bodies.filter(b => b.userData.kind === 'planet').pop();
  setCourse(dest, dest.userData.name);
  S.warp.state = 'warping'; S.warp.charge = 100;
  // pin the ship so it cannot possibly make progress
  const pinned = p.position.clone();
  let cleared = false;
  for (let i = 0; i < 60 * 200 && !cleared; i++) {
    S.time += 1 / 60;
    p.energy = S.stats.energyCap;
    updateWarp(1 / 60);
    p.position.copy(pinned);
    if (!S.warp.dest) cleared = true;
  }
  ok('a course that never closes is eventually abandoned', cleared);
  ok('abandoning a course does not leave a stale path', !S.warp.path || !S.warp.path.length);
}

// retargeting mid-cruise keeps the bubble up
{
  reset();
  const planets = bodies.filter(b => b.userData.kind === 'planet');
  setCourse(planets[0], planets[0].userData.name);
  S.warp.state = 'warping'; S.warp.charge = 100;
  setCourse(planets[1], planets[1].userData.name);
  ok('a course change mid-cruise does not drop the drive', S.warp.state === 'warping');
  ok('the new destination takes over', S.warp.dest.obj === planets[1]);
}

// ── the moon placement regression ────────────────────────────────────
console.log('\n— world seating —');
{
  seedWorld(99991);
  S.world.bodies.length = 0;
  createSystem();
  const moons = S.world.bodies.filter(b => b.userData.kind === 'moon');
  ok('moons exist to check', moons.length > 0, `${moons.length} moons`);
  ok('no moon is left sitting on the origin before the first frame',
     moons.every(m => m.position.lengthSq() > 1),
     `${moons.filter(m => m.position.lengthSq() <= 1).length} at the origin`);
  ok('every moon starts near its parent',
     moons.every(m => m.position.distanceTo(m.userData.parent.position)
                      < m.userData.orbitRadius * 1.2 + 1));
}


// ── selecting a place is setting a course ────────────────────────────
//
// The bug a player hit in v1.02.52, and it was maddening precisely because nothing on screen
// explained it: select an asteroid, hit warp, and the ship comes about and burns for the
// star. Not a physics fault — the course was simply never updated, so warp flew to whatever
// had been selected before, which for most pilots is the star they targeted once early on
// and never cleared.
//
// The cause was a whitelist. `DESTINATION_KINDS` listed five kinds of place and had not grown
// when asteroids, Lagrange points, brown dwarfs, remnants and debris fields became targetable.
// A whitelist of "everywhere you can go" has to be edited every time the world gains a kind of
// place and forgetting is silent; a list of things that are *not* places does not, because
// that category is closed.
console.log('\n— selecting a place sets the course —');
{
  const TG = await imp('systems/flight/targeting.js');
  // This suite boots the system but not the belts, and a rock is the whole point here.
  const { createAsteroids } = await imp('world/asteroids.js');
  if (!S.world.asteroids.length) createAsteroids();

  const star = S.world.bodies.find(b => b.userData.kind === 'star');
  const planet = S.world.bodies.find(b => b.userData.kind === 'planet');
  const rock = S.world.asteroids[0];

  ok('there is a rock to fly to', !!rock);

  // Asteroids are plain records, not Object3Ds — hundreds per belt makes a mesh each
  // unaffordable. Warp reads them through `destInfo()` for exactly that reason.
  ok('a rock keeps its facts at the top level, not on userData',
     !!rock && rock.kind === 'asteroid' && !rock.userData);

  TG.setTarget(star, 'star', star.userData.name, 'neutral');
  ok('locking the star sets a course to it', S.warp.dest && S.warp.dest.obj === star);

  TG.setTarget(rock, 'asteroid', rock.name, 'neutral');
  ok('locking a rock moves the course to the rock', S.warp.dest && S.warp.dest.obj === rock,
     S.warp.dest ? S.warp.dest.name : 'no course');
  ok('the lock and the course agree', S.warp.dest.obj === S.target.obj);

  // Every kind the contacts list can show that is a *place* must take the course. This is the
  // check that fails when the next kind of place is added and forgotten.
  const PLACES = ['planet', 'moon', 'star', 'station', 'belt', 'asteroid',
                  'lagrange', 'substellar', 'remnant', 'graveyard', 'anomaly'];
  const missed = [];
  for (const kind of PLACES) {
    TG.setTarget(star, 'star', star.userData.name, 'neutral');       // a known course first
    TG.setTarget(planet, kind, 'probe-' + kind, 'neutral');
    if (!S.warp.dest || S.warp.dest.obj !== planet) missed.push(kind);
  }
  ok(`every kind of place takes the course (${PLACES.length} checked)`, missed.length === 0,
     missed.join(' '));

  // …and a ship does not. You lock a pursuer to shoot it, not to cancel the escape you are in
  // the middle of, so the course has to survive the lock.
  TG.setTarget(rock, 'asteroid', rock.name, 'neutral');
  const held = S.warp.dest.obj;
  const kept = [];
  for (const kind of ['ship', 'pilot', 'projectile', 'missile', 'decoy']) {
    TG.setTarget(planet, kind, 'threat-' + kind, 'hostile');
    if (!S.warp.dest || S.warp.dest.obj !== held) kept.push(kind);
  }
  ok('locking a threat leaves the course alone', kept.length === 0, kept.join(' '));

  // Dropping a lock on a place drops the course with it — a course left behind for somewhere
  // you have just deselected is the same stale-state fault in miniature.
  TG.setTarget(rock, 'asteroid', rock.name, 'neutral');
  TG.clearTarget();
  ok('clearing a place clears its course', !S.warp.dest);
}

console.log(`\n${pass} passed, ${fail} failed\n`);
process.exit(fail ? 1 : 0);
