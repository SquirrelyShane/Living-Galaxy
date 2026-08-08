// Living Galaxy — welfare: the things you spend on people instead of on the ship.
//
// v1.01.30 made the crew legible. This is the first slice that gives a player something to
// *do* about what they can now see.
//
// ── the trap this is built to avoid ──────────────────────────────────
// The obvious version of "let the player rest the crew" is a button that removes fatigue.
// That deletes the watch rotation — fatigue exists to force one — and turns the whole crew
// simulation into a cooldown you tap between fights.
//
// So every recovery here costs the thing you did not want to spend:
//
//   **shore leave** costs *time docked*. The crew are off the ship, contributing nothing,
//     and undocking early cuts it short and wastes most of it. You cannot buy your way out
//     of the clock.
//   **quarters, galley and infirmary** cost *money up front and upkeep forever*. They are
//     the standing answer — cheaper than replacing people, and they never stop billing.
//   **training** costs *a body off the watch bill*. Improving somebody means being short a
//     station while you do it, which is exactly the decision the crossPenalty already makes
//     interesting.
//
// None of them is fast and free, and that is the design rather than a balance pass.
//
// ── everything files through the log ─────────────────────────────────
// A recovery that does not appear in `crewDiagnosis()` is a recovery a player cannot
// evaluate — the whole point of the telemetry slice was to make "did that work?" answerable.

import { S } from '../core/state.js';
import { WELFARE, CREW, CRAFT } from '../core/config.js';
import { fmtCr } from '../core/utils.js';
import { toast, status } from '../ui/toast.js';
import { sfx } from './audio.js';
import { noteCrew } from './crew-log.js';
import { recalcStats } from '../core/state.js';

/** Ship comfort fittings. Levels are 0..3; 0 is what every hull comes with. */
export const COMFORTS = {
  quarters: {
    name: 'Crew quarters', icon: '\u25a4',
    desc: 'Bunks, acoustic isolation, and a door that shuts. Off-watch crew recover faster.',
    effect: 'off-watch recovery'
  },
  galley: {
    name: 'Galley', icon: '\u25c9',
    desc: 'A cook rather than a dispenser. Short rations still hurt, but they hurt less, ' +
          'and a fed crew is a fractionally happier one every payroll.',
    effect: 'ration morale'
  },
  infirmary: {
    name: 'Infirmary', icon: '\u2295',
    desc: 'Proper beds and proper equipment. Injuries close faster whether or not you have ' +
          'anybody qualified standing at damage control.',
    effect: 'healing rate'
  }
};
export const COMFORT_KEYS = Object.keys(COMFORTS);

export const comfort = () => {
  if (!S.comfort) S.comfort = { quarters: 0, galley: 0, infirmary: 0 };
  return S.comfort;
};
export const comfortLevel = key => comfort()[key] || 0;

/**
 * The multipliers the crew tick reads. One place, so a fitting cannot mean one thing in the
 * fatigue branch and something slightly different in the healing branch.
 */
export function comfortEffects() {
  const c = comfort();
  return {
    restMult: 1 + (c.quarters || 0) * WELFARE.quartersRest,
    rationRelief: Math.min(1, (c.galley || 0) * WELFARE.galleyRelief),
    galleyMorale: (c.galley || 0) * WELFARE.galleyMorale,
    healMult: 1 + (c.infirmary || 0) * WELFARE.infirmaryHeal
  };
}

export const comfortUpkeep = () =>
  COMFORT_KEYS.reduce((n, k) => n + comfortLevel(k) * WELFARE.upkeepPerLevel, 0);

export const comfortPrice = key =>
  Math.round(WELFARE.fitBase * Math.pow(WELFARE.fitScale, comfortLevel(key)));

export function comfortBlocker(key) {
  if (!COMFORTS[key]) return 'unknown fitting';
  if (!S.docked) return 'dock first';
  if (comfortLevel(key) >= WELFARE.maxLevel) return 'at maximum';
  if (S.credits < comfortPrice(key)) return 'short ' + fmtCr(comfortPrice(key) - S.credits);
  return null;
}

