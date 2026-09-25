/* LIVING GALAXY — the crew ledger.
 *
 * Crew are hired off station rosters, draw a wage every cycle (the same
 * 90-second cycle the career engine runs on), and keep morale. A paid crew
 * settles toward content; an unpaid one sours by the cycle and walks when
 * the number hits zero. Wages come straight off the complex pay ladders in
 * careers/complexes.js — a rank-C fitter costs a fifth of what a rank-C
 * player earns, times the outfit's cut.
 */

import { COMPLEXES, RANK_LETTERS } from "./careers/complexes.js";
/* through ship.js, not upgrades.js: upgrades imports sim, sim imports family,
 * family imports this file, and that cycle leaves crewHooks in its temporal
 * dead zone at load. ship.js is the designated leaf for exactly this —
 * upgrades.js writes its own fx() into shipFx when it loads. */
import { shipFx } from "./ship.js";
import { cradle, drawnTo, ensureIdentity, generateNPC, genomeOf } from "./npc/cradle.js";
import { file as gdbFile } from "./gdb.js";
import { genomeCompat, kinship, KIN_BLOCK, kinLabel } from "./genome/spacer.js";

export const CYCLE_SECONDS = 90;
const WAGE_SHARE = 0.2; // crew wage = rank pay × share

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

export function wageFor(complexId, letter) {
  const c = COMPLEXES[complexId];
  const rank = c?.ranks?.find((r) => r.letter === letter);
  return Math.max(50, Math.round((rank?.pay ?? 900) * WAGE_SHARE));
}

/**
 * The hiring hall roster a station offers. Half the hall is people already in
 * the CRADLE pool — hands you dismissed, hands who walked — and the rest are
 * born here and filed. Deterministic per station+restock+sky.
 */
export function stationRoster(station, restock = 0, sky = "sol") {
  const rnd = mulberry(`${station.id}:${sky}:roster:${restock}`);
  const n = 4 + Math.floor(rnd() * 4);
  const out = [];
  /* 0.3.54: the people who come back to a hall are the people who LIVE at
   * this port — offered here before, or paid off here. It used to be the whole
   * sky's pool, and every candidate any hall had ever shown went into it, so
   * the first port's people turned up at every port after it. A drifter from
   * elsewhere still walks in now and then (the hand you dismissed at Foundry
   * Hold, turning up at Kessler Reach), one a hall at most. */
  const locals = cradle.pool((r) => r.station === station.id).sort((a, b) => (a.seed < b.seed ? -1 : 1));
  /* somebody you paid off HERE is looking for a berth, not just living here: they come back to the hall first */
  const pool = [...locals, ...locals.filter((r) => r.status === "dismissed").flatMap((r) => [r, r, r, r, r, r])];
  const drifters = cradle.pool((r) => r.status === "dismissed" && r.station && r.station !== station.id);
  const returning = Math.min(pool.length, Math.floor(n / 2));
  for (let i = 0; i < returning; i++) {
    const rec = pool[Math.floor(rnd() * pool.length)];
    if (out.some((x) => x.id === rec.id)) continue;
    out.push(candidateFrom(rec));
  }
  if (drifters.length && rnd() < 0.25) {
    const rec = drifters[Math.floor(rnd() * drifters.length)];
    if (!out.some((x) => x.id === rec.id)) out.push(candidateFrom(rec));
  }
  for (let i = 0; out.length < n && i < n * 3; i++) {
    /* stations mostly offer the working ranks */
    const letter = RANK_LETTERS[Math.min(4, Math.floor(rnd() * rnd() * 7))];
    const rec = generateNPC(`${sky}:${station.id}:${restock}:${i}`, { letter, sky });
    const have = cradle.get(rec.id);
    /* Someone born here before may already be aboard a ship, or already on
     * this list. But "aboard" in the LEDGER is not the same as aboard THIS
     * session — the CRADLE is shared through server.py and outlives a run, so
     * a hall that trusted the flag thinned out a little more every time
     * anybody played and eventually offered two people. Believe the flag only
     * about hands who are actually on this ship. */
    if (have && (have.status === "aboard" || have.status === "captain") && crew.aboard.some((m) => m.id === have.id)) continue;
    if (out.some((x) => x.id === rec.id)) continue;
    /* 0.3.54: into the GDB — a name nobody else has, and not one that looks
     * like anybody already on this list or aboard your ship */
    const filed = have ?? gdbFile(rec, { kind: "hall", place: station.id, group: [...crew.aboard, ...out] });
    out.push(candidateFrom(filed));
  }
  return out;
}

