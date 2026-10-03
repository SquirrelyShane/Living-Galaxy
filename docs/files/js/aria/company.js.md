# js/aria/company.js

[index](../../../README.md) · 227 lines · 20 symbols · 9 imports · 2 importers

## About

<!-- note:@file -->
LIVING GALAXY — ARIA running a business, not just a hull.

0.3.26. A career in this game is a company: you sign hands, you post them to
watches, you register a charter, you settle people at ports where they earn
you a share of a wage forever, and a board of three sits above you being
unhappy about different things. ARIA did none of it. She flew a one-seat
ship with an empty roster and an empty treasury for the whole of every run,
which is not a career — it is a courier with ambitions.

This is the bridge's business side, and it is the same machinery the deck
gives you: `stationRoster` / `hireCrew` for the hall, `setDuty` for the
watch bill, `foundCompany` / `transfer` / `settleAsStaff` for the charter.
Nothing here has its own economy. If ARIA can afford a hand, so can you, on
the same terms, at the same desk.

The rules she works to, in order:

  PAYROLL FIRST. A wage is a standing bill against the purse every ninety
  seconds. She will not sign a hand she cannot carry for `RUN.cover` cycles
  out of what the run is actually earning, because a ship that cannot make
  payroll loses the crew AND the morale, and morale is what the watch bill
  is worth.

  HIRE FOR THE WATCH, NOT FOR THE ROSTER. A hand is worth their wage if the
  hull has a post for them — Engineering works off the maintenance backlog,
  Cargo stows the hold, Medbay keeps the rest of them upright — or if their
  trade is the career's own. Anything else is a passenger.

  A CHARTER WHEN THERE IS SOMETHING TO CHARTER. Registration is 2,500 cr and
  an office; she waits until the run is clearly paying and then registers
  the charter that matches what she actually earns from, because the
  Registrar's seat on the board scores exactly that.

  SETTLE THE ONES THE SHIP IS DONE WITH. A hand with nowhere to stand is
  worth more ashore: settled staff pay the treasury a share of their wage
  every cycle, for ever, and it is the only income in the game that does not
  need the hull to be anywhere.
<!-- /note -->

## Imports

| line | from | names | target |
|---|---|---|---|
| 1 | `./mind.js` | `authorize`, `remember` | [js/aria/mind.js](mind.js.md) |
| 2 | `../sim/sim.js` | `sim`, `crewCapacity`, `logEvent` | [js/sim/sim.js](../sim/sim.js.md) |
| 3 | `../station/stations.js` | `stationById` | [js/station/stations.js](../station/stations.js.md) |
| 4 | `../crew/ledger.js` | `crew`, `stationRoster`, `hireCrew`, `hireTerms`, `dismissCrew`, `crewWageTotal`, `wageFor`, `CYCLE_SECONDS` | [js/crew/ledger.js](../crew/ledger.js.md) |
| 5 | `../crew/roster.js` | `dutyOptions`, `setDuty`, `dutyOf`, `postKind`, `currentPlan` | [js/crew/roster.js](../crew/roster.js.md) |
| 6 | `../corp/company.js` | `company`, `hasCompany`, `foundCompany`, `transfer`, `settleAsStaff`, `staffIncome`, `suggestName`, `boardBrief`, `CHARTERS`, `COMPANY` | [js/corp/company.js](../corp/company.js.md) |
| 7 | `../economy/contracts.js` | `CATEGORIES` | [js/economy/contracts.js](../economy/contracts.js.md) |
| 8 | `../economy/traderoutes.js` | `bestRoute` | [js/economy/traderoutes.js](../economy/traderoutes.js.md) |
| 9 | `../flight/ship.js` | `holdRoom` | [js/flight/ship.js](../flight/ship.js.md) |

## Imported by

