# js/station/stafflife.js

[index](../../../README.md) · 217 lines · 28 symbols · 6 imports · 9 importers

## About

<!-- note:@file -->
LIVING GALAXY — a working life on the station (0.3.52).

Until now a settled hand was a number that arrived every 90 seconds and a
roll for an event. They never went to work, never slept, never ate, never
went home. This is the hour-by-hour half of their life, on port standard
time (js/station/stationclock.js):

  SHIFT      each member works a shift — day 06–14, swing 14–22, night
             22–06 — on a real job at their port (the smelter line, the
             cross-dock, the clinic …). HOURS set how long: standard 8,
             overtime 10, part-time 5.
  THE DAY    work → a meal → their own time (with their partner and kids if
             they have them, somewhere that suits them if not) → supper →
             eight hours asleep. A night-shift hand sleeps through the day.
  NEEDS      tired, hungry, lonely — each rises and falls with what they are
             doing, and each leans on their mood a little every hour.
  PAY        the company books a retainer every cycle (30% of their share)
             and the rest for the HOURS ACTUALLY WORKED, at a productivity
             read off their mood and how tired they are. On average it is
             the same money as before; it arrives when they work.
  THE PORT   a hand on shift adds to their port's production lines (a few
             percent each, capped), so a company town makes its port busier.
  A LOG      every change of what they are doing is written down, so
             "what did Tala do today" has an answer.

The rolls in stationlife.js read this too: accidents happen at work, not in
bed.
<!-- /note -->

## Imports

| line | from | names | target |
|---|---|---|---|
| 1 | `../corp/company.js` | `company` | [js/corp/company.js](../corp/company.js.md) |
| 2 | `../sim/sim.js` | `sim` | [js/sim/sim.js](../sim/sim.js.md) |
| 3 | `./stations.js` | `stationById` | [js/station/stations.js](stations.js.md) |
| 4 | `./stationlife.js` | `stationLife` | [js/station/stationlife.js](stationlife.js.md) |
| 5 | `../npc/cradle.js` | `cradle` | [js/npc/cradle.js](../npc/cradle.js.md) |
| 6 | `./stationclock.js` | `clockAt`, `hoursAt`, `hoursIntoShift`, `SHIFTS`, `SHIFT_IDS`, `CLOCK` | [js/station/stationclock.js](stationclock.js.md) |

## Imported by

- [js/console/panels/corp-town.js](../console/panels/corp-town.js.md) — `lifeLine`, `needsLine`, `dayLogOf`
- [js/corp/company.js](../corp/company.js.md) — `tickStaffHour`, `takeWorked`, `cyclePay`, `housingCost`
- [js/sim/sim.js](../sim/sim.js.md) — `labourAt`
- [js/station/deckhall.js](deckhall.js.md) — `lifeLine`, `needsLine`, `dayLogOf`
- [js/station/staffcare.js](staffcare.js.md) — `HOURS`, `HOUSING`, `SHIFT_PAY`, `ensureLife`, `jobsFor`, `log`
- [js/station/staffline.js](staffline.js.md) — `nowOf`
- [js/station/stationlife.js](stationlife.js.md) — `planAt`
- test/orders.test.mjs _(outside js/)_ — `LIFE`
- test/stafflife.test.mjs _(outside js/)_ — `LIFE`

## Exports

