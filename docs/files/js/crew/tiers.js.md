# js/crew/tiers.js

[index](../../../README.md) · 86 lines · 15 symbols · 4 imports · 3 importers

## About

<!-- note:@file -->
LIVING GALAXY — three tracks, named.

The deck already ran three separate relationships and only one of them had
a vocabulary. Romance has had a named ladder earlier —
strangers → noticed → interested → courting → together → bonded — and it
reads well because the rungs are things you can point at. The other two were
bare numbers: `rapportBetween()` returns 0..100 and `m.morale` returns 0..100,
and a number is not a relationship, it is a readout of one.

So: the same treatment for both.

  FRIEND   wary → civil → shipmate → friend → confidant → sworn
  MORALE   broken → sullen → steady → willing → high → fireproof

Tiers are not decoration. Each one gates what a hand will talk to you about
(`tierGate` below, which talk-trees and the wants list read), which is the
point: a shipmate does not tell you what they are carrying, and a confidant
does. And each one is a THRESHOLD with hysteresis, so a hand who has just
become a friend does not flicker back to shipmate on one bad watch.
<!-- /note -->

## Imports

| line | from | names | target |
|---|---|---|---|
| 1 | `./ledger.js` | `crew`, `rapportBetween` | [js/crew/ledger.js](ledger.js.md) |
| 2 | `./family.js` | `trustOf` | [js/crew/family.js](family.js.md) |
| 3 | `./romance.js` | `STAGES`, `STAGE_LABEL`, `stageIndex`, `MIN_ATTRACTION`, `attraction` | [js/crew/romance.js](romance.js.md) |
| 4 | `./family.js` | `couldCourt`, `playerAsPerson` | [js/crew/family.js](family.js.md) |

## Imported by

- [js/console/panels/crew.js](../console/panels/crew.js.md) — `tiersOf`
- [js/crew/talk.js](talk.js.md) — `FRIEND_TIERS`, `FRIEND_INDEX`, `MORALE_INDEX`, `friendTier`, `tierGate`, `tiersOf`
- test/systems.test.mjs _(outside js/)_ — `T`

## Exports

