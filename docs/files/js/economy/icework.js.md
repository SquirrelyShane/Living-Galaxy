# js/economy/icework.js

[index](../../../README.md) · 141 lines · 13 symbols · 5 imports · 5 importers

## About

<!-- note:@file -->
LIVING GALAXY experimental — the ice works.

Ice in the hold is a rock. Water is a commodity, breathing gas is life, and
the clathrates carry methane, ammonia and nitrogen worth twice what the ice
sells for. The works is the drill bench that does the conversion, running
off the mining bus while you fly.

Fit: the works needs drills. A hull whose grammar carries drill modules or
a drillhead nose qualifies on its own; otherwise every mining-complex hand
aboard counts as one hand drill on the bench. No drills, no works.

Modes (AUX 4 on dash page 3, or the Cargo tab):
  MELT     water_ice → water (×0.9, the refine table's own number). While
           melting, if the cabin is pressurized and O2 is under the
           setpoint, a trickle of water is cracked to breathing gas —
           electrolysis roughly doubles the O2 recharge and burns ~0.03
           water/s. Deep-field endurance is a tank of snow.
  EXTRACT  gas ices → their gas: methane clathrate → methane (×0.75),
           ammonia ice → ammonia (×0.72), nitrogen ice → nitrogen (×0.8).
           Water ice is left alone in this mode.

Throughput: 0.7 units/s per drill, × the pilot's `mine` modifier (race,
specialisation, a manned works on the deck). Draws 16 kW on the mining bus;
the bench pauses in a brownout rather than browning you out further.

- L22 · `const RATE_PER_DRILL = 0.7;` — units of ice per second
- L23 · `const DRAW_KW = 16;` — battery drain while the bench runs
- L24 · `const ELECTROLYSIS_WATER = 0.03;` — water per second cracked for O2
- L25 · `const ELECTROLYSIS_O2 = 2.4;` — O2 points per second on top of life support
<!-- /note -->

## Imports

| line | from | names | target |
|---|---|---|---|
| 1 | `../sim/sim.js` | `currentShipId`, `sim`, `logEvent` | [js/sim/sim.js](../sim/sim.js.md) |
| 2 | `../flight/ship.js` | `addCargo` | [js/flight/ship.js](../flight/ship.js.md) |
| 3 | `../ships/shipdb.js` | `shipById` | [js/ships/shipdb.js](../ships/shipdb.js.md) |
| 4 | `../crew/ledger.js` | `crew` | [js/crew/ledger.js](../crew/ledger.js.md) |
| 5 | `./materials.js` | `baseValue`, `goodName` | [js/economy/materials.js](materials.js.md) |

## Imported by

- [js/console/panels/market.js](../console/panels/market.js.md) — `MODES`, `cycleIceworkMode`, `icework`, `iceworkFit`
- [js/npc/captain.js](../npc/captain.js.md) — `benchValue`, `iceworkFit`
- [js/sim/sim.js](../sim/sim.js.md) — `benchValue`
- [js/sim/sim.js](../sim/sim.js.md) — `resetIcework`, `stepIcework`
- [js/ui/hud.js](../ui/hud.js.md) — `wireIcework`

## Exports

