# Call graph

[index](../README.md)

Resolved calls only: direct calls to local symbols and imported bindings (named, default, namespace). Method calls on imported objects (e.g. `sim.x()`) appear per symbol as **via** lines in each file's doc.

## Most depended-on symbols (by calling files)

| symbol | files | calls |
|---|---|---|
| [js/station/stations.js › stationById](../files/js/station/stations.js.md#s-stationById) | 36 | 138 |
| [js/sim/sim.js › logEvent](../files/js/sim/sim.js.md#s-logEvent) | 30 | 170 |
| [js/economy/materials.js › goodName](../files/js/economy/materials.js.md#s-goodName) | 23 | 104 |
| [js/shipgen/data/catalog/_part.js › P](../files/js/shipgen/data/catalog/_part.js.md#s-P) | 21 | 356 |
| [js/console/kit.js › el](../files/js/console/kit.js.md#s-el) | 21 | 309 |
| [js/ships/shipdb.js › shipById](../files/js/ships/shipdb.js.md#s-shipById) | 20 | 43 |
| [js/console/kit.js › row](../files/js/console/kit.js.md#s-row) | 19 | 257 |
| [js/console/kit.js › button](../files/js/console/kit.js.md#s-button) | 19 | 150 |
| [js/console/kit.js › section](../files/js/console/kit.js.md#s-section) | 19 | 114 |
| [js/console/kit.js › note](../files/js/console/kit.js.md#s-note) | 19 | 106 |
| [js/world/bodies.js › bodyPosition](../files/js/world/bodies.js.md#s-bodyPosition) | 19 | 63 |
| [js/corp/corps.js › corpOfStation](../files/js/corp/corps.js.md#s-corpOfStation) | 16 | 28 |
| [js/shipgen/core/geometry.js › addMesh](../files/js/shipgen/core/geometry.js.md#s-addMesh) | 15 | 447 |
| [js/corp/company.js › hasCompany](../files/js/corp/company.js.md#s-hasCompany) | 15 | 36 |
| [js/crew/ledger.js › firstName](../files/js/crew/ledger.js.md#s-firstName) | 13 | 97 |
| [js/world/field.js › nearbyRocks](../files/js/world/field.js.md#s-nearbyRocks) | 13 | 21 |
| [js/world/bodies.js › dist3](../files/js/world/bodies.js.md#s-dist3) | 12 | 86 |
| [js/corp/corps.js › adjustStanding](../files/js/corp/corps.js.md#s-adjustStanding) | 12 | 46 |
| [js/console/kit.js › group](../files/js/console/kit.js.md#s-group) | 12 | 46 |
| [js/flight/ship.js › holdRoom](../files/js/flight/ship.js.md#s-holdRoom) | 12 | 17 |
| [js/console/kit.js › setBar](../files/js/console/kit.js.md#s-setBar) | 11 | 32 |
| [js/economy/materials.js › baseValue](../files/js/economy/materials.js.md#s-baseValue) | 11 | 22 |
| [js/sim/sim.js › currentShipId](../files/js/sim/sim.js.md#s-currentShipId) | 11 | 20 |
| [js/flight/ship.js › cargoTotal](../files/js/flight/ship.js.md#s-cargoTotal) | 11 | 19 |
| [js/corp/corps.js › corpById](../files/js/corp/corps.js.md#s-corpById) | 11 | 18 |
| [js/npc/traffic.js › vesselById](../files/js/npc/traffic.js.md#s-vesselById) | 10 | 40 |
| [js/console/kit.js › chips](../files/js/console/kit.js.md#s-chips) | 10 | 34 |
| [js/world/generate.js › rngFromSeed](../files/js/world/generate.js.md#s-rngFromSeed) | 10 | 16 |
| [js/crew/ledger.js › rapportBetween](../files/js/crew/ledger.js.md#s-rapportBetween) | 10 | 16 |
| [js/flight/ship.js › batteryCap](../files/js/flight/ship.js.md#s-batteryCap) | 10 | 15 |
| [js/world/bodies.js › bodyById](../files/js/world/bodies.js.md#s-bodyById) | 9 | 37 |
| [js/console/kit.js › card](../files/js/console/kit.js.md#s-card) | 9 | 17 |
| [js/crew/family.js › trustOf](../files/js/crew/family.js.md#s-trustOf) | 9 | 17 |
| [js/world/field.js › inBelt](../files/js/world/field.js.md#s-inBelt) | 9 | 16 |
| [js/asteroidgen/rng.js › RNG](../files/js/asteroidgen/rng.js.md#s-RNG) | 9 | 15 |
| [js/sim/sim.js › selectBody](../files/js/sim/sim.js.md#s-selectBody) | 9 | 14 |
| [js/corp/corps.js › standingLabel](../files/js/corp/corps.js.md#s-standingLabel) | 9 | 12 |
| [js/sim/sim.js › addAnchoredWaypoint](../files/js/sim/sim.js.md#s-addAnchoredWaypoint) | 9 | 11 |
| [js/crew/family.js › adjustMorale](../files/js/crew/family.js.md#s-adjustMorale) | 8 | 31 |
| [js/flight/ship.js › forwardOf](../files/js/flight/ship.js.md#s-forwardOf) | 8 | 22 |
| [js/corp/corps.js › corpOfVessel](../files/js/corp/corps.js.md#s-corpOfVessel) | 8 | 18 |
| [js/comms/chat.js › post](../files/js/comms/chat.js.md#s-post) | 8 | 16 |
| [js/sim/sim.js › sellPriceAt](../files/js/sim/sim.js.md#s-sellPriceAt) | 8 | 11 |
| [js/sim/sim.js › addWaypointAt](../files/js/sim/sim.js.md#s-addWaypointAt) | 8 | 10 |
| [js/sim/sim.js › toggleDock](../files/js/sim/sim.js.md#s-toggleDock) | 8 | 8 |
| [js/mission/script.js › makeStep](../files/js/mission/script.js.md#s-makeStep) | 7 | 75 |
| [js/asteroidgen/rng.js › unitVec](../files/js/asteroidgen/rng.js.md#s-unitVec) | 7 | 30 |
| [js/economy/economy.js › stockOf](../files/js/economy/economy.js.md#s-stockOf) | 7 | 23 |
| [js/mission/run.js › startMission](../files/js/mission/run.js.md#s-startMission) | 7 | 21 |
| [js/sim/sim.js › setMiningMode](../files/js/sim/sim.js.md#s-setMiningMode) | 7 | 15 |
| [js/flight/repair.js › hullMaxOf](../files/js/flight/repair.js.md#s-hullMaxOf) | 7 | 14 |
| [js/asteroidgen/rng.js › hashString](../files/js/asteroidgen/rng.js.md#s-hashString) | 7 | 12 |
| [js/npc/cradle.js › generateNPC](../files/js/npc/cradle.js.md#s-generateNPC) | 7 | 10 |
| [js/sim/sim.js › warpNodeById](../files/js/sim/sim.js.md#s-warpNodeById) | 6 | 25 |
| [js/mission/run.js › stopMission](../files/js/mission/run.js.md#s-stopMission) | 6 | 20 |
| [js/mission/script.js › makeMission](../files/js/mission/script.js.md#s-makeMission) | 6 | 18 |
| [js/crew/family.js › loadSocial](../files/js/crew/family.js.md#s-loadSocial) | 6 | 14 |
| [js/sim/sim.js › acquireLock](../files/js/sim/sim.js.md#s-acquireLock) | 6 | 14 |
| [js/sim/sim.js › losBlocker](../files/js/sim/sim.js.md#s-losBlocker) | 6 | 11 |
| [js/npc/lanes.js › stationLane](../files/js/npc/lanes.js.md#s-stationLane) | 6 | 11 |

## Cross-file edges per file (outgoing)

- [js/aria/aria.js](../files/js/aria/aria.js.md) → js/aria/pilot.js ×10, js/npc/captain.js ×3, js/comms/chat.js ×3, js/sim/sim.js ×1
- [js/aria/company.js](../files/js/aria/company.js.md) → js/corp/company.js ×15, js/crew/ledger.js ×9, js/crew/roster.js ×7, js/sim/sim.js ×3, js/economy/traderoutes.js ×1, js/flight/ship.js ×1, js/station/stations.js ×1
- [js/aria/nav.js](../files/js/aria/nav.js.md) → js/sim/sim.js ×8, js/world/bodies.js ×4, js/station/stations.js ×1
- [js/aria/pilot.js](../files/js/aria/pilot.js.md) → js/mission/script.js ×19, js/flight/repair.js ×8, js/economy/fabricate.js ×8, js/economy/upgrades.js ×6, js/sim/sim.js ×6, js/world/bodies.js ×5, js/station/stations.js ×5, js/drones/ops.js ×3, js/flight/autopilot.js ×3, js/mission/run.js ×3, js/flight/recorder.js ×2, js/flight/ship.js ×2, js/corp/company.js ×1
- [js/aria/play.js](../files/js/aria/play.js.md) → js/mission/script.js ×30, js/economy/contracts.js ×20, js/aria/nav.js ×15, js/mission/run.js ×15, js/station/stations.js ×11, js/flight/repair.js ×7, js/economy/economy.js ×6, js/flight/ship.js ×5, js/economy/traderoutes.js ×4, js/aria/senses.js ×4, js/aria/company.js ×4, js/economy/chains.js ×2, js/station/dockwork.js ×2, js/corp/company.js ×1, js/sim/sim.js ×1, js/economy/materials.js ×1
- [js/aria/senses.js](../files/js/aria/senses.js.md) → js/economy/materials.js ×6, js/world/bodies.js ×5, js/sim/sim.js ×4, js/flight/repair.js ×4, js/station/stations.js ×4, js/flight/ship.js ×3, js/world/field.js ×3, js/world/scale.js ×2, js/economy/economy.js ×2, js/corp/corps.js ×2, js/ships/shipdb.js ×1, js/economy/sites.js ×1, js/economy/contracts.js ×1, js/economy/chains.js ×1, js/economy/traderoutes.js ×1
- [js/asteroidgen/blackhole.js](../files/js/asteroidgen/blackhole.js.md) → js/asteroidgen/kerr.js ×4
- [js/asteroidgen/debris.js](../files/js/asteroidgen/debris.js.md) → js/asteroidgen/rng.js ×17
- [js/asteroidgen/fracture.js](../files/js/asteroidgen/fracture.js.md) → js/asteroidgen/rng.js ×16
- [js/asteroidgen/generator.js](../files/js/asteroidgen/generator.js.md) → js/asteroidgen/rng.js ×33, js/asteroidgen/ores.js ×4, js/asteroidgen/debris.js ×2
- [js/asteroidgen/impact-sim.js](../files/js/asteroidgen/impact-sim.js.md) → js/asteroidgen/rng.js ×3
- [js/asteroidgen/impact.js](../files/js/asteroidgen/impact.js.md) → js/asteroidgen/rng.js ×17
- [js/asteroidgen/ores.js](../files/js/asteroidgen/ores.js.md) → js/world/rockgen.js ×3
- [js/asteroidgen/tidal.js](../files/js/asteroidgen/tidal.js.md) → js/asteroidgen/fracture.js ×4, js/asteroidgen/rng.js ×3, js/asteroidgen/kerr.js ×2
- [js/audio/ambience.js](../files/js/audio/ambience.js.md) → js/audio/graph.js ×7, js/audio/voices.js ×7
- [js/audio/cues.js](../files/js/audio/cues.js.md) → js/audio/voices.js ×82, js/audio/graph.js ×18
- [js/audio/index.js](../files/js/audio/index.js.md) → js/audio/graph.js ×5, js/audio/ambience.js ×2, js/audio/voices.js ×1
- [js/audio/voices.js](../files/js/audio/voices.js.md) → js/audio/graph.js ×25
- [js/bodygen/body.js](../files/js/bodygen/body.js.md) → js/asteroidgen/generator.js ×2, js/bodygen/bake.js ×2, js/world/rockgen.js ×2
- [js/bodygen/grower.js](../files/js/bodygen/grower.js.md) → js/bodygen/body.js ×1
- [js/careers/careerEngine.js](../files/js/careers/careerEngine.js.md) → js/careers/complexes.js ×15, js/careers/skills.js ×1
- [js/comms/comms.js](../files/js/comms/comms.js.md) → js/sim/sim.js ×28, js/comms/call-scripts.js ×14, js/corp/corps.js ×10, js/station/stations.js ×9, js/npc/speech.js ×6, js/npc/reports.js ×4, js/comms/gnn.js ×3, js/npc/traffic.js ×3, js/station/stationworks.js ×2, js/comms/call-session.js ×2, js/npc/battles.js ×2, js/interior/boarding.js ×1, js/economy/materials.js ×1, js/world/bodies.js ×1, js/economy/economy.js ×1, js/npc/cradle.js ×1, js/comms/chat.js ×1, js/comms/call-ui.js ×1, js/net/net.js ×1, js/world/generate.js ×1
- [js/comms/gnn.js](../files/js/comms/gnn.js.md) → js/comms/chat.js ×1
- [js/console/console.js](../files/js/console/console.js.md) → js/console/kit.js ×12, js/console/search.js ×5, js/sim/sim.js ×3, js/ui/map.js ×1, js/interior/interior.js ×1, js/ui/tutorial.js ×1
- [js/console/panels/corp-account.js](../files/js/console/panels/corp-account.js.md) → js/console/kit.js ×53, js/net/account.js ×10
- [js/console/panels/corp-marshal.js](../files/js/console/panels/corp-marshal.js.md) → js/console/kit.js ×29, js/npc/bounty.js ×10, js/corp/corps.js ×2, js/station/stations.js ×1
- [js/console/panels/corp-town.js](../files/js/console/panels/corp-town.js.md) → js/console/kit.js ×50, js/station/staffline.js ×28, js/station/stationlife.js ×4, js/station/stafflife.js ×4, js/station/staffcare.js ×3, js/corp/company.js ×3, js/ui/glyphs.js ×1, js/npc/cradle.js ×1, js/station/stationclock.js ×1
- [js/console/panels/corp.js](../files/js/console/panels/corp.js.md) → js/console/kit.js ×89, js/flight/pilot.js ×15, js/corp/company.js ×12, js/corp/corps.js ×5, js/crew/races.js ×3, js/station/staffline.js ×3, js/station/stations.js ×2, js/ui/glyphs.js ×2, js/economy/contracts.js ×2, js/ui/boardview.js ×2, js/comms/gnn.js ×2, js/npc/bounty.js ×2, js/careers/careerEngine.js ×1, js/sim/sim.js ×1, js/console/panels/corp-town.js ×1, js/console/panels/corp-marshal.js ×1, js/console/panels/corp-account.js ×1, js/net/account.js ×1
- [js/console/panels/crew-brig.js](../files/js/console/panels/crew-brig.js.md) → js/console/kit.js ×35, js/crew/captive.js ×8, js/npc/bounty.js ×4, js/corp/corps.js ×1, js/crew/ledger.js ×1
- [js/console/panels/crew-gdb.js](../files/js/console/panels/crew-gdb.js.md) → js/console/kit.js ×28, js/corp/gdb.js ×7, js/station/stations.js ×1, js/npc/cradle.js ×1
- [js/console/panels/crew-gene.js](../files/js/console/panels/crew-gene.js.md) → js/console/kit.js ×87, js/crew/ledger.js ×6, js/crew/orders.js ×6, js/crew/deckmind.js ×4, js/crew/learn.js ×4, js/crew/heritage.js ×3, js/crew/journal.js ×2, js/npc/cradle.js ×1, js/genome/spacer.js ×1
- [js/console/panels/crew-sky.js](../files/js/console/panels/crew-sky.js.md) → js/console/kit.js ×34, js/npc/npccrew.js ×2
- [js/console/panels/crew.js](../files/js/console/panels/crew.js.md) → js/console/kit.js ×100, js/crew/ledger.js ×15, js/crew/family.js ×13, js/crew/romance.js ×9, js/crew/childtalk.js ×5, js/crew/roster.js ×3, js/npc/captain.js ×2, js/corp/company.js ×2, js/crew/children.js ×2, js/console/panels/crew-gene.js ×2, js/crew/tiers.js ×1, js/crew/duties.js ×1, js/crew/talk.js ×1, js/crew/talkview.js ×1, js/crew/bonds.js ×1, js/crew/hooks.js ×1, js/console/panels/crew-sky.js ×1, js/console/panels/crew-brig.js ×1, js/console/panels/crew-gdb.js ×1, js/crew/beats.js ×1
- [js/console/panels/market.js](../files/js/console/panels/market.js.md) → js/console/kit.js ×77, js/sim/sim.js ×21, js/mission/script.js ×6, js/economy/materials.js ×5, js/economy/traderoutes.js ×3, js/flight/ship.js ×3, js/mission/run.js ×2, js/economy/icework.js ×2, js/station/stations.js ×1, js/economy/upgrades.js ×1, js/station/refityard.js ×1
- [js/console/panels/nav.js](../files/js/console/panels/nav.js.md) → js/console/kit.js ×116, js/sim/sim.js ×14, js/mission/run.js ×10, js/world/bodies.js ×7, js/aria/aria.js ×7, js/flight/ship.js ×3, js/world/field.js ×3, js/mission/script.js ×2, js/world/anchors.js ×1, js/flight/autopilot.js ×1, js/station/stations.js ×1, js/economy/materials.js ×1, js/bodygen/body.js ×1
- [js/console/panels/ship.js](../files/js/console/panels/ship.js.md) → js/console/kit.js ×115, js/sim/sim.js ×18, js/ui/charts.js ×8, js/flight/ship.js ×4, js/crew/duties.js ×1, js/crew/robots.js ×1, js/flight/autopilot.js ×1, js/economy/upgrades.js ×1
- [js/console/panels/work-drones.js](../files/js/console/panels/work-drones.js.md) → js/console/kit.js ×41, js/drones/ops.js ×29, js/station/stations.js ×3, js/corp/company.js ×2, js/sim/sim.js ×1, js/economy/insurance.js ×1, js/drones/board.js ×1, js/drones/npcdrones.js ×1
- [js/console/panels/work-fleet.js](../files/js/console/panels/work-fleet.js.md) → js/console/kit.js ×14, js/corp/fleet.js ×5, js/corp/company.js ×3, js/station/stations.js ×1
- [js/console/panels/work-tape.js](../files/js/console/panels/work-tape.js.md) → js/console/kit.js ×23, js/flight/recorder.js ×10
- [js/console/panels/work.js](../files/js/console/panels/work.js.md) → js/console/kit.js ×98, js/mission/script.js ×21, js/mission/run.js ×13, js/ui/tutorial.js ×2, js/economy/fabricate.js ×2, js/console/console.js ×1
- [js/console/search.js](../files/js/console/search.js.md) → js/console/console.js ×4
- [js/core/store.js](../files/js/core/store.js.md) → js/world/bodies.js ×1
- [js/corp/company.js](../files/js/corp/company.js.md) → js/station/stations.js ×6, js/station/stationlife.js ×5, js/crew/ledger.js ×4, js/station/stafflife.js ×4, js/sim/sim.js ×3, js/station/staffline.js ×3, js/corp/corps.js ×2
- [js/corp/corps.js](../files/js/corp/corps.js.md) → js/data/factions.js ×3
- [js/corp/fleet.js](../files/js/corp/fleet.js.md) → js/ships/shipdb.js ×5, js/corp/company.js ×5, js/npc/traffic.js ×3, js/station/stations.js ×3, js/sim/sim.js ×3, js/economy/economy.js ×2, js/corp/corps.js ×1, js/economy/shipcost.js ×1
- [js/corp/gdb.js](../files/js/corp/gdb.js.md) → js/world/names.js ×3
- [js/corp/seclevel.js](../files/js/corp/seclevel.js.md) → js/npc/security.js ×11, js/flight/turrets.js ×7, js/npc/traffic.js ×7, js/corp/corps.js ×6, js/station/stations.js ×1
- [js/crew/beats.js](../files/js/crew/beats.js.md) → js/crew/family.js ×12, js/crew/ledger.js ×3, js/crew/romance.js ×2, js/crew/bonds.js ×1, js/crew/hooks.js ×1
- [js/crew/bonds.js](../files/js/crew/bonds.js.md) → js/crew/ledger.js ×12, js/crew/family.js ×2
- [js/crew/captive.js](../files/js/crew/captive.js.md) → js/corp/corps.js ×5, js/crew/ledger.js ×3, js/crew/deckmind.js ×2, js/sim/sim.js ×2
- [js/crew/children.js](../files/js/crew/children.js.md) → js/genome/spacer.js ×5, js/npc/cradle.js ×4, js/crew/family.js ×2, js/crew/voice.js ×2, js/crew/ledger.js ×1, js/sim/sim.js ×1
- [js/crew/childtalk.js](../files/js/crew/childtalk.js.md) → js/crew/children.js ×12, js/crew/ledger.js ×11, js/crew/family.js ×4, js/station/stations.js ×1
- [js/crew/deckacts.js](../files/js/crew/deckacts.js.md) → js/crew/ledger.js ×21, js/crew/romance.js ×9, js/crew/family.js ×7, js/crew/bonds.js ×7, js/crew/journal.js ×3, js/crew/heritage.js ×3
- [js/crew/deckgraph.js](../files/js/crew/deckgraph.js.md) → js/crew/learn.js ×1, js/genome/behavior-graph.js ×1
- [js/crew/deckmind.js](../files/js/crew/deckmind.js.md) → js/crew/journal.js ×28, js/crew/romance.js ×14, js/genome/spacer.js ×9, js/crew/learn.js ×4, js/crew/family.js ×3, js/crew/hull.js ×2, js/genome/context.js ×2, js/npc/cradle.js ×2, js/genome/behavior-graph.js ×2, js/crew/bonds.js ×1, js/crew/ledger.js ×1, js/crew/deckacts.js ×1
- [js/crew/duties.js](../files/js/crew/duties.js.md) → js/crew/roster.js ×3, js/crew/family.js ×3, js/npc/crewfx.js ×1, js/economy/upgrades.js ×1, js/crew/ledger.js ×1
- [js/crew/family.js](../files/js/crew/family.js.md) → js/crew/voice.js ×25, js/genome/spacer.js ×11, js/npc/cradle.js ×8, js/crew/heritage.js ×4, js/sim/sim.js ×4, js/corp/company.js ×4, js/world/names.js ×2, js/corp/gdb.js ×1, js/crew/children.js ×1, js/station/stations.js ×1, js/station/stationlife.js ×1, js/crew/ledger.js ×1
- [js/crew/hull.js](../files/js/crew/hull.js.md) → js/crew/roster.js ×3, js/npc/crewfx.js ×1, js/crew/ledger.js ×1, js/crew/family.js ×1
- [js/crew/learn.js](../files/js/crew/learn.js.md) → js/npc/brain.js ×5
- [js/crew/ledger.js](../files/js/crew/ledger.js.md) → js/npc/cradle.js ×5, js/genome/spacer.js ×3, js/corp/gdb.js ×1
- [js/crew/orders.js](../files/js/crew/orders.js.md) → js/crew/ledger.js ×8, js/crew/deckmind.js ×6, js/crew/family.js ×5, js/crew/hull.js ×1, js/crew/bonds.js ×1, js/crew/learn.js ×1
- [js/crew/races.js](../files/js/crew/races.js.md) → js/careers/effects.js ×1
- [js/crew/robots.js](../files/js/crew/robots.js.md) → js/economy/upgrades.js ×3, js/robotgen/spec.js ×1
- [js/crew/robotyard.js](../files/js/crew/robotyard.js.md) → js/console/kit.js ×16, js/crew/robots.js ×7
- [js/crew/romance.js](../files/js/crew/romance.js.md) → js/crew/ledger.js ×26, js/crew/family.js ×13, js/crew/bonds.js ×5, js/genome/spacer.js ×3, js/npc/cradle.js ×2, js/crew/hooks.js ×1
- [js/crew/roster.js](../files/js/crew/roster.js.md) → js/crew/family.js ×3, js/interior/deckplan.js ×2, js/ships/shipdb.js ×2, js/sim/sim.js ×1, js/npc/crewfx.js ×1, js/crew/bonds.js ×1
- [js/crew/talk-threads.js](../files/js/crew/talk-threads.js.md) → js/crew/ledger.js ×6, js/crew/duties.js ×1, js/economy/materials.js ×1, js/sim/sim.js ×1
- [js/crew/talk-trees.js](../files/js/crew/talk-trees.js.md) → js/crew/voice.js ×20, js/crew/ledger.js ×6, js/crew/roster.js ×4, js/crew/duties.js ×1, js/crew/family.js ×1
- [js/crew/talk-wants.js](../files/js/crew/talk-wants.js.md) → js/crew/ledger.js ×4, js/crew/duties.js ×1, js/genome/spacer.js ×1
- [js/crew/talk.js](../files/js/crew/talk.js.md) → js/crew/voice.js ×15, js/crew/family.js ×11, js/crew/tiers.js ×9, js/crew/ledger.js ×4, js/crew/roster.js ×4, js/crew/bonds.js ×3, js/crew/hooks.js ×1, js/sim/sim.js ×1
- [js/crew/talkview.js](../files/js/crew/talkview.js.md) → js/crew/talk.js ×8, js/crew/beats.js ×5, js/crew/family.js ×2, js/crew/ledger.js ×1, js/npc/cradle.js ×1
- [js/crew/tiers.js](../files/js/crew/tiers.js.md) → js/crew/family.js ×5, js/crew/romance.js ×3, js/crew/ledger.js ×1
- [js/drones/board.js](../files/js/drones/board.js.md) → js/economy/economy.js ×4, js/economy/materials.js ×1
- [js/drones/droneforge.js](../files/js/drones/droneforge.js.md) → js/drones/dronespec.js ×1, js/robotgen/build.js ×1
- [js/drones/dronespec.js](../files/js/drones/dronespec.js.md) → js/robotgen/spec.js ×1
- [js/drones/npcdrones.js](../files/js/drones/npcdrones.js.md) → js/drones/board.js ×8, js/npc/bay.js ×6, js/station/stations.js ×5, js/economy/economy.js ×4, js/world/field.js ×2, js/world/generate.js ×1, js/corp/corps.js ×1
- [js/drones/ops.js](../files/js/drones/ops.js.md) → js/station/stations.js ×20, js/economy/economy.js ×12, js/economy/materials.js ×12, js/drones/board.js ×11, js/sim/sim.js ×9, js/economy/insurance.js ×9, js/corp/company.js ×8, js/npc/bay.js ×6, js/world/field.js ×5, js/comms/chat.js ×4, js/world/bodies.js ×3, js/drones/dronespec.js ×3, js/world/debris.js ×3, js/flight/turrets.js ×2, js/comms/gnn.js ×2, js/flight/probes.js ×2, js/flight/ship.js ×1, js/drones/roles.js ×1, js/world/anchors.js ×1, js/npc/traffic.js ×1, js/npc/battles.js ×1
- [js/economy/chains.js](../files/js/economy/chains.js.md) → js/station/stations.js ×4
- [js/economy/contracts.js](../files/js/economy/contracts.js.md) → js/economy/materials.js ×51, js/economy/economy.js ×20, js/sim/sim.js ×11, js/corp/corps.js ×11, js/economy/sites.js ×10, js/economy/chains.js ×8, js/flight/ship.js ×5, js/world/bodies.js ×4, js/station/stations.js ×4, js/world/generate.js ×2, js/station/dockwork.js ×2, js/corp/company.js ×2, js/ships/shipdb.js ×1, js/flight/pilot.js ×1
- [js/economy/economy.js](../files/js/economy/economy.js.md) → js/economy/materials.js ×11
- [js/economy/fabricate.js](../files/js/economy/fabricate.js.md) → js/economy/materials.js ×8
- [js/economy/icework.js](../files/js/economy/icework.js.md) → js/economy/materials.js ×4, js/sim/sim.js ×3, js/ships/shipdb.js ×1, js/flight/ship.js ×1
- [js/economy/shipcost.js](../files/js/economy/shipcost.js.md) → js/shipgen/data/bom.js ×2, js/ships/hullspec.js ×2
- [js/economy/sites.js](../files/js/economy/sites.js.md) → js/economy/materials.js ×1
- [js/economy/traderoutes.js](../files/js/economy/traderoutes.js.md) → js/sim/sim.js ×10, js/economy/materials.js ×2, js/flight/ship.js ×1
- [js/economy/upgrades.js](../files/js/economy/upgrades.js.md) → js/ships/shipdb.js ×1, js/sim/sim.js ×1, js/careers/effects.js ×1, js/flight/pilot.js ×1
- [js/flight/autopilot.js](../files/js/flight/autopilot.js.md) → js/sim/sim.js ×40, js/mission/script.js ×15, js/mission/run.js ×11, js/world/bodies.js ×11, js/world/field.js ×8, js/flight/avoid.js ×8, js/flight/ship.js ×7, js/core/input.js ×3, js/aria/aria.js ×2, js/npc/lanes.js ×2, js/economy/contracts.js ×1, js/economy/materials.js ×1, js/station/stationworks.js ×1
- [js/flight/avoid.js](../files/js/flight/avoid.js.md) → js/world/bodies.js ×6, js/world/scale.js ×1, js/world/events/holes.js ×1, js/world/field.js ×1
- [js/flight/contacts.js](../files/js/flight/contacts.js.md) → js/flight/ship.js ×1
- [js/flight/pilot.js](../files/js/flight/pilot.js.md) → js/careers/careerEngine.js ×15, js/crew/races.js ×6, js/careers/complexes.js ×6, js/careers/effects.js ×4, js/careers/status.js ×3, js/corp/corps.js ×2
- [js/flight/probes.js](../files/js/flight/probes.js.md) → js/world/bodies.js ×7, js/sim/sim.js ×5, js/world/field.js ×3
- [js/flight/repair.js](../files/js/flight/repair.js.md) → js/sim/sim.js ×2, js/corp/corps.js ×1, js/station/stations.js ×1, js/economy/upgrades.js ×1
- [js/flight/ship.js](../files/js/flight/ship.js.md) → js/flight/defence.js ×2, js/economy/materials.js ×2, js/careers/effects.js ×1, js/world/events/holes.js ×1
- [js/flight/turrets.js](../files/js/flight/turrets.js.md) → js/flight/ship.js ×6, js/world/field.js ×2, js/aria/aria.js ×2, js/world/generate.js ×1, js/npc/battles.js ×1, js/economy/materials.js ×1, js/world/debris.js ×1
- [js/genome/context.js](../files/js/genome/context.js.md) → js/genome/genome-256.js ×2
- [js/genome/spacer.js](../files/js/genome/spacer.js.md) → js/genome/genome-256.js ×7, js/genome/context.js ×3
- [js/interior/boarding.js](../files/js/interior/boarding.js.md) → js/sim/sim.js ×1, js/npc/cradle.js ×1, js/corp/gdb.js ×1, js/flight/ship.js ×1
- [js/interior/interior.js](../files/js/interior/interior.js.md) → js/npc/captain.js ×5, js/interior/deckplan.js ×4, js/core/input.js ×4, js/sim/sim.js ×2, js/ships/shipdb.js ×2, js/npc/crewfx.js ×2, js/crew/talkview.js ×1, js/crew/ledger.js ×1
- [js/main.js](../files/js/main.js.md) → js/core/store.js ×2, js/sim/sim.js ×2, js/core/boot.js ×1, js/audio/index.js ×1, js/render/engine.js ×1, js/ui/hud.js ×1, js/net/account.js ×1, js/flight/pilot.js ×1
- [js/mission/run.js](../files/js/mission/run.js.md) → js/sim/sim.js ×28, js/flight/autopilot.js ×25, js/mission/script.js ×12, js/station/stations.js ×4, js/world/bodies.js ×3, js/flight/ship.js ×2, js/world/field.js ×2, js/mission/tradeops.js ×1, js/economy/sites.js ×1, js/comms/chat.js ×1
- [js/mission/script.js](../files/js/mission/script.js.md) → js/flight/ship.js ×2, js/economy/upgrades.js ×2
- [js/mission/tradeops.js](../files/js/mission/tradeops.js.md) → js/sim/sim.js ×9, js/economy/traderoutes.js ×6, js/flight/ship.js ×5, js/economy/contracts.js ×4, js/station/stations.js ×3
- [js/net/account.js](../files/js/net/account.js.md) → js/comms/gnn.js ×1
- [js/net/net.js](../files/js/net/net.js.md) → js/sim/sim.js ×7
- [js/net/worldsync.js](../files/js/net/worldsync.js.md) → js/sim/sim.js ×10, js/net/net.js ×5, js/world/events/impactors.js ×4, js/npc/traffic.js ×2, js/world/events/holes.js ×2, js/comms/gnn.js ×1
- [js/npc/battles.js](../files/js/npc/battles.js.md) → js/npc/traffic.js ×11, js/corp/corps.js ×3, js/world/generate.js ×1, js/world/debris.js ×1
- [js/npc/bay.js](../files/js/npc/bay.js.md) → js/npc/lanes.js ×2
- [js/npc/bounty.js](../files/js/npc/bounty.js.md) → js/corp/corps.js ×16, js/npc/cradle.js ×3, js/crew/deckmind.js ×2, js/sim/sim.js ×1, js/corp/gdb.js ×1, js/station/stations.js ×1
- [js/npc/captain.js](../files/js/npc/captain.js.md) → js/sim/sim.js ×22, js/npc/brain.js ×8, js/flight/ship.js ×5, js/core/input.js ×4, js/world/bodies.js ×3, js/station/stations.js ×2, js/world/field.js ×2, js/economy/icework.js ×2, js/corp/corps.js ×1, js/station/stationworks.js ×1
- [js/npc/combat.js](../files/js/npc/combat.js.md) → js/npc/traffic.js ×8, js/npc/flight.js ×7, js/corp/corps.js ×3, js/npc/security.js ×2, js/core/perf.js ×1, js/flight/turrets.js ×1
- [js/npc/cradle.js](../files/js/npc/cradle.js.md) → js/genome/spacer.js ×19, js/world/names.js ×3
- [js/npc/crewfx.js](../files/js/npc/crewfx.js.md) → js/interior/deckplan.js ×2, js/ships/shipdb.js ×2, js/crew/duties.js ×2, js/careers/effects.js ×1, js/crew/bonds.js ×1, js/flight/pilot.js ×1
- [js/npc/flight.js](../files/js/npc/flight.js.md) → js/ships/shipdb.js ×1
- [js/npc/flow.js](../files/js/npc/flow.js.md) → js/economy/economy.js ×4, js/npc/lanes.js ×3, js/npc/bay.js ×3, js/world/generate.js ×1, js/ships/shipdb.js ×1, js/economy/materials.js ×1
- [js/npc/ground.js](../files/js/npc/ground.js.md) → js/npc/traffic.js ×4, js/world/field.js ×2, js/economy/materials.js ×2, js/npc/battles.js ×1
- [js/npc/npccrew.js](../files/js/npc/npccrew.js.md) → js/crew/deckmind.js ×3, js/npc/cradle.js ×2, js/corp/gdb.js ×2, js/npc/traffic.js ×2, js/ships/shipdb.js ×1, js/sim/sim.js ×1, js/npc/battles.js ×1, js/crew/hull.js ×1
- [js/npc/reports.js](../files/js/npc/reports.js.md) → js/npc/ground.js ×53, js/economy/materials.js ×2, js/npc/traffic.js ×1
- [js/npc/rogues.js](../files/js/npc/rogues.js.md) → js/npc/flight.js ×5, js/npc/traffic.js ×3, js/world/generate.js ×1, js/core/perf.js ×1, js/station/stationworks.js ×1
- [js/npc/security.js](../files/js/npc/security.js.md) → js/npc/traffic.js ×6, js/corp/corps.js ×5, js/npc/flight.js ×5, js/core/perf.js ×2
- [js/npc/speech.js](../files/js/npc/speech.js.md) → js/npc/ground.js ×12, js/speech/npc-speech.js ×9, js/corp/corps.js ×5, js/npc/chat.js ×4, js/economy/materials.js ×2, js/ui/glyphs.js ×1, js/corp/gdb.js ×1, js/world/names.js ×1, js/ships/shipdb.js ×1, js/npc/reports.js ×1
- [js/npc/traffic.js](../files/js/npc/traffic.js.md) → js/npc/flight.js ×31, js/npc/lanes.js ×17, js/npc/bay.js ×8, js/economy/economy.js ×6, js/world/generate.js ×3, js/ships/shipdb.js ×3, js/economy/insurance.js ×2, js/corp/corps.js ×2, js/npc/cradle.js ×1, js/corp/gdb.js ×1, js/world/bodies.js ×1, js/core/perf.js ×1
- [js/render/attract.js](../files/js/render/attract.js.md) → js/ships/shipforge.js ×3, js/ships/shipdb.js ×2, js/world/bodies.js ×2
- [js/render/engine.js](../files/js/render/engine.js.md) → js/world/bodies.js ×36, js/flight/ship.js ×14, js/sim/sim.js ×13, js/npc/lanes.js ×9, js/bodygen/grower.js ×8, js/drones/droneforge.js ×6, js/world/events/cataclysm.js ×6, js/render/hullpool.js ×6, js/ships/shipforge.js ×5, js/world/textures.js ×5, js/bodygen/baked.js ×4, js/flight/contacts.js ×4, js/world/field.js ×3, js/ships/shipdb.js ×2, js/ui/tutorial.js ×2, js/aria/aria.js ×2, js/net/worldsync.js ×2, js/core/input.js ×2, js/stationgen/anim.js ×2, js/audio/index.js ×2, js/render/warpfx.js ×1, js/render/postfx.js ×1, js/render/rockfx.js ×1, js/render/impactfx.js ×1, js/render/holefx.js ×1, js/render/attract.js ×1, js/station/stationyard.js ×1, js/world/scale.js ×1, js/world/rockgen.js ×1, js/bodygen/body.js ×1, js/core/perf.js ×1, js/npc/battles.js ×1
- [js/render/holefx.js](../files/js/render/holefx.js.md) → js/asteroidgen/kerr.js ×4, js/bodygen/gl.js ×4, js/world/events/holes.js ×4, js/asteroidgen/tidal.js ×3, js/bodygen/body.js ×3, js/asteroidgen/debris.js ×1, js/asteroidgen/rng.js ×1, js/world/rockgen.js ×1, js/world/events/impacts.js ×1, js/asteroidgen/blackhole.js ×1
- [js/render/hullpool.js](../files/js/render/hullpool.js.md) → js/ships/shipdb.js ×2, js/ships/shipforge.js ×2, js/shipgen/anim.js ×2
- [js/render/impactfx.js](../files/js/render/impactfx.js.md) → js/asteroidgen/impact-sim.js ×3, js/bodygen/gl.js ×1, js/asteroidgen/debris.js ×1, js/asteroidgen/rng.js ×1, js/asteroidgen/fracture.js ×1
- [js/render/rockfx.js](../files/js/render/rockfx.js.md) → js/bodygen/gl.js ×3, js/asteroidgen/debris.js ×2, js/asteroidgen/generator.js ×1
- [js/robotgen/attach.js](../files/js/robotgen/attach.js.md) → js/robotgen/parts.js ×260, js/robotgen/kit.js ×1
- [js/robotgen/build.js](../files/js/robotgen/build.js.md) → js/robotgen/parts.js ×192, js/robotgen/physics.js ×7, js/robotgen/attach.js ×3, js/robotgen/fly.js ×3
- [js/robotgen/data/bom.js](../files/js/robotgen/data/bom.js.md) → js/robotgen/data/catalog.js ×1
- [js/robotgen/drills.js](../files/js/robotgen/drills.js.md) → js/robotgen/physics.js ×3, js/robotgen/build.js ×1
- [js/robotgen/fly.js](../files/js/robotgen/fly.js.md) → js/robotgen/parts.js ×73
- [js/robotgen/kit.js](../files/js/robotgen/kit.js.md) → js/robotgen/parts.js ×150
- [js/robotgen/spec.js](../files/js/robotgen/spec.js.md) → js/robotgen/data/bom.js ×1
- [js/robotgen/world.js](../files/js/robotgen/world.js.md) → js/robotgen/spec.js ×2
- [js/shipgen/builder/StarshipBuilder.js](../files/js/shipgen/builder/StarshipBuilder.js.md) → js/shipgen/core/geometry.js ×20, js/shipgen/builder/faces.js ×3, js/shipgen/core/rng.js ×1
- [js/shipgen/builder/details.js](../files/js/shipgen/builder/details.js.md) → js/shipgen/core/geometry.js ×1
- [js/shipgen/builder/docking.js](../files/js/shipgen/builder/docking.js.md) → js/shipgen/core/geometry.js ×9
- [js/shipgen/builder/drives.js](../files/js/shipgen/builder/drives.js.md) → js/shipgen/core/geometry.js ×59
- [js/shipgen/builder/glazing.js](../files/js/shipgen/builder/glazing.js.md) → js/shipgen/core/geometry.js ×10, js/shipgen/builder/faces.js ×1
- [js/shipgen/builder/hull.js](../files/js/shipgen/builder/hull.js.md) → js/shipgen/core/geometry.js ×91
- [js/shipgen/builder/placement.js](../files/js/shipgen/builder/placement.js.md) → js/shipgen/data/environment.js ×4, js/shipgen/builder/faces.js ×3, js/shipgen/prefabs/index.js ×2, js/shipgen/core/rng.js ×1
- [js/shipgen/builder/weapons.js](../files/js/shipgen/builder/weapons.js.md) → js/shipgen/core/geometry.js ×69
- [js/shipgen/data/catalog/00-identity.js](../files/js/shipgen/data/catalog/00-identity.js.md) → js/shipgen/data/catalog/_part.js ×16
- [js/shipgen/data/catalog/01-propulsion.js](../files/js/shipgen/data/catalog/01-propulsion.js.md) → js/shipgen/data/catalog/_part.js ×38
- [js/shipgen/data/catalog/02-fluids.js](../files/js/shipgen/data/catalog/02-fluids.js.md) → js/shipgen/data/catalog/_part.js ×18
- [js/shipgen/data/catalog/03-power.js](../files/js/shipgen/data/catalog/03-power.js.md) → js/shipgen/data/catalog/_part.js ×21
- [js/shipgen/data/catalog/04-epds.js](../files/js/shipgen/data/catalog/04-epds.js.md) → js/shipgen/data/catalog/_part.js ×16
- [js/shipgen/data/catalog/05-structure.js](../files/js/shipgen/data/catalog/05-structure.js.md) → js/shipgen/data/catalog/_part.js ×16
- [js/shipgen/data/catalog/06-materials.js](../files/js/shipgen/data/catalog/06-materials.js.md) → js/shipgen/data/catalog/_part.js ×15
- [js/shipgen/data/catalog/07-thermal.js](../files/js/shipgen/data/catalog/07-thermal.js.md) → js/shipgen/data/catalog/_part.js ×13
- [js/shipgen/data/catalog/08-computing.js](../files/js/shipgen/data/catalog/08-computing.js.md) → js/shipgen/data/catalog/_part.js ×14
- [js/shipgen/data/catalog/09-gnc.js](../files/js/shipgen/data/catalog/09-gnc.js.md) → js/shipgen/data/catalog/_part.js ×12
- [js/shipgen/data/catalog/10-comms.js](../files/js/shipgen/data/catalog/10-comms.js.md) → js/shipgen/data/catalog/_part.js ×14
- [js/shipgen/data/catalog/11-sensors.js](../files/js/shipgen/data/catalog/11-sensors.js.md) → js/shipgen/data/catalog/_part.js ×13
- [js/shipgen/data/catalog/12-atmosphere.js](../files/js/shipgen/data/catalog/12-atmosphere.js.md) → js/shipgen/data/catalog/_part.js ×13
- [js/shipgen/data/catalog/13-water-waste-food.js](../files/js/shipgen/data/catalog/13-water-waste-food.js.md) → js/shipgen/data/catalog/_part.js ×12
- [js/shipgen/data/catalog/14-habitation.js](../files/js/shipgen/data/catalog/14-habitation.js.md) → js/shipgen/data/catalog/_part.js ×14
- [js/shipgen/data/catalog/15-eva-docking.js](../files/js/shipgen/data/catalog/15-eva-docking.js.md) → js/shipgen/data/catalog/_part.js ×12
- [js/shipgen/data/catalog/16-robotics.js](../files/js/shipgen/data/catalog/16-robotics.js.md) → js/shipgen/data/catalog/_part.js ×11
- [js/shipgen/data/catalog/17-cargo.js](../files/js/shipgen/data/catalog/17-cargo.js.md) → js/shipgen/data/catalog/_part.js ×19
- [js/shipgen/data/catalog/18-safety-defense.js](../files/js/shipgen/data/catalog/18-safety-defense.js.md) → js/shipgen/data/catalog/_part.js ×43
- [js/shipgen/data/catalog/19-manufacturing.js](../files/js/shipgen/data/catalog/19-manufacturing.js.md) → js/shipgen/data/catalog/_part.js ×16
- [js/shipgen/data/catalog/20-standards.js](../files/js/shipgen/data/catalog/20-standards.js.md) → js/shipgen/data/catalog/_part.js ×10
- [js/shipgen/data/loadouts.js](../files/js/shipgen/data/loadouts.js.md) → js/shipgen/core/rng.js ×1
- [js/shipgen/generate.js](../files/js/shipgen/generate.js.md) → js/shipgen/anim.js ×3, js/shipgen/data/loadouts.js ×1, js/shipgen/builder/StarshipBuilder.js ×1, js/shipgen/data/flight.js ×1, js/shipgen/data/bom.js ×1, js/shipgen/core/rng.js ×1
- [js/shipgen/ops/fx.js](../files/js/shipgen/ops/fx.js.md) → js/shipgen/ops/host.js ×2
- [js/shipgen/ops/ops.js](../files/js/shipgen/ops/ops.js.md) → js/shipgen/ops/fx.js ×55, js/shipgen/ops/host.js ×9, js/shipgen/core/rng.js ×1
- [js/shipgen/prefabs/acs.js](../files/js/shipgen/prefabs/acs.js.md) → js/shipgen/core/geometry.js ×16
- [js/shipgen/prefabs/docking.js](../files/js/shipgen/prefabs/docking.js.md) → js/shipgen/core/geometry.js ×16
- [js/shipgen/prefabs/extra.js](../files/js/shipgen/prefabs/extra.js.md) → js/shipgen/core/geometry.js ×34
- [js/shipgen/prefabs/industrial.js](../files/js/shipgen/prefabs/industrial.js.md) → js/shipgen/core/geometry.js ×24
- [js/shipgen/prefabs/internal.js](../files/js/shipgen/prefabs/internal.js.md) → js/shipgen/core/geometry.js ×15
- [js/shipgen/prefabs/power.js](../files/js/shipgen/prefabs/power.js.md) → js/shipgen/core/geometry.js ×27
- [js/shipgen/prefabs/sensors.js](../files/js/shipgen/prefabs/sensors.js.md) → js/shipgen/core/geometry.js ×44
- [js/shipgen/prefabs/structure.js](../files/js/shipgen/prefabs/structure.js.md) → js/shipgen/core/geometry.js ×31
- [js/ships/hullspec.js](../files/js/ships/hullspec.js.md) → js/shipgen/data/loadouts.js ×1, js/shipgen/core/rng.js ×1
- [js/ships/shipdb.js](../files/js/ships/shipdb.js.md) → js/economy/materials.js ×1
- [js/ships/shipforge.js](../files/js/ships/shipforge.js.md) → js/shipgen/anim.js ×3, js/ships/hullspec.js ×2, js/shipgen/generate.js ×2
- [js/sim/sim.js](../files/js/sim/sim.js.md) → js/world/bodies.js ×91, js/flight/ship.js ×54, js/flight/pilot.js ×45, js/station/stations.js ×32, js/corp/corps.js ×27, js/core/input.js ×24, js/station/stationworks.js ×21, js/world/debris.js ×18, js/economy/materials.js ×17, js/npc/traffic.js ×14, js/world/field.js ×13, js/world/anchors.js ×12, js/world/events/holes.js ×12, js/npc/security.js ×11, js/ships/shipdb.js ×11, js/world/events/cataclysm.js ×10, js/flight/turrets.js ×9, js/economy/upgrades.js ×8, js/world/events/impactors.js ×8, js/station/dockwork.js ×7, js/world/generate.js ×7, js/corp/seclevel.js ×7, js/npc/battles.js ×6, js/comms/gnn.js ×6, js/flight/avoid.js ×6, js/corp/company.js ×5, js/economy/contracts.js ×5, js/economy/economy.js ×5, js/economy/insurance.js ×5, js/world/events/atmoworks.js ×5, js/economy/fabricate.js ×4, js/flight/autopilot.js ×4, js/world/events/impacts.js ×4, js/npc/flow.js ×4, js/npc/combat.js ×4, js/economy/icework.js ×4, js/flight/recorder.js ×4, js/station/stationyard.js ×3, js/npc/rogues.js ×3, js/flight/repair.js ×3, js/drones/ops.js ×3, js/flight/defence.js ×3, js/npc/lanes.js ×3, js/audio/index.js ×3, js/comms/chat.js ×2, js/drones/npcdrones.js ×2, js/core/store.js ×2, js/crew/ledger.js ×2, js/corp/fleet.js ×2, js/interior/boarding.js ×2, js/flight/contacts.js ×2, js/npc/captain.js ×2, js/crew/robots.js ×2, js/flight/probes.js ×2, js/world/scale.js ×2, js/npc/crewfx.js ×2, js/aria/aria.js ×1, js/core/perf.js ×1, js/drones/board.js ×1, js/crew/family.js ×1, js/economy/shipcost.js ×1
- [js/station/deckhall.js](../files/js/station/deckhall.js.md) → js/station/staffline.js ×10, js/crew/ledger.js ×6, js/corp/company.js ×6, js/ui/glyphs.js ×5, js/station/stafflife.js ×4, js/sim/sim.js ×3, js/crew/family.js ×3, js/ui/charts.js ×3, js/station/staffcare.js ×3, js/station/stationlife.js ×3, js/crew/talkview.js ×1
- [js/station/deckworks.js](../files/js/station/deckworks.js.md) → js/drones/dronespec.js ×2, js/station/fabyard.js ×1, js/station/stationworks.js ×1, js/economy/materials.js ×1
- [js/station/dockwork.js](../files/js/station/dockwork.js.md) → js/economy/materials.js ×2
- [js/station/fabyard.js](../files/js/station/fabyard.js.md) → js/console/kit.js ×26, js/economy/fabricate.js ×8, js/economy/materials.js ×6, js/corp/company.js ×2
- [js/station/refityard.js](../files/js/station/refityard.js.md) → js/console/kit.js ×23, js/flight/repair.js ×9, js/economy/upgrades.js ×7, js/ships/shipdb.js ×1, js/sim/sim.js ×1, js/flight/defence.js ×1
- [js/station/staffcare.js](../files/js/station/staffcare.js.md) → js/station/stafflife.js ×10, js/station/stationclock.js ×3, js/corp/company.js ×2, js/station/stations.js ×2, js/station/stationlife.js ×1
- [js/station/stafflife.js](../files/js/station/stafflife.js.md) → js/station/stationclock.js ×4, js/station/stations.js ×1
- [js/station/staffline.js](../files/js/station/staffline.js.md) → js/station/stations.js ×10, js/station/stationlife.js ×8, js/corp/company.js ×3, js/station/stafflife.js ×2, js/sim/sim.js ×2, js/station/stationclock.js ×1
- [js/station/stationdeck.js](../files/js/station/stationdeck.js.md) → js/drones/ops.js ×8, js/ships/shipdb.js ×6, js/economy/shipcost.js ×6, js/sim/sim.js ×5, js/station/blueprint.js ×5, js/station/stations.js ×5, js/station/dockwork.js ×3, js/ui/coverage.js ×2, js/corp/corps.js ×2, js/ui/boardview.js ×2, js/station/deckhall.js ×2, js/console/console.js ×2, js/station/refityard.js ×2, js/console/panels/market.js ×1, js/flight/pilot.js ×1, js/station/deckworks.js ×1, js/corp/company.js ×1, js/comms/gnn.js ×1, js/station/stationclock.js ×1
- [js/station/stationlife.js](../files/js/station/stationlife.js.md) → js/npc/cradle.js ×9, js/genome/spacer.js ×7, js/station/stations.js ×5, js/corp/corps.js ×4, js/corp/company.js ×3, js/station/staffline.js ×2, js/station/stationclock.js ×2, js/corp/gdb.js ×2, js/world/names.js ×2, js/sim/sim.js ×1, js/comms/chat.js ×1, js/station/stafflife.js ×1
- [js/station/stations.js](../files/js/station/stations.js.md) → js/station/stationyard.js ×4, js/world/naming.js ×4, js/world/bodies.js ×4, js/economy/materials.js ×1
- [js/station/stationworks.js](../files/js/station/stationworks.js.md) → js/npc/lanes.js ×5, js/station/stationyard.js ×3, js/economy/materials.js ×2, js/flight/turrets.js ×2, js/station/stations.js ×2
- [js/station/stationyard.js](../files/js/station/stationyard.js.md) → js/stationgen/generate.js ×3
- [js/stationgen/builder/StationBuilder.js](../files/js/stationgen/builder/StationBuilder.js.md) → js/stationgen/core/geometry.js ×28, js/stationgen/data/styles.js ×2, js/stationgen/data/doctrine.js ×2, js/stationgen/builder/placement.js ×2, js/stationgen/builder/frames.js ×2, js/stationgen/core/rng.js ×1, js/stationgen/builder/hull.js ×1
- [js/stationgen/builder/hangar.js](../files/js/stationgen/builder/hangar.js.md) → js/stationgen/core/geometry.js ×13, js/stationgen/data/styles.js ×2, js/stationgen/prefabs/forms.js ×1
- [js/stationgen/builder/hull.js](../files/js/stationgen/builder/hull.js.md) → js/stationgen/core/geometry.js ×71, js/stationgen/builder/frames.js ×27, js/stationgen/prefabs/forms.js ×5
- [js/stationgen/builder/placement.js](../files/js/stationgen/builder/placement.js.md) → js/stationgen/builder/frames.js ×6, js/stationgen/builder/hangar.js ×2
- [js/stationgen/data/doctrine.js](../files/js/stationgen/data/doctrine.js.md) → js/stationgen/data/bom.js ×2
- [js/stationgen/generate.js](../files/js/stationgen/generate.js.md) → js/stationgen/anim.js ×4, js/stationgen/builder/StationBuilder.js ×1, js/stationgen/data/bom.js ×1, js/stationgen/core/geometry.js ×1, js/stationgen/core/rng.js ×1
- [js/stationgen/prefabs/forms.js](../files/js/stationgen/prefabs/forms.js.md) → js/stationgen/core/geometry.js ×11, js/stationgen/data/styles.js ×2
- [js/stationgen/prefabs/modules.js](../files/js/stationgen/prefabs/modules.js.md) → js/stationgen/prefabs/forms.js ×28, js/stationgen/core/geometry.js ×14
- [js/ui/boardview.js](../files/js/ui/boardview.js.md) → js/economy/contracts.js ×11, js/economy/chains.js ×1, js/corp/corps.js ×1, js/economy/sites.js ×1, js/flight/autopilot.js ×1
- [js/ui/chatbox.js](../files/js/ui/chatbox.js.md) → js/comms/chat.js ×11, js/npc/speech.js ×1
- [js/ui/coverage.js](../files/js/ui/coverage.js.md) → js/economy/insurance.js ×5
- [js/ui/creation.js](../files/js/ui/creation.js.md) → js/crew/races.js ×5, js/flight/pilot.js ×2, js/corp/corps.js ×2, js/ui/glyphs.js ×1, js/npc/cradle.js ×1, js/corp/company.js ×1, js/core/profile.js ×1
- [js/ui/dockboot.js](../files/js/ui/dockboot.js.md) → js/corp/corps.js ×2, js/station/stations.js ×1
- [js/ui/holdview.js](../files/js/ui/holdview.js.md) → js/economy/materials.js ×5, js/sim/sim.js ×4, js/flight/ship.js ×2, js/station/stations.js ×1, js/economy/sites.js ×1, js/station/dockwork.js ×1
- [js/ui/hud.js](../files/js/ui/hud.js.md) → js/sim/sim.js ×24, js/core/store.js ×8, js/flight/pilot.js ×7, js/audio/index.js ×5, js/aria/aria.js ×5, js/world/generate.js ×5, js/flight/recorder.js ×4, js/net/account.js ×4, js/audio/graph.js ×4, js/flight/autopilot.js ×3, js/net/net.js ×3, js/net/worldsync.js ×3, js/console/console.js ×2, js/ui/tutorial.js ×2, js/npc/cradle.js ×2, js/corp/gdb.js ×2, js/comms/comms.js ×2, js/world/bodies.js ×2, js/flight/repair.js ×1, js/flight/ship.js ×1, js/ui/holdview.js ×1, js/ui/creation.js ×1, js/ui/fullscreen.js ×1, js/ui/map.js ×1, js/station/stationdeck.js ×1, js/ui/secbadge.js ×1, js/ui/dockboot.js ×1, js/ui/chatbox.js ×1, js/interior/interior.js ×1, js/npc/captain.js ×1, js/economy/icework.js ×1, js/world/events/atmoworks.js ×1, js/corp/company.js ×1, js/crew/family.js ×1, js/economy/contracts.js ×1, js/npc/chat.js ×1, js/corp/fleet.js ×1, js/ui/hangar.js ×1, js/station/stationclock.js ×1
- [js/ui/map.js](../files/js/ui/map.js.md) → js/sim/sim.js ×28, js/world/bodies.js ×28, js/flight/probes.js ×8, js/flight/autopilot.js ×6, js/npc/traffic.js ×4, js/flight/contacts.js ×3, js/flight/ship.js ×2, js/corp/corps.js ×2, js/console/console.js ×1, js/world/events/holes.js ×1
- [js/ui/secbadge.js](../files/js/ui/secbadge.js.md) → js/corp/seclevel.js ×3
- [js/ui/tutorial-core.js](../files/js/ui/tutorial-core.js.md) → js/sim/sim.js ×7, js/mission/script.js ×2, js/mission/run.js ×1, js/economy/upgrades.js ×1
- [js/ui/tutorial.js](../files/js/ui/tutorial.js.md) → js/sim/sim.js ×8, js/flight/ship.js ×2, js/world/bodies.js ×2, js/world/field.js ×1, js/station/stations.js ×1, js/ui/tutorial-core.js ×1
- [js/world/bodies.js](../files/js/world/bodies.js.md) → js/world/scale.js ×24, js/world/archetypes.js ×1, js/economy/materials.js ×1
- [js/world/debris.js](../files/js/world/debris.js.md) → js/world/bodies.js ×3
- [js/world/events/atmoworks.js](../files/js/world/events/atmoworks.js.md) → js/world/bodies.js ×8, js/sim/sim.js ×4, js/flight/pilot.js ×2, js/ships/shipdb.js ×1, js/corp/corps.js ×1
- [js/world/events/holes.js](../files/js/world/events/holes.js.md) → js/asteroidgen/kerr.js ×2
- [js/world/events/impactors.js](../files/js/world/events/impactors.js.md) → js/world/names.js ×3, js/world/scale.js ×2
- [js/world/events/impacts.js](../files/js/world/events/impacts.js.md) → js/asteroidgen/impact-sim.js ×9, js/asteroidgen/rng.js ×7, js/asteroidgen/impact.js ×5, js/bodygen/body.js ×2, js/asteroidgen/fracture.js ×1
- [js/world/field.js](../files/js/world/field.js.md) → js/economy/sites.js ×4, js/bodygen/classes.js ×2
- [js/world/generate.js](../files/js/world/generate.js.md) → js/world/archetypes.js ×4, js/world/names.js ×4
- [js/world/naming.js](../files/js/world/naming.js.md) → js/vendor/stellar-names/index.js ×2