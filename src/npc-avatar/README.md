# NPC_Avatar

A small, portable NPC-intelligence framework for browser games. No build step, no
required dependencies, vanilla ES modules — copy the folder into any project's `src/`
and it works. 143 checks, `node test/run.mjs`.

## What problem this solves

A background character in a browser game usually has one of two brains: a fixed line
table, or (increasingly, in 2026) a language model asked to generate everything. The
first is cheap and dead. The second is alive and unaffordable at any scale beyond a
handful of characters, because a phone cannot hold more than one or two small models'
worth of concurrent inference without stuttering the game around it.

NPC_Avatar is the position in between, built as four tiers that escalate in cost and are
each cheap enough to run at the frequency they're actually needed:

```
Tier 0 — Reflex        existing behaviour/FSM code the host game already has (untouched)
Tier 1 — Traits        six-axis personality, deterministic, ~free                  core/traits.js
Tier 2 — Grammar        Tracery-style recursive template expansion, ~free           core/grammar.js
Tier 3 — Language model  small model in a Web Worker, budgeted, async, optional      llm/
```

Every character gets Tiers 0–2 all the time — that's what makes a hundred ambient NPCs
individually voiced without a model in sight. Tier 3 is reserved, by a router with hard
concurrency and cooldown limits, for the handful of moments actually worth the cost: a
named mercenary who just took a contract on you, not the fortieth miner saying "seam is
good here."

The industry pattern this follows — small models decide *how* a character talks, cheap
deterministic systems decide *what* it does — is deliberate, not a shortcut taken because
of the phone constraint. Letting a language model choose game actions makes outcomes
non-deterministic in ways a game's own systems (economy, combat, reputation) cannot
safely absorb; letting it phrase a line that a deterministic system already decided to
say costs nothing structurally and is where the model actually helps.

## The core promise

**The game is never waiting on a model.** `core/router.js`'s `requestLine()` returns a
grammar-tier string synchronously — always, unconditionally, in every call — and *only
sometimes* also returns a promise that might later resolve to something better. A caller
that ignores the promise entirely still has a fully-voiced NPC. This is the single
architectural decision the rest of the project follows from.

## Layout

```
core/
  traits.js     six-axis personality: aggression, sociability, greed, loyalty,
                verbosity, formality. Archetype presets, jitter, bounded drift.
  memory.js     bounded, decaying episodic memory. Tag-indexed (type, subject),
                reinforcement instead of duplication, salience-ranked recall.
                Deliberately not a vector store — see the file header for why.
  grammar.js    a small Tracery-style expander: #symbol# recursion, weighted rules,
                `when` conditions gated on trait/memory context, function leaves for
                live interpolation. Every failure mode degrades visibly instead of
                throwing mid-frame.
  persona.js    binds traits + memory + grammar into one character. `say()` is the
                synchronous, always-correct baseline. `brief()` reduces a persona to
                the compact, words-not-numbers form an LLM system prompt should use.
  router.js     the tier boundary. Concurrency cap, per-persona cooldown, and a
                caller-supplied `worthy(situation, ctx)` gate decide whether a Tier-3
                request is even attempted.

llm/
  models.js     registry of small models known to be viable for in-browser NPC
                dialogue, with the reasoning for each pick, not just an id.
  worker.js     runs off the main thread. transformers.js from a CDN, WebGPU with a
                WASM fallback, model-swappable. Never touches the DOM.
  bridge.js     main-thread side. `ready()` / `request()` is the entire contract
                router.js needs; `workerFactory` is injectable so this whole file is
                unit-testable without a real Worker or a network call.

test/           node test/run.mjs — headless, no framework, no DOM. 143 checks.
```

## Using it

```js
import { createPersona, rememberEvent, say } from './npc-avatar/core/persona.js';
import { createRouter, requestLine } from './npc-avatar/core/router.js';
import { createBridge } from './npc-avatar/llm/bridge.js';

// A grammar is plain data — see core/grammar.js's header for the rule shape.
const GRAMMAR = {
  hail: [
    { text: ctx => `${ctx.name} isn't interested in excuses.`, when: c => c.traits.aggression > 0.5 },
    { text: ctx => `${ctx.name} would rather not do this.` }
  ]
};

const merc = createPersona({ id: 'merc-7', name: 'Kell', archetype: 'criminal', faction: 'hostile' });
rememberEvent(merc, { type: 'contract', subject: 'player', weight: 2 }, now);

// Zero-cost, always available:
const line = say(merc, GRAMMAR, 'hail', {}, Math.random, now);

// Optionally upgraded, never blocking:
const router = createRouter({ maxConcurrent: 1, cooldown: 20, worthy: s => s === 'hail' });
const bridge = createBridge();     // pass { model: 'qwen2.5-0.5b' } etc. to pick a different one
bridge.load();                     // fire-and-forget; router works with or without it being ready

const { text, upgrade } = requestLine(router, { persona: merc, grammar: GRAMMAR, situation: 'hail',
                                                 now, bridge });
showToPlayer(text);                // show this immediately
if (upgrade) upgrade.then(better => { if (better) showToPlayer(better); });
```

## Integration notes for a specific project

Do not assign every NPC a persona. The cost of Tiers 0–2 is real, just small — a
thousand silent contacts do not need traits and a memory ring buffer. Create a persona
lazily, the first moment a character becomes individually relevant (a hail, a named
mission-giver, a station controller), and cache it by whatever stable id the host game
already assigns.

Do not raise `maxConcurrent` above 1 on a phone. The router's whole cost model assumes
one model generation in flight at a time; the concurrency gate is what keeps a crowd of
background characters from being able to stutter the frame together.

Persist personas as plain data (`serializePersona`/`restorePersona`) — never the router
or the bridge, which hold live promises, timers and (indirectly) a Worker.
