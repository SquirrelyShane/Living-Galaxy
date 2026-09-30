# js/stationgen/data/archetypes.js

[index](../../../../README.md) · 69 lines · 2 symbols · 0 imports · 4 importers

## About

<!-- note:@file -->
Station archetypes: what the place is for, and therefore what it is
built of and shaped like.

  hull      the hull grammar the builder grows (see builder/hull.js)
  style     the architecture it is built in (see data/styles.js)
  tier      default population tier
  doctrine  modules the archetype fits beyond the tier's habitation set,
            as "id" or "id×n"
  hangars   hangar mouths (each is an entry side + an exit side)
  palette   livery — hull is tinted further by the alloy the style rolls
<!-- /note -->

## Imports

_none_

## Imported by

- [js/stationgen/builder/StationBuilder.js](../builder/StationBuilder.js.md) — `ARCHETYPES`
- [js/stationgen/data/doctrine.js](doctrine.js.md) — `ARCHETYPES`
- [js/stationgen/generate.js](../generate.js.md) — `ARCHETYPES`, `ARCHETYPE_KEYS`
- [js/stationgen/index.js](../index.js.md) — `ARCHETYPES`, `ARCHETYPE_KEYS`

## Exports

- [`ARCHETYPES`](#s-ARCHETYPES) · const — used by [js/stationgen/builder/StationBuilder.js](../builder/StationBuilder.js.md), [js/stationgen/data/doctrine.js](doctrine.js.md), [js/stationgen/generate.js](../generate.js.md), [js/stationgen/index.js](../index.js.md)
- [`ARCHETYPE_KEYS`](#s-ARCHETYPE_KEYS) · const — used by [js/stationgen/generate.js](../generate.js.md), [js/stationgen/index.js](../index.js.md)

## Effects

_none detected_

## Symbols

### <a id="s-ARCHETYPES"></a>`ARCHETYPES`

const · **exported** · L1–68

<!-- note:ARCHETYPES -->
<!-- /note -->

### <a id="s-ARCHETYPE_KEYS"></a>`ARCHETYPE_KEYS`

const · **exported** · L69–69

<!-- note:ARCHETYPE_KEYS -->
<!-- /note -->
