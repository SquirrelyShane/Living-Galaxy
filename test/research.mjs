// Research: turning what you looked at into what you know.
//
// The property this suite defends is the one that separates this from a currency: **findings
// are typed, and their type comes from the body**. A research tree where all telemetry is
// interchangeable makes where you went irrelevant — you probe whatever is nearest and bank
// points. So most of what follows checks that a cold world teaches cold, a giant teaches
// atmosphere, an anomaly is the only route to exotic, and that a project you have not
// gathered evidence for stays shut regardless of how much raw data is in the hold.

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
const { createSystem } = await imp('world/system.js');
const R = await imp('systems/research.js');
const { PROJECTS, PROJECT_KEYS, FINDING_KEYS, GATED } = await imp('data/research.js');
const { traits } = await imp('data/planetary/traits.js');
const { probePlanet } = await imp('systems/survey.js');
const { queueJob, addMaterial } = await imp('systems/crafting.js');
const { BLUEPRINTS } = await imp('data/crafting/index.js');
const { CRAFT, RESEARCH } = await imp('core/config.js');
const { SCHEMA } = await imp('core/version.js');

initScene();
recalcStats();
seedWorld(20260808);
createSystem();

const bodies = S.world.bodies;
const planets = bodies.filter(b => b.userData.kind === 'planet');
const byType = t => planets.find(p => p.userData.ptype === t);

const reset = () => {
  S.research = null; S.log = null;
  S.cargo = { ore: 0, salvage: 0, data: 0 };
  S.scans = {}; S.survey = {};
  S.time = 1000;
  recalcStats();
};
/** Grant findings directly — most checks are about what a project does with them. */
const grant = (kind, n) => { R.lab().findings[kind] = (R.lab().findings[kind] || 0) + n; };
const hours = h => { const dt = h / CRAFT.gameHoursPerSecond; R.updateResearch(dt); };

// ── the table ────────────────────────────────────────────────────────
console.log('\n— the project table —');
{
  ok('every project has a name and a description',
     PROJECT_KEYS.every(k => PROJECTS[k].name && PROJECTS[k].desc));
  ok('every project costs data and time',
     PROJECT_KEYS.every(k => PROJECTS[k].data > 0 && PROJECTS[k].hours > 0));
  ok('every project does something',
     PROJECT_KEYS.every(k => PROJECTS[k].effects || (PROJECTS[k].unlocks || []).length),
     PROJECT_KEYS.filter(k => !PROJECTS[k].effects && !(PROJECTS[k].unlocks || []).length).join(','));
  ok('every declared need is a real finding kind',
     PROJECT_KEYS.every(k => Object.keys(PROJECTS[k].needs || {}).every(n => FINDING_KEYS.includes(n))));
  ok('every prerequisite is a real project',
     PROJECT_KEYS.every(k => (PROJECTS[k].requires || []).every(r => !!PROJECTS[r])));
  ok('every unlocked blueprint exists',
     PROJECT_KEYS.every(k => (PROJECTS[k].unlocks || []).every(b => !!BLUEPRINTS[b])));
  ok('only the top tier is gated',
     Object.keys(GATED).every(b => BLUEPRINTS[b].tier === 5),
     Object.keys(GATED).filter(b => BLUEPRINTS[b].tier !== 5).join(','));

  // No cycles: a prerequisite chain that loops is a project nobody can ever start.
  const depth = (id, seen = new Set()) => {
    if (seen.has(id)) return Infinity;
    seen.add(id);
    return 1 + Math.max(0, ...(PROJECTS[id].requires || []).map(r => depth(r, new Set(seen))));
  };
  ok('the prerequisite graph has no cycles', PROJECT_KEYS.every(k => depth(k) < 99));
}

