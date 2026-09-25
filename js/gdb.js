/* LIVING GALAXY — the GALACTIC DATABASE (GDB), 0.3.54.
 *
 * Reported: everybody had similar names, or the same names. Measured, it was
 * three things, and none of them was the forge running out of names:
 *
 *   1. A hiring hall filled half its list from the WHOLE sky's pool — and every
 *      candidate any hall had ever offered went into that pool. So the people
 *      you were offered at the first port were offered again at every port
 *      after it. Same faces, same names, everywhere.
 *   2. Nothing checked a new person against the people already in the room.
 *      Inside one people the forge is meant to sound alike — that is how a
 *      Korrash reads as a Korrash — so eight of them on one list shared a
 *      beginning or an ending more often than not (55–89% of same-people
 *      crews of eight, by the numbers).
 *   3. Most of the sky's people were never filed at all. NPC crews, the flow
 *      boats' pilots, boarders: forged on the spot and forgotten, so nothing
 *      stopped one of them wearing a name somebody else already had.
 *
 * The GDB is the catalogue of every person the galaxy produces. CRADLE stays
 * the full record (genome, history, brain — js/npc/cradle.js); the GDB is the
 * index over it plus a light entry for the people who never needed a full
 * one. Filing somebody here is what makes them a person:
 *
 *   ONE NAME, ONE PERSON   a full name is never issued twice. A clash is
 *                          re-forged from the person's own seed, so it is the
 *                          same answer on every device.
 *   NOT A NAME TWICE IN A ROOM  filed with a `group` (the hall, the hull's
 *                          crew, your own crew), a given name that shares its
 *                          first or last three letters with someone already in
 *                          the room is re-forged too.
 *   IDENTITY STANDS        once filed, a person keeps their name — a captain
 *                          regenerated from the same seed next session is the
 *                          same captain, with the same name, not a new one.
 *   A NUMBER               GDB-XXXXXX off the id: stable, and the same on
 *                          every device.
 *   A RECORD               who, what people, what trade, where they were first
 *                          and last seen, alive or dead — and the chronicle,
 *                          every line the ledger's histories hold, newest first.
 *
 * Storage: `lgaa.gdb.v1` on the device, and the relay's /gdb endpoints when
 * one is up (server.py keeps gdb.json), the same local-first way CRADLE does.
 * It is the galaxy's, not the pilot's, so it is not in the account snapshot.
 *
 * CON › CREW › GDB reads it (js/console/panels/crew-gdb.js).
 */

import { cradle } from "./npc/cradle.js";
import { givenName, nameRng, familyOf } from "./names.js";
import { LEXICONS, DEFAULT_LEX } from "./data/lexicons.js";
import { RACES } from "./races.js";

const LS_KEY = "lgaa.gdb.v1";
export const GDB = {
  localMax: 20000,       // light entries kept on a device; transient kinds go first
  tries: 10,             // re-forges before a name is accepted as it stands
  pushMax: 200,          // entries per POST
  flushMs: 2000,
};
/* who may be dropped from the device's catalogue first when it is full */
const TRANSIENT = new Set(["pilot", "boarder", "crew"]);

const entries = new Map();          // id → light entry
let loaded = false;
let index = null;                   // lower full name → id
let indexedAt = -1;                 // cradle.size + entries.size when built

function hash32(s) {
  let h = 2166136261;
  s = String(s);
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
}
const lower = (s) => String(s ?? "").trim().toLowerCase();
const givenOf = (full) => String(full ?? "").trim().split(/\s+/)[0] ?? "";
const bare = (s) => lower(s).replace(/[^a-z]/g, "");

/** GDB-7Q2K9A — stable off the id, the same on every device. */
export function catalogueNo(id) {
  return `GDB-${(hash32(`gdb:${id}`) % 2176782336).toString(36).toUpperCase().padStart(6, "0")}`;
}

/* ---- storage -------------------------------------------------------------- */

function load() {
  if (loaded) return;
  loaded = true;
  try {
    const raw = globalThis.localStorage?.getItem(LS_KEY);
    const j = raw ? JSON.parse(raw) : null;
    for (const e of j?.entries ?? []) if (e?.id && e.name) entries.set(e.id, e);
  } catch { /* private mode: the catalogue lives for the session */ }
}

let saveTimer = 0;
function save() {
  if (saveTimer) return;
  saveTimer = setTimeout(() => {
    saveTimer = 0;
    prune();
    try { globalThis.localStorage?.setItem(LS_KEY, JSON.stringify({ v: 1, entries: [...entries.values()] })); } catch { /* full: kept for the session */ }
  }, 800);
  saveTimer.unref?.();
}

