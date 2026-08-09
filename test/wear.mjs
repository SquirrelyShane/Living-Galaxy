// Module condition — the third and last item deferred out of v1.00.20.
//
// The design constraint this suite exists to hold is stated in `systems/wear.js`: **wear must
// be a consequence of what you did, not a tax on having played.** So the first section below
// is the negative check — a ship that sits there wears nothing — and it matters more than any
// of the arithmetic that follows. A decay rate would pass every other test in this file.
//
// The second property worth naming: a worn module gives less *and* draws more, which feeds
// the overload curve v0.7 already built rather than inventing a second penalty. That is why
// there are checks on `fitPower` as well as on the stat that visibly moved.

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
const W = await imp('systems/wear.js');
const { fitBonuses, budgetLoad, effectivenessOf, drawOf } = await imp('systems/fitting.js');
const { MODULES } = await imp('data/modules.js');
const { WEAR, HEAT } = await imp('core/config.js');
const { snapshot, migrate } = await imp('systems/save.js');
const { SCHEMA } = await imp('core/version.js');

initScene();
seedWorld(20260809);
createSystem();

const fitCore = key => {
  S.fit = S.fit || { weapon: [], utility: [], core: [] };
  S.fit.core[0] = key;
  recalcStats();
};
const fresh = () => {
  S.wear = { weapon: [], utility: [], core: [] };
  S.player.heat = 0;
  S.crew = [];
  S.docked = null;
  recalcStats();
};

