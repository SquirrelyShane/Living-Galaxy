# js/crew/orders.js

[index](../../../README.md) · 158 lines · 13 symbols · 10 imports · 2 importers

## About

<!-- note:@file -->
Living Galaxy — ORDERS: doing something about what a hand is carrying (0.3.53).

CON › CREW › GENOME showed nine needs, five traits, what a body was built
for and what a person had learned — and there was nothing to press. The
numbers only moved when the hand's own watch happened to choose something.

This is the captain's side of it. Each need has an ORDER, and an order is a
real watch: it goes through deckmind.stepHand exactly the way their own
choice would — the same effect table, the same efficacy off their genes and
how tired they are, a record filed in the LOG, and a step of learning. The
graph just is not asked. One order per hand per watch.

  Tiredness         STAND DOWN        → SLEEP
  Hunger            MESS CALL         → EAT_MESS
  Company           SHARE A MEAL      → SHARE_MEAL with whoever they get on with best
  Strain            EASE OFF          → EXERCISE   (docked: SHORE LEAVE, 60 cr, the real thing)
  Closeness         TIME WITH &lt;them>  → SIT_WITH their partner, if aboard; WRITE HOME if not
  Something to do   REC TIME          → PLAY_CARDS
  Grievance         HEAR THEM OUT     — not a watch: you sit down with them. The cause is still
                                        there, but for five watches it weighs 0.35 less
  Purpose           GIVE A GOAL       → STUDY, in the skill you set them to TRAIN
  Work outstanding  CLEAR THE BACKLOG → PATCH_HULL

TRAIN sets a skill a hand studies toward — up to the ceiling their body sets
and no further — and having a goal slows how fast purpose runs out.
ENCOURAGE / CURB on a LEARNED habit is a word from the captain: one step of
the same learning their own watches do, in the situation they are in now.
Temperament is genes. There is nothing to press on it, and the sheet says
what each one does instead.
<!-- /note -->

## Imports

| line | from | names | target |
|---|---|---|---|
| 1 | `./ledger.js` | `crew`, `firstName`, `rapportBetween` | [js/crew/ledger.js](ledger.js.md) |
| 2 | `../sim/sim.js` | `sim` | [js/sim/sim.js](../sim/sim.js.md) |
| 3 | `./deckmind.js` | `deckmind`, `buildContext`, `stepHand`, `bodyOf` | [js/crew/deckmind.js](deckmind.js.md) |
| 4 | `./deckacts.js` | `NEED_KEYS` | [js/crew/deckacts.js](deckacts.js.md) |
| 5 | `./bonds.js` | `tieBetween` | [js/crew/bonds.js](bonds.js.md) |
| 6 | `./deckgraph.js` | `ACTION_META` | [js/crew/deckgraph.js](deckgraph.js.md) |
| 7 | `./hull.js` | `playerHull` | [js/crew/hull.js](hull.js.md) |
| 8 | `./family.js` | `adjustMorale`, `adjustTrust` | [js/crew/family.js](family.js.md) |
| 9 | `./learn.js` | `coach`, `DECK_KINDS` | [js/crew/learn.js](learn.js.md) |
| 10 | `../careers/skills.js` | `SKILLS` | [js/careers/skills.js](../careers/skills.js.md) |

## Imported by

- [js/console/panels/crew-gene.js](../console/panels/crew-gene.js.md) — `orderFor`, `giveOrder`, `setTraining`, `coachHabit`, `ceilingOf`, `TRAIT_MEANS`
- test/orders.test.mjs _(outside js/)_ — `OR`

## Exports

