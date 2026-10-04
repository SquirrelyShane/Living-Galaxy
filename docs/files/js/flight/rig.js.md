# js/flight/rig.js

[index](../../../README.md) · 159 lines · 13 symbols · 3 imports · 6 importers

## About

<!-- note:@file -->
LIVING GALAXY — the salvage rig.

0.3.87, Dead Hulls. Salvage's verb: a tool of its own beside the mining laser,
never running with it, that works a hulk (`world/hulks.js`) section by section.
CUT is fast and takes plate only. STRIP is slow and brings plate, parts, cargo
and the recorder out whole. What it frees is shed as `salvage` debris chunks
that the salvage tractor (`stepSalvage` in the sim) reels in — cut, then reel.

Shaped like the mining laser in `turrets.js`: a state object the renderer and
HUD read, a pure `stepRig`, and hooks the sim fills in. It never imports the sim.
<!-- /note -->

## Imports

| line | from | names | target |
|---|---|---|---|
| 1 | `../world/debris.js` | `addChunk` | [js/world/debris.js](../world/debris.js.md) |
| 2 | `../world/hulks.js` | `HULK`, `hulkVelocity`, `nearHulks`, `removeHulk` | [js/world/hulks.js](../world/hulks.js.md) |
| 3 | `./ship.js` | `shipFx` | [js/flight/ship.js](ship.js.md) |

## Imported by

- [js/console/panels/ship.js](../console/panels/ship.js.md) — `rig`
- [js/mission/salvage.js](../mission/salvage.js.md) — `RIG`, `rig`, `rigBlocker`, `nextSection`
- [js/render/engine.js](../render/engine.js.md) — `rig`
- [js/sim/sim.js](../sim/sim.js.md) — `resetRig`, `rig`, `rigHooks`, `rigTarget`, `stepRig`
- [js/ui/tutorial.js](../ui/tutorial.js.md) — `nextSection`, `rigRange`
- test/rig.test.mjs _(outside js/)_ — `RIG`, `rig`, `rigHooks`, `rigBlocker`, `rigRange`, `rigTarget`, `hulkCut`, `nextSection`, `stepRig`, `resetRig`

## Exports

