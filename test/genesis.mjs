// System generation: does a seed produce a system worth playing, and the *same* one twice?
//
// Two questions, and the second is the load-bearing one. A save persists a seed and rebuilds
// its system from it on load; two players in a shared galaxy are handed the same seed by the
// server and have to agree about where everything is. So determinism is not a nicety here,
// it is the contract, and this suite pins it byte for byte.
//
// The first question is harder to assert and matters just as much. A generator that produces
// *a* system on every seed is easy; a generator that produces a system somebody would want to
// work in is not. The playability checks below are the ones that turned up real faults while
// this was being written:
//
//   - a blue-giant system whose frost line sat past the outermost orbital gap, so every belt
//     came back metal-rich and *no field in the entire system sold volatiles* — an entire
//     commodity, and half the crafting tree, with no origin.
//   - systems with no shipyard, which is a soft-lock for the executive career produced by a
//     dice roll.
//   - worlds placed past the nav chart's outer wall, which is not a bug you see until the
//     chart draws everything bunched at the centre with one dot on the rim.

import { installGlobals } from './stub.mjs';

const ROOT = new URL('../', import.meta.url);
installGlobals(new URL('index.html', ROOT).pathname);

let pass = 0, fail = 0;
const ok = (name, cond, extra = '') => {
  if (cond) { pass++; console.log('  ok   ' + name); }
  else { fail++; console.log('  FAIL ' + name + (extra ? ' — ' + extra : '')); }
};
const imp = p => import(new URL('src/' + p, ROOT).href);

const G = await imp('world/genesis.js');
const { PLANET_TYPES } = await imp('data/planetary/planets.js');
const { STATION_TYPES } = await imp('data/stations.js');
const { MINERALS } = await imp('data/belts.js');
const { S, recalcStats } = await imp('core/state.js');
const { seedWorld } = await imp('core/rng.js');

// A spread of seeds rather than one: every check below is a *property*, and a property
// asserted on a single sample is an anecdote.
const SEEDS = [0, 1, 2, 7, 13, 42, 99, 256, 1337, 4242, 20260814, 999999, 2 ** 31 - 1];
const plans = SEEDS.map(s => G.generateSystem(s));

// ── determinism ──────────────────────────────────────────────────────
console.log('\n— the same seed is the same system —');
{
  let identical = true, differing = 0;
  for (const s of SEEDS) {
    if (JSON.stringify(G.generateSystem(s)) !== JSON.stringify(G.generateSystem(s))) identical = false;
  }
  ok('regenerating a seed gives a byte-identical plan', identical);

  // ...and generating other seeds in between must not disturb it. This is the failure mode
  // a generator gets when it draws from a shared global stream instead of its own.
  const before = JSON.stringify(G.generateSystem(4242));
  for (const s of SEEDS) G.generateSystem(s);
  seedWorld(777);                              // disturb the global world stream too
  const after = JSON.stringify(G.generateSystem(4242));
  ok('other generations in between change nothing', before === after);

  for (const a of plans) for (const b of plans) {
    if (a.seed !== b.seed && JSON.stringify(a) === JSON.stringify(b)) differing++;
  }
  ok('different seeds give different systems', differing === 0, String(differing));
  ok('the plan records its generator version',
     plans.every(p => p.version === G.GENESIS_VERSION));
  ok('and says it was generated', plans.every(p => p.layout === 'procedural'));
  ok('and carries the seed that made it',
     plans.every((p, i) => p.seed === (SEEDS[i] >>> 0)));
}

// ── the star ─────────────────────────────────────────────────────────
console.log('\n— the star —');
{
  const classes = new Set(plans.map(p => p.star.class));
  ok('every star has a class the table knows',
     plans.every(p => G.STAR_CLASSES.some(c => c.key === p.star.class)));
  ok('every star is named', plans.every(p => typeof p.star.name === 'string' && p.star.name.length > 2));
  ok('every star has a positive radius', plans.every(p => p.star.radius > 0));
  ok('every star has a corona outside itself', plans.every(p => p.star.corona > p.star.radius));
  ok('every star has a luminosity', plans.every(p => p.star.lum > 0));
  // Weighted toward dwarfs, so a spread of thirteen seeds should not be all one class.
  ok('the sample spans more than one class', classes.size > 1, [...classes].join(','));

  // The habitable zone has to actually move with the star, or the class is decoration.
  const dim = plans.reduce((a, b) => (a.star.lum <= b.star.lum ? a : b));
  const bright = plans.reduce((a, b) => (a.star.lum >= b.star.lum ? a : b));
  ok('a brighter star has a wider habitable zone',
     bright.star.lum === dim.star.lum || bright.habitable > dim.habitable,
     `${dim.star.class}:${dim.habitable} vs ${bright.star.class}:${bright.habitable}`);
}