- [`MODES`](#s-MODES) · const — used by [js/console/panels/market.js](../console/panels/market.js.md)
- [`icework`](#s-icework) · const — used by [js/console/panels/market.js](../console/panels/market.js.md)
- [`iceworkFit`](#s-iceworkFit) · function — used by [js/console/panels/market.js](../console/panels/market.js.md), [js/npc/captain.js](../npc/captain.js.md)
- [`cycleIceworkMode`](#s-cycleIceworkMode) · function — used by [js/console/panels/market.js](../console/panels/market.js.md)
- [`stepIcework`](#s-stepIcework) · function — used by [js/sim/sim.js](../sim/sim.js.md)
- [`benchValue`](#s-benchValue) · function — used by [js/npc/captain.js](../npc/captain.js.md), [js/sim/sim.js](../sim/sim.js.md)
- [`resetIcework`](#s-resetIcework) · function — used by [js/sim/sim.js](../sim/sim.js.md)
- [`wireIcework`](#s-wireIcework) · function — used by [js/ui/hud.js](../ui/hud.js.md)

## Effects

- **dom.id** — `aux-ice` (wireIcework:129) · `aux-ice-st` (wireIcework:130)
- **event.listen** — `click on btn → (inline)` (wireIcework:131)
- **timer** — `setInterval` (wireIcework:133)

## Symbols

### <a id="s-MODES"></a>`MODES`

const · **exported** · L7–11

<!-- note:MODES -->
<!-- /note -->

### <a id="s-RECIPES"></a>`RECIPES`

const · L13–20

<!-- note:RECIPES -->
what each mode converts: [from, to, per] — `per` is the refine table's own ratio
<!-- /note -->

### <a id="s-RATE_PER_DRILL"></a>`RATE_PER_DRILL`

const · L22–22

<!-- note:RATE_PER_DRILL -->
<!-- /note -->

### <a id="s-DRAW_KW"></a>`DRAW_KW`

const · L23–23

<!-- note:DRAW_KW -->
<!-- /note -->

### <a id="s-ELECTROLYSIS_WATER"></a>`ELECTROLYSIS_WATER`

const · L24–24

<!-- note:ELECTROLYSIS_WATER -->
<!-- /note -->

### <a id="s-ELECTROLYSIS_O2"></a>`ELECTROLYSIS_O2`

const · L25–25

<!-- note:ELECTROLYSIS_O2 -->
<!-- /note -->

### <a id="s-icework"></a>`icework`

const · **exported** · L27–32

<!-- note:icework -->
- L29 · `ran: 0,` — units processed this session (for the batch log)
- L31 · `product: "",` — last thing produced, for the AUX readout
<!-- /note -->

### <a id="s-iceworkFit"></a>`iceworkFit()`

function · **exported** · L34–47

- calls: [`shipById`](../ships/shipdb.js.md#s-shipById) _js/ships/shipdb.js_ · [`currentShipId`](../sim/sim.js.md#s-currentShipId) _js/sim/sim.js_
- via [js/crew/ledger.js](../crew/ledger.js.md): `crew.aboard.filter`
- called by: [`mountHold`](../console/panels/market.js.md#s-mountHold) _js/console/panels/market.js_ · [`benchValue`](#s-benchValue) · [`cycleIceworkMode`](#s-cycleIceworkMode) · [`stepIcework`](#s-stepIcework) · [`wireIcework`](#s-wireIcework) · [`snapshot`](../npc/captain.js.md#s-snapshot) _js/npc/captain.js_

<!-- note:iceworkFit -->
Drills on the bench: the hull's own, or mining hands with hand drills.
<!-- /note -->

### <a id="s-cycleIceworkMode"></a>`cycleIceworkMode()`

function · **exported** · L49–62

- calls: [`iceworkFit`](#s-iceworkFit) · [`logEvent`](../sim/sim.js.md#s-logEvent) _js/sim/sim.js_
- called by: [`mountHold`](../console/panels/market.js.md#s-mountHold) _js/console/panels/market.js_ · [`wireIcework`](#s-wireIcework)

<!-- note:cycleIceworkMode -->
<!-- /note -->

### <a id="s-stepIcework"></a>`stepIcework(dt)`

function · **exported** · L64–106

- calls: [`iceworkFit`](#s-iceworkFit) · [`goodName`](materials.js.md#s-goodName) _js/economy/materials.js_ ×2 · [`addCargo`](../flight/ship.js.md#s-addCargo) _js/flight/ship.js_ · [`logEvent`](../sim/sim.js.md#s-logEvent) _js/sim/sim.js_
- via [js/economy/materials.js](materials.js.md): `goodName.toUpperCase`

<!-- note:stepIcework -->
Called from the sim tick (sim seconds).

- L66 · `if (ship) { ship.benchDraw = 0; ship.benchOn = icework.mode !== "off"; }` — billed on the mining bus by stepPower next tick — never straight off the battery
- L68 · `if (!ship.powered?.mining) { icework.product = "MINING BUS COLD"; return; }` — shed or vented
- L69 · `if (ship.charge < 120) { icework.product = "LOW POWER"; return; }` — wait out the brownout
- L91 · `break;` — one recipe at a time; the bench is small
- L94 · `if (icework.mode === "melt" && ship.pressurized && ship.powered.lifeSupport !== false) {` — electrolysis: melting crews crack a trickle of water into breathing gas
<!-- /note -->

### <a id="s-benchValue"></a>`benchValue(oreId)`

function · **exported** · L108–117

- calls: [`iceworkFit`](#s-iceworkFit) · [`baseValue`](materials.js.md#s-baseValue) _js/economy/materials.js_ ×2
- called by: [`snapshot`](../npc/captain.js.md#s-snapshot) _js/npc/captain.js_ · [`tryAssay`](../sim/sim.js.md#s-tryAssay) _js/sim/sim.js_ ×2

<!-- note:benchValue -->
What one unit of an ore is worth to THIS ship: raw value, or the bench's
product value when the works is fitted and has a recipe for it. The
captain's forecaster prices icy fields with this.
<!-- /note -->

### <a id="s-resetIcework"></a>`resetIcework()`

function · **exported** · L119–125

- called by: [`launchSim`](../sim/sim.js.md#s-launchSim) _js/sim/sim.js_

<!-- note:resetIcework -->
<!-- /note -->

### <a id="s-wireIcework"></a>`wireIcework()`

function · **exported** · L127–141

- calls: [`cycleIceworkMode`](#s-cycleIceworkMode) · [`iceworkFit`](#s-iceworkFit)
- called by: [`mountHud`](../ui/hud.js.md#s-mountHud) _js/ui/hud.js_
- effects: dom.id `aux-ice` · dom.id `aux-ice-st` · event.listen `click` · timer `setInterval`

<!-- note:wireIcework -->
Dash AUX wiring + console access. Safe to call once from hud mount.
<!-- /note -->