export function upgradeComfort(key) {
  const why = comfortBlocker(key);
  if (why) { toast(why); sfx.deny(); return false; }
  S.credits -= comfortPrice(key);
  comfort()[key] = comfortLevel(key) + 1;
  toast(`${COMFORTS[key].name} \u2192 level ${comfortLevel(key)}`);
  sfx.pickup();
  recalcStats();
  return true;
}

// ── shore leave ──────────────────────────────────────────────────────

export const onShore = c => !!(c && c.shore);
export const anyOnShore = () => (S.crew || []).some(onShore);

export function shoreQuote(ids = null) {
  const list = (S.crew || []).filter(c => !ids || ids.includes(c.id));
  return { heads: list.length, cost: list.length * WELFARE.shoreCostPerHead, hours: WELFARE.shoreHours };
}

export function shoreBlocker(ids = null) {
  if (!S.docked) return 'dock first';
  const q = shoreQuote(ids);
  if (!q.heads) return 'nobody to send';
  if (anyOnShore()) return 'already ashore';
  if (S.credits < q.cost) return 'short ' + fmtCr(q.cost - S.credits);
  return null;
}

/**
 * Send the crew ashore.
 *
 * They come off the roster entirely: no output, no watch, no experience. That is the price,
 * and it is a real one — a ship in a fight with its crew in a bar is a ship flying on
 * automation.
 */
export function startShoreLeave(ids = null) {
  const why = shoreBlocker(ids);
  if (why) { toast(why); sfx.deny(); return false; }
  const list = (S.crew || []).filter(c => !ids || ids.includes(c.id));
  S.credits -= list.length * WELFARE.shoreCostPerHead;
  for (const c of list) {
    c.shore = true;
    c.shoreLeft = WELFARE.shoreHours;
    c.onDuty = false;
    noteCrew(c, 'sent ashore', { level: 'notice' });
  }
  status(`${list.length} ashore \u2014 ${WELFARE.shoreHours}h`);
  toast(`Shore leave \u2014 ${list.length} crew, ${WELFARE.shoreHours}h`);
  sfx.pickup();
  recalcStats();
  return true;
}

/**
 * Bring them back. `full` means the clock ran out; anything else is cutting it short, which
 * pays a fraction of the benefit and files that it was cut short — so a player who wonders
 * why the leave did not help can find out that they undocked after twenty minutes.
 */
export function recallShore(full = false) {
  const list = (S.crew || []).filter(onShore);
  if (!list.length) return 0;
  for (const c of list) {
    const served = Math.max(0, WELFARE.shoreHours - (c.shoreLeft || 0));
    const frac = full ? 1 : Math.min(1, served / WELFARE.shoreHours) * WELFARE.shoreEarlyKeep;

    const mWas = c.morale ?? 1, fWas = c.fatigue || 0;
    c.morale = Math.min(1, mWas + WELFARE.shoreMorale * frac);
    c.fatigue = Math.max(0, fWas - WELFARE.shoreFatigue * frac);
    c.shore = false;
    c.shoreLeft = 0;
    c.onDuty = true;

    noteCrew(c, full ? 'shore leave' : 'shore leave cut short', {
      stat: 'morale', delta: c.morale - mWas, level: full ? 'info' : 'notice' });
    noteCrew(c, full ? 'shore leave' : 'shore leave cut short', {
      stat: 'fatigue', delta: c.fatigue - fWas });
  }
  if (full) toast(`${list.length} crew back aboard, rested`);
  else toast(`${list.length} crew recalled early \u2014 leave wasted`, 3600);
  recalcStats();
  return list.length;
}

// ── training ─────────────────────────────────────────────────────────

export const inTraining = c => !!(c && c.training);

export const trainingCost = c => Math.round(WELFARE.trainBase * Math.pow(WELFARE.trainScale, (c.level || 1) - 1));

