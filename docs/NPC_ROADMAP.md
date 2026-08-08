# NPC roadmap — from reactive ships to a populated system

Written at v1.00.80. This is the design that the next several slices are cut from, and the
reasoning behind the order. It is not a feature list: the order is the argument.

---

## The one thing missing underneath all of it

Every item on the wishlist — NPC-to-NPC talk, trades between NPCs, corporate business,
faction project planning, cross-character memory, contracts, ambushes and fake distress
calls — needs the same primitive, and the game does not have it:

**NPCs have no channel to each other.**

`systems/comms.js` is a *player-facing log*. `transmit()` appends to the panel the player
reads; `inRange()` measures distance from the player; every line an NPC speaks is spoken at
the player, and if the player is not there, no line exists. Two pirates a hundred kilometres
apart with the player elsewhere in the system cannot exchange a word, because there is no
representation of a word passing between them.

The memory layer is closer than it looks. `npc-avatar/core/memory.js` already takes a fact
as `{ type, subject, weight, t, meta }` with `subject` being "who or what it was about — a
player id, a faction, **another NPC's id**". That last clause has been true and unused since
v1.00.30: every fact in the game has `subject: 'player'`. The data model can already hold
"Kestrel 04 owes me a favour"; nothing has ever written one.

So the first slice is not any of the seven wishlist items. It is the exchange layer they all
sit on, and the relationship memory that makes an exchange mean something the second time.

Getting this wrong in a specific direction is the risk worth naming now: it would be easy to
build "NPC chat" as a *presentation* feature — pick two ships in comms range, print a
plausible line between them, done. That is a screensaver. The test of whether this layer is
real is whether an exchange **changes state that outlives the exchange** — a memory, a
relationship, a commitment. If two ships talk and nothing about the world is different
afterwards, nothing happened.

---

## Slice 9 — Chatter: the exchange layer *(shipped, v1.00.90)*

`src/systems/npc-comms.js` and `src/data/npc-topics.js`.

A message has a sender, a recipient, a topic and a payload. It propagates by range and
faction relay rather than by proximity to the player, so the system is populated whether or
not anyone is watching. Both parties file a memory whose **subject is the other character**,
which is what makes the second conversation different from the first.

Topics are declared as data — who can raise it, what it requires, what it files on each
side — for the same reason the ammunition feeds are: a table of prose that a `when` clause
reads beats a switch statement that has to be edited to add a kind of conversation.

The player overhears traffic in range on the comms channels that already exist. This is
deliberate and it is the v1.00.70 lesson: a mechanic without a screen is not shipped. If the
only evidence of a social layer is that the code has one, it is not in the game.

**Covers:** 1a (NPC-to-NPC communication), 2a (memory of exchanges across many characters).

---

## Slice 10 — Ledger: things two characters agree to *(shipped, v1.01.00)*

Once messages carry payloads and both parties remember each other, an *agreement* is a
message whose payload is a commitment plus an acceptance.

- **NPC-to-NPC trade.** A hauler with ore and a station with demand agree a price and a
  delivery. The hauler flies it. The ore arrives. Prices move — `systems/market.js` already
  has the machinery, and nothing but the player currently touches it.
- **Contracts the player can be offered and can offer.** The asymmetry to remove is that
  contracts are currently issued *to* the player by the world. A pilot with a hold full of
  ice and no time should be able to put it on the band and have a hauler take it.
- **Debt and reliability.** An accepted contract that is honoured files a favour; one that
  is defaulted on files a grudge. `wariness()` in `npc-tactics.js` already reads memory to
  decide whether to fight; the same shape reads it to decide whether to deal.

The trap here is the open-loop one: a contract system that only ever *creates* obligations
fills the world with commitments nobody discharges. Every contract needs an expiry and a
failure state that files a memory, or the ledger becomes a leak.

**Covers:** 1b (setting up trades), 2b (trade contracts made and accepted).

---

> **Shipped in v1.01.00**, with two gaps carried forward: there is no UI for posting a job,
> and a hauler's cargo is notional — it names a commodity and a mass that appear at the
> destination on settlement, so a laden hauler cannot yet be intercepted *for* what it is
> carrying. Making cargo real is the small piece that turns the trade lanes into something
> worth raiding, and it belongs at the front of slice 11.

## Slice 11 — Standing: corporate business and the shape of a faction

Corporate talk is not a topic table. It is what characters say when they belong to something
that has *interests* — and the game's factions currently have positions in a reputation
matrix and nothing they want.

