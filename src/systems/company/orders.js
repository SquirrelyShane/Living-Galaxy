// Living Galaxy — standing orders.
//
// The ship has always been the only thing that does anything. Everything the player owns —
// a crew of eight, a hold, a planetary complex — sits idle unless the pilot is personally
// flying it somewhere. That is a strange shape for a game about running an operation, and
// it gets stranger the more the player accumulates.
//
// A standing order is work you delegate. You dispatch a team, it takes crew and materials,
// it runs for hours of game time while you are elsewhere, and it comes back with something.
// Crucially it can also come back with *nothing*, or not come back at all — an errand with
// a guaranteed payoff is a button, not a decision.
//
// Three kinds, chosen because they map onto the three things the game already rewards:
//
//   **Scout team**    — finds things. New contacts, contract leads, an unmapped belt.
//   **Survey crew**   — resolves things. Deepens the assay on a world, which the planetary
//                       layer then pays out on forever.
//   **Reclamation**   — recovers things. Strips wrecks and derelicts for materials.
//
// The crew you send are *gone* for the duration: off the roster, not manning a post, not
// available for the fight you did not know was coming. That is the cost, and it is the
// reason sending your two best people is a real decision rather than an obvious one.

import { S } from '../../core/state.js';
import { ORDERS, CRAFT } from '../../core/config.js';
import { stream } from '../../core/rng.js';
import { addMaterial, held, takeMaterial } from '../industry/crafting.js';
import { crewEvent } from '../crew/crew.js';
import { adjust } from './reputation.js';
import { resourcesFor } from '../../data/planetary/index.js';
import { materialName } from '../../data/crafting/index.js';
import { toast, status } from '../../core/notify.js';
import { sfx } from '../platform/audio.js';
import { bindHull, unbindHull } from './fleet.js';
import { stepFleetWork, workReport } from './fleet-work.js';

export const orders = () => (S.orders = S.orders || []);
const rng = () => stream('orders');

let nextOrder = 1;

// ── the order types ──────────────────────────────────────────────────

export const ORDER_TYPES = {
  scout: {
    name: 'Scout team', icon: '◈',
    desc: 'Sweeps a corridor for contacts, leads and unmapped ground. Comes back with ' +
          'information, or with a story about why it did not.',
    crew: 1, hours: [4, 10], risk: 0.16,
    supplies: { 'BIO-008': 40, 'RAW-011': 60 },
    skill: 'sensors', post: 'survey'
  },
  survey: {
    name: 'Survey crew', icon: '◎',
    desc: 'Sets down and works a world properly. Raises its assay, which every extractor ' +
          'you ever build there is paid on.',
    crew: 2, hours: [8, 20], risk: 0.10,
    supplies: { 'BIO-008': 90, 'RAW-011': 120, 'CMP-001': 4 },
    skill: 'sensors', post: 'survey'
  },
  reclaim: {
    name: 'Reclamation unit', icon: '⚒',
    desc: 'Cuts up whatever is drifting out there. Slow, filthy, and the cheapest ' +
          'materials you will ever get.',
    crew: 2, hours: [6, 16], risk: 0.22,
    supplies: { 'BIO-008': 80, 'RAW-011': 100 },
    skill: 'extraction', post: 'rigger'
  }
};
export const ORDER_KEYS = Object.keys(ORDER_TYPES);

// ── executive fleet objectives ───────────────────────────────────────
// These are ship-level, not crew-team, orders. They exist so an executive at HQ
// (or ARIA on their behalf) can keep owned / contracted hulls busy with visible
// timers and auto-return. Active vs passive is a flag the sim can read cheaply.

