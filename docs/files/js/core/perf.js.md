# js/core/perf.js

[index](../../../README.md) · 115 lines · 20 symbols · 0 imports · 10 importers

## About

<!-- note:@file -->
LIVING GALAXY — the frame budget.

The sky got busier: hulls that really cross open space instead of
teleporting through a lane, security that answers a distress call, rogue
drones that come in waves. All of that is work per frame, and the device
this is played on is a phone under Termux, not a desk.

So nothing here is a fixed number. The budget measures what a frame
actually costs and hands out a TIER; every busy system asks the tier how
much it may do this frame and trims the far field first. The player's
immediate surroundings are never what gets cut — a hull inside sensor
range is stepped in full at every tier, because that is the one the
player is looking at and shooting at.

  tier 3  rich     everything, full far-field cadence
  tier 2  normal   far field on a slower cadence
  tier 1  lean     far field coarse, waves smaller
  tier 0  survival — near field only, far field on a crawl

The measurement is a long median, not an average: one 400 ms hitch while
the browser builds a station mesh must not drop the whole sky a tier, and
a median over 90 frames rides straight over it. Coming back UP is slower
than going down (a tier must hold for RECOVER_S before it is handed back),
so the sky does not oscillate between two tiers on a marginal device.

- L3 · `const WINDOW = 90;` — frames in the median window (~1.5 s at 60fps)
- L4 · `const DROP_MS = [0, 15.5, 19.5, 26.0];` — median frame cost that forces a drop TO index-1
- L5 · `const RECOVER_S = 6;` — a better median must hold this long before the tier is handed back
- L6 · `const SETTLE_S = 2.5;` — grace after a sky change before any of this bites
<!-- /note -->

## Imports

_none_

## Imported by

- [js/npc/combat.js](../npc/combat.js.md) — `perf`, `tracerGate`
- [js/npc/flow.js](../npc/flow.js.md) — `perf`
- [js/npc/rogues.js](../npc/rogues.js.md) — `waveCap`, `perf`
- [js/npc/security.js](../npc/security.js.md) — `waveCap`
- [js/npc/traffic.js](../npc/traffic.js.md) — `perf`, `farBudget`
- [js/render/engine.js](../render/engine.js.md) — `notePerf`, `perf`
- [js/render/holefx.js](../render/holefx.js.md) — `perf`
- [js/render/postfx.js](../render/postfx.js.md) — `perf`
- [js/sim/sim.js](../sim/sim.js.md) — `resetPerf`, `notePerf`, `perf`, `perfReport`
- test/reactive.test.mjs _(outside js/)_ — `perf`, `notePerf`, `resetPerf`, `lockPerfTier`, `farBudget`, `waveCap`, `perfReport`

## Exports

