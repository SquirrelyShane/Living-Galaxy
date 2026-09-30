# js/economy/chains.js

[index](../../../README.md) · 160 lines · 22 symbols · 3 imports · 6 importers

## About

<!-- note:@file -->
LIVING GALAXY — chain contracts: work that remembers you.

0.3.21. A one-off job is a transaction. A CHAIN is a relationship: four or
five stages posted one at a time, each one an ordinary board job built from
a kind the game already knows how to complete, strung on a story that moves
— a furnace relit charge by charge, a manifest that keeps not saying what is
in the case, a ring section built out girder by girder. Finish a stage and
the next one is waiting, here or at the port the desk sends you to; finish
the last and it pays a bonus and a block of standing on top of the stage.

This module is the state machine only. The prose and the stage plan are
data (js/data/chains.js); the offers themselves are built by contracts.js
from the kind each stage names, so a chain can never ask for a mechanic the
game does not have. The dependency runs one way: contracts.js → chains.js.

  chainOffersAt(st)   what this port should post right now
  noteChainAccept(a)  a stage was taken
  noteChainDone(a)    a stage was delivered → advance, or finish and pay
  noteChainFail(a)    abandoned or late → the chain drops, cools off, returns
<!-- /note -->

## Imports

| line | from | names | target |
|---|---|---|---|
| 1 | `../data/chains.js` | `CHAINS`, `CHAIN_BY_ID` | [js/data/chains.js](../data/chains.js.md) |
| 2 | `../station/stations.js` | `stations`, `stationById` | [js/station/stations.js](../station/stations.js.md) |
| 3 | `../sim/sim.js` | `sim` | [js/sim/sim.js](../sim/sim.js.md) |

## Imported by

- [js/aria/play.js](../aria/play.js.md) — `chainReport`
- [js/aria/senses.js](../aria/senses.js.md) — `chainReport`
- [js/economy/contracts.js](contracts.js.md) — `chainOffersAt`, `chainVersion`, `noteChainAccept`, `noteChainDone`, `noteChainFail`, `resetChains`, `chainReport`, `wireChains`, `CHAIN`, `chainBonus`
- [js/ui/boardview.js](../ui/boardview.js.md) — `chainReport`
- test/balance.test.mjs _(outside js/)_ — `CHAIN`, `chainBonus`
- test/chains.test.mjs _(outside js/)_ — `CHAINS`, `CHAIN_BY_ID`, `chains`, `chainOffersAt`, `chainReport`, `homePortOf`, `nextPortFrom`, `resetChains`, `chainBonus`

## Exports

