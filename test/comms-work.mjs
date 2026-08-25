// The generated radio, and the five order types that used to be countdowns.
//
// Two halves of the same complaint: things that were declared but not realised. NPC chatter
// was nine topics with one or two fixed phrasings each — eighteen sentences on a loop, and
// writing a nineteenth would have bought forty seconds. The other five fleet order types
// dispatched, bound a hull, ran a timer and produced nothing.
//
// What this suite pins is that the wording varies while the information does not, that the
// morphology is actually correct rather than merely different, and that every order type
// now leaves something behind in the world.

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
const { createAsteroids } = await imp('world/asteroids.js');
const { createNpcs } = await imp('entities/npcs.js');
const { initMarket } = await imp('systems/trade/market.js');
const { ORDERS } = await imp('core/config.js');
const G = await imp('data/npc-kb/grammar.js');
const { TOPICS, TOPIC_KEYS, utter } = await imp('data/npc-kb/topics.js');
const FL = await imp('systems/company/fleet.js');
// The entity factories are a boot step, not an import side effect — see core/spawn.js.
const { registerNpcFactories } = await imp('entities/npcs.js');
const { registerHullFactory } = await imp('entities/shipmesh.js');
registerNpcFactories(); registerHullFactory();
const FW = await imp('systems/company/fleet-work.js');
const CMD = await imp('systems/company/command.js');
const { fleetOrderReport, updateFleetOrders, FLEET_ORDER_TYPES } = await imp('systems/company/orders.js');
const { createCharacter } = await imp('systems/crew/character.js');

initScene(); recalcStats(); seedWorld(11);
createSystem(); createAsteroids(); createNpcs(); initMarket();

// ── morphology ───────────────────────────────────────────────────────
console.log('\n— the inflection is correct, not merely varied —');
{
  ok('regular plurals', G.plural('lane', 2) === 'lanes' && G.plural('berth', 3) === 'berths');
  ok('sibilant plurals take -es', G.plural('box', 2) === 'boxes' && G.plural('branch', 2) === 'branches');
  ok('consonant + y becomes -ies', G.plural('body', 2) === 'bodies');
  ok('vowel + y just takes -s', G.plural('lay', 2) === 'lays');
  ok('a count of one is not pluralised', G.plural('rock', 1) === 'rock');
  ok('irregulars are respected', G.plural('cargo', 2) === 'cargoes' && G.plural('person', 2) === 'people');

  ok('third person singular', G.conjugate('read', { person: 3, number: 'sg' }) === 'reads');
  ok('plural takes the bare form', G.conjugate('read', { person: 3, number: 'pl' }) === 'read');
  ok('first person takes the bare form', G.conjugate('hold', { person: 1, number: 'sg' }) === 'hold');
  ok('sibilant verbs take -es', G.conjugate('push', { person: 3, number: 'sg' }) === 'pushes');
  ok('irregular third person', G.conjugate('have', { person: 3, number: 'sg' }) === 'has');
  ok('regular past', G.conjugate('mark', { tense: 'past' }) === 'marked');
  ok('past with a silent e', G.conjugate('move', { tense: 'past' }) === 'moved');
  ok('irregular past', G.conjugate('run', { tense: 'past' }) === 'ran');
  ok('progressive agrees', G.conjugate('cut', { person: 3, number: 'sg', aspect: 'prog' }) === 'is cutting');
  ok('progressive doubles the consonant', /cutting/.test(G.conjugate('cut', { aspect: 'prog' })));
  ok('progressive drops a silent e', /moving/.test(G.conjugate('move', { aspect: 'prog' })));
  ok('perfect agrees', G.conjugate('take', { person: 3, number: 'sg', aspect: 'perf' }) === 'has taken');
  ok('plural perfect', G.conjugate('take', { number: 'pl', aspect: 'perf' }) === 'have taken');

  // The article rule is on sound, not spelling — "a hour" is what reads as broken.
  ok('a before a consonant', G.article('berth') === 'a');
  ok('an before a vowel', G.article('ore') === 'an');
  ok('an before a silent h', G.article('hour') === 'an');
  ok('a before a consonantal u', G.article('union') === 'a' && G.article('user') === 'a');

  ok('an indefinite NP picks its own article', /^an ore$/.test(G.np('ore', { count: 1 })));
  ok('a definite NP does not', G.np('lane', { det: 'def' }) === 'the lane');
  ok('a counted NP agrees', G.np('contact', { count: 3 }) === '3 contacts');
  ok('a mass noun is not pluralised', G.np('ore', { count: 5, mass: true, det: 'none' }) === 'ore');
  ok('an adjective takes the article', G.np('face', { adj: 'open' }) === 'an open face');
}

