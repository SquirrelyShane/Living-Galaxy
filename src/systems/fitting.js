// Living Galaxy — ship fitting. The hull decides how many hardpoints of each kind
// you have; this module decides what's bolted into them and what that adds up to.
//
// Pure by design: nothing here reaches into state.js, so core/state.js can import
// it for recalcStats() without a circular graph. Callers pass the fit object in.

import { HULL_SLOTS, MULTI_GUN_FALLOFF } from '../core/config.js';
import { BUDGET } from '../core/config.js';
import { MODULES } from '../data/modules.js';
import { WEAPON_MODULES } from '../data/weapons.js';

export const slotsFor = classKey => HULL_SLOTS[classKey] || HULL_SLOTS.civilian;

/** Build (or resize) a fit to match a hull, preserving whatever still fits. */
export function normalizeFit(fit, classKey) {
  const s = slotsFor(classKey);
  const out = { weapon: [], utility: [], core: [] };
  for (const kind of ['weapon', 'utility', 'core']) {
    const had = (fit && Array.isArray(fit[kind])) ? fit[kind] : [];
    for (let i = 0; i < s[kind]; i++) {
      const key = had[i] || null;
      out[kind][i] = validKey(kind, key) ? key : null;
    }
  }
  return out;
}

function validKey(kind, key) {
  if (!key) return false;
  if (kind === 'weapon') return !!WEAPON_MODULES[key];
  const m = MODULES[key];
  return !!m && m.slot === kind;
}

/** Weapon definitions actually mounted, in slot order, empties dropped. */
export function mountedWeapons(fit) {
  if (!fit || !fit.weapon) return [];
  return fit.weapon.filter(k => k && WEAPON_MODULES[k]).map(k => WEAPON_MODULES[k]);
}

/** Per-mount damage scale — barrel 1 at full, each extra at a falloff. */
export const mountScale = i => Math.pow(MULTI_GUN_FALLOFF, i);

/** Everything fitted, summed into one bonus bag. Unknown mod keys are ignored. */
export function fitBonuses(fit) {
  const b = { power: 0, cpu: 0 };
  if (!fit) return b;
  for (const kind of ['utility', 'core']) {
    for (const key of (fit[kind] || [])) {
      const m = MODULES[key];
      if (!m) continue;
      b.power += m.power || 0;
      b.cpu += m.cpu || 0;
      for (const k in m.mods) b[k] = (b[k] || 0) + m.mods[k];
    }
  }
  return b;
}

// ── budgets ──────────────────────────────────────────────────────────
// Two independent ceilings, and going over either one degrades rather than refuses.
// A hard "you cannot fit this" is a smaller design than a fit that works but runs hot:
// the second lets a pilot take a calculated risk for one run and feel it, which is the
// entire point of having a budget at all.

/** What the hull and the pilot can supply. */
export function budgetFor(hullKey, engineeringRank = 0) {
  return {
    power: (BUDGET.powerPerHull[hullKey] || 7) + engineeringRank * BUDGET.powerPerRank,
    cpu: (BUDGET.cpuPerHull[hullKey] || 26) + engineeringRank * BUDGET.cpuPerRank
  };
}

/**
 * How badly a fit is over budget, and what that costs.
 * @returns {{power:number,cpu:number,powerCap:number,cpuCap:number,
 *            powerOver:number,cpuOver:number,powerPenalty:number,cpuPenalty:number}}
 */
export function budgetLoad(fit, hullKey, engineeringRank = 0) {
  const f = fitBonuses(fit);
  const cap = budgetFor(hullKey, engineeringRank);
  const ratio = (use, max) => (max > 0 ? use / max : 0);

  const pr = ratio(f.power, cap.power), cr = ratio(f.cpu, cap.cpu);
  const overOf = (r, per) => {
    const over = r - (1 + BUDGET.overloadGrace);
    if (over <= 0) return 0;
    return Math.min(BUDGET.maxPenalty, (over / 0.1) * per * 0.1);
  };

  return {
    power: f.power, cpu: f.cpu,
    powerCap: cap.power, cpuCap: cap.cpu,
    powerRatio: pr, cpuRatio: cr,
    powerOver: Math.max(0, f.power - cap.power),
    cpuOver: Math.max(0, f.cpu - cap.cpu),
    powerPenalty: overOf(pr, BUDGET.powerPenalty),
    cpuPenalty: overOf(cr, BUDGET.cpuPenalty)
  };
}

/** Human-readable summary of a mod bag, for the fitting screen. */
export function describeMods(mods) {
  const pct = v => (v > 0 ? '+' : '') + Math.round(v * 100) + '%';
  const abs = v => (v > 0 ? '+' : '') + (Math.abs(v) < 10 ? v.toFixed(1) : Math.round(v));
  const LABEL = {
    thrustMult: ['Thrust', pct], speedMult: ['Top speed', pct], turnMult: ['Handling', pct],
    shieldAdd: ['Shield', abs], armorAdd: ['Armor', abs], hullAdd: ['Hull', abs],
    shieldRegenAdd: ['Shield regen', abs], energyCapAdd: ['Energy bank', abs],
    energyRegenAdd: ['Recharge', abs], cargoAdd: ['Cargo', v => abs(v) + ' kg'],
    cargoPct: ['Cargo', pct], sensorMult: ['Sensors', pct], warpSpeedMult: ['Warp cruise', pct],
    warpSpoolMult: ['Spool time', pct], warpDrainMult: ['Warp draw', pct],
    miningMult: ['Extraction', pct],
    weaponMult: ['Damage', pct], scanTierAdd: ['Scan tier', abs],
    pointDefAdd: ['Interception', pct], naniteArmorAdd: ['Armor repair', v => abs(v) + '/s'],
    naniteHullAdd: ['Hull repair', v => abs(v) + '/s'], lootRangeAdd: ['Salvage reach', v => abs(v) + ' km'],
    scanRate: ['Scan speed', pct], tradeBonus: ['Trade margin', pct]
  };
  const out = [];
  for (const k in mods) {
    if (k === 'power' || !mods[k]) continue;
    const L = LABEL[k];
    out.push(L ? `${L[0]} ${L[1](mods[k])}` : `${k} ${mods[k]}`);
  }
  return out;
}
