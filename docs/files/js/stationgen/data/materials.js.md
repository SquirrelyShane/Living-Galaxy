# js/stationgen/data/materials.js

[index](../../../../README.md) · 78 lines · 4 symbols · 0 imports · 4 importers

## About

<!-- note:@file -->
Raw stock at the bottom of every bill of materials. `kind` groups them
for the summary; `kgm3` lets volume-priced things (tanks, shielding)
convert; `cr` is a book price per tonne for the demo's estimate.
<!-- /note -->

## Imports

_none_

## Imported by

- [js/stationgen/builder/StationBuilder.js](../builder/StationBuilder.js.md) — `ALLOYS`
- [js/stationgen/data/bom.js](bom.js.md) — `MATERIALS`, `FAB_RATE`
- [js/stationgen/generate.js](../generate.js.md) — `ALLOYS`
- [js/stationgen/index.js](../index.js.md) — `MATERIALS`, `FAB_RATE`, `ALLOYS`, `ALLOY_KEYS`

## Exports

- [`MATERIALS`](#s-MATERIALS) · const — used by [js/stationgen/data/bom.js](bom.js.md), [js/stationgen/index.js](../index.js.md)
- [`ALLOYS`](#s-ALLOYS) · const — used by [js/stationgen/builder/StationBuilder.js](../builder/StationBuilder.js.md), [js/stationgen/generate.js](../generate.js.md), [js/stationgen/index.js](../index.js.md)
- [`ALLOY_KEYS`](#s-ALLOY_KEYS) · const — used by [js/stationgen/index.js](../index.js.md)
- [`FAB_RATE`](#s-FAB_RATE) · const — used by [js/stationgen/data/bom.js](bom.js.md), [js/stationgen/index.js](../index.js.md)

## Effects

_none detected_

## Symbols

### <a id="s-MATERIALS"></a>`MATERIALS`

const · **exported** · L1–56

<!-- note:MATERIALS -->
- L47 · `al_sc:     { name: "Al-Sc 5028 alloy",           kind: "alloy",     kgm3: 2670, cr: 5400 }` — structural metals a yard can skin a hull in — each with its own look
<!-- /note -->

### <a id="s-ALLOYS"></a>`ALLOYS`

const · **exported** · L58–71

<!-- note:ALLOYS -->
Hull alloys: what the structure is skinned and framed in. The style rolls
one per station; it tints the hull material and takes over the primary
structural share (al_li) in every structure, docking and armour part.
<!-- /note -->

### <a id="s-ALLOY_KEYS"></a>`ALLOY_KEYS`

const · **exported** · L72–72

<!-- note:ALLOY_KEYS -->
<!-- /note -->

### <a id="s-FAB_RATE"></a>`FAB_RATE`

const · **exported** · L74–78

<!-- note:FAB_RATE -->
Fabrication rate over raw stock, by material kind: what the yard adds
turning stock into a certified part.
<!-- /note -->
