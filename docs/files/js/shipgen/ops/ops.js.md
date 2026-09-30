# js/shipgen/ops/ops.js

[index](../../../../README.md) · 339 lines · 28 symbols · 5 imports · 2 importers

## About

<!-- note:@file -->
Live systems layer: throttle, fire control, mining, docking, deployables, sensor sweeps, RCS.
opsBind() indexes a freshly built ship into `rig`; opsUpdate() runs every frame.
<!-- /note -->

## Imports

| line | from | names | target |
|---|---|---|---|
| 1 | `three` | `*` as `THREE` | external |
| 2 | `./host.js` | `host`, `fxScene` | [js/shipgen/ops/host.js](host.js.md) |
| 3 | `./rig.js` | `rig` | [js/shipgen/ops/rig.js](rig.js.md) |
| 5 | `../core/rng.js` | `RNG` | [js/shipgen/core/rng.js](../core/rng.js.md) |
| 6 | `./fx.js` | `FXG`, `fxMat`, `fxFlash`, `fxBeam`, `fxTracer`, `fxMissile`, `fxPuff`, `fxSparks`, `fxChunk`, `fxRing`, `fxUpdate`, `fxCasing`, `fxBurst`, `fxNuke`, `fxEmp`, `fxChaff`, `fxMine` | [js/shipgen/ops/fx.js](fx.js.md) |

## Imported by

- [js/shipgen/index.js](../index.js.md) — `ops`, `opsBind`, `opsUpdate`, `doScan`, `startMining`, `stopMining`, `aimAngles`, `fireShot`, `fireLauncher`, `targetDrone`, `colliderGroup`
- test/shipgen/test-ops.mjs _(outside js/)_ — `ops`, `opsBind`, `opsUpdate`, `doScan`, `startMining`, `stopMining`, `aimAngles`

## Exports

