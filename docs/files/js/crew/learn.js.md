# js/crew/learn.js

[index](../../../README.md) · 185 lines · 22 symbols · 2 imports · 6 importers

## About

<!-- note:@file -->
Living Galaxy — the DECK BRAIN: a hand learning what works for them.

`npc/brain.js` already taught an NPC captain how to fly, two ways: imitation
while you hold the conn, and outcome once they do. Nothing taught anybody
how to *live* on a ship. an earlier patch changed that by accident — deckmind writes a
full record of every decision, which is exactly a training pair: the
situation that was observed, the kind of thing that was done about it, and
what measurably happened next.

So this is the same small net over a different question. Nine needs, morale,
the hull and the room, in; nine categories of thing-to-do, out. It is
trained purely by outcome, from the deltas the effect table actually
applied — not from a designer's opinion about what a good watch looks like.
A hand who found that arguing always went badly argues less. A hand who
found that a drink fixed the watch keeps drinking.

It is a PRIOR, never a decision. The graph still decides; this only leans on
the weights, and only in proportion to how much the person has actually
lived through (`confidenceOf`). A brand-new hand behaves exactly as they did
earlier, because a net with no outcomes on it multiplies everything by one.

The corpus it learns from is also the corpus a real model would want:
`trainingCorpus()` writes it out as JSONL for the llama.cpp side of the
house (`llamaCaptainProvider`, Docs/EXPERIMENTAL_NEURAL_CORE.md).

- L10 · `const nets = new Map();` — member id → net
<!-- /note -->

## Imports

| line | from | names | target |
|---|---|---|---|
| 1 | `../npc/brain.js` | `createNet`, `think`, `learnOutcome` | [js/npc/brain.js](../npc/brain.js.md) |
| 2 | `../npc/cradle.js` | `cradle` | [js/npc/cradle.js](../npc/cradle.js.md) |

## Imported by

- [js/console/panels/crew-gene.js](../console/panels/crew-gene.js.md) — `habitsLearned`, `learnedLine`, `confidenceOf`, `trainingCorpus`, `DECK_KINDS`
- [js/crew/deckgraph.js](deckgraph.js.md) — `kindPrior`
- [js/crew/deckmind.js](deckmind.js.md) — `learnFromRecord`, `forgetBrain`
- [js/crew/orders.js](orders.js.md) — `coach`, `DECK_KINDS`
- test/orders.test.mjs _(outside js/)_ — `habitsLearned`
- test/skycrew.test.mjs _(outside js/)_ — `DECK_KINDS`, `brainOf`, `confidenceOf`, `deckFeatures`, `featuresFromRecord`, `kindPrior`, `scoreRecord`, `habitsLearned`, `learnedLine`, `trainingCorpus`, `PRIOR_SPAN`, `N_DECK_FEATURES`

## Exports

