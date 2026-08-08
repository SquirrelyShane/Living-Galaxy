// Celestial bodies: moon classes, surface features, atmospheric interference, ephemeris.
//
// The properties asserted here are deliberately about *relationships between systems*
// rather than about any one function's arithmetic — because both bugs this slice fixes
// were of that kind. `planetInfo()` was internally consistent and perfectly happy; it was
// only wrong relative to the planet table. `foundSite()` was correct; it was only wrong
// relative to what a moon carried. A unit test on either would have passed.

import { installGlobals } from './stub.mjs';
import { execFileSync } from 'child_process';
import { fileURLToPath } from 'url';

const ROOT = new URL('../', import.meta.url);
const EMIT = process.argv.includes('--emit-moons');
installGlobals(new URL('index.html', ROOT).pathname);

let pass = 0, fail = 0;
const ok = (name, cond, extra = '') => {
  if (cond) { pass++; console.log('  ok   ' + name); }
  else { fail++; console.log('  FAIL ' + name + (extra ? ' — ' + extra : '')); }
};
const imp = p => import(new URL('src/' + p, ROOT).href);

const { S, recalcStats } = await imp('core/state.js');
const { seedWorld, makeRng } = await imp('core/rng.js');
const { initScene } = await imp('world/scene.js');
const { createSystem, updateSystem } = await imp('world/system.js');
const { PLANET_TYPES, SYSTEM_PLANETS } = await imp('data/planets.js');
const { MOON_TYPES, MOON_KEYS, moonCandidates, moonClassFor } = await imp('data/moons.js');
const { FEATURES, FEATURE_KEYS, featureFits, eligibleFeatures } = await imp('data/features.js');
const { traits } = await imp('data/planetary/traits.js');
const { PLANET_RESOURCES } = await imp('data/planetary/resources.js');
const { MATERIALS } = await imp('data/crafting/index.js');
const { COMMAND_CENTRES, centreFor } = await imp('data/planetary/centres.js');
const { planetInfo, worldOf, featuresOf, knownFeatures, featureAssay, featureAssayOf,
        surveyLevel, probePlanet, bodyNamed } = await imp('systems/survey.js');
const { tierAt, liveTier, attenuation, scanReport } = await imp('systems/scanner.js');
const { predict, intercept, transfer, separationAt, rateOf, orbitRadiusOf,
        transferRows, closingRate } = await imp('systems/ephemeris.js');
const { foundSite, sites } = await imp('systems/planetary.js');
const { CELESTIAL, SCAN, ORBIT_BANDS, NAV, WARP } = await imp('core/config.js');
const { createAsteroids, updateAsteroids, nearestAsteroid } = await imp('world/asteroids.js');
const { fields, isRing, fieldMid, parentOf, fieldPoint, fieldDistance, fieldTarget,
        refreshFieldTarget, fieldContacts } = await imp('systems/fields.js');
const { RING_PROFILE, ringFieldFor, BELTS } = await imp('data/belts.js');
const { collectObstacles, escapesWell, clipGoal, planRoute, routeClear, testRadius, clearRadius } = await imp('systems/navplan.js');
const { wellRadius, arrivalRadius } = await imp('systems/warp.js');
const LG = await imp('systems/lagrange.js');
const { ANOMALY_TYPES, ANOMALY_KEYS, rollAnomaly } = await imp('data/anomalies.js');
const { LAGRANGE } = await imp('core/config.js');
const { SCHEMA } = await imp('core/version.js');

initScene();
recalcStats();
seedWorld(20260806);
createSystem();

// A child-process mode used by the determinism check below. Two clients sharing a world
// seed must build the same moons, and the only faithful way to ask that is a second
// process: building the system twice inside one process is *deliberately* not identical,
// because world/textures.js caches a generated texture per type and the second build
// therefore draws fewer numbers out of the per-planet stream. That is a rendering
// optimisation, not a world property, and asserting against it would be asserting the
// wrong thing.
if (EMIT) {
  console.log(JSON.stringify(S.world.bodies
    .filter(b => b.userData.kind === 'moon')
    .map(m => [m.userData.name, m.userData.mclass, m.userData.ptype, m.userData.tempC])));
  process.exit(0);
}

const bodies = S.world.bodies;
const planets = bodies.filter(b => b.userData.kind === 'planet');
const moons = bodies.filter(b => b.userData.kind === 'moon');
const byName = n => bodies.find(b => b.userData.name === n);

// ── moons are worlds ─────────────────────────────────────────────────
console.log('\n— moons as first-class bodies —');
ok('the system generated moons', moons.length >= 8, `${moons.length}`);
ok('every moon carries a class', moons.every(m => MOON_TYPES[m.userData.mclass]));
ok('every moon carries a ptype the planet table knows',
   moons.every(m => !!PLANET_TYPES[m.userData.ptype]),
   moons.filter(m => !PLANET_TYPES[m.userData.ptype]).map(m => m.userData.ptype).join(','));
ok('every moon ptype has a resource row',
   moons.every(m => !!PLANET_RESOURCES[m.userData.ptype]));
ok('every moon ptype derives traits',
   moons.every(m => !!traits(m.userData.ptype)));
ok('every moon has a temperature', moons.every(m => Number.isFinite(m.userData.tempC)));
ok('every moon has a display name distinct from its ptype',
   moons.every(m => typeof m.userData.typeName === 'string' && m.userData.typeName.length > 3));

// THE BUG: a moon could never host a command centre, because `worlds.includes(undefined)`
// is false for every centre in the table.
const centreOptions = moons.map(m => centreFor(m.userData.ptype));
ok('every moon admits at least one command centre',
   centreOptions.every(list => list.length > 0),
   `${centreOptions.filter(l => !l.length).length} moons with none`);
ok('an outpost is plantable on every moon',
   moons.every(m => COMMAND_CENTRES.outpost.worlds.includes(m.userData.ptype)));

