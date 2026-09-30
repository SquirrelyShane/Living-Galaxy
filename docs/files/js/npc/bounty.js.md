# js/npc/bounty.js

[index](../../../README.md) · 351 lines · 31 symbols · 8 imports · 4 importers

## About

<!-- note:@file -->
Living Galaxy — the Marshal's board: marks, capture, and what it costs you.

A bounty is not a kill order. Every mark on this board is wanted ALIVE and
held somewhere, and the whole point of the system is what happens after you
have them: a person in your brig is a person (crew/captive.js), with a name
on the ledger, a corp who wants them back, and an opinion of you that moves.

The cost is the interesting part. A mark belongs to somebody. Lifting them
off a station is theft as far as their outfit is concerned, and the standing
you lose with them — and with everyone who flies under the same flag — does
not come back when you cash the ticket. Taking one bounty is a job. Taking
eight from the same issuer is picking a side in somebody else's war.

Marks are drawn from CRADLE first, so the hand who walked off a hauler two
skies ago, or the one you paid off at Foundry Hold, is who you find with a
price on them. Only somebody who is actually wanted gets filed.
<!-- /note -->

## Imports

| line | from | names | target |
|---|---|---|---|
| 1 | `../sim/sim.js` | `sim`, `logEvent` | [js/sim/sim.js](../sim/sim.js.md) |
| 2 | `../station/stations.js` | `stations`, `stationById` | [js/station/stations.js](../station/stations.js.md) |
| 3 | `./cradle.js` | `cradle`, `generateNPC`, `ensureIdentity` | [js/npc/cradle.js](cradle.js.md) |
| 4 | `../corp/gdb.js` | `catalogue` | [js/corp/gdb.js](../corp/gdb.js.md) |
| 5 | `../corp/corps.js` | `corps`, `corpById`, `corpOfStation`, `corpRelation`, `adjustStanding` | [js/corp/corps.js](../corp/corps.js.md) |
| 6 | `../crew/ledger.js` | `crew`, `crewHooks` | [js/crew/ledger.js](../crew/ledger.js.md) |
| 7 | `../interior/boarding.js` | `boarding` | [js/interior/boarding.js](../interior/boarding.js.md) |
| 8 | `../crew/deckmind.js` | `bodyOf` | [js/crew/deckmind.js](../crew/deckmind.js.md) |

## Imported by

- [js/console/panels/corp-marshal.js](../console/panels/corp-marshal.js.md) — `bounty`, `boardAt`, `takeTicket`, `abandonTicket`, `ticketsHeld`, `attemptCapture`, `canAttempt`, `captureStrength`, `markStrength`, `brigBerths`, `tickPlayerPrice`, `LIFT_COST`
- [js/console/panels/corp.js](../console/panels/corp.js.md) — `ticketsHeld`
- [js/console/panels/crew-brig.js](../console/panels/crew-brig.js.md) — `deliver`, `release`, `ransom`, `brigBerths`
- test/bounty.test.mjs _(outside js/)_ — `bounty`, `boardAt`, `takeTicket`, `abandonTicket`, `ticketsHeld`, `attemptCapture`, `canAttempt`, `captureStrength`, `markStrength`, `deliver`, `release`, `ransom`, `brigBerths`, `tickHunters`, `tickPlayerPrice`, `resetBounty`, `CHARGES`, `LIFT_COST`, `DELIVER_GAIN`, `HUNTED_AT`

## Exports

