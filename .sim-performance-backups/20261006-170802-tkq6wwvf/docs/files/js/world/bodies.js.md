# js/world/bodies.js

[index](../../../README.md) · 522 lines · 43 symbols · 3 imports · 58 importers

## About

<!-- note:@file -->
- L466 · `const THERMAL_HALFLIFE = 700;` — seconds for an impact's heat to halve
<!-- /note -->

## Imports

| line | from | names | target |
|---|---|---|---|
| 1 | `./scale.js` | `PERIOD_K`, `bodyStats`, `scaleOrbit`, `scaleRadius`, `scanRange`, `sphereOfInfluence`, `surfaceGravity`, `massIndex`, `mu`, `wellRadius`, `SHATTERED_MU` | [js/world/scale.js](scale.js.md) |
| 14 | `./archetypes.js` | `archetypeById` | [js/world/archetypes.js](archetypes.js.md) |
| 15 | `../economy/materials.js` | `goodName` | [js/economy/materials.js](../economy/materials.js.md) |

## Imported by

- [js/aria/nav.js](../aria/nav.js.md) — `BODIES`, `bodyPosition`, `dist3`
- [js/aria/pilot.js](../aria/pilot.js.md) — `BODIES`, `dist3`
- [js/aria/senses.js](../aria/senses.js.md) — `BODIES`, `bodyPosition`, `currentSystem`, `dist3`
- [js/comms/comms.js](../comms/comms.js.md) — `BODIES`, `bodyTempK`
- [js/console/console.js](../console/console.js.md) — `currentSystem`
- [js/console/panels/nav.js](../console/panels/nav.js.md) — `BODIES`, `bodyById`, `bodyPosition`, `dist3`, `tempLabel`
- [js/console/panels/work.js](../console/panels/work.js.md) — `BODIES`
- [js/core/store.js](../core/store.js.md) — `BEACONS`, `PUBLIC_ROOM`, `surveyIds`
- [js/drones/npcdrones.js](../drones/npcdrones.js.md) — `currentSystem`
- [js/drones/ops.js](../drones/ops.js.md) — `BODIES`, `bodyPosition`, `currentSystem`
- [js/economy/contracts.js](../economy/contracts.js.md) — `BODIES`, `BEACONS`, `bodyPosition`, `beaconPosition`, `currentSystem`, `scanRadius`
- [js/flight/autopilot.js](../flight/autopilot.js.md) — `bodyPosition`, `currentSystem`, `dist3`
- [js/flight/avoid.js](../flight/avoid.js.md) — `BODIES`, `bodyPosition`, `bodyVelocity`, `dist3`
- [js/flight/probes.js](../flight/probes.js.md) — `BODIES`, `bodyPosition`, `currentSystem`, `dist3`
- [js/flight/ship.js](../flight/ship.js.md) — `BODIES`
- [js/flight/turrets.js](../flight/turrets.js.md) — `currentSystem`
- [js/main.js](../main.js.md) — `PUBLIC_ROOM`
- [js/mission/run.js](../mission/run.js.md) — `BODIES`, `bodyPosition`, `dist3`
- [js/npc/battles.js](../npc/battles.js.md) — `currentSystem`
- [js/npc/captain.js](../npc/captain.js.md) — `BODIES`, `bodyPosition`, `scanRadius`
- [js/npc/ground.js](../npc/ground.js.md) — `currentSystem`
- [js/npc/rogues.js](../npc/rogues.js.md) — `currentSystem`
- [js/npc/speech.js](../npc/speech.js.md) — `BODIES`
- [js/npc/traffic.js](../npc/traffic.js.md) — `currentSystem`, `hashHue`
- [js/render/attract.js](../render/attract.js.md) — `BODIES`, `bodyById`, `bodyPosition`, `currentSystem`
- [js/render/engine.js](../render/engine.js.md) — `BEACONS`, `BODIES`, `beaconPosition`, `bodyById`, `bodyPosition`, `currentSystem`, `dist3`, `scanRadius`, `starBody`
- [js/sim/sim.js](../sim/sim.js.md) — `BEACONS`, `BODIES`, `applySystem`, `beaconPosition`, `bodyById`, `bodyPosition`, `bodyVelocity`, `currentSystem`, `dist3`, `hashHue`, `refreshBody`, `scanRadius`, `heatBody`, `coolBodies`, `bodyTempK`, `starBody`, `surveyIds`
- [js/station/stations.js](../station/stations.js.md) — `bodyById`, `bodyPosition`, `bodyVelocity`
- [js/ui/hud.js](../ui/hud.js.md) — `PUBLIC_ROOM`, `bodyById`
- [js/ui/map.js](../ui/map.js.md) — `BEACONS`, `BODIES`, `beaconPosition`, `bodyById`, `bodyPosition`, `currentSystem`, `dist3`, `starBody`
- [js/ui/tutorial.js](../ui/tutorial.js.md) — `BODIES`, `bodyPosition`, `currentSystem`, `scanRadius`
- [js/world/debris.js](debris.js.md) — `BODIES`, `bodyById`, `bodyPosition`
- [js/world/events/atmoworks.js](events/atmoworks.js.md) — `BODIES`, `bodyById`, `bodyPosition`, `bodyTempK`, `bandFromK`, `dist3`
- [js/world/field.js](field.js.md) — `currentSystem`
- [js/world/generate.js](generate.js.md) — `PUBLIC_ROOM`, `SOL_BEACONS`, `SOL_BODIES`
- [js/world/hulks.js](hulks.js.md) — `BODIES`, `bodyById`, `bodyPosition`, `bodyVelocity`
- test/ariasense.test.mjs _(outside js/)_ — `BODIES`, `bodyPosition`, `dist3`
- test/autopilot.test.mjs _(outside js/)_ — `currentSystem`, `dist3`
- test/avoid.test.mjs _(outside js/)_ — `currentSystem`, `dist3`
- test/bay.test.mjs _(outside js/)_ — `currentSystem`
- test/board.test.mjs _(outside js/)_ — `currentSystem`
- test/chart.test.mjs _(outside js/)_ — `BODIES`, `bodyPosition`, `currentSystem`, `dist3`
- test/desk.test.mjs _(outside js/)_ — `BODIES`
- test/economy.test.mjs _(outside js/)_ — `currentSystem`
- test/ground.test.mjs _(outside js/)_ — `currentSystem`
- test/hulks.test.mjs _(outside js/)_ — `BODIES`, `bodyPosition`, `bodyVelocity`, `currentSystem`
- test/mission.test.mjs _(outside js/)_ — `currentSystem`, `dist3`
- test/nav.test.mjs _(outside js/)_ — `applySystem`, `BODIES`, `bodyById`, `bodyPosition`
- test/nose.test.mjs _(outside js/)_ — `BODIES`
- test/reactive.test.mjs _(outside js/)_ — `currentSystem`
- test/rogues.test.mjs _(outside js/)_ — `currentSystem`
- test/sites.test.mjs _(outside js/)_ — `currentSystem`
- test/sky.test.mjs _(outside js/)_ — `currentSystem`, `BODIES`, `refreshBody`
- test/solprime.test.mjs _(outside js/)_ — `BODIES`, `bodyPosition`, `PUBLIC_ROOM`
- test/spacing.test.mjs _(outside js/)_ — `scaleSystem`, `applySystem`, `bodyPosition`, `bodyVelocity`, `SOL_SYSTEM`, `SPACING`
- test/spacing.test.mjs _(outside js/)_ — `bodiesMod`
- test/systems.test.mjs _(outside js/)_ — `currentSystem`
- test/trade.test.mjs _(outside js/)_ — `currentSystem`

