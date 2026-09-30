# js/shipgen/ops/fx.js

[index](../../../../README.md) · 157 lines · 23 symbols · 3 imports · 3 importers

## About

<!-- note:@file -->
Transient effects: beams, tracers, missiles, sparks, ore chunks, scan rings, RCS puffs.
fxAdd() registers a mesh with a tick(o, k, done, dt); fxUpdate() runs them each frame.

- L? · `(end of file)` — ---- bind a freshly built ship to the rig -------------------------
<!-- /note -->

## Imports

| line | from | names | target |
|---|---|---|---|
| 1 | `three` | `*` as `THREE` | external |
| 2 | `./host.js` | `fxScene` | [js/shipgen/ops/host.js](host.js.md) |
| 3 | `./rig.js` | `rig` | [js/shipgen/ops/rig.js](rig.js.md) |

## Imported by

- [js/shipgen/index.js](../index.js.md) — `fxUpdate`
- [js/shipgen/ops/ops.js](ops.js.md) — `FXG`, `fxMat`, `fxFlash`, `fxBeam`, `fxTracer`, `fxMissile`, `fxPuff`, `fxSparks`, `fxChunk`, `fxRing`, `fxUpdate`, `fxCasing`, `fxBurst`, `fxNuke`, `fxEmp`, `fxChaff`, `fxMine`
- test/shipgen/test-ops.mjs _(outside js/)_ — `fx`

## Exports