- [`ORDER`](#s-ORDER) · const — **no importer in scanned roots**
- [`grievanceCauses`](#s-grievanceCauses) · function — **no importer in scanned roots**
- [`orderFor`](#s-orderFor) · function — used by [js/console/panels/crew-gene.js](../console/panels/crew-gene.js.md)
- [`ordersFor`](#s-ordersFor) · function — **no importer in scanned roots**
- [`giveOrder`](#s-giveOrder) · function — used by [js/console/panels/crew-gene.js](../console/panels/crew-gene.js.md)
- [`ceilingOf`](#s-ceilingOf) · function — used by [js/console/panels/crew-gene.js](../console/panels/crew-gene.js.md)
- [`setTraining`](#s-setTraining) · function — used by [js/console/panels/crew-gene.js](../console/panels/crew-gene.js.md)
- [`coachHabit`](#s-coachHabit) · function — used by [js/console/panels/crew-gene.js](../console/panels/crew-gene.js.md)
- [`TRAIT_MEANS`](#s-TRAIT_MEANS) · const — used by [js/console/panels/crew-gene.js](../console/panels/crew-gene.js.md)

## Effects

_none detected_

## Symbols

### <a id="s-NEED_WORD"></a>`NEED_WORD`

const · L12–15

<!-- note:NEED_WORD -->
<!-- /note -->

### <a id="s-ORDER"></a>`ORDER`

const · **exported** · L17–20

<!-- note:ORDER -->
- L18 · `shoreLeave: 60,` — cr, docked
- L19 · `hearTrust: [1, 3],` — trust a hearing earns, by loyalty
<!-- /note -->

### <a id="s-aboard"></a>`aboard(id)`

function · L22–22

- via [js/crew/ledger.js](ledger.js.md): `crew.aboard.find`
- called by: [`grievanceCauses`](#s-grievanceCauses) ×2 · [`orderFor`](#s-orderFor)

<!-- note:aboard -->
<!-- /note -->

### <a id="s-bestMate"></a>`bestMate(m)`

function · L24–32

- calls: [`rapportBetween`](ledger.js.md#s-rapportBetween) _js/crew/ledger.js_
- called by: [`orderFor`](#s-orderFor)

<!-- note:bestMate -->
Who they get on with best aboard — the company for a meal or a hand of cards.
<!-- /note -->

### <a id="s-grievanceCauses"></a>`grievanceCauses(m)`

function · **exported** · L34–44

- calls: [`playerHull`](hull.js.md#s-playerHull) _js/crew/hull.js_ · [`firstName`](ledger.js.md#s-firstName) _js/crew/ledger.js_ · [`aboard`](#s-aboard) ×2
- via [js/crew/hull.js](hull.js.md): `playerHull.state`
- called by: [`giveOrder`](#s-giveOrder) · [`orderFor`](#s-orderFor)

<!-- note:grievanceCauses -->
What is behind a grievance, in plain words.
<!-- /note -->

### <a id="s-orderFor"></a>`orderFor(m, need)`

function · **exported** · L46–75

- calls: [`firstName`](ledger.js.md#s-firstName) _js/crew/ledger.js_ ×3 · [`aboard`](#s-aboard) · [`bestMate`](#s-bestMate) · [`grievanceCauses`](#s-grievanceCauses)
- via [js/crew/ledger.js](ledger.js.md): `firstName.toUpperCase`
- called by: [`mountGenome>paint`](../console/panels/crew-gene.js.md#s-mountGenome-paint) _js/console/panels/crew-gene.js_ · [`giveOrder`](#s-giveOrder) · [`ordersFor`](#s-ordersFor)

<!-- note:orderFor -->
The order for one need, for one hand, right now.
→ { need, id, label, hint, action?, focus?, custom?, why } — `why` is set when it cannot be given.
<!-- /note -->

### <a id="s-ordersFor"></a>`ordersFor(m)`

function · **exported** · L77–77

- calls: [`orderFor`](#s-orderFor)
- via [js/crew/deckacts.js](deckacts.js.md): `NEED_KEYS.map`, `NEED_KEYS.map.filter`

<!-- note:ordersFor -->
Every order for this hand, in the sheet's order.
<!-- /note -->

### <a id="s-focusEntry"></a>`focusEntry(m, o)`

function · L79–81

- calls: [`tieBetween`](bonds.js.md#s-tieBetween) _js/crew/bonds.js_ · [`rapportBetween`](ledger.js.md#s-rapportBetween) _js/crew/ledger.js_
- called by: [`giveOrder`](#s-giveOrder)

<!-- note:focusEntry -->
---- giving one ------------------------------------------------------------
<!-- /note -->

### <a id="s-giveOrder"></a>`giveOrder(m, need)`

function · **exported** · L83–126

- calls: [`buildContext`](deckmind.js.md#s-buildContext) _js/crew/deckmind.js_ ×2 · [`stepHand`](deckmind.js.md#s-stepHand) _js/crew/deckmind.js_ · [`adjustMorale`](family.js.md#s-adjustMorale) _js/crew/family.js_ ×2 · [`adjustTrust`](family.js.md#s-adjustTrust) _js/crew/family.js_ · [`firstName`](ledger.js.md#s-firstName) _js/crew/ledger.js_ · [`focusEntry`](#s-focusEntry) · [`grievanceCauses`](#s-grievanceCauses) · [`orderFor`](#s-orderFor)
- via [js/crew/ledger.js](ledger.js.md): `crew.aboard.includes`
- called by: [`mountGenome>paint`](../console/panels/crew-gene.js.md#s-mountGenome-paint) _js/console/panels/crew-gene.js_

<!-- note:giveOrder -->
Give the order for `need`. → { ok, why?, line, rec? }
A watch order is filed in their LOG like any other watch.

- L96 · `buildContext(m, { peek: true });` — refresh the computed grievance now
<!-- /note -->

### <a id="s-ceilingOf"></a>`ceilingOf(m, skill)`

function · **exported** · L128–131

- calls: [`bodyOf`](deckmind.js.md#s-bodyOf) _js/crew/deckmind.js_
- called by: [`mountGenome>paint`](../console/panels/crew-gene.js.md#s-mountGenome-paint) _js/console/panels/crew-gene.js_

<!-- note:ceilingOf -->
---- aptitude ---------------------------------------------------------------

The ceiling their body sets on a skill, 0..100.
<!-- /note -->

### <a id="s-setTraining"></a>`setTraining(m, skill)`

function · **exported** · L133–137

- calls: [`bodyOf`](deckmind.js.md#s-bodyOf) _js/crew/deckmind.js_
- called by: [`mountGenome>paint`](../console/panels/crew-gene.js.md#s-mountGenome-paint) _js/console/panels/crew-gene.js_

<!-- note:setTraining -->
Set (or clear, with null / the same skill again) what they study toward.
<!-- /note -->

### <a id="s-coachHabit"></a>`coachHabit(m, kind, sign)`

function · **exported** · L139–150

- calls: [`buildContext`](deckmind.js.md#s-buildContext) _js/crew/deckmind.js_ · [`adjustMorale`](family.js.md#s-adjustMorale) _js/crew/family.js_ · [`adjustTrust`](family.js.md#s-adjustTrust) _js/crew/family.js_ · [`coach`](learn.js.md#s-coach) _js/crew/learn.js_ · [`firstName`](ledger.js.md#s-firstName) _js/crew/ledger.js_
- via [js/crew/learn.js](learn.js.md): `DECK_KINDS.includes`
- called by: [`mountGenome>paint`](../console/panels/crew-gene.js.md#s-mountGenome-paint) _js/console/panels/crew-gene.js_ ×2

<!-- note:coachHabit -->
---- learned habits ----------------------------------------------------------

ENCOURAGE (+1) or CURB (−1) a habit: one step of their own learning, in the
situation they are in now. Once per habit per watch. → { ok, why?, line }

- L148 · `if ((m.traits?.loyalty ?? 0.5) < 0.6) adjustMorale(m, -1);` — a loyal hand takes a correction; anybody else takes it personally
<!-- /note -->

### <a id="s-TRAIT_MEANS"></a>`TRAIT_MEANS`

const · **exported** · L152–158

<!-- note:TRAIT_MEANS -->
What each temperament axis does aboard — genes, so the sheet explains instead.
<!-- /note -->
