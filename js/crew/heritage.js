import { COMPLEXES, RANK_LETTERS } from "../careers/complexes.js";
import { cradle } from "../npc/cradle.js";

export const TAUGHT_SHARE = 0.34;
export const GENERATION_STEP = 0.08;
export const MAX_GENERATIONS = 5;
export const LEARN_CAP = 1.85;

const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
const r2 = (v) => Math.round(v * 100) / 100;

function hashRoll(s) {
  let h = 2166136261;
  for (let i = 0; i < String(s).length; i++) h = Math.imul(h ^ String(s).charCodeAt(i), 16777619);
  return ((h >>> 0) % 10000) / 10000;
}

function recOf(p) {
  if (!p) return null;
  if (typeof p === "string") return cradle.get(p);
  return cradle.get(p.id) ?? p;
}

export function generationOf(p) {
  const rec = recOf(p);
  return clamp(Math.round(rec?.heritage?.generation ?? 1), 1, MAX_GENERATIONS);
}

export function houseTradeOf(p) {
  const rec = recOf(p);
  return rec?.heritage?.complexId ?? rec?.complexId ?? null;
}

export function lineFor(carrier, sire, seed = "") {
  const a = houseTradeOf(carrier), b = houseTradeOf(sire);
  if (a && b && a === b) {
    const gen = clamp(Math.max(generationOf(carrier), generationOf(sire)) + 1, 2, MAX_GENERATIONS);
    return { complexId: a, generation: gen, second: null, both: true };
  }
  if (!a && !b) return { complexId: null, generation: 1, second: null, both: false };
  if (!a || !b) return { complexId: a ?? b, generation: 2, second: null, both: false };
  const leanA = hashRoll(`line:${seed}:${a}:${b}`) < 0.5;
  const main = leanA ? a : b;
  const other = leanA ? b : a;
  const gen = clamp((leanA ? generationOf(carrier) : generationOf(sire)) + 1, 2, MAX_GENERATIONS);
  return { complexId: main, generation: gen, second: other, both: false };
}

export function skillsOfComplex(complexId) {
  const c = COMPLEXES[complexId];
  if (!c) return [];
  return [...new Set([...(c.primarySkills ?? []), ...(c.skills ?? [])])];
}

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

export function learningBonus(m, skill) {
  const rec = recOf(m);
  const h = rec?.heritage ?? m?.heritage;
  if (!h?.learn) return 1;
  return h.learn[skill] ?? 1;
}

export function houseSkills(m) {
  const rec = recOf(m);
  const h = rec?.heritage ?? m?.heritage;
  if (!h) return [];
  return Object.keys(h.learn ?? {}).sort((a, b) => (h.learn[b] ?? 1) - (h.learn[a] ?? 1));
}

const ORDINAL = ["", "first", "second", "third", "fourth", "fifth"];

export function heritageLine(m) {
  const rec = recOf(m);
  const h = rec?.heritage ?? m?.heritage;
  if (!h) return "";
  const gen = ORDINAL[h.generation] ?? `${h.generation}th`;
  const second = h.secondName ? `, with ${h.secondName} on the other side` : "";
  const learned = Object.entries(h.taught).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([k, v]) => `${k} ${v}`).join(", ");
  return `${gen.charAt(0).toUpperCase()}${gen.slice(1)}-generation ${h.complexName}${second}. Came aboard already carrying ${learned || "the habit, if not the numbers"}.`;
}

export function startingLetter(heritage) {
  if (!heritage) return RANK_LETTERS[0];
  const idx = Math.min(1, Math.max(0, heritage.generation - 2));
  return RANK_LETTERS[idx] ?? RANK_LETTERS[0];
}
