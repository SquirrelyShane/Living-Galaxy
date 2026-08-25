// Living Galaxy — the contract board.
//
// This is deliberately a different thing from the agent chain in systems/missions.js.
// That is five hand-written stories with a fixed order and a guaranteed payoff; this is a
// generated market of offers that expire whether or not you look at them, posted by
// stations that have their own reasons, gated on what those stations think of you.
// Sharing one engine between the two would have meant a story engine with expiry timers
// bolted on, or a market with a plot, and both are worse than two small files.
//
// The design rule that shapes everything below: **refusing is free, abandoning is not.**
// If accepting cost nothing, the dominant strategy is to accept every offer and see which
// ones happen to complete, and the board stops being a decision. Accepting is a promise
// with a deadline and a standing penalty attached.

import { S, cargoFree } from '../core/state.js';
import { CONTRACTS, COMMODITIES } from '../core/config.js';
import { stream } from '../core/rng.js';
import { standing, adjust, blocOf } from './reputation.js';
import { practice } from './character.js';
import { crewEvent } from './crew.js';
import { toast, status } from '../ui/toast.js';
import { sfx } from './audio.js';

let refreshT = 0;

const TYPE_KEYS = Object.keys(CONTRACTS.types);
const rng = () => stream('contracts');

// ── generation ───────────────────────────────────────────────────────

function pickType(r) {
  const total = TYPE_KEYS.reduce((a, k) => a + CONTRACTS.types[k].weight, 0);
  let roll = r.next() * total;
  for (const k of TYPE_KEYS) {
    roll -= CONTRACTS.types[k].weight;
    if (roll <= 0) return k;
  }
  return TYPE_KEYS[0];
}

/** Which bloc a station posts on behalf of. */
export function issuerOf(station) {
  const cat = station.userData.category;
  if (cat === 'military') return 'coalition';
  if (cat === 'economic') return 'coalition';
  return 'independent';
}

function otherStation(r, from) {
  const list = S.world.stations.filter(s => s !== from);
  if (!list.length) return from;
  return list[Math.floor(r.next() * list.length)];
}

function makeContract(r, station, now) {
  const type = pickType(r);
  const spec = CONTRACTS.types[type];
  const issuer = issuerOf(station);
  const rep = standing(issuer);

  const int = (lo, hi) => Math.round(lo + r.next() * (hi - lo));
  const c = {
    id: `${type}-${Math.floor(r.next() * 1e9).toString(36)}`,
    type, issuer,
    station: station.userData.name,
    posted: now,
    expires: now + int(CONTRACTS.life[0], CONTRACTS.life[1]),
    accepted: null, deadline: null,
    progress: 0, target: 1,
    pay: int(spec.pay[0], spec.pay[1]),
    rep: spec.rep,
    skill: spec.skill,
    done: false, failed: false
  };

  if (type === 'haul' || type === 'supply') {
    const keys = Object.keys(COMMODITIES);
    c.commodity = keys[Math.floor(r.next() * keys.length)];
    c.target = int(spec.kg[0], spec.kg[1]);
    const dest = type === 'haul' ? otherStation(r, station) : station;
    c.dest = dest.userData.name;
    c.title = type === 'haul'
      ? `Haul ${c.target} kg ${COMMODITIES[c.commodity].name.toLowerCase()} to ${c.dest}`
      : `Supply ${c.target} kg ${COMMODITIES[c.commodity].name.toLowerCase()}`;
    c.brief = type === 'haul'
      ? `${station.userData.name} consigns a load to you. Carry it to ${c.dest} and hand it over — the fee is the payment, the cargo is not yours to sell.`
      : `${station.userData.name} is short. Bring it in and sell it here.`;
  } else if (type === 'bounty') {
    c.target = int(spec.kills[0], spec.kills[1]);
    c.title = `Bounty — ${c.target} hostile${c.target > 1 ? 's' : ''}`;
    c.brief = 'Raiders in the lanes. Destroy them; the board does not care where.';
  } else {
    c.target = int(spec.targets[0], spec.targets[1]);
    c.title = `Survey ${c.target} bod${c.target > 1 ? 'ies' : 'y'}`;
    c.brief = 'Resolve detail on bodies nobody has bothered to look at properly.';
  }

  // Standing tilts the fee. Someone who likes you pays better for the same work — the
  // same slope that already applies to bounties, so the whole economy leans one way.
  c.pay = Math.round(c.pay * (1 + Math.max(0, rep) * CONTRACTS.payPerStanding));
  c.locked = rep < CONTRACTS.minStanding;
  return c;
}

/** Rebuild one station's board, keeping anything the player has accepted. */
export function refreshBoard(station, now = S.time) {
  const name = station.userData.name;
  if (!S.contracts) S.contracts = { boards: {}, active: [], history: { done: 0, failed: 0 } };
  const r = rng();
  const board = [];
  for (let i = 0; i < CONTRACTS.perStation; i++) board.push(makeContract(r, station, now));
  S.contracts.boards[name] = board;
  return board;
}

