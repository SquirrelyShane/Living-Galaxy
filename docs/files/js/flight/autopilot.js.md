# js/flight/autopilot.js

[index](../../../README.md) · 803 lines · 64 symbols · 19 imports · 19 importers

## About

<!-- note:@file -->
LIVING GALAXY — the autopilot: flight primitives under a mission script.

## What it is

Only the player has an autopilot, and it takes orders the way a drone does:
a mission (js/mission/script.js) is a list of steps — go somewhere, dock,
mine until the hold is full, sell, charge, wait — with a thrust cap and a
warp policy on each. run.js walks the steps; this file is the flying:
`apLeg` (a leg, warp-capable), `apPark`, `apDock`, `apMine`, `apHold`,
`apSteer`. The HUD buttons and the chart still build one-step missions
through `engageAutopilot` / `engageAutoWarp` / `engageMiningLoop`.

## The power rule

Rated thrust alone draws more than the reactor makes, so the throttle is a
function of the charge: above ~60% the mains may dip into the battery for
momentum, in the band between they hold the *sustainable* setting (what the
reactor can carry after everything else on the bus), and at the 20% floor
the mains go cold and the hull coasts until the reactor catches up. A
pending jump adds a reserve: minimum charge plus the spool's own draw, or it
waits. A step's thrust cap is a ceiling under that rule, never a floor.

## Warp policy

  auto  — climb out of the well, charge, align, jump
  ask   — the same, but park aligned and ask (chat links / console banner)
  never — sublight only; long legs are long, go talk to the crew

It flies through the same injected inputs the conn NPC uses and lets go the
moment the pilot touches the stick. It never flies while an NPC holds the conn.

- L144 · `const PARK_RADII = 2.5;` — perch over a world, in radii
- L145 · `const PORT_PARK = 1400;` — hold distance off a port, u
- L146 · `const POINT_PARK = 500;` — hold distance off a saved location, u
- L147 · `const DEAD_SLOW = 10;` — u/s on the doorstep
- L149 · `const ROCK_STANDOFF = 0.75;` — cut from this fraction of cutter range
- L150 · `const SEAM_REACH = 25000;` — inside this of the seam the cutter goes to work
- L151 · `const ALIGN_CEILING = 600;` — u/s above which coming about stops adding throttle
- L459 · `const LANE_DRIFT = 40;` — u/s of off-lane motion that reads as flying sideways
- L460 · `const PIVOT_SPEED = 80;` — u/s under which the nose may come about onto the lane
<!-- /note -->

## Imports

| line | from | names | target |
|---|---|---|---|
| 1 | `../sim/sim.js` | `plotRoute`, `requestJump`, `selectBody`, `setNoticeAbout`, `sim`, `stationStatus`, `toggleDock`, `warpDestination`, `warpNodeById`, `logEvent`, `setThrottle`, `WARP`, `spoolTime`, `setMiningMode`, `canSmeltAt`, `sellPriceAt`, `warpBlock`, `toggleWarp`, `setNavTarget`, `setRigMode` | [js/sim/sim.js](../sim/sim.js.md) |
| 6 | `./avoid.js` | `threatTo`, `avoidAim`, `avoidLevel`, `deliberate`, `surfaceOnly`, `clearAvoidCommit`, `avoidCommit`, `blind`, `AVOID` | [js/flight/avoid.js](avoid.js.md) |
| 7 | `../core/input.js` | `setInjectedPan`, `touch` | [js/core/input.js](../core/input.js.md) |
| 8 | `./ship.js` | `*` as `shipMod` | [js/flight/ship.js](ship.js.md) |
| 9 | `./ship.js` | `BATTERY`, `DRAW`, `buildDemand`, `forwardOf`, `holdRoom`, `lifeDraw` | [js/flight/ship.js](ship.js.md) |
| 10 | `../npc/captain.js` | `captain`, `ariaHooks` | [js/npc/captain.js](../npc/captain.js.md) |
| 11 | `../world/bodies.js` | `bodyPosition`, `currentSystem`, `dist3` | [js/world/bodies.js](../world/bodies.js.md) |
| 12 | `../station/stations.js` | `stations`, `TRACTOR_V` | [js/station/stations.js](../station/stations.js.md) |
| 13 | `../npc/lanes.js` | `lanePoint` | [js/npc/lanes.js](../npc/lanes.js.md) |
| 14 | `../station/stationworks.js` | `requestDock` | [js/station/stationworks.js](../station/stationworks.js.md) |
| 15 | `../world/field.js` | `inBelt`, `nearbyRocks`, `beltExit`, `siteMarkRock`, `skipMarkRock` | [js/world/field.js](../world/field.js.md) |
| 16 | `./turrets.js` | `mining`, `MINE_RANGE` | [js/flight/turrets.js](turrets.js.md) |
| 17 | `../aria/aria.js` | `preferenceFor` | [js/aria/aria.js](../aria/aria.js.md) |
| 18 | `../mission/script.js` | `oneStep`, `makeMission`, `makeStep` | [js/mission/script.js](../mission/script.js.md) |
| 19 | `../mission/run.js` | `mission`, `startMission`, `stopMission`, `resumeMission`, `tickMission`, `missionStatusLine`, `restoreRun`, `answerAsk` | [js/mission/run.js](../mission/run.js.md) |
| 20 | `../economy/contracts.js` | `jobForSite` | [js/economy/contracts.js](../economy/contracts.js.md) |
| 21 | `../world/hulks.js` | `hulkById` | [js/world/hulks.js](../world/hulks.js.md) |
| 22 | `../mission/salvage.js` | `bestHulk`, `SALV` | [js/mission/salvage.js](../mission/salvage.js.md) |
| 23 | `../economy/materials.js` | `goodName` | [js/economy/materials.js](../economy/materials.js.md) |

## Imported by

- [js/aria/pilot.js](../aria/pilot.js.md) — `autopilot`, `nearestSeam`, `busOverload`, `pilotInput`
- [js/aria/play.js](../aria/play.js.md) — `autopilot`, `busIdle`, `AP_POWER`
- [js/console/panels/nav.js](../console/panels/nav.js.md) — `*`
- [js/console/panels/ship.js](../console/panels/ship.js.md) — `autopilot`, `sustainableThrottle`
- [js/mission/run.js](../mission/run.js.md) — `autopilot`, `apLeg`, `apPark`, `apDock`, `apMine`, `apHold`, `bestPortFor`, `nearestSeam`, `releaseControls`, `resetProgress`, `jumpEndedShort`, `warpReserve`, `AP_POWER`, `busIdle`
- [js/sim/sim.js](../sim/sim.js.md) — `autopilot`, `disengageAutopilot`, `engageAutopilot`, `tickAutopilot`
- [js/ui/boardview.js](../ui/boardview.js.md) — `engageMiningLoop`, `engageSalvageLoop`
- [js/ui/hud.js](../ui/hud.js.md) — `wireAutopilot`, `nearestSeam`, `busOverload`, `autopilot`
- [js/ui/map.js](../ui/map.js.md) — `autopilot`, `disengageAutopilot`, `engageAutopilot`, `engageAutoWarp`, `engageMiningLoop`
- test/aria-mining-loop.test.mjs _(outside js/)_ — `AP_POWER`, `autopilot`
- test/autopilot.test.mjs _(outside js/)_ — `autopilot`, `engageMiningLoop`, `engageAutopilot`, `powerThrottle`, `sustainableThrottle`, `warpReserve`, `AP_POWER`, `bestPortFor`, `cycleAutoPlan`
- test/avoid.test.mjs _(outside js/)_ — `autopilot`, `engageAutopilot`, `apProgress`, `resetProgress`, `beginUnstick`, `AP_STUCK`
- test/chart.test.mjs _(outside js/)_ — `autopilot`, `engageAutoWarp`, `engageAutopilot`, `disengageAutopilot`, `tickAutopilot`
- test/jobloop.test.mjs _(outside js/)_ — `engageMiningLoop`, `disengageAutopilot`
- test/marks.test.mjs _(outside js/)_ — `engageMiningLoop`, `apMine`, `autopilot`, `disengageAutopilot`, `tickAutopilot`
- test/mission.test.mjs _(outside js/)_ — `autopilot`, `engageMiningLoop`, `AP_POWER`
- test/nose.test.mjs _(outside js/)_ — `AP`
- test/portcontrol.test.mjs _(outside js/)_ — `autopilot`
- test/trade.test.mjs _(outside js/)_ — `autopilot`, `bestPortFor`

## Exports