## Exports

- [`SOL_BODIES`](#s-SOL_BODIES) · const — used by [js/world/generate.js](generate.js.md)
- [`PUBLIC_ROOM`](#s-PUBLIC_ROOM) · const — used by [js/core/store.js](../core/store.js.md), [js/main.js](../main.js.md), [js/ui/hud.js](../ui/hud.js.md), [js/world/generate.js](generate.js.md), test/solprime.test.mjs
- [`SOL_BEACONS`](#s-SOL_BEACONS) · const — used by [js/world/generate.js](generate.js.md)
- [`SOL_SYSTEM`](#s-SOL_SYSTEM) · const — used by test/spacing.test.mjs
- [`SPACING`](#s-SPACING) · const — used by test/spacing.test.mjs
- [`scaleSystem`](#s-scaleSystem) · function — used by test/spacing.test.mjs
- [`BODIES`](#s-BODIES) · let — used by [js/aria/nav.js](../aria/nav.js.md), [js/aria/pilot.js](../aria/pilot.js.md), [js/aria/senses.js](../aria/senses.js.md), [js/comms/comms.js](../comms/comms.js.md), [js/console/panels/nav.js](../console/panels/nav.js.md), [js/console/panels/work.js](../console/panels/work.js.md), [js/drones/ops.js](../drones/ops.js.md), [js/economy/contracts.js](../economy/contracts.js.md), [js/flight/avoid.js](../flight/avoid.js.md), [js/flight/probes.js](../flight/probes.js.md), [js/flight/ship.js](../flight/ship.js.md), [js/mission/run.js](../mission/run.js.md), [js/npc/captain.js](../npc/captain.js.md), [js/npc/speech.js](../npc/speech.js.md), [js/render/attract.js](../render/attract.js.md), [js/render/engine.js](../render/engine.js.md), [js/sim/sim.js](../sim/sim.js.md), [js/ui/map.js](../ui/map.js.md), [js/ui/tutorial.js](../ui/tutorial.js.md), [js/world/debris.js](debris.js.md), [js/world/events/atmoworks.js](events/atmoworks.js.md), [js/world/hulks.js](hulks.js.md), test/ariasense.test.mjs, test/chart.test.mjs, test/desk.test.mjs, test/hulks.test.mjs, test/nav.test.mjs, test/nose.test.mjs, test/sky.test.mjs, test/solprime.test.mjs
- [`BEACONS`](#s-BEACONS) · let — used by [js/core/store.js](../core/store.js.md), [js/economy/contracts.js](../economy/contracts.js.md), [js/render/engine.js](../render/engine.js.md), [js/sim/sim.js](../sim/sim.js.md), [js/ui/map.js](../ui/map.js.md)
- [`currentSystem`](#s-currentSystem) · let — used by [js/aria/senses.js](../aria/senses.js.md), [js/console/console.js](../console/console.js.md), [js/drones/npcdrones.js](../drones/npcdrones.js.md), [js/drones/ops.js](../drones/ops.js.md), [js/economy/contracts.js](../economy/contracts.js.md), [js/flight/autopilot.js](../flight/autopilot.js.md), [js/flight/probes.js](../flight/probes.js.md), [js/flight/turrets.js](../flight/turrets.js.md), [js/npc/battles.js](../npc/battles.js.md), [js/npc/ground.js](../npc/ground.js.md), [js/npc/rogues.js](../npc/rogues.js.md), [js/npc/traffic.js](../npc/traffic.js.md), [js/render/attract.js](../render/attract.js.md), [js/render/engine.js](../render/engine.js.md), [js/sim/sim.js](../sim/sim.js.md), [js/ui/map.js](../ui/map.js.md), [js/ui/tutorial.js](../ui/tutorial.js.md), [js/world/field.js](field.js.md), test/autopilot.test.mjs, test/avoid.test.mjs, test/bay.test.mjs, test/board.test.mjs, test/chart.test.mjs, test/economy.test.mjs, test/ground.test.mjs, test/hulks.test.mjs, test/mission.test.mjs, test/reactive.test.mjs, test/rogues.test.mjs, test/sites.test.mjs, test/sky.test.mjs, test/systems.test.mjs, test/trade.test.mjs
- [`applySystem`](#s-applySystem) · function — used by [js/sim/sim.js](../sim/sim.js.md), test/nav.test.mjs, test/spacing.test.mjs
- [`surveyIds`](#s-surveyIds) · function — used by [js/core/store.js](../core/store.js.md), [js/sim/sim.js](../sim/sim.js.md)
- [`SHIP_COLORS`](#s-SHIP_COLORS) · const — **no importer in scanned roots**
- [`hashHue`](#s-hashHue) · function — used by [js/npc/traffic.js](../npc/traffic.js.md), [js/sim/sim.js](../sim/sim.js.md)
- [`bodyById`](#s-bodyById) · function — used by [js/console/panels/nav.js](../console/panels/nav.js.md), [js/render/attract.js](../render/attract.js.md), [js/render/engine.js](../render/engine.js.md), [js/sim/sim.js](../sim/sim.js.md), [js/station/stations.js](../station/stations.js.md), [js/ui/hud.js](../ui/hud.js.md), [js/ui/map.js](../ui/map.js.md), [js/world/debris.js](debris.js.md), [js/world/events/atmoworks.js](events/atmoworks.js.md), [js/world/hulks.js](hulks.js.md), test/nav.test.mjs
- [`orbitPosition`](#s-orbitPosition) · function — **no importer in scanned roots**
- [`bodyPosition`](#s-bodyPosition) · function — used by [js/aria/nav.js](../aria/nav.js.md), [js/aria/senses.js](../aria/senses.js.md), [js/console/panels/nav.js](../console/panels/nav.js.md), [js/drones/ops.js](../drones/ops.js.md), [js/economy/contracts.js](../economy/contracts.js.md), [js/flight/autopilot.js](../flight/autopilot.js.md), [js/flight/avoid.js](../flight/avoid.js.md), [js/flight/probes.js](../flight/probes.js.md), [js/mission/run.js](../mission/run.js.md), [js/npc/captain.js](../npc/captain.js.md), [js/render/attract.js](../render/attract.js.md), [js/render/engine.js](../render/engine.js.md), [js/sim/sim.js](../sim/sim.js.md), [js/station/stations.js](../station/stations.js.md), [js/ui/map.js](../ui/map.js.md), [js/ui/tutorial.js](../ui/tutorial.js.md), [js/world/debris.js](debris.js.md), [js/world/events/atmoworks.js](events/atmoworks.js.md), [js/world/hulks.js](hulks.js.md), test/ariasense.test.mjs, test/chart.test.mjs, test/hulks.test.mjs, test/nav.test.mjs, test/solprime.test.mjs, test/spacing.test.mjs
- [`bodyVelocity`](#s-bodyVelocity) · function — used by [js/flight/avoid.js](../flight/avoid.js.md), [js/sim/sim.js](../sim/sim.js.md), [js/station/stations.js](../station/stations.js.md), [js/world/hulks.js](hulks.js.md), test/hulks.test.mjs, test/spacing.test.mjs
- [`beaconPosition`](#s-beaconPosition) · function — used by [js/economy/contracts.js](../economy/contracts.js.md), [js/render/engine.js](../render/engine.js.md), [js/sim/sim.js](../sim/sim.js.md), [js/ui/map.js](../ui/map.js.md)
- [`dist3`](#s-dist3) · function — used by [js/aria/nav.js](../aria/nav.js.md), [js/aria/pilot.js](../aria/pilot.js.md), [js/aria/senses.js](../aria/senses.js.md), [js/console/panels/nav.js](../console/panels/nav.js.md), [js/flight/autopilot.js](../flight/autopilot.js.md), [js/flight/avoid.js](../flight/avoid.js.md), [js/flight/probes.js](../flight/probes.js.md), [js/mission/run.js](../mission/run.js.md), [js/render/engine.js](../render/engine.js.md), [js/sim/sim.js](../sim/sim.js.md), [js/ui/map.js](../ui/map.js.md), [js/world/events/atmoworks.js](events/atmoworks.js.md), test/ariasense.test.mjs, test/autopilot.test.mjs, test/avoid.test.mjs, test/chart.test.mjs, test/mission.test.mjs
- [`scanRadius`](#s-scanRadius) · function — used by [js/economy/contracts.js](../economy/contracts.js.md), [js/npc/captain.js](../npc/captain.js.md), [js/render/engine.js](../render/engine.js.md), [js/sim/sim.js](../sim/sim.js.md), [js/ui/tutorial.js](../ui/tutorial.js.md)
- [`TEMP_K`](#s-TEMP_K) · const — **no importer in scanned roots**
- [`heatBody`](#s-heatBody) · function — used by [js/sim/sim.js](../sim/sim.js.md)
- [`coolBodies`](#s-coolBodies) · function — used by [js/sim/sim.js](../sim/sim.js.md)
- [`bodyTempK`](#s-bodyTempK) · function — used by [js/comms/comms.js](../comms/comms.js.md), [js/sim/sim.js](../sim/sim.js.md), [js/world/events/atmoworks.js](events/atmoworks.js.md)
- [`bandFromK`](#s-bandFromK) · function — used by [js/world/events/atmoworks.js](events/atmoworks.js.md)
- [`tempLabel`](#s-tempLabel) · function — used by [js/console/panels/nav.js](../console/panels/nav.js.md)
- [`refreshBody`](#s-refreshBody) · function — used by [js/sim/sim.js](../sim/sim.js.md), test/sky.test.mjs
- [`starBody`](#s-starBody) · function — used by [js/render/engine.js](../render/engine.js.md), [js/sim/sim.js](../sim/sim.js.md), [js/ui/map.js](../ui/map.js.md)
- [`gravitySources`](#s-gravitySources) · function — **no importer in scanned roots**

## Effects

_none detected_

## Symbols

### <a id="s-SOL_BODIES"></a>`SOL_BODIES`

const · **exported** · L17–202

<!-- note:SOL_BODIES -->
<!-- /note -->

### <a id="s-PUBLIC_ROOM"></a>`PUBLIC_ROOM`

const · **exported** · L203–203

<!-- note:PUBLIC_ROOM -->
<!-- /note -->

### <a id="s-SOL_BEACONS"></a>`SOL_BEACONS`

const · **exported** · L204–211

<!-- note:SOL_BEACONS -->
<!-- /note -->

### <a id="s-SOL_SYSTEM"></a>`SOL_SYSTEM`

const · **exported** · L212–219

<!-- note:SOL_SYSTEM -->
<!-- /note -->

### <a id="s-scaledCache"></a>`scaledCache`

const · L221–221

<!-- note:scaledCache -->
---- scaling ------------------------------------------------------------
Authored catalogs above are in compact "design units". Everything the sim
and renderer touch is the SCALED system: worlds hundreds of times the
ship's length, orbits hundreds of thousands of units wide, orbital periods
stretched to match so nothing blurs past you.
<!-- /note -->

### <a id="s-SPACING"></a>`SPACING`

const · **exported** · L223–223

<!-- note:SPACING -->
0.3.60 — room between things. Reported: bodies and asteroids sit too close.
Measured over Sol and 40 generated skies on 0.3.59: one pair of neighbouring
planets in ten had less than half their spheres of influence between their
orbits (some crossed outright), belts ran through a giant's sphere (Sol's
main belt reached 67k into Jupiter's), and one moon in ten overlapped the
next — the SOI clamp parked several on the same orbit. Now:
  planetClear  a planet's closest approach (periapsis) clears the one inside
               it's farthest (apoapsis) by this many of their two SOIs summed
               (each SOI capped at soiCap of its orbit)
  moonGap      neighbouring moons clear by this many of their radii summed
  beltClear    a belt keeps this many SOIs off every planet's orbit, moving
               (not shrinking, where it fits) to the nearest clear lane
A body pushed outward keeps its orbital SPEED (its period grows with it), so
a port riding it moves as fast as it did.
<!-- /note -->

### <a id="s-roomOf"></a>`roomOf(p)`

function · L224–224

- called by: [`clearBelt`](#s-clearBelt) ×2 · [`spacePlanets`](#s-spacePlanets) ×2

<!-- note:roomOf -->
the room a planet claims: its SOI, but never more than soiCap of its orbit —
this sky's giants carry SOIs of a fifth to half their orbit, and spacing
against those ran away (a chain of giants pushed each other out tenfold)
<!-- /note -->

### <a id="s-scaleBody"></a>`scaleBody(b, parentScaled, prevMoon=)`

function · L226–263

- calls: [`archetypeById`](archetypes.js.md#s-archetypeById) _js/world/archetypes.js_ · [`applyArchStats`](#s-applyArchStats) · [`bodyStats`](scale.js.md#s-bodyStats) _js/world/scale.js_ · [`massIndex`](scale.js.md#s-massIndex) _js/world/scale.js_ · [`mu`](scale.js.md#s-mu) _js/world/scale.js_ · [`scaleOrbit`](scale.js.md#s-scaleOrbit) _js/world/scale.js_ ×2 · [`scaleRadius`](scale.js.md#s-scaleRadius) _js/world/scale.js_ · [`scanRange`](scale.js.md#s-scanRange) _js/world/scale.js_ · [`surfaceGravity`](scale.js.md#s-surfaceGravity) _js/world/scale.js_ · [`wellRadius`](scale.js.md#s-wellRadius) _js/world/scale.js_
- called by: [`scaleSystem`](#s-scaleSystem)

<!-- note:scaleBody -->
- L231 · `const lo = parentScaled.radius * 3.2 + radius * 2.4;` — A moon has to sit outside its world and inside its world's SOI, or it
  is not a moon at all.
- L234 · `if (prevMoon) {` — …and clear of the moon inside it (0.3.60): the clamp above used to park
  two or three on the same orbit
- L241 · `out.baseRadius = radius;` — Worlds keep a condition now. Something can take it away.
- L249 · `out.terraform = 0;` — persistent kelvin offset the atmo works have earned
- L251 · `out.arch = archetypeById(b.arch) ?? null;` — An archetype overrides the generic kind: it decides what the surface looks
  like, what it is called, and what comes out of it.
- L257 · `out.mass = massIndex(out) * (out.shattered ? SHATTERED_MU : 1);` — a body that is already rubble carries the mass of rubble
<!-- /note -->

### <a id="s-scaleSystem"></a>`scaleSystem(sys)`

function · **exported** · L265–314

- calls: [`clearBelt`](#s-clearBelt) ×2 · [`scaleBody`](#s-scaleBody) · [`spacePlanets`](#s-spacePlanets) ×2 · [`scaleOrbit`](scale.js.md#s-scaleOrbit) _js/world/scale.js_ ×5 · [`sphereOfInfluence`](scale.js.md#s-sphereOfInfluence) _js/world/scale.js_
- called by: [`BEACONS`](#s-BEACONS) · [`BODIES`](#s-BODIES) · [`applySystem`](#s-applySystem) · [`currentSystem`](#s-currentSystem)

<!-- note:scaleSystem -->
- L268 · `const scaledById = new Map();` — Star first, then planets (SOI against the star), then moons (SOI against
  their planet) — each level needs the one above it already sized.
- L276 · `const lastMoon = new Map();` — parent id → the moon placed inside the next one
- L279 · `if (b.parent && !spaced) { spacePlanets(bodies, scaledById.get(star?.id)); spaced = true;` — every planet is sized before the first moon: space the planets then,
  so a moon's clamp sees its world's final sphere
- L290 · `bodies.sort((a, z) => sys.bodies.findIndex((b) => b.id === a.id) - sys.bodies.findIndex((b` — keep the authored order so menus and maps read the same as before
<!-- /note -->

### <a id="s-spacePlanets"></a>`spacePlanets(bodies, star)`

function · L316–331

- calls: [`roomOf`](#s-roomOf) ×2 · [`sphereOfInfluence`](scale.js.md#s-sphereOfInfluence) _js/world/scale.js_
- called by: [`scaleSystem`](#s-scaleSystem) ×2

<!-- note:spacePlanets -->
0.3.60: push planets outward, innermost first, until each one's periapsis
clears the apoapsis of the one inside it by SPACING.planetClear of their
SOIs. A planet's SOI grows with its orbit, so each is settled in a few
passes before the next is looked at.

- L326 · `b.period *= f;` — same speed along a longer orbit
<!-- /note -->

### <a id="s-clearBelt"></a>`clearBelt(belt, planets, inside=)`

function · L333–363

- calls: [`clearBelt>clear`](#s-clearBelt-clear) · [`roomOf`](#s-roomOf) ×2
- called by: [`scaleSystem`](#s-scaleSystem) ×2

<!-- note:clearBelt -->
0.3.60: a belt keeps SPACING.beltClear SOIs off every planet's orbit. If it
crosses one, it moves to the clear lane nearest its middle — whole where the
lane is wide enough, filling the lane (never under 40% of its width) where
not. `inside` is a belt this one must stay outside of.

- L336 · `.map((p) => {` — a dwarf is a belt's own kind of body: it keeps its room about its mean
  orbit, not across the whole of an eccentric one
- L345 · `const lanes = [];` — the lanes between the zones
<!-- /note -->

#### <a id="s-clearBelt-clear"></a>`clearBelt>clear(lo, hi)`

function · L342–342

- called by: [`clearBelt`](#s-clearBelt)

<!-- note:clearBelt>clear -->
<!-- /note -->

### <a id="s-BODIES"></a>`BODIES`

const · **exported** · L365–365

- calls: [`scaleSystem`](#s-scaleSystem)

<!-- note:BODIES -->
<!-- /note -->

### <a id="s-BEACONS"></a>`BEACONS`

const · **exported** · L366–366

- calls: [`scaleSystem`](#s-scaleSystem)

<!-- note:BEACONS -->
<!-- /note -->

### <a id="s-currentSystem"></a>`currentSystem`

const · **exported** · L367–367

- calls: [`scaleSystem`](#s-scaleSystem)

<!-- note:currentSystem -->
<!-- /note -->

### <a id="s-applySystem"></a>`applySystem(sys)`

function · **exported** · L369–375

- calls: [`scaleSystem`](#s-scaleSystem)
- called by: [`loadSky`](../sim/sim.js.md#s-loadSky) _js/sim/sim.js_

<!-- note:applySystem -->
<!-- /note -->

### <a id="s-surveyIds"></a>`surveyIds()`

function · **exported** · L377–379

- called by: [`state`](../core/store.js.md#s-state) _js/core/store.js_ · [`launchSim`](../sim/sim.js.md#s-launchSim) _js/sim/sim.js_ · [`loadSky`](../sim/sim.js.md#s-loadSky) _js/sim/sim.js_ · [`persistProgress`](../sim/sim.js.md#s-persistProgress) _js/sim/sim.js_ · [`publishHud`](../sim/sim.js.md#s-publishHud) _js/sim/sim.js_

<!-- note:surveyIds -->
<!-- /note -->

### <a id="s-SHIP_COLORS"></a>`SHIP_COLORS`

const · **exported** · L381–381

<!-- note:SHIP_COLORS -->
<!-- /note -->

### <a id="s-hashHue"></a>`hashHue(s)`

function · **exported** · L383–387

- called by: [`buildRoster`](../npc/traffic.js.md#s-buildRoster) _js/npc/traffic.js_ · [`applyRemoteState`](../sim/sim.js.md#s-applyRemoteState) _js/sim/sim.js_ · [`launchSim`](../sim/sim.js.md#s-launchSim) _js/sim/sim.js_

<!-- note:hashHue -->
<!-- /note -->

### <a id="s-_byIdFor"></a>`_byIdFor`

const · L389–389

<!-- note:_byIdFor -->
id → body index. BODIES is only ever reassigned (applySystem), so the map is
keyed on the array identity and rebuilt when the sky changes.
<!-- /note -->

### <a id="s-_byId"></a>`_byId`

const · L389–389

<!-- note:_byId -->
<!-- /note -->

### <a id="s-bodyById"></a>`bodyById(id)`

function · **exported** · L390–393

- called by: [`lockedRef`](../console/panels/nav.js.md#s-lockedRef) _js/console/panels/nav.js_ · [`mountTargets`](../console/panels/nav.js.md#s-mountTargets) _js/console/panels/nav.js_ · [`mountAttract>retarget`](../render/attract.js.md#s-mountAttract-retarget) _js/render/attract.js_ · [`mountGame>spawnImpactFX`](../render/engine.js.md#s-mountGame-spawnImpactFX) _js/render/engine.js_ · [`mountGame>stepEventFX`](../render/engine.js.md#s-mountGame-stepEventFX) _js/render/engine.js_ · [`mountGame>tick`](../render/engine.js.md#s-mountGame-tick) _js/render/engine.js_ ×2 · [`@file`](../sim/sim.js.md#) _js/sim/sim.js_ ×2 · [`addBodyWaypoint`](../sim/sim.js.md#s-addBodyWaypoint) _js/sim/sim.js_ · [`applyReliable`](../sim/sim.js.md#s-applyReliable) _js/sim/sim.js_ · [`applyRemoteStrike`](../sim/sim.js.md#s-applyRemoteStrike) _js/sim/sim.js_ · [`applyWorldSnapshot`](../sim/sim.js.md#s-applyWorldSnapshot) _js/sim/sim.js_ ×2 · [`candidateSig`](../sim/sim.js.md#s-candidateSig) _js/sim/sim.js_ · [`goSupernova`](../sim/sim.js.md#s-goSupernova) _js/sim/sim.js_ · [`launchSim`](../sim/sim.js.md#s-launchSim) _js/sim/sim.js_ · [`selectBody`](../sim/sim.js.md#s-selectBody) _js/sim/sim.js_ · [`stepCataclysms`](../sim/sim.js.md#s-stepCataclysms) _js/sim/sim.js_ · [`stepSalvage`](../sim/sim.js.md#s-stepSalvage) _js/sim/sim.js_ · [`strikeBody`](../sim/sim.js.md#s-strikeBody) _js/sim/sim.js_ · [`summonHole`](../sim/sim.js.md#s-summonHole) _js/sim/sim.js_ · [`takeSalvageContract`](../sim/sim.js.md#s-takeSalvageContract) _js/sim/sim.js_ · [`targetPosition`](../sim/sim.js.md#s-targetPosition) _js/sim/sim.js_ · [`tryScan`](../sim/sim.js.md#s-tryScan) _js/sim/sim.js_ · [`warpNodeById`](../sim/sim.js.md#s-warpNodeById) _js/sim/sim.js_ · [`describeStation`](../station/stations.js.md#s-describeStation) _js/station/stations.js_ · [`stepStations`](../station/stations.js.md#s-stepStations) _js/station/stations.js_ · [`mountHud>paintAll`](../ui/hud.js.md#s-mountHud-paintAll) _js/ui/hud.js_ ×2 · [`mountMap`](../ui/map.js.md#s-mountMap) _js/ui/map.js_ ×2 · [`mountMap>drawSheet`](../ui/map.js.md#s-mountMap-drawSheet) _js/ui/map.js_ ×2 · [`mountMap>laneState`](../ui/map.js.md#s-mountMap-laneState) _js/ui/map.js_ · [`mountMap>openMenu`](../ui/map.js.md#s-mountMap-openMenu) _js/ui/map.js_ · [`bodyPosition`](#s-bodyPosition) · [`applyTerraformSnapshot`](events/atmoworks.js.md#s-applyTerraformSnapshot) _js/world/events/atmoworks.js_ · [`frameFor`](hulks.js.md#s-frameFor) _js/world/hulks.js_ · [`place`](hulks.js.md#s-place) _js/world/hulks.js_ · [`stepHulks`](hulks.js.md#s-stepHulks) _js/world/hulks.js_

<!-- note:bodyById -->
<!-- /note -->

### <a id="s-orbitInto"></a>`orbitInto(o, orbit, period, phase, inclination, eccentricity, time)`

function · L395–403

- called by: [`bodyPosition`](#s-bodyPosition) · [`orbitPosition`](#s-orbitPosition)

<!-- note:orbitInto -->
<!-- /note -->

### <a id="s-orbitPosition"></a>`orbitPosition(orbit, period, phase, inclination, eccentricity, time)`

function · **exported** · L405–407

- calls: [`orbitInto`](#s-orbitInto)
- called by: [`beaconPosition`](#s-beaconPosition)

<!-- note:orbitPosition -->
<!-- /note -->

### <a id="s-_parent"></a>`_parent`

const · L409–409

<!-- note:_parent -->
One scratch per nesting level (moon → planet → star); the recursion never
goes deeper than the parent chain, so no two live calls share a slot.
<!-- /note -->

### <a id="s-bodyPosition"></a>`bodyPosition(id, time, out, depth=)`

function · **exported** · L411–428

- calls: [`bodyById`](#s-bodyById) · [`bodyPosition`](#s-bodyPosition) · [`orbitInto`](#s-orbitInto)
- called by: [`doglegAround`](../aria/nav.js.md#s-doglegAround) _js/aria/nav.js_ · [`placeOf`](../aria/nav.js.md#s-placeOf) _js/aria/nav.js_ · [`senseSpace`](../aria/senses.js.md#s-senseSpace) _js/aria/senses.js_ · [`mountTargets`](../console/panels/nav.js.md#s-mountTargets) _js/console/panels/nav.js_ ×2 · [`ROLE_STEP.harvester`](../drones/ops.js.md#s-ROLE_STEP-harvester) _js/drones/ops.js_ · [`nearestBody`](../drones/ops.js.md#s-nearestBody) _js/drones/ops.js_ · [`posOf`](../drones/ops.js.md#s-posOf) _js/drones/ops.js_ · [`KINDS.fieldtrip`](../economy/contracts.js.md#s-KINDS-fieldtrip) _js/economy/contracts.js_ · [`KINDS.wreck`](../economy/contracts.js.md#s-KINDS-wreck) _js/economy/contracts.js_ · [`targetPos`](../economy/contracts.js.md#s-targetPos) _js/economy/contracts.js_ · [`apLeg`](../flight/autopilot.js.md#s-apLeg) _js/flight/autopilot.js_ · [`threatTo`](../flight/avoid.js.md#s-threatTo) _js/flight/avoid.js_ · [`assayPoint`](../flight/probes.js.md#s-assayPoint) _js/flight/probes.js_ · [`nearestUnsurveyed`](../mission/run.js.md#s-nearestUnsurveyed) _js/mission/run.js_ · [`execute`](../npc/captain.js.md#s-execute) _js/npc/captain.js_ · [`snapshot`](../npc/captain.js.md#s-snapshot) _js/npc/captain.js_ · [`mountAttract>place`](../render/attract.js.md#s-mountAttract-place) _js/render/attract.js_ · [`mountGame>stepCloseUp`](../render/engine.js.md#s-mountGame-stepCloseUp) _js/render/engine.js_ · [`mountGame>tick`](../render/engine.js.md#s-mountGame-tick) _js/render/engine.js_ ×4 · [`@file`](../sim/sim.js.md#) _js/sim/sim.js_ ×2 · [`addBodyWaypoint`](../sim/sim.js.md#s-addBodyWaypoint) _js/sim/sim.js_ · [`bodyUnderReticle`](../sim/sim.js.md#s-bodyUnderReticle) _js/sim/sim.js_ · [`collapseToHole`](../sim/sim.js.md#s-collapseToHole) _js/sim/sim.js_ · [`damageBody`](../sim/sim.js.md#s-damageBody) _js/sim/sim.js_ · [`layRing`](../sim/sim.js.md#s-layRing) _js/sim/sim.js_ · [`lockCandidates`](../sim/sim.js.md#s-lockCandidates) _js/sim/sim.js_ · [`losBlocker`](../sim/sim.js.md#s-losBlocker) _js/sim/sim.js_ · [`nearestBody`](../sim/sim.js.md#s-nearestBody) _js/sim/sim.js_ · [`onImpact`](../sim/sim.js.md#s-onImpact) _js/sim/sim.js_ ×2 · [`plotRoute`](../sim/sim.js.md#s-plotRoute) _js/sim/sim.js_ · [`seedOrbit`](../sim/sim.js.md#s-seedOrbit) _js/sim/sim.js_ · [`shiftClock`](../sim/sim.js.md#s-shiftClock) _js/sim/sim.js_ ×2 · [`stepCataclysms`](../sim/sim.js.md#s-stepCataclysms) _js/sim/sim.js_ · [`stepCollisions`](../sim/sim.js.md#s-stepCollisions) _js/sim/sim.js_ · [`stepSalvage`](../sim/sim.js.md#s-stepSalvage) _js/sim/sim.js_ · [`strikeBody`](../sim/sim.js.md#s-strikeBody) _js/sim/sim.js_ · [`summonHole`](../sim/sim.js.md#s-summonHole) _js/sim/sim.js_ · [`targetPosition`](../sim/sim.js.md#s-targetPosition) _js/sim/sim.js_ · [`tryScan`](../sim/sim.js.md#s-tryScan) _js/sim/sim.js_ · [`warpNodeById.pos`](../sim/sim.js.md#s-warpNodeById-pos) _js/sim/sim.js_ · [`waypointPosition`](../sim/sim.js.md#s-waypointPosition) _js/sim/sim.js_ · [`stepStations`](../station/stations.js.md#s-stepStations) _js/station/stations.js_ · [`mountMap`](../ui/map.js.md#s-mountMap) _js/ui/map.js_ ×4 · [`mountMap>dirEntries`](../ui/map.js.md#s-mountMap-dirEntries) _js/ui/map.js_ · [`mountMap>drawDirectory`](../ui/map.js.md#s-mountMap-drawDirectory) _js/ui/map.js_ · [`mountMap>drawSheet`](../ui/map.js.md#s-mountMap-drawSheet) _js/ui/map.js_ · [`mountMap>hitAt`](../ui/map.js.md#s-mountMap-hitAt) _js/ui/map.js_ · [`buildCtx`](../ui/tutorial.js.md#s-buildCtx) _js/ui/tutorial.js_ · [`bodyPosition`](#s-bodyPosition) · [`bodyVelocity`](#s-bodyVelocity) ×2 · [`rubbleRing`](debris.js.md#s-rubbleRing) _js/world/debris.js_ · [`stepDebris`](debris.js.md#s-stepDebris) _js/world/debris.js_ · [`tableBodyPosition`](debris.js.md#s-tableBodyPosition) _js/world/debris.js_ · [`atmoTarget`](events/atmoworks.js.md#s-atmoTarget) _js/world/events/atmoworks.js_ · [`frameFor`](hulks.js.md#s-frameFor) _js/world/hulks.js_ ×2 · [`place`](hulks.js.md#s-place) _js/world/hulks.js_ · [`stepHulks`](hulks.js.md#s-stepHulks) _js/world/hulks.js_ ×2

<!-- note:bodyPosition -->
<!-- /note -->

### <a id="s-_v0"></a>`_v0`

const · L430–430

<!-- note:_v0 -->
<!-- /note -->

### <a id="s-_v1"></a>`_v1`

const · L431–431

<!-- note:_v1 -->
<!-- /note -->

### <a id="s-bodyVelocity"></a>`bodyVelocity(id, time, out)`

function · **exported** · L433–442

- calls: [`bodyPosition`](#s-bodyPosition) ×2
- called by: [`threatTo`](../flight/avoid.js.md#s-threatTo) _js/flight/avoid.js_ · [`damageBody`](../sim/sim.js.md#s-damageBody) _js/sim/sim.js_ · [`onImpact`](../sim/sim.js.md#s-onImpact) _js/sim/sim.js_ · [`seedOrbit`](../sim/sim.js.md#s-seedOrbit) _js/sim/sim.js_ · [`shiftClock`](../sim/sim.js.md#s-shiftClock) _js/sim/sim.js_ ×2 · [`stepShip`](../sim/sim.js.md#s-stepShip) _js/sim/sim.js_ · [`targetVelocity`](../sim/sim.js.md#s-targetVelocity) _js/sim/sim.js_ · [`warpNodeById.vel`](../sim/sim.js.md#s-warpNodeById-vel) _js/sim/sim.js_ · [`waypointVelocity`](../sim/sim.js.md#s-waypointVelocity) _js/sim/sim.js_ · [`stepStations`](../station/stations.js.md#s-stepStations) _js/station/stations.js_ · [`hulkVelocity`](hulks.js.md#s-hulkVelocity) _js/world/hulks.js_

<!-- note:bodyVelocity -->
Orbital velocity of a body, by central difference. The local frame.
<!-- /note -->

### <a id="s-beaconPosition"></a>`beaconPosition(def, time)`

function · **exported** · L444–446

- calls: [`orbitPosition`](#s-orbitPosition)
- called by: [`targetPos`](../economy/contracts.js.md#s-targetPos) _js/economy/contracts.js_ · [`mountGame>tick`](../render/engine.js.md#s-mountGame-tick) _js/render/engine.js_ ×2 · [`@file`](../sim/sim.js.md#) _js/sim/sim.js_ · [`collectBeaconsNear`](../sim/sim.js.md#s-collectBeaconsNear) _js/sim/sim.js_ · [`mountMap`](../ui/map.js.md#s-mountMap) _js/ui/map.js_

<!-- note:beaconPosition -->
<!-- /note -->

### <a id="s-dist3"></a>`dist3(a, b)`

function · **exported** · L448–450

- called by: [`climbOut`](../aria/nav.js.md#s-climbOut) _js/aria/nav.js_ · [`legSeconds`](../aria/nav.js.md#s-legSeconds) _js/aria/nav.js_ · [`bestRepairPort`](../aria/pilot.js.md#s-bestRepairPort) _js/aria/pilot.js_ · [`buildPlan`](../aria/pilot.js.md#s-buildPlan) _js/aria/pilot.js_ · [`fabStop`](../aria/pilot.js.md#s-fabStop) _js/aria/pilot.js_ · [`inRange`](../aria/pilot.js.md#s-inRange) _js/aria/pilot.js_ · [`refitPlan`](../aria/pilot.js.md#s-refitPlan) _js/aria/pilot.js_ · [`sensePorts`](../aria/senses.js.md#s-sensePorts) _js/aria/senses.js_ ×2 · [`senseSpace`](../aria/senses.js.md#s-senseSpace) _js/aria/senses.js_ ×2 · [`mountTargets`](../console/panels/nav.js.md#s-mountTargets) _js/console/panels/nav.js_ ×2 · [`apDock`](../flight/autopilot.js.md#s-apDock) _js/flight/autopilot.js_ ×2 · [`apLeg`](../flight/autopilot.js.md#s-apLeg) _js/flight/autopilot.js_ · [`apMine`](../flight/autopilot.js.md#s-apMine) _js/flight/autopilot.js_ ×2 · [`apPark`](../flight/autopilot.js.md#s-apPark) _js/flight/autopilot.js_ · [`atSeam`](../flight/autopilot.js.md#s-atSeam) _js/flight/autopilot.js_ · [`bestPortFor`](../flight/autopilot.js.md#s-bestPortFor) _js/flight/autopilot.js_ · [`nearestSeam`](../flight/autopilot.js.md#s-nearestSeam) _js/flight/autopilot.js_ ×2 · [`threatTo`](../flight/avoid.js.md#s-threatTo) _js/flight/avoid.js_ ×4 · [`assayPoint`](../flight/probes.js.md#s-assayPoint) _js/flight/probes.js_ ×4 · [`launchProbe`](../flight/probes.js.md#s-launchProbe) _js/flight/probes.js_ · [`remoteScan`](../flight/probes.js.md#s-remoteScan) _js/flight/probes.js_ · [`EXEC.GOTO`](../mission/run.js.md#s-EXEC-GOTO) _js/mission/run.js_ · [`nearestUnsurveyed`](../mission/run.js.md#s-nearestUnsurveyed) _js/mission/run.js_ · [`mountGame>syncContactMeshes`](../render/engine.js.md#s-mountGame-syncContactMeshes) _js/render/engine.js_ · [`mountGame>syncFlow`](../render/engine.js.md#s-mountGame-syncFlow) _js/render/engine.js_ ×2 · [`mountGame>syncHulks`](../render/engine.js.md#s-mountGame-syncHulks) _js/render/engine.js_ · [`mountGame>syncProbeMeshes`](../render/engine.js.md#s-mountGame-syncProbeMeshes) _js/render/engine.js_ · [`mountGame>syncTraffic`](../render/engine.js.md#s-mountGame-syncTraffic) _js/render/engine.js_ ×2 · [`mountGame>syncWorkDrones`](../render/engine.js.md#s-mountGame-syncWorkDrones) _js/render/engine.js_ · [`mountGame>tick`](../render/engine.js.md#s-mountGame-tick) _js/render/engine.js_ ×12 · [`mountGame>updateStations`](../render/engine.js.md#s-mountGame-updateStations) _js/render/engine.js_ · [`collectBeaconsNear`](../sim/sim.js.md#s-collectBeaconsNear) _js/sim/sim.js_ · [`engageWarp`](../sim/sim.js.md#s-engageWarp) _js/sim/sim.js_ · [`nearestBody`](../sim/sim.js.md#s-nearestBody) _js/sim/sim.js_ · [`onImpact`](../sim/sim.js.md#s-onImpact) _js/sim/sim.js_ · [`plotRoute`](../sim/sim.js.md#s-plotRoute) _js/sim/sim.js_ ×5 · [`publishHud`](../sim/sim.js.md#s-publishHud) _js/sim/sim.js_ ×2 · [`stepCataclysms`](../sim/sim.js.md#s-stepCataclysms) _js/sim/sim.js_ · [`stepSalvage`](../sim/sim.js.md#s-stepSalvage) _js/sim/sim.js_ · [`stepWarp`](../sim/sim.js.md#s-stepWarp) _js/sim/sim.js_ · [`tryAssay`](../sim/sim.js.md#s-tryAssay) _js/sim/sim.js_ · [`tryScan`](../sim/sim.js.md#s-tryScan) _js/sim/sim.js_ · [`warpBlock`](../sim/sim.js.md#s-warpBlock) _js/sim/sim.js_ · [`warpDropout`](../sim/sim.js.md#s-warpDropout) _js/sim/sim.js_ · [`mountMap>dirEntries`](../ui/map.js.md#s-mountMap-dirEntries) _js/ui/map.js_ ×3 · [`mountMap>drawSheet`](../ui/map.js.md#s-mountMap-drawSheet) _js/ui/map.js_ ×5 · [`mountMap>openMenu`](../ui/map.js.md#s-mountMap-openMenu) _js/ui/map.js_ ×4 · [`atmoTarget`](events/atmoworks.js.md#s-atmoTarget) _js/world/events/atmoworks.js_

<!-- note:dist3 -->
<!-- /note -->

### <a id="s-scanRadius"></a>`scanRadius(body)`

function · **exported** · L452–454

- calls: [`scanRange`](scale.js.md#s-scanRange) _js/world/scale.js_
- called by: [`visitRadius`](../economy/contracts.js.md#s-visitRadius) _js/economy/contracts.js_ · [`snapshot`](../npc/captain.js.md#s-snapshot) _js/npc/captain.js_ · [`mountGame>tick`](../render/engine.js.md#s-mountGame-tick) _js/render/engine.js_ · [`tryScan`](../sim/sim.js.md#s-tryScan) _js/sim/sim.js_ · [`buildCtx`](../ui/tutorial.js.md#s-buildCtx) _js/ui/tutorial.js_

<!-- note:scanRadius -->
Distance at which a body can be surveyed. Grows with the world.
<!-- /note -->

### <a id="s-applyArchStats"></a>`applyArchStats(out)`

function · L456–463

- calls: [`goodName`](../economy/materials.js.md#s-goodName) _js/economy/materials.js_
- called by: [`refreshBody`](#s-refreshBody) · [`scaleBody`](#s-scaleBody)

<!-- note:applyArchStats -->
Archetype-derived readout fields. Shared by the first scaling pass and refreshBody.
<!-- /note -->

### <a id="s-TEMP_K"></a>`TEMP_K`

const · **exported** · L465–465

<!-- note:TEMP_K -->
---- thermal ------------------------------------------------------------ *
Every world sits at its band's base temperature; an impact dumps heat on
top as a delta that radiates away over tens of minutes. Big strikes glow.
<!-- /note -->

### <a id="s-THERMAL_HALFLIFE"></a>`THERMAL_HALFLIFE`

const · L466–466

<!-- note:THERMAL_HALFLIFE -->
<!-- /note -->

### <a id="s-heatBody"></a>`heatBody(b, dK)`

function · **exported** · L468–470

- called by: [`onImpact`](../sim/sim.js.md#s-onImpact) _js/sim/sim.js_

<!-- note:heatBody -->
Dump impact heat on a body (delta kelvin).
<!-- /note -->

### <a id="s-coolBodies"></a>`coolBodies(dt)`

function · **exported** · L472–478

<!-- note:coolBodies -->
Radiative cooling, called from the sim tick.
<!-- /note -->

### <a id="s-bodyTempK"></a>`bodyTempK(b)`

function · **exported** · L480–482

- called by: [`stepNews`](../comms/comms.js.md#s-stepNews) _js/comms/comms.js_ · [`onImpact`](../sim/sim.js.md#s-onImpact) _js/sim/sim.js_ · [`tryScan`](../sim/sim.js.md#s-tryScan) _js/sim/sim.js_ · [`tempLabel`](#s-tempLabel) · [`stepAtmoWorks`](events/atmoworks.js.md#s-stepAtmoWorks) _js/world/events/atmoworks.js_ ×3

<!-- note:bodyTempK -->
Effective surface temperature in kelvin: band base + impact heat + terraforming.
<!-- /note -->

### <a id="s-bandFromK"></a>`bandFromK(k)`

function · **exported** · L484–491

- called by: [`tempLabel`](#s-tempLabel) · [`stepAtmoWorks`](events/atmoworks.js.md#s-stepAtmoWorks) _js/world/events/atmoworks.js_ ×2

<!-- note:bandFromK -->
The band a temperature reads as — a terraformed world wears its new climate.
<!-- /note -->

### <a id="s-tempLabel"></a>`tempLabel(b)`

function · **exported** · L493–499

- calls: [`bandFromK`](#s-bandFromK) · [`bodyTempK`](#s-bodyTempK)
- called by: [`mountTargets`](../console/panels/nav.js.md#s-mountTargets) _js/console/panels/nav.js_

<!-- note:tempLabel -->
"COLD · 180 K", "COLD · 407 K — IMPACT-HEATED", "TEMPERATE · 262 K — TERRAFORMED".
<!-- /note -->

### <a id="s-refreshBody"></a>`refreshBody(b)`

function · **exported** · L501–514

- calls: [`applyArchStats`](#s-applyArchStats) · [`bodyStats`](scale.js.md#s-bodyStats) _js/world/scale.js_ · [`massIndex`](scale.js.md#s-massIndex) _js/world/scale.js_ · [`mu`](scale.js.md#s-mu) _js/world/scale.js_ · [`scanRange`](scale.js.md#s-scanRange) _js/world/scale.js_ · [`sphereOfInfluence`](scale.js.md#s-sphereOfInfluence) _js/world/scale.js_ · [`surfaceGravity`](scale.js.md#s-surfaceGravity) _js/world/scale.js_ · [`wellRadius`](scale.js.md#s-wellRadius) _js/world/scale.js_
- called by: [`applyWorldSnapshot`](../sim/sim.js.md#s-applyWorldSnapshot) _js/sim/sim.js_ ×2 · [`damageBody`](../sim/sim.js.md#s-damageBody) _js/sim/sim.js_ · [`shatterBody`](../sim/sim.js.md#s-shatterBody) _js/sim/sim.js_

<!-- note:refreshBody -->
Recompute the derived numbers after a world has been changed.

Breaking a planet up takes its mass with it, and everything downstream of
mass has to hear about it — not just the pull, but how far out the pull is
still the dominant one. Leaving the sphere of influence at its old size is
what kept a dead world holding the local frame, and the warp core with it,
from a long way further out than there was anything left to hold it.
<!-- /note -->

### <a id="s-starBody"></a>`starBody()`

function · **exported** · L516–518

- called by: [`mountGame>rebuildWorld`](../render/engine.js.md#s-mountGame-rebuildWorld) _js/render/engine.js_ · [`mountGame>tick`](../render/engine.js.md#s-mountGame-tick) _js/render/engine.js_ ×3 · [`goSupernova`](../sim/sim.js.md#s-goSupernova) _js/sim/sim.js_ · [`stepCollisions`](../sim/sim.js.md#s-stepCollisions) _js/sim/sim.js_ · [`warpBlock`](../sim/sim.js.md#s-warpBlock) _js/sim/sim.js_ · [`warpBlockDuringSpool`](../sim/sim.js.md#s-warpBlockDuringSpool) _js/sim/sim.js_ · [`mountMap>tapAt`](../ui/map.js.md#s-mountMap-tapAt) _js/ui/map.js_

<!-- note:starBody -->
<!-- /note -->

### <a id="s-gravitySources"></a>`gravitySources()`

function · **exported** · L520–522

<!-- note:gravitySources -->
Sorted big-to-small, used by the gravity solver so the dominant well wins.
<!-- /note -->
