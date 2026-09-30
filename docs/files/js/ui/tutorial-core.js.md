# js/ui/tutorial-core.js

[index](../../../README.md) · 144 lines · 42 symbols · 5 imports · 1 importers

## About

<!-- note:@file -->
LIVING GALAXY — the MISSION CORE track: a second tutorial, run on demand.

The intro track in tutorial.js teaches the ship. This one teaches ONE
purchase, and it only ever runs because the pilot walked into the wall: they
tried to add a second step or set a loop in CONSOLE › WORK, the editor said
no, and "refit at a logistic or military yard" is not an instruction anybody
can follow the first time they read it. Which yard. Where. How much. What
menu.

So it answers those in order, and it answers them about the sky that is
actually out there: the port it names is the nearest one whose lines fit a
core, picked once and then PINNED (`core.stId`), because a nearest-port that
moves while you fly to it is how a pilot ends up chasing two stations.

Same contract as the intro steps — { id, title, text, done, action, next },
plus `hilite`, a selector for the control the step is talking about, because
"tap DOCK" is worth very little when DOCK is on dash page 2. Steps advance on
measured state (distance closing, the berth taken, the core aboard); NEXT
only exists on the one step that has nothing to measure.

Kept out of tutorial.js because that file is on the 600-line gate.
<!-- /note -->

## Imports

| line | from | names | target |
|---|---|---|---|
| 1 | `../sim/sim.js` | `acquireLock`, `addAnchoredWaypoint`, `sim`, `warpBlock`, `warpDestination`, `warpNodeById` | [js/sim/sim.js](../sim/sim.js.md) |
| 2 | `../station/stations.js` | `stations` | [js/station/stations.js](../station/stations.js.md) |
| 3 | `../economy/upgrades.js` | `UPGRADES`, `hasUpgrade` | [js/economy/upgrades.js](../economy/upgrades.js.md) |
| 4 | `../mission/script.js` | `missionCore`, `oneStep` | [js/mission/script.js](../mission/script.js.md) |
| 5 | `../mission/run.js` | `startMission` | [js/mission/run.js](../mission/run.js.md) |

## Imported by

- [js/ui/tutorial.js](tutorial.js.md) — `CORE_STEPS`, `resetCoreTrack`

## Exports

