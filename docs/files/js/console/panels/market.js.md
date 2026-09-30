# js/console/panels/market.js

[index](../../../../README.md) · 337 lines · 34 symbols · 12 imports · 2 importers

## About

<!-- note:@file -->
LIVING GALAXY — CONSOLE › MARKET: PORT · HOLD · REFIT

The nearest port and, docked, the one market implementation (`marketBlock`,
shared with the station deck); the hold with jettison and the ice bench;
the refit yard fragment from package D, or the owned-upgrade list; and
(0.3.19) ROUTES — where the money is in moving goods from here, with FLY IT.
<!-- /note -->

## Imports

| line | from | names | target |
|---|---|---|---|
| 1 | `../kit.js` | `button`, `el`, `group`, `note`, `row`, `section`, `setBar`, `fmtDist` | [js/console/kit.js](../kit.js.md) |
| 2 | `../../economy/materials.js` | `good`, `goodName` | [js/economy/materials.js](../../economy/materials.js.md) |
| 3 | `../../economy/icework.js` | `MODES` as `ICE_MODES`, `cycleIceworkMode`, `icework`, `iceworkFit` | [js/economy/icework.js](../../economy/icework.js.md) |
| 4 | `../../flight/ship.js` | `cargoTotal` | [js/flight/ship.js](../../flight/ship.js.md) |
| 5 | `../../sim/sim.js` | `buyPriceAt`, `canSmeltAt`, `claimPort`, `jettison`, `portLedger`, `portWants` as `simPortWants`, `sellAllOre`, `sellPriceAt`, `sim`, `smeltAll`, `stashAt`, `stashDeposit`, `stashWithdraw`, `stationStatus`, `toggleDock`, `tradeBuy`, `tradeSell` | [js/sim/sim.js](../../sim/sim.js.md) |
| 6 | `../../station/stations.js` | `stationById` | [js/station/stations.js](../../station/stations.js.md) |
| 7 | `../../station/refityard.js` | `refitPanel` | [js/station/refityard.js](../../station/refityard.js.md) |
| 8 | `../../economy/upgrades.js` | `upgradeLines` | [js/economy/upgrades.js](../../economy/upgrades.js.md) |
| 9 | `../../economy/traderoutes.js` | `tradeRoutes`, `routeLine` | [js/economy/traderoutes.js](../../economy/traderoutes.js.md) |
| 10 | `../../mission/script.js` | `makeMission`, `makeStep`, `presets` | [js/mission/script.js](../../mission/script.js.md) |
| 11 | `../../mission/run.js` | `startMission` | [js/mission/run.js](../../mission/run.js.md) |
| 12 | `../../sim/sim.js` | `addAnchoredWaypoint` | [js/sim/sim.js](../../sim/sim.js.md) |

## Imported by

- [js/console/console.js](../console.js.md) — `default`
- [js/station/stationdeck.js](../../station/stationdeck.js.md) — `marketBlock`

## Exports

