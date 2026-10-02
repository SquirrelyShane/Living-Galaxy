# js/flight/ship.js

[index](../../../README.md) · 670 lines · 53 symbols · 5 imports · 44 importers

## About

<!-- note:@file -->
LIVING GALAXY — ship state, Newtonian flight model, and the power economy.

Flight is momentum-first: nothing slows you down but your own thrusters.
The nose points where you look; the hull swings to that heading with real
angular inertia. Everything you switch on competes for the same reactor.

- L8 · `export const MAIN_ACCEL = 88;` — u/s^2 at 100% throttle
- L9 · `export const REVERSE_ACCEL = 32;` — retro mains
- L10 · `export const RCS_ACCEL = 26;` — lateral / vertical / fine axial
- L11 · `export const BRAKE_ACCEL = 74;` — full retrograde burn
- L12 · `export const ANG_ACCEL = 8.2;` — rad/s^2 the attitude jets can deliver
- L13 · `export const ANG_MAX = 2.05;` — rad/s cap
- L17 · `export const THROTTLE_MAX = 1.4;` — past 1.0 is overdrive: the red zone
- L18 · `export const ASSIST_STOP = 9;` — assist only nulls the last few u/s of run
- L19 · `export const HOLD_SPEED = 20;` — below this, assist switches to holding station
- L21 · `export const REACTOR_OUTPUT = 130;` — units/s
<!-- /note -->

## Imports

| line | from | names | target |
|---|---|---|---|
| 1 | `../careers/effects.js` | `defaultMods` | [js/careers/effects.js](../careers/effects.js.md) |
| 2 | `../economy/materials.js` | `bulkOf` | [js/economy/materials.js](../economy/materials.js.md) |
| 4 | `../world/bodies.js` | `BODIES` | [js/world/bodies.js](../world/bodies.js.md) |
| 5 | `../world/events/holes.js` | `holeAccel`, `holes` | [js/world/events/holes.js](../world/events/holes.js.md) |
| 6 | `./defence.js` | `throughShield`, `throughArmour` | [js/flight/defence.js](defence.js.md) |

## Imported by

- [js/aria/company.js](../aria/company.js.md) — `holdRoom`
- [js/aria/pilot.js](../aria/pilot.js.md) — `cargoTotal`, `holdRoom`
- [js/aria/play.js](../aria/play.js.md) — `holdRoom`, `batteryCap`, `roomFor`, `cargoTotal`
- [js/aria/senses.js](../aria/senses.js.md) — `holdRoom`, `batteryCap`
- [js/console/panels/market.js](../console/panels/market.js.md) — `cargoTotal`
- [js/console/panels/nav.js](../console/panels/nav.js.md) — `TURRET_MODES`, `forwardOf`, `rightOf`, `upOf`
- [js/console/panels/nav.js](../console/panels/nav.js.md) — `shipFx`
- [js/console/panels/ship.js](../console/panels/ship.js.md) — `MINING_MODES`, `SHED_LABEL`, `TUNE_SPEC`, `TURRET_MODES`, `batteryCap`
- [js/crew/duties.js](../crew/duties.js.md) — `THROTTLE_RATED`
- [js/crew/ledger.js](../crew/ledger.js.md) — `shipFx`
- [js/drones/ops.js](../drones/ops.js.md) — `cargoTotal`
- [js/economy/contracts.js](../economy/contracts.js.md) — `takeCargo`, `addCargo`, `roomFor`
- [js/economy/icework.js](../economy/icework.js.md) — `addCargo`
- [js/economy/traderoutes.js](../economy/traderoutes.js.md) — `holdRoom`
- [js/economy/upgrades.js](../economy/upgrades.js.md) — `shipFx`
- [js/flight/autopilot.js](autopilot.js.md) — `*`
- [js/flight/autopilot.js](autopilot.js.md) — `BATTERY`, `DRAW`, `buildDemand`, `forwardOf`, `holdRoom`, `lifeDraw`
- [js/flight/contacts.js](contacts.js.md) — `forwardOf`
- [js/flight/contacts.js](contacts.js.md) — `shipFx`
- [js/flight/probes.js](probes.js.md) — `shipFx`
- [js/flight/turrets.js](turrets.js.md) — `DRAW`, `addCargo`, `applyDamage`, `holdRoom`
- [js/interior/boarding.js](../interior/boarding.js.md) — `applyDamage`
- [js/mission/run.js](../mission/run.js.md) — `*`
- [js/mission/run.js](../mission/run.js.md) — `holdRoom`, `BATTERY`
- [js/mission/script.js](../mission/script.js.md) — `*`
- [js/mission/tradeops.js](../mission/tradeops.js.md) — `holdRoom`, `roomFor`
- [js/npc/captain.js](../npc/captain.js.md) — `forwardOf`, `cargoTotal`, `batteryCap`
- [js/render/engine.js](../render/engine.js.md) — `batteryCap`, `forwardOf`, `rightOf`, `speedOf`, `upOf`
- [js/sim/salvage.js](../sim/salvage.js.md) — `addCargo`
- [js/sim/sim.js](../sim/sim.js.md) — `batteryCap`, `MINING_MODES`, `SHED_ORDER`, `THROTTLE_MAX`, `THROTTLE_MIN`, `TURRET_MODES`, `defaultTune`, `applyDamage`, `buildDemand`, `closingSpeed`, `absSpeedOf`, `addCargo`, `cargoTotal`, `forwardOf`, `holdRoom`, `takeCargo`, `gravityAt`, `makeShip`, `speedOf`, `stepAttitude`, `stepPower`, `stepTranslation`, `roomFor`
- [js/ui/holdview.js](../ui/holdview.js.md) — `holdRoom`, `cargoTotal`
- [js/ui/hud.js](../ui/hud.js.md) — `MINING_MODES`, `THROTTLE_MAX`, `THROTTLE_MIN`, `TURRET_MODES`, `cargoTotal`
- [js/ui/map.js](../ui/map.js.md) — `forwardOf`
- [js/ui/tutorial.js](../ui/tutorial.js.md) — `cargoTotal`, `speedOf`
- test/ariabiz.test.mjs _(outside js/)_ — `holdRoom`
- test/autopilot.test.mjs _(outside js/)_ — `BATTERY`, `cargoTotal`
- test/defence.test.mjs _(outside js/)_ — `makeShip`, `applyDamage`
- test/mission.test.mjs _(outside js/)_ — `BATTERY`
- test/nose.test.mjs _(outside js/)_ — `forwardOf`
- test/salvage.test.mjs _(outside js/)_ — `roomFor`
- test/spacing.test.mjs _(outside js/)_ — `gravityAt`
- test/stafflife.test.mjs _(outside js/)_ — `roomFor`, `addCargo`, `cargoTotal`, `holdRoom`
- test/trade.test.mjs _(outside js/)_ — `BATTERY`, `holdRoom`
- test/upgrades.test.mjs _(outside js/)_ — `BATTERY`, `batteryCap`, `buildDemand`

## Exports

