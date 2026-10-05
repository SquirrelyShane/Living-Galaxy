# js/mission/salvage.js

[index](../../../README.md) · 257 lines · 21 symbols · 13 imports · 4 importers

## About

<!-- note:@file -->
0.3.90 — SALVAGE, the mission op, and the eye that picks a hulk.

MINE flies to a seam and works rocks until the hold is full. SALVAGE is the
same shape for dead hulls: pick the hulk worth most for the time it costs,
fly to it, hold station inside rig reach, run the rig down it section by
section while the tractor reels what the rig sheds, then take the next one
in reach — until the hold is full, the step's condition is met, the job it
was flown for is filled, or there is nothing left worth the trip.

A sky is not short of hulks: every hull that loses a fight leaves one, and
forty minutes of Sol leaves well over a hundred. What is short is time, so
the pick is credits per second — what comes aboard, over the leg plus the
cut — and a hulk that will age out before she is done with it is not picked.

Like tradeops.js and detour.js this is a factory: run.js hands it the
autopilot's verbs, and it never imports run.js back.
<!-- /note -->

## Imports

| line | from | names | target |
|---|---|---|---|
| 1 | `../sim/sim.js` | `sim`, `addAnchoredWaypoint`, `removeWaypoint`, `warpNodeById`, `selectBody`, `setRigMode`, `toggleSystem`, `logEvent`, `losBlocker` | [js/sim/sim.js](../sim/sim.js.md) |
| 2 | `../flight/ship.js` | `holdRoom`, `batteryCap` | [js/flight/ship.js](../flight/ship.js.md) |
| 3 | `../world/hulks.js` | `hulks`, `hulkById`, `hulkManifest`, `HULK` | [js/world/hulks.js](../world/hulks.js.md) |
| 4 | `../flight/rig.js` | `RIG`, `rig`, `rigBlocker`, `nextSection`, `rigRange` **unused** | [js/flight/rig.js](../flight/rig.js.md) |
| 5 | `../world/debris.js` | `chunks` | [js/world/debris.js](../world/debris.js.md) |
| 6 | `../flight/turrets.js` | `contacts` | [js/flight/turrets.js](../flight/turrets.js.md) |
| 7 | `../station/stations.js` | `stations`, `stationById` | [js/station/stations.js](../station/stations.js.md) |
| 8 | `../economy/materials.js` | `baseValue` | [js/economy/materials.js](../economy/materials.js.md) |
| 9 | `../economy/contracts.js` | `contracts` | [js/economy/contracts.js](../economy/contracts.js.md) |
| 10 | `../aria/nav.js` | `legSeconds` | [js/aria/nav.js](../aria/nav.js.md) |
| 11 | `../world/field.js` | `inBelt` | [js/world/field.js](../world/field.js.md) |
| 12 | `../npc/traffic.js` | `traffic`, `HOSTILE_ROLES` | [js/npc/traffic.js](../npc/traffic.js.md) |
| 13 | `../npc/rogues.js` | `nests` | [js/npc/rogues.js](../npc/rogues.js.md) |

## Imported by

- [js/aria/pilot.js](../aria/pilot.js.md) — `bestHulk`, `SALV`
- [js/aria/play.js](../aria/play.js.md) — `bestHulk`, `SALV`
- [js/flight/autopilot.js](../flight/autopilot.js.md) — `bestHulk`, `SALV`
- [js/mission/run.js](run.js.md) — `makeSalvage`

## Exports

