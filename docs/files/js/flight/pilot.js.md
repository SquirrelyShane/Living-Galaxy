# js/flight/pilot.js

[index](../../../README.md) · 369 lines · 38 symbols · 5 imports · 73 importers

## About

<!-- note:@file -->
LIVING GALAXY — the pilot.

Who you are, what you trained as, and who you fly for. Race traits land on
the ship at launch; the career ladder from js/careers advances off what you
actually do out there, not off a menu.
<!-- /note -->

## Imports

| line | from | names | target |
|---|---|---|---|
| 1 | `../careers/index.js` | `COMPLEXES`, `COMPLEX_IDS`, `SKILLS`, `createCharacter`, `displayTitle`, `enroll`, `getComplex`, `promote`, `promotionCheck`, `specialize`, `specializationCheck`, `tickCycle`, `trainSkill`, `transferEligibility` | [js/careers/index.js](../careers/index.js.md) |
| 17 | `../careers/effects.js` | `SPEC_EFFECTS`, `composeMods`, `effectLines` | [js/careers/effects.js](../careers/effects.js.md) |
| 18 | `../careers/status.js` | `careerStatus` | [js/careers/status.js](../careers/status.js.md) |
| 19 | `../crew/races.js` | `RACES`, `raceById`, `traitsOf` | [js/crew/races.js](../crew/races.js.md) |
| 20 | `../corp/corps.js` | `corpById`, `corps`, `setStandingMods` | [js/corp/corps.js](../corp/corps.js.md) |

## Imported by

