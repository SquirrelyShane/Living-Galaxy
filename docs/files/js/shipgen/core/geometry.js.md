# js/shipgen/core/geometry.js

[index](../../../../README.md) · 86 lines · 20 symbols · 1 imports · 17 importers

## About

<!-- note:@file -->
Shared unit geometries (cached), material factory and the addMesh placement helper.
<!-- /note -->

## Imports

| line | from | names | target |
|---|---|---|---|
| 1 | `three` | `*` as `THREE` | external |

## Imported by

- [js/shipgen/builder/StarshipBuilder.js](../builder/StarshipBuilder.js.md) — `G`, `makeMat`, `addMesh`, `wingShape`, `FINISHES`
- [js/shipgen/builder/details.js](../builder/details.js.md) — `G`, `makeMat`, `addMesh`, `wingShape`
- [js/shipgen/builder/docking.js](../builder/docking.js.md) — `G`, `makeMat`, `addMesh`, `wingShape`
- [js/shipgen/builder/drives.js](../builder/drives.js.md) — `G`, `makeMat`, `addMesh`, `wingShape`
- [js/shipgen/builder/glazing.js](../builder/glazing.js.md) — `G`, `makeMat`, `addMesh`, `wingShape`
- [js/shipgen/builder/hull.js](../builder/hull.js.md) — `G`, `makeMat`, `addMesh`, `wingShape`
- [js/shipgen/builder/placement.js](../builder/placement.js.md) — `G`, `makeMat`, `addMesh`, `wingShape`
- [js/shipgen/builder/weapons.js](../builder/weapons.js.md) — `G`, `makeMat`, `addMesh`, `wingShape`
- [js/shipgen/index.js](../index.js.md) — `G`, `FINISHES`, `makeMat`, `addMesh`, `wingShape`, `disposeDeep`
- [js/shipgen/prefabs/acs.js](../prefabs/acs.js.md) — `G`, `addMesh`
- [js/shipgen/prefabs/docking.js](../prefabs/docking.js.md) — `G`, `addMesh`
- [js/shipgen/prefabs/extra.js](../prefabs/extra.js.md) — `G`, `addMesh`
- [js/shipgen/prefabs/industrial.js](../prefabs/industrial.js.md) — `G`, `addMesh`
- [js/shipgen/prefabs/internal.js](../prefabs/internal.js.md) — `G`, `addMesh`
- [js/shipgen/prefabs/power.js](../prefabs/power.js.md) — `G`, `addMesh`
- [js/shipgen/prefabs/sensors.js](../prefabs/sensors.js.md) — `G`, `addMesh`
- [js/shipgen/prefabs/structure.js](../prefabs/structure.js.md) — `G`, `addMesh`

## Exports

