# js/asteroidgen/rng.js

[index](../../../README.md) · 147 lines · 18 symbols · 0 imports · 9 importers

## About

<!-- note:@file -->
Seeded PRNG, hashing, and 3D gradient / fractal noise.
<!-- /note -->

## Imports

_none_

## Imported by

- [js/asteroidgen/debris.js](debris.js.md) — `RNG`, `hashString`, `fbm`, `powerLaw`, `gauss`, `unitVec`
- [js/asteroidgen/fracture.js](fracture.js.md) — `RNG`, `hashString`, `unitVec`, `valueNoise3`
- [js/asteroidgen/generator.js](generator.js.md) — `RNG`, `hashString`, `fbm`, `ridged`, `valueNoise3`, `powerLaw`, `unitVec`
- [js/asteroidgen/impact-sim.js](impact-sim.js.md) — `RNG`, `hashString`, `unitVec`
- [js/asteroidgen/impact.js](impact.js.md) — `RNG`, `hashString`, `powerLaw`, `gauss`, `unitVec`
- [js/asteroidgen/tidal.js](tidal.js.md) — `RNG`, `hashString`, `unitVec`
- [js/render/holefx.js](../render/holefx.js.md) — `RNG`
- [js/render/impactfx.js](../render/impactfx.js.md) — `RNG`
- [js/world/events/impacts.js](../world/events/impacts.js.md) — `RNG`, `hashString`, `unitVec`

## Exports