/** A hiring-hall line item from a ledger record. */
function candidateFrom(rec) {
  ensureIdentity(rec);
  return {
    id: rec.id,
    name: rec.name,
    raceId: rec.raceId,
    synthetic: Boolean(rec.synthetic),
    gender: rec.gender,
    pronouns: rec.pronouns,
    attractedTo: rec.attractedTo,
    complexId: rec.complexId,
    complexName: rec.complexName,
    letter: rec.letter,
    title: rec.title,
    wage: wageFor(rec.complexId, rec.letter),
    pulse: rec.pulse,
    traits: rec.traits,
    /* the body travels with the candidate: the hiring hall shows what you can
     * see, and deckmind reads the rest without another ledger lookup */
    genome: rec.genome,
    genomeType: rec.genomeType,
    fingerprint: rec.fingerprint,
    aptitude: rec.aptitude,
    tells: rec.tells,
    seed: rec.seed,
    returning: (rec.history?.length ?? 0) > 0,
  };
}

/* ---- the ship's crew ---------------------------------------------------- */

/* family.js hangs the household off the pay cycle without a circular import;
 * bonds.js / duties.js / talk.js push into `cycle`; `reset` runs on resetCrew.
 * `always` runs on every sim tick whether or not the player has anybody
 * aboard — the rest of the sky has crews too (npc/npccrew.js), and they do
 * not stop existing because your berths are empty. */
export const crewHooks = { onCycle: null, cycle: [], reset: [], always: [], port: null };

export const crew = {
  employer: null,   // the pilot's callsign, for the ledger
  aboard: [],       // hired members
  payPool: 0,       // seconds toward the next pay cycle
  lastPay: null,    // { total, paid, shortfall }
  log: [],
  hires: 0,         // lifetime signings this sky — the first one is cheap
};

/* The first hand a new captain signs is on the entry rate: no signing bonus
 * and half wage for as long as they stay. Every complex runs the scheme; it
 * is how a one-seat skiff ever affords a second seat. */
export const FIRST_HAND_WAGE = 0.5;

/** What signing this candidate would actually cost: { bonus, wage, firstHand }. */
export function hireTerms(candidate) {
  const firstHand = crew.hires === 0 && crew.aboard.length === 0;
  const wage = firstHand ? Math.max(20, Math.round(candidate.wage * FIRST_HAND_WAGE)) : candidate.wage;
  return { bonus: firstHand ? 0 : candidate.wage * 2, wage, firstHand };
}

function note(msg) {
  crew.log.unshift({ t: Date.now(), msg });
  crew.log.length = Math.min(crew.log.length, 30);
}

export function crewWageTotal() {
  const raw = crew.aboard.reduce((a, m) => a + (m.robot ? 0 : m.wage), 0);
  return Math.round(raw * shipFx.fx("crewWage", 1));
}

/** First-name shorthand used across the crew modules. */
export const firstName = (m) => String(m?.name ?? "").split(" ")[0];

/**
 * The gender mark.
 *
 * Every generator in the game has had gender on the record earlier and the
 * measured split has been right earlier too, and it still played as a sky
 * full of men — because two places in the whole UI ever printed it (the
 * hiring hall and the talk sub-line) and everywhere else a person was a name
 * in an invented tongue with nothing beside it. A reader with no ear for the
 * tongue fills that blank in with the default, and the default is male.
 *
 * So this is deliberately terse and deliberately everywhere: "she/her",
 * "he/him", "they/them" appended to the line that already carries a person's
 * rank and trade. Cheap to read, impossible to miss, and it costs a roster
 * row eight characters.
 */
