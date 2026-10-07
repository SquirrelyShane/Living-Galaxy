# js/aria/belief.js

[index](../../../README.md) · 130 lines · 18 symbols · 0 imports · 3 importers

## About

<!-- note:@file -->
<!-- /note -->

## Imports

_none_

## Imported by

- [js/aria/aria.js](aria.js.md) — `beliefReport`
- [js/aria/senses.js](senses.js.md) — `track`, `markDanger`, `dangers`, `alertsSince`, `alertLine`, `resetBelief`
- [js/aria/wake.js](wake.js.md) — `anchor`

## Exports

- [`BELIEF`](#s-BELIEF) · const — **no importer in scanned roots**
- [`belief`](#s-belief) · const — **no importer in scanned roots**
- [`resetBelief`](#s-resetBelief) · function — used by [js/aria/senses.js](senses.js.md)
- [`observe`](#s-observe) · function — **no importer in scanned roots**
- [`recall`](#s-recall) · function — **no importer in scanned roots**
- [`track`](#s-track) · function — used by [js/aria/senses.js](senses.js.md)
- [`anchor`](#s-anchor) · function — used by [js/aria/wake.js](wake.js.md)
- [`trackerOf`](#s-trackerOf) · function — **no importer in scanned roots**
- [`alertsSince`](#s-alertsSince) · function — used by [js/aria/senses.js](senses.js.md)
- [`markDanger`](#s-markDanger) · function — used by [js/aria/senses.js](senses.js.md)
- [`dangers`](#s-dangers) · function — used by [js/aria/senses.js](senses.js.md)
- [`beliefReport`](#s-beliefReport) · function — used by [js/aria/aria.js](aria.js.md)
- [`alertLine`](#s-alertLine) · function — used by [js/aria/senses.js](senses.js.md)

## Effects

_none detected_

## Symbols

### <a id="s-BELIEF"></a>`BELIEF`

const · **exported** · L1–13

<!-- note:BELIEF -->
<!-- /note -->

### <a id="s-belief"></a>`belief`

const · **exported** · L15–15

<!-- note:belief -->
<!-- /note -->

### <a id="s-resetBelief"></a>`resetBelief()`

function · **exported** · L17–23

- called by: [`forgetSenses`](senses.js.md#s-forgetSenses) _js/aria/senses.js_

<!-- note:resetBelief -->
<!-- /note -->

### <a id="s-halfOf"></a>`halfOf(kind)`

function · L25–25

- called by: [`decay`](#s-decay)

<!-- note:halfOf -->
<!-- /note -->

### <a id="s-decay"></a>`decay(age, kind)`

function · L26–26

- calls: [`halfOf`](#s-halfOf)
- called by: [`dangers`](#s-dangers) · [`markDanger`](#s-markDanger) ×2 · [`recall`](#s-recall)

<!-- note:decay -->
<!-- /note -->

### <a id="s-trim"></a>`trim(map, cap, score)`

function · L28–33

- called by: [`markDanger`](#s-markDanger) · [`observe`](#s-observe) · [`track`](#s-track)

<!-- note:trim -->
<!-- /note -->

### <a id="s-observe"></a>`observe(key, value, at, {…}=)`

function · **exported** · L35–40

- calls: [`trim`](#s-trim)

<!-- note:observe -->
<!-- /note -->

### <a id="s-recall"></a>`recall(key, now, min=)`

function · **exported** · L42–48

- calls: [`decay`](#s-decay)

<!-- note:recall -->
<!-- /note -->

### <a id="s-track"></a>`track(key, x, at, {…}=)`

function · **exported** · L50–79

- calls: [`trim`](#s-trim)
- called by: [`perceive`](senses.js.md#s-perceive) _js/aria/senses.js_ ×4

<!-- note:track -->
<!-- /note -->

### <a id="s-anchor"></a>`anchor(key, x, at)`

function · **exported** · L81–86

- called by: [`wakeClose`](wake.js.md#s-wakeClose) _js/aria/wake.js_

<!-- note:anchor -->
<!-- /note -->

### <a id="s-trackerOf"></a>`trackerOf(key)`

function · **exported** · L88–91

<!-- note:trackerOf -->
<!-- /note -->

### <a id="s-alertsSince"></a>`alertsSince(now, maxAge=)`

function · **exported** · L93–95

- called by: [`beliefReport`](#s-beliefReport) · [`perceive`](senses.js.md#s-perceive) _js/aria/senses.js_

<!-- note:alertsSince -->
<!-- /note -->

### <a id="s-cellKey"></a>`cellKey(p)`

function · L97–97

- called by: [`markDanger`](#s-markDanger)

<!-- note:cellKey -->
<!-- /note -->

### <a id="s-markDanger"></a>`markDanger(pos, weight, at, name=)`

function · **exported** · L99–106

- calls: [`cellKey`](#s-cellKey) · [`decay`](#s-decay) ×2 · [`trim`](#s-trim)
- called by: [`perceive`](senses.js.md#s-perceive) _js/aria/senses.js_

<!-- note:markDanger -->
<!-- /note -->

### <a id="s-dangers"></a>`dangers(now, min=)`

function · **exported** · L108–116

- calls: [`decay`](#s-decay)
- called by: [`beliefReport`](#s-beliefReport) · [`perceive`](senses.js.md#s-perceive) _js/aria/senses.js_

<!-- note:dangers -->
<!-- /note -->

### <a id="s-beliefReport"></a>`beliefReport(now=)`

function · **exported** · L118–125

- calls: [`alertLine`](#s-alertLine) · [`alertsSince`](#s-alertsSince) · [`dangers`](#s-dangers)

<!-- note:beliefReport -->
<!-- /note -->

### <a id="s-alertLine"></a>`alertLine(a)`

function · **exported** · L127–130

- calls: [`alertLine>f`](#s-alertLine-f) ×2
- called by: [`beliefReport`](#s-beliefReport) · [`perceive`](senses.js.md#s-perceive) _js/aria/senses.js_ · [`react`](senses.js.md#s-react) _js/aria/senses.js_ ×4

<!-- note:alertLine -->
<!-- /note -->

#### <a id="s-alertLine-f"></a>`alertLine>f(v)`

function · L128–128

- called by: [`alertLine`](#s-alertLine) ×2

<!-- note:alertLine>f -->
<!-- /note -->
