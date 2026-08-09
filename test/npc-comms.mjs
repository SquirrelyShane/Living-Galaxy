// NPC-to-NPC communication and the relationships it leaves behind.
//
// The property this suite is really protecting is stated in docs/NPC_ROADMAP.md: an
// exchange counts only if it **changes state that outlives it**. The cheap version of this
// feature prints a plausible line between two ships and stops, and a test that asserts
// "two ships produced text" would pass against that version.
//
// So the checks here are almost all of the form: run an exchange, then look at what the
// world knows afterwards — and in particular, look at it from the point of view of a
// character who was not the player.

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
const { spawnNpc } = await imp('entities/npcs.js');
const NC = await imp('systems/npc-comms.js');
const { TOPICS, TOPIC_KEYS, availableTopics } = await imp('data/npc-topics.js');
const { personaFor, noteEvent } = await imp('systems/npc-brain.js');
const { wariness } = await imp('systems/npc-tactics.js');
const { commsLog, initComms } = await imp('systems/comms.js');
const { NPCCOMMS } = await imp('core/config.js');
const { SCHEMA } = await imp('core/version.js');

initScene();
recalcStats();
seedWorld(20260808);
createSystem();
initComms();

const reset = () => {
  for (const n of S.world.npcs) n.userData.hp = 0;
  S.world.npcs.length = 0;
  S.brains = { personas: {} };
  S.npcComms = { pairs: {}, exchanges: 0 };
  S.comms = { log: [], unread: 0, pending: null, lastHail: {}, channel: 'local' };
  S.time = 1000;
};
const at = (npc, x, z) => { npc.position.set(x, 0, z); return npc; };
/**
 * Two ships of a kind, far from the player unless a test says otherwise.
 *
 * Ids are unique per call. Reusing them produced two different pairs with the *same two
 * names*, and since a pair cooldown is keyed on names, the second pair in a section
 * silently inherited the first pair's cooldown and refused to speak.
 */
let uid = 10;
const pair = (ka, kb, x = 400000) => {
  const a = at(spawnNpc(ka, ++uid), x, 0);
  const b = at(spawnNpc(kb, ++uid), x + 200, 0);
  return [a, b];
};
const factsOf = u => (personaFor(u) ? personaFor(u).memory.facts : []);
const hasFact = (u, type, subject) =>
  factsOf(u).some(f => f.type === type && (subject === undefined || f.subject === subject));

// ── the topic table ──────────────────────────────────────────────────
console.log('\n— topics —');
{
  ok('every topic declares a channel', TOPIC_KEYS.every(k => !!TOPICS[k].channel));
  ok('every topic has a condition', TOPIC_KEYS.every(k => typeof TOPICS[k].when === 'function'));
  ok('every topic has an opener and a reply',
     TOPIC_KEYS.every(k => (TOPICS[k].lines || []).length === 2 &&
                           TOPICS[k].lines.every(l => typeof l === 'function')));
  ok('every topic has a cooldown', TOPIC_KEYS.every(k => TOPICS[k].cooldown > 0));

  // The constraint from the roadmap, asserted directly: a topic that leaves nothing behind
  // is a screensaver, and this is the check that stops one being added by accident.
  ok('every topic leaves state on both sides',
     TOPIC_KEYS.every(k => !!TOPICS[k].filesFrom && !!TOPICS[k].filesTo),
     TOPIC_KEYS.filter(k => !TOPICS[k].filesFrom || !TOPICS[k].filesTo).join(','));
  ok('every filed fact has a type and a weight',
     TOPIC_KEYS.every(k => ['filesFrom', 'filesTo'].every(side =>
       TOPICS[k][side].type && TOPICS[k][side].weight > 0)));
}

// ── an exchange changes the world ────────────────────────────────────
console.log('\n— an exchange leaves something behind —');
{
  reset();
  const [a, b] = pair('miner', 'miner');
  const res = NC.exchange(a, b, 'oreTip');
  ok('an exchange returns a record', !!res);
  ok('it names both parties', res.from === a.userData.name && res.to === b.userData.name);
  ok('it produces two lines', res.lines.filter(Boolean).length === 2);
  ok('the lines are strings with content', res.lines.every(l => typeof l === 'string' && l.length > 4));

  // The whole point. Not "text was produced" — "somebody now knows something".
  ok('the speaker remembers giving the tip', hasFact(a.userData, 'gave-tip', b.userData.name));
  ok('the listener remembers getting it', hasFact(b.userData, 'got-tip', a.userData.name));
  ok('the memory is about the other ship, not the player',
     factsOf(b.userData).every(f => f.subject !== 'player'));
  ok('the fact carries who it came through',
     factsOf(b.userData).some(f => f.meta && f.meta.via === a.userData.name));
}

