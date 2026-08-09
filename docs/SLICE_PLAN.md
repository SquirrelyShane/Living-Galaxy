# Living Galaxy — slice plan

The codebase is cut into eight vertical slices. One slice per patch, one patch per
version bump, each shipping with its own `PATCH_vX.Y.md`, its own tests, and a zip.
The order is dependency order: nothing later can be done safely until the foundation
under it holds.

A slice is done when `node test/all.mjs` is green and the patch note lists every file
touched with a reason.

| Slice | Version | Name | Files | Status |
|---|---|---|---|---|
| 1 | **0.2.0** | Core & Platform | `core/*`, `systems/save.js`, `main.js`, `test/*` | **shipped** |
| 2 | **0.3.0** | Flight & Navigation | `entities/player.js`, `systems/warp.js`, `approach.js`, `navplan.js` | **shipped** |
| 3 | **0.4.0** | Combat & Weapons | `systems/damage.js`, `broadphase.js`, `projectiles.js`, `combat.js`, `weapons.js` | **shipped** |
| 4 | **0.5.0** | World & Simulation | `systems/reputation.js`, `detection.js`, `worldsim.js`, `npcs.js` | **shipped** |
| 5a | **0.6.0** | Character & Career | `data/origins.js`, `systems/character.js`, `missions.js`, `ui/creation.js` | **shipped** |
| 5b | **0.7.0** | Economy & Contracts | `systems/contracts.js`, `fitting.js`, `market.js` | **shipped** |
| 6 | **0.8.0** | Interface & Input | `ui/hud.js`, `settings.js`, `systems/input.js`, `display.js` | **shipped** |
| 7 | **0.9.0** | Render & Presentation | `systems/quality.js`, `world/interpolate.js`, `lod.js`, `audio.js` | **shipped** |
| 8 | **0.10.0** | Network & Assistant | `systems/net.js`, `netsync.js`, `tools.js`, `server.py` | **shipped** |
| — | **1.0.0** | Hardening | balance pass, soak test, docs, no new systems | **shipped** |

---

## Slice 1 — Core & Platform (0.2.0, shipped)

The layer everything else stands on: build identity, determinism, the simulation clock,
fault containment, and a save format that can be changed without destroying flights.

Delivered: `core/version.js`, `core/clock.js`, `core/diagnostics.js`, RNG streams in
`core/rng.js`, save schema v3 with a migration chain, export/import and a backup slot,
`test/core.mjs`, `test/all.mjs`, `package.json`. See `PATCH_v0.2.md`.

## Slice 2 — Flight & Navigation (0.3.0, shipped)

Delivered: `systems/navplan.js` (visibility graph + A*, 1200/1200 clear across a 20-seed
sweep), assist rebuilt as authority-limited RCS and retrograde burn, drift/slip telemetry
and a HUD readout, progress watchdogs on both autopilots, mass-scaled warp drain, spool
interruption under fire, mid-cruise retargeting, `test/flight.mjs`. Three latent bugs
fixed: A* dropping each route's first waypoint, obstacle ranking that plotted courses
through the star, and moons left at the origin until the first frame. See `PATCH_v0.3.md`.

Deferred to later slices: warp energy read from *fitted core modules* rather than hull
mass — that needs the power/CPU budget work in slice 5, so cruise drain currently scales
with loaded mass instead, which is the same idea without inventing a fitting API twice.

## Slice 3 — Combat & Weapons (0.4.0, shipped)

Delivered: three damage types against shield/armour/hull resistances, one shared damage
resolver replacing three longhand copies, range falloff on every weapon, a uniform spatial
hash broadphase (254 ms → 70 ms on identical work, and proven to agree with a full scan on
every test segment), missiles that carry their own lock and can lose it outside a seeker
cone, decoy buoys that finally do something, point defence as real in-flight interception
rather than a dice roll after impact, and per-hull engagement envelopes. `test/combat.mjs`.
See `PATCH_v0.4.md`.

