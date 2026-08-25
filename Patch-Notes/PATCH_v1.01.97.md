# PATCH v1.01.97 — "Ledger of Record"

A documentation and tooling slice. No gameplay changes, no new systems, no save format
change — schema stays **17** and a v1.01.96 save loads untouched.

The premise: `docs/OPEN_ITEMS.md` called itself the single source of truth and had not been
re-verified since v1.01.80, sixteen versions ago. This patch grepped every item in it against
`src/` and rewrote it from what the tree actually says.

---

## What the audit found

**Four items were closed by shipped code and still tracked as open.**

- **Goal-side bypass ring**, carried from v1.00.50. `clipGoal()` at `systems/navplan.js:197`
  clips a course to the destination's well edge at `WARP.arriveFactor` — the exact
  near-conjunction case the item described, with a twelve-line comment explaining it. Tracked
  as open for six slices after it was fixed.
- **Findings are all-or-nothing.** v1.01.60 stopped consuming findings entirely: a finding is
  a qualification, data is the consumable, the gate is the largest single requirement
  (`systems/research.js:143-156`). The item describes a model the game stopped using at
  v1.01.60 — and this file was compiled at v1.01.60, so it was stale on the day it was written.
- **Cross-training.** `retrain()` (`systems/crew.js:442`, surfaced at `ui/crew.js:268`) has
  changed a crewman's speciality since v1.01.30. The claim that `crossPenalty` is
  "navigable-only-by-hiring" was wrong. The real gap is much smaller and is now stated
  correctly: a *training course* takes no role and cannot cross-train.
- **`deliverTo` has no quantity control** — half wrong. The verb takes one
  (`systems/planetary.js:395`); the caller does not offer one (`ui/ops.js:436`). A UI item
  filed as a systems item.

**Two versions were spent on slices the plan did not name, and the plan was never corrected.**
The v1.01.80 revision proposed **ARIA keeps the watch** for v1.01.80 and **Standing** for
v1.01.90. v1.01.80 shipped "Articles"; v1.01.90 shipped "Work Orders". Both proposed slices are
still unstarted — `systems/tools.js` has `crew_watch` and `crew_why` and no `crew_plan` or
`crew_rotate`; `systems/reputation.js` is still one number per bloc with no faction interests
attached. The file has a shipped-versions table now, and a process rule about re-arguing the
order in the patch note that departs from it.

## The measurement tool was the thing measuring wrong

Bucket D — inert config — is the one part of that file backed by a running check rather than
memory, which is why it was trusted. `test/reachability.mjs` had three faults in its scan, all
in the direction that hides rot:

1. The block pattern `^export const (\w+) = \{([\s\S]*?)^\};` also matched a **one-line**
   declaration (`export const DOCK = {range: 280, maxSpeed: 0.30};`) and then ran on to the
   next `^};`, filing the *following* block's keys under the wrong name. Five blocks were
   mis-named; `CLOCK.step` was printed as `ORBITAL_V.step`.
2. The reference test fell back to a bare `\bkey\b` match anywhere in `src/`, so a key was
   cleared by any other block, local variable or string sharing its name. **`POP.interval` and
   `SUPPLY.interval` were both tracked as inert and both silently disappeared from the output
   the moment `LIGHTS.interval` was added** — not because anything started reading them, but
   because the word appeared.
3. Removing that fallback alone would have over-reported instead, because two legitimate access
   routes were not modelled: `import { CLOCK as C }` and computed access (`UPGRADES[key]`,
   `ENGAGE[u.profile]`). Both are real reads and must clear a key.

Fixed. The scan now walks multi-line blocks only, skips blocks read by computed key or walked
with `Object.keys/values/entries`, follows `as` aliases, and requires a qualified `NAME.key`
reference to clear a key.

**Four inert keys was the reported number. Fifteen is the real one:**

