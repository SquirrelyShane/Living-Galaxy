# js/flight/recorder.js

[index](../../../README.md) · 236 lines · 29 symbols · 0 imports · 4 importers

## About

<!-- note:@file -->
LIVING GALAXY — the tape: what the pilot actually did, and what it got them.

ARIA learns from counts today (js/aria/aria.js): you sold at Kessler nine times,
so it leans Kessler. That is honest and it is cheap, but it is a tally of
CHOICES with no record of the SITUATION the choice was made in, so it can
never answer the question a pilot actually wants answered — "what would he
have done HERE?" A count says you mine 60% of the time. It cannot say that
you mine when the hold is empty and the hull is fine, and that when the hull
is under half you break off and go home, which is the thing that separates
flying like the pilot from flying like the average of the pilot.

So this is a tape of (state, action, outcome) triples — the shape every
behaviour-cloning or offline-RL setup wants:

  state    a compact numeric read of the ship and the world at the instant
           the action was taken. Fixed key order, all plain numbers, so a
           row is a feature vector without further work.
  action   what was done: a tap with the control's identity, or a semantic
           order (throttle, cutter, guns, a mission started, a berth taken).
  outcome  what changed over the next while — credits, hull, hold — settled
           onto the record after the fact, so a row carries its own reward
           signal rather than needing the next row to be diffed against it.

Three decisions worth keeping straight:

  IT IS A LEAF. No game imports at all. The sampler is handed in at wire
  time (`wireRecorder`), which is what lets a node test drive the whole
  thing with a fake world and no browser, and means this file can never be
  half of an import cycle.

  IT LABELS WHO ACTED. Every record carries `by`: "player", "aria" or
  "auto". aria.js is emphatic about this and it is right — a core trained on
  its own autopilot output converges on its own habits and calls that your
  taste. The tape keeps both, because ARIA's own outcomes are useful training
  data for ARIA; it just must never be mistaken for yours. Filtering is the
  reader's job and `tape({ by: "player" })` is the default.

  TAPS ARE CAPTURED IN ONE PLACE. A single capture-phase pointerdown
  listener resolves whatever actionable element the touch landed on, rather
  than a call added to each of a few hundred handlers. It is passive and it
  never consumes the event.

The tape is a ring: it never grows without bound and it never needs sweeping.

- L3 · `export const TAPE_CAP = 4000;` — records held in memory
- L4 · `const SAVE_CAP = 1200;` — the newest slice that goes to storage
- L5 · `const SETTLE_SECS = 30;` — how long an action's outcome is watched
- L6 · `const SNAP_MIN_GAP = 0.35;` — reuse a state read younger than this
- L21 · `let sampler = null;` — () => raw world read
- L22 · `let whoNow = () => "player";` — () => "player" | "aria" | "auto"
- L23 · `let onRecord = null;` — optional hook (aria.js leans on it)
<!-- /note -->

## Imports

_none_

## Imported by

- [js/aria/pilot.js](../aria/pilot.js.md) — `neighbours`, `snapshot`
- [js/console/panels/work-tape.js](../console/panels/work-tape.js.md) — `recorder`, `recorderReport`, `neighbours`, `snapshot`, `downloadTape`, `clearTape`, `saveTape`, `tape`
- [js/sim/sim.js](../sim/sim.js.md) — `record`
- [js/ui/hud.js](../ui/hud.js.md) — `wireRecorder`, `settle`, `record`, `recorder`

## Exports

