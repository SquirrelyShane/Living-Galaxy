// Living Galaxy — the boardroom: contracting as a company rather than as a pilot.
//
// ## The hole this closes
//
// v1.02.39 gave every station a named desk, three tiers of work and a gate the career
// ladder opens. It was tested, it was green, and **an executive could not reach any of it.**
//
// The contract board lives in the dock overlay. Reaching it means docking, docking means
// flying, and the whole point of the career established at v1.02.31 is that a founder does
// not fly. `S.docked` is set to the company HQ at creation, so an executive is technically
// standing in exactly one station forever, and there is no button on the command deck that
// opens its board. The entire progression loop the arc has been building since .36 —
// standing with nine powers, five rungs, tiered work — was reachable by five careers and
// invisible to the sixth, which is the one the arc is *about*.
//
// That is the same fault as the flight HUD in .31, one layer up: a screen designed for a
// pilot, handed to somebody who is not one, and technically present.
//
// ## What contracting as a company means
//
// Not "the same board with the docking requirement removed". A pilot accepts a haul and the
// load goes into *their* hold; an executive has no hold, and the hull that does have one is
// three hundred kilometres away working an objective. So an office contract is a different
// act with the same paperwork:
//
//   1. You see **every desk in the system at once** — which is the decision the per-power
//      board created and the dock UI cannot express, because it only ever shows the one
//      station you are standing in. Choosing whose work to take *is* the corp-war decision.
//   2. Accepting **assigns a hull**. The contract and a fleet objective are created together
//      and share a fate: the hull flies it, and what the hull delivers is what the contract
//      is credited for.
//   3. A contract nobody can fly is refused **before** it is accepted, with the reason. An
//      executive holding a haul with no free freighter is holding a deadline they cannot
//      meet, and .39's own rule is that abandoning costs.
//
// ## Why the mirror rather than a merge
//
// Contract progress and fleet-order progress are two counters that mean the same thing, and
// this file copies one onto the other every frame. The alternative — teaching
// `updateContracts()` to read fleet orders directly — was the first design, and it is worse:
// it makes the contract system depend on the fleet system for every career, including the
// five that have no fleet at all. The mirror is one function, in the file that owns the
// join, and it can be deleted without either side noticing.

import { S } from '../../core/state.js';
import { boardFor, issuerOf, eligibility, acceptContract, acceptBlocker, activeContracts,
         abandonContract } from '../trade/contracts.js';
import { POWERS } from '../../data/factions.js';
import { fleetRoster } from './fleet.js';
import { dispatchFleet, fleetOrders, recallFleet, FLEET_ORDER_TYPES } from './orders.js';
import { standingWith, playerDossier } from './dossier.js';
import { toast, status } from '../../core/notify.js';

/**
 * How a piece of contract work becomes a piece of fleet work.
 *
 * `count` names the field on a fleet order that means "how much of this job is done", which
 * differs by job and is exactly the thing a generic mapping would get wrong: a hauler is
 * measured in kilograms delivered, a hunter in hostiles deterred, a surveyor in bodies
 * reported. Which hulls may fly it is *not* here — see `rolesFor()`.
 */
export const CONTRACT_WORK = {
  haul:   { order: 'logistics', count: 'delivered', label: 'a freighter or a trader' },
  supply: { order: 'logistics', count: 'delivered', label: 'a freighter or a trader' },
  // A survey contract asks for N bodies resolved; `survey_pass` deepens the assay on one
  // body at a time and reports `bodiesDone` — a counter the step already keeps as
  // `workDone` per body. Counted in completed assays, not in seconds on station: a hull
  // parked over a rock for an hour has surveyed one thing.
  survey: { order: 'survey_pass', count: 'bodiesDone', label: 'a prospector or a trader' },
  // Kills, not `deterred` — that is the picket's counter, and a bounty contract is not
  // satisfied by frightening somebody off.
  bounty: { order: 'hunt',      count: 'kills',     label: 'a gun' }
  // **`salvage` is deliberately absent, and the suite is why.**
  //
  // The obvious entry is `{ order: 'extract', count: 'sweeps' }` — `extract` already sends a
  // hull somewhere and has it work. It was written, and `test/boardroom.mjs` rejected it in
  // one line: the check asserts that the counter a contract type names is a field the work
  // step actually writes, and `extract` writes tonnage mined, not sweeps of a debris field.
  //
  // Wiring it anyway would have produced a hull that flies to a graveyard, mines it as though
  // it were a rock, and reports progress against a counter nothing increments — a fleet order
  // that looks like it is working and never completes. So a salvage contract is flown by the
  // player until `systems/fleet-work.js` grows a step that can actually work a field. That is
  // a real gap and it is better as a visible one.
};

