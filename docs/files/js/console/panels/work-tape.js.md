# js/console/panels/work-tape.js

[index](../../../../README.md) · 109 lines · 15 symbols · 3 imports · 1 importers

## About

<!-- note:@file -->
LIVING GALAXY — CONSOLE › WORK › TAPE: what the pilot did, and what it paid.

The readout for js/flight/recorder.js. Three things, in the order a pilot wants
them:

  1. What is on the tape right now — how many of the records are the pilot's
     own hands versus ARIA's watch, what kinds of action they are, and how
     long a stretch of flying that covers. The player/ARIA split is the
     number that matters: a tape that is nine-tenths ARIA is ARIA's tape,
     not training data for imitating a human, and the panel says so out loud
     rather than letting a chart imply otherwise.

  2. WHAT WOULD I DO HERE — the nearest states on the tape to the one the
     ship is in this second, and what was done from them. This is the tape
     being useful without a model attached: it is a k-nearest lookup over
     the same feature vector a trained policy would read, so if it returns
     nonsense the features are wrong and no amount of training will fix it.
     Better to find that out from a panel than from a bad ARIA.

  3. EXPORT — the whole thing as JSONL, through a Blob, because the pilot is
     on a phone and there is no server to POST to.

Nothing here writes to the tape except CLEAR. Opening a panel about the
recording must not change the recording, beyond the tap that opened it.

- L83 · `export default {` — ---- the panel --------------------------------------------------------------
<!-- /note -->

## Imports

| line | from | names | target |
|---|---|---|---|
| 1 | `../kit.js` | `el`, `section`, `note`, `row`, `button`, `chips` | [js/console/kit.js](../kit.js.md) |
| 2 | `../../sim/sim.js` | `sim` | [js/sim/sim.js](../../sim/sim.js.md) |
| 3 | `../../flight/recorder.js` | `recorder`, `recorderReport`, `neighbours`, `snapshot`, `downloadTape`, `clearTape`, `saveTape`, `tape` | [js/flight/recorder.js](../../flight/recorder.js.md) |

## Imported by

- [js/console/panels/work.js](work.js.md) — `default`

## Exports

- `default` · ObjectExpression — used by [js/console/panels/work.js](work.js.md)

## Effects

_none detected_

## Symbols

### <a id="s-DOC"></a>`DOC`

const · L5–5

<!-- note:DOC -->
<!-- /note -->

### <a id="s-tell"></a>`tell(msg)`

function · L8–8

