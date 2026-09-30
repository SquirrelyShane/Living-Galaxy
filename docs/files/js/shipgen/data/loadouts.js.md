# js/shipgen/data/loadouts.js

[index](../../../../README.md) · 59 lines · 6 symbols · 4 imports · 7 importers

## About

<!-- note:@file -->
Class doctrine manifests — catalog ids with optional ×count.
Weapons are appended from the class arms mix at generate time (see app.js doctrineLoadout).
Mirrors PART III of the catalog: what each class kit must have, what it can minimise.
<!-- /note -->

## Imports

| line | from | names | target |
|---|---|---|---|
| 1 | `../core/rng.js` | `RNG` | [js/shipgen/core/rng.js](../core/rng.js.md) |
| 2 | `./classes.js` | `SHIP_CLASSES` | [js/shipgen/data/classes.js](classes.js.md) |
| 3 | `./weapons.js` | `WEAPON_TYPES` | [js/shipgen/data/weapons.js](weapons.js.md) |
| 4 | `./catalog/index.js` | `WEAPON_PART` | [js/shipgen/data/catalog/index.js](catalog/index.js.md) |

## Imported by

- [js/shipgen/generate.js](../generate.js.md) — `doctrineLoadout`, `expandLoadout`, `CLASS_LOADOUT`
- [js/shipgen/index.js](../index.js.md) — `CORE`, `CLASS_LOADOUT`, `expandLoadout`, `doctrineLoadout`
- [js/ships/hullspec.js](../../ships/hullspec.js.md) — `CLASS_LOADOUT`, `CORE`, `expandLoadout`
- test/shipgen/audit-attach.mjs _(outside js/)_ — `CLASS_LOADOUT`, `expandLoadout`
- test/shipgen/audit-bom.mjs _(outside js/)_ — `CLASS_LOADOUT`, `expandLoadout`
- test/shipgen/test-build.mjs _(outside js/)_ — `CLASS_LOADOUT`, `expandLoadout`
- test/shipgen/test-flight.mjs _(outside js/)_ — `CLASS_LOADOUT`, `expandLoadout`

## Exports

- [`CORE`](#s-CORE) · const — used by [js/shipgen/index.js](../index.js.md), [js/ships/hullspec.js](../../ships/hullspec.js.md)
- [`CLASS_LOADOUT`](#s-CLASS_LOADOUT) · const — used by [js/shipgen/generate.js](../generate.js.md), [js/shipgen/index.js](../index.js.md), [js/ships/hullspec.js](../../ships/hullspec.js.md), test/shipgen/audit-attach.mjs, test/shipgen/audit-bom.mjs, test/shipgen/test-build.mjs, test/shipgen/test-flight.mjs
- [`doctrineLoadout`](#s-doctrineLoadout) · function — used by [js/shipgen/generate.js](../generate.js.md), [js/shipgen/index.js](../index.js.md)
- [`expandLoadout`](#s-expandLoadout) · function — used by [js/shipgen/generate.js](../generate.js.md), [js/shipgen/index.js](../index.js.md), [js/ships/hullspec.js](../../ships/hullspec.js.md), test/shipgen/audit-attach.mjs, test/shipgen/audit-bom.mjs, test/shipgen/test-build.mjs, test/shipgen/test-flight.mjs

## Effects

_none detected_

## Symbols

### <a id="s-CORE"></a>`CORE`

const · **exported** · L6–16

<!-- note:CORE -->
<!-- /note -->

### <a id="s-CREW_BASIC"></a>`CREW_BASIC`

const · L17–17

<!-- note:CREW_BASIC -->
<!-- /note -->

### <a id="s-CREW_FULL"></a>`CREW_FULL`

const · L18–18

<!-- note:CREW_FULL -->
<!-- /note -->

### <a id="s-CLASS_LOADOUT"></a>`CLASS_LOADOUT`

const · **exported** · L20–40

<!-- note:CLASS_LOADOUT -->
<!-- /note -->

### <a id="s-doctrineLoadout"></a>`doctrineLoadout(clsKey, cfg)`

function · **exported** · L42–53

- calls: [`new RNG`](../core/rng.js.md#s-RNG) _js/shipgen/core/rng.js_ · [`expandLoadout`](#s-expandLoadout)
- called by: [`loadoutFor`](../generate.js.md#s-loadoutFor) _js/shipgen/generate.js_

<!-- note:doctrineLoadout -->
class doctrine + arms mix → manifest for one hull
<!-- /note -->

### <a id="s-expandLoadout"></a>`expandLoadout(list)`

function · **exported** · L55–59

- called by: [`doctrineLoadout`](#s-doctrineLoadout) · [`buildSpec`](../../ships/hullspec.js.md#s-buildSpec) _js/ships/hullspec.js_

<!-- note:expandLoadout -->
<!-- /note -->
