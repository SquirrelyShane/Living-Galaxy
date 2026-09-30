# js/stationgen/data/styles.js

[index](../../../../README.md) · 79 lines · 3 symbols · 0 imports · 5 importers

## About

<!-- note:@file -->
Architecture styles: the *language* a station is built in.

An archetype says what a station is for; a style says how its builders
build. The style weights which body forms each module family may take
(see prefabs/forms.js), which decorative kit goes on afterwards, how the
hangar mouths are cut, which structural alloy the hull is skinned in and
which hull grammars it favours. Every station rolls its own instance of
each form, so two stations in the same style are cousins, not twins.

  cathedral   naves, pointed arches, buttresses, spires, rose windows — the pilgrim orders
  bastion     sloped armour, faceted keeps, gun blisters, blast doors — military spec
  civic       clean stacked decks, window bands, terraces — cities and trade
  industrial  drums, stacks, pipe, hazard stripes, exposed frames — the works
  frontier    welded hulls of odd sizes, patches, girders, cables — free ports
  research    faceted white pods, glass strips, dishes, crystal masts
  agrarian    glazed vaults, domes, green under glass, sun-facing everything
<!-- /note -->

## Imports

_none_

## Imported by

- [js/stationgen/builder/StationBuilder.js](../builder/StationBuilder.js.md) — `STYLES_ARCH`, `roll`
- [js/stationgen/builder/hangar.js](../builder/hangar.js.md) — `roll`
- [js/stationgen/generate.js](../generate.js.md) — `STYLES_ARCH`, `STYLE_KEYS`
- [js/stationgen/index.js](../index.js.md) — `STYLES_ARCH`, `STYLE_KEYS`, `roll`
- [js/stationgen/prefabs/forms.js](../prefabs/forms.js.md) — `roll`

## Exports

- [`STYLES_ARCH`](#s-STYLES_ARCH) · const — used by [js/stationgen/builder/StationBuilder.js](../builder/StationBuilder.js.md), [js/stationgen/generate.js](../generate.js.md), [js/stationgen/index.js](../index.js.md)
- [`STYLE_KEYS`](#s-STYLE_KEYS) · const — used by [js/stationgen/generate.js](../generate.js.md), [js/stationgen/index.js](../index.js.md)
- [`roll`](#s-roll) · function — used by [js/stationgen/builder/StationBuilder.js](../builder/StationBuilder.js.md), [js/stationgen/builder/hangar.js](../builder/hangar.js.md), [js/stationgen/index.js](../index.js.md), [js/stationgen/prefabs/forms.js](../prefabs/forms.js.md)

## Effects

_none detected_

## Symbols

### <a id="s-STYLES_ARCH"></a>`STYLES_ARCH`

const · **exported** · L1–72

<!-- note:STYLES_ARCH -->
<!-- /note -->

### <a id="s-STYLE_KEYS"></a>`STYLE_KEYS`

const · **exported** · L73–73

<!-- note:STYLE_KEYS -->
<!-- /note -->

### <a id="s-roll"></a>`roll(rng, table, filter=)`

function · **exported** · L75–79

- called by: [`StationBuilder.build`](../builder/StationBuilder.js.md#s-StationBuilder-build) _js/stationgen/builder/StationBuilder.js_ ×2 · [`hangarPlan`](../builder/hangar.js.md#s-hangarPlan) _js/stationgen/builder/hangar.js_ ×2 · [`FORMS.vault`](../prefabs/forms.js.md#s-FORMS-vault) _js/stationgen/prefabs/forms.js_ · [`pickForm`](../prefabs/forms.js.md#s-pickForm) _js/stationgen/prefabs/forms.js_

<!-- note:roll -->
Pick from a weight table with the rng.
<!-- /note -->
