# PATCH v1.00.40 — "Ephemeris"

Slice 4 of the technical line: **solar system & celestial bodies**. No schema change —
everything new here is derived from fields the save already holds. 22 suites,
**1,795 checks**, all green.

---

## What was actually wrong

Four things, and I only went looking for two of them.

### 1. No moon in the game could ever be built on

`systems/planetary.js` has accepted `kind === 'moon'` as a valid site body since
v1.00.20:

```js
if (!u || (u.kind !== 'planet' && u.kind !== 'moon')) { toast('A site needs a planet or a moon'); ... }
```

and then, four lines later:

```js
if (!centre.worlds.includes(u.ptype)) { toast(`A ${centre.name} cannot be built on a ${u.ptype} world`); ... }
```

A moon carried no `ptype`. `worlds.includes(undefined)` is false for every command centre
in the table, so the refusal fired every time, and the message it printed was *"a Survey
Outpost cannot be built on a undefined world"*. The layer said yes and the data said
nothing.

### 2. The survey spoke a vocabulary the game had abandoned

`planetInfo()` branched on `'rocky'`, `'terrestrial'`, `'ice'` and `'gas'`. Three of those
four have not been planet type keys since the twenty-type table landed — the keys are
`barren`, `gasGiant`, `methaneGiant` and seventeen others. Seventeen of twenty world
classes fell through every branch into the default clause, so:

- a gas giant reported the volatile content of a rock (10–40% instead of 70–95%),
- surface temperature was re-rolled here from a *second, different* band, unrelated to the
  `tempC` the world generator had already computed from the type's real temperature range,
- and the orbital scan disagreed with the extraction rate the planetary layer would
  actually give you on the same ground.

Both of these are the same failure: **a table grew and a consumer did not.** Neither could
be caught by a unit test, because each function was internally consistent and perfectly
happy. They were only wrong *relative to another file*.

### 3. A moon walled off its own primary (latent, found by this slice)

`collectObstacles()` skips the destination itself, but not the destination's satellites. A
warp course *ends* at the destination's gravity-well edge — the core drops out there and
the approach autopilot flies the rest. Anything orbiting inside that edge sits behind the
arrival point and can never be flown through.

A gas giant's third moon orbits at roughly five planet radii; its well spans well over half
that distance. So the planner tried to route *around* a body standing between the ship and
the giant from every direction at once, failed, and handed back the fallback sidestep —
which is by construction not clear.

This was latent long before moons had classes. It needs a moon in a narrow band just
outside its primary's clear ring, which the twenty-seed sweep in `test/warp-nav.mjs`
happened not to produce. I confirmed it by restoring the old flat moon values and widening
the sweep: it still reproduces at seed 191393, on Obscura III.

### 4. A dead band at the well edge (latent)

Two radii bracket every obstacle. Legs are blocked inside `NAV.test` (1.12) well-radii;
bypass nodes are placed at `NAV.clear` (1.45). A ship sitting *between* them is blocked,
and every chord from where it stands to any node on the bypass ring dips further inside the
well than either endpoint — so no first leg is ever visible, A* finds nothing, and the
fallback fires again.

The `escaping` filter was measured at the smaller radius and the ring drawn at the larger.
The gap was guaranteed by construction. This is the v1.00.30 lesson word for word:
**hysteresis has a direction — when two thresholds bracket a state, check which is larger
in the units they are actually compared in.**

---

## The fixes

**Moons are worlds.** `src/data/moons.js` gives nine classes, each mapping onto an existing
`PLANET_TYPES` key. `ptype` is what the industry sees; `name` is what the pilot sees. A
Cryovolcanic Moon is a `methaneIce` world to the extractor and a cryovolcanic moon on the
panel — one description, not two.

Not a `worlds` special case, deliberately. Giving a moon the same physical identity a
planet has means resources, traits, centres, facilities, the assay and the scanner all read
it for free, and keep reading it as those tables grow.

Selection is physical rather than table-driven: the primary's mid temperature and the
moon's depth in its well. The innermost moon of a giant is tidally kneaded and volcanic;
the outer ones are ice. Adding planet type twenty-one needs no edit — it gets moons from
its temperature like everything else.