/**
 * Which hull roles may fly a given contract — read from the fleet order it becomes, not
 * restated here.
 *
 * `dispatchFleet()` already owns this rule (`FLEET_ORDER_TYPES[type].requires`) and enforces
 * it at dispatch. Copying the six role keys into the table above would have been a second
 * source of truth for the same fact, and the whole reason this office refuses *before*
 * accepting is that it must give the same answer dispatch would.
 */
export const rolesFor = type => {
  const w = CONTRACT_WORK[type];
  return (w && (FLEET_ORDER_TYPES[w.order] || {}).requires) || [];
};

const acceptBlockerFor = c => acceptBlocker(c, { toFleet: true });

/** Every desk in the system, and everything each of them is posting. */
export function systemBoard() {
  const me = playerDossier();
  const desks = new Map();
  for (const st of (S.world.stations || [])) {
    const key = issuerOf(st);
    const power = POWERS[key];
    if (!power) continue;
    if (!desks.has(key)) {
      desks.set(key, {
        power: key, name: power.name, short: power.short, color: power.color,
        bloc: power.bloc, doctrine: power.doctrine, seat: power.seat,
        standing: Math.round(standingWith(me, key)),
        stations: [], offers: []
      });
    }
    const d = desks.get(key);
    d.stations.push(st.userData.name);
    for (const c of boardFor(st)) {
      const gate = eligibility(c);
      d.offers.push({
        contract: c,
        station: st.userData.name,
        eligible: gate.ok,
        why: gate.why,
        missing: gate.missing,
        work: CONTRACT_WORK[c.type] || null
      });
    }
  }
  // Best-regarded desk first. A board sorted by station order is sorted by nothing a player
  // cares about; sorted by standing, the top of the screen is where your work is cheapest
  // to get and the bottom is who you have been annoying.
  return [...desks.values()].sort((a, b) => b.standing - a.standing);
}

/** Company hulls that could take this piece of work right now. */
export function crewFor(c) {
  const w = CONTRACT_WORK[c && c.type];
  if (!w) return [];
  const roles = rolesFor(c.type);
  return fleetRoster().filter(h =>
    h.alive && !h.busy && !h.refitting && roles.includes(h.role));
}

/**
 * Why this contract cannot be tendered to the fleet — or null.
 *
 * Deliberately checked before acceptance, not after. `acceptContract()` is a promise with a
 * deadline and a standing penalty on it, and letting an executive accept work that no hull
 * in the company can perform is handing them a guaranteed forfeit.
 */
export function tenderBlocker(c, hull) {
  if (!c) return 'No such contract';
  const w = CONTRACT_WORK[c.type];
  if (!w) return `No company hull does ${c.type} work`;
  const gate = eligibility(c);
  if (!gate.ok) return gate.why;
  // Everything the ordinary accept path would refuse over — the slate cap, an expired
  // offer — asked in the office's own terms, so a null here really does mean it will go.
  const ordinary = acceptBlockerFor(c);
  if (ordinary) return ordinary;
  if (hull) {
    if (!hull.alive) return `${hull.name} is a wreck`;
    if (hull.busy) return `${hull.name} is already out`;
    if (hull.refitting) return `${hull.name} is in the yard`;
    if (!rolesFor(c.type).includes(hull.role)) return `${c.type} work needs ${w.label}`;
    return null;
  }
  if (!crewFor(c).length) return `No free hull — needs ${w.label}`;
  return null;
}

/**
 * Take the work, and put a hull on it.
 *
 * The two acts are one act. A contract accepted without an assignment is a deadline nobody
 * is flying towards, and a fleet objective without a contract behind it earns nothing — so
 * if either half fails, neither happens.
 */