export function boardFor(station) {
  if (!S.contracts) initContracts();
  const name = station.userData.name;
  const b = S.contracts.boards[name];
  if (!b) return refreshBoard(station);
  // Expired offers are dropped on read rather than on a timer: nobody needs to be told
  // about a job going stale at a station they are not standing in.
  const live = b.filter(c => c.expires > S.time);
  if (live.length !== b.length) S.contracts.boards[name] = live;
  return live;
}

export function initContracts() {
  S.contracts = { boards: {}, active: [], history: { done: 0, failed: 0 } };
  refreshT = 0;
  for (const st of S.world.stations) refreshBoard(st, 0);
  return S.contracts;
}

// ── accepting ────────────────────────────────────────────────────────

export const activeContracts = () => (S.contracts && S.contracts.active) || [];

export function acceptBlocker(c) {
  if (!c) return 'No such contract';
  if (c.locked) return `${c.issuer} will not deal with you`;
  if (activeContracts().length >= CONTRACTS.maxActive) return `Already holding ${CONTRACTS.maxActive}`;
  if (activeContracts().some(a => a.id === c.id)) return 'Already accepted';
  if (c.expires <= S.time) return 'Offer expired';
  // Haul contracts load the cargo onto the ship at acceptance. Without free hold space
  // the load cannot board, so the offer is blocked rather than accepted into an impossible state.
  if (c.type === 'haul' && c.commodity && c.target > 0) {
    if (cargoFree() < c.target) {
      return `Hold full — need ${c.target} kg free for the load`;
    }
  }
  return null;
}

export function acceptContract(c) {
  const blocked = acceptBlocker(c);
  if (blocked) { toast(blocked); sfx.deny(); return false; }

  const r = rng();
  c.accepted = S.time;
  c.deadline = S.time + Math.round(CONTRACTS.deadline[0] +
    r.next() * (CONTRACTS.deadline[1] - CONTRACTS.deadline[0]));
  c.progress = 0;
  // The baseline is taken at acceptance, so a bounty for three kills means three *more*.
  c.base = baselineFor(c);
  S.contracts.active.push(c);

  // Haul: the station consigns the load onto your ship. You fly it to the destination and
  // hand it over there.
  //
  // `loaded` is what makes this a consignment rather than a gift. The cargo occupies your
  // hold and counts against capacity, but it is not yours to sell — see consignedFor()
  // below and the guard in economy.js sell(). Without that distinction, accepting a haul
  // and selling the load at the station that gave it to you was free money: measured at
  // +12,038 cr against a contract that only paid 8,264, which made abandoning strictly
  // better than delivering.
  if (c.type === 'haul' && c.commodity && c.target > 0) {
    S.cargo[c.commodity] = (S.cargo[c.commodity] || 0) + c.target;
    c.loaded = c.target;
  }

  const board = S.contracts.boards[c.station];
  if (board) S.contracts.boards[c.station] = board.filter(x => x.id !== c.id);

  toast(`Contract accepted — ${c.title}`, 4200);
  status(c.title);
  return true;
}

function baselineFor(c) {
  if (c.type === 'bounty') return { kills: S.player.kills };
  if (c.type === 'survey') return { scans: Object.keys(S.scans || {}).length };
  return { sold: 0 };            // haul/supply are credited by the sell hook
}

export function abandonContract(c) {
  const list = activeContracts();
  const i = list.findIndex(x => x.id === c.id);
  if (i < 0) return false;
  list.splice(i, 1);
  reclaim(c);
  penalise(c, 'abandoned');
  return true;
}

// ── consignment ──────────────────────────────────────────────────────

/**
 * How much of a commodity in the hold belongs to a contract rather than to the pilot.
 *
 * Derived from the active contracts rather than stored alongside the cargo, deliberately:
 * a second number that has to be kept in step with `loaded` is a second number that can
 * drift out of step with it, and this one already persists with the contract.
 */
export function consignedFor(key) {
  let n = 0;
  for (const c of activeContracts()) {
    if (c.type === 'haul' && c.commodity === key) n += c.loaded || 0;
  }
  return Math.min(n, S.cargo[key] || 0);
}

/** What the pilot may actually sell — the hold less anything under consignment. */
export function sellableOf(key) {
  return Math.max(0, (S.cargo[key] || 0) - consignedFor(key));
}

/** Active hauls carrying a load that this station is the destination for. */
export function deliverableAt(station) {
  const name = station && station.userData && station.userData.name;
  if (!name) return [];
  return activeContracts().filter(c =>
    c.type === 'haul' && c.dest === name && (c.loaded || 0) > 0);
}

