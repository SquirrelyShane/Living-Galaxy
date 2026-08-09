// Living Galaxy — the ledger: things two characters agree to.
//
// v1.00.90 gave NPCs a channel and a memory of each other. This is what they can now *do*
// with it. A deal is an obligation: two named parties, terms, a clock, and a settlement that
// files a memory on both sides. It is the difference between a social layer that is real
// state and one that is real state which mostly does not act.
//
// ── every obligation must be able to fail ────────────────────────────
// The open-loop trap named in the roadmap: a contract system that only ever *creates*
// obligations fills the world with commitments nobody discharges. Every deal here carries an
// expiry and a failure path, and both outcomes file memory — a default is as much a fact
// about somebody as delivery is. `sweepDeals()` is what actually enforces that, and it runs
// whether or not anybody is watching the ship it concerns.
//
// ── reliability is derived, like everything else here ────────────────
// Whether a character will deal with you is read out of their memory of you, exactly the way
// `wariness()` in npc-tactics.js reads whether they will fight you. Same table, same decay,
// different question. There is no separate trust score to migrate or keep in step.
//
// ── the player is a party, not an audience ───────────────────────────
// `proposeToPlayer` and `postPlayerJob` use the same records and the same settlement path as
// two NPCs dealing with each other. The asymmetry worth removing is that contracts have only
// ever been issued *to* the player by the world; a pilot with a hold full of ice and no time
// should be able to put it on the band and have somebody take it.

import { S } from '../core/state.js';
import { DEALS } from '../core/config.js';
import { stream } from '../core/rng.js';
import { personaFor, noteEvent } from './npc-brain.js';
import { relation } from './npc-comms.js';
import { recall } from '../npc-avatar/core/memory.js';
import { COMMODITIES } from '../core/config.js';
import { applyTrade, marketPrice } from './market.js';
import { transmit } from './comms.js';
import { toast } from '../ui/toast.js';
import { unloadHold } from './holds.js';

let rng = null;
let sweepT = 0;
let seq = 1;

const bag = () => (S.deals = S.deals || { open: [], done: 0, failed: 0 });

export const openDeals = () => bag().open;
export const dealsReport = () => ({ open: bag().open.length, done: bag().done, failed: bag().failed });

/** Deals this character is party to, either side. */
export const dealsFor = name => bag().open.filter(d => d.from === name || d.to === name);

// ── reliability ──────────────────────────────────────────────────────

/**
 * How much `a` trusts `b`, -1..1, read out of `a`'s own memory of `b`.
 *
 * Honoured deals add, defaults subtract hard — a default costs several deliveries, because
 * the asymmetry is the point: a reputation for reliability is slow to build and quick to
 * lose, which is what makes honouring one worth anything.
 */
export function reliability(a, b) {
  const p = personaFor(a);
  if (!p || !b || !b.name) return 0;
  const facts = recall(p.memory, { subject: b.name }, 8, S.time, DEALS.memoryHalfLife);
  let t = 0;
  for (const f of facts) {
    const w = f.weight || 1;
    if (f.type === 'honoured-deal') t += DEALS.trustPerDelivery * w;
    else if (f.type === 'defaulted-on-me') t -= DEALS.trustPerDefault * w;
    else if (f.type === 'owed-favour') t += DEALS.trustPerFavour * w;
  }
  return Math.max(-1, Math.min(1, t));
}

/**
 * Will `b` take this deal from `a`?
 *
 * Three inputs and they pull in different directions: how well the pay compares to what the
 * cargo is worth (greed), how much the character trusts the other party (reliability plus
 * the warmth of the relationship), and their own disposition. A stranger with a good offer
 * and a friend with a poor one should both be plausible yeses.
 */
export function willAccept(a, b, deal) {
  const p = personaFor(b);
  const greed = p ? p.traits.greed : 0.5;
  const social = p ? p.traits.sociability : 0.5;

  const worth = Math.max(1, dealValue(deal));
  const offer = deal.pay / worth;                       // 1.0 = paying exactly market
  const trust = reliability(b, a) + relation(b, a).warmth * DEALS.warmthWeight;

  // A greedy character needs a better rate; a sociable one will do a favour at a worse one.
  const bar = DEALS.baseBar + greed * DEALS.barPerGreed
                            - social * DEALS.barPerSociability
                            - trust * DEALS.barPerTrust;
  return offer >= bar;
}

