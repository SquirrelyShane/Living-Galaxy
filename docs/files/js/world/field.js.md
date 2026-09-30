# js/world/field.js

[index](../../../README.md) · 303 lines · 47 symbols · 4 imports · 20 importers

## About

<!-- note:@file -->
LIVING GALAXY — procedural asteroid field.

The belt is hundreds of thousands of units wide, so we never build it all.
Space is diced into cells; each cell deterministically hashes out its own
rocks. Fly away and back and the same rocks are in the same places. Mined
rocks are remembered by key so they stay gone.

- L144 · `const _cells = new Map();` — "cx,cy,cz" → { at, rocks }: the cell, and the time its wobble is for
- L147 · `const RING = 24;` — distinct live queries per tick before reuse
- L151 · `const _memo = new Map();` — query key → the ring array holding its answer
- L154 · `siteHooks.onChange = () => forgetRocks();` — opening or closing a site changes what the cells hold: drop the caches
- L248 · `const markSkip = new Map();` — rock key → sky time the skip lapses
<!-- /note -->

## Imports

| line | from | names | target |
|---|---|---|---|
| 1 | `./bodies.js` | `currentSystem` | [js/world/bodies.js](bodies.js.md) |
| 2 | `../economy/materials.js` | `ORES` | [js/economy/materials.js](../economy/materials.js.md) |
| 3 | `../bodygen/classes.js` | `classFor`, `classOre` | [js/bodygen/classes.js](../bodygen/classes.js.md) |
| 4 | `../economy/sites.js` | `siteRocksInCell`, `siteHooks`, `classForOre`, `siteRocks`, `siteRockBase` | [js/economy/sites.js](../economy/sites.js.md) |

## Imported by

- [js/aria/senses.js](../aria/senses.js.md) — `nearbyRocks`, `inBelt`, `depleted`
- [js/console/panels/nav.js](../console/panels/nav.js.md) — `nearbyRocks`, `inBelt`
- [js/drones/npcdrones.js](../drones/npcdrones.js.md) — `nearbyRocks`, `wearRock`, `depleted`
- [js/drones/ops.js](../drones/ops.js.md) — `nearbyRocks`, `wearRock`, `depleted`, `CELL`
- [js/flight/autopilot.js](../flight/autopilot.js.md) — `inBelt`, `nearbyRocks`, `beltExit`, `siteMarkRock`, `skipMarkRock`
- [js/flight/avoid.js](../flight/avoid.js.md) — `nearbyRocks`
- [js/flight/probes.js](../flight/probes.js.md) — `bandAt`, `BAND_METAL`, `BAND_CARBON`, `CELL`, `inBelt`, `nearbyRocks`
- [js/flight/turrets.js](../flight/turrets.js.md) — `nearbyRocks`, `wearRock`
- [js/mission/run.js](../mission/run.js.md) — `inBelt`
- [js/npc/captain.js](../npc/captain.js.md) — `inBelt`, `nearbyRocks`
- [js/npc/ground.js](../npc/ground.js.md) — `nearbyRocks`, `bandNameAt`
- [js/render/engine.js](../render/engine.js.md) — `inBelt`, `nearbyRocks`, `brokenRocks`
- [js/sim/sim.js](../sim/sim.js.md) — `eatRocks`, `inBelt`, `nearbyRocks`, `resetField`, `rockByKey`, `siteMarkRock`
- [js/ui/tutorial.js](../ui/tutorial.js.md) — `nearbyRocks`
- test/avoid.test.mjs _(outside js/)_ — `inBelt`, `beltExit`, `aboveBelt`, `BELT_HALF_HEIGHT`, `nearbyRocks`
- test/chart.test.mjs _(outside js/)_ — `inBelt`, `nearbyRocks`, `CELL`
- test/ground.test.mjs _(outside js/)_ — `nearbyRocks`
- test/marks.test.mjs _(outside js/)_ — `rockByKey`, `siteMarkRock`, `wearRock`, `depleted`, `nearbyRocks`
- test/sites.test.mjs _(outside js/)_ — `nearbyRocks`, `depleted`, `wearRock`, `inBelt`, `CELL`
- test/systems.test.mjs _(outside js/)_ — `nearbyRocks`, `bandNameAt`

## Exports