- [`marketBlock`](#s-marketBlock) · function — used by [js/station/stationdeck.js](../../station/stationdeck.js.md)
- [`flyRoute`](#s-flyRoute) · function — **no importer in scanned roots**
- [`portWants`](#s-portWants) · function — **no importer in scanned roots**
- `default` · ObjectExpression — used by [js/console/console.js](../console.js.md)

## Effects

- **dom.id** — `aux-ice-st` (search.status:328)
- **event.listen** — `click on b → fn` (SD.btn:29)

## Symbols

### <a id="s-DOC"></a>`DOC`

const · L14–14

<!-- note:DOC -->
<!-- /note -->

### <a id="s-YARD_SECTORS"></a>`YARD_SECTORS`

const · L15–15

<!-- note:YARD_SECTORS -->
<!-- /note -->

### <a id="s-SD"></a>`SD`

const · L17–34

<!-- note:SD -->
---- the one market -------------------------------------------------------

Station-deck builders: the defaults, so the deck's look is unchanged.
<!-- /note -->

#### <a id="s-SD-sec"></a>`SD.sec(title)`

prop · L18–18

- calls: [`el`](../kit.js.md#s-el) _js/console/kit.js_ ×2

<!-- note:SD.sec -->
<!-- /note -->

#### <a id="s-SD-row"></a>`SD.row(parent, label, hint)`

prop · L19–28

- calls: [`el`](../kit.js.md#s-el) _js/console/kit.js_ ×5

<!-- note:SD.row -->
<!-- /note -->

#### <a id="s-SD-btn"></a>`SD.btn(text, fn, cls=)`

prop · L29–29

- calls: [`el`](../kit.js.md#s-el) _js/console/kit.js_
- effects: event.listen `click`

<!-- note:SD.btn -->
<!-- /note -->

#### <a id="s-SD-note"></a>`SD.note(parent, text, warn=)`

prop · L30–30

- calls: [`el`](../kit.js.md#s-el) _js/console/kit.js_

<!-- note:SD.note -->
<!-- /note -->

#### <a id="s-SD-empty"></a>`SD.empty(parent, text)`

prop · L31–31

- calls: [`el`](../kit.js.md#s-el) _js/console/kit.js_

<!-- note:SD.empty -->
<!-- /note -->

#### <a id="s-SD-cr"></a>`SD.cr(text)`

prop · L32–32

- calls: [`el`](../kit.js.md#s-el) _js/console/kit.js_

<!-- note:SD.cr -->
<!-- /note -->

#### <a id="s-SD-tag"></a>`SD.tag(text, ok)`

prop · L33–33

- calls: [`el`](../kit.js.md#s-el) _js/console/kit.js_

<!-- note:SD.tag -->
<!-- /note -->

### <a id="s-CON"></a>`CON`

const · L35–43

<!-- note:CON -->
Console builders: the same block in the glass kit.
<!-- /note -->

#### <a id="s-CON-sec"></a>`CON.sec(title)`

prop · L36–36

- calls: [`section`](../kit.js.md#s-section) _js/console/kit.js_

<!-- note:CON.sec -->
<!-- /note -->

#### <a id="s-CON-row"></a>`CON.row(parent, label, hint)`

prop · L37–37

- calls: [`group`](../kit.js.md#s-group) _js/console/kit.js_ · [`row`](../kit.js.md#s-row) _js/console/kit.js_

<!-- note:CON.row -->
<!-- /note -->

#### <a id="s-CON-btn"></a>`CON.btn(text, fn, cls=)`

prop · L38–38

- calls: [`button`](../kit.js.md#s-button) _js/console/kit.js_

<!-- note:CON.btn -->
<!-- /note -->

#### <a id="s-CON-note"></a>`CON.note(parent, text)`

prop · L39–39

- calls: [`note`](../kit.js.md#s-note) _js/console/kit.js_

<!-- note:CON.note -->
<!-- /note -->

#### <a id="s-CON-empty"></a>`CON.empty(parent, text)`

prop · L40–40

- calls: [`el`](../kit.js.md#s-el) _js/console/kit.js_

<!-- note:CON.empty -->
<!-- /note -->

#### <a id="s-CON-cr"></a>`CON.cr(text)`

prop · L41–41

- calls: [`el`](../kit.js.md#s-el) _js/console/kit.js_

<!-- note:CON.cr -->
<!-- /note -->

#### <a id="s-CON-tag"></a>`CON.tag(text, ok)`

prop · L42–42

- calls: [`el`](../kit.js.md#s-el) _js/console/kit.js_

<!-- note:CON.tag -->
<!-- /note -->

### <a id="s-marketBlock"></a>`marketBlock(body, st, {…}=)`

function · **exported** · L45–103

- calls: [`flyRoute`](#s-flyRoute) · [`marketBlock>shelf`](#s-marketBlock-shelf) ×2 · [`mountPort.repaint`](#s-mountPort-repaint) ×9 · [`good`](../../economy/materials.js.md#s-good) _js/economy/materials.js_ · [`goodName`](../../economy/materials.js.md#s-goodName) _js/economy/materials.js_ ×2 · [`tradeRoutes`](../../economy/traderoutes.js.md#s-tradeRoutes) _js/economy/traderoutes.js_ · [`buyPriceAt`](../../sim/sim.js.md#s-buyPriceAt) _js/sim/sim.js_ · [`canSmeltAt`](../../sim/sim.js.md#s-canSmeltAt) _js/sim/sim.js_ ×2 · [`portLedger`](../../sim/sim.js.md#s-portLedger) _js/sim/sim.js_ · [`sellAllOre`](../../sim/sim.js.md#s-sellAllOre) _js/sim/sim.js_ · [`sellPriceAt`](../../sim/sim.js.md#s-sellPriceAt) _js/sim/sim.js_ · [`smeltAll`](../../sim/sim.js.md#s-smeltAll) _js/sim/sim.js_ · [`stashAt`](../../sim/sim.js.md#s-stashAt) _js/sim/sim.js_ · [`stashDeposit`](../../sim/sim.js.md#s-stashDeposit) _js/sim/sim.js_ · [`stashWithdraw`](../../sim/sim.js.md#s-stashWithdraw) _js/sim/sim.js_ · [`tradeBuy`](../../sim/sim.js.md#s-tradeBuy) _js/sim/sim.js_ ×2 · [`tradeSell`](../../sim/sim.js.md#s-tradeSell) _js/sim/sim.js_ ×2
- called by: [`mountPort`](#s-mountPort) · [`PANELS.market`](../../station/stationdeck.js.md#s-PANELS-market) _js/station/stationdeck.js_

<!-- note:marketBlock -->
marketBlock(body, st, { repaint, ui }) — PORT LEDGER / THEY SELL / THEY BUY / LOCKER & WORKS.
`body` is the host element, `st` the docked station, `repaint()` is called after every trade;
`ui` picks the builders (station deck by default, `"console"` for the glass kit).

- L57 · `const led = U.sec("PORT LEDGER");` — the ledger: what the port is short of (and pays for), what its lines are doing
- L86 · `const hold = U.sec("LOCKER & WORKS");` — the locker and the works: where a full hold goes when it is not for sale
- L95 · `const out = U.sec("ROUTES FROM HERE");` — 0.3.19: where this shelf sells for more — the trader's first question at any desk
<!-- /note -->

#### <a id="s-marketBlock-shelf"></a>`marketBlock>shelf(x)`

function · L49–56

- called by: [`marketBlock`](#s-marketBlock) ×2

<!-- note:marketBlock>shelf -->
a shelf meter: five cells against the port's target, an arrow for the last pass, a word for the extremes
<!-- /note -->

### <a id="s-flyRoute"></a>`flyRoute(r)`

function · **exported** · L105–117

- calls: [`routeLine`](../../economy/traderoutes.js.md#s-routeLine) _js/economy/traderoutes.js_ · [`startMission`](../../mission/run.js.md#s-startMission) _js/mission/run.js_ · [`makeMission`](../../mission/script.js.md#s-makeMission) _js/mission/script.js_ · [`makeStep`](../../mission/script.js.md#s-makeStep) _js/mission/script.js_ ×4
- called by: [`marketBlock`](#s-marketBlock) · [`mountRoutes`](#s-mountRoutes)

<!-- note:flyRoute -->
A one-off run of a route on the autopilot: dock at the source, buy, dock at the buyer, sell that.
<!-- /note -->

### <a id="s-mountRoutes"></a>`mountRoutes(root, push)`

function · L119–145

- calls: [`button`](../kit.js.md#s-button) _js/console/kit.js_ ×3 · [`el`](../kit.js.md#s-el) _js/console/kit.js_ ×3 · [`group`](../kit.js.md#s-group) _js/console/kit.js_ · [`note`](../kit.js.md#s-note) _js/console/kit.js_ · [`row`](../kit.js.md#s-row) _js/console/kit.js_ ×2 · [`section`](../kit.js.md#s-section) _js/console/kit.js_ ×2 · [`flyRoute`](#s-flyRoute) · [`tradeRoutes`](../../economy/traderoutes.js.md#s-tradeRoutes) _js/economy/traderoutes.js_ · [`cargoTotal`](../../flight/ship.js.md#s-cargoTotal) _js/flight/ship.js_ ×2 · [`startMission`](../../mission/run.js.md#s-startMission) _js/mission/run.js_ · [`presets`](../../mission/script.js.md#s-presets) _js/mission/script.js_ · [`addAnchoredWaypoint`](../../sim/sim.js.md#s-addAnchoredWaypoint) _js/sim/sim.js_
- via [js/mission/script.js](../../mission/script.js.md): `presets.find`

<!-- note:mountRoutes -->
---- ROUTES ----------------------------------------------------------------
<!-- /note -->

### <a id="s-portWants"></a>`portWants(st)`

function · **exported** · L147–150

- calls: [`portWants`](../../sim/sim.js.md#s-portWants) _js/sim/sim.js_
- called by: [`mountPort`](#s-mountPort)

<!-- note:portWants -->
portWants(st) → [{ good, label, short, pays, mult }] — "what they are short of".
<!-- /note -->

### <a id="s-mountPort"></a>`mountPort(root, push)`

function · L152–226

- calls: [`button`](../kit.js.md#s-button) _js/console/kit.js_ ×2 · [`el`](../kit.js.md#s-el) _js/console/kit.js_ ×6 · [`fmtDist`](../kit.js.md#s-fmtDist) _js/console/kit.js_ · [`group`](../kit.js.md#s-group) _js/console/kit.js_ · [`row`](../kit.js.md#s-row) _js/console/kit.js_ ×6 · [`section`](../kit.js.md#s-section) _js/console/kit.js_ ×3 · [`marketBlock`](#s-marketBlock) · [`portWants`](#s-portWants) · [`claimPort`](../../sim/sim.js.md#s-claimPort) _js/sim/sim.js_ · [`stationStatus`](../../sim/sim.js.md#s-stationStatus) _js/sim/sim.js_ · [`toggleDock`](../../sim/sim.js.md#s-toggleDock) _js/sim/sim.js_

<!-- note:mountPort -->
---- PORT ------------------------------------------------------------------
<!-- /note -->

#### <a id="s-mountPort-repaint"></a>`mountPort.repaint()`

prop · L223–223

- called by: [`marketBlock`](#s-marketBlock) ×9

<!-- note:mountPort.repaint -->
<!-- /note -->

### <a id="s-mountHold"></a>`mountHold(root, push)`

function · L228–285

- calls: [`button`](../kit.js.md#s-button) _js/console/kit.js_ · [`el`](../kit.js.md#s-el) _js/console/kit.js_ · [`note`](../kit.js.md#s-note) _js/console/kit.js_ · [`row`](../kit.js.md#s-row) _js/console/kit.js_ ×5 · [`section`](../kit.js.md#s-section) _js/console/kit.js_ ×3 · [`setBar`](../kit.js.md#s-setBar) _js/console/kit.js_ · [`mountHold>drawManifest`](#s-mountHold-drawManifest) ×2 · [`cycleIceworkMode`](../../economy/icework.js.md#s-cycleIceworkMode) _js/economy/icework.js_ · [`iceworkFit`](../../economy/icework.js.md#s-iceworkFit) _js/economy/icework.js_ · [`cargoTotal`](../../flight/ship.js.md#s-cargoTotal) _js/flight/ship.js_
- via [js/economy/icework.js](../../economy/icework.js.md): `ICE_MODES.find`

<!-- note:mountHold -->
---- HOLD ------------------------------------------------------------------

- L236 · `const works = section("Ice works");` — the drill bench: ice → water / gas, run from here or the AUX page
<!-- /note -->

#### <a id="s-mountHold-drawManifest"></a>`mountHold>drawManifest()`

function · L252–268

- calls: [`button`](../kit.js.md#s-button) _js/console/kit.js_ ×2 · [`el`](../kit.js.md#s-el) _js/console/kit.js_ ×2 · [`group`](../kit.js.md#s-group) _js/console/kit.js_ · [`row`](../kit.js.md#s-row) _js/console/kit.js_ · [`good`](../../economy/materials.js.md#s-good) _js/economy/materials.js_ · [`jettison`](../../sim/sim.js.md#s-jettison) _js/sim/sim.js_ ×2
- called by: [`mountHold`](#s-mountHold) ×2

<!-- note:mountHold>drawManifest -->
<!-- /note -->

### <a id="s-mountRefit"></a>`mountRefit(root, push)`

function · L287–314

- calls: [`el`](../kit.js.md#s-el) _js/console/kit.js_ ×4 · [`note`](../kit.js.md#s-note) _js/console/kit.js_ · [`row`](../kit.js.md#s-row) _js/console/kit.js_ · [`section`](../kit.js.md#s-section) _js/console/kit.js_ ×2 · [`upgradeLines`](../../economy/upgrades.js.md#s-upgradeLines) _js/economy/upgrades.js_ · [`refitPanel`](../../station/refityard.js.md#s-refitPanel) _js/station/refityard.js_ · [`stationById`](../../station/stations.js.md#s-stationById) _js/station/stations.js_

<!-- note:mountRefit -->
---- REFIT -----------------------------------------------------------------
<!-- /note -->

### <a id="s-SUBS"></a>`SUBS`

const · L316–316

<!-- note:SUBS -->
---- the panel -------------------------------------------------------------
<!-- /note -->

### <a id="s-mount"></a>`mount(root, ctx)`

prop · L323–323

<!-- note:mount -->
<!-- /note -->

### <a id="s-paint"></a>`paint()`

prop · L324–324

<!-- note:paint -->
<!-- /note -->

### <a id="s-unmount"></a>`unmount()`

prop · L325–325

<!-- note:unmount -->
<!-- /note -->

### <a id="s-search"></a>`search()`

prop · L326–336

- calls: [`goodName`](../../economy/materials.js.md#s-goodName) _js/economy/materials.js_

<!-- note:search -->
<!-- /note -->

#### <a id="s-search-status"></a>`search.status()`

prop · L328–328

- effects: dom.id `aux-ice-st`

<!-- note:search.status -->
<!-- /note -->