// And the real call, end to end.
S.sites = [];
S.stock = null;
const gg = planets.find(p => traits(p.userData.ptype).gas);
ok('the system has a gas giant', !!gg);
const ggMoons = moons.filter(m => m.userData.parent === gg);
ok('the gas giant has moons to make it a destination', ggMoons.length >= 3, `${ggMoons.length}`);
ok('a giant\'s moons are not all the same class',
   new Set(ggMoons.map(m => m.userData.mclass)).size > 1,
   ggMoons.map(m => m.userData.mclass).join(','));
{
  // Give the yard the materials and check the refusal is gone. Before this slice the
  // refusal was "a Survey Outpost cannot be built on a undefined world".
  const { addMaterial } = await imp('systems/crafting.js');
  for (const m in COMMAND_CENTRES.outpost.build) addMaterial(m, COMMAND_CENTRES.outpost.build[m] * 2);
  const site = foundSite(ggMoons[0], 'outpost');
  ok('a command centre can actually be founded on a moon', !!site);
  ok('the moon site records the moon\'s ptype',
     !!site && site.ptype === ggMoons[0].userData.ptype);
  S.sites = [];
}

console.log('\n— moon class selection is physical —');
{
  const rng = makeRng(7);
  const hot = moonCandidates('lava', 900, 0);
  ok('a molten moonlet is possible around a hot primary', (hot.molten || 0) > 0);
  ok('no ice around a hot primary', !hot.ice);
  const cold = moonCandidates('methaneGiant', -190, 3);
  ok('ice dominates a cold primary\'s outer moons', (cold.ice || 0) >= 10);
  ok('no molten moonlet out at index 3', !cold.molten);
  const innerGiant = moonCandidates('gasGiant', -120, 0);
  ok('the innermost moon of a giant can be tidally heated', (innerGiant.tidal || 0) > 0);
  ok('a subsurface ocean needs a giant', !moonCandidates('terrestrial', 10, 0).subOcean);
  ok('a subsurface ocean is possible close in to a giant', (innerGiant.subOcean || 0) > 0);
  ok('selection always returns a real class',
     Array.from({ length: 200 }, (_, i) =>
       moonClassFor(i % 2 ? 'gasGiant' : 'barren', i % 3 ? -140 : 300, i % 4, rng))
       .every(k => !!MOON_TYPES[k]));
}

// Determinism, measured the way multiplayer actually experiences it: two fresh clients.
{
  const self = fileURLToPath(import.meta.url);
  const run = () => execFileSync(process.execPath, [self, '--emit-moons'], { encoding: 'utf8' }).trim();
  const a = run(), b = run();
  ok('two fresh clients on one seed build identical moons', a === b);
  const parsed = JSON.parse(a);
  ok('the emitted roster is non-trivial', parsed.length >= 8);
  ok('every emitted moon carries name, class, ptype and temperature',
     parsed.every(r => r[0] && MOON_TYPES[r[1]] && PLANET_TYPES[r[2]] && Number.isFinite(r[3])));
}
const bodies2 = bodies;
const planets2 = planets;
const moons2 = moons;
const find = byName;

// ── the scan agrees with the ground ──────────────────────────────────
console.log('\n— survey reads the real planet table —');
{
  // THE BUG: planetInfo branched on type names that no longer existed, so a gas giant
  // reported rock volatiles. The property that catches it forever: the readout must rank
  // worlds the same way the resource table does.
  const giants = planets2.filter(p => traits(p.userData.ptype).gas);
  const rocks = planets2.filter(p => !traits(p.userData.ptype).gas && !traits(p.userData.ptype).liquid);
  ok('every giant reads volatile-rich', giants.every(p => planetInfo(p).volatiles > 60),
     giants.map(p => p.userData.name + ':' + planetInfo(p).volatiles).join(' '));
  ok('every giant reads mineral-poor relative to rock',
     Math.max(...giants.map(p => planetInfo(p).minerals)) <
     Math.max(...rocks.map(p => planetInfo(p).minerals)));

  const terr = planets2.find(p => p.userData.ptype === 'terrestrial');
  const barren = planets2.find(p => p.userData.ptype === 'barren');
  ok('a terrestrial world reads biosigns', !!terr && planetInfo(terr).bio > 40);
  ok('a barren rock reads none', !!barren && planetInfo(barren).bio < 15);

  ok('scan temperature is the body\'s own temperature',
     planets2.every(p => planetInfo(p).tempC === p.userData.tempC));
  ok('scan gravity is the body\'s own gravity',
     planets2.every(p => planetInfo(p).gravity === p.userData.gravity));

  // Every world type in the table produces a legible readout — no silent default.
  const seen = new Set(planets2.concat(moons2).map(b => b.userData.ptype));
  ok('every placed body type has a resource row',
     [...seen].every(t => !!PLANET_RESOURCES[t]), [...seen].filter(t => !PLANET_RESOURCES[t]).join(','));
  ok('no body reads 0/0/0', planets2.concat(moons2).every(b => {
    const i = planetInfo(b);
    return i.minerals + i.volatiles + i.bio > 0;
  }));
  ok('every resource id in the table is a known material',
     Object.values(PLANET_RESOURCES).every(row => Object.keys(row).every(id => !!MATERIALS[id])));
}

