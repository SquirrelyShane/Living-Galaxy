# js/asteroidgen/fracture.js

[index](../../../README.md) · 647 lines · 20 symbols · 2 imports · 4 importers

## About

<!-- note:@file -->
Fracture: split a body mesh into Voronoi chunks and animate them on the GPU.

fractureGeometry() tags every vertex with a chunk id (aChunk) and a crack
proximity (aCrack, 1 on a cell border) using a noise-warped 3D Voronoi, so
crack lines wander like real fractures.

v1.8: detached chunks are driven from the CPU (tidal.js / impact-sim.js run the
physics). Per chunk the shader gets its centre and orientation in the mesh's
local frame plus heat, visibility and a spaghettification stretch; it only
places, stretches (along the direction to the hole, uBHLocal), morphs and
shades. The attached remainder rides the mesh with a strain bulge.

Heat maps to an incandescence ramp (dull red → orange → yellow-white →
compressed blue-white).

Chunks are solid: every crack edge of a chunk's surface patch is walled down
through a rough inner ring to an apex inside the body (closed, consistently
wound). Inner faces carry aInner = depth (crust → mantle → core), so fresh
fracture faces read as rock that glows molten toward the core when hot.
uVeins lights wandering molten veins across the surface (noise iso-lines +
crack seams) — planets once their atmosphere is gone, strained asteroids,
impact survivors.

Re-forming (FRACTURE_MORPH): every chunk also gets a rounded target shape —
a volume-matched ellipsoid fitted to the piece (PCA), lumpy, with a few
small craters — as aMorph / aMorphN. After its reform delay (uChunkC.w) a
detached piece relaxes from jagged wedge into a new small asteroid, keeping
its original surface and fresh-rock fracture patches. Planet pieces skip it
and stay visibly broken.
<!-- /note -->

## Imports

| line | from | names | target |
|---|---|---|---|
| 1 | `three` | `*` as `THREE` | external |
| 2 | `./rng.js` | `RNG`, `hashString`, `unitVec`, `valueNoise3` | [js/asteroidgen/rng.js](rng.js.md) |

## Imported by

- [js/asteroidgen/impact-shaders.js](impact-shaders.js.md) — `FRACTURE_GLSL`
- [js/asteroidgen/tidal.js](tidal.js.md) — `fractureGeometry`, `createFractureUniforms`, `applyFracture`, `makeFractureDepthMaterial`, `FRACTURE_MAX`
- [js/render/impactfx.js](../render/impactfx.js.md) — `FRACTURE_MAX`, `createFractureUniforms`
- [js/world/events/impacts.js](../world/events/impacts.js.md) — `fractureGeometry`, `eigen3`

## Exports

