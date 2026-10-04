# js/console/panels/nav.js

[index](../../../../README.md) · 373 lines · 28 symbols · 17 imports · 1 importers

## About

<!-- note:@file -->
LIVING GALAXY — CONSOLE › NAV: TARGETS · SURVEY · AUTOPILOT · MARKS · CONTACTS

The locked body and every body nearest-first, the mission autopilot's
status and one-step orders, waypoints with live range/bearing/elevation,
and the sensor contacts whose relations the turret rules read.
<!-- /note -->

## Imports

| line | from | names | target |
|---|---|---|---|
| 1 | `./aria-core.js` | `mountCore` | [js/console/panels/aria-core.js](aria-core.js.md) |
| 2 | `../kit.js` | `button`, `el`, `group`, `note`, `row`, `section`, `fmtDist` | [js/console/kit.js](../kit.js.md) |
| 3 | `../../world/bodies.js` | `BODIES`, `bodyById`, `bodyPosition`, `dist3`, `tempLabel` | [js/world/bodies.js](../../world/bodies.js.md) |
| 4 | `../../flight/turrets.js` | `contacts` | [js/flight/turrets.js](../../flight/turrets.js.md) |
| 5 | `../../flight/ship.js` | `TURRET_MODES`, `forwardOf`, `rightOf`, `upOf` | [js/flight/ship.js](../../flight/ship.js.md) |
| 6 | `../../world/anchors.js` | `anchorHint` | [js/world/anchors.js](../../world/anchors.js.md) |
| 7 | `../../sim/sim.js` | `addBodyWaypoint`, `addWaypoint`, `cycleRelation`, `removeWaypoint`, `requestScan`, `selectBody`, `setActiveWaypoint`, `setRelation`, `sim`, `stationStatus`, `toggleWarp`, `warpBlock`, `warpStatus`, `waypointPosition` | [js/sim/sim.js](../../sim/sim.js.md) |
| 8 | `../../mission/run.js` | `mission`, `missionStatusLine`, `startMission`, `stopMission`, `pauseMission`, `resumeMission`, `answerAsk` | [js/mission/run.js](../../mission/run.js.md) |
| 9 | `../../mission/script.js` | `oneStep` | [js/mission/script.js](../../mission/script.js.md) |
| 10 | `../../flight/autopilot.js` | `*` as `AP` | [js/flight/autopilot.js](../../flight/autopilot.js.md) |
| 11 | `../../world/field.js` | `nearbyRocks`, `inBelt` | [js/world/field.js](../../world/field.js.md) |
| 12 | `../../bodygen/body.js` | `assayRock` | [js/bodygen/body.js](../../bodygen/body.js.md) |
| 13 | `../../bodygen/classes.js` | `CLASSES` | [js/bodygen/classes.js](../../bodygen/classes.js.md) |
| 14 | `../../flight/ship.js` | `shipFx` | [js/flight/ship.js](../../flight/ship.js.md) |
| 15 | `../../aria/aria.js` | `ariaTakeConn`, `ariaRelease`, `ariaHasConn`, `ariaWatchReport`, `preferenceReport`, `adviceReport` | [js/aria/aria.js](../../aria/aria.js.md) |
| 16 | `../../station/stations.js` | `stationById` | [js/station/stations.js](../../station/stations.js.md) |
| 17 | `../../economy/materials.js` | `goodName` | [js/economy/materials.js](../../economy/materials.js.md) |

## Imported by

- [js/console/console.js](../console.js.md) — `default`

## Exports

