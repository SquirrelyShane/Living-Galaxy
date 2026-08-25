# PATCH v1.01.72 — executive command + NPC knowledge base

The substrate under v1.01.73. Fleet objectives become real running state, and NPCs get a
structured knowledge base — profiles, a diagnostic event log, and a seed training corpus.
Save schema stays **16**.

> **Backfilled.** Written after the fact, from the CHANGELOG entry and the shipped diff, to
> close the gap between `PATCH_v1.01.70.md` and `PATCH_v1.01.73.md`. .71 and .72 shipped
> folded into .73 and never got their own notes. Accurate to what changed, but not written
> alongside the work.

---

## Why this slice

Idle executive command needs two things the game did not have: somewhere for an order to
*live* while it runs, and somewhere for an NPC's behaviour to be *legible* after the fact.
Fleet objectives are the first. The knowledge base is the second — and it is deliberately
built as a data layer rather than a feature, because the thing it exists for (onboard ARIA
self-training, few-shot prompting, retrieval over what characters have actually done) is
several slices out and should not have to reshape the store when it arrives.

---

## Added

**NPC knowledge base** (`src/data/npc-kb/`)

| Module | What it holds |
|---|---|
| `schema.js` | required profile fields, diagnostic kinds, training purposes, validators |
| `profiles.js` | role archetypes and templates — speech patterns, heuristics, loyalties, red lines, KPI defaults |
| `diagnostics.js` | the event log: decisions, dialogue, manager policy fires, board state, each with salience |
| `training-corpus.js` | seed examples tagged by purpose, for later few-shot / RAG use |
| `index.js` | the public barrel — import from here, not deep paths |

`buildProfile()` falls back to a template rather than returning nothing for an unknown
role, because a character whose role nobody wrote a template for still has to be able to
speak.

**Fleet objectives** for executive idle command — patrol (default 30 s), extract,
logistics, escort, survey pass, station-keep. Active and passive modes, visible timers,
automatic return on expiry. Wired into the sim tick and into Ops → Staff whenever a
company exists. The board is capped at six running objectives.

**ARIA executive awareness.** The context line and rule answers now reach company books,
board confidence, live fleet objectives, and per-NPC diagnostic briefs — "who is X?" and
"diagnose…" both read the knowledge base.

---

## Fixed (carried from v1.01.71)

Dock exterior view and return path; NPC check-in self-acknowledgement. See
`PATCH_v1.01.71.md`.

---

## Files touched

| File | Change |
|---|---|
| `src/data/npc-kb/schema.js` | new |
| `src/data/npc-kb/profiles.js` | new |
| `src/data/npc-kb/diagnostics.js` | new |
| `src/data/npc-kb/training-corpus.js` | new |
| `src/data/npc-kb/index.js` | new — public barrel |
| `src/systems/orders.js` | fleet objective types, dispatch, recall, tick, report |
| `src/systems/assistant.js` | executive context, diagnostic briefs |
| `src/ui/ops.js` | Staff panel reads live objectives |
| `src/systems/npc-comms.js` | exchanges file dialogue into the knowledge base |

---

## Verified

`node test/all.mjs` green at the time of shipping — but note that green meant *no
regression*, not *covered*. Nothing in the suite exercised the knowledge base or the
command tree until `test/command.mjs` landed later. See that suite for what is now
actually asserted.

## Known gaps at time of shipping

- The diagnostic log lives on `globalThis.__LG_DIAG__`, not in `S`. It is therefore not
  persisted with the save and not cleared when a new game starts in the same page load.
  Filed in `docs/OPEN_ITEMS.md`.
- `src/data/npc-kb/index.js` is the documented import surface and no call site uses it.
