# js/world/scale.js

[index](../../../README.md) · 137 lines · 31 symbols · 0 imports · 9 importers

## About

<!-- note:@file -->
LIVING GALAXY — scale, mass, gravity and resource model.

One world unit = 10 metres. The ship is ~2.4 units (24 m) long.
Celestial radii and orbits are re-mapped through power curves so that
bigger things get *disproportionately* bigger: a gas giant does not just
out-mass a moon, it dwarfs it, and it dwarfs you absolutely.

- L9 · `export const ORBIT_K = 2600 * 2.2;` — real distances: another world is a voyage, not a hop
- L33 · `export const G_K = 0.0456 / WORLD_SCALE;` — bigger worlds, same felt gravity — the flight model is tuned to it
<!-- /note -->

## Imports

_none_

## Imported by

- [js/aria/senses.js](../aria/senses.js.md) — `wellRadius`
- [js/flight/avoid.js](../flight/avoid.js.md) — `remnantRadius`
- [js/render/engine.js](../render/engine.js.md) — `remnantRadius`
- [js/sim/sim.js](../sim/sim.js.md) — `remnantRadius`, `surfaceGravity`
- [js/world/bodies.js](bodies.js.md) — `PERIOD_K`, `bodyStats`, `scaleOrbit`, `scaleRadius`, `scanRange`, `sphereOfInfluence`, `surfaceGravity`, `massIndex`, `mu`, `wellRadius`, `SHATTERED_MU`
- [js/world/events/impactors.js](events/impactors.js.md) — `WORLD_SCALE`, `remnantRadius`
- test/nav.test.mjs _(outside js/)_ — `remnantRadius`
- test/sky.test.mjs _(outside js/)_ — `remnantRadius`, `wellRadius`, `SHATTERED_MU`
- test/spacing.test.mjs _(outside js/)_ — `scaleOrbit`, `PERIOD_K`

## Exports

