/* LIVING GALAXY experimental — CRADLE.
 *
 *   Crew Registry And Digital Ledger of Entities
 *
 * Every person the sky ever produces is born here and filed here: a name, a
 * race, an origin, a trade and rank, a skill sheet, a personality vector, and
 * a history that grows as they sail. Hiring halls draw from the ledger before
 * they invent anyone new, so the hand you dismissed at Foundry Hold can turn
 * up at Kessler Reach two skies later with the grudge still on record. An NPC
 * who has held command carries a `brain` — the weights of the neural core
 * that learned from the way you fly — and that comes with them.
 *
 * Storage: localStorage on the device (always), plus the relay server's
 * `/cradle` endpoints when one is present (opt-in shared ledger, see
 * server.py). Records are plain JSON; `exportLedger()` / `importLedger()`
 * move them between devices by hand.
 */

import { COMPLEXES, RANK_LETTERS } from "../careers/complexes.js";
import { RACES } from "../races.js";
import { personName, forgeWord } from "../names.js";
import { LEXICONS } from "../data/lexicons.js";
import {
  SPACER, SYNTH, createSpacer, packGenome, unpackGenome, fingerprint,
  genomeTraits, genomeIdentity, genomePulse, genomeTells, skillAptitude, tellLine,
} from "../genome/spacer.js";

/* v2: every record carries a genome. The five trait axes, the pulse, the
 * identity and the visible tells are all read off it rather than rolled
 * separately, so a child really does have their mother's eyes and their
 * father's caution. v1 records are grown a genome from their own seed the
 * first time they are touched — deterministic, so the same old hand comes
 * back the same way on every device. */
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

/* Names used to come out of one pool regardless of who they were attached to,
 * which is why a sky that is half women read as a sky of men. Then they came
 * out of three. Now they come out of a forge (js/names.js): every race has
 * its own sounds, gender rides on the ending the way it does in most real
 * tongues, and a share of every draw takes the neutral endings so a crew list
 * still tells you less than a face does. The supply is effectively endless,
 * and a Korrash reads as a Korrash before you have seen one.
 */

/* Where somebody is from, built rather than listed — a place and the thing
 * that was wrong with it. Four hundred-odd combinations, and the place half
 * is drawn from the same tongue their name is, so a Delvath is from a
 * Delvath-sounding warren. */
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

/* Five axes. 0..1. Nothing is good or bad; a cautious pilot lives and a greedy one gets rich. */
export const TRAIT_AXES = ["grit", "caution", "greed", "loyalty", "curiosity"];

/* ---- identity ------------------------------------------------------------
 * Who someone is, for the deck's social life: a gender, pronouns, and who
 * they are drawn to. Any pairing can form aboard when the interest is
 * mutual — the ledger does not have a "default" couple. Synthetics roll the
 * same table; a few of everyone are aromantic and simply make good friends.
 */
export const GENDERS = ["woman", "man", "nonbinary"];
export const PRONOUNS = {
  woman: { subj: "she", obj: "her", pos: "her" },
  man: { subj: "he", obj: "him", pos: "his" },
  nonbinary: { subj: "they", obj: "them", pos: "their" },
};

/** The genome decides who someone is; this is the old die-roll, kept for tests. */
export function rollIdentity(rnd) {
  const g = rnd();
  const gender = g < 0.46 ? "woman" : g < 0.92 ? "man" : "nonbinary";
  const o = rnd();
  let attractedTo;
  if (o < 0.08) attractedTo = [];                                   // aromantic
  else if (o < 0.24) attractedTo = GENDERS.slice();                  // anyone
  else if (o < 0.46) attractedTo = [gender];                         // same
  else attractedTo = gender === "nonbinary" ? GENDERS.slice() : [gender === "woman" ? "man" : "woman"];
  if (gender === "nonbinary" && o >= 0.46 && rnd() < 0.5) attractedTo = ["nonbinary", rnd() < 0.5 ? "woman" : "man"];
  return { gender, pronouns: PRONOUNS[gender], attractedTo };
}

