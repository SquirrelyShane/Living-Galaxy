# js/ui/tutorial.js

[index](../../../README.md) · 370 lines · 55 symbols · 13 imports · 4 importers

## About

<!-- note:@file -->
LIVING GALAXY experimental — the adaptive tutorial.

Not a script; a set of checks against the live sky. Each step looks at what
is actually around the ship — the nearest unsurveyed world, the nearest
rock or debris chunk, where the belt is from here, the nearest port, who is
aboard — and writes its instruction from that. So it works in Sol and in a
rolled sky alike: every sky has a main belt and an outer ice belt, so
whatever the trade, the material is out there and the step can point at it.

Steps advance on what you DO (speed, a scan, a lock, cargo climbing, a
dock, a hire), not on what you tap. NEXT only exists where there is
nothing to measure. SKIP ends it; it is remembered per device.
<!-- /note -->

## Imports

| line | from | names | target |
|---|---|---|---|
| 1 | `../sim/sim.js` | `acquireLock`, `addAnchoredWaypoint`, `addBodyWaypoint`, `addWaypointAt`, `logEvent`, `selectBody`, `sim` | [js/sim/sim.js](../sim/sim.js.md) |
| 2 | `../world/hulks.js` | `hulks` | [js/world/hulks.js](../world/hulks.js.md) |
| 3 | `../flight/rig.js` | `nextSection`, `rigRange` | [js/flight/rig.js](../flight/rig.js.md) |
| 4 | `../world/bodies.js` | `BODIES`, `bodyPosition`, `currentSystem`, `scanRadius` | [js/world/bodies.js](../world/bodies.js.md) |
| 5 | `../station/stations.js` | `nearestStation` | [js/station/stations.js](../station/stations.js.md) |
| 6 | `../world/field.js` | `nearbyRocks` | [js/world/field.js](../world/field.js.md) |
| 7 | `../world/debris.js` | `chunks` | [js/world/debris.js](../world/debris.js.md) |
| 8 | `../flight/turrets.js` | `MINE_RANGE` | [js/flight/turrets.js](../flight/turrets.js.md) |
| 9 | `../crew/ledger.js` | `crew` | [js/crew/ledger.js](../crew/ledger.js.md) |
| 10 | `../flight/pilot.js` | `pilot` | [js/flight/pilot.js](../flight/pilot.js.md) |
| 11 | `../flight/ship.js` | `cargoTotal`, `speedOf` | [js/flight/ship.js](../flight/ship.js.md) |
| 12 | `../interior/interior.js` | `interior` | [js/interior/interior.js](../interior/interior.js.md) |
| 13 | `./tutorial-core.js` | `CORE_STEPS`, `resetCoreTrack` | [js/ui/tutorial-core.js](tutorial-core.js.md) |

## Imported by

- [js/console/console.js](../console/console.js.md) — `startTutorial`
- [js/console/panels/work.js](../console/panels/work.js.md) — `startCoreTutorial`
- [js/render/engine.js](../render/engine.js.md) — `tickTutorial`, `wireTutorialTest`
- [js/ui/hud.js](hud.js.md) — `startTutorial`

## Exports

