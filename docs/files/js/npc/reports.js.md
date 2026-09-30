# js/npc/reports.js

[index](../../../README.md) · 235 lines · 25 symbols · 3 imports · 3 importers

## About

<!-- note:@file -->
LIVING GALAXY — first-hand reports on the open channel.

0.3.16. The speech engine is good at people talking; it is not a sensor.
These are the calls a pilot makes because of something that is actually
there — and every one is built from js/npc/ground.js at the moment it is
said, by a hull that is actually where the claim is:

  MAYDAY   a hull that is really being shot (a fresh hit, an open distress
           call, or the victim of a live engagement) says who is shooting,
           how many, where it is, and its real hull integrity. A raider in
           the middle of its own attack does not get to call one.
  PORT     a hull inside a port's approaches says how busy it is there —
           the real count of hulls around that port, how many are on the
           entry lane, how many are in the bay — or that it is quiet. A
           hull forty kilometres off in open space says nothing about it.
  CLAIM    a miner on its claim says what the rock is: the ore it is
           cutting, the most valuable thing in reach and how much of it,
           against the common stuff — and whether there are raiders or
           rogue drones on the belt with it, how many, how far, and which
           nest the drones came out of if one is in reach.
  PICKET   a patrol or security hull says what its sweep actually shows.

comms.js asks for an urgent one every chatter tick (a new mayday goes out
at once) and mixes the rest in with the speech engine's exchanges.

- L5 · `export const REPORT_RANGE = 140000;` — who you can hear (matches the band)
- L6 · `const MAYDAY_REPEAT = 45;` — s: a hull still under fire calls again
- L7 · `const PORT_REPEAT = 240;` — s: per port
- L8 · `const CLAIM_REPEAT = 300;` — s: per miner
- L9 · `const PICKET_REPEAT = 200;` — s: per picket
<!-- /note -->

## Imports

| line | from | names | target |
|---|---|---|---|
| 1 | `./traffic.js` | `traffic`, `vesselById`, `HOSTILE_ROLES`, `LAW_ROLES` | [js/npc/traffic.js](traffic.js.md) |
| 2 | `../economy/materials.js` | `goodName` | [js/economy/materials.js](../economy/materials.js.md) |
| 3 | `./ground.js` | `placeOf`, `placePhrase`, `portCensus`, `underFire`, `threatsNear`, `claimSurvey`, `unitsPhrase`, `countWord`, `bearingTo`, `PORT_R`, `BELT_THREAT_R` | [js/npc/ground.js](ground.js.md) |

## Imported by

- [js/comms/comms.js](../comms/comms.js.md) — `groundedReport`, `urgentReport`, `transitionReport`, `resetReports`
- [js/npc/speech.js](speech.js.md) — `reports`, `answerFor`
- test/ground.test.mjs _(outside js/)_ — `groundedReport`, `urgentReport`, `resetReports`, `reports`, `answerFor`, `transitionReport`

## Exports

