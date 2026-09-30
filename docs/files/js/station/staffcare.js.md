# js/station/staffcare.js

[index](../../../README.md) · 179 lines · 32 symbols · 6 imports · 3 importers

## About

<!-- note:@file -->
LIVING GALAXY — the settled hand's menu: their work, their home, their care (0.3.53).

0.3.52 gave every settled hand a working day; this is what you can do about
it. The same model drives both places you reach them — the port's HALL, in
station style, when you are standing on their floor, and CON › CORP › TOWN
over the company line from anywhere in the sky:

  WORK    the JOB they do at their port (by sector), the SHIFT they keep
          (nights pay 15% more an hour, swing 5%), and their HOURS
          (standard 8, overtime 10, part-time 5). Changing any of it is felt:
          a curious hand likes a new job, a greedy one likes overtime, most
          people do not like being moved to nights.
  HOME    a bunk (free), a private cabin or family quarters — a better bed
          sleeps them better and lifts their mood every hour, and costs the
          company every cycle.
  CARE    a DAY OFF (their next shift given back, once a day), STAND THEM A
          MEAL, A NIGHT OUT, or SEND THEM ON A COURSE — their next shift
          spent training; each course lifts what an hour of their work is
          worth by 6%, three at most.

Money comes out of the company treasury, or your pocket when it is dry.
Everything lands in their day log. No DOM.
<!-- /note -->

## Imports

| line | from | names | target |
|---|---|---|---|
| 1 | `../corp/company.js` | `company`, `bookSpend` | [js/corp/company.js](../corp/company.js.md) |
| 2 | `../sim/sim.js` | `sim` | [js/sim/sim.js](../sim/sim.js.md) |
| 3 | `./stations.js` | `stationById` | [js/station/stations.js](stations.js.md) |
| 4 | `./stationlife.js` | `incomeOf` | [js/station/stationlife.js](stationlife.js.md) |
| 5 | `./stafflife.js` | `HOURS`, `HOUSING`, `SHIFT_PAY`, `ensureLife`, `jobsFor`, `log` | [js/station/stafflife.js](stafflife.js.md) |
| 6 | `./stationclock.js` | `SHIFTS`, `SHIFT_IDS`, `CLOCK`, `clockAt`, `hoursAt`, `hoursIntoShift` | [js/station/stationclock.js](stationclock.js.md) |

## Imported by

- [js/console/panels/corp-town.js](../console/panels/corp-town.js.md) — `CARE`, `careAct`, `setHousing`, `setHours`, `setJob`, `setShift`, `termsLine`, `workOptions`
- [js/station/deckhall.js](deckhall.js.md) — `CARE`, `careAct`, `setHousing`, `setHours`, `setJob`, `setShift`, `termsLine`, `workOptions`
- test/orders.test.mjs _(outside js/)_ — `CARE`

## Exports

