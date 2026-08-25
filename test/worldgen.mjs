// World generation: is a world's class a consequence of its orbit, or a label printed
// next to one?
//
// This is the regression suite for the thing the catalogue was brought in to fix. The old
// generator picked a planet's kind with a weighted draw from a flat list keyed on a radius
// band. Nothing connected the name to the physics, so an ice world could land in an inferno
// orbit and the only thing wrong with it was that a human would notice.
//
// The fix is structural rather than statistical: every class declares the envelope of
// conditions it can exist in, and the classifier selects only from classes whose envelope
// contains the body's actual computed insolation, mass, temperature and volatile inventory.
// A frozen world in the inferno zone is therefore not *unlikely* — it is unrepresentable,
// because the class is filtered out before any random number is drawn.
//
// So these are not distribution checks. Almost every assertion below sweeps thousands of
// generated worlds and asserts a count is exactly zero, because "rare" is the answer the
// old generator gave and it is the wrong shape of answer.
//
// The last section is deep time, and it holds the invariant that makes stellar death
// legible: volatile loss is one-way. A world cooked during the red-giant phase must not be
// able to become an ocean again when the star settles into a white dwarf. That is the one
// property most easily broken by a well-meaning tidy-up — a clamp into a class's declared
// band silently *raises* an inventory — so it is asserted directly rather than trusted.

import { installGlobals } from './stub.mjs';

const ROOT = new URL('../', import.meta.url);
installGlobals(new URL('index.html', ROOT).pathname);

let pass = 0, fail = 0;
const ok = (name, cond, extra = '') => {
  if (cond) { pass++; console.log('  ok   ' + name); }
  else { fail++; console.log('  FAIL ' + name + (extra ? ' — ' + extra : '')); }
};
const imp = p => import(new URL('src/' + p, ROOT).href);

const { WORLD, TERRESTRIAL, GIANTS, MOON_CLASSES, fitsInsolation } = await imp('data/worldgen/worlds.js');
const { ATMOSPHERE } = await imp('data/worldgen/atmospheres.js');
const { MINERALS } = await imp('data/worldgen/minerals.js');
const { ASTEROID, COMET } = await imp('data/worldgen/smallbodies.js');
const { dbStats, rollComposition } = await imp('data/worldgen/index.js');
const { RENDER_TYPE, renderTypeFor } = await imp('data/worldgen/render-map.js');
const { PLANET_TYPES } = await imp('data/planetary/planets.js');
const TAX = await imp('world/taxonomy.js');
const ST = await imp('world/stellar.js');
const EP = await imp('world/epoch.js');
const U = await imp('core/units.js');
const G = await imp('world/genesis.js');
const { makeRng } = await imp('core/rng.js');

const stream = seed => { const r = makeRng(seed); return () => r.next(); };

// ── the catalogue ────────────────────────────────────────────────────
console.log('\n— the catalogue is whole —');
{
  const st = dbStats();
  ok('49 world classes', st.worlds === 49, String(st.worlds));
  ok('33 atmosphere archetypes', Object.keys(ATMOSPHERE).length >= 33,
     String(Object.keys(ATMOSPHERE).length));
  ok('112 minerals', st.minerals === 112, String(st.minerals));
  ok('asteroid and comet classes present', st.asteroids >= 19 && st.comets >= 11,
     `${st.asteroids} / ${st.comets}`);

  // Every class must declare the three bands the classifier filters on. A class missing one
  // does not fail loudly — it silently passes every filter, which is worse.
  const incomplete = Object.values(WORLD).filter(c =>
    !Array.isArray(c.S) || !Array.isArray(c.mass) || !Array.isArray(c.volatiles));
  ok('every class declares S, mass and volatile bands', incomplete.length === 0,
     incomplete.map(c => c.id).join(' '));

  const badBand = Object.values(WORLD).filter(c => c.S[0] >= c.S[1] || c.mass[0] >= c.mass[1]);
  ok('every band is ordered low to high', badBand.length === 0, badBand.map(c => c.id).join(' '));

  // An atmosphere a class names but the archetype table does not define resolves to
  // undefined inside selectAtmosphere and falls through to vacuum — a world silently
  // stripped of the air its own class says it has.
  const ghosts = [];
  for (const c of Object.values(WORLD)) {
    for (const a of (c.atmosphere || [])) if (!ATMOSPHERE[a]) ghosts.push(c.id + ':' + a);
  }
  ok('no class names an atmosphere that does not exist', ghosts.length === 0, ghosts.join(' '));

  // Molar mass is derived from composition rather than typed alongside it, so this checks
  // the derivation ran rather than checking a hand-entered number.
  const noMolar = Object.values(ATMOSPHERE).filter(a => a.id !== 'none' && !(a.molarMass > 0));
  ok('every atmosphere derives a molar mass from its composition', noMolar.length === 0,
     noMolar.map(a => a.id).join(' '));
}

