# js/shipgen/prefabs/docking.js

[index](../../../../README.md) · 58 lines · 8 symbols · 3 imports · 1 importers

## About

<!-- note:@file -->
Prefabs — Docking, airlocks, bays and surface interfaces.
Each prefab: faces (default mount faces), fp(s, part, face) → footprint {w,h,d} in ship units
(w along the face u-axis, d along v, h outward), build(g, s, part, S, rng) where g is a group
whose +Y points away from the hull and S is the StarshipBuilder (mats, lamp, dockBody…).
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

prop · L7–7

<!-- note:build -->
<!-- /note -->

### <a id="s-fp-2"></a>`fp~2(s)`

prop · L9–9

<!-- note:fp~2 -->
<!-- /note -->

### <a id="s-build-2"></a>`build~2(g, s, p, S, rng)`

prop · L10–22

- calls: [`addMesh`](../core/geometry.js.md#s-addMesh) _js/shipgen/core/geometry.js_ ×6
- via [js/shipgen/core/geometry.js](../core/geometry.js.md): `G.box`, `G.cyl`

<!-- note:build~2 -->
<!-- /note -->

### <a id="s-fp-3"></a>`fp~3(s)`

prop · L24–24

<!-- note:fp~3 -->
<!-- /note -->

### <a id="s-build-3"></a>`build~3(g, s, p, S, rng)`

prop · L25–41

- calls: [`addMesh`](../core/geometry.js.md#s-addMesh) _js/shipgen/core/geometry.js_ ×6
- via [js/shipgen/core/geometry.js](../core/geometry.js.md): `G.box`, `G.sphere`

<!-- note:build~3 -->
- L29 · `if (p.drones) for (const sgn of [-1, 1]) { addMesh(g, G.box(), m.metal, sgn * s * 0.5, s *` — payload sitting in the bay
- L33 · `for (const sgn of [-1, 1]) {` — sliding door halves
<!-- /note -->

### <a id="s-fp-4"></a>`fp~4(s)`

prop · L43–43

<!-- note:fp~4 -->
<!-- /note -->

### <a id="s-build-4"></a>`build~4(g, s, p, S, rng)`

prop · L44–57

- calls: [`addMesh`](../core/geometry.js.md#s-addMesh) _js/shipgen/core/geometry.js_ ×4
- via [js/shipgen/core/geometry.js](../core/geometry.js.md): `G.box`, `G.cyl`, `G.torus`

<!-- note:build~4 -->
<!-- /note -->

## Module-level calls

- via [js/shipgen/prefabs/_common.js](_common.js.md): `ALL_FACES.concat`
