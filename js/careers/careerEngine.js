/**
 * Progression engine. Pure functions — drop into a browser RPG or Node.
 *
 * Character shape expected:
 * {
 *   id, name,
 *   cycles: number,                 // time served in current complex (or total; see options)
 *   skills: { [skillId]: 0-100 },
 *   certs: string[],
 *   careers: {
 *     [complexId]: {
 *       rank: "A"|"B"|...|"G",
 *       specialization: string|null,
 *       cyclesInComplex: number,
 *       history: Array<{ rank, atCycle, note }>
 *     }
 *   },
 *   activeComplex: string|null
 * }
 */

import { SKILLS, SKILL_CAP, createEmptySkills } from "./skills.js";
import {
  COMPLEXES,
  COMPLEX_IDS,
  getComplex,
  getRank,
  getSpecialization,
  RANK_LETTERS,
} from "./complexes.js";

export const ENGINE_VERSION = "1.0.0";

export function createCharacter(name = "Unnamed Hand") {
  return {
    id: `char_${Math.random().toString(36).slice(2, 10)}`,
    name,
    cycles: 0,
    skills: createEmptySkills(),
    certs: ["basic_eva"],
    careers: {},
    activeComplex: null,
    scrip: 0,
    flags: {},
  };
}

export function enroll(character, complexId, opts = {}) {
  const complex = getComplex(complexId);
  if (!complex) return { ok: false, error: `Unknown complex: ${complexId}` };
  if (character.careers[complexId]) {
    return { ok: false, error: `Already enrolled in ${complex.name}` };
  }

  const startLetter = opts.startLetter || "A";
  const rank = getRank(complexId, startLetter);
  if (!rank) return { ok: false, error: `No rank ${startLetter}` };

  const next = structuredClone(character);
  next.careers[complexId] = {
    rank: startLetter,
    specialization: null,
    cyclesInComplex: 0,
    history: [{ rank: startLetter, atCycle: next.cycles, note: "enrolled" }],
  };
  if (!next.activeComplex) next.activeComplex = complexId;

  const missing = evaluateRequirements(next, complexId, rank);
  if (missing.length && !opts.force) {
    return {
      ok: false,
      error: "Does not meet entry requirements",
      missing,
      hint: "Pass { force: true } to enroll as a probationary aide anyway.",
    };
  }

  return { ok: true, character: next, rank };
}

export function evaluateRequirements(character, complexId, rank) {
  const missing = [];
  const career = character.careers[complexId];
  const cyclesHeld = career?.cyclesInComplex ?? 0;

  if (rank.req.cycles && cyclesHeld < rank.req.cycles) {
    missing.push({
      type: "cycles",
      have: cyclesHeld,
      need: rank.req.cycles,
      remain: rank.req.cycles - cyclesHeld,
    });
  }

  for (const [skill, need] of Object.entries(rank.req.skills || {})) {
    const have = character.skills[skill] ?? 0;
    if (have < need) {
      missing.push({
        type: "skill",
        skill,
        name: SKILLS[skill]?.name || skill,
        have,
        need,
        remain: need - have,
      });
    }
  }

  /* Certificates are awarded by the rung itself on promotion (see promote()),
   * so they are a record of the climb, not a gate — gating on them here
   * deadlocked every ladder at rank A because nothing else ever grants one.
   * A cert that some *earlier* rung should have awarded still blocks. */
  return missing;
}

export function nextRank(character, complexId) {
  const career = character.careers[complexId];
  const complex = getComplex(complexId);
  if (!career || !complex) return null;
  const current = getRank(complexId, career.rank);
  if (!current?.next) return null;
  return getRank(complexId, current.next);
}

export function promotionCheck(character, complexId) {
  const nxt = nextRank(character, complexId);
  if (!nxt) {
    return { ok: false, reason: "terminal", message: "No higher rank on this ladder." };
  }
  const missing = evaluateRequirements(character, complexId, nxt);
  if (missing.length) {
    return {
      ok: false,
      reason: "requirements",
      next: nxt,
      missing,
      message: formatMissing(missing),
    };
  }
  return { ok: true, next: nxt, missing: [] };
}

