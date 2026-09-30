# js/shipgen/generate.js

[index](../../../README.md) · 139 lines · 8 symbols · 12 imports · 4 importers

## About

<!-- note:@file -->
generate.js — one-call entry point for the ship generator.

  import { buildShip } from ".../src/generate.js";
  const ship = buildShip({ seed: "NX-4412", shipClass: "corvette" });
  scene.add(ship.root);

Everything is optional. Anything you leave out is filled from DEFAULT_CFG, and the
parts list is filled from the class doctrine unless you pass your own `loadout`.
The result is deterministic for a given (seed, config): same input, same hull.
<!-- /note -->

## Imports

| line | from | names | target |
|---|---|---|---|
| 1 | `three` | `*` as `THREE` | external |
| 2 | `./core/rng.js` | `RNG` | [js/shipgen/core/rng.js](core/rng.js.md) |
| 3 | `./builder/StarshipBuilder.js` | `StarshipBuilder` | [js/shipgen/builder/StarshipBuilder.js](builder/StarshipBuilder.js.md) |
| 4 | `./data/classes.js` | `SHIP_CLASSES` | [js/shipgen/data/classes.js](data/classes.js.md) |
| 5 | `./data/drives.js` | `DRIVE_TYPES` | [js/shipgen/data/drives.js](data/drives.js.md) |
| 6 | `./data/weapons.js` | `WEAPON_TYPES` | [js/shipgen/data/weapons.js](data/weapons.js.md) |
| 7 | `./data/palettes.js` | `FACTION_PALETTES` | [js/shipgen/data/palettes.js](data/palettes.js.md) |
| 8 | `./data/catalog/index.js` | `PARTS` | [js/shipgen/data/catalog/index.js](data/catalog/index.js.md) |
| 9 | `./data/loadouts.js` | `doctrineLoadout`, `expandLoadout`, `CLASS_LOADOUT` | [js/shipgen/data/loadouts.js](data/loadouts.js.md) |
| 10 | `./data/flight.js` | `analyzeFlight` | [js/shipgen/data/flight.js](data/flight.js.md) |
| 11 | `./data/bom.js` | `shipBom` | [js/shipgen/data/bom.js](data/bom.js.md) |
| 12 | `./anim.js` | `newRegistry`, `collectInto`, `disposeShip` | [js/shipgen/anim.js](anim.js.md) |

## Imported by

- [js/shipgen/index.js](index.js.md) — `buildShip`, `releaseShip`, `randomConfig`, `shipBounds`, `loadoutFor`, `normalizeConfig`, `DEFAULT_CFG`
- [js/ships/shipforge.js](../ships/shipforge.js.md) — `buildShip`, `releaseShip`
- test/hullspec.test.mjs _(outside js/)_ — `normalizeConfig`, `loadoutFor`
- test/shipgen/test-ops.mjs _(outside js/)_ — `buildShip`, `randomConfig`, `shipBounds`, `releaseShip`

## Exports

