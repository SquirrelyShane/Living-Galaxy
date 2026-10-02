# js/npc/crewfx.js

[index](../../../README.md) · 91 lines · 12 symbols · 7 imports · 6 importers

## About

<!-- note:@file -->
LIVING GALAXY experimental — the crew trims the hull.

The deck plan already knows where everyone works. This turns that into
numbers: a hand at their station during their shift multiplies into
`ship.mods` through the same bag race and specialisation use, scaled by
morale (a sour hand at a console is barely a hand). The rota is the deck's
— station → mess → quarters, 270 s a phase — so the trim breathes with the
watch: the night shift is real.

An empty Engineering while anyone at all is on the payroll is a penalty,
not a zero — clamps and coolant do not tend themselves.

What a manned station does (at 100 morale):
  eng        warp ×0.90, hull ×1.05
  sensor     scan ×1.10, lock ×1.06
  sec        turret ×1.10, menace ×0.92
  med        life ×0.90
  cargo      cargo ×1.06
  office     sell ×1.03, buy ×0.97
  bridge     lock ×1.05
  the hull's own industry, manned by its own trade:
             mine ×1.12 (extraction hulls) or sell ×1.04 (the rest)
  agri/lab   life ×0.95 / scan ×1.04

Robots (m.robot) stand every watch at 0.5 + condition/200 and drop out when
idle; bonds.bondFactor scales a hand by who shares the post; duties.js runs
the wear model and its bag is multiplied in before setCrewMods.

- L9 · `export const ROTA = 270;` — keep in step with interior.js
<!-- /note -->

## Imports

| line | from | names | target |
|---|---|---|---|
| 1 | `../crew/ledger.js` | `crew` | [js/crew/ledger.js](../crew/ledger.js.md) |
| 2 | `../interior/deckplan.js` | `hullPlan`, `stationRoomFor` | [js/interior/deckplan.js](../interior/deckplan.js.md) |
| 3 | `../ships/shipdb.js` | `shipById` | [js/ships/shipdb.js](../ships/shipdb.js.md) |
| 4 | `../flight/pilot.js` | `setCrewMods` | [js/flight/pilot.js](../flight/pilot.js.md) |
| 5 | `../careers/effects.js` | `MOD_KEYS`, `defaultMods` | [js/careers/effects.js](../careers/effects.js.md) |
| 6 | `../crew/bonds.js` | `bondFactor` | [js/crew/bonds.js](../crew/bonds.js.md) |
| 7 | `../crew/duties.js` | `duties`, `tickDuties`, `dutyBag` | [js/crew/duties.js](../crew/duties.js.md) |

## Imported by

- [js/crew/duties.js](../crew/duties.js.md) — `shiftPhase`
- [js/crew/hull.js](../crew/hull.js.md) — `shiftPhase`
- [js/crew/roster.js](../crew/roster.js.md) — `shiftPhase`
- [js/interior/interior.js](../interior/interior.js.md) — `crewEffects`, `shiftPhase`
- [js/sim/sim.js](../sim/sim.js.md) — `crewEffects`, `updateCrewMods`
- test/crew-life.test.mjs _(outside js/)_ — `crewEffects`, `shiftPhase`

## Exports

