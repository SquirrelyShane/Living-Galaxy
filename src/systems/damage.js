// Living Galaxy — damage resolution.
//
// The shield → armour → hull cascade was written out longhand in three places in
// combat.js (player, disabling fire, NPCs), which meant three places to keep in step and
// three places for a rule to quietly diverge. It is one function now, and it understands
// damage types.
//
// A round is scaled by the resistance of the layer it is arriving at, not once on the way
// in. That matters for overpenetration: a kinetic round that empties a shield is re-scaled
// against armour with armour's kinetic multiplier, so the same round is weak against the
// first layer and strong against the second — which is the whole reason to have types.

import { DAMAGE } from '../core/config.js';

/** Normalise anything to a known type name. */
export function damageType(t) {
  return (t && DAMAGE.resist[t]) ? t : DAMAGE.fallback;
}

/** Multiplier for `type` against one layer ('shield' | 'armor' | 'hull'). */
export function resistance(type, layer) {
  const row = DAMAGE.resist[damageType(type)];
  return row && row[layer] !== undefined ? row[layer] : 1;
}

/**
 * Range falloff. Full damage inside `optimal`, decaying over `falloff` to a floor.
 * A weapon with no optimal never falls off — that is the old behaviour, unchanged.
 */
export function rangeScale(weapon, distance) {
  if (!weapon || !weapon.optimal || !(distance > weapon.optimal)) return 1;
  const span = weapon.falloff || weapon.optimal;
  const over = (distance - weapon.optimal) / span;
  return Math.max(DAMAGE.falloffFloor, 1 - over * (1 - DAMAGE.falloffFloor));
}

/**
 * Push `amount` of `type` through a shield/armour/hull stack.
 *
 * `vitals` is read and written in place: { shield, armor, hull }. Callers supply the
 * side effects they care about through `hooks` — this module deliberately knows nothing
 * about sound, status lines, or what happens when a hull reaches zero.
 *
 * @returns {{shield:number, armor:number, hull:number, total:number, breached:boolean}}
 *          damage actually dealt to each layer.
 */
export function applyDamage(vitals, amount, type, hooks = {}) {
  const t = damageType(type);
  const out = { shield: 0, armor: 0, hull: 0, total: 0, breached: false };
  let left = amount;
  if (!(left > 0)) return out;

  if (vitals.shield > 0) {
    const incoming = left * resistance(t, 'shield');
    const taken = Math.min(vitals.shield, incoming);
    vitals.shield -= taken;
    out.shield = taken;
    // Whatever the shield could not stop carries on, converted back out of shield
    // scaling so the next layer applies its own.
    left = (incoming - taken) / resistance(t, 'shield');
    if (taken > 0 && hooks.onShield) hooks.onShield(taken, vitals.shield <= 0);
  }

  if (left > 0 && vitals.armor > 0) {
    const incoming = left * resistance(t, 'armor') * DAMAGE.armorSoak;
    const taken = Math.min(vitals.armor, incoming);
    vitals.armor -= taken;
    out.armor = taken;
    left = (incoming - taken) / (resistance(t, 'armor') * DAMAGE.armorSoak);
    if (taken > 0 && hooks.onArmor) hooks.onArmor(taken, vitals.armor <= 0);
  }

  if (left > 0) {
    const incoming = left * resistance(t, 'hull') * DAMAGE.hullSoak;
    const floor = hooks.hullFloor || 0;
    const taken = Math.min(Math.max(0, vitals.hull - floor), incoming);
    vitals.hull -= taken;
    out.hull = taken;
    out.breached = vitals.hull <= 0;
    if (taken > 0 && hooks.onHull) hooks.onHull(taken, out.breached);
  }

  out.total = out.shield + out.armor + out.hull;
  return out;
}

/**
 * What a given type is good and bad against, in words. The shipyard and the target
 * drawer both want to say this without re-deriving it from the table.
 */
export function typeSummary(type) {
  const t = damageType(type);
  const row = DAMAGE.resist[t];
  const best = Object.keys(row).reduce((a, b) => (row[b] > row[a] ? b : a));
  const worst = Object.keys(row).reduce((a, b) => (row[b] < row[a] ? b : a));
  return { type: t, strongVs: best, weakVs: worst, table: row };
}