- [`RECORDER_KEY`](#s-RECORDER_KEY) · const — **no importer in scanned roots**
- [`TAPE_CAP`](#s-TAPE_CAP) · const — **no importer in scanned roots**
- [`recorder`](#s-recorder) · const — used by [js/console/panels/work-tape.js](../console/panels/work-tape.js.md), [js/ui/hud.js](../ui/hud.js.md)
- [`STATE_KEYS`](#s-STATE_KEYS) · const — **no importer in scanned roots**
- [`snapshot`](#s-snapshot) · function — used by [js/aria/pilot.js](../aria/pilot.js.md), [js/console/panels/work-tape.js](../console/panels/work-tape.js.md)
- [`record`](#s-record) · function — used by [js/sim/sim.js](../sim/sim.js.md), [js/ui/hud.js](../ui/hud.js.md)
- [`settle`](#s-settle) · function — used by [js/ui/hud.js](../ui/hud.js.md)
- [`flushPending`](#s-flushPending) · function — **no importer in scanned roots**
- [`tape`](#s-tape) · function — used by [js/console/panels/work-tape.js](../console/panels/work-tape.js.md)
- [`tapeJSONL`](#s-tapeJSONL) · function — **no importer in scanned roots**
- [`recorderReport`](#s-recorderReport) · function — used by [js/console/panels/work-tape.js](../console/panels/work-tape.js.md)
- [`neighbours`](#s-neighbours) · function — used by [js/aria/pilot.js](../aria/pilot.js.md), [js/console/panels/work-tape.js](../console/panels/work-tape.js.md)
- [`saveTape`](#s-saveTape) · function — used by [js/console/panels/work-tape.js](../console/panels/work-tape.js.md)
- [`loadTape`](#s-loadTape) · function — **no importer in scanned roots**
- [`clearTape`](#s-clearTape) · function — used by [js/console/panels/work-tape.js](../console/panels/work-tape.js.md)
- [`downloadTape`](#s-downloadTape) · function — used by [js/console/panels/work-tape.js](../console/panels/work-tape.js.md)
- [`describeTarget`](#s-describeTarget) · function — **no importer in scanned roots**
- [`wireRecorder`](#s-wireRecorder) · function — used by [js/ui/hud.js](../ui/hud.js.md)
- [`resetRecorder`](#s-resetRecorder) · function — **no importer in scanned roots**
- `default` · Identifier — **no importer in scanned roots**

## Effects

- **dom.create** — `a` (downloadTape:179)
- **dom.query** — `[data-panel]` (describeTarget:196) · `#map` (describeTarget:197) · `#console` (describeTarget:197) · `#station-deck` (describeTarget:197) · `#hud` (describeTarget:197)
- **event.listen** — `pointerdown on DOC → onPointerDown` (wireRecorder:222) · `visibilitychange on DOC → (inline)` (wireRecorder:223)
- **storage.get** — `‹RECORDER_KEY›` (loadTape:155)
- **storage.remove** — `‹RECORDER_KEY›` (clearTape:170)
- **storage.set** — `‹RECORDER_KEY›` (saveTape:148)
- **timer** — `setTimeout` (downloadTape:185)

## Symbols

### <a id="s-RECORDER_KEY"></a>`RECORDER_KEY`

const · **exported** · L1–1

<!-- note:RECORDER_KEY -->
Learned key — about the human at the controls, not the character. Filed in js/core/profile.js.
<!-- /note -->

### <a id="s-TAPE_CAP"></a>`TAPE_CAP`

const · **exported** · L3–3

<!-- note:TAPE_CAP -->
<!-- /note -->

### <a id="s-SAVE_CAP"></a>`SAVE_CAP`

const · L4–4

<!-- note:SAVE_CAP -->
<!-- /note -->

### <a id="s-SETTLE_SECS"></a>`SETTLE_SECS`

const · L5–5

<!-- note:SETTLE_SECS -->
<!-- /note -->

### <a id="s-SNAP_MIN_GAP"></a>`SNAP_MIN_GAP`

const · L6–6

<!-- note:SNAP_MIN_GAP -->
<!-- /note -->

### <a id="s-recorder"></a>`recorder`

const · **exported** · L8–19

<!-- note:recorder -->
- L10 · `tape: [],` — the ring, oldest first
- L12 · `dropped: 0,` — rolled off the end
- L13 · `pending: [],` — records still collecting their outcome
- L17 · `resets: 0,` — times the clock went backwards under us (a sky launch)
- L18 · `session: null,` — a new id every load, so runs can be told apart
<!-- /note -->

### <a id="s-sampler"></a>`sampler`

const · L21–21

- called by: [`snapshot`](#s-snapshot)

<!-- note:sampler -->
<!-- /note -->

### <a id="s-whoNow"></a>`whoNow()`

function · L22–22

- called by: [`record`](#s-record)

<!-- note:whoNow -->
<!-- /note -->

### <a id="s-onRecord"></a>`onRecord`

const · L23–23

- called by: [`record`](#s-record)

<!-- note:onRecord -->
<!-- /note -->

### <a id="s-STATE_KEYS"></a>`STATE_KEYS`

const · **exported** · L25–25

<!-- note:STATE_KEYS -->
---- the state read -------------------------------------------------------

The feature vector. Fixed keys, fixed order, numbers only (booleans as 0/1,
the few modes as small integers) — a row of this is something you can hand
to a model without a schema negotiation. Short names because there are
thousands of these and they go to localStorage.

  t    sim time            hull  0..1 of max        hold 0..1 of capacity
  cr   credits             spd   u/s                chg  battery 0..1
  dk   docked (0/1)        ap    autopilot (0/1)    ms   mission step index
  hz   hostiles inside 6km tm    turret mode 0..3   mm   cutter mode 0..2
  ph   phase               seam  km to the nearest seam (-1 none)
  port km to the nearest port (-1 none)             bus  demand / reactor
<!-- /note -->

### <a id="s-num"></a>`num(v, d=)`

function · L27–27

- called by: [`flushPending`](#s-flushPending) ×4 · [`settle`](#s-settle) ×4 · [`snapshot`](#s-snapshot) ×2

<!-- note:num -->
<!-- /note -->

### <a id="s-dropPending"></a>`dropPending()`

function · L29–32

- called by: [`snapshot`](#s-snapshot)

<!-- note:dropPending -->
Records still open when the clock resets. Their window was measured against a
time that no longer exists, so they can neither be settled honestly nor left
to settle against the new clock — a record whose `until` is 30 s into a sky
that has been thrown away would close on the first tick of the next one and
report that half a minute produced nothing. They are marked and dropped, and
a reader can throw them out: `d.reset` is the flag for "this one's outcome
was never observed", which is a different thing from "its outcome was zero".
<!-- /note -->

### <a id="s-snapshot"></a>`snapshot(force=)`

function · **exported** · L34–47

- calls: [`dropPending`](#s-dropPending) · [`num`](#s-num) ×2 · [`sampler`](#s-sampler)
- called by: [`fabLeaning`](../aria/pilot.js.md#s-fabLeaning) _js/aria/pilot.js_ · [`neighbourSection`](../console/panels/work-tape.js.md#s-neighbourSection) _js/console/panels/work-tape.js_ · [`flushPending`](#s-flushPending) · [`neighbours`](#s-neighbours) · [`record`](#s-record) · [`settle`](#s-settle)

<!-- note:snapshot -->
Read the world, or reuse the last read if it is fresh enough to be the same
instant.

The clock can go BACKWARDS. `sim.time` is per-sky and starts again at zero
when a sky is launched or the pilot goes back to the menu, so after a launch
the new time is BELOW the last one seen. Written as `t - lastSnapAt < gap`
that test is true for every read until the clock climbs back past where it
was, which for a fresh sky is minutes — and for all of those minutes every
record would be filed carrying one frozen state from the previous sky.
Silently wrong training data is worse than none, so a backwards step is
always a fresh read, and it takes the stale open records with it.
<!-- /note -->

### <a id="s-record"></a>`record(kind, act, arg=, extra=)`

function · **exported** · L49–68

- calls: [`onRecord`](#s-onRecord) · [`snapshot`](#s-snapshot) · [`whoNow`](#s-whoNow)
- called by: [`onPointerDown`](#s-onPointerDown) · [`setMiningMode`](../sim/sim.js.md#s-setMiningMode) _js/sim/sim.js_ · [`setRigMode`](../sim/sim.js.md#s-setRigMode) _js/sim/sim.js_ · [`setThrottle`](../sim/sim.js.md#s-setThrottle) _js/sim/sim.js_ · [`setTurretMode`](../sim/sim.js.md#s-setTurretMode) _js/sim/sim.js_ · [`toggleSystem`](../sim/sim.js.md#s-toggleSystem) _js/sim/sim.js_ · [`mountHud`](../ui/hud.js.md#s-mountHud) _js/ui/hud.js_ ×2

<!-- note:record -->
---- recording ------------------------------------------------------------

File an action.

  kind  the family: "tap" | "order" | "nav" | "trade" | "mission" | "life"
  act   what it was: a control id, an op name, a mode
  arg   whatever names the object of it — a port, an ore, a target

→ the record, or null when the tape is off or unwired.
<!-- /note -->

### <a id="s-settle"></a>`settle()`

function · **exported** · L70–81

- calls: [`num`](#s-num) ×4 · [`snapshot`](#s-snapshot)
- called by: [`mountHud>paintAll`](../ui/hud.js.md#s-mountHud-paintAll) _js/ui/hud.js_

<!-- note:settle -->
Settle outcomes. Called from the sim tick; cheap — it only looks at records
whose window has closed, and the pending list is in time order.

The delta is the honest one: what the numbers did over the following window,
whatever caused it. Attribution is a modelling problem, not a logging one,
and a logger that tries to be clever about it produces data you cannot trust.
<!-- /note -->

### <a id="s-flushPending"></a>`flushPending()`

function · **exported** · L83–90

- calls: [`num`](#s-num) ×4 · [`snapshot`](#s-snapshot)
- called by: [`downloadTape`](#s-downloadTape) · [`wireRecorder`](#s-wireRecorder)

<!-- note:flushPending -->
Close every open record where it stands — on a save, a menu exit, a reload.
<!-- /note -->

### <a id="s-tape"></a>`tape({…}=)`

function · **exported** · L92–98

- called by: [`search`](../console/panels/work-tape.js.md#s-search) _js/console/panels/work-tape.js_ · [`neighbours`](#s-neighbours) · [`recorderReport`](#s-recorderReport) ×2 · [`tapeJSONL`](#s-tapeJSONL)

<!-- note:tape -->
---- reading it back ------------------------------------------------------

The tape, newest last. `by` defaults to the player's own hands.
<!-- /note -->

### <a id="s-tapeJSONL"></a>`tapeJSONL(opts=)`

function · **exported** · L100–103

- calls: [`tape`](#s-tape)
- called by: [`downloadTape`](#s-downloadTape)

<!-- note:tapeJSONL -->
One JSON object per line — what every training pipeline reads without help.
<!-- /note -->

### <a id="s-recorderReport"></a>`recorderReport()`

function · **exported** · L105–126

- calls: [`tape`](#s-tape) ×2
- called by: [`exportSection`](../console/panels/work-tape.js.md#s-exportSection) _js/console/panels/work-tape.js_ ×2 · [`statusSection`](../console/panels/work-tape.js.md#s-statusSection) _js/console/panels/work-tape.js_

<!-- note:recorderReport -->
What the panel says out loud.
<!-- /note -->

### <a id="s-neighbours"></a>`neighbours(now=, n=, {…}=)`

function · **exported** · L128–143

- calls: [`neighbours>near`](#s-neighbours-near) · [`snapshot`](#s-snapshot) · [`tape`](#s-tape)
- called by: [`fabLeaning`](../aria/pilot.js.md#s-fabLeaning) _js/aria/pilot.js_ · [`neighbourSection`](../console/panels/work-tape.js.md#s-neighbourSection) _js/console/panels/work-tape.js_

<!-- note:neighbours -->
What the pilot tends to do, by kind of action, in situations like this one.
A first, honest use of the tape that does not need a model: find the records
whose state is nearest to now and report what was done from there.

Distance is over the handful of features that actually separate decisions,
each scaled to roughly 0..1 so no one of them dominates by unit alone.

- L139 · `return tape({ by, limit: scan })` — Only the newest `scan` records are considered. The ring holds 4,000 and
  this runs on a phone: sorting all of them to show eight rows is work the
  pilot pays for in frames, and the older half of a long tape is the pilot
  they were several refits ago anyway.
<!-- /note -->

#### <a id="s-neighbours-near"></a>`neighbours>near(a, b, k)`

function · L131–138

- called by: [`neighbours`](#s-neighbours)

<!-- note:neighbours>near -->
<!-- /note -->

### <a id="s-saveTape"></a>`saveTape()`

function · **exported** · L145–151

- called by: [`exportSection`](../console/panels/work-tape.js.md#s-exportSection) _js/console/panels/work-tape.js_ · [`wireRecorder`](#s-wireRecorder)
- effects: storage.set `‹RECORDER_KEY›`

<!-- note:saveTape -->
---- storage ---------------------------------------------------------------

- L150 · `} catch { return 0;` — quota or private mode — the tape is best-effort
<!-- /note -->

### <a id="s-loadTape"></a>`loadTape()`

function · **exported** · L153–163

- called by: [`wireRecorder`](#s-wireRecorder)
- effects: storage.get `‹RECORDER_KEY›`

<!-- note:loadTape -->
<!-- /note -->

### <a id="s-clearTape"></a>`clearTape()`

function · **exported** · L165–171

- called by: [`exportSection`](../console/panels/work-tape.js.md#s-exportSection) _js/console/panels/work-tape.js_ · [`resetRecorder`](#s-resetRecorder)
- effects: storage.remove `‹RECORDER_KEY›`

<!-- note:clearTape -->
- L170 · `try { globalThis.localStorage?.removeItem(RECORDER_KEY); } catch {` — fine
<!-- /note -->

### <a id="s-downloadTape"></a>`downloadTape()`

function · **exported** · L173–187

- calls: [`flushPending`](#s-flushPending) · [`tapeJSONL`](#s-tapeJSONL)
- called by: [`exportSection`](../console/panels/work-tape.js.md#s-exportSection) _js/console/panels/work-tape.js_ · [`search.run`](../console/panels/work-tape.js.md#s-search-run) _js/console/panels/work-tape.js_
- effects: dom.create `a` · timer `setTimeout`

<!-- note:downloadTape -->
Hand the pilot the file. Phone-safe: a Blob and an anchor, no server.
<!-- /note -->

### <a id="s-describeTarget"></a>`describeTarget(node)`

function · **exported** · L189–203

- called by: [`onPointerDown`](#s-onPointerDown)
- effects: dom.query `[data-panel]` · dom.query `#map` · dom.query `#console` · dom.query `#station-deck` · dom.query `#hud`

<!-- note:describeTarget -->
---- taps ------------------------------------------------------------------

What did that touch land on? Walk up for the nearest thing a pilot can press
and describe it the way the pilot would recognise it — the control's id when
it has one, else its label. The panel it sits in is worth as much as the
control: "SELL" means something different on the market deck and the refit
yard.
<!-- /note -->

### <a id="s-onPointerDown"></a>`onPointerDown(e)`

function · L205–210

- calls: [`describeTarget`](#s-describeTarget) · [`record`](#s-record)

<!-- note:onPointerDown -->
<!-- /note -->

### <a id="s-wireRecorder"></a>`wireRecorder({…}=)`

function · **exported** · L212–226

- calls: [`flushPending`](#s-flushPending) · [`loadTape`](#s-loadTape) · [`saveTape`](#s-saveTape)
- called by: [`mountHud`](../ui/hud.js.md#s-mountHud) _js/ui/hud.js_
- effects: event.listen `pointerdown` · event.listen `visibilitychange`

<!-- note:wireRecorder -->
---- wiring -----------------------------------------------------------------

`sampler()` returns the raw world read (the STATE_KEYS, unrounded).
`who()` returns who is flying right now.
`hook(record)` is called for every record, if given.

- L223 · `DOC.addEventListener("visibilitychange", () => { if (DOC.visibilityState === "hidden") { f` — A tab that is going away still has a tape worth keeping.
<!-- /note -->

### <a id="s-resetRecorder"></a>`resetRecorder()`

function · **exported** · L228–234

- calls: [`clearTape`](#s-clearTape)

<!-- note:resetRecorder -->
Tests and a fresh run.
<!-- /note -->