console.log('\n— wear is a consequence, not a clock —');
{
  fresh();
  const before = W.conditionAt('core', 0);
  ok('an untouched hardpoint reads yard-fresh', before === 1);

  // The check the whole design rests on. Nothing here advances time deliberately — the point
  // is that there is nothing *to* advance. If a tick is ever added to this system, this is
  // the assertion that should stop it.
  const { promises: fsp } = await import('fs');
  const text = await fsp.readFile(new URL('src/systems/wear.js', ROOT).pathname, 'utf8');
  ok('there is no update tick in the module', !/export function update\w*\(/.test(text));
  ok('and nothing in it is scheduled off the clock', !/S\.time\s*-/.test(text));
}

console.log('\n— each channel wears what it should, and only that —');
{
  fresh();
  S.fit.weapon[0] = S.fit.weapon[0] || null;
  const bay = S.fit.weapon;
  if (!bay[0]) { bay[0] = 'pulse'; recalcStats(); }
  S.fit.utility[0] = 'afterburn';
  S.fit.core[0] = 'warpcoil';
  recalcStats();

  W.wearShot(0);
  ok('a shot wears the barrel that fired it', W.conditionAt('weapon', 0) < 1);
  ok('and not the utility rack', W.conditionAt('utility', 0) === 1);
  ok('and not the core', W.conditionAt('core', 0) === 1);

  fresh();
  S.fit.utility[0] = 'afterburn'; S.fit.core[0] = 'warpcoil'; recalcStats();
  W.wearWarp(10);
  ok('a cruise wears the core', W.conditionAt('core', 0) < 1);
  ok('and leaves utility alone', W.conditionAt('utility', 0) === 1);

  fresh();
  S.fit.utility[0] = 'afterburn'; S.fit.core[0] = 'warpcoil'; recalcStats();
  W.wearMining(10);
  ok('a mining session wears utility', W.conditionAt('utility', 0) < 1);
  ok('and leaves the core alone', W.conditionAt('core', 0) === 1);

  // Structure hits cost more than armour ones. A system where being shot through your
  // plating cost the same as being shot through your hull would make plating a stat rather
  // than a layer.
  fresh(); S.fit.core[0] = 'warpcoil'; recalcStats();
  W.wearHit(20, 0);
  const armorOnly = 1 - W.conditionAt('core', 0);
  fresh(); S.fit.core[0] = 'warpcoil'; recalcStats();
  W.wearHit(0, 20);
  const hullToo = 1 - W.conditionAt('core', 0);
  ok('a structure hit costs more than an armour hit', hullToo > armorOnly,
     `${hullToo.toFixed(4)} vs ${armorOnly.toFixed(4)}`);

  // An empty slot cannot wear out — otherwise a bare hull accumulates condition debt on
  // hardpoints that have never held anything, and fitting a new module inherits it.
  fresh();
  S.fit.core[0] = null; recalcStats();
  W.wearHit(0, 50);
  ok('an empty hardpoint does not wear', W.conditionAt('core', 0) === 1);
}

console.log('\n— heat multiplies it —');
{
  fresh();
  S.fit.weapon[0] = S.fit.weapon[0] || 'pulse'; recalcStats();
  S.player.heat = 0;
  W.wearShot(0);
  const cold = 1 - W.conditionAt('weapon', 0);

  fresh();
  S.fit.weapon[0] = S.fit.weapon[0] || 'pulse'; recalcStats();
  S.player.heat = (S.stats.heatCap || HEAT.capFloor);
  W.wearShot(0);
  const hot = 1 - W.conditionAt('weapon', 0);

  ok('a shot at the cutout costs more than a cold one', hot > cold, `${hot.toFixed(5)} vs ${cold.toFixed(5)}`);
  // This gives the thermal budget a second consequence beyond the tempo one v1.00.60 built.
  ok('and by the configured factor', Math.abs(hot / cold - WEAR.heatMult) < 0.02,
     (hot / cold).toFixed(3));
}

console.log('\n— an engineer on watch slows it —');
{
  const { registerEngineerCheck } = W;
  fresh();
  S.fit.core[0] = 'warpcoil'; recalcStats();
  W.wearWarp(20);
  const unattended = 1 - W.conditionAt('core', 0);

  registerEngineerCheck(() => true);
  fresh();
  S.fit.core[0] = 'warpcoil'; recalcStats();
  W.wearWarp(20);
  const attended = 1 - W.conditionAt('core', 0);
  registerEngineerCheck(() => false);

  ok('an engineer prevents some of it', attended < unattended,
     `${attended.toFixed(5)} vs ${unattended.toFixed(5)}`);
  // Not all of it. A post that made wear stop entirely would delete the mechanic for anybody
  // who has hired one, which is everybody by the second hour.
  ok('but not all of it', attended > 0);
  ok('and by the configured fraction',
     Math.abs((1 - attended / unattended) - WEAR.engineerRelief) < 0.02);
}

console.log('\n— a worn module gives less and draws more —');
{
  fresh();
  fitCore('warpcoil');
  const key = S.fit.core[0];
  const def = MODULES[key];
  ok('the test is fitting a real module', !!def);

  // Only slot 0 is being worn, and the hull seats other core modules beside it. The ratio of
  // *totals* therefore is not the ratio of one module, which is what the first version of
  // this check assumed — it compared a sum against a single-module constant and failed for a
  // reason that had nothing to do with the system. Measure the delta on the slot that moved.
  const one = { core: [] };
  for (let i = 0; i < S.fit.core.length; i++) one.core[i] = 1;
  const worn = { core: one.core.slice() };
  worn.core[0] = 0;

  const freshBonus = fitBonuses(S.fit, one);
  const wornBonus = fitBonuses(S.fit, worn);

  ok('draw rises as condition falls', wornBonus.power > freshBonus.power,
     `${wornBonus.power.toFixed(2)} vs ${freshBonus.power.toFixed(2)}`);
  ok('cpu too', wornBonus.cpu > freshBonus.cpu);
  ok('and by the configured inefficiency on the slot that moved',
     Math.abs((wornBonus.power - freshBonus.power) - def.power * WEAR.drawAtZero) < 0.01,
     `${(wornBonus.power - freshBonus.power).toFixed(3)} vs ${(def.power * WEAR.drawAtZero).toFixed(3)}`);

  // Whichever mod this module actually carries, it should be smaller when worn out. Read off
  // the definition rather than named, so the check does not go stale when the module does.
  const modKey = Object.keys(def.mods || {}).find(k => !S.fit.core.slice(1).some(
    other => MODULES[other] && MODULES[other].mods && MODULES[other].mods[k]));
  if (modKey) {
    // Read off the definition rather than named, so the check does not go stale when the
    // module does — and picked so no *other* fitted core contributes to the same key, or the
    // untouched slots would dilute the difference this is trying to measure.
    ok('its effect is reduced', Math.abs(wornBonus[modKey]) < Math.abs(freshBonus[modKey]),
       `${modKey}: ${wornBonus[modKey]} vs ${freshBonus[modKey]}`);
    ok('but never to nothing — degrade, do not refuse',
       Math.abs(wornBonus[modKey]) >= Math.abs(freshBonus[modKey]) * WEAR.floor - 1e-9);
  }

  ok('effectiveness bottoms out at the floor', Math.abs(effectivenessOf(0) - WEAR.floor) < 1e-9);
  ok('and is 1 when yard-fresh', effectivenessOf(1) === 1);
  // A caller with no condition table at all — a fitting preview, a suite testing arithmetic
  // — gets fresh behaviour, which is the honest default for a ship nobody has flown.
  ok('an absent condition reads as fresh', effectivenessOf(undefined) === 1 && drawOf(null) === 1);

  // The half that matters most: neglect pushes an existing budget toward its own penalty
  // rather than producing a new failure mode the pilot has to learn.
  const loadFresh = budgetLoad(S.fit, S.player.classKey, 0, { core: [1] });
  const loadWorn = budgetLoad(S.fit, S.player.classKey, 0, { core: [0] });
  ok('a worn fit sits closer to its power ceiling', loadWorn.powerRatio > loadFresh.powerRatio);
}

console.log('\n— servicing —');
{
  fresh();
  fitCore('warpcoil');
  S.wear.core[0] = 0.5;
  S.credits = 500000;

  // A station job. You cannot pull a core apart under way, and the refusal has to be the
  // reason rather than silence.
  S.docked = null;
  ok('cannot be serviced under way', W.serviceModule('core', 0) === false);
  ok('and nothing was charged', S.credits === 500000);

  S.docked = S.world.stations[0];
  const cost = W.serviceCost('core', 0);
  ok('a worn module quotes a price', cost > 0);
  ok('and it is at least the floor', cost >= WEAR.serviceMin);

  const half = W.serviceCost('core', 0);
  S.wear.core[0] = 0.9;
  ok('a barely-used module costs less', W.serviceCost('core', 0) <= half);
  ok('and a fresh one costs nothing', (S.wear.core[0] = 1, W.serviceCost('core', 0) === 0));

  S.wear.core[0] = 0.3;
  const before = S.credits, quoted = W.serviceCost('core', 0);
  ok('servicing succeeds at a berth', W.serviceModule('core', 0) === true);
  ok('it restores the module', W.conditionAt('core', 0) === 1);
  ok('and charges what it quoted', before - S.credits === quoted);

  // Broke is a refusal, not a free repair or a negative balance.
  S.wear.core[0] = 0.1;
  S.credits = 1;
  ok('an unaffordable service is refused', W.serviceModule('core', 0) === false);
  ok('the module is still worn', W.conditionAt('core', 0) < 1);
  ok('and the balance is untouched', S.credits === 1);

  S.credits = 500000;
  const q = W.serviceQuote();
  ok('the quote counts what is out of tolerance', q.count >= 1 && q.cost > 0);
  ok('service-all clears the lot', W.serviceAll() === true && W.conditionAt('core', 0) === 1);
  ok('and then finds nothing to do', W.serviceAll() === false);
  ok('with an empty quote', W.serviceQuote().count === 0);
}

console.log('\n— the worst thing fitted, for the readouts —');
{
  fresh();
  fitCore('warpcoil');
  S.wear.core[0] = 0.2;
  const worst = W.worstFitted();
  ok('worstFitted finds it', worst && worst.kind === 'core' && worst.index === 0);
  ok('and reports its condition', Math.abs(worst.condition - 0.2) < 1e-9);

  S.fit = { weapon: [], utility: [], core: [] };
  recalcStats();
  ok('a bare hull has no worst module', W.worstFitted() === null);
}

console.log('\n— persistence —');
{
  fresh();
  fitCore('warpcoil');
  S.wear.core[0] = 0.42;
  const snap = snapshot();
  ok('the snapshot carries condition', snap.wear && snap.wear.core[0] > 0);
  ok('rounded, not to fourteen places', String(snap.wear.core[0]).length <= 5);
  ok('and the schema moved for it', snap.v === SCHEMA && SCHEMA === 16);

  W.restoreWear(snap.wear);
  ok('it round-trips', Math.abs(W.conditionAt('core', 0) - 0.42) < 0.002);

  // Junk is clamped rather than trusted. A hand-edited save should not be able to hand
  // somebody a module at 900% output.
  W.restoreWear({ core: [7, -3, 'x'], utility: null, weapon: [0.5] });
  ok('an out-of-range value is clamped high', W.conditionAt('core', 0) === 1);
  ok('and low', W.conditionAt('core', 1) === 0);
  ok('a non-number reads as fresh', W.conditionAt('core', 2) === 1);
  ok('a missing arm restores empty', Array.isArray(S.wear.utility));

  // A v15 save arrives yard-fresh. Unlike v14 → v15, this migration takes nothing away: a
  // pilot cannot be billed for wear the build that wrote their save had no way to accrue.
  const old = Object.assign(snapshot(), { v: 15 });
  delete old.wear;
  const up = migrate(old);
  ok('a v15 save migrates forward', up && up.v === SCHEMA);
  ok('and arrives with everything fresh',
     up.wear && (up.wear.core || []).every(v => v === 1 || v === undefined));
}

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
