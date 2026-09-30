# js/shipgen/builder/hull.js

[index](../../../../README.md) · 326 lines · 6 symbols · 8 imports · 1 importers

## About

<!-- note:@file -->
StarshipBuilder mixin — Hull silhouette — body, nose, superstructure, wings.
Methods are installed onto StarshipBuilder.prototype by src/builder/StarshipBuilder.js.
<!-- /note -->

## Imports

| line | from | names | target |
|---|---|---|---|
| 1 | `three` | `*` as `THREE` | external |
| 2 | `../core/rng.js` | `RNG` **unused** | [js/shipgen/core/rng.js](../core/rng.js.md) |
| 3 | `../core/geometry.js` | `G`, `makeMat` **unused**, `addMesh`, `wingShape` | [js/shipgen/core/geometry.js](../core/geometry.js.md) |
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

### <a id="s-addHull"></a>`addHull(root)`

prop · L11–155

- calls: [`addMesh`](../core/geometry.js.md#s-addMesh) _js/shipgen/core/geometry.js_ ×44
- via [js/shipgen/core/geometry.js](../core/geometry.js.md): `G.box`, `G.cyl`, `G.sphere`, `G.taper`, `G.torus`

<!-- note:addHull -->
---- HULL --------------------------------------------------------

- L43 · `this.hullVols.push({ x: 0, y: 0, z, w: B * 0.76, h: H * 0.84, d: L * 0.14, shape: "cyl" })` — curved: mounts stay on the tangent band
- L45 · `this.vol(body, mats.metal, 0, -H * 0.3, 0, B * 0.12, H * 0.12, L * 0.8);` — spine
- L53 · `addMesh(body, G.box(), mats.metal, 0, -H * 0.1, -L * 0.41, 0, 0, 0, B * 0.5, H * 0.3, L *` — hangar mouth
- L69 · `const r = Math.min(B, H) * 0.34;` — reconnaissance hull: one long pressure tube, two sensor pods, everything else is skin
- L72 · `addMesh(body, G.taper(0.55, 18), mats.light, 0, 0, -L * 0.5, -Math.PI / 2, 0, 0, r, L * 0.` — forward taper
- L73 · `addMesh(body, G.taper(1.25, 18), mats.dark, 0, 0, L * 0.5, -Math.PI / 2, 0, 0, r, L * 0.1,` — engine flare
- L82 · `addMesh(body, G.box(), mats.glassDark, 0, r * 0.75, -L * 0.22, -0.3, 0, 0, r * 0.9, r * 0.` — canopy strip
- L84 · `const half = B * 0.5, nose = -L * 0.48, tail = L * 0.36, thick = H * 0.55;` — arrowhead lifting body: extruded triangle, chined, with slice volumes that follow the taper
- L96 · `addMesh(body, G.sphere(), mats.hull, 0, 0, 0, 0, 0, 0, B * 0.5, H * 0.5, L * 0.5);` — sculpted yacht hull: stretched ellipsoid with a flat spine deck and chined belly
- L103 · `const r = Math.min(B, H) * 0.48;` — sphere core with an equatorial service band and a spine aft
- L107 · `for (const [px, py, rz] of [[0, r * 0.92, 0], [0, -r * 0.92, 0], [r * 0.92, 0, Math.PI / 2` — four flat service pads on the equator give the sphere real mounting surface
- L116 · `const R = B * 0.42, tube = Math.min(H * 0.5, B * 0.12) * 0.9;` — liner: rotating habitat torus around a central hub, spokes, aft service block
- L127 · `this.vol(body, mats.dark, 0, 0, 0, B * 0.5, H * 0.6, L * 0.7);` — raider: asymmetric angular armour slabs over a core box
- L134 · `for (const s of [-1, 1]) addMesh(armor, G.box(), mats.hull, s * B * 0.34, -H * 0.15, -L *` — chines
- L138 · `const r = Math.min(B, H) * 0.5;` — worldship: one huge cylinder with end caps and a spine of windows
- L153 · `this.vol(body, mats.dark, 0, -H * 0.44, L * 0.02, B * 0.18, H * 0.16, L * 0.55);` — ventral keel + belly plating
<!-- /note -->

### <a id="s-addNose"></a>`addNose(root)`

prop · L157–209

- calls: [`addMesh`](../core/geometry.js.md#s-addMesh) _js/shipgen/core/geometry.js_ ×25
- via [js/shipgen/core/geometry.js](../core/geometry.js.md): `G.box`, `G.cone`, `G.cyl`, `G.sphere`, `G.torus`

<!-- note:addNose -->
---- NOSE --------------------------------------------------------

- L165 · `const pts = []; const n = 14, len = L * 0.34, rx = B * 0.24;` — power-series ogive lathe: the low-drag continuum nose the design regime asked for
<!-- /note -->

### <a id="s-addSuperstructure"></a>`addSuperstructure(root)`

prop · L211–243

- calls: [`addMesh`](../core/geometry.js.md#s-addMesh) _js/shipgen/core/geometry.js_ ×6
- via [js/shipgen/core/geometry.js](../core/geometry.js.md): `G.box`

<!-- note:addSuperstructure -->
---- SUPERSTRUCTURE ----------------------------------------------
<!-- /note -->

### <a id="s-addWings"></a>`addWings(root)`

prop · L245–297

- calls: [`addMesh`](../core/geometry.js.md#s-addMesh) _js/shipgen/core/geometry.js_ ×8 · [`wingShape`](../core/geometry.js.md#s-wingShape) _js/shipgen/core/geometry.js_
- via [js/shipgen/core/geometry.js](../core/geometry.js.md): `G.box`

<!-- note:addWings -->
---- WINGS -------------------------------------------------------

- L269 · `addMesh(wings, G.box(), mats.accent, s * (B * 0.22 + span * 0.55), y + thick * 0.55, z - s` — leading-edge accent
<!-- /note -->

### <a id="s-addFairings"></a>`addFairings(root)`

prop · L299–309

- calls: [`addMesh`](../core/geometry.js.md#s-addMesh) _js/shipgen/core/geometry.js_ ×2
- via [js/shipgen/core/geometry.js](../core/geometry.js.md): `G.box`, `G.taper`

<!-- note:addFairings -->
---- FAIRINGS: wedge every superstructure block into the flow (atmospheric regimes) ---------

- L305 · `addMesh(root, G.taper(0.04, 4), m.material, m.position.x, m.position.y, m.position.z - d /` — square pyramid (4-seg taper) spun 45° so its base matches the block, apex into the wind
- L306 · `addMesh(root, G.taper(0.35, 4), mats.dark, m.position.x, m.position.y, m.position.z + d /` — gentle aft boat-tail
<!-- /note -->

### <a id="s-addHeatShield"></a>`addHeatShield(root)`

prop · L311–325

- calls: [`addMesh`](../core/geometry.js.md#s-addMesh) _js/shipgen/core/geometry.js_ ×5
- via [js/shipgen/core/geometry.js](../core/geometry.js.md): `G.box`, `G.cyl`

<!-- note:addHeatShield -->
---- HEAT SHIELD: ventral ablator across the main body with a rounded leading edge ----------

- L319 · `for (let i = -3; i <= 3; i++) addMesh(g, G.box(), mats.hazard, V.x + i * w / 7, y - H * 0.` — tile grid
- L321 · `addMesh(g, G.cyl(16), mats.rubber, V.x, y + H * 0.06, V.z - d / 2, 0, 0, Math.PI / 2, H *` — rounded leading edge wraps up over the nose
<!-- /note -->
