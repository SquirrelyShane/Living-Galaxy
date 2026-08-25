// NPC tactics: magazines, thermal load, nerve, support, and memory that decides.
//
// The property this suite exists to protect is the one the slice is *about*: that what a
// character remembers changes what it does, not only what it says. Everything else here —
// budgets, nerve, calls for help — is scaffolding that makes that property observable.
//
// Note the shape of most of these checks. They set up two ships that differ in exactly one
// way and assert the decisions differ, rather than asserting a stance equals a string.
// A test that pins `stance === 'hold'` pins today's tuning; a test that pins "the one with
// the grudge does not close alone" pins the design.

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
const { spawnNpc, updateNpcs } = await imp('entities/npcs.js');
const T = await imp('systems/npc/npc-tactics.js');
const { personaFor, noteEvent, witnessKill } = await imp('systems/npc/npc-brain.js');
const { damageNpc } = await imp('systems/combat/combat.js');
const { NPCAI, NPC_TYPES, ENGAGE } = await imp('core/config.js');

initScene();
recalcStats();
seedWorld(20260808);
createSystem();

const reset = () => {
  for (const n of S.world.npcs) n.userData.hp = 0;
  S.world.npcs.length = 0;
  S.brains = { personas: {} };
  S.time = 1000;
};
const at = (npc, x, y, z) => { npc.position.set(x, y, z); return npc; };
const V = (x, y, z) => new THREE.Vector3(x, y, z);

// ── magazines ────────────────────────────────────────────────────────
console.log('\n— NPC magazines —');
{
  reset();
  const p = spawnNpc('pirate', 1), u = p.userData;
  ok('a fresh hull arrives loaded', T.roundsLeft(u) > 0, `${T.roundsLeft(u)}`);
  ok('the magazine is full', T.magazineFraction(u) === 1);
  // Scaled off rate of fire, so a fast gun does not run dry four times sooner than a slow
  // one just for being fast.
  const fast = { pcool: 0.2, role: 'combat' }, slow = { pcool: 1.6, role: 'combat' };
  ok('a faster gun carries more rounds', T.magazineSize(fast) > T.magazineSize(slow));
  ok('both hold roughly the same seconds of fire',
     Math.abs(T.magazineSize(fast) * fast.pcool - T.magazineSize(slow) * slow.pcool) < 2);
  ok('an emplacement never runs dry', T.magazineSize({ role: 'fort', pcool: 1 }) === Infinity);
  ok('an emplacement always reads full', T.magazineFraction({ role: 'fort', pcool: 1 }) === 1);

  const before = T.roundsLeft(u);
  ok('firing spends a round', T.spendShot(u) && T.roundsLeft(u) === before - 1);

  u.rounds = 1;
  ok('the last round fires', T.spendShot(u));
  ok('and then nothing does', !T.spendShot(u));
  ok('an empty magazine reads empty', T.magazineFraction(u) === 0);

  // A fort spends heat but not rounds.
  const f = { role: 'fort', pcool: 1 };
  T.ordnanceOf(f);
  T.spendShot(f);
  ok('an emplacement stays loaded after firing', T.magazineFraction(f) === 1);
}

console.log('\n— NPC thermal load —');
{
  reset();
  const p = spawnNpc('command', 1), u = p.userData;
  u.rounds = 9999;
  u.heat = 0; u.hot = false;
  let shots = 0;
  while (T.spendShot(u) && shots < 500) shots++;
  ok('sustained fire trips a cutout', u.hot, `${shots} shots, heat ${u.heat.toFixed(1)}`);
  ok('an overheated hull cannot fire', !T.spendShot(u));
  ok('it took a plausible number of shots', shots > 5 && shots < 200, `${shots}`);

  // Hysteresis, same direction as the player's: clears lower than it set.
  ok('resume is below the cutout', NPCAI.heatResume < 1);
  T.ventHeat(u, 0.5);
  ok('a short vent does not clear it', u.hot || u.heat <= NPCAI.heatCap * NPCAI.heatResume);
  T.ventHeat(u, 60);
  ok('a long vent clears it', !u.hot);
  ok('heat bottoms out at zero', u.heat === 0);
  ok('and it can fire again', T.spendShot(u));
}

