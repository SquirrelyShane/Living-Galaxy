# js/stationgen/core/rng.js

[index](../../../../README.md) · 38 lines · 14 symbols · 0 imports · 3 importers

## About

<!-- note:@file -->
Seeded PRNG — every station is reproducible from its seed string.

- L25 · `RNG.prototype.gauss = function (mean = 0, sd = 1) {` — Extras the station builder leans on.
<!-- /note -->

## Imports

_none_

## Imported by

- [js/stationgen/builder/StationBuilder.js](../builder/StationBuilder.js.md) — `RNG`
- [js/stationgen/generate.js](../generate.js.md) — `RNG`
- [js/stationgen/index.js](../index.js.md) — `RNG`

## Exports

- [`RNG`](#s-RNG) · class — used by [js/stationgen/builder/StationBuilder.js](../builder/StationBuilder.js.md), [js/stationgen/generate.js](../generate.js.md), [js/stationgen/index.js](../index.js.md)

## Effects

_none detected_

## Symbols

### <a id="s-RNG"></a>`RNG`

class · **exported** · L1–23

- called by: [`StationBuilder.build`](../builder/StationBuilder.js.md#s-StationBuilder-build) _js/stationgen/builder/StationBuilder.js_ · [`randomConfig`](../generate.js.md#s-randomConfig) _js/stationgen/generate.js_

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

### <a id="s-u"></a>`u`

const · L26–26

<!-- note:u -->
<!-- /note -->

### <a id="s-v"></a>`v`

const · L26–26

<!-- note:v -->
<!-- /note -->

### <a id="s-i"></a>`i`

const · L30–30

<!-- note:i -->
<!-- /note -->

### <a id="s-j"></a>`j`

const · L30–30

<!-- note:j -->
<!-- /note -->

### <a id="s-total"></a>`total`

const · L34–34

<!-- note:total -->
<!-- /note -->

### <a id="s-r"></a>`r`

const · L35–35

<!-- note:r -->
<!-- /note -->