- [`autopilot`](#s-autopilot) · const — used by [js/aria/pilot.js](../aria/pilot.js.md), [js/aria/play.js](../aria/play.js.md), [js/console/panels/nav.js](../console/panels/nav.js.md), [js/console/panels/ship.js](../console/panels/ship.js.md), [js/mission/run.js](../mission/run.js.md), [js/sim/sim.js](../sim/sim.js.md), [js/ui/hud.js](../ui/hud.js.md), [js/ui/map.js](../ui/map.js.md), test/aria-mining-loop.test.mjs, test/autopilot.test.mjs, test/avoid.test.mjs, test/chart.test.mjs, test/marks.test.mjs, test/mission.test.mjs, test/portcontrol.test.mjs, test/trade.test.mjs
- [`AP_STUCK`](#s-AP_STUCK) · const — used by [js/console/panels/nav.js](../console/panels/nav.js.md), test/avoid.test.mjs
- [`AP_POWER`](#s-AP_POWER) · const — used by [js/aria/play.js](../aria/play.js.md), [js/console/panels/nav.js](../console/panels/nav.js.md), [js/mission/run.js](../mission/run.js.md), test/aria-mining-loop.test.mjs, test/autopilot.test.mjs, test/mission.test.mjs
- [`sustainableThrottle`](#s-sustainableThrottle) · function — used by [js/console/panels/nav.js](../console/panels/nav.js.md), [js/console/panels/ship.js](../console/panels/ship.js.md), test/autopilot.test.mjs
- [`busIdle`](#s-busIdle) · function — used by [js/aria/play.js](../aria/play.js.md), [js/console/panels/nav.js](../console/panels/nav.js.md), [js/mission/run.js](../mission/run.js.md)
- [`busOverload`](#s-busOverload) · function — used by [js/aria/pilot.js](../aria/pilot.js.md), [js/console/panels/nav.js](../console/panels/nav.js.md), [js/ui/hud.js](../ui/hud.js.md)
- [`warpReserve`](#s-warpReserve) · function — used by [js/console/panels/nav.js](../console/panels/nav.js.md), [js/mission/run.js](../mission/run.js.md), test/autopilot.test.mjs
- [`powerThrottle`](#s-powerThrottle) · function — used by [js/console/panels/nav.js](../console/panels/nav.js.md), test/autopilot.test.mjs
- [`drifting`](#s-drifting) · function — used by [js/console/panels/nav.js](../console/panels/nav.js.md)
- [`planDefaults`](#s-planDefaults) · function — used by [js/console/panels/nav.js](../console/panels/nav.js.md)
- [`engageAutopilot`](#s-engageAutopilot) · function — used by [js/console/panels/nav.js](../console/panels/nav.js.md), [js/sim/sim.js](../sim/sim.js.md), [js/ui/map.js](../ui/map.js.md), test/autopilot.test.mjs, test/avoid.test.mjs, test/chart.test.mjs
- [`engageAutoWarp`](#s-engageAutoWarp) · function — used by [js/console/panels/nav.js](../console/panels/nav.js.md), [js/ui/map.js](../ui/map.js.md), test/chart.test.mjs
- [`engageMiningLoop`](#s-engageMiningLoop) · function — used by [js/console/panels/nav.js](../console/panels/nav.js.md), [js/ui/boardview.js](../ui/boardview.js.md), [js/ui/map.js](../ui/map.js.md), test/autopilot.test.mjs, test/jobloop.test.mjs, test/marks.test.mjs, test/mission.test.mjs
- [`engageSalvageLoop`](#s-engageSalvageLoop) · function — used by [js/console/panels/nav.js](../console/panels/nav.js.md), [js/ui/boardview.js](../ui/boardview.js.md)
- [`disengageAutopilot`](#s-disengageAutopilot) · function — used by [js/console/panels/nav.js](../console/panels/nav.js.md), [js/sim/sim.js](../sim/sim.js.md), [js/ui/map.js](../ui/map.js.md), test/chart.test.mjs, test/jobloop.test.mjs, test/marks.test.mjs
- [`releaseControls`](#s-releaseControls) · function — used by [js/console/panels/nav.js](../console/panels/nav.js.md), [js/mission/run.js](../mission/run.js.md)
- [`toggleAutopilot`](#s-toggleAutopilot) · function — used by [js/console/panels/nav.js](../console/panels/nav.js.md)
- [`cycleAutoPlan`](#s-cycleAutoPlan) · function — used by [js/console/panels/nav.js](../console/panels/nav.js.md), test/autopilot.test.mjs
- [`nearestSeam`](#s-nearestSeam) · function — used by [js/aria/pilot.js](../aria/pilot.js.md), [js/console/panels/nav.js](../console/panels/nav.js.md), [js/mission/run.js](../mission/run.js.md), [js/ui/hud.js](../ui/hud.js.md)
- [`apThreat`](#s-apThreat) · function — used by [js/console/panels/nav.js](../console/panels/nav.js.md)
- [`refreshThreat`](#s-refreshThreat) · function — used by [js/console/panels/nav.js](../console/panels/nav.js.md)
- [`apProgress`](#s-apProgress) · function — used by [js/console/panels/nav.js](../console/panels/nav.js.md), test/avoid.test.mjs
- [`resetProgress`](#s-resetProgress) · function — used by [js/console/panels/nav.js](../console/panels/nav.js.md), [js/mission/run.js](../mission/run.js.md), test/avoid.test.mjs
- [`beginUnstick`](#s-beginUnstick) · function — used by [js/console/panels/nav.js](../console/panels/nav.js.md), test/avoid.test.mjs
- [`apUnstick`](#s-apUnstick) · function — used by [js/console/panels/nav.js](../console/panels/nav.js.md)
- [`apSteer`](#s-apSteer) · function — used by [js/console/panels/nav.js](../console/panels/nav.js.md)
- [`matchFrame`](#s-matchFrame) · function — used by [js/console/panels/nav.js](../console/panels/nav.js.md)
- [`flyTheLane`](#s-flyTheLane) · function — used by [js/console/panels/nav.js](../console/panels/nav.js.md)
- [`apHold`](#s-apHold) · function — used by [js/console/panels/nav.js](../console/panels/nav.js.md), [js/mission/run.js](../mission/run.js.md)
- [`pilotInput`](#s-pilotInput) · function — used by [js/aria/pilot.js](../aria/pilot.js.md), [js/console/panels/nav.js](../console/panels/nav.js.md)
- [`relSpeedTo`](#s-relSpeedTo) · function — used by [js/console/panels/nav.js](../console/panels/nav.js.md)
- [`bestPortFor`](#s-bestPortFor) · function — used by [js/console/panels/nav.js](../console/panels/nav.js.md), [js/mission/run.js](../mission/run.js.md), test/autopilot.test.mjs, test/trade.test.mjs
- [`parkDistance`](#s-parkDistance) · function — used by [js/console/panels/nav.js](../console/panels/nav.js.md)
- [`tickAutopilot`](#s-tickAutopilot) · function — used by [js/console/panels/nav.js](../console/panels/nav.js.md), [js/sim/sim.js](../sim/sim.js.md), test/chart.test.mjs, test/marks.test.mjs
- [`apLeg`](#s-apLeg) · function — used by [js/console/panels/nav.js](../console/panels/nav.js.md), [js/mission/run.js](../mission/run.js.md)
- [`apPark`](#s-apPark) · function — used by [js/console/panels/nav.js](../console/panels/nav.js.md), [js/mission/run.js](../mission/run.js.md)
- [`apDock`](#s-apDock) · function — used by [js/console/panels/nav.js](../console/panels/nav.js.md), [js/mission/run.js](../mission/run.js.md)
- [`atSeam`](#s-atSeam) · function — used by [js/console/panels/nav.js](../console/panels/nav.js.md)
- [`apMine`](#s-apMine) · function — used by [js/console/panels/nav.js](../console/panels/nav.js.md), [js/mission/run.js](../mission/run.js.md), test/marks.test.mjs
- [`jumpEndedShort`](#s-jumpEndedShort) · function — used by [js/console/panels/nav.js](../console/panels/nav.js.md), [js/mission/run.js](../mission/run.js.md)
- [`wireAutopilot`](#s-wireAutopilot) · function — used by [js/console/panels/nav.js](../console/panels/nav.js.md), [js/ui/hud.js](../ui/hud.js.md)

## Effects

- **dom.id** — `aux-auto` (wireAutopilot:792) · `aux-auto-st` (wireAutopilot:793)
- **event.listen** — `click on btn → (inline)` (wireAutopilot:794)
- **timer** — `setInterval` (wireAutopilot:796)

## Symbols

### <a id="s-batteryCap"></a>`batteryCap(ship)`

function · L25–25

- calls: [`batteryCap`](ship.js.md#s-batteryCap) _js/flight/ship.js_
- called by: [`busOverload`](#s-busOverload) · [`powerThrottle`](#s-powerThrottle) ×2

<!-- note:batteryCap -->
package D's batteryCap(ship) once it lands; the rated battery until then
<!-- /note -->

### <a id="s-autopilot"></a>`autopilot`

const · **exported** · L27–54

<!-- note:autopilot -->
- L29 · `avoiding: null,` — what we are dodging, for the HUD
- L30 · `mode: "approach",` — warp | approach | mine — mirrored from the mission for the HUD and port control
- L31 · `targetId: null,` — the node this leg is about
- L32 · `phase: "idle",` — idle | climb | charge | align | ask | warp | cruise | brake | park | lane | mine | seek | dock | trade | undock | hold
- L33 · `task: "",` — for the HUD: what the current step is doing
- L39 · `seam: null,` — { x, y, z } the mining loop returns to
- L40 · `siteRock: null,` — 0.3.67: the key of the job seam's marked rock (field.js siteMarkRock)
- L43 · `skip: new Map(),` — rock key → sim time until which the loop leaves it alone
- L47 · `capNow: 1,` — the step's thrust cap, applied under the power rule
- L48 · `warpAllowed: null,` — node id the pilot answered JUMP for (warp policy "ask")
- L50 · `watch: { best: Infinity, since: 0 },` — the watchdog: an autopilot that cannot tell "being careful" from "boxed
  in" will sit in a belt braking at gravel until the player takes the stick
  back. These three measure progress and buy a way out of it.
- L51 · `ignore: blind,` — hazard id → sim time until which the solver may not look at it (shared with the assist)
- L52 · `unstick: null,` — { until, x, y, z, why } — a committed break-out burn
- L53 · `unstuckCount: 0,` — for the HUD and the tests: how often it had to
<!-- /note -->

### <a id="s-AP_STUCK"></a>`AP_STUCK`

const · **exported** · L56–56

<!-- note:AP_STUCK -->
How long the leg may make no progress before it is declared boxed in, and
how long the break-out burn runs. Measured rather than guessed: a cruise leg
closes on its target every second, and a mining drift between cells takes
about eight, so fourteen seconds of no closure is not caution.
<!-- /note -->

### <a id="s-AP_POWER"></a>`AP_POWER`

const · **exported** · L58–64

<!-- note:AP_POWER -->
---- the power rule -------------------------------------------------------

- L59 · `floor: 0.2,` — below this charge the mains go cold and the hull coasts
- L60 · `band: 0.6,` — above this the mains may dip into the battery
- L61 · `dipThrottle: 1.0,` — …to at most rated thrust
- L62 · `eco: 0.35,` — the least a leg is worth flying at (below it, coast)
- L63 · `warpMargin: 120,` — charge on top of the spool's own draw before a jump is asked for
<!-- /note -->

### <a id="s-sustainableThrottle"></a>`sustainableThrottle(ship)`

function · **exported** · L66–69

- calls: [`busIdle`](#s-busIdle)
- called by: [`mountPower`](../console/panels/ship.js.md#s-mountPower) _js/console/panels/ship.js_ · [`powerThrottle`](#s-powerThrottle)

<!-- note:sustainableThrottle -->
Throttle the reactor can carry indefinitely with everything else on the bus.
<!-- /note -->

### <a id="s-BUS_SWITCH"></a>`BUS_SWITCH`

const · L71–73

<!-- note:BUS_SWITCH -->
the consumers a pilot can switch off, as the switchboard labels them
<!-- /note -->

### <a id="s-busIdle"></a>`busIdle(ship)`

function · **exported** · L75–89

- calls: [`buildDemand`](ship.js.md#s-buildDemand) _js/flight/ship.js_ · [`lifeDraw`](ship.js.md#s-lifeDraw) _js/flight/ship.js_
- called by: [`tendBus`](../aria/play.js.md#s-tendBus) _js/aria/play.js_ · [`busOverload`](#s-busOverload) · [`sustainableThrottle`](#s-sustainableThrottle) · [`EXEC.CHARGE`](../mission/run.js.md#s-EXEC-CHARGE) _js/mission/run.js_

<!-- note:busIdle -->
The bus at zero throttle as the pilot has it SWITCHED — not as a brownout
happens to have shed it this frame. Reading ship.powered here was how a
latched brownout made a bus that cannot carry itself look sustainable.
<!-- /note -->

### <a id="s-busOverload"></a>`busOverload(ship)`

function · **exported** · L91–103

- calls: [`batteryCap`](#s-batteryCap) · [`busIdle`](#s-busIdle)
- called by: [`tickAriaPilot`](../aria/pilot.js.md#s-tickAriaPilot) _js/aria/pilot.js_ · [`powerThrottle`](#s-powerThrottle) · [`tickAutopilot`](#s-tickAutopilot) · [`sampleWorld`](../ui/hud.js.md#s-sampleWorld) _js/ui/hud.js_

<!-- note:busOverload -->
Can the autopilot fly at all? Evaluated fresh every time it is asked —
0.3 kept this as a flag that only powerThrottle refreshed, and powerThrottle
never ran again once the autopilot had stood down, so after the pilot shed
shields and the cutter every re-engage stood down on the stale verdict.
Over = the battery is at the floor AND the switched-on bus at idle leaves
the core (almost) nothing to refill it with.
<!-- /note -->

### <a id="s-warpReserve"></a>`warpReserve()`

function · **exported** · L105–107

- calls: [`spoolTime`](../sim/sim.js.md#s-spoolTime) _js/sim/sim.js_
- called by: [`apLeg`](#s-apLeg) ×2 · [`powerThrottle`](#s-powerThrottle) ×2 · [`beginAsk`](../mission/run.js.md#s-beginAsk) _js/mission/run.js_

<!-- note:warpReserve -->
What a jump needs in the battery before the core is asked to spool.
<!-- /note -->

### <a id="s-powerThrottle"></a>`powerThrottle(ship, want, jumpAhead=)`

function · **exported** · L109–130

- calls: [`batteryCap`](#s-batteryCap) ×2 · [`busOverload`](#s-busOverload) · [`sustainableThrottle`](#s-sustainableThrottle) · [`warpReserve`](#s-warpReserve) ×2
- called by: [`apSteer`](#s-apSteer)

<!-- note:powerThrottle -->
The throttle this leg may fly at right now. `want` is what the leg would
like (0..1); `jumpAhead` keeps a spool's reserve untouched.

- L117 · `if (frac > AP_POWER.floor) cap = Math.max(cap, AP_POWER.eco);` — a bus with no spare still has to get somewhere: above the floor the leg
  may fly at eco on the battery; at the floor it coasts, and if the reactor
  cannot even carry the idle bus the pilot has to shed something
- L122 · `if (autopilot.on && autopilot.coasting && !wasCoasting && !bus.over) {` — say so: a ship sitting still under a live autopilot with no word why reads as broken
- L127 · `if (t > 0 && t < AP_POWER.eco * 0.5) t = 0;` — not worth the draw: coast
<!-- /note -->

### <a id="s-drifting"></a>`drifting(target, frameVel, allowed, wasBraking=)`

function · **exported** · L132–142

- called by: [`apDock`](#s-apDock) ×2 · [`apLeg`](#s-apLeg)

<!-- note:drifting -->
Sliding past the target instead of closing on it.

The cruise and lane rules only ever capped TOTAL relative speed, and thrust
only ever pointed at the target — so a hull carrying sideways speed settled
into an orbit: brake one frame, thrust inward the next, speed pinned at the
cap and the thrust exactly the centripetal pull. From the cockpit that is the
approach circling a port at 4–5 km forever. A lateral component bigger than a
third of the allowed speed (or any real opening speed) is killed first.

- L139 · `const k = wasBraking ? 0.6 : 1;` — hysteresis: once braking for drift, brake it well down
<!-- /note -->

### <a id="s-PARK_RADII"></a>`PARK_RADII`

const · L144–144

<!-- note:PARK_RADII -->
---- engage / release (the HUD and chart buttons build one-step missions) ----
<!-- /note -->

### <a id="s-PORT_PARK"></a>`PORT_PARK`

const · L145–145

<!-- note:PORT_PARK -->
<!-- /note -->

### <a id="s-POINT_PARK"></a>`POINT_PARK`

const · L146–146

<!-- note:POINT_PARK -->
<!-- /note -->

### <a id="s-DEAD_SLOW"></a>`DEAD_SLOW`

const · L147–147

<!-- note:DEAD_SLOW -->
<!-- /note -->

### <a id="s-APPROACH_GAIN"></a>`APPROACH_GAIN`

const · L148–148

<!-- note:APPROACH_GAIN -->
<!-- /note -->

### <a id="s-ROCK_STANDOFF"></a>`ROCK_STANDOFF`

const · L149–149

<!-- note:ROCK_STANDOFF -->
<!-- /note -->

### <a id="s-SEAM_REACH"></a>`SEAM_REACH`

const · L150–150

<!-- note:SEAM_REACH -->
<!-- /note -->

### <a id="s-ALIGN_CEILING"></a>`ALIGN_CEILING`

const · L151–151

<!-- note:ALIGN_CEILING -->
<!-- /note -->

### <a id="s-BELT_CLEAR"></a>`BELT_CLEAR`

const · L152–152

<!-- note:BELT_CLEAR -->
How far above the rock layer to climb before plotting.

Climbing does NOT remove the belt crossing from the plot — the crossing is
an annulus test on radius, and you are standing in the annulus; the lane
still reads "BELT 0–3%" and the core still rolls its 35%. What it changes is
where a dropout PUTS you. Dropping out at 3% of the lane from 0 u altitude
lands the hull inside the rock layer at 140 u/s with the toast that says so;
dropping out from 7 km up lands it in clean space above the layer, where it
can turn round and go again. Same odds, survivable outcome.
<!-- /note -->

### <a id="s-_p"></a>`_p`

const · L153–153

<!-- note:_p -->
<!-- /note -->

### <a id="s-_v"></a>`_v`

const · L154–154

<!-- note:_v -->
<!-- /note -->

### <a id="s-_w"></a>`_w`

const · L155–155

<!-- note:_w -->
<!-- /note -->

### <a id="s-planDefaults"></a>`planDefaults()`

function · **exported** · L157–160

- called by: [`engageAutopilot`](#s-engageAutopilot) · [`engageJobLoop`](#s-engageJobLoop) · [`engageMiningLoop`](#s-engageMiningLoop) · [`engageSalvageLoop`](#s-engageSalvageLoop)

<!-- note:planDefaults -->
The HUD's default plan for one-step missions (NAV › AUTOPILOT edits it).
<!-- /note -->

### <a id="s-refOfNode"></a>`refOfNode(node)`

function · L162–164

- called by: [`engageAutopilot`](#s-engageAutopilot)

<!-- note:refOfNode -->
<!-- /note -->

### <a id="s-engageAutopilot"></a>`engageAutopilot(targetId=, mode=)`

function · **exported** · L166–185

- calls: [`engageMiningLoop`](#s-engageMiningLoop) · [`planDefaults`](#s-planDefaults) · [`refOfNode`](#s-refOfNode) · [`startMission`](../mission/run.js.md#s-startMission) _js/mission/run.js_ · [`oneStep`](../mission/script.js.md#s-oneStep) _js/mission/script.js_ · [`logEvent`](../sim/sim.js.md#s-logEvent) _js/sim/sim.js_ · [`selectBody`](../sim/sim.js.md#s-selectBody) _js/sim/sim.js_ · [`setNoticeAbout`](../sim/sim.js.md#s-setNoticeAbout) _js/sim/sim.js_ · [`warpNodeById`](../sim/sim.js.md#s-warpNodeById) _js/sim/sim.js_
- via [js/npc/captain.js](../npc/captain.js.md): `ariaHooks.onPlayerJob`
- via [js/sim/sim.js](../sim/sim.js.md): `sim.scanned.has`
- called by: [`engageAutoWarp`](#s-engageAutoWarp) · [`toggleAutopilot`](#s-toggleAutopilot) · [`toggleDock`](../sim/sim.js.md#s-toggleDock) _js/sim/sim.js_ · [`mountMap.run~2`](../ui/map.js.md#s-mountMap-run-2) _js/ui/map.js_

<!-- note:engageAutopilot -->
<!-- /note -->

### <a id="s-engageAutoWarp"></a>`engageAutoWarp(targetId=)`

function · **exported** · L187–189

- calls: [`engageAutopilot`](#s-engageAutopilot)
- called by: [`mountMap`](../ui/map.js.md#s-mountMap) _js/ui/map.js_ · [`mountMap.run`](../ui/map.js.md#s-mountMap-run) _js/ui/map.js_

<!-- note:engageAutoWarp -->
Chart shortcut: align and jump, then hand the stick back.
<!-- /note -->

### <a id="s-engageMiningLoop"></a>`engageMiningLoop(seam=)`

function · **exported** · L191–220

- calls: [`jobForSite`](../economy/contracts.js.md#s-jobForSite) _js/economy/contracts.js_ · [`engageJobLoop`](#s-engageJobLoop) · [`nearestSeam`](#s-nearestSeam) · [`planDefaults`](#s-planDefaults) · [`startMission`](../mission/run.js.md#s-startMission) _js/mission/run.js_ · [`makeMission`](../mission/script.js.md#s-makeMission) _js/mission/script.js_ · [`makeStep`](../mission/script.js.md#s-makeStep) _js/mission/script.js_ ×7 · [`logEvent`](../sim/sim.js.md#s-logEvent) _js/sim/sim.js_ · [`setNoticeAbout`](../sim/sim.js.md#s-setNoticeAbout) _js/sim/sim.js_ · [`inBelt`](../world/field.js.md#s-inBelt) _js/world/field.js_
- via [js/npc/captain.js](../npc/captain.js.md): `ariaHooks.onPlayerJob`
- called by: [`engageAutopilot`](#s-engageAutopilot) · [`renderHeld`](../ui/boardview.js.md#s-renderHeld) _js/ui/boardview.js_ · [`mountMap`](../ui/map.js.md#s-mountMap) _js/ui/map.js_ · [`mountMap.run~8`](../ui/map.js.md#s-mountMap-run-8) _js/ui/map.js_

<!-- note:engageMiningLoop -->
The mining loop as a mission. `seam` is where the cutter goes to work — a
belt point off the chart, a probe drop, or (default) the nearest belt.
`sim.autoPlan.onDock` picks the desk step, `sim.autoPlan.loop` the repeat.

- L198 · `const job = s.site ? jobForSite(s.site) : null;` — 0.3.72: MINE IT on a delivery job flies the JOB, not the market loop: cut
  until the order is aboard, dock at the desk that ordered it, deliver, sell
  only what is left over — and stop once it is paid. The plain loop sold the
  job's ore at the best bidder and never went to the desk at all.
<!-- /note -->

### <a id="s-engageSalvageLoop"></a>`engageSalvageLoop({…}=)`

function · **exported** · L222–255

- calls: [`planDefaults`](#s-planDefaults) · [`startMission`](../mission/run.js.md#s-startMission) _js/mission/run.js_ · [`bestHulk`](../mission/salvage.js.md#s-bestHulk) _js/mission/salvage.js_ · [`makeMission`](../mission/script.js.md#s-makeMission) _js/mission/script.js_ · [`makeStep`](../mission/script.js.md#s-makeStep) _js/mission/script.js_ ×8 · [`logEvent`](../sim/sim.js.md#s-logEvent) _js/sim/sim.js_ · [`setNoticeAbout`](../sim/sim.js.md#s-setNoticeAbout) _js/sim/sim.js_ · [`hulkById`](../world/hulks.js.md#s-hulkById) _js/world/hulks.js_
- via [js/npc/captain.js](../npc/captain.js.md): `ariaHooks.onPlayerJob`
- called by: [`mountAutopilot`](../console/panels/nav.js.md#s-mountAutopilot) _js/console/panels/nav.js_ · [`renderHeld`](../ui/boardview.js.md#s-renderHeld) _js/ui/boardview.js_

<!-- note:engageSalvageLoop -->
0.3.90 — the salvage loop a pilot starts by hand: the hulk under the lock if
there is one, else the best in the sky; cut until the hold is full; sell at
the best buyer; and back out if LOOP is on. Hulk-bound and plate jobs fly
the same thing with the job's own port and count.
<!-- /note -->

### <a id="s-engageJobLoop"></a>`engageJobLoop(job)`

function · L257–276

- calls: [`goodName`](../economy/materials.js.md#s-goodName) _js/economy/materials.js_ · [`planDefaults`](#s-planDefaults) · [`startMission`](../mission/run.js.md#s-startMission) _js/mission/run.js_ · [`makeMission`](../mission/script.js.md#s-makeMission) _js/mission/script.js_ · [`makeStep`](../mission/script.js.md#s-makeStep) _js/mission/script.js_ ×5 · [`logEvent`](../sim/sim.js.md#s-logEvent) _js/sim/sim.js_ · [`setNoticeAbout`](../sim/sim.js.md#s-setNoticeAbout) _js/sim/sim.js_
- called by: [`engageMiningLoop`](#s-engageMiningLoop)

<!-- note:engageJobLoop -->
<!-- /note -->

### <a id="s-disengageAutopilot"></a>`disengageAutopilot(why=)`

function · **exported** · L278–281

- calls: [`stopMission`](../mission/run.js.md#s-stopMission) _js/mission/run.js_
- called by: [`toggleAutopilot`](#s-toggleAutopilot) · [`launchSim`](../sim/sim.js.md#s-launchSim) _js/sim/sim.js_ · [`toggleDock`](../sim/sim.js.md#s-toggleDock) _js/sim/sim.js_ · [`mountMap`](../ui/map.js.md#s-mountMap) _js/ui/map.js_

<!-- note:disengageAutopilot -->
Stops whatever mission is flying (or is parked paused) and hands the stick back.
<!-- /note -->

### <a id="s-releaseControls"></a>`releaseControls()`

function · **exported** · L283–311

- calls: [`setInjectedPan`](../core/input.js.md#s-setInjectedPan) _js/core/input.js_ · [`clearAvoidCommit`](avoid.js.md#s-clearAvoidCommit) _js/flight/avoid.js_ · [`setMiningMode`](../sim/sim.js.md#s-setMiningMode) _js/sim/sim.js_ · [`setRigMode`](../sim/sim.js.md#s-setRigMode) _js/sim/sim.js_ · [`setThrottle`](../sim/sim.js.md#s-setThrottle) _js/sim/sim.js_ · [`toggleWarp`](../sim/sim.js.md#s-toggleWarp) _js/sim/sim.js_
- called by: [`pauseMission`](../mission/run.js.md#s-pauseMission) _js/mission/run.js_ · [`stopMission`](../mission/run.js.md#s-stopMission) _js/mission/run.js_

<!-- note:releaseControls -->
Drop the controls at zero: the stick comes back the way a spring throttle should.

- L285 · `if (autopilot.on && sim.warp.state === "spool") toggleWarp();` — a jump the autopilot spooled is the autopilot's: stopping it must not
  leave the core counting down to a jump nobody is flying any more
<!-- /note -->

### <a id="s-toggleAutopilot"></a>`toggleAutopilot()`

function · **exported** · L313–317

- calls: [`disengageAutopilot`](#s-disengageAutopilot) · [`engageAutopilot`](#s-engageAutopilot) · [`resumeMission`](../mission/run.js.md#s-resumeMission) _js/mission/run.js_
- called by: [`wireAutopilot`](#s-wireAutopilot)

<!-- note:toggleAutopilot -->
<!-- /note -->

### <a id="s-cycleAutoPlan"></a>`cycleAutoPlan()`

function · **exported** · L319–324

<!-- note:cycleAutoPlan -->
Cycle what the loop does with a full hold.
<!-- /note -->

### <a id="s-nearestSeam"></a>`nearestSeam()`

function · **exported** · L326–337

- calls: [`dist3`](../world/bodies.js.md#s-dist3) _js/world/bodies.js_ ×2
- called by: [`rawPlanJob`](../aria/pilot.js.md#s-rawPlanJob) _js/aria/pilot.js_ · [`mountAutopilot`](../console/panels/nav.js.md#s-mountAutopilot) _js/console/panels/nav.js_ · [`engageMiningLoop`](#s-engageMiningLoop) · [`resolve`](../mission/run.js.md#s-resolve) _js/mission/run.js_ · [`sampleWorld`](../ui/hud.js.md#s-sampleWorld) _js/ui/hud.js_

<!-- note:nearestSeam -->
---- helpers -------------------------------------------------------------

- L329 · `for (const [b, name] of [[currentSystem.belt, "the belt"], [currentSystem.outerBelt, "the` — sample each annulus at the ship's own bearing: the closest stretch of belt
<!-- /note -->

### <a id="s-threatAt"></a>`threatAt`

const · L339–339

<!-- note:threatAt -->
Steer at a point; `want` is the leg's ideal throttle, shaped by the cap and the power rule.

The solver is not cheap enough to run per frame and does not need to be:
at five hertz a hazard twenty seconds out is still seen a hundred times
before it matters.
<!-- /note -->

### <a id="s-threat"></a>`threat`

const · L340–340

<!-- note:threat -->
<!-- /note -->

### <a id="s-apThreat"></a>`apThreat()`

function · **exported** · L342–342

<!-- note:apThreat -->
<!-- /note -->

### <a id="s-refreshThreat"></a>`refreshThreat(force=)`

function · **exported** · L344–350

- calls: [`deliberate`](avoid.js.md#s-deliberate) _js/flight/avoid.js_ · [`surfaceOnly`](avoid.js.md#s-surfaceOnly) _js/flight/avoid.js_ · [`threatTo`](avoid.js.md#s-threatTo) _js/flight/avoid.js_
- called by: [`apSteer`](#s-apSteer)

<!-- note:refreshThreat -->
<!-- /note -->

### <a id="s-apProgress"></a>`apProgress(dist, floor=)`

function · **exported** · L352–362

- called by: [`apDock`](#s-apDock) · [`apLeg`](#s-apLeg) ×2 · [`apMine`](#s-apMine)

<!-- note:apProgress -->
---- the watchdog ---------------------------------------------------------

Avoidance is a negotiation with the world and it can lose. Inside a belt the
old solver would brake at a pebble, lose steerage, find the pebble again and
brake harder — and the only thing that ever broke the cycle was the player
taking the stick. So the autopilot now measures whether it is actually
getting anywhere, and when it is not, it stops being polite.

Two escapes, in order of how much they give up:
  1. a committed break-out burn along the cheapest way out — straight up or
     down out of the belt disc if we are in one, otherwise along whichever
     way round the dodge was already committed to, and
  2. a blind window on the hazard that boxed us in, so the solver stops
     re-raising the same alarm the moment we start moving again.

- L356 · `if (dist < w.best - Math.max(40, w.best * 0.0015)) { w.best = dist; w.since = sim.time; re` — "closer" has to mean meaningfully closer, or jitter on a 300 km leg reads
  as progress forever
- L357 · `if (dist <= floor) { w.best = Math.min(w.best, dist); w.since = sim.time; return false; }` — The last few hundred metres are SUPPOSED to crawl — that is the braking
  curve, not an obstruction — so the watchdog stands down on the doorstep
  and leaves the terminal approach to apPark, which converges on its own.
- L359 · `const sp = Math.hypot(sim.ship.vel.x, sim.ship.vel.y, sim.ship.vel.z);` — Being slow is not being stuck. Fire only when something is in the way, or
  when the hull has effectively stopped and is not getting going again.
<!-- /note -->

### <a id="s-resetProgress"></a>`resetProgress(dist=)`

function · **exported** · L364–367

- called by: [`apDock`](#s-apDock) · [`apLeg`](#s-apLeg) · [`apMine`](#s-apMine) ×2 · [`apUnstick`](#s-apUnstick) · [`beginUnstick`](#s-beginUnstick) · [`beginStep`](../mission/run.js.md#s-beginStep) _js/mission/run.js_

<!-- note:resetProgress -->
<!-- /note -->

### <a id="s-beginUnstick"></a>`beginUnstick(why=)`

function · **exported** · L369–392

- calls: [`resetProgress`](#s-resetProgress) · [`avoidCommit`](avoid.js.md#s-avoidCommit) _js/flight/avoid.js_ · [`clearAvoidCommit`](avoid.js.md#s-clearAvoidCommit) _js/flight/avoid.js_ · [`forwardOf`](ship.js.md#s-forwardOf) _js/flight/ship.js_ · [`logEvent`](../sim/sim.js.md#s-logEvent) _js/sim/sim.js_ · [`beltExit`](../world/field.js.md#s-beltExit) _js/world/field.js_
- called by: [`apDock`](#s-apDock) · [`apLeg`](#s-apLeg) ×2 · [`apMine`](#s-apMine)

<!-- note:beginUnstick -->
- L374 · `ax = 0; ay = ex.sign; az = 0;` — A belt is six kilometres thick and three hundred thousand wide. Up is
  always the short way out, and above the layer there is nothing to dodge.
<!-- /note -->

### <a id="s-apUnstick"></a>`apUnstick()`

function · **exported** · L394–403

- calls: [`apSteer`](#s-apSteer) · [`resetProgress`](#s-resetProgress)
- called by: [`apDock`](#s-apDock) · [`apLeg`](#s-apLeg) · [`apMine`](#s-apMine)

<!-- note:apUnstick -->
True while a break-out burn owns the ship; it flies it as a side effect.
<!-- /note -->

### <a id="s-apSteer"></a>`apSteer(tx, ty, tz, want, opts=)`

function · **exported** · L405–449

- calls: [`setInjectedPan`](../core/input.js.md#s-setInjectedPan) _js/core/input.js_ · [`powerThrottle`](#s-powerThrottle) · [`refreshThreat`](#s-refreshThreat) · [`avoidAim`](avoid.js.md#s-avoidAim) _js/flight/avoid.js_ · [`avoidLevel`](avoid.js.md#s-avoidLevel) _js/flight/avoid.js_ · [`forwardOf`](ship.js.md#s-forwardOf) _js/flight/ship.js_ · [`setThrottle`](../sim/sim.js.md#s-setThrottle) _js/sim/sim.js_ ×2
- called by: [`apDock`](#s-apDock) ×3 · [`apLeg`](#s-apLeg) ×3 · [`apMine`](#s-apMine) ×3 · [`apPark`](#s-apPark) · [`apUnstick`](#s-apUnstick) · [`flyTheLane`](#s-flyTheLane) ×2

<!-- note:apSteer -->
Steer at a point — going around anything in the way.

Every autopilot mode flies through here, which is why the avoidance lives
in this one function rather than in each of them: the hull used to drive
into rocks and station hulls at whatever throttle the leg had asked for,
because nothing between the plan and the thrusters ever looked ahead.

- L408 · `const policy = o.avoid ?? "full";` — "full" dodges anything the solver raises; "soft" only reacts once the
  thing is genuinely close, which is what an alignment or a break-out burn
  needs — a leg that re-aims five times a second never finishes anything;
  "off" is for steps that are flying at a hazard on purpose.
- L419 · `if (level >= 2) want = Math.max(0.12, Math.min(want, 0.22));` — Steering alone only works while there is time to turn. Inside that,
  shed speed as well; inside *that*, brake — but do NOT stop steering.
  Zeroing the stick here was the deadlock: a hull that brakes without
  turning stops in front of the same hazard and brakes at it again.
- L435 · `setInjectedPan({ x: Math.max(-1, Math.min(1, -ey * 1.7)), y: Math.max(-1, Math.min(1, ep *` — stick-right REDUCES yaw in the flight model — the error goes in negated
- L445 · `const idle = level > 0 ? Math.min(want, 0.22) : 0.05;` — A hull that is dodging is trying to get PAST something, so the usual
  "barely move until you are pointed at it" shaping is wrong here: the aim
  point is 90° off by construction, and 5% throttle beside a moon is how a
  leg spends four minutes going nowhere.
<!-- /note -->

### <a id="s-_avoid"></a>`_avoid`

const · L451–451

<!-- note:_avoid -->
<!-- /note -->

### <a id="s-matchFrame"></a>`matchFrame(v, forS=)`

function · **exported** · L453–457

- called by: [`apLeg`](#s-apLeg) · [`apPark`](#s-apPark)

<!-- note:matchFrame -->
0.3.92: the frame is held for 2.5 s, not 0.5. A hitch — a tab coming back, a
long frame on a phone — ran the sim on for half a second without the
autopilot, the frame lapsed to the nearest world's, and a ship parked 30 u
off a hulk in another frame let it leave at 40 u/s: seventy seconds to get
back. It is dropped at once when the autopilot lets go.
<!-- /note -->

### <a id="s-LANE_DRIFT"></a>`LANE_DRIFT`

const · L459–459

<!-- note:LANE_DRIFT -->
FLY THE LANE — how a pilot lines up for a jump (0.3.51).

The ship should be MOVING where it points. Coming out of a climb it is
doing hundreds of u/s in some other direction, and the lane is somewhere
else. Swinging the nose onto the lane first and braking after is what flew
the hull sideways — for the whole brake. So, like a pilot:

  1. carrying real drift off the lane: nose ALONG the motion and brake —
     the canopy shows you slowing down, not sliding past
  2. slow enough: pivot onto the lane (a turn at a walk is quick)
  3. on the lane: mains, and the core

Relative to the well you are in, because that is what the canopy shows
sliding past. Returns the off-lane speed still being carried.
<!-- /note -->

### <a id="s-PIVOT_SPEED"></a>`PIVOT_SPEED`

const · L460–460

<!-- note:PIVOT_SPEED -->
<!-- /note -->

### <a id="s-flyTheLane"></a>`flyTheLane(node, want=)`

function · **exported** · L461–483

- calls: [`apSteer`](#s-apSteer) ×2 · [`setThrottle`](../sim/sim.js.md#s-setThrottle) _js/sim/sim.js_ ×2 · [`warpDestination`](../sim/sim.js.md#s-warpDestination) _js/sim/sim.js_
- called by: [`apLeg`](#s-apLeg) ×2

<!-- note:flyTheLane -->
- L473 · `apSteer(ship.pos.x + (vx / sp) * 1e6, ship.pos.y + (vy / sp) * 1e6, ship.pos.z + (vz / sp)` — 1: nose on the flight path, shed it
- L479 · `apSteer(dest.x, dest.y, dest.z, drifting ? 0 : want, { jumpAhead: true, avoid: "soft" });` — 2 and 3: onto the lane; a little drift left at a walk is braked out as it turns
<!-- /note -->

### <a id="s-apHold"></a>`apHold()`

function · **exported** · L485–488

- calls: [`setInjectedPan`](../core/input.js.md#s-setInjectedPan) _js/core/input.js_ · [`setThrottle`](../sim/sim.js.md#s-setThrottle) _js/sim/sim.js_
- called by: [`apDock`](#s-apDock) · [`apLeg`](#s-apLeg) ×4 · [`apPark`](#s-apPark) · [`tickAutopilot`](#s-tickAutopilot) · [`EXEC.CHARGE`](../mission/run.js.md#s-EXEC-CHARGE) _js/mission/run.js_ · [`EXEC.GOTO`](../mission/run.js.md#s-EXEC-GOTO) _js/mission/run.js_ ×3 · [`EXEC.HOLD`](../mission/run.js.md#s-EXEC-HOLD) _js/mission/run.js_ · [`EXEC.MINE`](../mission/run.js.md#s-EXEC-MINE) _js/mission/run.js_ ×2 · [`EXEC.WAIT`](../mission/run.js.md#s-EXEC-WAIT) _js/mission/run.js_ · [`ensureUndocked`](../mission/run.js.md#s-ensureUndocked) _js/mission/run.js_

<!-- note:apHold -->
<!-- /note -->

### <a id="s-pilotInput"></a>`pilotInput()`

function · **exported** · L490–492

- called by: [`tickAriaPilot`](../aria/pilot.js.md#s-tickAriaPilot) _js/aria/pilot.js_ · [`tickAutopilot`](#s-tickAutopilot)

<!-- note:pilotInput -->
Player touched anything that flies the ship.
<!-- /note -->

### <a id="s-relSpeedTo"></a>`relSpeedTo(vel)`

function · **exported** · L494–497

- called by: [`apDock`](#s-apDock) · [`apLeg`](#s-apLeg) · [`apPark`](#s-apPark)

<!-- note:relSpeedTo -->
<!-- /note -->

### <a id="s-bestPortFor"></a>`bestPortFor(plan=)`

function · **exported** · L499–518

- calls: [`preferenceFor`](../aria/aria.js.md#s-preferenceFor) _js/aria/aria.js_ · [`canSmeltAt`](../sim/sim.js.md#s-canSmeltAt) _js/sim/sim.js_ · [`sellPriceAt`](../sim/sim.js.md#s-sellPriceAt) _js/sim/sim.js_ · [`dist3`](../world/bodies.js.md#s-dist3) _js/world/bodies.js_
- called by: [`resolve`](../mission/run.js.md#s-resolve) _js/mission/run.js_ · [`startMission`](../mission/run.js.md#s-startMission) _js/mission/run.js_

<!-- note:bestPortFor -->
The port worth the trip for this hold: nearest that pays, or can smelt, or any port.

- L513 · `const pref = preferenceFor("port", st.id);` — a thumb on the scale for the port you actually use. It is a lean, not a
  rule — the autopilot still finds you the better price, it just stops
  driving past the desk you always sell at to do it.
- L513 · `const pref = preferenceFor("port", st.id);` — (a lean on a negative score has to divide, or it pushes the favourite AWAY — 0.3.19)
<!-- /note -->

### <a id="s-parkDistance"></a>`parkDistance(node)`

function · **exported** · L520–523

- called by: [`apLeg`](#s-apLeg) · [`apPark`](#s-apPark)

<!-- note:parkDistance -->
<!-- /note -->

### <a id="s-tickAutopilot"></a>`tickAutopilot(dt)`

function · **exported** · L525–553

- calls: [`apHold`](#s-apHold) · [`busOverload`](#s-busOverload) · [`pilotInput`](#s-pilotInput) · [`restoreRun`](../mission/run.js.md#s-restoreRun) _js/mission/run.js_ · [`stopMission`](../mission/run.js.md#s-stopMission) _js/mission/run.js_ ×3 · [`tickMission`](../mission/run.js.md#s-tickMission) _js/mission/run.js_ · [`setMiningMode`](../sim/sim.js.md#s-setMiningMode) _js/sim/sim.js_ · [`setRigMode`](../sim/sim.js.md#s-setRigMode) _js/sim/sim.js_
- via [js/npc/captain.js](../npc/captain.js.md): `ariaHooks.onStick`
- called by: [`stepWorld`](../sim/sim.js.md#s-stepWorld) _js/sim/sim.js_

<!-- note:tickAutopilot -->
---- the tick ---------------------------------------------------------------

- L527 · `sim.handsOff = autopilot.on || captain.holder !== "player";` — who is flying, for anything that wants to know whether a choice was YOURS
  — js/aria/aria.js only learns from the player's own hands
- L532 · `if (captain.holder === "aria") { ariaHooks.onStick?.(); return; }` — the stick is the pilot's: touching it takes the ship back from ARIA too
- L541 · `autopilot.cutterWas = null;` — the pilot is about to shed load: do not switch the cutter back on under them
- L545 · `const op = mission.active?.steps[mission.stepIx]?.op;` — the cutter is the biggest optional draw on the bus: it only runs while a MINE step is cutting.
  cutterWas is the PILOT's setting, taken once at engage (mission/run.js startMission) — 0.3
  re-took it every tick, so a cutter apMine had switched on came back on at stand-down
<!-- /note -->

### <a id="s-apLeg"></a>`apLeg(node, {…}=)`

function · **exported** · L555–646

- calls: [`apHold`](#s-apHold) ×4 · [`apProgress`](#s-apProgress) ×2 · [`apSteer`](#s-apSteer) ×3 · [`apUnstick`](#s-apUnstick) · [`beginUnstick`](#s-beginUnstick) ×2 · [`drifting`](#s-drifting) · [`flyTheLane`](#s-flyTheLane) ×2 · [`matchFrame`](#s-matchFrame) · [`parkDistance`](#s-parkDistance) · [`relSpeedTo`](#s-relSpeedTo) · [`resetProgress`](#s-resetProgress) · [`warpReserve`](#s-warpReserve) ×2 · [`plotRoute`](../sim/sim.js.md#s-plotRoute) _js/sim/sim.js_ · [`requestJump`](../sim/sim.js.md#s-requestJump) _js/sim/sim.js_ · [`setNavTarget`](../sim/sim.js.md#s-setNavTarget) _js/sim/sim.js_ · [`setThrottle`](../sim/sim.js.md#s-setThrottle) _js/sim/sim.js_ ×2 · [`warpBlock`](../sim/sim.js.md#s-warpBlock) _js/sim/sim.js_ · [`warpDestination`](../sim/sim.js.md#s-warpDestination) _js/sim/sim.js_ ×2 · [`bodyPosition`](../world/bodies.js.md#s-bodyPosition) _js/world/bodies.js_ · [`dist3`](../world/bodies.js.md#s-dist3) _js/world/bodies.js_ · [`beltExit`](../world/field.js.md#s-beltExit) _js/world/field.js_

<!-- note:apLeg -->
A leg: climb out of a well, wait for charge, align and jump (per the warp
policy), then the sublight fall with braking room priced in. Returns
"flying" while it has the ship, "near" once the target is inside its park
distance, "asking" when policy "ask" wants an answer, "blocked:&lt;why>" when
the core cannot be used and the leg cannot go on.

- L562 · `` if (sim.warp.state === "spool") { autopilot.phase = "warp"; autopilot.task = `spool · ${no `` — 0.3.51: a spool is flown, not held. apHold() let whatever velocity the
  climb had built carry on while the nose sat on the lane, so for the whole
  spool the hull slid backwards and sideways at ~600 u/s — measured 125–138°
  between the nose and the flight path. Keep the nose on the lane and trim
  off anything that is not along it, so the ship is moving where it points.
- L565 · `if (apUnstick()) return "flying";` — A break-out burn owns the ship until it is done.
- L568 · `const ex = beltExit(sim.ship.pos, BELT_CLEAR);` — Rocks before wells.
  
  Aligning for a jump inside a belt cannot work: the avoidance rewrites
  the aim five times a second to miss gravel, the 10° alignment gate never
  closes, and the leg loops forever trying to warp — which is exactly what
  it looked like from the cockpit. A belt is a thin disc, so the answer is
  not to fight through it but to climb out of it; above the layer there is
  no gravel to dodge and the plot is clean. It costs a few seconds.
- L568 · `const ex = beltExit(sim.ship.pos, BELT_CLEAR);` — Climbing, charging, aligning and clearing the rocks all stand still with
  respect to the target on purpose, so the progress watchdog has nothing to
  measure and must not arm — otherwise a perfectly healthy spool reads as
  being boxed in and the leg breaks out of its own alignment.
- L574 · `apSteer(ship.pos.x, ship.pos.y + ex.sign * 2e5, ship.pos.z, 0.85, { jumpAhead: true });` — full avoidance here, not soft: this is the one leg that is flown
  THROUGH the rocks on purpose, and there is no alignment gate to
  protect. The watchdog measures the climb itself — a hull that has
  stopped gaining altitude has something on the nose.
- L578 · `const blk = warpBlock(node.id);` — live, not last tick's — the target may have just changed
- L586 · `const rx = dx / d, ry = dy / d, rz = dz / d;` — 0.3.51: climb out TOWARD the lane, not straight up. Straight up left
  the hull doing 800 u/s at right angles to where it was going, so it
  came about and slid sideways for the length of the brake. Tilted, the
  climb still gains height on every tick (the radial part is never less
  than half) and most of its speed is already along the lane.
- L591 · `let px = lx - lr * rx, py = ly - lr * ry, pz = lz - lr * rz;` — the lane, across the well
- L594 · `const tilt = lr > 0 ? 1.6 : 1.0;` — target outward: lean further in
- L601 · `autopilot.phase = "charge";` — the core wants a full battery: mains off, hold attitude, let the reactor catch up
- L615 · `const sp = Math.hypot(ship.vel.x, ship.vel.y, ship.vel.z);` — Coming about is not a reason to keep accelerating. A leg that aligns,
  waits out a cooldown, aligns again — which is what a run of dropouts
  looks like — used to add 0.3 throttle every pass and end up hundreds of
  thousands of units off on a vector nobody asked for. Above the align
  ceiling the mains come off and the brake goes on; the nose still swings.
- L617 · `const drift = flyTheLane(node, fast ? 0 : 0.3);` — soft: hold the lane unless something is genuinely about to be hit. A
  full dodge here fights the alignment gate and neither ever wins.
  0.3.51: and coming about sheds the drift the climb left, rather than
  carrying it sideways into the spool.
- L620 · `` if (drift > LANE_DRIFT * 2) { autopilot.task = `align · ${node.name} · trimming ${Math.rou `` — and the core is not lit until the hull is moving where it points
- L632 · `node.vel(_v);` — the fall down the well
- L641 · `if (rel > allowed * (wasBraking ? 0.9 : 1.05) || drifting(_p, _v, allowed, wasBraking)) {` — a deadband, or the HUD flickers cruise/brake every other frame on the
  approach and the throttle chatters with it. (It never worked: the phase
  had already been overwritten with "cruise" two lines up.)
- L642 · `` if (apProgress(dist, Math.max(park * 4, 2000))) beginUnstick(autopilot.avoiding ? `${autop `` — this is the only part of a leg that is supposed to close the range, so
  it is the only part the watchdog judges

- L626 · `if (sim.selected !== node.id) setNavTarget(node.id);` — 0.3.88: the signature lock breaks when the nose swings 60° off the
  target (a belt climb, an avoid, a breakout) and takes the jump target
  with it. The jump key reads sim.selected, so without this the leg asked
  for a jump forever — "warp unavailable, no target" — and drifted.

- L638 · `const allowed = Math.max(DEAD_SLOW, (dist - park) * (node.gain && dist < (node.gainR ?? 0)` — a node may ask for a brisker last approach inside its own radius; from
  further out that gain arrives too fast to stop and sails past
<!-- /note -->

### <a id="s-apPark"></a>`apPark(node)`

function · **exported** · L648–667

- calls: [`apHold`](#s-apHold) · [`apSteer`](#s-apSteer) · [`matchFrame`](#s-matchFrame) · [`parkDistance`](#s-parkDistance) · [`relSpeedTo`](#s-relSpeedTo) · [`setThrottle`](../sim/sim.js.md#s-setThrottle) _js/sim/sim.js_ · [`dist3`](../world/bodies.js.md#s-dist3) _js/world/bodies.js_
- called by: [`EXEC.APPROACH`](../mission/run.js.md#s-EXEC-APPROACH) _js/mission/run.js_ · [`EXEC.GOTO`](../mission/run.js.md#s-EXEC-GOTO) _js/mission/run.js_ · [`EXEC.MINE`](../mission/run.js.md#s-EXEC-MINE) _js/mission/run.js_ · [`EXEC.SURVEY`](../mission/run.js.md#s-EXEC-SURVEY) _js/mission/run.js_

<!-- note:apPark -->
The doorstep: kill the drift and sit off the node. Returns "flying" | "parked".
<!-- /note -->

### <a id="s-apDock"></a>`apDock(st)`

function · **exported** · L669–712

- calls: [`apHold`](#s-apHold) · [`apProgress`](#s-apProgress) · [`apSteer`](#s-apSteer) ×3 · [`apUnstick`](#s-apUnstick) · [`beginUnstick`](#s-beginUnstick) · [`drifting`](#s-drifting) ×2 · [`relSpeedTo`](#s-relSpeedTo) · [`resetProgress`](#s-resetProgress) · [`lanePoint`](../npc/lanes.js.md#s-lanePoint) _js/npc/lanes.js_ ×2 · [`setThrottle`](../sim/sim.js.md#s-setThrottle) _js/sim/sim.js_ ×3 · [`stationStatus`](../sim/sim.js.md#s-stationStatus) _js/sim/sim.js_ · [`toggleDock`](../sim/sim.js.md#s-toggleDock) _js/sim/sim.js_ · [`requestDock`](../station/stationworks.js.md#s-requestDock) _js/station/stationworks.js_ · [`dist3`](../world/bodies.js.md#s-dist3) _js/world/bodies.js_ ×2
- called by: [`EXEC.APPROACH`](../mission/run.js.md#s-EXEC-APPROACH) _js/mission/run.js_ · [`EXEC.DOCK`](../mission/run.js.md#s-EXEC-DOCK) _js/mission/run.js_

<!-- note:apDock -->
A port approach: file the berth, ride the entry lane in, let the tractor take the hull.

- L681 · `if (!sim.dockRequestFor || sim.dockRequestFor !== st.id) {` — the lane: far gate first, then down it to the mouth under the tractor's speed limit
- L681 · `if (!sim.dockRequestFor || sim.dockRequestFor !== st.id) {` — file the berth directly: toggleDock() would read an approach already flying as a wave-off
- L693 · `return "flying";` — inside the funnel under speed, port control's own tractor (autoTractor) takes the hull
- L703 · `if (mine && mine.ok) { touch.brake = false; toggleDock(); return ship.dockedAt === st.id ?` — an old-style pad: close, dead slow, request
<!-- /note -->

### <a id="s-MINE_STANDOFF"></a>`MINE_STANDOFF()`

function · L714–714

- called by: [`apMine`](#s-apMine)

<!-- note:MINE_STANDOFF -->
---- the cutter -----------------------------------------------------------------
<!-- /note -->

### <a id="s-_rock"></a>`_rock`

const · L715–715

<!-- note:_rock -->
<!-- /note -->

### <a id="s-atSeam"></a>`atSeam(seam)`

function · **exported** · L717–719

- calls: [`dist3`](../world/bodies.js.md#s-dist3) _js/world/bodies.js_ · [`inBelt`](../world/field.js.md#s-inBelt) _js/world/field.js_
- called by: [`apMine`](#s-apMine)

<!-- note:atSeam -->
True when the ship is on the seam: in a belt and within reach of the point.
<!-- /note -->

### <a id="s-apMine"></a>`apMine(seam)`

function · **exported** · L721–782

- calls: [`preferenceFor`](../aria/aria.js.md#s-preferenceFor) _js/aria/aria.js_ · [`apProgress`](#s-apProgress) · [`apSteer`](#s-apSteer) ×3 · [`apUnstick`](#s-apUnstick) · [`atSeam`](#s-atSeam) · [`beginUnstick`](#s-beginUnstick) · [`MINE_STANDOFF`](#s-MINE_STANDOFF) · [`resetProgress`](#s-resetProgress) ×2 · [`holdRoom`](ship.js.md#s-holdRoom) _js/flight/ship.js_ ×2 · [`logEvent`](../sim/sim.js.md#s-logEvent) _js/sim/sim.js_ · [`setMiningMode`](../sim/sim.js.md#s-setMiningMode) _js/sim/sim.js_ ×3 · [`setThrottle`](../sim/sim.js.md#s-setThrottle) _js/sim/sim.js_ · [`dist3`](../world/bodies.js.md#s-dist3) _js/world/bodies.js_ ×2 · [`nearbyRocks`](../world/field.js.md#s-nearbyRocks) _js/world/field.js_ · [`siteMarkRock`](../world/field.js.md#s-siteMarkRock) _js/world/field.js_ ×2 · [`skipMarkRock`](../world/field.js.md#s-skipMarkRock) _js/world/field.js_
- called by: [`EXEC.MINE`](../mission/run.js.md#s-EXEC-MINE) _js/mission/run.js_

<!-- note:apMine -->
A rock under the cutter. Returns "offSeam" (fly there first), "cutting",
"seeking" (thin cell — drifting to the next) or "noRock". The cutter only
runs when there is something to cut and room to keep it.

- L731 · `const want = sim.autoPlan.seamOre;` — 0.3.22: on a job that named an ore, cut THAT ore. The hold is the scarce
  thing, not the rock — a loop that fills it with whatever was nearest docks
  with an unfinished order and a hold full of somebody else's cargo. Other
  rock is still cut when there is none of the wanted ore in reach.
- L734 · `const marked = seam.site ? siteMarkRock(seam.site, sim.time, autopilot.siteRock)?.key ?? n` — 0.3.67: a job seam has ONE marked rock (field.js siteMarkRock — the same
  pick the mark on the chart shows); the cutter goes to that one first
- L741 · `const wanted = sim.autoPlan.seamOre && r.ore === sim.autoPlan.seamOre ? 6 : 0;` — same idea at the cutter: you cut the ores you cut
- L741 · `const wanted = sim.autoPlan.seamOre && r.ore === sim.autoPlan.seamOre ? 6 : 0;` — 0.3.22: a job that named an ore is a job about THAT ore. A belt vein of
  something else is worth cutting on a free run and worth nothing on a
  contract — the loop used to wander off onto whatever was richest nearby
  and dock with a full hold and an unfilled order.
- L746 · `autopilot.phase = "seek";` — thin cell: drift along the belt to the next one
- L755 · `autopilot.ignore.set(best.key, sim.time + 3);` — The rock we are flying AT is not a hazard. `deliberate()` only exempts it
  once the cutter has actually latched, which left the approach dodging the
  very rock it was sent to mine — it would sidle up to within cutter range,
  flinch, and start again. The blind window closes on its own.
- L768 · `apSteer(_rock.x, _rock.y, _rock.z, 0);` — on station: keep the nose on it and kill the drift
- L771 · `if (sim.time - autopilot.rockSince > 240 && !mining.active) {` — a rock that the cutter cannot reach for a long while is skipped
- L773 · `if (autopilot.rockKey === marked) {` — 0.3.68: the seam's mark moves with the cutter, for the same 900 s
<!-- /note -->

### <a id="s-jumpEndedShort"></a>`jumpEndedShort(node, dist)`

function · **exported** · L784–788

- called by: [`EXEC.GOTO`](../mission/run.js.md#s-EXEC-GOTO) _js/mission/run.js_

<!-- note:jumpEndedShort -->
Did that jump ARRIVE, or did the core drop us short?

A dropout used to be reported to the mission as "jump complete — target on
the bow", which handed the stick back wherever the core let go — in a belt,
that is the rocks you were trying to leave, 650 km from anywhere, and the
only thing to do is press AUTO again and watch it happen again. Returns the
dropout worth going again for, or null when the jump really is over.
<!-- /note -->

### <a id="s-wireAutopilot"></a>`wireAutopilot()`

function · **exported** · L790–803

- calls: [`toggleAutopilot`](#s-toggleAutopilot) · [`missionStatusLine`](../mission/run.js.md#s-missionStatusLine) _js/mission/run.js_
- called by: [`mountHud`](../ui/hud.js.md#s-mountHud) _js/ui/hud.js_
- effects: dom.id `aux-auto` · dom.id `aux-auto-st` · event.listen `click` · timer `setInterval`

<!-- note:wireAutopilot -->
AUX 6 wiring + console access.
<!-- /note -->
