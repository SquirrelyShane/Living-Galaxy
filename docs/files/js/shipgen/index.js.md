# js/shipgen/index.js

[index](../../../README.md) · 24 lines · 0 symbols · 0 imports · 0 importers

## About

<!-- note:@file -->
Public surface of the ship generator. Import from here unless you want a specific module.

  import { buildShip, tick, opsBind, opsUpdate, setOpsHost } from ".../src/index.js";

- L1 · `export { buildShip, releaseShip, randomConfig, shipBounds, loadoutFor, normalizeConfig, DE` — --- generation ----------------------------------------------------
- L6 · `export { SHIP_CLASSES, EQUIP_DEFAULT, CLASS_EQUIP } from "./data/classes.js";` — --- data tables ----------------------------------------------------
- L14 · `export { REGIMES, DESIGN_REGIMES, HULL_CD, analyzeFlight, optimizeDrag } from "./data/flig` — --- analysis -------------------------------------------------------
- L18 · `export { newRegistry, collectInto, disposeShip, tick } from "./anim.js";` — --- idle animation (thrusters, spins, lamps, sensor sweeps) ---------
- L20 · `export { setOpsHost, host } from "./ops/host.js";` — --- live systems (fire control, mining, docking, deployables) -------
<!-- /note -->

## Imports

| line | from | names | target |
|---|---|---|---|
| 1 | `./generate.js` | re-export `buildShip`, `releaseShip`, `randomConfig`, `shipBounds`, `loadoutFor`, `normalizeConfig`, `DEFAULT_CFG` | [js/shipgen/generate.js](generate.js.md) |
| 2 | `./builder/StarshipBuilder.js` | re-export `StarshipBuilder` | [js/shipgen/builder/StarshipBuilder.js](builder/StarshipBuilder.js.md) |
| 3 | `./core/rng.js` | re-export `RNG` | [js/shipgen/core/rng.js](core/rng.js.md) |
| 4 | `./core/geometry.js` | re-export `G`, `FINISHES`, `makeMat`, `addMesh`, `wingShape`, `disposeDeep` | [js/shipgen/core/geometry.js](core/geometry.js.md) |
| 6 | `./data/classes.js` | re-export `SHIP_CLASSES`, `EQUIP_DEFAULT`, `CLASS_EQUIP` | [js/shipgen/data/classes.js](data/classes.js.md) |
| 7 | `./data/drives.js` | re-export `DRIVE_TYPES` | [js/shipgen/data/drives.js](data/drives.js.md) |
| 8 | `./data/weapons.js` | re-export `WEAPON_TYPES` | [js/shipgen/data/weapons.js](data/weapons.js.md) |
| 9 | `./data/palettes.js` | re-export `FACTION_PALETTES` | [js/shipgen/data/palettes.js](data/palettes.js.md) |
| 10 | `./data/catalog/index.js` | re-export `CATALOG`, `PARTS`, `WEAPON_PART` | [js/shipgen/data/catalog/index.js](data/catalog/index.js.md) |
| 11 | `./prefabs/index.js` | re-export `PREFABS`, `ALL_FACES`, `fpArea` | [js/shipgen/prefabs/index.js](prefabs/index.js.md) |
| 12 | `./data/loadouts.js` | re-export `CORE`, `CLASS_LOADOUT`, `expandLoadout`, `doctrineLoadout` | [js/shipgen/data/loadouts.js](data/loadouts.js.md) |
| 14 | `./data/flight.js` | re-export `REGIMES`, `DESIGN_REGIMES`, `HULL_CD`, `analyzeFlight`, `optimizeDrag` | [js/shipgen/data/flight.js](data/flight.js.md) |
| 15 | `./data/materials.js` | re-export `MATERIALS`, `COMPONENTS` | [js/shipgen/data/materials.js](data/materials.js.md) |
| 16 | `./data/bom.js` | re-export `partBom`, `expandBom`, `bomMass`, `hullBom`, `shipBom` | [js/shipgen/data/bom.js](data/bom.js.md) |
| 18 | `./anim.js` | re-export `newRegistry`, `collectInto`, `disposeShip`, `tick` | [js/shipgen/anim.js](anim.js.md) |
| 20 | `./ops/host.js` | re-export `setOpsHost`, `host` | [js/shipgen/ops/host.js](ops/host.js.md) |
| 21 | `./ops/rig.js` | re-export `rig` | [js/shipgen/ops/rig.js](ops/rig.js.md) |
| 22 | `./ops/ops.js` | re-export `ops`, `opsBind`, `opsUpdate`, `doScan`, `startMining`, `stopMining`, `aimAngles`, `fireShot`, `fireLauncher`, `targetDrone`, `colliderGroup` | [js/shipgen/ops/ops.js](ops/ops.js.md) |
| 24 | `./ops/fx.js` | re-export `fxUpdate` | [js/shipgen/ops/fx.js](ops/fx.js.md) |

## Imported by

_nothing scanned imports this file — entry point, loaded by path, or dead_

## Exports

