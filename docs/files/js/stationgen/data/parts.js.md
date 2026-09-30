# js/stationgen/data/parts.js

[index](../../../../README.md) · 209 lines · 5 symbols · 0 imports · 2 importers

## About

<!-- note:@file -->
The parts catalogue. A station module is assembled from these; each part
carries its mass (t), its net power (kW, + generates, − draws), its heat
to reject (kW), and a raw-material split (mass shares by material id)
that the bill of materials rolls up. Grouped by domain so the parts
list reads like a yard manifest.

- L23 · `add([` — ---- structure ------------------------------------------------------------
- L23 · `add([` — ---- power ---------------------------------------------------------------
- L23 · `add([` — ---- thermal -------------------------------------------------------------
- L23 · `add([` — ---- life support --------------------------------------------------------
- L23 · `add([` — ---- water & waste -------------------------------------------------------
- L23 · `add([` — ---- agriculture ---------------------------------------------------------
- L23 · `add([` — ---- habitation ----------------------------------------------------------
- L23 · `add([` — ---- computing, control, comms ------------------------------------------
- L23 · `add([` — ---- sensors -------------------------------------------------------------
- L23 · `add([` — ---- docking & hangar ----------------------------------------------------
- L23 · `add([` — ---- manufacturing & industry --------------------------------------------
- L23 · `add([` — ---- science -------------------------------------------------------------
- L23 · `add([` — ---- safety & defence ----------------------------------------------------
- L23 · `add([` — ---- in-house munitions & drone fabrication --------------------------------
- L23 · `add([` — ---- arrays ----------------------------------------------------------------
- L23 · `add([` — ---- cargo & stores ------------------------------------------------------
<!-- /note -->

## Imports

_none_

## Imported by

- [js/stationgen/data/bom.js](bom.js.md) — `PARTS`, `PART_DOMAINS`
- [js/stationgen/index.js](../index.js.md) — `PARTS`, `PART_DOMAINS`, `PART_COUNT`

## Exports

- [`PART_DOMAINS`](#s-PART_DOMAINS) · const — used by [js/stationgen/data/bom.js](bom.js.md), [js/stationgen/index.js](../index.js.md)
- [`PARTS`](#s-PARTS) · const — used by [js/stationgen/data/bom.js](bom.js.md), [js/stationgen/index.js](../index.js.md)
- [`PART_COUNT`](#s-PART_COUNT) · const — used by [js/stationgen/index.js](../index.js.md)

## Effects

_none detected_

## Symbols

### <a id="s-P"></a>`P(id, name, o)`

function · L1–1

- called by: [`@file`](#) ×153

<!-- note:P -->
<!-- /note -->

### <a id="s-PART_DOMAINS"></a>`PART_DOMAINS`

const · **exported** · L3–18

<!-- note:PART_DOMAINS -->
<!-- /note -->

### <a id="s-PARTS"></a>`PARTS`

const · **exported** · L20–20

<!-- note:PARTS -->
<!-- /note -->

### <a id="s-add"></a>`add(list)`

function · L21–21

- called by: [`@file`](#) ×16

<!-- note:add -->
<!-- /note -->

### <a id="s-PART_COUNT"></a>`PART_COUNT`

const · **exported** · L209–209

<!-- note:PART_COUNT -->
<!-- /note -->

## Module-level calls

- calls: [`add`](#s-add) · [`P`](#s-P)