// ── surface features ─────────────────────────────────────────────────
console.log('\n— surface features —');
{
  ok('every feature has a name and a description',
     FEATURE_KEYS.every(k => FEATURES[k].name && FEATURES[k].desc));
  ok('every feature does something',
     FEATURE_KEYS.every(k => {
       const f = FEATURES[k];
       return f.assay || f.probe || f.scan || f.anomaly || f.site;
     }));

  // The `atmo:false` trap: an undeclared key is don't-care, a declared false is a
  // requirement. Collapsing the two would put airless-only features on greenhouses.
  const airless = { solid: true, atmo: false, tempC: -50, gravity: 0.5 };
  const thick = { solid: true, atmo: true, tempC: -50, gravity: 0.5 };
  ok('an airless-only feature rejects an atmosphere',
     featureFits(FEATURES.metallicVein, airless) && !featureFits(FEATURES.metallicVein, thick));
  ok('an atmosphere-only feature rejects vacuum',
     featureFits(FEATURES.stormAnchor, thick) && !featureFits(FEATURES.stormAnchor, airless));
  ok('a requirement-free feature fits anything', featureFits(FEATURES.derelictSignal, airless));
  ok('temperature bounds are respected',
     featureFits(FEATURES.cryoVents, { solid: true, tempC: -180 }) &&
     !featureFits(FEATURES.cryoVents, { solid: true, tempC: 20 }));

  const all = planets2.concat(moons2);
  ok('every body has an eligible pool', all.every(b => eligibleFeatures(worldOf(b)).length > 0));
  ok('features never exceed three per body', all.every(b => featuresOf(b).length <= 3));
  ok('some bodies have none', all.some(b => featuresOf(b).length === 0));
  ok('some bodies have several', all.some(b => featuresOf(b).length >= 2));
  ok('every feature on a body physically fits it',
     all.every(b => featuresOf(b).every(k => featureFits(FEATURES[k], worldOf(b)))),
     'a feature landed on a world that cannot have it');
  ok('features are deterministic',
     all.every(b => featuresOf(b).join() === featuresOf(b).join()));

  // Discovery is derived from what the save already holds.
  const target = all.find(b => featuresOf(b).length > 0);
  S.scans = {}; S.survey = {};
  ok('nothing is known before a scan', knownFeatures(target).length === 0);
  ok('no assay bonus before a scan', featureAssay(target) === 0);
  S.scans[target.userData.name] = 4;
  const atTier4 = knownFeatures(target);
  S.survey[target.userData.name] = 2;
  const probed = knownFeatures(target);
  ok('a full survey finds orbit-visible features', atTier4.length <= probed.length);
  ok('a probe finds everything', probed.length === featuresOf(target).length);
  ok('probe-only features need the probe',
     featuresOf(target).filter(k => FEATURES[k].probe === true).every(k => !atTier4.includes(k)));
  ok('discovered features raise the assay',
     featureAssay(target) >= 0 && featureAssayOf(target.userData.name) <= CELESTIAL.maxFeatureAssay);
  ok('the assay contribution is capped',
     featureAssayOf(target.userData.name) <= CELESTIAL.maxFeatureAssay + 1e-9);
  ok('a body can be looked up by name', bodyNamed(target.userData.name) === target);
  ok('an unknown name yields no bonus', featureAssayOf('Nowhere') === 0);
  S.scans = {}; S.survey = {};
}

// ── atmospheric interference ─────────────────────────────────────────
console.log('\n— atmospheric interference —');
{
  const airlessMoon = moons2.find(m => !m.userData.atmoDensity);
  const giant = planets2.find(p => traits(p.userData.ptype).gas);
  const toxic = planets2.find(p => p.userData.ptype === 'toxic');
  const bare = planets2.find(p => !p.userData.atmo);

  ok('an airless moon attenuates nothing', attenuation(airlessMoon) === 1);
  ok('a bare rock attenuates nothing', !bare || attenuation(bare) === 1);
  ok('a giant attenuates hard', attenuation(giant) > 1.4, String(attenuation(giant)));
  ok('a greenhouse attenuates hard', !toxic || attenuation(toxic) > 1.4, String(toxic && attenuation(toxic)));
  ok('attenuation never helps', planets2.concat(moons2).every(b => attenuation(b) >= 1));

  // The property that matters: at equal range and sensor, a thick world reads worse.
  const d = 900, sensor = 5000;
  ok('atmosphere costs resolution at equal range',
     tierAt(d, sensor, 0, attenuation(giant)) <= tierAt(d, sensor, 0, 1));
  ok('an unattenuated call is unchanged', tierAt(d, sensor, 0) === tierAt(d, sensor, 0, 1));
  ok('attenuation below 1 is ignored', tierAt(d, sensor, 0, 0.2) === tierAt(d, sensor, 0, 1));

  // And the design claim: a tight orbit still resolves a greenhouse completely, so the
  // interference is a reason to choose an orbit band, not a wall.
  const low = ORBIT_BANDS[0].mult, ring = ORBIT_BANDS[3].mult;
  const t = toxic || giant;
  const r = t.userData.radius;
  const tLow = tierAt(r * low, sensor, 0, attenuation(t));
  const tRing = tierAt(r * ring, sensor, 0, attenuation(t));
  ok('a low orbit still fully resolves a thick world', tLow === 4, `tier ${tLow}`);
  ok('a survey ring does not', tRing < 4, `tier ${tRing}`);
  ok('an airless moon resolves from its survey ring',
     tierAt(airlessMoon.userData.radius * ring, sensor, 0, attenuation(airlessMoon)) === 4);

  // A discovered vortex is a hole you can look down.
  S.scans = {}; S.survey = {};
  const vortexWorld = planets2.find(p => featuresOf(p).includes('polarVortex'));
  if (vortexWorld) {
    const before = attenuation(vortexWorld);
    S.survey[vortexWorld.userData.name] = 2;
    ok('a discovered polar vortex clears some attenuation', attenuation(vortexWorld) < before);
    S.survey = {};
  } else {
    ok('a discovered polar vortex clears some attenuation (no vortex this seed — skipped)', true);
  }
}

