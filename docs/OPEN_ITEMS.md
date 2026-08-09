# Open items — single source of truth

Compiled at **v1.01.60 "Assay"**, revised at **v1.01.76 "Over the Shoulder"** (schema 16).
Everything below was cross-checked against the live tree, not copied from the patch notes:
`node test/all.mjs` re-run green (**35/35 suites, 2,798 checks**), `test/reachability.mjs`
re-run (70 checks, `BACKLOG` empty, four inert config keys printed), and every carried gap
grepped in `src/` before it was written down.

Supersedes the scattered "carried" / "not verified" tails of `PATCH_v1.00.20` → `PATCH_v1.01.60`
and the status lines in `SLICE_PLAN.md`, `NPC_ROADMAP.md`, `CREW_ROADMAP.md`,
`REACHABILITY_AUDIT.md`. Those stay as history; this is the list.

Four buckets, and the distinction matters because they cost different things:

- **A — planned slices.** Designed, argued for, not started.
- **B — carried gaps.** Something shipped with a hole in it, named at the time.
- **C — measurement debt.** Shipped, green, and resting on a number nobody measured.
- **D — inert declarations.** Config that exists and controls nothing.

---

## A — Planned slices (designed, not built)

### NPC line — `docs/NPC_ROADMAP.md`

| # | slice | what it needs | blocked by |
|---|---|---|---|
| 11 | **Standing** — corporate business | faction interests as state (what a bloc is short of, where it pushes, who it is angry with); named characters with postings so a purser talks margins and a foreman talks berths; gossip propagation so reputation travels at conversational speed instead of teleporting into a global number | nothing — the exchange layer (v1.00.90) and ledger (v1.01.00) are both in |
| 12 | **Projects** — open-loop faction planning | a planner that emits *needs* ("12,000 t of alloy at Meridian by day 40") rather than orders; NPCs picking up tasks by role and standing and negotiating through the slice-10 ledger; rival factions contesting the same need; the player on the same board | 11 (a project needs a faction that wants something) |
| 13 | **Guile** — deception | claims separable from truth (one model: fake SOS, bait hauler, false market tip, lured patrol); belief as a state so acting on a lie files a memory about the *source*; the player able to lie on the same channel | 11–12 (a lie needs a truth-carrying channel worth abusing) |

Unscheduled directions recorded so the slices above do not close them off: knowledge as a
tradeable payload (a scout becomes a profession); NPC routines and needs — a hauler with a
real route, a patrol with a beat, a station inventory that depletes (**the cheapest realism
win on the list, because a schedule is not intelligence**); a social graph with succession, so
killing a named character leaves a vacancy somebody moves into; mood as fast state distinct
from slow-drifting traits; and resupply — a ship that flees dry currently stays dry until it
despawns, flagged at v1.00.80 and still true.

### Crew line — `docs/CREW_ROADMAP.md`

| # | slice | what it needs | blocked by |
|---|---|---|---|
| B | **ARIA keeps the watch** *(next in that doc)* | a scheduling model over posts and people respecting fatigue, speciality, cross-penalty and morale *trend*; `crew_plan` and `crew_rotate` alongside the existing `crew_watch` / `crew_why`; a standing report at the top of the watch; autonomy on the site-manager rung ladder — suggest / ask / act-and-report, never silent | nothing — the telemetry (v1.01.30) and the verbs (v1.01.40) are both in |
| C | **Relationships** | bonds from shared watches and shared fights, friction from promotions and blame; effects through channels that already exist. **Reuse `npc-avatar/core/memory.js` and derive as `npc-comms.js` does** — a second relationship table is the failure mode | B is not strictly required |
| D | **Generations** | `served` accrues and nothing reads it — careers need a span first; then pairings, inheritance that is a trait/affinity rather than a stat roll, and berths as the constraint. Needs death, retirement and departure or it is a population graph | C |

### Executive command console (partial in v1.01.72–73)

Fleet objective types, timers, Ops Staff surface, ARIA company/fleet/NPC diagnostic awareness,
`src/data/npc-kb/`, and the curated command dialogue menu are in. Still open for a full HQ mode:

- ~~Dedicated HQ interior / spawn-at-office when career is executive~~ **closed in v1.01.74** — `placeAtHQ()` docks the founder at a charter-matched station, records `company.hqStation`, opens the station surface as the office; Ops/ARIA read `atHQ()` / `hqBrief()`
- Binding fleet orders to *real* owned / contracted hulls (demo wing assets only today)
- Live nav-map entity layer driven by HQ / ship scan radius while commanding
- ~~Curated dialogue menu tree that emits the same structured orders ARIA already understands~~ **closed in v1.01.73** — `data/command-menu.js` + `systems/command.js`; Ops walks the tree, ARIA tools (`fleet_dispatch` / `fleet_recall` / `fleet_status` / `command_menu`) share the resolver
- Active/passive is selectable inside the menu leaves; a per-asset toggle strip is still open
- Self-training loop that consumes `npc-kb` diagnostics into few-shot / fine-tune batches
- **The `npc-kb` diagnostic log is not persisted and not reset.** It lives on
  `globalThis.__LG_DIAG__` rather than in `S`, so it is absent from the save payload and
  survives a new game started in the same page load. Moving it into `S` is a schema bump
  and wants doing before the self-training loop treats the log as a corpus worth keeping
- **No way to incorporate after character creation.** `foundCompany()` is called from
  exactly one place — `createCharacter()`, when the career carries a charter — and
  `executive` is the only career that does. Everything in v1.01.72–74 is gated on
  `hasCompany()`, so a non-executive character and every save made before v1.01.72 are
  permanently outside the executive layer with no in-game surface to change it. Wants a
  station-side charter registration, which is a design decision rather than a fix
- **Fleet order ids are built from `Date.now()` and `Math.random()`** (`systems/orders.js`).
  Neither is seeded, so a dispatch is not reproducible across a save/replay and two peers
  in a shared galaxy will not agree on an id. Same class as the `npc-comms` RNG fix in
  v1.01.75 — wants a seeded stream or a monotonic counter

### Structural, from the 1.0 "still missing" list

- **Authoritative PvP.** Pilot-to-pilot damage still resolves on the shooter's client. Shared
  hostile NPCs are host-authoritative; players are not. Grepped: no `pvp` path exists.
- **One system.** Solaris is deep and persistent and warp goes nowhere else. No inter-system
  representation in `src/` (`interstellar` appears only in two module descriptions).
- **The nav map is functional, not beautiful.**

---

## B — Carried gaps (shipped with a named hole)

| gap | from | state on the live tree |
|---|---|---|
| ~~Module wear / condition~~ | deferred v1.00.20 | **closed in v1.01.70.** Per-hardpoint condition, accrued per event, degrading output and raising draw. The last of the three v1.00.20 deferrals |
| ~~Hauler cargo is notional~~ | v1.01.00 | **closed in v1.01.70.** Cargo is aboard the ship, delivered short if raided, spilled on death |
| **NPCs do not wear** | v1.01.70 | only the player's fit has condition. The same asymmetry ammunition and heat carried for three slices before v1.00.80 closed it |
| **Nothing decides to raid a trade lane** | v1.01.70 | a laden hauler is now worth ~11× an empty one and no NPC acts on it — `appraise()` reads budgets and grudges, not cargo. The payoff is built for a behaviour that belongs in NPC slice 11 |
| **The freight board is ore-only** | v1.01.10, more visible now | a player can only post ore, which was invisible before manifests could say otherwise |
| **Cross-training** | v1.01.40 | training only deepens the speciality somebody already has, so the `crossPenalty` that makes reassignment interesting stays permanently navigable-only-by-hiring |
| **`influenceAttempt` untriggered** | v1.01.20, restated v1.01.30 | confirmed still in the `UNTRIGGERED` registry. A hostile influence net that degrades your crew exists, is tested, files an attributed cause in the crew log — and nothing in the world can cause it. Either something hostile uses it or it goes |
| **`deliverTo` has no quantity control** | v1.01.20 | moves whatever the row offers; wrong the first time somebody wants to split a load |
| **Goal-side bypass ring** | v1.00.50 | the planner's near-conjunction geometry. The v1.00.50 well shrink made the case rarer, which is why it slipped rather than why it is fixed |
| **Research tree is thin** | v1.01.50 | nine projects, tier-3 tail three wide and then it stops. Enough to prove the shape, not enough to be a progression |
| **Findings are all-or-nothing** | v1.01.50 | a project takes its full requirement or none, so gathering past the next project's need is dead inventory |
| **Thermal scarcity is unsignposted** | v1.01.60 | 3 hot bodies against 45 geologic. The tree closes on every seed tested, but a pilot who probes the wrong three worlds early has a long detour and nothing warns them thermal is rare |
| **v14 saves lose seven blueprints** | v1.01.50 | a pre-research save arrives with nothing researched, so the tier-5 antimatter/exotics entries are locked until the projects are done. Recoverable by playing, but it is a loss |

### Corrections — items other docs still list as open that are not

Checked directly, because a stale backlog costs a slice chasing something that already works
(the v1.01.20 lesson).

