# js/economy/upgrades.js

[index](../../../README.md) · 255 lines · 46 symbols · 5 imports · 18 importers

## About

<!-- note:@file -->
LIVING GALAXY — refit upgrades.

Bought at a yard whose sector lists them, owned per sky (they are bolted to
this hull, and a new sky is a new hull). Two kinds of effect: `mods` fold
into pilot.mods through pilot.setUpgradeMods like the crew bag does, so the
sim reads them from ship.mods with no new plumbing; `fx` are read where they
land — ship.js (reactor, battery, shield regen, thrust), sim.js (berths),
crew/robots.js (robot draw and wear), crew/duties.js (galley morale),
mission/run.js (the mission core). Contract: PLAN.md §4.8.

- L255 · `shipFx.fx = fx;` — ship.js reads its fx through this hook so it never has to import the sim
<!-- /note -->

## Imports

| line | from | names | target |
|---|---|---|---|
| 1 | `../sim/sim.js` | `currentShipId`, `sim` | [js/sim/sim.js](../sim/sim.js.md) |
| 2 | `../ships/shipdb.js` | `shipById` | [js/ships/shipdb.js](../ships/shipdb.js.md) |
| 3 | `../flight/pilot.js` | `setUpgradeMods` | [js/flight/pilot.js](../flight/pilot.js.md) |
| 4 | `../flight/ship.js` | `shipFx` | [js/flight/ship.js](../flight/ship.js.md) |
| 5 | `../careers/effects.js` | `MOD_KEYS`, `MOD_LABELS`, `defaultMods` | [js/careers/effects.js](../careers/effects.js.md) |

## Imported by

- [js/aria/pilot.js](../aria/pilot.js.md) — `upgradeOptions`, `buyUpgrade`, `hasUpgrade`, `effectOf`
- [js/console/panels/market.js](../console/panels/market.js.md) — `upgradeLines`
- [js/console/panels/ship.js](../console/panels/ship.js.md) — `upgradeLines`
- [js/console/panels/work.js](../console/panels/work.js.md) — `hasUpgrade`
- [js/crew/duties.js](../crew/duties.js.md) — `fx`
- [js/crew/robots.js](../crew/robots.js.md) — `fx`
- [js/flight/repair.js](../flight/repair.js.md) — `fx`
- [js/mission/run.js](../mission/run.js.md) — `hasUpgrade`
- [js/mission/script.js](../mission/script.js.md) — `hasUpgrade`, `fx`
- [js/sim/sim.js](../sim/sim.js.md) — `fx`, `loadUpgrades`, `upgradeResists`, `resistKey`
- [js/station/refityard.js](../station/refityard.js.md) — `upgradeOptions`, `buyUpgrade`, `sellUpgrade`, `upgradeLines`, `effectOf`, `upgrades`
- [js/station/refityard.js](../station/refityard.js.md) — `upgradeResists`
- [js/ui/tutorial-core.js](../ui/tutorial-core.js.md) — `UPGRADES`, `hasUpgrade`
- test/defence.test.mjs _(outside js/)_ — `UPGRADES`
- test/mission.test.mjs _(outside js/)_ — `upgrades`
- test/robots.test.mjs _(outside js/)_ — `buyUpgrade`, `upgrades`
- test/systems.test.mjs _(outside js/)_ — `UPGRADES`, `buyUpgrade`, `fx`, `upgrades`
- test/upgrades.test.mjs _(outside js/)_ — `UPGRADES`, `upgrades`, `UPGRADES_KEY`, `hasUpgrade`, `fx`, `upgradeOptions`, `buyUpgrade`, `sellUpgrade`, `upgradeMods`, `upgradeLines`, `saveUpgrades`, `loadUpgrades`

## Exports