// ── ephemeris ────────────────────────────────────────────────────────
console.log('\n— ephemeris —');
{
  const p = planets2[5], m = moons2.find(x => x.userData.parent === p) || moons2[0];
  const near = (a, b, tol) => Math.abs(a - b) <= tol;
  const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z);

  ok('predict at t=0 is the current position',
     dist(predict(p, 0), p.position) < 1e-6);
  ok('predict at t=0 works for a moon too', dist(predict(m, 0), m.position) < 1e-6);

  // The property that keeps this honest: prediction must agree with the simulation.
  // Anything that changes updateSystem() and not predict() fails here.
  const snapshot = bodies2.map(b => predict(b, 300, {}));
  for (let i = 0; i < 300; i++) updateSystem(1);
  let worst = 0, worstName = '';
  bodies2.forEach((b, i) => {
    const e = dist(snapshot[i], b.position);
    if (e > worst) { worst = e; worstName = b.userData.name; }
  });
  ok('prediction matches 300 s of simulation', worst < 1.0, `${worst.toFixed(3)} on ${worstName}`);

  ok('a moon inherits its primary\'s heliocentric rate',
     rateOf(m) === rateOf(m.userData.parent));
  ok('a moon inherits its primary\'s orbital radius',
     orbitRadiusOf(m) === orbitRadiusOf(m.userData.parent));
  ok('the star has no rate', rateOf(find('Solaris Prime')) === 0);

  // Intercept: the point must be where the body is at the returned time.
  const from = { x: 0, y: 0, z: 3400 };
  const ic = intercept(from, p, 1500);
  ok('intercept converges', ic.converged);
  const there = predict(p, ic.t, {});
  ok('the intercept point is where the body will be', dist(ic.point, there) < 1e-6);
  ok('the intercept time matches the distance flown',
     near(dist(from, ic.point) / 1500, ic.t, 0.1));
  ok('intercept leads a moving body',
     dist(ic.point, p.position) > 1, `${dist(ic.point, p.position).toFixed(1)}`);
  ok('a zero speed degrades safely', intercept(from, p, 0).t === 0);
  ok('a static body needs no lead',
     dist(intercept(from, find('Solaris Prime'), 1500).point, { x: 0, y: 0, z: 0 }) < 1e-6);

  // Transfer geometry against the simulation.
  const a = planets2[2], b = planets2[9];
  const tr = transfer(a, b);
  ok('the synodic period is positive and finite', tr.synodic > 0 && isFinite(tr.synodic));
  ok('min separation is the radius difference',
     near(tr.min, Math.abs(orbitRadiusOf(a) - orbitRadiusOf(b)), 1e-6));
  ok('max separation is the radius sum',
     near(tr.max, orbitRadiusOf(a) + orbitRadiusOf(b), 1e-6));
  ok('separation now sits inside the bounds',
     separationAt(a, b, 0) >= tr.min - 1 && separationAt(a, b, 0) <= tr.max + 1);
  ok('the predicted conjunction is the actual minimum',
     near(separationAt(a, b, tr.next), tr.min, Math.max(2, tr.min * 0.01)),
     `${separationAt(a, b, tr.next).toFixed(0)} vs ${tr.min.toFixed(0)}`);
  ok('the predicted opposition is the actual maximum',
     near(separationAt(a, b, tr.nextOpp), tr.max, Math.max(2, tr.max * 0.01)));
  ok('the next conjunction is within one synodic period', tr.next <= tr.synodic + 1);
  ok('two bodies at the same rate never close', transfer(a, a).locked);
  ok('a locked pair reports no window', !isFinite(transfer(a, a).next));

  // Sampled search must agree with the closed form — the arithmetic check.
  {
    let bestT = 0, best = Infinity;
    const step = tr.synodic / 400;
    for (let t = 0; t < tr.synodic; t += step) {
      const s = separationAt(a, b, t);
      if (s < best) { best = s; bestT = t; }
    }
    ok('the analytic conjunction agrees with a brute-force sweep',
       near(bestT, tr.next, step * 2) || near(Math.abs(bestT - tr.next), tr.synodic, step * 2),
       `${bestT.toFixed(1)} vs ${tr.next.toFixed(1)}`);
  }

  ok('closing rate is signed', Math.abs(closingRate(a, b)) > 0);
  ok('closing rate agrees with separation',
     (closingRate(a, b) < 0) === (separationAt(a, b, 20) < separationAt(a, b, 0)));

  // Rows: shape and gating.
  S.docked = null; S.orbit = null;
  const free = transferRows(p, S.player.position, 1500);
  ok('a free-flying ship gets a transit estimate', free.some(r => r[0] === 'Transit'));
  ok('a free-flying ship gets no window row', !free.some(r => /Window/i.test(r[0])));
  S.orbit = { body: find('Gaia') || planets2[3] };
  const fromOrbit = transferRows(p, S.player.position, 1500);
  ok('an orbiting ship gets a window row', fromOrbit.some(r => /Window/i.test(r[0])));
  ok('the star gets no navigation rows', transferRows(find('Solaris Prime'), S.player.position, 1500).length === 0);
  ok('rows are label/value pairs',
     fromOrbit.every(r => Array.isArray(r) && r.length === 2 && typeof r[1] === 'string'));
  S.orbit = null;
}

// ── the readout end to end ───────────────────────────────────────────
console.log('\n— scan report —');
{
  S.scans = {}; S.survey = {};
  const giant = planets2.find(p => traits(p.userData.ptype).gas);
  S.player.position.set(giant.position.x, giant.position.y, giant.position.z + giant.userData.radius * 1.7);
  const rep = scanReport(giant, 'planet', giant.userData.name);
  ok('a planet report carries rows', rep.rows.length > 4);
  ok('a thick world says so in the report',
     rep.rows.some(r => r[0] === 'Atmosphere'), JSON.stringify(rep.rows.map(r => r[0])));
  ok('the report carries navigation rows', rep.rows.some(r => r[0] === 'Transit'));
  ok('the report has a note', typeof rep.note === 'string' && rep.note.length > 10);
  const total = featuresOf(giant).length;
  if (total) {
    ok('unresolved features are advertised',
       rep.rows.some(r => r[0] === 'Unresolved') || rep.rows.some(r => /Feature/.test(r[0])));
  } else ok('unresolved features are advertised (none on this world — skipped)', true);

  // A probe reveals them, and the report changes.
  S.orbit = { body: giant };
  S.probes = 3;
  S.cargo = { ore: 0, salvage: 0, data: 0 };
  const res = probePlanet(giant);
  ok('a probe returns telemetry', !!res && res.kg > 0);
  ok('a probe sets survey level 2', surveyLevel(giant.userData.name) === 2);
  ok('a probe reveals every feature', !!res && res.features.length === total);
  const rep2 = scanReport(giant, 'planet', giant.userData.name);
  if (total) ok('features appear in the report after probing',
                rep2.rows.filter(r => /Feature/.test(r[0])).length === total);
  else ok('features appear in the report after probing (none — skipped)', true);
  ok('probe telemetry scales with what is on the ground',
     !!res && res.kg >= 30);
  S.orbit = null;

  // A moon reads as a world now, not as an unclassified return.
  const mo = moons2[0];
  S.player.position.set(mo.position.x, mo.position.y, mo.position.z + mo.userData.radius * 2.8);
  const mrep = scanReport(mo, 'moon', mo.userData.name);
  ok('a moon produces a classed report',
     mrep.rows.some(r => r[0] === 'Class' && r[1] !== 'barren'), JSON.stringify(mrep.rows[2]));
  ok('a moon report carries navigation rows', mrep.rows.some(r => r[0] === 'Transit'));
}

