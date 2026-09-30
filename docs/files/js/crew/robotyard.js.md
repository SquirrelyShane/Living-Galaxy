# js/crew/robotyard.js

[index](../../../README.md) · 84 lines · 5 symbols · 4 imports · 1 importers

## About

<!-- note:@file -->
LIVING GALAXY — the robot yard, a station-deck fragment.

robotsPanel(body, st) → void. Catalogue cards for the port's ROBOTGEN
designs (designation, career and chassis, mass, kW, price, BUY), the
robots you own with condition bars, SERVICE ALL and SCRAP. The station
deck mounts it as PANELS.robots; CONSOLE › CREW may mount it too. Built
on the console kit (js/console/kit.js) so the rows share the glass look
and the ≥44 px tap targets. Contract: PLAN.md §4.7, §6 contract 2.
<!-- /note -->

## Imports

| line | from | names | target |
|---|---|---|---|
| 1 | `../sim/sim.js` | `sim` | [js/sim/sim.js](../sim/sim.js.md) |
| 2 | `./ledger.js` | `crew` | [js/crew/ledger.js](ledger.js.md) |
| 3 | `../console/kit.js` | `el`, `row`, `button`, `group`, `setBar`, `note`, `section` | [js/console/kit.js](../console/kit.js.md) |
| 4 | `./robots.js` | `ROBOT_SECTORS`, `robotCatalogue`, `buyRobot`, `scrapRobot`, `robotsAboard`, `serviceAll`, `servicePrice`, `robotsSummary` | [js/crew/robots.js](robots.js.md) |

## Imported by

- [js/station/stationdeck.js](../station/stationdeck.js.md) — `robotsPanel`

## Exports

- [`robotsPanel`](#s-robotsPanel) · function — used by [js/station/stationdeck.js](../station/stationdeck.js.md)
- `default` · Identifier — **no importer in scanned roots**

## Effects

_none detected_

## Symbols

### <a id="s-DOC"></a>`DOC`

const · L8–8

<!-- note:DOC -->
<!-- /note -->

### <a id="s-tone"></a>`tone(c)`

function · L10–12

- called by: [`build`](#s-build)

<!-- note:tone -->
<!-- /note -->

### <a id="s-robotsPanel"></a>`robotsPanel(body, st)`

function · **exported** · L14–21

- calls: [`robotsPanel>paint`](#s-robotsPanel-paint)

<!-- note:robotsPanel -->
<!-- /note -->

#### <a id="s-robotsPanel-paint"></a>`robotsPanel>paint()`

function · L16–19

- calls: [`build`](#s-build)
- called by: [`build`](#s-build) ×3 · [`robotsPanel`](#s-robotsPanel)

<!-- note:robotsPanel>paint -->
<!-- /note -->

### <a id="s-build"></a>`build(body, st, paint)`

function · L23–82

- calls: [`button`](../console/kit.js.md#s-button) _js/console/kit.js_ ×3 · [`el`](../console/kit.js.md#s-el) _js/console/kit.js_ ×2 · [`group`](../console/kit.js.md#s-group) _js/console/kit.js_ · [`note`](../console/kit.js.md#s-note) _js/console/kit.js_ ×4 · [`row`](../console/kit.js.md#s-row) _js/console/kit.js_ ×3 · [`section`](../console/kit.js.md#s-section) _js/console/kit.js_ ×2 · [`setBar`](../console/kit.js.md#s-setBar) _js/console/kit.js_ · [`buyRobot`](robots.js.md#s-buyRobot) _js/crew/robots.js_ · [`robotCatalogue`](robots.js.md#s-robotCatalogue) _js/crew/robots.js_ · [`robotsAboard`](robots.js.md#s-robotsAboard) _js/crew/robots.js_ · [`robotsSummary`](robots.js.md#s-robotsSummary) _js/crew/robots.js_ · [`scrapRobot`](robots.js.md#s-scrapRobot) _js/crew/robots.js_ · [`serviceAll`](robots.js.md#s-serviceAll) _js/crew/robots.js_ · [`servicePrice`](robots.js.md#s-servicePrice) _js/crew/robots.js_ · [`robotsPanel>paint`](#s-robotsPanel-paint) ×3 · [`tone`](#s-tone)
- via [js/crew/robots.js](robots.js.md): `ROBOT_SECTORS.includes`
- called by: [`robotsPanel>paint`](#s-robotsPanel-paint)

<!-- note:build -->
- L27 · `` const cat = section(yard ? `ROBOT YARD · ${st.name}` : "ROBOT YARD"); `` — ---- the catalogue ----
- L49 · `const bots = robotsAboard();` — ---- the robots you own ----
<!-- /note -->
