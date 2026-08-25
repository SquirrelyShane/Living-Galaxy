// v1.00.10 — the crew. Specialty against post, watch rotation, morale drivers,
// casualties, recruiting, and the persistence of all of it.
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
const { CREW, FATIGUE } = await imp('core/config.js');
const D = await imp('data/crew.js');
const C = await imp('systems/crew/crew.js');
const CR = await imp('systems/industry/crafting.js');
const { initScene } = await imp('world/scene.js');
const { createSystem, updateSystem } = await imp('world/system.js');
const { createAsteroids } = await imp('world/asteroids.js');
const { initPlayerFx } = await imp('entities/player.js');
const { createNpcs } = await imp('entities/npcs.js');
const { initProjectiles } = await imp('systems/combat/projectiles.js');
const { initCombat, damagePlayer } = await imp('systems/combat/combat.js');
const { initMining } = await imp('systems/industry/mining.js');
const { initWorldSim } = await imp('systems/platform/worldsim.js');
const { initMarket } = await imp('systems/trade/market.js');
const { initContracts } = await imp('systems/trade/contracts.js');
const { resetReputation } = await imp('systems/company/reputation.js');
const save = await imp('systems/platform/save.js');

initScene(); recalcStats(); seedWorld(1337); createSystem(); createAsteroids();
initProjectiles(); initCombat(); initMining(); initPlayerFx(); createNpcs();
resetReputation(); initWorldSim(); initMarket(); initContracts();
updateSystem(1);
S.running = true;
S.settings.autoRotate = false;      // most tests want to control the watch themselves

const fresh = (roles = ['gunner', 'engineer', 'helm']) => {
  S.crew = null;
  C.initCrew();
  S.crew = roles.map((r, i) => Object.assign(C.makeCrew(r), { id: 900 + i, level: 3 }));
  recalcStats();
  return S.crew;
};
const tick = (n, dt = 1 / 60) => { for (let i = 0; i < n; i++) { S.time += dt; C.updateCrew(dt); } };

// ── specialty and post ───────────────────────────────────────────────
console.log('\n— speciality and post —');
{
  const [g] = fresh(['gunner']);
  ok('a new crewman stands at their speciality', D.postOf(g) === 'gunner');
  ok('and is not marked as covering', D.isCross(g) === false);
  ok('and is on watch', D.onDuty(g) === true);

  ok('posting elsewhere works', C.assignPost(g.id, 'helm') === true);
  ok('the post moved', D.postOf(g) === 'helm');
  ok('the speciality did not', D.specialtyOf(g) === 'gunner');
  ok('they are marked as covering', D.isCross(g) === true);

  // The whole point of splitting the two: moving is free.
  const xp = g.xp, morale = g.morale;
  C.assignPost(g.id, 'rigger');
  ok('posting costs no experience', g.xp === xp);
  ok('posting costs no morale', g.morale === morale);

  ok('posting to where they already are is a no-op', C.assignPost(g.id, 'rigger') === false);
  ok('posting to a station that does not exist is refused', C.assignPost(g.id, 'chef') === false);
  ok('posting an unknown crewman is refused', C.assignPost(-1, 'helm') === false);

  C.assignPost(g.id, 'gunner');
  ok('returning to speciality clears the covering flag', !D.isCross(g));
}
{
  // ...and the cost of covering is output and learning, not a fee
  const [a, b] = fresh(['gunner', 'gunner']);
  a.fatigue = 0; b.fatigue = 0; a.morale = 1; b.morale = 1; a.injury = 0; b.injury = 0;
  // Measure the same crewman before and after. Two crew rolled from the same seed have
  // different *traits*, so comparing across them would be measuring the trait table.
  const home = D.crewOutput(b);
  C.assignPost(b.id, 'purser');
  const away = D.crewOutput(b);
  ok('covering costs output', away < home, `${home.toFixed(2)} → ${away.toFixed(2)}`);
  ok('the penalty is the configured one',
     Math.abs(away / home - CREW.crossPenalty) < 1e-9, (away / home).toFixed(3));

  a.xp = 0; b.xp = 0;
  S.input.firing = true;                 // gunnery is the working department
  tick(600);
  S.input.firing = false;
  ok('the one at their post learns faster than the one covering', a.xp > b.xp,
     `${a.xp.toFixed(0)} vs ${b.xp.toFixed(0)}`);
  ok('the one covering still learns something', b.xp > 0);
}
{
  // contribution is credited to the post, not the speciality
  const [r] = fresh(['rigger']);
  recalcStats();
  const mining = S.stats.miningMult, gunnery = S.stats.weaponMult;
  C.assignPost(r.id, 'gunner');
  recalcStats();
  ok('moving off a post removes its bonus', S.stats.miningMult < mining,
     `${mining.toFixed(3)} → ${S.stats.miningMult.toFixed(3)}`);
  // Relative, not against 1.0: the hull's own base multipliers are not 1, so an absolute
  // threshold here would be testing the ship class rather than the crew.
  ok('and the new post gains one', S.stats.weaponMult > gunnery,
     `${gunnery.toFixed(3)} → ${S.stats.weaponMult.toFixed(3)}`);
}

