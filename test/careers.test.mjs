/* LIVING GALAXY — career ladder reachability.
 *
 * Every complex must be climbable A→G, and every specialisation reachable,
 * by a pilot who does nothing but serve cycles (the on-the-job drip plus the
 * "study for the rung above" drip in tickCycle). If a rung asks for a skill
 * that nothing feeds, this is the test that says so — before a player finds
 * out at rank A of Healthcare.
 *
 *   node test/careers.test.mjs
 */

import {
  COMPLEXES,
  RANK_LETTERS,
  createCharacter,
  enroll,
  promote,
  promotionCheck,
  specialize,
  tickCycle,
  studySkills,
} from "../js/careers/index.js";
import { MOD_KEYS, SPEC_EFFECTS, RACE_EFFECTS, composeMods } from "../js/careers/effects.js";
import { RACES } from "../js/races.js";

let pass = 0;
let fail = 0;
const ok = (cond, msg) => {
  if (cond) pass++;
  else {
    fail++;
    console.error("  FAIL", msg);
  }
};

/* deterministic rng so a flaky drip can't hide a real dead end */
function rngFrom(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const MAX_CYCLES = 4000; // ~100 hours of flight — generous, but finite

for (const complex of Object.values(COMPLEXES)) {
  const rnd = rngFrom(complex.id.length * 977 + 13);
  let ch = createCharacter(`test-${complex.id}`);
  const e = enroll(ch, complex.id, { force: true });
  ok(e.ok, `${complex.id}: enrol`);
  ch = e.character;

  let cycles = 0;
  let stuckAt = null;
  while (ch.careers[complex.id].rank !== "G" && cycles < MAX_CYCLES) {
    ch = tickCycle(ch, { trainChance: 0.35, trainAmount: 1, rnd }).character;
    cycles++;
    const p = promote(ch, complex.id);
    if (p.ok) ch = p.character;
  }
  if (ch.careers[complex.id].rank !== "G") {
    const check = promotionCheck(ch, complex.id);
    stuckAt = `${ch.careers[complex.id].rank} → missing ${JSON.stringify(check.missing ?? check.error)}`;
  }
  ok(!stuckAt, `${complex.id}: climb A→G by serving cycles (stuck at ${stuckAt})`);

  /* every specialisation, from a fresh pilot at its opening rank */
  for (const sp of complex.specializations ?? []) {
    const r2 = rngFrom(sp.id.length * 131 + 7);
    let c2 = createCharacter(`spec-${sp.id}`);
    c2 = enroll(c2, complex.id, { force: true }).character;
    let n = 0;
    let done = false;
    while (n < MAX_CYCLES) {
      c2 = tickCycle(c2, { trainChance: 0.35, trainAmount: 1, rnd: r2 }).character;
      n++;
      const s = specialize(c2, complex.id, sp.id);
      if (s.ok) {
        done = true;
        break;
      }
      /* keep climbing so fromRank is met, but stop at the opening rank so the
       * study drip (not a higher rung's requirements) is what gets us there */
      const idx = RANK_LETTERS.indexOf(c2.careers[complex.id].rank);
      if (idx < RANK_LETTERS.indexOf(sp.fromRank)) {
        const p = promote(c2, complex.id);
        if (p.ok) c2 = p.character;
      }
    }
    ok(done, `${complex.id}/${sp.id}: reachable from rank ${sp.fromRank} within ${MAX_CYCLES} cycles`);
  }

  /* static check: every required skill is either a primary or in the study set at some point */
  const primaries = new Set(complex.primarySkills ?? []);
  for (const rank of complex.ranks) {
    for (const id of Object.keys(rank.req?.skills ?? {})) {
      const probe = createCharacter("probe");
      const en = enroll(probe, complex.id, { force: true }).character;
      const prevIdx = RANK_LETTERS.indexOf(rank.letter) - 1;
      if (prevIdx < 0) continue; // rank A is bypassed by force-enrol
      en.careers[complex.id].rank = RANK_LETTERS[prevIdx];
      const study = new Set(studySkills(en, complex.id));
      ok(primaries.has(id) || study.has(id), `${complex.id} rank ${rank.letter}: skill "${id}" has a feed`);
    }
  }
}

/* effects: every specialisation does something, every effect names a real spec and real keys */
const specIds = new Set(Object.values(COMPLEXES).flatMap((c) => (c.specializations ?? []).map((s) => s.id)));
for (const id of specIds) ok(SPEC_EFFECTS[id] && Object.keys(SPEC_EFFECTS[id]).length > 0, `spec ${id} has an effect`);
for (const [id, fx] of Object.entries(SPEC_EFFECTS)) {
  ok(specIds.has(id), `effect ${id} names a real specialisation`);
  for (const k of Object.keys(fx)) ok(MOD_KEYS.includes(k), `effect ${id}.${k} is a sim-read key`);
}
for (const [id, fx] of Object.entries(RACE_EFFECTS)) {
  ok(RACES.some((r) => r.id === id), `race effect ${id} names a real race`);
  for (const k of Object.keys(fx)) ok(MOD_KEYS.includes(k), `race effect ${id}.${k} is a sim-read key`);
}
for (const r of RACES) {
  const m = composeMods(r.traits, r.id, null);
  for (const k of ["life", "hull", "lock", "gTol", "heat", "scan"]) ok(Math.abs(m[k] - (r.traits[k] ?? 1)) < 1e-9, `${r.id}: trait ${k} reaches the mods bag`);
}

console.log(`careers: ${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
