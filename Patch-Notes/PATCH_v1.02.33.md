# PATCH v1.02.33 — "Cartographer"

The system is a seed now. Schema moves to **18**.

Twelve named worlds at fixed orbits and eleven named berths at fixed orbits have been the
map since v0.2.0. The world seed already existed and already drove rock composition, NPC
rolls, persona memory and Lagrange contents — but not the *shape* of the thing they were
scattered across. A new game was a new economy in an old map.

---

## What a seed decides now

- **The star.** Spectral class from a weighted table — M-dwarfs are most of the sky, an
  O-type essentially never happens, and there is a carbon star in there that is dim,
  enormous and deep red. Class sets radius, colour, temperature and a **luminosity**, and
  luminosity is the single number the rest of the system is measured against.
- **How many worlds there are, where, and what they are.** 8–18, spaced Bode-style — each
  orbit a jittered multiplier on the last, so the inner system is tight and the outer
  system is sparse. Class comes from where the orbit falls relative to *that star's own*
  habitable zone, so a red dwarf's ice worlds start much further in than a blue giant's.
- **How many berths, what they are, and where.** 7–14, each placed just inside or just
  outside a planet's orbit rather than at an arbitrary radius — a berth in a world's pocket
  is somewhere you can see a reason for, and it makes the chart read as a system with
  traffic instead of two unrelated rings of dots.
- **Where the fields are.** The widest orbital gaps get them, because that is where rock
  survives — a field close to a world gets swept up by it.
- **Every name.** Syllable assembly rather than a list, because a list of 200 starts
  repeating inside a single system once the planet count can reach 18.

`LG.system.preview(n)` generates a seed's system without building it, so you can look at a
hundred seeds without loading a hundred games.

## The plan

`world/genesis.js` produces a **plan**: plain data, in the same shape the two old tables
were in. `createSystem()` builds meshes from a plan, `createAsteroids()` builds fields from
one, and neither knows or cares whether it was generated or authored. That is why this
patch is mostly a new file rather than a rewrite of the world builder.

Two things in the builder did have to change, and both were the same class of bug —
a constant tuned against the only system that could exist:

- **The corona shells** were absolute radii sized for a 320-unit star. A 200-unit red dwarf
  sat *inside* its own corona; an 820-unit supergiant wore one three sizes too small. They
  are multiples of the star's radius now.
- **Station bearing** was `i / SYSTEM_STATIONS.length` — the length of the hardcoded table,
  which is correct only while that table is the only thing that can be built. It reads the
  plan's own list, so a nine-berth system spreads nine berths evenly.

And two labels that had been literals since the first build: the chart drew `Solaris Prime`
next to whatever star it was actually plotting, and the top bar said `SOLARIS SYSTEM` in
markup. Both come off the plan.

## Composition is a gradient, not a list

The four authored belts were four hand-tuned mixes along a temperature gradient — hot metal
inner, balanced workhorse, rare-metal trojan field, cold volatile rime. `mixFor(heat)` is
that gradient as a function, so a generated system gets the same *economics* — always
somewhere cheap to cut iron, always somewhere that pays for volatiles, rares peaking in the
middle band so the awkward field is worth the trip — without the same four fields.

One guarantee sits on top of it, and it exists because the generator produced the fault
before the suite did: **a hot star pushes its frost line past the outermost orbital gap**,
so every field in a blue-giant system came back metal-rich and *volatiles had no origin
anywhere in that system*. Crew rations, coolant and half the crafting tree, with nothing
selling the input. That is not a hard system, it is a broken one. The outermost field is
re-rolled cold if nothing else is cold, which is where it physically belongs anyway.

The station guarantees are the same idea: every system gets at least one trade hub,
foundry, refinery, fortress and depot. A system with no yard is an executive career that
cannot commission a hull — a soft-lock produced by a dice roll.

## Solaris is still Solaris

A save describes its world entirely **by name**: archived scans, completed surveys, the
office a company is registered at, the berths its haulers run between, which rocks are
mined out, which Lagrange sites have been worked. Regenerating a v17 save's seed with the
new generator would rename every one of those at once.

