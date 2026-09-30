# js/shipgen/core/rng.js

[index](../../../../README.md) · 23 lines · 8 symbols · 0 imports · 15 importers

## About

<!-- note:@file -->
Seeded PRNG — every hull is reproducible from its seed string.
<!-- /note -->

## Imports

_none_

## Imported by

- [js/shipgen/builder/StarshipBuilder.js](../builder/StarshipBuilder.js.md) — `RNG`
- [js/shipgen/builder/details.js](../builder/details.js.md) — `RNG`
- [js/shipgen/builder/docking.js](../builder/docking.js.md) — `RNG`
- [js/shipgen/builder/drives.js](../builder/drives.js.md) — `RNG`
- [js/shipgen/builder/glazing.js](../builder/glazing.js.md) — `RNG`
- [js/shipgen/builder/hull.js](../builder/hull.js.md) — `RNG`
- [js/shipgen/builder/placement.js](../builder/placement.js.md) — `RNG`
- [js/shipgen/builder/weapons.js](../builder/weapons.js.md) — `RNG`
- [js/shipgen/data/loadouts.js](../data/loadouts.js.md) — `RNG`
- [js/shipgen/generate.js](../generate.js.md) — `RNG`
- [js/shipgen/index.js](../index.js.md) — `RNG`
- [js/shipgen/ops/ops.js](../ops/ops.js.md) — `RNG`
- [js/ships/hullspec.js](../../ships/hullspec.js.md) — `RNG`
- test/shipgen/audit-attach.mjs _(outside js/)_ — `RNG`
- test/shipgen/test-build.mjs _(outside js/)_ — `RNG`

## Exports

- [`RNG`](#s-RNG) · class — used by [js/shipgen/builder/StarshipBuilder.js](../builder/StarshipBuilder.js.md), [js/shipgen/builder/details.js](../builder/details.js.md), [js/shipgen/builder/docking.js](../builder/docking.js.md), [js/shipgen/builder/drives.js](../builder/drives.js.md), [js/shipgen/builder/glazing.js](../builder/glazing.js.md), [js/shipgen/builder/hull.js](../builder/hull.js.md), [js/shipgen/builder/placement.js](../builder/placement.js.md), [js/shipgen/builder/weapons.js](../builder/weapons.js.md), [js/shipgen/data/loadouts.js](../data/loadouts.js.md), [js/shipgen/generate.js](../generate.js.md), [js/shipgen/index.js](../index.js.md), [js/shipgen/ops/ops.js](../ops/ops.js.md), [js/ships/hullspec.js](../../ships/hullspec.js.md), test/shipgen/audit-attach.mjs, test/shipgen/test-build.mjs

## Effects

_none detected_

## Symbols

### <a id="s-RNG"></a>`RNG`

class · **exported** · L1–23

- called by: [`StarshipBuilder.build`](../builder/StarshipBuilder.js.md#s-StarshipBuilder-build) _js/shipgen/builder/StarshipBuilder.js_ · [`buildAt`](../builder/placement.js.md#s-buildAt) _js/shipgen/builder/placement.js_ · [`doctrineLoadout`](../data/loadouts.js.md#s-doctrineLoadout) _js/shipgen/data/loadouts.js_ · [`randomConfig`](../generate.js.md#s-randomConfig) _js/shipgen/generate.js_ · [`makeRock`](../ops/ops.js.md#s-makeRock) _js/shipgen/ops/ops.js_ · [`buildSpec`](../../ships/hullspec.js.md#s-buildSpec) _js/ships/hullspec.js_

<!-- note:RNG -->
<!-- /note -->

#### <a id="s-RNG-constructor"></a>`RNG.constructor(seed)`

method · L2–10

<!-- note:RNG.constructor -->
<!-- /note -->

#### <a id="s-RNG-next"></a>`RNG.next()`

method · L11–17

<!-- note:RNG.next -->
<!-- /note -->

#### <a id="s-RNG-range"></a>`RNG.range(a, b)`

method · L18–18

<!-- note:RNG.range -->
<!-- /note -->

#### <a id="s-RNG-int"></a>`RNG.int(a, b)`

method · L19–19

<!-- note:RNG.int -->
<!-- /note -->

#### <a id="s-RNG-pick"></a>`RNG.pick(arr)`

method · L20–20

<!-- note:RNG.pick -->
<!-- /note -->

#### <a id="s-RNG-chance"></a>`RNG.chance(p)`

method · L21–21

<!-- note:RNG.chance -->
<!-- /note -->

#### <a id="s-RNG-sign"></a>`RNG.sign()`

method · L22–22

<!-- note:RNG.sign -->
<!-- /note -->