/** What the cargo on a deal is actually worth, so an offer can be judged against something. */
export function dealValue(deal) {
  const com = COMMODITIES[deal.commodity];
  if (!com) return deal.kg || 1;
  const st = S.world.stations.find(s => s.userData.name === deal.dest);
  const unit = st ? marketPrice(st, deal.commodity) : (com.base || 1);
  return Math.max(1, unit * (deal.kg || 0));
}

// ── making one ───────────────────────────────────────────────────────

/**
 * Offer a deal. Returns the record if it was accepted, null if it was declined — and a
 * decline is filed too, because being turned down by somebody is a thing you remember about
 * them and it is what stops a character asking the same person every ninety seconds.
 */
export function propose(fromU, toU, spec) {
  if (!fromU || !toU || !fromU.name || !toU.name || fromU === toU) return null;
  if (dealsFor(toU.name).length >= DEALS.maxPerCharacter) return null;

  if (!rng) rng = stream('deals');
  const deal = Object.assign({
    id: `d${seq++}`,
    kind: 'haul',
    from: fromU.name, to: toU.name,
    commodity: 'ore', kg: 0, pay: 0,
    dest: null,
    state: 'offered',
    posted: S.time,
    expires: S.time + DEALS.life,
    stage: 'pickup'
  }, spec || {});

  if (!willAccept(fromU, toU, deal)) {
    noteEvent(fromU, { type: 'declined-me', subject: toU.name, weight: 0.6 });
    return null;
  }

  deal.state = 'accepted';
  deal.accepted = S.time;
  deal.deadline = S.time + DEALS.deliveryTime;
  bag().open.push(deal);

  noteEvent(fromU, { type: 'dealt-with', subject: toU.name, weight: 0.8 });
  noteEvent(toU, { type: 'took-work-from', subject: fromU.name, weight: 0.8 });
  return deal;
}

// ── discharging one ──────────────────────────────────────────────────

/** The party records, or nulls for a party who is no longer in the world. */
function partiesOf(deal) {
  const find = name => {
    if (name === PLAYER) return PLAYER_U;
    const n = S.world.npcs.find(x => x.userData && x.userData.name === name && x.userData.hp > 0);
    return n ? n.userData : null;
  };
  return { fromU: find(deal.from), toU: find(deal.to) };
}

export const PLAYER = 'player';
const PLAYER_U = { name: PLAYER, faction: 'independent', role: 'player' };

/**
 * Deliver. The cargo lands on the destination market, which is the point of the whole
 * exercise — an NPC trade that does not move a price is a story about a trade.
 */
export function settle(deal) {
  if (!deal || deal.state !== 'accepted') return false;
  const { fromU, toU } = partiesOf(deal);

  const st = S.world.stations.find(s => s.userData.name === deal.dest);
  // v1.01.70: what arrives is what the carrier is actually carrying, not what the paperwork
  // says. Before this the mass was conjured onto the destination market at settlement, which
  // meant a hauler that had been raided down to an empty hold still delivered in full — the
  // one place where making cargo real had to change an existing rule rather than add one.
  //
  // A carrier that has been emptied still *settles*. The deal is discharged, both parties
  // file the memory, and the pay is the pay: they flew the run. What is missing is the
  // cargo, which is exactly the thing the raider took.
  let landed = deal.kg;
  if (toU && toU.name !== PLAYER && toU.hold) {
    landed = unloadHold(toU, deal.commodity, deal.kg);
    deal.landed = landed;
  }
  if (st && landed > 0 && COMMODITIES[deal.commodity]) {
    // `selling: true` from the *station's* point of view — cargo arrived, so its stock
    // rises and its price for that commodity comes down. Reading this flag as "the player
    // is selling" is the easy mistake: it made a delivery drain the destination.
    applyTrade(st, deal.commodity, landed, true);
  }

  deal.state = 'done';
  deal.settled = S.time;
  bag().done++;
  drop(deal);

  if (fromU && toU) {
    noteEvent(fromU, { type: 'honoured-deal', subject: toU.name, weight: 1.2 });
    noteEvent(toU, { type: 'honoured-deal', subject: fromU.name, weight: 0.8 });
  }
  // The player's side is credits rather than memory.
  if (deal.from === PLAYER) S.credits -= deal.pay;
  if (deal.to === PLAYER) { S.credits += deal.pay; toast(`Delivered — ${deal.pay} cr`); }
  if (deal.from === PLAYER && landed < deal.kg - 1) {
    toast(`${deal.to} arrived light — ${Math.round(landed)} of ${Math.round(deal.kg)} kg`);
  }
  return true;
}

