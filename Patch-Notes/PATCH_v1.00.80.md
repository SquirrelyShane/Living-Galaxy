# PATCH v1.00.80 — "Nerve"

Slice 8: **NPCs get the budgets the player has, and a brain that decides with them.** No
schema change — everything new is either derived or lives on the ship record, which is
rebuilt from the population on load anyway. 24 suites, **2,118 checks**, all green.

---

## What was actually wrong

### The brain was a mouth

`systems/npc-brain.js` has been filing memories since v1.00.30. It records that a ship
watched you destroy one of its own (`saw-kill-ours`), drifts that character's aggression
and loyalty accordingly, keeps a bounded episodic memory per character, and reads all of it
back out when the ship *speaks* to you.

`entities/npcs.js` never read a word of it. `acquire()` picked the nearest valid contact;
`hunt()` flew the same envelope at the same target until one of them was dead. A pirate that
had watched you destroy three of its faction charged you in exactly the same way as one that
had never seen you before — and then made a pointed remark about it while dying.

That is a memory system that is decorative by construction. The facts existed, the traits
drifted, the grammars gated on them, and *no decision anywhere in the game consulted any of
it.*

### And the asymmetry was three slices old

Ammunition and thermal load landed in v1.00.60, weapon groups in v1.00.70. All three applied
to the player only. An NPC gun platform could hold a trigger down forever, which meant a
long fight was always decided by who had more hull: there was no such thing as running
somebody out of rounds, and no reason for an NPC ever to stop shooting.

I flagged this at the end of v1.00.60 and again at the end of v1.00.70. Carrying it a third
time would have been a decision rather than a backlog.

---

## Wariness: the line that makes the memory load-bearing

```js
export function wariness(u) {
  const p = personaFor(u);
  if (!p) return 0;
  const seen = recall(p.memory, { subject: 'player' }, 8, S.time, NPCAI.memoryHalfLife);
  ...
}
```

Every remembered `saw-kill-ours` adds; a remembered favour or trade subtracts. It is the
same memory table the hail grammars read, used to *decide* instead of to talk.

The behaviour that falls out: a character who remembers you killing its own **will not walk
into your guns alone.** It holds at the edge of its reach and waits for company. With
company, the grudge is the reason it comes at all. Two identical hulls, at identical hull
fractions, with the same target, make opposite calls — and the only difference between them
is what they saw you do.

Characters with no persona return 0, which is the honest answer: nobody is wary of somebody
they have never met.

---

## Stances

Four, about distance and commitment rather than about targets:

| stance | what it does |
|---|---|
| `press` | close and fight — the old behaviour, and still the common one |
| `hold` | fight at the edge of reach, refuse to be dragged in |
| `regroup` | break toward the nearest ally, still shooting |
| `flee` | disengage: out of rounds, out of hull, or out of nerve |

The order of tests in `appraise()` is the design. Physical facts first — no rounds, no hull
— then nerve, then the social read. **A ship out of ammunition does not need an opinion
about you to know it should leave.**

`press` scales the engagement band by 1, so a ship that has decided nothing flies exactly
the profile it flew before this slice.

Two details worth the words:

**Re-appraisal is on a cadence, not per frame.** A ship that changes its mind sixty times a
second never does anything, and a visible commitment is what reads as having decided
something.

**`regroup` still shoots.** A wounded ship that runs *to* somebody is far more dangerous
than one that simply backs off, and it is what turns a scattered patrol into a formation
halfway through a fight.

---

## Nerve

How much punishment a character takes before it stops being brave, built from its traits:

```
nerve = base + aggression × k₁ + loyalty × k₂
courage = nerve + min(allies, cap) × perAlly
```

A high-aggression pirate presses an attack a cautious hauler would have run from twenty
seconds earlier. A lone ship breaks earlier than the same ship in a group — which is what
makes numbers matter beyond raw damage output, and it is the first time in this game that
being outnumbered is a thing the *NPCs* feel rather than only the player.

---

## Calling for help

The cheapest thing in the file and probably the one a player notices most. Being shot is the
moment a ship has something worth shouting about, so the hook lives in `damageNpc()` — the
only place that knows *who* did it. The AI loop sees a hull losing points and cannot tell an
ambush from an asteroid.

Everyone of the same faction in call range who is not already busy switches to whatever is
shooting at the caller. It is the difference between picking off a patrol one at a time and
having a patrol arrive. Emplacements do not answer: a gun turret cannot come running, and
telling it to would park its target on something it can never reach.