export const pronounOf = (m) => (m?.pronouns ? `${m.pronouns.subj}/${m.pronouns.obj}` : "");

/** The same thing as a suffix you can concatenate onto an existing hint. */
export const genderMark = (m, sep = " · ") => (m?.pronouns ? `${sep}${pronounOf(m)}` : "");

export function hireCrew(candidate, ship, capacity) {
  if (crew.aboard.length >= capacity) return "No berths free";
  if (crew.aboard.some((m) => m.id === candidate.id)) return "Already aboard";
  const terms = hireTerms(candidate);
  if (ship.credits < terms.bonus) return `Signing bonus is ${terms.bonus} cr`;
  ship.credits -= terms.bonus;
  crew.hires++;
  crew.aboard.push({ ...candidate, wage: terms.wage, listWage: candidate.wage, firstHand: terms.firstHand, morale: 78, cyclesAboard: 0, bonds: {}, partner: null });
  note(terms.firstHand
    ? `${candidate.name} signed on at the first-hand rate — ${candidate.title}, ${terms.wage} cr/cycle, no bonus`
    : `${candidate.name} signed on — ${candidate.title}, ${terms.wage} cr/cycle`);
  const rec = cradle.get(candidate.id);
  if (rec) {
    rec.status = "aboard";
    rec.employer = crew.employer;
    cradle.note(rec.id, `Signed on with ${crew.employer ?? "a pilot"} as ${candidate.title}`);
  }
  return null;
}

export function dismissCrew(id) {
  const i = crew.aboard.findIndex((m) => m.id === id);
  if (i < 0) return;
  note(`${crew.aboard[i].name} paid off and dismissed`);
  fileDeparture(crew.aboard[i], "dismissed", `Paid off and dismissed by ${crew.employer ?? "a pilot"}`);
  crew.aboard.splice(i, 1);
}

function fileDeparture(m, status, text) {
  partingWords(m);
  const rec = cradle.get(m.id);
  if (!rec) return;
  rec.status = status;
  rec.employer = null;
  /* 0.3.54: they live where you left them — that port's hall is where they come back */
  const port = crewHooks.port?.() ?? null;
  if (port) rec.station = port;
  rec.cyclesServed = (rec.cyclesServed ?? 0) + (m.cyclesAboard ?? 0);
  cradle.note(rec.id, text);
}

/* ---- life aboard ----------------------------------------------------------
 * Crew who share a deck get to know each other: a rapport number per pair
 * that grows every cycle, faster when temperaments fit. When two people are
 * drawn to each other and the rapport is there, it becomes a relationship —
 * any pairing, when the interest is mutual. Partners keep each other's
 * morale up; losing one hurts. None of it needs the player; all of it shows
 * on the crew sheet and the deck.
 */

/* Genomes are decoded once per pair and kept — compat runs for every pair,
 * every cycle, and unpacking 178 characters each time would show up on a phone. */
const _genomeCache = new Map();
function genomeFor(m) {
  if (!m?.id) return null;
  if (_genomeCache.has(m.id)) return _genomeCache.get(m.id);
  const rec = cradle.get(m.id);
  const g = rec ? genomeOf(rec) : null;
  _genomeCache.set(m.id, g);
  return g;
}
export function forgetGenome(id) { if (id) _genomeCache.delete(id); else _genomeCache.clear(); }

/**
 * Temperament fit, −5…+5. Exported for bonds.js's rivalry roll.
 *
 * The five rounded axes were always a summary of something with more in it.
 * Where both people have a genome on file the real comparison runs — shared
 * idea of a favour owed, opposite clocks, two dominants in one passage — and
 * the axes are folded in behind it. Where one does not (an old save, a
 * candidate mid-import) the original formula stands on its own, unchanged.
 */
