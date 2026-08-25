// Living Galaxy — what a yard charges, without the yard.
//
// `repairQuote()` lived in `economy.js`, which is correct in the sense that the yard is
// where you pay it and wrong in the sense that the *number* depends on nothing the yard
// owns: hull damage, armour damage, and two discounts that are already on `S.stats`.
//
// It moved here because ARIA's fact table needs to ask "can we afford the repair" before
// deciding whether a berth is worth flying to, and `economy.js` sits in the middle of the
// trade/contract/character knot — importing it from `systems/npc/facts.js` put the fact
// table inside that knot and took the project's import-cycle count to exactly its ceiling.
//
// A price is a leaf. It reads state and config and returns a number, and everything that
// wants one — the yard, the pad checklist, the autopilot's affordability gate, the fact
// table — should be able to have it without pulling the shop in behind it.

import { S } from '../../core/state.js';
import { REPAIR_COST } from '../../core/config.js';

/** Station-side services get cheaper with docking papers. Capped, like every discount. */
export const serviceScale = () =>
  1 - Math.min(0.5, Math.max(0, (S.stats && S.stats.dockDiscount) || 0));

/**
 * What a full hull-and-armour repair would cost here.
 *
 * @returns {{armor:number, hull:number, cost:number}} points of each to make good, and the
 *   bill. A cost of 0 means there is nothing to fix, which is not the same as free.
 */
export function repairQuote() {
  const p = S.player, st = S.stats;
  const armor = Math.max(0, st.armorMax - p.armor);
  const hull = Math.max(0, st.hullMax - p.hull);
  return {
    armor, hull,
    // Yard rates and pad papers both apply, each capped at half on its own so the two
    // together can take at most three quarters off — a real perk, not a free repair.
    cost: Math.ceil((armor * REPAIR_COST.armor + hull * REPAIR_COST.hull) *
                    (1 - Math.min(0.5, (S.stats.repairDiscount || 0))) * serviceScale())
  };
}
