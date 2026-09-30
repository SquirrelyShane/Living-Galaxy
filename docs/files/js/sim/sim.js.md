# js/sim/sim.js

[index](../../../README.md) · 4062 lines · 284 symbols · 64 imports · 137 importers

## About

<!-- note:@file -->
LIVING GALAXY — simulation loop.

Everything here is first-person and Newtonian: you sit in the seat, the
nose follows your eyes, and nothing decelerates you that you did not pay
for. Worlds are hundreds of times your length and pull like it.

- L123 · `const WALLET_EVERY = 30;` — seconds between wallet writes while credits move (0.3.41)
- L394 · `export const SMELT_FEE = 0.06;` — share of the smelted value the works keeps
- L438 · `wireFab({` — ---- the fabrication line (js/economy/fabricate.js) --------------------------------
  
  The solver is a leaf: it knows the recipe graph and nothing about stations,
  clocks or credits. This is the world it works on.
  
  A job draws on the port's LOCKER plus, when the pilot is standing there, the
  hold. A company job draws on the locker alone — nobody is aboard to unload.
  Everything it makes lands in the locker either way, because a job outlives
  the visit that ordered it: you queue it, you fly, you come back to parts.
- L792 · `let marketSlot = -1, marketSeed = null;` — the last event slot rolled: one roll per slot, not per frame
- L1919 · `let blockAt = -1, blockFor = null, blockCool = false, blockDom = null;` — when/for what sim.warp.block was last read
- L1920 · `const _blockAtPos = { x: 0, y: 0, z: 0 };` — …and from where: a jump in position re-reads at once
- L2096 · `const LOCK_CONE = 0.32;` — rad — how close to the nose it has to be
- L2097 · `const LOCK_BREAK = 1.05;` — rad — look this far off and a hold breaks
<!-- /note -->

## Imports

| line | from | names | target |
|---|---|---|---|
| 1 | `../world/bodies.js` | `BEACONS`, `BODIES`, `applySystem`, `beaconPosition`, `bodyById`, `bodyPosition`, `bodyVelocity`, `currentSystem`, `dist3`, `hashHue`, `refreshBody`, `scanRadius`, `heatBody`, `coolBodies`, `bodyTempK`, `starBody`, `surveyIds` | [js/world/bodies.js](../world/bodies.js.md) |
| 2 | `../world/generate.js` | `generateSystem`, `rngFromSeed`, `spawnBodyId` | [js/world/generate.js](../world/generate.js.md) |
| 3 | `../core/input.js` | `consumeLook`, `justPressed`, `sampleInput`, `setInjectedKeys`, `setInjectedPan`, `touch` | [js/core/input.js](../core/input.js.md) |
| 4 | `../audio/index.js` | `NAV`, `SHIP`, `UI`, `WARN`, `setEngineLevel` | [js/audio/index.js](../audio/index.js.md) |
| 5 | `../core/store.js` | `loadSave`, `skyProgress`, `useGameStore` | [js/core/store.js](../core/store.js.md) |
| 6 | `../flight/ship.js` | `batteryCap`, `MINING_MODES`, `SHED_ORDER`, `THROTTLE_MAX`, `THROTTLE_MIN`, `TURRET_MODES`, `defaultTune`, `applyDamage`, `buildDemand`, `closingSpeed`, `absSpeedOf`, `addCargo`, `cargoTotal`, `forwardOf`, `holdRoom`, `takeCargo`, `gravityAt`, `makeShip`, `speedOf`, `stepAttitude`, `stepPower`, `stepTranslation`, `roomFor` | [js/flight/ship.js](../flight/ship.js.md) |
| 31 | `../flight/recorder.js` | `record` as `tapeRecord` | [js/flight/recorder.js](../flight/recorder.js.md) |
| 32 | `../economy/fabricate.js` | `wireFab`, `stepFab`, `loadFab`, `resetFab` | [js/economy/fabricate.js](../economy/fabricate.js.md) |
| 33 | `../world/scale.js` | `remnantRadius`, `surfaceGravity` | [js/world/scale.js](../world/scale.js.md) |
| 34 | `../world/events/impacts.js` | `resetImpacts`, `startCollision`, `startStrike`, `stepImpacts` | [js/world/events/impacts.js](../world/events/impacts.js.md) |
| 35 | `../flight/probes.js` | `resetProbes`, `stepProbes` | [js/flight/probes.js](../flight/probes.js.md) |
| 36 | `../drones/ops.js` | `stepDroneOps`, `loadDroneOps`, `noteDroneKill` | [js/drones/ops.js](../drones/ops.js.md) |
| 37 | `../drones/npcdrones.js` | `populateNpcDrones`, `stepNpcDrones`, `npcDroneHooks`, `npcDrones`, `DRONE_LINE` | [js/drones/npcdrones.js](../drones/npcdrones.js.md) |
| 38 | `../drones/board.js` | `board`, `resetBoard` | [js/drones/board.js](../drones/board.js.md) |
| 39 | `../comms/chat.js` | `chat`, `post`, `resetChat` | [js/comms/chat.js](../comms/chat.js.md) |
| 40 | `../comms/gnn.js` | `gnn`, `gnnPost`, `resetGnn` | [js/comms/gnn.js](../comms/gnn.js.md) |
| 41 | `../economy/icework.js` | `benchValue` | [js/economy/icework.js](../economy/icework.js.md) |
| 42 | `../world/debris.js` | `addChunk`, `bindDebris`, `burst`, `chunkMass`, `chunks`, `nearDebris`, `removeChunk`, `resetDebris`, `rubbleRing`, `stepDebris` | [js/world/debris.js](../world/debris.js.md) |
| 43 | `../world/events/impactors.js` | `addRogue`, `adoptImpactors`, `impactorWire`, `impactors`, `resetImpactors`, `rogueHooks` as `rockHooks`, `setImpactorAuthority`, `stepImpactors`, `threatBoard`, `emptyThreatBoard` | [js/world/events/impactors.js](../world/events/impactors.js.md) |
| 44 | `../world/events/holes.js` | `HOLE`, `adoptHoles`, `collapseStar`, `holeRadii`, `holeWarpBlock`, `holeWire`, `holes`, `nearestHole`, `resetHoles`, `spawnTransit`, `stepHoles` | [js/world/events/holes.js](../world/events/holes.js.md) |
| 45 | `../world/events/cataclysm.js` | `OUTCOME`, `apparentGlow`, `cataclysmState`, `eventDuration`, `isCataclysmic`, `kelvinHex`, `outcomeOf`, `relaxCraters`, `ringPlan`, `supernovaDuration`, `supernovaState` | [js/world/events/cataclysm.js](../world/events/cataclysm.js.md) |
| 58 | `../station/stations.js` | `buildStations`, `describeStation`, `dockCheck`, `nearestStation`, `resetStations`, `stationById`, `stations`, `stepStations` | [js/station/stations.js](../station/stations.js.md) |
| 68 | `../economy/materials.js` | `ORES`, `baseValue`, `good`, `goodName`, `priceAt`, `rollOre` | [js/economy/materials.js](../economy/materials.js.md) |
| 69 | `../economy/economy.js` | `stepEconomy`, `stockMult` **unused**, `lotMult`, `askPrice`, `econReport`, `wantsOf`, `econHooks` | [js/economy/economy.js](../economy/economy.js.md) |
| 70 | `../station/stafflife.js` | `labourAt` | [js/station/stafflife.js](../station/stafflife.js.md) |
| 71 | `../station/dockwork.js` | `bookHandling`, `clearDockwork` **unused**, `handlingLeft`, `handlingLine`, `handlingProgress` **unused**, `stepDockwork` | [js/station/dockwork.js](../station/dockwork.js.md) |
| 72 | `../corp/corps.js` | `buildCorps`, `corpOfStation`, `corpOfVessel`, `corpById`, `blameKill`, `adjustStanding`, `standingMargin`, `corps` | [js/corp/corps.js](../corp/corps.js.md) |
| 73 | `../flight/pilot.js` | `applyRaceToShip`, `applyRaceTune`, `loadPilot`, `pilot`, `rankStatus`, `savePilot`, `serveTime`, `syncMods`, `takePayout`, `title`, `work` | [js/flight/pilot.js](../flight/pilot.js.md) |
| 74 | `../ships/shipdb.js` | `DEFAULT_SHIP_ID`, `hullTuneFor`, `issuedShips`, `shipById` | [js/ships/shipdb.js](../ships/shipdb.js.md) |
| 75 | `../economy/shipcost.js` | `yardQuote` | [js/economy/shipcost.js](../economy/shipcost.js.md) |
| 76 | `../flight/defence.js` | `hullPoolFor`, `shieldPoolFor`, `resistsFor` | [js/flight/defence.js](../flight/defence.js.md) |
| 77 | `../economy/insurance.js` | `claim` as `insuranceClaim`, `insure`, `playerKey`, `policies`, `policyFor`, `resetInsurance` | [js/economy/insurance.js](../economy/insurance.js.md) |
| 78 | `../crew/ledger.js` | `crew`, `crewHooks`, `resetCrew`, `tickCrew` | [js/crew/ledger.js](../crew/ledger.js.md) |
| 79 | `../crew/robots.js` | `loadRobots`, `tickRobots` | [js/crew/robots.js](../crew/robots.js.md) |
| 80 | `../economy/upgrades.js` | `fx` as `upgradeFx`, `loadUpgrades`, `upgradeResists`, `resistKey` | [js/economy/upgrades.js](../economy/upgrades.js.md) |
| 81 | `../flight/repair.js` | `tickPatchDrone`, `hullMaxOf` | [js/flight/repair.js](../flight/repair.js.md) |
| 82 | `../corp/company.js` | `bookRevenue`, `loadCompany`, `tickCompany`, `treasuryPay` | [js/corp/company.js](../corp/company.js.md) |
| 83 | `../crew/family.js` | `resetHousehold` | [js/crew/family.js](../crew/family.js.md) |
| 84 | `../economy/contracts.js` | `noteKill`, `noteDestroyed`, `resetContracts`, `tickContracts`, `owedCargo` | [js/economy/contracts.js](../economy/contracts.js.md) |
| 85 | `../corp/fleet.js` | `resetFleet`, `tickFleet` | [js/corp/fleet.js](../corp/fleet.js.md) |
| 86 | `../npc/captain.js` | `captain`, `retakeCommand`, `tickCaptain` | [js/npc/captain.js](../npc/captain.js.md) |
| 87 | `../npc/crewfx.js` | `crewEffects`, `updateCrewMods` | [js/npc/crewfx.js](../npc/crewfx.js.md) |
| 88 | `../npc/traffic.js` | `eventAt`, `eventLine`, `markVesselDown`, `populateTraffic`, `resetTraffic`, `stepTraffic`, `traffic`, `trafficCensus`, `trafficDown`, `trafficHooks`, `vesselById`, `HOSTILE_ROLES`, `LAW_ROLES`, `SLOT_S` | [js/npc/traffic.js](../npc/traffic.js.md) |
| 89 | `../npc/battles.js` | `battleHooks`, `fightCentre`, `pirateKilled`, `resetBattles`, `stepBattles` | [js/npc/battles.js](../npc/battles.js.md) |
| 90 | `../npc/security.js` | `resetSecurity`, `stepSecurity`, `mountSecurity`, `assignGuards`, `securityHooks`, `securityCorp`, `securityReport`, `callForHelp`, `distress`, `nearestCall`, `etaOf` | [js/npc/security.js](../npc/security.js.md) |
| 91 | `../corp/seclevel.js` | `stepSecLevel`, `resetSecLevel`, `secHooks`, `selfVictim`, `noteKillBySelf`, `noteHonestHit`, `noteShot`, `wingArrived` | [js/corp/seclevel.js](../corp/seclevel.js.md) |
| 92 | `../npc/combat.js` | `resetNpcCombat`, `stepNpcCombat`, `mountNpcCombat`, `combatHooksOut`, `combatReport`, `combatLog`, `damageHull` | [js/npc/combat.js](../npc/combat.js.md) |
| 93 | `../npc/rogues.js` | `populateNests`, `stepRogues`, `mountRogues`, `rogueHooks`, `rogueReport`, `nests`, `waves` | [js/npc/rogues.js](../npc/rogues.js.md) |
| 94 | `../core/perf.js` | `resetPerf`, `notePerf` **unused**, `perf`, `perfReport` | [js/core/perf.js](../core/perf.js.md) |
| 95 | `../npc/flow.js` | `populateFlow`, `resetFlow`, `stepFlow`, `flow`, `portPulse` | [js/npc/flow.js](../npc/flow.js.md) |
| 96 | `../npc/lanes.js` | `laneOf`, `laneFlow`, `stationLane` | [js/npc/lanes.js](../npc/lanes.js.md) |
| 97 | `../station/stationworks.js` | `stepStationWorks`, `stepTractor`, `autoTractor`, `engageTractor`, `engagePush`, `releaseTractor`, `holdOff`, `tractor`, `worksReport`, `worksHooks`, `dockRequest`, `requestDock`, `clearDockRequest`, `hasDockRequest`, `unrequestedApproach`, `inDeparture`, `PUSH_GRACE` | [js/station/stationworks.js](../station/stationworks.js.md) |
| 98 | `../interior/boarding.js` | `boarding`, `resetBoarding`, `tickBoarding` | [js/interior/boarding.js](../interior/boarding.js.md) |
| 99 | `../economy/icework.js` | `resetIcework`, `stepIcework` | [js/economy/icework.js](../economy/icework.js.md) |
| 100 | `../world/events/atmoworks.js` | `applyTerraformSnapshot`, `resetAtmoWorks`, `stepAtmoWorks`, `terraformSnapshot` | [js/world/events/atmoworks.js](../world/events/atmoworks.js.md) |
| 101 | `../flight/autopilot.js` | `autopilot`, `disengageAutopilot`, `engageAutopilot`, `tickAutopilot` | [js/flight/autopilot.js](../flight/autopilot.js.md) |
| 102 | `../station/stations.js` | `TRACTOR_R`, `TRACTOR_V` | [js/station/stations.js](../station/stations.js.md) |
| 103 | `../station/stationyard.js` | `releaseBuilt`, `carryBuilt`, `dropCarried` | [js/station/stationyard.js](../station/stationyard.js.md) |
| 104 | `../world/field.js` | `eatRocks`, `inBelt`, `nearbyRocks`, `resetField`, `rockByKey`, `siteMarkRock` | [js/world/field.js](../world/field.js.md) |
| 105 | `../world/anchors.js` | `registerAnchor`, `resolveAnchor` | [js/world/anchors.js](../world/anchors.js.md) |
| 106 | `../flight/avoid.js` | `threatTo`, `avoidAim`, `avoidLevel`, `deliberate`, `surfaceOnly`, `AVOID` | [js/flight/avoid.js](../flight/avoid.js.md) |
| 107 | `../flight/contacts.js` | `tickContacts`, `resetContacts` | [js/flight/contacts.js](../flight/contacts.js.md) |
| 108 | `../aria/aria.js` | `notePlayerChoice` | [js/aria/aria.js](../aria/aria.js.md) |
| 109 | `../flight/turrets.js` | `combatHooks`, `contacts`, `fireRound`, `mining`, `npcTracer`, `resetCombat`, `shots`, `stepMining`, `stepShots`, `stepTurrets`, `syncContacts`, `turretAim`, `miningHooks` | [js/flight/turrets.js](../flight/turrets.js.md) |

## Imported by

- [js/aria/aria.js](../aria/aria.js.md) — `sim`, `logEvent`
- [js/aria/company.js](../aria/company.js.md) — `sim`, `crewCapacity`, `logEvent`
- [js/aria/nav.js](../aria/nav.js.md) — `sim`, `selectBody`, `addWaypointAt`, `losBlocker`, `wellEdge`, `warpNodeById`, `WARP`, `spoolTime`
- [js/aria/pilot.js](../aria/pilot.js.md) — `sim`, `logEvent`, `setTurretMode`, `setMiningMode`, `toggleSystem`
- [js/aria/play.js](../aria/play.js.md) — `sim`, `sellPriceAt`, `setTurretMode`
- [js/aria/senses.js](../aria/senses.js.md) — `sim`, `losBlocker`, `sellPriceAt`, `buyPriceAt`, `currentShipId`
- [js/comms/comms.js](../comms/comms.js.md) — `addBodyWaypoint`, `addWaypointAt`, `addAnchoredWaypoint`, `logEvent`, `selectBody`, `sim`, `takeSalvageContract`, `toggleDock`, `portWants`
- [js/console/console.js](../console/console.js.md) — `setTermHold`, `setTerminal`, `sim`
- [js/console/panels/corp-marshal.js](../console/panels/corp-marshal.js.md) — `sim`
- [js/console/panels/corp-town.js](../console/panels/corp-town.js.md) — `sim`
- [js/console/panels/corp.js](../console/panels/corp.js.md) — `sim`
- [js/console/panels/corp.js](../console/panels/corp.js.md) — `addAnchoredWaypoint`
- [js/console/panels/crew-brig.js](../console/panels/crew-brig.js.md) — `sim`
- [js/console/panels/crew-gdb.js](../console/panels/crew-gdb.js.md) — `sim`
- [js/console/panels/crew-gene.js](../console/panels/crew-gene.js.md) — `sim`
- [js/console/panels/crew-sky.js](../console/panels/crew-sky.js.md) — `sim`
- [js/console/panels/crew.js](../console/panels/crew.js.md) — `sim`
- [js/console/panels/market.js](../console/panels/market.js.md) — `buyPriceAt`, `canSmeltAt`, `claimPort`, `jettison`, `portLedger`, `portWants`, `sellAllOre`, `sellPriceAt`, `sim`, `smeltAll`, `stashAt`, `stashDeposit`, `stashWithdraw`, `stationStatus`, `toggleDock`, `tradeBuy`, `tradeSell`
- [js/console/panels/market.js](../console/panels/market.js.md) — `addAnchoredWaypoint`
- [js/console/panels/nav.js](../console/panels/nav.js.md) — `addBodyWaypoint`, `addWaypoint`, `cycleRelation`, `removeWaypoint`, `requestScan`, `selectBody`, `setActiveWaypoint`, `setRelation`, `sim`, `stationStatus`, `toggleWarp`, `warpBlock`, `warpStatus`, `waypointPosition`
- [js/console/panels/ship.js](../console/panels/ship.js.md) — `moveShed`, `resetTune`, `setMiningMode`, `setTune`, `setTurretMode`, `sim`, `stationStatus`, `toggleSystem`
- [js/console/panels/work-drones.js](../console/panels/work-drones.js.md) — `addAnchoredWaypoint`, `sim`
- [js/console/panels/work-fleet.js](../console/panels/work-fleet.js.md) — `sim`
- [js/console/panels/work-tape.js](../console/panels/work-tape.js.md) — `sim`
- [js/console/panels/work.js](../console/panels/work.js.md) — `sim`
- [js/corp/company.js](../corp/company.js.md) — `logEvent`, `sim`
- [js/corp/fleet.js](../corp/fleet.js.md) — `logEvent`, `sim`
- [js/crew/beats.js](../crew/beats.js.md) — `sim`
- [js/crew/captive.js](../crew/captive.js.md) — `sim`, `logEvent`
- [js/crew/children.js](../crew/children.js.md) — `logEvent`, `sim`
- [js/crew/childtalk.js](../crew/childtalk.js.md) — `sim`
- [js/crew/deckacts.js](../crew/deckacts.js.md) — `sim`
- [js/crew/deckmind.js](../crew/deckmind.js.md) — `sim`
- [js/crew/duties.js](../crew/duties.js.md) — `sim`
- [js/crew/family.js](../crew/family.js.md) — `logEvent`, `sim`
- [js/crew/hull.js](../crew/hull.js.md) — `sim`
- [js/crew/orders.js](../crew/orders.js.md) — `sim`
- [js/crew/robots.js](../crew/robots.js.md) — `sim`
- [js/crew/robotyard.js](../crew/robotyard.js.md) — `sim`
- [js/crew/romance.js](../crew/romance.js.md) — `sim`
- [js/crew/roster.js](../crew/roster.js.md) — `sim`, `currentShipId`
- [js/crew/talk-threads.js](../crew/talk-threads.js.md) — `sim`, `logEvent`
- [js/crew/talk.js](../crew/talk.js.md) — `sim`, `logEvent`
- [js/drones/npcdrones.js](../drones/npcdrones.js.md) — `sim`
- [js/drones/ops.js](../drones/ops.js.md) — `sim`, `logEvent`, `addWaypointAt`, `addAnchoredWaypoint`, `waypointPosition`
- [js/economy/chains.js](../economy/chains.js.md) — `sim`
- [js/economy/contracts.js](../economy/contracts.js.md) — `logEvent`, `sim`, `sellPriceAt`, `currentShipId`, `addWaypointAt`, `addAnchoredWaypoint`, `removeWaypoint`
- [js/economy/icework.js](../economy/icework.js.md) — `currentShipId`, `sim`, `logEvent`
- [js/economy/traderoutes.js](../economy/traderoutes.js.md) — `sim`, `sellPriceAt`, `buyPriceAt`, `losBlocker`
- [js/economy/upgrades.js](../economy/upgrades.js.md) — `currentShipId`, `sim`
- [js/flight/autopilot.js](../flight/autopilot.js.md) — `plotRoute`, `requestJump`, `selectBody`, `setNoticeAbout`, `sim`, `stationStatus`, `toggleDock`, `warpDestination`, `warpNodeById`, `logEvent`, `setThrottle`, `WARP`, `spoolTime`, `setMiningMode`, `canSmeltAt`, `sellPriceAt`, `warpBlock`, `toggleWarp`
- [js/flight/contacts.js](../flight/contacts.js.md) — `sim`
- [js/flight/probes.js](../flight/probes.js.md) — `addWaypointAt`, `logEvent`, `sensorRange`, `sim`
- [js/flight/repair.js](../flight/repair.js.md) — `sim`, `logEvent`
- [js/interior/boarding.js](../interior/boarding.js.md) — `sim`, `logEvent`
- [js/interior/interior.js](../interior/interior.js.md) — `sim`, `logEvent`, `currentShipId`
- [js/main.js](../main.js.md) — `sim`, `persistNow`
- [js/mission/run.js](../mission/run.js.md) — `sim`, `losBlocker`, `warpNodeById`, `toggleDock`, `sellAllOre`, `stashDeposit`, `smeltAll`, `canSmeltAt`, `tradeBuy`, `tradeSell`, `addWaypointAt`, `addAnchoredWaypoint`, `removeWaypoint`, `selectBody`, `logEvent`, `requestScan`, `throttleCap`, `setTurretMode`, `setMiningMode`, `toggleSystem`, `sellPriceAt`, `buyPriceAt`
- [js/mission/script.js](../mission/script.js.md) — `*`
- [js/mission/tradeops.js](../mission/tradeops.js.md) — `sim`, `sellAllOre`, `tradeBuy`, `tradeSell`, `logEvent`
- [js/net/net.js](../net/net.js.md) — `applyReliable`, `applyRemoteState`, `dropRemote`, `shiftClock`, `sim`
- [js/net/worldsync.js](../net/worldsync.js.md) — `applyRemoteRockHit`, `applyRemoteStrike`, `applyWorldSnapshot`, `logEvent`, `shiftClock`, `sim`, `worldSnapshot`
- [js/npc/bounty.js](../npc/bounty.js.md) — `sim`, `logEvent`
- [js/npc/captain.js](../npc/captain.js.md) — `DROPOUT_ODDS`, `plotRoute`, `sim`, `sellPriceAt`, `stationStatus`, `toggleDock`, `setThrottle`, `setMiningMode`, `setTurretMode`, `requestJump`, `acquireLock`, `logEvent`, `selectBody`
- [js/npc/npccrew.js](../npc/npccrew.js.md) — `sim`, `logEvent`
- [js/render/attract.js](../render/attract.js.md) — `sim`
- [js/render/engine.js](../render/engine.js.md) — `acquireLock`, `activeWaypoint`, `currentShipId`, `pauseTick`, `publishHud`, `sensorRange`, `sim`, `spoolTime`, `targetPosition`, `tickSim`, `waypointPosition`, `wireControlsTest`
- [js/station/deckhall.js](../station/deckhall.js.md) — `sim`, `crewCapacity`
- [js/station/fabyard.js](../station/fabyard.js.md) — `sim`
- [js/station/refityard.js](../station/refityard.js.md) — `sim`
- [js/station/refityard.js](../station/refityard.js.md) — `currentShipId`
- [js/station/staffcare.js](../station/staffcare.js.md) — `sim`
- [js/station/stafflife.js](../station/stafflife.js.md) — `sim`
- [js/station/staffline.js](../station/staffline.js.md) — `logEvent`, `sim`
- [js/station/stationdeck.js](../station/stationdeck.js.md) — `currentShipId`, `issuedHullId`, `sim`, `toggleDock`
- [js/station/stationlife.js](../station/stationlife.js.md) — `logEvent`, `sim`
- [js/ui/boardview.js](../ui/boardview.js.md) — `sim`
- [js/ui/chatbox.js](../ui/chatbox.js.md) — `sim`
- [js/ui/dockboot.js](../ui/dockboot.js.md) — `sim`
- [js/ui/holdview.js](../ui/holdview.js.md) — `sim`, `sellPriceAt`, `jettison`, `tradeSell`, `logEvent`
- [js/ui/hud.js](../ui/hud.js.md) — `autoLevel`, `cycleMiningMode`, `cycleTimeScale`, `cycleTurretMode`, `launchSim`, `loadSky`, `requestJump`, `requestScan`, `resumePlay`, `claimPort`, `sensorPulse`, `toggleDock`, `togglePointerLock`, `returnToMenu`, `dismissNotice`, `setThrottle`, `setMiningMode`, `sim`, `toggleSystem`
- [js/ui/map.js](../ui/map.js.md) — `acquireLock`, `addBodyWaypoint`, `addAnchoredWaypoint`, `addWaypointAt`, `removeWaypoint`, `warpNodeById`, `losBlocker`, `selectBody`, `sim`, `toggleWarp`, `warpBlock`, `warpDestination`, `waypointPosition`
- [js/ui/secbadge.js](../ui/secbadge.js.md) — `sim`
- [js/ui/tutorial-core.js](../ui/tutorial-core.js.md) — `acquireLock`, `addAnchoredWaypoint`, `sim`, `warpBlock`, `warpDestination`, `warpNodeById`
- [js/ui/tutorial.js](../ui/tutorial.js.md) — `acquireLock`, `addBodyWaypoint`, `addWaypointAt`, `logEvent`, `selectBody`, `sim`
- [js/world/events/atmoworks.js](../world/events/atmoworks.js.md) — `currentShipId`, `sim`, `logEvent`
- test/ariabiz.test.mjs _(outside js/)_ — `sim`, `launchSim`, `tickSim`, `crewCapacity`
- test/ariaplay.test.mjs _(outside js/)_ — `sim`, `launchSim`, `tickSim`
- test/ariasense.test.mjs _(outside js/)_ — `sim`, `launchSim`, `tickSim`, `losBlocker`, `selectBody`
- test/autopilot.test.mjs _(outside js/)_ — `sim`, `launchSim`, `tickSim`, `addWaypointAt`, `stashAt`, `smeltAll`, `stashDeposit`, `stashWithdraw`, `canSmeltAt`
- test/avoid.test.mjs _(outside js/)_ — `sim`, `launchSim`, `tickSim`, `selectBody`
- test/balance.test.mjs _(outside js/)_ — `sim`, `launchSim`
- test/bay.test.mjs _(outside js/)_ — `sim`, `launchSim`
- test/beats.test.mjs _(outside js/)_ — `sim`, `launchSim`
- test/board.test.mjs _(outside js/)_ — `sim`, `launchSim`, `tickSim`
- test/bounty.test.mjs _(outside js/)_ — `sim`, `launchSim`
- test/chains.test.mjs _(outside js/)_ — `sim`, `launchSim`
- test/chart.test.mjs _(outside js/)_ — `sim`, `launchSim`, `tickSim`, `warpNodeById`, `warpDestination`, `warpBlock`, `plotRoute`, `clearArrival`, `POINT_ARRIVE_R`, `addWaypointAt`, `selectBody`, `targetPosition`, `sensorRange`, `SENSOR_R`, `throttleCap`, `setThrottle`, `stepWarp`
- test/chartquiet.test.mjs _(outside js/)_ — `sim`, `launchSim`, `tickSim`
- test/childtalk.test.mjs _(outside js/)_ — `sim`, `launchSim`, `tickSim`
- test/converse.test.mjs _(outside js/)_ — `sim`, `launchSim`
- test/crew-life.test.mjs _(outside js/)_ — `sim`, `launchSim`
- test/desk.test.mjs _(outside js/)_ — `sim`, `launchSim`
- test/dockwork.test.mjs _(outside js/)_ — `sim`, `launchSim`, `tickSim`, `tradeBuy`, `tradeSell`, `toggleDock`, `sellAllOre`
- test/economy.test.mjs _(outside js/)_ — `sim`, `launchSim`, `sellPriceAt`, `buyPriceAt`, `tradeSell`, `portLedger`
- test/gdb.test.mjs _(outside js/)_ — `sim`, `launchSim`, `tickSim`
- test/genome.test.mjs _(outside js/)_ — `sim`, `launchSim`
- test/ground.test.mjs _(outside js/)_ — `sim`, `launchSim`
- test/hold.test.mjs _(outside js/)_ — `sim`, `launchSim`, `tickSim`
- test/jobloop.test.mjs _(outside js/)_ — `sim`, `launchSim`, `sellAllOre`
- test/line.test.mjs _(outside js/)_ — `sim`, `launchSim`, `tickSim`
- test/marks.test.mjs _(outside js/)_ — `sim`, `launchSim`, `addWaypointAt`, `addAnchoredWaypoint`, `waypointPosition`, `waypointVelocity`, `targetPosition`, `targetVelocity`, `removeWaypoint`
- test/mission.test.mjs _(outside js/)_ — `sim`, `launchSim`, `tickSim`, `addWaypointAt`, `POINT_ARRIVE_R`
- test/nav.test.mjs _(outside js/)_ — `sim`, `wellEdge`, `wellG`, `WARP`
- test/nose.test.mjs _(outside js/)_ — `sim`, `launchSim`, `tickSim`, `selectBody`, `toggleWarp`
- test/npcchat.test.mjs _(outside js/)_ — `sim`, `launchSim`, `tickSim`
- test/orders.test.mjs _(outside js/)_ — `sim`, `launchSim`, `tickSim`
- test/people.test.mjs _(outside js/)_ — `sim`, `launchSim`, `tickSim`
- test/portcontrol.test.mjs _(outside js/)_ — `sim`, `launchSim`, `tickSim`, `toggleDock`
- test/portdrones.test.mjs _(outside js/)_ — `sim`, `launchSim`, `tickSim`, `relationOf`
- test/qrf.test.mjs _(outside js/)_ — `sim`, `launchSim`, `tickSim`
- test/qrf.test.mjs _(outside js/)_ — `relationOf`
- test/reactive.test.mjs _(outside js/)_ — `sim`, `launchSim`
- test/reactive.test.mjs _(outside js/)_ — `relationOf`
- test/robots.test.mjs _(outside js/)_ — `sim`, `launchSim`, `tickSim`
- test/rogues.test.mjs _(outside js/)_ — `sim`, `launchSim`
- test/seclevel.test.mjs _(outside js/)_ — `sim`, `launchSim`, `tickSim`, `relationOf`
- test/sites.test.mjs _(outside js/)_ — `sim`, `launchSim`
- test/sky.test.mjs _(outside js/)_ — `sim`, `launchSim`, `currentShipId`, `issuedHullId`, `wellEdge`, `WARP`
- test/skycrew.test.mjs _(outside js/)_ — `sim`, `launchSim`
- test/solprime.test.mjs _(outside js/)_ — `sim`, `launchSim`, `tickSim`, `setTerminal`, `worldSnapshot`
- test/speech.test.mjs _(outside js/)_ — `sim`, `launchSim`
- test/stafflife.test.mjs _(outside js/)_ — `sim`, `launchSim`, `tickSim`
- test/systems.test.mjs _(outside js/)_ — `sim`, `launchSim`, `tickSim`, `crewCapacity`, `robotCapacity`, `currentShipId`
- test/trade.test.mjs _(outside js/)_ — `sim`, `launchSim`, `tickSim`, `sellPriceAt`, `buyPriceAt`
- test/undock.test.mjs _(outside js/)_ — `sim`, `launchSim`, `tickSim`, `toggleDock`
- test/upgrades.test.mjs _(outside js/)_ — `sim`, `launchSim`, `tickSim`, `crewCapacity`, `robotCapacity`, `currentShipId`

## Exports