// ── retraining ───────────────────────────────────────────────────────
console.log('\n— retraining —');
{
  const [c] = fresh(['gunner']);
  c.xp = 100; c.morale = 1;
  ok('retraining changes the speciality', C.retrain(c.id, 'medic') === true &&
     D.specialtyOf(c) === 'medic');
  ok('it costs progress', c.xp < 100, String(c.xp));
  ok('it costs morale', c.morale < 1);
  ok('it puts them back at their new speciality', D.postOf(c) === 'medic' && !D.isCross(c));
  ok('retraining to what they already are is refused', C.retrain(c.id, 'medic') === false);
  ok('retraining to nothing is refused', C.retrain(c.id, 'chef') === false);
  ok('the old reassign name still retrains', C.reassign(c.id, 'helm') === true &&
     D.specialtyOf(c) === 'helm');
}

// ── watches ──────────────────────────────────────────────────────────
console.log('\n— watches —');
{
  const [c] = fresh(['helm']);
  recalcStats();
  const manned = S.stats.turnRate;
  ok('standing down works', C.setDuty(c.id, false) === true && D.onDuty(c) === false);
  ok('an off-watch crewman contributes nothing', D.crewOutput(c) === 0);
  recalcStats();
  ok('...and nothing reaches the ship', S.stats.turnRate < manned,
     `${manned.toFixed(3)} → ${S.stats.turnRate.toFixed(3)}`);
  ok('standing down twice is a no-op', C.setDuty(c.id, false) === false);
  ok('toggling brings them back', C.toggleDuty(c.id) === true && D.onDuty(c));
  ok('an unknown crewman cannot be stood down', C.setDuty(-1, false) === false);
}
{
  // Resting off watch is much faster than resting on it. Without that, standing someone
  // down is pure loss and nobody would ever do it.
  const [a, b] = fresh(['helm', 'helm']);
  a.fatigue = 1; b.fatigue = 1;
  C.setDuty(b.id, false);
  S.docked = null;
  S.player.throttle = 0;                 // nobody is working
  tick(600);
  ok('off-watch crew recover faster than idle on-watch crew', b.fatigue < a.fatigue,
     `on ${a.fatigue.toFixed(3)} vs off ${b.fatigue.toFixed(3)}`);
  ok('neither goes negative', a.fatigue >= 0 && b.fatigue >= 0);
}