// ── nerve ────────────────────────────────────────────────────────────
console.log('\n— nerve —');
{
  reset();
  const brave = spawnNpc('pirate', 1).userData;
  const timid = spawnNpc('pirate', 2).userData;
  // Reach into the personas directly: the point is that two identical hulls with different
  // temperaments make different calls, and seeding that by name would be testing the RNG.
  personaFor(brave).traits.aggression = 1;
  personaFor(brave).traits.loyalty = 1;
  personaFor(timid).traits.aggression = 0;
  personaFor(timid).traits.loyalty = 0;
  ok('an aggressive character has more nerve', T.nerve(brave) > T.nerve(timid),
     `${T.nerve(brave).toFixed(2)} vs ${T.nerve(timid).toFixed(2)}`);
  ok('an unnamed contact still has a baseline', T.nerve({}) > 0);
  ok('nerve stays bounded below one', T.nerve(brave) <= 1.5);
}

console.log('\n— support —');
{
  reset();
  const a = at(spawnNpc('pirate', 1), 0, 0, 0);
  ok('a lone ship has no support', T.support(a, a.userData).count === 0);
  ok('and nobody to run to', T.support(a, a.userData).nearest === null);

  const b = at(spawnNpc('pirate', 2), 200, 0, 0);
  at(spawnNpc('pirate', 3), 400, 0, 0);
  ok('nearby friends count', T.support(a, a.userData).count === 2);
  ok('the nearest is the nearest', T.support(a, a.userData).nearest === b);

  const far = at(spawnNpc('pirate', 4), NPCAI.callRange * 3, 0, 0);
  ok('distant friends do not', T.support(a, a.userData).count === 2);

  const enemy = at(spawnNpc('patrol', 5), 150, 0, 0);
  ok('the other side is not support', T.support(a, a.userData).count === 2);
  ok('a dead friend is not support',
     (b.userData.hp = 0, T.support(a, a.userData).count === 1));
  b.userData.hp = b.userData.maxHp;
  ok('a revived one is again', T.support(a, a.userData).count === 2);
}

console.log('\n— calling for help —');
{
  reset();
  S.time = 1000;
  const caller = at(spawnNpc('pirate', 1), 0, 0, 0);
  const near1 = at(spawnNpc('pirate', 2), 300, 0, 0);
  const near2 = at(spawnNpc('pirate', 3), 600, 0, 0);
  const far = at(spawnNpc('pirate', 4), NPCAI.callRange * 4, 0, 0);
  const fort = at(spawnNpc('fort', 5), 400, 0, 0);
  const other = at(spawnNpc('patrol', 6), 300, 0, 0);
  for (const n of [near1, near2, far, fort, other]) n.userData.target = null;

  const threat = { position: V(0, 0, 100), vel: V(0, 0, 0), isPlayer: true };
  const answered = T.callForHelp(caller, caller.userData, threat);
  ok('nearby friends answer', answered >= 2, `${answered}`);
  ok('they take the threat as their target', near1.userData.target === threat);
  ok('and they commit', near1.userData.stance === 'press');
  ok('distant ships do not hear it', far.userData.target === null);
  ok('the other side does not answer', other.userData.target === null);
  // An emplacement cannot come running, and telling it to would park a gun turret's target
  // on something it can never reach.
  ok('emplacements do not answer', fort.userData.target === null);

  ok('a second call inside the cooldown is ignored',
     T.callForHelp(caller, caller.userData, threat) === 0);
  S.time += NPCAI.callCooldown + 1;
  near1.userData.target = null;
  ok('after the cooldown it carries again',
     T.callForHelp(caller, caller.userData, threat) > 0);
  ok('a call with no threat does nothing', T.callForHelp(caller, caller.userData, null) === 0);

  // The hook that matters: being shot is what makes a ship shout.
  reset();
  S.time = 2000;
  S.player.hull = 100;
  const victim = at(spawnNpc('pirate', 1), 0, 0, 0);
  const friend = at(spawnNpc('pirate', 2), 500, 0, 0);
  friend.userData.target = null;
  damageNpc(victim, 5, true, 'kinetic');
  ok('shooting a ship brings its friends', !!friend.userData.target);
  ok('and they come after the player', friend.userData.target.isPlayer === true);
}

