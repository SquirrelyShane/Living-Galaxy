import { cradle } from "../npc/cradle.js";
import { givenName, nameRng, familyOf } from "../world/names.js";
import { LEXICONS, DEFAULT_LEX } from "../data/lexicons.js";
import { RACES } from "../crew/races.js";

const LS_KEY = "lgaa.gdb.v1";
export const GDB = {
  localMax: 20000,
  tries: 10,
  pushMax: 200,
  flushMs: 2000,
};
const TRANSIENT = new Set(["pilot", "boarder", "crew"]);

const entries = new Map();
let loaded = false;
let index = null;
let indexedAt = -1;

function hash32(s) {
  let h = 2166136261;
  s = String(s);
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
}
const lower = (s) => String(s ?? "").trim().toLowerCase();
const givenOf = (full) => String(full ?? "").trim().split(/\s+/)[0] ?? "";
const bare = (s) => lower(s).replace(/[^a-z]/g, "");

export function catalogueNo(id) {
  return `GDB-${(hash32(`gdb:${id}`) % 2176782336).toString(36).toUpperCase().padStart(6, "0")}`;
}

function load() {
  if (loaded) return;
  loaded = true;
  try {
    const raw = globalThis.localStorage?.getItem(LS_KEY);
    const j = raw ? JSON.parse(raw) : null;
    for (const e of j?.entries ?? []) if (e?.id && e.name) entries.set(e.id, e);
  } catch {}
}

let saveTimer = 0;
function save() {
  if (saveTimer) return;
  saveTimer = setTimeout(() => {
    saveTimer = 0;
    prune();
    try { globalThis.localStorage?.setItem(LS_KEY, JSON.stringify({ v: 1, entries: [...entries.values()] })); } catch {}
  }, 800);
  saveTimer.unref?.();
}

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

function reforged(p, k) {
  const lex = LEXICONS[p.raceId] ?? DEFAULT_LEX;
  const rnd = nameRng(`${p.seed ?? p.id}:gdb:${k}`);
  const first = givenName(lex, p.gender ?? "nonbinary", rnd);
  const fam = familyOf(p.name);
  return fam ? `${first} ${fam}` : first;
}

const ROMAN = ["", "", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X"];

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
    if (!clash && !fallback) fallback = name;
    name = reforged(p, k);
  }
  if (fallback) return fallback;
  for (let n = 2; n < ROMAN.length; n++) if (!takenBy(`${p.name} ${ROMAN[n]}`)) return `${p.name} ${ROMAN[n]}`;
  return `${p.name} ${catalogueNo(p.id).slice(4)}`;
}

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

export function sighted(id, place = null) {
  load();
  const e = entries.get(id);
  if (!e) return null;
  e.seen = Date.now();
  if (place) e.place = place;
  save();
  return e;
}

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

export function resetGdb() {
  entries.clear(); index = null; indexedAt = -1; loaded = true; pending.clear();
  try { globalThis.localStorage?.removeItem(LS_KEY); } catch {}
}

export { raceName };
