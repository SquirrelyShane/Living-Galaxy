# js/asteroidgen/tidal.js

[index](../../../README.md) · 424 lines · 35 symbols · 4 imports · 1 importers

## About

<!-- note:@file -->
Tidal disruption of large bodies (asteroids, planets) by a moving black hole — v1.8.

Nothing is put on a rail. The hole has its own velocity; bodies keep their own
trajectory and are only bent by (softened) gravity, so an encounter is a real
flyby / eccentric plunge in the hole's frame, carried along with the hole's motion.

Trajectory   gravity-only path of a body (world frame, moving hole).
aimFlyby()   relative velocity that gives a chosen periapsis (so a pass is guaranteed
             to dip inside the Roche radius without being aimed down the throat).
TidalBody    wraps a fractured mesh. Strain rises inside the (mass-scaled) Roche
             radius; pieces facing toward / away from the hole peel off first and
             leave with the body's own velocity plus its orbital co-rotation, so the
             tidal field itself pulls them into a stream: the near side falls deeper,
             the far side is flung wide. Every free piece is integrated here on the
             CPU (≤ 32 of them) and handed to the GPU as centre + orientation + heat +
             stretch. Close to the hole pieces spaghettify (stretch ∝ (Roche / r)²),
             heat, and inside the burn radius burn away into the disk; bound debris
             that grazes the inner disk loses energy there and eventually burns too.
             Pieces that escape, or settle on orbits that never reach the burn radius,
             survive — asteroid pieces re-form into new small asteroids.
             accretion() reports burned mass where it burned, for the disk rings.
collide()    free pieces vs. the unbroken remnant: bounce, knock or smash.
<!-- /note -->

## Imports

| line | from | names | target |
|---|---|---|---|
| 1 | `./rng.js` | `RNG`, `hashString`, `unitVec` | [js/asteroidgen/rng.js](rng.js.md) |
| 2 | `./kerr.js` | `isco`, `horizon` | [js/asteroidgen/kerr.js](kerr.js.md) |
| 3 | `./debris.js` | `WELL_PRESETS` | [js/asteroidgen/debris.js](debris.js.md) |
| 4 | `./fracture.js` | `fractureGeometry`, `createFractureUniforms`, `applyFracture`, `makeFractureDepthMaterial`, `FRACTURE_MAX` | [js/asteroidgen/fracture.js](fracture.js.md) |

## Imported by

- [js/render/holefx.js](../render/holefx.js.md) — `TidalBody`, `Trajectory`, `TIDAL`, `setTidalSpin`

## Exports

