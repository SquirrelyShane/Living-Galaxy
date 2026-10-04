# js/economy/contracts.js

[index](../../../README.md) · 791 lines · 95 symbols · 20 imports · 27 importers

## About

<!-- note:@file -->
LIVING GALAXY — the contract board.

Ported in design from Living Galaxy's systems/trade/contracts.js: a
generated market of offers that expire whether or not you look at them,
posted by ports on behalf of their corporation, gated on what that
corporation thinks of you. The rule that shapes everything: **refusing is
free, abandoning is not.** Accepting is a promise with a deadline and a
standing penalty attached.

What a desk posts is a fact about who runs it — the power's charter
(data/factions.js) decides the families:

  economic   supply (bring what the port is short of), haul (this port's
             stock to another)
  industrial mine (ore to the works), supply
  military   bounty (a pirate on the board), escort (ride with a boat)
  civic      supply, haul
  syndicate  salvage (debris to the yard), haul

0.3.18 — the desk is a department store, not a noticeboard. A port posts
two dozen jobs across nine departments (CATEGORIES below), one per career
family at least, and it posts them for the corporations that WORK there —
the port's own charter holder plus two or three tenant outfits with offices
on the ring — so the desk is the port's whole payroll, not five cards. What
a port needs is its sector's business (an industrial yard wants ore and
girders, a civilian habitat wants medkits and rations), and every job is
sized for the hull you are flying: cargo work to your hold, combat work
marked for an armed hull. The views (js/ui/boardview.js) nest it: department →
issuer → offer.

Tiers — Standard / Bonded / Sealed — pay more and ask for standing with the
issuing corp. Finishing a job moves standing with the issuer, and through
corpRelation() with its allies and enemies, so the corp war is felt at the
desk without the desk knowing who hates whom.
<!-- /note -->

## Imports

| line | from | names | target |
|---|---|---|---|
| 1 | `../sim/salvage.js` | `recoverSite` | [js/sim/salvage.js](../sim/salvage.js.md) |
| 2 | `../world/hulks.js` | `HULK`, `hulkById`, `hullForPlate`, `plateOf`, `spawnHulk` | [js/world/hulks.js](../world/hulks.js.md) |
| 3 | `../sim/sim.js` | `logEvent`, `sim`, `sellPriceAt`, `currentShipId`, `addWaypointAt`, `addAnchoredWaypoint`, `removeWaypoint` | [js/sim/sim.js](../sim/sim.js.md) |
| 4 | `../station/stations.js` | `stations`, `stationById` | [js/station/stations.js](../station/stations.js.md) |
| 5 | `../corp/corps.js` | `corpOfStation`, `corpRelation`, `corps`, `adjustStanding`, `standingLabel` | [js/corp/corps.js](../corp/corps.js.md) |
| 6 | `../data/factions.js` | `POWERS` | [js/data/factions.js](../data/factions.js.md) |
| 7 | `./economy.js` | `shortagesOf`, `wantsOf`, `bidPrice`, `askPrice`, `stockOf`, `deliver`, `lift` | [js/economy/economy.js](economy.js.md) |
| 8 | `./materials.js` | `goodName`, `baseValue`, `good`, `bulkOf`, `ORES`, `SECTORS` | [js/economy/materials.js](materials.js.md) |
| 9 | `../npc/traffic.js` | `traffic`, `HOSTILE_ROLES` | [js/npc/traffic.js](../npc/traffic.js.md) |
| 10 | `../npc/flow.js` | `flow` | [js/npc/flow.js](../npc/flow.js.md) |
| 11 | `../npc/rogues.js` | `nests` | [js/npc/rogues.js](../npc/rogues.js.md) |
| 12 | `../world/generate.js` | `rngFromSeed` | [js/world/generate.js](../world/generate.js.md) |
| 13 | `../flight/ship.js` | `takeCargo`, `addCargo`, `roomFor` | [js/flight/ship.js](../flight/ship.js.md) |
| 14 | `../ships/shipdb.js` | `shipById` | [js/ships/shipdb.js](../ships/shipdb.js.md) |
| 15 | `../corp/company.js` | `bookRevenue` | [js/corp/company.js](../corp/company.js.md) |
| 16 | `../flight/pilot.js` | `work`, `pilot` | [js/flight/pilot.js](../flight/pilot.js.md) |
| 17 | `../world/bodies.js` | `BODIES`, `BEACONS`, `bodyPosition`, `beaconPosition`, `currentSystem`, `scanRadius` | [js/world/bodies.js](../world/bodies.js.md) |
| 18 | `./sites.js` | `pickSpot`, `spotLine`, `openSite`, `closeSite`, `siteById` | [js/economy/sites.js](sites.js.md) |
| 19 | `./chains.js` | `chainOffersAt`, `chainVersion`, `noteChainAccept`, `noteChainDone`, `noteChainFail`, `resetChains`, `chainReport`, `wireChains`, `CHAIN`, `chainBonus` | [js/economy/chains.js](chains.js.md) |
| 20 | `../station/dockwork.js` | `bookHandling` | [js/station/dockwork.js](../station/dockwork.js.md) |

## Imported by

- [js/aria/company.js](../aria/company.js.md) — `CATEGORIES`
- [js/aria/play.js](../aria/play.js.md) — `boardFor`, `acceptContract`, `acceptBlocker`, `abandonContract`, `deliverContracts`, `deliverableAt`, `contracts`, `CATEGORIES`, `CATEGORY_ORDER`, `categoryOf`, `hullFit`, `jobStatus`, `targetPos`, `timeLeft`, `BOARD`
- [js/aria/senses.js](../aria/senses.js.md) — `boardByCategory`
- [js/console/panels/corp.js](../console/panels/corp.js.md) — `boardFor`, `contracts`, `timeLeft`, `BOARD`
- [js/economy/traderoutes.js](traderoutes.js.md) — `contracts`
- [js/flight/autopilot.js](../flight/autopilot.js.md) — `jobForSite`
- [js/mission/salvage.js](../mission/salvage.js.md) — `contracts`
- [js/mission/tradeops.js](../mission/tradeops.js.md) — `deliverContracts`, `deliverableAt`, `jobForSite`
- [js/sim/sim.js](../sim/sim.js.md) — `noteKill`, `noteDestroyed`, `noteSalvaged`, `resetContracts`, `tickContracts`, `owedCargo`
- [js/station/stationdeck.js](../station/stationdeck.js.md) — `contracts`, `BOARD`
- [js/ui/boardview.js](../ui/boardview.js.md) — `acceptBlocker`, `acceptContract`, `boardByCategory`, `hullFit`, `CATEGORIES`, `jobStatus`, `markTarget`, `timeLeft`, `abandonContract`, `deliverContracts`, `deliverableAt`, `contracts`, `BOARD`
- [js/ui/holdview.js](../ui/holdview.js.md) — `contracts`
- [js/ui/hud.js](../ui/hud.js.md) — `wireContracts`
- test/ariaplay.test.mjs _(outside js/)_ — `contracts`, `boardFor`, `resetContracts`, `CATEGORY_ORDER`, `CATEGORIES`, `acceptContract`
- test/ariasense.test.mjs _(outside js/)_ — `boardFor`, `resetContracts`
- test/balance.test.mjs _(outside js/)_ — `boardFor`, `BOARD`, `TIERS`
- test/board.test.mjs _(outside js/)_ — `boardFor`, `acceptBlocker`, `acceptContract`, `abandonContract`, `deliverableAt`, `deliverContracts`, `contracts`, `tickContracts`, `BOARD`, `issuersAt`
- test/chains.test.mjs _(outside js/)_ — `boardFor`, `acceptContract`, `abandonContract`, `deliverContracts`, `contracts`, `resetContracts`, `CATEGORIES`, `CATEGORY_ORDER`, `BOARD`, `acceptBlocker`
- test/desk.test.mjs _(outside js/)_ — `boardFor`, `boardByCategory`, `acceptBlocker`, `acceptContract`, `abandonContract`, `deliverableAt`, `deliverContracts`, `tickContracts`, `noteDestroyed`, `targetPos`, `contracts`, `CATEGORIES`, `CATEGORY_ORDER`, `issuersAt`, `hullFit`, `BOARD`, `jobStatus`, `resetContracts`
- test/dockwork.test.mjs _(outside js/)_ — `boardFor`, `acceptContract`, `deliverContracts`, `contracts`, `resetContracts`
- test/hold.test.mjs _(outside js/)_ — `contracts`, `resetContracts`
- test/jobloop.test.mjs _(outside js/)_ — `boardFor`, `acceptContract`, `contracts`, `resetContracts`, `BOARD`, `owedCargo`, `jobForSite`
- test/marks.test.mjs _(outside js/)_ — `boardFor`, `acceptContract`, `abandonContract`, `contracts`, `resetContracts`, `BOARD`, `markTarget`
- test/salvage.test.mjs _(outside js/)_ — `contracts`, `tickContracts`, `deliverableAt`, `deliverContracts`, `boardFor`
- test/sites.test.mjs _(outside js/)_ — `boardFor`, `acceptContract`, `abandonContract`, `deliverContracts`, `contracts`, `resetContracts`, `BOARD`, `jobStatus`
- test/trade.test.mjs _(outside js/)_ — `contracts`
- test/undock.test.mjs _(outside js/)_ — `boardFor`, `acceptContract`, `contracts`, `resetContracts`, `BOARD`