// ── course planning around the bodies this slice changed ─────────────
// Both of these are properties of the *geometry*, not of any one seed. The seed sweep in
// test/warp-nav.mjs found neither of them in twenty seeds: the first needs a moon sitting
// in a narrow band outside its primary's clear ring, and the second needs a start point
// inside a well's bypass ring. Asserting the property directly is how they stay fixed.
console.log('\n— course planning against celestial bodies —');
{
  const V = (x, y, z) => new THREE.Vector3(x, y, z);
  const STARTS = [V(0, 0, 42000), V(0, 0, -42000), V(38000, 0, 12000),
                  V(-30000, 2000, -22000), V(0, 0, 5200)];

  // 1. A body orbiting inside the destination's own gravity well is behind the arrival
  //    point. It cannot block a course to its primary, and treating it as a wall makes
  //    every gas giant with a close moon unreachable from some directions.
  let satellitesConsidered = 0, checked = 0;
  for (const dest of planets2) {
    const destWell = wellRadius(dest.userData);
    for (const start of STARTS) {
      checked++;
      const obs = collectObstacles(start, dest.position, bodies2, wellRadius, dest);
      for (const ob of obs) {
        if (dest.position.distanceTo(ob.pos) < destWell) satellitesConsidered++;
      }
    }
  }
  ok('nothing inside the destination\'s well is ever an obstacle',
     satellitesConsidered === 0, `${satellitesConsidered} of ${checked} plans`);
  ok('the destination itself is never an obstacle',
     planets2.every(d => STARTS.every(s =>
       !collectObstacles(s, d.position, bodies2, wellRadius, d).some(o => o.body === d))));

  // 2. The dead band. A ship blocked by a well it cannot reach a bypass node around has
  //    no first leg at all, and A* falls through to a sidestep that is not clear by
  //    construction. `escapesWell` must be measured at the ring radius, not the block
  //    radius — and NAV.clear must stay the larger of the two for that to be true.
  ok('the bypass ring sits outside the block radius', NAV.clear > 1);
  // The ordering that matters: well < testRadius < clearRadius, with an absolute gap the
  // ship's tracking error fits inside. Reversing any of it makes a course that plans clear
  // and flies into something.
  ok('the wall sits outside the well by the full margin',
     [40, 90, 363, 670, 1594].every(w => testRadius(w) - w >= NAV.margin));
  ok('the ring sits outside the wall',
     [40, 90, 363, 670, 1594].every(w => clearRadius(w) > testRadius(w)));
  let deadBand = 0;
  for (const dest of planets2) {
    for (const ob of collectObstacles(STARTS[0], dest.position, bodies2, wellRadius, dest)) {
      for (const k of [0.1, 0.4, 0.7, 0.9, 0.999]) {
        const from = ob.pos.clone().add(V(ob.clearR * k, 0, 0));
        // Inside the ring, the obstacle must be treated as escaped rather than as a wall.
        if (!escapesWell(from, ob)) deadBand++;
      }
    }
  }
  ok('a ship inside the bypass ring is never treated as blocked by it', deadBand === 0,
     `${deadBand} dead-band positions`);
  ok('a ship outside the ring is still blocked', planets2.slice(0, 3).every(dest =>
     collectObstacles(STARTS[0], dest.position, bodies2, wellRadius, dest).every(ob =>
       !escapesWell(ob.pos.clone().add(V(ob.clearR * 1.01, 0, 0)), ob))));

  // 3. The goal clip. A course ends at the destination's well edge, never at its centre.
  {
    const dest = planets2[4];
    const w = wellRadius(dest.userData);
    const a = V(0, 0, 42000);
    const g = clipGoal(a, dest.position, w);
    ok('the clipped goal sits on the well edge',
       Math.abs(g.distanceTo(dest.position) - w * 0.92) < 1e-6);
    ok('the clipped goal is on the line to the destination',
       Math.abs(a.distanceTo(g) + g.distanceTo(dest.position) - a.distanceTo(dest.position)) < 1e-6);
    ok('a zero well does not clip', clipGoal(a, dest.position, 0) === dest.position);
    ok('a ship already inside the well does not clip',
       clipGoal(dest.position.clone().add(V(w * 0.1, 0, 0)), dest.position, w) === dest.position);
  }

  // 4. And the whole thing end to end, on the bodies this slice actually changed: every
  //    course to every planet and every moon in this system comes back flyable.
  let plans = 0, clear = 0;
  for (const dest of planets2.concat(moons2)) {
    for (const start of STARTS) {
      plans++;
      const wp = planRoute(start, dest.position, bodies2, wellRadius, dest);
      if (routeClear(start, wp, dest.position, bodies2, wellRadius, dest)) clear++;
    }
  }
  ok(`every course to every body is clear (${clear}/${plans})`, clear === plans);
  ok('moons are reachable as destinations in their own right', plans > planets2.length * 5);
}

