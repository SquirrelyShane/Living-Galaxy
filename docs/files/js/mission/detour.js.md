# js/mission/detour.js

[index](../../../README.md) · 59 lines · 7 symbols · 2 imports · 1 importers

## About

<!-- note:@file -->
0.3.88 — the leg, and the dogleg.

A world across the corridor used to end the step — "jupiter in lane" — and
with it the whole mission. A pilot flies round it; ARIA at the conn cannot,
so every dock at "the best buyer" or the yard was a coin toss on where the
planets stood that minute. An ARIA mission now takes the dogleg itself: a
transient mark clear of the world, a hop to it, then the leg resumes.
Missions a pilot starts by hand are left exactly as they were.

It is a factory, like tradeops.js, so it can sit beside run.js without
importing it back; the autopilot comes as a thunk because run.js and
autopilot.js import each other and the object is not there yet at load.
<!-- /note -->

## Imports

| line | from | names | target |
|---|---|---|---|
| 1 | `../sim/sim.js` | `sim`, `losBlocker`, `warpNodeById`, `warpDestination`, `addWaypointAt`, `removeWaypoint`, `logEvent` | [js/sim/sim.js](../sim/sim.js.md) |
| 2 | `../aria/nav.js` | `doglegAround` | [js/aria/nav.js](../aria/nav.js.md) |

## Imported by

- [js/mission/run.js](run.js.md) — `makeLegs`

## Exports

- [`LEG`](#s-LEG) · const — **no importer in scanned roots**
- [`makeLegs`](#s-makeLegs) · function — used by [js/mission/run.js](run.js.md)

## Effects

_none detected_

## Symbols

### <a id="s-LEG"></a>`LEG`

const · **exported** · L4–4

<!-- note:LEG -->
<!-- /note -->

### <a id="s-_q"></a>`_q`

const · L6–6

<!-- note:_q -->
<!-- /note -->

### <a id="s-makeLegs"></a>`makeLegs({…})`

function · **exported** · L8–59

- called by: [`@file`](run.js.md#) _js/mission/run.js_

<!-- note:makeLegs -->
<!-- /note -->

#### <a id="s-makeLegs-ariaFlown"></a>`makeLegs>ariaFlown()`

function · L9–12

- called by: [`makeLegs>legTo`](#s-makeLegs-legTo)

<!-- note:makeLegs>ariaFlown -->
0.3.90: a plan — a loop, a preset, anything with more than one step — is
flown unattended whoever started it, and takes the dogleg too. A single
"go there" order still stops and says why: the pilot is at the stick.
<!-- /note -->

#### <a id="s-makeLegs-failed"></a>`makeLegs>failed(r)`

function · L13–13

- called by: [`makeLegs>legTo`](#s-makeLegs-legTo) ×2

<!-- note:makeLegs>failed -->
<!-- /note -->

#### <a id="s-makeLegs-endDetour"></a>`makeLegs>endDetour()`

function · L15–22

- calls: [`removeWaypoint`](../sim/sim.js.md#s-removeWaypoint) _js/sim/sim.js_
- called by: [`makeLegs>legTo`](#s-makeLegs-legTo) ×2

<!-- note:makeLegs>endDetour -->
<!-- /note -->

#### <a id="s-makeLegs-legTo"></a>`makeLegs>legTo(s, node, extra)`

function · L24–56

- calls: [`doglegAround`](../aria/nav.js.md#s-doglegAround) _js/aria/nav.js_ · [`makeLegs>ariaFlown`](#s-makeLegs-ariaFlown) · [`makeLegs>endDetour`](#s-makeLegs-endDetour) ×2 · [`makeLegs>failed`](#s-makeLegs-failed) ×2 · [`addWaypointAt`](../sim/sim.js.md#s-addWaypointAt) _js/sim/sim.js_ · [`logEvent`](../sim/sim.js.md#s-logEvent) _js/sim/sim.js_ · [`losBlocker`](../sim/sim.js.md#s-losBlocker) _js/sim/sim.js_ ×2 · [`warpDestination`](../sim/sim.js.md#s-warpDestination) _js/sim/sim.js_ ×2 · [`warpNodeById`](../sim/sim.js.md#s-warpNodeById) _js/sim/sim.js_

<!-- note:makeLegs>legTo -->
<!-- /note -->
