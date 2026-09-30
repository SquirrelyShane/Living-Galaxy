# js/station/fabyard.js

[index](../../../README.md) · 129 lines · 10 symbols · 5 imports · 1 importers

## About

<!-- note:@file -->
LIVING GALAXY — the fabrication desk, a station-deck fragment.

`fabPanel(body, st)` → the WORKS tab's lower half: what this port's lines
will build, what a job would cost and consume, and what is on the line now.

Three things it is careful about, all of them because this is the first
surface that spends the pilot's materials rather than their credits:

  IT SHOWS THE BILL BEFORE THE BUTTON. Picking a part plans the job against
  what is actually reachable — this port's locker, plus the hold while you
  are standing on it — and prints what it will consume, what is still
  missing, how long the line takes and the fee. Nothing is spent until ORDER.

  IT SHOWS THE MARGIN. Every line carries what the part is worth against the
  raw ore it eats. Since 0.3.11 nothing on the board is below 1.0x, but the
  spread runs 1.1x to 6.5x and that difference is the whole decision — a
  heat exchanger is worth the trip and a ration pack is not. The warning
  colour stays wired for anything that ever drops under water again.

  A JOB OUTLIVES THE VISIT. Everything lands in the port's LOCKER, never the
  hold, because the line keeps running while you fly. The panel says that
  rather than leaving the pilot to wonder where the parts went.

Built on the console kit, like refityard.js, and kept out of stationdeck.js
because that file sits on the 600-line gate.
<!-- /note -->

## Imports

| line | from | names | target |
|---|---|---|---|
| 1 | `../sim/sim.js` | `sim` | [js/sim/sim.js](../sim/sim.js.md) |
| 2 | `../console/kit.js` | `el`, `row`, `button`, `note`, `section` | [js/console/kit.js](../console/kit.js.md) |
| 3 | `../economy/materials.js` | `goodName` | [js/economy/materials.js](../economy/materials.js.md) |
| 4 | `../corp/company.js` | `hasCompany`, `company` | [js/corp/company.js](../corp/company.js.md) |
| 5 | `../economy/fabricate.js` | `FAB`, `fabMenuAt`, `planJob`, `orderFab`, `cancelFab`, `fabQueueAt`, `canFabAt`, `maxRunnable` | [js/economy/fabricate.js](../economy/fabricate.js.md) |

## Imported by

- [js/station/deckworks.js](deckworks.js.md) — `fabPanel`

## Exports

- [`fabPanel`](#s-fabPanel) · function — used by [js/station/deckworks.js](deckworks.js.md)
- `default` · Identifier — **no importer in scanned roots**

## Effects

_none detected_

## Symbols

### <a id="s-DOC"></a>`DOC`

const · L9–9

<!-- note:DOC -->
<!-- /note -->

### <a id="s-view"></a>`view`

const · L11–11

<!-- note:view -->
what the pilot is looking at, kept across repaints while the deck is open
<!-- /note -->

### <a id="s-LADDER"></a>`LADDER`

const · L13–13

<!-- note:LADDER -->
One button, tapped through, rather than six sitting there taking up the row.
MAX is a MODE and not a number: it is re-read from the stock on every paint,
so picking it once and then loading more ore raises the job instead of
leaving a stale figure on the button.
<!-- /note -->

### <a id="s-n0"></a>`n0(v)`

function · L15–15

- called by: [`build`](#s-build) ×6

<!-- note:n0 -->
<!-- /note -->

### <a id="s-qty2"></a>`qty2(v)`

function · L16–16

- called by: [`build`](#s-build) ×2

<!-- note:qty2 -->
<!-- /note -->

### <a id="s-mins"></a>`mins(s)`

function · L17–17

- called by: [`build`](#s-build) ×3

<!-- note:mins -->
<!-- /note -->

### <a id="s-stockFor"></a>`stockFor(st, by)`

function · L19–25

- called by: [`build`](#s-build)

<!-- note:stockFor -->
Everything a job here could draw on — the locker, plus the hold if you are aboard.
<!-- /note -->

### <a id="s-fabPanel"></a>`fabPanel(body, st)`

function · **exported** · L27–31

- calls: [`fabPanel>paint`](#s-fabPanel-paint)
- called by: [`worksPanel`](deckworks.js.md#s-worksPanel) _js/station/deckworks.js_

<!-- note:fabPanel -->
<!-- /note -->

#### <a id="s-fabPanel-paint"></a>`fabPanel>paint()`

function · L29–29

- calls: [`build`](#s-build)
- called by: [`build`](#s-build) ×6 · [`fabPanel`](#s-fabPanel)

<!-- note:fabPanel>paint -->
<!-- /note -->

### <a id="s-build"></a>`build(body, st, paint)`

function · L33–127

- calls: [`button`](../console/kit.js.md#s-button) _js/console/kit.js_ ×6 · [`el`](../console/kit.js.md#s-el) _js/console/kit.js_ ×2 · [`note`](../console/kit.js.md#s-note) _js/console/kit.js_ ×6 · [`row`](../console/kit.js.md#s-row) _js/console/kit.js_ ×8 · [`section`](../console/kit.js.md#s-section) _js/console/kit.js_ ×4 · [`hasCompany`](../corp/company.js.md#s-hasCompany) _js/corp/company.js_ ×2 · [`cancelFab`](../economy/fabricate.js.md#s-cancelFab) _js/economy/fabricate.js_ · [`canFabAt`](../economy/fabricate.js.md#s-canFabAt) _js/economy/fabricate.js_ ×2 · [`fabMenuAt`](../economy/fabricate.js.md#s-fabMenuAt) _js/economy/fabricate.js_ · [`fabQueueAt`](../economy/fabricate.js.md#s-fabQueueAt) _js/economy/fabricate.js_ · [`maxRunnable`](../economy/fabricate.js.md#s-maxRunnable) _js/economy/fabricate.js_ · [`orderFab`](../economy/fabricate.js.md#s-orderFab) _js/economy/fabricate.js_ · [`planJob`](../economy/fabricate.js.md#s-planJob) _js/economy/fabricate.js_ · [`goodName`](../economy/materials.js.md#s-goodName) _js/economy/materials.js_ ×6 · [`fabPanel>paint`](#s-fabPanel-paint) ×6 · [`mins`](#s-mins) ×3 · [`n0`](#s-n0) ×6 · [`qty2`](#s-qty2) ×2 · [`stockFor`](#s-stockFor)
- via [js/economy/materials.js](../economy/materials.js.md): `goodName.toUpperCase`
- called by: [`fabPanel>paint`](#s-fabPanel-paint)

<!-- note:build -->
- L41 · `const running = fabQueueAt(st.id);` — ---- what is on the line now ----
- L58 · `const menu = fabMenuAt(st);` — ---- the menu ----
- L67 · `if (m.ratio < 1) r.value.classList?.add?.("warn");` — add("") throws
- L78 · `const by = view.by === "company" && hasCompany() ? "company" : "player";` — ---- the quote ----
- L82 · `const qty = rung === "max" ? Math.max(1, most) : rung;` — MAX with nothing to build from still quotes ONE, so the panel can show the
  shopping list rather than an empty job with nothing to explain it.
<!-- /note -->
