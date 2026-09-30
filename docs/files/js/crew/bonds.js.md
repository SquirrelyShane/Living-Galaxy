# js/crew/bonds.js

[index](../../../README.md) · 111 lines · 12 symbols · 3 imports · 10 importers

## About

<!-- note:@file -->
LIVING GALAXY — ties between hands: friend, rival, couple.

crew.js grows a rapport number per pair every cycle and pairs couples off.
This layer reads that number into *ties*: a friend at seventy, a rival when
two people who do not fit are stuck low and share a watch. Ties are not
cosmetic — bondFactor() scales what a hand's station is worth to the hull
(crewfx.js), a rival on the same watch sours both, and the talk trees let
the captain take sides. Contract: PLAN.md §4.3.
<!-- /note -->

## Imports

| line | from | names | target |
|---|---|---|---|
| 1 | `./ledger.js` | `crew`, `crewHooks`, `compat`, `crewNote`, `rapportBetween`, `firstName` | [js/crew/ledger.js](ledger.js.md) |
| 2 | `./family.js` | `adjustMorale` | [js/crew/family.js](family.js.md) |
| 3 | `../npc/cradle.js` | `cradle` | [js/npc/cradle.js](../npc/cradle.js.md) |

## Imported by

- [js/console/panels/crew.js](../console/panels/crew.js.md) — `bondsReport`
- [js/crew/beats.js](beats.js.md) — `adjustRapport`
- [js/crew/deckacts.js](deckacts.js.md) — `adjustRapport`, `tieBetween`, `makeRivals`
- [js/crew/deckmind.js](deckmind.js.md) — `tieBetween`
- [js/crew/orders.js](orders.js.md) — `tieBetween`
- [js/crew/romance.js](romance.js.md) — `adjustRapport`, `tieBetween`
- [js/crew/roster.js](roster.js.md) — `tiesOf`
- [js/crew/talk.js](talk.js.md) — `adjustRapport`, `makeRivals`, `tiesOf`
- [js/npc/crewfx.js](../npc/crewfx.js.md) — `bondFactor`
- test/crew-life.test.mjs _(outside js/)_ — `tiesOf`, `tieBetween`, `adjustRapport`, `makeRivals`, `bondFactor`, `tickBonds`, `bondsReport`

## Exports