- **"Crew ashore can still be injured by a hull breach"** (`CREW_ROADMAP.md`, carried from
  v1.01.40) — **closed.** `startShoreLeave()` and `startTraining()` both set `c.onDuty = false`,
  and `crewCasualty()` draws from `crew.filter(onDuty)`. Neither the ashore nor the training
  case can be hit. The roadmap line is stale.
- **`POINTDEF.perRound`, `SEEKER.reacquire`, `CREW.moraleWin`** — no longer inert; resolved in
  the v1.01.10–20 pass. `REACHABILITY_AUDIT.md` still lists them in its original table.
- **`cancelJob`, `cyclePalette`, `checkMaterials`, `setDuty`, `rotateWatch`** — all resolved or
  reclassified. The reachability `BACKLOG` is empty and the suite enforces that it stays honest
  in both directions.

---

## C — Measurement debt (green, and resting on an unmeasured number)

The v1.01.60 lesson, in its own words: *two of the last three slices shipped a number I had
estimated rather than measured, and both estimates were wrong in ways a five-minute script
exposed.* These are the estimates still standing.

- **Research costs are calibrated against forgone sales, not against play.** 153,000 credits
  and ~60 probes across the tree is meaningful next to a hull price; nothing has weighed it
  against what an hour of trading or mining actually earns.
- **The other direction was never re-checked.** The 2.7× rise could have pushed the first
  project (now ~2.4 probes) out of reach for an early pilot with no probes and no market nearby.
- **`CREW.moraleWin` at 0.015 per kill is a guess.** Whether a long patrol now floats morale up
  faster than unpaid wages drag it down is unmeasured, and it would be quietly bad if winning
  fights made payroll irrelevant.
- **Crew telemetry has never been watched for an hour.** Six-second sampling and 24-minute
  history caps may be too short to see a payroll cycle.
- **Four tabs have never been used on a phone** — the site operating panel (v1.01.20), the
  watch log tab (v1.01.30), the Welfare and Research tabs, and now the fitting slots tab with
  a service button per hardpoint plus a whole-ship row (v1.01.70). Across three slices this
  has stopped being an oversight and become a pattern.

---

## D — Inert config (confirmed live by `test/reachability.mjs`)

`POP.interval` · `SUPPLY.interval` · `ADVANCED.outOfCombat` · `ORDNANCE.stackScale`

The first two are cadence values for loops that run on their own timers — the same
"documentation in a config key" shape as `POINTDEF.perRound`, and probably the same answer
(delete, or wire the loop to read them). `ADVANCED.outOfCombat` names a state that is declared
and never tested. `ORDNANCE.stackScale` is the magazine lever from v1.00.60 that was never
wired. The suite caps the list at 8, so it cannot grow unnoticed.

---

## Proposed order

Reasoning, not a schedule. Each is argued from what the item under it unblocks.

| next | slice | why here |
|---|---|---|
| ~~v1.01.70~~ | ~~Cargo is real + module wear~~ | **shipped.** See `PATCH_v1.01.70.md` |
| **v1.01.80** | **ARIA keeps the watch** (Crew B) | the telemetry from v1.01.30 has now sat for three slices with nothing optimising against it — a substrate nothing reads is the v1.00.80 lesson repeating |
| **v1.01.90** | **Standing** (NPC 11) | real cargo is now underneath it. Carry the raid decision with it: the payoff exists and no NPC takes it, which is the cheapest half of the slice |
| **v1.02.00** | **Routines** (unscheduled, promoted) | the cheapest realism win on the NPC list and it makes slice 12's projects observable — NPCs that exist when nobody is watching are the prerequisite for a forty-day faction plan that is not a screensaver |
| **then** | Projects (12) → Relationships (C) → Guile (13) → Generations (D) | dependency order, unchanged |

**Two process items worth folding into every slice from here**, both earned rather than
theorised:

1. **Measure supply against demand whenever a slice adds a requirement.** A five-minute script,
   not a follow-up patch. The research tree was uncompletable on all four seeds tested and
   nothing in the table said so.
2. **Open one panel on a phone before the patch note is written.** Four tabs have now shipped
   untested on the target device, which is the mobile-first equivalent of *a mechanic without a
   screen is not shipped.* This is the item most overdue on the list.
3. **Ask what reads the state a slice adds.** `u.mined` counted correctly for six slices while
   the ore it counted was being deleted; the persona memory drifted correctly for five before
   anything consulted it. Twice is a coincidence, three times is a process gap.

Structural work — authoritative PvP, a second system — sits behind all of it. Both are a
different shape of slice, and neither is blocking anything above.
