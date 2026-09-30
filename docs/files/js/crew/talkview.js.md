# js/crew/talkview.js

[index](../../../README.md) · 174 lines · 13 symbols · 6 imports · 3 importers

## About

<!-- note:@file -->
LIVING GALAXY — the talk view.

One DOM for talking to a hand, mounted by CONSOLE › CREW › TALK and by the
interior deck (interior.js paintDialogue). Portrait line, trust tier +
morale, greeting, topic buttons (locked ones greyed with the unlock hint),
choice buttons after a line, a free-text line answered by talk.answerFreeText,
and the last six exchanges from memory. Contract: PLAN.md §4.2, §3 CREW › TALK.

Uses the interior's `.in-talk-*` classes (interior.css) so it reads the same
on the deck and in the console; button classes are the caller's.
<!-- /note -->

## Imports

| line | from | names | target |
|---|---|---|---|
| 1 | `./ledger.js` | `crew`, `bondLine` | [js/crew/ledger.js](ledger.js.md) |
| 2 | `./family.js` | `familyOf`, `trustOf` | [js/crew/family.js](family.js.md) |
| 3 | `../npc/cradle.js` | `cradle`, `traitLine` | [js/npc/cradle.js](../npc/cradle.js.md) |
| 4 | `./races.js` | `RACES` | [js/crew/races.js](races.js.md) |
| 5 | `./talk.js` | `topicsFor`, `lockedTopicsFor`, `open`, `choose`, `answerFreeText`, `greet`, `talkLog`, `tierOf`, `TIER_NAMES` | [js/crew/talk.js](talk.js.md) |
| 6 | `./beats.js` | `beatsFor`, `playBeat`, `isRunning`, `advanceBeat` | [js/crew/beats.js](beats.js.md) |

## Imported by

- [js/console/panels/crew.js](../console/panels/crew.js.md) — `mountTalk`
- [js/interior/interior.js](../interior/interior.js.md) — `mountTalk`
- [js/station/deckhall.js](../station/deckhall.js.md) — `mountTalk`

## Exports

