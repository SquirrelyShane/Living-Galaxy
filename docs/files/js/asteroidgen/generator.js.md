# js/asteroidgen/generator.js

[index](../../../README.md) · 1016 lines · 30 symbols · 4 imports · 2 importers

## About

<!-- note:@file -->
<!-- /note -->

## Imports

| line | from | names | target |
|---|---|---|---|
| 1 | `three` | `*` as `THREE` | external |
| 2 | `./ores.js` | `ORES`, `ASTEROID_CLASSES`, `hexToRgb` | [js/asteroidgen/ores.js](ores.js.md) |
| 3 | `./rng.js` | `RNG`, `hashString`, `fbm`, `ridged`, `valueNoise3`, `powerLaw`, `unitVec` | [js/asteroidgen/rng.js](rng.js.md) |
| 4 | `./debris.js` | `makeRockGeometry`, `computeNormals` | [js/asteroidgen/debris.js](debris.js.md) |

## Imported by

- [js/bodygen/body.js](../bodygen/body.js.md) — `generateAsteroid`, `SHAPE_LABELS`, `SHAPE_KINDS`
- [js/render/rockfx.js](../render/rockfx.js.md) — `buildRubbleField`

## Exports

- [`GENERATOR_VERSION`](#s-GENERATOR_VERSION) · const — **no importer in scanned roots**
- [`SHAPE_KINDS`](#s-SHAPE_KINDS) · const — used by [js/bodygen/body.js](../bodygen/body.js.md)
- [`SHAPE_LABELS`](#s-SHAPE_LABELS) · const — used by [js/bodygen/body.js](../bodygen/body.js.md)
- [`buildCubeSphere`](#s-buildCubeSphere) · function — **no importer in scanned roots**
- [`generateAsteroid`](#s-generateAsteroid) · function — used by [js/bodygen/body.js](../bodygen/body.js.md)
- [`buildRubbleField`](#s-buildRubbleField) · function — used by [js/render/rockfx.js](../render/rockfx.js.md)
- [`makeRockMaterial`](#s-makeRockMaterial) · function — **no importer in scanned roots**

## Effects

_none detected_

## Symbols

### <a id="s-GENERATOR_VERSION"></a>`GENERATOR_VERSION`

const · **exported** · L6–6

<!-- note:GENERATOR_VERSION -->
<!-- /note -->

### <a id="s-DETAIL_MAP"></a>`DETAIL_MAP`

const · L8–13

<!-- note:DETAIL_MAP -->
Cube-sphere subdivisions per face edge. Triangles = 12 · n².

- L9 · `low: 56,` — ~38k tris
- L10 · `medium: 80,` — ~77k
- L11 · `high: 113,` — ~153k
- L12 · `ultra: 158,` — ~300k
<!-- /note -->

### <a id="s-SHAPE_TABLE"></a>`SHAPE_TABLE`

const · L15–23

<!-- note:SHAPE_TABLE -->
<!-- /note -->

### <a id="s-SHAPE_KINDS"></a>`SHAPE_KINDS`

const · **exported** · L25–25

<!-- note:SHAPE_KINDS -->
<!-- /note -->

### <a id="s-SHAPE_LABELS"></a>`SHAPE_LABELS`

const · **exported** · L27–36

<!-- note:SHAPE_LABELS -->
<!-- /note -->

### <a id="s-smoothstep"></a>`smoothstep(e0, e1, x)`

function · L38–41

- called by: [`craterEval`](#s-craterEval) ×4 · [`generateAsteroid`](#s-generateAsteroid) ×6 · [`grooveEval`](#s-grooveEval) ×2

<!-- note:smoothstep -->
------------------------------------------------------------ helpers
<!-- /note -->

### <a id="s-smax"></a>`smax(a, b, k)`

function · L43–46

- called by: [`generateAsteroid`](#s-generateAsteroid) ×2

<!-- note:smax -->
<!-- /note -->

### <a id="s-smin"></a>`smin(a, b, k)`

function · L48–51

- called by: [`generateAsteroid`](#s-generateAsteroid)

<!-- note:smin -->
<!-- /note -->

### <a id="s-tangentBasis"></a>`tangentBasis(n)`

function · L53–64

- called by: [`populateCraters>make`](#s-populateCraters-make) · [`populateGrooves`](#s-populateGrooves)

<!-- note:tangentBasis -->
<!-- /note -->

### <a id="s-randomFrame"></a>`randomFrame(rng)`

function · L66–77

- called by: [`makeEllipsoid`](#s-makeEllipsoid)

<!-- note:randomFrame -->
Random orthonormal frame (rows e1, e2, e3).
<!-- /note -->

### <a id="s-makeEllipsoid"></a>`makeEllipsoid(rng, A, B, C, cx=, cy=, cz=)`

function · L79–82

- calls: [`randomFrame`](#s-randomFrame)
- called by: [`generateAsteroid`](#s-generateAsteroid) ×5

<!-- note:makeEllipsoid -->
<!-- /note -->

### <a id="s-ellipsoidR"></a>`ellipsoidR(E, x, y, z)`

function · L84–89

- called by: [`generateAsteroid`](#s-generateAsteroid) ×2

<!-- note:ellipsoidR -->
Radial distance of an origin-centred ellipsoid along unit dir.
<!-- /note -->

### <a id="s-rayEllipsoid"></a>`rayEllipsoid(E, x, y, z)`

function · L91–105

- called by: [`generateAsteroid`](#s-generateAsteroid) ×4

<!-- note:rayEllipsoid -->
Far intersection of a ray from the origin with an offset ellipsoid (0 on miss).
<!-- /note -->

### <a id="s-buildCubeSphere"></a>`buildCubeSphere(n)`

function · **exported** · L107–151

- calls: [`buildCubeSphere>vid`](#s-buildCubeSphere-vid)
- called by: [`generateAsteroid`](#s-generateAsteroid)

<!-- note:buildCubeSphere -->
Indexed cube-sphere with exactly shared seam vertices (lattice keys) and an
equi-angular warp, so triangles stay near-uniform with no pole pinching.
<!-- /note -->

#### <a id="s-buildCubeSphere-warp"></a>`buildCubeSphere>warp(i)`

function · L112–112

- called by: [`buildCubeSphere>vid`](#s-buildCubeSphere-vid) ×3

<!-- note:buildCubeSphere>warp -->
<!-- /note -->

#### <a id="s-buildCubeSphere-vid"></a>`buildCubeSphere>vid(c)`

function · L113–124

- calls: [`buildCubeSphere>warp`](#s-buildCubeSphere-warp) ×3
- called by: [`buildCubeSphere`](#s-buildCubeSphere)

<!-- note:buildCubeSphere>vid -->
<!-- /note -->

### <a id="s-buildAdjacency"></a>`buildAdjacency(count, index)`

function · L153–171

- called by: [`generateAsteroid`](#s-generateAsteroid)

<!-- note:buildAdjacency -->
CSR vertex adjacency from a triangle index (edges counted per triangle).
<!-- /note -->

### <a id="s-smoothField"></a>`smoothField(field, adj, iters)`

function · L173–188

- called by: [`generateAsteroid`](#s-generateAsteroid)

<!-- note:smoothField -->
<!-- /note -->

### <a id="s-shadeShift"></a>`shadeShift(rgb, t)`

function · L190–193

- called by: [`generateAsteroid`](#s-generateAsteroid)

<!-- note:shadeShift -->
<!-- /note -->

### <a id="s-mixRgb"></a>`mixRgb(a, b, t)`

function · L195–197

- called by: [`generateAsteroid`](#s-generateAsteroid) ×6

<!-- note:mixRgb -->
<!-- /note -->

### <a id="s-populateCraters"></a>`populateCraters(rng, density)`

function · L199–272

- calls: [`populateCraters>make`](#s-populateCraters-make) ×4 · [`powerLaw`](rng.js.md#s-powerLaw) _js/asteroidgen/rng.js_ ×2 · [`unitVec`](rng.js.md#s-unitVec) _js/asteroidgen/rng.js_ ×3
- called by: [`generateAsteroid`](#s-generateAsteroid)

<!-- note:populateCraters -->
------------------------------------------------------------ craters

Crater population in unit-sphere chord space. Power-law sizes, degradation
by age (old = shallow, soft rims, regolith-ponded floors), fresh rayed craters,
obliques, secondaries, and a small-crater saturation layer.

- L253 · `const nBasin = rng.int(0, 2) + (density > 0.45 ? 1 : 0);` — giant old basins that bite into the silhouette
<!-- /note -->

#### <a id="s-populateCraters-make"></a>`populateCraters>make(dir, D, age, simple, extra=)`

function · L201–230

- calls: [`tangentBasis`](#s-tangentBasis)
- called by: [`populateCraters`](#s-populateCraters) ×4

<!-- note:populateCraters>make -->
<!-- /note -->

### <a id="s-CR"></a>`CR`

const · L274–274

<!-- note:CR -->
<!-- /note -->

### <a id="s-craterEval"></a>`craterEval(x, y, z, c)`

function · L276–317

- calls: [`smoothstep`](#s-smoothstep) ×4
- called by: [`generateAsteroid`](#s-generateAsteroid)

<!-- note:craterEval -->
<!-- /note -->

### <a id="s-populateGrooves"></a>`populateGrooves(rng, roughness)`

function · L319–348

- calls: [`tangentBasis`](#s-tangentBasis) · [`unitVec`](rng.js.md#s-unitVec) _js/asteroidgen/rng.js_
- called by: [`generateAsteroid`](#s-generateAsteroid)

<!-- note:populateGrooves -->
---------------------------------------------------------- grooves
<!-- /note -->

### <a id="s-grooveEval"></a>`grooveEval(x, y, z, G)`

function · L350–363

- calls: [`smoothstep`](#s-smoothstep) ×2
- called by: [`generateAsteroid`](#s-generateAsteroid)

<!-- note:grooveEval -->
<!-- /note -->

### <a id="s-generateAsteroid"></a>`generateAsteroid(params)`

function · **exported** · L365–852

- calls: [`computeNormals`](debris.js.md#s-computeNormals) _js/asteroidgen/debris.js_ · [`buildAdjacency`](#s-buildAdjacency) · [`buildCubeSphere`](#s-buildCubeSphere) · [`craterEval`](#s-craterEval) · [`ellipsoidR`](#s-ellipsoidR) ×2 · [`generateAsteroid>walkPath`](#s-generateAsteroid-walkPath) ×2 · [`grooveEval`](#s-grooveEval) · [`makeEllipsoid`](#s-makeEllipsoid) ×5 · [`mixRgb`](#s-mixRgb) ×6 · [`populateCraters`](#s-populateCraters) · [`populateGrooves`](#s-populateGrooves) · [`rayEllipsoid`](#s-rayEllipsoid) ×4 · [`shadeShift`](#s-shadeShift) · [`smax`](#s-smax) ×2 · [`smin`](#s-smin) · [`smoothField`](#s-smoothField) · [`smoothstep`](#s-smoothstep) ×6 · [`hexToRgb`](ores.js.md#s-hexToRgb) _js/asteroidgen/ores.js_ ×4 · [`fbm`](rng.js.md#s-fbm) _js/asteroidgen/rng.js_ ×7 · [`hashString`](rng.js.md#s-hashString) _js/asteroidgen/rng.js_ · [`ridged`](rng.js.md#s-ridged) _js/asteroidgen/rng.js_ · [`new RNG`](rng.js.md#s-RNG) _js/asteroidgen/rng.js_ · [`unitVec`](rng.js.md#s-unitVec) _js/asteroidgen/rng.js_ ×6 · [`valueNoise3`](rng.js.md#s-valueNoise3) _js/asteroidgen/rng.js_ ×4
- called by: [`assayRock`](../bodygen/body.js.md#s-assayRock) _js/bodygen/body.js_ · [`generateBody`](../bodygen/body.js.md#s-generateBody) _js/bodygen/body.js_

<!-- note:generateAsteroid -->
------------------------------------------------------------ main

- L386 · `let roll = rng.next();` — ---- shape kind (always consume the roll so overrides keep other rolls stable)
- L404 · `const axisRanges = {` — ---- base body: triaxial ellipsoid, ratios by kind
- L416 · `const spinAxis = body.e[2];` — short axis = max-inertia spin axis
- L427 · `for (const L of lobes) L.R = L.R.map((r) => Math.max(r, sep + 0.1));` — ensure origin is inside both lobes along the separation axis
- L491 · `const facet = cuts.length ? smoothstep(0.0, 0.03, rsUncut - rs) : 0;` — fracture faces stay planar: damp relief where a cut is active
- L531 · `let mean = 0;` — normalise to unit mean radius so every shape frames the same
- L539 · `const oreKeys = Object.keys(klass.ores).filter((k) => ORES[k]);` — ---- ore features (direction space)
- L578 · `const featureScale = params.featureScale ?? 1;` — LIVING GALAXY: seams are sized for the mesh they land on. The generator's
  own widths are drawn for a 56–158-cell survey mesh; a game body is 7–18
  cells, where a 0.04-chord vein falls between vertices and the rock reads
  as bare. featureScale widens what is drawn; featureDensity multiplies the
  class weight that decides how many nets and spots each ore gets. Both
  default to 1, which is the generator exactly as shipped.
- L666 · `const positions = new Float32Array(count * 3);` — ---- positions, normals, cavity
- L690 · `const colors = new Float32Array(count * 3);` — ---- colours / PBR attributes
- L722 · `rock = mixRgb(rock, { r: accent.r * 1.3, g: accent.g * 1.3, b: accent.b * 1.3 }, exposed *` — bedrock on scarps / fresh ejecta is brighter & less space-weathered
- L724 · `rock = mixRgb(rock, { r: pondRgb.r * 1.08, g: pondRgb.g * 1.08, b: pondRgb.b * 1.06 }, pon` — ponded fine regolith
- L732 · `if (iceAffinity > 0) {` — frost in cold traps (crater floors, grooves, high latitude)
<!-- /note -->

#### <a id="s-generateAsteroid-walkPath"></a>`generateAsteroid>walkPath(start, steps, stepLen)`

function · L548–576

- calls: [`unitVec`](rng.js.md#s-unitVec) _js/asteroidgen/rng.js_ ×2
- called by: [`generateAsteroid`](#s-generateAsteroid) ×2

<!-- note:generateAsteroid>walkPath -->
- L557 · `const th = rng.range(-0.7, 0.7);` — Rodrigues rotation of heading about the current surface normal
<!-- /note -->

### <a id="s-buildRubbleField"></a>`buildRubbleField(asteroid, seedStr)`

function · **exported** · L854–955

- calls: [`makeRockGeometry`](debris.js.md#s-makeRockGeometry) _js/asteroidgen/debris.js_ · [`hashString`](rng.js.md#s-hashString) _js/asteroidgen/rng.js_ · [`powerLaw`](rng.js.md#s-powerLaw) _js/asteroidgen/rng.js_ · [`new RNG`](rng.js.md#s-RNG) _js/asteroidgen/rng.js_ · [`unitVec`](rng.js.md#s-unitVec) _js/asteroidgen/rng.js_ ×2
- called by: [`makeRockFx>attachRubble`](../render/rockfx.js.md#s-makeRockFx-attachRubble) _js/render/rockfx.js_

<!-- note:buildRubbleField -->
Near-surface rubble: meshed boulders seated on the regolith plus a lofted
halo of chips and specks. Rock variants come from debris.js.

- L874 · `if (seated && (nx * px + ny * py + nz * pz) / pl < 0.8) {` — boulders prefer level ground; retry once on steep slopes
<!-- /note -->

### <a id="s-makeRockMaterial"></a>`makeRockMaterial()`

function · **exported** · L957–1016

<!-- note:makeRockMaterial -->
<!-- /note -->
