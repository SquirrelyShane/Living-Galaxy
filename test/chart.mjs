// The galactic chart, and going somewhere.
//
// v1.02.44 made the rendered system a node on a real galaxy; v1.02.46 stopped a load from
// forgetting where that was. What neither did was let anybody *move*: `GALAXY.jumpRange` and
// the fuel constants were exercised by `test/galaxy.mjs` and by nothing in the game, and
// `docs/OPEN_ENDS.md` listed that as the last genuinely inert mechanic in the tree.
//
// What this suite pins:
//
//   1. **A jump is refused with a number, never greyed out silently.** Range, charge, docking.
//   2. **Arrival is a whole system, and it is the one the chart promised.** Same seed, same
//      class, same designation — the chart may not lie about where you are going.
//   3. **The old system is gone.** `createSystem()` appends; a jump that did not tear down
//      would leave two stars, two sets of berths and two belts in the same space, all of which
//      the broadphase and the targeting queries would walk.
//   4. **The pilot survives and the place does not.** Credits, crew, standing and the company
//      cross with you; boards and markets belong to the berth you left.

import { installGlobals } from './stub.mjs';
const ROOT = new URL('../', import.meta.url);
installGlobals(new URL('index.html', ROOT).pathname);

let pass = 0, fail = 0;
const ok = (n, c, x = '') => { if (c) { pass++; console.log('  ok   ' + n); }
  else { fail++; console.log('  FAIL ' + n + (x ? ' — ' + x : '')); } };
const imp = p => import(new URL('src/' + p, ROOT).href);

const { S, recalcStats } = await imp('core/state.js');
const { GALAXY } = await imp('core/config.js');
const { seedWorld } = await imp('core/rng.js');
const G = await imp('world/galaxy.js');
const J = await imp('systems/flight/jump.js');
const { generateSystem } = await imp('world/genesis.js');
const SC = await imp('world/scene.js');
const { createSystem } = await imp('world/system.js');
const { createAsteroids } = await imp('world/asteroids.js');
const { initPointField } = await imp('world/pointfield.js');
const { initParticles } = await imp('world/particles.js');
const { buildWells } = await imp('world/wells.js');
const { initWorldSim } = await imp('systems/platform/worldsim.js');
const { initMarket } = await imp('systems/trade/market.js');
const { initContracts } = await imp('systems/trade/contracts.js');

SC.initScene(); recalcStats();
initPointField(SC.scene); initParticles(SC.scene);

const GS = 7788;
const home = G.homeNode(GS);
S.galaxy = { seed: GS, node: home.i };
S.seed = home.seed;
seedWorld(S.seed);
const { planFor } = await imp('world/genesis.js');
S.systemPlan = planFor(S.seed, 'procedural');
createSystem(); createAsteroids(); buildWells();
initWorldSim(); initMarket(); initContracts();
S.player.energy = 500;

console.log('\n— a refusal names its number —');
{
  ok('you are where the chart says you are', J.currentNode().i === home.i);
  ok('jumping to here is refused', /already here/i.test(J.jumpBlocker(home) || ''));
  ok('and to nothing at all', !!J.jumpBlocker(null));

  const far = G.nodeAt(GS, (home.i + 25000) % GALAXY.count);
  const why = J.jumpBlocker(far);
  ok('a distant node is out of range', /out of range/i.test(why || ''), why || '');
  ok('and the refusal states both numbers', /\d+ ly/.test(why) && /reaches \d+/.test(why), why);

  const near = G.nodesNear(GS, home.x, home.y, home.z, GALAXY.jumpRange).find(n => n.i !== home.i);
  ok('there is somewhere reachable', !!near);
  S.player.energy = 0;
  const poor = J.jumpBlocker(near);
  ok('an empty core is refused by charge', /charge/i.test(poor || ''), poor || '');
  ok('and states what it needs', /needs \d+/.test(poor || ''), poor || '');
  S.player.energy = 500;

  S.docked = { userData: { name: 'X' } };
  ok('docked refuses', /undock/i.test(J.jumpBlocker(near) || ''));
  S.docked = null;
  ok('and clear of all that, it is allowed', J.jumpBlocker(near) === null, J.jumpBlocker(near) || '');
  ok('the cost is the galaxy formula, not a second one',
     J.costTo(near) === G.jumpCost(home, near));
}

