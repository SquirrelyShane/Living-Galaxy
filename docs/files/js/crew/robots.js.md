# js/crew/robots.js

[index](../../../README.md) · 226 lines · 31 symbols · 6 imports · 4 importers

## About

<!-- note:@file -->
LIVING GALAXY — robot crew.

A yard at an industrial, civilian or military port prints one design per
kind from the ROBOTGEN catalogue (robotgen/spec.js, the same generator the
drone lines use). A bought robot is a crew member with `robot: true`: it
stands a station like a hand does (its complexId puts it in a room via
deckplan.stationRoomFor), but it draws no wage, has no morale worth
moving, courts nobody and cannot hold the conn. What it wants instead is
power — Σ kW lands on ship.extraDraw — and maintenance: condition falls
with the hull's wear backlog and comes back under an engineer, or at a
yard for credits. Robots persist per sky: they are property.
Contract: PLAN.md §4.7.

- L21 · `export const ROBOT_WEAR = 0.02;` — condition/s × (1 + duties.wear), halved by the charging bay
- L22 · `export const ROBOT_REPAIR = 0.05;` — condition/s an engineer at Engineering restores to each other robot
- L23 · `export const ROBOT_IDLE_AT = 30;` — below this a robot is off the rota until serviced
- L24 · `export const SERVICE_CR = 60;` — per point of condition at a yard
<!-- /note -->

## Imports

| line | from | names | target |
|---|---|---|---|
| 1 | `../robotgen/spec.js` | `generateRobot` | [js/robotgen/spec.js](../robotgen/spec.js.md) |
| 2 | `./ledger.js` | `crew` | [js/crew/ledger.js](ledger.js.md) |
| 3 | `../sim/sim.js` | `sim` | [js/sim/sim.js](../sim/sim.js.md) |
| 4 | `../economy/upgrades.js` | `fx` | [js/economy/upgrades.js](../economy/upgrades.js.md) |
| 5 | `./duties.js` | `duties` | [js/crew/duties.js](duties.js.md) |
| 6 | `../npc/cradle.js` | `PRONOUNS` | [js/npc/cradle.js](../npc/cradle.js.md) |

## Imported by

- [js/console/panels/ship.js](../console/panels/ship.js.md) — `robotsSummary`
- [js/crew/robotyard.js](robotyard.js.md) — `ROBOT_SECTORS`, `robotCatalogue`, `buyRobot`, `scrapRobot`, `robotsAboard`, `serviceAll`, `servicePrice`, `robotsSummary`
- [js/sim/sim.js](../sim/sim.js.md) — `loadRobots`, `tickRobots`
- test/robots.test.mjs _(outside js/)_ — `ROBOT_KINDS`, `ROBOT_SECTORS`, `ROBOT_IDLE_AT`, `robotCatalogue`, `buyRobot`, `scrapRobot`, `tickRobots`, `robotsSummary`, `robotsAboard`, `serviceAll`, `servicePrice`, `saveRobots`, `loadRobots`, `ROBOTS_KEY`, `robots`

## Exports

