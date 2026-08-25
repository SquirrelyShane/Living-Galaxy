# Open items — single source of truth

Compiled at **v1.01.60 "Assay"**, revised at **v1.01.80 "Articles"**, re-verified line by line
at **v1.01.97 "Ledger of Record"**, and updated at **v1.01.98 "Fair Weight"** (schema 17).

Nothing below is carried over on trust. Every item was grepped in `src/` at v1.01.96 before it
was kept, rewritten or struck, and the file:line that settles it is quoted. The v1.01.97 audit
found four items that had already been closed by shipped code and were still being tracked as
open, one that was stale on the day it was written, and a measurement tool that had been
silently under-reporting the D bucket for four slices.

**Verification state at the time of writing:** `node test/all.mjs` green — **41 suites, 3,277
checks**. `node test/reachability.mjs` — 71 checks, `BACKLOG` empty, inert list asserted as an
exact **6**-key set (down from 15 — nine were deleted at v1.01.98).

This file supersedes the status lines in `SLICE_PLAN.md`, `NPC_ROADMAP.md`,
`CREW_ROADMAP.md` and `REACHABILITY_AUDIT.md`, and the "carried" / "not verified" tails of
every patch note. Those stay as history. This is the list.

Five buckets, because they cost different things:

- **A — planned slices.** Designed, argued for, not started.
- **B — carried gaps.** Something shipped with a hole in it, named at the time.
- **C — measurement debt.** Shipped, green, resting on a number nobody measured.
- **D — inert declarations.** Config that exists and controls nothing.
- **E — declaration drift.** One fact declared in more than one place, or documented in a
  place that no longer matches the code. New at v1.01.97, because the audit kept finding them.

---

## What actually shipped, v1.01.80 → v1.01.96

The previous revision of this file proposed v1.01.80 = **ARIA keeps the watch** (Crew B) and
v1.01.90 = **Standing** (NPC 11). **Neither was built.** The versions were spent elsewhere,
and the proposal was never rewritten — which is how a plan turns into fiction. The record:

| version | codename | what it was |
|---|---|---|
| 1.01.80 | Articles | executive command console closed out; schema → 17 |
| 1.01.81 | Consignment Note | haul contracts load real cargo; contract cargo made unsellable at source |
| 1.01.90 | Work Orders | `extract` objectives do real extraction; hull conversion and outright purchase |
| 1.01.91 | NPC Comms and Station | the other five order types get bodies (`systems/fleet-work.js`); grammar-driven NPC dialogue |
| 1.01.92 | Corpo Balance & Executive Career | `assignExtraction()` picks a real seam and broadcasts it |
| 1.01.93 | Contract Miner Balancing | the full mine cycle lives in `fleet-work.js` and runs without the player nearby |
| 1.01.94 | Seen Once | `commissionHull()` double-registered a hull, so the world stepped it twice a frame |
| 1.01.95 | Light Discipline | `test/profile.mjs`; first slice measured before it was cut |
| 1.01.96 | Out of Sight | `world/visibility.js` — reasons instead of one `visible` boolean; NPC LOD |
| 1.01.97 | Ledger of Record | audit: docs reconciled against the tree, inert scan fixed |
| 1.01.98 | Fair Weight | the cheap sweep below, plus a fee the game quoted and haulers refused |
| 1.01.99 | Forge Intake | Station Forge port made part of the project — one rng, pinned output, 36% faster. Not wired |
| 1.02.31 | Office Deck | first slice of the Executive arc — flight lock as a capability, the command deck, the render gate, the chart's return path, live telemetry |

**Crew B and NPC 11 are both still unstarted**, and are listed as such in bucket A below.

**v1.02.31 → v1.02.40 are committed to the Executive career** — see `docs/EXECUTIVE_ARC.md`
for the slice order and the principles it is written against. Three items opened by .31 and
tracked here: the render saving is reasoned rather than profiled (bucket C); `test/layout.mjs`
does not know `css/exec.css` exists, so the deck has no geometry assertions (bucket C); and
undock is still pressable for a career with no hull, where it is inert rather than refused
(bucket B).

---

## A — Planned slices (designed, not built)

### NPC line — `docs/NPC_ROADMAP.md`

