# js/shipgen/builder/weapons.js

[index](../../../../README.md) · 242 lines · 14 symbols · 8 imports · 1 importers

## About

<!-- note:@file -->
StarshipBuilder mixin — Weapon family geometry (turret / launcher tags drive the Ops fire control).
Methods are installed onto StarshipBuilder.prototype by src/builder/StarshipBuilder.js.
<!-- /note -->

## Imports

| line | from | names | target |
|---|---|---|---|
| 1 | `three` | `*` as `THREE` | external |
| 2 | `../core/rng.js` | `RNG` **unused** | [js/shipgen/core/rng.js](../core/rng.js.md) |
| 3 | `../core/geometry.js` | `G`, `makeMat` **unused**, `addMesh`, `wingShape` **unused** | [js/shipgen/core/geometry.js](../core/geometry.js.md) |
| 4 | `./faces.js` | `faceNormal` **unused**, `faceEuler` **unused**, `faceRotation` **unused** | [js/shipgen/builder/faces.js](faces.js.md) |
| 5 | `../data/drives.js` | `DRIVE_TYPES` **unused** | [js/shipgen/data/drives.js](../data/drives.js.md) |
| 6 | `../data/weapons.js` | `WEAPON_TYPES` **unused** | [js/shipgen/data/weapons.js](../data/weapons.js.md) |
| 7 | `../data/catalog/index.js` | `PARTS` **unused** | [js/shipgen/data/catalog/index.js](../data/catalog/index.js.md) |
| 8 | `../prefabs/index.js` | `PREFABS` **unused**, `ALL_FACES` **unused**, `fpArea` **unused** | [js/shipgen/prefabs/index.js](../prefabs/index.js.md) |

## Imported by

- [js/shipgen/builder/StarshipBuilder.js](StarshipBuilder.js.md) — `default`

## Exports

- `default` · ObjectExpression — used by [js/shipgen/builder/StarshipBuilder.js](StarshipBuilder.js.md)

## Effects

_none detected_

## Symbols

### <a id="s-wpn_railgun"></a>`wpn_railgun(g, u, rng)`

prop · L11–30

