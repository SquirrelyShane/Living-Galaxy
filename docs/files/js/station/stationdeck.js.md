# js/station/stationdeck.js

[index](../../../README.md) · 440 lines · 43 symbols · 23 imports · 2 importers

## About

<!-- note:@file -->
LIVING GALAXY — the station deck.

What you see when the clamps take hold. A wall of dockside CRTs — code
rain, crew vitals on a heart monitor, station process bars — beside the
working panels — only what a PORT has: market, shipyard, the desk, the
hiring hall, works, drone and robot yards, refit, GNN, the deck blueprint.
What belongs to the pilot (roster, company, fleet, logs) is the console's.

The deck opens itself on dock, folds away on undock, and can be stowed
to fly the berth with the HUD.

- L298 · `PANELS.drones = (body, st) => {` — the drone lines: what this port builds, what is on the line, who calls it home
- L332 · `PANELS.robots = robotsPanel;` — the robot yard and the refit rack: package D's deck fragments
- L335 · `PANELS.gnn = (body, st) => {` — the GNN station's own desk: the full archive, every bulletin's actions
<!-- /note -->

## Imports

| line | from | names | target |
|---|---|---|---|
| 1 | `../sim/sim.js` | `currentShipId`, `issuedHullId`, `sim`, `toggleDock` | [js/sim/sim.js](../sim/sim.js.md) |
| 2 | `./dockwork.js` | `handlingLeft`, `handlingLine` | [js/station/dockwork.js](dockwork.js.md) |
| 3 | `../ships/shipdb.js` | `SHIP_DB`, `shipById`, `sizeBand` | [js/ships/shipdb.js](../ships/shipdb.js.md) |
| 4 | `../economy/shipcost.js` | `componentBill`, `stockLines`, `yardQuote` | [js/economy/shipcost.js](../economy/shipcost.js.md) |
| 5 | `../flight/pilot.js` | `pilot`, `rankStatus` | [js/flight/pilot.js](../flight/pilot.js.md) |
| 6 | `../crew/ledger.js` | `crew` | [js/crew/ledger.js](../crew/ledger.js.md) |
| 7 | `../corp/company.js` | `company`, `hasCompany` | [js/corp/company.js](../corp/company.js.md) |
| 8 | `../economy/contracts.js` | `contracts`, `BOARD` | [js/economy/contracts.js](../economy/contracts.js.md) |
| 9 | `../ui/boardview.js` | `renderDesk`, `renderHeld` | [js/ui/boardview.js](../ui/boardview.js.md) |
| 10 | `../ui/coverage.js` | `renderCoverage`, `buyCoverage` | [js/ui/coverage.js](../ui/coverage.js.md) |
| 11 | `../corp/corps.js` | `corpOfStation`, `standingLabel` | [js/corp/corps.js](../corp/corps.js.md) |
| 12 | `./blueprint.js` | `stationPlan`, `tickPlan`, `drawPlan`, `occupancy`, `roomAt` | [js/station/blueprint.js](blueprint.js.md) |
| 13 | `./stations.js` | `stationById` | [js/station/stations.js](stations.js.md) |
| 14 | `./stationclock.js` | `clockAt` | [js/station/stationclock.js](stationclock.js.md) |
| 15 | `./deckworks.js` | `worksPanel` | [js/station/deckworks.js](deckworks.js.md) |
| 16 | `../drones/roles.js` | `DRONE_ROLES` | [js/drones/roles.js](../drones/roles.js.md) |
| 17 | `../drones/ops.js` | `droneOps`, `buildOptions`, `orderBuild`, `queueAt`, `unitsHomedAt`, `statusLine`, `pendingAsks`, `beginWork` | [js/drones/ops.js](../drones/ops.js.md) |
| 18 | `../comms/gnn.js` | `gnn`, `DESKS`, `runAction` | [js/comms/gnn.js](../comms/gnn.js.md) |
| 19 | `../console/console.js` | `openConsole` | [js/console/console.js](../console/console.js.md) |
| 20 | `../console/panels/market.js` | `marketBlock` | [js/console/panels/market.js](../console/panels/market.js.md) |
| 21 | `../crew/robotyard.js` | `robotsPanel` | [js/crew/robotyard.js](../crew/robotyard.js.md) |
| 22 | `./refityard.js` | `refitPanel`, `wireDeckRepair`, `paintDeckRepair` | [js/station/refityard.js](refityard.js.md) |
| 23 | `./deckhall.js` | `hallPanel`, `resetHall` | [js/station/deckhall.js](deckhall.js.md) |

