# js/npc/brain.js

[index](../../../README.md) · 138 lines · 16 symbols · 0 imports · 3 importers

## About

<!-- note:@file -->
LIVING GALAXY experimental — the neural core.

A very small network that runs live beside the game and learns two ways:

  1. Imitation. While you hold the conn, every few seconds the core looks at
     the world the way the captain would (`features()`), notes what you are
     doing (`labelFromPlay()`), and nudges its weights toward doing that in
     that situation. Fly cautious and it learns cautious.
  2. Outcome. While an NPC holds the conn, each decision is scored later
     by what happened to the ship — hull, credits, cargo, heat — and the
     weights move toward choices that paid and away from ones that hurt.

It is not the whole captain. `captain.js` pairs it with a deterministic
forecaster (roll each candidate goal 60 s forward) and, optionally, a local
SLM through `provider` (see Docs/EXPERIMENTAL_NEURAL_CORE.md). The core is
the fast reflex; the forecaster is the arithmetic; the SLM is the voice.

Plain arrays, no dependencies, serialises to JSON so it rides in the
CRADLE record of whoever it belongs to.
<!-- /note -->

## Imports

_none_

## Imported by

- [js/crew/learn.js](../crew/learn.js.md) — `createNet`, `think`, `learnOutcome`
- [js/npc/captain.js](captain.js.md) — `ACTIONS`, `N_FEATURES`, `createBrain`, `features`, `labelFromPlay`, `learnImitation`, `learnOutcome`, `think`
- test/experimental.test.mjs _(outside js/)_ — `ACTIONS`, `createBrain`, `features`, `think`, `learnImitation`, `learnOutcome`, `labelFromPlay`

## Exports