- [`core`](#s-core) · const — **no importer in scanned roots**
- [`coreYard`](#s-coreYard) · function — **no importer in scanned roots**
- [`CORE_STEPS`](#s-CORE_STEPS) · const — used by [js/ui/tutorial.js](tutorial.js.md)
- [`coreTrackSteps`](#s-coreTrackSteps) · function — **no importer in scanned roots**
- [`resetCoreTrack`](#s-resetCoreTrack) · function — used by [js/ui/tutorial.js](tutorial.js.md)

## Effects

_none detected_

## Symbols

### <a id="s-core"></a>`core`

const · **exported** · L7–7

<!-- note:core -->
the yard this run is aiming at, pinned on the first look
<!-- /note -->

### <a id="s-CORE_ID"></a>`CORE_ID`

const · L9–9

<!-- note:CORE_ID -->
<!-- /note -->

### <a id="s-spec"></a>`spec()`

function · L10–10

- via [js/economy/upgrades.js](../economy/upgrades.js.md): `UPGRADES.find`
- called by: [`CORE_STEPS.text`](#s-CORE_STEPS-text) · [`CORE_STEPS.text~2`](#s-CORE_STEPS-text-2) · [`CORE_STEPS.text~6`](#s-CORE_STEPS-text-6) · [`coreYard`](#s-coreYard)

<!-- note:spec -->
<!-- /note -->

### <a id="s-fmt"></a>`fmt(d)`

function · L12–12

- called by: [`CORE_STEPS.text~2`](#s-CORE_STEPS-text-2) · [`CORE_STEPS.text~3`](#s-CORE_STEPS-text-3) · [`CORE_STEPS.text~4`](#s-CORE_STEPS-text-4) ×2 · [`CORE_STEPS.text~5`](#s-CORE_STEPS-text-5)

<!-- note:fmt -->
<!-- /note -->

### <a id="s-cr"></a>`cr(v)`

function · L13–13

- called by: [`CORE_STEPS.text`](#s-CORE_STEPS-text) · [`CORE_STEPS.text~2`](#s-CORE_STEPS-text-2) ×2 · [`CORE_STEPS.text~6`](#s-CORE_STEPS-text-6)

<!-- note:cr -->
<!-- /note -->

### <a id="s-rangeOf"></a>`rangeOf(st)`

function · L14–14

- called by: [`withDist`](#s-withDist)

<!-- note:rangeOf -->
<!-- /note -->

### <a id="s-coreYard"></a>`coreYard(pos=)`

function · **exported** · L16–30

- calls: [`dist`](#s-dist) · [`spec`](#s-spec) · [`withDist`](#s-withDist) ×2
- via [js/station/stations.js](../station/stations.js.md): `stations.find`
- called by: [`CORE_STEPS.action`](#s-CORE_STEPS-action) · [`CORE_STEPS.action~2`](#s-CORE_STEPS-action-2) · [`CORE_STEPS.action~3`](#s-CORE_STEPS-action-3) · [`CORE_STEPS.alt`](#s-CORE_STEPS-alt) · [`CORE_STEPS.done~3`](#s-CORE_STEPS-done-3) · [`CORE_STEPS.done~4`](#s-CORE_STEPS-done-4) · [`CORE_STEPS.text~2`](#s-CORE_STEPS-text-2) · [`CORE_STEPS.text~3`](#s-CORE_STEPS-text-3) · [`CORE_STEPS.text~4`](#s-CORE_STEPS-text-4) · [`CORE_STEPS.text~5`](#s-CORE_STEPS-text-5)

<!-- note:coreYard -->
Nearest port whose sector fits a Mission core. Pinned once chosen.
<!-- /note -->

### <a id="s-dist"></a>`dist(st, pos)`

function · L32–35

- called by: [`coreYard`](#s-coreYard) · [`withDist`](#s-withDist)

<!-- note:dist -->
<!-- /note -->

### <a id="s-withDist"></a>`withDist(st, pos)`

function · L36–38

- calls: [`dist`](#s-dist) · [`rangeOf`](#s-rangeOf)
- called by: [`coreYard`](#s-coreYard) ×2

<!-- note:withDist -->
<!-- /note -->

### <a id="s-autoDock"></a>`autoDock(y)`

function · L40–44

- calls: [`startMission`](../mission/run.js.md#s-startMission) _js/mission/run.js_ · [`oneStep`](../mission/script.js.md#s-oneStep) _js/mission/script.js_ · [`acquireLock`](../sim/sim.js.md#s-acquireLock) _js/sim/sim.js_
- called by: [`CORE_STEPS.action~2.run`](#s-CORE_STEPS-action-2-run) · [`CORE_STEPS.action~3.run`](#s-CORE_STEPS-action-3-run) · [`CORE_STEPS.alt.run`](#s-CORE_STEPS-alt-run)

<!-- note:autoDock -->
Hand the whole trip to the autopilot. A one-step DOCK is `builtin`, so it
 flies without the very core this track is going to buy.
<!-- /note -->

### <a id="s-warpWhy"></a>`warpWhy(id)`

function · L46–46

- calls: [`warpBlock`](../sim/sim.js.md#s-warpBlock) _js/sim/sim.js_ · [`warpNodeById`](../sim/sim.js.md#s-warpNodeById) _js/sim/sim.js_
- called by: [`CORE_STEPS.text~3`](#s-CORE_STEPS-text-3)

<!-- note:warpWhy -->
"Close enough that warp is no longer the tool" is not a number this file gets
to invent — the core already decides it, and says ALREADY THERE when a jump
would land you where you are. Asking warpBlock() means the phase clears on
exactly the condition the WARP button itself is reading, and it hands us the
live reason the button is dark as a bonus.
<!-- /note -->

### <a id="s-_d"></a>`_d`

const · L47–47

<!-- note:_d -->
<!-- /note -->

### <a id="s-warpDone"></a>`warpDone(id)`

function · L48–54

- calls: [`warpDestination`](../sim/sim.js.md#s-warpDestination) _js/sim/sim.js_ · [`warpNodeById`](../sim/sim.js.md#s-warpNodeById) _js/sim/sim.js_
- called by: [`CORE_STEPS.done~3`](#s-CORE_STEPS-done-3)

<!-- note:warpDone -->
The phase clears on the GEOMETRY the core uses for ALREADY THERE, not on the
string — warpBlock reports the first thing wrong, so a ship sitting on the
berth with its mains cold reads MAINS COLD and would never clear a phase that
matched on the words.
<!-- /note -->

### <a id="s-CORE_STEPS"></a>`CORE_STEPS`

const · **exported** · L56–133

<!-- note:CORE_STEPS -->
- L63 · `},` — no NEXT: there IS something to measure here, and a NEXT beside a SET
  COURSE that has just satisfied the step is a tap that skips the warp
  phase entirely.
<!-- /note -->

#### <a id="s-CORE_STEPS-text"></a>`CORE_STEPS.text()`

prop · L60–63

- calls: [`cr`](#s-cr) · [`spec`](#s-spec)

<!-- note:CORE_STEPS.text -->
<!-- /note -->

#### <a id="s-CORE_STEPS-done"></a>`CORE_STEPS.done()`

prop · L64–64

<!-- note:CORE_STEPS.done -->
<!-- /note -->

#### <a id="s-CORE_STEPS-next"></a>`CORE_STEPS.next()`

prop · L65–65

<!-- note:CORE_STEPS.next -->
<!-- /note -->

#### <a id="s-CORE_STEPS-text-2"></a>`CORE_STEPS.text~2(c)`

prop · L70–75

- calls: [`coreYard`](#s-coreYard) · [`cr`](#s-cr) ×2 · [`fmt`](#s-fmt) · [`spec`](#s-spec)

<!-- note:CORE_STEPS.text~2 -->
<!-- /note -->

#### <a id="s-CORE_STEPS-action"></a>`CORE_STEPS.action()`

prop · L76–79

- calls: [`coreYard`](#s-coreYard)

<!-- note:CORE_STEPS.action -->
<!-- /note -->

##### <a id="s-CORE_STEPS-action-run"></a>`CORE_STEPS.action.run()`

prop · L78–78

- calls: [`acquireLock`](../sim/sim.js.md#s-acquireLock) _js/sim/sim.js_ · [`addAnchoredWaypoint`](../sim/sim.js.md#s-addAnchoredWaypoint) _js/sim/sim.js_

<!-- note:CORE_STEPS.action.run -->
<!-- /note -->

#### <a id="s-CORE_STEPS-alt"></a>`CORE_STEPS.alt()`

prop · L80–83

- calls: [`coreYard`](#s-coreYard)

<!-- note:CORE_STEPS.alt -->
<!-- /note -->

##### <a id="s-CORE_STEPS-alt-run"></a>`CORE_STEPS.alt.run()`

prop · L82–82

- calls: [`autoDock`](#s-autoDock)

<!-- note:CORE_STEPS.alt.run -->
<!-- /note -->

#### <a id="s-CORE_STEPS-done-2"></a>`CORE_STEPS.done~2()`

prop · L84–84

<!-- note:CORE_STEPS.done~2 -->
<!-- /note -->

#### <a id="s-CORE_STEPS-text-3"></a>`CORE_STEPS.text~3()`

prop · L89–96

- calls: [`coreYard`](#s-coreYard) · [`fmt`](#s-fmt) · [`warpWhy`](#s-warpWhy)

<!-- note:CORE_STEPS.text~3 -->
- L95 · `` return `${head} The core will not engage yet: ${why}. Wells and blocked lanes both clear b `` — the button is dark; say why, in the core's own words
<!-- /note -->

#### <a id="s-CORE_STEPS-hilite"></a>`CORE_STEPS.hilite()`

prop · L97–97

<!-- note:CORE_STEPS.hilite -->
<!-- /note -->

#### <a id="s-CORE_STEPS-action-2"></a>`CORE_STEPS.action~2()`

prop · L98–98

- calls: [`coreYard`](#s-coreYard)

<!-- note:CORE_STEPS.action~2 -->
<!-- /note -->

##### <a id="s-CORE_STEPS-action-2-run"></a>`CORE_STEPS.action~2.run()`

prop · L98–98

- calls: [`autoDock`](#s-autoDock)

<!-- note:CORE_STEPS.action~2.run -->
<!-- /note -->

#### <a id="s-CORE_STEPS-done-3"></a>`CORE_STEPS.done~3()`

prop · L99–99

- calls: [`coreYard`](#s-coreYard) · [`warpDone`](#s-warpDone)

<!-- note:CORE_STEPS.done~3 -->
<!-- /note -->

#### <a id="s-CORE_STEPS-text-4"></a>`CORE_STEPS.text~4()`

prop · L104–108

- calls: [`coreYard`](#s-coreYard) · [`fmt`](#s-fmt) ×2

<!-- note:CORE_STEPS.text~4 -->
<!-- /note -->

#### <a id="s-CORE_STEPS-hilite-2"></a>`CORE_STEPS.hilite~2()`

prop · L109–109

<!-- note:CORE_STEPS.hilite~2 -->
<!-- /note -->

#### <a id="s-CORE_STEPS-action-3"></a>`CORE_STEPS.action~3()`

prop · L110–110

- calls: [`coreYard`](#s-coreYard)

<!-- note:CORE_STEPS.action~3 -->
<!-- /note -->

##### <a id="s-CORE_STEPS-action-3-run"></a>`CORE_STEPS.action~3.run()`

prop · L110–110

- calls: [`autoDock`](#s-autoDock)

<!-- note:CORE_STEPS.action~3.run -->
<!-- /note -->

#### <a id="s-CORE_STEPS-done-4"></a>`CORE_STEPS.done~4()`

prop · L111–111

- calls: [`coreYard`](#s-coreYard)

<!-- note:CORE_STEPS.done~4 -->
<!-- /note -->

#### <a id="s-CORE_STEPS-text-5"></a>`CORE_STEPS.text~5()`

prop · L116–119

- calls: [`coreYard`](#s-coreYard) · [`fmt`](#s-fmt)

<!-- note:CORE_STEPS.text~5 -->
<!-- /note -->

#### <a id="s-CORE_STEPS-hilite-3"></a>`CORE_STEPS.hilite~3()`

prop · L120–120

<!-- note:CORE_STEPS.hilite~3 -->
<!-- /note -->

#### <a id="s-CORE_STEPS-done-5"></a>`CORE_STEPS.done~5()`

prop · L121–121

- calls: [`hasFit`](#s-hasFit)

<!-- note:CORE_STEPS.done~5 -->
<!-- /note -->

#### <a id="s-CORE_STEPS-text-6"></a>`CORE_STEPS.text~6()`

prop · L126–129

- calls: [`cr`](#s-cr) · [`spec`](#s-spec)

<!-- note:CORE_STEPS.text~6 -->
<!-- /note -->

#### <a id="s-CORE_STEPS-hilite-4"></a>`CORE_STEPS.hilite~4()`

prop · L130–130

<!-- note:CORE_STEPS.hilite~4 -->
<!-- /note -->

#### <a id="s-CORE_STEPS-done-6"></a>`CORE_STEPS.done~6()`

prop · L131–131

- calls: [`hasFit`](#s-hasFit)

<!-- note:CORE_STEPS.done~6 -->
<!-- /note -->

### <a id="s-hasFit"></a>`hasFit()`

function · L135–137

- calls: [`hasUpgrade`](../economy/upgrades.js.md#s-hasUpgrade) _js/economy/upgrades.js_ · [`missionCore`](../mission/script.js.md#s-missionCore) _js/mission/script.js_
- called by: [`CORE_STEPS.done~5`](#s-CORE_STEPS-done-5) · [`CORE_STEPS.done~6`](#s-CORE_STEPS-done-6)

<!-- note:hasFit -->
<!-- /note -->

### <a id="s-coreTrackSteps"></a>`coreTrackSteps()`

function · **exported** · L139–141

<!-- note:coreTrackSteps -->
Test/console access.
<!-- /note -->

### <a id="s-resetCoreTrack"></a>`resetCoreTrack()`

function · **exported** · L142–144

- called by: [`startCoreTutorial`](tutorial.js.md#s-startCoreTutorial) _js/ui/tutorial.js_

<!-- note:resetCoreTrack -->
<!-- /note -->