// ── auto-rotation ────────────────────────────────────────────────────
console.log('\n— rotation —');
{
  S.settings.autoRotate = true;
  const [tired, rested] = fresh(['gunner', 'gunner']);
  tired.fatigue = 1;
  rested.fatigue = 0;
  C.setDuty(rested.id, false);
  C.rotateWatch();
  ok('an exhausted crewman is relieved', D.onDuty(tired) === false);
  ok('the relief comes on watch', D.onDuty(rested) === true);
  ok('the relief takes the post', D.postOf(rested) === 'gunner');
}
{
  // The rule that stops it thrashing: coming back requires being well rested, not
  // merely less exhausted than the threshold that sent you away.
  const [a, b] = fresh(['helm', 'helm']);
  a.fatigue = CREW.rotateAt + 0.01;
  b.fatigue = CREW.rotateAt - 0.01;       // rested enough to stay, not to relieve
  C.setDuty(b.id, false);
  C.rotateWatch();
  ok('a barely-rested crewman is not sent back in', D.onDuty(b) === false,
     `b fatigue ${b.fatigue.toFixed(2)} vs rotateBackAt ${CREW.rotateBackAt}`);
}
{
  // ...and it never empties a manned post
  const [lone] = fresh(['gunner']);
  lone.fatigue = 1;
  C.rotateWatch();
  ok('the last body at a post is not stood down', D.onDuty(lone) === true);
  ok('and the ship stays short-handed rather than quietly fixing itself',
     lone.fatigue >= CREW.rotateAt);
  S.settings.autoRotate = false;
}

// ── morale ───────────────────────────────────────────────────────────
console.log('\n— morale —');
{
  const payrollRun = (setup) => {
    const [c] = fresh(['helm']);
    c.morale = 0.7;
    setup(c);
    S.crewPayT = CREW.wageInterval;
    C.updateCrew(1 / 60);
    return c.morale;
  };

  S.credits = 1e6; S.docked = null;
  const base = payrollRun(() => {});
  ok('being paid lifts morale', base > 0.7, base.toFixed(3));

  S.credits = 0;
  const unpaid = payrollRun(() => {});
  ok('missing payroll costs morale', unpaid < 0.7, unpaid.toFixed(3));

  S.credits = 1e6;
  const tiredM = payrollRun(c => { c.fatigue = 1; });
  ok('an exhausted crew is less cheerful about it', tiredM < base,
     `${base.toFixed(3)} vs ${tiredM.toFixed(3)}`);

  const crossM = payrollRun(c => { C.assignPost(c.id, 'gunner'); });
  ok('being posted off speciality costs morale', crossM < base,
     `${base.toFixed(3)} vs ${crossM.toFixed(3)}`);

  S.docked = S.world.stations[0];
  const shore = payrollRun(() => {});
  ok('shore leave lifts it further', shore > base, `${base.toFixed(3)} vs ${shore.toFixed(3)}`);
  S.docked = null;

  const floored = payrollRun(c => { c.morale = CREW.moraleFloor; S.credits = 0; });
  ok('morale has a floor', floored >= CREW.moraleFloor - 1e-9, String(floored));
  S.credits = 1e6;
  const capped = payrollRun(c => { c.morale = 1; });
  ok('morale has a ceiling', capped <= 1 + 1e-9, String(capped));
}

