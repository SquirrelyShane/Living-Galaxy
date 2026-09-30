# js/careers/skills.js

[index](../../../README.md) · 198 lines · 4 symbols · 0 imports · 5 importers

## About

<!-- note:@file -->
Shared skill taxonomy for the space-age career system.
Skills are 0–100 by default. Ranks gate on minimums; specializations
demand higher peaks. Characters can multi-class across complexes
because several skills appear in more than one track.
<!-- /note -->

## Imports

_none_

## Imported by

- [js/careers/careerEngine.js](careerEngine.js.md) — `SKILLS`, `SKILL_CAP`, `createEmptySkills`
- [js/careers/index.js](index.js.md) — `SKILLS`, `SKILL_LIST`, `SKILL_CAP`, `createEmptySkills`
- [js/console/panels/crew-gene.js](../console/panels/crew-gene.js.md) — `SKILLS`
- [js/crew/orders.js](../crew/orders.js.md) — `SKILLS`
- [js/ui/creation.js](../ui/creation.js.md) — `SKILLS`

## Exports

- [`SKILL_CAP`](#s-SKILL_CAP) · const — used by [js/careers/careerEngine.js](careerEngine.js.md), [js/careers/index.js](index.js.md)
- [`SKILLS`](#s-SKILLS) · const — used by [js/careers/careerEngine.js](careerEngine.js.md), [js/careers/index.js](index.js.md), [js/console/panels/crew-gene.js](../console/panels/crew-gene.js.md), [js/crew/orders.js](../crew/orders.js.md), [js/ui/creation.js](../ui/creation.js.md)
- [`SKILL_LIST`](#s-SKILL_LIST) · const — used by [js/careers/index.js](index.js.md)
- [`createEmptySkills`](#s-createEmptySkills) · function — used by [js/careers/careerEngine.js](careerEngine.js.md), [js/careers/index.js](index.js.md)

## Effects

_none detected_

## Symbols

### <a id="s-SKILL_CAP"></a>`SKILL_CAP`

const · **exported** · L1–1

<!-- note:SKILL_CAP -->
<!-- /note -->

### <a id="s-SKILLS"></a>`SKILLS`

const · **exported** · L3–189

<!-- note:SKILLS -->
- L4 · `geology: {` — Extraction & field
- L29 · `firstAid: {` — Medical
- L66 · `hullcraft: {` — Industrial / yard
- L103 · `supplyChain: {` — Logistics & command
- L128 · `energySystems: {` — Infrastructure
- L159 · `research: {` — Knowledge & security
<!-- /note -->

### <a id="s-SKILL_LIST"></a>`SKILL_LIST`

const · **exported** · L191–191

<!-- note:SKILL_LIST -->
<!-- /note -->

### <a id="s-createEmptySkills"></a>`createEmptySkills()`

function · **exported** · L193–198

- called by: [`createCharacter`](careerEngine.js.md#s-createCharacter) _js/careers/careerEngine.js_

<!-- note:createEmptySkills -->
<!-- /note -->