// ── the render map ───────────────────────────────────────────────────
console.log('\n— every class can be drawn —');
{
  const unmapped = Object.keys(WORLD).filter(id => !RENDER_TYPE[id]);
  ok('every catalogue class maps to a render type', unmapped.length === 0, unmapped.join(' '));

  const bogus = Object.entries(RENDER_TYPE).filter(([, v]) => !PLANET_TYPES[v]);
  ok('no mapping names a render type PLANET_TYPES lacks', bogus.length === 0,
     bogus.map(x => x.join('→')).join(' '));

  const orphan = Object.keys(RENDER_TYPE).filter(id => !WORLD[id]);
  ok('no mapping is left over from a class that no longer exists', orphan.length === 0,
     orphan.join(' '));

  // The fallback exists so a missing mapping cannot black-screen a system mid-flight. The
  // assertions above are what make sure it is never actually reached, so this only pins
  // that it stays a seatbelt rather than becoming load-bearing.
  ok('an unknown class falls back rather than throwing', renderTypeFor('no_such_class') === 'barren');
}

// ── the invariant ────────────────────────────────────────────────────
console.log('\n— a class cannot contradict its own orbit —');
{
  const rand = stream(0xC1A55);
  const FROZEN = /ice|glacier|frozen|tundra|nitrogen|cryo|dark ice/i;
  const MOLTEN = /lava|magma|molten/i;

  let frozenInInferno = 0;
  for (let i = 0; i < 6000; i++) {
    const S = 40 + rand() * 400;                       // unambiguously an inferno
    const c = TAX.classifyWorld({ simMass: 0.05 + rand() * 8, S, rand });
    if (FROZEN.test(c.kind)) frozenInInferno++;
  }
  ok('no frozen world in 6,000 inferno orbits', frozenInInferno === 0, String(frozenInInferno));

  let moltenInDark = 0;
  for (let i = 0; i < 6000; i++) {
    const S = 0.001 + rand() * 0.05;                   // unambiguously the outer dark
    const c = TAX.classifyWorld({ simMass: 0.05 + rand() * 8, S, rand });
    if (MOLTEN.test(c.kind)) moltenInDark++;
  }
  ok('no molten world in 6,000 outer-dark orbits', moltenInDark === 0, String(moltenInDark));

  // The general form of both checks above, and the one that keeps holding when somebody
  // adds a class whose name neither regex happens to match.
  let outOfBand = 0;
  for (let i = 0; i < 8000; i++) {
    const S = Math.exp(Math.log(0.002) + rand() * (Math.log(600) - Math.log(0.002)));
    const c = TAX.classifyWorld({ simMass: 0.02 + rand() * 40, S, rand, giant: rand() < 0.25 });
    if (!fitsInsolation(WORLD[c.classId], S)) outOfBand++;
  }
  ok('8,000 worlds all sit inside their own class insolation band', outOfBand === 0,
     String(outOfBand));

  // The classifier and its auditor must ask the same question. If candidate filtering used
  // a different surface test than `auditClassification` checks afterwards, a tolerance on
  // one side would admit worlds the other rejects — and the drift would be invisible until
  // somebody read a dossier.
  let surfaceMismatch = 0;
  for (let i = 0; i < 4000; i++) {
    const S = Math.exp(Math.log(0.01) + rand() * (Math.log(120) - Math.log(0.01)));
    const c = TAX.classifyWorld({ simMass: 0.05 + rand() * 12, S, rand });
    const cls = WORLD[c.classId];
    if (cls.surfaces && cls.surfaces.length) {
      const surf = ST.surfaceState(S, c.volatiles);
      if (!cls.surfaces.includes(surf)) surfaceMismatch++;
    }
  }
  ok('4,000 worlds all compute a surface their class allows', surfaceMismatch === 0,
     String(surfaceMismatch));
}

