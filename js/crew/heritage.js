/* Living Galaxy — what a child gets from the house they were born into.
 *
 * A genome is what a child inherits from two bodies. This is what they
 * inherit from two lives: the trade their parents worked, the words they grew
 * up hearing, and the head start that gives them. Three generations of miners
 * is a family with rock in it — the third one is not born knowing geology,
 * but they were assaying core samples on the mess table at nine, and it shows
 * in what they start with and in how fast the rest goes in.
 *
 * Every career does this, not just the drills. The rule is the same whatever
 * the complex: the parents' own skill in their trade decides what they can
 * pass on, the child's genome decides how much of it sticks, and the
 * generation count decides how deep the house's habit runs.
 *
 *   taught   — skills the child is already carrying when they come of age
 *   learn    — a multiplier on how fast that career's skills go in after that
 *   line     — the house's trade, and how many generations have worked it
 *
 * Nothing here overrides the genome. A child born to two surveyors who drew a
 * body with no head for rock still starts ahead of a stranger and still never
 * gets very good; a child who drew the aptitude AND the upbringing is the one
 * the hiring halls fight over.
 *
 */

import { COMPLEXES, RANK_LETTERS } from "../careers/complexes.js";
import { cradle } from "../npc/cradle.js";

/** How much of a parent's skill a child can carry out of the house, at best. */
export const TAUGHT_SHARE = 0.34;
/** And how much the generations after the first add to that. */
export const GENERATION_STEP = 0.08;
export const MAX_GENERATIONS = 5;
/** The most a house's habit can speed the rest of the learning up. */
export const LEARN_CAP = 1.85;

const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
const r2 = (v) => Math.round(v * 100) / 100;

function hashRoll(s) {
  let h = 2166136261;
  for (let i = 0; i < String(s).length; i++) h = Math.imul(h ^ String(s).charCodeAt(i), 16777619);
  return ((h >>> 0) % 10000) / 10000;
}

/** A person's record, whether they are a live member or a ledger id. */
function recOf(p) {
  if (!p) return null;
  if (typeof p === "string") return cradle.get(p);
  return cradle.get(p.id) ?? p;
}

/** Generations this person's house has worked their trade. 1 = they are the first. */
export function generationOf(p) {
  const rec = recOf(p);
  return clamp(Math.round(rec?.heritage?.generation ?? 1), 1, MAX_GENERATIONS);
}

/** The complex a person's house works, which is usually their own. */
export function houseTradeOf(p) {
  const rec = recOf(p);
  return rec?.heritage?.complexId ?? rec?.complexId ?? null;
}

/**
 * Which trade a child is raised into. Two parents in the same complex is a
 * house — the child is the next generation of it. Two different trades is a
 * choice, made once, from the child's own seed, and the other parent's trade
 * comes along as a smaller second inheritance.
 */
export function lineFor(carrier, sire, seed = "") {
  const a = houseTradeOf(carrier), b = houseTradeOf(sire);
  if (a && b && a === b) {
    const gen = clamp(Math.max(generationOf(carrier), generationOf(sire)) + 1, 2, MAX_GENERATIONS);
    return { complexId: a, generation: gen, second: null, both: true };
  }
  if (!a && !b) return { complexId: null, generation: 1, second: null, both: false };
  if (!a || !b) return { complexId: a ?? b, generation: 2, second: null, both: false };
  /* mixed house: the child leans one way, deterministically */
  const leanA = hashRoll(`line:${seed}:${a}:${b}`) < 0.5;
  const main = leanA ? a : b;
  const other = leanA ? b : a;
  const gen = clamp((leanA ? generationOf(carrier) : generationOf(sire)) + 1, 2, MAX_GENERATIONS);
  return { complexId: main, generation: gen, second: other, both: false };
}

/** The skills a complex actually teaches, primaries first. */
export function skillsOfComplex(complexId) {
  const c = COMPLEXES[complexId];
  if (!c) return [];
  return [...new Set([...(c.primarySkills ?? []), ...(c.skills ?? [])])];
}

/**
 * What a child of these two is carrying when they come of age.
 *
 * `aptitude` is the child's own genome read (spacer.skillAptitude): the house
 * can teach, but it cannot make a body good at something it is not built for.
 * The share rises with the generation, so a fourth-generation fitter starts
 * meaningfully ahead of a second — and it is capped, because eventually the
 * child has to go and do the job themselves.
 */