export function trainBlocker(id) {
  const c = (S.crew || []).find(x => x.id === id);
  if (!c) return 'no such crew';
  if (!S.docked) return 'dock first';
  if (inTraining(c)) return 'already training';
  if (onShore(c)) return 'ashore';
  if ((c.level || 1) >= CREW.levelMax) return 'at maximum level';
  if (S.credits < trainingCost(c)) return 'short ' + fmtCr(trainingCost(c) - S.credits);
  return null;
}

/**
 * Put somebody through a course.
 *
 * The distinction the roadmap asked for: experience is what happens *to* somebody, training
 * is something you *choose*. It costs money and, more importantly, a station — they are off
 * the watch bill for the duration, which on a small roster is the whole cost.
 */
export function startTraining(id) {
  const why = trainBlocker(id);
  if (why) { toast(why); sfx.deny(); return false; }
  const c = S.crew.find(x => x.id === id);
  S.credits -= trainingCost(c);
  c.training = true;
  c.trainLeft = WELFARE.trainHours;
  c.onDuty = false;
  noteCrew(c, 'began training', { level: 'notice' });
  toast(`${c.name} is on a course \u2014 ${WELFARE.trainHours}h off watch`);
  sfx.pickup();
  recalcStats();
  return true;
}

export function cancelTraining(id) {
  const c = (S.crew || []).find(x => x.id === id);
  if (!c || !inTraining(c)) return false;
  // No refund and no progress. A course you pull somebody out of halfway is money spent on
  // nothing, which is what makes committing to it a decision.
  c.training = false;
  c.trainLeft = 0;
  c.onDuty = true;
  noteCrew(c, 'pulled off a course', { level: 'notice' });
  toast(`${c.name} pulled off the course \u2014 nothing to show for it`);
  recalcStats();
  return true;
}

// ── the clock ────────────────────────────────────────────────────────

/**
 * Advance shore leave and training. Both run on game hours rather than seconds, so they
 * agree with the galley and the manufacturing bay about what an hour is.
 *
 * Runs whether or not the ship is docked: leaving is what *cuts leave short*, handled by
 * `undock()`, not by quietly pausing the clock. A timer that stops when you are not looking
 * at it is a timer a player cannot plan against.
 */
export function updateWelfare(dt) {
  const crew = S.crew || [];
  if (!crew.length) return;
  const hours = dt * CRAFT.gameHoursPerSecond;
  let done = 0, dirty = false;

  for (const c of crew) {
    if (c.shore) {
      c.shoreLeft = Math.max(0, (c.shoreLeft || 0) - hours);
      if (c.shoreLeft <= 0) done++;
    }
    if (c.training) {
      c.trainLeft = Math.max(0, (c.trainLeft || 0) - hours);
      if (c.trainLeft <= 0) {
        c.training = false;
        c.onDuty = true;
        const gain = WELFARE.trainXp * Math.pow(CREW.xpScale, (c.level || 1) - 1);
        c.xp += gain;
        noteCrew(c, 'finished a course', { level: 'notice' });
        toast(`${c.name} completed their course`, 3400);
        dirty = true;
      }
    }
  }

  // Everybody whose leave ran out comes back together, so the toast is one line rather than
  // one per head.
  if (done) recallShore(true);
  else if (dirty) recalcStats();
}

// ── persistence ──────────────────────────────────────────────────────
// Comfort levels are ship state and are saved. Shore and training flags ride on the crew
// records themselves, which the crew payload already carries — so this is one small object.
export const serializeWelfare = () => Object.assign({}, comfort());
export function restoreWelfare(d) {
  const out = { quarters: 0, galley: 0, infirmary: 0 };
  for (const k of COMFORT_KEYS) {
    const v = d && Number(d[k]);
    if (Number.isFinite(v)) out[k] = Math.max(0, Math.min(WELFARE.maxLevel, Math.floor(v)));
  }
  S.comfort = out;
  return true;
}
