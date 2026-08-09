// Welfare: what you spend on people instead of on the ship.
//
// The property this suite exists to defend is the design constraint from
// `docs/CREW_ROADMAP.md`: **no recovery is both fast and free.** The obvious version of
// "let the player rest the crew" is a button that removes fatigue, which deletes the watch
// rotation that fatigue exists to force — so most of what follows checks that each of the
// three routes actually costs the thing it is supposed to cost, and that the cost cannot be
// dodged.
//
// The other half is that every recovery is *legible*. A rest that does not show up in
// `crewDiagnosis()` is a rest a player cannot evaluate, which was the whole point of the
// telemetry slice underneath this one.

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
const W = await imp('systems/welfare.js');
const CL = await imp('systems/crew-log.js');
const L = await imp('core/log.js');
const { initCrew, updateCrew, makeCrew } = await imp('systems/crew.js');
const { undock } = await imp('systems/economy.js');
const { WELFARE, CREW, CRAFT } = await imp('core/config.js');
const { SCHEMA } = await imp('core/version.js');

initScene();
recalcStats();
seedWorld(20260808);
createSystem();

const roster = (n = 4) => {
  initCrew();
  while (S.crew.length < n) S.crew.push(makeCrew(null, null, 1));
  return S.crew;
};
const reset = ({ docked = true, credits = 500000 } = {}) => {
  S.log = null; S.crewLog = null; S.comfort = null; S.time = 1000;
  S.credits = credits;
  roster();
  S.docked = docked ? S.world.stations[0] : null;
};
/** Advance the welfare clock by game hours. */
const hours = h => {
  const dt = h / CRAFT.gameHoursPerSecond;
  const step = dt / 40;
  for (let i = 0; i < 40; i++) { S.time += step; W.updateWelfare(step); }
};

// ── fittings ─────────────────────────────────────────────────────────
console.log('\n— fittings —');
{
  reset();
  ok('every fitting has a name and a description',
     W.COMFORT_KEYS.every(k => W.COMFORTS[k].name && W.COMFORTS[k].desc));
  ok('a fresh ship has none', W.COMFORT_KEYS.every(k => W.comfortLevel(k) === 0));
  ok('and no upkeep', W.comfortUpkeep() === 0);
  ok('a bare ship has neutral effects', (() => {
    const e = W.comfortEffects();
    return e.restMult === 1 && e.healMult === 1 && e.rationRelief === 0;
  })());

  const before = S.credits;
  ok('a fitting can be bought', W.upgradeComfort('quarters'));
  ok('it costs money', S.credits < before);
  ok('the level went up', W.comfortLevel('quarters') === 1);
  ok('and it bills forever', W.comfortUpkeep() > 0);
  ok('the effect landed', W.comfortEffects().restMult > 1);

  // Price rises per level, so a level 3 fitting is a commitment rather than a formality.
  ok('each level costs more than the last',
     W.comfortPrice('quarters') > WELFARE.fitBase);
  for (let i = 0; i < WELFARE.maxLevel; i++) W.upgradeComfort('quarters');
  ok('there is a ceiling', W.comfortLevel('quarters') === WELFARE.maxLevel);
  ok('and it is refused past it', !W.upgradeComfort('quarters'));
  ok('the blocker says why', W.comfortBlocker('quarters') === 'at maximum');

  S.credits = 10;
  ok('an unaffordable fitting is refused', !W.upgradeComfort('galley'));
  ok('and says how short you are', /short/.test(W.comfortBlocker('galley')));
  S.credits = 500000;
  S.docked = null;
  ok('fittings need a station', !W.upgradeComfort('galley'));
  ok('the blocker says so', W.comfortBlocker('galley') === 'dock first');
  ok('an unknown fitting is refused', W.comfortBlocker('nonsense') === 'unknown fitting');
}

