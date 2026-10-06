# js/render/resolution.js

[index](../../../README.md) · 20 lines · 5 symbols · 0 imports · 2 importers

## About

<!-- note:@file -->
<!-- /note -->

## Imports

_none_

## Imported by

- [js/render/engine.js](engine.js.md) — `createResolutionController`
- test/performance-upgrade.test.mjs _(outside js/)_ — `createResolutionController`

## Exports

- [`createResolutionController`](#s-createResolutionController) · function — used by [js/render/engine.js](engine.js.md), test/performance-upgrade.test.mjs

## Effects

_none detected_

## Symbols

### <a id="s-RATIOS"></a>`RATIOS`

const · L1–1

<!-- note:RATIOS -->
<!-- /note -->

### <a id="s-capFor"></a>`capFor(dpr)`

function · L2–2

- called by: [`createResolutionController`](#s-createResolutionController) · [`createResolutionController.update`](#s-createResolutionController-update)

<!-- note:capFor -->
<!-- /note -->

### <a id="s-createResolutionController"></a>`createResolutionController(deviceRatio=)`

function · **exported** · L4–20

- calls: [`capFor`](#s-capFor)
- called by: [`mountGame`](engine.js.md#s-mountGame) _js/render/engine.js_

<!-- note:createResolutionController -->
<!-- /note -->

#### <a id="s-createResolutionController-ratio"></a>`createResolutionController.ratio()`

prop · L7–7

<!-- note:createResolutionController.ratio -->
<!-- /note -->

#### <a id="s-createResolutionController-update"></a>`createResolutionController.update(tier, dt, dpr=)`

prop · L8–18

- calls: [`capFor`](#s-capFor)

<!-- note:createResolutionController.update -->
<!-- /note -->