/**
 * Older ledger records predate identity; grow one from the genome.
 *
 * v2 records carry a gender read off the old sex split, which put a fifth of
 * everyone in the same box. A record with no `sex` on it is one of those:
 * re-read it, which is deterministic, so the same person comes back the same
 * way — just with the ratios the sky should have had.
 */
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

/** Would `a` be drawn to `b`, on paper? Mutual interest is what a bond needs. */
export function drawnTo(a, b) {
  return Boolean(a?.attractedTo?.includes(b?.gender));
}

/** Deterministic new entity. `seed` decides everything; the same seed is the same person. */
export function generateNPC(seed, opts = {}) {
  const rnd = mulberry(`cradle:${seed}`);
  const ids = Object.keys(COMPLEXES);
  const complexId = opts.complexId ?? ids[Math.floor(rnd() * ids.length)];
  const c = COMPLEXES[complexId];
  const letter = opts.letter ?? RANK_LETTERS[Math.min(4, Math.floor(rnd() * rnd() * 7))];
  const rank = c.ranks?.find((r) => r.letter === letter);
  const race = opts.raceId ? RACES.find((r) => r.id === opts.raceId) : RACES[Math.floor(rnd() * RACES.length)];
  const idx = RANK_LETTERS.indexOf(letter);

  /* the body comes first — everything below is read off it */
  const typeId = opts.genomeType ?? SPACER;
  const genome = opts.genome ?? createSpacer(seed, race?.id ?? "terran", typeId);
  const apt = skillAptitude(genome);

  /* skills: primaries scaled by rank, lifted where the body is suited to it,
   * and a couple of strays from whatever else they turned out to be good at */
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
    partner: null,           // ledger id of who they are with, if anyone
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
    /* Age on the life-stage clock, in pay cycles. A hand who walks into a
     * hiring hall has already had a life: rank buys years, so an Entry hand
     * reads prime and a Director reads mature. Only somebody born aboard
     * starts at zero. Lifespan comes off the longevity genes, so the same
     * number of cycles is not the same age for everyone. */
    ageCycles: opts.newborn ? 0 : Math.round(260 + idx * 45 + rnd() * 180),
    pulse: genomePulse(genome),
    born: opts.sky ?? null,
    bornAt: Date.now(),
    status: "pool",          // pool | aboard | captain | dismissed | captive | dead
    employer: null,          // callsign of the pilot who has them aboard
    cyclesServed: 0,
    commandsHeld: 0,
    history: [],
    journal: [],             // full decision records — see js/crew/journal.js
    brain: null,             // neural-core weights once they have held the conn
  };
}

/**
 * A v1 record, or any record that lost its genome, grows one from its own
 * seed. The seed is what made the person in the first place, so the body it
 * produces is the body they always had — it was simply never written down.
 */
export function ensureGenome(rec) {
  if (!rec) return rec;
  if (rec.genome) {
    try { unpackGenome(rec.genome); return rec; } catch { /* corrupt — regrow below */ }
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

/** The genome itself, decoded. Null only if the record cannot produce one. */
export function genomeOf(rec) {
  ensureGenome(rec);
  try { return unpackGenome(rec.genome).genome; } catch { return null; }
}

/** "183 cm, lean, red hair and grey eyes" — what you can see across a mess. */
export function looksLine(rec) {
  const g = genomeOf(rec);
  return g ? tellLine(g) : "";
}

function hash32(s) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
}

/* ---- the ledger ---------------------------------------------------------- */

const db = new Map();
let loaded = false;
let dirty = false;

function load() {
  if (loaded) return;
  loaded = true;
  try {
    const raw = globalThis.localStorage?.getItem(LS_KEY);
    if (raw) for (const r of JSON.parse(raw)) if (r && r.id) db.set(r.id, r);
  } catch { /* private mode, or no storage — the ledger lives for the session */ }
}

/* Journals are the heavy part of a record and the cheapest thing to lose: a
 * person's genome, lineage and history are what make them the same person on
 * the next device. When the device refuses the write, shed the stored decision
 * records of everyone who is not currently aboard and try once more. */
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
    if (!shedJournals()) return;                 /* nothing left to give up */
    try { ls.setItem(LS_KEY, JSON.stringify([...db.values()])); } catch { /* still full */ }
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
  /** Append a line to a record's history and file it. */
  note(id, text, at = Date.now()) {
    const r = this.get(id);
    if (!r) return null;
    r.history.push({ at, text });
    if (r.history.length > 60) r.history.splice(0, r.history.length - 60);
    return this.put(r);
  },
  /** Everyone not currently aboard someone's ship. */
  pool(filter = () => true) {
    return this.all().filter((r) => (r.status === "pool" || r.status === "dismissed") && filter(r));
  },
  forget(id) { load(); db.delete(id); save(); },
  clear() { load(); db.clear(); save(); },
};

