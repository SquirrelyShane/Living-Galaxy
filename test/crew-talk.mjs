// Slice — the ship talking to itself.
//
// Two very different things are asserted here and they need different kinds of test.
//
// **The corpus** is data, so it is checked structurally: every situation has lines, every
// post key is a post that exists, every trait key is a trait that exists, no exchange names
// a department the game does not have. A line filed under `gunnerr` is a line nobody ever
// says, and nothing at runtime would ever tell you — the pool would just be one shorter.
//
// **The driver** is a rate limiter, and rate limiters are only ever tested by trying to
// beat them. So the assertions are about restraint again: it does not talk during the boot
// window, it does not talk twice inside the floor, it does not let one person monologue,
// and it drops a punchline when somebody starts shooting.

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
const { createSystem, updateSystem } = await imp('world/system.js');
const { createAsteroids } = await imp('world/asteroids.js');
const { initPlayerFx } = await imp('entities/player.js');
const { createNpcs } = await imp('entities/npcs.js');
const { initProjectiles } = await imp('systems/combat/projectiles.js');
const { initCombat } = await imp('systems/combat/combat.js');
const { initMining } = await imp('systems/industry/mining.js');
const { initWorldSim } = await imp('systems/platform/worldsim.js');
const { initMarket } = await imp('systems/trade/market.js');
const { initContracts } = await imp('systems/trade/contracts.js');
const { resetReputation } = await imp('systems/company/reputation.js');
const { createCharacter } = await imp('systems/crew/character.js');
const { initCommsSystem, commsLog } = await imp('systems/npc/comms.js');
const { makeCrew } = await imp('systems/crew/crew.js');
const { ROLE_KEYS, TRAIT_KEYS } = await imp('data/crew.js');

const D = await imp('data/crew-dialogue.js');
const T = await imp('systems/crew/crew-talk.js');
const N = await imp('systems/crew/crew-note.js');
const H = await imp('systems/industry/habitat.js');
const { resetSweep } = await imp('systems/npc/sweep.js');
const { addMaterial } = await imp('systems/industry/crafting.js');
const { CREW_TALK } = await imp('core/config.js');

/* A ship with crew aboard and nothing in the galley is *correctly* in the `hungry`
   situation, which is a different test from the ones below. Every driver block starts from
   a fed crew so that what it asserts is the thing it is named after. */
const stocked = () => addMaterial('BIO-008', 400);

initScene(); recalcStats(); seedWorld(24601); createSystem(); createAsteroids();
initProjectiles(); initCombat(); initMining(); initPlayerFx(); createNpcs();
resetReputation(); initWorldSim(); initMarket(); initContracts(); initCommsSystem();
createCharacter({ name: 'Vane', lineage: 'rim', corp: 'kestrel', career: 'prospector' });
updateSystem(1);
S.running = true;
S.credits = 40000;

