# PATCH v1.00.32 — "Avatar"

NPC brains. Save schema **8 → 9** (migration included). 20 suites, 1,620 checks, all
green, plus 143 in the engine's own standalone suite.

---

## The problem

Living Galaxy's NPCs talked from a fixed line table. `comms.js` picked a string by
faction and mood, and the same mercenary said the same sentence every time — the world
had a hundred voices and one writer.

The obvious fix in 2026 is to hand dialogue to a language model. That does not survive
contact with the target device: a phone cannot hold more than one small model's worth of
concurrent inference without stuttering the game around it, and there are dozens of
ambient transmissions a minute.

## The answer: four tiers, escalating in cost

```
Tier 0 — Reflex          the existing FSM/behaviour code                    (untouched)
Tier 1 — Traits          six-axis personality, deterministic                   ~free
Tier 2 — Grammar         recursive template expansion gated on trait+memory    ~free
Tier 3 — Language model  small model in a worker, budgeted, async, optional   expensive
```

Every character gets Tiers 0–2, always. That is what makes a hundred ambient NPCs
individually voiced with no model anywhere in the picture. Tier 3 is rationed by a router
to the handful of moments worth it.

**The core guarantee: the game never waits on a model.** `requestLine()` returns a
grammar-tier string synchronously, unconditionally, in every call — and only *sometimes*
also a promise that might later resolve to something better. Ignore the promise entirely
and you still have a fully-voiced NPC.

## New: `src/npc-avatar/` — a portable engine

Deliberately standalone and game-agnostic. Nothing in it knows what a bastion or a claim
is; it can be copied into another project unchanged. Its own suite: `npm run test:engine`.

| File | What it is |
|---|---|
| `core/traits.js` | Six axes — aggression, sociability, greed, loyalty, verbosity, formality. Eight archetypes, seeded jitter, bounded drift. Six because a designer can hold six in their head; twenty is unauditable. |
| `core/memory.js` | Bounded, decaying episodic memory. Tag-indexed on `(type, subject)`, reinforcement instead of duplication, salience-ranked recall. **Not** a vector store — at a few dozen facts per character, embeddings cost a model per NPC and buy nothing a decay curve doesn't. |
| `core/grammar.js` | Tracery-style expander: `#symbol#` recursion, weighted rules, `when` conditions reading trait/memory context, function leaves for live interpolation. Every failure degrades visibly rather than throwing mid-frame. |
| `core/persona.js` | Binds the three. `say()` is the synchronous always-correct baseline. `brief()` reduces a persona to words-not-numbers for a model prompt. |
| `core/router.js` | The tier boundary. Concurrency cap, per-persona cooldown, caller-supplied `worthy()` gate. |
| `llm/models.js` | Researched registry with reasoning per entry, plus `probeBuiltIn()` for Chrome's on-device API. |
| `llm/worker.js` | Off-thread inference. transformers.js v4, WebGPU with WASM fallback, model-swappable. |
| `llm/bridge.js` | `ready()` / `request()` is the whole contract. `workerFactory` is injectable, so it's fully unit-testable with no real Worker and no network. |

### Model selection

| Key | Params | Tier | Why |
|---|---|---|---|
| `smollm2-360m` | 360M | **default** | Already proven on your phone via the existing ARIA worker path. Start here. |
| `smollm2-135m` | 135M | light | Fallback if the default stutters on WASM-only devices. |
| `qwen2.5-0.5b` | 0.5B | default | Same weight class, stronger instruction-following. Worth an A/B. |
| `qwen3-0.6b` | 0.6B | upgrade | Force `no_think` — reasoning mode isn't worth the latency for a one-liner. |
| `smollm3-3b` | 3B | director | One narrator-class character only, on capable hardware. Never the ambient pool. |