- [js/aria/pilot.js](../aria/pilot.js.md) — `pilot`
- [js/aria/play.js](../aria/play.js.md) — `pilot`
- [js/comms/comms.js](../comms/comms.js.md) — `pilot`
- [js/console/panels/corp.js](../console/panels/corp.js.md) — `certSheet`, `corp`, `pilot`, `rankStatus`, `skillSheet`, `specEffectLines`, `specOptions`, `standingSheet`, `title`, `transferOptions`, `tryPromote`, `trySpecialize`, `tryTransfer`
- [js/corp/company.js](../corp/company.js.md) — `pilot`
- [js/corp/seclevel.js](../corp/seclevel.js.md) — `pilot`
- [js/crew/family.js](../crew/family.js.md) — `pilot`
- [js/economy/contracts.js](../economy/contracts.js.md) — `work`, `pilot`
- [js/economy/upgrades.js](../economy/upgrades.js.md) — `setUpgradeMods`
- [js/main.js](../main.js.md) — `pilot`, `title`
- [js/npc/crewfx.js](../npc/crewfx.js.md) — `setCrewMods`
- [js/sim/sim.js](../sim/sim.js.md) — `applyRaceToShip`, `applyRaceTune`, `loadPilot`, `pilot`, `rankStatus`, `savePilot`, `serveTime`, `syncMods`, `takePayout`, `title`, `work`
- [js/station/stationdeck.js](../station/stationdeck.js.md) — `pilot`, `rankStatus`
- [js/ui/boardview.js](../ui/boardview.js.md) — `pilot`
- [js/ui/creation.js](../ui/creation.js.md) — `careerCatalog`, `makePilot`
- [js/ui/hud.js](../ui/hud.js.md) — `loadPilot`, `restorePilot`
- [js/ui/tutorial.js](../ui/tutorial.js.md) — `pilot`
- [js/world/events/atmoworks.js](../world/events/atmoworks.js.md) — `work`
- test/aria-mining-loop.test.mjs _(outside js/)_ — `makePilot`
- test/ariabiz.test.mjs _(outside js/)_ — `makePilot`
- test/ariamind-integration.test.mjs _(outside js/)_ — `makePilot`
- test/ariaplay.test.mjs _(outside js/)_ — `makePilot`, `pilot`
- test/ariasense.test.mjs _(outside js/)_ — `makePilot`
- test/autopilot.test.mjs _(outside js/)_ — `makePilot`
- test/avoid.test.mjs _(outside js/)_ — `makePilot`
- test/balance.test.mjs _(outside js/)_ — `makePilot`
- test/bay.test.mjs _(outside js/)_ — `makePilot`
- test/beats.test.mjs _(outside js/)_ — `makePilot`
- test/board.test.mjs _(outside js/)_ — `makePilot`
- test/bounty.test.mjs _(outside js/)_ — `makePilot`
- test/careerstatus.test.mjs _(outside js/)_ — `careerCatalog`, `makePilot`, `pilot`, `transferOptions`, `tryTransfer`
- test/chains.test.mjs _(outside js/)_ — `makePilot`
- test/chart.test.mjs _(outside js/)_ — `makePilot`
- test/chartquiet.test.mjs _(outside js/)_ — `makePilot`
- test/childtalk.test.mjs _(outside js/)_ — `makePilot`
- test/converse.test.mjs _(outside js/)_ — `makePilot`
- test/crew-life.test.mjs _(outside js/)_ — `makePilot`
- test/desk.test.mjs _(outside js/)_ — `makePilot`
- test/dockwork.test.mjs _(outside js/)_ — `makePilot`
- test/economy.test.mjs _(outside js/)_ — `makePilot`
- test/gdb.test.mjs _(outside js/)_ — `makePilot`
- test/genome.test.mjs _(outside js/)_ — `makePilot`
- test/ground.test.mjs _(outside js/)_ — `makePilot`
- test/hold.test.mjs _(outside js/)_ — `makePilot`
- test/hotpath-optimization.test.mjs _(outside js/)_ — `makePilot`
- test/hulks.test.mjs _(outside js/)_ — `makePilot`
- test/jobloop.test.mjs _(outside js/)_ — `makePilot`
- test/line.test.mjs _(outside js/)_ — `makePilot`
- test/marks.test.mjs _(outside js/)_ — `makePilot`
- test/mission.test.mjs _(outside js/)_ — `makePilot`
- test/nose.test.mjs _(outside js/)_ — `makePilot`
- test/npcchat.test.mjs _(outside js/)_ — `makePilot`
- test/orders.test.mjs _(outside js/)_ — `makePilot`
- test/people.test.mjs _(outside js/)_ — `makePilot`
- test/portcontrol.test.mjs _(outside js/)_ — `makePilot`
- test/portdrones.test.mjs _(outside js/)_ — `makePilot`
- test/qrf.test.mjs _(outside js/)_ — `makePilot`, `pilot`
- test/reactive.test.mjs _(outside js/)_ — `makePilot`
- test/rig.test.mjs _(outside js/)_ — `makePilot`, `pilot`
- test/robots.test.mjs _(outside js/)_ — `makePilot`
- test/rogues.test.mjs _(outside js/)_ — `makePilot`
- test/salvage.test.mjs _(outside js/)_ — `makePilot`
- test/seclevel.test.mjs _(outside js/)_ — `makePilot`, `pilot`, `serializePilot`, `restorePilot`
- test/sites.test.mjs _(outside js/)_ — `makePilot`
- test/sky.test.mjs _(outside js/)_ — `makePilot`
- test/skycrew.test.mjs _(outside js/)_ — `makePilot`
- test/solprime.test.mjs _(outside js/)_ — `makePilot`
- test/speech.test.mjs _(outside js/)_ — `makePilot`
- test/stafflife.test.mjs _(outside js/)_ — `makePilot`
- test/systems.test.mjs _(outside js/)_ — `makePilot`
- test/trade.test.mjs _(outside js/)_ — `makePilot`
- test/undock.test.mjs _(outside js/)_ — `makePilot`
- test/upgrades.test.mjs _(outside js/)_ — `makePilot`, `pilot`

## Exports