/** Keep the device's catalogue bounded: transient people nobody met again go first. */
function prune() {
  if (entries.size <= GDB.localMax) return 0;
  const drop = [...entries.values()]
    .filter((e) => !e.full)
    .sort((a, b) => (TRANSIENT.has(b.kind) ? 1 : 0) - (TRANSIENT.has(a.kind) ? 1 : 0) || (a.seen ?? 0) - (b.seen ?? 0))
    .slice(0, entries.size - GDB.localMax);
  for (const e of drop) entries.delete(e.id);
  index = null;
  return drop.length;
}

/* ---- the name index ------------------------------------------------------- */

function names() {
  load();
  const n = cradle.size + entries.size;
  if (index && indexedAt === n) return index;
  index = new Map();
  for (const r of cradle.all()) if (r?.name) index.set(lower(r.name), r.id);
  for (const e of entries.values()) if (!index.has(lower(e.name))) index.set(lower(e.name), e.id);
  indexedAt = n;
  return index;
}

/** Two given names that would be confused on a crew list. */
export function looksAlike(a, b) {
  const x = bare(givenOf(a)), y = bare(givenOf(b));
  if (!x || !y) return false;
  if (x === y) return true;
  if (x.length >= 4 && y.length >= 4) {
    if (x.slice(0, 3) === y.slice(0, 3)) return true;
    if (x.slice(-3) === y.slice(-3)) return true;
  }
  return false;
}

/** The name somebody would get on re-forge `k` — the given name only; the family is theirs. */
function reforged(p, k) {
  const lex = LEXICONS[p.raceId] ?? DEFAULT_LEX;
  const rnd = nameRng(`${p.seed ?? p.id}:gdb:${k}`);
  const first = givenName(lex, p.gender ?? "nonbinary", rnd);
  const fam = familyOf(p.name);
  return fam ? `${first} ${fam}` : first;
}