Browser built-in models (Chrome's Prompt API) are **not** in the registry — availability
is inconsistent across Chromium forks and Brave strips the plumbing entirely.
`probeBuiltIn()` feature-detects at runtime rather than guessing from the browser name.

## New: `src/systems/npc-brain.js` — the Living Galaxy adapter

Everything game-specific. Owns:

- **Who gets a mind.** Lazily, on first individual relevance — a hail, a warning, a
  distress call. A belt full of silent contacts never allocates one. Bounded at
  `AVATAR.maxPersonas`, and the cull protects characters you actually have history with.
- **What kind.** `archetypeFor()` maps this game's roles/factions onto the engine's
  archetypes. Role beats faction: a pirate hauler still talks like a hauler.
- **Determinism.** Personas are seeded off the NPC's name via the world seed, so a given
  character is the same person every session — and on every client sharing that seed,
  which multiplayer needs.
- **What they can say.** The three world hails are now grammars, not strings.
- **When a model is worth it.** `worthy()` = "is this a hail?". A hail is the one moment
  the player is stopped, reading a reply menu, about to decide — the only place a second
  of latency is free. Ambient chatter never qualifies.

## Changed: `comms.js`

- `hail()` now records the log entry id it created, so an async enrichment can find and
  replace that exact line later.
- New `updateEntryText(id, text)` — the one-way door the Tier-3 upgrade needs.
- The three canned hail functions **moved out** to `npc-brain.js`. `comms.js` is back to
  being radio plumbing that knows nothing about personas.

## Sanitising

Small models wrap dialogue in quotes, prefix it with the speaker's name, and add stage
directions. `sanitize()` strips all three and hard-caps length at a sentence boundary — a
model that ignored "one sentence" cannot blow out the comms panel.

## Settings → Lab

A toggle and an explicit **DOWNLOAD** button. The model is never fetched at boot: several
hundred megabytes is something a player opts into, not something that happens to them
while the game is building a galaxy.

---

## Persistence

Schema 9 adds `brains`. Only personas that have accumulated memory are saved — a
character you merely heard once is fully reconstructible from their name and the world
seed, so storing them would be paying bytes for something free. The v8 → v9 migration
invents nothing: an old save arrives with an empty table and rebuilds identities on first
contact.

## Files

**New** — `src/npc-avatar/` (9 files + 9 test files), `src/systems/npc-brain.js`,
`test/avatar.mjs`

**Changed** — `src/systems/comms.js`, `src/systems/worldsim.js`, `src/systems/save.js`,
`src/core/config.js`, `src/core/version.js`, `src/main.js`, `src/ui/settings.js`,
`package.json`, `test/all.mjs`, `test/preflight.mjs`, `test/industry.mjs`

## Two existing assertions changed

1. `test/preflight.mjs` — the canned-merc-hail assertion pointed at `comms.js`; the
   function moved. Covered far more thoroughly in `test/avatar.mjs` now.
2. Schema pins in `test/preflight.mjs` and `test/industry.mjs` (8 → 9).

## Console

```
LG.brains()            tier state, model status, persona count, router policy
LG.personas()          every character currently holding a mind
LG.persona(name)       one character: traits, descriptors, what they remember about you
LG.loadBrainModel()    start the Tier-3 download
LG.setBrainsEnabled(false)
```

## What is verified and what is not

**Verified headless (1,620 + 143 checks):** archetype inference, lazy creation, caching,
determinism across rebuilds, table bounding and cull priority, memory changing the
selected line, all three hails end to end, cooldown still holding through the new path,
nameless speakers, entry enrichment, sanitising, every model failure mode
(unloaded/crashing/slow/timeout) leaving the player with a line, ambient chatter never
reaching the model, opt-in loading, schema 9 round-trip and migration.

**Not verified:** any actual model inference. Every LLM test uses an injected fake
bridge or fake worker — no weights were downloaded, no WebGPU was touched, no
transformers.js was loaded. The first real download on your device is the real test, and
the thing to watch is whether SmolLM2-360M's replies are *worth* the wait on Brave for
Android, which almost certainly means the WASM path rather than WebGPU.