export const FLEET_ORDER_TYPES = {
  patrol: {
    name: 'Patrol', icon: '👁',
    branch: 'military',
    desc: 'Hold a sector or corridor for a fixed duration, then return. Default 30 s.',
    defaultDurationSec: 30,
    // 'patrol' was in this list and nothing could ever satisfy it: spawnNpc maps the
    // `patrol` NPC type to role 'combat', and no yard fits a 'patrol' role either. A dead
    // entry in a requirements table is the same bug the hauler was added to fix in
    // v1.01.00 — a declared requirement needs somebody who can meet it.
    requires: ['combat', 'merc'],
    modes: ['active', 'passive']
  },
  extract: {
    name: 'Extract', icon: '⛏',
    branch: 'industrial',
    desc: 'Work the belt and run the ore in. Active fills a quota; passive repeats until recalled.',
    defaultDurationSec: 0,          // measured in kilograms, not seconds — see quotaKg
    defaultQuotaKg: 4000,
    requires: ['mine'],
    modes: ['active', 'passive'],
    params: ['quotaKg', 'singleLoad']
  },
  logistics: {
    name: 'Logistics run', icon: '📦',
    branch: 'logistic',
    desc: 'Move cargo or people between stations / sites. Optional return leg.',
    defaultDurationSec: 90,
    requires: ['haul', 'trade'],
    modes: ['active', 'passive'],
    params: ['dest', 'commodity', 'returnAfter']
  },
  escort: {
    name: 'Escort', icon: '🛡',
    branch: 'military',
    desc: 'Match and protect a designated hull until the leg completes or timer ends.',
    defaultDurationSec: 60,
    // 'patrol' was in this list and nothing could ever satisfy it: spawnNpc maps the
    // `patrol` NPC type to role 'combat', and no yard fits a 'patrol' role either. A dead
    // entry in a requirements table is the same bug the hauler was added to fix in
    // v1.01.00 — a declared requirement needs somebody who can meet it.
    requires: ['combat', 'merc'],
    modes: ['active'],
    params: ['protectId']
  },
  survey_pass: {
    name: 'Survey pass', icon: '◎',
    branch: 'civilian',
    desc: 'One or more passes over a body to deepen assay data without committing a ground team.',
    defaultDurationSec: 45,
    requires: ['mine', 'trade'],
    modes: ['active'],
    params: ['bodyName', 'quotaBodies']
  },
  station_keep: {
    name: 'Station-keep', icon: '◐',
    branch: 'economic',
    desc: 'Hold position relative to a station or site and report contacts inside scan radius.',
    defaultDurationSec: 0, // until recalled
    // 'merc' was missing here and nowhere else, so a mercenary hull was the only role in
    // the game that could not hold a berth. Six roles, and the coverage matrix in
    // test/jobs.mjs now asserts every one of them against every order type.
    requires: ['combat', 'merc', 'haul', 'trade', 'mine', 'build'],
    modes: ['passive', 'active']
  },

  // ── v1.02.35: a job for every hull ──────────────────────────────────
  //
  // Six roles were buyable and only five had work. `build` had *none* — no order type in
  // the game listed it in `requires`, so a construction hull could be commissioned, paid
  // for, and then had literally nothing that could be assigned to it. The others were thin
  // rather than empty: a mercenary had two jobs, both of which a plain patrol hull did
  // equally well, so the role bought you nothing.
  //
  // Each of these has a real body in systems/fleet-work.js, and each obeys the rule the
  // rest of the file does — the accrual is gated on something being true in the world, not
  // on the clock.

  construct: {
    name: 'Construction', icon: '🏗',
    branch: 'industrial',
    desc: 'Erect what the company has on order, or hire the crew out to somebody else\'s ' +
          'scaffold. Work becomes a module that is really bolted on, or it does not pay.',
    defaultDurationSec: 0,
    requires: ['build'],
    modes: ['active', 'passive'],
    // 'company' works the order book; 'contract' takes paid labour on a world site;
    // 'auto' prefers the company's own work and falls back to contract.
    params: ['project', 'source']
  },
  salvage: {
    name: 'Salvage', icon: '♻',
    branch: 'industrial',
    desc: 'Recover containers and wreckage from the field and run them in. Pays what the ' +
          'market pays for what was actually recovered.',
    defaultDurationSec: 0,
    requires: ['build', 'merc', 'haul'],
    modes: ['active', 'passive'],
    params: ['quotaKg']
  },
  hunt: {
    name: 'Bounty hunt', icon: '⌖',
    branch: 'military',
    desc: 'Seek hostiles rather than wait on a lane. Pays the bounty on what it actually ' +
          'kills — a hunt that finds nothing earns nothing.',
    defaultDurationSec: 0,
    requires: ['combat', 'merc'],
    modes: ['active', 'passive'],
    params: ['quotaKills']
  },
  prospect: {
    name: 'Prospecting', icon: '⌕',
    branch: 'industrial',
    desc: 'Deep-scan a field so a later extraction order pays better. Raises the assay ' +
          'the ground-order system already reads.',
    defaultDurationSec: 0,
    requires: ['mine', 'build', 'trade'],
    modes: ['active', 'passive'],
    params: ['fieldKey']
  },
  arbitrage: {
    name: 'Arbitrage', icon: '⇄',
    branch: 'economic',
    desc: 'Pick the widest spread in the system and work it. Unlike a logistics run this ' +
          'chooses the pair, and books profit rather than delivered mass.',
    defaultDurationSec: 0,
    requires: ['trade', 'haul'],
    modes: ['active', 'passive'],
    params: ['commodity']
  },
  tender: {
    name: 'Fleet tender', icon: '⚕',
    branch: 'logistic',
    desc: 'Run repairs and stores out to the company\'s own hulls in the field, so a ' +
          'damaged ship does not have to abandon its objective to come home.',
    defaultDurationSec: 0,
    requires: ['haul', 'build', 'trade'],
    modes: ['passive', 'active']
  }
};
export const FLEET_ORDER_KEYS = Object.keys(FLEET_ORDER_TYPES);

