// Living Galaxy — who somebody is, individually.
//
// The game has had two ways of describing a person and both were categories. A hull was
// one of six `FLEET_ROLES`; a character was one of six `CAREERS`; a reputation was one of
// three blocs. Every gate in the game asked "which of the six are you" and got a useful
// answer for exactly as long as six was enough — which, as of the twelve order types in
// v1.02.35, it is not. A category with twelve things behind it is not a category, it is a
// bottleneck with a name.
//
// A **dossier** is the replacement: one record per individual, player or NPC, describing
// what *this specific person* can do and who they are in trouble with. Nothing in it is an
// enum. Two mercenaries with the same `role` now differ in the ways that decide what work
// they get, and the player differs from both.
//
// ## What a dossier holds
//
//   proficiency  — a number per skill, 0..1. Not a rank; a continuous competence, so a
//                  requirement can ask for 0.42 and get a meaningful answer.
//   standing     — a number per *power*, not per bloc. Nine numbers, each starting at zero.
//   quals        — earned qualifications. Discrete, awarded, and the thing contracts gate on.
//   track        — where they are on their career ladder, and what the next rung needs.
//   traits       — two or three seeded quirks that shift how they work and how they read.
//
// ## Zero, and only zero
//
// Standing starts at **0 with every power**. It used to start at +10 Coalition / −20 Outer
// for everybody — a stance nobody had taken, applied to a character before they had done
// anything. The only thing that moves it at creation is the lineage and corporation the
// player actually chose, and those are now bonuses *to named powers* rather than to a whole
// third of the galaxy.
//
// ## NPCs cost nothing until they matter
//
// A dossier for an NPC is derived from its name and the world seed, deterministically, and
// only *stored* once something changes it. Seventy NPCs do not become seventy records at
// boot; they become seventy records the moment seventy of them have done something worth
// remembering, which in practice never happens at once.

import { S } from '../core/state.js';
import { makeRng } from '../core/rng.js';
import { SKILL_KEYS, CAREERS } from '../data/origins.js';
import { POWERS, POWER_KEYS, BLOCS, relationOf } from '../data/factions.js';

