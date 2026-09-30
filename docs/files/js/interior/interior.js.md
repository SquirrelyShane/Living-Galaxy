# js/interior/interior.js

[index](../../../README.md) · 469 lines · 28 symbols · 12 imports · 3 importers

## About

<!-- note:@file -->
LIVING GALAXY experimental — the deck.

Press I (or DECK on dash page 3) and the hull dematerialises: the forged
mesh goes to wireframe and fades while a scan line sweeps the canopy and
leaves the deck plan behind it — the same blueprint ink the station decks
use, but this one is *your* hull, grown from its def and your callsign.

On it: every deck stacked, every room named, the crew walking their shift
(station → mess → quarters on a 270 s rota), the hull's maintenance
robotics, the interior sensor nodes, and whoever holds the conn on the
bridge. The rail beside it is the sensor board: what is inside the hull
(allied, synthetic, robotics, intruders) and what is inside scan range
outside it. Tap a hand to talk — and to give them the ship.

Mounted on &lt;body>, like comms, so it survives the terminal and the deck.
<!-- /note -->

## Imports

| line | from | names | target |
|---|---|---|---|
| 1 | `../sim/sim.js` | `sim`, `logEvent`, `currentShipId` | [js/sim/sim.js](../sim/sim.js.md) |
| 2 | `../audio/index.js` | `VIEW` | [js/audio/index.js](../audio/index.js.md) |
| 3 | `../core/input.js` | `setInjectedKeys`, `setInjectedPan` | [js/core/input.js](../core/input.js.md) |
| 4 | `../crew/ledger.js` | `crew`, `dismissCrew` | [js/crew/ledger.js](../crew/ledger.js.md) |
| 5 | `../crew/talkview.js` | `mountTalk` | [js/crew/talkview.js](../crew/talkview.js.md) |
| 6 | `../ships/shipdb.js` | `shipById` | [js/ships/shipdb.js](../ships/shipdb.js.md) |
| 7 | `../flight/turrets.js` | `contacts` | [js/flight/turrets.js](../flight/turrets.js.md) |
| 8 | `../station/stations.js` | `stations` | [js/station/stations.js](../station/stations.js.md) |
| 9 | `./deckplan.js` | `hullPlan`, `stationRoomFor`, `quartersFor` | [js/interior/deckplan.js](deckplan.js.md) |
| 10 | `../npc/captain.js` | `captain`, `transferCommand`, `retakeCommand`, `holderName`, `interiorReport` | [js/npc/captain.js](../npc/captain.js.md) |
| 11 | `../npc/crewfx.js` | `crewEffects`, `shiftPhase` | [js/npc/crewfx.js](../npc/crewfx.js.md) |
| 12 | `./boarding.js` | `boarding` | [js/interior/boarding.js](boarding.js.md) |

## Imported by

- [js/console/console.js](../console/console.js.md) — `toggleInterior`
- [js/ui/hud.js](../ui/hud.js.md) — `mountInterior`
- [js/ui/tutorial.js](../ui/tutorial.js.md) — `interior`

## Exports