- [`tutorial`](#s-tutorial) · const — **no importer in scanned roots**
- [`startTutorial`](#s-startTutorial) · function — used by [js/console/console.js](../console/console.js.md), [js/ui/hud.js](hud.js.md)
- [`startCoreTutorial`](#s-startCoreTutorial) · function — used by [js/console/panels/work.js](../console/panels/work.js.md)
- [`skipTutorial`](#s-skipTutorial) · function — **no importer in scanned roots**
- [`tickTutorial`](#s-tickTutorial) · function — used by [js/render/engine.js](../render/engine.js.md)
- [`tutorialSteps`](#s-tutorialSteps) · function — **no importer in scanned roots**
- [`tutorialContext`](#s-tutorialContext) · function — **no importer in scanned roots**
- [`tutorialEvaluate`](#s-tutorialEvaluate) · function — **no importer in scanned roots**
- [`wireTutorialTest`](#s-wireTutorialTest) · function — used by [js/render/engine.js](../render/engine.js.md)

## Effects

- **dom.create** — `div` (ensureRoot:285)
- **dom.id** — `hud` (ensureRoot:283)
- **dom.query** — `#tutor-head` (ensureRoot:298) · `#tutor-skip` (ensureRoot:299) · `#tutor-next` (ensureRoot:300, paint:353) · `#tutor-act` (ensureRoot:301, paint:346) · `#tutor-alt` (ensureRoot:304, paint:350) · `[${…}]` (clearHilite:316) · `‹sel›` (setHilite:325) · `#tutor-title` (paint:342) · `#tutor-n` (paint:343) · `#tutor-text` (paint:344)
- **event.listen** — `click on root.querySelector() → (inline)` (ensureRoot:298, ensureRoot:300, ensureRoot:301, ensureRoot:304) · `click on root.querySelector() → skipTutorial` (ensureRoot:299)
- **storage.get** — `‹LS_KEY›` (startTutorial:193) · `‹CORE_KEY›` (startCoreTutorial:210)
- **storage.set** — `‹CORE_KEY›` (startCoreTutorial:212) · `‹(conditional)›` (finish:233)

## Symbols

### <a id="s-LS_KEY"></a>`LS_KEY`

const · L15–15

<!-- note:LS_KEY -->
<!-- /note -->

### <a id="s-CORE_KEY"></a>`CORE_KEY`

const · L16–16

<!-- note:CORE_KEY -->
<!-- /note -->

### <a id="s-tutorial"></a>`tutorial`

const · **exported** · L18–29

<!-- note:tutorial -->
- L23 · `track: "intro",` — which set of lessons is running: the intro, or a track started on demand
- L24 · `resume: null,` — where the intro was when a track cut in front of it
- L25 · `base: {},` — baselines captured when a step starts
<!-- /note -->

### <a id="s-fmt"></a>`fmt(d)`

function · L31–36

- called by: [`STEPS.text`](#s-STEPS-text) · [`STEPS.text~2`](#s-STEPS-text-2) ×2 · [`STEPS.text~3`](#s-STEPS-text-3) · [`STEPS.text~4`](#s-STEPS-text-4) ×6 · [`STEPS.text~5`](#s-STEPS-text-5) ×2

<!-- note:fmt -->
<!-- /note -->

### <a id="s-_p"></a>`_p`

const · L38–38

<!-- note:_p -->
<!-- /note -->

### <a id="s-buildCtx"></a>`buildCtx()`

function · L40–97

- calls: [`nextSection`](../flight/rig.js.md#s-nextSection) _js/flight/rig.js_ · [`rigRange`](../flight/rig.js.md#s-rigRange) _js/flight/rig.js_ · [`cargoTotal`](../flight/ship.js.md#s-cargoTotal) _js/flight/ship.js_ · [`speedOf`](../flight/ship.js.md#s-speedOf) _js/flight/ship.js_ · [`nearestStation`](../station/stations.js.md#s-nearestStation) _js/station/stations.js_ · [`bodyPosition`](../world/bodies.js.md#s-bodyPosition) _js/world/bodies.js_ · [`scanRadius`](../world/bodies.js.md#s-scanRadius) _js/world/bodies.js_ · [`nearbyRocks`](../world/field.js.md#s-nearbyRocks) _js/world/field.js_
- via [js/sim/sim.js](../sim/sim.js.md): `sim.scanned.has`
- called by: [`finish`](#s-finish) · [`startCoreTutorial`](#s-startCoreTutorial) · [`startTutorial`](#s-startTutorial) · [`tickTutorial`](#s-tickTutorial) · [`tutorialContext`](#s-tutorialContext) · [`tutorialEvaluate`](#s-tutorialEvaluate)

<!-- note:buildCtx -->
What the tutorial can see right now. Rebuilt twice a second.

- L66 · `let bh = Infinity, bu = Infinity;` — nearest world and nearest unsurveyed world
- L77 · `let br = Infinity;` — nearest cuttable thing: belt rock or impact debris
- L86 · `const belt = currentSystem.belt ?? currentSystem.outerBelt;` — where the belt is from here: the nearest point of the main ring
<!-- /note -->

### <a id="s-STEPS"></a>`STEPS`

const · L99–182

<!-- note:STEPS -->
---- the steps ------------------------------------------------------------
<!-- /note -->

#### <a id="s-STEPS-text"></a>`STEPS.text(c)`

prop · L103–103

- calls: [`fmt`](#s-fmt)

<!-- note:STEPS.text -->
<!-- /note -->

#### <a id="s-STEPS-done"></a>`STEPS.done(c)`

prop · L104–104

<!-- note:STEPS.done -->
<!-- /note -->

#### <a id="s-STEPS-text-2"></a>`STEPS.text~2(c)`

prop · L109–111

- calls: [`fmt`](#s-fmt) ×2

<!-- note:STEPS.text~2 -->
<!-- /note -->

#### <a id="s-STEPS-action"></a>`STEPS.action(c)`

prop · L112–112

<!-- note:STEPS.action -->
<!-- /note -->

##### <a id="s-STEPS-action-run"></a>`STEPS.action.run()`

prop · L112–112

- calls: [`addBodyWaypoint`](../sim/sim.js.md#s-addBodyWaypoint) _js/sim/sim.js_ · [`selectBody`](../sim/sim.js.md#s-selectBody) _js/sim/sim.js_

<!-- note:STEPS.action.run -->
<!-- /note -->

#### <a id="s-STEPS-done-2"></a>`STEPS.done~2(c, base)`

prop · L113–113

<!-- note:STEPS.done~2 -->
<!-- /note -->

#### <a id="s-STEPS-text-3"></a>`STEPS.text~3(c)`

prop · L118–123

- calls: [`fmt`](#s-fmt)

<!-- note:STEPS.text~3 -->
<!-- /note -->

#### <a id="s-STEPS-done-3"></a>`STEPS.done~3(c)`

prop · L124–124

<!-- note:STEPS.done~3 -->
<!-- /note -->

#### <a id="s-STEPS-title"></a>`STEPS.title(c)`

prop · L128–128

<!-- note:STEPS.title -->
<!-- /note -->

#### <a id="s-STEPS-text-4"></a>`STEPS.text~4(c)`

prop · L129–142

- calls: [`fmt`](#s-fmt) ×6

<!-- note:STEPS.text~4 -->
<!-- /note -->

#### <a id="s-STEPS-action-2"></a>`STEPS.action~2(c)`

prop · L143–147

<!-- note:STEPS.action~2 -->
<!-- /note -->

##### <a id="s-STEPS-action-2-run"></a>`STEPS.action~2.run()`

prop · L144–144

- calls: [`addWaypointAt`](../sim/sim.js.md#s-addWaypointAt) _js/sim/sim.js_

<!-- note:STEPS.action~2.run -->
<!-- /note -->

##### <a id="s-STEPS-action-2-run-2"></a>`STEPS.action~2.run~2()`

prop · L146–146

- calls: [`acquireLock`](../sim/sim.js.md#s-acquireLock) _js/sim/sim.js_ · [`addAnchoredWaypoint`](../sim/sim.js.md#s-addAnchoredWaypoint) _js/sim/sim.js_

<!-- note:STEPS.action~2.run~2 -->
<!-- /note -->

#### <a id="s-STEPS-done-4"></a>`STEPS.done~4(c, base)`

prop · L148–148

<!-- note:STEPS.done~4 -->
<!-- /note -->

#### <a id="s-STEPS-next"></a>`STEPS.next(c)`

prop · L149–149

<!-- note:STEPS.next -->
<!-- /note -->

#### <a id="s-STEPS-text-5"></a>`STEPS.text~5(c)`

prop · L154–156

- calls: [`fmt`](#s-fmt) ×2

<!-- note:STEPS.text~5 -->
<!-- /note -->

#### <a id="s-STEPS-action-3"></a>`STEPS.action~3(c)`

prop · L157–157

<!-- note:STEPS.action~3 -->
<!-- /note -->

##### <a id="s-STEPS-action-3-run"></a>`STEPS.action~3.run()`

prop · L157–157

- calls: [`acquireLock`](../sim/sim.js.md#s-acquireLock) _js/sim/sim.js_

<!-- note:STEPS.action~3.run -->
<!-- /note -->

#### <a id="s-STEPS-done-5"></a>`STEPS.done~5(c)`

prop · L158–158

<!-- note:STEPS.done~5 -->
<!-- /note -->

#### <a id="s-STEPS-text-6"></a>`STEPS.text~6()`

prop · L163–163

<!-- note:STEPS.text~6 -->
<!-- /note -->

#### <a id="s-STEPS-done-6"></a>`STEPS.done~6(c, base)`

prop · L164–164

<!-- note:STEPS.done~6 -->
<!-- /note -->

#### <a id="s-STEPS-text-7"></a>`STEPS.text~7()`

prop · L169–169

<!-- note:STEPS.text~7 -->
<!-- /note -->

#### <a id="s-STEPS-done-7"></a>`STEPS.done~7(c)`

prop · L170–170

<!-- note:STEPS.done~7 -->
<!-- /note -->

#### <a id="s-STEPS-next-2"></a>`STEPS.next~2()`

prop · L171–171

<!-- note:STEPS.next~2 -->
<!-- /note -->

#### <a id="s-STEPS-text-8"></a>`STEPS.text~8(c)`

prop · L176–178

<!-- note:STEPS.text~8 -->
<!-- /note -->

#### <a id="s-STEPS-done-8"></a>`STEPS.done~8()`

prop · L179–179

<!-- note:STEPS.done~8 -->
<!-- /note -->

#### <a id="s-STEPS-next-3"></a>`STEPS.next~3()`

prop · L180–180

<!-- note:STEPS.next~3 -->
<!-- /note -->

### <a id="s-TRACKS"></a>`TRACKS`

const · L184–184

<!-- note:TRACKS -->
The lesson sets. `intro` runs itself on a fresh device; `core` is started by
the WORK editor when it refuses an edit, and is the only one that can cut in
front of another — see startCoreTutorial.
<!-- /note -->

### <a id="s-steps"></a>`steps()`

function · L185–185

- called by: [`advance`](#s-advance) ×2 · [`ensureRoot`](#s-ensureRoot) ×2 · [`paint`](#s-paint) ×2 · [`tickTutorial`](#s-tickTutorial) · [`tutorialEvaluate`](#s-tutorialEvaluate) · [`tutorialSteps`](#s-tutorialSteps)

<!-- note:steps -->
<!-- /note -->

### <a id="s-captureBase"></a>`captureBase(c)`

function · L187–189

- called by: [`advance`](#s-advance) · [`finish`](#s-finish) · [`startCoreTutorial`](#s-startCoreTutorial) · [`startTutorial`](#s-startTutorial)

<!-- note:captureBase -->
---- driver -------------------------------------------------------------
<!-- /note -->

### <a id="s-startTutorial"></a>`startTutorial(force=)`

function · **exported** · L191–206

- calls: [`logEvent`](../sim/sim.js.md#s-logEvent) _js/sim/sim.js_ · [`buildCtx`](#s-buildCtx) · [`captureBase`](#s-captureBase) · [`paint`](#s-paint)
- called by: [`registerStaticJumps.run~4`](../console/console.js.md#s-registerStaticJumps-run-4) _js/console/console.js_ · [`mountHud`](hud.js.md#s-mountHud) _js/ui/hud.js_ · [`mountHud>go`](hud.js.md#s-mountHud-go) _js/ui/hud.js_
- effects: storage.get `‹LS_KEY›`

<!-- note:startTutorial -->
- L193 · `try { if (localStorage.getItem(LS_KEY) === "done") return false; } catch {` — no storage
<!-- /note -->

### <a id="s-startCoreTutorial"></a>`startCoreTutorial(force=)`

function · **exported** · L208–225

- calls: [`logEvent`](../sim/sim.js.md#s-logEvent) _js/sim/sim.js_ · [`resetCoreTrack`](tutorial-core.js.md#s-resetCoreTrack) _js/ui/tutorial-core.js_ · [`buildCtx`](#s-buildCtx) · [`captureBase`](#s-captureBase) · [`paint`](#s-paint)
- called by: [`denyCore`](../console/panels/work.js.md#s-denyCore) _js/console/panels/work.js_ · [`editor>render`](../console/panels/work.js.md#s-editor-render) _js/console/panels/work.js_
- effects: storage.get `‹CORE_KEY›` · storage.set `‹CORE_KEY›`

<!-- note:startCoreTutorial -->
The MISSION CORE track — what the WORK editor calls when it has just told a
pilot they need a core. Shown once on its own; the editor's SHOW ME button
passes force and can bring it back any time.

It saves whatever the intro was doing and hands the card back afterwards, so
a pilot who hits the mission wall three steps into the intro does not lose
those three steps.

- L210 · `try { if (localStorage.getItem(CORE_KEY) === "done") return false; } catch {` — no storage
- L212 · `try { localStorage.setItem(CORE_KEY, "done"); } catch {   }` — Marked seen on the way IN, not on the way out. Otherwise the editor pops
  the card again on every refusal until the core is bought, which is exactly
  the pilot least in the mood for it. SHOW ME HOW passes force.
- L212 · `try { localStorage.setItem(CORE_KEY, "done"); } catch {` — no storage
<!-- /note -->

### <a id="s-skipTutorial"></a>`skipTutorial()`

function · **exported** · L227–229

- calls: [`finish`](#s-finish)

<!-- note:skipTutorial -->
<!-- /note -->

### <a id="s-finish"></a>`finish(how)`

function · L231–252

- calls: [`logEvent`](../sim/sim.js.md#s-logEvent) _js/sim/sim.js_ · [`buildCtx`](#s-buildCtx) · [`captureBase`](#s-captureBase) · [`clearHilite`](#s-clearHilite) · [`paint`](#s-paint)
- called by: [`advance`](#s-advance) · [`skipTutorial`](#s-skipTutorial) · [`tickTutorial`](#s-tickTutorial)
- effects: storage.set `‹(conditional)›`

<!-- note:finish -->
- L233 · `try { localStorage.setItem(wasCore ? CORE_KEY : LS_KEY, "done"); } catch {` — fine
- L238 · `if (wasCore && tutorial.resume && how !== "skipped") {` — a track that cut in front of the intro gives the card back
<!-- /note -->

### <a id="s-advance"></a>`advance()`

function · L254–260

- calls: [`logEvent`](../sim/sim.js.md#s-logEvent) _js/sim/sim.js_ · [`captureBase`](#s-captureBase) · [`finish`](#s-finish) · [`label`](#s-label) · [`paint`](#s-paint) · [`steps`](#s-steps) ×2
- called by: [`ensureRoot`](#s-ensureRoot) · [`tickTutorial`](#s-tickTutorial)

<!-- note:advance -->
<!-- /note -->

### <a id="s-label"></a>`label(t, c)`

function · L262–264

- called by: [`advance`](#s-advance) · [`paint`](#s-paint)

<!-- note:label -->
<!-- /note -->

### <a id="s-tickTutorial"></a>`tickTutorial(dt)`

function · **exported** · L266–276

- calls: [`advance`](#s-advance) · [`buildCtx`](#s-buildCtx) · [`finish`](#s-finish) · [`paint`](#s-paint) · [`steps`](#s-steps)
- called by: [`mountGame>tick`](../render/engine.js.md#s-mountGame-tick) _js/render/engine.js_

<!-- note:tickTutorial -->
Called from the render loop with real seconds.
<!-- /note -->

### <a id="s-lastText"></a>`lastText`

const · L278–278

<!-- note:lastText -->
---- card ---------------------------------------------------------------
<!-- /note -->

### <a id="s-ensureRoot"></a>`ensureRoot()`

function · L280–309

- calls: [`advance`](#s-advance) · [`steps`](#s-steps) ×2
- called by: [`paint`](#s-paint)
- effects: dom.id `hud` · dom.create `div` · event.listen `click` · dom.query `#tutor-head` · dom.query `#tutor-skip` · dom.query `#tutor-next` · dom.query `#tutor-act` · dom.query `#tutor-alt`

<!-- note:ensureRoot -->
<!-- /note -->

### <a id="s-HI"></a>`HI`

const · L311–311

<!-- note:HI -->
The control a step is talking about, lit up.

"Tap DOCK" is worth very little when DOCK is one of twenty switches on the
second dash page. A step names a selector, this pulses it, and exactly one
thing is ever lit at a time.

It is an ATTRIBUTE and not a class on purpose. The HUD owns the className of
the controls worth pointing at — hud.js writes `warpBar.className` outright
every frame — so a class here survives about 16 ms on the one button the
walkthrough most needs to point at. An attribute nobody else writes survives
a repaint, and still reaches CSS.
<!-- /note -->

### <a id="s-hiliteSel"></a>`hiliteSel`

const · L312–312

<!-- note:hiliteSel -->
<!-- /note -->

### <a id="s-clearHilite"></a>`clearHilite()`

function · L314–318

- called by: [`finish`](#s-finish) · [`paint`](#s-paint) · [`setHilite`](#s-setHilite)
- effects: dom.query `[${…}]`

<!-- note:clearHilite -->
<!-- /note -->

### <a id="s-setHilite"></a>`setHilite(sel)`

function · L320–327

- calls: [`clearHilite`](#s-clearHilite)
- called by: [`paint`](#s-paint)
- effects: dom.query `‹sel›`

<!-- note:setHilite -->
Re-applied on every paint rather than latched, for the same reason: a HUD
repaint can take the mark off, and a latched selector would claim it was
already lit while the step pointed at nothing.
<!-- /note -->

### <a id="s-paint"></a>`paint(force)`

function · L329–354

- calls: [`clearHilite`](#s-clearHilite) · [`ensureRoot`](#s-ensureRoot) · [`label`](#s-label) · [`setHilite`](#s-setHilite) · [`steps`](#s-steps) ×2
- called by: [`advance`](#s-advance) · [`finish`](#s-finish) · [`startCoreTutorial`](#s-startCoreTutorial) · [`startTutorial`](#s-startTutorial) · [`tickTutorial`](#s-tickTutorial)
- effects: dom.query `#tutor-title` · dom.query `#tutor-n` · dom.query `#tutor-text` · dom.query `#tutor-act` · dom.query `#tutor-alt` · dom.query `#tutor-next`

<!-- note:paint -->
<!-- /note -->

### <a id="s-tutorialSteps"></a>`tutorialSteps()`

function · **exported** · L356–358

- calls: [`steps`](#s-steps)

<!-- note:tutorialSteps -->
Test/console access: step list and a synchronous evaluate.
<!-- /note -->

### <a id="s-tutorialContext"></a>`tutorialContext()`

function · **exported** · L359–361

- calls: [`buildCtx`](#s-buildCtx)

<!-- note:tutorialContext -->
<!-- /note -->

### <a id="s-tutorialEvaluate"></a>`tutorialEvaluate()`

function · **exported** · L362–366

- calls: [`buildCtx`](#s-buildCtx) · [`steps`](#s-steps)

<!-- note:tutorialEvaluate -->
<!-- /note -->

### <a id="s-wireTutorialTest"></a>`wireTutorialTest()`

function · **exported** · L368–370

- called by: [`mountGame`](../render/engine.js.md#s-mountGame) _js/render/engine.js_

<!-- note:wireTutorialTest -->
<!-- /note -->
