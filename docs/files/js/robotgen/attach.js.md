# js/robotgen/attach.js

[index](../../../README.md) · 626 lines · 22 symbols · 2 imports · 1 importers

## About

<!-- note:@file -->
robotgen/src/attach.js — bolt-on hardware. Kept separate from build.js so the
catalogue can grow without touching the frame builder. Everything here is
driven by spec.attachments, so it is deterministic per seed.
<!-- /note -->

## Imports

| line | from | names | target |
|---|---|---|---|
| 1 | `./parts.js` | `put`, `group` | [js/robotgen/parts.js](parts.js.md) |
| 2 | `./kit.js` | `EXTRA_MOUNTS`, `buildKit` | [js/robotgen/kit.js](kit.js.md) |

## Imported by

- [js/robotgen/build.js](build.js.md) — `buildAttachments`, `buildLimbEnd`, `applyFinish`

## Exports

- [`buildLimbEnd`](#s-buildLimbEnd) · function — used by [js/robotgen/build.js](build.js.md)
- [`applyFinish`](#s-applyFinish) · function — used by [js/robotgen/build.js](build.js.md)
- [`buildAttachments`](#s-buildAttachments) · function — used by [js/robotgen/build.js](build.js.md)

## Effects

_none detected_

## Symbols

### <a id="s-shoulderCannon"></a>`shoulderCannon(THREE, K, spec, rig, g, m, dims)`

function · L4–13

- calls: [`group`](parts.js.md#s-group) _js/robotgen/parts.js_ · [`put`](parts.js.md#s-put) _js/robotgen/parts.js_ ×5

<!-- note:shoulderCannon -->
---------- shoulder mounts ----------
<!-- /note -->

### <a id="s-missilePod"></a>`missilePod(THREE, K, spec, rig, g, m, dims)`

function · L14–25

- calls: [`group`](parts.js.md#s-group) _js/robotgen/parts.js_ · [`put`](parts.js.md#s-put) _js/robotgen/parts.js_ ×3

<!-- note:missilePod -->
<!-- /note -->

### <a id="s-beamProjector"></a>`beamProjector(THREE, K, spec, rig, g, m, dims)`

function · L26–34

- calls: [`group`](parts.js.md#s-group) _js/robotgen/parts.js_ · [`put`](parts.js.md#s-put) _js/robotgen/parts.js_ ×3

<!-- note:beamProjector -->
<!-- /note -->

### <a id="s-sensorMast"></a>`sensorMast(THREE, K, spec, rig, g, m, dims)`

function · L35–44

- calls: [`group`](parts.js.md#s-group) _js/robotgen/parts.js_ ×2 · [`put`](parts.js.md#s-put) _js/robotgen/parts.js_ ×4

<!-- note:sensorMast -->
<!-- /note -->

### <a id="s-smokeBank"></a>`smokeBank(THREE, K, spec, rig, g, m, dims)`

function · L45–53

- calls: [`group`](parts.js.md#s-group) _js/robotgen/parts.js_ · [`put`](parts.js.md#s-put) _js/robotgen/parts.js_ ×2

<!-- note:smokeBank -->
<!-- /note -->

### <a id="s-riotShield"></a>`riotShield(THREE, K, spec, rig, g, m, dims)`

function · L54–63

- calls: [`group`](parts.js.md#s-group) _js/robotgen/parts.js_ ×2 · [`put`](parts.js.md#s-put) _js/robotgen/parts.js_ ×4

<!-- note:riotShield -->
<!-- /note -->

### <a id="s-railgun"></a>`railgun(THREE, K, spec, rig, g, m, dims)`

function · L65–77

- calls: [`group`](parts.js.md#s-group) _js/robotgen/parts.js_ · [`put`](parts.js.md#s-put) _js/robotgen/parts.js_ ×5

<!-- note:railgun -->
<!-- /note -->

### <a id="s-droneBay"></a>`droneBay(THREE, K, spec, rig, g, m, dims)`

function · L78–92

- calls: [`group`](parts.js.md#s-group) _js/robotgen/parts.js_ ×3 · [`put`](parts.js.md#s-put) _js/robotgen/parts.js_ ×5

<!-- note:droneBay -->
<!-- /note -->

### <a id="s-winch"></a>`winch(THREE, K, spec, rig, g, m, dims)`

function · L93–100

- calls: [`put`](parts.js.md#s-put) _js/robotgen/parts.js_ ×4

<!-- note:winch -->
<!-- /note -->

### <a id="s-floodlight"></a>`floodlight(THREE, K, spec, rig, g, m, dims)`

function · L101–109

- calls: [`group`](parts.js.md#s-group) _js/robotgen/parts.js_ · [`put`](parts.js.md#s-put) _js/robotgen/parts.js_ ×3

<!-- note:floodlight -->
<!-- /note -->

### <a id="s-repairArm"></a>`repairArm(THREE, K, spec, rig, g, m, dims)`

function · L110–123

- calls: [`group`](parts.js.md#s-group) _js/robotgen/parts.js_ ×4 · [`put`](parts.js.md#s-put) _js/robotgen/parts.js_ ×5

<!-- note:repairArm -->
<!-- /note -->

### <a id="s-flareRack"></a>`flareRack(THREE, K, spec, rig, g, m, dims)`

function · L124–133

- calls: [`group`](parts.js.md#s-group) _js/robotgen/parts.js_ · [`put`](parts.js.md#s-put) _js/robotgen/parts.js_ ×3

<!-- note:flareRack -->
<!-- /note -->

### <a id="s-MOUNTS"></a>`MOUNTS`

const · L135–140

<!-- note:MOUNTS -->
<!-- /note -->

### <a id="s-panelMat"></a>`panelMat(K, spec, style)`

function · L142–152

- called by: [`addPanel`](#s-addPanel) ×2

<!-- note:panelMat -->
---------- additive armor panels ----------
<!-- /note -->

### <a id="s-addPanel"></a>`addPanel(THREE, K, spec, rig, parent, w, h, d, x, y, z, style, stripe, name, limb)`

function · L153–180

- calls: [`panelMat`](#s-panelMat) ×2 · [`group`](parts.js.md#s-group) _js/robotgen/parts.js_ · [`put`](parts.js.md#s-put) _js/robotgen/parts.js_ ×11
- called by: [`buildArmor`](#s-buildArmor) ×10

<!-- note:addPanel -->
- L155 · `if (limb && (style === 'fieldemitter' || style === 'reactive' || style === 'carapace')) st` — limb panels stay flush: projected fields would sweep the ground and stacked
  reactive bricks would hang past the foot
- L160 · `if (style === 'segmented') for (let i = 0; i < 3; i++)` — overlapping plates, kept inside the panel envelope: a segment that stands
  proud of the panel swings below the sole as soon as the limb pitches
- L163 · `if (style === 'reactive') for (let r = 0; r < 2; r++) for (let c = 0; c < 3; c++)` — scorched sacrificial layer — torso panels only: on a shin panel the extra
  slab hangs past the sole and the foot reads as sunk into the ground
<!-- /note -->

### <a id="s-buildArmor"></a>`buildArmor(THREE, K, spec, rig, ctx)`

function · L181–225

- calls: [`addPanel`](#s-addPanel) ×10
- called by: [`buildAttachments`](#s-buildAttachments)

<!-- note:buildArmor -->
- L196 · `const wide = Math.min(L * 0.42, leg.radius * 1.7);` — a limb plate hugs the limb. Wider than the sole and a splayed leg puts
  the plate's outer corner below the foot, which the analytic ground
  solve measures at the sole — the robot then reads as sunk into the floor.
  ...and it stays inside the limb's swept envelope: standing proud in +z
  dips the plate below the sole as soon as the segment pitches forward
  panel thickness is drawn off the TORSO, which on a limb produces a slab
  thicker than the limb it is bolted to — cap it against the limb itself
<!-- /note -->

### <a id="s-buildWeaponMods"></a>`buildWeaponMods(THREE, K, spec, rig)`

function · L227–309

- calls: [`group`](parts.js.md#s-group) _js/robotgen/parts.js_ ×2 · [`put`](parts.js.md#s-put) _js/robotgen/parts.js_ ×33
- called by: [`buildAttachments`](#s-buildAttachments)

<!-- note:buildWeaponMods -->
---------- weapon attachments ----------

- L231 · `const s = gun.scale, node = gun.node, fwd = -gun.length;` — barrels run down -y from the mount
- L255 · `const baseLen = s * 3.5, y0 = -s * 0.24;` — short stub at rest so it never spears the floor; stretched when aiming
<!-- /note -->

### <a id="s-buildLimbEnd"></a>`buildLimbEnd(THREE, K, spec, rig, wrist, th, type, side)`

function · **exported** · L311–434

- calls: [`group`](parts.js.md#s-group) _js/robotgen/parts.js_ ×8 · [`put`](parts.js.md#s-put) _js/robotgen/parts.js_ ×68
- called by: [`buildArm`](build.js.md#s-buildArm) _js/robotgen/build.js_

<!-- note:buildLimbEnd -->
---------- limb replacements ----------
   Called by build.js instead of the stock hand when the spec asks for one.
<!-- /note -->

### <a id="s-buildBack"></a>`buildBack(THREE, K, spec, rig, ctx)`

function · L436–551

- calls: [`group`](parts.js.md#s-group) _js/robotgen/parts.js_ ×10 · [`put`](parts.js.md#s-put) _js/robotgen/parts.js_ ×51
- called by: [`buildAttachments`](#s-buildAttachments)

<!-- note:buildBack -->
---------- back mounts ----------
<!-- /note -->

### <a id="s-applyFinish"></a>`applyFinish(THREE, K, spec, rig, ctx)`

function · **exported** · L553–607

- calls: [`applyFinish>ring`](#s-applyFinish-ring) ×4 · [`group`](parts.js.md#s-group) _js/robotgen/parts.js_ · [`put`](parts.js.md#s-put) _js/robotgen/parts.js_ ×9
- called by: [`buildRobot`](build.js.md#s-buildRobot) _js/robotgen/build.js_

<!-- note:applyFinish -->
---------- finish ----------
   Surface treatment: glow seams in the joint gaps, panel lines, a unit insignia,
   scorch, and an iridescent sheen. Cheap geometry, most of the sci-fi read.
<!-- /note -->

#### <a id="s-applyFinish-ring"></a>`applyFinish>ring(node, r, th)`

function · L570–570

- calls: [`put`](parts.js.md#s-put) _js/robotgen/parts.js_
- called by: [`applyFinish`](#s-applyFinish) ×4

<!-- note:applyFinish>ring -->
<!-- /note -->

### <a id="s-buildAttachments"></a>`buildAttachments(THREE, K, spec, rig, ctx)`

function · **exported** · L609–626

- calls: [`buildArmor`](#s-buildArmor) · [`buildBack`](#s-buildBack) · [`buildWeaponMods`](#s-buildWeaponMods) · [`buildKit`](kit.js.md#s-buildKit) _js/robotgen/kit.js_ · [`group`](parts.js.md#s-group) _js/robotgen/parts.js_
- called by: [`buildRobot`](build.js.md#s-buildRobot) _js/robotgen/build.js_

<!-- note:buildAttachments -->
---------- entry point ----------
<!-- /note -->