- `buildShip` · from `./generate.js` — **no importer in scanned roots**
- `releaseShip` · from `./generate.js` — **no importer in scanned roots**
- `randomConfig` · from `./generate.js` — **no importer in scanned roots**
- `shipBounds` · from `./generate.js` — **no importer in scanned roots**
- `loadoutFor` · from `./generate.js` — **no importer in scanned roots**
- `normalizeConfig` · from `./generate.js` — **no importer in scanned roots**
- `DEFAULT_CFG` · from `./generate.js` — **no importer in scanned roots**
- `StarshipBuilder` · from `./builder/StarshipBuilder.js` — **no importer in scanned roots**
- `RNG` · from `./core/rng.js` — **no importer in scanned roots**
- `G` · from `./core/geometry.js` — **no importer in scanned roots**
- `FINISHES` · from `./core/geometry.js` — **no importer in scanned roots**
- `makeMat` · from `./core/geometry.js` — **no importer in scanned roots**
- `addMesh` · from `./core/geometry.js` — **no importer in scanned roots**
- `wingShape` · from `./core/geometry.js` — **no importer in scanned roots**
- `disposeDeep` · from `./core/geometry.js` — **no importer in scanned roots**
- `SHIP_CLASSES` · from `./data/classes.js` — **no importer in scanned roots**
- `EQUIP_DEFAULT` · from `./data/classes.js` — **no importer in scanned roots**
- `CLASS_EQUIP` · from `./data/classes.js` — **no importer in scanned roots**
- `DRIVE_TYPES` · from `./data/drives.js` — **no importer in scanned roots**
- `WEAPON_TYPES` · from `./data/weapons.js` — **no importer in scanned roots**
- `FACTION_PALETTES` · from `./data/palettes.js` — **no importer in scanned roots**
- `CATALOG` · from `./data/catalog/index.js` — **no importer in scanned roots**
- `PARTS` · from `./data/catalog/index.js` — **no importer in scanned roots**
- `WEAPON_PART` · from `./data/catalog/index.js` — **no importer in scanned roots**
- `PREFABS` · from `./prefabs/index.js` — **no importer in scanned roots**
- `ALL_FACES` · from `./prefabs/index.js` — **no importer in scanned roots**
- `fpArea` · from `./prefabs/index.js` — **no importer in scanned roots**
- `CORE` · from `./data/loadouts.js` — **no importer in scanned roots**
- `CLASS_LOADOUT` · from `./data/loadouts.js` — **no importer in scanned roots**
- `expandLoadout` · from `./data/loadouts.js` — **no importer in scanned roots**
- `doctrineLoadout` · from `./data/loadouts.js` — **no importer in scanned roots**
- `REGIMES` · from `./data/flight.js` — **no importer in scanned roots**
- `DESIGN_REGIMES` · from `./data/flight.js` — **no importer in scanned roots**
- `HULL_CD` · from `./data/flight.js` — **no importer in scanned roots**
- `analyzeFlight` · from `./data/flight.js` — **no importer in scanned roots**
- `optimizeDrag` · from `./data/flight.js` — **no importer in scanned roots**
- `MATERIALS` · from `./data/materials.js` — **no importer in scanned roots**
- `COMPONENTS` · from `./data/materials.js` — **no importer in scanned roots**
- `partBom` · from `./data/bom.js` — **no importer in scanned roots**
- `expandBom` · from `./data/bom.js` — **no importer in scanned roots**
- `bomMass` · from `./data/bom.js` — **no importer in scanned roots**
- `hullBom` · from `./data/bom.js` — **no importer in scanned roots**
- `shipBom` · from `./data/bom.js` — **no importer in scanned roots**
- `newRegistry` · from `./anim.js` — **no importer in scanned roots**
- `collectInto` · from `./anim.js` — **no importer in scanned roots**
- `disposeShip` · from `./anim.js` — **no importer in scanned roots**
- `tick` · from `./anim.js` — **no importer in scanned roots**
- `setOpsHost` · from `./ops/host.js` — **no importer in scanned roots**
- `host` · from `./ops/host.js` — **no importer in scanned roots**
- `rig` · from `./ops/rig.js` — **no importer in scanned roots**
- `ops` · from `./ops/ops.js` — **no importer in scanned roots**
- `opsBind` · from `./ops/ops.js` — **no importer in scanned roots**
- `opsUpdate` · from `./ops/ops.js` — **no importer in scanned roots**
- `doScan` · from `./ops/ops.js` — **no importer in scanned roots**
- `startMining` · from `./ops/ops.js` — **no importer in scanned roots**
- `stopMining` · from `./ops/ops.js` — **no importer in scanned roots**
- `aimAngles` · from `./ops/ops.js` — **no importer in scanned roots**
- `fireShot` · from `./ops/ops.js` — **no importer in scanned roots**
- `fireLauncher` · from `./ops/ops.js` — **no importer in scanned roots**
- `targetDrone` · from `./ops/ops.js` — **no importer in scanned roots**
- `colliderGroup` · from `./ops/ops.js` — **no importer in scanned roots**
- `fxUpdate` · from `./ops/fx.js` — **no importer in scanned roots**

## Effects

_none detected_

## Symbols

_none_
