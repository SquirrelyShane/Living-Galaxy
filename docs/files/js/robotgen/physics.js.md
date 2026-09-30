# js/robotgen/physics.js

[index](../../../README.md) · 188 lines · 17 symbols · 0 imports · 3 importers

## About

<!-- note:@file -->
robotgen/src/physics.js — mass, balance and part separation.

Portable on purpose: it walks node.position / rotation / scale, which real
three.js and the test stub expose identically, and composes its own matrices.
That means the same code runs in the browser and in `node test/physics.js`.

- L54 · `const HOLLOW = 0.22;` — shells, frames and voids — not solid billets
<!-- /note -->

## Imports

_none_

## Imported by

- [js/robotgen/build.js](build.js.md) — `computeMassModel`, `centreOfMass`, `resolveSeparation`, `gravityProfile`, `EARTH_G`
- [js/robotgen/build.js](build.js.md) — `computeMassModel`, `centreOfMass`, `colliderBoxes`, `boxesOverlap`, `gravityProfile`, `weightN`, `EARTH_G`
- [js/robotgen/drills.js](drills.js.md) — `computeMassModel`, `matrixIn`, `EARTH_G`

## Exports

- [`matrixIn`](#s-matrixIn) · function — used by [js/robotgen/drills.js](drills.js.md)
- [`originIn`](#s-originIn) · function — **no importer in scanned roots**
- [`computeMassModel`](#s-computeMassModel) · function — used by [js/robotgen/build.js](build.js.md), [js/robotgen/drills.js](drills.js.md)
- [`centreOfMass`](#s-centreOfMass) · function — used by [js/robotgen/build.js](build.js.md)
- [`weightN`](#s-weightN) · function — used by [js/robotgen/build.js](build.js.md)
- [`colliderBoxes`](#s-colliderBoxes) · function — used by [js/robotgen/build.js](build.js.md)
- [`boxesOverlap`](#s-boxesOverlap) · function — used by [js/robotgen/build.js](build.js.md)
- [`resolveSeparation`](#s-resolveSeparation) · function — used by [js/robotgen/build.js](build.js.md)
- [`EARTH_G`](#s-EARTH_G) · const — used by [js/robotgen/build.js](build.js.md), [js/robotgen/drills.js](drills.js.md)
- [`gravityProfile`](#s-gravityProfile) · function — used by [js/robotgen/build.js](build.js.md)

## Effects

_none detected_

## Symbols

### <a id="s-compose"></a>`compose(p, r, s)`

function · L1–16

- called by: [`matrixIn`](#s-matrixIn)

<!-- note:compose -->
---------- portable forward kinematics ----------
<!-- /note -->

### <a id="s-mul"></a>`mul(a, b)`

function · L17–25

- called by: [`matrixIn`](#s-matrixIn)

<!-- note:mul -->
<!-- /note -->

### <a id="s-IDENTITY"></a>`IDENTITY`

const · L26–26

<!-- note:IDENTITY -->
<!-- /note -->

### <a id="s-matrixIn"></a>`matrixIn(node, frame, cache)`

function · **exported** · L28–36

- calls: [`compose`](#s-compose) · [`matrixIn`](#s-matrixIn) · [`mul`](#s-mul)
- called by: [`parentYaw`](drills.js.md#s-parentYaw) _js/robotgen/drills.js_ · [`worldOf`](drills.js.md#s-worldOf) _js/robotgen/drills.js_ · [`colliderBoxes`](#s-colliderBoxes) · [`matrixIn`](#s-matrixIn) · [`originIn`](#s-originIn) · [`resolveSeparation`](#s-resolveSeparation) ×3

<!-- note:matrixIn -->
World matrix of `node` measured in `frame`'s space. `cache` is per-pass.
<!-- /note -->

### <a id="s-originIn"></a>`originIn(node, frame, cache)`

function · **exported** · L37–40

- calls: [`matrixIn`](#s-matrixIn)
- called by: [`centreOfMass`](#s-centreOfMass)

<!-- note:originIn -->
<!-- /note -->

### <a id="s-applyPoint"></a>`applyPoint(m, x, y, z)`

function · L41–47

- called by: [`colliderBoxes`](#s-colliderBoxes) · [`resolveSeparation`](#s-resolveSeparation) ×3

<!-- note:applyPoint -->
<!-- /note -->

### <a id="s-DENSITY"></a>`DENSITY`

const · L49–53

<!-- note:DENSITY -->
---------- mass ----------

kg/m³ by material role, already scaled down: a robot is a shell over a frame,
not a solid billet, so a hollow factor is folded in below.
<!-- /note -->

### <a id="s-HOLLOW"></a>`HOLLOW`

const · L54–54

<!-- note:HOLLOW -->
<!-- /note -->

### <a id="s-computeMassModel"></a>`computeMassModel(root)`

function · **exported** · L56–70

- called by: [`buildRobot`](build.js.md#s-buildRobot) _js/robotgen/build.js_ · [`refreshMass`](drills.js.md#s-refreshMass) _js/robotgen/drills.js_

<!-- note:computeMassModel -->
<!-- /note -->

### <a id="s-centreOfMass"></a>`centreOfMass(model, frame)`

function · **exported** · L72–82

- calls: [`isUnder`](#s-isUnder) · [`originIn`](#s-originIn)
- called by: [`animateRobot`](build.js.md#s-animateRobot) _js/robotgen/build.js_ ×2 · [`buildRobot`](build.js.md#s-buildRobot) _js/robotgen/build.js_

<!-- note:centreOfMass -->
Centre of mass of everything under `frame`, expressed in `frame` space.
<!-- /note -->

### <a id="s-isUnder"></a>`isUnder(node, frame)`

function · L83–86

- called by: [`centreOfMass`](#s-centreOfMass)

<!-- note:isUnder -->
<!-- /note -->

### <a id="s-weightN"></a>`weightN(kg, gravity)`

function · **exported** · L88–88

<!-- note:weightN -->
Weight in newtons under a given gravity.
<!-- /note -->

### <a id="s-colliderBoxes"></a>`colliderBoxes(rig, frame)`

function · **exported** · L90–108

- calls: [`applyPoint`](#s-applyPoint) · [`matrixIn`](#s-matrixIn)

<!-- note:colliderBoxes -->
---------- collision boxes ----------

World-space AABBs for every registered collider, in `frame` space.
<!-- /note -->

### <a id="s-boxesOverlap"></a>`boxesOverlap(a, b, slack=)`

function · **exported** · L109–113

<!-- note:boxesOverlap -->
<!-- /note -->

### <a id="s-resolveSeparation"></a>`resolveSeparation(rig, dt, iterations=)`

function · **exported** · L115–173

- calls: [`applyPoint`](#s-applyPoint) ×3 · [`matrixIn`](#s-matrixIn) ×3
- called by: [`animateRobot`](build.js.md#s-animateRobot) _js/robotgen/build.js_ ×2

<!-- note:resolveSeparation -->
Push limbs out of the torso and out of each other. Arms abduct at the
shoulder; legs add splay at the hip. Both relax back when clear, so a robot
that is not colliding keeps the pose the animation asked for.

- L149 · `if (rig.legs.length === 2) {` — legs: keep left and right out of each other
<!-- /note -->

### <a id="s-EARTH_G"></a>`EARTH_G`

const · **exported** · L175–175

<!-- note:EARTH_G -->
---------- gravity ----------
<!-- /note -->

### <a id="s-gravityProfile"></a>`gravityProfile(gravity)`

function · **exported** · L176–188

- called by: [`animateRobot`](build.js.md#s-animateRobot) _js/robotgen/build.js_

<!-- note:gravityProfile -->
How the walk changes with the pull it is under. Step rate follows the
pendulum relation (√g), swing gets floatier as g drops, and the stance
crouches deeper as g rises because the legs carry more weight.

- L184 · `crouch: Math.max(0, Math.min(0.5, 0.3 * (r - 1) / (1 + 0.35 * Math.abs(r - 1)))),` — heavier pull, deeper stance. Below Earth there is nothing to brace against,
  so the crouch simply goes away rather than hyperextending the knee.
<!-- /note -->