- [`mountTalk`](#s-mountTalk) · function — used by [js/console/panels/crew.js](../console/panels/crew.js.md), [js/interior/interior.js](../interior/interior.js.md), [js/station/deckhall.js](../station/deckhall.js.md)
- `default` · Identifier — **no importer in scanned roots**

## Effects

- **dom.create** — `‹tag›` (mk:11)
- **event.listen** — `click on b → fn` (mountTalk>btn:59) · `keydown on input → (inline)` (mountTalk:161)
- **input.key** — `Enter` (mountTalk:161)

## Symbols

### <a id="s-DOC"></a>`DOC`

const · L8–8

<!-- note:DOC -->
<!-- /note -->

### <a id="s-mk"></a>`mk(tag, cls, text)`

function · L10–15

- called by: [`mountTalk`](#s-mountTalk) ×13 · [`mountTalk>btn`](#s-mountTalk-btn) · [`mountTalk>paintLog`](#s-mountTalk-paintLog)
- effects: dom.create `‹tag›`

<!-- note:mk -->
<!-- /note -->

### <a id="s-subLine"></a>`subLine(m)`

function · L17–28

- calls: [`familyOf`](family.js.md#s-familyOf) _js/crew/family.js_ · [`trustOf`](family.js.md#s-trustOf) _js/crew/family.js_ · [`bondLine`](ledger.js.md#s-bondLine) _js/crew/ledger.js_ · [`tierOf`](talk.js.md#s-tierOf) _js/crew/talk.js_ · [`traitLine`](../npc/cradle.js.md#s-traitLine) _js/npc/cradle.js_
- via [js/crew/races.js](races.js.md): `RACES.find`
- via [js/npc/cradle.js](../npc/cradle.js.md): `cradle.get`
- called by: [`mountTalk`](#s-mountTalk) · [`mountTalk>after`](#s-mountTalk-after) · [`mountTalk>refresh`](#s-mountTalk-refresh)

<!-- note:subLine -->
<!-- /note -->

### <a id="s-mountTalk"></a>`mountTalk(host, memberId, {…}=)`

function · **exported** · L30–172

- calls: [`greet`](talk.js.md#s-greet) _js/crew/talk.js_ · [`mk`](#s-mk) ×13 · [`mountTalk>btn`](#s-mountTalk-btn) · [`mountTalk>paintLog`](#s-mountTalk-paintLog) · [`mountTalk>paintOpts`](#s-mountTalk-paintOpts) · [`mountTalk>send`](#s-mountTalk-send) · [`subLine`](#s-subLine)
- via [js/crew/ledger.js](ledger.js.md): `crew.aboard.find`
- called by: [`mountTalkSub>remount`](../console/panels/crew.js.md#s-mountTalkSub-remount) _js/console/panels/crew.js_ · [`paintDialogue`](../interior/interior.js.md#s-paintDialogue) _js/interior/interior.js_ · [`crewSection`](../station/deckhall.js.md#s-crewSection) _js/station/deckhall.js_
- effects: event.listen `keydown` · input.key `Enter`

<!-- note:mountTalk -->
mountTalk(host, memberId, { onChange, extra, btnClass }) → refresher.
`extra` = [{ label, cls?, run() → string? }] appended after the topics (conn,
dismiss, close…); a returned string becomes the spoken line. `onChange()` fires after every exchange so the caller can
repaint whatever else it shows. The refresher re-paints the status line.

- L148 · `const input = mk("input", "tinput");` — free text
<!-- /note -->

#### <a id="s-mountTalk-gone"></a>`mountTalk>gone()`

function · L53–53

- via [js/crew/ledger.js](ledger.js.md): `crew.aboard.includes`
- called by: [`mountTalk>after`](#s-mountTalk-after) · [`mountTalk>paintOpts`](#s-mountTalk-paintOpts) ×2 · [`mountTalk>refresh`](#s-mountTalk-refresh)

<!-- note:mountTalk>gone -->
<!-- /note -->

#### <a id="s-mountTalk-btn"></a>`mountTalk>btn(label, fn, cls=, disabled=, title=)`

function · L54–61

- calls: [`mk`](#s-mk)
- called by: [`mountTalk`](#s-mountTalk) · [`mountTalk>paintOpts`](#s-mountTalk-paintOpts) ×9
- effects: event.listen `click`

<!-- note:mountTalk>btn -->
<!-- /note -->

#### <a id="s-mountTalk-paintLog"></a>`mountTalk>paintLog()`

function · L63–69

- calls: [`talkLog`](talk.js.md#s-talkLog) _js/crew/talk.js_ · [`mk`](#s-mk)
- called by: [`mountTalk`](#s-mountTalk) · [`mountTalk>after`](#s-mountTalk-after)

<!-- note:mountTalk>paintLog -->
<!-- /note -->

#### <a id="s-mountTalk-after"></a>`mountTalk>after()`

function · L71–77

- calls: [`mountTalk>gone`](#s-mountTalk-gone) · [`mountTalk>paintLog`](#s-mountTalk-paintLog) · [`mountTalk>paintOpts`](#s-mountTalk-paintOpts) · [`subLine`](#s-subLine)
- called by: [`mountTalk>paintOpts`](#s-mountTalk-paintOpts) ×6 · [`mountTalk>paintOpts.onDone`](#s-mountTalk-paintOpts-onDone) · [`mountTalk>refresh`](#s-mountTalk-refresh) · [`mountTalk>send`](#s-mountTalk-send)

<!-- note:mountTalk>after -->
<!-- /note -->

#### <a id="s-mountTalk-paintOpts"></a>`mountTalk>paintOpts()`

function · L79–146

- calls: [`advanceBeat`](beats.js.md#s-advanceBeat) _js/crew/beats.js_ · [`beatsFor`](beats.js.md#s-beatsFor) _js/crew/beats.js_ ×2 · [`isRunning`](beats.js.md#s-isRunning) _js/crew/beats.js_ · [`playBeat`](beats.js.md#s-playBeat) _js/crew/beats.js_ · [`choose`](talk.js.md#s-choose) _js/crew/talk.js_ · [`lockedTopicsFor`](talk.js.md#s-lockedTopicsFor) _js/crew/talk.js_ · [`open`](talk.js.md#s-open) _js/crew/talk.js_ · [`topicsFor`](talk.js.md#s-topicsFor) _js/crew/talk.js_ · [`mountTalk>after`](#s-mountTalk-after) ×6 · [`mountTalk>btn`](#s-mountTalk-btn) ×9 · [`mountTalk>gone`](#s-mountTalk-gone) ×2
- via [js/crew/beats.js](beats.js.md): `beatsFor.map`, `beatsFor.map.filter`
- called by: [`mountTalk`](#s-mountTalk) · [`mountTalk>after`](#s-mountTalk-after) · [`mountTalk>paintOpts.onStep`](#s-mountTalk-paintOpts-onStep)

<!-- note:mountTalk>paintOpts -->
- L83 · `for (const ch of view.beatChoices ?? []) opts.append(btn(ch.label, () => { advanceBeat(m.i` — 0.3.17: a scene waits on you — its answers, and a way out
- L88 · `for (const ch of view.choices) opts.append(btn(ch.label, () => {` — a line is waiting on an answer
- L99 · `` opts.append(btn(`▶ ${beat.label}`, () => { `` — ▶ marks a scene (several answers, a bar that moves as you answer) apart from a one-line topic
- L132 · `const staged = new Set(beatsFor(m).map((b) => b.replaces).filter(Boolean));` — a beat that stages the same subject replaces the one-tap topic, so the
  list does not carry two identical labels doing different things
- L136 · `barWrap.hidden = true;` — the last scene's bar is not this conversation's
<!-- /note -->

##### <a id="s-mountTalk-paintOpts-onStep"></a>`mountTalk>paintOpts.onStep({…})`

prop · L107–116

- calls: [`mountTalk>paintOpts`](#s-mountTalk-paintOpts)

<!-- note:mountTalk>paintOpts.onStep -->
- L115 · `if (view.beating && choices?.length) paintOpts();` — the answers are buttons: repaint them for the new stage
<!-- /note -->

##### <a id="s-mountTalk-paintOpts-onDone"></a>`mountTalk>paintOpts.onDone(res)`

prop · L117–127

- calls: [`mountTalk>after`](#s-mountTalk-after)

<!-- note:mountTalk>paintOpts.onDone -->
<!-- /note -->

#### <a id="s-mountTalk-send"></a>`mountTalk>send()`

function · L153–160

- calls: [`answerFreeText`](talk.js.md#s-answerFreeText) _js/crew/talk.js_ · [`mountTalk>after`](#s-mountTalk-after)
- called by: [`mountTalk`](#s-mountTalk)

<!-- note:mountTalk>send -->
<!-- /note -->

#### <a id="s-mountTalk-refresh"></a>`mountTalk>refresh()`

function · L166–169

- calls: [`mountTalk>after`](#s-mountTalk-after) · [`mountTalk>gone`](#s-mountTalk-gone) · [`subLine`](#s-subLine)

<!-- note:mountTalk>refresh -->
The refresher the console ticks, with a teardown hung off it: switching
hands or closing the sheet used to leave a beat running against a panel
that was no longer on screen.
<!-- /note -->
