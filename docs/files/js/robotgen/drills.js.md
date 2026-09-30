# js/robotgen/drills.js

[index](../../../README.md) · 386 lines · 28 symbols · 2 imports · 0 importers

## About

<!-- note:@file -->
robotgen/src/drills.js — a training sequence: put a machine through its paces
so you can see the frame work. Movement, appendage range, attachment deploy,
weapon tracking and firing, then progressive damage — parts destroyed, parts
blown off and falling under the world's own gravity.

Pure transform maths on top of animateRobot, so the whole sequence runs in the
browser and headless in `node test/drills.js`.
<!-- /note -->

## Imports

| line | from | names | target |
|---|---|---|---|
| 1 | `./build.js` | `animateRobot` | [js/robotgen/build.js](build.js.md) |
| 2 | `./physics.js` | `computeMassModel`, `matrixIn`, `EARTH_G` | [js/robotgen/physics.js](physics.js.md) |

## Imported by

_nothing scanned imports this file — entry point, loaded by path, or dead_

## Exports

- [`DRILLS`](#s-DRILLS) · const — **no importer in scanned roots**
- [`DRILL_SECONDS`](#s-DRILL_SECONDS) · const — **no importer in scanned roots**
- [`destroyPart`](#s-destroyPart) · function — **no importer in scanned roots**
- [`detachPart`](#s-detachPart) · function — **no importer in scanned roots**
- [`createDrillRunner`](#s-createDrillRunner) · function — **no importer in scanned roots**
- [`aimAt`](#s-aimAt) · function — **no importer in scanned roots**
- [`stepDebris`](#s-stepDebris) · function — **no importer in scanned roots**

## Effects

- **bus.emit** — `‹rig› on fire` (createDrillRunner>update:201)

## Symbols

### <a id="s-DRILLS"></a>`DRILLS`

const · **exported** · L4–19

<!-- note:DRILLS -->
<!-- /note -->

### <a id="s-DRILL_SECONDS"></a>`DRILL_SECONDS`

const · **exported** · L20–20

<!-- note:DRILL_SECONDS -->
<!-- /note -->

### <a id="s-clamp"></a>`clamp(v, a, b)`

function · L22–22

- called by: [`aimAt`](#s-aimAt) ×5 · [`approach`](#s-approach) · [`createDrillRunner>update`](#s-createDrillRunner-update) ×2 · [`deploy`](#s-deploy) · [`reach`](#s-reach)

<!-- note:clamp -->
<!-- /note -->

### <a id="s-ease"></a>`ease(u)`

function · L23–23

- called by: [`createDrillRunner>update`](#s-createDrillRunner-update) · [`deploy`](#s-deploy) · [`wake`](#s-wake)

<!-- note:ease -->
<!-- /note -->

### <a id="s-wrapPi"></a>`wrapPi(a)`

function · L24–24

- called by: [`aimAt`](#s-aimAt) ×4

<!-- note:wrapPi -->
<!-- /note -->

### <a id="s-worldOf"></a>`worldOf(node, root)`

function · L26–29

- calls: [`matrixIn`](physics.js.md#s-matrixIn) _js/robotgen/physics.js_
- called by: [`addSparks`](#s-addSparks) · [`aimAt`](#s-aimAt) ×3 · [`destroyPart`](#s-destroyPart) · [`detachPart`](#s-detachPart)

<!-- note:worldOf -->
---------- damage ----------
<!-- /note -->

### <a id="s-destroyPart"></a>`destroyPart(rig, node, opts=)`

function · **exported** · L31–76

- calls: [`addSparks`](#s-addSparks) · [`destroyPart>dead`](#s-destroyPart-dead) ×11 · [`isUnder`](#s-isUnder) ×7 · [`worldOf`](#s-worldOf)
- called by: [`createDrillRunner>update`](#s-createDrillRunner-update) ×2

<!-- note:destroyPart -->
Knock a part out: its lights die and it stops tracking, aiming or spinning,
but the hull stays on the frame. Detach it separately if it should fall off.

- L42 · `for (const list of [rig.lamps, rig.beacons, rig.muzzles]) {` — anything emissive in there goes dark
- L58 · `dead(rig.rotors, x => x.node);` — flight and career kit stop working when the thing that carried them is gone:
  a shot-out rotor stops turning, a severed pod stops pulsing
<!-- /note -->

#### <a id="s-destroyPart-dead"></a>`destroyPart>dead(list, get)`

function · L34–41

- calls: [`isUnder`](#s-isUnder)
- called by: [`destroyPart`](#s-destroyPart) ×11

<!-- note:destroyPart>dead -->
<!-- /note -->

### <a id="s-detachPart"></a>`detachPart(rig, node, opts=)`

function · **exported** · L78–107

- calls: [`addSparks`](#s-addSparks) · [`isUnder`](#s-isUnder) · [`refreshMass`](#s-refreshMass) · [`worldOf`](#s-worldOf)
- called by: [`createDrillRunner>update`](#s-createDrillRunner-update) ×4

<!-- note:detachPart -->
Cut a subtree loose. It keeps its world pose, then falls under gravity.
<!-- /note -->

### <a id="s-isUnder"></a>`isUnder(node, frame)`

function · L109–112

- called by: [`destroyPart`](#s-destroyPart) ×7 · [`destroyPart>dead`](#s-destroyPart-dead) · [`detachPart`](#s-detachPart)

<!-- note:isUnder -->
<!-- /note -->

### <a id="s-refreshMass"></a>`refreshMass(rig)`

function · L113–116

- calls: [`computeMassModel`](physics.js.md#s-computeMassModel) _js/robotgen/physics.js_
- called by: [`createDrillRunner>reset`](#s-createDrillRunner-reset) · [`detachPart`](#s-detachPart)

<!-- note:refreshMass -->
- L114 · `rig.massModel = computeMassModel(rig.body);` — debris lives outside the frame, so the model drops the mass it lost
<!-- /note -->

### <a id="s-rand"></a>`rand(rig)`

function · L117–120

- called by: [`addSparks`](#s-addSparks) ×4

<!-- note:rand -->
<!-- /note -->

### <a id="s-addSparks"></a>`addSparks(rig, host, at)`

function · L121–135

- calls: [`rand`](#s-rand) ×4 · [`worldOf`](#s-worldOf)
- called by: [`destroyPart`](#s-destroyPart) · [`detachPart`](#s-detachPart)

<!-- note:addSparks -->
<!-- /note -->

### <a id="s-createDrillRunner"></a>`createDrillRunner(rig, opts=)`

function · **exported** · L137–234

- calls: [`findMount`](#s-findMount) · [`makeGroup`](#s-makeGroup)

<!-- note:createDrillRunner -->
---------- the runner ----------

- L145 · `rig.debris = rig.debris || makeGroup(rig, 'debris');` — a small pool of spark motes, parented to the root and reused
- L147 · `const flying = rig.rotors && rig.rotors.length > 0;` — what this frame has to lose. An airframe carries no shoulder mount and often
  no arm, so the drills take a rotor and a payload pod instead — the sequence
  is about watching THIS machine come apart, not a generic one.
<!-- /note -->

#### <a id="s-createDrillRunner-reset"></a>`createDrillRunner>reset()`

function · L155–163

- calls: [`refreshMass`](#s-refreshMass)
- called by: [`createDrillRunner>update`](#s-createDrillRunner-update) ×2

<!-- note:createDrillRunner>reset -->
- L157 · `rig.root.rotation.y = 0;` — the turn drill left it facing somewhere else
<!-- /note -->

#### <a id="s-createDrillRunner-update"></a>`createDrillRunner>update(t, dt)`

function · L165–231

- calls: [`animateRobot`](build.js.md#s-animateRobot) _js/robotgen/build.js_ · [`aimAt`](#s-aimAt) · [`clamp`](#s-clamp) ×2 · [`createDrillRunner>reset`](#s-createDrillRunner-reset) ×2 · [`deploy`](#s-deploy) · [`destroyPart`](#s-destroyPart) ×2 · [`detachPart`](#s-detachPart) ×4 · [`ease`](#s-ease) · [`fire`](#s-fire) · [`grip`](#s-grip) · [`reach`](#s-reach) · [`stepDebris`](#s-stepDebris) · [`stepSparks`](#s-stepSparks) · [`wake`](#s-wake)
- effects: bus.emit `‹rig›`

<!-- note:createDrillRunner>update -->
- L180 · `const anim = { moving: false, speed: 1, gravity, aim: false };` — what the base animation should be doing during this drill
- L189 · `if (d.id === 'wake') wake(rig, u);` — then the drill's own overrides, applied on top of the pose
- L206 · `if (d.id === 'mountloss' && u > 0.3 && picks.mount && !picks.mount.node.userData.destroyed` — two beats: the mount is knocked out (lights die, it stops tracking), then
  the wreck falls off the shoulder
- L214 · `if (d.id === 'limbloss' && u > 0.35 && !picks.arm && picks.rotor) {` — no arm to sever: an airframe loses a rotor and has to fly on what is left
<!-- /note -->

### <a id="s-makeGroup"></a>`makeGroup(rig, name)`

function · L236–243

- called by: [`createDrillRunner`](#s-createDrillRunner)

<!-- note:makeGroup -->
- L238 · `const G = rig.root.constructor;` — build a real node of the same class as the root, whatever THREE build made it
<!-- /note -->

### <a id="s-findMount"></a>`findMount(rig)`

function · L244–251

- called by: [`createDrillRunner`](#s-createDrillRunner)

<!-- note:findMount -->
<!-- /note -->

### <a id="s-wake"></a>`wake(rig, u)`

function · L253–258

- calls: [`ease`](#s-ease)
- called by: [`createDrillRunner>update`](#s-createDrillRunner-update)

<!-- note:wake -->
---------- drill bodies ----------
<!-- /note -->

### <a id="s-reach"></a>`reach(rig, u)`

function · L259–271

- calls: [`clamp`](#s-clamp)
- called by: [`createDrillRunner>update`](#s-createDrillRunner-update)

<!-- note:reach -->
- L260 · `const seg = u * 4;` — sweep every arm joint through its usable range, one axis at a time
<!-- /note -->

### <a id="s-grip"></a>`grip(rig, u, t)`

function · L272–277

- called by: [`createDrillRunner>update`](#s-createDrillRunner-update)

<!-- note:grip -->
<!-- /note -->

### <a id="s-deploy"></a>`deploy(rig, u, t)`

function · L278–288

- calls: [`clamp`](#s-clamp) · [`ease`](#s-ease)
- called by: [`createDrillRunner>update`](#s-createDrillRunner-update)

<!-- note:deploy -->
<!-- /note -->

### <a id="s-aimAt"></a>`aimAt(rig, target, dt)`

function · **exported** · L290–322

- calls: [`approach`](#s-approach) ×6 · [`clamp`](#s-clamp) ×5 · [`parentYaw`](#s-parentYaw) ×3 · [`worldOf`](#s-worldOf) ×3 · [`wrapPi`](#s-wrapPi) ×4
- called by: [`createDrillRunner>update`](#s-createDrillRunner-update)

<!-- note:aimAt -->
Point every turret, weapon arm and laser at a world-space target.
<!-- /note -->

### <a id="s-approach"></a>`approach(v, want, k)`

function · L323–323

- calls: [`clamp`](#s-clamp)
- called by: [`aimAt`](#s-aimAt) ×6

<!-- note:approach -->
<!-- /note -->

### <a id="s-parentYaw"></a>`parentYaw(node, root)`

function · L324–328

- calls: [`matrixIn`](physics.js.md#s-matrixIn) _js/robotgen/physics.js_
- called by: [`aimAt`](#s-aimAt) ×3

<!-- note:parentYaw -->
a node's yaw in root space, so a local rotation can be aimed at a world point
   even when the whole robot has turned around

- L327 · `return Math.atan2(m[2], m[10]);` — uniform scale cancels in the ratio
<!-- /note -->

### <a id="s-fire"></a>`fire(rig, u, t, dt)`

function · L330–347

- called by: [`createDrillRunner>update`](#s-createDrillRunner-update)

<!-- note:fire -->
- L331 · `const beat = (t * 4) % 1;` — 4 Hz burst: muzzles flash, weapons recoil, fields flare
- L344 · `if (wrapped) shots = 1;` — count the burst, not the frame it landed on
<!-- /note -->

### <a id="s-stepDebris"></a>`stepDebris(rig, dt, gravity)`

function · **exported** · L349–372

- called by: [`createDrillRunner>update`](#s-createDrillRunner-update)

<!-- note:stepDebris -->
---------- debris and sparks ----------

- L366 · `p.vel.y = -p.vel.y * 0.34;` — bounce
<!-- /note -->

### <a id="s-stepSparks"></a>`stepSparks(rig, dt, gravity)`

function · L373–386

- called by: [`createDrillRunner>update`](#s-createDrillRunner-update)

<!-- note:stepSparks -->
<!-- /note -->
