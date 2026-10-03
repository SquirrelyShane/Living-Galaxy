# js/console/panels/aria-core.js

[index](../../../../README.md) · 47 lines · 2 symbols · 3 imports · 1 importers

## About

<!-- note:@file -->
<!-- /note -->

## Imports

| line | from | names | target |
|---|---|---|---|
| 1 | `../kit.js` | `el`, `section`, `row`, `note`, `button` | [js/console/kit.js](../kit.js.md) |
| 2 | `../../aria/mind.js` | `ariaMind`, `setOrders`, `personMemory`, `explanationPacket` | [js/aria/mind.js](../../aria/mind.js.md) |
| 3 | `../../aria/aria.js` | `saveAria` | [js/aria/aria.js](../../aria/aria.js.md) |

## Imported by

- [js/console/panels/nav.js](nav.js.md) — `mountCore`

## Exports

- [`mountCore`](#s-mountCore) · function — used by [js/console/panels/nav.js](nav.js.md)

## Effects

- **event.listen** — `change on input → (inline)` (mountCore:27) · `change on mode → (inline)` (mountCore:31) · `change on avoid → (inline)` (mountCore:32) · `change on c → (inline)` (mountCore:37)

## Symbols

### <a id="s-mountCore"></a>`mountCore(root)`

function · **exported** · L5–47

- calls: [`saveAria`](../../aria/aria.js.md#s-saveAria) _js/aria/aria.js_ ×4 · [`explanationPacket`](../../aria/mind.js.md#s-explanationPacket) _js/aria/mind.js_ · [`personMemory`](../../aria/mind.js.md#s-personMemory) _js/aria/mind.js_ · [`setOrders`](../../aria/mind.js.md#s-setOrders) _js/aria/mind.js_ ×3 · [`button`](../kit.js.md#s-button) _js/console/kit.js_ ×2 · [`el`](../kit.js.md#s-el) _js/console/kit.js_ ×6 · [`note`](../kit.js.md#s-note) _js/console/kit.js_ ×4 · [`row`](../kit.js.md#s-row) _js/console/kit.js_ ×7 · [`section`](../kit.js.md#s-section) _js/console/kit.js_ ×4 · [`mountCore>draw`](#s-mountCore-draw) ×2
- via [js/aria/mind.js](../../aria/mind.js.md): `ariaMind.episodes.slice`, `ariaMind.episodes.slice.reverse`, `ariaMind.pending.filter`
- via [js/console/kit.js](../kit.js.md): `row.value.append`
- called by: [`mount`](nav.js.md#s-mount) _js/console/panels/nav.js_
- effects: event.listen `change`

<!-- note:mountCore -->
- L7 · `let shown = null;` — The console paints every frame. The readout is rebuilt only when what it
  shows has changed — on a phone a dozen rows a frame was most of the panel's
  cost, and it took the text selection with it.
<!-- /note -->

#### <a id="s-mountCore-draw"></a>`mountCore>draw(force=)`

function · L8–22

- calls: [`el`](../kit.js.md#s-el) _js/console/kit.js_ · [`row`](../kit.js.md#s-row) _js/console/kit.js_ ×7
- via [js/aria/mind.js](../../aria/mind.js.md): `ariaMind.pending.map`, `ariaMind.pending.map.join`
- called by: [`mountCore`](#s-mountCore) ×2

<!-- note:mountCore>draw -->
<!-- /note -->
