# js/npc/ground.js

[index](../../../README.md) · 170 lines · 20 symbols · 9 imports · 3 importers

## About

<!-- note:@file -->
LIVING GALAXY — ground truth for anything said on the band.

0.3.16. The open channel used to make claims nobody checked: a hull said
the lane off a port was "stacked" while it was forty kilometres out in
open space bound FOR that port; a pirate mid-raid broadcast that it was
"taking fire"; a victim actually being shot kept quiet because its speech
unit read hull 100 % off a job string; miners called their seam "good" off
a hash that never changed, and never said what was in it, how much, or who
was sitting on the belt with them.

Everything here answers one question about the live sky, from the live
sky, and nothing else — no rolls, no templates. js/npc/speech.js grounds
the speech engine's units and callbacks on it, and js/npc/reports.js builds
the band's first-hand reports from it.

  placeOf(p)            where a point actually is: a port's approaches, a
                        belt, or open space (and the port it is nearest)
  portCensus(st)        who is actually around a port right now
  underFire(n, t)       is this hull being shot at, by whom, how badly
  threatsNear(p, r)     raiders and rogue drones actually within r
  claimSurvey(p, t)     what is in the rock at a claim: ores, amounts, value

Units: 1 world unit = 10 m, so 100 u is a kilometre.

- L11 · `export const PORT_R = 4000;` — 40 km: "around" a port — its approaches, its lanes, its ring
- L12 · `export const THREAT_R = 3000;` — 30 km: a contact worth calling
- L13 · `export const BELT_THREAT_R = 6000;` — 60 km: a raider or drone near enough to a claim to matter
- L14 · `export const HIT_FRESH_S = 25;` — a hit this recent means the shooting is still going on
- L167 · `trafficHooks.claimOre = (p, t) => {` — the timetable asks what a finished claim sends home
<!-- /note -->

## Imports

| line | from | names | target |
|---|---|---|---|
| 1 | `./traffic.js` | `traffic`, `vesselById`, `trafficHooks`, `HOSTILE_ROLES` | [js/npc/traffic.js](traffic.js.md) |
| 2 | `./flow.js` | `flow` | [js/npc/flow.js](flow.js.md) |
| 3 | `./security.js` | `distress` | [js/npc/security.js](security.js.md) |
| 4 | `./battles.js` | `engagementAt` | [js/npc/battles.js](battles.js.md) |
| 5 | `./rogues.js` | `nests` | [js/npc/rogues.js](rogues.js.md) |
| 6 | `../station/stations.js` | `stations` | [js/station/stations.js](../station/stations.js.md) |
| 7 | `../world/bodies.js` | `currentSystem` | [js/world/bodies.js](../world/bodies.js.md) |
| 8 | `../world/field.js` | `nearbyRocks`, `bandNameAt` | [js/world/field.js](../world/field.js.md) |
| 9 | `../economy/materials.js` | `baseValue`, `goodName` | [js/economy/materials.js](../economy/materials.js.md) |

## Imported by

- [js/npc/reports.js](reports.js.md) — `placeOf`, `placePhrase`, `portCensus`, `underFire`, `threatsNear`, `claimSurvey`, `unitsPhrase`, `countWord`, `bearingTo`, `PORT_R`, `BELT_THREAT_R`
- [js/npc/speech.js](speech.js.md) — `placeOf`, `portCensus`, `underFire`, `threatsNear`, `claimSurvey`, `bearingTo`, `THREAT_R`
- test/ground.test.mjs _(outside js/)_ — `placeOf`, `portCensus`, `underFire`, `threatsNear`, `claimSurvey`, `PORT_R`, `BELT_THREAT_R`

## Exports

