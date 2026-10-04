# Career roadmap

From 0.3.85, only careers with an open state and all nine readiness items
can be selected for new pilots or new transfers. Unfinished careers remain
visible but greyed out. Existing pilots and previously held careers are retained.
Mining and, from 0.3.90, Salvage are the completed careers.

The switch is `js/careers/status.js`, and `test/careerstatus.test.mjs` guards it.

## Readiness: what "fleshed out" means

A career has a complete loop when it has all nine items that Mining has. These
items gate new enrollment as of 0.3.85.

| item | means | Mining's version |
|---|---|---|
| `verb` | Its own thing to do in flight, used minute to minute | the cutter, assay, marks |
| `site` | A place in the world where the verb happens | belt sites (0.3.20), ice (icework) |
| `board` | Its own department, with jobs that need the verb | mine / ice / vein |
| `feeds` | The verb itself trains the career's primary skills, A to G | laser feeds Geology and Heavy Machinery |
| `tutorial` | Its own branch in the core tutorial | CUT branch |
| `hull` | `applyCareerDefaults` plus an issued line built for the verb | `miningMode: "closest"`, mining line A to G |
| `aria` | ARIA can fly the verb | `aria-play --career mining` |
| `bench` | `aria-bench` cr/min within ±30% of Mining | baseline |
| `smoke` | A browser smoke that runs the whole loop | smoke-mining |

Salvage's nine, as of 0.3.90: the rig (`verb`); hulks (`site`); wreck and plate
orders filled only by plate off a hulk (`board`); cutting trains Salvage and
Hullcraft, a recorder trains Law (`feeds`); the RIG branch (`tutorial`); tractor,
rig on STRIP and `hullTune.rig` on the salvage line (`hull`); the SALVAGE op and
both ARIAs' planners (`aria`); 0.87× Mining (`bench`); smoke-salvage (`smoke`).

## Baseline audit at 0.3.80 (retained for 0.3.83)

| career | has | missing | foundation already in the tree |
|---|---|---|---|
| **Mining** | all 9 | none | — |
| Salvage | site, board, feeds, tutorial, hull | verb, aria, bench, smoke | tractor, `world/debris.js`, impacts, wreck/pod jobs, insurance |
| Security | board, feeds, hull | verb, site, tutorial, aria, bench, smoke | turrets, bounties, rogues nests, QRF, security diamond, `crew/captive.js` (brig) |
| Commerce | board, feeds | verb, site, tutorial, hull, aria, bench, smoke | `traderoutes.js`, TRADE RUN, market bid/ask, chains |
| Logistics | board, feeds | same as Commerce | `dockwork.js` crane, haul/courier, deadlines |
| Manufacturing | board | 8 | `fabricate.js`, `station/fabyard.js` |
| Construction | board | 8 | stationgen, `station/blueprint.js`, construction crews (NPC spec) |
| Shipyard | board | 8 | shipgen, `refityard.js`, `shipcost.js` |
| Energy | board | 8 | power bus, reactor, brownouts |
| Terraforming | board, verb | 7 | `world/events/atmoworks.js` |
| Research | board, feeds | 7 | SCAN, survey, assay deck |
| Navigation | board, feeds | 7 | beacons, universe map, autopilot/warp plotting |
| Healthcare | none | 9 | robot medic, `staffcare.js` |
| Agriculture | none | 9 | galley stores, life support |
| Education | none | 9 | `crew/children.js`, raising acts, `childtalk` |
| Communications | none | 9 | relays, `comms/gnn.js`, call sessions |

The "has" column is my read of the code as of 0.3.80, not measured play. Treat it as a first
pass. Each arc re-audits its own careers when it starts.

## 0.3.83 project state

- At 0.3.83 all sixteen careers were available; 0.3.85 gates new enrollment.
- Career defaults and the career tick now live in `js/sim/career.js`. The
  public `sim.js` facade and training/payroll behavior are retained.
- The empty controls-test module, renderer import and preload are removed.
- Runtime CRADLE/GDB ledgers, logs, local archives and generated caches are
  excluded from source control and static uploads. Their live files and the
  persistent Sol checkpoint are retained.
- This is structural preparation. No new career verb, ARIA loop or balance
  milestone is claimed. The next main release, 0.3.84, starts the Salvage recovery loop.

## Order

Careers are ordered by how much they already have, cheapest win first. The first reorganization slice lands in 0.3.83: `js/sim/career.js` owns
career defaults and the career tick, with explicit dependencies supplied by `sim.js`.
Existing imports of `applyCareerDefaults` continue through the simulation facade.
Payroll, training, crew updates, persistence timing and all sixteen career choices
retain their existing behavior. Future career arcs extend this cluster.

The earlier release assignments were superseded: 0.3.81 restored career access
and 0.3.82 repaired live-console and landscape panels. Hygiene, the shared-state
cycle reduction, the remaining simulation clusters and render closure split are
still pending; this slice does not claim those milestones are complete.

Career work uses the main game version in `js/version.js`, CHANGELOG.md and
PATCH notes. Arc names are themes, not separate version tracks. The former
0.4–0.10 career assignments are retired; future release numbers are assigned
when their scope is ready.

