import { crew, rapportBetween } from "./ledger.js";
import { trustOf } from "./family.js";
import { STAGES, STAGE_LABEL, stageIndex, MIN_ATTRACTION, attraction } from "./romance.js";
import { couldCourt, playerAsPerson } from "./family.js";

export const FRIEND_TIERS = [
  { id: "wary",      at: 0,  label: "Wary",      note: "civil because you sign the wages" },
  { id: "civil",     at: 18, label: "Civil",     note: "knows your watch, not your name for things" },
  { id: "shipmate",  at: 36, label: "Shipmate",  note: "would cover your watch without being asked twice" },
  { id: "friend",    at: 55, label: "Friend",    note: "tells you things that are not about the ship" },
  { id: "confidant", at: 74, label: "Confidant", note: "tells you the thing they have not told anyone" },
  { id: "sworn",     at: 90, label: "Sworn",     note: "goes where you go, and says so out loud" },
];

export const MORALE_TIERS = [
  { id: "broken",    at: 0,  label: "Broken",    note: "one bad cycle from walking off at the next port" },
  { id: "sullen",    at: 22, label: "Sullen",    note: "does the work and nothing past it" },
  { id: "steady",    at: 42, label: "Steady",    note: "no complaints worth filing" },
  { id: "willing",   at: 60, label: "Willing",   note: "picks up the job nobody asked them to" },
  { id: "high",      at: 78, label: "High",      note: "the deck is better for them being on it" },
  { id: "fireproof", at: 92, label: "Fireproof", note: "you could lose the reactor and they would still be joking" },
];

const HYSTERESIS = 4;

function tierOf(ladder, value, held) {
  let i = 0;
  for (let k = 0; k < ladder.length; k++) if (value >= ladder[k].at) i = k;
  if (held != null) {
    const h = ladder.findIndex((t) => t.id === held);
    if (h > i && value >= ladder[h].at - HYSTERESIS) i = h;
  }
  return ladder[i];
}

export function friendTier(m) {
  const t = tierOf(FRIEND_TIERS, trustOf(m), m?._friendTier);
  if (m) m._friendTier = t.id;
  return t;
}

export function friendTierBetween(a, b) {
  return tierOf(FRIEND_TIERS, rapportBetween(a, b));
}

export function moraleTier(m) {
  const t = tierOf(MORALE_TIERS, m?.robot ? (m.condition ?? 100) : (m?.morale ?? 70), m?._moraleTier);
  if (m) m._moraleTier = t.id;
  return t;
}

export function romanceTier(m) {
  const rung = (id, note) => ({ id, label: STAGE_LABEL[id] ?? id, note, index: stageIndex(id) });
  if (!m || m.robot) return rung("strangers", "not somebody you can");
  if (m.partner === "player") return rung(trustOf(m) >= 85 ? "bonded" : "together", "yours, and the deck knows");
  if (m.partner) return rung("strangers", `with ${m.partner === "player" ? "you" : "somebody else"}`);
  const att = attraction(m, playerAsPerson()) || 0;
  if (att < MIN_ATTRACTION) return rung("strangers", "the draw is not there");
  const can = couldCourt(m);
  if (can.ok) return rung(trustOf(m) >= 60 ? "courting" : "interested", "would not be surprised to be asked");
  return rung("noticed", can.why ?? "early");
}

export function tiersOf(m) {
  return { friend: friendTier(m), morale: moraleTier(m), romance: romanceTier(m) };
}

export const FRIEND_INDEX = (id) => Math.max(0, FRIEND_TIERS.findIndex((t) => t.id === id));
export const MORALE_INDEX = (id) => Math.max(0, MORALE_TIERS.findIndex((t) => t.id === id));

export function tierGate(m, need = {}) {
  if (!m) return false;
  if (need.friend && FRIEND_INDEX(friendTier(m).id) < FRIEND_INDEX(need.friend)) return false;
  if (need.morale && MORALE_INDEX(moraleTier(m).id) < MORALE_INDEX(need.morale)) return false;
  if (need.romance && stageIndex(romanceTier(m).id) < STAGES.indexOf(need.romance)) return false;
  return true;
}

export function tierLine(m) {
  const t = tiersOf(m);
  return `${t.friend.label} · ${t.morale.label}${t.romance.id !== "strangers" ? ` · ${t.romance.label.toLowerCase()}` : ""}`;
}

export function tierReport() {
  return crew.aboard.filter((m) => !m.robot).map((m) => ({ m, ...tiersOf(m) }));
}
