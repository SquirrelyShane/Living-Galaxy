# Simulation performance patch (baseline 0.3.93)

This patch is based on the uploaded Living-Galaxy repository. It changes two runtime files, adds a regression suite and a reusable headless benchmark, and refreshes generated source documentation. The unrelated pre-existing voice-bank change in the upload is preserved and is not part of this patch. Game version, save format, network protocols, persistent world state, and deployment scripts are unchanged.

## Implemented

- Count live guards once per eligible stepPorts call with a temporary Map, updating the count when spawning. No long-lived indexes are used on externally mutable arrays.
- Use squared distances for guard wake radius and loose-debris clock carry; retain distance calculations where actual lengths are needed.
- Calculate the remote interpolation factor once per client tick.
- Update station positions once in a client tick. tickSim places them before physics; stepWorld skips that second identical update. tickSolHost still places them once through stepWorld.
- Cache HUD route geometry independently of heading. Cache keys include exact ship and destination coordinates, system identity, target metadata, time bucket, and collection sizes. Alignment and spool-dependent ETA are live. HUD previews may retain other hazard changes until the next 0.25 simulation-second bucket; gameplay plotRoute calls always rebuild from the live world. The cache resets on loadSky. Published route objects are not modified in place.
- Enumerate production recipes without allocating an Object.entries tuple array on every station tick. Exported recipe extensions still work.
- Compute distant-station siege pressure and nearest enemy in one pass. Remove unused hp/dps totals and the second full traffic scan. Radius boundaries and equal-distance tie order are preserved.

## Repository measurements

Five fresh-process baseline/patched runs per mode, alternating execution order, 400 warmup ticks and 6000 measured ticks per run. Math.random uses the same seeded generator. Real simulation modules and the vendored Three.js geometry run under Node v24.19.0 on a shared Linux x64 AMD EPYC 9V74 environment. Client HUD publishing follows the renderer's existing >0.07-second interval, with empty projected labels/plots. All relative HTTP fetches are disabled and no renderer or DOM paint is run.

| Workload | Baseline median ms/tick | Patched median ms/tick | Measured reduction |
|---|---:|---:|---:|
| Sol host world tick | 0.2708 | 0.2631 | 2.9% |
| Client tick + scheduled HUD | 0.2649 | 0.2606 | 1.6% |

These small differences are affected by run-to-run variation; they do not establish an equivalent FPS or real host-service CPU gain. The earlier isolated benchmarks demonstrate larger reductions inside specific routines under favorable/stress fixtures. A moving orbital target changes the route endpoint and therefore invalidates the preview geometry; the stationary-route speedup does not apply to all routes. Check the supplied raw samples before extrapolating.

The renderer already throttles publishHud to >0.07 seconds, so no extra HUD throttle was added. Physics, AI and economic step cadence are retained.

## Validation

- All 109 pre-existing Node suites passed on the uploaded baseline.
- The patched functional suites and new sim-performance suite passed. The generated-documentation suite required refreshing docs; it passed after regeneration. Total: 110 passing Node suites across the final validation.
- test/sol-persistent.test.py passed: zero-player evolution, checkpoint persistence, relay archive restart, authority/authentication boundaries, and private resume.
- Seeded baseline and patched runs match exactly after 2400 ticks in both host and client modes for sampled ship motion/resources, NPC flight/health/state, station motion, stock/credits, production, siege and guns. This checks meaningful observable fields, not every internal object in the world.
- New regressions cover contact replacement/capacity/truce/range, debris carry boundaries, dynamic recipe extensions/resources/stalls, siege ties/deaths/radius edge, cached route alignment/ETA/endpoints, fresh hazard decisions, HUD publication, and station poses in client and host ticks.
- No browser GPU/render-FPS measurement was performed. Install into a local preview first and exercise flying, mining, docking, warp, guards and station defense before deploying your normal way.

## Further opportunities

| Area | Evidence in this repo | Next optimization to investigate |
|---|---|---|
| NPC flight | stepHull/stepHullOnce and flyStep appear prominently in the host CPU profile. | Profile movement states separately; reduce temporary goal/option objects and redundant length calculations without changing trajectory/substep behavior. |
| Port lookups | traffic/flowPose repeatedly resolve station IDs with linear searches. | Consider a per-invocation lookup table when station counts grow; preserve same-length mutation and station removal behavior. Eight current Sol ports limit the payoff. |
| Orbital position calculations | bodyVelocity samples bodyPosition twice; rendering, HUD, collisions and gravity request positions repeatedly. | Test a bounded exact-time cache with invalidation for orbit/parent/system changes. Never reuse stale positions across clock corrections or snapshots. |
| Lane calculations | lanePoint calls spreadAt, allocating a small result whose k is immediately consumed. | Inline scalar spread arithmetic or add an output parameter; verify funnel and sublane geometry. stationLane already has a WeakMap cache. |
| Frame statistics | notePerf sorts up to 90 samples every settled frame. | Measure a lower median-update cadence while retaining immediate degradation and recovery hysteresis. |
| GPU rendering | Asteroids, debris and scrap already use InstancedMesh; station/ship detail and bloom still need a browser GPU profile. | Measure renderer draw calls, triangle counts and bloom costs on your phone before changing LOD or resolution. |
| Relay checkpoints | Host serializes world/checkpoint state regularly. | Measure serialization and SQLite write time with a populated save, then consider incremental payloads only if protocol/restart tests continue to pass. |

Several existing optimizations are already present: pooled threat-board rows, memoized asteroid cells/query rings, traffic indexes, adaptive far-NPC budgets, and timed economy ticks. Adding another cache or throttle on top without measuring could introduce stale state or change simulation behavior.

## Reproduce

From the repository root:

```bash
node --import ./test/three-register.mjs test/sim-performance.test.mjs
node --import ./test/three-register.mjs test/codedocs.test.mjs
python3 test/sol-persistent.test.py
node tools/benchmark-sim.mjs . host 6000
node tools/benchmark-sim.mjs . client 6000
```

The benchmark uses in-memory storage and seeded randomness, does not connect to your relay, and does not write game saves. A fifth argument can write sampled simulation state for equality comparisons. Raw before/after trial results are included in this patch archive.