// ── planets ──────────────────────────────────────────────────────────
console.log('\n— the worlds —');
{
  ok('every system has worlds', plans.every(p => p.planets.length > 0));
  ok('planet counts are in the declared range',
     plans.every(p => p.planets.length >= 4 && p.planets.length <= 18),
     plans.map(p => p.planets.length).join(','));
  ok('the sample does not always produce the same count',
     new Set(plans.map(p => p.planets.length)).size > 1);
  ok('every world is a class the renderer can draw',
     plans.every(p => p.planets.every(w => !!PLANET_TYPES[w.type])),
     plans.flatMap(p => p.planets.map(w => w.type)).filter(t => !PLANET_TYPES[t]).join(','));
  ok('every world is named', plans.every(p => p.planets.every(w => w.name && w.name.length > 2)));
  ok('no two worlds in a system share a name',
     plans.every(p => new Set(p.planets.map(w => w.name)).size === p.planets.length));
  ok('orbits ascend', plans.every(p =>
     p.planets.every((w, i) => i === 0 || w.orbit > p.planets[i - 1].orbit)));
  // The nav chart's radial scale is built against 34,000 and the warp planner assumes the
  // system fits. A world at 90,000 is a chart with one dot on the rim.
  ok('nothing is placed past the chart wall',
     plans.every(p => p.planets.every(w => w.orbit <= 38000)),
     String(Math.max(...plans.flatMap(p => p.planets.map(w => w.orbit)))));
  ok('nothing is placed inside the star',
     plans.every(p => p.planets.every(w => w.orbit > p.star.radius * 2)));

  // The one that cost 80% of a hauler's working life on seed 20260814. `WARP.well` caps a
  // star's well "relative to its own size" — but that cap was tuned against the only star
  // that used to exist, a 320-unit yellow dwarf. An 820-unit supergiant carries the same
  // gravity and projects a well several thousand units across, and a bubble does not hold
  // inside one, so every world generated in there was a world every hull crawled to.
  ok('every system declares the inner wall it was laid out against',
     plans.every(p => p.innerLimit > 0));
  ok('no world is generated inside the star\'s own warp well',
     plans.every(p => p.planets.every(w => w.orbit >= p.innerLimit)),
     plans.filter(p => p.planets.some(w => w.orbit < p.innerLimit))
          .map(p => `${p.seed}:${p.star.class}`).join(','));
  ok('and no berth is either',
     plans.every(p => p.stations.every(st => st.orbit >= p.innerLimit)),
     plans.filter(p => p.stations.some(st => st.orbit < p.innerLimit))
          .map(p => `${p.seed}:${p.star.class}`).join(','));
  // A bigger star has to push its inner wall further out, or the guard is a constant
  // wearing a function's clothes.
  {
    const small = plans.reduce((a, b) => (a.star.radius <= b.star.radius ? a : b));
    const big = plans.reduce((a, b) => (a.star.radius >= b.star.radius ? a : b));
    ok('a bigger star pushes its inner wall further out',
       big.star.radius === small.star.radius || big.innerLimit > small.innerLimit,
       `${small.star.class}:${small.innerLimit} vs ${big.star.class}:${big.innerLimit}`);
  }

  // Temperature ordering: the innermost world should not be an ice giant and the outermost
  // should not be molten. Asserted as a tendency across the sample rather than per system,
  // because the bands overlap on purpose.
  const COLD = ['ice', 'methaneIce', 'methaneSea', 'methaneGiant', 'heliumGiant'];
  const HOT = ['molten', 'lava'];
  const innerCold = plans.filter(p => COLD.includes(p.planets[0].type)).length;
  const outerHot = plans.filter(p => HOT.includes(p.planets[p.planets.length - 1].type)).length;
  ok('inner worlds are not ice giants', innerCold === 0, String(innerCold));
  ok('outer worlds are not molten', outerHot === 0, String(outerHot));
}

// ── stations ─────────────────────────────────────────────────────────
console.log('\n— the berths —');
{
  ok('every system has stations', plans.every(p => p.stations.length >= 5));
  ok('every station is a type the builder knows',
     plans.every(p => p.stations.every(s => !!STATION_TYPES[s.type])));
  ok('every station is named', plans.every(p => p.stations.every(s => s.name && s.name.length > 2)));
  ok('no two berths in a system share a name',
     plans.every(p => new Set(p.stations.map(s => s.name)).size === p.stations.length));
  ok('every station has a colour', plans.every(p => p.stations.every(s => typeof s.color === 'number')));
  ok('stations are sorted by orbit', plans.every(p =>
     p.stations.every((s, i) => i === 0 || s.orbit >= p.stations[i - 1].orbit)));

  // The guarantees. Each of these is a soft-lock if a dice roll can remove it: no yard means
  // an executive cannot commission a hull, no trade hub means nowhere to sell.
  for (const need of ['tradeHub', 'foundry', 'refinery', 'fortress', 'depot']) {
    ok(`every system has at least one ${need}`,
       plans.every(p => p.stations.some(s => s.type === need)),
       plans.filter(p => !p.stations.some(s => s.type === need)).map(p => p.seed).join(','));
  }
  ok('berths sit near a world rather than at random radii',
     plans.every(p => p.stations.every(s =>
       p.planets.some(w => Math.abs(w.orbit - s.orbit) < w.orbit * 0.30))));
}

