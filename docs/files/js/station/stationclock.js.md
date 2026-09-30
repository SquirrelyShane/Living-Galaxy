# js/station/stationclock.js

[index](../../../README.md) · 51 lines · 10 symbols · 0 imports · 10 importers

## About

<!-- note:@file -->
LIVING GALAXY — port standard time (0.3.52).

The sky had one clock, `sim.time` in seconds, and one rhythm on top of it:
the 90-second CYCLE that payroll and the company books run on. Nothing had a
day. So nothing could have a shift, a night, a meal, or a weekend, and a
settled hand "working at the port" was a number arriving every 90 seconds.

PORT STANDARD TIME is the shared clock every port keeps:

  an HOUR is 30 s of sky time    a DAY is 24 hours = 12 minutes at ×1
  a CYCLE (payroll) is 3 hours   a WEEK is 7 days

Day 1 opens at 06:00 when the sky's clock is zero, so a fresh sky starts on
the morning shift. Three eight-hour shifts: DAY 06–14, SWING 14–22, NIGHT
22–06. The day has parts for the lights: NIGHT 22–05, DAWN 05–07, DAY 07–19,
DUSK 19–22. In the shared sky every client runs `now − born`, so everyone is
on the same hour by construction.

Pure: no DOM, no imports. Everything that wants the time asks this.

- L7 · `export const DAY_S = CLOCK.hourS * CLOCK.dayH;` — 720
<!-- /note -->

## Imports

_none_

## Imported by

- [js/console/panels/corp-town.js](../console/panels/corp-town.js.md) — `clockLine`
- [js/corp/company.js](../corp/company.js.md) — `CLOCK`
- [js/station/staffcare.js](staffcare.js.md) — `SHIFTS`, `SHIFT_IDS`, `CLOCK`, `clockAt`, `hoursAt`, `hoursIntoShift`
- [js/station/stafflife.js](stafflife.js.md) — `clockAt`, `hoursAt`, `hoursIntoShift`, `SHIFTS`, `SHIFT_IDS`, `CLOCK`
- [js/station/staffline.js](staffline.js.md) — `clockAt`
- [js/station/stationdeck.js](stationdeck.js.md) — `clockAt`
- [js/station/stationlife.js](stationlife.js.md) — `hoursAt`
- [js/ui/hud.js](../ui/hud.js.md) — `clockAt`
- test/orders.test.mjs _(outside js/)_ — `CLK`
- test/stafflife.test.mjs _(outside js/)_ — `CLK`

## Exports

