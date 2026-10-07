# js/aria/wake.js

[index](../../../README.md) · 110 lines · 16 symbols · 10 imports · 4 importers

## About

<!-- note:@file -->
<!-- /note -->

## Imports

| line | from | names | target |
|---|---|---|---|
| 1 | `../sim/sim.js` | `sim`, `sellPriceAt` | [js/sim/sim.js](../sim/sim.js.md) |
| 2 | `../station/stations.js` | `stationById` | [js/station/stations.js](../station/stations.js.md) |
| 3 | `../economy/economy.js` | `stockOf`, `stockMultAt`, `targetFor`, `LINES`, `GLUT_FRAC`, `SHORT_FRAC` | [js/economy/economy.js](../economy/economy.js.md) |
| 4 | `../economy/materials.js` | `goodName`, `baseValue` | [js/economy/materials.js](../economy/materials.js.md) |
| 5 | `../corp/corps.js` | `corpOfStation` | [js/corp/corps.js](../corp/corps.js.md) |
| 6 | `../economy/traderoutes.js` | `sellable` | [js/economy/traderoutes.js](../economy/traderoutes.js.md) |
| 7 | `./mind.js` | `ariaMind`, `verbOf` | [js/aria/mind.js](mind.js.md) |
| 8 | `./foresee.js` | `counterfactual`, `sellValue` | [js/aria/foresee.js](foresee.js.md) |
| 9 | `./footprint.js` | `footprint`, `noteTrade`, `noteWork`, `audit`, `footprintIn`, `footprintOut`, `resetFootprint` | [js/aria/footprint.js](footprint.js.md) |
| 10 | `./belief.js` | `anchor` | [js/aria/belief.js](belief.js.md) |

## Imported by

- [js/aria/aria.js](aria.js.md) — `wakeSave`, `wakeLoad`, `wakeReset`
- [js/aria/pilot.js](pilot.js.md) — `wakeArm`, `sellValueAt`, `wakeJobOpen`, `wakeJobClose`, `wakeAudit`
- [js/aria/play.js](play.js.md) — `wakeArm`, `sellValueAt`, `wakeJobOpen`, `wakeJobClose`, `wakeAudit`, `wakeReset`
- [js/mission/tradeops.js](../mission/tradeops.js.md) — `wakeOpen`, `wakeClose`

## Exports