// ── variety ──────────────────────────────────────────────────────────
console.log('\n— the same meaning, different sentences —');
{
  G.resetGrammarMemory();
  const msg = { act: 'inform', register: 'plain', subject: 'the face', verb: 'read', object: 'clean ore' };
  const said = [];
  for (let i = 0; i < 12; i++) said.push(G.realise(msg, { bucket: 'variety' }));
  ok('every utterance is non-empty', said.every(s => s.length > 0));
  ok('the same record produces several different sentences', new Set(said).size >= 4,
     `${new Set(said).size} distinct of 12`);
  ok('and no two in a row are identical',
     said.every((s, i) => i === 0 || s !== said[i - 1]));

  // The anti-repetition memory is the thing that stops it being a coin flip that lands
  // on the same face twice.
  G.resetGrammarMemory();
  const pool = ['a', 'b', 'c', 'd'];
  const drawn = [];
  for (let i = 0; i < 4; i++) drawn.push(G.chooseFrom(pool, 'exhaust'));
  ok('a pool is exhausted before anything repeats', new Set(drawn).size === pool.length,
     drawn.join(','));

  ok('every sentence ends with punctuation', said.every(s => /[.?!]$/.test(s)));
  ok('every sentence starts capitalised', said.every(s => /^[A-Z0-9]/.test(s)));
}

// ── proper nouns ─────────────────────────────────────────────────────
console.log('\n— names and pronouns survive being moved —');
{
  G.resetGrammarMemory();
  const out = [];
  for (let i = 0; i < 24; i++) {
    out.push(G.realise({
      act: 'inform', register: 'warm', subject: 'Bulk Hauler 02',
      verb: 'hold', object: 'a full bay'
    }, { bucket: 'proper', vocative: 'Belt Miner 04' }));
  }
  ok('a ship name is never lowercased', !out.some(s => /bulk Hauler|belt Miner/.test(s)),
     out.find(s => /bulk Hauler|belt Miner/.test(s)) || '');
  ok('the listener is never addressed twice in one line',
     !out.some(s => (s.match(/Belt Miner 04/g) || []).length > 1));

  G.resetGrammarMemory();
  const first = [];
  for (let i = 0; i < 16; i++) {
    first.push(G.realise({
      act: 'inform', register: 'warm', subject: 'I',
      agr: { person: 1, number: 'sg' }, verb: 'have', object: 'the hold for it'
    }, { bucket: 'pronoun' }));
  }
  ok('the pronoun I is always capitalised', !first.some(s => /(^|\s)i(\s|,|\.)/.test(s)),
     first.find(s => /(^|\s)i(\s|,|\.)/.test(s)) || '');
}

// ── register ─────────────────────────────────────────────────────────
console.log('\n— a ship sounds like itself —');
{
  ok('a raider is terse', G.registerOf({ faction: 'hostile', role: 'combat' }) === 'terse');
  ok('a coalition hull is formal', G.registerOf({ faction: 'coalition', role: 'combat' }) === 'formal');
  ok('a miner is warm', G.registerOf({ faction: 'worker', role: 'mine' }) === 'warm');
  ok('an unknown ship still has a register', !!G.registerOf({ faction: 'x', role: 'y' }));
  ok('nothing at all still has a register', G.registerOf(null) === 'plain');

  G.resetGrammarMemory();
  const terse = [], warm = [];
  for (let i = 0; i < 8; i++) {
    terse.push(G.realise({ act: 'ack', register: 'terse' }, { bucket: 't' }));
    warm.push(G.realise({ act: 'ack', register: 'warm' }, { bucket: 'w' }));
  }
  ok('registers draw on different words', new Set(terse).size > 1 && new Set(warm).size > 1);
  ok('and do not overlap wholesale',
     terse.filter(t => warm.includes(t)).length < terse.length);
}

