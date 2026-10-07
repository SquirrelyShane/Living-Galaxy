# js/station/stations.js

[index](../../../README.md) · 204 lines · 22 symbols · 4 imports · 108 importers

## About

<!-- note:@file -->
LIVING GALAXY — stations.

Three ways a station exists out here:
  free    — its own solar orbit, beholden to nobody
  tethered— parked in a planet or moon's well and carried around by it
  pirate  — bolted to a belt asteroid, defended, and claimable once it is not

Each carries a sector, which decides what it sells, what it pays over the
odds for, and what services it will let you use.

- L177 · `export const TRACTOR_R = 250;` — how far off a mouth port control will reach out for you (2.5 km: inside the lane funnel)
- L178 · `export const TRACTOR_V = 60;` — and how fast you may be moving when it does
<!-- /note -->

## Imports

| line | from | names | target |
|---|---|---|---|
| 1 | `../world/bodies.js` | `bodyById`, `bodyPosition`, `bodyVelocity` | [js/world/bodies.js](../world/bodies.js.md) |
| 2 | `../economy/materials.js` | `SECTORS`, `SECTOR_IDS`, `stockFor` | [js/economy/materials.js](../economy/materials.js.md) |
| 3 | `./stationyard.js` | `ensureBuilt`, `releaseBuilt`, `headingFor`, `orientStation` | [js/station/stationyard.js](stationyard.js.md) |
| 4 | `../world/naming.js` | `stationName`, `openSkyNames`, `reserveNames` | [js/world/naming.js](../world/naming.js.md) |

## Imported by

