# js/careers/complexes.js

[index](../../../README.md) · 1966 lines · 6 symbols · 0 imports · 13 importers

## About

<!-- note:@file -->
Industrial complexes and lettered career ladders for a space-age browser RPG.

Rank letters follow the requested pattern:
  A Survey / Aide  →  B Entry  →  C Journeyman  →  D Proficient  →  E Master
then two deep ranks (F Foreman / Director, G Complex authority).

After rank D a character may lock a specialization without leaving the main
ladder. Specializations add a suffix title and extra unlocks.

Pay is in "scrip" (station credits) per cycle. Tune to your economy.
<!-- /note -->

## Imports

_none_

## Imported by

- [js/careers/careerEngine.js](careerEngine.js.md) — `COMPLEXES`, `COMPLEX_IDS`, `getComplex`, `getRank`, `getSpecialization`, `RANK_LETTERS`
- [js/careers/index.js](index.js.md) — `COMPLEXES`, `COMPLEX_IDS`, `RANK_LETTERS`, `getComplex`, `getRank`, `getSpecialization`
- [js/crew/children.js](../crew/children.js.md) — `COMPLEXES`
- [js/crew/childtalk.js](../crew/childtalk.js.md) — `COMPLEXES`
- [js/crew/family.js](../crew/family.js.md) — `COMPLEXES`
- [js/crew/heritage.js](../crew/heritage.js.md) — `COMPLEXES`, `RANK_LETTERS`
- [js/crew/ledger.js](../crew/ledger.js.md) — `COMPLEXES`, `RANK_LETTERS`
- [js/interior/deckplan.js](../interior/deckplan.js.md) — `COMPLEXES`
- [js/interior/deckplan.js](../interior/deckplan.js.md) — `RANK_LETTERS`
- [js/npc/cradle.js](../npc/cradle.js.md) — `COMPLEXES`, `RANK_LETTERS`
- [js/station/stationlife.js](../station/stationlife.js.md) — `COMPLEXES`
- test/ariaplay.test.mjs _(outside js/)_ — `COMPLEX_IDS`
- test/desk.test.mjs _(outside js/)_ — `COMPLEXES`

## Exports

- [`RANK_LETTERS`](#s-RANK_LETTERS) · const — used by [js/careers/careerEngine.js](careerEngine.js.md), [js/careers/index.js](index.js.md), [js/crew/heritage.js](../crew/heritage.js.md), [js/crew/ledger.js](../crew/ledger.js.md), [js/interior/deckplan.js](../interior/deckplan.js.md), [js/npc/cradle.js](../npc/cradle.js.md)
- [`COMPLEXES`](#s-COMPLEXES) · const — used by [js/careers/careerEngine.js](careerEngine.js.md), [js/careers/index.js](index.js.md), [js/crew/children.js](../crew/children.js.md), [js/crew/childtalk.js](../crew/childtalk.js.md), [js/crew/family.js](../crew/family.js.md), [js/crew/heritage.js](../crew/heritage.js.md), [js/crew/ledger.js](../crew/ledger.js.md), [js/interior/deckplan.js](../interior/deckplan.js.md), [js/npc/cradle.js](../npc/cradle.js.md), [js/station/stationlife.js](../station/stationlife.js.md), test/desk.test.mjs
- [`COMPLEX_IDS`](#s-COMPLEX_IDS) · const — used by [js/careers/careerEngine.js](careerEngine.js.md), [js/careers/index.js](index.js.md), test/ariaplay.test.mjs
- [`getComplex`](#s-getComplex) · function — used by [js/careers/careerEngine.js](careerEngine.js.md), [js/careers/index.js](index.js.md)
- [`getRank`](#s-getRank) · function — used by [js/careers/careerEngine.js](careerEngine.js.md), [js/careers/index.js](index.js.md)
- [`getSpecialization`](#s-getSpecialization) · function — used by [js/careers/careerEngine.js](careerEngine.js.md), [js/careers/index.js](index.js.md)

## Effects

- **input.key** — `Control` (COMPLEXES:1337)

## Symbols

### <a id="s-RANK_LETTERS"></a>`RANK_LETTERS`

const · **exported** · L1–1

<!-- note:RANK_LETTERS -->
<!-- /note -->

### <a id="s-COMPLEXES"></a>`COMPLEXES`

const · **exported** · L3–1948

- effects: input.key `Control`

<!-- note:COMPLEXES -->
<!-- /note -->

### <a id="s-COMPLEX_IDS"></a>`COMPLEX_IDS`

const · **exported** · L1950–1950

<!-- note:COMPLEX_IDS -->
<!-- /note -->

### <a id="s-getComplex"></a>`getComplex(id)`

function · **exported** · L1952–1954

- called by: [`displayTitle`](careerEngine.js.md#s-displayTitle) _js/careers/careerEngine.js_ · [`enroll`](careerEngine.js.md#s-enroll) _js/careers/careerEngine.js_ · [`ladderSummary`](careerEngine.js.md#s-ladderSummary) _js/careers/careerEngine.js_ · [`nextRank`](careerEngine.js.md#s-nextRank) _js/careers/careerEngine.js_ · [`studySkills`](careerEngine.js.md#s-studySkills) _js/careers/careerEngine.js_ · [`tickCycle`](careerEngine.js.md#s-tickCycle) _js/careers/careerEngine.js_ · [`transferEligibility`](careerEngine.js.md#s-transferEligibility) _js/careers/careerEngine.js_ ×2 · [`getRank`](#s-getRank) · [`getSpecialization`](#s-getSpecialization) · [`careerCatalog`](../flight/pilot.js.md#s-careerCatalog) _js/flight/pilot.js_ · [`rankStatus`](../flight/pilot.js.md#s-rankStatus) _js/flight/pilot.js_ · [`specOptions`](../flight/pilot.js.md#s-specOptions) _js/flight/pilot.js_ · [`transferOptions`](../flight/pilot.js.md#s-transferOptions) _js/flight/pilot.js_ · [`tryTransfer`](../flight/pilot.js.md#s-tryTransfer) _js/flight/pilot.js_

<!-- note:getComplex -->
<!-- /note -->

### <a id="s-getRank"></a>`getRank(complexId, letter)`

function · **exported** · L1956–1960

- calls: [`getComplex`](#s-getComplex)
- called by: [`displayTitle`](careerEngine.js.md#s-displayTitle) _js/careers/careerEngine.js_ · [`enroll`](careerEngine.js.md#s-enroll) _js/careers/careerEngine.js_ · [`nextRank`](careerEngine.js.md#s-nextRank) _js/careers/careerEngine.js_ ×2 · [`tickCycle`](careerEngine.js.md#s-tickCycle) _js/careers/careerEngine.js_

<!-- note:getRank -->
<!-- /note -->

### <a id="s-getSpecialization"></a>`getSpecialization(complexId, specId)`

function · **exported** · L1962–1966

- calls: [`getComplex`](#s-getComplex)
- called by: [`displayTitle`](careerEngine.js.md#s-displayTitle) _js/careers/careerEngine.js_ · [`specializationCheck`](careerEngine.js.md#s-specializationCheck) _js/careers/careerEngine.js_

<!-- note:getSpecialization -->
<!-- /note -->
