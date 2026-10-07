# js/aria/threat.js

[index](../../../README.md) · 90 lines · 11 symbols · 0 imports · 3 importers

## About

<!-- note:@file -->
<!-- /note -->

## Imports

_none_

## Imported by

- [js/aria/pilot.js](pilot.js.md) — `pathRisk`
- [js/aria/play.js](play.js.md) — `pathRisk`, `threatLine`
- [js/aria/senses.js](senses.js.md) — `threatOf`, `hazardsFrom`, `threatLine`, `THREAT`

## Exports

- [`THREAT`](#s-THREAT) · const — used by [js/aria/senses.js](senses.js.md)
- [`bandOf`](#s-bandOf) · function — **no importer in scanned roots**
- [`guardOf`](#s-guardOf) · function — **no importer in scanned roots**
- [`threatOf`](#s-threatOf) · function — used by [js/aria/senses.js](senses.js.md)
- [`legRisk`](#s-legRisk) · function — **no importer in scanned roots**
- [`pathRisk`](#s-pathRisk) · function — used by [js/aria/pilot.js](pilot.js.md), [js/aria/play.js](play.js.md)
- [`hazardsFrom`](#s-hazardsFrom) · function — used by [js/aria/senses.js](senses.js.md)
- [`threatLine`](#s-threatLine) · function — used by [js/aria/play.js](play.js.md), [js/aria/senses.js](senses.js.md)

## Effects

_none detected_

## Symbols

### <a id="s-THREAT"></a>`THREAT`

const · **exported** · L1–10

<!-- note:THREAT -->
<!-- /note -->

### <a id="s-d3"></a>`d3(a, b)`

function · L12–12

- called by: [`segDist`](#s-segDist)

<!-- note:d3 -->
<!-- /note -->

### <a id="s-clamp01"></a>`clamp01(v)`

function · L13–13

- called by: [`guardOf`](#s-guardOf) ×2 · [`legRisk`](#s-legRisk) · [`segDist`](#s-segDist)

<!-- note:clamp01 -->
<!-- /note -->

### <a id="s-bandOf"></a>`bandOf(level)`

function · **exported** · L15–15

- called by: [`threatOf`](#s-threatOf)

<!-- note:bandOf -->
<!-- /note -->

### <a id="s-guardOf"></a>`guardOf(own)`

function · **exported** · L17–20

- calls: [`clamp01`](#s-clamp01) ×2
- called by: [`threatOf`](#s-threatOf)

<!-- note:guardOf -->
<!-- /note -->

### <a id="s-threatOf"></a>`threatOf(own, hostiles=)`

function · **exported** · L22–44

- calls: [`bandOf`](#s-bandOf) · [`guardOf`](#s-guardOf)
- called by: [`perceive`](senses.js.md#s-perceive) _js/aria/senses.js_

<!-- note:threatOf -->
<!-- /note -->

### <a id="s-segDist"></a>`segDist(a, b, q)`

function · L46–52

- calls: [`clamp01`](#s-clamp01) · [`d3`](#s-d3)
- called by: [`legRisk`](#s-legRisk)

<!-- note:segDist -->
<!-- /note -->

### <a id="s-legRisk"></a>`legRisk(from, to, hazards=)`

function · **exported** · L54–65

- calls: [`clamp01`](#s-clamp01) · [`segDist`](#s-segDist)
- called by: [`pathRisk`](#s-pathRisk)

<!-- note:legRisk -->
<!-- /note -->

### <a id="s-pathRisk"></a>`pathRisk(points, hazards=)`

function · **exported** · L67–76

- calls: [`legRisk`](#s-legRisk)
- called by: [`bestRepairPort`](pilot.js.md#s-bestRepairPort) _js/aria/pilot.js_ · [`jobsFor`](play.js.md#s-jobsFor) _js/aria/play.js_

<!-- note:pathRisk -->
<!-- /note -->

### <a id="s-hazardsFrom"></a>`hazardsFrom({…}=)`

function · **exported** · L78–84

- called by: [`perceive`](senses.js.md#s-perceive) _js/aria/senses.js_

<!-- note:hazardsFrom -->
<!-- /note -->

### <a id="s-threatLine"></a>`threatLine(t)`

function · **exported** · L86–90

- called by: [`playReport`](play.js.md#s-playReport) _js/aria/play.js_ · [`sceneOf`](senses.js.md#s-sceneOf) _js/aria/senses.js_

<!-- note:threatLine -->
<!-- /note -->