// ── findings come from the body ──────────────────────────────────────
console.log('\n— what a world teaches —');
{
  reset();
  // Derived from physics rather than a list of planet names, so a new planet type files
  // findings on its own — the failure that made planetInfo() speak a dead vocabulary.
  const giant = planets.find(p => traits(p.userData.ptype).gas);
  ok('a gas giant teaches atmosphere', R.kindsOf(giant).includes('atmos'));
  ok('and not geology', !R.kindsOf(giant).includes('geologic'));

  const cold = planets.concat(bodies.filter(b => b.userData.kind === 'moon'))
    .find(b => (b.userData.tempC ?? 0) <= RESEARCH.coldBelow);
  ok('a cold body teaches cryogenics', !!cold && R.kindsOf(cold).includes('cryo'));
  const hot = planets.find(p => (p.userData.tempC ?? 0) >= RESEARCH.hotAbove);
  ok('a hot body teaches thermal', !hot || R.kindsOf(hot).includes('thermal'));
  ok('nothing teaches both hot and cold',
     bodies.every(b => { const k = R.kindsOf(b); return !(k.includes('thermal') && k.includes('cryo')); }));

  const rock = byType('barren');
  ok('a bare rock still teaches something', !rock || R.kindsOf(rock).length > 0);
  ok('every body in the system yields at least one kind',
     bodies.filter(b => b.userData.kind !== 'star').every(b => R.kindsOf(b).length > 0));
  ok('every kind produced is a declared kind',
     bodies.filter(b => b.userData.kind !== 'star')
       .every(b => R.kindsOf(b).every(k => FINDING_KEYS.includes(k))));

  // A world can be several things at once — pretending otherwise flattens the outer system.
  ok('some body teaches more than one kind',
     bodies.some(b => R.kindsOf(b).length > 1));

  // Exotic is anomaly-only, which is what makes a Lagrange point worth the trip.
  ok('no ordinary world teaches exotic',
     planets.every(p => !R.kindsOf(p).includes('exotic')));
  R.fileExotic('derelict hull');
  ok('an anomaly does', R.findingCount('exotic') === 1);
}

console.log('\n— probing files findings —');
{
  reset();
  const body = planets[3];
  S.orbit = { body };
  S.probes = 5;
  S.cargo = { ore: 0, salvage: 0, data: 0 };
  probePlanet(body);
  const first = Object.keys(R.findings()).length;
  ok('a probe files findings', first > 0);
  ok('and telemetry lands in the hold', S.cargo.data > 0);

  // Once per body: probing the same moon eight times has not taught you eight times as
  // much about cold, and without this the system collapses into farming the nearest world.
  const counts = Object.assign({}, R.findings());
  S.probes = 5;
  probePlanet(body);
  ok('probing the same world again teaches nothing new',
     JSON.stringify(R.findings()) === JSON.stringify(counts));

  S.orbit = { body: planets[5] };
  S.probes = 5;
  probePlanet(planets[5]);
  ok('a different world does', Object.values(R.findings()).reduce((a, b) => a + b, 0) >
     Object.values(counts).reduce((a, b) => a + b, 0));
  S.orbit = null;
}

// ── projects ─────────────────────────────────────────────────────────
console.log('\n— starting a project —');
{
  reset();
  const id = 'sensorTuning';
  const p = PROJECTS[id];

  ok('a project with no evidence is blocked', /geologic/i.test(R.projectBlocker(id)),
     R.projectBlocker(id));
  grant('geologic', p.needs.geologic);
  ok('evidence alone is not enough', /data/.test(R.projectBlocker(id)), R.projectBlocker(id));

  // And the converse — the one that separates this from a currency.
  reset();
  S.cargo.data = 99999;
  ok('unlimited raw data does not unlock a project you lack evidence for',
     !!R.projectBlocker(id), R.projectBlocker(id));

  reset();
  grant('geologic', p.needs.geologic);
  S.cargo.data = p.data + 40;
  ok('with both, it is clear', R.projectBlocker(id) === null);
  ok('it starts', R.startProject(id));
  ok('the telemetry is consumed', S.cargo.data === 40);
  ok('the findings are consumed', R.findingCount('geologic') === 0);
  ok('the lab is busy', !!R.activeProject());
  ok('a second project is refused while it runs', R.projectBlocker('thermalPlating') === 'lab busy');

  hours(p.hours * 0.5);
  ok('it is not done early', !R.isDone(id));
  hours(p.hours);
  ok('it completes', R.isDone(id));
  ok('the lab is free again', !R.activeProject());
  ok('a completed project cannot be run twice', R.projectBlocker(id) === 'complete');
  ok('an unknown project is refused', R.projectBlocker('nonsense') === 'unknown project');
}

