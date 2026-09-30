# js/shipgen/builder/docking.js

[index](../../../../README.md) · 48 lines · 1 symbols · 8 imports · 1 importers

## About

<!-- note:@file -->
StarshipBuilder mixin — Docking collar body shared by the dock prefab.
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

### <a id="s-dockBody"></a>`dockBody(g, S, kind)`

prop · L11–47

- calls: [`addMesh`](../core/geometry.js.md#s-addMesh) _js/shipgen/core/geometry.js_ ×9
- via [js/shipgen/core/geometry.js](../core/geometry.js.md): `G.box`, `G.cyl`, `G.torus`

<!-- note:dockBody -->
docking collar body — shared by the dock prefab (built along +Y)

- L14 · `addMesh(g, G.box(), m.dark, 0, S * 0.05, 0, 0, 0, 0, S * 2.15, S * 0.12, S * 2.15);` — recessed base plate, collar, soft-capture ring, pressure iris
- L19 · `for (let i = 0; i < 4; i++) {` — latch arms
- L27 · `for (const sgn of [-1, 1])` — hazard chevrons framing the approach
- L29 · `for (let i = 0; i < 3; i++) {` — amber approach blinkers, alternating around the collar
- L34 · `const statusCol = kind === "fuel" ? "#7dffbe" : kind === "crew" ? "#5fd0ff" : kind === "ha` — status light: green free / cyan crew / white hard mate
- L36 · `if (kind === "fuel") {` — fuel ports get a stowed probe boom
- L40 · `if (kind === "cargo") {` — cargo ports get guide rails for a container arm
<!-- /note -->