- [`interior`](#s-interior) · const — used by [js/ui/tutorial.js](../ui/tutorial.js.md)
- [`openInterior`](#s-openInterior) · function — **no importer in scanned roots**
- [`closeInterior`](#s-closeInterior) · function — **no importer in scanned roots**
- [`toggleInterior`](#s-toggleInterior) · function — used by [js/console/console.js](../console/console.js.md)
- [`mountInterior`](#s-mountInterior) · function — used by [js/ui/hud.js](../ui/hud.js.md)

## Effects

- **dom.create** — `‹tag›` (el:33)
- **dom.id** — `‹id›` ($:31) · `in-hull` (paintRail:312) · `in-conn` (paintRail:313) · `in-manned` (paintRail:327) · `in-scan` (paintRail:344) · `in-crew` (paintRail:358) · `in-talk` (paintDialogue:375) · `aux-deck` (mountInterior:440, mountInterior>loop:456) · `aux-deck-st` (mountInterior>loop:454)
- **dom.query** — `#in-canvas` (mountInterior:423) · `#in-rep` (mountInterior:425) · `#in-close` (mountInterior:426)
- **event.listen** — `click on b → (inline)` (paintRail:369) · `click on root.querySelector() → closeInterior` (mountInterior:426) · `pointerdown on interior.canvas → (inline)` (mountInterior:428) · `keydown on window → (inline)` (mountInterior:434) · `click on $() → toggleInterior` (mountInterior:440)
- **input.key** — `KeyI` (mountInterior:437) · `Escape` (mountInterior:438)
- **timer** — `setTimeout` (closeInterior:180) · `requestAnimationFrame` (mountInterior>loop:444, mountInterior:466)

## Symbols

### <a id="s-interior"></a>`interior`

const · **exported** · L14–29

<!-- note:interior -->
- L16 · `fade: 0,` — 0 = hull solid, 1 = blueprint
- L19 · `peds: new Map(),` — crew id → walker
- L21 · `selected: null,` — crew id
<!-- /note -->

### <a id="s-S"></a>`$(id)`

function · L31–31

- called by: [`mountInterior`](#s-mountInterior) · [`mountInterior>loop`](#s-mountInterior-loop) ×2 · [`paintDialogue`](#s-paintDialogue) · [`paintRail`](#s-paintRail) ×5
- effects: dom.id `‹id›`

<!-- note:$ -->
<!-- /note -->

### <a id="s-el"></a>`el(tag, cls, text)`

function · L32–37

- called by: [`mountInterior`](#s-mountInterior) · [`paintDialogue`](#s-paintDialogue) ×2 · [`paintRail`](#s-paintRail) ×16 · [`paintRail>line`](#s-paintRail-line) ×3
- effects: dom.create `‹tag›`

<!-- note:el -->
<!-- /note -->

### <a id="s-ensurePlan"></a>`ensurePlan()`

function · L39–56

- calls: [`hullPlan`](deckplan.js.md#s-hullPlan) _js/interior/deckplan.js_ · [`shipById`](../ships/shipdb.js.md#s-shipById) _js/ships/shipdb.js_ ×2 · [`currentShipId`](../sim/sim.js.md#s-currentShipId) _js/sim/sim.js_
- called by: [`mountInterior>loop`](#s-mountInterior-loop) · [`openInterior`](#s-openInterior)

<!-- note:ensurePlan -->
---- plan + walkers -----------------------------------------------------
<!-- /note -->

### <a id="s-syncWalkers"></a>`syncWalkers(plan)`

function · L58–68

- calls: [`stationRoomFor`](deckplan.js.md#s-stationRoomFor) _js/interior/deckplan.js_
- called by: [`mountInterior>loop`](#s-mountInterior-loop)

<!-- note:syncWalkers -->
<!-- /note -->

### <a id="s-roomFor"></a>`roomFor(plan, m, phase)`

function · L70–75

- calls: [`quartersFor`](deckplan.js.md#s-quartersFor) _js/interior/deckplan.js_ · [`stationRoomFor`](deckplan.js.md#s-stationRoomFor) _js/interior/deckplan.js_
- called by: [`tickWalkers`](#s-tickWalkers) ×2

<!-- note:roomFor -->
<!-- /note -->

### <a id="s-routeTo"></a>`routeTo(plan, p, dst)`

function · L77–91

- called by: [`tickWalkers`](#s-tickWalkers) ×4

<!-- note:routeTo -->
room → door → corridor → (lift, deck change) → corridor → door → room
<!-- /note -->

### <a id="s-walk"></a>`walk(p, dt)`

function · L93–109

- called by: [`tickWalkers`](#s-tickWalkers) ×3

<!-- note:walk -->
<!-- /note -->

### <a id="s-syncIntruders"></a>`syncIntruders(plan)`

function · L111–121

- called by: [`mountInterior>loop`](#s-mountInterior-loop)

<!-- note:syncIntruders -->
boarders come through the airlock and go where it hurts
<!-- /note -->

### <a id="s-tickWalkers"></a>`tickWalkers(plan, dt)`

function · L123–153

- calls: [`roomFor`](#s-roomFor) ×2 · [`routeTo`](#s-routeTo) ×4 · [`walk`](#s-walk) ×3 · [`shiftPhase`](../npc/crewfx.js.md#s-shiftPhase) _js/npc/crewfx.js_
- called by: [`mountInterior>loop`](#s-mountInterior-loop)

<!-- note:tickWalkers -->
- L127 · `const phase = captain.holder === m.id ? 0 : shiftPhase(m.id, sim.time);` — the same deterministic rota crewfx.js prices — the dot on the deck IS the trim on the hull
- L133 · `const dst = roomFor(plan, m, 0);` — a new duty from the roster: walk to it without waiting for the next phase
<!-- /note -->

### <a id="s-openInterior"></a>`openInterior()`

function · **exported** · L155–171

- calls: [`setInjectedKeys`](../core/input.js.md#s-setInjectedKeys) _js/core/input.js_ · [`setInjectedPan`](../core/input.js.md#s-setInjectedPan) _js/core/input.js_ · [`ensurePlan`](#s-ensurePlan) · [`logEvent`](../sim/sim.js.md#s-logEvent) _js/sim/sim.js_
- via [js/audio/index.js](../audio/index.js.md): `VIEW.interiorIn`
- called by: [`toggleInterior`](#s-toggleInterior)

<!-- note:openInterior -->
---- open / close --------------------------------------------------------

- L158 · `sim.interiorOpen = true;` — The engine's ambient bed reads this: inside the hull the sky cuts off
  and the room tone comes up. A flag on sim rather than an import of this
  module, so the engine does not take a dependency on the deck plan.
- L162 · `sim.cameraMode = 1;` — the hull has to be on screen to dematerialise
- L167 · `setInjectedKeys([]);` — you left the seat: the stick goes dead until you come back
<!-- /note -->

### <a id="s-closeInterior"></a>`closeInterior()`

function · **exported** · L173–181

- calls: [`setInjectedKeys`](../core/input.js.md#s-setInjectedKeys) _js/core/input.js_ · [`setInjectedPan`](../core/input.js.md#s-setInjectedPan) _js/core/input.js_
- via [js/audio/index.js](../audio/index.js.md): `VIEW.interiorOut`
- called by: [`mountInterior`](#s-mountInterior) · [`mountInterior>loop`](#s-mountInterior-loop) · [`toggleInterior`](#s-toggleInterior)
- effects: timer `setTimeout`

<!-- note:closeInterior -->
<!-- /note -->

### <a id="s-toggleInterior"></a>`toggleInterior()`

function · **exported** · L183–186

- calls: [`closeInterior`](#s-closeInterior) · [`openInterior`](#s-openInterior)
- called by: [`registerStaticJumps.run~3`](../console/console.js.md#s-registerStaticJumps-run-3) _js/console/console.js_ · [`mountInterior`](#s-mountInterior)

<!-- note:toggleInterior -->
<!-- /note -->

### <a id="s-draw"></a>`draw()`

function · L188–295

- calls: [`draw>P`](#s-draw-P) ×3 · [`draw>X`](#s-draw-X) ×12 · [`draw>Y`](#s-draw-Y) ×11
- called by: [`mountInterior>loop`](#s-mountInterior-loop)

<!-- note:draw -->
---- drawing -------------------------------------------------------------

- L198 · `const gap = 1.6;` — fit every deck stacked
- L205 · `ctx.strokeStyle = "rgba(90,140,190,0.08)";` — grid
- L213 · `const base = oy - d.top * U;` — y of corridor top (grid 0)
- L216 · `ctx.fillStyle = "rgba(160,205,235,0.55)";` — deck label
- L219 · `ctx.fillStyle = "rgba(110,180,230,0.07)";` — corridor
- L225 · `if (plan.decks.length > 1) {` — lift
- L241 · `ctx.strokeStyle = "#9fe8b0";` — door
- L248 · `ctx.fillStyle = "rgba(159,232,176,0.8)";` — sensor nodes: diamonds in the corners
- L281 · `const cap = plan.bridge;` — you
- L288 · `for (const i of boarding.intruders) {` — intruders
<!-- /note -->

#### <a id="s-draw-X"></a>`draw>X(u)`

function · L215–215

- called by: [`draw`](#s-draw) ×12

<!-- note:draw>X -->
<!-- /note -->

#### <a id="s-draw-Y"></a>`draw>Y(u)`

function · L215–215

- called by: [`draw`](#s-draw) ×11

<!-- note:draw>Y -->
<!-- /note -->

#### <a id="s-draw-P"></a>`draw>P(p)`

function · L262–262

- called by: [`draw`](#s-draw) ×3

<!-- note:draw>P -->
people
<!-- /note -->

### <a id="s-crewAt"></a>`crewAt(px, py)`

function · L297–307

- called by: [`mountInterior`](#s-mountInterior)

<!-- note:crewAt -->
<!-- /note -->

### <a id="s-paintRail"></a>`paintRail()`

function · L309–372

- calls: [`$`](#s-S) ×5 · [`el`](#s-el) ×16 · [`paintDialogue`](#s-paintDialogue) · [`paintRail`](#s-paintRail) · [`paintRail>line`](#s-paintRail-line) ×8 · [`holderName`](../npc/captain.js.md#s-holderName) _js/npc/captain.js_ · [`interiorReport`](../npc/captain.js.md#s-interiorReport) _js/npc/captain.js_ · [`crewEffects`](../npc/crewfx.js.md#s-crewEffects) _js/npc/crewfx.js_
- via [js/npc/captain.js](../npc/captain.js.md): `captain.goal.action.toUpperCase`, `holderName.toUpperCase`
- via [js/interior/boarding.js](boarding.js.md): `boarding.brig.map`, `boarding.brig.map.join`
- via [js/crew/ledger.js](../crew/ledger.js.md): `crew.aboard.map`, `crew.aboard.map.join`
- called by: [`mountInterior`](#s-mountInterior) · [`mountInterior>loop`](#s-mountInterior-loop) · [`paintDialogue.run`](#s-paintDialogue-run) · [`paintDialogue.run~2`](#s-paintDialogue-run-2) · [`paintDialogue>closeTalk`](#s-paintDialogue-closeTalk) · [`paintRail`](#s-paintRail)
- effects: dom.id `in-hull` · dom.id `in-conn` · dom.id `in-manned` · dom.id `in-scan` · dom.id `in-crew` · event.listen `click`

<!-- note:paintRail -->
---- the rail ------------------------------------------------------------

- L326 · `const fx = crewEffects(interior.planKey.split(":")[0], sim.callsign, sim.time);` — who is at a console right now, and what it is doing for the hull
- L343 · `const scan = (sim.ship.mods?.scan ?? 1) * 12000;` — outside: scan range
- L358 · `const list = $("in-crew");` — crew list — rebuilt only when it changes, so a tap never lands on a detached button
<!-- /note -->

#### <a id="s-paintRail-line"></a>`paintRail>line(k, v, cls)`

function · L316–316

- calls: [`el`](#s-el) ×3
- called by: [`paintRail`](#s-paintRail) ×8

<!-- note:paintRail>line -->
<!-- /note -->

### <a id="s-paintDialogue"></a>`paintDialogue()`

function · L374–392

- calls: [`mountTalk`](../crew/talkview.js.md#s-mountTalk) _js/crew/talkview.js_ · [`$`](#s-S) · [`el`](#s-el) ×2
- via [js/npc/captain.js](../npc/captain.js.md): `captain.log.slice`
- via [js/crew/ledger.js](../crew/ledger.js.md): `crew.aboard.find`
- called by: [`mountInterior`](#s-mountInterior) · [`paintDialogue>closeTalk`](#s-paintDialogue-closeTalk) · [`paintRail`](#s-paintRail)
- effects: dom.id `in-talk`

<!-- note:paintDialogue -->
- L385 · `interior.talkRefresh?.stop?.();` — the shared talk view (crew/talkview.js) — the console's CREW › TALK mounts the same thing
<!-- /note -->

#### <a id="s-paintDialogue-closeTalk"></a>`paintDialogue>closeTalk()`

function · L379–379

- calls: [`paintDialogue`](#s-paintDialogue) · [`paintRail`](#s-paintRail)
- called by: [`paintDialogue.run~3`](#s-paintDialogue-run-3)

<!-- note:paintDialogue>closeTalk -->
<!-- /note -->

#### <a id="s-paintDialogue-run"></a>`paintDialogue.run()`

prop · L381–381

- calls: [`connLine`](#s-connLine) · [`paintRail`](#s-paintRail) · [`transferCommand`](../npc/captain.js.md#s-transferCommand) _js/npc/captain.js_

<!-- note:paintDialogue.run -->
<!-- /note -->

#### <a id="s-paintDialogue-run-2"></a>`paintDialogue.run~2()`

prop · L382–382

- calls: [`paintRail`](#s-paintRail) · [`retakeCommand`](../npc/captain.js.md#s-retakeCommand) _js/npc/captain.js_

<!-- note:paintDialogue.run~2 -->
<!-- /note -->

#### <a id="s-paintDialogue-run-3"></a>`paintDialogue.run~3()`

prop · L383–383

- calls: [`dismissCrew`](../crew/ledger.js.md#s-dismissCrew) _js/crew/ledger.js_ · [`paintDialogue>closeTalk`](#s-paintDialogue-closeTalk) · [`retakeCommand`](../npc/captain.js.md#s-retakeCommand) _js/npc/captain.js_

<!-- note:paintDialogue.run~3 -->
<!-- /note -->

### <a id="s-connLine"></a>`connLine(m)`

function · L394–400

- called by: [`paintDialogue.run`](#s-paintDialogue-run)

<!-- note:connLine -->
<!-- /note -->

### <a id="s-mountInterior"></a>`mountInterior()`

function · **exported** · L402–469

- calls: [`$`](#s-S) · [`closeInterior`](#s-closeInterior) · [`crewAt`](#s-crewAt) · [`el`](#s-el) · [`paintDialogue`](#s-paintDialogue) · [`paintRail`](#s-paintRail) · [`toggleInterior`](#s-toggleInterior)
- called by: [`mountHud`](../ui/hud.js.md#s-mountHud) _js/ui/hud.js_
- effects: dom.query `#in-canvas` · dom.query `#in-rep` · event.listen `click` · dom.query `#in-close` · event.listen `pointerdown` · event.listen `keydown` · input.key `KeyI` · input.key `Escape` · dom.id `aux-deck` · timer `requestAnimationFrame`

<!-- note:mountInterior -->
---- mount ----------------------------------------------------------------
<!-- /note -->

#### <a id="s-mountInterior-loop"></a>`mountInterior>loop()`

function · L443–465

- calls: [`$`](#s-S) ×2 · [`closeInterior`](#s-closeInterior) · [`draw`](#s-draw) · [`ensurePlan`](#s-ensurePlan) · [`paintRail`](#s-paintRail) · [`syncIntruders`](#s-syncIntruders) · [`syncWalkers`](#s-syncWalkers) · [`tickWalkers`](#s-tickWalkers)
- effects: timer `requestAnimationFrame` · dom.id `aux-deck-st` · dom.id `aux-deck`

<!-- note:mountInterior>loop -->
- L448 · `interior.fade += (interior.open ? 1 : -1) * dt * 1.8;` — the fade is on the wall clock; the hull is a thing you can see dissolve
<!-- /note -->
