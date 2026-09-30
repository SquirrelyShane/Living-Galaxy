# js/ui/dockboot.js

[index](../../../README.md) · 130 lines · 11 symbols · 4 imports · 1 importers

## About

<!-- note:@file -->
LIVING GALAXY — the berth, without flying the camera through the station.

Port control's tractor pulls a hull gate → door → clamps, and the canopy is
bolted to the hull, so the last leg used to put the lens through the
station's own walls on the way to the bay (and the push out did it again in
reverse). The station meshes are not built to be seen from inside.

So the canopy hands over to a transition at the door. On the way in, as the
hull reaches the aperture, the view dims into a boot sequence — the port's
systems coming up on your hull one line at a time (clamps, seal, umbilicals,
power, customs, deck) — while the tractor finishes the pull at five times
speed behind it; when the clamps close the sequence completes and fades onto
the station deck, whose panels boot in (css `.sd-boot`). On the way out the
sequence runs backwards and the canopy comes back once the hull is clear of
the door.

`localStorage["lgaa.dockcine"] = "off"` turns it off (the docking smoke
measures the tractor path in real time).
<!-- /note -->

## Imports

| line | from | names | target |
|---|---|---|---|
| 1 | `../sim/sim.js` | `sim` | [js/sim/sim.js](../sim/sim.js.md) |
| 2 | `../station/stationworks.js` | `tractor` | [js/station/stationworks.js](../station/stationworks.js.md) |
| 3 | `../station/stations.js` | `stationById` | [js/station/stations.js](../station/stations.js.md) |
| 4 | `../corp/corps.js` | `corpOfStation`, `standingLabel` | [js/corp/corps.js](../corp/corps.js.md) |

## Imported by

- [js/ui/hud.js](hud.js.md) — `mountDockBoot`

## Exports

- [`DOCK_CINE`](#s-DOCK_CINE) · const — **no importer in scanned roots**
- [`dockCine`](#s-dockCine) · const — **no importer in scanned roots**
- [`mountDockBoot`](#s-mountDockBoot) · function — used by [js/ui/hud.js](hud.js.md)

## Effects

- **dom.create** — `div` (mountDockBoot:39) · `li` (mountDockBoot>build:66)
- **dom.id** — `.db-lines` (mountDockBoot:45) · `station-deck` (mountDockBoot>bootDeck:50) · `.db-port` (mountDockBoot>build:70) · `.db-sub` (mountDockBoot>build:71) · `.db-bar i` (mountDockBoot:127) · `.db-foot` (mountDockBoot:128)
- **dom.query** — `‹sel›` (mountDockBoot>$:44) · `s` (mountDockBoot:124, mountDockBoot:125)
- **storage.get** — `lgaa.dockcine` (enabled:28)
- **timer** — `setTimeout` (mountDockBoot>bootDeck:54)

## Symbols

### <a id="s-DOC"></a>`DOC`

const · L6–6

<!-- note:DOC -->
<!-- /note -->

### <a id="s-DOCK_CINE"></a>`DOCK_CINE`

const · **exported** · L7–7

<!-- note:DOCK_CINE -->
<!-- /note -->

### <a id="s-IN_LINES"></a>`IN_LINES`

const · L9–16

<!-- note:IN_LINES -->
<!-- /note -->

### <a id="s-OUT_LINES"></a>`OUT_LINES`

const · L17–23

<!-- note:OUT_LINES -->
<!-- /note -->

### <a id="s-dockCine"></a>`dockCine`

const · **exported** · L25–25

<!-- note:dockCine -->
<!-- /note -->

### <a id="s-enabled"></a>`enabled()`

function · L27–29

- called by: [`mountDockBoot`](#s-mountDockBoot)
- effects: storage.get `lgaa.dockcine`

<!-- note:enabled -->
<!-- /note -->

### <a id="s-legMark"></a>`legMark()`

function · L31–35

- called by: [`mountDockBoot`](#s-mountDockBoot)

<!-- note:legMark -->
Seconds into the tractor path at which its last (pull) / first (push) leg starts / ends.
<!-- /note -->

### <a id="s-mountDockBoot"></a>`mountDockBoot()`

function · **exported** · L37–130

- calls: [`stationById`](../station/stations.js.md#s-stationById) _js/station/stations.js_ · [`enabled`](#s-enabled) · [`legMark`](#s-legMark) · [`mountDockBoot>$`](#s-mountDockBoot-S) ×3 · [`mountDockBoot>bootDeck`](#s-mountDockBoot-bootDeck) · [`mountDockBoot>build`](#s-mountDockBoot-build)
- called by: [`mountHud`](hud.js.md#s-mountHud) _js/ui/hud.js_
- effects: dom.create `div` · dom.id `.db-lines` · dom.query `s` · dom.id `.db-bar i` · dom.id `.db-foot`

<!-- note:mountDockBoot -->
- L84 · `mode = "in";` — clamps closed: finish the sequence, then let the deck through
<!-- /note -->

#### <a id="s-mountDockBoot-S"></a>`mountDockBoot>$(sel)`

function · L44–44

- called by: [`mountDockBoot`](#s-mountDockBoot) ×3 · [`mountDockBoot>build`](#s-mountDockBoot-build) ×2
- effects: dom.query `‹sel›`

<!-- note:mountDockBoot>$ -->
<!-- /note -->

#### <a id="s-mountDockBoot-bootDeck"></a>`mountDockBoot>bootDeck()`

function · L49–57

- called by: [`mountDockBoot`](#s-mountDockBoot)
- effects: dom.id `station-deck` · timer `setTimeout`

<!-- note:mountDockBoot>bootDeck -->
the deck's panels come up one at a time once it opens (css .sd-boot)
<!-- /note -->

#### <a id="s-mountDockBoot-build"></a>`mountDockBoot>build(mode, st)`

function · L59–72

- calls: [`corpOfStation`](../corp/corps.js.md#s-corpOfStation) _js/corp/corps.js_ · [`standingLabel`](../corp/corps.js.md#s-standingLabel) _js/corp/corps.js_ · [`mountDockBoot>$`](#s-mountDockBoot-S) ×2
- via [js/corp/corps.js](../corp/corps.js.md): `standingLabel.toUpperCase`
- called by: [`mountDockBoot`](#s-mountDockBoot)
- effects: dom.create `li` · dom.id `.db-port` · dom.id `.db-sub`

<!-- note:mountDockBoot>build -->
<!-- /note -->