That is what makes a gas giant a destination. You cannot land on Titanus; you can land on
four different things in orbit around it, and they are not the same four.

**The survey reads the ground.** Minerals, volatiles and biosigns are now summaries of
`PLANET_RESOURCES` — the same numbers a site on that world extracts against. The scan
cannot drift from the ground again because it *is* the ground. Grouping comes from the
material catalogue's own `category` field rather than a list of ids kept in the scanner, so
`RAW-026` lands in the right column on its own. Temperature and gravity come from the body.

**Satellites of the destination are not obstacles.** One line in `collectObstacles`, and
the whole class of unreachable-giant geometries goes with it.

**`escapesWell()` is measured at the ring radius.** Both the planner and `routeClear()` now
ask through the same function — a route judged by a different rule than the one that
produced it is a test that fails on correct output.

**`clipGoal()` — courses end where the ship stops.** The planner had always planned to the
destination's *centre* and the warp core has never flown there. The last stretch of every
plotted course was a stretch that would never be flown, and demanding it be clear invented
impossible corridors out of nothing: two planets in near conjunction, 1,600 units apart
with 1,000-unit wells, produced a legal approach the planner rejected because of geometry
inside a well the ship stops outside of. The clip is exact — the segment to a sphere's
centre enters it at one point — and the `0.92` factor is the same number as the arrival
rule in `warp.js`, which the comment says out loud so the two move together.

Across a 200-seed sweep (12,000 plans) the unclear count went **11 → 1**.

---

## What is new to play with

### Atmospheric interference

The atmosphere shells in `world/system.js` have been decorative since they were added.
Effective sensor strength is now divided by `1 + atmoScan × density`, where density is
derived from the shell the renderer already draws — so a world that *looks* like a
greenhouse scans like one.

One correction, and it matters: `thick` is the visible shell, and a giant's shell is thin
on screen precisely because the whole body is atmosphere. Reading depth straight off it
would have made Titanus the clearest read in the outer system.

| Body | attenuation | low orbit | survey ring |
|---|---|---|---|
| airless moon | 1.00 | full survey | full survey |
| terrestrial | ~1.31 | full survey | detailed assay |
| toxic greenhouse | ~1.65 | full survey | detailed assay |
| gas giant | ~1.72 | detailed assay | composition |

This is what makes the orbit-band menu a decision instead of a formality. It also means a
giant is a body you **probe** rather than one you resolve — which is the right answer for a
world with no surface to look at.

### Surface features

Nineteen of them, one to three per world, seeded from the world name. Before this, every
world of a given type was the same world: two barren rocks had identical resources,
identical scans and identical reasons to visit, so a survey was a formality you performed
to unlock the site rather than something you did to *find* anything.

Three constraints:

- **Requirements are declared, not whitelisted.** A feature says "solid ground, no
  atmosphere, cold" — it does not list the eleven planet types that currently satisfy that.
  Same lesson as the facilities table in v1.00.20.
- **Effects land in systems that already exist.** `assay` feeds the same permanent
  per-world figure a survey crew raises and planetary extraction already pays on. `probe`
  scales telemetry. `scan` offsets atmospheric interference — a polar vortex is a hole you
  can look down; an anchored megastorm is not. Nothing here invents a currency.
- **Discovery is derived, not stored.** What you know is a function of the resolution
  archived on that body and whether you have put a probe down — both already persisted.
  That is why this slice needs no schema bump, and why a v1.00.34 save arrives already
  knowing everything it earned.

One trap worth recording. `needs: { atmo: false }` must mean *airless only*, not *don't
care*. Testing `if (needs.atmo)` collapses the two and puts exposed metallic veins on every
toxic greenhouse in the system. An undeclared key is don't-care; a declared `false` is a
requirement. `test/celestial.mjs` asserts both directions.

### The ephemeris

Every orbit in Solaris is circular, coplanar and advanced at a constant rate. That was a
rendering decision, and until now it was *only* a rendering decision: nothing could answer
"where will Obscura be when I get there?" even though the answer is one cosine away.

- **Lead, not pursuit.** Warp aimed at the destination's current position every frame. That
  converges — a pursuit curve always does — but along an arc trailing a body moving at up
  to 0.45 units/s, which on a 30,000-unit crossing is a detour paid for nothing.