Honest note on the broadphase: it is a scaling win, not a constant-factor win. At the
current 63-ship roster and ~1 round in the air it is a wash against a tight linear scan.
It was built now because slice 4 is the one that makes the roster big, and retrofitting a
broadphase into a combat system grown around the assumption of a full scan is much worse
than putting it in while the system is small.

## Slice 4 — World & Simulation (0.5.0, shipped)

Delivered: a three-bloc reputation matrix with no route to universal goodwill, detection as
a sensor-vs-signature contest that a pilot can influence by flying differently, population
driven by economic pressure instead of fixed counts, and schema 4 persisting reputation,
construction sites, territory claims, financed stations and belt depletion. `test/world.mjs`.
See `PATCH_v0.5.md`.

Notes for later slices: the belt persists as deltas against the seeded field rather than as
rocks, and a territory claim persists as a *place* that respawns its bastion rather than as
a ship reference — both patterns worth reusing when slice 5 persists contracts and station
inventories.

## Slice 5a — Character & Career (0.6.0, shipped)

Delivered: four-step creation (lineage / corporation / career / agent), four lineages
including the machine-descended Nexis defector, six lineage-gated corporations, five
careers, agents with per-lineage dialogue and a three-job chain each, two stacking
progression tracks (use-based skills scaled by affinity, plus spendable points), licences
as a soft-then-hard hull gate, and a Pilot tab. Schema 5. `test/character.mjs`.
See `PATCH_v0.6.md`.

Split note: this was originally one slice with the economy work. Character creation turned
out to be the thing the contract board *depends* on — a board with no career, no standing
requirement and no skill payout is just a list — so it shipped first as 5a and the economy
follows as 5b.

## Slice 5b — Economy & Contracts (0.7.0, shipped)

Delivered: a generated, expiring contract board gated and priced on reputation; power and
CPU fitting budgets that degrade rather than refuse; station supply chains that turn the
price book into information. Schema 6. `test/economy.mjs`. See `PATCH_v0.7.md`.

Carried forward to 0.8: crew posts with fatigue, and warp energy from fitted core modules
(deferred out of slice 2). Both want the crew UI work in slice 6 to land first, so they
travel with it rather than being built twice.

Tuning note worth keeping: the first cut of the budgets could not be exceeded by any legal
fit. Whenever a limit is added, measure the worst case the game can actually produce and
tune against *that*, not against a formula that looks reasonable.

## Slice 6 — Interface & Input (0.8.0, shipped)

Delivered: a diffing HUD write budget (0.35 writes/frame flying, down from ~11.5
attempted), four threat palettes with a colour-blind-safe default path, text scale and
reduced motion, an action-table input layer with rebinding and gamepad support, a settings
and diagnostics overlay over the slice-1 telemetry, plus the two carried items — crew
fatigue and warp draw from fitted core modules. `test/interface.mjs`. See `PATCH_v0.8.md`.

The nav map was already canvas with pan, zoom and filters as of the 0.1 line, so that
slice-plan item needed no work; it is noted here so the omission does not read as a gap.

Pattern worth reusing: putting the palette entirely in CSS custom properties means no code
path branches on it, so a colour scheme cannot introduce a logic bug. The same shape would
work for any future theming.

## Slice 7 — Render & Presentation (0.9.0, shipped)

Delivered: adaptive quality driven by p95 frame time with hysteresis and asymmetric
drop/climb rates, render interpolation consuming the `clock.alpha` that slice 1 computed
and never used, screen-size LOD with culling, and an audio mix with buses, ducking,
positional sound and a generated music bed. `test/render.mjs`. See `PATCH_v0.9.md`.

Two patterns worth carrying into slice 8:

- **Interpolate, never extrapolate, and always restore the authoritative value.** The
  network slice needs exactly this for remote ships, and the machinery is now built — a
  remote position buffer is the same shape as a local one, just fed from the wire.
- **Measure the thing the player feels, not the thing that is easy to average.** p95 rather
  than mean is what made the quality controller work; the same will apply to latency.

## Slice 8 — Network & Assistant (0.10.0, shipped)

