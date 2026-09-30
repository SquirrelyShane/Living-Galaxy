# js/crew/captive.js

[index](../../../README.md) · 301 lines · 39 symbols · 7 imports · 2 importers

## About

<!-- note:@file -->
Living Galaxy — the brig, and the person in it.

Somebody you took on a ticket is not a number waiting to be cashed. They
have a name on the ledger, an outfit that wants them back, a body with its
own grit in it, and two numbers that move with what you actually do:

  resistance  how far they are from giving you anything. Starts high, and
              high is where it stays if you leave them in a cell.
  regard      what they make of YOU, separately. You can wear somebody down
              without them thinking any better of you, and that is exactly
              the captive who signs on and walks at the first port.

Both have to move for a recruitment to hold. Feeding somebody, getting them
out of the cell, letting them work off a day on the treadmill, sitting down
and talking — those lower resistance AND raise regard, slowly. Threats,
short rations and isolation lower resistance faster and destroy regard, so
they get you a ransom or a delivery and never a crew member.

Neglect is its own choice. A captive nobody visits gets harder, not softer,
and eventually tries the door.
<!-- /note -->

## Imports

| line | from | names | target |
|---|---|---|---|
| 1 | `../sim/sim.js` | `sim`, `logEvent` | [js/sim/sim.js](../sim/sim.js.md) |
| 2 | `./ledger.js` | `crew`, `crewHooks`, `crewNote`, `wageFor` | [js/crew/ledger.js](ledger.js.md) |
| 3 | `../npc/cradle.js` | `cradle` | [js/npc/cradle.js](../npc/cradle.js.md) |
| 4 | `../interior/boarding.js` | `boarding` | [js/interior/boarding.js](../interior/boarding.js.md) |
| 5 | `../corp/corps.js` | `corpById`, `adjustStanding` | [js/corp/corps.js](../corp/corps.js.md) |
| 6 | `./deckmind.js` | `bodyOf` | [js/crew/deckmind.js](deckmind.js.md) |
| 7 | `../genome/spacer.js` | `GENE` | [js/genome/spacer.js](../genome/spacer.js.md) |

## Imported by

- [js/console/panels/crew-brig.js](../console/panels/crew-brig.js.md) — `captives`, `INTERACTIONS`, `canInteract`, `interact`, `canRecruit`, `recruit`, `guardStrength`, `RESIST_WORD`, `REGARD_WORD`, `RECRUIT_RESISTANCE`, `RECRUIT_REGARD`
- test/bounty.test.mjs _(outside js/)_ — `captives`, `captiveState`, `captiveById`, `INTERACTIONS`, `INTERACTION_BY_ID`, `canInteract`, `interact`, `canRecruit`, `recruit`, `guardStrength`, `tickCaptives`, `captiveLine`, `RECRUIT_RESISTANCE`, `RECRUIT_REGARD`

## Exports