```
NET.interp POP.interval SUPPLY.interval
FLEET.maxActive FLEET.defaultPatrolSec FLEET.defaultExtractSec
FLEET.defaultLogisticsSec FLEET.modes FLEET.branches
ADVANCED.outOfCombat AI.model AI.server
ORDNANCE.stackScale MANAGERS.upkeep COMPANY.commissionRange
```

And the assertion changed shape. It was `inert.length <= 8` — a ceiling, which only ever
catches half the rot. It is now an **exact set** declared in `INERT`, asserted in both
directions the way `BACKLOG` already is: a newly inert key fails, and so does a key on the list
that something has since started reading.

## Declaration drift — a new bucket, because the audit kept finding it

- **The whole `FLEET` config block is dead.** Nothing imports it. `systems/orders.js`
  re-declares `modes: ['active','passive']` inline per order type (:88, :97, :106, :119),
  `FLEET.branches` duplicates `BRANCH_KEYS`, and `FLEET.maxActive` is shadowed by
  `ORDERS.maxActive`, which *is* read. A plausible-looking knob that changes nothing is worse
  than no knob.
- **The assistant model id is declared three times and the dead one disagrees.** `AI.model` is
  `'onnx-community/SmolLM2-360M-Instruct'` — inert, and a *different repository* to the one
  actually loaded. `systems/assistant.worker.js:9` hardcodes `'HuggingFaceTB/...'`.
  `npc-avatar/llm/models.js` holds the registry, which is what `AVATAR.model` keys into and
  what `systems/npc-brain.js:542,570` uses. `models.js` is the right source.
- **`AI.server = 'http://127.0.0.1:8089'`** names a local inference endpoint nothing connects
  to. Either dead, or the start of a server-backed tier — but not config that looks configured.
- **`version.js` documented a schema it no longer wrote.** The comment block stopped at v16 and
  said *schema stays 16* while `SCHEMA = 17` sat four lines below. Fixed here.

Fixing the first three is a deletion, not a slice, and is left as a decision rather than taken:
they are listed in bucket E of `OPEN_ITEMS.md` with the reading each way.

## Files touched

| file | change |
|---|---|
| `docs/OPEN_ITEMS.md` | rewritten and re-verified at v1.01.96. Shipped-versions table, four items struck with the code that closed them, buckets D and E corrected |
| `docs/SLICE_PLAN.md` | superseded-as-status banner |
| `docs/NPC_ROADMAP.md` | banner; notes slice 11 was proposed for v1.01.90 and not built |
| `docs/CREW_ROADMAP.md` | banner; notes slice B was proposed for v1.01.80 and not built, and that the crew-ashore-injury line is closed |
| `docs/REACHABILITY_AUDIT.md` | banner; notes the inert table's four keys are really fifteen |
| `test/reachability.mjs` | inert scan rewritten; `INERT` declared; exact-set assertion in both directions |
| `src/core/version.js` | v1.01.97 "Ledger of Record"; schema comment gains its v17 line |
| `Patch-Notes/PATCH_v1.01.97.md` | this file |

## Verified

- `node test/all.mjs` — **41/41 suites green, 3,262 checks**. One net check added: the ceiling
  assertion became two exact-set assertions.
- `node test/reachability.mjs` standalone — 71 checks, `BACKLOG` empty, inert set matches.
- The inert scan was cross-checked by hand before the list was declared: every one of the
  fifteen keys was grepped in `src/` for a qualified reference, an alias and a computed read.
  Six keys the strict scan first reported (`UPGRADES.*`) and two more (`ENGAGE.brawler`,
  `ENGAGE.standoff`) and five (`CLOCK.*`) were confirmed **reachable** by those routes and are
  correctly absent from the list.

## Not verified

- **Nothing was fixed in the game.** Every gameplay item in `OPEN_ITEMS.md` is still open; this
  patch changed what the file says about them, not what the code does.
- **The bucket-E deletions are not made.** `FLEET`, `AI` and the duplicated model id are
  described and left in place.
- **No panel was opened on a phone.** That item is now six slices old and remains the most
  overdue thing in the file.