Delivered: host authority for shared NPCs (the oldest pilot simulates the world, the relay
only decides who is allowed to), clock synchronisation on a min-RTT estimator, a snapshot
buffer rendering remotes 280 ms in the past, delta-encoded state, reconnect with resume
tokens, and eleven ARIA instruments that act on live game state. `test/netsync.mjs`,
`test/tools.mjs`, and `test/net.mjs` expanded to 25. See `PATCH_v0.10.md`.

Two things worth recording for 1.0:

- **The relay still contains no game logic**, and that was worth protecting. Every design
  choice here — host authority rather than server simulation, a client-side buffer rather
  than server reconciliation — exists to keep `server.py` a stdlib file that runs in Termux
  with nothing installed. That property is why anyone can host at all.
- **Shared hostile NPCs are not authoritative PvP.** Pilot-versus-pilot damage still
  resolves on the shooter's client. That is a different design with different failure
  modes, and pretending this slice delivered it would be dishonest.

## Hardening (1.0.0, shipped)

Delivered: an eighteen-fold economy correction (a full industrial hold was worth thirteen
times the most expensive hull in the game), licence fees rebased on hull value, progression
and combat pacing slowed to something a campaign can occupy, a two-hour soak test that
found no leaks, and the README rewritten as one document. `test/soak.mjs`.
See `PATCH_v1.0.md`.

The lesson worth carrying forward: **every number in this game was individually reasonable
and the set of them was not.** Hold sizes, commodity prices and hull prices were each set
sensibly, in the 0.1 line, by someone not looking at the other two. Nothing caught it for
eight slices because no test multiplied them together. The balance harness that found it is
twenty lines; the fix touched six files.

Whatever is built next, measure the *products* — income per minute against cost, time to
rank against session length, damage per second against hull points — not the terms.

### Still missing at 1.0

Stated plainly, because a 1.0 that pretends otherwise is worth less than one that says so:

- **Authoritative PvP.** Pilot damage still resolves on the shooter's client.
- **One system.** Solaris is deep and persistent, but warp goes nowhere else.
- **Crew posts are shallow.** Fatigue landed in 0.8; per-station assignment did not.
- **The nav map is functional, not beautiful.**

Each is a slice, and each would be built the way the last eight were: one coherent system,
a patch note that says what was wrong before, and tests that prove the property rather than
the implementation.


---

# Technical hot slices (post-1.0)

Ten focused passes over systems that 1.0 shipped working but shallow. Each takes one
subsystem, asks what a player actually *does* with it during a flight, and builds the
answer. Numbered v1.00.10, v1.00.20, and so on, so they sort cleanly against 1.0.0.

| # | Version | Name | Status |
|---|---|---|---|
| 1 | **v1.00.10** | Crew — posts, watches, morale, casualties | **shipped** |
| 2 | **v1.00.20** | Equipment, blueprints & planetary industry | **shipped** |
| 3 | **v1.00.30** | Locking, silence, crew depth & delegation | **shipped** |
| 4 | **v1.00.40** | Solar system & celestial bodies | **shipped** |
| 5 | **v1.00.50** | Rings, Lagrange points & deep-space anomalies | **shipped** |
| 6 | **v1.00.60** | Ammunition & thermal load | **shipped** |
| 7 | **v1.00.70** | Weapon groups & the loadout panel | **shipped** |
| 8 | **v1.00.80** | NPC tactics & a brain that decides | **shipped** |
| 9 | **v1.00.90** | NPC exchange layer | **shipped** |
| 10 | **v1.01.00** | The deal ledger | **shipped** |
| 11 | **v1.01.70** | Real cargo & module wear | **shipped** |
| 12+ | — | see `docs/NPC_ROADMAP.md` and `docs/OPEN_ITEMS.md` | planned |
| 7 | v1.00.70 | — | planned |
| 8 | v1.00.80 | — | planned |
| 9 | v1.00.90 | — | planned |
| 10 | v1.01.00 | — | planned |

## 1 — Crew (v1.00.10, shipped)

Delivered: speciality and post split into two fields so moving somebody is free and
retraining is the expensive operation; watches with auto-rotation that uses separate
thresholds in each direction and never empties a manned post; morale driven by five
inputs rather than one; injury and death from hull breaches, healing faster with damage
control manned; and the recruiting board moved out of a mesh property and into persisted,
refreshing, deterministic state. `test/crew.mjs`. See `PATCH_v1.00.10.md`.

