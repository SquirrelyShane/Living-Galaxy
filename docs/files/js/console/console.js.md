# js/console/console.js

[index](../../../README.md) · 315 lines · 52 symbols · 18 imports · 5 importers

## About

<!-- note:@file -->
LIVING GALAXY — the CONSOLE shell.

One sheet for everything that is not a thumb control: six panels (SHIP ·
NAV · CREW · WORK · MARKET · CORP), each with its own sub-tabs, a global
jump box that searches every panel and the static leaves that never
belonged to one, and a recents row for the six things you actually touch.

The lifecycle is the old terminal's: a panel builds its DOM once per
open/tab change and pushes refresher closures; `paintConsole(state)` runs
them every HUD frame while open, so live values tick without tearing the
tree out from under a slider you are dragging. `sim.terminalOpen` stays the
flag (the sim suppresses stick/RCS while it is up; HOLD still brakes).

No DOM at import: `mountConsole()` is the only DOM entry.
NOTE: the exported `console` shadows the global inside this module — use
`globalThis.console` for logging here.
<!-- /note -->

## Imports

| line | from | names | target |
|---|---|---|---|
| 1 | `./kit.js` | `*` as `kit` | [js/console/kit.js](kit.js.md) |
| 2 | `./kit.js` | `fmtDist` | [js/console/kit.js](kit.js.md) |
| 3 | `./search.js` | `query`, `registerJump`, `runHit`, `jumps` | [js/console/search.js](search.js.md) |
| 4 | `./panels/ship.js` | `default` as `shipPanel` | [js/console/panels/ship.js](panels/ship.js.md) |
| 5 | `./panels/nav.js` | `default` as `navPanel` | [js/console/panels/nav.js](panels/nav.js.md) |
| 6 | `./panels/crew.js` | `default` as `crewPanel` | [js/console/panels/crew.js](panels/crew.js.md) |
| 7 | `./panels/work.js` | `default` as `workPanel` | [js/console/panels/work.js](panels/work.js.md) |
| 8 | `./panels/market.js` | `default` as `marketPanel` | [js/console/panels/market.js](panels/market.js.md) |
| 9 | `./panels/corp.js` | `default` as `corpPanel` | [js/console/panels/corp.js](panels/corp.js.md) |
| 10 | `../sim/sim.js` | `setTermHold`, `setTerminal`, `sim` | [js/sim/sim.js](../sim/sim.js.md) |
| 11 | `../audio/index.js` | `UI` | [js/audio/index.js](../audio/index.js.md) |
| 12 | `../world/bodies.js` | `currentSystem` | [js/world/bodies.js](../world/bodies.js.md) |
| 13 | `../core/store.js` | `useGameStore` | [js/core/store.js](../core/store.js.md) |
| 14 | `../comms/gnn.js` | `gnn` | [js/comms/gnn.js](../comms/gnn.js.md) |
| 15 | `../drones/ops.js` | `droneOps` | [js/drones/ops.js](../drones/ops.js.md) |
| 16 | `../ui/map.js` | `openMapDirectory` | [js/ui/map.js](../ui/map.js.md) |
| 17 | `../interior/interior.js` | `toggleInterior` | [js/interior/interior.js](../interior/interior.js.md) |
| 18 | `../ui/tutorial.js` | `startTutorial` | [js/ui/tutorial.js](../ui/tutorial.js.md) |

## Imported by

- [js/console/panels/work.js](panels/work.js.md) — `closeConsole`
- [js/console/search.js](search.js.md) — `closeConsole`, `console`, `jumpTo`, `noteRecent`
- [js/station/stationdeck.js](../station/stationdeck.js.md) — `openConsole`
- [js/ui/hud.js](../ui/hud.js.md) — `mountConsole`, `toggleConsole`
- [js/ui/map.js](../ui/map.js.md) — `openConsole`

## Exports

