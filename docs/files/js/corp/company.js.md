# js/corp/company.js

[index](../../../README.md) · 313 lines · 36 symbols · 10 imports · 32 importers

## About

<!-- note:@file -->
LIVING GALAXY — your corporation.

Ported in shape from Living Galaxy's systems/company (lg-1.04.00): a charter,
a treasury separate from the pilot's pocket, a book that remembers every
credit in and out, three board seats in deliberate tension (growth,
solvency, charter), and a confidence number that is what the board thinks
of the whole record. Slimmed for Astra: no shares market, no contracted
fleet yet (that is the next port), and the company's *people* are the
point — crew you settle at a port with their families become staff who
earn the company a wage share every cycle, or alumni you paid off and can
still find again.

Charters are Astra's sectors, so what a port is short of and what your
charter says you do are the same vocabulary.
<!-- /note -->

## Imports

| line | from | names | target |
|---|---|---|---|
| 1 | `../sim/sim.js` | `logEvent`, `sim` | [js/sim/sim.js](../sim/sim.js.md) |
| 2 | `../flight/pilot.js` | `pilot` | [js/flight/pilot.js](../flight/pilot.js.md) |
| 3 | `../station/stations.js` | `stationById` | [js/station/stations.js](../station/stations.js.md) |
| 4 | `./corps.js` | `corpOfStation`, `adjustStanding` | [js/corp/corps.js](corps.js.md) |
| 5 | `../crew/ledger.js` | `wageFor`, `CYCLE_SECONDS` | [js/crew/ledger.js](../crew/ledger.js.md) |
| 6 | `../npc/cradle.js` | `cradle` | [js/npc/cradle.js](../npc/cradle.js.md) |
| 7 | `../station/stationlife.js` | `tickStationLife`, `incomeOf`, `resetStationLife`, `stationLife` | [js/station/stationlife.js](../station/stationlife.js.md) |
| 8 | `../station/staffline.js` | `tickLine`, `cutOf` | [js/station/staffline.js](../station/staffline.js.md) |
| 9 | `../station/stafflife.js` | `tickStaffHour`, `takeWorked`, `cyclePay`, `housingCost` | [js/station/stafflife.js](../station/stafflife.js.md) |
| 10 | `../station/stationclock.js` | `CLOCK` | [js/station/stationclock.js](../station/stationclock.js.md) |

## Imported by

- [js/aria/company.js](../aria/company.js.md) — `company`, `hasCompany`, `foundCompany`, `transfer`, `settleAsStaff`, `staffIncome`, `suggestName`, `boardBrief`, `CHARTERS`, `COMPANY`
- [js/aria/pilot.js](../aria/pilot.js.md) — `company`, `hasCompany`
- [js/aria/play.js](../aria/play.js.md) — `company`, `hasCompany`
- [js/console/panels/corp-town.js](../console/panels/corp-town.js.md) — `company`, `hasCompany`
- [js/console/panels/corp.js](../console/panels/corp.js.md) — `CHARTERS`, `CHARTER_KEYS`, `COMPANY`, `boardBrief`, `company`, `contacts`, `foundCompany`, `hasCompany`, `staffAt`, `suggestName`, `transfer`
- [js/console/panels/crew.js](../console/panels/crew.js.md) — `hasCompany`, `company`
- [js/console/panels/work-drones.js](../console/panels/work-drones.js.md) — `company`, `hasCompany`
- [js/console/panels/work-fleet.js](../console/panels/work-fleet.js.md) — `company`, `hasCompany`, `staffAt`
- [js/corp/fleet.js](fleet.js.md) — `company`, `hasCompany`, `staffAt`, `saveCompany`
- [js/crew/family.js](../crew/family.js.md) — `company`, `hasCompany`, `settleAsStaff`, `payOffAndRecord`
- [js/drones/ops.js](../drones/ops.js.md) — `company`, `hasCompany`, `treasuryPay`, `treasuryEarn`
- [js/economy/contracts.js](../economy/contracts.js.md) — `bookRevenue`
- [js/main.js](../main.js.md) — `flushCompany`
- [js/sim/sim.js](../sim/sim.js.md) — `bookRevenue`, `loadCompany`, `tickCompany`, `treasuryPay`
- [js/station/deckhall.js](../station/deckhall.js.md) — `CHARTERS`, `CHARTER_KEYS`, `COMPANY`, `company`, `foundCompany`, `hasCompany`, `recallStaff`, `staffAt`, `suggestName`
- [js/station/fabyard.js](../station/fabyard.js.md) — `hasCompany`, `company`
- [js/station/staffcare.js](../station/staffcare.js.md) — `company`, `bookSpend`
- [js/station/stafflife.js](../station/stafflife.js.md) — `company`
- [js/station/staffline.js](../station/staffline.js.md) — `company`, `hasCompany`, `payOffAndRecord`, `COMPANY`
- [js/station/stationdeck.js](../station/stationdeck.js.md) — `company`, `hasCompany`
- [js/station/stationlife.js](../station/stationlife.js.md) — `company`, `staffAt`
- [js/ui/creation.js](../ui/creation.js.md) — `resetCompany`
- [js/ui/hud.js](../ui/hud.js.md) — `wireCompany`
- test/ariabiz.test.mjs _(outside js/)_ — `company`, `hasCompany`, `resetCompany`, `COMPANY`, `CHARTERS`
- test/ariaplay.test.mjs _(outside js/)_ — `resetCompany`, `company`, `COMPANY`
- test/balance.test.mjs _(outside js/)_ — `COMPANY`
- test/board.test.mjs _(outside js/)_ — `company`, `foundCompany`, `transfer`, `resetCompany`, `settleAsStaff`, `staffAt`
- test/line.test.mjs _(outside js/)_ — `CO`
- test/orders.test.mjs _(outside js/)_ — `CO`
- test/people.test.mjs _(outside js/)_ — `company`, `foundCompany`, `transfer`, `tickCompany`, `contacts`, `boardBrief`, `resetCompany`, `COMPANY`
- test/stafflife.test.mjs _(outside js/)_ — `CO`
- test/systems.test.mjs _(outside js/)_ — `CO`

