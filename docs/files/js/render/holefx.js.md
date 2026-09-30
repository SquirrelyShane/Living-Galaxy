# js/render/holefx.js

[index](../../../README.md) · 428 lines · 23 symbols · 12 imports · 1 importers

## About

<!-- note:@file -->
LIVING GALAXY — seeing a collapsed star.

js/world/events/holes.js decides where a hole is and what it eats; this draws it.

  THE LENS    the asteroid generator's Kerr lens (vendored at
              js/asteroidgen/blackhole.js): each pixel's ray is traced through
              a spinning hole's spacetime with the DNGR equations the film
              Interstellar was rendered with — the shadow, the photon ring, the
              thin disk lensed over and under the shadow, and the stars behind
              it bent into arcs. It runs as a pass inside js/render/postfx.js over the
              scene and its depth, so a hull in front of the hole stays a hull.
  THE STAND-IN  when the lens is gated off (a low frame-budget tier, reduced
              motion, or `localStorage["lgaa.lens"] = "off"`), a black shadow
              sphere and an unlensed disk, so the thing that is eating the belt
              is still a thing you can see and steer away from.
  INFALL      rocks the hole takes out of the belt near you do not blink out:
              each spirals down, flattens into the disk plane, heats, is
              stretched along the line to the hole, and burns away at the
              inner edge — the generator's debris-well law, per instance, in
              the vertex shader.
  TIDES       a rogue that strays inside the tidal radius is torn apart by the
              generator's TidalBody: its own grown body cut into solid chunks
              that peel off the tidal bulges, stream, spaghettify, heat and
              burn into the disk. Visual only — the rogue itself was already
              removed by holes.js.

The disk is lit by what fell in: holes.js keeps accreted mass by the radius
it burned at, and `buildRings` turns that into the lens's ring uniforms.

Adapting the lens to this renderer (the vendored file is not edited; its
shader text is exported and patched here):
  - the game draws with a LOGARITHMIC depth buffer, so the lens's perspective
    depth linearisation is replaced with the log-depth inverse
  - the lens's few absolute distances (how far a bent ray is marched through
    the depth buffer, the depth-match slack) were written for a scene ten
    units across; they scale with the hole here
  - a per-pixel cut-off: a ray passing further out than the deflection that
    would move it a pixel does no work at all, which is most of the screen
    when the hole is far

- L15 · `const INFALL_CAP = 64;` — per rock variant
- L17 · `const LENS_ON_TIER = 2;` — same dead-band idea as the bloom gate (postfx.js)
<!-- /note -->

## Imports

| line | from | names | target |
|---|---|---|---|
| 1 | `three` | `*` as `THREE` | external |
| 2 | `../asteroidgen/blackhole.js` | `BLACKHOLE_SHADER`, `RING_MAX`, `buildRings` | [js/asteroidgen/blackhole.js](../asteroidgen/blackhole.js.md) |
| 3 | `../asteroidgen/debris.js` | `BH_RS`, `makeRockGeometry` | [js/asteroidgen/debris.js](../asteroidgen/debris.js.md) |
| 4 | `../asteroidgen/kerr.js` | `KERR`, `isco`, `horizon` | [js/asteroidgen/kerr.js](../asteroidgen/kerr.js.md) |
| 5 | `../asteroidgen/tidal.js` | `TidalBody`, `Trajectory`, `TIDAL`, `setTidalSpin` | [js/asteroidgen/tidal.js](../asteroidgen/tidal.js.md) |
| 6 | `../asteroidgen/rng.js` | `RNG` | [js/asteroidgen/rng.js](../asteroidgen/rng.js.md) |
| 7 | `../bodygen/body.js` | `generateBody`, `bodyMaterial`, `rogueParams` | [js/bodygen/body.js](../bodygen/body.js.md) |
| 8 | `../bodygen/gl.js` | `logDepthVertex`, `logDepthFragment` | [js/bodygen/gl.js](../bodygen/gl.js.md) |
| 9 | `../world/events/impacts.js` | `rogueClassOf` | [js/world/events/impacts.js](../world/events/impacts.js.md) |
| 10 | `../world/events/holes.js` | `holes`, `holeFx`, `holeRadii` | [js/world/events/holes.js](../world/events/holes.js.md) |
| 11 | `../world/rockgen.js` | `oreLook` | [js/world/rockgen.js](../world/rockgen.js.md) |
| 12 | `../core/perf.js` | `perf` | [js/core/perf.js](../core/perf.js.md) |