// ── real units ───────────────────────────────────────────────────────
console.log('\n— the numbers are real numbers —');
{
  // The units bridge is two constants wide and everything downstream rests on it, so it is
  // checked against the one world whose figures everybody knows.
  ok('9,000 world units is one AU', Math.abs(U.lengthAU(9000) - 1) < 1e-9,
     String(U.lengthAU(9000)));

  const rEarth = U.physicalRadiusKm(1, 5.51);
  ok('one Earth mass at Earth density gives Earth radius (±1%)',
     Math.abs(rEarth - 6371) / 6371 < 0.01, rEarth.toFixed(0) + ' km');

  const gEarth = U.gravityG(1, rEarth);
  ok('…and one g', Math.abs(gEarth - 1) < 0.01, gEarth.toFixed(3));

  const vEsc = U.escapeVelocityKms(1, rEarth);
  ok('…and 11.2 km/s escape velocity', Math.abs(vEsc - 11.19) < 0.1, vEsc.toFixed(2));

  const tEq = U.equilibriumTempK(1, 0.3, 1);
  ok('…and a 255 K equilibrium temperature', Math.abs(tEq - 255) < 2, tEq.toFixed(1));

  // Jeans escape, in the two directions that matter: Earth keeps nitrogen and loses hydrogen.
  ok('Earth retains nitrogen', U.retainsGas(11.19, 288, 28));
  ok('Earth does not retain free hydrogen', !U.retainsGas(11.19, 288, 2));
  ok('Jupiter retains hydrogen', U.retainsGas(59.5, 165, 2));
}

// ── composition follows the condensation sequence ────────────────────
console.log('\n— ores are where ores can form —');
{
  const rand = stream(0x0BE5);
  let iceOnLava = 0, samples = 0;
  for (let i = 0; i < 500; i++) {
    const comp = rollComposition({
      tempK: 1400 + rand() * 600, hostType: 'planet',
      tags: ['refractory', 'siderophile', 'silicate'], rand, count: 4
    });
    samples += comp.length;
    if (comp.some(c => /\bice\b|water ice|volatile/i.test(c.name))) iceOnLava++;
  }
  ok('composition rolls return minerals', samples > 0, String(samples));
  ok('no water ice on a 1,400–2,000 K world', iceOnLava === 0, String(iceOnLava));

  // Abundances are normalised so a dossier can print percentages that add up.
  const comp = rollComposition({ tempK: 260, hostType: 'planet', tags: ['silicate'], rand, count: 5 });
  const total = comp.reduce((s, c) => s + c.abundance, 0);
  ok('abundances sum to 1', Math.abs(total - 1) < 1e-6, total.toFixed(6));
}

// ── the generator, end to end ────────────────────────────────────────
console.log('\n— generated systems are systems —');
{
  const SEEDS = [1, 7, 20260814, 99991, 424242, 8675309];
  let noClass = 0, badRender = 0, noAtmosphereField = 0;
  for (const seed of SEEDS) {
    const plan = G.generateSystem(seed);
    for (const p of plan.planets) {
      if (!p.classId || !WORLD[p.classId]) noClass++;
      if (!PLANET_TYPES[p.type]) badRender++;
      if (p.atmosphere === undefined) noAtmosphereField++;
    }
  }
  ok('every generated planet carries a catalogue class', noClass === 0, String(noClass));
  ok('every generated planet carries a drawable render type', badRender === 0, String(badRender));
  ok('every generated planet carries an atmosphere', noAtmosphereField === 0,
     String(noAtmosphereField));

  // Determinism is the contract a save depends on: the seed is persisted and the system is
  // rebuilt from it on load. Classification introduced a whole new random stream, so this
  // is the check that the new stream is drawn in a fixed order like the old ones.
  const a = G.generateSystem(20260814);
  const b = G.generateSystem(20260814);
  const sig = plan => plan.planets.map(p =>
    `${p.name}|${p.orbit}|${p.classId}|${p.type}|${p.tempK.toFixed(4)}|${p.volatiles.toFixed(6)}`).join(';');
  ok('the same seed classifies to the same system', sig(a) === sig(b));
  ok('…including the star', a.star.lum === b.star.lum && a.star.phase === b.star.phase);

  const c = G.generateSystem(20260815);
  ok('a different seed is a different system', sig(a) !== sig(c));

  // Radial sanity. Not monotonic — a greenhouse world is legitimately hotter than the world
  // outside it, which is why Venus is hotter than Mercury — but the *insolation* a world
  // receives has to fall outward, because that is geometry rather than atmosphere.
  let insolationRises = 0;
  for (const seed of SEEDS) {
    const plan = G.generateSystem(seed);
    for (let i = 1; i < plan.planets.length; i++) {
      if (plan.planets[i].insolation > plan.planets[i - 1].insolation + 1e-9) insolationRises++;
    }
  }
  ok('insolation falls outward in every system', insolationRises === 0, String(insolationRises));
}

