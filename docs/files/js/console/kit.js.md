# js/console/kit.js

[index](../../../README.md) · 165 lines · 20 symbols · 0 imports · 23 importers

## About

<!-- note:@file -->
LIVING GALAXY — console DOM kit.

The old terminal's builders (el, section, note, row, button, group, slider,
pct, setBar, fmtDist, fmtTime, clockOf) plus two in the same style:
chips(list, { value, onPick }) and card(title, hint). Every panel under
js/console builds its DOM from these and nothing else.

No DOM access at import time: `document` is only touched inside builders.
<!-- /note -->

## Imports

_none_

## Imported by

- [js/console/console.js](console.js.md) — `*`
- [js/console/console.js](console.js.md) — `fmtDist`
- [js/console/panels/aria-core.js](panels/aria-core.js.md) — `el`, `section`, `row`, `note`, `button`
- [js/console/panels/corp-account.js](panels/corp-account.js.md) — `el`, `section`, `note`, `row`, `button`, `group`, `card`
- [js/console/panels/corp-marshal.js](panels/corp-marshal.js.md) — `el`, `section`, `note`, `row`, `button`, `group`, `chips`, `setBar`, `card`
- [js/console/panels/corp-town.js](panels/corp-town.js.md) — `button`, `el`, `note`, `row`, `section`, `setBar`, `chips`
- [js/console/panels/corp.js](panels/corp.js.md) — `button`, `el`, `group`, `note`, `row`, `section`, `setBar`
- [js/console/panels/crew-brig.js](panels/crew-brig.js.md) — `el`, `section`, `note`, `row`, `button`, `group`, `chips`, `setBar`, `card`
- [js/console/panels/crew-gdb.js](panels/crew-gdb.js.md) — `el`, `section`, `note`, `row`, `button`, `chips`, `card`
- [js/console/panels/crew-gene.js](panels/crew-gene.js.md) — `el`, `section`, `note`, `row`, `button`, `group`, `chips`, `setBar`, `card`, `pct`
- [js/console/panels/crew-sky.js](panels/crew-sky.js.md) — `el`, `section`, `note`, `row`, `button`, `chips`, `setBar`, `card`
- [js/console/panels/crew-sky.js](panels/crew-sky.js.md) — `fmtDist`
- [js/console/panels/crew.js](panels/crew.js.md) — `el`, `section`, `note`, `row`, `button`, `group`, `chips`, `setBar`, `card`
- [js/console/panels/market.js](panels/market.js.md) — `button`, `el`, `group`, `note`, `row`, `section`, `setBar`, `fmtDist`
- [js/console/panels/nav.js](panels/nav.js.md) — `button`, `el`, `group`, `note`, `row`, `section`, `fmtDist`
- [js/console/panels/ship.js](panels/ship.js.md) — `button`, `el`, `group`, `note`, `pct`, `row`, `section`, `setBar`, `slider`, `fmtDist`, `fmtTime`, `clockOf`
- [js/console/panels/work-drones.js](panels/work-drones.js.md) — `el`, `section`, `note`, `row`, `button`, `group`, `chips`, `card`, `pct`, `setBar`
- [js/console/panels/work-fleet.js](panels/work-fleet.js.md) — `el`, `section`, `note`, `row`, `button`
- [js/console/panels/work-tape.js](panels/work-tape.js.md) — `el`, `section`, `note`, `row`, `button`, `chips`
- [js/console/panels/work.js](panels/work.js.md) — `el`, `section`, `note`, `row`, `button`, `group`, `chips`, `card`
- [js/crew/robotyard.js](../crew/robotyard.js.md) — `el`, `row`, `button`, `group`, `setBar`, `note`, `section`
- [js/station/fabyard.js](../station/fabyard.js.md) — `el`, `row`, `button`, `note`, `section`
- [js/station/refityard.js](../station/refityard.js.md) — `el`, `row`, `button`, `note`, `section`

## Exports