- [js/aria/company.js](../aria/company.js.md) — `stationById`
- [js/aria/nav.js](../aria/nav.js.md) — `stationById`
- [js/aria/pilot.js](../aria/pilot.js.md) — `stations`, `stationById`
- [js/aria/play.js](../aria/play.js.md) — `stations`, `stationById`
- [js/aria/senses.js](../aria/senses.js.md) — `stations`, `stationById`
- [js/aria/wake.js](../aria/wake.js.md) — `stationById`
- [js/comms/comms.js](../comms/comms.js.md) — `nearestStation`, `stationById`, `stations`
- [js/comms/gnn.js](../comms/gnn.js.md) — `stations`
- [js/console/panels/corp-marshal.js](../console/panels/corp-marshal.js.md) — `stationById`
- [js/console/panels/corp.js](../console/panels/corp.js.md) — `stationById`
- [js/console/panels/crew-gdb.js](../console/panels/crew-gdb.js.md) — `stationById`
- [js/console/panels/market.js](../console/panels/market.js.md) — `stationById`
- [js/console/panels/nav.js](../console/panels/nav.js.md) — `stationById`
- [js/console/panels/work-drones.js](../console/panels/work-drones.js.md) — `stationById`
- [js/console/panels/work-fleet.js](../console/panels/work-fleet.js.md) — `stationById`
- [js/console/panels/work.js](../console/panels/work.js.md) — `stations`
- [js/corp/company.js](../corp/company.js.md) — `stationById`
- [js/corp/corps.js](../corp/corps.js.md) — `stations`
- [js/corp/fleet.js](../corp/fleet.js.md) — `stationById`
- [js/corp/seclevel.js](../corp/seclevel.js.md) — `stationById`
- [js/crew/childtalk.js](../crew/childtalk.js.md) — `stationById`
- [js/crew/family.js](../crew/family.js.md) — `stationById`
- [js/drones/board.js](../drones/board.js.md) — `stations`
- [js/drones/npcdrones.js](../drones/npcdrones.js.md) — `stationById`
- [js/drones/ops.js](../drones/ops.js.md) — `stations`, `stationById`
- [js/economy/chains.js](../economy/chains.js.md) — `stations`, `stationById`
- [js/economy/contracts.js](../economy/contracts.js.md) — `stations`, `stationById`
- [js/economy/traderoutes.js](../economy/traderoutes.js.md) — `stations`
- [js/flight/autopilot.js](../flight/autopilot.js.md) — `stations`, `TRACTOR_V`
- [js/flight/avoid.js](../flight/avoid.js.md) — `stations`
- [js/flight/probes.js](../flight/probes.js.md) — `stations`
- [js/flight/repair.js](../flight/repair.js.md) — `stationById`
- [js/interior/interior.js](../interior/interior.js.md) — `stations`
- [js/mission/run.js](../mission/run.js.md) — `stationById`
- [js/mission/salvage.js](../mission/salvage.js.md) — `stations`, `stationById`
- [js/mission/tradeops.js](../mission/tradeops.js.md) — `stationById`
- [js/npc/battles.js](../npc/battles.js.md) — `stations`
- [js/npc/bounty.js](../npc/bounty.js.md) — `stations`, `stationById`
- [js/npc/captain.js](../npc/captain.js.md) — `stationById`
- [js/npc/captain.js](../npc/captain.js.md) — `nearestStation`
- [js/npc/flow.js](../npc/flow.js.md) — `stations`
- [js/npc/ground.js](../npc/ground.js.md) — `stations`
- [js/npc/rogues.js](../npc/rogues.js.md) — `stations`
- [js/npc/security.js](../npc/security.js.md) — `stations`
- [js/npc/speech.js](../npc/speech.js.md) — `stations`
- [js/npc/traffic.js](../npc/traffic.js.md) — `stations`
- [js/render/engine.js](../render/engine.js.md) — `stations`
- [js/sim/sim.js](../sim/sim.js.md) — `buildStations`, `describeStation`, `dockCheck`, `nearestStation`, `resetStations`, `stationById`, `stations`, `stepStations`
- [js/sim/sim.js](../sim/sim.js.md) — `TRACTOR_R`, `TRACTOR_V`
- [js/station/staffcare.js](staffcare.js.md) — `stationById`
- [js/station/stafflife.js](stafflife.js.md) — `stationById`
- [js/station/staffline.js](staffline.js.md) — `stationById`
- [js/station/stationdeck.js](stationdeck.js.md) — `stationById`
- [js/station/stationlife.js](stationlife.js.md) — `stationById`
- [js/station/stationworks.js](stationworks.js.md) — `stations`, `stationById`, `TRACTOR_R`, `TRACTOR_V`
- [js/ui/chatbox.js](../ui/chatbox.js.md) — `stations`
- [js/ui/dockboot.js](../ui/dockboot.js.md) — `stationById`
- [js/ui/holdview.js](../ui/holdview.js.md) — `stationById`
- [js/ui/hud.js](../ui/hud.js.md) — `stations`
- [js/ui/map.js](../ui/map.js.md) — `stations`
- [js/ui/tutorial-core.js](../ui/tutorial-core.js.md) — `stations`
- [js/ui/tutorial.js](../ui/tutorial.js.md) — `nearestStation`
- test/aria-mining-loop.test.mjs _(outside js/)_ — `stations`
- test/ariabiz.test.mjs _(outside js/)_ — `stations`, `stationById`
- test/ariamind-integration.test.mjs _(outside js/)_ — `stations`
- test/ariaplay.test.mjs _(outside js/)_ — `stations`, `stationById`
- test/ariasense.test.mjs _(outside js/)_ — `stations`, `stationById`
- test/autopilot.test.mjs _(outside js/)_ — `stations`
- test/avoid.test.mjs _(outside js/)_ — `stations`
- test/balance.test.mjs _(outside js/)_ — `stations`
- test/bay.test.mjs _(outside js/)_ — `stations`, `stepStations`
- test/beats.test.mjs _(outside js/)_ — `stations`
- test/board.test.mjs _(outside js/)_ — `stations`, `stepStations`
- test/bounty.test.mjs _(outside js/)_ — `stations`
- test/chains.test.mjs _(outside js/)_ — `stations`, `stationById`
- test/childtalk.test.mjs _(outside js/)_ — `stations`
- test/converse.test.mjs _(outside js/)_ — `stations`
- test/crew-life.test.mjs _(outside js/)_ — `stations`
- test/desk.test.mjs _(outside js/)_ — `stations`
- test/dockwork.test.mjs _(outside js/)_ — `stations`, `stationById`
- test/economy.test.mjs _(outside js/)_ — `stations`
- test/gdb.test.mjs _(outside js/)_ — `stations`
- test/genome.test.mjs _(outside js/)_ — `stations`
- test/ground.test.mjs _(outside js/)_ — `stations`, `stepStations`
- test/hold.test.mjs _(outside js/)_ — `stations`
- test/hulks.test.mjs _(outside js/)_ — `stations`
- test/jobloop.test.mjs _(outside js/)_ — `stations`, `stationById`
- test/line.test.mjs _(outside js/)_ — `stations`
- test/marks.test.mjs _(outside js/)_ — `stations`
- test/npcchat.test.mjs _(outside js/)_ — `stations`
- test/orders.test.mjs _(outside js/)_ — `stations`
- test/people.test.mjs _(outside js/)_ — `stations`
- test/portcontrol.test.mjs _(outside js/)_ — `stations`, `TRACTOR_V`
- test/portdrones.test.mjs _(outside js/)_ — `stationById`, `stepStations`
- test/reactive.test.mjs _(outside js/)_ — `stations`, `stepStations`
- test/robots.test.mjs _(outside js/)_ — `stations`
- test/rogues.test.mjs _(outside js/)_ — `stations`, `stepStations`
- test/salvage.test.mjs _(outside js/)_ — `stations`
- test/seclevel.test.mjs _(outside js/)_ — `stations`
- test/sites.test.mjs _(outside js/)_ — `stations`
- test/sky.test.mjs _(outside js/)_ — `stations`
- test/skycrew.test.mjs _(outside js/)_ — `stations`
- test/speech.test.mjs _(outside js/)_ — `stations`
- test/stafflife.test.mjs _(outside js/)_ — `stations`
- test/systems.test.mjs _(outside js/)_ — `stations`
- test/trade.test.mjs _(outside js/)_ — `stations`, `stationById`
- test/undock.test.mjs _(outside js/)_ — `stations`
- test/upgrades.test.mjs _(outside js/)_ — `stations`

