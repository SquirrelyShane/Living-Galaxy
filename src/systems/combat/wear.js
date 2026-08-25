// Living Galaxy — module condition.
//
// The third and last item deferred out of v1.00.20. Ammunition and thermal load landed in
// v1.00.60; wear did not, and it has been sitting in the carried column for four slices.
//
// ── the thing this had to avoid being ────────────────────────────────
// The obvious implementation is a decay rate: every module loses a little condition every
// second, and you pay a bill at the station. That is rent. It costs the same whether you
// spent the hour in a knife fight or parked at a berth, it creates exactly one decision
// ("go to a station now or later"), and it punishes playing rather than pricing anything.
//
// So there is no clock in this file. Every channel is an event the pilot chose:
//
//   a shot fired      → that hardpoint, and only that hardpoint
//   a hit taken       → core and utility, harder when it reached structure
//   a second of warp  → core subsystems, the things actually running
//   a second of mining→ utility, where the beam is
//
// A pilot who docks and trades wears nothing out. A pilot who spends an hour at the cutout
// in a belt wears out a great deal, which is the correct bill for that hour.
//
// ── the effect reuses a penalty that already exists ──────────────────
// A worn module gives less *and* draws more. The second half is the interesting one: it
// pushes a fit that was inside its power and CPU budgets toward the overload curve v0.7
// built, so neglect does not produce a new failure mode, it makes an existing one arrive
// early. A pilot does not have to learn anything new to understand what went wrong — the
// Draw readout they already watch starts creeping.
//
// Nothing is ever destroyed. `WEAR.floor` is the worst a module can get to, for the same
// reason `BUDGET.maxPenalty` exists: a fit you cannot fly home is a soft-lock, not a
// tradeoff, and the moment it would bite hardest is the moment it would be least fair.

import { S, registerWearConditions } from '../../core/state.js';
import { WEAR, HEAT } from '../../core/config.js';
import { MODULES } from '../../data/modules.js';
import { WEAPON_MODULES } from '../../data/weapons.js';
import { toast, status } from '../../core/notify.js';

const KINDS = ['weapon', 'utility', 'core'];

/** The condition table, shaped like the fit it describes and created on demand. */
function wearBag() {
  if (!S.wear) S.wear = { weapon: [], utility: [], core: [] };
  for (const k of KINDS) if (!Array.isArray(S.wear[k])) S.wear[k] = [];
  return S.wear;
}

/**
 * Condition of one hardpoint, 0..1. An index that has never been touched reads 1 — a
 * missing entry is a module nobody has worn out yet, not a broken one.
 *
 * Keyed on hardpoint index rather than on module key, which is the v1.00.70 lesson about
 * weapon groups applied again: condition belongs to the *slot the pilot edits*. Keying on
 * the module key would mean selling a worn gun and buying the same model back is a free
 * repair, and that a second identical mount shares one wear figure.
 */
export function conditionAt(kind, i) {
  const arr = wearBag()[kind];
  const v = arr[i];
  return (typeof v === 'number' && isFinite(v)) ? Math.max(0, Math.min(1, v)) : 1;
}

/** What fraction of its rated damage the gun in hardpoint `i` still delivers. */
export const weaponEffect = i => effectiveness(conditionAt('weapon', i));

/** The whole table as plain arrays, for the pure functions in systems/fitting.js. */
export function conditions() {
  const b = wearBag();
  const out = {};
  for (const k of KINDS) {
    const n = ((S.fit && S.fit[k]) || []).length;
    out[k] = [];
    for (let i = 0; i < n; i++) out[k][i] = conditionAt(k, i);
  }
  return out;
}

/** How much of a module's rated output a given condition delivers. */
export const effectiveness = c => WEAR.floor + (1 - WEAR.floor) * Math.max(0, Math.min(1, c));

/** How much *more* it draws. Worn kit is inefficient before it is weak. */
const drawFactor = c => 1 + WEAR.drawAtZero * (1 - Math.max(0, Math.min(1, c)));

/** The worst thing fitted, for a one-line readout. Null on a bare hull. */
export function worstFitted() {
  let worst = null;
  for (const kind of KINDS) {
    const bay = (S.fit && S.fit[kind]) || [];
    for (let i = 0; i < bay.length; i++) {
      if (!bay[i]) continue;
      const c = conditionAt(kind, i);
      if (!worst || c < worst.condition) worst = { kind, index: i, key: bay[i], condition: c };
    }
  }
  return worst;
}

// ── accrual ──────────────────────────────────────────────────────────

// Set by systems/crew.js at import time, for the same reason character bonuses register
// themselves with state.js: crew.js already imports half the game, and a static edge from
// here to there would close a cycle through state.js.
let engineerRef = null;
export function registerEngineerCheck(fn) { engineerRef = fn; }

/** 0..1 — how much of the wear an on-watch engineer prevents. */
function relief() {
  if (!engineerRef) return 0;
  try { return engineerRef() ? WEAR.engineerRelief : 0; } catch (e) { return 0; }
}

/**
 * Heat multiplier. Running a rack at the cutout is how guns die in every navy that has ever
 * had one, and it gives the thermal budget a second consequence beyond the tempo one — the
 * pilot who ignores the heat bar now pays for it after the fight as well as during it.
 */
function heatMult() {
  const cap = (S.stats && S.stats.heatCap) || HEAT.capFloor;
  const frac = Math.max(0, Math.min(1, (S.player.heat || 0) / (cap || 1)));
  return 1 + (WEAR.heatMult - 1) * frac;
}

let warned = { warn: false, bad: false };

