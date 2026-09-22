/* Living Galaxy — the NPC JOURNAL: what a person did, and why, on the record.
 *
 * CRADLE has always kept a `history` — one line of prose per event, good for
 * a card and useless for anything else. This is the machine-readable layer
 * underneath it: one full record per decision, in the same shape the
 * genome-agent project writes (docs/RECORD-SCHEMA.md), re-pointed at a hull
 * instead of a grid world. Surroundings are the room and the hull's state;
 * holdings are wages owed, kit and know-how; the world that gets marked is
 * the ship.
 *
 * Storage is deliberately asymmetric. Records live in a session ring in
 * memory (everything, for the panel and the tests) and a short capped tail on
 * the CRADLE record (the last JOURNAL_KEEP, for the ledger, so a hand who
 * signs on at Kessler Reach two skies later still carries the row about the
 * night they stopped speaking to the cook). `exportJournals()` writes the lot.
 *
 * Records are data, never instructions: nothing downstream evaluates a
 * `summary` or a `reasoning` line, it only prints them.
 *
 */

import { cradle } from "../npc/cradle.js";

export const JOURNAL_VERSION = 1;
/** Full records kept on a ledger record. The session ring keeps far more. */
export const JOURNAL_KEEP = 12;
/** Full records kept in memory across the whole crew this session. */
export const RING_CAP = 400;

const ring = [];
const byAgent = new Map();

export const journal = {
  get size() { return ring.length; },
  /** Every record this session, newest last. */
  all() { return ring.slice(); },
  /** Newest first, for one hand. */
  of(id, n = 20) { return (byAgent.get(id) ?? []).slice(-n).reverse(); },
  /** The most recent record for a hand, or null. */
  last(id) { const a = byAgent.get(id); return a?.length ? a[a.length - 1] : null; },
  clear() { ring.length = 0; byAgent.clear(); },
};

/** File a record: session ring, per-agent index, and the ledger tail. */
export function fileRecord(rec) {
  if (!rec?.agent?.id) return rec;
  ring.push(rec);
  if (ring.length > RING_CAP) ring.splice(0, ring.length - RING_CAP);
  const mine = byAgent.get(rec.agent.id) ?? [];
  mine.push(rec);
  if (mine.length > RING_CAP) mine.splice(0, mine.length - RING_CAP);
  byAgent.set(rec.agent.id, mine);

  const led = cradle.get(rec.agent.id);
  if (led) {
    led.journal ??= [];
    led.journal.push(rec);
    if (led.journal.length > JOURNAL_KEEP) led.journal.splice(0, led.journal.length - JOURNAL_KEEP);
    cradle.put(led);
  }
  return rec;
}

/** 3 decimal places, the schema's rule, applied at write time. */
export const r3 = (v) => (typeof v === "number" && Number.isFinite(v) ? Math.round(v * 1000) / 1000 : v);

/**
 * {from, to, delta} for every key that actually moved. Returns null when
 * nothing did — the schema's own convention, and what keeps records small.
 */
export function diffOf(before, after, min = 0.0005) {
  const out = {};
  let any = false;
  for (const k of Object.keys(after ?? {})) {
    const a = Number(before?.[k] ?? 0), b = Number(after[k] ?? 0);
    if (!Number.isFinite(a) || !Number.isFinite(b) || Math.abs(b - a) < min) continue;
    out[k] = { from: r3(a), to: r3(b), delta: r3(b - a) };
    any = true;
  }
  return any ? out : null;
}

