# js/aria/footprint.js

[index](../../../README.md) · 126 lines · 13 symbols · 0 imports · 4 importers

## About

<!-- note:@file -->
<!-- /note -->

## Imports

_none_

## Imported by

- [js/aria/aria.js](aria.js.md) — `footprintReport`, `footprintLine`
- [js/aria/play.js](play.js.md) — `footprintLine`, `footprintReport`
- [js/aria/wake.js](wake.js.md) — `footprint`, `noteTrade`, `noteWork`, `audit`, `footprintIn`, `footprintOut`, `resetFootprint`
- [js/console/panels/aria-core.js](../console/panels/aria-core.js.md) — `footprint`, `footprintReport`, `footprintLine`

## Exports

- [`FOOT`](#s-FOOT) · const — **no importer in scanned roots**
- [`footprint`](#s-footprint) · const — used by [js/aria/wake.js](wake.js.md), [js/console/panels/aria-core.js](../console/panels/aria-core.js.md)
- [`resetFootprint`](#s-resetFootprint) · function — used by [js/aria/wake.js](wake.js.md)
- [`footprintOut`](#s-footprintOut) · function — used by [js/aria/wake.js](wake.js.md)
- [`footprintIn`](#s-footprintIn) · function — used by [js/aria/wake.js](wake.js.md)
- [`noteTrade`](#s-noteTrade) · function — used by [js/aria/wake.js](wake.js.md)
- [`noteWork`](#s-noteWork) · function — used by [js/aria/wake.js](wake.js.md)
- [`audit`](#s-audit) · function — used by [js/aria/wake.js](wake.js.md)
- [`footprintReport`](#s-footprintReport) · function — used by [js/aria/aria.js](aria.js.md), [js/aria/play.js](play.js.md), [js/console/panels/aria-core.js](../console/panels/aria-core.js.md)
- [`footprintLine`](#s-footprintLine) · function — used by [js/aria/aria.js](aria.js.md), [js/aria/play.js](play.js.md), [js/console/panels/aria-core.js](../console/panels/aria-core.js.md)

## Effects

_none detected_

## Symbols

### <a id="s-FOOT"></a>`FOOT`

const · **exported** · L1–1

<!-- note:FOOT -->
<!-- /note -->

### <a id="s-fresh"></a>`fresh()`

function · L3–12

- called by: [`footprint`](#s-footprint) · [`resetFootprint`](#s-resetFootprint)

<!-- note:fresh -->
<!-- /note -->

### <a id="s-footprint"></a>`footprint`

const · **exported** · L14–14

- calls: [`fresh`](#s-fresh)

<!-- note:footprint -->
<!-- /note -->

### <a id="s-resetFootprint"></a>`resetFootprint()`

function · **exported** · L16–16

- calls: [`fresh`](#s-fresh)
- called by: [`footprintIn`](#s-footprintIn) · [`wakeReset`](wake.js.md#s-wakeReset) _js/aria/wake.js_

<!-- note:resetFootprint -->
<!-- /note -->

### <a id="s-footprintOut"></a>`footprintOut()`

function · **exported** · L18–18

- called by: [`wakeSave`](wake.js.md#s-wakeSave) _js/aria/wake.js_

<!-- note:footprintOut -->
<!-- /note -->

### <a id="s-footprintIn"></a>`footprintIn(saved)`

function · **exported** · L20–28

- calls: [`resetFootprint`](#s-resetFootprint)
- called by: [`wakeLoad`](wake.js.md#s-wakeLoad) _js/aria/wake.js_

<!-- note:footprintIn -->
<!-- /note -->

### <a id="s-event"></a>`event(at, kind, text)`

function · L30–33

- called by: [`audit`](#s-audit) ×2 · [`noteTrade`](#s-noteTrade) · [`noteWork`](#s-noteWork)

<!-- note:event -->
<!-- /note -->

### <a id="s-portOf"></a>`portOf(id, name)`

function · L35–44

- called by: [`noteTrade`](#s-noteTrade)

<!-- note:portOf -->
<!-- /note -->

### <a id="s-noteTrade"></a>`noteTrade({…})`

function · **exported** · L46–75

- calls: [`event`](#s-event) · [`portOf`](#s-portOf)
- called by: [`wakeClose`](wake.js.md#s-wakeClose) _js/aria/wake.js_

<!-- note:noteTrade -->
<!-- /note -->

### <a id="s-noteWork"></a>`noteWork({…})`

function · **exported** · L77–82

- calls: [`event`](#s-event)
- called by: [`wakeJobClose`](wake.js.md#s-wakeJobClose) _js/aria/wake.js_

<!-- note:noteWork -->
<!-- /note -->

### <a id="s-audit"></a>`audit(now, lineState)`

function · **exported** · L84–99

- calls: [`event`](#s-event) ×2
- called by: [`wakeAudit`](wake.js.md#s-wakeAudit) _js/aria/wake.js_

<!-- note:audit -->
<!-- /note -->

### <a id="s-footprintReport"></a>`footprintReport()`

function · **exported** · L101–115

- called by: [`wireAria`](aria.js.md#s-wireAria) _js/aria/aria.js_ · [`playReport`](play.js.md#s-playReport) _js/aria/play.js_ · [`mountCore>draw`](../console/panels/aria-core.js.md#s-mountCore-draw) _js/console/panels/aria-core.js_

<!-- note:footprintReport -->
<!-- /note -->

### <a id="s-footprintLine"></a>`footprintLine()`

function · **exported** · L117–126

- called by: [`ariaWatchReport`](aria.js.md#s-ariaWatchReport) _js/aria/aria.js_ · [`wireAria`](aria.js.md#s-wireAria) _js/aria/aria.js_ · [`playReport`](play.js.md#s-playReport) _js/aria/play.js_ · [`mountCore>draw`](../console/panels/aria-core.js.md#s-mountCore-draw) _js/console/panels/aria-core.js_

<!-- note:footprintLine -->
<!-- /note -->