// ── the career ladder ────────────────────────────────────────────────
//
// Five rungs per career. A rung is a *gate*, not a reward: it opens contract families and
// hull licences, and it is reached by demonstrable competence rather than by elapsed time.
// `needs` is read by `nextRung()` and by the dossier UI, so a player can always see the
// exact thing standing between them and the next tier.
//
// Deliberately the same shape for all six careers, because the interesting variation is in
// *what* each rung asks for, not in how many there are.
//
// ## Why the thresholds start at 35% and not 20%
//
// They started at 20%, and `test/dossier.mjs` caught what that meant: **a fresh character
// was already one or two rungs up the ladder.** A Core-born broker began at rung 2 of 5 —
// creation handed them 40% of their own career progression before they had done anything,
// which is the same fault as the old +10 Coalition standing wearing different clothes.
//
// Career and lineage together hand out 0.10–0.60 in a career's primary skill. The first
// *earned* rung has to sit above what a well-matched birth gives you, or it is not earned.
// A specialist may still start at rung 1 in their own speciality, which is correct: a
// rim-born pathfinder genuinely is already a scout. Nobody starts at rung 2.
export const LADDER = {
  enforcer: {
    name: 'Enforcement',
    rungs: [
      { key: 'unlicensed', title: 'Unlicensed',  needs: {}, grants: [] },
      { key: 'marked',     title: 'Marked Gun',  needs: { skills: { gunnery: 0.35 } }, grants: ['bounty-low'] },
      { key: 'warranted',  title: 'Warranted',   needs: { skills: { gunnery: 0.55 }, standing: { aurelian: 25 } }, grants: ['bounty-mid', 'escort-mid'] },
      { key: 'commissioned', title: 'Commissioned', needs: { skills: { gunnery: 0.72, sensors: 0.45 }, standing: { aurelian: 40 }, quals: ['clean-record'] }, grants: ['bounty-high', 'patrol-lane'] },
      { key: 'proscriptor', title: 'Proscriptor', needs: { skills: { gunnery: 0.88, engineering: 0.55 }, standing: { aurelian: 65 } }, grants: ['bounty-capital', 'writ'] }
    ]
  },
  prospector: {
    name: 'Extraction',
    rungs: [
      { key: 'unlicensed', title: 'Unlicensed',  needs: {}, grants: [] },
      { key: 'cutter',     title: 'Cutter',      needs: { skills: { extraction: 0.35 } }, grants: ['survey-low'] },
      { key: 'assayer',    title: 'Assayer',     needs: { skills: { extraction: 0.55, sensors: 0.35 }, standing: { halloway: 25 } }, grants: ['survey-mid', 'supply-mid'] },
      { key: 'seamholder', title: 'Seamholder',  needs: { skills: { extraction: 0.72, engineering: 0.45 }, standing: { halloway: 40 } }, grants: ['claim-seam', 'survey-high'] },
      { key: 'fieldmaster', title: 'Fieldmaster', needs: { skills: { extraction: 0.88 }, standing: { halloway: 60, drossgate: 20 } }, grants: ['claim-field', 'deep-survey'] }
    ]
  },
  hauler: {
    name: 'Freight',
    rungs: [
      { key: 'unlicensed', title: 'Unlicensed',  needs: {}, grants: [] },
      { key: 'carrier',    title: 'Carrier',     needs: { skills: { navigation: 0.35 } }, grants: ['haul-low'] },
      { key: 'bonded',     title: 'Bonded',      needs: { skills: { navigation: 0.55, commerce: 0.35 }, standing: { freewake: 25 } }, grants: ['haul-mid', 'courier-mid'] },
      { key: 'chartered',  title: 'Chartered',   needs: { skills: { navigation: 0.72 }, standing: { freewake: 40 }, quals: ['clean-manifest'] }, grants: ['haul-high', 'bulk-charter'] },
      { key: 'lanemaster', title: 'Lanemaster',  needs: { skills: { navigation: 0.88, commerce: 0.55 }, standing: { freewake: 65 } }, grants: ['lane-rights', 'convoy'] }
    ]
  },
  broker: {
    name: 'Commerce',
    rungs: [
      { key: 'unlicensed', title: 'Unlicensed',  needs: {}, grants: [] },
      { key: 'factor',     title: 'Factor',      needs: { skills: { commerce: 0.35 } }, grants: ['courier-low'] },
      { key: 'seated',     title: 'Seated',      needs: { skills: { commerce: 0.55 }, standing: { meridian: 25 } }, grants: ['courier-mid', 'arbitrage-seat'] },
      { key: 'underwriter', title: 'Underwriter', needs: { skills: { commerce: 0.72, sensors: 0.45 }, standing: { meridian: 40 } }, grants: ['underwrite', 'courier-high'] },
      { key: 'clearing',   title: 'Clearing Member', needs: { skills: { commerce: 0.88 }, standing: { meridian: 65 }, quals: ['audited'] }, grants: ['clearing-house', 'short-position'] }
    ]
  },
  pathfinder: {
    name: 'Survey',
    rungs: [
      { key: 'unlicensed', title: 'Unlicensed',  needs: {}, grants: [] },
      { key: 'scout',      title: 'Scout',       needs: { skills: { sensors: 0.35 } }, grants: ['survey-low'] },
      { key: 'charted',    title: 'Charted',     needs: { skills: { sensors: 0.55, navigation: 0.35 } }, grants: ['survey-mid', 'deep-survey'] },
      { key: 'pathfinder', title: 'Pathfinder',  needs: { skills: { sensors: 0.72, navigation: 0.55 }, standing: { kestrel: 25 } }, grants: ['survey-high', 'rim-charter'] },
      { key: 'cartographer', title: 'Cartographer', needs: { skills: { sensors: 0.88 }, standing: { kestrel: 50 }, quals: ['first-sighting'] }, grants: ['name-rights', 'deep-rim'] }
    ]
  },
  executive: {
    name: 'Charter',
    rungs: [
      { key: 'registered', title: 'Registered',  needs: {}, grants: ['commission-light'] },
      { key: 'trading',    title: 'Trading',     needs: { skills: { commerce: 0.35 } }, grants: ['commission-mid', 'contract-desk'] },
      { key: 'listed',     title: 'Listed',      needs: { skills: { commerce: 0.55, engineering: 0.35 }, standing: { meridian: 20 } }, grants: ['commission-heavy', 'module-order'] },
      { key: 'holding',    title: 'Holding',     needs: { skills: { commerce: 0.60 }, standing: { meridian: 45, halloway: 20 }, quals: ['audited'] }, grants: ['outpost-charter', 'bulk-charter'] },
      { key: 'combine',    title: 'Combine',     needs: { skills: { commerce: 0.88, engineering: 0.55 }, standing: { meridian: 70 } }, grants: ['seat-of-charter', 'clearing-house'] }
    ]
  }
};

