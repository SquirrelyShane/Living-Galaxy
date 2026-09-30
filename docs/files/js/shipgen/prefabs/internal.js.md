# js/shipgen/prefabs/internal.js

[index](../../../../README.md) · 43 lines · 6 symbols · 2 imports · 1 importers

## About

<!-- note:@file -->
Prefabs — Flush / boxed hardware for internal systems.
Each prefab: faces (default mount faces), fp(s, part, face) → footprint {w,h,d} in ship units
(w along the face u-axis, d along v, h outward), build(g, s, part, S, rng) where g is a group
whose +Y points away from the hull and S is the StarshipBuilder (mats, lamp, dockBody…).
<!-- /note -->

## Imports

| line | from | names | target |
|---|---|---|---|
| 1 | `../core/geometry.js` | `G`, `addMesh` | [js/shipgen/core/geometry.js](../core/geometry.js.md) |
| 2 | `./_common.js` | `ALL_FACES` | [js/shipgen/prefabs/_common.js](_common.js.md) |

## Imported by

- [js/shipgen/prefabs/index.js](index.js.md) — `default`

## Exports

- `default` · ObjectExpression — used by [js/shipgen/prefabs/index.js](index.js.md)

## Effects

_none detected_

## Symbols

### <a id="s-fp"></a>`fp(s)`

prop · L5–5

<!-- note:fp -->
<!-- /note -->

### <a id="s-build"></a>`build(g, s, p, S, rng)`

prop · L6–15

- calls: [`addMesh`](../core/geometry.js.md#s-addMesh) _js/shipgen/core/geometry.js_ ×5
- via [js/shipgen/core/geometry.js](../core/geometry.js.md): `G.box`, `G.cyl`, `G.torus`

<!-- note:build -->
<!-- /note -->

### <a id="s-fp-2"></a>`fp~2(s)`

prop · L17–17

<!-- note:fp~2 -->
<!-- /note -->

### <a id="s-build-2"></a>`build~2(g, s, p, S, rng)`

prop · L18–29

- calls: [`addMesh`](../core/geometry.js.md#s-addMesh) _js/shipgen/core/geometry.js_ ×6
- via [js/shipgen/core/geometry.js](../core/geometry.js.md): `G.box`, `G.torus`

<!-- note:build~2 -->
<!-- /note -->

### <a id="s-fp-3"></a>`fp~3(s)`

prop · L31–31

<!-- note:fp~3 -->
<!-- /note -->

### <a id="s-build-3"></a>`build~3(g, s, p, S, rng)`

prop · L32–42

- calls: [`addMesh`](../core/geometry.js.md#s-addMesh) _js/shipgen/core/geometry.js_ ×4
- via [js/shipgen/core/geometry.js](../core/geometry.js.md): `G.cyl`, `G.torus`

<!-- note:build~3 -->
<!-- /note -->
