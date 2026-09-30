# js/console/panels/crew-sky.js

[index](../../../../README.md) · 127 lines · 11 symbols · 5 imports · 1 importers

## About

<!-- note:@file -->
Living Galaxy — CONSOLE › CREW › SKY: the other hundred and sixty watches.

Every hull on the board has people on it now. This is where you read them:
nearest first, what kind of run they are on, how the watch is holding up,
how far behind the hull's maintenance is, and — for the ones close enough
to overhear — the last thing their deck actually decided and why.

It is a listening post, not a control panel. Nothing here gives orders to
another ship's crew; the only thing you can do about a sour watch is dock
where they are about to walk off and be the better berth.
<!-- /note -->

## Imports

| line | from | names | target |
|---|---|---|---|
| 1 | `../kit.js` | `el`, `section`, `note`, `row`, `button`, `chips`, `setBar`, `card` | [js/console/kit.js](../kit.js.md) |
| 2 | `../../sim/sim.js` | `sim` | [js/sim/sim.js](../../sim/sim.js.md) |
| 3 | `../../npc/traffic.js` | `traffic` | [js/npc/traffic.js](../../npc/traffic.js.md) |
| 4 | `../../npc/npccrew.js` | `npcCrews`, `moodOf`, `vesselJournal`, `NEAR_U`, `DESERT_AT`, `STRIKE_AT`, `WORK_BUDGET` | [js/npc/npccrew.js](../../npc/npccrew.js.md) |
| 5 | `../kit.js` | `fmtDist` | [js/console/kit.js](../kit.js.md) |

## Imported by

- [js/console/panels/crew.js](crew.js.md) — `mountSky`

## Exports

- [`mountSky`](#s-mountSky) · function — used by [js/console/panels/crew.js](crew.js.md)
- [`skyView`](#s-view) — **no importer in scanned roots**

## Effects

_none detected_

## Symbols

### <a id="s-view"></a>`view`

const · **exported** · L7–7

<!-- note:view -->
<!-- /note -->

### <a id="s-FILTERS"></a>`FILTERS`

const · L9–14

<!-- note:FILTERS -->
<!-- /note -->

### <a id="s-moodTone"></a>`moodTone(m)`

function · L16–16

- called by: [`vesselCard`](#s-vesselCard)

<!-- note:moodTone -->
<!-- /note -->

### <a id="s-moodWord"></a>`moodWord(m)`

function · L17–17

- called by: [`vesselCard`](#s-vesselCard)

<!-- note:moodWord -->
<!-- /note -->

### <a id="s-distOf"></a>`distOf(v)`

function · L19–23

- called by: [`rows`](#s-rows)

<!-- note:distOf -->
<!-- /note -->

### <a id="s-rows"></a>`rows()`

function · L25–36

- calls: [`distOf`](#s-distOf) · [`moodOf`](../../npc/npccrew.js.md#s-moodOf) _js/npc/npccrew.js_
- via [js/npc/traffic.js](../../npc/traffic.js.md): `traffic.filter`
- called by: [`mountSky>paint`](#s-mountSky-paint)

<!-- note:rows -->
<!-- /note -->

### <a id="s-vesselCard"></a>`vesselCard(e, rebuild)`

function · L38–82

- calls: [`button`](../kit.js.md#s-button) _js/console/kit.js_ · [`card`](../kit.js.md#s-card) _js/console/kit.js_ · [`el`](../kit.js.md#s-el) _js/console/kit.js_ ×9 · [`fmtDist`](../kit.js.md#s-fmtDist) _js/console/kit.js_ · [`note`](../kit.js.md#s-note) _js/console/kit.js_ ×2 · [`row`](../kit.js.md#s-row) _js/console/kit.js_ ×3 · [`setBar`](../kit.js.md#s-setBar) _js/console/kit.js_ ×2 · [`moodTone`](#s-moodTone) · [`moodWord`](#s-moodWord) · [`mountSky>rebuild`](#s-mountSky-rebuild) · [`vesselJournal`](../../npc/npccrew.js.md#s-vesselJournal) _js/npc/npccrew.js_
- called by: [`mountSky>paint`](#s-mountSky-paint)

<!-- note:vesselCard -->
<!-- /note -->

### <a id="s-mountSky"></a>`mountSky(root, ctx)`

function · **exported** · L84–125

- calls: [`chips`](../kit.js.md#s-chips) _js/console/kit.js_ · [`el`](../kit.js.md#s-el) _js/console/kit.js_ ×2 · [`note`](../kit.js.md#s-note) _js/console/kit.js_ · [`row`](../kit.js.md#s-row) _js/console/kit.js_ ×2 · [`section`](../kit.js.md#s-section) _js/console/kit.js_ ×3
- called by: [`mount`](crew.js.md#s-mount) _js/console/panels/crew.js_

<!-- note:mountSky -->
<!-- /note -->

#### <a id="s-mountSky-onPick"></a>`mountSky.onPick(id)`

prop · L92–92

- calls: [`mountSky>paint`](#s-mountSky-paint)

<!-- note:mountSky.onPick -->
<!-- /note -->

#### <a id="s-mountSky-rebuild"></a>`mountSky>rebuild()`

function · L103–103

- calls: [`mountSky>paint`](#s-mountSky-paint)
- called by: [`vesselCard`](#s-vesselCard)

<!-- note:mountSky>rebuild -->
<!-- /note -->

#### <a id="s-mountSky-paint"></a>`mountSky>paint()`

function · L104–123

- calls: [`el`](../kit.js.md#s-el) _js/console/kit.js_ ×6 · [`rows`](#s-rows) · [`vesselCard`](#s-vesselCard)
- via [js/npc/npccrew.js](../../npc/npccrew.js.md): `npcCrews.events.slice`
- called by: [`mountSky.onPick`](#s-mountSky-onPick) · [`mountSky>rebuild`](#s-mountSky-rebuild)

<!-- note:mountSky>paint -->
<!-- /note -->
