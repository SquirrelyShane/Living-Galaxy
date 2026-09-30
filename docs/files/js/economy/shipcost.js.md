# js/economy/shipcost.js

[index](../../../README.md) · 130 lines · 18 symbols · 4 imports · 7 importers

## About

<!-- note:@file -->
LIVING GALAXY — shipwright's estimate.

Turns a registry def (shipdb.js) into an itemized bill the yard can build
from. The parts are the real ones: the catalogue manifest hullspec.js fits
for the hull (reactor plant, drive core, sensors, docks, every module the
grammar names, the turrets), each priced from its own bill of materials —
the generator's part → component → raw-material roll-up, with every raw
stock mapped onto a mineral the game's refineries actually sell.

So a Claim Warden costs what its drill booms, ore hopper, kilopower plant
and pulse core cost in titanium, aluminium, copper and uranium at book
value, plus the frame and the yard's labour — and the same bill tells you
what to mine if you would rather bring the stock yourself.

Exports keep their old shape: componentBill(def) → { lines, total } and
yardQuote(def, who) → the price this pilot pays.

- L120 · `export const ISSUE_RATE = 0.45;` — members pay 45% for hulls in their line, up to their rank
<!-- /note -->

## Imports

| line | from | names | target |
|---|---|---|---|
| 1 | `../ships/hullspec.js` | `hullSpec`, `manifestTotals` | [js/ships/hullspec.js](../ships/hullspec.js.md) |
| 2 | `../shipgen/data/bom.js` | `partBom`, `expandBom` | [js/shipgen/data/bom.js](../shipgen/data/bom.js.md) |
| 3 | `../shipgen/data/catalog/index.js` | `PARTS` | [js/shipgen/data/catalog/index.js](../shipgen/data/catalog/index.js.md) |
| 4 | `./materials.js` | `MINERALS` | [js/economy/materials.js](materials.js.md) |

## Imported by

- [js/corp/fleet.js](../corp/fleet.js.md) — `yardQuote`
- [js/sim/sim.js](../sim/sim.js.md) — `yardQuote`
- [js/station/stationdeck.js](../station/stationdeck.js.md) — `componentBill`, `stockLines`, `yardQuote`
- test/balance.test.mjs _(outside js/)_ — `yardQuote`
- test/hullspec.test.mjs _(outside js/)_ — `componentBill`, `yardQuote`, `stockLines`, `partPrice`, `STOCK_MAP`
- test/insurance.test.mjs _(outside js/)_ — `yardQuote`, `ISSUE_RATE`
- test/portdrones.test.mjs _(outside js/)_ — `yardQuote`, `TIER_SCALE`

## Exports

