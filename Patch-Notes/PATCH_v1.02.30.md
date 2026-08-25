# PATCH v1.02.30 — "Long Haul"

Company ships fly properly now. The spacing you asked for is still not on, and this patch is
the reason why — it went looking and came back with three named blockers instead of a guess.
Schema stays **17**.

---

## Your haulers were not drifting. They were flying at 7 u/s.

`cruise()` — spool, warp, drop out, close — was written for extraction at v1.01.93, and
**only extraction ever called it.** Every other objective moved with a bare `seek()` at the
hull's own sublight speed. With the transit boost that is about 7 units per second, and
station-to-station in Solaris is 2,000–20,000 units.

A logistics run between two neighbouring stations was taking **six minutes of wall clock per
leg**. Nothing was stuck; they were arriving on a timescale nothing in the game measures.
Patrol was worse: a hull given a beat on the far side of the system started circling from
wherever it was standing, so it was "on patrol", earning nothing, tens of thousands of units
from the lane it was being paid to hold.

Everything that crosses open space now goes through one `travel()` helper: logistics both
ways, patrol to its beat, escort closing on its subject, survey to its body, station-keep to
its post. Each leg keeps its own spool timer, so a hull that warps to a source, loads, and
warps to a market does not carry the first bubble into the second.

Two numbers moved with it:

- **`warpMin` 4000 → 1600.** Below this a hull would not spool — and the most common trip a
  hauler makes in Solaris is 2,000–3,500 units, so the standard run fell *under* the bar and
  was flown at cruise. Every logistics objective in the game has been doing that since the
  order type existed. Six seconds of spool to save five minutes is worth it at almost any
  distance.
- **`transitBoost` 2.2 → 5.0.** This flies the sub-bubble hops and the last stretch after
  drop-out; at 2.2 the drop-out approach alone was a minute and a half.

Measured before and after on the same seed: a haul objective that never completed inside a
1,000-second window now loads at **t=41 s** and delivers by **t=90 s**.

## Trade and logistics pick a market, not the far end of the map

The destination was `farthestFrom(source)` — literally the most distant station in the system,
chosen for no reason but distance. It made every logistics objective the same flight, ignored
what anyone was paying, and flew hulls past three markets that wanted the cargo to reach one
that might not.

`bestMarket()` scores price against the trip, at roughly one credit of price per 4,000 units
of travel, so a nearer buyer paying nearly as much wins and a 10% better price justifies
crossing the inner system but not the whole of it. `bestSource()` does the same in reverse for
the pickup — a passive hauler re-picks **both ends** each run, so a route that stops paying is
a route it stops flying. That is the other half of "they will not go and work other stations":
a passive hauler always returned to its home berth and ran one lane forever.

### The bug this patch introduced and caught

`logisticsStep` used `order.leg` as its state machine — `'loading'` then `'outbound'`. That
was survivable only while logistics moved with a `seek()` that wrote nothing. The moment it
started warping, `cruise()` overwrote the state with `"warp to Meridian"`, the run skipped
loading entirely and tried to sell an empty hold.

`order.phase` is the state now and `order.leg` is display text, which is how extraction has
always had it. Worth noting how it was found: the existing check asserted on the *display
string*, so it stayed green through the rewrite that broke the run underneath it. It asserts
the phase now, and takes the last live report rather than reading after the loop — an active
objective is removed the tick it completes, which nobody had handled because the run had never
been fast enough to complete.

## The spacing: three blockers, named

I set `ORBIT_SCALE` to 4.0 and ran the suite, then 2.0. Three things fixed on the way, each
wrong at any scale:

- `FAR = 9000`, the NPC simulation cull, was a bare constant. It scales.
- **Warp speed was absolute**, so a wider system meant proportionally more hops. It scales
  now — a hop is energy-limited, so one charge should buy the same *fraction* of the system
  whatever size it is. The spacing should change what you can see from one place, not how
  long the game takes. At 2.0 an inner trip went from 2 hops / 51 s to **1 hop / 24 s**.
- `test/warp-nav.mjs` used literal world coordinates for start points, so widening the system
  quietly moved "outward from the core" into a planet's gravity well.

Three still open, which is why it ships at 1.0:

1. **Obscura becomes unreachable**, and this one was chased to the line. Hop one covers
   61,733 of the 70,750 km and drops out 9,017 km short. Hop two spools, warps for 38 s, and
   ends at 9,017 km — *the same distance to the unit*, which is a closed arc at constant
   range rather than a failed approach. `collectObstacles()` from that point returns exactly
   one obstacle: **Obscura IV**, a moon of the destination, 1,249 km from its parent with a
   159 km well against the destination's 731 km. None of the four exemptions in
   `collectObstacles` cover it — it sits about 335 km outside the destination's arrival
   sphere, so on paper it is avoidable — and routing around it produces a waypoint the ship
   can reach without ever getting closer to Obscura. The stall watchdog re-plots three times
   and abandons the course.

   It is the same family as the sibling-moon dead band the planner already handles, one
   level out: an obstacle near the *goal* rather than near another obstacle. A fifth
   exemption mirroring the warp core's own lock rule was written and tried, and it does
   **not** cover this case — the moon is outside that band too, so the fix is in the ring
   geometry rather than in another special case. That change was reverted rather than
   shipped, because a speculative edit to the pathfinder is not worth a green suite.

   Reproduce: set `ORBIT_SCALE` to 2.0 and run `node test/warp-nav.mjs`.
2. **Ambush geometry.** A lurker is snapped to its hide every frame; widen the system and a
   close pass stops springing it.
3. **NPC miners stop filling holds** inside the window `test/run.mjs` allows. Could be the
   cull, could be belt distance; not separated.

Every one of those is now a specific, reproducible failure rather than "it might break
things", which is the difference between this attempt and the last one.

## Files touched

| file | change |
|---|---|
| `src/systems/fleet-work.js` | `travel()`; every objective warps; `bestMarket`/`bestSource`; logistics phase split from display |
| `src/core/state.js` | warp speed scales with the system |
| `src/core/config.js` | `ORBIT_SCALE` findings written down |
| `test/comms-work.mjs` | asserts phase, not display text; reads the last live report |
| `test/warp-nav.mjs` | start points and hop budget scale |

## Verified

- `node test/all.mjs` — **42/42 suites green, 3,332 checks** (104 s).
- The logistics run was traced tick by tick before and after: never completing → load at 41 s,
  delivered by 90 s.

## Not verified

- **The spacing is still 1.0**, which is the thing you asked for and did not get. The three
  blockers above are the work, and (1) has to go first: there is no point widening a system
  you cannot cross. It is now a localised geometry bug with a reproduction and a rejected
  first attempt on the record, which is a much better place to start than last time.
- **`bestMarket`'s 4,000-units-per-credit weighting is a guess.** It is the first number in
  this file that was not measured, and it decides every route in the game. It wants the
  `fee-probe` treatment.
- **Patrol, escort, survey and keep were changed but only patrol was traced.** The suite
  covers that they dispatch and run; nobody has watched an escort actually catch anything.
- **Nothing opened on a phone.** Eleventh slice.
