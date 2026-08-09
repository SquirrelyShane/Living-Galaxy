# PATCH v1.00.50 — "Shallows"

Slice 5 of the technical line: **rings, Lagrange points and deep-space anomalies** — and
the gravity-well rewrite the whole thing turned out to depend on. Save schema 9 → 10
(migration included). 22 suites, **1,891 checks**, all green.

---

## The wells were wrong, and everything else was downstream of it

`wellRadius()` read `gravity` as if it were mass. It is not — it is *surface* gravity, and
surface gravity barely falls off as a body gets smaller. A 7 km moonlet at 0.18 g and a
151 km gas giant at 2.6 g are only a factor of four apart in √g, so the formula's constant
term dominated everything and the moonlet projected a **557 km shadow — thirty-seven times
its own radius.**

That is what made gravel behave like a wall. It is why the planner detoured around pebbles,
why v1.00.40 had to spend two fixes teaching it not to, and why a warp dropped you
embarrassingly far from anywhere.

What actually sets the reach of a well is mass, and mass goes as `gravity × radius²`. So
`√gravity × radius` is a mass proxy, and the well now grows with the body:

```
raw  = scale × (√gravity × radius / refR) ^ exp + radius × size
well = clamp(raw, min, max)
```

| body | before | after |
|---|---|---|
| Solaris Prime | 2,478 | 1,594 |
| Titanus (gas giant) | 1,325 | 668 |
| Gaia | 930 | 363 |
| Aether (barren) | 725 | 154 |
| Gaia I (moon) | 561 | 88 |
| Aether I (moonlet) | 554 | 42 |

A well is now between **four and six body radii** instead of thirty-seven, and it is
something you can see out of the cockpit. The exponent keeps the star from swallowing the
inner system without needing a cap to rescue it, and the numbers moved out of
`systems/warp.js` into `WARP.well` — "balance the game by editing config only" is not true
if the most geometrically consequential formula in the game lives somewhere else.

### The arrival floor was the other half, and it was easy to miss

`WARP.arriveRadius` was 900. That was set when a barren rock projected a 725 km shadow, so
it never bound on anything. With the new formula it binds on **everything except the star**:
every arrival in the game was at exactly 900 km regardless of what you were arriving at.

Shrinking the wells would have changed nothing a pilot could feel, and left a five-minute
sublight burn at the end of every hop to a small world. The floor is 240 now — roughly a
low orbit band on a mid-sized planet — so arrivals scale with the body: the star drops you
1,467 km out and a moonlet drops you 240.

Worth recording as a pattern: **when you shrink a number, check what was clamping it.** A
floor that never bound before is exactly the thing that silently swallows the change.

---

## Rings

A ring is a mining field like any other — same records, same cutter, same market — but its
rocks are held by a planet rather than by Solaris. That distinction is the whole of the
work: a belt is a radius from the origin, and a ring is a radius from something that is
itself moving.

**`systems/fields.js`** is the seam. "Warp to the belt" has always meant "warp to the
nearest point on the belt's mid-orbit circle" — a synthetic target the drive can chase —
and that calculation existed in four places: `ui/hud.js` for the contact list,
`ui/navmap.js` for the tap handler, `systems/tools.js` for ARIA, and `systems/targeting.js`
rebuilding it every frame to keep the reticle honest. Four copies of one rule, all of them
assuming the circle is centred on the star.

Rather than teach four files about parents, they all ask one file. Same lesson as the
target bug in v1.00.20: **when two pieces of state are always meant to agree, make the
write single.**

Rings are volatile fields, not metal fields. A giant's ring is water and ammonia ice that
never accreted, so it pays in the one commodity the inner belts have almost none of — which
is the reason to make the trip rather than mine Meridian like everyone else. The field radii
match the ring mesh in `world/system.js` deliberately: a band you can mine and a band you
can see have to be the same band, or the rocks are somewhere the ring visibly is not.

---

## Lagrange points

L4 and L5 sit sixty degrees ahead of and behind a planet on its own orbit — the only two
places in a two-body system where a third thing can sit still without spending anything to
stay. Which is why debris accumulates there, and why they are the natural home for the
deep-space sites this slice adds.

Three decisions worth recording:

**A Lagrange point is derived, never stored.** Its position is the parent's phase plus sixty
degrees at the parent's radius — one cosine, exactly like `systems/ephemeris.js`. Nothing is
generated at world build, nothing is persisted, and a client joining a shared world computes
the same points from the same seed without a packet.

**What is at a point is seeded; whether you have worked it is saved.** The anomaly is a
function of the world seed and the point's name, so it costs nothing to know and cannot
desync. The one genuinely player-owned bit — did you already take it — is a single flag,
which is the entire schema-10 payload.

