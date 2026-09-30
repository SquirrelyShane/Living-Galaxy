# js/shipgen/builder/glazing.js

[index](../../../../README.md) · 75 lines · 1 symbols · 8 imports · 1 importers

## About

<!-- note:@file -->
StarshipBuilder mixin — Flight bridge, crew viewports, aft observation band.
Methods are installed onto StarshipBuilder.prototype by src/builder/StarshipBuilder.js.
<!-- /note -->

## Imports

| line | from | names | target |
|---|---|---|---|
| 1 | `three` | `*` as `THREE` | external |
| 2 | `../core/rng.js` | `RNG` **unused** | [js/shipgen/core/rng.js](../core/rng.js.md) |
| 3 | `../core/geometry.js` | `G`, `makeMat` **unused**, `addMesh`, `wingShape` **unused** | [js/shipgen/core/geometry.js](../core/geometry.js.md) |
| 4 | `./faces.js` | `faceNormal`, `faceEuler` **unused**, `faceRotation` **unused** | [js/shipgen/builder/faces.js](faces.js.md) |
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

### <a id="s-addWindows"></a>`addWindows(root)`

prop · L11–74

- calls: [`faceNormal`](faces.js.md#s-faceNormal) _js/shipgen/builder/faces.js_ · [`addMesh`](../core/geometry.js.md#s-addMesh) _js/shipgen/core/geometry.js_ ×10
- via [js/shipgen/core/geometry.js](../core/geometry.js.md): `G.box`

<!-- note:addWindows -->
================================================================

GLAZING — flight bridge, crew viewports, aft observation

================================================================

- L17 · `if (eq.bridge !== "none") {` — --- flight bridge -------------------------------------------
- L26 · `addMesh(g, G.box(), m.dark, V.x, by - bh * 1.1, bz + bd * 0.1, 0, 0, 0, bw * 0.7, bh * 1.3` — pedestal below the bridge deck
- L32 · `const wind = addMesh(g, G.box(), m.glassDark, V.x, by + bh * 0.06, bz - bd * 0.53, -0.13,` — raked forward windscreen
- L34 · `for (const sgn of [-1, 1]) {` — wrap-around quarter lights
- L38 · `for (let i = -2; i <= 2; i++)` — mullions
- L40 · `for (let i = 0; i < 4; i++)` — console glow inside the bridge
- L43 · `this.lamp(g, { color: "#ffffff", x: V.x, y: by + bh * 0.78, z: bz, r: H * 0.020, mode: "do` — bridge roof beacon
- L47 · `const n = Math.max(0, Math.round(6 * eq.crewWin));` — --- crew viewports down both flanks --------------------------
- L63 · `{` — --- aft observation band (crew watching the drives) ----------
<!-- /note -->