const ROMAN = ["", "", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X"];

/**
 * A name nobody else in the galaxy has, and that does not look like anybody's
 * in `group`. Deterministic for the person and the room.
 */
export function uniqueName(p, { group = [] } = {}) {
  const idx = names();
  const others = group.filter((g) => g && g.id !== p.id && g.name);
  const takenBy = (n) => { const id = idx.get(lower(n)); return id && id !== p.id; };
  const alike = (n) => others.some((g) => looksAlike(n, g.name));
  let name = p.name;
  let fallback = null;
  for (let k = 0; k <= GDB.tries; k++) {
    const clash = takenBy(name);
    if (!clash && !alike(name)) return name;
    if (!clash && !fallback) fallback = name;       // unique but alike: better than nothing
    name = reforged(p, k);
  }
  if (fallback) return fallback;
  /* ten re-forges and every one taken: the tongue is crowded — number them */
  for (let n = 2; n < ROMAN.length; n++) if (!takenBy(`${p.name} ${ROMAN[n]}`)) return `${p.name} ${ROMAN[n]}`;
  return `${p.name} ${catalogueNo(p.id).slice(4)}`;
}

/* ---- filing --------------------------------------------------------------- */

function entryFrom(p, { kind, place, sky, full }) {
  return {
    id: p.id,
    no: catalogueNo(p.id),
    name: p.name,
    raceId: p.raceId ?? "terran",
    gender: p.gender ?? null,
    complexId: p.complexId ?? null,
    letter: p.letter ?? null,
    title: p.title ?? null,
    kind: kind ?? "person",
    place: place ?? null,
    sky: sky ?? p.born ?? null,
    at: Date.now(),
    seen: Date.now(),
    status: p.status === "dead" ? "dead" : "alive",
    full: Boolean(full),
  };
}

function remember(e) {
  const had = entries.get(e.id);
  if (had) {
    /* first filing wins the name and the date; the rest is the latest word */
    e.name = had.name; e.at = had.at; e.no = had.no;
    if (had.status === "dead") e.status = "dead";
    e.kind = had.kind === "person" ? e.kind : had.kind;
    e.full = had.full || e.full;
  }
  entries.set(e.id, e);
  const idx = names();
  idx.set(lower(e.name), e.id);
  indexedAt = cradle.size + entries.size;
  queuePush(e);
  save();
  return e;
}

/**
 * File a full CRADLE record. Someone already on file keeps the name they have;
 * someone new gets a name nobody has, and one that does not look like anyone's
 * in `group`. Puts the record in CRADLE. Returns the record that stands.
 */
export function file(rec, { kind = "person", place = null, group = [], put = true } = {}) {
  if (!rec?.id) return rec;
  load();
  const have = cradle.get(rec.id);
  if (have) {
    remember(entryFrom(have, { kind, place: place ?? have.station ?? null, sky: have.born, full: true }));
    return have;
  }
  const known = entries.get(rec.id);
  rec.name = known ? known.name : uniqueName(rec, { group });
  rec.gdb = { no: catalogueNo(rec.id), kind, place, at: Date.now() };
  if (place && !rec.station) rec.station = place;
  if (put) cradle.put(rec);
  remember(entryFrom(rec, { kind, place, sky: rec.born, full: true }));
  return rec;
}

/**
 * Catalogue somebody who does not carry a full record — an NPC hull's crew, a
 * flow boat's pilot, a boarder. `p` = { id, seed?, name, raceId, gender, … }.
 * Mutates and returns `p` with the name that stands.
 */
export function catalogue(p, { kind = "crew", place = null, group = [], sky = null } = {}) {
  if (!p?.id || !p.name) return p;
  load();
  const known = entries.get(p.id) ?? null;
  const full = cradle.get(p.id);
  if (full) p.name = full.name;
  else if (known) p.name = known.name;
  else p.name = uniqueName(p, { group });
  const e = entryFrom(p, { kind, place, sky, full: Boolean(full) });
  if (known) { e.at = known.at; }
  remember(e);
  return p;
}

/** They died. The catalogue keeps them; that is what it is for. */
export function markDead(id, how = null) {
  load();
  const e = entries.get(id) ?? (cradle.get(id) ? entryFrom(cradle.get(id), { kind: "person", full: true }) : null);
  if (!e) return false;
  e.status = "dead";
  e.died = Date.now();
  if (how) e.how = String(how).slice(0, 120);
  entries.set(id, e);
  queuePush(e);
  save();
  return true;
}

/** Seen again: where, and when. */
export function sighted(id, place = null) {
  load();
  const e = entries.get(id);
  if (!e) return null;
  e.seen = Date.now();
  if (place) e.place = place;
  save();
  return e;
}

/* ---- reading it ------------------------------------------------------------- */

/** Everyone on file: the light entries, with full records folded in. */
export function everyone() {
  load();
  const out = new Map();
  for (const e of entries.values()) out.set(e.id, e);
  for (const r of cradle.all()) {
    if (!r?.id) continue;
    const e = out.get(r.id);
    const status = r.status === "dead" ? "dead" : (e?.status ?? "alive");
    out.set(r.id, { ...(e ?? entryFrom(r, { kind: r.status === "captain" ? "captain" : "person", place: r.station ?? null, sky: r.born, full: true })), name: r.name, title: r.title ?? e?.title ?? null, status, full: true, rstatus: r.status });
  }
  return [...out.values()];
}

export function entryOf(id) {
  load();
  const r = cradle.get(id);
  const e = entries.get(id);
  if (!r && !e) return null;
  return r ? { ...(e ?? entryFrom(r, { kind: "person", place: r.station ?? null, sky: r.born, full: true })), name: r.name, title: r.title, status: r.status === "dead" ? "dead" : (e?.status ?? "alive"), full: true, rec: r } : e;
}

/** Counts, for the head of the GDB page. `sky` narrows it to one sky. */
export function census({ sky = null } = {}) {
  const list = everyone().filter((e) => !sky || !e.sky || e.sky === sky);
  const by = (k) => { const m = {}; for (const e of list) { const v = e[k] ?? "—"; m[v] = (m[v] ?? 0) + 1; } return m; };
  const dupes = (() => { const seen = new Map(); let n = 0; for (const e of list) { const k = lower(e.name); if (seen.has(k)) n++; else seen.set(k, e.id); } return n; })();
  return {
    total: list.length,
    alive: list.filter((e) => e.status !== "dead").length,
    dead: list.filter((e) => e.status === "dead").length,
    full: list.filter((e) => e.full).length,
    byRace: by("raceId"),
    byKind: by("kind"),
    byComplex: by("complexId"),
    peoples: new Set(list.map((e) => e.raceId)).size,
    sharedNames: dupes,
  };
}

const raceName = (id) => RACES.find((r) => r.id === id)?.name ?? id;

/** Search by name, people, trade, title or catalogue number. */
export function search(q = "", { kind = null, race = null, sky = null, alive = null, limit = 40, offset = 0 } = {}) {
  const s = lower(q);
  const list = everyone().filter((e) => {
    if (kind && e.kind !== kind) return false;
    if (race && e.raceId !== race) return false;
    if (sky && e.sky && e.sky !== sky) return false;
    if (alive === true && e.status === "dead") return false;
    if (alive === false && e.status !== "dead") return false;
    if (!s) return true;
    return lower(e.name).includes(s) || lower(e.no).includes(s) || lower(raceName(e.raceId)).includes(s)
      || lower(e.title).includes(s) || lower(e.complexId).includes(s);
  });
  list.sort((a, b) => (b.seen ?? b.at ?? 0) - (a.seen ?? a.at ?? 0));
  return { total: list.length, rows: list.slice(offset, offset + limit) };
}

/** The chronicle: every line the ledger's histories hold, newest first. */
export function chronicle(n = 30, { sky = null } = {}) {
  const out = [];
  for (const r of cradle.all()) {
    if (sky && r.born && r.born !== sky) continue;
    for (const h of r.history ?? []) out.push({ at: h.at ?? 0, id: r.id, name: r.name, text: h.text });
  }
  for (const e of entries.values()) if (e.status === "dead" && e.died && !cradle.get(e.id)) out.push({ at: e.died, id: e.id, name: e.name, text: `Died${e.how ? ` — ${e.how}` : ""}` });
  out.sort((a, b) => b.at - a.at);
  return out.slice(0, n);
}

/* ---- the relay -------------------------------------------------------------- */

let remote = { enabled: false, room: "", dead: false };
const pending = new Map();
let pushTimer = 0;

function queuePush(e) {
  if (!remote.enabled || remote.dead) return;
  pending.set(e.id, e);
  if (pending.size >= GDB.pushMax) { flushGdb(); return; }
  if (!pushTimer) { pushTimer = setTimeout(flushGdb, GDB.flushMs); pushTimer.unref?.(); }
}

function gone(status) {
  remote.dead = true; remote.enabled = false; pending.clear();
  if (pushTimer) { clearTimeout(pushTimer); pushTimer = 0; }
  globalThis.console?.info?.(`[gdb] relay answered ${status} — the catalogue stays on this device`);
}

export function flushGdb() {
  if (pushTimer) { clearTimeout(pushTimer); pushTimer = 0; }
  if (!remote.enabled || remote.dead || !pending.size || typeof fetch !== "function") return Promise.resolve(false);
  const batch = [...pending.values()].slice(0, GDB.pushMax);
  for (const e of batch) pending.delete(e.id);
  if (pending.size && !pushTimer) { pushTimer = setTimeout(flushGdb, GDB.flushMs); pushTimer.unref?.(); }
  return fetch("/gdb/put", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ room: remote.room, entries: batch }) })
    .then((r) => { if (r.status === 404 || r.status === 405 || r.status === 501) gone(r.status); return r.ok; })
    .catch(() => false);
}