- [`hashString`](#s-hashString) · function — used by [js/asteroidgen/debris.js](debris.js.md), [js/asteroidgen/fracture.js](fracture.js.md), [js/asteroidgen/generator.js](generator.js.md), [js/asteroidgen/impact-sim.js](impact-sim.js.md), [js/asteroidgen/impact.js](impact.js.md), [js/asteroidgen/tidal.js](tidal.js.md), [js/world/events/impacts.js](../world/events/impacts.js.md)
- [`RNG`](#s-RNG) · class — used by [js/asteroidgen/debris.js](debris.js.md), [js/asteroidgen/fracture.js](fracture.js.md), [js/asteroidgen/generator.js](generator.js.md), [js/asteroidgen/impact-sim.js](impact-sim.js.md), [js/asteroidgen/impact.js](impact.js.md), [js/asteroidgen/tidal.js](tidal.js.md), [js/render/holefx.js](../render/holefx.js.md), [js/render/impactfx.js](../render/impactfx.js.md), [js/world/events/impacts.js](../world/events/impacts.js.md)
- [`valueNoise3`](#s-valueNoise3) · function — used by [js/asteroidgen/fracture.js](fracture.js.md), [js/asteroidgen/generator.js](generator.js.md)
- [`fbm`](#s-fbm) · function — used by [js/asteroidgen/debris.js](debris.js.md), [js/asteroidgen/generator.js](generator.js.md)
- [`ridged`](#s-ridged) · function — used by [js/asteroidgen/generator.js](generator.js.md)
- [`randomSeedString`](#s-randomSeedString) · function — **no importer in scanned roots**
- [`powerLaw`](#s-powerLaw) · function — used by [js/asteroidgen/debris.js](debris.js.md), [js/asteroidgen/generator.js](generator.js.md), [js/asteroidgen/impact.js](impact.js.md)
- [`gauss`](#s-gauss) · function — used by [js/asteroidgen/debris.js](debris.js.md), [js/asteroidgen/impact.js](impact.js.md)
- [`unitVec`](#s-unitVec) · function — used by [js/asteroidgen/debris.js](debris.js.md), [js/asteroidgen/fracture.js](fracture.js.md), [js/asteroidgen/generator.js](generator.js.md), [js/asteroidgen/impact-sim.js](impact-sim.js.md), [js/asteroidgen/impact.js](impact.js.md), [js/asteroidgen/tidal.js](tidal.js.md), [js/world/events/impacts.js](../world/events/impacts.js.md)

## Effects

_none detected_

## Symbols

### <a id="s-hashString"></a>`hashString(str)`

function · **exported** · L1–8

- called by: [`buildDebrisField`](debris.js.md#s-buildDebrisField) _js/asteroidgen/debris.js_ · [`fractureGeometry`](fracture.js.md#s-fractureGeometry) _js/asteroidgen/fracture.js_ ×2 · [`buildRubbleField`](generator.js.md#s-buildRubbleField) _js/asteroidgen/generator.js_ · [`generateAsteroid`](generator.js.md#s-generateAsteroid) _js/asteroidgen/generator.js_ · [`ImpactSim.constructor`](impact-sim.js.md#s-ImpactSim-constructor) _js/asteroidgen/impact-sim.js_ · [`planEjecta`](impact.js.md#s-planEjecta) _js/asteroidgen/impact.js_ · [`planImpact`](impact.js.md#s-planImpact) _js/asteroidgen/impact.js_ · [`samplePalette`](impact.js.md#s-samplePalette) _js/asteroidgen/impact.js_ · [`TidalBody.constructor`](tidal.js.md#s-TidalBody-constructor) _js/asteroidgen/tidal.js_ · [`startCollision`](../world/events/impacts.js.md#s-startCollision) _js/world/events/impacts.js_ · [`startStrike`](../world/events/impacts.js.md#s-startStrike) _js/world/events/impacts.js_

<!-- note:hashString -->
<!-- /note -->

### <a id="s-RNG"></a>`RNG`

class · **exported** · L10–38

- called by: [`buildDebrisField`](debris.js.md#s-buildDebrisField) _js/asteroidgen/debris.js_ · [`computeMorphTargets`](fracture.js.md#s-computeMorphTargets) _js/asteroidgen/fracture.js_ · [`fractureGeometry`](fracture.js.md#s-fractureGeometry) _js/asteroidgen/fracture.js_ · [`solidifyChunks`](fracture.js.md#s-solidifyChunks) _js/asteroidgen/fracture.js_ · [`buildRubbleField`](generator.js.md#s-buildRubbleField) _js/asteroidgen/generator.js_ · [`generateAsteroid`](generator.js.md#s-generateAsteroid) _js/asteroidgen/generator.js_ · [`ImpactSim.constructor`](impact-sim.js.md#s-ImpactSim-constructor) _js/asteroidgen/impact-sim.js_ · [`planEjecta`](impact.js.md#s-planEjecta) _js/asteroidgen/impact.js_ · [`planImpact`](impact.js.md#s-planImpact) _js/asteroidgen/impact.js_ · [`samplePalette`](impact.js.md#s-samplePalette) _js/asteroidgen/impact.js_ · [`TidalBody.constructor`](tidal.js.md#s-TidalBody-constructor) _js/asteroidgen/tidal.js_ · [`makeHoleFx`](../render/holefx.js.md#s-makeHoleFx) _js/render/holefx.js_ · [`makeImpactFx`](../render/impactfx.js.md#s-makeImpactFx) _js/render/impactfx.js_ · [`startCollision`](../world/events/impacts.js.md#s-startCollision) _js/world/events/impacts.js_ · [`startStrike`](../world/events/impacts.js.md#s-startStrike) _js/world/events/impacts.js_

<!-- note:RNG -->
<!-- /note -->

#### <a id="s-RNG-constructor"></a>`RNG.constructor(seed)`

method · L11–13

<!-- note:RNG.constructor -->
<!-- /note -->

#### <a id="s-RNG-next"></a>`RNG.next()`

method · L15–21

<!-- note:RNG.next -->
<!-- /note -->

#### <a id="s-RNG-range"></a>`RNG.range(a, b)`

method · L23–25

<!-- note:RNG.range -->
<!-- /note -->

#### <a id="s-RNG-int"></a>`RNG.int(a, b)`

method · L27–29

<!-- note:RNG.int -->
<!-- /note -->

#### <a id="s-RNG-pick"></a>`RNG.pick(arr)`

method · L31–33

<!-- note:RNG.pick -->
<!-- /note -->

#### <a id="s-RNG-signed"></a>`RNG.signed()`

method · L35–37

<!-- note:RNG.signed -->
<!-- /note -->

### <a id="s-fade"></a>`fade(t)`

function · L40–42

- called by: [`valueNoise3`](#s-valueNoise3) ×3

<!-- note:fade -->
<!-- /note -->

### <a id="s-lerp"></a>`lerp(a, b, t)`

function · L44–46

- called by: [`valueNoise3`](#s-valueNoise3) ×7

<!-- note:lerp -->
<!-- /note -->

### <a id="s-gdot"></a>`gdot(ix, iy, iz, seed, dx, dy, dz)`

function · L48–56

- called by: [`valueNoise3`](#s-valueNoise3) ×8

<!-- note:gdot -->
Gradient dot product for one lattice corner — allocation-free (hot path).
<!-- /note -->

### <a id="s-valueNoise3"></a>`valueNoise3(x, y, z, seed)`

function · **exported** · L58–85

- calls: [`fade`](#s-fade) ×3 · [`gdot`](#s-gdot) ×8 · [`lerp`](#s-lerp) ×7
- called by: [`computeMorphTargets>target`](fracture.js.md#s-computeMorphTargets-target) _js/asteroidgen/fracture.js_ ×2 · [`fractureGeometry`](fracture.js.md#s-fractureGeometry) _js/asteroidgen/fracture.js_ ×3 · [`solidifyChunks`](fracture.js.md#s-solidifyChunks) _js/asteroidgen/fracture.js_ · [`solidifyChunks>ring`](fracture.js.md#s-solidifyChunks-ring) _js/asteroidgen/fracture.js_ ×3 · [`generateAsteroid`](generator.js.md#s-generateAsteroid) _js/asteroidgen/generator.js_ ×4 · [`fbm`](#s-fbm) · [`ridged`](#s-ridged)

<!-- note:valueNoise3 -->
<!-- /note -->

### <a id="s-fbm"></a>`fbm(x, y, z, seed, octaves=, lacunarity=, gain=)`

function · **exported** · L87–99

- calls: [`valueNoise3`](#s-valueNoise3)
- called by: [`makeRockGeometry`](debris.js.md#s-makeRockGeometry) _js/asteroidgen/debris.js_ ×5 · [`generateAsteroid`](generator.js.md#s-generateAsteroid) _js/asteroidgen/generator.js_ ×7

<!-- note:fbm -->
<!-- /note -->

### <a id="s-ridged"></a>`ridged(x, y, z, seed, octaves=)`

function · **exported** · L101–114

- calls: [`valueNoise3`](#s-valueNoise3)
- called by: [`generateAsteroid`](generator.js.md#s-generateAsteroid) _js/asteroidgen/generator.js_

<!-- note:ridged -->
<!-- /note -->

### <a id="s-randomSeedString"></a>`randomSeedString(rng=)`

function · **exported** · L116–127

<!-- note:randomSeedString -->
<!-- /note -->

### <a id="s-powerLaw"></a>`powerLaw(rng, dMin, dMax, alpha=)`

function · **exported** · L129–134

- called by: [`buildDebrisField`](debris.js.md#s-buildDebrisField) _js/asteroidgen/debris.js_ ×3 · [`buildRubbleField`](generator.js.md#s-buildRubbleField) _js/asteroidgen/generator.js_ · [`populateCraters`](generator.js.md#s-populateCraters) _js/asteroidgen/generator.js_ ×2 · [`planEjecta`](impact.js.md#s-planEjecta) _js/asteroidgen/impact.js_ ×3

<!-- note:powerLaw -->
Power-law sample for N(>D) ∝ D^-alpha between dMin and dMax.
<!-- /note -->

### <a id="s-gauss"></a>`gauss(rng)`

function · **exported** · L136–140

- called by: [`buildDebrisField`](debris.js.md#s-buildDebrisField) _js/asteroidgen/debris.js_ ×2 · [`buildDebrisField>place`](debris.js.md#s-buildDebrisField-place) _js/asteroidgen/debris.js_ ×3 · [`planEjecta>sheetDir`](impact.js.md#s-planEjecta-sheetDir) _js/asteroidgen/impact.js_

<!-- note:gauss -->
Box–Muller gaussian (one sample).
<!-- /note -->

### <a id="s-unitVec"></a>`unitVec(rng)`

function · **exported** · L142–147

- called by: [`buildDebrisField>spin`](debris.js.md#s-buildDebrisField-spin) _js/asteroidgen/debris.js_ · [`makeRockGeometry`](debris.js.md#s-makeRockGeometry) _js/asteroidgen/debris.js_ · [`computeMorphTargets`](fracture.js.md#s-computeMorphTargets) _js/asteroidgen/fracture.js_ · [`fractureGeometry`](fracture.js.md#s-fractureGeometry) _js/asteroidgen/fracture.js_ · [`buildRubbleField`](generator.js.md#s-buildRubbleField) _js/asteroidgen/generator.js_ ×2 · [`generateAsteroid`](generator.js.md#s-generateAsteroid) _js/asteroidgen/generator.js_ ×6 · [`generateAsteroid>walkPath`](generator.js.md#s-generateAsteroid-walkPath) _js/asteroidgen/generator.js_ ×2 · [`populateCraters`](generator.js.md#s-populateCraters) _js/asteroidgen/generator.js_ ×3 · [`populateGrooves`](generator.js.md#s-populateGrooves) _js/asteroidgen/generator.js_ · [`ImpactSim.shed`](impact-sim.js.md#s-ImpactSim-shed) _js/asteroidgen/impact-sim.js_ · [`planEjecta`](impact.js.md#s-planEjecta) _js/asteroidgen/impact.js_ ×5 · [`planImpact>plan`](impact.js.md#s-planImpact-plan) _js/asteroidgen/impact.js_ ×2 · [`TidalBody.constructor`](tidal.js.md#s-TidalBody-constructor) _js/asteroidgen/tidal.js_ · [`quatFrom`](../world/events/impacts.js.md#s-quatFrom) _js/world/events/impacts.js_ · [`rogueSpec`](../world/events/impacts.js.md#s-rogueSpec) _js/world/events/impacts.js_ · [`startStrike`](../world/events/impacts.js.md#s-startStrike) _js/world/events/impacts.js_

<!-- note:unitVec -->
Uniform unit vector as [x, y, z].
<!-- /note -->
