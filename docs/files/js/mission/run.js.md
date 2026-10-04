# js/mission/run.js

[index](../../../README.md) · 565 lines · 57 symbols · 17 imports · 17 importers

## About

<!-- note:@file -->
LIVING GALAXY — the mission executor: walks a script's steps on the autopilot primitives.

One step is live at a time. Its executor is called every autopilot tick and
answers "flying" | "done" | "asking" | "fail:&lt;why>"; on "done" the run
advances (next tick — so the HUD sees every phase), at the end of the list
the loop row decides whether to go round again. Flying steps undock
themselves first. A warp policy of "ask" parks the ship aligned and posts
the question to the sys channel with JUMP / SUBLIGHT / ABORT links; the
NAV and WORK banners call the same `answerAsk`.

The run is saved per sky and callsign on every step change and restored
paused, so a reload never flies by itself.

- L44 · `const T = makeTradeOps({ mission, note, ap: () => autopilot });` — a getter: autopilot.js and this file import each other
<!-- /note -->

## Imports

| line | from | names | target |
|---|---|---|---|
| 1 | `../aria/mind.js` | `authorize` | [js/aria/mind.js](../aria/mind.js.md) |
| 2 | `../sim/sim.js` | `sim`, `losBlocker`, `warpNodeById`, `toggleDock`, `sellAllOre` **unused**, `stashDeposit`, `smeltAll`, `canSmeltAt`, `tradeBuy` **unused**, `tradeSell` **unused**, `addWaypointAt`, `addAnchoredWaypoint`, `removeWaypoint`, `selectBody`, `logEvent`, `requestScan`, `throttleCap`, `setTurretMode`, `setMiningMode`, `toggleSystem`, `sellPriceAt` **unused**, `buyPriceAt` **unused** | [js/sim/sim.js](../sim/sim.js.md) |
| 3 | `../flight/ship.js` | `*` as `shipMod` | [js/flight/ship.js](../flight/ship.js.md) |
| 4 | `../flight/ship.js` | `holdRoom`, `BATTERY` | [js/flight/ship.js](../flight/ship.js.md) |
| 5 | `../world/bodies.js` | `BODIES`, `bodyPosition`, `dist3` | [js/world/bodies.js](../world/bodies.js.md) |
| 6 | `../station/stations.js` | `stationById` | [js/station/stations.js](../station/stations.js.md) |
| 7 | `../station/stationworks.js` | `tractor` | [js/station/stationworks.js](../station/stationworks.js.md) |
| 8 | `../world/field.js` | `inBelt` | [js/world/field.js](../world/field.js.md) |
| 9 | `../economy/sites.js` | `siteById` | [js/economy/sites.js](../economy/sites.js.md) |
| 10 | `../npc/captain.js` | `captain` | [js/npc/captain.js](../npc/captain.js.md) |
| 11 | `../comms/chat.js` | `post` | [js/comms/chat.js](../comms/chat.js.md) |
| 12 | `../economy/upgrades.js` | `hasUpgrade` **unused** | [js/economy/upgrades.js](../economy/upgrades.js.md) |
| 13 | `./tradeops.js` | `makeTradeOps` | [js/mission/tradeops.js](tradeops.js.md) |
| 14 | `./detour.js` | `makeLegs` | [js/mission/detour.js](detour.js.md) |
| 15 | `./salvage.js` | `makeSalvage` | [js/mission/salvage.js](salvage.js.md) |
| 16 | `./script.js` | `validate`, `evalCond`, `snapshot`, `describeRef`, `deserialize`, `serialize`, `makeStep`, `missionCore` | [js/mission/script.js](script.js.md) |
| 17 | `../flight/autopilot.js` | `autopilot`, `apLeg`, `apPark`, `apDock`, `apMine`, `apHold`, `bestPortFor`, `nearestSeam`, `releaseControls`, `resetProgress`, `jumpEndedShort`, `warpReserve`, `AP_POWER`, `busIdle` | [js/flight/autopilot.js](../flight/autopilot.js.md) |

## Imported by

- [js/aria/pilot.js](../aria/pilot.js.md) — `mission`, `startMission`, `stopMission`, `EXEC`
- [js/aria/play.js](../aria/play.js.md) — `mission`, `startMission`, `stopMission`
- [js/console/panels/market.js](../console/panels/market.js.md) — `startMission`
- [js/console/panels/nav.js](../console/panels/nav.js.md) — `mission`, `missionStatusLine`, `startMission`, `stopMission`, `pauseMission`, `resumeMission`, `answerAsk`
- [js/console/panels/work.js](../console/panels/work.js.md) — `mission`, `missionStatusLine`, `startMission`, `stopMission`, `pauseMission`, `resumeMission`, `answerAsk`
- [js/crew/talk.js](../crew/talk.js.md) — `mission`
- [js/flight/autopilot.js](../flight/autopilot.js.md) — `mission`, `startMission`, `stopMission`, `resumeMission`, `tickMission`, `missionStatusLine`, `restoreRun`, `answerAsk`
- [js/ui/hud.js](../ui/hud.js.md) — `mission`, `missionHooks`
- [js/ui/map.js](../ui/map.js.md) — `mission`
- [js/ui/tutorial-core.js](../ui/tutorial-core.js.md) — `startMission`
- test/aria-mining-loop.test.mjs _(outside js/)_ — `mission`, `EXEC`, `startMission`, `stopMission`, `tickMission`
- test/ariamind-integration.test.mjs _(outside js/)_ — `mission`, `EXEC`
- test/ariaplay.test.mjs _(outside js/)_ — `mission`, `stopMission`
- test/jobloop.test.mjs _(outside js/)_ — `mission`, `tickMission`
- test/marks.test.mjs _(outside js/)_ — `mission`
- test/mission.test.mjs _(outside js/)_ — `mission`, `missionHooks`, `startMission`, `stopMission`, `pauseMission`, `resumeMission`, `answerAsk`, `missionStatusLine`, `stepThrustCap`, `stepWarpPolicy`, `RUN_KEY`, `saveRun`, `restoreRun`
- test/trade.test.mjs _(outside js/)_ — `mission`, `missionHooks`, `startMission`, `stopMission`

