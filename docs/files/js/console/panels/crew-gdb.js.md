# js/console/panels/crew-gdb.js

[index](../../../../README.md) · 132 lines · 10 symbols · 6 imports · 1 importers

## About

<!-- note:@file -->
Living Galaxy — CONSOLE › CREW › GDB: the Galactic Database (0.3.54).

Everyone the galaxy has produced, on one page: the census at the top (how
many, how many peoples, how many still alive — and the number of names two
people share, which should read nought), a search over name, number,
people, trade and title, the filters a researcher would reach for, a card
per person with their record, and the CHRONICLE — every line the ledger's
histories hold, newest first. It reads js/corp/gdb.js and changes nothing.
<!-- /note -->

## Imports

| line | from | names | target |
|---|---|---|---|
| 1 | `../kit.js` | `el`, `section`, `note`, `row`, `button`, `chips`, `card` | [js/console/kit.js](../kit.js.md) |
| 2 | `../../sim/sim.js` | `sim` | [js/sim/sim.js](../../sim/sim.js.md) |
| 3 | `../../station/stations.js` | `stationById` | [js/station/stations.js](../../station/stations.js.md) |
| 4 | `../../npc/traffic.js` | `traffic` | [js/npc/traffic.js](../../npc/traffic.js.md) |
| 5 | `../../npc/cradle.js` | `describeNPC` | [js/npc/cradle.js](../../npc/cradle.js.md) |
| 6 | `../../corp/gdb.js` | `census`, `search`, `entryOf`, `chronicle`, `raceName` | [js/corp/gdb.js](../../corp/gdb.js.md) |

## Imported by

- [js/console/panels/crew.js](crew.js.md) — `mountGdb`

## Exports

- [`mountGdb`](#s-mountGdb) · function — used by [js/console/panels/crew.js](crew.js.md)
- `default` · Identifier — **no importer in scanned roots**

## Effects

- **event.listen** — `input on input → (inline)` (mountGdb:72)

## Symbols

### <a id="s-view"></a>`view`

const · L8–8

<!-- note:view -->
<!-- /note -->

### <a id="s-PAGE"></a>`PAGE`

const · L9–9

<!-- note:PAGE -->
<!-- /note -->

### <a id="s-FILTERS"></a>`FILTERS`

const · L11–19

<!-- note:FILTERS -->
<!-- /note -->

### <a id="s-KIND_WORD"></a>`KIND_WORD`

const · L21–21

<!-- note:KIND_WORD -->
<!-- /note -->

### <a id="s-placeName"></a>`placeName(id)`

function · L23–31

- calls: [`stationById`](../../station/stations.js.md#s-stationById) _js/station/stations.js_
- via [js/npc/traffic.js](../../npc/traffic.js.md): `traffic.find`
- called by: [`mountGdb>paint`](#s-mountGdb-paint) · [`personCard`](#s-personCard)

<!-- note:placeName -->
<!-- /note -->

### <a id="s-when"></a>`when(ms)`

function · L33–37

- called by: [`mountGdb>paint`](#s-mountGdb-paint) · [`personCard`](#s-personCard) ×3

<!-- note:when -->
<!-- /note -->

### <a id="s-personCard"></a>`personCard(id)`

function · L39–59

- calls: [`card`](../kit.js.md#s-card) _js/console/kit.js_ · [`el`](../kit.js.md#s-el) _js/console/kit.js_ ×3 · [`note`](../kit.js.md#s-note) _js/console/kit.js_ ×2 · [`row`](../kit.js.md#s-row) _js/console/kit.js_ ×3 · [`placeName`](#s-placeName) · [`when`](#s-when) ×3 · [`entryOf`](../../corp/gdb.js.md#s-entryOf) _js/corp/gdb.js_ · [`raceName`](../../corp/gdb.js.md#s-raceName) _js/corp/gdb.js_ · [`describeNPC`](../../npc/cradle.js.md#s-describeNPC) _js/npc/cradle.js_
- called by: [`mountGdb>paint`](#s-mountGdb-paint)

<!-- note:personCard -->
<!-- /note -->

### <a id="s-mountGdb"></a>`mountGdb(root, ctx)`

function · **exported** · L61–130

- calls: [`chips`](../kit.js.md#s-chips) _js/console/kit.js_ · [`el`](../kit.js.md#s-el) _js/console/kit.js_ ×2 · [`note`](../kit.js.md#s-note) _js/console/kit.js_ · [`section`](../kit.js.md#s-section) _js/console/kit.js_ ×3 · [`mountGdb>paint`](#s-mountGdb-paint) ×2
- called by: [`mount`](crew.js.md#s-mount) _js/console/panels/crew.js_
- effects: event.listen `input`

<!-- note:mountGdb -->
<!-- /note -->

#### <a id="s-mountGdb-onPick"></a>`mountGdb.onPick(id)`

prop · L74–74

- calls: [`mountGdb>paint`](#s-mountGdb-paint)

<!-- note:mountGdb.onPick -->
<!-- /note -->

#### <a id="s-mountGdb-paint"></a>`mountGdb>paint()`

function · L82–127

- calls: [`button`](../kit.js.md#s-button) _js/console/kit.js_ ×3 · [`el`](../kit.js.md#s-el) _js/console/kit.js_ ×5 · [`row`](../kit.js.md#s-row) _js/console/kit.js_ ×4 · [`mountGdb>paint`](#s-mountGdb-paint) ×3 · [`personCard`](#s-personCard) · [`placeName`](#s-placeName) · [`when`](#s-when) · [`census`](../../corp/gdb.js.md#s-census) _js/corp/gdb.js_ · [`chronicle`](../../corp/gdb.js.md#s-chronicle) _js/corp/gdb.js_ · [`raceName`](../../corp/gdb.js.md#s-raceName) _js/corp/gdb.js_ ×2 · [`search`](../../corp/gdb.js.md#s-search) _js/corp/gdb.js_
- called by: [`mountGdb`](#s-mountGdb) ×2 · [`mountGdb.onPick`](#s-mountGdb-onPick) · [`mountGdb>paint`](#s-mountGdb-paint) ×3

<!-- note:mountGdb>paint -->
- L83 · `const now = globalThis.performance?.now?.() ?? Date.now();` — the catalogue is hundreds of people: read it when asked, or every two seconds
<!-- /note -->