- [`BAND_METAL`](#s-BAND_METAL) · const — used by [js/flight/probes.js](../flight/probes.js.md)
- [`BAND_STONE`](#s-BAND_STONE) · const — **no importer in scanned roots**
- [`BAND_CARBON`](#s-BAND_CARBON) · const — used by [js/flight/probes.js](../flight/probes.js.md)
- [`VEIN_ORES`](#s-VEIN_ORES) · const — **no importer in scanned roots**
- [`ICE_ORES`](#s-ICE_ORES) · const — **no importer in scanned roots**
- [`pickOre`](#s-pickOre) · function — **no importer in scanned roots**
- [`CELL`](#s-CELL) · const — used by [js/drones/ops.js](../drones/ops.js.md), [js/flight/probes.js](../flight/probes.js.md), test/chart.test.mjs, test/sites.test.mjs
- [`BELT`](#s-BELT) · const — **no importer in scanned roots**
- [`BELT_HALF_HEIGHT`](#s-BELT_HALF_HEIGHT) · const — used by test/avoid.test.mjs
- [`depleted`](#s-depleted) · const — used by [js/aria/senses.js](../aria/senses.js.md), [js/drones/npcdrones.js](../drones/npcdrones.js.md), [js/drones/ops.js](../drones/ops.js.md), test/marks.test.mjs, test/sites.test.mjs
- [`icyAt`](#s-icyAt) · function — **no importer in scanned roots**
- [`bandAt`](#s-bandAt) · function — used by [js/flight/probes.js](../flight/probes.js.md)
- [`bandNameAt`](#s-bandNameAt) · function — used by [js/npc/ground.js](../npc/ground.js.md), test/systems.test.mjs
- [`veinAt`](#s-veinAt) · function — **no importer in scanned roots**
- [`rocksInCell`](#s-rocksInCell) · function — **no importer in scanned roots**
- [`nearbyRocks`](#s-nearbyRocks) · function — used by [js/aria/senses.js](../aria/senses.js.md), [js/console/panels/nav.js](../console/panels/nav.js.md), [js/drones/npcdrones.js](../drones/npcdrones.js.md), [js/drones/ops.js](../drones/ops.js.md), [js/flight/autopilot.js](../flight/autopilot.js.md), [js/flight/avoid.js](../flight/avoid.js.md), [js/flight/probes.js](../flight/probes.js.md), [js/flight/turrets.js](../flight/turrets.js.md), [js/npc/captain.js](../npc/captain.js.md), [js/npc/ground.js](../npc/ground.js.md), [js/render/engine.js](../render/engine.js.md), [js/sim/sim.js](../sim/sim.js.md), [js/ui/tutorial.js](../ui/tutorial.js.md), test/avoid.test.mjs, test/chart.test.mjs, test/ground.test.mjs, test/marks.test.mjs, test/sites.test.mjs, test/systems.test.mjs
- [`rockByKey`](#s-rockByKey) · function — used by [js/sim/sim.js](../sim/sim.js.md), test/marks.test.mjs
- [`siteMarkRock`](#s-siteMarkRock) · function — used by [js/flight/autopilot.js](../flight/autopilot.js.md), [js/sim/sim.js](../sim/sim.js.md), test/marks.test.mjs
- [`skipMarkRock`](#s-skipMarkRock) · function — used by [js/flight/autopilot.js](../flight/autopilot.js.md)
- [`markSkipped`](#s-markSkipped) · function — **no importer in scanned roots**
- [`beltExit`](#s-beltExit) · function — used by [js/flight/autopilot.js](../flight/autopilot.js.md), test/avoid.test.mjs
- [`aboveBelt`](#s-aboveBelt) · function — used by test/avoid.test.mjs
- [`inBelt`](#s-inBelt) · function — used by [js/aria/senses.js](../aria/senses.js.md), [js/console/panels/nav.js](../console/panels/nav.js.md), [js/flight/autopilot.js](../flight/autopilot.js.md), [js/flight/probes.js](../flight/probes.js.md), [js/mission/run.js](../mission/run.js.md), [js/npc/captain.js](../npc/captain.js.md), [js/render/engine.js](../render/engine.js.md), [js/sim/sim.js](../sim/sim.js.md), test/avoid.test.mjs, test/chart.test.mjs, test/sites.test.mjs
- [`brokenRocks`](#s-brokenRocks) · const — used by [js/render/engine.js](../render/engine.js.md)
- [`wearRock`](#s-wearRock) · function — used by [js/drones/npcdrones.js](../drones/npcdrones.js.md), [js/drones/ops.js](../drones/ops.js.md), [js/flight/turrets.js](../flight/turrets.js.md), test/marks.test.mjs, test/sites.test.mjs
- [`eatRocks`](#s-eatRocks) · function — used by [js/sim/sim.js](../sim/sim.js.md)
- [`resetField`](#s-resetField) · function — used by [js/sim/sim.js](../sim/sim.js.md)

## Effects

_none detected_

## Symbols

### <a id="s-ASTEROID_ORES"></a>`ASTEROID_ORES`

const · L6–6

- via [js/economy/materials.js](../economy/materials.js.md): `ORES.filter`

<!-- note:ASTEROID_ORES -->
<!-- /note -->

### <a id="s-byIds"></a>`byIds(...ids)`

function · L7–7

- via [js/economy/materials.js](../economy/materials.js.md): `ORES.filter`
- called by: [`BAND_CARBON`](#s-BAND_CARBON) · [`BAND_METAL`](#s-BAND_METAL) · [`BAND_STONE`](#s-BAND_STONE) · [`VEIN_ORES`](#s-VEIN_ORES)

<!-- note:byIds -->
<!-- /note -->

### <a id="s-BAND_METAL"></a>`BAND_METAL`

const · **exported** · L8–8

- calls: [`byIds`](#s-byIds)

<!-- note:BAND_METAL -->
The belt is not one country. Sunward rim: differentiated cores, the heavy
stuff. The broad middle: stony commons. The cold outer fifth: carbon and
frost. Weighted by abundance inside each band.
<!-- /note -->

### <a id="s-BAND_STONE"></a>`BAND_STONE`

const · **exported** · L9–9

- calls: [`byIds`](#s-byIds)

<!-- note:BAND_STONE -->
<!-- /note -->

### <a id="s-BAND_CARBON"></a>`BAND_CARBON`

const · **exported** · L10–10

- calls: [`byIds`](#s-byIds)

<!-- note:BAND_CARBON -->
<!-- /note -->

### <a id="s-VEIN_ORES"></a>`VEIN_ORES`

const · **exported** · L11–11

- calls: [`byIds`](#s-byIds)

<!-- note:VEIN_ORES -->
Veins: the rare rich pocket a prospector calls in. One uncommon ore owns the cell.
<!-- /note -->

### <a id="s-ICE_ORES"></a>`ICE_ORES`

const · **exported** · L12–12

- via [js/economy/materials.js](../economy/materials.js.md): `ORES.filter`

<!-- note:ICE_ORES -->
Past the frost line the belt is a different country: dirty snowballs, not
stone. Weighted by abundance so water ice dominates and clathrates are the
find worth calling in.
<!-- /note -->

### <a id="s-pickOre"></a>`pickOre(table, h)`

function · **exported** · L14–22

- called by: [`cellRocks`](#s-cellRocks)

<!-- note:pickOre -->
Abundance-weighted pick from an ore table, off one hash. Exported for tests.
<!-- /note -->

### <a id="s-ORE_BY_ID"></a>`ORE_BY_ID`

const · L24–24

- via [js/economy/materials.js](../economy/materials.js.md): `ORES.map`

<!-- note:ORE_BY_ID -->
<!-- /note -->

### <a id="s-CELL"></a>`CELL`

const · **exported** · L26–26

<!-- note:CELL -->
<!-- /note -->

### <a id="s-BELT"></a>`BELT`

const · **exported** · L28–28

<!-- note:BELT -->
0.3.58 — a belt is mostly empty, and mostly rock.

Reported: too many asteroids, and mining alone made you rich. Measured on
0.3.57, a starter hull on the MINE LOOP made 2,641 cr a minute — one hold of
monazite out of a vein cell sold for 28,971 cr — with two to eleven rocks in
every cell of the belt (~330 in reach at once) and a class's headline ore in
nearly every one of them.

  BELT.emptyCell   the share of cells with nothing in them at all
  BELT.perCell     up to this many more rocks in a cell that has any (1 + …)
  BELT.matrix      the share of rocks, by band, that are the belt's MATRIX —
                   silicates and regolith, iron-stone at the sunward rim,
                   carbon rock in the cold — rather than the class's ore
  BELT.veinCells   the share of main-belt cells owned by a rare ore (was 7%)
  BELT.veinShare   …and the share of rocks in one that carry it (was 80%)

A matrix rock is drawn as the class that carries its ore, so the rock you
see is still the rock you cut.
<!-- /note -->

### <a id="s-MATRIX"></a>`MATRIX`

const · L29–33

<!-- note:MATRIX -->
<!-- /note -->

### <a id="s-matrixOre"></a>`matrixOre(band, h)`

function · L34–37

- called by: [`cellRocks`](#s-cellRocks)

<!-- note:matrixOre -->
<!-- /note -->

### <a id="s-BELT_HALF_HEIGHT"></a>`BELT_HALF_HEIGHT`

const · **exported** · L38–38

<!-- note:BELT_HALF_HEIGHT -->
A belt is a DISC, not a cloud: six and a half kilometres thick and hundreds
of thousands wide. That asymmetry is the cheapest way out of the rocks —
climbing is a few seconds, flying to the rim is a journey — so the autopilot
needs the number, not just a boolean.
<!-- /note -->

### <a id="s-depleted"></a>`depleted`

const · **exported** · L40–40

<!-- note:depleted -->
depletion by rock key: 0..1, 1 = mined out
<!-- /note -->

### <a id="s-hash"></a>`hash(x, y, z, salt)`

function · L42–50

- called by: [`cellRocks`](#s-cellRocks) ×7 · [`veinAt`](#s-veinAt) ×2

<!-- note:hash -->
<!-- /note -->

### <a id="s-beltAt"></a>`beltAt(rad)`

function · L52–57

- called by: [`cellRocks`](#s-cellRocks)

<!-- note:beltAt -->
<!-- /note -->

### <a id="s-icyAt"></a>`icyAt(belt, rad, h)`

function · **exported** · L59–64

- called by: [`cellRocks`](#s-cellRocks)

<!-- note:icyAt -->
Is this radius icy? The outer belt always; the main belt's cold outer fifth carries frost pockets.

- L63 · `return edge > 0.8 && h < 0.55;` — frost pockets on the shadowed rim
<!-- /note -->

### <a id="s-bandAt"></a>`bandAt(belt, rad)`

function · **exported** · L66–72

- called by: [`beltBandAt`](../flight/probes.js.md#s-beltBandAt) _js/flight/probes.js_

<!-- note:bandAt -->
The ore table for a non-icy rock at this radius of the main belt.
<!-- /note -->

### <a id="s-bandNameAt"></a>`bandNameAt(belt, rad, ice)`

function · **exported** · L74–81

- called by: [`placeOf`](../npc/ground.js.md#s-placeOf) _js/npc/ground.js_ · [`cellRocks`](#s-cellRocks)

<!-- note:bandNameAt -->
The band as a NAME, which is what the taxonomy needs.

The radial bands from v0.0.4 are still what decides where you are; the
asteroid classes (js/bodygen/classes.js) sit on top, so the sunward rim
offers M, X and E while the cold outer fifth offers C, B, P and D. The rock
then draws its class off its own hash and its ore out of that class's suite,
which is why a rock now looks like what it carries.
<!-- /note -->

### <a id="s-veinAt"></a>`veinAt(cx, cy, cz, belt)`

function · **exported** · L83–89

- calls: [`hash`](#s-hash) ×2
- called by: [`cellRocks`](#s-cellRocks)

<!-- note:veinAt -->
Vein check for a cell: ~3% (BELT.veinCells) of main-belt cells are owned by one uncommon
ore; rocks in them are that ore and cut rich. Deterministic per cell.
<!-- /note -->

### <a id="s-cellRocks"></a>`cellRocks(cx, cy, cz, out)`

function · L91–140

- calls: [`classFor`](../bodygen/classes.js.md#s-classFor) _js/bodygen/classes.js_ · [`classOre`](../bodygen/classes.js.md#s-classOre) _js/bodygen/classes.js_ · [`classForOre`](../economy/sites.js.md#s-classForOre) _js/economy/sites.js_ · [`siteRocksInCell`](../economy/sites.js.md#s-siteRocksInCell) _js/economy/sites.js_ · [`bandNameAt`](#s-bandNameAt) · [`beltAt`](#s-beltAt) · [`hash`](#s-hash) ×7 · [`icyAt`](#s-icyAt) · [`matrixOre`](#s-matrixOre) · [`pickOre`](#s-pickOre) · [`veinAt`](#s-veinAt)
- called by: [`cellCached`](#s-cellCached) · [`rocksInCell`](#s-rocksInCell)

<!-- note:cellRocks -->
- L94 · `siteRocksInCell(cx, cy, cz, CELL, out, depleted);` — 0.3.20: a contract's job site lays its own rocks into whatever the cell
  already grows — the seam the job names, on top of the ordinary belt
- L109 · `const r = 26 + 700 * Math.pow(h4, 2.2);` — heavy tail: mostly gravel, occasionally a mountain
- L110 · `const rad = Math.hypot(bx, bz);` — Composition is fixed by the same hash, so a rock is always the same rock.
- L113 · `const band = bandNameAt(belt, rad, ice);` — the taxonomic class comes off its own hash so it is stable under wear,
  and the headline ore comes out of that class — the rock you can see is
  the rock you will cut, all the way down to the assay
- L117 · `const plain = !ice && !rich && hash(cx * 7 + i, cy * 3 + i, cz, 41) < (BELT.matrix[band] ?` — 0.3.58: most of a belt is its matrix — plain stone — and only the rest
  carries what its class is known for
- L121 · `out.push({` — 0.3.28 — the rock is stored where it BELONGS; the wobble is applied at
  read time (refreshCell). Everything above this line is a pure function
  of the cell, so it is worked out once and kept.
<!-- /note -->

### <a id="s-rocksInCell"></a>`rocksInCell(cx, cy, cz)`

function · **exported** · L142–142

- calls: [`cellRocks`](#s-cellRocks)

<!-- note:rocksInCell -->
One cell's rocks, freshly grown (tests and tools; the game reads the cache).
<!-- /note -->

### <a id="s-_cells"></a>`_cells`

const · L144–144

<!-- note:_cells -->
---- the rock query, and why it is cached twice ---------------------------

A rock is a pure function of (cell, sky time), so the same cell asked for
twice in one tick is the same answer twice. It was asked for a great deal
more than twice: twenty call sites, and within a single tick the engine
wants span 2 at the hull, the turrets want span 1 at the hull, the autopilot
and the avoidance want their own spans, and EVERY work drone and NPC drone
wants span 1 at its own position, which is a different cell each.

The old cache was one array and a one-query memo keyed on
(cell, span, time). With more than one caller live it never hit once — each
query evicted the last — so a belt with a dozen drones in it regenerated the
whole 27-cell neighbourhood a dozen times a substep. And because every
caller got the SAME array back, anyone holding a result across another call
watched it change underneath them (js/flight/turrets.js spreads its result
immediately, which reads like somebody was already bitten by this).

So there are two caches now, and they do different jobs:

  CELL CACHE — the expensive one. One entry per cell, holding that cell's
    rocks, thrown away whole when the sky time moves on. Overlapping queries
    now share their cells instead of each rebuilding them, which is where
    nearly all the saving is: two drones one cell apart share 18 of their 27.

  RESULT RING — the aliasing one. Each query gets its own output array out
    of a small ring, so two callers in the same tick never hold the same
    array. The ring is bounded, so the contract is unchanged and still
    stated on the function: copy it if you mean to keep it.
<!-- /note -->

### <a id="s-_cellsSys"></a>`_cellsSys`

const · L145–145

<!-- note:_cellsSys -->
<!-- /note -->

### <a id="s-RING"></a>`RING`

const · L147–147

<!-- note:RING -->
<!-- /note -->

### <a id="s-_ring"></a>`_ring`

const · L148–148

<!-- note:_ring -->
<!-- /note -->

### <a id="s-i"></a>`i`

const · L149–149

<!-- note:i -->
<!-- /note -->

### <a id="s-_ringAt"></a>`_ringAt`

const · L150–150

<!-- note:_ringAt -->
<!-- /note -->

### <a id="s-_memo"></a>`_memo`

const · L151–151

<!-- note:_memo -->
<!-- /note -->

### <a id="s-_memoAt"></a>`_memoAt`

const · L152–152

<!-- note:_memoAt -->
<!-- /note -->

### <a id="s-forgetRocks"></a>`forgetRocks()`

function · L156–160

- called by: [`@file`](#) · [`eatRocks`](#s-eatRocks) · [`nearbyRocks`](#s-nearbyRocks) · [`resetField`](#s-resetField) · [`wearRock`](#s-wearRock)

<!-- note:forgetRocks -->
<!-- /note -->

### <a id="s-refreshCell"></a>`refreshCell(rocks, time)`

function · L162–170

- called by: [`cellCached`](#s-cellCached)

<!-- note:refreshCell -->
The wobble, and how worn each rock is — the only two things about a rock
that are not a pure function of its cell. Applied once per cell per sky
time, over rocks that already exist.
<!-- /note -->

### <a id="s-cellCached"></a>`cellCached(cx, cy, cz, time)`

function · L172–186

- calls: [`cellRocks`](#s-cellRocks) · [`refreshCell`](#s-refreshCell)
- called by: [`nearbyRocks`](#s-nearbyRocks) · [`rockByKey`](#s-rockByKey)

<!-- note:cellCached -->
One cell's rocks.

0.3.28 — this used to be keyed on the sky time, which meant it threw the
whole belt away and grew it again on every distinct clock value: every
sub-tick, for ever, whether or not anything had changed. Measured at the
hull in a belt, a frame of queries cost 0.70 ms with the clock running and
0.01 ms with it frozen — the cache was worth ninety-three times its keep and
never collected any of it, because in a running game the clock always moves.

A rock's identity — where its cell puts it, how big it is, what class it is,
what ore it holds — does not depend on the clock at all. Only the wobble
does, and how worn it is. So the cell is grown once and kept, and those two
are refreshed over it when the clock moves on.
<!-- /note -->

### <a id="s-nearbyRocks"></a>`nearbyRocks(pos, time, span=)`

function · **exported** · L188–212

- calls: [`cellCached`](#s-cellCached) · [`forgetRocks`](#s-forgetRocks)
- called by: [`senseSpace`](../aria/senses.js.md#s-senseSpace) _js/aria/senses.js_ · [`lockedRock`](../console/panels/nav.js.md#s-lockedRock) _js/console/panels/nav.js_ · [`stepMiner`](../drones/npcdrones.js.md#s-stepMiner) _js/drones/npcdrones.js_ · [`ROLE_STEP.harvester`](../drones/ops.js.md#s-ROLE_STEP-harvester) _js/drones/ops.js_ · [`ROLE_STEP.miner`](../drones/ops.js.md#s-ROLE_STEP-miner) _js/drones/ops.js_ · [`ROLE_STEP.surveyor`](../drones/ops.js.md#s-ROLE_STEP-surveyor) _js/drones/ops.js_ · [`apMine`](../flight/autopilot.js.md#s-apMine) _js/flight/autopilot.js_ · [`threatTo`](../flight/avoid.js.md#s-threatTo) _js/flight/avoid.js_ · [`assayPoint`](../flight/probes.js.md#s-assayPoint) _js/flight/probes.js_ · [`stepMining`](../flight/turrets.js.md#s-stepMining) _js/flight/turrets.js_ · [`snapshot`](../npc/captain.js.md#s-snapshot) _js/npc/captain.js_ · [`claimSurvey`](../npc/ground.js.md#s-claimSurvey) _js/npc/ground.js_ · [`mountGame>updateAsteroids`](../render/engine.js.md#s-mountGame-updateAsteroids) _js/render/engine.js_ · [`candidateSig`](../sim/sim.js.md#s-candidateSig) _js/sim/sim.js_ · [`clearArrival`](../sim/sim.js.md#s-clearArrival) _js/sim/sim.js_ · [`lockCandidates`](../sim/sim.js.md#s-lockCandidates) _js/sim/sim.js_ · [`stepCollisions`](../sim/sim.js.md#s-stepCollisions) _js/sim/sim.js_ · [`stepWarp`](../sim/sim.js.md#s-stepWarp) _js/sim/sim.js_ · [`targetPosition`](../sim/sim.js.md#s-targetPosition) _js/sim/sim.js_ · [`tryAssay`](../sim/sim.js.md#s-tryAssay) _js/sim/sim.js_ · [`buildCtx`](../ui/tutorial.js.md#s-buildCtx) _js/ui/tutorial.js_

<!-- note:nearbyRocks -->
Rocks within `span` cells of a position. Reuses one array — copy if you keep it, never mutate it.

- L200 · `for (const [k, v] of _memo) if (v === out) { _memo.delete(k); break; }` — the ring recycled an array that an earlier query in this same tick is
  still filed under — drop that memo entry so nobody is handed a stale one
<!-- /note -->

### <a id="s-rockByKey"></a>`rockByKey(key, time)`

function · **exported** · L214–230

- calls: [`siteRockBase`](../economy/sites.js.md#s-siteRockBase) _js/economy/sites.js_ · [`cellCached`](#s-cellCached)
- called by: [`r`](../sim/sim.js.md#s-r) _js/sim/sim.js_ · [`siteMarkRock`](#s-siteMarkRock) ×2

<!-- note:rockByKey -->
0.3.67 — one rock by its key, anywhere in the sky, where it is at `time`.
Grows (or reads) only the one cell the key names. null once it is mined out,
the site that laid it has closed, or the key is not a rock's.
<!-- /note -->

### <a id="s-siteMarkRock"></a>`siteMarkRock(siteId, time, prefer=)`

function · **exported** · L232–246

- calls: [`siteRocks`](../economy/sites.js.md#s-siteRocks) _js/economy/sites.js_ · [`markSkipped`](#s-markSkipped) ×2 · [`rockByKey`](#s-rockByKey) ×2
- called by: [`apMine`](../flight/autopilot.js.md#s-apMine) _js/flight/autopilot.js_ ×2 · [`r~2`](../sim/sim.js.md#s-r-2) _js/sim/sim.js_

<!-- note:siteMarkRock -->
0.3.67 — THE rock of a job site: the one its mark sits on and the cutter
goes to first. The biggest rock of the seam that is not mined out — stable
while it lasts, and the mark moves to the next biggest when it is gone.
`prefer` keeps a rock that is still live (the one already marked), so a
mark never jumps while you are cutting it.

- L237 · `let best = null, fallback = null;` — 0.3.68: a rock the cutter gave up on is passed over — unless every rock
  left has been, in which case the biggest of them still carries the mark
<!-- /note -->

### <a id="s-markSkip"></a>`markSkip`

const · L248–248

<!-- note:markSkip -->
0.3.68 — the mark follows the cutter. When the mining loop gives up on a rock
(autopilot.js: 240 s without closing on it), it tells the mark here, for the
same 900 s it leaves the rock alone, so the chart never points at a rock the
loop has stopped working.
<!-- /note -->

### <a id="s-skipMarkRock"></a>`skipMarkRock(key, until)`

function · **exported** · L249–249

- called by: [`apMine`](../flight/autopilot.js.md#s-apMine) _js/flight/autopilot.js_

<!-- note:skipMarkRock -->
<!-- /note -->

### <a id="s-markSkipped"></a>`markSkipped(key, time)`

function · **exported** · L250–256

- called by: [`siteMarkRock`](#s-siteMarkRock) ×2

<!-- note:markSkipped -->
<!-- /note -->

### <a id="s-beltExit"></a>`beltExit(pos, margin=)`

function · **exported** · L258–263

- calls: [`inBelt`](#s-inBelt)
- called by: [`apLeg`](../flight/autopilot.js.md#s-apLeg) _js/flight/autopilot.js_ · [`beginUnstick`](../flight/autopilot.js.md#s-beginUnstick) _js/flight/autopilot.js_

<!-- note:beltExit -->
How far, and which way, to the clean space above or below the belt.

Returns null when there is nothing to climb out of. Otherwise `{ sign, need,
y }`: which way is shorter, how much further there is to go, and the
altitude that is clear. `margin` buys some room above the last rock so we do
not arrive exactly on the boundary and get dragged back in by the next
wobble.
<!-- /note -->

### <a id="s-aboveBelt"></a>`aboveBelt(pos, margin=)`

function · **exported** · L265–267

<!-- note:aboveBelt -->
Is this position clear of the rock layer, wherever it is in the annulus?
<!-- /note -->

### <a id="s-inBelt"></a>`inBelt(pos)`

function · **exported** · L269–276

- called by: [`senseHull`](../aria/senses.js.md#s-senseHull) _js/aria/senses.js_ · [`senseSpace`](../aria/senses.js.md#s-senseSpace) _js/aria/senses.js_ · [`lockedRock`](../console/panels/nav.js.md#s-lockedRock) _js/console/panels/nav.js_ · [`mountSurvey`](../console/panels/nav.js.md#s-mountSurvey) _js/console/panels/nav.js_ · [`atSeam`](../flight/autopilot.js.md#s-atSeam) _js/flight/autopilot.js_ · [`engageMiningLoop`](../flight/autopilot.js.md#s-engageMiningLoop) _js/flight/autopilot.js_ · [`assayPoint`](../flight/probes.js.md#s-assayPoint) _js/flight/probes.js_ · [`EXEC.MINE`](../mission/run.js.md#s-EXEC-MINE) _js/mission/run.js_ ×2 · [`snapshot`](../npc/captain.js.md#s-snapshot) _js/npc/captain.js_ · [`mountGame>audioState`](../render/engine.js.md#s-mountGame-audioState) _js/render/engine.js_ · [`mountGame>updateAsteroids`](../render/engine.js.md#s-mountGame-updateAsteroids) _js/render/engine.js_ · [`clearArrival`](../sim/sim.js.md#s-clearArrival) _js/sim/sim.js_ · [`stepCollisions`](../sim/sim.js.md#s-stepCollisions) _js/sim/sim.js_ · [`stepWarp`](../sim/sim.js.md#s-stepWarp) _js/sim/sim.js_ · [`beltExit`](#s-beltExit)

<!-- note:inBelt -->
<!-- /note -->

### <a id="s-brokenRocks"></a>`brokenRocks`

const · **exported** · L278–278

<!-- note:brokenRocks -->
Rocks that were cut out, newest last, for whoever wants to see them go (the
renderer bursts a grown body into a shatter field). Keys only, bounded: a
queue nobody drains must not grow.
<!-- /note -->

### <a id="s-wearRock"></a>`wearRock(key, amount)`

function · **exported** · L280–291

- calls: [`forgetRocks`](#s-forgetRocks)
- called by: [`stepMiner`](../drones/npcdrones.js.md#s-stepMiner) _js/drones/npcdrones.js_ · [`ROLE_STEP.harvester`](../drones/ops.js.md#s-ROLE_STEP-harvester) _js/drones/ops.js_ · [`ROLE_STEP.miner`](../drones/ops.js.md#s-ROLE_STEP-miner) _js/drones/ops.js_ · [`stepMining`](../flight/turrets.js.md#s-stepMining) _js/flight/turrets.js_

<!-- note:wearRock -->
- L287 · `forgetRocks();` — it is GONE, so the cells that held it have to be grown again without it
- L288 · `return next;` — 0.3.28 — a rock being cut is still the same rock in the same place. This
  used to drop every cached cell on every tick of the cutter, which is sixty
  full rebuilds of the whole neighbourhood a second while you are mining —
  the one moment you are certainly parked next to a rock and looking at it.
  `refreshCell` reads the wear off the same map, so there is nothing to
  invalidate: the number updates itself on the next query.
<!-- /note -->

### <a id="s-eatRocks"></a>`eatRocks(keys)`

function · **exported** · L293–296

- calls: [`forgetRocks`](#s-forgetRocks)

<!-- note:eatRocks -->
A black hole passing through the belt (js/world/events/holes.js) takes whole rocks at a
time. One rock-cache flush for the lot — `wearRock` flushes per call, and a
hole eats hundreds a second. Eaten rocks do not shatter: they fall in.
<!-- /note -->

### <a id="s-resetField"></a>`resetField()`

function · **exported** · L298–303

- calls: [`forgetRocks`](#s-forgetRocks)
- called by: [`loadSky`](../sim/sim.js.md#s-loadSky) _js/sim/sim.js_

<!-- note:resetField -->
<!-- /note -->

## Module-level calls

- calls: [`forgetRocks`](#s-forgetRocks)
