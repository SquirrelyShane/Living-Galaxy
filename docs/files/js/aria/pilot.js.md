# js/aria/pilot.js

[index](../../../README.md) · 518 lines · 40 symbols · 19 imports · 3 importers

## About

<!-- note:@file -->
LIVING GALAXY — ARIA at the conn, flying your jobs the way you fly them.

0.3 let ARIA hold the conn like a crew captain: every second it asked the
house core for a reflex and then STEERED — a pan toward the target and a
throttle, with no avoidance, no power rule, no warp plotting, no docking
lane and no idea what to do once it got somewhere. It could point at a belt;
it could not work one.

The autopilot could. The mission runner (js/mission/run.js) already mines a
seam, docks on the lane, sells, smelts, charges and jumps, under the power
rule and the avoidance solver. So ARIA no longer flies the stick at all. It
is a PLANNER: it looks at the ship and at what YOU spend your time doing, and
hands the runner one job at a time —

  repair   hull under 45%: the nearest port with a repair yard, dock, REPAIR
  sell     hold 85% full: dock where you sell (aria preferences lean the
           choice), then SELL, SMELT or STASH the way your plan is set
  mine     a seam, cut to 90%, then the same run to the desk
  survey   the nearest world not yet in the log
  refit    the money is in and the hull is whole: dock at a yard that fits
           the kit its job wants, and buy it (0.3.06)
  build    the company can stand a drone that does its job while the ship
           does something else: dock and put one on the line (0.3.06)

— and which job is YOUR job is counted, not guessed: every five seconds of
your own flying is labelled by what you were doing (captain.js already takes
that label for the house core) and tallied under `aria.prefs.job`, and a
mission you start yourself counts three. ARIA picks the job you do most that
the ship can do right now. With nothing to go on it mines if there is a belt
and surveys if there is not, and says so.

The last two are not habits and are never learned as one — you do not fly a
refit — so they are picked by a separate, deliberately cautious rule: a
reserve it will not spend, one purchase per cooldown, nothing bought with a
hurt hull or a hostile close, and only at a port near enough that the trip
costs less than the kit returns. What it buys is chosen by the job you do
most, because the cutter that helps a miner is worth more to you than
whatever happens to be cheapest.

Touch the stick and you have the ship back. Docked, it buys hull at the yard
and sells a hold before it goes out again, like you would. Under fire it puts
the guns on CASTLE; on a bus that cannot carry itself it sheds the cutter and
gravity rather than standing down.

- L41 · `let prefs = null;` — aria.prefs, bound by wireAriaPilot (aria.js imports this module)
<!-- /note -->

## Imports

| line | from | names | target |
|---|---|---|---|
| 1 | `./mind.js` | `ariaMind`, `authorize`, `contextualScore`, `decideMind`, `policyScore`, `learnOutcome`, `breakLine` | [js/aria/mind.js](mind.js.md) |
| 2 | `../sim/sim.js` | `sim`, `logEvent`, `setTurretMode`, `setMiningMode`, `toggleSystem` | [js/sim/sim.js](../sim/sim.js.md) |
| 3 | `../flight/ship.js` | `cargoTotal`, `holdRoom`, `batteryCap` | [js/flight/ship.js](../flight/ship.js.md) |
| 4 | `../station/stations.js` | `stations`, `stationById` | [js/station/stations.js](../station/stations.js.md) |
| 5 | `../world/bodies.js` | `BODIES`, `dist3` | [js/world/bodies.js](../world/bodies.js.md) |
| 6 | `../flight/turrets.js` | `contacts` | [js/flight/turrets.js](../flight/turrets.js.md) |
| 7 | `../npc/captain.js` | `captain`, `ariaHooks` as `hooks` | [js/npc/captain.js](../npc/captain.js.md) |
| 8 | `../flight/autopilot.js` | `autopilot`, `nearestSeam`, `busOverload`, `pilotInput` | [js/flight/autopilot.js](../flight/autopilot.js.md) |
| 9 | `../mission/run.js` | `mission`, `startMission`, `stopMission`, `EXEC` | [js/mission/run.js](../mission/run.js.md) |
| 10 | `../mission/script.js` | `makeMission`, `makeStep` | [js/mission/script.js](../mission/script.js.md) |
| 11 | `../flight/repair.js` | `repairsAt`, `pricePerPoint`, `yardRepair`, `repairQuote`, `hullMaxOf` | [js/flight/repair.js](../flight/repair.js.md) |
| 12 | `../economy/upgrades.js` | `upgradeOptions`, `buyUpgrade`, `hasUpgrade`, `effectOf` | [js/economy/upgrades.js](../economy/upgrades.js.md) |
| 13 | `../drones/ops.js` | `buildOptions`, `orderBuild` | [js/drones/ops.js](../drones/ops.js.md) |
| 14 | `../economy/fabricate.js` | `orderFab`, `planJob` as `planFab`, `canFabAt`, `fabMenuAt`, `maxRunnable`, `fabQueueAt`, `FAB` | [js/economy/fabricate.js](../economy/fabricate.js.md) |
| 15 | `../flight/recorder.js` | `neighbours`, `snapshot` | [js/flight/recorder.js](../flight/recorder.js.md) |
| 16 | `../corp/company.js` | `company`, `hasCompany` | [js/corp/company.js](../corp/company.js.md) |
| 17 | `../flight/pilot.js` | `pilot` | [js/flight/pilot.js](../flight/pilot.js.md) |
| 18 | `../mission/salvage.js` | `bestHulk`, `SALV` | [js/mission/salvage.js](../mission/salvage.js.md) |
| 19 | `../world/hulks.js` | `hulks` | [js/world/hulks.js](../world/hulks.js.md) |

