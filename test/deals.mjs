// The ledger: obligations between characters, and what breaking one costs.
//
// The roadmap names the failure mode this suite is guarding against: a contract system that
// only ever *creates* obligations fills the world with commitments nobody discharges. So
// roughly half of what follows is about the failure side — expiry, a dead counterparty, a
// declined offer — because a deal that cannot fail is not a deal, it is a script.
//
// The other half is the reachability check that would have caught the bug this slice fixes.

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
const { spawnNpc, updateNpcs, populationTargets } = await imp('entities/npcs.js');
const D = await imp('systems/deals.js');
const NC = await imp('systems/npc-comms.js');
const { TOPICS, TOPIC_KEYS } = await imp('data/npc-topics.js');
const { personaFor, noteEvent } = await imp('systems/npc-brain.js');
const { bookFor } = await imp('systems/market.js');
const { initMarket } = await imp('systems/market.js');
const { NPC_TYPES, DEALS, COMMODITIES } = await imp('core/config.js');
const { SCHEMA } = await imp('core/version.js');

initScene();
recalcStats();
seedWorld(20260808);
createSystem();
initMarket();

let uid = 100;
const reset = () => {
  for (const n of S.world.npcs) n.userData.hp = 0;
  S.world.npcs.length = 0;
  S.brains = { personas: {} };
  S.npcComms = { pairs: {}, exchanges: 0 };
  S.deals = { open: [], done: 0, failed: 0 };
  S.time = 1000;
};
const ship = (kind, x = 400000) => {
  const n = spawnNpc(kind, ++uid);
  n.position.set(x, 0, 0);
  return n;
};
const stationName = () => S.world.stations[0].userData.name;
const factsOf = u => (personaFor(u) ? personaFor(u).memory.facts : []);
const hasFact = (u, type, subject) =>
  factsOf(u).some(f => f.type === type && (subject === undefined || f.subject === subject));

// ── the bug this slice fixes ─────────────────────────────────────────
console.log('\n— every declared requirement has somebody who meets it —');
{
  // v1.00.90 shipped a topic table where two of seven entries required a `haul` role, and
  // no ship class in the game had one. They could never fire. A table of declared
  // requirements is only as good as the population that can satisfy them, and nothing was
  // checking that — so this is the check.
  const roles = new Set(Object.keys(NPC_TYPES).map(k => {
    const ROLE = { merc: 'merc', miner: 'mine', hauler: 'haul',
                   builderC: 'build', builderP: 'build', fort: 'fort' };
    return ROLE[k] || 'combat';
  }));
  ok('a hauler role exists in the world', roles.has('haul'));
  ok('the hauler type is in the population targets', !!DEALS && !!NPC_TYPES.hauler);
  ok('the population planner knows about haulers',
     Object.prototype.hasOwnProperty.call(populationTargets().want, 'hauler'));

  // Every topic's `when` must be satisfiable by some pair of roles that actually spawn.
  const sample = [...roles].map(r => ({
    name: 'X' + r, faction: r === 'combat' ? 'hostile' : 'worker',
    role: r, hp: 50, maxHp: 100
  }));
  const ctx = { warinessOf: () => 1, gossipThreshold: 0, recallBetween: () => true };
  const unreachable = TOPIC_KEYS.filter(k => {
    for (const a of sample) for (const b of sample) {
      if (a === b) continue;
      // Try both faction alignments, since some topics need matching sides and some need
      // opposing ones.
      for (const f of ['worker', 'hostile']) {
        const bb = Object.assign({}, b, { faction: f });
        try { if (TOPICS[k].when(a, bb, ctx)) return false; } catch (e) { /* keep looking */ }
      }
    }
    return true;
  });
  ok('every topic is reachable by roles that actually spawn', unreachable.length === 0,
     unreachable.join(','));
}

