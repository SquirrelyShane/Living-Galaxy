# js/asteroidgen/blackhole.js

[index](../../../README.md) · 498 lines · 10 symbols · 4 imports · 1 importers

## About

<!-- note:@file -->
Kerr (spinning) black hole as a post-process lens.

v1.9: rays follow the super-Hamiltonian Kerr null-geodesic equations of the DNGR
code used for Interstellar (James, von Tunzelmann, Franklin & Thorne 2015,
appendix A.1): camera direction → FIDO-frame canonical momenta (p_r, p_θ, b, q),
integrated backward in ζ with RK2, thin disk in the equatorial plane at the
spin-dependent ISCO, optional Doppler + gravitational colour/brightness shift
(blackbody at T0 shifted to g·T0, Planck radiance sampled at film R/G/B).
kerr.js holds the JS reference this GLSL is checked against. Units inside the
march sphere are M (= world Rs / 2). The v1.3 Schwarzschild description follows.

Per pixel, a camera ray is traced in units of the Schwarzschild radius (Rs = 1)
with the photon-orbit equation used by Marinozzi's raytracer:

    v += -1.5 · h² · p / r⁵ · dt ,   p += v · dt ,   h = |p × v|

inside a march sphere (MARCH_R). Outside it, the weak-field deflection
α = 2 / b is applied analytically, and the residual bend for the part of the
path outside the sphere is added on exit, so the lens is continuous across
the boundary. Escaped rays re-project onto the frame rendered so far (stars,
debris, fragments); captured rays are black.

v1.8 finite-distance lensing: a lensed ray is marched from its bend point
through the depth buffer and takes the first surface it passes behind, so
bodies just behind the hole shift and wrap a little instead of being
magnified into a screen-filling Einstein ring as if they sat at infinity.
Rays whose source is hidden behind a foreground body fall back to the
pixel's own unlensed background — never a mirrored copy of the body.
Crossings of the disk plane (world XZ) add emission from the accretion disk,
so the lensed far side of the disk arcs over and under the shadow.

The disk has no emission of its own until matter arrives: ring radii and
brightness come from the debris that has actually dissolved into it
(debris.accretion()) plus what the fx particles delivered.
<!-- /note -->

## Imports

| line | from | names | target |
|---|---|---|---|
| 1 | `three` | `*` as `THREE` | external |
| 2 | `three/addons/postprocessing/Pass.js` | `Pass`, `FullScreenQuad` | external |
| 3 | `./debris.js` | `BH_RS` | [js/asteroidgen/debris.js](debris.js.md) |
| 4 | `./kerr.js` | `KERR`, `isco`, `horizon`, `KERR_LOOKS` | [js/asteroidgen/kerr.js](kerr.js.md) |

## Imported by

- [js/render/holefx.js](../render/holefx.js.md) — `BLACKHOLE_SHADER`, `RING_MAX`, `buildRings`

## Exports

- [`RING_MAX`](#s-RING_MAX) · const — used by [js/render/holefx.js](../render/holefx.js.md)
- [`BH_DISK`](#s-BH_DISK) · const — **no importer in scanned roots**
- [`BLACKHOLE_SHADER`](#s-BLACKHOLE_SHADER) · const — used by [js/render/holefx.js](../render/holefx.js.md)
- [`buildRings`](#s-buildRings) · function — used by [js/render/holefx.js](../render/holefx.js.md)
- [`BlackHolePass`](#s-BlackHolePass) · class — **no importer in scanned roots**
- [`attachComposerDepth`](#s-attachComposerDepth) · function — **no importer in scanned roots**

## Effects

_none detected_

## Symbols

### <a id="s-RING_MAX"></a>`RING_MAX`

const · **exported** · L6–6

<!-- note:RING_MAX -->
<!-- /note -->

### <a id="s-BH_DISK"></a>`BH_DISK`

const · **exported** · L7–7

<!-- note:BH_DISK -->
<!-- /note -->

### <a id="s-BLACKHOLE_SHADER"></a>`BLACKHOLE_SHADER`

const · **exported** · L9–367

- via [js/asteroidgen/kerr.js](kerr.js.md): `KERR.T0.toFixed`, `KERR.axisK.toFixed`, `KERR.diskOut.toFixed`, `KERR.march.toFixed`, `KERR.maxDPhi.toFixed`, `KERR.maxDTheta.toFixed`, `KERR.poleSin.toFixed`, `KERR.stepK.toFixed`, `KERR.stepMax.toFixed`, `KERR.stepMin.toFixed`

<!-- note:BLACKHOLE_SHADER -->
- L10 · `vertexShader:` — glsl
- L17 · `fragmentShader:` — glsl
<!-- /note -->

### <a id="s-buildRings"></a>`buildRings(entries, extraMass=)`

function · **exported** · L369–400

- called by: [`makeHoleFx>update`](../render/holefx.js.md#s-makeHoleFx-update) _js/render/holefx.js_

<!-- note:buildRings -->
Turn per-clump accretion into lens ring uniforms.
@param {Array<{r:number, mass:number}>} entries  r in world units
@param {number} extraMass  mass delivered by fx particles / chunks (feeds the inner disk)
@returns {{ r: Float32Array, w: Float32Array, i: Float32Array, count: number, base: number, total: number }}
<!-- /note -->

### <a id="s-BlackHolePass"></a>`BlackHolePass`

class · **exported** · L402–491

<!-- note:BlackHolePass -->
<!-- /note -->

#### <a id="s-BlackHolePass-constructor"></a>`BlackHolePass.constructor(camera, opts=)`

method · L403–443

- calls: [`horizon`](kerr.js.md#s-horizon) _js/asteroidgen/kerr.js_ · [`isco`](kerr.js.md#s-isco) _js/asteroidgen/kerr.js_

<!-- note:BlackHolePass.constructor -->
<!-- /note -->

#### <a id="s-BlackHolePass-setState"></a>`BlackHolePass.setState({…}=)`

method · L445–467

- calls: [`horizon`](kerr.js.md#s-horizon) _js/asteroidgen/kerr.js_ · [`isco`](kerr.js.md#s-isco) _js/asteroidgen/kerr.js_

<!-- note:BlackHolePass.setState -->
rs: world Schwarzschild radius (0 disables), rings: buildRings() output, spin a/M, shifts 0|1.
<!-- /note -->

#### <a id="s-BlackHolePass-render"></a>`BlackHolePass.render(renderer, writeBuffer, readBuffer)`

method · L469–485

<!-- note:BlackHolePass.render -->
<!-- /note -->

#### <a id="s-BlackHolePass-dispose"></a>`BlackHolePass.dispose()`

method · L487–490

<!-- note:BlackHolePass.dispose -->
<!-- /note -->

### <a id="s-attachComposerDepth"></a>`attachComposerDepth(composer)`

function · **exported** · L493–498

<!-- note:attachComposerDepth -->
Give both composer targets depth textures so the lens can keep foreground objects unwarped.
<!-- /note -->
