# js/drones/droneforge.js

[index](../../../README.md) · 166 lines · 18 symbols · 3 imports · 2 importers

## About

<!-- note:@file -->
LIVING GALAXY — the drone forge.

Every remote drone in the sky is a machine grown by the robot generator in
js/robotgen/ (the ROBOTGEN tree, verbatim): a career, a chassis, a head with
optics and an antenna, kit, liveries and a real parts manifest priced off
the same catalogue stock as the ships and stations.

  sdrone   a port's interceptors — the drone line's own design, fixed-wing
  guard    a free port's gun drones — sentry frames on hover thrusters
  probe    your survey probe — a small winged survey frame

One design per (kind, seed). A port's drone line builds one machine, so its
seed is the port's name: every interceptor out of Bastion Anchorage is the
same model, and the next port over flies a different one. Same seed is the
same robot on every client.

Conventions match the hull forge: nose toward −Z, +Y up, centred on the
origin, largest dimension exactly the kind's `len` world units. Designs are
built once as templates and handed out as clones (shared geometry and
materials — flagged `keep`, so the engine's disposal pass leaves them alone;
releaseDrones() frees them when the sky changes).

Draw calls are the budget: a generated robot is 80–110 meshes over 14–22
materials. Everything is baked into one lit vertex-coloured mesh, one unlit
one for lamps and optics, and one per see-through material (plumes, fields)
— two to five draws a drone.

- L128 · `const templates = new Map();` — "kind|seed|sector" → template root
<!-- /note -->

## Imports

