// Slice 1 — core platform. RNG streams, the fixed-step clock, error guards,
// and the save schema / migration chain. No world generation needed.
import { installGlobals } from './stub.mjs';

const ROOT = new URL('../', import.meta.url);
installGlobals(new URL('index.html', ROOT).pathname);

let pass = 0, fail = 0;
const ok = (name, cond, extra = '') => {
  if (cond) { pass++; console.log('  ok   ' + name); }
  else { fail++; console.log('  FAIL ' + name + (extra ? ' — ' + extra : '')); }
};
const imp = p => import(new URL('src/' + p, ROOT).href);

const { VERSION, SCHEMA, versionCode, versionString } = await imp('core/version.js');
const { seedWorld, wnext, stream, resetStream, worldSeed, hashString, makeRng } = await imp('core/rng.js');
const { clock, advance, sample, perfStats, resetClock, nowMs } = await imp('core/clock.js');
const { guard, diagnostics, unpark, record, isParked, setFaultHandler } = await imp('core/diagnostics.js');
const { CLOCK, DIAG, SAVE_KEY } = await imp('core/config.js');
const { S, recalcStats } = await imp('core/state.js');
const save = await imp('systems/platform/save.js');

// ── version ──────────────────────────────────────────────────────────
console.log('\n— build identity —');
ok('version is well formed', /^\d+\.\d+\.\d+$/.test(VERSION), VERSION);
ok('schema is a positive integer', Number.isInteger(SCHEMA) && SCHEMA > 0);
ok('versionCode orders releases',
   versionCode('0.1.9') < versionCode('0.2.0') && versionCode('0.2.9') < versionCode('0.3.0'));
ok('this build is at or past the slice it claims', versionCode(VERSION) >= versionCode('1.00.30'));
ok('versionString reads as a build', versionString().startsWith('v' + VERSION));

// ── rng ──────────────────────────────────────────────────────────────
console.log('\n— seeded streams —');
seedWorld(1337);
const legacyFirst = wnext();
seedWorld(1337);
ok('world stream is reproducible', wnext() === legacyFirst);
ok('worldSeed reports the seed', worldSeed() === 1337);

seedWorld(1337);
const a1 = stream('npc').next(), a2 = stream('npc').next();
seedWorld(1337);
const b1 = stream('npc').next(), b2 = stream('npc').next();
ok('named stream is reproducible', a1 === b1 && a2 === b2);
ok('named stream advances', a1 !== a2);

seedWorld(1337);
stream('sky').next(); stream('sky').next(); stream('sky').next();
const npcAfterSky = stream('npc').next();
ok('streams do not perturb each other', npcAfterSky === a1);

seedWorld(1337);
const npcOnSeedA = stream('npc').next();
seedWorld(4242);
ok('a different seed gives a different stream', stream('npc').next() !== npcOnSeedA);
ok('two names differ on one seed', (seedWorld(7), stream('x').next()) !== (seedWorld(7), stream('y').next()));

seedWorld(1337);
stream('belt').next();
ok('resetStream rewinds', resetStream('belt').next() === (seedWorld(1337), stream('belt').next()));
ok('hashString is stable', hashString('npc') === hashString('npc') && hashString('npc') !== hashString('npd'));
const r = makeRng(9);
ok('makeRng.int stays in range', Array.from({ length: 200 }, () => r.int(3, 6)).every(v => v >= 3 && v <= 6));
ok('makeRng.chance(0) never fires', Array.from({ length: 50 }, () => r.chance(0)).every(v => v === false));

// ── clock ────────────────────────────────────────────────────────────
console.log('\n— fixed-step clock —');
resetClock();
ok('fixed step is on by default', CLOCK.fixedStep === true);
advance(0);                                  // first frame primes `last`
let steps = advance(1000 / 60 * 1000 / 1000); // ~16.67 ms later
ok('one frame at 60 Hz yields at most one step', steps <= 1);

resetClock();
advance(0);
let total = 0;
for (let i = 1; i <= 60; i++) total += advance(i * 16.667);
ok('60 frames at 60 Hz sim ~1 s', Math.abs(total * CLOCK.step - 1) < 0.05, `${(total * CLOCK.step).toFixed(3)} s`);

resetClock();
advance(0);
let slow = 0;
for (let i = 1; i <= 30; i++) slow += advance(i * 33.34);   // 30 fps
ok('30 fps simulates the same amount of time', Math.abs(slow * CLOCK.step - 1) < 0.05, `${(slow * CLOCK.step).toFixed(3)} s`);

resetClock();
advance(0);
const burst = advance(4000);                  // 4 s hitch (backgrounded tab)
ok('a long hitch is capped, not simulated whole', burst <= CLOCK.maxSteps);
ok('the abandoned backlog is counted', clock.stalls >= 1);
ok('accumulator never goes negative', clock.accum >= 0);

