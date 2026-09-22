/* LIVING GALAXY — hull insurance.
 *
 * Up to 0.3.33 nothing in this game could lose a hull and mean it. The
 * player's ship clamped to twelve points and coughed "hull breach contained";
 * NPCs went dark for ten minutes and came back on the same route; only a
 * contracted drone could actually die, and when it did you simply ate the
 * loss. There was nothing to insure against, so there was no insurance.
 *
 * Now there is. A policy is bought at a yard against ONE hull, it costs
 * credits, and it pays a fraction of what that hull is worth when the hull is
 * gone. Five tiers, and the payout fraction is the whole product:
 *
 *   PLATINUM  100%      GOLD  75%      SILVER  50%      COPPER  25%      BRONZE  10%
 *
 * A policy covers one loss and is consumed by it. No renewals, no billing
 * cycle, no lapse state: you buy cover for the hull you are about to fly, and
 * after it pays you decide again. The decision to re-insure is more
 * interesting than the bookkeeping would have been.
 *
 * WHAT A HULL IS WORTH, and why it is not the list price. The yard sells to a
 * complex member in their own line at 45% (ISSUE_RATE in js/shipcost.js). If
 * cover were written against list, a member could buy at 0.45, insure
 * platinum at 0.35, throw the hull away and bank 1.00 — a twenty percent
 * profit per deliberate loss, which is a money printer rather than a game
 * mechanic. So a hull is insured for what it costs ITS OWNER, at that owner's
 * own rate, and both sides of the trade move together.
 *
 * PREMIUMS are a flat fraction of that value, and every tier is a losing bet
 * unless you expect to lose the hull about a third of the time:
 *
 *   tier      payout   premium   break-even loss rate
 *   platinum   100%      35%            35%
 *   gold        75%      24%            32%
 *   silver      50%      15%            30%
 *   copper      25%       7%            28%
 *   bronze      10%       3%            30%
 *
 * Deliberately flat. The high tiers are very slightly the worse bet because
 * what you are buying up there is certainty, and certainty is never free.
 *
 * This module is state and arithmetic and nothing else — no document, no sim
 * import — so the whole thing is testable without a sky. Who claims and when
 * lives with the thing being lost: js/sim.js for the player, js/drones/ops.js
 * for contracted drones, js/npc/traffic.js for everybody else.
 */

/** The tiers, cheapest first. `payout` and `rate` are both fractions of hull value. */
export const TIERS = [
  { id: "bronze", name: "Bronze", payout: 0.10, rate: 0.03, hue: "#a9713f" },
  { id: "copper", name: "Copper", payout: 0.25, rate: 0.07, hue: "#c2854f" },
  { id: "silver", name: "Silver", payout: 0.50, rate: 0.15, hue: "#b8c2cc" },
  { id: "gold", name: "Gold", payout: 0.75, rate: 0.24, hue: "#e2b64d" },
  { id: "platinum", name: "Platinum", payout: 1.00, rate: 0.35, hue: "#dfe7f2" },
];

export const TIER_BY_ID = Object.fromEntries(TIERS.map((t) => [t.id, t]));

/** Live policies, keyed by hull key. One per hull: buying again replaces it. */
export const policies = new Map();

export const insuranceLog = [];     // the last few claims, for the console and the desk
const LOG_CAP = 40;

/** Keys are namespaced so a drone and a vessel can never collide. */
export const playerKey = (hullId) => `player:${hullId}`;
export const droneKey = (unitId) => `drone:${unitId}`;
export const npcKey = (vesselId) => `npc:${vesselId}`;

export function resetInsurance() {
  policies.clear();
  insuranceLog.length = 0;
}

/** What a tier costs against a hull worth `value`. Rounded to whole credits. */
export function premiumFor(value, tierId) {
  const t = TIER_BY_ID[tierId];
  if (!t || !(value > 0)) return 0;
  return Math.round(value * t.rate);
}

/** What a tier would pay out against a hull worth `value`. */
export function payoutFor(value, tierId) {
  const t = TIER_BY_ID[tierId];
  if (!t || !(value > 0)) return 0;
  return Math.round(value * t.payout);
}

/**
 * Every tier priced against one hull, for a yard panel or a test.
 *
 * The fractions and the credit amounts are separate fields on purpose. A
 * first cut spread the tier and then overwrote `payout` — a fraction — with a
 * credit total, so anything downstream reading `payout` got 50,618 where it
 * expected 1. Two names, no ambiguity.
 */
export function quoteAll(value) {
  return TIERS.map((t) => ({
    id: t.id,
    name: t.name,
    hue: t.hue,
    payoutPct: t.payout,          // fraction of hull value this tier covers
    ratePct: t.rate,              // fraction of hull value the premium costs
    premium: premiumFor(value, t.id),   // credits
    payout: payoutFor(value, t.id),     // credits
    value: Math.round(value),
  }));
}

