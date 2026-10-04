# js/ui/boardview.js

[index](../../../README.md) · 124 lines · 9 symbols · 7 imports · 2 importers

## About

<!-- note:@file -->
LIVING GALAXY — the contract desk, drawn.

0.3.18. One renderer for both places the desk is read — CONSOLE › CORP ›
BOARD and the station deck's BOARD tab — so they cannot drift apart.

The desk is nested the way a port actually posts work: DEPARTMENT (Mining &
Extraction, Freight & Logistics, Trade & Procurement, …) → ISSUER (the
port's charter holder first, then the tenant outfits with an office on the
ring) → the offers, the ones your hull can take first. Each department is a
drop-down with its count, how many you can take and the best pay; the one
your own career belongs to opens by itself. A filter row narrows it to what
fits the hull you are flying or to your career. What is open stays open
across repaints.

- L10 · `const openState = new Map();` — `${stationId}:${cat}` / `${stationId}:${cat}:${corpId}` → open?
- L11 · `let filter = "all";` — all | fit | career
<!-- /note -->

## Imports

| line | from | names | target |
|---|---|---|---|
| 1 | `../flight/pilot.js` | `pilot` | [js/flight/pilot.js](../flight/pilot.js.md) |
| 2 | `../corp/corps.js` | `corps`, `standingLabel` | [js/corp/corps.js](../corp/corps.js.md) |
| 3 | `../sim/sim.js` | `sim` | [js/sim/sim.js](../sim/sim.js.md) |
| 4 | `../economy/contracts.js` | `acceptBlocker`, `acceptContract`, `boardByCategory`, `hullFit`, `CATEGORIES`, `jobStatus`, `markTarget`, `timeLeft`, `abandonContract`, `deliverContracts`, `deliverableAt`, `contracts`, `BOARD` | [js/economy/contracts.js](../economy/contracts.js.md) |
| 5 | `../flight/autopilot.js` | `engageMiningLoop`, `engageSalvageLoop` | [js/flight/autopilot.js](../flight/autopilot.js.md) |
| 6 | `../economy/sites.js` | `siteById` | [js/economy/sites.js](../economy/sites.js.md) |
| 7 | `../economy/chains.js` | `chainReport` | [js/economy/chains.js](../economy/chains.js.md) |

## Imported by

- [js/console/panels/corp.js](../console/panels/corp.js.md) — `renderDesk`, `renderHeld`
- [js/station/stationdeck.js](../station/stationdeck.js.md) — `renderDesk`, `renderHeld`

## Exports