- [`FRACTURE_MAX`](#s-FRACTURE_MAX) · const — used by [js/asteroidgen/tidal.js](tidal.js.md), [js/render/impactfx.js](../render/impactfx.js.md)
- [`fractureGeometry`](#s-fractureGeometry) · function — used by [js/asteroidgen/tidal.js](tidal.js.md), [js/world/events/impacts.js](../world/events/impacts.js.md)
- [`eigen3`](#s-eigen3) · function — used by [js/world/events/impacts.js](../world/events/impacts.js.md)
- [`createFractureUniforms`](#s-createFractureUniforms) · function — used by [js/asteroidgen/tidal.js](tidal.js.md), [js/render/impactfx.js](../render/impactfx.js.md)
- [`resetFractureChunk`](#s-resetFractureChunk) · function — **no importer in scanned roots**
- [`FRACTURE_GLSL`](#s-FRACTURE_GLSL) · const — used by [js/asteroidgen/impact-shaders.js](impact-shaders.js.md)
- [`applyFracture`](#s-applyFracture) · function — used by [js/asteroidgen/tidal.js](tidal.js.md)
- [`makeFractureDepthMaterial`](#s-makeFractureDepthMaterial) · function — used by [js/asteroidgen/tidal.js](tidal.js.md)
- [`heatColor`](#s-heatColor) · function — **no importer in scanned roots**

## Effects

_none detected_

## Symbols

### <a id="s-FRACTURE_MAX"></a>`FRACTURE_MAX`

const · **exported** · L4–4

<!-- note:FRACTURE_MAX -->
<!-- /note -->

### <a id="s-fractureGeometry"></a>`fractureGeometry(geometry, {…}=)`

function · **exported** · L6–72

- calls: [`computeMorphTargets`](#s-computeMorphTargets) · [`solidifyChunks`](#s-solidifyChunks) · [`splitAlongCracks`](#s-splitAlongCracks) · [`hashString`](rng.js.md#s-hashString) _js/asteroidgen/rng.js_ ×2 · [`new RNG`](rng.js.md#s-RNG) _js/asteroidgen/rng.js_ · [`unitVec`](rng.js.md#s-unitVec) _js/asteroidgen/rng.js_ · [`valueNoise3`](rng.js.md#s-valueNoise3) _js/asteroidgen/rng.js_ ×3
- called by: [`TidalBody.constructor`](tidal.js.md#s-TidalBody-constructor) _js/asteroidgen/tidal.js_ · [`fracturedRogue`](../world/events/impacts.js.md#s-fracturedRogue) _js/world/events/impacts.js_

<!-- note:fractureGeometry -->
------------------------------------------------------------------ CPU

@param {THREE.BufferGeometry} geometry  indexed or not; needs position (+ optional color)
@returns {{ count, centroids: number[][], counts: number[], colors: number[][], radius: number, seeds: number[][] }}
<!-- /note -->

### <a id="s-eigen3"></a>`eigen3(m)`

function · **exported** · L74–103

- called by: [`computeMorphTargets`](#s-computeMorphTargets)

<!-- note:eigen3 -->
Jacobi eigen-decomposition of a symmetric 3×3 → { values[3], vectors[3][3] (columns as rows) }.
<!-- /note -->

### <a id="s-computeMorphTargets"></a>`computeMorphTargets(geometry, info, seed)`

function · L105–215

- calls: [`computeMorphTargets>key`](#s-computeMorphTargets-key) ×2 · [`computeMorphTargets>target`](#s-computeMorphTargets-target) · [`eigen3`](#s-eigen3) · [`new RNG`](rng.js.md#s-RNG) _js/asteroidgen/rng.js_ · [`unitVec`](rng.js.md#s-unitVec) _js/asteroidgen/rng.js_
- called by: [`fractureGeometry`](#s-fractureGeometry)

<!-- note:computeMorphTargets -->
Rounded "new asteroid" target for every vertex of every chunk: star-shaped
projection from the chunk's volume centroid onto a fitted, volume-matched,
lumpy, cratered ellipsoid. Adds aMorph + aMorphN. Returns per-chunk shape info.

- L112 · `const vol = new Float64Array(n);` — volume + volume centroid per chunk (closed meshes, origin tetrahedra)
- L140 · `ax = ax.map((a) => Math.max(a, amax * 0.55));` — rubble re-accretes rounder than the shard
- L177 · `const vol1 = new Float64Array(n);` — star projection + craters lose volume: rescale each target about its centre to the shard's volume
- L192 · `const acc = new Map();` — smooth target normals shared by coincident target positions inside a chunk
<!-- /note -->

#### <a id="s-computeMorphTargets-target"></a>`computeMorphTargets>target(i)`

function · L151–175

- calls: [`valueNoise3`](rng.js.md#s-valueNoise3) _js/asteroidgen/rng.js_ ×2
- called by: [`computeMorphTargets`](#s-computeMorphTargets)

<!-- note:computeMorphTargets>target -->
<!-- /note -->

#### <a id="s-computeMorphTargets-key"></a>`computeMorphTargets>key(i)`

function · L193–193

- called by: [`computeMorphTargets`](#s-computeMorphTargets) ×2

<!-- note:computeMorphTargets>key -->
<!-- /note -->

### <a id="s-solidifyChunks"></a>`solidifyChunks(geometry, info, {…})`

function · L217–358

- calls: [`mixc`](#s-mixc) ×2 · [`solidifyChunks>key`](#s-solidifyChunks-key) ×3 · [`solidifyChunks>pk`](#s-solidifyChunks-pk) ×2 · [`solidifyChunks>ring`](#s-solidifyChunks-ring) ×2 · [`new RNG`](rng.js.md#s-RNG) _js/asteroidgen/rng.js_ · [`valueNoise3`](rng.js.md#s-valueNoise3) _js/asteroidgen/rng.js_
- called by: [`fractureGeometry`](#s-fractureGeometry)

<!-- note:solidifyChunks -->
Close every chunk into a solid: for each crack (boundary) edge a→b of a chunk's
surface patch add a wall strip b→a → inner ring → apex. The inner ring is
noise-displaced so fracture faces are rough. Adds flat-shaded, non-indexed
triangles appended to the index. Returns the number of triangles added.

- L225 · `const edgeCount = new Map();` — boundary edges appear exactly once (crack split gave each chunk its own vertices)
- L236 · `const loopNb = new Map();` — The crack boundary zig-zags along triangle edges; walling straight down from it folds
  the inner ring over itself. Smooth each boundary loop first (neighbours along the loop).
- L236 · `const loopNb = new Map();` — boundary vertex → [prev, next]
- L275 · `const tris = [];` — [p0, p1, p2, depth0, depth1, depth2, chunk, srcVertex]
- L285 · `const t1 = [pb, pa, ra, 0.05, 0.05, 0.5, k, a]; t1.ns = [sb, sa, ra];` — shading normals come from the smoothed loop so the jagged crack edge does not stripe
- L308 · `const nAcc = new Map();` — smooth normals across each chunk's fracture walls (positions shared per chunk), so the
  fan of thin wall triangles shades as one rough surface instead of stripes
- L319 · `a[0] += fn[0]; a[1] += fn[1]; a[2] += fn[2];` — accumulate at the real vertex key so both jagged and smoothed corners share it
- L333 · `const a = c < 2 || tr[5] !== 1 ? nAcc.get(pk(p, k)) : tr.fn;` — apex keeps its own face normal
- L343 · `const ps = tr.ns[c];` — low-frequency tint from the smoothed loop only (per-vertex high frequencies smear into radial stripes);
  fine grain is added per pixel in the shader
- L350 · `newIdx[io++] = o;` — aEmit and any other attributes stay zero on fracture faces
<!-- /note -->

#### <a id="s-solidifyChunks-key"></a>`solidifyChunks>key(a, b)`

function · L226–226

- called by: [`solidifyChunks`](#s-solidifyChunks) ×3

<!-- note:solidifyChunks>key -->
<!-- /note -->

#### <a id="s-solidifyChunks-ring"></a>`solidifyChunks>ring(v, k)`

function · L257–273

- calls: [`valueNoise3`](rng.js.md#s-valueNoise3) _js/asteroidgen/rng.js_ ×3
- called by: [`solidifyChunks`](#s-solidifyChunks) ×2

<!-- note:solidifyChunks>ring -->
<!-- /note -->

#### <a id="s-solidifyChunks-pk"></a>`solidifyChunks>pk(p, k)`

function · L309–309

- called by: [`solidifyChunks`](#s-solidifyChunks) ×2

<!-- note:solidifyChunks>pk -->
<!-- /note -->

### <a id="s-mixc"></a>`mixc(a, b, t)`

function · L360–362

- called by: [`solidifyChunks`](#s-solidifyChunks) ×2

<!-- note:mixc -->
<!-- /note -->

### <a id="s-splitAlongCracks"></a>`splitAlongCracks(geometry, aChunk)`

function · L364–408

- called by: [`fractureGeometry`](#s-fractureGeometry)

<!-- note:splitAlongCracks -->
Give every triangle exactly one owning chunk (majority of its corners) and
duplicate corner vertices that belong to another chunk, so separating chunks
never stretch a triangle across the gap. Extends every vertex attribute.
@returns {number} vertices added
<!-- /note -->

### <a id="s-createFractureUniforms"></a>`createFractureUniforms()`

function · **exported** · L410–433

- called by: [`TidalBody.constructor`](tidal.js.md#s-TidalBody-constructor) _js/asteroidgen/tidal.js_ · [`makeImpactFx>build`](../render/impactfx.js.md#s-makeImpactFx-build) _js/render/impactfx.js_

<!-- note:createFractureUniforms -->
Shared uniform objects for one fractured body.

- L415 · `A[k * 4 + 3] = -1;` — all attached
- L416 · `C[k * 4 + 1] = 1;` — visible
- L417 · `C[k * 4 + 2] = 1;` — no stretch
- L418 · `D[k * 4 + 3] = 1;` — identity orientation
<!-- /note -->

### <a id="s-resetFractureChunk"></a>`resetFractureChunk(u, k)`

function · **exported** · L435–440

<!-- note:resetFractureChunk -->
Reset one chunk slot to attached.
<!-- /note -->

### <a id="s-FRACTURE_GLSL"></a>`FRACTURE_GLSL`

const · **exported** · L442–582

<!-- note:FRACTURE_GLSL -->
----------------------------------------------------------------- GLSL

- L443 · `vertexPars:` — glsl
- L511 · `fragmentPars:` — glsl
- L549 · `` fragmentApply:   ` `` — expects vec4 diffuseColor, vec3 totalEmissiveRadiance in scope
- L549 · `fragmentApply:` — glsl
- L577 · `` normalFix:   ` `` — MeshStandard only: undo three's DoubleSide normal flip on folded fracture faces
- L577 · `normalFix:` — glsl
<!-- /note -->

### <a id="s-applyFracture"></a>`applyFracture(material, uniforms, {…}=)`

function · **exported** · L584–613

- called by: [`TidalBody.constructor`](tidal.js.md#s-TidalBody-constructor) _js/asteroidgen/tidal.js_

<!-- note:applyFracture -->
Inject fracture animation into a MeshStandardMaterial (keeps any existing
onBeforeCompile, e.g. the rock PBR attributes).
<!-- /note -->

### <a id="s-makeFractureDepthMaterial"></a>`makeFractureDepthMaterial(uniforms, {…}=)`

function · **exported** · L615–634

- called by: [`TidalBody.constructor`](tidal.js.md#s-TidalBody-constructor) _js/asteroidgen/tidal.js_

<!-- note:makeFractureDepthMaterial -->
Depth material running the same fracture animation (correct shadows).
<!-- /note -->

### <a id="s-heatColor"></a>`heatColor(h)`

function · **exported** · L636–647

- calls: [`heatColor>mix`](#s-heatColor-mix) ×4 · [`heatColor>ss`](#s-heatColor-ss) ×4

<!-- note:heatColor -->
Heat ramp mirror for CPU-side colouring (particles).
<!-- /note -->

#### <a id="s-heatColor-ss"></a>`heatColor>ss(a, b, x)`

function · L637–640

- called by: [`heatColor`](#s-heatColor) ×4

<!-- note:heatColor>ss -->
<!-- /note -->

#### <a id="s-heatColor-mix"></a>`heatColor>mix(a, b, t)`

function · L641–641

- called by: [`heatColor`](#s-heatColor) ×4

<!-- note:heatColor>mix -->
<!-- /note -->