- calls: [`addMesh`](../core/geometry.js.md#s-addMesh) _js/shipgen/core/geometry.js_ ×6
- via [js/shipgen/core/geometry.js](../core/geometry.js.md): `G.box`, `G.cyl`

<!-- note:wpn_railgun -->
<!-- /note -->

### <a id="s-wpn_beam"></a>`wpn_beam(g, u, rng)`

prop · L32–48

- calls: [`addMesh`](../core/geometry.js.md#s-addMesh) _js/shipgen/core/geometry.js_ ×6
- via [js/shipgen/core/geometry.js](../core/geometry.js.md): `G.box`, `G.cyl`, `G.dome`, `G.sphere`, `G.torus`

<!-- note:wpn_beam -->
<!-- /note -->

### <a id="s-wpn_missile"></a>`wpn_missile(g, u, rng)`

prop · L50–70

- calls: [`addMesh`](../core/geometry.js.md#s-addMesh) _js/shipgen/core/geometry.js_ ×5
- via [js/shipgen/core/geometry.js](../core/geometry.js.md): `G.box`, `G.cyl`

<!-- note:wpn_missile -->
<!-- /note -->

### <a id="s-wpn_plasma"></a>`wpn_plasma(g, u, rng)`

prop · L72–91

- calls: [`addMesh`](../core/geometry.js.md#s-addMesh) _js/shipgen/core/geometry.js_ ×6
- via [js/shipgen/core/geometry.js](../core/geometry.js.md): `G.box`, `G.cyl`, `G.sphere`, `G.taper`, `G.torus`

<!-- note:wpn_plasma -->
<!-- /note -->

### <a id="s-wpn_pdc"></a>`wpn_pdc(g, u, rng)`

prop · L93–114

- calls: [`addMesh`](../core/geometry.js.md#s-addMesh) _js/shipgen/core/geometry.js_ ×5
- via [js/shipgen/core/geometry.js](../core/geometry.js.md): `G.box`, `G.cyl`

<!-- note:wpn_pdc -->
<!-- /note -->

### <a id="s-wpn_torpedo"></a>`wpn_torpedo(g, u, rng)`

prop · L116–126

- calls: [`addMesh`](../core/geometry.js.md#s-addMesh) _js/shipgen/core/geometry.js_ ×4
- via [js/shipgen/core/geometry.js](../core/geometry.js.md): `G.box`, `G.cyl`, `G.torus`

<!-- note:wpn_torpedo -->
<!-- /note -->

### <a id="s-wpn_coil"></a>`wpn_coil(g, u, rng)`

prop · L128–143

- calls: [`addMesh`](../core/geometry.js.md#s-addMesh) _js/shipgen/core/geometry.js_ ×6
- via [js/shipgen/core/geometry.js](../core/geometry.js.md): `G.box`, `G.cyl`, `G.torus`

<!-- note:wpn_coil -->
---- COILGUN: rail-style yoke with a stack of drive coils, blue slug -------------------
<!-- /note -->

### <a id="s-wpn_auto"></a>`wpn_auto(g, u, rng)`

prop · L145–159

- calls: [`addMesh`](../core/geometry.js.md#s-addMesh) _js/shipgen/core/geometry.js_ ×6
- via [js/shipgen/core/geometry.js](../core/geometry.js.md): `G.box`, `G.cyl`

<!-- note:wpn_auto -->
---- AUTOCANNON: twin barrels, box magazine, ejection port --------------------------

- L152 · `addMesh(head, G.box(), m.dark, u * 0.65, u * 0.1, u * 0.2, 0, 0, 0, u * 0.3, u * 0.5, u *` — magazine
<!-- /note -->

### <a id="s-wpn_flak"></a>`wpn_flak(g, u, rng)`

prop · L161–172

- calls: [`addMesh`](../core/geometry.js.md#s-addMesh) _js/shipgen/core/geometry.js_ ×4
- via [js/shipgen/core/geometry.js](../core/geometry.js.md): `G.box`, `G.cyl`, `G.dome`

<!-- note:wpn_flak -->
---- FLAK: short twin barrels + ranging dish, proximity-fused shells ------------------
<!-- /note -->

### <a id="s-wpn_lance"></a>`wpn_lance(g, u, rng)`

prop · L174–185

- calls: [`addMesh`](../core/geometry.js.md#s-addMesh) _js/shipgen/core/geometry.js_ ×5
- via [js/shipgen/core/geometry.js](../core/geometry.js.md): `G.box`, `G.cyl`, `G.sphere`, `G.torus`

<!-- note:wpn_lance -->
---- PLASMA LANCE: long confinement barrel, continuous beam --------------------------
<!-- /note -->

### <a id="s-wpn_particle"></a>`wpn_particle(g, u, rng)`

prop · L187–199

- calls: [`addMesh`](../core/geometry.js.md#s-addMesh) _js/shipgen/core/geometry.js_ ×5
- via [js/shipgen/core/geometry.js](../core/geometry.js.md): `G.cyl`, `G.taper`, `G.torus`

<!-- note:wpn_particle -->
---- PARTICLE BEAM: accelerator ring behind a beam director ---------------------------
<!-- /note -->

### <a id="s-wpn_ciws"></a>`wpn_ciws(g, u, rng)`

prop · L201–213

- calls: [`addMesh`](../core/geometry.js.md#s-addMesh) _js/shipgen/core/geometry.js_ ×5
- via [js/shipgen/core/geometry.js](../core/geometry.js.md): `G.box`, `G.cyl`, `G.sphere`

<!-- note:wpn_ciws -->
---- LASER CIWS: PDC-class mount, tracking radome, rapid short pulses -----------------
<!-- /note -->

### <a id="s-wpn_chaff"></a>`wpn_chaff(g, u, rng)`

prop · L215–226

- calls: [`addMesh`](../core/geometry.js.md#s-addMesh) _js/shipgen/core/geometry.js_ ×3
- via [js/shipgen/core/geometry.js](../core/geometry.js.md): `G.box`, `G.cyl`

<!-- note:wpn_chaff -->
---- CHAFF / DECOY DISPENSER: angled tube bank ----------------------------------------
<!-- /note -->

### <a id="s-wpn_mines"></a>`wpn_mines(g, u, rng)`

prop · L228–241

- calls: [`addMesh`](../core/geometry.js.md#s-addMesh) _js/shipgen/core/geometry.js_ ×3
- via [js/shipgen/core/geometry.js](../core/geometry.js.md): `G.box`, `G.sphere`

<!-- note:wpn_mines -->
---- DRIFT-MINE LAYER: aft-facing rack of blinking mines -------------------------------
<!-- /note -->