- [`CARE_COST`](#s-CARE_COST) · const — **no importer in scanned roots**
- [`workOptions`](#s-workOptions) · function — used by [js/console/panels/corp-town.js](../console/panels/corp-town.js.md), [js/station/deckhall.js](deckhall.js.md)
- [`setJob`](#s-setJob) · function — used by [js/console/panels/corp-town.js](../console/panels/corp-town.js.md), [js/station/deckhall.js](deckhall.js.md)
- [`setShift`](#s-setShift) · function — used by [js/console/panels/corp-town.js](../console/panels/corp-town.js.md), [js/station/deckhall.js](deckhall.js.md)
- [`setHours`](#s-setHours) · function — used by [js/console/panels/corp-town.js](../console/panels/corp-town.js.md), [js/station/deckhall.js](deckhall.js.md)
- [`setHousing`](#s-setHousing) · function — used by [js/console/panels/corp-town.js](../console/panels/corp-town.js.md), [js/station/deckhall.js](deckhall.js.md)
- [`CARE`](#s-CARE) · const — used by [js/console/panels/corp-town.js](../console/panels/corp-town.js.md), [js/station/deckhall.js](deckhall.js.md), test/orders.test.mjs
- [`courseCost`](#s-courseCost) · function — **no importer in scanned roots**
- [`careById`](#s-careById) · function — **no importer in scanned roots**
- [`careAct`](#s-careAct) · function — used by [js/console/panels/corp-town.js](../console/panels/corp-town.js.md), [js/station/deckhall.js](deckhall.js.md)
- [`termsLine`](#s-termsLine) · function — used by [js/console/panels/corp-town.js](../console/panels/corp-town.js.md), [js/station/deckhall.js](deckhall.js.md)

## Effects

_none detected_

## Symbols

### <a id="s-CARE_COST"></a>`CARE_COST`

const · **exported** · L8–8

<!-- note:CARE_COST -->
<!-- /note -->

### <a id="s-first"></a>`first(s)`

function · L9–9

- called by: [`CARE.run`](#s-CARE-run) ×2 · [`CARE.run~2`](#s-CARE-run-2) · [`CARE.run~3`](#s-CARE-run-3) · [`CARE.run~4`](#s-CARE-run-4) ×2

<!-- note:first -->
<!-- /note -->

### <a id="s-tr"></a>`tr(s, k)`

function · L10–10

- called by: [`CARE.run`](#s-CARE-run) · [`CARE.run~4`](#s-CARE-run-4) · [`setHours`](#s-setHours) · [`setJob`](#s-setJob) · [`setShift`](#s-setShift)

<!-- note:tr -->
<!-- /note -->

### <a id="s-mood"></a>`mood(s, d)`

function · L11–11

- called by: [`CARE.run`](#s-CARE-run) · [`CARE.run~2`](#s-CARE-run-2) · [`CARE.run~3`](#s-CARE-run-3) · [`CARE.run~4`](#s-CARE-run-4) · [`setHours`](#s-setHours) · [`setHousing`](#s-setHousing) · [`setJob`](#s-setJob) · [`setShift`](#s-setShift)

<!-- note:mood -->
<!-- /note -->

### <a id="s-H"></a>`H()`

function · L12–12

- calls: [`hoursAt`](stationclock.js.md#s-hoursAt) _js/station/stationclock.js_
- called by: [`CARE.ok~2`](#s-CARE-ok-2) · [`CARE.run~2`](#s-CARE-run-2) · [`dayIx`](#s-dayIx) · [`nextShift`](#s-nextShift) ×3

<!-- note:H -->
<!-- /note -->

### <a id="s-dayIx"></a>`dayIx()`

function · L13–13

- calls: [`H`](#s-H)
- called by: [`CARE.ok`](#s-CARE-ok) · [`CARE.ok~3`](#s-CARE-ok-3) · [`CARE.run`](#s-CARE-run) · [`CARE.run~3`](#s-CARE-run-3)

<!-- note:dayIx -->
<!-- /note -->

### <a id="s-canPay"></a>`canPay(n)`

function · L15–15

- called by: [`CARE.ok~2`](#s-CARE-ok-2) · [`CARE.ok~3`](#s-CARE-ok-3) · [`CARE.ok~4`](#s-CARE-ok-4)

<!-- note:canPay -->
<!-- /note -->

### <a id="s-payFrom"></a>`payFrom(n, text)`

function · L16–20

- calls: [`bookSpend`](../corp/company.js.md#s-bookSpend) _js/corp/company.js_ ×2
- called by: [`CARE.run~2`](#s-CARE-run-2) · [`CARE.run~3`](#s-CARE-run-3) · [`CARE.run~4`](#s-CARE-run-4)

<!-- note:payFrom -->
<!-- /note -->

### <a id="s-note"></a>`note(s, text)`

function · L21–21

- calls: [`log`](stafflife.js.md#s-log) _js/station/stafflife.js_ · [`clockAt`](stationclock.js.md#s-clockAt) _js/station/stationclock.js_
- called by: [`CARE.run`](#s-CARE-run) · [`CARE.run~2`](#s-CARE-run-2) · [`CARE.run~3`](#s-CARE-run-3) · [`CARE.run~4`](#s-CARE-run-4) · [`setHours`](#s-setHours) · [`setHousing`](#s-setHousing) · [`setJob`](#s-setJob) · [`setShift`](#s-setShift)

<!-- note:note -->
<!-- /note -->

### <a id="s-workOptions"></a>`workOptions(s)`

function · **exported** · L23–32

- calls: [`ensureLife`](stafflife.js.md#s-ensureLife) _js/station/stafflife.js_ · [`jobsFor`](stafflife.js.md#s-jobsFor) _js/station/stafflife.js_ · [`stationById`](stations.js.md#s-stationById) _js/station/stations.js_
- via [js/station/stationclock.js](stationclock.js.md): `SHIFT_IDS.map`
- called by: [`careBlock`](../console/panels/corp-town.js.md#s-careBlock) _js/console/panels/corp-town.js_ · [`careBlock`](deckhall.js.md#s-careBlock) _js/station/deckhall.js_

<!-- note:workOptions -->
---- WORK and HOME ------------------------------------------------------------

The choices, for a screen.
<!-- /note -->

### <a id="s-setJob"></a>`setJob(s, job)`

function · **exported** · L34–43

- calls: [`mood`](#s-mood) · [`note`](#s-note) · [`tr`](#s-tr) · [`ensureLife`](stafflife.js.md#s-ensureLife) _js/station/stafflife.js_ · [`jobsFor`](stafflife.js.md#s-jobsFor) _js/station/stafflife.js_ · [`stationById`](stations.js.md#s-stationById) _js/station/stations.js_
- via [js/station/stafflife.js](stafflife.js.md): `jobsFor.includes`

<!-- note:setJob -->
Put them on another job at their port. → null or why not
<!-- /note -->

### <a id="s-setShift"></a>`setShift(s, shift)`

function · **exported** · L45–55

- calls: [`mood`](#s-mood) · [`note`](#s-note) · [`tr`](#s-tr) · [`ensureLife`](stafflife.js.md#s-ensureLife) _js/station/stafflife.js_

<!-- note:setShift -->
Move them to another shift. Nights pay more; most people do not like them.
<!-- /note -->

### <a id="s-setHours"></a>`setHours(s, hours)`

function · **exported** · L57–66

- calls: [`mood`](#s-mood) · [`note`](#s-note) · [`tr`](#s-tr) · [`ensureLife`](stafflife.js.md#s-ensureLife) _js/station/stafflife.js_
- via [js/station/stafflife.js](stafflife.js.md): `HOURS[…].label.toLowerCase`

<!-- note:setHours -->
Standard, overtime or part-time.
<!-- /note -->

### <a id="s-setHousing"></a>`setHousing(s, housing)`

function · **exported** · L68–78

- calls: [`mood`](#s-mood) · [`note`](#s-note) · [`ensureLife`](stafflife.js.md#s-ensureLife) _js/station/stafflife.js_

<!-- note:setHousing -->
Where they sleep. The company pays for anything better than a bunk.
<!-- /note -->

### <a id="s-nextShift"></a>`nextShift(s)`

function · L80–86

- calls: [`H`](#s-H) ×3 · [`hoursIntoShift`](stationclock.js.md#s-hoursIntoShift) _js/station/stationclock.js_
- called by: [`CARE.run`](#s-CARE-run) · [`CARE.run~4`](#s-CARE-run-4)

<!-- note:nextShift -->
---- CARE ------------------------------------------------------------------------

The absolute hours of their next shift start, from now.

- L83 · `const from = into < 1 ? H() - into : H() + (CLOCK.dayH - into);` — the shift just starting counts as the next one; one already under way does not
- L84 · `const at = Math.round(from);` — shifts start on the hour
<!-- /note -->

### <a id="s-CARE"></a>`CARE`

const · **exported** · L88–160

<!-- note:CARE -->
<!-- /note -->

#### <a id="s-CARE-hint"></a>`CARE.hint()`

prop · L91–91

<!-- note:CARE.hint -->
<!-- /note -->

#### <a id="s-CARE-ok"></a>`CARE.ok(s)`

prop · L92–97

- calls: [`dayIx`](#s-dayIx)

<!-- note:CARE.ok -->
<!-- /note -->

#### <a id="s-CARE-run"></a>`CARE.run(s)`

prop · L98–105

- calls: [`dayIx`](#s-dayIx) · [`first`](#s-first) ×2 · [`mood`](#s-mood) · [`nextShift`](#s-nextShift) · [`note`](#s-note) · [`tr`](#s-tr)

<!-- note:CARE.run -->
<!-- /note -->

#### <a id="s-CARE-hint-2"></a>`CARE.hint~2()`

prop · L109–109

<!-- note:CARE.hint~2 -->
<!-- /note -->

#### <a id="s-CARE-ok-2"></a>`CARE.ok~2(s)`

prop · L110–114

- calls: [`canPay`](#s-canPay) · [`H`](#s-H)

<!-- note:CARE.ok~2 -->
<!-- /note -->

#### <a id="s-CARE-run-2"></a>`CARE.run~2(s)`

prop · L115–123

- calls: [`first`](#s-first) · [`H`](#s-H) · [`mood`](#s-mood) · [`note`](#s-note) · [`payFrom`](#s-payFrom)

<!-- note:CARE.run~2 -->
<!-- /note -->

#### <a id="s-CARE-hint-3"></a>`CARE.hint~3()`

prop · L127–127

<!-- note:CARE.hint~3 -->
<!-- /note -->

#### <a id="s-CARE-ok-3"></a>`CARE.ok~3(s)`

prop · L128–132

- calls: [`canPay`](#s-canPay) · [`dayIx`](#s-dayIx)

<!-- note:CARE.ok~3 -->
<!-- /note -->

#### <a id="s-CARE-run-3"></a>`CARE.run~3(s)`

prop · L133–141

- calls: [`dayIx`](#s-dayIx) · [`first`](#s-first) · [`mood`](#s-mood) · [`note`](#s-note) · [`payFrom`](#s-payFrom)

<!-- note:CARE.run~3 -->
<!-- /note -->

#### <a id="s-CARE-hint-4"></a>`CARE.hint~4(s)`

prop · L145–145

- calls: [`courseCost`](#s-courseCost)

<!-- note:CARE.hint~4 -->
<!-- /note -->

#### <a id="s-CARE-ok-4"></a>`CARE.ok~4(s)`

prop · L146–151

- calls: [`canPay`](#s-canPay) · [`courseCost`](#s-courseCost) ×2

<!-- note:CARE.ok~4 -->
<!-- /note -->

#### <a id="s-CARE-run-4"></a>`CARE.run~4(s)`

prop · L152–158

- calls: [`courseCost`](#s-courseCost) · [`first`](#s-first) ×2 · [`mood`](#s-mood) · [`nextShift`](#s-nextShift) · [`note`](#s-note) · [`payFrom`](#s-payFrom) · [`tr`](#s-tr)

<!-- note:CARE.run~4 -->
<!-- /note -->

### <a id="s-courseCost"></a>`courseCost(s)`

function · **exported** · L162–162

- calls: [`incomeOf`](stationlife.js.md#s-incomeOf) _js/station/stationlife.js_
- called by: [`CARE.hint~4`](#s-CARE-hint-4) · [`CARE.ok~4`](#s-CARE-ok-4) ×2 · [`CARE.run~4`](#s-CARE-run-4)

<!-- note:courseCost -->
<!-- /note -->

### <a id="s-careById"></a>`careById(id)`

function · **exported** · L163–163

- called by: [`careAct`](#s-careAct)

<!-- note:careById -->
<!-- /note -->

### <a id="s-careAct"></a>`careAct(s, id)`

function · **exported** · L165–174

- calls: [`careById`](#s-careById) · [`ensureLife`](stafflife.js.md#s-ensureLife) _js/station/stafflife.js_
- via [js/corp/company.js](../corp/company.js.md): `company.staff.includes`
- called by: [`careBlock`](../console/panels/corp-town.js.md#s-careBlock) _js/console/panels/corp-town.js_ · [`careBlock`](deckhall.js.md#s-careBlock) _js/station/deckhall.js_

<!-- note:careAct -->
Do one CARE thing. → { ok, why?, line? }
<!-- /note -->

### <a id="s-termsLine"></a>`termsLine(s)`

function · **exported** · L176–179

- calls: [`ensureLife`](stafflife.js.md#s-ensureLife) _js/station/stafflife.js_
- called by: [`careBlock`](../console/panels/corp-town.js.md#s-careBlock) _js/console/panels/corp-town.js_ · [`careBlock`](deckhall.js.md#s-careBlock) _js/station/deckhall.js_

<!-- note:termsLine -->
One line of where they stand: shift, hours, home, courses.
<!-- /note -->
