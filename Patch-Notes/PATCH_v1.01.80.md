# PATCH v1.01.80 — "Articles"

The slice that closes the executive command console. Every open line in that section of
`docs/OPEN_ITEMS.md` is shipped and covered: a way to incorporate after character creation,
objectives that bind to real ships instead of synthetic wings, a nav-map layer, per-hull
standing modes, a persisted diagnostic log, and the self-training loop that reads it.

**Save schema moves to 17.** The migration is additive — nothing an older save carried is
dropped or reinterpreted.

---

## Why this slice

Four slices built an executive layer and each left a named hole. Read together, the holes
had a shape: the layer was a **list**. Dispatching a patrol changed a row and nothing left
the belt. The record of what characters did lived on `globalThis` and evaporated on
reload. The corpus that record was supposedly feeding did not exist. And the whole thing
was reachable only by having picked one career at creation — so most saves could not see
any of it, and no surface in the game would tell them why.

Closing them individually would have produced six small patches that still did not join up.
They join up here.

---

## The way in — late incorporation

`foundCompany()` was called from exactly one place: `createCharacter()`, when the career
carried a charter, and `executive` was the only career that did. Everything from v1.01.72
onward is gated on `hasCompany()`. One choice at creation permanently decided whether a
save could reach the layer, and every save written before v1.01.72 was outside it with no
way in and no explanation — the Ops → Staff tab fell straight through to the managers
section, which is off by default, so it read as empty rather than as locked.

`registerCharter()` is the door. `canRegisterCharter()` is the gate, split out so the panel
can grey the button *with a reason* rather than failing on the press:

| condition | what the pilot is told |
|---|---|
| already chartered | You already hold a charter. |
| not docked | Charters are registered at a station — dock first. |
| docked at a bastion | No registrar here. Pirates do not keep a companies register. |
| short of the fee | Registration costs 18,000 cr — you have *n*. |

It is deliberately the expensive route. The fee comes from the pilot's own credits (there
is no treasury yet to take it from), capitalises 12,000 against the career start's 24,000,
and leaves you holding 54% against a career founder's 62%. Picking the career is still the
cheap way in; this is the late one. The office is the station you signed at — you signed
the articles here, this is the address on them.

## Objectives bind to a real ship — `systems/fleet.js`

Fleet objectives ran on synthetic assets: `wing-mil-patrol-30`, a name and a role and no
ship anywhere in the world. Honest scaffolding — it proved the order shape without
pretending there was a fleet — but it meant nothing ever left.

A **contract** is a record on `S.company.fleet` pointing at a live NPC in `S.world.npcs`.
The design rule: *the contract is company state, the ship is world state, and neither owns
the other.*

- Hostiles do not take company work. Everything else inside company sensor range will sign.
- One hull flies one objective. With a full board and a busy roster the next dispatch
  **refuses** rather than inventing a wing — `"Every contracted hull is already on an
  objective."`
- Role gating is real: a combat hull asked to extract is told
  `"Kestrel 04 is a combat hull — Extract needs mine."`
- Recall frees the hull. So does the timer running out — before this the contract stayed
  marked busy forever and the roster silently filled with ships that could not be given
  anything.
- Upkeep bills per hull per cycle. A fleet that cannot be paid **sheds its newest contract
  rather than letting the treasury go negative**; the board's solvency seat is the one that
  ends a company.
- Reconciliation runs both directions. A hull that dies or despawns is held for a grace
  period before its contract closes, because a load order that restores the company before
  the world would otherwise cancel the entire fleet on the first frame. Both directions are
  tested.

## Everything else in the section

**Nav-map layer.** Contracted hulls plot regardless of sensor range — the company knows
where its own ships are, that is what a contract is. Brighter and ringed while on
objective, marked but quiet while idle.

**Per-hull standing mode.** Mode was selectable inside a menu leaf and nowhere else, so you
could not say "this ship holds passive" as a property of the ship. It is now a property of
the contract, set from Ops or by ARIA, and a leaf that does not specify one inherits it.

**The diagnostic log moved into `S`.** It was `globalThis.__LG_DIAG__` — absent from the
save, and inherited by the next game started in the same page load, so a fresh save picked
up the previous world's record of who did what. Now `S.npcKb`, serialised at schema 17,
restored with its subject index rebuilt, and cleared on new game.

**The self-training loop — `data/npc-kb/training.js`.** The loop that closes here:
`recordDiagnostic()` files what happened → `harvest()` turns salient events into examples →
`buildBatch()` picks the best few → `fewShotBlock()` renders prompt text → ARIA injects it.
Two rules stop it poisoning itself:

1. **Seeds outrank harvest, always.** A hand-written example says what *should* happen; an
   observed one is only evidence that something *did*. Harvested quality is capped at 0.62,
   below every seed in the corpus, and the suite asserts that relationship rather than the
   constant.
2. **Nothing invents facts.** An example is assembled from fields the diagnostic already
   carries. An event with no situation produces `null`, not an empty example.

Identical events dedupe — twenty patrol dispatches would otherwise become twenty copies of
one sentence, which teaches a model to repeat that sentence.

**Seeded ids.** Fleet order ids were `Date.now()` + `Math.random()`. Monotonic counter plus
a seeded stream now, with the counter carried past whatever a restored save holds. Contract
ids are built the same way.

**Fleet objectives persist.** They were never in the save at all — dispatch a patrol, save,
and the patrol was gone while the hull came back idle.

