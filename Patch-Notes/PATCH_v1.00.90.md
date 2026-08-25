# PATCH v1.00.90 — "Chatter"

Slice 9, and the first of a dedicated NPC line. The plan for the rest of it lives in
`docs/NPC_ROADMAP.md`. Save schema 11 → 12 (migration included). 25 suites, **2,182
checks**, all green.

---

## The one thing missing underneath all of it

The wishlist for this line — NPC-to-NPC talk, trades between NPCs, corporate business,
faction project planning, cross-character memory, contracts, ambushes and fake distress
calls — needs the same primitive, and the game did not have it:

**NPCs had no channel to each other.**

`systems/comms.js` is a *player-facing log*. `transmit()` appends to the panel the player
reads; `inRange()` measures distance from the player; every line an NPC has ever spoken was
spoken at the player. Two pirates a hundred kilometres apart with the player elsewhere in the
system could not exchange a word, because there was no representation of a word passing
between two characters.

The memory layer was closer than it looked. `npc-avatar/core/memory.js` has taken a fact as
`{ type, subject, weight, t, meta }` since v1.00.30, and its own comment says `subject` may be
"a player id, a faction, **another NPC's id**". That clause has been true and unused the
whole time: every fact in this game had `subject: 'player'`. The data model could already
hold *"Kestrel 04 owes me a favour"* — nothing had ever written one.

So the first slice is none of the seven wishlist items. It is the layer they all sit on.

---

## The constraint this slice was built under

The cheap version of NPC chat is a *presentation* feature: pick two ships in comms range,
print a plausible line between them, done. That is a screensaver, and it would demo well.

The test of whether this layer is real is whether an exchange **changes state that outlives
it.** So every topic declares `filesFrom` and `filesTo` — the memory each side carries away,
with the other character as the subject — and the suite asserts that no topic can exist
without them. That check is not decoration: it is what stops the screensaver version being
added by accident six months from now.

The same reasoning shapes `exchange()`: memories are filed *first*, the transmission is
emitted *second* and only if the player happens to be close enough. Building it the other
way round is how you get a system that only works when observed.

---

## What is in it

**Messages with a sender and a recipient.** Propagation is by range between the two
speakers, not by proximity to the player. The system is populated whether or not anyone is
watching.

**Topics as data** (`src/data/npc-topics.js`). Seven of them: routine check-ins, ore tips,
haul offers, warnings about the player, calls for help, thanks for help given, and taunts
across factions. Each declares who can raise it, what it requires, which channel it uses,
its lines, and what each side remembers. Data for the same reason the ammunition feeds are:
a table with a `when` clause beats a switch statement that has to be edited to add a kind of
conversation.

Lines receive the relationship, so a hundredth exchange between two familiar ships does not
read like a first contact — the difference between a radio and a tape loop.

**Relationships derived, not stored.** `relation(a, b)` reads `a`'s own memory rather than a
parallel table. A second store would be a second source of truth that has to be bounded,
migrated and kept in step with the memory it duplicates — and the persona table is already
capped and already culls. Deriving means a character who forgets somebody forgets them
completely, which is the honest behaviour for a bounded memory.

**Gossip.** A character wary enough of the player passes the warning on, and the listener
files it against the *player* rather than against the ship that carried it. Reputation now
travels at the speed of conversation instead of teleporting into a global number.

Hearsay weighs less than eyewitness, deliberately. Equal weights would make one kill turn an
entire faction hostile through a chain of repeats, which is a rumour mill rather than a
reputation.

**Overhearing.** Traffic within the player's comms range lands on the channels that already
exist. This is the v1.00.70 lesson applied: a mechanic without a screen is not shipped. If
the only evidence of a social layer is that the code has one, it is not in the game.

---

## Bounded on purpose

With sixty ships aboard there are seventeen hundred pairs. A social layer that costs O(n²)
per frame is a social layer that gets deleted the first time somebody profiles the game on a
phone. The sweep runs on a slow cadence, samples a few speakers, scans a capped window from a
random offset for a partner, and runs at most two exchanges. Over a long session every ship
gets sampled; no single frame walks the population.

---

## Two bugs worth recording

**`stream()` returns an rng object, not a bare function.** `rng()` throws; `rng.next()` is
the draw. Invisible until the first call — which is exactly when a social sweep runs, so it
would have been a crash in the field rather than at boot.

**Two test pairs with the same names are the same pair.** The helper spawned ships with
fixed ids, so the second pair in a section inherited the first pair's cooldown and silently
refused to speak. The cooldown is keyed on names because names are the only stable
identifier across a save — correct behaviour, and a trap for any test that reuses one.

---

## Files

**New** — `src/systems/npc-comms.js`, `src/data/npc-topics.js`, `test/npc-comms.mjs`,
`docs/NPC_ROADMAP.md`, `PATCH_v1.00.90.md`

**Changed** — `src/core/config.js`, `src/core/state.js`, `src/core/version.js`,
`src/main.js`, `src/systems/save.js`, `index.html`, `package.json`, `test/all.mjs`,
`test/industry.mjs`, `test/preflight.mjs`, `test/avatar.mjs`, `test/celestial.mjs`,
`test/ordnance.mjs`, `README.md`, `CHANGELOG.md`, `docs/SLICE_PLAN.md`

---

## Verified vs not

**Verified:** every topic declares state on both sides; an exchange files memories whose
subject is the other character and which carry who they came through; relationships form,
count, and read warmth from favours and friction; a character tracks several acquaintances
apart by name; cooldowns hold and release; conditions gate (different factions do not check
in, an undamaged ship does not call for help); gossip requires a grievance, reaches the
listener as a player-subject fact, and weighs less than eyewitness; a distant exchange
happens and files memories while reaching no log, and a nearby one reaches both; the sweep
starts conversations, stays bounded per call, and is silent with nobody in range; and the
schema-12 payload round-trips while what characters *know* rides with their personas.

**Not verified — and worth saying:**

- **Nobody has listened to it for an hour.** Seven topics is enough to prove the layer and
  not enough to stop repeating; whether overheard chatter reads as a living system or as
  noise on the panel is a session question, and the honest guess is that the topic table
  needs to be two or three times this size before it stops sounding like a loop.
- **Nothing an NPC says to another NPC changes what it *does*.** Relationships and gossip
  are filed and read by `wariness()`, but no exchange yet produces a commitment, a course
  change or a trade. That is slice 10 by design — but until it lands, the layer is real
  state that mostly does not act.
- **Gossip has no attenuation over hops.** A rumour repeated ship to ship files at the same
  reduced weight each time rather than decaying along the chain, so a long chain could still
  saturate a faction. The memory half-life bounds it in time; nothing bounds it in hops.
- **Traits do not drift on exchanges.** The `drift` field exists on the file spec and no
  topic uses it, so conversation does not yet change who somebody is.