// ── belts ────────────────────────────────────────────────────────────
console.log('\n— the fields —');
{
  ok('every system has fields', plans.every(p => p.belts.length >= 2));
  ok('field counts are in the declared range', plans.every(p => p.belts.length <= 4));
  ok('every field is named', plans.every(p => p.belts.every(b => b.name && b.name.length > 2)));
  ok('every field has a unique key',
     plans.every(p => new Set(p.belts.map(b => b.key)).size === p.belts.length));
  ok('every field has width and rocks',
     plans.every(p => p.belts.every(b => b.width > 0 && b.count > 0)));
  ok('fields are sorted outward', plans.every(p =>
     p.belts.every((b, i) => i === 0 || b.inner >= p.belts[i - 1].inner)));
  ok('every mineral in a mix is a mineral the game trades',
     plans.every(p => p.belts.every(b => Object.keys(b.mix).every(k => !!MINERALS[k]))));
  ok('no mix is negative',
     plans.every(p => p.belts.every(b => Object.values(b.mix).every(v => v >= 0))));
  ok('no field is empty of everything',
     plans.every(p => p.belts.every(b => Object.values(b.mix).some(v => v > 1))));

  // The fault this check exists for: a hot star pushes the frost line past the outermost
  // gap and the whole system comes back metal-rich, so volatiles — crew rations, coolant,
  // half the crafting tree — have no source anywhere in it.
  ok('every system can sell volatiles somewhere',
     plans.every(p => p.belts.some(b => b.mix.volatiles > 15)),
     plans.filter(p => !p.belts.some(b => b.mix.volatiles > 15)).map(p => p.seed).join(','));
  ok('every system can sell metal somewhere',
     plans.every(p => p.belts.some(b => b.mix.iron > 8)));

  // Fields sit in gaps, not on top of worlds.
  ok('no field overlaps a world',
     plans.every(p => p.belts.every(b =>
       !p.planets.some(w => w.orbit > b.inner && w.orbit < b.inner + b.width))));
}

// ── the authored layout ──────────────────────────────────────────────
console.log('\n— Solaris is still Solaris —');
{
  const sol = G.solarisPlan();
  ok('the authored plan says so', sol.layout === 'solaris');
  ok('it has the twelve worlds it always had', sol.planets.length === 12, String(sol.planets.length));
  ok('it has the eleven berths it always had', sol.stations.length === 11, String(sol.stations.length));
  ok('it has the four fields it always had', sol.belts.length === 4, String(sol.belts.length));
  ok('the star is Solaris Prime', sol.star.name === 'Solaris Prime');
  for (const n of ['Gaia', 'Titanus', 'Obscura', 'Meridian', 'Kharon']) {
    ok(`${n} is where it has always been`, sol.planets.some(w => w.name === n));
  }
  for (const n of ['Fortress Omega', 'Trade Platform', 'Foundry Alpha']) {
    ok(`${n} is where it has always been`, sol.stations.some(s => s.name === n));
  }
  // Regenerating it must not drift either — a save carrying `layout: 'solaris'` reopens
  // through this function every single load.
  ok('the authored plan is stable across calls',
     JSON.stringify(G.solarisPlan()) === JSON.stringify(G.solarisPlan()));
  ok('planFor routes a solaris save to it', G.planFor(12345, 'solaris').layout === 'solaris');
  ok('planFor routes anything else to the generator',
     G.planFor(12345, 'procedural').layout === 'procedural');
  ok('and an unknown layout generates rather than throwing',
     G.planFor(12345, undefined).layout === 'procedural');
}

