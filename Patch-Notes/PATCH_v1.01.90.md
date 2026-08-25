# PATCH v1.01.90 — "Work Orders"

Fleet objectives stop being countdowns. A hull can be converted to a different trade, bought
outright rather than found, and an extraction objective now produces ore, revenue and
progress instead of a timer running out. Schema stays **17**.

---

## The three reports, and what was actually wrong

**"There is no way to get a ship to go NPC mine for the executive."** True, and for two
independent reasons stacked on each other.

The first: a contract's `role` came from the NPC's type at signing and never changed.
`extract` requires `mine`. Conscript a patrol ship and the command tree refuses the order
forever — correctly, and with no way to do anything about it.

The second was underneath and worse: **an extraction objective did no extracting.**
`updateFleetOrders()` decremented a timer and completed. Nothing flew anywhere, no rock was
cut, no credit changed hands. Every fleet order type was in the same position — the layer
was a list that ticked.

**"Even saved up enough to buy an industrial ship but still unable to choose mine."** The
shipyard on the Ledger tab replaces *your own* hull. Your ship is not on the roster and
cannot be given an objective, so buying an industrial hull correctly changed nothing about
what the company could be told to do. Nothing in the game said so.

**"Passive mine should return on max ore hold to drop off and repeat."** That loop already
existed — `minerStep()` in `entities/npcs.js` has cut, filled, run in to a berth, sold and
gone again since long before the fleet layer. It was never connected to an objective, and
the proceeds went nowhere at all: `applyTrade()` moved the station's price and the ore
vanished.

---

## Refit

`FLEET_ROLES` in config is the table of trades a yard can fit, keyed by the role a fleet
order asks for rather than by hull type — the question is "I need this ship to mine", and
answering it should not require knowing that a miner is `NPC_TYPES.miner`.

`refitHull()` takes the money from the treasury, puts the hull in the yard for 45 seconds,
and brings it out converted. It has to be idle and near a station: converting a hull
mid-belt would make the whole roster fungible from anywhere and remove the only spatial
decision the fleet layer has. In-charter conversions cost less; the charter should mean
something.

The behaviour comes free. `npcs.js` dispatches its working routines on `userData.role` and
nothing else, so a hull that becomes `mine` starts running `minerStep()` on the next frame
without a line of AI being written. Damage is preserved across the refit — a conversion is
not a repair.

## Commissioning

`commissionHull()` buys a hull into the fleet from the station you are docked at. It spawns
alongside, already contracted, already fitted for the trade you ordered, and can be given
an objective immediately. This is what a player means by buying a ship for the company.

## Extraction that extracts

Two functions join `minerStep()` to the fleet layer:

- `extractionBerth()` — where a company hull takes its ore. The registered office by
  preference, but only when it is not more than 25% further than the nearest berth.
- `creditExtraction()` — the hull sold a load. Bank it against the charter, add it to the
  contract's record, and advance the objective.

**Objectives are measured in kilograms now, not seconds.** A countdown completes whether or
not a rock was cut, and it cannot express "keep going until I say stop". Active extraction
carries a quota and finishes when the ore is in. Passive carries neither quota nor timer:
cut, fill, run the load in, bank it, go again, until recalled — the loop as described.

The quota also had to be plumbed. The menu leaf said `Quota 2,000 kg` and put the figure in
`order.params`, which `dispatchFleet()` never read; the leaf also carried a 120-second
countdown that would always have won, since the hull has not finished its first run to a
berth by then.

### A measurement that changed a number

The belt sits 10,700–12,900 units out. A `miner` cruises at 0.85 units/s. The run in to a
berth is therefore about **three hours of game time** — invisible for an ambient miner
nobody is watching, useless for an objective the player dispatched thirty seconds ago and
is waiting on. `COMPANY.fleetSpeed` (4.0) applies to contracted hulls only, and is applied
once per contract and marked so hiring, refitting and releasing cannot compound it.

Verified end to end: a commissioned miner on a passive objective ran 2,409 kg in, banked
4,817 cr, took the treasury from 16,200 to 20,422, and was still running afterwards.

---

## Two bugs found while testing

**Your commissioned ship could be deleted by population decay.** `decayPopulation()` culls
surplus ambient NPCs by type when they are far from the player. A commissioned hull is a
`miner` like any other, so it was eligible — the ship you paid a yard for could evaporate
while out on an objective, and the contract would close itself thirty seconds later with a
toast about losing contact. Contracted hulls are now exempt. Merc boarding closes the
contract properly rather than leaving a record pointing at a ship that is gone.

**`escort` required a role no ship in the game can have.** Its `requires` list was
`['combat', 'merc', 'patrol']`, and nothing is ever `patrol` — `spawnNpc` maps the patrol
NPC type to role `combat`, and no yard fits a `patrol` role either. Escort still worked
through `combat`, so this was dead weight rather than a break, but it is the same class of
bug the hauler was added to fix in v1.01.00: a declared requirement needs somebody who can
meet it. `test/works.mjs` now checks every role every order type requires against the roles
a yard can actually fit.

---

## The other commands

Asked for and done. `test/works.mjs` builds a roster covering every role any order type
requires, then dispatches **every leaf in the command menu** and asserts none is refused,
re-checks all six spoken phrasings still resolve to the same order types, and confirms
recall still frees its hull and clears the board.

---

## Files touched

| File | Change |
|---|---|
| `src/systems/fleet.js` | refit, commissioning, extraction revenue, berth choice, fleet tuning |
| `src/core/config.js` | `FLEET_ROLES`; refit, commission and speed economics |
| `src/systems/orders.js` | quota-driven objectives, `creditFleetProgress`, dead `patrol` requirement removed |
| `src/entities/npcs.js` | miner pays its company; contracted hulls exempt from population decay |
| `src/data/command-menu.js` | extract leaves carry quotas, not countdowns |
| `src/systems/command.js` | quota plumbed from leaf to dispatch |
| `src/systems/worldsim.js` | boarding closes the contract |
| `src/ui/ops.js` | yard menu per hull, commission list, delivered/earned per contract |
| `src/systems/tools.js` | `fleet_refit`, `fleet_yard` reports |
| `test/works.mjs` | **new** — 66 checks |
| `test/all.mjs`, `package.json`, `README.md`, `CHANGELOG.md` | 1.01.90 |

## Verified

- `node test/all.mjs` — **38/38 suites, 3,049 checks, 0 failed.**
- `node test/works.mjs` — 66/66, including a 6,000-second sim run that banks real revenue.
- `node src/npc-avatar/test/run.mjs` — 8/8.

## Not verified

Nothing rendered in a browser. The yard menu and the commission list are new panels in Ops
and no suite draws their DOM.

Balance is untested: `refitFee` 3,600 (×1.6 cross-charter), `fleetSpeed` 4.0, and the
commission prices derived from hull worth are all first numbers. `fleetSpeed` in particular
is a judgement about how long a player should wait to see a result, not a physical figure —
if company hulls look silly next to ambient ones, lower it and accept longer cycles.

Only `extract` produces anything yet. Patrol, escort, logistics, survey and station-keep
still run as timers with no world effect. They dispatch, bind a hull, run and complete
correctly — they simply do not yet *do* anything, and the same `creditFleetProgress` hook
is what they will use when they do.
