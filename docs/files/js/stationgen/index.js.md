# js/stationgen/index.js

[index](../../../README.md) · 17 lines · 0 symbols · 0 imports · 2 importers

## About

<!-- note:@file -->
Public surface of the station generator. Import from here.
<!-- /note -->

## Imports

| line | from | names | target |
|---|---|---|---|
| 1 | `./generate.js` | re-export `buildStation`, `releaseStation`, `randomConfig`, `normalizeConfig`, `stationBounds`, `DEFAULT_CFG` | [js/stationgen/generate.js](generate.js.md) |
| 2 | `./builder/StationBuilder.js` | re-export `StationBuilder` | [js/stationgen/builder/StationBuilder.js](builder/StationBuilder.js.md) |
| 3 | `./builder/hull.js` | re-export `STYLES` | [js/stationgen/builder/hull.js](builder/hull.js.md) |
| 4 | `./builder/hangar.js` | re-export `HANGAR`, `MOUTHS`, `HANGAR_FORMS`, `hangarPlan` | [js/stationgen/builder/hangar.js](builder/hangar.js.md) |
| 5 | `./data/styles.js` | re-export `STYLES_ARCH`, `STYLE_KEYS`, `roll` | [js/stationgen/data/styles.js](data/styles.js.md) |
| 6 | `./prefabs/forms.js` | re-export `FORMS`, `FORM_KEYS`, `DECOR`, `body`, `decorate` | [js/stationgen/prefabs/forms.js](prefabs/forms.js.md) |
| 7 | `./core/rng.js` | re-export `RNG` | [js/stationgen/core/rng.js](core/rng.js.md) |
| 8 | `./core/geometry.js` | re-export `G`, `makeMat`, `addMesh`, `mergeStatic`, `instanced`, `disposeOwned` | [js/stationgen/core/geometry.js](core/geometry.js.md) |
| 9 | `./data/modules.js` | re-export `MODULES`, `MODULE_COUNT`, `REQUIRED`, `ZONE` | [js/stationgen/data/modules.js](data/modules.js.md) |
| 10 | `./data/parts.js` | re-export `PARTS`, `PART_DOMAINS`, `PART_COUNT` | [js/stationgen/data/parts.js](data/parts.js.md) |
| 11 | `./data/materials.js` | re-export `MATERIALS`, `FAB_RATE`, `ALLOYS`, `ALLOY_KEYS` | [js/stationgen/data/materials.js](data/materials.js.md) |
| 12 | `./data/archetypes.js` | re-export `ARCHETYPES`, `ARCHETYPE_KEYS` | [js/stationgen/data/archetypes.js](data/archetypes.js.md) |
| 13 | `./data/tiers.js` | re-export `TIERS`, `TIER_KEYS` | [js/stationgen/data/tiers.js](data/tiers.js.md) |
| 14 | `./data/doctrine.js` | re-export `doctrineFor`, `manifestOf` | [js/stationgen/data/doctrine.js](data/doctrine.js.md) |
| 15 | `./data/bom.js` | re-export `partBom`, `partCost`, `moduleParts`, `moduleBom`, `stationBom` | [js/stationgen/data/bom.js](data/bom.js.md) |
| 16 | `./prefabs/modules.js` | re-export `PREFABS` | [js/stationgen/prefabs/modules.js](prefabs/modules.js.md) |
| 17 | `./anim.js` | re-export `newRegistry`, `collectInto`, `tick`, `disposeAnim`, `bake` | [js/stationgen/anim.js](anim.js.md) |

## Imported by

- [js/station/stationyard.js](../station/stationyard.js.md) — `buildStation`, `releaseStation`, `MODULES`
- test/stationgen/test-build.mjs _(outside js/)_ — `buildStation`, `releaseStation`, `randomConfig`, `ARCHETYPE_KEYS`, `TIER_KEYS`, `MODULES`, `PARTS`, `MATERIALS`, `ALLOYS`, `REQUIRED`, `HANGAR`, `MOUTHS`, `HANGAR_FORMS`, `STYLES`, `STYLES_ARCH`, `STYLE_KEYS`, `FORM_KEYS`, `tick`, `doctrineFor`, `manifestOf`, `stationBom`, `moduleParts`

## Exports

