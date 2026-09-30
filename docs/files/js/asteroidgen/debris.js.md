# js/asteroidgen/debris.js

[index](../../../README.md) · 1106 lines · 47 symbols · 3 imports · 8 importers

## About

<!-- note:@file -->
Icy crystalline debris clouds + small meshed rocks.

Everything is instanced and animated on the GPU (tumble, Keplerian orbit,
drift, glints, gravity-well inspiral, shatter burst), so the CPU cost per
frame is one uniform write.
Draw calls: ≤10 crystal meshes + ≤6 rock meshes + 2 point sprites.
<!-- /note -->

## Imports

| line | from | names | target |
|---|---|---|---|
| 1 | `three` | `*` as `THREE` | external |
| 2 | `./rng.js` | `RNG`, `hashString`, `fbm`, `powerLaw`, `gauss`, `unitVec` | [js/asteroidgen/rng.js](rng.js.md) |
| 3 | `./ores.js` | `ORES` | [js/asteroidgen/ores.js](ores.js.md) |

## Imported by

- [js/asteroidgen/blackhole.js](blackhole.js.md) — `BH_RS`
- [js/asteroidgen/generator.js](generator.js.md) — `makeRockGeometry`, `computeNormals`
- [js/asteroidgen/tidal.js](tidal.js.md) — `WELL_PRESETS`
- [js/bodygen/gl.js](../bodygen/gl.js.md) — `SHADERS`
- [js/render/holefx.js](../render/holefx.js.md) — `BH_RS`, `makeRockGeometry`
- [js/render/impactfx.js](../render/impactfx.js.md) — `makeRockGeometry`
- [js/render/rockfx.js](../render/rockfx.js.md) — `buildDebrisField`
- test/asteroids.test.mjs _(outside js/)_ — `SHADERS`

## Exports

