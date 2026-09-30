# js/corp/fleet.js

[index](../../../README.md) · 176 lines · 21 symbols · 10 imports · 4 importers

## About

<!-- note:@file -->
LIVING GALAXY — the company's hulls.

Ported in shape from Living Galaxy's systems/company/fleet.js + fleet-work.js
and cut to what Astra already has: a company hull is a real hull on the
board (npc/traffic.js spawnVessel), flying the same timetable a captain
does, with a settled member of staff in the chair. Two orders:

  extract — a miner: belt claims and home, ore delivered to the port floor;
            the company books the port's bid for it (less the crew's share)
  haul    — a hauler: stock between ports; the company books a freight
            rate per unit delivered

Every cycle the hull costs upkeep (a fraction of its yard price) and the
captain's wage. A hull that does not earn its keep is a decision the
Solvency seat will raise. Commissioning takes credits from the treasury
(the yard's raw-stock bill, shipcost.js) and a captain from the staff at
that port.

- L28 · `let parked = [];` — hulls filed under other skies (or a port this sky no longer has); they come back when theirs loads
<!-- /note -->

## Imports

| line | from | names | target |
|---|---|---|---|
| 1 | `../sim/sim.js` | `logEvent`, `sim` | [js/sim/sim.js](../sim/sim.js.md) |
| 2 | `../station/stations.js` | `stationById` | [js/station/stations.js](../station/stations.js.md) |
| 3 | `../npc/traffic.js` | `traffic`, `trafficHooks`, `spawnVessel`, `removeVessel` | [js/npc/traffic.js](../npc/traffic.js.md) |
| 4 | `../economy/economy.js` | `bidPrice` | [js/economy/economy.js](../economy/economy.js.md) |
| 5 | `./company.js` | `company`, `hasCompany`, `staffAt`, `saveCompany` | [js/corp/company.js](company.js.md) |
| 6 | `../ships/shipdb.js` | `shipById`, `SHIP_DB`, `hullTuneFor` **unused** | [js/ships/shipdb.js](../ships/shipdb.js.md) |
| 7 | `../economy/shipcost.js` | `yardQuote` | [js/economy/shipcost.js](../economy/shipcost.js.md) |
| 8 | `../crew/ledger.js` | `CYCLE_SECONDS` | [js/crew/ledger.js](../crew/ledger.js.md) |
| 9 | `../npc/cradle.js` | `cradle` | [js/npc/cradle.js](../npc/cradle.js.md) |
| 10 | `./corps.js` | `corpOfStation` | [js/corp/corps.js](corps.js.md) |

## Imported by

- [js/console/panels/work-fleet.js](../console/panels/work-fleet.js.md) — `commissionOptions`, `commissionHull`, `decommissionHull`, `fleetReport`, `fleet`
- [js/sim/sim.js](../sim/sim.js.md) — `resetFleet`, `tickFleet`
- [js/ui/hud.js](../ui/hud.js.md) — `wireFleet`
- test/board.test.mjs _(outside js/)_ — `fleet`, `commissionOptions`, `commissionHull`, `commissionBlocker`, `fleetReport`, `tickFleet`, `decommissionHull`

## Exports

- [`FLEET`](#s-FLEET) · const — **no importer in scanned roots**
- [`fleetHold`](#s-fleetHold) · function — **no importer in scanned roots**
- [`fleet`](#s-fleet) · const — used by [js/console/panels/work-fleet.js](../console/panels/work-fleet.js.md), test/board.test.mjs
- [`commissionOptions`](#s-commissionOptions) · function — used by [js/console/panels/work-fleet.js](../console/panels/work-fleet.js.md), test/board.test.mjs
- [`yardPrice`](#s-yardPrice) · function — **no importer in scanned roots**
- [`commissionBlocker`](#s-commissionBlocker) · function — used by test/board.test.mjs
- [`commissionHull`](#s-commissionHull) · function — used by [js/console/panels/work-fleet.js](../console/panels/work-fleet.js.md), test/board.test.mjs
- [`decommissionHull`](#s-decommissionHull) · function — used by [js/console/panels/work-fleet.js](../console/panels/work-fleet.js.md), test/board.test.mjs
- [`fleetReport`](#s-fleetReport) · function — used by [js/console/panels/work-fleet.js](../console/panels/work-fleet.js.md), test/board.test.mjs
- [`tickFleet`](#s-tickFleet) · function — used by [js/sim/sim.js](../sim/sim.js.md), test/board.test.mjs
- [`resetFleet`](#s-resetFleet) · function — used by [js/sim/sim.js](../sim/sim.js.md)
- [`wireFleet`](#s-wireFleet) · function — used by [js/ui/hud.js](../ui/hud.js.md)

## Effects

- **storage.get** — `‹FLEET_KEY›` (resetFleet:161)
- **storage.set** — `‹FLEET_KEY›` (saveFleet:30)

## Symbols

### <a id="s-FLEET"></a>`FLEET`

const · **exported** · L12–17

<!-- note:FLEET -->
- L13 · `upkeep: 0.004,` — of yard price, per cycle
- L14 · `crewShare: 0.25,` — of a delivery's value the captain and hands keep — that IS their wage
- L15 · `haulRate: 0.35,` — of the bid per unit hauled, booked to the company
<!-- /note -->

### <a id="s-fleetHold"></a>`fleetHold(shipId)`

function · **exported** · L19–23

- calls: [`shipById`](../ships/shipdb.js.md#s-shipById) _js/ships/shipdb.js_
- called by: [`commissionOptions`](#s-commissionOptions) · [`units`](#s-units)

<!-- note:fleetHold -->
What a company hull brings home a run. 0.3.52 made the PILOT's hold a
volume with no ceiling (a D-frame now holds ~22,000 hu); a company hull's
earnings are balanced on its run timetable, not its bay, so it keeps the
old curve — 400 × sqrt(rating / 30), clamped 0.5–4 — or one D-frame on the
books would out-earn a career.
<!-- /note -->

### <a id="s-fleet"></a>`fleet`

const · **exported** · L25–25

<!-- note:fleet -->
<!-- /note -->

### <a id="s-FLEET_KEY"></a>`FLEET_KEY`

const · L27–27

<!-- note:FLEET_KEY -->
the hulls are the company's, not the sky's: paid from the persisted treasury, so they persist beside it
<!-- /note -->

### <a id="s-parked"></a>`parked`

const · L28–28

<!-- note:parked -->
<!-- /note -->

### <a id="s-saveFleet"></a>`saveFleet()`

function · L29–32

- calls: [`saveCompany`](company.js.md#s-saveCompany) _js/corp/company.js_
- called by: [`@file`](#) · [`commissionHull`](#s-commissionHull) · [`decommissionHull`](#s-decommissionHull) · [`tickFleet`](#s-tickFleet)
- effects: storage.set `‹FLEET_KEY›`

<!-- note:saveFleet -->
- L30 · `try { localStorage.setItem(FLEET_KEY, JSON.stringify({ hulls: [...parked, ...fleet.hulls],` — quota, or no window
<!-- /note -->

### <a id="s-spawnHull"></a>`spawnHull(h, st, captain)`

function · L34–40

- calls: [`corpOfStation`](corps.js.md#s-corpOfStation) _js/corp/corps.js_ · [`spawnVessel`](../npc/traffic.js.md#s-spawnVessel) _js/npc/traffic.js_
- called by: [`commissionHull`](#s-commissionHull) · [`resetFleet`](#s-resetFleet)

<!-- note:spawnHull -->
Put a hull on the board at its home port, the captain in the chair.
<!-- /note -->

### <a id="s-commissionOptions"></a>`commissionOptions(order=)`

function · **exported** · L42–46

- calls: [`fleetHold`](#s-fleetHold) · [`yardPrice`](#s-yardPrice)
- via [js/ships/shipdb.js](../ships/shipdb.js.md): `SHIP_DB.filter`, `SHIP_DB.filter.map`
- called by: [`yardSection`](../console/panels/work-fleet.js.md#s-yardSection) _js/console/panels/work-fleet.js_

<!-- note:commissionOptions -->
Hulls the yard will commission for a company order: miners for extract, haulers for haul.
<!-- /note -->

### <a id="s-yardPrice"></a>`yardPrice(shipId)`

function · **exported** · L48–50

- calls: [`yardQuote`](../economy/shipcost.js.md#s-yardQuote) _js/economy/shipcost.js_ · [`shipById`](../ships/shipdb.js.md#s-shipById) _js/ships/shipdb.js_ ×2
- called by: [`commissionBlocker`](#s-commissionBlocker) · [`commissionHull`](#s-commissionHull) · [`commissionOptions`](#s-commissionOptions)

<!-- note:yardPrice -->
<!-- /note -->

### <a id="s-commissionBlocker"></a>`commissionBlocker(shipId, staffId, st=)`

function · **exported** · L52–64

- calls: [`hasCompany`](company.js.md#s-hasCompany) _js/corp/company.js_ · [`staffAt`](company.js.md#s-staffAt) _js/corp/company.js_ · [`yardPrice`](#s-yardPrice) · [`shipById`](../ships/shipdb.js.md#s-shipById) _js/ships/shipdb.js_ · [`stationById`](../station/stations.js.md#s-stationById) _js/station/stations.js_
- via [js/corp/company.js](company.js.md): `staffAt.find`
- called by: [`commissionHull`](#s-commissionHull)

<!-- note:commissionBlocker -->
Why a commission fails, or null.
<!-- /note -->

### <a id="s-commissionHull"></a>`commissionHull(shipId, staffId, order=, st=)`

function · **exported** · L66–87

- calls: [`staffAt`](company.js.md#s-staffAt) _js/corp/company.js_ · [`commissionBlocker`](#s-commissionBlocker) · [`saveFleet`](#s-saveFleet) · [`spawnHull`](#s-spawnHull) · [`yardPrice`](#s-yardPrice) · [`shipById`](../ships/shipdb.js.md#s-shipById) _js/ships/shipdb.js_ · [`logEvent`](../sim/sim.js.md#s-logEvent) _js/sim/sim.js_ · [`stationById`](../station/stations.js.md#s-stationById) _js/station/stations.js_
- via [js/corp/company.js](company.js.md): `company.book.unshift`, `company.name.replace`, `company.name.replace.toLowerCase`, `company.name.split`, `company.name.split[0].toUpperCase`, `staffAt.find`
- via [js/npc/cradle.js](../npc/cradle.js.md): `cradle.get`, `cradle.note`
- called by: [`yardSection`](../console/panels/work-fleet.js.md#s-yardSection) _js/console/panels/work-fleet.js_

<!-- note:commissionHull -->
Buy a hull from the treasury and put a settled hand in the chair.
<!-- /note -->

### <a id="s-decommissionHull"></a>`decommissionHull(id)`

function · **exported** · L89–102

- calls: [`saveFleet`](#s-saveFleet) · [`removeVessel`](../npc/traffic.js.md#s-removeVessel) _js/npc/traffic.js_ · [`logEvent`](../sim/sim.js.md#s-logEvent) _js/sim/sim.js_
- via [js/corp/company.js](company.js.md): `company.book.unshift`, `company.staff.find`
- called by: [`fleetSection`](../console/panels/work-fleet.js.md#s-fleetSection) _js/console/panels/work-fleet.js_ · [`tickFleet`](#s-tickFleet)

<!-- note:decommissionHull -->
Sell a hull back to the yard at half and return the captain to staff.
<!-- /note -->

### <a id="s-fleetReport"></a>`fleetReport()`

function · **exported** · L104–109

- via [js/npc/traffic.js](../npc/traffic.js.md): `traffic.find`
- called by: [`fleetSection`](../console/panels/work-fleet.js.md#s-fleetSection) _js/console/panels/work-fleet.js_ · [`search`](../console/panels/work-fleet.js.md#s-search) _js/console/panels/work-fleet.js_

<!-- note:fleetReport -->
What each hull has earned against what it costs.
<!-- /note -->

### <a id="s-prevCargoHook"></a>`prevCargoHook`

const · L111–111

- called by: [`@file`](#)

<!-- note:prevCargoHook -->
---- the money ----------------------------------------------------------------
<!-- /note -->

### <a id="s-h"></a>`h`

const · L115–115

<!-- note:h -->
<!-- /note -->

### <a id="s-units"></a>`units`

const · L117–117

- calls: [`fleetHold`](#s-fleetHold)

<!-- note:units -->
the timetable's cargo number is a token; the hull brings a real hold home
<!-- /note -->

### <a id="s-value"></a>`value`

const · L118–118

- calls: [`bidPrice`](../economy/economy.js.md#s-bidPrice) _js/economy/economy.js_ ×2

<!-- note:value -->
<!-- /note -->

### <a id="s-got"></a>`got`

const · L119–119

<!-- note:got -->
0.3.52: a port pays a company hull out of its own treasury, as it pays you
<!-- /note -->

### <a id="s-tickFleet"></a>`tickFleet(seconds)`

function · **exported** · L130–153

- calls: [`decommissionHull`](#s-decommissionHull) · [`saveFleet`](#s-saveFleet) · [`logEvent`](../sim/sim.js.md#s-logEvent) _js/sim/sim.js_
- via [js/corp/company.js](company.js.md): `company.book.unshift`
- called by: [`stepWorld`](../sim/sim.js.md#s-stepWorld) _js/sim/sim.js_

<!-- note:tickFleet -->
- L137 · `const c = Math.round(h.price * FLEET.upkeep);` — the captain is paid out of the crew share
- L146 · `const h = fleet.hulls[fleet.hulls.length - 1];` — the yard repossesses the newest hull
<!-- /note -->

### <a id="s-resetFleet"></a>`resetFleet()`

function · **exported** · L155–172

- calls: [`hasCompany`](company.js.md#s-hasCompany) _js/corp/company.js_ · [`spawnHull`](#s-spawnHull) · [`removeVessel`](../npc/traffic.js.md#s-removeVessel) _js/npc/traffic.js_ · [`stationById`](../station/stations.js.md#s-stationById) _js/station/stations.js_
- via [js/corp/company.js](company.js.md): `company.staff.find`
- called by: [`launchSim`](../sim/sim.js.md#s-launchSim) _js/sim/sim.js_
- effects: storage.get `‹FLEET_KEY›`

<!-- note:resetFleet -->
A new sky: clear the board, then put the company's persisted hulls back on it (this sky's) or keep them parked (the rest).

- L161 · `try { const raw = typeof localStorage !== "undefined" ? localStorage.getItem(FLEET_KEY) :` — corrupt or absent
- L162 · `if (!stored || !Array.isArray(stored.hulls) || !hasCompany()) return;` — no company: the hulls went with it
<!-- /note -->

### <a id="s-wireFleet"></a>`wireFleet()`

function · **exported** · L174–176

- called by: [`mountHud`](../ui/hud.js.md#s-mountHud) _js/ui/hud.js_

<!-- note:wireFleet -->
<!-- /note -->

## Module-level calls

- calls: [`prevCargoHook`](#s-prevCargoHook) · [`saveFleet`](#s-saveFleet)
- via [js/corp/company.js](company.js.md): `company.book.unshift`