export function tender(c, hull) {
  const pick = hull || crewFor(c)[0];
  const why = tenderBlocker(c, pick);
  if (why) { toast(why); return null; }

  if (!acceptContract(c, { toFleet: true })) return null;

  const w = CONTRACT_WORK[c.type];
  // `contractId` is the hull's own paperwork, and passing it is what makes `bindHull()`
  // record the objective back onto the roster entry. Without it the ship flies the job and
  // still reports itself free — so the same freighter could be tendered to a second contract
  // it has no intention of flying. Caught by the suite as "the hull is no longer free".
  const asset = { id: pick.id, role: pick.role, name: pick.name, contractId: pick.id };
  const order = dispatchFleet(w.order, asset, {
    mode: 'active',
    // Until the job is done, not for ninety seconds. A contract has its own deadline and
    // that is the clock that should end this, not a default duration belonging to the order
    // type — which is precisely the bug .32 fixed for passive orders and would have
    // reintroduced here for active ones.
    durationSec: 0,
    quotaKg: c.type === 'haul' || c.type === 'supply' ? c.target : 0,
    target: c.dest || c.station,
    // `params.jobId`, not `contractId`. On a fleet order `contractId` already means the
    // *hull's* own contract — the paperwork that hired the ship — and overloading it here
    // would silently rebind a hull to a haul job.
    // Each job type carries its quota in its own unit and the work step reads the one it
    // understands — a single generic `quota` would have meant kilograms of hostile. These
    // go through `params` because that is the channel `dispatchFleet()` hoists from, and
    // `jobId` rides along undeclared, which is exactly what leaves it in `order.params`.
    params: {
      jobId: c.id,
      quotaKills: c.type === 'bounty' ? c.target : undefined,
      quotaBodies: c.type === 'survey' ? c.target : undefined
    }
  });

  if (typeof order === 'string' || !order) {
    // The dispatch was refused after the contract was taken. Give the promise back rather
    // than leaving the player holding a deadline nothing is flying toward.
    abandonContract(c);
    toast(typeof order === 'string' ? order : 'The fleet could not take it');
    return null;
  }

  c.tendered = { orderId: order.id, hullId: pick.id, hullName: pick.name };
  status(`${pick.name} → ${c.title}`);
  toast(`${pick.name} is on it — ${c.title}`, 4600);
  return order;
}

/** The fleet order flying a given contract, if one is. */
const orderForContract = c =>
  fleetOrders().find(o => o.params && o.params.jobId === (c && c.id)) || null;

/**
 * Copy what the hull has done onto the contract that hired it.
 *
 * Called once a frame from the sim. `updateContracts()` then completes and pays in the
 * ordinary way, so an office contract and a flown one settle down exactly the same path —
 * including the standing, the corp war and the career rung.
 */
export function updateBoardroom() {
  const held = activeContracts();
  if (!held.length) return;
  for (const c of held) {
    if (!c.tendered) continue;
    const order = fleetOrders().find(o => o.id === c.tendered.orderId);
    if (!order) {
      // The hull was recalled, destroyed, or the order finished and was reaped. The contract
      // keeps whatever it earned and its own deadline decides the rest — no silent forfeit,
      // because the player may still put another hull on it.
      c.tendered = null;
      continue;
    }
    const w = CONTRACT_WORK[c.type];
    if (!w) continue;
    const done = order[w.count] || 0;
    // Never move a contract backwards. A recalled-and-redispatched hull starts a fresh
    // counter, and a progress bar that falls is a bug report.
    if (done > c.progress) c.progress = done;
  }
}

/** Stand a hull down without dropping the contract it was flying. */
export function standDown(c) {
  if (!c || !c.tendered) return false;
  recallFleet(c.tendered.orderId);
  c.tendered = null;
  return true;
}

/** Everything the boardroom screen needs, in one call. */
export function boardroomReport() {
  const desks = systemBoard();
  const held = activeContracts().map(c => {
    const order = c.tendered && fleetOrders().find(o => o.id === c.tendered.orderId);
    return {
      contract: c,
      hull: c.tendered ? c.tendered.hullName : null,
      flying: !!order,
      orderName: order ? (FLEET_ORDER_TYPES[order.type] || {}).name : null,
      progress: c.target ? Math.max(0, Math.min(1, c.progress / c.target)) : 0
    };
  });
  return {
    desks,
    held,
    offers: desks.reduce((a, d) => a + d.offers.length, 0),
    open: desks.reduce((a, d) => a + d.offers.filter(o => o.eligible).length, 0),
    idle: fleetRoster().filter(h => h.alive && !h.busy && !h.refitting).length
  };
}