- [`fx`](#s-fx) · const — used by test/shipgen/test-ops.mjs
- [`FXG`](#s-FXG) · const — used by [js/shipgen/ops/ops.js](ops.js.md)
- [`fxMat`](#s-fxMat) · function — used by [js/shipgen/ops/ops.js](ops.js.md)
- [`fxAdd`](#s-fxAdd) · function — **no importer in scanned roots**
- [`fxFlash`](#s-fxFlash) · function — used by [js/shipgen/ops/ops.js](ops.js.md)
- [`fxBeam`](#s-fxBeam) · function — used by [js/shipgen/ops/ops.js](ops.js.md)
- [`fxTracer`](#s-fxTracer) · function — used by [js/shipgen/ops/ops.js](ops.js.md)
- [`fxCasing`](#s-fxCasing) · function — used by [js/shipgen/ops/ops.js](ops.js.md)
- [`fxBurst`](#s-fxBurst) · function — used by [js/shipgen/ops/ops.js](ops.js.md)
- [`fxNuke`](#s-fxNuke) · function — used by [js/shipgen/ops/ops.js](ops.js.md)
- [`fxEmp`](#s-fxEmp) · function — used by [js/shipgen/ops/ops.js](ops.js.md)
- [`fxChaff`](#s-fxChaff) · function — used by [js/shipgen/ops/ops.js](ops.js.md)
- [`fxMine`](#s-fxMine) · function — used by [js/shipgen/ops/ops.js](ops.js.md)
- [`fxMissile`](#s-fxMissile) · function — used by [js/shipgen/ops/ops.js](ops.js.md)
- [`fxPuff`](#s-fxPuff) · function — used by [js/shipgen/ops/ops.js](ops.js.md)
- [`fxSparks`](#s-fxSparks) · function — used by [js/shipgen/ops/ops.js](ops.js.md)
- [`fxChunk`](#s-fxChunk) · function — used by [js/shipgen/ops/ops.js](ops.js.md)
- [`fxRing`](#s-fxRing) · function — used by [js/shipgen/ops/ops.js](ops.js.md)
- [`fxUpdate`](#s-fxUpdate) · function — used by [js/shipgen/index.js](../index.js.md), [js/shipgen/ops/ops.js](ops.js.md)

## Effects

_none detected_

## Symbols

### <a id="s-fx"></a>`fx`

const · **exported** · L5–5

<!-- note:fx -->
<!-- /note -->

### <a id="s-_v1"></a>`_v1`

const · L6–6

<!-- note:_v1 -->
<!-- /note -->

### <a id="s-_v2"></a>`_v2`

const · L6–6

<!-- note:_v2 -->
<!-- /note -->

### <a id="s-_v3"></a>`_v3`

const · L6–6

<!-- note:_v3 -->
<!-- /note -->

### <a id="s-Y_AXIS"></a>`Y_AXIS`

const · L7–7

<!-- note:Y_AXIS -->
<!-- /note -->

### <a id="s-FXG"></a>`FXG`

const · **exported** · L9–16

<!-- note:FXG -->
<!-- /note -->

### <a id="s-fxMat"></a>`fxMat(color, opacity=, blending=)`

function · **exported** · L17–19

- called by: [`fxBeam`](#s-fxBeam) ×2 · [`fxFlash`](#s-fxFlash) · [`fxMine`](#s-fxMine) · [`fxMissile`](#s-fxMissile) · [`fxPuff`](#s-fxPuff) · [`fxRing`](#s-fxRing) · [`fxTracer`](#s-fxTracer) · [`makeTargetDrone`](ops.js.md#s-makeTargetDrone) _js/shipgen/ops/ops.js_ ×2 · [`startMining`](ops.js.md#s-startMining) _js/shipgen/ops/ops.js_ ×2

<!-- note:fxMat -->
<!-- /note -->

### <a id="s-fxAdd"></a>`fxAdd(mesh, life, tick)`

function · **exported** · L20–23

- calls: [`fxScene`](host.js.md#s-fxScene) _js/shipgen/ops/host.js_
- via [js/shipgen/ops/host.js](host.js.md): `fxScene.add`
- called by: [`fxBeam`](#s-fxBeam) · [`fxCasing`](#s-fxCasing) · [`fxChaff`](#s-fxChaff) · [`fxChunk`](#s-fxChunk) · [`fxEmp`](#s-fxEmp) · [`fxFlash`](#s-fxFlash) · [`fxMine`](#s-fxMine) · [`fxMissile`](#s-fxMissile) · [`fxPuff`](#s-fxPuff) · [`fxRing`](#s-fxRing) · [`fxSparks`](#s-fxSparks) · [`fxTracer`](#s-fxTracer)

<!-- note:fxAdd -->
<!-- /note -->

### <a id="s-fxFlash"></a>`fxFlash(p, color, r, life=)`

function · **exported** · L24–28

- calls: [`fxAdd`](#s-fxAdd) · [`fxMat`](#s-fxMat)
- called by: [`fxBurst`](#s-fxBurst) · [`fxChunk`](#s-fxChunk) · [`fxEmp`](#s-fxEmp) · [`fxMissile`](#s-fxMissile) · [`fxNuke`](#s-fxNuke) ×2 · [`fireLauncher`](ops.js.md#s-fireLauncher) _js/shipgen/ops/ops.js_ · [`fireShot`](ops.js.md#s-fireShot) _js/shipgen/ops/ops.js_ ×13

<!-- note:fxFlash -->
<!-- /note -->

### <a id="s-fxBeam"></a>`fxBeam(a, b, color, radius, life=)`

function · **exported** · L29–37

- calls: [`fxAdd`](#s-fxAdd) · [`fxMat`](#s-fxMat) ×2
- called by: [`fxEmp`](#s-fxEmp) · [`fireShot`](ops.js.md#s-fireShot) _js/shipgen/ops/ops.js_ ×3

<!-- note:fxBeam -->
<!-- /note -->

### <a id="s-fxTracer"></a>`fxTracer(a, b, color, speed, size, onHit)`

function · **exported** · L38–46

- calls: [`fxAdd`](#s-fxAdd) · [`fxMat`](#s-fxMat)
- called by: [`fireShot`](ops.js.md#s-fireShot) _js/shipgen/ops/ops.js_ ×6

<!-- note:fxTracer -->
<!-- /note -->

### <a id="s-fxCasing"></a>`fxCasing(p, dir)`

function · **exported** · L47–53

- calls: [`fxAdd`](#s-fxAdd)
- called by: [`fireShot`](ops.js.md#s-fireShot) _js/shipgen/ops/ops.js_

<!-- note:fxCasing -->
ammunition variants ------------------------------------------------------------------
<!-- /note -->

### <a id="s-fxBurst"></a>`fxBurst(p, color, r)`

function · **exported** · L54–58

- calls: [`fxFlash`](#s-fxFlash) · [`fxRing`](#s-fxRing) · [`fxSparks`](#s-fxSparks)
- called by: [`fxMine`](#s-fxMine) · [`fireShot`](ops.js.md#s-fireShot) _js/shipgen/ops/ops.js_

<!-- note:fxBurst -->
<!-- /note -->

### <a id="s-fxNuke"></a>`fxNuke(p)`

function · **exported** · L59–65

- calls: [`fxFlash`](#s-fxFlash) ×2 · [`fxRing`](#s-fxRing) ×2 · [`fxSparks`](#s-fxSparks)
- called by: [`fireLauncher.onArrive`](ops.js.md#s-fireLauncher-onArrive) _js/shipgen/ops/ops.js_

<!-- note:fxNuke -->
<!-- /note -->

### <a id="s-fxEmp"></a>`fxEmp(p)`

function · **exported** · L66–75

- calls: [`fxAdd`](#s-fxAdd) · [`fxBeam`](#s-fxBeam) · [`fxFlash`](#s-fxFlash) · [`fxRing`](#s-fxRing)
- called by: [`fireLauncher.onArrive~2`](ops.js.md#s-fireLauncher-onArrive-2) _js/shipgen/ops/ops.js_

<!-- note:fxEmp -->
- L69 · `const arcs = fxAdd(new THREE.Group(), 0.9, (o, k, done, dt) => {` — crackling arcs around the point of detonation
<!-- /note -->

### <a id="s-fxChaff"></a>`fxChaff(p, dir)`

function · **exported** · L76–88

- calls: [`fxAdd`](#s-fxAdd)
- called by: [`fireLauncher`](ops.js.md#s-fireLauncher) _js/shipgen/ops/ops.js_

<!-- note:fxChaff -->
<!-- /note -->

### <a id="s-fxMine"></a>`fxMine(p, dir)`

function · **exported** · L89–95

- calls: [`fxAdd`](#s-fxAdd) · [`fxBurst`](#s-fxBurst) · [`fxMat`](#s-fxMat)
- called by: [`fireLauncher`](ops.js.md#s-fireLauncher) _js/shipgen/ops/ops.js_

<!-- note:fxMine -->
<!-- /note -->

### <a id="s-fxMissile"></a>`fxMissile(a, b, up, color, opts=)`

function · **exported** · L96–113

- calls: [`fxAdd`](#s-fxAdd) · [`fxFlash`](#s-fxFlash) · [`fxMat`](#s-fxMat) · [`fxPuff`](#s-fxPuff)
- called by: [`fireLauncher`](ops.js.md#s-fireLauncher) _js/shipgen/ops/ops.js_ ×6

<!-- note:fxMissile -->
<!-- /note -->

### <a id="s-fxPuff"></a>`fxPuff(p, dir, r, color=, life=)`

function · **exported** · L114–118

- calls: [`fxAdd`](#s-fxAdd) · [`fxMat`](#s-fxMat)
- called by: [`fxMissile`](#s-fxMissile) · [`fireLauncher`](ops.js.md#s-fireLauncher) _js/shipgen/ops/ops.js_ ×7 · [`opsUpdate`](ops.js.md#s-opsUpdate) _js/shipgen/ops/ops.js_

<!-- note:fxPuff -->
<!-- /note -->

### <a id="s-fxSparks"></a>`fxSparks(p, dir, color=, n=)`

function · **exported** · L119–133

- calls: [`fxAdd`](#s-fxAdd)
- called by: [`fxBurst`](#s-fxBurst) · [`fxNuke`](#s-fxNuke) · [`fireShot`](ops.js.md#s-fireShot) _js/shipgen/ops/ops.js_ ×3 · [`opsUpdate`](ops.js.md#s-opsUpdate) _js/shipgen/ops/ops.js_

<!-- note:fxSparks -->
<!-- /note -->

### <a id="s-fxChunk"></a>`fxChunk(a, b)`

function · **exported** · L134–144

- calls: [`fxAdd`](#s-fxAdd) · [`fxFlash`](#s-fxFlash)
- called by: [`opsUpdate`](ops.js.md#s-opsUpdate) _js/shipgen/ops/ops.js_

<!-- note:fxChunk -->
<!-- /note -->

### <a id="s-fxRing"></a>`fxRing(p, rMax, color, life=)`

function · **exported** · L145–149

- calls: [`fxAdd`](#s-fxAdd) · [`fxMat`](#s-fxMat)
- called by: [`fxBurst`](#s-fxBurst) · [`fxEmp`](#s-fxEmp) · [`fxNuke`](#s-fxNuke) ×2 · [`doScan`](ops.js.md#s-doScan) _js/shipgen/ops/ops.js_ · [`fireShot`](ops.js.md#s-fireShot) _js/shipgen/ops/ops.js_

<!-- note:fxRing -->
<!-- /note -->

### <a id="s-fxUpdate"></a>`fxUpdate(dt)`

function · **exported** · L150–157

- calls: [`fxScene`](host.js.md#s-fxScene) _js/shipgen/ops/host.js_
- via [js/shipgen/ops/host.js](host.js.md): `fxScene.remove`
- called by: [`opsUpdate`](ops.js.md#s-opsUpdate) _js/shipgen/ops/ops.js_

<!-- note:fxUpdate -->
<!-- /note -->
