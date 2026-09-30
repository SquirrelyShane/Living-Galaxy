# js/robotgen/fly.js

[index](../../../README.md) · 251 lines · 8 symbols · 1 imports · 1 importers

## About

<!-- note:@file -->
robotgen/src/fly.js — flying chassis: multirotor scouts and small fixed-wing
scout planes. Same contract as the ground drives in build.js: return
{ node, drop } and register animatable parts on the rig.

The airframe sits on its gear when parked; altitude is an ANIMATION offset
(rig.flight), so a parked scout is still on the ground for framing, bounds
and physics, and only leaves it while the drive is running.
<!-- /note -->

## Imports

| line | from | names | target |
|---|---|---|---|
| 1 | `./parts.js` | `put`, `group` | [js/robotgen/parts.js](parts.js.md) |

## Imported by

- [js/robotgen/build.js](build.js.md) — `buildRotor`, `buildPlane`, `animateFlight`

## Exports

- [`buildRotor`](#s-buildRotor) · function — used by [js/robotgen/build.js](build.js.md)
- [`buildPlane`](#s-buildPlane) · function — used by [js/robotgen/build.js](build.js.md)
- [`animateFlight`](#s-animateFlight) · function — used by [js/robotgen/build.js](build.js.md)

## Effects

_none detected_

## Symbols

### <a id="s-TAU"></a>`TAU`

const · L3–3

<!-- note:TAU -->
<!-- /note -->

### <a id="s-collide"></a>`collide(rig, node, half, offset, name, groupName)`

function · L5–7

- called by: [`buildPlane`](#s-buildPlane) ×2 · [`buildRotor`](#s-buildRotor) · [`rotorAssembly`](#s-rotorAssembly)

<!-- note:collide -->
<!-- /note -->

### <a id="s-rotorAssembly"></a>`rotorAssembly(THREE, K, spec, rig, parent, r, name, dir, ducted, guard)`

function · L9–32

- calls: [`collide`](#s-collide) · [`group`](parts.js.md#s-group) _js/robotgen/parts.js_ ×2 · [`put`](parts.js.md#s-put) _js/robotgen/parts.js_ ×7
- called by: [`buildPlane`](#s-buildPlane) · [`buildRotor`](#s-buildRotor) ×2

<!-- note:rotorAssembly -->
---------- shared bits ----------

- L20 · `const disc = put(THREE, spin, K.cyl(r, r, r * 0.012, 18), K.mat('rotordisc', spec.palette.` — the disc you actually see once it is turning
<!-- /note -->

### <a id="s-navLight"></a>`navLight(THREE, K, rig, parent, x, y, z, color, name)`

function · L34–38

- calls: [`put`](parts.js.md#s-put) _js/robotgen/parts.js_
- called by: [`buildPlane`](#s-buildPlane) ×2 · [`buildRotor`](#s-buildRotor)

<!-- note:navLight -->
<!-- /note -->

### <a id="s-skidGear"></a>`skidGear(THREE, K, spec, rig, g, w, d, drop, kind)`

function · L40–62

- calls: [`group`](parts.js.md#s-group) _js/robotgen/parts.js_ · [`put`](parts.js.md#s-put) _js/robotgen/parts.js_ ×6
- called by: [`buildPlane`](#s-buildPlane) · [`buildRotor`](#s-buildRotor)

<!-- note:skidGear -->
- L57 · `for (const sx of [-1, 1]) {` — skid rails
<!-- /note -->

### <a id="s-buildRotor"></a>`buildRotor(THREE, K, spec, rig)`

function · **exported** · L64–98

- calls: [`collide`](#s-collide) · [`navLight`](#s-navLight) · [`rotorAssembly`](#s-rotorAssembly) ×2 · [`skidGear`](#s-skidGear) · [`group`](parts.js.md#s-group) _js/robotgen/parts.js_ ×6 · [`put`](parts.js.md#s-put) _js/robotgen/parts.js_ ×3
- called by: [`buildRobot`](build.js.md#s-buildRobot) _js/robotgen/build.js_

<!-- note:buildRotor -->
---------- multirotor ----------

- L69 · `const minSep = (r * 1.12) / Math.sin(Math.PI / L.rotors);` — discs must not overlap: for n rotors on a circle of radius R the gap between
  neighbours is 2R·sin(π/n), so R has to clear the disc radius by that factor
- L79 · `const len = Math.hypot(px, pz);` — boom out to the hub, raked up or down so the discs clear the body
- L93 · `const hy = spec.torso.height * 0.5;` — gear hangs off the underside of the pod; everything else is built around the
  pod centre, so the drive node can be dropped straight onto the torso origin
<!-- /note -->

### <a id="s-buildPlane"></a>`buildPlane(THREE, K, spec, rig)`

function · **exported** · L100–221

- calls: [`collide`](#s-collide) ×2 · [`navLight`](#s-navLight) ×2 · [`rotorAssembly`](#s-rotorAssembly) · [`skidGear`](#s-skidGear) · [`group`](parts.js.md#s-group) _js/robotgen/parts.js_ ×17 · [`put`](parts.js.md#s-put) _js/robotgen/parts.js_ ×30
- called by: [`buildRobot`](build.js.md#s-buildRobot) _js/robotgen/build.js_

<!-- note:buildPlane -->
---------- fixed wing ----------

- L105 · `const chord = Math.max(L.chord, w * 0.85);` — a wing has to read as a wing: too thin a chord and the model looks like a rod
- L106 · `const finH = Math.max(w * 0.55, half * 0.2);` — tail height, not half the span
- L109 · `put(THREE, g, K.cone(w * 0.42, d * 0.28, 10), skin, 0, 0, d * 0.62, Math.PI / 2, 0, 0, 'no` — nose and tail boom grow out of the fuselage the torso already made
- L113 · `const sweep = L.wing === 'swept' ? 0.42 : L.wing === 'delta' ? 0.75 : L.wing === 'canard'` — wing — one panel per side, swept or angled to taste
- L123 · `const ail = group(THREE, wing, 'aileron', sx * half * 0.74, 0, -sweep * half * 0.22 + chor` — aileron
- L137 · `if (L.tail === 'v') {` — tail group
- L167 · `const propZ = L.pusher ? -d * 0.78 : d * 0.78;` — propulsion
- L196 · `if (L.vtol) {` — VTOL lift rotors on the wing, so it can take off without a runway
- L206 · `if (L.sensorBall) {` — chin sensor ball — the thing a scout plane actually looks through
<!-- /note -->

### <a id="s-animateFlight"></a>`animateFlight(rig, t, dt, g, prof, L)`

function · **exported** · L223–251

- called by: [`animateRobot`](build.js.md#s-animateRobot) _js/robotgen/build.js_

<!-- note:animateFlight -->
---------- flight animation ----------
   Called from animateRobot for rotor and plane drives: spin the discs, ride the
   air, and deflect the surfaces the way the bank asks them to.
<!-- /note -->
