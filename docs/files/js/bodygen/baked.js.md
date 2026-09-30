# js/bodygen/baked.js

[index](../../../README.md) · 104 lines · 8 symbols · 1 imports · 1 importers

## About

<!-- note:@file -->
LIVING GALAXY — a baked body in the scene.

Turns a growBaked() result (js/bodygen/body.js, grown in the worker) into a
geometry, three data textures and a material. The material is a
MeshStandardMaterial with the surface read from the atlases instead of
vertex attributes: albedo (stored as √ so dark rock keeps its 8 bits),
metalness, roughness, emission, and — the whole point — the generator's own
full-resolution normal, in object space, turned into view space per
fragment. The same material works instanced (the belt field's class
prototypes, tinted per instance) and on a single grown body.

Every baked material shares one program; only its textures differ.
<!-- /note -->

## Imports

| line | from | names | target |
|---|---|---|---|
| 1 | `./classes.js` | `CLASSES` | [js/bodygen/classes.js](classes.js.md) |

## Imported by

- [js/render/engine.js](../render/engine.js.md) — `mountBakedData`, `bakedMaterial`

## Exports

- [`bakedMaterial`](#s-bakedMaterial) · function — used by [js/render/engine.js](../render/engine.js.md)
- [`bakedGeometry`](#s-bakedGeometry) · function — **no importer in scanned roots**
- [`mountBakedData`](#s-mountBakedData) · function — used by [js/render/engine.js](../render/engine.js.md)

## Effects

_none detected_

## Symbols

### <a id="s-dataTex"></a>`dataTex(THREE, arr, W, H)`

function · L3–11

- called by: [`mountBakedData`](#s-mountBakedData) ×3

<!-- note:dataTex -->
- L6 · `t.minFilter = THREE.LinearFilter;` — an atlas has no mip-safe gutters; texels are vertices anyway
<!-- /note -->

### <a id="s-VS_PARS"></a>`VS_PARS`

const · L13–18

<!-- note:VS_PARS -->
<!-- /note -->

### <a id="s-VS_MAIN"></a>`VS_MAIN`

const · L20–29

<!-- note:VS_MAIN -->
<!-- /note -->

### <a id="s-FS_PARS"></a>`FS_PARS`

const · L31–41

<!-- note:FS_PARS -->
<!-- /note -->

### <a id="s-bakedMaterial"></a>`bakedMaterial(THREE, {…})`

function · **exported** · L43–71

- called by: [`mountBakedData`](#s-mountBakedData) · [`mountGame>mountShared`](../render/engine.js.md#s-mountGame-mountShared) _js/render/engine.js_

<!-- note:bakedMaterial -->
The material for one bake. `emitScale` 0 means the body has no glow atlas.
<!-- /note -->

### <a id="s-bakedGeometry"></a>`bakedGeometry(THREE, m)`

function · **exported** · L73–81

- called by: [`mountBakedData`](#s-mountBakedData)

<!-- note:bakedGeometry -->
One mesh of a bake as a BufferGeometry (atlas coordinates on `aBakeUv`).
<!-- /note -->

### <a id="s-mountBakedData"></a>`mountBakedData(THREE, d)`

function · **exported** · L83–104

- calls: [`bakedGeometry`](#s-bakedGeometry) · [`bakedMaterial`](#s-bakedMaterial) · [`dataTex`](#s-dataTex) ×3
- called by: [`mountGame`](../render/engine.js.md#s-mountGame) _js/render/engine.js_ · [`mountGame>mountBody`](../render/engine.js.md#s-mountGame-mountBody) _js/render/engine.js_ · [`mountGame>shapeFor`](../render/engine.js.md#s-mountGame-shapeFor) _js/render/engine.js_

<!-- note:mountBakedData -->
Everything the renderer needs for one grown result: geometries (one per L),
textures, the material, and a `built` record shaped like generateBody's, so
the assay card, the shatter field and the tests read it the same way.

- L90 · `const color = new THREE.BufferAttribute(m0.colors, 3);` — the shatter field samples its palette off the body's colour attribute
<!-- /note -->

#### <a id="s-mountBakedData-dispose"></a>`mountBakedData>dispose()`

function · L99–102

<!-- note:mountBakedData>dispose -->
<!-- /note -->
