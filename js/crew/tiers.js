/* LIVING GALAXY — three tracks, named.
 *
 * The deck already ran three separate relationships and only one of them had
 * a vocabulary. Romance has had a named ladder earlier —
 * strangers → noticed → interested → courting → together → bonded — and it
 * reads well because the rungs are things you can point at. The other two were
 * bare numbers: `rapportBetween()` returns 0..100 and `m.morale` returns 0..100,
 * and a number is not a relationship, it is a readout of one.
 *
 * So: the same treatment for both.
 *
 *   FRIEND   wary → civil → shipmate → friend → confidant → sworn
 *   MORALE   broken → sullen → steady → willing → high → fireproof
 *
 * Tiers are not decoration. Each one gates what a hand will talk to you about
 * (`tierGate` below, which talk-trees and the wants list read), which is the
 * point: a shipmate does not tell you what they are carrying, and a confidant
 * does. And each one is a THRESHOLD with hysteresis, so a hand who has just
 * become a friend does not flicker back to shipmate on one bad watch.
 */

import { crew, rapportBetween } from "../crew.js";
import { trustOf } from "../family.js";
import { STAGES, STAGE_LABEL, stageIndex, MIN_ATTRACTION, attraction } from "./romance.js";
import { couldCourt, playerAsPerson } from "../family.js";

/* ---- the two new ladders --------------------------------------------------- */

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

/* A tier you have just entered holds until you fall this far back under it —
 * without it, a hand sitting on a boundary reads as two different people on
 * alternate frames. */
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

/** The friendship tier between the captain and a hand — trust is the captain's rapport. */
export function friendTier(m) {
  const t = tierOf(FRIEND_TIERS, trustOf(m), m?._friendTier);
  if (m) m._friendTier = t.id;
  return t;
}

/** The friendship tier between two hands. */
export function friendTierBetween(a, b) {
  return tierOf(FRIEND_TIERS, rapportBetween(a, b));
}

export function moraleTier(m) {
  const t = tierOf(MORALE_TIERS, m?.robot ? (m.condition ?? 100) : (m?.morale ?? 70), m?._moraleTier);
  if (m) m._moraleTier = t.id;
  return t;
}

/**
 * The romantic rung between the captain and a hand.
 *
 * earlier ladder runs between two CREW, and the captain is not on the crew
 * ladder — so this reads the same rungs off what the game actually tracks for
 * you: whether you are together, whether they would say yes if you asked, and
 * whether there is a draw there at all.
 */
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

/**
 * All three at once, which is how a crew sheet should read them: one person,
 * three separate things you are to them.
 */
export function tiersOf(m) {
  return { friend: friendTier(m), morale: moraleTier(m), romance: romanceTier(m) };
}

export const FRIEND_INDEX = (id) => Math.max(0, FRIEND_TIERS.findIndex((t) => t.id === id));
export const MORALE_INDEX = (id) => Math.max(0, MORALE_TIERS.findIndex((t) => t.id === id));

/**
 * Does this hand talk to you about `need`?
 *
 * This is what makes the tiers matter rather than describe. A topic declares
 * the friendship rung it wants and the mood it needs; below either, the hand
 * has an answer but it is not that answer.
 *
 *   tierGate(m, { friend: "friend" })          — only a friend will
 *   tierGate(m, { morale: "steady" })          — not while they are sullen
 *   tierGate(m, { romance: "courting" })       — and not before that
 */
export function tierGate(m, need = {}) {
  if (!m) return false;
  if (need.friend && FRIEND_INDEX(friendTier(m).id) < FRIEND_INDEX(need.friend)) return false;
  if (need.morale && MORALE_INDEX(moraleTier(m).id) < MORALE_INDEX(need.morale)) return false;
  if (need.romance && stageIndex(romanceTier(m).id) < STAGES.indexOf(need.romance)) return false;
  return true;
}

/** "Shipmate · Willing · noticed" — one line for a roster row. */
export function tierLine(m) {
  const t = tiersOf(m);
  return `${t.friend.label} · ${t.morale.label}${t.romance.id !== "strangers" ? ` · ${t.romance.label.toLowerCase()}` : ""}`;
}

/** Everyone aboard, by all three tracks — for the CREW panel and the tests. */
export function tierReport() {
  return crew.aboard.filter((m) => !m.robot).map((m) => ({ m, ...tiersOf(m) }));
}
