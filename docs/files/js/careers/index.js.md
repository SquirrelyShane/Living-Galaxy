# js/careers/index.js

[index](../../../README.md) · 32 lines · 0 symbols · 0 imports · 4 importers

## About

<!-- note:@file -->
Barrel export for the space-age career system.

  import { createCharacter, enroll, COMPLEXES } from './careers/index.js';
<!-- /note -->

## Imports

| line | from | names | target |
|---|---|---|---|
| 1 | `./skills.js` | re-export `SKILLS`, `SKILL_LIST`, `SKILL_CAP`, `createEmptySkills` | [js/careers/skills.js](skills.js.md) |
| 3 | `./complexes.js` | re-export `COMPLEXES`, `COMPLEX_IDS`, `RANK_LETTERS`, `getComplex`, `getRank`, `getSpecialization` | [js/careers/complexes.js](complexes.js.md) |
| 12 | `./careerEngine.js` | re-export `ENGINE_VERSION`, `createCharacter`, `enroll`, `evaluateRequirements`, `nextRank`, `promotionCheck`, `promote`, `specializationCheck`, `specialize`, `transferEligibility`, `trainSkill`, `grantCert`, `tickCycle`, `studySkills`, `displayTitle`, `formatMissing`, `ladderSummary`, `allLaddersText`, `catalog` | [js/careers/careerEngine.js](careerEngine.js.md) |

## Imported by

- [js/console/panels/corp.js](../console/panels/corp.js.md) — `SKILLS`, `studySkills`
- [js/flight/pilot.js](../flight/pilot.js.md) — `COMPLEXES`, `COMPLEX_IDS`, `SKILLS`, `createCharacter`, `displayTitle`, `enroll`, `getComplex`, `promote`, `promotionCheck`, `specialize`, `specializationCheck`, `tickCycle`, `trainSkill`, `transferEligibility`
- test/careers.test.mjs _(outside js/)_ — `COMPLEXES`, `RANK_LETTERS`, `createCharacter`, `enroll`, `promote`, `promotionCheck`, `specialize`, `tickCycle`, `studySkills`
- test/careerstatus.test.mjs _(outside js/)_ — `COMPLEX_IDS`

## Exports

- `SKILLS` · from `./skills.js` — used by [js/console/panels/corp.js](../console/panels/corp.js.md), [js/flight/pilot.js](../flight/pilot.js.md)
- `SKILL_LIST` · from `./skills.js` — **no importer in scanned roots**
- `SKILL_CAP` · from `./skills.js` — **no importer in scanned roots**
- `createEmptySkills` · from `./skills.js` — **no importer in scanned roots**
- `COMPLEXES` · from `./complexes.js` — used by [js/flight/pilot.js](../flight/pilot.js.md), test/careers.test.mjs
- `COMPLEX_IDS` · from `./complexes.js` — used by [js/flight/pilot.js](../flight/pilot.js.md), test/careerstatus.test.mjs
- `RANK_LETTERS` · from `./complexes.js` — used by test/careers.test.mjs
- `getComplex` · from `./complexes.js` — used by [js/flight/pilot.js](../flight/pilot.js.md)
- `getRank` · from `./complexes.js` — **no importer in scanned roots**
- `getSpecialization` · from `./complexes.js` — **no importer in scanned roots**
- `ENGINE_VERSION` · from `./careerEngine.js` — **no importer in scanned roots**
- `createCharacter` · from `./careerEngine.js` — used by [js/flight/pilot.js](../flight/pilot.js.md), test/careers.test.mjs
- `enroll` · from `./careerEngine.js` — used by [js/flight/pilot.js](../flight/pilot.js.md), test/careers.test.mjs
- `evaluateRequirements` · from `./careerEngine.js` — **no importer in scanned roots**
- `nextRank` · from `./careerEngine.js` — **no importer in scanned roots**
- `promotionCheck` · from `./careerEngine.js` — used by [js/flight/pilot.js](../flight/pilot.js.md), test/careers.test.mjs
- `promote` · from `./careerEngine.js` — used by [js/flight/pilot.js](../flight/pilot.js.md), test/careers.test.mjs
- `specializationCheck` · from `./careerEngine.js` — used by [js/flight/pilot.js](../flight/pilot.js.md)
- `specialize` · from `./careerEngine.js` — used by [js/flight/pilot.js](../flight/pilot.js.md), test/careers.test.mjs
- `transferEligibility` · from `./careerEngine.js` — used by [js/flight/pilot.js](../flight/pilot.js.md)
- `trainSkill` · from `./careerEngine.js` — used by [js/flight/pilot.js](../flight/pilot.js.md)
- `grantCert` · from `./careerEngine.js` — **no importer in scanned roots**
- `tickCycle` · from `./careerEngine.js` — used by [js/flight/pilot.js](../flight/pilot.js.md), test/careers.test.mjs
- `studySkills` · from `./careerEngine.js` — used by [js/console/panels/corp.js](../console/panels/corp.js.md), test/careers.test.mjs
- `displayTitle` · from `./careerEngine.js` — used by [js/flight/pilot.js](../flight/pilot.js.md)
- `formatMissing` · from `./careerEngine.js` — **no importer in scanned roots**
- `ladderSummary` · from `./careerEngine.js` — **no importer in scanned roots**
- `allLaddersText` · from `./careerEngine.js` — **no importer in scanned roots**
- `catalog` · from `./careerEngine.js` — **no importer in scanned roots**

## Effects

_none detected_

## Symbols

_none_