- [`BOARD_SIZE`](#s-BOARD_SIZE) · const — **no importer in scanned roots**
- [`TICKET_CYCLES`](#s-TICKET_CYCLES) · const — **no importer in scanned roots**
- [`LIFT_COST`](#s-LIFT_COST) · const — used by [js/console/panels/corp-marshal.js](../console/panels/corp-marshal.js.md), test/bounty.test.mjs
- [`DELIVER_GAIN`](#s-DELIVER_GAIN) · const — used by test/bounty.test.mjs
- [`HUNTED_AT`](#s-HUNTED_AT) · const — used by test/bounty.test.mjs
- [`bounty`](#s-bounty) · const — used by [js/console/panels/corp-marshal.js](../console/panels/corp-marshal.js.md), test/bounty.test.mjs
- [`CHARGES`](#s-CHARGES) · const — used by test/bounty.test.mjs
- [`boardAt`](#s-boardAt) · function — used by [js/console/panels/corp-marshal.js](../console/panels/corp-marshal.js.md), test/bounty.test.mjs
- [`ticketsHeld`](#s-ticketsHeld) · function — used by [js/console/panels/corp-marshal.js](../console/panels/corp-marshal.js.md), [js/console/panels/corp.js](../console/panels/corp.js.md), test/bounty.test.mjs
- [`takeTicket`](#s-takeTicket) · function — used by [js/console/panels/corp-marshal.js](../console/panels/corp-marshal.js.md), test/bounty.test.mjs
- [`abandonTicket`](#s-abandonTicket) · function — used by [js/console/panels/corp-marshal.js](../console/panels/corp-marshal.js.md), test/bounty.test.mjs
- [`captureStrength`](#s-captureStrength) · function — used by [js/console/panels/corp-marshal.js](../console/panels/corp-marshal.js.md), test/bounty.test.mjs
- [`markStrength`](#s-markStrength) · function — used by [js/console/panels/corp-marshal.js](../console/panels/corp-marshal.js.md), test/bounty.test.mjs
- [`canAttempt`](#s-canAttempt) · function — used by [js/console/panels/corp-marshal.js](../console/panels/corp-marshal.js.md), test/bounty.test.mjs
- [`hasBrig`](#s-hasBrig) · function — **no importer in scanned roots**
- [`brigBerths`](#s-brigBerths) · function — used by [js/console/panels/corp-marshal.js](../console/panels/corp-marshal.js.md), [js/console/panels/crew-brig.js](../console/panels/crew-brig.js.md), test/bounty.test.mjs
- [`attemptCapture`](#s-attemptCapture) · function — used by [js/console/panels/corp-marshal.js](../console/panels/corp-marshal.js.md), test/bounty.test.mjs
- [`deliver`](#s-deliver) · function — used by [js/console/panels/crew-brig.js](../console/panels/crew-brig.js.md), test/bounty.test.mjs
- [`release`](#s-release) · function — used by [js/console/panels/crew-brig.js](../console/panels/crew-brig.js.md), test/bounty.test.mjs
- [`ransom`](#s-ransom) · function — used by [js/console/panels/crew-brig.js](../console/panels/crew-brig.js.md), test/bounty.test.mjs
- [`tickPlayerPrice`](#s-tickPlayerPrice) · function — used by [js/console/panels/corp-marshal.js](../console/panels/corp-marshal.js.md), test/bounty.test.mjs
- [`priceLine`](#s-priceLine) · function — **no importer in scanned roots**
- [`tickHunters`](#s-tickHunters) · function — used by test/bounty.test.mjs
- [`resetBounty`](#s-resetBounty) · function — used by test/bounty.test.mjs

## Effects

_none detected_

## Symbols

### <a id="s-BOARD_SIZE"></a>`BOARD_SIZE`

const · **exported** · L10–10

<!-- note:BOARD_SIZE -->
Marks on a port's board at once, and how long a ticket stands.
<!-- /note -->

### <a id="s-TICKET_CYCLES"></a>`TICKET_CYCLES`

const · **exported** · L11–11

<!-- note:TICKET_CYCLES -->
<!-- /note -->

### <a id="s-LIFT_COST"></a>`LIFT_COST`

const · **exported** · L12–12

<!-- note:LIFT_COST -->
Standing lost with the mark's own outfit for lifting one of theirs.
<!-- /note -->

### <a id="s-DELIVER_GAIN"></a>`DELIVER_GAIN`

const · **exported** · L13–13

<!-- note:DELIVER_GAIN -->
…and gained with the outfit that wrote the ticket, on delivery.
<!-- /note -->

### <a id="s-HUNTED_AT"></a>`HUNTED_AT`

const · **exported** · L14–14

<!-- note:HUNTED_AT -->
Below this standing with a hostile outfit, somebody starts looking for you.
<!-- /note -->

### <a id="s-bounty"></a>`bounty`

const · **exported** · L16–21

<!-- note:bounty -->
- L17 · `boards: new Map(),` — stationId → { restock, marks: [] }
- L18 · `taken: [],` — tickets you are holding
- L20 · `playerPrice: 0,` — what you are worth to somebody else
<!-- /note -->

### <a id="s-clamp"></a>`clamp(v, a, b)`

function · L23–23

- called by: [`attemptCapture`](#s-attemptCapture) · [`captureStrength`](#s-captureStrength)

<!-- note:clamp -->
<!-- /note -->

### <a id="s-note"></a>`note(text, kind=)`

function · L25–29

- calls: [`logEvent`](../sim/sim.js.md#s-logEvent) _js/sim/sim.js_
- called by: [`abandonTicket`](#s-abandonTicket) · [`attemptCapture`](#s-attemptCapture) ×2 · [`deliver`](#s-deliver) ×2 · [`ransom`](#s-ransom) · [`release`](#s-release) · [`takeTicket`](#s-takeTicket) · [`tickHunters`](#s-tickHunters) ×2

<!-- note:note -->
<!-- /note -->

### <a id="s-rng"></a>`rng(seedStr)`

function · L31–41

- called by: [`attemptCapture`](#s-attemptCapture) · [`boardAt`](#s-boardAt)

<!-- note:rng -->
<!-- /note -->

### <a id="s-CHARGES"></a>`CHARGES`

const · **exported** · L43–52

<!-- note:CHARGES -->
---- what somebody is wanted for ------------------------------------------
<!-- /note -->

### <a id="s-TIER_GUARDS"></a>`TIER_GUARDS`

const · L54–54

<!-- note:TIER_GUARDS -->
<!-- /note -->

### <a id="s-restockOf"></a>`restockOf(st)`

function · L56–58

- called by: [`boardAt`](#s-boardAt)

<!-- note:restockOf -->
---- the board ------------------------------------------------------------

How many restocks deep this port's board is.
<!-- /note -->

### <a id="s-boardAt"></a>`boardAt(st)`

function · **exported** · L60–119

- calls: [`corpOfStation`](../corp/corps.js.md#s-corpOfStation) _js/corp/corps.js_ · [`corpRelation`](../corp/corps.js.md#s-corpRelation) _js/corp/corps.js_ · [`catalogue`](../corp/gdb.js.md#s-catalogue) _js/corp/gdb.js_ · [`restockOf`](#s-restockOf) · [`rng`](#s-rng) · [`ensureIdentity`](cradle.js.md#s-ensureIdentity) _js/npc/cradle.js_ · [`generateNPC`](cradle.js.md#s-generateNPC) _js/npc/cradle.js_
- via [js/station/stations.js](../station/stations.js.md): `stations.filter`
- via [js/npc/cradle.js](cradle.js.md): `cradle.get`, `cradle.pool`, `cradle.pool.sort`, `cradle.put`
- via [js/corp/corps.js](../corp/corps.js.md): `corps.filter`
- called by: [`mountMarshal>paint`](../console/panels/corp-marshal.js.md#s-mountMarshal-paint) _js/console/panels/corp-marshal.js_

<!-- note:boardAt -->
The marks on offer at a port. Deterministic per port, per restock, per sky —
so the same board is the same board until it turns over, and the same on
every device in the room.

- L71 · `const pool = cradle.pool((rec) => rec.status !== "child" && !rec.wanted).sort((a, b) => (a` — people already on the ledger who have somewhere to be: the hands who
  walked off, the ones you dismissed, the mutineers
- L83 · `rec = held ?? catalogue(rec, { kind: "mark", place: st.id, sky: sim.skySeed ?? null, group` — 0.3.54: a wanted name is still one person's
- L88 · `const candidates = corps.filter((c) => c !== issuer && (!issuer || corpRelation(c, issuer)` — whose hand they are: never the issuer's own, and never a flag you
  cannot lose anything with
- L113 · `rec.wanted = { charge: charge.id, pay: marks[marks.length - 1].pay, by: issuer?.id ?? null` — file it: this person is now somebody the sky knows about
<!-- /note -->

### <a id="s-ticketsHeld"></a>`ticketsHeld()`

function · **exported** · L121–123

- called by: [`mountMarshal>paint`](../console/panels/corp-marshal.js.md#s-mountMarshal-paint) _js/console/panels/corp-marshal.js_ · [`search`](../console/panels/corp.js.md#s-search) _js/console/panels/corp.js_ ×2 · [`takeTicket`](#s-takeTicket)

<!-- note:ticketsHeld -->
Every ticket you are holding, live ones first.
<!-- /note -->

### <a id="s-takeTicket"></a>`takeTicket(mark)`

function · **exported** · L125–133

- calls: [`note`](#s-note) · [`ticketsHeld`](#s-ticketsHeld)
- called by: [`markCard`](../console/panels/corp-marshal.js.md#s-markCard) _js/console/panels/corp-marshal.js_

<!-- note:takeTicket -->
Take a ticket. It is a promise to the issuer, not a purchase.
<!-- /note -->

### <a id="s-abandonTicket"></a>`abandonTicket(id)`

function · **exported** · L135–143

- calls: [`adjustStanding`](../corp/corps.js.md#s-adjustStanding) _js/corp/corps.js_ · [`note`](#s-note)
- called by: [`markCard`](../console/panels/corp-marshal.js.md#s-markCard) _js/console/panels/corp-marshal.js_

<!-- note:abandonTicket -->
Give one back. It costs a little face and nothing else.
<!-- /note -->

### <a id="s-captureStrength"></a>`captureStrength()`

function · **exported** · L145–155

- calls: [`bodyOf`](../crew/deckmind.js.md#s-bodyOf) _js/crew/deckmind.js_ · [`clamp`](#s-clamp)
- called by: [`markCard`](../console/panels/corp-marshal.js.md#s-markCard) _js/console/panels/corp-marshal.js_ · [`attemptCapture`](#s-attemptCapture)

<!-- note:captureStrength -->
---- taking somebody ------------------------------------------------------

What your hull can bring to a lock-up. Crew, robots and whoever is in the chair.
<!-- /note -->

### <a id="s-markStrength"></a>`markStrength(mark)`

function · **exported** · L157–162

- calls: [`bodyOf`](../crew/deckmind.js.md#s-bodyOf) _js/crew/deckmind.js_
- via [js/npc/cradle.js](cradle.js.md): `cradle.get`
- called by: [`markCard`](../console/panels/corp-marshal.js.md#s-markCard) _js/console/panels/corp-marshal.js_ · [`attemptCapture`](#s-attemptCapture)

<!-- note:markStrength -->
What is standing between you and them.
<!-- /note -->

### <a id="s-canAttempt"></a>`canAttempt(mark, stId=)`

function · **exported** · L164–172

- calls: [`brigBerths`](#s-brigBerths) · [`hasBrig`](#s-hasBrig)
- called by: [`markCard`](../console/panels/corp-marshal.js.md#s-markCard) _js/console/panels/corp-marshal.js_ · [`attemptCapture`](#s-attemptCapture)

<!-- note:canAttempt -->
Can this even be attempted from where you are? { ok, why }
<!-- /note -->

### <a id="s-hasBrig"></a>`hasBrig()`

function · **exported** · L174–174

- calls: [`brigBerths`](#s-brigBerths)
- called by: [`canAttempt`](#s-canAttempt)

<!-- note:hasBrig -->
<!-- /note -->

### <a id="s-brigBerths"></a>`brigBerths()`

function · **exported** · L175–177

- called by: [`mountMarshal>paint`](../console/panels/corp-marshal.js.md#s-mountMarshal-paint) _js/console/panels/corp-marshal.js_ · [`mountBrig>paint`](../console/panels/crew-brig.js.md#s-mountBrig-paint) _js/console/panels/crew-brig.js_ · [`canAttempt`](#s-canAttempt) · [`hasBrig`](#s-hasBrig)

<!-- note:brigBerths -->
Cells. Every hull has one; the refit adds more.
<!-- /note -->

### <a id="s-attemptCapture"></a>`attemptCapture(mark, opts=)`

function · **exported** · L179–223

- calls: [`adjustStanding`](../corp/corps.js.md#s-adjustStanding) _js/corp/corps.js_ ×2 · [`corpById`](../corp/corps.js.md#s-corpById) _js/corp/corps.js_ · [`corpRelation`](../corp/corps.js.md#s-corpRelation) _js/corp/corps.js_ · [`canAttempt`](#s-canAttempt) · [`captureStrength`](#s-captureStrength) · [`clamp`](#s-clamp) · [`markStrength`](#s-markStrength) · [`note`](#s-note) ×2 · [`rng`](#s-rng) · [`generateNPC`](cradle.js.md#s-generateNPC) _js/npc/cradle.js_
- via [js/npc/cradle.js](cradle.js.md): `cradle.get`, `cradle.note`, `cradle.put`
- via [js/interior/boarding.js](../interior/boarding.js.md): `boarding.brig.push`
- called by: [`markCard`](../console/panels/corp-marshal.js.md#s-markCard) _js/console/panels/corp-marshal.js_

<!-- note:attemptCapture -->
Go and get them. One attempt per ticket per restock, resolved against what
you brought. Nobody dies here: the worst outcome is that they are gone and
their outfit knows exactly who came looking.

- L192 · `if (mark.ownerCorp) {` — the outfit whose hand this is hears about it either way
<!-- /note -->

### <a id="s-deliver"></a>`deliver(captiveId, stId=)`

function · **exported** · L225–256

- calls: [`adjustStanding`](../corp/corps.js.md#s-adjustStanding) _js/corp/corps.js_ ×3 · [`note`](#s-note) ×2 · [`stationById`](../station/stations.js.md#s-stationById) _js/station/stations.js_
- via [js/npc/cradle.js](cradle.js.md): `cradle.get`, `cradle.note`, `cradle.put`
- via [js/interior/boarding.js](../interior/boarding.js.md): `boarding.brig.findIndex`, `boarding.brig.splice`
- called by: [`captiveCard`](../console/panels/crew-brig.js.md#s-captiveCard) _js/console/panels/crew-brig.js_

<!-- note:deliver -->
---- what you do with them ------------------------------------------------

Hand somebody over. The ticket pays and the issuer remembers it.

- L232 · `const health = p.state?.health ?? 100;` — A Marshal's office looks at what you hand them. Somebody who has been
  starved and left in the dark is not a delivery, it is a complaint.
<!-- /note -->

### <a id="s-release"></a>`release(captiveId, why=)`

function · **exported** · L258–276

- calls: [`adjustStanding`](../corp/corps.js.md#s-adjustStanding) _js/corp/corps.js_ ×2 · [`note`](#s-note)
- via [js/npc/cradle.js](cradle.js.md): `cradle.get`, `cradle.note`, `cradle.put`
- via [js/interior/boarding.js](../interior/boarding.js.md): `boarding.brig.findIndex`, `boarding.brig.splice`
- called by: [`captiveCard`](../console/panels/crew-brig.js.md#s-captiveCard) _js/console/panels/crew-brig.js_

<!-- note:release -->
Let them go. Their outfit notices; the issuer notices harder.
<!-- /note -->

### <a id="s-ransom"></a>`ransom(captiveId)`

function · **exported** · L278–296

- calls: [`adjustStanding`](../corp/corps.js.md#s-adjustStanding) _js/corp/corps.js_ ×2 · [`corpById`](../corp/corps.js.md#s-corpById) _js/corp/corps.js_ · [`note`](#s-note)
- via [js/npc/cradle.js](cradle.js.md): `cradle.get`, `cradle.note`, `cradle.put`
- via [js/interior/boarding.js](../interior/boarding.js.md): `boarding.brig.findIndex`, `boarding.brig.splice`
- called by: [`captiveCard`](../console/panels/crew-brig.js.md#s-captiveCard) _js/console/panels/crew-brig.js_

<!-- note:ransom -->
Their outfit buys them back. Standing recovers; the ticket does not.
<!-- /note -->

### <a id="s-tickPlayerPrice"></a>`tickPlayerPrice()`

function · **exported** · L298–303

- called by: [`mountMarshal>paint`](../console/panels/corp-marshal.js.md#s-mountMarshal-paint) _js/console/panels/corp-marshal.js_ · [`tickHunters`](#s-tickHunters)

<!-- note:tickPlayerPrice -->
---- the other direction --------------------------------------------------

What you are worth to somebody. Standing far enough under with any outfit
and there is paper out on you — which is a thing pirates and hunters read.
<!-- /note -->

### <a id="s-priceLine"></a>`priceLine()`

function · **exported** · L305–308

<!-- note:priceLine -->
One line for the HUD and the desk.
<!-- /note -->

### <a id="s-tickHunters"></a>`tickHunters(seconds)`

function · **exported** · L310–333

- calls: [`adjustStanding`](../corp/corps.js.md#s-adjustStanding) _js/corp/corps.js_ · [`note`](#s-note) ×2 · [`rngRoll`](#s-rngRoll) · [`tickPlayerPrice`](#s-tickPlayerPrice)

<!-- note:tickHunters -->
You are not the only hull reading these boards. A mark you have signed for
and left alone can be lifted by somebody else — which is what makes a ticket
a thing with a clock on it rather than a thing on a list.

- L325 · `const held = Math.max(0, now - t.takenAt) / 90;` — somebody else is looking too, and they are not waiting for you
<!-- /note -->

### <a id="s-hunterPool"></a>`hunterPool`

const · L335–335

<!-- note:hunterPool -->
<!-- /note -->

### <a id="s-rngRoll"></a>`rngRoll(seed)`

function · L336–340

- called by: [`tickHunters`](#s-tickHunters)

<!-- note:rngRoll -->
<!-- /note -->

### <a id="s-resetBounty"></a>`resetBounty()`

function · **exported** · L342–348

<!-- note:resetBounty -->
<!-- /note -->

## Module-level calls

- via [js/crew/ledger.js](../crew/ledger.js.md): `crewHooks.always.includes`, `crewHooks.always.push`, `crewHooks.reset.includes`, `crewHooks.reset.push`
