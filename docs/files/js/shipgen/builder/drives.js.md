# js/shipgen/builder/drives.js

[index](../../../../README.md) · 259 lines · 14 symbols · 8 imports · 1 importers

## About

<!-- note:@file -->
StarshipBuilder mixin — Main drive cluster and one builder per drive family.
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

### <a id="s-addEngines"></a>`addEngines(root)`

prop · L11–53

- calls: [`addMesh`](../core/geometry.js.md#s-addMesh) _js/shipgen/core/geometry.js_
- via [js/shipgen/core/geometry.js](../core/geometry.js.md): `G.box`

<!-- note:addEngines -->
================================================================

ENGINES — one builder per drive family

================================================================

- L32 · `addMesh(group, G.box(), this.mats.dark, 0, -H * 0.02, z - len * 0.6, 0, 0, 0, B * 0.62, H` — mounting pylon shelf across the stern
<!-- /note -->

### <a id="s-plume"></a>`plume(pod, radius, length, opts=)`

prop · L55–79

- calls: [`plume>mk`](#s-plume-mk) ×2 · [`addMesh`](../core/geometry.js.md#s-addMesh) _js/shipgen/core/geometry.js_ ×2
- via [js/shipgen/core/geometry.js](../core/geometry.js.md): `G.disc`, `G.sphere`

<!-- note:plume -->
layered exhaust anchored at the nozzle exit: soft outer sheath, hot core, exit bloom,
and (for chemical / pulse drives) a row of shock diamonds. Every layer is throttle-driven.

- L68 · `const dm = mats.hot.clone(); dm.transparent = true; dm.opacity = 0.55; dm.depthWrite = fal` — exit bloom disc
- L71 · `if (["hydrogen", "vector", "pulse", "fusion"].includes(type)) {` — shock diamonds on chemical-family exhausts
<!-- /note -->

#### <a id="s-plume-mk"></a>`plume>mk(mat, r, len, op, intensity, layer)`

function · L58–65

- calls: [`addMesh`](../core/geometry.js.md#s-addMesh) _js/shipgen/core/geometry.js_
- via [js/shipgen/core/geometry.js](../core/geometry.js.md): `G.plume`
- called by: [`plume`](#s-plume) ×2

<!-- note:plume>mk -->
<!-- /note -->

### <a id="s-drive_fusion"></a>`drive_fusion(pod, r, len)`

prop · L81–90

- calls: [`addMesh`](../core/geometry.js.md#s-addMesh) _js/shipgen/core/geometry.js_ ×5
- via [js/shipgen/core/geometry.js](../core/geometry.js.md): `G.cyl`, `G.sphere`, `G.taper`, `G.torus`

<!-- note:drive_fusion -->
- L85 · `const bell = addMesh(pod, G.taper(1.55, 18), m.engine, 0, 0, len * 0.5, Math.PI / 2, 0, 0,` — flared bell
<!-- /note -->

### <a id="s-drive_ion"></a>`drive_ion(pod, r, len)`

prop · L92–104

- calls: [`addMesh`](../core/geometry.js.md#s-addMesh) _js/shipgen/core/geometry.js_ ×4
- via [js/shipgen/core/geometry.js](../core/geometry.js.md): `G.box`, `G.cyl`

<!-- note:drive_ion -->
- L96 · `for (let i = -1; i <= 1; i++) {` — emitter grid
<!-- /note -->

### <a id="s-drive_plasma"></a>`drive_plasma(pod, r, len)`

prop · L106–116

- calls: [`addMesh`](../core/geometry.js.md#s-addMesh) _js/shipgen/core/geometry.js_ ×4
- via [js/shipgen/core/geometry.js](../core/geometry.js.md): `G.cyl`, `G.taper`, `G.torus`

<!-- note:drive_plasma -->
<!-- /note -->

### <a id="s-drive_antimatter"></a>`drive_antimatter(pod, r, len)`

prop · L118–133

- calls: [`addMesh`](../core/geometry.js.md#s-addMesh) _js/shipgen/core/geometry.js_ ×5
- via [js/shipgen/core/geometry.js](../core/geometry.js.md): `G.box`, `G.cyl`, `G.sphere`, `G.torus`

<!-- note:drive_antimatter -->
<!-- /note -->

### <a id="s-drive_pulse"></a>`drive_pulse(pod, r, len)`

prop · L135–146

- calls: [`addMesh`](../core/geometry.js.md#s-addMesh) _js/shipgen/core/geometry.js_ ×3
- via [js/shipgen/core/geometry.js](../core/geometry.js.md): `G.cyl`, `G.torus`

<!-- note:drive_pulse -->
<!-- /note -->

### <a id="s-drive_vector"></a>`drive_vector(pod, r, len)`

prop · L148–163

- calls: [`addMesh`](../core/geometry.js.md#s-addMesh) _js/shipgen/core/geometry.js_ ×5
- via [js/shipgen/core/geometry.js](../core/geometry.js.md): `G.coneOpen`, `G.cyl`, `G.taper`, `G.torus`

<!-- note:drive_vector -->
<!-- /note -->

### <a id="s-drive_hydrogen"></a>`drive_hydrogen(pod, r, len)`

prop · L165–188

- calls: [`addMesh`](../core/geometry.js.md#s-addMesh) _js/shipgen/core/geometry.js_ ×7
- via [js/shipgen/core/geometry.js](../core/geometry.js.md): `G.box`, `G.cyl`, `G.taper`, `G.torus`

<!-- note:drive_hydrogen -->
---- HYDROGEN CHEM: cryo tank + clustered bell nozzles ----------

- L167 · `addMesh(pod, G.cyl(16), m.light, 0, 0, -len * 0.55, Math.PI / 2, 0, 0, r * 1.25, len * 0.7` — cryogenic feed tank with frost ribs
- L171 · `for (let i = 0; i < 4; i++) {` — turbopump plumbing
- L176 · `const bells = [[0, 0, 1.0], [-0.72, -0.42, 0.72], [0.72, -0.42, 0.72]];` — 3-bell cluster
<!-- /note -->

### <a id="s-drive_hall"></a>`drive_hall(pod, r, len)`

prop · L190–208

- calls: [`addMesh`](../core/geometry.js.md#s-addMesh) _js/shipgen/core/geometry.js_ ×6
- via [js/shipgen/core/geometry.js](../core/geometry.js.md): `G.box`, `G.cyl`, `G.torus`

<!-- note:drive_hall -->
---- HALL / ION ARRAY: annular emitter rings (barge doctrine) ----

- L194 · `for (let i = 0; i < 3; i++) {` — three concentric emitter halos — the lit rings
- L201 · `for (let i = 0; i < 4; i++) {` — magnet spines
<!-- /note -->

### <a id="s-drive_micro"></a>`drive_micro(pod, r, len)`

prop · L210–222

- calls: [`addMesh`](../core/geometry.js.md#s-addMesh) _js/shipgen/core/geometry.js_ ×5
- via [js/shipgen/core/geometry.js](../core/geometry.js.md): `G.box`, `G.cone`, `G.sphere`

<!-- note:drive_micro -->
---- MICRO-EMITTERS: FEEP / electrospray needle arrays ----------
<!-- /note -->

### <a id="s-drive_ntr"></a>`drive_ntr(pod, r, len)`

prop · L224–239

- calls: [`addMesh`](../core/geometry.js.md#s-addMesh) _js/shipgen/core/geometry.js_ ×7
- via [js/shipgen/core/geometry.js](../core/geometry.js.md): `G.box`, `G.cyl`, `G.taper`

<!-- note:drive_ntr -->
---- NUCLEAR THERMAL: reactor drum, radiator fins, long nozzle ---

- L227 · `addMesh(pod, G.cyl(14), m.metal, 0, 0, -len * 0.16, Math.PI / 2, 0, 0, r * 1.45, len * 0.1` — shadow shield
- L229 · `for (const sgn of [-1, 1]) {` — radiator fins
<!-- /note -->

### <a id="s-drive_gravitic"></a>`drive_gravitic(pod, r, len)`

prop · L241–258

- calls: [`addMesh`](../core/geometry.js.md#s-addMesh) _js/shipgen/core/geometry.js_ ×4
- via [js/shipgen/core/geometry.js](../core/geometry.js.md): `G.cyl`, `G.sphere`, `G.torus`

<!-- note:drive_gravitic -->
---- GRAVITIC: no exhaust, counter-rotating coils ----------------
<!-- /note -->