// Seeded flavour. Two per person, drawn from the same stream as everything else about
// them, so a given NPC is the same person on every device and on every load.
const TRAITS = [
  { key: 'punctual',   name: 'Punctual',    effect: 'meets deadlines others miss' },
  { key: 'grasping',   name: 'Grasping',    effect: 'holds out for a better rate' },
  { key: 'steady',     name: 'Steady',      effect: 'does not spook under fire' },
  { key: 'reckless',   name: 'Reckless',    effect: 'takes the fast lane and the damage' },
  { key: 'connected',  name: 'Connected',   effect: 'knows somebody at every desk' },
  { key: 'marked',     name: 'Marked',      effect: 'somebody out here remembers them' },
  { key: 'meticulous', name: 'Meticulous',  effect: 'paperwork is never the problem' },
  { key: 'quiet',      name: 'Quiet',       effect: 'runs dark by preference' },
  { key: 'owed',       name: 'Owed',        effect: 'has favours outstanding' },
  { key: 'burned',     name: 'Burned',      effect: 'has been sold out once already' }
];

// ── storage ──────────────────────────────────────────────────────────

export const dossiers = () => (S.dossiers = S.dossiers || {});

const blankStanding = () => {
  const out = {};
  for (const k of POWER_KEYS) out[k] = 0;
  return out;
};

const blankProficiency = () => {
  const out = {};
  for (const k of SKILL_KEYS) out[k] = 0;
  return out;
};

/**
 * The player's dossier. Distinct from an NPC's only in where its numbers come from —
 * proficiency is read live off the character sheet, so it cannot drift from the skills
 * the player actually has.
 */
export function playerDossier() {
  const ch = S.character;
  const d = dossiers().__player || (dossiers().__player = {
    id: '__player',
    kind: 'player',
    name: (ch && ch.name) || 'Unnamed',
    career: (ch && ch.career) || null,
    standing: blankStanding(),
    quals: [],
    traits: [],
    rung: 0,
    history: []
  });
  d.name = (ch && ch.name) || d.name;
  d.career = (ch && ch.career) || d.career;
  d.proficiency = liveProficiency();
  return d;
}

/**
 * Skill ranks as a 0..1 competence.
 *
 * The ladder asks for continuous values because "rank 4 of 10" is a display fact and
 * "42% of the way to the ceiling" is what a gate actually wants to compare against.
 */
function liveProficiency() {
  const out = blankProficiency();
  const ch = S.character;
  if (!ch) return out;
  for (const k of SKILL_KEYS) {
    const base = (ch.skills && ch.skills[k]) || 0;
    const spent = (ch.spent && ch.spent[k]) || 0;
    out[k] = Math.max(0, Math.min(1, (base + spent) / 10));
  }
  return out;
}

/**
 * A dossier for any NPC, by name.
 *
 * Derived from the world seed and the name, so it is identical everywhere and costs
 * nothing until something changes it. `store` is what turns a derived record into a
 * persisted one — called by anything that actually mutates a person.
 */
export function npcDossier(name, hint = {}) {
  if (!name) return null;
  const held = dossiers()[name];
  if (held) return held;

  const rng = makeRng((S.seed ^ hashName(name)) >>> 0);
  const career = hint.career || pickCareer(rng, hint.role);
  const prof = blankProficiency();
  // Competence is not flat: everyone is good at one or two things and mediocre at the
  // rest, which is what makes two hulls of the same role different hires.
  const strong = CAREERS[career] ? CAREERS[career].skills : ['commerce'];
  for (const k of SKILL_KEYS) prof[k] = rng.next() * 0.35;
  for (const k of strong) prof[k] = Math.min(1, 0.25 + rng.next() * 0.6);

  const standing = blankStanding();
  // An NPC has history with two or three powers and none with the rest — which is the
  // whole point of nine numbers instead of three.
  const n = 2 + Math.floor(rng.next() * 2);
  for (let i = 0; i < n; i++) {
    const p = POWER_KEYS[Math.floor(rng.next() * POWER_KEYS.length)];
    standing[p] = Math.round((rng.next() * 2 - 0.7) * 60);
  }
  if (hint.faction === 'hostile' || hint.faction === 'pirate') {
    standing.kessler = Math.max(standing.kessler, 20 + Math.round(rng.next() * 50));
    standing.aurelian = Math.min(standing.aurelian, -20 - Math.round(rng.next() * 50));
  }

  const traits = [];
  const pool = TRAITS.slice();
  const count = 2 + (rng.next() < 0.3 ? 1 : 0);
  for (let i = 0; i < count && pool.length; i++) {
    traits.push(pool.splice(Math.floor(rng.next() * pool.length), 1)[0].key);
  }

  const d = {
    id: name,
    kind: 'npc',
    name,
    career,
    role: hint.role || null,
    faction: hint.faction || 'independent',
    proficiency: prof,
    standing,
    quals: [],
    traits,
    rung: 0,
    history: [],
    derived: true          // not yet worth persisting
  };
  d.rung = highestRung(d);
  return d;
}

