# js/ui/map.js

[index](../../../README.md) · 899 lines · 46 symbols · 14 imports · 2 importers

## About

<!-- note:@file -->
LIVING GALAXY — system chart.

An interactive plan view of the ecliptic. Drag to pan, pinch or use the
buttons to zoom, tap a body to pull up its readout and act on it. Moons
fade in as you zoom into their parent's system, because at full-system
scale they would be a smear on the planet.

The chart also draws the warp lane: the straight line the core actually
needs, coloured by whether anything is sitting in it.

- L31 · `const S = 320;` — svg user units, square
- L33 · `const MIN_SPAN = 2500;` — closest zoom, world units across
<!-- /note -->

## Imports

| line | from | names | target |
|---|---|---|---|
| 1 | `../world/bodies.js` | `BEACONS`, `BODIES`, `beaconPosition`, `bodyById`, `bodyPosition`, `currentSystem`, `dist3`, `starBody` | [js/world/bodies.js](../world/bodies.js.md) |
| 2 | `../sim/sim.js` | `acquireLock`, `addBodyWaypoint`, `addAnchoredWaypoint`, `addWaypointAt`, `removeWaypoint`, `warpNodeById`, `losBlocker`, `selectBody`, `sim`, `toggleWarp`, `warpBlock`, `warpDestination`, `waypointPosition` | [js/sim/sim.js](../sim/sim.js.md) |
| 17 | `../audio/index.js` | `VIEW` | [js/audio/index.js](../audio/index.js.md) |
| 18 | `../flight/ship.js` | `forwardOf` | [js/flight/ship.js](../flight/ship.js.md) |
| 19 | `../station/stations.js` | `stations` | [js/station/stations.js](../station/stations.js.md) |
| 20 | `../world/events/holes.js` | `holes`, `holeRadii` | [js/world/events/holes.js](../world/events/holes.js.md) |
| 21 | `../npc/traffic.js` | `vesselStatus`, `captainLine`, `HOSTILE_ROLES`, `LAW_ROLES` | [js/npc/traffic.js](../npc/traffic.js.md) |
| 22 | `../flight/contacts.js` | `knownContacts` | [js/flight/contacts.js](../flight/contacts.js.md) |
| 24 | `../economy/materials.js` | `SECTORS` | [js/economy/materials.js](../economy/materials.js.md) |
| 25 | `../corp/corps.js` | `corpOfVessel`, `standingLabel` | [js/corp/corps.js](../corp/corps.js.md) |
| 26 | `../flight/probes.js` | `beltBandAt`, `launchProbe`, `probes`, `remoteScan` | [js/flight/probes.js](../flight/probes.js.md) |
| 27 | `../flight/autopilot.js` | `autopilot`, `disengageAutopilot`, `engageAutopilot`, `engageAutoWarp`, `engageMiningLoop` | [js/flight/autopilot.js](../flight/autopilot.js.md) |
| 28 | `../mission/run.js` | `mission` | [js/mission/run.js](../mission/run.js.md) |
| 29 | `../console/console.js` | `openConsole` | [js/console/console.js](../console/console.js.md) |

## Imported by

- [js/console/console.js](../console/console.js.md) — `openMapDirectory`
- [js/ui/hud.js](hud.js.md) — `mountMap`

## Exports