console.log('\n— arriving —');
{
  const near = G.nodesNear(GS, home.x, home.y, home.z, GALAXY.jumpRange).find(n => n.i !== home.i);
  const before = {
    star: S.systemPlan.star.name,
    bodies: S.world.bodies.length,
    stations: S.world.stations.length,
    rocks: S.world.asteroids.length,
    credits: S.credits, energy: S.player.energy
  };
  const cost = J.costTo(near);
  const arrived = J.jumpTo(near);

  ok('the jump happened', !!arrived && arrived.i === near.i);
  ok('it charged the core', S.player.energy === before.energy - cost,
     `${before.energy} → ${S.player.energy}, cost ${cost}`);
  ok('the placement moved', S.galaxy.node === near.i);
  ok('and the system seed followed the node', S.seed === (near.seed >>> 0));

  // The chart may not lie: what was promised is what is here.
  const promised = generateSystem(near.seed);
  ok('the star is the one the chart named', S.systemPlan.star.name === promised.star.name,
     `${S.systemPlan.star.name} vs ${promised.star.name}`);
  ok('and the class matches the chart marker', S.systemPlan.star.class === near.cls);
  ok('the designation is the node’s', S.systemPlan.designation === G.designation(near));
  ok('it is a different system from the one we left', S.systemPlan.star.name !== before.star,
     `${before.star} → ${S.systemPlan.star.name}`);

  // The teardown. `createSystem()` appends — without it these would be sums, not swaps.
  // Counting bodies against the plan is the wrong assertion and the first version made it:
  // moons are rolled by the *world builder*, not carried in the plan (a known gap since
  // v1.02.33), so the total is legitimately higher than `planets + 1`. The claim that actually
  // matters for a teardown is that nothing is duplicated — one star, and every planet named
  // once.
  const stars = S.world.bodies.filter(b => b.userData && b.userData.kind === 'star');
  ok('there is exactly one star, not two', stars.length === 1, `${stars.length} stars`);
  const names = S.world.bodies.map(b => b.userData && b.userData.name);
  ok('and no body appears twice', new Set(names).size === names.length,
     `${names.length} bodies, ${new Set(names).size} names`);
  ok('every planet in the plan is present once',
     promised.planets.every(pl => names.filter(n => n === pl.name).length === 1));
  ok('and one system’s worth of berths',
     S.world.stations.length === promised.stations.length,
     `${S.world.stations.length} vs ${promised.stations.length}`);
  ok('the old rocks went with the old belt',
     S.world.asteroids.length > 0 && S.world.asteroids.length < before.rocks * 2,
     `${before.rocks} → ${S.world.asteroids.length}`);
  ok('nothing is targeted across the gap', S.target == null);
  ok('and you are not docked at a berth two thousand light-years away', S.docked == null);

  // Arrival is outside the star's own well — the flight model would otherwise fight it.
  const d = Math.hypot(S.player.position.x, S.player.position.y, S.player.position.z);
  ok('you arrive clear of the star', d > (S.systemPlan.innerLimit || 0), `${Math.round(d)}`);

  // The pilot crosses; the place does not.
  ok('credits crossed with you', S.credits === before.credits);
  ok('and the boards belong to the new berths',
     Object.keys(S.contracts.boards).every(n =>
       S.world.stations.some(st => st.userData.name === n)),
     Object.keys(S.contracts.boards).join(','));
}

console.log('\n— the chart is wired —');
{
  const fs = await import('node:fs');
  const src = p => fs.readFileSync(new URL('src/' + p, ROOT).pathname, 'utf8');
  const html = fs.readFileSync(new URL('index.html', ROOT).pathname, 'utf8');
  const m = src('main.js');

  ok('the screen exists', /id="galaxy-overlay"/.test(html));
  ok('with a jump control', /id="galaxy-jump"/.test(html));
  ok('the flight HUD has a way in', /id="btn-chart"/.test(html));
  ok('bound to the chart', /btn-chart[\s\S]{0,90}openGalaxyMap/.test(src('ui/controls.js')));
  ok('the command deck has one too', /exec-galaxy[\s\S]{0,90}openGalaxyMap/.test(src('ui/execdeck.js')));
  // The deck holds two charts — the system and the galaxy — and for two patch levels both
  // buttons were labelled CHART, sitting side by side, with the second carrying the id
  // `exec-chart2` and a comment pasted from the contract board. Two charts is right; two
  // buttons with the same word on them is not, and the markup is the only place that can say
  // which is which.
  const deckBtns = [...html.matchAll(/<button class="exec-btn"[^>]*>([^<]+)<\/button>/g)].map(m => m[1].trim());
  ok('no two command-deck buttons share a label',
     new Set(deckBtns).size === deckBtns.length,
     deckBtns.filter((x, i) => deckBtns.indexOf(x) !== i).join(' '));
  ok('it is created at boot and ticked', /initGalaxyMap\(\)/.test(m) && /tickGalaxyMap\(dt\)/.test(m));
  // One scene per frame. The chart draws its own into the shared renderer, so the world must
  // not also draw — the same rule the command deck established at v1.02.31.
  ok('and the world render is skipped while it is up',
     /!execHudActive\(\) && !galaxyMapOpen\(\)/.test(m));
  ok('the chart reuses the particle shader rather than a second one',
     /particle-shader\.js/.test(src('ui/galaxymap.js')));
}

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