---

## NPC magazines and heat

Deliberately coarser than the player's — one magazine rather than per-feed, one heat pool
rather than per-group — because an NPC has no fitting screen, and **simulating what you
cannot show is detail nobody can see.** What matters is that the budgets exist, that they
run out, and that running out is a *reason* rather than a silent stop.

Magazine depth is scaled off rate of fire rather than declared per hull:

```js
const shotsPerSecond = 1 / Math.max(u.pcool || 1, 0.05);
return Math.round(shotsPerSecond * NPCAI.magazineSeconds);
```

A ship that fires four times a second and one that fires once should both hold a plausible
engagement, and tying it to `pcool` means a new NPC type gets a sane magazine without anyone
remembering to add one. Fortifications are emplacements sitting on a supply line and do not
run dry.

Heat uses the same hysteresis as the player's emitters, and for the same reason recorded in
v1.00.60: equal thresholds chatter the trigger on and off at the boundary.

A ship that flees keeps its damage and its empty magazine. Nothing here heals or reloads —
**a raider that got away is one you will meet again in worse shape**, which is more
interesting than one that quietly resets.

---

## Two test-design notes worth keeping

**Assert the design, not the tuning.** Most checks here set up two ships differing in
exactly one way and assert the *decisions differ*, rather than pinning a stance to a string.
`stance === 'hold'` pins today's numbers; "the one with the grudge does not close alone"
pins the thing the slice is about.

**Two test subjects sitting on top of each other are each other's support.** The grudge
branch turns on whether a ship is *alone*, so placing both subjects at the origin made each
one the company that made the other brave, and the test failed for a reason that had nothing
to do with the code. Likewise the fleet-wide ammunition sum can *rise* across a forty-second
run, because `topUpPopulation()` spawns replacements that each arrive with a full magazine —
the measurement has to follow the ships you placed.

---

## Files

**New** — `src/systems/npc-tactics.js`, `test/npc-tactics.mjs`, `PATCH_v1.00.80.md`

**Changed** — `src/entities/npcs.js`, `src/systems/combat.js`, `src/core/config.js`,
`src/core/version.js`, `index.html`, `package.json`, `test/all.mjs`, `README.md`,
`CHANGELOG.md`, `docs/SLICE_PLAN.md`

---

## Verified vs not

**Verified:** magazines scale with rate of fire and hold comparable seconds of fire across
hulls; emplacements never run dry; the last round fires and the next does not; sustained
fire trips a cutout that clears at a lower threshold; nerve rises with aggression and
loyalty; support counts only living same-faction hulls in range; calls for help reach
nearby friends, skip emplacements, skip the other side, respect a cooldown, and fire on
damage; wariness rises with remembered kills, falls with favours, and is bounded; the same
hull with a grudge makes a different call than one without, and commits when it has company;
each stance trigger — dry, conserving, wounded alone, wounded with friends, healthy — lands
where it should; the cadence holds a stance and then releases it; and forty seconds of live
simulation spends rounds, exceeds no cap, and leaves every ship in a real stance.

**Not verified — and worth saying:**

- **None of it has been fought.** Whether a pirate that holds off instead of closing reads
  as *intelligent* or as *broken* is the entire question, and it is a session question. The
  same goes for whether calls for help make the mid-game unfairly swingy — four hulls
  converging on one player is a large change to how a fight feels, and the only number
  behind `maxAnswerCall: 4` is that it seemed like enough.
- **NPCs still cannot resupply.** A ship that flees dry stays dry until it despawns. That is
  defensible for a raider and wrong for a patrol, which ought to go home and come back.
- **Nothing tells the player any of this.** A ship breaking off, holding at range, or
  running because it recognises you all look identical from the cockpit: a contact that
  stopped closing. The comms grammars in `npc-brain.js` are exactly the right place to say
  it out loud — "not on my own, not after last time" — and this slice did not wire the
  stance change to a line. That is the obvious next thing, and it is small.
- **Weapon groups are still player-only.** NPCs got the two budgets, not the third
  mechanic — a single pool per ship, no grouping. Fine while an NPC carries one weapon
  profile, and it should be revisited if they ever carry two.
- **`wariness` reads the persona table**, which is capped at 160 characters. A very long
  session that meets hundreds of ships will cull the least interesting personas, and a
  culled character forgets its grudge. Correct behaviour for a memory bound, but it means
  wariness is not permanent and nothing measures how often that bites.