## Imported by

- [js/render/engine.js](engine.js.md) — `makeHoleFx`

## Exports

- [`makeHoleFx`](#s-makeHoleFx) · function — used by [js/render/engine.js](engine.js.md)

## Effects

- **storage.get** — `lgaa.lens` (makeHoleFx:79)

## Symbols

### <a id="s-COARSE"></a>`COARSE`

const · L14–14

<!-- note:COARSE -->
<!-- /note -->

### <a id="s-INFALL_CAP"></a>`INFALL_CAP`

const · L15–15

<!-- note:INFALL_CAP -->
<!-- /note -->

### <a id="s-MAX_TIDAL"></a>`MAX_TIDAL`

const · L16–16

<!-- note:MAX_TIDAL -->
<!-- /note -->

### <a id="s-LENS_ON_TIER"></a>`LENS_ON_TIER`

const · L17–17

<!-- note:LENS_ON_TIER -->
<!-- /note -->

### <a id="s-LENS_OFF_TIER"></a>`LENS_OFF_TIER`

const · L18–18

<!-- note:LENS_OFF_TIER -->
<!-- /note -->

### <a id="s-lensShader"></a>`lensShader()`

function · L20–40

- calls: [`lensShader>rep`](#s-lensShader-rep) ×8
- called by: [`makeHoleFx`](#s-makeHoleFx)

<!-- note:lensShader -->
---- the lens shader, adapted ------------------------------------------------

- L35 · `fs = fs.replace(/gl_FragColor = scene;/g, "gl_FragColor = vec4(scene.rgb, 0.0);");` — alpha is a mask: 0 where the pixel passes straight through, 1 where it was
  bent. postfx merges the (possibly half-resolution) lens over the full-res
  scene by it, so only the part of the frame that is actually lensed pays for
  the lower resolution.
- L36 · `rep("vec4 vp = uInvProj * vec4(vUv * 2.0 - 1.0, 1.0, 1.0);", "vec4 vp = uInvProj * vec4(vU` — the view ray from the NEAR plane: unprojecting the far plane of a 30,000 km
  frustum divides by a w that has underflowed, and every direction is NaN
- L37 · `fs = fs.replace(/1e6/g, "1e12").replace(/1e5/g, "1e11");` — "no surface" was anything past 100,000 units — most of this sky
<!-- /note -->

#### <a id="s-lensShader-rep"></a>`lensShader>rep(a, b)`

function · L22–25

- called by: [`lensShader`](#s-lensShader) ×8

<!-- note:lensShader>rep -->
<!-- /note -->

### <a id="s-makeHoleFx"></a>`makeHoleFx({…})`

function · **exported** · L42–428

- calls: [`makeRockGeometry`](../asteroidgen/debris.js.md#s-makeRockGeometry) _js/asteroidgen/debris.js_ · [`horizon`](../asteroidgen/kerr.js.md#s-horizon) _js/asteroidgen/kerr.js_ · [`isco`](../asteroidgen/kerr.js.md#s-isco) _js/asteroidgen/kerr.js_ · [`new RNG`](../asteroidgen/rng.js.md#s-RNG) _js/asteroidgen/rng.js_ · [`setTidalSpin`](../asteroidgen/tidal.js.md#s-setTidalSpin) _js/asteroidgen/tidal.js_ · [`logDepthFragment`](../bodygen/gl.js.md#s-logDepthFragment) _js/bodygen/gl.js_ ×2 · [`logDepthVertex`](../bodygen/gl.js.md#s-logDepthVertex) _js/bodygen/gl.js_ ×2 · [`lensShader`](#s-lensShader)
- called by: [`mountGame`](engine.js.md#s-mountGame) _js/render/engine.js_
- effects: storage.get `lgaa.lens`

<!-- note:makeHoleFx -->
- L44 · `const lensUniforms = {` — ---- lens material, rendered by postfx over its own quad ----
- L81 · `const standins = new Map();` — ---- per hole: the stand-in ----
- L133 · `const infallUniforms = {` — ---- infall ----
- L235 · `const tidal = [];` — ---- tides ----
- L275 · `let clock = 0;` — ---- per frame ----
- L392 · `scale: COARSE ? 0.5 : 1,` — a phone traces the lens at half resolution; the merge keeps the rest of the frame sharp
<!-- /note -->

#### <a id="s-makeHoleFx-standinFor"></a>`makeHoleFx>standinFor(h)`

function · L104–121

- calls: [`holeRadii`](../world/events/holes.js.md#s-holeRadii) _js/world/events/holes.js_
- called by: [`makeHoleFx>update`](#s-makeHoleFx-update)

<!-- note:makeHoleFx>standinFor -->
<!-- /note -->

#### <a id="s-makeHoleFx-dropStandin"></a>`makeHoleFx>dropStandin(id)`

function · L123–131

- called by: [`makeHoleFx>dispose`](#s-makeHoleFx-dispose) · [`makeHoleFx>drain`](#s-makeHoleFx-drain) · [`makeHoleFx>update`](#s-makeHoleFx-update)

<!-- note:makeHoleFx>dropStandin -->
<!-- /note -->

#### <a id="s-makeHoleFx-addInfall"></a>`makeHoleFx>addInfall(h, e)`

function · L216–233

- calls: [`oreLook`](../world/rockgen.js.md#s-oreLook) _js/world/rockgen.js_
- called by: [`makeHoleFx>drain`](#s-makeHoleFx-drain)

<!-- note:makeHoleFx>addInfall -->
<!-- /note -->

#### <a id="s-makeHoleFx-addTidal"></a>`makeHoleFx>addTidal(h, m)`

function · L236–264

- calls: [`new TidalBody`](../asteroidgen/tidal.js.md#s-TidalBody) _js/asteroidgen/tidal.js_ · [`new Trajectory`](../asteroidgen/tidal.js.md#s-Trajectory) _js/asteroidgen/tidal.js_ · [`bodyMaterial`](../bodygen/body.js.md#s-bodyMaterial) _js/bodygen/body.js_ · [`generateBody`](../bodygen/body.js.md#s-generateBody) _js/bodygen/body.js_ · [`rogueParams`](../bodygen/body.js.md#s-rogueParams) _js/bodygen/body.js_ · [`holeRadii`](../world/events/holes.js.md#s-holeRadii) _js/world/events/holes.js_ · [`rogueClassOf`](../world/events/impacts.js.md#s-rogueClassOf) _js/world/events/impacts.js_
- called by: [`makeHoleFx>drain`](#s-makeHoleFx-drain)

<!-- note:makeHoleFx>addTidal -->
- L243 · `const sq = Math.max(1, (R.burn / S) / (TIDAL.burnR * TIDAL.iscoScale));` — the Lab's tidal radii scale with √M and ∛M; pick the M and the Roche
  base that land them on this hole's burn and tidal radii in the body's frame
<!-- /note -->

#### <a id="s-makeHoleFx-dropTidal"></a>`makeHoleFx>dropTidal(i)`

function · L266–273

- called by: [`makeHoleFx>dispose`](#s-makeHoleFx-dispose) · [`makeHoleFx>update`](#s-makeHoleFx-update)

<!-- note:makeHoleFx>dropTidal -->
<!-- /note -->

#### <a id="s-makeHoleFx-drain"></a>`makeHoleFx>drain()`

function · L282–291

- calls: [`makeHoleFx>addInfall`](#s-makeHoleFx-addInfall) · [`makeHoleFx>addTidal`](#s-makeHoleFx-addTidal) · [`makeHoleFx>dropStandin`](#s-makeHoleFx-dropStandin)
- via [js/world/events/holes.js](../world/events/holes.js.md): `holeFx.shift`, `holes.find`
- called by: [`makeHoleFx>update`](#s-makeHoleFx-update)

<!-- note:makeHoleFx>drain -->
<!-- /note -->

#### <a id="s-makeHoleFx-lensWanted"></a>`makeHoleFx>lensWanted()`

function · L293–300

- called by: [`makeHoleFx>update`](#s-makeHoleFx-update)

<!-- note:makeHoleFx>lensWanted -->
<!-- /note -->

#### <a id="s-makeHoleFx-update"></a>`makeHoleFx>update(dt)`

function · L304–385

- calls: [`buildRings`](../asteroidgen/blackhole.js.md#s-buildRings) _js/asteroidgen/blackhole.js_ · [`horizon`](../asteroidgen/kerr.js.md#s-horizon) _js/asteroidgen/kerr.js_ · [`isco`](../asteroidgen/kerr.js.md#s-isco) _js/asteroidgen/kerr.js_ · [`makeHoleFx>drain`](#s-makeHoleFx-drain) · [`makeHoleFx>dropStandin`](#s-makeHoleFx-dropStandin) · [`makeHoleFx>dropTidal`](#s-makeHoleFx-dropTidal) · [`makeHoleFx>lensWanted`](#s-makeHoleFx-lensWanted) · [`makeHoleFx>standinFor`](#s-makeHoleFx-standinFor) · [`holeRadii`](../world/events/holes.js.md#s-holeRadii) _js/world/events/holes.js_ ×2
- via [js/world/events/holes.js](../world/events/holes.js.md): `holes.find`, `holes.some`

<!-- note:makeHoleFx>update -->
- L312 · `lensHole = null;` — the hole the lens is for: the one that bends the most of the screen
- L318 · `const ang = Math.atan2(KERR.march * h.rs * 0.5, d);` — angular size of the march sphere, and whether it could touch the view
- L348 · `u.uBCut.value = Math.max(KERR.march * 1.6, 4 / Math.max(pixelAngle * 0.7, 1e-6));` — a ray further out than a pixel's worth of bending (α = 4M/b) is left alone
- L361 · `if (infallHole) {` — infall
- L375 · `for (let i = tidal.length - 1; i >= 0; i--) {` — tides
<!-- /note -->

#### <a id="s-makeHoleFx-lens"></a>`makeHoleFx>lens()`

function · L387–389

<!-- note:makeHoleFx>lens -->
What postfx needs to run the lens this frame, or null.
<!-- /note -->

#### <a id="s-makeHoleFx-prepare"></a>`makeHoleFx.prepare(readTexture, depthTexture)`

prop · L393–406

<!-- note:makeHoleFx.prepare -->
<!-- /note -->

#### <a id="s-makeHoleFx-dispose"></a>`makeHoleFx>dispose()`

function · L409–417

- calls: [`makeHoleFx>dropStandin`](#s-makeHoleFx-dropStandin) · [`makeHoleFx>dropTidal`](#s-makeHoleFx-dropTidal)

<!-- note:makeHoleFx>dispose -->
<!-- /note -->

#### <a id="s-makeHoleFx-lensHole"></a>`makeHoleFx.lensHole()`

prop · L423–423

<!-- note:makeHoleFx.lensHole -->
<!-- /note -->

#### <a id="s-makeHoleFx-tidal"></a>`makeHoleFx.tidal()`

prop · L424–424

<!-- note:makeHoleFx.tidal -->
<!-- /note -->

#### <a id="s-makeHoleFx-standinsShown"></a>`makeHoleFx.standinsShown()`

prop · L425–425

<!-- note:makeHoleFx.standinsShown -->
<!-- /note -->

#### <a id="s-makeHoleFx-infallLive"></a>`makeHoleFx.infallLive()`

prop · L426–426

<!-- note:makeHoleFx.infallLive -->
<!-- /note -->
