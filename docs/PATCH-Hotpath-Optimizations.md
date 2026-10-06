# Hot-path optimization follow-up

Apply this incremental patch over Living-Galaxy-performance-upgrade-patch (the previous patch with bounded asteroid caching, retained HUD nodes and adaptive resolution). It is based on the supplied 0.3.93 source plus both earlier performance patches, not a fresh fetch of GitHub main. The installer checks exact affected-file hashes, preserves unrelated files, backs up changes and supports repeat installation.

## Implemented

- `js/npc/rogues.js`: index live vessels once per stepRogues call instead of repeatedly scanning the entire traffic list for each wave drone. No index is built without active waves. Preserve Array.find first-match behavior for duplicate IDs. Rebuild after removals and after siege/nest-down hooks, since hooks can mutate the roster. The index is local to the call and cannot survive an exception or stale same-length replacement.
- `js/npc/traffic.js`: reuse cruise gate distance, and compare station capture distance squared. Retain docking projection, port-relative velocity, bay/launch protections, integration cadence and same-tick cargo/job transitions.
- `js/flight/turrets.js`: use squared sensor and corporate-drone firing range checks, reusing the drone range result. Keep inclusive sensor boundaries, exclusive firing boundaries, per-call contact indexing and bidirectional health synchronization.
- `js/npc/combat.js`: reject distant acquisition candidates with squared range before evaluating hostility. Preserve actual distance for scoring, final radius checks, anti-pile-on exclusions and first-best ties.
- `js/render/engine.js`: reuse vessel distances for navigation lights; reuse impactor live-ID storage; remove temporary map-key and asteroid-prefix arrays; replace tractor/event-ring vector clones with dedicated scratch vectors. Retain mount budgets, asteroid ranking, visibility rules, hysteresis, coordinate transforms and disposal behavior.
- `js/npc/ground.js`: choose the nearest threat from the two already-sorted lists without constructing and sorting a third list. Preserve pirate-first equal-distance ties.
- `js/npc/flow.js`: return docked poses before requesting lane geometry. Preserve the timetable.

Relevant note sections under docs/files/js were reviewed and updated. Larger changes to orbital caching, production indexing, retained map SVG and bloom-buffer allocation are deferred for separate measurements and validation. This patch does not alter simulation tick rates, save formats, network protocols or the game version.

## Measurements

Five fresh-process runs per mode and version, alternating execution order, with seeded randomness, 400 warmup ticks and 12,000 measured ticks. Node v24.19.0 on the shared Linux execution environment. Baseline is the previously delivered performance-upgrade patch. The existing benchmark uses actual simulation modules and vendored Three.js, in-memory storage, disabled network access and scheduled client HUD publication. It does not render or paint the DOM.

| Mode | Previous median mean ms/tick | New median mean ms/tick | Tick-time reduction |
|---|---:|---:|---:|
| host | 0.2793 | 0.2365 | 15.3% |
| client | 0.2299 | 0.2170 | 5.6% |

The host trial ranges were separated in this sample; client trial ranges overlap. These results establish measured improvements for this seeded workload on this machine, not guaranteed phone FPS or live-server gains. The benchmark runs include different amounts of simulated time per mode. No GPU frame-time improvement is claimed. Raw trials are in benchmark-results.json.

## Validation

- All 113 Node suites passed, including the new hotpath-optimization suite. Generated docs were refreshed and the final codedocs check passed. The 321-module preload graph remains current.
- New regression checks cover same-length roster replacement, removals, duplicate IDs, callback mutation, callback exceptions, acquisition equivalence against the original algorithm over 100 generated rosters and multiple radii, sensor/firing boundaries and threat ties.
- Seeded host and client runs matched the previous patch exactly for sampled state after 12,400 ticks (400 warmup plus 12,000 measured): NPC identity/state/motion/health, station position/stock/credits/production/siege/guns and ship motion/resources. This checks selected observables, not every internal object.
- The persistent-host test passed: zero-player evolution, checkpoint restoration, archive restart and authority/access boundaries.
- Chromium software-WebGL smoke checks passed in portrait (412x915) and landscape (915x412), with DPR 2. The game ran, HUD nodes remained stable, canvas dimensions were correct and no page errors occurred. This is a functional smoke test, not exhaustive coverage of every visual effect or a hardware GPU benchmark.
- Installer compatibility, idempotence, modified-file rejection and no partial writes on rejection were checked. The unified diff passed git apply --check against the prior patch baseline.

## Reproduce on your device

From the repository root:

```bash
node --import ./test/three-register.mjs test/hotpath-optimization.test.mjs
node --import ./test/three-register.mjs test/performance-upgrade.test.mjs
node --import ./test/three-register.mjs test/sim-performance.test.mjs
node --import ./test/three-register.mjs test/codedocs.test.mjs
python3 test/sol-persistent.test.py
node tools/benchmark-sim.mjs . host 12000
node tools/benchmark-sim.mjs . client 12000
```

Use identical step counts for before/after comparisons. The existing module.register deprecation warning is unrelated to these runtime optimizations and remains in the test loader.
