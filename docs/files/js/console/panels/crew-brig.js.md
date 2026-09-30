# js/console/panels/crew-brig.js

[index](../../../../README.md) · 120 lines · 7 symbols · 7 imports · 1 importers

## About

<!-- note:@file -->
Living Galaxy — CONSOLE › CREW › BRIG.

Whoever you took, and what you are doing about them. Two bars that move in
opposite directions if you are careless: how far they are from giving you
anything, and what they make of you. Everything on the humane side moves
both the right way, slowly. Everything on the hard side buys the first with
the second — which is fine if you only ever wanted the ticket cashed.
<!-- /note -->

## Imports

| line | from | names | target |
|---|---|---|---|
| 1 | `../kit.js` | `el`, `section`, `note`, `row`, `button`, `group`, `chips`, `setBar`, `card` | [js/console/kit.js](../kit.js.md) |
| 2 | `../../sim/sim.js` | `sim` | [js/sim/sim.js](../../sim/sim.js.md) |
| 3 | `../../crew/ledger.js` | `genderMark` | [js/crew/ledger.js](../../crew/ledger.js.md) |
| 4 | `../../interior/boarding.js` | `boarding` | [js/interior/boarding.js](../../interior/boarding.js.md) |
| 5 | `../../corp/corps.js` | `corpById` | [js/corp/corps.js](../../corp/corps.js.md) |
| 6 | `../../crew/captive.js` | `captives`, `INTERACTIONS`, `canInteract`, `interact`, `canRecruit`, `recruit`, `guardStrength`, `RESIST_WORD`, `REGARD_WORD`, `RECRUIT_RESISTANCE`, `RECRUIT_REGARD` | [js/crew/captive.js](../../crew/captive.js.md) |
| 7 | `../../npc/bounty.js` | `deliver`, `release`, `ransom`, `brigBerths` | [js/npc/bounty.js](../../npc/bounty.js.md) |

## Imported by

- [js/console/panels/crew.js](crew.js.md) — `mountBrig`

## Exports

- [`mountBrig`](#s-mountBrig) · function — used by [js/console/panels/crew.js](crew.js.md)
- [`brigView`](#s-view) — **no importer in scanned roots**

## Effects

_none detected_

## Symbols

### <a id="s-view"></a>`view`

const · **exported** · L9–9

<!-- note:view -->
<!-- /note -->

### <a id="s-mountBrig"></a>`mountBrig(root, ctx)`

function · **exported** · L11–42

- calls: [`el`](../kit.js.md#s-el) _js/console/kit.js_ · [`note`](../kit.js.md#s-note) _js/console/kit.js_ · [`row`](../kit.js.md#s-row) _js/console/kit.js_ ×2 · [`section`](../kit.js.md#s-section) _js/console/kit.js_
- called by: [`mount`](crew.js.md#s-mount) _js/console/panels/crew.js_

<!-- note:mountBrig -->
<!-- /note -->

#### <a id="s-mountBrig-rebuild"></a>`mountBrig>rebuild()`

function · L22–22

- calls: [`mountBrig>paint`](#s-mountBrig-paint)
- called by: [`actionRow`](#s-actionRow) · [`captiveCard`](#s-captiveCard) ×5 · [`captiveCard.onPick`](#s-captiveCard-onPick)

<!-- note:mountBrig>rebuild -->
<!-- /note -->

#### <a id="s-mountBrig-paint"></a>`mountBrig>paint()`

function · L23–40

- calls: [`el`](../kit.js.md#s-el) _js/console/kit.js_ · [`setBar`](../kit.js.md#s-setBar) _js/console/kit.js_ · [`captiveCard`](#s-captiveCard) · [`captives`](../../crew/captive.js.md#s-captives) _js/crew/captive.js_ · [`guardStrength`](../../crew/captive.js.md#s-guardStrength) _js/crew/captive.js_ · [`brigBerths`](../../npc/bounty.js.md#s-brigBerths) _js/npc/bounty.js_
- called by: [`mountBrig>rebuild`](#s-mountBrig-rebuild)

<!-- note:mountBrig>paint -->
<!-- /note -->

### <a id="s-captiveCard"></a>`captiveCard({…}, rebuild)`

function · L44–100

- calls: [`button`](../kit.js.md#s-button) _js/console/kit.js_ ×5 · [`card`](../kit.js.md#s-card) _js/console/kit.js_ · [`chips`](../kit.js.md#s-chips) _js/console/kit.js_ · [`el`](../kit.js.md#s-el) _js/console/kit.js_ ×7 · [`group`](../kit.js.md#s-group) _js/console/kit.js_ · [`note`](../kit.js.md#s-note) _js/console/kit.js_ · [`row`](../kit.js.md#s-row) _js/console/kit.js_ ×4 · [`setBar`](../kit.js.md#s-setBar) _js/console/kit.js_ ×3 · [`actionRow`](#s-actionRow) ×2 · [`mountBrig>rebuild`](#s-mountBrig-rebuild) ×5 · [`corpById`](../../corp/corps.js.md#s-corpById) _js/corp/corps.js_ · [`canRecruit`](../../crew/captive.js.md#s-canRecruit) _js/crew/captive.js_ · [`recruit`](../../crew/captive.js.md#s-recruit) _js/crew/captive.js_ · [`REGARD_WORD`](../../crew/captive.js.md#s-REGARD_WORD) _js/crew/captive.js_ · [`RESIST_WORD`](../../crew/captive.js.md#s-RESIST_WORD) _js/crew/captive.js_ · [`genderMark`](../../crew/ledger.js.md#s-genderMark) _js/crew/ledger.js_ · [`deliver`](../../npc/bounty.js.md#s-deliver) _js/npc/bounty.js_ · [`ransom`](../../npc/bounty.js.md#s-ransom) _js/npc/bounty.js_ · [`release`](../../npc/bounty.js.md#s-release) _js/npc/bounty.js_
- via [js/crew/captive.js](../../crew/captive.js.md): `INTERACTIONS.filter`
- called by: [`mountBrig>paint`](#s-mountBrig-paint)

<!-- note:captiveCard -->
<!-- /note -->

#### <a id="s-captiveCard-onPick"></a>`captiveCard.onPick(v)`

prop · L81–81

- calls: [`mountBrig>rebuild`](#s-mountBrig-rebuild)

<!-- note:captiveCard.onPick -->
<!-- /note -->

### <a id="s-actionRow"></a>`actionRow(p, a, rebuild)`

function · L102–118

- calls: [`button`](../kit.js.md#s-button) _js/console/kit.js_ · [`el`](../kit.js.md#s-el) _js/console/kit.js_ ×4 · [`mountBrig>rebuild`](#s-mountBrig-rebuild) · [`canInteract`](../../crew/captive.js.md#s-canInteract) _js/crew/captive.js_ · [`interact`](../../crew/captive.js.md#s-interact) _js/crew/captive.js_
- called by: [`captiveCard`](#s-captiveCard) ×2

<!-- note:actionRow -->
<!-- /note -->
