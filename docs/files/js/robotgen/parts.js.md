# js/robotgen/parts.js

[index](../../../README.md) · 67 lines · 11 symbols · 0 imports · 4 importers

## About

<!-- note:@file -->
robotgen/src/parts.js — shared primitives: material/geometry kit and the two
node helpers. Imported by build.js and attach.js so attachments can be added
without reaching into the builder.
<!-- /note -->

## Imports

_none_

## Imported by

- [js/robotgen/attach.js](attach.js.md) — `put`, `group`
- [js/robotgen/build.js](build.js.md) — `makeKit`, `put`, `group`
- [js/robotgen/fly.js](fly.js.md) — `put`, `group`
- [js/robotgen/kit.js](kit.js.md) — `put`, `group`

## Exports

- [`makeKit`](#s-makeKit) · function — used by [js/robotgen/build.js](build.js.md)
- [`put`](#s-put) · function — used by [js/robotgen/attach.js](attach.js.md), [js/robotgen/build.js](build.js.md), [js/robotgen/fly.js](fly.js.md), [js/robotgen/kit.js](kit.js.md)
- [`group`](#s-group) · function — used by [js/robotgen/attach.js](attach.js.md), [js/robotgen/build.js](build.js.md), [js/robotgen/fly.js](fly.js.md), [js/robotgen/kit.js](kit.js.md)

## Effects

_none detected_

## Symbols

### <a id="s-makeKit"></a>`makeKit(THREE, spec, opts)`

function · **exported** · L1–50

- calls: [`makeKit>mat`](#s-makeKit-mat) ×6
- called by: [`buildRobot`](build.js.md#s-buildRobot) _js/robotgen/build.js_

<!-- note:makeKit -->
---------- small helpers ----------
<!-- /note -->

#### <a id="s-makeKit-mat"></a>`makeKit>mat(key, color, o=)`

function · L5–22

- called by: [`makeKit`](#s-makeKit) ×6 · [`makeKit.glow`](#s-makeKit-glow)

<!-- note:makeKit>mat -->
<!-- /note -->

#### <a id="s-makeKit-keep"></a>`makeKit>keep(g, vol, half)`

function · L24–30

- called by: [`makeKit.box`](#s-makeKit-box) · [`makeKit.cone`](#s-makeKit-cone) · [`makeKit.cyl`](#s-makeKit-cyl) · [`makeKit.sph`](#s-makeKit-sph) · [`makeKit.torus`](#s-makeKit-torus)

<!-- note:makeKit>keep -->
every geometry carries its volume and half-extents, so the physics layer can
weigh and box parts without knowing which THREE build made them
<!-- /note -->

#### <a id="s-makeKit-glow"></a>`makeKit.glow(c, i)`

prop · L37–37

- calls: [`makeKit>mat`](#s-makeKit-mat)

<!-- note:makeKit.glow -->
<!-- /note -->

#### <a id="s-makeKit-box"></a>`makeKit.box(w, h, d)`

prop · L41–41

- calls: [`makeKit>keep`](#s-makeKit-keep)

<!-- note:makeKit.box -->
<!-- /note -->

#### <a id="s-makeKit-cyl"></a>`makeKit.cyl(rt, rb, h, s=, open=)`

prop · L42–45

- calls: [`makeKit>keep`](#s-makeKit-keep)

<!-- note:makeKit.cyl -->
<!-- /note -->

#### <a id="s-makeKit-sph"></a>`makeKit.sph(r, s=)`

prop · L46–46

- calls: [`makeKit>keep`](#s-makeKit-keep)

<!-- note:makeKit.sph -->
<!-- /note -->

#### <a id="s-makeKit-cone"></a>`makeKit.cone(r, h, s=)`

prop · L47–47

- calls: [`makeKit>keep`](#s-makeKit-keep)

<!-- note:makeKit.cone -->
<!-- /note -->

#### <a id="s-makeKit-torus"></a>`makeKit.torus(r, t, s=, rs=)`

prop · L48–48

- calls: [`makeKit>keep`](#s-makeKit-keep)

<!-- note:makeKit.torus -->
<!-- /note -->

### <a id="s-put"></a>`put(THREE, parent, geo, mat, x=, y=, z=, rx=, ry=, rz=, name)`

function · **exported** · L52–60

- called by: [`addPanel`](attach.js.md#s-addPanel) _js/robotgen/attach.js_ ×11 · [`applyFinish`](attach.js.md#s-applyFinish) _js/robotgen/attach.js_ ×9 · [`applyFinish>ring`](attach.js.md#s-applyFinish-ring) _js/robotgen/attach.js_ · [`beamProjector`](attach.js.md#s-beamProjector) _js/robotgen/attach.js_ ×3 · [`buildBack`](attach.js.md#s-buildBack) _js/robotgen/attach.js_ ×51 · [`buildLimbEnd`](attach.js.md#s-buildLimbEnd) _js/robotgen/attach.js_ ×68 · [`buildWeaponMods`](attach.js.md#s-buildWeaponMods) _js/robotgen/attach.js_ ×33 · [`droneBay`](attach.js.md#s-droneBay) _js/robotgen/attach.js_ ×5 · [`flareRack`](attach.js.md#s-flareRack) _js/robotgen/attach.js_ ×3 · [`floodlight`](attach.js.md#s-floodlight) _js/robotgen/attach.js_ ×3 · [`missilePod`](attach.js.md#s-missilePod) _js/robotgen/attach.js_ ×3 · [`railgun`](attach.js.md#s-railgun) _js/robotgen/attach.js_ ×5 · [`repairArm`](attach.js.md#s-repairArm) _js/robotgen/attach.js_ ×5 · [`riotShield`](attach.js.md#s-riotShield) _js/robotgen/attach.js_ ×4 · [`sensorMast`](attach.js.md#s-sensorMast) _js/robotgen/attach.js_ ×4 · [`shoulderCannon`](attach.js.md#s-shoulderCannon) _js/robotgen/attach.js_ ×5 · [`smokeBank`](attach.js.md#s-smokeBank) _js/robotgen/attach.js_ ×2 · [`winch`](attach.js.md#s-winch) _js/robotgen/attach.js_ ×4 · [`buildArm`](build.js.md#s-buildArm) _js/robotgen/build.js_ ×24 · [`buildHead`](build.js.md#s-buildHead) _js/robotgen/build.js_ ×49 · [`buildHover`](build.js.md#s-buildHover) _js/robotgen/build.js_ ×6 · [`buildLeg`](build.js.md#s-buildLeg) _js/robotgen/build.js_ ×12 · [`buildRobot`](build.js.md#s-buildRobot) _js/robotgen/build.js_ ×3 · [`buildTorso`](build.js.md#s-buildTorso) _js/robotgen/build.js_ ×43 · [`buildTracks`](build.js.md#s-buildTracks) _js/robotgen/build.js_ ×8 · [`buildWheels`](build.js.md#s-buildWheels) _js/robotgen/build.js_ ×9 · [`buildPlane`](fly.js.md#s-buildPlane) _js/robotgen/fly.js_ ×30 · [`buildRotor`](fly.js.md#s-buildRotor) _js/robotgen/fly.js_ ×3 · [`navLight`](fly.js.md#s-navLight) _js/robotgen/fly.js_ · [`rotorAssembly`](fly.js.md#s-rotorAssembly) _js/robotgen/fly.js_ ×7 · [`skidGear`](fly.js.md#s-skidGear) _js/robotgen/fly.js_ ×6 · [`PODS.camera`](kit.js.md#s-PODS-camera) _js/robotgen/kit.js_ ×3 · [`PODS.cargo`](kit.js.md#s-PODS-cargo) _js/robotgen/kit.js_ ×3 · [`PODS.chem`](kit.js.md#s-PODS-chem) _js/robotgen/kit.js_ ×3 · [`PODS.chute`](kit.js.md#s-PODS-chute) _js/robotgen/kit.js_ ×2 · [`PODS.dronebay`](kit.js.md#s-PODS-dronebay) _js/robotgen/kit.js_ ×2 · [`PODS.gpr`](kit.js.md#s-PODS-gpr) _js/robotgen/kit.js_ ×2 · [`PODS.hailer`](kit.js.md#s-PODS-hailer) _js/robotgen/kit.js_ ×2 · [`PODS.jammer`](kit.js.md#s-PODS-jammer) _js/robotgen/kit.js_ ×2 · [`PODS.mapping`](kit.js.md#s-PODS-mapping) _js/robotgen/kit.js_ ×4 · [`PODS.munition`](kit.js.md#s-PODS-munition) _js/robotgen/kit.js_ ×3 · [`PODS.rad`](kit.js.md#s-PODS-rad) _js/robotgen/kit.js_ ×3 · [`PODS.relay`](kit.js.md#s-PODS-relay) _js/robotgen/kit.js_ ×3 · [`PODS.sampler`](kit.js.md#s-PODS-sampler) _js/robotgen/kit.js_ ×3 · [`PODS.spotlight`](kit.js.md#s-PODS-spotlight) _js/robotgen/kit.js_ ×3 · [`PODS.tank`](kit.js.md#s-PODS-tank) _js/robotgen/kit.js_ ×2 · [`PODS.thermal`](kit.js.md#s-PODS-thermal) _js/robotgen/kit.js_ ×2 · [`ammoPack`](kit.js.md#s-ammoPack) _js/robotgen/kit.js_ ×3 · [`buildChest`](kit.js.md#s-buildChest) _js/robotgen/kit.js_ ×15 · [`buildHeadModules`](kit.js.md#s-buildHeadModules) _js/robotgen/kit.js_ ×7 · [`buildHips`](kit.js.md#s-buildHips) _js/robotgen/kit.js_ ×10 · [`gatling`](kit.js.md#s-gatling) _js/robotgen/kit.js_ ×4 · [`grappleMount`](kit.js.md#s-grappleMount) _js/robotgen/kit.js_ ×4 · [`grenadeLauncher`](kit.js.md#s-grenadeLauncher) _js/robotgen/kit.js_ ×4 · [`hailer`](kit.js.md#s-hailer) _js/robotgen/kit.js_ ×3 · [`jammerPod`](kit.js.md#s-jammerPod) _js/robotgen/kit.js_ ×3 · [`mortar`](kit.js.md#s-mortar) _js/robotgen/kit.js_ ×3 · [`netGun`](kit.js.md#s-netGun) _js/robotgen/kit.js_ ×2 · [`podShell`](kit.js.md#s-podShell) _js/robotgen/kit.js_ ×2 · [`radarMount`](kit.js.md#s-radarMount) _js/robotgen/kit.js_ ×4 · [`relayMast`](kit.js.md#s-relayMast) _js/robotgen/kit.js_ ×4 · [`spotlight`](kit.js.md#s-spotlight) _js/robotgen/kit.js_ ×4 · [`taserMount`](kit.js.md#s-taserMount) _js/robotgen/kit.js_ ×3 · [`toolArm`](kit.js.md#s-toolArm) _js/robotgen/kit.js_ ×5

<!-- note:put -->
<!-- /note -->

### <a id="s-group"></a>`group(THREE, parent, name, x=, y=, z=)`

function · **exported** · L61–67

- called by: [`addPanel`](attach.js.md#s-addPanel) _js/robotgen/attach.js_ · [`applyFinish`](attach.js.md#s-applyFinish) _js/robotgen/attach.js_ · [`beamProjector`](attach.js.md#s-beamProjector) _js/robotgen/attach.js_ · [`buildAttachments`](attach.js.md#s-buildAttachments) _js/robotgen/attach.js_ · [`buildBack`](attach.js.md#s-buildBack) _js/robotgen/attach.js_ ×10 · [`buildLimbEnd`](attach.js.md#s-buildLimbEnd) _js/robotgen/attach.js_ ×8 · [`buildWeaponMods`](attach.js.md#s-buildWeaponMods) _js/robotgen/attach.js_ ×2 · [`droneBay`](attach.js.md#s-droneBay) _js/robotgen/attach.js_ ×3 · [`flareRack`](attach.js.md#s-flareRack) _js/robotgen/attach.js_ · [`floodlight`](attach.js.md#s-floodlight) _js/robotgen/attach.js_ · [`missilePod`](attach.js.md#s-missilePod) _js/robotgen/attach.js_ · [`railgun`](attach.js.md#s-railgun) _js/robotgen/attach.js_ · [`repairArm`](attach.js.md#s-repairArm) _js/robotgen/attach.js_ ×4 · [`riotShield`](attach.js.md#s-riotShield) _js/robotgen/attach.js_ ×2 · [`sensorMast`](attach.js.md#s-sensorMast) _js/robotgen/attach.js_ ×2 · [`shoulderCannon`](attach.js.md#s-shoulderCannon) _js/robotgen/attach.js_ · [`smokeBank`](attach.js.md#s-smokeBank) _js/robotgen/attach.js_ · [`buildArm`](build.js.md#s-buildArm) _js/robotgen/build.js_ ×12 · [`buildHead`](build.js.md#s-buildHead) _js/robotgen/build.js_ ×9 · [`buildHover`](build.js.md#s-buildHover) _js/robotgen/build.js_ · [`buildLeg`](build.js.md#s-buildLeg) _js/robotgen/build.js_ ×6 · [`buildRobot`](build.js.md#s-buildRobot) _js/robotgen/build.js_ ×3 · [`buildTorso`](build.js.md#s-buildTorso) _js/robotgen/build.js_ · [`buildTracks`](build.js.md#s-buildTracks) _js/robotgen/build.js_ ×2 · [`buildWheels`](build.js.md#s-buildWheels) _js/robotgen/build.js_ ×3 · [`buildPlane`](fly.js.md#s-buildPlane) _js/robotgen/fly.js_ ×17 · [`buildRotor`](fly.js.md#s-buildRotor) _js/robotgen/fly.js_ ×6 · [`rotorAssembly`](fly.js.md#s-rotorAssembly) _js/robotgen/fly.js_ ×2 · [`skidGear`](fly.js.md#s-skidGear) _js/robotgen/fly.js_ · [`PODS.camera`](kit.js.md#s-PODS-camera) _js/robotgen/kit.js_ · [`PODS.dronebay`](kit.js.md#s-PODS-dronebay) _js/robotgen/kit.js_ · [`PODS.mapping`](kit.js.md#s-PODS-mapping) _js/robotgen/kit.js_ · [`PODS.sampler`](kit.js.md#s-PODS-sampler) _js/robotgen/kit.js_ · [`buildChest`](kit.js.md#s-buildChest) _js/robotgen/kit.js_ ×2 · [`buildHeadModules`](kit.js.md#s-buildHeadModules) _js/robotgen/kit.js_ ×2 · [`buildHips`](kit.js.md#s-buildHips) _js/robotgen/kit.js_ · [`buildKit`](kit.js.md#s-buildKit) _js/robotgen/kit.js_ · [`gatling`](kit.js.md#s-gatling) _js/robotgen/kit.js_ ×2 · [`grappleMount`](kit.js.md#s-grappleMount) _js/robotgen/kit.js_ · [`grenadeLauncher`](kit.js.md#s-grenadeLauncher) _js/robotgen/kit.js_ · [`hailer`](kit.js.md#s-hailer) _js/robotgen/kit.js_ · [`jammerPod`](kit.js.md#s-jammerPod) _js/robotgen/kit.js_ · [`mortar`](kit.js.md#s-mortar) _js/robotgen/kit.js_ ×2 · [`netGun`](kit.js.md#s-netGun) _js/robotgen/kit.js_ · [`radarMount`](kit.js.md#s-radarMount) _js/robotgen/kit.js_ · [`relayMast`](kit.js.md#s-relayMast) _js/robotgen/kit.js_ ×2 · [`spotlight`](kit.js.md#s-spotlight) _js/robotgen/kit.js_ · [`taserMount`](kit.js.md#s-taserMount) _js/robotgen/kit.js_ · [`toolArm`](kit.js.md#s-toolArm) _js/robotgen/kit.js_ ×4

<!-- note:group -->
<!-- /note -->