| # | slice | what it needs | verified state |
|---|---|---|---|
| 11 | **Standing** — corporate business | faction interests as state (what a bloc is short of, where it pushes, who it is angry with); named characters with postings; gossip propagation so reputation travels at conversational speed instead of teleporting into a global number | **not started.** `systems/reputation.js` is still one number per bloc with no interests attached; `blocOf()` maps three faction tags and that is the whole political model. Gossip *does* exist — `npc-comms.js:175,219` and `data/npc-topics.js:157` file gossip about the player against the right subject — so that third of the slice is already underneath it |
| 12 | **Projects** — open-loop faction planning | a planner emitting *needs* ("12,000 t of alloy at Meridian by day 40") rather than orders; NPCs picking up tasks by role and standing; rival factions contesting the same need | blocked by 11 |
| 13 | **Guile** — deception | claims separable from truth; belief as state, so acting on a lie files a memory about the *source*; the player able to lie on the same channel | blocked by 11–12 |

Unscheduled directions, kept so the slices above do not close them off: knowledge as a
tradeable payload; **NPC routines and needs** — a hauler with a real route, a patrol with a
beat, a station inventory that depletes (still the cheapest realism win on the list, because a
schedule is not intelligence); a social graph with succession; mood as fast state distinct from
slow-drifting traits; and **resupply** — flagged at v1.00.80, still true at v1.01.96, and
`entities/npcs.js:440` says so in as many words: *nothing here heals or reloads*.

### Crew line — `docs/CREW_ROADMAP.md`

| # | slice | what it needs | verified state |
|---|---|---|---|
| B | **ARIA keeps the watch** | a scheduling model over posts and people respecting fatigue, speciality, cross-penalty and morale *trend*; `crew_plan` and `crew_rotate` alongside `crew_watch` / `crew_why`; a standing report at the top of the watch; autonomy on the suggest / ask / act-and-report ladder | **not started, and now four slices overdue.** `systems/tools.js` exposes `crew_watch` (:277) and `crew_why` (:295) and nothing else. The telemetry from v1.01.30 has now sat for seven slices with nothing optimising against it |
| C | **Relationships** | bonds from shared watches and shared fights, friction from promotions and blame. **Reuse `npc-avatar/core/memory.js` and derive as `npc-comms.js` does** — a second relationship table is the failure mode | not started; B is not strictly required |
| D | **Generations** | `served` accrues and nothing reads it. Careers need a span, then pairings, inheritance as trait/affinity rather than a stat roll, berths as the constraint. Needs death, retirement and departure or it is a population graph | blocked by C |

### Executive command console — **closed in v1.01.80, extended through v1.01.94**

Every line open in this section at v1.01.80 shipped, and four follow-on patches gave the layer
a body: `systems/fleet-work.js` moves the hulls, `assignExtraction()` picks and broadcasts a
real seam, and the cycle no longer depends on the player being nearby. Covered by
`test/executive.mjs` (124), `test/command.mjs` (99), `test/works.mjs` (74) and
`test/comms-work.mjs` (90). Kept as the record rather than deleted.

### Structural, from the 1.0 "still missing" list

- **Authoritative PvP.** Pilot-to-pilot damage still resolves on the shooter's client. Shared
  hostile NPCs are host-authoritative; players are not. Re-grepped at v1.01.96: no `pvp` path
  exists anywhere in `src/`.
- **One system.** Solaris is deep and persistent and warp goes nowhere else. `interstellar`
  still appears only in two module descriptions in `data/crafting/modules.js`.
- **The nav map is functional, not beautiful.**

---

## B — Carried gaps (shipped with a named hole)

### Closed since the last revision — struck, with what closed them

- ~~**Module wear / condition**~~ — closed v1.01.70. `systems/wear.js`.
- ~~**Hauler cargo is notional**~~ — closed v1.01.70, completed v1.01.81 (a contract load is
  now aboard *and* cannot be sold back at the station that handed it over).
- ~~**Goal-side bypass ring**~~ (carried from v1.00.50) — **closed, and has been for some
  time.** `clipGoal()` at `systems/navplan.js:197` clips a course to the destination's well
  edge at `WARP.arriveFactor`, which is the exact near-conjunction case the item described. The
  file comment at :182-196 spells it out. Tracked as open for six slices after it was fixed.
- ~~**Findings are all-or-nothing**~~ — **the framing is obsolete and was already wrong when
  written.** v1.01.60 stopped consuming findings entirely: a finding is a qualification, data
  is the consumable, and the gate is the largest single requirement rather than the sum
  (`systems/research.js:143-156`). "Gathering past the next project's need is dead inventory"
  describes a model the game has not used since v1.01.60. What *is* still all-or-nothing is
  **survey data**: `startProject()` spends `p.data` up front and `cancelProject()` does not
  refund it. That is deliberate and documented; it is not a gap.
