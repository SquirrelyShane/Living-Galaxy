# js/shipgen/prefabs/index.js

[index](../../../../README.md) · 17 lines · 2 symbols · 9 imports · 10 importers

## About

<!-- note:@file -->
Prefab registry. Every catalog part names one of these keys. To add a prefab,
export it from one of the group files (or a new file) and merge it here.
<!-- /note -->

## Imports

| line | from | names | target |
|---|---|---|---|
| 1 | `./internal.js` | `default` as `internal` | [js/shipgen/prefabs/internal.js](internal.js.md) |
| 2 | `./structure.js` | `default` as `structure` | [js/shipgen/prefabs/structure.js](structure.js.md) |
| 3 | `./power.js` | `default` as `power` | [js/shipgen/prefabs/power.js](power.js.md) |
| 4 | `./acs.js` | `default` as `acs` | [js/shipgen/prefabs/acs.js](acs.js.md) |
| 5 | `./sensors.js` | `default` as `sensors` | [js/shipgen/prefabs/sensors.js](sensors.js.md) |
| 6 | `./docking.js` | `default` as `docking` | [js/shipgen/prefabs/docking.js](docking.js.md) |
| 7 | `./industrial.js` | `default` as `industrial` | [js/shipgen/prefabs/industrial.js](industrial.js.md) |
| 8 | `./weapons.js` | `default` as `weapons` | [js/shipgen/prefabs/weapons.js](weapons.js.md) |
| 9 | `./extra.js` | `default` as `extra` | [js/shipgen/prefabs/extra.js](extra.js.md) |
| 10 | `./_common.js` | re-export `ALL_FACES` | [js/shipgen/prefabs/_common.js](_common.js.md) |

## Imported by

- [js/shipgen/builder/StarshipBuilder.js](../builder/StarshipBuilder.js.md) — `PREFABS`, `ALL_FACES`, `fpArea`
- [js/shipgen/builder/details.js](../builder/details.js.md) — `PREFABS`, `ALL_FACES`, `fpArea`
- [js/shipgen/builder/docking.js](../builder/docking.js.md) — `PREFABS`, `ALL_FACES`, `fpArea`
- [js/shipgen/builder/drives.js](../builder/drives.js.md) — `PREFABS`, `ALL_FACES`, `fpArea`
- [js/shipgen/builder/glazing.js](../builder/glazing.js.md) — `PREFABS`, `ALL_FACES`, `fpArea`
- [js/shipgen/builder/hull.js](../builder/hull.js.md) — `PREFABS`, `ALL_FACES`, `fpArea`
- [js/shipgen/builder/placement.js](../builder/placement.js.md) — `PREFABS`, `ALL_FACES`, `fpArea`
- [js/shipgen/builder/weapons.js](../builder/weapons.js.md) — `PREFABS`, `ALL_FACES`, `fpArea`
- [js/shipgen/index.js](../index.js.md) — `PREFABS`, `ALL_FACES`, `fpArea`
- test/shipgen/test-build.mjs _(outside js/)_ — `PREFABS`

## Exports

- `ALL_FACES` · from `./_common.js` — used by [js/shipgen/builder/StarshipBuilder.js](../builder/StarshipBuilder.js.md), [js/shipgen/builder/details.js](../builder/details.js.md), [js/shipgen/builder/docking.js](../builder/docking.js.md), [js/shipgen/builder/drives.js](../builder/drives.js.md), [js/shipgen/builder/glazing.js](../builder/glazing.js.md), [js/shipgen/builder/hull.js](../builder/hull.js.md), [js/shipgen/builder/placement.js](../builder/placement.js.md), [js/shipgen/builder/weapons.js](../builder/weapons.js.md), [js/shipgen/index.js](../index.js.md)
- [`PREFABS`](#s-PREFABS) · const — used by [js/shipgen/builder/StarshipBuilder.js](../builder/StarshipBuilder.js.md), [js/shipgen/builder/details.js](../builder/details.js.md), [js/shipgen/builder/docking.js](../builder/docking.js.md), [js/shipgen/builder/drives.js](../builder/drives.js.md), [js/shipgen/builder/glazing.js](../builder/glazing.js.md), [js/shipgen/builder/hull.js](../builder/hull.js.md), [js/shipgen/builder/placement.js](../builder/placement.js.md), [js/shipgen/builder/weapons.js](../builder/weapons.js.md), [js/shipgen/index.js](../index.js.md), test/shipgen/test-build.mjs
- [`fpArea`](#s-fpArea) · function — used by [js/shipgen/builder/StarshipBuilder.js](../builder/StarshipBuilder.js.md), [js/shipgen/builder/details.js](../builder/details.js.md), [js/shipgen/builder/docking.js](../builder/docking.js.md), [js/shipgen/builder/drives.js](../builder/drives.js.md), [js/shipgen/builder/glazing.js](../builder/glazing.js.md), [js/shipgen/builder/hull.js](../builder/hull.js.md), [js/shipgen/builder/placement.js](../builder/placement.js.md), [js/shipgen/builder/weapons.js](../builder/weapons.js.md), [js/shipgen/index.js](../index.js.md)

## Effects

_none detected_

## Symbols

### <a id="s-PREFABS"></a>`PREFABS`

const · **exported** · L12–12

<!-- note:PREFABS -->
<!-- /note -->

### <a id="s-fpArea"></a>`fpArea(p)`

function · **exported** · L14–17

- called by: [`mountLoadout`](../builder/placement.js.md#s-mountLoadout) _js/shipgen/builder/placement.js_ ×2

<!-- note:fpArea -->
footprint area used to sort the mounting order (biggest first)
<!-- /note -->