- [`ACTIONS`](#s-ACTIONS) · const — used by [js/npc/captain.js](captain.js.md), test/experimental.test.mjs
- [`N_FEATURES`](#s-N_FEATURES) · const — used by [js/npc/captain.js](captain.js.md)
- [`createNet`](#s-createNet) · function — used by [js/crew/learn.js](../crew/learn.js.md)
- [`createBrain`](#s-createBrain) · function — used by [js/npc/captain.js](captain.js.md), test/experimental.test.mjs
- [`think`](#s-think) · function — used by [js/crew/learn.js](../crew/learn.js.md), [js/npc/captain.js](captain.js.md), test/experimental.test.mjs
- [`learnImitation`](#s-learnImitation) · function — used by [js/npc/captain.js](captain.js.md), test/experimental.test.mjs
- [`learnOutcome`](#s-learnOutcome) · function — used by [js/crew/learn.js](../crew/learn.js.md), [js/npc/captain.js](captain.js.md), test/experimental.test.mjs
- [`features`](#s-features) · function — used by [js/npc/captain.js](captain.js.md), test/experimental.test.mjs
- [`labelFromPlay`](#s-labelFromPlay) · function — used by [js/npc/captain.js](captain.js.md), test/experimental.test.mjs

## Effects

_none detected_

## Symbols

### <a id="s-ACTIONS"></a>`ACTIONS`

const · **exported** · L1–1

<!-- note:ACTIONS -->
<!-- /note -->

### <a id="s-N_FEATURES"></a>`N_FEATURES`

const · **exported** · L2–2

<!-- note:N_FEATURES -->
<!-- /note -->

### <a id="s-N_HIDDEN"></a>`N_HIDDEN`

const · L3–3

<!-- note:N_HIDDEN -->
<!-- /note -->

### <a id="s-shapeOf"></a>`shapeOf(b)`

function · L5–5

- called by: [`forward`](#s-forward) · [`learnImitation`](#s-learnImitation) · [`learnOutcome`](#s-learnOutcome) · [`think`](#s-think) · [`update`](#s-update)

<!-- note:shapeOf -->
The net underneath is not specific to flying a ship. an earlier build puts a second one
on the deck (js/crew/learn.js) over what a watch decides to do with itself,
so the shapes are parameters now rather than constants. A brain written
before this change has no `nf`/`nh`/`acts` on it and reads back as the
original 16 × 12 × 6 conn core, which is what it is.
<!-- /note -->

### <a id="s-mulberry"></a>`mulberry(seedStr)`

function · L7–17

- called by: [`createNet`](#s-createNet)

<!-- note:mulberry -->
<!-- /note -->

### <a id="s-createNet"></a>`createNet({…}=)`

function · **exported** · L19–35

- calls: [`createNet>w`](#s-createNet-w) ×3 · [`mulberry`](#s-mulberry)
- called by: [`brainOf`](../crew/learn.js.md#s-brainOf) _js/crew/learn.js_ · [`createBrain`](#s-createBrain)

<!-- note:createNet -->
A fresh net of any shape, seeded so the same person starts with the same
instincts. `acts` is the label set; `nf`/`nh` the input and hidden widths.
<!-- /note -->

#### <a id="s-createNet-w"></a>`createNet>w(n)`

function · L21–21

- called by: [`createNet`](#s-createNet) ×3

<!-- note:createNet>w -->
<!-- /note -->

### <a id="s-createBrain"></a>`createBrain(seed=, traits=)`

function · **exported** · L37–46

- calls: [`createNet`](#s-createNet)
- called by: [`houseBrain`](captain.js.md#s-houseBrain) _js/npc/captain.js_ · [`inheritBrain`](captain.js.md#s-inheritBrain) _js/npc/captain.js_

<!-- note:createBrain -->
Fresh weights, seeded so the same person starts with the same instincts. Traits bias the output layer.

- L39 · `const t = traits ?? {};` — personality as prior: caution → evade/dock, greed → mine/engage, curiosity → survey
<!-- /note -->

### <a id="s-forward"></a>`forward(b, x)`

function · L48–66

- calls: [`shapeOf`](#s-shapeOf)
- called by: [`think`](#s-think) · [`update`](#s-update)

<!-- note:forward -->
<!-- /note -->

### <a id="s-think"></a>`think(b, x)`

function · **exported** · L68–71

- calls: [`forward`](#s-forward) · [`shapeOf`](#s-shapeOf)
- called by: [`habitsLearned`](../crew/learn.js.md#s-habitsLearned) _js/crew/learn.js_ · [`kindPrior`](../crew/learn.js.md#s-kindPrior) _js/crew/learn.js_ · [`decide`](captain.js.md#s-decide) _js/npc/captain.js_

<!-- note:think -->
Action probabilities for a feature vector, most likely first.
<!-- /note -->

### <a id="s-update"></a>`update(b, x, k, scale)`

function · L73–92

- calls: [`forward`](#s-forward) · [`shapeOf`](#s-shapeOf)
- called by: [`learnImitation`](#s-learnImitation) · [`learnOutcome`](#s-learnOutcome)

<!-- note:update -->
One SGD step toward `label` (imitation) or scaled by `reward` (outcome, may be negative).

- L74 · `if (!x.every(Number.isFinite)) return;` — a bad snapshot must never poison the weights
- L78 · `const dz = p.map((v, i) => v - (i === k ? 1 : 0));` — dL/dz = p - onehot
<!-- /note -->

### <a id="s-learnImitation"></a>`learnImitation(b, x, action)`

function · **exported** · L94–99

- calls: [`shapeOf`](#s-shapeOf) · [`update`](#s-update)
- called by: [`tickCaptain`](captain.js.md#s-tickCaptain) _js/npc/captain.js_

<!-- note:learnImitation -->
<!-- /note -->

### <a id="s-learnOutcome"></a>`learnOutcome(b, x, action, reward)`

function · **exported** · L101–106

- calls: [`shapeOf`](#s-shapeOf) · [`update`](#s-update)
- called by: [`coach`](../crew/learn.js.md#s-coach) _js/crew/learn.js_ · [`learnFromRecord`](../crew/learn.js.md#s-learnFromRecord) _js/crew/learn.js_ · [`tickCaptain`](captain.js.md#s-tickCaptain) _js/npc/captain.js_

<!-- note:learnOutcome -->
reward in roughly [-1, 1]; positive pulls toward the action taken, negative pushes away.
<!-- /note -->

### <a id="s-clamp01"></a>`clamp01(v)`

function · L108–108

- called by: [`features`](#s-features) ×13

<!-- note:clamp01 -->
---- the captain's view of the world ------------------------------------
<!-- /note -->

### <a id="s-features"></a>`features(s)`

function · **exported** · L110–129

- calls: [`clamp01`](#s-clamp01) ×13
- called by: [`decide`](captain.js.md#s-decide) _js/npc/captain.js_ · [`tickCaptain`](captain.js.md#s-tickCaptain) _js/npc/captain.js_

<!-- note:features -->
16 numbers in [0,1] (or [-1,1]) the core reasons over. Built from the
snapshot `captain.js` assembles: ship state, nearest port, threats, belt.
<!-- /note -->

### <a id="s-labelFromPlay"></a>`labelFromPlay(s)`

function · **exported** · L131–138

- called by: [`tickCaptain`](captain.js.md#s-tickCaptain) _js/npc/captain.js_

<!-- note:labelFromPlay -->
What the player is doing right now, as one of ACTIONS — the imitation label.
<!-- /note -->