**Only planets have them.** L4/L5 are only stable when the primary dominates its secondary.
There is a mass floor in config, but it is not what excludes moons — the largest moon in
Solaris (mass proxy 499) outweighs the smallest planet (Aether, 517) closely enough that no
mass test could separate them. Moons are excluded by kind, and the floor is the guard for a
future planet small enough not to hold anything. Saying that out loud in the config comment
matters more than the number does.

A point projects **no gravity well**, deliberately. Giving one a well would have the warp
core drop out short of a place with nothing at the middle of it.

---

## Deep-space anomalies

An anomaly is a **one-shot place**. You find it by looking, you work it once, and then it is
worked out — the opposite of a belt, and the reason the outer system has somewhere to go
that is not another rock.

Six kinds: a derelict hull, a concealed cache, a repeating buoy, a trojan rock shoal, a
gravitic knot, and cold dust. Every reward channel already exists — cargo you sell,
materials the manufacturing queue eats, credits, practice. **Nothing here is a new currency,
and nothing here is a key that opens a door**; an anomaly that gates progression turns "go
and look" into "go and fetch", which is the failure mode this is trying to avoid.

`dust` exists on purpose. A survey that always pays is not a survey, it is a vending machine
with a longer walk — the scouting orders in v1.00.30 learned the same thing, and "the scouts
found nothing worth the fuel" is still the honest outcome of sending someone to look at
empty space. An empty point is consumed when you sweep it, because knowing a place is empty
cost the same trip as finding something.

Gating is range, then resolution, then one shot. A full hold refuses the cargo rather than
losing the site's contents silently, and telemetry wins the space over salvage — telemetry
is the thing you cannot come back for.

One readout decision: a point's *identity* (which planet, which side) is chart data and is
returned even at zero resolution, ahead of the usual "no usable return" bail. You can read
an ephemeris off the charts without pointing a dish at anything. What is on station still
needs the sweep.

---

## Tests — `test/celestial.mjs` at 214

The geometry is asserted against closed-form truths rather than against itself: L4 and L5
sit exactly on the primary's orbital radius, the chord to a body 60° away on a circle of
radius R is exactly R, and the two points are R√3 apart. Prediction is checked against 240
seconds of real `updateSystem()`, the same property that keeps the ephemeris honest.

The one-shot rule gets the full ladder — unresolved, resolved but out of range, in range,
worked, worked twice — plus the full-hold path and the schema-10 round trip.

---

## Files

**New** — `src/systems/fields.js`, `src/systems/lagrange.js`, `src/data/anomalies.js`,
`PATCH_v1.00.50.md`

**Changed** — `src/data/belts.js`, `src/world/asteroids.js`, `src/world/system.js`,
`src/world/starfield.js`, `src/systems/warp.js`, `src/systems/navplan.js`,
`src/systems/scanner.js`, `src/systems/targeting.js`, `src/systems/tools.js`,
`src/systems/save.js`, `src/core/config.js`, `src/core/state.js`, `src/core/version.js`,
`src/ui/hud.js`, `src/ui/navmap.js`, `index.html`, `package.json`, `test/celestial.mjs`,
`test/run.mjs`, `test/ui.mjs`, `test/industry.mjs`, `test/preflight.mjs`, `test/avatar.mjs`,
`README.md`, `CHANGELOG.md`, `docs/SLICE_PLAN.md`

---

## Verified vs not

**Verified:** the well table above at every body in the system; that a well now sits between
four and six body radii; that arrivals scale with the body and are no longer a flat 900; the
Lagrange geometry against closed form; prediction against the simulation; the one-shot rule
at every rung; the schema-10 migration and round trip; and that every course to every planet
and moon still plans clear.

**Not verified — and worth saying:**

- **Whether the shorter wells make warp too easy.** The whole point of a mass shadow is that
  you cannot warp straight onto a target, and the shadows are now less than half what they
  were. Nothing measures how often a hostile interception actually lands, and that is the
  number that would tell you. It wants a session, not a test.
- **Anomaly economics.** Reward ranges were written to look sensible next to a mining run
  and have not been measured against one. A derelict at 420 kg of salvage versus twenty
  minutes in the Meridian belt is exactly the "measure the products, not the terms"
  comparison the 1.0 pass exists to remind us about, and I have not run it.
- **The new contact tab on a phone.** `#contact-tabs` went from five buttons to six. The
  layout suite checks the tool column, not this row, and whether six tabs still have
  comfortable tap targets in portrait is a judgement a number cannot make.
- **The carried planner item is still carried.** The goal-side bypass ring — for the
  near-conjunction geometry where no node perpendicular to the route axis can see the
  destination — is not in this slice. The shorter wells make that geometry much rarer, which
  is a reason it slipped rather than a reason it is fixed.