- ~~**The freight board is ore-only**~~ — closed v1.01.98. `ui/dock.js` posts any commodity
  with 100 kg aboard, with a chip picker. Nothing below the UI changed; `test/deals.mjs` now
  asserts price → fee → carrier → market landing per commodity.
- ~~**`deliverTo` has no quantity control**~~ — closed v1.01.98. A shared step chip
  (25 / 100 / 500 / ALL) in `ui/ops.js`, and the verb returns the quantity landed rather than
  a boolean, because two things can shorten a delivery.
- ~~**Cross-training**~~ — **wrong as stated.** `retrain()` (`systems/crew.js:442`, surfaced at
  `ui/crew.js:268`) changes what somebody *is* at the cost of most of their progress, and has
  since v1.01.30. The `crossPenalty` is navigable without hiring. The real, much smaller
  version of this item is below.

### Found and fixed while doing the sweep (v1.01.98)

- **`deliverTo()` never respected `storageCap()`.** Production ticks honour the cap; a hand
  delivery did not, so a player could push a ground store past a ceiling the site's own
  facilities keep to. Found by giving the caller a quantity control and then asking what the
  largest legal quantity was. Now fills to the cap and reports what it took.
- **`suggestedFee()` quoted a fee no hauler had to accept.** The static quote was
  `baseBar × suggestMargin` = 0.425 of cargo worth; a hauler's bar is
  `0.34 + greed×0.30 − social×0.12 − trust×0.18`, so **anyone with greed above ~0.48 refused
  the game's own number**. The config comment said *so a post usually lands* and nobody had
  counted. `acceptanceBar()` is now split out of `willAccept()` so the quote and the judgement
  read one formula, and the fee is quoted against the most amenable hauler actually on the
  band. Measured at 360/360 across three commodities and one, two and four haulers
  (`node test/fee-probe.mjs`).

### Still open

| gap | from | verified state on the live tree |
|---|---|---|
| **NPCs do not wear** | v1.01.70 | still only the player. `systems/wear.js` operates on `S.wear` throughout; nothing in `entities/npcs.js` carries condition. The same asymmetry ammunition and heat carried for three slices before v1.00.80 closed it |
| **Nothing decides to raid a trade lane** | v1.01.70 | `appraise()` (`systems/npc-tactics.js:197`) reads hull fraction, magazine, support count and grudge. It does not read cargo. A laden hauler is worth ~11× an empty one and no NPC can tell. The payoff is built for a behaviour that belongs in NPC slice 11 — carry it with that slice |
| **A training course cannot cross-train** | v1.01.40, restated | `startTraining(id)` (`systems/welfare.js:201`) takes no role and deepens whatever the crewman already is. `retrain()` covers reassignment but wipes progress. There is no *slow* route from one speciality to another. Much smaller than the item it replaces |
| **`influenceAttempt` untriggered** | v1.01.20 | `systems/crew.js:215`, still the sole entry in the `UNTRIGGERED` registry. A hostile influence net that degrades your crew exists, is tested, files an attributed cause in the crew log — and nothing in the world can cause it. Either something hostile uses it or it goes |
| **Research tree is thin** | v1.01.50 | nine projects, three tiers, tier-3 tail three wide and then it stops (`data/research.js`). Enough to prove the shape, not enough to be a progression |
| **Thermal scarcity is unsignposted** | v1.01.60 | 3 hot bodies against 45 geologic. The findings row (`ui/ops.js:344-350`) shows each kind held with a `bad` class at zero, which tells a pilot what they are missing but never that thermal is *rare*. Since v1.01.60 a wrong-probe start is a detour rather than a dead end, so this is now a signposting item, not a completability one |
| **v14 saves lose seven blueprints** | v1.01.50 | `systems/save.js:304` — a pre-research save arrives with nothing researched, so the tier-5 antimatter/exotics entries are locked until the projects are done. Recoverable by playing, but it is a loss, and it is the only migration in the file that takes something away |

---

## C — Measurement debt (green, and resting on an unmeasured number)

The v1.01.60 lesson, in its own words: *two of the last three slices shipped a number I had
estimated rather than measured, and both estimates were wrong in ways a five-minute script
exposed.*