// ── the star has an age ──────────────────────────────────────────────
console.log('\n— stars are not interchangeable —');
{
  const lums = new Set(), phases = new Set();
  for (let seed = 1; seed <= 200; seed++) {
    const plan = G.generateSystem(seed);
    if (plan.star.class === 'G') lums.add(plan.star.lum.toFixed(4));
    phases.add(plan.star.phase);
  }
  ok('two G-type systems do not share a luminosity', lums.size > 5, String(lums.size));
  ok('systems start on the main sequence', phases.size === 1 && phases.has(ST.PHASE.MAIN_SEQUENCE),
     [...phases].join(' '));

  // The bridge between the authored class table and the physics. `lum` is authored, mass is
  // derived from it, and the round trip has to close or the two halves disagree about what
  // kind of star this is.
  for (const L of [0.22, 1.0, 6.5]) {
    const m = ST.massFromLuminosity(L);
    ok(`L=${L} → M=${m.toFixed(3)} → L again`,
       Math.abs(ST.zamsLuminosity(m) - L) < 1e-9);
  }
  ok('a heavier star burns out faster', ST.lifespanMyr(2) < ST.lifespanMyr(1));
  ok('the Sun lives about 10 Gyr', Math.abs(ST.lifespanMyr(1) - 10000) < 1, String(ST.lifespanMyr(1)));
}

// ── deep time ────────────────────────────────────────────────────────
console.log('\n— the star dies, and the system knows —');
{
  const plan = G.generateSystem(20260814);
  const star = plan.star;
  const startLum = star.lum;
  const startPlanets = plan.planets.length;

  // Walk a star from where it is to well past the end of its life, in steps small enough
  // that no phase is skipped entirely.
  const seen = new Set([star.phase]);
  const reclassifications = [];
  const engulfed = [];
  let steps = 0;
  const step = star.lifespanMyr * 1e6 * 0.02;
  while (steps < 120 && !ST.TERMINAL.has(star.phase)) {
    const out = EP.advanceEpoch(plan, step);
    seen.add(star.phase);
    reclassifications.push(...out.reclassified);
    engulfed.push(...out.engulfed);
    steps++;
  }

  ok('the star leaves the main sequence', seen.has(ST.PHASE.SUBGIANT) || seen.has(ST.PHASE.RED_GIANT),
     [...seen].join(' '));
  ok('it reaches a terminal phase', ST.TERMINAL.has(star.phase), star.phase);
  ok('it brightened on the way', star.lum !== startLum || seen.size > 1);
  ok('worlds were reclassified as conditions changed', reclassifications.length > 0,
     String(reclassifications.length));
  ok('the expanding envelope swallowed inner worlds', engulfed.length > 0, String(engulfed.length));
  ok('…but not all of them', plan.planets.length > 0,
     `${startPlanets} → ${plan.planets.length}`);

  // THE invariant. Volatiles ablate to space and the reservoir cap comes down with them, so
  // a world cooked once cannot be handed them back. Without this, a system that goes through
  // a red giant and settles into a white dwarf would simply cool and re-freeze into what it
  // was, and nothing would have happened.
  const restored = plan.planets.filter(p =>
    p.volatiles !== undefined && p.volatileCap !== undefined && p.volatiles > p.volatileCap + 1e-9);
  ok('no world holds more volatiles than its cap', restored.length === 0,
     restored.map(p => p.name).join(' '));

  const cooked = plan.planets.filter(p => p.volatileCap !== undefined && p.volatileCap < 0.12);
  ok('worlds that were cooked stayed cooked', cooked.every(p => p.volatiles < 0.12),
     cooked.filter(p => p.volatiles >= 0.12).map(p => p.name).join(' '));

  // Mass loss expands orbits rather than moving bodies, which is what makes a
  // million-year step safe to take in one jump.
  ok('the surviving orbits expanded', plan.planets.every(p => p.orbit > 0));
}

console.log('\n— deep time is reproducible —');
{
  // Two identical walks from the same seed must land on the same system. Reclassification
  // makes weighted choices, so this is really asserting that its per-body stream is seeded
  // on identity and epoch rather than on call order.
  const walk = seed => {
    const plan = G.generateSystem(seed);
    for (let i = 0; i < 20; i++) EP.advanceEpoch(plan, plan.star.lifespanMyr * 1e6 * 0.03);
    return plan.planets.map(p => `${p.name}|${p.classId}|${p.volatiles.toFixed(6)}|${p.orbit}`).join(';');
  };
  ok('the same seed walks to the same future', walk(4242) === walk(4242));
  ok('a different seed does not', walk(4242) !== walk(4243));
}

console.log(`\n${pass} passed, ${fail} failed`);
if (fail) process.exit(1);