/** Apply `amount` of wear to one hardpoint, with the shared multipliers. */
function wearOne(kind, i, amount) {
  if (!(amount > 0)) return;
  const bay = (S.fit && S.fit[kind]) || [];
  if (!bay[i]) return;                       // an empty slot cannot wear out
  const arr = wearBag()[kind];
  const before = conditionAt(kind, i);
  const after = Math.max(0, before - amount * heatMult() * (1 - relief()));
  arr[i] = after;

  // Announced once per crossing rather than per frame. A pilot needs to hear this the first
  // time it becomes true, not four hundred times while it stays true.
  if (before > WEAR.badAt && after <= WEAR.badAt) {
    warned.bad = true;
    status('Subsystem degraded — service at a station');
  } else if (before > WEAR.warnAt && after <= WEAR.warnAt && !warned.warn) {
    warned.warn = true;
    toast('Module wear showing — check the fitting screen');
  }
}

/** A round left this barrel. Wears the hardpoint that fired it and nothing else. */
export const wearShot = i => wearOne('weapon', i, WEAR.perShot);

/**
 * The ship took a hit. Spread across core and utility, because that is what a hit does —
 * it is the whole ship that gets shaken, not one convenient slot.
 *
 * Structure hits cost more than armour hits by design: armour exists to absorb, and a system
 * where getting shot through your plating costs the same as being shot through your hull
 * would make plating a stat rather than a layer.
 */
export function wearHit(armorTaken, hullTaken) {
  const amount = (hullTaken || 0) > 0 ? WEAR.perHullHit
               : (armorTaken || 0) > 0 ? WEAR.perArmorHit : 0;
  if (!amount) return;
  for (const kind of ['core', 'utility']) {
    const bay = (S.fit && S.fit[kind]) || [];
    for (let i = 0; i < bay.length; i++) wearOne(kind, i, amount);
  }
}

/** Seconds of actual warp cruise. Spooling and cooldown are not running the drive. */
export function wearWarp(dt) {
  const bay = (S.fit && S.fit.core) || [];
  for (let i = 0; i < bay.length; i++) wearOne('core', i, WEAR.perWarpSecond * dt);
}

/** Seconds with the mining beam on a rock. */
export function wearMining(dt) {
  const bay = (S.fit && S.fit.utility) || [];
  for (let i = 0; i < bay.length; i++) wearOne('utility', i, WEAR.perMineSecond * dt);
}

// ── servicing ────────────────────────────────────────────────────────

const priceOf = (kind, key) => {
  const def = kind === 'weapon' ? WEAPON_MODULES[key] : MODULES[key];
  return (def && def.price) || 0;
};

/**
 * What it costs to bring one hardpoint back to yard-fresh. Priced against the module's own
 * list value and against how far gone it is, so topping up a barely-used gun is nearly free
 * and rebuilding a neglected capital core is a decision.
 */
export function serviceCost(kind, i) {
  const key = ((S.fit && S.fit[kind]) || [])[i];
  if (!key) return 0;
  const missing = 1 - conditionAt(kind, i);
  if (missing <= 0.005) return 0;
  return Math.max(WEAR.serviceMin, Math.round(priceOf(kind, key) * WEAR.serviceFraction * missing));
}

/** Everything fitted that is worth servicing, and what the lot would cost. */
export function serviceQuote() {
  let cost = 0, count = 0;
  for (const kind of KINDS) {
    const bay = (S.fit && S.fit[kind]) || [];
    for (let i = 0; i < bay.length; i++) {
      const c = serviceCost(kind, i);
      if (c > 0) { cost += c; count++; }
    }
  }
  return { cost, count };
}

const blocked = () => (!S.docked ? 'dock first' : null);

/** Service one hardpoint. A station job — you cannot pull a core apart under way. */
export function serviceModule(kind, i) {
  const why = blocked();
  if (why) { toast(why); return false; }
  const cost = serviceCost(kind, i);
  if (!cost) { toast('Nothing to service there'); return false; }
  if (S.credits < cost) { toast('Short on credits'); return false; }
  S.credits -= cost;
  wearBag()[kind][i] = 1;
  warned = { warn: false, bad: false };
  toast('Serviced');
  return true;
}

/** Service the lot. The row a pilot will actually press. */
export function serviceAll() {
  const why = blocked();
  if (why) { toast(why); return false; }
  const q = serviceQuote();
  if (!q.count) { toast('Everything is in tolerance'); return false; }
  if (S.credits < q.cost) { toast('Short on credits'); return false; }
  S.credits -= q.cost;
  for (const kind of KINDS) {
    const bay = (S.fit && S.fit[kind]) || [];
    for (let i = 0; i < bay.length; i++) if (bay[i]) wearBag()[kind][i] = 1;
  }
  warned = { warn: false, bad: false };
  toast(`${q.count} subsystem${q.count === 1 ? '' : 's'} serviced`);
  return true;
}

// ── persistence ──────────────────────────────────────────────────────
// Rounded to three places on the way out. Condition is a feel, not an instrument, and a save
// carrying fourteen significant figures of it is bytes spent on nothing.
export function serializeWear() {
  const b = wearBag();
  const out = {};
  for (const k of KINDS) out[k] = b[k].map(v => Math.round((typeof v === 'number' ? v : 1) * 1000) / 1000);
  return out;
}

export function restoreWear(d) {
  const b = { weapon: [], utility: [], core: [] };
  for (const k of KINDS) {
    const arr = (d && Array.isArray(d[k])) ? d[k] : [];
    b[k] = arr.map(v => (typeof v === 'number' && isFinite(v)) ? Math.max(0, Math.min(1, v)) : 1);
  }
  S.wear = b;
  warned = { warn: false, bad: false };
  return true;
}

// Registered at import time, the way research.js and character.js register their bonuses.
// Importing this module is what turns wear on; nothing else has to know it exists.
registerWearConditions(conditions);