## Imported by

- [js/aria/aria.js](aria.js.md) — `beginAriaWatch`, `endAriaWatch`, `tickAriaPilot`, `wireAriaPilot`, `bindAriaPrefs`, `notePlayLabel`, `notePlayerJob`, `ariaPilot`, `jobHabits`, `planJob`
- [js/ui/hud.js](../ui/hud.js.md) — `ariaPilot`
- test/aria-mining-loop.test.mjs _(outside js/)_ — `planJob`, `beginAriaWatch`, `shouldBreakOff`

## Exports

- [`ARIA_JOBS`](#s-ARIA_JOBS) · const — **no importer in scanned roots**
- [`INVEST_JOBS`](#s-INVEST_JOBS) · const — **no importer in scanned roots**
- [`ariaPilot`](#s-ariaPilot) · const — used by [js/aria/aria.js](aria.js.md), [js/ui/hud.js](../ui/hud.js.md)
- [`notePlayerJob`](#s-notePlayerJob) · function — used by [js/aria/aria.js](aria.js.md)
- [`notePlayLabel`](#s-notePlayLabel) · function — used by [js/aria/aria.js](aria.js.md)
- [`jobHabits`](#s-jobHabits) · function — used by [js/aria/aria.js](aria.js.md)
- [`bestRepairPort`](#s-bestRepairPort) · function — **no importer in scanned roots**
- [`fabLeaning`](#s-fabLeaning) · function — **no importer in scanned roots**
- [`fabStop`](#s-fabStop) · function — **no importer in scanned roots**
- [`refitPlan`](#s-refitPlan) · function — **no importer in scanned roots**
- [`buildPlan`](#s-buildPlan) · function — **no importer in scanned roots**
- [`planJob`](#s-planJob) · function — used by [js/aria/aria.js](aria.js.md), test/aria-mining-loop.test.mjs
- [`shouldBreakOff`](#s-shouldBreakOff) · function — used by test/aria-mining-loop.test.mjs
- [`beginAriaWatch`](#s-beginAriaWatch) · function — used by [js/aria/aria.js](aria.js.md), test/aria-mining-loop.test.mjs
- [`endAriaWatch`](#s-endAriaWatch) · function — used by [js/aria/aria.js](aria.js.md)
- [`tickAriaPilot`](#s-tickAriaPilot) · function — used by [js/aria/aria.js](aria.js.md)
- [`wireAriaPilot`](#s-wireAriaPilot) · function — used by [js/aria/aria.js](aria.js.md)
- [`bindAriaPrefs`](#s-bindAriaPrefs) · function — used by [js/aria/aria.js](aria.js.md)

## Effects

_none detected_

## Symbols

### <a id="s-ARIA_JOBS"></a>`ARIA_JOBS`

const · **exported** · L21–21

<!-- note:ARIA_JOBS -->
<!-- /note -->

### <a id="s-INVEST_JOBS"></a>`INVEST_JOBS`

const · **exported** · L22–22

<!-- note:INVEST_JOBS -->
The two jobs the pilot never "does" in a way the play-labeller can see — you
do not fly a refit, you stop and buy one — so they are never learned as a
habit and are never picked by the habit weighting below. They are picked by
the investment rule, which is a different question: not "what does he do
most" but "the ship is idle, the money is in, what would make the next hour
better". Kept in ARIA_JOBS so failures are counted and reported like any
other job.
<!-- /note -->

### <a id="s-LABEL_JOB"></a>`LABEL_JOB`

const · L23–23

<!-- note:LABEL_JOB -->
Fabricating is not an investment and not a habit either — it is what to do
with a hold of ore, so it sits beside "sell" rather than beside "refit".
<!-- /note -->

### <a id="s-ariaPilot"></a>`ariaPilot`

const · **exported** · L25–39

<!-- note:ariaPilot -->
- L26 · `job: null,` — what it is doing now
- L28 · `planAt: 0,` — next sim time it may plan
- L29 · `fails: {},` — job → consecutive failures
- L31 · `jobs: 0,` — jobs handed to the runner this watch
- L34 · `investAt: 0,` — next sim time it may spend money on the ship or a drone
- L35 · `fabAt: 0,` — next sim time it may stop at a works
- L36 · `bought: [],` — what it has bought this watch, for the report
<!-- /note -->

### <a id="s-prefs"></a>`prefs`

const · L41–41

<!-- note:prefs -->
---- your habits --------------------------------------------------------
<!-- /note -->

### <a id="s-say"></a>`say`

const · L42–42

- called by: [`tickAriaPilot`](#s-tickAriaPilot) ×7

<!-- note:say -->
<!-- /note -->

### <a id="s-notePlayerJob"></a>`notePlayerJob(job, weight=)`

function · **exported** · L44–50

- called by: [`wireAriaHooks`](aria.js.md#s-wireAriaHooks) _js/aria/aria.js_ · [`notePlayLabel`](#s-notePlayLabel)

<!-- note:notePlayerJob -->
A job the player did with their own hands.
<!-- /note -->

### <a id="s-notePlayLabel"></a>`notePlayLabel(label)`

function · **exported** · L52–55

- calls: [`notePlayerJob`](#s-notePlayerJob)
- called by: [`wireAriaHooks`](aria.js.md#s-wireAriaHooks) _js/aria/aria.js_

<!-- note:notePlayLabel -->
From captain.js's five-second play label.
<!-- /note -->

### <a id="s-jobHabits"></a>`jobHabits()`

function · **exported** · L57–63

- called by: [`ariaTakeConn`](aria.js.md#s-ariaTakeConn) _js/aria/aria.js_ · [`ariaWatchReport`](aria.js.md#s-ariaWatchReport) _js/aria/aria.js_ · [`rawPlanJob`](#s-rawPlanJob)

<!-- note:jobHabits -->
Your share of each job, 0..1, and how much has been seen.
<!-- /note -->

### <a id="s-unsurveyed"></a>`unsurveyed()`

function · L65–75

- via [js/sim/sim.js](../sim/sim.js.md): `sim.scanned.has`
- called by: [`rawPlanJob`](#s-rawPlanJob)

<!-- note:unsurveyed -->
---- the world, as the planner reads it ----------------------------------
<!-- /note -->

### <a id="s-bestRepairPort"></a>`bestRepairPort(ship=)`

function · **exported** · L77–85

- calls: [`pricePerPoint`](../flight/repair.js.md#s-pricePerPoint) _js/flight/repair.js_ · [`repairsAt`](../flight/repair.js.md#s-repairsAt) _js/flight/repair.js_ · [`dist3`](../world/bodies.js.md#s-dist3) _js/world/bodies.js_
- called by: [`rawPlanJob`](#s-rawPlanJob) · [`shouldBreakOff`](#s-shouldBreakOff)

<!-- note:bestRepairPort -->
The yard to take a hurt hull to: near, cheap, not shooting.
<!-- /note -->

### <a id="s-hostileNear"></a>`hostileNear(r=)`

function · L87–90

- via [js/flight/turrets.js](../flight/turrets.js.md): `contacts.some`
- called by: [`planJob`](#s-planJob) · [`rawPlanJob`](#s-rawPlanJob) ×2 · [`shouldBreakOff`](#s-shouldBreakOff) · [`tickAriaPilot`](#s-tickAriaPilot)

<!-- note:hostileNear -->
<!-- /note -->

### <a id="s-deskSteps"></a>`deskSteps()`

function · L92–97

- calls: [`makeStep`](../mission/script.js.md#s-makeStep) _js/mission/script.js_ ×4
- called by: [`rawPlanJob`](#s-rawPlanJob) ×4

<!-- note:deskSteps -->
<!-- /note -->

### <a id="s-INVEST"></a>`INVEST`

const · L99–104

<!-- note:INVEST -->
---- spending the takings ------------------------------------------------

A watch that only mines and sells ends where it started with a bigger
number on the credit line. A pilot does not fly that way: when the money is
in and the ship is sitting at a port, they buy the thing that makes the next
run better — a wider cutter, another hold, or a drone to work a seam while
they work a different one. So ARIA does too.

It is deliberately CONSERVATIVE, because it is spending the pilot's money
without being asked:

  - a reserve is never touched, so a watch can always pay for repairs and a
    berth after the shopping;
  - one purchase per cooldown, so a windfall is not converted into six
    refits in a row;
  - nothing is bought with a hurt hull — plate comes after the hull is whole,
    which is the order the repair job above already enforces;
  - a shop trip has to be NEAR. Crossing the system to buy a cargo rack
    costs more in lost working time than the rack returns.

What to buy is chosen by the habit, not by price: the kit that helps the job
this pilot actually does is worth more than the kit that is cheapest.

- L100 · `reserve: 15000,` — credits ARIA will not spend, whatever is on offer
- L101 · `cooldown: 300,` — sim seconds between purchases
- L102 · `minHull: 0.6,` — a hurt hull gets fixed before anything gets bought
- L103 · `maxRange: 2.2e5,` — how far it will go to shop (u)
<!-- /note -->

### <a id="s-GUESS"></a>`GUESS`

const · L106–109

<!-- note:GUESS -->
What she does when she has not watched you long enough to know. A salvage
pilot's ARIA goes for hulks; anybody else's mines first, as before.
<!-- /note -->

### <a id="s-WORK"></a>`WORK`

const · L110–110

<!-- note:WORK -->
<!-- /note -->

### <a id="s-SALVOR"></a>`SALVOR`

const · L111–111

<!-- note:SALVOR -->
<!-- /note -->

### <a id="s-JOB_REFITS"></a>`JOB_REFITS`

const · L113–118

<!-- note:JOB_REFITS -->
The refits that pay for themselves at each job, best first.
<!-- /note -->

### <a id="s-ALWAYS_REFITS"></a>`ALWAYS_REFITS`

const · L119–119

<!-- note:ALWAYS_REFITS -->
Wanted whatever the pilot does: a drone that welds the hull in flight, and
the core that lets a mission be more than one step, are force multipliers
for every job on the board.
<!-- /note -->

### <a id="s-JOB_DRONES"></a>`JOB_DRONES`

const · L121–126

<!-- note:JOB_DRONES -->
The drone that does the pilot's job while the pilot does it somewhere else.
<!-- /note -->

### <a id="s-inRange"></a>`inRange(ship, st)`

function · L128–128

- calls: [`dist3`](../world/bodies.js.md#s-dist3) _js/world/bodies.js_
- called by: [`buildPlan`](#s-buildPlan) · [`fabStop`](#s-fabStop) · [`refitPlan`](#s-refitPlan)

<!-- note:inRange -->
<!-- /note -->

### <a id="s-FABRULE"></a>`FABRULE`

const · L130–135

<!-- note:FABRULE -->
---- turning a hold of rock into parts ------------------------------------

The planner could only ever SELL a full hold. With a fabrication line on
every industrial yard (0.3.10) and ports paying a premium for finished work
they cannot do themselves (0.3.11), the better move is often to stop at the
yard, put the ore on the line, and go back to cutting while it runs.

Two things decide it, and they are deliberately different in kind:

  THE RULE. A margin-and-proximity test — enough in the hold to be worth a
  stop, a yard near enough that the trip is not the cost, and a part that
  clears a margin bar. Predictable, and one constant to turn.

  THE TAPE. What the PILOT does in states like this one (js/flight/recorder.js).
  The rule decides whether fabricating is defensible; the tape decides
  whether it is what you would have done. If your own record in similar
  situations leans toward the works, the bar comes down; if you consistently
  run ore straight to the desk, it goes up and ARIA keeps selling. It can
  only ever move the bar by a third either way — a tape with three records
  in it should not be able to talk the planner into anything.

- L131 · `holdMin: 0.55,` — how full before a stop is worth it
- L132 · `margin: 1.4,` — what the part must be worth against its raw ore
- L133 · `lean: 0.33,` — the most the tape may move that bar, either way
- L134 · `cooldown: 90,` — sim seconds between fabrication stops
<!-- /note -->

### <a id="s-fabLeaning"></a>`fabLeaning()`

function · **exported** · L137–153

- calls: [`neighbours`](../flight/recorder.js.md#s-neighbours) _js/flight/recorder.js_ · [`snapshot`](../flight/recorder.js.md#s-snapshot) _js/flight/recorder.js_
- called by: [`fabStop`](#s-fabStop) · [`rawPlanJob`](#s-rawPlanJob)

<!-- note:fabLeaning -->
What the pilot's own tape says about states like this one.
→ -1 (they sell raw) … 0 (no opinion) … +1 (they fabricate)

- L143 · `if (near.length < 4) return 0;` — not enough to have an opinion
<!-- /note -->

### <a id="s-fabStop"></a>`fabStop(ship=)`

function · **exported** · L155–180

- calls: [`fabLeaning`](#s-fabLeaning) · [`inRange`](#s-inRange) · [`canFabAt`](../economy/fabricate.js.md#s-canFabAt) _js/economy/fabricate.js_ · [`fabMenuAt`](../economy/fabricate.js.md#s-fabMenuAt) _js/economy/fabricate.js_ · [`fabQueueAt`](../economy/fabricate.js.md#s-fabQueueAt) _js/economy/fabricate.js_ · [`maxRunnable`](../economy/fabricate.js.md#s-maxRunnable) _js/economy/fabricate.js_ · [`planJob`](../economy/fabricate.js.md#s-planJob) _js/economy/fabricate.js_ ×2 · [`dist3`](../world/bodies.js.md#s-dist3) _js/world/bodies.js_
- called by: [`rawPlanJob`](#s-rawPlanJob)

<!-- note:fabStop -->
The best fabrication stop for what is in the hold right now.
→ { st, good, name, qty, margin, plan } | null

- L166 · `let tried = 0;` — Walk the menu in margin order and stop once a few are actually MAKEABLE.
  
  The first cut of this took the top ten by margin and planned those, which
  looks sensible and is wrong: a hold of iron ore and carbon makes steel
  plate at 1.57x, and steel plate is nowhere near the top ten (heat
  exchangers and battery blocks are, and that ore cannot touch them). So
  ARIA stood in a belt full of usable ore and concluded there was nothing
  to build.
  
  One cheap `planJob(…, 1, …)` says whether a line is possible at all; only
  the ones that pass are worth the binary search in `maxRunnable`. Four
  candidates is plenty and keeps this affordable at planner cadence.
- L168 · `if (m.ratio < bar) break;` — the menu is sorted; the rest are worse
- L169 · `if (!planFab(m.id, 1, stock).ok) continue;` — cannot make even one from this hold
<!-- /note -->

### <a id="s-refitPlan"></a>`refitPlan(ship=, job=)`

function · **exported** · L182–199

- calls: [`inRange`](#s-inRange) · [`hasUpgrade`](../economy/upgrades.js.md#s-hasUpgrade) _js/economy/upgrades.js_ · [`upgradeOptions`](../economy/upgrades.js.md#s-upgradeOptions) _js/economy/upgrades.js_ · [`dist3`](../world/bodies.js.md#s-dist3) _js/world/bodies.js_
- called by: [`rawPlanJob`](#s-rawPlanJob)

<!-- note:refitPlan -->
The best refit ARIA can afford, at a port it is willing to fly to.
→ { st, opt, rank } | null

- L194 · `const score = -rank * 100 - dist3(ship.pos, st) / 1e5;` — earlier in the want list wins; distance only breaks a tie
<!-- /note -->

### <a id="s-buildPlan"></a>`buildPlan(ship=, job=)`

function · **exported** · L201–217

- calls: [`inRange`](#s-inRange) · [`hasCompany`](../corp/company.js.md#s-hasCompany) _js/corp/company.js_ · [`buildOptions`](../drones/ops.js.md#s-buildOptions) _js/drones/ops.js_ · [`dist3`](../world/bodies.js.md#s-dist3) _js/world/bodies.js_
- called by: [`rawPlanJob`](#s-rawPlanJob)

<!-- note:buildPlan -->
The best drone ARIA can have built, at a port it is willing to fly to.
Drones come out of the COMPANY treasury, not the ship's credit line, so the
reserve above does not apply — `buildOptions` already refuses when the
treasury is short, the drone cap is reached, or the line is busy.
→ { st, opt, rank } | null
<!-- /note -->

### <a id="s-MISSION"></a>`MISSION(name, steps)`

function · L219–219

- calls: [`makeMission`](../mission/script.js.md#s-makeMission) _js/mission/script.js_
- called by: [`rawPlanJob`](#s-rawPlanJob) ×9

<!-- note:MISSION -->
<!-- /note -->

### <a id="s-rawPlanJob"></a>`rawPlanJob()`

function · L221–308

- calls: [`bestRepairPort`](#s-bestRepairPort) · [`buildPlan`](#s-buildPlan) · [`deskSteps`](#s-deskSteps) ×4 · [`fabLeaning`](#s-fabLeaning) · [`fabStop`](#s-fabStop) · [`hostileNear`](#s-hostileNear) ×2 · [`jobHabits`](#s-jobHabits) · [`MISSION`](#s-MISSION) ×9 · [`rawPlanJob>weight`](#s-rawPlanJob-weight) ×3 · [`refitPlan`](#s-refitPlan) · [`unsurveyed`](#s-unsurveyed) · [`nearestSeam`](../flight/autopilot.js.md#s-nearestSeam) _js/flight/autopilot.js_ · [`hullMaxOf`](../flight/repair.js.md#s-hullMaxOf) _js/flight/repair.js_ · [`cargoTotal`](../flight/ship.js.md#s-cargoTotal) _js/flight/ship.js_ · [`holdRoom`](../flight/ship.js.md#s-holdRoom) _js/flight/ship.js_ · [`bestHulk`](../mission/salvage.js.md#s-bestHulk) _js/mission/salvage.js_ · [`makeStep`](../mission/script.js.md#s-makeStep) _js/mission/script.js_ ×18
- called by: [`planJob`](#s-planJob)

<!-- note:rawPlanJob -->
- L227 · `for (const k of Object.keys(fails)) if (fails[k] > 0 && sim.time - (ariaPilot.failAt[k] ??` — two failures used to bench a job until the pilot took the conn back; a
  hulk that aged out mid-leg, twice, ended salvage for the whole watch.
  A failure is forgiven four minutes on.
- L279 · `const salvor = pilot?.complexId === "salvage" || (learned && (share.salvage ?? 0) >= 0.5);` — 0.3.91: a salvor with no hulk to work does not take up mining. With the
  sky empty of hulks she was sent to the belt on a hull built for a rig —
  "you mine 0% of the time" — and came home on a flat battery. She mines
  if the pilot does; otherwise she waits for the fighting to leave some.
<!-- /note -->

#### <a id="s-rawPlanJob-weight"></a>`rawPlanJob>weight(j)`

function · L282–282

- calls: [`policyScore`](mind.js.md#s-policyScore) _js/aria/mind.js_ · [`snapshot`](../flight/recorder.js.md#s-snapshot) _js/flight/recorder.js_
- called by: [`rawPlanJob`](#s-rawPlanJob) ×3

<!-- note:rawPlanJob>weight -->
<!-- /note -->

### <a id="s-planJob"></a>`planJob()`

function · **exported** · L310–317

- calls: [`authorize`](mind.js.md#s-authorize) _js/aria/mind.js_ · [`contextualScore`](mind.js.md#s-contextualScore) _js/aria/mind.js_ · [`decideMind`](mind.js.md#s-decideMind) _js/aria/mind.js_ · [`hostileNear`](#s-hostileNear) · [`rawPlanJob`](#s-rawPlanJob) · [`snapshot`](../flight/recorder.js.md#s-snapshot) _js/flight/recorder.js_ · [`hullMaxOf`](../flight/repair.js.md#s-hullMaxOf) _js/flight/repair.js_ · [`cargoTotal`](../flight/ship.js.md#s-cargoTotal) _js/flight/ship.js_
- called by: [`tickAriaPilot`](#s-tickAriaPilot)

<!-- note:planJob -->
What ARIA would do next, and why. Pure over the ship and your habits — the
tests call it directly. → { job, why, mission } | { job: null, why }

- L? · `if (fill >= FABRULE.holdMin && sim.time >= (ariaPilot.fabAt ?? 0) && (fails.fabricate ?? 0` — A hold worth stopping for: the works before the desk, when the numbers and
  the pilot's own habits both say so. Ahead of "sell" because it is a BETTER
  answer to the same question — a full hold — not a different one.
- L? · `const topJob = ARIA_JOBS.filter((j) => !INVEST_JOBS.includes(j)).sort((a, b) => (share[b]` — The money is in, the hull is whole and nothing is urgent: buy the thing
  that makes the next run better. Between the hold-full check above and the
  work below on purpose — it must never come before getting a full hold to
  the desk (that is what pays for it) and never after picking up a new seam
  (which would mean breaking off a cut to go shopping).
<!-- /note -->

### <a id="s-shouldBreakOff"></a>`shouldBreakOff(ship=)`

function · **exported** · L319–326

- calls: [`breakLine`](mind.js.md#s-breakLine) _js/aria/mind.js_ · [`bestRepairPort`](#s-bestRepairPort) · [`hostileNear`](#s-hostileNear) · [`hullMaxOf`](../flight/repair.js.md#s-hullMaxOf) _js/flight/repair.js_ · [`pricePerPoint`](../flight/repair.js.md#s-pricePerPoint) _js/flight/repair.js_ · [`batteryCap`](../flight/ship.js.md#s-batteryCap) _js/flight/ship.js_
- called by: [`tickAriaPilot`](#s-tickAriaPilot)

<!-- note:shouldBreakOff -->
0.3.88 — when "avoid hostiles" breaks work off.

The Core patch broke off whenever a hostile contact was inside 6,000 u. The
belt spawns rogue drones 4,200 u from any hull that is near it, so in a belt
that test is always true: ARIA ran for a yard, docked, undocked, flew back
and ran again, for ever, with a whole hull. Guns on CASTLE deal with drones;
being near one is not a reason to leave.

The order now means what a pilot means by it: leave when it is going badly.
Hostiles close AND the hull under the captain's repair line AND a yard she
can reach and pay — then the job is dropped for the yard run, and the next
plan is the ordinary "repair" job. Without the order she works on down to
the repair line and only goes in between jobs, as she did before Core.
<!-- /note -->

### <a id="s-beginAriaWatch"></a>`beginAriaWatch()`

function · **exported** · L328–343

- calls: [`stopMission`](../mission/run.js.md#s-stopMission) _js/mission/run.js_
- called by: [`ariaTakeConn`](aria.js.md#s-ariaTakeConn) _js/aria/aria.js_

<!-- note:beginAriaWatch -->
---- the watch ----------------------------------------------------------

- L339 · `ariaPilot.investAt = 0;` — A fresh watch may shop straight away — the pilot handed over on purpose.
- L342 · `if (mission.active) stopMission("ARIA has the conn", { quiet: true });` — whatever you had the autopilot doing is yours; ARIA plans its own
<!-- /note -->

### <a id="s-endAriaWatch"></a>`endAriaWatch()`

function · **exported** · L345–348

- calls: [`stopMission`](../mission/run.js.md#s-stopMission) _js/mission/run.js_
- called by: [`ariaRelease`](aria.js.md#s-ariaRelease) _js/aria/aria.js_

<!-- note:endAriaWatch -->
<!-- /note -->

### <a id="s-tickAriaPilot"></a>`tickAriaPilot()`

function · **exported** · L350–421

- calls: [`authorize`](mind.js.md#s-authorize) _js/aria/mind.js_ · [`learnOutcome`](mind.js.md#s-learnOutcome) _js/aria/mind.js_ · [`hostileNear`](#s-hostileNear) · [`planJob`](#s-planJob) · [`say`](#s-say) ×7 · [`shouldBreakOff`](#s-shouldBreakOff) · [`busOverload`](../flight/autopilot.js.md#s-busOverload) _js/flight/autopilot.js_ · [`pilotInput`](../flight/autopilot.js.md#s-pilotInput) _js/flight/autopilot.js_ · [`hullMaxOf`](../flight/repair.js.md#s-hullMaxOf) _js/flight/repair.js_ ×2 · [`repairQuote`](../flight/repair.js.md#s-repairQuote) _js/flight/repair.js_ · [`repairsAt`](../flight/repair.js.md#s-repairsAt) _js/flight/repair.js_ · [`yardRepair`](../flight/repair.js.md#s-yardRepair) _js/flight/repair.js_ · [`startMission`](../mission/run.js.md#s-startMission) _js/mission/run.js_ · [`stopMission`](../mission/run.js.md#s-stopMission) _js/mission/run.js_ · [`logEvent`](../sim/sim.js.md#s-logEvent) _js/sim/sim.js_ · [`setMiningMode`](../sim/sim.js.md#s-setMiningMode) _js/sim/sim.js_ · [`setTurretMode`](../sim/sim.js.md#s-setTurretMode) _js/sim/sim.js_ · [`toggleSystem`](../sim/sim.js.md#s-toggleSystem) _js/sim/sim.js_ ×3 · [`stationById`](../station/stations.js.md#s-stationById) _js/station/stations.js_
- via [js/npc/captain.js](../npc/captain.js.md): `hooks.onStick`
- called by: [`wireAriaHooks`](aria.js.md#s-wireAriaHooks) _js/aria/aria.js_

<!-- note:tickAriaPilot -->
Called from captain.tickCaptain every tick ARIA holds the conn. → earned this watch

- L354 · `if (!autopilot.on && pilotInput()) { hooks.onStick?.(); return 0; }` — between jobs too: the stick is yours
- L356 · `if (hostileNear() && (ship.turretMode === "off" || ship.turretMode === "passive")) { setTu` — guns: under fire, answer it
- L358 · `const bus = busOverload(ship);` — a bus that cannot refill itself: shed rather than stand down
- L? · `if (ariaPilot.job && mission.state === "failed") ariaPilot.fails[ariaPilot.job] = (ariaPil` — the last job ended: book it
- L392 · `if (ship.dockedAt) {` — docked between jobs: do at the desk what you would

- L359 · `const rigRest = Boolean(mission.run?.resting) && mission.active?.steps[mission.stepIx]?.op` — the rig on STRIP is 40 kW on a bus with none to spare: she rested it two
  or three times a hulk. Twenty of those are deck gravity and the floods.
<!-- /note -->

### <a id="s-registerAriaOps"></a>`registerAriaOps()`

function · L423–441

- calls: [`authorize`](mind.js.md#s-authorize) _js/aria/mind.js_ · [`registerBuildOp`](#s-registerBuildOp) · [`registerFabOp`](#s-registerFabOp) · [`registerRefitOp`](#s-registerRefitOp) · [`hullMaxOf`](../flight/repair.js.md#s-hullMaxOf) _js/flight/repair.js_ · [`repairQuote`](../flight/repair.js.md#s-repairQuote) _js/flight/repair.js_ · [`yardRepair`](../flight/repair.js.md#s-yardRepair) _js/flight/repair.js_ · [`stationById`](../station/stations.js.md#s-stationById) _js/station/stations.js_
- called by: [`wireAriaPilot`](#s-wireAriaPilot)

<!-- note:registerAriaOps -->
---- REPAIR, REFIT and BUILD as mission steps ---------------------------

The runner's op table is open (js/mission/run.js exports EXEC), so ARIA's
three docked-only ops are registered here rather than built into the runner:
they are the planner's vocabulary, and a pilot writing a mission by hand can
use them too now that they are in OPS (js/mission/script.js).

All three follow the runner's contract: return "done", or "fail:&lt;reason>",
and put a sentence on `mission.run.why` for the WORK card.
<!-- /note -->

### <a id="s-registerRefitOp"></a>`registerRefitOp()`

function · L443–464

- calls: [`authorize`](mind.js.md#s-authorize) _js/aria/mind.js_ · [`buyUpgrade`](../economy/upgrades.js.md#s-buyUpgrade) _js/economy/upgrades.js_ · [`effectOf`](../economy/upgrades.js.md#s-effectOf) _js/economy/upgrades.js_ · [`hasUpgrade`](../economy/upgrades.js.md#s-hasUpgrade) _js/economy/upgrades.js_ · [`upgradeOptions`](../economy/upgrades.js.md#s-upgradeOptions) _js/economy/upgrades.js_ · [`stationById`](../station/stations.js.md#s-stationById) _js/station/stations.js_
- via [js/economy/upgrades.js](../economy/upgrades.js.md): `upgradeOptions.find`
- called by: [`registerAriaOps`](#s-registerAriaOps)

<!-- note:registerRefitOp -->
<!-- /note -->

### <a id="s-registerBuildOp"></a>`registerBuildOp()`

function · L466–486

- calls: [`authorize`](mind.js.md#s-authorize) _js/aria/mind.js_ · [`buildOptions`](../drones/ops.js.md#s-buildOptions) _js/drones/ops.js_ · [`orderBuild`](../drones/ops.js.md#s-orderBuild) _js/drones/ops.js_ · [`stationById`](../station/stations.js.md#s-stationById) _js/station/stations.js_
- via [js/drones/ops.js](../drones/ops.js.md): `buildOptions.find`
- called by: [`registerAriaOps`](#s-registerAriaOps)

<!-- note:registerBuildOp -->
- L483 · `` mission.run.why = `${opt.label} drone on the line at ${st.name} — ${opt.secs} s, ${opt.pri `` — The drone is on the LINE, not off it — it rolls off on its own timer and
  asks for its orders on the drone channel. The mission's job is done when
  the order is placed; standing at the berth watching a build finish is
  exactly the kind of idling ARIA is supposed to avoid.
<!-- /note -->

### <a id="s-registerFabOp"></a>`registerFabOp()`

function · L488–510

- calls: [`authorize`](mind.js.md#s-authorize) _js/aria/mind.js_ · [`canFabAt`](../economy/fabricate.js.md#s-canFabAt) _js/economy/fabricate.js_ · [`orderFab`](../economy/fabricate.js.md#s-orderFab) _js/economy/fabricate.js_ · [`planJob`](../economy/fabricate.js.md#s-planJob) _js/economy/fabricate.js_ · [`stationById`](../station/stations.js.md#s-stationById) _js/station/stations.js_
- called by: [`registerAriaOps`](#s-registerAriaOps)

<!-- note:registerFabOp -->
- L506 · `ariaPilot.fabAt = sim.time + 90;` — The job is ON the line, not off it — it finishes on sim time and lands in
  this port's locker. Standing at the berth watching it is exactly the kind
  of idling the planner exists to avoid, so the step is done once it is
  placed, the same call BUILD makes.
<!-- /note -->

### <a id="s-wireAriaPilot"></a>`wireAriaPilot(ariaState, speak)`

function · **exported** · L512–516

- calls: [`registerAriaOps`](#s-registerAriaOps)
- called by: [`wireAriaHooks`](aria.js.md#s-wireAriaHooks) _js/aria/aria.js_

<!-- note:wireAriaPilot -->
aria.js calls this once the module graph has loaded.
<!-- /note -->

### <a id="s-bindAriaPrefs"></a>`bindAriaPrefs(p)`

function · **exported** · L518–518

- called by: [`loadAria`](aria.js.md#s-loadAria) _js/aria/aria.js_ ×2 · [`resetAria`](aria.js.md#s-resetAria) _js/aria/aria.js_

<!-- note:bindAriaPrefs -->
aria.js swaps prefs objects on load; keep the binding current.
<!-- /note -->