- [`DEFAULT_CFG`](#s-DEFAULT_CFG) · const — used by [js/shipgen/index.js](index.js.md)
- [`loadoutFor`](#s-loadoutFor) · function — used by [js/shipgen/index.js](index.js.md), test/hullspec.test.mjs
- [`normalizeConfig`](#s-normalizeConfig) · function — used by [js/shipgen/index.js](index.js.md), test/hullspec.test.mjs
- [`buildShip`](#s-buildShip) · function — used by [js/shipgen/index.js](index.js.md), [js/ships/shipforge.js](../ships/shipforge.js.md), test/shipgen/test-ops.mjs
- [`releaseShip`](#s-releaseShip) · function — used by [js/shipgen/index.js](index.js.md), [js/ships/shipforge.js](../ships/shipforge.js.md), test/shipgen/test-ops.mjs
- [`randomConfig`](#s-randomConfig) · function — used by [js/shipgen/index.js](index.js.md), test/shipgen/test-ops.mjs
- [`shipBounds`](#s-shipBounds) · function — used by [js/shipgen/index.js](index.js.md), test/shipgen/test-ops.mjs
- `StarshipBuilder` — **no importer in scanned roots**
- `SHIP_CLASSES` — **no importer in scanned roots**
- `DRIVE_TYPES` — **no importer in scanned roots**
- `WEAPON_TYPES` — **no importer in scanned roots**
- `FACTION_PALETTES` — **no importer in scanned roots**
- `PARTS` — **no importer in scanned roots**
- `CLASS_LOADOUT` — **no importer in scanned roots**
- `expandLoadout` — **no importer in scanned roots**

## Effects

_none detected_

## Symbols

### <a id="s-DEFAULT_CFG"></a>`DEFAULT_CFG`

const · **exported** · L14–39

<!-- note:DEFAULT_CFG -->
Every knob the builder reads, with the values the yard shipped as neutral defaults.

- L16 · `shipClass: "corvette",` — key of SHIP_CLASSES
- L17 · `driveType: "auto",` — "auto" = the class's own drive, else a DRIVE_TYPES key
- L18 · `weaponSuite: "auto",` — "auto" | "mixed" | a WEAPON_TYPES key
- L19 · `designRegime: "auto",` — "auto" = the class's regime, else a DESIGN_REGIMES key
- L20 · `armDensity: 1,` — weapon count multiplier
- L24 · `complexity: 0.6,` — 0–1 greeble/detail density
- L29 · `finish: "brushed",` — brushed | matte | chrome | pearl | neon
<!-- /note -->

### <a id="s-TAG_GATES"></a>`TAG_GATES`

const · L41–47

<!-- note:TAG_GATES -->
Tag families each toggle switches off, so `sensors:false` etc. prune the loadout.
<!-- /note -->

### <a id="s-loadoutFor"></a>`loadoutFor(cfg)`

function · **exported** · L49–65

- calls: [`doctrineLoadout`](data/loadouts.js.md#s-doctrineLoadout) _js/shipgen/data/loadouts.js_
- called by: [`buildShip`](#s-buildShip)

<!-- note:loadoutFor -->
Doctrine loadout for a config, minus anything its toggles switched off.

- L59 · `if (tags.includes("scanner") !== isScanner) continue;` — scanning heads answer only to their own toggle
<!-- /note -->

### <a id="s-normalizeConfig"></a>`normalizeConfig(opts=)`

function · **exported** · L67–73

- called by: [`buildShip`](#s-buildShip)

<!-- note:normalizeConfig -->
Merge caller options over the defaults.
<!-- /note -->

### <a id="s-buildShip"></a>`buildShip(opts=)`

function · **exported** · L75–106

- calls: [`collectInto`](anim.js.md#s-collectInto) _js/shipgen/anim.js_ · [`newRegistry`](anim.js.md#s-newRegistry) _js/shipgen/anim.js_ · [`new StarshipBuilder`](builder/StarshipBuilder.js.md#s-StarshipBuilder) _js/shipgen/builder/StarshipBuilder.js_ · [`shipBom`](data/bom.js.md#s-shipBom) _js/shipgen/data/bom.js_ · [`analyzeFlight`](data/flight.js.md#s-analyzeFlight) _js/shipgen/data/flight.js_ · [`loadoutFor`](#s-loadoutFor) · [`normalizeConfig`](#s-normalizeConfig)
- called by: [`forgeShip`](../ships/shipforge.js.md#s-forgeShip) _js/ships/shipforge.js_

<!-- note:buildShip -->
Build one ship.
Returns { root, builder, cfg, anim, stats } — `root` is a THREE.Group ready to add to a
scene, `builder` is the StarshipBuilder instance (hardpoints, occupancy, materials,
docks) that flight/BOM analysis and the ops layer both want.

Options beyond DEFAULT_CFG:
  loadout  — explicit { partId: count } map, skips the doctrine roll
  analyze  — false to skip the flight + BOM pass (a little cheaper per ship)
  regime   — regime key for the flight analysis (default: the hull's own design regime)
<!-- /note -->

### <a id="s-releaseShip"></a>`releaseShip(root)`

function · **exported** · L108–108

- calls: [`disposeShip`](anim.js.md#s-disposeShip) _js/shipgen/anim.js_
- called by: [`releaseHull`](../ships/shipforge.js.md#s-releaseHull) _js/ships/shipforge.js_

<!-- note:releaseShip -->
Free the cloned materials a built ship owns. Call before dropping it from the scene.
<!-- /note -->

### <a id="s-randomConfig"></a>`randomConfig(seed=, overrides=)`

function · **exported** · L110–131

- calls: [`new RNG`](core/rng.js.md#s-RNG) _js/shipgen/core/rng.js_

<!-- note:randomConfig -->
A plausible random config — handy for fleets, traffic lanes and background dressing.
<!-- /note -->

### <a id="s-shipBounds"></a>`shipBounds(root)`

function · **exported** · L133–137

<!-- note:shipBounds -->
Fit a camera to a built ship: returns { center, radius, size } in world units.
<!-- /note -->