**The barrel is used.** All deep `npc-kb/*` imports now route through `index.js`, which is
what its own header always said to do.

---

## The ARIA split, and why it is not symmetrical

`test/tools.mjs` carries a rule older than any of this: *a small model will occasionally
misread a request, and the cost of that must never be more than a course you did not want.*
It enforces it by name and by running every tool and checking no resource moved.

Writing `fleet_hire` and `charter_register` broke it, correctly. Registering spends the
pilot's credits; signing spends the treasury; releasing costs the signing fee to undo. So
those three are **not** tools. ARIA gets `charter_options`, `fleet_candidates` and
`fleet_roster` — reports that tell you what is on offer and where to commit it — and Ops
commits. What ARIA executes is everything reversible: dispatch, recall, and setting a
hull's mode.

The guard was right and the tools were wrong. That is the outcome to want from a test.

---

## Found and fixed on the way

**The charter bonus was applied backwards to spending.** `book()` multiplied by
`(1 + charterBonus)` regardless of sign, so operating inside your own charter made revenue
15% better *and everything you bought 15% dearer* — the opposite of what the charter is for
and of what the config comment says. Surfaced by `test/executive.mjs` asserting what a hull
contract actually cost the treasury; the assertion failed, and the code was wrong rather
than the test.

**Eleven suites pinned `SCHEMA === 16`,** each written at the slice that last moved it.
Every future bump would break all eleven at once, and this one did. They now assert
`SCHEMA >= 16` — which is what they meant: the payload that slice added is present.

**`test/command.mjs` cleared the diagnostic log by writing `globalThis.__LG_DIAG__`** — the
exact location this slice moved it away from. It calls `resetDiagnostics()` now, so the
helper cannot drift from the real one again.

---

## Files touched

| File | Change |
|---|---|
| `src/systems/fleet.js` | **new** — contracts, hiring, binding, upkeep, reconciliation |
| `src/data/npc-kb/training.js` | **new** — the self-training loop |
| `test/executive.mjs` | **new** — 124 checks |
| `src/systems/company.js` | `registerCharter`, `canRegisterCharter`, `registrarBrief`; charter-bonus direction fix; roster fields through the lifecycle |
| `src/systems/orders.js` | seeded monotonic fleet ids; hull bind/unbind on dispatch, recall and expiry; fleet board in the save |
| `src/systems/command.js` | dispatch resolves a real hull; hire/release/mode surfaces; catalogue carries the roster |
| `src/systems/tools.js` | executive report tools; reversible actions only |
| `src/systems/save.js` | diagnostics in the payload; 16→17 migration |
| `src/data/npc-kb/diagnostics.js` | log on `S`; serialise, restore, reset |
| `src/data/npc-kb/schema.js` | `contract` diagnostic kind |
| `src/data/npc-kb/index.js` | training loop and persistence re-exported |
| `src/ui/ops.js` | registrar desk, hull roster, mode strip, corpus line |
| `src/ui/navmap.js` | contracted hulls plotted |
| `src/main.js` | `updateFleet` in the tick; `resetDiagnostics` on new game |
| `src/core/config.js` | registration and contracting economics |
| `src/core/version.js` | 1.01.80 "Articles", schema 17 |
| `src/systems/assistant.js`, `src/systems/npc-comms.js` | barrel imports |
| `test/all.mjs`, `package.json` | `executive` suite registered |
| eleven suites | `SCHEMA >= 16` |
| `test/command.mjs` | reset helper |
| `README.md`, `CHANGELOG.md`, `docs/OPEN_ITEMS.md` | this slice |

---

## Verified

- `node test/all.mjs` — **36/36 suites, 2,922 checks, 0 failed.**
- `node test/executive.mjs` — 124/124.
- `node test/command.mjs` — 99/99, `camera` 33/33, `screens` 30/30, `tools` 55/55.
- `node src/npc-avatar/test/run.mjs` — 8/8.
- Migration: `test/world.mjs` and `test/core.mjs` walk v2 and v14 saves up to 17.

## Not verified

Nothing here was run in a browser. The two new panels — the registrar desk and the hull
roster — are built from the same `el()` helpers as the rest of Ops and pass the static id
and selector audit, but no suite renders them. `test/screens.mjs` draws the *data* behind
them, not the DOM.

The nav-map layer is drawn to a canvas and is not covered at all. If contracted hulls do
not appear, the marker block in `ui/navmap.js` is the place to look, and `fleetRoster()`
returning names that match `userData.name` is the join it depends on.

Balance is unmeasured: the 18,000 registration fee, the 2,400 signing fee and the 14 cr per
hull per two minutes are first numbers, not tuned ones. All five live in `COMPANY` in
`core/config.js`.

---

## What this slice does *not* close

`docs/OPEN_ITEMS.md` still has three sections open, and they are the roadmap rather than
loose ends of this feature:

- **NPC slices 11–13** (Standing, Projects, Guile) and **Crew B–D** (ARIA keeps the watch,
  Relationships, Generations) — designed, argued for, not started.
- **Structural**: authoritative PvP, more than one system, the nav map as a beautiful thing
  rather than a functional one.
- **Fourteen carried gaps** including NPCs not wearing, nothing deciding to raid a trade
  lane, and the ore-only freight board.

Marking those closed would make the document useless. What is closed is the executive
command console, entirely, with nothing in it left pointing at something that does not
exist.
