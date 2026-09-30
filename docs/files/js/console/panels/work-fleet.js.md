# js/console/panels/work-fleet.js

[index](../../../../README.md) · 63 lines · 10 symbols · 5 imports · 1 importers

## About

<!-- note:@file -->
LIVING GALAXY — CONSOLE › WORK › FLEET: the company's crewed hulls.

`fleetReport()` rows with SELL BACK, and the yard's offer (commission an
extract or haul hull with a member of staff in the chair) when docked at an
industrial or military yard — the same calls the port deck used to make. The
deck no longer carries a fleet at all (0.3.45).
<!-- /note -->

## Imports

| line | from | names | target |
|---|---|---|---|
| 1 | `../kit.js` | `el`, `section`, `note`, `row`, `button` | [js/console/kit.js](../kit.js.md) |
| 2 | `../../sim/sim.js` | `sim` | [js/sim/sim.js](../../sim/sim.js.md) |
| 3 | `../../station/stations.js` | `stationById` | [js/station/stations.js](../../station/stations.js.md) |
| 4 | `../../corp/company.js` | `company`, `hasCompany`, `staffAt` | [js/corp/company.js](../../corp/company.js.md) |
| 5 | `../../corp/fleet.js` | `commissionOptions`, `commissionHull`, `decommissionHull`, `fleetReport`, `fleet` | [js/corp/fleet.js](../../corp/fleet.js.md) |

## Imported by

- [js/console/panels/work.js](work.js.md) — `default`

## Exports

- `default` · ObjectExpression — used by [js/console/panels/work.js](work.js.md)

## Effects

_none detected_

## Symbols

### <a id="s-DOC"></a>`DOC`

const · L7–7

<!-- note:DOC -->
<!-- /note -->

### <a id="s-tell"></a>`tell(msg)`

function · L10–10

- called by: [`yardSection`](#s-yardSection)

<!-- note:tell -->
<!-- /note -->

### <a id="s-fleetSection"></a>`fleetSection(render)`

function · L12–23

- calls: [`button`](../kit.js.md#s-button) _js/console/kit.js_ · [`note`](../kit.js.md#s-note) _js/console/kit.js_ ×2 · [`row`](../kit.js.md#s-row) _js/console/kit.js_ ×2 · [`section`](../kit.js.md#s-section) _js/console/kit.js_ · [`mount>render`](#s-mount-render) · [`hasCompany`](../../corp/company.js.md#s-hasCompany) _js/corp/company.js_ · [`decommissionHull`](../../corp/fleet.js.md#s-decommissionHull) _js/corp/fleet.js_ · [`fleetReport`](../../corp/fleet.js.md#s-fleetReport) _js/corp/fleet.js_
- called by: [`mount>render`](#s-mount-render)

<!-- note:fleetSection -->
<!-- /note -->

### <a id="s-yardSection"></a>`yardSection(render)`

function · L25–41

- calls: [`button`](../kit.js.md#s-button) _js/console/kit.js_ · [`note`](../kit.js.md#s-note) _js/console/kit.js_ ×4 · [`row`](../kit.js.md#s-row) _js/console/kit.js_ · [`section`](../kit.js.md#s-section) _js/console/kit.js_ · [`mount>render`](#s-mount-render) · [`tell`](#s-tell) · [`hasCompany`](../../corp/company.js.md#s-hasCompany) _js/corp/company.js_ · [`staffAt`](../../corp/company.js.md#s-staffAt) _js/corp/company.js_ · [`commissionHull`](../../corp/fleet.js.md#s-commissionHull) _js/corp/fleet.js_ · [`commissionOptions`](../../corp/fleet.js.md#s-commissionOptions) _js/corp/fleet.js_ · [`stationById`](../../station/stations.js.md#s-stationById) _js/station/stations.js_
- via [js/corp/company.js](../../corp/company.js.md): `staffAt.filter`
- called by: [`mount>render`](#s-mount-render)

<!-- note:yardSection -->
<!-- /note -->

### <a id="s-mount"></a>`mount(root, ctx)`

prop · L48–57

- calls: [`el`](../kit.js.md#s-el) _js/console/kit.js_ · [`mount>render`](#s-mount-render) ×2 · [`mount>signature`](#s-mount-signature)

<!-- note:mount -->
<!-- /note -->

#### <a id="s-mount-signature"></a>`mount>signature()`

function · L52–52

- called by: [`mount`](#s-mount) · [`mount>render`](#s-mount-render)

<!-- note:mount>signature -->
<!-- /note -->

#### <a id="s-mount-render"></a>`mount>render()`

function · L53–53

- calls: [`fleetSection`](#s-fleetSection) · [`mount>signature`](#s-mount-signature) · [`yardSection`](#s-yardSection)
- called by: [`fleetSection`](#s-fleetSection) · [`mount`](#s-mount) ×2 · [`yardSection`](#s-yardSection)

<!-- note:mount>render -->
<!-- /note -->

### <a id="s-paint"></a>`paint()`

prop · L58–58

<!-- note:paint -->
<!-- /note -->

### <a id="s-unmount"></a>`unmount()`

prop · L59–59

<!-- note:unmount -->
<!-- /note -->

### <a id="s-search"></a>`search()`

prop · L60–62

- calls: [`fleetReport`](../../corp/fleet.js.md#s-fleetReport) _js/corp/fleet.js_
- via [js/corp/fleet.js](../../corp/fleet.js.md): `fleetReport.map`

<!-- note:search -->
<!-- /note -->
