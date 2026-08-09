# PATCH v1.01.70 — "Consignment"

Two items off the carried list, and they turned out to belong together. Cargo that is
actually aboard something, and modules that wear out. Save schema 15 → 16 (migration
included). 32 suites, **2,637 checks**, all green.

Both were named in patch notes I wrote myself — hauler cargo in v1.01.00, module wear
deferred out of v1.00.20 and carried through v1.00.60 — and both had sat in the "carried"
column long enough to become furniture. `docs/OPEN_ITEMS.md` is the list they came off.

---

## Why these two in one slice

They look unrelated and they answer the same complaint: **the ship and the world were both
stateless in a way that made choices not matter.**

A hauler's cargo was notional. A deal recorded a commodity and a mass; `settle()` conjured
that mass onto the destination market; nothing was ever aboard anything. So a laden hauler
and an empty one were the *same target* — shooting either paid the fixed `salvage` figure
for that hull type. Two slices went into building trade lanes that a pirate had no reason to
touch and a player had no way to raid.

A module's condition did not exist. A fit was a set of numbers that never changed between
the moment you bought it and the moment you sold it, which meant the only fitting decision
in the game was made once, at a station, with full information.

Both are the same shape: something the player does that leaves no trace. Cargo fixes it
outward, wear fixes it inward.

---

## Cargo is real

`src/systems/holds.js`. A hold is a bag of commodity masses on a ship's `userData`, filled
and emptied by the routines that already fly it.

**Capacity is declared per NPC type**, not derived from hull size — the same argument
`SHIP_CLASSES` makes for heat capacity. Deriving it from a display radius would have made
the bastion the best freighter in the game. A type absent from `HOLD.cap` has no hold and
cannot be laden, which is the honest answer for a drone and is what stops the spill path
inventing cargo on ships that were never carrying any.

**Haulers load at pickup.** The pickup stage used to be a waypoint and nothing more. The
cargo now goes aboard there, capped by the ship's own capacity, so an overweight job is
carried short rather than teleported.

**Settlement delivers what the carrier is carrying.** This is the one place the slice had to
change an existing rule rather than add one. A hauler raided down to an empty hold used to
deliver in full. It now delivers what is left — and *still settles*, because they flew the
run: the deal discharges, both parties file the memory, the pay is the pay. What is missing
is the cargo, which is exactly the thing the raider has.

**Miners were extracting ore into nowhere.** `u.mined` was a counter nothing anywhere read.
`mineAsteroid()` really did deplete the belt, and then the ore ceased to exist — six ships
working a field whose output had no destination, and a market that never saw a kilogram of
it. Ore now goes into a hold, and a full hold goes to a station and is sold, which moves
that station's book the way the player's load does.

**A spill is never the whole hold.** `HOLD.spillFraction` is the design decision in the
file. If interception recovered everything, hauling would be strictly worse than raiding and
the trade layer would collapse into a shooting gallery. Losing about half to the closing
speed makes piracy a real living and still worse than being paid. Measured: a hauler at
capacity spills roughly 7,400 credits of ore against the 638 its fixed salvage was worth —
an eleven-fold difference between a laden target and an empty one, where before there was
none.

**Somebody standing over the wreck takes a share first.** When the kill was not the
player's, the nearest ship with a hold and no bloc loyalty to the deceased helps itself
before the rest scatters. So the loot on a pirate is no longer a fixed number: it is the
last hour of that pirate's afternoon.

**Holds are deliberately not persisted.** NPCs are not saved — `serializeSim()` persists
*places* and respawns ships around them, which is the pattern v0.5 chose. A hold rides on a
ship and dies with one. What survives a reload is what the cargo *did*: station stock, and
the ledger record. `test/cargo.mjs` asserts the save contains no holds, so this stays a
decision rather than becoming an oversight.

---

## Modules wear out

`src/systems/wear.js`. Condition per hardpoint, 1 down to `WEAR.floor`.

**There is no clock in the file, and that is the whole design.** A decay rate is rent: it
costs the same whether the hour went on a knife fight or a berth, it creates exactly one
decision — station now or later — and it punishes playing rather than pricing anything.
Every channel is instead an event the pilot chose: a shot fired wears that barrel and no
other, a hit taken wears core and utility, a second of cruise wears the core, a second of
beam wears utility. A pilot who docks and trades wears nothing out. `test/wear.mjs` asserts
the absence directly — no `update` export, no read of `S.time` — so if a tick is ever added,
that is what stops it.