- [`TIE`](#s-TIE) · const — **no importer in scanned roots**
- [`tieBetween`](#s-tieBetween) · function — used by [js/crew/deckacts.js](deckacts.js.md), [js/crew/deckmind.js](deckmind.js.md), [js/crew/orders.js](orders.js.md), [js/crew/romance.js](romance.js.md), test/crew-life.test.mjs
- [`tiesOf`](#s-tiesOf) · function — used by [js/crew/roster.js](roster.js.md), [js/crew/talk.js](talk.js.md), test/crew-life.test.mjs
- [`adjustRapport`](#s-adjustRapport) · function — used by [js/crew/beats.js](beats.js.md), [js/crew/deckacts.js](deckacts.js.md), [js/crew/romance.js](romance.js.md), [js/crew/talk.js](talk.js.md), test/crew-life.test.mjs
- [`makeRivals`](#s-makeRivals) · function — used by [js/crew/deckacts.js](deckacts.js.md), [js/crew/talk.js](talk.js.md), test/crew-life.test.mjs
- [`tickBonds`](#s-tickBonds) · function — used by test/crew-life.test.mjs
- [`bondFactor`](#s-bondFactor) · function — used by [js/npc/crewfx.js](../npc/crewfx.js.md), test/crew-life.test.mjs
- [`bondsReport`](#s-bondsReport) · function — used by [js/console/panels/crew.js](../console/panels/crew.js.md), test/crew-life.test.mjs

## Effects

_none detected_

## Symbols

### <a id="s-TIE"></a>`TIE`

const · **exported** · L5–5

<!-- note:TIE -->
rapport thresholds; couple = m.partner
<!-- /note -->

### <a id="s-RIVAL_ROLL"></a>`RIVAL_ROLL`

const · L6–6

<!-- note:RIVAL_ROLL -->
<!-- /note -->

### <a id="s-hashRoll"></a>`hashRoll(s)`

function · L8–12

- called by: [`tickBonds`](#s-tickBonds)

<!-- note:hashRoll -->
<!-- /note -->

### <a id="s-byId"></a>`byId(id)`

function · L14–14

- via [js/crew/ledger.js](ledger.js.md): `crew.aboard.find`
- called by: [`adjustRapport`](#s-adjustRapport) ×2 · [`bondFactor`](#s-bondFactor) · [`makeRivals`](#s-makeRivals) ×2 · [`tieBetween`](#s-tieBetween) ×2

<!-- note:byId -->
<!-- /note -->

### <a id="s-tieBetween"></a>`tieBetween(a, b)`

function · **exported** · L16–24

- calls: [`byId`](#s-byId) ×2 · [`rapportBetween`](ledger.js.md#s-rapportBetween) _js/crew/ledger.js_
- called by: [`bondFactor`](#s-bondFactor) · [`bondsReport`](#s-bondsReport) · [`tickBonds`](#s-tickBonds) · [`tiesOf`](#s-tiesOf) · [`applyAction`](deckacts.js.md#s-applyAction) _js/crew/deckacts.js_ ×2 · [`buildContext`](deckmind.js.md#s-buildContext) _js/crew/deckmind.js_ · [`focusEntry`](orders.js.md#s-focusEntry) _js/crew/orders.js_ · [`ladderReport`](romance.js.md#s-ladderReport) _js/crew/romance.js_

<!-- note:tieBetween -->
→ "couple" | "friend" | "rival" | null between two members (objects or ids).
<!-- /note -->

### <a id="s-tiesOf"></a>`tiesOf(m)`

function · **exported** · L26–36

- calls: [`tieBetween`](#s-tieBetween) · [`rapportBetween`](ledger.js.md#s-rapportBetween) _js/crew/ledger.js_
- called by: [`tickBonds`](#s-tickBonds) · [`roster`](roster.js.md#s-roster) _js/crew/roster.js_ · [`talkContext`](talk.js.md#s-talkContext) _js/crew/talk.js_

<!-- note:tiesOf -->
→ [{ with, name, kind, rapport }] — this hand's ties, couples first, then by rapport.
<!-- /note -->

### <a id="s-adjustRapport"></a>`adjustRapport(a, b, d)`

function · **exported** · L38–46

- calls: [`byId`](#s-byId) ×2
- called by: [`applyOutcome`](beats.js.md#s-applyOutcome) _js/crew/beats.js_ · [`applyAction`](deckacts.js.md#s-applyAction) _js/crew/deckacts.js_ ×4 · [`actOnJealousy`](romance.js.md#s-actOnJealousy) _js/crew/romance.js_ · [`breakOff`](romance.js.md#s-breakOff) _js/crew/romance.js_ · [`makePartners`](romance.js.md#s-makePartners) _js/crew/romance.js_ · [`privateNight`](romance.js.md#s-privateNight) _js/crew/romance.js_ · [`applyFx`](talk.js.md#s-applyFx) _js/crew/talk.js_

<!-- note:adjustRapport -->
Symmetric rapport write; a rivalry heals itself once the number climbs back.
<!-- /note -->

### <a id="s-makeRivals"></a>`makeRivals(a, b)`

function · **exported** · L48–53

- calls: [`byId`](#s-byId) ×2
- called by: [`tickBonds`](#s-tickBonds) · [`applyAction`](deckacts.js.md#s-applyAction) _js/crew/deckacts.js_ · [`applyFx`](talk.js.md#s-applyFx) _js/crew/talk.js_

<!-- note:makeRivals -->
Declare a rivalry (talk trees use it when the captain takes a side).
<!-- /note -->

### <a id="s-tickBonds"></a>`tickBonds()`

function · **exported** · L55–78

- calls: [`hashRoll`](#s-hashRoll) · [`makeRivals`](#s-makeRivals) · [`tieBetween`](#s-tieBetween) · [`tiesOf`](#s-tiesOf) · [`adjustMorale`](family.js.md#s-adjustMorale) _js/crew/family.js_ ×2 · [`compat`](ledger.js.md#s-compat) _js/crew/ledger.js_ · [`crewNote`](ledger.js.md#s-crewNote) _js/crew/ledger.js_ ×2 · [`firstName`](ledger.js.md#s-firstName) _js/crew/ledger.js_ ×4 · [`rapportBetween`](ledger.js.md#s-rapportBetween) _js/crew/ledger.js_
- via [js/npc/cradle.js](../npc/cradle.js.md): `cradle.get`, `cradle.note`

<!-- note:tickBonds -->
Per cycle (crewHooks.cycle): derive m.ties, roll new rivalries, write the
friend/rival lines into the crew log, and sour a rival pair on the same watch.

- L71 · `` const key = `${a.id}:${b.id}`; `` — the moment a friendship forms, once
<!-- /note -->

### <a id="s-bondFactor"></a>`bondFactor(m, mannedKinds)`

function · **exported** · L80–96

- calls: [`bondFactor>has`](#s-bondFactor-has) ×2 · [`byId`](#s-byId) · [`tieBetween`](#s-tieBetween)
- called by: [`crewEffects`](../npc/crewfx.js.md#s-crewEffects) _js/npc/crewfx.js_

<!-- note:bondFactor -->
1 ± : +0.06 per friend on the same station this phase, −0.08 per rival there,
+0.03 with a partner aboard. `mannedKinds` is kind → [member ids or first names]
(crewfx passes ids; the interior rail's map of first names also works).
<!-- /note -->

#### <a id="s-bondFactor-has"></a>`bondFactor>has(list, o)`

function · L83–83

- calls: [`firstName`](ledger.js.md#s-firstName) _js/crew/ledger.js_
- called by: [`bondFactor`](#s-bondFactor) ×2

<!-- note:bondFactor>has -->
<!-- /note -->

### <a id="s-bondsReport"></a>`bondsReport()`

function · **exported** · L98–109

- calls: [`tieBetween`](#s-tieBetween) · [`rapportBetween`](ledger.js.md#s-rapportBetween) _js/crew/ledger.js_
- called by: [`mountBonds`](../console/panels/crew.js.md#s-mountBonds) _js/console/panels/crew.js_

<!-- note:bondsReport -->
Every pair sorted by rapport, for the BONDS tab. → [{ a, b, rapport, kind }]
<!-- /note -->

## Module-level calls

- via [js/crew/ledger.js](ledger.js.md): `crewHooks.cycle.includes`, `crewHooks.cycle.push`
