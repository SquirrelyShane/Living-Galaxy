# js/shipgen/builder/StarshipBuilder.js

[index](../../../../README.md) · 177 lines · 13 symbols · 17 imports · 6 importers

## About

<!-- note:@file -->
StarshipBuilder — core: build() pipeline, hull-volume tracking, hardpoint frame, lamps.
Geometry passes live in mixins (hull, drives, weapons, glazing, docking, placement, details)
so each can be upgraded on its own.
<!-- /note -->

## Imports

| line | from | names | target |
|---|---|---|---|
| 1 | `three` | `*` as `THREE` | external |
| 2 | `../core/rng.js` | `RNG` | [js/shipgen/core/rng.js](../core/rng.js.md) |
| 3 | `../core/geometry.js` | `G`, `makeMat`, `addMesh`, `wingShape` **unused**, `FINISHES` | [js/shipgen/core/geometry.js](../core/geometry.js.md) |
| 4 | `./faces.js` | `faceNormal`, `faceEuler`, `faceRotation` | [js/shipgen/builder/faces.js](faces.js.md) |
| 5 | `../data/drives.js` | `DRIVE_TYPES` | [js/shipgen/data/drives.js](../data/drives.js.md) |
| 6 | `../data/weapons.js` | `WEAPON_TYPES` | [js/shipgen/data/weapons.js](../data/weapons.js.md) |
| 7 | `../data/catalog/index.js` | `PARTS` **unused** | [js/shipgen/data/catalog/index.js](../data/catalog/index.js.md) |
| 8 | `../prefabs/index.js` | `PREFABS` **unused**, `ALL_FACES` **unused**, `fpArea` **unused** | [js/shipgen/prefabs/index.js](../prefabs/index.js.md) |
| 9 | `../data/classes.js` | `SHIP_CLASSES`, `EQUIP_DEFAULT`, `CLASS_EQUIP` | [js/shipgen/data/classes.js](../data/classes.js.md) |
| 10 | `../data/flight.js` | `DESIGN_REGIMES` | [js/shipgen/data/flight.js](../data/flight.js.md) |
| 11 | `./hull.js` | `default` as `hull` | [js/shipgen/builder/hull.js](hull.js.md) |
| 12 | `./drives.js` | `default` as `drives` | [js/shipgen/builder/drives.js](drives.js.md) |
| 13 | `./weapons.js` | `default` as `weapons` | [js/shipgen/builder/weapons.js](weapons.js.md) |
| 14 | `./glazing.js` | `default` as `glazing` | [js/shipgen/builder/glazing.js](glazing.js.md) |
| 15 | `./docking.js` | `default` as `docking` | [js/shipgen/builder/docking.js](docking.js.md) |
| 16 | `./placement.js` | `default` as `placement` | [js/shipgen/builder/placement.js](placement.js.md) |
| 17 | `./details.js` | `default` as `details` | [js/shipgen/builder/details.js](details.js.md) |

## Imported by

- [js/shipgen/generate.js](../generate.js.md) — `StarshipBuilder`
- [js/shipgen/index.js](../index.js.md) — `StarshipBuilder`
- test/shipgen/audit-attach.mjs _(outside js/)_ — `StarshipBuilder`
- test/shipgen/audit-bom.mjs _(outside js/)_ — `StarshipBuilder`
- test/shipgen/test-build.mjs _(outside js/)_ — `StarshipBuilder`
- test/shipgen/test-flight.mjs _(outside js/)_ — `StarshipBuilder`

## Exports