console.log('\n— relationships —');
{
  reset();
  const [a, b] = pair('miner', 'miner');
  const blank = NC.relation(a.userData, b.userData);
  ok('strangers are strangers', !blank.familiar && blank.exchanges === 0);

  NC.exchange(a, b, 'oreTip');
  const rel = NC.relation(a.userData, b.userData);
  ok('one exchange makes them familiar', rel.familiar);
  ok('and it is counted', rel.exchanges > 0);
  ok('the relationship is directional — b also knows a',
     NC.relation(b.userData, a.userData).familiar);
  ok('a third party knows neither',
     !NC.relation(at(spawnNpc('miner', 13), 400400, 0).userData, a.userData).familiar);

  // Warmth, not just contact count. Favours read differently from friction.
  reset();
  const [c, d] = pair('pirate', 'pirate');
  noteEvent(c.userData, { type: 'owed-favour', subject: d.userData.name, weight: 2 });
  ok('a favour reads as warmth', NC.relation(c.userData, d.userData).warmth > 0);
  const [e, f] = pair('pirate', 'patrol', 500000);
  noteEvent(e.userData, { type: 'traded-words', subject: f.userData.name, weight: 2 });
  ok('friction reads the other way', NC.relation(e.userData, f.userData).warmth < 0);

  // The acquaintance list — the thing 2a is actually asking for: a character who knows
  // several other characters apart, by name.
  reset();
  const hub = at(spawnNpc('miner', 20), 400000, 0);
  const others = [21, 22, 23].map(i => at(spawnNpc('miner', i), 400000 + i * 30, 0));
  for (const o of others) NC.exchange(hub, o, 'oreTip');
  const known = NC.acquaintances(hub.userData);
  ok('a character tracks several acquaintances at once', known.length === 3, `${known.length}`);
  ok('and knows them by name', others.every(o => known.includes(o.userData.name)));
  ok('the player is not an acquaintance', !known.includes('player'));
  ok('recallBetween finds a specific thread',
     NC.recallBetween(hub.userData, others[0].userData, 'gave-tip'));
  ok('and does not invent one', !NC.recallBetween(hub.userData, others[0].userData, 'owes-favour'));
}

// ── cooldowns and availability ───────────────────────────────────────
console.log('\n— when two ships have nothing to say —');
{
  reset();
  const [a, b] = pair('miner', 'miner');
  ok('the same topic will not repeat immediately', !NC.exchange(a, b, 'oreTip') === false);
  ok('a second attempt on the same topic is refused', NC.exchange(a, b, 'oreTip') === null);
  S.time += TOPICS.oreTip.cooldown + 1;
  ok('after the cooldown it is available again', !!NC.exchange(a, b, 'oreTip'));

  ok('a ship cannot talk to itself', NC.exchange(a, a) === null);
  b.userData.hp = 0;
  ok('the dead do not talk', NC.exchange(a, b, 'checkIn') === null);
  b.userData.hp = b.userData.maxHp;

  // Conditions actually gate. A pirate and a patrol have no shared shift to compare notes
  // about, and an undamaged ship does not call for help.
  const [p1, q1] = pair('pirate', 'patrol', 600000);
  const opts = availableTopics(p1.userData, q1.userData, {
    warinessOf: () => 0, gossipThreshold: 1, recallBetween: () => false
  });
  ok('different factions do not check in with each other', !opts.includes('checkIn'));
  ok('but they do trade words', opts.includes('taunt'));
  const [h1, h2] = pair('pirate', 'pirate', 700000);
  const same = () => availableTopics(h1.userData, h2.userData, {
    warinessOf: () => 0, gossipThreshold: 1, recallBetween: () => false
  });
  ok('an undamaged ship does not ask for help', !same().includes('askHelp'));
  h1.userData.hp = h1.userData.maxHp * 0.2;
  ok('a damaged one does', same().includes('askHelp'));
}

