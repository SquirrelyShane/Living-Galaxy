# js/shipgen/anim.js

[index](../../../README.md) · 88 lines · 5 symbols · 0 imports · 5 importers

## About

<!-- note:@file -->
Animation registry shared by the yard and the traffic demo.
collectInto(reg, root) indexes everything a built ship animates; tick(reg, dt, t, ctx) drives it.
ctx: { throttle 0–1, aim: world Vector3 | null (turrets slew onto it), aimAngles(o, target) }
<!-- /note -->

## Imports

_none_

## Imported by

- [js/render/hullpool.js](../render/hullpool.js.md) — `newRegistry`, `collectInto`
- [js/shipgen/generate.js](generate.js.md) — `newRegistry`, `collectInto`, `disposeShip`
- [js/shipgen/index.js](index.js.md) — `newRegistry`, `collectInto`, `disposeShip`, `tick`
- [js/ships/shipforge.js](../ships/shipforge.js.md) — `tick`, `newRegistry`, `collectInto`
- test/shipgen/test-ops.mjs _(outside js/)_ — `newRegistry`, `collectInto`, `tick`

## Exports

- [`newRegistry`](#s-newRegistry) · function — used by [js/render/hullpool.js](../render/hullpool.js.md), [js/shipgen/generate.js](generate.js.md), [js/shipgen/index.js](index.js.md), [js/ships/shipforge.js](../ships/shipforge.js.md), test/shipgen/test-ops.mjs
- [`collectInto`](#s-collectInto) · function — used by [js/render/hullpool.js](../render/hullpool.js.md), [js/shipgen/generate.js](generate.js.md), [js/shipgen/index.js](index.js.md), [js/ships/shipforge.js](../ships/shipforge.js.md), test/shipgen/test-ops.mjs
- [`disposeShip`](#s-disposeShip) · function — used by [js/shipgen/generate.js](generate.js.md), [js/shipgen/index.js](index.js.md)
- [`tick`](#s-tick) · function — used by [js/shipgen/index.js](index.js.md), [js/ships/shipforge.js](../ships/shipforge.js.md), test/shipgen/test-ops.mjs

## Effects

_none detected_

## Symbols

### <a id="s-newRegistry"></a>`newRegistry()`

function · **exported** · L1–1

- called by: [`instanceOf`](../render/hullpool.js.md#s-instanceOf) _js/render/hullpool.js_ · [`buildShip`](generate.js.md#s-buildShip) _js/shipgen/generate.js_ · [`forgeShip`](../ships/shipforge.js.md#s-forgeShip) _js/ships/shipforge.js_

<!-- note:newRegistry -->
<!-- /note -->

### <a id="s-collectInto"></a>`collectInto(reg, root)`

function · **exported** · L3–24

- called by: [`instanceOf`](../render/hullpool.js.md#s-instanceOf) _js/render/hullpool.js_ · [`buildShip`](generate.js.md#s-buildShip) _js/shipgen/generate.js_ · [`forgeShip`](../ships/shipforge.js.md#s-forgeShip) _js/ships/shipforge.js_

<!-- note:collectInto -->
<!-- /note -->

### <a id="s-disposeShip"></a>`disposeShip(obj)`

function · **exported** · L26–28

- called by: [`releaseShip`](generate.js.md#s-releaseShip) _js/shipgen/generate.js_

<!-- note:disposeShip -->
<!-- /note -->

### <a id="s-wrapAngle"></a>`wrapAngle(a)`

function · L30–30

- called by: [`tick`](#s-tick) ×2

<!-- note:wrapAngle -->
<!-- /note -->

### <a id="s-tick"></a>`tick(reg, dt, t, ctx=)`

function · **exported** · L32–88

- calls: [`wrapAngle`](#s-wrapAngle) ×2
- called by: [`tickHull`](../ships/shipforge.js.md#s-tickHull) _js/ships/shipforge.js_

<!-- note:tick -->
- L62 · `for (const o of reg.scans) {` — turret + sensor sweep: idle patrol arc, or slew onto the aim point
- L74 · `for (const o of reg.lamps) {` — cosmetic lamps — steady, breathing, blinking, strobing, chasing
<!-- /note -->