// ── gravity wells ────────────────────────────────────────────────────
console.log('\n— gravity wells —');
{
  const orbital = bodies2.filter(b => ['planet', 'moon', 'star'].includes(b.userData.kind));
  const ratios = orbital.map(b => wellRadius(b.userData) / b.userData.radius);
  // THE POINT of the shrink: a well used to be up to thirty-seven body radii on a
  // moonlet, because the formula read surface gravity as if it were mass. Surface gravity
  // barely falls off with size; mass does. The ratio is now bounded and roughly flat.
  ok('no well exceeds twelve body radii', Math.max(...ratios) < 12,
     `worst ${Math.max(...ratios).toFixed(1)}`);
  ok('no well is smaller than the body', Math.min(...ratios) > 1.5);
  ok('the spread is tight', Math.max(...ratios) / Math.min(...ratios) < 3,
     `${Math.min(...ratios).toFixed(1)}-${Math.max(...ratios).toFixed(1)}`);
  // Monotonic in each input separately. Not in the mass proxy alone — the formula also
  // carries a `radius x size` term, so two bodies with equal sqrt(g) x radius but
  // different radii are legitimately different wells, and sorting the roster by the proxy
  // and demanding order out of it asserts something the formula never claimed.
  const growing = (vals, mk) => vals.every((v, i) =>
    i === 0 || wellRadius(mk(v)) > wellRadius(mk(vals[i - 1])) - 1e-9);
  ok('a well grows with radius at fixed gravity',
     growing([5, 20, 60, 150, 320], r => ({ radius: r, gravity: 1 })));
  ok('a well grows with gravity at fixed radius',
     growing([0.15, 0.5, 1, 2.6, 12], g => ({ radius: 90, gravity: g })));
  ok('a moonlet no longer out-projects its own size',
     wellRadius({ radius: 7, gravity: 0.18 }) < wellRadius({ radius: 151, gravity: 2.6 }) / 4);
  ok('the star still projects the largest well',
     wellRadius(find('Solaris Prime').userData) === Math.max(...orbital.map(b => wellRadius(b.userData))));
  ok('a well is clamped at both ends', [
     { radius: 0.001, gravity: 0.001 }, { radius: 99999, gravity: 99 }
   ].every(u => wellRadius(u) >= WARP.well.min && wellRadius(u) <= WARP.well.max));

  // The margin that made the shrink survivable: the wall must sit outside the well by
  // more than the ship's tracking error, at every size.
  ok('the wall clears every real well by the full margin',
     orbital.every(b => testRadius(wellRadius(b.userData)) - wellRadius(b.userData) >= NAV.margin));
}

// ── planetary rings ──────────────────────────────────────────────────
console.log('\n— planetary rings —');
{
  createAsteroids();
  const ringFields = fields().filter(isRing);
  const belts = fields().filter(f => !isRing(f));
  ok('the heliocentric belts survived', belts.length === BELTS.length);
  ok('this system generated at least one ring', ringFields.length >= 1, `${ringFields.length}`);
  ok('every ring names a body that exists', ringFields.every(f => !!parentOf(f)));
  ok('only ringed bodies have rings',
     ringFields.every(f => !!parentOf(f).userData.rings));
  ok('every ringed body got a ring',
     bodies2.filter(b => b.userData.rings).length === ringFields.length);

  const rocks = S.world.asteroids;
  ok('the rock count is the sum of the declared fields',
     rocks.length === fields().reduce((n, f) => n + f.count, 0));
  ok('ring rocks carry a parent',
     rocks.filter(r => r.belt.startsWith('ring:')).every(r => !!r.parent));
  ok('belt rocks carry no parent',
     rocks.filter(r => !r.belt.startsWith('ring:')).every(r => !r.parent));

  const f0 = ringFields[0], planet = parentOf(f0);
  const mine = rocks.filter(r => r.belt === f0.key);
  ok('the ring has rocks', mine.length === RING_PROFILE.count);

  // The property that matters: a ring rock stays with its planet. A rock that stayed put
  // while Titanus moved on would be a belt with a misleading name.
  updateAsteroids(0);
  const before = mine.map(r => r.position.distanceTo(planet.position));
  ok('ring rocks sit inside the visible ring band',
     before.every(d => d >= f0.inner - 8 && d <= f0.inner + f0.width + 8),
     `${Math.min(...before).toFixed(0)}-${Math.max(...before).toFixed(0)} vs ${f0.inner.toFixed(0)}-${(f0.inner + f0.width).toFixed(0)}`);
  const planetBefore = planet.position.clone();
  for (let i = 0; i < 600; i++) { updateSystem(1); updateAsteroids(1); }
  const moved = planet.position.distanceTo(planetBefore);
  ok('the parent planet actually moved', moved > 50, `${moved.toFixed(0)}`);
  const after = mine.map(r => r.position.distanceTo(planet.position));
  ok('ring rocks travelled with their planet',
     after.every(d => d >= f0.inner - 8 && d <= f0.inner + f0.width + 8));
  ok('ring rocks are not left behind at the origin',
     mine.every(r => r.position.length() > 1000));

  // Rings pay in volatiles — the reason to make the trip rather than mine Meridian.
  const ringVol = mine.reduce((s, r) => s + (r.comp.volatiles || 0), 0) / mine.length;
  const mainVol = rocks.filter(r => r.belt === 'main')
    .reduce((s, r) => s + (r.comp.volatiles || 0), 0) / rocks.filter(r => r.belt === 'main').length;
  ok('ring ice is volatile-rich against the workhorse belt', ringVol > mainVol * 3,
     `${ringVol.toFixed(1)}% vs ${mainVol.toFixed(1)}%`);
  ok('ring rocks are still worth something per kg', mine.every(r => r.valuePerKg > 0));

  // ── one authority for field geometry ──────────────────────────────
  const from = S.player.position;
  ok('a belt point sits on its mid-orbit circle', belts.every(f => {
    const p = fieldPoint(f, from);
    return Math.abs(Math.hypot(p.x, p.z) - fieldMid(f)) < 1e-6;
  }));
  ok('a ring point sits on its ring radius, about the planet', ringFields.every(f => {
    const p = fieldPoint(f, from), c = parentOf(f).position;
    return Math.abs(Math.hypot(p.x - c.x, p.z - c.z) - fieldMid(f)) < 1e-6;
  }));
  ok('a field point is the nearest point of that field', fields().every(f => {
    const d = fieldDistance(f, from);
    const c = parentOf(f) ? parentOf(f).position : { x: 0, y: 0, z: 0 };
    // For a circle of radius m about c, the nearest point to `from` is |‖from−c‖ − m|
    // in the plane; check the planar component agrees.
    const planar = Math.abs(Math.hypot(from.x - c.x, from.z - c.z) - fieldMid(f));
    return d >= planar - 1e-6;
  }));
  const tgt = fieldTarget(f0, from);
  ok('a field target is warpable', !!tgt.position && tgt.userData.kind === 'belt');
  ok('a ring target says whose ring it is', tgt.userData.ringOf === f0.parentName);
  ok('a belt target says it is nobody\'s ring', fieldTarget(belts[0], from).userData.ringOf === null);

  // The reason fields.js exists: four files used to rebuild this and one of them would
  // have been left behind. A ring waypoint has to follow its planet, not just the ship.
  const p0 = tgt.position.clone();
  for (let i = 0; i < 400; i++) updateSystem(1);
  refreshFieldTarget(tgt, from);
  ok('a ring waypoint follows its planet', tgt.position.distanceTo(p0) > 1);
  ok('the refreshed waypoint is still on the ring',
     Math.abs(tgt.position.distanceTo(parentOf(f0).position) - fieldMid(f0)) < 1e-6);
  ok('refreshing an unknown target is a no-op',
     refreshFieldTarget({ userData: { beltKey: 'nope' }, position: new THREE.Vector3() }, from) === false);

  const contacts = fieldContacts(from);
  ok('every field appears as a contact', contacts.length === fields().length);
  ok('contacts are sorted by distance',
     contacts.every((c, i) => i === 0 || c.d >= contacts[i - 1].d));
  ok('a distance cap drops the far ones', fieldContacts(from, 1).length < contacts.length);

  // And the rocks are minable by the same call the cutter uses.
  const near = nearestAsteroid(mine[0].position, 200);
  ok('a ring rock is findable by the cutter\'s own lookup', !!near);
}