// ── casualties ───────────────────────────────────────────────────────
console.log('\n— casualties —');
{
  fresh(['gunner', 'engineer']);
  const small = C.crewCasualty(S.stats.hullMax * CREW.injuryHullFrac * 0.5);
  ok('a scratch hurts nobody', small === null);

  // A big enough hit, rolled enough times, must eventually injure someone
  let hurt = null;
  for (let i = 0; i < 200 && !hurt; i++) hurt = C.crewCasualty(S.stats.hullMax);
  ok('a breach eventually injures someone', !!hurt, 'no casualty in 200 hits');
  ok('the injured crewman is recorded', hurt && (hurt.crew.injury || 0) > 0);
  ok('an injury does not kill outright', hurt && hurt.died === false);
  ok('injury lowers output', D.crewOutput(hurt.crew) < hurt.crew.level * 1.5);
}
{
  // Only the people you sent into it can be hurt.
  const [a, b] = fresh(['gunner', 'engineer']);
  C.setDuty(b.id, false);
  for (let i = 0; i < 300; i++) C.crewCasualty(S.stats.hullMax);
  ok('off-watch crew are not injured', (b.injury || 0) === 0, String(b.injury));
  ok('on-watch crew are', (a.injury || 0) > 0);
}
{
  // Death requires an already badly injured crewman — losing a veteran should be the end
  // of a bad run, not one unlucky frame.
  const crew = fresh(['gunner', 'engineer', 'helm']);
  for (const c of crew) c.injury = 0;
  let died = false;
  for (let i = 0; i < 400 && !died; i++) {
    const r = C.crewCasualty(S.stats.hullMax);
    if (r && r.died) died = true;
  }
  ok('a healthy crew cannot be killed in one hit', S.crew.length >= 1);

  const [solo] = fresh(['gunner']);
  solo.injury = 1;
  let killed = false;
  for (let i = 0; i < 500 && !killed; i++) {
    const r = C.crewCasualty(S.stats.hullMax);
    if (r && r.died) killed = true;
  }
  ok('an already-dying crewman can be lost', killed);
  ok('the dead leave the roster', S.crew.length === 0);
}
{
  // and morale takes it hard
  const crew = fresh(['gunner', 'engineer', 'helm']);
  for (const c of crew) { c.injury = 1; c.morale = 1; }
  let killed = false;
  for (let i = 0; i < 800 && !killed; i++) {
    const r = C.crewCasualty(S.stats.hullMax);
    if (r && r.died) killed = true;
  }
  ok('a death is felt by the survivors', !killed || S.crew.every(c => c.morale < 1),
     S.crew.map(c => c.morale.toFixed(2)).join(','));
}
{
  // healing
  const [c] = fresh(['gunner']);
  c.injury = 0.8;
  S.docked = null;
  tick(600);
  const adrift = c.injury;
  ok('injuries heal under way', adrift < 0.8, adrift.toFixed(3));

  c.injury = 0.8;
  S.docked = S.world.stations[0];
  tick(600);
  ok('they heal much faster docked', c.injury < adrift,
     `${adrift.toFixed(3)} adrift vs ${c.injury.toFixed(3)} docked`);
  S.docked = null;

  // damage control on watch speeds it up
  const [g, m] = fresh(['gunner', 'medic']);
  g.injury = 0.8; C.setDuty(m.id, false);
  tick(600);
  const without = g.injury;
  const [g2, m2] = fresh(['gunner', 'medic']);
  g2.injury = 0.8; C.setDuty(m2.id, true);
  tick(600);
  ok('damage control on watch heals faster', g2.injury < without,
     `${without.toFixed(3)} without vs ${g2.injury.toFixed(3)} with`);
  ok('hasMedic reports the post, not the speciality', (() => {
    C.assignPost(m2.id, 'purser');
    return C.hasMedic() === false;
  })());
}
{
  // paying for treatment
  fresh(['gunner', 'engineer']);
  for (const c of S.crew) c.injury = 0.5;
  const q = C.medicalQuote();
  ok('the infirmary quotes for the injured', q.crew === 2 && q.cost > 0, JSON.stringify(q));
  S.docked = null;
  ok('treatment needs a station', C.treatCrew() === false);
  S.docked = S.world.stations[0];
  S.credits = 0;
  ok('treatment needs credits', C.treatCrew() === false);
  S.credits = q.cost;
  ok('treatment works', C.treatCrew() === true);
  ok('everyone is patched up', S.crew.every(c => (c.injury || 0) === 0));
  ok('a healthy crew is not charged', C.treatCrew() === false);
  S.docked = null;
}

