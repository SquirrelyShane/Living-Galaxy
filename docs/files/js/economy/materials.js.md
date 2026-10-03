# js/economy/materials.js

[index](../../../README.md) · 276 lines · 25 symbols · 0 imports · 52 importers

## About

<!-- note:@file -->
LIVING GALAXY — materials, refining and tier-0 fabrication.

Three layers. ORES come out of rock and regolith. MINERALS come out of a
refinery. COMPONENTS are the first things you can actually build with —
plate, girder, motor, chip. Everything above that is somebody else's
problem for now.

Every entry carries mass per unit and a base value, and every sector wants
a different half of the list, which is what makes a trade route a thing.

- L236 · `export const FINISHED_BONUS = { mineral: 1.08, component: 1.12 };` — 0.3.47: was 1.12 / 1.22
<!-- /note -->

## Imports

_none_

## Imported by

- [js/aria/play.js](../aria/play.js.md) — `goodName`
- [js/aria/senses.js](../aria/senses.js.md) — `goodName`, `bulkOf`
- [js/aria/senses.js](../aria/senses.js.md) — `SECTORS`
- [js/asteroidgen/ores.js](../asteroidgen/ores.js.md) — `ORES`, `MINERALS`
- [js/bodygen/body.js](../bodygen/body.js.md) — `ORES`
- [js/comms/comms.js](../comms/comms.js.md) — `baseValue`
- [js/console/panels/market.js](../console/panels/market.js.md) — `good`, `goodName`
- [js/console/panels/nav.js](../console/panels/nav.js.md) — `goodName`
- [js/corp/corps.js](../corp/corps.js.md) — `SECTOR_IDS`, `SECTORS`
- [js/crew/talk-threads.js](../crew/talk-threads.js.md) — `baseValue`
- [js/drones/board.js](../drones/board.js.md) — `goodName`
- [js/drones/ops.js](../drones/ops.js.md) — `goodName`
- [js/economy/contracts.js](contracts.js.md) — `goodName`, `baseValue`, `good`, `bulkOf`, `ORES`, `SECTORS`
- [js/economy/economy.js](economy.js.md) — `SECTORS`, `priceAt`, `baseValue`, `goodName`, `good`
- [js/economy/fabricate.js](fabricate.js.md) — `ORES`, `ALL_GOODS`, `SECTORS`, `goodName`, `baseValue`
- [js/economy/icework.js](icework.js.md) — `baseValue`, `goodName`
- [js/economy/shipcost.js](shipcost.js.md) — `MINERALS`
- [js/economy/sites.js](sites.js.md) — `ORES`, `goodName`
- [js/economy/traderoutes.js](traderoutes.js.md) — `goodName`, `bulkOf`
- [js/flight/autopilot.js](../flight/autopilot.js.md) — `goodName`
- [js/flight/repair.js](../flight/repair.js.md) — `SECTORS`
- [js/flight/ship.js](../flight/ship.js.md) — `bulkOf`
- [js/flight/turrets.js](../flight/turrets.js.md) — `goodName`
- [js/npc/flow.js](../npc/flow.js.md) — `SECTORS`, `goodName`
- [js/npc/ground.js](../npc/ground.js.md) — `baseValue`, `goodName`
- [js/npc/reports.js](../npc/reports.js.md) — `goodName`
- [js/npc/speech.js](../npc/speech.js.md) — `baseValue`
- [js/render/engine.js](../render/engine.js.md) — `SECTORS`
- [js/ships/shipdb.js](../ships/shipdb.js.md) — `holdForCargoRating`, `HOLD`
- [js/sim/sim.js](../sim/sim.js.md) — `ORES`, `baseValue`, `good`, `goodName`, `priceAt`, `rollOre`
- [js/station/deckworks.js](../station/deckworks.js.md) — `goodName`
- [js/station/dockwork.js](../station/dockwork.js.md) — `good`
- [js/station/fabyard.js](../station/fabyard.js.md) — `goodName`
- [js/station/stations.js](../station/stations.js.md) — `SECTORS`, `SECTOR_IDS`, `stockFor`
- [js/station/stationworks.js](../station/stationworks.js.md) — `goodName`, `priceAt`, `SECTORS`
- [js/ui/creation.js](../ui/creation.js.md) — `SECTORS`
- [js/ui/holdview.js](../ui/holdview.js.md) — `good`, `goodName`, `baseValue`, `bulkOf`
- [js/ui/map.js](../ui/map.js.md) — `SECTORS`
- [js/world/bodies.js](../world/bodies.js.md) — `goodName`
- [js/world/field.js](../world/field.js.md) — `ORES`
- [js/world/hulks.js](../world/hulks.js.md) — `baseValue`
- test/ariaplay.test.mjs _(outside js/)_ — `goodName`
- test/asteroids.test.mjs _(outside js/)_ — `ORES`
- test/balance.test.mjs _(outside js/)_ — `ALL_GOODS`, `ORES`, `VALUE_RULE`, `baseValue`, `derivedValue`
- test/desk.test.mjs _(outside js/)_ — `bulkOf`
- test/dockwork.test.mjs _(outside js/)_ — `good`
- test/hold.test.mjs _(outside js/)_ — `good`, `bulkOf`
- test/hulks.test.mjs _(outside js/)_ — `good`, `baseValue`
- test/hullspec.test.mjs _(outside js/)_ — `MINERALS`
- test/sky.test.mjs _(outside js/)_ — `bulkOf`, `holdForCargoRating`
- test/stafflife.test.mjs _(outside js/)_ — `bulkOf`, `holdForCargoRating`, `ALL_GOODS`
- test/systems.test.mjs _(outside js/)_ — `ORES`