## Exports

- [`CHARTERS`](#s-CHARTERS) · const — used by [js/aria/company.js](../aria/company.js.md), [js/console/panels/corp.js](../console/panels/corp.js.md), [js/station/deckhall.js](../station/deckhall.js.md), test/ariabiz.test.mjs
- [`CHARTER_KEYS`](#s-CHARTER_KEYS) · const — used by [js/console/panels/corp.js](../console/panels/corp.js.md), [js/station/deckhall.js](../station/deckhall.js.md)
- [`BOARD`](#s-BOARD) · const — **no importer in scanned roots**
- [`COMPANY`](#s-COMPANY) · const — used by [js/aria/company.js](../aria/company.js.md), [js/console/panels/corp.js](../console/panels/corp.js.md), [js/station/deckhall.js](../station/deckhall.js.md), [js/station/staffline.js](../station/staffline.js.md), test/ariabiz.test.mjs, test/ariaplay.test.mjs, test/balance.test.mjs, test/people.test.mjs
- [`company`](#s-company) · const — used by [js/aria/company.js](../aria/company.js.md), [js/aria/pilot.js](../aria/pilot.js.md), [js/aria/play.js](../aria/play.js.md), [js/console/panels/corp-town.js](../console/panels/corp-town.js.md), [js/console/panels/corp.js](../console/panels/corp.js.md), [js/console/panels/crew.js](../console/panels/crew.js.md), [js/console/panels/work-drones.js](../console/panels/work-drones.js.md), [js/console/panels/work-fleet.js](../console/panels/work-fleet.js.md), [js/corp/fleet.js](fleet.js.md), [js/crew/family.js](../crew/family.js.md), [js/drones/ops.js](../drones/ops.js.md), [js/station/deckhall.js](../station/deckhall.js.md), [js/station/fabyard.js](../station/fabyard.js.md), [js/station/staffcare.js](../station/staffcare.js.md), [js/station/stafflife.js](../station/stafflife.js.md), [js/station/staffline.js](../station/staffline.js.md), [js/station/stationdeck.js](../station/stationdeck.js.md), [js/station/stationlife.js](../station/stationlife.js.md), test/ariabiz.test.mjs, test/ariaplay.test.mjs, test/board.test.mjs, test/people.test.mjs
- [`hasCompany`](#s-hasCompany) · function — used by [js/aria/company.js](../aria/company.js.md), [js/aria/pilot.js](../aria/pilot.js.md), [js/aria/play.js](../aria/play.js.md), [js/console/panels/corp-town.js](../console/panels/corp-town.js.md), [js/console/panels/corp.js](../console/panels/corp.js.md), [js/console/panels/crew.js](../console/panels/crew.js.md), [js/console/panels/work-drones.js](../console/panels/work-drones.js.md), [js/console/panels/work-fleet.js](../console/panels/work-fleet.js.md), [js/corp/fleet.js](fleet.js.md), [js/crew/family.js](../crew/family.js.md), [js/drones/ops.js](../drones/ops.js.md), [js/station/deckhall.js](../station/deckhall.js.md), [js/station/fabyard.js](../station/fabyard.js.md), [js/station/staffline.js](../station/staffline.js.md), [js/station/stationdeck.js](../station/stationdeck.js.md), test/ariabiz.test.mjs
- [`bookSpend`](#s-bookSpend) · function — used by [js/station/staffcare.js](../station/staffcare.js.md)
- [`suggestName`](#s-suggestName) · function — used by [js/aria/company.js](../aria/company.js.md), [js/console/panels/corp.js](../console/panels/corp.js.md), [js/station/deckhall.js](../station/deckhall.js.md)
- [`foundCompany`](#s-foundCompany) · function — used by [js/aria/company.js](../aria/company.js.md), [js/console/panels/corp.js](../console/panels/corp.js.md), [js/station/deckhall.js](../station/deckhall.js.md), test/board.test.mjs, test/people.test.mjs
- [`transfer`](#s-transfer) · function — used by [js/aria/company.js](../aria/company.js.md), [js/console/panels/corp.js](../console/panels/corp.js.md), test/board.test.mjs, test/people.test.mjs
- [`treasuryPay`](#s-treasuryPay) · function — used by [js/drones/ops.js](../drones/ops.js.md), [js/sim/sim.js](../sim/sim.js.md)
- [`treasuryEarn`](#s-treasuryEarn) · function — used by [js/drones/ops.js](../drones/ops.js.md)
- [`bookRevenue`](#s-bookRevenue) · function — used by [js/economy/contracts.js](../economy/contracts.js.md), [js/sim/sim.js](../sim/sim.js.md)
- [`staffIncome`](#s-staffIncome) · function — used by [js/aria/company.js](../aria/company.js.md)
- [`settleAsStaff`](#s-settleAsStaff) · function — used by [js/aria/company.js](../aria/company.js.md), [js/crew/family.js](../crew/family.js.md), test/board.test.mjs
- [`payOffAndRecord`](#s-payOffAndRecord) · function — used by [js/crew/family.js](../crew/family.js.md), [js/station/staffline.js](../station/staffline.js.md)
- [`contacts`](#s-contacts) · function — used by [js/console/panels/corp.js](../console/panels/corp.js.md), test/people.test.mjs
- [`staffAt`](#s-staffAt) · function — used by [js/console/panels/corp.js](../console/panels/corp.js.md), [js/console/panels/work-fleet.js](../console/panels/work-fleet.js.md), [js/corp/fleet.js](fleet.js.md), [js/station/deckhall.js](../station/deckhall.js.md), [js/station/stationlife.js](../station/stationlife.js.md), test/board.test.mjs
- [`recallStaff`](#s-recallStaff) · function — used by [js/station/deckhall.js](../station/deckhall.js.md)
- [`boardBrief`](#s-boardBrief) · function — used by [js/aria/company.js](../aria/company.js.md), [js/console/panels/corp.js](../console/panels/corp.js.md), test/people.test.mjs
- [`tickCompany`](#s-tickCompany) · function — used by [js/sim/sim.js](../sim/sim.js.md), test/people.test.mjs
- [`companyReport`](#s-companyReport) · function — **no importer in scanned roots**
- [`saveCompany`](#s-saveCompany) · const — used by [js/corp/fleet.js](fleet.js.md)
- [`flushCompany`](#s-flushCompany) · function — used by [js/main.js](../main.js.md)
- [`loadCompany`](#s-loadCompany) · function — used by [js/sim/sim.js](../sim/sim.js.md)
- [`resetCompany`](#s-resetCompany) · function — used by [js/ui/creation.js](../ui/creation.js.md), test/ariabiz.test.mjs, test/ariaplay.test.mjs, test/board.test.mjs, test/people.test.mjs
- [`serializeCompany`](#s-serializeCompany) · function — **no importer in scanned roots**
- [`restoreCompany`](#s-restoreCompany) · function — **no importer in scanned roots**
- [`wireCompany`](#s-wireCompany) · function — used by [js/ui/hud.js](../ui/hud.js.md)

## Effects

- **event.listen** — `pagehide on window → (inline)` (@file:262)
- **storage.get** — `‹SAVE_KEY›` (loadCompany:267)
- **storage.remove** — `‹SAVE_KEY›` (resetCompany:274)
- **storage.set** — `‹SAVE_KEY›` (flushSave:253)
- **timer** — `setTimeout` (save:257)

## Symbols

### <a id="s-CHARTERS"></a>`CHARTERS`

const · **exported** · L12–18

<!-- note:CHARTERS -->
<!-- /note -->

### <a id="s-CHARTER_KEYS"></a>`CHARTER_KEYS`

const · **exported** · L19–19

<!-- note:CHARTER_KEYS -->
<!-- /note -->

### <a id="s-BOARD"></a>`BOARD`

const · **exported** · L21–25

<!-- note:BOARD -->
<!-- /note -->

### <a id="s-COMPANY"></a>`COMPANY`

const · **exported** · L27–33

<!-- note:COMPANY -->
- L28 · `registration: 2500,` — credits the registrar wants
- L29 · `staffShare: 0.32,` — of a settled hand's list wage the company books every cycle (0.3.47: was 0.45 — money for nothing, forever)
- L30 · `dependantShare: 0.08,` — a child's stipend claimed from the port, per cycle
- L31 · `severance: 3,` — cycles of wage a pay-off costs
- L32 · `settleFee: 400,` — what a port charges to file a family
<!-- /note -->

### <a id="s-company"></a>`company`

const · **exported** · L35–50

<!-- note:company -->
- L40 · `hq: null,` — stationId of the registered office
- L41 · `hqSky: null,` — the sky that station is in — generated ids repeat across skies
- L43 · `book: [],` — { at, text, delta, kind }
- L47 · `staff: [],` — settled hands: { id, name, title, stationId, income, since, family: [ids], role }
- L48 · `alumni: [],` — paid off, recorded for future contact: { id, name, stationId, at, why, family: [ids] }
<!-- /note -->

### <a id="s-hasCompany"></a>`hasCompany()`

function · **exported** · L52–52

- called by: [`bizReport`](../aria/company.js.md#s-bizReport) _js/aria/company.js_ ×5 · [`considerFound`](../aria/company.js.md#s-considerFound) _js/aria/company.js_ · [`considerSettle`](../aria/company.js.md#s-considerSettle) _js/aria/company.js_ · [`considerTreasury`](../aria/company.js.md#s-considerTreasury) _js/aria/company.js_ · [`buildPlan`](../aria/pilot.js.md#s-buildPlan) _js/aria/pilot.js_ · [`netWorth`](../aria/play.js.md#s-netWorth) _js/aria/play.js_ · [`mountTown>paint`](../console/panels/corp-town.js.md#s-mountTown-paint) _js/console/panels/corp-town.js_ · [`mountTown>signature`](../console/panels/corp-town.js.md#s-mountTown-signature) _js/console/panels/corp-town.js_ ×2 · [`mountCompany`](../console/panels/corp.js.md#s-mountCompany) _js/console/panels/corp.js_ ×3 · [`search`](../console/panels/corp.js.md#s-search) _js/console/panels/corp.js_ ×2 · [`rosterCard`](../console/panels/crew.js.md#s-rosterCard) _js/console/panels/crew.js_ ×2 · [`buildSection`](../console/panels/work-drones.js.md#s-buildSection) _js/console/panels/work-drones.js_ ×2 · [`fleetSection`](../console/panels/work-fleet.js.md#s-fleetSection) _js/console/panels/work-fleet.js_ · [`yardSection`](../console/panels/work-fleet.js.md#s-yardSection) _js/console/panels/work-fleet.js_ · [`commissionBlocker`](fleet.js.md#s-commissionBlocker) _js/corp/fleet.js_ · [`resetFleet`](fleet.js.md#s-resetFleet) _js/corp/fleet.js_ · [`crewTopics`](../crew/family.js.md#s-crewTopics) _js/crew/family.js_ ×2 · [`buildOptions`](../drones/ops.js.md#s-buildOptions) _js/drones/ops.js_ · [`crewSection`](../station/deckhall.js.md#s-crewSection) _js/station/deckhall.js_ · [`hallPanel`](../station/deckhall.js.md#s-hallPanel) _js/station/deckhall.js_ · [`build`](../station/fabyard.js.md#s-build) _js/station/fabyard.js_ ×2 · [`lineSummary`](../station/staffline.js.md#s-lineSummary) _js/station/staffline.js_ · [`tickLine`](../station/staffline.js.md#s-tickLine) _js/station/staffline.js_ · [`@file`](../station/stationdeck.js.md#) _js/station/stationdeck.js_

<!-- note:hasCompany -->
<!-- /note -->

### <a id="s-inThisSky"></a>`inThisSky(e)`

function · L54–54

- called by: [`contacts`](#s-contacts) ×2 · [`staffAt`](#s-staffAt) · [`tickCompany`](#s-tickCompany)

<!-- note:inThisSky -->
staff and alumni are filed under sky-local station ids; entries from before skies were recorded match anywhere
<!-- /note -->

### <a id="s-book"></a>`book(text, delta, kind=)`

function · L56–61

- calls: [`save`](#s-save)
- called by: [`bookRevenue`](#s-bookRevenue) · [`bookSpend`](#s-bookSpend) · [`foundCompany`](#s-foundCompany) · [`payOffAndRecord`](#s-payOffAndRecord) · [`recallStaff`](#s-recallStaff) · [`settleAsStaff`](#s-settleAsStaff) · [`tickCompany`](#s-tickCompany) ×2 · [`transfer`](#s-transfer) ×2 · [`treasuryEarn`](#s-treasuryEarn) · [`treasuryPay`](#s-treasuryPay)

<!-- note:book -->
<!-- /note -->

### <a id="s-bookSpend"></a>`bookSpend(text, amount, kind=)`

function · **exported** · L63–63

- calls: [`book`](#s-book)
- called by: [`payFrom`](../station/staffcare.js.md#s-payFrom) _js/station/staffcare.js_ ×2

<!-- note:bookSpend -->
0.3.53: a line of spending from the care menu (js/station/staffcare.js).
<!-- /note -->

### <a id="s-suggestName"></a>`suggestName()`

function · **exported** · L65–70

- called by: [`considerFound`](../aria/company.js.md#s-considerFound) _js/aria/company.js_ · [`mountCompany`](../console/panels/corp.js.md#s-mountCompany) _js/console/panels/corp.js_ · [`foundCompany`](#s-foundCompany) · [`registrarSection`](../station/deckhall.js.md#s-registrarSection) _js/station/deckhall.js_

<!-- note:suggestName -->
<!-- /note -->

### <a id="s-foundCompany"></a>`foundCompany(name, charter=)`

function · **exported** · L72–97

- calls: [`book`](#s-book) · [`suggestName`](#s-suggestName) · [`adjustStanding`](corps.js.md#s-adjustStanding) _js/corp/corps.js_ · [`corpOfStation`](corps.js.md#s-corpOfStation) _js/corp/corps.js_ · [`logEvent`](../sim/sim.js.md#s-logEvent) _js/sim/sim.js_ · [`stationById`](../station/stations.js.md#s-stationById) _js/station/stations.js_
- called by: [`considerFound`](../aria/company.js.md#s-considerFound) _js/aria/company.js_ · [`mountCompany`](../console/panels/corp.js.md#s-mountCompany) _js/console/panels/corp.js_ · [`registrarSection`](../station/deckhall.js.md#s-registrarSection) _js/station/deckhall.js_

<!-- note:foundCompany -->
Incorporate at the port you are clamped to. Returns null or the reason it failed.
<!-- /note -->

### <a id="s-transfer"></a>`transfer(amount)`

function · **exported** · L99–112

- calls: [`book`](#s-book) ×2
- called by: [`considerTreasury`](../aria/company.js.md#s-considerTreasury) _js/aria/company.js_ ×2 · [`mountCompany`](../console/panels/corp.js.md#s-mountCompany) _js/console/panels/corp.js_ ×2

<!-- note:transfer -->
Move money between your pocket and the treasury (negative = draw).
<!-- /note -->

### <a id="s-treasuryPay"></a>`treasuryPay(amount, text, kind=)`

function · **exported** · L114–120

- calls: [`book`](#s-book)
- called by: [`ROLE_STEP.courier`](../drones/ops.js.md#s-ROLE_STEP-courier) _js/drones/ops.js_ · [`orderBuild`](../drones/ops.js.md#s-orderBuild) _js/drones/ops.js_ · [`pay`](../sim/sim.js.md#s-pay) _js/sim/sim.js_

<!-- note:treasuryPay -->
Pay from the treasury (drones, commissions). Returns why not, or null.
<!-- /note -->

### <a id="s-treasuryEarn"></a>`treasuryEarn(amount, text, kind=)`

function · **exported** · L122–127

- calls: [`book`](#s-book)
- called by: [`ROLE_STEP.combat`](../drones/ops.js.md#s-ROLE_STEP-combat) _js/drones/ops.js_ · [`ROLE_STEP.courier`](../drones/ops.js.md#s-ROLE_STEP-courier) _js/drones/ops.js_ · [`destroy`](../drones/ops.js.md#s-destroy) _js/drones/ops.js_ · [`runFreight`](../drones/ops.js.md#s-runFreight) _js/drones/ops.js_ · [`scrapDrone`](../drones/ops.js.md#s-scrapDrone) _js/drones/ops.js_

<!-- note:treasuryEarn -->
Money the company's drones and hulls bring in lands in the treasury, not your pocket.
<!-- /note -->

### <a id="s-bookRevenue"></a>`bookRevenue(kind, amount, text)`

function · **exported** · L129–134

- calls: [`book`](#s-book)
- called by: [`settle`](../economy/contracts.js.md#s-settle) _js/economy/contracts.js_ ×2 · [`onKill`](../sim/sim.js.md#s-onKill) _js/sim/sim.js_ · [`tradeSell`](../sim/sim.js.md#s-tradeSell) _js/sim/sim.js_

<!-- note:bookRevenue -->
Revenue the pilot earns that the charter covers (or does not). sim.js calls this from trade and bounties.
<!-- /note -->

### <a id="s-staffIncome"></a>`staffIncome(m)`

function · **exported** · L136–139

- calls: [`wageFor`](../crew/ledger.js.md#s-wageFor) _js/crew/ledger.js_
- called by: [`considerSettle`](../aria/company.js.md#s-considerSettle) _js/aria/company.js_ · [`settleAsStaff`](#s-settleAsStaff)

<!-- note:staffIncome -->
---- people ---------------------------------------------------------------

A settled hand's cycle income to the company.
<!-- /note -->

### <a id="s-settleAsStaff"></a>`settleAsStaff(m, family=, st=)`

function · **exported** · L141–156

- calls: [`book`](#s-book) · [`staffIncome`](#s-staffIncome) · [`wageFor`](../crew/ledger.js.md#s-wageFor) _js/crew/ledger.js_ · [`logEvent`](../sim/sim.js.md#s-logEvent) _js/sim/sim.js_ · [`stationById`](../station/stations.js.md#s-stationById) _js/station/stations.js_
- via [js/npc/cradle.js](../npc/cradle.js.md): `cradle.get`, `cradle.note`
- called by: [`considerSettle`](../aria/company.js.md#s-considerSettle) _js/aria/company.js_ · [`settleFamily`](../crew/family.js.md#s-settleFamily) _js/crew/family.js_

<!-- note:settleAsStaff -->
Settle a crew member (and whoever is theirs) at a port as company staff.
They earn the company a share of a wage every cycle and stay on the books.

- L148 · `const listWage = m.listWage ?? m.wage ?? wageFor(m.complexId, m.letter);` — 0.3.46: what they thought of you aboard comes ashore with them — the
  company line (js/station/staffline.js) reads it as their regard for the firm
<!-- /note -->

### <a id="s-payOffAndRecord"></a>`payOffAndRecord(m, family=, why=, st=)`

function · **exported** · L158–172

- calls: [`book`](#s-book) · [`wageFor`](../crew/ledger.js.md#s-wageFor) _js/crew/ledger.js_ · [`logEvent`](../sim/sim.js.md#s-logEvent) _js/sim/sim.js_ · [`stationById`](../station/stations.js.md#s-stationById) _js/station/stations.js_
- via [js/npc/cradle.js](../npc/cradle.js.md): `cradle.get`, `cradle.note`
- called by: [`settleFamily`](../crew/family.js.md#s-settleFamily) _js/crew/family.js_ · [`TOPICS.run~8`](../station/staffline.js.md#s-TOPICS-run-8) _js/station/staffline.js_

<!-- note:payOffAndRecord -->
Pay someone off and let them go, but keep the address.
<!-- /note -->

### <a id="s-contacts"></a>`contacts()`

function · **exported** · L174–179

- calls: [`inThisSky`](#s-inThisSky) ×2 · [`stationById`](../station/stations.js.md#s-stationById) _js/station/stations.js_ ×2
- called by: [`mountCompany`](../console/panels/corp.js.md#s-mountCompany) _js/console/panels/corp.js_

<!-- note:contacts -->
Everyone the company can still reach: staff at their ports, alumni where they were last seen.
<!-- /note -->

### <a id="s-staffAt"></a>`staffAt(stId)`

function · **exported** · L181–183

- calls: [`inThisSky`](#s-inThisSky)
- called by: [`mountCompany`](../console/panels/corp.js.md#s-mountCompany) _js/console/panels/corp.js_ · [`yardSection`](../console/panels/work-fleet.js.md#s-yardSection) _js/console/panels/work-fleet.js_ · [`commissionBlocker`](fleet.js.md#s-commissionBlocker) _js/corp/fleet.js_ · [`commissionHull`](fleet.js.md#s-commissionHull) _js/corp/fleet.js_ · [`floorSection`](../station/deckhall.js.md#s-floorSection) _js/station/deckhall.js_ · [`EVENTS.run~4`](../station/stationlife.js.md#s-EVENTS-run-4) _js/station/stationlife.js_ · [`EVENTS.run~6`](../station/stationlife.js.md#s-EVENTS-run-6) _js/station/stationlife.js_ · [`kill`](../station/stationlife.js.md#s-kill) _js/station/stationlife.js_

<!-- note:staffAt -->
Staff at this port who could be re-signed (walk into the hall and they come back aboard).

- L182 · `return company.staff.filter((s) => s.stationId === stId && inThisSky(s) && !s.transit);` — 0.3.46: not while on a liner
<!-- /note -->

### <a id="s-recallStaff"></a>`recallStaff(id)`

function · **exported** · L185–193

- calls: [`book`](#s-book)
- via [js/npc/cradle.js](../npc/cradle.js.md): `cradle.get`, `cradle.note`
- called by: [`floorSection`](../station/deckhall.js.md#s-floorSection) _js/station/deckhall.js_

<!-- note:recallStaff -->
Take a settled hand back aboard.
<!-- /note -->

### <a id="s-boardBrief"></a>`boardBrief()`

function · **exported** · L195–207

- calls: [`cutOf`](../station/staffline.js.md#s-cutOf) _js/station/staffline.js_ · [`incomeOf`](../station/stationlife.js.md#s-incomeOf) _js/station/stationlife.js_
- called by: [`bizReport`](../aria/company.js.md#s-bizReport) _js/aria/company.js_ · [`mountCompany`](../console/panels/corp.js.md#s-mountCompany) _js/console/panels/corp.js_ · [`companyReport`](#s-companyReport) · [`tickCompany`](#s-tickCompany)

<!-- note:boardBrief -->
---- the board -------------------------------------------------------------
<!-- /note -->

### <a id="s-tickCompany"></a>`tickCompany(seconds)`

function · **exported** · L209–236

- calls: [`boardBrief`](#s-boardBrief) · [`book`](#s-book) ×2 · [`inThisSky`](#s-inThisSky) · [`cyclePay`](../station/stafflife.js.md#s-cyclePay) _js/station/stafflife.js_ · [`housingCost`](../station/stafflife.js.md#s-housingCost) _js/station/stafflife.js_ · [`takeWorked`](../station/stafflife.js.md#s-takeWorked) _js/station/stafflife.js_ · [`tickStaffHour`](../station/stafflife.js.md#s-tickStaffHour) _js/station/stafflife.js_ · [`cutOf`](../station/staffline.js.md#s-cutOf) _js/station/staffline.js_ · [`tickLine`](../station/staffline.js.md#s-tickLine) _js/station/staffline.js_ · [`incomeOf`](../station/stationlife.js.md#s-incomeOf) _js/station/stationlife.js_ · [`tickStationLife`](../station/stationlife.js.md#s-tickStationLife) _js/station/stationlife.js_
- called by: [`stepCareer`](../sim/sim.js.md#s-stepCareer) _js/sim/sim.js_

<!-- note:tickCompany -->
Every cycle: staff earn, dependants draw, the board re-reads the record.

- L211 · `company.hourPool = (company.hourPool ?? 0) + seconds;` — 0.3.52: the hours first — people go to work, eat and sleep on port time
  (js/station/stafflife.js) — then the cycle pays for what they did in them
- L222 · `if (!inThisSky(s)) continue;` — their port is in a sky that is not loaded; the books catch up when it is
- L223 · `if (s.transit) continue;` — 0.3.46: nobody earns on a liner
- L224 · `earned += Math.round(cyclePay(incomeOf(s) * cutOf(s), takeWorked(s)));` — 0.3.46: a raise on the company line is their share, out of ours.
  0.3.52: a retainer, and the rest for the hours they actually worked
- L225 · `earned += Math.round((s.family?.length ?? 0) * s.income * COMPANY.dependantShare);` — the port pays a stipend for every child on the books — a company town in miniature
- L230 · `tickStationLife();` — and then they get on with their lives — and pick up the phone
<!-- /note -->

### <a id="s-companyReport"></a>`companyReport()`

function · **exported** · L238–246

- calls: [`boardBrief`](#s-boardBrief) · [`stationById`](../station/stations.js.md#s-stationById) _js/station/stations.js_

<!-- note:companyReport -->
<!-- /note -->

### <a id="s-SAVE_KEY"></a>`SAVE_KEY`

const · L248–248

<!-- note:SAVE_KEY -->
the company is the pilot's, not the sky's: it lives in localStorage beside the save
<!-- /note -->

### <a id="s-loaded"></a>`loaded`

const · L249–249

<!-- note:loaded -->
<!-- /note -->

### <a id="s-saveTimer"></a>`saveTimer`

const · L250–250

<!-- note:saveTimer -->
<!-- /note -->

### <a id="s-flushSave"></a>`flushSave()`

function · L251–254

- calls: [`serializeCompany`](#s-serializeCompany)
- called by: [`@file`](#) · [`flushCompany`](#s-flushCompany)
- effects: storage.set `‹SAVE_KEY›`

<!-- note:flushSave -->
- L253 · `try { localStorage.setItem(SAVE_KEY, JSON.stringify(serializeCompany())); } catch {` — quota, or no window
<!-- /note -->

### <a id="s-save"></a>`save()`

function · L255–259

- called by: [`book`](#s-book)
- effects: timer `setTimeout`

<!-- note:save -->
the book writes a line per credit moved: coalesce the stringify, and flush before the tab goes

- L258 · `saveTimer.unref?.();` — node: do not hold the process open for a save
<!-- /note -->

### <a id="s-saveCompany"></a>`saveCompany`

const · **exported** · L260–260

- called by: [`saveFleet`](fleet.js.md#s-saveFleet) _js/corp/fleet.js_

<!-- note:saveCompany -->
<!-- /note -->

### <a id="s-flushCompany"></a>`flushCompany()`

function · **exported** · L261–261

- calls: [`flushSave`](#s-flushSave)

<!-- note:flushCompany -->
Write a pending debounced save now (the account sync snapshots storage and must not read a 1.5 s-old book).
<!-- /note -->

### <a id="s-loadCompany"></a>`loadCompany()`

function · **exported** · L263–270

- calls: [`restoreCompany`](#s-restoreCompany)
- called by: [`launchSim`](../sim/sim.js.md#s-launchSim) _js/sim/sim.js_
- effects: storage.get `‹SAVE_KEY›`

<!-- note:loadCompany -->
- L269 · `} catch {` — corrupt or absent
<!-- /note -->

### <a id="s-resetCompany"></a>`resetCompany()`

function · **exported** · L272–281

- calls: [`resetStationLife`](../station/stationlife.js.md#s-resetStationLife) _js/station/stationlife.js_
- called by: [`mountCreation>finish`](../ui/creation.js.md#s-mountCreation-finish) _js/ui/creation.js_
- effects: storage.remove `‹SAVE_KEY›`

<!-- note:resetCompany -->
- L274 · `try { localStorage.removeItem(SAVE_KEY); } catch {` — ignore
<!-- /note -->

### <a id="s-serializeCompany"></a>`serializeCompany()`

function · **exported** · L283–287

- via [js/station/stationlife.js](../station/stationlife.js.md): `stationLife.log.slice`
- called by: [`flushSave`](#s-flushSave)

<!-- note:serializeCompany -->
0.3.46: the towns ride in the company's save. Households, the children
growing up on the stations and the town log were never written anywhere, so
a reload quietly un-married everybody and the kids were gone. Same key, no
new storage: they are the company's people.
<!-- /note -->

### <a id="s-restoreCompany"></a>`restoreCompany(data)`

function · **exported** · L288–309

- calls: [`wageFor`](../crew/ledger.js.md#s-wageFor) _js/crew/ledger.js_ · [`incomeOf`](../station/stationlife.js.md#s-incomeOf) _js/station/stationlife.js_
- via [js/station/stationlife.js](../station/stationlife.js.md): `stationLife.kids.splice`, `stationLife.log.splice`
- called by: [`loadCompany`](#s-loadCompany)

<!-- note:restoreCompany -->
- L292 · `company.shareV = rest.shareV ?? null;` — a save from before the stamp has none
- L293 · `if (company.shareV !== COMPANY.staffShare) {` — 0.3.49: 0.3.47 cut the staff share 45% → 32%, but only for hands settled
  after it; everyone already on the rolls kept booking 45% forever. Re-rate
  them once, off their list wage. Station-born family keep their own number.
<!-- /note -->

### <a id="s-wireCompany"></a>`wireCompany()`

function · **exported** · L311–313

- called by: [`mountHud`](../ui/hud.js.md#s-mountHud) _js/ui/hud.js_

<!-- note:wireCompany -->
Console access.
<!-- /note -->

## Module-level calls

- calls: [`flushSave`](#s-flushSave)
