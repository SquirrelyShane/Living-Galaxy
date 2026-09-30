# js/render/postfx.js

[index](../../../README.md) · 248 lines · 21 symbols · 2 imports · 1 importers

## About

<!-- note:@file -->
LIVING GALAXY — bloom, and (since 0.3) the black-hole lens.

The warp tunnel wants glow. Streaks that are merely bright white lines read
as lines; streaks that bleed into the space around them read as speed, and
that difference is most of why a warp effect works at all.

---- why this is hand-rolled ---------------------------------------------

Three ships a perfectly good `UnrealBloomPass`, and the obvious move is to
vendor it beside the core build. Two reasons not to:

  - It is a five-mip-level pyramid: six render targets, five separable blur
    pairs, a composite, plus `EffectComposer`, `RenderPass`, `ShaderPass`,
    `MaskPass`, `CopyShader`, `OutputPass` and `OutputShader` to drive it.
    That is nine files and a lot of fill rate for a phone that is already
    GPU-bound before any of it runs.
  - This effect does not need a pyramid. It needs a threshold and one wide
    soft blur, because everything it is blooming is a thin bright line on a
    near-black field. A half-resolution bright pass and two quarter-res
    blur pairs get within a hair of the same picture for a fraction of the
    cost, and it is ~200 lines rather than nine vendored files.

So: a two-target composer built from primitives the vendored core already
has. No new dependency, no build step, and it is sized for the device this
is actually played on.

---- the colour-space contract -------------------------------------------

The renderer tone-maps (ACES) and encodes to sRGB on its way to the canvas.
That must happen exactly once. So the scene is rendered into a LINEAR
half-float target with tone mapping OFF, the bloom is built in linear light
where thresholding actually means something, and the final composite shader
does the tone map and the sRGB encode itself on its way to the screen.

---- when it runs ---------------------------------------------------------

Only when there is something to bloom and the frame budget can afford it
(perf.js). Idle, or on a device at a low tier, `render()` is a plain
`renderer.render()` and no target is even allocated. A composer that costs
two full-screen passes to draw a sky with nothing glowing in it is a
composer that should have been switched off.
<!-- /note -->

## Imports

| line | from | names | target |
|---|---|---|---|
| 1 | `three` | `*` as `THREE` | external |
| 2 | `../core/perf.js` | `perf` | [js/core/perf.js](../core/perf.js.md) |

## Imported by

- [js/render/engine.js](engine.js.md) — `makeBloom`

## Exports

