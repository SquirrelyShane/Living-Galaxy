# js/shipgen/prefabs/power.js

[index](../../../../README.md) · 103 lines · 8 symbols · 3 imports · 1 importers

## About

<!-- note:@file -->
Prefabs — Power plants, arrays and thermal rejection.
Each prefab: faces (default mount faces), fp(s, part, face) → footprint {w,h,d} in ship units
(w along the face u-axis, d along v, h outward), build(g, s, part, S, rng) where g is a group
whose +Y points away from the hull and S is the StarshipBuilder (mats, lamp, dockBody…).

- L44 · `array: { faces: ["port", "star", "top", "bottom"],` — deployable array: an accordion of panel segments on a root hinge.
  Stowed: root lies flat, segments fold back over each other (alternating up/down).
  Deployed: root stands the stack off the hull, segments unfold into one long wing.
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

prop · L7–30

- calls: [`addMesh`](../core/geometry.js.md#s-addMesh) _js/shipgen/core/geometry.js_ ×10
- via [js/shipgen/core/geometry.js](../core/geometry.js.md): `G.box`, `G.cyl`, `G.torus`

<!-- note:build -->
- L10 · `addMesh(g, G.cyl(16), m.metal, 0, s * 1.05, -s * 1.3, Math.PI / 2, 0, 0, s * 1.1, s * 0.16` — shadow shield toward the ship's forward end
- L23 · `for (const sgn of [-1, 1]) {` — radiator fins
<!-- /note -->

### <a id="s-fp-2"></a>`fp~2(s)`

prop · L32–32

<!-- note:fp~2 -->
<!-- /note -->

### <a id="s-build-2"></a>`build~2(g, s, p, S, rng)`

prop · L33–42

- calls: [`addMesh`](../core/geometry.js.md#s-addMesh) _js/shipgen/core/geometry.js_ ×4
- via [js/shipgen/core/geometry.js](../core/geometry.js.md): `G.box`, `G.cyl`

<!-- note:build~2 -->
<!-- /note -->

### <a id="s-fp-3"></a>`fp~3(s, p)`

prop · L45–49

<!-- note:fp~3 -->
- L47 · `const h = s * (p.deploy && !p.stowedFp ? 0.35 + n * 1.45 : 0.4);` — stowedFp: hull flies through air with wings folded, so only the folded stack claims space
- L48 · `return p.edgewise ? { w: s * 1.6, h, d: s * 2.3 } : { w: s * 2.3, h, d: s * 1.6 };` — edgewise: the wing is turned 90° about the face normal so its edge, not its face, meets the flow
<!-- /note -->

### <a id="s-build-3"></a>`build~3(g, s, p, S, rng)`

prop · L50–84

- calls: [`addMesh`](../core/geometry.js.md#s-addMesh) _js/shipgen/core/geometry.js_ ×8
- via [js/shipgen/core/geometry.js](../core/geometry.js.md): `G.box`, `G.cyl`

<!-- note:build~3 -->
- L64 · `const side = k % 2 ? 1 : -1;` — hinge on the far edge of the previous segment; alternate the offset side so the folded stack climbs
- L77 · `S.lamp(seg, { box: true, color: "#ff6a3a", y: th * 1.5, z: segL * 0.95, r: 1, sx: segW * 0` — heat glow rides the far edge of every segment, not past it
- L82 · `S.lamp(parent, { color: p.tint === "solar" ? "#ffffff" : "#ffb03a", y: th * 1.6, z: segL *` — tip lamp on the last segment's outer edge
<!-- /note -->

### <a id="s-fp-4"></a>`fp~4(s)`

prop · L86–86

<!-- note:fp~4 -->
<!-- /note -->

### <a id="s-build-4"></a>`build~4(g, s, p, S, rng)`

prop · L87–102

- calls: [`addMesh`](../core/geometry.js.md#s-addMesh) _js/shipgen/core/geometry.js_ ×5
- via [js/shipgen/core/geometry.js](../core/geometry.js.md): `G.box`, `G.cyl`

<!-- note:build~4 -->
<!-- /note -->