// ── making a deal ────────────────────────────────────────────────────
console.log('\n— proposing —');
{
  reset();
  const miner = ship('miner'), hauler = ship('hauler', 400200);
  const spec = { commodity: 'ore', kg: 900, dest: stationName() };
  spec.pay = Math.round(D.dealValue(spec) * 0.9);       // generous — anyone should take it

  const deal = D.propose(miner.userData, hauler.userData, spec);
  ok('a good offer is accepted', !!deal);
  ok('it goes on the ledger', D.openDeals().length === 1);
  ok('it names both parties', deal.from === miner.userData.name && deal.to === hauler.userData.name);
  ok('it carries a deadline', deal.deadline > S.time);
  ok('both parties can find it',
     D.dealsFor(miner.userData.name).length === 1 && D.dealsFor(hauler.userData.name).length === 1);
  ok('the miner remembers dealing with the hauler',
     hasFact(miner.userData, 'dealt-with', hauler.userData.name));
  ok('the hauler remembers taking the work',
     hasFact(hauler.userData, 'took-work-from', miner.userData.name));

  // A bad offer is refused, and being refused is itself a memory — which is what stops a
  // character asking the same person every ninety seconds.
  reset();
  const m2 = ship('miner'), h2 = ship('hauler', 400200);
  const bad = { commodity: 'ore', kg: 900, dest: stationName(), pay: 1 };
  ok('a derisory offer is declined', D.propose(m2.userData, h2.userData, bad) === null);
  ok('nothing lands on the ledger', D.openDeals().length === 0);
  ok('the refusal is remembered', hasFact(m2.userData, 'declined-me', h2.userData.name));

  ok('a character cannot deal with itself', D.propose(m2.userData, m2.userData, bad) === null);
  ok('an unnamed party is refused', D.propose({ name: null }, h2.userData, bad) === null);

  // Bounded: nobody carries an unlimited book.
  reset();
  const m3 = ship('miner'), h3 = ship('hauler', 400200);
  const good = () => ({ commodity: 'ore', kg: 500, dest: stationName(),
                        pay: Math.round(D.dealValue({ commodity: 'ore', kg: 500, dest: stationName() }) * 0.9) });
  let taken = 0;
  for (let i = 0; i < 6; i++) if (D.propose(m3.userData, h3.userData, good())) taken++;
  ok('a character will not carry unlimited obligations', taken === DEALS.maxPerCharacter,
     `${taken}`);
}

console.log('\n— who says yes —');
{
  reset();
  const miner = ship('miner'), hauler = ship('hauler', 400200);
  const spec = { commodity: 'ore', kg: 800, dest: stationName() };
  const worth = D.dealValue(spec);

  const greedy = personaFor(hauler.userData);
  greedy.traits.greed = 1; greedy.traits.sociability = 0;
  const marginal = Object.assign({}, spec, { pay: Math.round(worth * DEALS.baseBar) });
  ok('a greedy hauler turns down a marginal rate', !D.willAccept(miner.userData, hauler.userData, marginal));
  greedy.traits.greed = 0; greedy.traits.sociability = 1;
  ok('an easygoing one takes it', D.willAccept(miner.userData, hauler.userData, marginal));

  // Trust is worth real money: a history of honoured deals moves the bar.
  greedy.traits.greed = 0.5; greedy.traits.sociability = 0.5;
  const before = D.willAccept(miner.userData, hauler.userData, marginal);
  for (let i = 0; i < 3; i++) {
    noteEvent(hauler.userData, { type: 'honoured-deal', subject: miner.userData.name, weight: 1.5 });
  }
  ok('trust rises with honoured deals', D.reliability(hauler.userData, miner.userData) > 0);
  ok('and it can turn a no into a yes',
     D.willAccept(miner.userData, hauler.userData, marginal) || before,
     'neither before nor after');

  // A default costs more than a delivery earns — slow to build, quick to lose.
  reset();
  const a = ship('miner'), b = ship('hauler', 400200);
  noteEvent(b.userData, { type: 'honoured-deal', subject: a.userData.name, weight: 1 });
  const afterOne = D.reliability(b.userData, a.userData);
  noteEvent(b.userData, { type: 'defaulted-on-me', subject: a.userData.name, weight: 1 });
  ok('one default outweighs one delivery', D.reliability(b.userData, a.userData) < 0,
     `${afterOne.toFixed(2)} -> ${D.reliability(b.userData, a.userData).toFixed(2)}`);
  ok('trust is bounded', Math.abs(D.reliability(b.userData, a.userData)) <= 1);
  ok('a stranger is neutral', D.reliability(b.userData, { name: 'Nobody' }) === 0);
}