- [`WAKE`](#s-WAKE) · const — **no importer in scanned roots**
- [`wakeArm`](#s-wakeArm) · function — used by [js/aria/pilot.js](pilot.js.md), [js/aria/play.js](play.js.md)
- [`ariaFlying`](#s-ariaFlying) · function — **no importer in scanned roots**
- [`sellValueAt`](#s-sellValueAt) · function — used by [js/aria/pilot.js](pilot.js.md), [js/aria/play.js](play.js.md)
- [`wakeOpen`](#s-wakeOpen) · function — used by [js/mission/tradeops.js](../mission/tradeops.js.md)
- [`wakeClose`](#s-wakeClose) · function — used by [js/mission/tradeops.js](../mission/tradeops.js.md)
- [`wakeJobOpen`](#s-wakeJobOpen) · function — used by [js/aria/pilot.js](pilot.js.md), [js/aria/play.js](play.js.md)
- [`wakeJobClose`](#s-wakeJobClose) · function — used by [js/aria/pilot.js](pilot.js.md), [js/aria/play.js](play.js.md)
- [`wakeAudit`](#s-wakeAudit) · function — used by [js/aria/pilot.js](pilot.js.md), [js/aria/play.js](play.js.md)
- [`wakeSave`](#s-wakeSave) · function — used by [js/aria/aria.js](aria.js.md)
- [`wakeLoad`](#s-wakeLoad) · function — used by [js/aria/aria.js](aria.js.md)
- [`wakeReset`](#s-wakeReset) · function — used by [js/aria/aria.js](aria.js.md), [js/aria/play.js](play.js.md)

## Effects

_none detected_

## Symbols

### <a id="s-WAKE"></a>`WAKE`

const · **exported** · L12–12

<!-- note:WAKE -->
<!-- /note -->

### <a id="s-armed"></a>`armed`

const · L14–14

<!-- note:armed -->
<!-- /note -->

### <a id="s-auditAt"></a>`auditAt`

const · L15–15

<!-- note:auditAt -->
<!-- /note -->

### <a id="s-wakeArm"></a>`wakeArm(name, fn)`

function · **exported** · L17–17

- called by: [`wireAriaPilot`](pilot.js.md#s-wireAriaPilot) _js/aria/pilot.js_ · [`beginPlay`](play.js.md#s-beginPlay) _js/aria/play.js_

<!-- note:wakeArm -->
<!-- /note -->

### <a id="s-ariaFlying"></a>`ariaFlying()`

function · **exported** · L18–21

- called by: [`sellValueAt`](#s-sellValueAt)

<!-- note:ariaFlying -->
<!-- /note -->

### <a id="s-sellValueAt"></a>`sellValueAt(st, ship=)`

function · **exported** · L23–26

- calls: [`sellValue`](foresee.js.md#s-sellValue) _js/aria/foresee.js_ · [`ariaFlying`](#s-ariaFlying) · [`sellable`](../economy/traderoutes.js.md#s-sellable) _js/economy/traderoutes.js_

<!-- note:sellValueAt -->
<!-- /note -->

### <a id="s-feeds"></a>`feeds(st, id)`

function · L28–28

- called by: [`wakeClose`](#s-wakeClose) ×2

<!-- note:feeds -->
<!-- /note -->

### <a id="s-stalledOn"></a>`stalledOn(st, id)`

function · L29–29

- called by: [`wakeOpen`](#s-wakeOpen)

<!-- note:stalledOn -->
<!-- /note -->

### <a id="s-wakeOpen"></a>`wakeOpen(st)`

function · **exported** · L31–39

- calls: [`stalledOn`](#s-stalledOn) · [`corpOfStation`](../corp/corps.js.md#s-corpOfStation) _js/corp/corps.js_
- called by: [`makeTradeOps.BUY`](../mission/tradeops.js.md#s-makeTradeOps-BUY) _js/mission/tradeops.js_ · [`makeTradeOps.SELL`](../mission/tradeops.js.md#s-makeTradeOps-SELL) _js/mission/tradeops.js_

<!-- note:wakeOpen -->
<!-- /note -->

### <a id="s-wakeClose"></a>`wakeClose(w, kind)`

function · **exported** · L41–86

- calls: [`anchor`](belief.js.md#s-anchor) _js/aria/belief.js_ · [`noteTrade`](footprint.js.md#s-noteTrade) _js/aria/footprint.js_ · [`counterfactual`](foresee.js.md#s-counterfactual) _js/aria/foresee.js_ · [`feeds`](#s-feeds) ×2 · [`corpOfStation`](../corp/corps.js.md#s-corpOfStation) _js/corp/corps.js_ · [`stockMultAt`](../economy/economy.js.md#s-stockMultAt) _js/economy/economy.js_ ×2 · [`stockOf`](../economy/economy.js.md#s-stockOf) _js/economy/economy.js_ · [`targetFor`](../economy/economy.js.md#s-targetFor) _js/economy/economy.js_ · [`baseValue`](../economy/materials.js.md#s-baseValue) _js/economy/materials.js_ · [`goodName`](../economy/materials.js.md#s-goodName) _js/economy/materials.js_ · [`sellPriceAt`](../sim/sim.js.md#s-sellPriceAt) _js/sim/sim.js_
- called by: [`makeTradeOps.BUY`](../mission/tradeops.js.md#s-makeTradeOps-BUY) _js/mission/tradeops.js_ · [`makeTradeOps.SELL`](../mission/tradeops.js.md#s-makeTradeOps-SELL) _js/mission/tradeops.js_

<!-- note:wakeClose -->
<!-- /note -->

### <a id="s-wakeJobOpen"></a>`wakeJobOpen()`

function · **exported** · L88–90

- called by: [`tickAriaPilot`](pilot.js.md#s-tickAriaPilot) _js/aria/pilot.js_ · [`begun`](play.js.md#s-begun) _js/aria/play.js_ · [`resumeHeld`](play.js.md#s-resumeHeld) _js/aria/play.js_

<!-- note:wakeJobOpen -->
<!-- /note -->

### <a id="s-wakeJobClose"></a>`wakeJobClose(open, key, ok, cr)`

function · **exported** · L91–96

- calls: [`noteWork`](footprint.js.md#s-noteWork) _js/aria/footprint.js_ · [`verbOf`](mind.js.md#s-verbOf) _js/aria/mind.js_
- called by: [`tickAriaPilot`](pilot.js.md#s-tickAriaPilot) _js/aria/pilot.js_ · [`finishMove`](play.js.md#s-finishMove) _js/aria/play.js_

<!-- note:wakeJobClose -->
<!-- /note -->

### <a id="s-wakeAudit"></a>`wakeAudit()`

function · **exported** · L98–106

- calls: [`audit`](footprint.js.md#s-audit) _js/aria/footprint.js_ · [`stationById`](../station/stations.js.md#s-stationById) _js/station/stations.js_
- via [js/station/stations.js](../station/stations.js.md): `stationById.econ.lines.find`
- called by: [`tickAriaPilot`](pilot.js.md#s-tickAriaPilot) _js/aria/pilot.js_ · [`stepPlay`](play.js.md#s-stepPlay) _js/aria/play.js_

<!-- note:wakeAudit -->
<!-- /note -->

### <a id="s-wakeSave"></a>`wakeSave()`

function · **exported** · L108–108

- calls: [`footprintOut`](footprint.js.md#s-footprintOut) _js/aria/footprint.js_
- called by: [`saveAria`](aria.js.md#s-saveAria) _js/aria/aria.js_

<!-- note:wakeSave -->
<!-- /note -->

### <a id="s-wakeLoad"></a>`wakeLoad()`

function · **exported** · L109–109

- calls: [`footprintIn`](footprint.js.md#s-footprintIn) _js/aria/footprint.js_
- called by: [`loadAria`](aria.js.md#s-loadAria) _js/aria/aria.js_

<!-- note:wakeLoad -->
<!-- /note -->

### <a id="s-wakeReset"></a>`wakeReset()`

function · **exported** · L110–110

- calls: [`resetFootprint`](footprint.js.md#s-resetFootprint) _js/aria/footprint.js_
- called by: [`resetAria`](aria.js.md#s-resetAria) _js/aria/aria.js_ · [`beginPlay`](play.js.md#s-beginPlay) _js/aria/play.js_

<!-- note:wakeReset -->
<!-- /note -->