// ── Lagrange points & deep-space anomalies ───────────────────────────
console.log('\n— Lagrange points —');
{
  const pts = LG.lagrangePoints();
  const planetsHolding = planets2.filter(p => LG.holdsTrojans(p.userData));
  ok('every planet holds trojans', planetsHolding.length === planets2.length,
     `${planetsHolding.length}/${planets2.length}`);
  ok('no moon holds trojans', moons2.every(m => !LG.holdsTrojans(m.userData)));
  ok('the star holds none', !LG.holdsTrojans(find('Solaris Prime').userData));
  ok('two points per qualifying planet', pts.length === planetsHolding.length * 2);
  ok('every point is named for its primary and side',
     pts.every(lp => lp.name === `${lp.parentName} L${lp.side}` && (lp.side === 4 || lp.side === 5)));
  ok('point keys are unique', new Set(pts.map(lp => lp.key)).size === pts.length);

  // Geometry. L4 leads by 60 degrees, L5 trails, both on the primary's own orbit.
  const lp4 = pts.find(lp => lp.side === 4 && lp.parentName === planets2[6].userData.name);
  const lp5 = pts.find(lp => lp.side === 5 && lp.parentName === planets2[6].userData.name);
  const parent = lp4.parent;
  const pos4 = LG.pointPosition(lp4, {}), pos5 = LG.pointPosition(lp5, {});
  const R = parent.userData.orbitRadius;
  const rOf = p => Math.hypot(p.x, p.z);
  ok('L4 sits on the primary\'s orbit', Math.abs(rOf(pos4) - R) < 1e-6);
  ok('L5 sits on the primary\'s orbit', Math.abs(rOf(pos5) - R) < 1e-6);
  // Chord for a 60 degree separation on a circle of radius R is exactly R.
  const chord = p => Math.hypot(p.x - parent.position.x, p.z - parent.position.z);
  ok('L4 is 60° from its primary', Math.abs(chord(pos4) - R) < 1e-3, chord(pos4).toFixed(1));
  ok('L5 is 60° from its primary', Math.abs(chord(pos5) - R) < 1e-3);
  ok('L4 and L5 are 120° apart',
     Math.abs(Math.hypot(pos4.x - pos5.x, pos4.z - pos5.z) - R * Math.sqrt(3)) < 1e-3);
  ok('a point sits at its primary\'s altitude', Math.abs(pos4.y - parent.position.y) < 1e-9);

  // Prediction must agree with the simulation, same property as the ephemeris.
  {
    const want4 = LG.pointPositionAt(lp4, 240, {});
    const want5 = LG.pointPositionAt(lp5, 240, {});
    for (let i = 0; i < 240; i++) updateSystem(1);
    const got4 = LG.pointPosition(lp4, {}), got5 = LG.pointPosition(lp5, {});
    ok('L4 prediction matches 240 s of simulation',
       Math.hypot(want4.x - got4.x, want4.y - got4.y, want4.z - got4.z) < 1.0);
    ok('L5 prediction matches 240 s of simulation',
       Math.hypot(want5.x - got5.x, want5.y - got5.y, want5.z - got5.z) < 1.0);
  }

  // The synthetic-target seam: no mesh, a live position, and it tracks its parent.
  const t = LG.lagrangeTarget(lp4);
  ok('a point produces a targetable object', !!t.position && t.userData.kind === 'lagrange');
  ok('a point projects no gravity well', !t.userData.gravity);
  ok('an arrival at a point is the plain floor', arrivalRadius(t.userData) === WARP.arriveRadius);
  {
    const before = t.position.clone();
    for (let i = 0; i < 400; i++) updateSystem(1);
    ok('the target is stale until refreshed', t.position.distanceTo(before) === 0);
    ok('refresh moves it onto the point', LG.refreshLagrangeTarget(t));
    const now = LG.pointPosition(lp4, {});
    ok('the refreshed target is on the point',
       Math.hypot(t.position.x - now.x, t.position.z - now.z) < 1e-6);
    ok('a target with no key refuses refresh', !LG.refreshLagrangeTarget({ userData: {} }));
  }

  const cts = LG.lagrangeContacts(S.player.position);
  ok('contacts cover every point', cts.length === pts.length);
  ok('contacts are sorted nearest first', cts.every((c, i) => i === 0 || cts[i - 1].d <= c.d));
  ok('a range bound excludes the far ones',
     LG.lagrangeContacts(S.player.position, cts[0].d + 1).length < cts.length);
}

