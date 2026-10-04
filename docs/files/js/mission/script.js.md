# js/mission/script.js

[index](../../../README.md) · 303 lines · 43 symbols · 3 imports · 15 importers

## About

<!-- note:@file -->
LIVING GALAXY — mission scripts: the schema the autopilot flies.

A mission is a list of steps, each one an op the autopilot knows how to fly
(go somewhere, dock, mine, sell, wait…), with an optional target, an
optional "until" condition, and per-step overrides of the thrust cap and the
warp policy. A loop row repeats the list ×N or until a condition holds.
This file is the data side only — schema, validation, conditions,
descriptions, presets and the per-pilot save list. run.js flies them.

Step    { id, op, target?: Ref, args?: {}, until?: Cond, thrustCap?: 0.1..1.4, warp?: "auto"|"ask"|"never", onFail?: "abort"|"skip"|"retry" }
Ref     { kind: "body"|"station"|"wp"|"point"|"best-buyer"|"best-smelter"|"nearest-port"|"seam"|"here"|"locked"|"trade-source"|"trade-dest", id?, x?, y?, z?, name? }
        (0.3.19: trade-source / trade-dest are the two ends of the run's trade route — traderoutes.js — picked at the source dock each round)
Cond    { k: "hold"|"credits"|"charge"|"hull"|"time"|"docked"|"cargoOf"|"loops", op, v, id? } | { all: [] } | { any: [] } | { not: Cond }
Mission { id, name, steps: Step[], loop: { mode: "none"|"count"|"until", count?, until?: Cond }, defaults: { thrustCap: 1, warp: "auto" }, createdAt, runs }

- L? · `import { hasUpgrade, fx } from "../upgrades.js";` — Does this hull carry a mission computer?
  
  Asked as a CAPABILITY, not as an upgrade id. The gate used to read
  `hasUpgrade("nav_core")`, and the Conn learning core (11,000 cr) declares
  `fx: { missions: true }` with a blurb that says it "carries a mission
  computer" — so the dearer of the two cores advertised multi-step missions
  and then did not unlock them. Anything that grants `missions` opens the
  editor now, which is what the fx table was for.
<!-- /note -->

## Imports

| line | from | names | target |
|---|---|---|---|
| 1 | `../sim/sim.js` | `*` as `simMod` | [js/sim/sim.js](../sim/sim.js.md) |
| 2 | `../flight/ship.js` | `*` as `shipMod` | [js/flight/ship.js](../flight/ship.js.md) |
| 8 | `../economy/upgrades.js` | `hasUpgrade`, `fx` | [js/economy/upgrades.js](../economy/upgrades.js.md) |

## Imported by

- [js/aria/pilot.js](../aria/pilot.js.md) — `makeMission`, `makeStep`
- [js/aria/play.js](../aria/play.js.md) — `makeMission`, `makeStep`
- [js/console/panels/market.js](../console/panels/market.js.md) — `makeMission`, `makeStep`, `presets`
- [js/console/panels/nav.js](../console/panels/nav.js.md) — `oneStep`
- [js/console/panels/work.js](../console/panels/work.js.md) — `OPS`, `COND_KEYS`, `COND_OPS`, `WARP_POLICIES`, `ON_FAIL`, `makeMission`, `makeStep`, `validate`, `describeStep`, `describeCond`, `presets`, `loadMissions`, `saveMissions`, `serialize`, `deserialize`, `missionCore`
- [js/flight/autopilot.js](../flight/autopilot.js.md) — `oneStep`, `makeMission`, `makeStep`
- [js/mission/run.js](run.js.md) — `validate`, `evalCond`, `snapshot`, `describeRef`, `deserialize`, `serialize`, `makeStep`, `missionCore`
- [js/ui/tutorial-core.js](../ui/tutorial-core.js.md) — `missionCore`, `oneStep`
- test/aria-mining-loop.test.mjs _(outside js/)_ — `makeMission`, `makeStep`
- test/ariamind-integration.test.mjs _(outside js/)_ — `makeMission`, `makeStep`
- test/ariaplay.test.mjs _(outside js/)_ — `validate`
- test/ariasense.test.mjs _(outside js/)_ — `validate`
- test/jobloop.test.mjs _(outside js/)_ — `validate`
- test/mission.test.mjs _(outside js/)_ — `OPS`, `makeMission`, `makeStep`, `oneStep`, `validate`, `evalCond`, `describeStep`, `serialize`, `deserialize`, `presets`, `MISSIONS_KEY`, `loadMissions`, `saveMissions`
- test/trade.test.mjs _(outside js/)_ — `presets`, `validate`

## Exports

- [`missionCore`](#s-missionCore) · function — used by [js/console/panels/work.js](../console/panels/work.js.md), [js/mission/run.js](run.js.md), [js/ui/tutorial-core.js](../ui/tutorial-core.js.md)
- [`OPS`](#s-OPS) · const — used by [js/console/panels/work.js](../console/panels/work.js.md), test/mission.test.mjs
- [`REF_KINDS`](#s-REF_KINDS) · const — **no importer in scanned roots**
- [`COND_KEYS`](#s-COND_KEYS) · const — used by [js/console/panels/work.js](../console/panels/work.js.md)
- [`COND_OPS`](#s-COND_OPS) · const — used by [js/console/panels/work.js](../console/panels/work.js.md)
- [`WARP_POLICIES`](#s-WARP_POLICIES) · const — used by [js/console/panels/work.js](../console/panels/work.js.md)
- [`ON_FAIL`](#s-ON_FAIL) · const — used by [js/console/panels/work.js](../console/panels/work.js.md)
- [`makeMission`](#s-makeMission) · function — used by [js/aria/pilot.js](../aria/pilot.js.md), [js/aria/play.js](../aria/play.js.md), [js/console/panels/market.js](../console/panels/market.js.md), [js/console/panels/work.js](../console/panels/work.js.md), [js/flight/autopilot.js](../flight/autopilot.js.md), test/aria-mining-loop.test.mjs, test/ariamind-integration.test.mjs, test/mission.test.mjs
- [`makeStep`](#s-makeStep) · function — used by [js/aria/pilot.js](../aria/pilot.js.md), [js/aria/play.js](../aria/play.js.md), [js/console/panels/market.js](../console/panels/market.js.md), [js/console/panels/work.js](../console/panels/work.js.md), [js/flight/autopilot.js](../flight/autopilot.js.md), [js/mission/run.js](run.js.md), test/aria-mining-loop.test.mjs, test/ariamind-integration.test.mjs, test/mission.test.mjs
- [`oneStep`](#s-oneStep) · function — used by [js/console/panels/nav.js](../console/panels/nav.js.md), [js/flight/autopilot.js](../flight/autopilot.js.md), [js/ui/tutorial-core.js](../ui/tutorial-core.js.md), test/mission.test.mjs
- [`validate`](#s-validate) · function — used by [js/console/panels/work.js](../console/panels/work.js.md), [js/mission/run.js](run.js.md), test/ariaplay.test.mjs, test/ariasense.test.mjs, test/jobloop.test.mjs, test/mission.test.mjs, test/trade.test.mjs
- [`snapshot`](#s-snapshot) · function — used by [js/mission/run.js](run.js.md)
- [`evalCond`](#s-evalCond) · function — used by [js/mission/run.js](run.js.md), test/mission.test.mjs
- [`describeCond`](#s-describeCond) · function — used by [js/console/panels/work.js](../console/panels/work.js.md)
- [`describeRef`](#s-describeRef) · function — used by [js/mission/run.js](run.js.md)
- [`describeStep`](#s-describeStep) · function — used by [js/console/panels/work.js](../console/panels/work.js.md), test/mission.test.mjs
- [`serialize`](#s-serialize) · function — used by [js/console/panels/work.js](../console/panels/work.js.md), [js/mission/run.js](run.js.md), test/mission.test.mjs
- [`deserialize`](#s-deserialize) · function — used by [js/console/panels/work.js](../console/panels/work.js.md), [js/mission/run.js](run.js.md), test/mission.test.mjs
- [`presets`](#s-presets) · function — used by [js/console/panels/market.js](../console/panels/market.js.md), [js/console/panels/work.js](../console/panels/work.js.md), test/mission.test.mjs, test/trade.test.mjs
- [`MISSIONS_KEY`](#s-MISSIONS_KEY) · function — used by test/mission.test.mjs
- [`loadMissions`](#s-loadMissions) · function — used by [js/console/panels/work.js](../console/panels/work.js.md), test/mission.test.mjs
- [`saveMissions`](#s-saveMissions) · function — used by [js/console/panels/work.js](../console/panels/work.js.md), test/mission.test.mjs

## Effects

- **storage.get** — `‹MISSIONS_KEY()›` (loadMissions:287)
- **storage.set** — `‹MISSIONS_KEY()›` (saveMissions:298)

## Symbols

### <a id="s-sim"></a>`sim()`

function · L4–4

- called by: [`MISSIONS_KEY`](#s-MISSIONS_KEY) · [`snapshot`](#s-snapshot)

<!-- note:sim -->
<!-- /note -->

### <a id="s-BATTERY"></a>`BATTERY()`

function · L5–5

- called by: [`batteryCap`](#s-batteryCap)

<!-- note:BATTERY -->
<!-- /note -->

### <a id="s-batteryCap"></a>`batteryCap(ship)`

function · L6–6

- calls: [`batteryCap`](../flight/ship.js.md#s-batteryCap) _js/flight/ship.js_ · [`BATTERY`](#s-BATTERY)
- called by: [`snapshot`](#s-snapshot)

<!-- note:batteryCap -->
package D exports batteryCap(ship) from ship.js; until it lands the rated battery is the cap
<!-- /note -->

### <a id="s-missionCore"></a>`missionCore()`

function · **exported** · L10–10

- calls: [`fx`](../economy/upgrades.js.md#s-fx) _js/economy/upgrades.js_ · [`hasUpgrade`](../economy/upgrades.js.md#s-hasUpgrade) _js/economy/upgrades.js_
- called by: [`editor>core`](../console/panels/work.js.md#s-editor-core) _js/console/panels/work.js_ · [`startMission`](run.js.md#s-startMission) _js/mission/run.js_ · [`hasFit`](../ui/tutorial-core.js.md#s-hasFit) _js/ui/tutorial-core.js_

<!-- note:missionCore -->
<!-- /note -->

### <a id="s-OPS"></a>`OPS`

const · **exported** · L12–33

<!-- note:OPS -->
- L20 · `DELIVER:  { label: "Deliver" },` — 0.3.72: close the delivery jobs due at this port
- L30 · `REFIT:    { label: "Refit",    args: { id: null } },` — 0.3.06 — what ARIA spends money on at a port it is already sitting at.
  Both are docked-only and both name their subject in args, so a step
  serialises and comes back without a target reference to resolve.
- L32 · `FAB:      { label: "Fabricate", args: { good: null, qty: 1 } },` — 0.3.10 — put a fabrication job on the port's line and fly on; it finishes
  on sim time and lands in that port's locker.
<!-- /note -->

### <a id="s-REF_KINDS"></a>`REF_KINDS`

const · **exported** · L35–35

<!-- note:REF_KINDS -->
<!-- /note -->

### <a id="s-COND_KEYS"></a>`COND_KEYS`

const · **exported** · L36–36

<!-- note:COND_KEYS -->
<!-- /note -->

### <a id="s-COND_OPS"></a>`COND_OPS`

const · **exported** · L37–37

<!-- note:COND_OPS -->
<!-- /note -->

### <a id="s-WARP_POLICIES"></a>`WARP_POLICIES`

const · **exported** · L38–38

<!-- note:WARP_POLICIES -->
<!-- /note -->

### <a id="s-ON_FAIL"></a>`ON_FAIL`

const · **exported** · L39–39

<!-- note:ON_FAIL -->
<!-- /note -->

### <a id="s-TARGETS_FOR"></a>`TARGETS_FOR`

const · L40–45

<!-- note:TARGETS_FOR -->
which target kinds each op accepts (null = no target)
<!-- /note -->

### <a id="s-_n"></a>`_n`

const · L47–47

<!-- note:_n -->
<!-- /note -->

### <a id="s-uid"></a>`uid(p)`

function · L48–48

- called by: [`makeMission`](#s-makeMission) ×2 · [`makeStep`](#s-makeStep)

<!-- note:uid -->
<!-- /note -->

### <a id="s-clone"></a>`clone(o)`

function · L49–49

- called by: [`deserialize`](#s-deserialize) · [`makeStep`](#s-makeStep) ×2

<!-- note:clone -->
<!-- /note -->

### <a id="s-infOut"></a>`infOut(k, v)`

function · L50–50

<!-- note:infOut -->
<!-- /note -->

### <a id="s-infIn"></a>`infIn(k, v)`

function · L51–51

<!-- note:infIn -->
<!-- /note -->

### <a id="s-makeMission"></a>`makeMission(partial=)`

function · **exported** · L53–68

- calls: [`uid`](#s-uid) ×2
- called by: [`MISSION`](../aria/pilot.js.md#s-MISSION) _js/aria/pilot.js_ · [`jobPlan`](../aria/play.js.md#s-jobPlan) _js/aria/play.js_ · [`startFreeMine`](../aria/play.js.md#s-startFreeMine) _js/aria/play.js_ · [`startFreeSalvage`](../aria/play.js.md#s-startFreeSalvage) _js/aria/play.js_ · [`startRoute`](../aria/play.js.md#s-startRoute) _js/aria/play.js_ · [`startSell`](../aria/play.js.md#s-startSell) _js/aria/play.js_ · [`startSupply`](../aria/play.js.md#s-startSupply) _js/aria/play.js_ · [`startYard`](../aria/play.js.md#s-startYard) _js/aria/play.js_ · [`flyRoute`](../console/panels/market.js.md#s-flyRoute) _js/console/panels/market.js_ · [`editor>render`](../console/panels/work.js.md#s-editor-render) _js/console/panels/work.js_ · [`fresh`](../console/panels/work.js.md#s-fresh) _js/console/panels/work.js_ · [`engageJobLoop`](../flight/autopilot.js.md#s-engageJobLoop) _js/flight/autopilot.js_ · [`engageMiningLoop`](../flight/autopilot.js.md#s-engageMiningLoop) _js/flight/autopilot.js_ · [`engageSalvageLoop`](../flight/autopilot.js.md#s-engageSalvageLoop) _js/flight/autopilot.js_ · [`deserialize`](#s-deserialize) · [`oneStep`](#s-oneStep) · [`presets`](#s-presets) ×5

<!-- note:makeMission -->
ids and defaults filled
<!-- /note -->

### <a id="s-makeStep"></a>`makeStep(op, target=, extra=)`

function · **exported** · L70–76

- calls: [`clone`](#s-clone) ×2 · [`uid`](#s-uid)
- called by: [`deskSteps`](../aria/pilot.js.md#s-deskSteps) _js/aria/pilot.js_ ×4 · [`rawPlanJob`](../aria/pilot.js.md#s-rawPlanJob) _js/aria/pilot.js_ ×18 · [`jobPlan`](../aria/play.js.md#s-jobPlan) _js/aria/play.js_ ×20 · [`legsTo`](../aria/play.js.md#s-legsTo) _js/aria/play.js_ ×2 · [`startFreeMine`](../aria/play.js.md#s-startFreeMine) _js/aria/play.js_ ×3 · [`startFreeSalvage`](../aria/play.js.md#s-startFreeSalvage) _js/aria/play.js_ ×3 · [`startRoute`](../aria/play.js.md#s-startRoute) _js/aria/play.js_ ×2 · [`startSell`](../aria/play.js.md#s-startSell) _js/aria/play.js_ ×2 · [`startSupply`](../aria/play.js.md#s-startSupply) _js/aria/play.js_ ×2 · [`startYard`](../aria/play.js.md#s-startYard) _js/aria/play.js_ · [`flyRoute`](../console/panels/market.js.md#s-flyRoute) _js/console/panels/market.js_ ×4 · [`editor>render.onPick~3`](../console/panels/work.js.md#s-editor-render-onPick-3) _js/console/panels/work.js_ · [`engageJobLoop`](../flight/autopilot.js.md#s-engageJobLoop) _js/flight/autopilot.js_ ×5 · [`engageMiningLoop`](../flight/autopilot.js.md#s-engageMiningLoop) _js/flight/autopilot.js_ ×7 · [`engageSalvageLoop`](../flight/autopilot.js.md#s-engageSalvageLoop) _js/flight/autopilot.js_ ×8 · [`startMission`](run.js.md#s-startMission) _js/mission/run.js_ · [`oneStep`](#s-oneStep) · [`presets`](#s-presets) ×18

<!-- note:makeStep -->
<!-- /note -->

### <a id="s-oneStep"></a>`oneStep(op, target, defaults=)`

function · **exported** · L78–81

- calls: [`makeMission`](#s-makeMission) · [`makeStep`](#s-makeStep)
- called by: [`mountAutopilot>go`](../console/panels/nav.js.md#s-mountAutopilot-go) _js/console/panels/nav.js_ · [`mountTargets`](../console/panels/nav.js.md#s-mountTargets) _js/console/panels/nav.js_ · [`engageAutopilot`](../flight/autopilot.js.md#s-engageAutopilot) _js/flight/autopilot.js_ · [`autoDock`](../ui/tutorial-core.js.md#s-autoDock) _js/ui/tutorial-core.js_

<!-- note:oneStep -->
mission with one step, loop none — what HUD/chart buttons build
<!-- /note -->

### <a id="s-condErrors"></a>`condErrors(c, where, out)`

function · L83–94

- calls: [`condErrors`](#s-condErrors) ×3
- called by: [`condErrors`](#s-condErrors) ×3 · [`validate`](#s-validate) ×2

<!-- note:condErrors -->
---- validation -----------------------------------------------------------
<!-- /note -->

### <a id="s-validate"></a>`validate(m)`

function · **exported** · L96–128

- calls: [`condErrors`](#s-condErrors) ×2
- called by: [`editor>render`](../console/panels/work.js.md#s-editor-render) _js/console/panels/work.js_ · [`startMission`](run.js.md#s-startMission) _js/mission/run.js_ · [`deserialize`](#s-deserialize)

<!-- note:validate -->
→ [{ step, msg }] — empty when the mission can fly
<!-- /note -->

### <a id="s-snapshot"></a>`snapshot({…}=)`

function · **exported** · L130–145

- calls: [`cargoTotal`](../flight/ship.js.md#s-cargoTotal) _js/flight/ship.js_ · [`batteryCap`](#s-batteryCap) · [`sim`](#s-sim)
- called by: [`advance`](run.js.md#s-advance) _js/mission/run.js_ · [`untilMet`](run.js.md#s-untilMet) _js/mission/run.js_

<!-- note:snapshot -->
---- conditions ------------------------------------------------------------

→ { hold, credits, charge, hull, time, docked, cargoOf(id), loops }; run.js passes its clock and loop count
<!-- /note -->

#### <a id="s-snapshot-cargoOf"></a>`snapshot.cargoOf(id)`

prop · L142–142

<!-- note:snapshot.cargoOf -->
<!-- /note -->

### <a id="s-CMP"></a>`CMP`

const · L147–150

<!-- note:CMP -->
<!-- /note -->

##### <a id="s-CMP-"></a>`CMP.>=(a, b)`

prop · L148–148

<!-- note:CMP.>= -->
<!-- /note -->

#### <a id="s-CMP--2"></a>`CMP.<=(a, b)`

prop · L148–148

<!-- note:CMP.<= -->
<!-- /note -->

##### <a id="s-CMP--3"></a>`CMP.>(a, b)`

prop · L148–148

<!-- note:CMP.> -->
<!-- /note -->

#### <a id="s-CMP--4"></a>`CMP.<(a, b)`

prop · L148–148

<!-- note:CMP.< -->
<!-- /note -->

#### <a id="s-CMP--5"></a>`CMP.==(a, b)`

prop · L149–149

<!-- note:CMP.== -->
<!-- /note -->

#### <a id="s-CMP--6"></a>`CMP.!=(a, b)`

prop · L149–149

<!-- note:CMP.!= -->
<!-- /note -->

### <a id="s-evalCond"></a>`evalCond(cond, snap)`

function · **exported** · L152–162

- calls: [`evalCond`](#s-evalCond) ×3
- called by: [`advance`](run.js.md#s-advance) _js/mission/run.js_ · [`untilMet`](run.js.md#s-untilMet) _js/mission/run.js_ · [`evalCond`](#s-evalCond) ×3

<!-- note:evalCond -->
<!-- /note -->

### <a id="s-OPSYM"></a>`OPSYM`

const · L164–164

<!-- note:OPSYM -->
---- descriptions -----------------------------------------------------------
<!-- /note -->

### <a id="s-FRAC"></a>`FRAC`

const · L165–165

<!-- note:FRAC -->
<!-- /note -->

### <a id="s-describeCond"></a>`describeCond(c)`

function · **exported** · L167–175

- calls: [`describeCond`](#s-describeCond)
- called by: [`editor>render`](../console/panels/work.js.md#s-editor-render) _js/console/panels/work.js_ ×3 · [`describeCond`](#s-describeCond) · [`describeStep`](#s-describeStep)

<!-- note:describeCond -->
<!-- /note -->

### <a id="s-describeRef"></a>`describeRef(r)`

function · **exported** · L177–195

- called by: [`missionStatusLine`](run.js.md#s-missionStatusLine) _js/mission/run.js_ · [`describeStep`](#s-describeStep)

<!-- note:describeRef -->
<!-- /note -->

### <a id="s-describeStep"></a>`describeStep(step)`

function · **exported** · L197–211

- calls: [`describeCond`](#s-describeCond) · [`describeRef`](#s-describeRef)
- called by: [`editor>render`](../console/panels/work.js.md#s-editor-render) _js/console/panels/work.js_ · [`liveCard`](../console/panels/work.js.md#s-liveCard) _js/console/panels/work.js_ · [`stepSheet`](../console/panels/work.js.md#s-stepSheet) _js/console/panels/work.js_

<!-- note:describeStep -->
→ "MINE the seam until hold ≥ 90% · ≤75% · warp ask"
<!-- /note -->

### <a id="s-serialize"></a>`serialize(m)`

function · **exported** · L213–215

- called by: [`editor>render`](../console/panels/work.js.md#s-editor-render) _js/console/panels/work.js_ · [`fresh`](../console/panels/work.js.md#s-fresh) _js/console/panels/work.js_ · [`saveRun`](run.js.md#s-saveRun) _js/mission/run.js_ · [`startMission`](run.js.md#s-startMission) _js/mission/run.js_

<!-- note:serialize -->
---- serialize ---------------------------------------------------------------
<!-- /note -->

### <a id="s-deserialize"></a>`deserialize(json)`

function · **exported** · L217–226

- calls: [`clone`](#s-clone) · [`makeMission`](#s-makeMission) · [`validate`](#s-validate)
- called by: [`editor>render`](../console/panels/work.js.md#s-editor-render) _js/console/panels/work.js_ · [`fresh`](../console/panels/work.js.md#s-fresh) _js/console/panels/work.js_ · [`restoreRun`](run.js.md#s-restoreRun) _js/mission/run.js_ · [`startMission`](run.js.md#s-startMission) _js/mission/run.js_ · [`loadMissions`](#s-loadMissions)

<!-- note:deserialize -->
→ Mission (validated, defaults re-applied) or null when it cannot be read
<!-- /note -->

### <a id="s-C"></a>`C(k, op, v, id)`

function · L228–228

- called by: [`presets`](#s-presets) ×9

<!-- note:C -->
---- presets ------------------------------------------------------------------
<!-- /note -->

### <a id="s-presets"></a>`presets()`

function · **exported** · L230–281

- calls: [`C`](#s-C) ×9 · [`makeMission`](#s-makeMission) ×5 · [`makeStep`](#s-makeStep) ×18
- called by: [`mountRoutes`](../console/panels/market.js.md#s-mountRoutes) _js/console/panels/market.js_ · [`editor>render`](../console/panels/work.js.md#s-editor-render) _js/console/panels/work.js_ · [`search`](../console/panels/work.js.md#s-search) _js/console/panels/work.js_

<!-- note:presets -->
MINE LOOP, TRADE RUN, SURVEY SWEEP, PATROL — fresh copies each call.

All four are `builtin`, which is the flag `startMission` checks before it
asks for a Mission core. They were not, and the effect was that a pilot with
no core could not fly ANY multi-step plan — not even the four the game ships
and shows at the top of the editor. The core is meant to gate missions you
WRITE, not the stock loops; `fresh()` in the editor strips the flag, so the
moment a preset is copied out to be edited it becomes yours and is gated
like anything else you build.

- L232 · `makeMission({` — 0.3.19 — TRADE RUN flies a ROUTE (traderoutes.js): at the top of each
  round it picks the best buy-here-sell-there run from where the hull is,
  with the hold and the purse it has, docks at the source, buys the
  route's cargo (all the hold and purse allow), docks at the buyer, sells
  exactly that and nothing it was carrying for anyone else. It used to
  dock at the nearest port, buy the cheapest thing on the shelf, "fly" to
  a best buyer that was almost always the same port, and sell it straight
  back below what it paid — a guaranteed loss every round.
<!-- /note -->

### <a id="s-MISSIONS_KEY"></a>`MISSIONS_KEY()`

function · **exported** · L283–283

- calls: [`sim`](#s-sim)
- called by: [`loadMissions`](#s-loadMissions) · [`saveMissions`](#s-saveMissions)

<!-- note:MISSIONS_KEY -->
---- the per-pilot save list ---------------------------------------------------
<!-- /note -->

### <a id="s-loadMissions"></a>`loadMissions()`

function · **exported** · L285–294

- calls: [`deserialize`](#s-deserialize) · [`MISSIONS_KEY`](#s-MISSIONS_KEY)
- called by: [`list`](../console/panels/work.js.md#s-list) _js/console/panels/work.js_ · [`mount`](../console/panels/work.js.md#s-mount) _js/console/panels/work.js_ · [`search`](../console/panels/work.js.md#s-search) _js/console/panels/work.js_
- effects: storage.get `‹MISSIONS_KEY()›`

<!-- note:loadMissions -->
<!-- /note -->

### <a id="s-saveMissions"></a>`saveMissions(list)`

function · **exported** · L296–303

- calls: [`MISSIONS_KEY`](#s-MISSIONS_KEY)
- called by: [`persist`](../console/panels/work.js.md#s-persist) _js/console/panels/work.js_
- effects: storage.set `‹MISSIONS_KEY()›`

<!-- note:saveMissions -->
<!-- /note -->
