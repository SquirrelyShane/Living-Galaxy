# js/careers/careerEngine.js

[index](../../../README.md) · 334 lines · 20 symbols · 2 imports · 1 importers

## About

<!-- note:@file -->
Progression engine. Pure functions — drop into a browser RPG or Node.

Character shape expected:
{
  id, name,
  cycles: number,                 // time served in current complex (or total; see options)
  skills: { [skillId]: 0-100 },
  certs: string[],
  careers: {
    [complexId]: {
      rank: "A"|"B"|...|"G",
      specialization: string|null,
      cyclesInComplex: number,
      history: Array<{ rank, atCycle, note }>
    }
  },
  activeComplex: string|null
}
<!-- /note -->

## Imports

| line | from | names | target |
|---|---|---|---|
| 1 | `./skills.js` | `SKILLS`, `SKILL_CAP`, `createEmptySkills` | [js/careers/skills.js](skills.js.md) |
| 2 | `./complexes.js` | `COMPLEXES`, `COMPLEX_IDS`, `getComplex`, `getRank`, `getSpecialization`, `RANK_LETTERS` | [js/careers/complexes.js](complexes.js.md) |

## Imported by

- [js/careers/index.js](index.js.md) — `ENGINE_VERSION`, `createCharacter`, `enroll`, `evaluateRequirements`, `nextRank`, `promotionCheck`, `promote`, `specializationCheck`, `specialize`, `transferEligibility`, `trainSkill`, `grantCert`, `tickCycle`, `studySkills`, `displayTitle`, `formatMissing`, `ladderSummary`, `allLaddersText`, `catalog`

## Exports