- [`pilot`](#s-pilot) · const — used by [js/aria/pilot.js](../aria/pilot.js.md), [js/aria/play.js](../aria/play.js.md), [js/comms/comms.js](../comms/comms.js.md), [js/console/panels/corp.js](../console/panels/corp.js.md), [js/corp/company.js](../corp/company.js.md), [js/corp/seclevel.js](../corp/seclevel.js.md), [js/crew/family.js](../crew/family.js.md), [js/economy/contracts.js](../economy/contracts.js.md), [js/main.js](../main.js.md), [js/sim/sim.js](../sim/sim.js.md), [js/station/stationdeck.js](../station/stationdeck.js.md), [js/ui/boardview.js](../ui/boardview.js.md), [js/ui/tutorial.js](../ui/tutorial.js.md), test/ariaplay.test.mjs, test/careerstatus.test.mjs, test/qrf.test.mjs, test/rig.test.mjs, test/seclevel.test.mjs, test/upgrades.test.mjs
- [`setCrewMods`](#s-setCrewMods) · function — used by [js/npc/crewfx.js](../npc/crewfx.js.md)
- [`setUpgradeMods`](#s-setUpgradeMods) · function — used by [js/economy/upgrades.js](../economy/upgrades.js.md)
- [`careerCatalog`](#s-careerCatalog) · function — used by [js/ui/creation.js](../ui/creation.js.md), test/careerstatus.test.mjs
- [`makePilot`](#s-makePilot) · function — used by [js/ui/creation.js](../ui/creation.js.md), test/aria-mining-loop.test.mjs, test/ariabiz.test.mjs, test/ariamind-integration.test.mjs, test/ariaplay.test.mjs, test/ariasense.test.mjs, test/autopilot.test.mjs, test/avoid.test.mjs, test/balance.test.mjs, test/bay.test.mjs, test/beats.test.mjs, test/board.test.mjs, test/bounty.test.mjs, test/careerstatus.test.mjs, test/chains.test.mjs, test/chart.test.mjs, test/chartquiet.test.mjs, test/childtalk.test.mjs, test/converse.test.mjs, test/crew-life.test.mjs, test/desk.test.mjs, test/dockwork.test.mjs, test/economy.test.mjs, test/gdb.test.mjs, test/genome.test.mjs, test/ground.test.mjs, test/hold.test.mjs, test/hotpath-optimization.test.mjs, test/hulks.test.mjs, test/jobloop.test.mjs, test/line.test.mjs, test/marks.test.mjs, test/mission.test.mjs, test/nose.test.mjs, test/npcchat.test.mjs, test/orders.test.mjs, test/people.test.mjs, test/portcontrol.test.mjs, test/portdrones.test.mjs, test/qrf.test.mjs, test/reactive.test.mjs, test/rig.test.mjs, test/robots.test.mjs, test/rogues.test.mjs, test/salvage.test.mjs, test/seclevel.test.mjs, test/sites.test.mjs, test/sky.test.mjs, test/skycrew.test.mjs, test/solprime.test.mjs, test/speech.test.mjs, test/stafflife.test.mjs, test/systems.test.mjs, test/trade.test.mjs, test/undock.test.mjs, test/upgrades.test.mjs
- [`PILOT_KEY`](#s-PILOT_KEY) · const — **no importer in scanned roots**
- [`PILOT_RECORD_VERSION`](#s-PILOT_RECORD_VERSION) · const — **no importer in scanned roots**
- [`serializePilot`](#s-serializePilot) · function — used by test/seclevel.test.mjs
- [`restorePilot`](#s-restorePilot) · function — used by [js/ui/hud.js](../ui/hud.js.md), test/seclevel.test.mjs
- [`savePilot`](#s-savePilot) · function — used by [js/sim/sim.js](../sim/sim.js.md)
- [`loadPilot`](#s-loadPilot) · function — used by [js/sim/sim.js](../sim/sim.js.md), [js/ui/hud.js](../ui/hud.js.md)
- [`applyRaceToShip`](#s-applyRaceToShip) · function — used by [js/sim/sim.js](../sim/sim.js.md)
- [`syncMods`](#s-syncMods) · function — used by [js/sim/sim.js](../sim/sim.js.md)
- [`applyRaceTune`](#s-applyRaceTune) · function — used by [js/sim/sim.js](../sim/sim.js.md)
- [`raceTraits`](#s-raceTraits) · function — **no importer in scanned roots**
- [`work`](#s-work) · function — used by [js/economy/contracts.js](../economy/contracts.js.md), [js/sim/sim.js](../sim/sim.js.md), [js/world/events/atmoworks.js](../world/events/atmoworks.js.md)
- [`PAY_SHARE`](#s-PAY_SHARE) · const — **no importer in scanned roots**
- [`PROBATION_SHARE`](#s-PROBATION_SHARE) · const — **no importer in scanned roots**
- [`serveTime`](#s-serveTime) · function — used by [js/sim/sim.js](../sim/sim.js.md)
- [`takePayout`](#s-takePayout) · function — used by [js/sim/sim.js](../sim/sim.js.md)
- [`rankStatus`](#s-rankStatus) · function — used by [js/console/panels/corp.js](../console/panels/corp.js.md), [js/sim/sim.js](../sim/sim.js.md), [js/station/stationdeck.js](../station/stationdeck.js.md)
- [`tryPromote`](#s-tryPromote) · function — used by [js/console/panels/corp.js](../console/panels/corp.js.md)
- [`transferOptions`](#s-transferOptions) · function — used by [js/console/panels/corp.js](../console/panels/corp.js.md), test/careerstatus.test.mjs
- [`tryTransfer`](#s-tryTransfer) · function — used by [js/console/panels/corp.js](../console/panels/corp.js.md), test/careerstatus.test.mjs
- [`specOptions`](#s-specOptions) · function — used by [js/console/panels/corp.js](../console/panels/corp.js.md)
- [`trySpecialize`](#s-trySpecialize) · function — used by [js/console/panels/corp.js](../console/panels/corp.js.md)
- [`specEffectLines`](#s-specEffectLines) · function — used by [js/console/panels/corp.js](../console/panels/corp.js.md)
- [`certSheet`](#s-certSheet) · function — used by [js/console/panels/corp.js](../console/panels/corp.js.md)
- [`title`](#s-title) · function — used by [js/console/panels/corp.js](../console/panels/corp.js.md), [js/main.js](../main.js.md), [js/sim/sim.js](../sim/sim.js.md)
- [`skillSheet`](#s-skillSheet) · function — used by [js/console/panels/corp.js](../console/panels/corp.js.md)
- [`corp`](#s-corp) · function — used by [js/console/panels/corp.js](../console/panels/corp.js.md)
- [`standingSheet`](#s-standingSheet) · function — used by [js/console/panels/corp.js](../console/panels/corp.js.md)
- `COMPLEXES` — **no importer in scanned roots**
- `COMPLEX_IDS` — **no importer in scanned roots**
- [`certName`](#s-certName) · function — **no importer in scanned roots**

## Effects

_none detected_

## Symbols

### <a id="s-pilot"></a>`pilot`

const · **exported** · L22–39

- calls: [`composeMods`](../careers/effects.js.md#s-composeMods) _js/careers/effects.js_

<!-- note:pilot -->
- L28 · `drip: {},` — skill drip accumulators, so a second of mining is not a whole point
- L31 · `mods: composeMods(null, null, null),` — composed race × specialisation multipliers — the sim reads this every tick
- L32 · `busy: false,` — did any work() land this cycle? idle cycles do not train
- L33 · `payout: 0,` — scrip earned by the ladder and not yet paid into the ship's account
- L34 · `probation: false,` — probationary: enrolled under the rank A bar; cleared on first promotion
- L35 · `restored: false,` — true when this pilot came back from the record rather than the creation screen
- L37 · `dirty: false,` — something worth writing changed (skill, rank, cert, hull) — the sim's 30 s writer reads it
- L38 · `secHeat: 0,` — 0.3.48: what the Directorate holds against you (js/corp/seclevel.js). Rides the
  pilot record, so a reload is not an amnesty
<!-- /note -->

### <a id="s-crewBag"></a>`crewBag`

const · L41–41

<!-- note:crewBag -->
<!-- /note -->

### <a id="s-upgradeBag"></a>`upgradeBag`

const · L42–42

<!-- note:upgradeBag -->
<!-- /note -->

### <a id="s-setCrewMods"></a>`setCrewMods(bag)`

function · **exported** · L44–47

- calls: [`refreshMods`](#s-refreshMods)
- called by: [`updateCrewMods`](../npc/crewfx.js.md#s-updateCrewMods) _js/npc/crewfx.js_

<!-- note:setCrewMods -->
The crew's contribution (from npc/crewfx.js). Multiplies into the composed bag.
<!-- /note -->

### <a id="s-setUpgradeMods"></a>`setUpgradeMods(bag)`

function · **exported** · L49–52

- calls: [`refreshMods`](#s-refreshMods)
- called by: [`applyMods`](../economy/upgrades.js.md#s-applyMods) _js/economy/upgrades.js_

<!-- note:setUpgradeMods -->
The refit's contribution (from upgrades.js). Multiplies into the composed bag like the crew's.
<!-- /note -->

### <a id="s-refreshMods"></a>`refreshMods()`

function · L54–62

- calls: [`composeMods`](../careers/effects.js.md#s-composeMods) _js/careers/effects.js_ · [`setStandingMods`](../corp/corps.js.md#s-setStandingMods) _js/corp/corps.js_ · [`traitsOf`](../crew/races.js.md#s-traitsOf) _js/crew/races.js_
- called by: [`applyRaceToShip`](#s-applyRaceToShip) · [`makePilot`](#s-makePilot) · [`restorePilot`](#s-restorePilot) · [`setCrewMods`](#s-setCrewMods) · [`setUpgradeMods`](#s-setUpgradeMods) · [`trySpecialize`](#s-trySpecialize) · [`tryTransfer`](#s-tryTransfer)

<!-- note:refreshMods -->
<!-- /note -->

### <a id="s-careerCatalog"></a>`careerCatalog()`

function · **exported** · L64–84

- calls: [`getComplex`](../careers/complexes.js.md#s-getComplex) _js/careers/complexes.js_ · [`careerStatus`](../careers/status.js.md#s-careerStatus) _js/careers/status.js_
- via [js/careers/index.js](../careers/index.js.md): `COMPLEX_IDS.map`
- called by: [`mountCreation`](../ui/creation.js.md#s-mountCreation) _js/ui/creation.js_

<!-- note:careerCatalog -->
Everything the creation screen needs to describe a career.
<!-- /note -->

### <a id="s-makePilot"></a>`makePilot(name, raceId, complexId, corpId)`

function · **exported** · L86–112

- calls: [`createCharacter`](../careers/careerEngine.js.md#s-createCharacter) _js/careers/careerEngine.js_ · [`enroll`](../careers/careerEngine.js.md#s-enroll) _js/careers/careerEngine.js_ ×2 · [`trainSkill`](../careers/careerEngine.js.md#s-trainSkill) _js/careers/careerEngine.js_ · [`raceById`](../crew/races.js.md#s-raceById) _js/crew/races.js_ · [`refreshMods`](#s-refreshMods)
- called by: [`mountCreation>finish`](../ui/creation.js.md#s-mountCreation-finish) _js/ui/creation.js_

<!-- note:makePilot -->
- L89 · `for (const [skill, amount] of Object.entries(race.affinity ?? {})) {` — Racial affinity is a head start, not a rank — and it counts at the door.
- L94 · `if (!res.ok) res = enroll(ch, complexId, { force: true });` — taken on as a probationary aide
<!-- /note -->

### <a id="s-PILOT_KEY"></a>`PILOT_KEY`

const · **exported** · L114–114

<!-- note:PILOT_KEY -->
---- the pilot record: what "fly on as the same pilot" needs ---------------

0.3.42. Until now nothing here was written anywhere: race, career, rank,
skills, certs, the specialisation — every launch was makePilot() from the
creation screen, which is a NEW run (js/core/profile.js sweeps the old one). So
a returning player was a new character in a new corp with the starting
purse, whatever the save beside it said. The record below is a RUN key: it
goes with the pilot, travels with the account, and is swept by a new one.
The hulls the pilot bought and the cover written on them ride in it too —
they were reset at launch with everything else.
<!-- /note -->

### <a id="s-PILOT_RECORD_VERSION"></a>`PILOT_RECORD_VERSION`

const · **exported** · L115–115

<!-- note:PILOT_RECORD_VERSION -->
<!-- /note -->

### <a id="s-store"></a>`store()`

function · L117–117

- called by: [`loadPilot`](#s-loadPilot) · [`savePilot`](#s-savePilot)

<!-- note:store -->
<!-- /note -->

### <a id="s-serializePilot"></a>`serializePilot(extra=)`

function · **exported** · L119–134

- called by: [`savePilot`](#s-savePilot)

<!-- note:serializePilot -->
The record, as JSON-safe data. `extra` is what the sim owns (hulls, cover).
<!-- /note -->

### <a id="s-restorePilot"></a>`restorePilot(rec)`

function · **exported** · L136–155

- calls: [`refreshMods`](#s-refreshMods)
- via [js/crew/races.js](../crew/races.js.md): `RACES.some`
- called by: [`mountHud`](../ui/hud.js.md#s-mountHud) _js/ui/hud.js_ · [`mountHud>setMode.onFly`](../ui/hud.js.md#s-mountHud-setMode-onFly) _js/ui/hud.js_

<!-- note:restorePilot -->
Put a record back on `pilot`. Returns false (and touches nothing) for a bad one.

- L151 · `pilot.record = rec;` — the sim reads hulls and cover off it at launch
<!-- /note -->

### <a id="s-savePilot"></a>`savePilot(extra=)`

function · **exported** · L157–159

- calls: [`serializePilot`](#s-serializePilot) · [`store`](#s-store)
- called by: [`savePilotRecord`](../sim/sim.js.md#s-savePilotRecord) _js/sim/sim.js_

<!-- note:savePilot -->
<!-- /note -->

### <a id="s-loadPilot"></a>`loadPilot()`

function · **exported** · L161–166

- calls: [`store`](#s-store)
- called by: [`savePilotRecord`](../sim/sim.js.md#s-savePilotRecord) _js/sim/sim.js_ · [`mountHud`](../ui/hud.js.md#s-mountHud) _js/ui/hud.js_ ×3 · [`mountHud>paintStart`](../ui/hud.js.md#s-mountHud-paintStart) _js/ui/hud.js_ · [`mountHud>setMode.onFly`](../ui/hud.js.md#s-mountHud-setMode-onFly) _js/ui/hud.js_

<!-- note:loadPilot -->
The record on this device, or null. Does not touch `pilot`.
<!-- /note -->

### <a id="s-applyRaceToShip"></a>`applyRaceToShip(ship)`

function · **exported** · L168–176

- calls: [`traitsOf`](../crew/races.js.md#s-traitsOf) _js/crew/races.js_ · [`applyRaceTune`](#s-applyRaceTune) · [`refreshMods`](#s-refreshMods)
- called by: [`launchSim`](../sim/sim.js.md#s-launchSim) _js/sim/sim.js_

<!-- note:applyRaceToShip -->
Applies race traits to a fresh ship. Called once, at launch.
<!-- /note -->

### <a id="s-syncMods"></a>`syncMods(ship)`

function · **exported** · L178–185

- calls: [`traitsOf`](../crew/races.js.md#s-traitsOf) _js/crew/races.js_

<!-- note:syncMods -->
Called by the sim each tick: keeps the hull's modifier bag and hold in step with the pilot.
<!-- /note -->

### <a id="s-applyRaceTune"></a>`applyRaceTune(ship, t=)`

function · **exported** · L187–191

- calls: [`traitsOf`](../crew/races.js.md#s-traitsOf) _js/crew/races.js_
- called by: [`applyRaceToShip`](#s-applyRaceToShip) · [`resetTune`](../sim/sim.js.md#s-resetTune) _js/sim/sim.js_

<!-- note:applyRaceTune -->
Re-applies the race's tune multipliers to a fresh `ship.tune` (used by RESET ALL).
<!-- /note -->

### <a id="s-raceTraits"></a>`raceTraits()`

function · **exported** · L193–195

- calls: [`traitsOf`](../crew/races.js.md#s-traitsOf) _js/crew/races.js_

<!-- note:raceTraits -->
<!-- /note -->

### <a id="s-work"></a>`work(skillId, amount)`

function · **exported** · L197–208

- calls: [`trainSkill`](../careers/careerEngine.js.md#s-trainSkill) _js/careers/careerEngine.js_
- called by: [`settle`](../economy/contracts.js.md#s-settle) _js/economy/contracts.js_ · [`tickContracts`](../economy/contracts.js.md#s-tickContracts) _js/economy/contracts.js_ ×2 · [`claimPort`](../sim/sim.js.md#s-claimPort) _js/sim/sim.js_ ×2 · [`collectBeacon`](../sim/sim.js.md#s-collectBeacon) _js/sim/sim.js_ ×2 · [`finishDock`](../sim/sim.js.md#s-finishDock) _js/sim/sim.js_ · [`handInRecorders`](../sim/sim.js.md#s-handInRecorders) _js/sim/sim.js_ · [`loadSky`](../sim/sim.js.md#s-loadSky) _js/sim/sim.js_ · [`onKill`](../sim/sim.js.md#s-onKill) _js/sim/sim.js_ ×4 · [`smeltAll`](../sim/sim.js.md#s-smeltAll) _js/sim/sim.js_ · [`stepSalvage`](../sim/sim.js.md#s-stepSalvage) _js/sim/sim.js_ ×2 · [`tradeBuy`](../sim/sim.js.md#s-tradeBuy) _js/sim/sim.js_ · [`tradeSell`](../sim/sim.js.md#s-tradeSell) _js/sim/sim.js_ ×2 · [`tryAssay`](../sim/sim.js.md#s-tryAssay) _js/sim/sim.js_ ×4 · [`tryScan`](../sim/sim.js.md#s-tryScan) _js/sim/sim.js_ ×2 · [`warpDropout`](../sim/sim.js.md#s-warpDropout) _js/sim/sim.js_ · [`wireRigHooks`](../sim/sim.js.md#s-wireRigHooks) _js/sim/sim.js_ · [`stepAtmoWorks`](../world/events/atmoworks.js.md#s-stepAtmoWorks) _js/world/events/atmoworks.js_ ×2

<!-- note:work -->
---- skill drip ----------------------------------------------------------

Awards fractional skill for doing the work. Whole points only land when the
accumulator crosses one, so a long shift pays and a tap does not.
<!-- /note -->

### <a id="s-PAY_SHARE"></a>`PAY_SHARE`

const · **exported** · L210–210

<!-- note:PAY_SHARE -->
The ladder's rate is the complex's book rate; the pilot's share of it lands
in the ship's account every cycle. The rest is the complex's cut — berth,
feed, insurance. Crew wages (crew.js) are 0.2 of the same book rate, so a
two-hand crew costs most of a rank-A pilot's take: hire for the work, not
the company. Probationary aides draw a reduced share until first promotion.
<!-- /note -->

### <a id="s-PROBATION_SHARE"></a>`PROBATION_SHARE`

const · **exported** · L211–211

<!-- note:PROBATION_SHARE -->
<!-- /note -->

### <a id="s-serveTime"></a>`serveTime(seconds, {…}=)`

function · **exported** · L213–227

- calls: [`tickCycle`](../careers/careerEngine.js.md#s-tickCycle) _js/careers/careerEngine.js_

<!-- note:serveTime -->
Time in grade. Ranks want cycles as well as skill. A cycle only trains if
you did something in it — or you are docked, where a port is a classroom at
half pace. Idling in the dark serves time and pays, and teaches nothing.

- L218 · `pilot.dirty = true;` — a cycle ticked: scrip, maybe a skill — worth writing; the seconds between are not
<!-- /note -->

### <a id="s-takePayout"></a>`takePayout()`

function · **exported** · L229–234

<!-- note:takePayout -->
Drains earned scrip; the sim credits it to the ship.

- L231 · `if (p) pilot.dirty = true;` — paid something: the record moved (and so did the wallet)
<!-- /note -->

### <a id="s-rankStatus"></a>`rankStatus()`

function · **exported** · L236–256

- calls: [`promotionCheck`](../careers/careerEngine.js.md#s-promotionCheck) _js/careers/careerEngine.js_ · [`getComplex`](../careers/complexes.js.md#s-getComplex) _js/careers/complexes.js_
- called by: [`mountPilot`](../console/panels/corp.js.md#s-mountPilot) _js/console/panels/corp.js_ · [`issuedHullId`](../sim/sim.js.md#s-issuedHullId) _js/sim/sim.js_ · [`loseHull`](../sim/sim.js.md#s-loseHull) _js/sim/sim.js_ · [`publishHud`](../sim/sim.js.md#s-publishHud) _js/sim/sim.js_ · [`PANELS.shipyard`](../station/stationdeck.js.md#s-PANELS-shipyard) _js/station/stationdeck.js_

<!-- note:rankStatus -->
---- rank ----------------------------------------------------------------
<!-- /note -->

### <a id="s-tryPromote"></a>`tryPromote()`

function · **exported** · L258–268

- calls: [`displayTitle`](../careers/careerEngine.js.md#s-displayTitle) _js/careers/careerEngine.js_ · [`promote`](../careers/careerEngine.js.md#s-promote) _js/careers/careerEngine.js_
- called by: [`mountPilot`](../console/panels/corp.js.md#s-mountPilot) _js/console/panels/corp.js_

<!-- note:tryPromote -->
<!-- /note -->

### <a id="s-transferOptions"></a>`transferOptions()`

function · **exported** · L270–281

- calls: [`transferEligibility`](../careers/careerEngine.js.md#s-transferEligibility) _js/careers/careerEngine.js_ · [`getComplex`](../careers/complexes.js.md#s-getComplex) _js/careers/complexes.js_ · [`careerStatus`](../careers/status.js.md#s-careerStatus) _js/careers/status.js_
- via [js/careers/index.js](../careers/index.js.md): `COMPLEX_IDS.filter`, `COMPLEX_IDS.filter.map`
- called by: [`mountPilot`](../console/panels/corp.js.md#s-mountPilot) _js/console/panels/corp.js_

<!-- note:transferOptions -->
Lateral transfer to another complex: cycles kept, ladder restarts at A (B if related and senior).
<!-- /note -->

### <a id="s-tryTransfer"></a>`tryTransfer(toId)`

function · **exported** · L283–303

- calls: [`enroll`](../careers/careerEngine.js.md#s-enroll) _js/careers/careerEngine.js_ · [`transferEligibility`](../careers/careerEngine.js.md#s-transferEligibility) _js/careers/careerEngine.js_ · [`getComplex`](../careers/complexes.js.md#s-getComplex) _js/careers/complexes.js_ ×2 · [`careerStatus`](../careers/status.js.md#s-careerStatus) _js/careers/status.js_ · [`refreshMods`](#s-refreshMods)
- called by: [`mountPilot`](../console/panels/corp.js.md#s-mountPilot) _js/console/panels/corp.js_

<!-- note:tryTransfer -->
- L291 · `e = transferEligibility(pilot.character, pilot.complexId, toId);` — a ladder you have never climbed: enrol fresh
<!-- /note -->

### <a id="s-specOptions"></a>`specOptions()`

function · **exported** · L305–312

- calls: [`specializationCheck`](../careers/careerEngine.js.md#s-specializationCheck) _js/careers/careerEngine.js_ · [`getComplex`](../careers/complexes.js.md#s-getComplex) _js/careers/complexes.js_ · [`effectLines`](../careers/effects.js.md#s-effectLines) _js/careers/effects.js_
- called by: [`mountPilot`](../console/panels/corp.js.md#s-mountPilot) _js/console/panels/corp.js_

<!-- note:specOptions -->
<!-- /note -->

### <a id="s-trySpecialize"></a>`trySpecialize(specId)`

function · **exported** · L314–322

- calls: [`specialize`](../careers/careerEngine.js.md#s-specialize) _js/careers/careerEngine.js_ · [`refreshMods`](#s-refreshMods)
- called by: [`mountPilot`](../console/panels/corp.js.md#s-mountPilot) _js/console/panels/corp.js_

<!-- note:trySpecialize -->
<!-- /note -->

### <a id="s-specEffectLines"></a>`specEffectLines(specId=)`

function · **exported** · L324–326

- calls: [`effectLines`](../careers/effects.js.md#s-effectLines) _js/careers/effects.js_
- called by: [`mountPilot`](../console/panels/corp.js.md#s-mountPilot) _js/console/panels/corp.js_

<!-- note:specEffectLines -->
"Mining yield +15%" lines for a specialisation id (or the current one).
<!-- /note -->

### <a id="s-certSheet"></a>`certSheet()`

function · **exported** · L328–330

- calls: [`certName`](#s-certName)
- called by: [`mountPilot`](../console/panels/corp.js.md#s-mountPilot) _js/console/panels/corp.js_

<!-- note:certSheet -->
Certificates held — the record of the climb, not a gate.
<!-- /note -->

### <a id="s-title"></a>`title()`

function · **exported** · L332–335

- calls: [`displayTitle`](../careers/careerEngine.js.md#s-displayTitle) _js/careers/careerEngine.js_
- called by: [`mountPilot`](../console/panels/corp.js.md#s-mountPilot) _js/console/panels/corp.js_ ×3 · [`meta`](../main.js.md#s-meta) _js/main.js_ · [`publishHud`](../sim/sim.js.md#s-publishHud) _js/sim/sim.js_

<!-- note:title -->
<!-- /note -->

### <a id="s-skillSheet"></a>`skillSheet()`

function · **exported** · L337–344

- called by: [`mountPilot`](../console/panels/corp.js.md#s-mountPilot) _js/console/panels/corp.js_

<!-- note:skillSheet -->
Skills sorted by value, for the terminal.
<!-- /note -->

### <a id="s-corp"></a>`corp()`

function · **exported** · L346–348

- calls: [`corpById`](../corp/corps.js.md#s-corpById) _js/corp/corps.js_
- called by: [`mountPilot`](../console/panels/corp.js.md#s-mountPilot) _js/console/panels/corp.js_

<!-- note:corp -->
<!-- /note -->

### <a id="s-standingSheet"></a>`standingSheet()`

function · **exported** · L350–352

- via [js/corp/corps.js](../corp/corps.js.md): `corps.map`
- called by: [`mountStanding`](../console/panels/corp.js.md#s-mountStanding) _js/console/panels/corp.js_ · [`search`](../console/panels/corp.js.md#s-search) _js/console/panels/corp.js_

<!-- note:standingSheet -->
<!-- /note -->

### <a id="s-CERT_WORDS"></a>`CERT_WORDS`

const · L356–361

<!-- note:CERT_WORDS -->
---- certificate names --------------------------------------------------
<!-- /note -->

### <a id="s-certName"></a>`certName(id)`

function · **exported** · L363–369

- called by: [`certSheet`](#s-certSheet)

<!-- note:certName -->
<!-- /note -->
