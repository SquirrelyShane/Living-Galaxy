# js/asteroidgen/kerr.js

[index](../../../README.md) · 194 lines · 24 symbols · 0 imports · 5 importers

## About

<!-- note:@file -->
Kerr (spinning) black hole null geodesics — the DNGR prescription of
James, von Tunzelmann, Franklin & Thorne, "Gravitational lensing by spinning
black holes in astrophysics, and in the movie Interstellar",
Class. Quantum Grav. 32 (2015) 065001, appendix A.1. Units: G = c = M = 1.

  Boyer–Lindquist metric functions        (A.2)
  FIDO orthonormal frame                  (A.3)
  P, R, Θ                                 (A.4)
  trapped photon orbits b_o(r_o), q_o     (A.5, A.6)
  camera direction → canonical momenta    (A.9–A.12), camera at rest in the FIDO frame (β = 0)
  super-Hamiltonian ray equations         (A.15), integrated backward in ζ with RK2

Pure JS; blackhole.js carries a line-by-line GLSL copy (verified against this file).

Mapping to the scene: the hole's spin axis is world −Y, so the prograde disk turns
+X → +Z like every other orbit in the app. BL Cartesian (x, y, z) = world (X, Z, −Y),
with the oblate embedding x = √(r²+a²) sinθ cosφ, y = √(r²+a²) sinθ sinφ, z = r cosθ.
<!-- /note -->

## Imports

_none_

## Imported by

- [js/asteroidgen/blackhole.js](blackhole.js.md) — `KERR`, `isco`, `horizon`, `KERR_LOOKS`
- [js/asteroidgen/tidal.js](tidal.js.md) — `isco`, `horizon`
- [js/render/holefx.js](../render/holefx.js.md) — `KERR`, `isco`, `horizon`
- [js/world/events/holes.js](../world/events/holes.js.md) — `horizon`, `isco`
- test/asteroids.test.mjs _(outside js/)_ — `horizon`, `isco`

## Exports