## Exports

- [`TIERS`](#s-TIERS) · const — used by test/balance.test.mjs
- [`CATEGORIES`](#s-CATEGORIES) · const — used by [js/aria/company.js](../aria/company.js.md), [js/aria/play.js](../aria/play.js.md), [js/ui/boardview.js](../ui/boardview.js.md), test/ariaplay.test.mjs, test/chains.test.mjs, test/desk.test.mjs
- [`CATEGORY_ORDER`](#s-CATEGORY_ORDER) · const — used by [js/aria/play.js](../aria/play.js.md), test/ariaplay.test.mjs, test/chains.test.mjs, test/desk.test.mjs
- [`categoryOf`](#s-categoryOf) · function — used by [js/aria/play.js](../aria/play.js.md)
- [`BOARD`](#s-BOARD) · const — used by [js/aria/play.js](../aria/play.js.md), [js/console/panels/corp.js](../console/panels/corp.js.md), [js/station/stationdeck.js](../station/stationdeck.js.md), [js/ui/boardview.js](../ui/boardview.js.md), test/balance.test.mjs, test/board.test.mjs, test/chains.test.mjs, test/desk.test.mjs, test/jobloop.test.mjs, test/marks.test.mjs, test/sites.test.mjs, test/undock.test.mjs
- [`SALVAGE_PAY`](#s-SALVAGE_PAY) · const — **no importer in scanned roots**
- [`WRECK`](#s-WRECK) · const — **no importer in scanned roots**
- [`contracts`](#s-contracts) · const — used by [js/aria/play.js](../aria/play.js.md), [js/console/panels/corp.js](../console/panels/corp.js.md), [js/economy/traderoutes.js](traderoutes.js.md), [js/mission/salvage.js](../mission/salvage.js.md), [js/station/stationdeck.js](../station/stationdeck.js.md), [js/ui/boardview.js](../ui/boardview.js.md), [js/ui/holdview.js](../ui/holdview.js.md), test/ariaplay.test.mjs, test/board.test.mjs, test/chains.test.mjs, test/desk.test.mjs, test/dockwork.test.mjs, test/hold.test.mjs, test/jobloop.test.mjs, test/marks.test.mjs, test/salvage.test.mjs, test/sites.test.mjs, test/trade.test.mjs, test/undock.test.mjs
- [`hullFit`](#s-hullFit) · function — used by [js/aria/play.js](../aria/play.js.md), [js/ui/boardview.js](../ui/boardview.js.md), test/desk.test.mjs
- [`issuersAt`](#s-issuersAt) · function — used by test/board.test.mjs, test/desk.test.mjs
- [`targetPos`](#s-targetPos) · function — used by [js/aria/play.js](../aria/play.js.md), test/desk.test.mjs
- [`markTarget`](#s-markTarget) · function — used by [js/ui/boardview.js](../ui/boardview.js.md), test/marks.test.mjs
- [`anchorFor`](#s-anchorFor) · function — **no importer in scanned roots**
- [`boardFor`](#s-boardFor) · function — used by [js/aria/play.js](../aria/play.js.md), [js/console/panels/corp.js](../console/panels/corp.js.md), test/ariaplay.test.mjs, test/ariasense.test.mjs, test/balance.test.mjs, test/board.test.mjs, test/chains.test.mjs, test/desk.test.mjs, test/dockwork.test.mjs, test/jobloop.test.mjs, test/marks.test.mjs, test/salvage.test.mjs, test/sites.test.mjs, test/undock.test.mjs
- [`boardByCategory`](#s-boardByCategory) · function — used by [js/aria/senses.js](../aria/senses.js.md), [js/ui/boardview.js](../ui/boardview.js.md), test/desk.test.mjs
- [`acceptBlocker`](#s-acceptBlocker) · function — used by [js/aria/play.js](../aria/play.js.md), [js/ui/boardview.js](../ui/boardview.js.md), test/board.test.mjs, test/chains.test.mjs, test/desk.test.mjs
- [`acceptContract`](#s-acceptContract) · function — used by [js/aria/play.js](../aria/play.js.md), [js/ui/boardview.js](../ui/boardview.js.md), test/ariaplay.test.mjs, test/board.test.mjs, test/chains.test.mjs, test/desk.test.mjs, test/dockwork.test.mjs, test/jobloop.test.mjs, test/marks.test.mjs, test/sites.test.mjs, test/undock.test.mjs
- [`abandonContract`](#s-abandonContract) · function — used by [js/aria/play.js](../aria/play.js.md), [js/ui/boardview.js](../ui/boardview.js.md), test/board.test.mjs, test/chains.test.mjs, test/desk.test.mjs, test/marks.test.mjs, test/sites.test.mjs
- [`noteSalvaged`](#s-noteSalvaged) · function — used by [js/sim/sim.js](../sim/sim.js.md)
- [`deliverableAt`](#s-deliverableAt) · function — used by [js/aria/play.js](../aria/play.js.md), [js/mission/tradeops.js](../mission/tradeops.js.md), [js/ui/boardview.js](../ui/boardview.js.md), test/board.test.mjs, test/desk.test.mjs, test/salvage.test.mjs
- [`owedCargo`](#s-owedCargo) · function — used by [js/sim/sim.js](../sim/sim.js.md), test/jobloop.test.mjs
- [`jobForSite`](#s-jobForSite) · function — used by [js/flight/autopilot.js](../flight/autopilot.js.md), [js/mission/tradeops.js](../mission/tradeops.js.md), test/jobloop.test.mjs
- [`deliverContracts`](#s-deliverContracts) · function — used by [js/aria/play.js](../aria/play.js.md), [js/mission/tradeops.js](../mission/tradeops.js.md), [js/ui/boardview.js](../ui/boardview.js.md), test/board.test.mjs, test/chains.test.mjs, test/desk.test.mjs, test/dockwork.test.mjs, test/salvage.test.mjs, test/sites.test.mjs
- [`noteKill`](#s-noteKill) · function — used by [js/sim/sim.js](../sim/sim.js.md)
- [`noteDestroyed`](#s-noteDestroyed) · function — used by [js/sim/sim.js](../sim/sim.js.md), test/desk.test.mjs
- [`visitRadius`](#s-visitRadius) · function — **no importer in scanned roots**
- [`tickContracts`](#s-tickContracts) · function — used by [js/sim/sim.js](../sim/sim.js.md), test/board.test.mjs, test/desk.test.mjs, test/salvage.test.mjs
- [`timeLeft`](#s-timeLeft) · function — used by [js/aria/play.js](../aria/play.js.md), [js/console/panels/corp.js](../console/panels/corp.js.md), [js/ui/boardview.js](../ui/boardview.js.md)
- [`jobStatus`](#s-jobStatus) · function — used by [js/aria/play.js](../aria/play.js.md), [js/ui/boardview.js](../ui/boardview.js.md), test/desk.test.mjs, test/sites.test.mjs
- [`resetContracts`](#s-resetContracts) · function — used by [js/sim/sim.js](../sim/sim.js.md), test/ariaplay.test.mjs, test/ariasense.test.mjs, test/chains.test.mjs, test/desk.test.mjs, test/dockwork.test.mjs, test/hold.test.mjs, test/jobloop.test.mjs, test/marks.test.mjs, test/sites.test.mjs, test/undock.test.mjs
- [`wireContracts`](#s-wireContracts) · function — used by [js/ui/hud.js](../ui/hud.js.md)

## Effects

_none detected_

## Symbols

### <a id="s-TIERS"></a>`TIERS`

const · **exported** · L22–26

<!-- note:TIERS -->
- L23 · `{ key: "low",  name: "Standard", weight: 58, pay: 1.0,  standing: -10 },` — 0.3.47: 1.55/2.4 → 1.35/1.8. A sealed job is worth having, not a jackpot
<!-- /note -->

### <a id="s-CATEGORIES"></a>`CATEGORIES`

const · **exported** · L28–38

<!-- note:CATEGORIES -->
The departments, and the careers each one pays: every complex in
careers/complexes.js has a department, so there is work on the desk for
whichever career you chose. `skill` is what finishing a job trains.
<!-- /note -->

### <a id="s-CATEGORY_ORDER"></a>`CATEGORY_ORDER`

const · **exported** · L39–39

<!-- note:CATEGORY_ORDER -->
<!-- /note -->

### <a id="s-KIND_CAT"></a>`KIND_CAT`

const · L40–40

<!-- note:KIND_CAT -->
<!-- /note -->

### <a id="s-categoryOf"></a>`categoryOf(type)`

function · **exported** · L41–41

- called by: [`jobsFor`](../aria/play.js.md#s-jobsFor) _js/aria/play.js_ · [`movesNow`](../aria/play.js.md#s-movesNow) _js/aria/play.js_ · [`settle`](#s-settle)

<!-- note:categoryOf -->
<!-- /note -->

### <a id="s-SECTOR_WEIGHT"></a>`SECTOR_WEIGHT`

const · L43–50

<!-- note:SECTOR_WEIGHT -->
what a port of each sector mostly needs done (weights per department)
<!-- /note -->

### <a id="s-CHARTER_LEAN"></a>`CHARTER_LEAN`

const · L51–57

<!-- note:CHARTER_LEAN -->
and what an issuer's charter pushes it toward
<!-- /note -->

### <a id="s-BOARD"></a>`BOARD`

const · **exported** · L59–69

<!-- note:BOARD -->
- L60 · `refresh: 480,` — s between re-postings at a port
- L61 · `offers: 30,` — per port (0.3.18: was 5)
- L62 · `expires: 900,` — s an offer stands
- L63 · `deadline: 1500,` — s from acceptance
- L66 · `maxActive: 5,` — 0.3.18: was 3 — a working pilot runs a few jobs at once
- L67 · `visitR: 1500,` — u: close enough to a waypoint to count as there (15 km)
- L68 · `pay: 1.0,` — 0.3.24 — what the desk pays, against the market.
  
  Lot pricing and the narrower stock band took ~46% out of route profit,
  which was the point; but they took contract-funded careers down with it,
  because a delivery's pay is built on the port's bid and the bid moved too.
  The bench said so plainly: the best route fell from 4,670 to 2,523 cr/min
  and the median career fell from 603 to 465, so the RATIO barely improved.
  
  This is the other half. One named constant on the posted pay of every job,
  so contract work is worth doing on its own rather than being the thing you
  do between trade runs. It is the number to reach for when a career feels
  thin — it moves every department at once, which is what you want for
  parity and not what you want for flavour.
  
  0.3.47 — 1.7 → 1.0. A "cut 305 iron ore" job at 1.7 paid about 2.3× what
  the same ore fetched at the counter, a five-stage chain opened at 4,000 cr
  for a pilot whose whole hull was worth 6,500, and a start purse became a
  fleet in an evening. The desk now pays what its own text says — the goods
  at the bid plus a premium, or a flat fee for flying somewhere — and it is
  the price of the part, not the multiplier, that makes deep work worth it
  (materials.js VALUE_RULE).
<!-- /note -->

### <a id="s-SALVAGE_PAY"></a>`SALVAGE_PAY`

const · **exported** · L71–71

<!-- note:SALVAGE_PAY -->
0.3.90: salvage work pays for hull steel, not debris iron, so what it pays
has to clear what the same steel fetches on a market shelf. `plate` and
`wreck` are multiples of the plate's base value; the wreck also leaves the
salvor the parts, the hold and the recorder.
<!-- /note -->

### <a id="s-WRECK"></a>`WRECK`

const · **exported** · L72–72

<!-- note:WRECK -->
<!-- /note -->

### <a id="s-_host"></a>`_host`

const · L73–73

<!-- note:_host -->
<!-- /note -->

### <a id="s-contracts"></a>`contracts`

const · **exported** · L75–75

<!-- note:contracts -->
<!-- /note -->

### <a id="s-pickTier"></a>`pickTier(rnd)`

function · L77–82

- called by: [`makeOffer`](#s-makeOffer)

<!-- note:pickTier -->
<!-- /note -->

### <a id="s-pickOf"></a>`pickOf(rnd, arr)`

function · L83–83

- called by: [`KINDS.assay`](#s-KINDS-assay) · [`KINDS.bounty`](#s-KINDS-bounty) · [`KINDS.build`](#s-KINDS-build) ×2 · [`KINDS.chart`](#s-KINDS-chart) · [`KINDS.courier`](#s-KINDS-courier) ×2 · [`KINDS.escort`](#s-KINDS-escort) · [`KINDS.fieldtrip`](#s-KINDS-fieldtrip) · [`KINDS.food`](#s-KINDS-food) · [`KINDS.fuel`](#s-KINDS-fuel) · [`KINDS.haul`](#s-KINDS-haul) ×2 · [`KINDS.ice`](#s-KINDS-ice) · [`KINDS.materials`](#s-KINDS-materials) · [`KINDS.medical`](#s-KINDS-medical) · [`KINDS.mine`](#s-KINDS-mine) · [`KINDS.parts`](#s-KINDS-parts) · [`KINDS.pod`](#s-KINDS-pod) · [`KINDS.procure`](#s-KINDS-procure) · [`KINDS.reactor`](#s-KINDS-reactor) · [`KINDS.relay`](#s-KINDS-relay) · [`KINDS.resupply`](#s-KINDS-resupply) ×2 · [`KINDS.rogues`](#s-KINDS-rogues) · [`KINDS.supply`](#s-KINDS-supply) · [`KINDS.survey`](#s-KINDS-survey) · [`KINDS.tender`](#s-KINDS-tender) · [`KINDS.vein`](#s-KINDS-vein)

<!-- note:pickOf -->
<!-- /note -->

### <a id="s-weighted"></a>`weighted(rnd, table)`

function · L84–89

- called by: [`boardFor`](#s-boardFor)

<!-- note:weighted -->
<!-- /note -->

### <a id="s-pilotCareer"></a>`pilotCareer()`

function · L91–91

- called by: [`boardFor`](#s-boardFor) ×2

<!-- note:pilotCareer -->
<!-- /note -->

### <a id="s-hullFit"></a>`hullFit()`

function · **exported** · L93–99

- calls: [`shipById`](../ships/shipdb.js.md#s-shipById) _js/ships/shipdb.js_ · [`currentShipId`](../sim/sim.js.md#s-currentShipId) _js/sim/sim.js_
- called by: [`canFly`](../aria/play.js.md#s-canFly) _js/aria/play.js_ · [`heldFlyable`](../aria/play.js.md#s-heldFlyable) _js/aria/play.js_ · [`acceptBlocker`](#s-acceptBlocker) · [`boardFor`](#s-boardFor) · [`renderDesk`](../ui/boardview.js.md#s-renderDesk) _js/ui/boardview.js_

<!-- note:hullFit -->
---- the hull you are flying ------------------------------------------------

What the current hull can take on: its hold, whether it carries guns.

- L98 · `return { cap, capFor: (id) => (id ? Math.max(1, Math.floor(cap / bulkOf(id))) : cap), arme` — 0.3.52: `cap` is hold units; how many of a GIVEN good fit is capFor(id)
<!-- /note -->

#### <a id="s-hullFit-capFor"></a>`hullFit.capFor(id)`

prop · L98–98

- calls: [`bulkOf`](materials.js.md#s-bulkOf) _js/economy/materials.js_

<!-- note:hullFit.capFor -->
<!-- /note -->

### <a id="s-sized"></a>`sized(fit, frac, lo=, id=)`

function · L100–100

- called by: [`KINDS.build`](#s-KINDS-build) · [`KINDS.salvage`](#s-KINDS-salvage) · [`KINDS.wreck`](#s-KINDS-wreck) · [`qtyFor`](#s-qtyFor)

<!-- note:sized -->
cargo work sized to the hold: `frac` of it, at least `lo` units
<!-- /note -->

### <a id="s-qtyFor"></a>`qtyFor(fit, frac, lo, id, t)`

function · L101–106

- calls: [`sized`](#s-sized) · [`baseValue`](materials.js.md#s-baseValue) _js/economy/materials.js_
- called by: [`KINDS.consign`](#s-KINDS-consign) · [`KINDS.food`](#s-KINDS-food) · [`KINDS.fuel`](#s-KINDS-fuel) · [`KINDS.haul`](#s-KINDS-haul) · [`KINDS.ice`](#s-KINDS-ice) · [`KINDS.materials`](#s-KINDS-materials) · [`KINDS.medical`](#s-KINDS-medical) · [`KINDS.mine`](#s-KINDS-mine) · [`KINDS.parts`](#s-KINDS-parts) · [`KINDS.pod`](#s-KINDS-pod) · [`KINDS.procure`](#s-KINDS-procure) · [`KINDS.reactor`](#s-KINDS-reactor) · [`KINDS.resupply`](#s-KINDS-resupply) · [`KINDS.supply`](#s-KINDS-supply) · [`KINDS.tender`](#s-KINDS-tender) · [`KINDS.vein`](#s-KINDS-vein)

<!-- note:qtyFor -->
…and to a purse: nobody posts a job that means buying two hundred thousand
credits of armour plate first. The budget grows with the tier and (gently)
with the hold, so a big hull sees bigger jobs without a skiff seeing none.
<!-- /note -->

### <a id="s-charterOf"></a>`charterOf(co)`

function · L108–108

- called by: [`boardFor`](#s-boardFor)

<!-- note:charterOf -->
---- who posts at a port ----------------------------------------------------
<!-- /note -->

### <a id="s-issuersAt"></a>`issuersAt(st)`

function · **exported** · L110–118

- calls: [`corpOfStation`](../corp/corps.js.md#s-corpOfStation) _js/corp/corps.js_ · [`corpRelation`](../corp/corps.js.md#s-corpRelation) _js/corp/corps.js_ · [`rngFromSeed`](../world/generate.js.md#s-rngFromSeed) _js/world/generate.js_
- via [js/corp/corps.js](../corp/corps.js.md): `corps.filter`
- called by: [`boardFor`](#s-boardFor)

<!-- note:issuersAt -->
The port's own charter holder, plus the tenant outfits with an office on
its ring: two or three civil corporations not at war with the landlord
(a free port's tenants are the hostile outfits). Stable per port and sky.
<!-- /note -->

### <a id="s-_p"></a>`_p`

const · L120–120

<!-- note:_p -->
---- where a job points ------------------------------------------------------
<!-- /note -->

### <a id="s-targetPos"></a>`targetPos(t, time=, out=)`

function · **exported** · L121–127

- calls: [`stationById`](../station/stations.js.md#s-stationById) _js/station/stations.js_ · [`beaconPosition`](../world/bodies.js.md#s-beaconPosition) _js/world/bodies.js_ · [`bodyPosition`](../world/bodies.js.md#s-bodyPosition) _js/world/bodies.js_
- via [js/world/bodies.js](../world/bodies.js.md): `BEACONS.find`
- called by: [`jobPlan`](../aria/play.js.md#s-jobPlan) _js/aria/play.js_ · [`jobSeconds`](../aria/play.js.md#s-jobSeconds) _js/aria/play.js_ · [`startJob`](../aria/play.js.md#s-startJob) _js/aria/play.js_ · [`anchorFor`](#s-anchorFor) · [`markTarget`](#s-markTarget) · [`tickContracts`](#s-tickContracts)

<!-- note:targetPos -->
World position of a job's target right now: a body, a beacon, a point off a port, or a fixed point.
<!-- /note -->

### <a id="s-markTarget"></a>`markTarget(a)`

function · **exported** · L129–145

- calls: [`anchorFor`](#s-anchorFor) · [`targetPos`](#s-targetPos) · [`addAnchoredWaypoint`](../sim/sim.js.md#s-addAnchoredWaypoint) _js/sim/sim.js_ · [`addWaypointAt`](../sim/sim.js.md#s-addWaypointAt) _js/sim/sim.js_ · [`removeWaypoint`](../sim/sim.js.md#s-removeWaypoint) _js/sim/sim.js_
- called by: [`acceptContract`](#s-acceptContract) · [`tickContracts`](#s-tickContracts) · [`renderHeld`](../ui/boardview.js.md#s-renderHeld) _js/ui/boardview.js_

<!-- note:markTarget -->
Put a job's next target on the chart as a waypoint.

- L130 · `const anchor = anchorFor(a);` — 0.3.67 — the mark is pinned to the THING the job is about, not to where
  it was when you pressed MARK: a seam job's biggest live rock, the world,
  the beacon, the picket off its moving port, the wanted hull, the boat you
  are escorting, the nest. Only a job whose target is a bare point (a wreck
  or pod drop) marks a point.
- L134 · `if (sim.waypoints.length === n0) return wp;` — an existing mark on the same thing, now active — yours, left alone
<!-- /note -->

### <a id="s-anchorFor"></a>`anchorFor(a)`

function · **exported** · L147–161

- calls: [`targetPos`](#s-targetPos) · [`goodName`](materials.js.md#s-goodName) _js/economy/materials.js_ · [`siteById`](sites.js.md#s-siteById) _js/economy/sites.js_ · [`hulkById`](../world/hulks.js.md#s-hulkById) _js/world/hulks.js_
- called by: [`markTarget`](#s-markTarget)

<!-- note:anchorFor -->
What a job's mark should follow → { ref, name, at } or null (a bare point).
<!-- /note -->

### <a id="s-spotSeq"></a>`spotSeq`

const · L163–163

<!-- note:spotSeq -->
0.3.20 — a job with rock in it names a stretch of belt, and accepting it
opens a SITE there (js/economy/sites.js): a seeded scatter of the ore the job wants,
laid into the belt the cells already grow, so the run pays twice.
<!-- /note -->

### <a id="s-jobSpot"></a>`jobSpot(st, rnd, opts=)`

function · L164–167

- calls: [`pickSpot`](sites.js.md#s-pickSpot) _js/economy/sites.js_
- called by: [`KINDS.pod`](#s-KINDS-pod) · [`withSpot`](#s-withSpot)

<!-- note:jobSpot -->
<!-- /note -->

### <a id="s-rocksFor"></a>`rocksFor(qty)`

function · L168–168

- called by: [`chainOffer`](#s-chainOffer) · [`withSpot`](#s-withSpot)

<!-- note:rocksFor -->
how many rocks a site needs to carry an order: a handful, and enough of them
<!-- /note -->

### <a id="s-withSpot"></a>`withSpot(job, st, rnd, opts=)`

function · L170–179

- calls: [`jobSpot`](#s-jobSpot) · [`rocksFor`](#s-rocksFor) · [`spotLine`](sites.js.md#s-spotLine) _js/economy/sites.js_
- called by: [`KINDS.assay`](#s-KINDS-assay) · [`KINDS.ice`](#s-KINDS-ice) · [`KINDS.mine`](#s-KINDS-mine) · [`KINDS.vein`](#s-KINDS-vein)

<!-- note:withSpot -->
The place half of a rock job: the spot, the waypoint target, and the line that names it.
<!-- /note -->

### <a id="s-unitBasis"></a>`unitBasis(st, id)`

function · L181–186

- calls: [`cheapestSource`](#s-cheapestSource) · [`bidPrice`](economy.js.md#s-bidPrice) _js/economy/economy.js_ · [`baseValue`](materials.js.md#s-baseValue) _js/economy/materials.js_ · [`good`](materials.js.md#s-good) _js/economy/materials.js_
- called by: [`deliverJob`](#s-deliverJob)

<!-- note:unitBasis -->
---- the job kinds ---------------------------------------------------------------
Each returns the kind-specific fields of an offer, or null when it cannot be
posted here (no pirates to hunt, nothing short, no unsurveyed world). The
mechanics are few — deliver, haul (consigned), kill, visit, survey, escort —
and the kinds are the jobs a port actually has.

A delivery pays the port's bid for the goods PLUS a premium (`prem`, scaled
by tier) and a fee — the desk has to beat the market floor, or you would
just sell the cargo there. (The 0.3.17 desk paid 0.55–0.7 of the bid and
called it "over the bid".)

0.3.47: a job that pays for goods pays the goods at the bid and a premium
on top; the tier scales the PREMIUM and the fee, never the goods. Before, a
Sealed procurement multiplied the whole cost of the cargo by the tier and
then by BOARD.pay, and paid 3.7× what the goods were worth. Freight (a
consignment the port loads for you) is a commission on its value, 10–12%,
not 60%.

…and a delivery of something you can BUY is priced off what it costs to
buy. Ore and ice you cut yourself are paid over the bid (the premium is your
time on the cutter); a part or a refined good that some port sells for 0.7
of book was paying bid × 1.54 on a Sealed desk, which is money for a trip to
the shop. For those the basis is the cheapest ask in the sky (+8% for the
trip), and the premium is lighter.

- L183 · `if (good(id)?.tier === "ore") return { unit: top, k: (t) => 0.7 + 0.3 * t.pay };` — the 0.3.18 shape: the tier leans on it gently
<!-- /note -->

#### <a id="s-unitBasis-k"></a>`unitBasis.k(t)`

prop · L183–183

- called by: [`deliverJob`](#s-deliverJob)

<!-- note:unitBasis.k -->
<!-- /note -->

#### <a id="s-unitBasis-k-2"></a>`unitBasis.k~2(t)`

prop · L185–185

<!-- note:unitBasis.k~2 -->
<!-- /note -->

### <a id="s-deliverJob"></a>`deliverJob(st, id, qty, prem, fee, t, title, text)`

function · L187–190

- calls: [`unitBasis`](#s-unitBasis) · [`unitBasis.k`](#s-unitBasis-k)
- called by: [`KINDS.assay`](#s-KINDS-assay) · [`KINDS.build`](#s-KINDS-build) · [`KINDS.food`](#s-KINDS-food) · [`KINDS.fuel`](#s-KINDS-fuel) · [`KINDS.ice`](#s-KINDS-ice) · [`KINDS.materials`](#s-KINDS-materials) · [`KINDS.medical`](#s-KINDS-medical) · [`KINDS.mine`](#s-KINDS-mine) · [`KINDS.parts`](#s-KINDS-parts) · [`KINDS.reactor`](#s-KINDS-reactor) · [`KINDS.supply`](#s-KINDS-supply) · [`KINDS.tender`](#s-KINDS-tender) · [`KINDS.vein`](#s-KINDS-vein)

<!-- note:deliverJob -->
<!-- /note -->

### <a id="s-cheapestSource"></a>`cheapestSource(id, except)`

function · L192–200

- calls: [`askPrice`](economy.js.md#s-askPrice) _js/economy/economy.js_ · [`stockOf`](economy.js.md#s-stockOf) _js/economy/economy.js_
- called by: [`KINDS.procure`](#s-KINDS-procure) · [`KINDS.tender`](#s-KINDS-tender) · [`unitBasis`](#s-unitBasis)

<!-- note:cheapestSource -->
<!-- /note -->

### <a id="s-bestBuyer"></a>`bestBuyer(id, except)`

function · L201–209

- calls: [`sellPriceAt`](../sim/sim.js.md#s-sellPriceAt) _js/sim/sim.js_
- called by: [`KINDS.consign`](#s-KINDS-consign)

<!-- note:bestBuyer -->
<!-- /note -->

### <a id="s-honestOthers"></a>`honestOthers(st)`

function · L210–210

- via [js/station/stations.js](../station/stations.js.md): `stations.filter`
- called by: [`KINDS.build`](#s-KINDS-build) · [`KINDS.courier`](#s-KINDS-courier) · [`KINDS.haul`](#s-KINDS-haul) · [`KINDS.resupply`](#s-KINDS-resupply)

<!-- note:honestOthers -->
<!-- /note -->

### <a id="s-KINDS"></a>`KINDS`

const · L212–406

<!-- note:KINDS -->
<!-- /note -->

#### <a id="s-KINDS-mine"></a>`KINDS.mine(st, rnd, t, fit)`

prop · L213–218

- calls: [`deliverJob`](#s-deliverJob) · [`pickOf`](#s-pickOf) · [`qtyFor`](#s-qtyFor) · [`withSpot`](#s-withSpot)
- via [js/economy/materials.js](materials.js.md): `ORES.find`, `ORES.slice`, `ORES.slice.map`, `ORES.some`

<!-- note:KINDS.mine -->
MINING
<!-- /note -->

#### <a id="s-KINDS-ice"></a>`KINDS.ice(st, rnd, t, fit)`

prop · L219–223

- calls: [`deliverJob`](#s-deliverJob) · [`pickOf`](#s-pickOf) · [`qtyFor`](#s-qtyFor) · [`withSpot`](#s-withSpot) · [`goodName`](materials.js.md#s-goodName) _js/economy/materials.js_ ×2

<!-- note:KINDS.ice -->
<!-- /note -->

#### <a id="s-KINDS-vein"></a>`KINDS.vein(st, rnd, t, fit)`

prop · L224–228

- calls: [`deliverJob`](#s-deliverJob) · [`pickOf`](#s-pickOf) · [`qtyFor`](#s-qtyFor) · [`withSpot`](#s-withSpot) · [`goodName`](materials.js.md#s-goodName) _js/economy/materials.js_ ×2

<!-- note:KINDS.vein -->
<!-- /note -->

#### <a id="s-KINDS-haul"></a>`KINDS.haul(st, rnd, t, fit)`

prop · L229–236

- calls: [`honestOthers`](#s-honestOthers) · [`pickOf`](#s-pickOf) ×2 · [`qtyFor`](#s-qtyFor) · [`baseValue`](materials.js.md#s-baseValue) _js/economy/materials.js_ · [`goodName`](materials.js.md#s-goodName) _js/economy/materials.js_ ×2

<!-- note:KINDS.haul -->
LOGISTICS
<!-- /note -->

#### <a id="s-KINDS-supply"></a>`KINDS.supply(st, rnd, t, fit)`

prop · L237–243

- calls: [`deliverJob`](#s-deliverJob) · [`pickOf`](#s-pickOf) · [`qtyFor`](#s-qtyFor) · [`shortagesOf`](economy.js.md#s-shortagesOf) _js/economy/economy.js_ · [`goodName`](materials.js.md#s-goodName) _js/economy/materials.js_ ×2

<!-- note:KINDS.supply -->
<!-- /note -->

#### <a id="s-KINDS-courier"></a>`KINDS.courier(st, rnd, t, fit)`

prop · L244–250

- calls: [`honestOthers`](#s-honestOthers) · [`pickOf`](#s-pickOf) ×2 · [`stockOf`](economy.js.md#s-stockOf) _js/economy/economy.js_ ×2 · [`baseValue`](materials.js.md#s-baseValue) _js/economy/materials.js_ · [`goodName`](materials.js.md#s-goodName) _js/economy/materials.js_ ×2

<!-- note:KINDS.courier -->
<!-- /note -->

#### <a id="s-KINDS-procure"></a>`KINDS.procure(st, rnd, t, fit)`

prop · L251–260

- calls: [`cheapestSource`](#s-cheapestSource) · [`pickOf`](#s-pickOf) · [`qtyFor`](#s-qtyFor) · [`bidPrice`](economy.js.md#s-bidPrice) _js/economy/economy.js_ · [`goodName`](materials.js.md#s-goodName) _js/economy/materials.js_ ×2

<!-- note:KINDS.procure -->
TRADE
<!-- /note -->

#### <a id="s-KINDS-consign"></a>`KINDS.consign(st, rnd, t, fit)`

prop · L261–269

- calls: [`bestBuyer`](#s-bestBuyer) · [`qtyFor`](#s-qtyFor) · [`askPrice`](economy.js.md#s-askPrice) _js/economy/economy.js_ ×2 · [`goodName`](materials.js.md#s-goodName) _js/economy/materials.js_ ×2

<!-- note:KINDS.consign -->
- L264 · `let best = null;` — the line that sells best somewhere else
<!-- /note -->

#### <a id="s-KINDS-resupply"></a>`KINDS.resupply(st, rnd, t, fit)`

prop · L270–278

- calls: [`honestOthers`](#s-honestOthers) · [`pickOf`](#s-pickOf) ×2 · [`qtyFor`](#s-qtyFor) · [`askPrice`](economy.js.md#s-askPrice) _js/economy/economy.js_ · [`goodName`](materials.js.md#s-goodName) _js/economy/materials.js_ ×2

<!-- note:KINDS.resupply -->
- L271 · `const dest = pickOf(rnd, honestOthers(st));` — a tenant's own shop runs low: bring back a mixed good from the sector's sell list elsewhere
<!-- /note -->

#### <a id="s-KINDS-tender"></a>`KINDS.tender(st, rnd, t, fit)`

prop · L279–287

- calls: [`cheapestSource`](#s-cheapestSource) · [`deliverJob`](#s-deliverJob) · [`pickOf`](#s-pickOf) · [`qtyFor`](#s-qtyFor) · [`wantsOf`](economy.js.md#s-wantsOf) _js/economy/economy.js_ · [`goodName`](materials.js.md#s-goodName) _js/economy/materials.js_ ×2

<!-- note:KINDS.tender -->
- L280 · `const w = pickOf(rnd, wantsOf(st, 5));` — the port's buyers put out a tender for something it wants at a fixed price over its bid
<!-- /note -->

#### <a id="s-KINDS-bounty"></a>`KINDS.bounty(st, rnd, t)`

prop · L288–293

- calls: [`pickOf`](#s-pickOf)
- via [js/npc/traffic.js](../npc/traffic.js.md): `HOSTILE_ROLES.has`, `traffic.filter`

<!-- note:KINDS.bounty -->
SECURITY
<!-- /note -->

#### <a id="s-KINDS-escort"></a>`KINDS.escort(st, rnd, t)`

prop · L294–298

- calls: [`pickOf`](#s-pickOf)
- via [js/npc/flow.js](../npc/flow.js.md): `flow.filter`

<!-- note:KINDS.escort -->
<!-- /note -->

#### <a id="s-KINDS-patrol"></a>`KINDS.patrol(st, rnd, t)`

prop · L299–307

<!-- note:KINDS.patrol -->
<!-- /note -->

#### <a id="s-KINDS-rogues"></a>`KINDS.rogues(st, rnd, t)`

prop · L308–314

- calls: [`pickOf`](#s-pickOf)
- via [js/npc/rogues.js](../npc/rogues.js.md): `nests.filter`

<!-- note:KINDS.rogues -->
<!-- /note -->

#### <a id="s-KINDS-salvage"></a>`KINDS.salvage(st, rnd, t, fit)`

prop · L315–318

- calls: [`sized`](#s-sized) · [`baseValue`](materials.js.md#s-baseValue) _js/economy/materials.js_

<!-- note:KINDS.salvage -->
SALVAGE
<!-- /note -->

#### <a id="s-KINDS-wreck"></a>`KINDS.wreck(st, rnd, t, fit)`

prop · L319–327

- calls: [`sized`](#s-sized) · [`baseValue`](materials.js.md#s-baseValue) _js/economy/materials.js_ · [`bodyPosition`](../world/bodies.js.md#s-bodyPosition) _js/world/bodies.js_

<!-- note:KINDS.wreck -->
- L320 · `const r = WRECK.near + rnd() * (WRECK.far - WRECK.near);` — 0.3.90: hulls die on the approaches — that is where the raiders wait and
  where the port's guns reach — so that is where a wreck job is. It used
  to be a point in a belt shoal: a long sublight leg through rock and a
  drone swarm for a hull that has no power to spare.
- L322 · `if (st.hostId && bodyPosition(st.hostId, sim.time, _host)) a = Math.atan2(st.z - _host.z,` — a port on a tether has a world behind it: the wreck lies on the open
  side, not through the planet from the berth
<!-- /note -->

#### <a id="s-KINDS-pod"></a>`KINDS.pod(st, rnd, t, fit)`

prop · L328–334

- calls: [`jobSpot`](#s-jobSpot) · [`pickOf`](#s-pickOf) · [`qtyFor`](#s-qtyFor) · [`baseValue`](materials.js.md#s-baseValue) _js/economy/materials.js_ · [`goodName`](materials.js.md#s-goodName) _js/economy/materials.js_ ×2 · [`spotLine`](sites.js.md#s-spotLine) _js/economy/sites.js_

<!-- note:KINDS.pod -->
- L329 · `const spot = jobSpot(st, rnd, { spread: 1.6, r: 900 });` — a cargo pod blown off a hauler: fly to it, hold while the tractor takes it, bring it in
<!-- /note -->

#### <a id="s-KINDS-materials"></a>`KINDS.materials(st, rnd, t, fit)`

prop · L335–341

- calls: [`deliverJob`](#s-deliverJob) · [`pickOf`](#s-pickOf) · [`qtyFor`](#s-qtyFor) · [`shortagesOf`](economy.js.md#s-shortagesOf) _js/economy/economy.js_ · [`goodName`](materials.js.md#s-goodName) _js/economy/materials.js_ ×2
- via [js/economy/economy.js](economy.js.md): `shortagesOf.map`, `shortagesOf.map.filter`

<!-- note:KINDS.materials -->
INDUSTRY
<!-- /note -->

#### <a id="s-KINDS-build"></a>`KINDS.build(st, rnd, t, fit)`

prop · L342–350

- calls: [`deliverJob`](#s-deliverJob) · [`honestOthers`](#s-honestOthers) · [`pickOf`](#s-pickOf) ×2 · [`sized`](#s-sized) · [`stockOf`](economy.js.md#s-stockOf) _js/economy/economy.js_ · [`baseValue`](materials.js.md#s-baseValue) _js/economy/materials.js_ · [`goodName`](materials.js.md#s-goodName) _js/economy/materials.js_ ×4

<!-- note:KINDS.build -->
<!-- /note -->

#### <a id="s-KINDS-parts"></a>`KINDS.parts(st, rnd, t, fit)`

prop · L351–355

- calls: [`deliverJob`](#s-deliverJob) · [`pickOf`](#s-pickOf) · [`qtyFor`](#s-qtyFor) · [`goodName`](materials.js.md#s-goodName) _js/economy/materials.js_ ×2

<!-- note:KINDS.parts -->
<!-- /note -->

#### <a id="s-KINDS-fuel"></a>`KINDS.fuel(st, rnd, t, fit)`

prop · L356–360

- calls: [`deliverJob`](#s-deliverJob) · [`pickOf`](#s-pickOf) · [`qtyFor`](#s-qtyFor) · [`goodName`](materials.js.md#s-goodName) _js/economy/materials.js_ ×2

<!-- note:KINDS.fuel -->
ENERGY
<!-- /note -->

#### <a id="s-KINDS-reactor"></a>`KINDS.reactor(st, rnd, t, fit)`

prop · L361–365

- calls: [`deliverJob`](#s-deliverJob) · [`pickOf`](#s-pickOf) · [`qtyFor`](#s-qtyFor) · [`goodName`](materials.js.md#s-goodName) _js/economy/materials.js_ ×2

<!-- note:KINDS.reactor -->
<!-- /note -->

#### <a id="s-KINDS-survey"></a>`KINDS.survey(st, rnd, t)`

prop · L366–371

- calls: [`pickOf`](#s-pickOf)
- via [js/world/bodies.js](../world/bodies.js.md): `BODIES.filter`
- via [js/sim/sim.js](../sim/sim.js.md): `sim.scanned.has`

<!-- note:KINDS.survey -->
SCIENCE
<!-- /note -->

#### <a id="s-KINDS-assay"></a>`KINDS.assay(st, rnd, t)`

prop · L372–376

- calls: [`deliverJob`](#s-deliverJob) · [`pickOf`](#s-pickOf) · [`withSpot`](#s-withSpot) · [`goodName`](materials.js.md#s-goodName) _js/economy/materials.js_ ×2

<!-- note:KINDS.assay -->
<!-- /note -->

#### <a id="s-KINDS-chart"></a>`KINDS.chart(st, rnd, t)`

prop · L377–381

- calls: [`pickOf`](#s-pickOf)

<!-- note:KINDS.chart -->
<!-- /note -->

#### <a id="s-KINDS-medical"></a>`KINDS.medical(st, rnd, t, fit)`

prop · L382–386

- calls: [`deliverJob`](#s-deliverJob) · [`pickOf`](#s-pickOf) · [`qtyFor`](#s-qtyFor) · [`goodName`](materials.js.md#s-goodName) _js/economy/materials.js_ ×2

<!-- note:KINDS.medical -->
CIVIC
<!-- /note -->

#### <a id="s-KINDS-food"></a>`KINDS.food(st, rnd, t, fit)`

prop · L387–394

- calls: [`deliverJob`](#s-deliverJob) · [`pickOf`](#s-pickOf) · [`qtyFor`](#s-qtyFor) · [`goodName`](materials.js.md#s-goodName) _js/economy/materials.js_ ×2
- via [js/station/stations.js](../station/stations.js.md): `stations.find`

<!-- note:KINDS.food -->
<!-- /note -->

#### <a id="s-KINDS-relay"></a>`KINDS.relay(st, rnd, t)`

prop · L395–399

- calls: [`pickOf`](#s-pickOf)

<!-- note:KINDS.relay -->
<!-- /note -->

#### <a id="s-KINDS-fieldtrip"></a>`KINDS.fieldtrip(st, rnd, t)`

prop · L400–405

- calls: [`pickOf`](#s-pickOf) · [`bodyPosition`](../world/bodies.js.md#s-bodyPosition) _js/world/bodies.js_
- via [js/world/bodies.js](../world/bodies.js.md): `BODIES.filter`, `BODIES.filter.map`, `BODIES.filter.map.sort`, `….map.sort.slice`

<!-- note:KINDS.fieldtrip -->
<!-- /note -->

### <a id="s-goodValue"></a>`goodValue(st, id)`

function · L408–408

- calls: [`bidPrice`](economy.js.md#s-bidPrice) _js/economy/economy.js_ · [`baseValue`](materials.js.md#s-baseValue) _js/economy/materials.js_
- called by: [`chainOffer`](#s-chainOffer) ×2

<!-- note:goodValue -->
---- chain stages ----------------------------------------------------------------
A chain stage is an ordinary job with the story's words on it. The kind the
stage names builds the mechanics — the same KINDS every one-off uses — and
then the stage overrides the tonnage, the good, the pay and the prose. So a
chain never asks for something the game cannot complete, and the numbers in
it are the live sky's numbers, not the author's.
<!-- /note -->

### <a id="s-chainOffer"></a>`chainOffer(st, rnd, now, fit, spec)`

function · L410–447

- calls: [`corpOfStation`](../corp/corps.js.md#s-corpOfStation) _js/corp/corps.js_ · [`chainBonus`](chains.js.md#s-chainBonus) _js/economy/chains.js_ · [`goodValue`](#s-goodValue) ×2 · [`rocksFor`](#s-rocksFor) · [`spotLine`](sites.js.md#s-spotLine) _js/economy/sites.js_
- called by: [`boardFor`](#s-boardFor)

<!-- note:chainOffer -->
- L415 · `if (stage.qtyK && job.qty) {` — tonnage first: the pay follows it — and never more than the hold can take,
  or the stage is a job you can accept and can never finish
- L423 · `if (stage.good && job.good && stage.good !== job.good) {` — the story wants a particular good: swap it and re-price against its worth
- L428 · `if (job.mech === "haul") job.chainStock = true;` — a consignment the port has to have on the dock: the desk puts it there on accept
- L435 · `const issuer = corpOfStation(st);` — a chain stage is not gated on standing: you are already in it
<!-- /note -->

### <a id="s-makeOffer"></a>`makeOffer(st, rnd, now, issuer, cat, fit, tierKey=)`

function · L449–466

- calls: [`corpOfStation`](../corp/corps.js.md#s-corpOfStation) _js/corp/corps.js_ · [`pickTier`](#s-pickTier)
- called by: [`boardFor`](#s-boardFor) ×3

<!-- note:makeOffer -->
One offer at a port, for one issuer, in one department.

- L451 · `for (let k = 0; k < kinds.length; k++) {` — try the department's kinds in a seeded order until one can be posted here
<!-- /note -->

### <a id="s-boardFor"></a>`boardFor(st, now=)`

function · **exported** · L468–498

- calls: [`chainOffersAt`](chains.js.md#s-chainOffersAt) _js/economy/chains.js_ · [`chainVersion`](chains.js.md#s-chainVersion) _js/economy/chains.js_ · [`boardFor>add`](#s-boardFor-add) ×4 · [`chainOffer`](#s-chainOffer) · [`charterOf`](#s-charterOf) · [`hullFit`](#s-hullFit) · [`issuersAt`](#s-issuersAt) · [`makeOffer`](#s-makeOffer) ×3 · [`pilotCareer`](#s-pilotCareer) ×2 · [`weighted`](#s-weighted) · [`rngFromSeed`](../world/generate.js.md#s-rngFromSeed) _js/world/generate.js_
- called by: [`jobsFor`](../aria/play.js.md#s-jobsFor) _js/aria/play.js_ · [`mountBoard`](../console/panels/corp.js.md#s-mountBoard) _js/console/panels/corp.js_ · [`boardByCategory`](#s-boardByCategory)

<!-- note:boardFor -->
The board at a port right now — regenerated on its refresh cadence, seeded.

- L481 · `for (const spec of chainOffersAt(st, now)) add(chainOffer(st, rnd, t0, fit, spec));` — 0.3.21: the chain stages this port owes you go up first — a chain you are
  running is the reason you flew here, and an opener is the desk's own.
- L482 · `for (const cat of CATEGORY_ORDER) {` — one pass that covers every department (every career has something on the desk)…
- L486 · `const mine = CATEGORY_ORDER.find((c) => CATEGORIES[c].careers.includes(pilotCareer()));` — …a floor under YOUR career's department: three more, two of them Standard (no standing asked) …
- L488 · `for (let i = offers.length, guard = 0; i < BOARD.offers && guard < BOARD.offers * 3; guard` — …then the port's own mix
- L492 · `if (add(makeOffer(st, rnd, t0, issuer, weighted(rnd, table), fit))) i++;` — one posting per job: two outfits (or one twice) do not post the same run for the same good
<!-- /note -->

#### <a id="s-boardFor-sig"></a>`boardFor>sig(o)`

function · L479–479

- called by: [`boardFor>add`](#s-boardFor-add) ×2

<!-- note:boardFor>sig -->
one posting per job, and never two with the same words on them
<!-- /note -->

#### <a id="s-boardFor-add"></a>`boardFor>add(o)`

function · L480–480

- calls: [`boardFor>sig`](#s-boardFor-sig) ×2
- called by: [`boardFor`](#s-boardFor) ×4

<!-- note:boardFor>add -->
<!-- /note -->

### <a id="s-boardByCategory"></a>`boardByCategory(st, now=)`

function · **exported** · L500–516

- calls: [`acceptBlocker`](#s-acceptBlocker) ×3 · [`boardFor`](#s-boardFor)
- called by: [`senseBoard`](../aria/senses.js.md#s-senseBoard) _js/aria/senses.js_ · [`renderDesk`](../ui/boardview.js.md#s-renderDesk) _js/ui/boardview.js_

<!-- note:boardByCategory -->
The desk as the views show it: departments → issuers → offers, takeable
first. → [{ cat, name, careers, offers: n, best, issuers: [{ corpId, corpName, tenant, offers: [...] }] }]
<!-- /note -->

### <a id="s-acceptBlocker"></a>`acceptBlocker(c)`

function · **exported** · L518–534

- calls: [`standingLabel`](../corp/corps.js.md#s-standingLabel) _js/corp/corps.js_ · [`hullFit`](#s-hullFit) · [`stockOf`](economy.js.md#s-stockOf) _js/economy/economy.js_ · [`goodName`](materials.js.md#s-goodName) _js/economy/materials.js_ ×2 · [`roomFor`](../flight/ship.js.md#s-roomFor) _js/flight/ship.js_ · [`stationById`](../station/stations.js.md#s-stationById) _js/station/stations.js_
- via [js/corp/corps.js](../corp/corps.js.md): `corps.find`
- via [js/sim/sim.js](../sim/sim.js.md): `sim.scanned.has`
- called by: [`jobsFor`](../aria/play.js.md#s-jobsFor) _js/aria/play.js_ · [`acceptContract`](#s-acceptContract) · [`boardByCategory`](#s-boardByCategory) ×3 · [`renderDesk`](../ui/boardview.js.md#s-renderDesk) _js/ui/boardview.js_ ×2

<!-- note:acceptBlocker -->
Why you cannot take it, or null.
<!-- /note -->

### <a id="s-acceptContract"></a>`acceptContract(c)`

function · **exported** · L536–570

- calls: [`noteChainAccept`](chains.js.md#s-noteChainAccept) _js/economy/chains.js_ · [`acceptBlocker`](#s-acceptBlocker) · [`markTarget`](#s-markTarget) · [`deliver`](economy.js.md#s-deliver) _js/economy/economy.js_ · [`lift`](economy.js.md#s-lift) _js/economy/economy.js_ · [`stockOf`](economy.js.md#s-stockOf) _js/economy/economy.js_ ×2 · [`openSite`](sites.js.md#s-openSite) _js/economy/sites.js_ · [`logEvent`](../sim/sim.js.md#s-logEvent) _js/sim/sim.js_ · [`bookHandling`](../station/dockwork.js.md#s-bookHandling) _js/station/dockwork.js_ · [`stationById`](../station/stations.js.md#s-stationById) _js/station/stations.js_ ×2 · [`hullForPlate`](../world/hulks.js.md#s-hullForPlate) _js/world/hulks.js_ · [`plateOf`](../world/hulks.js.md#s-plateOf) _js/world/hulks.js_ · [`spawnHulk`](../world/hulks.js.md#s-spawnHulk) _js/world/hulks.js_
- called by: [`startJob`](../aria/play.js.md#s-startJob) _js/aria/play.js_ · [`renderDesk`](../ui/boardview.js.md#s-renderDesk) _js/ui/boardview.js_

<!-- note:acceptContract -->
- L542 · `if (c.chainStock && stockOf(st, c.good) < c.qty) deliver(st, c.good, c.qty - stockOf(st, c` — a chain's consignment is the desk's own freight: it is on the dock waiting
- L543 · `const got = lift(st, c.good, c.qty);` — off the floor and into the hold
- L544 · `bookHandling(st.id, "buy", c.good, got, sim.ship.mods);` — 0.3.25: loading takes time
- L552 · `if (a.spot && a.good) {` — 0.3.20: the rock the job wants is laid in at the place the job names
- L554 · `sim.autoPlan.seam = { x: a.spot.x, y: a.spot.y, z: a.spot.z, name: a.spot.name, site: Stri` — MINE HERE / MINE LOOP work the site (0.3.67: and its marked rock)
- L555 · `sim.autoPlan.seamOre = a.good;` — 0.3.22: and the cutter works the ore the job asked for
- L? · `if (a.targets?.length || a.markId || a.boatId || a.nestId) markTarget(a);` — 0.3.67: hunts and escorts get a mark on the hull too

- L558 · `const def = hullForPlate(a.qty);` — the site is a real hulk: pinned for the life of the job, sized so its
  plate covers the order, whole so there is something on every section
<!-- /note -->

### <a id="s-settle"></a>`settle(a, ok, why)`

function · L572–620

- calls: [`bookRevenue`](../corp/company.js.md#s-bookRevenue) _js/corp/company.js_ ×2 · [`adjustStanding`](../corp/corps.js.md#s-adjustStanding) _js/corp/corps.js_ ×5 · [`corpRelation`](../corp/corps.js.md#s-corpRelation) _js/corp/corps.js_ · [`noteChainDone`](chains.js.md#s-noteChainDone) _js/economy/chains.js_ · [`noteChainFail`](chains.js.md#s-noteChainFail) _js/economy/chains.js_ · [`categoryOf`](#s-categoryOf) · [`closeSite`](sites.js.md#s-closeSite) _js/economy/sites.js_ · [`work`](../flight/pilot.js.md#s-work) _js/flight/pilot.js_ · [`logEvent`](../sim/sim.js.md#s-logEvent) _js/sim/sim.js_ ×4 · [`removeWaypoint`](../sim/sim.js.md#s-removeWaypoint) _js/sim/sim.js_ · [`hulkById`](../world/hulks.js.md#s-hulkById) _js/world/hulks.js_
- via [js/corp/corps.js](../corp/corps.js.md): `corps.find`
- via [js/sim/sim.js](../sim/sim.js.md): `sim.waypoints.filter`
- called by: [`abandonContract`](#s-abandonContract) · [`deliverContracts`](#s-deliverContracts) · [`tickContracts`](#s-tickContracts)

<!-- note:settle -->
- L576 · `for (const w of sim.waypoints.filter((x) => x.job === a.id)) removeWaypoint(w.id);` — 0.3.67: the job's own marks go with it (they follow a seam, a hull, a nest
  that is no longer the player's business; a mark you made yourself stays)
- L578 · `const sp = a.spot, sm = sim.autoPlan.seam;` — 0.3.47: …and the site stops being "the seam". A closed job's spot stayed in
  autoPlan.seam, so the next free MINE flew back to wherever that job had
  been — found when a dropped vein strike sent ARIA 800,000 u across the
  system to a site that no longer had anything to do with anything.
- L600 · `const ch = a.chain ? noteChainDone(a) : null;` — 0.3.21: a chain stage closes — the next one is posted, or the whole thing pays out
<!-- /note -->

### <a id="s-abandonContract"></a>`abandonContract(id)`

function · **exported** · L622–627

- calls: [`settle`](#s-settle) · [`takeCargo`](../flight/ship.js.md#s-takeCargo) _js/flight/ship.js_
- called by: [`resumeHeld>drop`](../aria/play.js.md#s-resumeHeld-drop) _js/aria/play.js_ · [`startJob`](../aria/play.js.md#s-startJob) _js/aria/play.js_ · [`stepPlay`](../aria/play.js.md#s-stepPlay) _js/aria/play.js_ ×4 · [`renderHeld`](../ui/boardview.js.md#s-renderHeld) _js/ui/boardview.js_

<!-- note:abandonContract -->
<!-- /note -->

### <a id="s-cargoOk"></a>`cargoOk(a)`

function · L629–629

- called by: [`deliverableAt`](#s-deliverableAt) ×3

<!-- note:cargoOk -->
a visit job with cargo (a wreck) needs both the flight and the plate
<!-- /note -->

### <a id="s-salvaged"></a>`salvaged(a)`

function · L630–630

- called by: [`deliverableAt`](#s-deliverableAt)

<!-- note:salvaged -->
<!-- /note -->

### <a id="s-noteSalvaged"></a>`noteSalvaged(goodId, qty, from=)`

function · **exported** · L632–645

- calls: [`hulkById`](../world/hulks.js.md#s-hulkById) _js/world/hulks.js_
- called by: [`stepSalvage`](../sim/sim.js.md#s-stepSalvage) _js/sim/sim.js_

<!-- note:noteSalvaged -->
0.3.90 — what the rig cut, credited to the salvage work it was cut for.

"Salvage N plate" took any iron ore, so the board's salvage work was filled
with the mining cutter. It takes hull steel now, and only steel that came
aboard as salvage: the tractor reports every unit it reels off a hulk, and a
job's `cut` count rises with it — the hulk-bound job first, then the open
ones. Mill steel bought off a shelf is in the hold but not on the count.
<!-- /note -->

### <a id="s-deliverableAt"></a>`deliverableAt(stId=)`

function · **exported** · L647–656

- calls: [`cargoOk`](#s-cargoOk) ×3 · [`salvaged`](#s-salvaged)
- called by: [`stepPlay`](../aria/play.js.md#s-stepPlay) _js/aria/play.js_ · [`deliverContracts`](#s-deliverContracts) · [`makeTradeOps.DELIVER`](../mission/tradeops.js.md#s-makeTradeOps-DELIVER) _js/mission/tradeops.js_ · [`renderHeld`](../ui/boardview.js.md#s-renderHeld) _js/ui/boardview.js_

<!-- note:deliverableAt -->
Contracts that can be closed at the docked port.

- L654 · `return a.stationId === stId && a.progress >= 1;` — kill, escort, survey
<!-- /note -->

### <a id="s-owedCargo"></a>`owedCargo()`

function · **exported** · L658–666

- called by: [`sellAllOre`](../sim/sim.js.md#s-sellAllOre) _js/sim/sim.js_

<!-- note:owedCargo -->
0.3.72 — cargo the player OWES: every open delivery job's good, up to its
quantity. The mining loop's SELL and the market's SELL ALL ORE keep it, so
ore cut for a job is never sold to the best bidder on the way to the desk
that ordered it. → { good: qty }
<!-- /note -->

### <a id="s-jobForSite"></a>`jobForSite(siteId)`

function · **exported** · L668–672

- called by: [`engageMiningLoop`](../flight/autopilot.js.md#s-engageMiningLoop) _js/flight/autopilot.js_ · [`makeTradeOps.DELIVER`](../mission/tradeops.js.md#s-makeTradeOps-DELIVER) _js/mission/tradeops.js_ ×2

<!-- note:jobForSite -->
0.3.72 — the delivery job a seam site belongs to, or null.
<!-- /note -->

### <a id="s-deliverContracts"></a>`deliverContracts(stId=)`

function · **exported** · L674–689

- calls: [`deliverableAt`](#s-deliverableAt) · [`settle`](#s-settle) · [`deliver`](economy.js.md#s-deliver) _js/economy/economy.js_ · [`takeCargo`](../flight/ship.js.md#s-takeCargo) _js/flight/ship.js_ · [`bookHandling`](../station/dockwork.js.md#s-bookHandling) _js/station/dockwork.js_ · [`stationById`](../station/stations.js.md#s-stationById) _js/station/stations.js_
- called by: [`stepPlay`](../aria/play.js.md#s-stepPlay) _js/aria/play.js_ · [`makeTradeOps.DELIVER`](../mission/tradeops.js.md#s-makeTradeOps-DELIVER) _js/mission/tradeops.js_ · [`renderHeld`](../ui/boardview.js.md#s-renderHeld) _js/ui/boardview.js_

<!-- note:deliverContracts -->
Close everything deliverable here. Returns credits paid.

- L678 · `if ((sim.ship.hold[a.good] ?? 0) < a.qty) continue;` — two contracts for one good settle off one hold: the second waits for its own cargo
- L682 · `bookHandling(stId, "deliver", a.good, got, sim.ship.mods);` — 0.3.25: the crane, not the till
<!-- /note -->

### <a id="s-noteKill"></a>`noteKill(vesselId)`

function · **exported** · L691–693

- called by: [`onKill`](../sim/sim.js.md#s-onKill) _js/sim/sim.js_

<!-- note:noteKill -->
A pirate died: any bounty on it is earned.
<!-- /note -->

### <a id="s-noteDestroyed"></a>`noteDestroyed(n)`

function · **exported** · L695–704

- called by: [`onKill`](../sim/sim.js.md#s-onKill) _js/sim/sim.js_ ×2

<!-- note:noteDestroyed -->
Anything you destroyed: a drone cull counts its drones. (sim.js calls this for every NPC kill.)
<!-- /note -->

### <a id="s-_d"></a>`_d(a, b)`

function · L706–706

- called by: [`tickContracts`](#s-tickContracts) ×2

<!-- note:_d -->
<!-- /note -->

### <a id="s-_t"></a>`_t`

const · L707–707

<!-- note:_t -->
<!-- /note -->

### <a id="s-visitRadius"></a>`visitRadius(t)`

function · **exported** · L709–713

- calls: [`scanRadius`](../world/bodies.js.md#s-scanRadius) _js/world/bodies.js_
- via [js/world/bodies.js](../world/bodies.js.md): `BODIES.find`
- called by: [`tickContracts`](#s-tickContracts)

<!-- note:visitRadius -->
How close counts as "there". A point in open space is 15 km; a WORLD is its
own survey range, because a body target's position is the body's CENTRE and
15 km of a planet's core is inside the planet — a field trip to Venus was
uncompletable before 0.3.22.
<!-- /note -->

### <a id="s-tickContracts"></a>`tickContracts(dt)`

function · **exported** · L715–760

- calls: [`_d`](#s-_d) ×2 · [`markTarget`](#s-markTarget) · [`settle`](#s-settle) · [`targetPos`](#s-targetPos) · [`visitRadius`](#s-visitRadius) · [`work`](../flight/pilot.js.md#s-work) _js/flight/pilot.js_ ×2 · [`addCargo`](../flight/ship.js.md#s-addCargo) _js/flight/ship.js_ · [`takeCargo`](../flight/ship.js.md#s-takeCargo) _js/flight/ship.js_ · [`recoverSite`](../sim/salvage.js.md#s-recoverSite) _js/sim/salvage.js_
- via [js/npc/flow.js](../npc/flow.js.md): `flow.find`
- via [js/sim/sim.js](../sim/sim.js.md): `sim.scanned.has`
- called by: [`stepWorld`](../sim/sim.js.md#s-stepWorld) _js/sim/sim.js_

<!-- note:tickContracts -->
Every tick: escorts on station, waypoints flown, surveys filed, deadlines.

- L? · `a.progress = Math.min(1, (sim.ship.hold[a.good] ?? 0) / a.qty);` — plate is plate: iron ore that came off a wreck counts once it is aboard
- L750 · `if (a.grant && !a.granted) { const got = addCargo(sim.ship, a.grant.good, a.grant.qty); a.` — a recovered pod comes aboard at the site (what the hold has room for)
<!-- /note -->

### <a id="s-timeLeft"></a>`timeLeft(a)`

function · **exported** · L762–762

- called by: [`playReport`](../aria/play.js.md#s-playReport) _js/aria/play.js_ ×2 · [`resumeHeld`](../aria/play.js.md#s-resumeHeld) _js/aria/play.js_ ×2 · [`stepPlay`](../aria/play.js.md#s-stepPlay) _js/aria/play.js_ ×2 · [`mountBoard`](../console/panels/corp.js.md#s-mountBoard) _js/console/panels/corp.js_ · [`renderHeld`](../ui/boardview.js.md#s-renderHeld) _js/ui/boardview.js_

<!-- note:timeLeft -->
<!-- /note -->

### <a id="s-jobStatus"></a>`jobStatus(a)`

function · **exported** · L764–779

- calls: [`goodName`](materials.js.md#s-goodName) _js/economy/materials.js_ · [`siteById`](sites.js.md#s-siteById) _js/economy/sites.js_ · [`hulkById`](../world/hulks.js.md#s-hulkById) _js/world/hulks.js_
- called by: [`playReport`](../aria/play.js.md#s-playReport) _js/aria/play.js_ · [`renderHeld`](../ui/boardview.js.md#s-renderHeld) _js/ui/boardview.js_

<!-- note:jobStatus -->
One line on what is left to do, for the in-hand list.
<!-- /note -->

### <a id="s-resetContracts"></a>`resetContracts()`

function · **exported** · L781–786

- calls: [`resetChains`](chains.js.md#s-resetChains) _js/economy/chains.js_ · [`closeSite`](sites.js.md#s-closeSite) _js/economy/sites.js_
- called by: [`launchSim`](../sim/sim.js.md#s-launchSim) _js/sim/sim.js_

<!-- note:resetContracts -->
<!-- /note -->

### <a id="s-wireContracts"></a>`wireContracts()`

function · **exported** · L788–791

- calls: [`wireChains`](chains.js.md#s-wireChains) _js/economy/chains.js_
- called by: [`mountHud`](../ui/hud.js.md#s-mountHud) _js/ui/hud.js_

<!-- note:wireContracts -->
<!-- /note -->