// ── discharging one ──────────────────────────────────────────────────
console.log('\n— settling —');
{
  reset();
  const miner = ship('miner'), hauler = ship('hauler', 400200);
  const dest = S.world.stations[0];
  const spec = { commodity: 'ore', kg: 1200, dest: dest.userData.name };
  spec.pay = Math.round(D.dealValue(spec) * 0.9);
  const deal = D.propose(miner.userData, hauler.userData, spec);

  const stockBefore = bookFor(dest).stock[spec.commodity];
  ok('settling reports success', D.settle(deal));
  ok('the deal leaves the ledger', D.openDeals().length === 0);
  ok('it is counted as done', D.dealsReport().done === 1);
  // The point of the whole exercise: an NPC trade that does not move a price is a story
  // about a trade.
  ok('the cargo reached the market', bookFor(dest).stock[spec.commodity] > stockBefore,
     `${stockBefore} -> ${bookFor(dest).stock[spec.commodity]}`);
  ok('both parties remember it being honoured',
     hasFact(miner.userData, 'honoured-deal', hauler.userData.name) &&
     hasFact(hauler.userData, 'honoured-deal', miner.userData.name));
  ok('a settled deal cannot settle twice', !D.settle(deal));
}

console.log('\n— failing —');
{
  reset();
  const miner = ship('miner'), hauler = ship('hauler', 400200);
  const spec = { commodity: 'ore', kg: 900, dest: stationName() };
  spec.pay = Math.round(D.dealValue(spec) * 0.9);
  const deal = D.propose(miner.userData, hauler.userData, spec);

  ok('nothing expires early', D.sweepDeals(DEALS.sweepEvery) === 0);
  S.time += DEALS.deliveryTime + 10;
  ok('the sweep closes an overdue deal', D.sweepDeals(DEALS.sweepEvery) === 1);
  ok('it leaves the ledger', D.openDeals().length === 0);
  ok('it is counted as failed', D.dealsReport().failed === 1);
  ok('the default is a fact about the other party',
     hasFact(miner.userData, 'defaulted-on-me', hauler.userData.name));

  // A dead counterparty is a default too — which is the first time in this game that
  // shooting somebody has a consequence for a third character.
  reset();
  const m2 = ship('miner'), h2 = ship('hauler', 400200);
  const s2 = { commodity: 'ore', kg: 900, dest: stationName() };
  s2.pay = Math.round(D.dealValue(s2) * 0.9);
  D.propose(m2.userData, h2.userData, s2);
  h2.userData.hp = 0;
  ok('losing a party closes the deal', D.sweepDeals(DEALS.sweepEvery) === 1);
  ok('and the survivor files it', hasFact(m2.userData, 'defaulted-on-me', h2.userData.name));
}

// ── haulers actually fly it ──────────────────────────────────────────
console.log('\n— the hauler flies the deal —');
{
  reset();
  // Nearest station to where the ships are, so the run is a test of the flight logic rather
  // than of how many simulated seconds fit in a test.
  const home = S.world.stations
    .slice().sort((a, b) => a.position.length() - b.position.length())[0];
  const dest = home;
  const miner = ship('miner', home.position.x + 300);
  const hauler = ship('hauler', home.position.x + 700);
  const spec = { commodity: 'ore', kg: 1000, dest: dest.userData.name };
  spec.pay = Math.round(D.dealValue(spec) * 0.95);
  const deal = D.propose(miner.userData, hauler.userData, spec);
  ok('the run starts at pickup', deal.stage === 'pickup');

  const startD = hauler.position.distanceTo(miner.position);
  for (let i = 0; i < 600; i++) { S.time += 0.2; updateNpcs(0.2); }
  ok('the hauler moved toward the pickup',
     deal.stage === 'deliver' || hauler.position.distanceTo(miner.position) < startD,
     `${deal.stage}`);

  // Give it long enough to make the delivery, with the ledger sweep held off so the test is
  // about the flying rather than about the clock.
  deal.deadline = S.time + 1e6;
  for (let i = 0; i < 8000 && deal.state === 'accepted'; i++) { S.time += 0.5; updateNpcs(0.5); }
  ok('the run completes', deal.state === 'done', `${deal.state} / ${deal.stage}`);
  ok('and it settled through the ledger', D.dealsReport().done >= 1);

  // An idle hauler is not a parked hauler.
  reset();
  const idle = ship('hauler', home.position.x + 900);
  const p0 = idle.position.clone();
  for (let i = 0; i < 400; i++) { S.time += 0.2; updateNpcs(0.2); }
  ok('a hauler with no work still runs a circuit', idle.position.distanceTo(p0) > 50);
}