**Partly answered at v1.01.95.** `test/profile.mjs` boots the headless world, runs the real
frame in the real order and times twenty-three phases individually. It is a tool, not a suite,
and deliberately not in `all.mjs` — a timing threshold that fails on a busy box is a test that
gets ignored within a week. It is also the template the items below want: a script that
answers the question rather than a follow-up patch that assumes it.

Still standing:

- **Research costs are calibrated against forgone sales, not against play.** 153,000 credits
  and ~60 probes across the tree is meaningful next to a hull price; nothing has weighed it
  against what an hour of trading or mining actually earns.
- **The other direction was never re-checked.** The 2.7× rise could have pushed the first
  project out of reach for an early pilot with no probes and no market nearby.
- **`CREW.moraleWin` at 0.015 per kill is a guess.** Whether a long patrol floats morale up
  faster than unpaid wages drag it down is unmeasured, and it would be quietly bad if winning
  fights made payroll irrelevant.
- **Crew telemetry has never been watched for an hour.** Six-second sampling and 24-minute
  history caps may be too short to see a payroll cycle.
- **Panels that have never been opened on a phone.** The site operating panel (v1.01.20), the
  watch log tab (v1.01.30), Welfare, Research, the fitting slots tab (v1.01.70) and now the
  four-tab Ops overlay — orders · ledger · staff · research (`ui/ops.js:110-113`). Across five
  slices this has stopped being an oversight and become a pattern. **The most overdue item in
  this file**, and the one nothing in the suite can close for you.
- **`test/deals.mjs` is order-dependent and does not say so in its assertions.** Its blocks
  share one `spawnNpc` id counter and one RNG stream, so a block that spawns ships changes
  which personas every block *below* it draws. Two assertions are sensitive to it —
  `somebody takes a fairly-priced job` and `a haul offer on the radio can become a real
  obligation`. Both are properties of one draw rather than of the rule they name. Re-seeding
  inside `reset()` fixes the first and breaks the second, so it is a real piece of work; until
  then new blocks go at the end of the file and a comment at the top says so. **Worth checking
  whether other suites share the shape** — this was found by accident.
- **Extraction throughput was measured against a hull being simulated twice.** v1.01.94 fixed
  the double-registration; the v1.01.93 figures were never re-taken at the correct rate.

---

## D — Inert config (asserted as an exact set by `test/reachability.mjs`)

The list was reported as four, was really fifteen once the scan was fixed at v1.01.97, and is
**six** after v1.01.98 deleted the nine that were deletions rather than decisions: the whole
`FLEET` block, the whole `AI` block, and `NET.interp`, whose own comment called it legacy. Each
left a comment in `config.js` saying where the live value lives, so the next person does not
re-add it.

The assertion is an exact set in both directions — a newly inert key fails, and so does a
listed key something has started reading.

| key | reading |
|---|---|
| `POP.interval` · `SUPPLY.interval` | cadence values for loops that run on their own timers. Same shape `POINTDEF.perRound` was. Wire the loop or delete |
| `ADVANCED.outOfCombat` | names a state that is declared and never tested |
| `ORDNANCE.stackScale` | the magazine lever from v1.00.60, never wired |
| `MANAGERS.upkeep` | per-manager payroll for the experimental site-manager branch (`enabled: false`). Nothing charges it, so a manager currently runs free. Wiring it is a balance change, not a tidy-up |
| `COMPANY.commissionRange` | km at which a hull can be commissioned. The check that would use it does not exist |

Every one of these six is a behaviour somebody wanted. None can be closed by deleting the line
alone without deciding not to have it.

## E — Declaration drift (new at v1.01.97)

One fact in more than one place. Each of these was found by grepping an unrelated item.

- **The `FLEET` config block is dead and duplicated.** Nothing imports it. `systems/orders.js`
  re-declares `modes: ['active','passive']` inline on each order type (:88, :97, :106, :119),
  `FLEET.branches` duplicates `BRANCH_KEYS` in `data/planetary/branches/index.js`, and
  `FLEET.maxActive` is shadowed by `ORDERS.maxActive`, which *is* read
  (`systems/orders.js:332`). Delete the block, or make `orders.js` read it. Leaving it is the
  worse option: it is a plausible-looking knob that changes nothing.
