# js/shipgen/prefabs/industrial.js

[index](../../../../README.md) · 74 lines · 8 symbols · 3 imports · 1 importers

## About

<!-- note:@file -->
Prefabs — Mining, manipulation and labs.
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

### <a id="s-fp"></a>`fp(s, p, face)`

prop · L7–7

<!-- note:fp -->
<!-- /note -->

### <a id="s-build"></a>`build(g0, s, p, S, rng)`

prop · L8–35

- calls: [`addMesh`](../core/geometry.js.md#s-addMesh) _js/shipgen/core/geometry.js_ ×9
- via [js/shipgen/core/geometry.js](../core/geometry.js.md): `G.box`, `G.cone`, `G.cyl`

<!-- note:build -->
- L12 · `g = new THREE.Group(); g.rotation.x = -Math.PI / 2; g.position.set(0, s * 0.35, s * 2.6);` — lay the boom along the hull, shoulder aft, cutter head reaching past the bow
- L18 · `const inner = addMesh(g, G.cyl(10), m.panel, 0, s * 0.7 + arm * 0.72, 0, 0, 0, 0, r * 0.62` — inner stage telescopes out when mining starts (see ops: dd.ext)
- L32 · `g0.userData.workzone = { node: g, center: [0, tipY + s * 1.5, 0], size: [s * 1.7, s * 3.2,` — reserve the cutting envelope ahead of the head so nothing else mounts in the drill's swing
<!-- /note -->

### <a id="s-fp-2"></a>`fp~2(s)`

prop · L37–37

<!-- note:fp~2 -->
<!-- /note -->

### <a id="s-build-2"></a>`build~2(g, s, p, S, rng)`

prop · L38–46

- calls: [`addMesh`](../core/geometry.js.md#s-addMesh) _js/shipgen/core/geometry.js_ ×4
- via [js/shipgen/core/geometry.js](../core/geometry.js.md): `G.box`

<!-- note:build~2 -->
<!-- /note -->

### <a id="s-fp-3"></a>`fp~3(s)`

prop · L48–48

<!-- note:fp~3 -->
<!-- /note -->

### <a id="s-build-3"></a>`build~3(g, s, p, S, rng)`

prop · L49–61

- calls: [`addMesh`](../core/geometry.js.md#s-addMesh) _js/shipgen/core/geometry.js_ ×6
- via [js/shipgen/core/geometry.js](../core/geometry.js.md): `G.box`, `G.cyl`

<!-- note:build~3 -->
<!-- /note -->

### <a id="s-fp-4"></a>`fp~4(s)`

prop · L63–63

<!-- note:fp~4 -->
<!-- /note -->

### <a id="s-build-4"></a>`build~4(g, s, p, S, rng)`

prop · L64–73

- calls: [`addMesh`](../core/geometry.js.md#s-addMesh) _js/shipgen/core/geometry.js_ ×5
- via [js/shipgen/core/geometry.js](../core/geometry.js.md): `G.box`, `G.cyl`, `G.dome`, `G.torus`

<!-- note:build~4 -->
<!-- /note -->
