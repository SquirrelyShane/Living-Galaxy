# js/robotgen/build.js

[index](../../../README.md) · 1065 lines · 21 symbols · 5 imports · 2 importers

## About

<!-- note:@file -->
robotgen/src/build.js — turns a spec (src/spec.js) into a THREE hierarchy.
THREE is injected, so this file runs against real three.js in the browser and
against the test stub in Node. No DOM access here (textures come in via opts).
<!-- /note -->

## Imports

| line | from | names | target |
|---|---|---|---|
| 1 | `./spec.js` | `LEGGED`, `FLYING` | [js/robotgen/spec.js](spec.js.md) |
| 2 | `./parts.js` | `makeKit`, `put`, `group` | [js/robotgen/parts.js](parts.js.md) |
| 3 | `./attach.js` | `buildAttachments`, `buildLimbEnd`, `applyFinish` | [js/robotgen/attach.js](attach.js.md) |
| 4 | `./fly.js` | `buildRotor`, `buildPlane`, `animateFlight` | [js/robotgen/fly.js](fly.js.md) |
| 5 | `./physics.js` | `computeMassModel`, `centreOfMass`, `resolveSeparation`, `gravityProfile`, `EARTH_G` | [js/robotgen/physics.js](physics.js.md) |
| 1062 | `./physics.js` | re-export `computeMassModel`, `centreOfMass`, `colliderBoxes`, `boxesOverlap`, `gravityProfile`, `weightN`, `EARTH_G` | [js/robotgen/physics.js](physics.js.md) |

## Imported by

- [js/drones/droneforge.js](../drones/droneforge.js.md) — `buildRobot`
- [js/robotgen/drills.js](drills.js.md) — `animateRobot`

## Exports