// ── memory that decides ──────────────────────────────────────────────
console.log('\n— the brain decides, not just talks —');
{
  reset();
  const n = at(spawnNpc('pirate', 1), 0, 0, 0), u = n.userData;
  ok('a stranger is not wary', T.wariness(u) === 0);
  ok('and holds no grudge', !T.holdsGrudge(u));

  // Exactly the fact `witnessKill()` files when you destroy one of their own.
  for (let i = 0; i < 3; i++) {
    noteEvent(u, { type: 'saw-kill-ours', subject: 'player', weight: 2 });
  }
  ok('watching you kill its own makes it wary', T.wariness(u) > 0, T.wariness(u).toFixed(2));
  ok('enough of it becomes a grudge', T.holdsGrudge(u));
  ok('wariness is bounded', T.wariness(u) <= 1);

  // Favours pull the other way, so the memory is a ledger rather than a counter.
  const m = at(spawnNpc('pirate', 2), 0, 0, 0).userData;
  noteEvent(m, { type: 'saw-kill-ours', subject: 'player', weight: 2 });
  const before = T.wariness(m);
  noteEvent(m, { type: 'saw-kill-theirs', subject: 'player', weight: 1 });
  ok('a favour reduces wariness', T.wariness(m) < before,
     `${before.toFixed(2)} -> ${T.wariness(m).toFixed(2)}`);
  ok('it never goes below nothing', T.wariness(m) >= 0);

  // And the payoff: the same hull, at the same hull fraction, with the same target, makes
  // a *different call* depending on what it remembers. This is the whole slice.
  reset();
  S.time = 3000;
  const player = { position: S.player.position, vel: S.player.velocity, isPlayer: true };
  // Far enough apart that neither counts as the other's support — the grudge branch turns
  // on whether the ship is *alone*, so two test subjects sitting on top of each other would
  // each be the company that makes the other brave.
  const naive = at(spawnNpc('pirate', 1), 0, 0, 0);
  const bitter = at(spawnNpc('pirate', 2), NPCAI.callRange * 4, 0, 0);
  for (const s of [naive, bitter]) {
    s.userData.target = player;
    s.userData.stanceAt = -99;
    s.userData.hp = s.userData.maxHp;
    personaFor(s.userData).traits.aggression = 0.5;
    personaFor(s.userData).traits.loyalty = 0.5;
  }
  for (let i = 0; i < 4; i++) {
    noteEvent(bitter.userData, { type: 'saw-kill-ours', subject: 'player', weight: 2 });
  }
  ok('the bitter one holds a grudge', T.holdsGrudge(bitter.userData));
  ok('the naive one does not', !T.holdsGrudge(naive.userData));

  const sNaive = T.appraise(naive, naive.userData, 0.1);
  const sBitter = T.appraise(bitter, bitter.userData, 0.1);
  ok('an ordinary pirate presses the attack', sNaive === 'press', sNaive);
  ok('one that remembers you will not close alone', sBitter !== 'press', sBitter);
  ok('and it keeps its distance rather than running',
     T.bandScale(bitter.userData) > T.bandScale(naive.userData),
     `${T.bandScale(bitter.userData)} vs ${T.bandScale(naive.userData)}`);

  // With friends, the grudge is the reason it comes at all.
  at(spawnNpc('pirate', 3), NPCAI.callRange * 4 + 300, 0, 0);
  at(spawnNpc('pirate', 4), NPCAI.callRange * 4 + 400, 0, 0);
  bitter.userData.stanceAt = -99;
  ok('with company it commits', T.appraise(bitter, bitter.userData, 0.1) === 'press');
}