The pattern worth repeating: **the reason nobody used the old reassign was that it charged
for the reversible operation and the permanent one at the same rate.** When a system has a
cheap tactical use and an expensive strategic one, they need to be two verbs. Look for the
same shape in modules (swap versus refit), in fitting (a loadout you change per run versus
one you buy), and in contracts (declining versus abandoning — already right, and this is
why).

## 2 — Equipment, blueprints & planetary industry (v1.00.20, shipped)

Delivered: the crafting catalogue (76 materials, 235 blueprints with bills of materials, a
reverse index and a tree-expanding raw cost), a manufacturing queue running on game hours
that consumes materials at queue time, and the full planetary layer — planet type, command
centre, branch, facilities — with the PIC as its top tier. Schema 7. `test/industry.mjs`.
Also the nav-map/contacts target bug. See `PATCH_v1.00.20.md`.

Three patterns worth reusing:

- **One act, not two variables.** The target bug existed because selecting a thing and
  choosing where to fly were separate state with separate writers, and only one of them was
  on screen. Whenever two pieces of state are always meant to agree, make one of them
  derived or make the write single.
- **Declare requirements, not whitelists.** Facilities say "solid surface, tier 2" rather
  than naming fifteen planet types. The planet table will keep growing and a whitelist
  silently stops covering it.
- **An empty list is not permission.** A blueprint with no materials reads as "needs
  nothing" unless something explicitly says otherwise. The same shape will appear again
  wherever data is optional — an empty requirements array, an empty resistance table.

Deferred from this slice, to be picked up in a later equipment pass: ammunition actually
being *consumed* by weapons (the catalogue and the stock exist; the firing path still draws
from nothing), module condition and wear, weapon groups, and a heat budget.

## 3 — Locking, silence, crew depth & delegation (v1.00.30, shipped)

Reordered ahead of celestial bodies because these were the things actively wrong.

Delivered: three distinct combat ranges with a real lock state machine (the old test had no
distance check in it whatsoever), weapon classes so seekers and drone shoals reach further
than they lock, a mute that actually mutes, event-driven crew experience replacing an idle
trickle that levelled a docked ship to the cap, crew needs and breaks, resolve used
symmetrically for persuasion and enemy influence, promotion to overseer, standing orders,
and a ledger. `test/crew.mjs` at 153, `test/combat.mjs` at 78. See `PATCH_v1.00.30.md`.

Three patterns worth carrying:

- **A pointer is not a state.** `target && target.isPlayer` looked like a lock and was a
  reference. Anything with a duration — a lock, a lease, a claim — needs a state machine
  with an acquire, a hold and a break, or it will never end.
- **Hysteresis has a direction.** Acquire range exceeded drop range, so the system
  oscillated by construction. Whenever two thresholds bracket a state, check which is
  larger *in the units they are actually compared in*.
- **A resistance stat should cut both ways.** Resolve is the same roll for your persuasion
  and for an enemy's influence. A stat that only ever helps the player is a strictly-better
  number, not a characteristic.

## 4 — Solar system & celestial bodies (v1.00.40, shipped)

Carried from slice 3, now with a reason to care about a world beyond its resource table.

Delivered: nine moon classes so a moon is a typed world rather than a grey sphere (and can
finally host a site at all); the survey rebuilt on the real twenty-type table so the scan
agrees with what the ground actually yields; nineteen surface features with derived
discovery; atmospheric interference that makes the orbit-band menu a decision; and an
analytic ephemeris that reaches navigation — lead targeting, arrival ranges and transfer
windows. Plus three latent planner faults the slice exposed. `test/celestial.mjs`.
See `PATCH_v1.00.40.md`.

Four patterns worth carrying:

- **A table grew and a consumer did not.** Both headline bugs are this shape, and neither
  could be caught by a unit test — each function was internally consistent and only wrong
  relative to another file. Whenever a table is the authority for something, the consumers
  need a test that reads the table rather than a copy of its keys.
