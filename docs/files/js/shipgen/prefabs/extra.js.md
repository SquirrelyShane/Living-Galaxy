# js/shipgen/prefabs/extra.js

[index](../../../../README.md) · 110 lines · 16 symbols · 3 imports · 1 importers

## About

<!-- note:@file -->
Prefabs — stores, fluid interfaces, thermal louvers, cargo, robots, beacons.
Added with the 21-domain catalog; same contract as every other prefab file.

- L6 · `sphereTank: { faces: ALL_FACES, fp: (s) => ({ w: s * 1.5, h: s * 1.6, d: s * 1.5 }),` — spherical COPV / pressurant bottle in a cradle
- L18 · `umbilical: { faces: ALL_FACES.concat(["stern"]), fp: (s) => ({ w: s * 1.5, h: s * 0.5, d:` — umbilical / quick-disconnect panel: recessed plate, QD rows, hose stubs
- L34 · `louver: { faces: ALL_FACES, fp: (s) => ({ w: s * 2.0, h: s * 0.6, d: s * 1.5 }),` — louvered radiator: slats that open with the deploy toggle
- L48 · `mli: { faces: ALL_FACES, fp: (s) => ({ w: s * 1.8, h: s * 0.18, d: s * 2.0 }),` — MLI blanket — gold foil with strap grid
- L56 · `beacon: { faces: ALL_FACES, fp: (s) => ({ w: s * 0.8, h: s * 0.9, d: s * 0.8 }),` — emergency beacon: dome, cage, hard white strobe
- L67 · `container: { faces: ALL_FACES, fp: (s) => ({ w: s * 1.7, h: s * 1.3, d: s * 2.2 }),` — standard cargo rack / container stack
- L83 · `tunnel: { faces: ALL_FACES.concat(["bow", "stern"]), fp: (s) => ({ w: s * 1.5, h: s * 1.7,` — pressurized transfer tunnel stub with bellows
- L97 · `crawler: { faces: ALL_FACES, fp: (s) => ({ w: s * 0.9, h: s * 0.6, d: s * 2.6 }),` — hull crawler robot — body on a short rail, patrols back and forth
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

prop · L7–16

- calls: [`addMesh`](../core/geometry.js.md#s-addMesh) _js/shipgen/core/geometry.js_ ×5
- via [js/shipgen/core/geometry.js](../core/geometry.js.md): `G.box`, `G.cyl`, `G.sphere`, `G.torus`

<!-- note:build -->
<!-- /note -->

### <a id="s-fp-2"></a>`fp~2(s)`

prop · L18–18

<!-- note:fp~2 -->
<!-- /note -->

### <a id="s-build-2"></a>`build~2(g, s, p, S, rng)`

prop · L19–32

- calls: [`addMesh`](../core/geometry.js.md#s-addMesh) _js/shipgen/core/geometry.js_ ×5
- via [js/shipgen/core/geometry.js](../core/geometry.js.md): `G.box`, `G.cyl`

<!-- note:build~2 -->
<!-- /note -->

### <a id="s-fp-3"></a>`fp~3(s)`

prop · L34–34

<!-- note:fp~3 -->
<!-- /note -->

### <a id="s-build-3"></a>`build~3(g, s, p, S, rng)`

prop · L35–46

- calls: [`addMesh`](../core/geometry.js.md#s-addMesh) _js/shipgen/core/geometry.js_ ×3
- via [js/shipgen/core/geometry.js](../core/geometry.js.md): `G.box`

<!-- note:build~3 -->
<!-- /note -->

### <a id="s-fp-4"></a>`fp~4(s)`

prop · L48–48

<!-- note:fp~4 -->
<!-- /note -->

### <a id="s-build-4"></a>`build~4(g, s, p, S, rng)`

prop · L49–54

- calls: [`addMesh`](../core/geometry.js.md#s-addMesh) _js/shipgen/core/geometry.js_ ×3
- via [js/shipgen/core/geometry.js](../core/geometry.js.md): `G.box`

<!-- note:build~4 -->
<!-- /note -->

### <a id="s-fp-5"></a>`fp~5(s)`

prop · L56–56

<!-- note:fp~5 -->
<!-- /note -->

### <a id="s-build-5"></a>`build~5(g, s, p, S, rng)`

prop · L57–65

- calls: [`addMesh`](../core/geometry.js.md#s-addMesh) _js/shipgen/core/geometry.js_ ×4
- via [js/shipgen/core/geometry.js](../core/geometry.js.md): `G.cyl`, `G.dome`, `G.torus`

<!-- note:build~5 -->
<!-- /note -->

### <a id="s-fp-6"></a>`fp~6(s)`

prop · L67–67

<!-- note:fp~6 -->
<!-- /note -->

### <a id="s-build-6"></a>`build~6(g, s, p, S, rng)`

prop · L68–81

- calls: [`addMesh`](../core/geometry.js.md#s-addMesh) _js/shipgen/core/geometry.js_ ×5
- via [js/shipgen/core/geometry.js](../core/geometry.js.md): `G.box`

<!-- note:build~6 -->
<!-- /note -->

### <a id="s-fp-7"></a>`fp~7(s)`

prop · L83–83

<!-- note:fp~7 -->
<!-- /note -->

### <a id="s-build-7"></a>`build~7(g, s, p, S, rng)`

prop · L84–95

- calls: [`addMesh`](../core/geometry.js.md#s-addMesh) _js/shipgen/core/geometry.js_ ×5
- via [js/shipgen/core/geometry.js](../core/geometry.js.md): `G.box`, `G.cyl`, `G.torus`

<!-- note:build~7 -->
<!-- /note -->

### <a id="s-fp-8"></a>`fp~8(s)`

prop · L97–97

<!-- note:fp~8 -->
<!-- /note -->

### <a id="s-build-8"></a>`build~8(g, s, p, S, rng)`

prop · L98–109

- calls: [`addMesh`](../core/geometry.js.md#s-addMesh) _js/shipgen/core/geometry.js_ ×4
- via [js/shipgen/core/geometry.js](../core/geometry.js.md): `G.box`, `G.cyl`

<!-- note:build~8 -->
<!-- /note -->

## Module-level calls

- via [js/shipgen/prefabs/_common.js](_common.js.md): `ALL_FACES.concat`
