# js/shipgen/data/catalog/index.js

[index](../../../../../README.md) · 33 lines · 3 symbols · 21 imports · 17 importers

## About

<!-- note:@file -->
Catalog assembly. One file per master-tree domain; add a domain by dropping
a file in this folder and listing it below. PARTS is the flat id → part index.
<!-- /note -->

## Imports

| line | from | names | target |
|---|---|---|---|
| 1 | `./00-identity.js` | `default` as `d00` | [js/shipgen/data/catalog/00-identity.js](00-identity.js.md) |
| 2 | `./01-propulsion.js` | `default` as `d01` | [js/shipgen/data/catalog/01-propulsion.js](01-propulsion.js.md) |
| 3 | `./02-fluids.js` | `default` as `d02` | [js/shipgen/data/catalog/02-fluids.js](02-fluids.js.md) |
| 4 | `./03-power.js` | `default` as `d03` | [js/shipgen/data/catalog/03-power.js](03-power.js.md) |
| 5 | `./04-epds.js` | `default` as `d04` | [js/shipgen/data/catalog/04-epds.js](04-epds.js.md) |
| 6 | `./05-structure.js` | `default` as `d05` | [js/shipgen/data/catalog/05-structure.js](05-structure.js.md) |
| 7 | `./06-materials.js` | `default` as `d06` | [js/shipgen/data/catalog/06-materials.js](06-materials.js.md) |
| 8 | `./07-thermal.js` | `default` as `d07` | [js/shipgen/data/catalog/07-thermal.js](07-thermal.js.md) |
| 9 | `./08-computing.js` | `default` as `d08` | [js/shipgen/data/catalog/08-computing.js](08-computing.js.md) |
| 10 | `./09-gnc.js` | `default` as `d09` | [js/shipgen/data/catalog/09-gnc.js](09-gnc.js.md) |
| 11 | `./10-comms.js` | `default` as `d10` | [js/shipgen/data/catalog/10-comms.js](10-comms.js.md) |
| 12 | `./11-sensors.js` | `default` as `d11` | [js/shipgen/data/catalog/11-sensors.js](11-sensors.js.md) |
| 13 | `./12-atmosphere.js` | `default` as `d12` | [js/shipgen/data/catalog/12-atmosphere.js](12-atmosphere.js.md) |
| 14 | `./13-water-waste-food.js` | `default` as `d13` | [js/shipgen/data/catalog/13-water-waste-food.js](13-water-waste-food.js.md) |
| 15 | `./14-habitation.js` | `default` as `d14` | [js/shipgen/data/catalog/14-habitation.js](14-habitation.js.md) |
| 16 | `./15-eva-docking.js` | `default` as `d15` | [js/shipgen/data/catalog/15-eva-docking.js](15-eva-docking.js.md) |
| 17 | `./16-robotics.js` | `default` as `d16` | [js/shipgen/data/catalog/16-robotics.js](16-robotics.js.md) |
| 18 | `./17-cargo.js` | `default` as `d17` | [js/shipgen/data/catalog/17-cargo.js](17-cargo.js.md) |
| 19 | `./18-safety-defense.js` | `default` as `d18` | [js/shipgen/data/catalog/18-safety-defense.js](18-safety-defense.js.md) |
| 20 | `./19-manufacturing.js` | `default` as `d19` | [js/shipgen/data/catalog/19-manufacturing.js](19-manufacturing.js.md) |
| 21 | `./20-standards.js` | `default` as `d20` | [js/shipgen/data/catalog/20-standards.js](20-standards.js.md) |

## Imported by

- [js/economy/shipcost.js](../../../economy/shipcost.js.md) — `PARTS`
- [js/shipgen/builder/StarshipBuilder.js](../../builder/StarshipBuilder.js.md) — `PARTS`
- [js/shipgen/builder/details.js](../../builder/details.js.md) — `PARTS`
- [js/shipgen/builder/docking.js](../../builder/docking.js.md) — `PARTS`
- [js/shipgen/builder/drives.js](../../builder/drives.js.md) — `PARTS`
- [js/shipgen/builder/glazing.js](../../builder/glazing.js.md) — `PARTS`
- [js/shipgen/builder/hull.js](../../builder/hull.js.md) — `PARTS`
- [js/shipgen/builder/placement.js](../../builder/placement.js.md) — `PARTS`
- [js/shipgen/builder/weapons.js](../../builder/weapons.js.md) — `PARTS`
- [js/shipgen/data/loadouts.js](../loadouts.js.md) — `WEAPON_PART`
- [js/shipgen/generate.js](../../generate.js.md) — `PARTS`
- [js/shipgen/index.js](../../index.js.md) — `CATALOG`, `PARTS`, `WEAPON_PART`
- [js/ships/hullspec.js](../../../ships/hullspec.js.md) — `PARTS`, `WEAPON_PART`, `CATALOG`
- test/hullspec.test.mjs _(outside js/)_ — `PARTS`
- test/shipgen/audit-attach.mjs _(outside js/)_ — `PARTS`, `WEAPON_PART`
- test/shipgen/audit-bom.mjs _(outside js/)_ — `PARTS`
- test/shipgen/test-build.mjs _(outside js/)_ — `PARTS`, `WEAPON_PART`

## Exports

- [`CATALOG`](#s-CATALOG) · const — used by [js/shipgen/index.js](../../index.js.md), [js/ships/hullspec.js](../../../ships/hullspec.js.md)
- [`PARTS`](#s-PARTS) · const — used by [js/economy/shipcost.js](../../../economy/shipcost.js.md), [js/shipgen/builder/StarshipBuilder.js](../../builder/StarshipBuilder.js.md), [js/shipgen/builder/details.js](../../builder/details.js.md), [js/shipgen/builder/docking.js](../../builder/docking.js.md), [js/shipgen/builder/drives.js](../../builder/drives.js.md), [js/shipgen/builder/glazing.js](../../builder/glazing.js.md), [js/shipgen/builder/hull.js](../../builder/hull.js.md), [js/shipgen/builder/placement.js](../../builder/placement.js.md), [js/shipgen/builder/weapons.js](../../builder/weapons.js.md), [js/shipgen/generate.js](../../generate.js.md), [js/shipgen/index.js](../../index.js.md), [js/ships/hullspec.js](../../../ships/hullspec.js.md), test/hullspec.test.mjs, test/shipgen/audit-attach.mjs, test/shipgen/audit-bom.mjs, test/shipgen/test-build.mjs
- [`WEAPON_PART`](#s-WEAPON_PART) · const — used by [js/shipgen/data/loadouts.js](../loadouts.js.md), [js/shipgen/index.js](../../index.js.md), [js/ships/hullspec.js](../../../ships/hullspec.js.md), test/shipgen/audit-attach.mjs, test/shipgen/test-build.mjs

## Effects

_none detected_

## Symbols

### <a id="s-CATALOG"></a>`CATALOG`

const · **exported** · L23–23

<!-- note:CATALOG -->
<!-- /note -->

### <a id="s-PARTS"></a>`PARTS`

const · **exported** · L25–25

<!-- note:PARTS -->
<!-- /note -->

### <a id="s-WEAPON_PART"></a>`WEAPON_PART`

const · **exported** · L32–33

<!-- note:WEAPON_PART -->
weapon-family → catalog id, used by class doctrine
<!-- /note -->