- [`BLOOM_ON_TIER`](#s-BLOOM_ON_TIER) · const — **no importer in scanned roots**
- [`BLOOM_OFF_TIER`](#s-BLOOM_OFF_TIER) · const — **no importer in scanned roots**
- [`makeBloom`](#s-makeBloom) · function — used by [js/render/engine.js](engine.js.md)

## Effects

_none detected_

## Symbols

### <a id="s-BLOOM_ON_TIER"></a>`BLOOM_ON_TIER`

const · **exported** · L4–4

<!-- note:BLOOM_ON_TIER -->
---- the gate, and why it is a dead band ---------------------------------

Bloom costs fill rate. Fill rate costs frame time. Frame time is what
perf.js measures to pick a tier — so a single threshold is a feedback loop:
bloom turns on, the frame gets slower, the tier drops, bloom turns off, the
frame recovers, the tier climbs, bloom turns on. The hysteresis in perf.js
stops that being a per-frame strobe and turns it into a roughly six-second
one, which is worse, because six seconds is long enough to look deliberate.

So the gate has a dead band of its own and a latch. It takes tier 3 to
switch bloom ON and a drop below tier 2 to switch it OFF, and between those
it holds whatever it last decided. A device that can only just afford it
settles one way and stays there.
<!-- /note -->

### <a id="s-BLOOM_OFF_TIER"></a>`BLOOM_OFF_TIER`

const · **exported** · L5–5

<!-- note:BLOOM_OFF_TIER -->
<!-- /note -->

### <a id="s-QUAD"></a>`QUAD`

const · L7–7

<!-- note:QUAD -->
<!-- /note -->

### <a id="s-ORTHO"></a>`ORTHO`

const · L8–8

<!-- note:ORTHO -->
<!-- /note -->

### <a id="s-VERT"></a>`VERT`

const · L10–15

<!-- note:VERT -->
---- shaders --------------------------------------------------------------
Deliberately small and unclever: a full-screen triangle-ish quad, no
varyings beyond uv, no branching in the hot ones.

- L10 · `const VERT =` — glsl
<!-- /note -->

### <a id="s-BRIGHT"></a>`BRIGHT`

const · L17–30

<!-- note:BRIGHT -->
Bright pass with a soft knee: a hard threshold makes the bloom pop on and
off as something crosses it, which on a streak that is fading in as you
spool looks like a bug.

- L17 · `const BRIGHT =` — glsl
<!-- /note -->

### <a id="s-BLUR"></a>`BLUR`

const · L32–45

<!-- note:BLUR -->
One separable Gaussian, run twice per level (H then V). Nine taps with
linear-sampling weights: wide enough to bleed properly, cheap enough to
run four times a frame at quarter resolution.

- L32 · `const BLUR =` — glsl
<!-- /note -->

### <a id="s-COMPOSITE"></a>`COMPOSITE`

const · L47–67

<!-- note:COMPOSITE -->
The one place tone mapping and the sRGB encode happen. ACES fitted — the
same curve `ACESFilmicToneMapping` uses, so switching the composer on and
off does not change how the sky looks, only how the bright things bleed.

- L47 · `const COMPOSITE =` — glsl
<!-- /note -->

### <a id="s-MERGE"></a>`MERGE`

const · L69–77

<!-- note:MERGE -->
The lens over the scene, by the lens's own mask (js/render/holefx.js writes 0 where
a pixel is not bent). The lens may be half resolution; the scene is not.

- L69 · `const MERGE =` — glsl
<!-- /note -->

### <a id="s-pass"></a>`pass(fragmentShader, uniforms)`

function · L79–92

- called by: [`makeBloom`](#s-makeBloom) ×4

<!-- note:pass -->
<!-- /note -->

### <a id="s-target"></a>`target(w, h, type, depth=)`

function · L94–107

- called by: [`makeBloom.render`](#s-makeBloom-render) ×2 · [`makeBloom>alloc`](#s-makeBloom-alloc) ×5

<!-- note:target -->
- L103 · `if (depth) rt.depthTexture = new THREE.DepthTexture(Math.max(1, w), Math.max(1, h), THREE.` — The scene target carries a depth TEXTURE, not just a buffer: the lens reads
  it to keep whatever is in front of the hole unbent. It also fixes a quiet
  bug from before the lens — the scene used to be drawn into a target with no
  depth buffer at all whenever bloom was on, which only went unnoticed
  because bloom only ran inside the warp tunnel.
- L104 · `rt.texture.colorSpace = THREE.LinearSRGBColorSpace;` — linear light all the way through: the encode happens once, at the end
<!-- /note -->

### <a id="s-makeBloom"></a>`makeBloom(renderer, scene, camera)`

function · **exported** · L109–248

- calls: [`pass`](#s-pass) ×4
- called by: [`mountGame`](engine.js.md#s-mountGame) _js/render/engine.js_

<!-- note:makeBloom -->
A bloom composer over an existing renderer/scene/camera.

  render(strength)  draw the frame. `strength` 0 disables the whole thing
                    for this frame and falls back to a plain render, so the
                    cost only exists while something is actually glowing.

- L111 · `const type = caps.isWebGL2 || renderer.extensions?.has?.("OES_texture_half_float")` — half-float if we can have it: bloom on an 8-bit target bands badly on the
  exact thing this is for, a thin bright line on black
- L119 · `let latched = false;` — the gate's own state, see the dead band above
<!-- /note -->

#### <a id="s-makeBloom-alloc"></a>`makeBloom>alloc(nw, nh)`

function · L136–153

- calls: [`makeBloom>free`](#s-makeBloom-free) · [`target`](#s-target) ×5
- called by: [`makeBloom.render`](#s-makeBloom-render)

<!-- note:makeBloom>alloc -->
- L144 · `rtA = target(w >> 1, h >> 1, type);` — half res for the first bloom level, quarter for the second — the wide
  soft one that does most of the actual bleeding
<!-- /note -->

#### <a id="s-makeBloom-free"></a>`makeBloom>free()`

function · L155–159

- called by: [`makeBloom.dispose`](#s-makeBloom-dispose) · [`makeBloom.render`](#s-makeBloom-render) · [`makeBloom>alloc`](#s-makeBloom-alloc)

<!-- note:makeBloom>free -->
<!-- /note -->

#### <a id="s-makeBloom-blur"></a>`makeBloom>blur(src, dst, tmp, px, py)`

function · L163–172

- called by: [`makeBloom.render`](#s-makeBloom-render) ×2

<!-- note:makeBloom>blur -->
<!-- /note -->

#### <a id="s-makeBloom-active"></a>`makeBloom.active(strength)`

prop · L175–181

<!-- note:makeBloom.active -->
Is the composer going to do anything this frame?

- L177 · `if (perf.locked != null) return perf.tier >= BLOOM_OFF_TIER;` — a pinned tier is a decision, not a measurement
<!-- /note -->

#### <a id="s-makeBloom-render"></a>`makeBloom.render(strength=, lens=)`

prop · L183–237

- calls: [`makeBloom>alloc`](#s-makeBloom-alloc) · [`makeBloom>blur`](#s-makeBloom-blur) ×2 · [`makeBloom>free`](#s-makeBloom-free) · [`target`](#s-target) ×2

<!-- note:makeBloom.render -->
Draw the frame. `lens` is js/render/holefx.js's pass for this frame, or null:
`{ scene, prepare(colorTexture, depthTexture) }`. A lens forces the
composer path even when there is nothing to bloom — it needs the scene
and its depth as textures — and bloom is then built from the lensed
image, so the disk bleeds the way a hot disk should.

- L187 · `if (ready) free();` — the plain path, byte for byte what the engine did before this module
  existed — tone mapping and encode by the renderer, straight to the
  canvas, no targets touched
- L198 · `const exposure = renderer.toneMappingExposure;` — 1. the sky, in linear light, untone-mapped
- L204 · `let src = sceneRT;` — 1b. the lens bends it
- L221 · `brightPass.uniforms.tSrc.value = src.texture;` — 2. what is bright enough to bleed
- L225 · `blur(rtA, rtA, rtB, 1 / (w >> 1), 1 / (h >> 1));` — 3. two levels of separable blur: tight and wide. (Before 0.3 the
  first call was blur(rtA, rtB, rtA): its horizontal half read rtA while
  drawing into rtA, which WebGL refuses as a feedback loop — the tight
  level was silently never drawn. H into rtB, V back into rtA.)
- L229 · `compPass.uniforms.tScene.value = src.texture;` — 4. back to the screen, tone-mapped and encoded exactly once
<!-- /note -->

#### <a id="s-makeBloom-setThreshold"></a>`makeBloom.setThreshold(v, knee=)`

prop · L239–242

<!-- note:makeBloom.setThreshold -->
Threshold is worth moving: a warp tunnel wants more of the frame to bleed.
<!-- /note -->

#### <a id="s-makeBloom-dispose"></a>`makeBloom.dispose()`

prop · L244–244

- calls: [`makeBloom>free`](#s-makeBloom-free)

<!-- note:makeBloom.dispose -->
<!-- /note -->

#### <a id="s-makeBloom-targets"></a>`makeBloom.targets()`

prop · L245–245

<!-- note:makeBloom.targets -->
debug: the targets, for a harness to read back
<!-- /note -->

#### <a id="s-makeBloom-failed"></a>`makeBloom.failed()`

prop · L246–246

<!-- note:makeBloom.failed -->
<!-- /note -->