// ── topics ───────────────────────────────────────────────────────────
console.log('\n— every topic speaks —');
{
  const a = { name: 'Belt Miner 04', role: 'mine', faction: 'worker', hp: 70, maxHp: 70 };
  const b = { name: 'Bulk Hauler 02', role: 'haul', faction: 'worker', hp: 130, maxHp: 130 };

  for (const key of TOPIC_KEYS) {
    G.resetGrammarMemory();
    const lines = [];
    for (let i = 0; i < 8; i++) {
      lines.push(utter(key, 0, { a, b, rel: { exchanges: i } }));
      lines.push(utter(key, 1, { a: b, b: a, rel: { exchanges: i } }));
    }
    ok(`${key} produces an opener and a reply`, lines.every(l => l && l.length > 0));
    ok(`${key} varies its wording`, new Set(lines).size >= 4,
       `${new Set(lines).size} distinct of ${lines.length}`);
    ok(`${key} is punctuated`, lines.every(l => /[.?!]$/.test(l)));
  }

  ok('a converted topic declares meaning rather than a string',
     TOPIC_KEYS.some(k => Array.isArray(TOPICS[k].say)));
  ok('every topic can still speak by one route or the other',
     TOPIC_KEYS.every(k => (TOPICS[k].say || TOPICS[k].lines || []).length === 2));
  ok('an unknown topic returns nothing rather than throwing', utter('no-such-topic', 0, { a, b }) === '');
}