- [`renderDesk`](#s-renderDesk) · function — used by [js/console/panels/corp.js](../console/panels/corp.js.md), [js/station/stationdeck.js](../station/stationdeck.js.md)
- [`renderHeld`](#s-renderHeld) · function — used by [js/console/panels/corp.js](../console/panels/corp.js.md), [js/station/stationdeck.js](../station/stationdeck.js.md)
- `BOARD` — **no importer in scanned roots**

## Effects

- **dom.create** — `‹tag›` (mk:14)
- **event.listen** — `toggle on d → (inline)` (details:23)

## Symbols

### <a id="s-DOC"></a>`DOC`

const · L9–9

<!-- note:DOC -->
<!-- /note -->

### <a id="s-openState"></a>`openState`

const · L10–10

<!-- note:openState -->
<!-- /note -->

### <a id="s-filter"></a>`filter`

const · L11–11

<!-- note:filter -->
<!-- /note -->

### <a id="s-mk"></a>`mk(tag, cls, text)`

function · L13–18

- called by: [`details`](#s-details) ×2 · [`renderDesk`](#s-renderDesk) ×17 · [`renderHeld`](#s-renderHeld) ×8
- effects: dom.create `‹tag›`

<!-- note:mk -->
<!-- /note -->

### <a id="s-details"></a>`details(key, dflt, summaryKids, cls)`

function · L20–28

- calls: [`mk`](#s-mk) ×2
- called by: [`renderDesk`](#s-renderDesk) ×2
- effects: event.listen `toggle`

<!-- note:details -->
<!-- /note -->

### <a id="s-myCareer"></a>`myCareer()`

function · L30–30

- called by: [`catFor`](#s-catFor)

<!-- note:myCareer -->
<!-- /note -->

### <a id="s-catFor"></a>`catFor(cat)`

function · L31–31

- calls: [`myCareer`](#s-myCareer)
- via [js/economy/contracts.js](../economy/contracts.js.md): `CATEGORIES[…].careers.includes`
- called by: [`renderDesk`](#s-renderDesk) ×2

<!-- note:catFor -->
<!-- /note -->

### <a id="s-renderDesk"></a>`renderDesk(host, st, {…}=)`

function · **exported** · L33–98

- calls: [`standingLabel`](../corp/corps.js.md#s-standingLabel) _js/corp/corps.js_ · [`chainReport`](../economy/chains.js.md#s-chainReport) _js/economy/chains.js_ · [`acceptBlocker`](../economy/contracts.js.md#s-acceptBlocker) _js/economy/contracts.js_ ×2 · [`acceptContract`](../economy/contracts.js.md#s-acceptContract) _js/economy/contracts.js_ · [`boardByCategory`](../economy/contracts.js.md#s-boardByCategory) _js/economy/contracts.js_ · [`hullFit`](../economy/contracts.js.md#s-hullFit) _js/economy/contracts.js_ · [`catFor`](#s-catFor) ×2 · [`details`](#s-details) ×2 · [`mk`](#s-mk) ×17
- via [js/corp/corps.js](../corp/corps.js.md): `corps.find`
- called by: [`mountBoard`](../console/panels/corp.js.md#s-mountBoard) _js/console/panels/corp.js_ · [`PANELS.board`](../station/stationdeck.js.md#s-PANELS-board) _js/station/stationdeck.js_

<!-- note:renderDesk -->
Draw the offers at `st` into `host`. `btn(label, fn, on)` makes a button in
the caller's style; `onChange()` repaints the caller after an accept.

- L79 · `` if (o.chain) { const tag = mk("span", "bd-chain", o.chainIdx === 0 ? `${o.chainName} · ${o `` — 0.3.21: a chain stage wears its chain's name, and an opener says how long it runs
<!-- /note -->

### <a id="s-renderHeld"></a>`renderHeld(host, st, {…}=)`

function · **exported** · L100–122

- calls: [`abandonContract`](../economy/contracts.js.md#s-abandonContract) _js/economy/contracts.js_ · [`deliverableAt`](../economy/contracts.js.md#s-deliverableAt) _js/economy/contracts.js_ · [`deliverContracts`](../economy/contracts.js.md#s-deliverContracts) _js/economy/contracts.js_ · [`jobStatus`](../economy/contracts.js.md#s-jobStatus) _js/economy/contracts.js_ · [`markTarget`](../economy/contracts.js.md#s-markTarget) _js/economy/contracts.js_ · [`timeLeft`](../economy/contracts.js.md#s-timeLeft) _js/economy/contracts.js_ · [`siteById`](../economy/sites.js.md#s-siteById) _js/economy/sites.js_ · [`engageMiningLoop`](../flight/autopilot.js.md#s-engageMiningLoop) _js/flight/autopilot.js_ · [`engageSalvageLoop`](../flight/autopilot.js.md#s-engageSalvageLoop) _js/flight/autopilot.js_ · [`mk`](#s-mk) ×8
- called by: [`mountBoard`](../console/panels/corp.js.md#s-mountBoard) _js/console/panels/corp.js_ · [`PANELS.board`](../station/stationdeck.js.md#s-PANELS-board) _js/station/stationdeck.js_

<!-- note:renderHeld -->
The jobs in hand, with what is left to do and the buttons that go with it.

- L? · `if ((a.targets?.length && (a.progress ?? 0) < 1) || a.markId || a.boatId || a.nestId) v.ap` — 0.3.67: hunts and escorts can be marked too — the mark follows the hull
- L116 · `if (a.spot && siteById(a.id) && (sim.ship.hold[a.good] ?? 0) < a.qty) v.append(btn("MINE I` — 0.3.20: a job with a seam of its own can be handed straight to the mining loop.
  0.3.67: to the seam's ROCK — the loop carries the site, so its mark sits on
  the rock the cutter goes to first, not on the empty middle of the scatter
<!-- /note -->