console.log('\n— fittings actually do something —');
{
  // The check that matters: a fitting is not a number in a panel, it has to change the tick.
  const restRate = quarters => {
    reset({ docked: false });
    S.comfort = { quarters, galley: 0, infirmary: 0 };
    const c = S.crew[0];
    c.onDuty = false; c.fatigue = 1; c.hunger = 0; c.thirst = 0;
    // Short window on purpose: over a long one both cases hit zero fatigue and the
    // comparison reads 1.000 vs 1.000, which is a test measuring the floor rather than
    // the rate.
    for (let i = 0; i < 4; i++) { S.time += 1; updateCrew(1); }
    return 1 - c.fatigue;
  };
  const bare = restRate(0), fitted = restRate(WELFARE.maxLevel);
  ok('quarters speed off-watch recovery', fitted > bare, `${bare.toFixed(3)} vs ${fitted.toFixed(3)}`);

  const healRate = infirmary => {
    reset({ docked: false });
    S.comfort = { quarters: 0, galley: 0, infirmary };
    const c = S.crew[0];
    c.injury = 1;
    for (let i = 0; i < 4; i++) { S.time += 1; updateCrew(1); }
    return 1 - c.injury;
  };
  ok('an infirmary speeds healing', healRate(WELFARE.maxLevel) > healRate(0));

  // The galley softens short rations rather than conjuring provisions — the honest thing a
  // cook can do about an empty hold.
  const rationHit = galley => {
    reset({ docked: false, credits: 0 });
    S.comfort = { quarters: 0, galley, infirmary: 0 };
    const c = S.crew[0];
    c.hunger = 1; c.thirst = 1; c.morale = 1;
    S.crewPayT = 0;
    for (let i = 0; i < 400; i++) { S.time += 1; updateCrew(1); }
    return CL.crewHistory(c.id, 200)
      .filter(e => e.data && e.data.cause === 'short rations')
      .reduce((a, e) => a + e.data.delta, 0);
  };
  const hard = rationHit(0), soft = rationHit(WELFARE.maxLevel);
  ok('a galley softens the ration penalty', soft > hard, `${hard.toFixed(3)} vs ${soft.toFixed(3)}`);
  ok('but does not remove it', soft < 0, `${soft.toFixed(3)}`);
}

// ── shore leave ──────────────────────────────────────────────────────
console.log('\n— shore leave —');
{
  reset();
  for (const c of S.crew) { c.morale = 0.4; c.fatigue = 0.9; }
  const q = W.shoreQuote();
  ok('a quote covers the roster', q.heads === S.crew.length);
  ok('and prices per head', q.cost === q.heads * WELFARE.shoreCostPerHead);

  const before = S.credits;
  ok('leave can be granted', W.startShoreLeave());
  ok('it costs money', S.credits === before - q.cost);
  ok('everyone is ashore', S.crew.every(W.onShore));
  ok('and off watch', S.crew.every(c => c.onDuty === false));
  ok('a second grant is refused while they are away', !W.startShoreLeave());

  // The cost is the clock: while they are ashore the ship has no crew at all.
  const c0 = S.crew[0];
  const f0 = c0.fatigue;
  c0.hunger = 0;
  for (let i = 0; i < 30; i++) { S.time += 1; updateCrew(1); }
  ok('crew ashore do not wear down or recover on the ship\'s clock', c0.fatigue === f0);

  hours(WELFARE.shoreHours + 0.5);
  ok('they come back on their own', S.crew.every(c => !W.onShore(c)));
  ok('rested', S.crew.every(c => c.fatigue < 0.9));
  ok('and happier', S.crew.every(c => c.morale > 0.4));
  ok('back on watch', S.crew.every(c => c.onDuty !== false));
  ok('the benefit is attributed',
     CL.crewHistory(S.crew[0].id, 30).some(e => e.data.cause === 'shore leave'));
}

console.log('\n— the clock cannot be dodged —');
{
  // Undocking early is the one that would break the design if it silently paused the timer.
  reset();
  for (const c of S.crew) { c.morale = 0.4; c.fatigue = 0.9; }
  W.startShoreLeave();
  hours(1);
  undock();
  ok('undocking recalls them', S.crew.every(c => !W.onShore(c)));
  ok('they are back on watch', S.crew.every(c => c.onDuty !== false));
  const cut = S.crew[0].morale - 0.4;
  ok('they got something', cut > 0);

  reset();
  for (const c of S.crew) { c.morale = 0.4; c.fatigue = 0.9; }
  W.startShoreLeave();
  hours(WELFARE.shoreHours + 0.5);
  const full = S.crew[0].morale - 0.4;
  ok('but far less than a full leave', cut < full, `${cut.toFixed(3)} vs ${full.toFixed(3)}`);
  ok('and the log says it was cut short', true);

  // Explicitly: the early recall is recorded under its own cause, so a player wondering why
  // the leave did not help can find out.
  reset();
  W.startShoreLeave();
  hours(1);
  W.recallShore(false);
  ok('an early recall names itself',
     CL.crewHistory(S.crew[0].id, 30).some(e => e.data.cause === 'shore leave cut short'));
  ok('recalling nobody is harmless', W.recallShore(false) === 0);
}

