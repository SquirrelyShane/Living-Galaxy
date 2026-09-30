# js/ reorganization plan

Written against 0.3.77 (323 files, 89k code lines after comment migration). **0.3.78 executed the move table below** — paths in "What is wrong now" are the pre-move names. Numbers come from `docs/index.json` and `docs/trace/*`; re-run the builder before acting on any of it.

## What is wrong now

- **100 files flat in `js/`** next to 22 folders. Folder placement currently says "added before/after the folder habit started", not "what this is".
- **`sim.js` is the hub**: 4,062 lines, 251 top-level symbols, 124 exports, **86 importers**, 64 imports. It sits inside a **37-file import cycle** (see `trace/imports.md › Cycles`), so top-level evaluation order across those 37 is load-bearing.
- **Two single-closure giants**: `engine.js › mountGame` is one 2,564-line function; `hud.js › mountHud` is 728 lines. Neither can be split by moving files — they need closure state lifted out first.
- **Hygiene backlog** (`trace/hygiene.md`): 109 unused imports, 29 top-level symbols never referenced, 9 files nothing in `js/` imports (some are entry points — confirm against index.html/tests before deleting).
- `controls-test.js` is `export {};` — kept alive by a bare side-effect import in engine.js.

## Rules for the move

1. Move only; no renames of exports, no logic changes, in the same patch. A move patch must be AST-identical per file apart from import specifiers.
2. Existing folders stay as they are (`asteroidgen/ shipgen/ stationgen/ robotgen/ genome/ vendor/` are vendored generators — their internal layout is their upstream's).
3. The 600-line gate on `console/ crew/ mission/` applies to anything moved in. Everything proposed for `crew/` is under 600.
4. Every move rewrites: relative imports in `js/`, `test/`, `tools/`, `addon/` (structural only), `index.html`, `shipyard.html`, any `new URL("…", import.meta.url)`, and moves `docs/files/<old>.md → <new>.md` so notes follow the code.

## Target tree (flat files only; `→` = destination)

| domain | files |
|---|---|
| `core/` boot, save, frame | boot, store, profile, perf, input, addon-loader, controls-test (empty side-effect import from engine.js — delete in 0.3.80) |
| `sim/` | sim → `sim/sim.js` (split in 0.3.80+) |
| `net/` | net, worldsync, account |
| `world/` sky, bodies, rocks | bodies, archetypes, generate, scale, anchors, names, naming, field, rockgen, debris, textures |
| `world/events/` | cataclysm, holes, impactors, impacts, atmoworks |
| `flight/` hull + piloting | ship, pilot, autopilot, avoid, defence, turrets, repair, probes, contacts, recorder |
| `aria/` (exists) | aria → `aria/aria.js`, aria-pilot → `aria/pilot.js`, ariaplay → `aria/play.js` |
| `render/` three.js only | engine, postfx, warpfx, holefx, impactfx, rockfx, attract, hullpool |
| `ui/` (exists) | hud, map, creation, hangar, secbadge, holdview, boardview, tutorial, tutorial-core |
| `station/` | stations, stationyard, stationworks, stationdeck, stationlife, stationclock, deckhall, deckworks, dockwork, fabyard, refityard, blueprint, staffcare, stafflife, staffline |
| `economy/` | economy, materials, fabricate, icework, contracts, chains, sites, traderoutes, upgrades, shipcost, insurance |
| `corp/` | company, corps, fleet, seclevel, gdb |
| `ships/` | shipdb, hullspec, shipforge |
| `drones/` (exists) | droneforge, dronespec |
| `crew/` (exists) | crew → `crew/ledger.js`, family, races |
| `comms/` (exists) | chat, gnn |
| `audio/` (exists) | audio → `audio/index.js` (façade) |

Result: `js/` root keeps only `main.js` (entry, loaded by index.html) and `version.js` (tools/lg-patch.sh reads it by path) — 16 new/extended domains beside the existing folders; largest new folder `station/` at 15 files. The executed table is `tools/codedocs/moves-0.3.78.json`.

## Phases — one patch each

| version | scope | needs from you |
|---|---|---|
| 0.3.77 | codedocs tool, comment migration, traces, this plan | shipped inside 0.3.78 |
| **0.3.78** (done) | `tools/codedocs/move.mjs` (plan-file driven, dry run by default) + the table executed; `tools/prune/<ver>.txt` + lg-patch.sh prune so a zip can delete | — |
| 0.3.79 | addon path fix (`move.mjs --after`) + addon-loader reports a broken pack as broken | — |
| 0.3.80 | (taken) career gate: only Mining selectable, `docs/CAREER_ROADMAP.md` | — |
| 0.3.81 | hygiene: unused imports, unreferenced symbols, dead files confirmed against tests; `tools/codedocs/build.mjs` stops scanning `addon/` for importers | — |
| 0.3.82 | break the 37-file cycle: lift `sim` state object + constants into `sim/state.js`, leave behaviour in `sim.js`; target ≤10-file cycle | — |
| 0.3.83+ | split `sim.js` along its symbol clusters (warp/route, dock/tractor, career, cataclysm, HUD publish) into `sim/*.js`; then lift `mountGame` closure state into `render/scene.js` so its 2.5k lines can split by layer | — |

## Forward-looking upgrades in line with this

- `--check` in the smoke runner (test/codedocs.test.mjs is ready) so a patch that leaves comments in code or stale docs fails the suite.
- `index.json` is the input for the move tool, and can later feed a per-patch **impact report**: given changed files, list every importer and caller that needs re-testing.
- Symbol-level `called by` makes the sim.js split mechanical: each cluster's external callers are already listed in `files/js/sim.js.md`.
