/**
 * Barrel export for the space-age career system.
 *
 *   import { createCharacter, enroll, COMPLEXES } from './careers/index.js';
 */

export { SKILLS, SKILL_LIST, SKILL_CAP, createEmptySkills } from "./skills.js";

export {
  COMPLEXES,
  COMPLEX_IDS,
  RANK_LETTERS,
  getComplex,
  getRank,
  getSpecialization,
} from "./complexes.js";

export {
  ENGINE_VERSION,
  createCharacter,
  enroll,
  evaluateRequirements,
  nextRank,
  promotionCheck,
  promote,
  specializationCheck,
  specialize,
  transferEligibility,
  trainSkill,
  grantCert,
  tickCycle,
  studySkills,
  displayTitle,
  formatMissing,
  ladderSummary,
  allLaddersText,
  catalog,
} from "./careerEngine.js";