- [`STOCK_MAP`](#s-STOCK_MAP) · const — used by test/hullspec.test.mjs
- [`partPrice`](#s-partPrice) · function — used by test/hullspec.test.mjs
- [`SECTION_LABEL`](#s-SECTION_LABEL) · const — **no importer in scanned roots**
- [`componentBill`](#s-componentBill) · function — used by [js/station/stationdeck.js](../station/stationdeck.js.md), test/hullspec.test.mjs
- [`stockLines`](#s-stockLines) · function — used by [js/station/stationdeck.js](../station/stationdeck.js.md), test/hullspec.test.mjs
- [`TIER_SCALE`](#s-TIER_SCALE) · const — used by test/portdrones.test.mjs
- [`ISSUE_RATE`](#s-ISSUE_RATE) · const — used by test/insurance.test.mjs
- [`yardQuote`](#s-yardQuote) · function — used by [js/corp/fleet.js](../corp/fleet.js.md), [js/sim/sim.js](../sim/sim.js.md), [js/station/stationdeck.js](../station/stationdeck.js.md), test/balance.test.mjs, test/hullspec.test.mjs, test/insurance.test.mjs, test/portdrones.test.mjs

## Effects

_none detected_

## Symbols

### <a id="s-STOCK_MAP"></a>`STOCK_MAP`

const · **exported** · L6–23

<!-- note:STOCK_MAP -->
---- raw stock bridge ---------------------------------------------------

Generator raw material → game mineral. Anything unlisted falls to steel.
<!-- /note -->

### <a id="s-MINERAL"></a>`MINERAL`

const · L25–25

- via [js/economy/materials.js](materials.js.md): `MINERALS.map`

<!-- note:MINERAL -->
<!-- /note -->

### <a id="s-perTonne"></a>`perTonne(id)`

function · L26–26

- called by: [`partPrice`](#s-partPrice) · [`stockLines`](#s-stockLines)

<!-- note:perTonne -->
credits per tonne of a mineral at book value (units are `mass` tonnes each)
<!-- /note -->

### <a id="s-FAB"></a>`FAB`

const · L28–28

<!-- note:FAB -->
Working stock over raw: machining, testing, certification. Electronics and
nuclear parts carry more of it than a tank does. Tuned so the registry
prices out in the bands the economy was balanced against.
<!-- /note -->

### <a id="s-DOMAIN_FAB"></a>`DOMAIN_FAB`

const · L29–29

<!-- note:DOMAIN_FAB -->
<!-- /note -->

### <a id="s-PRICE_K"></a>`PRICE_K`

const · L30–30

<!-- note:PRICE_K -->
<!-- /note -->

### <a id="s-FIT"></a>`FIT`

const · L31–31

<!-- note:FIT -->
Yard fit factor by tier. Small frames take catalogue parts at a discount
(entry hulls are fitted from the shelf); a colossus has every part sized
up to the hull. Tuned so each tier prices out where the economy — wages,
issue rates, starting scrip — was balanced.
<!-- /note -->

### <a id="s-fitScale"></a>`fitScale(def)`

function · L32–32

- called by: [`componentBill`](#s-componentBill)

<!-- note:fitScale -->
<!-- /note -->

### <a id="s-PART_PRICE"></a>`PART_PRICE`

const · L34–34

<!-- note:PART_PRICE -->
<!-- /note -->

### <a id="s-partPrice"></a>`partPrice(part)`

function · **exported** · L35–54

- calls: [`perTonne`](#s-perTonne) · [`expandBom`](../shipgen/data/bom.js.md#s-expandBom) _js/shipgen/data/bom.js_ · [`partBom`](../shipgen/data/bom.js.md#s-partBom) _js/shipgen/data/bom.js_
- called by: [`componentBill`](#s-componentBill)

<!-- note:partPrice -->
Price of one catalogue part, and the raw stock (tonnes by mineral) behind it.

- L49 · `const power = Math.abs(part.pwr ?? 0) * 0.9;` — kW of switchgear, coolant and control
<!-- /note -->

### <a id="s-frameLine"></a>`frameLine(def)`

function · L56–66

- called by: [`componentBill`](#s-componentBill)

<!-- note:frameLine -->
Hull frame: keel, skin, frames, decks — priced on the registry's dry mass
and length, as before, and given a stock split so the raw bill is whole.

- L60 · `const t = s.massT * 0.55;` — structure share of dry mass; the fittings carry the rest
<!-- /note -->

### <a id="s-SECTION_LABEL"></a>`SECTION_LABEL`

const · **exported** · L68–73

<!-- note:SECTION_LABEL -->
<!-- /note -->

### <a id="s-BILLS"></a>`BILLS`

const · L75–75

<!-- note:BILLS -->
<!-- /note -->

### <a id="s-componentBill"></a>`componentBill(def)`

function · **exported** · L77–109

- calls: [`fitScale`](#s-fitScale) · [`frameLine`](#s-frameLine) · [`partPrice`](#s-partPrice) · [`hullSpec`](../ships/hullspec.js.md#s-hullSpec) _js/ships/hullspec.js_ · [`manifestTotals`](../ships/hullspec.js.md#s-manifestTotals) _js/ships/hullspec.js_
- called by: [`stockLines`](#s-stockLines) · [`yardQuote`](#s-yardQuote) · [`PANELS.shipyard>render`](../station/stationdeck.js.md#s-PANELS-shipyard-render) _js/station/stationdeck.js_

<!-- note:componentBill -->
The itemized bill. `lines` is one row per catalogue section (plus the
frame and the yard's labour) with `parts: [{ id, name, count, each }]`
behind it, so a panel can show the summary or unfold the whole manifest.
`stock` is the raw mineral bill in tonnes; `partCount` the fitted total.
<!-- /note -->

### <a id="s-stockLines"></a>`stockLines(def)`

function · **exported** · L111–117

- calls: [`componentBill`](#s-componentBill) · [`perTonne`](#s-perTonne)
- called by: [`PANELS.shipyard>render`](../station/stationdeck.js.md#s-PANELS-shipyard-render) _js/station/stationdeck.js_

<!-- note:stockLines -->
The raw stock bill as rows the deck can print, heaviest first.
<!-- /note -->

### <a id="s-TIER_SCALE"></a>`TIER_SCALE`

const · **exported** · L119–119

<!-- note:TIER_SCALE -->
Entry hulls were priced like flagships. Two corrections a real yard makes:
small frames are cheap to lay down (A/B tiers take a scale discount), and a
complex sells its own line to its own members at the issue rate.

0.3.59 — and then the ladder was too short. A mining career on the starter
made a D-tier hull in under an hour and a flagship in an afternoon, while
0.3.52's holds made every size up worth more to own. Ships are the long game
now: the starter tier costs half again what it did, and each tier above it
climbs faster than the one below — a D is an evening's saving, an F a
company's, and a G is what corporations are for. (Tier: 0.3.58 → 0.3.59
multiplier on the part bill: A 0.55 → 0.8, B 0.7 → 1.6, C 0.85 → 2.6,
D 1 → 4.5, E 1 → 6.5, F 1 → 9, G 1 → 14.)
<!-- /note -->

### <a id="s-ISSUE_RATE"></a>`ISSUE_RATE`

const · **exported** · L120–120

<!-- note:ISSUE_RATE -->
<!-- /note -->

### <a id="s-yardQuote"></a>`yardQuote(def, who=)`

function · **exported** · L122–130

- calls: [`componentBill`](#s-componentBill)
- called by: [`yardPrice`](../corp/fleet.js.md#s-yardPrice) _js/corp/fleet.js_ · [`loseHull`](../sim/sim.js.md#s-loseHull) _js/sim/sim.js_ · [`PANELS.shipyard>render`](../station/stationdeck.js.md#s-PANELS-shipyard-render) _js/station/stationdeck.js_ ×3 · [`PANELS.shipyard>render.onBuy`](../station/stationdeck.js.md#s-PANELS-shipyard-render-onBuy) _js/station/stationdeck.js_

<!-- note:yardQuote -->
What the yard actually charges this pilot.
@param def    registry def
@param who    { complexId, letter } — the buyer's complex and rank letter
<!-- /note -->