## Imported by

- [js/ui/hud.js](../ui/hud.js.md) — `mountStationDeck`
- test/deck.test.mjs _(outside js/)_ — `deckTabs`

## Exports

- [`mountStationDeck`](#s-mountStationDeck) · function — used by [js/ui/hud.js](../ui/hud.js.md)
- [`deckTabs`](#s-deckTabs) · function — used by test/deck.test.mjs

## Effects

- **dom.create** — `‹tag›` (el:26) · `optgroup` (PANELS.shipyard>render:129) · `option` (PANELS.shipyard>render:132)
- **dom.id** — `‹id›` ($:25) · `station-deck` (mountStationDeck:351) · `sd-body` (mountStationDeck:352) · `sd-tabs` (mountStationDeck:353) · `sd-rain1` (mountStationDeck:354) · `sd-rain2` (mountStationDeck:355) · `sd-vitals` (mountStationDeck:356) · `sd-stow` (mountStationDeck:373) · `sd-reopen` (mountStationDeck:374, mountStationDeck:407) · `sd-undock` (mountStationDeck:375, mountStationDeck>paintUndock:377) · `sd-repair` (mountStationDeck:385, mountStationDeck:420) · `sd-title` (mountStationDeck:398) · `sd-sub` (mountStationDeck:399, mountStationDeck:417) · `sd-bpm` (mountStationDeck:415) · `sd-credits` (mountStationDeck:418) · `sd-procs` (mountStationDeck:423)
- **dom.query** — `button` (@file:302, mountStationDeck:369, mountStationDeck:403) · `button[data-sd]` (mountStationDeck:366) · `button[data-sd="gnn"]` (mountStationDeck:400) · `b` (mountStationDeck:426)
- **event.listen** — `click on b → fn` (btn:97) · `change on picker → (inline)` (PANELS.shipyard>render:141) · `click on r → (inline)` (PANELS.shipyard>render:161) · `click on v.parentElement → (inline)` (PANELS.shipyard>render:175) · `pointerdown on canvas → (inline)` (PANELS.blueprint:264) · `pointercancel on canvas → (inline)` (PANELS.blueprint:268) · `lostpointercapture on canvas → (inline)` (PANELS.blueprint:269) · `pointermove on canvas → (inline)` (PANELS.blueprint:270) · `pointerup on canvas → (inline)` (PANELS.blueprint:277) · `wheel on canvas → (inline)` (PANELS.blueprint:290) · `click on b → (inline)` (mountStationDeck:367) · `click on $() → (inline)` (mountStationDeck:373, mountStationDeck:374, mountStationDeck:375) · `pointerdown on root → (inline)` (mountStationDeck:386)

## Symbols

### <a id="s-S"></a>`$(id)`

function · L25–25

- called by: [`mountStationDeck`](#s-mountStationDeck) ×18 · [`mountStationDeck>paintUndock`](#s-mountStationDeck-paintUndock)
- effects: dom.id `‹id›`

<!-- note:$ -->
<!-- /note -->

### <a id="s-el"></a>`el(tag, cls, text)`

function · L26–26

- called by: [`@file`](#) ×10 · [`PANELS.blueprint`](#s-PANELS-blueprint) ×3 · [`PANELS.board`](#s-PANELS-board) ×7 · [`PANELS.shipyard`](#s-PANELS-shipyard) ×3 · [`PANELS.shipyard>render`](#s-PANELS-shipyard-render) ×13 · [`bar`](#s-bar) · [`btn`](#s-btn) · [`f`](#s-f) · [`hs`](#s-hs) · [`qs`](#s-qs) · [`row`](#s-row) ×5 · [`sec`](#s-sec) · [`sec~2`](#s-sec-2)
- effects: dom.create `‹tag›`

<!-- note:el -->
<!-- /note -->

### <a id="s-KATA"></a>`KATA`

const · L28–28

<!-- note:KATA -->
---------------- CRT mini screens ----------------
<!-- /note -->

### <a id="s-mountRain"></a>`mountRain(canvas)`

function · L30–55

- calls: [`mountRain>size`](#s-mountRain-size) ×2
- called by: [`mountStationDeck`](#s-mountStationDeck) ×2

<!-- note:mountRain -->
<!-- /note -->

#### <a id="s-mountRain-size"></a>`mountRain>size()`

function · L33–38

- called by: [`mountRain`](#s-mountRain) ×2

<!-- note:mountRain>size -->
<!-- /note -->

### <a id="s-mountVitals"></a>`mountVitals(canvas)`

function · L57–81

- via [js/crew/ledger.js](../crew/ledger.js.md): `crew.aboard.reduce`
- called by: [`mountStationDeck`](#s-mountStationDeck)

<!-- note:mountVitals -->
- L64 · `const bpm = 52 + (100 - morale) * 0.9;` — souring crew, racing trace
- L67 · `ctx.fillStyle = "#020804"; ctx.fillRect(x, 0, speed + 4 * devicePixelRatio, h);` — fade a column ahead of the pen
- L70 · `if (t < 0.08) y = midY - h * 0.42 * (t / 0.08);` — R spike
<!-- /note -->

### <a id="s-tab"></a>`tab`

const · L83–83

<!-- note:tab -->
---------------- panels ----------------
<!-- /note -->

### <a id="s-tabs"></a>`tabs`

const · L84–84

<!-- note:tabs -->
<!-- /note -->

### <a id="s-view"></a>`view`

const · L85–85

<!-- note:view -->
<!-- /note -->

### <a id="s-paintPanel"></a>`paintPanel()`

function · L86–86

- called by: [`@file`](#) ×2 · [`PANELS.hall`](#s-PANELS-hall) · [`PANELS.market.repaint`](#s-PANELS-market-repaint) · [`PANELS.shipyard>render`](#s-PANELS-shipyard-render) ×2 · [`PANELS.shipyard>render.onBuy`](#s-PANELS-shipyard-render-onBuy) · [`b`](#s-b) · [`mountStationDeck`](#s-mountStationDeck) ×4 · [`x`](#s-x)

<!-- note:paintPanel -->
<!-- /note -->

### <a id="s-row"></a>`row(parent, label, hint)`

function · L88–95

- calls: [`el`](#s-el) ×5
- called by: [`@file`](#) · [`PANELS.shipyard>render`](#s-PANELS-shipyard-render) ×8 · [`v`](#s-v) · [`v~2`](#s-v-2) · [`v~3`](#s-v-3) · [`v~4`](#s-v-4) · [`v~5`](#s-v-5)

<!-- note:row -->
<!-- /note -->

### <a id="s-btn"></a>`btn(text, fn, cls=)`

function · L97–97

- calls: [`el`](#s-el)
- called by: [`@file`](#) ×3 · [`PANELS.board>dbtn`](#s-PANELS-board-dbtn) · [`PANELS.shipyard>render`](#s-PANELS-shipyard-render) ×2 · [`b`](#s-b) · [`x`](#s-x)
- effects: event.listen `click`

<!-- note:btn -->
<!-- /note -->

### <a id="s-PANELS"></a>`PANELS`

const · L99–296

<!-- note:PANELS -->
<!-- /note -->

#### <a id="s-PANELS-market"></a>`PANELS.market(body, st)`

prop · L100–102

- calls: [`marketBlock`](../console/panels/market.js.md#s-marketBlock) _js/console/panels/market.js_

<!-- note:PANELS.market -->
the one market: PORT LEDGER / THEY SELL / THEY BUY / LOCKER & WORKS lives in console/panels/market.js
<!-- /note -->

##### <a id="s-PANELS-market-repaint"></a>`PANELS.market.repaint()`

prop · L101–101

- calls: [`paintPanel`](#s-paintPanel)

<!-- note:PANELS.market.repaint -->
<!-- /note -->

#### <a id="s-PANELS-shipyard"></a>`PANELS.shipyard(body, st)`

prop · L104–235

- calls: [`rankStatus`](../flight/pilot.js.md#s-rankStatus) _js/flight/pilot.js_ · [`shipById`](../ships/shipdb.js.md#s-shipById) _js/ships/shipdb.js_ ×2 · [`currentShipId`](../sim/sim.js.md#s-currentShipId) _js/sim/sim.js_ · [`issuedHullId`](../sim/sim.js.md#s-issuedHullId) _js/sim/sim.js_ ×2 · [`el`](#s-el) ×3 · [`PANELS.shipyard>render`](#s-PANELS-shipyard-render)

<!-- note:PANELS.shipyard -->
<!-- /note -->

##### <a id="s-PANELS-shipyard-render"></a>`PANELS.shipyard>render()`

function · L119–233

- calls: [`componentBill`](../economy/shipcost.js.md#s-componentBill) _js/economy/shipcost.js_ · [`stockLines`](../economy/shipcost.js.md#s-stockLines) _js/economy/shipcost.js_ · [`yardQuote`](../economy/shipcost.js.md#s-yardQuote) _js/economy/shipcost.js_ ×3 · [`shipById`](../ships/shipdb.js.md#s-shipById) _js/ships/shipdb.js_ ×3 · [`sizeBand`](../ships/shipdb.js.md#s-sizeBand) _js/ships/shipdb.js_ · [`currentShipId`](../sim/sim.js.md#s-currentShipId) _js/sim/sim.js_ · [`btn`](#s-btn) ×2 · [`el`](#s-el) ×13 · [`paintPanel`](#s-paintPanel) ×2 · [`PANELS.shipyard>render`](#s-PANELS-shipyard-render) ×3 · [`row`](#s-row) ×8 · [`renderCoverage`](../ui/coverage.js.md#s-renderCoverage) _js/ui/coverage.js_
- via [js/sim/sim.js](../sim/sim.js.md): `sim.deckYardOpen.add`, `sim.deckYardOpen.delete`, `sim.deckYardOpen.has`, `sim.ownedHulls.push`
- called by: [`PANELS.shipyard`](#s-PANELS-shipyard) · [`PANELS.shipyard>render`](#s-PANELS-shipyard-render) ×3
- effects: dom.create `optgroup` · dom.create `option` · event.listen `change` · event.listen `click`

<!-- note:PANELS.shipyard>render -->
- L199 · `sim.requestPersist = true;` — a hull is worth a write now, not in thirty seconds (0.3.42)
- L205 · `{` — cover on the hull you are actually flying, not the one in the picker —
  you insure what you fly
<!-- /note -->

###### <a id="s-PANELS-shipyard-render-onBuy"></a>`PANELS.shipyard>render.onBuy(tierId)`

prop · L215–219

- calls: [`yardQuote`](../economy/shipcost.js.md#s-yardQuote) _js/economy/shipcost.js_ · [`paintPanel`](#s-paintPanel) · [`buyCoverage`](../ui/coverage.js.md#s-buyCoverage) _js/ui/coverage.js_

<!-- note:PANELS.shipyard>render.onBuy -->
<!-- /note -->

#### <a id="s-PANELS-works"></a>`PANELS.works(body, st)`

prop · L237–237

- calls: [`worksPanel`](deckworks.js.md#s-worksPanel) _js/station/deckworks.js_

<!-- note:PANELS.works -->
the WORKS tab lives in js/station/deckworks.js — the pilot's fabrication desk
plus the port's own lines. Moved out in 0.3.10: this file is on the
600-line gate and that panel had to be able to grow.
<!-- /note -->

#### <a id="s-PANELS-board"></a>`PANELS.board(body, st)`

prop · L239–252

- calls: [`corpOfStation`](../corp/corps.js.md#s-corpOfStation) _js/corp/corps.js_ · [`standingLabel`](../corp/corps.js.md#s-standingLabel) _js/corp/corps.js_ · [`el`](#s-el) ×7 · [`renderDesk`](../ui/boardview.js.md#s-renderDesk) _js/ui/boardview.js_ · [`renderHeld`](../ui/boardview.js.md#s-renderHeld) _js/ui/boardview.js_

<!-- note:PANELS.board -->
<!-- /note -->

##### <a id="s-PANELS-board-dbtn"></a>`PANELS.board>dbtn(label, fn, on=)`

function · L244–244

- calls: [`btn`](#s-btn)

<!-- note:PANELS.board>dbtn -->
0.3.18: drawn by js/ui/boardview.js, the same desk the console shows
<!-- /note -->

#### <a id="s-PANELS-hall"></a>`PANELS.hall(body, st)`

prop · L254–254

- calls: [`hallPanel`](deckhall.js.md#s-hallPanel) _js/station/deckhall.js_ · [`paintPanel`](#s-paintPanel)

<!-- note:PANELS.hall -->
0.3.49 — the HALL lives in js/station/deckhall.js: your crew (TALK, SETTLE, PAY
OFF) in the deck's own style, the hiring hall, the company's people on
this floor with the LINE inline, and the registrar with a name field.
<!-- /note -->

#### <a id="s-PANELS-blueprint"></a>`PANELS.blueprint(body, st)`

prop · L256–295

- calls: [`occupancy`](blueprint.js.md#s-occupancy) _js/station/blueprint.js_ · [`roomAt`](blueprint.js.md#s-roomAt) _js/station/blueprint.js_ · [`stationPlan`](blueprint.js.md#s-stationPlan) _js/station/blueprint.js_ · [`el`](#s-el) ×3
- effects: event.listen `pointerdown` · event.listen `pointercancel` · event.listen `lostpointercapture` · event.listen `pointermove` · event.listen `pointerup` · event.listen `wheel`

<!-- note:PANELS.blueprint -->
- L266 · `try { canvas.setPointerCapture(e.pointerId); } catch {` — pointer already gone
<!-- /note -->

### <a id="s-opts"></a>`opts`

const · L299–299

- calls: [`buildOptions`](../drones/ops.js.md#s-buildOptions) _js/drones/ops.js_

<!-- note:opts -->
<!-- /note -->

### <a id="s-sec"></a>`sec`

const · L300–300

- calls: [`el`](#s-el)

<!-- note:sec -->
<!-- /note -->

### <a id="s-v"></a>`v`

const · L302–302

- calls: [`row`](#s-row)

<!-- note:v -->
<!-- /note -->

### <a id="s-v-2"></a>`v~2`

const · L306–306

- calls: [`row`](#s-row)

<!-- note:v~2 -->
<!-- /note -->

### <a id="s-b"></a>`b`

const · L308–308

- calls: [`orderBuild`](../drones/ops.js.md#s-orderBuild) _js/drones/ops.js_ · [`btn`](#s-btn) · [`paintPanel`](#s-paintPanel)

<!-- note:b -->
<!-- /note -->

### <a id="s-q"></a>`q`

const · L313–313

- calls: [`queueAt`](../drones/ops.js.md#s-queueAt) _js/drones/ops.js_

<!-- note:q -->
<!-- /note -->

### <a id="s-qs"></a>`qs`

const · L315–315

- calls: [`el`](#s-el)

<!-- note:qs -->
<!-- /note -->

### <a id="s-v-3"></a>`v~3`

const · L317–317

- calls: [`row`](#s-row)

<!-- note:v~3 -->
<!-- /note -->

### <a id="s-bar"></a>`bar`

const · L317–317

- calls: [`el`](#s-el)

<!-- note:bar -->
<!-- /note -->

### <a id="s-f"></a>`f`

const · L317–317

- calls: [`el`](#s-el)

<!-- note:f -->
<!-- /note -->

### <a id="s-mine"></a>`mine`

const · L320–320

- calls: [`unitsHomedAt`](../drones/ops.js.md#s-unitsHomedAt) _js/drones/ops.js_

<!-- note:mine -->
<!-- /note -->

### <a id="s-hs"></a>`hs`

const · L321–321

- calls: [`el`](#s-el)

<!-- note:hs -->
<!-- /note -->

### <a id="s-v-4"></a>`v~4`

const · L325–325

- calls: [`statusLine`](../drones/ops.js.md#s-statusLine) _js/drones/ops.js_ · [`row`](#s-row)

<!-- note:v~4 -->
<!-- /note -->

### <a id="s-posts"></a>`posts`

const · L338–338

- via [js/comms/gnn.js](../comms/gnn.js.md): `gnn.posts.filter`, `gnn.posts.filter.slice`, `….filter.slice.reverse`

<!-- note:posts -->
<!-- /note -->

### <a id="s-sec-2"></a>`sec~2`

const · L339–339

- calls: [`el`](#s-el)

<!-- note:sec~2 -->
<!-- /note -->

### <a id="s-v-5"></a>`v~5`

const · L343–343

- calls: [`row`](#s-row)

<!-- note:v~5 -->
<!-- /note -->

### <a id="s-x"></a>`x`

const · L344–344

- calls: [`runAction`](../comms/gnn.js.md#s-runAction) _js/comms/gnn.js_ · [`btn`](#s-btn) · [`paintPanel`](#s-paintPanel)

<!-- note:x -->
<!-- /note -->

### <a id="s-mountStationDeck"></a>`mountStationDeck()`

function · **exported** · L350–438

- calls: [`toggleDock`](../sim/sim.js.md#s-toggleDock) _js/sim/sim.js_ · [`drawPlan`](blueprint.js.md#s-drawPlan) _js/station/blueprint.js_ · [`tickPlan`](blueprint.js.md#s-tickPlan) _js/station/blueprint.js_ · [`resetHall`](deckhall.js.md#s-resetHall) _js/station/deckhall.js_ · [`paintDeckRepair`](refityard.js.md#s-paintDeckRepair) _js/station/refityard.js_ · [`wireDeckRepair`](refityard.js.md#s-wireDeckRepair) _js/station/refityard.js_ · [`clockAt`](stationclock.js.md#s-clockAt) _js/station/stationclock.js_ · [`$`](#s-S) ×18 · [`mountRain`](#s-mountRain) ×2 · [`mountStationDeck>paintUndock`](#s-mountStationDeck-paintUndock) ×2 · [`mountVitals`](#s-mountVitals) · [`paintPanel`](#s-paintPanel) ×4 · [`stationById`](stations.js.md#s-stationById) _js/station/stations.js_ ×5
- called by: [`mountHud`](../ui/hud.js.md#s-mountHud) _js/ui/hud.js_
- effects: dom.id `station-deck` · dom.id `sd-body` · dom.id `sd-tabs` · dom.id `sd-rain1` · dom.id `sd-rain2` · dom.id `sd-vitals` · dom.query `button[data-sd]` · event.listen `click` · dom.query `button` · dom.id `sd-stow` · dom.id `sd-reopen` · dom.id `sd-undock` · dom.id `sd-repair` · event.listen `pointerdown` · dom.id `sd-title` · dom.id `sd-sub` · dom.query `button[data-sd="gnn"]` · dom.id `sd-bpm` · dom.id `sd-credits` · dom.id `sd-procs` · dom.query `b`

<!-- note:mountStationDeck -->
---------------- mount ----------------

- L407 · `$("sd-reopen").classList.toggle("hidden", !(dockedAt && stowed));` — HUD chip to reopen a stowed deck
- L416 · `` { const c = clockAt(sim.time); const line = `${stationById(dockedAt)?.sector ?? ""} deck · `` — 0.3.52: the port's own clock in the header — which shift is on the docks
- L422 · `const t = now / 1000;` — progress bar screen — station processes, ticking on their own clocks
- L428 · `if (tab === "drones" && now - (body._dronesAt ?? 0) > 1500) { body._dronesAt = now; paintP` — the drone lines tick while you watch
- L430 · `if (tab === "blueprint" && body._bpCanvas) {` — blueprint live tick
<!-- /note -->

#### <a id="s-mountStationDeck-paintUndock"></a>`mountStationDeck>paintUndock()`

function · L376–384

- calls: [`handlingLeft`](dockwork.js.md#s-handlingLeft) _js/station/dockwork.js_ · [`handlingLine`](dockwork.js.md#s-handlingLine) _js/station/dockwork.js_ ×2 · [`$`](#s-S)
- called by: [`mountStationDeck`](#s-mountStationDeck) ×2
- effects: dom.id `sd-undock`

<!-- note:mountStationDeck>paintUndock -->
0.3.75: the button says when the crane is holding the clamps, and when a departure is booked
<!-- /note -->

### <a id="s-deckTabs"></a>`deckTabs()`

function · **exported** · L440–440

<!-- note:deckTabs -->
The deck's panels by id — test/deck.test.mjs holds index.html's tab row to it.
<!-- /note -->

## Module-level calls

- calls: [`el`](#s-el) · [`hasCompany`](../corp/company.js.md#s-hasCompany) _js/corp/company.js_ · [`btn`](#s-btn) · [`paintPanel`](#s-paintPanel) · [`row`](#s-row) · [`pendingAsks`](../drones/ops.js.md#s-pendingAsks) _js/drones/ops.js_ · [`openConsole`](../console/console.js.md#s-openConsole) _js/console/console.js_ · [`beginWork`](../drones/ops.js.md#s-beginWork) _js/drones/ops.js_