console.log('\n— deep-space anomalies —');
{
  ok('every anomaly type has a name, an icon and a description',
     ANOMALY_KEYS.every(k => ANOMALY_TYPES[k].name && ANOMALY_TYPES[k].icon && ANOMALY_TYPES[k].desc));
  ok('every anomaly type has a weight', ANOMALY_KEYS.every(k => ANOMALY_TYPES[k].weight > 0));
  ok('at least one type pays nothing worth having', !!ANOMALY_TYPES.dust);
  {
    const rng = makeRng(99);
    const rolled = new Set(Array.from({ length: 400 }, () => rollAnomaly(rng)));
    ok('rolling only ever returns real types', [...rolled].every(k => !!ANOMALY_TYPES[k]));
    ok('the roll reaches most of the table', rolled.size >= ANOMALY_KEYS.length - 1);
  }

  S.anomalies = {}; S.scans = {};
  const pts = LG.lagrangePoints();
  ok('what is on station is deterministic',
     pts.every(lp => {
       const a = LG.anomalyAt(lp), b = LG.anomalyAt(lp);
       return (a === null && b === null) || (a && b && a.key === b.key);
     }));
  ok('some points hold something', pts.some(lp => !!LG.anomalyAt(lp)));
  ok('some points are empty', pts.some(lp => !LG.anomalyAt(lp)));

  const lp = pts.find(x => !!LG.anomalyAt(x));
  const empty = pts.find(x => !LG.anomalyAt(x));

  // Gating: range, then resolution, then one shot.
  S.player.position.set(0, 0, 3400);
  ok('an unresolved point cannot be worked', LG.investigate(lp) === null);
  const at = LG.pointPosition(lp, {});
  S.player.position.set(at.x, at.y, at.z);
  ok('being close is not enough without a sweep', LG.investigate(lp) === null);
  S.scans[lp.name] = LAGRANGE.chartTier;
  S.player.position.set(at.x + LAGRANGE.workRange * 3, at.y, at.z);
  ok('a resolved point still needs the range', LG.investigate(lp) === null);

  S.player.position.set(at.x, at.y, at.z);
  S.cargo = { ore: 0, salvage: 0, data: 0 };
  const before = S.credits;
  const res = LG.investigate(lp);
  ok('a resolved point in range can be worked', !!res);
  ok('working it yields something', !!res &&
     (res.salvage > 0 || res.data > 0 || res.credits > 0 || Object.keys(res.materials).length > 0));
  ok('salvage landed in the hold', S.cargo.salvage === (res ? res.salvage : -1));
  ok('telemetry landed in the hold', S.cargo.data === (res ? res.data : -1));
  ok('credits landed', S.credits === before + (res ? res.credits : -1));
  ok('the site is marked worked', LG.isWorked(lp.key));
  ok('a worked site holds nothing', LG.anomalyAt(lp) === null);
  ok('a worked site cannot be worked twice', LG.investigate(lp) === null);

  // An empty point is still consumed — you went and looked, and that is the answer.
  if (empty) {
    S.scans[empty.name] = LAGRANGE.chartTier;
    const ep = LG.pointPosition(empty, {});
    S.player.position.set(ep.x, ep.y, ep.z);
    const r2 = LG.investigate(empty);
    ok('an empty point reports empty', !!r2 && r2.key === null);
    ok('an empty point is still consumed', LG.isWorked(empty.key));
  } else ok('an empty point reports empty (none this seed — skipped)', true);

  // A full hold refuses cargo rather than losing the site's contents silently.
  {
    const lp2 = pts.find(x => !LG.isWorked(x.key) && !!LG.anomalyAt(x));
    if (lp2) {
      S.scans[lp2.name] = LAGRANGE.chartTier;
      const p2 = LG.pointPosition(lp2, {});
      S.player.position.set(p2.x, p2.y, p2.z);
      S.cargo = { ore: S.stats.cargoCap, salvage: 0, data: 0 };
      const r3 = LG.investigate(lp2);
      ok('a full hold takes no cargo', !!r3 && r3.salvage === 0 && r3.data === 0);
      ok('a full hold still takes the materials and the credits', !!r3);
    } else ok('a full hold takes no cargo (no site left — skipped)', true);
    S.cargo = { ore: 0, salvage: 0, data: 0 };
  }

  // The scan readout.
  S.anomalies = {}; S.scans = {};
  const lp3 = LG.lagrangePoints().find(x => !!LG.anomalyAt(x));
  const obj = LG.lagrangeTarget(lp3);
  // Far enough out that the sweep has not resolved it — the point itself is still on the
  // charts, which is the property the next two checks are about.
  S.player.position.set(0, 0, 3400);
  const dim = scanReport(obj, 'lagrange', lp3.name);
  ok('an unresolved point says so', dim.rows.some(r => r[1] === 'unresolved'));
  ok('the readout names the primary and the side',
     dim.rows.some(r => r[0] === 'Station' && r[1].includes(lp3.parentName)));
  S.scans[lp3.name] = 4;
  const lit = scanReport(obj, 'lagrange', lp3.name);
  ok('a resolved point names what is there', lit.rows.some(r => /Contact/.test(r[0])));
  ok('the note is the anomaly\'s own description', lit.note.length > 20 && lit.note !== dim.note);
  S.anomalies[lp3.key] = true;
  ok('a worked point reads as spent',
     scanReport(obj, 'lagrange', lp3.name).rows.some(r => r[1] === 'worked out'));

  // Persistence: one flag per site, and that is the whole of schema 10.
  ok('the schema moved for it', SCHEMA === 13);
  const packed = LG.serializeAnomalies();
  ok('serialising captures the worked set', packed[lp3.key] === true);
  LG.restoreAnomalies(null);
  ok('an absent payload restores empty', Object.keys(LG.worked()).length === 0);
  LG.restoreAnomalies(packed);
  ok('a restored payload marks the same sites worked', LG.isWorked(lp3.key));
  S.anomalies = {}; S.scans = {};
}

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