## Exports

- [`stations`](#s-stations) · const — used by [js/aria/pilot.js](../aria/pilot.js.md), [js/aria/play.js](../aria/play.js.md), [js/aria/senses.js](../aria/senses.js.md), [js/comms/comms.js](../comms/comms.js.md), [js/comms/gnn.js](../comms/gnn.js.md), [js/console/panels/work.js](../console/panels/work.js.md), [js/corp/corps.js](../corp/corps.js.md), [js/drones/board.js](../drones/board.js.md), [js/drones/ops.js](../drones/ops.js.md), [js/economy/chains.js](../economy/chains.js.md), [js/economy/contracts.js](../economy/contracts.js.md), [js/economy/traderoutes.js](../economy/traderoutes.js.md), [js/flight/autopilot.js](../flight/autopilot.js.md), [js/flight/avoid.js](../flight/avoid.js.md), [js/flight/probes.js](../flight/probes.js.md), [js/interior/interior.js](../interior/interior.js.md), [js/mission/salvage.js](../mission/salvage.js.md), [js/npc/battles.js](../npc/battles.js.md), [js/npc/bounty.js](../npc/bounty.js.md), [js/npc/flow.js](../npc/flow.js.md), [js/npc/ground.js](../npc/ground.js.md), [js/npc/rogues.js](../npc/rogues.js.md), [js/npc/security.js](../npc/security.js.md), [js/npc/speech.js](../npc/speech.js.md), [js/npc/traffic.js](../npc/traffic.js.md), [js/render/engine.js](../render/engine.js.md), [js/sim/sim.js](../sim/sim.js.md), [js/station/stationworks.js](stationworks.js.md), [js/ui/chatbox.js](../ui/chatbox.js.md), [js/ui/hud.js](../ui/hud.js.md), [js/ui/map.js](../ui/map.js.md), [js/ui/tutorial-core.js](../ui/tutorial-core.js.md), test/aria-mining-loop.test.mjs, test/ariabiz.test.mjs, test/ariamind-integration.test.mjs, test/ariaplay.test.mjs, test/ariasense.test.mjs, test/autopilot.test.mjs, test/avoid.test.mjs, test/balance.test.mjs, test/bay.test.mjs, test/beats.test.mjs, test/board.test.mjs, test/bounty.test.mjs, test/chains.test.mjs, test/childtalk.test.mjs, test/converse.test.mjs, test/crew-life.test.mjs, test/desk.test.mjs, test/dockwork.test.mjs, test/economy.test.mjs, test/gdb.test.mjs, test/genome.test.mjs, test/ground.test.mjs, test/hold.test.mjs, test/hulks.test.mjs, test/jobloop.test.mjs, test/line.test.mjs, test/marks.test.mjs, test/npcchat.test.mjs, test/orders.test.mjs, test/people.test.mjs, test/portcontrol.test.mjs, test/reactive.test.mjs, test/robots.test.mjs, test/rogues.test.mjs, test/salvage.test.mjs, test/seclevel.test.mjs, test/sites.test.mjs, test/sky.test.mjs, test/skycrew.test.mjs, test/speech.test.mjs, test/stafflife.test.mjs, test/systems.test.mjs, test/trade.test.mjs, test/undock.test.mjs, test/upgrades.test.mjs
- [`resetStations`](#s-resetStations) · function — used by [js/sim/sim.js](../sim/sim.js.md)
- [`buildStations`](#s-buildStations) · function — used by [js/sim/sim.js](../sim/sim.js.md)
- [`stepStations`](#s-stepStations) · function — used by [js/sim/sim.js](../sim/sim.js.md), test/bay.test.mjs, test/board.test.mjs, test/ground.test.mjs, test/portdrones.test.mjs, test/reactive.test.mjs, test/rogues.test.mjs
- [`nearestStation`](#s-nearestStation) · function — used by [js/comms/comms.js](../comms/comms.js.md), [js/npc/captain.js](../npc/captain.js.md), [js/sim/sim.js](../sim/sim.js.md), [js/ui/tutorial.js](../ui/tutorial.js.md)
- [`stationById`](#s-stationById) · function — used by [js/aria/company.js](../aria/company.js.md), [js/aria/nav.js](../aria/nav.js.md), [js/aria/pilot.js](../aria/pilot.js.md), [js/aria/play.js](../aria/play.js.md), [js/aria/senses.js](../aria/senses.js.md), [js/aria/wake.js](../aria/wake.js.md), [js/comms/comms.js](../comms/comms.js.md), [js/console/panels/corp-marshal.js](../console/panels/corp-marshal.js.md), [js/console/panels/corp.js](../console/panels/corp.js.md), [js/console/panels/crew-gdb.js](../console/panels/crew-gdb.js.md), [js/console/panels/market.js](../console/panels/market.js.md), [js/console/panels/nav.js](../console/panels/nav.js.md), [js/console/panels/work-drones.js](../console/panels/work-drones.js.md), [js/console/panels/work-fleet.js](../console/panels/work-fleet.js.md), [js/corp/company.js](../corp/company.js.md), [js/corp/fleet.js](../corp/fleet.js.md), [js/corp/seclevel.js](../corp/seclevel.js.md), [js/crew/childtalk.js](../crew/childtalk.js.md), [js/crew/family.js](../crew/family.js.md), [js/drones/npcdrones.js](../drones/npcdrones.js.md), [js/drones/ops.js](../drones/ops.js.md), [js/economy/chains.js](../economy/chains.js.md), [js/economy/contracts.js](../economy/contracts.js.md), [js/flight/repair.js](../flight/repair.js.md), [js/mission/run.js](../mission/run.js.md), [js/mission/salvage.js](../mission/salvage.js.md), [js/mission/tradeops.js](../mission/tradeops.js.md), [js/npc/bounty.js](../npc/bounty.js.md), [js/npc/captain.js](../npc/captain.js.md), [js/sim/sim.js](../sim/sim.js.md), [js/station/staffcare.js](staffcare.js.md), [js/station/stafflife.js](stafflife.js.md), [js/station/staffline.js](staffline.js.md), [js/station/stationdeck.js](stationdeck.js.md), [js/station/stationlife.js](stationlife.js.md), [js/station/stationworks.js](stationworks.js.md), [js/ui/dockboot.js](../ui/dockboot.js.md), [js/ui/holdview.js](../ui/holdview.js.md), test/ariabiz.test.mjs, test/ariaplay.test.mjs, test/ariasense.test.mjs, test/chains.test.mjs, test/dockwork.test.mjs, test/jobloop.test.mjs, test/portdrones.test.mjs, test/trade.test.mjs
- [`TRACTOR_R`](#s-TRACTOR_R) · const — used by [js/sim/sim.js](../sim/sim.js.md), [js/station/stationworks.js](stationworks.js.md)
- [`TRACTOR_V`](#s-TRACTOR_V) · const — used by [js/flight/autopilot.js](../flight/autopilot.js.md), [js/sim/sim.js](../sim/sim.js.md), [js/station/stationworks.js](stationworks.js.md), test/portcontrol.test.mjs
- [`dockCheck`](#s-dockCheck) · function — used by [js/sim/sim.js](../sim/sim.js.md)
- [`sectorOf`](#s-sectorOf) · function — **no importer in scanned roots**
- [`describeStation`](#s-describeStation) · function — used by [js/sim/sim.js](../sim/sim.js.md)

## Effects

_none detected_

## Symbols

### <a id="s-stations"></a>`stations`

const · **exported** · L6–6

<!-- note:stations -->
<!-- /note -->

### <a id="s-PREFIX"></a>`PREFIX`

const · L8–15 · **never referenced**

<!-- note:PREFIX -->
<!-- /note -->

### <a id="s-SUFFIX"></a>`SUFFIX`

const · L16–16 · **never referenced**

<!-- note:SUFFIX -->
<!-- /note -->

### <a id="s-_bp"></a>`_bp`

const · L18–18

<!-- note:_bp -->
<!-- /note -->

### <a id="s-_bv"></a>`_bv`

const · L19–19

<!-- note:_bv -->
<!-- /note -->

### <a id="s-seq"></a>`seq`

const · L21–21

<!-- note:seq -->
<!-- /note -->

### <a id="s-resetStations"></a>`resetStations()`

function · **exported** · L23–27

- calls: [`releaseBuilt`](stationyard.js.md#s-releaseBuilt) _js/station/stationyard.js_
- called by: [`loadSky`](../sim/sim.js.md#s-loadSky) _js/sim/sim.js_ · [`buildStations`](#s-buildStations)

<!-- note:resetStations -->
<!-- /note -->

### <a id="s-name"></a>`name(sector, rnd)`

function · L29–32

- calls: [`gnnStationFor>rnd`](#s-gnnStationFor-rnd) ×2 · [`stationName`](../world/naming.js.md#s-stationName) _js/world/naming.js_
- called by: [`make`](#s-make) ×2

<!-- note:name -->
0.3.32: ports used to be 5 sector prefixes x 7 suffixes = 35 names per
sector, 175 in the whole game, and across twelve systems 42% of ports
carried a name another port also had. js/world/naming.js keeps the sector word —
that is what tells you what kind of place you are docking at — and widens
everything around it to 10,350, with uniqueness inside a sky guaranteed
rather than hoped for. PREFIX and SUFFIX below are kept as the shapes the
seam is built from; it owns the composition now.

- L30 · `rnd(); rnd();` — The two draws are load-bearing. The old namer took exactly two from the
  caller's generator — one prefix, one suffix — and the roster's seeded
  sequence runs on after it: hosts, orbits, mounts, works, and how many
  ports the system gets at all. Dropping them shifted every later draw and
  Sol quietly went from eight ports to eleven, which failed five suites
  that were not about names. The words come from js/world/naming.js now and cost
  the caller nothing, so the two draws are made and discarded on purpose:
  the same sky keeps the same ports in the same places, better named.
<!-- /note -->

### <a id="s-buildStations"></a>`buildStations(system, rnd, skySeed=)`

function · **exported** · L34–80

- calls: [`buildStations>family`](#s-buildStations-family) · [`gnnStationFor`](#s-gnnStationFor) · [`gnnStationFor>rnd`](#s-gnnStationFor-rnd) ×15 · [`make`](#s-make) ×3 · [`resetStations`](#s-resetStations) · [`ensureBuilt`](stationyard.js.md#s-ensureBuilt) _js/station/stationyard.js_ · [`openSkyNames`](../world/naming.js.md#s-openSkyNames) _js/world/naming.js_
- called by: [`loadSky`](../sim/sim.js.md#s-loadSky) _js/sim/sim.js_

<!-- note:buildStations -->
Builds the station roster for a system. Deterministic from the seed, so a
sky you come back to has the same ports in the same places.

- L36 · `openSkyNames(skySeed);` — one namer per sky, seeded off it: the same system always grows the same
  ports, and no two of them can share a name
- L40 · `const hosts = [...planets, ...moons].filter(() => rnd() < 0.42).slice(0, 6);` — tethered ports: parked in somebody's well
- L46 · `const freeCount = 1 + Math.floor(rnd() * 3);` — free ports: their own orbit around the star
- L60 · `const belt = system.belt ?? system.outerBelt;` — free ports of the other kind
- L78 · `for (const st of stations) ensureBuilt(st, skySeed);` — grow every port now: the lanes, the mounts and the works all read off the build
<!-- /note -->

#### <a id="s-buildStations-family"></a>`buildStations>family(id)`

function · L75–75

- called by: [`buildStations`](#s-buildStations)

<!-- note:buildStations>family -->
the GNN station: one newsroom per sky, on its own draw so the other ports keep their seeds
<!-- /note -->

### <a id="s-GNN_WORDS"></a>`GNN_WORDS`

const · L82–84

<!-- note:GNN_WORDS -->
One newsroom, many relays — but eight words meant two systems apart could
both host "GNN Herald Station", which is a navigation problem rather than a
branding one. Widened in 0.3.32 alongside the port names.
<!-- /note -->

### <a id="s-gnnStationFor"></a>`gnnStationFor(system, planets, moons, skySeed, allPlanets=)`

function · L85–107

- calls: [`gnnStationFor>rnd`](#s-gnnStationFor-rnd) ×9 · [`make`](#s-make) ×2 · [`reserveNames`](../world/naming.js.md#s-reserveNames) _js/world/naming.js_ ×2
- called by: [`buildStations`](#s-buildStations)

<!-- note:gnnStationFor -->
the newsroom takes a world nobody else is parked at (or a moon of one), so its approaches
never overlap another port's lanes; if every world is taken it flies its own orbit
<!-- /note -->

#### <a id="s-gnnStationFor-rnd"></a>`gnnStationFor>rnd()`

function · L89–89

- called by: [`buildStations`](#s-buildStations) ×15 · [`gnnStationFor`](#s-gnnStationFor) ×9 · [`make`](#s-make) ×4 · [`name`](#s-name) ×2

<!-- note:gnnStationFor>rnd -->
<!-- /note -->

### <a id="s-make"></a>`make(sector, mount, rnd, opts)`

function · L109–128

- calls: [`stockFor`](../economy/materials.js.md#s-stockFor) _js/economy/materials.js_ · [`gnnStationFor>rnd`](#s-gnnStationFor-rnd) ×4 · [`name`](#s-name) ×2
- called by: [`buildStations`](#s-buildStations) ×3 · [`gnnStationFor`](#s-gnnStationFor) ×2

<!-- note:make -->
- L117 · `x: 0, y: 0, z: 0, vx: 0, vy: 0, vz: 0,` — live position, filled by stepStations
- L121 · `guards: opts.guards ?? 0,` — pirate holds
<!-- /note -->

### <a id="s-stepStations"></a>`stepStations(time)`

function · **exported** · L130–158

- calls: [`headingFor`](stationyard.js.md#s-headingFor) _js/station/stationyard.js_ · [`orientStation`](stationyard.js.md#s-orientStation) _js/station/stationyard.js_ · [`bodyById`](../world/bodies.js.md#s-bodyById) _js/world/bodies.js_ · [`bodyPosition`](../world/bodies.js.md#s-bodyPosition) _js/world/bodies.js_ · [`bodyVelocity`](../world/bodies.js.md#s-bodyVelocity) _js/world/bodies.js_
- called by: [`loadSky`](../sim/sim.js.md#s-loadSky) _js/sim/sim.js_ · [`stepWorld`](../sim/sim.js.md#s-stepWorld) _js/sim/sim.js_ · [`tickSim`](../sim/sim.js.md#s-tickSim) _js/sim/sim.js_

<!-- note:stepStations -->
Where every station is this instant. Tethered ones ride their host.

- L142 · `st.vx = _bv.x;` — good enough: the host's motion dominates the tether's own circling
- L145 · `if (st.portLocal) orientStation(st, headingFor(st, a));` — the hull turns with its tether so the hangar mouth and the lanes face open sky
<!-- /note -->

### <a id="s-nearestStation"></a>`nearestStation(pos, range=)`

function · **exported** · L160–171

- called by: [`hail`](../comms/comms.js.md#s-hail) _js/comms/comms.js_ · [`hailContact`](../comms/comms.js.md#s-hailContact) _js/comms/comms.js_ · [`onVesselTransition`](../comms/comms.js.md#s-onVesselTransition) _js/comms/comms.js_ · [`paintAux`](../comms/comms.js.md#s-paintAux) _js/comms/comms.js_ · [`stepBattles`](../comms/comms.js.md#s-stepBattles) _js/comms/comms.js_ · [`stepIncoming`](../comms/comms.js.md#s-stepIncoming) _js/comms/comms.js_ · [`snapshot`](../npc/captain.js.md#s-snapshot) _js/npc/captain.js_ · [`stationStatus`](../sim/sim.js.md#s-stationStatus) _js/sim/sim.js_ · [`stepLaneDiscipline`](../sim/sim.js.md#s-stepLaneDiscipline) _js/sim/sim.js_ · [`stepTractorTick`](../sim/sim.js.md#s-stepTractorTick) _js/sim/sim.js_ · [`buildCtx`](../ui/tutorial.js.md#s-buildCtx) _js/ui/tutorial.js_

<!-- note:nearestStation -->
<!-- /note -->

### <a id="s-stationById"></a>`stationById(id)`

function · **exported** · L173–175

- called by: [`runBusiness`](../aria/company.js.md#s-runBusiness) _js/aria/company.js_ · [`placeOf`](../aria/nav.js.md#s-placeOf) _js/aria/nav.js_ · [`registerAriaOps`](../aria/pilot.js.md#s-registerAriaOps) _js/aria/pilot.js_ · [`registerBuildOp`](../aria/pilot.js.md#s-registerBuildOp) _js/aria/pilot.js_ · [`registerFabOp`](../aria/pilot.js.md#s-registerFabOp) _js/aria/pilot.js_ · [`registerRefitOp`](../aria/pilot.js.md#s-registerRefitOp) _js/aria/pilot.js_ · [`tickAriaPilot`](../aria/pilot.js.md#s-tickAriaPilot) _js/aria/pilot.js_ · [`canFly`](../aria/play.js.md#s-canFly) _js/aria/play.js_ ×2 · [`jobHops`](../aria/play.js.md#s-jobHops) _js/aria/play.js_ ×3 · [`jobPlan`](../aria/play.js.md#s-jobPlan) _js/aria/play.js_ ×3 · [`movesNow`](../aria/play.js.md#s-movesNow) _js/aria/play.js_ · [`startSupply`](../aria/play.js.md#s-startSupply) _js/aria/play.js_ · [`stepPlay`](../aria/play.js.md#s-stepPlay) _js/aria/play.js_ ×2 · [`senseBoard`](../aria/senses.js.md#s-senseBoard) _js/aria/senses.js_ · [`senseHull`](../aria/senses.js.md#s-senseHull) _js/aria/senses.js_ · [`unpostedWork`](../aria/senses.js.md#s-unpostedWork) _js/aria/senses.js_ ×2 · [`wakeAudit`](../aria/wake.js.md#s-wakeAudit) _js/aria/wake.js_ · [`hail`](../comms/comms.js.md#s-hail) _js/comms/comms.js_ ×2 · [`wireCommsTest.hailStation`](../comms/comms.js.md#s-wireCommsTest-hailStation) _js/comms/comms.js_ · [`mountMarshal>paint`](../console/panels/corp-marshal.js.md#s-mountMarshal-paint) _js/console/panels/corp-marshal.js_ · [`docked`](../console/panels/corp.js.md#s-docked) _js/console/panels/corp.js_ · [`mountCompany`](../console/panels/corp.js.md#s-mountCompany) _js/console/panels/corp.js_ · [`placeName`](../console/panels/crew-gdb.js.md#s-placeName) _js/console/panels/crew-gdb.js_ · [`mountRefit`](../console/panels/market.js.md#s-mountRefit) _js/console/panels/market.js_ · [`mountAria`](../console/panels/nav.js.md#s-mountAria) _js/console/panels/nav.js_ · [`buildSection`](../console/panels/work-drones.js.md#s-buildSection) _js/console/panels/work-drones.js_ ×2 · [`droneCard`](../console/panels/work-drones.js.md#s-droneCard) _js/console/panels/work-drones.js_ · [`yardSection`](../console/panels/work-fleet.js.md#s-yardSection) _js/console/panels/work-fleet.js_ · [`companyReport`](../corp/company.js.md#s-companyReport) _js/corp/company.js_ · [`contacts`](../corp/company.js.md#s-contacts) _js/corp/company.js_ ×2 · [`foundCompany`](../corp/company.js.md#s-foundCompany) _js/corp/company.js_ · [`payOffAndRecord`](../corp/company.js.md#s-payOffAndRecord) _js/corp/company.js_ · [`settleAsStaff`](../corp/company.js.md#s-settleAsStaff) _js/corp/company.js_ · [`commissionBlocker`](../corp/fleet.js.md#s-commissionBlocker) _js/corp/fleet.js_ · [`commissionHull`](../corp/fleet.js.md#s-commissionHull) _js/corp/fleet.js_ · [`resetFleet`](../corp/fleet.js.md#s-resetFleet) _js/corp/fleet.js_ · [`payFine`](../corp/seclevel.js.md#s-payFine) _js/corp/seclevel.js_ · [`where`](../crew/childtalk.js.md#s-where) _js/crew/childtalk.js_ · [`settleFamily`](../crew/family.js.md#s-settleFamily) _js/crew/family.js_ · [`populateNpcDrones`](../drones/npcdrones.js.md#s-populateNpcDrones) _js/drones/npcdrones.js_ · [`stepHauler`](../drones/npcdrones.js.md#s-stepHauler) _js/drones/npcdrones.js_ ×2 · [`stepUnit`](../drones/npcdrones.js.md#s-stepUnit) _js/drones/npcdrones.js_ ×2 · [`ROLE_STEP.courier`](../drones/ops.js.md#s-ROLE_STEP-courier) _js/drones/ops.js_ ×2 · [`anchorLabel`](../drones/ops.js.md#s-anchorLabel) _js/drones/ops.js_ · [`beginWork`](../drones/ops.js.md#s-beginWork) _js/drones/ops.js_ ×2 · [`goHome`](../drones/ops.js.md#s-goHome) _js/drones/ops.js_ · [`haulForMiner`](../drones/ops.js.md#s-haulForMiner) _js/drones/ops.js_ ×2 · [`holdAt`](../drones/ops.js.md#s-holdAt) _js/drones/ops.js_ · [`patrolOptions`](../drones/ops.js.md#s-patrolOptions) _js/drones/ops.js_ · [`posOf`](../drones/ops.js.md#s-posOf) _js/drones/ops.js_ · [`recall`](../drones/ops.js.md#s-recall) _js/drones/ops.js_ · [`rollOff`](../drones/ops.js.md#s-rollOff) _js/drones/ops.js_ · [`runFreight`](../drones/ops.js.md#s-runFreight) _js/drones/ops.js_ ×2 · [`setHome`](../drones/ops.js.md#s-setHome) _js/drones/ops.js_ · [`statusLine`](../drones/ops.js.md#s-statusLine) _js/drones/ops.js_ · [`stepDocked`](../drones/ops.js.md#s-stepDocked) _js/drones/ops.js_ ×2 · [`stepUnit`](../drones/ops.js.md#s-stepUnit) _js/drones/ops.js_ · [`chainReport`](../economy/chains.js.md#s-chainReport) _js/economy/chains.js_ · [`homePortOf`](../economy/chains.js.md#s-homePortOf) _js/economy/chains.js_ · [`noteChainDone`](../economy/chains.js.md#s-noteChainDone) _js/economy/chains.js_ ×2 · [`acceptBlocker`](../economy/contracts.js.md#s-acceptBlocker) _js/economy/contracts.js_ · [`acceptContract`](../economy/contracts.js.md#s-acceptContract) _js/economy/contracts.js_ ×2 · [`deliverContracts`](../economy/contracts.js.md#s-deliverContracts) _js/economy/contracts.js_ · [`targetPos`](../economy/contracts.js.md#s-targetPos) _js/economy/contracts.js_ · [`yardRepair`](../flight/repair.js.md#s-yardRepair) _js/flight/repair.js_ · [`EXEC.SMELT`](../mission/run.js.md#s-EXEC-SMELT) _js/mission/run.js_ · [`EXEC.STASH`](../mission/run.js.md#s-EXEC-STASH) _js/mission/run.js_ · [`ensureUndocked`](../mission/run.js.md#s-ensureUndocked) _js/mission/run.js_ · [`resolve`](../mission/run.js.md#s-resolve) _js/mission/run.js_ · [`makeSalvage>pick`](../mission/salvage.js.md#s-makeSalvage-pick) _js/mission/salvage.js_ · [`makeTradeOps.BUY`](../mission/tradeops.js.md#s-makeTradeOps-BUY) _js/mission/tradeops.js_ · [`makeTradeOps.DELIVER`](../mission/tradeops.js.md#s-makeTradeOps-DELIVER) _js/mission/tradeops.js_ · [`makeTradeOps.SELL`](../mission/tradeops.js.md#s-makeTradeOps-SELL) _js/mission/tradeops.js_ · [`deliver`](../npc/bounty.js.md#s-deliver) _js/npc/bounty.js_ · [`holdValueAt`](../npc/captain.js.md#s-holdValueAt) _js/npc/captain.js_ · [`applyWorldSnapshot`](../sim/sim.js.md#s-applyWorldSnapshot) _js/sim/sim.js_ · [`clampDocked`](../sim/sim.js.md#s-clampDocked) _js/sim/sim.js_ · [`dockPortFor`](../sim/sim.js.md#s-dockPortFor) _js/sim/sim.js_ ×3 · [`handInRecorders`](../sim/sim.js.md#s-handInRecorders) _js/sim/sim.js_ · [`onKill`](../sim/sim.js.md#s-onKill) _js/sim/sim.js_ ×3 · [`selectBody`](../sim/sim.js.md#s-selectBody) _js/sim/sim.js_ · [`sellAllOre`](../sim/sim.js.md#s-sellAllOre) _js/sim/sim.js_ · [`smeltAll`](../sim/sim.js.md#s-smeltAll) _js/sim/sim.js_ · [`st`](../sim/sim.js.md#s-st) _js/sim/sim.js_ · [`stashDeposit`](../sim/sim.js.md#s-stashDeposit) _js/sim/sim.js_ · [`stashWithdraw`](../sim/sim.js.md#s-stashWithdraw) _js/sim/sim.js_ · [`stepTractorTick`](../sim/sim.js.md#s-stepTractorTick) _js/sim/sim.js_ · [`toggleDock`](../sim/sim.js.md#s-toggleDock) _js/sim/sim.js_ ×3 · [`tradeBuy`](../sim/sim.js.md#s-tradeBuy) _js/sim/sim.js_ · [`tradeSell`](../sim/sim.js.md#s-tradeSell) _js/sim/sim.js_ · [`warpNodeById`](../sim/sim.js.md#s-warpNodeById) _js/sim/sim.js_ · [`setJob`](staffcare.js.md#s-setJob) _js/station/staffcare.js_ · [`workOptions`](staffcare.js.md#s-workOptions) _js/station/staffcare.js_ · [`ensureLife`](stafflife.js.md#s-ensureLife) _js/station/stafflife.js_ · [`TOPICS.ok~7`](staffline.js.md#s-TOPICS-ok-7) _js/station/staffline.js_ · [`TOPICS.run~4`](staffline.js.md#s-TOPICS-run-4) _js/station/staffline.js_ · [`TOPICS.run~6`](staffline.js.md#s-TOPICS-run-6) _js/station/staffline.js_ · [`TOPICS.run~8`](staffline.js.md#s-TOPICS-run-8) _js/station/staffline.js_ · [`destinations`](staffline.js.md#s-destinations) _js/station/staffline.js_ · [`passage`](staffline.js.md#s-passage) _js/station/staffline.js_ ×2 · [`tickLine`](staffline.js.md#s-tickLine) _js/station/staffline.js_ · [`whereOf`](staffline.js.md#s-whereOf) _js/station/staffline.js_ ×2 · [`mountStationDeck`](stationdeck.js.md#s-mountStationDeck) _js/station/stationdeck.js_ ×5 · [`EVENTS.run~11`](stationlife.js.md#s-EVENTS-run-11) _js/station/stationlife.js_ · [`carryPregnancyAshore`](stationlife.js.md#s-carryPregnancyAshore) _js/station/stationlife.js_ · [`tickStationLife`](stationlife.js.md#s-tickStationLife) _js/station/stationlife.js_ ×2 · [`townReport`](stationlife.js.md#s-townReport) _js/station/stationlife.js_ · [`autoTractor`](stationworks.js.md#s-autoTractor) _js/station/stationworks.js_ · [`stepTractor`](stationworks.js.md#s-stepTractor) _js/station/stationworks.js_ · [`mountDockBoot`](../ui/dockboot.js.md#s-mountDockBoot) _js/ui/dockboot.js_ · [`holdSlots`](../ui/holdview.js.md#s-holdSlots) _js/ui/holdview.js_

<!-- note:stationById -->
<!-- /note -->

### <a id="s-TRACTOR_R"></a>`TRACTOR_R`

const · **exported** · L177–177

<!-- note:TRACTOR_R -->
Docking wants you near a hangar mouth, slow enough for the tractor to take you, and not being shot at.
<!-- /note -->

### <a id="s-TRACTOR_V"></a>`TRACTOR_V`

const · **exported** · L178–178

<!-- note:TRACTOR_V -->
<!-- /note -->

### <a id="s-dockCheck"></a>`dockCheck(st, shipPos, relSpeed)`

function · **exported** · L179–189

- called by: [`stationStatus`](../sim/sim.js.md#s-stationStatus) _js/sim/sim.js_

<!-- note:dockCheck -->
<!-- /note -->

### <a id="s-sectorOf"></a>`sectorOf(st)`

function · **exported** · L191–193

<!-- note:sectorOf -->
<!-- /note -->

### <a id="s-describeStation"></a>`describeStation(st)`

function · **exported** · L195–204

- calls: [`bodyById`](../world/bodies.js.md#s-bodyById) _js/world/bodies.js_
- called by: [`finishDock`](../sim/sim.js.md#s-finishDock) _js/sim/sim.js_ · [`stationStatus`](../sim/sim.js.md#s-stationStatus) _js/sim/sim.js_

<!-- note:describeStation -->
<!-- /note -->