export function heritageFor(carrier, sire, { aptitude = {}, seed = "" } = {}) {
  const line = lineFor(carrier, sire, seed);
  if (!line.complexId) return null;
  const share = Math.min(0.62, TAUGHT_SHARE + (line.generation - 1) * GENERATION_STEP);
  const ra = recOf(carrier), rb = recOf(sire);

  const taught = {};
  const teach = (complexId, weight) => {
    for (const skill of skillsOfComplex(complexId)) {
      const pa = ra?.skills?.[skill] ?? 0;
      const pb = rb?.skills?.[skill] ?? 0;
      const best = Math.max(pa, pb);
      const both = (pa + pb) / 2;
      /* what a house can pass on sits between "the better parent knew it" and
       * "they both did" — two of them at the same bench teaches more */
      const parental = both > 0 ? (best * 0.6 + both * 0.4) : best;
      if (parental <= 0) continue;
      const fit = 0.55 + (aptitude[skill] ?? 0.5) * 0.9;
      const v = Math.round(parental * share * weight * fit);
      if (v > 0) taught[skill] = Math.max(taught[skill] ?? 0, Math.min(70, v));
    }
  };
  teach(line.complexId, 1);
  if (line.second) teach(line.second, 0.45);

  const learn = {};
  const bonus = Math.min(LEARN_CAP, 1 + (line.generation - 1) * 0.18 + (line.both ? 0.12 : 0));
  for (const skill of skillsOfComplex(line.complexId)) learn[skill] = r2(bonus);
  if (line.second) for (const skill of skillsOfComplex(line.second)) learn[skill] = Math.max(learn[skill] ?? 1, r2(1 + (bonus - 1) * 0.45));

  const c = COMPLEXES[line.complexId];
  return {
    complexId: line.complexId,
    complexName: (c?.name ?? line.complexId).replace(/ Complex$/, ""),
    second: line.second,
    secondName: line.second ? (COMPLEXES[line.second]?.name ?? line.second).replace(/ Complex$/, "") : null,
    generation: line.generation,
    share: r2(share),
    taught,
    learn,
    parents: [ra?.name ?? null, rb?.name ?? null],
  };
}

/** Fold a heritage into a child's record: trade, starting skills, the line. */
export function applyHeritage(child, heritage) {
  if (!child || !heritage) return child;
  child.heritage = heritage;
  child.complexId = heritage.complexId;
  child.complexName = heritage.complexName;
  child.skills ??= {};
  for (const [skill, v] of Object.entries(heritage.taught)) {
    child.skills[skill] = Math.max(child.skills[skill] ?? 0, v);
  }
  return child;
}

/**
 * How fast a career's skills go in for this person. 1 for anybody who was not
 * raised to it; up to LEARN_CAP for somebody whose house has done nothing else
 * for four generations. Read by STUDY and MENTOR in the effect table.
 */
export function learningBonus(m, skill) {
  const rec = recOf(m);
  const h = rec?.heritage ?? m?.heritage;
  if (!h?.learn) return 1;
  return h.learn[skill] ?? 1;
}

/** The skills this person's house would push them toward, best first. */
export function houseSkills(m) {
  const rec = recOf(m);
  const h = rec?.heritage ?? m?.heritage;
  if (!h) return [];
  return Object.keys(h.learn ?? {}).sort((a, b) => (h.learn[b] ?? 1) - (h.learn[a] ?? 1));
}

const ORDINAL = ["", "first", "second", "third", "fourth", "fifth"];

/** "Third-generation Mining — taught it before they could read a manifest." */
export function heritageLine(m) {
  const rec = recOf(m);
  const h = rec?.heritage ?? m?.heritage;
  if (!h) return "";
  const gen = ORDINAL[h.generation] ?? `${h.generation}th`;
  const second = h.secondName ? `, with ${h.secondName} on the other side` : "";
  const learned = Object.entries(h.taught).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([k, v]) => `${k} ${v}`).join(", ");
  return `${gen.charAt(0).toUpperCase()}${gen.slice(1)}-generation ${h.complexName}${second}. Came aboard already carrying ${learned || "the habit, if not the numbers"}.`;
}

/** Where a hand's rank ladder starts, given a house. A child of the trade starts one rung up. */
export function startingLetter(heritage) {
  if (!heritage) return RANK_LETTERS[0];
  const idx = Math.min(1, Math.max(0, heritage.generation - 2));
  return RANK_LETTERS[idx] ?? RANK_LETTERS[0];
}
