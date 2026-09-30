# js/flight/avoid.js

[index](../../../README.md) · 226 lines · 16 symbols · 5 imports · 4 importers

## About

<!-- note:@file -->
LIVING GALAXY — collision avoidance.

One solver, two customers. The autopilot flew straight lines at its target
and the flight assist trimmed drift, and neither of them ever looked at
what was in the way — so both would drive a hull into a rock or a station
at full throttle without so much as easing off.

The hard part of avoidance in this game is not the geometry, it is knowing
when NOT to act. Mining means flying at a rock on purpose. Docking means
flying at a station on purpose. A system that cannot tell those from a
collision is worse than none, because the player loses the ability to do
the two things the game is mostly about. So the exemption list below is
the load-bearing part of this file, not the maths.

## What the belt taught us

The first version treated every hazard the same, and a belt broke it three
separate ways at once:

  1. Inside a belt there is ALWAYS a rock in the cone. With one 22-second
     horizon and a 2.4-radii pad, a 26 u pebble claimed an 86 u exclusion
     sphere and the solver never returned null. The hull braked, and a
     stopped hull has no velocity, so the solver returned null, so it threw
     the throttle open, so it found the pebble again. That oscillation is
     the "stuck in the rocks" report. Rocks now get their own short horizon
     and a tight pad, and only a mountain is allowed to trigger a full brake.

  2. Once you are INSIDE an exclusion sphere the quadratic says tEnter = 0
     forever, which is a permanent level-3 alarm even while you are flying
     away from the thing. Parking near a moon or cutting a rock beside one
     deadlocked the autopilot outright. `approach()` now reports `inside`
     and `outward`, and leaving something is not a threat.

  3. The dodge was recomputed from scratch five times a second, so the
     lateral axis wandered and the hull crabbed sideways forever instead of
     going round. A dodge is now COMMITTED: the same threat keeps the same
     escape axis until it is cleared or the commit times out.

  threatTo(pos, vel, opts)   -> the thing you are about to hit, or null
  avoidAim(pos, vel, threat) -> a point to steer at instead
  avoidLevel(threat)         -> 0 nothing | 1 steer | 2 shed speed | 3 brake
<!-- /note -->

## Imports

| line | from | names | target |
|---|---|---|---|
| 1 | `../world/bodies.js` | `BODIES`, `bodyPosition`, `bodyVelocity`, `dist3` | [js/world/bodies.js](../world/bodies.js.md) |
| 2 | `../world/field.js` | `nearbyRocks` | [js/world/field.js](../world/field.js.md) |
| 3 | `../station/stations.js` | `stations` | [js/station/stations.js](../station/stations.js.md) |
| 4 | `../world/scale.js` | `remnantRadius` | [js/world/scale.js](../world/scale.js.md) |
| 5 | `../world/events/holes.js` | `holes`, `holeRadii` | [js/world/events/holes.js](../world/events/holes.js.md) |

## Imported by

- [js/flight/autopilot.js](autopilot.js.md) — `threatTo`, `avoidAim`, `avoidLevel`, `deliberate`, `surfaceOnly`, `clearAvoidCommit`, `avoidCommit`, `blind`, `AVOID`
- [js/sim/sim.js](../sim/sim.js.md) — `threatTo`, `avoidAim`, `avoidLevel`, `deliberate`, `surfaceOnly`, `AVOID`
- test/avoid.test.mjs _(outside js/)_ — `threatTo`, `avoidLevel`, `avoidAim`, `avoidCommit`, `clearAvoidCommit`, `blind`, `AVOID`
- test/nav.test.mjs _(outside js/)_ — `threatTo`, `avoidAim`, `avoidLevel`, `deliberate`, `AVOID`

## Exports

