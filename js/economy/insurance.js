export const TIERS = [
  { id: "bronze", name: "Bronze", payout: 0.10, rate: 0.03, hue: "#a9713f" },
  { id: "copper", name: "Copper", payout: 0.25, rate: 0.07, hue: "#c2854f" },
  { id: "silver", name: "Silver", payout: 0.50, rate: 0.15, hue: "#b8c2cc" },
  { id: "gold", name: "Gold", payout: 0.75, rate: 0.24, hue: "#e2b64d" },
  { id: "platinum", name: "Platinum", payout: 1.00, rate: 0.35, hue: "#dfe7f2" },
];

export const TIER_BY_ID = Object.fromEntries(TIERS.map((t) => [t.id, t]));

export const policies = new Map();

export const insuranceLog = [];
const LOG_CAP = 40;

export const playerKey = (hullId) => `player:${hullId}`;
export const droneKey = (unitId) => `drone:${unitId}`;
export const npcKey = (vesselId) => `npc:${vesselId}`;

export function resetInsurance() {
  policies.clear();
  insuranceLog.length = 0;
}

export function premiumFor(value, tierId) {
  const t = TIER_BY_ID[tierId];
  if (!t || !(value > 0)) return 0;
  return Math.round(value * t.rate);
}

export function payoutFor(value, tierId) {
  const t = TIER_BY_ID[tierId];
  if (!t || !(value > 0)) return 0;
  return Math.round(value * t.payout);
}

export function quoteAll(value) {
  return TIERS.map((t) => ({
    id: t.id,
    name: t.name,
    hue: t.hue,
    payoutPct: t.payout,
    ratePct: t.rate,
    premium: premiumFor(value, t.id),
    payout: payoutFor(value, t.id),
    value: Math.round(value),
  }));
}

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

export function policyFor(key) {
  return policies.get(key) ?? null;
}

export function isInsured(key) {
  return policies.has(key);
}

export function release(key) {
  return policies.delete(key);
}

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

export function coverForVessel(vessel) {
  if (!vessel?.id) return null;
  if (vessel.rogue) return null;
  const table = ROLE_COVER[vessel.role] ?? DEFAULT_COVER;
  return table[hash32(`${vessel.id}:cover`) % table.length] ?? null;
}

export const DOWN_SCALE = { platinum: 0.45, gold: 0.6, silver: 0.75, copper: 0.9, bronze: 1.0 };

export function downScaleFor(vessel) {
  const tier = coverForVessel(vessel);
  return tier ? (DOWN_SCALE[tier] ?? 1) : 1.35;
}
