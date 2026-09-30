# js/console/panels/work-drones.js

[index](../../../../README.md) · 179 lines · 17 symbols · 9 imports · 1 importers

## About

<!-- note:@file -->
LIVING GALAXY — CONSOLE › WORK › DRONES: the company's drones as cards.

A straight port of the old command-deck DRONES tree (deck.js droneNode /
dronesBranch) into cards: one per drone with its status line, hold and hull,
the setup asks as chip rows (home / site / mode / work slots / routes /
guard / patrol through the ops.js setters), BEGIN · RECALL · RESUME · MARK ·
SCRAP; a build section when docked at a port with a line; the queue; and
the work board. Cards rebuild on any order (cheap), status text every frame.

- L18 · `const opened = new Set();` — drone ids whose setup rows are unfolded
<!-- /note -->

## Imports

| line | from | names | target |
|---|---|---|---|
| 1 | `../kit.js` | `el`, `section`, `note`, `row`, `button`, `group`, `chips`, `card`, `pct`, `setBar` | [js/console/kit.js](../kit.js.md) |
| 2 | `../../sim/sim.js` | `addAnchoredWaypoint`, `sim` | [js/sim/sim.js](../../sim/sim.js.md) |
| 3 | `../../station/stations.js` | `stationById` | [js/station/stations.js](../../station/stations.js.md) |
| 4 | `../../drones/roles.js` | `DRONE_ROLES`, `ASK_LABEL` | [js/drones/roles.js](../../drones/roles.js.md) |
| 5 | `../../drones/ops.js` | `droneOps`, `buildOptions`, `orderBuild`, `queueAt`, `setHome`, `setSite`, `setMode`, `setGuard`, `addPatrol`, `clearPatrol`, `assignSlot`, `setRoute`, `beginWork`, `recall`, `scrapDrone`, `homeOptions`, `siteOptions`, `haulSlots`, `guardSlots`, `tradeRoutes`, `patrolOptions`, `statusLine`, `pendingAsks`, `holdOf` | [js/drones/ops.js](../../drones/ops.js.md) |
| 9 | `../../corp/company.js` | `company`, `hasCompany` | [js/corp/company.js](../../corp/company.js.md) |
| 10 | `../../drones/board.js` | `boardReport` | [js/drones/board.js](../../drones/board.js.md) |
| 11 | `../../drones/npcdrones.js` | `npcDroneReport` | [js/drones/npcdrones.js](../../drones/npcdrones.js.md) |
| 12 | `../../economy/insurance.js` | `TIERS`, `TIER_BY_ID`, `premiumFor` | [js/economy/insurance.js](../../economy/insurance.js.md) |

## Imported by

- [js/console/panels/work.js](work.js.md) — `default`

## Exports

- `default` · ObjectExpression — used by [js/console/panels/work.js](work.js.md)

## Effects

- **dom.query** — `[data-focus="${…}"]` (mount:162) · `.trow .k small` (mount:164) · `.tbar > b` (mount:166, mount:168)

## Symbols

### <a id="s-DOC"></a>`DOC`

const · L14–14

<!-- note:DOC -->
<!-- /note -->

### <a id="s-tell"></a>`tell(msg)`

function · L17–17