- [`trackPoint`](#s-trackPoint) · function — **no importer in scanned roots**
- [`placeTrackLinks`](#s-placeTrackLinks) · function — **no importer in scanned roots**
- [`measureNode`](#s-measureNode) · function — **no importer in scanned roots**
- [`buildRobot`](#s-buildRobot) · function — used by [js/drones/droneforge.js](../drones/droneforge.js.md)
- [`gaitAngles`](#s-gaitAngles) · function — **no importer in scanned roots**
- [`animateRobot`](#s-animateRobot) · function — used by [js/robotgen/drills.js](drills.js.md)
- `computeMassModel` · from `./physics.js` — **no importer in scanned roots**
- `centreOfMass` · from `./physics.js` — **no importer in scanned roots**
- `colliderBoxes` · from `./physics.js` — **no importer in scanned roots**
- `boxesOverlap` · from `./physics.js` — **no importer in scanned roots**
- `gravityProfile` · from `./physics.js` — **no importer in scanned roots**
- `weightN` · from `./physics.js` — **no importer in scanned roots**
- `EARTH_G` · from `./physics.js` — **no importer in scanned roots**
- [`BUILD_VERSION`](#s-BUILD_VERSION) · const — **no importer in scanned roots**
- [`D2R`](#s-D2R) — **no importer in scanned roots**

## Effects

_none detected_

## Symbols

### <a id="s-D2R"></a>`D2R`

const · **exported** · L7–7

<!-- note:D2R -->
<!-- /note -->

### <a id="s-collide"></a>`collide(rig, node, half, offset, name, group)`

function · L9–11

- called by: [`buildArm`](#s-buildArm) ×3 · [`buildLeg`](#s-buildLeg) ×3 · [`buildRobot`](#s-buildRobot) ×2 · [`buildTracks`](#s-buildTracks) · [`buildWheels`](#s-buildWheels)

<!-- note:collide -->
a coarse box per part: used to keep limbs out of each other, and exposed on
   the rig so a game can reuse the same volumes for hits and spacing
<!-- /note -->

### <a id="s-buildTorso"></a>`buildTorso(THREE, K, spec, rig, horizontal)`

function · L13–111

- calls: [`group`](parts.js.md#s-group) _js/robotgen/parts.js_ · [`put`](parts.js.md#s-put) _js/robotgen/parts.js_ ×43
- called by: [`buildRobot`](#s-buildRobot)

<!-- note:buildTorso -->
---------- torso ----------

- L23 · `shell = put(THREE, g, K.sph(w * 0.5, 14), K.base, 0, 0, 0, 0, 0, 0, 'torso_shell');` — an airframe pod: a capsule lying along the direction of travel
- L28 · `const cr = Math.min(w * 0.46, h * 0.45);` — caps sit inside the stated torso height, or a wide chassis hangs below the hips
- L47 · `if (T.sealed) {` — dust and pressure seals: gaskets over every torso seam
- L52 · `if (T.chestPlate) {` — chest plate
- L61 · `if (T.coreLamp) {` — core lamp
- L72 · `for (let i = 0; i < T.vents; i++) {` — vents + ribs
- L80 · `const bz = -d * 0.5;` — backpack
- L94 · `if (T.decal !== 'none') {` — decal
- L103 · `if (T.hipSkirt) {` — hip skirt
<!-- /note -->

### <a id="s-buildHead"></a>`buildHead(THREE, K, spec, rig)`

function · L113–276

- calls: [`group`](parts.js.md#s-group) _js/robotgen/parts.js_ ×9 · [`put`](parts.js.md#s-put) _js/robotgen/parts.js_ ×49
- called by: [`buildRobot`](#s-buildRobot)

<!-- note:buildHead -->
---------- head ----------

- L175 · `put(THREE, head, K.cyl(s * 0.5, s * 0.54, s * 0.22, 12), K.second, 0, s * 0.38, 0, 0, 0, 0` — gimbal ball: a sensor turret that rolls inside its yoke
- L181 · `const b = put(THREE, head, K.cyl(s * 0.22, s * 0.62, s * 0.5, 6), K.base, 0, 0, 0, 0, 0, 0` — low-profile faceted head — what a stealth airframe carries
- L185 · `} else {` — periscope
- L198 · `const O = H.optics, r = O.radius, lens = K.glow(O.color, 1.5);` — optics
- L229 · `const A = H.antenna, aLen = A.length;` — comm antenna
- L266 · `} else {` — ring
<!-- /note -->

### <a id="s-buildArm"></a>`buildArm(THREE, K, spec, rig, side, mountY, mountX, mountZ, lenScale=, limbOverride)`

function · L278–382

- calls: [`buildLimbEnd`](attach.js.md#s-buildLimbEnd) _js/robotgen/attach.js_ · [`collide`](#s-collide) ×3 · [`group`](parts.js.md#s-group) _js/robotgen/parts.js_ ×12 · [`put`](parts.js.md#s-put) _js/robotgen/parts.js_ ×24
- called by: [`buildRobot`](#s-buildRobot) ×3

<!-- note:buildArm -->
---------- arms ----------

- L304 · `wrist.rotation.y = (side.charAt(0) === 'L' ? 1 : -1) * 0.2;` — pronation: palms face the body, as on a humanoid arm at rest
- L306 · `elbow.rotation.x = -0.18;` — elbows sit slightly flexed, never locked
- L351 · `` const hp = group(THREE, wrist, `hp_hand_${side}`, 0, -th * 0.6, 0); `` — hardpoint for props / tools (figure-rig style socket)
- L363 · `if (A.weapon && A.weapon.side === side) {` — underslung weapon
<!-- /note -->

### <a id="s-buildLeg"></a>`buildLeg(THREE, K, spec, rig, name, x, z, yaw)`

function · L384–457

- calls: [`collide`](#s-collide) ×3 · [`group`](parts.js.md#s-group) _js/robotgen/parts.js_ ×6 · [`put`](parts.js.md#s-put) _js/robotgen/parts.js_ ×12
- called by: [`buildRobot`](#s-buildRobot) ×2

<!-- note:buildLeg -->
---------- legs ----------

- L395 · `if (L.splay && (L.type !== 'biped')) hip.rotation.z = (x < 0 ? -1 : 1) * L.splay;` — +rotation.z swings a hanging leg toward +x, so the LEFT hip needs a negative
  angle to splay outward. This was inverted and folded every walker's feet
  together under its belly.
- L430 · `const footDrop = L.footType === 'flat' ? footH * 1.25` — how far the lowest bit of the foot actually hangs below the ankle
- L436 · `const footHalf = L.footType === 'flat' ? th * 0.65 : L.footType === 'claw' ? th * 0.45` — a splayed leg tips the sole, so its outer corner is the real contact point
- L438 · `const footExtra = L.footType === 'pad' ? th * 0.75 : 0;` — round pads keep their radius under the ankle whatever the tilt
- L438 · `const footExtra = L.footType === 'pad' ? th * 0.75 : 0;` — a round sole keeps its radius under the ankle
- L439 · `const footLong = L.footType === 'flat' ? th * 1.25 : L.footType === 'claw' ? th * 0.6` — and a sole with LENGTH digs its heel or toe in as the ankle pitches — that
  term was missing, which is why a splayed foot could sink into the floor
- L448 · `plates: [],` — armour bolted to a limb hangs somewhere the sole is not; each plate records
  its own lowest corner so the ground solve can measure it too
<!-- /note -->

### <a id="s-trackPoint"></a>`trackPoint(loop, s)`

function · **exported** · L459–471

- called by: [`placeTrackLinks`](#s-placeTrackLinks)

<!-- note:trackPoint -->
---------- tracks / wheels / hover ----------

closed track path in the y/z plane: top run, front arc, bottom run, rear arc.
   s grows in the direction the belt travels when the unit drives forward.
<!-- /note -->

### <a id="s-placeTrackLinks"></a>`placeTrackLinks(loop, offset)`

function · **exported** · L472–479

- calls: [`trackPoint`](#s-trackPoint)
- called by: [`animateRobot`](#s-animateRobot) · [`buildTracks`](#s-buildTracks)

<!-- note:placeTrackLinks -->
<!-- /note -->

### <a id="s-buildTracks"></a>`buildTracks(THREE, K, spec, rig, opts)`

function · L481–523

- calls: [`collide`](#s-collide) · [`placeTrackLinks`](#s-placeTrackLinks) · [`group`](parts.js.md#s-group) _js/robotgen/parts.js_ ×2 · [`put`](parts.js.md#s-put) _js/robotgen/parts.js_ ×8
- called by: [`buildRobot`](#s-buildRobot)

<!-- note:buildTracks -->
- L500 · `const sf = put(THREE, t, K.cyl(r * 0.55, r * 0.55, w * 1.1, 8), K.second, 0, 0, unitLen *` — sprockets spin
- L510 · `const perimeter = 2 * unitLen + Math.PI * 2 * r;` — the belt itself: track links riding a closed stadium path, so the plates
  travel around the hull instead of the end sprockets spinning on their own
<!-- /note -->

### <a id="s-buildWheels"></a>`buildWheels(THREE, K, spec, rig)`

function · L525–559

- calls: [`collide`](#s-collide) · [`group`](parts.js.md#s-group) _js/robotgen/parts.js_ ×3 · [`put`](parts.js.md#s-put) _js/robotgen/parts.js_ ×9
- called by: [`buildRobot`](#s-buildRobot)

<!-- note:buildWheels -->
- L540 · `if (L.suspension === 'strut') put(THREE, mount, K.cyl(R * 0.16, R * 0.16, R * 0.9, 6), K.s` — suspension
<!-- /note -->

### <a id="s-buildHover"></a>`buildHover(THREE, K, spec, rig)`

function · L561–579

- calls: [`group`](parts.js.md#s-group) _js/robotgen/parts.js_ · [`put`](parts.js.md#s-put) _js/robotgen/parts.js_ ×6
- called by: [`buildRobot`](#s-buildRobot)

<!-- note:buildHover -->
<!-- /note -->

### <a id="s-composeM"></a>`composeM(p, r, sc)`

function · L581–595

- called by: [`measureNode>walk`](#s-measureNode-walk)

<!-- note:composeM -->
---------- measurement ----------
   Every geometry the kit makes records its half-extents, so the builder can
   measure what it just built without a THREE.Box3 and without the DOM — the
   same numbers in the browser and in the node stub. Used to sit a flyer on its
   lowest point, because on an airframe the tallest thing is a rotor, not the head.
<!-- /note -->

### <a id="s-mulM"></a>`mulM(a, b)`

function · L596–604

- called by: [`measureNode>walk`](#s-measureNode-walk)

<!-- note:mulM -->
<!-- /note -->

### <a id="s-measureNode"></a>`measureNode(node)`

function · **exported** · L605–630

- calls: [`measureNode>walk`](#s-measureNode-walk)
- called by: [`buildRobot`](#s-buildRobot)

<!-- note:measureNode -->
<!-- /note -->

#### <a id="s-measureNode-walk"></a>`measureNode>walk(o, m)`

function · L607–626

- calls: [`composeM`](#s-composeM) · [`measureNode>walk`](#s-measureNode-walk) · [`mulM`](#s-mulM)
- called by: [`measureNode`](#s-measureNode) · [`measureNode>walk`](#s-measureNode-walk)

<!-- note:measureNode>walk -->
<!-- /note -->

### <a id="s-buildRobot"></a>`buildRobot(THREE, spec, opts=)`

function · **exported** · L632–813

- calls: [`applyFinish`](attach.js.md#s-applyFinish) _js/robotgen/attach.js_ · [`buildAttachments`](attach.js.md#s-buildAttachments) _js/robotgen/attach.js_ · [`buildArm`](#s-buildArm) ×3 · [`buildHead`](#s-buildHead) · [`buildHover`](#s-buildHover) · [`buildLeg`](#s-buildLeg) ×2 · [`buildTorso`](#s-buildTorso) · [`buildTracks`](#s-buildTracks) · [`buildWheels`](#s-buildWheels) · [`collide`](#s-collide) ×2 · [`measureNode`](#s-measureNode) · [`buildPlane`](fly.js.md#s-buildPlane) _js/robotgen/fly.js_ · [`buildRotor`](fly.js.md#s-buildRotor) _js/robotgen/fly.js_ · [`group`](parts.js.md#s-group) _js/robotgen/parts.js_ ×3 · [`makeKit`](parts.js.md#s-makeKit) _js/robotgen/parts.js_ · [`put`](parts.js.md#s-put) _js/robotgen/parts.js_ ×3 · [`centreOfMass`](physics.js.md#s-centreOfMass) _js/robotgen/physics.js_ · [`computeMassModel`](physics.js.md#s-computeMassModel) _js/robotgen/physics.js_
- via [js/robotgen/spec.js](spec.js.md): `FLYING.has`, `LEGGED.has`
- called by: [`forgeDrone`](../drones/droneforge.js.md#s-forgeDrone) _js/drones/droneforge.js_

<!-- note:buildRobot -->
---------- assembly ----------

- L639 · `hovering: [], rams: [], fields: [], destroyed: [], debrisPieces: [], sparkPool: [], sparkS` — damage model + deployables
- L640 · `rotors: [], tilts: [], surfaces: [], wings: [], navLights: [], beams: [], pulses: [],` — flight + career kit
- L654 · `let drop = 0;` — drive + torso height
- L656 · `const PHASES = {` — gait phases: biped alternates, quadruped trots on diagonals,
  hexapod uses the alternating tripod, tripod steps in thirds
- L664 · `const hipY = 0;` — legs hang from torso bottom
- L690 · `rec.kneeSign = (L.type !== 'biped' && z > 0.001) ? -1 : 1;` — front limbs of a walker bend the other way — elbow, not knee
- L708 · `const seat = FLYING.has(L.type) ? d.drop` — a flyer parks on its gear: the drive node already sits at the gear height,
  so the pod goes straight on top of it and altitude is animation only
- L715 · `d.node.position.y = d.drop;` — booms and wings ride with the pod
- L725 · `const head = buildHead(THREE, K, spec, rig);` — head + neck — the column always spans the gap, so the head can't float
- L743 · `if (spec.arms.count > 0) {` — arms
- L750 · `const clearance = torso.position.y + my;` — keep the hand off the floor: reach is capped by clearance under the mount
- L759 · `const roomy = clearance * 0.82 > spec.arms.length * lenScale + spec.arms.thickness * 7;` — a low mount on a wheeled or tracked chassis has no room for a blade or
  a drill, so that pair keeps stock hands rather than digging into the floor
- L770 · `buildAttachments(THREE, K, spec, rig, { torso, dims, head, body });` — bolt-on hardware: shoulder mounts, armor panels, weapon mods, back units
- L773 · `let scale, topY;` — normalise. A walker is normalised off its head-top, which is what the gait
       and framing suites were tuned against. An airframe is normalised off what it
       MEASURES, because the top of a flyer is a rotor disc or a fin, and the
       bottom is a belly pod as often as it is the gear.
- L794 · `const sparkG = group(THREE, root, 'sparks');` — a reusable pool of spark motes for the damage drills — parented to the root,
  hidden until something is hit, and outside the mass model on purpose
<!-- /note -->

### <a id="s-GAIT"></a>`GAIT`

const · L815–821

<!-- note:GAIT -->
---------- animation ----------

Gait model: hip is a sinusoid, knee gets a loading-response bump plus a big
   swing flexion, and the ankle is solved so the foot stays flat through stance
   and rolls off the toe. Body height is then solved from the legs each frame
   (lowest foot defines the ground) instead of a canned bob, which is what stops
   feet skating or sinking. Signs: +rotation.x swings a limb backwards, so hip
   flexion is negative and knee flexion is positive.
<!-- /note -->

### <a id="s-bump"></a>`bump(p, c, w)`

function · L822–822

- called by: [`gaitAngles`](#s-gaitAngles) ×3

<!-- note:bump -->
<!-- /note -->

### <a id="s-gaitAngles"></a>`gaitAngles(p, cfg)`

function · **exported** · L823–830

- calls: [`bump`](#s-bump) ×3
- called by: [`animateRobot`](#s-animateRobot) ×2

<!-- note:gaitAngles -->
- L826 · `const load = cfg.knee * 0.16 * bump(p, 0.13, 0.09);` — knee yields as weight arrives
- L827 · `const swing = cfg.knee * bump(p, 0.76, 0.12);` — and folds to clear the ground
<!-- /note -->

### <a id="s-animateRobot"></a>`animateRobot(rig, t, dt, opts=)`

function · **exported** · L832–1060

- calls: [`gaitAngles`](#s-gaitAngles) ×2 · [`placeTrackLinks`](#s-placeTrackLinks) · [`animateFlight`](fly.js.md#s-animateFlight) _js/robotgen/fly.js_ · [`centreOfMass`](physics.js.md#s-centreOfMass) _js/robotgen/physics.js_ ×2 · [`gravityProfile`](physics.js.md#s-gravityProfile) _js/robotgen/physics.js_ · [`resolveSeparation`](physics.js.md#s-resolveSeparation) _js/robotgen/physics.js_ ×2
- via [js/robotgen/spec.js](spec.js.md): `FLYING.has`, `LEGGED.has`
- called by: [`createDrillRunner>update`](drills.js.md#s-createDrillRunner-update) _js/robotgen/drills.js_

<!-- note:animateRobot -->
- L847 · `if (legged && rig.legs.length) {` — legs + ground solve
- L851 · `for (const leg of rig.legs) {` — 1. pose the legs
- L854 · `const a1 = -a.hip * g - leg.kneeSign * prof.crouch * 0.55 - rig.stance.z;` — gravity: deeper crouch the heavier the pull, floatier swing the lighter
  the crouch follows the limb's own bend direction, so a front limb that
  hinges the other way still shortens by the same amount
- L855 · `const a2 = leg.kneeSign * ((a.load + 0.05 + a.swing * prof.swing) * g + prof.crouch);` — only the swing fold is floatier in low gravity — the stance knee is
  carrying weight, so scaling it there would make the robot squat on the Moon
- L860 · `leg.hipBase = leg.splay0 + rig.stance.x;` — balance moves where the feet are PLANTED — tilting the torso alone can
  never bring the centre of mass over the feet, because the legs hang off it
- L865 · `rig.separation = resolveSeparation(rig, dt);` — 2. push limbs apart — this can add hip splay, so it runs before the
            ground solve rather than after it
- L867 · `if (rig.torso) {` — 3. solve body height from the legs as they finally sit. The torso lean is
            applied first, because tilting the body lifts one hip and drops the other.
- L884 · `for (let pi = 0; pi < leg.plates.length; pi++) {` — a limb plate can reach below the sole once the segment pitches; measure
  each plate's lowest corner and let the deepest thing define the ground
- L900 · `if (rig.massModel && stance > 0) {` — 4. balance: bring the measured centre of mass over the feet. An off-centre
            load — a shoulder cannon, a one-sided blade — widens the stance toward
            the load and tilts the body away from it, like carrying a heavy bag.
- L905 · `rig.comOffset = { x: dx, z: dz };` — reported whether or not we correct
- L911 · `lean.roll = -0.45 * rig.stance.x;` — the body tilts away from the load
- L931 · `if (FLYING.has(L.type)) animateFlight(rig, t, dt, g, prof, L);` — flight: rotors spin up, the airframe climbs off its gear and banks
- L933 · `if (L.type === 'hover' && rig.body) {` — hover float
- L939 · `let trackOmega = 0;` — tracks: the belt travels, the sprockets and road wheels follow it
- L941 · `const laps = dt * g * 0.28;` — loops per second at full speed
- L946 · `for (let i = 0; i < rig.arms.length; i++) {` — arms — a human arm swings opposite the leg on the same side and the elbow
       folds the hand FORWARD, so shoulder pitch and elbow flexion have opposite
       signs. Elbow flexion stays negative: it can never hinge backwards.
- L958 · `swing = gaitOf.hip * 0.62 * g;` — opposite the same-side leg
- L965 · `a.upper.rotation.z = -sgn * (0.12 + 0.03 * Math.sin(t * 0.7 + i));` — negative for the left arm, positive for the right: elbows out, not into the chest
- L965 · `a.upper.rotation.z = -sgn * (0.12 + 0.03 * Math.sin(t * 0.7 + i));` — shoulder.rotation.z is the solver's
- L969 · `for (let i = 0; i < rig.turrets.length && !opts.aim; i++) {` — shoulder mounts scan, laser sights flicker. While aiming, the idle scan is
       off — whoever is aiming owns those joints.
- L986 · `for (const w of rig.wheels) w.node.rotation.x += dt * g * 1.4 / Math.max(0.05, w.radius);` — wheels and other spinners
- L992 · `for (let i = 0; i < rig.hovering.length; i++) {` — bay drones bob, hydraulic rams strike, energy fields flicker
- L1007 · `for (const h of rig.hatches) {` — career kit: bay doors, emitters, work beams, screens, tool arms, trays
- L1029 · `for (const tray of rig.trays) {` — a service tray stays level however the body leans — that is the whole point of it
- L1036 · `if (rig.head && !opts.aim) {` — head scan, optics, antennas, beacons, plumes
<!-- /note -->

### <a id="s-BUILD_VERSION"></a>`BUILD_VERSION`

const · **exported** · L1064–1064

<!-- note:BUILD_VERSION -->
<!-- /note -->
