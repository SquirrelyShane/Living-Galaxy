# PATCH v1.02.34 — "Right of Way"

Company hulls fly around things now. Schema stays **18**.

You were right that this was already decidable. `systems/navplan.js` has planned
visibility-graph courses around gravity wells since v0.2, and the comment at the top of
that file has said, the whole time:

> Everything here is pure: positions in, waypoints out. It never touches S, so the same
> function plans a warp course, a nav-map preview, **and an NPC route**.

That third caller did not exist. Contracted hulls flew straight lines at warp speed through
planets, and the well rule that governs the player's drive did not apply to them at all.

Chasing it turned up two things much worse than the original report.

---

## The planner, wired up

`travel()` now asks `planRoute()` where to point, and steers at the next waypoint instead
of straight at the destination. Three properties make it work rather than merely run:

- **The route is cached per leg.** Planning is a bounded A* over a visibility graph and
  there can be six objectives; per-frame per-hull would be the most expensive thing in the
  simulation by an order of magnitude.
- **It is invalidated on the things that actually make it wrong** — the destination
  drifting (stations orbit, so every route to one goes stale by itself), the cached route
  failing `routeClear`, and a 6-second heartbeat so nothing is stale forever.
- **Arrival is judged against the real destination, never a waypoint.** A leg that
  "completed" on reaching a bypass node is a hull that stops beside a planet and reports it
  has arrived at a station. The distance the Ops panel reads is to the destination too — a
  readout that counts down to a waypoint and then jumps back up reads as a fault.

Routes are stored as plain `{x, y, z}` because fleet objectives are persisted and a
`Vector3` does not survive JSON as a `Vector3`. The leg text says what it is going around:
`routing around Kharon · warp to Exchange Nexus`.

**And a well now actually collapses the bubble for company hulls**, the same as it always
has for the player. Without that the routing is decoration — a hull that can warp through a
planet has no reason to go around one. With it, the planner is the thing that makes the leg
fast.

## The star was eating the system

Wiring up the well rule immediately exposed something that had been quietly true since
v1.02.33 and was invisible before it.

`WARP.well` caps a well "relative to the body's own size, so a star can't project a well
that swallows its own inner planets". That cap was tuned against the only star that had
ever existed: a 320-unit yellow dwarf. An 820-unit blue supergiant carries the same
`gravity: 12` and projects a well several thousand units across — and the generator was
happily placing worlds and berths inside it.

Instrumented on seed 20260814 (Xanium Prime, blue giant), one hauler's time:

```
60.0%  Xanium Prime's well — cruising clear
20.9%  routing around Xanium Prime · Xanium Prime's well
 4.7%  spooling
```

**Eighty per cent of its working life crawling at 15 u/s inside its own star.**

The fix is not to shrink the well — the well is a real rule the player obeys too. It is to
stop generating worlds inside one. `innerLimit(star)` is the star's own well plus 35%, and
it is now the floor for both planet and station placement. Generated systems record it, so
the suite can assert it and a future generator can be compared against it.

## Two more, found by measuring rather than by reading

**Arriving at a berth was treated as being blocked.** A station sits in a planet's pocket by
design, so the last leg of half the routes in a generated system ends *inside* a well.
Braking there meant crawling the final approach to the destination, and again on the way
back out. The well the destination itself sits in is excluded now — the same rule the
player's drive already follows, where the core drops out at the destination's well edge.

**There was a 200-unit crawl band on every leg.** The decel ramp from v1.02.32 ran below
`dropOut` (1,400) and the bubble started at `warpMin` (1,600), and the gap between them ran
a *flat* cruise at about 15 u/s. Thirteen seconds per leg, and in a generated system — where
berths pack far closer than Solaris ever put them — that band was **46%** of a hauler's
life. One branch now: below the bubble threshold you are manoeuvring, and manoeuvring
decelerates onto the mark.

## Measured

Six passive logistics objectives, 900 s of game time, seed 20260814:

| | deliveries per hauler | dominant activity |
|---|---|---|
| before | 4 | 60% inside the star's well |
| after the well fix | 20 | 46% in the crawl band |
| after both | **44** | 59% spooling — the intended 6 s flavour timer |

**11× throughput**, and the remaining cost is the deliberate one. That is the shape you want
at the end: the flight is dominated by a timer somebody chose, not by an accident.

Planner cost, same run: **31 µs/frame** for six objectives with full route planning and
`routeClear` checks — 0.19% of a 60 Hz frame. Measured, not reasoned.

---

## Files touched

**New**

- `test/pilotage.mjs` — 31 checks

**Changed**

- `src/systems/fleet-work.js` — `steerPoint()`, route cache and invalidation, the well
  brake with the arrival exclusion, the merged sub-bubble ramp, `WORK.waypointAt` /
  `replanEvery` / `replanDrift`
- `src/world/genesis.js` — `innerLimit(star)`; planets and berths placed outside the star's
  own warp well; `plan.innerLimit`
- `src/core/version.js` — 1.02.34 "Right of Way"
- `test/genesis.mjs` — the inner-wall assertions
- `test/all.mjs`, `CHANGELOG.md`, `docs/EXECUTIVE_ARC.md`

## Verified

`node test/all.mjs` — **46/46 suites green**, 53.2 s.

`pilotage` 31/31, structured so that a claim about routing is checkable rather than vibes:

- **The geometry is decidable** — the suite computes blocked/clear itself with the same
  `segmentDistance` the planner uses, then asserts the planner *agrees*. If those two
  disagreed, every other check would be measuring the wrong thing.
- **A blocked line produces a route that is clear** — verified through `routeClear`, not
  "produces waypoints". A planner emitting garbage also produces waypoints.
- **It never flies deep inside a well it was not going to** — 2,400 position samples across
  a 600-second flight, destination well excluded.
- **A well collapses the bubble** and the hull climbs out and resumes.
- **All of it holds in four generated systems**, including that a *clear* line gets no
  waypoints at all — a planner that always emits some is spending A* on nothing.
- **The route survives a JSON round trip**, because objectives are persisted.

`genesis` 95/95 — now including that no world or berth is generated inside the star's well,
and that a bigger star pushes its inner wall further out (or the guard is a constant wearing
a function's clothes).

## Not verified — staged, not measured

- **Only logistics was measured end to end.** Patrol, escort, survey and station-keep all go
  through the same `travel()` and get routing for free, but their legs were not instrumented.
- **`STAR_WELL_MARGIN` is 1.35, chosen to clear the crawl.** It has not been swept — a
  tighter margin would put berths closer to the star and may reintroduce some braking on the
  innermost legs.
- **`GENESIS_VERSION` is now 2**, because `innerLimit` moves the innermost orbits for every
  seed — a system generated at v1.02.33 is not the system that seed generates now. Any
  procedural save written in the last few hours will reopen in a slightly different system.
  The version is recorded in the payload, so the mismatch is *detectable*; nothing yet acts
  on it. Warning the player on a version mismatch is a one-line job and is not done.
- **The player's own drive is unchanged.** It already did all of this.

## Next

**.35 — "Boardroom"**: the Ops relayout. Contract, commission, build, corp and fleet as
first-class tabs on a command surface rather than tabs on a flight overlay.
