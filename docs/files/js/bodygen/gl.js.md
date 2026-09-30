# js/bodygen/gl.js

[index](../../../README.md) · 49 lines · 7 symbols · 2 imports · 4 importers

## About

<!-- note:@file -->
LIVING GALAXY — making the asteroid generator's shaders sit in this renderer.

The generator's hand-written ShaderMaterials (debris clouds, shatter fields,
Impact Lab sprites and ejecta rocks, fractured bodies) were written for a
demo page with an ordinary depth buffer and a scene ten units across. This
game renders with `logarithmicDepthBuffer: true` across thirty million units,
and a ShaderMaterial that does not include three's logdepth chunks writes a
LINEAR depth into a logarithmic buffer — every rock in a debris cloud then
sorts against the hull, the canopy and each other by the wrong number, which
reads as clouds drawn through ships. MeshStandardMaterial-based paths get the
chunks for free; these do not, so they are added here.

The vendored files are not edited. Their shader text is exported as mutable
objects (`SHADERS` in debris.js, `IMPACT_SHADERS` in impact-shaders.js), and
the generator reads them at material-creation time, so patching the strings
once, before the first material is made, is enough.

One addition rides along on the debris shaders: `uFade`, a 0..1 master that
shrinks every instance to nothing and fades every mote. The generator's
fields live forever (a demo has one rock); a game spawns a shatter field
every time a rock is cut out and needs a way to let one go.
<!-- /note -->

## Imports

| line | from | names | target |
|---|---|---|---|
| 1 | `../asteroidgen/debris.js` | `SHADERS` | [js/asteroidgen/debris.js](../asteroidgen/debris.js.md) |
| 2 | `../asteroidgen/impact-shaders.js` | `IMPACT_SHADERS` | [js/asteroidgen/impact-shaders.js](../asteroidgen/impact-shaders.js.md) |

## Imported by

- [js/render/holefx.js](../render/holefx.js.md) — `logDepthVertex`, `logDepthFragment`
- [js/render/impactfx.js](../render/impactfx.js.md) — `patchGeneratorShaders`
- [js/render/rockfx.js](../render/rockfx.js.md) — `patchGeneratorShaders`, `addFadeUniform`
- test/asteroids.test.mjs _(outside js/)_ — `patchGeneratorShaders`

## Exports

- [`logDepthVertex`](#s-logDepthVertex) · function — used by [js/render/holefx.js](../render/holefx.js.md)
- [`logDepthFragment`](#s-logDepthFragment) · function — used by [js/render/holefx.js](../render/holefx.js.md)
- [`patchGeneratorShaders`](#s-patchGeneratorShaders) · function — used by [js/render/impactfx.js](../render/impactfx.js.md), [js/render/rockfx.js](../render/rockfx.js.md), test/asteroids.test.mjs
- [`addFadeUniform`](#s-addFadeUniform) · function — used by [js/render/rockfx.js](../render/rockfx.js.md)

## Effects

_none detected_

## Symbols

### <a id="s-logDepthVertex"></a>`logDepthVertex(src)`

function · **exported** · L4–8

- called by: [`patchGeneratorShaders`](#s-patchGeneratorShaders) ×3 · [`makeHoleFx`](../render/holefx.js.md#s-makeHoleFx) _js/render/holefx.js_ ×2

<!-- note:logDepthVertex -->
Add three's logarithmic-depth chunks to a vertex shader string.
<!-- /note -->

### <a id="s-logDepthFragment"></a>`logDepthFragment(src)`

function · **exported** · L10–16

- called by: [`patchGeneratorShaders`](#s-patchGeneratorShaders) ×4 · [`makeHoleFx`](../render/holefx.js.md#s-makeHoleFx) _js/render/holefx.js_ ×2

<!-- note:logDepthFragment -->
Add three's logarithmic-depth chunks to a fragment shader string.
<!-- /note -->

### <a id="s-stripCommon"></a>`stripCommon(src)`

function · L18–20

- called by: [`patchGeneratorShaders`](#s-patchGeneratorShaders) ×3

<!-- note:stripCommon -->
An early `return` in a vertex main (the Impact Lab sprites hide unemitted
slots that way) skips the chunk at the end, which is harmless: the point is
parked off-screen at size 0. But `common` must not be included twice.
<!-- /note -->

### <a id="s-patched"></a>`patched`

const · L22–22

<!-- note:patched -->
<!-- /note -->

### <a id="s-patchGeneratorShaders"></a>`patchGeneratorShaders()`

function · **exported** · L24–44

- calls: [`logDepthFragment`](#s-logDepthFragment) ×4 · [`logDepthVertex`](#s-logDepthVertex) ×3 · [`patchGeneratorShaders>fade`](#s-patchGeneratorShaders-fade) ×2 · [`stripCommon`](#s-stripCommon) ×3
- called by: [`makeImpactFx`](../render/impactfx.js.md#s-makeImpactFx) _js/render/impactfx.js_ · [`makeRockFx`](../render/rockfx.js.md#s-makeRockFx) _js/render/rockfx.js_

<!-- note:patchGeneratorShaders -->
Patch the generator's shader text once. Safe to call from every module that builds its materials.

- L42 · `for (const k of ["bodyVertex", "spriteVertex", "rockVertex"]) IMPACT_SHADERS[k] = logDepth` — ---- Impact Lab: fractured bodies, sprites, ejecta rocks -------------
<!-- /note -->

#### <a id="s-patchGeneratorShaders-fade"></a>`patchGeneratorShaders>fade(v)`

function · L28–30

- called by: [`patchGeneratorShaders`](#s-patchGeneratorShaders) ×2

<!-- note:patchGeneratorShaders>fade -->
---- debris / shatter fields ----------------------------------------
<!-- /note -->

### <a id="s-addFadeUniform"></a>`addFadeUniform(uniforms)`

function · **exported** · L46–49

- called by: [`makeRockFx>attachCloud`](../render/rockfx.js.md#s-makeRockFx-attachCloud) _js/render/rockfx.js_ · [`makeRockFx>shatter`](../render/rockfx.js.md#s-makeRockFx-shatter) _js/render/rockfx.js_

<!-- note:addFadeUniform -->
The uniform every patched debris field needs before its first frame.
<!-- /note -->
