# js/npc/flight.js

[index](../../../README.md) · 203 lines · 31 symbols · 2 imports · 6 importers

## About

<!-- note:@file -->
LIVING GALAXY — how an NPC hull actually flies.

It used to not. A hull's position was a pure function of (seed, skyTime):
it burned 500 units out of the hangar mouth over 36 seconds, went
`visible:false` for the length of a warp lane, and reappeared 700 units
off the far port. That is why a supply ship popped up outside a station
and was gone again before you could turn toward it — it never went
anywhere. There was nothing in between to intercept.

Now there is. A hull carries real velocity and real thrust, and a leg
between two ports is flown: a burn out of the exit lane, a long cruise
across open space where anyone can come and meet it, and a braked
approach down the entry lane at the far end. It is on the board, and
shootable, for the whole crossing.

The cost of that is the old determinism — `poseAt` was pure, so two
clients in a room agreed about every hull without anyone being in charge.
They no longer can, so the host holds the sky (worldsync.js) and mirrors
take its word for where a hull is. That is the trade the feature needs:
you cannot intercept something whose position is a closed-form function
of the clock, because nothing you do to it can change where it will be.

---- the speed question -------------------------------------------------

A leg between two inner ports is 40,000 units. A leg between two worlds in
Sol is four MILLION. Flown at one speed, either the short hops take all day
or the long ones are over before you see them — and a hull that crosses
four million units under thrust alone spends ten minutes doing it, which
starves every port it was carrying for.

So a long leg is flown in three parts, the same way the player flies one:

  RUN-OUT    sublight, out of the lane and clear of the port. Real minutes
             at a speed you can match, right where the traffic is thickest.
             This is where a supply run is most easily taken.
  LANE       the drive lit. Fast — faster than you can chase — but NOT
             gone: the hull stays on the board the whole way, with its name
             and its light, because a contact you can see crossing the
             system is a contact you can warp ahead of and be waiting for.
  RUN-IN     the drive drops a long way short of the destination and the
             hull comes in sublight again, slow and heavy and committed.

A leg shorter than LANE_MIN_U never lights the drive at all.

Within a sublight part the speed is solved from a target crossing time. For
a trapezoidal profile (accelerate at `a`, hold `v`, brake at `a`) covering
distance `L` in time `T`:

    T = v/a + L/v          →     v² − aTv + aL = 0

and the smaller root is the one that spends most of the run at cruise
rather than most of it under thrust. If the discriminant is negative the
hull cannot cover L in T, and it flies bang-bang instead: accelerate to the
midpoint, brake from it, arriving as fast as it can.

- L6 · `const CROSS_PER_U = 1 / 620;` — seconds of crossing per unit of leg
- L9 · `export const RUN_OUT_U = 9000;` — sublight out of the port before the drive lights
- L10 · `export const RUN_IN_U = 16000;` — and the drive drops this far short of the destination
- L11 · `export const LANE_SPOOL_S = 8;` — seconds to light or shed the drive
- L12 · `const LANE_T_MIN = 15;` — the lane part of a leg takes this long at the least
- L13 · `const LANE_T_MAX = 75;` — and this long at the most
<!-- /note -->

## Imports

| line | from | names | target |
|---|---|---|---|
| 1 | `../ships/shipdb.js` | `shipById` | [js/ships/shipdb.js](../ships/shipdb.js.md) |
| 2 | `../flight/defence.js` | `POOL` | [js/flight/defence.js](../flight/defence.js.md) |

## Imported by

- [js/npc/combat.js](combat.js.md) — `armFlight`, `flyStep`, `faceAt`
- [js/npc/rogues.js](rogues.js.md) — `armFlight`, `hullPerf`, `flyStep`
- [js/npc/security.js](security.js.md) — `flyStep`, `armFlight`
- [js/npc/traffic.js](traffic.js.md) — `armFlight`, `flyStep`, `coastStep`, `legCruise`, `legTime`, `faceVelocity`, `placeAt`, `hullPerf`, `usesLane`, `laneProfile`, `RUN_OUT_U`, `RUN_IN_U`
- test/ground.test.mjs _(outside js/)_ — `armFlight`
- test/reactive.test.mjs _(outside js/)_ — `legCruise`, `legTime`, `usesLane`, `laneProfile`, `hullPerf`, `armFlight`, `flyStep`, `LANE_MIN_U`, `RUN_OUT_U`, `RUN_IN_U`

