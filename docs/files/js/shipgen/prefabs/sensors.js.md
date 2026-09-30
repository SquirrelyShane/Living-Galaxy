# js/shipgen/prefabs/sensors.js

[index](../../../../README.md) · 139 lines · 12 symbols · 3 imports · 1 importers

## About

<!-- note:@file -->
Prefabs — Antennas, optics and scanning heads.
Each prefab: faces (default mount faces), fp(s, part, face) → footprint {w,h,d} in ship units
(w along the face u-axis, d along v, h outward), build(g, s, part, S, rng) where g is a group
whose +Y points away from the hull and S is the StarshipBuilder (mats, lamp, dockBody…).

- L139 · `};` — weapons wrap the existing family builders
<!-- /note -->

## Imports

| line | from | names | target |
|---|---|---|---|
| 1 | `three` | `*` as `THREE` | external |
| 2 | `../core/geometry.js` | `G`, `addMesh` | [js/shipgen/core/geometry.js](../core/geometry.js.md) |
| 3 | `./_common.js` | `ALL_FACES` | [js/shipgen/prefabs/_common.js](_common.js.md) |

## Imported by

- [js/shipgen/prefabs/index.js](index.js.md) — `default`

## Exports

- `default` · ObjectExpression — used by [js/shipgen/prefabs/index.js](index.js.md)

## Effects

_none detected_

## Symbols

### <a id="s-fp"></a>`fp(s, p)`

prop · L6–6

<!-- note:fp -->
<!-- /note -->

### <a id="s-build"></a>`build(g, s, p, S, rng)`

prop · L7–30

- calls: [`addMesh`](../core/geometry.js.md#s-addMesh) _js/shipgen/core/geometry.js_ ×10
- via [js/shipgen/core/geometry.js](../core/geometry.js.md): `G.box`, `G.cyl`, `G.dome`

<!-- note:build -->
- L10 · `addMesh(g, G.box(), m.dark, 0, s * 0.08, 0, 0, 0, 0, s * 1.6, s * 0.16, s * 1.6);` — conformal phased-array plate in place of the parabolic dish
<!-- /note -->

### <a id="s-fp-2"></a>`fp~2(s, p)`

prop · L32–32

<!-- note:fp~2 -->
<!-- /note -->

### <a id="s-build-2"></a>`build~2(g, s, p, S, rng)`

prop · L33–47

- calls: [`addMesh`](../core/geometry.js.md#s-addMesh) _js/shipgen/core/geometry.js_ ×5
- via [js/shipgen/core/geometry.js](../core/geometry.js.md): `G.box`, `G.sphere`, `G.torus`

<!-- note:build~2 -->
- L36 · `addMesh(g, G.sphere(), m.light, 0, s * 0.05, 0, 0, 0, 0, s * 0.7, s * 0.42, s * 0.95);` — low teardrop blister
<!-- /note -->

### <a id="s-fp-3"></a>`fp~3(s, p)`

prop · L49–49

<!-- note:fp~3 -->
<!-- /note -->

### <a id="s-build-3"></a>`build~3(g, s, p, S, rng)`

prop · L50–64

- calls: [`addMesh`](../core/geometry.js.md#s-addMesh) _js/shipgen/core/geometry.js_ ×7
- via [js/shipgen/core/geometry.js](../core/geometry.js.md): `G.box`, `G.cyl`, `G.torus`

<!-- note:build~3 -->
- L53 · `addMesh(g, G.box(), m.dark, 0, s * 0.05, 0, 0, 0, 0, s * 0.2, s * 0.1, s * 1.1);` — swept blade antenna, edge-on to the flow
<!-- /note -->

### <a id="s-fp-4"></a>`fp~4(s, p)`

prop · L66–66

<!-- note:fp~4 -->
<!-- /note -->

### <a id="s-build-4"></a>`build~4(g, s, p, S, rng)`

prop · L67–87

- calls: [`addMesh`](../core/geometry.js.md#s-addMesh) _js/shipgen/core/geometry.js_ ×7
- via [js/shipgen/core/geometry.js](../core/geometry.js.md): `G.box`, `G.cyl`, `G.torus`

<!-- note:build~4 -->
- L70 · `addMesh(g, G.box(), m.dark, 0, s * 0.08, 0, 0, 0, 0, s * 0.95, s * 0.16, s * 0.95);` — recessed aperture window with a shutter frame
<!-- /note -->

### <a id="s-fp-5"></a>`fp~5(s, p)`

prop · L89–89

<!-- note:fp~5 -->
<!-- /note -->

### <a id="s-build-5"></a>`build~5(g, s, p, S, rng)`

prop · L90–110

- calls: [`addMesh`](../core/geometry.js.md#s-addMesh) _js/shipgen/core/geometry.js_ ×7
- via [js/shipgen/core/geometry.js](../core/geometry.js.md): `G.box`, `G.cyl`

<!-- note:build~5 -->
- L93 · `addMesh(g, G.box(), m.dark, 0, s * 0.08, 0, 0, 0, 0, s * 1.0, s * 0.16, s * 1.0);` — flat aperture window; the scan stays in software
<!-- /note -->

### <a id="s-fp-6"></a>`fp~6(s, p)`

prop · L112–112

<!-- note:fp~6 -->
<!-- /note -->

### <a id="s-build-6"></a>`build~6(g, s, p, S, rng)`

prop · L113–137

- calls: [`addMesh`](../core/geometry.js.md#s-addMesh) _js/shipgen/core/geometry.js_ ×8
- via [js/shipgen/core/geometry.js](../core/geometry.js.md): `G.box`, `G.cyl`, `G.sphere`

<!-- note:build~6 -->
- L116 · `addMesh(g, G.box(), m.dark, 0, s * 0.08, 0, 0, 0, 0, s * 1.4, s * 0.16, s * 1.8);` — low fairing with a slit window; the head still sweeps inside
<!-- /note -->