**Condition is keyed on the hardpoint, not the module key.** The v1.00.70 lesson about
weapon groups, applied again: it belongs to the slot the pilot edits. Keying on the module
would make selling a worn gun and rebuying the same model a free repair, and would give two
identical mounts one shared wear figure.

**A worn module gives less and draws more.** The second half is the interesting one. Rising
draw pushes a fit that was inside its power and CPU budgets toward the overload curve v0.7
already built, so neglect does not produce a new failure mode to learn — it makes an
existing one arrive early. The pilot watches the Draw readout they already watch and sees it
creep.

**Nothing is ever destroyed.** `WEAR.floor` is the worst a module reaches, for the same
reason `BUDGET.maxPenalty` exists: a fit you cannot fly home is a soft-lock, and the moment
it would bite hardest is the moment it would be least fair.

**Heat multiplies everything**, which gives the thermal budget a second consequence beyond
the tempo one v1.00.60 built — the pilot who ignores the heat bar now pays after the fight
as well as during it.

**An engineer on watch slows it**, and this is the answer to a question the crew slices left
open: what is an engineer *for* outside a fight? Damage control is reactive. This is the
post paying for itself while nothing is happening. It prevents a fraction, never all of it —
a post that stopped wear entirely would delete the mechanic for everybody by the second hour.

---

## The rates were wrong, and I only know that because I measured them

The first set was written by feel. Measured afterwards, against the thresholds the fitting
screen actually uses:

| channel | first cut | after |
|---|---|---|
| weapons | warn after **24 s** of continuous fire | 213 s (≈1,120 rounds, ≈28 fights) |
| warp | warn after **2.7 min** of cruise | 16.4 min |
| mining | warn after **2.2 min** of beam | 27.3 min |

Off by roughly an order of magnitude in every channel, and in the direction that would have
made the whole system a chore on a two-minute timer — which fails the constraint the block
was written against. **A bill that arrives every few minutes is rent whether or not the
clock driving it is called an event.**

Mining ended up gentler per second than anything else, deliberately: it is the only channel a
pilot runs *continuously*. A fight is seconds of trigger inside minutes of manoeuvre and a
cruise ends when you arrive, but a belt session is an unbroken half hour of beam. At parity
it was warning after two hold-fills.

This is the third slice running where a shipped number turned out to be an estimate that a
five-minute script falsified. It is now going in the process section below rather than being
learned again.

---

## Two screens, because a mechanic without one is not shipped

**The fitting screen** shows condition on any hardpoint below `WEAR.warnAt` and nowhere else
— a module at 97% is not information, it is noise on every row forever. The thresholds are
the ones `WEAR` uses to decide when to speak, so the panel and the ship cannot drift apart.
Weapon damage shown is the damage the gun will *actually do*, condition included: a readout
quoting the rated figure while the barrel delivers less is a lie the pilot has no way to
catch, and they would simply conclude the damage numbers are broken.

**The dock's service tab** carries one row beside armour and hull, because a pilot who docks
to repair should not have to know that a second, differently-named kind of damage lives on
another screen.

**The scanner** reports load at tier 2 and the manifest at tier 3. The split is the decision
a raider actually makes at range — *is that one worth closing on at all* — and answering it
at the same tier as the manifest would collapse two decisions into one. A ship with no hold
reports nothing rather than "0 kg", which would imply a hold it does not have.

---

## A test that had been passing for the wrong reason

`test/run.mjs` asserted `mined > 20` against `u.mined`. That counter was cumulative across
the whole file, so the assertion was satisfied by earlier blocks — and NPC mining does not
run while the player is parked 45,000 km away, which is exactly what the block does two lines
earlier to stay out of the way. **The window it claimed to measure was extracting zero.**

It now measures what the belt lost against a baseline taken at world build, plus a second
check that the ore is somewhere: aboard a miner, or already sold into a station's book. A
belt that depletes into nothing is the bug this slice replaced, and it is worth a check of
its own.

Generalisable, and the same shape as the counter it was reading: **a cumulative assertion
inside a scoped window measures the wrong scope.** If a check is about what happened in these
sixty seconds, it has to subtract.

---

## Nearly shipped: an unreachable verb and an inert key