- [`StarshipBuilder`](#s-StarshipBuilder) · class — used by [js/shipgen/generate.js](../generate.js.md), [js/shipgen/index.js](../index.js.md), test/shipgen/audit-attach.mjs, test/shipgen/audit-bom.mjs, test/shipgen/test-build.mjs, test/shipgen/test-flight.mjs

## Effects

_none detected_

## Symbols

### <a id="s-StarshipBuilder"></a>`StarshipBuilder`

class · **exported** · L19–175

- called by: [`buildShip`](../generate.js.md#s-buildShip) _js/shipgen/generate.js_

<!-- note:StarshipBuilder -->
<!-- /note -->

#### <a id="s-StarshipBuilder-build"></a>`StarshipBuilder.build(opts)`

method · L20–103

- calls: [`StarshipBuilder.build>skin`](#s-StarshipBuilder-build-skin) ×4 · [`makeMat`](../core/geometry.js.md#s-makeMat) _js/shipgen/core/geometry.js_ ×16 · [`new RNG`](../core/rng.js.md#s-RNG) _js/shipgen/core/rng.js_

<!-- note:StarshipBuilder.build -->
- L36 · `this.regimeKey = (opts.designRegime && opts.designRegime !== "auto") ? opts.designRegime :` — design regime: the flight environment the hull is shaped for
- L38 · `const fin = this.aero.fineness;` — stretch along the flow, slim across it, keep volume
- L68 · `glassDark: makeMat("#101d29", { metalness: 0.25, roughness: 0.07, emissive: "#0d2f45", emi` — tinted structural glazing — bridge canopy / viewports / array faces
- L69 · `winLit: makeMat("#ffe3b8", { metalness: 0.0, roughness: 0.45, emissive: "#ffd39a", emissiv` — warm cabin light behind crew viewports
- L88 · `this.U = THREE.MathUtils.clamp(Math.min(this.B, this.H) * 0.18, 0.75, 2.4);` — catalog unit: one "bay" of exterior real estate — follows the hull but never absurd on giants or needles
<!-- /note -->

##### <a id="s-StarshipBuilder-build-skin"></a>`StarshipBuilder.build>skin(base, extra)`

function · L54–54

- calls: [`makeMat`](../core/geometry.js.md#s-makeMat) _js/shipgen/core/geometry.js_
- called by: [`StarshipBuilder.build`](#s-StarshipBuilder-build) ×4

<!-- note:StarshipBuilder.build>skin -->
<!-- /note -->

#### <a id="s-StarshipBuilder-count"></a>`StarshipBuilder.count(n=)`

method · L105–105

<!-- note:StarshipBuilder.count -->
<!-- /note -->

#### <a id="s-StarshipBuilder-vol"></a>`StarshipBuilder.vol(parent, mat, x, y, z, w, h, d, rz=)`

method · L107–112

- calls: [`addMesh`](../core/geometry.js.md#s-addMesh) _js/shipgen/core/geometry.js_
- via [js/shipgen/core/geometry.js](../core/geometry.js.md): `G.box`

<!-- note:StarshipBuilder.vol -->
---- hull volume tracking so detail can sit flush ----------------
<!-- /note -->

#### <a id="s-StarshipBuilder-pickSurface"></a>`StarshipBuilder.pickSurface(rng, faces=, zRange=)`

method · L114–129

<!-- note:StarshipBuilder.pickSurface -->
pick a point on the outer surface of a tracked hull volume
<!-- /note -->

#### <a id="s-StarshipBuilder-hardpoints"></a>`StarshipBuilder.hardpoints()`

method · L131–136

<!-- note:StarshipBuilder.hardpoints -->
---- HARDPOINT FRAME -------------------------------------------- *
One reference volume + normalised (u,v) face coordinates, so every
module can be placed deliberately instead of scattered at random.

- L132 · `const pool = this.hullVols.filter(v => !v.shield && Math.max(v.w, v.h) > this.B * 0.18 &&` — a volume is mountable real estate if two of its dimensions are substantial (thin side pads count)
<!-- /note -->

#### <a id="s-StarshipBuilder-hp"></a>`StarshipBuilder.hp(face, u, v, vol)`

method · L138–148

<!-- note:StarshipBuilder.hp -->
face + normalised coords -> world position on that face
<!-- /note -->

#### <a id="s-StarshipBuilder-lamp"></a>`StarshipBuilder.lamp(parent, o)`

method · L150–161

- calls: [`addMesh`](../core/geometry.js.md#s-addMesh) _js/shipgen/core/geometry.js_ · [`makeMat`](../core/geometry.js.md#s-makeMat) _js/shipgen/core/geometry.js_
- via [js/shipgen/core/geometry.js](../core/geometry.js.md): `G.box`, `G.sphere`

<!-- note:StarshipBuilder.lamp -->
---- LAMPS ------------------------------------------------------- *
modes: steady | pulse | blink | strobe | double | chase
<!-- /note -->

#### <a id="s-StarshipBuilder-tagLamp"></a>`StarshipBuilder.tagLamp(mesh, o)`

method · L163–170

<!-- note:StarshipBuilder.tagLamp -->
<!-- /note -->

#### <a id="s-StarshipBuilder-static-faceNormal"></a>`StarshipBuilder.static faceNormal(f)`

method · L172–172

- calls: [`faceNormal`](faces.js.md#s-faceNormal) _js/shipgen/builder/faces.js_

<!-- note:StarshipBuilder.static faceNormal -->
face helpers kept on the class for backwards compatibility
<!-- /note -->

#### <a id="s-StarshipBuilder-static-faceEuler"></a>`StarshipBuilder.static faceEuler(f)`

method · L173–173

- calls: [`faceEuler`](faces.js.md#s-faceEuler) _js/shipgen/builder/faces.js_

<!-- note:StarshipBuilder.static faceEuler -->
<!-- /note -->

#### <a id="s-StarshipBuilder-static-faceRotation"></a>`StarshipBuilder.static faceRotation(f)`

method · L174–174

- calls: [`faceRotation`](faces.js.md#s-faceRotation) _js/shipgen/builder/faces.js_

<!-- note:StarshipBuilder.static faceRotation -->
<!-- /note -->