- **The assistant model id is declared three times, and the dead one disagrees.**
  `config.js` `AI.model = 'onnx-community/SmolLM2-360M-Instruct'` (inert, and a *different
  repository* to the one actually loaded), `systems/assistant.worker.js:9`
  `MODEL = 'HuggingFaceTB/SmolLM2-360M-Instruct'` hardcoded, and
  `npc-avatar/llm/models.js` `MODELS['smollm2-360m'].id` — the registry, which is what
  `AVATAR.model` keys into and what `systems/npc-brain.js:542,570` actually uses.
  `models.js` is the right source; the worker should key into it and the `AI` block should go.
- **`AI.server = 'http://127.0.0.1:8089'`** names a local inference endpoint that nothing
  connects to. Either the worker path is the plan and this is dead, or a server-backed tier is
  wanted and this is the start of it — but it should not sit in config looking configured.
- **`version.js` documented a schema it no longer wrote.** The comment block stopped at v16
  and said *schema stays 16* while `SCHEMA = 17` sat four lines below it. Fixed in v1.01.97.
- **This file described a plan that did not happen.** The v1.01.80 revision proposed two slices
  by name for the next two versions; both versions shipped something else and the proposal was
  never corrected. The table at the top of this file is the fix, and the rule below is the
  guard.

---

## Proposed order

Reasoning, not a schedule. Each is argued from what the item under it unblocks.

| next | slice | why here |
|---|---|---|
| **v1.02.00** | **Landfall** — station geometry swapped in | Forge Intake (v1.01.99) brought the generator in and left it unimported, which is a state worth leaving for exactly one slice and no more. Lazy generation in a worker, proxy/interior behind the LOD levels `system.js:300` currently says stations do not have, interiors merged by material and capped at one at a time |
| **v1.02.10** | **Berths** | `berthsOf()` gives docking and approach a real place to park instead of treating a station as a sphere. A gameplay change, so it does not ride along inside Landfall |
| **v1.02.20** | **ARIA keeps the watch** (Crew B) | **deferred a third time, and this is the argument for it.** The Station Forge port arrived as working code sitting unimported in `src/world/`, which is a state that rots: an unwired module drifts from the tree around it every slice it waits. Crew B depends on nothing that is decaying. It moves, and the count is now nine slices of crew telemetry with nothing optimising against it — if it is deferred a fourth time the honest move is to admit it is not going to be built and say so here |
| **v1.02.30** | **Standing** (NPC 11) | real cargo and a gossip channel are both underneath it now. Carry **the raid decision** with it — teaching `appraise()` to read a hold is the cheapest half of the slice and closes a bucket-B item |
| **v1.02.40** | **Routines** (unscheduled, promoted) | the cheapest realism win on the NPC list, and it makes slice 12's projects observable. NPCs that exist when nobody is watching are the prerequisite for a forty-day faction plan that is not a screensaver. `fleet-work.js` has already proved the pattern for company hulls |
| **then** | Projects (12) → Relationships (C) → Guile (13) → Generations (D) | dependency order, unchanged |

~~**A cheap sweep worth folding into whichever comes first**~~ — **done at v1.01.98.** All
three landed, and the two that touched gameplay each turned up a defect underneath: the
`SEND` control exposed a delivery that ignored the storage cap, and the freight board exposed
a suggested fee that haulers were free to refuse. Both are the same lesson as
`test/profile.mjs`: the cheapest way to find a wrong number is to build the thing that has to
use it.

**Process items, all earned rather than theorised:**

1. **Measure supply against demand whenever a slice adds a requirement.** A five-minute script,
   not a follow-up patch. `test/profile.mjs` is what that looks like when it is done.
2. **Open one panel on a phone before the patch note is written.** Six now. This is the
   mobile-first equivalent of *a mechanic without a screen is not shipped*.
3. **Ask what reads the state a slice adds.** `u.mined` counted correctly for six slices while
   the ore it counted was being deleted; the persona memory drifted correctly for five before
   anything consulted it; `served` is doing it right now.
4. **Re-argue the proposed order in the patch note that departs from it.** Two versions were
   spent elsewhere without a line written about why, and the plan stayed on the page looking
   authoritative for sixteen versions.
5. **When an item is closed, grep the doc that tracks it in the same patch.** Four items in
   this file were closed by shipped code and tracked as open for up to six slices. An audit
   tool is not a substitute: the one that was supposed to catch bucket D was itself wrong for
   four slices, and nothing checks a tool that only ever prints.