export const fleetOrders = () => (S.fleetOrders = S.fleetOrders || []);

// Fleet order ids were `fo-${Date.now()}-${Math.random()}`. Neither half is seeded, so a
// dispatch was not reproducible across a save/replay and two peers in a shared galaxy
// would never agree on an id. Monotonic counter, seeded stream for the suffix, and
// restoreFleet() carries the counter past whatever is already on file.
let nextFleetSeq = 1;
function nextFleetId() {
  const n = nextFleetSeq++;
  return `fo-${n.toString(36)}-${Math.floor(stream('fleet-orders').next() * 1296).toString(36).padStart(2, '0')}`;
}

/**
 * Dispatch a fleet objective. Returns the order record or a string blocker.
 * `asset` is a minimal descriptor { id, role, name? }; full ship binding is left
 * to the sim / future HQ layer.
 */
export function dispatchFleet(type, asset, opts = {}) {
  const spec = FLEET_ORDER_TYPES[type];
  if (!spec) return 'No such fleet order';
  if (!asset || !asset.id) return 'No asset specified';
  if (fleetOrders().length >= 6) return 'Fleet order cap reached';
  if (spec.requires && asset.role && !spec.requires.includes(asset.role)) {
    return `${spec.name} needs a ${spec.requires.join('/')} hull`;
  }

  const mode = opts.mode === 'passive' ? 'passive' : 'active';

  // Passive means "until recalled". It said so in every description, and in the extraction
  // path it was even true — extraction declares `defaultDurationSec: 0`, so nothing was
  // counting. Every other order type carried a default clock, so a passive logistics run
  // completed itself after ninety seconds regardless of what the mode claimed. A hauler got
  // one round trip and stopped, which is the other half of "it only ever visits two
  // stations": it was never alive long enough to pick a third.
  //
  // An explicitly requested duration still wins — "hold this passively for 45 seconds" is
  // a coherent instruction and the caller meant it. What passive suppresses is the *type's
  // default* clock, which is the thing nobody asked for.
  const duration = opts.durationSec != null ? opts.durationSec
    : mode === 'passive' ? 0
    : (spec.defaultDurationSec || 30);

  const order = {
    id: nextFleetId(),
    type,
    branch: spec.branch,
    // Kilograms to run in before the objective is done. Zero means "no quota" — either an
    // order type that is not measured this way, or a passive extraction that repeats until
    // recalled.
    quotaKg: opts.quotaKg != null ? opts.quotaKg
           : (spec.defaultQuotaKg && opts.mode !== 'passive' ? spec.defaultQuotaKg : 0),
    delivered: 0,
    runs: 0,
    assetId: asset.id,
    assetRole: asset.role || null,
    assetName: asset.name || asset.id,
    // Set when the asset is a real contracted hull rather than a synthetic wing. Kept
    // separate from assetId so a save written before hulls existed still restores.
    contractId: asset.contractId || null,
    mode,
    durationSec: duration,
    remainingSec: duration,
    target: opts.target || null,
    params: Object.assign({}, opts.params || {}),
    startedAt: S.time || 0,
    status: 'running',
    progress: 0
  };
  // Declared parameters are hoisted onto the order itself.
  //
  // `params: ['quotaKills']` and `params: ['bodyName']` have been declared on order types
  // since v1.01.91 and **nothing has ever read `order.params`** — every work step reads
  // `order.quotaKills` and `order.bodyName` straight off the order, where only the step
  // itself ever wrote them. So a hunt's kill quota could not be set by a caller, which made
  // `order.kills >= order.quotaKills` a branch guarded by `quotaKills > 0` that was never
  // once true. The declaration list existed, the fields existed, and the wire between them
  // did not. One loop, and the list becomes the contract it always looked like.
  //
  // Undeclared keys stay in `order.params` rather than being hoisted — that is where a
  // caller puts something the order type does not know about, like the boardroom's `jobId`.
  for (const key of (spec.params || [])) {
    if (order.params[key] !== undefined) order[key] = order.params[key];
  }

  fleetOrders().push(order);
  if (order.contractId) bindHull(order.contractId, order.id);
  status(`${order.assetName}: ${spec.name}` +
    (duration > 0 ? ` · ${duration}s` : ' · until recalled') +
    (mode === 'passive' ? ' (passive)' : ''));
  return order;
}