- `buildStation` · from `./generate.js` — used by [js/station/stationyard.js](../station/stationyard.js.md), test/stationgen/test-build.mjs
- `releaseStation` · from `./generate.js` — used by [js/station/stationyard.js](../station/stationyard.js.md), test/stationgen/test-build.mjs
- `randomConfig` · from `./generate.js` — used by test/stationgen/test-build.mjs
- `normalizeConfig` · from `./generate.js` — **no importer in scanned roots**
- `stationBounds` · from `./generate.js` — **no importer in scanned roots**
- `DEFAULT_CFG` · from `./generate.js` — **no importer in scanned roots**
- `StationBuilder` · from `./builder/StationBuilder.js` — **no importer in scanned roots**
- `STYLES` · from `./builder/hull.js` — used by test/stationgen/test-build.mjs
- `HANGAR` · from `./builder/hangar.js` — used by test/stationgen/test-build.mjs
- `MOUTHS` · from `./builder/hangar.js` — used by test/stationgen/test-build.mjs
- `HANGAR_FORMS` · from `./builder/hangar.js` — used by test/stationgen/test-build.mjs
- `hangarPlan` · from `./builder/hangar.js` — **no importer in scanned roots**
- `STYLES_ARCH` · from `./data/styles.js` — used by test/stationgen/test-build.mjs
- `STYLE_KEYS` · from `./data/styles.js` — used by test/stationgen/test-build.mjs
- `roll` · from `./data/styles.js` — **no importer in scanned roots**
- `FORMS` · from `./prefabs/forms.js` — **no importer in scanned roots**
- `FORM_KEYS` · from `./prefabs/forms.js` — used by test/stationgen/test-build.mjs
- `DECOR` · from `./prefabs/forms.js` — **no importer in scanned roots**
- `body` · from `./prefabs/forms.js` — **no importer in scanned roots**
- `decorate` · from `./prefabs/forms.js` — **no importer in scanned roots**
- `RNG` · from `./core/rng.js` — **no importer in scanned roots**
- `G` · from `./core/geometry.js` — **no importer in scanned roots**
- `makeMat` · from `./core/geometry.js` — **no importer in scanned roots**
- `addMesh` · from `./core/geometry.js` — **no importer in scanned roots**
- `mergeStatic` · from `./core/geometry.js` — **no importer in scanned roots**
- `instanced` · from `./core/geometry.js` — **no importer in scanned roots**
- `disposeOwned` · from `./core/geometry.js` — **no importer in scanned roots**
- `MODULES` · from `./data/modules.js` — used by [js/station/stationyard.js](../station/stationyard.js.md), test/stationgen/test-build.mjs
- `MODULE_COUNT` · from `./data/modules.js` — **no importer in scanned roots**
- `REQUIRED` · from `./data/modules.js` — used by test/stationgen/test-build.mjs
- `ZONE` · from `./data/modules.js` — **no importer in scanned roots**
- `PARTS` · from `./data/parts.js` — used by test/stationgen/test-build.mjs
- `PART_DOMAINS` · from `./data/parts.js` — **no importer in scanned roots**
- `PART_COUNT` · from `./data/parts.js` — **no importer in scanned roots**
- `MATERIALS` · from `./data/materials.js` — used by test/stationgen/test-build.mjs
- `FAB_RATE` · from `./data/materials.js` — **no importer in scanned roots**
- `ALLOYS` · from `./data/materials.js` — used by test/stationgen/test-build.mjs
- `ALLOY_KEYS` · from `./data/materials.js` — **no importer in scanned roots**
- `ARCHETYPES` · from `./data/archetypes.js` — **no importer in scanned roots**
- `ARCHETYPE_KEYS` · from `./data/archetypes.js` — used by test/stationgen/test-build.mjs
- `TIERS` · from `./data/tiers.js` — **no importer in scanned roots**
- `TIER_KEYS` · from `./data/tiers.js` — used by test/stationgen/test-build.mjs
- `doctrineFor` · from `./data/doctrine.js` — used by test/stationgen/test-build.mjs
- `manifestOf` · from `./data/doctrine.js` — used by test/stationgen/test-build.mjs
- `partBom` · from `./data/bom.js` — **no importer in scanned roots**
- `partCost` · from `./data/bom.js` — **no importer in scanned roots**
- `moduleParts` · from `./data/bom.js` — used by test/stationgen/test-build.mjs
- `moduleBom` · from `./data/bom.js` — **no importer in scanned roots**
- `stationBom` · from `./data/bom.js` — used by test/stationgen/test-build.mjs
- `PREFABS` · from `./prefabs/modules.js` — **no importer in scanned roots**
- `newRegistry` · from `./anim.js` — **no importer in scanned roots**
- `collectInto` · from `./anim.js` — **no importer in scanned roots**
- `tick` · from `./anim.js` — used by test/stationgen/test-build.mjs
- `disposeAnim` · from `./anim.js` — **no importer in scanned roots**
- `bake` · from `./anim.js` — **no importer in scanned roots**

## Effects

_none detected_

## Symbols

_none_
