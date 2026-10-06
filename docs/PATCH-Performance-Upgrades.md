# Performance upgrades for Living Galaxy 0.3.93

This cumulative patch supports the uploaded repository or the first simulation-performance patch. It includes the first patch's changes and adds the upgrades below. `PATCH-Sim-Performance.md` is the historical report for the first patch. The installer preserves unrelated files and refuses to overwrite edits to affected files; hashes for both supported baselines are included.

## Changes

- Bound the procedural asteroid-cell cache to 2,048 recently accessed cells. Evicted geometry regenerates from the same deterministic inputs. Mining depletion remains in its independent state map; partial and complete depletion survive eviction. Query memoization and pooled query arrays remain in place. This bounds cached geometry, not saved mining history or the entire process heap.
- Retain HUD label and marker DOM nodes, updating positions, captions, tags and angles in place. Handle reordering, duplicate IDs, removals and literal text. The painters use dedicated containers, as the game already does.
- Read left-column layout measurements before applying top positions, avoiding the previous alternating write/read sequence.
- Adapt renderer pixel ratio to the existing performance tiers: 2, 1.5, 1.25, 1, capped by device DPR. A lower tier must persist for one second before resizing; recovery waits eight seconds. Device-DPR reductions clamp immediately. CSS viewport size and gameplay cadence are preserved. Lower resolution can soften the 3D image; DOM text remains at native display resolution. On DPR 2, a ratio of 1 renders one quarter as many pixels; this is a pixel-count reduction, not a measured FPS gain.
- Reuse the existing velocity magnitude for uncapped NPC flight and avoid allocating a spread result in lanePoint. Capped speeds and lane geometry retain their original calculations.
- Refresh module preloads and generated source documentation. Add regression tests, browser smoke checks and a reusable field-cache benchmark.

## Measurements

Measurements below compare the first patch against these upgrades, using the real modules under Node on the same shared Linux environment. These are not measurements on the user's phone.

For the cache test, three fresh processes each performed 2,000 queries around the Sol asteroid belt (span 1). Heap was measured after forced GC before and after traversal. Median retained heap delta fell from **25.17 MiB to 2.08 MiB (91.7%)**. The new cache ended at its 2,048-cell limit. Median traversal duration increased from 119.51 ms to 133.54 ms: bounded retention trades some cache bookkeeping/regeneration work for memory. Heap delta is not total application memory.

Five fresh-process runs per simulation mode, alternating baseline/upgraded order, used 400 warmup ticks and 6,000 measured ticks. Median mean tick durations:

| Mode | First patch ms/tick | Upgraded ms/tick | Change |
|---|---:|---:|---:|
| host | 0.2556 | 0.2592 | 1.4% slower |
| client | 0.2544 | 0.2562 | 0.7% slower |

These small differences are within the observed run-to-run variation and do not demonstrate a CPU speedup. The headless simulation benchmark excludes rendering, DOM layout/painting, live networking and checkpoint serialization. It does not measure the main HUD/rendering benefits. Raw samples are supplied in the archive.

## Validation

- All 112 Node test suites passed. Documentation consistency and the 321-module preload graph also passed.
- The persistent-host Python test passed, including zero-player simulation, checkpoint restore and archive restart.
- Seeded host and client runs matched the first patch exactly after 2,400 ticks for sampled NPC motion/health/state, station motion/stock/credits/production/siege/guns, and ship motion/resources. This checks selected observable fields, not every internal object.
- New regressions cover deterministic regeneration, partial/full mining depletion, cache bounds, system changes, query memo reuse, capped/uncapped speed, lane geometry, resolution delays/device limits/tier jitter, and HUD node reconciliation.
- HUD reconciliation tests passed with the included minimal DOM fixture and Linkedom. Real Chromium smoke checks passed at 412×915 and 915×412 with DPR 2 using software WebGL. One hundred stable-entity HUD updates produced zero child-list mutations. The live game continued with finite ship position and correct canvas dimensions at pixel ratio 1; no page errors occurred.
- Software WebGL smoke checks establish functionality, not hardware GPU speed. No phone FPS improvement is claimed.

## Reproduce

From the game repository:

```bash
node --import ./test/three-register.mjs test/performance-upgrade.test.mjs
node --import ./test/three-register.mjs test/hudnodes.test.mjs
node --import ./test/three-register.mjs test/sim-performance.test.mjs
python3 test/sol-persistent.test.py
node tools/benchmark-sim.mjs . host 6000
node tools/benchmark-sim.mjs . client 6000
node --expose-gc tools/benchmark-field-cache.mjs . 2000
```

The field benchmark resets asteroid state in its isolated process, queries the default Sol belt, and reports retained heap and cache statistics. It does not access a live save. For the optional browser smoke test, install Playwright/Chromium separately, serve this repo over localhost port 8124, and run `node test/smoke-performance-upgrade.mjs playwright`. An optional second argument supplies a Chromium executable and a third supplies the server port.

## Further profiling

The remaining candidates need workload-specific evidence: repeated orbital-position/velocity calculations with exact-time invalidation, temporary NPC goal/option objects, frame-median sorting cadence, bloom and station/ship draw calls on phone hardware, and populated checkpoint serialization. Port lookups are a lower priority with only eight Sol stations. None of these were changed in this patch.