- [`ROTA`](#s-ROTA) · const — **no importer in scanned roots**
- [`shiftPhase`](#s-shiftPhase) · function — used by [js/crew/duties.js](../crew/duties.js.md), [js/crew/hull.js](../crew/hull.js.md), [js/crew/roster.js](../crew/roster.js.md), [js/interior/interior.js](../interior/interior.js.md), test/crew-life.test.mjs
- [`crewEffects`](#s-crewEffects) · function — used by [js/interior/interior.js](../interior/interior.js.md), [js/sim/sim.js](../sim/sim.js.md), test/crew-life.test.mjs
- [`updateCrewMods`](#s-updateCrewMods) · function — used by [js/sim/sim.js](../sim/sim.js.md)

## Effects

_none detected_

## Symbols

### <a id="s-ROTA"></a>`ROTA`

const · **exported** · L9–9

<!-- note:ROTA -->
<!-- /note -->

### <a id="s-hash"></a>`hash(s)`

function · L11–15

- called by: [`shiftPhase`](#s-shiftPhase)

<!-- note:hash -->
<!-- /note -->

### <a id="s-shiftPhase"></a>`shiftPhase(memberId, time)`

function · **exported** · L17–20

- calls: [`hash`](#s-hash)
- called by: [`tickDuties`](../crew/duties.js.md#s-tickDuties) _js/crew/duties.js_ · [`playerHull.phaseOf`](../crew/hull.js.md#s-playerHull-phaseOf) _js/crew/hull.js_ · [`roster`](../crew/roster.js.md#s-roster) _js/crew/roster.js_ · [`tickWalkers`](../interior/interior.js.md#s-tickWalkers) _js/interior/interior.js_ · [`crewEffects`](#s-crewEffects)

<!-- note:shiftPhase -->
Which shift phase a member is in at `time`: 0 station, 1 mess, 2 quarters. Deterministic — the deck's walkers use it too.
<!-- /note -->

### <a id="s-STATION_FX"></a>`STATION_FX`

const · L22–32

<!-- note:STATION_FX -->
station-kind → effect at full morale
<!-- /note -->

### <a id="s-EXTRACTION"></a>`EXTRACTION`

const · L33–33

<!-- note:EXTRACTION -->
<!-- /note -->

### <a id="s-UNMANNED_ENG"></a>`UNMANNED_ENG`

const · L34–34

<!-- note:UNMANNED_ENG -->
<!-- /note -->

### <a id="s-planCache"></a>`planCache`

const · L36–36

<!-- note:planCache -->
<!-- /note -->

### <a id="s-lastBag"></a>`lastBag`

const · L37–37

<!-- note:lastBag -->
<!-- /note -->

### <a id="s-lastAt"></a>`lastAt`

const · L38–38

<!-- note:lastAt -->
<!-- /note -->

### <a id="s-strengthOf"></a>`strengthOf(m)`

function · L40–43

- called by: [`crewEffects`](#s-crewEffects)

<!-- note:strengthOf -->
How much of a hand is at the console: morale for people, condition for machines. 0.5 … 1.0
<!-- /note -->

### <a id="s-crewEffects"></a>`crewEffects(hullId, seed, time)`

function · **exported** · L45–82

- calls: [`defaultMods`](../careers/effects.js.md#s-defaultMods) _js/careers/effects.js_ · [`bondFactor`](../crew/bonds.js.md#s-bondFactor) _js/crew/bonds.js_ · [`hullPlan`](../interior/deckplan.js.md#s-hullPlan) _js/interior/deckplan.js_ · [`stationRoomFor`](../interior/deckplan.js.md#s-stationRoomFor) _js/interior/deckplan.js_ · [`shiftPhase`](#s-shiftPhase) · [`strengthOf`](#s-strengthOf) · [`shipById`](../ships/shipdb.js.md#s-shipById) _js/ships/shipdb.js_ ×2
- via [js/careers/effects.js](../careers/effects.js.md): `MOD_KEYS.includes`
- called by: [`paintRail`](../interior/interior.js.md#s-paintRail) _js/interior/interior.js_ · [`updateCrewMods`](#s-updateCrewMods)

<!-- note:crewEffects -->
The composed crew bag, plus a manning report for the deck rail. Cached ~2 s.
Two passes: first collect who is at which post (kind → first names, and
kind → ids for bonds.bondFactor), then price each hand knowing who stands
beside them — a friend on the same watch is worth more, a rival less.

- L52 · `const manned = new Map();` — kind → [first names]
- L53 · `const mannedIds = new Map();` — kind → [member ids]
- L56 · `if (m.idle) continue;` — a robot below service condition
- L57 · `if (!m.robot && shiftPhase(m.id, time) !== 0) continue;` — machines stand every watch
- L59 · `const kind = STATION_FX[room.kind] ? room.kind : room.industrial ? "industry" : room.kind;` — an industrial room still IS its kind — a manned Reactor Hall is a manned Engineering
- L77 · `if (crew.aboard.length > 0 && !manned.has("eng") && plan.rooms.some((r) => r.kind === "eng` — nobody minding the reactor while a crew is aboard
<!-- /note -->

### <a id="s-updateCrewMods"></a>`updateCrewMods(hullId, seed, time)`

function · **exported** · L84–91

- calls: [`dutyBag`](../crew/duties.js.md#s-dutyBag) _js/crew/duties.js_ · [`tickDuties`](../crew/duties.js.md#s-tickDuties) _js/crew/duties.js_ · [`setCrewMods`](../flight/pilot.js.md#s-setCrewMods) _js/flight/pilot.js_ · [`crewEffects`](#s-crewEffects)

<!-- note:updateCrewMods -->
Called from the sim's career step (~every 2 s). Runs the duty model, then
pushes the crew bag × the duty bag into pilot.mods via pilot.setCrewMods.
<!-- /note -->