- [`ROBOT_KINDS`](#s-ROBOT_KINDS) · const — used by test/robots.test.mjs
- [`ROBOT_PRICE_K`](#s-ROBOT_PRICE_K) · const — **no importer in scanned roots**
- [`ROBOT_SECTORS`](#s-ROBOT_SECTORS) · const — used by [js/crew/robotyard.js](robotyard.js.md), test/robots.test.mjs
- [`ROBOT_WEAR`](#s-ROBOT_WEAR) · const — **no importer in scanned roots**
- [`ROBOT_REPAIR`](#s-ROBOT_REPAIR) · const — **no importer in scanned roots**
- [`ROBOT_IDLE_AT`](#s-ROBOT_IDLE_AT) · const — used by test/robots.test.mjs
- [`SERVICE_CR`](#s-SERVICE_CR) · const — **no importer in scanned roots**
- [`SCRAP_REFUND`](#s-SCRAP_REFUND) · const — **no importer in scanned roots**
- [`robots`](#s-robots) · const — used by test/robots.test.mjs
- [`robotDesign`](#s-robotDesign) · function — **no importer in scanned roots**
- [`robotCatalogue`](#s-robotCatalogue) · function — used by [js/crew/robotyard.js](robotyard.js.md), test/robots.test.mjs
- [`buyRobot`](#s-buyRobot) · function — used by [js/crew/robotyard.js](robotyard.js.md), test/robots.test.mjs
- [`scrapRobot`](#s-scrapRobot) · function — used by [js/crew/robotyard.js](robotyard.js.md), test/robots.test.mjs
- [`robotsAboard`](#s-robotsAboard) · function — used by [js/crew/robotyard.js](robotyard.js.md), test/robots.test.mjs
- [`engineerAboard`](#s-engineerAboard) · function — **no importer in scanned roots**
- [`tickRobots`](#s-tickRobots) · function — used by [js/sim/sim.js](../sim/sim.js.md), test/robots.test.mjs
- [`servicePrice`](#s-servicePrice) · function — used by [js/crew/robotyard.js](robotyard.js.md), test/robots.test.mjs
- [`serviceAll`](#s-serviceAll) · function — used by [js/crew/robotyard.js](robotyard.js.md), test/robots.test.mjs
- [`robotsSummary`](#s-robotsSummary) · function — used by [js/console/panels/ship.js](../console/panels/ship.js.md), [js/crew/robotyard.js](robotyard.js.md), test/robots.test.mjs
- [`ROBOTS_KEY`](#s-ROBOTS_KEY) · function — used by test/robots.test.mjs
- [`saveRobots`](#s-saveRobots) · function — used by test/robots.test.mjs
- [`loadRobots`](#s-loadRobots) · function — used by [js/sim/sim.js](../sim/sim.js.md), test/robots.test.mjs

## Effects

- **storage.get** — `‹ROBOTS_KEY()›` (loadRobots:209)
- **storage.set** — `‹ROBOTS_KEY()›` (saveRobots:201)

## Symbols

### <a id="s-ROBOT_KINDS"></a>`ROBOT_KINDS`

const · **exported** · L8–16

<!-- note:ROBOT_KINDS -->
kind → robotgen role, complexId (→ station via deckplan.stationRoomFor), power, base price
<!-- /note -->

### <a id="s-ROBOT_PRICE_K"></a>`ROBOT_PRICE_K`

const · **exported** · L18–18

<!-- note:ROBOT_PRICE_K -->
<!-- /note -->

### <a id="s-ROBOT_SECTORS"></a>`ROBOT_SECTORS`

const · **exported** · L19–19

<!-- note:ROBOT_SECTORS -->
<!-- /note -->

### <a id="s-ROBOT_WEAR"></a>`ROBOT_WEAR`

const · **exported** · L21–21

<!-- note:ROBOT_WEAR -->
the rates, per second of sim time
<!-- /note -->

### <a id="s-ROBOT_REPAIR"></a>`ROBOT_REPAIR`

const · **exported** · L22–22

<!-- note:ROBOT_REPAIR -->
<!-- /note -->

### <a id="s-ROBOT_IDLE_AT"></a>`ROBOT_IDLE_AT`

const · **exported** · L23–23

<!-- note:ROBOT_IDLE_AT -->
<!-- /note -->

### <a id="s-SERVICE_CR"></a>`SERVICE_CR`

const · **exported** · L24–24

<!-- note:SERVICE_CR -->
<!-- /note -->

### <a id="s-SCRAP_REFUND"></a>`SCRAP_REFUND`

const · **exported** · L25–25

<!-- note:SCRAP_REFUND -->
<!-- /note -->

### <a id="s-robots"></a>`robots`

const · **exported** · L27–27

<!-- note:robots -->
{ n: lifetime buys this sky (ids), sinceSave: seconds }
<!-- /note -->

### <a id="s-SECTOR_PALETTES"></a>`SECTOR_PALETTES`

const · L29–35

<!-- note:SECTOR_PALETTES -->
a port's livery follows its sector, as the drone lines do
<!-- /note -->

### <a id="s-hash"></a>`hash(s)`

function · L37–41

- called by: [`robotDesign`](#s-robotDesign)

<!-- note:hash -->
<!-- /note -->

### <a id="s-DESIGN_CACHE"></a>`DESIGN_CACHE`

const · L43–43

<!-- note:DESIGN_CACHE -->
the generator is not cheap: remember the designs already printed
<!-- /note -->

### <a id="s-DESIGN_CACHE_MAX"></a>`DESIGN_CACHE_MAX`

const · L44–44

<!-- note:DESIGN_CACHE_MAX -->
<!-- /note -->

### <a id="s-robotDesign"></a>`robotDesign(kind, seed, sector=)`

function · **exported** · L46–71

- calls: [`hash`](#s-hash) · [`generateRobot`](../robotgen/spec.js.md#s-generateRobot) _js/robotgen/spec.js_
- called by: [`buyRobot`](#s-buyRobot) · [`robotCatalogue`](#s-robotCatalogue)

<!-- note:robotDesign -->
The yard's tag for one (kind, seed, sector): designation, chassis, mass, kW, cost.
<!-- /note -->

### <a id="s-priceOf"></a>`priceOf(K, design)`

function · L73–75

- called by: [`buyRobot`](#s-buyRobot) · [`robotCatalogue`](#s-robotCatalogue)

<!-- note:priceOf -->
<!-- /note -->

### <a id="s-berthsUsedAboard"></a>`berthsUsedAboard()`

function · L77–79

- called by: [`blockerFor`](#s-blockerFor)

<!-- note:berthsUsedAboard -->
<!-- /note -->

### <a id="s-blockerFor"></a>`blockerFor(K, st, price)`

function · L81–86

- calls: [`berthsUsedAboard`](#s-berthsUsedAboard)
- called by: [`buyRobot`](#s-buyRobot) · [`robotCatalogue`](#s-robotCatalogue)

<!-- note:blockerFor -->
What buying `kind` here would run into, or null.
<!-- /note -->

### <a id="s-robotCatalogue"></a>`robotCatalogue(st, seed=)`

function · **exported** · L88–94

- calls: [`blockerFor`](#s-blockerFor) · [`priceOf`](#s-priceOf) · [`robotDesign`](#s-robotDesign)
- called by: [`build`](robotyard.js.md#s-build) _js/crew/robotyard.js_

<!-- note:robotCatalogue -->
→ [{ kind, label, designation, spec, price, kw, blocker }] — one design per (kind, port).
<!-- /note -->

### <a id="s-note"></a>`note(msg)`

function · L96–99

- via [js/crew/ledger.js](ledger.js.md): `crew.log.unshift`
- called by: [`buyRobot`](#s-buyRobot) · [`scrapRobot`](#s-scrapRobot) · [`serviceAll`](#s-serviceAll)

<!-- note:note -->
<!-- /note -->

### <a id="s-buyRobot"></a>`buyRobot(kind, st)`

function · **exported** · L101–126

- calls: [`blockerFor`](#s-blockerFor) · [`note`](#s-note) · [`priceOf`](#s-priceOf) · [`robotDesign`](#s-robotDesign) · [`saveRobots`](#s-saveRobots)
- via [js/crew/ledger.js](ledger.js.md): `crew.aboard.push`
- called by: [`build`](robotyard.js.md#s-build) _js/crew/robotyard.js_

<!-- note:buyRobot -->
Buys one robot of `kind` at port `st`. → null | error.
<!-- /note -->

### <a id="s-scrapRobot"></a>`scrapRobot(id)`

function · **exported** · L128–138

- calls: [`note`](#s-note) · [`saveRobots`](#s-saveRobots)
- via [js/crew/ledger.js](ledger.js.md): `crew.aboard.findIndex`, `crew.aboard.splice`
- called by: [`build`](robotyard.js.md#s-build) _js/crew/robotyard.js_

<!-- note:scrapRobot -->
Scraps a robot for 40% of what it cost. → null | error
<!-- /note -->

### <a id="s-robotsAboard"></a>`robotsAboard()`

function · **exported** · L140–142

- via [js/crew/ledger.js](ledger.js.md): `crew.aboard.filter`
- called by: [`robotsSummary`](#s-robotsSummary) · [`saveRobots`](#s-saveRobots) · [`serviceAll`](#s-serviceAll) · [`servicePrice`](#s-servicePrice) · [`tickRobots`](#s-tickRobots) · [`build`](robotyard.js.md#s-build) _js/crew/robotyard.js_

<!-- note:robotsAboard -->
<!-- /note -->

### <a id="s-isEngineer"></a>`isEngineer(m)`

function · L144–147

<!-- note:isEngineer -->
Standing Engineering and able to work: a human in a fit mood or a robot with a working frame.
<!-- /note -->

### <a id="s-engineerAboard"></a>`engineerAboard()`

function · **exported** · L149–151

- via [js/crew/ledger.js](ledger.js.md): `crew.aboard.some`

<!-- note:engineerAboard -->
<!-- /note -->

### <a id="s-tickRobots"></a>`tickRobots(dt)`

function · **exported** · L153–172

- calls: [`robotsAboard`](#s-robotsAboard) · [`saveRobots`](#s-saveRobots) · [`fx`](../economy/upgrades.js.md#s-fx) _js/economy/upgrades.js_ ×2
- via [js/crew/ledger.js](ledger.js.md): `crew.aboard.filter`
- called by: [`stepCareer`](../sim/sim.js.md#s-stepCareer) _js/sim/sim.js_

<!-- note:tickRobots -->
Called from the sim's career step beside tickCrew, with scaled seconds.
Writes ship.extraDraw, wears the frames, flags the ones that need a yard.

- L164 · `if (m.condition < 100 && fixers.some((o) => o !== m)) m.condition = Math.min(100, m.condit` — an engineer at Engineering restores the others — a robot cannot service itself
<!-- /note -->

### <a id="s-servicePrice"></a>`servicePrice()`

function · **exported** · L174–176

- calls: [`robotsAboard`](#s-robotsAboard)
- called by: [`serviceAll`](#s-serviceAll) · [`build`](robotyard.js.md#s-build) _js/crew/robotyard.js_

<!-- note:servicePrice -->
What SERVICE ALL would cost here: 60 cr a point over every robot.
<!-- /note -->

### <a id="s-serviceAll"></a>`serviceAll(st)`

function · **exported** · L178–188

- calls: [`note`](#s-note) · [`robotsAboard`](#s-robotsAboard) · [`saveRobots`](#s-saveRobots) · [`servicePrice`](#s-servicePrice)
- called by: [`build`](robotyard.js.md#s-build) _js/crew/robotyard.js_

<!-- note:serviceAll -->
Docked at a yard: every robot back to 100. → null | error
<!-- /note -->

### <a id="s-robotsSummary"></a>`robotsSummary()`

function · **exported** · L190–195

- calls: [`robotsAboard`](#s-robotsAboard) · [`fx`](../economy/upgrades.js.md#s-fx) _js/economy/upgrades.js_
- called by: [`mountStatus`](../console/panels/ship.js.md#s-mountStatus) _js/console/panels/ship.js_ · [`build`](robotyard.js.md#s-build) _js/crew/robotyard.js_

<!-- note:robotsSummary -->
→ { n, kw, worst: { name, condition } | null }
<!-- /note -->

### <a id="s-ROBOTS_KEY"></a>`ROBOTS_KEY()`

function · **exported** · L197–197

- called by: [`loadRobots`](#s-loadRobots) · [`saveRobots`](#s-saveRobots)

<!-- note:ROBOTS_KEY -->
---- persistence: robots are property, per sky ----------------------------
<!-- /note -->

### <a id="s-saveRobots"></a>`saveRobots()`

function · **exported** · L199–204

- calls: [`ROBOTS_KEY`](#s-ROBOTS_KEY) · [`robotsAboard`](#s-robotsAboard)
- called by: [`buyRobot`](#s-buyRobot) · [`scrapRobot`](#s-scrapRobot) · [`serviceAll`](#s-serviceAll) · [`tickRobots`](#s-tickRobots)
- effects: storage.set `‹ROBOTS_KEY()›`

<!-- note:saveRobots -->
- L202 · `} catch {` — quota, or no window
<!-- /note -->

### <a id="s-loadRobots"></a>`loadRobots()`

function · **exported** · L206–226

- calls: [`ROBOTS_KEY`](#s-ROBOTS_KEY)
- via [js/crew/ledger.js](ledger.js.md): `crew.aboard.push`, `crew.aboard.some`
- called by: [`launchSim`](../sim/sim.js.md#s-launchSim) _js/sim/sim.js_
- effects: storage.get `‹ROBOTS_KEY()›`

<!-- note:loadRobots -->
Puts this sky's robots back aboard. Called by launchSim after resetCrew(). Returns the members restored.
<!-- /note -->