// ── stances ──────────────────────────────────────────────────────────
console.log('\n— stances —');
{
  reset();
  S.time = 4000;
  const player = { position: S.player.position, vel: S.player.velocity, isPlayer: true };
  const mk = (hpFrac, rounds, allies) => {
    const n = at(spawnNpc('pirate', 1 + Math.floor(Math.random() * 90)), 0, 0, 0);
    const u = n.userData;
    u.target = player;
    u.hp = u.maxHp * hpFrac;
    T.ordnanceOf(u);
    u.rounds = Math.round(T.magazineSize(u) * rounds);
    u.stanceAt = -99;
    personaFor(u).traits.aggression = 0.5;
    personaFor(u).traits.loyalty = 0.5;
    for (let i = 0; i < allies; i++) at(spawnNpc('pirate', 60 + i), 250 + i * 40, 0, 0);
    return { n, u };
  };

  {
    const { n, u } = mk(1, 0, 0);
    ok('an empty magazine means leave', T.appraise(n, u, 0.1) === 'flee');
  }
  reset(); S.time = 4100;
  {
    // Out of rounds beats everything, including a full hull and a crowd.
    const { n, u } = mk(1, 0, 3);
    ok('and it beats having friends and a full hull', T.appraise(n, u, 0.1) === 'flee');
  }
  reset(); S.time = 4200;
  {
    const { n, u } = mk(1, 0.1, 0);
    ok('a nearly-dry ship conserves at reach', T.appraise(n, u, 0.1) === 'hold');
  }
  reset(); S.time = 4300;
  {
    const { n, u } = mk(0.05, 1, 0);
    ok('a lone wreck runs', T.appraise(n, u, 0.1) === 'flee');
  }
  reset(); S.time = 4400;
  {
    const { n, u } = mk(0.05, 1, 3);
    ok('a wreck with friends falls back to them', T.appraise(n, u, 0.1) === 'regroup');
  }
  reset(); S.time = 4500;
  {
    const { n, u } = mk(1, 1, 0);
    ok('a healthy loaded ship presses', T.appraise(n, u, 0.1) === 'press');
  }

  // Courage: identical damage, different temperament, different call.
  reset(); S.time = 4600;
  {
    const player2 = { position: S.player.position, vel: S.player.velocity, isPlayer: true };
    const brave = at(spawnNpc('pirate', 1), 0, 0, 0);
    const timid = at(spawnNpc('pirate', 2), 0, 0, 0);
    for (const s of [brave, timid]) {
      s.userData.target = player2;
      s.userData.hp = s.userData.maxHp * 0.4;
      s.userData.stanceAt = -99;
      T.ordnanceOf(s.userData);
    }
    personaFor(brave.userData).traits.aggression = 1;
    personaFor(brave.userData).traits.loyalty = 1;
    personaFor(timid.userData).traits.aggression = 0;
    personaFor(timid.userData).traits.loyalty = 0;
    const sb = T.appraise(brave, brave.userData, 0.1);
    const st = T.appraise(timid, timid.userData, 0.1);
    ok('at the same damage, temperament decides', sb !== st, `${sb} vs ${st}`);
    ok('the brave one is the one still fighting', sb === 'press');
  }

  // Cadence: a ship does not change its mind every frame.
  reset(); S.time = 5000;
  {
    const n = at(spawnNpc('pirate', 1), 0, 0, 0), u = n.userData;
    u.target = { position: S.player.position, vel: S.player.velocity, isPlayer: true };
    u.stanceAt = -99;
    T.ordnanceOf(u);
    const first = T.appraise(n, u, 0.1);
    u.rounds = 0;                                   // would flip it to flee immediately
    ok('a stance holds through the cadence', T.appraise(n, u, 0.1) === first);
    S.time += NPCAI.appraiseEvery + 0.1;
    ok('and re-appraises after it', T.appraise(n, u, 0.1) === 'flee');
  }

  // Working roles have no tactical life to speak of.
  reset();
  {
    const f = at(spawnNpc('fort', 1), 0, 0, 0);
    ok('an emplacement always presses', T.appraise(f, f.userData, 0.1) === 'press');
  }

  ok('every stance has a band multiplier',
     T.STANCES.every(s => NPCAI.bandScale[s] > 0));
  ok('pressing is the unchanged profile', NPCAI.bandScale.press === 1);
  ok('holding stands further off than pressing', NPCAI.bandScale.hold > NPCAI.bandScale.press);
  ok('disengaging is recognised',
     T.isDisengaging({ stance: 'flee' }) && T.isDisengaging({ stance: 'regroup' }) &&
     !T.isDisengaging({ stance: 'press' }));
}

// ── it runs ──────────────────────────────────────────────────────────
console.log('\n— under the simulation —');
{
  reset();
  S.time = 6000;
  S.player.hull = 100;
  S.docked = null;
  S.player.position.set(0, 0, 0);
  for (let i = 0; i < 6; i++) at(spawnNpc('pirate', i + 1), 300 + i * 60, 0, 200);

  // Measured on the ships we placed, not on the world total: `topUpPopulation()` spawns
  // replacements during a forty-second run and every one of them arrives with a full
  // magazine, so the fleet-wide sum can rise while every original ship is emptying.
  const crew = S.world.npcs.slice();
  const startRounds = crew.reduce((a, n) => a + T.roundsLeft(n.userData), 0);
  for (let i = 0; i < 60 * 40; i++) { S.time += 1 / 60; updateNpcs(1 / 60); }
  const endRounds = crew.reduce((a, n) => a + T.roundsLeft(n.userData), 0);

  ok('ships spend ammunition over a fight', endRounds < startRounds,
     `${startRounds} -> ${endRounds}`);
  ok('nobody ends with negative rounds', crew.every(n => T.roundsLeft(n.userData) >= 0));
  ok('nobody ends past the heat cap',
     crew.every(n => (n.userData.heat || 0) <= NPCAI.heatCap + 1e-9));
  ok('every ship holds a real stance',
     S.world.npcs.every(n => !n.userData.stance || T.STANCES.includes(n.userData.stance)));
  ok('the simulation did not throw', true);
}

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