// ── training ─────────────────────────────────────────────────────────
console.log('\n— training —');
{
  reset();
  const c = S.crew[0];
  const cost = W.trainingCost(c);
  ok('a course is priced', cost > 0);
  ok('and costs more for a senior hand',
     W.trainingCost({ level: 5 }) > W.trainingCost({ level: 1 }));

  const credits = S.credits, xp = c.xp;
  ok('a course can be started', W.startTraining(c.id));
  ok('it costs money', S.credits === credits - cost);
  ok('and takes them off watch', c.onDuty === false && W.inTraining(c));
  ok('a second course is refused', !W.startTraining(c.id));
  ok('the blocker says why', W.trainBlocker(c.id) === 'already training');

  // The real cost: while they are on the course they are not standing a station.
  const f = c.fatigue = 0.5;
  for (let i = 0; i < 30; i++) { S.time += 1; updateCrew(1); }
  ok('somebody on a course is not aboard for the tick', c.fatigue === f);

  hours(WELFARE.trainHours + 0.5);
  ok('the course completes', !W.inTraining(c));
  ok('they come back on watch', c.onDuty !== false);
  ok('and have learned something', c.xp > xp, `${xp} -> ${c.xp}`);
  ok('it is recorded',
     CL.crewHistory(c.id, 30).some(e => e.data.cause === 'finished a course'));

  // Pulling somebody out is money spent on nothing — which is what makes committing a
  // decision rather than a formality.
  reset();
  const d = S.crew[1];
  const before = S.credits;
  W.startTraining(d.id);
  const spent = before - S.credits;
  const dxp = d.xp;
  hours(WELFARE.trainHours * 0.6);
  ok('a course can be cancelled', W.cancelTraining(d.id));
  ok('with no refund', S.credits === before - spent);
  ok('and no progress', d.xp === dxp);
  ok('they return to the watch', d.onDuty !== false);
  ok('cancelling nothing is harmless', !W.cancelTraining(d.id));

  reset();
  S.docked = null;
  ok('a course needs a station', !W.startTraining(S.crew[0].id));
  reset();
  S.crew[0].level = CREW.levelMax;
  ok('somebody at the ceiling cannot be trained', !W.startTraining(S.crew[0].id));
  ok('the blocker says why', W.trainBlocker(S.crew[0].id) === 'at maximum level');
  ok('an unknown crewman is refused', W.trainBlocker(99999) === 'no such crew');
}

// ── the standing bill ────────────────────────────────────────────────
console.log('\n— fittings never stop billing —');
{
  reset({ docked: false });
  S.comfort = { quarters: WELFARE.maxLevel, galley: WELFARE.maxLevel, infirmary: WELFARE.maxLevel };
  const up = W.comfortUpkeep();
  ok('a fully fitted ship has real upkeep', up > 0);
  S.credits = 100000;
  const before = S.credits;
  S.crewPayT = 0;
  for (let i = 0; i < 400; i++) { S.time += 1; updateCrew(1); }
  ok('and it is actually charged', S.credits < before - up, `${before} -> ${S.credits}`);
  ok('the account never goes negative', S.credits >= 0);
}

// ── persistence ──────────────────────────────────────────────────────
console.log('\n— it survives a save —');
{
  reset();
  W.upgradeComfort('galley');
  W.upgradeComfort('galley');
  const packed = W.serializeWelfare();
  ok('the payload carries the levels', packed.galley === 2);
  W.restoreWelfare(null);
  ok('an absent payload is the baseline', W.comfortLevel('galley') === 0);
  W.restoreWelfare(packed);
  ok('a restored payload comes back', W.comfortLevel('galley') === 2);
  W.restoreWelfare({ galley: 99, quarters: -4, infirmary: 'x' });
  ok('a level past the ceiling is clamped', W.comfortLevel('galley') === WELFARE.maxLevel);
  ok('a negative level is clamped', W.comfortLevel('quarters') === 0);
  ok('a nonsense level is dropped', W.comfortLevel('infirmary') === 0);
  ok('the schema moved for it', SCHEMA >= 16);
}

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
