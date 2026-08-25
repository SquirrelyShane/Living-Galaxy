# PATCH v1.02.35 — "Work Orders"

Every hull the yard sells now has work it can be given. Schema **18 → 19**.

Per the plan: **jobs this patch, the staff / conscription / fleet interface rework next.**

---

## The hole, exactly as reported

`FLEET_ROLES` sells six roles. `FLEET_ORDER_TYPES` declares eligibility in a `requires`
list. **No order type in the game listed `build`.** You could commission a construction
hull, pay 14,000 credits for it, watch it sit on a pad, and find there was nothing on the
dispatch board it could accept. Not a bug in the ship — a missing row in a table, which is
worse, because nothing crashed and no suite noticed.

`merc` was nearly as bad: two jobs, both of which a plain patrol hull did equally well, so
paying the mercenary premium bought you nothing. And `station_keep` listed four roles out of
six — a mercenary was the only hull in the game that could not hold a berth.

Coverage before and after:

| role | before | after |
|---|---|---|
| combat | patrol, escort, station_keep | + hunt |
| merc | patrol, escort | + hunt, salvage, station_keep |
| mine | extract, survey_pass, station_keep | + prospect |
| haul | logistics, station_keep | + salvage, arbitrage, tender |
| trade | logistics, survey_pass, station_keep | + arbitrage, prospect, tender |
| **build** | **nothing at all** | **construct, salvage, prospect, tender, station_keep** |

## Six new jobs, each with a real body

Every one obeys the rule at the top of `fleet-work.js`: **the accrual is gated on something
being true in the world, never on the clock.** A job that pays a stipend for existing is an
idle-clicker.

**Construction** — the `build` role's headline, and it takes all three work sources because
one would have made it a single-purpose ship:

- *Company order book* — the executive orders a station module; the builder converts
  treasury into installed value over time and, at 100%, the module is **really attached**
  with its real service bonus. This is the one that compounds.
- *Contract labour* — paid work on the world's own scaffolds (`S.sim.sites`), which have
  accepted delivery since v0.4 and never had a company crew turn up. Builds their thing,
  pays your people.
- *Auto* — company work if there is any, contract otherwise.

Ordering does **not** charge up front. The treasury is billed as the work goes in, so a
cancelled project has cost you exactly what was built — which makes cancelling a real
decision rather than a free undo. A company that runs out of money does not get a
half-price station; its builders idle at the site with nothing to install, and say so.

**Salvage** — the field is already full of wreckage. `S.world.loot` is populated by every
kill in the game and until now could only be collected by the player personally flying over
it. A company hull that recovers it turns somebody else's firefight into your revenue.

**Bounty hunt** — a patrol waits on a lane and is paid for deterrence; a hunt goes and finds
the thing. It pays the bounty and only the bounty, the quarry **shoots back**, and the
hunter breaks off at 34% hull rather than dying for the contract.

**Prospecting** — deepens the assay on a *field*, which is the number `assayOf()` already
reads to price an extraction order. Paid on the gain, not the time: a fully surveyed field
pays nothing and tells you to move the ship.

**Arbitrage** — picks the *pair*, not just a market. Widest spread in the system, buy low,
sell high, and it books **profit, which can be negative** — prices move while the ship is in
transit, and that is the actual risk of the trade. This is what makes `trade` a different
ship from `haul` rather than a reskin.

**Fleet tender** — the first order type whose subject is your own fleet. Runs repairs out to
damaged hulls so they do not have to abandon an objective and fly home. Repairs are billed
to the treasury, because a tender is a cost centre that buys uptime.

## The coverage matrix is now a rule, not a claim

`test/jobs.mjs` walks `FLEET_ROLES` and asserts every role clears a floor of three jobs. A
seventh sellable hull with no work is a **red suite on the day it is added**, rather than a
player report three patches later. Same shape as `test/reachability.mjs`.

It also asserts every order type has a **door in the command dialogue**. A job that exists
in the table but has no leaf in `data/command-menu.js` is reachable only from ARIA or the
console — the same "I can't give this ship that job" complaint wearing a different hat. Two
new desks were added to the tree for this: **Construction** and **Support**.

## Two bugs found on the way

**A v1 save had silently become unloadable.** `migrate()` capped the walk at a hardcoded 17
hops. Schema 18 shipped without touching it, so the oldest saves in existence quietly
stopped loading — and nobody noticed until schema 19 pushed a v1 payload one step further
and `test/core.mjs` went red. The cap is derived from the chain's own length now, so adding
a migration cannot start rejecting history again.

**`station_keep` was missing `merc`.** Present in every other role list; absent in exactly
one. The coverage matrix would have caught it years earlier.

---

## Files touched

**New**

- `src/systems/fleet-projects.js` — the company construction order book
- `test/jobs.mjs` — 112 checks

**Changed**

- `src/systems/orders.js` — six new order types; `merc` added to `station_keep`
- `src/systems/fleet-work.js` — six step functions and their tuning block
- `src/data/command-menu.js` — Construction and Support desks
- `src/systems/company.js` — `projects` in the restore defaults
- `src/systems/save.js` — the hop-cap fix, v18 → v19 migration
- `src/core/config.js` — `COMPANY.projectCap`
- `src/core/version.js` — 1.02.35 "Work Orders", **schema 19**
- `test/all.mjs`, `test/genesis.mjs`, `CHANGELOG.md`, `docs/EXECUTIVE_ARC.md`

## Verified

`node test/all.mjs` — **47/47 suites green**, 64.6 s.

`jobs` 112/112:

- Every role clears the three-job floor; every `requires` entry names a role the yard sells;
  every order type is crewable, fully declared, and has a menu door; every menu leaf offers
  its job to a role that can actually take it.
- **Every role/job pair in the matrix dispatches and survives thirty seconds of work** — 30
  pairs, driven on real hulls in a real world. This is the check that would have caught the
  original hole.
- Construction end to end: a module ordered, built, **and really attached to the station**;
  the treasury actually charged; ordering not charging up front; the cap enforced; the same
  module refused twice at one berth; cancelling reporting what was spent.
- The order book serialises, restores with progress intact, and issues fresh ids afterwards
  so a restore cannot collide.

`screens` caught two menu labels overflowing the 34-character portrait budget — the kind of
thing that is invisible until it is a truncated button on a phone.

## Not verified — staged, not measured

- **The fleet interface is unchanged.** This patch adds twelve order types to a UI built for
  six, reached through a dialogue tree that is now seven branches deep on a phone. It is
  *reachable*, not *pleasant*. That is .36 and it is the bigger half of your request.
- **None of the six new jobs has a balance pass.** Every rate in the tuning block was chosen
  to make the behaviour legible in a log, not to sit correctly against extraction and
  logistics income. Arbitrage in particular can probably be farmed.
- **Hunt resolves combat by direct HP subtraction**, not through the projectile system. The
  outcome is real and can go badly, but a company hull in a fight is not simulated the way
  an NPC-vs-NPC fight is.
- **Tender repairs hull only** — not shields, armour or module condition.
- **Contract construction pays a flat rate per unit of scaffold advanced**, with no quoted
  fee or deadline. It is labour, not a contract, despite the name.

## Next

**.36 — "Boardroom"**: the staff tab, the conscription tab, the command dialogue and the
fleet list, rebuilt for a command surface rather than grown out of a flight overlay — with
twelve job types and a construction order book to display, which is now the actual problem.