## Exports

- [`mission`](#s-mission) · const — used by [js/aria/pilot.js](../aria/pilot.js.md), [js/aria/play.js](../aria/play.js.md), [js/console/panels/nav.js](../console/panels/nav.js.md), [js/console/panels/work.js](../console/panels/work.js.md), [js/crew/talk.js](../crew/talk.js.md), [js/flight/autopilot.js](../flight/autopilot.js.md), [js/ui/hud.js](../ui/hud.js.md), [js/ui/map.js](../ui/map.js.md), test/aria-mining-loop.test.mjs, test/ariamind-integration.test.mjs, test/ariaplay.test.mjs, test/jobloop.test.mjs, test/marks.test.mjs, test/mission.test.mjs, test/trade.test.mjs
- [`missionHooks`](#s-missionHooks) · const — used by [js/ui/hud.js](../ui/hud.js.md), test/mission.test.mjs, test/trade.test.mjs
- [`RUN_KEY`](#s-RUN_KEY) · function — used by test/mission.test.mjs
- [`startMission`](#s-startMission) · function — used by [js/aria/pilot.js](../aria/pilot.js.md), [js/aria/play.js](../aria/play.js.md), [js/console/panels/market.js](../console/panels/market.js.md), [js/console/panels/nav.js](../console/panels/nav.js.md), [js/console/panels/work.js](../console/panels/work.js.md), [js/flight/autopilot.js](../flight/autopilot.js.md), [js/ui/tutorial-core.js](../ui/tutorial-core.js.md), test/aria-mining-loop.test.mjs, test/mission.test.mjs, test/trade.test.mjs
- [`stopMission`](#s-stopMission) · function — used by [js/aria/pilot.js](../aria/pilot.js.md), [js/aria/play.js](../aria/play.js.md), [js/console/panels/nav.js](../console/panels/nav.js.md), [js/console/panels/work.js](../console/panels/work.js.md), [js/flight/autopilot.js](../flight/autopilot.js.md), test/aria-mining-loop.test.mjs, test/ariaplay.test.mjs, test/mission.test.mjs, test/trade.test.mjs
- [`pauseMission`](#s-pauseMission) · function — used by [js/console/panels/nav.js](../console/panels/nav.js.md), [js/console/panels/work.js](../console/panels/work.js.md), test/mission.test.mjs
- [`resumeMission`](#s-resumeMission) · function — used by [js/console/panels/nav.js](../console/panels/nav.js.md), [js/console/panels/work.js](../console/panels/work.js.md), [js/flight/autopilot.js](../flight/autopilot.js.md), test/mission.test.mjs
- [`answerAsk`](#s-answerAsk) · function — used by [js/console/panels/nav.js](../console/panels/nav.js.md), [js/console/panels/work.js](../console/panels/work.js.md), [js/flight/autopilot.js](../flight/autopilot.js.md), test/mission.test.mjs
- [`stepThrustCap`](#s-stepThrustCap) · function — used by test/mission.test.mjs
- [`stepWarpPolicy`](#s-stepWarpPolicy) · function — used by test/mission.test.mjs
- [`EXEC`](#s-EXEC) · const — used by [js/aria/pilot.js](../aria/pilot.js.md), test/aria-mining-loop.test.mjs, test/ariamind-integration.test.mjs
- [`tickMission`](#s-tickMission) · function — used by [js/flight/autopilot.js](../flight/autopilot.js.md), test/aria-mining-loop.test.mjs, test/jobloop.test.mjs
- [`missionStatusLine`](#s-missionStatusLine) · function — used by [js/console/panels/nav.js](../console/panels/nav.js.md), [js/console/panels/work.js](../console/panels/work.js.md), [js/flight/autopilot.js](../flight/autopilot.js.md), test/mission.test.mjs
- [`saveRun`](#s-saveRun) · function — used by test/mission.test.mjs
- [`clearRun`](#s-clearRun) · function — **no importer in scanned roots**
- [`restoreRun`](#s-restoreRun) · function — used by [js/flight/autopilot.js](../flight/autopilot.js.md), test/mission.test.mjs

## Effects

- **dom.query** — `[data-posture="${…}"]` (EXEC.SET:470)
- **storage.get** — `‹RUN_KEY()›` (restoreRun:547)
- **storage.remove** — `‹RUN_KEY()›` (clearRun:538)

## Symbols

### <a id="s-mission"></a>`mission`

const · **exported** · L21–35

<!-- note:mission -->
state: "idle"|"running"|"paused"|"asking"|"done"|"failed"

- L30 · `noWarpFor: -1,` — step index the pilot answered SUBLIGHT for
- L31 · `origin: null,` — where the mission started — the "here" ref
- L32 · `run: {},` — the live step's scratch (resolved node, transient mark, retries…)
- L33 · `trade: null,` — 0.3.19: the round's trade route { fromId, toId, good, qty, …, bought } — outlives a step, not a round
- L34 · `key: "",` — sky:callsign the persisted run was checked for
<!-- /note -->

### <a id="s-missionHooks"></a>`missionHooks`

const · **exported** · L37–37

<!-- note:missionHooks -->
B/A may subscribe
<!-- /note -->

### <a id="s-RUN_KEY"></a>`RUN_KEY()`

function · **exported** · L39–39

- called by: [`clearRun`](#s-clearRun) · [`restoreRun`](#s-restoreRun) · [`saveRun`](#s-saveRun)

<!-- note:RUN_KEY -->
<!-- /note -->

### <a id="s-batteryCap"></a>`batteryCap(ship)`

function · L40–40

- calls: [`batteryCap`](../flight/ship.js.md#s-batteryCap) _js/flight/ship.js_
- called by: [`EXEC.CHARGE`](#s-EXEC-CHARGE) · [`EXEC.MINE`](#s-EXEC-MINE)

<!-- note:batteryCap -->
package D exports batteryCap(ship) from ship.js; the rated battery until it lands
<!-- /note -->

### <a id="s-FLYING"></a>`FLYING`

const · L41–41

<!-- note:FLYING -->
<!-- /note -->

### <a id="s-_p"></a>`_p`

const · L42–42

<!-- note:_p -->
<!-- /note -->

### <a id="s-note"></a>`note(text)`

function · L43–43

- called by: [`pauseMission`](#s-pauseMission) · [`restoreRun`](#s-restoreRun) · [`resumeMission`](#s-resumeMission) ×2 · [`startMission`](#s-startMission) ×3 · [`stopMission`](#s-stopMission)

<!-- note:note -->
<!-- /note -->

### <a id="s-T"></a>`T`

const · L44–44

- calls: [`makeTradeOps`](tradeops.js.md#s-makeTradeOps) _js/mission/tradeops.js_

<!-- note:T -->
0.3.19: the trade route and the two docked trade ops live in tradeops.js (this file is on the 600-line gate)
<!-- /note -->

#### <a id="s-T-ap"></a>`T.ap()`

prop · L44–44

<!-- note:T.ap -->
<!-- /note -->

### <a id="s-pickRoute"></a>`pickRoute`

const · L45–45

- called by: [`resolve`](#s-resolve) · [`startMission`](#s-startMission)

<!-- note:pickRoute -->
<!-- /note -->

### <a id="s-startMission"></a>`startMission(m)`

function · **exported** · L47–90

- calls: [`beginStep`](#s-beginStep) · [`mirror`](#s-mirror) · [`note`](#s-note) ×3 · [`pickRoute`](#s-pickRoute) · [`saveRun`](#s-saveRun) · [`stopMission`](#s-stopMission) · [`deserialize`](script.js.md#s-deserialize) _js/mission/script.js_ · [`makeStep`](script.js.md#s-makeStep) _js/mission/script.js_ · [`missionCore`](script.js.md#s-missionCore) _js/mission/script.js_ · [`serialize`](script.js.md#s-serialize) _js/mission/script.js_ · [`validate`](script.js.md#s-validate) _js/mission/script.js_
- via [js/flight/autopilot.js](../flight/autopilot.js.md): `autopilot.skip.clear`
- called by: [`tickAriaPilot`](../aria/pilot.js.md#s-tickAriaPilot) _js/aria/pilot.js_ · [`resumeHeld`](../aria/play.js.md#s-resumeHeld) _js/aria/play.js_ · [`startFreeMine`](../aria/play.js.md#s-startFreeMine) _js/aria/play.js_ · [`startFreeSalvage`](../aria/play.js.md#s-startFreeSalvage) _js/aria/play.js_ · [`startJob`](../aria/play.js.md#s-startJob) _js/aria/play.js_ · [`startRoute`](../aria/play.js.md#s-startRoute) _js/aria/play.js_ · [`startSell`](../aria/play.js.md#s-startSell) _js/aria/play.js_ · [`startSupply`](../aria/play.js.md#s-startSupply) _js/aria/play.js_ · [`startYard`](../aria/play.js.md#s-startYard) _js/aria/play.js_ · [`stepPlay`](../aria/play.js.md#s-stepPlay) _js/aria/play.js_ ×2 · [`flyRoute`](../console/panels/market.js.md#s-flyRoute) _js/console/panels/market.js_ · [`mountRoutes`](../console/panels/market.js.md#s-mountRoutes) _js/console/panels/market.js_ · [`mountAutopilot>go`](../console/panels/nav.js.md#s-mountAutopilot-go) _js/console/panels/nav.js_ · [`mountTargets`](../console/panels/nav.js.md#s-mountTargets) _js/console/panels/nav.js_ · [`editor>render`](../console/panels/work.js.md#s-editor-render) _js/console/panels/work.js_ ×3 · [`search.run`](../console/panels/work.js.md#s-search-run) _js/console/panels/work.js_ · [`engageAutopilot`](../flight/autopilot.js.md#s-engageAutopilot) _js/flight/autopilot.js_ · [`engageJobLoop`](../flight/autopilot.js.md#s-engageJobLoop) _js/flight/autopilot.js_ · [`engageMiningLoop`](../flight/autopilot.js.md#s-engageMiningLoop) _js/flight/autopilot.js_ · [`engageSalvageLoop`](../flight/autopilot.js.md#s-engageSalvageLoop) _js/flight/autopilot.js_ · [`autoDock`](../ui/tutorial-core.js.md#s-autoDock) _js/ui/tutorial-core.js_

<!-- note:startMission -->
---- start / stop ---------------------------------------------------------

→ bool; refuses when the player does not hold the conn; replaces any running mission

- L59 · `mission.trade = null;` — a trade run starting at the port its route starts from does not leave it first
- L73 · `autopilot.cutterWas = sim.ship.miningMode;` — the pilot's cutter, handed back at stand-down
<!-- /note -->

### <a id="s-stopMission"></a>`stopMission(why=, {…}=)`

function · **exported** · L92–110

- calls: [`releaseControls`](../flight/autopilot.js.md#s-releaseControls) _js/flight/autopilot.js_ · [`cleanupStep`](#s-cleanupStep) · [`clearRun`](#s-clearRun) · [`note`](#s-note) · [`logEvent`](../sim/sim.js.md#s-logEvent) _js/sim/sim.js_
- called by: [`beginAriaWatch`](../aria/pilot.js.md#s-beginAriaWatch) _js/aria/pilot.js_ · [`endAriaWatch`](../aria/pilot.js.md#s-endAriaWatch) _js/aria/pilot.js_ · [`tickAriaPilot`](../aria/pilot.js.md#s-tickAriaPilot) _js/aria/pilot.js_ · [`endPlay`](../aria/play.js.md#s-endPlay) _js/aria/play.js_ · [`stepPlay`](../aria/play.js.md#s-stepPlay) _js/aria/play.js_ ×6 · [`mountAutopilot`](../console/panels/nav.js.md#s-mountAutopilot) _js/console/panels/nav.js_ · [`liveCard`](../console/panels/work.js.md#s-liveCard) _js/console/panels/work.js_ · [`search.run~2`](../console/panels/work.js.md#s-search-run-2) _js/console/panels/work.js_ · [`disengageAutopilot`](../flight/autopilot.js.md#s-disengageAutopilot) _js/flight/autopilot.js_ · [`tickAutopilot`](../flight/autopilot.js.md#s-tickAutopilot) _js/flight/autopilot.js_ ×3 · [`advance`](#s-advance) · [`answerAsk`](#s-answerAsk) · [`fail`](#s-fail) · [`startMission`](#s-startMission)

<!-- note:stopMission -->
<!-- /note -->

### <a id="s-pauseMission"></a>`pauseMission()`

function · **exported** · L112–121

- calls: [`releaseControls`](../flight/autopilot.js.md#s-releaseControls) _js/flight/autopilot.js_ · [`cleanupStep`](#s-cleanupStep) · [`note`](#s-note) · [`saveRun`](#s-saveRun)
- called by: [`mountAutopilot`](../console/panels/nav.js.md#s-mountAutopilot) _js/console/panels/nav.js_ · [`liveCard`](../console/panels/work.js.md#s-liveCard) _js/console/panels/work.js_

<!-- note:pauseMission -->
<!-- /note -->

### <a id="s-resumeMission"></a>`resumeMission()`

function · **exported** · L123–136

- calls: [`beginStep`](#s-beginStep) · [`mirror`](#s-mirror) · [`note`](#s-note) ×2
- called by: [`mountAutopilot`](../console/panels/nav.js.md#s-mountAutopilot) _js/console/panels/nav.js_ · [`liveCard`](../console/panels/work.js.md#s-liveCard) _js/console/panels/work.js_ · [`toggleAutopilot`](../flight/autopilot.js.md#s-toggleAutopilot) _js/flight/autopilot.js_

<!-- note:resumeMission -->
<!-- /note -->

### <a id="s-answerAsk"></a>`answerAsk(answer)`

function · **exported** · L138–149

- calls: [`stopMission`](#s-stopMission) · [`logEvent`](../sim/sim.js.md#s-logEvent) _js/sim/sim.js_
- called by: [`mountAutopilot`](../console/panels/nav.js.md#s-mountAutopilot) _js/console/panels/nav.js_ ×3 · [`liveCard`](../console/panels/work.js.md#s-liveCard) _js/console/panels/work.js_ ×3 · [`beginAsk.run`](#s-beginAsk-run) · [`beginAsk.run~2`](#s-beginAsk-run-2) · [`beginAsk.run~3`](#s-beginAsk-run-3)

<!-- note:answerAsk -->
answer: "jump" | "sublight" | "abort"
<!-- /note -->

### <a id="s-step"></a>`step()`

function · L151–151

- called by: [`beginStep`](#s-beginStep) · [`fail`](#s-fail) · [`missionStatusLine`](#s-missionStatusLine) · [`stepThrustCap`](#s-stepThrustCap) · [`stepWarpPolicy`](#s-stepWarpPolicy) · [`tickMission`](#s-tickMission)

<!-- note:step -->
---- per-step bookkeeping -------------------------------------------------
<!-- /note -->

### <a id="s-beginStep"></a>`beginStep()`

function · L153–164

- calls: [`resetProgress`](../flight/autopilot.js.md#s-resetProgress) _js/flight/autopilot.js_ · [`step`](#s-step)
- called by: [`advance`](#s-advance) · [`fail`](#s-fail) · [`resumeMission`](#s-resumeMission) · [`startMission`](#s-startMission)

<!-- note:beginStep -->
- L162 · `resetProgress();` — the progress watchdog measures one step's closure; a new step is a new
  target and a stale best distance would read as "stuck" on the first tick
<!-- /note -->

### <a id="s-cleanupStep"></a>`cleanupStep()`

function · L166–171

- calls: [`removeWaypoint`](../sim/sim.js.md#s-removeWaypoint) _js/sim/sim.js_ ×2
- called by: [`advance`](#s-advance) · [`fail`](#s-fail) · [`pauseMission`](#s-pauseMission) · [`stopMission`](#s-stopMission)

<!-- note:cleanupStep -->
<!-- /note -->

### <a id="s-advance"></a>`advance()`

function · L173–195

- calls: [`beginStep`](#s-beginStep) · [`cleanupStep`](#s-cleanupStep) · [`saveRun`](#s-saveRun) · [`stopMission`](#s-stopMission) · [`evalCond`](script.js.md#s-evalCond) _js/mission/script.js_ · [`snapshot`](script.js.md#s-snapshot) _js/mission/script.js_ · [`logEvent`](../sim/sim.js.md#s-logEvent) _js/sim/sim.js_
- called by: [`fail`](#s-fail) · [`tickMission`](#s-tickMission) ×2

<!-- note:advance -->
<!-- /note -->

### <a id="s-fail"></a>`fail(why)`

function · L197–204

- calls: [`advance`](#s-advance) · [`beginStep`](#s-beginStep) · [`cleanupStep`](#s-cleanupStep) · [`step`](#s-step) · [`stopMission`](#s-stopMission) · [`logEvent`](../sim/sim.js.md#s-logEvent) _js/sim/sim.js_
- called by: [`tickMission`](#s-tickMission) ×3

<!-- note:fail -->
<!-- /note -->

### <a id="s-mirror"></a>`mirror()`

function · L206–212

- called by: [`resumeMission`](#s-resumeMission) · [`startMission`](#s-startMission) · [`tickMission`](#s-tickMission)

<!-- note:mirror -->
<!-- /note -->

### <a id="s-stepThrustCap"></a>`stepThrustCap(s=)`

function · **exported** · L214–217

- calls: [`step`](#s-step) · [`throttleCap`](../sim/sim.js.md#s-throttleCap) _js/sim/sim.js_
- called by: [`legOpts`](#s-legOpts) · [`tickMission`](#s-tickMission)

<!-- note:stepThrustCap -->
→ min(step.thrustCap ?? m.defaults.thrustCap, throttleCap())
<!-- /note -->

### <a id="s-stepWarpPolicy"></a>`stepWarpPolicy(s=)`

function · **exported** · L219–222

- calls: [`step`](#s-step)
- called by: [`legOpts`](#s-legOpts)

<!-- note:stepWarpPolicy -->
→ step.warp ?? m.defaults.warp (SUBLIGHT answered for this step → "never")
<!-- /note -->

### <a id="s-markAt"></a>`markAt(name, p, anchor=)`

function · L224–229

- calls: [`addAnchoredWaypoint`](../sim/sim.js.md#s-addAnchoredWaypoint) _js/sim/sim.js_ · [`addWaypointAt`](../sim/sim.js.md#s-addWaypointAt) _js/sim/sim.js_ · [`warpNodeById`](../sim/sim.js.md#s-warpNodeById) _js/sim/sim.js_
- called by: [`resolve`](#s-resolve) ×3

<!-- note:markAt -->
---- targets ------------------------------------------------------------------

- L225 · `const wp = anchor ? addAnchoredWaypoint(name, anchor, p, { reuse: false }) : addWaypointAt` — 0.3.67: a seam with a job site behind it is marked ON its rock
<!-- /note -->

### <a id="s-nearestUnsurveyed"></a>`nearestUnsurveyed()`

function · L231–241

- calls: [`bodyPosition`](../world/bodies.js.md#s-bodyPosition) _js/world/bodies.js_ · [`dist3`](../world/bodies.js.md#s-dist3) _js/world/bodies.js_
- via [js/sim/sim.js](../sim/sim.js.md): `sim.scanned.has`
- called by: [`resolve`](#s-resolve)

<!-- note:nearestUnsurveyed -->
<!-- /note -->

### <a id="s-resolve"></a>`resolve(s)`

function · L243–287

- calls: [`siteById`](../economy/sites.js.md#s-siteById) _js/economy/sites.js_ · [`bestPortFor`](../flight/autopilot.js.md#s-bestPortFor) _js/flight/autopilot.js_ · [`nearestSeam`](../flight/autopilot.js.md#s-nearestSeam) _js/flight/autopilot.js_ · [`markAt`](#s-markAt) ×3 · [`nearestUnsurveyed`](#s-nearestUnsurveyed) · [`pickRoute`](#s-pickRoute) · [`selectBody`](../sim/sim.js.md#s-selectBody) _js/sim/sim.js_ · [`warpNodeById`](../sim/sim.js.md#s-warpNodeById) _js/sim/sim.js_ ×7 · [`stationById`](../station/stations.js.md#s-stationById) _js/station/stations.js_
- called by: [`EXEC.APPROACH`](#s-EXEC-APPROACH) · [`EXEC.DOCK`](#s-EXEC-DOCK) · [`EXEC.GOTO`](#s-EXEC-GOTO) · [`EXEC.MINE`](#s-EXEC-MINE) · [`EXEC.SURVEY`](#s-EXEC-SURVEY)

<!-- note:resolve -->
Resolve a step's Ref once per step: a warp node (and the station for DOCK).

- L263 · `mission.trade = null;` — the top of a round: a new route from where the hull is now
- L283 · `autopilot.portId = r.st?.id ?? null;` — sim.js flies the last leg in this port's frame
- L284 · `if (node && node.id !== sim.selected) selectBody(node.id);` — the core jumps to the lock
<!-- /note -->

### <a id="s-ensureUndocked"></a>`ensureUndocked()`

function · L289–301

- calls: [`apHold`](../flight/autopilot.js.md#s-apHold) _js/flight/autopilot.js_ · [`toggleDock`](../sim/sim.js.md#s-toggleDock) _js/sim/sim.js_ · [`stationById`](../station/stations.js.md#s-stationById) _js/station/stations.js_
- called by: [`EXEC.APPROACH`](#s-EXEC-APPROACH) · [`EXEC.DOCK`](#s-EXEC-DOCK) · [`EXEC.GOTO`](#s-EXEC-GOTO) · [`EXEC.MINE`](#s-EXEC-MINE) · [`EXEC.SURVEY`](#s-EXEC-SURVEY) · [`EXEC.UNDOCK`](#s-EXEC-UNDOCK)

<!-- note:ensureUndocked -->
Docked hulls leave first; port control keeps the helm on the way out. → "flying" | "clear"
<!-- /note -->

### <a id="s-untilMet"></a>`untilMet(s)`

function · L303–305

- calls: [`evalCond`](script.js.md#s-evalCond) _js/mission/script.js_ · [`snapshot`](script.js.md#s-snapshot) _js/mission/script.js_
- called by: [`EXEC.CHARGE`](#s-EXEC-CHARGE) · [`EXEC.HOLD`](#s-EXEC-HOLD) · [`EXEC.MINE`](#s-EXEC-MINE) · [`EXEC.WAIT`](#s-EXEC-WAIT)

<!-- note:untilMet -->
<!-- /note -->

### <a id="s-legOpts"></a>`legOpts(s, extra=)`

function · L307–307

- calls: [`stepThrustCap`](#s-stepThrustCap) · [`stepWarpPolicy`](#s-stepWarpPolicy)

<!-- note:legOpts -->
<!-- /note -->

### <a id="s-ap"></a>`ap()`

prop · L309–309

<!-- note:ap -->
<!-- /note -->

### <a id="s-SALVAGE"></a>`SALVAGE`

const · L310–310

- calls: [`makeSalvage`](salvage.js.md#s-makeSalvage) _js/mission/salvage.js_

<!-- note:SALVAGE -->
<!-- /note -->

#### <a id="s-SALVAGE-ap"></a>`SALVAGE.ap()`

prop · L310–310

<!-- note:SALVAGE.ap -->
<!-- /note -->

### <a id="s-EXEC"></a>`EXEC`

const · **exported** · L312–474

<!-- note:EXEC -->
<!-- /note -->

#### <a id="s-EXEC-GOTO"></a>`EXEC.GOTO(s)`

prop · L313–340

- calls: [`apHold`](../flight/autopilot.js.md#s-apHold) _js/flight/autopilot.js_ ×3 · [`apPark`](../flight/autopilot.js.md#s-apPark) _js/flight/autopilot.js_ · [`jumpEndedShort`](../flight/autopilot.js.md#s-jumpEndedShort) _js/flight/autopilot.js_ · [`ensureUndocked`](#s-ensureUndocked) · [`resolve`](#s-resolve) · [`logEvent`](../sim/sim.js.md#s-logEvent) _js/sim/sim.js_ · [`losBlocker`](../sim/sim.js.md#s-losBlocker) _js/sim/sim.js_ · [`dist3`](../world/bodies.js.md#s-dist3) _js/world/bodies.js_

<!-- note:EXEC.GOTO -->
- L322 · `const drop = jumpEndedShort(node, dist);` — a dropout is not an arrival — see jumpEndedShort()
- L333 · `const via = s.args?.via;` — 0.3.52: a dogleg round a world is done the moment the next corridor is
  clear (or you are within a well's width of the mark). It used to have to
  be parked on exactly, and a mark hung off Jupiter's shoulder is a place
  the well will not let a hull hold still — ARIA sat 17 km short of one,
  braking, for ten minutes.
<!-- /note -->

#### <a id="s-EXEC-APPROACH"></a>`EXEC.APPROACH(s)`

prop · L341–357

- calls: [`apDock`](../flight/autopilot.js.md#s-apDock) _js/flight/autopilot.js_ · [`apPark`](../flight/autopilot.js.md#s-apPark) _js/flight/autopilot.js_ · [`ensureUndocked`](#s-ensureUndocked) · [`resolve`](#s-resolve)

<!-- note:EXEC.APPROACH -->
<!-- /note -->

#### <a id="s-EXEC-DOCK"></a>`EXEC.DOCK(s)`

prop · L358–373

- calls: [`apDock`](../flight/autopilot.js.md#s-apDock) _js/flight/autopilot.js_ · [`ensureUndocked`](#s-ensureUndocked) · [`resolve`](#s-resolve) · [`logEvent`](../sim/sim.js.md#s-logEvent) _js/sim/sim.js_

<!-- note:EXEC.DOCK -->
<!-- /note -->

#### <a id="s-EXEC-UNDOCK"></a>`EXEC.UNDOCK()`

prop · L374–378

- calls: [`ensureUndocked`](#s-ensureUndocked)

<!-- note:EXEC.UNDOCK -->
<!-- /note -->

#### <a id="s-EXEC-MINE"></a>`EXEC.MINE(s)`

prop · L379–408

- calls: [`apHold`](../flight/autopilot.js.md#s-apHold) _js/flight/autopilot.js_ ×2 · [`apMine`](../flight/autopilot.js.md#s-apMine) _js/flight/autopilot.js_ · [`apPark`](../flight/autopilot.js.md#s-apPark) _js/flight/autopilot.js_ · [`holdRoom`](../flight/ship.js.md#s-holdRoom) _js/flight/ship.js_ · [`batteryCap`](#s-batteryCap) · [`ensureUndocked`](#s-ensureUndocked) · [`resolve`](#s-resolve) · [`untilMet`](#s-untilMet) · [`setMiningMode`](../sim/sim.js.md#s-setMiningMode) _js/sim/sim.js_ · [`inBelt`](../world/field.js.md#s-inBelt) _js/world/field.js_ ×2

<!-- note:EXEC.MINE -->
- L? · `if (ship.charge / batteryCap(ship) <= AP_POWER.floor && !inBelt(ship.pos) && sim.time - mi` — battery flat outside the belt: nothing to be done here but leave

- L382 · `if (!ship.dockedAt && sim.warp.state === "idle" && !inBelt(ship.pos)) {` — Warp can drain the battery while we are still outside the belt. This is
  a pause in the same mining leg, never completion of the mining step.
<!-- /note -->

#### <a id="s-EXEC-SELL"></a>`EXEC.SELL(s)`

prop · L410–410

<!-- note:EXEC.SELL -->
<!-- /note -->

#### <a id="s-EXEC-DELIVER"></a>`EXEC.DELIVER(s)`

prop · L410–410

<!-- note:EXEC.DELIVER -->
<!-- /note -->

#### <a id="s-EXEC-STASH"></a>`EXEC.STASH(s)`

prop · L411–419

- calls: [`stashDeposit`](../sim/sim.js.md#s-stashDeposit) _js/sim/sim.js_ · [`stationById`](../station/stations.js.md#s-stationById) _js/station/stations.js_

<!-- note:EXEC.STASH -->
<!-- /note -->

#### <a id="s-EXEC-SMELT"></a>`EXEC.SMELT()`

prop · L420–429

- calls: [`canSmeltAt`](../sim/sim.js.md#s-canSmeltAt) _js/sim/sim.js_ · [`smeltAll`](../sim/sim.js.md#s-smeltAll) _js/sim/sim.js_ · [`stationById`](../station/stations.js.md#s-stationById) _js/station/stations.js_

<!-- note:EXEC.SMELT -->
<!-- /note -->

#### <a id="s-EXEC-BUY"></a>`EXEC.BUY(s)`

prop · L430–430

<!-- note:EXEC.BUY -->
<!-- /note -->

#### <a id="s-EXEC-CHARGE"></a>`EXEC.CHARGE(s)`

prop · L431–441

- calls: [`apHold`](../flight/autopilot.js.md#s-apHold) _js/flight/autopilot.js_ · [`busIdle`](../flight/autopilot.js.md#s-busIdle) _js/flight/autopilot.js_ · [`batteryCap`](#s-batteryCap) · [`untilMet`](#s-untilMet)

<!-- note:EXEC.CHARGE -->
- L434 · `const frac = ship.charge / batteryCap(ship);` — live: autopilot.power only refreshes while a leg flies
- L439 · `if (ship.dockedAt && sim.time - mission.stepStartedAt > 240) { mission.run.why = "charged` — a port that cannot fill the bank is not worth a night: the old loop left after four minutes
<!-- /note -->

#### <a id="s-EXEC-WAIT"></a>`EXEC.WAIT(s)`

prop · L442–446

- calls: [`apHold`](../flight/autopilot.js.md#s-apHold) _js/flight/autopilot.js_ · [`untilMet`](#s-untilMet)

<!-- note:EXEC.WAIT -->
<!-- /note -->

#### <a id="s-EXEC-HOLD"></a>`EXEC.HOLD(s)`

prop · L447–451

- calls: [`apHold`](../flight/autopilot.js.md#s-apHold) _js/flight/autopilot.js_ · [`untilMet`](#s-untilMet)

<!-- note:EXEC.HOLD -->
<!-- /note -->

#### <a id="s-EXEC-SURVEY"></a>`EXEC.SURVEY(s)`

prop · L452–464

- calls: [`apPark`](../flight/autopilot.js.md#s-apPark) _js/flight/autopilot.js_ · [`ensureUndocked`](#s-ensureUndocked) · [`resolve`](#s-resolve) · [`requestScan`](../sim/sim.js.md#s-requestScan) _js/sim/sim.js_
- via [js/sim/sim.js](../sim/sim.js.md): `sim.scanned.has`

<!-- note:EXEC.SURVEY -->
<!-- /note -->

#### <a id="s-EXEC-SET"></a>`EXEC.SET(s)`

prop · L465–473

- calls: [`setMiningMode`](../sim/sim.js.md#s-setMiningMode) _js/sim/sim.js_ · [`setTurretMode`](../sim/sim.js.md#s-setTurretMode) _js/sim/sim.js_ · [`toggleSystem`](../sim/sim.js.md#s-toggleSystem) _js/sim/sim.js_
- effects: dom.query `[data-posture="${…}"]`

<!-- note:EXEC.SET -->
<!-- /note -->

### <a id="s-beginAsk"></a>`beginAsk(node)`

function · L476–490

- calls: [`post`](../comms/chat.js.md#s-post) _js/comms/chat.js_ · [`warpReserve`](../flight/autopilot.js.md#s-warpReserve) _js/flight/autopilot.js_
- called by: [`tickMission`](#s-tickMission)

<!-- note:beginAsk -->
---- the tick -------------------------------------------------------------------
<!-- /note -->

#### <a id="s-beginAsk-run"></a>`beginAsk.run()`

prop · L484–484

- calls: [`answerAsk`](#s-answerAsk)

<!-- note:beginAsk.run -->
<!-- /note -->

#### <a id="s-beginAsk-run-2"></a>`beginAsk.run~2()`

prop · L485–485

- calls: [`answerAsk`](#s-answerAsk)

<!-- note:beginAsk.run~2 -->
<!-- /note -->

#### <a id="s-beginAsk-run-3"></a>`beginAsk.run~3()`

prop · L486–486

- calls: [`answerAsk`](#s-answerAsk)

<!-- note:beginAsk.run~3 -->
<!-- /note -->

### <a id="s-tickMission"></a>`tickMission(dt)`

function · **exported** · L492–513

- calls: [`authorize`](../aria/mind.js.md#s-authorize) _js/aria/mind.js_ · [`advance`](#s-advance) ×2 · [`beginAsk`](#s-beginAsk) · [`fail`](#s-fail) ×3 · [`mirror`](#s-mirror) · [`step`](#s-step) · [`stepThrustCap`](#s-stepThrustCap)
- called by: [`tickAutopilot`](../flight/autopilot.js.md#s-tickAutopilot) _js/flight/autopilot.js_

<!-- note:tickMission -->
called by autopilot.tickAutopilot every tick it has the ship
<!-- /note -->

### <a id="s-missionStatusLine"></a>`missionStatusLine()`

function · **exported** · L515–527

- calls: [`step`](#s-step) · [`describeRef`](script.js.md#s-describeRef) _js/mission/script.js_
- called by: [`mountAutopilot`](../console/panels/nav.js.md#s-mountAutopilot) _js/console/panels/nav.js_ · [`search.status~3`](../console/panels/nav.js.md#s-search-status-3) _js/console/panels/nav.js_ · [`liveCard`](../console/panels/work.js.md#s-liveCard) _js/console/panels/work.js_ · [`search`](../console/panels/work.js.md#s-search) _js/console/panels/work.js_ · [`wireAutopilot`](../flight/autopilot.js.md#s-wireAutopilot) _js/flight/autopilot.js_

<!-- note:missionStatusLine -->
---- status ------------------------------------------------------------------------

→ "MINE LOOP · 2/3 DOCK Foundry Hold · lane · 3 loops · 12,400 cr"
<!-- /note -->

### <a id="s-saveRun"></a>`saveRun()`

function · **exported** · L529–535

- calls: [`RUN_KEY`](#s-RUN_KEY) · [`serialize`](script.js.md#s-serialize) _js/mission/script.js_
- called by: [`advance`](#s-advance) · [`pauseMission`](#s-pauseMission) · [`startMission`](#s-startMission)

<!-- note:saveRun -->
---- persistence -------------------------------------------------------------------

- L534 · `} catch {` — storage is a convenience
<!-- /note -->

### <a id="s-clearRun"></a>`clearRun()`

function · **exported** · L537–539

- calls: [`RUN_KEY`](#s-RUN_KEY)
- called by: [`stopMission`](#s-stopMission)
- effects: storage.remove `‹RUN_KEY()›`

<!-- note:clearRun -->
- L538 · `try { globalThis.localStorage?.removeItem(RUN_KEY()); } catch {` — ignore
<!-- /note -->

### <a id="s-restoreRun"></a>`restoreRun()`

function · **exported** · L541–565

- calls: [`note`](#s-note) · [`RUN_KEY`](#s-RUN_KEY) · [`deserialize`](script.js.md#s-deserialize) _js/mission/script.js_
- called by: [`tickAutopilot`](../flight/autopilot.js.md#s-tickAutopilot) _js/flight/autopilot.js_
- effects: storage.get `‹RUN_KEY()›`

<!-- note:restoreRun -->
On the first tick in a sky: a saved run comes back paused — a reload never flies by itself.

- L556 · `mission.trade = o.trade ?? null;` — a trade round comes back with the route it bought for
<!-- /note -->

## Module-level calls

- calls: [`makeLegs`](detour.js.md#s-makeLegs) _js/mission/detour.js_

## Orphaned notes

_Anchors that no longer exist in the code. Kept so nothing is lost — move or delete by hand._

### `legTo`

<!-- note:legTo -->
---- executors ------------------------------------------------------------------

0.3.88: a world across the corridor used to end the step — "jupiter in
lane" — and with it the whole mission. A pilot flies round it; ARIA at the
conn cannot, so every dock at "the best buyer" or the yard was a coin toss
on where the planets stood. An ARIA mission now takes the dogleg itself:
a transient mark clear of the world, a hop to it, then the leg resumes.
Missions a pilot starts by hand are left as they were.
<!-- /note -->
