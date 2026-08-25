// Living Galaxy — what an NPC is actually carrying.
//
// ── the gap this closes ──────────────────────────────────────────────
// v1.01.00 shipped the ledger and named its own hole in the patch note: a hauler's cargo was
// *notional*. A deal recorded a commodity and a mass; `settle()` conjured that mass onto the
// destination market; nothing was ever aboard anything. The consequence was not cosmetic —
// it meant a laden hauler and an empty one were the same target. Intercepting a trade run
// paid exactly the fixed `salvage` figure every wreck of that type pays, so the trade lanes
// this game spent two slices building were worth nothing to a pirate and nothing to a player
// who wanted to be one.
//
// A hold is the smallest thing that fixes that. It is a bag of commodity masses on an NPC's
// userData, filled and emptied by the same routines that already fly the ship, and spilled
// when the ship comes apart.
//
// ── why holds are not persisted ──────────────────────────────────────
// NPCs are not saved. `serializeSim()` persists *places* — construction sites, territory
// claims, belt depletion — and respawns ships around them, which is the pattern v0.5 chose
// deliberately. A hold rides on a ship, so it lives and dies with one. What survives a
// reload is what the cargo *did*: the station stock a miner sold into, and the deal record
// in the ledger.
//
// ── what a spill is worth ────────────────────────────────────────────
// Never the whole hold. `HOLD.spillFraction` is the design decision in this file: if a wreck
// gave up everything it was carrying, interception would be strictly better than hauling,
// and every trade route in the game would collapse into a shooting gallery. Losing about
// half to the closing speed makes piracy a real living and still worse than being paid.

import { HOLD, COMMODITIES } from '../../core/config.js';

/** Capacity in kg, 0 for a type that has no hold at all. */
export const holdCap = u => (u && HOLD.cap[u.type]) || 0;

/** The hold itself, created on demand. Absent on a ship that cannot carry anything. */
export function holdOf(u) {
  if (!u || !holdCap(u)) return null;
  if (!u.hold) u.hold = {};
  return u.hold;
}

/** Total mass aboard. Safe on a ship with no hold — the answer is zero, not an error. */
export function holdMass(u) {
  const h = u && u.hold;
  if (!h) return 0;
  let m = 0;
  for (const k in h) m += h[k] || 0;
  return m;
}

export const holdFree = u => Math.max(0, holdCap(u) - holdMass(u));

/** True if there is enough aboard to be worth taking off somebody. */
export const laden = u => holdMass(u) >= HOLD.spillFloor;

/**
 * Put cargo aboard. Returns how much actually fitted — the caller has to cope with a
 * partial load rather than assuming it all went in, which is the same contract the
 * player's own hold has had since the 0.1 line.
 */
export function loadHold(u, commodity, kg) {
  const h = holdOf(u);
  if (!h || !COMMODITIES[commodity] || !(kg > 0)) return 0;
  const took = Math.min(kg, holdFree(u));
  if (took <= 0) return 0;
  h[commodity] = (h[commodity] || 0) + took;
  return took;
}

/** Take cargo off. Returns how much was actually there to take. */
export function unloadHold(u, commodity, kg) {
  const h = u && u.hold;
  if (!h || !(kg > 0)) return 0;
  const got = Math.min(kg, h[commodity] || 0);
  if (got <= 0) return 0;
  h[commodity] -= got;
  if (h[commodity] < 0.001) delete h[commodity];
  return got;
}

/** Everything aboard, in one call, for a delivery or a boarding. */
function emptyHold(u) {
  const h = u && u.hold;
  const out = {};
  if (!h) return out;
  for (const k in h) if (h[k] > 0) out[k] = h[k];
  u.hold = {};
  return out;
}

/**
 * What a wreck gives up, largest lots first and capped at `HOLD.spillMax`.
 *
 * The cap exists because the loot list is bounded (LOOT_LIMIT in combat.js) and a fat hauler
 * carrying three commodities plus its own salvage would shed four containers on its own. A
 * bounded list that one event can fill is a bounded list in name only.
 */
export function spillOf(u) {
  const h = (u && u.hold) || {};
  const lots = [];
  for (const k in h) {
    const kg = (h[k] || 0) * HOLD.spillFraction;
    if (kg >= HOLD.spillFloor) lots.push({ commodity: k, kg });
  }
  lots.sort((a, b) => b.kg - a.kg);
  return lots.slice(0, HOLD.spillMax);
}

/** A one-line manifest for the scanner. Null when there is nothing worth reporting. */
export function manifestOf(u) {
  const h = (u && u.hold) || {};
  const parts = [];
  for (const k in h) {
    if (h[k] < 1) continue;
    parts.push(`${Math.round(h[k])} kg ${(COMMODITIES[k] || {}).name || k}`);
  }
  return parts.length ? parts.join(' · ') : null;
}