/**
 * Hand over every load this station is waiting for. Removes the consigned cargo and
 * credits the contract; `updateContracts` sees the progress on its next pass and pays.
 *
 * Delivery is a separate act from selling because the load was never the pilot's to sell.
 * The contract fee is the payment for moving it.
 */
export function deliverConsignment(station = S.docked) {
  const due = deliverableAt(station);
  let moved = 0;
  for (const c of due) {
    const have = Math.min(c.loaded, S.cargo[c.commodity] || 0);
    if (have <= 0) continue;
    S.cargo[c.commodity] -= have;
    c.loaded -= have;
    c.progress += have;
    moved += have;
    toast(`Delivered ${Math.round(have)} kg ${COMMODITIES[c.commodity].name.toLowerCase()} — ${c.title}`, 4200);
  }
  if (moved) sfx.pickup();
  return moved;
}

/**
 * Take back a load that is not going to arrive. Called when a haul is abandoned or
 * expires — the goods were the issuer's, and a failed contract does not turn them into
 * yours. Clamped, because the hold can legitimately have less than was loaded: a raid or
 * a death can empty it, and a pilot cannot hand back what was shot out of them.
 */
function reclaim(c) {
  if (!c || c.type !== 'haul' || !(c.loaded > 0)) return 0;
  const have = Math.min(c.loaded, S.cargo[c.commodity] || 0);
  if (have > 0) S.cargo[c.commodity] -= have;
  const short = c.loaded - have;
  c.loaded = 0;
  if (short > 0.5) {
    status(`${Math.round(short)} kg of the consignment was never recovered`);
  }
  return have;
}

function penalise(c, why) {
  S.contracts.history.failed++;
  const fee = Math.round(c.pay * CONTRACTS.failCredits);
  S.credits = Math.max(0, S.credits - fee);
  adjust(c.issuer, CONTRACTS.failStanding, `contract ${why}`);
  toast(`Contract ${why} — ${c.title}${fee ? ` · −${fee} cr` : ''}`, 5200);
  sfx.deny();
}

// ── progress ─────────────────────────────────────────────────────────

/**
 * Called by economy.js when cargo is sold. Haul and supply contracts are credited here
 * rather than by polling, because "did a sale happen at the right station" is an event
 * and reconstructing it from state each frame would be guesswork.
 */
export function creditDelivery(station, key, kg) {
  for (const c of activeContracts()) {
    // Haul is credited by deliverConsignment(), not by selling. Crediting it here as well
    // double-counted: a pilot who had mined the same commodity could satisfy the contract
    // from their own stock and keep the consignment, collecting the fee and the goods.
    if (c.type !== 'supply') continue;
    if (c.commodity !== key) continue;
    if (c.dest && station.userData.name !== c.dest) continue;
    c.progress += kg;
  }
}

/** Polled once per frame. Cheap: at most CONTRACTS.maxActive predicates. */
export function updateContracts(dt) {
  if (!S.contracts) return;

  refreshT += dt;
  if (refreshT >= CONTRACTS.refresh) {
    refreshT = 0;
    // Refresh one station per cycle rather than all of them, so the board turns over
    // gradually and a player watching one station does not see it blink wholesale.
    const list = S.world.stations;
    if (list.length) refreshBoard(list[Math.floor(rng().next() * list.length)]);
  }

  const active = S.contracts.active;
  for (let i = active.length - 1; i >= 0; i--) {
    const c = active[i];

    if (c.type === 'bounty') c.progress = S.player.kills - c.base.kills;
    else if (c.type === 'survey') c.progress = Object.keys(S.scans || {}).length - c.base.scans;

    if (c.progress >= c.target) { active.splice(i, 1); complete(c); continue; }
    if (S.time > c.deadline) { active.splice(i, 1); reclaim(c); penalise(c, 'expired'); }
  }
}

function complete(c) {
  c.done = true;
  S.contracts.history.done++;
  S.credits += c.pay;
  adjust(c.issuer, c.rep, 'contract completed');
  practice(c.skill, CONTRACTS.practicePerJob);
  crewEvent('contract');
  sfx.pickup();
  toast(`Contract complete — ${c.title} · +${c.pay} cr`, 5200);
  status('Contract complete');
}

// ── reporting and persistence ────────────────────────────────────────

export function contractProgress(c) {
  if (!c || !c.target) return 0;
  return Math.max(0, Math.min(1, c.progress / c.target));
}

export const timeLeft = c => c.deadline ? Math.max(0, c.deadline - S.time) : Math.max(0, c.expires - S.time);

export function serializeContracts() {
  if (!S.contracts) return null;
  return {
    boards: S.contracts.boards,
    active: S.contracts.active,
    history: S.contracts.history
  };
}

export function restoreContracts(data) {
  if (!data) return false;
  S.contracts = {
    boards: data.boards || {},
    active: (data.active || []).filter(c => c && c.id && c.type),
    history: data.history || { done: 0, failed: 0 }
  };
  return true;
}