- called by: [`exportSection`](#s-exportSection) ×4

<!-- note:tell -->
<!-- /note -->

### <a id="s-pct"></a>`pct(v)`

function · L9–9

- called by: [`neighbourSection`](#s-neighbourSection) ×2

<!-- note:pct -->
<!-- /note -->

### <a id="s-secs"></a>`secs(n)`

function · L10–10

- called by: [`statusSection`](#s-statusSection)

<!-- note:secs -->
<!-- /note -->

### <a id="s-statusSection"></a>`statusSection(render)`

function · L12–35

- calls: [`chips`](../kit.js.md#s-chips) _js/console/kit.js_ · [`note`](../kit.js.md#s-note) _js/console/kit.js_ ×3 · [`row`](../kit.js.md#s-row) _js/console/kit.js_ ×4 · [`section`](../kit.js.md#s-section) _js/console/kit.js_ · [`secs`](#s-secs) · [`recorderReport`](../../flight/recorder.js.md#s-recorderReport) _js/flight/recorder.js_
- called by: [`mount>render`](#s-mount-render)

<!-- note:statusSection -->
---- 1. the tape ----------------------------------------------------------
<!-- /note -->

#### <a id="s-statusSection-onPick"></a>`statusSection.onPick(id)`

prop · L32–32

- calls: [`mount>render`](#s-mount-render)

<!-- note:statusSection.onPick -->
<!-- /note -->

### <a id="s-neighbourSection"></a>`neighbourSection()`

function · L37–60

- calls: [`note`](../kit.js.md#s-note) _js/console/kit.js_ ×3 · [`row`](../kit.js.md#s-row) _js/console/kit.js_ · [`section`](../kit.js.md#s-section) _js/console/kit.js_ · [`pct`](#s-pct) ×2 · [`neighbours`](../../flight/recorder.js.md#s-neighbours) _js/flight/recorder.js_ · [`snapshot`](../../flight/recorder.js.md#s-snapshot) _js/flight/recorder.js_
- called by: [`mount>render`](#s-mount-render)

<!-- note:neighbourSection -->
---- 2. what would I do here ----------------------------------------------

- L47 · `const votes = new Map();` — Group the near neighbours by what was actually done, so the answer is
  "you cut, mostly" rather than eight rows the pilot has to read.
<!-- /note -->

### <a id="s-exportSection"></a>`exportSection(render)`

function · L62–81

- calls: [`button`](../kit.js.md#s-button) _js/console/kit.js_ ×3 · [`note`](../kit.js.md#s-note) _js/console/kit.js_ · [`row`](../kit.js.md#s-row) _js/console/kit.js_ ×3 · [`section`](../kit.js.md#s-section) _js/console/kit.js_ · [`mount>render`](#s-mount-render) · [`tell`](#s-tell) ×4 · [`clearTape`](../../flight/recorder.js.md#s-clearTape) _js/flight/recorder.js_ · [`downloadTape`](../../flight/recorder.js.md#s-downloadTape) _js/flight/recorder.js_ · [`recorderReport`](../../flight/recorder.js.md#s-recorderReport) _js/flight/recorder.js_ ×2 · [`saveTape`](../../flight/recorder.js.md#s-saveTape) _js/flight/recorder.js_
- via [js/flight/recorder.js](../../flight/recorder.js.md): `saveTape.toLocaleString`
- called by: [`mount>render`](#s-mount-render)

<!-- note:exportSection -->
---- 3. off the phone ------------------------------------------------------
<!-- /note -->

### <a id="s-mount"></a>`mount(root, ctx)`

prop · L88–100

- calls: [`el`](../kit.js.md#s-el) _js/console/kit.js_ · [`mount>render`](#s-mount-render) ×2 · [`mount>signature`](#s-mount-signature)

<!-- note:mount -->
<!-- /note -->

#### <a id="s-mount-signature"></a>`mount>signature()`

function · L92–92

- called by: [`mount`](#s-mount) · [`mount>render`](#s-mount-render)

<!-- note:mount>signature -->
Repaint when the tape actually moved, not every frame: this panel reads
the whole ring to build its report and the console paints at frame rate.
<!-- /note -->

#### <a id="s-mount-render"></a>`mount>render()`

function · L93–96

- calls: [`exportSection`](#s-exportSection) · [`mount>signature`](#s-mount-signature) · [`neighbourSection`](#s-neighbourSection) · [`statusSection`](#s-statusSection)
- called by: [`exportSection`](#s-exportSection) · [`mount`](#s-mount) ×2 · [`statusSection.onPick`](#s-statusSection-onPick)

<!-- note:mount>render -->
<!-- /note -->

### <a id="s-paint"></a>`paint()`

prop · L101–101

<!-- note:paint -->
<!-- /note -->

### <a id="s-unmount"></a>`unmount()`

prop · L102–102

<!-- note:unmount -->
<!-- /note -->

### <a id="s-search"></a>`search()`

prop · L103–108

- calls: [`tape`](../../flight/recorder.js.md#s-tape) _js/flight/recorder.js_

<!-- note:search -->
<!-- /note -->

#### <a id="s-search-run"></a>`search.run()`

prop · L105–105

- calls: [`downloadTape`](../../flight/recorder.js.md#s-downloadTape) _js/flight/recorder.js_

<!-- note:search.run -->
<!-- /note -->