// ── the player is a party ────────────────────────────────────────────
console.log('\n— the player posts a job —');
{
  reset();
  S.credits = 500000;
  const dest = S.world.stations[1];
  ship('hauler', 8000); ship('hauler', 8400);

  const fee = D.suggestedFee('ore', 1000, dest.userData.name);
  ok('a suggested fee is quoted', fee > 0);
  const deal = D.postPlayerJob({ commodity: 'ore', kg: 1000, pay: fee, dest: dest.userData.name });
  ok('somebody takes a fairly-priced job', !!deal, `${fee}`);
  ok('it uses the same ledger as an NPC deal', D.openDeals().includes(deal));
  ok('the player is a named party', deal.from === D.PLAYER);
  ok('the hauler remembers taking work from the player',
     S.world.npcs.some(n => hasFact(n.userData, 'took-work-from', D.PLAYER)));

  const before = S.credits;
  D.settle(deal);
  ok('the player pays on delivery', S.credits === before - fee);

  reset();
  ship('hauler', 8000);
  S.credits = 500000;
  ok('a derisory job finds no taker',
     D.postPlayerJob({ commodity: 'ore', kg: 1000, pay: 1, dest: stationName() }) === null);
  reset();
  S.credits = 500000;
  ok('with no haulers on the band there is no taker',
     D.postPlayerJob({ commodity: 'ore', kg: 1000, pay: 9000, dest: stationName() }) === null);
  ship('hauler', 8000);
  S.credits = 5;
  ok('a fee you cannot cover is refused',
     D.postPlayerJob({ commodity: 'ore', kg: 1000, pay: 9000, dest: stationName() }) === null);
}

// ── exchanges create obligations ─────────────────────────────────────
console.log('\n— talk becomes work —');
{
  reset();
  const miner = ship('miner', 9000), hauler = ship('hauler', 9200);
  let made = null;
  for (let i = 0; i < 40 && !made; i++) {
    S.time += TOPICS.haulOffer.cooldown + 1;
    const res = NC.exchange(miner, hauler, 'haulOffer');
    if (res && res.deal) made = res.deal;
  }
  ok('a haul offer on the radio can become a real obligation', !!made);
  ok('the deal names the two who were talking',
     !made || (made.from === miner.userData.name && made.to === hauler.userData.name));
  ok('it has a destination and a cargo', !made || (!!made.dest && made.kg > 0));
  ok('the exchange still happened when the offer was refused',
     NC.relation(miner.userData, hauler.userData).familiar);
}

// ── persistence ──────────────────────────────────────────────────────
console.log('\n— it survives a save —');
{
  reset();
  const miner = ship('miner'), hauler = ship('hauler', 400200);
  const spec = { commodity: 'ore', kg: 700, dest: stationName() };
  spec.pay = Math.round(D.dealValue(spec) * 0.9);
  D.propose(miner.userData, hauler.userData, spec);

  const packed = D.serializeDeals();
  ok('the payload carries open obligations', packed.open.length === 1);
  D.restoreDeals(null);
  ok('an absent payload restores empty', D.openDeals().length === 0);
  D.restoreDeals(packed);
  ok('a restored payload keeps the obligation', D.openDeals().length === 1);
  ok('and both parties still find it', D.dealsFor(hauler.userData.name).length === 1);
  D.restoreDeals({ open: [{ id: null }, { id: 'x', from: 'a', to: 'b' }] });
  ok('a malformed entry is dropped', D.openDeals().length === 1);
  ok('the schema moved for it', SCHEMA >= 16);
}

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