- [`TIDAL`](#s-TIDAL) · const — used by [js/render/holefx.js](../render/holefx.js.md)
- [`setTidalSpin`](#s-setTidalSpin) · function — used by [js/render/holefx.js](../render/holefx.js.md)
- [`rocheRadius`](#s-rocheRadius) · function — **no importer in scanned roots**
- [`gravity`](#s-gravity) · function — **no importer in scanned roots**
- [`periapsis`](#s-periapsis) · function — **no importer in scanned roots**
- [`aimFlyby`](#s-aimFlyby) · function — **no importer in scanned roots**
- [`Trajectory`](#s-Trajectory) · class — used by [js/render/holefx.js](../render/holefx.js.md)
- [`integrateQuat`](#s-integrateQuat) · function — **no importer in scanned roots**
- [`TidalBody`](#s-TidalBody) · class — used by [js/render/holefx.js](../render/holefx.js.md)
- [`cloudCapture`](#s-cloudCapture) · function — **no importer in scanned roots**

## Effects

_none detected_

## Symbols

### <a id="s-TIDAL"></a>`TIDAL`

const · **exported** · L6–19

<!-- note:TIDAL -->
- L7 · `breakupSeconds: 14,` — pieces shed per second at full strain = total / breakupSeconds
- L9 · `burnR: 0.75,` — × √M world units: pieces inside start burning away
- L10 · `captureR: 0.3,` — × √M: eaten outright
- L12 · `dragZone: 1.5,` — × √M: debris dipping into the inner disk is dragged along with the flow and drains inward
- L14 · `inflow: 0.3,` — radial drain of the disk flow as a share of circular speed
- L17 · `iscoScale: 1,` — v1.9 spin: the burn edge follows the prograde ISCO and capture follows the horizon (both 1 at a = 0)
<!-- /note -->

### <a id="s-setTidalSpin"></a>`setTidalSpin(a)`

function · **exported** · L21–24

- calls: [`horizon`](kerr.js.md#s-horizon) _js/asteroidgen/kerr.js_ · [`isco`](kerr.js.md#s-isco) _js/asteroidgen/kerr.js_
- called by: [`makeHoleFx`](../render/holefx.js.md#s-makeHoleFx) _js/render/holefx.js_

<!-- note:setTidalSpin -->
Match the gameplay radii to a Kerr hole of spin a (ISCO / 6M, horizon / 2M).
<!-- /note -->

### <a id="s-ss"></a>`ss(a, b, x)`

function · L26–29

- called by: [`TidalBody.integrate`](#s-TidalBody-integrate) · [`TidalBody.update`](#s-TidalBody-update)

<!-- note:ss -->
<!-- /note -->

### <a id="s-len3"></a>`len3(x, y, z)`

function · L30–30

- called by: [`TidalBody.collide`](#s-TidalBody-collide) · [`TidalBody.detachNext`](#s-TidalBody-detachNext) ×2 · [`TidalBody.integrate`](#s-TidalBody-integrate) ×2 · [`TidalBody.update`](#s-TidalBody-update) · [`Trajectory.distanceTo`](#s-Trajectory-distanceTo) · [`aimFlyby`](#s-aimFlyby) · [`integrateQuat`](#s-integrateQuat) · [`periapsis`](#s-periapsis)

<!-- note:len3 -->
<!-- /note -->

### <a id="s-rocheRadius"></a>`rocheRadius(density=, base=)`

function · **exported** · L32–34

<!-- note:rocheRadius -->
Roche radius (world units) for a rubble body of a given bulk density.
<!-- /note -->

### <a id="s-gravity"></a>`gravity(p, hole, gm, soft=)`

function · **exported** · L36–41

- called by: [`TidalBody.integrate`](#s-TidalBody-integrate) · [`Trajectory.update`](#s-Trajectory-update)

<!-- note:gravity -->
Softened point-mass acceleration toward the hole.
<!-- /note -->

### <a id="s-periapsis"></a>`periapsis(r, v, gm)`

function · **exported** · L43–50

- calls: [`len3`](#s-len3)
- called by: [`TidalBody.integrate`](#s-TidalBody-integrate) · [`aimFlyby`](#s-aimFlyby)

<!-- note:periapsis -->
Periapsis of a relative state (r, v) about gm. Infinity for a radial path that never closes.
<!-- /note -->

### <a id="s-aimFlyby"></a>`aimFlyby(rel, {…}=)`

function · **exported** · L52–70

- calls: [`aimFlyby>at`](#s-aimFlyby-at) ×2 · [`len3`](#s-len3) · [`periapsis`](#s-periapsis)

<!-- note:aimFlyby -->
Relative velocity (body − hole) at relative position rel that reaches periapsis rp.
speed = speedShare × escape speed at the start (< 1: bound, eccentric — it comes back).
Prograde about +Y (+x → +z), slightly inclined.

- L56 · `let tx = -er[2], tz = er[0];` — prograde tangent in the disk plane, tilted a little out of it
<!-- /note -->

#### <a id="s-aimFlyby-at"></a>`aimFlyby>at(vt)`

function · L59–62

- called by: [`aimFlyby`](#s-aimFlyby) ×2

<!-- note:aimFlyby>at -->
<!-- /note -->

### <a id="s-Trajectory"></a>`Trajectory`

class · **exported** · L72–99

- called by: [`makeHoleFx>addTidal`](../render/holefx.js.md#s-makeHoleFx-addTidal) _js/render/holefx.js_

<!-- note:Trajectory -->
Gravity-only path of a body; pos is mutable ({x,y,z}, e.g. Object3D.position).
<!-- /note -->

#### <a id="s-Trajectory-constructor"></a>`Trajectory.constructor(pos, vel)`

method · L73–77

<!-- note:Trajectory.constructor -->
<!-- /note -->

#### <a id="s-Trajectory-distanceTo"></a>`Trajectory.distanceTo(hole)`

method · L79–81

- calls: [`len3`](#s-len3)

<!-- note:Trajectory.distanceTo -->
<!-- /note -->

#### <a id="s-Trajectory-update"></a>`Trajectory.update(dt, hole, gm, absorbR=, holeVel=)`

method · L83–98

- calls: [`gravity`](#s-gravity)

<!-- note:Trajectory.update -->
hole: world position at the END of the step · holeVel: its velocity (sub-steps follow it)
<!-- /note -->

### <a id="s-quatMul"></a>`quatMul(a, b)`

function · L101–108

- called by: [`integrateQuat`](#s-integrateQuat)

<!-- note:quatMul -->
<!-- /note -->

### <a id="s-integrateQuat"></a>`integrateQuat(q, w, dt)`

function · **exported** · L109–116

- calls: [`len3`](#s-len3) · [`quatMul`](#s-quatMul)
- called by: [`TidalBody.integrate`](#s-TidalBody-integrate)

<!-- note:integrateQuat -->
q ← exp(ω·dt / 2) ⊗ q (world-frame angular velocity), renormalised.
<!-- /note -->

### <a id="s-TidalBody"></a>`TidalBody`

class · **exported** · L118–420

- called by: [`makeHoleFx>addTidal`](../render/holefx.js.md#s-makeHoleFx-addTidal) _js/render/holefx.js_

<!-- note:TidalBody -->
<!-- /note -->

#### <a id="s-TidalBody-constructor"></a>`TidalBody.constructor(mesh, opts=)`

method · L119–178

- calls: [`applyFracture`](fracture.js.md#s-applyFracture) _js/asteroidgen/fracture.js_ · [`createFractureUniforms`](fracture.js.md#s-createFractureUniforms) _js/asteroidgen/fracture.js_ · [`fractureGeometry`](fracture.js.md#s-fractureGeometry) _js/asteroidgen/fracture.js_ · [`makeFractureDepthMaterial`](fracture.js.md#s-makeFractureDepthMaterial) _js/asteroidgen/fracture.js_ · [`hashString`](rng.js.md#s-hashString) _js/asteroidgen/rng.js_ · [`new RNG`](rng.js.md#s-RNG) _js/asteroidgen/rng.js_ · [`unitVec`](rng.js.md#s-unitVec) _js/asteroidgen/rng.js_

<!-- note:TidalBody.constructor -->
@param {THREE.Mesh} mesh body mesh (unrotated, unscaled; its parents may translate)
@param {object} opts { chunks, seed, roche, rocheScale, mass, crust, mantle, canBreak(), keep, morph, reform, onDetach(info) }

- L123 · `this.rocheScale = opts.rocheScale ?? 0.62;` — light (M = 1) hole reaches this share of the base radius
- L130 · `this.keep = Math.max(0.05, Math.min(1, opts.keep ?? 1));` — share of chunks that can ever be torn off
- L149 · `state: 'attached',` — attached · free · burning · eaten · smashed
- L154 · `w: [ax[0] * spin, ax[1] * spin, ax[2] * spin],` — multi-axis tumble, kicked by hits
<!-- /note -->

#### <a id="s-TidalBody-setBHMass"></a>`TidalBody.setBHMass(m)`

method · L180–183

<!-- note:TidalBody.setBHMass -->
Grow (never shrink) the effective Roche radius with the hole's mass.
<!-- /note -->

#### <a id="s-TidalBody-get-total"></a>`TidalBody.get total()`

method · L185–187

<!-- note:TidalBody.get total -->
<!-- /note -->

#### <a id="s-TidalBody-get-survivors"></a>`TidalBody.get survivors()`

method · L188–190

<!-- note:TidalBody.get survivors -->
<!-- /note -->

#### <a id="s-TidalBody-get-escaped"></a>`TidalBody.get escaped()`

method · L191–193

<!-- note:TidalBody.get escaped -->
<!-- /note -->

#### <a id="s-TidalBody-get-burning"></a>`TidalBody.get burning()`

method · L194–196

<!-- note:TidalBody.get burning -->
<!-- /note -->

#### <a id="s-TidalBody-get-consumed"></a>`TidalBody.get consumed()`

method · L197–199

<!-- note:TidalBody.get consumed -->
<!-- /note -->

#### <a id="s-TidalBody-get-smashed"></a>`TidalBody.get smashed()`

method · L200–202

<!-- note:TidalBody.get smashed -->
<!-- /note -->

#### <a id="s-TidalBody-get-remnant"></a>`TidalBody.get remnant()`

method · L203–205

<!-- note:TidalBody.get remnant -->
True while the mesh still shows something (an unbroken core or pieces still out there).
<!-- /note -->

#### <a id="s-TidalBody-shedAll"></a>`TidalBody.shedAll()`

method · L207–210

<!-- note:TidalBody.shedAll -->
The body crossed the burn radius: everything left goes now.
<!-- /note -->

#### <a id="s-TidalBody-update"></a>`TidalBody.update(t, dt, hole, body)`

method · L212–244

- calls: [`len3`](#s-len3) · [`ss`](#s-ss)

<!-- note:TidalBody.update -->
@param {number} t   shader time · dt step
@param {{pos:number[], vel:number[], gm:number}} hole  world position / velocity of the hole
@param {{pos:number[], vel:number[]}} body  world position / velocity of the body mesh origin

- L236 · `if (D < TIDAL.burnR * TIDAL.iscoScale * sq * 0.9) this.shedAll();` — the core itself went through the burn zone
<!-- /note -->

#### <a id="s-TidalBody-detachNext"></a>`TidalBody.detachNext(t, hole, body, W, D)`

method · L246–283

- calls: [`len3`](#s-len3) ×2

<!-- note:TidalBody.detachNext -->
- L264 · `const rx = body.pos[0] - hole.pos[0], ry = body.pos[1] - hole.pos[1], rz = body.pos[2] - h` — body velocity + partial orbital co-rotation Ω × c (a rubble body is only loosely locked through the pass)
<!-- /note -->

#### <a id="s-TidalBody-integrate"></a>`TidalBody.integrate(t, dt, hole)`

method · L285–349

- calls: [`gravity`](#s-gravity) · [`integrateQuat`](#s-integrateQuat) · [`len3`](#s-len3) ×2 · [`periapsis`](#s-periapsis) · [`ss`](#s-ss)

<!-- note:TidalBody.integrate -->
- L304 · `const rxz = Math.max(0.05, Math.hypot(rx, rz));` — dipping into the inner disk: dragged along with the (draining) prograde flow — it never
  settles there, it spirals down to the burn radius
- L320 · `const tidal = (this.roche / Math.max(r, 0.05)) ** 2;` — spaghettification and compression heating grow with the tidal ratio and relax far out
- L338 · `if (this.morph && !ch.reformAt && t - ch.t0 > 6 && (orb.E > 0 || orb.rp > burnR * 1.8)) ch` — survivors: escaping, or on an orbit that never reaches the burn zone → re-form (asteroids)
- L339 · `if (r > TIDAL.escapeR * 4) ch.vis = Math.max(0, 1 - (r - TIDAL.escapeR * 4) / TIDAL.escape` — long gone
<!-- /note -->

#### <a id="s-TidalBody-eat"></a>`TidalBody.eat(ch, t, rel, rEat)`

method · L351–356

<!-- note:TidalBody.eat -->
<!-- /note -->

#### <a id="s-TidalBody-upload"></a>`TidalBody.upload(body)`

method · L358–367

<!-- note:TidalBody.upload -->
<!-- /note -->

#### <a id="s-TidalBody-collide"></a>`TidalBody.collide(t, bodyPos, radius, bodyVel=)`

method · L369–404

- calls: [`len3`](#s-len3)

<!-- note:TidalBody.collide -->
Free pieces vs. the unbroken remnant (sphere of `radius` at bodyPos moving at bodyVel).
Returns hits [{ chunk, point, normal, color, destroyed, speed, size }].

- L377 · `if (d > reach + 0.4) ch.armed = true;` — must have left the body once
- L382 · `if (vn >= 0) continue;` — already separating
- L395 · `const tv = [rv[0] - n[0] * vn, rv[1] - n[1] * vn, rv[2] - n[2] * vn];` — tangential scrape spins it up about an axis ⟂ normal and sliding direction
<!-- /note -->

#### <a id="s-TidalBody-accretion"></a>`TidalBody.accretion()`

method · L406–415

<!-- note:TidalBody.accretion -->
Mass burned into the disk per piece, at the disk radius where it burned.
<!-- /note -->

#### <a id="s-TidalBody-dispose"></a>`TidalBody.dispose()`

method · L417–419

<!-- note:TidalBody.dispose -->
<!-- /note -->

### <a id="s-cloudCapture"></a>`cloudCapture(age, seconds=)`

function · **exported** · L422–424

<!-- note:cloudCapture -->
Capture ramp for loose debris: the hole takes it within seconds of forming.
<!-- /note -->