- called by: [`buildSection`](#s-buildSection) · [`droneCard`](#s-droneCard)

<!-- note:tell -->
<!-- /note -->

### <a id="s-opened"></a>`opened`

const · L18–18

<!-- note:opened -->
<!-- /note -->

### <a id="s-askRow"></a>`askRow(body, label, hint, opts, current, pick)`

function · L20–26

- calls: [`chips`](../kit.js.md#s-chips) _js/console/kit.js_ · [`note`](../kit.js.md#s-note) _js/console/kit.js_ · [`row`](../kit.js.md#s-row) _js/console/kit.js_
- called by: [`droneCard`](#s-droneCard) ×6

<!-- note:askRow -->
One chip row for an ask: label, current pick, the options, the setter.
<!-- /note -->

#### <a id="s-askRow-onPick"></a>`askRow.onPick(id)`

prop · L25–25

<!-- note:askRow.onPick -->
<!-- /note -->

### <a id="s-droneCard"></a>`droneCard(u, render, ctx)`

function · L28–79

- calls: [`button`](../kit.js.md#s-button) _js/console/kit.js_ ×7 · [`card`](../kit.js.md#s-card) _js/console/kit.js_ · [`chips`](../kit.js.md#s-chips) _js/console/kit.js_ · [`group`](../kit.js.md#s-group) _js/console/kit.js_ · [`note`](../kit.js.md#s-note) _js/console/kit.js_ · [`pct`](../kit.js.md#s-pct) _js/console/kit.js_ · [`row`](../kit.js.md#s-row) _js/console/kit.js_ ×4 · [`setBar`](../kit.js.md#s-setBar) _js/console/kit.js_ ×2 · [`askRow`](#s-askRow) ×6 · [`mount>render`](#s-mount-render) ×12 · [`tell`](#s-tell) · [`assignSlot`](../../drones/ops.js.md#s-assignSlot) _js/drones/ops.js_ · [`beginWork`](../../drones/ops.js.md#s-beginWork) _js/drones/ops.js_ ×2 · [`clearPatrol`](../../drones/ops.js.md#s-clearPatrol) _js/drones/ops.js_ · [`guardSlots`](../../drones/ops.js.md#s-guardSlots) _js/drones/ops.js_ · [`haulSlots`](../../drones/ops.js.md#s-haulSlots) _js/drones/ops.js_ · [`holdOf`](../../drones/ops.js.md#s-holdOf) _js/drones/ops.js_ ×2 · [`homeOptions`](../../drones/ops.js.md#s-homeOptions) _js/drones/ops.js_ · [`patrolOptions`](../../drones/ops.js.md#s-patrolOptions) _js/drones/ops.js_ · [`pendingAsks`](../../drones/ops.js.md#s-pendingAsks) _js/drones/ops.js_ · [`recall`](../../drones/ops.js.md#s-recall) _js/drones/ops.js_ · [`scrapDrone`](../../drones/ops.js.md#s-scrapDrone) _js/drones/ops.js_ · [`setGuard`](../../drones/ops.js.md#s-setGuard) _js/drones/ops.js_ · [`setHome`](../../drones/ops.js.md#s-setHome) _js/drones/ops.js_ · [`setMode`](../../drones/ops.js.md#s-setMode) _js/drones/ops.js_ · [`setRoute`](../../drones/ops.js.md#s-setRoute) _js/drones/ops.js_ · [`setSite`](../../drones/ops.js.md#s-setSite) _js/drones/ops.js_ · [`siteOptions`](../../drones/ops.js.md#s-siteOptions) _js/drones/ops.js_ · [`statusLine`](../../drones/ops.js.md#s-statusLine) _js/drones/ops.js_ · [`tradeRoutes`](../../drones/ops.js.md#s-tradeRoutes) _js/drones/ops.js_ · [`addAnchoredWaypoint`](../../sim/sim.js.md#s-addAnchoredWaypoint) _js/sim/sim.js_ · [`stationById`](../../station/stations.js.md#s-stationById) _js/station/stations.js_
- via [js/drones/roles.js](../../drones/roles.js.md): `ASK_LABEL[…].toLowerCase`
- via [js/drones/ops.js](../../drones/ops.js.md): `guardSlots.map`, `homeOptions.filter`, `homeOptions.filter.slice`, `homeOptions.filter.slice.map`, `patrolOptions.slice`, `patrolOptions.slice.map`, `siteOptions.slice`, `siteOptions.slice.map`
- called by: [`mount>render`](#s-mount-render)

<!-- note:droneCard -->
- L49 · `const home = stationById(u.home)?.name ?? "—";` — the asks, as chip rows
<!-- /note -->

#### <a id="s-droneCard-onPick"></a>`droneCard.onPick(id)`

prop · L75–75

- calls: [`mount>render`](#s-mount-render) · [`addPatrol`](../../drones/ops.js.md#s-addPatrol) _js/drones/ops.js_ · [`patrolOptions`](../../drones/ops.js.md#s-patrolOptions) _js/drones/ops.js_

<!-- note:droneCard.onPick -->
<!-- /note -->

### <a id="s-buildSection"></a>`buildSection(render)`

function · L81–123

- calls: [`button`](../kit.js.md#s-button) _js/console/kit.js_ · [`chips`](../kit.js.md#s-chips) _js/console/kit.js_ · [`note`](../kit.js.md#s-note) _js/console/kit.js_ ×3 · [`row`](../kit.js.md#s-row) _js/console/kit.js_ ×5 · [`section`](../kit.js.md#s-section) _js/console/kit.js_ · [`mount>render`](#s-mount-render) · [`tell`](#s-tell) · [`hasCompany`](../../corp/company.js.md#s-hasCompany) _js/corp/company.js_ ×2 · [`buildOptions`](../../drones/ops.js.md#s-buildOptions) _js/drones/ops.js_ · [`orderBuild`](../../drones/ops.js.md#s-orderBuild) _js/drones/ops.js_ · [`queueAt`](../../drones/ops.js.md#s-queueAt) _js/drones/ops.js_ · [`premiumFor`](../../economy/insurance.js.md#s-premiumFor) _js/economy/insurance.js_ · [`stationById`](../../station/stations.js.md#s-stationById) _js/station/stations.js_ ×2
- via [js/economy/insurance.js](../../economy/insurance.js.md): `TIERS.map`, `TIER_BY_ID[…].name.toLowerCase`
- called by: [`mount>render`](#s-mount-render)

<!-- note:buildSection -->
- L94 · `const cover = droneOps.cover ?? null;` — 0.3.33 — cover is chosen once and applies to the next commission, so a
  phone is not asked for a tier on every build row. A drone is the one
  hull in this game that has always been able to die for good, which is
  why it is the one that most wanted insuring.
<!-- /note -->

#### <a id="s-buildSection-onPick"></a>`buildSection.onPick(id)`

prop · L106–106

- calls: [`mount>render`](#s-mount-render)

<!-- note:buildSection.onPick -->
<!-- /note -->

### <a id="s-boardSection"></a>`boardSection()`

function · L125–136

- calls: [`note`](../kit.js.md#s-note) _js/console/kit.js_ · [`row`](../kit.js.md#s-row) _js/console/kit.js_ ×2 · [`section`](../kit.js.md#s-section) _js/console/kit.js_ · [`boardReport`](../../drones/board.js.md#s-boardReport) _js/drones/board.js_ · [`npcDroneReport`](../../drones/npcdrones.js.md#s-npcDroneReport) _js/drones/npcdrones.js_
- via [js/drones/ops.js](../../drones/ops.js.md): `droneOps.units.find`
- called by: [`mount>render`](#s-mount-render)

<!-- note:boardSection -->
<!-- /note -->

### <a id="s-mount"></a>`mount(root, ctx)`

prop · L143–173

- calls: [`el`](../kit.js.md#s-el) _js/console/kit.js_ · [`pct`](../kit.js.md#s-pct) _js/console/kit.js_ ×2 · [`mount>render`](#s-mount-render) ×2 · [`mount>signature`](#s-mount-signature) · [`holdOf`](../../drones/ops.js.md#s-holdOf) _js/drones/ops.js_ · [`statusLine`](../../drones/ops.js.md#s-statusLine) _js/drones/ops.js_
- effects: dom.query `[data-focus="${…}"]` · dom.query `.trow .k small` · dom.query `.tbar > b`

<!-- note:mount -->
<!-- /note -->

#### <a id="s-mount-signature"></a>`mount>signature()`

function · L147–147

- calls: [`pendingAsks`](../../drones/ops.js.md#s-pendingAsks) _js/drones/ops.js_
- via [js/drones/ops.js](../../drones/ops.js.md): `droneOps.units.map`, `droneOps.units.map.join`
- called by: [`mount`](#s-mount) · [`mount>render`](#s-mount-render)

<!-- note:mount>signature -->
<!-- /note -->

#### <a id="s-mount-render"></a>`mount>render()`

function · L148–156

- calls: [`note`](../kit.js.md#s-note) _js/console/kit.js_ · [`section`](../kit.js.md#s-section) _js/console/kit.js_ · [`boardSection`](#s-boardSection) · [`buildSection`](#s-buildSection) · [`droneCard`](#s-droneCard) · [`mount>signature`](#s-mount-signature)
- called by: [`buildSection`](#s-buildSection) · [`buildSection.onPick`](#s-buildSection-onPick) · [`droneCard`](#s-droneCard) ×12 · [`droneCard.onPick`](#s-droneCard-onPick) · [`mount`](#s-mount) ×2

<!-- note:mount>render -->
<!-- /note -->

### <a id="s-paint"></a>`paint()`

prop · L174–174

<!-- note:paint -->
<!-- /note -->

### <a id="s-unmount"></a>`unmount()`

prop · L175–175

<!-- note:unmount -->
<!-- /note -->

### <a id="s-search"></a>`search()`

prop · L176–178

- via [js/drones/ops.js](../../drones/ops.js.md): `droneOps.units.map`

<!-- note:search -->
<!-- /note -->

#### <a id="s-search-status"></a>`search.status()`

prop · L177–177

<!-- note:search.status -->
<!-- /note -->