- [`disposeDeep`](#s-disposeDeep) · function — used by [js/shipgen/index.js](../index.js.md)
- [`G`](#s-G) · const — used by [js/shipgen/builder/StarshipBuilder.js](../builder/StarshipBuilder.js.md), [js/shipgen/builder/details.js](../builder/details.js.md), [js/shipgen/builder/docking.js](../builder/docking.js.md), [js/shipgen/builder/drives.js](../builder/drives.js.md), [js/shipgen/builder/glazing.js](../builder/glazing.js.md), [js/shipgen/builder/hull.js](../builder/hull.js.md), [js/shipgen/builder/placement.js](../builder/placement.js.md), [js/shipgen/builder/weapons.js](../builder/weapons.js.md), [js/shipgen/index.js](../index.js.md), [js/shipgen/prefabs/acs.js](../prefabs/acs.js.md), [js/shipgen/prefabs/docking.js](../prefabs/docking.js.md), [js/shipgen/prefabs/extra.js](../prefabs/extra.js.md), [js/shipgen/prefabs/industrial.js](../prefabs/industrial.js.md), [js/shipgen/prefabs/internal.js](../prefabs/internal.js.md), [js/shipgen/prefabs/power.js](../prefabs/power.js.md), [js/shipgen/prefabs/sensors.js](../prefabs/sensors.js.md), [js/shipgen/prefabs/structure.js](../prefabs/structure.js.md)
- [`FINISHES`](#s-FINISHES) · const — used by [js/shipgen/builder/StarshipBuilder.js](../builder/StarshipBuilder.js.md), [js/shipgen/index.js](../index.js.md)
- [`makeMat`](#s-makeMat) · function — used by [js/shipgen/builder/StarshipBuilder.js](../builder/StarshipBuilder.js.md), [js/shipgen/builder/details.js](../builder/details.js.md), [js/shipgen/builder/docking.js](../builder/docking.js.md), [js/shipgen/builder/drives.js](../builder/drives.js.md), [js/shipgen/builder/glazing.js](../builder/glazing.js.md), [js/shipgen/builder/hull.js](../builder/hull.js.md), [js/shipgen/builder/placement.js](../builder/placement.js.md), [js/shipgen/builder/weapons.js](../builder/weapons.js.md), [js/shipgen/index.js](../index.js.md)
- [`addMesh`](#s-addMesh) · function — used by [js/shipgen/builder/StarshipBuilder.js](../builder/StarshipBuilder.js.md), [js/shipgen/builder/details.js](../builder/details.js.md), [js/shipgen/builder/docking.js](../builder/docking.js.md), [js/shipgen/builder/drives.js](../builder/drives.js.md), [js/shipgen/builder/glazing.js](../builder/glazing.js.md), [js/shipgen/builder/hull.js](../builder/hull.js.md), [js/shipgen/builder/placement.js](../builder/placement.js.md), [js/shipgen/builder/weapons.js](../builder/weapons.js.md), [js/shipgen/index.js](../index.js.md), [js/shipgen/prefabs/acs.js](../prefabs/acs.js.md), [js/shipgen/prefabs/docking.js](../prefabs/docking.js.md), [js/shipgen/prefabs/extra.js](../prefabs/extra.js.md), [js/shipgen/prefabs/industrial.js](../prefabs/industrial.js.md), [js/shipgen/prefabs/internal.js](../prefabs/internal.js.md), [js/shipgen/prefabs/power.js](../prefabs/power.js.md), [js/shipgen/prefabs/sensors.js](../prefabs/sensors.js.md), [js/shipgen/prefabs/structure.js](../prefabs/structure.js.md)
- [`wingShape`](#s-wingShape) · function — used by [js/shipgen/builder/StarshipBuilder.js](../builder/StarshipBuilder.js.md), [js/shipgen/builder/details.js](../builder/details.js.md), [js/shipgen/builder/docking.js](../builder/docking.js.md), [js/shipgen/builder/drives.js](../builder/drives.js.md), [js/shipgen/builder/glazing.js](../builder/glazing.js.md), [js/shipgen/builder/hull.js](../builder/hull.js.md), [js/shipgen/builder/placement.js](../builder/placement.js.md), [js/shipgen/builder/weapons.js](../builder/weapons.js.md), [js/shipgen/index.js](../index.js.md)

## Effects

_none detected_

## Symbols

### <a id="s-geoCache"></a>`geoCache`

const · L3–3

<!-- note:geoCache -->
<!-- /note -->

### <a id="s-cached"></a>`cached(key, factory)`

function · L4–7

- called by: [`G.box`](#s-G-box) · [`G.cone`](#s-G-cone) · [`G.coneOpen`](#s-G-coneOpen) · [`G.cyl`](#s-G-cyl) · [`G.disc`](#s-G-disc) · [`G.dome`](#s-G-dome) · [`G.plume`](#s-G-plume) · [`G.ring`](#s-G-ring) · [`G.sphere`](#s-G-sphere) · [`G.taper`](#s-G-taper) · [`G.torus`](#s-G-torus) · [`G.tube`](#s-G-tube)

<!-- note:cached -->
<!-- /note -->

### <a id="s-disposeDeep"></a>`disposeDeep(root)`

function · **exported** · L8–16

<!-- note:disposeDeep -->
free everything a throwaway ship owns: per-build materials and any geometry that is not a shared unit primitive
<!-- /note -->

### <a id="s-G"></a>`G`

const · **exported** · L17–30

<!-- note:G -->
<!-- /note -->

#### <a id="s-G-box"></a>`G.box()`

prop · L18–18

- calls: [`cached`](#s-cached)

<!-- note:G.box -->
<!-- /note -->

#### <a id="s-G-sphere"></a>`G.sphere()`

prop · L19–19

- calls: [`cached`](#s-cached)

<!-- note:G.sphere -->
<!-- /note -->

#### <a id="s-G-dome"></a>`G.dome()`

prop · L20–20

- calls: [`cached`](#s-cached)

<!-- note:G.dome -->
<!-- /note -->

#### <a id="s-G-cyl"></a>`G.cyl(seg=)`

prop · L21–21

- calls: [`cached`](#s-cached)

<!-- note:G.cyl -->
<!-- /note -->

#### <a id="s-G-tube"></a>`G.tube(seg=)`

prop · L22–22

- calls: [`cached`](#s-cached)

<!-- note:G.tube -->
<!-- /note -->

#### <a id="s-G-taper"></a>`G.taper(r, seg=)`

prop · L23–23

- calls: [`cached`](#s-cached)

<!-- note:G.taper -->
<!-- /note -->

#### <a id="s-G-cone"></a>`G.cone(seg=)`

prop · L24–24

- calls: [`cached`](#s-cached)

<!-- note:G.cone -->
<!-- /note -->

#### <a id="s-G-coneOpen"></a>`G.coneOpen(seg=)`

prop · L25–25

- calls: [`cached`](#s-cached)

<!-- note:G.coneOpen -->
<!-- /note -->

#### <a id="s-G-torus"></a>`G.torus(t=)`

prop · L26–26

- calls: [`cached`](#s-cached)

<!-- note:G.torus -->
<!-- /note -->

#### <a id="s-G-ring"></a>`G.ring()`

prop · L27–27

- calls: [`cached`](#s-cached)

<!-- note:G.ring -->
<!-- /note -->

#### <a id="s-G-plume"></a>`G.plume(seg=)`

prop · L28–28

- calls: [`cached`](#s-cached)

<!-- note:G.plume -->
exhaust cone with its base on the origin so it grows out of the nozzle instead of about its centre
<!-- /note -->

#### <a id="s-G-disc"></a>`G.disc()`

prop · L29–29

- calls: [`cached`](#s-cached)

<!-- note:G.disc -->
<!-- /note -->

### <a id="s-FINISHES"></a>`FINISHES`

const · **exported** · L32–38

<!-- note:FINISHES -->
finish presets applied on top of the base material recipe
<!-- /note -->

### <a id="s-makeMat"></a>`makeMat(color, extras=)`

function · **exported** · L39–62

- called by: [`StarshipBuilder.build`](../builder/StarshipBuilder.js.md#s-StarshipBuilder-build) _js/shipgen/builder/StarshipBuilder.js_ ×16 · [`StarshipBuilder.build>skin`](../builder/StarshipBuilder.js.md#s-StarshipBuilder-build-skin) _js/shipgen/builder/StarshipBuilder.js_ · [`StarshipBuilder.lamp`](../builder/StarshipBuilder.js.md#s-StarshipBuilder-lamp) _js/shipgen/builder/StarshipBuilder.js_

<!-- note:makeMat -->
<!-- /note -->

### <a id="s-addMesh"></a>`addMesh(parent, geo, mat, x, y, z, rx=, ry=, rz=, sx=, sy=, sz=)`

function · **exported** · L64–73

- called by: [`StarshipBuilder.lamp`](../builder/StarshipBuilder.js.md#s-StarshipBuilder-lamp) _js/shipgen/builder/StarshipBuilder.js_ · [`StarshipBuilder.vol`](../builder/StarshipBuilder.js.md#s-StarshipBuilder-vol) _js/shipgen/builder/StarshipBuilder.js_ · [`addGreebles`](../builder/details.js.md#s-addGreebles) _js/shipgen/builder/details.js_ · [`dockBody`](../builder/docking.js.md#s-dockBody) _js/shipgen/builder/docking.js_ ×9 · [`addEngines`](../builder/drives.js.md#s-addEngines) _js/shipgen/builder/drives.js_ · [`drive_antimatter`](../builder/drives.js.md#s-drive_antimatter) _js/shipgen/builder/drives.js_ ×5 · [`drive_fusion`](../builder/drives.js.md#s-drive_fusion) _js/shipgen/builder/drives.js_ ×5 · [`drive_gravitic`](../builder/drives.js.md#s-drive_gravitic) _js/shipgen/builder/drives.js_ ×4 · [`drive_hall`](../builder/drives.js.md#s-drive_hall) _js/shipgen/builder/drives.js_ ×6 · [`drive_hydrogen`](../builder/drives.js.md#s-drive_hydrogen) _js/shipgen/builder/drives.js_ ×7 · [`drive_ion`](../builder/drives.js.md#s-drive_ion) _js/shipgen/builder/drives.js_ ×4 · [`drive_micro`](../builder/drives.js.md#s-drive_micro) _js/shipgen/builder/drives.js_ ×5 · [`drive_ntr`](../builder/drives.js.md#s-drive_ntr) _js/shipgen/builder/drives.js_ ×7 · [`drive_plasma`](../builder/drives.js.md#s-drive_plasma) _js/shipgen/builder/drives.js_ ×4 · [`drive_pulse`](../builder/drives.js.md#s-drive_pulse) _js/shipgen/builder/drives.js_ ×3 · [`drive_vector`](../builder/drives.js.md#s-drive_vector) _js/shipgen/builder/drives.js_ ×5 · [`plume`](../builder/drives.js.md#s-plume) _js/shipgen/builder/drives.js_ ×2 · [`plume>mk`](../builder/drives.js.md#s-plume-mk) _js/shipgen/builder/drives.js_ · [`addWindows`](../builder/glazing.js.md#s-addWindows) _js/shipgen/builder/glazing.js_ ×10 · [`addFairings`](../builder/hull.js.md#s-addFairings) _js/shipgen/builder/hull.js_ ×2 · [`addHeatShield`](../builder/hull.js.md#s-addHeatShield) _js/shipgen/builder/hull.js_ ×5 · [`addHull`](../builder/hull.js.md#s-addHull) _js/shipgen/builder/hull.js_ ×44 · [`addNose`](../builder/hull.js.md#s-addNose) _js/shipgen/builder/hull.js_ ×25 · [`addSuperstructure`](../builder/hull.js.md#s-addSuperstructure) _js/shipgen/builder/hull.js_ ×6 · [`addWings`](../builder/hull.js.md#s-addWings) _js/shipgen/builder/hull.js_ ×8 · [`wpn_auto`](../builder/weapons.js.md#s-wpn_auto) _js/shipgen/builder/weapons.js_ ×6 · [`wpn_beam`](../builder/weapons.js.md#s-wpn_beam) _js/shipgen/builder/weapons.js_ ×6 · [`wpn_chaff`](../builder/weapons.js.md#s-wpn_chaff) _js/shipgen/builder/weapons.js_ ×3 · [`wpn_ciws`](../builder/weapons.js.md#s-wpn_ciws) _js/shipgen/builder/weapons.js_ ×5 · [`wpn_coil`](../builder/weapons.js.md#s-wpn_coil) _js/shipgen/builder/weapons.js_ ×6 · [`wpn_flak`](../builder/weapons.js.md#s-wpn_flak) _js/shipgen/builder/weapons.js_ ×4 · [`wpn_lance`](../builder/weapons.js.md#s-wpn_lance) _js/shipgen/builder/weapons.js_ ×5 · [`wpn_mines`](../builder/weapons.js.md#s-wpn_mines) _js/shipgen/builder/weapons.js_ ×3 · [`wpn_missile`](../builder/weapons.js.md#s-wpn_missile) _js/shipgen/builder/weapons.js_ ×5 · [`wpn_particle`](../builder/weapons.js.md#s-wpn_particle) _js/shipgen/builder/weapons.js_ ×5 · [`wpn_pdc`](../builder/weapons.js.md#s-wpn_pdc) _js/shipgen/builder/weapons.js_ ×5 · [`wpn_plasma`](../builder/weapons.js.md#s-wpn_plasma) _js/shipgen/builder/weapons.js_ ×6 · [`wpn_railgun`](../builder/weapons.js.md#s-wpn_railgun) _js/shipgen/builder/weapons.js_ ×6 · [`wpn_torpedo`](../builder/weapons.js.md#s-wpn_torpedo) _js/shipgen/builder/weapons.js_ ×4 · [`build`](../prefabs/acs.js.md#s-build) _js/shipgen/prefabs/acs.js_ ×2 · [`build~2`](../prefabs/acs.js.md#s-build-2) _js/shipgen/prefabs/acs.js_ ×5 · [`build~3`](../prefabs/acs.js.md#s-build-3) _js/shipgen/prefabs/acs.js_ ×3 · [`build~4`](../prefabs/acs.js.md#s-build-4) _js/shipgen/prefabs/acs.js_ ×6 · [`build~2`](../prefabs/docking.js.md#s-build-2) _js/shipgen/prefabs/docking.js_ ×6 · [`build~3`](../prefabs/docking.js.md#s-build-3) _js/shipgen/prefabs/docking.js_ ×6 · [`build~4`](../prefabs/docking.js.md#s-build-4) _js/shipgen/prefabs/docking.js_ ×4 · [`build`](../prefabs/extra.js.md#s-build) _js/shipgen/prefabs/extra.js_ ×5 · [`build~2`](../prefabs/extra.js.md#s-build-2) _js/shipgen/prefabs/extra.js_ ×5 · [`build~3`](../prefabs/extra.js.md#s-build-3) _js/shipgen/prefabs/extra.js_ ×3 · [`build~4`](../prefabs/extra.js.md#s-build-4) _js/shipgen/prefabs/extra.js_ ×3 · [`build~5`](../prefabs/extra.js.md#s-build-5) _js/shipgen/prefabs/extra.js_ ×4 · [`build~6`](../prefabs/extra.js.md#s-build-6) _js/shipgen/prefabs/extra.js_ ×5 · [`build~7`](../prefabs/extra.js.md#s-build-7) _js/shipgen/prefabs/extra.js_ ×5 · [`build~8`](../prefabs/extra.js.md#s-build-8) _js/shipgen/prefabs/extra.js_ ×4 · [`build`](../prefabs/industrial.js.md#s-build) _js/shipgen/prefabs/industrial.js_ ×9 · [`build~2`](../prefabs/industrial.js.md#s-build-2) _js/shipgen/prefabs/industrial.js_ ×4 · [`build~3`](../prefabs/industrial.js.md#s-build-3) _js/shipgen/prefabs/industrial.js_ ×6 · [`build~4`](../prefabs/industrial.js.md#s-build-4) _js/shipgen/prefabs/industrial.js_ ×5 · [`build`](../prefabs/internal.js.md#s-build) _js/shipgen/prefabs/internal.js_ ×5 · [`build~2`](../prefabs/internal.js.md#s-build-2) _js/shipgen/prefabs/internal.js_ ×6 · [`build~3`](../prefabs/internal.js.md#s-build-3) _js/shipgen/prefabs/internal.js_ ×4 · [`build`](../prefabs/power.js.md#s-build) _js/shipgen/prefabs/power.js_ ×10 · [`build~2`](../prefabs/power.js.md#s-build-2) _js/shipgen/prefabs/power.js_ ×4 · [`build~3`](../prefabs/power.js.md#s-build-3) _js/shipgen/prefabs/power.js_ ×8 · [`build~4`](../prefabs/power.js.md#s-build-4) _js/shipgen/prefabs/power.js_ ×5 · [`build`](../prefabs/sensors.js.md#s-build) _js/shipgen/prefabs/sensors.js_ ×10 · [`build~2`](../prefabs/sensors.js.md#s-build-2) _js/shipgen/prefabs/sensors.js_ ×5 · [`build~3`](../prefabs/sensors.js.md#s-build-3) _js/shipgen/prefabs/sensors.js_ ×7 · [`build~4`](../prefabs/sensors.js.md#s-build-4) _js/shipgen/prefabs/sensors.js_ ×7 · [`build~5`](../prefabs/sensors.js.md#s-build-5) _js/shipgen/prefabs/sensors.js_ ×7 · [`build~6`](../prefabs/sensors.js.md#s-build-6) _js/shipgen/prefabs/sensors.js_ ×8 · [`build`](../prefabs/structure.js.md#s-build) _js/shipgen/prefabs/structure.js_ ×11 · [`build~2`](../prefabs/structure.js.md#s-build-2) _js/shipgen/prefabs/structure.js_ ×5 · [`build~3`](../prefabs/structure.js.md#s-build-3) _js/shipgen/prefabs/structure.js_ ×2 · [`build~4`](../prefabs/structure.js.md#s-build-4) _js/shipgen/prefabs/structure.js_ ×7 · [`build~5`](../prefabs/structure.js.md#s-build-5) _js/shipgen/prefabs/structure.js_ ×6

<!-- note:addMesh -->
<!-- /note -->

### <a id="s-wingShape"></a>`wingShape(span, rootChord, tipChord, sweep, thickness)`

function · **exported** · L75–86

- called by: [`addWings`](../builder/hull.js.md#s-addWings) _js/shipgen/builder/hull.js_

<!-- note:wingShape -->
<!-- /note -->