So schema 18 persists a `layout` alongside the seed, and the v17 → v18 migration declares
every existing save to be in `solaris` — the authored twelve-world system, which
`genesis.js` still carries verbatim for exactly this purpose. Nothing is lost and nothing
moves. New games generate; old flights keep theirs.

The layout is **recorded, not inferred**, and the generator version goes with it. Generation
is deterministic, but it is deterministic *for a given generator* — if a future patch moves
station placement, a save carrying only a seed would silently reopen in a system that is
subtly not the one it was written in. This makes that detectable.

`createSystem()` also falls back to Solaris when no plan is set, which is why the existing
suite needed no rewriting: nothing opts *out* of proc-gen, new games opt in.

---

## Files touched

**New**

- `src/world/genesis.js` — star classes, temperature bands, placement, naming, the
  composition gradient, and the authored Solaris plan
- `test/genesis.mjs` — 91 checks

**Changed**

- `src/world/system.js` — `createSystem(plan)`; star built from a spec; corona as multiples;
  bearing off the plan's own list
- `src/world/asteroids.js` — fields come off the plan
- `src/core/state.js` — `S.systemPlan`
- `src/systems/save.js` — `layout` + `genesis` in the payload, `savedLayout()`, v17 → v18
- `src/core/version.js` — 1.02.33 "Cartographer", **schema 18**
- `src/main.js` — plan before build; `LG.system`; names the system on arrival
- `src/ui/hud.js` — `refreshSystemName()`
- `src/ui/navmap.js` — the star's label comes off the plan
- `test/all.mjs`, `test/ui.mjs`, `CHANGELOG.md`, `docs/EXECUTIVE_ARC.md`

## Verified

`node test/all.mjs` — **45/45 suites green**, 50.5 s.

`genesis` 91/91 across a thirteen-seed spread, because every check is a *property* and a
property asserted on one sample is an anecdote:

- **Determinism** — byte-identical regeneration; unchanged when other seeds are generated
  in between *and* after the global world stream is re-seeded, which is the failure a
  generator gets when it draws from a shared stream.
- **Playability** — every world a class the renderer can draw, every berth a type the
  builder knows, unique names within a system, ascending orbits, nothing past the chart
  wall or inside the star, no field overlapping a world, every system able to sell both
  volatiles and metal, all five station guarantees on every seed.
- **The star matters** — a brighter star measurably widens its habitable zone, inner worlds
  are never ice giants and outer worlds never molten.
- **It builds** — a generated plan through the real `createSystem()` / `createAsteroids()`,
  asserting every planned body is in the world and the berths are spread round the star.
- **The save carries it** — written at schema 18 with layout and generator version, read
  back by `savedLayout()`, reopening byte-identical.
- **The migration** — a v17 payload lands at 18 as `solaris`, reopens with Gaia and
  Fortress Omega intact, *and* the suite asserts the generator would have produced
  something completely different for that same seed. That last check is the point.

`test/ui.mjs` now boots into a generated system, because it boots `main.js` the way the
browser does. Two assertions were name-dependent and are now layout-agnostic — one was
quietly passing `undefined` into `setTarget` after looking for a Gaia that no longer
existed.

## Not verified — staged, not measured

- **Nobody has flown a generated system.** It builds, it is internally consistent, and the
  economy has the inputs it needs. Whether an 18-world red-dwarf system is *pleasant* to
  cross at warp speed is a question the suite cannot ask.
- **Moons, rings and Lagrange points are still rolled by the world builder**, not by the
  plan. They are seeded and deterministic, so this is consistent — but it means the plan is
  not yet the complete description of a system, and `GENESIS_VERSION` does not cover them.
- **The system name is derived by stripping " Prime" off the star.** Fine for generated
  names, and correct for Solaris; a future authored layout could break it.
- **Belt `count` can reach 310 rocks per field on four fields.** The old system capped at
  660 rocks total; a generated one can reach ~1,240. Not profiled on a phone.

## Next

**.34 — "Boardroom"**: the Ops relayout. Contract, commission, build, corp and fleet as
first-class tabs on a command surface rather than tabs on a flight overlay.