- [js/aria/play.js](play.js.md) — `runBusiness`, `bizReport`, `bizLine`, `resetBusiness`, `biz`
- test/ariabiz.test.mjs _(outside js/)_ — `RUN`, `WANTED`, `CHARTER_FOR`, `biz`, `runBusiness`, `bizReport`, `bizLine`, `resetBusiness`, `considerHire`, `considerFound`, `considerSettle`, `considerTreasury`, `considerLayoff`, `wantScore`, `hasPostFor`, `payrollPerMin`, `workingCapital`, `postThem`

## Exports

- [`RUN`](#s-RUN) · const — used by test/ariabiz.test.mjs
- [`WANTED`](#s-WANTED) · const — used by test/ariabiz.test.mjs
- [`CHARTER_FOR`](#s-CHARTER_FOR) · const — used by test/ariabiz.test.mjs
- [`biz`](#s-biz) · const — used by [js/aria/play.js](play.js.md), test/ariabiz.test.mjs
- [`payrollPerMin`](#s-payrollPerMin) · function — used by test/ariabiz.test.mjs
- [`wageOf`](#s-wageOf) · function — **no importer in scanned roots**
- [`hasPostFor`](#s-hasPostFor) · function — used by test/ariabiz.test.mjs
- [`wantScore`](#s-wantScore) · function — used by test/ariabiz.test.mjs
- [`considerHire`](#s-considerHire) · function — used by test/ariabiz.test.mjs
- [`postThem`](#s-postThem) · function — used by test/ariabiz.test.mjs
- [`considerLayoff`](#s-considerLayoff) · function — used by test/ariabiz.test.mjs
- [`considerFound`](#s-considerFound) · function — used by test/ariabiz.test.mjs
- [`workingCapital`](#s-workingCapital) · function — used by test/ariabiz.test.mjs
- [`considerTreasury`](#s-considerTreasury) · function — used by test/ariabiz.test.mjs
- [`considerSettle`](#s-considerSettle) · function — used by test/ariabiz.test.mjs
- [`runBusiness`](#s-runBusiness) · function — used by [js/aria/play.js](play.js.md), test/ariabiz.test.mjs
- [`bizReport`](#s-bizReport) · function — used by [js/aria/play.js](play.js.md), test/ariabiz.test.mjs
- [`bizLine`](#s-bizLine) · function — used by [js/aria/play.js](play.js.md), test/ariabiz.test.mjs
- [`resetBusiness`](#s-resetBusiness) · function — used by [js/aria/play.js](play.js.md), test/ariabiz.test.mjs

## Effects

_none detected_

## Symbols

### <a id="s-RUN"></a>`RUN`

const · **exported** · L11–19

<!-- note:RUN -->
- L12 · `cover: 8,` — cycles of payroll she keeps in hand before signing anybody
- L13 · `float: 6000,` — credits that stay aboard whatever the treasury wants
- L14 · `foundAt: 12000,` — purse at which a charter starts to look like a good idea
- L15 · `settleMorale: 42,` — a hand this unhappy is better off ashore than aboard
- L16 · `settleAfter: 6,` — cycles aboard before settling one is anything but churn
- L17 · `maxCrew: 6,` — she will not out-hire a hull she has to fly herself
- L18 · `tickEvery: 20,` — s of sky between looks at the business
<!-- /note -->

### <a id="s-WANTED"></a>`WANTED`

const · **exported** · L21–31

<!-- note:WANTED -->
Which trades are worth a berth, by department. The first entry is the
career's own; the rest are the posts every hull needs standing.
<!-- /note -->

### <a id="s-CHARTER_FOR"></a>`CHARTER_FOR`

const · **exported** · L33–37

<!-- note:CHARTER_FOR -->
The charter that matches what a department actually earns from.
<!-- /note -->

### <a id="s-biz"></a>`biz`

const · **exported** · L39–39

<!-- note:biz -->
<!-- /note -->

### <a id="s-note"></a>`note(text)`

function · L41–41

- called by: [`considerFound`](#s-considerFound) · [`considerHire`](#s-considerHire) · [`considerLayoff`](#s-considerLayoff) · [`considerSettle`](#s-considerSettle) · [`considerTreasury`](#s-considerTreasury) ×2

<!-- note:note -->
<!-- /note -->

### <a id="s-payrollPerMin"></a>`payrollPerMin()`

function · **exported** · L43–43

- calls: [`crewWageTotal`](../crew/ledger.js.md#s-crewWageTotal) _js/crew/ledger.js_
- called by: [`bizReport`](#s-bizReport) · [`considerLayoff`](#s-considerLayoff)

<!-- note:payrollPerMin -->
Payroll as a bill: credits a minute, not credits a cycle.
<!-- /note -->

### <a id="s-wageOf"></a>`wageOf(c)`

function · **exported** · L45–45

- calls: [`hireTerms`](../crew/ledger.js.md#s-hireTerms) _js/crew/ledger.js_

<!-- note:wageOf -->
What one more hand at this wage would add to the bill, per cycle.
<!-- /note -->

### <a id="s-hasPostFor"></a>`hasPostFor(c)`

function · **exported** · L47–51

- calls: [`dutyOptions`](../crew/roster.js.md#s-dutyOptions) _js/crew/roster.js_
- via [js/crew/roster.js](../crew/roster.js.md): `dutyOptions.map`
- called by: [`considerLayoff`](#s-considerLayoff) ×2 · [`considerSettle`](#s-considerSettle) · [`wantScore`](#s-wantScore)

<!-- note:hasPostFor -->
Is there a post on this hull for this trade? A hand who can stand a watch is
worth a wage; a hand who cannot is a passenger with an opinion.
<!-- /note -->

### <a id="s-wantScore"></a>`wantScore(c, dept)`

function · **exported** · L53–61

- calls: [`hasPostFor`](#s-hasPostFor)
- via [js/crew/ledger.js](../crew/ledger.js.md): `crew.aboard.some`
- called by: [`considerHire`](#s-considerHire)

<!-- note:wantScore -->
How much she wants this candidate, 0 and up. Career first, then the watch.

- L58 · `if (crew.aboard.some((m) => m.complexId === c.complexId)) s -= 1.2;` — a second engineer is worth less than a first
<!-- /note -->

### <a id="s-considerHire"></a>`considerHire(st, dept, earnPerMin=)`

function · **exported** · L63–88

- calls: [`note`](#s-note) · [`postThem`](#s-postThem) · [`wantScore`](#s-wantScore) · [`authorize`](mind.js.md#s-authorize) _js/aria/mind.js_ · [`remember`](mind.js.md#s-remember) _js/aria/mind.js_ · [`crewWageTotal`](../crew/ledger.js.md#s-crewWageTotal) _js/crew/ledger.js_ · [`hireCrew`](../crew/ledger.js.md#s-hireCrew) _js/crew/ledger.js_ · [`hireTerms`](../crew/ledger.js.md#s-hireTerms) _js/crew/ledger.js_ · [`stationRoster`](../crew/ledger.js.md#s-stationRoster) _js/crew/ledger.js_ · [`crewCapacity`](../sim/sim.js.md#s-crewCapacity) _js/sim/sim.js_
- called by: [`runBusiness`](#s-runBusiness)

<!-- note:considerHire -->
---- the hall ---------------------------------------------------------------------

Sign the best hand this port has, if the run can carry the wage.
`earnPerMin` is what ARIA is actually making, which is the only honest test
of whether another wage is affordable.

- L75 · `if (perMin > Math.max(120, earnPerMin * 0.45)) continue;` — the bill has to be covered by what the run earns, and the bonus paid out
  of money she does not need to buy cargo with
<!-- /note -->

### <a id="s-postThem"></a>`postThem(m)`

function · **exported** · L90–98

- calls: [`dutyOf`](../crew/roster.js.md#s-dutyOf) _js/crew/roster.js_ · [`dutyOptions`](../crew/roster.js.md#s-dutyOptions) _js/crew/roster.js_ · [`postKind`](../crew/roster.js.md#s-postKind) _js/crew/roster.js_ · [`setDuty`](../crew/roster.js.md#s-setDuty) _js/crew/roster.js_
- via [js/crew/roster.js](../crew/roster.js.md): `dutyOptions.map`
- via [js/crew/ledger.js](../crew/ledger.js.md): `crew.aboard.map`, `crew.aboard.map.filter`
- called by: [`considerHire`](#s-considerHire)

<!-- note:postThem -->
Put a new hand where the hull needs one, not where the roster defaults them.

- L93 · `for (const k of ["eng", "cargo", "med", "sensor", "sec", "office"]) {` — the posts that pay for themselves, in the order a short-handed ship fills them
<!-- /note -->

### <a id="s-considerLayoff"></a>`considerLayoff(earnPerMin=)`

function · **exported** · L100–113

- calls: [`hasPostFor`](#s-hasPostFor) ×2 · [`note`](#s-note) · [`payrollPerMin`](#s-payrollPerMin) · [`authorize`](mind.js.md#s-authorize) _js/aria/mind.js_ · [`remember`](mind.js.md#s-remember) _js/aria/mind.js_ · [`crewWageTotal`](../crew/ledger.js.md#s-crewWageTotal) _js/crew/ledger.js_ · [`dismissCrew`](../crew/ledger.js.md#s-dismissCrew) _js/crew/ledger.js_
- called by: [`runBusiness`](#s-runBusiness)

<!-- note:considerLayoff -->
Let one go when the purse cannot carry them. Returns who, or null.

- L105 · `const order = [...crew.aboard].sort((a, b) => (hasPostFor(a) ? 1 : 0) - (hasPostFor(b) ? 1` — the most expensive hand with no post is the one that goes
<!-- /note -->

### <a id="s-considerFound"></a>`considerFound(st, dept)`

function · **exported** · L115–126

- calls: [`note`](#s-note) · [`workingCapital`](#s-workingCapital) · [`authorize`](mind.js.md#s-authorize) _js/aria/mind.js_ · [`foundCompany`](../corp/company.js.md#s-foundCompany) _js/corp/company.js_ · [`hasCompany`](../corp/company.js.md#s-hasCompany) _js/corp/company.js_ · [`suggestName`](../corp/company.js.md#s-suggestName) _js/corp/company.js_
- called by: [`runBusiness`](#s-runBusiness)

<!-- note:considerFound -->
---- the charter -------------------------------------------------------------------

Register when there is something to register. Returns the charter, or null.
<!-- /note -->

### <a id="s-workingCapital"></a>`workingCapital()`

function · **exported** · L128–133

- calls: [`bestRoute`](../economy/traderoutes.js.md#s-bestRoute) _js/economy/traderoutes.js_ · [`holdRoom`](../flight/ship.js.md#s-holdRoom) _js/flight/ship.js_
- called by: [`considerFound`](#s-considerFound) · [`considerTreasury`](#s-considerTreasury)

<!-- note:workingCapital -->
Working capital: what has to stay aboard to keep trading. A treasury that
has swallowed the money the next run was going to buy cargo with is not a
treasury, it is a mistake — the first version of this banked everything
above six thousand and left her unable to afford a single route.

- L129 · `const r = bestRoute({ credits: sim.ship.credits ?? 0 });` — what she could actually buy with the purse she has, not with an imaginary
  one — priced off an infinite purse this came out at half a million and she
  never registered a charter in her life
<!-- /note -->

### <a id="s-considerTreasury"></a>`considerTreasury()`

function · **exported** · L135–148

- calls: [`note`](#s-note) ×2 · [`workingCapital`](#s-workingCapital) · [`authorize`](mind.js.md#s-authorize) _js/aria/mind.js_ · [`hasCompany`](../corp/company.js.md#s-hasCompany) _js/corp/company.js_ · [`transfer`](../corp/company.js.md#s-transfer) _js/corp/company.js_ ×2
- called by: [`runBusiness`](#s-runBusiness)

<!-- note:considerTreasury -->
Keep the working capital aboard and the rest in the treasury; draw back when
the purse is too thin to trade with. The board's Solvency seat reads the
treasury and the Expansion seat reads the staff, so this is not bookkeeping
— it is what the board is scoring.
<!-- /note -->

### <a id="s-considerSettle"></a>`considerSettle(st)`

function · **exported** · L150–170

- calls: [`hasPostFor`](#s-hasPostFor) · [`note`](#s-note) · [`authorize`](mind.js.md#s-authorize) _js/aria/mind.js_ · [`remember`](mind.js.md#s-remember) _js/aria/mind.js_ · [`hasCompany`](../corp/company.js.md#s-hasCompany) _js/corp/company.js_ · [`settleAsStaff`](../corp/company.js.md#s-settleAsStaff) _js/corp/company.js_ · [`staffIncome`](../corp/company.js.md#s-staffIncome) _js/corp/company.js_ · [`crewCapacity`](../sim/sim.js.md#s-crewCapacity) _js/sim/sim.js_
- via [js/crew/ledger.js](../crew/ledger.js.md): `crew.aboard.filter`, `crew.aboard.filter.map`, `crew.aboard.indexOf`, `crew.aboard.splice`, `….filter.map.filter`, `….map.filter.sort`
- called by: [`runBusiness`](#s-runBusiness)

<!-- note:considerSettle -->
Settle a hand ashore. They stop costing a wage and start paying one — a
share of their list wage into the treasury every cycle, for ever. The ones
worth settling are the unhappy, the unpostable and the surplus.
<!-- /note -->

### <a id="s-runBusiness"></a>`runBusiness(dept, earnPerMin=)`

function · **exported** · L172–185

- calls: [`considerFound`](#s-considerFound) · [`considerHire`](#s-considerHire) · [`considerLayoff`](#s-considerLayoff) · [`considerSettle`](#s-considerSettle) · [`considerTreasury`](#s-considerTreasury) · [`stationById`](../station/stations.js.md#s-stationById) _js/station/stations.js_
- called by: [`stepPlay`](play.js.md#s-stepPlay) _js/aria/play.js_

<!-- note:runBusiness -->
---- the whole business, once a port call -------------------------------------------

Run the business side. Called while docked, on its own cadence — a port call
is when a hiring hall, a registrar and a housing office are all in reach,
and none of them are anywhere else.
<!-- /note -->

### <a id="s-bizReport"></a>`bizReport()`

function · **exported** · L187–205

- calls: [`payrollPerMin`](#s-payrollPerMin) · [`boardBrief`](../corp/company.js.md#s-boardBrief) _js/corp/company.js_ · [`hasCompany`](../corp/company.js.md#s-hasCompany) _js/corp/company.js_ ×5 · [`crewWageTotal`](../crew/ledger.js.md#s-crewWageTotal) _js/crew/ledger.js_ · [`dutyOf`](../crew/roster.js.md#s-dutyOf) _js/crew/roster.js_ · [`postKind`](../crew/roster.js.md#s-postKind) _js/crew/roster.js_ · [`crewCapacity`](../sim/sim.js.md#s-crewCapacity) _js/sim/sim.js_
- via [js/crew/ledger.js](../crew/ledger.js.md): `crew.aboard.filter`, `crew.aboard.reduce`
- called by: [`bizLine`](#s-bizLine) · [`playReport`](play.js.md#s-playReport) _js/aria/play.js_

<!-- note:bizReport -->
Where the business stands, for a screen or a test.
<!-- /note -->

### <a id="s-bizLine"></a>`bizLine()`

function · **exported** · L207–216

- calls: [`bizReport`](#s-bizReport)
- called by: [`playReport`](play.js.md#s-playReport) _js/aria/play.js_

<!-- note:bizLine -->
One line: "4 crew · 3 posted · 420 cr/cycle · Kestrel Holdings · 2 ashore · 18,400 cr".
<!-- /note -->

### <a id="s-resetBusiness"></a>`resetBusiness()`

function · **exported** · L218–225

- called by: [`beginPlay`](play.js.md#s-beginPlay) _js/aria/play.js_

<!-- note:resetBusiness -->
<!-- /note -->
