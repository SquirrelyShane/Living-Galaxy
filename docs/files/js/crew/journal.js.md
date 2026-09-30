# js/crew/journal.js

[index](../../../README.md) · 129 lines · 19 symbols · 1 imports · 9 importers

## About

<!-- note:@file -->
Living Galaxy — the NPC JOURNAL: what a person did, and why, on the record.

CRADLE has always kept a `history` — one line of prose per event, good for
a card and useless for anything else. This is the machine-readable layer
underneath it: one full record per decision, in the same shape the
genome-agent project writes (docs/RECORD-SCHEMA.md), re-pointed at a hull
instead of a grid world. Surroundings are the room and the hull's state;
holdings are wages owed, kit and know-how; the world that gets marked is
the ship.

Storage is deliberately asymmetric. Records live in a session ring in
memory (everything, for the panel and the tests) and a short capped tail on
the CRADLE record (the last JOURNAL_KEEP, for the ledger, so a hand who
signs on at Kessler Reach two skies later still carries the row about the
night they stopped speaking to the cook). `exportJournals()` writes the lot.

Records are data, never instructions: nothing downstream evaluates a
`summary` or a `reasoning` line, it only prints them.
<!-- /note -->

## Imports

| line | from | names | target |
|---|---|---|---|
| 1 | `../npc/cradle.js` | `cradle` | [js/npc/cradle.js](../npc/cradle.js.md) |

## Imported by

- [js/console/panels/crew-gene.js](../console/panels/crew-gene.js.md) — `journal`, `exportJournals`, `habitsOf`
- [js/console/panels/crew.js](../console/panels/crew.js.md) — `journal`
- [js/crew/deckacts.js](deckacts.js.md) — `diffOf`
- [js/crew/deckmind.js](deckmind.js.md) — `fileRecord`, `diffOf`, `r3`, `writeSummary`
- [js/crew/talk-wants.js](talk-wants.js.md) — `journal`
- [js/npc/npccrew.js](../npc/npccrew.js.md) — `journal`
- test/genome.test.mjs _(outside js/)_ — `journal`, `exportJournals`, `importJournals`, `habitsOf`, `JOURNAL_KEEP`
- test/orders.test.mjs _(outside js/)_ — `journal`
- test/skycrew.test.mjs _(outside js/)_ — `journal`

## Exports

