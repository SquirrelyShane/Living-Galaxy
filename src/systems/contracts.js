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

import { S } from '../core/state.js';
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
      ? `${station.userData.name} needs a load moved. Deliver to ${c.dest} and sell it there.`
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
  penalise(c, 'abandoned');
  return true;
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
    if (c.type !== 'haul' && c.type !== 'supply') continue;
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
    if (S.time > c.deadline) { active.splice(i, 1); penalise(c, 'expired'); }
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