export function compat(a, b) {
  const ta = a.traits ?? {}, tb = b.traits ?? {};
  const d = (k) => Math.abs((ta[k] ?? 0.5) - (tb[k] ?? 0.5));
  let c = 3 - d("loyalty") * 3 - d("caution") * 2 + (1 - d("curiosity")) * 1.5;
  if ((ta.greed ?? 0) > 0.7 && (tb.greed ?? 0) > 0.7) c -= 3; // two sharks, one hold
  if (a.morale > 60 && b.morale > 60) c += 1;
  const ga = genomeFor(a), gb = genomeFor(b);
  if (ga && gb) c = c * 0.45 + genomeCompat(ga, gb) * 0.55;
  return c;
}

/** Coefficient of relationship between two people aboard. 0.5 is a full sibling. */
export function relatedTo(a, b) {
  const ga = genomeFor(a), gb = genomeFor(b);
  return ga && gb ? kinship(ga, gb) : 0;
}

/** "half-sibling or closer", for the crew sheet and the talk trees. */
export function kinLineBetween(a, b) { return kinLabel(relatedTo(a, b)); }

export function rapportBetween(a, b) {
  return a?.bonds?.[b?.id] ?? 0;
}

/** "with Marn Voss" / "close with Marn Voss" / "" — the crew sheet tag. */
export function bondLine(m) {
  if (m.partner) {
    const p = crew.aboard.find((x) => x.id === m.partner);
    if (p) return `with ${p.name}`;
  }
  let best = null;
  for (const o of crew.aboard) {
    if (o.id === m.id) continue;
    const r = rapportBetween(m, o);
    if (r >= 70 && (!best || r > best.r)) best = { o, r };
  }
  return best ? `close with ${best.o.name}` : "";
}

function stepBonds() {
  const list = crew.aboard;
  for (let i = 0; i < list.length; i++) {
    for (let j = i + 1; j < list.length; j++) {
      const a = list[i], b = list[j];
      a.bonds ??= {}; b.bonds ??= {};
      const r = Math.max(0, Math.min(100, (a.bonds[b.id] ?? 0) + 4 + compat(a, b)));
      a.bonds[b.id] = r; b.bonds[a.id] = r;
      const rnd = mulberry(`${a.id}:${b.id}:${a.cyclesAboard}:${b.cyclesAboard}`);
      /* a machine keeps rapport — it can be a friend — but never pairs off */
      if (a.robot || b.robot) continue;
      /* the ledger knows who is whose: siblings and parents do not pair off,
       * whatever the rapport number says */
      if (relatedTo(a, b) >= KIN_BLOCK) continue;
      if (!a.partner && !b.partner && r >= 55 && drawnTo(a, b) && drawnTo(b, a) && rnd() < 0.35) {
        a.partner = b.id; b.partner = a.id;
        a.morale = Math.min(100, a.morale + 8); b.morale = Math.min(100, b.morale + 8);
        note(`${a.name} and ${b.name} have been taking the same mess shift. It's official aboard.`);
        for (const [x, y] of [[a, b], [b, a]]) {
          const rec = cradle.get(x.id);
          if (rec) { rec.partner = y.id; cradle.note(rec.id, `Together with ${y.name} aboard ${crew.employer ?? "a ship"}`); }
        }
      }
    }
  }
  /* partners hold each other up — and a rough patch can end it */
  for (const m of list) {
    if (!m.partner) continue;
    if (m.partner === "player") { m.morale = Math.min(100, m.morale + 3); continue; } // the captain: family.js runs that one
    const p = list.find((x) => x.id === m.partner);
    if (!p) { m.partner = null; continue; }
    m.morale = Math.min(100, m.morale + 3);
    if (m.morale < 20 && mulberry(`${m.id}:split:${m.cyclesAboard}`)() < 0.25) {
      note(`${m.name} and ${p.name} have called it off. The mess is quiet.`);
      m.partner = null; p.partner = null;
      m.morale -= 12; p.morale = Math.max(1, p.morale - 12);
      m.bonds[p.id] = Math.max(0, (m.bonds[p.id] ?? 0) - 30); p.bonds[m.id] = m.bonds[p.id];
      for (const x of [m, p]) { const rec = cradle.get(x.id); if (rec) { rec.partner = null; cradle.note(rec.id, "Split up aboard ship"); } }
    }
  }
}