- [`KERR_LOOKS`](#s-KERR_LOOKS) · const — used by [js/asteroidgen/blackhole.js](blackhole.js.md)
- [`KERR`](#s-KERR) · const — used by [js/asteroidgen/blackhole.js](blackhole.js.md), [js/render/holefx.js](../render/holefx.js.md)
- [`horizon`](#s-horizon) · function — used by [js/asteroidgen/blackhole.js](blackhole.js.md), [js/asteroidgen/tidal.js](tidal.js.md), [js/render/holefx.js](../render/holefx.js.md), [js/world/events/holes.js](../world/events/holes.js.md), test/asteroids.test.mjs
- [`isco`](#s-isco) · function — used by [js/asteroidgen/blackhole.js](blackhole.js.md), [js/asteroidgen/tidal.js](tidal.js.md), [js/render/holefx.js](../render/holefx.js.md), [js/world/events/holes.js](../world/events/holes.js.md), test/asteroids.test.mjs
- [`trappedOrbit`](#s-trappedOrbit) · function — **no importer in scanned roots**
- [`trappedRange`](#s-trappedRange) · function — **no importer in scanned roots**
- [`metric`](#s-metric) · function — **no importer in scanned roots**
- [`worldToBL`](#s-worldToBL) · function — **no importer in scanned roots**
- [`blToWorld`](#s-blToWorld) · function — **no importer in scanned roots**
- [`cartToBL`](#s-cartToBL) · function — **no importer in scanned roots**
- [`blToCart`](#s-blToCart) · function — **no importer in scanned roots**
- [`fidoBasis`](#s-fidoBasis) · function — **no importer in scanned roots**
- [`initRay`](#s-initRay) · function — **no importer in scanned roots**
- [`derivs`](#s-derivs) · function — **no importer in scanned roots**
- [`hamiltonian`](#s-hamiltonian) · function — **no importer in scanned roots**
- [`stepSize`](#s-stepSize) · function — **no importer in scanned roots**
- [`rk2`](#s-rk2) · function — **no importer in scanned roots**
- [`poleHop`](#s-poleHop) · function — **no importer in scanned roots**
- [`exitDirection`](#s-exitDirection) · function — **no importer in scanned roots**
- [`diskRedshift`](#s-diskRedshift) · function — **no importer in scanned roots**
- [`traceRay`](#s-traceRay) · function — **no importer in scanned roots**
- [`blackbodyRGB`](#s-blackbodyRGB) · function — **no importer in scanned roots**

## Effects

_none detected_

## Symbols

### <a id="s-KERR_LOOKS"></a>`KERR_LOOKS`

const · **exported** · L1–5

<!-- note:KERR_LOOKS -->
- L2 · `interstellar: { spin: 0.6, shifts: 0, label: 'Interstellar (a = 0.6, no shifts)' },` — what Nolan & Franklin chose for Interstellar: a/M = 0.6, no Doppler or gravitational colour / brightness shifts
- L3 · `kerr: { spin: 0.999, shifts: 1, label: 'Kerr a = 0.999 (physical)' },` — what the hole would really look like spinning fast: lopsided, flattened shadow edge, beamed disk
<!-- /note -->

### <a id="s-KERR"></a>`KERR`

const · **exported** · L7–7

<!-- note:KERR -->
<!-- /note -->

### <a id="s-horizon"></a>`horizon(a)`

function · **exported** · L9–11

- called by: [`BlackHolePass.constructor`](blackhole.js.md#s-BlackHolePass-constructor) _js/asteroidgen/blackhole.js_ · [`BlackHolePass.setState`](blackhole.js.md#s-BlackHolePass-setState) _js/asteroidgen/blackhole.js_ · [`stepSize`](#s-stepSize) · [`traceRay`](#s-traceRay) · [`setTidalSpin`](tidal.js.md#s-setTidalSpin) _js/asteroidgen/tidal.js_ · [`makeHoleFx`](../render/holefx.js.md#s-makeHoleFx) _js/render/holefx.js_ · [`makeHoleFx>update`](../render/holefx.js.md#s-makeHoleFx-update) _js/render/holefx.js_ · [`holeRadii`](../world/events/holes.js.md#s-holeRadii) _js/world/events/holes.js_

<!-- note:horizon -->
<!-- /note -->

### <a id="s-isco"></a>`isco(a)`

function · **exported** · L13–17

- called by: [`BlackHolePass.constructor`](blackhole.js.md#s-BlackHolePass-constructor) _js/asteroidgen/blackhole.js_ · [`BlackHolePass.setState`](blackhole.js.md#s-BlackHolePass-setState) _js/asteroidgen/blackhole.js_ · [`traceRay`](#s-traceRay) · [`setTidalSpin`](tidal.js.md#s-setTidalSpin) _js/asteroidgen/tidal.js_ · [`makeHoleFx`](../render/holefx.js.md#s-makeHoleFx) _js/render/holefx.js_ · [`makeHoleFx>update`](../render/holefx.js.md#s-makeHoleFx-update) _js/render/holefx.js_ · [`holeRadii`](../world/events/holes.js.md#s-holeRadii) _js/world/events/holes.js_

<!-- note:isco -->
Prograde innermost stable circular orbit (Bardeen, Press & Teukolsky 1972).
<!-- /note -->

### <a id="s-trappedOrbit"></a>`trappedOrbit(ro, a)`

function · **exported** · L19–23

<!-- note:trappedOrbit -->
(A.5, A.6): constants of unstably trapped photon orbits, r_o ∈ [r1, r2].
<!-- /note -->

### <a id="s-trappedRange"></a>`trappedRange(a)`

function · **exported** · L24–26

<!-- note:trappedRange -->
<!-- /note -->

### <a id="s-metric"></a>`metric(r, th, a)`

function · **exported** · L28–35

- called by: [`exitDirection`](#s-exitDirection) · [`initRay`](#s-initRay)

<!-- note:metric -->
<!-- /note -->

### <a id="s-worldToBL"></a>`worldToBL(v)`

function · **exported** · L37–37

<!-- note:worldToBL -->
<!-- /note -->

### <a id="s-blToWorld"></a>`blToWorld(v)`

function · **exported** · L38–38

<!-- note:blToWorld -->
<!-- /note -->

### <a id="s-cartToBL"></a>`cartToBL([…], a)`

function · **exported** · L40–45

- called by: [`initRay`](#s-initRay)

<!-- note:cartToBL -->
BL Cartesian point → { r, th, ph } (oblate embedding).
<!-- /note -->

### <a id="s-blToCart"></a>`blToCart(r, th, ph, a)`

function · **exported** · L46–49

- called by: [`poleHop`](#s-poleHop)

<!-- note:blToCart -->
<!-- /note -->

### <a id="s-fidoBasis"></a>`fidoBasis(r, th, ph, a)`

function · **exported** · L51–64

- calls: [`fidoBasis>norm`](#s-fidoBasis-norm) ×3
- called by: [`exitDirection`](#s-exitDirection) · [`initRay`](#s-initRay)

<!-- note:fidoBasis -->
Orthonormalised FIDO directions e_r̂, e_θ̂, e_φ̂ in BL Cartesian (exact in the far field).

- L61 · `const d = et[0] * er[0] + et[1] * er[1] + et[2] * er[2];` — Gram–Schmidt (the embedding is not exactly orthogonal near the hole)
<!-- /note -->

#### <a id="s-fidoBasis-norm"></a>`fidoBasis>norm(v)`

function · L54–57

- called by: [`fidoBasis`](#s-fidoBasis) ×3

<!-- note:fidoBasis>norm -->
<!-- /note -->

### <a id="s-initRay"></a>`initRay(posBL, dir, a)`

function · **exported** · L66–83

- calls: [`cartToBL`](#s-cartToBL) · [`fidoBasis`](#s-fidoBasis) · [`metric`](#s-metric)
- called by: [`poleHop`](#s-poleHop) · [`traceRay`](#s-traceRay)

<!-- note:initRay -->
(A.9–A.12) with β = 0: a ray leaving the camera along `dir` (BL Cartesian, outward) is the
time reverse of a photon arriving with propagation direction n = −dir.
Returns the state [r, θ, φ, p_r, p_θ] and constants { b, q }.
<!-- /note -->

### <a id="s-derivs"></a>`derivs(s, a, b, q)`

function · **exported** · L85–107

- called by: [`rk2`](#s-rk2) ×2

<!-- note:derivs -->
(A.15): d/dζ of [r, θ, φ, p_r, p_θ].
<!-- /note -->

### <a id="s-hamiltonian"></a>`hamiltonian(s, a, b, q)`

function · **exported** · L109–118

- called by: [`traceRay`](#s-traceRay)

<!-- note:hamiltonian -->
Super-Hamiltonian (zero on a null ray) — for accuracy checks.
<!-- /note -->

### <a id="s-stepSize"></a>`stepSize(r, a)`

function · **exported** · L120–122

- calls: [`horizon`](#s-horizon)
- called by: [`rk2`](#s-rk2)

<!-- note:stepSize -->
<!-- /note -->

### <a id="s-rk2"></a>`rk2(s, a, b, q)`

function · **exported** · L124–130

- calls: [`derivs`](#s-derivs) ×2 · [`stepSize`](#s-stepSize)
- called by: [`traceRay`](#s-traceRay)

<!-- note:rk2 -->
One backward RK2 (midpoint) step. The step also caps the change in θ and φ, so rays that skim a
pole (where b/sin²θ and Θ'∝1/sin³θ get large) are resolved instead of blowing up.

- L126 · `const h = -Math.min(stepSize(s[0], a), KERR.maxDTheta / (Math.abs(k1[1]) + 1e-9), KERR.max` — θ may not close more than axisK of its remaining gap to the axis in one step (resolves the approach to a pole hop)
<!-- /note -->

### <a id="s-poleHop"></a>`poleHop(s, a, b)`

function · **exported** · L132–142

- calls: [`blToCart`](#s-blToCart) · [`exitDirection`](#s-exitDirection) · [`initRay`](#s-initRay)
- called by: [`traceRay`](#s-traceRay)

<!-- note:poleHop -->
Boyer–Lindquist coordinates are singular on the spin axis (b/sin²θ, Θ' ∝ 1/sin³θ). A ray that comes within
sinθ < poleSin of the axis hops straight across it in Cartesian space (a few percent of r, where the path is
locally straight) and is re-initialised from its position and direction on the far side.
Returns null when no hop is needed.

- L135 · `const d = exitDirection(s, a, b);` — direction the traced ray is travelling
- L138 · `if (tStar <= 0) return null;` — already moving away from the axis
<!-- /note -->

### <a id="s-exitDirection"></a>`exitDirection(s, a, b)`

function · **exported** · L144–152

- calls: [`fidoBasis`](#s-fidoBasis) · [`metric`](#s-metric)
- called by: [`poleHop`](#s-poleHop) · [`traceRay`](#s-traceRay)

<!-- note:exitDirection -->
Outgoing sky direction (BL Cartesian) of a ray that has left the march sphere.
<!-- /note -->

### <a id="s-diskRedshift"></a>`diskRedshift(r, b, a)`

function · **exported** · L154–159

- called by: [`traceRay`](#s-traceRay)

<!-- note:diskRedshift -->
Redshift g = ν_camera / ν_emitted for a prograde circular equatorial emitter at r (camera far away).
<!-- /note -->

### <a id="s-traceRay"></a>`traceRay(posBL, dir, a, {…}=)`

function · **exported** · L161–188

- calls: [`diskRedshift`](#s-diskRedshift) · [`exitDirection`](#s-exitDirection) · [`hamiltonian`](#s-hamiltonian) · [`horizon`](#s-horizon) · [`initRay`](#s-initRay) · [`isco`](#s-isco) · [`poleHop`](#s-poleHop) · [`rk2`](#s-rk2)

<!-- note:traceRay -->
Trace one camera ray (BL Cartesian position / direction, M units) to capture, escape or step limit.
Returns { fate: 'captured' | 'escaped' | 'steps', steps, exitDir, disk: [{ r, ph, g }], hmax, state }.
<!-- /note -->

### <a id="s-blackbodyRGB"></a>`blackbodyRGB(T, T0=)`

function · **exported** · L190–194

- calls: [`blackbodyRGB>B`](#s-blackbodyRGB-B) ×2

<!-- note:blackbodyRGB -->
Planck radiance ratios at the film's R, G, B wavelengths for temperature T relative to T0.
<!-- /note -->

#### <a id="s-blackbodyRGB-B"></a>`blackbodyRGB>B(l, t)`

function · L192–192

- called by: [`blackbodyRGB`](#s-blackbodyRGB) ×2

<!-- note:blackbodyRGB>B -->
<!-- /note -->