- `rig` — **no importer in scanned roots**
- [`ops`](#s-ops) · const — used by [js/shipgen/index.js](../index.js.md), test/shipgen/test-ops.mjs
- [`targetDrone`](#s-targetDrone) · let — used by [js/shipgen/index.js](../index.js.md)
- [`rock`](#s-rock) · let — **no importer in scanned roots**
- [`colliderGroup`](#s-colliderGroup) · let — used by [js/shipgen/index.js](../index.js.md)
- [`miningBeams`](#s-miningBeams) · let — **no importer in scanned roots**
- [`opsBind`](#s-opsBind) · function — used by [js/shipgen/index.js](../index.js.md), test/shipgen/test-ops.mjs
- [`makeTargetDrone`](#s-makeTargetDrone) · function — **no importer in scanned roots**
- [`makeRock`](#s-makeRock) · function — **no importer in scanned roots**
- [`placeRock`](#s-placeRock) · function — **no importer in scanned roots**
- [`aimAngles`](#s-aimAngles) · function — used by [js/shipgen/index.js](../index.js.md), test/shipgen/test-ops.mjs
- [`wrapAngle`](#s-wrapAngle) · function — **no importer in scanned roots**
- [`muzzleWorld`](#s-muzzleWorld) · function — **no importer in scanned roots**
- [`fireShot`](#s-fireShot) · function — used by [js/shipgen/index.js](../index.js.md)
- [`fireLauncher`](#s-fireLauncher) · function — used by [js/shipgen/index.js](../index.js.md)
- [`hitDrone`](#s-hitDrone) · function — **no importer in scanned roots**
- [`startMining`](#s-startMining) · function — used by [js/shipgen/index.js](../index.js.md), test/shipgen/test-ops.mjs
- [`stopMining`](#s-stopMining) · function — used by [js/shipgen/index.js](../index.js.md), test/shipgen/test-ops.mjs
- [`opsUpdate`](#s-opsUpdate) · function — used by [js/shipgen/index.js](../index.js.md), test/shipgen/test-ops.mjs
- [`doScan`](#s-doScan) · function — used by [js/shipgen/index.js](../index.js.md), test/shipgen/test-ops.mjs

## Effects

- **timer** — `setTimeout` (fireShot:157, fireLauncher:188, fireLauncher:190, fireLauncher:196, fireLauncher:202, doScan:336)

## Symbols

### <a id="s-ops"></a>`ops`

const · **exported** · L8–9

<!-- note:ops -->
<!-- /note -->

### <a id="s-targetDrone"></a>`targetDrone`

const · **exported** · L10–10

<!-- note:targetDrone -->
<!-- /note -->

### <a id="s-rock"></a>`rock`

const · **exported** · L10–10

<!-- note:rock -->
<!-- /note -->

### <a id="s-colliderGroup"></a>`colliderGroup`

const · **exported** · L10–10

<!-- note:colliderGroup -->
<!-- /note -->

### <a id="s-miningBeams"></a>`miningBeams`

const · **exported** · L10–10

<!-- note:miningBeams -->
<!-- /note -->

### <a id="s-_v1"></a>`_v1`

const · L12–12

<!-- note:_v1 -->
<!-- /note -->

### <a id="s-_v2"></a>`_v2`

const · L12–12

<!-- note:_v2 -->
<!-- /note -->

### <a id="s-_v3"></a>`_v3`

const · L12–12

<!-- note:_v3 -->
<!-- /note -->

### <a id="s-Y_AXIS"></a>`Y_AXIS`

const · L13–13

<!-- note:Y_AXIS -->
<!-- /note -->

### <a id="s-opsBind"></a>`opsBind(root, ctx=)`

function · **exported** · L15–63

- calls: [`fxScene`](host.js.md#s-fxScene) _js/shipgen/ops/host.js_ ×6 · [`makeRock`](#s-makeRock) · [`makeTargetDrone`](#s-makeTargetDrone) · [`placeRock`](#s-placeRock) · [`startMining`](#s-startMining)
- via [js/shipgen/ops/rig.js](rig.js.md): `rig.deployables.push`, `rig.docks.push`, `rig.drills.push`, `rig.engineLights.push`, `rig.intakes.push`, `rig.launchers.push`, `rig.rcs.push`, `rig.sensors.push`, `rig.srbPlumes.push`, `rig.turrets.push`
- via [js/shipgen/ops/host.js](host.js.md): `fxScene.add`, `fxScene.remove`

<!-- note:opsBind -->
ctx lets the part inspector bind a lone module: { size, U, occ, accent }

- L39 · `if (targetDrone) fxScene().remove(targetDrone);` — target drone off the bow, mining rock at the drill tips
- L49 · `if (colliderGroup) colliderGroup.parent?.remove(colliderGroup);` — collision boxes
- L59 · `for (const b of miningBeams) fxScene().remove(b); miningBeams = [];` — reset transient state
<!-- /note -->

### <a id="s-makeTargetDrone"></a>`makeTargetDrone(r)`

function · **exported** · L64–73

- calls: [`fxMat`](fx.js.md#s-fxMat) _js/shipgen/ops/fx.js_ ×2
- called by: [`opsBind`](#s-opsBind)

<!-- note:makeTargetDrone -->
<!-- /note -->

### <a id="s-makeRock"></a>`makeRock(R)`

function · **exported** · L74–91

- calls: [`new RNG`](../core/rng.js.md#s-RNG) _js/shipgen/core/rng.js_
- called by: [`opsBind`](#s-opsBind)

<!-- note:makeRock -->
- L85 · `for (let i = 0; i < 6; i++) {` — ore veins
<!-- /note -->

### <a id="s-placeRock"></a>`placeRock(root)`

function · **exported** · L92–112

- called by: [`opsBind`](#s-opsBind) · [`startMining`](#s-startMining)

<!-- note:placeRock -->
- L104 · `const bb = new THREE.Box3().setFromObject(root);` — never let the ore body sit inside modules mounted ahead of the drills: clear the hull's forward extent
<!-- /note -->

### <a id="s-aimDrills"></a>`aimDrills()`

function · L113–126

- called by: [`startMining`](#s-startMining)

<!-- note:aimDrills -->
how far each telescoping boom must extend for its tip to touch the ore body
<!-- /note -->

### <a id="s-aimAngles"></a>`aimAngles(o, target)`

function · **exported** · L128–132

<!-- note:aimAngles -->
---- world-space helpers ----------------------------------------
<!-- /note -->

### <a id="s-wrapAngle"></a>`wrapAngle(a)`

function · **exported** · L133–133

<!-- note:wrapAngle -->
<!-- /note -->

### <a id="s-muzzleWorld"></a>`muzzleWorld(o)`

function · **exported** · L134–134

- called by: [`fireShot`](#s-fireShot)

<!-- note:muzzleWorld -->
<!-- /note -->

### <a id="s-fireShot"></a>`fireShot(o, t)`

function · **exported** · L136–178

- calls: [`fxBeam`](fx.js.md#s-fxBeam) _js/shipgen/ops/fx.js_ ×3 · [`fxBurst`](fx.js.md#s-fxBurst) _js/shipgen/ops/fx.js_ · [`fxCasing`](fx.js.md#s-fxCasing) _js/shipgen/ops/fx.js_ · [`fxFlash`](fx.js.md#s-fxFlash) _js/shipgen/ops/fx.js_ ×13 · [`fxRing`](fx.js.md#s-fxRing) _js/shipgen/ops/fx.js_ · [`fxSparks`](fx.js.md#s-fxSparks) _js/shipgen/ops/fx.js_ ×3 · [`fxTracer`](fx.js.md#s-fxTracer) _js/shipgen/ops/fx.js_ ×6 · [`hitDrone`](#s-hitDrone) ×7 · [`muzzleWorld`](#s-muzzleWorld)
- via [js/shipgen/ops/fx.js](fx.js.md): `fxRing.quaternion.copy`
- called by: [`opsUpdate`](#s-opsUpdate)
- effects: timer `setTimeout`

<!-- note:fireShot -->
- L156 · `const side = o.localToWorld(new THREE.Vector3(1, 0, 0)).sub(o.getWorldPosition(new THREE.V` — three-round burst with brass ejected from the breech
- L165 · `const dist = from.distanceTo(to); const burstAt = from.clone().lerp(to, 0.82 + Math.random` — proximity fuse: shell detonates short of the target in a fragment cloud
- L170 · `fxFlash(from, "#cf8bff", U * 0.5, 0.2); break;` — continuous: a persistent beam is kept while firing (see opsUpdate); here only the muzzle bloom
<!-- /note -->

### <a id="s-fireLauncher"></a>`fireLauncher(o, t)`

function · **exported** · L179–204

- calls: [`fxChaff`](fx.js.md#s-fxChaff) _js/shipgen/ops/fx.js_ · [`fxFlash`](fx.js.md#s-fxFlash) _js/shipgen/ops/fx.js_ · [`fxMine`](fx.js.md#s-fxMine) _js/shipgen/ops/fx.js_ · [`fxMissile`](fx.js.md#s-fxMissile) _js/shipgen/ops/fx.js_ ×6 · [`fxPuff`](fx.js.md#s-fxPuff) _js/shipgen/ops/fx.js_ ×7
- called by: [`opsUpdate`](#s-opsUpdate)
- effects: timer `setTimeout`

<!-- note:fireLauncher -->
<!-- /note -->

#### <a id="s-fireLauncher-onArrive"></a>`fireLauncher.onArrive(p)`

prop · L192–192

- calls: [`fxNuke`](fx.js.md#s-fxNuke) _js/shipgen/ops/fx.js_ · [`hitDrone`](#s-hitDrone)

<!-- note:fireLauncher.onArrive -->
<!-- /note -->

#### <a id="s-fireLauncher-onArrive-2"></a>`fireLauncher.onArrive~2(p)`

prop · L194–194

- calls: [`fxEmp`](fx.js.md#s-fxEmp) _js/shipgen/ops/fx.js_ · [`hitDrone`](#s-hitDrone)

<!-- note:fireLauncher.onArrive~2 -->
<!-- /note -->

### <a id="s-hitDrone"></a>`hitDrone()`

function · **exported** · L205–205

- called by: [`fireLauncher.onArrive`](#s-fireLauncher-onArrive) · [`fireLauncher.onArrive~2`](#s-fireLauncher-onArrive-2) · [`fireShot`](#s-fireShot) ×7

<!-- note:hitDrone -->
<!-- /note -->

### <a id="s-startMining"></a>`startMining()`

function · **exported** · L207–220

- calls: [`fxMat`](fx.js.md#s-fxMat) _js/shipgen/ops/fx.js_ ×2 · [`fxScene`](host.js.md#s-fxScene) _js/shipgen/ops/host.js_ ×2 · [`aimDrills`](#s-aimDrills) · [`placeRock`](#s-placeRock)
- via [js/shipgen/ops/rig.js](rig.js.md): `rig.root.updateMatrixWorld`
- via [js/shipgen/ops/host.js](host.js.md): `fxScene.add`, `fxScene.remove`, `host.toast`
- called by: [`opsBind`](#s-opsBind)

<!-- note:startMining -->
---- mining -------------------------------------------------------
<!-- /note -->

### <a id="s-stopMining"></a>`stopMining()`

function · **exported** · L221–225

- calls: [`fxScene`](host.js.md#s-fxScene) _js/shipgen/ops/host.js_
- via [js/shipgen/ops/host.js](host.js.md): `fxScene.remove`

<!-- note:stopMining -->
<!-- /note -->

### <a id="s-sparkClock"></a>`sparkClock`

const · L227–227

<!-- note:sparkClock -->
---- per-frame ops update ---------------------------------------
<!-- /note -->

### <a id="s-chunkClock"></a>`chunkClock`

const · L227–227

<!-- note:chunkClock -->
<!-- /note -->

### <a id="s-opsUpdate"></a>`opsUpdate(dt, t)`

function · **exported** · L228–327

- calls: [`fxChunk`](fx.js.md#s-fxChunk) _js/shipgen/ops/fx.js_ · [`fxPuff`](fx.js.md#s-fxPuff) _js/shipgen/ops/fx.js_ · [`fxSparks`](fx.js.md#s-fxSparks) _js/shipgen/ops/fx.js_ · [`fxUpdate`](fx.js.md#s-fxUpdate) _js/shipgen/ops/fx.js_ · [`fireLauncher`](#s-fireLauncher) · [`fireShot`](#s-fireShot)
- via [js/shipgen/ops/rig.js](rig.js.md): `rig.root.localToWorld`

<!-- note:opsUpdate -->
- L231 · `for (const d of rig.drills) {` — telescoping drill booms ease toward their extension target
- L241 · `for (const l of rig.engineLights) l.intensity = l.userData.baseI * (0.12 + 0.88 * thr);` — drive output follows the throttle
- L249 · `if (ops.rcs && rig.rcs.length && t > ops.nextPuff) {` — RCS station-keeping puffs — busier while the throttle is being moved
- L259 · `ops.deployT += ((ops.deploy ? 1 : 0) - ops.deployT) * Math.min(1, dt * 1.6);` — deployables ease between stowed and deployed
- L264 · `ops.dockT += ((ops.docked ? 1 : 0) - ops.dockT) * Math.min(1, dt * 2.2);` — docking: latches swing out, approach blinkers go steady green
- L276 · `if (ops.firing && t > ops.fireEnd) { ops.firing = false; }` — weapons
- L296 · `if (ops.mining && rock) {` — mining
- L304 · `const contact = _v1.copy(tip).addScaledVector(_v2.subVectors(rockW, tip).normalize(), rig.` — beam runs from the boom emitter to the rock face just past the tip
- L324 · `const scanning = t < ops.scanUntil;` — sensor sweep: dishes and pods spin up while a scan is live
<!-- /note -->

### <a id="s-doScan"></a>`doScan(t)`

function · **exported** · L328–339

- calls: [`fxRing`](fx.js.md#s-fxRing) _js/shipgen/ops/fx.js_
- via [js/shipgen/ops/rig.js](rig.js.md): `rig.root.updateMatrixWorld`
- via [js/shipgen/ops/host.js](host.js.md): `host.toast`
- effects: timer `setTimeout`

<!-- note:doScan -->
<!-- /note -->