- [`computeNormals`](#s-computeNormals) · function — used by [js/asteroidgen/generator.js](generator.js.md)
- [`makeRockGeometry`](#s-makeRockGeometry) · function — used by [js/asteroidgen/generator.js](generator.js.md), [js/render/holefx.js](../render/holefx.js.md), [js/render/impactfx.js](../render/impactfx.js.md)
- [`makeCrystalGeometry`](#s-makeCrystalGeometry) · function — **no importer in scanned roots**
- [`SHADERS`](#s-SHADERS) · const — used by [js/bodygen/gl.js](../bodygen/gl.js.md), test/asteroids.test.mjs
- [`makeDebrisDepthMaterial`](#s-makeDebrisDepthMaterial) · function — **no importer in scanned roots**
- [`BH_RS`](#s-BH_RS) · const — used by [js/asteroidgen/blackhole.js](blackhole.js.md), [js/render/holefx.js](../render/holefx.js.md)
- [`WELL_PRESETS`](#s-WELL_PRESETS) · const — used by [js/asteroidgen/tidal.js](tidal.js.md)
- [`wellTau`](#s-wellTau) · function — **no importer in scanned roots**
- [`bhDissolve`](#s-bhDissolve) · function — **no importer in scanned roots**
- [`captureWeight`](#s-captureWeight) · function — **no importer in scanned roots**
- [`worldToFieldLocal`](#s-worldToFieldLocal) · function — **no importer in scanned roots**
- [`bhDiskRadius`](#s-bhDiskRadius) · function — **no importer in scanned roots**
- [`buildDebrisField`](#s-buildDebrisField) · function — used by [js/render/rockfx.js](../render/rockfx.js.md)
- [`bakeForExport`](#s-bakeForExport) · function — **no importer in scanned roots**

## Effects

_none detected_

## Symbols

### <a id="s-TAU"></a>`TAU`

const · L5–5

<!-- note:TAU -->
<!-- /note -->

### <a id="s-smoothstep"></a>`smoothstep(e0, e1, x)`

function · L7–10

- called by: [`makeRockGeometry`](#s-makeRockGeometry)

<!-- note:smoothstep -->
------------------------------------------------------------------ math
<!-- /note -->

### <a id="s-smin"></a>`smin(a, b, k)`

function · L12–15

- called by: [`makeRockGeometry`](#s-makeRockGeometry)

<!-- note:smin -->
<!-- /note -->

### <a id="s-randQuat"></a>`randQuat(rng)`

function · L17–24

- called by: [`buildDebrisField`](#s-buildDebrisField) ×2 · [`makeRockGeometry`](#s-makeRockGeometry)

<!-- note:randQuat -->
Random unit quaternion [x, y, z, w] (Shoemake).
<!-- /note -->

### <a id="s-composeInto"></a>`composeInto(te, o, px, py, pz, q, s)`

function · L26–36

- called by: [`buildDebrisField>buildInstanced`](#s-buildDebrisField-buildInstanced)

<!-- note:composeInto -->
Column-major TRS compose (uniform scale) into a Float32Array.
<!-- /note -->

### <a id="s-fixWinding"></a>`fixWinding(pos, idx, start, end, cx, cy, cz)`

function · L38–53

- called by: [`makeCrystalGeometry`](#s-makeCrystalGeometry) · [`makeRockGeometry`](#s-makeRockGeometry)

<!-- note:fixWinding -->
Flip triangles whose normal faces the reference centre (convex-ish parts).
<!-- /note -->

### <a id="s-computeNormals"></a>`computeNormals(pos, idx)`

function · **exported** · L55–71

- called by: [`bakeForExport`](#s-bakeForExport) · [`makeCrystalGeometry`](#s-makeCrystalGeometry) · [`makeRockGeometry`](#s-makeRockGeometry) · [`generateAsteroid`](generator.js.md#s-generateAsteroid) _js/asteroidgen/generator.js_

<!-- note:computeNormals -->
Area-weighted vertex normals for an indexed triangle list.
<!-- /note -->

### <a id="s-icosphere"></a>`icosphere(detail)`

function · L73–110

- calls: [`icosphere>mid`](#s-icosphere-mid) ×3
- called by: [`makeRockGeometry`](#s-makeRockGeometry)

<!-- note:icosphere -->
------------------------------------------------------------- geometry

Indexed icosphere on the unit sphere.
<!-- /note -->

#### <a id="s-icosphere-mid"></a>`icosphere>mid(a, b)`

function · L89–101

- called by: [`icosphere`](#s-icosphere) ×3

<!-- note:icosphere>mid -->
<!-- /note -->

### <a id="s-makeRockGeometry"></a>`makeRockGeometry(rng, opts=)`

function · **exported** · L112–178

- calls: [`computeNormals`](#s-computeNormals) · [`fixWinding`](#s-fixWinding) · [`icosphere`](#s-icosphere) · [`randQuat`](#s-randQuat) · [`smin`](#s-smin) · [`smoothstep`](#s-smoothstep) · [`fbm`](rng.js.md#s-fbm) _js/asteroidgen/rng.js_ ×5 · [`unitVec`](rng.js.md#s-unitVec) _js/asteroidgen/rng.js_
- called by: [`buildDebrisField`](#s-buildDebrisField) · [`buildRubbleField`](generator.js.md#s-buildRubbleField) _js/asteroidgen/generator.js_ · [`makeHoleFx`](../render/holefx.js.md#s-makeHoleFx) _js/render/holefx.js_ · [`makeImpactFx`](../render/impactfx.js.md#s-makeImpactFx) _js/render/impactfx.js_

<!-- note:makeRockGeometry -->
Small meshed asteroid rock: triaxial body, fbm relief, 1–4 fracture planes.
Unit max extent. Attributes: position, normal, aColor (grey shade), aFrost.
<!-- /note -->

### <a id="s-pushBipyramid"></a>`pushBipyramid(rng, out, p)`

function · L180–220

- calls: [`pushBipyramid>tipOff`](#s-pushBipyramid-tipOff) ×2
- called by: [`makeCrystalGeometry`](#s-makeCrystalGeometry) ×5

<!-- note:pushBipyramid -->
Irregular bipyramidal column, axis +Y, centred. Pushes into shared arrays.
<!-- /note -->

#### <a id="s-pushBipyramid-tipOff"></a>`pushBipyramid>tipOff()`

function · L184–184

- called by: [`pushBipyramid`](#s-pushBipyramid) ×2

<!-- note:pushBipyramid>tipOff -->
<!-- /note -->

### <a id="s-CRYSTAL_KINDS"></a>`CRYSTAL_KINDS`

const · L222–222

<!-- note:CRYSTAL_KINDS -->
<!-- /note -->

### <a id="s-makeCrystalGeometry"></a>`makeCrystalGeometry(kind, rng)`

function · **exported** · L224–268

- calls: [`computeNormals`](#s-computeNormals) · [`fixWinding`](#s-fixWinding) · [`pushBipyramid`](#s-pushBipyramid) ×5
- called by: [`buildDebrisField`](#s-buildDebrisField)

<!-- note:makeCrystalGeometry -->
Ice crystal geometry of a given habit. Unit max extent. Attributes: position, aTip.

- L238 · `const n = rng.int(4, 7);` — druse: a fan of columns rooted near the origin
<!-- /note -->

#### <a id="s-makeCrystalGeometry-ident"></a>`makeCrystalGeometry>ident(v)`

function · L227–227

<!-- note:makeCrystalGeometry>ident -->
<!-- /note -->

#### <a id="s-makeCrystalGeometry-xf"></a>`makeCrystalGeometry>xf(v)`

function · L245–250

<!-- note:makeCrystalGeometry>xf -->
- L247 · `const x1 = v[0] * cl - y * sl;` — tilt about Z by lean, then yaw about Y
<!-- /note -->

### <a id="s-GLSL_ANIM"></a>`GLSL_ANIM`

const · L270–385

<!-- note:GLSL_ANIM -->
-------------------------------------------------------------- shaders

Shared animation GLSL. Every pass (colour, shadow depth, sprites) calls the
same functions so shadows and sprites stay locked to the visible geometry.

Orbit:  near-Keplerian angle ω = K / r^1.5 about the field's local Y.
Star:   gravitational inspiral r(τ) = sqrt(R² − 2·rate·τ) with a soft ramp
        τ = t − 2(1 − e^(−t/2)). Orbit phase uses the closed-form integral
        of K / r^1.5 over that path, so there is no phase jump or spin-up glitch.
Black hole (v1.8): loose debris is the first thing the hole eats. The hole may
        sit away from (and move relative to) the field (uWellCenter, field-local).
        Instances are captured as uCapture rises (fast: seconds), then spiral in
        r(τ) = √(r0² − 2·a·τ) (a varies per instance) with the closed-form phase of
        K / r^1.5, flattening toward the disk plane. On the way in rocks heat up
        (∝ how far they have fallen), spaghettify along the line to the hole and
        burn away across the burn band just outside the core. accretion() mirrors
        the burn per clump so ring brightness tracks what has fallen in.
Burst:  shatter fields expand from 20 % radius with an exponential ease.

- L270 · `const GLSL_ANIM =` — glsl
<!-- /note -->

### <a id="s-GLSL_LIGHT_UNIFORMS"></a>`GLSL_LIGHT_UNIFORMS`

const · L387–394

<!-- note:GLSL_LIGHT_UNIFORMS -->
- L387 · `const GLSL_LIGHT_UNIFORMS =` — glsl
<!-- /note -->

### <a id="s-SHADERS"></a>`SHADERS`

const · **exported** · L396–561

<!-- note:SHADERS -->
- L398 · `solidVertex:` — glsl
- L443 · `iceFragment:` — glsl
- L477 · `rockFragment:` — glsl
- L509 · `pointsVertex:` — glsl
- L536 · `pointsFragment:` — glsl
<!-- /note -->

### <a id="s-makeDebrisDepthMaterial"></a>`makeDebrisDepthMaterial(uniforms)`

function · **exported** · L563–579

- called by: [`buildDebrisField`](#s-buildDebrisField)

<!-- note:makeDebrisDepthMaterial -->
MeshDepthMaterial that runs the same instance animation, so debris rocks cast
correct shadows. Uses three's own depth packing (onBeforeCompile) to stay
compatible with whatever shadow-map format the renderer uses.
<!-- /note -->

### <a id="s-ICE_TINTS"></a>`ICE_TINTS`

const · L581–585

<!-- note:ICE_TINTS -->
--------------------------------------------------------------- field
<!-- /note -->

### <a id="s-classIceProfile"></a>`classIceProfile(klass)`

function · L587–601

- called by: [`buildDebrisField`](#s-buildDebrisField)

<!-- note:classIceProfile -->
<!-- /note -->

### <a id="s-pickTint"></a>`pickTint(rng, profile)`

function · L603–608

- called by: [`buildDebrisField`](#s-buildDebrisField)

<!-- note:pickTint -->
<!-- /note -->

### <a id="s-BH_RS"></a>`BH_RS`

const · **exported** · L610–610

<!-- note:BH_RS -->
Build an orbiting debris field around a generated asteroid.
@param {object} asteroid  result of generateAsteroid
@param {object} opts
  density 0..1.6, ice 0..1
  kind    'clouds' (default) | 'shatter' (dense rocky burst from the body's own colours)
  shadows true → debris rocks cast shadows via an animated depth material
  burstStart  shader time the shatter expansion starts at

Schwarzschild radius of the fx black hole in world units (shared with blackhole.js).
<!-- /note -->

### <a id="s-WELL_PRESETS"></a>`WELL_PRESETS`

const · **exported** · L612–615

<!-- note:WELL_PRESETS -->
- L613 · `bh: { mode: 1, rate: 2.2, core: 0.45, fade: 0.9, diskScale: 0.42, diskMin: 0.85, diskMax:` — v1.8 debris goes first: captured within seconds, spirals in r² = r0² − 2aτ (a = rate·(0.7–1.3)),
  heats, stretches and burns away across [core, core + fade] — a cloud ~8 u out is mostly eaten within ~25 s
<!-- /note -->

### <a id="s-wellTau"></a>`wellTau(age)`

function · **exported** · L617–620

- called by: [`buildDebrisField.accretion`](#s-buildDebrisField-accretion)

<!-- note:wellTau -->
JS mirror of the shader's soft ramp and black-hole dissolve (keep in sync with GLSL_ANIM).
<!-- /note -->

### <a id="s-bhDissolve"></a>`bhDissolve(seed, tauEff, r0, p=)`

function · **exported** · L621–631

- calls: [`bhDissolve>sm`](#s-bhDissolve-sm) ×2
- called by: [`buildDebrisField.accretion`](#s-buildDebrisField-accretion)

<!-- note:bhDissolve -->
Burned-away share of an instance that started r0 from the hole, after effective infall time tauEff.
<!-- /note -->

#### <a id="s-bhDissolve-sm"></a>`bhDissolve>sm(a0, b0, v)`

function · L625–628

- called by: [`bhDissolve`](#s-bhDissolve) ×2

<!-- note:bhDissolve>sm -->
<!-- /note -->

### <a id="s-captureWeight"></a>`captureWeight(seed, capture)`

function · **exported** · L632–635

- called by: [`buildDebrisField.accretion`](#s-buildDebrisField-accretion)

<!-- note:captureWeight -->
Per-instance capture weight (mirror of the shader smoothstep).
<!-- /note -->

### <a id="s-worldToFieldLocal"></a>`worldToFieldLocal(v, rot)`

function · **exported** · L637–646

- called by: [`buildDebrisField.update`](#s-buildDebrisField-update)

<!-- note:worldToFieldLocal -->
World-direction vector → field-local, for a group with Euler XYZ rotation and no scale.

- L638 · `let [x, y, z] = v;` — three Euler 'XYZ': world = Rx·Ry·Rz·local  →  local = Rzᵀ·Ryᵀ·Rxᵀ·world
<!-- /note -->

### <a id="s-bhDiskRadius"></a>`bhDiskRadius(R, p=)`

function · **exported** · L648–650

- called by: [`buildDebrisField.accretion`](#s-buildDebrisField-accretion)

<!-- note:bhDiskRadius -->
<!-- /note -->

### <a id="s-buildDebrisField"></a>`buildDebrisField(asteroid, opts=)`

function · **exported** · L652–1003

- calls: [`buildDebrisField>buildInstanced`](#s-buildDebrisField-buildInstanced) ×2 · [`buildDebrisField>buildPoints`](#s-buildDebrisField-buildPoints) ×2 · [`buildDebrisField>orbit`](#s-buildDebrisField-orbit) ×2 · [`buildDebrisField>place`](#s-buildDebrisField-place) ×4 · [`buildDebrisField>sampleRock`](#s-buildDebrisField-sampleRock) ×3 · [`buildDebrisField>spin`](#s-buildDebrisField-spin) ×2 · [`buildDebrisField>track`](#s-buildDebrisField-track) ×2 · [`classIceProfile`](#s-classIceProfile) · [`makeCrystalGeometry`](#s-makeCrystalGeometry) · [`makeDebrisDepthMaterial`](#s-makeDebrisDepthMaterial) · [`makeRockGeometry`](#s-makeRockGeometry) · [`pickTint`](#s-pickTint) · [`randQuat`](#s-randQuat) ×2 · [`gauss`](rng.js.md#s-gauss) _js/asteroidgen/rng.js_ ×2 · [`hashString`](rng.js.md#s-hashString) _js/asteroidgen/rng.js_ · [`powerLaw`](rng.js.md#s-powerLaw) _js/asteroidgen/rng.js_ ×3 · [`new RNG`](rng.js.md#s-RNG) _js/asteroidgen/rng.js_
- called by: [`makeRockFx>attachCloud`](../render/rockfx.js.md#s-makeRockFx-attachCloud) _js/render/rockfx.js_ · [`makeRockFx>shatter`](../render/rockfx.js.md#s-makeRockFx-shatter) _js/render/rockfx.js_

<!-- note:buildDebrisField -->
- L683 · `const clouds = [];` — accretion bookkeeping: { R, m: [], seed: [] }
- L769 · `group.rotation.set(rng.range(-0.42, 0.42), rng.range(0, TAU), rng.range(-0.25, 0.25));` — tilted orbital plane
- L799 · `const R = bodyR * (shatter ? rng.range(0.45, 1.6) : rng.range(1.35, 2.3));` — shatter: puffy clumps packed around the old body; clouds: thin arcs further out
- L808 · `rng.next();` — keeps the v1.1.0 cloud layout stream stable
- L874 · `const nMote = Math.round((70 + 110 * density) * rng.range(0.8, 1.2));` — icy haze + dust
- L884 · `const nStream = Math.round((30 + 60 * density) * rng.range(0.7, 1.2));` — trailing stream behind the clump
<!-- /note -->

#### <a id="s-buildDebrisField-update"></a>`buildDebrisField.update(t, env)`

prop · L690–707

- calls: [`worldToFieldLocal`](#s-worldToFieldLocal)

<!-- note:buildDebrisField.update -->
@param {number} t shader time
@param {object} [env] black hole only: { bh: [x,y,z] world, origin: [x,y,z] field parent position,
  capture: 0..1 } — capture only ever rises

- L692 · `if (api.well === 'bh' && levelFrom) {` — black hole: level the orbital plane into the disk plane (world XZ)
<!-- /note -->

#### <a id="s-buildDebrisField-accretion"></a>`buildDebrisField.accretion(t=)`

prop · L708–724

- calls: [`bhDiskRadius`](#s-bhDiskRadius) · [`bhDissolve`](#s-bhDissolve) · [`captureWeight`](#s-captureWeight) · [`wellTau`](#s-wellTau)

<!-- note:buildDebrisField.accretion -->
Mass that has dissolved into the black-hole disk, per clump.
@returns {Array<{ r: number, mass: number, total: number }>} r = world disk radius

- L715 · `const ang = (t0 * K) / Math.pow(Math.max(c.R, 0.6), 1.5);` — clump-level start distance (instances in a clump sit within a few tenths of it)
<!-- /note -->

#### <a id="s-buildDebrisField-setLighting"></a>`buildDebrisField.setLighting({…}=)`

prop · L725–729

<!-- note:buildDebrisField.setLighting -->
<!-- /note -->

#### <a id="s-buildDebrisField-setFog"></a>`buildDebrisField.setFog(color, densityFog)`

prop · L730–733

<!-- note:buildDebrisField.setFog -->
<!-- /note -->

#### <a id="s-buildDebrisField-setPixelScale"></a>`buildDebrisField.setPixelScale(px)`

prop · L734–736

<!-- note:buildDebrisField.setPixelScale -->
<!-- /note -->

#### <a id="s-buildDebrisField-setWell"></a>`buildDebrisField.setWell(kind, t=, opts=)`

prop · L737–755

<!-- note:buildDebrisField.setWell -->
Start (or clear) a gravity well: 'bh' | 'star' | null, at shader time t.

- L750 · `shared.uCapture.value = opts.capture ?? 1;` — a hole at the field origin captures immediately (v1.3 behaviour); offset holes pass env.capture
<!-- /note -->

#### <a id="s-buildDebrisField-setBurst"></a>`buildDebrisField.setBurst(t)`

prop · L756–759

<!-- note:buildDebrisField.setBurst -->
<!-- /note -->

#### <a id="s-buildDebrisField-sampleRock"></a>`buildDebrisField>sampleRock()`

function · L780–788

- called by: [`buildDebrisField`](#s-buildDebrisField) ×3

<!-- note:buildDebrisField>sampleRock -->
<!-- /note -->

#### <a id="s-buildDebrisField-track"></a>`buildDebrisField>track(bucket, mass)`

function · L811–815

- called by: [`buildDebrisField`](#s-buildDebrisField) ×2

<!-- note:buildDebrisField>track -->
<!-- /note -->

#### <a id="s-buildDebrisField-place"></a>`buildDebrisField>place(spread)`

function · L817–825

- calls: [`gauss`](rng.js.md#s-gauss) _js/asteroidgen/rng.js_ ×3
- called by: [`buildDebrisField`](#s-buildDebrisField) ×4

<!-- note:buildDebrisField>place -->
<!-- /note -->

#### <a id="s-buildDebrisField-orbit"></a>`buildDebrisField>orbit(frost)`

function · L826–826

- called by: [`buildDebrisField`](#s-buildDebrisField) ×2

<!-- note:buildDebrisField>orbit -->
<!-- /note -->

#### <a id="s-buildDebrisField-spin"></a>`buildDebrisField>spin()`

function · L827–830

- calls: [`unitVec`](rng.js.md#s-unitVec) _js/asteroidgen/rng.js_
- called by: [`buildDebrisField`](#s-buildDebrisField) ×2

<!-- note:buildDebrisField>spin -->
<!-- /note -->

#### <a id="s-buildDebrisField-buildInstanced"></a>`buildDebrisField>buildInstanced(bucket, mat)`

function · L927–953

- calls: [`composeInto`](#s-composeInto)
- called by: [`buildDebrisField`](#s-buildDebrisField) ×2

<!-- note:buildDebrisField>buildInstanced -->
<!-- /note -->

#### <a id="s-buildDebrisField-buildPoints"></a>`buildDebrisField>buildPoints(list, glint)`

function · L957–998

- called by: [`buildDebrisField`](#s-buildDebrisField) ×2

<!-- note:buildDebrisField>buildPoints -->
<!-- /note -->

### <a id="s-bakeForExport"></a>`bakeForExport(source, name=)`

function · **exported** · L1005–1106

- calls: [`computeNormals`](#s-computeNormals)

<!-- note:bakeForExport -->
Bake instanced debris / rubble into static meshes for glTF export.
Snapshot at t = 0 (no orbit, no tumble), vertex colours carry instance
tint and frost. Crystals are split per face for crisp facets; rocks stay
indexed with smooth normals to keep GLBs small. Sprites are skipped.
@returns {THREE.Group}  { 'debris-rocks', 'debris-ice' } meshes, same rotation as the source
<!-- /note -->