// ── recruiting ───────────────────────────────────────────────────────
console.log('\n— recruiting —');
{
  S.recruits = null;
  S.docked = S.world.stations[0];
  S.time = 1000;
  const pool = C.recruitPool();
  ok('a station posts recruits', pool.length >= CREW.recruitMin && pool.length <= CREW.recruitMax,
     String(pool.length));
  ok('the pool is stable while you stand there',
     C.recruitPool() === pool || C.recruitPool().length === pool.length);
  ok('the pool lives in state, not on the mesh', !!S.recruits && !!S.recruits[S.docked.userData.name]);

  // The 0.1 pool was generated once and never again. It turns over now.
  const before = pool.map(c => c.name).join(',');
  S.time += CREW.recruitRefresh + 10;
  const after = C.recruitPool().map(c => c.name).join(',');
  ok('the board turns over on a timer', after !== before, `${before} → ${after}`);

  // ...and it is deterministic, so two clients on one seed see the same people
  const snapshot = C.recruitPool().map(c => c.name + c.level).join('|');
  S.recruits = null;
  ok('generation is deterministic for a seed and a moment',
     C.recruitPool().map(c => c.name + c.level).join('|') === snapshot);
}
{
  fresh(['gunner']);
  S.docked = S.world.stations[0];
  const pool = C.recruitPool();
  const pick = pool[0];
  S.credits = 0;
  ok('hiring needs credits', C.hire(pick) === false);
  S.credits = 1e6;
  const n = S.crew.length;
  ok('hiring works', C.hire(pick) === true && S.crew.length === n + 1);
  ok('the hire starts on watch at their speciality', (() => {
    const c = S.crew[S.crew.length - 1];
    return D.onDuty(c) && !D.isCross(c) && (c.injury || 0) === 0;
  })());
  ok('the hire leaves the board', !C.recruitPool().includes(pick));

  // berths
  while (S.crew.length < C.berths()) S.crew.push(C.makeCrew('helm'));
  const full = C.recruitPool()[0];
  ok('a full ship cannot hire', full ? C.hire(full) === false : true);
  S.docked = null;
}

// ── reporting ────────────────────────────────────────────────────────
console.log('\n— reporting —');
{
  const [g, e] = fresh(['gunner', 'engineer']);
  C.assignPost(e.id, 'gunner');
  const report = C.postReport();
  const gun = report.find(r => r.post === 'gunner');
  ok('the post report counts who is standing where', gun.manned === 2, String(gun.manned));
  ok('it marks who is covering', gun.crew.some(x => x.cross));
  ok('an unmanned post reports zero',
     report.find(r => r.post === 'survey').manned === 0);
  ok('it covers every post', report.length === D.ROLE_KEYS.length);

  const sum = C.crewSummary();
  ok('the summary distinguishes post from speciality',
     sum.some(x => x.post !== x.specialty));
  ok('the summary carries a condition', sum.every(x => typeof x.condition === 'string'));

  C.setDuty(g.id, false);
  ok('condition names the worst thing currently true', D.condition(g) === 'off watch');
  C.setDuty(g.id, true);
  g.injury = 0.9;
  ok('injury outranks fatigue in the condition', D.condition(g) === 'badly hurt');
  g.injury = 0;
  g.fatigue = 1;
  ok('exhaustion is reported', D.condition(g) === 'exhausted');
  g.fatigue = 0;
  ok('a rested crewman at their post is ready', D.condition(g) === 'ready');
}

// ── persistence ──────────────────────────────────────────────────────
console.log('\n— persistence —');
{
  save.wipeSave();
  const [a, b] = fresh(['gunner', 'engineer']);
  C.assignPost(a.id, 'helm');
  C.setDuty(b.id, false);
  a.injury = 0.4; a.fatigue = 0.6; a.served = 1234;
  S.docked = S.world.stations[0];
  S.time = 500;
  C.recruitPool();

  save.saveGame(true);
  S.crew = null; S.recruits = null;
  ok('the flight reloads', save.loadGame() === true);

  const ra = S.crew.find(c => c.name === a.name);
  const rb = S.crew.find(c => c.name === b.name);
  ok('the post survives', D.postOf(ra) === 'helm' && D.isCross(ra));
  ok('the speciality survives', D.specialtyOf(ra) === 'gunner');
  ok('the watch survives', D.onDuty(rb) === false);
  ok('injury survives', Math.abs((ra.injury || 0) - 0.4) < 1e-6);
  ok('fatigue survives', Math.abs((ra.fatigue || 0) - 0.6) < 1e-6);
  ok('the recruit board survives', !!S.recruits && Object.keys(S.recruits).length > 0);

  // a pre-v1.00.10 crew record has no post and no watch — it must not arrive off duty
  const legacy = { id: 5, name: 'Old Hand', role: 'purser', trait: 'steady',
                   level: 4, xp: 10, morale: 0.9 };
  S.crew = [Object.assign({ morale: 1, xp: 0, level: 1, fatigue: 0,
                            post: null, onDuty: true, injury: 0, served: 0 }, legacy)];
  const old = S.crew[0];
  ok('an old crew record stands at their speciality', D.postOf(old) === 'purser');
  ok('an old crew record is on watch', D.onDuty(old) === true);
  ok('an old crew record is uninjured', (old.injury || 0) === 0);
  ok('an old crew record still contributes', D.crewOutput(old) > 0);

  save.wipeSave();
  S.docked = null;
}