export function promote(character, complexId) {
  const check = promotionCheck(character, complexId);
  if (!check.ok) return { ok: false, ...check };

  const next = structuredClone(character);
  const career = next.careers[complexId];
  career.rank = check.next.letter;
  career.history.push({
    rank: check.next.letter,
    atCycle: next.cycles,
    note: "promoted",
  });
  // Award the rank's certs so later ranks can require them.
  for (const cert of check.next.req.certs || []) {
    if (!next.certs.includes(cert)) next.certs.push(cert);
  }
  return { ok: true, character: next, rank: check.next };
}

export function specializationCheck(character, complexId, specId) {
  const career = character.careers[complexId];
  const spec = getSpecialization(complexId, specId);
  if (!career) return { ok: false, error: "Not enrolled" };
  if (!spec) return { ok: false, error: "Unknown specialization" };
  if (career.specialization) {
    return { ok: false, error: `Already specialized as ${career.specialization}` };
  }

  const currentIdx = RANK_LETTERS.indexOf(career.rank);
  const needIdx = RANK_LETTERS.indexOf(spec.fromRank);
  if (currentIdx < needIdx) {
    return {
      ok: false,
      error: `Requires rank ${spec.fromRank}+ (currently ${career.rank})`,
    };
  }

  const missing = [];
  for (const [skill, need] of Object.entries(spec.skills || {})) {
    const have = character.skills[skill] ?? 0;
    if (have < need) {
      missing.push({
        type: "skill",
        skill,
        name: SKILLS[skill]?.name || skill,
        have,
        need,
        remain: need - have,
      });
    }
  }
  if (missing.length) return { ok: false, error: "Skill shortfall", missing };
  return { ok: true, spec };
}

export function specialize(character, complexId, specId) {
  const check = specializationCheck(character, complexId, specId);
  if (!check.ok) return check;
  const next = structuredClone(character);
  next.careers[complexId].specialization = specId;
  next.careers[complexId].history.push({
    rank: next.careers[complexId].rank,
    atCycle: next.cycles,
    note: `specialized:${specId}`,
  });
  return { ok: true, character: next, spec: check.spec };
}

/**
 * Lateral transfer: keep cycles, start the new ladder at A (or B if skills
 * already smash the A/B gates — useful for Surveyor → other survey roles).
 */
export function transferEligibility(character, fromId, toId) {
  const from = getComplex(fromId);
  const to = getComplex(toId);
  if (!from || !to) return { ok: false, error: "Unknown complex" };
  if (!character.careers[fromId]) return { ok: false, error: "Not in source complex" };
  if (character.careers[toId]) return { ok: false, error: "Already in target complex" };

  const related = (from.related || []).includes(toId) || (to.related || []).includes(fromId);
  const sourceRankIdx = RANK_LETTERS.indexOf(character.careers[fromId].rank);
  const recommendedStart = sourceRankIdx >= 3 && related ? "B" : "A";

  return {
    ok: true,
    related,
    recommendedStart,
    note: related
      ? `${from.short} and ${to.short} share pipelines; a mid-rank hand can skip the most junior chores.`
      : "Unrelated complexes. Expect to start as an aide and re-earn trust.",
  };
}

export function trainSkill(character, skillId, amount = 1) {
  if (!SKILLS[skillId]) return { ok: false, error: `Unknown skill ${skillId}` };
  const next = structuredClone(character);
  const cur = next.skills[skillId] ?? 0;
  next.skills[skillId] = Math.min(SKILL_CAP, cur + amount);
  return { ok: true, character: next, skill: skillId, value: next.skills[skillId] };
}

export function grantCert(character, cert) {
  if (character.certs.includes(cert)) return { ok: true, character, already: true };
  const next = structuredClone(character);
  next.certs.push(cert);
  return { ok: true, character: next };
}

/**
 * Skills the character is currently studying toward: the next rung's
 * requirements plus those of any specialisation open at the current rank,
 * minus the complex's primaries (which drip on their own).
 */