/** Someone leaving takes a piece of whoever they were with. */
function partingWords(m) {
  if (!m.partner || m.partner === "player") { if (m.partner) { const rec = cradle.get(m.id); if (rec) rec.partner = null; m.partner = null; } return; }
  const p = crew.aboard.find((x) => x.id === m.partner && x !== m);
  const rec = cradle.get(m.id);
  if (rec) rec.partner = null;
  if (!p) return;
  p.partner = null;
  p.morale = Math.max(1, p.morale - 25);
  note(`${p.name} took ${m.name}'s leaving hard.`);
  const prec = cradle.get(p.id);
  if (prec) { prec.partner = null; cradle.note(prec.id, `${m.name} left the ship; they had been together`); }
}

/** Called from the sim tick with scaled seconds. Pays wages every cycle. */
export function tickCrew(seconds, ship) {
  for (const fn of crewHooks.always) { try { fn(seconds); } catch (e) { globalThis.console?.warn?.("crew always hook", e); } }
  if (!crew.aboard.length) { crew.payPool = 0; return; }
  crew.payPool += seconds;
  while (crew.payPool >= CYCLE_SECONDS) {
    crew.payPool -= CYCLE_SECONDS;
    let paid = 0;
    let shortfall = 0;
    for (const m of crew.aboard) {
      m.cyclesAboard++;
      if (m.robot) continue; // no wage, no morale, no walking off — robots.js keeps their condition
      if (ship.credits >= m.wage) {
        ship.credits -= m.wage;
        paid += m.wage;
        m.morale = Math.min(100, m.morale + 2);
      } else {
        shortfall += m.wage;
        m.morale -= 15;
      }
    }
    crew.lastPay = { total: crewWageTotal(), paid, shortfall };
    if (shortfall > 0) note(`Payroll short by ${shortfall} cr — morale is dropping`);
    stepBonds();
    crewHooks.onCycle?.();
    for (const fn of crewHooks.cycle) { try { fn(); } catch (e) { globalThis.console?.warn?.("crew cycle hook", e); } }
    /* the ones done waiting */
    for (const m of [...crew.aboard]) {
      if (!m.robot && m.morale <= 0) {
        note(`${m.name} walked over unpaid wages`);
        fileDeparture(m, "pool", `Walked off ${crew.employer ?? "a ship"} over unpaid wages`);
        crew.aboard.splice(crew.aboard.indexOf(m), 1);
      }
    }
  }
}

export function resetCrew() {
  /* a new sky is a new ship: whoever this pilot had aboard goes back to the pool with a line in the record */
  for (const m of crew.aboard) fileDeparture(m, "pool", `Paid off when ${crew.employer ?? "the pilot"} left the sky`);
  for (const rec of cradle.all()) {
    if ((rec.status === "aboard" || rec.status === "captain") && rec.employer === crew.employer && !crew.aboard.some((m) => m.id === rec.id)) {
      rec.status = "pool"; rec.employer = null; cradle.put(rec);
    }
  }
  crew.aboard.length = 0;
  crew.payPool = 0;
  crew.lastPay = null;
  crew.log.length = 0;
  crew.hires = 0;
  forgetGenome();
  for (const fn of crewHooks.reset) { try { fn(); } catch { /* a module's own reset */ } }
}

/** Append a line to the crew log (bonds/duties/talk share the same book). */
export function crewNote(msg) {
  note(msg);
}