- [`ENGINE_VERSION`](#s-ENGINE_VERSION) · const — used by [js/careers/index.js](index.js.md)
- [`createCharacter`](#s-createCharacter) · function — used by [js/careers/index.js](index.js.md)
- [`enroll`](#s-enroll) · function — used by [js/careers/index.js](index.js.md)
- [`evaluateRequirements`](#s-evaluateRequirements) · function — used by [js/careers/index.js](index.js.md)
- [`nextRank`](#s-nextRank) · function — used by [js/careers/index.js](index.js.md)
- [`promotionCheck`](#s-promotionCheck) · function — used by [js/careers/index.js](index.js.md)
- [`promote`](#s-promote) · function — used by [js/careers/index.js](index.js.md)
- [`specializationCheck`](#s-specializationCheck) · function — used by [js/careers/index.js](index.js.md)
- [`specialize`](#s-specialize) · function — used by [js/careers/index.js](index.js.md)
- [`transferEligibility`](#s-transferEligibility) · function — used by [js/careers/index.js](index.js.md)
- [`trainSkill`](#s-trainSkill) · function — used by [js/careers/index.js](index.js.md)
- [`grantCert`](#s-grantCert) · function — used by [js/careers/index.js](index.js.md)
- [`studySkills`](#s-studySkills) · function — used by [js/careers/index.js](index.js.md)
- [`tickCycle`](#s-tickCycle) · function — used by [js/careers/index.js](index.js.md)
- [`displayTitle`](#s-displayTitle) · function — used by [js/careers/index.js](index.js.md)
- [`formatMissing`](#s-formatMissing) · function — used by [js/careers/index.js](index.js.md)
- [`ladderSummary`](#s-ladderSummary) · function — used by [js/careers/index.js](index.js.md)
- [`allLaddersText`](#s-allLaddersText) · function — used by [js/careers/index.js](index.js.md)
- [`catalog`](#s-catalog) · function — used by [js/careers/index.js](index.js.md)
- `COMPLEXES` — **no importer in scanned roots**
- `COMPLEX_IDS` — **no importer in scanned roots**
- `SKILLS` — **no importer in scanned roots**
- `RANK_LETTERS` — **no importer in scanned roots**
- `getComplex` — **no importer in scanned roots**
- `getRank` — **no importer in scanned roots**
- `getSpecialization` — **no importer in scanned roots**

## Effects

_none detected_

## Symbols

### <a id="s-ENGINE_VERSION"></a>`ENGINE_VERSION`

const · **exported** · L11–11

<!-- note:ENGINE_VERSION -->
<!-- /note -->

### <a id="s-createCharacter"></a>`createCharacter(name=)`

function · **exported** · L13–25

- calls: [`createEmptySkills`](skills.js.md#s-createEmptySkills) _js/careers/skills.js_
- called by: [`makePilot`](../flight/pilot.js.md#s-makePilot) _js/flight/pilot.js_

<!-- note:createCharacter -->
<!-- /note -->

### <a id="s-enroll"></a>`enroll(character, complexId, opts=)`

function · **exported** · L27–58

- calls: [`evaluateRequirements`](#s-evaluateRequirements) · [`getComplex`](complexes.js.md#s-getComplex) _js/careers/complexes.js_ · [`getRank`](complexes.js.md#s-getRank) _js/careers/complexes.js_
- called by: [`makePilot`](../flight/pilot.js.md#s-makePilot) _js/flight/pilot.js_ ×2 · [`tryTransfer`](../flight/pilot.js.md#s-tryTransfer) _js/flight/pilot.js_

<!-- note:enroll -->
<!-- /note -->

### <a id="s-evaluateRequirements"></a>`evaluateRequirements(character, complexId, rank)`

function · **exported** · L60–89

- called by: [`enroll`](#s-enroll) · [`promotionCheck`](#s-promotionCheck)

<!-- note:evaluateRequirements -->
- L88 · `return missing;` — Certificates are awarded by the rung itself on promotion (see promote()),
  so they are a record of the climb, not a gate — gating on them here
  deadlocked every ladder at rank A because nothing else ever grants one.
  A cert that some *earlier* rung should have awarded still blocks.
<!-- /note -->

### <a id="s-nextRank"></a>`nextRank(character, complexId)`

function · **exported** · L91–98

- calls: [`getComplex`](complexes.js.md#s-getComplex) _js/careers/complexes.js_ · [`getRank`](complexes.js.md#s-getRank) _js/careers/complexes.js_ ×2
- called by: [`promotionCheck`](#s-promotionCheck) · [`studySkills`](#s-studySkills)

<!-- note:nextRank -->
<!-- /note -->

### <a id="s-promotionCheck"></a>`promotionCheck(character, complexId)`

function · **exported** · L100–116

- calls: [`evaluateRequirements`](#s-evaluateRequirements) · [`formatMissing`](#s-formatMissing) · [`nextRank`](#s-nextRank)
- called by: [`promote`](#s-promote) · [`rankStatus`](../flight/pilot.js.md#s-rankStatus) _js/flight/pilot.js_

<!-- note:promotionCheck -->
<!-- /note -->

### <a id="s-promote"></a>`promote(character, complexId)`

function · **exported** · L118–134

- calls: [`promotionCheck`](#s-promotionCheck)
- called by: [`tryPromote`](../flight/pilot.js.md#s-tryPromote) _js/flight/pilot.js_

<!-- note:promote -->
- L130 · `for (const cert of check.next.req.certs || []) {` — Award the rank's certs so later ranks can require them.
<!-- /note -->

### <a id="s-specializationCheck"></a>`specializationCheck(character, complexId, specId)`

function · **exported** · L136–170

- calls: [`getSpecialization`](complexes.js.md#s-getSpecialization) _js/careers/complexes.js_
- via [js/careers/complexes.js](complexes.js.md): `RANK_LETTERS.indexOf`
- called by: [`specialize`](#s-specialize) · [`specOptions`](../flight/pilot.js.md#s-specOptions) _js/flight/pilot.js_

<!-- note:specializationCheck -->
<!-- /note -->

### <a id="s-specialize"></a>`specialize(character, complexId, specId)`

function · **exported** · L172–183

- calls: [`specializationCheck`](#s-specializationCheck)
- called by: [`trySpecialize`](../flight/pilot.js.md#s-trySpecialize) _js/flight/pilot.js_

<!-- note:specialize -->
<!-- /note -->

### <a id="s-transferEligibility"></a>`transferEligibility(character, fromId, toId)`

function · **exported** · L185–204

- calls: [`getComplex`](complexes.js.md#s-getComplex) _js/careers/complexes.js_ ×2
- via [js/careers/complexes.js](complexes.js.md): `RANK_LETTERS.indexOf`
- called by: [`transferOptions`](../flight/pilot.js.md#s-transferOptions) _js/flight/pilot.js_ · [`tryTransfer`](../flight/pilot.js.md#s-tryTransfer) _js/flight/pilot.js_

<!-- note:transferEligibility -->
Lateral transfer: keep cycles, start the new ladder at A (or B if skills
already smash the A/B gates — useful for Surveyor → other survey roles).
<!-- /note -->

### <a id="s-trainSkill"></a>`trainSkill(character, skillId, amount=)`

function · **exported** · L206–212

- called by: [`makePilot`](../flight/pilot.js.md#s-makePilot) _js/flight/pilot.js_ · [`work`](../flight/pilot.js.md#s-work) _js/flight/pilot.js_

<!-- note:trainSkill -->
<!-- /note -->

### <a id="s-grantCert"></a>`grantCert(character, cert)`

function · **exported** · L214–219

<!-- note:grantCert -->
<!-- /note -->

### <a id="s-studySkills"></a>`studySkills(character, complexId)`

function · **exported** · L221–238

- calls: [`nextRank`](#s-nextRank) · [`studySkills>add`](#s-studySkills-add) ×2 · [`getComplex`](complexes.js.md#s-getComplex) _js/careers/complexes.js_
- via [js/careers/complexes.js](complexes.js.md): `RANK_LETTERS.indexOf`
- called by: [`tickCycle`](#s-tickCycle) · [`mountPilot`](../console/panels/corp.js.md#s-mountPilot) _js/console/panels/corp.js_

<!-- note:studySkills -->
Skills the character is currently studying toward: the next rung's
requirements plus those of any specialisation open at the current rank,
minus the complex's primaries (which drip on their own).
<!-- /note -->

#### <a id="s-studySkills-add"></a>`studySkills>add(skills)`

function · L227–229

- called by: [`studySkills`](#s-studySkills) ×2

<!-- note:studySkills>add -->
<!-- /note -->

### <a id="s-tickCycle"></a>`tickCycle(character, opts=)`

function · **exported** · L240–266

- calls: [`studySkills`](#s-studySkills) · [`getComplex`](complexes.js.md#s-getComplex) _js/careers/complexes.js_ · [`getRank`](complexes.js.md#s-getRank) _js/careers/complexes.js_
- called by: [`serveTime`](../flight/pilot.js.md#s-serveTime) _js/flight/pilot.js_

<!-- note:tickCycle -->
- L248 · `const complex = getComplex(active);` — Gentle on-the-job skill drip for primary skills.
- L258 · `for (const skill of studySkills(next, active)) {` — The job trains for the job above it: whatever the next rung (and any
  specialisation already open to this rank) asks for that is not a
  primary drips at half rate, so no ladder can dead-end on a skill
  nothing in the sky feeds.
<!-- /note -->

### <a id="s-displayTitle"></a>`displayTitle(character, complexId)`

function · **exported** · L268–279

- calls: [`getComplex`](complexes.js.md#s-getComplex) _js/careers/complexes.js_ · [`getRank`](complexes.js.md#s-getRank) _js/careers/complexes.js_ · [`getSpecialization`](complexes.js.md#s-getSpecialization) _js/careers/complexes.js_
- called by: [`title`](../flight/pilot.js.md#s-title) _js/flight/pilot.js_ · [`tryPromote`](../flight/pilot.js.md#s-tryPromote) _js/flight/pilot.js_

<!-- note:displayTitle -->
<!-- /note -->

### <a id="s-formatMissing"></a>`formatMissing(missing)`

function · **exported** · L281–290

- called by: [`promotionCheck`](#s-promotionCheck)

<!-- note:formatMissing -->
<!-- /note -->

### <a id="s-ladderSummary"></a>`ladderSummary(complexId)`

function · **exported** · L292–298

- calls: [`getComplex`](complexes.js.md#s-getComplex) _js/careers/complexes.js_

<!-- note:ladderSummary -->
<!-- /note -->

### <a id="s-allLaddersText"></a>`allLaddersText()`

function · **exported** · L300–302

- via [js/careers/complexes.js](complexes.js.md): `COMPLEX_IDS.map`, `COMPLEX_IDS.map.join`

<!-- note:allLaddersText -->
<!-- /note -->

### <a id="s-catalog"></a>`catalog()`

function · **exported** · L304–332

- via [js/careers/complexes.js](complexes.js.md): `COMPLEX_IDS.map`

<!-- note:catalog -->
<!-- /note -->