## Exports

- [`CROSS_MIN`](#s-CROSS_MIN) · const — **no importer in scanned roots**
- [`CROSS_MAX`](#s-CROSS_MAX) · const — **no importer in scanned roots**
- [`LANE_MIN_U`](#s-LANE_MIN_U) · const — used by test/reactive.test.mjs
- [`RUN_OUT_U`](#s-RUN_OUT_U) · const — used by [js/npc/traffic.js](traffic.js.md), test/reactive.test.mjs
- [`RUN_IN_U`](#s-RUN_IN_U) · const — used by [js/npc/traffic.js](traffic.js.md), test/reactive.test.mjs
- [`LANE_SPOOL_S`](#s-LANE_SPOOL_S) · const — **no importer in scanned roots**
- [`hullPerf`](#s-hullPerf) · function — used by [js/npc/rogues.js](rogues.js.md), [js/npc/traffic.js](traffic.js.md), test/reactive.test.mjs
- [`legCruise`](#s-legCruise) · function — used by [js/npc/traffic.js](traffic.js.md), test/reactive.test.mjs
- [`usesLane`](#s-usesLane) · function — used by [js/npc/traffic.js](traffic.js.md), test/reactive.test.mjs
- [`laneProfile`](#s-laneProfile) · function — used by [js/npc/traffic.js](traffic.js.md), test/reactive.test.mjs
- [`legTime`](#s-legTime) · function — used by [js/npc/traffic.js](traffic.js.md), test/reactive.test.mjs
- [`armFlight`](#s-armFlight) · function — used by [js/npc/combat.js](combat.js.md), [js/npc/rogues.js](rogues.js.md), [js/npc/security.js](security.js.md), [js/npc/traffic.js](traffic.js.md), test/ground.test.mjs, test/reactive.test.mjs
- [`flyStep`](#s-flyStep) · function — used by [js/npc/combat.js](combat.js.md), [js/npc/rogues.js](rogues.js.md), [js/npc/security.js](security.js.md), [js/npc/traffic.js](traffic.js.md), test/reactive.test.mjs
- [`coastStep`](#s-coastStep) · function — used by [js/npc/traffic.js](traffic.js.md)
- [`faceVelocity`](#s-faceVelocity) · function — used by [js/npc/traffic.js](traffic.js.md)
- [`faceAt`](#s-faceAt) · function — used by [js/npc/combat.js](combat.js.md)
- [`placeAt`](#s-placeAt) · function — used by [js/npc/traffic.js](traffic.js.md)
- [`matchStep`](#s-matchStep) · function — **no importer in scanned roots**

## Effects

_none detected_

## Symbols

### <a id="s-CROSS_MIN"></a>`CROSS_MIN`

const · **exported** · L4–4

<!-- note:CROSS_MIN -->
Sublight crossing-time band, seconds.
<!-- /note -->

### <a id="s-CROSS_MAX"></a>`CROSS_MAX`

const · **exported** · L5–5

<!-- note:CROSS_MAX -->
<!-- /note -->

### <a id="s-CROSS_PER_U"></a>`CROSS_PER_U`

const · L6–6

<!-- note:CROSS_PER_U -->
<!-- /note -->

### <a id="s-LANE_MIN_U"></a>`LANE_MIN_U`

const · **exported** · L8–8

<!-- note:LANE_MIN_U -->
The lane drive. A leg shorter than LANE_MIN_U is flown entirely sublight;
anything longer lights the drive for the middle of it, dropping back to
sublight RUN_IN_U short of the far end so the arrival is always something
you could have been waiting at.
<!-- /note -->

### <a id="s-RUN_OUT_U"></a>`RUN_OUT_U`

const · **exported** · L9–9

<!-- note:RUN_OUT_U -->
<!-- /note -->

### <a id="s-RUN_IN_U"></a>`RUN_IN_U`

const · **exported** · L10–10

<!-- note:RUN_IN_U -->
<!-- /note -->

### <a id="s-LANE_SPOOL_S"></a>`LANE_SPOOL_S`

const · **exported** · L11–11

<!-- note:LANE_SPOOL_S -->
<!-- /note -->

### <a id="s-LANE_T_MIN"></a>`LANE_T_MIN`

const · L12–12

<!-- note:LANE_T_MIN -->
<!-- /note -->

### <a id="s-LANE_T_MAX"></a>`LANE_T_MAX`

const · L13–13

<!-- note:LANE_T_MAX -->
<!-- /note -->

### <a id="s-LANE_PER_U"></a>`LANE_PER_U`

const · L14–14

<!-- note:LANE_PER_U -->
<!-- /note -->

### <a id="s-ACCEL"></a>`ACCEL`

const · L16–16

<!-- note:ACCEL -->
Thrust bands by hull role. u/s². A laden hauler is a barge; a picket is not.
<!-- /note -->

### <a id="s-TURN"></a>`TURN`

const · L17–17

<!-- note:TURN -->
<!-- /note -->

### <a id="s-TOUGH"></a>`TOUGH`

const · L19–28

<!-- note:TOUGH -->
Combat weight. Everything used to be hp 120 / shield 40 regardless of what
it was; a picket and a laden ore barge are not the same problem.

Toughness per role, at the REFERENCE frame — `hullPerf` scales these by the
hull actually being flown. Every role that exists has an entry: `supply`
and `rogue` were in ACCEL and TURN above but not here, so both fell through
to DEFAULT_TOUGH and a nest drone was quietly as tough as a generic hull.
That is the same shape as the gun bug fixed in 0.3.35 — a default catching
things nobody remembered to list.

- L27 · `rogue:    { hp: 90,  shield: 20,  radius: 5,  gun: { dmg: 3,  rate: 2.2, range: 1100, spee` — A nest drone is scrap welded round a gun: it dies easily and carries no
  screen worth the name. The wave is the threat, not the unit.
<!-- /note -->

### <a id="s-DEFAULT_TOUGH"></a>`DEFAULT_TOUGH`

const · L29–29

<!-- note:DEFAULT_TOUGH -->
<!-- /note -->

### <a id="s-REF_MASS"></a>`REF_MASS`

const · L31–31

<!-- note:REF_MASS -->
Flight and combat characteristics for a hull, off its role and its registry
entry. Mass moves thrust and toughness in opposite directions, which is the
whole reason a hauler is worth escorting and a picket is worth avoiding.

The reference frame the TOUGH table is written against: a 60 t hull with a
230 kW plant, which is the middle of the registry.
<!-- /note -->

### <a id="s-REF_KW"></a>`REF_KW`

const · L31–31

<!-- note:REF_KW -->
<!-- /note -->

### <a id="s-hullPerf"></a>`hullPerf(n)`

function · **exported** · L33–51

- calls: [`shipById`](../ships/shipdb.js.md#s-shipById) _js/ships/shipdb.js_
- called by: [`armFlight`](#s-armFlight) · [`makeDrone`](rogues.js.md#s-makeDrone) _js/npc/rogues.js_ · [`buildLegs`](traffic.js.md#s-buildLegs) _js/npc/traffic.js_ · [`buildPirateLegs`](traffic.js.md#s-buildPirateLegs) _js/npc/traffic.js_

<!-- note:hullPerf -->
- L37 · `const massK = Math.max(0.45, Math.min(1.6, 60 / Math.max(12, massT)));` — a 30 t courier and a 400 t barge should not share an acceleration
- L41 · `const bulk = (Math.max(4, massT) / REF_MASS) ** POOL.hullPow;` — HOW MUCH HULL THE FRAME IS WORTH.
  
  This was `clamp(massT / 60, 0.6, 2.4)` — linear, and clamped. Mass runs
  from 9 t to 7,500 t across the registry, and that curve SATURATES AT
  144 t: a D-tier barge at 260 t, an E at 700, an F at 2,200 and a G at
  7,500 all came out at exactly 624 hp and 139 shield. Four tiers,
  indistinguishable. The bottom was truncated too — a 12 t skiff and a 34 t
  courier were both 156.
  
  It is the same power curve the player's pools use now (POOL.hullPow in
  js/flight/defence.js), off the same exponent, so both sides of a fight are
  measured the same way. Spread across the registry: 4.0x before, and about
  8x after, against the player's 9.2x.
- L42 · `const plant = (Math.max(30, stats?.reactor ?? REF_KW) / REF_KW) ** POOL.shieldPow;` — and the screen comes off the plant, as the player's does
<!-- /note -->

### <a id="s-legCruise"></a>`legCruise(L, a)`

function · **exported** · L53–59

- called by: [`legTime`](#s-legTime) ×3 · [`enterLeg`](traffic.js.md#s-enterLeg) _js/npc/traffic.js_ · [`seatHull`](traffic.js.md#s-seatHull) _js/npc/traffic.js_

<!-- note:legCruise -->
Sublight cruise speed for a run of length `L` at thrust `a`: the trapezoid
that covers it in the target crossing time, or the fastest bang-bang
profile if that time is out of reach.

- L56 · `if (disc <= 0) return Math.sqrt(a * L);` — cannot be done in T: go as fast as the distance allows
- L58 · `return Math.max(40, Math.min(v, 2200));` — sublight has a ceiling; past it the drive is the answer
<!-- /note -->

### <a id="s-usesLane"></a>`usesLane(L)`

function · **exported** · L61–61

- called by: [`legTime`](#s-legTime) · [`enterLeg`](traffic.js.md#s-enterLeg) _js/npc/traffic.js_ · [`routePose`](traffic.js.md#s-routePose) _js/npc/traffic.js_ · [`seatHull`](traffic.js.md#s-seatHull) _js/npc/traffic.js_

<!-- note:usesLane -->
Does a leg of this length light the drive at all?
<!-- /note -->

### <a id="s-laneProfile"></a>`laneProfile(L)`

function · **exported** · L63–70

- called by: [`legTime`](#s-legTime) · [`enterLeg`](traffic.js.md#s-enterLeg) _js/npc/traffic.js_ · [`seatHull`](traffic.js.md#s-seatHull) _js/npc/traffic.js_

<!-- note:laneProfile -->
The drive's cruise speed and the distance it covers, for a leg of length
`L`. The lane part is whatever is left after the two sublight runs.

- L67 · `const flat = Math.max(1, T - LANE_SPOOL_S);` — spool and shed are ramps, so the flat part carries the rest
<!-- /note -->

### <a id="s-legTime"></a>`legTime(L, a)`

function · **exported** · L72–81

- calls: [`laneProfile`](#s-laneProfile) · [`legCruise`](#s-legCruise) ×3 · [`usesLane`](#s-usesLane)
- called by: [`buildLegs`](traffic.js.md#s-buildLegs) _js/npc/traffic.js_ · [`buildPirateLegs`](traffic.js.md#s-buildPirateLegs) _js/npc/traffic.js_ · [`enterLeg`](traffic.js.md#s-enterLeg) _js/npc/traffic.js_ · [`seatHull`](traffic.js.md#s-seatHull) _js/npc/traffic.js_

<!-- note:legTime -->
How long a leg of length `L` will take at thrust `a` — for the timetable.
<!-- /note -->

### <a id="s-armFlight"></a>`armFlight(n)`

function · **exported** · L83–103

- calls: [`hullPerf`](#s-hullPerf)
- called by: [`combatFly`](combat.js.md#s-combatFly) _js/npc/combat.js_ ×2 · [`flyStep`](#s-flyStep) · [`matchStep`](#s-matchStep) · [`flyRogue`](rogues.js.md#s-flyRogue) _js/npc/rogues.js_ · [`makeDrone`](rogues.js.md#s-makeDrone) _js/npc/rogues.js_ · [`flyGuard`](security.js.md#s-flyGuard) _js/npc/security.js_ · [`flyResponse`](security.js.md#s-flyResponse) _js/npc/security.js_ · [`seatHull`](traffic.js.md#s-seatHull) _js/npc/traffic.js_ · [`stepTraffic`](traffic.js.md#s-stepTraffic) _js/npc/traffic.js_

<!-- note:armFlight -->
Give a hull its flight state. Idempotent: re-arming keeps the velocity it had.
<!-- /note -->

### <a id="s-clamp"></a>`clamp(v, lo, hi)`

function · L105–105 · **never referenced**

<!-- note:clamp -->
<!-- /note -->

### <a id="s-flyStep"></a>`flyStep(n, dt, gx, gy, gz, opts=)`

function · **exported** · L107–155

- calls: [`armFlight`](#s-armFlight) · [`faceVelocity`](#s-faceVelocity)
- called by: [`combatFly`](combat.js.md#s-combatFly) _js/npc/combat.js_ ×4 · [`flyRogue`](rogues.js.md#s-flyRogue) _js/npc/rogues.js_ ×2 · [`flyGuard`](security.js.md#s-flyGuard) _js/npc/security.js_ · [`flyResponse`](security.js.md#s-flyResponse) _js/npc/security.js_ ×2 · [`stepHullOnce`](traffic.js.md#s-stepHullOnce) _js/npc/traffic.js_ ×9

<!-- note:flyStep -->
One step of powered flight toward a point.

  standoff   hold this far off the goal instead of reaching it
  match      { vx, vy, vz } the goal's own velocity, so a standoff is
             station-keeping rather than a stern chase
  evade      lateral weave amplitude as a fraction of thrust (a hull being
             shot at does not fly a straight line)
  top        override the cruise ceiling for this step

Returns the remaining distance to the standoff ring, so a caller can ask
"am I there yet" without measuring twice.

- L119 · `const brake = Math.sqrt(Math.max(0, 2 * accel * Math.abs(rem))) * 0.92;` — Desired speed along the line: the braking curve, so the hull arrives
  stopped instead of overshooting and yo-yoing. 0.92 keeps a little margin
  for the fact that thrust is also being spent on turning.
- L124 · `if (opts.evade) {` — Evasion: a lateral component that swings, so rounds led at the hull miss.
- L127 · `let px = -uz, py = 0, pz = ux;` — any two vectors perpendicular to the line of flight
- L137 · `let ex = wvx - n.vx, ey = wvy - n.vy, ez = wvz - n.vz;` — Thrust toward the desired velocity, acceleration-limited.
- L145 · `const sp = Math.hypot(n.vx, n.vy, n.vz);` — Never let numerical noise push a hull past its own ceiling.
<!-- /note -->

### <a id="s-coastStep"></a>`coastStep(n, dt)`

function · **exported** · L157–162

- called by: [`matchStep`](#s-matchStep) · [`stepHullOnce`](traffic.js.md#s-stepHullOnce) _js/npc/traffic.js_ · [`stepTraffic`](traffic.js.md#s-stepTraffic) _js/npc/traffic.js_ ×2

<!-- note:coastStep -->
Coast: no thrust, just momentum. The far field's cheap step.
<!-- /note -->

### <a id="s-TAU"></a>`TAU`

const · L164–164

<!-- note:TAU -->
<!-- /note -->

### <a id="s-angleTo"></a>`angleTo(from, to, maxStep)`

function · L165–170

- called by: [`faceVelocity`](#s-faceVelocity) ×2

<!-- note:angleTo -->
<!-- /note -->

### <a id="s-faceVelocity"></a>`faceVelocity(n, dt, dir=)`

function · **exported** · L172–182

- calls: [`angleTo`](#s-angleTo) ×2
- called by: [`faceAt`](#s-faceAt) · [`flyStep`](#s-flyStep)

<!-- note:faceVelocity -->
Slew the hull's nose toward where it is going (or toward `dir` if given).
<!-- /note -->

### <a id="s-faceAt"></a>`faceAt(n, dt, tx, ty, tz)`

function · **exported** · L184–186

- calls: [`faceVelocity`](#s-faceVelocity)
- called by: [`combatFly`](combat.js.md#s-combatFly) _js/npc/combat.js_

<!-- note:faceAt -->
Point the nose at a world position without changing course (guns track separately).
<!-- /note -->

### <a id="s-placeAt"></a>`placeAt(n, x, y, z, vx=, vy=, vz=)`

function · **exported** · L188–192

- called by: [`poseBay`](traffic.js.md#s-poseBay) _js/npc/traffic.js_ · [`seatHull`](traffic.js.md#s-seatHull) _js/npc/traffic.js_ ×2 · [`stepHullOnce`](traffic.js.md#s-stepHullOnce) _js/npc/traffic.js_

<!-- note:placeAt -->
Drop the hull onto a point with a given velocity — undock, or a mirror correction.
<!-- /note -->

### <a id="s-matchStep"></a>`matchStep(n, dt, vx, vy, vz)`

function · **exported** · L194–203

- calls: [`armFlight`](#s-armFlight) · [`coastStep`](#s-coastStep)

<!-- note:matchStep -->
Bleed velocity toward a target's, for holding formation without a goal point.
<!-- /note -->
