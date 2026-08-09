# PATCH v1.00.33 — "Witness"

The four upgrades flagged at the end of v1.00.32. No schema change — v1.00.32 already
made room. 20 suites, **1,658 checks**, all green, plus 143 in the engine's own suite.

---

## 1. Ambient traffic comes from real people

The `LINES`/`REPLIES` tables in `comms.js` meant every hostile in Solaris shared three
sentences. Belt chatter is now generated from the speaker's own persona.

`npc-brain.js` gained `AMBIENT_GRAMMARS` (idle, mine, build, trade, hunt, fear, taunt,
warn, escort) and `REPLY_GRAMMARS`, keyed to the same moods `moodOf()` already
classifies. Rules gate on traits and memory, so:

- a greedy miner says *"Seam is good here. Do not tell the refinery"*; a generous one
  never can
- a terse character says *"Mayday. Mayday."* where a formal one transmits a full
  registered-vessel distress declaration
- a miner you have jumped a claim on says *"Somebody worked this face already. Recently."*

**None of this ever reaches a language model.** `worthy()` refuses ambient situations —
there are dozens a minute and nobody is waiting on any of them. That refusal is exactly
why this tier had to be good on its own.

### The seam

`comms.js` gained `setVoiceProvider()`. A registration hook, not an import, because
`npc-brain.js` already imports `comms.js` and the reverse would be a cycle. Dependency
flows one way: brains know about the radio, the radio never learns what a persona is.

With no provider registered everything falls back to the static tables and the game is
byte-for-byte as it was. A provider that returns `null` falls back per-line. A provider
that *throws* is caught and falls back. All three are asserted.

## 2. NPC-to-NPC exchanges are two personalities

Both halves of an exchange now come from personas, so who answers a distress call and how
is a property of that specific character:

| Responder | Answer |
|---|---|
| loyalty > 0.6 | "Distress acknowledged. Vector inbound, hold your position." |
| aggression > 0.6, loyalty < 0.35 | "Nobody is coming. That is the arrangement." |
| greed > 0.7 | "What is the salvage worth?" |
| default | "I am too far out to help. I am sorry." |

Tested by sweeping the rng for a loyal and a disloyal character and asserting each
reaches its own line and never the other's.

## 3. The world files memories about you

Three hooks, all built around **witnesses** rather than victims — the miner you shot does
not get to remember it, but the four ships who watched do, and that is why the belt gets
colder the longer you work it carelessly.

| Hook | Called from | What is filed |
|---|---|---|
| `witnessKill(victim)` | `combat.js`, on any player kill | Everyone within `AVATAR.witnessRange`. A ship of the *victim's* faction files `saw-kill-ours` (weight 2, drifts aggression up); anyone else files `saw-kill-theirs` (weight 1, drifts loyalty up). |
| `witnessTrade(station, value)` | `economy.js`, on `sell()` | The station's purser, weighted by deal size. Lets a controller greet a regular differently from a stranger. |
| `witnessClaimJump(miner)` | `mining.js`, on the beam | The NPC miner working within `AVATAR.claimRange` of your rock. Drifts their sociability down. |

Costs: a bounded loop over ships already inside comms range, one merged fact each, capped
at `AVATAR.maxWitnesses`. The mining check runs on a 3-second cadence rather than
per-frame — memory merges repeats anyway, so hammering it 60×/sec buys a hot loop and
nothing else.

## 4. The mind overlay

Tap a speaker's name in the comms log: six axes as bars, the words they add up to, and
every memory that character holds about you, in plain language ("saw you destroy Vann",
"watched you cut a rock they were working").

This started as a debug view for tuning trait weights and stayed because it turned out to
be the feature. The tiers do a lot of work that is invisible by design, and a player who
cannot see any of it just experiences mild variety. Being able to open somebody's head
and read *"grasping, withdrawn — saw you destroy Vann"* is the difference between an NPC
being random and an NPC having a reason.

Read-only. It is a window, not a console.

---

## Bug found by the new tests

`hail()` accepted a `speaker` key and silently dropped it before calling `transmit()`, so
every hail row carried `speaker: null` and could not be opened in the mind overlay. The
assertion that caught it (`a hail row carries the speaker key`) was written before the
overlay was wired, which is the only reason it surfaced as a test failure rather than as
a dead tap in play.

## Files

**New** — `src/ui/mind.js`, `PATCH_v1.00.33.md`

**Changed** — `src/systems/comms.js`, `src/systems/npc-brain.js`, `src/systems/combat.js`,
`src/systems/economy.js`, `src/systems/mining.js`, `src/core/config.js`,
`src/core/version.js`, `src/main.js`, `src/ui/comms.js`, `index.html`,
`css/overlays.css`, `package.json`, `README.md`, `CHANGELOG.md`, `test/avatar.mjs`

## Verified vs not

**Verified headless (114 checks in `test/avatar.mjs` alone):** distinct lines across
characters in the same mood, trait-gated lines reachable only by qualifying characters,
loyal vs disloyal distress answers, a throwing provider not breaking the radio, a
null-returning provider falling back, kill witnesses filing by faction, out-of-range kills
witnessed by nobody, trade and claim-jump memories, a grudge becoming a line the miner can
actually say, hail rows carrying the persona key, and every mind-overlay path including
the empty-history one.

**Not verified:** the overlay's appearance, and still no real model inference — every LLM
path remains behind an injected fake.