- [`RIG`](#s-RIG) · const — used by [js/mission/salvage.js](../mission/salvage.js.md), test/rig.test.mjs
- [`rig`](#s-rig) · const — used by [js/console/panels/ship.js](../console/panels/ship.js.md), [js/mission/salvage.js](../mission/salvage.js.md), [js/render/engine.js](../render/engine.js.md), [js/sim/sim.js](../sim/sim.js.md), test/rig.test.mjs
- [`rigHooks`](#s-rigHooks) · const — used by [js/sim/sim.js](../sim/sim.js.md), test/rig.test.mjs
- [`resetRig`](#s-resetRig) · function — used by [js/sim/sim.js](../sim/sim.js.md), test/rig.test.mjs
- [`rigRange`](#s-rigRange) · function — used by [js/ui/tutorial.js](../ui/tutorial.js.md), test/rig.test.mjs
- [`rigBlocker`](#s-rigBlocker) · function — used by [js/mission/salvage.js](../mission/salvage.js.md), test/rig.test.mjs
- [`hulkCut`](#s-hulkCut) · function — used by test/rig.test.mjs
- [`nextSection`](#s-nextSection) · function — used by [js/mission/salvage.js](../mission/salvage.js.md), [js/ui/tutorial.js](../ui/tutorial.js.md), test/rig.test.mjs
- [`rigTarget`](#s-rigTarget) · function — used by [js/sim/sim.js](../sim/sim.js.md), test/rig.test.mjs
- [`stepRig`](#s-stepRig) · function — used by [js/sim/sim.js](../sim/sim.js.md), test/rig.test.mjs

## Effects

_none detected_

## Symbols

### <a id="s-RIG"></a>`RIG`

const · **exported** · L5–16

<!-- note:RIG -->
Every number the rig runs on, for the parity slice to tune in one place.

- `range` — reach in u from the ship to the hulk's skin (trim `rigRange`, plus `fx.rigRange` from upgrades)
- `cut`, `strip` — plate units a second, before `mods.salvage` and `hullTune.rig`
- `cutYield` — share of the plate CUT keeps; `cutCargo` — share of a section's cargo CUT spills rather than burns
- `lump` — most plate held loose before it is shed as one chunk (keeps the chunk count down: the debris field caps at 900)
- `chunkLife` — seconds a shed chunk lasts if nobody reels it in
- `heatCut`, `heatStrip`, `cool` — the heat the renderer reads; nothing else uses it yet
<!-- /note -->

### <a id="s-rig"></a>`rig`

const · **exported** · L18–18

<!-- note:rig -->
<!-- /note -->

### <a id="s-rigHooks"></a>`rigHooks`

const · **exported** · L20–20

<!-- note:rigHooks -->
<!-- /note -->

### <a id="s-_v"></a>`_v`

const · L22–22

<!-- note:_v -->
<!-- /note -->

### <a id="s-resetRig"></a>`resetRig()`

function · **exported** · L24–32

- called by: [`loadSky`](../sim/sim.js.md#s-loadSky) _js/sim/sim.js_

<!-- note:resetRig -->
<!-- /note -->

### <a id="s-rigRange"></a>`rigRange(ship)`

function · **exported** · L34–36

- via [js/flight/ship.js](ship.js.md): `shipFx.fx`
- called by: [`rigTarget`](#s-rigTarget) · [`buildCtx`](../ui/tutorial.js.md#s-buildCtx) _js/ui/tutorial.js_

<!-- note:rigRange -->
<!-- /note -->

### <a id="s-rigBlocker"></a>`rigBlocker(ship)`

function · **exported** · L38–43

- called by: [`stepRig`](#s-stepRig) · [`makeSalvage`](../mission/salvage.js.md#s-makeSalvage) _js/mission/salvage.js_

<!-- note:rigBlocker -->
<!-- /note -->

### <a id="s-hulkCut"></a>`hulkCut(h)`

function · **exported** · L45–49

- called by: [`stepRig`](#s-stepRig)

<!-- note:hulkCut -->
<!-- /note -->

### <a id="s-nextSection"></a>`nextSection(h)`

function · **exported** · L51–54

- called by: [`rigTarget`](#s-rigTarget) · [`stepRig`](#s-stepRig) ×2 · [`bestHulk`](../mission/salvage.js.md#s-bestHulk) _js/mission/salvage.js_ · [`makeSalvage`](../mission/salvage.js.md#s-makeSalvage) _js/mission/salvage.js_ · [`makeSalvage>pick`](../mission/salvage.js.md#s-makeSalvage-pick) _js/mission/salvage.js_ ×2 · [`buildCtx`](../ui/tutorial.js.md#s-buildCtx) _js/ui/tutorial.js_

<!-- note:nextSection -->
Sections are worked from the last index down, so the bridge (index 0, the
recorder) is always last: a pilot who started on CUT can still switch to STRIP
before the recorder is at risk.
<!-- /note -->

### <a id="s-rigTarget"></a>`rigTarget(ship, lock=)`

function · **exported** · L56–68

- calls: [`nextSection`](#s-nextSection) · [`rigRange`](#s-rigRange) · [`nearHulks`](../world/hulks.js.md#s-nearHulks) _js/world/hulks.js_
- called by: [`stepRig`](#s-stepRig) · [`rigWanted`](../sim/sim.js.md#s-rigWanted) _js/sim/sim.js_

<!-- note:rigTarget -->
The nearest hulk within reach that still has an uncut section — or the locked
hulk, if it is in reach. Reach is measured to the hulk's skin (`d - h.r`).
<!-- /note -->

### <a id="s-shed"></a>`shed(h, good, qty)`

function · L70–89

- calls: [`addChunk`](../world/debris.js.md#s-addChunk) _js/world/debris.js_ · [`hulkVelocity`](../world/hulks.js.md#s-hulkVelocity) _js/world/hulks.js_
- called by: [`finishSection`](#s-finishSection) ×2 · [`stepRig`](#s-stepRig)

<!-- note:shed -->
Puts freed material into the debris field as one chunk beside the hulk, at the
hulk's own frame velocity plus a few u/s of scatter. `remainingMass` carries the
exact quantity; `salvage: true` keeps the mining laser off it (`minableDebris`
in `turrets.js` skips it — otherwise two controllers would mine like a seam).
<!-- /note -->

### <a id="s-finishSection"></a>`finishSection(h, s, strip)`

function · L91–113

- calls: [`shed`](#s-shed) ×2
- called by: [`stepRig`](#s-stepRig)

<!-- note:finishSection -->
What happens when a section's plate runs out. STRIP sheds each part type and
the whole cargo; CUT loses the parts and spills `cutCargo` of the cargo. The
recorder is recovered on STRIP and destroyed on CUT. Fires `onRecorder` then
`onSection(hulk, section, out)` with what came out.
<!-- /note -->

### <a id="s-stepRig"></a>`stepRig(ship, dt, time, lock=)`

function · **exported** · L115–159

- calls: [`finishSection`](#s-finishSection) · [`hulkCut`](#s-hulkCut) · [`nextSection`](#s-nextSection) ×2 · [`rigBlocker`](#s-rigBlocker) · [`rigTarget`](#s-rigTarget) · [`shed`](#s-shed) · [`hulkVelocity`](../world/hulks.js.md#s-hulkVelocity) _js/world/hulks.js_ · [`removeHulk`](../world/hulks.js.md#s-removeHulk) _js/world/hulks.js_
- called by: [`tickSim`](../sim/sim.js.md#s-tickSim) _js/sim/sim.js_

<!-- note:stepRig -->
One tick. Sets `rig.active` and `ship.rigLive` (which is what `buildDemand`
bills: idle draw until the arc is actually on something). Removes the hulk and
fires `onDone` when the last section goes. Returns the hulk being worked, or null.
<!-- /note -->
