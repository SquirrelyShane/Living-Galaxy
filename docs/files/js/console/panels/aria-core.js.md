# js/console/panels/aria-core.js

[index](../../../../README.md) · 77 lines · 3 symbols · 4 imports · 1 importers

## About

<!-- note:@file -->
<!-- /note -->

## Imports

| line | from | names | target |
|---|---|---|---|
| 1 | `../kit.js` | `el`, `section`, `row`, `note`, `button` | [js/console/kit.js](../kit.js.md) |
| 2 | `../../aria/mind.js` | `ariaMind`, `setOrders`, `personMemory`, `explanationPacket`, `calibReport` | [js/aria/mind.js](../../aria/mind.js.md) |
| 3 | `../../aria/footprint.js` | `footprint`, `footprintReport`, `footprintLine` | [js/aria/footprint.js](../../aria/footprint.js.md) |
| 4 | `../../aria/aria.js` | `saveAria` | [js/aria/aria.js](../../aria/aria.js.md) |

## Imported by

- [js/console/panels/nav.js](nav.js.md) — `mountCore`

## Exports

- [`mountCore`](#s-mountCore) · function — used by [js/console/panels/nav.js](nav.js.md)

## Effects

- **event.listen** — `change on input → (inline)` (mountCore:54, mountCore:60) · `change on mode → (inline)` (mountCore:58) · `change on avoid → (inline)` (mountCore:61) · `change on c → (inline)` (mountCore:67)

## Symbols

### <a id="s-mountCore"></a>`mountCore(root)`

function · **exported** · L6–77

- calls: [`saveAria`](../../aria/aria.js.md#s-saveAria) _js/aria/aria.js_ ×5 · [`explanationPacket`](../../aria/mind.js.md#s-explanationPacket) _js/aria/mind.js_ · [`personMemory`](../../aria/mind.js.md#s-personMemory) _js/aria/mind.js_ · [`setOrders`](../../aria/mind.js.md#s-setOrders) _js/aria/mind.js_ ×4 · [`button`](../kit.js.md#s-button) _js/console/kit.js_ ×2 · [`el`](../kit.js.md#s-el) _js/console/kit.js_ ×7 · [`note`](../kit.js.md#s-note) _js/console/kit.js_ ×5 · [`row`](../kit.js.md#s-row) _js/console/kit.js_ ×8 · [`section`](../kit.js.md#s-section) _js/console/kit.js_ ×6 · [`mountCore>draw`](#s-mountCore-draw) ×2
- via [js/aria/mind.js](../../aria/mind.js.md): `ariaMind.episodes.slice`, `ariaMind.episodes.slice.reverse`, `ariaMind.pending.filter`
- via [js/console/kit.js](../kit.js.md): `row.value.append`
- called by: [`mount`](nav.js.md#s-mount) _js/console/panels/nav.js_
- effects: event.listen `change`

<!-- note:mountCore -->
- L10 · `let shown = null;` — The console paints every frame. The readout is rebuilt only when what it
  shows has changed — on a phone a dozen rows a frame was most of the panel's
  cost, and it took the text selection with it.
<!-- /note -->

#### <a id="s-mountCore-pct"></a>`mountCore>pct(v)`

function · L11–11

- called by: [`mountCore>draw`](#s-mountCore-draw) ×5

<!-- note:mountCore>pct -->
<!-- /note -->

#### <a id="s-mountCore-draw"></a>`mountCore>draw(force=)`

function · L12–49

- calls: [`footprintLine`](../../aria/footprint.js.md#s-footprintLine) _js/aria/footprint.js_ · [`footprintReport`](../../aria/footprint.js.md#s-footprintReport) _js/aria/footprint.js_ · [`calibReport`](../../aria/mind.js.md#s-calibReport) _js/aria/mind.js_ · [`el`](../kit.js.md#s-el) _js/console/kit.js_ ×3 · [`row`](../kit.js.md#s-row) _js/console/kit.js_ ×20 · [`mountCore>pct`](#s-mountCore-pct) ×5
- via [js/aria/mind.js](../../aria/mind.js.md): `ariaMind.pending.map`, `ariaMind.pending.map.join`
- called by: [`mountCore`](#s-mountCore) ×2

<!-- note:mountCore>draw -->
<!-- /note -->