export function studySkills(character, complexId) {
  const career = character.careers[complexId];
  const complex = getComplex(complexId);
  if (!career || !complex) return [];
  const out = new Set();
  const primary = new Set(complex.primarySkills ?? []);
  const add = (skills) => {
    for (const [id, need] of Object.entries(skills ?? {})) if (!primary.has(id) && (character.skills[id] ?? 0) < need) out.add(id);
  };
  add(nextRank(character, complexId)?.req?.skills);
  if (!career.specialization) {
    const idx = RANK_LETTERS.indexOf(career.rank);
    for (const sp of complex.specializations ?? []) {
      if (RANK_LETTERS.indexOf(sp.fromRank) <= idx) add(sp.skills ?? sp.req?.skills);
    }
  }
  return [...out];
}

export function tickCycle(character, opts = {}) {
  const next = structuredClone(character);
  next.cycles += 1;
  const active = opts.complexId || next.activeComplex;
  if (active && next.careers[active]) {
    next.careers[active].cyclesInComplex += 1;
    const rank = getRank(active, next.careers[active].rank);
    if (rank) next.scrip += rank.pay;
    // Gentle on-the-job skill drip for primary skills.
    const complex = getComplex(active);
    if (complex && opts.train !== false) {
      const chance = opts.trainChance ?? 0.45;
      const amount = opts.trainAmount ?? 1;
      const rnd = opts.rnd ?? Math.random;
      for (const skill of complex.primarySkills) {
        if (rnd() < chance) {
          next.skills[skill] = Math.min(SKILL_CAP, (next.skills[skill] ?? 0) + amount);
        }
      }
      // The job trains for the job above it: whatever the next rung (and any
      // specialisation already open to this rank) asks for that is not a
      // primary drips at half rate, so no ladder can dead-end on a skill
      // nothing in the sky feeds.
      for (const skill of studySkills(next, active)) {
        if (rnd() < chance * 0.5) {
          next.skills[skill] = Math.min(SKILL_CAP, (next.skills[skill] ?? 0) + amount);
        }
      }
    }
  }
  return { ok: true, character: next };
}

export function displayTitle(character, complexId) {
  const career = character.careers[complexId];
  const complex = getComplex(complexId);
  if (!career || !complex) return null;
  const rank = getRank(complexId, career.rank);
  let title = rank?.honorific || rank?.title || "Hand";
  if (career.specialization) {
    const spec = getSpecialization(complexId, career.specialization);
    if (spec?.titleSuffix) title = `${title}, ${spec.titleSuffix}`;
  }
  return `${title} — ${complex.name}`;
}

export function formatMissing(missing) {
  return missing
    .map((m) => {
      if (m.type === "cycles") return `${m.remain} more cycle(s) in-complex`;
      if (m.type === "skill") return `${m.name} ${m.have}/${m.need}`;
      if (m.type === "cert") return `cert:${m.cert}`;
      return JSON.stringify(m);
    })
    .join("; ");
}

export function ladderSummary(complexId) {
  const c = getComplex(complexId);
  if (!c) return "";
  const ranks = c.ranks.map((r) => `${r.letter}. ${r.title}`).join(" → ");
  const specs = c.specializations.map((s) => `${s.name} (from ${s.fromRank})`).join("; ");
  return `${c.name}: ${ranks}\n  Specs: ${specs || "none"}`;
}

export function allLaddersText() {
  return COMPLEX_IDS.map(ladderSummary).join("\n\n");
}

export function catalog() {
  return COMPLEX_IDS.map((id) => {
    const c = COMPLEXES[id];
    return {
      id: c.id,
      name: c.name,
      short: c.short,
      icon: c.icon,
      color: c.color,
      setting: c.setting,
      primarySkills: c.primarySkills,
      related: c.related,
      ranks: c.ranks.map((r) => ({
        letter: r.letter,
        title: r.title,
        honorific: r.honorific,
        pay: r.pay,
        next: r.next,
        specializationUnlock: !!r.specializationUnlock,
      })),
      specializations: c.specializations.map((s) => ({
        id: s.id,
        name: s.name,
        fromRank: s.fromRank,
        titleSuffix: s.titleSuffix,
      })),
    };
  });
}

export { COMPLEXES, COMPLEX_IDS, SKILLS, RANK_LETTERS, getComplex, getRank, getSpecialization };
