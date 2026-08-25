# PATCH v1.01.99 — "Forge Intake"

The Station Forge port, brought in properly and **deliberately not wired**. `world/system.js`
still builds stations out of boxes; nothing on screen changes. Schema stays **17**.

The two files had been dropped into `src/world/` and were sitting there unimported. This patch
makes them part of the project rather than beside it: one rng, a mapping declared where station
classes live, a test suite with the output pinned, and the generator's cost cut by a third.
The slice that swaps the geometry in — "Landfall" — is next, and is a separate risk.

---

## One generator, not two

`station-forge.js` shipped with its own `mulberry32` and `hashSeed` (lines 19–34), duplicating
`core/rng.js`. That is the drift bucket E was added for, and it matters more here than usual:
a shared galaxy works because every client seeded the same builds the identical Solaris
without anything crossing the wire. A second rng is a second thing that has to stay in step
for that to hold.

It now imports both from core. **This changes which station a given seed produces** — the two
hash functions are different algorithms and the two mulberry variants differ in their first
step. Taken deliberately, now, while nothing persists a layout and nothing renders one. After
this it is locked by the golden signatures below.

New seam, `layoutForStation(st, type)`, seeds from the world seed and the station's own name:

```js
seed: 'station|' + st.name + '|' + (worldSeed() >>> 0).toString(36)
```

so adding a station to the roster cannot change the layout of the ones already in it — the
same property named streams were added to `core/rng.js` for. Asserted in the suite by
generating the other ten stations in between and checking the first one has not moved.

## The mapping lives with the station classes

The forge speaks military/trade/research/mining/habitat/pirate/derelict; the game speaks
economic/military/industrial/logistics/civilian/pirate. Rather than a translation table in
`world/`, each entry in `STATION_TYPES` now carries `forge` and `forgeSize`, next to the `cat`
and `size` it already had. One place changes when a class is added.

Two classes may share an archetype at different scales — a refinery and a foundry are both
`mining` at 3 and 4. `relay` is the one class with no good match and takes the smallest
`research` layout. `derelict` has no class at all, which is a gap in the roster rather than in
the mapping, and the suite asserts that it is *the only* unused archetype so the next one
added has to be a decision.

## A third off the generator

Measured before touching anything: **45 ms per layout**, 25 ms at size 1 rising to 79 ms at
size 5. Eleven stations at boot is half a second of blocked main thread, against a frame
budget measured at 0.245 ms in v1.01.95.

Profiled rather than guessed. `hulls()` was 19% of self time — recomputed for every
already-placed module on every collision test, **56,860 calls per layout for 84 modules**.
`openPorts()` rebuilt the frontier and allocated a fresh world-space point for every port of
every module on each of a few thousand growth iterations, which was most of the 12% spent in
GC. The growth weight table was rebuilt from an object literal every iteration — eleven
numbers, three of which ever change.

Three caches: hulls and port positions keyed on the pose they were computed for, and the
weight tables hoisted and mutated in place. **45 ms → 28.6 ms, 36% faster**, and the output is
byte-identical — verified on module id, key, x, z, rot and links at six decimal places across
7 archetypes × 3 sizes × 6 seeds before the rng change went in.

Two things the caches had to respect, both now written down in the file: `openPorts` returns
an array the seeded rng picks from, so **its order is part of the seed contract**; and the
editor verbs *do* move modules, which is why the caches key on pose rather than assuming
nothing ever moves.

31 ms per layout in-tree, 344 ms for the roster. Still too much for boot — Landfall generates
lazily, in a worker.

## The split that did not survive contact

The plan was to move the editor verbs into `world/station-edit.js` on the grounds that nothing
calls them. Doing it broke immediately: `generateLayout` calls `ensureBerths`, which calls
`attachPoints`, `canPlace`, `placeModule` and `refreshLayout`. They are not an unused editor —
they are the placement machinery generation itself runs on, and a station gets its docking arms
by the same path a player would extend one.

So one file, and a narrower honest claim. Of the editing surface, the six with no possible
caller are the **player's** half: `moveModule`, `removeModule`, `cycleModulePort`,
`fittingKeys`, `snapshotGraph`, `restoreGraph`. Those are in `BACKLOG` now, with the thing to
settle before any of them gets a button: an edited layout is no longer derivable from its
seed, so it becomes save state and the schema moves.

`generateLayout` and `layoutForStation` are on the backlog too, because the module genuinely
is not imported yet. Landfall removes those two lines, and this check is what fails if it
forgets to.

## The audit could not see a whole export style

Registering the first module in the project that uses a trailing `export { a, b, c }` list
made `test/reachability.mjs` report all thirteen verbs as stale registry entries. Its export
detector only knew `export function` and `export const`. Any module written that way has been
invisible to the registry check — there were none before today, so nothing was missed, but the
hole was real and is closed.

## `test/forge.mjs` — and why it pins output rather than only properties

A layout is pure data derived from a seed, so a refactor can change **every station in the
galaxy** without moving a single property-based assertion: still valid, still connected, still
has berths. The golden signatures pin the actual output for seven archetype/size pairs, so an
accidental reorder of a draw fails loudly and a deliberate change has to be re-recorded on
purpose — with a line in the patch note, because everything anyone ever screenshotted just
changed shape.

Sixteen checks: the mapping is complete and its one gap is named; every archetype × size
validates, docks, has compartments and decks, and has nothing floating free of the graph; the
real Solaris roster builds and a relay stays smaller than a habitat ring; same seed twice
agrees, different seeds differ, and draw order does not leak between stations; a loose cost
ceiling that would catch a regression of the order the caches removed without asserting a
performance number on whatever box is free.

## Files touched

| file | change |
|---|---|
| `src/world/station-forge.js` | rng from `core/rng.js`; `layoutForStation()` seam; three caches; export surface split into public and editing halves with the reasoning |
| `src/data/stations.js` | `forge` and `forgeSize` per station class |
| `test/forge.mjs` | **new** — 16 checks including seven golden signatures |
| `test/all.mjs` | registers `forge` |
| `test/reachability.mjs` | export detector understands `export { }` lists; forge verbs registered; eight backlog entries |
| `src/core/version.js`, `package.json` | v1.01.99 "Forge Intake" |

## Verified

- `node test/all.mjs` — **42/42 suites green, 3,302 checks** (99 s).
- `node test/reachability.mjs` — 80 checks, backlog accurate, inert set still the six.
- The 36% optimisation was proved output-identical against the unmodified prototype across 126
  archetype/size/seed combinations *before* the rng change; the rng change is what altered
  layouts, and it altered them once.
- The whole Solaris roster generates: eleven layouts, all valid, each keeping its own name.

## Not verified

- **Nothing renders.** No geometry was swapped in, no LOD level registered, no berth wired to
  docking. `system.js:300`'s comment that stations have no geometry levels is still true, and
  Landfall is what makes it false.
- **31 ms per layout is still too slow for boot** — 344 ms for the roster. The fix is lazy
  generation in a worker, and it is Landfall's problem, not solved here.
- **The interior mesh has never been drawn.** `station-mesh.js` is untouched by this patch and
  still unimported; ~84 meshes per station at ~11 materials is a merge waiting to happen.
- **No panel was opened on a phone.** Seven slices now.