console.log('\n— prerequisites —');
{
  reset();
  const id = 'atmosDynamics';
  grant('atmos', 9); grant('geologic', 9);
  S.cargo.data = 99999;
  ok('a project with an unmet prerequisite is blocked', /needs/i.test(R.projectBlocker(id)),
     R.projectBlocker(id));
  R.lab().done.push('sensorTuning');
  ok('and clear once it is met', R.projectBlocker(id) === null);
}

console.log('\n— what it bought —');
{
  reset();
  const base = S.stats.sensor;
  R.lab().done.push('sensorTuning');
  recalcStats();
  ok('a finished project changes the ship', S.stats.sensor > base,
     `${base} -> ${S.stats.sensor}`);
  ok('the bonus shows in the report', R.researchBonuses().sensorMult > 0);

  reset();
  ok('an empty lab grants nothing', Object.keys(R.researchBonuses()).length === 0);
  ok('and the ship is back to baseline', (recalcStats(), S.stats.sensor === base));
}

console.log('\n— the blueprint gate —');
{
  reset();
  const locked = Object.keys(GATED)[0];
  ok('a gated blueprint is locked to start', !R.blueprintUnlocked(locked));
  ok('and says which project would open it', /not researched/.test(R.lockReason(locked)));
  ok('an ungated blueprint is not', R.blueprintUnlocked('MOD-001'));
  ok('and has no reason', R.lockReason('MOD-001') === null);

  // The gate has to actually bite at the fabricator, not only in a query.
  const bp = BLUEPRINTS[locked];
  for (const m in bp.materials) addMaterial(m, bp.materials[m] * 3);
  ok('the fabricator refuses a locked blueprint', queueJob(locked) === null);

  R.lab().done.push(GATED[locked]);
  ok('research releases it', R.blueprintUnlocked(locked));
  const job = queueJob(locked);
  ok('and the fabricator takes it', !!job);
}

console.log('\n— abandoning —');
{
  reset();
  grant('thermal', 9);
  S.cargo.data = 99999;
  const before = S.cargo.data;
  R.startProject('thermalPlating');
  const spent = before - S.cargo.data;
  ok('starting spends telemetry', spent > 0);
  ok('a project can be abandoned', R.cancelProject());
  ok('the lab is free', !R.activeProject());
  // Stopping does not give it back — which is what makes starting one a decision.
  ok('the telemetry is not refunded', S.cargo.data === before - spent);
  ok('and it is not marked complete', !R.isDone('thermalPlating'));
  ok('abandoning nothing is harmless', R.cancelProject() === false);
}

// ── persistence ──────────────────────────────────────────────────────
console.log('\n— it survives a save —');
{
  reset();
  grant('cryo', 4);
  R.lab().done.push('sensorTuning');
  S.cargo.data = 9999;
  R.startProject('cryoStorage');

  const packed = R.serializeResearch();
  ok('the payload carries findings', packed.findings.cryo >= 0);
  ok('the payload carries completed work', packed.done.includes('sensorTuning'));
  ok('and the project in the lab', packed.active && packed.active.id === 'cryoStorage');

  R.restoreResearch(null);
  ok('an absent payload restores empty', R.lab().done.length === 0 && !R.activeProject());
  R.restoreResearch(packed);
  ok('a restored payload keeps the work', R.isDone('sensorTuning'));
  ok('and the lab', R.activeProject().id === 'cryoStorage');

  R.restoreResearch({ findings: { cryo: -3, nonsense: 5 }, done: ['sensorTuning', 'madeUp'],
                      active: { id: 'alsoMadeUp', left: 3 } });
  ok('a negative finding is dropped', R.findingCount('cryo') === 0);
  ok('an unknown finding kind is dropped', R.findingCount('nonsense') === 0);
  ok('an unknown project is dropped from history', R.lab().done.join() === 'sensorTuning');
  ok('an unknown active project is dropped', R.activeProject() === null);
  // A project both completed and in the lab is a contradiction; completion wins.
  R.restoreResearch({ done: ['sensorTuning'], active: { id: 'sensorTuning', left: 2 } });
  ok('a completed project cannot also be in the lab', R.activeProject() === null);
  ok('the schema moved for it', SCHEMA === 15);
}

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