- [`TIERS`](#s-TIERS) · const — **no importer in scanned roots**
- [`perf`](#s-perf) · const — used by [js/npc/combat.js](../npc/combat.js.md), [js/npc/flow.js](../npc/flow.js.md), [js/npc/rogues.js](../npc/rogues.js.md), [js/npc/traffic.js](../npc/traffic.js.md), [js/render/engine.js](../render/engine.js.md), [js/render/holefx.js](../render/holefx.js.md), [js/render/postfx.js](../render/postfx.js.md), [js/sim/sim.js](../sim/sim.js.md), test/reactive.test.mjs
- [`resetPerf`](#s-resetPerf) · function — used by [js/sim/sim.js](../sim/sim.js.md), test/reactive.test.mjs
- [`notePerf`](#s-notePerf) · function — used by [js/render/engine.js](../render/engine.js.md), [js/sim/sim.js](../sim/sim.js.md), test/reactive.test.mjs
- [`farBudget`](#s-farBudget) · function — used by [js/npc/traffic.js](../npc/traffic.js.md), test/reactive.test.mjs
- [`waveCap`](#s-waveCap) · function — used by [js/npc/rogues.js](../npc/rogues.js.md), [js/npc/security.js](../npc/security.js.md), test/reactive.test.mjs
- [`tracerGate`](#s-tracerGate) · function — used by [js/npc/combat.js](../npc/combat.js.md)
- [`perfReport`](#s-perfReport) · function — used by [js/sim/sim.js](../sim/sim.js.md), test/reactive.test.mjs
- [`lockPerfTier`](#s-lockPerfTier) · function — used by test/reactive.test.mjs

## Effects

_none detected_

## Symbols

### <a id="s-TIERS"></a>`TIERS`

const · **exported** · L1–1

<!-- note:TIERS -->
<!-- /note -->

### <a id="s-WINDOW"></a>`WINDOW`

const · L3–3

<!-- note:WINDOW -->
<!-- /note -->

### <a id="s-DROP_MS"></a>`DROP_MS`

const · L4–4

<!-- note:DROP_MS -->
<!-- /note -->

### <a id="s-RECOVER_S"></a>`RECOVER_S`

const · L5–5

<!-- note:RECOVER_S -->
<!-- /note -->

### <a id="s-SETTLE_S"></a>`SETTLE_S`

const · L6–6

<!-- note:SETTLE_S -->
<!-- /note -->

### <a id="s-perf"></a>`perf`

const · **exported** · L8–18

<!-- note:perf -->
- L10 · `ms: 0,` — the current median frame cost
- L11 · `worst: 0,` — worst frame in the window
- L14 · `since: 0,` — seconds the measurement has wanted a different tier
- L16 · `locked: null,` — set a number to pin the tier (the console's override)
- L17 · `budget: { farStride: 1, farHulls: 9999, waveMax: 12, tracerK: 1 },` — what the tier bought, for the console readout
<!-- /note -->

### <a id="s-ring"></a>`ring`

const · L20–20

<!-- note:ring -->
<!-- /note -->

### <a id="s-ringN"></a>`ringN`

const · L21–21

<!-- note:ringN -->
<!-- /note -->

### <a id="s-ringAt"></a>`ringAt`

const · L22–22

<!-- note:ringAt -->
<!-- /note -->

### <a id="s-sorted"></a>`sorted`

const · L23–23

<!-- note:sorted -->
<!-- /note -->

### <a id="s-resetPerf"></a>`resetPerf()`

function · **exported** · L25–33

- calls: [`applyTier`](#s-applyTier)
- called by: [`loadSky`](../sim/sim.js.md#s-loadSky) _js/sim/sim.js_

<!-- note:resetPerf -->
Call once per sky change: give the device a moment before judging it.
<!-- /note -->

### <a id="s-median"></a>`median()`

function · L35–41

- called by: [`notePerf`](#s-notePerf)

<!-- note:median -->
<!-- /note -->

### <a id="s-applyTier"></a>`applyTier()`

function · L43–49

- called by: [`@file`](#) · [`lockPerfTier`](#s-lockPerfTier) · [`notePerf`](#s-notePerf) ×3 · [`resetPerf`](#s-resetPerf)

<!-- note:applyTier -->
- L45 · `perf.budget.farStride = t >= 3 ? 1 : t === 2 ? 2 : t === 1 ? 4 : 8;` — farStride: a far-field hull is fully stepped one frame in N, and coasts
  on its own velocity the rest. tracerK scales cosmetic rounds.
<!-- /note -->

### <a id="s-notePerf"></a>`notePerf(ms, dt)`

function · **exported** · L51–82

- calls: [`applyTier`](#s-applyTier) ×3 · [`median`](#s-median) · [`notePerf>floorFor`](#s-notePerf-floorFor) ×2
- called by: [`mountGame>tick`](../render/engine.js.md#s-mountGame-tick) _js/render/engine.js_

<!-- note:notePerf -->
One frame's wall cost in milliseconds. Call from the render loop with the
real elapsed time, before the sim tick — `dt * 1000` is exactly right.

- L53 · `if (ms > 250) return perf.tier;` — a paused tab hands back a two-second frame; that is not the GPU's fault
- L73 · `if (perf.tier < 3 && perf.ms < floorFor(perf.tier + 1) * 0.8) {` — up is earned: the next tier's own budget must be comfortably met
<!-- /note -->

#### <a id="s-notePerf-floorFor"></a>`notePerf>floorFor(tier)`

function · L66–66

- called by: [`notePerf`](#s-notePerf) ×2

<!-- note:notePerf>floorFor -->
down is immediate — a device that is already stuttering should not be
asked to stutter for another six seconds to prove it
<!-- /note -->

### <a id="s-farBudget"></a>`farBudget(n)`

function · **exported** · L84–88

- called by: [`stepTraffic`](../npc/traffic.js.md#s-stepTraffic) _js/npc/traffic.js_

<!-- note:farBudget -->
How many hulls the far field may fully step this frame, and the stride to
walk them with. `n` is the far-field population.
<!-- /note -->

### <a id="s-waveCap"></a>`waveCap(want)`

function · **exported** · L90–92

- called by: [`launchWave`](../npc/rogues.js.md#s-launchWave) _js/npc/rogues.js_ · [`dispatch`](../npc/security.js.md#s-dispatch) _js/npc/security.js_ · [`stepSecurity`](../npc/security.js.md#s-stepSecurity) _js/npc/security.js_

<!-- note:waveCap -->
Rogue waves and response wings scale with the budget.
<!-- /note -->

### <a id="s-tracerGate"></a>`tracerGate()`

function · **exported** · L94–96

- called by: [`stepGuns`](../npc/combat.js.md#s-stepGuns) _js/npc/combat.js_

<!-- note:tracerGate -->
Cosmetic-tracer gate: NPC theatre thins out before anything that matters does.
<!-- /note -->

### <a id="s-perfReport"></a>`perfReport()`

function · **exported** · L98–107

<!-- note:perfReport -->
The console's PERF row.
<!-- /note -->

### <a id="s-lockPerfTier"></a>`lockPerfTier(t)`

function · **exported** · L109–113

- calls: [`applyTier`](#s-applyTier)

<!-- note:lockPerfTier -->
Pin or release the tier (the console override). `null` returns to adaptive.
<!-- /note -->

## Module-level calls

- calls: [`applyTier`](#s-applyTier)
