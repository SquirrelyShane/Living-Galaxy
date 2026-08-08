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

import { S } from '../core/state.js';
import { ORDERS, CRAFT } from '../core/config.js';
import { stream } from '../core/rng.js';
import { addMaterial, held, takeMaterial } from './crafting.js';
import { crewEvent } from './crew.js';
import { adjust } from './reputation.js';
import { resourcesFor } from '../data/planetary/index.js';
import { materialName } from '../data/crafting/index.js';
import { toast, status } from '../ui/toast.js';
import { sfx } from './audio.js';

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

export const serializeOrders = () => ({ orders: orders(), assay: S.assay || {} });

export function restoreOrders(d) {
  S.orders = (d && Array.isArray(d.orders) ? d.orders : []).filter(o => ORDER_TYPES[o.type]);
  S.assay = (d && d.assay) || {};
  nextOrder = S.orders.length ? Math.max(...S.orders.map(o => o.id)) + 1 : 1;
  // Crew flagged as dispatched by an order that no longer exists would be off the roster
  // forever with nothing to bring them back.
  const out = new Set(S.orders.flatMap(o => o.crew));
  for (const c of (S.crew || [])) {
    if (c.dispatched && !out.has(c.id)) { c.dispatched = false; c.onDuty = true; }
  }
  return true;
}
