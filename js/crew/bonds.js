/* LIVING GALAXY — ties between hands: friend, rival, couple.
 *
 * crew.js grows a rapport number per pair every cycle and pairs couples off.
 * This layer reads that number into *ties*: a friend at seventy, a rival when
 * two people who do not fit are stuck low and share a watch. Ties are not
 * cosmetic — bondFactor() scales what a hand's station is worth to the hull
 * (crewfx.js), a rival on the same watch sours both, and the talk trees let
 * the captain take sides. Contract: PLAN.md §4.3.
 */

import { crew, crewHooks, compat, crewNote, rapportBetween, firstName } from "../crew.js";
import { adjustMorale } from "../family.js";
import { cradle } from "../npc/cradle.js";

/** rapport thresholds; couple = m.partner */
export const TIE = { friend: 70, rival: 15, rivalHeals: 40 };
const RIVAL_ROLL = 0.3;

function hashRoll(s) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return ((h >>> 0) % 10000) / 10000;
}

const byId = (id) => crew.aboard.find((x) => x.id === id) ?? null;

/** → "couple" | "friend" | "rival" | null between two members (objects or ids). */
export function tieBetween(a, b) {
  const A = typeof a === "string" ? byId(a) : a, B = typeof b === "string" ? byId(b) : b;
  if (!A || !B || A.id === B.id) return null;
  if (A.partner === B.id) return "couple";
  const r = rapportBetween(A, B);
  if (r >= TIE.friend) return "friend";
  if ((A.rivals?.[B.id] || B.rivals?.[A.id]) && r < TIE.rivalHeals) return "rival";
  return null;
}

/** → [{ with, name, kind, rapport }] — this hand's ties, couples first, then by rapport. */
export function tiesOf(m) {
  if (!m) return [];
  const out = [];
  for (const o of crew.aboard) {
    if (o.id === m.id) continue;
    const kind = tieBetween(m, o);
    if (kind) out.push({ with: o.id, name: o.name, kind, rapport: rapportBetween(m, o) });
  }
  const order = { couple: 0, friend: 1, rival: 2 };
  return out.sort((x, y) => order[x.kind] - order[y.kind] || y.rapport - x.rapport);
}

/** Symmetric rapport write; a rivalry heals itself once the number climbs back. */
export function adjustRapport(a, b, d) {
  const A = typeof a === "string" ? byId(a) : a, B = typeof b === "string" ? byId(b) : b;
  if (!A || !B || A.id === B.id) return null;
  A.bonds ??= {}; B.bonds ??= {};
  const r = Math.max(0, Math.min(100, (A.bonds[B.id] ?? 0) + d));
  A.bonds[B.id] = r; B.bonds[A.id] = r;
  if (r >= TIE.rivalHeals) { if (A.rivals) delete A.rivals[B.id]; if (B.rivals) delete B.rivals[A.id]; }
  return r;
}

/** Declare a rivalry (talk trees use it when the captain takes a side). */
export function makeRivals(a, b) {
  const A = typeof a === "string" ? byId(a) : a, B = typeof b === "string" ? byId(b) : b;
  if (!A || !B) return;
  A.rivals ??= {}; B.rivals ??= {};
  A.rivals[B.id] = true; B.rivals[A.id] = true;
}

/**
 * Per cycle (crewHooks.cycle): derive m.ties, roll new rivalries, write the
 * friend/rival lines into the crew log, and sour a rival pair on the same watch.
 */
export function tickBonds() {
  const list = crew.aboard;
  for (let i = 0; i < list.length; i++) {
    for (let j = i + 1; j < list.length; j++) {
      const a = list[i], b = list[j];
      const r = rapportBetween(a, b);
      const sameWatch = Boolean(a.duty && a.duty === b.duty) || (!a.duty && !b.duty && a.complexId === b.complexId);
      const already = a.rivals?.[b.id];
      if (!already && r < TIE.rival && compat(a, b) < 0 && sameWatch && !a.partner && !b.partner
        && hashRoll(`${a.id}:${b.id}:rival:${a.cyclesAboard ?? 0}`) < RIVAL_ROLL) {
        makeRivals(a, b);
        crewNote(`${firstName(a)} and ${firstName(b)} have stopped speaking on watch. Rivals.`);
        for (const [x, y] of [[a, b], [b, a]]) { const rec = cradle.get(x.id); if (rec) cradle.note(rec.id, `Fell out with ${y.name} aboard ${crew.employer ?? "a ship"}`); }
      }
      const kind = tieBetween(a, b);
      if (kind === "rival" && sameWatch) { adjustMorale(a, -1); adjustMorale(b, -1); }
      /* the moment a friendship forms, once */
      const key = `${a.id}:${b.id}`;
      a.tieLog ??= {};
      if (kind === "friend" && !a.tieLog[key]) { a.tieLog[key] = "friend"; crewNote(`${firstName(a)} and ${firstName(b)} are thick as thieves now.`); }
      if (kind !== "friend" && a.tieLog[key] === "friend") delete a.tieLog[key];
    }
  }
  for (const m of list) m.ties = tiesOf(m);
}

/**
 * 1 ± : +0.06 per friend on the same station this phase, −0.08 per rival there,
 * +0.03 with a partner aboard. `mannedKinds` is kind → [member ids or first names]
 * (crewfx passes ids; the interior rail's map of first names also works).
 */
export function bondFactor(m, mannedKinds) {
  if (!m || !mannedKinds) return 1;
  let mine = null;
  const has = (list, o) => list.includes(o.id) || list.includes(firstName(o));
  for (const [kind, list] of mannedKinds) if (has(list, m)) { mine = kind; break; }
  let f = 1;
  if (m.partner && (m.partner === "player" || byId(m.partner))) f += 0.03;
  if (mine == null) return f;
  const there = mannedKinds.get(mine) ?? [];
  for (const o of crew.aboard) {
    if (o.id === m.id || !has(there, o)) continue;
    const kind = tieBetween(m, o);
    if (kind === "friend" || kind === "couple") f += 0.06;
    else if (kind === "rival") f -= 0.08;
  }
  return Math.max(0.5, f);
}

/** Every pair sorted by rapport, for the BONDS tab. → [{ a, b, rapport, kind }] */
export function bondsReport() {
  const list = crew.aboard;
  const out = [];
  for (let i = 0; i < list.length; i++) {
    for (let j = i + 1; j < list.length; j++) {
      const a = list[i], b = list[j];
      out.push({ a, b, rapport: rapportBetween(a, b), kind: tieBetween(a, b) });
    }
  }
  const order = { couple: 0, friend: 1, rival: 2, null: 3 };
  return out.sort((x, y) => (order[x.kind] ?? 3) - (order[y.kind] ?? 3) || y.rapport - x.rapport);
}

if (!crewHooks.cycle.includes(tickBonds)) crewHooks.cycle.push(tickBonds);