- [`AVOID`](#s-AVOID) · const — used by [js/flight/autopilot.js](autopilot.js.md), [js/sim/sim.js](../sim/sim.js.md), test/avoid.test.mjs, test/nav.test.mjs
- [`blind`](#s-blind) · const — used by [js/flight/autopilot.js](autopilot.js.md), test/avoid.test.mjs
- [`threatTo`](#s-threatTo) · function — used by [js/flight/autopilot.js](autopilot.js.md), [js/sim/sim.js](../sim/sim.js.md), test/avoid.test.mjs, test/nav.test.mjs
- [`clearAvoidCommit`](#s-clearAvoidCommit) · function — used by [js/flight/autopilot.js](autopilot.js.md), test/avoid.test.mjs
- [`avoidCommit`](#s-avoidCommit) · function — used by [js/flight/autopilot.js](autopilot.js.md), test/avoid.test.mjs
- [`avoidAim`](#s-avoidAim) · function — used by [js/flight/autopilot.js](autopilot.js.md), [js/sim/sim.js](../sim/sim.js.md), test/avoid.test.mjs, test/nav.test.mjs
- [`avoidLevel`](#s-avoidLevel) · function — used by [js/flight/autopilot.js](autopilot.js.md), [js/sim/sim.js](../sim/sim.js.md), test/avoid.test.mjs, test/nav.test.mjs
- [`surfaceOnly`](#s-surfaceOnly) · function — used by [js/flight/autopilot.js](autopilot.js.md), [js/sim/sim.js](../sim/sim.js.md)
- [`deliberate`](#s-deliberate) · function — used by [js/flight/autopilot.js](autopilot.js.md), [js/sim/sim.js](../sim/sim.js.md), test/nav.test.mjs

## Effects

_none detected_

## Symbols

### <a id="s-AVOID"></a>`AVOID`

const · **exported** · L7–26

<!-- note:AVOID -->
- L8 · `horizon: 22,` — seconds ahead we care about, for things that are not rocks
- L9 · `pad: 2.4,` — clear a hazard by this many of its radii
- L10 · `surfacePad: 1.15,` — …except the world your port is tethered to, while you dock
- L11 · `minPad: 60,` — and never by less than this, in world units
- L12 · `brakeAt: 6,` — seconds to impact at which steering alone is not enough
- L13 · `hardAt: 2.6,` — and at which we brake outright
- L14 · `rockSpan: 1,` — how many belt cells out to look for rocks
- L15 · `everyMs: 180,` — the solver runs at about 5 Hz, not per frame
- L17 · `rockHorizon: 5.5,` — Rocks are their own country. A belt is a place you fly THROUGH — treating
  gravel with the same margins as a moon is what deadlocked the hull.
- L17 · `rockHorizon: 5.5,` — seconds: a pebble you will pass in six seconds is not news
- L18 · `rockPad: 1.2,` — rocks are small and irregular; a fifth of a radius is plenty
- L19 · `rockMinPad: 34,` — plus a hull's width of slack
- L20 · `rockHardR: 130,` — a rock this big or bigger may order a full brake
- L21 · `rockHardAt: 1.15,` — …and only this close
- L23 · `commitS: 5.5,` — how long a chosen escape axis is held before re-solving
- L24 · `clearFactor: 1.25,` — aim this many exclusion radii clear of the hazard
- L25 · `leadFactor: 0.9,` — …and this far PAST it, so a dodge goes round, not beside
<!-- /note -->

### <a id="s-_p"></a>`_p`

const · L28–28

<!-- note:_p -->
<!-- /note -->

### <a id="s-_bv"></a>`_bv`

const · L29–29

<!-- note:_bv -->
<!-- /note -->

### <a id="s-_sv"></a>`_sv`

const · L30–30

<!-- note:_sv -->
<!-- /note -->

### <a id="s-_hr"></a>`_hr`

const · L31–31

<!-- note:_hr -->
<!-- /note -->

### <a id="s-approach"></a>`approach(px, py, pz, vx, vy, vz, cx, cy, cz, clear)`

function · L33–60

- called by: [`threatTo>consider`](#s-threatTo-consider)

<!-- note:approach -->
How this approach goes: when we come closest, how near that is, and — the
number that actually matters — when we cross into the sphere of radius
`clear` around it.

Time to closest approach is the obvious measure and the wrong one. A gas
giant can be thirteen thousand units across; by the time its *centre* is
twenty seconds away the hull is long since inside it. What you want to
know is when you enter the exclusion sphere, which for a big body is far
earlier and for a rock is much the same thing.

Being ALREADY inside is the case the first version got wrong. It reported
tEnter = 0, which reads as "impact now" and never stops reading that way,
so a hull parked beside a moon sat at full alarm forever. Inside, the only
question worth asking is whether we are on our way out.

- L45 · `const b = rx * vx + ry * vy + rz * vz;` — > 0 means the range is opening
- L49 · `const outward = b > 0;` — already inside the exclusion sphere. Flying outward is not a collision,
  it is the recovery — say so, or the solver deadlocks on its own alarm.
- L53 · `let tEnter = Infinity;` — |p + v t - c| = clear, smaller root. No real root means we never get
  inside it at all.
<!-- /note -->

### <a id="s-blind"></a>`blind`

const · **exported** · L62–62

<!-- note:blind -->
What are we about to hit?

`opts.exempt` is a Set of ids that are being approached deliberately — the
rock under the cutter, the station we filed a berth with, whatever the
player has locked. Those are never threats however close we get, which is
the difference between an avoidance system and an obstruction.

`blind` is the watchdog's escape hatch: a Map of id → sim time until which a
hazard is deliberately not looked at, because refusing to look at it is the
only way past. Nothing fills it on its own — the autopilot writes to it only
after it has MEASURED that it is stuck, and both customers read the same map
so the flight assist does not keep flinching at what the autopilot has
already decided to fly past.
<!-- /note -->

### <a id="s-threatTo"></a>`threatTo(pos, vel, {…}=)`

function · **exported** · L64–136

- calls: [`avoidLevel`](#s-avoidLevel) · [`threatTo>consider`](#s-threatTo-consider) ×4 · [`bodyPosition`](../world/bodies.js.md#s-bodyPosition) _js/world/bodies.js_ · [`bodyVelocity`](../world/bodies.js.md#s-bodyVelocity) _js/world/bodies.js_ · [`dist3`](../world/bodies.js.md#s-dist3) _js/world/bodies.js_ ×4 · [`holeRadii`](../world/events/holes.js.md#s-holeRadii) _js/world/events/holes.js_ · [`nearbyRocks`](../world/field.js.md#s-nearbyRocks) _js/world/field.js_ · [`remnantRadius`](../world/scale.js.md#s-remnantRadius) _js/world/scale.js_
- called by: [`refreshThreat`](autopilot.js.md#s-refreshThreat) _js/flight/autopilot.js_ · [`updateAvoidance`](../sim/sim.js.md#s-updateAvoidance) _js/sim/sim.js_

<!-- note:threatTo -->
- L66 · `const reach = speed * horizon;` — A stopped hull used to see nothing at all, which is the worst possible
  moment to go blind: a ship pressed nose-first against a rock by its own
  thrust has no velocity, so there was no approach to solve and nothing ever
  told it to back off. Standing still, the only question is what we are
  already touching.
- L101 · `for (const b of BODIES) {` — Worlds. You will not out-turn one, so they get a wide berth.
- L111 · `for (const h of holes) {` — Collapsed stars (js/world/events/holes.js). Treated as a world with its danger radius
  for a surface — nine Schwarzschild radii, which the pad then more than
  doubles — and never exempt: there is no docking with one. A transit moves,
  so its position is where it is now; the solver re-runs at 5 Hz.
- L117 · `for (const st of stations) {` — Ports. The one thing players actually complain about ramming.
- L118 · `if (!st || st.x === undefined) continue;` — stepStations writes x/y/z in place
- L124 · `if (includeRocks) {` — Rocks, but only when we are somewhere they exist — and on their own,
  much shorter, horizon. A belt you are flying through is not a wall.
<!-- /note -->

#### <a id="s-threatTo-consider"></a>`threatTo>consider(id, name, kind, cx, cy, cz, radius, hz, hv=)`

function · L69–99

- calls: [`approach`](#s-approach)
- called by: [`threatTo`](#s-threatTo) ×4

<!-- note:threatTo>consider -->
`hv` is the hazard's own velocity. Worlds and ports move — a tethered port and
its world sweep round together at tens to hundreds of u/s — and solving the
approach off the hull's WORLD velocity against a frozen position reported a
hull holding station on a port as "2.5 s from the moon" forever, braking it
dead on the lane. Everything is solved in the hazard's frame.

- L75 · `const clear = rock` — `surface`: a world the port you are docking at is tethered to. Its 2.4-radii
  pad swallows a port parked at 2.2–5.6 radii, so the solver braked and dodged
  the whole lane out from under the approach; for that world only the surface
  itself (plus a margin) is a hazard.
- L91 · `const squareness = 1 - Math.min(1, a.miss / clear);` — Urgency is how little time we have before we are inside it, weighted by
  how squarely we are lined up — a graze at three seconds matters less
  than a direct hit at eight. Being inside already outranks everything.
<!-- /note -->

### <a id="s-commit"></a>`commit`

const · L138–138

<!-- note:commit -->
---- the committed dodge --------------------------------------------------
Re-deriving the escape axis on every solve let it wander with the geometry,
and a wandering axis means the hull crabs around the hazard without ever
getting past it. Once a dodge is chosen it is held: same threat, same way
round, until it clears or the commit ages out.
<!-- /note -->

### <a id="s-clearAvoidCommit"></a>`clearAvoidCommit()`

function · **exported** · L140–143

- called by: [`beginUnstick`](autopilot.js.md#s-beginUnstick) _js/flight/autopilot.js_ · [`releaseControls`](autopilot.js.md#s-releaseControls) _js/flight/autopilot.js_

<!-- note:clearAvoidCommit -->
<!-- /note -->

### <a id="s-avoidCommit"></a>`avoidCommit()`

function · **exported** · L145–147

- called by: [`beginUnstick`](autopilot.js.md#s-beginUnstick) _js/flight/autopilot.js_

<!-- note:avoidCommit -->
For tests and the HUD: which way the current dodge is committed.
<!-- /note -->

### <a id="s-avoidAim"></a>`avoidAim(pos, vel, threat, out=, now=)`

function · **exported** · L149–195

- called by: [`apSteer`](autopilot.js.md#s-apSteer) _js/flight/autopilot.js_ · [`updateAvoidance`](../sim/sim.js.md#s-updateAvoidance) _js/sim/sim.js_

<!-- note:avoidAim -->
Where to steer instead. Pushes the aim off the hazard perpendicular to the
approach — the shortest way out of the way — and then a little way PAST
it, so the manoeuvre is "go around" rather than "stand off to one side".

If we are already inside the exclusion sphere the answer is different and
much simpler: straight out, the shortest way.

- L150 · `const vx = threat.rv?.x ?? vel.x, vy = threat.rv?.y ?? vel.y, vz = threat.rv?.z ?? vel.z;` — in the hazard's frame, the same frame threatTo solved it in
- L155 · `const ox = pos.x - threat.x, oy = pos.y - threat.y, oz = pos.z - threat.z;` — Inside it. Radially out is both the shortest way clear and the only
  direction that is guaranteed not to take us deeper.
- L167 · `const dot = lx * fx + ly * fy + lz * fz;` — keep it perpendicular to the CURRENT heading, or the aim slides into
  the hazard as the geometry turns under us
- L174 · `const tc = threat.tClosest ?? threat.t;` — The offset from the hazard's centre at closest approach: the direction
  we are already missing it by, and the cheapest dodge there is.
- L182 · `lx = -fz; ly = 0; lz = fx;` — Dead-on. Any perpendicular will do; pick one off the world's up axis
  so the dodge is predictable rather than random.
- L189 · `const need = threat.clear * AVOID.clearFactor;` — Aim one safety margin out to the side AND a lead ahead: the point we want
  is past the hazard's shoulder, not level with its middle.
<!-- /note -->

### <a id="s-avoidLevel"></a>`avoidLevel(threat)`

function · **exported** · L197–208

- called by: [`apSteer`](autopilot.js.md#s-apSteer) _js/flight/autopilot.js_ · [`threatTo`](#s-threatTo) · [`publishHud`](../sim/sim.js.md#s-publishHud) _js/sim/sim.js_ · [`updateAvoidance`](../sim/sim.js.md#s-updateAvoidance) _js/sim/sim.js_

<!-- note:avoidLevel -->
How hard to react: 0 nothing, 1 steer, 2 steer and shed speed, 3 brake.

A rock almost never earns a 3. Braking to a stop inside a belt is how the
hull got stuck: there is always another rock, and a stationary hull cannot
steer out of anything. Gravel gets steered around at speed; only a mountain
close aboard is worth stopping for.
<!-- /note -->

### <a id="s-surfaceOnly"></a>`surfaceOnly(sim)`

function · **exported** · L210–212

- called by: [`refreshThreat`](autopilot.js.md#s-refreshThreat) _js/flight/autopilot.js_ · [`updateAvoidance`](../sim/sim.js.md#s-updateAvoidance) _js/sim/sim.js_

<!-- note:surfaceOnly -->
The exemption set: everything we are approaching on purpose.

Getting this wrong in either direction is worse than having no avoidance at
all — too loose and it rams, too tight and the player can never mine or
dock again.

The worlds that only count by their surface right now (see `surface` in threatTo).
<!-- /note -->

### <a id="s-deliberate"></a>`deliberate(sim, mining)`

function · **exported** · L214–226

- called by: [`refreshThreat`](autopilot.js.md#s-refreshThreat) _js/flight/autopilot.js_ · [`updateAvoidance`](../sim/sim.js.md#s-updateAvoidance) _js/sim/sim.js_

<!-- note:deliberate -->
<!-- /note -->