// ── it builds ────────────────────────────────────────────────────────
// A plan that passes every check above and cannot be turned into meshes is still a bug.
console.log('\n— the plan builds a world —');
{
  const { initScene } = await imp('world/scene.js');
  const { createSystem } = await imp('world/system.js');
  const { createAsteroids } = await imp('world/asteroids.js');
  initScene();
  recalcStats();

  const plan = G.generateSystem(20260814);
  S.seed = 20260814;
  seedWorld(S.seed);
  S.world.bodies = []; S.world.stations = []; S.world.asteroids = []; S.world.belts = [];
  S.systemPlan = plan;

  let err = null;
  try { createSystem(plan); createAsteroids(); } catch (e) { err = e; }
  ok('a generated system builds without throwing', !err, err && err.message);
  ok('the star is in the world', S.world.bodies.some(b => b.userData.kind === 'star'));
  ok('every planned world is in the world',
     plan.planets.every(w => S.world.bodies.some(b => b.userData.name === w.name)));
  ok('every planned berth is in the world',
     plan.stations.every(s => S.world.bodies.some(b => b.userData.name === s.name)));
  ok('the station list matches the plan', S.world.stations.length === plan.stations.length,
     `${S.world.stations.length} vs ${plan.stations.length}`);
  ok('the star carries its class', S.world.bodies[0].userData.starClass === plan.star.class);
  ok('rock was placed for every field',
     S.world.asteroids.length > 0 && (S.world.belts || []).length >= plan.belts.length);
  // The berths have to be spread round the star, not stacked on one bearing.
  {
    const angles = S.world.stations.map(s => s.userData.angle % (Math.PI * 2));
    ok('berths are spread around the star', Math.max(...angles) - Math.min(...angles) > 2);
  }
  ok('the plan is recorded on state', S.systemPlan === plan);
  ok('the summary line reads as a sentence',
     /world/.test(G.systemLine(plan)) && /station/.test(G.systemLine(plan)), G.systemLine(plan));
  ok('an absent plan produces no line', G.systemLine(null) === '');
}

// ── the save carries the system ──────────────────────────────────────
// The whole reason `layout` is persisted rather than inferred. A save that only carried a
// seed would silently reopen in whatever the current generator produces for it.
console.log('\n— a save reopens in the system it was written in —');
{
  const SV = await imp('systems/platform/save.js');
  const { SCHEMA } = await imp('core/version.js');

  S.character = { name: 'X', created: true, career: 'executive', lineage: 'core',
                  corp: 'meridian', skills: {}, spent: {}, progress: {} };
  SV.saveGame(true);
  const info = SV.saveInfo();
  ok('the save is written at the current schema', info.schema === SCHEMA, String(info.schema));
  ok('and records the layout', info.layout === 'procedural', info.layout);
  ok('and the generator version that made it', info.genesis === G.GENESIS_VERSION,
     String(info.genesis));
  ok('savedLayout reads it back without loading', SV.savedLayout() === 'procedural');
  ok('savedSeed reads the seed back', SV.savedSeed() === S.seed, String(SV.savedSeed()));

  // The load path, exactly as main.js runs it.
  const reopened = G.planFor(SV.savedSeed(), SV.savedLayout());
  ok('reopening produces the identical system',
     JSON.stringify(reopened) === JSON.stringify(S.systemPlan));
}

// ── the migration ────────────────────────────────────────────────────
// A pre-18 save describes its world entirely by name — archived scans, completed surveys,
// the office a company is registered at, the berths its haulers run between, which rocks
// are mined out. Regenerating its seed would rename every one of those at once.
console.log('\n— an old save keeps its world —');
{
  const SV = await imp('systems/platform/save.js');
  const { SCHEMA: SCHEMA_NOW } = await imp('core/version.js');
  const legacy = { v: 17, build: '1.02.30', seed: 20260814, playtime: 10,
                   classKey: 'civilian', pos: [0, 0, 3400], yaw: 0, pitch: 0, credits: 5000 };
  const migrated = SV.migrate(JSON.parse(JSON.stringify(legacy)));
  ok('a v17 payload migrates', !!migrated);
  // Against SCHEMA rather than a literal: the assertion is "it reaches the present", and
  // pinning 18 turned into a red suite the moment 19 shipped, for no defect.
  ok('to the current schema', migrated.v === SCHEMA_NOW, String(migrated.v));
  ok('and is declared to be in Solaris', migrated.layout === 'solaris', migrated.layout);
  ok('with generator version zero — it predates the generator', migrated.genesis === 0);
  ok('its seed is untouched', migrated.seed === legacy.seed);

  const plan = G.planFor(migrated.seed, migrated.layout);
  ok('and it reopens into the authored system', plan.layout === 'solaris');
  ok('with the worlds it remembers', plan.planets.some(w => w.name === 'Gaia'));
  ok('and the berths it remembers', plan.stations.some(st => st.name === 'Fortress Omega'));
  // The point: that same seed generates something completely different, and the migration
  // is what stops an old flight waking up in it.
  const wouldHaveBeen = G.generateSystem(migrated.seed);
  ok('the generator would have produced something else entirely',
     !wouldHaveBeen.planets.some(w => w.name === 'Gaia'));
}

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