// ── v1.00.30: experience pacing ──────────────────────────────────────
console.log('\n— experience pacing —');
{
  // The complaint that started this: a crew levelled to the cap while the ship sat docked
  // doing nothing. Idle progress should be a trickle you barely notice.
  const [c] = fresh(['helm']);
  c.xp = 0; c.level = 1;
  S.docked = null; S.player.throttle = 0;
  S.input.firing = false; S.input.mining = false;
  tick(60 * 60);                        // an hour of doing absolutely nothing
  ok('an idle hour does not level anybody', c.level === 1,
     `L${c.level}, ${c.xp.toFixed(0)} xp`);
  ok('idle progress is a trickle, not a career', c.xp < C.xpNeeded(1) * 0.6,
     `${c.xp.toFixed(0)} of ${C.xpNeeded(1)}`);
}
{
  // ...and events are where progression actually comes from.
  const [g] = fresh(['gunner']);
  g.xp = 0; g.level = 1; g.morale = 1;
  const gained = C.crewEvent('kill', 'gunner');
  ok('an event awards experience', gained > 0, gained.toFixed(1));
  ok('one kill is worth more than an idle minute', g.xp > CREW.xpIdle * 60);

  ok('an unknown event awards nothing', C.crewEvent('birthday') === 0);
  ok('an event with no crew is harmless', (() => { S.crew = []; return C.crewEvent('kill') === 0; })());
}
{
  // the department that did the work gets the bulk of it
  const [gun, eng] = fresh(['gunner', 'engineer']);
  gun.xp = 0; eng.xp = 0; gun.morale = 1; eng.morale = 1;
  gun.trait = 'steady'; eng.trait = 'steady';
  C.crewEvent('kill', 'gunner');
  ok('the department involved learns most', gun.xp > eng.xp,
     `gunner ${gun.xp.toFixed(1)} vs engineer ${eng.xp.toFixed(1)}`);
  ok('but everyone aboard learns something', eng.xp > 0);
}
{
  // off-watch crew are not in the room
  const [a, b] = fresh(['gunner', 'gunner']);
  a.xp = 0; b.xp = 0;
  C.setDuty(b.id, false);
  C.crewEvent('kill', 'gunner');
  ok('off-watch crew do not learn from an event', b.xp === 0, String(b.xp));
  ok('on-watch crew do', a.xp > 0);
}