export function recallFleet(orderId) {
  const list = fleetOrders();
  const i = list.findIndex(o => o.id === orderId);
  if (i < 0) return false;
  list[i].status = 'recalled';
  list[i].remainingSec = 0;
  unbindHull(list[i].id);
  status(`${list[i].assetName} recalled from ${FLEET_ORDER_TYPES[list[i].type]?.name || list[i].type}`);
  list.splice(i, 1);
  return true;
}

/** Tick fleet orders. Call from sim with real seconds. */
export function updateFleetOrders(dt) {
  if (!(dt > 0)) return;
  const list = fleetOrders();
  // Do the work first, so anything it finishes is seen as finished on this same pass.
  stepFleetWork(list, dt);
  for (let i = list.length - 1; i >= 0; i--) {
    const o = list[i];
    if (o.status !== 'running') continue;

    // An objective whose work finished this frame is done, whatever the clock says. Set by
    // the step functions in systems/fleet-work.js — a single-leg logistics run that has
    // delivered, or a survey that has taken a body to full assay.
    if (o.workDone) {
      o.status = 'complete';
      o.progress = 1;
      unbindHull(o.id);
      status(`${o.assetName} completed ${FLEET_ORDER_TYPES[o.type]?.name || o.type}`);
      list.splice(i, 1);
      continue;
    }

    // Quota objectives are measured in what came back, not in time elapsed. Extraction is
    // the case that forced this: a countdown completes whether or not a rock was cut, and
    // it cannot express "keep going until I say stop", which is the whole point of the
    // passive mode. Passive sets no quota and therefore never self-completes — the hull
    // cuts, fills, runs the load in, and goes again until it is recalled.
    if (o.quotaKg > 0) {
      o.progress = Math.min(1, (o.delivered || 0) / o.quotaKg);
      if ((o.delivered || 0) >= o.quotaKg) {
        o.status = 'complete';
        o.progress = 1;
        unbindHull(o.id);
        status(`${o.assetName} filled its quota — ${Math.round(o.delivered)} kg`);
        list.splice(i, 1);
        continue;
      }
    }

    if (o.durationSec > 0) {
      o.remainingSec -= dt;
      o.progress = Math.min(1, 1 - (o.remainingSec / o.durationSec));
      if (o.remainingSec <= 0) {
        o.status = 'complete';
        o.progress = 1;
        // The hull comes home. Without this the contract stayed marked busy forever and
        // the roster slowly filled with ships that had nothing to do and could not be
        // given anything.
        unbindHull(o.id);
        status(`${o.assetName} completed ${FLEET_ORDER_TYPES[o.type]?.name || o.type}`);
        list.splice(i, 1);
      }
    }
  }
}

