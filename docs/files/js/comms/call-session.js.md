# js/comms/call-session.js

[index](../../../README.md) · 318 lines · 41 symbols · 0 imports · 4 importers

## About

<!-- note:@file -->
js/comms/call-session.js
LIVING GALAXY — comms call session. No DOM, no timers. Driven entirely by tick(dtMs)
so it obeys the HUD TIME control (1x/8x/40x/pause) like the rest of the sim.

Two flavours share one state machine:
  scripted — an NPC on the other end walks a dialogue tree (o.script)
  live     — another pilot on the relay (o.live): nothing auto-answers,
             lines arrive through receive(), and say() is free text.
<!-- /note -->

## Imports

_none_

## Imported by

- [js/comms/call-ui.js](call-ui.js.md) — `CallState`
- [js/comms/comms.js](comms.js.md) — `CallSession`, `CallState`
- test/comms.test.mjs _(outside js/)_ — `CallSession`, `CallState`, `TranscriptLine`
- test/speech.test.mjs _(outside js/)_ — `CallSession`, `CallState`

## Exports

- [`CallState`](#s-CallState) · const — used by [js/comms/call-ui.js](call-ui.js.md), [js/comms/comms.js](comms.js.md), test/comms.test.mjs, test/speech.test.mjs
- [`Emitter`](#s-Emitter) · class — **no importer in scanned roots**
- [`TranscriptLine`](#s-TranscriptLine) · class — used by test/comms.test.mjs
- [`CallSession`](#s-CallSession) · class — used by [js/comms/comms.js](comms.js.md), test/comms.test.mjs, test/speech.test.mjs
- `default` · Identifier — **no importer in scanned roots**

## Effects

- **bus.emit** — `state on this` (CallSession._set:109) · `ring on this` (CallSession.hail:116) · `closed on this` (CallSession.unreachable:154, CallSession.reject:161, CallSession.end:171, CallSession.tick:288) · `options on this` (CallSession.choose:180, CallSession._flushOptions:267) · `choice on this` (CallSession.choose:182) · `say on this` (CallSession.say:193) · `typing on this` (CallSession._enter:205, CallSession._enter:222) · `node on this` (CallSession._enter:224) · `line on this` (CallSession._push:256) · `update on this` (CallSession.skipReveal:260, CallSession.tick:299) · `reply_timeout on this` (CallSession.tick:306)
- **bus.on** — `‹ev› on this` (Emitter.on:27)

## Symbols

### <a id="s-CallState"></a>`CallState`

const · **exported** · L1–11

<!-- note:CallState -->
<!-- /note -->

### <a id="s-GARBLE"></a>`GARBLE`

const · L13–13

<!-- note:GARBLE -->
<!-- /note -->

### <a id="s-mulberry"></a>`mulberry(seed)`

function · L15–23

- called by: [`CallSession.constructor`](#s-CallSession-constructor) · [`TranscriptLine.static mask`](#s-TranscriptLine-static-mask)

<!-- note:mulberry -->
<!-- /note -->

### <a id="s-Emitter"></a>`Emitter`

class · **exported** · L25–30

<!-- note:Emitter -->
<!-- /note -->

#### <a id="s-Emitter-constructor"></a>`Emitter.constructor()`

method · L26–26

<!-- note:Emitter.constructor -->
<!-- /note -->

#### <a id="s-Emitter-on"></a>`Emitter.on(ev, fn)`

method · L27–27

- effects: bus.on `‹ev›`

<!-- note:Emitter.on -->
<!-- /note -->

#### <a id="s-Emitter-off"></a>`Emitter.off(ev, fn)`

method · L28–28

<!-- note:Emitter.off -->
<!-- /note -->

#### <a id="s-Emitter-emit"></a>`Emitter.emit(ev, payload)`

method · L29–29

<!-- note:Emitter.emit -->
<!-- /note -->

### <a id="s-_lineId"></a>`_lineId`

const · L32–32

<!-- note:_lineId -->
<!-- /note -->

### <a id="s-TranscriptLine"></a>`TranscriptLine`

class · **exported** · L34–65

- called by: [`CallSession._push`](#s-CallSession-_push)

<!-- note:TranscriptLine -->
<!-- /note -->

#### <a id="s-TranscriptLine-constructor"></a>`TranscriptLine.constructor({…})`

method · L35–44

<!-- note:TranscriptLine.constructor -->
- L37 · `this.speaker = speaker;` — 'peer' | 'self' | 'sys'
- L41 · `this.chars = 0;` — characters revealed
<!-- /note -->

#### <a id="s-TranscriptLine-static-mask"></a>`TranscriptLine.static mask(text, quality, seed)`

method · L45–55

- calls: [`mulberry`](#s-mulberry)

<!-- note:TranscriptLine.static mask -->
Deterministic dropout mask: weak signal eats characters, not whole words.
<!-- /note -->

#### <a id="s-TranscriptLine-advance"></a>`TranscriptLine.advance(dtMs)`

method · L56–62

<!-- note:TranscriptLine.advance -->
<!-- /note -->

#### <a id="s-TranscriptLine-finish"></a>`TranscriptLine.finish()`

method · L63–63

<!-- note:TranscriptLine.finish -->
<!-- /note -->

#### <a id="s-TranscriptLine-get-visible"></a>`TranscriptLine.get visible()`

method · L64–64

<!-- note:TranscriptLine.get visible -->
<!-- /note -->

### <a id="s-CallSession"></a>`CallSession`

class · **exported** · L67–316

- called by: [`npcSession`](comms.js.md#s-npcSession) _js/comms/comms.js_ · [`peerSession`](comms.js.md#s-peerSession) _js/comms/comms.js_

<!-- note:CallSession -->
<!-- /note -->

#### <a id="s-CallSession-constructor"></a>`CallSession.constructor(o=)`

method · L68–99

- calls: [`mulberry`](#s-mulberry)

<!-- note:CallSession.constructor -->
@param {object} o
@param {string} o.peerName   display name, e.g. 'ZERZE CONTROL'
@param {string} o.channel    e.g. 'CH 4'
@param {number} o.rangeU     range in game units — drives light-lag
@param {number} o.msPerUnit  light-lag per unit (default 2ms → 213u = 426ms)
@param {number} o.quality    0..1 signal quality → garble + dropout
@param {object} o.script     { start:'id', nodes:{ id:{ text, options?, next?, end? } } }
@param {function} [o.provider] async ({history,node,session}) => {text, options}
@param {boolean}  [o.live]     another human: no auto-answer, free-form lines
@param {string}   [o.talkNode] scripted call that also takes free text: say() enters this node
@param {boolean}  [o.hostile]  paints the ring red
@param {object}   [o.peer]     whatever the caller wants to hang on the session (station, contact…)

- L80 · `this.replyTimeoutMs = o.replyTimeoutMs ?? 0;` — 0 = never nag
- L86 · `this.peerAnswerMs = o.answerMs;` — undefined → 1400 + 2×lag; Infinity → nobody home
- L87 · `this.talkNode = o.talkNode ?? null;` — scripted calls that also take free text route it here (npc/speech.js)
- L95 · `this._queue = [];` — [{at, fn}] scheduled in session-time
<!-- /note -->

#### <a id="s-CallSession-get-lagMs"></a>`CallSession.get lagMs()`

method · L101–101

<!-- note:CallSession.get lagMs -->
<!-- /note -->

#### <a id="s-CallSession-get-isRinging"></a>`CallSession.get isRinging()`

method · L102–102

<!-- note:CallSession.get isRinging -->
<!-- /note -->

#### <a id="s-CallSession-get-isLive"></a>`CallSession.get isLive()`

method · L103–103

<!-- note:CallSession.get isLive -->
<!-- /note -->

#### <a id="s-CallSession-get-active"></a>`CallSession.get active()`

method · L104–104

<!-- note:CallSession.get active -->
<!-- /note -->

#### <a id="s-CallSession-_set"></a>`CallSession._set(state)`

method · L106–110

- effects: bus.emit `state`

<!-- note:CallSession._set -->
<!-- /note -->

#### <a id="s-CallSession-_at"></a>`CallSession._at(delayMs, fn)`

method · L111–111

<!-- note:CallSession._at -->
<!-- /note -->

#### <a id="s-CallSession-hail"></a>`CallSession.hail({…}=)`

method · L113–125

- effects: bus.emit `ring`

<!-- note:CallSession.hail -->
--- lifecycle -----------------------------------------------------------

- L118 · `this._at(this.peerAnswerMs ?? (1400 + this.lagMs * 2), () => {` — peer picks up on its own; light-lag makes long-range hails feel long
<!-- /note -->

#### <a id="s-CallSession-accept"></a>`CallSession.accept()`

method · L127–135

<!-- note:CallSession.accept -->
<!-- /note -->

#### <a id="s-CallSession-connect"></a>`CallSession.connect()`

method · L137–142

<!-- note:CallSession.connect -->
Live calls: the far end picked up (or we did) — carrier is up, no script to walk.
<!-- /note -->

#### <a id="s-CallSession-receive"></a>`CallSession.receive(text, name)`

method · L144–147

<!-- note:CallSession.receive -->
Live calls: a line from the far end. Garbled by signal quality like any peer line.
<!-- /note -->

#### <a id="s-CallSession-unreachable"></a>`CallSession.unreachable()`

method · L149–156

- effects: bus.emit `closed`

<!-- note:CallSession.unreachable -->
Nobody answered, or the far end has no radio at all.
<!-- /note -->

#### <a id="s-CallSession-reject"></a>`CallSession.reject()`

method · L158–163

- effects: bus.emit `closed`

<!-- note:CallSession.reject -->
<!-- /note -->

#### <a id="s-CallSession-end"></a>`CallSession.end(reason=)`

method · L165–173

- effects: bus.emit `closed`

<!-- note:CallSession.end -->
<!-- /note -->

#### <a id="s-CallSession-choose"></a>`CallSession.choose(optionId)`

method · L175–186

- effects: bus.emit `options` · bus.emit `choice`

<!-- note:CallSession.choose -->
--- dialogue ------------------------------------------------------------

- L181 · `this._push('self', this.selfName, opt.text ?? opt.label, 1);` — local echo: clean, instant-ish
<!-- /note -->

#### <a id="s-CallSession-say"></a>`CallSession.say(text)`

method · L188–196

- effects: bus.emit `say`

<!-- note:CallSession.say -->
- L188 · `say(text) {` — free-form player line (keyboard input, or a live call)
<!-- /note -->

#### <a id="s-CallSession-system"></a>`CallSession.system(text)`

method · L198–198

<!-- note:CallSession.system -->
<!-- /note -->

#### <a id="s-CallSession-_enter"></a>`CallSession._enter(nodeId)`

method · async · L200–237

- effects: bus.emit `typing` · bus.emit `node`

<!-- note:CallSession._enter -->
- L218 · `} catch {` — keep scripted fallback — never leave the player stranded
- L224 · `this.emit('node', this._node);` — director runs node.effect (clamps, tolls, standing)
- L232 · `effect: o.effect || null,` — fn(session) run by the director when chosen
- L233 · `tone: o.tone || 'neutral'` — neutral | firm | hostile | friendly
<!-- /note -->

#### <a id="s-CallSession-_withTimeout"></a>`CallSession._withTimeout(p, ms)`

method · L239–245

<!-- note:CallSession._withTimeout -->
<!-- /note -->

#### <a id="s-CallSession-_speakMs"></a>`CallSession._speakMs(text)`

method · L247–247

<!-- note:CallSession._speakMs -->
<!-- /note -->

#### <a id="s-CallSession-_push"></a>`CallSession._push(speaker, name, text, quality)`

method · L249–258

- calls: [`new TranscriptLine`](#s-TranscriptLine)
- effects: bus.emit `line`

<!-- note:CallSession._push -->
<!-- /note -->

#### <a id="s-CallSession-skipReveal"></a>`CallSession.skipReveal()`

method · L260–260

- effects: bus.emit `update`

<!-- note:CallSession.skipReveal -->
<!-- /note -->

#### <a id="s-CallSession-_flushOptions"></a>`CallSession._flushOptions()`

method · L262–269

- effects: bus.emit `options`

<!-- note:CallSession._flushOptions -->
<!-- /note -->

#### <a id="s-CallSession-tick"></a>`CallSession.tick(dtMs)`

method · L271–310

- effects: bus.emit `closed` · bus.emit `update` · bus.emit `reply_timeout`

<!-- note:CallSession.tick -->
--- clock ---------------------------------------------------------------

- L299 · `if (last.done || Math.floor(last.chars) !== shown) this.emit('update');` — only wake the UI when a character actually landed — no DOM churn on a frame that revealed nothing
<!-- /note -->

#### <a id="s-CallSession-get-clock"></a>`CallSession.get clock()`

method · L312–315

<!-- note:CallSession.get clock -->
<!-- /note -->
