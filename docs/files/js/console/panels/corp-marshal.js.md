# js/console/panels/corp-marshal.js

[index](../../../../README.md) · 100 lines · 7 symbols · 6 imports · 1 importers

## About

<!-- note:@file -->
Living Galaxy — CONSOLE › CORP › MARSHAL: the bounty board.

Every mark here is wanted alive and belongs to somebody. The board shows
both halves of the arithmetic before you sign anything: what the ticket pays,
and whose standing it costs. Taking one is a job; taking four off the same
desk is picking a side.
<!-- /note -->

## Imports

| line | from | names | target |
|---|---|---|---|
| 1 | `../kit.js` | `el`, `section`, `note`, `row`, `button`, `group`, `chips`, `setBar`, `card` | [js/console/kit.js](../kit.js.md) |
| 2 | `../../sim/sim.js` | `sim` | [js/sim/sim.js](../../sim/sim.js.md) |
| 3 | `../../station/stations.js` | `stationById` | [js/station/stations.js](../../station/stations.js.md) |
| 4 | `../../corp/corps.js` | `corpById`, `standingLabel` | [js/corp/corps.js](../../corp/corps.js.md) |
| 5 | `../../npc/bounty.js` | `bounty`, `boardAt`, `takeTicket`, `abandonTicket`, `ticketsHeld`, `attemptCapture`, `canAttempt`, `captureStrength`, `markStrength`, `brigBerths`, `tickPlayerPrice`, `LIFT_COST` | [js/npc/bounty.js](../../npc/bounty.js.md) |
| 6 | `../../interior/boarding.js` | `boarding` | [js/interior/boarding.js](../../interior/boarding.js.md) |

## Imported by

- [js/console/panels/corp.js](corp.js.md) — `mountMarshal`

## Exports

- [`mountMarshal`](#s-mountMarshal) · function — used by [js/console/panels/corp.js](corp.js.md)
- [`marshalView`](#s-view) — **no importer in scanned roots**

## Effects

_none detected_

## Symbols

### <a id="s-view"></a>`view`

const · **exported** · L8–8

<!-- note:view -->
<!-- /note -->

### <a id="s-TIER_CLS"></a>`TIER_CLS`

const · L9–9

<!-- note:TIER_CLS -->
<!-- /note -->

### <a id="s-mountMarshal"></a>`mountMarshal(root, ctx)`

function · **exported** · L11–65

- calls: [`chips`](../kit.js.md#s-chips) _js/console/kit.js_ · [`el`](../kit.js.md#s-el) _js/console/kit.js_ · [`row`](../kit.js.md#s-row) _js/console/kit.js_ ×4 · [`section`](../kit.js.md#s-section) _js/console/kit.js_
- called by: [`SUBS.marshal`](corp.js.md#s-SUBS-marshal) _js/console/panels/corp.js_

<!-- note:mountMarshal -->
<!-- /note -->

#### <a id="s-mountMarshal-onPick"></a>`mountMarshal.onPick(v)`

prop · L21–21

- calls: [`mountMarshal>paint`](#s-mountMarshal-paint)

<!-- note:mountMarshal.onPick -->
<!-- /note -->

#### <a id="s-mountMarshal-rebuild"></a>`mountMarshal>rebuild()`

function · L26–26

- calls: [`mountMarshal>paint`](#s-mountMarshal-paint)
- called by: [`markCard`](#s-markCard) ×3

<!-- note:mountMarshal>rebuild -->
<!-- /note -->

#### <a id="s-mountMarshal-paint"></a>`mountMarshal>paint()`

function · L27–63

- calls: [`el`](../kit.js.md#s-el) _js/console/kit.js_ ×7 · [`note`](../kit.js.md#s-note) _js/console/kit.js_ · [`section`](../kit.js.md#s-section) _js/console/kit.js_ · [`markCard`](#s-markCard) ×2 · [`boardAt`](../../npc/bounty.js.md#s-boardAt) _js/npc/bounty.js_ · [`brigBerths`](../../npc/bounty.js.md#s-brigBerths) _js/npc/bounty.js_ · [`ticketsHeld`](../../npc/bounty.js.md#s-ticketsHeld) _js/npc/bounty.js_ · [`tickPlayerPrice`](../../npc/bounty.js.md#s-tickPlayerPrice) _js/npc/bounty.js_ · [`stationById`](../../station/stations.js.md#s-stationById) _js/station/stations.js_
- via [js/npc/bounty.js](../../npc/bounty.js.md): `bounty.log.slice`
- called by: [`mountMarshal.onPick`](#s-mountMarshal-onPick) · [`mountMarshal>rebuild`](#s-mountMarshal-rebuild)

<!-- note:mountMarshal>paint -->
<!-- /note -->

### <a id="s-markCard"></a>`markCard(m, rebuild, mine)`

function · L67–98

- calls: [`button`](../kit.js.md#s-button) _js/console/kit.js_ ×3 · [`card`](../kit.js.md#s-card) _js/console/kit.js_ · [`group`](../kit.js.md#s-group) _js/console/kit.js_ ×2 · [`note`](../kit.js.md#s-note) _js/console/kit.js_ · [`row`](../kit.js.md#s-row) _js/console/kit.js_ ×5 · [`setBar`](../kit.js.md#s-setBar) _js/console/kit.js_ · [`mountMarshal>rebuild`](#s-mountMarshal-rebuild) ×3 · [`corpById`](../../corp/corps.js.md#s-corpById) _js/corp/corps.js_ · [`standingLabel`](../../corp/corps.js.md#s-standingLabel) _js/corp/corps.js_ · [`abandonTicket`](../../npc/bounty.js.md#s-abandonTicket) _js/npc/bounty.js_ · [`attemptCapture`](../../npc/bounty.js.md#s-attemptCapture) _js/npc/bounty.js_ · [`canAttempt`](../../npc/bounty.js.md#s-canAttempt) _js/npc/bounty.js_ · [`captureStrength`](../../npc/bounty.js.md#s-captureStrength) _js/npc/bounty.js_ · [`markStrength`](../../npc/bounty.js.md#s-markStrength) _js/npc/bounty.js_ · [`takeTicket`](../../npc/bounty.js.md#s-takeTicket) _js/npc/bounty.js_
- called by: [`mountMarshal>paint`](#s-mountMarshal-paint) ×2

<!-- note:markCard -->
<!-- /note -->