| line | from | names | target |
|---|---|---|---|
| 1 | `../../vendor/three.module.min.js` | `*` as `THREE` | **missing in js/** |
| 2 | `../robotgen/build.js` | `buildRobot` | [js/robotgen/build.js](../robotgen/build.js.md) |
| 4 | `./dronespec.js` | `DRONE_KINDS`, `droneSpec` | [js/drones/dronespec.js](dronespec.js.md) |
| 6 | `./dronespec.js` | re-export `DRONE_KINDS`, `droneSpec`, `droneSummary` | [js/drones/dronespec.js](dronespec.js.md) |

## Imported by

- [js/render/engine.js](../render/engine.js.md) — `droneFor`, `droneBudget`, `releaseDrones`, `releaseDrone`
- test/drones.test.mjs _(outside js/)_ — `forgeDrone`, `droneFor`, `droneBudget`, `droneTemplateCount`, `releaseDrones`

## Exports

- `DRONE_KINDS` · from `./dronespec.js` — **no importer in scanned roots**
- `droneSpec` · from `./dronespec.js` — **no importer in scanned roots**
- `droneSummary` · from `./dronespec.js` — **no importer in scanned roots**
- [`forgeDrone`](#s-forgeDrone) · function — used by test/drones.test.mjs
- [`droneBudget`](#s-droneBudget) · function — used by [js/render/engine.js](../render/engine.js.md), test/drones.test.mjs
- [`droneFor`](#s-droneFor) · function — used by [js/render/engine.js](../render/engine.js.md), test/drones.test.mjs
- [`droneTemplateCount`](#s-droneTemplateCount) · function — used by test/drones.test.mjs
- [`releaseDrone`](#s-releaseDrone) · function — used by [js/render/engine.js](../render/engine.js.md)
- [`releaseDrones`](#s-releaseDrones) · function — used by [js/render/engine.js](../render/engine.js.md), test/drones.test.mjs

## Effects

_none detected_

## Symbols

### <a id="s-_box"></a>`_box`

const · L8–8

<!-- note:_box -->
---- build ----------------------------------------------------------------
<!-- /note -->

### <a id="s-_size"></a>`_size`

const · L9–9

<!-- note:_size -->
<!-- /note -->

### <a id="s-_centre"></a>`_centre`

const · L10–10

<!-- note:_centre -->
<!-- /note -->

### <a id="s-_inv"></a>`_inv`

const · L11–11

<!-- note:_inv -->
<!-- /note -->

### <a id="s-_m"></a>`_m`

const · L12–12

<!-- note:_m -->
<!-- /note -->

### <a id="s-emis"></a>`emis(m)`

function · L14–14

- called by: [`forgeDrone`](#s-forgeDrone) · [`tint`](#s-tint)

<!-- note:emis -->
Three buckets: see-through (plumes, fields) keep their own material; bright lamps and
optics bake into one unlit vertex-coloured mesh; everything else into one lit one, with a
dim self-glow folded into the vertex colour so accent panels still read.
<!-- /note -->

### <a id="s-_c"></a>`_c`

const · L15–15

<!-- note:_c -->
<!-- /note -->

### <a id="s-DARK_FLOOR"></a>`DARK_FLOOR`

const · L16–16

<!-- note:DARK_FLOOR -->
<!-- /note -->

### <a id="s-tint"></a>`tint(m, lamp)`

function · L17–24

- calls: [`emis`](#s-emis)
- called by: [`forgeDrone`](#s-forgeDrone)

<!-- note:tint -->
- L21 · `const lum = 0.2126 * c.r + 0.7152 * c.g + 0.0722 * c.b;` — void / stealth liveries are near-black: lift the floor so the sunlit side still reads
  against the stars (the canopy's ambient is a sliver) — a dark hull, not a hole
<!-- /note -->

### <a id="s-forgeDrone"></a>`forgeDrone(kind, seed, sector=)`

function · **exported** · L26–96

- calls: [`emis`](#s-emis) · [`mergeList`](#s-mergeList) ×3 · [`tint`](#s-tint) · [`droneSpec`](dronespec.js.md#s-droneSpec) _js/drones/dronespec.js_ · [`buildRobot`](../robotgen/build.js.md#s-buildRobot) _js/robotgen/build.js_
- called by: [`droneFor`](#s-droneFor)

<!-- note:forgeDrone -->
Build a drone design from scratch: merged, oriented, scaled. Not cached.

- L38 · `for (let p = o; p; p = p.parent) if (!p.visible) return;` — spark pool, hidden kit
- L40 · `if (m.transparent && (m.opacity ?? 1) < 0.02) return;` — parked rotor discs
- L52 · `const mat = new THREE.MeshStandardMaterial({ vertexColors: true, metalness: Math.min(0.3,` — capped metalness: the canopy has one sun and no environment map, and a fully metallic
  robot the size of a skiff reads as a black cut-out against the stars
- L73 · `built.dispose?.();` — the generator's own per-build geometry and materials
- L75 · `inner.rotation.y = Math.PI;` — nose to −Z (robots face +Z), centre, and size to the kind
<!-- /note -->

### <a id="s-mergeList"></a>`mergeList(list, withColor)`

function · L98–126

- called by: [`forgeDrone`](#s-forgeDrone) ×3

<!-- note:mergeList -->
<!-- /note -->

### <a id="s-templates"></a>`templates`

const · L128–128

<!-- note:templates -->
---- templates -------------------------------------------------------------
Growing a design costs 10–35 ms, so the engine asks for at most a couple per
frame (droneBudget) and flies a placeholder until its design is ready.
<!-- /note -->

### <a id="s-budget"></a>`budget`

const · L129–129

<!-- note:budget -->
<!-- /note -->

### <a id="s-droneBudget"></a>`droneBudget(n=)`

function · **exported** · L131–131

- called by: [`mountGame>syncContactMeshes`](../render/engine.js.md#s-mountGame-syncContactMeshes) _js/render/engine.js_

<!-- note:droneBudget -->
Engine calls this once a frame: how many new designs may be grown.
<!-- /note -->

### <a id="s-droneFor"></a>`droneFor(kind, seed, sector=)`

function · **exported** · L133–145

- calls: [`forgeDrone`](#s-forgeDrone)
- called by: [`mountGame>droneDesign`](../render/engine.js.md#s-mountGame-droneDesign) _js/render/engine.js_ · [`mountGame>syncProbeMeshes`](../render/engine.js.md#s-mountGame-syncProbeMeshes) _js/render/engine.js_ · [`mountGame>syncWorkDrones`](../render/engine.js.md#s-mountGame-syncWorkDrones) _js/render/engine.js_

<!-- note:droneFor -->
A clone of the design, or null if it is not built yet and the frame's budget is spent.
<!-- /note -->

### <a id="s-droneTemplateCount"></a>`droneTemplateCount()`

function · **exported** · L147–147

<!-- note:droneTemplateCount -->
<!-- /note -->

### <a id="s-releaseDrone"></a>`releaseDrone(key)`

function · **exported** · L149–157

- called by: [`mountGame>syncWorkDrones`](../render/engine.js.md#s-mountGame-syncWorkDrones) _js/render/engine.js_

<!-- note:releaseDrone -->
Free one design by its template key (`inst.userData.template`). Call only after its clones are out of the scene.
<!-- /note -->

### <a id="s-releaseDrones"></a>`releaseDrones()`

function · **exported** · L159–166

- called by: [`mountGame>clearWorld`](../render/engine.js.md#s-mountGame-clearWorld) _js/render/engine.js_

<!-- note:releaseDrones -->
Free every design. Call only after the clones are out of the scene.
<!-- /note -->
