# js/render/impactfx.js

[index](../../../README.md) · 246 lines · 14 symbols · 8 imports · 1 importers

## About

<!-- note:@file -->
LIVING GALAXY — drawing an impact run.

js/world/events/impacts.js decides what breaks and where every piece goes; this draws it,
with the asteroid generator's own Impact Lab shaders (vendored at
js/asteroidgen/impact-shaders.js and fracture.js):

  the rock      its grown body cut into solid chunks. Detached chunks are
                placed from the run's rigid-body track (centre + orientation
                in the mesh's frame), glow from the heat of the break and cool,
                and — being asteroid pieces — pull themselves round into new
                small asteroids a second or two after they leave
  the blast     a dust sheet across the contact normal, sparks, and meshed
                ejecta rocks, all moving analytically in the vertex shader
  the aftermath dust shed off each tumbling piece (the swirl lines) and the
                spray off every secondary contact, flushed from the run as it
                emits them into fixed GPU buffers
  the flash     a flash shell and two shock rings on the contact

Everything sits in one group per run, placed at the run's frame (the struck
world's centre, or the pair's centre of mass) relative to the floating origin
and scaled by the run's `L`, so the Lab's shaders see the units they were
written in.

Crust thrown off a world is not drawn here: those pieces are ordinary debris
chunks and the engine's debris mesh draws them (hot, while the run says so).

- L13 · `const AFTER = 12;` — seconds the ejecta is kept after its run lets the pieces go
<!-- /note -->

## Imports

| line | from | names | target |
|---|---|---|---|
| 1 | `three` | `*` as `THREE` | external |
| 2 | `../asteroidgen/impact-shaders.js` | `IMPACT_SHADERS` | [js/asteroidgen/impact-shaders.js](../asteroidgen/impact-shaders.js.md) |
| 3 | `../asteroidgen/fracture.js` | `FRACTURE_MAX`, `createFractureUniforms` | [js/asteroidgen/fracture.js](../asteroidgen/fracture.js.md) |
| 4 | `../asteroidgen/impact-sim.js` | `DustBuffer`, `RockBuffer`, `chunkLocal` | [js/asteroidgen/impact-sim.js](../asteroidgen/impact-sim.js.md) |
| 5 | `../asteroidgen/debris.js` | `makeRockGeometry` | [js/asteroidgen/debris.js](../asteroidgen/debris.js.md) |
| 6 | `../asteroidgen/rng.js` | `RNG` | [js/asteroidgen/rng.js](../asteroidgen/rng.js.md) |
| 7 | `../bodygen/gl.js` | `patchGeneratorShaders` | [js/bodygen/gl.js](../bodygen/gl.js.md) |
| 8 | `../world/events/impacts.js` | `runs`, `IMPACTS` | [js/world/events/impacts.js](../world/events/impacts.js.md) |

## Imported by

- [js/render/engine.js](engine.js.md) — `makeImpactFx`

## Exports