/**
 * A hull did some of the work its objective asked for.
 *
 * Extraction objectives are measured in kilograms run in, not in seconds elapsed. A timer
 * is the wrong unit for "mine until I say stop": it completes whether or not a single rock
 * was cut, and it cannot express the loop the player actually wants, which is cut, fill,
 * drop off, repeat until recalled.
 */
export function creditFleetProgress(orderId, kg) {
  const o = fleetOrders().find(x => x.id === orderId);
  if (!o || !(kg > 0)) return 0;
  o.delivered = (o.delivered || 0) + kg;
  o.runs = (o.runs || 0) + 1;
  if (o.quotaKg > 0) o.progress = Math.min(1, o.delivered / o.quotaKg);
  return o.delivered;
}

export function fleetOrderReport() {
  return fleetOrders().map(o => ({
    id: o.id,
    type: o.type,
    name: FLEET_ORDER_TYPES[o.type]?.name || o.type,
    asset: o.assetName,
    mode: o.mode,
    remaining: Math.max(0, Math.round(o.remainingSec)),
    progress: o.progress,
    target: o.target,
    branch: o.branch,
    contractId: o.contractId || null,
    delivered: Math.round(o.delivered || 0),
    runs: o.runs || 0,
    quotaKg: o.quotaKg || 0,
    // What the work step produced. Without these the Ops panel and every test could only
    // see the countdown, which is exactly the thing that was wrong with these orders.
    contacts: o.contacts || 0,
    deterred: o.deterred || 0,
    reported: o.reported || 0,
    pulled: o.pulled || 0,
    onStation: Math.round(o.onStation || 0),
    assayGained: o.assayGained || 0,
    earned: Math.round(o.earned || 0),
    leg: o.leg || null,
    phase: o.phase || null,
    returns: o.returns || 0,
    work: workReport(o)
  }));
}

// ── dispatch ─────────────────────────────────────────────────────────

/** Crew who are aboard, on watch, unhurt, and not already out on an errand. */
export const availableCrew = () =>
  (S.crew || []).filter(c => !c.dispatched && !c.overseer && (c.injury || 0) < 0.4);

export function dispatchBlocker(type, target) {
  const spec = ORDER_TYPES[type];
  if (!spec) return 'No such order';
  if (orders().length >= ORDERS.maxActive) return `Already running ${ORDERS.maxActive} orders`;
  if (availableCrew().length < spec.crew) return `Needs ${spec.crew} crew free`;
  for (const m in spec.supplies) {
    if (held(m) < spec.supplies[m]) {
      return `Short ${Math.ceil(spec.supplies[m] - held(m))} ${materialName(m)}`;
    }
  }
  if (type === 'survey' && !target) return 'Pick a world to survey';
  return null;
}

/**
 * Send a team out.
 *
 * Crew are marked dispatched rather than removed from the roster: they still eat, they
 * still count against the payroll, and they come back to the same post. Removing and
 * recreating them would lose their level, their fatigue and their name, which is most of
 * what makes losing one on a bad roll land at all.
 */