/**
 * Fail. A default is a fact about somebody, not a silent cleanup — which is what makes the
 * ledger a ledger rather than a queue.
 */
export function defaultOn(deal, reason = 'expired') {
  if (!deal || deal.state !== 'accepted' && deal.state !== 'offered') return false;
  const { fromU, toU } = partiesOf(deal);
  deal.state = 'failed';
  deal.reason = reason;
  bag().failed++;
  drop(deal);

  // Filed on whoever is still here, against the name of whoever is not. A hauler shot down
  // mid-run is exactly the case that matters, and requiring both parties to be alive would
  // have made the one consequence worth having unreachable.
  if (fromU && fromU.name !== PLAYER) {
    noteEvent(fromU, { type: 'defaulted-on-me', subject: deal.to, weight: 1.5 },
              { driftAxis: 'sociability', driftAmount: -0.02 });
  }
  if (toU && toU.name !== PLAYER && reason !== 'party lost') {
    noteEvent(toU, { type: 'let-down', subject: deal.from, weight: 0.8 });
  }
  if (deal.from === PLAYER) toast(`Contract lapsed — ${deal.to} did not deliver`);
  if (deal.to === PLAYER) toast('You let a contract lapse');
  return true;
}

const drop = deal => {
  const list = bag().open;
  const i = list.indexOf(deal);
  if (i >= 0) list.splice(i, 1);
};

/**
 * Advance the ledger. Deals expire on their own clock and die with either party, so a raider
 * killing a hauler mid-run is a default that the other party remembers — which is the first
 * time in this game that shooting somebody has a consequence for a third character.
 */
export function sweepDeals(dt) {
  sweepT += dt;
  if (sweepT < DEALS.sweepEvery) return 0;
  sweepT = 0;

  let closed = 0;
  for (const deal of bag().open.slice()) {
    const { fromU, toU } = partiesOf(deal);
    if (!fromU || !toU) { defaultOn(deal, 'party lost'); closed++; continue; }
    if (S.time > (deal.deadline || deal.expires)) { defaultOn(deal, 'expired'); closed++; }
  }
  return closed;
}

// ── the player's side ────────────────────────────────────────────────

/**
 * Put a job on the band. Any hauler in the system may take it, judged by the same
 * `willAccept` an NPC uses on another NPC — which is the whole point of routing the player
 * through the same record type rather than a parallel contract system.
 */
export function postPlayerJob({ commodity, kg, pay, dest }) {
  const haulers = S.world.npcs.filter(n => n.userData.role === 'haul' && n.userData.hp > 0);
  if (!haulers.length) { toast('No haulers on the band'); return null; }
  if (S.credits < pay) { toast('You cannot cover that fee'); return null; }

  const spec = { kind: 'haul', commodity, kg, pay, dest, from: PLAYER };
  // Best offer first: the hauler most likely to say yes is the one who trusts you most.
  haulers.sort((a, b) => reliability(b.userData, PLAYER_U) - reliability(a.userData, PLAYER_U));
  for (const h of haulers) {
    const deal = propose(PLAYER_U, h.userData, spec);
    if (deal) {
      transmit({ from: h.userData.name, faction: h.userData.faction, channel: 'trade',
                 kind: 'chatter', speaker: h.userData.name,
                 text: `Taking your load — ${kg} kg to ${dest}.` });
      return deal;
    }
  }
  toast('Nobody took the job at that rate');
  return null;
}

/** What a job would have to pay for anyone to look at it. Shown before you post one. */
export function suggestedFee(commodity, kg, dest) {
  const worth = dealValue({ commodity, kg, dest });
  return Math.round(worth * DEALS.baseBar * DEALS.suggestMargin);
}

// ── persistence ──────────────────────────────────────────────────────
export const serializeDeals = () => ({ open: bag().open, done: bag().done, failed: bag().failed });
export function restoreDeals(d) {
  S.deals = {
    open: (d && Array.isArray(d.open)) ? d.open.filter(x => x && x.id && x.from && x.to) : [],
    done: (d && d.done) || 0,
    failed: (d && d.failed) || 0
  };
  seq = S.deals.open.length + 1;
  return true;
}
