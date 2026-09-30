# js/shipgen/prefabs/acs.js

[index](../../../../README.md) · 58 lines · 8 symbols · 3 imports · 1 importers

## About

<!-- note:@file -->
Prefabs — Attitude control and boosters.
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

### <a id="s-fp"></a>`fp(s)`

prop · L6–6

<!-- note:fp -->
<!-- /note -->

### <a id="s-build"></a>`build(g, s, p, S, rng)`

prop · L7–20

- calls: [`addMesh`](../core/geometry.js.md#s-addMesh) _js/shipgen/core/geometry.js_ ×2
- via [js/shipgen/core/geometry.js](../core/geometry.js.md): `G.box`, `G.taper`

<!-- note:build -->
<!-- /note -->

### <a id="s-fp-2"></a>`fp~2(s)`

prop · L22–22

<!-- note:fp~2 -->
<!-- /note -->

### <a id="s-build-2"></a>`build~2(g, s, p, S, rng)`

prop · L23–34

- calls: [`addMesh`](../core/geometry.js.md#s-addMesh) _js/shipgen/core/geometry.js_ ×5
- via [js/shipgen/core/geometry.js](../core/geometry.js.md): `G.cyl`, `G.sphere`, `G.torus`

<!-- note:build~2 -->
<!-- /note -->

### <a id="s-fp-3"></a>`fp~3(s)`

prop · L36–36

<!-- note:fp~3 -->
<!-- /note -->

### <a id="s-build-3"></a>`build~3(g, s, p, S, rng)`

prop · L37–43

- calls: [`addMesh`](../core/geometry.js.md#s-addMesh) _js/shipgen/core/geometry.js_ ×3
- via [js/shipgen/core/geometry.js](../core/geometry.js.md): `G.box`, `G.cyl`, `G.torus`

<!-- note:build~3 -->
<!-- /note -->

### <a id="s-fp-4"></a>`fp~4(s)`

prop · L45–45

<!-- note:fp~4 -->
<!-- /note -->

### <a id="s-build-4"></a>`build~4(g, s, p, S, rng)`

prop · L46–57

- calls: [`addMesh`](../core/geometry.js.md#s-addMesh) _js/shipgen/core/geometry.js_ ×6
- via [js/shipgen/core/geometry.js](../core/geometry.js.md): `G.box`, `G.cone`, `G.coneOpen`, `G.cyl`, `G.taper`, `G.torus`

<!-- note:build~4 -->
- L53 · `const pm = m.glow.clone(); pm.transparent = true; pm.opacity = 0.42; pm.depthWrite = false` — booster plume — only lit above 85% throttle
<!-- /note -->