- [`openMapDirectory`](#s-openMapDirectory) · function — used by [js/console/console.js](../console/console.js.md)
- [`mountMap`](#s-mountMap) · function — used by [js/ui/hud.js](hud.js.md)

## Effects

- **dom.create** — `div` (mountMap:254, mountMap>drawDirectory:451, mountMap:489) · `button` (mountMap>openMenu:329, mountMap:371, mountMap>drawDirectory:458)
- **dom.id** — `map-svg` (mountMap:73) · `sheet-empty` (mountMap:76) · `sheet-body` (mountMap:77) · `sheet-name` (mountMap:78) · `sheet-sub` (mountMap:79) · `sheet-tier` (mountMap:80) · `sheet-stats` (mountMap:81) · `sheet-lane` (mountMap:82) · `map-dir` (mountMap:367) · `dir-chips` (mountMap:368) · `dir-rows` (mountMap:369) · `map-list` (mountMap:377) · `map-in` (mountMap:482) · `map-out` (mountMap:483) · `map-fit` (mountMap:484) · `map-sheet` (mountMap:493) · `sheet-lock` (mountMap:509) · `sheet-warp` (mountMap:512, mountMap:893, mountMap:895) · `sheet-mark` (mountMap:519, mountMap:896) · `sheet-centre` (mountMap:537) · `map-scale` (mountMap:881) · `map-title` (mountMap:884)
- **dom.query** — `.chart-plot` (mountMap:74) · `#cm-title` (mountMap:259) · `#cm-sub` (mountMap:260) · `#cm-acts` (mountMap:261) · `#cm-close` (mountMap:262) · `#plan-loop` (mountMap>planPaint:496, mountMap>planPaint:497, mountMap:500) · `#plan-edit` (mountMap:499)
- **event.listen** — `pointerdown on svg → (inline)` (mountMap:156) · `pointermove on svg → (inline)` (mountMap:168) · `pointerup on svg → release` (mountMap:196) · `pointercancel on svg → release` (mountMap:197) · `wheel on svg → (inline)` (mountMap:198) · `click on menu.querySelector() → closeMenu` (mountMap:262) · `pointerdown on menu → (inline)` (mountMap:263) · `click on b → (inline)` (mountMap>openMenu:333, mountMap:374) · `click on document.getElementById() → (inline)` (mountMap:377, mountMap:482, mountMap:483, mountMap:484, mountMap:509, mountMap:512 +2) · `click on row → (inline)` (mountMap>drawDirectory:461) · `click on planRow.querySelector() → (inline)` (mountMap:499, mountMap:500)

## Symbols

### <a id="s-S"></a>`S`

const · L31–31

<!-- note:S -->
<!-- /note -->

### <a id="s-PAD"></a>`PAD`

const · L32–32

<!-- note:PAD -->
<!-- /note -->

### <a id="s-MIN_SPAN"></a>`MIN_SPAN`

const · L33–33

<!-- note:MIN_SPAN -->
<!-- /note -->

### <a id="s-MAX_SPAN"></a>`MAX_SPAN`

const · L34–34

<!-- note:MAX_SPAN -->
<!-- /note -->

### <a id="s-_p"></a>`_p`

const · L36–36

<!-- note:_p -->
<!-- /note -->

### <a id="s-_q"></a>`_q`

const · L37–37

<!-- note:_q -->
<!-- /note -->

### <a id="s-fmtDist"></a>`fmtDist(d)`

function · L39–44

- called by: [`mountMap`](#s-mountMap) · [`mountMap>drawDirectory`](#s-mountMap-drawDirectory) · [`mountMap>drawSheet`](#s-mountMap-drawSheet) ×5 · [`mountMap>openMenu`](#s-mountMap-openMenu) ×4 · [`mountMap>tapAt`](#s-mountMap-tapAt)

<!-- note:fmtDist -->
<!-- /note -->

### <a id="s-niceSpan"></a>`niceSpan(u)`

function · L46–50

- called by: [`mountMap`](#s-mountMap)

<!-- note:niceSpan -->
<!-- /note -->

### <a id="s-KIND_FILL"></a>`KIND_FILL`

const · L52–61

<!-- note:KIND_FILL -->
<!-- /note -->

### <a id="s-_openDir"></a>`_openDir`

const · L63–63

- called by: [`openMapDirectory`](#s-openMapDirectory)

<!-- note:_openDir -->
the command deck opens the directory straight onto a filter
<!-- /note -->

### <a id="s-_store"></a>`_store`

const · L64–64

<!-- note:_store -->
<!-- /note -->

### <a id="s-openMapDirectory"></a>`openMapDirectory(filter=)`

function · **exported** · L65–69

- calls: [`_openDir`](#s-_openDir)
- via [js/audio/index.js](../audio/index.js.md): `VIEW.map`
- called by: [`registerStaticJumps.run~2`](../console/console.js.md#s-registerStaticJumps-run-2) _js/console/console.js_

<!-- note:openMapDirectory -->
<!-- /note -->

### <a id="s-mountMap"></a>`mountMap(store)`

function · **exported** · L71–899

- calls: [`openConsole`](../console/console.js.md#s-openConsole) _js/console/console.js_ · [`disengageAutopilot`](../flight/autopilot.js.md#s-disengageAutopilot) _js/flight/autopilot.js_ · [`engageAutoWarp`](../flight/autopilot.js.md#s-engageAutoWarp) _js/flight/autopilot.js_ · [`engageMiningLoop`](../flight/autopilot.js.md#s-engageMiningLoop) _js/flight/autopilot.js_ · [`knownContacts`](../flight/contacts.js.md#s-knownContacts) _js/flight/contacts.js_ · [`beltBandAt`](../flight/probes.js.md#s-beltBandAt) _js/flight/probes.js_ · [`forwardOf`](../flight/ship.js.md#s-forwardOf) _js/flight/ship.js_ ×2 · [`addAnchoredWaypoint`](../sim/sim.js.md#s-addAnchoredWaypoint) _js/sim/sim.js_ · [`addBodyWaypoint`](../sim/sim.js.md#s-addBodyWaypoint) _js/sim/sim.js_ · [`losBlocker`](../sim/sim.js.md#s-losBlocker) _js/sim/sim.js_ ×2 · [`removeWaypoint`](../sim/sim.js.md#s-removeWaypoint) _js/sim/sim.js_ ×2 · [`selectBody`](../sim/sim.js.md#s-selectBody) _js/sim/sim.js_ · [`toggleWarp`](../sim/sim.js.md#s-toggleWarp) _js/sim/sim.js_ · [`warpBlock`](../sim/sim.js.md#s-warpBlock) _js/sim/sim.js_ · [`warpDestination`](../sim/sim.js.md#s-warpDestination) _js/sim/sim.js_ · [`warpNodeById`](../sim/sim.js.md#s-warpNodeById) _js/sim/sim.js_ · [`waypointPosition`](../sim/sim.js.md#s-waypointPosition) _js/sim/sim.js_ ×3 · [`fmtDist`](#s-fmtDist) · [`mountMap>centreOn`](#s-mountMap-centreOn) ×3 · [`mountMap>closeMenu`](#s-mountMap-closeMenu) ×2 · [`mountMap>drawDirectory`](#s-mountMap-drawDirectory) ×3 · [`mountMap>drawSheet`](#s-mountMap-drawSheet) ×3 · [`mountMap>fitShip`](#s-mountMap-fitShip) ×2 · [`mountMap>fitSystem`](#s-mountMap-fitSystem) · [`mountMap>laneState`](#s-mountMap-laneState) · [`mountMap>moonsVisible`](#s-mountMap-moonsVisible) ×2 · [`mountMap>nodeFor`](#s-mountMap-nodeFor) · [`mountMap>planPaint`](#s-mountMap-planPaint) ×4 · [`mountMap>pxPerUnit`](#s-mountMap-pxPerUnit) ×2 · [`mountMap>svgEsc`](#s-mountMap-svgEsc) ×3 · [`mountMap>svgPoint`](#s-mountMap-svgPoint) ×3 · [`mountMap>uToWorld`](#s-mountMap-uToWorld) · [`mountMap>worldToU`](#s-mountMap-worldToU) ×20 · [`mountMap>zoom`](#s-mountMap-zoom) ×3 · [`niceSpan`](#s-niceSpan) · [`beaconPosition`](../world/bodies.js.md#s-beaconPosition) _js/world/bodies.js_ · [`bodyById`](../world/bodies.js.md#s-bodyById) _js/world/bodies.js_ ×2 · [`bodyPosition`](../world/bodies.js.md#s-bodyPosition) _js/world/bodies.js_ ×4 · [`holeRadii`](../world/events/holes.js.md#s-holeRadii) _js/world/events/holes.js_
- via [js/sim/sim.js](../sim/sim.js.md): `sim.beaconsGot.has`, `sim.scanned.has`, `sim.waypoints.find`, `sim.waypoints.some`
- via [js/npc/traffic.js](../npc/traffic.js.md): `HOSTILE_ROLES.has`, `LAW_ROLES.has`
- via [js/station/stations.js](../station/stations.js.md): `stations.find`
- called by: [`mountHud`](hud.js.md#s-mountHud) _js/ui/hud.js_
- effects: dom.id `map-svg` · dom.query `.chart-plot` · dom.id `sheet-empty` · dom.id `sheet-body` · dom.id `sheet-name` · dom.id `sheet-sub` · dom.id `sheet-tier` · dom.id `sheet-stats` · dom.id `sheet-lane` · event.listen `pointerdown` · event.listen `pointermove` · event.listen `pointerup` · event.listen `pointercancel` · event.listen `wheel` · dom.create `div` · dom.query `#cm-title` · dom.query `#cm-sub` · dom.query `#cm-acts` · event.listen `click` · dom.query `#cm-close` · dom.id `map-dir` · dom.id `dir-chips` · dom.id `dir-rows` · dom.create `button` · dom.id `map-list` · dom.id `map-in` · dom.id `map-out` · dom.id `map-fit` · dom.id `map-sheet` · dom.query `#plan-edit` · dom.query `#plan-loop` · dom.id `sheet-lock` · dom.id `sheet-warp` · dom.id `sheet-mark` · dom.id `sheet-centre` · dom.id `map-scale` · dom.id `map-title`

<!-- note:mountMap -->
- L85 · `const view = { cx: 0, cz: 0, span: 0, mode: "ship" };` — view state, in world units
- L86 · `let picked = null;` — body / port / waypoint id
- L87 · `let pickedVessel = null;` — a transponder on the chart
- L88 · `let pickedPoint = null;` — free space: { x, y, z, title, sub }
- L90 · `let sheetKey = "";` — what the stat block was last built for — only rebuild when it changes
- L91 · `let planAt = -1;` — last time the plan row was repainted (sim.wall)
- L140 · `const pointers = new Map();` — ---- input ----
- L157 · `try { svg.setPointerCapture(e.pointerId); } catch {` — pointer already gone
- L254 · `const menu = document.createElement("div");` — ---- the tap menu ------------------------------------------------------
  A small tree on the spot you tapped: what it is, how far, and the acts —
  WARP (nav aligns and jumps), APPROACH (the whole leg, autopilot), PROBE,
  SCAN, SAVE. Free space gets the same acts: the core will jump to a point.
- L352 · `const DIR_FILTERS = [` — ---- the directory: filter the sky, tap to select ----------------------
  The chart shows where things are; the directory answers "what is there
  at all" — every port (by sector), world, and waypoint, nearest first.
  A drought buyer wears its multiplier.
- L484 · `document.getElementById("map-fit").addEventListener("click", () => {` — One button, two useful framings: your neighbourhood and the whole chart.
- L489 · `const planRow = document.createElement("div");` — the loop's plan lives under the sheet: what a full hold does, and whether it goes back out
- L489 · `const planRow = document.createElement("div");` — (ON DOCK / REPEAT live in the mission editor now: CONSOLE › WORK › MISSION)
- L517 · `if (engageAutoWarp(id)) store.getState().setMapOpen(false);` — the chart flies the jump: nav comes about, plots, spools — no nose-wrangling from a map
- L525 · `const have = sim.waypoints.find((w) => w.body === picked || w.name === name);` — MARK toggles: a second press takes the diamond back off the canopy
- L532 · `addAnchoredWaypoint(port.name, { kind: "station", id: port.id }, port);` — 0.3.67: rides the port
- L671 · `if (sim.wall - planAt >= 1 || planAt < 0) {` — the plan row ticks once a second, and only while the chart is up
- L680 · `for (const belt of [currentSystem.belt, currentSystem.outerBelt]) {` — belt annulus
- L692 · `for (const b of BODIES) {` — orbit rings
- L714 · `if (picked && picked === sim.selected) {` — warp lane — worlds and ports alike
- L733 · `for (const st of stations) {` — ports — pickable, ringed when selected
- L742 · `for (const h of holes) {` — collapsed stars: the shadow, the danger ring at true scale, and for a
  transit the next minute of its line — so the chart says which way to go
- L753 · `for (const bc of BEACONS) {` — survey probes
- L760 · `const labels = [];` — waypoints
- L770 · `if (pk && picked === sim.selected) {` — the lane to a picked point, coloured by what sits in it
- L777 · `const showShipNames = px * 20000 > 30;` — Contacts, and only contacts.
  
  This used to draw every hull in the sky at true position with its name
  attached, which made the scanner and the probes ornamental. What goes
  on the chart now is what the register says you have actually resolved
  (contacts.js): a level-1 return is a blob inside a circle of how wrong
  it might be, a level-2 track gets a hull arrow and a class, and only a
  level-3 identification gets a name.
  
  Your own hulls and anything under a probe come through at level 3
  without being scanned — you do not need a dish to know where your own
  ships are.
- L787 · `const rad = Math.max(2.5, Math.min(26, c.err * px));` — An unknown return: where it might be, not where it is.
- L800 · `if (showShipNames || on) labels.push({ u: sp2.u + 6, v: sp2.v + 3, name: c.name, on, rank:` — A track has a class, not a name — the name is level 3.
- L803 · `for (const pr of probes) {` — probes in flight and their drops; scan reports as faint rings
- L817 · `if (pickedPoint) {` — the free point under the menu
- L822 · `for (const b of BODIES) {` — bodies
- L827 · `const trueR = b.radius * px;` — true size once it is big enough to matter, otherwise a legible dot
- L851 · `const sp = worldToU(ship.pos.x, ship.pos.z);` — the ship: heading tick and velocity vector
- L869 · `labels.sort((a, z) => z.rank - a.rank);` — Drop labels that would land on top of one another — the inner system is
  genuinely crowded at chart scale and a pile of text helps nobody.
- L881 · `document.getElementById("map-scale").textContent =` — how wide the chart is, so zoom level is always legible
- L886 · `if (picked || pickedPoint || pickedVessel) {` — sheet is cheap to keep live
<!-- /note -->

#### <a id="s-mountMap-statsHtml"></a>`mountMap>statsHtml(key, html)`

function · L92–96

- called by: [`mountMap>drawSheet`](#s-mountMap-drawSheet) ×5

<!-- note:mountMap>statsHtml -->
<!-- /note -->

#### <a id="s-mountMap-worldToU"></a>`mountMap>worldToU(x, z)`

function · L98–101

- called by: [`mountMap`](#s-mountMap) ×20 · [`mountMap>hitAt>consider`](#s-mountMap-hitAt-consider)

<!-- note:mountMap>worldToU -->
<!-- /note -->

#### <a id="s-mountMap-pxPerUnit"></a>`mountMap>pxPerUnit()`

function · L102–102

- called by: [`mountMap`](#s-mountMap) ×2 · [`mountMap>moonsVisible`](#s-mountMap-moonsVisible)

<!-- note:mountMap>pxPerUnit -->
<!-- /note -->

#### <a id="s-mountMap-fitSystem"></a>`mountMap>fitSystem()`

function · L104–111

- via [js/world/bodies.js](../world/bodies.js.md): `BODIES.filter`, `BODIES.filter.map`
- called by: [`mountMap`](#s-mountMap)

<!-- note:mountMap>fitSystem -->
The whole chart, Pluto to Pluto.
<!-- /note -->

#### <a id="s-mountMap-fitShip"></a>`mountMap>fitShip()`

function · L113–120

- called by: [`mountMap`](#s-mountMap) ×2

<!-- note:mountMap>fitShip -->
Your own neighbourhood. A real system is mostly empty, so the full view
crushes the inner worlds into one smear — this is the useful default.

- L115 · `view.cx = sim.ship.pos.x * 0.5;` — Frame the star and the ship together — where you are only means
  something next to what you are orbiting.
<!-- /note -->

#### <a id="s-mountMap-centreOn"></a>`mountMap>centreOn(x, z, span)`

function · L122–127

- called by: [`mountMap`](#s-mountMap) ×3 · [`mountMap.run~9`](#s-mountMap-run-9) · [`mountMap>drawDirectory`](#s-mountMap-drawDirectory) ×4

<!-- note:mountMap>centreOn -->
<!-- /note -->

#### <a id="s-mountMap-zoom"></a>`mountMap>zoom(factor, ax, az)`

function · L129–138

- called by: [`mountMap`](#s-mountMap) ×3

<!-- note:mountMap>zoom -->
- L132 · `const k = next / view.span;` — keep the anchor point under the finger
<!-- /note -->

#### <a id="s-mountMap-svgPoint"></a>`mountMap>svgPoint(e)`

function · L145–150

- called by: [`mountMap`](#s-mountMap) ×3

<!-- note:mountMap>svgPoint -->
<!-- /note -->

#### <a id="s-mountMap-uToWorld"></a>`mountMap>uToWorld(u, v)`

function · L151–154

- called by: [`mountMap`](#s-mountMap) · [`mountMap>tapAt`](#s-mountMap-tapAt)

<!-- note:mountMap>uToWorld -->
<!-- /note -->

#### <a id="s-mountMap-release"></a>`mountMap>release(e)`

function · L190–195

- calls: [`mountMap>tapAt`](#s-mountMap-tapAt)

<!-- note:mountMap>release -->
<!-- /note -->

#### <a id="s-mountMap-hitAt"></a>`mountMap>hitAt(u, v)`

function · L205–227

- calls: [`knownContacts`](../flight/contacts.js.md#s-knownContacts) _js/flight/contacts.js_ · [`waypointPosition`](../sim/sim.js.md#s-waypointPosition) _js/sim/sim.js_ · [`mountMap>hitAt>consider`](#s-mountMap-hitAt-consider) ×4 · [`mountMap>moonsVisible`](#s-mountMap-moonsVisible) · [`bodyPosition`](../world/bodies.js.md#s-bodyPosition) _js/world/bodies.js_
- called by: [`mountMap>tapAt`](#s-mountMap-tapAt)

<!-- note:mountMap>hitAt -->
What sits under a tap: the nearest world, port, saved location or transponder inside a thumb radius.

- L223 · `for (const c of knownContacts()) {` — Only what is actually drawn is tappable. Picking a hull the chart does
  not show would hand the player a name the scanner has not earned.
<!-- /note -->

##### <a id="s-mountMap-hitAt-consider"></a>`mountMap>hitAt>consider(x, z, hit, r=)`

function · L208–212

- calls: [`mountMap>worldToU`](#s-mountMap-worldToU)
- called by: [`mountMap>hitAt`](#s-mountMap-hitAt) ×4

<!-- note:mountMap>hitAt>consider -->
<!-- /note -->

#### <a id="s-mountMap-tapAt"></a>`mountMap>tapAt(u, v, cx, cy)`

function · L229–252

- calls: [`beltBandAt`](../flight/probes.js.md#s-beltBandAt) _js/flight/probes.js_ · [`acquireLock`](../sim/sim.js.md#s-acquireLock) _js/sim/sim.js_ · [`selectBody`](../sim/sim.js.md#s-selectBody) _js/sim/sim.js_ · [`fmtDist`](#s-fmtDist) · [`mountMap>drawSheet`](#s-mountMap-drawSheet) · [`mountMap>hitAt`](#s-mountMap-hitAt) · [`mountMap>openMenu`](#s-mountMap-openMenu) · [`mountMap>uToWorld`](#s-mountMap-uToWorld) · [`starBody`](../world/bodies.js.md#s-starBody) _js/world/bodies.js_
- called by: [`mountMap>release`](#s-mountMap-release)

<!-- note:mountMap>tapAt -->
A tap anywhere: pick what is there (or the empty spot) and open the menu on it.
<!-- /note -->

#### <a id="s-mountMap-closeMenu"></a>`mountMap>closeMenu()`

function · L266–269

- called by: [`mountMap`](#s-mountMap) ×2 · [`mountMap>openMenu`](#s-mountMap-openMenu)

<!-- note:mountMap>closeMenu -->
<!-- /note -->

#### <a id="s-mountMap-actPoint"></a>`mountMap>actPoint()`

function · L271–275

- called by: [`mountMap.run~4`](#s-mountMap-run-4) · [`mountMap.run~5`](#s-mountMap-run-5) · [`mountMap.run~8`](#s-mountMap-run-8) · [`mountMap.run~9`](#s-mountMap-run-9) · [`mountMap>nodeFor`](#s-mountMap-nodeFor)

<!-- note:mountMap>actPoint -->
The spot a menu act works on: the tapped thing, or the free point.
<!-- /note -->

#### <a id="s-mountMap-nodeFor"></a>`mountMap>nodeFor(persist)`

function · L277–287

- calls: [`addWaypointAt`](../sim/sim.js.md#s-addWaypointAt) _js/sim/sim.js_ · [`mountMap>actPoint`](#s-mountMap-actPoint)
- via [js/sim/sim.js](../sim/sim.js.md): `sim.waypoints.filter`, `sim.waypoints.find`
- called by: [`mountMap`](#s-mountMap) · [`mountMap.run`](#s-mountMap-run) · [`mountMap.run~2`](#s-mountMap-run-2) · [`mountMap.run~6`](#s-mountMap-run-6)

<!-- note:mountMap>nodeFor -->
A warp node id for the target: the thing itself, or a saved point in space (transient unless SAVE made it).

- L281 · `const have = sim.waypoints.find((w) => !w.body && Math.hypot(w.x - p.x, w.z - p.z) < 2000)` — reuse a saved location already sitting on this spot
<!-- /note -->

#### <a id="s-mountMap-run"></a>`mountMap.run()`

prop · L290–290

- calls: [`engageAutoWarp`](../flight/autopilot.js.md#s-engageAutoWarp) _js/flight/autopilot.js_ · [`mountMap>nodeFor`](#s-mountMap-nodeFor)

<!-- note:mountMap.run -->
<!-- /note -->

#### <a id="s-mountMap-run-2"></a>`mountMap.run~2()`

prop · L291–291

- calls: [`engageAutopilot`](../flight/autopilot.js.md#s-engageAutopilot) _js/flight/autopilot.js_ · [`mountMap>nodeFor`](#s-mountMap-nodeFor)

<!-- note:mountMap.run~2 -->
<!-- /note -->

#### <a id="s-mountMap-run-3"></a>`mountMap.run~3()`

prop · L292–292

- calls: [`acquireLock`](../sim/sim.js.md#s-acquireLock) _js/sim/sim.js_ · [`selectBody`](../sim/sim.js.md#s-selectBody) _js/sim/sim.js_

<!-- note:mountMap.run~3 -->
<!-- /note -->

#### <a id="s-mountMap-run-4"></a>`mountMap.run~4()`

prop · L293–293

- calls: [`launchProbe`](../flight/probes.js.md#s-launchProbe) _js/flight/probes.js_ · [`mountMap>actPoint`](#s-mountMap-actPoint)

<!-- note:mountMap.run~4 -->
<!-- /note -->

#### <a id="s-mountMap-run-5"></a>`mountMap.run~5()`

prop · L294–294

- calls: [`remoteScan`](../flight/probes.js.md#s-remoteScan) _js/flight/probes.js_ · [`mountMap>actPoint`](#s-mountMap-actPoint) · [`mountMap>drawSheet`](#s-mountMap-drawSheet)

<!-- note:mountMap.run~5 -->
<!-- /note -->

#### <a id="s-mountMap-run-6"></a>`mountMap.run~6()`

prop · L295–301

- calls: [`addAnchoredWaypoint`](../sim/sim.js.md#s-addAnchoredWaypoint) _js/sim/sim.js_ · [`addBodyWaypoint`](../sim/sim.js.md#s-addBodyWaypoint) _js/sim/sim.js_ · [`addWaypointAt`](../sim/sim.js.md#s-addWaypointAt) _js/sim/sim.js_ · [`mountMap>drawSheet`](#s-mountMap-drawSheet) · [`mountMap>nodeFor`](#s-mountMap-nodeFor)

<!-- note:mountMap.run~6 -->
- L297 · `if (menuTarget?.kind === "station") { addAnchoredWaypoint(menuTarget.name, { kind: "statio` — 0.3.67: rides the port
<!-- /note -->

#### <a id="s-mountMap-run-7"></a>`mountMap.run~7()`

prop · L302–302

- calls: [`removeWaypoint`](../sim/sim.js.md#s-removeWaypoint) _js/sim/sim.js_ · [`mountMap>drawSheet`](#s-mountMap-drawSheet)

<!-- note:mountMap.run~7 -->
<!-- /note -->

#### <a id="s-mountMap-run-8"></a>`mountMap.run~8()`

prop · L303–303

- calls: [`engageMiningLoop`](../flight/autopilot.js.md#s-engageMiningLoop) _js/flight/autopilot.js_ · [`beltBandAt`](../flight/probes.js.md#s-beltBandAt) _js/flight/probes.js_ · [`mountMap>actPoint`](#s-mountMap-actPoint)

<!-- note:mountMap.run~8 -->
<!-- /note -->

#### <a id="s-mountMap-run-9"></a>`mountMap.run~9()`

prop · L304–304

- calls: [`mountMap>actPoint`](#s-mountMap-actPoint) · [`mountMap>centreOn`](#s-mountMap-centreOn)

<!-- note:mountMap.run~9 -->
<!-- /note -->

#### <a id="s-mountMap-openMenu"></a>`mountMap>openMenu(hit, cx, cy)`

function · L307–346

- calls: [`beltBandAt`](../flight/probes.js.md#s-beltBandAt) _js/flight/probes.js_ ×2 · [`captainLine`](../npc/traffic.js.md#s-captainLine) _js/npc/traffic.js_ · [`vesselStatus`](../npc/traffic.js.md#s-vesselStatus) _js/npc/traffic.js_ · [`fmtDist`](#s-fmtDist) ×4 · [`mountMap>closeMenu`](#s-mountMap-closeMenu) · [`mountMap>openMenu`](#s-mountMap-openMenu) · [`bodyById`](../world/bodies.js.md#s-bodyById) _js/world/bodies.js_ · [`dist3`](../world/bodies.js.md#s-dist3) _js/world/bodies.js_ ×4
- via [js/npc/traffic.js](../npc/traffic.js.md): `vesselStatus.split`
- called by: [`mountMap>openMenu`](#s-mountMap-openMenu) · [`mountMap>tapAt`](#s-mountMap-tapAt)
- effects: dom.create `button` · event.listen `click`

<!-- note:mountMap>openMenu -->
- L336 · `const pr = plot.getBoundingClientRect();` — park it beside the tap, inside the plot
<!-- /note -->

#### <a id="s-mountMap-moonsVisible"></a>`mountMap>moonsVisible(b)`

function · L348–350

- calls: [`mountMap>pxPerUnit`](#s-mountMap-pxPerUnit)
- called by: [`mountMap`](#s-mountMap) ×2 · [`mountMap>hitAt`](#s-mountMap-hitAt)

<!-- note:mountMap>moonsVisible -->
A moon only earns a dot once its orbit is a few pixels wide.
<!-- /note -->

#### <a id="s-mountMap-dirEntries"></a>`mountMap>dirEntries()`

function · L389–443

- calls: [`knownContacts`](../flight/contacts.js.md#s-knownContacts) _js/flight/contacts.js_ · [`captainLine`](../npc/traffic.js.md#s-captainLine) _js/npc/traffic.js_ · [`vesselStatus`](../npc/traffic.js.md#s-vesselStatus) _js/npc/traffic.js_ · [`bodyPosition`](../world/bodies.js.md#s-bodyPosition) _js/world/bodies.js_ · [`dist3`](../world/bodies.js.md#s-dist3) _js/world/bodies.js_ ×3
- via [js/sim/sim.js](../sim/sim.js.md): `sim.scanned.has`
- via [js/npc/traffic.js](../npc/traffic.js.md): `vesselStatus.split`
- via [js/flight/contacts.js](../flight/contacts.js.md): `knownContacts.map`, `knownContacts.map.sort`
- called by: [`mountMap>drawDirectory`](#s-mountMap-drawDirectory)

<!-- note:mountMap>dirEntries -->
- L395 · `const list = knownContacts()` — Resolved contacts only, nearest first. An unknown return is listed as
  one — it is on the board, you just do not know what it is yet.
- L404 · `` tag: c.level >= 3 && n ? `${vesselStatus(n).split(" — ")[0]} · ${captainLine(n)}` : c.leve `` — the captain half of vesselStatus used to be thrown away here, so
  the SHIPS directory was a list of hulls with nobody in them
- L427 · `if (dirFilter !== "worlds" && b.parent) continue;` — moons clutter ALL; WORLDS shows them
<!-- /note -->

#### <a id="s-mountMap-drawDirectory"></a>`mountMap>drawDirectory()`

function · L445–480

- calls: [`acquireLock`](../sim/sim.js.md#s-acquireLock) _js/sim/sim.js_ · [`selectBody`](../sim/sim.js.md#s-selectBody) _js/sim/sim.js_ · [`fmtDist`](#s-fmtDist) · [`mountMap>centreOn`](#s-mountMap-centreOn) ×4 · [`mountMap>dirEntries`](#s-mountMap-dirEntries) · [`mountMap>drawSheet`](#s-mountMap-drawSheet) · [`mountMap>svgEsc`](#s-mountMap-svgEsc) ×3 · [`bodyPosition`](../world/bodies.js.md#s-bodyPosition) _js/world/bodies.js_
- via [js/station/stations.js](../station/stations.js.md): `stations.find`
- called by: [`mountMap`](#s-mountMap) ×3
- effects: dom.create `div` · dom.create `button` · event.listen `click`

<!-- note:mountMap>drawDirectory -->
<!-- /note -->

#### <a id="s-mountMap-planPaint"></a>`mountMap>planPaint()`

function · L494–498

- via [js/flight/autopilot.js](../flight/autopilot.js.md): `autopilot.phase.toUpperCase`
- called by: [`mountMap`](#s-mountMap) ×4
- effects: dom.query `#plan-loop`

<!-- note:mountMap>planPaint -->
<!-- /note -->

#### <a id="s-mountMap-svgEsc"></a>`mountMap>svgEsc(t)`

function · L548–550

- called by: [`mountMap`](#s-mountMap) ×3 · [`mountMap>drawDirectory`](#s-mountMap-drawDirectory) ×3 · [`mountMap>drawSheet`](#s-mountMap-drawSheet) ×7

<!-- note:mountMap>svgEsc -->
---- drawing ----
<!-- /note -->

#### <a id="s-mountMap-drawSheet"></a>`mountMap>drawSheet()`

function · L552–648

- calls: [`corpOfVessel`](../corp/corps.js.md#s-corpOfVessel) _js/corp/corps.js_ · [`standingLabel`](../corp/corps.js.md#s-standingLabel) _js/corp/corps.js_ · [`beltBandAt`](../flight/probes.js.md#s-beltBandAt) _js/flight/probes.js_ · [`waypointPosition`](../sim/sim.js.md#s-waypointPosition) _js/sim/sim.js_ · [`fmtDist`](#s-fmtDist) ×5 · [`mountMap>statsHtml`](#s-mountMap-statsHtml) ×5 · [`mountMap>svgEsc`](#s-mountMap-svgEsc) ×7 · [`bodyById`](../world/bodies.js.md#s-bodyById) _js/world/bodies.js_ ×2 · [`bodyPosition`](../world/bodies.js.md#s-bodyPosition) _js/world/bodies.js_ · [`dist3`](../world/bodies.js.md#s-dist3) _js/world/bodies.js_ ×5
- via [js/sim/sim.js](../sim/sim.js.md): `sim.scanReports.find`, `sim.scanned.has`, `sim.waypoints.find`
- via [js/npc/traffic.js](../npc/traffic.js.md): `HOSTILE_ROLES.has`, `LAW_ROLES.has`
- via [js/station/stations.js](../station/stations.js.md): `stations.find`
- called by: [`mountMap`](#s-mountMap) ×3 · [`mountMap.run~5`](#s-mountMap-run-5) · [`mountMap.run~6`](#s-mountMap-run-6) · [`mountMap.run~7`](#s-mountMap-run-7) · [`mountMap>drawDirectory`](#s-mountMap-drawDirectory) · [`mountMap>tapAt`](#s-mountMap-tapAt)

<!-- note:mountMap>drawSheet -->
- L553 · `const port = picked ? stations.find((x) => x.id === picked) : null;` — a picked port gets its own card
<!-- /note -->

#### <a id="s-mountMap-laneState"></a>`mountMap>laneState()`

function · L650–658

- calls: [`warpBlock`](../sim/sim.js.md#s-warpBlock) _js/sim/sim.js_ · [`bodyById`](../world/bodies.js.md#s-bodyById) _js/world/bodies.js_
- via [js/sim/sim.js](../sim/sim.js.md): `sim.waypoints.find`
- via [js/station/stations.js](../station/stations.js.md): `stations.find`
- called by: [`mountMap`](#s-mountMap)

<!-- note:mountMap>laneState -->
<!-- /note -->