// ── gossip: reputation travels at the speed of conversation ──────────
console.log('\n— gossip —');
{
  reset();
  const [a, b] = pair('pirate', 'pirate');
  ok('a character with no grievance does not gossip',
     !availableTopics(a.userData, b.userData, {
       warinessOf: wariness, gossipThreshold: NPCCOMMS.gossipThreshold, recallBetween: () => false
     }).includes('warnAboutPlayer'));

  // Give the speaker a reason: exactly the fact witnessKill() files.
  for (let i = 0; i < 2; i++) {
    noteEvent(a.userData, { type: 'saw-kill-ours', subject: 'player', weight: 2 });
  }
  ok('a wary character will pass it on',
     availableTopics(a.userData, b.userData, {
       warinessOf: wariness, gossipThreshold: NPCCOMMS.gossipThreshold, recallBetween: () => false
     }).includes('warnAboutPlayer'));

  const before = wariness(b.userData);
  ok('the listener had not heard', before === 0);
  NC.exchange(a, b, 'warnAboutPlayer');
  ok('after hearing it, the listener is wary of the player', wariness(b.userData) > before,
     `${before} -> ${wariness(b.userData)}`);
  ok('the rumour is filed against the player, not the messenger',
     hasFact(b.userData, 'saw-kill-ours', 'player'));

  // Hearsay must weigh less than eyewitness, or one kill turns a whole faction hostile
  // through a chain of repeats.
  const heard = factsOf(b.userData).find(f => f.type === 'saw-kill-ours');
  const seen = factsOf(a.userData).find(f => f.type === 'saw-kill-ours');
  ok('hearsay weighs less than seeing it', heard.weight < seen.weight,
     `${heard.weight} vs ${seen.weight}`);
  ok('the speaker records having passed it on',
     hasFact(a.userData, 'warned-about-player', b.userData.name));
}

// ── the player overhears ─────────────────────────────────────────────
console.log('\n— the player overhears —');
{
  reset();
  S.player.position.set(0, 0, 0);

  // Far away: it happens, and the player hears nothing. This is the check that the layer
  // is not merely a presentation effect keyed off the camera.
  const [fa, fb] = pair('miner', 'miner', 400000);
  const far = NC.exchange(fa, fb, 'oreTip');
  ok('a distant exchange still happens', !!far);
  ok('it is not overheard', far.overheard === false);
  ok('nothing reaches the log', commsLog().length === 0);
  ok('but the memories were still filed', hasFact(fb.userData, 'got-tip', fa.userData.name));

  // Close by: the same exchange lands on the radio.
  const [na, nb] = pair('miner', 'miner', 300);
  const near = NC.exchange(na, nb, 'oreTip');
  ok('a nearby exchange is overheard', near.overheard === true);
  ok('both sides reach the log', commsLog().length === 2);
  ok('the log carries the speakers',
     commsLog()[0].from === na.userData.name && commsLog()[1].from === nb.userData.name);
  ok('and the topic\'s channel', commsLog()[0].channel === TOPICS.oreTip.channel);
  ok('it is logged as chatter, not as a hail', commsLog().every(e => e.kind === 'chatter'));
}

// ── the sweep ────────────────────────────────────────────────────────
console.log('\n— the sweep —');
{
  reset();
  S.player.position.set(0, 0, 0);
  for (let i = 0; i < 8; i++) at(spawnNpc('miner', 30 + i), 1000 + i * 120, 400);

  const before = NC.npcCommsReport().exchanges;
  for (let i = 0; i < 400; i++) { S.time += 0.5; NC.updateNpcComms(0.5); }
  const rep = NC.npcCommsReport();
  ok('the sweep starts conversations', rep.exchanges > before, `${before} -> ${rep.exchanges}`);
  ok('it records the pairs', rep.pairs > 0);
  ok('relationships formed on their own',
     S.world.npcs.some(n => NC.acquaintances(n.userData).length > 0));
  ok('the sweep is bounded per call',
     NC.updateNpcComms(NPCCOMMS.sweepEvery) <= NPCCOMMS.maxPerSweep);

  // Nothing to talk to.
  reset();
  ok('an empty system is quiet', NC.updateNpcComms(60) === 0);
  at(spawnNpc('miner', 40), 0, 0);
  ok('one ship alone is quiet', NC.updateNpcComms(60) === 0);
  // Out of radio reach of each other.
  at(spawnNpc('miner', 41), NPCCOMMS.range * 8, 0);
  let ran = 0;
  for (let i = 0; i < 50; i++) ran += NC.updateNpcComms(NPCCOMMS.sweepEvery);
  ok('ships out of range of each other stay quiet', ran === 0);
}

// ── persistence ──────────────────────────────────────────────────────
console.log('\n— it survives a save —');
{
  reset();
  const [a, b] = pair('miner', 'miner');
  NC.exchange(a, b, 'oreTip');
  const packed = NC.serializeNpcComms();
  ok('the payload carries the pair cooldowns', Object.keys(packed.pairs).length === 1);
  ok('and the count', packed.exchanges === 1);

  NC.restoreNpcComms(null);
  ok('an absent payload restores empty', NC.npcCommsReport().pairs === 0);
  NC.restoreNpcComms(packed);
  ok('a restored payload keeps the cooldown', NC.exchange(a, b, 'oreTip') === null);
  ok('what the characters know is not in this payload — it rides with the personas',
     hasFact(b.userData, 'got-tip', a.userData.name));
  ok('the schema moved for it', SCHEMA === 16);
}

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
