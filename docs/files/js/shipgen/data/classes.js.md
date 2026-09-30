# js/shipgen/data/classes.js

[index](../../../../README.md) · 142 lines · 3 symbols · 0 imports · 11 importers

## About

<!-- note:@file -->
Hull classes — silhouette grammar + doctrine (drive, arms mix, weapon weight).
CLASS_EQUIP carries the hull-level glazing doctrine (bridge style, crew viewport density);
the equipment manifest itself lives in data/loadouts.js.
<!-- /note -->

## Imports

_none_

## Imported by

- [js/shipgen/builder/StarshipBuilder.js](../builder/StarshipBuilder.js.md) — `SHIP_CLASSES`, `EQUIP_DEFAULT`, `CLASS_EQUIP`
- [js/shipgen/data/loadouts.js](loadouts.js.md) — `SHIP_CLASSES`
- [js/shipgen/generate.js](../generate.js.md) — `SHIP_CLASSES`
- [js/shipgen/index.js](../index.js.md) — `SHIP_CLASSES`, `EQUIP_DEFAULT`, `CLASS_EQUIP`
- [js/ships/hullspec.js](../../ships/hullspec.js.md) — `SHIP_CLASSES`, `EQUIP_DEFAULT`, `CLASS_EQUIP`
- test/hullspec.test.mjs _(outside js/)_ — `SHIP_CLASSES`
- test/shipgen/audit-attach.mjs _(outside js/)_ — `SHIP_CLASSES`
- test/shipgen/audit-bom.mjs _(outside js/)_ — `SHIP_CLASSES`
- test/shipgen/test-build.mjs _(outside js/)_ — `SHIP_CLASSES`
- test/shipgen/test-flight.mjs _(outside js/)_ — `SHIP_CLASSES`
- test/shipgen/test-ops.mjs _(outside js/)_ — `SHIP_CLASSES`

## Exports

- [`SHIP_CLASSES`](#s-SHIP_CLASSES) · const — used by [js/shipgen/builder/StarshipBuilder.js](../builder/StarshipBuilder.js.md), [js/shipgen/data/loadouts.js](loadouts.js.md), [js/shipgen/generate.js](../generate.js.md), [js/shipgen/index.js](../index.js.md), [js/ships/hullspec.js](../../ships/hullspec.js.md), test/hullspec.test.mjs, test/shipgen/audit-attach.mjs, test/shipgen/audit-bom.mjs, test/shipgen/test-build.mjs, test/shipgen/test-flight.mjs, test/shipgen/test-ops.mjs
- [`EQUIP_DEFAULT`](#s-EQUIP_DEFAULT) · const — used by [js/shipgen/builder/StarshipBuilder.js](../builder/StarshipBuilder.js.md), [js/shipgen/index.js](../index.js.md), [js/ships/hullspec.js](../../ships/hullspec.js.md)
- [`CLASS_EQUIP`](#s-CLASS_EQUIP) · const — used by [js/shipgen/builder/StarshipBuilder.js](../builder/StarshipBuilder.js.md), [js/shipgen/index.js](../index.js.md), [js/ships/hullspec.js](../../ships/hullspec.js.md)

## Effects

_none detected_

## Symbols

### <a id="s-SHIP_CLASSES"></a>`SHIP_CLASSES`

const · **exported** · L1–116

<!-- note:SHIP_CLASSES -->
<!-- /note -->

### <a id="s-EQUIP_DEFAULT"></a>`EQUIP_DEFAULT`

const · **exported** · L118–121

<!-- note:EQUIP_DEFAULT -->
<!-- /note -->

### <a id="s-CLASS_EQUIP"></a>`CLASS_EQUIP`

const · **exported** · L122–142

<!-- note:CLASS_EQUIP -->
<!-- /note -->