- **Derive discovery, don't store it.** Features needed no schema bump because what you
  know is a function of two things already persisted. A save from the previous version
  arrives already knowing what it earned. Look for the same shape anywhere a new system
  wants to record "has the player seen this".
- **An undeclared key is don't-care; a declared `false` is a requirement.** Collapsing the
  two with `if (needs.x)` is a one-character bug that puts airless-only features on
  greenhouses.
- **Plan to where the ship actually stops.** The planner had always planned to a point the
  warp core never reaches, and the last stretch — which is never flown — was inventing
  impossible corridors.

Deferred, deliberately: mineable ring fields need planet-parented asteroid records, which
touches the mining path, the broadphase and the nav-map contact list. That is a coherent
piece of work rather than a tail on this one, and it travels with Lagrange points and
deep-space anomalies in v1.00.50.

## 5 — Rings, Lagrange points & deep-space anomalies (v1.00.50, shipped)

Delivered: mineable ring fields around ringed giants (the first rocks in the game that do
not orbit the star), `systems/fields.js` as the single place that knows a belt from a ring,
L4/L5 points derived rather than generated, six one-shot deep-space anomalies, and — the
thing all of it depended on — the gravity-well rewrite. Schema 10. `test/celestial.mjs` at
214. See `PATCH_v1.00.50.md`.

Three patterns worth carrying:

- **A number read as the wrong quantity is worse than a number tuned badly.** `gravity` is
  surface gravity, not mass, and reading it as mass made a moonlet project a shadow
  thirty-seven times its own radius. Two patches in v1.00.40 went into teaching the planner
  to cope with that geometry; none of them were the fix.
- **When you shrink a number, check what was clamping it.** The arrival floor never bound
  before and bound on everything after, so the well shrink would have been invisible.
- **A one-shot place is not a belt.** An anomaly you can re-roll is a slot machine; an
  anomaly that gates progression is a fetch quest. It has to be able to pay nothing.

Still carried: the goal-side bypass ring for the planner's near-conjunction geometry. The
shorter wells make that case much rarer, which is why it slipped rather than why it is fixed.

## 6 — Ammunition & thermal load (v1.00.60, shipped)

Two of the three items deferred out of v1.00.20. Delivered: ammunition feeds derived from the
catalogue's own compatibility prose, magazines with fractional draw and auto-chamber, armour
penetration inside the damage-type system, thermal load with a latched cutout, and station
resupply. `test/ordnance.mjs` at 110. See `PATCH_v1.00.60.md`.

Three patterns worth carrying:

- **A threshold checked after the thing that moves it away from the threshold never trips.**
  The heat cutout read correctly and was unreachable, because venting ran before the
  comparison and the accumulator clamped at the line.
- **Check which direction a number points before building a mechanic on it.** `DAMAGE.resist`
  holds multipliers, not resistances, so "penetration lifts resistance toward 1" made AP
  rounds worse against armour.
- **Two budgets are worth more than one twice as tight.** Running dry is a supply problem you
  solve before undocking; overheating is a tempo problem you solve mid-fight. Either alone
  leaves half the trigger unexamined.

Carried: module wear, the third deferred item. Still nothing on NPC ammunition or NPC heat —
an asymmetry rather than a decision.

## 7 — Weapon groups & the loadout panel (v1.00.70, shipped)

Finishing v1.00.60 rather than starting something new. Delivered: two weapon groups with a
three-state trigger selector, falloff measured inside the firing volley, per-hardpoint
cooldowns, group-aware preflight, and the Magazine tab that makes chambering a round
something a player can actually do. Schema 11. `test/ordnance.mjs` at 153.

Two patterns worth carrying:

- **Key state on the thing the player edits, not on the derived list.** Groups hang off
  hardpoint indices; mounts are a filtered view of hardpoints, and keying on the view would
  have reshuffled a pilot's groups every time they emptied a slot.
- **A mechanic without a screen is not shipped.** v1.00.60 was green, tested and complete,
  and the choice it existed to create was unreachable. Worth asking of every slice: can a
  player do the thing, or only the code?