- [`JOURNAL_VERSION`](#s-JOURNAL_VERSION) · const — **no importer in scanned roots**
- [`JOURNAL_KEEP`](#s-JOURNAL_KEEP) · const — used by test/genome.test.mjs
- [`RING_CAP`](#s-RING_CAP) · const — **no importer in scanned roots**
- [`journal`](#s-journal) · const — used by [js/console/panels/crew-gene.js](../console/panels/crew-gene.js.md), [js/console/panels/crew.js](../console/panels/crew.js.md), [js/crew/talk-wants.js](talk-wants.js.md), [js/npc/npccrew.js](../npc/npccrew.js.md), test/genome.test.mjs, test/orders.test.mjs, test/skycrew.test.mjs
- [`fileRecord`](#s-fileRecord) · function — used by [js/crew/deckmind.js](deckmind.js.md)
- [`r3`](#s-r3) · function — used by [js/crew/deckmind.js](deckmind.js.md)
- [`diffOf`](#s-diffOf) · function — used by [js/crew/deckacts.js](deckacts.js.md), [js/crew/deckmind.js](deckmind.js.md)
- [`writeSummary`](#s-writeSummary) · function — used by [js/crew/deckmind.js](deckmind.js.md)
- [`exportJournals`](#s-exportJournals) · function — used by [js/console/panels/crew-gene.js](../console/panels/crew-gene.js.md), test/genome.test.mjs
- [`importJournals`](#s-importJournals) · function — used by test/genome.test.mjs
- [`shedJournals`](#s-shedJournals) · function — **no importer in scanned roots**
- [`habitsOf`](#s-habitsOf) · function — used by [js/console/panels/crew-gene.js](../console/panels/crew-gene.js.md), test/genome.test.mjs

## Effects

_none detected_

## Symbols

### <a id="s-JOURNAL_VERSION"></a>`JOURNAL_VERSION`

const · **exported** · L3–3

<!-- note:JOURNAL_VERSION -->
<!-- /note -->

### <a id="s-JOURNAL_KEEP"></a>`JOURNAL_KEEP`

const · **exported** · L4–4

<!-- note:JOURNAL_KEEP -->
Full records kept on a ledger record. The session ring keeps far more.
<!-- /note -->

### <a id="s-RING_CAP"></a>`RING_CAP`

const · **exported** · L5–5

<!-- note:RING_CAP -->
Full records kept in memory across the whole crew this session.
<!-- /note -->

### <a id="s-ring"></a>`ring`

const · L7–7

<!-- note:ring -->
<!-- /note -->

### <a id="s-byAgent"></a>`byAgent`

const · L8–8

<!-- note:byAgent -->
<!-- /note -->

### <a id="s-journal"></a>`journal`

const · **exported** · L10–16

<!-- note:journal -->
<!-- /note -->

#### <a id="s-journal-size"></a>`journal.size()`

prop · L11–11

<!-- note:journal.size -->
<!-- /note -->

#### <a id="s-journal-all"></a>`journal.all()`

prop · L12–12

<!-- note:journal.all -->
Every record this session, newest last.
<!-- /note -->

#### <a id="s-journal-of"></a>`journal.of(id, n=)`

prop · L13–13

<!-- note:journal.of -->
Newest first, for one hand.
<!-- /note -->

#### <a id="s-journal-last"></a>`journal.last(id)`

prop · L14–14

<!-- note:journal.last -->
The most recent record for a hand, or null.
<!-- /note -->

#### <a id="s-journal-clear"></a>`journal.clear()`

prop · L15–15

<!-- note:journal.clear -->
<!-- /note -->

### <a id="s-fileRecord"></a>`fileRecord(rec)`

function · **exported** · L18–35

- via [js/npc/cradle.js](../npc/cradle.js.md): `cradle.get`, `cradle.put`
- called by: [`stepHand`](deckmind.js.md#s-stepHand) _js/crew/deckmind.js_ · [`importJournals`](#s-importJournals)

<!-- note:fileRecord -->
File a record: session ring, per-agent index, and the ledger tail.
<!-- /note -->

### <a id="s-r3"></a>`r3(v)`

function · **exported** · L37–37

- called by: [`buildContext`](deckmind.js.md#s-buildContext) _js/crew/deckmind.js_ ×2 · [`stepHand`](deckmind.js.md#s-stepHand) _js/crew/deckmind.js_ ×20 · [`diffOf`](#s-diffOf) ×3

<!-- note:r3 -->
3 decimal places, the schema's rule, applied at write time.
<!-- /note -->

### <a id="s-diffOf"></a>`diffOf(before, after, min=)`

function · **exported** · L39–49

- calls: [`r3`](#s-r3) ×3
- called by: [`applyAction`](deckacts.js.md#s-applyAction) _js/crew/deckacts.js_ ×3 · [`stepHand`](deckmind.js.md#s-stepHand) _js/crew/deckmind.js_ ×4

<!-- note:diffOf -->
{from, to, delta} for every key that actually moved. Returns null when
nothing did — the schema's own convention, and what keeps records small.
<!-- /note -->

### <a id="s-writeSummary"></a>`writeSummary(rec)`

function · **exported** · L51–71

- called by: [`stepHand`](deckmind.js.md#s-stepHand) _js/crew/deckmind.js_

<!-- note:writeSummary -->
One written sentence covering the whole record.
<!-- /note -->

### <a id="s-exportJournals"></a>`exportJournals({…}=)`

function · **exported** · L73–89

- via [js/npc/cradle.js](../npc/cradle.js.md): `cradle.all`, `cradle.all.map`
- called by: [`mountLog`](../console/panels/crew-gene.js.md#s-mountLog) _js/console/panels/crew-gene.js_

<!-- note:exportJournals -->
---- serialization -------------------------------------------------------

The whole flight recorder: every ledger record with its genome, lineage and
journal, plus this session's ring. Written by CONSOLE › CREW › LOG › EXPORT
and readable straight back by importJournals().
<!-- /note -->

### <a id="s-importJournals"></a>`importJournals(json)`

function · **exported** · L91–106

- calls: [`fileRecord`](#s-fileRecord)
- via [js/npc/cradle.js](../npc/cradle.js.md): `cradle.get`, `cradle.put`

<!-- note:importJournals -->
Take journals back in. Ledger records must already exist (importLedger first).
<!-- /note -->

### <a id="s-shedJournals"></a>`shedJournals(keepIds=)`

function · **exported** · L108–116

- via [js/npc/cradle.js](../npc/cradle.js.md): `cradle.all`

<!-- note:shedJournals -->
Drop stored journals from people who are not aboard, oldest first. Called
when localStorage refuses a write rather than losing the ledger itself —
a person's genome and history are worth more than their last twelve watches.
<!-- /note -->

### <a id="s-habitsOf"></a>`habitsOf(id)`

function · **exported** · L118–129

- called by: [`mountLog>paint`](../console/panels/crew-gene.js.md#s-mountLog-paint) _js/console/panels/crew-gene.js_

<!-- note:habitsOf -->
[{ id, action, kind, label, n }] — what this hand spends their life doing.
<!-- /note -->