- `CHAINS` — used by test/chains.test.mjs
- `CHAIN_BY_ID` — used by test/chains.test.mjs
- [`CHAIN`](#s-CHAIN) · const — used by [js/economy/contracts.js](contracts.js.md), test/balance.test.mjs
- [`chainBonus`](#s-chainBonus) · function — used by [js/economy/contracts.js](contracts.js.md), test/balance.test.mjs, test/chains.test.mjs
- [`chains`](#s-chains) · const — used by test/chains.test.mjs
- [`chainVersion`](#s-chainVersion) · function — used by [js/economy/contracts.js](contracts.js.md)
- [`homePortOf`](#s-homePortOf) · function — used by test/chains.test.mjs
- [`nextPortFrom`](#s-nextPortFrom) · function — used by test/chains.test.mjs
- [`chainOffersAt`](#s-chainOffersAt) · function — used by [js/economy/contracts.js](contracts.js.md), test/chains.test.mjs
- [`chainState`](#s-chainState) · function — **no importer in scanned roots**
- [`noteChainAccept`](#s-noteChainAccept) · function — used by [js/economy/contracts.js](contracts.js.md)
- [`noteChainDone`](#s-noteChainDone) · function — used by [js/economy/contracts.js](contracts.js.md)
- [`noteChainFail`](#s-noteChainFail) · function — used by [js/economy/contracts.js](contracts.js.md)
- [`chainReport`](#s-chainReport) · function — used by [js/aria/play.js](../aria/play.js.md), [js/aria/senses.js](../aria/senses.js.md), [js/economy/contracts.js](contracts.js.md), [js/ui/boardview.js](../ui/boardview.js.md), test/chains.test.mjs
- [`resetChains`](#s-resetChains) · function — used by [js/economy/contracts.js](contracts.js.md), test/chains.test.mjs
- [`wireChains`](#s-wireChains) · function — used by [js/economy/contracts.js](contracts.js.md)

## Effects

_none detected_

## Symbols

### <a id="s-CHAIN"></a>`CHAIN`

const · **exported** · L7–12

<!-- note:CHAIN -->
- L8 · `cool: 2400,` — s a failed chain stays off the boards
- L9 · `carry: 900,` — s of extra deadline a chain stage gets over a one-off
- L10 · `hop: 4,` — how many nearby ports an "at: next" stage may pick from
- L11 · `bonusK: 0.5,` — 0.3.47: the closing bonus in data/chains.js is authored at 5,500–9,500 —
  more than a starter hull — on top of stages that already paid. Half of it
  is still the best single payday on the desk.
<!-- /note -->

### <a id="s-chainBonus"></a>`chainBonus(chain)`

function · **exported** · L13–13

- called by: [`chainReport`](#s-chainReport) · [`noteChainDone`](#s-noteChainDone) ×2 · [`chainOffer`](contracts.js.md#s-chainOffer) _js/economy/contracts.js_

<!-- note:chainBonus -->
<!-- /note -->

### <a id="s-chains"></a>`chains`

const · **exported** · L15–15

<!-- note:chains -->
live: chainId → { chainId, idx, stationId, held, started, paid, stages }
<!-- /note -->

### <a id="s-version"></a>`version`

const · L16–16

<!-- note:version -->
<!-- /note -->

### <a id="s-chainVersion"></a>`chainVersion()`

function · **exported** · L17–17

- called by: [`boardFor`](contracts.js.md#s-boardFor) _js/economy/contracts.js_

<!-- note:chainVersion -->
<!-- /note -->

### <a id="s-hash32"></a>`hash32(s)`

function · L19–24

- called by: [`assignHomes>rank`](#s-assignHomes-rank) · [`nextPortFrom`](#s-nextPortFrom)

<!-- note:hash32 -->
<!-- /note -->

### <a id="s-honest"></a>`honest(st)`

function · L26–26

- called by: [`nextPortFrom`](#s-nextPortFrom)

<!-- note:honest -->
<!-- /note -->

### <a id="s-d3"></a>`d3(a, b)`

function · L27–27

- called by: [`nextPortFrom`](#s-nextPortFrom)

<!-- note:d3 -->
<!-- /note -->

### <a id="s-homes"></a>`homes`

const · L29–29

<!-- note:homes -->
Where a chain begins. Every chain has exactly ONE home port in a sky, and no
port hoards them: the chains are dealt out in order, each to the best-hashing
port of a sector it belongs in that is not already carrying its share. So a
chain is a place you can go back to, and a tour of the sky turns up work you
have not seen. Worked out once per sky and cached.
<!-- /note -->

### <a id="s-assignHomes"></a>`assignHomes()`

function · L30–54

- calls: [`assignHomes>rank`](#s-assignHomes-rank)
- via [js/station/stations.js](../station/stations.js.md): `stations.filter`
- called by: [`homePortOf`](#s-homePortOf)

<!-- note:assignHomes -->
<!-- /note -->

#### <a id="s-assignHomes-rank"></a>`assignHomes>rank(chain, st)`

function · L37–37

- calls: [`hash32`](#s-hash32)
- called by: [`assignHomes`](#s-assignHomes)

<!-- note:assignHomes>rank -->
<!-- /note -->

### <a id="s-homePortOf"></a>`homePortOf(chain)`

function · **exported** · L56–59

- calls: [`assignHomes`](#s-assignHomes) · [`stationById`](../station/stations.js.md#s-stationById) _js/station/stations.js_
- via [js/station/stations.js](../station/stations.js.md): `stations.find`
- called by: [`chainOffersAt`](#s-chainOffersAt)

<!-- note:homePortOf -->
<!-- /note -->

### <a id="s-nextPortFrom"></a>`nextPortFrom(st, chain, idx)`

function · **exported** · L61–65

- calls: [`d3`](#s-d3) · [`hash32`](#s-hash32) · [`honest`](#s-honest)
- via [js/station/stations.js](../station/stations.js.md): `stations.filter`, `stations.filter.map`, `stations.filter.map.sort`, `….map.sort.slice`
- called by: [`noteChainDone`](#s-noteChainDone)

<!-- note:nextPortFrom -->
A port for an `at: "next"` stage: one of the nearest few, picked by the stage.
<!-- /note -->

### <a id="s-cold"></a>`cold(id, now)`

function · L67–67

- called by: [`chainOffersAt`](#s-chainOffersAt)

<!-- note:cold -->
<!-- /note -->

### <a id="s-chainOffersAt"></a>`chainOffersAt(st, now=)`

function · **exported** · L69–84

- calls: [`cold`](#s-cold) · [`homePortOf`](#s-homePortOf)
- called by: [`boardFor`](contracts.js.md#s-boardFor) _js/economy/contracts.js_

<!-- note:chainOffersAt -->
What this port should post right now:
  [{ chain, idx, stage, first, last, of }]
A live chain's pending stage if it is due here; otherwise the openers whose
home port this is and that are not running, finished or cooling off.
<!-- /note -->

### <a id="s-chainState"></a>`chainState(id)`

function · **exported** · L86–86

<!-- note:chainState -->
Is this chain running, and how far in?
<!-- /note -->

### <a id="s-noteChainAccept"></a>`noteChainAccept(a)`

function · **exported** · L88–102

- called by: [`acceptContract`](contracts.js.md#s-acceptContract) _js/economy/contracts.js_

<!-- note:noteChainAccept -->
A stage offer was accepted.
<!-- /note -->

### <a id="s-noteChainDone"></a>`noteChainDone(a)`

function · **exported** · L104–125

- calls: [`chainBonus`](#s-chainBonus) ×2 · [`nextPortFrom`](#s-nextPortFrom) · [`stationById`](../station/stations.js.md#s-stationById) _js/station/stations.js_ ×2
- called by: [`settle`](contracts.js.md#s-settle) _js/economy/contracts.js_

<!-- note:noteChainDone -->
A stage was delivered. Advances the chain and says what happened:
  { chain, idx, last, bonus, standing, nextStationId, nextName, nextTitle }
`bonus`/`standing` are non-zero only on the closing stage; settle() pays them.
<!-- /note -->

### <a id="s-noteChainFail"></a>`noteChainFail(a)`

function · **exported** · L127–135

- called by: [`settle`](contracts.js.md#s-settle) _js/economy/contracts.js_

<!-- note:noteChainFail -->
Abandoned, expired or failed: the chain drops and cools off before it returns.
<!-- /note -->

### <a id="s-chainReport"></a>`chainReport()`

function · **exported** · L137–148

- calls: [`chainBonus`](#s-chainBonus) · [`stationById`](../station/stations.js.md#s-stationById) _js/station/stations.js_
- called by: [`playReport`](../aria/play.js.md#s-playReport) _js/aria/play.js_ ×2 · [`senseBoard`](../aria/senses.js.md#s-senseBoard) _js/aria/senses.js_ · [`renderDesk`](../ui/boardview.js.md#s-renderDesk) _js/ui/boardview.js_

<!-- note:chainReport -->
For the console and the board: every chain running, with where it stands.
<!-- /note -->

### <a id="s-resetChains"></a>`resetChains()`

function · **exported** · L150–156

- called by: [`resetContracts`](contracts.js.md#s-resetContracts) _js/economy/contracts.js_

<!-- note:resetChains -->
<!-- /note -->

### <a id="s-wireChains"></a>`wireChains()`

function · **exported** · L158–160

- called by: [`wireContracts`](contracts.js.md#s-wireContracts) _js/economy/contracts.js_

<!-- note:wireChains -->
<!-- /note -->