## 8 — NPC tactics & a brain that decides (v1.00.80, shipped)

Delivered: four stances driven by physical budgets, trait-derived nerve and remembered
grudges; NPC magazines and thermal cutouts, closing an asymmetry three slices old; and calls
for help filed from the damage path. `test/npc-tactics.mjs` at 74. See `PATCH_v1.00.80.md`.

Three patterns worth carrying:

- **A system nothing consults is decorative.** The persona memory was complete, tested and
  drifting traits correctly for five slices, and no decision anywhere read it. Worth asking
  of any state a slice adds: what *reads* this, and what changes if it is wrong?
- **Order the tests by how much they need to be true.** `appraise()` checks physical facts
  before opinions, because a ship out of ammunition does not need a view on you to know it
  should leave.
- **Simulate at the resolution you can show.** NPC budgets are one pool each rather than
  per-feed and per-group, because an NPC has no fitting screen. Detail a player cannot
  observe is cost without signal.

## 9 — Chatter: the NPC exchange layer (v1.00.90, shipped)

The first slice of `docs/NPC_ROADMAP.md`, which now carries the plan for the NPC line —
exchange, then agreements, then institutions, then faction projects, then deception.

Delivered: NPC-to-NPC messages that propagate between the speakers rather than around the
player; a topic table declaring what each side remembers; relationships derived from those
memories; gossip that carries reputation at conversational speed; and overhearing, so the
layer is visible. Schema 12. `test/npc-comms.mjs` at 64.

Two patterns worth carrying:

- **After this exchange, what is different about the world?** The cheap version of every
  social feature is to generate plausible text and skip the state change. The topic table
  makes the state change a required field, and the suite asserts it.
- **Derive relationships, do not store them.** A parallel relationship table would be a
  second source of truth that has to be bounded, migrated and kept in step with the memory
  it duplicates.

## 10 — Ledger: obligations between characters (v1.01.00, shipped)

Delivered: haulers (the trade layer needed somebody in it), the deal ledger with expiry and
default, reliability derived from memory, deliveries that move station prices, and jobs the
player can post into the same records NPCs use. Schema 13. `test/deals.mjs` at 61.

Two patterns worth carrying:

- **A declared requirement is only as good as the population that can satisfy it.** Two
  topics shipped in v1.00.90 required a role no ship had, and every check in the suite was
  about the shape of the table rather than about reachability.
- **Every obligation must be able to fail, and failing must be a fact.** A ledger whose
  entries only ever complete is a queue.

Subsequent NPC slices are planned in `docs/NPC_ROADMAP.md` rather than here.

## 11 — Real cargo & module wear (v1.01.70, shipped)

Two carried items that turned out to be the same complaint from opposite ends: the ship and
the world were both stateless in a way that made choices not matter. Delivered: NPC holds, so
a laden hauler is a different target from an empty one; settlement that delivers what the
carrier actually has; miners whose ore reaches a market instead of ceasing to exist; and
module condition accrued per event rather than per second. Schema 16. `test/cargo.mjs`,
`test/wear.mjs`. See `PATCH_v1.01.70.md`.

Three patterns worth carrying:

- **A counter nothing reads is a system that does not exist.** `u.mined` accumulated
  correctly for six slices while the ore it counted was being deleted. Same shape as the
  persona memory in v1.00.80 — worth asking of any state a slice adds: what *reads* this?
- **A bill that arrives every few minutes is rent whether or not the clock driving it is
  called an event.** Every wear rate shipped in the first cut was written by feel and was an
  order of magnitude too harsh. The design was right and the numbers would have made it feel
  exactly like the thing it was designed not to be.
- **A cumulative assertion inside a scoped window measures the wrong scope.** The belt check
  in `test/run.mjs` had been green for slices while measuring nothing, because the counter it
  read was lifetime and the window it claimed was sixty seconds.

Still carried: NPCs do not wear, which is the same asymmetry ammunition had before v1.00.80.
And nothing yet *decides* to raid a trade lane — the payoff is built, the behaviour belongs
in the NPC line.