sample(4.2); sample(19.9); sample(6.0);
const perf = perfStats();
ok('perf reports worst frame', perf.worst >= 19.9);
ok('perf p95 sits inside the range', perf.p95 >= perf.avg && perf.p95 <= perf.worst);

// ── error guards ─────────────────────────────────────────────────────
console.log('\n— fault containment —');
unpark();
let faults = 0;
setFaultHandler(() => faults++);
const before = console.error;
console.error = () => {};                     // the guard is expected to be noisy
let ran = 0;
ok('a clean phase reports success', guard('probe', () => { ran++; }) === true && ran === 1);
ok('a throwing phase is contained', guard('boom', () => { throw new Error('x'); }) === false);
ok('the loop keeps running after a fault', guard('probe', () => { ran++; }) === true && ran === 2);
ok('the fault handler fired once', faults === 1);
for (let i = 0; i < DIAG.maxRepeats + 2; i++) guard('boom', () => { throw new Error('x'); });
ok('a repeat offender gets parked', isParked('boom'));
ok('parked phases stop executing', guard('boom', () => { throw new Error('never reached'); }) === false);
const diag = diagnostics();
ok('the log is bounded', diag.log.length <= DIAG.maxLog);
ok('diagnostics name the failing phase', diag.parked.includes('boom'));
unpark('boom');
ok('unpark restores a phase', !isParked('boom'));
record('manual', new Error('hand-written'));
ok('records can be added by hand', diagnostics().log.some(e => e.where === 'manual'));
console.error = before;

// ── save schema ──────────────────────────────────────────────────────
console.log('\n— save schema —');
recalcStats();
S.credits = 4321;
S.playtime = 720;
const snap = save.snapshot();
ok('snapshot carries the current schema', snap.v === SCHEMA);
ok('snapshot stamps the build', snap.build === VERSION);
ok('snapshot carries playtime', snap.playtime === 720);

save.wipeSave();
ok('wipe leaves no save', !save.hasSave());
save.saveGame(true);
ok('save writes a slot', save.hasSave());
const info = save.saveInfo();
ok('saveInfo reads the header', info && info.schema === SCHEMA && info.build === VERSION);
ok('saveInfo is not marked stale', info && info.stale === false);

// v2 payload — the 0.1 format — must load and be rewritten forward
const v2 = JSON.parse(JSON.stringify(snap));
delete v2.build; delete v2.savedAt; delete v2.playtime;
v2.v = 2;
v2.credits = 999;
v2.upgrades = { shield: 1, armor: 0, cargo: 0, thrust: 0, weapon: 0, mining: 0 };
const migrated = save.migrate(JSON.parse(JSON.stringify(v2)));
ok('a v2 save migrates to current', migrated && migrated.v === SCHEMA);
ok('migration fills the advanced upgrade keys', migrated.upgrades.pointDef === 0);
ok('migration preserves credits', migrated.credits === 999);

const v1 = { v: 1, classKey: 'civilian', credits: 100, weapon: 'pulse' };
const m1 = save.migrate(v1);
ok('a v1 save walks the whole chain', m1 && m1.v === SCHEMA);
ok('v1 weapon becomes an owned weapon', m1.ownedWeapons && m1.ownedWeapons.pulse === true);

ok('a future schema is refused, not guessed', save.migrate({ v: SCHEMA + 5 }) === null);
ok('junk is refused', save.migrate(null) === null && save.migrate(42) === null);

// corruption: the slot is quarantined and the backup takes over
S.credits = 8800;
save.saveGame(true);          // second write — now there is a previous good save to fall back on
localStorage.setItem(SAVE_KEY, '{ not json');
ok('a corrupt slot still loads from backup', save.loadGame() === true);
ok('the corrupt payload is kept aside', localStorage.getItem(SAVE_KEY + '.corrupt') !== null);

// transfer
save.wipeSave();
S.credits = 27500;
const text = save.exportSave();
S.credits = 0;
ok('import restores an exported flight', save.importSave(text) === true && S.credits === 27500);
ok('import rejects garbage', save.importSave('not a save') === false);
ok('import rejects a shapeless payload', save.importSave('{"v":3}') === false);

save.saveGame(true);
S.credits = 111;
save.saveGame(true);
ok('restoreBackup rolls one save back', save.restoreBackup() === true && S.credits === 27500);
save.wipeSave();
ok('wipe clears backup and quarantine too',
   !localStorage.getItem(SAVE_KEY + '.bak') && !localStorage.getItem(SAVE_KEY + '.corrupt'));

console.log(`\n${pass} passed, ${fail} failed\n`);
process.exit(fail ? 1 : 0);