// ── the corpus ───────────────────────────────────────────────────────
console.log('\n— what there is to say —');
{
  ok('every situation in the order has lines',
    D.SITUATION_ORDER.every(k => D.LINES[k]),
    D.SITUATION_ORDER.filter(k => !D.LINES[k]).join(', '));
  ok('every situation with lines is in the order',
    Object.keys(D.LINES).every(k => D.SITUATION_ORDER.includes(k)),
    Object.keys(D.LINES).filter(k => !D.SITUATION_ORDER.includes(k)).join(', '));
  ok('every situation is described',
    D.SITUATION_ORDER.every(k => D.SITUATIONS[k] && D.SITUATIONS[k].name));

  // The order and the urgency ratings are one fact, not two. A situation added at the
  // bottom with urgency 3 is exactly the bug this catches: an announced casualty that
  // never fires because a thin galley is tested first.
  const urg = D.SITUATION_ORDER.map(k => D.SITUATIONS[k].urgency);
  const inversion = urg.findIndex((v, i) => i > 0 && v > urg[i - 1]);
  ok('the order never puts a calmer situation first', inversion === -1,
    inversion >= 0 ? `${D.SITUATION_ORDER[inversion]} above ${D.SITUATION_ORDER[inversion - 1]}` : '');
  ok('the catch-all is last', D.SITUATION_ORDER[D.SITUATION_ORDER.length - 1] === 'quiet');

  // The one that actually catches things. A line filed under a post or trait that does not
  // exist is a line nobody will ever hear, and nothing at runtime would ever say so.
  const badPost = [], badTrait = [], badMood = [];
  for (const k in D.LINES) {
    const L = D.LINES[k];
    for (const p in (L.post || {})) if (!ROLE_KEYS.includes(p)) badPost.push(`${k}.${p}`);
    for (const t in (L.trait || {})) if (!TRAIT_KEYS.includes(t)) badTrait.push(`${k}.${t}`);
    for (const m in (L.mood || {})) if (!['low', 'high'].includes(m)) badMood.push(`${k}.${m}`);
  }
  ok('every post key is a post that exists', badPost.length === 0, badPost.join(', '));
  ok('every trait key is a trait that exists', badTrait.length === 0, badTrait.join(', '));
  ok('mood is only low or high', badMood.length === 0, badMood.join(', '));

  const badEx = D.EXCHANGES.filter(x =>
    !D.LINES[x.sit] ||
    !(x.from === 'veteranAny' || ROLE_KEYS.includes(x.from)) ||
    !ROLE_KEYS.includes(x.to) || !x.open || !x.reply);
  ok('every exchange names a real situation and real posts', badEx.length === 0,
    badEx.map(x => x.sit + ':' + x.from).join(', '));
  ok('an exchange never talks to itself', D.EXCHANGES.every(x => x.from !== x.to));

  // Every line is complete on its own, so a reply must read as a sentence rather than as
  // the second half of one.
  const all = [];
  for (const k in D.LINES) {
    const L = D.LINES[k];
    all.push(...(L.any || []));
    for (const p in (L.post || {})) all.push(...L.post[p]);
    for (const t in (L.trait || {})) all.push(...L.trait[t]);
    for (const m in (L.mood || {})) all.push(...L.mood[m]);
  }
  for (const x of D.EXCHANGES) all.push(x.open, x.reply);

  ok('every line ends like a sentence', all.every(l => /[.?!’"]$/.test(l)),
    all.filter(l => !/[.?!’"]$/.test(l)).slice(0, 2).join(' | '));
  ok('every line starts like one', all.every(l => /^[A-Z“‘]/.test(l)),
    all.filter(l => !/^[A-Z“‘]/.test(l)).slice(0, 2).join(' | '));

  // No line states a number. A number in dialogue is a number that goes stale — the corpus
  // is written to be true whenever it fires, not true when it was written.
  const numeric = all.filter(l => /\d/.test(l));
  ok('no line quotes a figure', numeric.length === 0, numeric.slice(0, 3).join(' | '));

  // A line that appears twice is a line that will feel like a repeat even though the
  // anti-repetition memory did its job, because the memory keys on the text.
  const seen = new Set(), dupes = [];
  for (const l of all) { if (seen.has(l)) dupes.push(l); seen.add(l); }
  ok('no line appears twice', dupes.length === 0, dupes.slice(0, 2).join(' | '));

  ok('the corpus is worth the machinery', D.corpusSize() >= 250, String(D.corpusSize()));
  console.log(`       ${D.corpusSize()} lines · ${D.SITUATION_ORDER.length} situations · ` +
              `${D.EXCHANGES.length} exchanges`);
}

// ── choosing ─────────────────────────────────────────────────────────
console.log('\n— choosing what to say —');
{
  ok('the narrowest pool wins',
    D.poolFor('underfire', 'gunner', 'veteran', null)
      .some(l => D.LINES.underfire.trait.veteran.includes(l)));
  ok('a post with no lines still gets the general ones',
    D.poolFor('undocked', 'medic', 'steady', null).length > 0);
  ok('an unknown situation is empty rather than an error',
    Array.isArray(D.poolFor('nonsense', 'gunner', 'veteran', null)) &&
    D.poolFor('nonsense', 'gunner', 'veteran', null).length === 0);
  ok('mood unlocks lines that are otherwise unreachable',
    D.poolFor('underfire', 'purser', 'steady', 'low').length >
    D.poolFor('underfire', 'purser', 'steady', null).length);

  // The gate that makes an exchange feel like a crew rather than a script: it needs both
  // halves aboard.
  const both = D.exchangesFor('mining', ['rigger', 'purser']);
  ok('an exchange needs both posts aboard', both.length >= 1);
  ok('...and does not fire without them',
    D.exchangesFor('mining', ['rigger']).every(x => x.to !== 'purser'));
  ok('a ship with nobody aboard has no exchanges', D.exchangesFor('mining', []).length === 0);
}

// ── the mailbox ──────────────────────────────────────────────────────
console.log('\n— announced events —');
{
  N.resetCrewNotes();
  ok('nothing is standing to begin with', N.openNotes().length === 0);
  N.crewNote('payday');
  ok('a note stands', N.noteFresh('payday') === true);
  ok('...and only the one', N.noteFresh('broke') === false);
  S.time += 20;
  ok('a note expires on its own', N.noteFresh('payday') === false);
  ok('an empty note is refused', N.crewNote('') === false);
  N.resetCrewNotes();
}

// ── the driver ───────────────────────────────────────────────────────
console.log('\n— when nobody should be talking —');
{
  T.resetCrewTalk(); resetSweep(); H.resetHabitat(); stocked();
  S.crew = [makeCrew('gunner'), makeCrew('engineer'), makeCrew('purser')];
  S.crew.forEach(c => { c.morale = 0.7; c.fatigue = 0; });
  S.docked = null; S.viewOutside = false;
  S.player.hull = S.stats.hullMax;
  S.input.mining = false;

  const before = commsLog().length;
  for (let t = 0; t < CREW_TALK.bootQuiet - 1; t += 0.5) { S.time += 0.5; T.updateCrewTalk(0.5); }
  ok('nobody talks during the boot window', commsLog().length === before);

  // Past the window, somebody eventually says something — but not immediately, because a
  // situation has to settle first.
  let spoke = 0;
  for (let t = 0; t < 600; t += 0.5) { S.time += 0.5; T.updateCrewTalk(0.5); }
  spoke = commsLog().length - before;
  ok('...and past it, they do', spoke > 0, String(spoke));

  // The floor. Ten minutes of ship time at the quietest situation should not produce a
  // conversation — `quiet` has the longest gap of anything in the table for this reason.
  ok('a quiet ship stays quiet', spoke <= 8, `${spoke} lines in ten minutes`);

  const mine = commsLog().slice(before);
  const names = new Set(S.crew.map(c => c.name));
  ok('everything said came from somebody aboard', mine.every(e => names.has(e.from)));
  ok('...on the ship’s own channel', mine.every(e => e.channel === 'company'));
  ok('...and none of it is a hail', mine.every(e => e.kind === 'chatter'));
}

console.log('\n— what they notice —');
{
  T.resetCrewTalk(); N.resetCrewNotes(); resetSweep(); stocked();
  S.docked = null;
  S.player.hull = S.stats.hullMax;
  S.input.mining = false;
  ok('a quiet ship is in the quiet situation', T.situationNow() === 'quiet',
    T.situationNow());

  S.player.hull = S.stats.hullMax * 0.2;
  ok('a broken hull outranks everything quiet', T.situationNow() === 'hullcrit');
  S.player.hull = S.stats.hullMax;

  S.fit = { weapon: [], utility: ['solararray'], core: [] };
  H.deployPanels(); H.updateHabitat(0.4);
  ok('arrays coming out is its own situation', T.situationNow() === 'panelsout',
    T.situationNow());
  for (let t = 0; t < 40; t += 0.5) H.updateHabitat(0.5);
  ok('...and being out is a different one', T.situationNow() === 'charging',
    T.situationNow());
  H.resetHabitat();
  S.fit = { weapon: [], utility: [], core: [] };

  N.crewNote('casualty');
  ok('an announced event beats a sensed one', T.situationNow() === 'casualty');
  N.resetCrewNotes();

  S.docked = { userData: { name: 'Test Berth' } };
  ok('being on a pad is noticed', T.situationNow() === 'docked');
  S.docked = null;

  // A note for a situation the corpus has no lines for is ignored rather than trusted.
  N.crewNote('not-a-situation');
  ok('a nonsense note changes nothing', T.situationNow() === 'quiet');
  N.resetCrewNotes();
}

console.log('\n— one at a time —');
{
  T.resetCrewTalk(); resetSweep(); H.resetHabitat(); stocked();
  S.crew = [makeCrew('rigger'), makeCrew('purser'), makeCrew('survey')];
  S.crew.forEach(c => { c.morale = 0.7; c.fatigue = 0; });
  S.docked = null;
  S.input.mining = true;              // a talkative situation, so this runs quickly

  const before = commsLog().length;
  for (let t = 0; t < 900; t += 0.5) { S.time += 0.5; T.updateCrewTalk(0.5); }
  const said = commsLog().slice(before);
  ok('a busy situation gets talked about', said.length >= 2, String(said.length));

  // Nobody monologues. One person twice in a row is the failure this catches — with a
  // pending exchange reply the same speaker may legitimately follow themselves once, so
  // the assertion is about runs of three.
  let worst = 1, run = 1;
  for (let i = 1; i < said.length; i++) {
    run = said[i].from === said[i - 1].from ? run + 1 : 1;
    if (run > worst) worst = run;
  }
  ok('nobody monologues', worst <= 2, `${worst} in a row`);

  // The floor is real: no two lines closer together than it, allowing for the exchange
  // reply, which is deliberately closer and is the only thing that may be.
  const gaps = [];
  for (let i = 1; i < said.length; i++) gaps.push(said[i].t - said[i - 1].t);
  const tooClose = gaps.filter(g => g < CREW_TALK.replyDelay[0] - 0.6);
  ok('nothing lands on top of anything else', tooClose.length === 0, tooClose.join(', '));

  const report = T.crewTalkReport();
  ok('the report knows what is going on', report.situation === 'mining', report.situation);
  ok('...and how big the corpus is', report.corpus === D.corpusSize());
  S.input.mining = false;
}

console.log('\n— a punchline is not worth dying for —');
{
  T.resetCrewTalk(); N.resetCrewNotes(); resetSweep(); stocked();
  S.crew = [makeCrew('rigger'), makeCrew('purser')];
  S.crew.forEach(c => { c.morale = 0.7; c.fatigue = 0; });
  S.docked = null;

  // Force a pending reply by hand: the exchange share is a die roll and this assertion is
  // about what happens to a reply in flight, not about how often one starts.
  T.resetCrewTalk();
  S.input.mining = true;
  let armed = false;
  for (let t = 0; t < 3000 && !armed; t += 0.5) {
    S.time += 0.5; T.updateCrewTalk(0.5);
    armed = T.crewTalkReport().pending;
  }
  ok('an exchange eventually opens', armed === true);

  if (armed) {
    N.crewNote('boarding');            // urgency 3 — the highest there is
    T.updateCrewTalk(0.1);
    ok('a queued reply is dropped when something serious happens',
      T.crewTalkReport().pending === false);
  } else {
    ok('a queued reply is dropped when something serious happens', false, 'never armed');
  }

  S.input.mining = false;
  T.resetCrewTalk();
  ok('reset clears everything', T.crewTalkReport().pending === false &&
     T.crewTalkReport().lastBy === null && T.crewTalkReport().situation === null);
}

console.log(`\n${pass} passed, ${fail} problems`);
process.exit(fail ? 1 : 0);