## Exports

- [`ORES`](#s-ORES) · const — used by [js/asteroidgen/ores.js](../asteroidgen/ores.js.md), [js/bodygen/body.js](../bodygen/body.js.md), [js/economy/contracts.js](contracts.js.md), [js/economy/fabricate.js](fabricate.js.md), [js/economy/sites.js](sites.js.md), [js/sim/sim.js](../sim/sim.js.md), [js/world/field.js](../world/field.js.md), test/asteroids.test.mjs, test/balance.test.mjs, test/systems.test.mjs
- [`MINERALS`](#s-MINERALS) · const — used by [js/asteroidgen/ores.js](../asteroidgen/ores.js.md), [js/economy/shipcost.js](shipcost.js.md), test/hullspec.test.mjs
- [`COMPONENTS`](#s-COMPONENTS) · const — **no importer in scanned roots**
- [`VALUE_RULE`](#s-VALUE_RULE) · const — used by test/balance.test.mjs
- [`ALL_GOODS`](#s-ALL_GOODS) · const — used by [js/economy/fabricate.js](fabricate.js.md), test/balance.test.mjs, test/stafflife.test.mjs
- [`good`](#s-good) · function — used by [js/console/panels/market.js](../console/panels/market.js.md), [js/economy/contracts.js](contracts.js.md), [js/economy/economy.js](economy.js.md), [js/sim/sim.js](../sim/sim.js.md), [js/station/dockwork.js](../station/dockwork.js.md), [js/ui/holdview.js](../ui/holdview.js.md), test/dockwork.test.mjs, test/hold.test.mjs, test/hulks.test.mjs
- [`goodName`](#s-goodName) · function — used by [js/aria/play.js](../aria/play.js.md), [js/aria/senses.js](../aria/senses.js.md), [js/console/panels/market.js](../console/panels/market.js.md), [js/console/panels/nav.js](../console/panels/nav.js.md), [js/drones/board.js](../drones/board.js.md), [js/drones/ops.js](../drones/ops.js.md), [js/economy/contracts.js](contracts.js.md), [js/economy/economy.js](economy.js.md), [js/economy/fabricate.js](fabricate.js.md), [js/economy/icework.js](icework.js.md), [js/economy/sites.js](sites.js.md), [js/economy/traderoutes.js](traderoutes.js.md), [js/flight/autopilot.js](../flight/autopilot.js.md), [js/flight/turrets.js](../flight/turrets.js.md), [js/npc/flow.js](../npc/flow.js.md), [js/npc/ground.js](../npc/ground.js.md), [js/npc/reports.js](../npc/reports.js.md), [js/sim/sim.js](../sim/sim.js.md), [js/station/deckworks.js](../station/deckworks.js.md), [js/station/fabyard.js](../station/fabyard.js.md), [js/station/stationworks.js](../station/stationworks.js.md), [js/ui/holdview.js](../ui/holdview.js.md), [js/world/bodies.js](../world/bodies.js.md), test/ariaplay.test.mjs
- [`baseValue`](#s-baseValue) · function — used by [js/comms/comms.js](../comms/comms.js.md), [js/crew/talk-threads.js](../crew/talk-threads.js.md), [js/economy/contracts.js](contracts.js.md), [js/economy/economy.js](economy.js.md), [js/economy/fabricate.js](fabricate.js.md), [js/economy/icework.js](icework.js.md), [js/npc/ground.js](../npc/ground.js.md), [js/npc/speech.js](../npc/speech.js.md), [js/sim/sim.js](../sim/sim.js.md), [js/ui/holdview.js](../ui/holdview.js.md), [js/world/hulks.js](../world/hulks.js.md), test/balance.test.mjs, test/hulks.test.mjs
- [`derivedValue`](#s-derivedValue) · function — used by test/balance.test.mjs
- [`goodMass`](#s-goodMass) · function — **no importer in scanned roots**
- [`BULK`](#s-BULK) · const — **no importer in scanned roots**
- [`bulkOf`](#s-bulkOf) · function — used by [js/aria/senses.js](../aria/senses.js.md), [js/economy/contracts.js](contracts.js.md), [js/economy/traderoutes.js](traderoutes.js.md), [js/flight/ship.js](../flight/ship.js.md), [js/ui/holdview.js](../ui/holdview.js.md), test/desk.test.mjs, test/hold.test.mjs, test/sky.test.mjs, test/stafflife.test.mjs
- [`HOLD`](#s-HOLD) · const — used by [js/ships/shipdb.js](../ships/shipdb.js.md)
- [`holdForCargoRating`](#s-holdForCargoRating) · function — used by [js/ships/shipdb.js](../ships/shipdb.js.md), test/sky.test.mjs, test/stafflife.test.mjs
- [`oresFor`](#s-oresFor) · function — **no importer in scanned roots**
- [`rollOre`](#s-rollOre) · function — used by [js/sim/sim.js](../sim/sim.js.md)
- [`SECTORS`](#s-SECTORS) · const — used by [js/aria/senses.js](../aria/senses.js.md), [js/corp/corps.js](../corp/corps.js.md), [js/economy/contracts.js](contracts.js.md), [js/economy/economy.js](economy.js.md), [js/economy/fabricate.js](fabricate.js.md), [js/flight/repair.js](../flight/repair.js.md), [js/npc/flow.js](../npc/flow.js.md), [js/render/engine.js](../render/engine.js.md), [js/station/stations.js](../station/stations.js.md), [js/station/stationworks.js](../station/stationworks.js.md), [js/ui/creation.js](../ui/creation.js.md), [js/ui/map.js](../ui/map.js.md)
- [`SECTOR_IDS`](#s-SECTOR_IDS) · const — used by [js/corp/corps.js](../corp/corps.js.md), [js/station/stations.js](../station/stations.js.md)
- [`FINISHED_BONUS`](#s-FINISHED_BONUS) · const — **no importer in scanned roots**
- [`priceAt`](#s-priceAt) · function — used by [js/economy/economy.js](economy.js.md), [js/sim/sim.js](../sim/sim.js.md), [js/station/stationworks.js](../station/stationworks.js.md)
- [`stockFor`](#s-stockFor) · function — used by [js/station/stations.js](../station/stations.js.md)
- [`demandFor`](#s-demandFor) · function — **no importer in scanned roots**

## Effects

_none detected_

## Symbols

### <a id="s-ORES"></a>`ORES`

const · **exported** · L1–30

<!-- note:ORES -->
---- ores ---------------------------------------------------------------

found:  which body kinds and rock types yield it
yield:  relative abundance when you cut for it
refine: what a unit becomes, and how much
<!-- /note -->

### <a id="s-MINERALS"></a>`MINERALS`

const · **exported** · L32–68

<!-- note:MINERALS -->
---- refined minerals ---------------------------------------------------
<!-- /note -->

### <a id="s-COMPONENTS"></a>`COMPONENTS`

const · **exported** · L70–101

<!-- note:COMPONENTS -->
---- tier-0 components --------------------------------------------------

The first things worth calling parts. Everything here is buildable from the
minerals above and nothing else.
<!-- /note -->

### <a id="s-VALUE_RULE"></a>`VALUE_RULE`

const · **exported** · L103–103

<!-- note:VALUE_RULE -->
---- what a thing is worth: its inputs, and the work ---------------------

0.3.47. The values above used to be authored one by one, and running the
whole graph showed what that had done: a heat exchanger sold for 6.5× the
ore it ate and a battery for 5×, while a gyroscope — six stages deep, forty-
odd units of rock and a flight controller in it — sold for 1.25×. The cheap,
shallow parts were the money and the deep ones were not worth building,
which is backwards for anything called a tier.

Every value in MINERALS and COMPONENTS is now the rule, not a guess:

  refined mineral   its ore's value ÷ the refine yield, × VALUE_RULE.refine
  anything made     Σ inputs' values × VALUE_RULE.stage

So each stage of work adds the same 18% on what went into it, a part is
worth more the deeper it sits, and a new recipe prices itself. The table is
still written out by hand so it can be read; test/balance.test.mjs fails if
a number drifts from the rule. Ores are the unit everything else is priced
in and are not touched.
<!-- /note -->

### <a id="s-niceValue"></a>`niceValue(v)`

function · L105–105

- called by: [`derivedValue`](#s-derivedValue) ×2

<!-- note:niceValue -->
<!-- /note -->

### <a id="s-ALL_GOODS"></a>`ALL_GOODS`

const · **exported** · L107–111

<!-- note:ALL_GOODS -->
---- indexes ------------------------------------------------------------
<!-- /note -->

### <a id="s-BY_ID"></a>`BY_ID`

const · L113–113

<!-- note:BY_ID -->
<!-- /note -->

### <a id="s-good"></a>`good(id)`

function · **exported** · L115–117

- called by: [`marketBlock`](../console/panels/market.js.md#s-marketBlock) _js/console/panels/market.js_ · [`mountHold>drawManifest`](../console/panels/market.js.md#s-mountHold-drawManifest) _js/console/panels/market.js_ · [`unitBasis`](contracts.js.md#s-unitBasis) _js/economy/contracts.js_ · [`econReport`](economy.js.md#s-econReport) _js/economy/economy.js_ · [`sellAllOre`](../sim/sim.js.md#s-sellAllOre) _js/sim/sim.js_ · [`tradeSell`](../sim/sim.js.md#s-tradeSell) _js/sim/sim.js_ ×2 · [`isBulk`](../station/dockwork.js.md#s-isBulk) _js/station/dockwork.js_ · [`massOf`](../station/dockwork.js.md#s-massOf) _js/station/dockwork.js_ · [`holdSlots`](../ui/holdview.js.md#s-holdSlots) _js/ui/holdview.js_

<!-- note:good -->
<!-- /note -->

### <a id="s-goodName"></a>`goodName(id)`

function · **exported** · L119–121

- called by: [`playReport`](../aria/play.js.md#s-playReport) _js/aria/play.js_ · [`senseHull`](../aria/senses.js.md#s-senseHull) _js/aria/senses.js_ · [`sensePorts`](../aria/senses.js.md#s-sensePorts) _js/aria/senses.js_ ×2 · [`senseSpace`](../aria/senses.js.md#s-senseSpace) _js/aria/senses.js_ · [`unpostedWork`](../aria/senses.js.md#s-unpostedWork) _js/aria/senses.js_ · [`marketBlock`](../console/panels/market.js.md#s-marketBlock) _js/console/panels/market.js_ ×2 · [`search`](../console/panels/market.js.md#s-search) _js/console/panels/market.js_ · [`mountAria`](../console/panels/nav.js.md#s-mountAria) _js/console/panels/nav.js_ · [`openFreight`](../drones/board.js.md#s-openFreight) _js/drones/board.js_ · [`ROLE_STEP.courier`](../drones/ops.js.md#s-ROLE_STEP-courier) _js/drones/ops.js_ ×5 · [`runFreight`](../drones/ops.js.md#s-runFreight) _js/drones/ops.js_ ×5 · [`stashLine`](../drones/ops.js.md#s-stashLine) _js/drones/ops.js_ · [`tradeRoutes`](../drones/ops.js.md#s-tradeRoutes) _js/drones/ops.js_ · [`KINDS.assay`](contracts.js.md#s-KINDS-assay) _js/economy/contracts.js_ ×2 · [`KINDS.build`](contracts.js.md#s-KINDS-build) _js/economy/contracts.js_ ×4 · [`KINDS.consign`](contracts.js.md#s-KINDS-consign) _js/economy/contracts.js_ ×2 · [`KINDS.courier`](contracts.js.md#s-KINDS-courier) _js/economy/contracts.js_ ×2 · [`KINDS.food`](contracts.js.md#s-KINDS-food) _js/economy/contracts.js_ ×2 · [`KINDS.fuel`](contracts.js.md#s-KINDS-fuel) _js/economy/contracts.js_ ×2 · [`KINDS.haul`](contracts.js.md#s-KINDS-haul) _js/economy/contracts.js_ ×2 · [`KINDS.ice`](contracts.js.md#s-KINDS-ice) _js/economy/contracts.js_ ×2 · [`KINDS.materials`](contracts.js.md#s-KINDS-materials) _js/economy/contracts.js_ ×2 · [`KINDS.medical`](contracts.js.md#s-KINDS-medical) _js/economy/contracts.js_ ×2 · [`KINDS.parts`](contracts.js.md#s-KINDS-parts) _js/economy/contracts.js_ ×2 · [`KINDS.pod`](contracts.js.md#s-KINDS-pod) _js/economy/contracts.js_ ×2 · [`KINDS.procure`](contracts.js.md#s-KINDS-procure) _js/economy/contracts.js_ ×2 · [`KINDS.reactor`](contracts.js.md#s-KINDS-reactor) _js/economy/contracts.js_ ×2 · [`KINDS.resupply`](contracts.js.md#s-KINDS-resupply) _js/economy/contracts.js_ ×2 · [`KINDS.supply`](contracts.js.md#s-KINDS-supply) _js/economy/contracts.js_ ×2 · [`KINDS.tender`](contracts.js.md#s-KINDS-tender) _js/economy/contracts.js_ ×2 · [`KINDS.vein`](contracts.js.md#s-KINDS-vein) _js/economy/contracts.js_ ×2 · [`acceptBlocker`](contracts.js.md#s-acceptBlocker) _js/economy/contracts.js_ ×2 · [`anchorFor`](contracts.js.md#s-anchorFor) _js/economy/contracts.js_ · [`jobStatus`](contracts.js.md#s-jobStatus) _js/economy/contracts.js_ · [`econReport`](economy.js.md#s-econReport) _js/economy/economy.js_ ×2 · [`glutsOf`](economy.js.md#s-glutsOf) _js/economy/economy.js_ · [`shortagesOf>consider`](economy.js.md#s-shortagesOf-consider) _js/economy/economy.js_ · [`wantsOf`](economy.js.md#s-wantsOf) _js/economy/economy.js_ · [`orderFab`](fabricate.js.md#s-orderFab) _js/economy/fabricate.js_ ×4 · [`planJob`](fabricate.js.md#s-planJob) _js/economy/fabricate.js_ · [`stepIcework`](icework.js.md#s-stepIcework) _js/economy/icework.js_ ×2 · [`openSite`](sites.js.md#s-openSite) _js/economy/sites.js_ · [`tradeRoutes`](traderoutes.js.md#s-tradeRoutes) _js/economy/traderoutes.js_ · [`engageJobLoop`](../flight/autopilot.js.md#s-engageJobLoop) _js/flight/autopilot.js_ · [`minableDebris`](../flight/turrets.js.md#s-minableDebris) _js/flight/turrets.js_ · [`populateFlow`](../npc/flow.js.md#s-populateFlow) _js/npc/flow.js_ · [`claimSurvey`](../npc/ground.js.md#s-claimSurvey) _js/npc/ground.js_ · [`answerFor`](../npc/reports.js.md#s-answerFor) _js/npc/reports.js_ · [`transitionReport`](../npc/reports.js.md#s-transitionReport) _js/npc/reports.js_ · [`jettison`](../sim/sim.js.md#s-jettison) _js/sim/sim.js_ · [`lockCandidates`](../sim/sim.js.md#s-lockCandidates) _js/sim/sim.js_ · [`smeltAll`](../sim/sim.js.md#s-smeltAll) _js/sim/sim.js_ · [`stashAt`](../sim/sim.js.md#s-stashAt) _js/sim/sim.js_ · [`tradeBuy`](../sim/sim.js.md#s-tradeBuy) _js/sim/sim.js_ · [`tradeSell`](../sim/sim.js.md#s-tradeSell) _js/sim/sim.js_ ×2 · [`tryAssay`](../sim/sim.js.md#s-tryAssay) _js/sim/sim.js_ ×4 · [`worksPanel`](../station/deckworks.js.md#s-worksPanel) _js/station/deckworks.js_ · [`build`](../station/fabyard.js.md#s-build) _js/station/fabyard.js_ ×6 · [`stepProduction`](../station/stationworks.js.md#s-stepProduction) _js/station/stationworks.js_ · [`holdSlots`](../ui/holdview.js.md#s-holdSlots) _js/ui/holdview.js_ · [`applyArchStats`](../world/bodies.js.md#s-applyArchStats) _js/world/bodies.js_

<!-- note:goodName -->
<!-- /note -->

### <a id="s-baseValue"></a>`baseValue(id)`

function · **exported** · L123–125

- called by: [`stationCtx.cargoValue`](../comms/comms.js.md#s-stationCtx-cargoValue) _js/comms/comms.js_ · [`THREADS.say~4`](../crew/talk-threads.js.md#s-THREADS-say-4) _js/crew/talk-threads.js_ · [`KINDS.build`](contracts.js.md#s-KINDS-build) _js/economy/contracts.js_ · [`KINDS.courier`](contracts.js.md#s-KINDS-courier) _js/economy/contracts.js_ · [`KINDS.haul`](contracts.js.md#s-KINDS-haul) _js/economy/contracts.js_ · [`KINDS.pod`](contracts.js.md#s-KINDS-pod) _js/economy/contracts.js_ · [`goodValue`](contracts.js.md#s-goodValue) _js/economy/contracts.js_ · [`qtyFor`](contracts.js.md#s-qtyFor) _js/economy/contracts.js_ · [`unitBasis`](contracts.js.md#s-unitBasis) _js/economy/contracts.js_ · [`runLines`](economy.js.md#s-runLines) _js/economy/economy.js_ · [`wantsOf`](economy.js.md#s-wantsOf) _js/economy/economy.js_ · [`fabMargin`](fabricate.js.md#s-fabMargin) _js/economy/fabricate.js_ ×2 · [`planJob`](fabricate.js.md#s-planJob) _js/economy/fabricate.js_ · [`benchValue`](icework.js.md#s-benchValue) _js/economy/icework.js_ ×2 · [`priceAt`](#s-priceAt) · [`claimSurvey`](../npc/ground.js.md#s-claimSurvey) _js/npc/ground.js_ · [`flowUnit`](../npc/speech.js.md#s-flowUnit) _js/npc/speech.js_ · [`vesselUnit`](../npc/speech.js.md#s-vesselUnit) _js/npc/speech.js_ · [`smeltAll`](../sim/sim.js.md#s-smeltAll) _js/sim/sim.js_ · [`holdSlots`](../ui/holdview.js.md#s-holdSlots) _js/ui/holdview.js_ · [`hulkManifest`](../world/hulks.js.md#s-hulkManifest) _js/world/hulks.js_ ×3

<!-- note:baseValue -->
<!-- /note -->

### <a id="s-derivedValue"></a>`derivedValue(id, memo=)`

function · **exported** · L127–142

- calls: [`derivedValue`](#s-derivedValue) · [`niceValue`](#s-niceValue) ×2
- called by: [`derivedValue`](#s-derivedValue)

<!-- note:derivedValue -->
What the rule says `id` is worth (see VALUE_RULE) — the test holds the table to it.
<!-- /note -->

### <a id="s-goodMass"></a>`goodMass(id)`

function · **exported** · L144–146

<!-- note:goodMass -->
<!-- /note -->

### <a id="s-BULK"></a>`BULK`

const · **exported** · L148–148

<!-- note:BULK -->
---- the hold is a VOLUME (0.3.52) ----------------------------------------

The hold used to count items: a unit of hydrogen and a unit of platinum ore
took the same one slot, and a hull's hold was 400 × a factor clamped at 4,
so the biggest ship in the registry carried 1,600 of anything and a
Fledgling ~305. Reported: "capped at like 250 platinum ore".

Now a hold has a capacity in HOLD UNITS (hu) and every good takes up its
BULK in them, from its mass per unit — denser ore, fewer units in the same
hold. Deliberately not the raw mass: hydrogen to uraninite is 82× by mass,
which is right for a scale and silly for a cargo bay, so bulk runs from 0.4
(the gases, a unit of ice) to 2 (the heavy metal ores), and a made thing up
to 3.5. Cargo still has no effect on flight; a port still only buys what its
treasury can pay for, which is what keeps a hold of 200,000 honest.
<!-- /note -->

### <a id="s-bulkOf"></a>`bulkOf(id)`

function · **exported** · L149–154

- called by: [`unpostedWork`](../aria/senses.js.md#s-unpostedWork) _js/aria/senses.js_ · [`hullFit.capFor`](contracts.js.md#s-hullFit-capFor) _js/economy/contracts.js_ · [`tradeRoutes`](traderoutes.js.md#s-tradeRoutes) _js/economy/traderoutes.js_ · [`cargoTotal`](../flight/ship.js.md#s-cargoTotal) _js/flight/ship.js_ · [`roomFor`](../flight/ship.js.md#s-roomFor) _js/flight/ship.js_ · [`holdSlots`](../ui/holdview.js.md#s-holdSlots) _js/ui/holdview.js_ ×2

<!-- note:bulkOf -->
<!-- /note -->

### <a id="s-HOLD"></a>`HOLD`

const · **exported** · L156–156

<!-- note:HOLD -->
A hull's hold in hu from its registry cargo rating — no ceiling, a steady curve.
<!-- /note -->

### <a id="s-holdForCargoRating"></a>`holdForCargoRating(c)`

function · **exported** · L157–159

- called by: [`hullTuneFor`](../ships/shipdb.js.md#s-hullTuneFor) _js/ships/shipdb.js_

<!-- note:holdForCargoRating -->
<!-- /note -->

### <a id="s-oresFor"></a>`oresFor(kind)`

function · **exported** · L161–163

- called by: [`rollOre`](#s-rollOre)

<!-- note:oresFor -->
Everything a given body kind can yield, weighted by abundance.
<!-- /note -->

### <a id="s-rollOre"></a>`rollOre(kind, rnd)`

function · **exported** · L165–175

- calls: [`oresFor`](#s-oresFor)
- called by: [`tryScan`](../sim/sim.js.md#s-tryScan) _js/sim/sim.js_ ×2

<!-- note:rollOre -->
Pick an ore from a body kind, biased by abundance.
<!-- /note -->

### <a id="s-SECTORS"></a>`SECTORS`

const · **exported** · L177–232

<!-- note:SECTORS -->
---- sectors ------------------------------------------------------------

Each sector produces some of the list cheaply and wants the rest badly.
sells: multiplier under 1 means they have a surplus.
buys:  multiplier over 1 means they pay over the odds.
<!-- /note -->

### <a id="s-SECTOR_IDS"></a>`SECTOR_IDS`

const · **exported** · L234–234

<!-- note:SECTOR_IDS -->
<!-- /note -->

### <a id="s-FINISHED_BONUS"></a>`FINISHED_BONUS`

const · **exported** · L236–236

<!-- note:FINISHED_BONUS -->
What a station will pay for, or charge for, a given good.

What a port pays over the odds for FINISHED work it does not do itself.

0.3.11. Before this, selling a motor back to the industrial yard that builds
motors paid the same as selling it to a farm that cannot make one — so
fabricating and then hauling the parts somewhere was worth no more than
dumping them at the works door, and the whole chain ended at the counter it
started at. A port that makes a thing has no reason to want yours; a port
that cannot make it does.

Only tiers you actually BUILD get this. Ore is dug, not made, so hauling rock
around is unchanged.
<!-- /note -->

### <a id="s-finishedBonus"></a>`finishedBonus(s, id)`

function · L238–245

- called by: [`priceAt`](#s-priceAt)

<!-- note:finishedBonus -->
- L242 · `if (s.sells[id]) return 1;` — it makes these: yours is competition
- L243 · `if (s.buys[id]) return 1;` — already has an explicit appetite
<!-- /note -->

### <a id="s-priceAt"></a>`priceAt(sector, id, kind=)`

function · **exported** · L247–257

- calls: [`baseValue`](#s-baseValue) · [`finishedBonus`](#s-finishedBonus)
- called by: [`adjust`](economy.js.md#s-adjust) _js/economy/economy.js_ · [`askPrice`](economy.js.md#s-askPrice) _js/economy/economy.js_ · [`bidPrice`](economy.js.md#s-bidPrice) _js/economy/economy.js_ · [`demandFor`](#s-demandFor) · [`stockFor`](#s-stockFor) ×2 · [`sellPriceAt`](../sim/sim.js.md#s-sellPriceAt) _js/sim/sim.js_ · [`tradeSell`](../sim/sim.js.md#s-tradeSell) _js/sim/sim.js_ · [`addStock`](../station/stationworks.js.md#s-addStock) _js/station/stationworks.js_

<!-- note:priceAt -->
- L252 · `const m = (s.buys[id] ?? (s.sells[id] ? s.sells[id] * 0.8 : 0.92)) * finishedBonus(s, id);` — what the station pays you
- L255 · `const m = s.sells[id] ?? (s.buys[id] ? s.buys[id] * 1.25 : 1.12);` — what it charges you
<!-- /note -->

### <a id="s-stockFor"></a>`stockFor(sector, rnd)`

function · **exported** · L259–271

- calls: [`priceAt`](#s-priceAt) ×2
- called by: [`make`](../station/stations.js.md#s-make) _js/station/stations.js_

<!-- note:stockFor -->
A plausible stock list for a station of this sector.

- L265 · `for (const id of ["water", "hydrogen_r", "steel", "wiring"]) {` — a few odds and ends everybody carries
<!-- /note -->

### <a id="s-demandFor"></a>`demandFor(sector)`

function · **exported** · L273–276

- calls: [`priceAt`](#s-priceAt)

<!-- note:demandFor -->
<!-- /note -->