- [`sim`](#s-sim) · const — used by [js/aria/aria.js](../aria/aria.js.md), [js/aria/company.js](../aria/company.js.md), [js/aria/nav.js](../aria/nav.js.md), [js/aria/pilot.js](../aria/pilot.js.md), [js/aria/play.js](../aria/play.js.md), [js/aria/senses.js](../aria/senses.js.md), [js/comms/comms.js](../comms/comms.js.md), [js/console/console.js](../console/console.js.md), [js/console/panels/corp-marshal.js](../console/panels/corp-marshal.js.md), [js/console/panels/corp-town.js](../console/panels/corp-town.js.md), [js/console/panels/corp.js](../console/panels/corp.js.md), [js/console/panels/crew-brig.js](../console/panels/crew-brig.js.md), [js/console/panels/crew-gdb.js](../console/panels/crew-gdb.js.md), [js/console/panels/crew-gene.js](../console/panels/crew-gene.js.md), [js/console/panels/crew-sky.js](../console/panels/crew-sky.js.md), [js/console/panels/crew.js](../console/panels/crew.js.md), [js/console/panels/market.js](../console/panels/market.js.md), [js/console/panels/nav.js](../console/panels/nav.js.md), [js/console/panels/ship.js](../console/panels/ship.js.md), [js/console/panels/work-drones.js](../console/panels/work-drones.js.md), [js/console/panels/work-fleet.js](../console/panels/work-fleet.js.md), [js/console/panels/work-tape.js](../console/panels/work-tape.js.md), [js/console/panels/work.js](../console/panels/work.js.md), [js/corp/company.js](../corp/company.js.md), [js/corp/fleet.js](../corp/fleet.js.md), [js/crew/beats.js](../crew/beats.js.md), [js/crew/captive.js](../crew/captive.js.md), [js/crew/children.js](../crew/children.js.md), [js/crew/childtalk.js](../crew/childtalk.js.md), [js/crew/deckacts.js](../crew/deckacts.js.md), [js/crew/deckmind.js](../crew/deckmind.js.md), [js/crew/duties.js](../crew/duties.js.md), [js/crew/family.js](../crew/family.js.md), [js/crew/hull.js](../crew/hull.js.md), [js/crew/orders.js](../crew/orders.js.md), [js/crew/robots.js](../crew/robots.js.md), [js/crew/robotyard.js](../crew/robotyard.js.md), [js/crew/romance.js](../crew/romance.js.md), [js/crew/roster.js](../crew/roster.js.md), [js/crew/talk-threads.js](../crew/talk-threads.js.md), [js/crew/talk.js](../crew/talk.js.md), [js/drones/npcdrones.js](../drones/npcdrones.js.md), [js/drones/ops.js](../drones/ops.js.md), [js/economy/chains.js](../economy/chains.js.md), [js/economy/contracts.js](../economy/contracts.js.md), [js/economy/icework.js](../economy/icework.js.md), [js/economy/traderoutes.js](../economy/traderoutes.js.md), [js/economy/upgrades.js](../economy/upgrades.js.md), [js/flight/autopilot.js](../flight/autopilot.js.md), [js/flight/contacts.js](../flight/contacts.js.md), [js/flight/probes.js](../flight/probes.js.md), [js/flight/repair.js](../flight/repair.js.md), [js/interior/boarding.js](../interior/boarding.js.md), [js/interior/interior.js](../interior/interior.js.md), [js/main.js](../main.js.md), [js/mission/run.js](../mission/run.js.md), [js/mission/script.js](../mission/script.js.md), [js/mission/tradeops.js](../mission/tradeops.js.md), [js/net/net.js](../net/net.js.md), [js/net/worldsync.js](../net/worldsync.js.md), [js/npc/bounty.js](../npc/bounty.js.md), [js/npc/captain.js](../npc/captain.js.md), [js/npc/npccrew.js](../npc/npccrew.js.md), [js/render/attract.js](../render/attract.js.md), [js/render/engine.js](../render/engine.js.md), [js/station/deckhall.js](../station/deckhall.js.md), [js/station/fabyard.js](../station/fabyard.js.md), [js/station/refityard.js](../station/refityard.js.md), [js/station/staffcare.js](../station/staffcare.js.md), [js/station/stafflife.js](../station/stafflife.js.md), [js/station/staffline.js](../station/staffline.js.md), [js/station/stationdeck.js](../station/stationdeck.js.md), [js/station/stationlife.js](../station/stationlife.js.md), [js/ui/boardview.js](../ui/boardview.js.md), [js/ui/chatbox.js](../ui/chatbox.js.md), [js/ui/dockboot.js](../ui/dockboot.js.md), [js/ui/holdview.js](../ui/holdview.js.md), [js/ui/hud.js](../ui/hud.js.md), [js/ui/map.js](../ui/map.js.md), [js/ui/secbadge.js](../ui/secbadge.js.md), [js/ui/tutorial-core.js](../ui/tutorial-core.js.md), [js/ui/tutorial.js](../ui/tutorial.js.md), [js/world/events/atmoworks.js](../world/events/atmoworks.js.md), test/ariabiz.test.mjs, test/ariaplay.test.mjs, test/ariasense.test.mjs, test/autopilot.test.mjs, test/avoid.test.mjs, test/balance.test.mjs, test/bay.test.mjs, test/beats.test.mjs, test/board.test.mjs, test/bounty.test.mjs, test/chains.test.mjs, test/chart.test.mjs, test/chartquiet.test.mjs, test/childtalk.test.mjs, test/converse.test.mjs, test/crew-life.test.mjs, test/desk.test.mjs, test/dockwork.test.mjs, test/economy.test.mjs, test/gdb.test.mjs, test/genome.test.mjs, test/ground.test.mjs, test/hold.test.mjs, test/jobloop.test.mjs, test/line.test.mjs, test/marks.test.mjs, test/mission.test.mjs, test/nav.test.mjs, test/nose.test.mjs, test/npcchat.test.mjs, test/orders.test.mjs, test/people.test.mjs, test/portcontrol.test.mjs, test/portdrones.test.mjs, test/qrf.test.mjs, test/reactive.test.mjs, test/robots.test.mjs, test/rogues.test.mjs, test/seclevel.test.mjs, test/sites.test.mjs, test/sky.test.mjs, test/skycrew.test.mjs, test/solprime.test.mjs, test/speech.test.mjs, test/stafflife.test.mjs, test/systems.test.mjs, test/trade.test.mjs, test/undock.test.mjs, test/upgrades.test.mjs
- [`wrapPi`](#s-wrapPi) · function — used by [js/mission/script.js](../mission/script.js.md)
- [`getForward`](#s-getForward) · function — used by [js/mission/script.js](../mission/script.js.md)
- [`getRight`](#s-getRight) · function — used by [js/mission/script.js](../mission/script.js.md)
- [`logEvent`](#s-logEvent) · function — used by [js/aria/aria.js](../aria/aria.js.md), [js/aria/company.js](../aria/company.js.md), [js/aria/pilot.js](../aria/pilot.js.md), [js/comms/comms.js](../comms/comms.js.md), [js/corp/company.js](../corp/company.js.md), [js/corp/fleet.js](../corp/fleet.js.md), [js/crew/captive.js](../crew/captive.js.md), [js/crew/children.js](../crew/children.js.md), [js/crew/family.js](../crew/family.js.md), [js/crew/talk-threads.js](../crew/talk-threads.js.md), [js/crew/talk.js](../crew/talk.js.md), [js/drones/ops.js](../drones/ops.js.md), [js/economy/contracts.js](../economy/contracts.js.md), [js/economy/icework.js](../economy/icework.js.md), [js/flight/autopilot.js](../flight/autopilot.js.md), [js/flight/probes.js](../flight/probes.js.md), [js/flight/repair.js](../flight/repair.js.md), [js/interior/boarding.js](../interior/boarding.js.md), [js/interior/interior.js](../interior/interior.js.md), [js/mission/run.js](../mission/run.js.md), [js/mission/script.js](../mission/script.js.md), [js/mission/tradeops.js](../mission/tradeops.js.md), [js/net/worldsync.js](../net/worldsync.js.md), [js/npc/bounty.js](../npc/bounty.js.md), [js/npc/captain.js](../npc/captain.js.md), [js/npc/npccrew.js](../npc/npccrew.js.md), [js/station/staffline.js](../station/staffline.js.md), [js/station/stationlife.js](../station/stationlife.js.md), [js/ui/holdview.js](../ui/holdview.js.md), [js/ui/tutorial.js](../ui/tutorial.js.md), [js/world/events/atmoworks.js](../world/events/atmoworks.js.md)
- [`relationOf`](#s-relationOf) · function — used by [js/mission/script.js](../mission/script.js.md), test/portdrones.test.mjs, test/qrf.test.mjs, test/reactive.test.mjs, test/seclevel.test.mjs
- [`RELATIONS`](#s-RELATIONS) · const — used by [js/mission/script.js](../mission/script.js.md)
- [`setRelation`](#s-setRelation) · function — used by [js/console/panels/nav.js](../console/panels/nav.js.md), [js/mission/script.js](../mission/script.js.md)
- [`cycleRelation`](#s-cycleRelation) · function — used by [js/console/panels/nav.js](../console/panels/nav.js.md), [js/mission/script.js](../mission/script.js.md)
- [`addWaypoint`](#s-addWaypoint) · function — used by [js/console/panels/nav.js](../console/panels/nav.js.md), [js/mission/script.js](../mission/script.js.md)
- [`addWaypointAt`](#s-addWaypointAt) · function — used by [js/aria/nav.js](../aria/nav.js.md), [js/comms/comms.js](../comms/comms.js.md), [js/drones/ops.js](../drones/ops.js.md), [js/economy/contracts.js](../economy/contracts.js.md), [js/flight/probes.js](../flight/probes.js.md), [js/mission/run.js](../mission/run.js.md), [js/mission/script.js](../mission/script.js.md), [js/ui/map.js](../ui/map.js.md), [js/ui/tutorial.js](../ui/tutorial.js.md), test/autopilot.test.mjs, test/chart.test.mjs, test/marks.test.mjs, test/mission.test.mjs
- [`addBodyWaypoint`](#s-addBodyWaypoint) · function — used by [js/comms/comms.js](../comms/comms.js.md), [js/console/panels/nav.js](../console/panels/nav.js.md), [js/mission/script.js](../mission/script.js.md), [js/ui/map.js](../ui/map.js.md), [js/ui/tutorial.js](../ui/tutorial.js.md)
- [`removeWaypoint`](#s-removeWaypoint) · function — used by [js/console/panels/nav.js](../console/panels/nav.js.md), [js/economy/contracts.js](../economy/contracts.js.md), [js/mission/run.js](../mission/run.js.md), [js/mission/script.js](../mission/script.js.md), [js/ui/map.js](../ui/map.js.md), test/marks.test.mjs
- [`setActiveWaypoint`](#s-setActiveWaypoint) · function — used by [js/console/panels/nav.js](../console/panels/nav.js.md), [js/mission/script.js](../mission/script.js.md)
- [`addAnchoredWaypoint`](#s-addAnchoredWaypoint) · function — used by [js/comms/comms.js](../comms/comms.js.md), [js/console/panels/corp.js](../console/panels/corp.js.md), [js/console/panels/market.js](../console/panels/market.js.md), [js/console/panels/work-drones.js](../console/panels/work-drones.js.md), [js/drones/ops.js](../drones/ops.js.md), [js/economy/contracts.js](../economy/contracts.js.md), [js/mission/run.js](../mission/run.js.md), [js/mission/script.js](../mission/script.js.md), [js/ui/map.js](../ui/map.js.md), [js/ui/tutorial-core.js](../ui/tutorial-core.js.md), test/marks.test.mjs
- [`waypointPosition`](#s-waypointPosition) · function — used by [js/console/panels/nav.js](../console/panels/nav.js.md), [js/drones/ops.js](../drones/ops.js.md), [js/mission/script.js](../mission/script.js.md), [js/render/engine.js](../render/engine.js.md), [js/ui/map.js](../ui/map.js.md), test/marks.test.mjs
- [`waypointVelocity`](#s-waypointVelocity) · function — used by [js/mission/script.js](../mission/script.js.md), test/marks.test.mjs
- [`activeWaypoint`](#s-activeWaypoint) · function — used by [js/mission/script.js](../mission/script.js.md), [js/render/engine.js](../render/engine.js.md)
- [`SMELT_FEE`](#s-SMELT_FEE) · const — used by [js/mission/script.js](../mission/script.js.md)
- [`SMELT_SECTORS`](#s-SMELT_SECTORS) · const — used by [js/mission/script.js](../mission/script.js.md)
- [`stashAt`](#s-stashAt) · function — used by [js/console/panels/market.js](../console/panels/market.js.md), [js/mission/script.js](../mission/script.js.md), test/autopilot.test.mjs
- [`stashDeposit`](#s-stashDeposit) · function — used by [js/console/panels/market.js](../console/panels/market.js.md), [js/mission/run.js](../mission/run.js.md), [js/mission/script.js](../mission/script.js.md), test/autopilot.test.mjs
- [`stashWithdraw`](#s-stashWithdraw) · function — used by [js/console/panels/market.js](../console/panels/market.js.md), [js/mission/script.js](../mission/script.js.md), test/autopilot.test.mjs
- [`canSmeltAt`](#s-canSmeltAt) · function — used by [js/console/panels/market.js](../console/panels/market.js.md), [js/flight/autopilot.js](../flight/autopilot.js.md), [js/mission/run.js](../mission/run.js.md), [js/mission/script.js](../mission/script.js.md), test/autopilot.test.mjs
- [`smeltAll`](#s-smeltAll) · function — used by [js/console/panels/market.js](../console/panels/market.js.md), [js/mission/run.js](../mission/run.js.md), [js/mission/script.js](../mission/script.js.md), test/autopilot.test.mjs
- [`sellAllOre`](#s-sellAllOre) · function — used by [js/console/panels/market.js](../console/panels/market.js.md), [js/mission/run.js](../mission/run.js.md), [js/mission/script.js](../mission/script.js.md), [js/mission/tradeops.js](../mission/tradeops.js.md), test/dockwork.test.mjs, test/jobloop.test.mjs
- [`jettison`](#s-jettison) · function — used by [js/console/panels/market.js](../console/panels/market.js.md), [js/mission/script.js](../mission/script.js.md), [js/ui/holdview.js](../ui/holdview.js.md)
- [`stationStatus`](#s-stationStatus) · function — used by [js/console/panels/market.js](../console/panels/market.js.md), [js/console/panels/nav.js](../console/panels/nav.js.md), [js/console/panels/ship.js](../console/panels/ship.js.md), [js/flight/autopilot.js](../flight/autopilot.js.md), [js/mission/script.js](../mission/script.js.md), [js/npc/captain.js](../npc/captain.js.md)
- [`setNoticeAbout`](#s-setNoticeAbout) · function — used by [js/flight/autopilot.js](../flight/autopilot.js.md), [js/mission/script.js](../mission/script.js.md)
- [`toggleDock`](#s-toggleDock) · function — used by [js/comms/comms.js](../comms/comms.js.md), [js/console/panels/market.js](../console/panels/market.js.md), [js/flight/autopilot.js](../flight/autopilot.js.md), [js/mission/run.js](../mission/run.js.md), [js/mission/script.js](../mission/script.js.md), [js/npc/captain.js](../npc/captain.js.md), [js/station/stationdeck.js](../station/stationdeck.js.md), [js/ui/hud.js](../ui/hud.js.md), test/dockwork.test.mjs, test/portcontrol.test.mjs, test/undock.test.mjs
- [`tradeBuy`](#s-tradeBuy) · function — used by [js/console/panels/market.js](../console/panels/market.js.md), [js/mission/run.js](../mission/run.js.md), [js/mission/script.js](../mission/script.js.md), [js/mission/tradeops.js](../mission/tradeops.js.md), test/dockwork.test.mjs
- [`sellPriceAt`](#s-sellPriceAt) · function — used by [js/aria/play.js](../aria/play.js.md), [js/aria/senses.js](../aria/senses.js.md), [js/console/panels/market.js](../console/panels/market.js.md), [js/economy/contracts.js](../economy/contracts.js.md), [js/economy/traderoutes.js](../economy/traderoutes.js.md), [js/flight/autopilot.js](../flight/autopilot.js.md), [js/mission/run.js](../mission/run.js.md), [js/mission/script.js](../mission/script.js.md), [js/npc/captain.js](../npc/captain.js.md), [js/ui/holdview.js](../ui/holdview.js.md), test/economy.test.mjs, test/trade.test.mjs
- [`marketMult`](#s-marketMult) · function — used by [js/mission/script.js](../mission/script.js.md)
- [`buyPriceAt`](#s-buyPriceAt) · function — used by [js/aria/senses.js](../aria/senses.js.md), [js/console/panels/market.js](../console/panels/market.js.md), [js/economy/traderoutes.js](../economy/traderoutes.js.md), [js/mission/run.js](../mission/run.js.md), [js/mission/script.js](../mission/script.js.md), test/economy.test.mjs, test/trade.test.mjs
- [`portLedger`](#s-portLedger) · function — used by [js/console/panels/market.js](../console/panels/market.js.md), [js/mission/script.js](../mission/script.js.md), test/economy.test.mjs
- [`portWants`](#s-portWants) · function — used by [js/comms/comms.js](../comms/comms.js.md), [js/console/panels/market.js](../console/panels/market.js.md), [js/mission/script.js](../mission/script.js.md)
- [`tradeSell`](#s-tradeSell) · function — used by [js/console/panels/market.js](../console/panels/market.js.md), [js/mission/run.js](../mission/run.js.md), [js/mission/script.js](../mission/script.js.md), [js/mission/tradeops.js](../mission/tradeops.js.md), [js/ui/holdview.js](../ui/holdview.js.md), test/dockwork.test.mjs, test/economy.test.mjs
- [`claimPort`](#s-claimPort) · function — used by [js/console/panels/market.js](../console/panels/market.js.md), [js/mission/script.js](../mission/script.js.md), [js/ui/hud.js](../ui/hud.js.md)
- [`setTerminal`](#s-setTerminal) · function — used by [js/console/console.js](../console/console.js.md), [js/mission/script.js](../mission/script.js.md), test/solprime.test.mjs
- [`setTermHold`](#s-setTermHold) · function — used by [js/console/console.js](../console/console.js.md), [js/mission/script.js](../mission/script.js.md)
- [`resetTune`](#s-resetTune) · function — used by [js/console/panels/ship.js](../console/panels/ship.js.md), [js/mission/script.js](../mission/script.js.md)
- [`setTune`](#s-setTune) · function — used by [js/console/panels/ship.js](../console/panels/ship.js.md), [js/mission/script.js](../mission/script.js.md)
- [`moveShed`](#s-moveShed) · function — used by [js/console/panels/ship.js](../console/panels/ship.js.md), [js/mission/script.js](../mission/script.js.md)
- [`hydrateProgress`](#s-hydrateProgress) · function — used by [js/mission/script.js](../mission/script.js.md)
- [`loadSky`](#s-loadSky) · function — used by [js/mission/script.js](../mission/script.js.md), [js/ui/hud.js](../ui/hud.js.md)
- [`launchSim`](#s-launchSim) · function — used by [js/mission/script.js](../mission/script.js.md), [js/ui/hud.js](../ui/hud.js.md), test/ariabiz.test.mjs, test/ariaplay.test.mjs, test/ariasense.test.mjs, test/autopilot.test.mjs, test/avoid.test.mjs, test/balance.test.mjs, test/bay.test.mjs, test/beats.test.mjs, test/board.test.mjs, test/bounty.test.mjs, test/chains.test.mjs, test/chart.test.mjs, test/chartquiet.test.mjs, test/childtalk.test.mjs, test/converse.test.mjs, test/crew-life.test.mjs, test/desk.test.mjs, test/dockwork.test.mjs, test/economy.test.mjs, test/gdb.test.mjs, test/genome.test.mjs, test/ground.test.mjs, test/hold.test.mjs, test/jobloop.test.mjs, test/line.test.mjs, test/marks.test.mjs, test/mission.test.mjs, test/nose.test.mjs, test/npcchat.test.mjs, test/orders.test.mjs, test/people.test.mjs, test/portcontrol.test.mjs, test/portdrones.test.mjs, test/qrf.test.mjs, test/reactive.test.mjs, test/robots.test.mjs, test/rogues.test.mjs, test/seclevel.test.mjs, test/sites.test.mjs, test/sky.test.mjs, test/skycrew.test.mjs, test/solprime.test.mjs, test/speech.test.mjs, test/stafflife.test.mjs, test/systems.test.mjs, test/trade.test.mjs, test/undock.test.mjs, test/upgrades.test.mjs
- [`applyCareerDefaults`](#s-applyCareerDefaults) · function — used by [js/mission/script.js](../mission/script.js.md)
- [`resetTelemetry`](#s-resetTelemetry) · function — used by [js/mission/script.js](../mission/script.js.md)
- [`returnToMenu`](#s-returnToMenu) · function — used by [js/mission/script.js](../mission/script.js.md), [js/ui/hud.js](../ui/hud.js.md)
- [`currentShipId`](#s-currentShipId) · function — used by [js/aria/senses.js](../aria/senses.js.md), [js/crew/roster.js](../crew/roster.js.md), [js/economy/contracts.js](../economy/contracts.js.md), [js/economy/icework.js](../economy/icework.js.md), [js/economy/upgrades.js](../economy/upgrades.js.md), [js/interior/interior.js](../interior/interior.js.md), [js/mission/script.js](../mission/script.js.md), [js/render/engine.js](../render/engine.js.md), [js/station/refityard.js](../station/refityard.js.md), [js/station/stationdeck.js](../station/stationdeck.js.md), [js/world/events/atmoworks.js](../world/events/atmoworks.js.md), test/sky.test.mjs, test/systems.test.mjs, test/upgrades.test.mjs
- [`issuedHullId`](#s-issuedHullId) · function — used by [js/mission/script.js](../mission/script.js.md), [js/station/stationdeck.js](../station/stationdeck.js.md), test/sky.test.mjs
- [`laneCredit`](#s-laneCredit) · function — used by [js/mission/script.js](../mission/script.js.md)
- [`applyRemoteState`](#s-applyRemoteState) · function — used by [js/mission/script.js](../mission/script.js.md), [js/net/net.js](../net/net.js.md)
- [`applyReliable`](#s-applyReliable) · function — used by [js/mission/script.js](../mission/script.js.md), [js/net/net.js](../net/net.js.md)
- [`dropRemote`](#s-dropRemote) · function — used by [js/mission/script.js](../mission/script.js.md), [js/net/net.js](../net/net.js.md)
- [`persistNow`](#s-persistNow) · function — used by [js/main.js](../main.js.md), [js/mission/script.js](../mission/script.js.md)
- [`wellEdge`](#s-wellEdge) · function — used by [js/aria/nav.js](../aria/nav.js.md), [js/mission/script.js](../mission/script.js.md), test/nav.test.mjs, test/sky.test.mjs
- [`wellG`](#s-wellG) · function — used by [js/mission/script.js](../mission/script.js.md), test/nav.test.mjs
- [`WARP`](#s-WARP) · const — used by [js/aria/nav.js](../aria/nav.js.md), [js/flight/autopilot.js](../flight/autopilot.js.md), [js/mission/script.js](../mission/script.js.md), test/nav.test.mjs, test/sky.test.mjs
- [`warpNodeById`](#s-warpNodeById) · function — used by [js/aria/nav.js](../aria/nav.js.md), [js/flight/autopilot.js](../flight/autopilot.js.md), [js/mission/run.js](../mission/run.js.md), [js/mission/script.js](../mission/script.js.md), [js/ui/map.js](../ui/map.js.md), [js/ui/tutorial-core.js](../ui/tutorial-core.js.md), test/chart.test.mjs
- [`POINT_ARRIVE_R`](#s-POINT_ARRIVE_R) · const — used by [js/mission/script.js](../mission/script.js.md), test/chart.test.mjs, test/mission.test.mjs
- [`warpDestination`](#s-warpDestination) · function — used by [js/flight/autopilot.js](../flight/autopilot.js.md), [js/mission/script.js](../mission/script.js.md), [js/ui/map.js](../ui/map.js.md), [js/ui/tutorial-core.js](../ui/tutorial-core.js.md), test/chart.test.mjs
- [`losBlocker`](#s-losBlocker) · function — used by [js/aria/nav.js](../aria/nav.js.md), [js/aria/senses.js](../aria/senses.js.md), [js/economy/traderoutes.js](../economy/traderoutes.js.md), [js/mission/run.js](../mission/run.js.md), [js/mission/script.js](../mission/script.js.md), [js/ui/map.js](../ui/map.js.md), test/ariasense.test.mjs
- [`warpBlock`](#s-warpBlock) · function — used by [js/console/panels/nav.js](../console/panels/nav.js.md), [js/flight/autopilot.js](../flight/autopilot.js.md), [js/mission/script.js](../mission/script.js.md), [js/ui/map.js](../ui/map.js.md), [js/ui/tutorial-core.js](../ui/tutorial-core.js.md), test/chart.test.mjs
- [`warpStatus`](#s-warpStatus) · function — used by [js/console/panels/nav.js](../console/panels/nav.js.md), [js/mission/script.js](../mission/script.js.md)
- [`spoolTime`](#s-spoolTime) · function — used by [js/aria/nav.js](../aria/nav.js.md), [js/flight/autopilot.js](../flight/autopilot.js.md), [js/mission/script.js](../mission/script.js.md), [js/render/engine.js](../render/engine.js.md)
- [`ALIGN_DEG`](#s-ALIGN_DEG) · const — used by [js/mission/script.js](../mission/script.js.md)
- [`DROPOUT_ODDS`](#s-DROPOUT_ODDS) · const — used by [js/mission/script.js](../mission/script.js.md), [js/npc/captain.js](../npc/captain.js.md)
- [`alignmentTo`](#s-alignmentTo) · function — used by [js/mission/script.js](../mission/script.js.md)
- [`plotRoute`](#s-plotRoute) · function — used by [js/flight/autopilot.js](../flight/autopilot.js.md), [js/mission/script.js](../mission/script.js.md), [js/npc/captain.js](../npc/captain.js.md), test/chart.test.mjs
- [`toggleWarp`](#s-toggleWarp) · function — used by [js/console/panels/nav.js](../console/panels/nav.js.md), [js/flight/autopilot.js](../flight/autopilot.js.md), [js/mission/script.js](../mission/script.js.md), [js/ui/map.js](../ui/map.js.md), test/nose.test.mjs
- [`clearArrival`](#s-clearArrival) · function — used by [js/mission/script.js](../mission/script.js.md), test/chart.test.mjs
- [`stepWarp`](#s-stepWarp) · function — used by [js/mission/script.js](../mission/script.js.md), test/chart.test.mjs
- [`lockCandidates`](#s-lockCandidates) · function — used by [js/mission/script.js](../mission/script.js.md)
- [`targetPosition`](#s-targetPosition) · function — used by [js/mission/script.js](../mission/script.js.md), [js/render/engine.js](../render/engine.js.md), test/chart.test.mjs, test/marks.test.mjs
- [`targetVelocity`](#s-targetVelocity) · function — used by [js/mission/script.js](../mission/script.js.md), test/marks.test.mjs
- [`setNavTarget`](#s-setNavTarget) · function — used by [js/mission/script.js](../mission/script.js.md)
- [`clearLock`](#s-clearLock) · function — used by [js/mission/script.js](../mission/script.js.md)
- [`togglePointerLock`](#s-togglePointerLock) · function — used by [js/mission/script.js](../mission/script.js.md), [js/ui/hud.js](../ui/hud.js.md)
- [`acquireLock`](#s-acquireLock) · function — used by [js/mission/script.js](../mission/script.js.md), [js/npc/captain.js](../npc/captain.js.md), [js/render/engine.js](../render/engine.js.md), [js/ui/map.js](../ui/map.js.md), [js/ui/tutorial-core.js](../ui/tutorial-core.js.md), [js/ui/tutorial.js](../ui/tutorial.js.md)
- [`damageBody`](#s-damageBody) · function — used by [js/mission/script.js](../mission/script.js.md)
- [`startCataclysm`](#s-startCataclysm) · function — used by [js/mission/script.js](../mission/script.js.md)
- [`goSupernova`](#s-goSupernova) · function — used by [js/mission/script.js](../mission/script.js.md)
- [`collapseToHole`](#s-collapseToHole) · function — used by [js/mission/script.js](../mission/script.js.md)
- [`summonHole`](#s-summonHole) · function — used by [js/mission/script.js](../mission/script.js.md)
- [`loseHull`](#s-loseHull) · function — used by [js/mission/script.js](../mission/script.js.md)
- [`applyRemoteStrike`](#s-applyRemoteStrike) · function — used by [js/mission/script.js](../mission/script.js.md), [js/net/worldsync.js](../net/worldsync.js.md)
- [`worldSnapshot`](#s-worldSnapshot) · function — used by [js/mission/script.js](../mission/script.js.md), [js/net/worldsync.js](../net/worldsync.js.md), test/solprime.test.mjs
- [`applyWorldSnapshot`](#s-applyWorldSnapshot) · function — used by [js/mission/script.js](../mission/script.js.md), [js/net/worldsync.js](../net/worldsync.js.md)
- [`impactTier`](#s-impactTier) · function — used by [js/mission/script.js](../mission/script.js.md)
- [`strikeBody`](#s-strikeBody) · function — used by [js/mission/script.js](../mission/script.js.md)
- [`applyRemoteRockHit`](#s-applyRemoteRockHit) · function — used by [js/mission/script.js](../mission/script.js.md), [js/net/worldsync.js](../net/worldsync.js.md)
- [`SENSOR_R`](#s-SENSOR_R) · const — used by [js/mission/script.js](../mission/script.js.md), test/chart.test.mjs
- [`crewCapacity`](#s-crewCapacity) · function — used by [js/aria/company.js](../aria/company.js.md), [js/mission/script.js](../mission/script.js.md), [js/station/deckhall.js](../station/deckhall.js.md), test/ariabiz.test.mjs, test/systems.test.mjs, test/upgrades.test.mjs
- [`robotCapacity`](#s-robotCapacity) · function — used by [js/mission/script.js](../mission/script.js.md), test/systems.test.mjs, test/upgrades.test.mjs
- [`sensorRange`](#s-sensorRange) · function — used by [js/flight/probes.js](../flight/probes.js.md), [js/mission/script.js](../mission/script.js.md), [js/render/engine.js](../render/engine.js.md), test/chart.test.mjs
- [`sensorPulse`](#s-sensorPulse) · function — used by [js/mission/script.js](../mission/script.js.md), [js/ui/hud.js](../ui/hud.js.md)
- [`pulseActive`](#s-pulseActive) · function — used by [js/mission/script.js](../mission/script.js.md)
- [`autoLevel`](#s-autoLevel) · function — used by [js/mission/script.js](../mission/script.js.md), [js/ui/hud.js](../ui/hud.js.md)
- [`cycleTimeScale`](#s-cycleTimeScale) · function — used by [js/mission/script.js](../mission/script.js.md), [js/ui/hud.js](../ui/hud.js.md)
- [`takeSalvageContract`](#s-takeSalvageContract) · function — used by [js/comms/comms.js](../comms/comms.js.md), [js/mission/script.js](../mission/script.js.md)
- [`stepContract`](#s-stepContract) · function — used by [js/mission/script.js](../mission/script.js.md)
- [`cycleTurretMode`](#s-cycleTurretMode) · function — used by [js/mission/script.js](../mission/script.js.md), [js/ui/hud.js](../ui/hud.js.md)
- [`setTurretMode`](#s-setTurretMode) · function — used by [js/aria/pilot.js](../aria/pilot.js.md), [js/aria/play.js](../aria/play.js.md), [js/console/panels/ship.js](../console/panels/ship.js.md), [js/mission/run.js](../mission/run.js.md), [js/mission/script.js](../mission/script.js.md), [js/npc/captain.js](../npc/captain.js.md)
- [`setMiningMode`](#s-setMiningMode) · function — used by [js/aria/pilot.js](../aria/pilot.js.md), [js/console/panels/ship.js](../console/panels/ship.js.md), [js/flight/autopilot.js](../flight/autopilot.js.md), [js/mission/run.js](../mission/run.js.md), [js/mission/script.js](../mission/script.js.md), [js/npc/captain.js](../npc/captain.js.md), [js/ui/hud.js](../ui/hud.js.md)
- [`cycleMiningMode`](#s-cycleMiningMode) · function — used by [js/mission/script.js](../mission/script.js.md), [js/ui/hud.js](../ui/hud.js.md)
- [`toggleSystem`](#s-toggleSystem) · function — used by [js/aria/pilot.js](../aria/pilot.js.md), [js/console/panels/ship.js](../console/panels/ship.js.md), [js/mission/run.js](../mission/run.js.md), [js/mission/script.js](../mission/script.js.md), [js/ui/hud.js](../ui/hud.js.md)
- [`setThrottle`](#s-setThrottle) · function — used by [js/flight/autopilot.js](../flight/autopilot.js.md), [js/mission/script.js](../mission/script.js.md), [js/npc/captain.js](../npc/captain.js.md), [js/ui/hud.js](../ui/hud.js.md), test/chart.test.mjs
- [`throttleCap`](#s-throttleCap) · function — used by [js/mission/run.js](../mission/run.js.md), [js/mission/script.js](../mission/script.js.md), test/chart.test.mjs
- [`shiftClock`](#s-shiftClock) · function — used by [js/mission/script.js](../mission/script.js.md), [js/net/net.js](../net/net.js.md), [js/net/worldsync.js](../net/worldsync.js.md)
- [`tickSim`](#s-tickSim) · function — used by [js/mission/script.js](../mission/script.js.md), [js/render/engine.js](../render/engine.js.md), test/ariabiz.test.mjs, test/ariaplay.test.mjs, test/ariasense.test.mjs, test/autopilot.test.mjs, test/avoid.test.mjs, test/board.test.mjs, test/chart.test.mjs, test/chartquiet.test.mjs, test/childtalk.test.mjs, test/dockwork.test.mjs, test/gdb.test.mjs, test/hold.test.mjs, test/line.test.mjs, test/mission.test.mjs, test/nose.test.mjs, test/npcchat.test.mjs, test/orders.test.mjs, test/people.test.mjs, test/portcontrol.test.mjs, test/portdrones.test.mjs, test/qrf.test.mjs, test/robots.test.mjs, test/seclevel.test.mjs, test/solprime.test.mjs, test/stafflife.test.mjs, test/systems.test.mjs, test/trade.test.mjs, test/undock.test.mjs, test/upgrades.test.mjs
- [`pauseTick`](#s-pauseTick) · function — used by [js/mission/script.js](../mission/script.js.md), [js/render/engine.js](../render/engine.js.md)
- [`resumePlay`](#s-resumePlay) · function — used by [js/mission/script.js](../mission/script.js.md), [js/ui/hud.js](../ui/hud.js.md)
- [`selectBody`](#s-selectBody) · function — used by [js/aria/nav.js](../aria/nav.js.md), [js/comms/comms.js](../comms/comms.js.md), [js/console/panels/nav.js](../console/panels/nav.js.md), [js/flight/autopilot.js](../flight/autopilot.js.md), [js/mission/run.js](../mission/run.js.md), [js/mission/script.js](../mission/script.js.md), [js/npc/captain.js](../npc/captain.js.md), [js/ui/map.js](../ui/map.js.md), [js/ui/tutorial.js](../ui/tutorial.js.md), test/ariasense.test.mjs, test/avoid.test.mjs, test/chart.test.mjs, test/nose.test.mjs
- [`requestJump`](#s-requestJump) · function — used by [js/flight/autopilot.js](../flight/autopilot.js.md), [js/mission/script.js](../mission/script.js.md), [js/npc/captain.js](../npc/captain.js.md), [js/ui/hud.js](../ui/hud.js.md)
- [`requestScan`](#s-requestScan) · function — used by [js/console/panels/nav.js](../console/panels/nav.js.md), [js/mission/run.js](../mission/run.js.md), [js/mission/script.js](../mission/script.js.md), [js/ui/hud.js](../ui/hud.js.md)
- [`dismissNotice`](#s-dismissNotice) · function — used by [js/mission/script.js](../mission/script.js.md), [js/ui/hud.js](../ui/hud.js.md)
- [`requestWarp`](#s-requestWarp) · const — used by [js/mission/script.js](../mission/script.js.md)
- [`bodyUnderReticle`](#s-bodyUnderReticle) · function — used by [js/mission/script.js](../mission/script.js.md)
- [`publishHud`](#s-publishHud) · function — used by [js/mission/script.js](../mission/script.js.md), [js/render/engine.js](../render/engine.js.md)
- [`wireControlsTest`](#s-wireControlsTest) · function — used by [js/mission/script.js](../mission/script.js.md), [js/render/engine.js](../render/engine.js.md)
- `setInjectedKeys` — used by [js/mission/script.js](../mission/script.js.md)
- `setInjectedPan` — used by [js/mission/script.js](../mission/script.js.md)
- [`tickSolHost`](#s-tickSolHost) · function — used by [js/mission/script.js](../mission/script.js.md)

## Effects

- **global.write** — `window.__lg` (wireControlsTest:3987)

## Symbols

### <a id="s-WALLET_EVERY"></a>`WALLET_EVERY`

const · L123–123

<!-- note:WALLET_EVERY -->
<!-- /note -->

### <a id="s-LOOK_GAIN"></a>`LOOK_GAIN`

const · L124–124

<!-- note:LOOK_GAIN -->
<!-- /note -->

### <a id="s-expo"></a>`expo(v, amount)`

function · L126–129

- called by: [`stepShip`](#s-stepShip) ×2

<!-- note:expo -->
Softens the centre of the stick without giving up the full rate at the rim.
<!-- /note -->

### <a id="s-SURFACE_PAD"></a>`SURFACE_PAD`

const · L130–130

<!-- note:SURFACE_PAD -->
<!-- /note -->

### <a id="s-sim"></a>`sim`

const · **exported** · L132–215

- calls: [`makeShip`](../flight/ship.js.md#s-makeShip) _js/flight/ship.js_

<!-- note:sim -->
- L142 · `engagement: null,` — the live NPC firefight, if any (npc/battles.js)
- L146 · `telemetry: { at: 0, credits: [], hull: [], heat: [], cargo: [], charge: [], speed: [] },` — passive telemetry: sampled every few seconds for the terminal's charts
- L147 · `worldAuthority: true,` — the held sky: true = we run the rocks (solo, or the room's host)
- L148 · `lostPorts: [],` — station ids destroyed this sky, for the snapshot
- L150 · `state: "idle",` — idle | spool | run
- L162 · `dropped: null,` — the last jump that ended short, and what ended it. A dropout is not an
  arrival, and anything that treats it as one (the autopilot's jump-only
  leg did) hands the stick back in the middle of whatever you dropped
  into — which in a belt is the rocks you were trying to leave.
- L166 · `hullFade: 0,` — experimental: deck plan fade (0 hull … 1 blueprint) and the interior sensors' report
- L168 · `market: { drought: null },` — market events: { drought: { until, mult, sectors } | null }
- L169 · `contract: null,` — salvage contract from the news desk: { bodyId, name, rate, until, hauled, paid } | null
- L170 · `impactFX: [],` — impact FX queue the renderer drains, and the canopy white-out
- L172 · `events: [],` — live cataclysms: staged events the renderer animates and the sky lights by.
  Each is { id, bodyId, kind:"impact"|"supernova", sev, t, outcome, ringed }
- L173 · `skyGlow: [],` — every light source an event is currently throwing into the sky, whether
  or not it is on screen: { x, y, z, hex, lum, radius, kind }
- L174 · `skyLift: 0,` — how much brighter the whole sky is right now, 0..1 — drives the exposure
  bump so an event BEHIND you still reads on the hull in front of you
- L176 · `cruise: null,` — held throttle (Shift+Ctrl) and the pre-boost setting to fall back to
- L178 · `scanReports: [],` — remote scans and probe drops: { id, name, x, y, z, at, lines[] }
- L179 · `stash: {},` — port lockers: stationId → { goodId: qty }
- L180 · `autoPlan: { onDock: "sell", loop: true, seam: null, seamOre: null },` — what the autopilot does with a full hold: sell | stash | smelt, and whether it goes back out
- L189 · `wall: 0,` — Wall-clock seconds. The notice card is a piece of UI, not a piece of the
  world, so it must not fade in 0.2 s at 40x time or hang forever at 1x on
  a slow frame budget.
- L190 · `pan: { x: 0, y: 0 },` — low-passed stick, so a flick ramps instead of stepping
- L199 · `lock: { id: null, kind: null, name: "", progress: 0, locked: false, dist: 0, angle: 0 },` — targeting and station keeping
- L201 · `pulseUntil: -1e6,` — ops board
- L204 · `terminalOpen: false,` — terminal
- L210 · `ui: { lanesDrawn: false },` — the lane rigs are off the canopy by default: DOCK brings you in, HAIL asks the port
- L213 · `frameVel: { x: 0, y: 0, z: 0 },` — velocity of the world whose well we are in — the local reference frame
<!-- /note -->

#### <a id="s-sim-broadcast"></a>`sim.broadcast(_d)`

prop · L192–192

<!-- note:sim.broadcast -->
<!-- /note -->

#### <a id="s-sim-send"></a>`sim.send(_d, _id)`

prop · L193–193

<!-- note:sim.send -->
<!-- /note -->

#### <a id="s-sim-onSystemChange"></a>`sim.onSystemChange()`

prop · L214–214

<!-- note:sim.onSystemChange -->
<!-- /note -->

### <a id="s-_g"></a>`_g`

const · L217–217

<!-- note:_g -->
<!-- /note -->

### <a id="s-_bp"></a>`_bp`

const · L218–218

<!-- note:_bp -->
<!-- /note -->

### <a id="s-_rcs"></a>`_rcs`

const · L219–219

<!-- note:_rcs -->
<!-- /note -->

### <a id="s-_matchVel"></a>`_matchVel`

const · L220–220

<!-- note:_matchVel -->
<!-- /note -->

### <a id="s-clamp"></a>`clamp(v, lo, hi)`

function · L222–224

- called by: [`alignmentTo`](#s-alignmentTo) · [`bodyUnderReticle`](#s-bodyUnderReticle) · [`damageBody`](#s-damageBody) · [`engageWarp`](#s-engageWarp) ×3 · [`impactSeverity`](#s-impactSeverity) · [`onImpact`](#s-onImpact) ×3 · [`plotRoute`](#s-plotRoute) ×5 · [`seedOrbit`](#s-seedOrbit) · [`setThrottle`](#s-setThrottle) · [`stepLock`](#s-stepLock) ×2 · [`stepShip`](#s-stepShip) · [`stepWarp`](#s-stepWarp) ×2 · [`togglePointerLock`](#s-togglePointerLock)

<!-- note:clamp -->
<!-- /note -->

### <a id="s-lerp"></a>`lerp(a, b, t)`

function · L225–227

- called by: [`stepWarp`](#s-stepWarp) ×5

<!-- note:lerp -->
<!-- /note -->

### <a id="s-easeInOut"></a>`easeInOut(t)`

function · L228–230

- called by: [`stepWarp`](#s-stepWarp) ×3

<!-- note:easeInOut -->
<!-- /note -->

### <a id="s-wrapPi"></a>`wrapPi(a)`

function · **exported** · L231–233

- called by: [`stepWarp`](#s-stepWarp) ×2 · [`tickSim`](#s-tickSim)

<!-- note:wrapPi -->
<!-- /note -->

### <a id="s-getForward"></a>`getForward(yaw, pitch)`

function · **exported** · L235–237

- calls: [`forwardOf`](../flight/ship.js.md#s-forwardOf) _js/flight/ship.js_

<!-- note:getForward -->
legacy helpers still used by the renderer
<!-- /note -->

### <a id="s-getRight"></a>`getRight(yaw)`

function · **exported** · L238–240

<!-- note:getRight -->
<!-- /note -->

### <a id="s-logEvent"></a>`logEvent(text, kind=)`

function · **exported** · L242–248

- called by: [`ariaTakeConn`](../aria/aria.js.md#s-ariaTakeConn) _js/aria/aria.js_ · [`tickAriaPilot`](../aria/pilot.js.md#s-tickAriaPilot) _js/aria/pilot.js_ · [`attach`](../comms/comms.js.md#s-attach) _js/comms/comms.js_ ×4 · [`broadcast`](../comms/comms.js.md#s-broadcast) _js/comms/comms.js_ · [`hailContact`](../comms/comms.js.md#s-hailContact) _js/comms/comms.js_ · [`hailPeer`](../comms/comms.js.md#s-hailPeer) _js/comms/comms.js_ · [`onPeerMessage`](../comms/comms.js.md#s-onPeerMessage) _js/comms/comms.js_ · [`stationCall`](../comms/comms.js.md#s-stationCall) _js/comms/comms.js_ · [`stationCtx.pay`](../comms/comms.js.md#s-stationCtx-pay) _js/comms/comms.js_ · [`stationCtx.provoke`](../comms/comms.js.md#s-stationCtx-provoke) _js/comms/comms.js_ · [`stationCtx.request`](../comms/comms.js.md#s-stationCtx-request) _js/comms/comms.js_ · [`stationCtx.truce`](../comms/comms.js.md#s-stationCtx-truce) _js/comms/comms.js_ · [`stepBattles`](../comms/comms.js.md#s-stepBattles) _js/comms/comms.js_ ×2 · [`stepChatter`](../comms/comms.js.md#s-stepChatter) _js/comms/comms.js_ · [`stepNews`](../comms/comms.js.md#s-stepNews) _js/comms/comms.js_ · [`withTalk>provider`](../comms/comms.js.md#s-withTalk-provider) _js/comms/comms.js_ · [`foundCompany`](../corp/company.js.md#s-foundCompany) _js/corp/company.js_ · [`payOffAndRecord`](../corp/company.js.md#s-payOffAndRecord) _js/corp/company.js_ · [`settleAsStaff`](../corp/company.js.md#s-settleAsStaff) _js/corp/company.js_ · [`commissionHull`](../corp/fleet.js.md#s-commissionHull) _js/corp/fleet.js_ · [`decommissionHull`](../corp/fleet.js.md#s-decommissionHull) _js/corp/fleet.js_ · [`tickFleet`](../corp/fleet.js.md#s-tickFleet) _js/corp/fleet.js_ · [`recruit`](../crew/captive.js.md#s-recruit) _js/crew/captive.js_ · [`tryEscape`](../crew/captive.js.md#s-tryEscape) _js/crew/captive.js_ · [`raise`](../crew/children.js.md#s-raise) _js/crew/children.js_ · [`crewTopics.run~4`](../crew/family.js.md#s-crewTopics-run-4) _js/crew/family.js_ · [`tickHousehold`](../crew/family.js.md#s-tickHousehold) _js/crew/family.js_ ×3 · [`tickThreads`](../crew/talk-threads.js.md#s-tickThreads) _js/crew/talk-threads.js_ · [`applyFx`](../crew/talk.js.md#s-applyFx) _js/crew/talk.js_ · [`destroy`](../drones/ops.js.md#s-destroy) _js/drones/ops.js_ · [`orderBuild`](../drones/ops.js.md#s-orderBuild) _js/drones/ops.js_ · [`acceptContract`](../economy/contracts.js.md#s-acceptContract) _js/economy/contracts.js_ · [`settle`](../economy/contracts.js.md#s-settle) _js/economy/contracts.js_ ×4 · [`cycleIceworkMode`](../economy/icework.js.md#s-cycleIceworkMode) _js/economy/icework.js_ · [`stepIcework`](../economy/icework.js.md#s-stepIcework) _js/economy/icework.js_ · [`apMine`](../flight/autopilot.js.md#s-apMine) _js/flight/autopilot.js_ · [`beginUnstick`](../flight/autopilot.js.md#s-beginUnstick) _js/flight/autopilot.js_ · [`engageAutopilot`](../flight/autopilot.js.md#s-engageAutopilot) _js/flight/autopilot.js_ · [`engageJobLoop`](../flight/autopilot.js.md#s-engageJobLoop) _js/flight/autopilot.js_ · [`engageMiningLoop`](../flight/autopilot.js.md#s-engageMiningLoop) _js/flight/autopilot.js_ · [`launchProbe`](../flight/probes.js.md#s-launchProbe) _js/flight/probes.js_ · [`remoteScan`](../flight/probes.js.md#s-remoteScan) _js/flight/probes.js_ · [`stepProbes`](../flight/probes.js.md#s-stepProbes) _js/flight/probes.js_ · [`tickPatchDrone`](../flight/repair.js.md#s-tickPatchDrone) _js/flight/repair.js_ · [`yardRepair`](../flight/repair.js.md#s-yardRepair) _js/flight/repair.js_ · [`note`](../interior/boarding.js.md#s-note) _js/interior/boarding.js_ · [`openInterior`](../interior/interior.js.md#s-openInterior) _js/interior/interior.js_ · [`EXEC.DOCK`](../mission/run.js.md#s-EXEC-DOCK) _js/mission/run.js_ · [`EXEC.GOTO`](../mission/run.js.md#s-EXEC-GOTO) _js/mission/run.js_ · [`advance`](../mission/run.js.md#s-advance) _js/mission/run.js_ · [`answerAsk`](../mission/run.js.md#s-answerAsk) _js/mission/run.js_ · [`fail`](../mission/run.js.md#s-fail) _js/mission/run.js_ · [`stopMission`](../mission/run.js.md#s-stopMission) _js/mission/run.js_ · [`makeTradeOps.DELIVER`](../mission/tradeops.js.md#s-makeTradeOps-DELIVER) _js/mission/tradeops.js_ · [`makeTradeOps.SELL`](../mission/tradeops.js.md#s-makeTradeOps-SELL) _js/mission/tradeops.js_ ×2 · [`makeTradeOps>pickRoute`](../mission/tradeops.js.md#s-makeTradeOps-pickRoute) _js/mission/tradeops.js_ · [`applySolPrime`](../net/worldsync.js.md#s-applySolPrime) _js/net/worldsync.js_ · [`pull`](../net/worldsync.js.md#s-pull) _js/net/worldsync.js_ · [`setHost`](../net/worldsync.js.md#s-setHost) _js/net/worldsync.js_ ×2 · [`note`](../npc/bounty.js.md#s-note) _js/npc/bounty.js_ · [`note`](../npc/captain.js.md#s-note) _js/npc/captain.js_ · [`event`](../npc/npccrew.js.md#s-event) _js/npc/npccrew.js_ · [`_holeCtx.log`](#s-_holeCtx-log) · [`abortSpool`](#s-abortSpool) · [`addBodyWaypoint`](#s-addBodyWaypoint) · [`addWaypoint`](#s-addWaypoint) · [`applySkyEvent`](#s-applySkyEvent) ×2 · [`claimPort`](#s-claimPort) · [`collapseToHole`](#s-collapseToHole) · [`collectBeacon`](#s-collectBeacon) · [`cycleMiningMode`](#s-cycleMiningMode) · [`cycleTurretMode`](#s-cycleTurretMode) · [`finishDock`](#s-finishDock) · [`fragmentRogue`](#s-fragmentRogue) · [`goSupernova`](#s-goSupernova) · [`holeLoseStation`](#s-holeLoseStation) · [`holeOnShip`](#s-holeOnShip) · [`holeRakeStation`](#s-holeRakeStation) · [`holeRescue`](#s-holeRescue) · [`impact`](#s-impact) · [`jettison`](#s-jettison) · [`laneCredit`](#s-laneCredit) · [`loadSky`](#s-loadSky) · [`log`](#s-log) · [`loseHull`](#s-loseHull) · [`moveShed`](#s-moveShed) · [`onImpact`](#s-onImpact) ×4 · [`onKill`](#s-onKill) ×7 · [`onRogueCollision`](#s-onRogueCollision) · [`onShipHit`](#s-onShipHit) · [`resetTune`](#s-resetTune) · [`sensorPulse`](#s-sensorPulse) · [`setMiningMode`](#s-setMiningMode) · [`setNavTarget`](#s-setNavTarget) · [`setRelation`](#s-setRelation) · [`setTurretMode`](#s-setTurretMode) · [`shatterBody`](#s-shatterBody) · [`smeltAll`](#s-smeltAll) · [`stashDeposit`](#s-stashDeposit) · [`stashWithdraw`](#s-stashWithdraw) · [`stepCareer`](#s-stepCareer) ×2 · [`stepCataclysms`](#s-stepCataclysms) · [`stepContract`](#s-stepContract) ×2 · [`stepLaneDiscipline`](#s-stepLaneDiscipline) · [`stepLock`](#s-stepLock) · [`stepMarket`](#s-stepMarket) · [`stepTractorTick`](#s-stepTractorTick) ×2 · [`stepWarp`](#s-stepWarp) ×2 · [`summonHole`](#s-summonHole) · [`takeSalvageContract`](#s-takeSalvageContract) · [`toggleDock`](#s-toggleDock) ×6 · [`toggleSystem`](#s-toggleSystem) · [`toggleWarp`](#s-toggleWarp) ×2 · [`tradeBuy`](#s-tradeBuy) · [`tradeSell`](#s-tradeSell) · [`tryAssay`](#s-tryAssay) ×2 · [`tryScan`](#s-tryScan) ×2 · [`warpDropout`](#s-warpDropout) · [`wireMiningHooks`](#s-wireMiningHooks) · [`wireReactiveSky`](#s-wireReactiveSky) ×7 · [`TOPICS.run~4`](../station/staffline.js.md#s-TOPICS-run-4) _js/station/staffline.js_ · [`tickLine`](../station/staffline.js.md#s-tickLine) _js/station/staffline.js_ · [`note`](../station/stationlife.js.md#s-note) _js/station/stationlife.js_ · [`sellFromHold`](../ui/holdview.js.md#s-sellFromHold) _js/ui/holdview.js_ · [`advance`](../ui/tutorial.js.md#s-advance) _js/ui/tutorial.js_ · [`finish`](../ui/tutorial.js.md#s-finish) _js/ui/tutorial.js_ · [`startCoreTutorial`](../ui/tutorial.js.md#s-startCoreTutorial) _js/ui/tutorial.js_ · [`startTutorial`](../ui/tutorial.js.md#s-startTutorial) _js/ui/tutorial.js_ · [`cycleAtmoMode`](../world/events/atmoworks.js.md#s-cycleAtmoMode) _js/world/events/atmoworks.js_ · [`stepAtmoWorks`](../world/events/atmoworks.js.md#s-stepAtmoWorks) _js/world/events/atmoworks.js_ ×2

<!-- note:logEvent -->
Ring-buffer flight log, read back in the terminal.
<!-- /note -->

### <a id="s-relationOf"></a>`relationOf(id)`

function · **exported** · L250–252

- called by: [`cycleRelation`](#s-cycleRelation)

<!-- note:relationOf -->
<!-- /note -->

### <a id="s-RELATIONS"></a>`RELATIONS`

const · **exported** · L254–254

<!-- note:RELATIONS -->
<!-- /note -->

### <a id="s-setRelation"></a>`setRelation(id, rel)`

function · **exported** · L256–261

- calls: [`logEvent`](#s-logEvent)
- via [js/flight/turrets.js](../flight/turrets.js.md): `contacts.find`
- called by: [`mountContacts>bulk`](../console/panels/nav.js.md#s-mountContacts-bulk) _js/console/panels/nav.js_ · [`cycleRelation`](#s-cycleRelation)

<!-- note:setRelation -->
<!-- /note -->

### <a id="s-cycleRelation"></a>`cycleRelation(id)`

function · **exported** · L263–268

- calls: [`relationOf`](#s-relationOf) · [`setRelation`](#s-setRelation)
- called by: [`mountContacts`](../console/panels/nav.js.md#s-mountContacts) _js/console/panels/nav.js_

<!-- note:cycleRelation -->
<!-- /note -->

### <a id="s-wpSeq"></a>`wpSeq`

const · L270–270

<!-- note:wpSeq -->
---- waypoints ----------------------------------------------------------
<!-- /note -->

### <a id="s-addWaypoint"></a>`addWaypoint(name)`

function · **exported** · L272–284

- calls: [`logEvent`](#s-logEvent)
- called by: [`mountMarks`](../console/panels/nav.js.md#s-mountMarks) _js/console/panels/nav.js_ · [`addAnchoredWaypoint`](#s-addAnchoredWaypoint) · [`addWaypointAt`](#s-addWaypointAt)

<!-- note:addWaypoint -->
<!-- /note -->

### <a id="s-addWaypointAt"></a>`addWaypointAt(name, x, y, z)`

function · **exported** · L286–290

- calls: [`addWaypoint`](#s-addWaypoint)
- called by: [`markPlace`](../aria/nav.js.md#s-markPlace) _js/aria/nav.js_ · [`stepBattles.effect`](../comms/comms.js.md#s-stepBattles-effect) _js/comms/comms.js_ · [`ROLE_STEP.relay.run`](../drones/ops.js.md#s-ROLE_STEP-relay-run) _js/drones/ops.js_ · [`destroy.run`](../drones/ops.js.md#s-destroy-run) _js/drones/ops.js_ · [`markTarget`](../economy/contracts.js.md#s-markTarget) _js/economy/contracts.js_ · [`stepProbes`](../flight/probes.js.md#s-stepProbes) _js/flight/probes.js_ · [`markAt`](../mission/run.js.md#s-markAt) _js/mission/run.js_ · [`mountMap.run~6`](../ui/map.js.md#s-mountMap-run-6) _js/ui/map.js_ · [`mountMap>nodeFor`](../ui/map.js.md#s-mountMap-nodeFor) _js/ui/map.js_ · [`STEPS.action~2.run`](../ui/tutorial.js.md#s-STEPS-action-2-run) _js/ui/tutorial.js_

<!-- note:addWaypointAt -->
Waypoint at a fixed point with a name — ports, impact sites, anything.
<!-- /note -->

### <a id="s-addBodyWaypoint"></a>`addBodyWaypoint(id)`

function · **exported** · L292–301

- calls: [`logEvent`](#s-logEvent) · [`bodyById`](../world/bodies.js.md#s-bodyById) _js/world/bodies.js_ · [`bodyPosition`](../world/bodies.js.md#s-bodyPosition) _js/world/bodies.js_
- called by: [`stepNews.run`](../comms/comms.js.md#s-stepNews-run) _js/comms/comms.js_ · [`mountTargets`](../console/panels/nav.js.md#s-mountTargets) _js/console/panels/nav.js_ · [`mountMap`](../ui/map.js.md#s-mountMap) _js/ui/map.js_ · [`mountMap.run~6`](../ui/map.js.md#s-mountMap-run-6) _js/ui/map.js_ · [`STEPS.action.run`](../ui/tutorial.js.md#s-STEPS-action-run) _js/ui/tutorial.js_

<!-- note:addBodyWaypoint -->
<!-- /note -->

### <a id="s-removeWaypoint"></a>`removeWaypoint(id)`

function · **exported** · L303–307

- called by: [`mountMarks>rebuild`](../console/panels/nav.js.md#s-mountMarks-rebuild) _js/console/panels/nav.js_ · [`markTarget`](../economy/contracts.js.md#s-markTarget) _js/economy/contracts.js_ · [`settle`](../economy/contracts.js.md#s-settle) _js/economy/contracts.js_ · [`cleanupStep`](../mission/run.js.md#s-cleanupStep) _js/mission/run.js_ · [`stepWarp`](#s-stepWarp) · [`mountMap`](../ui/map.js.md#s-mountMap) _js/ui/map.js_ ×2 · [`mountMap.run~7`](../ui/map.js.md#s-mountMap-run-7) _js/ui/map.js_

<!-- note:removeWaypoint -->
<!-- /note -->

### <a id="s-setActiveWaypoint"></a>`setActiveWaypoint(id)`

function · **exported** · L309–311

- called by: [`mountMarks>rebuild`](../console/panels/nav.js.md#s-mountMarks-rebuild) _js/console/panels/nav.js_

<!-- note:setActiveWaypoint -->
<!-- /note -->

### <a id="s-addAnchoredWaypoint"></a>`addAnchoredWaypoint(name, anchor, fallback=, {…}=)`

function · **exported** · L313–326

- calls: [`addWaypoint`](#s-addWaypoint) · [`markLost`](#s-markLost) · [`resolveAnchor`](../world/anchors.js.md#s-resolveAnchor) _js/world/anchors.js_
- called by: [`stepMarkets.effect`](../comms/comms.js.md#s-stepMarkets-effect) _js/comms/comms.js_ · [`stepMarkets.effect~2`](../comms/comms.js.md#s-stepMarkets-effect-2) _js/comms/comms.js_ · [`mountGnn`](../console/panels/corp.js.md#s-mountGnn) _js/console/panels/corp.js_ · [`mountRoutes`](../console/panels/market.js.md#s-mountRoutes) _js/console/panels/market.js_ · [`droneCard`](../console/panels/work-drones.js.md#s-droneCard) _js/console/panels/work-drones.js_ · [`ROLE_STEP.surveyor`](../drones/ops.js.md#s-ROLE_STEP-surveyor) _js/drones/ops.js_ · [`markTarget`](../economy/contracts.js.md#s-markTarget) _js/economy/contracts.js_ · [`markAt`](../mission/run.js.md#s-markAt) _js/mission/run.js_ · [`mountMap`](../ui/map.js.md#s-mountMap) _js/ui/map.js_ · [`mountMap.run~6`](../ui/map.js.md#s-mountMap-run-6) _js/ui/map.js_ · [`CORE_STEPS.action.run`](../ui/tutorial-core.js.md#s-CORE_STEPS-action-run) _js/ui/tutorial-core.js_

<!-- note:addAnchoredWaypoint -->
0.3.67 — a mark pinned to a THING (js/world/anchors.js): a rock, a port, a hull, a
drone, a job's seam. Where it is is asked of the thing every read; `fallback`
is where it was when marked. Returns the waypoint (same shape as ever).

- L314 · `const had = sim.waypoints.find((w) => w.anchor && !w.lost && w.anchor.kind === anchor.kind` — the same thing marked twice is one mark: it is made active and renamed, not doubled
<!-- /note -->

### <a id="s-markLost"></a>`markLost(wp)`

function · L328–332

- called by: [`addAnchoredWaypoint`](#s-addAnchoredWaypoint) · [`waypointPosition`](#s-waypointPosition)

<!-- note:markLost -->
A mark whose thing is gone keeps where it last was, and says so, once.
<!-- /note -->

### <a id="s-_ap"></a>`_ap`

const · L333–333

<!-- note:_ap -->
<!-- /note -->

### <a id="s-waypointPosition"></a>`waypointPosition(wp, out)`

function · **exported** · L335–358

- calls: [`markLost`](#s-markLost) · [`resolveAnchor`](../world/anchors.js.md#s-resolveAnchor) _js/world/anchors.js_ · [`bodyPosition`](../world/bodies.js.md#s-bodyPosition) _js/world/bodies.js_
- called by: [`mountMarks`](../console/panels/nav.js.md#s-mountMarks) _js/console/panels/nav.js_ · [`guardSlots`](../drones/ops.js.md#s-guardSlots) _js/drones/ops.js_ · [`patrolOptions`](../drones/ops.js.md#s-patrolOptions) _js/drones/ops.js_ · [`posOf`](../drones/ops.js.md#s-posOf) _js/drones/ops.js_ · [`siteOptions`](../drones/ops.js.md#s-siteOptions) _js/drones/ops.js_ · [`mountGame>tick`](../render/engine.js.md#s-mountGame-tick) _js/render/engine.js_ · [`publishHud`](#s-publishHud) · [`targetPosition`](#s-targetPosition) · [`warpNodeById.pos~3`](#s-warpNodeById-pos-3) · [`mountMap`](../ui/map.js.md#s-mountMap) _js/ui/map.js_ ×3 · [`mountMap>drawSheet`](../ui/map.js.md#s-mountMap-drawSheet) _js/ui/map.js_ · [`mountMap>hitAt`](../ui/map.js.md#s-mountMap-hitAt) _js/ui/map.js_

<!-- note:waypointPosition -->
Live position of a waypoint — body-locked marks track their world, anchored marks their thing.

- L339 · `if (wp._at !== sim.time) {` — one resolve per sky time per mark: the HUD, chart, engine and autopilot all read it
- L344 · `if (was !== wp.anchor.key) { wp.vx = 0; wp.vy = 0; wp.vz = 0; }` — the seam's mark moved to its next rock: a hop, not a speed
- L347 · `if (Math.hypot(wp.vx, wp.vy, wp.vz) > 6000) { wp.vx = 0; wp.vy = 0; wp.vz = 0; }` — the mark moved to the next rock of a seam, or a hull respawned: a hop, not a speed
<!-- /note -->

### <a id="s-waypointVelocity"></a>`waypointVelocity(wp, out)`

function · **exported** · L360–366

- calls: [`bodyVelocity`](../world/bodies.js.md#s-bodyVelocity) _js/world/bodies.js_
- called by: [`targetVelocity`](#s-targetVelocity) · [`warpNodeById.vel~3`](#s-warpNodeById-vel-3)

<!-- note:waypointVelocity -->
How a waypoint is moving (u/s): its world's, its thing's (measured), or still.
<!-- /note -->

### <a id="s-put"></a>`put(out, q)`

function · L368–368

- called by: [`@file`](#) ×8

<!-- note:put -->
---- what a mark can be pinned to (the kinds sim.js can see; contracts.js,
drones/ops.js register theirs) ----------------------------------------------
<!-- /note -->

### <a id="s-st"></a>`st`

const · L371–371

- calls: [`stationById`](../station/stations.js.md#s-stationById) _js/station/stations.js_

<!-- note:st -->
<!-- /note -->

### <a id="s-r"></a>`r`

const · L376–376

- calls: [`rockByKey`](../world/field.js.md#s-rockByKey) _js/world/field.js_

<!-- note:r -->
<!-- /note -->

### <a id="s-r-2"></a>`r~2`

const · L378–378

- calls: [`siteMarkRock`](../world/field.js.md#s-siteMarkRock) _js/world/field.js_

<!-- note:r~2 -->
<!-- /note -->

### <a id="s-n"></a>`n`

const · L383–383

- calls: [`vesselById`](../npc/traffic.js.md#s-vesselById) _js/npc/traffic.js_

<!-- note:n -->
<!-- /note -->

### <a id="s-n-2"></a>`n~2`

const · L384–384

- via [js/npc/flow.js](../npc/flow.js.md): `flow.find`

<!-- note:n~2 -->
<!-- /note -->

### <a id="s-n-3"></a>`n~3`

const · L385–385

- via [js/npc/rogues.js](../npc/rogues.js.md): `nests.find`

<!-- note:n~3 -->
<!-- /note -->

### <a id="s-d"></a>`d`

const · L386–386

- via [js/world/bodies.js](../world/bodies.js.md): `BEACONS.find`

<!-- note:d -->
<!-- /note -->

### <a id="s-m"></a>`m`

const · L387–387

- via [js/world/events/impactors.js](../world/events/impactors.js.md): `impactors.find`

<!-- note:m -->
<!-- /note -->

### <a id="s-c"></a>`c`

const · L388–388

- via [js/world/debris.js](../world/debris.js.md): `chunks.find`

<!-- note:c -->
<!-- /note -->

### <a id="s-activeWaypoint"></a>`activeWaypoint()`

function · **exported** · L390–392

- called by: [`mountGame>tick`](../render/engine.js.md#s-mountGame-tick) _js/render/engine.js_ · [`publishHud`](#s-publishHud)

<!-- note:activeWaypoint -->
<!-- /note -->

### <a id="s-SMELT_FEE"></a>`SMELT_FEE`

const · **exported** · L394–394

<!-- note:SMELT_FEE -->
---- cargo --------------------------------------------------------------

---- the stash and the smelter --------------------------------------------
A docked hull can leave its hold at the port (a locker per port, kept in the
save with the sky) and, at an industrial port, run ore through the works:
the refine table's own ratios, for a cut of the value. Both exist so the
autopilot's mining loop has somewhere to put ore other than the market.
<!-- /note -->

### <a id="s-SMELT_SECTORS"></a>`SMELT_SECTORS`

const · **exported** · L395–395

<!-- note:SMELT_SECTORS -->
<!-- /note -->

### <a id="s-stashOf"></a>`stashOf(stId)`

function · L397–400

- called by: [`consume`](#s-consume) · [`deliver`](#s-deliver) · [`stashDeposit`](#s-stashDeposit) · [`stashWithdraw`](#s-stashWithdraw)

<!-- note:stashOf -->
<!-- /note -->

### <a id="s-stashAt"></a>`stashAt(stId)`

function · **exported** · L402–405

- calls: [`goodName`](../economy/materials.js.md#s-goodName) _js/economy/materials.js_
- called by: [`marketBlock`](../console/panels/market.js.md#s-marketBlock) _js/console/panels/market.js_

<!-- note:stashAt -->
Everything in the port's locker: [{ id, name, qty }].
<!-- /note -->

### <a id="s-stashDeposit"></a>`stashDeposit(id=, qty=)`

function · **exported** · L407–420

- calls: [`takeCargo`](../flight/ship.js.md#s-takeCargo) _js/flight/ship.js_ · [`logEvent`](#s-logEvent) · [`stashOf`](#s-stashOf) · [`stationById`](../station/stations.js.md#s-stationById) _js/station/stations.js_
- called by: [`marketBlock`](../console/panels/market.js.md#s-marketBlock) _js/console/panels/market.js_ · [`EXEC.STASH`](../mission/run.js.md#s-EXEC-STASH) _js/mission/run.js_

<!-- note:stashDeposit -->
Leave cargo at the port you are clamped to. "all" empties the hold.
<!-- /note -->

### <a id="s-stashWithdraw"></a>`stashWithdraw(id=, qty=)`

function · **exported** · L422–436

- calls: [`addCargo`](../flight/ship.js.md#s-addCargo) _js/flight/ship.js_ · [`holdRoom`](../flight/ship.js.md#s-holdRoom) _js/flight/ship.js_ · [`logEvent`](#s-logEvent) · [`stashOf`](#s-stashOf) · [`stationById`](../station/stations.js.md#s-stationById) _js/station/stations.js_
- called by: [`marketBlock`](../console/panels/market.js.md#s-marketBlock) _js/console/panels/market.js_

<!-- note:stashWithdraw -->
Take cargo back from the locker into the hold (what fits).
<!-- /note -->

### <a id="s-now"></a>`now()`

prop · L439–439

<!-- note:now -->
<!-- /note -->

### <a id="s-skySeed"></a>`skySeed()`

prop · L440–440

<!-- note:skySeed -->
<!-- /note -->

### <a id="s-callsign"></a>`callsign()`

prop · L441–441

<!-- note:callsign -->
<!-- /note -->

### <a id="s-stockAt"></a>`stockAt(stId, by)`

prop · L443–449

<!-- note:stockAt -->
<!-- /note -->

### <a id="s-consume"></a>`consume(stId, by, use)`

prop · L451–459

- calls: [`takeCargo`](../flight/ship.js.md#s-takeCargo) _js/flight/ship.js_ · [`stashOf`](#s-stashOf)

<!-- note:consume -->
- L455 · `const ashore = Math.min(locker[k] ?? 0, left);` — the locker first: what is already ashore should go in before the hold
  is emptied, or a pilot loses cargo they were carrying for a reason
<!-- /note -->

### <a id="s-deliver"></a>`deliver(stId, by, id, qty)`

prop · L461–464

- calls: [`stashOf`](#s-stashOf)

<!-- note:deliver -->
<!-- /note -->

### <a id="s-pay"></a>`pay(by, cr, why)`

prop · L466–472

- calls: [`treasuryPay`](../corp/company.js.md#s-treasuryPay) _js/corp/company.js_

<!-- note:pay -->
<!-- /note -->

### <a id="s-log"></a>`log(text)`

prop · L474–474

- calls: [`post`](../comms/chat.js.md#s-post) _js/comms/chat.js_ · [`logEvent`](#s-logEvent)

<!-- note:log -->
<!-- /note -->

### <a id="s-wireMiningHooks"></a>`wireMiningHooks()`

function · L477–485

- calls: [`logEvent`](#s-logEvent) · [`setMiningMode`](#s-setMiningMode)
- called by: [`launchSim`](#s-launchSim)

<!-- note:wireMiningHooks -->
The cutter stows itself on a full hold (js/flight/turrets.js fires this once per
fill). Before 0.3.11 it kept burning bus power into a beam that landed
nothing, which on a halved gather rate is a long time to be wasting.

Hung at LAUNCH, not at module top level: sim.js and turrets.js are a cycle,
so `miningHooks` is still in its temporal dead zone while this file's body
runs and touching it there throws before the game ever starts.
<!-- /note -->

### <a id="s-canSmeltAt"></a>`canSmeltAt(st)`

function · **exported** · L487–489

- called by: [`marketBlock`](../console/panels/market.js.md#s-marketBlock) _js/console/panels/market.js_ ×2 · [`bestPortFor`](../flight/autopilot.js.md#s-bestPortFor) _js/flight/autopilot.js_ · [`EXEC.SMELT`](../mission/run.js.md#s-EXEC-SMELT) _js/mission/run.js_ · [`smeltAll`](#s-smeltAll)

<!-- note:canSmeltAt -->
<!-- /note -->

### <a id="s-smeltAll"></a>`smeltAll()`

function · **exported** · L491–518

- calls: [`baseValue`](../economy/materials.js.md#s-baseValue) _js/economy/materials.js_ · [`goodName`](../economy/materials.js.md#s-goodName) _js/economy/materials.js_ · [`fx`](../economy/upgrades.js.md#s-fx) _js/economy/upgrades.js_ · [`work`](../flight/pilot.js.md#s-work) _js/flight/pilot.js_ · [`addCargo`](../flight/ship.js.md#s-addCargo) _js/flight/ship.js_ · [`takeCargo`](../flight/ship.js.md#s-takeCargo) _js/flight/ship.js_ · [`canSmeltAt`](#s-canSmeltAt) · [`logEvent`](#s-logEvent) · [`stationById`](../station/stations.js.md#s-stationById) _js/station/stations.js_
- called by: [`marketBlock`](../console/panels/market.js.md#s-marketBlock) _js/console/panels/market.js_ · [`EXEC.SMELT`](../mission/run.js.md#s-EXEC-SMELT) _js/mission/run.js_

<!-- note:smeltAll -->
Run every ore in the hold through the port's works. Returns null or why not.
<!-- /note -->

### <a id="s-sellAllOre"></a>`sellAllOre()`

function · **exported** · L520–539

- calls: [`notePlayerChoice`](../aria/aria.js.md#s-notePlayerChoice) _js/aria/aria.js_ · [`owedCargo`](../economy/contracts.js.md#s-owedCargo) _js/economy/contracts.js_ · [`good`](../economy/materials.js.md#s-good) _js/economy/materials.js_ · [`tradeSell`](#s-tradeSell) · [`stationById`](../station/stations.js.md#s-stationById) _js/station/stations.js_
- called by: [`marketBlock`](../console/panels/market.js.md#s-marketBlock) _js/console/panels/market.js_ · [`makeTradeOps.SELL`](../mission/tradeops.js.md#s-makeTradeOps-SELL) _js/mission/tradeops.js_

<!-- note:sellAllOre -->
Sell every ore and mineral aboard at the port's bid. Returns credits earned.

- L526 · `const owed = owedCargo();` — 0.3.72: ore a delivery job is waiting on stays aboard (contracts.js owedCargo)
- L537 · `if (sold > 0 && !sim.handsOff) notePlayerChoice("port", st.id, Math.min(3, 0.5 + sold / 12` — this is a labelled example: of every desk in reach you chose this one, and
  the size of the load is how much of a choice it was (js/aria/aria.js)
<!-- /note -->

### <a id="s-jettison"></a>`jettison(id, amount)`

function · **exported** · L541–544

- calls: [`goodName`](../economy/materials.js.md#s-goodName) _js/economy/materials.js_ · [`takeCargo`](../flight/ship.js.md#s-takeCargo) _js/flight/ship.js_ · [`logEvent`](#s-logEvent)
- called by: [`mountHold>drawManifest`](../console/panels/market.js.md#s-mountHold-drawManifest) _js/console/panels/market.js_ ×2 · [`dropFromHold`](../ui/holdview.js.md#s-dropFromHold) _js/ui/holdview.js_

<!-- note:jettison -->
<!-- /note -->

### <a id="s-stationStatus"></a>`stationStatus()`

function · **exported** · L546–563

- calls: [`describeStation`](../station/stations.js.md#s-describeStation) _js/station/stations.js_ · [`dockCheck`](../station/stations.js.md#s-dockCheck) _js/station/stations.js_ · [`nearestStation`](../station/stations.js.md#s-nearestStation) _js/station/stations.js_ · [`worksReport`](../station/stationworks.js.md#s-worksReport) _js/station/stationworks.js_
- called by: [`mountPort`](../console/panels/market.js.md#s-mountPort) _js/console/panels/market.js_ · [`mountAutopilot`](../console/panels/nav.js.md#s-mountAutopilot) _js/console/panels/nav.js_ · [`mountTrim`](../console/panels/ship.js.md#s-mountTrim) _js/console/panels/ship.js_ · [`apDock`](../flight/autopilot.js.md#s-apDock) _js/flight/autopilot.js_ · [`execute`](../npc/captain.js.md#s-execute) _js/npc/captain.js_ · [`claimPort`](#s-claimPort) · [`publishHud`](#s-publishHud) · [`toggleDock`](#s-toggleDock)

<!-- note:stationStatus -->
---- ports --------------------------------------------------------------
<!-- /note -->

### <a id="s-setNoticeAbout"></a>`setNoticeAbout(text, name)`

function · **exported** · L565–568

- called by: [`engageAutopilot`](../flight/autopilot.js.md#s-engageAutopilot) _js/flight/autopilot.js_ · [`engageJobLoop`](../flight/autopilot.js.md#s-engageJobLoop) _js/flight/autopilot.js_ · [`engageMiningLoop`](../flight/autopilot.js.md#s-engageMiningLoop) _js/flight/autopilot.js_ · [`claimPort`](#s-claimPort) · [`finishDock`](#s-finishDock) · [`selectBody`](#s-selectBody) · [`stepTractorTick`](#s-stepTractorTick) ×2 · [`stepWarp`](#s-stepWarp) ×2 · [`toggleDock`](#s-toggleDock) ×13 · [`tryAssay`](#s-tryAssay) ×2

<!-- note:setNoticeAbout -->
Pin a name over the message card so "Undocked." reads as the port, not the planet behind it.
<!-- /note -->

### <a id="s-fmtKm"></a>`fmtKm(u)`

function · L570–570

- called by: [`toggleDock`](#s-toggleDock)

<!-- note:fmtKm -->
<!-- /note -->

### <a id="s-toggleDock"></a>`toggleDock({…}=)`

function · **exported** · L572–665

- calls: [`disengageAutopilot`](../flight/autopilot.js.md#s-disengageAutopilot) _js/flight/autopilot.js_ · [`engageAutopilot`](../flight/autopilot.js.md#s-engageAutopilot) _js/flight/autopilot.js_ · [`finishDock`](#s-finishDock) · [`fmtKm`](#s-fmtKm) · [`logEvent`](#s-logEvent) ×6 · [`setNoticeAbout`](#s-setNoticeAbout) ×13 · [`stationStatus`](#s-stationStatus) · [`handlingLeft`](../station/dockwork.js.md#s-handlingLeft) _js/station/dockwork.js_ · [`handlingLine`](../station/dockwork.js.md#s-handlingLine) _js/station/dockwork.js_ ×2 · [`stationById`](../station/stations.js.md#s-stationById) _js/station/stations.js_ ×3 · [`clearDockRequest`](../station/stationworks.js.md#s-clearDockRequest) _js/station/stationworks.js_ · [`engagePush`](../station/stationworks.js.md#s-engagePush) _js/station/stationworks.js_ · [`engageTractor`](../station/stationworks.js.md#s-engageTractor) _js/station/stationworks.js_ · [`inDeparture`](../station/stationworks.js.md#s-inDeparture) _js/station/stationworks.js_ · [`releaseTractor`](../station/stationworks.js.md#s-releaseTractor) _js/station/stationworks.js_ · [`requestDock`](../station/stationworks.js.md#s-requestDock) _js/station/stationworks.js_ ×4
- via [js/audio/index.js](../audio/index.js.md): `SHIP.tractor`, `UI.commit`, `WARN.caution`, `WARN.deny`
- called by: [`stationCtx.undock`](../comms/comms.js.md#s-stationCtx-undock) _js/comms/comms.js_ · [`mountPort`](../console/panels/market.js.md#s-mountPort) _js/console/panels/market.js_ · [`apDock`](../flight/autopilot.js.md#s-apDock) _js/flight/autopilot.js_ · [`ensureUndocked`](../mission/run.js.md#s-ensureUndocked) _js/mission/run.js_ · [`execute`](../npc/captain.js.md#s-execute) _js/npc/captain.js_ · [`tickSim`](#s-tickSim) · [`mountStationDeck`](../station/stationdeck.js.md#s-mountStationDeck) _js/station/stationdeck.js_ · [`mountHud`](../ui/hud.js.md#s-mountHud) _js/ui/hud.js_

<!-- note:toggleDock -->
0.3.75: `queue` — the deck's UNDOCK while the crane is still working. The
refusal was a notice on the HUD, which the station deck covers, so the button
simply did nothing (a haul loads on accept, and a big one is minutes of
crane). Now the press is held: the clamps come off by themselves the moment
the last pallet is aboard, and a second press cancels it.

- L577 · `` setNoticeAbout(`${st?.name ?? "Port"} control: departure in progress — ${Math.ceil(tractor `` — a departure is not yours to wave off: control keeps the helm until you are clear of the exit lane
- L581 · `releaseTractor();` — waving port control off mid-pull: the lock drops and you keep what drift you had
- L587 · `const wait = handlingLeft(ship.dockedAt);` — 0.3.25: the clamps do not come off while the crane is still working.
  Everything that undocks — the deck button, the autopilot, the mission
  executor — comes through here, so this one refusal is the whole rule.
- L608 · `if (st && engagePush(st, ship, sim.dockHangar ?? 0)) {` — port control pushes you out: through the mouth, up the exit ways and clear of the lane before it lets go
- L621 · `if (s.station.hangars?.length && !(s.station.hostile && !s.station.claimed)) {` — too far or too fast for the lock: file the berth and hand the helm to port control — the
  approach autopilot flies the (unmarked) entry lane at the tractor's speed limit and the
  tractor takes the hull at the mouth. DOCK again on the way in waves it off.
- L628 · `requestDock(s.station, sim.time);` — a mining or warp leg already flying itself in only needs the berth filed
- L628 · `requestDock(s.station, sim.time);` — fresh off the push: no lock from the exit lane — file the berth and come back round by the entry lane
<!-- /note -->

### <a id="s-finishDock"></a>`finishDock(st, info=)`

function · L667–681

- calls: [`work`](../flight/pilot.js.md#s-work) _js/flight/pilot.js_ · [`laneCredit`](#s-laneCredit) · [`logEvent`](#s-logEvent) · [`setNoticeAbout`](#s-setNoticeAbout) · [`describeStation`](../station/stations.js.md#s-describeStation) _js/station/stations.js_ · [`clearDockRequest`](../station/stationworks.js.md#s-clearDockRequest) _js/station/stationworks.js_
- via [js/audio/index.js](../audio/index.js.md): `SHIP.docked`
- called by: [`stepTractorTick`](#s-stepTractorTick) · [`toggleDock`](#s-toggleDock)

<!-- note:finishDock -->
The clamps take the hull: the same landing whether the tractor brought you or you were already alongside.
<!-- /note -->

### <a id="s-stepTractorTick"></a>`stepTractorTick(d)`

function · L683–709

- calls: [`finishDock`](#s-finishDock) · [`logEvent`](#s-logEvent) ×2 · [`setNoticeAbout`](#s-setNoticeAbout) ×2 · [`nearestStation`](../station/stations.js.md#s-nearestStation) _js/station/stations.js_ · [`stationById`](../station/stations.js.md#s-stationById) _js/station/stations.js_ · [`autoTractor`](../station/stationworks.js.md#s-autoTractor) _js/station/stationworks.js_ · [`holdOff`](../station/stationworks.js.md#s-holdOff) _js/station/stationworks.js_ · [`stepTractor`](../station/stationworks.js.md#s-stepTractor) _js/station/stationworks.js_ · [`unrequestedApproach`](../station/stationworks.js.md#s-unrequestedApproach) _js/station/stationworks.js_
- via [js/audio/index.js](../audio/index.js.md): `SHIP.tractor`
- called by: [`tickSim`](#s-tickSim) ×2

<!-- note:stepTractorTick -->
Tractor and tractor capture: runs after the ship has moved for the tick.

- L708 · `sim.approach = unrequestedApproach(ship, sim.time);` — on the lane or in the mouth with no berth asked for: the puck rings, the tractor stays off
<!-- /note -->

### <a id="s-tradeBuy"></a>`tradeBuy(id, qty)`

function · **exported** · L711–731

- calls: [`adjustStanding`](../corp/corps.js.md#s-adjustStanding) _js/corp/corps.js_ · [`corpOfStation`](../corp/corps.js.md#s-corpOfStation) _js/corp/corps.js_ · [`goodName`](../economy/materials.js.md#s-goodName) _js/economy/materials.js_ · [`work`](../flight/pilot.js.md#s-work) _js/flight/pilot.js_ · [`addCargo`](../flight/ship.js.md#s-addCargo) _js/flight/ship.js_ · [`roomFor`](../flight/ship.js.md#s-roomFor) _js/flight/ship.js_ ×2 · [`buyPriceAt`](#s-buyPriceAt) · [`logEvent`](#s-logEvent) · [`bookHandling`](../station/dockwork.js.md#s-bookHandling) _js/station/dockwork.js_ · [`stationById`](../station/stations.js.md#s-stationById) _js/station/stations.js_
- called by: [`marketBlock`](../console/panels/market.js.md#s-marketBlock) _js/console/panels/market.js_ ×2 · [`makeTradeOps.BUY`](../mission/tradeops.js.md#s-makeTradeOps-BUY) _js/mission/tradeops.js_

<!-- note:tradeBuy -->
- L717 · `const want = Math.min(qty, line.qty, Math.floor(roomFor(ship, id)));` — 0.3.52: what fits of THIS good
<!-- /note -->

### <a id="s-sellPriceAt"></a>`sellPriceAt(st, id, qty=)`

function · **exported** · L733–735

- calls: [`corpOfStation`](../corp/corps.js.md#s-corpOfStation) _js/corp/corps.js_ · [`standingMargin`](../corp/corps.js.md#s-standingMargin) _js/corp/corps.js_ · [`lotMult`](../economy/economy.js.md#s-lotMult) _js/economy/economy.js_ · [`priceAt`](../economy/materials.js.md#s-priceAt) _js/economy/materials.js_ · [`marketMult`](#s-marketMult)
- called by: [`unpostedWork`](../aria/senses.js.md#s-unpostedWork) _js/aria/senses.js_ · [`marketBlock`](../console/panels/market.js.md#s-marketBlock) _js/console/panels/market.js_ · [`bestBuyer`](../economy/contracts.js.md#s-bestBuyer) _js/economy/contracts.js_ · [`tradeRoutes`](../economy/traderoutes.js.md#s-tradeRoutes) _js/economy/traderoutes.js_ ×4 · [`bestPortFor`](../flight/autopilot.js.md#s-bestPortFor) _js/flight/autopilot.js_ · [`holdValueAt`](../npc/captain.js.md#s-holdValueAt) _js/npc/captain.js_ · [`tradeSell`](#s-tradeSell) · [`holdSlots`](../ui/holdview.js.md#s-holdSlots) _js/ui/holdview.js_

<!-- note:sellPriceAt -->
What this port actually pays for a good — sector price through the owner's
margin. `qty` prices the whole consignment: a lot walks the port's stock
curve down as it lands (economy.js lotMult), so the hundred-and-sixtieth
girder does not fetch bare-shelf money. Left at 1 it is the marginal price,
which is what a shelf label and a valuation want.
<!-- /note -->

### <a id="s-marketMult"></a>`marketMult(st, id)`

function · **exported** · L737–749

- called by: [`sellPriceAt`](#s-sellPriceAt)

<!-- note:marketMult -->
Event pricing: a drought makes thirsty sectors pay tanker rates for water.

- L741 · `if (id === "water_ice") return 1 + (d.mult - 1) * 0.55;` — raw snow rides the same panic, discounted
<!-- /note -->

### <a id="s-applySkyEvent"></a>`applySkyEvent(ev, local)`

function · L751–790

- calls: [`eventLine`](../npc/traffic.js.md#s-eventLine) _js/npc/traffic.js_ · [`logEvent`](#s-logEvent) ×2
- via [js/station/stations.js](../station/stations.js.md): `stations.filter`, `stations.some`
- called by: [`applyReliable`](#s-applyReliable) · [`stepMarket`](#s-stepMarket)

<!-- note:applySkyEvent -->
Shared sky bulletin. Same seed + same world-time slot = same event on
every client in the room. A peer can also push the payload over the
relay; applySkyEvent is idempotent per slot.

- L764 · `if (ev.kind === "drought" && !stations.some((st) => (ev.sectors ?? ["agricultural", "civil` — a drought needs somebody thirsty: no agricultural or civilian port, no bulletin — the desk never names a ghost
<!-- /note -->

### <a id="s-marketSlot"></a>`marketSlot`

const · L792–792

<!-- note:marketSlot -->
<!-- /note -->

### <a id="s-marketSeed"></a>`marketSeed`

const · L792–792

<!-- note:marketSeed -->
<!-- /note -->

### <a id="s-stepMarket"></a>`stepMarket(_d)`

function · L793–805

- calls: [`eventAt`](../npc/traffic.js.md#s-eventAt) _js/npc/traffic.js_ · [`applySkyEvent`](#s-applySkyEvent) · [`logEvent`](#s-logEvent)
- called by: [`stepCareer`](#s-stepCareer)

<!-- note:stepMarket -->
<!-- /note -->

### <a id="s-buyPriceAt"></a>`buyPriceAt(st, line, qty=)`

function · **exported** · L807–809

- calls: [`askPrice`](../economy/economy.js.md#s-askPrice) _js/economy/economy.js_
- called by: [`unpostedWork`](../aria/senses.js.md#s-unpostedWork) _js/aria/senses.js_ · [`marketBlock`](../console/panels/market.js.md#s-marketBlock) _js/console/panels/market.js_ · [`tradeRoutes`](../economy/traderoutes.js.md#s-tradeRoutes) _js/economy/traderoutes.js_ ×4 · [`tradeBuy`](#s-tradeBuy)

<!-- note:buyPriceAt -->
What this port charges you for a stocked line — the list price through your own margin.

- L808 · `return Math.max(1, Math.round(askPrice(st, line.id, qty) * (sim.ship.mods?.buy ?? 1)));` — the list price rides the port's stock (economy.js): bare shelves charge more,
  a glut less — and clearing a shelf walks it up as you clear it (0.3.24)
<!-- /note -->

### <a id="s-portLedger"></a>`portLedger(st)`

function · **exported** · L811–811

- calls: [`econReport`](../economy/economy.js.md#s-econReport) _js/economy/economy.js_
- called by: [`marketBlock`](../console/panels/market.js.md#s-marketBlock) _js/console/panels/market.js_

<!-- note:portLedger -->
The port's ledger for the deck: lines, shortages, gluts, stock against target.
<!-- /note -->

### <a id="s-portWants"></a>`portWants(st, n=)`

function · **exported** · L812–812

- calls: [`wantsOf`](../economy/economy.js.md#s-wantsOf) _js/economy/economy.js_
- called by: [`stationCtx.wants`](../comms/comms.js.md#s-stationCtx-wants) _js/comms/comms.js_ · [`portWants`](../console/panels/market.js.md#s-portWants) _js/console/panels/market.js_

<!-- note:portWants -->
<!-- /note -->

### <a id="s-tradeSell"></a>`tradeSell(id, qty)`

function · **exported** · L814–836

- calls: [`bookRevenue`](../corp/company.js.md#s-bookRevenue) _js/corp/company.js_ · [`adjustStanding`](../corp/corps.js.md#s-adjustStanding) _js/corp/corps.js_ · [`corpOfStation`](../corp/corps.js.md#s-corpOfStation) _js/corp/corps.js_ · [`good`](../economy/materials.js.md#s-good) _js/economy/materials.js_ ×2 · [`goodName`](../economy/materials.js.md#s-goodName) _js/economy/materials.js_ ×2 · [`priceAt`](../economy/materials.js.md#s-priceAt) _js/economy/materials.js_ · [`work`](../flight/pilot.js.md#s-work) _js/flight/pilot.js_ ×2 · [`takeCargo`](../flight/ship.js.md#s-takeCargo) _js/flight/ship.js_ · [`logEvent`](#s-logEvent) · [`sellPriceAt`](#s-sellPriceAt) · [`bookHandling`](../station/dockwork.js.md#s-bookHandling) _js/station/dockwork.js_ · [`stationById`](../station/stations.js.md#s-stationById) _js/station/stations.js_
- called by: [`marketBlock`](../console/panels/market.js.md#s-marketBlock) _js/console/panels/market.js_ ×2 · [`makeTradeOps.SELL`](../mission/tradeops.js.md#s-makeTradeOps-SELL) _js/mission/tradeops.js_ ×3 · [`sellAllOre`](#s-sellAllOre) · [`sellFromHold`](../ui/holdview.js.md#s-sellFromHold) _js/ui/holdview.js_

<!-- note:tradeSell -->
- L818 · `const want = Math.min(qty, ship.hold[id] ?? 0);` — priced as one consignment, on the curve it is about to move (0.3.24)
<!-- /note -->

### <a id="s-claimPort"></a>`claimPort()`

function · **exported** · L838–852

- calls: [`work`](../flight/pilot.js.md#s-work) _js/flight/pilot.js_ ×2 · [`logEvent`](#s-logEvent) · [`setNoticeAbout`](#s-setNoticeAbout) · [`stationStatus`](#s-stationStatus)
- via [js/flight/turrets.js](../flight/turrets.js.md): `contacts.filter`
- called by: [`mountPort`](../console/panels/market.js.md#s-mountPort) _js/console/panels/market.js_ · [`mountHud`](../ui/hud.js.md#s-mountHud) _js/ui/hud.js_

<!-- note:claimPort -->
Claim a free port once its guns are quiet.
<!-- /note -->

### <a id="s-setTerminal"></a>`setTerminal(open)`

function · **exported** · L854–858

- via [js/core/store.js](../core/store.js.md): `useGameStore.getState`, `useGameStore.getState.patchHud`
- called by: [`closeConsole`](../console/console.js.md#s-closeConsole) _js/console/console.js_ · [`openConsole`](../console/console.js.md#s-openConsole) _js/console/console.js_ · [`tickSim`](#s-tickSim)

<!-- note:setTerminal -->
---- terminal -----------------------------------------------------------
<!-- /note -->

### <a id="s-setTermHold"></a>`setTermHold(on)`

function · **exported** · L860–863

- via [js/core/store.js](../core/store.js.md): `useGameStore.getState`, `useGameStore.getState.patchHud`
- called by: [`mountConsole`](../console/console.js.md#s-mountConsole) _js/console/console.js_

<!-- note:setTermHold -->
<!-- /note -->

### <a id="s-resetTune"></a>`resetTune()`

function · **exported** · L865–870

- calls: [`applyRaceTune`](../flight/pilot.js.md#s-applyRaceTune) _js/flight/pilot.js_ · [`defaultTune`](../flight/ship.js.md#s-defaultTune) _js/flight/ship.js_ · [`logEvent`](#s-logEvent)
- called by: [`mountTrim`](../console/panels/ship.js.md#s-mountTrim) _js/console/panels/ship.js_

<!-- note:resetTune -->
- L868 · `applyRaceTune(sim.ship);` — factory trim still carries the race's multipliers
<!-- /note -->

### <a id="s-setTune"></a>`setTune(key, value)`

function · **exported** · L872–877

- calls: [`setThrottle`](#s-setThrottle)
- called by: [`mountPower`](../console/panels/ship.js.md#s-mountPower) _js/console/panels/ship.js_ · [`mountTrim`](../console/panels/ship.js.md#s-mountTrim) _js/console/panels/ship.js_

<!-- note:setTune -->
<!-- /note -->

### <a id="s-moveShed"></a>`moveShed(key, dir)`

function · **exported** · L879–886

- calls: [`logEvent`](#s-logEvent)
- called by: [`mountPower>drawShed`](../console/panels/ship.js.md#s-mountPower-drawShed) _js/console/panels/ship.js_ ×2

<!-- note:moveShed -->
<!-- /note -->

### <a id="s-hydrateProgress"></a>`hydrateProgress()`

function · **exported** · L888–892

- via [js/core/store.js](../core/store.js.md): `useGameStore.getState`

<!-- note:hydrateProgress -->
<!-- /note -->

### <a id="s-loadSky"></a>`loadSky(seed)`

function · **exported** · L894–950

- calls: [`resetPerf`](../core/perf.js.md#s-resetPerf) _js/core/perf.js_ · [`buildCorps`](../corp/corps.js.md#s-buildCorps) _js/corp/corps.js_ · [`resetSecLevel`](../corp/seclevel.js.md#s-resetSecLevel) _js/corp/seclevel.js_ · [`resetBoard`](../drones/board.js.md#s-resetBoard) _js/drones/board.js_ · [`populateNpcDrones`](../drones/npcdrones.js.md#s-populateNpcDrones) _js/drones/npcdrones.js_ · [`work`](../flight/pilot.js.md#s-work) _js/flight/pilot.js_ · [`resetCombat`](../flight/turrets.js.md#s-resetCombat) _js/flight/turrets.js_ · [`resetBattles`](../npc/battles.js.md#s-resetBattles) _js/npc/battles.js_ · [`mountNpcCombat`](../npc/combat.js.md#s-mountNpcCombat) _js/npc/combat.js_ · [`resetNpcCombat`](../npc/combat.js.md#s-resetNpcCombat) _js/npc/combat.js_ · [`populateFlow`](../npc/flow.js.md#s-populateFlow) _js/npc/flow.js_ · [`mountRogues`](../npc/rogues.js.md#s-mountRogues) _js/npc/rogues.js_ · [`populateNests`](../npc/rogues.js.md#s-populateNests) _js/npc/rogues.js_ · [`assignGuards`](../npc/security.js.md#s-assignGuards) _js/npc/security.js_ · [`mountSecurity`](../npc/security.js.md#s-mountSecurity) _js/npc/security.js_ · [`resetSecurity`](../npc/security.js.md#s-resetSecurity) _js/npc/security.js_ · [`populateTraffic`](../npc/traffic.js.md#s-populateTraffic) _js/npc/traffic.js_ · [`logEvent`](#s-logEvent) · [`wireReactiveSky`](#s-wireReactiveSky) · [`buildStations`](../station/stations.js.md#s-buildStations) _js/station/stations.js_ · [`resetStations`](../station/stations.js.md#s-resetStations) _js/station/stations.js_ · [`stepStations`](../station/stations.js.md#s-stepStations) _js/station/stations.js_ · [`carryBuilt`](../station/stationyard.js.md#s-carryBuilt) _js/station/stationyard.js_ · [`dropCarried`](../station/stationyard.js.md#s-dropCarried) _js/station/stationyard.js_ · [`applySystem`](../world/bodies.js.md#s-applySystem) _js/world/bodies.js_ · [`surveyIds`](../world/bodies.js.md#s-surveyIds) _js/world/bodies.js_ · [`bindDebris`](../world/debris.js.md#s-bindDebris) _js/world/debris.js_ · [`resetDebris`](../world/debris.js.md#s-resetDebris) _js/world/debris.js_ · [`resetHoles`](../world/events/holes.js.md#s-resetHoles) _js/world/events/holes.js_ · [`resetImpactors`](../world/events/impactors.js.md#s-resetImpactors) _js/world/events/impactors.js_ · [`resetImpacts`](../world/events/impacts.js.md#s-resetImpacts) _js/world/events/impacts.js_ · [`resetField`](../world/field.js.md#s-resetField) _js/world/field.js_ · [`generateSystem`](../world/generate.js.md#s-generateSystem) _js/world/generate.js_ · [`rngFromSeed`](../world/generate.js.md#s-rngFromSeed) _js/world/generate.js_ ×3
- via [js/core/store.js](../core/store.js.md): `useGameStore.getState`, `useGameStore.getState.patchHud`
- called by: [`launchSim`](#s-launchSim) · [`mountHud>queueSky`](../ui/hud.js.md#s-mountHud-queueSky) _js/ui/hud.js_

<!-- note:loadSky -->
- L895 · `if (sim.skySeed === seed && stations.length) carryBuilt(stations);` — 0.3.61 — the same sky again (the menu grew it as a backdrop; FLY AS or a
  launch grows it for real): the ports are the same hulls, so hold them
- L909 · `sim.events.length = 0;` — a new sky starts quiet: no live events, no lit horizon
- L920 · `if (pilot.restored) {` — 0.3.42 — standing is the pilot's, per sky: the corps are regrown from the
  seed on every load, and until now that put every one of them back to the
  tier default — a season of favours gone on reload. The record carries a
  table per sky; a returning pilot gets theirs back here, before anything
  reads it.
- L926 · `resetPerf();` — Before anything is POPULATED, not after. How many hulls and how many
  shuttles a sky carries is a decision taken once and lived with; letting it
  be taken from a frame-time measurement left over from a different sky
  means a system built while the last one was struggling stays permanently
  thin, even on a device that is now idle. Reset first, build at a known
  tier, and let the budget do what it is actually for — trimming per-frame
  detail — once the sky is running.
- L929 · `board.clock = () => sim.time;` — the corporations' own drone lines, on the same work board as yours
- L933 · `resetSecurity();` — the reactive sky: who answers a call, who is hunting whom, and what is
  building drones out in the cold. Directors are installed in the order
  they get to claim a hull — security first (a picket on a call flies the
  call), then combat (anything with a fight on flies the fight), then the
  rogues (a drone with nothing in front of it presses on to its objective).
<!-- /note -->

### <a id="s-wireReactiveSky"></a>`wireReactiveSky()`

function · L952–1060

- calls: [`gnnPost`](../comms/gnn.js.md#s-gnnPost) _js/comms/gnn.js_ ×3 · [`adjustStanding`](../corp/corps.js.md#s-adjustStanding) _js/corp/corps.js_ ×2 · [`corpById`](../corp/corps.js.md#s-corpById) _js/corp/corps.js_ · [`corpOfVessel`](../corp/corps.js.md#s-corpOfVessel) _js/corp/corps.js_ · [`noteHonestHit`](../corp/seclevel.js.md#s-noteHonestHit) _js/corp/seclevel.js_ · [`noteShot`](../corp/seclevel.js.md#s-noteShot) _js/corp/seclevel.js_ · [`wingArrived`](../corp/seclevel.js.md#s-wingArrived) _js/corp/seclevel.js_ · [`hullMaxOf`](../flight/repair.js.md#s-hullMaxOf) _js/flight/repair.js_ · [`fireRound`](../flight/turrets.js.md#s-fireRound) _js/flight/turrets.js_ · [`damageHull`](../npc/combat.js.md#s-damageHull) _js/npc/combat.js_ · [`callForHelp`](../npc/security.js.md#s-callForHelp) _js/npc/security.js_ · [`etaOf`](../npc/security.js.md#s-etaOf) _js/npc/security.js_ ×2 · [`securityCorp`](../npc/security.js.md#s-securityCorp) _js/npc/security.js_ ×2 · [`vesselById`](../npc/traffic.js.md#s-vesselById) _js/npc/traffic.js_ ×3 · [`logEvent`](#s-logEvent) ×7 · [`wireReactiveSky>fam`](#s-wireReactiveSky-fam) ×3 · [`spawnBodyId`](../world/generate.js.md#s-spawnBodyId) _js/world/generate.js_
- via [js/flight/turrets.js](../flight/turrets.js.md): `contacts.filter`
- via [js/station/stations.js](../station/stations.js.md): `stations.find`, `stations.some`
- via [js/npc/traffic.js](../npc/traffic.js.md): `HOSTILE_ROLES.has`, `LAW_ROLES.has`
- called by: [`loadSky`](#s-loadSky)

<!-- note:wireReactiveSky -->
---- the reactive sky's own bookkeeping ---------------------------------

Everything below is the part of the new NPC behaviour that has to reach the
player: the toasts, the log lines, the standing moves, and the one number
that changes how a fight feels — the response clock. A player deciding
whether to press an attack on a supply hull is deciding against that timer,
so it has to be honest and it has to be visible.

- L953 · `combatHooks.onHit = (c, damage, owner, time) => {` — every round that lands on anything, from anyone
- L957 · `n.hp = c.hp;` — the contact already took the damage; this mirrors it back onto the hull
  and lets the hull react to having been shot at
- L968 · `combatHooksOut.onDown = (n, byId, t) => {` — somebody lost a hull out there, and it was not the player's doing
- L978 · `const co = corpOfVessel(n);` — an honest hull was lost. The port it was carrying for notices.
- L987 · `econHooks.labour = labourAt;` — 0.3.52: company hands on shift make their port's lines run faster
- L988 · `crewHooks.port = () => sim.ship?.dockedAt ?? null;` — 0.3.54: where a paid-off hand now lives
- L990 · `securityHooks.selfVictim = selfVictim;` — 0.3.48: the security ◆ — the player's own SOS, and what a fight costs you
- L994 · `securityHooks.onCall = (call) => {` — the clock the player is deciding against
- L1009 · `if (call.sos) {` — 0.3.56: your own SOS — the wing checks whether what was on you is still at it
- L1010 · `const pay = wingArrived(call, sim.time, sim.ship);` — toasts the bounty itself when there is one
- L1018 · `rockHooks.spare = (b) => {` — 0.3.60: a rogue is never AIMED at a settled world — one with a port in its
  family's wells — or at the world this sky spawns you by
- L1024 · `npcDroneHooks.hostiles = () => contacts.filter((c) => c.relation === "hostile" && c.hp > 0` — 0.3.59: a port's guard drones fire at hostiles on the board; its repair drones patch you
- L1031 · `if (sim.time - (ship.lastHitAt ?? -1e9) < DRONE_LINE.quietFor) return null;` — not mid-fight
- L1034 · `if (co && (co.standing ?? 0) < -10) return null;` — a port that does not like you does not fix you
- L1038 · `combatHooks.onFire = (c, t) => noteShot(c, t, sim.lock?.id ?? null);` — 0.3.56: your turrets fired — self-defence, or a fight you picked?
- L1040 · `worksHooks.onBatteryHit = (n, amount, st, time) => {` — a port's batteries, fighting something the player cannot see. Damage goes
  through the same path a round would take, so a raider driven off a port on
  the far side of the system carries that damage into its next fight.
- L1045 · `rogueHooks.onLaunch = (wave, nest) => {` — the rogues
- L1046 · `if (!nest.known) return;` — you cannot be told about a nest nobody has found
<!-- /note -->

#### <a id="s-wireReactiveSky-fam"></a>`wireReactiveSky>fam(id)`

function · L1019–1019

- via [js/world/bodies.js](../world/bodies.js.md): `BODIES.find`
- called by: [`wireReactiveSky`](#s-wireReactiveSky) ×3

<!-- note:wireReactiveSky>fam -->
<!-- /note -->

#### <a id="s-wireReactiveSky-heal"></a>`wireReactiveSky.heal(a)`

prop · L1036–1036

<!-- note:wireReactiveSky.heal -->
<!-- /note -->

### <a id="s-seedOrbit"></a>`seedOrbit(ship, body, time)`

function · L1062–1080

- calls: [`clamp`](#s-clamp) · [`bodyPosition`](../world/bodies.js.md#s-bodyPosition) _js/world/bodies.js_ · [`bodyVelocity`](../world/bodies.js.md#s-bodyVelocity) _js/world/bodies.js_
- called by: [`launchSim`](#s-launchSim)

<!-- note:seedOrbit -->
Station-keeping hold, nose-on to the home world. You open your eyes with
the planet filling a quarter of the canopy and its gravity already working
on you — the fastest way to learn what these worlds weigh.

- L1068 · `bodyVelocity(body.id, time, ship.vel);` — Match the world's own orbital motion, or it simply leaves without you.
<!-- /note -->

### <a id="s-launchSim"></a>`launchSim(callsign, seed)`

function · **exported** · L1082–1205

- calls: [`resetChat`](../comms/chat.js.md#s-resetChat) _js/comms/chat.js_ · [`resetGnn`](../comms/gnn.js.md#s-resetGnn) _js/comms/gnn.js_ · [`loadSave`](../core/store.js.md#s-loadSave) _js/core/store.js_ · [`skyProgress`](../core/store.js.md#s-skyProgress) _js/core/store.js_ · [`loadCompany`](../corp/company.js.md#s-loadCompany) _js/corp/company.js_ · [`adjustStanding`](../corp/corps.js.md#s-adjustStanding) _js/corp/corps.js_ · [`resetFleet`](../corp/fleet.js.md#s-resetFleet) _js/corp/fleet.js_ · [`resetHousehold`](../crew/family.js.md#s-resetHousehold) _js/crew/family.js_ · [`resetCrew`](../crew/ledger.js.md#s-resetCrew) _js/crew/ledger.js_ · [`loadRobots`](../crew/robots.js.md#s-loadRobots) _js/crew/robots.js_ · [`loadDroneOps`](../drones/ops.js.md#s-loadDroneOps) _js/drones/ops.js_ · [`resetContracts`](../economy/contracts.js.md#s-resetContracts) _js/economy/contracts.js_ · [`loadFab`](../economy/fabricate.js.md#s-loadFab) _js/economy/fabricate.js_ · [`resetFab`](../economy/fabricate.js.md#s-resetFab) _js/economy/fabricate.js_ · [`resetIcework`](../economy/icework.js.md#s-resetIcework) _js/economy/icework.js_ · [`insure`](../economy/insurance.js.md#s-insure) _js/economy/insurance.js_ · [`resetInsurance`](../economy/insurance.js.md#s-resetInsurance) _js/economy/insurance.js_ · [`loadUpgrades`](../economy/upgrades.js.md#s-loadUpgrades) _js/economy/upgrades.js_ · [`disengageAutopilot`](../flight/autopilot.js.md#s-disengageAutopilot) _js/flight/autopilot.js_ · [`resetContacts`](../flight/contacts.js.md#s-resetContacts) _js/flight/contacts.js_ · [`applyRaceToShip`](../flight/pilot.js.md#s-applyRaceToShip) _js/flight/pilot.js_ · [`resetProbes`](../flight/probes.js.md#s-resetProbes) _js/flight/probes.js_ · [`makeShip`](../flight/ship.js.md#s-makeShip) _js/flight/ship.js_ · [`resetBoarding`](../interior/boarding.js.md#s-resetBoarding) _js/interior/boarding.js_ · [`retakeCommand`](../npc/captain.js.md#s-retakeCommand) _js/npc/captain.js_ · [`shipById`](../ships/shipdb.js.md#s-shipById) _js/ships/shipdb.js_ · [`applyCareerDefaults`](#s-applyCareerDefaults) · [`currentShipId`](#s-currentShipId) · [`loadSky`](#s-loadSky) · [`resetTelemetry`](#s-resetTelemetry) · [`savePilotRecord`](#s-savePilotRecord) · [`seedOrbit`](#s-seedOrbit) · [`syncHullDefence`](#s-syncHullDefence) · [`wireMiningHooks`](#s-wireMiningHooks) · [`clearDockRequest`](../station/stationworks.js.md#s-clearDockRequest) _js/station/stationworks.js_ · [`releaseTractor`](../station/stationworks.js.md#s-releaseTractor) _js/station/stationworks.js_ · [`bodyById`](../world/bodies.js.md#s-bodyById) _js/world/bodies.js_ · [`hashHue`](../world/bodies.js.md#s-hashHue) _js/world/bodies.js_ · [`surveyIds`](../world/bodies.js.md#s-surveyIds) _js/world/bodies.js_ · [`applyTerraformSnapshot`](../world/events/atmoworks.js.md#s-applyTerraformSnapshot) _js/world/events/atmoworks.js_ · [`resetAtmoWorks`](../world/events/atmoworks.js.md#s-resetAtmoWorks) _js/world/events/atmoworks.js_ · [`terraformSnapshot`](../world/events/atmoworks.js.md#s-terraformSnapshot) _js/world/events/atmoworks.js_ · [`setImpactorAuthority`](../world/events/impactors.js.md#s-setImpactorAuthority) _js/world/events/impactors.js_ · [`spawnBodyId`](../world/generate.js.md#s-spawnBodyId) _js/world/generate.js_
- via [js/core/store.js](../core/store.js.md): `useGameStore.getState`, `useGameStore.getState.patchHud`, `useGameStore.getState.persist`, `useGameStore.getState.setPhase`
- called by: [`mountHud>go`](../ui/hud.js.md#s-mountHud-go) _js/ui/hud.js_

<!-- note:launchSim -->
- L1093 · `sim.waypoints = [];` — nothing from the last sky may point at this one: generated ids repeat
- L1104 · `if (pilot.corpId && !pilot.restored) adjustStanding(pilot.corpId, 25, "signed on");` — signing on is a fresh pilot's event — a returning one (0.3.42) signed on
  the day they were made, and does not collect the standing again each launch
- L1107 · `resetInsurance();` — policies are written against hulls, and these are new hulls
- L1109 · `const rec = pilot.record ?? null;` — the hulls the pilot bought, and the cover written on them, come back
  with the pilot — they were swept with everything else until 0.3.42
- L1114 · `syncHullDefence(ship, currentShipId());` — set the pools before anything can read them: syncHullTune refreshes these
  every tick, but a launch must not leave `resists` null for a frame
- L1124 · `releaseTractor();` — station ids restart at st1: a pull or a request held over would answer to the wrong port
- L1134 · `sim.pulseUntil = -1e6;` — sky time restarts: nothing keyed to the old clock may still be running
- L1147 · `loadRobots();` — robots and refit upgrades are property: keyed by sky and callsign, so they load once both are set
- L1163 · `chat.clock = () => sim.time;` — the chat bus and GNN run on sky time; your drones come back where you left them
- L1168 · `resetFab();` — jobs on a port's line belong to the sky, like the drones do: come back to
  this sky and the parts are waiting where you left them on the line
- L1174 · `const purse = loadSave().credits;` — 0.3.41 — the wallet comes back. Until now `ship.credits` was whatever
  makeShip() and the race bonus issued, every launch: a session's earnings
  were gone on reload while the corp treasury beside them survived, and
  the account page (0.3.40) made that visible. A saved purse replaces the
  starting one — after the race bonus, which is a fresh pilot's and must
  not be paid again each morning.
- L1179 · `applyTerraformSnapshot(sim.pendingTerraform?.snap, sim.pendingTerraform?.bonds);` — the sky keeps what the atmo works earned
- L1199 · `terraform: terraformSnapshot(),` — 0.3.40: the launch persist below used to write `terraform: {}` for this
  sky (the store had none yet) and the atmo works' progress was gone until
  the next scan or beacon wrote it back — two reloads in a row lost it.
<!-- /note -->

### <a id="s-applyCareerDefaults"></a>`applyCareerDefaults(ship)`

function · **exported** · L1207–1213

- called by: [`launchSim`](#s-launchSim)

<!-- note:applyCareerDefaults -->
The hull comes up ready for the trade it was issued for: a miner's cutter
is armed, a salvager's tractor is live, a security hand's guns are warm.
<!-- /note -->

### <a id="s-TELEMETRY_KEEP"></a>`TELEMETRY_KEEP`

const · L1215–1215

<!-- note:TELEMETRY_KEEP -->
One row of the passive record every three sky-seconds; two hours' worth kept.
<!-- /note -->

### <a id="s-sampleTelemetry"></a>`sampleTelemetry()`

function · L1216–1227

- calls: [`cargoTotal`](../flight/ship.js.md#s-cargoTotal) _js/flight/ship.js_ · [`speedOf`](../flight/ship.js.md#s-speedOf) _js/flight/ship.js_ · [`sampleTelemetry>push`](#s-sampleTelemetry-push) ×6
- called by: [`tickSim`](#s-tickSim)

<!-- note:sampleTelemetry -->
<!-- /note -->

#### <a id="s-sampleTelemetry-push"></a>`sampleTelemetry>push(k, v)`

function · L1220–1220

- called by: [`sampleTelemetry`](#s-sampleTelemetry) ×6

<!-- note:sampleTelemetry>push -->
<!-- /note -->

### <a id="s-resetTelemetry"></a>`resetTelemetry()`

function · **exported** · L1229–1231

- called by: [`launchSim`](#s-launchSim)

<!-- note:resetTelemetry -->
<!-- /note -->

### <a id="s-returnToMenu"></a>`returnToMenu()`

function · **exported** · L1233–1250

- calls: [`resetFlow`](../npc/flow.js.md#s-resetFlow) _js/npc/flow.js_ · [`resetTraffic`](../npc/traffic.js.md#s-resetTraffic) _js/npc/traffic.js_ · [`clearDockRequest`](../station/stationworks.js.md#s-clearDockRequest) _js/station/stationworks.js_ · [`releaseTractor`](../station/stationworks.js.md#s-releaseTractor) _js/station/stationworks.js_
- via [js/core/store.js](../core/store.js.md): `useGameStore.getState`, `useGameStore.getState.patchHud`, `useGameStore.getState.setPhase`
- called by: [`mountHud`](../ui/hud.js.md#s-mountHud) _js/ui/hud.js_

<!-- note:returnToMenu -->
- L1236 · `releaseTractor();` — nothing keyed to this sky's ports may follow you out
<!-- /note -->

### <a id="s-currentShipId"></a>`currentShipId()`

function · **exported** · L1252–1255

- calls: [`shipById`](../ships/shipdb.js.md#s-shipById) _js/ships/shipdb.js_
- called by: [`senseHull`](../aria/senses.js.md#s-senseHull) _js/aria/senses.js_ · [`currentPlan`](../crew/roster.js.md#s-currentPlan) _js/crew/roster.js_ · [`hullFit`](../economy/contracts.js.md#s-hullFit) _js/economy/contracts.js_ · [`iceworkFit`](../economy/icework.js.md#s-iceworkFit) _js/economy/icework.js_ · [`hullTier`](../economy/upgrades.js.md#s-hullTier) _js/economy/upgrades.js_ · [`ensurePlan`](../interior/interior.js.md#s-ensurePlan) _js/interior/interior.js_ · [`mountGame`](../render/engine.js.md#s-mountGame) _js/render/engine.js_ · [`mountGame>refreshOwnHull`](../render/engine.js.md#s-mountGame-refreshOwnHull) _js/render/engine.js_ · [`broadcastShip`](#s-broadcastShip) · [`crewCapacity`](#s-crewCapacity) · [`launchSim`](#s-launchSim) · [`loseHull`](#s-loseHull) ×2 · [`stepCareer`](#s-stepCareer) ×2 · [`syncHullTune`](#s-syncHullTune) · [`build`](../station/refityard.js.md#s-build) _js/station/refityard.js_ · [`PANELS.shipyard`](../station/stationdeck.js.md#s-PANELS-shipyard) _js/station/stationdeck.js_ · [`PANELS.shipyard>render`](../station/stationdeck.js.md#s-PANELS-shipyard-render) _js/station/stationdeck.js_ · [`atmoFit`](../world/events/atmoworks.js.md#s-atmoFit) _js/world/events/atmoworks.js_

<!-- note:currentShipId -->
The hull the pilot's complex has issued them at their current rank.

- L1253 · `if (sim.activeHullId && shipById(sim.activeHullId)) return sim.activeHullId;` — a bought hull
- L1254 · `return DEFAULT_SHIP_ID;` — the trainer everyone starts in
<!-- /note -->

### <a id="s-issuedHullId"></a>`issuedHullId()`

function · **exported** · L1257–1263

- calls: [`rankStatus`](../flight/pilot.js.md#s-rankStatus) _js/flight/pilot.js_ · [`issuedShips`](../ships/shipdb.js.md#s-issuedShips) _js/ships/shipdb.js_
- called by: [`PANELS.shipyard`](../station/stationdeck.js.md#s-PANELS-shipyard) _js/station/stationdeck.js_ ×2

<!-- note:issuedHullId -->
The hull the complex would sign over at the pilot's rank — for sale at the issue rate, not handed out.

- L1261 · `} catch {` — pre-creation
<!-- /note -->

### <a id="s-_hullTune"></a>`_hullTune`

const · L1265–1265

- calls: [`hullTuneFor`](../ships/shipdb.js.md#s-hullTuneFor) _js/ships/shipdb.js_

<!-- note:_hullTune -->
Flight multipliers from the active hull, refreshed when it changes.
<!-- /note -->

### <a id="s-syncHullTune"></a>`syncHullTune(ship)`

function · L1266–1275

- calls: [`hullTuneFor`](../ships/shipdb.js.md#s-hullTuneFor) _js/ships/shipdb.js_ · [`shipById`](../ships/shipdb.js.md#s-shipById) _js/ships/shipdb.js_ · [`currentShipId`](#s-currentShipId) · [`syncHullDefence`](#s-syncHullDefence)
- called by: [`stepShip`](#s-stepShip)

<!-- note:syncHullTune -->
- L1268 · `if (_hullTune.id !== id || ship.hullTune !== _hullTune) {` — a fresh makeShip() on a relaunch with the same hull id has no tune yet
- L1271 · `ship.mods = null;` — force syncMods to recompute the hold with the new hull factor
<!-- /note -->

### <a id="s-_defenceFor"></a>`_defenceFor`

const · L1277–1277

<!-- note:_defenceFor -->
WHAT THIS HULL CAN TAKE (0.3.34).

`hullMaxOf()` read `ship.hullMax ?? 100` and nothing in the game ever set
it, so every hull from a nine-tonne trainer to a seven-thousand-tonne
World Frame had the same hundred points and the same hundred of screen.
Tier bought thrust, cargo and reactor, and no survivability whatsoever.

The pools are set from the flown hull here, beside the flight tune, because
this is already the one place that notices the hull changed. A hull refit
that raises the pool heals into the new headroom rather than leaving the
bar reading 300/920 the moment you sign for it; one that lowers it trims
the current value down so nothing sits over its own maximum.
<!-- /note -->

### <a id="s-syncHullDefence"></a>`syncHullDefence(ship, id)`

function · L1278–1294

- calls: [`resistKey`](../economy/upgrades.js.md#s-resistKey) _js/economy/upgrades.js_ · [`upgradeResists`](../economy/upgrades.js.md#s-upgradeResists) _js/economy/upgrades.js_ · [`hullPoolFor`](../flight/defence.js.md#s-hullPoolFor) _js/flight/defence.js_ · [`resistsFor`](../flight/defence.js.md#s-resistsFor) _js/flight/defence.js_ · [`shieldPoolFor`](../flight/defence.js.md#s-shieldPoolFor) _js/flight/defence.js_ · [`shipById`](../ships/shipdb.js.md#s-shipById) _js/ships/shipdb.js_
- called by: [`launchSim`](#s-launchSim) · [`syncHullTune`](#s-syncHullTune)

<!-- note:syncHullDefence -->
- L1290 · `ship.resists = resistsFor(def, { ...(ship.mods ?? {}), resist: upgradeResists() });` — fitted resists are summed separately from the multiplicative mods bag —
  see upgradeResists() for why they cannot live in it
<!-- /note -->

### <a id="s-WRONG_WAY_GRACE"></a>`WRONG_WAY_GRACE`

const · L1296–1296

<!-- note:WRONG_WAY_GRACE -->
---- lane discipline ------------------------------------------------------
Ports read your position against their lanes. In a lane-way you get the
way and the range to the clamps on the HUD. Fly a lane against its flow —
inbound down the exit corridor, outbound up the entry one — and port
control warns you, then docks your standing with the port's charter for
every ten seconds you keep it up. Docking through the entry lane earns a
little back.
<!-- /note -->

### <a id="s-stepLaneDiscipline"></a>`stepLaneDiscipline(dt)`

function · L1297–1326

- calls: [`adjustStanding`](../corp/corps.js.md#s-adjustStanding) _js/corp/corps.js_ · [`corpOfStation`](../corp/corps.js.md#s-corpOfStation) _js/corp/corps.js_ · [`portPulse`](../npc/flow.js.md#s-portPulse) _js/npc/flow.js_ · [`laneFlow`](../npc/lanes.js.md#s-laneFlow) _js/npc/lanes.js_ · [`laneOf`](../npc/lanes.js.md#s-laneOf) _js/npc/lanes.js_ · [`stationLane`](../npc/lanes.js.md#s-stationLane) _js/npc/lanes.js_ · [`logEvent`](#s-logEvent) · [`nearestStation`](../station/stations.js.md#s-nearestStation) _js/station/stations.js_
- called by: [`stepWorld`](#s-stepWorld)

<!-- note:stepLaneDiscipline -->
- L1299 · `if (tractor.active) { if (sim.lane) sim.lane.wrong = false; sim.wrongWayFor = 0; return; }` — control has the helm: whatever line it is flying you on is by definition the right one
<!-- /note -->

### <a id="s-laneCredit"></a>`laneCredit(st)`

function · **exported** · L1328–1336

- calls: [`adjustStanding`](../corp/corps.js.md#s-adjustStanding) _js/corp/corps.js_ · [`corpOfStation`](../corp/corps.js.md#s-corpOfStation) _js/corp/corps.js_ · [`logEvent`](#s-logEvent)
- called by: [`finishDock`](#s-finishDock)

<!-- note:laneCredit -->
Called on a successful dock: a clean entry-lane approach is remembered by the port.
<!-- /note -->

### <a id="s-applyRemoteState"></a>`applyRemoteState(from, data)`

function · **exported** · L1338–1364

- calls: [`hashHue`](../world/bodies.js.md#s-hashHue) _js/world/bodies.js_
- called by: [`poll`](../net/net.js.md#s-poll) _js/net/net.js_

<!-- note:applyRemoteState -->
---- multiplayer --------------------------------------------------------
<!-- /note -->

### <a id="s-applyReliable"></a>`applyReliable(_from, data)`

function · **exported** · L1366–1373

- calls: [`applySkyEvent`](#s-applySkyEvent) · [`collectBeacon`](#s-collectBeacon) · [`bodyById`](../world/bodies.js.md#s-bodyById) _js/world/bodies.js_
- called by: [`poll`](../net/net.js.md#s-poll) _js/net/net.js_

<!-- note:applyReliable -->
<!-- /note -->

### <a id="s-dropRemote"></a>`dropRemote(id)`

function · **exported** · L1375–1377

- called by: [`disconnectNet`](../net/net.js.md#s-disconnectNet) _js/net/net.js_ · [`poll`](../net/net.js.md#s-poll) _js/net/net.js_ ×2

<!-- note:dropRemote -->
<!-- /note -->

### <a id="s-collectBeacon"></a>`collectBeacon(id, local)`

function · L1379–1395

- calls: [`work`](../flight/pilot.js.md#s-work) _js/flight/pilot.js_ ×2 · [`batteryCap`](../flight/ship.js.md#s-batteryCap) _js/flight/ship.js_ · [`logEvent`](#s-logEvent) · [`persistProgress`](#s-persistProgress)
- via [js/world/bodies.js](../world/bodies.js.md): `BEACONS.find`
- via [js/audio/index.js](../audio/index.js.md): `SHIP.collect`
- called by: [`applyReliable`](#s-applyReliable) · [`collectBeaconsNear`](#s-collectBeaconsNear)

<!-- note:collectBeacon -->
---- progress -----------------------------------------------------------
<!-- /note -->

### <a id="s-savePilotRecord"></a>`savePilotRecord()`

function · L1397–1403

- calls: [`loadPilot`](../flight/pilot.js.md#s-loadPilot) _js/flight/pilot.js_ · [`savePilot`](../flight/pilot.js.md#s-savePilot) _js/flight/pilot.js_
- via [js/economy/insurance.js](../economy/insurance.js.md): `policies.values`
- via [js/corp/corps.js](../corp/corps.js.md): `corps.map`
- called by: [`launchSim`](#s-launchSim) · [`persistProgress`](#s-persistProgress)

<!-- note:savePilotRecord -->
The pilot record with what the sim owns: hulls bought, the active one, the cover on them.

- L1400 · `const standing = { ...(loadPilot()?.standing ?? {}) };` — standing per sky: this sky's table over whatever other skies the record already holds
<!-- /note -->

### <a id="s-persistNow"></a>`persistNow()`

function · **exported** · L1405–1409

- calls: [`persistProgress`](#s-persistProgress)
- called by: [`@file`](../main.js.md#) _js/main.js_ ×2

<!-- note:persistNow -->
Write progress and the wallet now — the tab is going away (main.js wires it).
<!-- /note -->

### <a id="s-persistProgress"></a>`persistProgress()`

function · L1411–1425

- calls: [`savePilotRecord`](#s-savePilotRecord) · [`surveyIds`](../world/bodies.js.md#s-surveyIds) _js/world/bodies.js_ · [`terraformSnapshot`](../world/events/atmoworks.js.md#s-terraformSnapshot) _js/world/events/atmoworks.js_
- via [js/core/store.js](../core/store.js.md): `useGameStore.getState`, `useGameStore.getState.patchHud`, `useGameStore.getState.persist`
- called by: [`collectBeacon`](#s-collectBeacon) · [`persistNow`](#s-persistNow) · [`stepCareer`](#s-stepCareer) · [`tryScan`](#s-tryScan)

<!-- note:persistProgress -->
<!-- /note -->

### <a id="s-tryAssay"></a>`tryAssay()`

function · L1427–1471

- calls: [`benchValue`](../economy/icework.js.md#s-benchValue) _js/economy/icework.js_ ×2 · [`goodName`](../economy/materials.js.md#s-goodName) _js/economy/materials.js_ ×2 · [`work`](../flight/pilot.js.md#s-work) _js/flight/pilot.js_ ×3 · [`forwardOf`](../flight/ship.js.md#s-forwardOf) _js/flight/ship.js_ · [`logEvent`](#s-logEvent) ×2 · [`setNoticeAbout`](#s-setNoticeAbout) ×2 · [`tryAssay>inCone`](#s-tryAssay-inCone) ×2 · [`dist3`](../world/bodies.js.md#s-dist3) _js/world/bodies.js_ · [`chunkMass`](../world/debris.js.md#s-chunkMass) _js/world/debris.js_ · [`nearDebris`](../world/debris.js.md#s-nearDebris) _js/world/debris.js_ · [`nearbyRocks`](../world/field.js.md#s-nearbyRocks) _js/world/field.js_
- via [js/audio/index.js](../audio/index.js.md): `NAV.contact`, `SHIP.collect`
- called by: [`tryScan`](#s-tryScan)

<!-- note:tryAssay -->
The scanner reads what the nose is on: debris and belt rocks up close, worlds beyond.

- L1433 · `let bestChunk = null;` — impact debris first — the question after a strike is always "what is in the chunks"
- L1437 · `break;` — nearDebris is sorted
- L1451 · `let bestRock = null;` — then the field: the rock under the reticle, ore, ice, veins and all
<!-- /note -->

#### <a id="s-tryAssay-inCone"></a>`tryAssay>inCone(x, y, z, d)`

function · L1430–1430

- called by: [`tryAssay`](#s-tryAssay) ×2

<!-- note:tryAssay>inCone -->
<!-- /note -->

### <a id="s-tryScan"></a>`tryScan()`

function · L1473–1521

- calls: [`rollOre`](../economy/materials.js.md#s-rollOre) _js/economy/materials.js_ ×2 · [`work`](../flight/pilot.js.md#s-work) _js/flight/pilot.js_ ×2 · [`addCargo`](../flight/ship.js.md#s-addCargo) _js/flight/ship.js_ · [`logEvent`](#s-logEvent) ×2 · [`persistProgress`](#s-persistProgress) · [`setNavTarget`](#s-setNavTarget) · [`tryAssay`](#s-tryAssay) · [`bodyById`](../world/bodies.js.md#s-bodyById) _js/world/bodies.js_ · [`bodyPosition`](../world/bodies.js.md#s-bodyPosition) _js/world/bodies.js_ · [`bodyTempK`](../world/bodies.js.md#s-bodyTempK) _js/world/bodies.js_ · [`dist3`](../world/bodies.js.md#s-dist3) _js/world/bodies.js_ · [`scanRadius`](../world/bodies.js.md#s-scanRadius) _js/world/bodies.js_ · [`rngFromSeed`](../world/generate.js.md#s-rngFromSeed) _js/world/generate.js_
- via [js/audio/index.js](../audio/index.js.md): `NAV.ping`
- via [js/economy/materials.js](../economy/materials.js.md): `ORES.find`
- called by: [`tickSim`](#s-tickSim) ×2

<!-- note:tryScan -->
- L1475 · `if (tryAssay()) return;` — close targets outrank the planet behind them
- L1492 · `if (!sim.lock.id) setNavTarget(bestId);` — a survey reports on what is in range; it does not re-aim the warp core.
  (It only takes the nav target if nothing is locked at all.)
- L1508 · `` const sampler = rngFromSeed(`${bestId}:sample`); `` — A survey pays out a core sample of whatever that world is made of.
- L1509 · `const deposits = body.arch?.ores?.length ? body.arch.ores : null;` — Same source the readout uses: the archetype's deposit list, weighted to the top entry.
- L1515 · `const heatMul = !hot ? 1 : ore.id.endsWith("_ice") || ore.id === "tholins" ? 0.45 : 1.35;` — a hot crust: excavated metal pays a third more, volatiles are boiling away
<!-- /note -->

### <a id="s-wellEdge"></a>`wellEdge(body)`

function · **exported** · L1523–1528

- calls: [`remnantRadius`](../world/scale.js.md#s-remnantRadius) _js/world/scale.js_
- called by: [`climbOut`](../aria/nav.js.md#s-climbOut) _js/aria/nav.js_ · [`warpBlock`](#s-warpBlock) ×2 · [`warpBlockDuringSpool`](#s-warpBlockDuringSpool)

<!-- note:wellEdge -->
---- warp core -----------------------------------------------------------

A warp is not a button press, it is a commitment. The core has to spool for
six seconds under heavy load, and it will only hold that spool while two
things stay true: you are not sitting in anybody's gravity well, and the
straight line to the destination is clear. Break either one and the core
drops and has to cool.

How far out a world's well reaches for the core: where its pull drops under
WARP.wellG.

The radii floor and ceiling are measured against what is LEFT of the body,
not what it used to be. A world you broke up is a rubble field with a core
in it: its `mu` is already cut, and holding the old radius in the floor was
what kept a dead planet blocking warp for four of its original radii in
every direction. `remnantRadius` is the same number the canopy draws it at.

Where a world stops holding the warp core.

This used to be geometry with gravity as an afterthought: a flat four-radii
floor, whatever the body weighed. Measured across a generated sky, that
floor — not the pull — was what decided the edge for every moon in the
system, and it put the boundary where the HUD's own G readout showed 0.01.
Being refused a jump by a well you cannot see on the instruments is the
whole complaint, and it was correct.

So gravity governs now, and the geometric floor only stops you jumping out
of the atmosphere. The invariant that matters: the block agrees with the
number on the HUD. If the readout rounds to 0.00 G, nothing holds you.
<!-- /note -->

### <a id="s-wellG"></a>`wellG(body, dist)`

function · **exported** · L1530–1533

- called by: [`warpBlock`](#s-warpBlock) · [`warpBlockDuringSpool`](#s-warpBlockDuringSpool)

<!-- note:wellG -->
The pull here, in the units the HUD prints. One source of truth.
<!-- /note -->

### <a id="s-WARP"></a>`WARP`

const · **exported** · L1535–1546

<!-- note:WARP -->
- L1536 · `wellG: 0.5,` — pull (u/s²; the HUD's G readout ×25) under which a world no longer holds the core
- L1537 · `wellClear: 1.35,` — and never inside this many radii — clear of the air and the rings, no further
- L1538 · `wellFar: 8,` — and never beyond this many radii, however heavy (a giant's well is still a ways out)
- L1539 · `wellFloorG: 0.005,` — if the HUD would round the pull to 0.00 G, nothing is holding you. Ever.
- L1540 · `spool: 6,` — seconds to charge
- L1541 · `draw: 95,` — kW while spooling
- L1542 · `cool: 8,` — seconds of lockout after a run
- L1543 · `minCharge: 300,` — refuse to start below this
- L1544 · `losMargin: 1.4,` — corridor is this many body radii wide
- L1545 · `starClear: 6,` — star radii you must be beyond
<!-- /note -->

### <a id="s-segmentMiss"></a>`segmentMiss(px, py, pz, ax, ay, az, bx, by, bz)`

function · L1548–1556

- called by: [`losBlocker`](#s-losBlocker) · [`plotRoute`](#s-plotRoute) ×4

<!-- note:segmentMiss -->
<!-- /note -->

### <a id="s-_dest"></a>`_dest`

const · L1558–1558

<!-- note:_dest -->
<!-- /note -->

### <a id="s-_obs"></a>`_obs`

const · L1559–1559

<!-- note:_obs -->
<!-- /note -->

### <a id="s-warpNodeById"></a>`warpNodeById(id)`

function · **exported** · L1561–1588

- calls: [`warpNodeById`](#s-warpNodeById) · [`stationById`](../station/stations.js.md#s-stationById) _js/station/stations.js_ · [`bodyById`](../world/bodies.js.md#s-bodyById) _js/world/bodies.js_
- called by: [`aimAt`](../aria/nav.js.md#s-aimAt) _js/aria/nav.js_ · [`engageAutopilot`](../flight/autopilot.js.md#s-engageAutopilot) _js/flight/autopilot.js_ · [`markAt`](../mission/run.js.md#s-markAt) _js/mission/run.js_ · [`resolve`](../mission/run.js.md#s-resolve) _js/mission/run.js_ ×7 · [`acquireLock`](#s-acquireLock) · [`engageWarp`](#s-engageWarp) · [`plotRoute`](#s-plotRoute) · [`setNavTarget`](#s-setNavTarget) · [`stepWarp`](#s-stepWarp) · [`toggleWarp`](#s-toggleWarp) · [`warpBlock`](#s-warpBlock) ×2 · [`warpBlockDuringSpool`](#s-warpBlockDuringSpool) · [`warpDestination`](#s-warpDestination) · [`warpNodeById`](#s-warpNodeById) · [`warpStatus`](#s-warpStatus) · [`mountMap`](../ui/map.js.md#s-mountMap) _js/ui/map.js_ · [`warpDone`](../ui/tutorial-core.js.md#s-warpDone) _js/ui/tutorial-core.js_ · [`warpWhy`](../ui/tutorial-core.js.md#s-warpWhy) _js/ui/tutorial-core.js_

<!-- note:warpNodeById -->
Anything the core will jump to: a world or a port. One shape —
{ id, name, kind, radius, arriveR, pos(out), vel(out), body? } — so the
plot, the gates and the run never care which it was.

- L1578 · `const wp = sim.waypoints.find((w) => w.id === id);` — a saved location is a warp node too: the core jumps to a point in space —
  a belt band, a probe drop, a spot you marked off the chart
<!-- /note -->

#### <a id="s-warpNodeById-pos"></a>`warpNodeById.pos(out)`

prop · L1566–1566

- calls: [`bodyPosition`](../world/bodies.js.md#s-bodyPosition) _js/world/bodies.js_

<!-- note:warpNodeById.pos -->
<!-- /note -->

#### <a id="s-warpNodeById-vel"></a>`warpNodeById.vel(out)`

prop · L1567–1567

- calls: [`bodyVelocity`](../world/bodies.js.md#s-bodyVelocity) _js/world/bodies.js_

<!-- note:warpNodeById.vel -->
<!-- /note -->

#### <a id="s-warpNodeById-pos-2"></a>`warpNodeById.pos~2(out)`

prop · L1574–1574

<!-- note:warpNodeById.pos~2 -->
<!-- /note -->

#### <a id="s-warpNodeById-vel-2"></a>`warpNodeById.vel~2(out)`

prop · L1575–1575

<!-- note:warpNodeById.vel~2 -->
<!-- /note -->

#### <a id="s-warpNodeById-pos-3"></a>`warpNodeById.pos~3(out)`

prop · L1583–1583

- calls: [`waypointPosition`](#s-waypointPosition)

<!-- note:warpNodeById.pos~3 -->
<!-- /note -->

#### <a id="s-warpNodeById-vel-3"></a>`warpNodeById.vel~3(out)`

prop · L1584–1584

- calls: [`waypointVelocity`](#s-waypointVelocity)

<!-- note:warpNodeById.vel~3 -->
<!-- /note -->

### <a id="s-POINT_ARRIVE_R"></a>`POINT_ARRIVE_R`

const · **exported** · L1590–1590

<!-- note:POINT_ARRIVE_R -->
How close a point jump drops you (u). Inside a belt that is one cell of rock.
<!-- /note -->

### <a id="s-warpDestination"></a>`warpDestination(target, out)`

function · **exported** · L1592–1605

- calls: [`warpNodeById`](#s-warpNodeById)
- called by: [`apLeg`](../flight/autopilot.js.md#s-apLeg) _js/flight/autopilot.js_ ×2 · [`flyTheLane`](../flight/autopilot.js.md#s-flyTheLane) _js/flight/autopilot.js_ · [`engageWarp`](#s-engageWarp) · [`plotRoute`](#s-plotRoute) · [`warpBlock`](#s-warpBlock) · [`warpBlockDuringSpool`](#s-warpBlockDuringSpool) · [`mountMap`](../ui/map.js.md#s-mountMap) _js/ui/map.js_ · [`warpDone`](../ui/tutorial-core.js.md#s-warpDone) _js/ui/tutorial-core.js_

<!-- note:warpDestination -->
Where a warp to a node would put you: standoff, sunward side.

- L1597 · `o.x = _bp.x; o.y = _bp.y; o.z = _bp.z;` — a point IS the destination — the arrival clearance nudge keeps you out of any rock sitting on it
<!-- /note -->

### <a id="s-losBlocker"></a>`losBlocker(from, to, ignoreId)`

function · **exported** · L1607–1615

- calls: [`segmentMiss`](#s-segmentMiss) · [`bodyPosition`](../world/bodies.js.md#s-bodyPosition) _js/world/bodies.js_
- called by: [`corridorBlocker`](../aria/nav.js.md#s-corridorBlocker) _js/aria/nav.js_ · [`doglegAround`](../aria/nav.js.md#s-doglegAround) _js/aria/nav.js_ ×2 · [`sensePorts`](../aria/senses.js.md#s-sensePorts) _js/aria/senses.js_ · [`tradeRoutes`](../economy/traderoutes.js.md#s-tradeRoutes) _js/economy/traderoutes.js_ · [`tradeRoutes>lineBlocked`](../economy/traderoutes.js.md#s-tradeRoutes-lineBlocked) _js/economy/traderoutes.js_ · [`EXEC.GOTO`](../mission/run.js.md#s-EXEC-GOTO) _js/mission/run.js_ · [`warpBlock`](#s-warpBlock) · [`warpBlockDuringSpool`](#s-warpBlockDuringSpool) · [`mountMap`](../ui/map.js.md#s-mountMap) _js/ui/map.js_ ×2

<!-- note:losBlocker -->
First body whose bulk sits in the corridor, or null if the lane is clear.
<!-- /note -->

### <a id="s-warpBlock"></a>`warpBlock(targetId)`

function · **exported** · L1617–1652

- calls: [`losBlocker`](#s-losBlocker) · [`warpDestination`](#s-warpDestination) · [`warpNodeById`](#s-warpNodeById) ×2 · [`wellEdge`](#s-wellEdge) ×2 · [`wellG`](#s-wellG) · [`dist3`](../world/bodies.js.md#s-dist3) _js/world/bodies.js_ · [`starBody`](../world/bodies.js.md#s-starBody) _js/world/bodies.js_ · [`holeWarpBlock`](../world/events/holes.js.md#s-holeWarpBlock) _js/world/events/holes.js_
- called by: [`mountTargets`](../console/panels/nav.js.md#s-mountTargets) _js/console/panels/nav.js_ · [`apLeg`](../flight/autopilot.js.md#s-apLeg) _js/flight/autopilot.js_ · [`stepWarp`](#s-stepWarp) · [`toggleWarp`](#s-toggleWarp) · [`mountMap`](../ui/map.js.md#s-mountMap) _js/ui/map.js_ · [`mountMap>laneState`](../ui/map.js.md#s-mountMap-laneState) _js/ui/map.js_ · [`warpWhy`](../ui/tutorial-core.js.md#s-warpWhy) _js/ui/tutorial-core.js_

<!-- note:warpBlock -->
Why the core will not engage right now, or "" if it will. Evaluated every
tick so the dash reads the truth and a spool aborts the moment it stops
being true.

- L1621 · `if (sim.lock.id && !warpNodeById(sim.lock.id)) return "LOCK NOT A WARP NODE";` — say WHY there is no target when the lock is on something you cannot
  jump to — a rock, a wreck, another ship
- L1631 · `const dom = sim.dominant;` — Warp geometry will not hold inside a well — while the well still pulls. A world's well ends
  where its draw falls under WARP.wellG, or WARP.wellClear radii out, whichever is farther;
  beyond that the world may still be the strongest pull around and it does not matter.
- L1633 · `const g = wellG(dom, sim.domDist);` — The readout is the authority. A world that is not registering on the
  instruments does not get to refuse the jump, whatever the geometry
  says — that mismatch is what made a well feel like it went on forever.
<!-- /note -->

### <a id="s-warpStatus"></a>`warpStatus()`

function · **exported** · L1654–1664

- calls: [`spoolTime`](#s-spoolTime) · [`warpNodeById`](#s-warpNodeById)
- called by: [`mountTargets`](../console/panels/nav.js.md#s-mountTargets) _js/console/panels/nav.js_

<!-- note:warpStatus -->
<!-- /note -->

### <a id="s-spoolTime"></a>`spoolTime()`

function · **exported** · L1666–1668

- called by: [`legSeconds`](../aria/nav.js.md#s-legSeconds) _js/aria/nav.js_ · [`warpReserve`](../flight/autopilot.js.md#s-warpReserve) _js/flight/autopilot.js_ · [`mountGame>tick`](../render/engine.js.md#s-mountGame-tick) _js/render/engine.js_ · [`engageWarp`](#s-engageWarp) · [`plotRoute`](#s-plotRoute) · [`publishHud`](#s-publishHud) · [`stepWarp`](#s-stepWarp) · [`warpStatus`](#s-warpStatus)

<!-- note:spoolTime -->
Seconds the core needs to spool, through the pilot's drive modifier.
<!-- /note -->

### <a id="s-ALIGN_DEG"></a>`ALIGN_DEG`

const · **exported** · L1670–1670

<!-- note:ALIGN_DEG -->
---- route plotting ------------------------------------------------------
The nav computer only plots what the nose is looking at: point the ship at
the warp target and the route resolves — distance, ETA, and everything the
corridor crosses on the way (bodies, belts, rock tracks, port traffic,
projected impact points). No alignment, no plot; no plot, no spool.
<!-- /note -->

### <a id="s-DROPOUT_ODDS"></a>`DROPOUT_ODDS`

const · **exported** · L1672–1672

<!-- note:DROPOUT_ODDS -->
A plotted hazard is a priced risk: cross it in warp and the core may drop
you out right there. Traffic never drops you — it fines your standing.
<!-- /note -->

### <a id="s-_routeCache"></a>`_routeCache`

const · L1674–1674

<!-- note:_routeCache -->
<!-- /note -->

### <a id="s-_rp"></a>`_rp`

const · L1675–1675

<!-- note:_rp -->
<!-- /note -->

### <a id="s-alignmentTo"></a>`alignmentTo(dest)`

function · **exported** · L1677–1683

- calls: [`forwardOf`](../flight/ship.js.md#s-forwardOf) _js/flight/ship.js_ · [`clamp`](#s-clamp)
- called by: [`plotRoute`](#s-plotRoute)

<!-- note:alignmentTo -->
Angle (deg) between the nose and the lane to `dest`.
<!-- /note -->

### <a id="s-plotRoute"></a>`plotRoute(targetId=)`

function · **exported** · L1685–1760

- calls: [`alignmentTo`](#s-alignmentTo) · [`clamp`](#s-clamp) ×5 · [`segmentMiss`](#s-segmentMiss) ×4 · [`spoolTime`](#s-spoolTime) · [`warpDestination`](#s-warpDestination) · [`warpNodeById`](#s-warpNodeById) · [`bodyPosition`](../world/bodies.js.md#s-bodyPosition) _js/world/bodies.js_ · [`dist3`](../world/bodies.js.md#s-dist3) _js/world/bodies.js_ ×5 · [`holeRadii`](../world/events/holes.js.md#s-holeRadii) _js/world/events/holes.js_
- called by: [`apLeg`](../flight/autopilot.js.md#s-apLeg) _js/flight/autopilot.js_ · [`execute`](../npc/captain.js.md#s-execute) _js/npc/captain.js_ · [`publishHud`](#s-publishHud) · [`toggleWarp`](#s-toggleWarp)

<!-- note:plotRoute -->
Plot the corridor to a warp target. Cached ~4 Hz per target. Returns
{ target, dist, eta, align, aligned, hazards[], impact } — `impact` is the
first fatal obstruction (a body dead in the lane), hazards are everything
else worth a captain's eye, each with `at` (0..1 along the lane).

- L1698 · `for (const b of BODIES) {` — bodies in the corridor
- L1710 · `for (const [belt, label] of [[currentSystem.belt, "BELT"], [currentSystem.outerBelt, "OUTE` — belt crossings: sample the lane against each annulus
- L1725 · `for (const m of impactors) {` — impactor tracks near the lane
- L1729 · `for (const h of holes) {` — collapsed stars and transits: a warp covers 900–1800 u a tick, so a lane
  through a hole lands a tick inside the disk. 0.3 plotted straight through them.
- L1738 · `for (const st of stations) {` — port traffic — the destination port is not its own hazard
- L1749 · `eta: 0,` — filled below: spool + run
<!-- /note -->

### <a id="s-toggleWarp"></a>`toggleWarp()`

function · **exported** · L1762–1799

- calls: [`logEvent`](#s-logEvent) ×2 · [`plotRoute`](#s-plotRoute) · [`warpBlock`](#s-warpBlock) · [`warpNodeById`](#s-warpNodeById)
- via [js/audio/index.js](../audio/index.js.md): `NAV.dropout`, `WARN.caution`, `WARN.deny`
- called by: [`mountTargets`](../console/panels/nav.js.md#s-mountTargets) _js/console/panels/nav.js_ · [`search.run`](../console/panels/nav.js.md#s-search-run) _js/console/panels/nav.js_ · [`releaseControls`](../flight/autopilot.js.md#s-releaseControls) _js/flight/autopilot.js_ · [`tickSim`](#s-tickSim) · [`mountMap`](../ui/map.js.md#s-mountMap) _js/ui/map.js_

<!-- note:toggleWarp -->
Tap once to spool, tap again to stand it down.

- L1778 · `const route = plotRoute(sim.selected);` — the nav computer wants the nose on the lane before it commits the core
<!-- /note -->

### <a id="s-abortSpool"></a>`abortSpool(reason)`

function · L1801–1809

- calls: [`logEvent`](#s-logEvent)
- via [js/audio/index.js](../audio/index.js.md): `WARN.caution`
- called by: [`engageWarp`](#s-engageWarp) · [`stepWarp`](#s-stepWarp) ×2

<!-- note:abortSpool -->
<!-- /note -->

### <a id="s-warpBlockDuringSpool"></a>`warpBlockDuringSpool()`

function · L1811–1831

- calls: [`losBlocker`](#s-losBlocker) · [`warpDestination`](#s-warpDestination) · [`warpNodeById`](#s-warpNodeById) · [`wellEdge`](#s-wellEdge) · [`wellG`](#s-wellG) · [`starBody`](../world/bodies.js.md#s-starBody) _js/world/bodies.js_ · [`holeWarpBlock`](../world/events/holes.js.md#s-holeWarpBlock) _js/world/events/holes.js_
- called by: [`stepWarp`](#s-stepWarp)

<!-- note:warpBlockDuringSpool -->
The subset of gates that can break a spool.

This one had earlier well fix applied to `warpBlock` and NOT to itself, and
the two disagreeing is worse than either being wrong. The old line here was
"any non-star dominant body, at any range, aborts" — so a moon a million
units away reading 0.00 G on the instruments passed `warpBlock`, let the
core spool, and then killed the spool on the first tick. Cool 2.5 s, align,
spool, abort, forever: the hull sits there cycling and the player watches an
autopilot that will not jump and cannot say why. Both gates now answer to
the same invariant — if the readout rounds to 0.00 G, nothing is holding you.
<!-- /note -->

### <a id="s-warpDropout"></a>`warpDropout(h, u)`

function · L1833–1854

- calls: [`work`](../flight/pilot.js.md#s-work) _js/flight/pilot.js_ · [`applyDamage`](../flight/ship.js.md#s-applyDamage) _js/flight/ship.js_ · [`logEvent`](#s-logEvent) · [`dist3`](../world/bodies.js.md#s-dist3) _js/world/bodies.js_
- via [js/audio/index.js](../audio/index.js.md): `WARN.caution`
- called by: [`stepWarp`](#s-stepWarp)

<!-- note:warpDropout -->
The core lets go mid-run: dumped at the crossing with the hazard for company.

- L1839 · `const d = dist3(w.from, w.to) || 1;` — carry a chunk of lane speed into realspace — a dropout is not a parking job
- L1845 · `applyDamage(ship, h.kind === "rock" ? 22 : 10, null, sim.time, "kinetic");` — a collision is mass
- L1853 · `work("navigation", 2);` — surviving one teaches you something
<!-- /note -->

### <a id="s-WARP_TURN_IN"></a>`WARP_TURN_IN`

const · L1856–1856

<!-- note:WARP_TURN_IN -->
fractions of a warp run: onto the lane by the first, off it from the second (0.3.51)
<!-- /note -->

### <a id="s-WARP_TURN_OUT"></a>`WARP_TURN_OUT`

const · L1857–1857

<!-- note:WARP_TURN_OUT -->
<!-- /note -->

### <a id="s-engageWarp"></a>`engageWarp()`

function · L1859–1893

- calls: [`abortSpool`](#s-abortSpool) · [`clamp`](#s-clamp) ×3 · [`spoolTime`](#s-spoolTime) · [`warpDestination`](#s-warpDestination) · [`warpNodeById`](#s-warpNodeById) · [`dist3`](../world/bodies.js.md#s-dist3) _js/world/bodies.js_
- via [js/audio/index.js](../audio/index.js.md): `NAV.jump`, `NAV.spool`
- called by: [`stepWarp`](#s-stepWarp)

<!-- note:engageWarp -->
- L1877 · `w.dur = clamp(dist3(ship.pos, to) / 55000, 3, 45);` — a run is a voyage: ~55k u/s in the tunnel, up to 45 s across the system
- L1884 · `{` — the lane itself: where the hull is actually going for the whole run
<!-- /note -->

### <a id="s-clearArrival"></a>`clearArrival(ship)`

function · **exported** · L1895–1917

- calls: [`inBelt`](../world/field.js.md#s-inBelt) _js/world/field.js_ · [`nearbyRocks`](../world/field.js.md#s-nearbyRocks) _js/world/field.js_
- called by: [`stepWarp`](#s-stepWarp)

<!-- note:clearArrival -->
A jump must never materialise you inside a rock. Walk the ship out of any
belt rock it overlaps (with a margin) — returns true if it had to move.
<!-- /note -->

### <a id="s-ARRIVE_CLEAR"></a>`ARRIVE_CLEAR`

const · L1918–1918

<!-- note:ARRIVE_CLEAR -->
<!-- /note -->

### <a id="s-blockAt"></a>`blockAt`

const · L1919–1919

<!-- note:blockAt -->
<!-- /note -->

### <a id="s-blockFor"></a>`blockFor`

const · L1919–1919

<!-- note:blockFor -->
<!-- /note -->

### <a id="s-blockCool"></a>`blockCool`

const · L1919–1919

<!-- note:blockCool -->
<!-- /note -->

### <a id="s-blockDom"></a>`blockDom`

const · L1919–1919

<!-- note:blockDom -->
<!-- /note -->

### <a id="s-_blockAtPos"></a>`_blockAtPos`

const · L1920–1920

<!-- note:_blockAtPos -->
<!-- /note -->

### <a id="s-stepWarp"></a>`stepWarp(dt)`

function · **exported** · L1922–2008

- calls: [`adjustStanding`](../corp/corps.js.md#s-adjustStanding) _js/corp/corps.js_ · [`corpOfStation`](../corp/corps.js.md#s-corpOfStation) _js/corp/corps.js_ · [`fx`](../economy/upgrades.js.md#s-fx) _js/economy/upgrades.js_ · [`abortSpool`](#s-abortSpool) ×2 · [`clamp`](#s-clamp) ×2 · [`clearArrival`](#s-clearArrival) · [`easeInOut`](#s-easeInOut) ×3 · [`engageWarp`](#s-engageWarp) · [`lerp`](#s-lerp) ×5 · [`logEvent`](#s-logEvent) ×2 · [`removeWaypoint`](#s-removeWaypoint) · [`setNoticeAbout`](#s-setNoticeAbout) ×2 · [`spoolTime`](#s-spoolTime) · [`warpBlock`](#s-warpBlock) · [`warpBlockDuringSpool`](#s-warpBlockDuringSpool) · [`warpDropout`](#s-warpDropout) · [`warpNodeById`](#s-warpNodeById) · [`wrapPi`](#s-wrapPi) ×2 · [`dist3`](../world/bodies.js.md#s-dist3) _js/world/bodies.js_ · [`inBelt`](../world/field.js.md#s-inBelt) _js/world/field.js_ · [`nearbyRocks`](../world/field.js.md#s-nearbyRocks) _js/world/field.js_
- via [js/audio/index.js](../audio/index.js.md): `NAV.arrive`
- via [js/station/stations.js](../station/stations.js.md): `stations.find`
- called by: [`tickSim`](#s-tickSim) ×2

<!-- note:stepWarp -->
- L1927 · `if (w.state !== "idle") { w.block = ""; blockAt = -1; }` — the readout, not the gate: the jump itself re-checks live. Five times a second is plenty
  for a line of text, and warpBlock walks every body for a blocker.
- L1935 · `if (sim.selected !== w.targetId) {` — Re-check the gates against the live target, not the one you tapped.
- L1955 · `const f = clamp(w.t / w.dur, 0, 1);` — 0.3.51: the nose follows the lane. It used to turn from wherever it
  started to "facing the target on arrival" across the whole jump, while
  the hull moved in a straight line — so any drop point off to one side of
  the target (every station lane, every stand-off) flew the jump crabbed,
  measured 24° by the end. Now: come onto the lane in the first tenth, fly
  it nose-first, and turn to face the target only as the core lets go.
- L1971 · `for (const h of w.hazards ?? []) {` — every hazard the plot accepted gets its roll as the lane crosses it
- L1981 · `const roll = sim.dropoutRoll ?? Math.random();` — sim.dropoutRoll: deterministic hook for tests
- L1982 · `if (roll < (DROPOUT_ODDS[h.kind] ?? 0) * upgradeFx("dropout", 1)) {` — hazard baffles do not change the lane, they change the odds of the
  core letting go in it
- L1993 · `node.vel(ship.vel);` — Drop out matched to the target's own motion so you are not simply
  dumped into its gravity well at rest.
<!-- /note -->

### <a id="s-impact"></a>`impact(ship, nx, ny, nz, surfaceDist, name)`

function · L2010–2038

- calls: [`applyDamage`](../flight/ship.js.md#s-applyDamage) _js/flight/ship.js_ · [`logEvent`](#s-logEvent)
- via [js/audio/index.js](../audio/index.js.md): `SHIP.impact`
- called by: [`stepCollisions`](#s-stepCollisions) ×2

<!-- note:impact -->
---- collisions ---------------------------------------------------------

A surface contact.

`n` points OUT of the thing, `surfaceDist` is how far in we are. The subtle
part is the sign of the radial velocity: negative means we are still driving
into the surface and the bounce applies; positive means we are on our way
out, and killing the velocity of a hull that is already leaving is how a
ship gets welded to a rock. Belt rocks overlap freely — ten to a cell, radii
up to 700 u — so a hull wedged between two of them used to take the ×0.55
damping twice a frame, which is a 97% velocity cut every ten frames. No
amount of thrust escapes that. It read in play as "the collision avoidance
has me stuck inside the belt", and it was really the collision RESPONSE.

- L2013 · `const speed = Math.abs(radial - (fv.x * nx + fv.y * ny + fv.z * nz));` — Only the closing speed relative to the surface hurts.
- L2026 · `applyDamage(ship, (speed - 22) * 0.32, null, sim.time, "kinetic");` — scraping a surface
<!-- /note -->

### <a id="s-stepCollisions"></a>`stepCollisions(ship, dt)`

function · L2040–2094

- calls: [`applyDamage`](../flight/ship.js.md#s-applyDamage) _js/flight/ship.js_ ×3 · [`speedOf`](../flight/ship.js.md#s-speedOf) _js/flight/ship.js_ · [`impact`](#s-impact) ×2 · [`bodyPosition`](../world/bodies.js.md#s-bodyPosition) _js/world/bodies.js_ · [`starBody`](../world/bodies.js.md#s-starBody) _js/world/bodies.js_ · [`inBelt`](../world/field.js.md#s-inBelt) _js/world/field.js_ · [`nearbyRocks`](../world/field.js.md#s-nearbyRocks) _js/world/field.js_
- called by: [`stepShip`](#s-stepShip)

<!-- note:stepCollisions -->
- L2051 · `} else if (b.kind === "star") {` — no photosphere to hit and no surface to burn: the remnant's own zones
  (holes.js, holeOnShip) are what hurt now
- L2059 · `const t = (1 - d / (b.radius * 2.4)) * Math.min(1, b.thermal / 500);` — a fresh impact site radiates — a heated world is briefly a small sun
- L2072 · `const d = Math.hypot(ship.pos.x, ship.pos.y, ship.pos.z);` — absolute floor so nothing tunnels through the photosphere
- L2082 · `const rocks = nearbyRocks(ship.pos, sim.time, 1);` — ONE contact a frame — the deepest. Resolving every overlapping rock in
  turn compounds the restitution damping and pushes the hull out of one
  rock straight into the next, which is the belt trap described above.
<!-- /note -->

### <a id="s-LOCK_CONE"></a>`LOCK_CONE`

const · L2096–2096

<!-- note:LOCK_CONE -->
---- targeting -----------------------------------------------------------

Pointer lock. Put the reticle on something and the signature builds; look
away and it decays. A big close target resolves in a second or two, a small
far one takes real patience. Once it holds, MATCH can fly the lock's own
frame so the two of you hang motionless together.
<!-- /note -->

### <a id="s-LOCK_BREAK"></a>`LOCK_BREAK`

const · L2097–2097

<!-- note:LOCK_BREAK -->
<!-- /note -->

### <a id="s-_lp"></a>`_lp`

const · L2098–2098

<!-- note:_lp -->
<!-- /note -->

### <a id="s-_lv"></a>`_lv`

const · L2099–2099 · **never referenced**

<!-- note:_lv -->
<!-- /note -->

### <a id="s-lockCandidates"></a>`lockCandidates()`

function · **exported** · L2101–2124

- calls: [`goodName`](../economy/materials.js.md#s-goodName) _js/economy/materials.js_ · [`bodyPosition`](../world/bodies.js.md#s-bodyPosition) _js/world/bodies.js_ · [`nearDebris`](../world/debris.js.md#s-nearDebris) _js/world/debris.js_ · [`nearbyRocks`](../world/field.js.md#s-nearbyRocks) _js/world/field.js_
- called by: [`acquireLock`](#s-acquireLock) · [`togglePointerLock`](#s-togglePointerLock)

<!-- note:lockCandidates -->
Everything the targeting computer can see, with a signature strength.

- L2116 · `const ship = sim.ship;` — the small stuff a miner actually wants: belt rocks in the cells around
  you and impact debris within cutter reach × a few — both were invisible
  to the targeting computer before, which is why P-LOCK "found nothing"
<!-- /note -->

### <a id="s-LOCK_DEBRIS_RANGE"></a>`LOCK_DEBRIS_RANGE`

const · L2126–2126

<!-- note:LOCK_DEBRIS_RANGE -->
<!-- /note -->

### <a id="s-candidateSig"></a>`candidateSig(kind, id)`

function · L2128–2136

- calls: [`bodyById`](../world/bodies.js.md#s-bodyById) _js/world/bodies.js_ · [`nearbyRocks`](../world/field.js.md#s-nearbyRocks) _js/world/field.js_
- via [js/world/events/impactors.js](../world/events/impactors.js.md): `impactors.find`
- via [js/world/debris.js](../world/debris.js.md): `chunks.find`
- via [js/station/stations.js](../station/stations.js.md): `stations.find`
- via [js/world/field.js](../world/field.js.md): `nearbyRocks.find`
- called by: [`stepLock`](#s-stepLock)

<!-- note:candidateSig -->
A candidate's signature strength without rebuilding the whole list.

- L2134 · `if (kind === "waypoint") return 400;` — a saved fix resolves instantly — it is our own number
<!-- /note -->

### <a id="s-targetPosition"></a>`targetPosition(kind, id, out)`

function · **exported** · L2138–2165

- calls: [`waypointPosition`](#s-waypointPosition) · [`bodyById`](../world/bodies.js.md#s-bodyById) _js/world/bodies.js_ · [`bodyPosition`](../world/bodies.js.md#s-bodyPosition) _js/world/bodies.js_ · [`nearbyRocks`](../world/field.js.md#s-nearbyRocks) _js/world/field.js_
- via [js/flight/turrets.js](../flight/turrets.js.md): `contacts.find`
- via [js/world/events/impactors.js](../world/events/impactors.js.md): `impactors.find`
- via [js/world/debris.js](../world/debris.js.md): `chunks.find`
- via [js/station/stations.js](../station/stations.js.md): `stations.find`
- via [js/world/field.js](../world/field.js.md): `nearbyRocks.find`
- called by: [`mountGame>tick`](../render/engine.js.md#s-mountGame-tick) _js/render/engine.js_ · [`stepLock`](#s-stepLock) · [`updateHold`](#s-updateHold)

<!-- note:targetPosition -->
Live position of whatever is locked, or null if it is gone.
<!-- /note -->

### <a id="s-targetVelocity"></a>`targetVelocity(kind, id, out)`

function · **exported** · L2167–2194

- calls: [`waypointVelocity`](#s-waypointVelocity) · [`bodyVelocity`](../world/bodies.js.md#s-bodyVelocity) _js/world/bodies.js_
- via [js/flight/turrets.js](../flight/turrets.js.md): `contacts.find`
- via [js/world/events/impactors.js](../world/events/impactors.js.md): `impactors.find`
- via [js/world/debris.js](../world/debris.js.md): `chunks.find`
- via [js/station/stations.js](../station/stations.js.md): `stations.find`
- called by: [`stepShip`](#s-stepShip)

<!-- note:targetVelocity -->
- L2189 · `: null;` — belt rocks drift too slowly to matter
<!-- /note -->

### <a id="s-setNavTarget"></a>`setNavTarget(id, why)`

function · **exported** · L2196–2210

- calls: [`logEvent`](#s-logEvent) · [`warpNodeById`](#s-warpNodeById)
- via [js/audio/index.js](../audio/index.js.md): `WARN.caution`
- called by: [`acquireLock`](#s-acquireLock) · [`clearLock`](#s-clearLock) · [`dropStation`](#s-dropStation) · [`selectBody`](#s-selectBody) ×2 · [`tryScan`](#s-tryScan)

<!-- note:setNavTarget -->
---- one target, one truth ------------------------------------------------
There used to be two ideas of "what am I pointed at": sim.lock (the
signature lock) and sim.selected (what the warp core jumps to). They only
synced one way, and only for planets — so locking a station, a rock or a
contact left sim.selected holding whatever planet you had last, and the
next G took you there instead. Releasing a lock left it stale too, and a
survey silently re-pointed it. Everything that changes the nav target now
goes through setNavTarget, and the lock drives it.

The only writer of sim.selected. Aborts a spool that was for something else.
<!-- /note -->

### <a id="s-clearLock"></a>`clearLock(why)`

function · **exported** · L2212–2222

- calls: [`setNavTarget`](#s-setNavTarget)
- called by: [`stepLock`](#s-stepLock) ×2 · [`togglePointerLock`](#s-togglePointerLock)

<!-- note:clearLock -->
- L2220 · `setNavTarget(null);` — dropping the lock drops the destination with it — a released lock must
  never leave the core aimed at the last thing you happened to look at
<!-- /note -->

### <a id="s-togglePointerLock"></a>`togglePointerLock()`

function · **exported** · L2224–2254

- calls: [`forwardOf`](../flight/ship.js.md#s-forwardOf) _js/flight/ship.js_ · [`acquireLock`](#s-acquireLock) ×2 · [`bodyUnderReticle`](#s-bodyUnderReticle) · [`clamp`](#s-clamp) · [`clearLock`](#s-clearLock) · [`lockCandidates`](#s-lockCandidates)
- via [js/audio/index.js](../audio/index.js.md): `WARN.deny`
- called by: [`mountHud`](../ui/hud.js.md#s-mountHud) _js/ui/hud.js_

<!-- note:togglePointerLock -->
P-LOCK: acquire whatever the reticle is nearest, or drop what you have.

- L2240 · `const score = ang - Math.min(0.12, c.sig / (d + 1));` — Prefer what you are actually pointing at, then what reads loudest.
<!-- /note -->

### <a id="s-acquireLock"></a>`acquireLock(c)`

function · **exported** · L2256–2267

- calls: [`lockCandidates`](#s-lockCandidates) · [`setNavTarget`](#s-setNavTarget) · [`warpNodeById`](#s-warpNodeById)
- called by: [`execute`](../npc/captain.js.md#s-execute) _js/npc/captain.js_ ×2 · [`mountGame>pickAt`](../render/engine.js.md#s-mountGame-pickAt) _js/render/engine.js_ ×2 · [`selectBody`](#s-selectBody) ×2 · [`togglePointerLock`](#s-togglePointerLock) ×2 · [`mountMap.run~3`](../ui/map.js.md#s-mountMap-run-3) _js/ui/map.js_ · [`mountMap>drawDirectory`](../ui/map.js.md#s-mountMap-drawDirectory) _js/ui/map.js_ · [`mountMap>tapAt`](../ui/map.js.md#s-mountMap-tapAt) _js/ui/map.js_ · [`CORE_STEPS.action.run`](../ui/tutorial-core.js.md#s-CORE_STEPS-action-run) _js/ui/tutorial-core.js_ · [`autoDock`](../ui/tutorial-core.js.md#s-autoDock) _js/ui/tutorial-core.js_ · [`STEPS.action~3.run`](../ui/tutorial.js.md#s-STEPS-action-3-run) _js/ui/tutorial.js_

<!-- note:acquireLock -->
Starts a signature lock on a `lockCandidates()` entry (or `{kind,id}`).

- L2264 · `setNavTarget(warpNodeById(best.id) ? best.id : null);` — warp-capable kinds (worlds and ports) become the nav target; everything
  else — rocks, debris, other ships — clears it, so the core reads NO
  TARGET rather than quietly reusing the last planet you looked at
<!-- /note -->

### <a id="s-stepLock"></a>`stepLock(dt)`

function · L2269–2306

- calls: [`forwardOf`](../flight/ship.js.md#s-forwardOf) _js/flight/ship.js_ · [`candidateSig`](#s-candidateSig) · [`clamp`](#s-clamp) ×2 · [`clearLock`](#s-clearLock) ×2 · [`logEvent`](#s-logEvent) · [`targetPosition`](#s-targetPosition)
- via [js/audio/index.js](../audio/index.js.md): `NAV.lock`
- called by: [`stepShip`](#s-stepShip)

<!-- note:stepLock -->
- L2287 · `const rate = clamp((sig / Math.max(d, 1)) * 26 + 0.16, 0.1, 1.4) * (ship.mods?.lock ?? 1);` — Big and close resolves fast; small and far is a slog.
<!-- /note -->

### <a id="s-_anchorPos"></a>`_anchorPos`

const · L2308–2308

<!-- note:_anchorPos -->
---- station keeping ----------------------------------------------------
<!-- /note -->

### <a id="s-updateHold"></a>`updateHold(ship, commanded)`

function · L2310–2343

- calls: [`targetPosition`](#s-targetPosition)
- called by: [`stepShip`](#s-stepShip)

<!-- note:updateHold -->
The point the assist should fly. Captured the moment you stop commanding
the ship, then carried along by whatever it is anchored to.

- L2326 · `const drifted =` — Re-anchor on a discontinuity. While the controller is actually holding you
  never get more than a few units off, so a large error means something moved
  you — a warp, an impact, a new anchor — and the old offset is meaningless.
<!-- /note -->

### <a id="s-impactSeverity"></a>`impactSeverity(impactorR, body, speed)`

function · L2345–2348

- calls: [`clamp`](#s-clamp)
- called by: [`applyRemoteStrike`](#s-applyRemoteStrike) · [`onImpact`](#s-onImpact) · [`strikeBody`](#s-strikeBody)

<!-- note:impactSeverity -->
---- impacts -------------------------------------------------------------

A strike is measured against the target: the same rock that leaves a scar on
a gas giant will end a moon. Severity drives everything downstream — crater
size, how much mass is thrown off, whether the world survives at all.
<!-- /note -->

### <a id="s-damageBody"></a>`damageBody(body, severity, n, impactorR, speed, {…}=)`

function · **exported** · L2350–2390

- calls: [`clamp`](#s-clamp) · [`shatterBody`](#s-shatterBody) · [`bodyPosition`](../world/bodies.js.md#s-bodyPosition) _js/world/bodies.js_ · [`bodyVelocity`](../world/bodies.js.md#s-bodyVelocity) _js/world/bodies.js_ · [`refreshBody`](../world/bodies.js.md#s-refreshBody) _js/world/bodies.js_ · [`burst`](../world/debris.js.md#s-burst) _js/world/debris.js_
- called by: [`onImpact`](#s-onImpact)

<!-- note:damageBody -->
- L2359 · `depth: depth0,` — how deep the bowl digs, as a fraction of the radius — the renderer
  carves this out of the sphere, so a cataclysm leaves a visible bite
- L2360 · `depth0,` — the shape it was born with, and how sharp its rim still is. A hot
  world's basins slump toward a fraction of depth0 and the rim loses its
  roughness — which is what stops a struck world staying jagged forever.
- L2366 · `body.radius = Math.max(body.baseRadius * 0.45, body.radius * (1 - severity * 0.12));` — mass thrown off, and with it the atmosphere if the hit was bad enough
- L2371 · `if (ejecta) burst({` — a strike that runs the impact physics (js/world/events/impacts.js) throws its own crust
<!-- /note -->

### <a id="s-eventSeq"></a>`eventSeq`

const · L2392–2392

<!-- note:eventSeq -->
---- staged cataclysms ---------------------------------------------------
A hit big enough to resurface a world is not a puff of dust and a dark
circle. It is an event with a life of its own: a jetting flash, a vapour
plume, an ejecta curtain, a magma ocean that slumps its own craters flat
as it cools, and a debris torus that flattens into an equatorial ring.
The sim owns the clock; the renderer reads the curve.
<!-- /note -->

### <a id="s-startCataclysm"></a>`startCataclysm(body, sev, n, outcome)`

function · **exported** · L2394–2411

- calls: [`eventDuration`](../world/events/cataclysm.js.md#s-eventDuration) _js/world/events/cataclysm.js_
- called by: [`onImpact`](#s-onImpact)

<!-- note:startCataclysm -->
<!-- /note -->

### <a id="s-goSupernova"></a>`goSupernova(bodyId)`

function · **exported** · L2413–2437

- calls: [`logEvent`](#s-logEvent) · [`bodyById`](../world/bodies.js.md#s-bodyById) _js/world/bodies.js_ · [`starBody`](../world/bodies.js.md#s-starBody) _js/world/bodies.js_ · [`supernovaDuration`](../world/events/cataclysm.js.md#s-supernovaDuration) _js/world/events/cataclysm.js_
- via [js/audio/index.js](../audio/index.js.md): `WARN.critical`

<!-- note:goSupernova -->
A star stops being a star. Staged like a real type-II light curve.
<!-- /note -->

### <a id="s-layRing"></a>`layRing(body, sev, shattered)`

function · L2439–2473

- calls: [`bodyPosition`](../world/bodies.js.md#s-bodyPosition) _js/world/bodies.js_ · [`ringPlan`](../world/events/cataclysm.js.md#s-ringPlan) _js/world/events/cataclysm.js_
- via [js/world/debris.js](../world/debris.js.md): `chunks.push`, `chunks.shift`
- called by: [`stepCataclysms`](#s-stepCataclysms)

<!-- note:layRing -->
Lay the debris an event threw off into a torus that will settle to a ring.

- L2444 · `const f = Math.pow(Math.random(), 0.6);` — mass concentrates toward the inside, the way a real disc does
- L2446 · `const inc = (Math.random() - 0.5) * plan.tilt;` — born as a thick, inclined, crossing-orbit torus. stepDebris damps the
  out-of-plane component far faster than the radial one, so it flattens
  into the equatorial plane before it circularises — which is exactly
  what collisional damping does to real impact debris.
- L2464 · `orbitInc: inc,` — the plane it is heading for, and how far along it is
<!-- /note -->

### <a id="s-stepCataclysms"></a>`stepCataclysms(d)`

function · L2475–2532

- calls: [`collapseToHole`](#s-collapseToHole) · [`layRing`](#s-layRing) · [`logEvent`](#s-logEvent) · [`bodyById`](../world/bodies.js.md#s-bodyById) _js/world/bodies.js_ · [`bodyPosition`](../world/bodies.js.md#s-bodyPosition) _js/world/bodies.js_ · [`dist3`](../world/bodies.js.md#s-dist3) _js/world/bodies.js_ · [`apparentGlow`](../world/events/cataclysm.js.md#s-apparentGlow) _js/world/events/cataclysm.js_ · [`cataclysmState`](../world/events/cataclysm.js.md#s-cataclysmState) _js/world/events/cataclysm.js_ · [`kelvinHex`](../world/events/cataclysm.js.md#s-kelvinHex) _js/world/events/cataclysm.js_ · [`relaxCraters`](../world/events/cataclysm.js.md#s-relaxCraters) _js/world/events/cataclysm.js_ · [`supernovaState`](../world/events/cataclysm.js.md#s-supernovaState) _js/world/events/cataclysm.js_
- called by: [`stepWorld`](#s-stepWorld)

<!-- note:stepCataclysms -->
Run every live event: relax the craters, light the sky, lay the rings.

- L2492 · `if (relaxCraters(body, d, ev.molten)) {` — a molten surface flows: basins slump, rims collapse. This is the fix
  for "planets go spiky and stay that way" — the spikes are a phase, not
  a permanent state, and what is left when it cools is a shallow basin.
- L2496 · `if (ev.molten > 0.02) body.moltenGlow = ev.molten;` — the world is still glowing from the inside while it is molten
- L2499 · `if (!ev.ringed && ev.t > 12 && (ev.outcome === OUTCOME.DISRUPT || ev.outcome === OUTCOME.S` — the ring goes down once the curtain has had time to leave the surface
- L2506 · `if (ev.lum > 0.004) {` — publish the light. This is what makes an event BEHIND you visible:
  the renderer turns it into a real light plus an exposure bump, so the
  hull in front of you brightens even when the source is off screen.
- L2522 · `if (ev.kind === "supernova" && !body.collapsed && ev.t > SN_COLLAPSE_AT) collapseToHole(bo` — the plateau breaks and the core has nothing left holding it up
- L2531 · `sim.skyLift += (lift - sim.skyLift) * Math.min(1, d * (lift > sim.skyLift ? 9 : 0.8));` — the eye takes a second or two to come back down
<!-- /note -->

### <a id="s-SN_COLLAPSE_AT"></a>`SN_COLLAPSE_AT`

const · L2534–2534

<!-- note:SN_COLLAPSE_AT -->
Breakout + rise + plateau (cataclysm.js SN_PHASES): the moment the
photosphere stops being held up by recombination is when the core has gone.
<!-- /note -->

### <a id="s-collapseToHole"></a>`collapseToHole(star)`

function · **exported** · L2536–2547

- calls: [`logEvent`](#s-logEvent) · [`bodyPosition`](../world/bodies.js.md#s-bodyPosition) _js/world/bodies.js_ · [`collapseStar`](../world/events/holes.js.md#s-collapseStar) _js/world/events/holes.js_
- via [js/audio/index.js](../audio/index.js.md): `WARN.critical`
- called by: [`stepCataclysms`](#s-stepCataclysms)

<!-- note:collapseToHole -->
A star that went supernova leaves a black hole where it was.
<!-- /note -->

### <a id="s-summonHole"></a>`summonHole(opts=)`

function · **exported** · L2549–2564

- calls: [`logEvent`](#s-logEvent) · [`bodyById`](../world/bodies.js.md#s-bodyById) _js/world/bodies.js_ · [`bodyPosition`](../world/bodies.js.md#s-bodyPosition) _js/world/bodies.js_ · [`spawnTransit`](../world/events/holes.js.md#s-spawnTransit) _js/world/events/holes.js_

<!-- note:summonHole -->
Throw a transit remnant through the sky now (the console, a story, a test).
`aimBodyId` passes it inside that world's Roche limit.
<!-- /note -->

### <a id="s-_holeCtx"></a>`_holeCtx`

const · L2566–2573

<!-- note:_holeCtx -->
---- what a hole does to the things the sim owns ---------------------------

Filled in on each step, not here: several of these are bindings from modules
that cycle with this one, and touching them at load time is exactly what the
perf suite's "no top-level assignment through a cyclic binding" rule forbids.
<!-- /note -->

#### <a id="s-_holeCtx-damageBody"></a>`_holeCtx.damageBody(b, sev, n, r, speed)`

prop · L2569–2569

- calls: [`_holeCtx.damageBody`](#s-_holeCtx-damageBody)
- called by: [`_holeCtx.damageBody`](#s-_holeCtx-damageBody)

<!-- note:_holeCtx.damageBody -->
<!-- /note -->

#### <a id="s-_holeCtx-log"></a>`_holeCtx.log(text, kind)`

prop · L2571–2571

- calls: [`logEvent`](#s-logEvent)

<!-- note:_holeCtx.log -->
<!-- /note -->

### <a id="s-holeLoseStation"></a>`holeLoseStation(st, h)`

function · L2575–2583

- calls: [`dropStation`](#s-dropStation) · [`logEvent`](#s-logEvent)
- via [js/station/stations.js](../station/stations.js.md): `stations.indexOf`

<!-- note:holeLoseStation -->
<!-- /note -->

### <a id="s-holeRakeStation"></a>`holeRakeStation(st, h, frac)`

function · L2585–2590

- calls: [`logEvent`](#s-logEvent)

<!-- note:holeRakeStation -->
<!-- /note -->

### <a id="s-holeOnShip"></a>`holeOnShip(h, zone, d, dt)`

function · L2592–2616

- calls: [`applyDamage`](../flight/ship.js.md#s-applyDamage) _js/flight/ship.js_ ×3 · [`logEvent`](#s-logEvent) · [`holeRadii`](../world/events/holes.js.md#s-holeRadii) _js/world/events/holes.js_

<!-- note:holeOnShip -->
- L2607 · `const t = 1 - (d - R.horizon) / Math.max(1, R.burn - R.horizon);` — inside the ISCO the disk's own light is a furnace
- L2614 · `applyDamage(ship, 6 * t * dt, null, sim.time, "em");` — a hole's induced currents
<!-- /note -->

### <a id="s-holeRescue"></a>`holeRescue(ship, name)`

function · L2618–2642

- calls: [`cargoTotal`](../flight/ship.js.md#s-cargoTotal) _js/flight/ship.js_ · [`logEvent`](#s-logEvent)
- via [js/audio/index.js](../audio/index.js.md): `WARN.alarm`
- called by: [`stepShip`](#s-stepShip)

<!-- note:holeRescue -->
A hull lost at a hole. The breach handler's "hull 12, dead stop" was a
soft-lock here: the disk or the horizon took the 12 back next tick, the stop
pinned the ship in place, and SPACETIME SHEAR blocked the warp out — forever
at a remnant, which never moves. The beacon does what the stop could not:
the hold is gone, the hull comes back at the nearest friendly port.
<!-- /note -->

### <a id="s-loseHull"></a>`loseHull(ship, cause=)`

function · **exported** · L2644–2695

- calls: [`claim`](../economy/insurance.js.md#s-claim) _js/economy/insurance.js_ · [`playerKey`](../economy/insurance.js.md#s-playerKey) _js/economy/insurance.js_ · [`policyFor`](../economy/insurance.js.md#s-policyFor) _js/economy/insurance.js_ · [`yardQuote`](../economy/shipcost.js.md#s-yardQuote) _js/economy/shipcost.js_ · [`rankStatus`](../flight/pilot.js.md#s-rankStatus) _js/flight/pilot.js_ · [`hullMaxOf`](../flight/repair.js.md#s-hullMaxOf) _js/flight/repair.js_ · [`cargoTotal`](../flight/ship.js.md#s-cargoTotal) _js/flight/ship.js_ · [`shipById`](../ships/shipdb.js.md#s-shipById) _js/ships/shipdb.js_ ×2 · [`currentShipId`](#s-currentShipId) ×2 · [`logEvent`](#s-logEvent)
- via [js/audio/index.js](../audio/index.js.md): `WARN.alarm`
- called by: [`stepShip`](#s-stepShip)

<!-- note:loseHull -->
THE HULL IS GONE.

Until 0.3.33 this could not happen: hull at or below zero clamped to twelve
points and said "hull breach contained", which made every fight survivable
and made insurance meaningless — there was nothing to insure against. Now a
breach is a loss, and what you walk away with is what you paid an
underwriter for.

You are never stranded. The hull is struck off, the policy pays into your
purse, and you come to at the nearest port in whatever you still own — the
next hull on your books, or the trainer everyone starts in, which is what
`currentShipId()` falls back to when `activeHullId` is empty. A dead end
would be a worse game than a harsh one.

The hold goes with the hull. So does the cover: a policy is written against
one hull and consumed by its loss.

- L2647 · `const buyer = { complexId: pilot.complexId ?? null, letter: rankStatus()?.letter ?? null }` — a pilot with no complex has no rank, and rankStatus() answers null for
  them — losing a hull must not be the thing that throws
- L2654 · `sim.ownedHulls = (sim.ownedHulls ?? []).filter((h) => h !== id);` — struck off the books, and fall back to whatever is left
- L2656 · `sim.requestPersist = true;` — the loss is on the record before the next frame can be closed on
- L2661 · `let best = null, bd = Infinity;` — nearest port that will have you
<!-- /note -->

### <a id="s-HOLE_WARN"></a>`HOLE_WARN`

const · L2697–2697

<!-- note:HOLE_WARN -->
The dash: say it before it matters, and say it again as it gets worse.
<!-- /note -->

### <a id="s-watchHoles"></a>`watchHoles()`

function · L2698–2725

- calls: [`gnnPost`](../comms/gnn.js.md#s-gnnPost) _js/comms/gnn.js_ · [`holeClosing`](#s-holeClosing) · [`holeRadii`](../world/events/holes.js.md#s-holeRadii) _js/world/events/holes.js_ · [`nearestHole`](../world/events/holes.js.md#s-nearestHole) _js/world/events/holes.js_
- via [js/audio/index.js](../audio/index.js.md): `WARN.caution`, `WARN.critical`
- called by: [`stepWorld`](#s-stepWorld)

<!-- note:watchHoles -->
<!-- /note -->

### <a id="s-holeClosing"></a>`holeClosing(h)`

function · L2727–2732

- called by: [`watchHoles`](#s-watchHoles)

<!-- note:holeClosing -->
<!-- /note -->

### <a id="s-shatterBody"></a>`shatterBody(body)`

function · L2734–2742

- calls: [`logEvent`](#s-logEvent) · [`refreshBody`](../world/bodies.js.md#s-refreshBody) _js/world/bodies.js_ · [`rubbleRing`](../world/debris.js.md#s-rubbleRing) _js/world/debris.js_
- called by: [`damageBody`](#s-damageBody)

<!-- note:shatterBody -->
<!-- /note -->

### <a id="s-applyRemoteStrike"></a>`applyRemoteStrike(ev)`

function · **exported** · L2744–2751

- calls: [`impactSeverity`](#s-impactSeverity) · [`impactTier`](#s-impactTier) · [`onImpact`](#s-onImpact) · [`bodyById`](../world/bodies.js.md#s-bodyById) _js/world/bodies.js_
- via [js/world/events/impactors.js](../world/events/impactors.js.md): `impactors.findIndex`, `impactors.splice`
- called by: [`handleMessage`](../net/worldsync.js.md#s-handleMessage) _js/net/worldsync.js_

<!-- note:applyRemoteStrike -->
A strike the host saw. Mirrors apply it as if the rock had landed here too.
<!-- /note -->

### <a id="s-worldSnapshot"></a>`worldSnapshot()`

function · **exported** · L2753–2773

- calls: [`holeWire`](../world/events/holes.js.md#s-holeWire) _js/world/events/holes.js_ · [`impactorWire`](../world/events/impactors.js.md#s-impactorWire) _js/world/events/impactors.js_
- called by: [`tickWorldSync`](../net/worldsync.js.md#s-tickWorldSync) _js/net/worldsync.js_

<!-- note:worldSnapshot -->
---- the held sky: snapshots ----------------------------------------------
Everything that has HAPPENED to a sky, small enough to post: body damage
and climate, ports lost or disarmed or claimed, the live rocks, who has
been shot down. The host publishes it; a pilot joining later applies it and
sees the same craters, the same missing ring. (The clock and the market
desk need no snapshot — both are functions of the room's shared time.)
<!-- /note -->

### <a id="s-applyWorldSnapshot"></a>`applyWorldSnapshot(snap, {…}=)`

function · **exported** · L2775–2812

- calls: [`dropStation`](#s-dropStation) · [`stationById`](../station/stations.js.md#s-stationById) _js/station/stations.js_ · [`bodyById`](../world/bodies.js.md#s-bodyById) _js/world/bodies.js_ ×2 · [`refreshBody`](../world/bodies.js.md#s-refreshBody) _js/world/bodies.js_ ×2 · [`rubbleRing`](../world/debris.js.md#s-rubbleRing) _js/world/debris.js_ · [`adoptHoles`](../world/events/holes.js.md#s-adoptHoles) _js/world/events/holes.js_ · [`adoptImpactors`](../world/events/impactors.js.md#s-adoptImpactors) _js/world/events/impactors.js_
- called by: [`applySolPrime`](../net/worldsync.js.md#s-applySolPrime) _js/net/worldsync.js_ · [`pull`](../net/worldsync.js.md#s-pull) _js/net/worldsync.js_

<!-- note:applyWorldSnapshot -->
<!-- /note -->

### <a id="s-dropStation"></a>`dropStation(i)`

function · L2814–2819

- calls: [`setNavTarget`](#s-setNavTarget) · [`releaseBuilt`](../station/stationyard.js.md#s-releaseBuilt) _js/station/stationyard.js_
- via [js/station/stations.js](../station/stations.js.md): `stations.splice`
- called by: [`applyWorldSnapshot`](#s-applyWorldSnapshot) · [`holeLoseStation`](#s-holeLoseStation) · [`onImpact`](#s-onImpact)

<!-- note:dropStation -->
A port off the roster: its hull back to the yard, and the core no longer aimed at it.
<!-- /note -->

### <a id="s-impactTier"></a>`impactTier(sev)`

function · **exported** · L2821–2825

- called by: [`applyRemoteStrike`](#s-applyRemoteStrike) · [`onImpact`](#s-onImpact) · [`strikeBody`](#s-strikeBody)

<!-- note:impactTier -->
How a strike reads from orbit. Minor: a flash. Major: shock rings walking
the surface. Cataclysm: rings, a blast dome, a glowing scar, the sky full
of ejecta — and if you are close, the canopy whites out.
<!-- /note -->

### <a id="s-strikeBody"></a>`strikeBody(bodyId, r=, speed=, n=)`

function · **exported** · L2827–2835

- calls: [`impactSeverity`](#s-impactSeverity) · [`impactTier`](#s-impactTier) · [`onImpact`](#s-onImpact) · [`bodyById`](../world/bodies.js.md#s-bodyById) _js/world/bodies.js_ · [`bodyPosition`](../world/bodies.js.md#s-bodyPosition) _js/world/bodies.js_

<!-- note:strikeBody -->
Synthesize a strike (tests, stories, the console). Aims at the sunward face unless given a normal.
<!-- /note -->

### <a id="s-onImpact"></a>`onImpact(m, body, speed, n)`

function · L2837–2922

- calls: [`applyDamage`](../flight/ship.js.md#s-applyDamage) _js/flight/ship.js_ · [`clamp`](#s-clamp) ×3 · [`damageBody`](#s-damageBody) · [`dropStation`](#s-dropStation) · [`impactSeverity`](#s-impactSeverity) · [`impactTier`](#s-impactTier) · [`logEvent`](#s-logEvent) ×4 · [`startCataclysm`](#s-startCataclysm) · [`bodyPosition`](../world/bodies.js.md#s-bodyPosition) _js/world/bodies.js_ ×2 · [`bodyTempK`](../world/bodies.js.md#s-bodyTempK) _js/world/bodies.js_ · [`bodyVelocity`](../world/bodies.js.md#s-bodyVelocity) _js/world/bodies.js_ · [`dist3`](../world/bodies.js.md#s-dist3) _js/world/bodies.js_ · [`heatBody`](../world/bodies.js.md#s-heatBody) _js/world/bodies.js_ · [`isCataclysmic`](../world/events/cataclysm.js.md#s-isCataclysmic) _js/world/events/cataclysm.js_ · [`outcomeOf`](../world/events/cataclysm.js.md#s-outcomeOf) _js/world/events/cataclysm.js_ · [`startStrike`](../world/events/impacts.js.md#s-startStrike) _js/world/events/impacts.js_ · [`surfaceGravity`](../world/scale.js.md#s-surfaceGravity) _js/world/scale.js_
- via [js/audio/index.js](../audio/index.js.md): `SHIP.impact`
- called by: [`applyRemoteStrike`](#s-applyRemoteStrike) · [`strikeBody`](#s-strikeBody)

<!-- note:onImpact -->
- L2840 · `let run = null;` — A real rock (not a synthesized test mass) runs the rigid-body break-up —
  if it landed where anybody could see it; otherwise the old burst stands in.
- L2845 · `const still = !m.vx && !m.vy && !m.vz;` — a mirrored strike arrives with a speed and a normal but no velocity:
  the rock came in along the normal at that speed, relative to the world
- L2859 · `if (isCataclysmic(outcome)) startCataclysm(body, sev, n, outcome);` — anything from a resurfacing upward runs the staged event
- L2860 · `heatBody(body, clamp(sev * 900 + speed * 0.35, 30, 620));` — the strike dumps heat: kinetic scale, capped so a moonlet does not become a star
- L2863 · `sim.impactFX.push({ bodyId: body.id, n: { x: n.nx, y: n.ny, z: n.nz }, sev, tier: impactTi` — hand the renderer the strike: where, how hard, whether the world died
- L2865 · `if (sim.worldAuthority && !m.remote) {` — a held sky: the host tells everyone the rock landed, and where
- L2868 · `if (d < body.radius * 30) {` — close enough to a big one and the canopy whites out
- L2871 · `const blastR = body.radius * (2.5 + sev * 6);` — the blast wave does not care what it hits: ports, drones, guards, pilots,
  and you, out to a severity-scaled radius around the struck world
- L2876 · `` logEvent(`${st.name} lost with ${body.name} — no carrier from the ring`, "impact"); `` — a tethered port dies with its world
- L2918 · `if (d < body.radius * 14) {` — You feel a big one if you are anywhere near it.
<!-- /note -->

### <a id="s-CRUST_TINT"></a>`CRUST_TINT`

const · L2924–2927

<!-- note:CRUST_TINT -->
What crust a world throws, by kind — the run's chunks carry it as colour.
<!-- /note -->

### <a id="s-onRogueCollision"></a>`onRogueCollision(a, b, remote=)`

function · L2929–2953

- calls: [`gnnPost`](../comms/gnn.js.md#s-gnnPost) _js/comms/gnn.js_ · [`logEvent`](#s-logEvent) · [`onRogueCollision>wire`](#s-onRogueCollision-wire) ×2 · [`burst`](../world/debris.js.md#s-burst) _js/world/debris.js_ · [`startCollision`](../world/events/impacts.js.md#s-startCollision) _js/world/events/impacts.js_
- called by: [`applyRemoteRockHit`](#s-applyRemoteRockHit)

<!-- note:onRogueCollision -->
Two rogues met (impactors.js). Host only: a mirror is told and runs the same break-up.
<!-- /note -->

#### <a id="s-onRogueCollision-wire"></a>`onRogueCollision>wire(m)`

function · L2950–2950

- called by: [`onRogueCollision`](#s-onRogueCollision) ×2

<!-- note:onRogueCollision>wire -->
<!-- /note -->

### <a id="s-applyRemoteRockHit"></a>`applyRemoteRockHit(ev)`

function · **exported** · L2955–2963

- calls: [`onRogueCollision`](#s-onRogueCollision)
- via [js/world/events/impactors.js](../world/events/impactors.js.md): `impactors.findIndex`, `impactors.splice`
- called by: [`handleMessage`](../net/worldsync.js.md#s-handleMessage) _js/net/worldsync.js_

<!-- note:applyRemoteRockHit -->
A collision the host saw. The mirror runs it too, but spawns no rogue: the host's list carries that.
<!-- /note -->

### <a id="s-fragmentRogue"></a>`fragmentRogue(m)`

function · L2965–2968

- calls: [`logEvent`](#s-logEvent) · [`addRogue`](../world/events/impactors.js.md#s-addRogue) _js/world/events/impactors.js_

<!-- note:fragmentRogue -->
<!-- /note -->

### <a id="s-_impactCtx"></a>`_impactCtx`

const · L2969–2969

<!-- note:_impactCtx -->
<!-- /note -->

### <a id="s-onShipHit"></a>`onShipHit(m, speed)`

function · L2971–2986

- calls: [`applyDamage`](../flight/ship.js.md#s-applyDamage) _js/flight/ship.js_ · [`logEvent`](#s-logEvent) · [`burst`](../world/debris.js.md#s-burst) _js/world/debris.js_
- via [js/audio/index.js](../audio/index.js.md): `SHIP.impact`

<!-- note:onShipHit -->
<!-- /note -->

### <a id="s-SENSOR_R"></a>`SENSOR_R`

const · **exported** · L2988–2988

<!-- note:SENSOR_R -->
---- ops board ----------------------------------------------------------

How far the ship's sensors resolve solid things (u). Rocks and hulls are
only drawn inside this; beyond it the chart shows transponders and nothing
else. A pulse throws it out for 30 s; a scan-rated pilot sees further.
<!-- /note -->

### <a id="s-crewCapacity"></a>`crewCapacity()`

function · **exported** · L2989–2991

- calls: [`fx`](../economy/upgrades.js.md#s-fx) _js/economy/upgrades.js_ · [`shipById`](../ships/shipdb.js.md#s-shipById) _js/ships/shipdb.js_ · [`currentShipId`](#s-currentShipId)
- called by: [`bizReport`](../aria/company.js.md#s-bizReport) _js/aria/company.js_ · [`considerHire`](../aria/company.js.md#s-considerHire) _js/aria/company.js_ · [`considerSettle`](../aria/company.js.md#s-considerSettle) _js/aria/company.js_ · [`robotCapacity`](#s-robotCapacity) · [`stepCareer`](#s-stepCareer) · [`crewSection`](../station/deckhall.js.md#s-crewSection) _js/station/deckhall.js_ · [`floorSection`](../station/deckhall.js.md#s-floorSection) _js/station/deckhall.js_ · [`hallSection`](../station/deckhall.js.md#s-hallSection) _js/station/deckhall.js_

<!-- note:crewCapacity -->
Berths, in ONE place.

There were two: this number, which counts the quarters refit, and a second
one computed inline in the hiring hall straight off `shipById().stats.crew`,
which does not. So buying berths bought you nothing you could hire into —
but the robot yard reads this one, which is why a robot would still fit and
a person would not. Anything that asks "how many berths" asks here now.
<!-- /note -->

### <a id="s-robotCapacity"></a>`robotCapacity()`

function · **exported** · L2993–2995

- calls: [`fx`](../economy/upgrades.js.md#s-fx) _js/economy/upgrades.js_ · [`crewCapacity`](#s-crewCapacity)
- called by: [`stepCareer`](#s-stepCareer)

<!-- note:robotCapacity -->
Robot frames that do NOT take a crew berth (the frame racks refit).
<!-- /note -->

### <a id="s-repairAt"></a>`repairAt`

const · L2997–2997

<!-- note:repairAt -->
Nanofoam closes small breaches on its own; a bloom-regulated core opens them.
Both land here, once a cycle, so the two cancel honestly if you fit both.
<!-- /note -->

### <a id="s-tickHullRepair"></a>`tickHullRepair()`

function · L2998–3008

- calls: [`fx`](../economy/upgrades.js.md#s-fx) _js/economy/upgrades.js_
- called by: [`stepCareer`](#s-stepCareer)

<!-- note:tickHullRepair -->
- L3001 · `if (sim.time - repairAt < 90) return;` — one crew cycle (crew.js CYCLE_SECONDS)
<!-- /note -->

### <a id="s-sensorRange"></a>`sensorRange()`

function · **exported** · L3010–3013

- called by: [`remoteScan`](../flight/probes.js.md#s-remoteScan) _js/flight/probes.js_ · [`drawRange`](../render/engine.js.md#s-drawRange) _js/render/engine.js_

<!-- note:sensorRange -->
<!-- /note -->

### <a id="s-sensorPulse"></a>`sensorPulse()`

function · **exported** · L3015–3028

- calls: [`logEvent`](#s-logEvent)
- via [js/audio/index.js](../audio/index.js.md): `NAV.ping`, `WARN.deny`
- called by: [`mountHud`](../ui/hud.js.md#s-mountHud) _js/ui/hud.js_

<!-- note:sensorPulse -->
<!-- /note -->

### <a id="s-pulseActive"></a>`pulseActive()`

function · **exported** · L3030–3032

- called by: [`publishHud`](#s-publishHud)

<!-- note:pulseActive -->
<!-- /note -->

### <a id="s-autoLevel"></a>`autoLevel()`

function · **exported** · L3034–3039

- called by: [`mountHud`](../ui/hud.js.md#s-mountHud) _js/ui/hud.js_

<!-- note:autoLevel -->
<!-- /note -->

### <a id="s-cycleTimeScale"></a>`cycleTimeScale()`

function · **exported** · L3041–3049

- called by: [`mountHud`](../ui/hud.js.md#s-mountHud) _js/ui/hud.js_

<!-- note:cycleTimeScale -->
<!-- /note -->

### <a id="s-takeSalvageContract"></a>`takeSalvageContract(bodyId, rate)`

function · **exported** · L3051–3057

- calls: [`logEvent`](#s-logEvent) · [`bodyById`](../world/bodies.js.md#s-bodyById) _js/world/bodies.js_
- called by: [`stepNews.run~2`](../comms/comms.js.md#s-stepNews-run-2) _js/comms/comms.js_

<!-- note:takeSalvageContract -->
Salvage tractor: reels in nearby debris while it has power.

Start a GNN salvage contract on a shattered world's field.
<!-- /note -->

### <a id="s-stepContract"></a>`stepContract()`

function · **exported** · L3059–3078

- calls: [`logEvent`](#s-logEvent) ×2
- called by: [`stepCareer`](#s-stepCareer)

<!-- note:stepContract -->
- L3069 · `if (sim.ship.dockedAt && c.hauled > 0.5) {` — the charter pays on the spot when you dock with contract tonnage
<!-- /note -->

### <a id="s-stepSalvage"></a>`stepSalvage(dt)`

function · L3080–3103

- calls: [`addCargo`](../flight/ship.js.md#s-addCargo) _js/flight/ship.js_ · [`cargoTotal`](../flight/ship.js.md#s-cargoTotal) _js/flight/ship.js_ · [`bodyById`](../world/bodies.js.md#s-bodyById) _js/world/bodies.js_ · [`bodyPosition`](../world/bodies.js.md#s-bodyPosition) _js/world/bodies.js_ · [`dist3`](../world/bodies.js.md#s-dist3) _js/world/bodies.js_ · [`chunkMass`](../world/debris.js.md#s-chunkMass) _js/world/debris.js_ · [`nearDebris`](../world/debris.js.md#s-nearDebris) _js/world/debris.js_ · [`removeChunk`](../world/debris.js.md#s-removeChunk) _js/world/debris.js_
- via [js/world/debris.js](../world/debris.js.md): `nearDebris.filter`
- called by: [`stepWorld`](#s-stepWorld)

<!-- note:stepSalvage -->
- L3086 · `const near = nearDebris(ship.pos, 2200 * reach).filter((e) => !e.c.driven);` — pieces an impact run still drives are overwritten every tick: they held the six slots for up to 26 s
- L3088 · `const k = (240 * reach * dt) / Math.max(d, 1);` — pull it in, then take it aboard
- L3095 · `const con = sim.contract;` — contract tonnage: anything tractored inside the contracted world's old well
<!-- /note -->

### <a id="s-cycleTurretMode"></a>`cycleTurretMode(dir=)`

function · **exported** · L3105–3114

- calls: [`logEvent`](#s-logEvent)
- via [js/flight/ship.js](../flight/ship.js.md): `TURRET_MODES.findIndex`
- called by: [`tickSim`](#s-tickSim) · [`mountHud`](../ui/hud.js.md#s-mountHud) _js/ui/hud.js_

<!-- note:cycleTurretMode -->
---- systems ------------------------------------------------------------
<!-- /note -->

### <a id="s-setTurretMode"></a>`setTurretMode(id)`

function · **exported** · L3116–3125

- calls: [`record`](../flight/recorder.js.md#s-record) _js/flight/recorder.js_ · [`logEvent`](#s-logEvent)
- via [js/flight/ship.js](../flight/ship.js.md): `TURRET_MODES.find`
- called by: [`tickAriaPilot`](../aria/pilot.js.md#s-tickAriaPilot) _js/aria/pilot.js_ · [`readyForTrouble`](../aria/play.js.md#s-readyForTrouble) _js/aria/play.js_ · [`applyPosture`](../console/panels/ship.js.md#s-applyPosture) _js/console/panels/ship.js_ · [`mountSystems`](../console/panels/ship.js.md#s-mountSystems) _js/console/panels/ship.js_ · [`search.run~2`](../console/panels/ship.js.md#s-search-run-2) _js/console/panels/ship.js_ · [`EXEC.SET`](../mission/run.js.md#s-EXEC-SET) _js/mission/run.js_ · [`execute`](../npc/captain.js.md#s-execute) _js/npc/captain.js_ ×2

<!-- note:setTurretMode -->
Jump straight to a rule — the terminal shows all of them at once.
<!-- /note -->

### <a id="s-setMiningMode"></a>`setMiningMode(id, {…}=)`

function · **exported** · L3127–3136

- calls: [`record`](../flight/recorder.js.md#s-record) _js/flight/recorder.js_ · [`logEvent`](#s-logEvent)
- via [js/flight/ship.js](../flight/ship.js.md): `MINING_MODES.find`
- called by: [`tickAriaPilot`](../aria/pilot.js.md#s-tickAriaPilot) _js/aria/pilot.js_ · [`applyPosture`](../console/panels/ship.js.md#s-applyPosture) _js/console/panels/ship.js_ · [`mountSystems`](../console/panels/ship.js.md#s-mountSystems) _js/console/panels/ship.js_ · [`search.run~3`](../console/panels/ship.js.md#s-search-run-3) _js/console/panels/ship.js_ · [`apMine`](../flight/autopilot.js.md#s-apMine) _js/flight/autopilot.js_ ×3 · [`releaseControls`](../flight/autopilot.js.md#s-releaseControls) _js/flight/autopilot.js_ · [`tickAutopilot`](../flight/autopilot.js.md#s-tickAutopilot) _js/flight/autopilot.js_ · [`EXEC.SET`](../mission/run.js.md#s-EXEC-SET) _js/mission/run.js_ · [`execute`](../npc/captain.js.md#s-execute) _js/npc/captain.js_ ×2 · [`wireMiningHooks`](#s-wireMiningHooks) · [`mountHud`](../ui/hud.js.md#s-mountHud) _js/ui/hud.js_ ×2

<!-- note:setMiningMode -->
- L3132 · `if (quiet) return m;` — the autopilot stowing its own cutter must not talk over its engage notice
<!-- /note -->

### <a id="s-cycleMiningMode"></a>`cycleMiningMode(dir=)`

function · **exported** · L3138–3146

- calls: [`logEvent`](#s-logEvent)
- via [js/flight/ship.js](../flight/ship.js.md): `MINING_MODES.findIndex`
- called by: [`tickSim`](#s-tickSim) · [`mountHud`](../ui/hud.js.md#s-mountHud) _js/ui/hud.js_

<!-- note:cycleMiningMode -->
<!-- /note -->

### <a id="s-TOGGLE_TEXT"></a>`TOGGLE_TEXT`

const · L3148–3161

<!-- note:TOGGLE_TEXT -->
<!-- /note -->

#### <a id="s-TOGGLE_TEXT-shields"></a>`TOGGLE_TEXT.shields(on)`

prop · L3149–3149

<!-- note:TOGGLE_TEXT.shields -->
<!-- /note -->

#### <a id="s-TOGGLE_TEXT-turretsArmed"></a>`TOGGLE_TEXT.turretsArmed(on)`

prop · L3150–3150

<!-- note:TOGGLE_TEXT.turretsArmed -->
<!-- /note -->

#### <a id="s-TOGGLE_TEXT-engines"></a>`TOGGLE_TEXT.engines(on)`

prop · L3151–3151

<!-- note:TOGGLE_TEXT.engines -->
<!-- /note -->

#### <a id="s-TOGGLE_TEXT-pressurized"></a>`TOGGLE_TEXT.pressurized(on)`

prop · L3152–3153

<!-- note:TOGGLE_TEXT.pressurized -->
<!-- /note -->

#### <a id="s-TOGGLE_TEXT-localGravity"></a>`TOGGLE_TEXT.localGravity(on)`

prop · L3154–3154

<!-- note:TOGGLE_TEXT.localGravity -->
<!-- /note -->

#### <a id="s-TOGGLE_TEXT-assist"></a>`TOGGLE_TEXT.assist(on)`

prop · L3155–3155

<!-- note:TOGGLE_TEXT.assist -->
<!-- /note -->

#### <a id="s-TOGGLE_TEXT-lights"></a>`TOGGLE_TEXT.lights(on)`

prop · L3156–3156

<!-- note:TOGGLE_TEXT.lights -->
<!-- /note -->

#### <a id="s-TOGGLE_TEXT-sentry"></a>`TOGGLE_TEXT.sentry(on)`

prop · L3157–3157

<!-- note:TOGGLE_TEXT.sentry -->
<!-- /note -->

#### <a id="s-TOGGLE_TEXT-salvage"></a>`TOGGLE_TEXT.salvage(on)`

prop · L3158–3158

<!-- note:TOGGLE_TEXT.salvage -->
<!-- /note -->

#### <a id="s-TOGGLE_TEXT-matchLock"></a>`TOGGLE_TEXT.matchLock(on)`

prop · L3159–3160

<!-- note:TOGGLE_TEXT.matchLock -->
<!-- /note -->

### <a id="s-toggleSystem"></a>`toggleSystem(key)`

function · **exported** · L3163–3182

- calls: [`record`](../flight/recorder.js.md#s-record) _js/flight/recorder.js_ · [`logEvent`](#s-logEvent)
- via [js/audio/index.js](../audio/index.js.md): `WARN.deny`
- called by: [`tickAriaPilot`](../aria/pilot.js.md#s-tickAriaPilot) _js/aria/pilot.js_ ×3 · [`mountSystems`](../console/panels/ship.js.md#s-mountSystems) _js/console/panels/ship.js_ ×6 · [`EXEC.SET`](../mission/run.js.md#s-EXEC-SET) _js/mission/run.js_ · [`tickSim`](#s-tickSim) ×6 · [`mountHud`](../ui/hud.js.md#s-mountHud) _js/ui/hud.js_ ×2

<!-- note:toggleSystem -->
<!-- /note -->

### <a id="s-setThrottle"></a>`setThrottle(v)`

function · **exported** · L3184–3190

- calls: [`record`](../flight/recorder.js.md#s-record) _js/flight/recorder.js_ · [`clamp`](#s-clamp)
- called by: [`apDock`](../flight/autopilot.js.md#s-apDock) _js/flight/autopilot.js_ ×3 · [`apHold`](../flight/autopilot.js.md#s-apHold) _js/flight/autopilot.js_ · [`apLeg`](../flight/autopilot.js.md#s-apLeg) _js/flight/autopilot.js_ ×2 · [`apMine`](../flight/autopilot.js.md#s-apMine) _js/flight/autopilot.js_ · [`apPark`](../flight/autopilot.js.md#s-apPark) _js/flight/autopilot.js_ · [`apSteer`](../flight/autopilot.js.md#s-apSteer) _js/flight/autopilot.js_ ×2 · [`flyTheLane`](../flight/autopilot.js.md#s-flyTheLane) _js/flight/autopilot.js_ ×2 · [`releaseControls`](../flight/autopilot.js.md#s-releaseControls) _js/flight/autopilot.js_ · [`execute`](../npc/captain.js.md#s-execute) _js/npc/captain.js_ ×7 · [`retakeCommand`](../npc/captain.js.md#s-retakeCommand) _js/npc/captain.js_ · [`steerToward`](../npc/captain.js.md#s-steerToward) _js/npc/captain.js_ · [`setTune`](#s-setTune) · [`stepShip`](#s-stepShip) ×5 · [`bindThrottle`](../ui/hud.js.md#s-bindThrottle) _js/ui/hud.js_ · [`bindThrottle>end`](../ui/hud.js.md#s-bindThrottle-end) _js/ui/hud.js_ · [`bindThrottle>set`](../ui/hud.js.md#s-bindThrottle-set) _js/ui/hud.js_

<!-- note:setThrottle -->
- L3189 · `if (Math.abs(sim.ship.throttle - was) >= 0.1) tapeRecord("order", "throttle", sim.ship.thr` — A stick sends this every frame it is held. What belongs on the tape is the
  DECISION, not the sweep, so only a tenth-of-a-notch move is filed.
<!-- /note -->

### <a id="s-throttleCap"></a>`throttleCap()`

function · **exported** · L3192–3194

- called by: [`stepThrustCap`](../mission/run.js.md#s-stepThrustCap) _js/mission/run.js_ · [`publishHud`](#s-publishHud) · [`stepShip`](#s-stepShip) ×3

<!-- note:throttleCap -->
<!-- /note -->

### <a id="s-stepShip"></a>`stepShip(a, dt)`

function · L3196–3287

- calls: [`consumeLook`](../core/input.js.md#s-consumeLook) _js/core/input.js_ · [`justPressed`](../core/input.js.md#s-justPressed) _js/core/input.js_ · [`tickContacts`](../flight/contacts.js.md#s-tickContacts) _js/flight/contacts.js_ · [`buildDemand`](../flight/ship.js.md#s-buildDemand) _js/flight/ship.js_ · [`gravityAt`](../flight/ship.js.md#s-gravityAt) _js/flight/ship.js_ · [`stepAttitude`](../flight/ship.js.md#s-stepAttitude) _js/flight/ship.js_ · [`stepPower`](../flight/ship.js.md#s-stepPower) _js/flight/ship.js_ · [`stepTranslation`](../flight/ship.js.md#s-stepTranslation) _js/flight/ship.js_ · [`stepTurrets`](../flight/turrets.js.md#s-stepTurrets) _js/flight/turrets.js_ · [`clamp`](#s-clamp) · [`dockPortFor`](#s-dockPortFor) · [`expo`](#s-expo) ×2 · [`holeRescue`](#s-holeRescue) · [`loseHull`](#s-loseHull) · [`setThrottle`](#s-setThrottle) ×5 · [`stepCollisions`](#s-stepCollisions) · [`stepLock`](#s-stepLock) · [`syncHullTune`](#s-syncHullTune) · [`targetVelocity`](#s-targetVelocity) · [`throttleCap`](#s-throttleCap) ×3 · [`updateAvoidance`](#s-updateAvoidance) · [`updateHold`](#s-updateHold) · [`bodyVelocity`](../world/bodies.js.md#s-bodyVelocity) _js/world/bodies.js_
- called by: [`tickSim`](#s-tickSim) ×2

<!-- note:stepShip -->
---- main tick ----------------------------------------------------------

- L3199 · `const look = consumeLook();` — 1. Aim. Panning is pointing: the reticle IS the nose vector.
- L3200 · `const tune = ship.tune;` — Increasing yaw swings the nose to port, so stick-right has to subtract.
  This is the single place pan reaches the heading, so the stick, the
  keyboard and the gamepad all get the fix at once.
- L3200 · `const tune = ship.tune;` — Expo shapes the stick, then a low-pass ramps it. Between them a thumb
  flick becomes a sweep instead of a jerk.
- L3209 · `if (justPressed("cruise")) {` — 2. Throttle. The slider writes it directly; keys nudge it.
  Shift is the boost — mains to the cap while it is held. Shift+Ctrl sets
  CRUISE: the boosted setting stays after the keys lift, until anything
  touches the thrusters (slider, steps, X, brake, RCS).
- L3238 · `const demand = buildDemand(ship, rcsMag, a.brake, sim.warp.state === "spool" ? WARP.draw :` — 3. Power before motion — a brownout must derate this tick's burn.
- L3238 · `const demand = buildDemand(ship, rcsMag, a.brake, sim.warp.state === "spool" ? WARP.draw :` — A spooling core is the single heaviest thing on the bus.
- L3245 · `const dom = gravityAt(ship.pos, sim.time, bodyPosition, _g);` — 4. Gravity, attitude, translation.
- L3259 · `stepLock(dt);` — MATCH flies you into the locked target's own frame rather than the frame
  of whatever well you happen to be in.
- L3266 · `sim.dockPort = dockPortFor(ship);` — A berth asked for: fly in the PORT's frame. The assist, the brake and the
  hold all worked relative to the well you were in, so beside a port carried
  round its world at 50–280 u/s, BRAKE stopped you dead in the world's frame
  while the port sailed on — the approach chased the entry gate in circles,
  never under the tractor's 150 u/s capture limit, and nothing ever caught the
  ship. The port's own velocity is the only frame a docking lane makes sense in.
- L3274 · `updateAvoidance(ship);` — What the flight assist is allowed to dodge. Computed here, where every
  hazard source is already imported, and handed to the flight model as a
  plain vector — ship.js must not reach back into the sim for it.
- L3284 · `const hit = ship.lastHitBy && sim.time - (ship.lastHitAt ?? -1e9) < 12 ? ship.lastHitBy :` — blame whatever last put a round into you, if it was recent enough to be
  the reason — scraping a rock ten minutes ago is not what killed you
<!-- /note -->

### <a id="s-shiftClock"></a>`shiftClock(dt)`

function · **exported** · L3289–3307

- calls: [`gravityAt`](../flight/ship.js.md#s-gravityAt) _js/flight/ship.js_ · [`dockPortFor`](#s-dockPortFor) · [`bodyPosition`](../world/bodies.js.md#s-bodyPosition) _js/world/bodies.js_ ×2 · [`bodyVelocity`](../world/bodies.js.md#s-bodyVelocity) _js/world/bodies.js_ ×2
- called by: [`poll`](../net/net.js.md#s-poll) _js/net/net.js_ ×2 · [`applySolPrime`](../net/worldsync.js.md#s-applySolPrime) _js/net/worldsync.js_

<!-- note:shiftClock -->
The shared-sky clock chase moves `sim.time` in a jump (js/net/net.js). Every world,
port and rock is a function of that clock, so they leapt a second or more
along their rails while the hull stayed where it was: on a slow phone, polled
every quarter second, a port running at 150 u/s slid 50–100 u away per poll
faster than any approach could close, so the autopilot circled it and nothing
ever came in range of the tractor. The hull now rides the jump in whatever
frame it is flying in — the port it is docking at, else the well it is in.

- L3296 · `if (ship.dockedAt || tractor.active) return;` — clampDocked and the tractor re-seat the hull off the new clock
- L3298 · `ship.pos.x += (port.vx ?? 0) * dt; ship.pos.y += (port.vy ?? 0) * dt; ship.pos.z += (port.` — a berth request is a short-range frame and its corrections are small
- L3301 · `const dom = sim.dominant ?? gravityAt(ship.pos, t0, bodyPosition, _clockG).body;` — 0.3.55 — carry the hull with the world it is near, by where that world IS
  at the new time. This used to be `velocity × dt`: a straight line along
  the world's orbit. Fine for the quarter-second nudges of the clock chase;
  not for JOINING a shared sky, where the clock jumps by the room's whole
  age at once. Reported: you spawn into an asteroid field, then get thrown
  back to the normal spawn. Measured: launch at sky time 0 beside Earth, the
  relay says the room is on day 41 (a 28,890 s jump), and the straight line
  put the hull 950,000 u off Earth, in the main belt — or, when the first
  poll landed before the first tick had found Earth at all, left it behind
  in empty space. When a relay restart moved the room's clock back, the
  same thing ran the other way. Now the hull keeps its place and its motion
  relative to its world for any jump, forward or back.
- L3302 · `if (!dom || dom.kind === "star") return;` — the star does not move
<!-- /note -->

### <a id="s-_clockA"></a>`_clockA`

const · L3308–3308

<!-- note:_clockA -->
<!-- /note -->

### <a id="s-_clockB"></a>`_clockB`

const · L3309–3309

<!-- note:_clockB -->
<!-- /note -->

### <a id="s-_clockG"></a>`_clockG`

const · L3310–3310

<!-- note:_clockG -->
<!-- /note -->

### <a id="s-DOCK_FRAME_R"></a>`DOCK_FRAME_R`

const · L3312–3312

<!-- note:DOCK_FRAME_R -->
The port whose frame the hull flies in: a live berth request (yours or the autopilot's) inside 30 km.
<!-- /note -->

### <a id="s-dockPortFor"></a>`dockPortFor(ship)`

function · L3313–3321

- calls: [`stationById`](../station/stations.js.md#s-stationById) _js/station/stations.js_ ×3 · [`hasDockRequest`](../station/stationworks.js.md#s-hasDockRequest) _js/station/stationworks.js_
- called by: [`shiftClock`](#s-shiftClock) · [`stepShip`](#s-stepShip)

<!-- note:dockPortFor -->
- L3316 · `const id = (dockRequest.stId && hasDockRequest(stationById(dockRequest.stId) ?? { id: null` — a berth you asked for, the one the autopilot filed, or the port the autopilot is flying to
<!-- /note -->

### <a id="s-_avoidDir"></a>`_avoidDir`

const · L3323–3323

<!-- note:_avoidDir -->
---- flight assist: collision avoidance --------------------------------
The assist trimmed drift and nothing else, so a hull under assist would
fly into a rock or a station at whatever speed it was carrying. It now
looks ahead and pushes off — but only at what you are NOT approaching on
purpose, because mining and docking are both "fly at that thing".
<!-- /note -->

### <a id="s-avoidAt"></a>`avoidAt`

const · L3324–3324

<!-- note:avoidAt -->
<!-- /note -->

### <a id="s-updateAvoidance"></a>`updateAvoidance(ship)`

function · L3326–3348

- calls: [`avoidAim`](../flight/avoid.js.md#s-avoidAim) _js/flight/avoid.js_ · [`avoidLevel`](../flight/avoid.js.md#s-avoidLevel) _js/flight/avoid.js_ · [`deliberate`](../flight/avoid.js.md#s-deliberate) _js/flight/avoid.js_ · [`surfaceOnly`](../flight/avoid.js.md#s-surfaceOnly) _js/flight/avoid.js_ · [`threatTo`](../flight/avoid.js.md#s-threatTo) _js/flight/avoid.js_ · [`updateAvoidance>off`](#s-updateAvoidance-off)
- called by: [`stepShip`](#s-stepShip)

<!-- note:updateAvoidance -->
- L3338 · `ship.avoid = null;` — Level 1 is a warning, not a manoeuvre: the HUD says something is in the
  way and the pilot gets to decide. The assist only takes a hand when
  there is no longer time to.
<!-- /note -->

#### <a id="s-updateAvoidance-off"></a>`updateAvoidance>off()`

function · L3327–3327

- called by: [`updateAvoidance`](#s-updateAvoidance)

<!-- note:updateAvoidance>off -->
<!-- /note -->

### <a id="s-tickSim"></a>`tickSim(dt)`

function · **exported** · L3350–3457

- calls: [`setEngineLevel`](../audio/index.js.md#s-setEngineLevel) _js/audio/index.js_ ×3 · [`consumeLook`](../core/input.js.md#s-consumeLook) _js/core/input.js_ · [`justPressed`](../core/input.js.md#s-justPressed) _js/core/input.js_ ×16 · [`sampleInput`](../core/input.js.md#s-sampleInput) _js/core/input.js_ · [`speedOf`](../flight/ship.js.md#s-speedOf) _js/flight/ship.js_ ×2 · [`stepMining`](../flight/turrets.js.md#s-stepMining) _js/flight/turrets.js_ ×2 · [`stepShots`](../flight/turrets.js.md#s-stepShots) _js/flight/turrets.js_ ×2 · [`syncContacts`](../flight/turrets.js.md#s-syncContacts) _js/flight/turrets.js_ ×2 · [`broadcastShip`](#s-broadcastShip) ×2 · [`clampDocked`](#s-clampDocked) ×2 · [`collectBeaconsNear`](#s-collectBeaconsNear) ×2 · [`cycleMiningMode`](#s-cycleMiningMode) · [`cycleTurretMode`](#s-cycleTurretMode) · [`sampleTelemetry`](#s-sampleTelemetry) · [`setTerminal`](#s-setTerminal) · [`stepShip`](#s-stepShip) ×2 · [`stepTractorTick`](#s-stepTractorTick) ×2 · [`stepWarp`](#s-stepWarp) ×2 · [`stepWorld`](#s-stepWorld) ×2 · [`toggleDock`](#s-toggleDock) · [`toggleSystem`](#s-toggleSystem) ×6 · [`toggleWarp`](#s-toggleWarp) · [`tryScan`](#s-tryScan) ×2 · [`wrapPi`](#s-wrapPi) · [`handlingLeft`](../station/dockwork.js.md#s-handlingLeft) _js/station/dockwork.js_ · [`stepDockwork`](../station/dockwork.js.md#s-stepDockwork) _js/station/dockwork.js_ · [`stepStations`](../station/stations.js.md#s-stepStations) _js/station/stations.js_
- via [js/core/store.js](../core/store.js.md): `useGameStore.getState`, `useGameStore.getState.setMapOpen`, `useGameStore.getState.setPhase`
- called by: [`mountGame>tick`](../render/engine.js.md#s-mountGame-tick) _js/render/engine.js_

<!-- note:tickSim -->
- L3368 · `stepDockwork(d * (sim.phase === "play" ? sim.timeScale : 1), sim.ship?.dockedAt ?? null);` — the crane runs whether or not the hull is flying — it is the reason it is not
- L3369 · `if (sim.undockWhenClear) {` — 0.3.75: a departure booked while the crane worked goes the moment it is done
- L3379 · `stepStations(sim.time);` — Stations move to THIS tick's time before anything is glued to them.
  stepWorld() also steps them, but it runs at the end of the tick — so
  clampDocked() and the tractor were snapping the ship relative to where
  the station was LAST tick, and stepWorld then moved the station out from
  under it. One frame of lag, st.v × dt of error: invisible at 16 ms,
  a 10–30 u pop on a hitched frame — inside a 20 u aperture. A docked or
  tractored hull now rides the station exactly; the second call inside
  stepWorld recomputes the same rail positions and is idempotent.
- L3384 · `if (sim.terminalOpen) {` — With the terminal up you are reading gauges, not flying. New stick, RCS
  and throttle input is ignored; the ship keeps its vector and the reactor
  keeps working. HOLD is the one control that still reaches the thrusters.
- L3406 · `stepMining(sim.ship, d, sim.time, sim.lock, sim.handsOff ? sim.autoPlan?.seamOre ?? null :` — the ore a contract named, but only while the loop is flying: your own hand at the cutter cuts whatever you point it at
- L3408 · `collectBeaconsNear();` — 0.3.73: the ship is still flying with the console up — it still picks up
  beacons, and it still tells the room where it is. This branch returned
  before the broadcast, so the relay aged the pilot out after a few seconds
  of reading gauges; closing the console rejoined it as a stranger.
- L3423 · `if (sim.remotes.size > 0 && sim.timeScale !== 1) sim.timeScale = 1;` — two pilots in one room keep one clock — time-warp would desync the sky
<!-- /note -->

### <a id="s-collectBeaconsNear"></a>`collectBeaconsNear()`

function · L3459–3464

- calls: [`collectBeacon`](#s-collectBeacon) · [`beaconPosition`](../world/bodies.js.md#s-beaconPosition) _js/world/bodies.js_ · [`dist3`](../world/bodies.js.md#s-dist3) _js/world/bodies.js_
- called by: [`tickSim`](#s-tickSim) ×2

<!-- note:collectBeaconsNear -->
<!-- /note -->

### <a id="s-broadcastShip"></a>`broadcastShip(d)`

function · L3466–3483

- calls: [`speedOf`](../flight/ship.js.md#s-speedOf) _js/flight/ship.js_ · [`currentShipId`](#s-currentShipId)
- called by: [`tickSim`](#s-tickSim) ×2

<!-- note:broadcastShip -->
Where this pilot is, for the room — 20 Hz at most, the relay rate-limits further.
<!-- /note -->

### <a id="s-_gImp"></a>`_gImp`

const · L3485–3485

<!-- note:_gImp -->
<!-- /note -->

### <a id="s-_bv"></a>`_bv`

const · L3486–3486

<!-- note:_bv -->
<!-- /note -->

### <a id="s-stepPorts"></a>`stepPorts(dt)`

function · L3488–3514

- via [js/flight/turrets.js](../flight/turrets.js.md): `contacts.push`
- called by: [`stepWorld`](#s-stepWorld)

<!-- note:stepPorts -->
Everything that happens out there whether or not you are looking.

Free ports keep guns. They only wake up when somebody is close enough to rob.

- L3491 · `if ((st.truceUntil ?? -1) > sim.time) continue;` — toll paid — the watch stays in its holes
<!-- /note -->

### <a id="s-clampDocked"></a>`clampDocked()`

function · L3516–3531

- calls: [`stationById`](../station/stations.js.md#s-stationById) _js/station/stations.js_
- called by: [`tickSim`](#s-tickSim) ×2

<!-- note:clampDocked -->
Clamps are clamps. A docked hull rides the ring wherever the ring goes —
including at 8x and 40x, where the port outruns anything the hold could
follow and the ship would otherwise be left hanging in space.
<!-- /note -->

### <a id="s-_crewFxAt"></a>`_crewFxAt`

const · L3533–3533

<!-- note:_crewFxAt -->
The ladder advances off the work, not off a menu. Every second you spend
cutting rock, holding a lock, hauling cargo or being shot at pays the skill
that shift would actually have taught you.
<!-- /note -->

### <a id="s-stepCareer"></a>`stepCareer(d)`

function · L3534–3595

- calls: [`tickCompany`](../corp/company.js.md#s-tickCompany) _js/corp/company.js_ · [`tickCrew`](../crew/ledger.js.md#s-tickCrew) _js/crew/ledger.js_ · [`tickRobots`](../crew/robots.js.md#s-tickRobots) _js/crew/robots.js_ · [`stepIcework`](../economy/icework.js.md#s-stepIcework) _js/economy/icework.js_ · [`rankStatus`](../flight/pilot.js.md#s-rankStatus) _js/flight/pilot.js_ · [`serveTime`](../flight/pilot.js.md#s-serveTime) _js/flight/pilot.js_ · [`syncMods`](../flight/pilot.js.md#s-syncMods) _js/flight/pilot.js_ · [`takePayout`](../flight/pilot.js.md#s-takePayout) _js/flight/pilot.js_ · [`work`](../flight/pilot.js.md#s-work) _js/flight/pilot.js_ ×13 · [`tickPatchDrone`](../flight/repair.js.md#s-tickPatchDrone) _js/flight/repair.js_ · [`tickBoarding`](../interior/boarding.js.md#s-tickBoarding) _js/interior/boarding.js_ · [`crewEffects`](../npc/crewfx.js.md#s-crewEffects) _js/npc/crewfx.js_ · [`updateCrewMods`](../npc/crewfx.js.md#s-updateCrewMods) _js/npc/crewfx.js_ · [`crewCapacity`](#s-crewCapacity) · [`currentShipId`](#s-currentShipId) ×2 · [`logEvent`](#s-logEvent) ×2 · [`persistProgress`](#s-persistProgress) · [`robotCapacity`](#s-robotCapacity) · [`stepContract`](#s-stepContract) · [`stepMarket`](#s-stepMarket) · [`tickHullRepair`](#s-tickHullRepair) · [`coolBodies`](../world/bodies.js.md#s-coolBodies) _js/world/bodies.js_ · [`stepAtmoWorks`](../world/events/atmoworks.js.md#s-stepAtmoWorks) _js/world/events/atmoworks.js_
- called by: [`stepWorld`](#s-stepWorld)

<!-- note:stepCareer -->
- L3552 · `if ((Math.abs(Math.round(sim.ship.credits) - (sim.walletSaved ?? 0)) >= 1 || pilot.dirty)` — the wallet: a credit moved and half a minute passed since the last write —
  scans and beacons write at once, this is for the trade that never scans
- L3558 · `const pay = takePayout();` — the ladder pays every cycle; the statement prints when you next dock
- L3572 · `work("geology", 2);` — a called-in vein is real prospecting
<!-- /note -->

### <a id="s-stepWorld"></a>`stepWorld(d)`

function · L3597–3649

- calls: [`tickFleet`](../corp/fleet.js.md#s-tickFleet) _js/corp/fleet.js_ · [`stepSecLevel`](../corp/seclevel.js.md#s-stepSecLevel) _js/corp/seclevel.js_ · [`stepNpcDrones`](../drones/npcdrones.js.md#s-stepNpcDrones) _js/drones/npcdrones.js_ · [`stepDroneOps`](../drones/ops.js.md#s-stepDroneOps) _js/drones/ops.js_ · [`tickContracts`](../economy/contracts.js.md#s-tickContracts) _js/economy/contracts.js_ · [`stepEconomy`](../economy/economy.js.md#s-stepEconomy) _js/economy/economy.js_ · [`stepFab`](../economy/fabricate.js.md#s-stepFab) _js/economy/fabricate.js_ · [`tickAutopilot`](../flight/autopilot.js.md#s-tickAutopilot) _js/flight/autopilot.js_ · [`stepProbes`](../flight/probes.js.md#s-stepProbes) _js/flight/probes.js_ · [`stepBattles`](../npc/battles.js.md#s-stepBattles) _js/npc/battles.js_ · [`tickCaptain`](../npc/captain.js.md#s-tickCaptain) _js/npc/captain.js_ · [`stepNpcCombat`](../npc/combat.js.md#s-stepNpcCombat) _js/npc/combat.js_ · [`stepFlow`](../npc/flow.js.md#s-stepFlow) _js/npc/flow.js_ · [`stepRogues`](../npc/rogues.js.md#s-stepRogues) _js/npc/rogues.js_ · [`stepSecurity`](../npc/security.js.md#s-stepSecurity) _js/npc/security.js_ · [`stepTraffic`](../npc/traffic.js.md#s-stepTraffic) _js/npc/traffic.js_ · [`stepCareer`](#s-stepCareer) · [`stepCataclysms`](#s-stepCataclysms) · [`stepLaneDiscipline`](#s-stepLaneDiscipline) · [`stepPorts`](#s-stepPorts) · [`stepSalvage`](#s-stepSalvage) · [`watchHoles`](#s-watchHoles) · [`stepStations`](../station/stations.js.md#s-stepStations) _js/station/stations.js_ · [`stepStationWorks`](../station/stationworks.js.md#s-stepStationWorks) _js/station/stationworks.js_ · [`stepDebris`](../world/debris.js.md#s-stepDebris) _js/world/debris.js_ · [`stepHoles`](../world/events/holes.js.md#s-stepHoles) _js/world/events/holes.js_ · [`emptyThreatBoard`](../world/events/impactors.js.md#s-emptyThreatBoard) _js/world/events/impactors.js_ · [`stepImpactors`](../world/events/impactors.js.md#s-stepImpactors) _js/world/events/impactors.js_ · [`threatBoard`](../world/events/impactors.js.md#s-threatBoard) _js/world/events/impactors.js_ · [`stepImpacts`](../world/events/impacts.js.md#s-stepImpacts) _js/world/events/impacts.js_
- called by: [`tickSim`](#s-tickSim) ×2 · [`tickSolHost`](#s-tickSolHost)

<!-- note:stepWorld -->
- L3599 · `stepTraffic(sim.time, d, stations, currentSystem, sim.soloHost ? null : sim.ship.pos);` — the player's position is what decides the far-field detail budget and
  which fights fly real rounds, so the sky is told where the player is
- L3599 · `stepTraffic(sim.time, d, stations, currentSystem, sim.soloHost ? null : sim.ship.pos);` — 0.3.65: the dedicated Sol host has no pilot, so its far-field budget must not
  centre on the observatory's parked hull — it flies every hull at full detail
  (null = everything near), and the positions it hands mirrors are real ones
- L3600 · `if (sim.worldAuthority !== false) {` — A mirror flies the hulls — it has to, or they would freeze between the
  host's packets — but it does not get to decide anything. Who is hunting
  whom, who called for help and what a nest launched are the host's to
  settle, and a mirror that made its own mind up would be fighting a
  different war in the same sky. worldsync.js overwrites the outcome.
- L3605 · `stepSecLevel(sim.ship, sim.time, d, { authority: sim.worldAuthority !== false });` — the security ◆ is the pilot's, not the sky's: every client steps its own (0.3.48)
- L3646 · `sim.threats = sim.ship.sentry && sim.ship.powered.ops` — both branches hand back the SAME array — the `: []` used to allocate a
  fresh empty one every tick the sentry was off, which is most of them
<!-- /note -->

### <a id="s-onKill"></a>`onKill(c, shot=)`

function · L3651–3738

- calls: [`bookRevenue`](../corp/company.js.md#s-bookRevenue) _js/corp/company.js_ · [`adjustStanding`](../corp/corps.js.md#s-adjustStanding) _js/corp/corps.js_ ×4 · [`blameKill`](../corp/corps.js.md#s-blameKill) _js/corp/corps.js_ · [`corpOfStation`](../corp/corps.js.md#s-corpOfStation) _js/corp/corps.js_ ×2 · [`corpOfVessel`](../corp/corps.js.md#s-corpOfVessel) _js/corp/corps.js_ ×2 · [`noteKillBySelf`](../corp/seclevel.js.md#s-noteKillBySelf) _js/corp/seclevel.js_ ×2 · [`noteDroneKill`](../drones/ops.js.md#s-noteDroneKill) _js/drones/ops.js_ · [`noteDestroyed`](../economy/contracts.js.md#s-noteDestroyed) _js/economy/contracts.js_ · [`noteKill`](../economy/contracts.js.md#s-noteKill) _js/economy/contracts.js_ · [`work`](../flight/pilot.js.md#s-work) _js/flight/pilot.js_ ×4 · [`pirateKilled`](../npc/battles.js.md#s-pirateKilled) _js/npc/battles.js_ ×3 · [`markVesselDown`](../npc/traffic.js.md#s-markVesselDown) _js/npc/traffic.js_ ×3 · [`vesselById`](../npc/traffic.js.md#s-vesselById) _js/npc/traffic.js_ · [`shipById`](../ships/shipdb.js.md#s-shipById) _js/ships/shipdb.js_ · [`logEvent`](#s-logEvent) ×7 · [`stationById`](../station/stations.js.md#s-stationById) _js/station/stations.js_ ×3 · [`burst`](../world/debris.js.md#s-burst) _js/world/debris.js_ ×4
- via [js/station/stations.js](../station/stations.js.md): `stations.find`
- via [js/npc/traffic.js](../npc/traffic.js.md): `HOSTILE_ROLES.has`, `traffic.find`
- via [js/drones/npcdrones.js](../drones/npcdrones.js.md): `npcDrones.units.find`

<!-- note:onKill -->
- L3652 · `if (shot && shot.faction === "npc-port") {` — 0.3.59: a port's guard drone made the kill — the port's, not yours
- L3662 · `if (shot && shot.faction === "npc-law") {` — 0.3.56: the Directorate's wing made the kill — theirs, not yours: no heat, no bounty, no credit
- L3670 · `if (shot && String(shot.owner).startsWith("pdrone-")) noteDroneKill(shot.owner);` — one of your work drones made the kill: it is yours — bounty, standing, the lot
- L3673 · `const stId = String(shot.owner).split(":")[0].replace(/^sdrone-/, "").split("-")[0];` — a port's guns or drones made the kill: the debris is theirs, the bounty is not
- L3678 · `burst({ x: c.x, y: c.y, z: c.z, vx: (c.vx ?? 0) * 0.3, vy: (c.vy ?? 0) * 0.3, vz: (c.vz ??` — what is left of it drifts where it died — the tractor takes plate
- L3679 · `if (c.kind === "npc") {` — a working hull: that was somebody's crew. Its owners remember, and so does the room.
- L3691 · `noteDestroyed(n);` — 0.3.18: a drone cull on the desk counts every drone you put down
- L3693 · `const e = pirateKilled(c.id, sim.time);` — a pirate: the charters pay for that, and so does anyone they were working over
- L3695 · `const bounty = 240 + Math.round((shipById(n.ship)?.stats.massT ?? 30) * 4) + (e ? 350 : 0)` — 0.3.47: 420 + 6/t + 600 for a rescue was a starter hull every eight kills
- L3714 · `noteKillBySelf({ n, t: sim.time });` — an honest hull: its flag remembers, its flag's allies remember, its flag's enemies approve
- L3714 · `noteKillBySelf({ n, t: sim.time });` — 0.3.48: and so does the Directorate
- L3720 · `if (c.kind === "peer") { noteKillBySelf({ peer: true, t: sim.time }); return; }` — another pilot: the heaviest thing the Directorate files (0.3.48)
- L3721 · `if (c.stationId) {` — Somebody owned that gun.
<!-- /note -->

### <a id="s-pauseTick"></a>`pauseTick()`

function · **exported** · L3740–3743

- calls: [`justPressed`](../core/input.js.md#s-justPressed) _js/core/input.js_ · [`sampleInput`](../core/input.js.md#s-sampleInput) _js/core/input.js_ · [`resumePlay`](#s-resumePlay)
- called by: [`mountGame>tick`](../render/engine.js.md#s-mountGame-tick) _js/render/engine.js_

<!-- note:pauseTick -->
<!-- /note -->

### <a id="s-resumePlay"></a>`resumePlay()`

function · **exported** · L3745–3748

- via [js/core/store.js](../core/store.js.md): `useGameStore.getState`, `useGameStore.getState.setPhase`
- called by: [`pauseTick`](#s-pauseTick) · [`mountHud`](../ui/hud.js.md#s-mountHud) _js/ui/hud.js_ ×3

<!-- note:resumePlay -->
<!-- /note -->

### <a id="s-selectBody"></a>`selectBody(id)`

function · **exported** · L3750–3774

- calls: [`acquireLock`](#s-acquireLock) ×2 · [`selectBody`](#s-selectBody) · [`setNavTarget`](#s-setNavTarget) ×2 · [`setNoticeAbout`](#s-setNoticeAbout) · [`stationById`](../station/stations.js.md#s-stationById) _js/station/stations.js_ · [`bodyById`](../world/bodies.js.md#s-bodyById) _js/world/bodies.js_
- via [js/core/store.js](../core/store.js.md): `useGameStore.getState`, `useGameStore.getState.patchHud`
- called by: [`lockOn`](../aria/nav.js.md#s-lockOn) _js/aria/nav.js_ · [`stepMarkets.effect`](../comms/comms.js.md#s-stepMarkets-effect) _js/comms/comms.js_ · [`stepMarkets.effect~2`](../comms/comms.js.md#s-stepMarkets-effect-2) _js/comms/comms.js_ · [`stepNews.run`](../comms/comms.js.md#s-stepNews-run) _js/comms/comms.js_ · [`mountTargets`](../console/panels/nav.js.md#s-mountTargets) _js/console/panels/nav.js_ · [`engageAutopilot`](../flight/autopilot.js.md#s-engageAutopilot) _js/flight/autopilot.js_ · [`resolve`](../mission/run.js.md#s-resolve) _js/mission/run.js_ · [`execute`](../npc/captain.js.md#s-execute) _js/npc/captain.js_ · [`selectBody`](#s-selectBody) · [`mountMap`](../ui/map.js.md#s-mountMap) _js/ui/map.js_ · [`mountMap.run~3`](../ui/map.js.md#s-mountMap-run-3) _js/ui/map.js_ · [`mountMap>drawDirectory`](../ui/map.js.md#s-mountMap-drawDirectory) _js/ui/map.js_ · [`mountMap>tapAt`](../ui/map.js.md#s-mountMap-tapAt) _js/ui/map.js_ · [`STEPS.action.run`](../ui/tutorial.js.md#s-STEPS-action-run) _js/ui/tutorial.js_

<!-- note:selectBody -->
- L3765 · `if (sim.lock.id !== id) {` — a pick off the map is a real lock, not a second parallel notion of
  "selected" — so the HUD, MATCH and the autopilot all agree with it
<!-- /note -->

### <a id="s-requestJump"></a>`requestJump()`

function · **exported** · L3776–3778

- called by: [`apLeg`](../flight/autopilot.js.md#s-apLeg) _js/flight/autopilot.js_ · [`execute`](../npc/captain.js.md#s-execute) _js/npc/captain.js_ · [`mountHud`](../ui/hud.js.md#s-mountHud) _js/ui/hud.js_

<!-- note:requestJump -->
<!-- /note -->

### <a id="s-requestScan"></a>`requestScan()`

function · **exported** · L3779–3781

- called by: [`mountTargets`](../console/panels/nav.js.md#s-mountTargets) _js/console/panels/nav.js_ · [`EXEC.SURVEY`](../mission/run.js.md#s-EXEC-SURVEY) _js/mission/run.js_ · [`mountHud`](../ui/hud.js.md#s-mountHud) _js/ui/hud.js_

<!-- note:requestScan -->
<!-- /note -->

### <a id="s-dismissNotice"></a>`dismissNotice()`

function · **exported** · L3783–3785

- called by: [`mountHud`](../ui/hud.js.md#s-mountHud) _js/ui/hud.js_

<!-- note:dismissNotice -->
Tap the card to send it away early.
<!-- /note -->

### <a id="s-requestWarp"></a>`requestWarp`

const · **exported** · L3786–3786

<!-- note:requestWarp -->
legacy alias
<!-- /note -->

### <a id="s-bodyUnderReticle"></a>`bodyUnderReticle()`

function · **exported** · L3788–3802

- calls: [`forwardOf`](../flight/ship.js.md#s-forwardOf) _js/flight/ship.js_ · [`clamp`](#s-clamp) · [`bodyPosition`](../world/bodies.js.md#s-bodyPosition) _js/world/bodies.js_
- called by: [`publishHud`](#s-publishHud) · [`togglePointerLock`](#s-togglePointerLock)

<!-- note:bodyUnderReticle -->
The world under the reticle: smallest angle off the nose inside 0.3 rad, big discs winning ties.

- L3797 · `const disc = Math.atan2(b.radius ?? 0, d);` — apparent radius
- L3798 · `const score = Math.max(0, ang - disc);` — inside the disc counts as dead on
<!-- /note -->

### <a id="s-nearestBody"></a>`nearestBody()`

function · L3804–3815

- calls: [`bodyPosition`](../world/bodies.js.md#s-bodyPosition) _js/world/bodies.js_ · [`dist3`](../world/bodies.js.md#s-dist3) _js/world/bodies.js_
- called by: [`publishHud`](#s-publishHud)

<!-- note:nearestBody -->
<!-- /note -->

### <a id="s-publishHud"></a>`publishHud(labels, plots)`

function · **exported** · L3817–3984

- calls: [`avoidLevel`](../flight/avoid.js.md#s-avoidLevel) _js/flight/avoid.js_ · [`rankStatus`](../flight/pilot.js.md#s-rankStatus) _js/flight/pilot.js_ · [`title`](../flight/pilot.js.md#s-title) _js/flight/pilot.js_ · [`absSpeedOf`](../flight/ship.js.md#s-absSpeedOf) _js/flight/ship.js_ · [`batteryCap`](../flight/ship.js.md#s-batteryCap) _js/flight/ship.js_ · [`cargoTotal`](../flight/ship.js.md#s-cargoTotal) _js/flight/ship.js_ · [`closingSpeed`](../flight/ship.js.md#s-closingSpeed) _js/flight/ship.js_ · [`speedOf`](../flight/ship.js.md#s-speedOf) _js/flight/ship.js_ · [`fightCentre`](../npc/battles.js.md#s-fightCentre) _js/npc/battles.js_ · [`etaOf`](../npc/security.js.md#s-etaOf) _js/npc/security.js_ · [`nearestCall`](../npc/security.js.md#s-nearestCall) _js/npc/security.js_ · [`trafficCensus`](../npc/traffic.js.md#s-trafficCensus) _js/npc/traffic.js_ · [`activeWaypoint`](#s-activeWaypoint) · [`bodyUnderReticle`](#s-bodyUnderReticle) · [`nearestBody`](#s-nearestBody) · [`plotRoute`](#s-plotRoute) · [`pulseActive`](#s-pulseActive) · [`spoolTime`](#s-spoolTime) · [`stationStatus`](#s-stationStatus) · [`throttleCap`](#s-throttleCap) · [`waypointPosition`](#s-waypointPosition) · [`dist3`](../world/bodies.js.md#s-dist3) _js/world/bodies.js_ ×2 · [`surveyIds`](../world/bodies.js.md#s-surveyIds) _js/world/bodies.js_
- via [js/npc/flow.js](../npc/flow.js.md): `flow.reduce`
- via [js/core/store.js](../core/store.js.md): `useGameStore.getState`, `useGameStore.getState.patchHud`
- called by: [`mountGame>tick`](../render/engine.js.md#s-mountGame-tick) _js/render/engine.js_

<!-- note:publishHud -->
- L3828 · `if (sim.notice !== sim.lastNotice) {` — Any code path that writes a new notice restarts its clock, so the card
  can fade on its own instead of parking on the canopy forever.
- L3868 · `hazard: sim.threat && sim.threat.t < AVOID.horizon` — `hazard`, not `threat` — the payload already carries a `threat` for the
  warp route's obstruction list further down, and a duplicate key in an
  object literal is silently won by the last one. This read as the
  avoidance not working at all.
- L3871 · `response: (() => {` — The response clock. A player deciding whether to press an attack on a
  supply hull is deciding against this number, so it is on the canopy and
  it is honest: seconds until the first responder is on scene, or the fact
  that nobody is coming. It shows for any call near enough to matter, not
  only the player's own — a fight you are flying past is a fight you can
  join, and knowing when the law arrives is the whole decision.
- L3894 · `charge: ship.charge,` — cockpit instrumentation
<!-- /note -->

### <a id="s-wireControlsTest"></a>`wireControlsTest()`

function · **exported** · L3986–4049

- called by: [`mountGame`](../render/engine.js.md#s-mountGame) _js/render/engine.js_
- effects: global.write `window.__lg`

<!-- note:wireControlsTest -->
- L3989 · `traffic,` — the reactive sky, for the headless smokes and the console: the roster
  itself, who is answering what, what the nests are doing, and what the
  frame budget has decided the device can carry
- L3991 · `holes: { holes, summonHole, collapseToHole, goSupernova },` — 0.3: collapsed stars and the impact runs, for the smokes and the console
<!-- /note -->

#### <a id="s-wireControlsTest-threats"></a>`wireControlsTest.threats()`

prop · L4024–4024

<!-- note:wireControlsTest.threats -->
<!-- /note -->

#### <a id="s-wireControlsTest-ship"></a>`wireControlsTest.ship()`

prop · L4034–4034

<!-- note:wireControlsTest.ship -->
<!-- /note -->

#### <a id="s-wireControlsTest-getYaw"></a>`wireControlsTest.getYaw()`

prop · L4035–4035

<!-- note:wireControlsTest.getYaw -->
<!-- /note -->

#### <a id="s-wireControlsTest-getSpeed"></a>`wireControlsTest.getSpeed()`

prop · L4036–4036

- calls: [`speedOf`](../flight/ship.js.md#s-speedOf) _js/flight/ship.js_

<!-- note:wireControlsTest.getSpeed -->
<!-- /note -->

#### <a id="s-wireControlsTest-setKeys"></a>`wireControlsTest.setKeys(codes)`

prop · L4038–4038

- calls: [`setInjectedKeys`](../core/input.js.md#s-setInjectedKeys) _js/core/input.js_

<!-- note:wireControlsTest.setKeys -->
<!-- /note -->

#### <a id="s-wireControlsTest-setPan"></a>`wireControlsTest.setPan(x, y)`

prop · L4039–4039

- calls: [`setInjectedPan`](../core/input.js.md#s-setInjectedPan) _js/core/input.js_

<!-- note:wireControlsTest.setPan -->
<!-- /note -->

### <a id="s-tickSolHost"></a>`tickSolHost(dt)`

function · **exported** · L4053–4062

- calls: [`stepWorld`](#s-stepWorld)

<!-- note:tickSolHost -->
Dedicated service: advance the existing world directors without a player flight loop.
<!-- /note -->

## Module-level calls

- calls: [`registerAnchor`](../world/anchors.js.md#s-registerAnchor) _js/world/anchors.js_ · [`bodyById`](../world/bodies.js.md#s-bodyById) _js/world/bodies.js_ · [`bodyPosition`](../world/bodies.js.md#s-bodyPosition) _js/world/bodies.js_ · [`put`](#s-put) · [`beaconPosition`](../world/bodies.js.md#s-beaconPosition) _js/world/bodies.js_ · [`wireFab`](../economy/fabricate.js.md#s-wireFab) _js/economy/fabricate.js_