- [`SALV`](#s-SALV) · const — used by [js/aria/pilot.js](../aria/pilot.js.md), [js/aria/play.js](../aria/play.js.md), [js/flight/autopilot.js](../flight/autopilot.js.md)
- [`rigModeFor`](#s-rigModeFor) · function — **no importer in scanned roots**
- [`hulkPark`](#s-hulkPark) · function — **no importer in scanned roots**
- [`forgetSkipped`](#s-forgetSkipped) · function — **no importer in scanned roots**
- [`skipHulk`](#s-skipHulk) · function — **no importer in scanned roots**
- [`rigRate`](#s-rigRate) · function — **no importer in scanned roots**
- [`cutSeconds`](#s-cutSeconds) · function — **no importer in scanned roots**
- [`hulkWorth`](#s-hulkWorth) · function — **no importer in scanned roots**
- [`hotHulk`](#s-hotHulk) · function — **no importer in scanned roots**
- [`bestHulk`](#s-bestHulk) · function — used by [js/aria/pilot.js](../aria/pilot.js.md), [js/aria/play.js](../aria/play.js.md), [js/flight/autopilot.js](../flight/autopilot.js.md)
- [`salvageReport`](#s-salvageReport) · function — **no importer in scanned roots**
- [`makeSalvage`](#s-makeSalvage) · function — used by [js/mission/run.js](run.js.md)

## Effects

_none detected_

## Symbols

### <a id="s-SALV"></a>`SALV`

const · **exported** · L15–40

<!-- note:SALV -->
<!-- /note -->

### <a id="s-rigModeFor"></a>`rigModeFor(want=, pos=, {…}=)`

function · **exported** · L42–52

- calls: [`d3`](#s-d3)
- called by: [`makeSalvage`](#s-makeSalvage)

<!-- note:rigModeFor -->
"auto" is how a salvor works a hulk: STRIP while it is quiet, because the
parts and the recorder are most of what a hulk is worth; CUT when something
hostile is close, because CUT is two and a half times quicker and draws a
third less, and the plate is what the job wants.
<!-- /note -->

### <a id="s-hulkPark"></a>`hulkPark(h)`

function · **exported** · L54–54

- called by: [`makeSalvage>mark`](#s-makeSalvage-mark)

<!-- note:hulkPark -->
0.3.92: a hull is two to eight units long. From 330 u — just inside the
rig's reach, where 0.3.91 parked her — that is a dot under the lock box, so
a pilot watched an arc go out to nothing and plate come back. She parks at
a few hull lengths: close enough to see what she is taking apart.
<!-- /note -->

### <a id="s-skipped"></a>`skipped`

const · L56–56

<!-- note:skipped -->
<!-- /note -->

### <a id="s-d3"></a>`d3(a, b)`

function · L57–57

- called by: [`bestHulk`](#s-bestHulk) · [`hotHulk`](#s-hotHulk) ×3 · [`makeSalvage`](#s-makeSalvage) · [`makeSalvage>looseNear`](#s-makeSalvage-looseNear) · [`rigModeFor`](#s-rigModeFor) · [`underGuns`](#s-underGuns)

<!-- note:d3 -->
<!-- /note -->

### <a id="s-forgetSkipped"></a>`forgetSkipped()`

function · **exported** · L59–61

<!-- note:forgetSkipped -->
<!-- /note -->

### <a id="s-skipHulk"></a>`skipHulk(id, forS=)`

function · **exported** · L63–65

- called by: [`makeSalvage`](#s-makeSalvage) ×3

<!-- note:skipHulk -->
<!-- /note -->

### <a id="s-rigRate"></a>`rigRate(ship=, mode=)`

function · **exported** · L67–69

- called by: [`cutSeconds`](#s-cutSeconds)

<!-- note:rigRate -->
<!-- /note -->

### <a id="s-cutSeconds"></a>`cutSeconds(h, ship=, mode=)`

function · **exported** · L71–75

- calls: [`rigRate`](#s-rigRate)
- called by: [`bestHulk`](#s-bestHulk)

<!-- note:cutSeconds -->
<!-- /note -->

### <a id="s-hulkWorth"></a>`hulkWorth(h, mode=)`

function · **exported** · L77–83

- calls: [`baseValue`](../economy/materials.js.md#s-baseValue) _js/economy/materials.js_ ×2 · [`hulkManifest`](../world/hulks.js.md#s-hulkManifest) _js/world/hulks.js_
- called by: [`bestHulk`](#s-bestHulk)

<!-- note:hulkWorth -->
What actually comes aboard: STRIP brings everything out whole, CUT keeps
85% of the plate, half the cargo and none of the parts.
<!-- /note -->

### <a id="s-underGuns"></a>`underGuns(h)`

function · L85–85

- calls: [`d3`](#s-d3)
- via [js/station/stations.js](../station/stations.js.md): `stations.some`
- called by: [`bestHulk`](#s-bestHulk)

<!-- note:underGuns -->
<!-- /note -->

### <a id="s-hotHulk"></a>`hotHulk(h)`

function · **exported** · L87–92

- calls: [`d3`](#s-d3) ×3
- via [js/npc/traffic.js](../npc/traffic.js.md): `HOSTILE_ROLES.has`
- called by: [`bestHulk`](#s-bestHulk)

<!-- note:hotHulk -->
Hulks are made where hulls are being killed, so the newest ones have the
killers still over them. A salvor has a rig and a tractor on a bus that
cannot also fight: she works the field after the fight has moved on.
<!-- /note -->

### <a id="s-bestHulk"></a>`bestHulk({…}=)`

function · **exported** · L94–120

- calls: [`legSeconds`](../aria/nav.js.md#s-legSeconds) _js/aria/nav.js_ ×2 · [`nextSection`](../flight/rig.js.md#s-nextSection) _js/flight/rig.js_ · [`cutSeconds`](#s-cutSeconds) · [`d3`](#s-d3) · [`hotHulk`](#s-hotHulk) · [`hulkWorth`](#s-hulkWorth) · [`underGuns`](#s-underGuns) · [`losBlocker`](../sim/sim.js.md#s-losBlocker) _js/sim/sim.js_ · [`inBelt`](../world/field.js.md#s-inBelt) _js/world/field.js_ · [`hulkManifest`](../world/hulks.js.md#s-hulkManifest) _js/world/hulks.js_
- called by: [`rawPlanJob`](../aria/pilot.js.md#s-rawPlanJob) _js/aria/pilot.js_ · [`canFly`](../aria/play.js.md#s-canFly) _js/aria/play.js_ · [`jobSeconds`](../aria/play.js.md#s-jobSeconds) _js/aria/play.js_ · [`movesNow`](../aria/play.js.md#s-movesNow) _js/aria/play.js_ · [`startFreeSalvage`](../aria/play.js.md#s-startFreeSalvage) _js/aria/play.js_ · [`engageSalvageLoop`](../flight/autopilot.js.md#s-engageSalvageLoop) _js/flight/autopilot.js_ · [`makeSalvage>pick`](#s-makeSalvage-pick) ×2 · [`salvageReport`](#s-salvageReport)

<!-- note:bestHulk -->
- L109 · `const plate = hulkManifest(h).plate * (mode === "cut" ? RIG.cutYield : 1);` — flown for an order: what counts is plate toward it, and only as much
  of the hulk as the order still wants gets cut
- L116 · `const score = (worth / secs) * (inBelt(h) ? SALV.beltK : 1);` — a belt hulk comes with the belt: rock in the lane and a drone swarm on
  a hull with no power to spare. It has to be worth a good deal more.
<!-- /note -->

### <a id="s-salvageReport"></a>`salvageReport(ship=)`

function · **exported** · L122–125

- calls: [`bestHulk`](#s-bestHulk)

<!-- note:salvageReport -->
<!-- /note -->

### <a id="s-jobOf"></a>`jobOf(s)`

function · L127–127

- via [js/economy/contracts.js](../economy/contracts.js.md): `contracts.active.find`
- called by: [`makeSalvage`](#s-makeSalvage) · [`makeSalvage>pick`](#s-makeSalvage-pick)

<!-- note:jobOf -->
<!-- /note -->

### <a id="s-jobFilled"></a>`jobFilled(a)`

function · L128–128

- called by: [`makeSalvage`](#s-makeSalvage)

<!-- note:jobFilled -->
<!-- /note -->

### <a id="s-makeSalvage"></a>`makeSalvage({…})`

function · **exported** · L130–257

- calls: [`nextSection`](../flight/rig.js.md#s-nextSection) _js/flight/rig.js_ · [`rigBlocker`](../flight/rig.js.md#s-rigBlocker) _js/flight/rig.js_ · [`batteryCap`](../flight/ship.js.md#s-batteryCap) _js/flight/ship.js_ · [`holdRoom`](../flight/ship.js.md#s-holdRoom) _js/flight/ship.js_ ×2 · [`d3`](#s-d3) · [`jobFilled`](#s-jobFilled) · [`jobOf`](#s-jobOf) · [`makeSalvage>drop`](#s-makeSalvage-drop) ×7 · [`makeSalvage>looseNear`](#s-makeSalvage-looseNear) · [`makeSalvage>mark`](#s-makeSalvage-mark) · [`makeSalvage>pick`](#s-makeSalvage-pick) · [`rigModeFor`](#s-rigModeFor) · [`skipHulk`](#s-skipHulk) ×3 · [`logEvent`](../sim/sim.js.md#s-logEvent) _js/sim/sim.js_ ×3 · [`setRigMode`](../sim/sim.js.md#s-setRigMode) _js/sim/sim.js_ · [`toggleSystem`](../sim/sim.js.md#s-toggleSystem) _js/sim/sim.js_ ×2 · [`hulkById`](../world/hulks.js.md#s-hulkById) _js/world/hulks.js_
- called by: [`SALVAGE`](run.js.md#s-SALVAGE) _js/mission/run.js_

<!-- note:makeSalvage -->
- L209 · `if (s.target?.kind !== "hulk" && (ap().unstuckCount ?? 0) - (run.stuck0 ?? 0) >= SALV.stuc` — a hulk the autopilot has twice had to break out on the way to is behind
  something; there are forty more
- L215 · `const charge = (ship.charge ?? 0) / Math.max(1, batteryCap(ship));` — STRIP is 40 kW on a bus that was already near the core's limit: left to
  run it flattens the battery in two hulks and the autopilot stands the
  whole mission down. The rig is rested instead — stowed at 28% until the
  battery is back to 65% — which costs a few seconds a hulk, not the loop.

- L223 · `if (typeof leg === "string" && leg.startsWith("fail:") && s.target?.kind !== "hulk" && (ru` — a leg that cannot be flown — a world across the lane with no way round,
  a battery that will not come back — condemns that hulk, not the run

- L215 · `const charge = (ship.charge ?? 0) / Math.max(1, batteryCap(ship));` — the rig is in the mode this step asked for before the hulk is in its
  reach — it reaches further than the leg now ends, and the pilot's
  standing mode would otherwise have the first cut

- L218 · `const close = d3(ship.pos, h) <= (run.node?.park ?? SALV.park[1]) * SALV.cutFrom;` — 0.3.92: and not before she is there. The rig reaches 600 u and takes a
  small hull apart in twenty seconds: lit from its full reach it had the
  wreck cut up while she was still 280 u off, so the pilot never saw it —
  and, never having "worked" it by the old test, the step failed. The arc
  lights as she comes in to park.
<!-- /note -->

#### <a id="s-makeSalvage-drop"></a>`makeSalvage>drop(run)`

function · L131–136

- calls: [`removeWaypoint`](../sim/sim.js.md#s-removeWaypoint) _js/sim/sim.js_
- called by: [`makeSalvage`](#s-makeSalvage) ×7

<!-- note:makeSalvage>drop -->
<!-- /note -->

#### <a id="s-makeSalvage-mark"></a>`makeSalvage>mark(run, h)`

function · L138–153

- calls: [`hulkPark`](#s-hulkPark) · [`addAnchoredWaypoint`](../sim/sim.js.md#s-addAnchoredWaypoint) _js/sim/sim.js_ · [`logEvent`](../sim/sim.js.md#s-logEvent) _js/sim/sim.js_ · [`removeWaypoint`](../sim/sim.js.md#s-removeWaypoint) _js/sim/sim.js_ · [`selectBody`](../sim/sim.js.md#s-selectBody) _js/sim/sim.js_ · [`warpNodeById`](../sim/sim.js.md#s-warpNodeById) _js/sim/sim.js_
- called by: [`makeSalvage`](#s-makeSalvage)

<!-- note:makeSalvage>mark -->
- L? · `if (run.node) run.node.park = Math.max(150, rigRange(sim.ship) * SALV.standoff);` — a point's park is 500 u and the leg ends at 800; the rig reaches 600.
  She arrived, then crept the last 200 u at a quarter throttle for half
  a minute before the arc lit. The hulk's park is inside the rig's reach.
<!-- /note -->

#### <a id="s-makeSalvage-pick"></a>`makeSalvage>pick(s, run)`

function · L155–162

- calls: [`nextSection`](../flight/rig.js.md#s-nextSection) _js/flight/rig.js_ ×2 · [`bestHulk`](#s-bestHulk) ×2 · [`jobOf`](#s-jobOf) · [`stationById`](../station/stations.js.md#s-stationById) _js/station/stations.js_ · [`hulkById`](../world/hulks.js.md#s-hulkById) _js/world/hulks.js_ ×2
- called by: [`makeSalvage`](#s-makeSalvage)

<!-- note:makeSalvage>pick -->
<!-- /note -->

#### <a id="s-makeSalvage-looseNear"></a>`makeSalvage>looseNear()`

function · L164–169

- calls: [`d3`](#s-d3)
- called by: [`makeSalvage`](#s-makeSalvage)

<!-- note:makeSalvage>looseNear -->
<!-- /note -->