/**
 * Merge what another device (via the relay) filed. The first filing of a
 * person wins their name — that is how two devices converge on one identity.
 */
export function mergeEntries(list = []) {
  load();
  let n = 0;
  for (const e of list) {
    if (!e?.id || !e.name) continue;
    const had = entries.get(e.id);
    if (had && (had.at ?? 0) <= (e.at ?? Infinity)) {
      if (e.status === "dead") had.status = "dead";
      if ((e.seen ?? 0) > (had.seen ?? 0)) { had.seen = e.seen; had.place = e.place ?? had.place; }
      continue;
    }
    entries.set(e.id, { ...e, no: catalogueNo(e.id) });
    n++;
  }
  if (n) { index = null; save(); }
  return n;
}

export function connectGdb(room) {
  remote = { enabled: typeof fetch === "function", room: String(room || "sol").slice(0, 32), dead: false };
  if (!remote.enabled) return Promise.resolve(false);
  return fetch(`/gdb/all?room=${encodeURIComponent(remote.room)}`, { cache: "no-store" })
    .then((r) => {
      if (r.status === 404 || r.status === 405 || r.status === 501) { gone(r.status); return null; }
      return r.ok ? r.json() : null;
    })
    .then((j) => {
      if (!j) return false;
      if (j.entries) mergeEntries(j.entries);
      /* the sky's people were filed before the relay answered (the halls and
       * the captains are made at launch): send up whatever it does not have */
      const there = new Set((j.entries ?? []).map((e) => e.id));
      for (const e of entries.values()) if ((!e.sky || e.sky === remote.room) && !there.has(e.id)) pending.set(e.id, e);
      if (pending.size) flushGdb();
      return true;
    })
    .catch(() => false);
}

export function disconnectGdb() {
  remote.enabled = false;
  pending.clear();
  if (pushTimer) { clearTimeout(pushTimer); pushTimer = 0; }
}

/** Tests only: forget the device catalogue. */
export function resetGdb() {
  entries.clear(); index = null; indexedAt = -1; loaded = true; pending.clear();
  try { globalThis.localStorage?.removeItem(LS_KEY); } catch { /* ignore */ }
}

export { raceName };
