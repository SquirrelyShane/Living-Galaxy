# js/ui/charts.js

[index](../../../README.md) · 114 lines · 10 symbols · 0 imports · 2 importers

## About

<!-- note:@file -->
LIVING GALAXY — passive charts.

Small inline SVG, no library: a sparkline for anything that moves over
time, a pentagon radar for the five temperament axes, a ring for a single
fraction. They are readouts, not controls — they never take pointer events
and they redraw in place when given new values.
<!-- /note -->

## Imports

_none_

## Imported by

- [js/console/panels/ship.js](../console/panels/ship.js.md) — `ring`, `sparkline`
- [js/station/deckhall.js](../station/deckhall.js.md) — `radar`, `traitAxes`

## Exports

- [`sparkline`](#s-sparkline) · function — used by [js/console/panels/ship.js](../console/panels/ship.js.md)
- [`radar`](#s-radar) · function — used by [js/station/deckhall.js](../station/deckhall.js.md)
- [`ring`](#s-ring) · function — used by [js/console/panels/ship.js](../console/panels/ship.js.md)
- [`traitAxes`](#s-traitAxes) · function — used by [js/station/deckhall.js](../station/deckhall.js.md)

## Effects

- **dom.create** — `div` (sparkline:19) · `span` (sparkline:21) · `b` (sparkline:23)

## Symbols

### <a id="s-NS"></a>`NS`

const · L1–1

<!-- note:NS -->
<!-- /note -->

### <a id="s-svg"></a>`svg(tag, attrs=)`

function · L3–7

- called by: [`radar`](#s-radar) ×5 · [`ring`](#s-ring) ×4 · [`sparkline`](#s-sparkline) ×4

<!-- note:svg -->
<!-- /note -->

### <a id="s-sparkline"></a>`sparkline(host, values=, spec=)`

function · **exported** · L9–44

- calls: [`sparkline>update`](#s-sparkline-update) · [`svg`](#s-svg) ×4
- called by: [`telemetryBlock`](../console/panels/ship.js.md#s-telemetryBlock) _js/console/panels/ship.js_ ×4
- effects: dom.create `div` · dom.create `span` · dom.create `b`

<!-- note:sparkline -->
Sparkline. `values` newest last.
@param host element; @param spec { w, h, min, max, tone, fill, label, format }
Returns { update(values) }.
<!-- /note -->

#### <a id="s-sparkline-update"></a>`sparkline>update(vals)`

function · L28–41

- called by: [`sparkline`](#s-sparkline)

<!-- note:sparkline>update -->
<!-- /note -->

### <a id="s-radar"></a>`radar(host, axes=, spec=)`

function · **exported** · L46–79

- calls: [`radar>pt`](#s-radar-pt) ×3 · [`radar>update`](#s-radar-update) · [`svg`](#s-svg) ×5
- called by: [`hallSection`](../station/deckhall.js.md#s-hallSection) _js/station/deckhall.js_

<!-- note:radar -->
Pentagon radar. `axes`: [{ label, value 0..1 }] (any count ≥ 3).
<!-- /note -->

#### <a id="s-radar-pt"></a>`radar>pt(i, r)`

function · L54–57

- called by: [`radar`](#s-radar) ×3 · [`radar>update`](#s-radar-update)

<!-- note:radar>pt -->
<!-- /note -->

#### <a id="s-radar-update"></a>`radar>update(ax)`

function · L74–76

- calls: [`radar>pt`](#s-radar-pt)
- called by: [`radar`](#s-radar)

<!-- note:radar>update -->
<!-- /note -->

### <a id="s-ring"></a>`ring(host, value=, spec=)`

function · **exported** · L81–103

- calls: [`ring>update`](#s-ring-update) · [`svg`](#s-svg) ×4
- called by: [`telemetryBlock`](../console/panels/ship.js.md#s-telemetryBlock) _js/console/panels/ship.js_ ×4

<!-- note:ring -->
Ring gauge: a fraction with a label inside.
<!-- /note -->

#### <a id="s-ring-update"></a>`ring>update(v)`

function · L95–100

- called by: [`ring`](#s-ring)

<!-- note:ring>update -->
- L99 · `if (spec.warnLow) host.dataset.level = f < 0.25 ? "low" : f < 0.6 ? "mid" : "high";` — only gauges that are bad when empty (hull, charge) go red at the bottom
<!-- /note -->

### <a id="s-traitAxes"></a>`traitAxes(rec)`

function · **exported** · L105–114

- called by: [`hallSection`](../station/deckhall.js.md#s-hallSection) _js/station/deckhall.js_ ×2

<!-- note:traitAxes -->
Five temperament axes from a CRADLE record, in radar form.
<!-- /note -->