- [`fmtDist`](#s-fmtDist) · function — used by [js/console/console.js](console.js.md), [js/console/panels/crew-sky.js](panels/crew-sky.js.md), [js/console/panels/market.js](panels/market.js.md), [js/console/panels/nav.js](panels/nav.js.md), [js/console/panels/ship.js](panels/ship.js.md)
- [`fmtTime`](#s-fmtTime) · function — used by [js/console/console.js](console.js.md), [js/console/panels/ship.js](panels/ship.js.md)
- [`clockOf`](#s-clockOf) · function — used by [js/console/console.js](console.js.md), [js/console/panels/ship.js](panels/ship.js.md)
- [`el`](#s-el) · function — used by [js/console/console.js](console.js.md), [js/console/panels/aria-core.js](panels/aria-core.js.md), [js/console/panels/corp-account.js](panels/corp-account.js.md), [js/console/panels/corp-marshal.js](panels/corp-marshal.js.md), [js/console/panels/corp-town.js](panels/corp-town.js.md), [js/console/panels/corp.js](panels/corp.js.md), [js/console/panels/crew-brig.js](panels/crew-brig.js.md), [js/console/panels/crew-gdb.js](panels/crew-gdb.js.md), [js/console/panels/crew-gene.js](panels/crew-gene.js.md), [js/console/panels/crew-sky.js](panels/crew-sky.js.md), [js/console/panels/crew.js](panels/crew.js.md), [js/console/panels/market.js](panels/market.js.md), [js/console/panels/nav.js](panels/nav.js.md), [js/console/panels/ship.js](panels/ship.js.md), [js/console/panels/work-drones.js](panels/work-drones.js.md), [js/console/panels/work-fleet.js](panels/work-fleet.js.md), [js/console/panels/work-tape.js](panels/work-tape.js.md), [js/console/panels/work.js](panels/work.js.md), [js/crew/robotyard.js](../crew/robotyard.js.md), [js/station/fabyard.js](../station/fabyard.js.md), [js/station/refityard.js](../station/refityard.js.md)
- [`section`](#s-section) · function — used by [js/console/console.js](console.js.md), [js/console/panels/aria-core.js](panels/aria-core.js.md), [js/console/panels/corp-account.js](panels/corp-account.js.md), [js/console/panels/corp-marshal.js](panels/corp-marshal.js.md), [js/console/panels/corp-town.js](panels/corp-town.js.md), [js/console/panels/corp.js](panels/corp.js.md), [js/console/panels/crew-brig.js](panels/crew-brig.js.md), [js/console/panels/crew-gdb.js](panels/crew-gdb.js.md), [js/console/panels/crew-gene.js](panels/crew-gene.js.md), [js/console/panels/crew-sky.js](panels/crew-sky.js.md), [js/console/panels/crew.js](panels/crew.js.md), [js/console/panels/market.js](panels/market.js.md), [js/console/panels/nav.js](panels/nav.js.md), [js/console/panels/ship.js](panels/ship.js.md), [js/console/panels/work-drones.js](panels/work-drones.js.md), [js/console/panels/work-fleet.js](panels/work-fleet.js.md), [js/console/panels/work-tape.js](panels/work-tape.js.md), [js/console/panels/work.js](panels/work.js.md), [js/crew/robotyard.js](../crew/robotyard.js.md), [js/station/fabyard.js](../station/fabyard.js.md), [js/station/refityard.js](../station/refityard.js.md)
- [`note`](#s-note) · function — used by [js/console/console.js](console.js.md), [js/console/panels/aria-core.js](panels/aria-core.js.md), [js/console/panels/corp-account.js](panels/corp-account.js.md), [js/console/panels/corp-marshal.js](panels/corp-marshal.js.md), [js/console/panels/corp-town.js](panels/corp-town.js.md), [js/console/panels/corp.js](panels/corp.js.md), [js/console/panels/crew-brig.js](panels/crew-brig.js.md), [js/console/panels/crew-gdb.js](panels/crew-gdb.js.md), [js/console/panels/crew-gene.js](panels/crew-gene.js.md), [js/console/panels/crew-sky.js](panels/crew-sky.js.md), [js/console/panels/crew.js](panels/crew.js.md), [js/console/panels/market.js](panels/market.js.md), [js/console/panels/nav.js](panels/nav.js.md), [js/console/panels/ship.js](panels/ship.js.md), [js/console/panels/work-drones.js](panels/work-drones.js.md), [js/console/panels/work-fleet.js](panels/work-fleet.js.md), [js/console/panels/work-tape.js](panels/work-tape.js.md), [js/console/panels/work.js](panels/work.js.md), [js/crew/robotyard.js](../crew/robotyard.js.md), [js/station/fabyard.js](../station/fabyard.js.md), [js/station/refityard.js](../station/refityard.js.md)
- [`row`](#s-row) · function — used by [js/console/console.js](console.js.md), [js/console/panels/aria-core.js](panels/aria-core.js.md), [js/console/panels/corp-account.js](panels/corp-account.js.md), [js/console/panels/corp-marshal.js](panels/corp-marshal.js.md), [js/console/panels/corp-town.js](panels/corp-town.js.md), [js/console/panels/corp.js](panels/corp.js.md), [js/console/panels/crew-brig.js](panels/crew-brig.js.md), [js/console/panels/crew-gdb.js](panels/crew-gdb.js.md), [js/console/panels/crew-gene.js](panels/crew-gene.js.md), [js/console/panels/crew-sky.js](panels/crew-sky.js.md), [js/console/panels/crew.js](panels/crew.js.md), [js/console/panels/market.js](panels/market.js.md), [js/console/panels/nav.js](panels/nav.js.md), [js/console/panels/ship.js](panels/ship.js.md), [js/console/panels/work-drones.js](panels/work-drones.js.md), [js/console/panels/work-fleet.js](panels/work-fleet.js.md), [js/console/panels/work-tape.js](panels/work-tape.js.md), [js/console/panels/work.js](panels/work.js.md), [js/crew/robotyard.js](../crew/robotyard.js.md), [js/station/fabyard.js](../station/fabyard.js.md), [js/station/refityard.js](../station/refityard.js.md)
- [`button`](#s-button) · function — used by [js/console/console.js](console.js.md), [js/console/panels/aria-core.js](panels/aria-core.js.md), [js/console/panels/corp-account.js](panels/corp-account.js.md), [js/console/panels/corp-marshal.js](panels/corp-marshal.js.md), [js/console/panels/corp-town.js](panels/corp-town.js.md), [js/console/panels/corp.js](panels/corp.js.md), [js/console/panels/crew-brig.js](panels/crew-brig.js.md), [js/console/panels/crew-gdb.js](panels/crew-gdb.js.md), [js/console/panels/crew-gene.js](panels/crew-gene.js.md), [js/console/panels/crew-sky.js](panels/crew-sky.js.md), [js/console/panels/crew.js](panels/crew.js.md), [js/console/panels/market.js](panels/market.js.md), [js/console/panels/nav.js](panels/nav.js.md), [js/console/panels/ship.js](panels/ship.js.md), [js/console/panels/work-drones.js](panels/work-drones.js.md), [js/console/panels/work-fleet.js](panels/work-fleet.js.md), [js/console/panels/work-tape.js](panels/work-tape.js.md), [js/console/panels/work.js](panels/work.js.md), [js/crew/robotyard.js](../crew/robotyard.js.md), [js/station/fabyard.js](../station/fabyard.js.md), [js/station/refityard.js](../station/refityard.js.md)
- [`group`](#s-group) · function — used by [js/console/console.js](console.js.md), [js/console/panels/corp-account.js](panels/corp-account.js.md), [js/console/panels/corp-marshal.js](panels/corp-marshal.js.md), [js/console/panels/corp.js](panels/corp.js.md), [js/console/panels/crew-brig.js](panels/crew-brig.js.md), [js/console/panels/crew-gene.js](panels/crew-gene.js.md), [js/console/panels/crew.js](panels/crew.js.md), [js/console/panels/market.js](panels/market.js.md), [js/console/panels/nav.js](panels/nav.js.md), [js/console/panels/ship.js](panels/ship.js.md), [js/console/panels/work-drones.js](panels/work-drones.js.md), [js/console/panels/work.js](panels/work.js.md), [js/crew/robotyard.js](../crew/robotyard.js.md)
- [`slider`](#s-slider) · function — used by [js/console/console.js](console.js.md), [js/console/panels/ship.js](panels/ship.js.md)
- [`pct`](#s-pct) · function — used by [js/console/console.js](console.js.md), [js/console/panels/crew-gene.js](panels/crew-gene.js.md), [js/console/panels/ship.js](panels/ship.js.md), [js/console/panels/work-drones.js](panels/work-drones.js.md)
- [`setBar`](#s-setBar) · function — used by [js/console/console.js](console.js.md), [js/console/panels/corp-marshal.js](panels/corp-marshal.js.md), [js/console/panels/corp-town.js](panels/corp-town.js.md), [js/console/panels/corp.js](panels/corp.js.md), [js/console/panels/crew-brig.js](panels/crew-brig.js.md), [js/console/panels/crew-gene.js](panels/crew-gene.js.md), [js/console/panels/crew-sky.js](panels/crew-sky.js.md), [js/console/panels/crew.js](panels/crew.js.md), [js/console/panels/market.js](panels/market.js.md), [js/console/panels/ship.js](panels/ship.js.md), [js/console/panels/work-drones.js](panels/work-drones.js.md), [js/crew/robotyard.js](../crew/robotyard.js.md)
- [`chips`](#s-chips) · function — used by [js/console/console.js](console.js.md), [js/console/panels/corp-marshal.js](panels/corp-marshal.js.md), [js/console/panels/corp-town.js](panels/corp-town.js.md), [js/console/panels/crew-brig.js](panels/crew-brig.js.md), [js/console/panels/crew-gdb.js](panels/crew-gdb.js.md), [js/console/panels/crew-gene.js](panels/crew-gene.js.md), [js/console/panels/crew-sky.js](panels/crew-sky.js.md), [js/console/panels/crew.js](panels/crew.js.md), [js/console/panels/work-drones.js](panels/work-drones.js.md), [js/console/panels/work-tape.js](panels/work-tape.js.md), [js/console/panels/work.js](panels/work.js.md)
- [`card`](#s-card) · function — used by [js/console/console.js](console.js.md), [js/console/panels/corp-account.js](panels/corp-account.js.md), [js/console/panels/corp-marshal.js](panels/corp-marshal.js.md), [js/console/panels/crew-brig.js](panels/crew-brig.js.md), [js/console/panels/crew-gdb.js](panels/crew-gdb.js.md), [js/console/panels/crew-gene.js](panels/crew-gene.js.md), [js/console/panels/crew-sky.js](panels/crew-sky.js.md), [js/console/panels/crew.js](panels/crew.js.md), [js/console/panels/work-drones.js](panels/work-drones.js.md), [js/console/panels/work.js](panels/work.js.md)
- [`kit`](#s-kit) · const — used by [js/console/console.js](console.js.md)

## Effects

- **dom.create** — `‹tag›` (el:26) · `input` (slider:79)
- **event.listen** — `click on b → onClick` (button:63) · `input on input → (inline)` (slider:88) · `pointerdown on input → (inline)` (slider:93) · `pointerup on input → release` (slider:99) · `pointercancel on input → release` (slider:100) · `blur on input → release` (slider:101) · `lostpointercapture on input → release` (slider:102) · `click on b → (inline)` (chips:144)

## Symbols

### <a id="s-DOC"></a>`DOC`

const · L1–1

<!-- note:DOC -->
<!-- /note -->

### <a id="s-fmtDist"></a>`fmtDist(d)`

function · **exported** · L3–9

- called by: [`mountConsole`](console.js.md#s-mountConsole) _js/console/console.js_ · [`vesselCard`](panels/crew-sky.js.md#s-vesselCard) _js/console/panels/crew-sky.js_ · [`mountPort`](panels/market.js.md#s-mountPort) _js/console/panels/market.js_ · [`mountContacts`](panels/nav.js.md#s-mountContacts) _js/console/panels/nav.js_ · [`mountMarks`](panels/nav.js.md#s-mountMarks) _js/console/panels/nav.js_ · [`mountTargets`](panels/nav.js.md#s-mountTargets) _js/console/panels/nav.js_ ×2 · [`mountStatus`](panels/ship.js.md#s-mountStatus) _js/console/panels/ship.js_

<!-- note:fmtDist -->
---- formatting ---------------------------------------------------------
<!-- /note -->

### <a id="s-fmtTime"></a>`fmtTime(sec)`

function · **exported** · L11–17

- called by: [`mountPower`](panels/ship.js.md#s-mountPower) _js/console/panels/ship.js_ ×2

<!-- note:fmtTime -->
<!-- /note -->

### <a id="s-clockOf"></a>`clockOf(t)`

function · **exported** · L19–23

- called by: [`mountStatus`](panels/ship.js.md#s-mountStatus) _js/console/panels/ship.js_

<!-- note:clockOf -->
<!-- /note -->

### <a id="s-el"></a>`el(tag, cls, text)`

function · **exported** · L25–30

- called by: [`build`](console.js.md#s-build) _js/console/console.js_ · [`paintHits`](console.js.md#s-paintHits) _js/console/console.js_ ×8 · [`paintRecents`](console.js.md#s-paintRecents) _js/console/console.js_ · [`paintTabs`](console.js.md#s-paintTabs) _js/console/console.js_ · [`button`](#s-button) · [`card`](#s-card) ×5 · [`chips`](#s-chips) ×2 · [`group`](#s-group) · [`note`](#s-note) · [`row`](#s-row) ×6 · [`section`](#s-section) ×2 · [`slider`](#s-slider) ×5 · [`mountCore`](panels/aria-core.js.md#s-mountCore) _js/console/panels/aria-core.js_ ×6 · [`mountCore>draw`](panels/aria-core.js.md#s-mountCore-draw) _js/console/panels/aria-core.js_ · [`mountAccount`](panels/corp-account.js.md#s-mountAccount) _js/console/panels/corp-account.js_ · [`mountBoard`](panels/corp-account.js.md#s-mountBoard) _js/console/panels/corp-account.js_ ×2 · [`mountConflict>side`](panels/corp-account.js.md#s-mountConflict-side) _js/console/panels/corp-account.js_ ×4 · [`mountOffline`](panels/corp-account.js.md#s-mountOffline) _js/console/panels/corp-account.js_ · [`mountSignIn`](panels/corp-account.js.md#s-mountSignIn) _js/console/panels/corp-account.js_ ×5 · [`mountSignedIn`](panels/corp-account.js.md#s-mountSignedIn) _js/console/panels/corp-account.js_ · [`mountMarshal`](panels/corp-marshal.js.md#s-mountMarshal) _js/console/panels/corp-marshal.js_ · [`mountMarshal>paint`](panels/corp-marshal.js.md#s-mountMarshal-paint) _js/console/panels/corp-marshal.js_ ×7 · [`careBlock`](panels/corp-town.js.md#s-careBlock) _js/console/panels/corp-town.js_ ×5 · [`careBlock>pick`](panels/corp-town.js.md#s-careBlock-pick) _js/console/panels/corp-town.js_ ×2 · [`lineCard`](panels/corp-town.js.md#s-lineCard) _js/console/panels/corp-town.js_ ×17 · [`mountTown`](panels/corp-town.js.md#s-mountTown) _js/console/panels/corp-town.js_ · [`mountTown>paint`](panels/corp-town.js.md#s-mountTown-paint) _js/console/panels/corp-town.js_ ×3 · [`mountBoard`](panels/corp.js.md#s-mountBoard) _js/console/panels/corp.js_ ×2 · [`mountCompany`](panels/corp.js.md#s-mountCompany) _js/console/panels/corp.js_ ×9 · [`mountGnn`](panels/corp.js.md#s-mountGnn) _js/console/panels/corp.js_ ×2 · [`mountPilot`](panels/corp.js.md#s-mountPilot) _js/console/panels/corp.js_ ×13 · [`mountStanding`](panels/corp.js.md#s-mountStanding) _js/console/panels/corp.js_ · [`actionRow`](panels/crew-brig.js.md#s-actionRow) _js/console/panels/crew-brig.js_ ×4 · [`captiveCard`](panels/crew-brig.js.md#s-captiveCard) _js/console/panels/crew-brig.js_ ×7 · [`mountBrig`](panels/crew-brig.js.md#s-mountBrig) _js/console/panels/crew-brig.js_ · [`mountBrig>paint`](panels/crew-brig.js.md#s-mountBrig-paint) _js/console/panels/crew-brig.js_ · [`mountGdb`](panels/crew-gdb.js.md#s-mountGdb) _js/console/panels/crew-gdb.js_ ×2 · [`mountGdb>paint`](panels/crew-gdb.js.md#s-mountGdb-paint) _js/console/panels/crew-gdb.js_ ×5 · [`personCard`](panels/crew-gdb.js.md#s-personCard) _js/console/panels/crew-gdb.js_ ×3 · [`mountGenome`](panels/crew-gene.js.md#s-mountGenome) _js/console/panels/crew-gene.js_ ×2 · [`mountGenome>paint`](panels/crew-gene.js.md#s-mountGenome-paint) _js/console/panels/crew-gene.js_ ×3 · [`mountLog`](panels/crew-gene.js.md#s-mountLog) _js/console/panels/crew-gene.js_ ×4 · [`mountLog>paint`](panels/crew-gene.js.md#s-mountLog-paint) _js/console/panels/crew-gene.js_ ×2 · [`recordCard`](panels/crew-gene.js.md#s-recordCard) _js/console/panels/crew-gene.js_ ×12 · [`mountSky`](panels/crew-sky.js.md#s-mountSky) _js/console/panels/crew-sky.js_ ×2 · [`mountSky>paint`](panels/crew-sky.js.md#s-mountSky-paint) _js/console/panels/crew-sky.js_ ×6 · [`vesselCard`](panels/crew-sky.js.md#s-vesselCard) _js/console/panels/crew-sky.js_ ×9 · [`childCard`](panels/crew.js.md#s-childCard) _js/console/panels/crew.js_ ×7 · [`logList`](panels/crew.js.md#s-logList) _js/console/panels/crew.js_ ×5 · [`mountBonds`](panels/crew.js.md#s-mountBonds) _js/console/panels/crew.js_ ×7 · [`mountHouse`](panels/crew.js.md#s-mountHouse) _js/console/panels/crew.js_ · [`mountRoster`](panels/crew.js.md#s-mountRoster) _js/console/panels/crew.js_ · [`mountRoster>paintList`](panels/crew.js.md#s-mountRoster-paintList) _js/console/panels/crew.js_ · [`mountTalkSub`](panels/crew.js.md#s-mountTalkSub) _js/console/panels/crew.js_ ×2 · [`CON.cr`](panels/market.js.md#s-CON-cr) _js/console/panels/market.js_ · [`CON.empty`](panels/market.js.md#s-CON-empty) _js/console/panels/market.js_ · [`CON.tag`](panels/market.js.md#s-CON-tag) _js/console/panels/market.js_ · [`SD.btn`](panels/market.js.md#s-SD-btn) _js/console/panels/market.js_ · [`SD.cr`](panels/market.js.md#s-SD-cr) _js/console/panels/market.js_ · [`SD.empty`](panels/market.js.md#s-SD-empty) _js/console/panels/market.js_ · [`SD.note`](panels/market.js.md#s-SD-note) _js/console/panels/market.js_ · [`SD.row`](panels/market.js.md#s-SD-row) _js/console/panels/market.js_ ×5 · [`SD.sec`](panels/market.js.md#s-SD-sec) _js/console/panels/market.js_ ×2 · [`SD.tag`](panels/market.js.md#s-SD-tag) _js/console/panels/market.js_ · [`mountHold`](panels/market.js.md#s-mountHold) _js/console/panels/market.js_ · [`mountHold>drawManifest`](panels/market.js.md#s-mountHold-drawManifest) _js/console/panels/market.js_ ×2 · [`mountPort`](panels/market.js.md#s-mountPort) _js/console/panels/market.js_ ×6 · [`mountRefit`](panels/market.js.md#s-mountRefit) _js/console/panels/market.js_ ×4 · [`mountRoutes`](panels/market.js.md#s-mountRoutes) _js/console/panels/market.js_ ×3 · [`mountAutopilot`](panels/nav.js.md#s-mountAutopilot) _js/console/panels/nav.js_ ×4 · [`mountContacts`](panels/nav.js.md#s-mountContacts) _js/console/panels/nav.js_ ×3 · [`mountMarks`](panels/nav.js.md#s-mountMarks) _js/console/panels/nav.js_ ×2 · [`mountMarks>rebuild`](panels/nav.js.md#s-mountMarks-rebuild) _js/console/panels/nav.js_ ×2 · [`mountTargets`](panels/nav.js.md#s-mountTargets) _js/console/panels/nav.js_ ×2 · [`mountPower`](panels/ship.js.md#s-mountPower) _js/console/panels/ship.js_ · [`mountStatus`](panels/ship.js.md#s-mountStatus) _js/console/panels/ship.js_ ×7 · [`mountSystems`](panels/ship.js.md#s-mountSystems) _js/console/panels/ship.js_ ×16 · [`mountTrim`](panels/ship.js.md#s-mountTrim) _js/console/panels/ship.js_ ×3 · [`telemetryBlock`](panels/ship.js.md#s-telemetryBlock) _js/console/panels/ship.js_ ×12 · [`mount`](panels/work-drones.js.md#s-mount) _js/console/panels/work-drones.js_ · [`mount`](panels/work-fleet.js.md#s-mount) _js/console/panels/work-fleet.js_ · [`mount`](panels/work-tape.js.md#s-mount) _js/console/panels/work-tape.js_ · [`condBuilder`](panels/work.js.md#s-condBuilder) _js/console/panels/work.js_ ×4 · [`editor`](panels/work.js.md#s-editor) _js/console/panels/work.js_ · [`editor>render`](panels/work.js.md#s-editor-render) _js/console/panels/work.js_ ×5 · [`liveCard`](panels/work.js.md#s-liveCard) _js/console/panels/work.js_ ×5 · [`stepSheet`](panels/work.js.md#s-stepSheet) _js/console/panels/work.js_ ×8 · [`build`](../crew/robotyard.js.md#s-build) _js/crew/robotyard.js_ ×2 · [`build`](../station/fabyard.js.md#s-build) _js/station/fabyard.js_ ×2 · [`build`](../station/refityard.js.md#s-build) _js/station/refityard.js_ ×2
- effects: dom.create `‹tag›`

<!-- note:el -->
---- tiny DOM builders --------------------------------------------------
<!-- /note -->

### <a id="s-section"></a>`section(title)`

function · **exported** · L32–36

- calls: [`el`](#s-el) ×2
- called by: [`mountCore`](panels/aria-core.js.md#s-mountCore) _js/console/panels/aria-core.js_ ×4 · [`mountAccount`](panels/corp-account.js.md#s-mountAccount) _js/console/panels/corp-account.js_ · [`mountMarshal`](panels/corp-marshal.js.md#s-mountMarshal) _js/console/panels/corp-marshal.js_ · [`mountMarshal>paint`](panels/corp-marshal.js.md#s-mountMarshal-paint) _js/console/panels/corp-marshal.js_ · [`mountTown>paint`](panels/corp-town.js.md#s-mountTown-paint) _js/console/panels/corp-town.js_ ×5 · [`mountBoard`](panels/corp.js.md#s-mountBoard) _js/console/panels/corp.js_ ×2 · [`mountCompany`](panels/corp.js.md#s-mountCompany) _js/console/panels/corp.js_ ×4 · [`mountGnn`](panels/corp.js.md#s-mountGnn) _js/console/panels/corp.js_ ×2 · [`mountPilot`](panels/corp.js.md#s-mountPilot) _js/console/panels/corp.js_ ×6 · [`mountStanding`](panels/corp.js.md#s-mountStanding) _js/console/panels/corp.js_ · [`mountBrig`](panels/crew-brig.js.md#s-mountBrig) _js/console/panels/crew-brig.js_ · [`mountGdb`](panels/crew-gdb.js.md#s-mountGdb) _js/console/panels/crew-gdb.js_ ×3 · [`mountGenome`](panels/crew-gene.js.md#s-mountGenome) _js/console/panels/crew-gene.js_ · [`mountGenome>paint`](panels/crew-gene.js.md#s-mountGenome-paint) _js/console/panels/crew-gene.js_ ×7 · [`mountLog`](panels/crew-gene.js.md#s-mountLog) _js/console/panels/crew-gene.js_ ×2 · [`mountSky`](panels/crew-sky.js.md#s-mountSky) _js/console/panels/crew-sky.js_ ×3 · [`mountBonds`](panels/crew.js.md#s-mountBonds) _js/console/panels/crew.js_ ×4 · [`mountHouse`](panels/crew.js.md#s-mountHouse) _js/console/panels/crew.js_ ×2 · [`mountRoster`](panels/crew.js.md#s-mountRoster) _js/console/panels/crew.js_ ×2 · [`mountTalkSub`](panels/crew.js.md#s-mountTalkSub) _js/console/panels/crew.js_ · [`CON.sec`](panels/market.js.md#s-CON-sec) _js/console/panels/market.js_ · [`mountHold`](panels/market.js.md#s-mountHold) _js/console/panels/market.js_ ×3 · [`mountPort`](panels/market.js.md#s-mountPort) _js/console/panels/market.js_ ×3 · [`mountRefit`](panels/market.js.md#s-mountRefit) _js/console/panels/market.js_ ×2 · [`mountRoutes`](panels/market.js.md#s-mountRoutes) _js/console/panels/market.js_ ×2 · [`mountAria`](panels/nav.js.md#s-mountAria) _js/console/panels/nav.js_ ×3 · [`mountAutopilot`](panels/nav.js.md#s-mountAutopilot) _js/console/panels/nav.js_ ×2 · [`mountContacts`](panels/nav.js.md#s-mountContacts) _js/console/panels/nav.js_ ×2 · [`mountMarks`](panels/nav.js.md#s-mountMarks) _js/console/panels/nav.js_ ×2 · [`mountSurvey`](panels/nav.js.md#s-mountSurvey) _js/console/panels/nav.js_ ×2 · [`mountTargets`](panels/nav.js.md#s-mountTargets) _js/console/panels/nav.js_ ×2 · [`mountPower`](panels/ship.js.md#s-mountPower) _js/console/panels/ship.js_ ×4 · [`mountStatus`](panels/ship.js.md#s-mountStatus) _js/console/panels/ship.js_ ×6 · [`mountSystems`](panels/ship.js.md#s-mountSystems) _js/console/panels/ship.js_ ×6 · [`mountTrim`](panels/ship.js.md#s-mountTrim) _js/console/panels/ship.js_ ×2 · [`telemetryBlock`](panels/ship.js.md#s-telemetryBlock) _js/console/panels/ship.js_ · [`boardSection`](panels/work-drones.js.md#s-boardSection) _js/console/panels/work-drones.js_ · [`buildSection`](panels/work-drones.js.md#s-buildSection) _js/console/panels/work-drones.js_ · [`mount>render`](panels/work-drones.js.md#s-mount-render) _js/console/panels/work-drones.js_ · [`fleetSection`](panels/work-fleet.js.md#s-fleetSection) _js/console/panels/work-fleet.js_ · [`yardSection`](panels/work-fleet.js.md#s-yardSection) _js/console/panels/work-fleet.js_ · [`exportSection`](panels/work-tape.js.md#s-exportSection) _js/console/panels/work-tape.js_ · [`neighbourSection`](panels/work-tape.js.md#s-neighbourSection) _js/console/panels/work-tape.js_ · [`statusSection`](panels/work-tape.js.md#s-statusSection) _js/console/panels/work-tape.js_ · [`editor>render`](panels/work.js.md#s-editor-render) _js/console/panels/work.js_ ×5 · [`build`](../crew/robotyard.js.md#s-build) _js/crew/robotyard.js_ ×2 · [`build`](../station/fabyard.js.md#s-build) _js/station/fabyard.js_ ×4 · [`build`](../station/refityard.js.md#s-build) _js/station/refityard.js_ ×4

<!-- note:section -->
<!-- /note -->

### <a id="s-note"></a>`note(parent, text)`

function · **exported** · L38–40

- calls: [`el`](#s-el)
- called by: [`mountCore`](panels/aria-core.js.md#s-mountCore) _js/console/panels/aria-core.js_ ×4 · [`mountAccount>paint`](panels/corp-account.js.md#s-mountAccount-paint) _js/console/panels/corp-account.js_ · [`mountBoard>paintBoard`](panels/corp-account.js.md#s-mountBoard-paintBoard) _js/console/panels/corp-account.js_ ×3 · [`mountConflict`](panels/corp-account.js.md#s-mountConflict) _js/console/panels/corp-account.js_ · [`mountOffline`](panels/corp-account.js.md#s-mountOffline) _js/console/panels/corp-account.js_ · [`mountSignIn`](panels/corp-account.js.md#s-mountSignIn) _js/console/panels/corp-account.js_ · [`mountSignedIn`](panels/corp-account.js.md#s-mountSignedIn) _js/console/panels/corp-account.js_ ×2 · [`markCard`](panels/corp-marshal.js.md#s-markCard) _js/console/panels/corp-marshal.js_ · [`mountMarshal>paint`](panels/corp-marshal.js.md#s-mountMarshal-paint) _js/console/panels/corp-marshal.js_ · [`mountTown>paint`](panels/corp-town.js.md#s-mountTown-paint) _js/console/panels/corp-town.js_ ×5 · [`mountBoard`](panels/corp.js.md#s-mountBoard) _js/console/panels/corp.js_ · [`mountCompany`](panels/corp.js.md#s-mountCompany) _js/console/panels/corp.js_ ×3 · [`captiveCard`](panels/crew-brig.js.md#s-captiveCard) _js/console/panels/crew-brig.js_ · [`mountBrig`](panels/crew-brig.js.md#s-mountBrig) _js/console/panels/crew-brig.js_ · [`mountGdb`](panels/crew-gdb.js.md#s-mountGdb) _js/console/panels/crew-gdb.js_ · [`personCard`](panels/crew-gdb.js.md#s-personCard) _js/console/panels/crew-gdb.js_ ×2 · [`mountGenome`](panels/crew-gene.js.md#s-mountGenome) _js/console/panels/crew-gene.js_ · [`mountGenome>paint`](panels/crew-gene.js.md#s-mountGenome-paint) _js/console/panels/crew-gene.js_ ×10 · [`mountLog`](panels/crew-gene.js.md#s-mountLog) _js/console/panels/crew-gene.js_ ×2 · [`mountSky`](panels/crew-sky.js.md#s-mountSky) _js/console/panels/crew-sky.js_ · [`vesselCard`](panels/crew-sky.js.md#s-vesselCard) _js/console/panels/crew-sky.js_ ×2 · [`childCard`](panels/crew.js.md#s-childCard) _js/console/panels/crew.js_ · [`mountBonds`](panels/crew.js.md#s-mountBonds) _js/console/panels/crew.js_ · [`mountHouse`](panels/crew.js.md#s-mountHouse) _js/console/panels/crew.js_ · [`CON.note`](panels/market.js.md#s-CON-note) _js/console/panels/market.js_ · [`mountHold`](panels/market.js.md#s-mountHold) _js/console/panels/market.js_ · [`mountRefit`](panels/market.js.md#s-mountRefit) _js/console/panels/market.js_ · [`mountRoutes`](panels/market.js.md#s-mountRoutes) _js/console/panels/market.js_ · [`mountAria`](panels/nav.js.md#s-mountAria) _js/console/panels/nav.js_ ×2 · [`mountAutopilot`](panels/nav.js.md#s-mountAutopilot) _js/console/panels/nav.js_ · [`mountContacts`](panels/nav.js.md#s-mountContacts) _js/console/panels/nav.js_ · [`mountMarks`](panels/nav.js.md#s-mountMarks) _js/console/panels/nav.js_ · [`mountSurvey`](panels/nav.js.md#s-mountSurvey) _js/console/panels/nav.js_ ×4 · [`mountPower`](panels/ship.js.md#s-mountPower) _js/console/panels/ship.js_ · [`mountSystems`](panels/ship.js.md#s-mountSystems) _js/console/panels/ship.js_ ×2 · [`askRow`](panels/work-drones.js.md#s-askRow) _js/console/panels/work-drones.js_ · [`boardSection`](panels/work-drones.js.md#s-boardSection) _js/console/panels/work-drones.js_ · [`buildSection`](panels/work-drones.js.md#s-buildSection) _js/console/panels/work-drones.js_ ×3 · [`droneCard`](panels/work-drones.js.md#s-droneCard) _js/console/panels/work-drones.js_ · [`mount>render`](panels/work-drones.js.md#s-mount-render) _js/console/panels/work-drones.js_ · [`fleetSection`](panels/work-fleet.js.md#s-fleetSection) _js/console/panels/work-fleet.js_ ×2 · [`yardSection`](panels/work-fleet.js.md#s-yardSection) _js/console/panels/work-fleet.js_ ×4 · [`exportSection`](panels/work-tape.js.md#s-exportSection) _js/console/panels/work-tape.js_ · [`neighbourSection`](panels/work-tape.js.md#s-neighbourSection) _js/console/panels/work-tape.js_ ×3 · [`statusSection`](panels/work-tape.js.md#s-statusSection) _js/console/panels/work-tape.js_ ×3 · [`editor>render`](panels/work.js.md#s-editor-render) _js/console/panels/work.js_ ×8 · [`build`](../crew/robotyard.js.md#s-build) _js/crew/robotyard.js_ ×4 · [`build`](../station/fabyard.js.md#s-build) _js/station/fabyard.js_ ×6 · [`build`](../station/refityard.js.md#s-build) _js/station/refityard.js_ ×9

<!-- note:note -->
<!-- /note -->

### <a id="s-row"></a>`row(parent, label, opts=)`

function · **exported** · L42–58

- calls: [`el`](#s-el) ×6
- called by: [`mountCore`](panels/aria-core.js.md#s-mountCore) _js/console/panels/aria-core.js_ ×7 · [`mountCore>draw`](panels/aria-core.js.md#s-mountCore-draw) _js/console/panels/aria-core.js_ ×7 · [`mountAccount`](panels/corp-account.js.md#s-mountAccount) _js/console/panels/corp-account.js_ · [`mountBoard>paintBoard`](panels/corp-account.js.md#s-mountBoard-paintBoard) _js/console/panels/corp-account.js_ · [`mountConflict>side`](panels/corp-account.js.md#s-mountConflict-side) _js/console/panels/corp-account.js_ ×5 · [`mountSignedIn`](panels/corp-account.js.md#s-mountSignedIn) _js/console/panels/corp-account.js_ ×2 · [`markCard`](panels/corp-marshal.js.md#s-markCard) _js/console/panels/corp-marshal.js_ ×5 · [`mountMarshal`](panels/corp-marshal.js.md#s-mountMarshal) _js/console/panels/corp-marshal.js_ ×4 · [`mountTown>paint`](panels/corp-town.js.md#s-mountTown-paint) _js/console/panels/corp-town.js_ ×3 · [`mountCompany`](panels/corp.js.md#s-mountCompany) _js/console/panels/corp.js_ ×5 · [`mountGnn`](panels/corp.js.md#s-mountGnn) _js/console/panels/corp.js_ ×2 · [`mountPilot`](panels/corp.js.md#s-mountPilot) _js/console/panels/corp.js_ ×19 · [`mountStanding`](panels/corp.js.md#s-mountStanding) _js/console/panels/corp.js_ · [`captiveCard`](panels/crew-brig.js.md#s-captiveCard) _js/console/panels/crew-brig.js_ ×4 · [`mountBrig`](panels/crew-brig.js.md#s-mountBrig) _js/console/panels/crew-brig.js_ ×2 · [`mountGdb>paint`](panels/crew-gdb.js.md#s-mountGdb-paint) _js/console/panels/crew-gdb.js_ ×4 · [`personCard`](panels/crew-gdb.js.md#s-personCard) _js/console/panels/crew-gdb.js_ ×3 · [`mountGenome>paint`](panels/crew-gene.js.md#s-mountGenome-paint) _js/console/panels/crew-gene.js_ ×17 · [`recordCard`](panels/crew-gene.js.md#s-recordCard) _js/console/panels/crew-gene.js_ ×2 · [`mountSky`](panels/crew-sky.js.md#s-mountSky) _js/console/panels/crew-sky.js_ ×2 · [`vesselCard`](panels/crew-sky.js.md#s-vesselCard) _js/console/panels/crew-sky.js_ ×3 · [`childCard`](panels/crew.js.md#s-childCard) _js/console/panels/crew.js_ ×8 · [`mountBonds`](panels/crew.js.md#s-mountBonds) _js/console/panels/crew.js_ ×6 · [`mountHouse`](panels/crew.js.md#s-mountHouse) _js/console/panels/crew.js_ ×7 · [`mountRoster`](panels/crew.js.md#s-mountRoster) _js/console/panels/crew.js_ ×4 · [`rosterCard`](panels/crew.js.md#s-rosterCard) _js/console/panels/crew.js_ ×9 · [`CON.row`](panels/market.js.md#s-CON-row) _js/console/panels/market.js_ · [`mountHold`](panels/market.js.md#s-mountHold) _js/console/panels/market.js_ ×5 · [`mountHold>drawManifest`](panels/market.js.md#s-mountHold-drawManifest) _js/console/panels/market.js_ · [`mountPort`](panels/market.js.md#s-mountPort) _js/console/panels/market.js_ ×6 · [`mountRefit`](panels/market.js.md#s-mountRefit) _js/console/panels/market.js_ · [`mountRoutes`](panels/market.js.md#s-mountRoutes) _js/console/panels/market.js_ ×2 · [`mountAria`](panels/nav.js.md#s-mountAria) _js/console/panels/nav.js_ ×8 · [`mountAutopilot`](panels/nav.js.md#s-mountAutopilot) _js/console/panels/nav.js_ ×11 · [`mountContacts`](panels/nav.js.md#s-mountContacts) _js/console/panels/nav.js_ ×3 · [`mountMarks`](panels/nav.js.md#s-mountMarks) _js/console/panels/nav.js_ · [`mountMarks>rebuild`](panels/nav.js.md#s-mountMarks-rebuild) _js/console/panels/nav.js_ · [`mountSurvey`](panels/nav.js.md#s-mountSurvey) _js/console/panels/nav.js_ ×8 · [`mountTargets`](panels/nav.js.md#s-mountTargets) _js/console/panels/nav.js_ ×9 · [`mountPower`](panels/ship.js.md#s-mountPower) _js/console/panels/ship.js_ ×6 · [`mountPower>drawShed`](panels/ship.js.md#s-mountPower-drawShed) _js/console/panels/ship.js_ · [`mountStatus`](panels/ship.js.md#s-mountStatus) _js/console/panels/ship.js_ ×15 · [`mountSystems`](panels/ship.js.md#s-mountSystems) _js/console/panels/ship.js_ ×10 · [`mountTrim`](panels/ship.js.md#s-mountTrim) _js/console/panels/ship.js_ ×3 · [`askRow`](panels/work-drones.js.md#s-askRow) _js/console/panels/work-drones.js_ · [`boardSection`](panels/work-drones.js.md#s-boardSection) _js/console/panels/work-drones.js_ ×2 · [`buildSection`](panels/work-drones.js.md#s-buildSection) _js/console/panels/work-drones.js_ ×5 · [`droneCard`](panels/work-drones.js.md#s-droneCard) _js/console/panels/work-drones.js_ ×4 · [`fleetSection`](panels/work-fleet.js.md#s-fleetSection) _js/console/panels/work-fleet.js_ ×2 · [`yardSection`](panels/work-fleet.js.md#s-yardSection) _js/console/panels/work-fleet.js_ · [`exportSection`](panels/work-tape.js.md#s-exportSection) _js/console/panels/work-tape.js_ ×3 · [`neighbourSection`](panels/work-tape.js.md#s-neighbourSection) _js/console/panels/work-tape.js_ · [`statusSection`](panels/work-tape.js.md#s-statusSection) _js/console/panels/work-tape.js_ ×4 · [`editor>render`](panels/work.js.md#s-editor-render) _js/console/panels/work.js_ ×9 · [`build`](../crew/robotyard.js.md#s-build) _js/crew/robotyard.js_ ×3 · [`build`](../station/fabyard.js.md#s-build) _js/station/fabyard.js_ ×8 · [`build`](../station/refityard.js.md#s-build) _js/station/refityard.js_ ×4 · [`build>pctRow`](../station/refityard.js.md#s-build-pctRow) _js/station/refityard.js_

<!-- note:row -->
label + right-aligned value, optional sub-hint and a bar under the label
<!-- /note -->

### <a id="s-button"></a>`button(label, onClick, cls=)`

function · **exported** · L60–65

- calls: [`el`](#s-el)
- called by: [`mountCore`](panels/aria-core.js.md#s-mountCore) _js/console/panels/aria-core.js_ ×2 · [`mountConflict`](panels/corp-account.js.md#s-mountConflict) _js/console/panels/corp-account.js_ ×2 · [`mountSignIn`](panels/corp-account.js.md#s-mountSignIn) _js/console/panels/corp-account.js_ · [`mountSignedIn`](panels/corp-account.js.md#s-mountSignedIn) _js/console/panels/corp-account.js_ ×3 · [`markCard`](panels/corp-marshal.js.md#s-markCard) _js/console/panels/corp-marshal.js_ ×3 · [`careBlock`](panels/corp-town.js.md#s-careBlock) _js/console/panels/corp-town.js_ · [`lineCard`](panels/corp-town.js.md#s-lineCard) _js/console/panels/corp-town.js_ · [`mountTown>paint`](panels/corp-town.js.md#s-mountTown-paint) _js/console/panels/corp-town.js_ ×5 · [`mountBoard>cbtn`](panels/corp.js.md#s-mountBoard-cbtn) _js/console/panels/corp.js_ · [`mountCompany`](panels/corp.js.md#s-mountCompany) _js/console/panels/corp.js_ ×5 · [`mountGnn`](panels/corp.js.md#s-mountGnn) _js/console/panels/corp.js_ ×2 · [`mountPilot`](panels/corp.js.md#s-mountPilot) _js/console/panels/corp.js_ ×3 · [`actionRow`](panels/crew-brig.js.md#s-actionRow) _js/console/panels/crew-brig.js_ · [`captiveCard`](panels/crew-brig.js.md#s-captiveCard) _js/console/panels/crew-brig.js_ ×5 · [`mountGdb>paint`](panels/crew-gdb.js.md#s-mountGdb-paint) _js/console/panels/crew-gdb.js_ ×3 · [`mountGenome>paint`](panels/crew-gene.js.md#s-mountGenome-paint) _js/console/panels/crew-gene.js_ ×4 · [`mountLog`](panels/crew-gene.js.md#s-mountLog) _js/console/panels/crew-gene.js_ ×3 · [`vesselCard`](panels/crew-sky.js.md#s-vesselCard) _js/console/panels/crew-sky.js_ · [`childCard`](panels/crew.js.md#s-childCard) _js/console/panels/crew.js_ ×3 · [`rosterCard`](panels/crew.js.md#s-rosterCard) _js/console/panels/crew.js_ ×6 · [`CON.btn`](panels/market.js.md#s-CON-btn) _js/console/panels/market.js_ · [`mountHold`](panels/market.js.md#s-mountHold) _js/console/panels/market.js_ · [`mountHold>drawManifest`](panels/market.js.md#s-mountHold-drawManifest) _js/console/panels/market.js_ ×2 · [`mountPort`](panels/market.js.md#s-mountPort) _js/console/panels/market.js_ ×2 · [`mountRoutes`](panels/market.js.md#s-mountRoutes) _js/console/panels/market.js_ ×3 · [`mountAria`](panels/nav.js.md#s-mountAria) _js/console/panels/nav.js_ ×2 · [`mountAutopilot`](panels/nav.js.md#s-mountAutopilot) _js/console/panels/nav.js_ ×12 · [`mountContacts`](panels/nav.js.md#s-mountContacts) _js/console/panels/nav.js_ ×3 · [`mountMarks`](panels/nav.js.md#s-mountMarks) _js/console/panels/nav.js_ · [`mountMarks>rebuild`](panels/nav.js.md#s-mountMarks-rebuild) _js/console/panels/nav.js_ ×2 · [`mountTargets`](panels/nav.js.md#s-mountTargets) _js/console/panels/nav.js_ ×5 · [`mountPower>drawShed`](panels/ship.js.md#s-mountPower-drawShed) _js/console/panels/ship.js_ ×2 · [`mountSystems`](panels/ship.js.md#s-mountSystems) _js/console/panels/ship.js_ ×6 · [`mountTrim`](panels/ship.js.md#s-mountTrim) _js/console/panels/ship.js_ ×2 · [`buildSection`](panels/work-drones.js.md#s-buildSection) _js/console/panels/work-drones.js_ · [`droneCard`](panels/work-drones.js.md#s-droneCard) _js/console/panels/work-drones.js_ ×7 · [`fleetSection`](panels/work-fleet.js.md#s-fleetSection) _js/console/panels/work-fleet.js_ · [`yardSection`](panels/work-fleet.js.md#s-yardSection) _js/console/panels/work-fleet.js_ · [`exportSection`](panels/work-tape.js.md#s-exportSection) _js/console/panels/work-tape.js_ ×3 · [`condBuilder`](panels/work.js.md#s-condBuilder) _js/console/panels/work.js_ ×2 · [`editor>render`](panels/work.js.md#s-editor-render) _js/console/panels/work.js_ ×16 · [`liveCard`](panels/work.js.md#s-liveCard) _js/console/panels/work.js_ ×6 · [`stepSheet`](panels/work.js.md#s-stepSheet) _js/console/panels/work.js_ ×4 · [`build`](../crew/robotyard.js.md#s-build) _js/crew/robotyard.js_ ×3 · [`build`](../station/fabyard.js.md#s-build) _js/station/fabyard.js_ ×6 · [`build`](../station/refityard.js.md#s-build) _js/station/refityard.js_ ×2 · [`build>act`](../station/refityard.js.md#s-build-act) _js/station/refityard.js_
- effects: event.listen `click`

<!-- note:button -->
<!-- /note -->

### <a id="s-group"></a>`group(...kids)`

function · **exported** · L67–71

- calls: [`el`](#s-el)
- called by: [`mountBoard`](panels/corp-account.js.md#s-mountBoard) _js/console/panels/corp-account.js_ · [`mountConflict`](panels/corp-account.js.md#s-mountConflict) _js/console/panels/corp-account.js_ · [`mountOffline`](panels/corp-account.js.md#s-mountOffline) _js/console/panels/corp-account.js_ · [`mountSignIn`](panels/corp-account.js.md#s-mountSignIn) _js/console/panels/corp-account.js_ ×4 · [`mountSignedIn`](panels/corp-account.js.md#s-mountSignedIn) _js/console/panels/corp-account.js_ ×2 · [`markCard`](panels/corp-marshal.js.md#s-markCard) _js/console/panels/corp-marshal.js_ ×2 · [`mountCompany`](panels/corp.js.md#s-mountCompany) _js/console/panels/corp.js_ ×2 · [`mountGnn`](panels/corp.js.md#s-mountGnn) _js/console/panels/corp.js_ · [`mountPilot`](panels/corp.js.md#s-mountPilot) _js/console/panels/corp.js_ · [`captiveCard`](panels/crew-brig.js.md#s-captiveCard) _js/console/panels/crew-brig.js_ · [`mountLog`](panels/crew-gene.js.md#s-mountLog) _js/console/panels/crew-gene.js_ · [`mountHouse`](panels/crew.js.md#s-mountHouse) _js/console/panels/crew.js_ · [`rosterCard`](panels/crew.js.md#s-rosterCard) _js/console/panels/crew.js_ · [`CON.row`](panels/market.js.md#s-CON-row) _js/console/panels/market.js_ · [`mountHold>drawManifest`](panels/market.js.md#s-mountHold-drawManifest) _js/console/panels/market.js_ · [`mountPort`](panels/market.js.md#s-mountPort) _js/console/panels/market.js_ · [`mountRoutes`](panels/market.js.md#s-mountRoutes) _js/console/panels/market.js_ · [`mountAutopilot`](panels/nav.js.md#s-mountAutopilot) _js/console/panels/nav.js_ ×5 · [`mountContacts`](panels/nav.js.md#s-mountContacts) _js/console/panels/nav.js_ ×2 · [`mountMarks`](panels/nav.js.md#s-mountMarks) _js/console/panels/nav.js_ · [`mountMarks>rebuild`](panels/nav.js.md#s-mountMarks-rebuild) _js/console/panels/nav.js_ · [`mountTargets`](panels/nav.js.md#s-mountTargets) _js/console/panels/nav.js_ ×2 · [`mountPower>drawShed`](panels/ship.js.md#s-mountPower-drawShed) _js/console/panels/ship.js_ · [`droneCard`](panels/work-drones.js.md#s-droneCard) _js/console/panels/work-drones.js_ · [`condBuilder`](panels/work.js.md#s-condBuilder) _js/console/panels/work.js_ · [`editor>render`](panels/work.js.md#s-editor-render) _js/console/panels/work.js_ ×4 · [`liveCard`](panels/work.js.md#s-liveCard) _js/console/panels/work.js_ ×2 · [`stepSheet`](panels/work.js.md#s-stepSheet) _js/console/panels/work.js_ ×2 · [`build`](../crew/robotyard.js.md#s-build) _js/crew/robotyard.js_

<!-- note:group -->
<!-- /note -->

### <a id="s-slider"></a>`slider(parent, spec, get, set, fmt)`

function · **exported** · L73–115

- calls: [`chips.get`](#s-chips-get) ×2 · [`chips>set`](#s-chips-set) · [`el`](#s-el) ×5 · [`slider>show`](#s-slider-show) ×3
- called by: [`mountPower`](panels/ship.js.md#s-mountPower) _js/console/panels/ship.js_ · [`mountTrim`](panels/ship.js.md#s-mountTrim) _js/console/panels/ship.js_
- effects: dom.create `input` · event.listen `input` · event.listen `pointerdown` · event.listen `pointerup` · event.listen `pointercancel` · event.listen `blur` · event.listen `lostpointercapture`

<!-- note:slider -->
label + range input, wired straight to a getter/setter pair

- L92 · `let dragging = false;` — Track the actual drag rather than focus: a slider you tapped and let go of
  still has focus, and must follow a reset or an external change.
<!-- /note -->

#### <a id="s-slider-show"></a>`slider>show()`

function · L85–87

- called by: [`slider`](#s-slider) ×3

<!-- note:slider>show -->
<!-- /note -->

#### <a id="s-slider-release"></a>`slider>release()`

function · L96–98

<!-- note:slider>release -->
<!-- /note -->

### <a id="s-pct"></a>`pct(x)`

function · **exported** · L117–119

- called by: [`setBar`](#s-setBar) · [`mountGenome>paint`](panels/crew-gene.js.md#s-mountGenome-paint) _js/console/panels/crew-gene.js_ ×4 · [`recordCard`](panels/crew-gene.js.md#s-recordCard) _js/console/panels/crew-gene.js_ · [`mountStatus`](panels/ship.js.md#s-mountStatus) _js/console/panels/ship.js_ ×2 · [`mountSystems`](panels/ship.js.md#s-mountSystems) _js/console/panels/ship.js_ ×2 · [`droneCard`](panels/work-drones.js.md#s-droneCard) _js/console/panels/work-drones.js_ · [`mount`](panels/work-drones.js.md#s-mount) _js/console/panels/work-drones.js_ ×2

<!-- note:pct -->
<!-- /note -->

### <a id="s-setBar"></a>`setBar(bar, frac, tone)`

function · **exported** · L121–128

- calls: [`pct`](#s-pct)
- called by: [`markCard`](panels/corp-marshal.js.md#s-markCard) _js/console/panels/corp-marshal.js_ · [`mountTown>paint`](panels/corp-town.js.md#s-mountTown-paint) _js/console/panels/corp-town.js_ · [`mountPilot`](panels/corp.js.md#s-mountPilot) _js/console/panels/corp.js_ · [`captiveCard`](panels/crew-brig.js.md#s-captiveCard) _js/console/panels/crew-brig.js_ ×3 · [`mountBrig>paint`](panels/crew-brig.js.md#s-mountBrig-paint) _js/console/panels/crew-brig.js_ · [`mountGenome>paint`](panels/crew-gene.js.md#s-mountGenome-paint) _js/console/panels/crew-gene.js_ ×5 · [`recordCard`](panels/crew-gene.js.md#s-recordCard) _js/console/panels/crew-gene.js_ · [`vesselCard`](panels/crew-sky.js.md#s-vesselCard) _js/console/panels/crew-sky.js_ ×2 · [`childCard`](panels/crew.js.md#s-childCard) _js/console/panels/crew.js_ · [`mountBonds`](panels/crew.js.md#s-mountBonds) _js/console/panels/crew.js_ ×2 · [`mountRoster`](panels/crew.js.md#s-mountRoster) _js/console/panels/crew.js_ · [`rosterCard`](panels/crew.js.md#s-rosterCard) _js/console/panels/crew.js_ ×2 · [`mountHold`](panels/market.js.md#s-mountHold) _js/console/panels/market.js_ · [`mountPower`](panels/ship.js.md#s-mountPower) _js/console/panels/ship.js_ ×2 · [`mountStatus`](panels/ship.js.md#s-mountStatus) _js/console/panels/ship.js_ ×5 · [`droneCard`](panels/work-drones.js.md#s-droneCard) _js/console/panels/work-drones.js_ ×2 · [`build`](../crew/robotyard.js.md#s-build) _js/crew/robotyard.js_

<!-- note:setBar -->
<!-- /note -->

### <a id="s-chips"></a>`chips(list, {…}=)`

function · **exported** · L130–153

- calls: [`chips>set`](#s-chips-set) ×2 · [`el`](#s-el) ×2
- called by: [`mountMarshal`](panels/corp-marshal.js.md#s-mountMarshal) _js/console/panels/corp-marshal.js_ · [`lineCard`](panels/corp-town.js.md#s-lineCard) _js/console/panels/corp-town.js_ · [`captiveCard`](panels/crew-brig.js.md#s-captiveCard) _js/console/panels/crew-brig.js_ · [`mountGdb`](panels/crew-gdb.js.md#s-mountGdb) _js/console/panels/crew-gdb.js_ · [`picker`](panels/crew-gene.js.md#s-picker) _js/console/panels/crew-gene.js_ · [`mountSky`](panels/crew-sky.js.md#s-mountSky) _js/console/panels/crew-sky.js_ · [`mountHouse`](panels/crew.js.md#s-mountHouse) _js/console/panels/crew.js_ ×6 · [`mountRoster`](panels/crew.js.md#s-mountRoster) _js/console/panels/crew.js_ ×2 · [`mountTalkSub`](panels/crew.js.md#s-mountTalkSub) _js/console/panels/crew.js_ · [`rosterCard`](panels/crew.js.md#s-rosterCard) _js/console/panels/crew.js_ · [`askRow`](panels/work-drones.js.md#s-askRow) _js/console/panels/work-drones.js_ · [`buildSection`](panels/work-drones.js.md#s-buildSection) _js/console/panels/work-drones.js_ · [`droneCard`](panels/work-drones.js.md#s-droneCard) _js/console/panels/work-drones.js_ · [`statusSection`](panels/work-tape.js.md#s-statusSection) _js/console/panels/work-tape.js_ · [`condBuilder`](panels/work.js.md#s-condBuilder) _js/console/panels/work.js_ ×3 · [`editor>render`](panels/work.js.md#s-editor-render) _js/console/panels/work.js_ ×4 · [`stepSheet`](panels/work.js.md#s-stepSheet) _js/console/panels/work.js_ ×7
- effects: event.listen `click`

<!-- note:chips -->
---- console additions --------------------------------------------------

A row of pick-one chips. `list` is [{ id, label, cls?, hint? }] or plain
strings; `value` marks the current one; `onPick(id)` fires on tap. Returns
{ row, set(id) } so a refresher can move the highlight without rebuilding.
<!-- /note -->

#### <a id="s-chips-set"></a>`chips>set(id)`

function · L135–138

- called by: [`chips`](#s-chips) ×2 · [`slider`](#s-slider)

<!-- note:chips>set -->
<!-- /note -->

#### <a id="s-chips-get"></a>`chips.get()`

prop · L152–152

- called by: [`slider`](#s-slider) ×2

<!-- note:chips.get -->
<!-- /note -->

### <a id="s-card"></a>`card(title, hint)`

function · **exported** · L155–163

- calls: [`el`](#s-el) ×5
- called by: [`mountBoard`](panels/corp-account.js.md#s-mountBoard) _js/console/panels/corp-account.js_ · [`mountConflict`](panels/corp-account.js.md#s-mountConflict) _js/console/panels/corp-account.js_ · [`mountOffline`](panels/corp-account.js.md#s-mountOffline) _js/console/panels/corp-account.js_ · [`mountSignIn`](panels/corp-account.js.md#s-mountSignIn) _js/console/panels/corp-account.js_ · [`mountSignedIn`](panels/corp-account.js.md#s-mountSignedIn) _js/console/panels/corp-account.js_ · [`markCard`](panels/corp-marshal.js.md#s-markCard) _js/console/panels/corp-marshal.js_ · [`captiveCard`](panels/crew-brig.js.md#s-captiveCard) _js/console/panels/crew-brig.js_ · [`personCard`](panels/crew-gdb.js.md#s-personCard) _js/console/panels/crew-gdb.js_ · [`mountGenome>paint`](panels/crew-gene.js.md#s-mountGenome-paint) _js/console/panels/crew-gene.js_ · [`recordCard`](panels/crew-gene.js.md#s-recordCard) _js/console/panels/crew-gene.js_ · [`vesselCard`](panels/crew-sky.js.md#s-vesselCard) _js/console/panels/crew-sky.js_ · [`childCard`](panels/crew.js.md#s-childCard) _js/console/panels/crew.js_ · [`mountBonds`](panels/crew.js.md#s-mountBonds) _js/console/panels/crew.js_ · [`rosterCard`](panels/crew.js.md#s-rosterCard) _js/console/panels/crew.js_ · [`droneCard`](panels/work-drones.js.md#s-droneCard) _js/console/panels/work-drones.js_ · [`liveCard`](panels/work.js.md#s-liveCard) _js/console/panels/work.js_ · [`stepSheet`](panels/work.js.md#s-stepSheet) _js/console/panels/work.js_

<!-- note:card -->
A titled card with an optional hint line; append rows/groups to `.body`.
<!-- /note -->

### <a id="s-kit"></a>`kit`

const · **exported** · L165–165

<!-- note:kit -->
<!-- /note -->
