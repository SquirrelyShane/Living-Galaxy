# js/console/panels/ship.js

[index](../../../../README.md) · 428 lines · 26 symbols · 10 imports · 1 importers

## About

<!-- note:@file -->
LIVING GALAXY — CONSOLE › SHIP: STATUS · POWER · SYSTEMS · TRIM

The numbers behind the gauges and every knob that has no business being a
thumb control: condition, the well you are in, the load ledger and shed
order, postures, master switches, engagement rules, trim. Each sub builds
its DOM once and pushes refreshers (ctx.push) that tick at HUD rate.
<!-- /note -->

## Imports

| line | from | names | target |
|---|---|---|---|
| 1 | `../kit.js` | `button`, `el`, `group`, `note`, `pct`, `row`, `section`, `setBar`, `slider`, `fmtDist`, `fmtTime`, `clockOf` | [js/console/kit.js](../kit.js.md) |
| 2 | `../../flight/turrets.js` | `mining`, `turretAim` | [js/flight/turrets.js](../../flight/turrets.js.md) |
| 3 | `../../ui/charts.js` | `ring`, `sparkline` | [js/ui/charts.js](../../ui/charts.js.md) |
| 4 | `../../flight/ship.js` | `MINING_MODES`, `SHED_LABEL`, `TUNE_SPEC`, `TURRET_MODES`, `batteryCap` | [js/flight/ship.js](../../flight/ship.js.md) |
| 5 | `../../sim/sim.js` | `moveShed`, `resetTune`, `setMiningMode`, `setTune`, `setTurretMode`, `sim`, `stationStatus`, `toggleSystem` | [js/sim/sim.js](../../sim/sim.js.md) |
| 6 | `../../core/store.js` | `useGameStore` | [js/core/store.js](../../core/store.js.md) |
| 7 | `../../flight/autopilot.js` | `autopilot`, `sustainableThrottle` | [js/flight/autopilot.js](../../flight/autopilot.js.md) |
| 8 | `../../crew/duties.js` | `duties`, `dutyReport` | [js/crew/duties.js](../../crew/duties.js.md) |
| 9 | `../../crew/robots.js` | `robotsSummary` | [js/crew/robots.js](../../crew/robots.js.md) |
| 10 | `../../economy/upgrades.js` | `upgradeLines` | [js/economy/upgrades.js](../../economy/upgrades.js.md) |

## Imported by

- [js/console/console.js](../console.js.md) — `default`

## Exports

