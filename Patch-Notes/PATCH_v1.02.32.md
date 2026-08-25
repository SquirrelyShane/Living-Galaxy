# PATCH v1.02.32 — "Shipping Lanes"

Four faults reported off the device, all of them in the layer the executive career spends
its whole time watching: what the contracted fleet is actually doing. Schema stays **17**.

Every one of these was live under a green suite, because every existing check asserted that
an objective *produced* — kilograms delivered, credits earned — and none asserted how the
ship behaved on the way. `test/lanes.mjs` is the suite that asks the second question.

---

## "Ships only warp about halfway to the target"

They were not stopping. They were arriving on a timescale nothing measures.

The bubble collapses at `dropOut` = 1,400 units. A station-to-station hop in Solaris is
often around 3,000. So the hull warped for roughly half the trip, dropped out — and then
covered the remaining 1,400 units at `u.speed * transitBoost`, which for a hauler is about
**15 units per second**. Ninety seconds of visibly sitting beside nothing, at the exact
moment the player is watching to see whether the order worked.

Measured on the old code, one leg:

```
20s  approaching Trade Platform · 1290u
40s  approaching Trade Platform ·  975u     ← 15.75 u/s
60s  approaching Trade Platform ·  659u
```

Replaced the cliff with a decel ramp. Approach speed is proportional to the distance left,
floored at cruise so the last few units still close and capped at warp speed so it can never
exceed the bubble it just left:

```js
const want = min(warpSpeed, max(cruiseSpeed, d * WORK.decel))
```

`decel` is 1.2/s, so drop-out to arrival is about **2.3 seconds** — the integral of a
proportional decel, `ln(1400/90)/1.2`. The suite asserts that closing time as arithmetic on
the declared constants, so a future tuning pass cannot quietly put the crawl back.

New: `WORK.decel`, `WORK.arriveAt` (90 units). `dropOut` keeps its old job — it is where the
bubble collapses — and is no longer also the arrival test.

## "It says the hauler is docked while it's travelling"

`undockHull()` was called from exactly one place in the codebase: the miner's own
`docked → clear → spool` phase ladder. Every other objective — logistics, patrol, escort,
survey, station-keep — flew its hull across the system with `u.dockedAt` still set from the
day it was commissioned.

That flag is not cosmetic. It is what the roster, the Ops fleet card and the executive deck
all read to print "docked · Fortress Omega"; it is what holds the ship out of the world's
collision and combat passes; and it is what keeps the mesh hidden. So the hauler was
**invisible on the nav map** for its entire working life as well as mislabelled.

One line, in `travel()` — the function every cross-system leg already goes through:

```js
if (u.dockedAt) { undockHull(ship, u); order.leg = 'clearing the pad'; }
```

Anything about to cross open space is by definition not on a pad. Put there rather than in
each step function so the next order type added inherits it.

## "The hauler only visits Fortress Omega and the Foundry"

Two separate causes, and they compounded.

**`bestMarket` was a pure argmax** over a price field that drifts slowly, so it re-elected
the same winner every single run. Added a recency term: the last three endpoints this
objective used score lower, hardest against the most recent. It is a *tiebreak*, not a ban —
a station genuinely paying more still wins, it just has to actually be worth the repeat.
`bestSource` gets the same treatment, and the memory lives on the order rather than on the
hull, so an objective reassigned to a different ship does not inherit the last one's habits.

**Passive objectives were expiring on a clock they should not have had.** `passive` means
"until recalled", and it said so in every description — but only extraction was telling the
truth, because extraction declares `defaultDurationSec: 0`. Every other type carried a
default, so a passive logistics run completed itself after ninety seconds. The hauler got
*one round trip* and stopped. It was never alive long enough to pick a third berth.

An explicitly requested duration still wins — "hold this passively for 45 seconds" is a
coherent instruction and the caller meant it. What passive suppresses is the type's default.

Measured over 1,000 seconds on the same seed:

| | before | after |
|---|---|---|
| deliveries | 1 | **49** |
| distinct berths used | 2 | **6** |

## "It says I have 2 crew, but I picked Executive"

`initCrew()` issues an engineer and a helm officer. They are *ship's* crew — they exist
because a pilot cannot run a reactor and fly at the same time. A founder standing on an
office deck was being issued both, for a ship that does not exist, and then paying them and
feeding them: real payroll, real rations drawn from stock.

Two places, because of an ordering problem worth naming. `initCrew()` comes up with the
world, which on a new game is **before** the player has chosen who they are — so it is not
enough to refuse at creation, and not enough to refuse at boot either:

- `initCrew()` asks `canPilot()` and stands the roster down if the answer is no. This covers
  a *loaded* save, where the character already exists.
- `createCharacter()` calls `clearCrew()` for a shipless career. This covers a new game,
  where the crew was issued before the career was picked.

The rule is the capability from v1.02.31, not a career test, and it is not a one-way door:
switching a character back to a flying career re-arms the roster.

---

## Files touched

**New**

- `test/lanes.mjs` — 30 checks

**Changed**

- `src/systems/fleet-work.js` — the decel ramp, the undock in `travel()`, route recency in
  `bestMarket` / `bestSource`, `WORK.decel` / `arriveAt` / `routeMemory` / `routePenalty`
- `src/systems/orders.js` — passive suppresses the type's default clock
- `src/systems/crew.js` — `initCrew()` asks `canPilot()`; new `clearCrew()`
- `src/systems/character.js` — a shipless career stands its crew down
- `src/core/version.js` — 1.02.32 "Shipping Lanes"
- `test/all.mjs` — registers `lanes`
- `CHANGELOG.md`, `docs/EXECUTIVE_ARC.md`

## Verified

`node test/all.mjs` — **44/44 suites green**, 53.7 s.

- `lanes` 30/30 — the ramp asserted as arithmetic on the declared constants *and* end to end
  as an arrival deadline; a hull off the pad within one tick and never reporting docked
  while its position is changing; ≥4 distinct berths over 900 s with a bounded route memory;
  passive carrying no clock while an explicit duration survives; and the crew rule across
  four career switches including the boot-order case.
- One existing assertion moved: `command`'s "the duration override took" was passing
  `durationSec: 45` *with* `mode: 'passive'`. It was right to fail on the first cut of the
  passive fix, and it is what produced the explicit-wins rule above.

## Not verified — staged, not measured

- **The recency penalty is 26 credits-equivalent, chosen by feel.** It produces 6 berths over
  900 s on seed 20260814. It has not been swept across seeds, and a market whose spread is
  narrower than 26 credits will effectively route at random.
- **`decel` 1.2 is tuned to look right in a log, not on a screen.** The arrival should read
  as a ship slowing down; nobody has watched one do it.
- Patrol, escort, survey and station-keep all get the undock fix for free, but only logistics
  is exercised end to end here.

## Next

**.33 — "Cartographer"**: fully procedural system generation. Seed decides planet count,
station count, orbits, belts and star class. That one moves the schema and needs a
name-migration path for saves that reference bodies by name.