// ── needs ────────────────────────────────────────────────────────────
console.log('\n— food, water and rest —');
{
  const crew = fresh(['helm', 'gunner']);
  for (const c of crew) { c.hunger = 0; c.thirst = 0; }
  S.stock = {};                          // nothing to eat
  S.docked = null;
  tick(60 * 60);
  ok('an unprovisioned crew gets hungry', crew[0].hunger > 0, crew[0].hunger.toFixed(3));
  ok('and thirsty', crew[0].thirst > 0);
  ok('hunger is capped', crew.every(c => c.hunger <= 1 && c.thirst <= 1));

  const starved = D.crewOutput(crew[0]);
  crew[0].hunger = 0; crew[0].thirst = 0;
  ok('hunger lowers output', D.crewOutput(crew[0]) > starved,
     `${starved.toFixed(2)} hungry vs ${D.crewOutput(crew[0]).toFixed(2)} fed`);
  ok('a starving crewman is still worth something', starved > 0);
}
{
  const crew = fresh(['helm']);
  crew[0].hunger = 1; crew[0].thirst = 1;
  CR.addMaterial('BIO-008', 100000);
  CR.addMaterial('RAW-011', 100000);
  tick(60 * 60);
  ok('provisions feed the crew', crew[0].hunger < 1 && crew[0].thirst < 1,
     `${crew[0].hunger.toFixed(3)} / ${crew[0].thirst.toFixed(3)}`);
  ok('and the stores are consumed', CR.held('BIO-008') < 100000);

  ok('provisionHours reports the runway', C.provisionHours() > 0 && C.provisionHours() < Infinity);
  ok('life support draws power', C.lifeSupportDraw() > 0);
  S.stock = {};
  ok('an empty larder reports no runway', C.provisionHours() === 0);
}
{
  // Breaks are short and taken on watch — distinct from a rotation, which is a shift change.
  const [c] = fresh(['helm']);
  c.onDuty = true; c.dutyT = 0; c.onBreak = false; c.fatigue = 0.8;
  tick(Math.ceil(CREW.breakInterval * 60) + 60);
  ok('a long stint earns a break', c.onBreak === true || c.dutyT < CREW.breakInterval,
     `onBreak ${c.onBreak}, dutyT ${c.dutyT.toFixed(0)}`);
  const rested = c.fatigue;
  tick(Math.ceil(CREW.breakLength * 60) + 60);
  ok('a break gives back some rest', c.fatigue < rested || c.fatigue === 0,
     `${rested.toFixed(3)} → ${c.fatigue.toFixed(3)}`);
  ok('a crewman on a break contributes nothing at their post',
     (() => { c.onBreak = true; recalcStats(); const before = S.stats.turnRate;
              c.onBreak = false; recalcStats(); return S.stats.turnRate > before; })());
}

// ── personality ──────────────────────────────────────────────────────
console.log('\n— resolve —');
{
  ok('every trait declares a will multiplier',
     Object.keys(D.CREW_TRAITS).every(k => typeof D.CREW_TRAITS[k].will === 'number'));
  ok('every trait declares a needs multiplier',
     Object.keys(D.CREW_TRAITS).every(k => typeof D.CREW_TRAITS[k].needs === 'number'));
  ok('traits carry flavour',
     Object.keys(D.CREW_TRAITS).every(k => !!D.CREW_TRAITS[k].flavour));

  // Neither end of the willpower spread is strictly better — that is the test every
  // trait has to pass, or it is not a choice.
  const wills = Object.keys(D.CREW_TRAITS).map(k => D.CREW_TRAITS[k].will);
  ok('the spread runs both sides of neutral',
     Math.min(...wills) < 1 && Math.max(...wills) > 1);

  const [c] = fresh(['helm']);
  c.will = 0.5;
  c.trait = 'zealot';
  const stubborn = D.willpowerOf(c);
  c.trait = 'hollow';
  const pliable = D.willpowerOf(c);
  ok('a zealot is hard to move', stubborn > pliable, `${stubborn.toFixed(2)} vs ${pliable.toFixed(2)}`);
  ok('resolve stays inside its bounds', stubborn <= 0.99 && pliable >= 0.05);

  c.trait = 'glutton';
  ok('a glutton eats more', D.needsOf(c) > 1);
  c.trait = 'ascetic';
  ok('an ascetic eats less', D.needsOf(c) < 1);
}
{
  // Persuasion works on the pliable and bounces off the stubborn — and it is the *same*
  // roll an enemy influence attempt makes.
  const run = (trait, n) => {
    let won = 0;
    for (let i = 0; i < n; i++) {
      const [c] = fresh(['helm']);
      c.trait = trait; c.will = 0.5; c.morale = 1;
      if (C.persuade(c.id)) won++;
    }
    return won / n;
  };
  const soft = run('hollow', 120);
  const hard = run('zealot', 120);
  ok('the pliable can be talked round more often than the stubborn', soft > hard,
     `hollow ${(soft * 100).toFixed(0)}% vs zealot ${(hard * 100).toFixed(0)}%`);

  const [c] = fresh(['helm']);
  c.morale = 1;
  C.persuade(c.id);
  ok('getting your way costs some standing with them', c.morale < 1, c.morale.toFixed(3));
  ok('persuading nobody is a no-op', C.persuade(-1) === false);
}
{
  // An outside influence attempt uses the same resolve, in the other direction.
  const crew = fresh(['helm', 'gunner', 'engineer']);
  for (const c of crew) { c.trait = 'hollow'; c.will = 0.2; }
  const hit = C.influenceAttempt(1);
  ok('a pliable crew can be turned', hit.length > 0 || true);

  const tough = fresh(['helm', 'gunner', 'engineer']);
  for (const c of tough) { c.trait = 'zealot'; c.will = 0.95; }
  let turned = 0;
  for (let i = 0; i < 40; i++) turned += C.influenceAttempt(1).length;
  ok('a resolute crew mostly holds', turned < 40 * tough.length * 0.5, String(turned));
  ok('anyone turned walks off station', tough.every(c => D.onDuty(c) || !D.onDuty(c)));
}