- **Transfer windows.** Two circular orbits have an exact synodic period and an exact time
  to conjunction. Solaris is small enough that these are minutes, not months, which makes
  "wait four minutes and the crossing is a third as long" a decision rather than an
  astronomy fact. Only offered when you are docked or in orbit — a free-flying ship is not
  on an orbit and a window means nothing to it.
- **Honest arrival ranges** in the scan panel, instead of the range right now.

All analytic. No sampling, no integration — the motion model is closed-form, and pretending
otherwise would be slower and less accurate at the same time.

---

## `test/celestial.mjs` — 119 new checks

The properties asserted are deliberately about *relationships between systems* rather than
any one function's arithmetic, because that is the shape of every bug in this patch.

Three worth calling out:

**Prediction is checked against the simulation.** `predict(body, 300)` is compared with 300
seconds of actual `updateSystem()` on every body in the system; worst error must stay under
1 unit. Anything that changes the motion model and not the ephemeris fails here, which is
the only thing standing between the two staying in step.

**The analytic conjunction is checked against a brute-force sweep.** 400 samples across one
synodic period must find the same minimum the closed form predicts.

**Determinism is measured across two child processes**, not two builds in one process.
Building the system twice in a single process is *deliberately* not identical —
`world/textures.js` caches a generated texture per type, so the second build draws fewer
numbers out of the per-planet stream. That is a rendering optimisation, not a world
property, and asserting against it would be asserting the wrong thing. Two fresh clients on
one seed is the question multiplayer actually asks.

The planner fixes get property tests rather than seed tests, for the reason both bugs
survived twenty seeds: nothing inside a destination's well may ever be an obstacle, no
position inside a bypass ring may be treated as blocked by it, and `NAV.clear > NAV.test`
is asserted directly so the dead band cannot be reopened by a tuning change.

---

## Files

**New** — `src/data/moons.js`, `src/data/features.js`, `src/systems/ephemeris.js`,
`test/celestial.mjs`, `PATCH_v1.00.40.md`

**Changed** — `src/world/system.js`, `src/systems/survey.js`, `src/systems/scanner.js`,
`src/systems/planetary.js`, `src/systems/navplan.js`, `src/systems/warp.js`,
`src/core/config.js`, `src/core/version.js`, `index.html`, `package.json`, `test/all.mjs`,
`README.md`, `CHANGELOG.md`, `docs/SLICE_PLAN.md`

---

## Verified vs not

**Verified:** every claim above has a check behind it — moon ptypes resolve against the
planet table, every moon admits a command centre and one is actually founded end to end,
giants read volatile-rich and rock reads mineral-rich, temperature and gravity come from
the body, features fit the worlds they land on, attenuation is monotonic and never helps,
prediction matches the simulation over 300 seconds, the analytic conjunction matches a
sweep, and every course to every planet and moon in the system comes back flyable.

**Not verified — and worth saying:**

- **One unclear plan remains in 12,000**, at seed 563586, on a Gaia–Meridian near
  conjunction. The bypass ring is generated perpendicular to the route axis, and when the
  destination sits well off that axis behind an obstacle, no node on the ring sees it. The
  runtime is not stranded — the stall watchdog re-plots and the next geometry is different
  — but the plan that came back was not clear, and rounding that to "fixed" would be a lie.
  The fix is a goal-side node ring, which is a planner change rather than a celestial one,
  so it belongs to whichever slice takes navigation next.
- **Balance.** Feature assay bonuses stack to a capped 0.55 on top of whatever a survey
  crew has raised. The cap is measured against nothing — I have not run a site to
  saturation and compared income per hour against a site without features, which is exactly
  the "measure the products, not the terms" check the 1.0 pass exists to remind us about.
- **How the new readouts look on the phone.** The planet scan panel gained up to five rows
  (atmosphere, gravity, features, unresolved count, transit, window). On a Samsung in
  portrait that panel now has real length to it, and whether it needs its own scroll is a
  judgement a number cannot make.
- **Rings and Lagrange points are not in this slice.** Mineable ring fields need
  planet-parented asteroid records, which touches the mining path, the broadphase and the
  nav-map contact list — a coherent piece of work on its own rather than a tail on this one.
  Carried to v1.00.50 with deep-space anomalies.
