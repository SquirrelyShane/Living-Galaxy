# js/ui/secbadge.js

[index](../../../README.md) · 105 lines · 6 symbols · 3 imports · 1 importers

## About

<!-- note:@file -->
LIVING GALAXY — the security ◆ on the HUD (0.3.48).

A small diamond in the brand pill, top left: green SAFE, yellow IN COMBAT,
red WANTED (js/corp/seclevel.js decides which). Tap it for the card: who polices
this sky, why you are the colour you are, SOS when it is open (and the
reason when it is not), the live response clock once you have called, and
the fine when you are carrying heat and docked somewhere honest.
<!-- /note -->

## Imports

| line | from | names | target |
|---|---|---|---|
| 1 | `../sim/sim.js` | `sim` | [js/sim/sim.js](../sim/sim.js.md) |
| 2 | `../corp/seclevel.js` | `secLevel`, `callSOS`, `payFine`, `SEC`, `LEVELS`, `BOUNTY` | [js/corp/seclevel.js](../corp/seclevel.js.md) |
| 3 | `../audio/index.js` | `UI` | [js/audio/index.js](../audio/index.js.md) |

## Imported by

- [js/ui/hud.js](hud.js.md) — `mountSecBadge`

## Exports

- [`mountSecBadge`](#s-mountSecBadge) · function — used by [js/ui/hud.js](hud.js.md)

## Effects

- **dom.create** — `‹tag›` (mk:6)
- **dom.query** — `#hud .hud-brand` (mountSecBadge:11) · `#station-deck .sd-head > div` (mountSecBadge:33)
- **event.listen** — `click on b → (inline)` (mountSecBadge>makeBadge:23) · `pointerdown on b → (inline)` (mountSecBadge>makeBadge:24) · `pointerdown on card → (inline)` (mountSecBadge:39) · `click on x → (inline)` (mountSecBadge>build:48) · `click on sos → (inline)` (mountSecBadge>build:66) · `click on fine → (inline)` (mountSecBadge>build:77)

## Symbols

### <a id="s-DOC"></a>`DOC`

const · L5–5

<!-- note:DOC -->
<!-- /note -->

### <a id="s-mk"></a>`mk(tag, cls, text)`

function · L6–6

- called by: [`mountSecBadge`](#s-mountSecBadge) · [`mountSecBadge>build`](#s-mountSecBadge-build) ×15 · [`mountSecBadge>makeBadge`](#s-mountSecBadge-makeBadge) ×3
- effects: dom.create `‹tag›`

<!-- note:mk -->
<!-- /note -->

### <a id="s-mins"></a>`mins(s)`

function · L7–7

- called by: [`mountSecBadge>build`](#s-mountSecBadge-build) ×2

<!-- note:mins -->
<!-- /note -->

### <a id="s-mountSecBadge"></a>`mountSecBadge()`

function · **exported** · L9–105

- calls: [`secLevel`](../corp/seclevel.js.md#s-secLevel) _js/corp/seclevel.js_ · [`mk`](#s-mk) · [`mountSecBadge>build`](#s-mountSecBadge-build) · [`mountSecBadge>makeBadge`](#s-mountSecBadge-makeBadge) ×2
- called by: [`mountHud`](hud.js.md#s-mountHud) _js/ui/hud.js_
- effects: dom.query `#hud .hud-brand` · dom.query `#station-deck .sd-head > div` · event.listen `pointerdown`

<!-- note:mountSecBadge -->
- L13 · `const badges = [];` — two faces of one diamond: the HUD's, and the station deck's — docked, the
  deck covers the HUD, and that is exactly where PAY FINE lives
<!-- /note -->

#### <a id="s-mountSecBadge-makeBadge"></a>`mountSecBadge>makeBadge(host, id)`

function · L14–27

- calls: [`mk`](#s-mk) ×3
- via [js/audio/index.js](../audio/index.js.md): `UI.press`
- called by: [`mountSecBadge`](#s-mountSecBadge) ×2
- effects: event.listen `click` · event.listen `pointerdown`

<!-- note:mountSecBadge>makeBadge -->
<!-- /note -->

#### <a id="s-mountSecBadge-build"></a>`mountSecBadge>build(lv)`

function · L41–86

- calls: [`callSOS`](../corp/seclevel.js.md#s-callSOS) _js/corp/seclevel.js_ · [`payFine`](../corp/seclevel.js.md#s-payFine) _js/corp/seclevel.js_ · [`mins`](#s-mins) ×2 · [`mk`](#s-mk) ×15
- called by: [`mountSecBadge`](#s-mountSecBadge)
- effects: event.listen `click`

<!-- note:mountSecBadge>build -->
<!-- /note -->
