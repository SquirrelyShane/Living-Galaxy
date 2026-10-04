# Salvage — Dead Hulls work plan

Written against **0.3.85** (`7047d52`). Companion to `docs/CAREER_ROADMAP.md`.
Scope: everything Salvage needs to pass all nine readiness gates and flip to
`state: "open"` in `js/careers/status.js`. Planning only — no game code changed
by this document.

**Done at 0.3.90 — see section 0.** Sections 1–6 are kept as written at 0.3.85.

Verb decision (locked): **dedicated salvage rig** — its own tool, beam, range,
heat and power bus, independent of the mining cutter.

## 0. Status at 0.3.90 — complete

All nine gates are earned and `status.js` says `open`. The slices below landed
as 0.3.86 (hulks), 0.3.87 (the rig) and 0.3.90 (everything else that the gate
needs, in one release). 0.3.88 was ARIA's loop fix and 0.3.89 was not used, so
the version numbers in section 4 from 0.3.88 on are the plan's, not history's.

| planned slice | what happened |
|---|---|
| 0.3.88 jobs on hulks, goods, feeds | **0.3.90.** Wreck orders spawn and pin a hulk; plate orders take steel off any hulk; both count plate at the tractor (`noteSalvaged`), which closes the `iron_ore` leak; recorder payout; CUT IT. **Not done:** contract state across a reload. |
| 0.3.89 rights, black boxes, shared hulks | **Shared hulks: 0.3.91** — host-authoritative `hstate` / `hcut` in `js/net/worldsync.js`, wire and adopt in `js/world/hulks.js`, in the Sol host's checkpoint. The wire name is `hulks` beside `hulls`; it has not bitten. **Not done:** owner, claim, prize law, `v.derelict` hulks; partial cuts are not shared until a section finishes. The recorder pays (350 + 240 per tier) but is still `sim.recorders`, not a good. |
| 0.3.90 ARIA flies the rig, tutorial | **0.3.90.** `SALVAGE` op in a factory of its own (`js/mission/salvage.js`, not inline in `run.js`, which is at its line limit); both planners; RIG tutorial branch. **Not done:** salvager drones on hulk sections, the `ui/map.js` button. |
| 0.3.91 parity, smoke, open | **0.3.90.** `--parity`; `test/smoke-salvage.mjs`; rig 1.0 / 2.5 plate a second; orders sized to half the hold at 3.6× / 3.2× base. 0.87×. |

Section 6's baseline (0.65×) is superseded by the 0.3.90 changelog table.
Sections 7 and 8 still stand; section 8 is the list of what to build on this.

## 1. Where Salvage actually stands

Re-audit of the nine gates against the code, not the roadmap table.

| gate | roadmap says | code says | evidence |
|---|---|---|---|
| `verb` | missing | **missing** | Recovery is a dwell timer (`recoverSite`, `js/sim/salvage.js`); loose debris is a passive tractor (`stepSalvage`, `sim.js:3078`). Nothing is cut. |
| `site` | has | **thin — redo** | Wreck/pod jobs mark a bare point from `jobSpot` (`contracts.js:313-324`). Nothing exists, renders or locks there. |
| `board` | has | **has, one leak** | `salvage` / `wreck` / `pod` kinds plus two chains (`data/chains.js:133,149`). Leak: "Salvage N plate" accepts any `iron_ore`, so it is fillable with the mining cutter. |
| `feeds` | has | **weak — 1 of 3** | Primaries are `salvage`, `hullcraft`, `law`. The verb trains `salvage` (+ `heavyOps`). `work("hullcraft")` is called nowhere in `js/`; `work("law")` fires only on claiming a station (`sim.js:851`). Both rise only through the generic per-cycle drip every career gets (`flight/pilot.js:213-221`, 35% per 90 s while busy). Mining's cutter trains all three of its primaries directly (`sim/career.js:60-64`). |
| `tutorial` | has | **has — rewrite** | A text branch inside the shared `earn` step, titled HAUL (`ui/tutorial.js:119-134`). Describes dwell recovery, not a rig. |
| `hull` | has | **has — extend** | `applyCareerDefaults` sets `ship.salvage = true`; line A–G at `ships/shipdb.js:397-415`. No rig stat on the hull (Mining has `tune.minerRange`). |
| `aria` | missing | **partial** | Flies wreck/pod as GOTO + HOLD(`dwell + 6`) (`aria/play.js:183-190`); does not return after a full hold; fills "Salvage N plate" with a MINE step (`play.js:206-213`). |
| `bench` | missing | **fails: 0.65×** | See section 6. |
| `smoke` | missing | **missing** | No `test/smoke-salvage.mjs`. |