- [`RECRUIT_RESISTANCE`](#s-RECRUIT_RESISTANCE) · const — used by [js/console/panels/crew-brig.js](../console/panels/crew-brig.js.md), test/bounty.test.mjs
- [`RECRUIT_REGARD`](#s-RECRUIT_REGARD) · const — used by [js/console/panels/crew-brig.js](../console/panels/crew-brig.js.md), test/bounty.test.mjs
- [`NEGLECT_DRIFT`](#s-NEGLECT_DRIFT) · const — **no importer in scanned roots**
- [`captiveState`](#s-captiveState) · function — used by test/bounty.test.mjs
- [`captives`](#s-captives) · function — used by [js/console/panels/crew-brig.js](../console/panels/crew-brig.js.md), test/bounty.test.mjs
- [`captiveById`](#s-captiveById) · function — used by test/bounty.test.mjs
- [`INTERACTIONS`](#s-INTERACTIONS) · const — used by [js/console/panels/crew-brig.js](../console/panels/crew-brig.js.md), test/bounty.test.mjs
- [`INTERACTION_BY_ID`](#s-INTERACTION_BY_ID) · const — used by test/bounty.test.mjs
- [`canInteract`](#s-canInteract) · function — used by [js/console/panels/crew-brig.js](../console/panels/crew-brig.js.md), test/bounty.test.mjs
- [`interact`](#s-interact) · function — used by [js/console/panels/crew-brig.js](../console/panels/crew-brig.js.md), test/bounty.test.mjs
- [`canRecruit`](#s-canRecruit) · function — used by [js/console/panels/crew-brig.js](../console/panels/crew-brig.js.md), test/bounty.test.mjs
- [`recruit`](#s-recruit) · function — used by [js/console/panels/crew-brig.js](../console/panels/crew-brig.js.md), test/bounty.test.mjs
- [`guardStrength`](#s-guardStrength) · function — used by [js/console/panels/crew-brig.js](../console/panels/crew-brig.js.md), test/bounty.test.mjs
- [`tickCaptives`](#s-tickCaptives) · function — used by test/bounty.test.mjs
- [`captiveLine`](#s-captiveLine) · function — used by test/bounty.test.mjs
- [`RESIST_WORD`](#s-RESIST_WORD) — used by [js/console/panels/crew-brig.js](../console/panels/crew-brig.js.md)
- [`REGARD_WORD`](#s-REGARD_WORD) — used by [js/console/panels/crew-brig.js](../console/panels/crew-brig.js.md)

## Effects

_none detected_

## Symbols

### <a id="s-RECRUIT_RESISTANCE"></a>`RECRUIT_RESISTANCE`

const · **exported** · L9–9

<!-- note:RECRUIT_RESISTANCE -->
Resistance at or below this, and regard at or above it, before anyone will hear an offer.
<!-- /note -->

### <a id="s-RECRUIT_REGARD"></a>`RECRUIT_REGARD`

const · **exported** · L10–10

<!-- note:RECRUIT_REGARD -->
<!-- /note -->

### <a id="s-NEGLECT_DRIFT"></a>`NEGLECT_DRIFT`

const · **exported** · L11–11

<!-- note:NEGLECT_DRIFT -->
A captive nobody attends to hardens by this much a cycle.
<!-- /note -->

### <a id="s-clamp"></a>`clamp(v, a, b)`

function · L13–13

- called by: [`canRecruit`](#s-canRecruit) ×2 · [`captiveState`](#s-captiveState) ×2 · [`interact`](#s-interact) ×3 · [`recruit`](#s-recruit) ×2 · [`tickCaptives`](#s-tickCaptives) ×6 · [`tryEscape`](#s-tryEscape) ×3

<!-- note:clamp -->
<!-- /note -->

### <a id="s-r1"></a>`r1(v)`

function · L14–14

- called by: [`interact`](#s-interact) ×2

<!-- note:r1 -->
<!-- /note -->

### <a id="s-rollFrom"></a>`rollFrom(seed)`

function · L16–20

- called by: [`tickCaptives`](#s-tickCaptives) ×2

<!-- note:rollFrom -->
<!-- /note -->

### <a id="s-captiveState"></a>`captiveState(p)`

function · **exported** · L22–45

- calls: [`clamp`](#s-clamp) ×2 · [`bodyOf`](deckmind.js.md#s-bodyOf) _js/crew/deckmind.js_
- via [js/npc/cradle.js](../npc/cradle.js.md): `cradle.get`
- called by: [`canInteract`](#s-canInteract) · [`canRecruit`](#s-canRecruit) · [`captiveLine`](#s-captiveLine) · [`captives`](#s-captives) · [`interact`](#s-interact) · [`note`](#s-note) · [`recruit`](#s-recruit) · [`tickCaptives`](#s-tickCaptives) · [`tryEscape`](#s-tryEscape)

<!-- note:captiveState -->
---- the state ------------------------------------------------------------

The two numbers, plus the conditions they are being held in.

- L32 · `resistance: clamp(Math.round(52 + grit * 26 + loyal * 18 + pain * 10), 30, 100),` — somebody stubborn, loyal to whoever they flew for, and hard to shift
  starts a long way from telling you anything
- L35 · `fed: 0,` — cycles since a decent meal
- L37 · `outOfCell: false,` — moved to quarters under watch
- L39 · `attempts: 0,` — recruitment offers made
- L41 · `done: {},` — action id → cycle it was last used
<!-- /note -->

### <a id="s-note"></a>`note(p, line)`

function · L47–51

- calls: [`captiveState`](#s-captiveState)
- called by: [`interact`](#s-interact) · [`recruit`](#s-recruit) · [`tryEscape`](#s-tryEscape)

<!-- note:note -->
<!-- /note -->

### <a id="s-captives"></a>`captives()`

function · **exported** · L53–55

- calls: [`captiveState`](#s-captiveState)
- via [js/interior/boarding.js](../interior/boarding.js.md): `boarding.brig.map`
- called by: [`mountBrig>paint`](../console/panels/crew-brig.js.md#s-mountBrig-paint) _js/console/panels/crew-brig.js_

<!-- note:captives -->
Everyone in the brig, with their numbers.
<!-- /note -->

### <a id="s-captiveById"></a>`captiveById(id)`

function · **exported** · L57–59

- via [js/interior/boarding.js](../interior/boarding.js.md): `boarding.brig.find`

<!-- note:captiveById -->
<!-- /note -->

### <a id="s-INTERACTIONS"></a>`INTERACTIONS`

const · **exported** · L61–133

<!-- note:INTERACTIONS -->
---- what you can do ------------------------------------------------------
`resist` and `regard` are the two numbers. `cost` is credits; `needs` is a
precondition checked against the ship. Everything humane moves both numbers
the right way and slowly; everything coercive buys resistance with regard.
<!-- /note -->

#### <a id="s-INTERACTIONS-line"></a>`INTERACTIONS.line(n)`

prop · L66–66

<!-- note:INTERACTIONS.line -->
<!-- /note -->

#### <a id="s-INTERACTIONS-apply"></a>`INTERACTIONS.apply(st)`

prop · L67–67

<!-- note:INTERACTIONS.apply -->
<!-- /note -->

#### <a id="s-INTERACTIONS-line-2"></a>`INTERACTIONS.line~2(n)`

prop · L73–73

<!-- note:INTERACTIONS.line~2 -->
<!-- /note -->

#### <a id="s-INTERACTIONS-apply-2"></a>`INTERACTIONS.apply~2(st)`

prop · L74–74

<!-- note:INTERACTIONS.apply~2 -->
<!-- /note -->

#### <a id="s-INTERACTIONS-line-3"></a>`INTERACTIONS.line~3(n)`

prop · L80–80

<!-- note:INTERACTIONS.line~3 -->
<!-- /note -->

#### <a id="s-INTERACTIONS-line-4"></a>`INTERACTIONS.line~4(n)`

prop · L86–86

<!-- note:INTERACTIONS.line~4 -->
<!-- /note -->

#### <a id="s-INTERACTIONS-line-5"></a>`INTERACTIONS.line~5(n)`

prop · L92–92

<!-- note:INTERACTIONS.line~5 -->
<!-- /note -->

#### <a id="s-INTERACTIONS-line-6"></a>`INTERACTIONS.line~6(n)`

prop · L98–98

<!-- note:INTERACTIONS.line~6 -->
<!-- /note -->

#### <a id="s-INTERACTIONS-apply-3"></a>`INTERACTIONS.apply~3(st)`

prop · L99–99

<!-- note:INTERACTIONS.apply~3 -->
<!-- /note -->

#### <a id="s-INTERACTIONS-line-7"></a>`INTERACTIONS.line~7(n)`

prop · L105–105

<!-- note:INTERACTIONS.line~7 -->
<!-- /note -->

#### <a id="s-INTERACTIONS-line-8"></a>`INTERACTIONS.line~8(n, c)`

prop · L111–111

<!-- note:INTERACTIONS.line~8 -->
<!-- /note -->

#### <a id="s-INTERACTIONS-line-9"></a>`INTERACTIONS.line~9(n)`

prop · L117–117

<!-- note:INTERACTIONS.line~9 -->
<!-- /note -->

#### <a id="s-INTERACTIONS-line-10"></a>`INTERACTIONS.line~10(n)`

prop · L123–123

<!-- note:INTERACTIONS.line~10 -->
<!-- /note -->

#### <a id="s-INTERACTIONS-apply-4"></a>`INTERACTIONS.apply~4(st)`

prop · L124–124

<!-- note:INTERACTIONS.apply~4 -->
<!-- /note -->

#### <a id="s-INTERACTIONS-line-11"></a>`INTERACTIONS.line~11(n)`

prop · L130–130

<!-- note:INTERACTIONS.line~11 -->
<!-- /note -->

#### <a id="s-INTERACTIONS-apply-5"></a>`INTERACTIONS.apply~5(st)`

prop · L131–131

<!-- note:INTERACTIONS.apply~5 -->
<!-- /note -->

### <a id="s-INTERACTION_BY_ID"></a>`INTERACTION_BY_ID`

const · **exported** · L135–135

<!-- note:INTERACTION_BY_ID -->
<!-- /note -->

### <a id="s-canInteract"></a>`canInteract(p, actionId)`

function · **exported** · L137–150

- calls: [`captiveState`](#s-captiveState)
- via [js/crew/ledger.js](ledger.js.md): `crew.aboard.some`
- called by: [`actionRow`](../console/panels/crew-brig.js.md#s-actionRow) _js/console/panels/crew-brig.js_ · [`interact`](#s-interact)

<!-- note:canInteract -->
Whether this can be done to this captive right now. { ok, why }
<!-- /note -->

### <a id="s-interact"></a>`interact(p, actionId, rng=)`

function · **exported** · L152–175

- calls: [`corpById`](../corp/corps.js.md#s-corpById) _js/corp/corps.js_ · [`canInteract`](#s-canInteract) · [`captiveState`](#s-captiveState) · [`clamp`](#s-clamp) ×3 · [`note`](#s-note) · [`r1`](#s-r1) ×2 · [`tryEscape`](#s-tryEscape)
- called by: [`actionRow`](../console/panels/crew-brig.js.md#s-actionRow) _js/console/panels/crew-brig.js_

<!-- note:interact -->
Do it. Returns { ok, line, resistance, regard, escaped }.

- L159 · `const warmth = 0.7 + (st.regard / 100) * 0.8;` — Resistance is easier to move when somebody already thinks well of you —
  that is the whole shape of it, and it is why the coercive route gets you a
  delivery and never a crew member. Regard itself tapers: the first meal
  matters far more than the ninth.
- L172 · `let escaped = false;` — the ones that open a door sometimes open a door
<!-- /note -->

### <a id="s-canRecruit"></a>`canRecruit(p)`

function · **exported** · L177–194

- calls: [`corpById`](../corp/corps.js.md#s-corpById) _js/corp/corps.js_ · [`captiveState`](#s-captiveState) · [`clamp`](#s-clamp) ×2 · [`bodyOf`](deckmind.js.md#s-bodyOf) _js/crew/deckmind.js_
- via [js/npc/cradle.js](../npc/cradle.js.md): `cradle.get`
- called by: [`captiveCard`](../console/panels/crew-brig.js.md#s-captiveCard) _js/console/panels/crew-brig.js_ · [`recruit`](#s-recruit)

<!-- note:canRecruit -->
---- the offer ------------------------------------------------------------

Would they even listen? { ok, why, chance }

- L186 · `const corp = p.ownerCorp ? corpById(p.ownerCorp) : null;` — somebody loyal is harder to turn, and their old outfit still matters
<!-- /note -->

### <a id="s-recruit"></a>`recruit(p, rng=)`

function · **exported** · L196–234

- calls: [`adjustStanding`](../corp/corps.js.md#s-adjustStanding) _js/corp/corps.js_ ×2 · [`canRecruit`](#s-canRecruit) · [`captiveState`](#s-captiveState) · [`clamp`](#s-clamp) ×2 · [`note`](#s-note) · [`crewNote`](ledger.js.md#s-crewNote) _js/crew/ledger.js_ · [`wageFor`](ledger.js.md#s-wageFor) _js/crew/ledger.js_ · [`logEvent`](../sim/sim.js.md#s-logEvent) _js/sim/sim.js_
- via [js/npc/cradle.js](../npc/cradle.js.md): `cradle.get`, `cradle.note`, `cradle.put`
- via [js/interior/boarding.js](../interior/boarding.js.md): `boarding.brig.indexOf`, `boarding.brig.splice`
- via [js/crew/ledger.js](ledger.js.md): `crew.aboard.push`
- called by: [`captiveCard`](../console/panels/crew-brig.js.md#s-captiveCard) _js/console/panels/crew-brig.js_

<!-- note:recruit -->
Ask. A refusal costs regard and makes the next one harder, so this is not a
button to hammer — it is a judgement about whether you have done enough.

- L229 · `` if (p.ownerCorp) adjustStanding(p.ownerCorp, -14, `turned ${p.name}`); `` — their old outfit takes it very personally, and the ticket is gone
<!-- /note -->

### <a id="s-guardStrength"></a>`guardStrength()`

function · **exported** · L236–244

- called by: [`mountBrig>paint`](../console/panels/crew-brig.js.md#s-mountBrig-paint) _js/console/panels/crew-brig.js_ · [`tryEscape`](#s-tryEscape)

<!-- note:guardStrength -->
---- the door --------------------------------------------------------------

How hard it is to walk off this hull. Crew on watch, robots, and a real cell.
<!-- /note -->

### <a id="s-tryEscape"></a>`tryEscape(p, rng, when=)`

function · L246–267

- calls: [`adjustStanding`](../corp/corps.js.md#s-adjustStanding) _js/corp/corps.js_ · [`captiveState`](#s-captiveState) · [`clamp`](#s-clamp) ×3 · [`guardStrength`](#s-guardStrength) · [`note`](#s-note) · [`crewNote`](ledger.js.md#s-crewNote) _js/crew/ledger.js_ · [`logEvent`](../sim/sim.js.md#s-logEvent) _js/sim/sim.js_
- via [js/npc/cradle.js](../npc/cradle.js.md): `cradle.get`, `cradle.note`, `cradle.put`
- via [js/interior/boarding.js](../interior/boarding.js.md): `boarding.brig.indexOf`, `boarding.brig.splice`
- called by: [`interact`](#s-interact) · [`tickCaptives`](#s-tickCaptives)

<!-- note:tryEscape -->
<!-- /note -->

### <a id="s-tickCaptives"></a>`tickCaptives()`

function · **exported** · L269–287

- calls: [`captiveState`](#s-captiveState) · [`clamp`](#s-clamp) ×6 · [`rollFrom`](#s-rollFrom) ×2 · [`tryEscape`](#s-tryEscape)

<!-- note:tickCaptives -->
Per pay cycle: conditions tell, neglect hardens, and doors get tried.

- L275 · `if (st.fed > 2) { st.health = clamp(st.health - 3, 1, 100); st.regard = clamp(st.regard -` — hunger, and the cell itself
- L279 · `const touched = Object.values(st.done).some((c) => st.cycles - c <= 1);` — a captive nobody visits gets harder, not softer
- L282 · `if (st.health < 25) st.regard = clamp(st.regard - 2, 0, 100);` — a broken one is not a recruit, whatever the numbers say
<!-- /note -->

### <a id="s-RESIST_WORD"></a>`RESIST_WORD(v)`

function · **exported** · L289–289

- called by: [`captiveCard`](../console/panels/crew-brig.js.md#s-captiveCard) _js/console/panels/crew-brig.js_ · [`captiveLine`](#s-captiveLine)

<!-- note:RESIST_WORD -->
---- reading it back -------------------------------------------------------
<!-- /note -->

### <a id="s-REGARD_WORD"></a>`REGARD_WORD(v)`

function · **exported** · L290–290

- called by: [`captiveCard`](../console/panels/crew-brig.js.md#s-captiveCard) _js/console/panels/crew-brig.js_ · [`captiveLine`](#s-captiveLine)

<!-- note:REGARD_WORD -->
<!-- /note -->

### <a id="s-captiveLine"></a>`captiveLine(p)`

function · **exported** · L292–295

- calls: [`captiveState`](#s-captiveState) · [`REGARD_WORD`](#s-REGARD_WORD) · [`RESIST_WORD`](#s-RESIST_WORD)

<!-- note:captiveLine -->
One line on where a captive stands.
<!-- /note -->

### <a id="s-reset"></a>`reset()`

function · L299–299

<!-- note:reset -->
<!-- /note -->

## Module-level calls

- via [js/crew/ledger.js](ledger.js.md): `crewHooks.cycle.includes`, `crewHooks.cycle.push`, `crewHooks.reset.includes`, `crewHooks.reset.push`
