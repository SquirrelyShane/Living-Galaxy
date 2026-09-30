# js/mission/tradeops.js

[index](../../../README.md) · 115 lines · 5 symbols · 5 imports · 1 importers

## About

<!-- note:@file -->
LIVING GALAXY — the mission's trade ops: the route a TRADE RUN flies, BUY and SELL.

0.3.19. Split out of mission/run.js (the console/crew/mission tree keeps
every file under 600 lines). run.js builds these with its own mission
state, `note` and the autopilot, and plugs BUY and SELL into its EXEC table
and pickRoute into its target resolver — no import back into run.js.

The round's route (`mission.trade`) is picked at the source dock and kept
to the sell, so "the route's buyer" is the port the cargo was bought FOR.
SELL "route" sells that and only that; SELL "all" sells what is OURS — a
haul contract's consignment is somebody else's cargo. BUY with no good
asks for the best route whose source is this port.
<!-- /note -->

## Imports

| line | from | names | target |
|---|---|---|---|
| 1 | `../sim/sim.js` | `sim`, `sellAllOre`, `tradeBuy`, `tradeSell`, `logEvent` | [js/sim/sim.js](../sim/sim.js.md) |
| 2 | `../flight/ship.js` | `holdRoom`, `roomFor` | [js/flight/ship.js](../flight/ship.js.md) |
| 3 | `../station/stations.js` | `stationById` | [js/station/stations.js](../station/stations.js.md) |
| 4 | `../economy/traderoutes.js` | `bestRoute`, `sellable`, `routeLine` | [js/economy/traderoutes.js](../economy/traderoutes.js.md) |
| 5 | `../economy/contracts.js` | `deliverContracts`, `deliverableAt`, `jobForSite` | [js/economy/contracts.js](../economy/contracts.js.md) |

## Imported by

- [js/mission/run.js](run.js.md) — `makeTradeOps`

## Exports

- [`makeTradeOps`](#s-makeTradeOps) · function — used by [js/mission/run.js](run.js.md)

## Effects

_none detected_

## Symbols

### <a id="s-makeTradeOps"></a>`makeTradeOps({…})`

function · **exported** · L7–115

- called by: [`T`](run.js.md#s-T) _js/mission/run.js_

<!-- note:makeTradeOps -->
<!-- /note -->

#### <a id="s-makeTradeOps-pickRoute"></a>`makeTradeOps>pickRoute(peek=)`

function · L8–19

- calls: [`bestRoute`](../economy/traderoutes.js.md#s-bestRoute) _js/economy/traderoutes.js_ · [`routeLine`](../economy/traderoutes.js.md#s-routeLine) _js/economy/traderoutes.js_ · [`holdRoom`](../flight/ship.js.md#s-holdRoom) _js/flight/ship.js_ · [`logEvent`](../sim/sim.js.md#s-logEvent) _js/sim/sim.js_

<!-- note:makeTradeOps>pickRoute -->
The round's trade route: picked once at the top of a round (the source
dock) and kept to the sell, so "the route's buyer" is the port the cargo
was bought FOR, not whichever port scores best for a half-empty hold.
`peek` looks without keeping it (startMission's undock question).
<!-- /note -->

#### <a id="s-makeTradeOps-SELL"></a>`makeTradeOps.SELL(s)`

prop · L23–57

- calls: [`sellable`](../economy/traderoutes.js.md#s-sellable) _js/economy/traderoutes.js_ ×3 · [`logEvent`](../sim/sim.js.md#s-logEvent) _js/sim/sim.js_ ×2 · [`sellAllOre`](../sim/sim.js.md#s-sellAllOre) _js/sim/sim.js_ · [`tradeSell`](../sim/sim.js.md#s-tradeSell) _js/sim/sim.js_ ×3 · [`stationById`](../station/stations.js.md#s-stationById) _js/station/stations.js_

<!-- note:makeTradeOps.SELL -->
- L32 · `else if (what === "all") { for (const [k, q] of Object.entries(sellable(ship))) refused =` — "all" is everything that is OURS: a haul contract's consignment is somebody else's cargo (0.3.19)
<!-- /note -->

#### <a id="s-makeTradeOps-DELIVER"></a>`makeTradeOps.DELIVER(s)`

prop · L58–83

- calls: [`deliverableAt`](../economy/contracts.js.md#s-deliverableAt) _js/economy/contracts.js_ · [`deliverContracts`](../economy/contracts.js.md#s-deliverContracts) _js/economy/contracts.js_ · [`jobForSite`](../economy/contracts.js.md#s-jobForSite) _js/economy/contracts.js_ ×2 · [`logEvent`](../sim/sim.js.md#s-logEvent) _js/sim/sim.js_ · [`stationById`](../station/stations.js.md#s-stationById) _js/station/stations.js_

<!-- note:makeTradeOps.DELIVER -->
0.3.72 — close what is due here. A job loop (MINE IT) carries its site: once
that job is paid the loop has done its work and ends after this round;
short of cargo, it goes round again for the rest.
<!-- /note -->

#### <a id="s-makeTradeOps-BUY"></a>`makeTradeOps.BUY(s)`

prop · L84–112

- calls: [`bestRoute`](../economy/traderoutes.js.md#s-bestRoute) _js/economy/traderoutes.js_ · [`holdRoom`](../flight/ship.js.md#s-holdRoom) _js/flight/ship.js_ ×2 · [`roomFor`](../flight/ship.js.md#s-roomFor) _js/flight/ship.js_ ×2 · [`tradeBuy`](../sim/sim.js.md#s-tradeBuy) _js/sim/sim.js_ · [`stationById`](../station/stations.js.md#s-stationById) _js/station/stations.js_

<!-- note:makeTradeOps.BUY -->
- L92 · `const t = mission.trade;` — the route's cargo, as much as the hold, the purse and the shelf allow
- L98 · `const r = bestRoute({ only: { from: st.id }, pos: st, room: holdRoom(ship) });` — best margin FROM HERE: the best route whose source is this port (0.3.19 — it used to ask one
  "best buyer" port chosen for the hold as it was before buying, which was nearly always this one)
- L103 · `if (good && good !== "route") qty = Math.min(qty, Math.floor(roomFor(ship, good)));` — 0.3.52: what fits of this good
<!-- /note -->