- [`MAIN_ACCEL`](#s-MAIN_ACCEL) · const — used by [js/flight/autopilot.js](autopilot.js.md), [js/mission/run.js](../mission/run.js.md), [js/mission/script.js](../mission/script.js.md)
- [`REVERSE_ACCEL`](#s-REVERSE_ACCEL) · const — used by [js/flight/autopilot.js](autopilot.js.md), [js/mission/run.js](../mission/run.js.md), [js/mission/script.js](../mission/script.js.md)
- [`RCS_ACCEL`](#s-RCS_ACCEL) · const — used by [js/flight/autopilot.js](autopilot.js.md), [js/mission/run.js](../mission/run.js.md), [js/mission/script.js](../mission/script.js.md)
- [`BRAKE_ACCEL`](#s-BRAKE_ACCEL) · const — used by [js/flight/autopilot.js](autopilot.js.md), [js/mission/run.js](../mission/run.js.md), [js/mission/script.js](../mission/script.js.md)
- [`ANG_ACCEL`](#s-ANG_ACCEL) · const — used by [js/flight/autopilot.js](autopilot.js.md), [js/mission/run.js](../mission/run.js.md), [js/mission/script.js](../mission/script.js.md)
- [`ANG_MAX`](#s-ANG_MAX) · const — used by [js/flight/autopilot.js](autopilot.js.md), [js/mission/run.js](../mission/run.js.md), [js/mission/script.js](../mission/script.js.md)
- [`PITCH_LIMIT`](#s-PITCH_LIMIT) · const — used by [js/flight/autopilot.js](autopilot.js.md), [js/mission/run.js](../mission/run.js.md), [js/mission/script.js](../mission/script.js.md)
- [`THROTTLE_MIN`](#s-THROTTLE_MIN) · const — used by [js/flight/autopilot.js](autopilot.js.md), [js/mission/run.js](../mission/run.js.md), [js/mission/script.js](../mission/script.js.md), [js/sim/sim.js](../sim/sim.js.md), [js/ui/hud.js](../ui/hud.js.md)
- [`THROTTLE_RATED`](#s-THROTTLE_RATED) · const — used by [js/crew/duties.js](../crew/duties.js.md), [js/flight/autopilot.js](autopilot.js.md), [js/mission/run.js](../mission/run.js.md), [js/mission/script.js](../mission/script.js.md)
- [`THROTTLE_MAX`](#s-THROTTLE_MAX) · const — used by [js/flight/autopilot.js](autopilot.js.md), [js/mission/run.js](../mission/run.js.md), [js/mission/script.js](../mission/script.js.md), [js/sim/sim.js](../sim/sim.js.md), [js/ui/hud.js](../ui/hud.js.md)
- [`ASSIST_STOP`](#s-ASSIST_STOP) · const — used by [js/flight/autopilot.js](autopilot.js.md), [js/mission/run.js](../mission/run.js.md), [js/mission/script.js](../mission/script.js.md)
- [`HOLD_SPEED`](#s-HOLD_SPEED) · const — used by [js/flight/autopilot.js](autopilot.js.md), [js/mission/run.js](../mission/run.js.md), [js/mission/script.js](../mission/script.js.md)
- [`REACTOR_OUTPUT`](#s-REACTOR_OUTPUT) · const — used by [js/flight/autopilot.js](autopilot.js.md), [js/mission/run.js](../mission/run.js.md), [js/mission/script.js](../mission/script.js.md)
- [`BATTERY`](#s-BATTERY) · const — used by [js/flight/autopilot.js](autopilot.js.md), [js/mission/run.js](../mission/run.js.md), [js/mission/script.js](../mission/script.js.md), test/autopilot.test.mjs, test/mission.test.mjs, test/trade.test.mjs, test/upgrades.test.mjs
- [`shipFx`](#s-shipFx) · const — used by [js/console/panels/nav.js](../console/panels/nav.js.md), [js/crew/ledger.js](../crew/ledger.js.md), [js/economy/upgrades.js](../economy/upgrades.js.md), [js/flight/autopilot.js](autopilot.js.md), [js/flight/contacts.js](contacts.js.md), [js/flight/probes.js](probes.js.md), [js/mission/run.js](../mission/run.js.md), [js/mission/script.js](../mission/script.js.md)
- [`batteryCap`](#s-batteryCap) · function — used by [js/aria/play.js](../aria/play.js.md), [js/aria/senses.js](../aria/senses.js.md), [js/console/panels/ship.js](../console/panels/ship.js.md), [js/flight/autopilot.js](autopilot.js.md), [js/mission/run.js](../mission/run.js.md), [js/mission/script.js](../mission/script.js.md), [js/npc/captain.js](../npc/captain.js.md), [js/render/engine.js](../render/engine.js.md), [js/sim/sim.js](../sim/sim.js.md), test/upgrades.test.mjs
- [`DRAW`](#s-DRAW) · const — used by [js/flight/autopilot.js](autopilot.js.md), [js/flight/turrets.js](turrets.js.md), [js/mission/run.js](../mission/run.js.md), [js/mission/script.js](../mission/script.js.md)
- [`SHED_ORDER`](#s-SHED_ORDER) · const — used by [js/flight/autopilot.js](autopilot.js.md), [js/mission/run.js](../mission/run.js.md), [js/mission/script.js](../mission/script.js.md), [js/sim/sim.js](../sim/sim.js.md)
- [`SHED_LABEL`](#s-SHED_LABEL) · const — used by [js/console/panels/ship.js](../console/panels/ship.js.md), [js/flight/autopilot.js](autopilot.js.md), [js/mission/run.js](../mission/run.js.md), [js/mission/script.js](../mission/script.js.md)
- [`defaultTune`](#s-defaultTune) · function — used by [js/flight/autopilot.js](autopilot.js.md), [js/mission/run.js](../mission/run.js.md), [js/mission/script.js](../mission/script.js.md), [js/sim/sim.js](../sim/sim.js.md)
- [`TUNE_SPEC`](#s-TUNE_SPEC) · const — used by [js/console/panels/ship.js](../console/panels/ship.js.md), [js/flight/autopilot.js](autopilot.js.md), [js/mission/run.js](../mission/run.js.md), [js/mission/script.js](../mission/script.js.md)
- [`TURRET_MODES`](#s-TURRET_MODES) · const — used by [js/console/panels/nav.js](../console/panels/nav.js.md), [js/console/panels/ship.js](../console/panels/ship.js.md), [js/flight/autopilot.js](autopilot.js.md), [js/mission/run.js](../mission/run.js.md), [js/mission/script.js](../mission/script.js.md), [js/sim/sim.js](../sim/sim.js.md), [js/ui/hud.js](../ui/hud.js.md)
- [`MINING_MODES`](#s-MINING_MODES) · const — used by [js/console/panels/ship.js](../console/panels/ship.js.md), [js/flight/autopilot.js](autopilot.js.md), [js/mission/run.js](../mission/run.js.md), [js/mission/script.js](../mission/script.js.md), [js/sim/sim.js](../sim/sim.js.md), [js/ui/hud.js](../ui/hud.js.md)
- [`makeShip`](#s-makeShip) · function — used by [js/flight/autopilot.js](autopilot.js.md), [js/mission/run.js](../mission/run.js.md), [js/mission/script.js](../mission/script.js.md), [js/sim/sim.js](../sim/sim.js.md), test/defence.test.mjs
- [`forwardOf`](#s-forwardOf) · function — used by [js/console/panels/nav.js](../console/panels/nav.js.md), [js/flight/autopilot.js](autopilot.js.md), [js/flight/contacts.js](contacts.js.md), [js/mission/run.js](../mission/run.js.md), [js/mission/script.js](../mission/script.js.md), [js/npc/captain.js](../npc/captain.js.md), [js/render/engine.js](../render/engine.js.md), [js/sim/sim.js](../sim/sim.js.md), [js/ui/map.js](../ui/map.js.md), test/nose.test.mjs
- [`rightOf`](#s-rightOf) · function — used by [js/console/panels/nav.js](../console/panels/nav.js.md), [js/flight/autopilot.js](autopilot.js.md), [js/mission/run.js](../mission/run.js.md), [js/mission/script.js](../mission/script.js.md), [js/render/engine.js](../render/engine.js.md)
- [`upOf`](#s-upOf) · function — used by [js/console/panels/nav.js](../console/panels/nav.js.md), [js/flight/autopilot.js](autopilot.js.md), [js/mission/run.js](../mission/run.js.md), [js/mission/script.js](../mission/script.js.md), [js/render/engine.js](../render/engine.js.md)
- [`speedOf`](#s-speedOf) · function — used by [js/flight/autopilot.js](autopilot.js.md), [js/mission/run.js](../mission/run.js.md), [js/mission/script.js](../mission/script.js.md), [js/render/engine.js](../render/engine.js.md), [js/sim/sim.js](../sim/sim.js.md), [js/ui/tutorial.js](../ui/tutorial.js.md)
- [`absSpeedOf`](#s-absSpeedOf) · function — used by [js/flight/autopilot.js](autopilot.js.md), [js/mission/run.js](../mission/run.js.md), [js/mission/script.js](../mission/script.js.md), [js/sim/sim.js](../sim/sim.js.md)
- [`closingSpeed`](#s-closingSpeed) · function — used by [js/flight/autopilot.js](autopilot.js.md), [js/mission/run.js](../mission/run.js.md), [js/mission/script.js](../mission/script.js.md), [js/sim/sim.js](../sim/sim.js.md)
- [`gravityAt`](#s-gravityAt) · function — used by [js/flight/autopilot.js](autopilot.js.md), [js/mission/run.js](../mission/run.js.md), [js/mission/script.js](../mission/script.js.md), [js/sim/sim.js](../sim/sim.js.md), test/spacing.test.mjs
- [`buildDemand`](#s-buildDemand) · function — used by [js/flight/autopilot.js](autopilot.js.md), [js/mission/run.js](../mission/run.js.md), [js/mission/script.js](../mission/script.js.md), [js/sim/sim.js](../sim/sim.js.md), test/upgrades.test.mjs
- [`lifeDraw`](#s-lifeDraw) · function — used by [js/flight/autopilot.js](autopilot.js.md), [js/mission/run.js](../mission/run.js.md), [js/mission/script.js](../mission/script.js.md)
- [`BROWNOUT_RECOVER`](#s-BROWNOUT_RECOVER) · const — used by [js/flight/autopilot.js](autopilot.js.md), [js/mission/run.js](../mission/run.js.md), [js/mission/script.js](../mission/script.js.md)
- [`stepPower`](#s-stepPower) · function — used by [js/flight/autopilot.js](autopilot.js.md), [js/mission/run.js](../mission/run.js.md), [js/mission/script.js](../mission/script.js.md), [js/sim/sim.js](../sim/sim.js.md)
- [`stepAttitude`](#s-stepAttitude) · function — used by [js/flight/autopilot.js](autopilot.js.md), [js/mission/run.js](../mission/run.js.md), [js/mission/script.js](../mission/script.js.md), [js/sim/sim.js](../sim/sim.js.md)
- [`stepTranslation`](#s-stepTranslation) · function — used by [js/flight/autopilot.js](autopilot.js.md), [js/mission/run.js](../mission/run.js.md), [js/mission/script.js](../mission/script.js.md), [js/sim/sim.js](../sim/sim.js.md)
- [`applyDamage`](#s-applyDamage) · function — used by [js/flight/autopilot.js](autopilot.js.md), [js/flight/turrets.js](turrets.js.md), [js/interior/boarding.js](../interior/boarding.js.md), [js/mission/run.js](../mission/run.js.md), [js/mission/script.js](../mission/script.js.md), [js/sim/sim.js](../sim/sim.js.md), test/defence.test.mjs
- [`cargoTotal`](#s-cargoTotal) · function — used by [js/aria/pilot.js](../aria/pilot.js.md), [js/aria/play.js](../aria/play.js.md), [js/console/panels/market.js](../console/panels/market.js.md), [js/drones/ops.js](../drones/ops.js.md), [js/flight/autopilot.js](autopilot.js.md), [js/mission/run.js](../mission/run.js.md), [js/mission/script.js](../mission/script.js.md), [js/npc/captain.js](../npc/captain.js.md), [js/sim/sim.js](../sim/sim.js.md), [js/ui/holdview.js](../ui/holdview.js.md), [js/ui/hud.js](../ui/hud.js.md), [js/ui/tutorial.js](../ui/tutorial.js.md), test/autopilot.test.mjs, test/stafflife.test.mjs
- [`cargoCount`](#s-cargoCount) · function — used by [js/flight/autopilot.js](autopilot.js.md), [js/mission/run.js](../mission/run.js.md), [js/mission/script.js](../mission/script.js.md)
- [`holdRoom`](#s-holdRoom) · function — used by [js/aria/company.js](../aria/company.js.md), [js/aria/pilot.js](../aria/pilot.js.md), [js/aria/play.js](../aria/play.js.md), [js/aria/senses.js](../aria/senses.js.md), [js/economy/traderoutes.js](../economy/traderoutes.js.md), [js/flight/autopilot.js](autopilot.js.md), [js/flight/turrets.js](turrets.js.md), [js/mission/run.js](../mission/run.js.md), [js/mission/script.js](../mission/script.js.md), [js/mission/tradeops.js](../mission/tradeops.js.md), [js/sim/sim.js](../sim/sim.js.md), [js/ui/holdview.js](../ui/holdview.js.md), test/ariabiz.test.mjs, test/stafflife.test.mjs, test/trade.test.mjs
- [`roomFor`](#s-roomFor) · function — used by [js/aria/play.js](../aria/play.js.md), [js/economy/contracts.js](../economy/contracts.js.md), [js/flight/autopilot.js](autopilot.js.md), [js/mission/run.js](../mission/run.js.md), [js/mission/script.js](../mission/script.js.md), [js/mission/tradeops.js](../mission/tradeops.js.md), [js/sim/sim.js](../sim/sim.js.md), test/salvage.test.mjs, test/stafflife.test.mjs
- [`addCargo`](#s-addCargo) · function — used by [js/economy/contracts.js](../economy/contracts.js.md), [js/economy/icework.js](../economy/icework.js.md), [js/flight/autopilot.js](autopilot.js.md), [js/flight/turrets.js](turrets.js.md), [js/mission/run.js](../mission/run.js.md), [js/mission/script.js](../mission/script.js.md), [js/sim/salvage.js](../sim/salvage.js.md), [js/sim/sim.js](../sim/sim.js.md), test/stafflife.test.mjs
- [`takeCargo`](#s-takeCargo) · function — used by [js/economy/contracts.js](../economy/contracts.js.md), [js/flight/autopilot.js](autopilot.js.md), [js/mission/run.js](../mission/run.js.md), [js/mission/script.js](../mission/script.js.md), [js/sim/sim.js](../sim/sim.js.md)

## Effects

_none detected_

## Symbols

### <a id="s-MAIN_ACCEL"></a>`MAIN_ACCEL`

const · **exported** · L8–8

<!-- note:MAIN_ACCEL -->
---- authority ----------------------------------------------------------
<!-- /note -->

### <a id="s-REVERSE_ACCEL"></a>`REVERSE_ACCEL`

const · **exported** · L9–9

<!-- note:REVERSE_ACCEL -->
<!-- /note -->

### <a id="s-RCS_ACCEL"></a>`RCS_ACCEL`

const · **exported** · L10–10

<!-- note:RCS_ACCEL -->
<!-- /note -->

### <a id="s-BRAKE_ACCEL"></a>`BRAKE_ACCEL`

const · **exported** · L11–11

<!-- note:BRAKE_ACCEL -->
<!-- /note -->

### <a id="s-ANG_ACCEL"></a>`ANG_ACCEL`

const · **exported** · L12–12

<!-- note:ANG_ACCEL -->
<!-- /note -->

### <a id="s-ANG_MAX"></a>`ANG_MAX`

const · **exported** · L13–13

<!-- note:ANG_MAX -->
<!-- /note -->

### <a id="s-PITCH_LIMIT"></a>`PITCH_LIMIT`

const · **exported** · L14–14

<!-- note:PITCH_LIMIT -->
<!-- /note -->

### <a id="s-THROTTLE_MIN"></a>`THROTTLE_MIN`

const · **exported** · L15–15

<!-- note:THROTTLE_MIN -->
<!-- /note -->

### <a id="s-THROTTLE_RATED"></a>`THROTTLE_RATED`

const · **exported** · L16–16

<!-- note:THROTTLE_RATED -->
<!-- /note -->

### <a id="s-THROTTLE_MAX"></a>`THROTTLE_MAX`

const · **exported** · L17–17

<!-- note:THROTTLE_MAX -->
<!-- /note -->

### <a id="s-ASSIST_STOP"></a>`ASSIST_STOP`

const · **exported** · L18–18

<!-- note:ASSIST_STOP -->
<!-- /note -->

### <a id="s-HOLD_SPEED"></a>`HOLD_SPEED`

const · **exported** · L19–19

<!-- note:HOLD_SPEED -->
<!-- /note -->

### <a id="s-REACTOR_OUTPUT"></a>`REACTOR_OUTPUT`

const · **exported** · L21–21

<!-- note:REACTOR_OUTPUT -->
---- reactor ------------------------------------------------------------
<!-- /note -->

### <a id="s-BATTERY"></a>`BATTERY`

const · **exported** · L22–22

<!-- note:BATTERY -->
<!-- /note -->

### <a id="s-shipFx"></a>`shipFx`

const · **exported** · L24–24

<!-- note:shipFx -->
Refit upgrades (upgrades.js) reach the power model through this hook, so
ship.js stays a leaf: upgrades.js sets shipFx.fx = fx when it loads.
<!-- /note -->

#### <a id="s-shipFx-fx"></a>`shipFx.fx(key, dflt)`

prop · L24–24

<!-- note:shipFx.fx -->
<!-- /note -->

### <a id="s-batteryCap"></a>`batteryCap(ship)`

function · **exported** · L26–29

- called by: [`playReport`](../aria/play.js.md#s-playReport) _js/aria/play.js_ · [`senseHull`](../aria/senses.js.md#s-senseHull) _js/aria/senses.js_ · [`mountPower`](../console/panels/ship.js.md#s-mountPower) _js/console/panels/ship.js_ ×3 · [`telemetryBlock`](../console/panels/ship.js.md#s-telemetryBlock) _js/console/panels/ship.js_ · [`batteryCap`](autopilot.js.md#s-batteryCap) _js/flight/autopilot.js_ · [`stepPower`](#s-stepPower) ×2 · [`batteryCap`](../mission/run.js.md#s-batteryCap) _js/mission/run.js_ · [`batteryCap`](../mission/script.js.md#s-batteryCap) _js/mission/script.js_ · [`snapshot`](../npc/captain.js.md#s-snapshot) _js/npc/captain.js_ · [`mountGame>audioState`](../render/engine.js.md#s-mountGame-audioState) _js/render/engine.js_ · [`collectBeacon`](../sim/sim.js.md#s-collectBeacon) _js/sim/sim.js_ · [`publishHud`](../sim/sim.js.md#s-publishHud) _js/sim/sim.js_

<!-- note:batteryCap -->
The battery's true capacity: the base cells plus any bank bolted on at a yard.
<!-- /note -->

### <a id="s-DRAW"></a>`DRAW`

const · **exported** · L31–50

<!-- note:DRAW -->
- L33 · `thrustCurve: 96,` — * throttle^2
- L34 · `rcs: 22,` — * |rcs|
- L46 · `lights: 8,` — ops board
<!-- /note -->

### <a id="s-SHED_ORDER"></a>`SHED_ORDER`

const · **exported** · L52–52

<!-- note:SHED_ORDER -->
Default order things get cut in when the battery bottoms out. The pilot can
reorder this from the terminal — it is per-ship state, not a constant.
<!-- /note -->

### <a id="s-SHED_LABEL"></a>`SHED_LABEL`

const · **exported** · L54–62

<!-- note:SHED_LABEL -->
<!-- /note -->

### <a id="s-defaultTune"></a>`defaultTune()`

function · **exported** · L64–79

- called by: [`makeShip`](#s-makeShip) · [`resetTune`](../sim/sim.js.md#s-resetTune) _js/sim/sim.js_

<!-- note:defaultTune -->
Everything the pilot can trim by hand from the terminal.

- L66 · `panRate: 1.15,` — rad/s at full stick — look sensitivity
- L67 · `panSmooth: 0.12,` — s — low-pass on the stick, kills the flick
- L68 · `panExpo: 0.65,` — 0 linear .. 1 cubic — fine control near centre
- L69 · `rcsGain: 1,` — 0.4 .. 1.4 thruster authority trim
- L70 · `assistGain: 1,` — 0 .. 1.5 how hard flight assist trims drift
- L71 · `throttleCap: 1.4,` — hard limiter on the slider
- L72 · `reactorTrim: 1,` — 0.8 .. 1.25 output, strains the core above 1.0
- L73 · `turretRange: 1500,` — 400 .. 2200
- L74 · `turretRate: 1,` — 0.6 .. 1.5 cycle speed multiplier
- L75 · `retaliateFor: 22,` — CASTLE memory, seconds
- L76 · `minerRange: 1100,` — 500 .. 1600 (overdrive adds 800)
- L77 · `o2Target: 100,` — life support setpoint
<!-- /note -->

### <a id="s-TUNE_SPEC"></a>`TUNE_SPEC`

const · **exported** · L81–106

<!-- note:TUNE_SPEC -->
<!-- /note -->

### <a id="s-TURRET_MODES"></a>`TURRET_MODES`

const · **exported** · L108–116

<!-- note:TURRET_MODES -->
<!-- /note -->

### <a id="s-MINING_MODES"></a>`MINING_MODES`

const · **exported** · L118–122

<!-- note:MINING_MODES -->
<!-- /note -->

### <a id="s-makeShip"></a>`makeShip()`

function · **exported** · L124–198

- calls: [`defaultMods`](../careers/effects.js.md#s-defaultMods) _js/careers/effects.js_ · [`defaultTune`](#s-defaultTune)
- called by: [`launchSim`](../sim/sim.js.md#s-launchSim) _js/sim/sim.js_ · [`sim`](../sim/sim.js.md#s-sim) _js/sim/sim.js_

<!-- note:makeShip -->
- L128 · `aimYaw: 0,` — commanded view heading — panning drives this, the hull chases it
- L140 · `engines: true,` — systems
- L148 · `avoid: null,` — set by sim.js when the assist should dodge something
- L150 · `lights: false,` — ops board
- L159 · `charge: BATTERY,` — state
- L162 · `extraDraw: 0,` — robot crew on the bus (crew/robots.js writes it)
- L163 · `benchDraw: 0,` — the ice works bench, on the mining bus (icework.js writes it)
- L164 · `atmoDraw: 0,` — the atmosphere works, on the ops board (atmoworks.js writes it)
- L165 · `patchDraw: 0,` — the hull-patch drone, on the ops board (repair.js writes it)
- L167 · `draws: null,` — what each consumer carried last tick (stepPower writes it)
- L170 · `hullMax: 100,` — both set from the flown hull by syncHullDefence() in sim.js
- L174 · `hold: {},` — The hold is keyed by material id now — see materials.js
- L177 · `mods: defaultMods(),` — race × specialisation multipliers — see careers/effects.js for the contract
- L181 · `powered: {` — derived each tick
<!-- /note -->

### <a id="s-clamp"></a>`clamp(v, lo, hi)`

function · L200–202

- called by: [`gravityOfWorlds`](#s-gravityOfWorlds) · [`stepAttitude`](#s-stepAttitude) ×7 · [`stepPower`](#s-stepPower) ×5 · [`stepPower>derateMains`](#s-stepPower-derateMains)

<!-- note:clamp -->
<!-- /note -->

### <a id="s-forwardOf"></a>`forwardOf(yaw, pitch)`

function · **exported** · L204–207

- called by: [`mountMarks`](../console/panels/nav.js.md#s-mountMarks) _js/console/panels/nav.js_ · [`apSteer`](autopilot.js.md#s-apSteer) _js/flight/autopilot.js_ · [`beginUnstick`](autopilot.js.md#s-beginUnstick) _js/flight/autopilot.js_ · [`tickContacts`](contacts.js.md#s-tickContacts) _js/flight/contacts.js_ · [`closingSpeed`](#s-closingSpeed) · [`stepTranslation`](#s-stepTranslation) · [`upOf`](#s-upOf) · [`steerToward`](../npc/captain.js.md#s-steerToward) _js/npc/captain.js_ · [`mountGame>tick`](../render/engine.js.md#s-mountGame-tick) _js/render/engine.js_ ×4 · [`mountGame>updateMiningFX`](../render/engine.js.md#s-mountGame-updateMiningFX) _js/render/engine.js_ · [`orientCraft`](../render/engine.js.md#s-orientCraft) _js/render/engine.js_ · [`alignmentTo`](../sim/sim.js.md#s-alignmentTo) _js/sim/sim.js_ · [`bodyUnderReticle`](../sim/sim.js.md#s-bodyUnderReticle) _js/sim/sim.js_ · [`getForward`](../sim/sim.js.md#s-getForward) _js/sim/sim.js_ · [`stepLock`](../sim/sim.js.md#s-stepLock) _js/sim/sim.js_ · [`togglePointerLock`](../sim/sim.js.md#s-togglePointerLock) _js/sim/sim.js_ · [`tryAssay`](../sim/sim.js.md#s-tryAssay) _js/sim/sim.js_ · [`mountMap`](../ui/map.js.md#s-mountMap) _js/ui/map.js_ ×2

<!-- note:forwardOf -->
<!-- /note -->

### <a id="s-rightOf"></a>`rightOf(yaw)`

function · **exported** · L209–211

- called by: [`mountMarks`](../console/panels/nav.js.md#s-mountMarks) _js/console/panels/nav.js_ · [`stepTranslation`](#s-stepTranslation) · [`upOf`](#s-upOf) · [`mountGame>tick`](../render/engine.js.md#s-mountGame-tick) _js/render/engine.js_ · [`mountGame>updateMiningFX`](../render/engine.js.md#s-mountGame-updateMiningFX) _js/render/engine.js_

<!-- note:rightOf -->
<!-- /note -->

### <a id="s-upOf"></a>`upOf(yaw, pitch)`

function · **exported** · L213–221

- calls: [`forwardOf`](#s-forwardOf) · [`rightOf`](#s-rightOf)
- called by: [`mountMarks`](../console/panels/nav.js.md#s-mountMarks) _js/console/panels/nav.js_ · [`stepTranslation`](#s-stepTranslation) · [`mountGame>tick`](../render/engine.js.md#s-mountGame-tick) _js/render/engine.js_ ×2 · [`mountGame>updateMiningFX`](../render/engine.js.md#s-mountGame-updateMiningFX) _js/render/engine.js_

<!-- note:upOf -->
<!-- /note -->

### <a id="s-ZERO"></a>`ZERO`

const · L223–223

<!-- note:ZERO -->
<!-- /note -->

### <a id="s-speedOf"></a>`speedOf(ship, frame)`

function · **exported** · L225–228

- called by: [`mountGame>audioState`](../render/engine.js.md#s-mountGame-audioState) _js/render/engine.js_ · [`mountGame>tick`](../render/engine.js.md#s-mountGame-tick) _js/render/engine.js_ · [`broadcastShip`](../sim/sim.js.md#s-broadcastShip) _js/sim/sim.js_ · [`publishHud`](../sim/sim.js.md#s-publishHud) _js/sim/sim.js_ · [`sampleTelemetry`](../sim/sim.js.md#s-sampleTelemetry) _js/sim/sim.js_ · [`stepCollisions`](../sim/sim.js.md#s-stepCollisions) _js/sim/sim.js_ · [`tickSim`](../sim/sim.js.md#s-tickSim) _js/sim/sim.js_ · [`wireControlsTest.getSpeed`](../sim/sim.js.md#s-wireControlsTest-getSpeed) _js/sim/sim.js_ · [`buildCtx`](../ui/tutorial.js.md#s-buildCtx) _js/ui/tutorial.js_

<!-- note:speedOf -->
Speed relative to the local frame — the world whose well you are in, which
is itself sweeping around its star at tens of units a second. This is the
number a pilot actually cares about.
<!-- /note -->

### <a id="s-absSpeedOf"></a>`absSpeedOf(ship)`

function · **exported** · L230–232

- called by: [`publishHud`](../sim/sim.js.md#s-publishHud) _js/sim/sim.js_

<!-- note:absSpeedOf -->
<!-- /note -->

### <a id="s-closingSpeed"></a>`closingSpeed(ship, frame)`

function · **exported** · L234–238

- calls: [`forwardOf`](#s-forwardOf)
- called by: [`publishHud`](../sim/sim.js.md#s-publishHud) _js/sim/sim.js_

<!-- note:closingSpeed -->
Component of relative velocity along the nose. Negative = flying backwards.
<!-- /note -->

### <a id="s-_bp"></a>`_bp`

const · L240–240

<!-- note:_bp -->
---- gravity ------------------------------------------------------------
<!-- /note -->

### <a id="s-accelToward"></a>`accelToward(b, pos, time, bodyPosition, out, scale)`

function · L242–255

- called by: [`gravityOfWorlds`](#s-gravityOfWorlds) ×3

<!-- note:accelToward -->
<!-- /note -->

### <a id="s-gravityAt"></a>`gravityAt(pos, time, bodyPosition, out)`

function · **exported** · L257–261

- calls: [`gravityOfWorlds`](#s-gravityOfWorlds) · [`holeAccel`](../world/events/holes.js.md#s-holeAccel) _js/world/events/holes.js_
- called by: [`shiftClock`](../sim/sim.js.md#s-shiftClock) _js/sim/sim.js_ · [`stepShip`](../sim/sim.js.md#s-stepShip) _js/sim/sim.js_

<!-- note:gravityAt -->
Patched-conic gravity: you are always inside exactly one well — the deepest
sphere of influence containing you. Crossing a boundary cross-fades to the
parent so nothing snaps. Bigger world, bigger sphere, harder pull.

- L259 · `if (holes.length) holeAccel(pos, out);` — a black hole falling through (js/world/events/holes.js) pulls on top of whatever well
  you are in — it is not a sphere of influence, it is a passing mass
<!-- /note -->

### <a id="s-gravityOfWorlds"></a>`gravityOfWorlds(pos, time, bodyPosition, out)`

function · L263–299

- calls: [`accelToward`](#s-accelToward) ×3 · [`clamp`](#s-clamp)
- via [js/world/bodies.js](../world/bodies.js.md): `BODIES.find`
- called by: [`gravityAt`](#s-gravityAt)

<!-- note:gravityOfWorlds -->
- L292 · `const t = clamp((primary.soi - primaryDist) / (primary.soi * 0.25), 0, 1);` — Hand over across the outer quarter of the sphere.
<!-- /note -->

### <a id="s-pushDebuff"></a>`pushDebuff(list, tag, text)`

function · L301–303

- called by: [`stepPower`](#s-stepPower) ×10 · [`stepPower>derateMains`](#s-stepPower-derateMains)

<!-- note:pushDebuff -->
---- reactor tick -------------------------------------------------------
<!-- /note -->

### <a id="s-buildDemand"></a>`buildDemand(ship, rcsMag, brakeOn, warpDraw=)`

function · **exported** · L305–328

- called by: [`busIdle`](autopilot.js.md#s-busIdle) _js/flight/autopilot.js_ · [`stepShip`](../sim/sim.js.md#s-stepShip) _js/sim/sim.js_

<!-- note:buildDemand -->
Everything the reactor is being asked for this tick.

- L309 · `const rated = ship.engines` — What the mains would draw if overdrive were cut back to rated.
- L312 · `const ops =` — the atmosphere works seeds off the ops board (js/world/events/atmoworks.js writes atmoDraw)
- L314 · `const cutter = ship.miningMode === "overdrive" ? DRAW.miningOverdrive : ship.miningMode ==` — The mining bus carries the cutter AND the ice works bench. 0.3 billed the
  cutter's 24 kW whenever the bench was on, even with the laser stowed, and
  the bench's own 16 kW came straight off the battery where nothing could
  see it or shed it. Each is billed for what it is actually doing now.
<!-- /note -->

### <a id="s-lifeDraw"></a>`lifeDraw(ship, powered=)`

function · **exported** · L330–335

- called by: [`busIdle`](autopilot.js.md#s-busIdle) _js/flight/autopilot.js_ · [`stepPower`](#s-stepPower) ×3 · [`stepPower>sumLoad`](#s-stepPower-sumLoad)

<!-- note:lifeDraw -->
Life support's draw, in one place — the bus, the shed and the ledger all read this.
<!-- /note -->

### <a id="s-BROWNOUT_RECOVER"></a>`BROWNOUT_RECOVER`

const · **exported** · L337–337

<!-- note:BROWNOUT_RECOVER -->
A brownout latches until the battery holds this fraction of its capacity, so
the bus sheds once and recovers, instead of re-deciding every frame and
strobing shields and cutter on and off at 60 Hz with the battery pinned at 0.
<!-- /note -->

### <a id="s-stepPower"></a>`stepPower(ship, dt, demand)`

function · **exported** · L339–475

- calls: [`batteryCap`](#s-batteryCap) ×2 · [`clamp`](#s-clamp) ×5 · [`lifeDraw`](#s-lifeDraw) ×3 · [`pushDebuff`](#s-pushDebuff) ×10 · [`stepPower>derateMains`](#s-stepPower-derateMains) ×2 · [`stepPower>sumLoad`](#s-stepPower-sumLoad) ×2
- called by: [`stepShip`](../sim/sim.js.md#s-stepShip) _js/sim/sim.js_

<!-- note:stepPower -->
Works out what the reactor can actually carry, sheds the rest in priority
order, and writes the resulting debuffs onto the ship.

- L366 · `ship.brownout = false;` — The battery absorbs overdraw until it is flat. Once it is, the bus can
  only carry what the reactor makes, so load gets shed until it fits.
- L367 · `const hullThrust = (ship.hullTune?.thrust ?? 1) * shipFx.fx("thrust", 1);` — the hull itself: a trainer skiff answers the stick, a colossus does not.
  Kept apart from the derate — 0.3 overwrote this with the derate and then
  billed the engines at hull-thrust × draw, so a 1.2× hull on a flat battery
  read 131 kW against a 110 kW core and made power from nothing.
- L378 · `let over = load - ship.reactor * 0.92;` — shed to a little UNDER the core, or a latched bus never refills
- L422 · `load = sumLoad(demand.engines * derate);` — Recompute what the bus is actually carrying now — the same sums as above.
- L424 · `ship.draws = {` — what each consumer is actually drawing this tick, for the ledger and the autopilot
- L440 · `if (tune.reactorTrim > 1.001) {` — Core strain: pushing the reactor past rated slowly bakes the hull.
- L450 · `if (ship.pressurized && p.lifeSupport) {` — Cabin atmosphere
- L456 · `ship.rcsScale *= 0.84;` — Crew in hardsuits: clumsier hands, tougher hull.
- L464 · `if (!p.gravity) ship.rcsScale *= 1.08;` — Nothing to brace against with the deck plates cold.
- L466 · `const shMax = ship.shieldMax ?? 100;` — 0.3.34: a screen recharges to ITS OWN capacity. This was a hard 100 for
  every hull in the game, which is the same bug as hullMax never being set —
  a capital plant held exactly the same screen as a trainer's. Regen scales
  with the pool too, so a bigger screen is not also a slower one.
<!-- /note -->

#### <a id="s-stepPower-sumLoad"></a>`stepPower>sumLoad(engines)`

function · L355–363

- calls: [`lifeDraw`](#s-lifeDraw)
- called by: [`stepPower`](#s-stepPower) ×2

<!-- note:stepPower>sumLoad -->
<!-- /note -->

#### <a id="s-stepPower-derateMains"></a>`stepPower>derateMains()`

function · L379–384

- calls: [`clamp`](#s-clamp) · [`pushDebuff`](#s-pushDebuff)
- called by: [`stepPower`](#s-stepPower) ×2

<!-- note:stepPower>derateMains -->
- L381 · `derate = clamp((demand.engines - over) / demand.engines, 0.12, 1);` — Mains eat the shortfall before anyone stops breathing.
<!-- /note -->

### <a id="s-stepAttitude"></a>`stepAttitude(ship, dt)`

function · **exported** · L477–495

- calls: [`clamp`](#s-clamp) ×7
- called by: [`stepShip`](../sim/sim.js.md#s-stepShip) _js/sim/sim.js_

<!-- note:stepAttitude -->
---- flight -------------------------------------------------------------

- L478 · `const g = ship.tune.rcsGain;` — Attitude jets drive the hull toward the heading you are looking at:
  snappy on small errors, weighty on a hard flick.
- L494 · `ship.roll += (clamp(ship.yawVel * 0.34, -0.5, 0.5) - ship.roll) * (1 - Math.exp(-5 * dt));` — Bank into the turn: yawVel is negative when the nose swings to
  starboard, and the hull should drop its starboard wing to match.
<!-- /note -->

### <a id="s-stepTranslation"></a>`stepTranslation(ship, dt, rcs, brakeOn, frame, hold)`

function · **exported** · L497–614

- calls: [`forwardOf`](#s-forwardOf) · [`rightOf`](#s-rightOf) · [`upOf`](#s-upOf)
- called by: [`stepShip`](../sim/sim.js.md#s-stepShip) _js/sim/sim.js_

<!-- note:stepTranslation -->
Newtonian translation. `rcs` is body-relative: x = right, y = up,
z = fine axial. Nothing damps you but the assist and the brake.

- L522 · `const rvx = ship.vel.x - fr.x;` — Everything below works on velocity relative to the local frame, so
  "stop" means station-keeping with the world you are at, not freezing in
  a heliocentric frame the world is already leaving behind.
- L529 · `const k = Math.min(BRAKE_ACCEL, sp / Math.max(dt, 1e-4));` — Full retrograde burn — the only thing that stops you fast.
- L535 · `if (ship.avoid && live && ship.tune.assistGain > 0.01) {` — Collision avoidance, ahead of the drift trim and independent of it: this
  one fires whether or not your hands are on the controls, because the
  whole failure it fixes is a hull flying into something at speed. sim.js
  hands it down as a plain vector on the ship — the flight model does not
  know what a station is.
- L543 · `const k = Math.min(BRAKE_ACCEL * 0.8 * g, sp / Math.max(dt, 1e-4));` — Out of room to turn. Shed speed as well — a slower hull needs less
  space to miss by.
- L552 · `if (hold && sp < (ship.holding ? HOLD_SPEED * 1.8 : HOLD_SPEED)) {` — Hysteresis: once it has you it keeps you, so the mode does not chatter
  right on the threshold.
- L553 · `ship.holding = true;` — Station keeping. Everything out here is moving — the world you are
  beside is sweeping around its star and curving as it goes. Holding a
  velocity is not holding a position, so once you are nearly stopped the
  assist switches to flying the anchor point itself. That is what makes
  "stopped" mean stopped relative to what is around you.
- L578 · `ship.holding = false;` — Still travelling: trim the drift you did not ask for, but leave the
  run down the nose alone — momentum is yours to spend.
<!-- /note -->

### <a id="s-applyDamage"></a>`applyDamage(ship, amount, from, time, kind=)`

function · **exported** · L616–634

- calls: [`throughArmour`](defence.js.md#s-throughArmour) _js/flight/defence.js_ · [`throughShield`](defence.js.md#s-throughShield) _js/flight/defence.js_
- called by: [`stepShots`](turrets.js.md#s-stepShots) _js/flight/turrets.js_ · [`tickBoarding`](../interior/boarding.js.md#s-tickBoarding) _js/interior/boarding.js_ · [`holeOnShip`](../sim/sim.js.md#s-holeOnShip) _js/sim/sim.js_ ×3 · [`impact`](../sim/sim.js.md#s-impact) _js/sim/sim.js_ · [`onImpact`](../sim/sim.js.md#s-onImpact) _js/sim/sim.js_ · [`onShipHit`](../sim/sim.js.md#s-onShipHit) _js/sim/sim.js_ · [`stepCollisions`](../sim/sim.js.md#s-stepCollisions) _js/sim/sim.js_ ×3 · [`warpDropout`](../sim/sim.js.md#s-warpDropout) _js/sim/sim.js_

<!-- note:applyDamage -->
---- damage -------------------------------------------------------------

Take a hit.

`kind` is one of js/flight/defence.js's KINDS — kinetic, thermal or em — and it
decides what the screen and the plate each make of it. It defaults to
kinetic, which is what a round is, so a caller that does not care keeps the
old behaviour.

Order matters: the screen resists first and spends itself, and only what
comes through is offered to the armour. A shield shrugs off energy and is
poor against mass; plate is the reverse. That asymmetry is the whole point
— it is why a drone swarm goes through a screen that laughs at a laser, and
why the answer to a heavily plated hull is EM.

- L627 · `ship.hull = Math.max(0, ship.hull - (left * (ship.pressurized ? 1 : 0.88)) / (ship.mods?.h` — A vented hull has nothing to blow out.
- L629 · `if (from) {` — only a contact opens the CASTLE window — scraping a surface must not extend it
<!-- /note -->

### <a id="s-cargoTotal"></a>`cargoTotal(ship)`

function · **exported** · L636–640

- calls: [`bulkOf`](../economy/materials.js.md#s-bulkOf) _js/economy/materials.js_
- called by: [`planJob`](../aria/pilot.js.md#s-planJob) _js/aria/pilot.js_ · [`holdUsed`](../aria/play.js.md#s-holdUsed) _js/aria/play.js_ · [`mountHold`](../console/panels/market.js.md#s-mountHold) _js/console/panels/market.js_ · [`mountRoutes`](../console/panels/market.js.md#s-mountRoutes) _js/console/panels/market.js_ ×2 · [`holdFrac`](../drones/ops.js.md#s-holdFrac) _js/drones/ops.js_ · [`holdRoom`](#s-holdRoom) · [`snapshot`](../mission/script.js.md#s-snapshot) _js/mission/script.js_ · [`snapshot`](../npc/captain.js.md#s-snapshot) _js/npc/captain.js_ · [`tickCaptain`](../npc/captain.js.md#s-tickCaptain) _js/npc/captain.js_ ×2 · [`holeRescue`](../sim/sim.js.md#s-holeRescue) _js/sim/sim.js_ · [`loseHull`](../sim/sim.js.md#s-loseHull) _js/sim/sim.js_ · [`publishHud`](../sim/sim.js.md#s-publishHud) _js/sim/sim.js_ · [`sampleTelemetry`](../sim/sim.js.md#s-sampleTelemetry) _js/sim/sim.js_ · [`stepSalvage`](../sim/sim.js.md#s-stepSalvage) _js/sim/sim.js_ · [`holdSlots`](../ui/holdview.js.md#s-holdSlots) _js/ui/holdview.js_ · [`sampleWorld`](../ui/hud.js.md#s-sampleWorld) _js/ui/hud.js_ · [`buildCtx`](../ui/tutorial.js.md#s-buildCtx) _js/ui/tutorial.js_

<!-- note:cargoTotal -->
Hold units in use (0.3.52: each good by its bulk — materials.js bulkOf).
<!-- /note -->

### <a id="s-cargoCount"></a>`cargoCount(ship)`

function · **exported** · L642–646

<!-- note:cargoCount -->
How many ITEMS are aboard, whatever they take up.
<!-- /note -->

### <a id="s-holdRoom"></a>`holdRoom(ship)`

function · **exported** · L648–650

- calls: [`cargoTotal`](#s-cargoTotal)
- called by: [`workingCapital`](../aria/company.js.md#s-workingCapital) _js/aria/company.js_ · [`planJob`](../aria/pilot.js.md#s-planJob) _js/aria/pilot.js_ · [`movesNow`](../aria/play.js.md#s-movesNow) _js/aria/play.js_ · [`startSupply`](../aria/play.js.md#s-startSupply) _js/aria/play.js_ · [`senseHull`](../aria/senses.js.md#s-senseHull) _js/aria/senses.js_ · [`unpostedWork`](../aria/senses.js.md#s-unpostedWork) _js/aria/senses.js_ · [`tradeRoutes`](../economy/traderoutes.js.md#s-tradeRoutes) _js/economy/traderoutes.js_ · [`apMine`](autopilot.js.md#s-apMine) _js/flight/autopilot.js_ ×2 · [`roomFor`](#s-roomFor) · [`stepMining`](turrets.js.md#s-stepMining) _js/flight/turrets.js_ · [`EXEC.MINE`](../mission/run.js.md#s-EXEC-MINE) _js/mission/run.js_ · [`makeTradeOps.BUY`](../mission/tradeops.js.md#s-makeTradeOps-BUY) _js/mission/tradeops.js_ ×2 · [`makeTradeOps>pickRoute`](../mission/tradeops.js.md#s-makeTradeOps-pickRoute) _js/mission/tradeops.js_ · [`stashWithdraw`](../sim/sim.js.md#s-stashWithdraw) _js/sim/sim.js_ · [`holdSlots`](../ui/holdview.js.md#s-holdSlots) _js/ui/holdview.js_

<!-- note:holdRoom -->
Hold units still free.
<!-- /note -->

### <a id="s-roomFor"></a>`roomFor(ship, id)`

function · **exported** · L652–654

- calls: [`bulkOf`](../economy/materials.js.md#s-bulkOf) _js/economy/materials.js_ · [`holdRoom`](#s-holdRoom)
- called by: [`canFly`](../aria/play.js.md#s-canFly) _js/aria/play.js_ · [`acceptBlocker`](../economy/contracts.js.md#s-acceptBlocker) _js/economy/contracts.js_ · [`addCargo`](#s-addCargo) · [`makeTradeOps.BUY`](../mission/tradeops.js.md#s-makeTradeOps-BUY) _js/mission/tradeops.js_ ×2 · [`tradeBuy`](../sim/sim.js.md#s-tradeBuy) _js/sim/sim.js_ ×2

<!-- note:roomFor -->
How many units of `id` still fit. Use this, not holdRoom, to size a buy or a job.
<!-- /note -->

### <a id="s-addCargo"></a>`addCargo(ship, id, qty)`

function · **exported** · L656–661

- calls: [`roomFor`](#s-roomFor)
- called by: [`tickContracts`](../economy/contracts.js.md#s-tickContracts) _js/economy/contracts.js_ · [`stepIcework`](../economy/icework.js.md#s-stepIcework) _js/economy/icework.js_ · [`stepDrones`](turrets.js.md#s-stepDrones) _js/flight/turrets.js_ ×2 · [`stepMining`](turrets.js.md#s-stepMining) _js/flight/turrets.js_ ×2 · [`recoverSite`](../sim/salvage.js.md#s-recoverSite) _js/sim/salvage.js_ · [`smeltAll`](../sim/sim.js.md#s-smeltAll) _js/sim/sim.js_ · [`stashWithdraw`](../sim/sim.js.md#s-stashWithdraw) _js/sim/sim.js_ · [`stepSalvage`](../sim/sim.js.md#s-stepSalvage) _js/sim/sim.js_ · [`tradeBuy`](../sim/sim.js.md#s-tradeBuy) _js/sim/sim.js_ · [`tryScan`](../sim/sim.js.md#s-tryScan) _js/sim/sim.js_

<!-- note:addCargo -->
Adds what will fit and returns how much actually went in.
<!-- /note -->

### <a id="s-takeCargo"></a>`takeCargo(ship, id, qty)`

function · **exported** · L663–670

- called by: [`abandonContract`](../economy/contracts.js.md#s-abandonContract) _js/economy/contracts.js_ · [`deliverContracts`](../economy/contracts.js.md#s-deliverContracts) _js/economy/contracts.js_ · [`tickContracts`](../economy/contracts.js.md#s-tickContracts) _js/economy/contracts.js_ · [`consume`](../sim/sim.js.md#s-consume) _js/sim/sim.js_ · [`jettison`](../sim/sim.js.md#s-jettison) _js/sim/sim.js_ · [`smeltAll`](../sim/sim.js.md#s-smeltAll) _js/sim/sim.js_ · [`stashDeposit`](../sim/sim.js.md#s-stashDeposit) _js/sim/sim.js_ · [`tradeSell`](../sim/sim.js.md#s-tradeSell) _js/sim/sim.js_

<!-- note:takeCargo -->
<!-- /note -->
