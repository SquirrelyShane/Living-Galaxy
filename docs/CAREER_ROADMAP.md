# Career roadmap

From 0.3.81, a new pilot can enrol in any of the sixteen careers. The roadmap
still records which career loops need more work and what their future updates
will add. It does not restrict creation or lateral transfer.

The switch is `js/careers/status.js`, and `test/careerstatus.test.mjs` guards it.

## Readiness: what "fleshed out" means

A career has a complete loop when it has all nine items that Mining has. These
items track planned work and do not gate access.

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

## Audit at 0.3.80

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

## Order

Careers are ordered by how much they already have, cheapest win first. The reorg line lands
before any of this: 0.3.81 hygiene, 0.3.82 import cycles, and 0.3.83+ the `sim.js` split. The
split pulls the career cluster out of `sim.js`, and every arc below edits that cluster.

| arc | name | careers | slices (one .PP each, in order) |
|---|---|---|---|
| **0.4** | Dead Hulls | Salvage | 0.4 kills and cataclysms leave persistent hulks · .01 cutting a hulk (the verb: plate, parts, black box) · .02 salvage rights, and who owned it yesterday · .03 ARIA salvage loop · .04 bench + smoke-salvage → **open** |
| **0.5** | The Watch | Security | 0.5 picket wings you fly in (the verb) · .01 disable + board, into the brig · .02 security sites: nests and pirate anchorages · .03 tutorial branch · .04 ARIA combat loop with its thin-hull guard · .05 bench + smoke → **open** |
| **0.6** | The Floor | Commerce, Logistics | 0.6 a port order book with post and fill (Commerce verb) · .01 bonded manifests on a clock (Logistics verb) · .02 convoys and cargo insurance · .03 trade and freight hull lines + defaults · .04 two tutorial branches · .05 ARIA · .06 bench + smokes → **open ×2** |
| **0.7** | The Line | Manufacturing, Construction, Shipyard | 0.7 leased fab line, ore to parts (verb, from fabricate.js) · .01 orbital build sites, lift and set (Construction verb) · .02 yard slip, assemble and refit (Shipyard verb) · .03–.06 hulls, tutorials, ARIA, bench + smokes → **open ×3** |
| **0.8** | Heat and Weather | Energy, Terraforming | 0.8 bunker fuel + port reactor service (Energy verb) · .01 atmoworks becomes projects over days · .02–.05 sites, hulls, tutorials, ARIA/bench/smoke → **open ×2** |
| **0.9** | Charted | Research, Navigation | 0.9 anomalies: far scan → sample → paper (Research verb) · .01 lane charting beacon by beacon, and selling the chart (Navigation verb) · .02–.05 → **open ×2** |
| **0.10** | The Town | Healthcare, Agriculture, Education, Communications | 0.10 sick bay: crew, settlers, pulled survivors · .01 hydroponic bay · .02 training crew and raising children into the rolls · .03 relay network + selling news · .04–.08 → **open ×4** |

## How to complete a career loop

1. Build the missing gate items, one `.PP` per item.
2. In `js/careers/status.js`, add the new item to that career's `has`. When all nine are
   there, set `state: "open"`.
3. Update `test/careerstatus.test.mjs` to check the new readiness metadata while
   keeping all sixteen careers selectable.
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