- [`PORT_R`](#s-PORT_R) · const — used by [js/npc/reports.js](reports.js.md), test/ground.test.mjs
- [`THREAT_R`](#s-THREAT_R) · const — used by [js/npc/speech.js](speech.js.md)
- [`BELT_THREAT_R`](#s-BELT_THREAT_R) · const — used by [js/npc/reports.js](reports.js.md), test/ground.test.mjs
- [`HIT_FRESH_S`](#s-HIT_FRESH_S) · const — **no importer in scanned roots**
- [`placeOf`](#s-placeOf) · function — used by [js/npc/reports.js](reports.js.md), [js/npc/speech.js](speech.js.md), test/ground.test.mjs
- [`placePhrase`](#s-placePhrase) · function — used by [js/npc/reports.js](reports.js.md)
- [`portCensus`](#s-portCensus) · function — used by [js/npc/reports.js](reports.js.md), [js/npc/speech.js](speech.js.md), test/ground.test.mjs
- [`underFire`](#s-underFire) · function — used by [js/npc/reports.js](reports.js.md), [js/npc/speech.js](speech.js.md), test/ground.test.mjs
- [`threatsNear`](#s-threatsNear) · function — used by [js/npc/reports.js](reports.js.md), [js/npc/speech.js](speech.js.md), test/ground.test.mjs
- [`bearingTo`](#s-bearingTo) · function — used by [js/npc/reports.js](reports.js.md), [js/npc/speech.js](speech.js.md)
- [`rockUnits`](#s-rockUnits) · function — **no importer in scanned roots**
- [`claimSurvey`](#s-claimSurvey) · function — used by [js/npc/reports.js](reports.js.md), [js/npc/speech.js](speech.js.md), test/ground.test.mjs
- [`unitsPhrase`](#s-unitsPhrase) · function — used by [js/npc/reports.js](reports.js.md)
- [`countWord`](#s-countWord) · function — used by [js/npc/reports.js](reports.js.md)

## Effects

_none detected_

## Symbols

### <a id="s-PORT_R"></a>`PORT_R`

const · **exported** · L11–11

<!-- note:PORT_R -->
<!-- /note -->

### <a id="s-THREAT_R"></a>`THREAT_R`

const · **exported** · L12–12

<!-- note:THREAT_R -->
<!-- /note -->

### <a id="s-BELT_THREAT_R"></a>`BELT_THREAT_R`

const · **exported** · L13–13

<!-- note:BELT_THREAT_R -->
<!-- /note -->

### <a id="s-HIT_FRESH_S"></a>`HIT_FRESH_S`

const · **exported** · L14–14

<!-- note:HIT_FRESH_S -->
<!-- /note -->

### <a id="s-d3"></a>`d3(a, b)`

function · L16–16

- called by: [`placeOf`](#s-placeOf) · [`portCensus`](#s-portCensus) ×2 · [`threatsNear`](#s-threatsNear) ×2 · [`underFire`](#s-underFire)

<!-- note:d3 -->
<!-- /note -->

### <a id="s-km"></a>`km(u)`

function · L17–17

- called by: [`placeOf`](#s-placeOf)

<!-- note:km -->
<!-- /note -->

### <a id="s-beltOf"></a>`beltOf(rad)`

function · L19–24

- called by: [`placeOf`](#s-placeOf)

<!-- note:beltOf -->
---- where ------------------------------------------------------------------
<!-- /note -->

### <a id="s-placeOf"></a>`placeOf(p)`

function · **exported** · L26–34

- calls: [`beltOf`](#s-beltOf) · [`d3`](#s-d3) · [`km`](#s-km) · [`bandNameAt`](../world/field.js.md#s-bandNameAt) _js/world/field.js_
- called by: [`answerFor`](reports.js.md#s-answerFor) _js/npc/reports.js_ · [`claimFor`](reports.js.md#s-claimFor) _js/npc/reports.js_ · [`maydayFor`](reports.js.md#s-maydayFor) _js/npc/reports.js_ · [`picketFor`](reports.js.md#s-picketFor) _js/npc/reports.js_ · [`portFor`](reports.js.md#s-portFor) _js/npc/reports.js_ · [`transitionReport`](reports.js.md#s-transitionReport) _js/npc/reports.js_ ×2 · [`flowUnit`](speech.js.md#s-flowUnit) _js/npc/speech.js_ · [`vesselUnit`](speech.js.md#s-vesselUnit) _js/npc/speech.js_

<!-- note:placeOf -->
Where a point is, said the way a pilot would place it.
  { kind: "port", station, dist, name }       inside PORT_R of a port
  { kind: "belt", name, band, nearest, dist } in a belt (band: metal/stone/carbon/ice)
  { kind: "space", nearest, dist, name }      anywhere else ("12 km out from X")
<!-- /note -->

### <a id="s-placePhrase"></a>`placePhrase(pl)`

function · **exported** · L36–41

- called by: [`answerFor`](reports.js.md#s-answerFor) _js/npc/reports.js_ ×3 · [`claimFor`](reports.js.md#s-claimFor) _js/npc/reports.js_ ×2 · [`maydayFor`](reports.js.md#s-maydayFor) _js/npc/reports.js_ · [`picketFor`](reports.js.md#s-picketFor) _js/npc/reports.js_ ×2

<!-- note:placePhrase -->
A place as an adverbial: "off Smelt Station", "on the belt past Smelt Station", "80 km out from Smelt Station".
<!-- /note -->

### <a id="s-portCensus"></a>`portCensus(st, R=)`

function · **exported** · L43–66

- calls: [`d3`](#s-d3) ×2
- via [js/npc/traffic.js](traffic.js.md): `HOSTILE_ROLES.has`
- called by: [`answerFor`](reports.js.md#s-answerFor) _js/npc/reports.js_ · [`portFor`](reports.js.md#s-portFor) _js/npc/reports.js_ · [`groundCtx`](speech.js.md#s-groundCtx) _js/npc/speech.js_

<!-- note:portCensus -->
---- who is around a port ------------------------------------------------------

Hulls actually on the board around a port right now — named traffic, flow
boats, both counted only if visible and inside PORT_R — split by what they
are doing there. Docked hulls are inside the ring and not "around" it.
<!-- /note -->

### <a id="s-nameOf"></a>`nameOf(id)`

function · L68–73

- calls: [`vesselById`](traffic.js.md#s-vesselById) _js/npc/traffic.js_
- called by: [`underFire`](#s-underFire)

<!-- note:nameOf -->
---- who is being shot ---------------------------------------------------------
<!-- /note -->

### <a id="s-underFire"></a>`underFire(n, t)`

function · **exported** · L75–93

- calls: [`engagementAt`](battles.js.md#s-engagementAt) _js/npc/battles.js_ · [`d3`](#s-d3) · [`nameOf`](#s-nameOf) · [`vesselById`](traffic.js.md#s-vesselById) _js/npc/traffic.js_ ×3
- via [js/npc/traffic.js](traffic.js.md): `HOSTILE_ROLES.has`
- via [js/npc/security.js](security.js.md): `distress.find`
- called by: [`maydayFor`](reports.js.md#s-maydayFor) _js/npc/reports.js_ · [`vesselUnit`](speech.js.md#s-vesselUnit) _js/npc/speech.js_

<!-- note:underFire -->
Is `n` under fire right now? Real only: a hit inside HIT_FRESH_S, an open
distress call it raised that is still being hit, or a live engagement it
is the VICTIM of (the wing's tracers are flying at it). A raider in the
middle of its own attack is not under fire unless something is shooting
back at it — it does not get to call a mayday.

- L88 · `let count = attackers.length;` — count what is actually shooting: the wing, plus hostile hulls closing inside 2 km
<!-- /note -->

### <a id="s-threatsNear"></a>`threatsNear(p, r=, except=)`

function · **exported** · L95–111

- calls: [`d3`](#s-d3) ×2
- via [js/npc/traffic.js](traffic.js.md): `HOSTILE_ROLES.has`
- called by: [`answerFor`](reports.js.md#s-answerFor) _js/npc/reports.js_ ×2 · [`claimFor`](reports.js.md#s-claimFor) _js/npc/reports.js_ · [`picketFor`](reports.js.md#s-picketFor) _js/npc/reports.js_ · [`GROUNDED.positionReport`](speech.js.md#s-GROUNDED-positionReport) _js/npc/speech.js_ · [`GROUNDED.smallTalk`](speech.js.md#s-GROUNDED-smallTalk) _js/npc/speech.js_ · [`groundCtx`](speech.js.md#s-groundCtx) _js/npc/speech.js_ ×3

<!-- note:threatsNear -->
---- threats -------------------------------------------------------------------

Raiders and rogue drones actually on the board within r of p, nearest first, plus any known nest inside r.
<!-- /note -->

### <a id="s-bearingTo"></a>`bearingTo(a, b)`

function · **exported** · L113–116

- called by: [`answerFor`](reports.js.md#s-answerFor) _js/npc/reports.js_ · [`claimFor`](reports.js.md#s-claimFor) _js/npc/reports.js_ · [`picketFor`](reports.js.md#s-picketFor) _js/npc/reports.js_ · [`groundCtx`](speech.js.md#s-groundCtx) _js/npc/speech.js_ ×2

<!-- note:bearingTo -->
Bearing from a to b as a compass number, 0..359 on the flat x/z plane (0 = −z, clockwise).
<!-- /note -->

### <a id="s-rockUnits"></a>`rockUnits(k)`

function · **exported** · L118–121

- called by: [`claimSurvey`](#s-claimSurvey)

<!-- note:rockUnits -->
---- what is in the rock ---------------------------------------------------------

units a rock gives a working cutter before it is spent — the same yield curve
turrets.js cuts with (2.5 + (r/60)^1.5 · 5 u/s at MINE_YIELD 0.5, ~31 s a rock)
<!-- /note -->

### <a id="s-_survey"></a>`_survey`

const · L123–123

<!-- note:_survey -->
<!-- /note -->

### <a id="s-claimSurvey"></a>`claimSurvey(p, t)`

function · **exported** · L125–154

- calls: [`baseValue`](../economy/materials.js.md#s-baseValue) _js/economy/materials.js_ · [`goodName`](../economy/materials.js.md#s-goodName) _js/economy/materials.js_ · [`rockUnits`](#s-rockUnits) · [`nearbyRocks`](../world/field.js.md#s-nearbyRocks) _js/world/field.js_
- called by: [`s`](#s-s) · [`answerFor`](reports.js.md#s-answerFor) _js/npc/reports.js_ · [`claimFor`](reports.js.md#s-claimFor) _js/npc/reports.js_ · [`vesselUnit`](speech.js.md#s-vesselUnit) _js/npc/speech.js_

<!-- note:claimSurvey -->
What is in the rock around a claim: every ore on the rocks within one cell,
how many units a cutter would actually get, what it is worth at book, which
are rich seams. Sorted by value, richest first. Cached per claim cell for
thirty seconds of sky time (the field drifts slowly and wears as it is cut).

- L146 · `const pays = ores.slice().sort((a, b) => b.worth - a.worth)[0] ?? null;` — what a cutter would work: the most money in the rock, not the most rock
- L148 · `const perUnit = units > 0 ? worth / units : 0;` — a grade the speech engine understands, 0..1: book value per unit against iron's
<!-- /note -->

### <a id="s-unitsPhrase"></a>`unitsPhrase(n)`

function · **exported** · L156–160

- called by: [`answerFor`](reports.js.md#s-answerFor) _js/npc/reports.js_ · [`claimFor`](reports.js.md#s-claimFor) _js/npc/reports.js_ ×4

<!-- note:unitsPhrase -->
Say an amount of ore the way a cutter would: "about 340 units".
<!-- /note -->

### <a id="s-countWord"></a>`countWord(n)`

function · **exported** · L162–165

- called by: [`answerFor`](reports.js.md#s-answerFor) _js/npc/reports.js_ ×6 · [`claimFor`](reports.js.md#s-claimFor) _js/npc/reports.js_ ×3 · [`maydayFor`](reports.js.md#s-maydayFor) _js/npc/reports.js_ ×2 · [`picketFor`](reports.js.md#s-picketFor) _js/npc/reports.js_ ×2 · [`portFor`](reports.js.md#s-portFor) _js/npc/reports.js_ ×8

<!-- note:countWord -->
<!-- /note -->

### <a id="s-s"></a>`s`

const · L168–168

- calls: [`claimSurvey`](#s-claimSurvey)

<!-- note:s -->
<!-- /note -->