/** Promote a derived dossier to a stored one. Anything that mutates a person calls this. */
export function store(d) {
  if (!d || !d.id) return d;
  d.derived = false;
  dossiers()[d.id] = d;
  return d;
}

function hashName(s) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}

function pickCareer(rng, role) {
  const byRole = { combat: 'enforcer', merc: 'enforcer', mine: 'prospector',
                   haul: 'hauler', trade: 'broker', build: 'prospector' };
  if (role && byRole[role]) return byRole[role];
  const keys = Object.keys(LADDER);
  return keys[Math.floor(rng.next() * keys.length)];
}

// ── standing ─────────────────────────────────────────────────────────

/** Standing with one power, for anybody. */
export function standingWith(d, power) {
  if (!d || !d.standing) return 0;
  return d.standing[power] || 0;
}

/**
 * Move standing with a power, and let its rivals feel it.
 *
 * This is where the corp war stops being lore. Doing work for Meridian costs you with
 * Severance in proportion to how much they hate each other — a number `data/factions.js`
 * derives from the timeline rather than declaring, so the politics and the fiction cannot
 * disagree. `temper` decides how fast each power moves.
 */
export function adjustStanding(d, power, delta, reason) {
  if (!d || !POWERS[power] || !(delta !== 0)) return d;
  d.standing = d.standing || blankStanding();
  const t = POWERS[power].temper || { gain: 1, loss: 1 };
  const scaled = delta * (delta > 0 ? t.gain : t.loss);
  d.standing[power] = clamp100((d.standing[power] || 0) + scaled);

  for (const other of POWER_KEYS) {
    if (other === power) continue;
    const rel = relationOf(power, other);
    if (Math.abs(rel) < 0.2) continue;         // indifferent parties do not care
    const ot = POWERS[other].temper || { gain: 1, loss: 1 };
    const bleed = scaled * rel * 0.45;
    d.standing[other] = clamp100((d.standing[other] || 0) +
      bleed * (bleed > 0 ? ot.gain : ot.loss));
  }

  if (reason) {
    d.history = d.history || [];
    d.history.unshift({ t: Math.round(S.time || 0), power, delta: Math.round(scaled), reason });
    if (d.history.length > 24) d.history.length = 24;
  }
  store(d);
  return d;
}

const clamp100 = v => Math.max(-100, Math.min(100, v));

// ── qualification ────────────────────────────────────────────────────

/**
 * Can this individual take this piece of work?
 *
 * The replacement for "is your role in the requires list". A requirement may ask for
 * skills, standing with named powers, qualifications, or a career rung — and any
 * combination. Returns a *reason*, not just a boolean, because a gate that will not say
 * what it wants is the thing that makes a progression system feel arbitrary.
 */
export function qualifies(d, req) {
  if (!d) return { ok: false, why: 'No dossier on file.', missing: [] };
  if (!req) return { ok: true, why: 'No requirement.', missing: [] };
  const missing = [];

  for (const k of Object.keys(req.skills || {})) {
    const have = (d.proficiency && d.proficiency[k]) || 0;
    if (have < req.skills[k]) {
      missing.push({ kind: 'skill', key: k, need: req.skills[k], have });
    }
  }
  for (const p of Object.keys(req.standing || {})) {
    const have = standingWith(d, p);
    if (have < req.standing[p]) {
      missing.push({ kind: 'standing', key: p,
                     name: (POWERS[p] || {}).short || p, need: req.standing[p], have });
    }
  }
  for (const q of (req.quals || [])) {
    if (!(d.quals || []).includes(q)) missing.push({ kind: 'qual', key: q });
  }
  if (req.rung != null && (d.rung || 0) < req.rung) {
    missing.push({ kind: 'rung', key: req.rung, have: d.rung || 0 });
  }

  if (!missing.length) return { ok: true, why: 'Qualified.', missing: [] };
  const first = missing[0];
  const why =
    first.kind === 'skill' ? `Needs ${first.key} at ${Math.round(first.need * 100)}% — you are at ${Math.round(first.have * 100)}%.`
    : first.kind === 'standing' ? `Needs standing ${Math.round(first.need)} with ${first.name} — you are at ${Math.round(first.have)}.`
    : first.kind === 'qual' ? `Needs the ${first.key.replace(/-/g, ' ')} qualification.`
    : `Needs career rung ${first.key}.`;
  return { ok: false, why, missing };
}

