# js/shipgen/builder/faces.js

[index](../../../../README.md) · 21 lines · 3 symbols · 0 imports · 8 importers

## About

<!-- note:@file -->
Mount-face frame: normals and the euler that stands a +Y module on each face.
top/bottom/port/star/bow/stern — bottom rolls (not pitches) so local -Z still points at the bow.
<!-- /note -->

## Imports

_none_

## Imported by

- [js/shipgen/builder/StarshipBuilder.js](StarshipBuilder.js.md) — `faceNormal`, `faceEuler`, `faceRotation`
- [js/shipgen/builder/details.js](details.js.md) — `faceNormal`, `faceEuler`, `faceRotation`
- [js/shipgen/builder/docking.js](docking.js.md) — `faceNormal`, `faceEuler`, `faceRotation`
- [js/shipgen/builder/drives.js](drives.js.md) — `faceNormal`, `faceEuler`, `faceRotation`
- [js/shipgen/builder/glazing.js](glazing.js.md) — `faceNormal`, `faceEuler`, `faceRotation`
- [js/shipgen/builder/hull.js](hull.js.md) — `faceNormal`, `faceEuler`, `faceRotation`
- [js/shipgen/builder/placement.js](placement.js.md) — `faceNormal`, `faceEuler`, `faceRotation`
- [js/shipgen/builder/weapons.js](weapons.js.md) — `faceNormal`, `faceEuler`, `faceRotation`

## Exports

- [`faceNormal`](#s-faceNormal) · function — used by [js/shipgen/builder/StarshipBuilder.js](StarshipBuilder.js.md), [js/shipgen/builder/details.js](details.js.md), [js/shipgen/builder/docking.js](docking.js.md), [js/shipgen/builder/drives.js](drives.js.md), [js/shipgen/builder/glazing.js](glazing.js.md), [js/shipgen/builder/hull.js](hull.js.md), [js/shipgen/builder/placement.js](placement.js.md), [js/shipgen/builder/weapons.js](weapons.js.md)
- [`faceEuler`](#s-faceEuler) · function — used by [js/shipgen/builder/StarshipBuilder.js](StarshipBuilder.js.md), [js/shipgen/builder/details.js](details.js.md), [js/shipgen/builder/docking.js](docking.js.md), [js/shipgen/builder/drives.js](drives.js.md), [js/shipgen/builder/glazing.js](glazing.js.md), [js/shipgen/builder/hull.js](hull.js.md), [js/shipgen/builder/placement.js](placement.js.md), [js/shipgen/builder/weapons.js](weapons.js.md)
- [`faceRotation`](#s-faceRotation) · function — used by [js/shipgen/builder/StarshipBuilder.js](StarshipBuilder.js.md), [js/shipgen/builder/details.js](details.js.md), [js/shipgen/builder/docking.js](docking.js.md), [js/shipgen/builder/drives.js](drives.js.md), [js/shipgen/builder/glazing.js](glazing.js.md), [js/shipgen/builder/hull.js](hull.js.md), [js/shipgen/builder/placement.js](placement.js.md), [js/shipgen/builder/weapons.js](weapons.js.md)

## Effects

_none detected_

## Symbols

### <a id="s-faceNormal"></a>`faceNormal(f)`

function · **exported** · L1–5

- called by: [`StarshipBuilder.static faceNormal`](StarshipBuilder.js.md#s-StarshipBuilder-static-faceNormal) _js/shipgen/builder/StarshipBuilder.js_ · [`addWindows`](glazing.js.md#s-addWindows) _js/shipgen/builder/glazing.js_ · [`buildAt`](placement.js.md#s-buildAt) _js/shipgen/builder/placement.js_ · [`fpBox`](placement.js.md#s-fpBox) _js/shipgen/builder/placement.js_

<!-- note:faceNormal -->
<!-- /note -->

### <a id="s-faceEuler"></a>`faceEuler(f)`

function · **exported** · L7–14

- called by: [`StarshipBuilder.static faceEuler`](StarshipBuilder.js.md#s-StarshipBuilder-static-faceEuler) _js/shipgen/builder/StarshipBuilder.js_ · [`buildAt`](placement.js.md#s-buildAt) _js/shipgen/builder/placement.js_

<!-- note:faceEuler -->
euler that stands a +Y module upright on the given face

- L9 · `if (f === "bottom") return [0, 0, Math.PI];` — roll, not pitch: keeps local -Z pointing at the bow
<!-- /note -->

### <a id="s-faceRotation"></a>`faceRotation(face)`

function · **exported** · L16–21

- called by: [`StarshipBuilder.static faceRotation`](StarshipBuilder.js.md#s-StarshipBuilder-static-faceRotation) _js/shipgen/builder/StarshipBuilder.js_

<!-- note:faceRotation -->
<!-- /note -->