- [`UNIT_M`](#s-UNIT_M) · const — **no importer in scanned roots**
- [`SHIP_LENGTH`](#s-SHIP_LENGTH) · const — **no importer in scanned roots**
- [`WORLD_SCALE`](#s-WORLD_SCALE) · const — used by [js/world/events/impactors.js](events/impactors.js.md)
- [`RADIUS_FLOOR`](#s-RADIUS_FLOOR) · const — **no importer in scanned roots**
- [`RADIUS_K`](#s-RADIUS_K) · const — **no importer in scanned roots**
- [`RADIUS_P`](#s-RADIUS_P) · const — **no importer in scanned roots**
- [`ORBIT_K`](#s-ORBIT_K) · const — **no importer in scanned roots**
- [`ORBIT_P`](#s-ORBIT_P) · const — **no importer in scanned roots**
- [`PERIOD_K`](#s-PERIOD_K) · const — used by [js/world/bodies.js](bodies.js.md), test/spacing.test.mjs
- [`scaleRadius`](#s-scaleRadius) · function — used by [js/world/bodies.js](bodies.js.md)
- [`scaleOrbit`](#s-scaleOrbit) · function — used by [js/world/bodies.js](bodies.js.md), test/spacing.test.mjs
- [`DENSITY`](#s-DENSITY) · const — **no importer in scanned roots**
- [`G_K`](#s-G_K) · const — **no importer in scanned roots**
- [`EARTH_R`](#s-EARTH_R) · const — **no importer in scanned roots**
- [`density`](#s-density) · function — **no importer in scanned roots**
- [`surfaceGravity`](#s-surfaceGravity) · function — used by [js/sim/sim.js](../sim/sim.js.md), [js/world/bodies.js](bodies.js.md)
- [`mu`](#s-mu) · function — used by [js/world/bodies.js](bodies.js.md)
- [`massIndex`](#s-massIndex) · function — used by [js/world/bodies.js](bodies.js.md)
- [`escapeVelocity`](#s-escapeVelocity) · function — **no importer in scanned roots**
- [`orbitalVelocity`](#s-orbitalVelocity) · function — **no importer in scanned roots**
- [`remnantRadius`](#s-remnantRadius) · function — used by [js/flight/avoid.js](../flight/avoid.js.md), [js/render/engine.js](../render/engine.js.md), [js/sim/sim.js](../sim/sim.js.md), [js/world/events/impactors.js](events/impactors.js.md), test/nav.test.mjs, test/sky.test.mjs
- [`wellRadius`](#s-wellRadius) · function — used by [js/aria/senses.js](../aria/senses.js.md), [js/world/bodies.js](bodies.js.md), test/sky.test.mjs
- [`SHATTERED_MU`](#s-SHATTERED_MU) · const — used by [js/world/bodies.js](bodies.js.md), test/sky.test.mjs
- [`sphereOfInfluence`](#s-sphereOfInfluence) · function — used by [js/world/bodies.js](bodies.js.md)
- [`TIERS`](#s-TIERS) · const — **no importer in scanned roots**
- [`richness`](#s-richness) · function — **no importer in scanned roots**
- [`tierOf`](#s-tierOf) · function — **no importer in scanned roots**
- [`bodyStats`](#s-bodyStats) · function — used by [js/world/bodies.js](bodies.js.md)
- [`scanRange`](#s-scanRange) · function — used by [js/world/bodies.js](bodies.js.md)

## Effects

_none detected_

## Symbols

### <a id="s-UNIT_M"></a>`UNIT_M`

const · **exported** · L1–1

<!-- note:UNIT_M -->
<!-- /note -->

### <a id="s-SHIP_LENGTH"></a>`SHIP_LENGTH`

const · **exported** · L2–2

<!-- note:SHIP_LENGTH -->
The hull is a speck. That is the point — everything out there should
read as geology, not scenery. Keep in step with SHIP_LENGTH_U in shipdb.js
(tier B dims) and the engine.js comment.
<!-- /note -->

### <a id="s-WORLD_SCALE"></a>`WORLD_SCALE`

const · **exported** · L4–4

<!-- note:WORLD_SCALE -->
radius_new = RADIUS_FLOOR + RADIUS_K * radius_old ^ RADIUS_P
Super-linear, so the gap between a moon and a gas giant blows open, with a
floor so no "moon" ends up smaller than a city block.

One knob for how big the sky is. Worlds are geology, not props: the whole
radius curve and the impactors that hit it scale together, so severity
(rock ÷ world) is unchanged.
<!-- /note -->

### <a id="s-RADIUS_FLOOR"></a>`RADIUS_FLOOR`

const · **exported** · L5–5

<!-- note:RADIUS_FLOOR -->
<!-- /note -->

### <a id="s-RADIUS_K"></a>`RADIUS_K`

const · **exported** · L6–6

<!-- note:RADIUS_K -->
<!-- /note -->

### <a id="s-RADIUS_P"></a>`RADIUS_P`

const · **exported** · L7–7

<!-- note:RADIUS_P -->
<!-- /note -->

### <a id="s-ORBIT_K"></a>`ORBIT_K`

const · **exported** · L9–9

<!-- note:ORBIT_K -->
orbit_new = ORBIT_K * orbit_old ^ ORBIT_P  (real distances, real transit times)
<!-- /note -->

### <a id="s-ORBIT_P"></a>`ORBIT_P`

const · **exported** · L10–10

<!-- note:ORBIT_P -->
<!-- /note -->

### <a id="s-PERIOD_K"></a>`PERIOD_K`

const · **exported** · L12–12

<!-- note:PERIOD_K -->
Orbital periods stretch with the orbits. A world should not visibly cross
its own orbit while you watch — Earth takes about a day of play.
<!-- /note -->

### <a id="s-scaleRadius"></a>`scaleRadius(r)`

function · **exported** · L14–16

- called by: [`scaleBody`](bodies.js.md#s-scaleBody) _js/world/bodies.js_

<!-- note:scaleRadius -->
<!-- /note -->

### <a id="s-scaleOrbit"></a>`scaleOrbit(o)`

function · **exported** · L18–20

- called by: [`scaleBody`](bodies.js.md#s-scaleBody) _js/world/bodies.js_ ×2 · [`scaleSystem`](bodies.js.md#s-scaleSystem) _js/world/bodies.js_ ×5

<!-- note:scaleOrbit -->
<!-- /note -->

### <a id="s-DENSITY"></a>`DENSITY`

const · **exported** · L22–31

<!-- note:DENSITY -->
Bulk density relative to a rocky world. Gas giants are puffy.
<!-- /note -->

### <a id="s-G_K"></a>`G_K`

const · **exported** · L33–33

<!-- note:G_K -->
Tuned so an Earth-analog (r=229u) pulls 25 u/s^2 at the surface, against
a main-engine authority of ~88 u/s^2. Jupiter-class worlds pull ~59 and
demand a sustained full burn to climb out of.
<!-- /note -->

### <a id="s-EARTH_R"></a>`EARTH_R`

const · **exported** · L35–35

<!-- note:EARTH_R -->
Reference radius for "one Earth" in the stat readouts.
<!-- /note -->

### <a id="s-density"></a>`density(kind)`

function · **exported** · L37–39

- called by: [`massIndex`](#s-massIndex) · [`surfaceGravity`](#s-surfaceGravity)

<!-- note:density -->
<!-- /note -->

### <a id="s-surfaceGravity"></a>`surfaceGravity(b)`

function · **exported** · L41–43

- calls: [`density`](#s-density)
- called by: [`onImpact`](../sim/sim.js.md#s-onImpact) _js/sim/sim.js_ · [`refreshBody`](bodies.js.md#s-refreshBody) _js/world/bodies.js_ · [`scaleBody`](bodies.js.md#s-scaleBody) _js/world/bodies.js_ · [`bodyStats`](#s-bodyStats) · [`escapeVelocity`](#s-escapeVelocity) · [`mu`](#s-mu)

<!-- note:surfaceGravity -->
Surface gravity in u/s^2. Constant density => g scales with radius.
<!-- /note -->

### <a id="s-mu"></a>`mu(b)`

function · **exported** · L45–47

- calls: [`surfaceGravity`](#s-surfaceGravity)
- called by: [`refreshBody`](bodies.js.md#s-refreshBody) _js/world/bodies.js_ · [`scaleBody`](bodies.js.md#s-scaleBody) _js/world/bodies.js_ · [`orbitalVelocity`](#s-orbitalVelocity)

<!-- note:mu -->
Standard gravitational parameter mu = g_surf * R^2.
<!-- /note -->

### <a id="s-massIndex"></a>`massIndex(b)`

function · **exported** · L49–51

- calls: [`density`](#s-density)
- called by: [`refreshBody`](bodies.js.md#s-refreshBody) _js/world/bodies.js_ · [`scaleBody`](bodies.js.md#s-scaleBody) _js/world/bodies.js_ · [`bodyStats`](#s-bodyStats)

<!-- note:massIndex -->
Mass in Earth-analog units.
<!-- /note -->

### <a id="s-escapeVelocity"></a>`escapeVelocity(b)`

function · **exported** · L53–55

- calls: [`surfaceGravity`](#s-surfaceGravity)
- called by: [`bodyStats`](#s-bodyStats)

<!-- note:escapeVelocity -->
<!-- /note -->

### <a id="s-orbitalVelocity"></a>`orbitalVelocity(b, r)`

function · **exported** · L57–59

- calls: [`mu`](#s-mu)
- called by: [`bodyStats`](#s-bodyStats)

<!-- note:orbitalVelocity -->
<!-- /note -->

### <a id="s-remnantRadius"></a>`remnantRadius(b)`

function · **exported** · L61–63

- called by: [`threatTo`](../flight/avoid.js.md#s-threatTo) _js/flight/avoid.js_ · [`mountGame>buildPlanet`](../render/engine.js.md#s-mountGame-buildPlanet) _js/render/engine.js_ · [`wellEdge`](../sim/sim.js.md#s-wellEdge) _js/sim/sim.js_ · [`flyPlan`](events/impactors.js.md#s-flyPlan) _js/world/events/impactors.js_ · [`stepImpactors`](events/impactors.js.md#s-stepImpactors) _js/world/events/impactors.js_ · [`wellRadius`](#s-wellRadius)

<!-- note:remnantRadius -->
What is actually still there. A shattered world is a core in a cloud of its
own rubble, not a ball — the engine has always DRAWN it at 0.4 of its old
radius, and everything that measures the body should agree with what the
canopy shows. One definition, here, rather than 0.4 written out in four
files that can drift apart.
<!-- /note -->

### <a id="s-wellRadius"></a>`wellRadius(b)`

function · **exported** · L65–68

- calls: [`remnantRadius`](#s-remnantRadius)
- called by: [`senseSpace`](../aria/senses.js.md#s-senseSpace) _js/aria/senses.js_ ×2 · [`refreshBody`](bodies.js.md#s-refreshBody) _js/world/bodies.js_ · [`scaleBody`](bodies.js.md#s-scaleBody) _js/world/bodies.js_

<!-- note:wellRadius -->
Gravity well cutoff — beyond this the pull is negligible and skipped.

A world that has lost most of its mass has lost most of its reach with it.
`mu` is already cut for a shattered body (bodies.js), and the radius at
which a fixed acceleration is reached goes as the square root of mu, so the
well shrinks by that much again on top of the smaller remnant. A broken
planet stops holding the core a long way sooner than a whole one.

- L66 · `const base = remnantRadius(b) * (90 / WORLD_SCALE);` — wells did not grow with the WORLD_SCALE re-map — climbing out of one at
  sublight should take minutes, not a sitting
<!-- /note -->

### <a id="s-SHATTERED_MU"></a>`SHATTERED_MU`

const · **exported** · L70–70

<!-- note:SHATTERED_MU -->
What is left of a shattered world's gravitational parameter. bodies.js applies it.
<!-- /note -->

### <a id="s-sphereOfInfluence"></a>`sphereOfInfluence(orbit, m, M)`

function · **exported** · L72–75

- called by: [`refreshBody`](bodies.js.md#s-refreshBody) _js/world/bodies.js_ · [`scaleSystem`](bodies.js.md#s-scaleSystem) _js/world/bodies.js_ · [`spacePlanets`](bodies.js.md#s-spacePlanets) _js/world/bodies.js_

<!-- note:sphereOfInfluence -->
Patched-conic sphere of influence: r = a (m/M)^(2/5).
<!-- /note -->

### <a id="s-KIND_YIELD"></a>`KIND_YIELD`

const · L77–86

<!-- note:KIND_YIELD -->
---- resources ----------------------------------------------------------
<!-- /note -->

### <a id="s-DEPOSITS"></a>`DEPOSITS`

const · L88–97

<!-- note:DEPOSITS -->
<!-- /note -->

### <a id="s-TIERS"></a>`TIERS`

const · **exported** · L99–99

<!-- note:TIERS -->
<!-- /note -->

### <a id="s-richness"></a>`richness(b)`

function · **exported** · L101–103

- called by: [`bodyStats`](#s-bodyStats)

<!-- note:richness -->
Richness grows super-linearly with radius: bigger world, exponentially more.
<!-- /note -->

### <a id="s-tierOf"></a>`tierOf(rich)`

function · **exported** · L105–111

- called by: [`bodyStats`](#s-bodyStats)

<!-- note:tierOf -->
<!-- /note -->

### <a id="s-bodyStats"></a>`bodyStats(b)`

function · **exported** · L113–133

- calls: [`escapeVelocity`](#s-escapeVelocity) · [`massIndex`](#s-massIndex) · [`orbitalVelocity`](#s-orbitalVelocity) · [`richness`](#s-richness) · [`surfaceGravity`](#s-surfaceGravity) · [`tierOf`](#s-tierOf)
- called by: [`refreshBody`](bodies.js.md#s-refreshBody) _js/world/bodies.js_ · [`scaleBody`](bodies.js.md#s-scaleBody) _js/world/bodies.js_

<!-- note:bodyStats -->
Everything the survey log and cockpit want to know about a world.

- L130 · `yieldRate: 4 + rich * 9,` — ore units recoverable per mining cycle
<!-- /note -->

### <a id="s-scanRange"></a>`scanRange(b)`

function · **exported** · L135–137

- called by: [`refreshBody`](bodies.js.md#s-refreshBody) _js/world/bodies.js_ · [`scaleBody`](bodies.js.md#s-scaleBody) _js/world/bodies.js_ · [`scanRadius`](bodies.js.md#s-scanRadius) _js/world/bodies.js_

<!-- note:scanRange -->
Scan range has to grow with the body or you could never lock a giant.
<!-- /note -->