- [`makeImpactFx`](#s-makeImpactFx) · function — used by [js/render/engine.js](engine.js.md)

## Effects

_none detected_

## Symbols

### <a id="s-COARSE"></a>`COARSE`

const · L10–10

<!-- note:COARSE -->
<!-- /note -->

### <a id="s-DUST_CAP"></a>`DUST_CAP`

const · L11–11

<!-- note:DUST_CAP -->
<!-- /note -->

### <a id="s-ROCK_CAP"></a>`ROCK_CAP`

const · L12–12

<!-- note:ROCK_CAP -->
<!-- /note -->

### <a id="s-AFTER"></a>`AFTER`

const · L13–13

<!-- note:AFTER -->
<!-- /note -->

### <a id="s-SLOW"></a>`SLOW`

const · L14–14

<!-- note:SLOW -->
<!-- /note -->

### <a id="s-makeImpactFx"></a>`makeImpactFx({…})`

function · **exported** · L16–246

- calls: [`makeRockGeometry`](../asteroidgen/debris.js.md#s-makeRockGeometry) _js/asteroidgen/debris.js_ · [`new RNG`](../asteroidgen/rng.js.md#s-RNG) _js/asteroidgen/rng.js_ · [`patchGeneratorShaders`](../bodygen/gl.js.md#s-patchGeneratorShaders) _js/bodygen/gl.js_
- called by: [`mountGame`](engine.js.md#s-mountGame) _js/render/engine.js_

<!-- note:makeImpactFx -->
- L18 · `const views = new Map();` — run id → view
<!-- /note -->

#### <a id="s-makeImpactFx-pxScale"></a>`makeImpactFx>pxScale()`

function · L29–32

- called by: [`makeImpactFx>update`](#s-makeImpactFx-update)

<!-- note:makeImpactFx>pxScale -->
<!-- /note -->

#### <a id="s-makeImpactFx-build"></a>`makeImpactFx>build(run)`

function · L34–120

- calls: [`createFractureUniforms`](../asteroidgen/fracture.js.md#s-createFractureUniforms) _js/asteroidgen/fracture.js_ · [`new DustBuffer`](../asteroidgen/impact-sim.js.md#s-DustBuffer) _js/asteroidgen/impact-sim.js_ · [`new RockBuffer`](../asteroidgen/impact-sim.js.md#s-RockBuffer) _js/asteroidgen/impact-sim.js_ · [`makeImpactFx>spritePoints`](#s-makeImpactFx-spritePoints) ×2
- called by: [`makeImpactFx>update`](#s-makeImpactFx-update)

<!-- note:makeImpactFx>build -->
- L40 · `run.rocks.forEach((fr, bi) => {` — the fractured rock(s)
- L56 · `const pieceOf = new Map();` — which run pieces are this rock's chunks
- L68 · `const survivor = run.sim.pieces.findIndex((P) => P.kind === "survivor" && P.body === (run.` — a rock that did not break all the way keeps a survivor
- L72 · `const E = run.ejecta;` — the blast
- L104 · `const C = new THREE.Vector3().fromArray(run.contact);` — the flash
<!-- /note -->

#### <a id="s-makeImpactFx-spritePoints"></a>`makeImpactFx>spritePoints(group, S, uniforms, spark)`

function · L122–143

- called by: [`makeImpactFx>build`](#s-makeImpactFx-build) ×2

<!-- note:makeImpactFx>spritePoints -->
<!-- /note -->

#### <a id="s-makeImpactFx-flush"></a>`makeImpactFx>flush(view)`

function · L145–162

- called by: [`makeImpactFx>update`](#s-makeImpactFx-update)

<!-- note:makeImpactFx>flush -->
<!-- /note -->

#### <a id="s-makeImpactFx-dispose"></a>`makeImpactFx>dispose(view)`

function · L164–174

- called by: [`makeImpactFx>disposeAll`](#s-makeImpactFx-disposeAll) · [`makeImpactFx>update`](#s-makeImpactFx-update)

<!-- note:makeImpactFx>dispose -->
- L166 · `if (o.isInstancedMesh) o.dispose();` — frees instanceMatrix/instanceColor on the GPU
- L168 · `o.geometry.dispose();` — the fractured rock's geometry belongs to the run, and the run is gone
<!-- /note -->

#### <a id="s-makeImpactFx-update"></a>`makeImpactFx>update(dt)`

function · L176–238

- calls: [`chunkLocal`](../asteroidgen/impact-sim.js.md#s-chunkLocal) _js/asteroidgen/impact-sim.js_ · [`makeImpactFx>build`](#s-makeImpactFx-build) · [`makeImpactFx>dispose`](#s-makeImpactFx-dispose) · [`makeImpactFx>flush`](#s-makeImpactFx-flush) · [`makeImpactFx>pxScale`](#s-makeImpactFx-pxScale)

<!-- note:makeImpactFx>update -->
- L195 · `const ended = view.endedAt != null;` — the pieces: from the rigid-body track while the run holds them, and the
  rock meshes go when the run lets the pieces become ordinary debris
- L217 · `u.uChunkC.value[o + 1] = chunk && !chunk.dead ? 1 : 0;` — a piece the tractor or the cutter already took is not there
- L223 · `const f = view.flash;` — flash + rings
<!-- /note -->

#### <a id="s-makeImpactFx-disposeAll"></a>`makeImpactFx>disposeAll()`

function · L240–243

- calls: [`makeImpactFx>dispose`](#s-makeImpactFx-dispose)

<!-- note:makeImpactFx>disposeAll -->
<!-- /note -->

#### <a id="s-makeImpactFx-views"></a>`makeImpactFx.views()`

prop · L245–245

<!-- note:makeImpactFx.views -->
<!-- /note -->