/* ---- employment is a fact about one run, not about the sky -----------------
 *
 * A record carries `status: "aboard"` and `employer: <callsign>` while somebody
 * is flying with you. That is true of YOUR run and nobody else's — and the
 * ledger outlives your run by design, because the point of a ledger is that the
 * hand you dismissed at Foundry Hold turns up at Kessler Reach later.
 *
 * So the flags leaked. Retire a pilot, make a new one, and forty people were
 * still filed as crewing a ship that no longer existed under a callsign that
 * was no longer yours: hiring halls thinned to two candidates, and the old name
 * was still printed beside every one of them. Worse over the relay, where a
 * shared `cradle.json` accumulated every client's crew and handed them to
 * everyone, and worse again after a server restart, which changed nothing
 * because the file is the thing that persists.
 *
 * `releaseEmployed()` puts them back in the pool. A new run calls it with no
 * argument (release everyone — none of them are yours); leaving a sky calls it
 * with the callsign that is walking. Records already `dismissed`, `captive` or
 * `dead` are left exactly as they are: those ARE facts about the sky.
 */
function isCrewing(r) {
  /* Read `employer` carefully. An NPC commanding their own hull is filed as
   * `captain` with THEMSELVES as the employer — a sky holds about fifty-five of
   * them and none of them are anybody's crew. A hand you hired, or one you
   * handed the con to, is employed by a NAME THAT IS NOT THEIR OWN. That is the
   * whole discriminator, and getting it wrong in either direction is visible:
   * too loose and every traffic captain in the sky gets demoted to a dockside
   * job-seeker, too tight and your old crew never go back in the pool. */
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

/** How many records the ledger currently thinks are crewing something. */
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
    /* newest history wins; never lose a brain */
    if (!have || (r.history?.length ?? 0) >= (have.history?.length ?? 0)) {
      if (have?.brain && !r.brain) r.brain = have.brain;
      if (have?.genome && !r.genome) { r.genome = have.genome; r.genomeType = have.genomeType; r.fingerprint = have.fingerprint; }
      /* journals merge rather than replace — two devices saw different watches */
      if (have?.journal?.length) {
        const seen = new Set((r.journal ?? []).map((x) => `${x.cycle}:${x.action?.id}`));
        r.journal = [...(r.journal ?? []), ...have.journal.filter((x) => !seen.has(`${x.cycle}:${x.action?.id}`))]
          .sort((a, b) => (a.at ?? 0) - (b.at ?? 0))
          .slice(-12);
      }
      ensureGenome(r);
      /* Employment never travels. A record that arrives from the relay — or out
       * of an exported ledger — saying it is aboard is describing SOMEBODY
       * ELSE'S ship, and adopting that flag is what emptied the hiring halls.
       * The person is real and welcome; the job they had on another hull is
       * not ours to honour. */
      if (isCrewing(r)) {
        if (!have || !isCrewing(have)) {
          r.status = "pool";
          r.employer = null;
        } else {
          /* ours already: keep our own view of who they work for */
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

/* ---- shared ledger over the relay ---------------------------------------- */

/* ---- the shared ledger ------------------------------------------------------
 *
 * server.py carries the ledger for a shared sky (GET /cradle/all, POST
 * /cradle/put). A plain `python3 -m http.server` does not, and that case had
 * two bugs that between them filled the terminal forever:
 *
 *   1. `fetch` only REJECTS on a network failure. A 501 is a perfectly good
 *      response, so `.catch(() => remote.failed++)` never ran, `failed` stayed
 *      at 0, and the `failed > 3` guard never tripped. Every record filed —
 *      and a hiring hall files a dozen at once — POSTed to a server that had
 *      already said it does not do POST. Forever.
 *   2. A 404 on /cradle/all told us the same thing on the very first call and
 *      we did not listen.
 *
 * Both are read properly now, and 404/405/501 is treated the way net.js treats
 * it: this host has no relay, stop asking. Everything still works — the ledger
 * is local-first and localStorage is the authority — you simply do not get a
 * shared sky, which you were never going to get from a file server.
 *
 * The other half is volume. `put()` is called once per record and a station
 * roster files eight in a burst, so even a real relay was taking a POST each.
 * They are queued and flushed together now.
 */
let remote = { enabled: false, room: "", failed: 0, dead: false };
const pending = new Map();      // id → record, coalesced: the last write wins
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

/* 0.3.44 — the pull is retried, and a run of failed pushes is not forever.
 * The pull happened exactly once, at connect: a relay that was down for the
 * five seconds of a launch (a cloudflared restart, `--update` bouncing
 * lg-relay, a 503 from the site's pass-through) meant this session never
 * saw the shared ledger at all. And `failed > 3` switched pushes off for the
 * rest of the session, so the same outage silently stopped the sky's
 * people being shared until a reload. Now: the pull backs off and tries
 * again (5 s, 15 s, 45 s, then every two minutes); the push gate reopens
 * after PUSH_RETRY_MS; a success resets the count. */
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

/** Pull what the server holds for this sky; local records stay authoritative on conflict. */
export function pullRemote() {
  if (!remote.enabled || remote.dead || typeof fetch !== "function") return Promise.resolve(false);
  return fetch(`/cradle/all?room=${encodeURIComponent(remote.room)}`, { cache: "no-store" })
    .then((r) => {
      if (r.status === 404 || r.status === 405 || r.status === 501) { relayGone(r.status, "/cradle/all"); return null; }
      if (!r.ok) throw new Error(`cradle ${r.status}`);
      return r.json();
    })
    .then((j) => {
      noteOk(); remote.pulled = true; pullTries = 0;   // before the import: its records go out through an open gate
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

/** For the console and the tests: what the ledger's server side is doing. */
export function cradleRemote() {
  return { ...remote, queued: pending.size };
}

/** A push or pull failed: count it, and after a run of them shut the push gate for PUSH_RETRY_MS. */
function noteFail() {
  remote.failed++;
  if (remote.failed > 3 && !remote.retryAt) remote.retryAt = Date.now() + PUSH_RETRY_MS;
}
function noteOk() { remote.failed = 0; remote.retryAt = 0; }

function pushRemote(rec) {
  if (!remote.enabled || remote.dead || typeof fetch !== "function") return;
  if (remote.failed > 3) {
    /* the gate: shut by noteFail() after a run of failures, open for ONE more try once PUSH_RETRY_MS has passed */
    if (Date.now() < remote.retryAt) return;
    remote.retryAt = 0; remote.failed = 3;   // that try: a success resets everything, a failure shuts the gate again
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
  /* One record per POST is what the server takes. The first of a batch is sent
   * ALONE and waited on: if the answer is "this host does not do POST" the
   * other thirty-nine are never sent and the relay is written off, so a static
   * host costs exactly one request rather than one per record. A healthy relay
   * pays one round trip of latency per flush and then sends the rest at once. */
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

/* ---- personality in words ----------------------------------------------- */

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