export function dispatch(type, target = null) {
  const why = dispatchBlocker(type, target);
  if (why) { toast(why); sfx.deny(); return null; }

  const spec = ORDER_TYPES[type];
  for (const m in spec.supplies) takeMaterial(m, spec.supplies[m]);

  // Send the best available for the job — the player picked the order, not the roster,
  // and making them assign individuals for every errand is friction without a decision.
  const team = availableCrew()
    .sort((a, b) => b.level - a.level)
    .slice(0, spec.crew);
  for (const c of team) { c.dispatched = true; c.onDuty = false; }

  const r = rng();
  const hours = spec.hours[0] + r.next() * (spec.hours[1] - spec.hours[0]);
  const order = {
    id: nextOrder++,
    type, target,
    crew: team.map(c => c.id),
    hours, remaining: hours,
    started: S.time
  };
  orders().push(order);
  status(`${spec.name} away \u2014 ${hours.toFixed(1)}h`);
  toast(`${spec.name} dispatched: ${team.map(c => c.name).join(', ')}`, 4200);
  sfx.ui();
  return order;
}

/** Call a team back early. They return with nothing, and they know it. */
export function recall(orderId) {
  const list = orders();
  const i = list.findIndex(o => o.id === orderId);
  if (i < 0) return false;
  const order = list[i];
  list.splice(i, 1);
  releaseCrew(order);
  for (const c of crewOf(order)) {
    c.morale = Math.max(0.3, (c.morale ?? 1) - ORDERS.recallMorale);
  }
  toast(`${ORDER_TYPES[order.type].name} recalled \u2014 nothing to show for it`);
  return true;
}

const crewOf = order => (S.crew || []).filter(c => order.crew.includes(c.id));

function releaseCrew(order) {
  for (const c of crewOf(order)) { c.dispatched = false; c.onDuty = true; }
}

// ── running ──────────────────────────────────────────────────────────

export function updateOrders(hours) {
  if (!(hours > 0)) return [];
  const list = orders();
  const done = [];
  for (let i = list.length - 1; i >= 0; i--) {
    const o = list[i];
    o.remaining -= hours;
    if (o.remaining > 0) continue;
    list.splice(i, 1);
    done.push(resolve(o));
  }
  return done;
}

/**
 * What a team came back with.
 *
 * The risk roll happens first and can cost you people. That is the whole reason these are
 * decisions: an errand that always pays is a button you press whenever it is available,
 * and a button is not a system.
 */