Both caught before the gate, by the discipline rather than by luck.

`transferToPlayer()` was written into `holds.js` for a player-boarding path this game does
not have — mercs board you, you do not board them. Cut, rather than registered as a verb
with no door.

`HOLD.scoopFraction` would have landed in the inert-config list `test/reachability.mjs`
prints. It is now what the scoop path reads.

---

## Files

**New** — `src/systems/holds.js`, `src/systems/wear.js`, `test/cargo.mjs`, `test/wear.mjs`,
`PATCH_v1.01.70.md`

**Changed** — `src/core/config.js` (HOLD and WEAR blocks), `src/core/state.js` (condition
into `recalcStats`), `src/core/version.js`, `src/systems/fitting.js` (condition-aware
bonuses, still pure), `src/systems/weapons.js`, `src/systems/combat.js`,
`src/systems/warp.js`, `src/systems/mining.js`, `src/systems/deals.js`,
`src/systems/scanner.js`, `src/systems/preflight.js`, `src/systems/crew.js`,
`src/systems/save.js`, `src/entities/npcs.js`, `src/ui/fitting.js`, `src/ui/dock.js`,
`index.html`, `package.json`, `test/all.mjs`, `test/reachability.mjs`, `test/run.mjs`, and
nine suites for the schema bump.

Both new verbs are registered in `test/reachability.mjs` and wired — a slice that adds a
player-facing verb does not close until something calls it.

---

## Verified vs not

**Verified:** a hold loads, trims an overweight load rather than refusing it, and unloads
what is actually there; a ship with no declared capacity cannot be laden at all; a spill is
the configured fraction, capped at `HOLD.spillMax` lots taking the largest first, and a trace
load is not worth a container; a wreck drops its cargo *and* its salvage, and its hold does
not survive the ship; a nearby hostile scoops a share and only a share; a raided hauler still
settles, records what landed, and the destination receives the short load rather than the
paper one; a manifest reads back and an empty hauler reads as running empty while a drone
reports no load at all; the save carries no NPC holds. On wear: there is no tick and no clock
read in the module; each channel wears its own hardpoints and no others; an empty hardpoint
cannot accrue; a structure hit costs more than an armour hit; heat multiplies by the
configured factor; an engineer prevents the configured fraction and not more; a worn module's
effect falls and its draw rises, never below the floor, and the fit sits closer to its power
ceiling as a result; servicing is refused under way, refused when broke without touching the
balance, charges what it quoted, and finds nothing to do twice running; condition round-trips
through the save, clamps junk in both directions, and a v15 save migrates forward yard-fresh.

**Not verified — and worth saying:**

- **The rates are calibrated against activity, not against a session.** I measured how long
  each channel takes to reach a threshold and tuned to that. What nobody has measured is how
  those channels *combine* over a real hour, where a pilot fights, cruises and mines in some
  proportion I am guessing at. The three could add up to a service bill every twenty minutes
  even though each looks like an hour on its own — and that is precisely the shape of failure
  the 1.0 hardening pass found in the economy. **Measure the products, not the terms**, and I
  have measured the terms.
- **The service cost is not weighed against income.** Three neglected modules on a mixed fit
  quote about 4,600 credits. Whether that is a detour or a rounding error depends on what an
  hour earns, which is the same comparison v1.01.60 said was missing for research and which
  is still missing.
- **NPCs do not wear.** Only the player's fit has condition. That is the same asymmetry
  ammunition and heat had for three slices before v1.00.80 closed it, and it is an
  asymmetry rather than a decision.
- **Nothing intercepts a hauler on purpose.** The cargo is real and a laden ship is now worth
  eleven times an empty one — but no NPC *decides* to raid a trade lane. `appraise()` in
  `npc-tactics.js` reads physical budgets and grudges, not cargo. Until it does, the richer
  target is an opportunity the world does not take, and this slice has built the payoff for a
  behaviour that belongs in the NPC line.
- **The player cannot post a job in anything but ore.** The freight board still hardcodes it,
  which was true before this slice and is more visible now that a manifest can say otherwise.
- **Neither new screen has been opened on a phone.** The fitting slots tab gains a service
  button per hardpoint plus a whole-ship row; the dock service tab gains a row. That is now
  four tabs shipped untested on the target device across three slices, and it is starting to
  be a pattern rather than an oversight.