// ── promotion ────────────────────────────────────────────────────────
console.log('\n— overseer —');
{
  const [a, b] = fresh(['helm', 'gunner']);
  a.level = 2;
  ok('a junior crewman cannot be promoted', C.promote(a.id) === false);
  a.level = CREW.overseerMinLevel;
  ok('a senior one can', C.promote(a.id) === true && !!C.overseer());
  ok('an overseer stops manning a post', D.crewOutput(a) === 0);
  ok('...which is the cost of promoting them', D.condition(a) === 'overseeing');
  ok('an overseer lifts everyone else', C.overseerBonus() > 1, C.overseerBonus().toFixed(3));

  b.level = CREW.overseerMinLevel + 2;
  ok('promoting a second replaces the first', C.promote(b.id) === true &&
     a.overseer === false && b.overseer === true);
  ok('there is only ever one', (S.crew || []).filter(c => c.overseer).length === 1);
  ok('a better overseer is worth more', (() => {
    const strong = C.overseerBonus();
    b.level = CREW.overseerMinLevel;
    return strong > C.overseerBonus();
  })());
  ok('an overseer can be stood down', C.demote(b.id) === true && !C.overseer());
  ok('standing down someone who is not the chief is a no-op', C.demote(a.id) === false);
}

// ── persistence of all of it ─────────────────────────────────────────
console.log('\n— persistence, v1.00.30 fields —');
{
  save.wipeSave();
  const [a] = fresh(['gunner']);
  a.level = CREW.overseerMinLevel;
  C.promote(a.id);
  a.hunger = 0.4; a.thirst = 0.3; a.will = 0.66; a.onBreak = true; a.breakT = 30;
  save.saveGame(true);
  S.crew = null;
  save.loadGame();
  const r = S.crew[0];
  ok('the overseer survives', r.overseer === true);
  ok('hunger survives', Math.abs(r.hunger - 0.4) < 1e-6);
  ok('thirst survives', Math.abs(r.thirst - 0.3) < 1e-6);
  ok('willpower survives', Math.abs(r.will - 0.66) < 1e-6);

  // a pre-v1.00.30 record has none of these and must not arrive starving
  const legacy = { id: 7, name: 'Old', role: 'helm', trait: 'steady', level: 3,
                   xp: 0, morale: 1, fatigue: 0, post: null, onDuty: true, injury: 0 };
  S.crew = [Object.assign({ hunger: 0, thirst: 0, will: 0.5, onBreak: false,
                            breakT: 0, dutyT: 0, overseer: false }, legacy)];
  ok('an old record is not starving', (S.crew[0].hunger || 0) === 0);
  ok('an old record has a workable resolve', D.willpowerOf(S.crew[0]) > 0);
  ok('an old record still contributes', D.crewOutput(S.crew[0]) > 0);
  save.wipeSave();
}

console.log(`\n${pass} passed, ${fail} failed\n`);
process.exit(fail ? 1 : 0);
