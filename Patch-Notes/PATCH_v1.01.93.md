# PATCH v1.01.93 — "Contract Miner Balancing"

A contracted miner now flies the whole run instead of teleporting to the seam and stalling
there with a full hold. New hulls are parked on a pad. Ships can belong to the company or to
the pilot, and move between them. Schema stays **17**.

---

## The stalled miner

The screenshot was the whole bug report: **Hold 2,344 / 2,600 kg · full · running in to
Trade Platform**, and on the objective directly above it, **0 runs · 0 kg · 0 cr**.

v1.01.92's `extractStep` flew the hull to the belt and then handed the rest of the job to
`minerStep()` in `entities/npcs.js` by setting `u.runningIn` and a berth. That handoff only
works while the world is stepping the NPC — which it does near the player. A company miner
working a belt 11 Mm from its owner stopped being stepped the moment the owner left. Nothing
was moving it, and nothing ever would.

**A ship the company pays upkeep on has to work whether or not anyone is watching it.** So
the whole cycle lives in `fleet-work.js` now, owns its own movement, and never depends on
proximity:

```
docked → undock → clear the pad → spool → warp → approach the seam → cut
       → break off → spool → warp → approach → match → dock → transfer → hold or repeat
```

Each phase is a word the Ops card prints, with a distance or a percentage next to it. That
is the other half of the report: *"running in"* said nothing about whether the ship was
actually moving. *"warp to home · 4.2 Mm"* does, and *"cutting · 1,830/2,600 kg"* does.

Short hops skip the bubble — spooling for six seconds to cross 2,000 units is something no
pilot would do and it reads as a stutter rather than as travel.

## The pay cycle was being spent in transit

Fixing the cycle exposed a second fault immediately underneath it. `payT` decremented every
frame from dispatch, so undocking, the run out and the warp all spent it. The hull arrived at
the seam with the clock already expired, cut for a single frame, and turned straight round.

Measured before the fix: **seven complete round trips, sixty kilograms delivered between
them, and the treasury went *down*** — upkeep outran a cargo hold that never filled.

The pay cycle measures time *at the face* now. Only cutting spends it. Same seed after the
fix: three round trips, 7,028 kg, treasury up about ten thousand credits.

## Ships start in a hangar

A commissioned hull used to be pushed into the world 220 units off the station and left
floating, which is why it looked as though it *"auto appears at the belt"* — it never
undocked because it was never docked, and the first thing the objective did was fly it away.

New hulls are now parked on a pad: held at the station's position, hidden, and skipped by the
world's manoeuvre, acquisition and collision passes. Leaving the pad is the first thing an
objective makes them do.

## Ownership

Two ways to come by a ship, and they mean different things. A hull ordered through
**Ops → Staff** is bought with the treasury and belongs to the company. A hull bought at a
station's own yard is bought with the pilot's credits and belongs to the pilot. Both end up
as ships in the world, so the difference is recorded rather than inferred.

`transferHull()` moves one either way, with a **TO ME** / **TO COMPANY** button on each
roster card. A hull the pilot has taken back stays visible and refittable but **cannot be
given company objectives** — an order is a company instruction, and a ship that is not the
company's does not take them. A hull mid-objective cannot be transferred out until it is
recalled.

---

## Found while testing

**Commissioned hull names collided.** They were numbered by roster length, so releasing a
hull and commissioning another produced a second *"Skud Extraction 01"*. `hullShip()` resolves
a contract to a ship by matching on that name, so it silently returned whichever came first in
the world array — which is how a freshly docked hull could report itself adrift. The name now
carries the tail of the contract id, which is already unique.

---

## Files touched

| File | Change |
|---|---|
| `src/systems/fleet-work.js` | the flight-cycle state machine; pay cycle spent only while cutting |
| `src/systems/fleet.js` | `dockHull`/`undockHull`/`hullDocked`; ownership and `transferHull`; unique hull names; commissioned hulls parked |
| `src/entities/npcs.js` | docked hulls skipped by the world step |
| `src/systems/orders.js` | `phase` and `returns` on the objective report |
| `src/systems/command.js` | `commandTransfer` |
| `src/ui/ops.js` | docked state, owner line, transfer button |
| `test/hangar.mjs` | **new** — 45 checks |
| `test/works.mjs`, `test/corpo.mjs` | extraction blocks rewritten for the cycle |
| `test/all.mjs`, `package.json`, `README.md`, `CHANGELOG.md`, `src/core/version.js` | 1.01.93 |

## Verified

- `node test/all.mjs` — **41/41 suites, 3,235 checks, 0 failed.**
- `test/hangar.mjs` walks every phase by name and requires all eight, then asserts a round
  trip carries **more than 500 kg** rather than merely more than zero — which is the check
  that would have caught the sixty-kilogram version.
- It also pins the pay cycle directly: after sixty ticks the hull must still be outbound
  *and* the clock must be untouched.

## Not verified

Nothing rendered in a browser. The transfer buttons and the docked/owner lines pass the id
and selector audit but no suite draws them.

**The station-yard side of ownership is only half built.** The rule is written and the
transfer works, but the existing shipyard on the Ledger tab still replaces the player's own
hull rather than adding a player-owned ship to the roster. Buying a ship *as the pilot* and
then lending it to the company is not yet a path you can walk end to end — only the second
half of it is.

`warpSpeed` (2,600 u/s), `spoolTime` (6 s) and `payCycle` (300 s at the face) are pacing
numbers, not physical ones. The pay cycle in particular decides how often you see a ship come
home; at the current value a hull usually fills its hold first and the clock rarely fires.