- **Faction interests as state:** what a bloc is short of, where it is pushing, who it is
  currently angry with.
- **Postings and roles:** a named character has a job inside a corporation, which is what
  makes "talking corpo business" specific rather than flavour — a purser talks margins, a
  yard foreman talks berths, a security chief talks the pirate problem.
- **Gossip propagation.** Your reputation should travel at the speed of conversation rather
  than teleporting into a global number. A killing witnessed at the edge of the belt reaches
  the far station when somebody carries it there. This is the single change that would make
  the existing reputation system feel like a world instead of a scoreboard, and it needs the
  exchange layer to exist first.

**Covers:** 1c (talking corpo business).

---

## Slice 12 — Projects: open-loop planning between factions

A project is a multi-party, multi-stage goal that nobody finishes in one action: a station
extension, a belt claim, a blockade, a survey of the outer system. `systems/worldsim.js`
already builds sites with delivery targets — that is one project type, hard-coded.

The design that makes this open-loop rather than scripted:

- A faction planner emits **needs**, not orders — "12,000 t of alloy at Meridian by day 40".
- Individual NPCs pick up tasks that suit their role and their standing, negotiate through
  the slice-10 ledger, and get on with them.
- Rival factions can contest the same need, which is where the negotiation between them
  comes from — a joint project, a bought-off competitor, a sabotage.
- The player is a participant, not the audience: the same board is open to you.

The honest risk: this is the item most likely to be *invisible*. A faction planning something
over forty in-game days that the player never has a reason to look at is a very expensive
screensaver. It wants a board, a stake, and a deadline that arrives.

**Covers:** 1d (open-loop project planning between factions).

---

## Slice 13 — Guile: what a character will do that is not honest

Ambushes exist (`AMBUSH` in config, `ambushHold()` in `entities/npcs.js`) but they are a
spawn-time property: a ship either is or is not lying in wait, decided when the world was
built. Nothing decides to set a trap.

The general form is worth building instead of the three special cases:

- **Claims are separable from truth.** A message asserts something; whether it is true is a
  different field. Everything downstream — a fake distress call, a bait hauler, a false
  market tip, a lured patrol — is one model with different payloads.
- **Belief is a state.** A character that acts on a false claim and gets hurt files a
  memory about the *source*, which is what makes deception cost something and what makes a
  reputation for lying possible.
- **The player can lie too**, on the same channel, with the same consequences.

Fake SOS specifically wants the distress channel that already exists in `COMMS.channels` and
the `watchDistress()` loop in `worldsim.js`.

**Covers:** 2c (ambushes, traps, fake SOS).

---

## Beyond the list — where this goes if it works

These are not scheduled. They are the directions the substrate opens, recorded so the early
slices do not accidentally close them off.

**Knowledge as a tradeable good.** NPCs know things — which belt is rich, where a patrol
beat runs, which Lagrange point still has a derelict on it. Once information is a payload,
it can be sold, withheld, or lied about, and a scout becomes a profession rather than a
ship class.

**Needs and routines.** A hauler that runs an actual route, a patrol with a beat, a miner
with a shift, a station with an inventory that depletes. Right now NPCs exist to be
encountered; a routine is what makes them exist when they are not being encountered. This is
also the cheapest realism win on the list, because a schedule is not intelligence — it is
just state that keeps running.

**A social graph with debts and rivalries.** Memory between characters gives pairwise
relations for free. What it does not give is structure: who owes whom, which two captains
will not fly together, whose death leaves a hole somebody else moves into. Succession is the
underrated one — killing a named character should be noticed by the people who knew them, and
should leave a vacancy.

**Emotional state distinct from traits.** Traits drift slowly and describe a person; a mood
is fast and describes a moment. A character who has just watched a friend die should be
briefly reckless in a way their trait vector does not describe.

**Resupply and consequence.** Flagged at v1.00.80 and still true: a ship that flees dry stays
dry until it despawns. A patrol should go home, rearm, and come back — with a memory of who
did that to it.

---

## The order, and why

Exchange before agreement, agreement before institutions, institutions before plans, plans
before deception. Each slice is only testable because the one under it is real: a contract is
meaningless without a channel, a faction project is unobservable without contracts, and a lie
is not a lie unless there is a truth-carrying channel to abuse.

The recurring failure mode to watch for across all of them is the one named at the top: the
presentation shortcut. At every slice the cheap version is to generate plausible text and
skip the state change. The check for each is the same — **after this exchange, what is
different about the world?**