- [`FRIEND_TIERS`](#s-FRIEND_TIERS) · const — used by [js/crew/talk.js](talk.js.md)
- [`MORALE_TIERS`](#s-MORALE_TIERS) · const — **no importer in scanned roots**
- [`friendTier`](#s-friendTier) · function — used by [js/crew/talk.js](talk.js.md)
- [`friendTierBetween`](#s-friendTierBetween) · function — **no importer in scanned roots**
- [`moraleTier`](#s-moraleTier) · function — **no importer in scanned roots**
- [`romanceTier`](#s-romanceTier) · function — **no importer in scanned roots**
- [`tiersOf`](#s-tiersOf) · function — used by [js/console/panels/crew.js](../console/panels/crew.js.md), [js/crew/talk.js](talk.js.md)
- [`FRIEND_INDEX`](#s-FRIEND_INDEX) · function — used by [js/crew/talk.js](talk.js.md)
- [`MORALE_INDEX`](#s-MORALE_INDEX) · function — used by [js/crew/talk.js](talk.js.md)
- [`tierGate`](#s-tierGate) · function — used by [js/crew/talk.js](talk.js.md)
- [`tierLine`](#s-tierLine) · function — **no importer in scanned roots**
- [`tierReport`](#s-tierReport) · function — **no importer in scanned roots**

## Effects

_none detected_

## Symbols

### <a id="s-FRIEND_TIERS"></a>`FRIEND_TIERS`

const · **exported** · L6–13

<!-- note:FRIEND_TIERS -->
---- the two new ladders ---------------------------------------------------
<!-- /note -->

### <a id="s-MORALE_TIERS"></a>`MORALE_TIERS`

const · **exported** · L15–22

<!-- note:MORALE_TIERS -->
<!-- /note -->

### <a id="s-HYSTERESIS"></a>`HYSTERESIS`

const · L24–24

<!-- note:HYSTERESIS -->
A tier you have just entered holds until you fall this far back under it —
without it, a hand sitting on a boundary reads as two different people on
alternate frames.
<!-- /note -->

### <a id="s-tierOf"></a>`tierOf(ladder, value, held)`

function · L26–34

- called by: [`friendTier`](#s-friendTier) · [`friendTierBetween`](#s-friendTierBetween) · [`moraleTier`](#s-moraleTier)

<!-- note:tierOf -->
<!-- /note -->

### <a id="s-friendTier"></a>`friendTier(m)`

function · **exported** · L36–40

- calls: [`trustOf`](family.js.md#s-trustOf) _js/crew/family.js_ · [`tierOf`](#s-tierOf)
- called by: [`tierOf`](talk.js.md#s-tierOf) _js/crew/talk.js_ · [`tierGate`](#s-tierGate) · [`tiersOf`](#s-tiersOf)

<!-- note:friendTier -->
The friendship tier between the captain and a hand — trust is the captain's rapport.
<!-- /note -->

### <a id="s-friendTierBetween"></a>`friendTierBetween(a, b)`

function · **exported** · L42–44

- calls: [`rapportBetween`](ledger.js.md#s-rapportBetween) _js/crew/ledger.js_ · [`tierOf`](#s-tierOf)

<!-- note:friendTierBetween -->
The friendship tier between two hands.
<!-- /note -->

### <a id="s-moraleTier"></a>`moraleTier(m)`

function · **exported** · L46–50

- calls: [`tierOf`](#s-tierOf)
- called by: [`tierGate`](#s-tierGate) · [`tiersOf`](#s-tiersOf)

<!-- note:moraleTier -->
<!-- /note -->

### <a id="s-romanceTier"></a>`romanceTier(m)`

function · **exported** · L52–62

- calls: [`couldCourt`](family.js.md#s-couldCourt) _js/crew/family.js_ · [`playerAsPerson`](family.js.md#s-playerAsPerson) _js/crew/family.js_ · [`trustOf`](family.js.md#s-trustOf) _js/crew/family.js_ ×2 · [`attraction`](romance.js.md#s-attraction) _js/crew/romance.js_ · [`romanceTier>rung`](#s-romanceTier-rung) ×6
- called by: [`tierGate`](#s-tierGate) · [`tiersOf`](#s-tiersOf)

<!-- note:romanceTier -->
The romantic rung between the captain and a hand.

earlier ladder runs between two CREW, and the captain is not on the crew
ladder — so this reads the same rungs off what the game actually tracks for
you: whether you are together, whether they would say yes if you asked, and
whether there is a draw there at all.
<!-- /note -->

#### <a id="s-romanceTier-rung"></a>`romanceTier>rung(id, note)`

function · L53–53

- calls: [`stageIndex`](romance.js.md#s-stageIndex) _js/crew/romance.js_
- called by: [`romanceTier`](#s-romanceTier) ×6

<!-- note:romanceTier>rung -->
<!-- /note -->

### <a id="s-tiersOf"></a>`tiersOf(m)`

function · **exported** · L64–66

- calls: [`friendTier`](#s-friendTier) · [`moraleTier`](#s-moraleTier) · [`romanceTier`](#s-romanceTier)
- called by: [`rosterCard`](../console/panels/crew.js.md#s-rosterCard) _js/console/panels/crew.js_ · [`gate`](talk.js.md#s-gate) _js/crew/talk.js_ · [`tierLine`](#s-tierLine) · [`tierReport`](#s-tierReport)

<!-- note:tiersOf -->
All three at once, which is how a crew sheet should read them: one person,
three separate things you are to them.
<!-- /note -->

### <a id="s-FRIEND_INDEX"></a>`FRIEND_INDEX(id)`

function · **exported** · L68–68

- called by: [`TIERS`](talk.js.md#s-TIERS) _js/crew/talk.js_ · [`TIER_NAMES`](talk.js.md#s-TIER_NAMES) _js/crew/talk.js_ · [`tierOf`](talk.js.md#s-tierOf) _js/crew/talk.js_ ×2 · [`tierGate`](#s-tierGate) ×2

<!-- note:FRIEND_INDEX -->
<!-- /note -->

### <a id="s-MORALE_INDEX"></a>`MORALE_INDEX(id)`

function · **exported** · L69–69

- called by: [`gate`](talk.js.md#s-gate) _js/crew/talk.js_ ×2 · [`tierGate`](#s-tierGate) ×2

<!-- note:MORALE_INDEX -->
<!-- /note -->

### <a id="s-tierGate"></a>`tierGate(m, need=)`

function · **exported** · L71–77

- calls: [`stageIndex`](romance.js.md#s-stageIndex) _js/crew/romance.js_ · [`FRIEND_INDEX`](#s-FRIEND_INDEX) ×2 · [`friendTier`](#s-friendTier) · [`MORALE_INDEX`](#s-MORALE_INDEX) ×2 · [`moraleTier`](#s-moraleTier) · [`romanceTier`](#s-romanceTier)
- via [js/crew/romance.js](romance.js.md): `STAGES.indexOf`
- called by: [`gate`](talk.js.md#s-gate) _js/crew/talk.js_

<!-- note:tierGate -->
Does this hand talk to you about `need`?

This is what makes the tiers matter rather than describe. A topic declares
the friendship rung it wants and the mood it needs; below either, the hand
has an answer but it is not that answer.

  tierGate(m, { friend: "friend" })          — only a friend will
  tierGate(m, { morale: "steady" })          — not while they are sullen
  tierGate(m, { romance: "courting" })       — and not before that
<!-- /note -->

### <a id="s-tierLine"></a>`tierLine(m)`

function · **exported** · L79–82

- calls: [`tiersOf`](#s-tiersOf)

<!-- note:tierLine -->
"Shipmate · Willing · noticed" — one line for a roster row.
<!-- /note -->

### <a id="s-tierReport"></a>`tierReport()`

function · **exported** · L84–86

- calls: [`tiersOf`](#s-tiersOf)
- via [js/crew/ledger.js](ledger.js.md): `crew.aboard.filter`, `crew.aboard.filter.map`

<!-- note:tierReport -->
Everyone aboard, by all three tracks — for the CREW panel and the tests.
<!-- /note -->
