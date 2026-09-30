import { COMPLEXES, RANK_LETTERS } from "../careers/complexes.js";
import { RACES } from "../crew/races.js";
import { personName, forgeWord } from "../world/names.js";
import { LEXICONS } from "../data/lexicons.js";
import {
  SPACER, SYNTH, createSpacer, packGenome, unpackGenome, fingerprint,
  genomeTraits, genomeIdentity, genomePulse, genomeTells, skillAptitude, tellLine,
} from "../genome/spacer.js";

export const CRADLE_VERSION = 2;
const LS_KEY = "lgaa.cradle.v1";

function mulberry(seedStr) {
  let n = 0;
  for (let i = 0; i < seedStr.length; i++) n = Math.imul(n ^ seedStr.charCodeAt(i), 2654435761) >>> 0;
  let s = n || 7;
  return () => {
    s |= 0; s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const ORIGIN_PLACE = ["a spin-hab", "a belt tug", "a foundry line", "a colony ship", "a survey outpost",
  "a dockside orphanage", "a mining barge", "a quarantine ring", "a comms relay", "a farm ring",
  "a salvage fleet", "a university station", "a tether town", "a refinery deck", "a lighter crew",
  "a hospital ship", "a bonded yard", "a chapel hull", "a listening post", "a cutter school",
  "a shatter-field camp", "a gas-skimmer platform", "a customs hulk", "a seed vault", "a drydock crèche"];
const ORIGIN_TWIST = ["that never left", "with one window", "two orbits behind on its bond",
  "that changed hands three times", "nobody charts any more", "run by a family that owned it",
  "on the wrong side of a blockade", "everyone swore they would leave", "that lost its spin for a year",
  "with a waiting list to get out", "where the air smelled of iron", "under a corporate receivership",
  "that ran a shift pattern nobody survived twice", "where the water was rationed", "built out of a dead hauler",
  "on a lane that stopped being profitable", "with a cemetery bigger than its dock"];

function originFor(race, rnd) {
  const r = rnd();
  const place = ORIGIN_PLACE[Math.floor(rnd() * ORIGIN_PLACE.length)];
  const twist = ORIGIN_TWIST[Math.floor(rnd() * ORIGIN_TWIST.length)];
  if (r < 0.34) return `${place} ${twist}`;
  if (r < 0.6) return `${place} over ${forgeWord(LEXICONS[race?.id] ?? LEXICONS.terran, rnd, 2)}`;
  if (r < 0.8) return `${place} out of ${forgeWord(LEXICONS[race?.id] ?? LEXICONS.terran, rnd, 2)} ${twist}`;
  return place;
}

export const TRAIT_AXES = ["grit", "caution", "greed", "loyalty", "curiosity"];

export const GENDERS = ["woman", "man", "nonbinary"];
export const PRONOUNS = {
  woman: { subj: "she", obj: "her", pos: "her" },
  man: { subj: "he", obj: "him", pos: "his" },
  nonbinary: { subj: "they", obj: "them", pos: "their" },
};

export function rollIdentity(rnd) {
  const g = rnd();
  const gender = g < 0.46 ? "woman" : g < 0.92 ? "man" : "nonbinary";
  const o = rnd();
  let attractedTo;
  if (o < 0.08) attractedTo = [];
  else if (o < 0.24) attractedTo = GENDERS.slice();
  else if (o < 0.46) attractedTo = [gender];
  else attractedTo = gender === "nonbinary" ? GENDERS.slice() : [gender === "woman" ? "man" : "woman"];
  if (gender === "nonbinary" && o >= 0.46 && rnd() < 0.5) attractedTo = ["nonbinary", rnd() < 0.5 ? "woman" : "man"];
  return { gender, pronouns: PRONOUNS[gender], attractedTo };
}

export function ensureIdentity(rec) {
  ensureGenome(rec);
  if (rec.gender && rec.attractedTo && rec.sex) return rec;
  if (rec.gender && !rec.sex) {
    const g0 = genomeOf(rec);
    if (g0) {
      const id0 = genomeIdentity(g0);
      rec.sex = id0.sex;
      rec.gender = id0.gender;
      rec.pronouns = PRONOUNS[id0.gender];
      rec.attractedTo = id0.attractedTo;
      rec.monogamous = id0.monogamous;
      return rec;
    }
  }
  const g = genomeOf(rec);
  const id = g ? genomeIdentity(g) : rollIdentity(mulberry(`identity:${rec.seed ?? rec.id}`));
  rec.sex = id.sex ?? null;
  rec.gender = id.gender;
  rec.pronouns = PRONOUNS[id.gender] ?? id.pronouns;
  rec.attractedTo = id.attractedTo;
  rec.monogamous = id.monogamous ?? true;
  return rec;
}

export function drawnTo(a, b) {
  return Boolean(a?.attractedTo?.includes(b?.gender));
}

export function generateNPC(seed, opts = {}) {
  const rnd = mulberry(`cradle:${seed}`);
  const ids = Object.keys(COMPLEXES);
  const complexId = opts.complexId ?? ids[Math.floor(rnd() * ids.length)];
  const c = COMPLEXES[complexId];
  const letter = opts.letter ?? RANK_LETTERS[Math.min(4, Math.floor(rnd() * rnd() * 7))];
  const rank = c.ranks?.find((r) => r.letter === letter);
  const race = opts.raceId ? RACES.find((r) => r.id === opts.raceId) : RACES[Math.floor(rnd() * RACES.length)];
  const idx = RANK_LETTERS.indexOf(letter);

  const typeId = opts.genomeType ?? SPACER;
  const genome = opts.genome ?? createSpacer(seed, race?.id ?? "terran", typeId);
  const apt = skillAptitude(genome);

  const skills = {};
  for (const s of c.primarySkills ?? []) {
    skills[s] = Math.round((10 + idx * 12 + rnd() * 10) * (0.7 + (apt[s] ?? 0.5) * 0.6));
  }
  for (const [s, v] of Object.entries(race?.affinity ?? {})) skills[s] = Math.max(skills[s] ?? 0, v);
  const strays = Object.entries(apt).sort((a, b) => b[1] - a[1]).slice(0, 5);
  for (let i = 0; i < 2 && strays.length; i++) {
    const [k, v] = strays[Math.floor(rnd() * strays.length)];
    skills[k] = Math.max(skills[k] ?? 0, Math.round(v * 26));
  }

  const traits = genomeTraits(genome);
  const identity = genomeIdentity(genome);
  const tells = genomeTells(genome);

  return {
    v: CRADLE_VERSION,
    id: `npc_${hash32(String(seed)).toString(36)}`,
    seed: String(seed),
    name: personName(race?.id ?? "terran", identity.gender, rnd).full,
    raceId: race?.id ?? "terran",
    synthetic: race?.id === "tsynth",
    origin: originFor(race, rnd),
    sex: identity.sex,
    gender: identity.gender,
    pronouns: PRONOUNS[identity.gender],
    attractedTo: identity.attractedTo,
    monogamous: identity.monogamous,
    partner: null,
    complexId,
    complexName: (c.name ?? complexId).replace(/ Complex$/, ""),
    letter,
    title: rank?.title ?? "Hand",
    skills,
    traits,
    aptitude: apt,
    tells,
    genome: packGenome(genome, typeId),
    genomeType: typeId,
    fingerprint: fingerprint(genome, typeId),
    parents: opts.parents ?? null,
    ageCycles: opts.newborn ? 0 : Math.round(260 + idx * 45 + rnd() * 180),
    pulse: genomePulse(genome),
    born: opts.sky ?? null,
    bornAt: Date.now(),
    status: "pool",
    employer: null,
    cyclesServed: 0,
    commandsHeld: 0,
    history: [],
    journal: [],
    brain: null,
  };
}

export function ensureGenome(rec) {
  if (!rec) return rec;
  if (rec.genome) {
    try { unpackGenome(rec.genome); return rec; } catch {}
  }
  const typeId = rec.genomeType === SYNTH ? SYNTH : SPACER;
  const genome = createSpacer(rec.seed ?? rec.id, rec.raceId ?? "terran", typeId);
  rec.genome = packGenome(genome, typeId);
  rec.genomeType = typeId;
  rec.fingerprint = fingerprint(genome, typeId);
  rec.aptitude ??= skillAptitude(genome);
  if (rec.ageCycles == null) rec.ageCycles = rec.status === "child" ? Math.round((rec.age ?? 0) * 8) : 320;
  rec.tells ??= genomeTells(genome);
  if (!rec.traits || Object.keys(rec.traits).length < 5) rec.traits = genomeTraits(genome);
  rec.v = CRADLE_VERSION;
  return rec;
}

export function genomeOf(rec) {
  ensureGenome(rec);
  try { return unpackGenome(rec.genome).genome; } catch { return null; }
}

export function looksLine(rec) {
  const g = genomeOf(rec);
  return g ? tellLine(g) : "";
}

function hash32(s) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
}

const db = new Map();
let loaded = false;
let dirty = false;

function load() {
  if (loaded) return;
  loaded = true;
  try {
    const raw = globalThis.localStorage?.getItem(LS_KEY);
    if (raw) for (const r of JSON.parse(raw)) if (r && r.id) db.set(r.id, r);
  } catch {}
}

function shedJournals() {
  let freed = 0;
  for (const r of db.values()) {
    if (r.status === "aboard" || r.status === "captain" || !r.journal?.length) continue;
    freed += r.journal.length;
    delete r.journal;
  }
  return freed;
}

function save() {
  dirty = false;
  const ls = globalThis.localStorage;
  if (!ls) return;
  try {
    ls.setItem(LS_KEY, JSON.stringify([...db.values()]));
  } catch {
    if (!shedJournals()) return;
    try { ls.setItem(LS_KEY, JSON.stringify([...db.values()])); } catch {}
  }
}

export const cradle = {
  get size() { load(); return db.size; },
  get(id) { load(); return db.get(id) ?? null; },
  all() { load(); return [...db.values()]; },
  put(rec) {
    load();
    db.set(rec.id, rec);
    dirty = true;
    queueMicrotask(() => dirty && save());
    pushRemote(rec);
    return rec;
  },
  note(id, text, at = Date.now()) {
    const r = this.get(id);
    if (!r) return null;
    r.history.push({ at, text });
    if (r.history.length > 60) r.history.splice(0, r.history.length - 60);
    return this.put(r);
  },
  pool(filter = () => true) {
    return this.all().filter((r) => (r.status === "pool" || r.status === "dismissed") && filter(r));
  },
  forget(id) { load(); db.delete(id); save(); },
  clear() { load(); db.clear(); save(); },
};

function isCrewing(r) {
  if (r.status !== "aboard" && r.status !== "captain") return false;
  return r.employer != null && r.employer !== r.name;
}

export function releaseEmployed(employer = null, note = null) {
  load();
  let n = 0;
  for (const r of db.values()) {
    if (!isCrewing(r)) continue;
    if (employer != null && r.employer !== employer) continue;
    r.status = "pool";
    r.employer = null;
    if (note) {
      r.history.push({ at: Date.now(), text: note });
      if (r.history.length > 60) r.history.splice(0, r.history.length - 60);
    }
    db.set(r.id, r);
    n++;
  }
  if (n) save();
  return n;
}

export function employedCount(employer = null) {
  load();
  let n = 0;
  for (const r of db.values()) {
    if (!isCrewing(r)) continue;
    if (employer != null && r.employer !== employer) continue;
    n++;
  }
  return n;
}

export function exportLedger() {
  return JSON.stringify({ cradle: CRADLE_VERSION, exported: Date.now(), records: cradle.all() }, null, 1);
}

export function importLedger(json) {
  const j = typeof json === "string" ? JSON.parse(json) : json;
  let n = 0;
  for (const r of j.records ?? []) {
    if (!r?.id) continue;
    const have = cradle.get(r.id);
    if (!have || (r.history?.length ?? 0) >= (have.history?.length ?? 0)) {
      if (have?.brain && !r.brain) r.brain = have.brain;
      if (have?.genome && !r.genome) { r.genome = have.genome; r.genomeType = have.genomeType; r.fingerprint = have.fingerprint; }
      if (have?.journal?.length) {
        const seen = new Set((r.journal ?? []).map((x) => `${x.cycle}:${x.action?.id}`));
        r.journal = [...(r.journal ?? []), ...have.journal.filter((x) => !seen.has(`${x.cycle}:${x.action?.id}`))]
          .sort((a, b) => (a.at ?? 0) - (b.at ?? 0))
          .slice(-12);
      }
      ensureGenome(r);
      if (isCrewing(r)) {
        if (!have || !isCrewing(have)) {
          r.status = "pool";
          r.employer = null;
        } else {
          r.status = have.status;
          r.employer = have.employer;
        }
      }
      cradle.put(r);
      n++;
    }
  }
  return n;
}

let remote = { enabled: false, room: "", failed: 0, dead: false };
const pending = new Map();
let flushTimer = 0;
export const FLUSH_MS = 1500;
export const FLUSH_MAX = 40;

function relayGone(status, path) {
  if (remote.dead) return;
  remote.dead = true;
  remote.enabled = false;
  pending.clear();
  if (flushTimer) { clearTimeout(flushTimer); flushTimer = 0; }
  console.warn(`[cradle] ${path} answered ${status} — this server has no ledger (static host). The CRADLE stays local; run \`python server.py\` for a shared sky.`);
}

export const PULL_RETRY_MS = [5000, 15000, 45000];
export const PULL_RETRY_STEADY_MS = 120000;
export const PUSH_RETRY_MS = 60000;
let pullTimer = 0;
let pullTries = 0;

function schedulePull() {
  if (pullTimer || !remote.enabled || remote.dead) return;
  const wait = pullTries < PULL_RETRY_MS.length ? PULL_RETRY_MS[pullTries] : PULL_RETRY_STEADY_MS;
  pullTimer = setTimeout(() => { pullTimer = 0; pullRemote(); }, wait);
  pullTimer.unref?.();
  pullTries++;
  remote.nextPullMs = wait;
}

export function pullRemote() {
  if (!remote.enabled || remote.dead || typeof fetch !== "function") return Promise.resolve(false);
  return fetch(`/cradle/all?room=${encodeURIComponent(remote.room)}`, { cache: "no-store" })
    .then((r) => {
      if (r.status === 404 || r.status === 405 || r.status === 501) { relayGone(r.status, "/cradle/all"); return null; }
      if (!r.ok) throw new Error(`cradle ${r.status}`);
      return r.json();
    })
    .then((j) => {
      noteOk(); remote.pulled = true; pullTries = 0;
      if (j?.records) importLedger(j);
      return true;
    })
    .catch(() => { noteFail(); schedulePull(); return false; });
}

export function connectCradle(room) {
  remote = { enabled: true, room: String(room || "sol").slice(0, 32), failed: 0, dead: false, pulled: false, retryAt: 0 };
  if (pullTimer) { clearTimeout(pullTimer); pullTimer = 0; }
  pullTries = 0;
  if (typeof fetch !== "function") { remote.enabled = false; return; }
  pullRemote();
}

export function disconnectCradle() {
  remote.enabled = false;
  pending.clear();
  if (flushTimer) { clearTimeout(flushTimer); flushTimer = 0; }
  if (pullTimer) { clearTimeout(pullTimer); pullTimer = 0; }
}

export function cradleRemote() {
  return { ...remote, queued: pending.size };
}

function noteFail() {
  remote.failed++;
  if (remote.failed > 3 && !remote.retryAt) remote.retryAt = Date.now() + PUSH_RETRY_MS;
}
function noteOk() { remote.failed = 0; remote.retryAt = 0; }

function pushRemote(rec) {
  if (!remote.enabled || remote.dead || typeof fetch !== "function") return;
  if (remote.failed > 3) {
    if (Date.now() < remote.retryAt) return;
    remote.retryAt = 0; remote.failed = 3;
  }
  pending.set(rec.id, rec);
  if (pending.size >= FLUSH_MAX) { flushRemote(); return; }
  if (!flushTimer) flushTimer = setTimeout(flushRemote, FLUSH_MS);
}

export function flushRemote() {
  if (flushTimer) { clearTimeout(flushTimer); flushTimer = 0; }
  if (!remote.enabled || remote.dead || !pending.size || typeof fetch !== "function") return;
  const batch = [...pending.values()];
  pending.clear();
  const put = (rec) => fetch("/cradle/put", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ room: remote.room, record: rec }),
  });
  const first = batch.shift();
  put(first).then((r) => {
    if (r.status === 404 || r.status === 405 || r.status === 501) { relayGone(r.status, "/cradle/put"); return; }
    if (!r.ok) { noteFail(); return; }
    noteOk();
    for (const rec of batch) put(rec).then((x) => { if (!x.ok) noteFail(); }).catch(() => { noteFail(); });
  }).catch(() => { noteFail(); });
}

export function traitLine(rec) {
  const t = rec.traits ?? {};
  const bits = [];
  if (t.grit > 0.7) bits.push("does not rattle");
  else if (t.grit < 0.3) bits.push("rattles easily");
  if (t.caution > 0.7) bits.push("checks everything twice");
  else if (t.caution < 0.3) bits.push("runs hot");
  if (t.greed > 0.7) bits.push("counts the cut");
  if (t.loyalty > 0.7) bits.push("stays");
  else if (t.loyalty < 0.3) bits.push("has left before");
  if (t.curiosity > 0.7) bits.push("asks questions");
  return bits.length ? bits.join(", ") : "keeps to themselves";
}

export function describeNPC(rec) {
  const race = RACES.find((r) => r.id === rec.raceId);
  const pr = rec.pronouns ? `, ${rec.pronouns.subj}/${rec.pronouns.obj}` : "";
  return `${rec.name} — ${race?.name ?? rec.raceId}${pr}, ${rec.title} (${rec.complexName} ${rec.letter}). From ${rec.origin}. ${traitLine(rec)}.`;
}