- [`DECK_KINDS`](#s-DECK_KINDS) · const — used by [js/console/panels/crew-gene.js](../console/panels/crew-gene.js.md), [js/crew/orders.js](orders.js.md), test/skycrew.test.mjs
- [`N_DECK_FEATURES`](#s-N_DECK_FEATURES) · const — used by test/skycrew.test.mjs
- [`FULL_CONFIDENCE`](#s-FULL_CONFIDENCE) · const — **no importer in scanned roots**
- [`PRIOR_SPAN`](#s-PRIOR_SPAN) · const — used by test/skycrew.test.mjs
- [`brainOf`](#s-brainOf) · function — used by test/skycrew.test.mjs
- [`confidenceOf`](#s-confidenceOf) · function — used by [js/console/panels/crew-gene.js](../console/panels/crew-gene.js.md), test/skycrew.test.mjs
- [`forgetBrain`](#s-forgetBrain) · function — used by [js/crew/deckmind.js](deckmind.js.md)
- [`deckFeatures`](#s-deckFeatures) · function — used by test/skycrew.test.mjs
- [`kindPrior`](#s-kindPrior) · function — used by [js/crew/deckgraph.js](deckgraph.js.md), test/skycrew.test.mjs
- [`scoreRecord`](#s-scoreRecord) · function — used by test/skycrew.test.mjs
- [`learnFromRecord`](#s-learnFromRecord) · function — used by [js/crew/deckmind.js](deckmind.js.md)
- [`COACH_STEPS`](#s-COACH_STEPS) · const — **no importer in scanned roots**
- [`coach`](#s-coach) · function — used by [js/crew/orders.js](orders.js.md)
- [`habitsLearned`](#s-habitsLearned) · function — used by [js/console/panels/crew-gene.js](../console/panels/crew-gene.js.md), test/orders.test.mjs, test/skycrew.test.mjs
- [`learnedLine`](#s-learnedLine) · function — used by [js/console/panels/crew-gene.js](../console/panels/crew-gene.js.md), test/skycrew.test.mjs
- [`trainingCorpus`](#s-trainingCorpus) · function — used by [js/console/panels/crew-gene.js](../console/panels/crew-gene.js.md), test/skycrew.test.mjs
- [`featuresFromRecord`](#s-featuresFromRecord) · function — used by test/skycrew.test.mjs

## Effects

_none detected_

## Symbols

### <a id="s-DECK_KINDS"></a>`DECK_KINDS`

const · **exported** · L4–4

<!-- note:DECK_KINDS -->
The categories the deck graph's actions fall into. Must cover ACTION_META.
<!-- /note -->

### <a id="s-N_DECK_FEATURES"></a>`N_DECK_FEATURES`

const · **exported** · L5–5

<!-- note:N_DECK_FEATURES -->
<!-- /note -->

### <a id="s-FULL_CONFIDENCE"></a>`FULL_CONFIDENCE`

const · **exported** · L7–7

<!-- note:FULL_CONFIDENCE -->
How much lived experience before the prior is trusted completely.
<!-- /note -->

### <a id="s-PRIOR_SPAN"></a>`PRIOR_SPAN`

const · **exported** · L8–8

<!-- note:PRIOR_SPAN -->
The furthest a fully-trained prior may move an option's weight.
<!-- /note -->

### <a id="s-nets"></a>`nets`

const · L10–10

<!-- note:nets -->
<!-- /note -->

### <a id="s-clamp01"></a>`clamp01(v)`

function · L11–11

- called by: [`confidenceOf`](#s-confidenceOf) · [`deckFeatures`](#s-deckFeatures) ×14 · [`featuresFromRecord`](#s-featuresFromRecord) ×14

<!-- note:clamp01 -->
<!-- /note -->

### <a id="s-r4"></a>`r4(v)`

function · L12–12

<!-- note:r4 -->
<!-- /note -->

### <a id="s-brainOf"></a>`brainOf(m)`

function · **exported** · L14–37

- calls: [`brainOf>bias`](#s-brainOf-bias) ×6 · [`createNet`](../npc/brain.js.md#s-createNet) _js/npc/brain.js_
- via [js/npc/cradle.js](../npc/cradle.js.md): `cradle.get`
- called by: [`coach`](#s-coach) · [`habitsLearned`](#s-habitsLearned) · [`kindPrior`](#s-kindPrior) · [`learnFromRecord`](#s-learnFromRecord)

<!-- note:brainOf -->
---- the net --------------------------------------------------------------

This hand's deck brain, restored from the ledger if they have one on file.

- L26 · `const t = m.traits ?? {};` — temperament as the starting prior: the same idea brain.js uses for the
  conn, pointed at the deck. Nobody starts blank — they start themselves.
<!-- /note -->

#### <a id="s-brainOf-bias"></a>`brainOf>bias(kind, v)`

function · L27–27

- called by: [`brainOf`](#s-brainOf) ×6

<!-- note:brainOf>bias -->
<!-- /note -->

### <a id="s-confidenceOf"></a>`confidenceOf(m)`

function · **exported** · L39–42

- calls: [`clamp01`](#s-clamp01)
- via [js/npc/cradle.js](../npc/cradle.js.md): `cradle.get`
- called by: [`mountGenome>paint`](../console/panels/crew-gene.js.md#s-mountGenome-paint) _js/console/panels/crew-gene.js_ · [`kindPrior`](#s-kindPrior) · [`learnedLine`](#s-learnedLine)

<!-- note:confidenceOf -->
0..1 — how much this hand has actually lived through.
<!-- /note -->

### <a id="s-forgetBrain"></a>`forgetBrain(id)`

function · **exported** · L44–44

- called by: [`clearBodies`](deckmind.js.md#s-clearBodies) _js/crew/deckmind.js_ · [`forgetBody`](deckmind.js.md#s-forgetBody) _js/crew/deckmind.js_ · [`reset`](deckmind.js.md#s-reset) _js/crew/deckmind.js_

<!-- note:forgetBrain -->
<!-- /note -->

### <a id="s-deckFeatures"></a>`deckFeatures(ctx)`

function · **exported** · L46–61

- calls: [`clamp01`](#s-clamp01) ×14
- called by: [`coach`](#s-coach) · [`habitsLearned`](#s-habitsLearned) · [`kindPrior`](#s-kindPrior) · [`learnFromRecord`](#s-learnFromRecord)

<!-- note:deckFeatures -->
---- what the net looks at ------------------------------------------------

16 numbers in [0,1]. The situation, as a hand on a deck perceives it.
<!-- /note -->

### <a id="s-kindPrior"></a>`kindPrior(ctx, kind)`

function · **exported** · L63–77

- calls: [`brainOf`](#s-brainOf) · [`confidenceOf`](#s-confidenceOf) · [`deckFeatures`](#s-deckFeatures) · [`think`](../npc/brain.js.md#s-think) _js/npc/brain.js_
- via [js/npc/brain.js](../npc/brain.js.md): `think.map`
- called by: [`weight`](deckgraph.js.md#s-weight) _js/crew/deckgraph.js_

<!-- note:kindPrior -->
---- the prior ------------------------------------------------------------

A multiplier for one option's weight, given what this hand has learned.
Uniform (1) until they have lived through something; never outside
PRIOR_SPAN, so a learned habit bends a decision and never makes it.
<!-- /note -->

### <a id="s-scoreRecord"></a>`scoreRecord(rec)`

function · **exported** · L79–95

- called by: [`learnFromRecord`](#s-learnFromRecord) · [`trainingCorpus`](#s-trainingCorpus)

<!-- note:scoreRecord -->
---- learning from what happened ------------------------------------------

How well that went, roughly −1…1. Everything here comes off the record's own
deltas — the effect table's numbers, not a judgement about the action.

  what it did to them          morale or condition, and relief on the need
                               that was loudest going in
  what it cost them            stress picked up
  what it did to the room      rapport moved, either way
  whether it worked at all     a blocked action is a small negative

- L91 · `const st = rec.effectOnHoldings?.standing;` — standing with the captain is a real payoff to a hand, and it is the only
  thing that makes a watch worth more than an hour in the mess
<!-- /note -->

### <a id="s-learnFromRecord"></a>`learnFromRecord(ctx, rec)`

function · **exported** · L97–108

- calls: [`brainOf`](#s-brainOf) · [`deckFeatures`](#s-deckFeatures) · [`mirror`](#s-mirror) · [`scoreRecord`](#s-scoreRecord) · [`learnOutcome`](../npc/brain.js.md#s-learnOutcome) _js/npc/brain.js_
- called by: [`stepHand`](deckmind.js.md#s-stepHand) _js/crew/deckmind.js_

<!-- note:learnFromRecord -->
One training step from one filed record. Called by deckmind the moment the
record is written, so the pair is the situation that was actually observed
and the effect that was actually applied.

- L103 · `net.mean = net.mean == null ? reward : net.mean + (reward - net.mean) * 0.06;` — Learn against the person's own running average, not against zero. Almost
  everything a hand does on a good ship pays a little, so an uncentred
  reward pushes every category up and the net stays flat and useless. What
  matters is whether THIS went better than their days usually go.
<!-- /note -->

### <a id="s-COACH_STEPS"></a>`COACH_STEPS`

const · **exported** · L110–110

<!-- note:COACH_STEPS -->
0.3.53 — a word from the captain about one kind of thing (js/crew/orders.js):
one step of the same learning, in the situation they are in now, and the
brain written back to the ledger straight away.
<!-- /note -->

### <a id="s-coach"></a>`coach(m, ctx, kind, reward)`

function · **exported** · L111–120

- calls: [`brainOf`](#s-brainOf) · [`deckFeatures`](#s-deckFeatures) · [`mirror`](#s-mirror) · [`learnOutcome`](../npc/brain.js.md#s-learnOutcome) _js/npc/brain.js_
- called by: [`coachHabit`](orders.js.md#s-coachHabit) _js/crew/orders.js_

<!-- note:coach -->
- L114 · `const x = ctx?._deckX ?? deckFeatures(ctx);` — a word from the captain lands harder than one watch's outcome — four
  steps of it — but counts as one thing lived through, not four
<!-- /note -->

### <a id="s-mirror"></a>`mirror(m, net, force=)`

function · L122–132

- via [js/npc/cradle.js](../npc/cradle.js.md): `cradle.get`, `cradle.put`
- called by: [`coach`](#s-coach) · [`learnFromRecord`](#s-learnFromRecord)

<!-- note:mirror -->
Weights ride in the CRADLE record of whoever they belong to, the same way
the conn core does — but only for people who are actually on the ledger. A
provisional NPC hand's brain lives and dies with the run, which is the
right trade: it costs nothing and nobody will ever ask about it.

- L125 · `if (!force && (net.outcomes ?? 0) % 8) return;` — not every step — this serialises
<!-- /note -->

### <a id="s-habitsLearned"></a>`habitsLearned(m, ctx=)`

function · **exported** · L134–139

- calls: [`brainOf`](#s-brainOf) · [`deckFeatures`](#s-deckFeatures) · [`think`](../npc/brain.js.md#s-think) _js/npc/brain.js_
- via [js/npc/brain.js](../npc/brain.js.md): `think.map`
- called by: [`mountGenome>paint`](../console/panels/crew-gene.js.md#s-mountGenome-paint) _js/console/panels/crew-gene.js_ · [`learnedLine`](#s-learnedLine)

<!-- note:habitsLearned -->
---- reading it back ------------------------------------------------------

[{ kind, p }] — what this hand has come to believe, most likely first.
<!-- /note -->

### <a id="s-learnedLine"></a>`learnedLine(m)`

function · **exported** · L141–147

- calls: [`confidenceOf`](#s-confidenceOf) · [`habitsLearned`](#s-habitsLearned)
- called by: [`mountGenome>paint`](../console/panels/crew-gene.js.md#s-mountGenome-paint) _js/console/panels/crew-gene.js_

<!-- note:learnedLine -->
One line of it, for the crew sheet.
<!-- /note -->

### <a id="s-trainingCorpus"></a>`trainingCorpus(records, {…}=)`

function · **exported** · L149–167

- calls: [`featuresFromRecord`](#s-featuresFromRecord) · [`scoreRecord`](#s-scoreRecord)
- called by: [`mountLog`](../console/panels/crew-gene.js.md#s-mountLog) _js/console/panels/crew-gene.js_

<!-- note:trainingCorpus -->
The whole corpus as JSONL, one filed decision per line. This is the shape a
local model wants: the observation, the label, the reward, and the sentence
a person would have written. Feed it to the llama.cpp side, or read it
yourself — it is the only honest account of what the crew have been doing.
<!-- /note -->

### <a id="s-featuresFromRecord"></a>`featuresFromRecord(rec)`

function · **exported** · L169–185

- calls: [`clamp01`](#s-clamp01) ×14
- called by: [`trainingCorpus`](#s-trainingCorpus)

<!-- note:featuresFromRecord -->
The same 16 numbers, recovered from a record rather than a live context.
<!-- /note -->