Net: four gates to earn (`verb`, `aria`, `bench`, `smoke`), one to strengthen
(`feeds`), two to redo because the rig changes them (`site`, `tutorial`), one
to extend (`hull`).

## 2. The rig — proposed spec

Two controls, one loop: **cut, then reel**.

- **Hulk** — a new world object. A dead hull with sections; each section holds
  plate and parts; one section holds the black box. Lockable, anchored, rendered.
- **RIG** — new mode control beside MINER: `OFF` / `CUT` / `STRIP`.
  - `CUT`: fast, plate only, destroys the parts in that section.
  - `STRIP`: slow, recovers parts and the black box intact, runs hotter.
- Cutting sheds chunks (`addChunk`, `world/debris.js`) carrying real goods.
- **SALVG** (existing switch) stays the tractor: it reels what the rig sheds.
- Rig and mining cutter are mutually exclusive (one beam emitter).
- Own power bus `rig` in `flight/ship.js` (`DRAW`, `SHED_ORDER`, `SHED_LABEL`,
  demand), not billed to `ops` or `mining`.
- Hull stat: `tune.rigRange` on the salvage line, upgradable like `minerRange`.

Training from the verb (makes `feeds` 3 of 3):

| action | skills |
|---|---|
| rig cutting a section | `salvage`, `hullcraft` |
| STRIP on a live-power hulk | `hazardOps`, `energySystems` |
| filing a claim / handing in a black box | `law` |
| reeling cut material | `heavyOps` (already) |

## 3. Prerequisite chain

Each line needs the ones above it.

1. **Patch rules** (section 5) — every slice.
2. **Hulk entity** — store, spawn sources, lock, anchor, render.
3. **Rig** — module, power bus, controls, beam. Needs 2.
4. **Goods** — plate/parts off a hulk are real goods, not `iron_ore`. Needs 3.
5. **Contracts on hulks** — wreck/pod jobs bind a hulk; "plate" jobs take plate;
   contract state survives reload. Needs 2, 4.
6. **Feeds** — hullcraft/law/hazardOps from the verb. Needs 3, 5.
7. **Rights** — owner, claim, salvage right, prize law, black box. Needs 5.
8. **Shared hulks** — host-authoritative wire in `net/worldsync.js`. Needs 2, 7.
9. **ARIA** — a SALVAGE mission op and a planner that uses it. Needs 3, 5.
10. **Tutorial** — rig branch. Needs 3, 5.
11. **Parity** — tune pay/yield until bench is within ±30% of Mining. Needs 9.
12. **Smoke + open** — browser smoke, flip `status.js`. Needs all.

## 4. Slices and file manifest

One patch per version. Version numbers are proposals; the roadmap assigns them
when scope is ready. NEW = create, EDIT = change, TEST = add/extend.

### 0.3.86 — Hulks (entity only, no verb) — shipped

Shipped as planned, with these differences:

- Also edited: `js/drones/ops.js` (a company combat drone's kill leaves a hulk).
- Added early: SCAN assay of a hulk in `tryAssay` (planned for 0.3.88). It reads
  the manifest and trains `salvage` once per hulk.
- Hull-against-hull kills (`combatHooksOut.onDown`) leave a hulk too.
- Plate good decided: `steel` (`HULK.plate`). No new good, so `VALUE_RULE` is untouched.
- Hulk meshes use `makeShipGroup`, not `render/hullpool.js`.
- Not done here: `v.derelict` hulls (still 0.3.89), ship-vs-hulk collision.
- Line anchors below are 0.3.85 lines; `sim.js` and `engine.js` have shifted since.


| | file | what |
|---|---|---|
| NEW | `js/world/hulks.js` | `hulks[]`, `spawnHulk`, `hulkById`, `nearHulks`, `stepHulks`, `resetHulks`, `bindHulks`, section model, cap + oldest-drop like `debris.js` |
| EDIT | `js/sim/sim.js` | reset/bind (`:907,916`); `registerAnchor("hulk")` (`:390`); lock candidates + sig + source (`:2105-2133,2148-2190`); `onKill` paths spawn a hulk beside the burst (`:3576-3612`); step call (`:3569`); snapshot count (`:3877`) |
| EDIT | `js/npc/battles.js` | battle loss leaves a hulk (`:221`) |
| EDIT | `js/render/engine.js` | hulk meshes (reuse `render/hullpool.js`); chunk loop reference `:1777` |
| EDIT | `js/core/store.js` | `hulks: 0` beside `debris` (`:98`) |
| TEST | `test/hulks.test.mjs` | spawn, cap, sections, lock candidate, anchor resolves, reset |

### 0.3.87 — The Rig (`verb`) — shipped

Shipped, with these differences:

- No new HUD control. The dash switch pages are hidden in the live layouts
  (`css/glass.css`), so the quick CUT switch is context-aware instead: rig when a
  hulk is locked or in reach, mining laser otherwise. `index.html` changed only
  for the key help line and the preload list; no CSS, no `hudlayout` change.
- `rigBlocker` lives in `js/flight/rig.js`; `js/sim/salvage.js` is untouched.
- Rig draws `rigIdle` when on with nothing to cut, so a salvage hull can carry
  it on STRIP by default without browning out.
- Feeds pulled forward from 0.3.88: cutting trains `salvage` and `hullcraft`,
  a recovered recorder trains `law`.
- The recorder is `sim.recorders` (session list), not a good. 0.3.89 turns it
  into something that pays.
- Also edited: `js/flight/turrets.js` (the mining laser skips `salvage`
  chunks), `js/flight/autopilot.js` (bus report), `js/core/input.js` (U),
  `js/ships/shipdb.js` (`hullTune.rig`).
- Found, not fixed: `fx.minerRange` and `fx.turretRange` on upgrades are never
  read, so Cutter lens / Turret servos add no reach. `fx.rigRange` is applied.


| | file | what |
|---|---|---|
| NEW | `js/flight/rig.js` | `rig` state, `RIG_RANGE`, `stepRig(ship, dt, time, lock)`; pure, mirrors `stepMining` (`flight/turrets.js:435`) |
| EDIT | `js/flight/ship.js` | `RIG_MODES` (`:118`), `DRAW.rigCut/rigStrip` (`:36-49`), `SHED_ORDER/LABEL` (`:51-56`), `tune.rigRange` + `TUNE_SPEC` (`:76,102`), `rigMode` default (`:144`), `powered.rig` (`:182`), demand (`:313-348`) |
| EDIT | `js/sim/sim.js` | `setRigMode`/`cycleRigMode` beside `:3130-3144`; `stepRig` call beside `:3424`; exclusivity with `miningMode`; toast text; snapshot (`:3841-3856`) |
| EDIT | `js/sim/career.js` | training block beside `mining.active` (`:60-64`); salvage default `rigMode` |
| EDIT | `js/sim/salvage.js` | `recoveryBlocker` covers the rig |
| EDIT | `js/ui/hud.js` | mode chip beside `:1161`; `SW_*` tables (`:852-884`) |
| EDIT | `js/console/panels/ship.js` | rig row (`:26,279,417`), tune row |
| EDIT | `index.html`, `css/cockpit.css`, `css/glass.css` | control markup (`index.html:640`), sizing, `--g-tools` fallback |
| EDIT | `js/render/engine.js` | rig beam (`:362-377,1890-1930`) — own colour; keep the mining beam group first in the scene (see risks) |
| EDIT | `js/core/store.js` | `rigMode`, `rigActive`, `rigProgress` (`:115-120`) |
| EDIT | `js/economy/upgrades.js` | rig lens/array with `fx.rigRange`; add to `ADDITIVE` (`:106`) and label (`:199`) |
| EDIT | `js/careers/effects.js` | label "Salvage tractor" → covers rig (`:26`); `live_wreck`, `rebuild`, `nanoline`, `dock_arms`, `tug_dock` checked against cutting |
| EDIT | `js/careers/status.js` | add `verb` |
| TEST | `test/rig.test.mjs`, `test/power.test.mjs`, `test/careerstep.test.mjs`, `test/hudlayout.test.mjs`, `test/careerstatus.test.mjs` | cut/strip yields, heat, power shed, exclusivity, layout |

### 0.3.88 — Jobs on hulks, goods, feeds (`site`, `feeds` strengthened)

| | file | what |
|---|---|---|
| EDIT | `js/economy/contracts.js` | wreck/pod generators spawn and bind a hulk (`:309-324`); `tickContracts` progress from rig yield, not dwell (`:688,695-712`); `jobStatus` (`:732`); close the `iron_ore` leak; persist/restore active contracts |
| EDIT | `js/sim/salvage.js` | `recoverSite` → hulk-bound recovery; keep capacity-safe partials |
| EDIT | `js/economy/materials.js` | decide plate good: reuse `steel_plate` (`:71`) or add `wreck_plate`; any new good must satisfy `VALUE_RULE` (`test/balance.test.mjs`) |
| EDIT | `js/sim/sim.js` | `persistProgress` payload (`:1409`); `tryAssay` reads a hulk (`:1425`); `takeSalvageContract`/`stepContract` field charter (`:3049-3076`) |
| EDIT | `js/flight/pilot.js` | restore path for saved contracts |
| EDIT | `js/sim/career.js`, `js/flight/rig.js` | `work("hullcraft")`, `work("law")`, `work("hazardOps")` |
| EDIT | `js/data/chains.js` | `wreck`/`salvage` chain stages still resolve (`:133-157`) |
| EDIT | `js/ui/boardview.js` | "CUT IT" action beside MINE IT (`:116`) |
| TEST | `test/salvage.test.mjs`, `test/board.test.mjs`, `test/jobloop.test.mjs`, `test/chains.test.mjs`, `test/balance.test.mjs`, `test/continue.test.mjs`, `test/careerstep.test.mjs` | cutting trains all three primaries; reload keeps a job |

### 0.3.89 — Rights, black boxes, shared hulks

| | file | what |
|---|---|---|
| EDIT | `js/world/hulks.js` | `owner`, `claim`, `rightsUntil`, `live`, `blackBox` |
| EDIT | `js/net/worldsync.js` | `hulkWire` / `adoptHulks` in `wstate` (`:243,266`). Name clash: `hullWire`/`adoptHulls` already mean player hulls |
| EDIT | `js/economy/insurance.js` | insured loss tags the hulk to the insurer (`:111`) |
| EDIT | `js/corp/seclevel.js`, `js/flight/pilot.js` | cutting a claimed hulk costs standing (`blame`, `prize_law`) |
| EDIT | `js/comms/gnn.js`, `js/comms/comms.js`, `js/comms/call-scripts.js` | claim calls, news posts (`comms.js:185`, `call-scripts.js:175-188`) |
| EDIT | `js/economy/upgrades.js` | `black_box` id is already the Ghost transponder (`:98`) — use another id for the recorder good |
| EDIT | `js/npc/npccrew.js`, `js/console/panels/crew-sky.js` | `v.derelict` hulls become hulks (`npccrew.js:194`) |
| TEST | `test/hulks.test.mjs`, `test/worldsync-live.test.mjs`, `test/insurance.test.mjs`, `test/seclevel.test.mjs` | rights, wire round trip |

### 0.3.90 — ARIA flies the rig, tutorial (`aria`, `tutorial`)

| | file | what |
|---|---|---|
| EDIT | `js/mission/script.js` | `SALVAGE` op + targets (`:17,42`), preset loop (`:227`) |
| EDIT | `js/mission/run.js` | `SALVAGE` handler beside `MINE` (`:38,204,377`) |
| EDIT | `js/flight/autopilot.js` | `apSalvage` standoff/park (`:661-703`); rig off outside the op (`:497`); loop preset (`:202-224`) |
| EDIT | `js/aria/play.js` | `canFly`, `jobPlan` (`:148,183-213`), free-salvage move (`:389`), `weightOf` (`:400`) |
| EDIT | `js/aria/pilot.js`, `js/aria/company.js` | player-side ARIA plan (`pilot.js:269`), firm mapping (`company.js:25,34`) |
| EDIT | `js/console/panels/work.js`, `js/console/panels/nav.js`, `js/ui/map.js` | op targets (`work.js:84-88,156`), buttons (`nav.js:130`, `map.js:303`) |
| EDIT | `js/drones/ops.js`, `js/drones/roles.js` | salvager drones work hulk sections (`ops.js:653`) |
| EDIT | `js/ui/tutorial.js`, `js/ui/tutorial-core.js` | own RIG branch (`tutorial.js:119-134`) |
| EDIT | `js/careers/status.js` | add `aria` |
| TEST | `test/ariaplay.test.mjs`, `test/mission.test.mjs`, `test/autopilot.test.mjs`, `test/droneops.test.mjs`, `test/tutorial-core.test.mjs` | plans validate; a salvage run completes headless |

### 0.3.91 — Parity, smoke, open (`bench`, `smoke`)

| | file | what |
|---|---|---|
| EDIT | `js/economy/contracts.js` | wreck/pod/salvage pay terms; `BOARD.pay` stays 1 |
| EDIT | `js/flight/rig.js` | yield constants |
| EDIT | `tools/aria-bench.mjs` | optional `--parity mining` exit code so the gate is scriptable |
| NEW | `test/smoke-salvage.mjs` | from `test/smoke-mining.mjs`: create salvage pilot, take wreck job, cut, reel, dock, paid |
| EDIT | `test/smoke-coretutorial.mjs` | rig branch |
| EDIT | `js/careers/status.js` | add `bench`, `smoke`; `state: "open"` |
| EDIT | `test/careerstatus.test.mjs` | `openCareers()` → `['mining','salvage']`; transfer into salvage allowed |
| EDIT | `docs/CAREER_ROADMAP.md`, `CHANGELOG.md` | completed loop |

## 5. Patch rules (every slice)

- `js/` carries no comments. Notes live in `docs/files/**.md`. After any `js/`
  change: `node tools/codedocs/build.mjs --migrate`, and ship the regenerated
  `docs/files/…`, `docs/index.json`, `docs/trace/*`, `docs/README.md`.
- New module → `node tools/preload.mjs` and ship `index.html`
  (`test/firstlight.test.mjs` checks it).
- Bump `js/version.js`; add `PATCH-<ver>.md`, a `CHANGELOG.md` entry, README line.
- New HUD control → `css/glass.css` fallback (`test/hudlayout.test.mjs`).
- Headless gate per slice:
  `node --import ./test/three-register.mjs test/<name>.test.mjs` for each suite
  listed, plus `test/codedocs.test.mjs` and `test/firstlight.test.mjs`.

## 6. Bench baseline (measured at 0.3.85)

`node tools/aria-bench.mjs --careers mining,salvage --minutes 25 --seeds 5`

| career | median cr/min | range | jobs done / dropped |
|---|---|---|---|
| mining | 933 | 604 – 1,225 | 3 / 2 |
| salvage | 611 | −673 – 1,258 | 54 / 7 |

- Ratio **0.65×**. The ±30% band on this run is 653 – 1,213 cr/min.
- Single-seed run: 432 vs 684 (0.63×).
- In 3 of 5 seeds ARIA's best-paying move as a salvager was `supply`, not
  salvage work. One seed lost money.
- 54 jobs in 25 minutes means wreck/pod jobs are many and small; Mining is few
  and large.
- Five seeds is a small sample; rerun with `--seeds 9` before tuning.

## 7. Risks

- `test/smoke-mining.mjs` finds the cutter beam as the first scene group with
  eight cylinder children. A second identical group added before it breaks that
  smoke. Give the rig beam a different child count or add it after.
- `sim.js` sits in a 37-file import cycle (`docs/REORG_PLAN.md`). `hulks.js` and
  `rig.js` must not import `sim.js`; pass `sim` in via `bind*`, as `debris.js` does.
- `hulls` (worldsync) vs `hulks` — one letter apart. Consider `wrecks` on the wire.
- `sim.contract` (shattered-world field charter) is separate from
  `contracts.active`. Both pay "salvage"; keep both working.
- The 0.3.84 dwell path must keep working for contracts already active when a
  slice lands, or be migrated.
- Chunk cap is 900 (`debris.js:3`); a cut hulk can flood it. Budget chunks per section.

## 8. Upgrades this sets up

- **The Watch (Security)**: disable-and-board leaves a hulk with a rights holder
  — the same entity, no second system.
- **The Line (Shipyard)**: tow a hulk to a slip; `rebuild` spec restores it.
- NPC salvagers as a `traffic` role competing for the same hulks.
- War graves and `condemn_hulk` (`complexes.js:1793`) as rank-G law verbs.
- Adjuster chains (`data/chains.js:133`) reading real black-box data.

## 9. Workset

The companion zip `LivingGalaxy-salvage-workset-0.3.85.zip` holds 103 files:
every existing file named above, byte-identical to 0.3.85, paths preserved,
plus the test harness (`test/three-register.mjs`, `test/three-loader.mjs`),
the ARIA tools, `tools/preload.mjs`, `tools/lg-patch.sh` and this plan. Files
marked NEW do not exist yet and are not in it. Generated `docs/files/**`,
`docs/index.json` and `docs/trace/*` are left out — `tools/codedocs/build.mjs`
rewrites them.