- [`HOURS`](#s-HOURS) · const — used by [js/station/staffcare.js](staffcare.js.md)
- [`HOUSING`](#s-HOUSING) · const — used by [js/station/staffcare.js](staffcare.js.md)
- [`SHIFT_PAY`](#s-SHIFT_PAY) · const — used by [js/station/staffcare.js](staffcare.js.md)
- [`LIFE`](#s-LIFE) · const — used by test/orders.test.mjs, test/stafflife.test.mjs
- [`JOBS`](#s-JOBS) · const — **no importer in scanned roots**
- [`jobsFor`](#s-jobsFor) · function — used by [js/station/staffcare.js](staffcare.js.md)
- [`ensureLife`](#s-ensureLife) · function — used by [js/station/staffcare.js](staffcare.js.md)
- [`planAt`](#s-planAt) · function — used by [js/station/stationlife.js](stationlife.js.md)
- [`nowOf`](#s-nowOf) · function — used by [js/station/staffline.js](staffline.js.md)
- [`productivity`](#s-productivity) · function — **no importer in scanned roots**
- [`log`](#s-log) · function — used by [js/station/staffcare.js](staffcare.js.md)
- [`tickStaffHour`](#s-tickStaffHour) · function — used by [js/corp/company.js](../corp/company.js.md)
- [`takeWorked`](#s-takeWorked) · function — used by [js/corp/company.js](../corp/company.js.md)
- [`cyclePay`](#s-cyclePay) · function — used by [js/corp/company.js](../corp/company.js.md)
- [`labourAt`](#s-labourAt) · function — used by [js/sim/sim.js](../sim/sim.js.md)
- [`lifeLine`](#s-lifeLine) · function — used by [js/console/panels/corp-town.js](../console/panels/corp-town.js.md), [js/station/deckhall.js](deckhall.js.md)
- [`needsOf`](#s-needsOf) · function — **no importer in scanned roots**
- [`needsLine`](#s-needsLine) · function — used by [js/console/panels/corp-town.js](../console/panels/corp-town.js.md), [js/station/deckhall.js](deckhall.js.md)
- [`dayLogOf`](#s-dayLogOf) · function — used by [js/console/panels/corp-town.js](../console/panels/corp-town.js.md), [js/station/deckhall.js](deckhall.js.md)
- [`housingCost`](#s-housingCost) · function — used by [js/corp/company.js](../corp/company.js.md)

## Effects

_none detected_

## Symbols

### <a id="s-HOURS"></a>`HOURS`

const · **exported** · L8–8

<!-- note:HOURS -->
<!-- /note -->

### <a id="s-HOUSING"></a>`HOUSING`

const · **exported** · L9–13

<!-- note:HOUSING -->
<!-- /note -->

### <a id="s-SHIFT_PAY"></a>`SHIFT_PAY`

const · **exported** · L14–14

<!-- note:SHIFT_PAY -->
0.3.53: the shift differential — nights pay more for the same hour
<!-- /note -->

### <a id="s-LIFE"></a>`LIFE`

const · **exported** · L15–21

<!-- note:LIFE -->
- L16 · `retainer: 0.3,` — of the share, booked every cycle whatever they are doing
- L17 · `perHour: 0.7,` — …and this much of it per hour worked (a cycle is 3 hours; they work 1 in 3)
- L18 · `labourPer: 0.03,` — a hand on shift adds this to their port's line rate
<!-- /note -->

### <a id="s-JOBS"></a>`JOBS`

const · **exported** · L23–30

<!-- note:JOBS -->
the jobs a port has, by sector
<!-- /note -->

### <a id="s-jobsFor"></a>`jobsFor(st)`

function · **exported** · L31–31

- called by: [`setJob`](staffcare.js.md#s-setJob) _js/station/staffcare.js_ · [`workOptions`](staffcare.js.md#s-workOptions) _js/station/staffcare.js_ · [`ensureLife`](#s-ensureLife) ×3

<!-- note:jobsFor -->
<!-- /note -->

### <a id="s-hash"></a>`hash(s)`

function · L33–38

- called by: [`ensureLife`](#s-ensureLife)

<!-- note:hash -->
<!-- /note -->

### <a id="s-first"></a>`first(name)`

function · L39–39

- called by: [`planAt`](#s-planAt)

<!-- note:first -->
<!-- /note -->

### <a id="s-clamp01"></a>`clamp01(v)`

function · L40–40

- called by: [`tickStaffHour`](#s-tickStaffHour) ×3

<!-- note:clamp01 -->
<!-- /note -->

### <a id="s-ensureLife"></a>`ensureLife(s)`

function · **exported** · L42–54

- calls: [`hash`](#s-hash) · [`jobsFor`](#s-jobsFor) ×3 · [`stationById`](stations.js.md#s-stationById) _js/station/stations.js_
- called by: [`careAct`](staffcare.js.md#s-careAct) _js/station/staffcare.js_ · [`setHours`](staffcare.js.md#s-setHours) _js/station/staffcare.js_ · [`setHousing`](staffcare.js.md#s-setHousing) _js/station/staffcare.js_ · [`setJob`](staffcare.js.md#s-setJob) _js/station/staffcare.js_ · [`setShift`](staffcare.js.md#s-setShift) _js/station/staffcare.js_ · [`termsLine`](staffcare.js.md#s-termsLine) _js/station/staffcare.js_ · [`workOptions`](staffcare.js.md#s-workOptions) _js/station/staffcare.js_ · [`dayLogOf`](#s-dayLogOf) · [`log`](#s-log) · [`needsOf`](#s-needsOf) · [`planAt`](#s-planAt) · [`tickStaffHour`](#s-tickStaffHour)

<!-- note:ensureLife -->
Fill in what a member's working life needs, once. Stable per person.
<!-- /note -->

### <a id="s-leisureSpot"></a>`leisureSpot(s)`

function · L56–66

- called by: [`planAt`](#s-planAt)

<!-- note:leisureSpot -->
<!-- /note -->

### <a id="s-household"></a>`household(s)`

function · L68–72

- via [js/corp/company.js](../corp/company.js.md): `company.staff.find`
- via [js/npc/cradle.js](../npc/cradle.js.md): `cradle.get`
- called by: [`planAt`](#s-planAt)

<!-- note:household -->
<!-- /note -->

### <a id="s-planAt"></a>`planAt(s, H)`

function · **exported** · L74–111

- calls: [`ensureLife`](#s-ensureLife) · [`first`](#s-first) · [`household`](#s-household) · [`leisureSpot`](#s-leisureSpot) · [`hoursIntoShift`](stationclock.js.md#s-hoursIntoShift) _js/station/stationclock.js_
- called by: [`nowOf`](#s-nowOf) · [`tickStaffHour`](#s-tickStaffHour) · [`tickStationLife`](stationlife.js.md#s-tickStationLife) _js/station/stationlife.js_

<!-- note:planAt -->
What they are doing at absolute port hour H.
→ { id: work|meal|own|family|supper|sleep|strike|transit, label, into, left }

- L79 · `const off = s.offShift && H >= s.offShift.from && H < s.offShift.to ? s.offShift : null;` — 0.3.53: a shift can be given back — a day off, or a training course
<!-- /note -->

### <a id="s-nowOf"></a>`nowOf(s, t)`

function · **exported** · L113–116

- calls: [`planAt`](#s-planAt) · [`hoursAt`](stationclock.js.md#s-hoursAt) _js/station/stationclock.js_
- called by: [`lifeLine`](#s-lifeLine) · [`TOPICS.run`](staffline.js.md#s-TOPICS-run) _js/station/staffline.js_ · [`checkIn`](staffline.js.md#s-checkIn) _js/station/staffline.js_

<!-- note:nowOf -->
What they are doing right now, and for how long.
<!-- /note -->

### <a id="s-productivity"></a>`productivity(s)`

function · **exported** · L118–123

- called by: [`tickStaffHour`](#s-tickStaffHour)

<!-- note:productivity -->
How much an hour of their work is worth, 0.3–1.1 (to 1.28 with courses).
<!-- /note -->

### <a id="s-log"></a>`log(s, c, text)`

function · **exported** · L125–129

- calls: [`ensureLife`](#s-ensureLife)
- called by: [`note`](staffcare.js.md#s-note) _js/station/staffcare.js_ · [`tickStaffHour`](#s-tickStaffHour) ×3

<!-- note:log -->
<!-- /note -->

### <a id="s-NEEDS"></a>`NEEDS`

const · L131–142

<!-- note:NEEDS -->
- L132 · `work:     [0.055,  0.05,   0.015,  0],` —          tired   hungry  lonely  mood/h
<!-- /note -->

### <a id="s-onShift"></a>`onShift`

const · L144–144

<!-- note:onShift -->
hands on shift, by port, for the lines
<!-- /note -->

### <a id="s-tickStaffHour"></a>`tickStaffHour(t)`

function · **exported** · L146–178

- calls: [`clamp01`](#s-clamp01) ×3 · [`ensureLife`](#s-ensureLife) · [`log`](#s-log) ×3 · [`planAt`](#s-planAt) · [`productivity`](#s-productivity) · [`clockAt`](stationclock.js.md#s-clockAt) _js/station/stationclock.js_ · [`hoursAt`](stationclock.js.md#s-hoursAt) _js/station/stationclock.js_
- called by: [`tickCompany`](../corp/company.js.md#s-tickCompany) _js/corp/company.js_

<!-- note:tickStaffHour -->
One port hour for everyone on the rolls. Called by company.js.

- L151 · `if (s.sky != null && s.sky !== sim.skySeed) continue;` — another sky: its port is not running
- L161 · `const lean = (0.45 - n.tired) * 0.5 + (0.45 - n.hungry) * 0.35 + (0.45 - n.lonely) * 0.35` — needs lean on mood every hour; a full belly and a night's sleep are worth something
<!-- /note -->

### <a id="s-takeWorked"></a>`takeWorked(s)`

function · **exported** · L180–184

- called by: [`tickCompany`](../corp/company.js.md#s-tickCompany) _js/corp/company.js_

<!-- note:takeWorked -->
Hours of work (productivity-weighted) since the last pay, and reset.
<!-- /note -->

### <a id="s-cyclePay"></a>`cyclePay(share, workedHours)`

function · **exported** · L186–188

- called by: [`tickCompany`](../corp/company.js.md#s-tickCompany) _js/corp/company.js_

<!-- note:cyclePay -->
What a cycle's share pays, given the hours worked in it. Average ≈ 1× the share.
<!-- /note -->

### <a id="s-labourAt"></a>`labourAt(stationId)`

function · **exported** · L190–192

<!-- note:labourAt -->
The line-rate lift a port gets from company hands on shift there right now.
<!-- /note -->

### <a id="s-lifeLine"></a>`lifeLine(s, t=)`

function · **exported** · L194–199

- calls: [`nowOf`](#s-nowOf)
- called by: [`lineCard`](../console/panels/corp-town.js.md#s-lineCard) _js/console/panels/corp-town.js_ · [`mountTown>paint`](../console/panels/corp-town.js.md#s-mountTown-paint) _js/console/panels/corp-town.js_ · [`floorSection`](deckhall.js.md#s-floorSection) _js/station/deckhall.js_ · [`lineCard`](deckhall.js.md#s-lineCard) _js/station/deckhall.js_

<!-- note:lifeLine -->
---- for the screens --------------------------------------------------------

"on the smelter line · day shift · 3 h more" — what they are doing, and for how long.
<!-- /note -->

### <a id="s-word"></a>`word(v, w)`

function · L201–201

- called by: [`needsOf`](#s-needsOf) ×3

<!-- note:word -->
<!-- /note -->

### <a id="s-needsOf"></a>`needsOf(s)`

function · **exported** · L202–210

- calls: [`ensureLife`](#s-ensureLife) · [`word`](#s-word) ×3
- called by: [`needsLine`](#s-needsLine)

<!-- note:needsOf -->
→ [{ id, label, v, word }] for tired / hungry / lonely
<!-- /note -->

### <a id="s-needsLine"></a>`needsLine(s)`

function · **exported** · L211–211

- calls: [`needsOf`](#s-needsOf)
- called by: [`lineCard`](../console/panels/corp-town.js.md#s-lineCard) _js/console/panels/corp-town.js_ · [`lineCard`](deckhall.js.md#s-lineCard) _js/station/deckhall.js_

<!-- note:needsLine -->
<!-- /note -->

### <a id="s-dayLogOf"></a>`dayLogOf(s, n=)`

function · **exported** · L213–213

- calls: [`ensureLife`](#s-ensureLife)
- called by: [`lineCard`](../console/panels/corp-town.js.md#s-lineCard) _js/console/panels/corp-town.js_ · [`lineCard`](deckhall.js.md#s-lineCard) _js/station/deckhall.js_

<!-- note:dayLogOf -->
Their day, newest first: [{ day, hhmm, text }].
<!-- /note -->

### <a id="s-housingCost"></a>`housingCost()`

function · **exported** · L215–217

- via [js/corp/company.js](../corp/company.js.md): `company.staff.reduce`
- called by: [`tickCompany`](../corp/company.js.md#s-tickCompany) _js/corp/company.js_

<!-- note:housingCost -->
Housing costs the company every cycle.
<!-- /note -->
