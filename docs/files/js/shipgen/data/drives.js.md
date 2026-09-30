# js/shipgen/data/drives.js

[index](../../../../README.md) · 13 lines · 1 symbols · 0 imports · 14 importers

## About

<!-- note:@file -->
Main-drive families. plume/flare/light scale the exhaust visuals; hot = core colour.
Add a family here AND a drive_&lt;key>() builder in src/builder/drives.js.
<!-- /note -->

## Imports

_none_

## Imported by

- [js/shipgen/builder/StarshipBuilder.js](../builder/StarshipBuilder.js.md) — `DRIVE_TYPES`
- [js/shipgen/builder/details.js](../builder/details.js.md) — `DRIVE_TYPES`
- [js/shipgen/builder/docking.js](../builder/docking.js.md) — `DRIVE_TYPES`
- [js/shipgen/builder/drives.js](../builder/drives.js.md) — `DRIVE_TYPES`
- [js/shipgen/builder/glazing.js](../builder/glazing.js.md) — `DRIVE_TYPES`
- [js/shipgen/builder/hull.js](../builder/hull.js.md) — `DRIVE_TYPES`
- [js/shipgen/builder/placement.js](../builder/placement.js.md) — `DRIVE_TYPES`
- [js/shipgen/builder/weapons.js](../builder/weapons.js.md) — `DRIVE_TYPES`
- [js/shipgen/data/flight.js](flight.js.md) — `DRIVE_TYPES`
- [js/shipgen/generate.js](../generate.js.md) — `DRIVE_TYPES`
- [js/shipgen/index.js](../index.js.md) — `DRIVE_TYPES`
- [js/ships/hullspec.js](../../ships/hullspec.js.md) — `DRIVE_TYPES`
- test/hullspec.test.mjs _(outside js/)_ — `DRIVE_TYPES`
- test/shipgen/test-build.mjs _(outside js/)_ — `DRIVE_TYPES`

## Exports

- [`DRIVE_TYPES`](#s-DRIVE_TYPES) · const — used by [js/shipgen/builder/StarshipBuilder.js](../builder/StarshipBuilder.js.md), [js/shipgen/builder/details.js](../builder/details.js.md), [js/shipgen/builder/docking.js](../builder/docking.js.md), [js/shipgen/builder/drives.js](../builder/drives.js.md), [js/shipgen/builder/glazing.js](../builder/glazing.js.md), [js/shipgen/builder/hull.js](../builder/hull.js.md), [js/shipgen/builder/placement.js](../builder/placement.js.md), [js/shipgen/builder/weapons.js](../builder/weapons.js.md), [js/shipgen/data/flight.js](flight.js.md), [js/shipgen/generate.js](../generate.js.md), [js/shipgen/index.js](../index.js.md), [js/ships/hullspec.js](../../ships/hullspec.js.md), test/hullspec.test.mjs, test/shipgen/test-build.mjs

## Effects

_none detected_

## Symbols

### <a id="s-DRIVE_TYPES"></a>`DRIVE_TYPES`

const · **exported** · L1–13

<!-- note:DRIVE_TYPES -->
isp: specific impulse (s) · kNm2: thrust per m² of nozzle exit area at full throttle · halfAngle: plume cone (deg)
· atmo: may light inside an atmosphere. Figures are engineering order-of-magnitude for a mature industrial base.
<!-- /note -->
