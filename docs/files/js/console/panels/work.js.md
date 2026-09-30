# js/console/panels/work.js

[index](../../../../README.md) · 330 lines · 42 symbols · 13 imports · 1 importers

## About

<!-- note:@file -->
LIVING GALAXY — CONSOLE › WORK: MISSION (the autopilot's orders) · DRONES · FLEET.

MISSION is the editor for js/mission/script.js: presets, the pilot's saved
list, step rows, an ADD STEP picker, a step sheet (target / until / per-step
overrides), the loop row, RUN, and the live card with the ask banner. The
editor is rebuilt on every edit (cheap, a dozen rows); only the live card
is refreshed per HUD frame. DRONES and FLEET live in their own modules.

- L295 · `export default {` — ---- the panel ------------------------------------------------------------------------
<!-- /note -->

## Imports

| line | from | names | target |
|---|---|---|---|
| 1 | `../kit.js` | `el`, `section`, `note`, `row`, `button`, `group`, `chips`, `card` | [js/console/kit.js](../kit.js.md) |
| 2 | `../../sim/sim.js` | `sim` | [js/sim/sim.js](../../sim/sim.js.md) |
| 3 | `../../world/bodies.js` | `BODIES` | [js/world/bodies.js](../../world/bodies.js.md) |
| 4 | `../../station/stations.js` | `stations` | [js/station/stations.js](../../station/stations.js.md) |
| 5 | `../../economy/upgrades.js` | `hasUpgrade` **unused** | [js/economy/upgrades.js](../../economy/upgrades.js.md) |
| 6 | `../../mission/script.js` | `OPS`, `COND_KEYS`, `COND_OPS`, `WARP_POLICIES`, `ON_FAIL`, `makeMission`, `makeStep`, `validate`, `describeStep`, `describeCond`, `presets`, `loadMissions`, `saveMissions`, `serialize`, `deserialize`, `missionCore` | [js/mission/script.js](../../mission/script.js.md) |
| 9 | `../../mission/run.js` | `mission`, `missionStatusLine`, `startMission`, `stopMission`, `pauseMission`, `resumeMission`, `answerAsk` | [js/mission/run.js](../../mission/run.js.md) |
| 10 | `./work-drones.js` | `default` as `workDrones` | [js/console/panels/work-drones.js](work-drones.js.md) |
| 11 | `./work-fleet.js` | `default` as `workFleet` | [js/console/panels/work-fleet.js](work-fleet.js.md) |
| 12 | `./work-tape.js` | `default` as `workTape` | [js/console/panels/work-tape.js](work-tape.js.md) |
| 13 | `../../economy/fabricate.js` | `fabReport`, `cancelFab` | [js/economy/fabricate.js](../../economy/fabricate.js.md) |
| 14 | `../console.js` | `closeConsole` | [js/console/console.js](../console.js.md) |
| 15 | `../../ui/tutorial.js` | `startCoreTutorial` | [js/ui/tutorial.js](../../ui/tutorial.js.md) |

## Imported by

- [js/console/console.js](../console.js.md) — `default`

## Exports

- `default` · ObjectExpression — used by [js/console/console.js](../console.js.md)

## Effects

- **dom.query** — `small` (liveCard:63)
- **event.listen** — `change on inp → (inline)` (condBuilder:114) · `change on id → (inline)` (condBuilder:120) · `change on good → (inline)` (stepSheet:146) · `change on qty → (inline)` (stepSheet:148) · `change on name → (inline)` (editor>render:234)

## Symbols

### <a id="s-DOC"></a>`DOC`

const · L17–17

<!-- note:DOC -->
<!-- /note -->

### <a id="s-CAPS"></a>`CAPS`

const · L20–20

<!-- note:CAPS -->
<!-- /note -->

### <a id="s-WARPS"></a>`WARPS`

const · L21–21

- via [js/mission/script.js](../../mission/script.js.md): `WARP_POLICIES.map`

<!-- note:WARPS -->
<!-- /note -->

### <a id="s-COND_UNITS"></a>`COND_UNITS`

const · L22–22

<!-- note:COND_UNITS -->
<!-- /note -->

### <a id="s-tell"></a>`tell(msg)`

function · L23–23

- called by: [`deny`](#s-deny) · [`denyCore`](#s-denyCore) · [`editor>render`](#s-editor-render) ×2 · [`persist`](#s-persist)

<!-- note:tell -->
<!-- /note -->

### <a id="s-deny"></a>`deny(msg, render)`

function · L24–24

- calls: [`editor>render`](#s-editor-render) · [`tell`](#s-tell)
- called by: [`editor>render`](#s-editor-render) ×2

<!-- note:deny -->
A refusal the pilot can actually SEE.

`tell` writes sim.notice, which paints on the HUD — and the console is a
full-screen sheet drawn OVER the HUD, so every "no" this editor ever gave
while it was open went somewhere the pilot could not look at. Tapping DOCK
under the one-step limit lit the chip, added nothing, opened no sheet and
said nothing: the editor looked broken rather than locked. Refusals go in
the panel now, and to the HUD as well for when the console is shut.
<!-- /note -->

### <a id="s-denyCore"></a>`denyCore(msg, render)`

function · L25–31

- calls: [`editor>render`](#s-editor-render) · [`tell`](#s-tell) · [`startCoreTutorial`](../../ui/tutorial.js.md#s-startCoreTutorial) _js/ui/tutorial.js_
- called by: [`editor>render.onPick~3`](#s-editor-render-onPick-3) · [`editor>render.onPick~4`](#s-editor-render-onPick-4)

<!-- note:denyCore -->
A refusal that is ALWAYS the same refusal — "you need a Mission core" — and
so gets the one thing a plain notice cannot give: somewhere to go. The block
explains the core, and SHOW ME HOW shuts the console and starts the
walkthrough, which finds the nearest yard that fits one and flies you there.
It also fires the walkthrough automatically the FIRST time, because a pilot
who has just been told no is exactly the pilot who needs it.

- L29 · `try { startCoreTutorial(false); } catch {` — the card is a nicety, not the fix
<!-- /note -->

### <a id="s-ed"></a>`ed`

const · L33–33

<!-- note:ed -->
the editor's state survives sub-tab hops while the console is open
<!-- /note -->

### <a id="s-list"></a>`list()`

function · L34–34

- calls: [`loadMissions`](../../mission/script.js.md#s-loadMissions) _js/mission/script.js_
- called by: [`editor>render`](#s-editor-render) ×8 · [`persist`](#s-persist)

<!-- note:list -->
<!-- /note -->

### <a id="s-persist"></a>`persist()`

function · L35–35

- calls: [`list`](#s-list) · [`tell`](#s-tell) · [`saveMissions`](../../mission/script.js.md#s-saveMissions) _js/mission/script.js_
- called by: [`editor>render`](#s-editor-render) ×4

<!-- note:persist -->
<!-- /note -->

### <a id="s-fresh"></a>`fresh(m, name=)`

function · L36–36

- calls: [`deserialize`](../../mission/script.js.md#s-deserialize) _js/mission/script.js_ · [`makeMission`](../../mission/script.js.md#s-makeMission) _js/mission/script.js_ · [`serialize`](../../mission/script.js.md#s-serialize) _js/mission/script.js_
- called by: [`editor>render`](#s-editor-render) ×2

<!-- note:fresh -->
A copy is YOURS. `builtin` is dropped along with `preset`, because the four
stock loops fly without a Mission core and a copy of one must not — otherwise
"duplicate MINE LOOP, then edit it" would be a way around the core entirely.
<!-- /note -->

### <a id="s-capLabel"></a>`capLabel(v)`

function · L37–37 · **never referenced**

<!-- note:capLabel -->
<!-- /note -->

### <a id="s-liveCard"></a>`liveCard(root, push)`

function · L39–77

- calls: [`button`](../kit.js.md#s-button) _js/console/kit.js_ ×6 · [`card`](../kit.js.md#s-card) _js/console/kit.js_ · [`el`](../kit.js.md#s-el) _js/console/kit.js_ ×5 · [`group`](../kit.js.md#s-group) _js/console/kit.js_ ×2 · [`answerAsk`](../../mission/run.js.md#s-answerAsk) _js/mission/run.js_ ×3 · [`missionStatusLine`](../../mission/run.js.md#s-missionStatusLine) _js/mission/run.js_ · [`pauseMission`](../../mission/run.js.md#s-pauseMission) _js/mission/run.js_ · [`resumeMission`](../../mission/run.js.md#s-resumeMission) _js/mission/run.js_ · [`stopMission`](../../mission/run.js.md#s-stopMission) _js/mission/run.js_ · [`describeStep`](../../mission/script.js.md#s-describeStep) _js/mission/script.js_
- via [js/mission/run.js](../../mission/run.js.md): `mission.state.toUpperCase`
- called by: [`mount`](#s-mount)
- effects: dom.query `small`

<!-- note:liveCard -->
---- the live card ---------------------------------------------------------

- L40 · `const c = card("AUTOPILOT", "—");` — the subtitle has to EXIST to be written to every frame: kit.card only adds
  the &lt;small> when it is given a hint, and "" is not one — so the refresher
  wrote textContent on null, and that threw out of the console paint, out of
  the HUD paint, and out of the engine's tick before it could render. An
  active mission plus this panel open froze the canopy for good.
<!-- /note -->

### <a id="s-targetOptions"></a>`targetOptions(op)`

function · L79–91

- called by: [`editor>render.onPick~3`](#s-editor-render-onPick-3) · [`stepSheet`](#s-stepSheet)

<!-- note:targetOptions -->
---- the step sheet ------------------------------------------------------------
<!-- /note -->

### <a id="s-refKey"></a>`refKey(r)`

function · L92–92

- called by: [`stepSheet`](#s-stepSheet) ×2 · [`stepSheet.onPick`](#s-stepSheet-onPick)

<!-- note:refKey -->
<!-- /note -->

### <a id="s-refLabel"></a>`refLabel(r)`

function · L93–93

- called by: [`stepSheet`](#s-stepSheet)

<!-- note:refLabel -->
<!-- /note -->

### <a id="s-condBuilder"></a>`condBuilder(holder, key, onChange)`

function · L95–127

- calls: [`button`](../kit.js.md#s-button) _js/console/kit.js_ ×2 · [`chips`](../kit.js.md#s-chips) _js/console/kit.js_ ×3 · [`el`](../kit.js.md#s-el) _js/console/kit.js_ ×4 · [`group`](../kit.js.md#s-group) _js/console/kit.js_ · [`condBuilder>nudge`](#s-condBuilder-nudge) ×2
- via [js/mission/script.js](../../mission/script.js.md): `COND_KEYS.map`, `COND_OPS.map`
- called by: [`editor>render`](#s-editor-render) · [`stepSheet`](#s-stepSheet)
- effects: event.listen `change`

<!-- note:condBuilder -->
metric chips × op chips × numeric stepper; writes into holder[key]
<!-- /note -->

#### <a id="s-condBuilder-onPick"></a>`condBuilder.onPick(k)`

prop · L101–105

<!-- note:condBuilder.onPick -->
<!-- /note -->

#### <a id="s-condBuilder-onPick-2"></a>`condBuilder.onPick~2(o)`

prop · L109–109

<!-- note:condBuilder.onPick~2 -->
<!-- /note -->

#### <a id="s-condBuilder-nudge"></a>`condBuilder>nudge(d)`

function · L115–115

- called by: [`condBuilder`](#s-condBuilder) ×2

<!-- note:condBuilder>nudge -->
<!-- /note -->

#### <a id="s-condBuilder-onPick-3"></a>`condBuilder.onPick~3(v)`

prop · L124–124

<!-- note:condBuilder.onPick~3 -->
<!-- /note -->

### <a id="s-stepSheet"></a>`stepSheet(m, ix, render)`

function · L129–171

- calls: [`button`](../kit.js.md#s-button) _js/console/kit.js_ ×4 · [`card`](../kit.js.md#s-card) _js/console/kit.js_ · [`chips`](../kit.js.md#s-chips) _js/console/kit.js_ ×7 · [`el`](../kit.js.md#s-el) _js/console/kit.js_ ×8 · [`group`](../kit.js.md#s-group) _js/console/kit.js_ ×2 · [`condBuilder`](#s-condBuilder) · [`editor>render`](#s-editor-render) ×6 · [`refKey`](#s-refKey) ×2 · [`refLabel`](#s-refLabel) · [`targetOptions`](#s-targetOptions) · [`describeStep`](../../mission/script.js.md#s-describeStep) _js/mission/script.js_
- via [js/mission/script.js](../../mission/script.js.md): `ON_FAIL.map`
- called by: [`editor>render`](#s-editor-render)
- effects: event.listen `change`

<!-- note:stepSheet -->
<!-- /note -->

#### <a id="s-stepSheet-onPick"></a>`stepSheet.onPick(id)`

prop · L137–137

- calls: [`editor>render`](#s-editor-render) · [`refKey`](#s-refKey)

<!-- note:stepSheet.onPick -->
<!-- /note -->

#### <a id="s-stepSheet-onPick-2"></a>`stepSheet.onPick~2(w)`

prop · L141–141

- calls: [`editor>render`](#s-editor-render)

<!-- note:stepSheet.onPick~2 -->
<!-- /note -->

#### <a id="s-stepSheet-onPick-3"></a>`stepSheet.onPick~3(v)`

prop · L153–153

- calls: [`editor>render`](#s-editor-render)

<!-- note:stepSheet.onPick~3 -->
<!-- /note -->

#### <a id="s-stepSheet-onPick-4"></a>`stepSheet.onPick~4(v)`

prop · L154–154

- calls: [`editor>render`](#s-editor-render)

<!-- note:stepSheet.onPick~4 -->
<!-- /note -->

#### <a id="s-stepSheet-onPick-5"></a>`stepSheet.onPick~5(v)`

prop · L161–161

- calls: [`editor>render`](#s-editor-render)

<!-- note:stepSheet.onPick~5 -->
<!-- /note -->

#### <a id="s-stepSheet-onPick-6"></a>`stepSheet.onPick~6(v)`

prop · L162–162

- calls: [`editor>render`](#s-editor-render)

<!-- note:stepSheet.onPick~6 -->
<!-- /note -->

#### <a id="s-stepSheet-onPick-7"></a>`stepSheet.onPick~7(v)`

prop · L163–163

- calls: [`editor>render`](#s-editor-render)

<!-- note:stepSheet.onPick~7 -->
<!-- /note -->

### <a id="s-editor"></a>`editor(root, ctx)`

function · L173–293

- calls: [`el`](../kit.js.md#s-el) _js/console/kit.js_ · [`editor>render`](#s-editor-render)
- called by: [`mount`](#s-mount)

<!-- note:editor -->
---- the editor -------------------------------------------------------------------

- L176 · `const core = () => missionCore();` — either core — js/mission/run.js
<!-- /note -->

#### <a id="s-editor-core"></a>`editor>core()`

function · L176–176

- calls: [`missionCore`](../../mission/script.js.md#s-missionCore) _js/mission/script.js_
- called by: [`editor>render`](#s-editor-render) ×2 · [`editor>render.onPick~4`](#s-editor-render-onPick-4)

<!-- note:editor>core -->
<!-- /note -->

#### <a id="s-editor-render"></a>`editor>render()`

function · L177–291

- calls: [`closeConsole`](../console.js.md#s-closeConsole) _js/console/console.js_ · [`button`](../kit.js.md#s-button) _js/console/kit.js_ ×16 · [`chips`](../kit.js.md#s-chips) _js/console/kit.js_ ×4 · [`el`](../kit.js.md#s-el) _js/console/kit.js_ ×5 · [`group`](../kit.js.md#s-group) _js/console/kit.js_ ×4 · [`note`](../kit.js.md#s-note) _js/console/kit.js_ ×8 · [`row`](../kit.js.md#s-row) _js/console/kit.js_ ×9 · [`section`](../kit.js.md#s-section) _js/console/kit.js_ ×5 · [`condBuilder`](#s-condBuilder) · [`deny`](#s-deny) ×2 · [`editor>core`](#s-editor-core) ×2 · [`editor>render`](#s-editor-render) ×11 · [`fresh`](#s-fresh) ×2 · [`list`](#s-list) ×8 · [`persist`](#s-persist) ×4 · [`stepSheet`](#s-stepSheet) · [`tell`](#s-tell) ×2 · [`cancelFab`](../../economy/fabricate.js.md#s-cancelFab) _js/economy/fabricate.js_ · [`fabReport`](../../economy/fabricate.js.md#s-fabReport) _js/economy/fabricate.js_ · [`startMission`](../../mission/run.js.md#s-startMission) _js/mission/run.js_ ×3 · [`describeCond`](../../mission/script.js.md#s-describeCond) _js/mission/script.js_ ×3 · [`describeStep`](../../mission/script.js.md#s-describeStep) _js/mission/script.js_ · [`deserialize`](../../mission/script.js.md#s-deserialize) _js/mission/script.js_ · [`makeMission`](../../mission/script.js.md#s-makeMission) _js/mission/script.js_ · [`presets`](../../mission/script.js.md#s-presets) _js/mission/script.js_ · [`serialize`](../../mission/script.js.md#s-serialize) _js/mission/script.js_ · [`validate`](../../mission/script.js.md#s-validate) _js/mission/script.js_ · [`startCoreTutorial`](../../ui/tutorial.js.md#s-startCoreTutorial) _js/ui/tutorial.js_
- via [js/console/kit.js](../kit.js.md): `row.value.append`
- called by: [`deny`](#s-deny) · [`denyCore`](#s-denyCore) · [`editor`](#s-editor) · [`editor>render`](#s-editor-render) ×11 · [`editor>render.onPick~3`](#s-editor-render-onPick-3) · [`editor>render.onPick~4`](#s-editor-render-onPick-4) · [`stepSheet`](#s-stepSheet) ×6 · [`stepSheet.onPick`](#s-stepSheet-onPick) · [`stepSheet.onPick~2`](#s-stepSheet-onPick-2) · [`stepSheet.onPick~3`](#s-stepSheet-onPick-3) · [`stepSheet.onPick~4`](#s-stepSheet-onPick-4) · [`stepSheet.onPick~5`](#s-stepSheet-onPick-5) · [`stepSheet.onPick~6`](#s-stepSheet-onPick-6) · [`stepSheet.onPick~7`](#s-stepSheet-onPick-7)
- effects: event.listen `change`

<!-- note:editor>render -->
- L191 · `const jobs = fabReport();` — presets
- L191 · `const jobs = fabReport();` — What is on the ports' lines, wherever you are. A fabrication job runs on
  sim time at a berth you have probably already left, so without this the
  only way to know how it was getting on was to fly back and open the deck.
- L204 · `const sp = section("PRESETS");` — The four stock loops. They are `builtin`, so RUN flies them whether or
  not a Mission core is aboard — the core gates missions you WRITE, and
  gating the ones the game ships with left a coreless pilot with no
  multi-step autopilot at all. COPY lifts one into the editor, and that
  copy is yours, and gated.
- L218 · `const ss = section("SAVED MISSIONS");` — the saved list
- L230 · `const m = ed.draft ??= makeMission({ name: "New mission", steps: [], createdAt: sim.time }` — the draft
- L240 · `const errs = validate(m);` — steps
- L249 · `const locked = !core() && m.steps.length >= 1;` — The one-step limit is stated BEFORE it is hit, not after. Without a
  Mission core a mission is one step, and a row of chips that all look
  tappable is a promise the editor cannot keep.
- L266 · `const L = m.loop;` — loop
- L285 · `deny(sim.notice || "The autopilot would not take that mission.", render);` — startMission already put its reason on sim.notice, behind this sheet
<!-- /note -->

##### <a id="s-editor-render-onPick"></a>`editor>render.onPick(v)`

prop · L237–237

<!-- note:editor>render.onPick -->
<!-- /note -->

##### <a id="s-editor-render-onPick-2"></a>`editor>render.onPick~2(v)`

prop · L239–239

<!-- note:editor>render.onPick~2 -->
<!-- /note -->

##### <a id="s-editor-render-onPick-3"></a>`editor>render.onPick~3(op)`

prop · L254–261

- calls: [`denyCore`](#s-denyCore) · [`editor>render`](#s-editor-render) · [`targetOptions`](#s-targetOptions) · [`makeStep`](../../mission/script.js.md#s-makeStep) _js/mission/script.js_

<!-- note:editor>render.onPick~3 -->
<!-- /note -->

##### <a id="s-editor-render-onPick-4"></a>`editor>render.onPick~4(mode)`

prop · L270–274

- calls: [`denyCore`](#s-denyCore) · [`editor>core`](#s-editor-core) · [`editor>render`](#s-editor-render)

<!-- note:editor>render.onPick~4 -->
<!-- /note -->

### <a id="s-mount"></a>`mount(root, ctx)`

prop · L300–309

- calls: [`editor`](#s-editor) · [`liveCard`](#s-liveCard) · [`loadMissions`](../../mission/script.js.md#s-loadMissions) _js/mission/script.js_
- via [js/console/panels/work-drones.js](work-drones.js.md): `workDrones.mount`
- via [js/console/panels/work-fleet.js](work-fleet.js.md): `workFleet.mount`
- via [js/console/panels/work-tape.js](work-tape.js.md): `workTape.mount`

<!-- note:mount -->
<!-- /note -->

### <a id="s-paint"></a>`paint(state, ctx)`

prop · L310–316

- via [js/console/panels/work-drones.js](work-drones.js.md): `workDrones.paint`
- via [js/console/panels/work-fleet.js](work-fleet.js.md): `workFleet.paint`
- via [js/console/panels/work-tape.js](work-tape.js.md): `workTape.paint`

<!-- note:paint -->
<!-- /note -->

### <a id="s-unmount"></a>`unmount(ctx)`

prop · L317–322

- via [js/console/panels/work-drones.js](work-drones.js.md): `workDrones.unmount`
- via [js/console/panels/work-fleet.js](work-fleet.js.md): `workFleet.unmount`
- via [js/console/panels/work-tape.js](work-tape.js.md): `workTape.unmount`

<!-- note:unmount -->
<!-- /note -->

### <a id="s-search"></a>`search()`

prop · L323–329

- calls: [`missionStatusLine`](../../mission/run.js.md#s-missionStatusLine) _js/mission/run.js_ · [`loadMissions`](../../mission/script.js.md#s-loadMissions) _js/mission/script.js_ · [`presets`](../../mission/script.js.md#s-presets) _js/mission/script.js_
- via [js/console/panels/work-drones.js](work-drones.js.md): `workDrones.search`
- via [js/console/panels/work-fleet.js](work-fleet.js.md): `workFleet.search`
- via [js/console/panels/work-tape.js](work-tape.js.md): `workTape.search`

<!-- note:search -->
<!-- /note -->

#### <a id="s-search-run"></a>`search.run()`

prop · L325–325

- calls: [`startMission`](../../mission/run.js.md#s-startMission) _js/mission/run.js_

<!-- note:search.run -->
<!-- /note -->

#### <a id="s-search-run-2"></a>`search.run~2()`

prop · L327–327

- calls: [`stopMission`](../../mission/run.js.md#s-stopMission) _js/mission/run.js_

<!-- note:search.run~2 -->
<!-- /note -->