- [`RECENTS_KEY`](#s-RECENTS_KEY) · const — **no importer in scanned roots**
- [`console`](#s-console) · const — used by [js/console/search.js](search.js.md)
- [`registerPanel`](#s-registerPanel) · function — **no importer in scanned roots**
- [`openConsole`](#s-openConsole) · function — used by [js/station/stationdeck.js](../station/stationdeck.js.md), [js/ui/map.js](../ui/map.js.md)
- [`closeConsole`](#s-closeConsole) · function — used by [js/console/panels/work.js](panels/work.js.md), [js/console/search.js](search.js.md)
- [`toggleConsole`](#s-toggleConsole) · function — used by [js/ui/hud.js](../ui/hud.js.md)
- [`jumpTo`](#s-jumpTo) · function — used by [js/console/search.js](search.js.md)
- [`noteRecent`](#s-noteRecent) · function — used by [js/console/search.js](search.js.md)
- [`mountConsole`](#s-mountConsole) · function — used by [js/ui/hud.js](../ui/hud.js.md)

## Effects

- **dom.id** — `‹id›` ($:23, click:233, stText:234) · `con-tabs` (paintTabs:116, paintHits:195, mountConsole:280) · `con-subtabs` (paintTabs:124, paintHits:196, paintHits:196) · `con-title` (paintTabs:136) · `con-body` (build:140, paintHits:190) · `con-recents` (paintRecents:173) · `con-foot` (paintRecents:185) · `con-hits` (paintHits:189) · `con-q` (act:226, mountConsole:279) · `sd-reopen` (registerStaticJumps.run~6:263) · `console` (mountConsole:275) · `con-hold` (mountConsole:278) · `con-close` (mountConsole:283) · `con-sub` (mountConsole:304) · `t-vel` (mountConsole:305) · `t-alt` (mountConsole:306) · `t-pwr` (mountConsole:307) · `t-hull` (mountConsole:308)
- **dom.query** — `button[data-panel]` (paintTabs:118, mountConsole:280) · `[data-focus="${…}"]` (build:156) · `#sd-tabs button[data-sd="${…}"]` (registerStaticJumps.run~6:263)
- **event.listen** — `click on b → (inline)` (paintTabs:133, paintHits:220, mountConsole:281) · `click on chip → (inline)` (paintRecents:179) · `click on $() → (inline)` (mountConsole:283) · `click on holdBtn → (inline)` (mountConsole:284) · `input on qEl → (inline)` (mountConsole:285) · `keydown on qEl → (inline)` (mountConsole:286) · `pointerdown on root → (inline)` (mountConsole:290)
- **input.key** — `Enter` (mountConsole:287) · `Escape` (mountConsole:288)
- **storage.get** — `‹RECENTS_KEY›` (loadRecents:88)
- **storage.set** — `‹RECENTS_KEY›` (saveRecents:91)

## Symbols

### <a id="s-statusFaults"></a>`statusFaults`

const · L20–20

<!-- note:statusFaults -->
one warning per panel, not one per repaint
<!-- /note -->

### <a id="s-DOC"></a>`DOC`

const · L22–22

<!-- note:DOC -->
<!-- /note -->

### <a id="s-S"></a>`$(id)`

function · L23–23

- called by: [`act`](#s-act) · [`build`](#s-build) · [`mountConsole`](#s-mountConsole) ×10 · [`paintHits`](#s-paintHits) ×5 · [`paintRecents`](#s-paintRecents) ×2 · [`paintTabs`](#s-paintTabs) ×3 · [`registerStaticJumps.run~6`](#s-registerStaticJumps-run-6)
- effects: dom.id `‹id›`

<!-- note:$ -->
<!-- /note -->

### <a id="s-RECENTS_KEY"></a>`RECENTS_KEY`

const · **exported** · L25–25

<!-- note:RECENTS_KEY -->
<!-- /note -->

### <a id="s-PANEL_ORDER"></a>`PANEL_ORDER`

const · L26–26

<!-- note:PANEL_ORDER -->
<!-- /note -->

### <a id="s-console"></a>`console`

const · **exported** · L28–28

<!-- note:console -->
Shell state. `panels` is id → panel record in registration order.
<!-- /note -->

### <a id="s-registerPanel"></a>`registerPanel(panel)`

function · **exported** · L30–35

- called by: [`mountConsole`](#s-mountConsole)

<!-- note:registerPanel -->
---- registry ------------------------------------------------------------

registerPanel({ id, title, order = 0, subtabs = [],   // [{ id, label, when?: () => bool }]
  mount(root, ctx), paint(state, ctx), unmount?(ctx), search?() })
search() → [{ label, hint, sub, run?, keywords?, focus? }]
ctx = { sub, setSub(id), push(fn), focus, kit, openConsole, state }
<!-- /note -->

#### <a id="s-registerPanel-mount"></a>`registerPanel.mount()`

prop · L32–32

<!-- note:registerPanel.mount -->
<!-- /note -->

#### <a id="s-registerPanel-paint"></a>`registerPanel.paint()`

prop · L32–32

<!-- note:registerPanel.paint -->
<!-- /note -->

#### <a id="s-registerPanel-unmount"></a>`registerPanel.unmount()`

prop · L32–32

<!-- note:registerPanel.unmount -->
<!-- /note -->

#### <a id="s-registerPanel-search"></a>`registerPanel.search()`

prop · L32–32

<!-- note:registerPanel.search -->
<!-- /note -->

### <a id="s-panelOf"></a>`panelOf(id)`

function · L37–39

- called by: [`build`](#s-build) · [`paintTabs`](#s-paintTabs)

<!-- note:panelOf -->
<!-- /note -->

### <a id="s-liveSubs"></a>`liveSubs(p)`

function · L41–43

- called by: [`paintTabs`](#s-paintTabs) · [`subOf`](#s-subOf)

<!-- note:liveSubs -->
The sub-tabs a panel shows right now (`when()` hides e.g. the PORT desk undocked).
<!-- /note -->

### <a id="s-subOf"></a>`subOf(p)`

function · L45–50

- calls: [`liveSubs`](#s-liveSubs)
- called by: [`makeCtx`](#s-makeCtx) · [`paintTabs`](#s-paintTabs)

<!-- note:subOf -->
<!-- /note -->

### <a id="s-openConsole"></a>`openConsole(panelId=, subId=, opts=)`

function · **exported** · L52–67

- calls: [`build`](#s-build) · [`setTerminal`](../sim/sim.js.md#s-setTerminal) _js/sim/sim.js_
- via [js/audio/index.js](../audio/index.js.md): `UI.panel`, `UI.press`, `UI.tab`
- called by: [`jumpTo`](#s-jumpTo) · [`mountConsole`](#s-mountConsole) ×3 · [`toggleConsole`](#s-toggleConsole) · [`@file`](../station/stationdeck.js.md#) _js/station/stationdeck.js_ ×2 · [`mountMap`](../ui/map.js.md#s-mountMap) _js/ui/map.js_

<!-- note:openConsole -->
---- open / close --------------------------------------------------------

Sets sim.terminalOpen via setTerminal(true); the paint loop builds the DOM.

- L53 · `const wasOpen = console.open;` — Three different sounds, because these are three different events: the
  console coming up, a panel changing under an open console, and a sub-tab
  inside one. Playing the same cue for all three is how a UI ends up
  sounding like one repeated tone.
<!-- /note -->

### <a id="s-closeConsole"></a>`closeConsole()`

function · **exported** · L69–74

- calls: [`setTerminal`](../sim/sim.js.md#s-setTerminal) _js/sim/sim.js_
- via [js/audio/index.js](../audio/index.js.md): `UI.close`
- called by: [`mountConsole`](#s-mountConsole) · [`toggleConsole`](#s-toggleConsole) · [`editor>render`](panels/work.js.md#s-editor-render) _js/console/panels/work.js_ · [`runHit`](search.js.md#s-runHit) _js/console/search.js_

<!-- note:closeConsole -->
<!-- /note -->

### <a id="s-toggleConsole"></a>`toggleConsole()`

function · **exported** · L76–78

- calls: [`closeConsole`](#s-closeConsole) · [`openConsole`](#s-openConsole)
- called by: [`mountHud`](../ui/hud.js.md#s-mountHud) _js/ui/hud.js_

<!-- note:toggleConsole -->
<!-- /note -->

### <a id="s-jumpTo"></a>`jumpTo(path)`

function · **exported** · L80–85

- calls: [`openConsole`](#s-openConsole)
- called by: [`paintRecents`](#s-paintRecents) · [`runHit`](search.js.md#s-runHit) _js/console/search.js_

<!-- note:jumpTo -->
"work/drones#d3" → openConsole("work","drones",{focus:"d3"})
<!-- /note -->

### <a id="s-loadRecents"></a>`loadRecents()`

function · L87–89

- called by: [`mountConsole`](#s-mountConsole)
- effects: storage.get `‹RECENTS_KEY›`

<!-- note:loadRecents -->
---- recents -------------------------------------------------------------
<!-- /note -->

### <a id="s-saveRecents"></a>`saveRecents()`

function · L90–92

- called by: [`noteRecent`](#s-noteRecent)
- effects: storage.set `‹RECENTS_KEY›`

<!-- note:saveRecents -->
- L91 · `try { globalThis.localStorage?.setItem(RECENTS_KEY, JSON.stringify(console.recents.slice(0` — fine
<!-- /note -->

### <a id="s-noteRecent"></a>`noteRecent(path, label)`

function · **exported** · L93–98

- calls: [`paintRecents`](#s-paintRecents) · [`saveRecents`](#s-saveRecents)
- called by: [`runHit`](search.js.md#s-runHit) _js/console/search.js_ ×2

<!-- note:noteRecent -->
Remember a jump: `{ path, label }`, path is "panel/sub#focus" or "@jumpId" for run-only leaves.
<!-- /note -->

### <a id="s-shell"></a>`shell`

const · L100–100

<!-- note:shell -->
---- the sheet -----------------------------------------------------------
<!-- /note -->

### <a id="s-makeCtx"></a>`makeCtx(p)`

function · L102–113

- calls: [`subOf`](#s-subOf)
- via [js/core/store.js](../core/store.js.md): `useGameStore.getState`
- called by: [`build`](#s-build)

<!-- note:makeCtx -->
<!-- /note -->

#### <a id="s-makeCtx-setSub"></a>`makeCtx.setSub(id)`

prop · L106–106

- calls: [`build`](#s-build)

<!-- note:makeCtx.setSub -->
<!-- /note -->

#### <a id="s-makeCtx-push"></a>`makeCtx.push(fn)`

prop · L107–107

<!-- note:makeCtx.push -->
<!-- /note -->

### <a id="s-paintTabs"></a>`paintTabs()`

function · L115–137

- calls: [`$`](#s-S) ×3 · [`build`](#s-build) · [`liveSubs`](#s-liveSubs) · [`panelOf`](#s-panelOf) · [`subOf`](#s-subOf) · [`el`](kit.js.md#s-el) _js/console/kit.js_
- called by: [`build`](#s-build)
- effects: dom.id `con-tabs` · dom.query `button[data-panel]` · dom.id `con-subtabs` · event.listen `click` · dom.id `con-title`

<!-- note:paintTabs -->
<!-- /note -->

### <a id="s-build"></a>`build()`

function · L139–159

- calls: [`$`](#s-S) · [`makeCtx`](#s-makeCtx) · [`paintTabs`](#s-paintTabs) · [`panelOf`](#s-panelOf) · [`runRefreshers`](#s-runRefreshers) · [`el`](kit.js.md#s-el) _js/console/kit.js_
- called by: [`act`](#s-act) · [`makeCtx.setSub`](#s-makeCtx-setSub) · [`mountConsole`](#s-mountConsole) ×3 · [`openConsole`](#s-openConsole) · [`paintTabs`](#s-paintTabs)
- effects: dom.id `con-body` · dom.query `[data-focus="${…}"]`

<!-- note:build -->
Tear down and rebuild the body for the current panel/sub.
<!-- /note -->

### <a id="s-runRefreshers"></a>`runRefreshers()`

function · L161–170

- called by: [`build`](#s-build) · [`mountConsole`](#s-mountConsole)

<!-- note:runRefreshers -->
Run the open panel's refreshers, and let none of them out.

The console paints from the HUD paint, which the ENGINE calls inside its
frame tick (sim.publishHud → store → hud paint). So a refresher that threw
took the whole tick with it, every frame, before the renderer ran: the canopy
froze solid and nothing short of a reload brought it back. A panel that
cannot draw a line is a panel with a stale line, not a dead game — it is
dropped from the list and logged once.
<!-- /note -->

### <a id="s-paintRecents"></a>`paintRecents()`

function · L172–186

- calls: [`$`](#s-S) ×2 · [`jumpTo`](#s-jumpTo) · [`el`](kit.js.md#s-el) _js/console/kit.js_ · [`runHit`](search.js.md#s-runHit) _js/console/search.js_
- via [js/console/search.js](search.js.md): `jumps.get`
- called by: [`mountConsole`](#s-mountConsole) · [`noteRecent`](#s-noteRecent)
- effects: dom.id `con-recents` · event.listen `click` · dom.id `con-foot`

<!-- note:paintRecents -->
<!-- /note -->

### <a id="s-paintHits"></a>`paintHits()`

function · L188–223

- calls: [`$`](#s-S) ×5 · [`act`](#s-act) · [`el`](kit.js.md#s-el) _js/console/kit.js_ ×8 · [`query`](search.js.md#s-query) _js/console/search.js_
- called by: [`act`](#s-act) · [`mountConsole`](#s-mountConsole) ×3
- effects: dom.id `con-hits` · dom.id `con-body` · dom.id `con-tabs` · dom.id `con-subtabs` · event.listen `click`

<!-- note:paintHits -->
- L208 · `try {` — A panel's status() is arbitrary application code, and swallowing every
  error class from it means a panel that throws renders as a blank cell
  forever — indistinguishable from one that legitimately has no status.
  Show that it broke, and say once in the log which one.
<!-- /note -->

### <a id="s-act"></a>`act(h)`

function · L225–231

- calls: [`$`](#s-S) · [`build`](#s-build) · [`paintHits`](#s-paintHits) · [`runHit`](search.js.md#s-runHit) _js/console/search.js_
- called by: [`mountConsole`](#s-mountConsole) · [`paintHits`](#s-paintHits)
- effects: dom.id `con-q`

<!-- note:act -->
<!-- /note -->

### <a id="s-click"></a>`click(id)`

function · L233–233

- called by: [`registerStaticJumps`](#s-registerStaticJumps) ×14
- effects: dom.id `‹id›`

<!-- note:click -->
---- static jumps: the leaves that never belonged to a panel --------------
<!-- /note -->

### <a id="s-stText"></a>`stText(id, dflt=)`

function · L234–234

- called by: [`registerStaticJumps`](#s-registerStaticJumps) ×8
- effects: dom.id `‹id›`

<!-- note:stText -->
<!-- /note -->

### <a id="s-onOff"></a>`onOff(b)`

function · L235–235

- called by: [`registerStaticJumps.status~3`](#s-registerStaticJumps-status-3) · [`registerStaticJumps.status~4`](#s-registerStaticJumps-status-4)

<!-- note:onOff -->
<!-- /note -->

### <a id="s-S-2"></a>`S()`

function · L236–236

- via [js/core/store.js](../core/store.js.md): `useGameStore.getState`
- called by: [`registerStaticJumps.run`](#s-registerStaticJumps-run) · [`registerStaticJumps.status~2`](#s-registerStaticJumps-status-2) · [`registerStaticJumps.status~3`](#s-registerStaticJumps-status-3) · [`registerStaticJumps.status~5`](#s-registerStaticJumps-status-5) ×4 · [`registerStaticJumps.status~7`](#s-registerStaticJumps-status-7) ×2

<!-- note:S -->
<!-- /note -->

### <a id="s-registerStaticJumps"></a>`registerStaticJumps()`

function · L238–265

- calls: [`click`](#s-click) ×14 · [`registerStaticJumps>J`](#s-registerStaticJumps-J) ×20 · [`stText`](#s-stText) ×8
- called by: [`mountConsole`](#s-mountConsole)

<!-- note:registerStaticJumps -->
<!-- /note -->

#### <a id="s-registerStaticJumps-J"></a>`registerStaticJumps>J(spec)`

function · L239–239

- calls: [`registerJump`](search.js.md#s-registerJump) _js/console/search.js_
- called by: [`registerStaticJumps`](#s-registerStaticJumps) ×20

<!-- note:registerStaticJumps>J -->
<!-- /note -->

#### <a id="s-registerStaticJumps-run"></a>`registerStaticJumps.run()`

prop · L240–240

- calls: [`S`](#s-S)

<!-- note:registerStaticJumps.run -->
<!-- /note -->

#### <a id="s-registerStaticJumps-run-2"></a>`registerStaticJumps.run~2()`

prop · L242–242

- calls: [`openMapDirectory`](../ui/map.js.md#s-openMapDirectory) _js/ui/map.js_

<!-- note:registerStaticJumps.run~2 -->
<!-- /note -->

#### <a id="s-registerStaticJumps-run-3"></a>`registerStaticJumps.run~3()`

prop · L244–244

- calls: [`toggleInterior`](../interior/interior.js.md#s-toggleInterior) _js/interior/interior.js_

<!-- note:registerStaticJumps.run~3 -->
<!-- /note -->

#### <a id="s-registerStaticJumps-status"></a>`registerStaticJumps.status()`

prop · L248–248

<!-- note:registerStaticJumps.status -->
<!-- /note -->

#### <a id="s-registerStaticJumps-status-2"></a>`registerStaticJumps.status~2()`

prop · L249–249

- calls: [`S`](#s-S)

<!-- note:registerStaticJumps.status~2 -->
<!-- /note -->

#### <a id="s-registerStaticJumps-run-4"></a>`registerStaticJumps.run~4()`

prop · L251–251

- calls: [`startTutorial`](../ui/tutorial.js.md#s-startTutorial) _js/ui/tutorial.js_

<!-- note:registerStaticJumps.run~4 -->
<!-- /note -->

#### <a id="s-registerStaticJumps-status-3"></a>`registerStaticJumps.status~3()`

prop · L252–252

- calls: [`onOff`](#s-onOff) · [`S`](#s-S)

<!-- note:registerStaticJumps.status~3 -->
<!-- /note -->

#### <a id="s-registerStaticJumps-status-4"></a>`registerStaticJumps.status~4()`

prop · L253–253

- calls: [`onOff`](#s-onOff)

<!-- note:registerStaticJumps.status~4 -->
<!-- /note -->

#### <a id="s-registerStaticJumps-run-5"></a>`registerStaticJumps.run~5()`

prop · L253–253

<!-- note:registerStaticJumps.run~5 -->
<!-- /note -->

#### <a id="s-registerStaticJumps-status-5"></a>`registerStaticJumps.status~5()`

prop · L254–254

- calls: [`S`](#s-S) ×4

<!-- note:registerStaticJumps.status~5 -->
<!-- /note -->

#### <a id="s-registerStaticJumps-status-6"></a>`registerStaticJumps.status~6()`

prop · L255–255

<!-- note:registerStaticJumps.status~6 -->
<!-- /note -->

#### <a id="s-registerStaticJumps-status-7"></a>`registerStaticJumps.status~7()`

prop · L257–257

- calls: [`S`](#s-S) ×2

<!-- note:registerStaticJumps.status~7 -->
<!-- /note -->

#### <a id="s-registerStaticJumps-status-8"></a>`registerStaticJumps.status~8()`

prop · L262–262

<!-- note:registerStaticJumps.status~8 -->
<!-- /note -->

#### <a id="s-registerStaticJumps-run-6"></a>`registerStaticJumps.run~6()`

prop · L263–263

- calls: [`$`](#s-S)
- effects: dom.id `sd-reopen` · dom.query `#sd-tabs button[data-sd="${…}"]`

<!-- note:registerStaticJumps.run~6 -->
<!-- /note -->

### <a id="s-mountConsole"></a>`mountConsole()`

function · **exported** · L267–315

- calls: [`$`](#s-S) ×10 · [`act`](#s-act) · [`build`](#s-build) ×3 · [`closeConsole`](#s-closeConsole) · [`loadRecents`](#s-loadRecents) · [`openConsole`](#s-openConsole) ×3 · [`paintHits`](#s-paintHits) ×3 · [`paintRecents`](#s-paintRecents) · [`registerPanel`](#s-registerPanel) · [`registerStaticJumps`](#s-registerStaticJumps) · [`runRefreshers`](#s-runRefreshers) · [`fmtDist`](kit.js.md#s-fmtDist) _js/console/kit.js_ · [`query`](search.js.md#s-query) _js/console/search.js_ · [`setTermHold`](../sim/sim.js.md#s-setTermHold) _js/sim/sim.js_
- called by: [`mountHud`](../ui/hud.js.md#s-mountHud) _js/ui/hud.js_
- effects: dom.id `console` · dom.id `con-hold` · dom.id `con-q` · dom.query `button[data-panel]` · dom.id `con-tabs` · event.listen `click` · dom.id `con-close` · event.listen `input` · event.listen `keydown` · input.key `Enter` · input.key `Escape` · event.listen `pointerdown` · dom.id `con-sub` · dom.id `t-vel` · dom.id `t-alt` · dom.id `t-pwr` · dom.id `t-hull`

<!-- note:mountConsole -->
---- mount ---------------------------------------------------------------

Returns paintConsole(state) for hud.js.

- L270 · `gnn.open = (id) => openConsole("corp", "gnn", { focus: id });` — hooks from chat links and drone prompts open the console where they point
- L290 · `root.addEventListener("pointerdown", (e) => e.stopPropagation());` — Taps inside the console must never reach the canvas look-drag.
- L294 · `const want = state.terminalOpen && state.phase === "play";` — Panels capture the live ship object, so never survive a relaunch.
<!-- /note -->