- [`UPGRADES`](#s-UPGRADES) · const — used by [js/ui/tutorial-core.js](../ui/tutorial-core.js.md), test/defence.test.mjs, test/systems.test.mjs, test/upgrades.test.mjs
- [`upgrades`](#s-upgrades) · const — used by [js/station/refityard.js](../station/refityard.js.md), test/mission.test.mjs, test/robots.test.mjs, test/systems.test.mjs, test/upgrades.test.mjs
- [`UPGRADES_KEY`](#s-UPGRADES_KEY) · function — used by test/upgrades.test.mjs
- [`hasUpgrade`](#s-hasUpgrade) · function — used by [js/aria/pilot.js](../aria/pilot.js.md), [js/console/panels/work.js](../console/panels/work.js.md), [js/mission/run.js](../mission/run.js.md), [js/mission/script.js](../mission/script.js.md), [js/ui/tutorial-core.js](../ui/tutorial-core.js.md), test/upgrades.test.mjs
- [`fx`](#s-fx) · function — used by [js/crew/duties.js](../crew/duties.js.md), [js/crew/robots.js](../crew/robots.js.md), [js/flight/repair.js](../flight/repair.js.md), [js/mission/script.js](../mission/script.js.md), [js/sim/sim.js](../sim/sim.js.md), test/systems.test.mjs, test/upgrades.test.mjs
- [`upgradeOptions`](#s-upgradeOptions) · function — used by [js/aria/pilot.js](../aria/pilot.js.md), [js/station/refityard.js](../station/refityard.js.md), test/upgrades.test.mjs
- [`buyUpgrade`](#s-buyUpgrade) · function — used by [js/aria/pilot.js](../aria/pilot.js.md), [js/station/refityard.js](../station/refityard.js.md), test/robots.test.mjs, test/systems.test.mjs, test/upgrades.test.mjs
- [`sellUpgrade`](#s-sellUpgrade) · function — used by [js/station/refityard.js](../station/refityard.js.md), test/upgrades.test.mjs
- [`upgradeMods`](#s-upgradeMods) · function — used by test/upgrades.test.mjs
- [`upgradeResists`](#s-upgradeResists) · function — used by [js/sim/sim.js](../sim/sim.js.md), [js/station/refityard.js](../station/refityard.js.md)
- [`resistKey`](#s-resistKey) · function — used by [js/sim/sim.js](../sim/sim.js.md)
- [`effectOf`](#s-effectOf) · function — used by [js/aria/pilot.js](../aria/pilot.js.md), [js/station/refityard.js](../station/refityard.js.md)
- [`upgradeLines`](#s-upgradeLines) · function — used by [js/console/panels/market.js](../console/panels/market.js.md), [js/console/panels/ship.js](../console/panels/ship.js.md), [js/station/refityard.js](../station/refityard.js.md), test/upgrades.test.mjs
- [`saveUpgrades`](#s-saveUpgrades) · function — used by test/upgrades.test.mjs
- [`loadUpgrades`](#s-loadUpgrades) · function — used by [js/sim/sim.js](../sim/sim.js.md), test/upgrades.test.mjs

## Effects

- **storage.get** — `‹UPGRADES_KEY()›` (loadUpgrades:246)
- **storage.set** — `‹UPGRADES_KEY()›` (saveUpgrades:239)

## Symbols

### <a id="s-UPGRADES"></a>`UPGRADES`

const · **exported** · L7–100

<!-- note:UPGRADES -->
{ id, name, blurb, price, sector: [...], tier?: "A".."G", mods?: {…MOD_KEYS}, fx?: {...non-mod}, excludes?: [id] }

- L8 · `{ id: "reactor_coil",  name: "Reactor coil II",        price: 4200, sector: ["industrial",` — ---- power and drive ----------------------------------------------------
- L21 · `{ id: "warp_tuning",   name: "Warp coil tuning",       price: 6400, sector: ["industrial",` — ---- flight and nav -----------------------------------------------------
- L32 · `{ id: "sensor_mast",   name: "Long-range mast",        price: 3900, sector: ["civilian", "` — ---- sensors and survey -------------------------------------------------
- L41 · `{ id: "cutter_lens",   name: "Cutter lens",            price: 4800, sector: ["industrial"]` — ---- the cutter and the hold --------------------------------------------
- L54 · `{ id: "plating",       name: "Hardened plating",       price: 5600, sector: ["military", "` — ---- the hull ------------------------------------------------------------
- L54 · `{ id: "plating",       name: "Hardened plating",       price: 5600, sector: ["military", "` — 0.3.34 — the hull refits carry RESISTANCES now (js/flight/defence.js), which is
  additive percentage against a damage KIND rather than another multiplier
  on the pool. Before this, the best armour in the game bought 0.9 seconds
  against seven drones; plate is supposed to be the answer to being shot,
  and now it is. Each of these is deliberately good at one thing and no
  help at another, so a refit is a decision about what you expect to meet.
- L73 · `{ id: "quarters",      name: "Quarters refit",         price: 5000, sector: ["civilian", "` — ---- the people ----------------------------------------------------------
- L90 · `{ id: "trade_uplink",  name: "Trade uplink",           price: 4500, sector: ["logistic", "` — ---- the ledger ----------------------------------------------------------
<!-- /note -->

### <a id="s-upgrades"></a>`upgrades`

const · **exported** · L102–102

<!-- note:upgrades -->
<!-- /note -->

### <a id="s-UPGRADES_KEY"></a>`UPGRADES_KEY()`

function · **exported** · L104–104

- called by: [`loadUpgrades`](#s-loadUpgrades) · [`saveUpgrades`](#s-saveUpgrades)

<!-- note:UPGRADES_KEY -->
<!-- /note -->

### <a id="s-ADDITIVE"></a>`ADDITIVE`

const · L106–106

<!-- note:ADDITIVE -->
fx keys that add up in units; every other numeric fx is a factor
<!-- /note -->

### <a id="s-TIER_ORDER"></a>`TIER_ORDER`

const · L107–107

<!-- note:TIER_ORDER -->
<!-- /note -->

### <a id="s-hasUpgrade"></a>`hasUpgrade(id)`

function · **exported** · L109–111

- called by: [`refitPlan`](../aria/pilot.js.md#s-refitPlan) _js/aria/pilot.js_ · [`registerRefitOp`](../aria/pilot.js.md#s-registerRefitOp) _js/aria/pilot.js_ · [`sellUpgrade`](#s-sellUpgrade) · [`upgradeOptions`](#s-upgradeOptions) ×3 · [`missionCore`](../mission/script.js.md#s-missionCore) _js/mission/script.js_ · [`hasFit`](../ui/tutorial-core.js.md#s-hasFit) _js/ui/tutorial-core.js_

<!-- note:hasUpgrade -->
<!-- /note -->

### <a id="s-byId"></a>`byId(id)`

function · L113–115

- called by: [`buyUpgrade`](#s-buyUpgrade) · [`fx`](#s-fx) · [`loadUpgrades`](#s-loadUpgrades) · [`sellUpgrade`](#s-sellUpgrade) · [`upgradeMods`](#s-upgradeMods) · [`upgradeOptions`](#s-upgradeOptions) · [`upgradeResists`](#s-upgradeResists)

<!-- note:byId -->
<!-- /note -->

### <a id="s-fx"></a>`fx(key, dflt)`

function · **exported** · L117–127

- calls: [`byId`](#s-byId)
- called by: [`tickDutiesCycle`](../crew/duties.js.md#s-tickDutiesCycle) _js/crew/duties.js_ · [`robotsSummary`](../crew/robots.js.md#s-robotsSummary) _js/crew/robots.js_ · [`tickRobots`](../crew/robots.js.md#s-tickRobots) _js/crew/robots.js_ ×2 · [`droneRate`](../flight/repair.js.md#s-droneRate) _js/flight/repair.js_ · [`missionCore`](../mission/script.js.md#s-missionCore) _js/mission/script.js_ · [`crewCapacity`](../sim/sim.js.md#s-crewCapacity) _js/sim/sim.js_ · [`robotCapacity`](../sim/sim.js.md#s-robotCapacity) _js/sim/sim.js_ · [`smeltAll`](../sim/sim.js.md#s-smeltAll) _js/sim/sim.js_ · [`stepWarp`](../sim/sim.js.md#s-stepWarp) _js/sim/sim.js_ · [`tickHullRepair`](../sim/sim.js.md#s-tickHullRepair) _js/sim/sim.js_

<!-- note:fx -->
Σ/Π of fx across owned (multiplicative for factors, additive for +units, OR for flags).
<!-- /note -->

### <a id="s-hullTier"></a>`hullTier()`

function · L129–131

- calls: [`shipById`](../ships/shipdb.js.md#s-shipById) _js/ships/shipdb.js_ · [`currentShipId`](../sim/sim.js.md#s-currentShipId) _js/sim/sim.js_
- called by: [`upgradeOptions`](#s-upgradeOptions)

<!-- note:hullTier -->
The hull's tier letter, for the tier gate; the trainer everyone starts in is an A.
<!-- /note -->

### <a id="s-upgradeOptions"></a>`upgradeOptions(st)`

function · **exported** · L133–146

- calls: [`byId`](#s-byId) · [`hasUpgrade`](#s-hasUpgrade) ×3 · [`hullTier`](#s-hullTier)
- called by: [`refitPlan`](../aria/pilot.js.md#s-refitPlan) _js/aria/pilot.js_ · [`registerRefitOp`](../aria/pilot.js.md#s-registerRefitOp) _js/aria/pilot.js_ · [`buyUpgrade`](#s-buyUpgrade) · [`build`](../station/refityard.js.md#s-build) _js/station/refityard.js_

<!-- note:upgradeOptions -->
→ [{ ...u, blocker, owned }] — sector, credits, owned, hull tier, conflicts.
<!-- /note -->

### <a id="s-buyUpgrade"></a>`buyUpgrade(id, st)`

function · **exported** · L148–159

- calls: [`applyMods`](#s-applyMods) · [`byId`](#s-byId) · [`saveUpgrades`](#s-saveUpgrades) · [`upgradeOptions`](#s-upgradeOptions)
- called by: [`registerRefitOp`](../aria/pilot.js.md#s-registerRefitOp) _js/aria/pilot.js_ · [`build`](../station/refityard.js.md#s-build) _js/station/refityard.js_

<!-- note:buyUpgrade -->
→ null | error. Bills the ship, files the upgrade, refreshes pilot.mods.
<!-- /note -->

### <a id="s-sellUpgrade"></a>`sellUpgrade(id)`

function · **exported** · L161–169

- calls: [`applyMods`](#s-applyMods) · [`byId`](#s-byId) · [`hasUpgrade`](#s-hasUpgrade) · [`saveUpgrades`](#s-saveUpgrades)
- called by: [`build`](../station/refityard.js.md#s-build) _js/station/refityard.js_

<!-- note:sellUpgrade -->
50% back at any yard. → null | error
<!-- /note -->

### <a id="s-upgradeMods"></a>`upgradeMods()`

function · **exported** · L171–177

- calls: [`defaultMods`](../careers/effects.js.md#s-defaultMods) _js/careers/effects.js_ · [`byId`](#s-byId)
- via [js/careers/effects.js](../careers/effects.js.md): `MOD_KEYS.includes`
- called by: [`applyMods`](#s-applyMods)

<!-- note:upgradeMods -->
→ the product of every owned upgrade's mods over MOD_KEYS (1 where nothing applies).
<!-- /note -->

### <a id="s-upgradeResists"></a>`upgradeResists()`

function · **exported** · L179–185

- calls: [`byId`](#s-byId)
- called by: [`resistKey`](#s-resistKey) · [`syncHullDefence`](../sim/sim.js.md#s-syncHullDefence) _js/sim/sim.js_ · [`build`](../station/refityard.js.md#s-build) _js/station/refityard.js_

<!-- note:upgradeResists -->
Fitted resistances, SUMMED rather than multiplied, and deliberately kept out
of the mods bag.

The bag is a product over MOD_KEYS and `composeMods` walks it multiplying
numbers; a nested object in there would be multiplied as NaN by the first
race or career effect that touched it. Resists are their own thing, read
straight by js/sim/sim.js when it sets the hull's defence.

`shield_*` keys land on the screen rather than the plate — see resistsFor().
<!-- /note -->

### <a id="s-resistKey"></a>`resistKey()`

function · **exported** · L187–189

- calls: [`upgradeResists`](#s-upgradeResists)
- called by: [`syncHullDefence`](../sim/sim.js.md#s-syncHullDefence) _js/sim/sim.js_

<!-- note:resistKey -->
A stable string for the fitted resist set, so the sim can tell when it changed.
<!-- /note -->

### <a id="s-applyMods"></a>`applyMods()`

function · L191–193

- calls: [`upgradeMods`](#s-upgradeMods) · [`setUpgradeMods`](../flight/pilot.js.md#s-setUpgradeMods) _js/flight/pilot.js_
- called by: [`buyUpgrade`](#s-buyUpgrade) · [`loadUpgrades`](#s-loadUpgrades) · [`sellUpgrade`](#s-sellUpgrade)

<!-- note:applyMods -->
<!-- /note -->

### <a id="s-FX_LINE"></a>`FX_LINE`

const · L195–220

<!-- note:FX_LINE -->
<!-- /note -->

#### <a id="s-FX_LINE-reactor"></a>`FX_LINE.reactor(v)`

prop · L196–196

- calls: [`pctOf`](#s-pctOf)

<!-- note:FX_LINE.reactor -->
<!-- /note -->

#### <a id="s-FX_LINE-battery"></a>`FX_LINE.battery(v)`

prop · L197–197

<!-- note:FX_LINE.battery -->
<!-- /note -->

#### <a id="s-FX_LINE-shieldRegen"></a>`FX_LINE.shieldRegen(v)`

prop · L198–198

- calls: [`pctOf`](#s-pctOf)

<!-- note:FX_LINE.shieldRegen -->
<!-- /note -->

#### <a id="s-FX_LINE-minerRange"></a>`FX_LINE.minerRange(v)`

prop · L199–199

<!-- note:FX_LINE.minerRange -->
<!-- /note -->

#### <a id="s-FX_LINE-thrust"></a>`FX_LINE.thrust(v)`

prop · L200–200

- calls: [`pctOf`](#s-pctOf)

<!-- note:FX_LINE.thrust -->
<!-- /note -->

#### <a id="s-FX_LINE-missions"></a>`FX_LINE.missions()`

prop · L201–201

<!-- note:FX_LINE.missions -->
<!-- /note -->

#### <a id="s-FX_LINE-berths"></a>`FX_LINE.berths(v)`

prop · L202–202

<!-- note:FX_LINE.berths -->
<!-- /note -->

#### <a id="s-FX_LINE-robotDraw"></a>`FX_LINE.robotDraw(v)`

prop · L203–203

- calls: [`pctOf`](#s-pctOf)

<!-- note:FX_LINE.robotDraw -->
<!-- /note -->

#### <a id="s-FX_LINE-robotWear"></a>`FX_LINE.robotWear(v)`

prop · L204–204

- calls: [`pctOf`](#s-pctOf)

<!-- note:FX_LINE.robotWear -->
<!-- /note -->

#### <a id="s-FX_LINE-moralePerCycle"></a>`FX_LINE.moralePerCycle(v)`

prop · L205–205

<!-- note:FX_LINE.moralePerCycle -->
<!-- /note -->

#### <a id="s-FX_LINE-turretRange"></a>`FX_LINE.turretRange(v)`

prop · L206–206

<!-- note:FX_LINE.turretRange -->
<!-- /note -->

#### <a id="s-FX_LINE-robotSlots"></a>`FX_LINE.robotSlots(v)`

prop · L207–207

<!-- note:FX_LINE.robotSlots -->
<!-- /note -->

#### <a id="s-FX_LINE-repair"></a>`FX_LINE.repair(v)`

prop · L208–208

<!-- note:FX_LINE.repair -->
<!-- /note -->

#### <a id="s-FX_LINE-patchDrone"></a>`FX_LINE.patchDrone(v)`

prop · L209–209

<!-- note:FX_LINE.patchDrone -->
<!-- /note -->

#### <a id="s-FX_LINE-dropout"></a>`FX_LINE.dropout(v)`

prop · L210–210

- calls: [`pctOf`](#s-pctOf)

<!-- note:FX_LINE.dropout -->
<!-- /note -->

#### <a id="s-FX_LINE-assist"></a>`FX_LINE.assist(v)`

prop · L211–211

- calls: [`pctOf`](#s-pctOf)

<!-- note:FX_LINE.assist -->
<!-- /note -->

#### <a id="s-FX_LINE-resolve"></a>`FX_LINE.resolve(v)`

prop · L212–212

- calls: [`pctOf`](#s-pctOf)

<!-- note:FX_LINE.resolve -->
<!-- /note -->

#### <a id="s-FX_LINE-probeRange"></a>`FX_LINE.probeRange(v)`

prop · L213–213

- calls: [`pctOf`](#s-pctOf)

<!-- note:FX_LINE.probeRange -->
<!-- /note -->

#### <a id="s-FX_LINE-smelt"></a>`FX_LINE.smelt(v)`

prop · L214–214

- calls: [`pctOf`](#s-pctOf)

<!-- note:FX_LINE.smelt -->
<!-- /note -->

#### <a id="s-FX_LINE-crewWage"></a>`FX_LINE.crewWage(v)`

prop · L215–215

- calls: [`pctOf`](#s-pctOf)

<!-- note:FX_LINE.crewWage -->
<!-- /note -->

#### <a id="s-FX_LINE-social"></a>`FX_LINE.social(v)`

prop · L216–216

- calls: [`pctOf`](#s-pctOf)

<!-- note:FX_LINE.social -->
<!-- /note -->

#### <a id="s-FX_LINE-learn"></a>`FX_LINE.learn(v)`

prop · L217–217

- calls: [`pctOf`](#s-pctOf)

<!-- note:FX_LINE.learn -->
<!-- /note -->

#### <a id="s-FX_LINE-assay"></a>`FX_LINE.assay()`

prop · L218–218

<!-- note:FX_LINE.assay -->
<!-- /note -->

#### <a id="s-FX_LINE-medbay"></a>`FX_LINE.medbay()`

prop · L219–219

<!-- note:FX_LINE.medbay -->
<!-- /note -->

### <a id="s-pctOf"></a>`pctOf(v)`

function · L222–225

- called by: [`FX_LINE.assist`](#s-FX_LINE-assist) · [`FX_LINE.crewWage`](#s-FX_LINE-crewWage) · [`FX_LINE.dropout`](#s-FX_LINE-dropout) · [`FX_LINE.learn`](#s-FX_LINE-learn) · [`FX_LINE.probeRange`](#s-FX_LINE-probeRange) · [`FX_LINE.reactor`](#s-FX_LINE-reactor) · [`FX_LINE.resolve`](#s-FX_LINE-resolve) · [`FX_LINE.robotDraw`](#s-FX_LINE-robotDraw) · [`FX_LINE.robotWear`](#s-FX_LINE-robotWear) · [`FX_LINE.shieldRegen`](#s-FX_LINE-shieldRegen) · [`FX_LINE.smelt`](#s-FX_LINE-smelt) · [`FX_LINE.social`](#s-FX_LINE-social) · [`FX_LINE.thrust`](#s-FX_LINE-thrust) · [`effectOf`](#s-effectOf)

<!-- note:pctOf -->
<!-- /note -->

### <a id="s-effectOf"></a>`effectOf(u)`

function · **exported** · L227–232

- calls: [`pctOf`](#s-pctOf)
- called by: [`registerRefitOp`](../aria/pilot.js.md#s-registerRefitOp) _js/aria/pilot.js_ · [`upgradeLines`](#s-upgradeLines) · [`build`](../station/refityard.js.md#s-build) _js/station/refityard.js_ ×2

<!-- note:effectOf -->
"Mining yield +12% · cutter reach +150 u" for one upgrade.
<!-- /note -->

### <a id="s-upgradeLines"></a>`upgradeLines()`

function · **exported** · L234–236

- calls: [`effectOf`](#s-effectOf)
- called by: [`mountRefit`](../console/panels/market.js.md#s-mountRefit) _js/console/panels/market.js_ · [`mountTrim`](../console/panels/ship.js.md#s-mountTrim) _js/console/panels/ship.js_ · [`build`](../station/refityard.js.md#s-build) _js/station/refityard.js_

<!-- note:upgradeLines -->
→ [{ id, name, effect }] for every owned upgrade.
<!-- /note -->

### <a id="s-saveUpgrades"></a>`saveUpgrades()`

function · **exported** · L238–241

- calls: [`UPGRADES_KEY`](#s-UPGRADES_KEY)
- called by: [`buyUpgrade`](#s-buyUpgrade) · [`sellUpgrade`](#s-sellUpgrade)
- effects: storage.set `‹UPGRADES_KEY()›`

<!-- note:saveUpgrades -->
- L239 · `try { globalThis.localStorage?.setItem(UPGRADES_KEY(), JSON.stringify(upgrades.owned)); }` — quota, or no window
<!-- /note -->

### <a id="s-loadUpgrades"></a>`loadUpgrades()`

function · **exported** · L243–253

- calls: [`applyMods`](#s-applyMods) · [`byId`](#s-byId) · [`UPGRADES_KEY`](#s-UPGRADES_KEY)
- called by: [`launchSim`](../sim/sim.js.md#s-launchSim) _js/sim/sim.js_
- effects: storage.get `‹UPGRADES_KEY()›`

<!-- note:loadUpgrades -->
Restores this sky's fit and pushes its mods into the pilot. Called by launchSim after resetCrew().
<!-- /note -->
