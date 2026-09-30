# js/shipgen/builder/details.js

[index](../../../../README.md) · 73 lines · 2 symbols · 8 imports · 1 importers

## About

<!-- note:@file -->
StarshipBuilder mixin — Surface greebles and the cosmetic light signature.
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

### <a id="s-addGreebles"></a>`addGreebles(root)`

prop · L11–32

- calls: [`addMesh`](../core/geometry.js.md#s-addMesh) _js/shipgen/core/geometry.js_
- via [js/shipgen/core/geometry.js](../core/geometry.js.md): `G.box`

<!-- note:addGreebles -->
---- GREEBLES — flush to tracked hull surfaces --------------------
<!-- /note -->

### <a id="s-addRunningLights"></a>`addRunningLights(root)`

prop · L34–72

<!-- note:addRunningLights -->
================================================================ *
LIGHT SIGNATURE                                                   *
steady navigation lights + flashing anti-collision + chase strips *
================================================================

- L41 · `this.lamp(g, { color: "#ff2f45", x: V.x - hw * 1.04, y: V.y + hh * 0.15, z: V.z - hd * 0.6` — --- steady navigation set: red port, green starboard, white stern
- L46 · `this.lamp(g, { color: "#ffffff", x: V.x, y: V.y + hh * 1.06, z: V.z - hd * 0.05, r: r0 * 1` — --- anti-collision strobes: dorsal + ventral, out of phase ----
- L49 · `this.lamp(g, { color: "#ffb03a", x: V.x + hw * 0.55, y: V.y + hh * 1.04, z: V.z + hd * 0.4` — --- amber rotating beacons over the working end --------------
- L52 · `const n = 9;` — --- running chase strips down both flanks --------------------
- L59 · `for (let i = 0; i < 5; i++)` — --- keel formation lights, slow steady -----------------------
- L62 · `for (const sgn of [-1, 1])` — --- drive-guard warning pair ---------------------------------
- L66 · `for (let i = 0; i < 4; i++) {` — --- a few hull-marker lamps in the accent colour -------------
<!-- /note -->