| main release / order | theme | careers | work |
|---|---|---|---|
| **0.3.84** | **Dead Hulls: Recovery** | Salvage | Powered wreck/pod recovery at contract waypoints; capacity-safe partial collection; training from actual recovered material; tutorial guidance |
| **0.3.86** | **Dead Hulls: Hulks** | Salvage | Destroyed hulls leave sectioned hulks (plate, parts, recorder, surviving cargo); lock, match, anchor and assay; no cutting yet |
| **0.3.87** | **Dead Hulls: The Rig** | Salvage | The salvage rig (CUT / STRIP) works hulk sections and sheds salvage for the tractor; own power line; trains Salvage, Hullcraft and Law |
| **0.3.90** | **Dead Hulls: The Loop** | Salvage | SALVAGE mission op and loop preset; wreck and plate orders bound to hulks; recorder payout; both ARIAs fly the rig; RIG tutorial branch; parity 0.87× Mining; browser smoke. **Salvage open.** |
| Later Salvage slices | Dead Hulls | Salvage | Saved and shared hulks; ownership, claims and prize law; salvager drones on hulk sections; derelict hulls as hulks |
| Then | The Watch | Security | Picket wings; disable and board; brig; nests; tutorial; ARIA; benchmark and smoke |
| Then | The Floor | Commerce, Logistics | Order book; bonded manifests; convoys; insurance; hulls; tutorials; ARIA; benchmarks and smokes |
| Then | The Line | Manufacturing, Construction, Shipyard | Leased fab lines; orbital builds; yard assembly and refit; complete the remaining loop checks |
| Then | Heat and Weather | Energy, Terraforming | Reactor service and fuel; multi-day atmosphere projects; complete loop checks |
| Then | Charted | Research, Navigation | Anomaly samples and papers; lane charting and chart sales; complete loop checks |
| Then | The Town | Healthcare, Agriculture, Education, Communications | Sick bay; hydroponics; training and families; relays and news; complete loop checks |

### 0.3.84 limits

Recovery jobs now transfer their own finite cargo at the marked site, with SALVAGE
and operations power required. Site progress survives leaving and returning during
the active session. This release does not add contract persistence across reloads
or shared persistent hulks. Existing saves and live Sol require no reset.
Readiness stays planned: visible hull cutting, ARIA parity and browser smoke are
not complete. All sixteen careers remain visible; only completed careers allow new enrollment.

### 0.3.86 limits

Hulks exist as world objects (`js/world/hulks.js`) and can be found, locked and
assayed, but nothing cuts them. They are session state: not saved, and not yet
shared between players. Wreck and pod contracts still use the 0.3.84 recovery
rules and are not bound to hulks. Readiness is unchanged — Salvage still lacks
`verb`, `aria`, `bench` and `smoke`. The slice order is in `docs/SALVAGE_PLAN.md`.

### 0.3.87 limits

Salvage now has its `verb` (`js/flight/rig.js`) and `status.js` says so. The
verb trains all three primaries directly. Still open: `aria`, `bench`, `smoke`.
Contracts are not bound to hulks, recorders have no payout, ARIA does not fly
the rig and the tutorial does not teach it. Parity with Mining is unmeasured
with the rig in the loop.

### 0.3.90 — Salvage open

All nine items are in `status.js` and the state is `open`. Measured on the final
build, five seeds, 25 sky-minutes: Mining 3,513 cr/min (2,088–4,655), Salvage
3,061 (2,461–3,573), 0.87×. Mining's own median moved between 3,237 and 4,109
across four runs of unchanged mining code; against the highest Salvage is 0.75×.

What it took beyond the planned slices is in the changelog under "What the bench
found": an autopilot brake that could not come to rest against a hulk outside a
world's sphere of influence, a hull that would not shed load while waiting on
jump charge, hulks picked with their killers still over them, a rig a third the
pace of a cutter, and orders a third the size of Mining's.

Not part of the gate and not done: hulks are session state (not saved, not
shared), so a wreck order does not survive a reload; no ownership or claims;
salvager drones do not work hulks; with no orders, a salvage loop out-earns a
mine loop about 2.7× with ARIA at the conn.

## How to complete a career loop

1. Build the missing gate items, in successive main-game releases.
2. In `js/careers/status.js`, add the new item to that career's `has`. When all nine are
   there, set `state: "open"`.
3. Update `test/careerstatus.test.mjs` to check the new readiness metadata while
   keeping unfinished careers visible and existing pilots usable.
4. Add a CHANGELOG entry describing the completed loop.

## Things to watch

- As a career loop is completed, `BOARD.pay` parity matters: rerun `aria-bench` against Mining,
  as 0.3.24 and 0.3.47 did.
- Specialisation effects (`careers/effects.js`) are already wired for all 49 specialisations.
  They affect the hull whether or not a career's verb exists, so each arc should check its
  specialisations against the new verb. For example, `live_wreck` should affect cutting, not
  just the tractor.
- The Executive career from the old v1.02 line isn't one of the sixteen complexes. If it comes
  back, it would be a 17th entry here with its own arc.