- [`POSTURES`](#s-POSTURES) · const — **no importer in scanned roots**
- [`postureMatches`](#s-postureMatches) · function — **no importer in scanned roots**
- [`applyPosture`](#s-applyPosture) · function — **no importer in scanned roots**
- `default` · ObjectExpression — used by [js/console/console.js](../console.js.md)

## Effects

- **dom.id** — `op-level` (mountSystems:323) · `btn-cam` (mountSystems:325) · `op-time` (mountSystems:328) · `op-pulse` (mountSystems:331) · `op-pulse-st` (mountSystems:359)
- **dom.query** — `.sw[data-sys="${…}"]` (swClick:30) · `small` (mountTrim:398)
- **event.listen** — `click on b → (inline)` (mountSystems:262, mountSystems:298, mountSystems:313)

## Symbols

### <a id="s-DOC"></a>`DOC`

const · L12–12

<!-- note:DOC -->
<!-- /note -->

### <a id="s-POSTURES"></a>`POSTURES`

const · **exported** · L14–20

<!-- note:POSTURES -->
---- postures (the CMD deck's one good idea) -----------------------------
<!-- /note -->

### <a id="s-S"></a>`S()`

function · L21–21

- via [js/core/store.js](../../core/store.js.md): `useGameStore.getState`
- called by: [`mountSystems`](#s-mountSystems) · [`sysState`](#s-sysState)

<!-- note:S -->
<!-- /note -->

### <a id="s-sysState"></a>`sysState(k)`

function · L22–29

- calls: [`S`](#s-S)
- called by: [`applyPosture`](#s-applyPosture) · [`mountSystems`](#s-mountSystems) ×4 · [`postureMatches`](#s-postureMatches) · [`search.status~2`](#s-search-status-2)

<!-- note:sysState -->
<!-- /note -->

### <a id="s-swClick"></a>`swClick(k)`

function · L30–30

- called by: [`applyPosture`](#s-applyPosture) · [`mountSystems`](#s-mountSystems) ×4
- effects: dom.query `.sw[data-sys="${…}"]`

<!-- note:swClick -->
<!-- /note -->

### <a id="s-postureMatches"></a>`postureMatches(p)`

function · **exported** · L31–31

- calls: [`sysState`](#s-sysState)
- called by: [`mountSystems`](#s-mountSystems) · [`search.status`](#s-search-status)

<!-- note:postureMatches -->
<!-- /note -->

### <a id="s-applyPosture"></a>`applyPosture(p)`

function · **exported** · L32–39

- calls: [`swClick`](#s-swClick) · [`sysState`](#s-sysState) · [`setMiningMode`](../../sim/sim.js.md#s-setMiningMode) _js/sim/sim.js_ · [`setTurretMode`](../../sim/sim.js.md#s-setTurretMode) _js/sim/sim.js_
- called by: [`mountSystems`](#s-mountSystems) · [`search.run`](#s-search-run)

<!-- note:applyPosture -->
<!-- /note -->

### <a id="s-telemetryBlock"></a>`telemetryBlock(root, push)`

function · L41–78

- calls: [`el`](../kit.js.md#s-el) _js/console/kit.js_ ×12 · [`section`](../kit.js.md#s-section) _js/console/kit.js_ · [`batteryCap`](../../flight/ship.js.md#s-batteryCap) _js/flight/ship.js_ · [`ring`](../../ui/charts.js.md#s-ring) _js/ui/charts.js_ ×4 · [`sparkline`](../../ui/charts.js.md#s-sparkline) _js/ui/charts.js_ ×4
- called by: [`mountStatus`](#s-mountStatus)

<!-- note:telemetryBlock -->
---- STATUS ----------------------------------------------------------------

Passive telemetry: the last two hours of the ship as readouts you glance at.

- L70 · `` const stamp = `${T.at}:${T.cargo.length}`; `` — the sparklines only change when a sample lands (every 3 s) — no reason to rebuild them at 14 Hz
<!-- /note -->

### <a id="s-mountStatus"></a>`mountStatus(root, push)`

function · L80–173

- calls: [`clockOf`](../kit.js.md#s-clockOf) _js/console/kit.js_ · [`el`](../kit.js.md#s-el) _js/console/kit.js_ ×7 · [`fmtDist`](../kit.js.md#s-fmtDist) _js/console/kit.js_ · [`pct`](../kit.js.md#s-pct) _js/console/kit.js_ ×2 · [`row`](../kit.js.md#s-row) _js/console/kit.js_ ×15 · [`section`](../kit.js.md#s-section) _js/console/kit.js_ ×6 · [`setBar`](../kit.js.md#s-setBar) _js/console/kit.js_ ×5 · [`telemetryBlock`](#s-telemetryBlock) · [`dutyReport`](../../crew/duties.js.md#s-dutyReport) _js/crew/duties.js_ · [`robotsSummary`](../../crew/robots.js.md#s-robotsSummary) _js/crew/robots.js_
- via [js/sim/sim.js](../../sim/sim.js.md): `sim.log.slice`, `sim.log.slice.reverse`

<!-- note:mountStatus -->
<!-- /note -->

### <a id="s-mountPower"></a>`mountPower(root, push)`

function · L175–249

- calls: [`el`](../kit.js.md#s-el) _js/console/kit.js_ · [`fmtTime`](../kit.js.md#s-fmtTime) _js/console/kit.js_ ×2 · [`note`](../kit.js.md#s-note) _js/console/kit.js_ · [`row`](../kit.js.md#s-row) _js/console/kit.js_ ×6 · [`section`](../kit.js.md#s-section) _js/console/kit.js_ ×4 · [`setBar`](../kit.js.md#s-setBar) _js/console/kit.js_ ×2 · [`slider`](../kit.js.md#s-slider) _js/console/kit.js_ · [`mountPower>dr`](#s-mountPower-dr) ×11 · [`mountPower>drawShed`](#s-mountPower-drawShed) ×2 · [`sustainableThrottle`](../../flight/autopilot.js.md#s-sustainableThrottle) _js/flight/autopilot.js_ · [`batteryCap`](../../flight/ship.js.md#s-batteryCap) _js/flight/ship.js_ ×3 · [`setTune`](../../sim/sim.js.md#s-setTune) _js/sim/sim.js_
- via [js/flight/ship.js](../../flight/ship.js.md): `TUNE_SPEC.find`

<!-- note:mountPower -->
---- POWER -----------------------------------------------------------------

- L245 · `const sus = sustainableThrottle(ship);` — live: autopilot.power only refreshes while a leg flies
<!-- /note -->

#### <a id="s-mountPower-dr"></a>`mountPower>dr(k)`

function · L191–191

- called by: [`mountPower`](#s-mountPower) ×11

<!-- note:mountPower>dr -->
every row reads ship.draws — what stepPower actually billed this tick —
so the ledger adds up to the load instead of re-deriving it with its own sums
<!-- /note -->

#### <a id="s-mountPower-drawShed"></a>`mountPower>drawShed()`

function · L216–225

- calls: [`button`](../kit.js.md#s-button) _js/console/kit.js_ ×2 · [`group`](../kit.js.md#s-group) _js/console/kit.js_ · [`row`](../kit.js.md#s-row) _js/console/kit.js_ · [`moveShed`](../../sim/sim.js.md#s-moveShed) _js/sim/sim.js_ ×2
- called by: [`mountPower`](#s-mountPower) ×2

<!-- note:mountPower>drawShed -->
<!-- /note -->

### <a id="s-mountSystems"></a>`mountSystems(root, push)`

function · L251–363

- calls: [`button`](../kit.js.md#s-button) _js/console/kit.js_ ×6 · [`el`](../kit.js.md#s-el) _js/console/kit.js_ ×12 · [`note`](../kit.js.md#s-note) _js/console/kit.js_ · [`pct`](../kit.js.md#s-pct) _js/console/kit.js_ · [`row`](../kit.js.md#s-row) _js/console/kit.js_ ×8 · [`section`](../kit.js.md#s-section) _js/console/kit.js_ ×5 · [`applyPosture`](#s-applyPosture) · [`postureMatches`](#s-postureMatches) · [`S`](#s-S) · [`swClick`](#s-swClick) ×4 · [`sysState`](#s-sysState) ×4 · [`setMiningMode`](../../sim/sim.js.md#s-setMiningMode) _js/sim/sim.js_ · [`setTurretMode`](../../sim/sim.js.md#s-setTurretMode) _js/sim/sim.js_ · [`toggleSystem`](../../sim/sim.js.md#s-toggleSystem) _js/sim/sim.js_ ×6
- via [js/flight/ship.js](../../flight/ship.js.md): `MINING_MODES.map`, `TURRET_MODES.map`
- effects: event.listen `click` · dom.id `op-level` · dom.id `btn-cam` · dom.id `op-time` · dom.id `op-pulse` · dom.id `op-pulse-st`

<!-- note:mountSystems -->
---- SYSTEMS ---------------------------------------------------------------
<!-- /note -->

### <a id="s-mountTrim"></a>`mountTrim(root, push, ctx)`

function · L365–402

- calls: [`button`](../kit.js.md#s-button) _js/console/kit.js_ ×2 · [`el`](../kit.js.md#s-el) _js/console/kit.js_ ×3 · [`row`](../kit.js.md#s-row) _js/console/kit.js_ ×3 · [`section`](../kit.js.md#s-section) _js/console/kit.js_ ×2 · [`slider`](../kit.js.md#s-slider) _js/console/kit.js_ · [`upgradeLines`](../../economy/upgrades.js.md#s-upgradeLines) _js/economy/upgrades.js_ · [`resetTune`](../../sim/sim.js.md#s-resetTune) _js/sim/sim.js_ · [`setTune`](../../sim/sim.js.md#s-setTune) _js/sim/sim.js_ · [`stationStatus`](../../sim/sim.js.md#s-stationStatus) _js/sim/sim.js_
- via [js/flight/ship.js](../../flight/ship.js.md): `TUNE_SPEC.filter`, `TUNE_SPEC.filter.map`
- effects: dom.query `small`

<!-- note:mountTrim -->
---- TRIM ------------------------------------------------------------------
<!-- /note -->

### <a id="s-SUBS"></a>`SUBS`

const · L404–404

<!-- note:SUBS -->
---- the panel -------------------------------------------------------------
<!-- /note -->

### <a id="s-mount"></a>`mount(root, ctx)`

prop · L411–411

<!-- note:mount -->
<!-- /note -->

### <a id="s-paint"></a>`paint()`

prop · L412–412

<!-- note:paint -->
<!-- /note -->

### <a id="s-unmount"></a>`unmount()`

prop · L413–413

<!-- note:unmount -->
<!-- /note -->

### <a id="s-search"></a>`search()`

prop · L414–427

<!-- note:search -->
<!-- /note -->

#### <a id="s-search-run"></a>`search.run()`

prop · L416–416

- calls: [`applyPosture`](#s-applyPosture)

<!-- note:search.run -->
<!-- /note -->

#### <a id="s-search-status"></a>`search.status()`

prop · L416–416

- calls: [`postureMatches`](#s-postureMatches)

<!-- note:search.status -->
<!-- /note -->

#### <a id="s-search-status-2"></a>`search.status~2()`

prop · L418–418

- calls: [`sysState`](#s-sysState)

<!-- note:search.status~2 -->
<!-- /note -->

#### <a id="s-search-run-2"></a>`search.run~2()`

prop · L420–420

- calls: [`setTurretMode`](../../sim/sim.js.md#s-setTurretMode) _js/sim/sim.js_

<!-- note:search.run~2 -->
<!-- /note -->

#### <a id="s-search-status-3"></a>`search.status~3()`

prop · L420–420

<!-- note:search.status~3 -->
<!-- /note -->

#### <a id="s-search-run-3"></a>`search.run~3()`

prop · L421–421

- calls: [`setMiningMode`](../../sim/sim.js.md#s-setMiningMode) _js/sim/sim.js_

<!-- note:search.run~3 -->
<!-- /note -->

#### <a id="s-search-status-4"></a>`search.status~4()`

prop · L421–421

<!-- note:search.status~4 -->
<!-- /note -->