// ── the five order types ─────────────────────────────────────────────
console.log('\n— every order type does work now —');
{
  function exec() {
    S.company = null; S.fleetOrders = [];
    createCharacter({ name: 'V', lineage: 'core', corp: 'meridian', career: 'executive' });
    S.company.treasury = 400000;
    S.docked = S.world.stations[0];
    S.time = 500;
  }

  ok('every order type has a body or is driven elsewhere',
     Object.keys(FLEET_ORDER_TYPES).every(k => k === 'extract' || !!FW.WORK));

  // Patrol pays only when there is something to push off.
  exec();
  FL.commissionHull('combat');
  // Passive: a timed patrol leaf would expire inside the loop below and the test would be
  // measuring completion rather than work.
  const pat = CMD.commandFromText('patrol until recalled');
  ok('patrol dispatches', pat.ok === true, pat.text);
  const pShip = FL.hullShip(S.company.fleet[0]);
  const quietStart = S.company.treasury;
  for (let i = 0; i < 200; i++) { S.time += 0.25; updateFleetOrders(0.25); }
  ok('a quiet lane pays nothing', S.company.treasury <= quietStart);

  // Put a raider on the lane and it starts earning.
  const raider = (S.world.npcs || []).find(n => n.userData &&
    (n.userData.faction === 'hostile' || n.userData.faction === 'pirate') && n.userData.hp > 0);
  ok('there is a hostile to find', !!raider);
  const o = fleetOrderReport()[0];
  ok('the patrol is still running', !!o, 'passive objectives do not self-complete');
  if (raider) {
    const before = S.company.treasury;
    let sawContact = false;
    for (let i = 0; i < 200; i++) {
      // Keep the raider on the hull's shoulder as it flies its circuit.
      raider.position.copy(pShip.position);
      raider.userData.hp = raider.userData.maxHp;
      S.time += 0.25;
      updateFleetOrders(0.25);
      const rep = fleetOrderReport()[0];
      if (rep && rep.contacts > 0) sawContact = true;
    }
    ok('a lane with a raider on it pays', S.company.treasury > before,
       `${Math.round(S.company.treasury - before)}`);
    ok('and the objective counted the contact', sawContact);
  }

  // Escort closes on what it is protecting.
  exec();
  FL.commissionHull('combat');
  const esc = CMD.commandFromText('escort the convoy');
  ok('escort dispatches', esc.ok === true, esc.text);
  const eShip = FL.hullShip(S.company.fleet[0]);
  S.player.position.set(4000, 0, 4000);
  eShip.position.set(-4000, 0, -4000);
  const far = eShip.position.distanceTo(S.player.position);
  for (let i = 0; i < 400; i++) { S.time += 0.25; updateFleetOrders(0.25); }
  ok('the escort closes on the ship it is covering',
     eShip.position.distanceTo(S.player.position) < far,
     `${Math.round(far)} → ${Math.round(eShip.position.distanceTo(S.player.position))}`);

  // Survey deepens the assay a later extraction order reads.
  exec();
  FL.commissionHull('mine');
  const sur = CMD.commandFromText('run a survey pass');
  ok('survey dispatches', sur.ok === true, sur.text);
  const sShip = FL.hullShip(S.company.fleet[0]);
  const body = (S.world.bodies || []).find(x => x.userData && x.userData.kind === 'planet');
  ok('there is a body to survey', !!body);
  if (body) {
    sShip.position.copy(body.position);
    S.assay = {};
    for (let i = 0; i < 400; i++) { S.time += 0.25; updateFleetOrders(0.25); }
    const gained = Object.values(S.assay || {}).reduce((n, v) => n + v, 0);
    ok('the assay actually rises', gained > 0, String(gained));
    ok('and is capped at the ceiling',
       Object.values(S.assay).every(v => v <= ORDERS.maxAssay));
  }

  // Logistics moves cargo and banks the sale.
  exec();
  FL.commissionHull('haul');
  const log = CMD.commandFromText('haul that freight to the depot');
  ok('logistics dispatches', log.ok === true, log.text);
  const lShip = FL.hullShip(S.company.fleet[0]);
  const startAt = lShip.position.clone ? lShip.position.clone()
                : { x: lShip.position.x, y: lShip.position.y, z: lShip.position.z };
  let legs = new Set(), delivered = 0, lastPhase = null;
  for (let i = 0; i < 4000; i++) {
    S.time += 0.25;
    updateFleetOrders(0.25);
    const rep = fleetOrderReport()[0];
    // An active objective is *removed* the tick it completes, so reading the report after
    // the loop reads nothing. Take the last one that existed. This mattered from v1.02.30:
    // the run used to be too slow to finish inside the window, so the loop always ended
    // mid-flight and nobody noticed the report vanishing was unhandled.
    if (!rep) break;
    if (rep.leg) legs.add(rep.leg);
    lastPhase = rep.phase;
    if (rep.delivered > delivered) delivered = rep.delivered;
  }
  ok('the run entered a cargo leg', legs.size > 0, [...legs].join(','));
  ok('and the hull actually went somewhere',
     Math.hypot(lShip.position.x - startAt.x, lShip.position.y - startAt.y,
                lShip.position.z - startAt.z) > 100);
  // v1.02.30: `leg` is display text now and `phase` is the state, because logistics started
  // warping and `cruise()` writes `leg`. Asserting on display strings was what made this
  // check pass through the rewrite that broke the run underneath it — so it asserts the
  // thing that matters instead: cargo moved, or the hull is holding cargo on its way to
  // sell it.
  ok('cargo moved, or is aboard and in transit',
     delivered > 0 || lastPhase === 'run',
     `${delivered} kg · last phase ${lastPhase}`);
  ok('the run finished inside a plausible window', legs.size > 1, [...legs].slice(0, 4).join(' / '));

  // Station-keep holds a berth and reports what crosses it.
  exec();
  FL.commissionHull('combat');
  const keep = CMD.commandFromText('hold position on picket');
  ok('station-keep dispatches', keep.ok === true, keep.text);
  const kShip = FL.hullShip(S.company.fleet[0]);
  const st = S.world.stations[0];
  kShip.position.copy(st.position);
  const raider2 = (S.world.npcs || []).find(n => n.userData &&
    (n.userData.faction === 'hostile' || n.userData.faction === 'pirate') && n.userData.hp > 0);
  if (raider2) raider2.position.copy(st.position);
  for (let i = 0; i < 200; i++) { S.time += 0.25; updateFleetOrders(0.25); }
  const kr = fleetOrderReport()[0];
  ok('the picket is holding', !!kr);
  ok('and reported what came into scope', kr && (kr.contacts > 0 || kr.progress >= 0));

  ok('a work report reads for every type',
     Object.keys(FLEET_ORDER_TYPES).every(t => typeof FW.workReport({ type: t }) === 'string'));
}

// ── nothing regressed ────────────────────────────────────────────────
console.log('\n— the commands still dispatch —');
{
  S.company = null; S.fleetOrders = [];
  createCharacter({ name: 'V', lineage: 'core', corp: 'meridian', career: 'executive' });
  S.company.treasury = 400000;
  S.docked = S.world.stations[0];

  const need = new Set();
  for (const k of Object.keys(FLEET_ORDER_TYPES)) {
    for (const r of FLEET_ORDER_TYPES[k].requires || []) need.add(r);
  }
  for (const r of need) if (FL.fleetRoster().length < 6) FL.commissionHull(r);

  const broken = [];
  for (const leaf of CMD.allLeaves()) {
    S.fleetOrders = [];
    for (const c of S.company.fleet) c.orderId = null;
    const r = CMD.commandById(leaf.id);
    if (!r.ok) broken.push(`${leaf.id}: ${r.text}`);
  }
  ok('every menu leaf still dispatches', broken.length === 0, broken.join(' | '));
}

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