- [`CLOCK`](#s-CLOCK) · const — used by [js/corp/company.js](../corp/company.js.md), [js/station/staffcare.js](staffcare.js.md), [js/station/stafflife.js](stafflife.js.md)
- [`DAY_S`](#s-DAY_S) · const — **no importer in scanned roots**
- [`WEEKDAYS`](#s-WEEKDAYS) · const — **no importer in scanned roots**
- [`SHIFTS`](#s-SHIFTS) · const — used by [js/station/staffcare.js](staffcare.js.md), [js/station/stafflife.js](stafflife.js.md)
- [`SHIFT_IDS`](#s-SHIFT_IDS) · const — used by [js/station/staffcare.js](staffcare.js.md), [js/station/stafflife.js](stafflife.js.md)
- [`hoursAt`](#s-hoursAt) · function — used by [js/station/staffcare.js](staffcare.js.md), [js/station/stafflife.js](stafflife.js.md), [js/station/stationlife.js](stationlife.js.md)
- [`clockAt`](#s-clockAt) · function — used by [js/station/staffcare.js](staffcare.js.md), [js/station/stafflife.js](stafflife.js.md), [js/station/staffline.js](staffline.js.md), [js/station/stationdeck.js](stationdeck.js.md), [js/ui/hud.js](../ui/hud.js.md)
- [`hoursIntoShift`](#s-hoursIntoShift) · function — used by [js/station/staffcare.js](staffcare.js.md), [js/station/stafflife.js](stafflife.js.md)
- [`secondsUntilHour`](#s-secondsUntilHour) · function — **no importer in scanned roots**
- [`clockLine`](#s-clockLine) · function — used by [js/console/panels/corp-town.js](../console/panels/corp-town.js.md)

## Effects

_none detected_

## Symbols

### <a id="s-CLOCK"></a>`CLOCK`

const · **exported** · L1–6

<!-- note:CLOCK -->
- L2 · `hourS: 30,` — sky seconds per port hour
- L5 · `startHour: 6,` — the hour sky time zero falls on
<!-- /note -->

### <a id="s-DAY_S"></a>`DAY_S`

const · **exported** · L7–7

<!-- note:DAY_S -->
<!-- /note -->

### <a id="s-WEEKDAYS"></a>`WEEKDAYS`

const · **exported** · L8–8

<!-- note:WEEKDAYS -->
<!-- /note -->

### <a id="s-SHIFTS"></a>`SHIFTS`

const · **exported** · L10–14

<!-- note:SHIFTS -->
<!-- /note -->

### <a id="s-SHIFT_IDS"></a>`SHIFT_IDS`

const · **exported** · L15–15

<!-- note:SHIFT_IDS -->
<!-- /note -->

### <a id="s-hoursAt"></a>`hoursAt(t)`

function · **exported** · L17–19

- called by: [`H`](staffcare.js.md#s-H) _js/station/staffcare.js_ · [`nowOf`](stafflife.js.md#s-nowOf) _js/station/stafflife.js_ · [`tickStaffHour`](stafflife.js.md#s-tickStaffHour) _js/station/stafflife.js_ · [`clockAt`](#s-clockAt) · [`secondsUntilHour`](#s-secondsUntilHour) · [`EVENTS.run~7`](stationlife.js.md#s-EVENTS-run-7) _js/station/stationlife.js_ · [`tickStationLife`](stationlife.js.md#s-tickStationLife) _js/station/stationlife.js_

<!-- note:hoursAt -->
Absolute port hours since the epoch (fractional).
<!-- /note -->

### <a id="s-clockAt"></a>`clockAt(t)`

function · **exported** · L21–35

- calls: [`hoursAt`](#s-hoursAt)
- called by: [`note`](staffcare.js.md#s-note) _js/station/staffcare.js_ · [`tickStaffHour`](stafflife.js.md#s-tickStaffHour) _js/station/stafflife.js_ · [`checkIn`](staffline.js.md#s-checkIn) _js/station/staffline.js_ · [`clockLine`](#s-clockLine) · [`mountStationDeck`](stationdeck.js.md#s-mountStationDeck) _js/station/stationdeck.js_ · [`mountHud>paintClock`](../ui/hud.js.md#s-mountHud-paintClock) _js/ui/hud.js_

<!-- note:clockAt -->
→ { day (1-based), week (1-based), dow (0-6), weekday, hour (0-23), minute,
    hhmm "14:20", part, isNight, shift, label "D3 · 14:20" }
<!-- /note -->

### <a id="s-hoursIntoShift"></a>`hoursIntoShift(start, H)`

function · **exported** · L37–39

- called by: [`nextShift`](staffcare.js.md#s-nextShift) _js/station/staffcare.js_ · [`planAt`](stafflife.js.md#s-planAt) _js/station/stafflife.js_ · [`secondsUntilHour`](#s-secondsUntilHour)

<!-- note:hoursIntoShift -->
Hours into a shift that starts at `start` (0..24) at absolute hour H.
<!-- /note -->

### <a id="s-secondsUntilHour"></a>`secondsUntilHour(t, hour)`

function · **exported** · L41–46

- calls: [`hoursAt`](#s-hoursAt) · [`hoursIntoShift`](#s-hoursIntoShift)

<!-- note:secondsUntilHour -->
Sky seconds until the next occurrence of `hour` o'clock.
<!-- /note -->

### <a id="s-clockLine"></a>`clockLine(t)`

function · **exported** · L48–51

- calls: [`clockAt`](#s-clockAt)
- called by: [`mountTown>paint`](../console/panels/corp-town.js.md#s-mountTown-paint) _js/console/panels/corp-town.js_

<!-- note:clockLine -->
A one-line reading for a HUD or a deck header.
<!-- /note -->