/** Award a qualification. Idempotent. */
export function award(d, qual) {
  if (!d || !qual) return d;
  d.quals = d.quals || [];
  if (!d.quals.includes(qual)) { d.quals.push(qual); store(d); }
  return d;
}

// ── the ladder ───────────────────────────────────────────────────────

export const ladderFor = career => LADDER[career] || null;

/** The highest rung this individual currently satisfies. */
export function highestRung(d) {
  const L = ladderFor(d && d.career);
  if (!L) return 0;
  let best = 0;
  for (let i = 0; i < L.rungs.length; i++) {
    if (qualifies(d, L.rungs[i].needs).ok) best = i;
    else break;
  }
  return best;
}

/** Recompute and return the rung, promoting if the ladder has been climbed. */
export function refreshRung(d) {
  if (!d) return 0;
  const was = d.rung || 0;
  const now = highestRung(d);
  if (now !== was) { d.rung = now; store(d); }
  return now;
}

/** What the next rung asks for, and how far off it is. Null at the top. */
export function nextRung(d) {
  const L = ladderFor(d && d.career);
  if (!L) return null;
  const i = (d.rung || 0) + 1;
  if (i >= L.rungs.length) return null;
  const rung = L.rungs[i];
  const gate = qualifies(d, rung.needs);
  return { index: i, key: rung.key, title: rung.title, grants: rung.grants,
           needs: rung.needs, missing: gate.missing, why: gate.why };
}

/** Everything this individual's rung has opened up. */
export function grantsOf(d) {
  const L = ladderFor(d && d.career);
  if (!L) return [];
  const out = [];
  for (let i = 0; i <= (d.rung || 0) && i < L.rungs.length; i++) {
    for (const g of L.rungs[i].grants || []) if (!out.includes(g)) out.push(g);
  }
  return out;
}

// ── reporting ────────────────────────────────────────────────────────

/** Everything the dossier screen needs about one individual, in one call. */
export function dossierReport(d) {
  if (!d) return null;
  const L = ladderFor(d.career);
  const next = nextRung(d);
  return {
    id: d.id,
    name: d.name,
    kind: d.kind,
    career: d.career,
    careerName: L ? L.name : '—',
    rung: d.rung || 0,
    rungTitle: L ? (L.rungs[d.rung || 0] || L.rungs[0]).title : '—',
    rungs: L ? L.rungs.map((r, i) => ({ key: r.key, title: r.title, reached: i <= (d.rung || 0) })) : [],
    next,
    grants: grantsOf(d),
    quals: (d.quals || []).slice(),
    traits: (d.traits || []).map(k => TRAITS.find(t => t.key === k) || { key: k, name: k, effect: '' }),
    proficiency: Object.assign({}, d.proficiency),
    standing: POWER_KEYS.map(p => ({
      key: p,
      name: POWERS[p].short,
      full: POWERS[p].name,
      bloc: POWERS[p].bloc,
      color: POWERS[p].color,
      value: Math.round(standingWith(d, p))
    })),
    history: (d.history || []).slice(0, 8)
  };
}

/** Bloc-level standing, averaged from the powers in it — for the old coarse questions. */
export function blocStanding(d, bloc) {
  const list = POWER_KEYS.filter(p => POWERS[p].bloc === bloc);
  if (!list.length) return 0;
  let sum = 0;
  for (const p of list) sum += standingWith(d, p);
  return sum / list.length;
}

// ── persistence ──────────────────────────────────────────────────────

export const serializeDossiers = () => {
  const out = {};
  for (const k of Object.keys(dossiers())) {
    const d = dossiers()[k];
    if (!d || d.derived) continue;          // derived records rebuild from the seed
    out[k] = { id: d.id, kind: d.kind, name: d.name, career: d.career, role: d.role,
               faction: d.faction, proficiency: d.proficiency, standing: d.standing,
               quals: d.quals, traits: d.traits, rung: d.rung, history: d.history };
  }
  return out;
};

export function restoreDossiers(data) {
  S.dossiers = {};
  if (!data || typeof data !== 'object') return;
  for (const k of Object.keys(data)) {
    const d = Object.assign({}, data[k]);
    d.derived = false;
    d.standing = Object.assign(blankStanding(), d.standing || {});
    d.proficiency = Object.assign(blankProficiency(), d.proficiency || {});
    S.dossiers[k] = d;
  }
}

export { TRAITS };