/** One written sentence covering the whole record. */
export function writeSummary(rec) {
  const parts = [];
  const s = rec.observedSurroundings;
  parts.push(`C${rec.cycle} — ${rec.agent.name} (${rec.observedSelf.stage}) in ${s.room}${s.docked ? ` at ${s.port}` : ""}.`);
  const seen = s.present.length ? `Present: ${s.present.join(", ")}.` : "Alone.";
  parts.push(seen);
  parts.push(`${rec.action.blocked ? "Tried to " : ""}${rec.action.label}${rec.action.targetName ? ` — ${rec.action.targetName}` : ""}${rec.action.blocked ? ` but ${rec.action.blockedReason}` : ""} (efficacy ${rec.action.efficacy}).`);
  parts.push(`Because: ${rec.whatMadeMeActThis.reasoning.slice(-2).join("; ")}.`);
  if (rec.effectOnSelf) {
    parts.push("On me: " + Object.entries(rec.effectOnSelf).map(([k, v]) => `${k} ${v.delta > 0 ? "+" : ""}${v.delta}`).join(", ") + ".");
  }
  if (rec.effectOnOthers) {
    parts.push("On others: " + rec.effectOnOthers.map((e) => `${e.name} (${e.relation}) ${Object.entries(e.changes).map(([k, v]) => `${k} ${v.delta > 0 ? "+" : ""}${v.delta}`).join(", ")}`).join("; ") + ".");
  } else {
    parts.push("On others: nobody else was touched by this.");
  }
  parts.push(rec.affectedShip && rec.effectOnShip
    ? `On the hull: ${rec.effectOnShip.interpretation.join("; ")}.`
    : "On the hull: it left no mark.");
  return parts.join(" ");
}

/* ---- serialization ------------------------------------------------------- */

/**
 * The whole flight recorder: every ledger record with its genome, lineage and
 * journal, plus this session's ring. Written by CONSOLE › CREW › LOG › EXPORT
 * and readable straight back by importJournals().
 */
export function exportJournals({ session = true } = {}) {
  const records = cradle.all().map((r) => ({
    id: r.id, name: r.name, raceId: r.raceId, seed: r.seed,
    genome: r.genome ?? null, genomeType: r.genomeType ?? null, fingerprint: r.fingerprint ?? null,
    parents: r.parents ?? null, lineage: r.lineage ?? null,
    status: r.status, employer: r.employer, cyclesServed: r.cyclesServed ?? 0,
    history: r.history ?? [],
    journal: r.journal ?? [],
  }));
  return JSON.stringify({
    cradleJournal: JOURNAL_VERSION,
    exported: Date.now(),
    counts: { people: records.length, filed: records.reduce((a, r) => a + r.journal.length, 0), session: ring.length },
    records,
    session: session ? ring : undefined,
  }, null, 1);
}

/** Take journals back in. Ledger records must already exist (importLedger first). */
export function importJournals(json) {
  const j = typeof json === "string" ? JSON.parse(json) : json;
  let n = 0;
  for (const r of j.records ?? []) {
    const led = cradle.get(r.id);
    if (!led || !r.journal?.length) continue;
    const seen = new Set((led.journal ?? []).map((x) => `${x.cycle}:${x.action?.id}`));
    led.journal = [...(led.journal ?? []), ...r.journal.filter((x) => !seen.has(`${x.cycle}:${x.action?.id}`))]
      .sort((a, b) => (a.at ?? 0) - (b.at ?? 0));
    if (led.journal.length > JOURNAL_KEEP) led.journal.splice(0, led.journal.length - JOURNAL_KEEP);
    cradle.put(led);
    n += r.journal.length;
  }
  for (const rec of j.session ?? []) fileRecord(rec);
  return n;
}

/**
 * Drop stored journals from people who are not aboard, oldest first. Called
 * when localStorage refuses a write rather than losing the ledger itself —
 * a person's genome and history are worth more than their last twelve watches.
 */
export function shedJournals(keepIds = new Set()) {
  let freed = 0;
  for (const r of cradle.all()) {
    if (keepIds.has(r.id) || !r.journal?.length) continue;
    freed += r.journal.length;
    delete r.journal;
  }
  return freed;
}

/** [{ id, action, kind, label, n }] — what this hand spends their life doing. */
export function habitsOf(id) {
  const mine = byAgent.get(id) ?? [];
  const count = new Map();
  for (const r of mine) {
    const k = r.action?.id;
    if (!k) continue;
    const e = count.get(k) ?? { action: k, label: r.action.label, kind: r.action.kind, n: 0 };
    e.n++;
    count.set(k, e);
  }
  return [...count.values()].sort((a, b) => b.n - a.n);
}