/**
 * Write cover. `value` is what the hull is worth TO ITS OWNER — see the head
 * of this file for why that is not the list price. Returns the policy, or
 * null for an unknown tier or a worthless hull.
 */
export function insure(key, tierId, value, at = 0) {
  const t = TIER_BY_ID[tierId];
  if (!t || !key || !(value > 0)) return null;
  const policy = {
    key,
    tier: t.id,
    value: Math.round(value),
    premium: premiumFor(value, t.id),
    payout: payoutFor(value, t.id),
    at,
  };
  policies.set(key, policy);
  return policy;
}

/** The cover on a hull, or null. */
export function policyFor(key) {
  return policies.get(key) ?? null;
}

export function isInsured(key) {
  return policies.has(key);
}

/** Tear up a policy without paying it — the hull was sold, or the sky reset. */
export function release(key) {
  return policies.delete(key);
}

/**
 * The hull is gone. Pays out and consumes the policy; returns what is owed,
 * or 0 if there was no cover.
 *
 * The payout is settled against the value recorded WHEN THE COVER WAS WRITTEN,
 * not the hull's worth today. That is what an insurer actually promises, and
 * it stops a refit the week before a loss from paying for itself.
 */
export function claim(key, { at = 0, what = "hull", by = null } = {}) {
  const p = policies.get(key);
  if (!p) return { paid: 0, tier: null, policy: null };
  policies.delete(key);
  const entry = {
    key, tier: p.tier, paid: p.payout, value: p.value, premium: p.premium,
    what, by, at,
  };
  insuranceLog.unshift(entry);
  if (insuranceLog.length > LOG_CAP) insuranceLog.length = LOG_CAP;
  return { paid: p.payout, tier: p.tier, policy: p };
}

/** What the underwriters have on the books, for the console and the news desk. */
export function insuranceReport() {
  const open = [...policies.values()];
  const byTier = {};
  for (const p of open) byTier[p.tier] = (byTier[p.tier] ?? 0) + 1;
  return {
    open: open.length,
    exposure: open.reduce((a, p) => a + p.payout, 0),
    premiums: open.reduce((a, p) => a + p.premium, 0),
    byTier,
    recent: insuranceLog.slice(0, 8),
    paidOut: insuranceLog.reduce((a, e) => a + e.paid, 0),
  };
}

/* ---- who else carries cover ---------------------------------------------
 *
 * The sky is not all uninsured just because the player is the only one who
 * shops. A hull with a captain and a route has an underwriter behind it, and
 * which tier is a fact about that operator — a freight line running a lane
 * insures properly, a pirate does not insure at all.
 *
 * It is seeded off the vessel id, so the same hull always carries the same
 * cover: no state to sync across a shared sky, and the SHIPS directory can
 * say what a contact is covered for without asking anybody.
 */
const ROLE_COVER = {
  freight: ["silver", "gold", "gold", "platinum", null],
  courier: ["copper", "silver", "silver", "gold", null],
  liner: ["gold", "gold", "platinum", "platinum", null],
  patrol: ["silver", "gold", "gold", "gold", null],
  law: ["gold", "gold", "platinum", "platinum", null],
  miner: ["bronze", "copper", "copper", "silver", null, null],
  salvage: ["bronze", "copper", "copper", "silver", null, null],
  prospector: ["bronze", "copper", null, null, null],
  pirate: [null],
  rogue: [null],
};
const DEFAULT_COVER = ["bronze", "copper", "silver", null, null];

function hash32(s) {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 0x01000193); }
  return h >>> 0;
}

/** The tier a vessel carries, or null for none. Deterministic in its id. */
export function coverForVessel(vessel) {
  if (!vessel?.id) return null;
  if (vessel.rogue) return null;               // nobody underwrites a drone nest
  const table = ROLE_COVER[vessel.role] ?? DEFAULT_COVER;
  return table[hash32(`${vessel.id}:cover`) % table.length] ?? null;
}

/**
 * How long a downed hull stays off the board, as a multiple of the base.
 * A covered operator has the money to replace it and is back sooner; an
 * uninsured one is not. This is the whole mechanical meaning of NPC cover,
 * and it is visible: a lane that keeps its traffic is a lane whose haulers
 * are properly underwritten.
 */
export const DOWN_SCALE = { platinum: 0.45, gold: 0.6, silver: 0.75, copper: 0.9, bronze: 1.0 };

export function downScaleFor(vessel) {
  const tier = coverForVessel(vessel);
  return tier ? (DOWN_SCALE[tier] ?? 1) : 1.35;   // uninsured takes longer than the base
}
