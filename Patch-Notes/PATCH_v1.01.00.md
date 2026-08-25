# PATCH v1.01.00 — "Ledger"

Slice 10, and the second of the NPC line in `docs/NPC_ROADMAP.md`. Save schema 12 → 13
(migration included). 26 suites, **2,243 checks**, all green.

---

## What was actually wrong

### Two of the seven topics I shipped last slice could never fire

`haulOffer` and half of `oreTip` require a `haul` role. **No ship class in the game has one.**
The roster is 49 combat, 3 merc, 6 mine, 5 build — there has never been a hauler in Solaris.

So v1.00.90 shipped a table of declared requirements with nobody in the world who could meet
them, and the suite passed, because every check was about the *shape* of the table: does
every topic have a channel, lines, a cooldown, state on both sides. None of them asked
whether anyone could ever satisfy a `when` clause.

This is the same class of failure as the dead planet vocabulary in v1.00.40 and the moons
with no `ptype` in the same patch: **a declared requirement is only as good as the population
that can satisfy it.** There is a reachability check now — it builds a sample of every role
that actually spawns and asserts every topic is satisfiable by some pair of them.

### The social layer was state that did not act

Flagged honestly at the end of v1.00.90 and fixed here: relationships and gossip were filed
and read, but no exchange produced a commitment, a course change or a trade.

---

## Haulers

Added because the trade layer needed somebody to be in it. Slow, fat, unarmed, and the only
ship class in the game whose whole purpose is to move somebody else's cargo.

An idle hauler runs a circuit between stations rather than parking. A ship that only exists
when it has a job is a ship the player never sees idle, and a world where every hauler is
always working is not a world with an economy in it — it is a conveyor.

---

## The ledger

A deal is an obligation: two named parties, terms, a clock, and a settlement that files a
memory on both sides.

**Every obligation can fail.** The roadmap named this trap before the code existed: a
contract system that only ever *creates* obligations fills the world with commitments nobody
discharges. Every deal carries an expiry and a failure path, `sweepDeals()` enforces both,
and — this is the part that matters — **a default is a fact about somebody**, not a silent
cleanup.

Which means a raider shooting down a laden hauler is now a default that the *miner* who hired
it remembers. That is the first time in this game that shooting somebody has a consequence
for a third character.

**Reliability is derived, like everything else in this line.** Whether a character will deal
with you is read out of their memory of you, exactly the way `wariness()` reads whether they
will fight you. Same table, same decay, different question. No separate trust score to
migrate or keep in step.

A default costs several deliveries, on purpose. A reputation for keeping your word should be
slow to build and quick to lose, or keeping it is worth nothing.

**Acceptance has three inputs pulling in different directions:** how the pay compares to what
the cargo is worth, how much the character trusts the other party, and their own greed and
sociability. A stranger with a good offer and a friend with a poor one are both plausible
yeses, which is what makes an offer a negotiation rather than a threshold.

**And the cargo actually lands.** `settle()` applies the delivery to the destination's market
book. An NPC trade that does not move a price is a story about a trade.

---

## The player is a party, not an audience

Contracts have only ever been issued *to* the player by the world. `postPlayerJob()` puts a
job on the band; haulers judge it with the same `willAccept` they use on each other, sorted
so the one who trusts you most gets asked first. Same record type, same settlement path, same
memories — routing the player through a parallel contract system would have meant two
ledgers that drift.

`suggestedFee()` quotes what a job would have to pay for anyone to look at it.

---

## Three bugs worth recording

**`applyTrade(st, key, kg, selling)` is from the station's point of view.** I read the flag as
"the player is selling" and passed `false` for a delivery, which made every completed haul
*drain* the destination — the opposite of the thing the slice exists to do. Stock went 1,929
→ 729 and the test caught it.

**A default needs one surviving party, not two.** `defaultOn()` required both parties'
records to file the memory, so the one case worth having — a hauler shot down mid-run —
filed nothing at all, because the hauler was gone. It files against the *name* now, which is
the stable identifier anyway.

**A pinned roster count is a red suite for a correct change.** `run.mjs` and `ui.mjs` both
asserted `npcs.length === 63`. Adding haulers made that 67 and failed two suites for a change
that was entirely intended. Both derive the expected count from the type table now: the
property that matters is that the world spawns what the table asks for, not that the table
sums to any particular figure.

---

## Files

**New** — `src/systems/deals.js`, `test/deals.mjs`, `PATCH_v1.01.00.md`

**Changed** — `src/data/npc-topics.js`, `src/systems/npc-comms.js`, `src/entities/npcs.js`,
`src/systems/save.js`, `src/core/config.js`, `src/core/state.js`, `src/core/version.js`,
`src/main.js`, `index.html`, `package.json`, `test/all.mjs`, `test/run.mjs`, `test/ui.mjs`,
`test/npc-comms.mjs`, `test/industry.mjs`, `test/preflight.mjs`, `test/avatar.mjs`,
`test/celestial.mjs`, `test/ordnance.mjs`, `README.md`, `CHANGELOG.md`,
`docs/SLICE_PLAN.md`, `docs/NPC_ROADMAP.md`

---

## Verified vs not

**Verified:** every topic is reachable by roles that actually spawn; a good offer is accepted
and a derisory one declined, with the refusal remembered; nobody carries more than the
bounded number of obligations; greed raises the bar and sociability lowers it; trust rises
with deliveries and one default outweighs one delivery; settlement moves the destination's
stock, files honoured-deal on both sides, and cannot happen twice; expiry and a dead
counterparty both close a deal and file the default on the survivor; a hauler flies to the
pickup, then to the station, and settles on arrival; an idle hauler still moves; the player
can post a job, have it taken by the hauler who trusts them most, and pay on delivery; a
job nobody wants, a fee the player cannot cover, and a band with no haulers all refuse
cleanly; a radio offer can become a real obligation; and the schema-13 payload round-trips
with malformed entries dropped.

**Not verified — and worth saying:**

- **There is no UI for posting a job.** `postPlayerJob()` and `suggestedFee()` exist, are
  tested, and have no screen — which is precisely the failure I wrote a patch note about in
  v1.00.70. It is called from nothing. Until a station panel exposes it, half of item 2b is
  code the player cannot reach, and I would rather say that plainly than let the API count
  as shipped.
- **The economics are unmeasured.** `baseBar` at 0.34 means a hauler takes about a third of
  market value, and nothing has weighed that against what the same run pays the player. Four
  haulers moving cargo continuously may also be enough to visibly distort station prices over
  a long session; nothing measures the aggregate.
- **A hauler carries nothing.** The cargo is notional — a deal names a commodity and a mass,
  and the mass appears at the destination on settlement. The ship does not have a hold, cannot
  be intercepted *for* its cargo, and dropping it produces no salvage. That is the obvious
  next thing to make a laden hauler worth attacking.
- **Miners do not actually part with ore.** The supply side is asserted rather than deducted,
  so a miner can originate unlimited deals regardless of what it has cut.
- **Nothing tells the player a deal failed near them.** A hauler dying mid-run changes what a
  miner thinks and produces no line on the radio. Slice 11's gossip topics are the right place
  for it.