- [`REPORT_RANGE`](#s-REPORT_RANGE) · const — **no importer in scanned roots**
- [`reports`](#s-reports) · const — used by [js/npc/speech.js](speech.js.md), test/ground.test.mjs
- [`resetReports`](#s-resetReports) · function — used by [js/comms/comms.js](../comms/comms.js.md), test/ground.test.mjs
- [`urgentReport`](#s-urgentReport) · function — used by [js/comms/comms.js](../comms/comms.js.md), test/ground.test.mjs
- [`groundedReport`](#s-groundedReport) · function — used by [js/comms/comms.js](../comms/comms.js.md), test/ground.test.mjs
- [`transitionReport`](#s-transitionReport) · function — used by [js/comms/comms.js](../comms/comms.js.md), test/ground.test.mjs
- [`answerFor`](#s-answerFor) · function — used by [js/npc/speech.js](speech.js.md), test/ground.test.mjs

## Effects

_none detected_

## Symbols

### <a id="s-REPORT_RANGE"></a>`REPORT_RANGE`

const · **exported** · L5–5

<!-- note:REPORT_RANGE -->
<!-- /note -->

### <a id="s-MAYDAY_REPEAT"></a>`MAYDAY_REPEAT`

const · L6–6

<!-- note:MAYDAY_REPEAT -->
<!-- /note -->

### <a id="s-PORT_REPEAT"></a>`PORT_REPEAT`

const · L7–7

<!-- note:PORT_REPEAT -->
<!-- /note -->

### <a id="s-CLAIM_REPEAT"></a>`CLAIM_REPEAT`

const · L8–8

<!-- note:CLAIM_REPEAT -->
<!-- /note -->

### <a id="s-PICKET_REPEAT"></a>`PICKET_REPEAT`

const · L9–9

<!-- note:PICKET_REPEAT -->
<!-- /note -->

### <a id="s-reports"></a>`reports`

const · **exported** · L11–11

<!-- note:reports -->
`nameOf` is how a hull's pilot is named on the band; js/npc/speech.js sets it to its voiceName()
<!-- /note -->

#### <a id="s-reports-nameOf"></a>`reports.nameOf(n)`

prop · L11–11

<!-- note:reports.nameOf -->
<!-- /note -->

### <a id="s-resetReports"></a>`resetReports()`

function · **exported** · L13–13

- called by: [`step`](../comms/comms.js.md#s-step) _js/comms/comms.js_

<!-- note:resetReports -->
<!-- /note -->

### <a id="s-d3"></a>`d3(a, b)`

function · L15–15

- called by: [`groundedReport`](#s-groundedReport) · [`heard`](#s-heard) · [`urgentReport`](#s-urgentReport)

<!-- note:d3 -->
<!-- /note -->

### <a id="s-km"></a>`km(u)`

function · L16–16

- called by: [`answerFor`](#s-answerFor) ×3 · [`claimFor`](#s-claimFor) ×3 · [`picketFor`](#s-picketFor) ×3 · [`portFor`](#s-portFor) ×2

<!-- note:km -->
<!-- /note -->

### <a id="s-cap"></a>`cap(s)`

function · L17–17

- called by: [`answerFor`](#s-answerFor) · [`claimFor`](#s-claimFor) ×2 · [`portFor`](#s-portFor) ×2

<!-- note:cap -->
<!-- /note -->

### <a id="s-speakerOf"></a>`speakerOf(n)`

function · L19–21

- called by: [`shape`](#s-shape)

<!-- note:speakerOf -->
<!-- /note -->

### <a id="s-due"></a>`due(key, now, every)`

function · L23–26

- called by: [`claimFor`](#s-claimFor) · [`picketFor`](#s-picketFor) · [`portFor`](#s-portFor) · [`urgentReport`](#s-urgentReport)

<!-- note:due -->
<!-- /note -->

### <a id="s-mark"></a>`mark(key, now)`

function · L27–30

- called by: [`shape`](#s-shape) · [`urgentReport`](#s-urgentReport)

<!-- note:mark -->
<!-- /note -->

### <a id="s-hullTag"></a>`hullTag(n)`

function · L32–34

- called by: [`maydayFor`](#s-maydayFor)

<!-- note:hullTag -->
- L33 · `return n.name;` — "Wayline Hauler AISAIL-53" → the hull a listener can find on the board
<!-- /note -->

### <a id="s-maydayFor"></a>`maydayFor(n, now)`

function · L36–50

- calls: [`countWord`](ground.js.md#s-countWord) _js/npc/ground.js_ ×2 · [`placeOf`](ground.js.md#s-placeOf) _js/npc/ground.js_ · [`placePhrase`](ground.js.md#s-placePhrase) _js/npc/ground.js_ · [`underFire`](ground.js.md#s-underFire) _js/npc/ground.js_ · [`hullTag`](#s-hullTag)
- via [js/npc/traffic.js](traffic.js.md): `HOSTILE_ROLES.has`
- called by: [`urgentReport`](#s-urgentReport)

<!-- note:maydayFor -->
---- MAYDAY ------------------------------------------------------------------

- L39 · `if (HOSTILE_ROLES.has(n.role) || n.rogue) return null;` — raiders and drones do not call for help
<!-- /note -->

### <a id="s-portFor"></a>`portFor(n, now)`

function · L52–74

- calls: [`countWord`](ground.js.md#s-countWord) _js/npc/ground.js_ ×8 · [`placeOf`](ground.js.md#s-placeOf) _js/npc/ground.js_ · [`portCensus`](ground.js.md#s-portCensus) _js/npc/ground.js_ · [`cap`](#s-cap) ×2 · [`due`](#s-due) · [`km`](#s-km) ×2
- via [js/npc/traffic.js](traffic.js.md): `HOSTILE_ROLES.has`
- called by: [`groundedReport`](#s-groundedReport)

<!-- note:portFor -->
---- PORT ----------------------------------------------------------------------

- L55 · `if (pl.kind !== "port") return null;` — only a hull that is THERE
- L59 · `const others = c.total - 1;` — not counting the speaker
<!-- /note -->

### <a id="s-claimFor"></a>`claimFor(n, now)`

function · L76–114

- calls: [`bearingTo`](ground.js.md#s-bearingTo) _js/npc/ground.js_ · [`claimSurvey`](ground.js.md#s-claimSurvey) _js/npc/ground.js_ · [`countWord`](ground.js.md#s-countWord) _js/npc/ground.js_ ×3 · [`placeOf`](ground.js.md#s-placeOf) _js/npc/ground.js_ · [`placePhrase`](ground.js.md#s-placePhrase) _js/npc/ground.js_ ×2 · [`threatsNear`](ground.js.md#s-threatsNear) _js/npc/ground.js_ · [`unitsPhrase`](ground.js.md#s-unitsPhrase) _js/npc/ground.js_ ×4 · [`cap`](#s-cap) ×2 · [`due`](#s-due) · [`km`](#s-km) ×3
- called by: [`groundedReport`](#s-groundedReport) · [`transitionReport`](#s-transitionReport)

<!-- note:claimFor -->
---- CLAIM ----------------------------------------------------------------------
<!-- /note -->

### <a id="s-picketFor"></a>`picketFor(n, now)`

function · L116–131

- calls: [`bearingTo`](ground.js.md#s-bearingTo) _js/npc/ground.js_ · [`countWord`](ground.js.md#s-countWord) _js/npc/ground.js_ ×2 · [`placeOf`](ground.js.md#s-placeOf) _js/npc/ground.js_ · [`placePhrase`](ground.js.md#s-placePhrase) _js/npc/ground.js_ ×2 · [`threatsNear`](ground.js.md#s-threatsNear) _js/npc/ground.js_ · [`due`](#s-due) · [`km`](#s-km) ×3
- via [js/npc/traffic.js](traffic.js.md): `LAW_ROLES.has`
- called by: [`groundedReport`](#s-groundedReport)

<!-- note:picketFor -->
---- PICKET ----------------------------------------------------------------------
<!-- /note -->

### <a id="s-heard"></a>`heard(pos)`

function · L133–141

- calls: [`d3`](#s-d3)
- called by: [`groundedReport`](#s-groundedReport) · [`urgentReport`](#s-urgentReport)

<!-- note:heard -->
---- the desk ------------------------------------------------------------------
<!-- /note -->

### <a id="s-shape"></a>`shape(r, now)`

function · L143–149

- calls: [`mark`](#s-mark) · [`speakerOf`](#s-speakerOf)
- called by: [`groundedReport`](#s-groundedReport) · [`transitionReport`](#s-transitionReport) ×2 · [`urgentReport`](#s-urgentReport)

<!-- note:shape -->
<!-- /note -->

### <a id="s-urgentReport"></a>`urgentReport(pos, now)`

function · **exported** · L151–163

- calls: [`d3`](#s-d3) · [`due`](#s-due) · [`heard`](#s-heard) · [`mark`](#s-mark) · [`maydayFor`](#s-maydayFor) · [`shape`](#s-shape)
- called by: [`stepChatter`](../comms/comms.js.md#s-stepChatter) _js/comms/comms.js_ · [`groundedReport`](#s-groundedReport)

<!-- note:urgentReport -->
A mayday that has not gone out yet (or is due again), nearest first — or null.
<!-- /note -->

### <a id="s-groundedReport"></a>`groundedReport(pos, now, rnd=)`

function · **exported** · L165–183

- calls: [`claimFor`](#s-claimFor) · [`d3`](#s-d3) · [`heard`](#s-heard) · [`picketFor`](#s-picketFor) · [`portFor`](#s-portFor) · [`shape`](#s-shape) · [`urgentReport`](#s-urgentReport)
- called by: [`stepChatter`](../comms/comms.js.md#s-stepChatter) _js/comms/comms.js_

<!-- note:groundedReport -->
One first-hand report from somebody on the band, or null. Prefers the rarer,
more useful kinds: a claim report with a threat or a rich seam in it, then a
busy port, then a picket's sweep, then the rest. `rnd` breaks ties.

- L175 · `if (c.kind === "picket") w *= c.facts.pirates + c.facts.rogues ? 1.8 : 0.12;` — a clean sweep is worth hearing now and then, not every time
<!-- /note -->

### <a id="s-transitionReport"></a>`transitionReport(n, job, now)`

function · **exported** · L185–199

- calls: [`goodName`](../economy/materials.js.md#s-goodName) _js/economy/materials.js_ · [`placeOf`](ground.js.md#s-placeOf) _js/npc/ground.js_ ×2 · [`claimFor`](#s-claimFor) · [`shape`](#s-shape) ×2 · [`vesselById`](traffic.js.md#s-vesselById) _js/npc/traffic.js_
- via [js/economy/materials.js](../economy/materials.js.md): `goodName.toLowerCase`
- called by: [`onVesselTransition`](../comms/comms.js.md#s-onVesselTransition) _js/comms/comms.js_

<!-- note:transitionReport -->
What a hull says when it changes job near you (comms.js onVesselTransition), grounded. Null to stay quiet.
<!-- /note -->

### <a id="s-answerFor"></a>`answerFor(n, intent, now)`

function · **exported** · L201–235

- calls: [`goodName`](../economy/materials.js.md#s-goodName) _js/economy/materials.js_ · [`bearingTo`](ground.js.md#s-bearingTo) _js/npc/ground.js_ · [`claimSurvey`](ground.js.md#s-claimSurvey) _js/npc/ground.js_ · [`countWord`](ground.js.md#s-countWord) _js/npc/ground.js_ ×6 · [`placeOf`](ground.js.md#s-placeOf) _js/npc/ground.js_ · [`placePhrase`](ground.js.md#s-placePhrase) _js/npc/ground.js_ ×3 · [`portCensus`](ground.js.md#s-portCensus) _js/npc/ground.js_ · [`threatsNear`](ground.js.md#s-threatsNear) _js/npc/ground.js_ ×2 · [`unitsPhrase`](ground.js.md#s-unitsPhrase) _js/npc/ground.js_ · [`cap`](#s-cap) · [`km`](#s-km) ×3
- via [js/economy/materials.js](../economy/materials.js.md): `goodName.toLowerCase`
- via [js/npc/ground.js](ground.js.md): `unitsPhrase.replace`
- called by: [`talkTo`](speech.js.md#s-talkTo) _js/npc/speech.js_

<!-- note:answerFor -->
---- answering you --------------------------------------------------------------

What a hull says when YOU ask it about ore, danger, the lanes or traffic —
from the sky, not the engine's stock lines. Null when the question is not
one of those (the engine answers it as before).
<!-- /note -->