function resolve(order) {
  const spec = ORDER_TYPES[order.type];
  const r = rng();
  const team = crewOf(order);
  releaseCrew(order);

  const result = { order, type: order.type, lost: [], gained: {}, text: '' };

  // Skill lowers risk: a survey officer who has done this before brings people home.
  const best = team.reduce((a, c) => Math.max(a, c.level || 1), 1);
  const risk = spec.risk * (1 - Math.min(0.6, best * 0.06));

  if (r.next() < risk) {
    const unlucky = team[Math.floor(r.next() * team.length)];
    if (unlucky && r.next() < ORDERS.fatalShare) {
      const idx = (S.crew || []).indexOf(unlucky);
      if (idx >= 0) S.crew.splice(idx, 1);
      result.lost.push(unlucky.name);
      for (const c of S.crew || []) c.morale = Math.max(0.3, (c.morale ?? 1) - 0.2);
      result.text = `${spec.name} lost ${unlucky.name}.`;
      toast(result.text, 6000);
      sfx.deny();
      return result;
    }
    if (unlucky) {
      unlucky.injury = Math.min(1, (unlucky.injury || 0) + 0.5);
      result.text = `${spec.name} came back short \u2014 ${unlucky.name} is hurt.`;
      toast(result.text, 5000);
      return result;
    }
  }

  if (order.type === 'reclaim') {
    // Salvage: a spread of refined and raw, weighted low. It is cheap material, not a
    // shortcut to the top of the tree.
    const pool = ORDERS.salvagePool;
    for (const m of pool) {
      const qty = Math.round(ORDERS.salvageBase * (0.4 + r.next()) * best * 0.5);
      if (qty > 0) { addMaterial(m, qty); result.gained[m] = qty; }
    }
    result.text = `Reclamation returned ${Object.values(result.gained).reduce((a, b) => a + b, 0)} units.`;
  } else if (order.type === 'survey') {
    // A survey deepens the assay of a world permanently. Everything you ever build there
    // extracts faster, which makes this the order that compounds.
    S.assay = S.assay || {};
    const before = S.assay[order.target] || 0;
    S.assay[order.target] = Math.min(ORDERS.maxAssay, before + ORDERS.assayStep);
    result.gained.assay = S.assay[order.target] - before;
    result.text = `${order.target} assay raised to ${(S.assay[order.target] * 100).toFixed(0)}%.`;
  } else {
    // Scouting pays in information and standing. Sometimes it pays in nothing, which is
    // the honest outcome of sending two people to look at empty space.
    const roll = r.next();
    if (roll < 0.35) {
      result.text = 'Scouts found nothing worth the fuel.';
    } else {
      adjust('independent', ORDERS.scoutStanding, 'survey data shared');
      const mats = ORDERS.scoutPool;
      const m = mats[Math.floor(r.next() * mats.length)];
      const qty = Math.round(ORDERS.scoutBase * (0.5 + r.next()));
      addMaterial(m, qty);
      result.gained[m] = qty;
      result.text = `Scouts brought back ${qty} ${materialName(m)} and a lead.`;
    }
  }

  crewEvent(order.type === 'reclaim' ? 'oreLoad' : 'scan', spec.post, 1.5);
  for (const c of team) c.morale = Math.min(1, (c.morale ?? 1) + 0.05);
  if (result.text) toast(result.text, 4600);
  sfx.pickup();
  return result;
}

// ── reporting ────────────────────────────────────────────────────────

export function orderReport() {
  return orders().map(o => {
    const spec = ORDER_TYPES[o.type];
    return {
      id: o.id, type: o.type, name: spec.name, icon: spec.icon,
      target: o.target,
      crew: crewOf(o).map(c => c.name),
      remaining: Math.max(0, o.remaining),
      progress: Math.max(0, Math.min(1, 1 - o.remaining / o.hours))
    };
  });
}

/** Assay bonus a world has accumulated from survey crews. */
export const assayOf = world => (S.assay && S.assay[world]) || 0;

export const serializeOrders = () => ({
  orders: orders(),
  assay: S.assay || {},
  // Fleet objectives were never persisted: dispatching a patrol and saving lost the
  // patrol, and the contract that hull was flying under came back idle with no objective.
  fleet: fleetOrders()
});

export function restoreOrders(d) {
  S.orders = (d && Array.isArray(d.orders) ? d.orders : []).filter(o => ORDER_TYPES[o.type]);
  S.assay = (d && d.assay) || {};
  nextOrder = S.orders.length ? Math.max(...S.orders.map(o => o.id)) + 1 : 1;

  // Fleet objectives. Filtered the same way as ground orders — an objective whose type no
  // longer exists is dropped rather than restored into a tick that cannot resolve it.
  S.fleetOrders = (d && Array.isArray(d.fleet) ? d.fleet : []).filter(o => FLEET_ORDER_TYPES[o.type]);
  nextFleetSeq = 1;
  for (const o of S.fleetOrders) {
    const m = /^fo-([0-9a-z]+)-/.exec(o.id || '');
    if (m) nextFleetSeq = Math.max(nextFleetSeq, (parseInt(m[1], 36) || 0) + 1);
  }
  // Crew flagged as dispatched by an order that no longer exists would be off the roster
  // forever with nothing to bring them back.
  const out = new Set(S.orders.flatMap(o => o.crew));
  for (const c of (S.crew || [])) {
    if (c.dispatched && !out.has(c.id)) { c.dispatched = false; c.onDuty = true; }
  }
  return true;
}
