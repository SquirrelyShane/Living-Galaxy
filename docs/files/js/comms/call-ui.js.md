# js/comms/call-ui.js

[index](../../../README.md) · 259 lines · 22 symbols · 1 imports · 1 importers

## About

<!-- note:@file -->
js/comms/call-ui.js — LIVING GALAXY comms overlay (vanilla, no deps)
Usage:
  import { CallUI } from './comms/call-ui.js';
  const ui = new CallUI({ mount: document.getElementById('hud') });
  ui.attach(session);                 // session = CallSession
  // in your frame loop:  ui.tick(dtMs * timeScale);
The director (comms.js) owns sessions; this only paints one at a time plus
the open-channel ticker for traffic you are overhearing.
<!-- /note -->

## Imports

| line | from | names | target |
|---|---|---|---|
| 1 | `./call-session.js` | `CallState` | [js/comms/call-session.js](call-session.js.md) |

## Imported by

- [js/comms/comms.js](comms.js.md) — `CallUI`

## Exports

- [`CallUI`](#s-CallUI) · class — used by [js/comms/comms.js](comms.js.md)
- `default` · Identifier — **no importer in scanned roots**

## Effects

- **bus.on** — `‹ev› on session` (CallUI.attach>on:106)
- **dom.create** — `‹tag›` (el:10) · `i` (CallUI.constructor:47) · `input` (CallUI.constructor:61)
- **dom.query** — `.cx-yes` (CallUI.constructor:38, CallUI._onPuck:134) · `.cx-no` (CallUI.constructor:39)
- **event.listen** — `click on puck → (inline)` (CallUI.constructor:32) · `click on answer.querySelector() → (inline)` (CallUI.constructor:38, CallUI.constructor:39) · `click on minBtn → (inline)` (CallUI.constructor:51) · `click on endBtn → (inline)` (CallUI.constructor:52) · `click on log → (inline)` (CallUI.constructor:56) · `submit on say → (inline)` (CallUI.constructor:66) · `click on chip → (inline)` (CallUI._paintOptions:222)

## Symbols

### <a id="s-SVG"></a>`SVG`

const · L3–7

<!-- note:SVG -->
<!-- /note -->

### <a id="s-el"></a>`el(tag, cls, html)`

function · L9–14

- called by: [`CallUI._addRow`](#s-CallUI-_addRow) ×3 · [`CallUI._paintOptions`](#s-CallUI-_paintOptions) · [`CallUI.constructor`](#s-CallUI-constructor) ×18
- effects: dom.create `‹tag›`

<!-- note:el -->
<!-- /note -->

### <a id="s-CallUI"></a>`CallUI`

class · **exported** · L16–257

- called by: [`mountComms`](comms.js.md#s-mountComms) _js/comms/comms.js_

<!-- note:CallUI -->
<!-- /note -->

#### <a id="s-CallUI-constructor"></a>`CallUI.constructor({…}=)`

method · L17–84

- calls: [`el`](#s-el) ×18
- effects: event.listen `click` · dom.query `.cx-yes` · dom.query `.cx-no` · dom.create `i` · dom.create `input` · event.listen `submit`

<!-- note:CallUI.constructor -->
- L27 · `const puck = el('button', 'cx-puck',` — puck
- L34 · `const answer = el('div', 'cx-answer',` — accept / reject
- L41 · `const panel = el('div', 'cx-panel');` — panel
- L59 · `const say = el('form', 'cx-say');` — free-form line — live calls to another pilot, or a keyboard hook on NPC calls
- L71 · `const chatter = el('div', 'cx-chatter');` — open-channel ticker: traffic between other stations and ships, overheard
<!-- /note -->

#### <a id="s-CallUI-showChatter"></a>`CallUI.showChatter(tag, text, holdMs=, tone=)`

method · L86–93

<!-- note:CallUI.showChatter -->
Paint one overheard line. Fades on its own after `holdMs` of ticked time.
<!-- /note -->

#### <a id="s-CallUI-hideChatter"></a>`CallUI.hideChatter()`

method · L95–95

<!-- note:CallUI.hideChatter -->
<!-- /note -->

#### <a id="s-CallUI-attach"></a>`CallUI.attach(session)`

method · L97–117

- calls: [`CallUI.attach>on`](#s-CallUI-attach-on) ×6

<!-- note:CallUI.attach -->
--- binding -------------------------------------------------------------
<!-- /note -->

##### <a id="s-CallUI-attach-on"></a>`CallUI.attach>on(ev, fn)`

function · L106–106

- called by: [`CallUI.attach`](#s-CallUI-attach) ×6
- effects: bus.on `‹ev›`

<!-- note:CallUI.attach>on -->
<!-- /note -->

#### <a id="s-CallUI-detach"></a>`CallUI.detach()`

method · L119–127

<!-- note:CallUI.detach -->
<!-- /note -->

#### <a id="s-CallUI-_onPuck"></a>`CallUI._onPuck()`

method · L129–139

- effects: dom.query `.cx-yes`

<!-- note:CallUI._onPuck -->
--- actions -------------------------------------------------------------

- L134 · `this.answer.querySelector('.cx-yes').hidden = outgoing;` — outgoing → cancel only
<!-- /note -->

#### <a id="s-CallUI-accept"></a>`CallUI.accept()`

method · L140–140

<!-- note:CallUI.accept -->
<!-- /note -->

#### <a id="s-CallUI-reject"></a>`CallUI.reject()`

method · L141–141

<!-- note:CallUI.reject -->
<!-- /note -->

#### <a id="s-CallUI-toggleMinimized"></a>`CallUI.toggleMinimized()`

method · L142–146

<!-- note:CallUI.toggleMinimized -->
<!-- /note -->

#### <a id="s-CallUI-_sync"></a>`CallUI._sync()`

method · L148–172

<!-- note:CallUI._sync -->
--- render --------------------------------------------------------------
<!-- /note -->

#### <a id="s-CallUI-_meta"></a>`CallUI._meta()`

method · L174–180

<!-- note:CallUI._meta -->
<!-- /note -->

#### <a id="s-CallUI-_addRow"></a>`CallUI._addRow(line)`

method · L182–200

- calls: [`el`](#s-el) ×3

<!-- note:CallUI._addRow -->
- L183 · `const s = this.session;` — the session only ever reveals its last line: a line still typing out when the next one
  lands would freeze half-written, so finish it and paint it whole first
<!-- /note -->

#### <a id="s-CallUI-_paintLast"></a>`CallUI._paintLast()`

method · L202–213

<!-- note:CallUI._paintLast -->
- L212 · `if (line.done) this._scroll();` — reading scrollHeight forces layout: only pin the log once the line has landed whole
<!-- /note -->

#### <a id="s-CallUI-_paintOptions"></a>`CallUI._paintOptions(options)`

method · L215–225

- calls: [`el`](#s-el)
- effects: event.listen `click`

<!-- note:CallUI._paintOptions -->
<!-- /note -->

#### <a id="s-CallUI-_scroll"></a>`CallUI._scroll()`

method · L227–227

<!-- note:CallUI._scroll -->
<!-- /note -->

#### <a id="s-CallUI-tick"></a>`CallUI.tick(dtMs)`

method · L229–242

<!-- note:CallUI.tick -->
--- clock ---------------------------------------------------------------

Call once per frame with scaled dt (ms). Drives the session and the waveform.

- L238 · `this._metaMs = (this._metaMs || 0) + dtMs;` — the meta line moves at the pace of a clock, not a frame: ~4 Hz is plenty
<!-- /note -->

#### <a id="s-CallUI-_wave"></a>`CallUI._wave(dtMs)`

method · L244–254

<!-- note:CallUI._wave -->
<!-- /note -->

#### <a id="s-CallUI-destroy"></a>`CallUI.destroy()`

method · L256–256

<!-- note:CallUI.destroy -->
<!-- /note -->