- [`lockedRock`](#s-lockedRock) · function — **no importer in scanned roots**
- `default` · ObjectExpression — used by [js/console/console.js](../console.js.md)

## Effects

- **dom.query** — `button` (mountAutopilot:160) · `[data-wp]` (mountMarks:208) · `[data-cid]` (mountContacts:257)
- **input.key** — `Control` (mountAutopilot:105)

## Symbols

### <a id="s-markHint"></a>`markHint(w)`

function · L19–19

- calls: [`anchorHint`](../../world/anchors.js.md#s-anchorHint) _js/world/anchors.js_
- called by: [`mountMarks>rebuild`](#s-mountMarks-rebuild) · [`search`](#s-search)

<!-- note:markHint -->
0.3.67: what a mark follows, in words
<!-- /note -->

### <a id="s-autopilot"></a>`autopilot`

const · L21–21

<!-- note:autopilot -->
`nearestSeam` is a primitive package C exports from autopilot.js; reach it through the namespace so the panel loads either way.
<!-- /note -->

### <a id="s-_p"></a>`_p`

const · L23–23

<!-- note:_p -->
<!-- /note -->

### <a id="s-lockedRef"></a>`lockedRef()`

function · L25–25

- calls: [`bodyById`](../../world/bodies.js.md#s-bodyById) _js/world/bodies.js_
- called by: [`mountAutopilot`](#s-mountAutopilot) ×2 · [`mountTargets`](#s-mountTargets)

<!-- note:lockedRef -->
---- TARGETS ---------------------------------------------------------------
<!-- /note -->

### <a id="s-mountTargets"></a>`mountTargets(root, push)`

function · L27–92

- calls: [`button`](../kit.js.md#s-button) _js/console/kit.js_ ×5 · [`el`](../kit.js.md#s-el) _js/console/kit.js_ ×2 · [`fmtDist`](../kit.js.md#s-fmtDist) _js/console/kit.js_ ×2 · [`group`](../kit.js.md#s-group) _js/console/kit.js_ ×2 · [`row`](../kit.js.md#s-row) _js/console/kit.js_ ×9 · [`section`](../kit.js.md#s-section) _js/console/kit.js_ ×2 · [`lockedRef`](#s-lockedRef) · [`startMission`](../../mission/run.js.md#s-startMission) _js/mission/run.js_ · [`oneStep`](../../mission/script.js.md#s-oneStep) _js/mission/script.js_ · [`addBodyWaypoint`](../../sim/sim.js.md#s-addBodyWaypoint) _js/sim/sim.js_ · [`requestScan`](../../sim/sim.js.md#s-requestScan) _js/sim/sim.js_ · [`selectBody`](../../sim/sim.js.md#s-selectBody) _js/sim/sim.js_ · [`toggleWarp`](../../sim/sim.js.md#s-toggleWarp) _js/sim/sim.js_ · [`warpBlock`](../../sim/sim.js.md#s-warpBlock) _js/sim/sim.js_ · [`warpStatus`](../../sim/sim.js.md#s-warpStatus) _js/sim/sim.js_ · [`bodyById`](../../world/bodies.js.md#s-bodyById) _js/world/bodies.js_ · [`bodyPosition`](../../world/bodies.js.md#s-bodyPosition) _js/world/bodies.js_ ×2 · [`dist3`](../../world/bodies.js.md#s-dist3) _js/world/bodies.js_ ×2 · [`tempLabel`](../../world/bodies.js.md#s-tempLabel) _js/world/bodies.js_
- via [js/world/bodies.js](../../world/bodies.js.md): `BODIES.map`
- via [js/sim/sim.js](../../sim/sim.js.md): `sim.scanned.has`

<!-- note:mountTargets -->
- L83 · `const order = sorted.map((x) => x.r.id).join("|");` — only re-seat the rows when the order actually changes — an append per row per tick is a reflow storm
<!-- /note -->

### <a id="s-CAPS"></a>`CAPS`

const · L94–94

<!-- note:CAPS -->
---- AUTOPILOT -------------------------------------------------------------
<!-- /note -->

### <a id="s-WARPS"></a>`WARPS`

const · L95–95

<!-- note:WARPS -->
<!-- /note -->

### <a id="s-mountAutopilot"></a>`mountAutopilot(root, push, ctx)`

function · L97–164

- calls: [`button`](../kit.js.md#s-button) _js/console/kit.js_ ×13 · [`el`](../kit.js.md#s-el) _js/console/kit.js_ ×4 · [`group`](../kit.js.md#s-group) _js/console/kit.js_ ×5 · [`note`](../kit.js.md#s-note) _js/console/kit.js_ · [`row`](../kit.js.md#s-row) _js/console/kit.js_ ×12 · [`section`](../kit.js.md#s-section) _js/console/kit.js_ ×2 · [`lockedRef`](#s-lockedRef) ×2 · [`mountAutopilot>defaults`](#s-mountAutopilot-defaults) ×3 · [`mountAutopilot>go`](#s-mountAutopilot-go) ×4 · [`engageSalvageLoop`](../../flight/autopilot.js.md#s-engageSalvageLoop) _js/flight/autopilot.js_ · [`nearestSeam`](../../flight/autopilot.js.md#s-nearestSeam) _js/flight/autopilot.js_ · [`answerAsk`](../../mission/run.js.md#s-answerAsk) _js/mission/run.js_ ×3 · [`missionStatusLine`](../../mission/run.js.md#s-missionStatusLine) _js/mission/run.js_ · [`pauseMission`](../../mission/run.js.md#s-pauseMission) _js/mission/run.js_ · [`resumeMission`](../../mission/run.js.md#s-resumeMission) _js/mission/run.js_ · [`stopMission`](../../mission/run.js.md#s-stopMission) _js/mission/run.js_ · [`stationStatus`](../../sim/sim.js.md#s-stationStatus) _js/sim/sim.js_
- effects: input.key `Control` · dom.query `button`

<!-- note:mountAutopilot -->
<!-- /note -->

#### <a id="s-mountAutopilot-defaults"></a>`mountAutopilot>defaults()`

function · L98–98

- called by: [`mountAutopilot`](#s-mountAutopilot) ×3 · [`mountAutopilot>go`](#s-mountAutopilot-go)

<!-- note:mountAutopilot>defaults -->
<!-- /note -->

#### <a id="s-mountAutopilot-go"></a>`mountAutopilot>go(op, ref)`

function · L127–127

- calls: [`mountAutopilot>defaults`](#s-mountAutopilot-defaults) · [`startMission`](../../mission/run.js.md#s-startMission) _js/mission/run.js_ · [`oneStep`](../../mission/script.js.md#s-oneStep) _js/mission/script.js_
- called by: [`mountAutopilot`](#s-mountAutopilot) ×4

<!-- note:mountAutopilot>go -->
<!-- /note -->

### <a id="s-mountMarks"></a>`mountMarks(root, push)`

function · L166–222

- calls: [`button`](../kit.js.md#s-button) _js/console/kit.js_ · [`el`](../kit.js.md#s-el) _js/console/kit.js_ ×2 · [`fmtDist`](../kit.js.md#s-fmtDist) _js/console/kit.js_ · [`group`](../kit.js.md#s-group) _js/console/kit.js_ · [`note`](../kit.js.md#s-note) _js/console/kit.js_ · [`row`](../kit.js.md#s-row) _js/console/kit.js_ · [`section`](../kit.js.md#s-section) _js/console/kit.js_ ×2 · [`mountMarks>rebuild`](#s-mountMarks-rebuild) ×3 · [`forwardOf`](../../flight/ship.js.md#s-forwardOf) _js/flight/ship.js_ · [`rightOf`](../../flight/ship.js.md#s-rightOf) _js/flight/ship.js_ · [`upOf`](../../flight/ship.js.md#s-upOf) _js/flight/ship.js_ · [`addWaypoint`](../../sim/sim.js.md#s-addWaypoint) _js/sim/sim.js_ · [`waypointPosition`](../../sim/sim.js.md#s-waypointPosition) _js/sim/sim.js_
- via [js/sim/sim.js](../../sim/sim.js.md): `sim.waypoints.find`
- effects: dom.query `[data-wp]`

<!-- note:mountMarks -->
---- MARKS -----------------------------------------------------------------
<!-- /note -->

#### <a id="s-mountMarks-rebuild"></a>`mountMarks>rebuild()`

function · L182–199

- calls: [`button`](../kit.js.md#s-button) _js/console/kit.js_ ×2 · [`el`](../kit.js.md#s-el) _js/console/kit.js_ ×2 · [`group`](../kit.js.md#s-group) _js/console/kit.js_ · [`row`](../kit.js.md#s-row) _js/console/kit.js_ · [`markHint`](#s-markHint) · [`mountMarks>rebuild`](#s-mountMarks-rebuild) ×2 · [`removeWaypoint`](../../sim/sim.js.md#s-removeWaypoint) _js/sim/sim.js_ · [`setActiveWaypoint`](../../sim/sim.js.md#s-setActiveWaypoint) _js/sim/sim.js_
- via [js/sim/sim.js](../../sim/sim.js.md): `sim.waypoints.map`, `sim.waypoints.map.join`
- called by: [`mountMarks`](#s-mountMarks) ×3 · [`mountMarks>rebuild`](#s-mountMarks-rebuild) ×2

<!-- note:mountMarks>rebuild -->
<!-- /note -->

### <a id="s-mountContacts"></a>`mountContacts(root, push)`

function · L224–267

- calls: [`button`](../kit.js.md#s-button) _js/console/kit.js_ ×3 · [`el`](../kit.js.md#s-el) _js/console/kit.js_ ×3 · [`fmtDist`](../kit.js.md#s-fmtDist) _js/console/kit.js_ · [`group`](../kit.js.md#s-group) _js/console/kit.js_ ×2 · [`note`](../kit.js.md#s-note) _js/console/kit.js_ · [`row`](../kit.js.md#s-row) _js/console/kit.js_ ×3 · [`section`](../kit.js.md#s-section) _js/console/kit.js_ ×2 · [`mountContacts>bulk`](#s-mountContacts-bulk) ×2 · [`cycleRelation`](../../sim/sim.js.md#s-cycleRelation) _js/sim/sim.js_
- via [js/flight/ship.js](../../flight/ship.js.md): `TURRET_MODES.find`
- via [js/flight/turrets.js](../../flight/turrets.js.md): `contacts.find`, `contacts.map`, `contacts.map.join`
- effects: dom.query `[data-cid]`

<!-- note:mountContacts -->
---- CONTACTS --------------------------------------------------------------
<!-- /note -->

#### <a id="s-mountContacts-bulk"></a>`mountContacts>bulk(rel)`

function · L266–266

- calls: [`setRelation`](../../sim/sim.js.md#s-setRelation) _js/sim/sim.js_
- called by: [`mountContacts`](#s-mountContacts) ×2

<!-- note:mountContacts>bulk -->
<!-- /note -->

### <a id="s-mountAria"></a>`mountAria(root)`

function · L269–307

- calls: [`adviceReport`](../../aria/aria.js.md#s-adviceReport) _js/aria/aria.js_ · [`ariaRelease`](../../aria/aria.js.md#s-ariaRelease) _js/aria/aria.js_ · [`ariaTakeConn`](../../aria/aria.js.md#s-ariaTakeConn) _js/aria/aria.js_ · [`ariaWatchReport`](../../aria/aria.js.md#s-ariaWatchReport) _js/aria/aria.js_ · [`preferenceReport`](../../aria/aria.js.md#s-preferenceReport) _js/aria/aria.js_ · [`button`](../kit.js.md#s-button) _js/console/kit.js_ ×2 · [`note`](../kit.js.md#s-note) _js/console/kit.js_ ×2 · [`row`](../kit.js.md#s-row) _js/console/kit.js_ ×8 · [`section`](../kit.js.md#s-section) _js/console/kit.js_ ×3 · [`goodName`](../../economy/materials.js.md#s-goodName) _js/economy/materials.js_ · [`stationById`](../../station/stations.js.md#s-stationById) _js/station/stations.js_
- via [js/aria/aria.js](../../aria/aria.js.md): `preferenceReport.slice`

<!-- note:mountAria -->
---- ARIA ------------------------------------------------------------------

What the ship's core has learned from watching you, and the button that
lets it fly. It is not a second autopilot — it holds the conn the way a crew
captain does — and the core it flies with is the one that has been taking a
label off your own hands since the first time you took the stick.
<!-- /note -->

### <a id="s-lockedRock"></a>`lockedRock()`

function · **exported** · L309–313

- calls: [`inBelt`](../../world/field.js.md#s-inBelt) _js/world/field.js_ · [`nearbyRocks`](../../world/field.js.md#s-nearbyRocks) _js/world/field.js_
- via [js/world/field.js](../../world/field.js.md): `nearbyRocks.find`
- called by: [`mountSurvey`](#s-mountSurvey) · [`search.status~5`](#s-search-status-5)

<!-- note:lockedRock -->
---- SURVEY ----------------------------------------------------------------

What the locked rock actually is. The class, the mineral suite, and a
prospector's ticket priced off what a cutter would recover — the same
numbers the canopy is painting, because both come out of js/bodygen/.

Without the assay deck refit you get the headline and the class, which is
what a survey set can tell from a spectrum. With it you get the whole suite.
<!-- /note -->

### <a id="s-mountSurvey"></a>`mountSurvey(root)`

function · L315–349

- calls: [`assayRock`](../../bodygen/body.js.md#s-assayRock) _js/bodygen/body.js_ · [`note`](../kit.js.md#s-note) _js/console/kit.js_ ×4 · [`row`](../kit.js.md#s-row) _js/console/kit.js_ ×8 · [`section`](../kit.js.md#s-section) _js/console/kit.js_ ×2 · [`lockedRock`](#s-lockedRock) · [`inBelt`](../../world/field.js.md#s-inBelt) _js/world/field.js_
- via [js/flight/ship.js](../../flight/ship.js.md): `shipFx.fx`

<!-- note:mountSurvey -->
<!-- /note -->

### <a id="s-SUBS"></a>`SUBS`

const · L351–351

<!-- note:SUBS -->
---- the panel -------------------------------------------------------------
<!-- /note -->

### <a id="s-mount"></a>`mount(root, ctx)`

prop · L358–358

- calls: [`mountCore`](aria-core.js.md#s-mountCore) _js/console/panels/aria-core.js_

<!-- note:mount -->
<!-- /note -->

### <a id="s-paint"></a>`paint()`

prop · L359–359

<!-- note:paint -->
<!-- /note -->

### <a id="s-unmount"></a>`unmount()`

prop · L360–360

<!-- note:unmount -->
<!-- /note -->

### <a id="s-search"></a>`search()`

prop · L361–372

- calls: [`markHint`](#s-markHint)

<!-- note:search -->
<!-- /note -->

#### <a id="s-search-status"></a>`search.status()`

prop · L363–363

<!-- note:search.status -->
<!-- /note -->

#### <a id="s-search-status-2"></a>`search.status~2()`

prop · L364–364

<!-- note:search.status~2 -->
<!-- /note -->

#### <a id="s-search-run"></a>`search.run()`

prop · L366–366

- calls: [`toggleWarp`](../../sim/sim.js.md#s-toggleWarp) _js/sim/sim.js_

<!-- note:search.run -->
<!-- /note -->

#### <a id="s-search-status-3"></a>`search.status~3()`

prop · L367–367

- calls: [`missionStatusLine`](../../mission/run.js.md#s-missionStatusLine) _js/mission/run.js_

<!-- note:search.status~3 -->
<!-- /note -->

#### <a id="s-search-status-4"></a>`search.status~4()`

prop · L369–369

- calls: [`ariaHasConn`](../../aria/aria.js.md#s-ariaHasConn) _js/aria/aria.js_ · [`ariaWatchReport`](../../aria/aria.js.md#s-ariaWatchReport) _js/aria/aria.js_

<!-- note:search.status~4 -->
<!-- /note -->

#### <a id="s-search-status-5"></a>`search.status~5()`

prop · L370–370

- calls: [`lockedRock`](#s-lockedRock)

<!-- note:search.status~5 -->
<!-- /note -->
