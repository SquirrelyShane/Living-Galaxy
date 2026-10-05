# js/render/engine.js

[index](../../../README.md) · 2840 lines · 130 symbols · 48 imports · 1 importers

## About

<!-- note:@file -->
The world is ~10^6 units across and the ship is 2.4 units long, so we never
hand absolute coordinates to the GPU. Everything renders relative to the
ship (the floating origin) and depth is logarithmic.
<!-- /note -->

## Imports

| line | from | names | target |
|---|---|---|---|
| 1 | `../../vendor/three.module.min.js` | `*` as `THREE` | **missing in js/** |
| 2 | `../world/bodies.js` | `BEACONS`, `BODIES`, `beaconPosition`, `bodyById`, `bodyPosition`, `currentSystem`, `dist3`, `scanRadius`, `starBody` | [js/world/bodies.js](../world/bodies.js.md) |
| 13 | `../world/scale.js` | `remnantRadius` | [js/world/scale.js](../world/scale.js.md) |
| 14 | `../world/textures.js` | `makeGlowTexture`, `makePlanetTexture`, `makeRingTexture`, `planetPainter` | [js/world/textures.js](../world/textures.js.md) |
| 15 | `../world/rockgen.js` | `rockLook` | [js/world/rockgen.js](../world/rockgen.js.md) |
| 16 | `../bodygen/body.js` | `BAKE`, `rogueParams` | [js/bodygen/body.js](../bodygen/body.js.md) |
| 17 | `../bodygen/classes.js` | `CLASSES` | [js/bodygen/classes.js](../bodygen/classes.js.md) |
| 18 | `../bodygen/baked.js` | `mountBakedData`, `bakedMaterial` | [js/bodygen/baked.js](../bodygen/baked.js.md) |
| 19 | `../bodygen/grower.js` | `grow`, `peek`, `pump`, `cancel` as `cancelGrowth`, `growerStats` | [js/bodygen/grower.js](../bodygen/grower.js.md) |
| 20 | `./rockfx.js` | `makeRockFx` | [js/render/rockfx.js](rockfx.js.md) |
| 21 | `./impactfx.js` | `makeImpactFx` | [js/render/impactfx.js](impactfx.js.md) |
| 22 | `./holefx.js` | `makeHoleFx` | [js/render/holefx.js](holefx.js.md) |
| 23 | `../world/events/holes.js` | `holes` | [js/world/events/holes.js](../world/events/holes.js.md) |
| 24 | `../sim/sim.js` | `acquireLock`, `activeWaypoint`, `currentShipId`, `pauseTick`, `publishHud`, `sensorRange`, `sim`, `spoolTime`, `targetPosition`, `tickSim`, `waypointPosition`, `wireControlsTest` | [js/sim/sim.js](../sim/sim.js.md) |
| 25 | `../core/input.js` | `addLook`, `bindInput` | [js/core/input.js](../core/input.js.md) |
| 26 | `./attract.js` | `mountAttract` | [js/render/attract.js](attract.js.md) |
| 27 | `../audio/index.js` | `resumeAudioIfNeeded`, `tickAudio` | [js/audio/index.js](../audio/index.js.md) |
| 28 | `../flight/ship.js` | `batteryCap`, `forwardOf`, `rightOf`, `speedOf`, `upOf` | [js/flight/ship.js](../flight/ship.js.md) |
| 29 | `../ships/shipforge.js` | `forgeShip`, `tickHull` | [js/ships/shipforge.js](../ships/shipforge.js.md) |
| 30 | `../drones/droneforge.js` | `droneFor`, `droneBudget`, `releaseDrones`, `releaseDrone` | [js/drones/droneforge.js](../drones/droneforge.js.md) |
| 31 | `../flight/probes.js` | `probes` | [js/flight/probes.js](../flight/probes.js.md) |
| 32 | `../drones/ops.js` | `droneOps` | [js/drones/ops.js](../drones/ops.js.md) |
| 33 | `../drones/npcdrones.js` | `npcDrones` | [js/drones/npcdrones.js](../drones/npcdrones.js.md) |
| 34 | `../ships/shipdb.js` | `DEFAULT_SHIP_ID`, `shipById` | [js/ships/shipdb.js](../ships/shipdb.js.md) |
| 35 | `../world/field.js` | `inBelt`, `nearbyRocks`, `brokenRocks` | [js/world/field.js](../world/field.js.md) |
| 36 | `../flight/turrets.js` | `contacts`, `mining`, `shots`, `turretAim` | [js/flight/turrets.js](../flight/turrets.js.md) |
| 37 | `../npc/lanes.js` | `stationLane`, `lanePoint`, `laneCentre`, `spreadAt`, `beadLit`, `laneDistance`, `LANE_BEADS`, `LANE_DRAW_R`, `SUBLANES`, `ZONE_HALF_W`, `ZONE_HALF_H` | [js/npc/lanes.js](../npc/lanes.js.md) |
| 38 | `../station/stationyard.js` | `ensureBuilt` | [js/station/stationyard.js](../station/stationyard.js.md) |
| 39 | `../station/stationworks.js` | `tractor` | [js/station/stationworks.js](../station/stationworks.js.md) |
| 40 | `../stationgen/anim.js` | `tick` as `tickStation` | [js/stationgen/anim.js](../stationgen/anim.js.md) |
| 41 | `../core/perf.js` | `notePerf`, `perf` | [js/core/perf.js](../core/perf.js.md) |
| 42 | `../flight/contacts.js` | `contactView`, `hullTag`, `scanFocus` | [js/flight/contacts.js](../flight/contacts.js.md) |
| 43 | `./postfx.js` | `makeBloom` | [js/render/postfx.js](postfx.js.md) |
| 44 | `./warpfx.js` | `makeWarpFx` | [js/render/warpfx.js](warpfx.js.md) |
| 45 | `../npc/flow.js` | `flow` | [js/npc/flow.js](../npc/flow.js.md) |
| 46 | `./hullpool.js` | `templateFor`, `warm` as `warmPool`, `instanceOf`, `releaseInstance`, `drainPool` | [js/render/hullpool.js](hullpool.js.md) |
| 47 | `../npc/battles.js` | `fightCentre` | [js/npc/battles.js](../npc/battles.js.md) |
| 48 | `../npc/traffic.js` | `traffic`, `HOSTILE_ROLES`, `LAW_ROLES` | [js/npc/traffic.js](../npc/traffic.js.md) |
| 49 | `../net/worldsync.js` | `tickWorldSync`, `wireWorldSyncTest` | [js/net/worldsync.js](../net/worldsync.js.md) |
| 50 | `../world/debris.js` | `chunks` | [js/world/debris.js](../world/debris.js.md) |
| 51 | `../world/hulks.js` | `hulks` | [js/world/hulks.js](../world/hulks.js.md) |
| 52 | `../flight/rig.js` | `rig` | [js/flight/rig.js](../flight/rig.js.md) |
| 53 | `../world/events/cataclysm.js` | `dirFbm`, `dirNoise`, `kelvinHex` | [js/world/events/cataclysm.js](../world/events/cataclysm.js.md) |
| 54 | `../ui/tutorial.js` | `tickTutorial`, `wireTutorialTest` | [js/ui/tutorial.js](../ui/tutorial.js.md) |
| 55 | `../world/events/impactors.js` | `impactors` | [js/world/events/impactors.js](../world/events/impactors.js.md) |
| 56 | `../station/stations.js` | `stations` | [js/station/stations.js](../station/stations.js.md) |
| 57 | `../economy/materials.js` | `SECTORS` | [js/economy/materials.js](../economy/materials.js.md) |
| 58 | `../aria/aria.js` | `loadAria`, `wireAria` | [js/aria/aria.js](../aria/aria.js.md) |

## Imported by

- [js/main.js](../main.js.md) — `mountGame`

## Exports

- [`mountGame`](#s-mountGame) · function — used by [js/main.js](../main.js.md)

## Effects

- **dom.id** — `warp-flash` (mountGame:1371)
- **event.listen** — `wheel on canvas → (inline)` (mountGame:1415) · `dblclick on canvas → (inline)` (mountGame:1420) · `pointerdown on canvas → onPointerDown` (mountGame:1506) · `pointermove on canvas → onPointerMove` (mountGame:1507) · `pointerup on canvas → onPointerUp` (mountGame:1508) · `pointercancel on canvas → onPointerUp` (mountGame:1509)
- **event.unlisten** — `pointerdown on canvas → onPointerDown` (mountGame:2815) · `pointermove on canvas → onPointerMove` (mountGame:2816) · `pointerup on canvas → onPointerUp` (mountGame:2817) · `pointercancel on canvas → onPointerUp` (mountGame:2818)
- **global.write** — `window.__lgMarkers` (mountGame>tick:2795) · `window.__lgGL` (mountGame:2803) · `window.__lgAttract` (mountGame:2806)
- **storage.get** — `lgaa.attract` (mountGame:172) · `lgaa.rocks` (mountGame>rockQuality:1516)

## Symbols

### <a id="s-_f"></a>`_f`

const · L60–60

<!-- note:_f -->
<!-- /note -->

### <a id="s-_up"></a>`_up`

const · L61–61

<!-- note:_up -->
<!-- /note -->

### <a id="s-_right"></a>`_right`

const · L62–62

<!-- note:_right -->
<!-- /note -->

### <a id="s-_shipUp"></a>`_shipUp`

const · L63–63

<!-- note:_shipUp -->
<!-- /note -->

### <a id="s-_proj"></a>`_proj`

const · L64–64

<!-- note:_proj -->
<!-- /note -->

### <a id="s-_dummy"></a>`_dummy`

const · L65–65

<!-- note:_dummy -->
<!-- /note -->

### <a id="s-_basisX"></a>`_basisX`

const · L66–66

<!-- note:_basisX -->
<!-- /note -->

### <a id="s-_mouse"></a>`_mouse`

const · L67–67

<!-- note:_mouse -->
<!-- /note -->

### <a id="s-_ray"></a>`_ray`

const · L68–68

<!-- note:_ray -->
<!-- /note -->

### <a id="s-_mat"></a>`_mat`

const · L69–69

<!-- note:_mat -->
<!-- /note -->

### <a id="s-_bp"></a>`_bp`

const · L70–70

<!-- note:_bp -->
<!-- /note -->

### <a id="s-NEAR"></a>`NEAR`

const · L72–72

<!-- note:NEAR -->
<!-- /note -->

### <a id="s-FAR"></a>`FAR`

const · L73–73

<!-- note:FAR -->
<!-- /note -->

### <a id="s-STAR_SHELL"></a>`STAR_SHELL`

const · L74–74

<!-- note:STAR_SHELL -->
<!-- /note -->

### <a id="s-MAX_ROCKS"></a>`MAX_ROCKS`

const · L75–75

<!-- note:MAX_ROCKS -->
<!-- /note -->

### <a id="s-MAX_CHUNKS"></a>`MAX_CHUNKS`

const · L76–76

<!-- note:MAX_CHUNKS -->
<!-- /note -->

### <a id="s-MAX_IMPACTORS"></a>`MAX_IMPACTORS`

const · L77–77 · **never referenced**

<!-- note:MAX_IMPACTORS -->
<!-- /note -->

### <a id="s-MAX_SHOTS"></a>`MAX_SHOTS`

const · L78–78

<!-- note:MAX_SHOTS -->
<!-- /note -->

### <a id="s-disposeObject"></a>`disposeObject(root, keep=)`

function · L80–91

- calls: [`disposeMat`](#s-disposeMat)
- called by: [`mountGame`](#s-mountGame) · [`mountGame>clearWorld`](#s-mountGame-clearWorld) ×2 · [`mountGame>disposeRig`](#s-mountGame-disposeRig) · [`mountGame>rebuildBody`](#s-mountGame-rebuildBody) · [`mountGame>refreshOwnHull`](#s-mountGame-refreshOwnHull) · [`mountGame>syncHulks`](#s-mountGame-syncHulks) ×2 · [`mountGame>syncRemotes`](#s-mountGame-syncRemotes) ×2 · [`mountGame>syncTraffic`](#s-mountGame-syncTraffic) ×2 · [`mountGame>updateStations`](#s-mountGame-updateStations)

<!-- note:disposeObject -->
<!-- /note -->

### <a id="s-disposeMat"></a>`disposeMat(mat)`

function · L93–100

- called by: [`disposeObject`](#s-disposeObject)

<!-- note:disposeMat -->
- L99 · `m.__disposed = true;` — a queued surface job for this material is skipped, not painted onto a dead mat
<!-- /note -->

### <a id="s-hexColor"></a>`hexColor(hex)`

function · L102–104

- called by: [`mountGame>applyStar`](#s-mountGame-applyStar) ×3 · [`mountGame>buildPlanet`](#s-mountGame-buildPlanet) ×2

<!-- note:hexColor -->
<!-- /note -->

### <a id="s-_dematState"></a>`_dematState`

const · L106–106

<!-- note:_dematState -->
Deck-plan transition: the forged hull goes to cyan wireframe and fades as
`t` climbs 0 → 1. Materials are the forge's own (per hull), so touching
them touches nothing else.
<!-- /note -->

### <a id="s-dematerialize"></a>`dematerialize(group, t)`

function · L107–127

- called by: [`mountGame>tick`](#s-mountGame-tick)

<!-- note:dematerialize -->
<!-- /note -->

### <a id="s-makeShipGroup"></a>`makeShipGroup(color, scale=, shipId=, seed=, detail=)`

function · L129–134

- calls: [`shipById`](../ships/shipdb.js.md#s-shipById) _js/ships/shipdb.js_ ×2 · [`forgeShip`](../ships/shipforge.js.md#s-forgeShip) _js/ships/shipforge.js_
- called by: [`mountGame`](#s-mountGame) · [`mountGame>refreshOwnHull`](#s-mountGame-refreshOwnHull) · [`mountGame>syncHulks`](#s-mountGame-syncHulks) · [`mountGame>syncRemotes`](#s-mountGame-syncRemotes) · [`mountGame>syncTraffic`](#s-mountGame-syncTraffic)

<!-- note:makeShipGroup -->
- L130 · `const def = shipById(shipId) ?? shipById(DEFAULT_SHIP_ID);` — Hulls come from the fleet registry (shipdb.js) and are grown by the
  forge (shipforge.js) over the ship generator in js/shipgen/ — same def +
  seed is the same ship on every client. The group's real length is the
  registry length (1 u = 10 m); `scale` stays a straight multiplier so old
  call sites keep their footprint. `detail` is "full" for the hull you can
  walk around in the external view and "lite" for traffic and peers: same
  silhouette and fittings, no sub-metre clutter, one draw per material.
<!-- /note -->

### <a id="s-hullBudget"></a>`hullBudget`

const · L136–136

<!-- note:hullBudget -->
Generated hulls take tens of milliseconds to grow. A sky full of traffic
is built one hull per frame instead of all at once on arrival.
<!-- /note -->

### <a id="s-drawRange"></a>`drawRange()`

function · L137–137

- calls: [`sensorRange`](../sim/sim.js.md#s-sensorRange) _js/sim/sim.js_
- called by: [`meshRange`](#s-meshRange) · [`mountGame>syncHulks`](#s-mountGame-syncHulks) · [`mountGame>syncProbeMeshes`](#s-mountGame-syncProbeMeshes) · [`mountGame>syncTraffic`](#s-mountGame-syncTraffic) · [`mountGame>tick`](#s-mountGame-tick) ×3

<!-- note:drawRange -->
Hulls are drawn only inside sensor range (sim.sensorRange: 300 km, ×1.8 on a
pulse). Beyond it a ship is a transponder on the chart and nothing on the
canopy — the chart directory and its blips are how you find them.
<!-- /note -->

### <a id="s-MESH_K"></a>`MESH_K`

const · L138–138

<!-- note:MESH_K -->
What a MESH is built and drawn at, as opposed to what is known about. On a
device that is keeping up these are the same number. On one that is not,
the frame budget (perf.js) pulls the mesh radius in while leaving sensor
range, labels, tracks and the contact board exactly where they were: the
sky stops being expensive to draw without becoming harder to fly, and a
hull that stops being a model is still a name, a light and a target.

This matters because the bottleneck on a phone is usually the GPU, and
trimming simulation detail to fix a rasteriser does nothing at all.
<!-- /note -->

### <a id="s-meshRange"></a>`meshRange()`

function · L139–139

- calls: [`drawRange`](#s-drawRange)
- called by: [`mountGame>syncContactMeshes`](#s-mountGame-syncContactMeshes) · [`mountGame>syncFlow`](#s-mountGame-syncFlow) · [`mountGame>syncHulks`](#s-mountGame-syncHulks) · [`mountGame>syncTraffic`](#s-mountGame-syncTraffic) · [`mountGame>syncWorkDrones`](#s-mountGame-syncWorkDrones)

<!-- note:meshRange -->
<!-- /note -->

### <a id="s-ROCK_DRAW_R"></a>`ROCK_DRAW_R`

const · L140–140

<!-- note:ROCK_DRAW_R -->
Belt rocks resolve closer than hulls: they are drawn (and only exist for the
collision pass) inside this of the ship, growing in over the outer slice so
a cell never pops into the canopy fully formed.
<!-- /note -->

### <a id="s-ROCK_FADE"></a>`ROCK_FADE`

const · L141–141

<!-- note:ROCK_FADE -->
<!-- /note -->

### <a id="s-frameDt"></a>`frameDt`

const · L142–142

<!-- note:frameDt -->
<!-- /note -->

### <a id="s-throttleCapOf"></a>`throttleCapOf()`

function · L143–143

- called by: [`mountGame>tick`](#s-mountGame-tick)

<!-- note:throttleCapOf -->
Plume length is throttle over the normal band; overdrive pins it wide open.
<!-- /note -->

### <a id="s-orientCraft"></a>`orientCraft(group, yaw, pitch, roll)`

function · L145–165

- calls: [`forwardOf`](../flight/ship.js.md#s-forwardOf) _js/flight/ship.js_
- called by: [`mountGame>syncFlow`](#s-mountGame-syncFlow) · [`mountGame>syncHulks`](#s-mountGame-syncHulks) · [`mountGame>syncRemotes`](#s-mountGame-syncRemotes) · [`mountGame>syncTraffic`](#s-mountGame-syncTraffic) · [`mountGame>tick`](#s-mountGame-tick)

<!-- note:orientCraft -->
Builds a right-handed basis whose local -Z looks along the nose — the same
convention a three.js camera uses, so the cockpit lens can take this
quaternion straight. (X cross Y must equal Z or the matrix is a reflection
and setFromRotationMatrix quietly returns garbage.)

- L147 · `_f.set(-f.x, -f.y, -f.z);` — local +Z points behind
<!-- /note -->

### <a id="s-mountGame"></a>`mountGame(canvas)`

function · **exported** · L167–2840

- calls: [`loadAria`](../aria/aria.js.md#s-loadAria) _js/aria/aria.js_ · [`wireAria`](../aria/aria.js.md#s-wireAria) _js/aria/aria.js_ · [`mountBakedData`](../bodygen/baked.js.md#s-mountBakedData) _js/bodygen/baked.js_ · [`grow`](../bodygen/grower.js.md#s-grow) _js/bodygen/grower.js_ · [`bindInput`](../core/input.js.md#s-bindInput) _js/core/input.js_ · [`wireWorldSyncTest`](../net/worldsync.js.md#s-wireWorldSyncTest) _js/net/worldsync.js_ · [`mountAttract`](attract.js.md#s-mountAttract) _js/render/attract.js_ · [`disposeObject`](#s-disposeObject) · [`makeShipGroup`](#s-makeShipGroup) · [`mountGame>extReset`](#s-mountGame-extReset) · [`mountGame>extZoom`](#s-mountGame-extZoom) · [`mountGame>inst`](#s-mountGame-inst) · [`mountGame>rebuildWorld`](#s-mountGame-rebuildWorld) · [`mountGame>releaseBody`](#s-mountGame-releaseBody) · [`mountGame>releaseImpactorBody`](#s-mountGame-releaseImpactorBody) · [`mountGame>resize`](#s-mountGame-resize) · [`mountGame>rockQuality`](#s-mountGame-rockQuality) · [`makeHoleFx`](holefx.js.md#s-makeHoleFx) _js/render/holefx.js_ · [`makeImpactFx`](impactfx.js.md#s-makeImpactFx) _js/render/impactfx.js_ · [`makeBloom`](postfx.js.md#s-makeBloom) _js/render/postfx.js_ · [`makeRockFx`](rockfx.js.md#s-makeRockFx) _js/render/rockfx.js_ · [`makeWarpFx`](warpfx.js.md#s-makeWarpFx) _js/render/warpfx.js_ · [`currentShipId`](../sim/sim.js.md#s-currentShipId) _js/sim/sim.js_ · [`wireControlsTest`](../sim/sim.js.md#s-wireControlsTest) _js/sim/sim.js_ · [`wireTutorialTest`](../ui/tutorial.js.md#s-wireTutorialTest) _js/ui/tutorial.js_ · [`makeGlowTexture`](../world/textures.js.md#s-makeGlowTexture) _js/world/textures.js_ · [`makeRingTexture`](../world/textures.js.md#s-makeRingTexture) _js/world/textures.js_
- via [js/bodygen/grower.js](../bodygen/grower.js.md): `grow.then`
- called by: [`@file`](../main.js.md#) _js/main.js_
- effects: storage.get `lgaa.attract` · dom.id `warp-flash` · event.listen `wheel` · event.listen `dblclick` · event.listen `pointerdown` · event.listen `pointermove` · event.listen `pointerup` · event.listen `pointercancel` · global.write `window.__lgGL` · global.write `window.__lgAttract` · event.unlisten `pointerdown` · event.unlisten `pointermove` · event.unlisten `pointerup` · event.unlisten `pointercancel`

<!-- note:mountGame -->
- L170 · `const attractQuality = (() => {` — How much the title screen is allowed to spend. A forged hull costs tens
  of milliseconds once and a couple of thousand triangles a frame, and the
  nebula is one 2048x1024 canvas — cheap on a modern phone, not on a five
  year old one. The player can force it either way; otherwise it is judged
  on cores and whether the OS has been asked for less motion.
- L208 · `const origin = { x: 0, y: 0, z: 0 };` — Origin of the rendered world, in sim coordinates.
- L215 · `const sunLight = new THREE.DirectionalLight(0xffe8cc, 2.7);` — One directional light standing in for the star: at these distances a
  point light's falloff is unusable, but the rays are parallel anyway.
- L220 · `const starGeo = new THREE.BufferGeometry();` — --- star shell: parented to nothing, always centred on the camera ---
- L245 · `const warpFx = makeWarpFx(scene, starPos, STAR_SHELL);` — The warp layers reuse the shell's own star positions, so the streaks smear
  the sky that is actually there rather than a second one laid over it.
- L276 · `const PROTO_VARIANTS = 2;` — --- asteroid field ------------------------------------------------------
  
  Every rock in the belt is the asteroid generator's (0.3.02). The field used
  to be three hand-deformed icosahedra from js/world/rockgen.js wearing a tint, and
  the generator only ever reached the handful of rocks close aboard — at 7–12
  cells a face, where its craters and veins fall between the vertices.
  
  Now each taxonomic class has two PROTOTYPES grown by the generator at its
  own survey resolution and baked (js/bodygen/bake.js): a 768-triangle hull
  whose shading reads the full 32-cell surface — craters, grooves, frost,
  seams — from an atlas. Hundreds of rocks draw as instances of eighteen
  prototypes, one draw call each, the ore riding on a per-instance tint. The
  rocks close aboard still get their OWN grown body (below). Prototypes grow
  in the worker at launch; a class whose prototype has not landed yet simply
  does not draw for that second.
- L306 · `}, () => {` — reset or cancelled — a relaunch files it again
- L309 · `const asteroids = { get count() { return rockBuckets.reduce((s, b) => s + b.lods.reduce((n` — the old single-mesh handle the console and the smokes reach for; `count`
  is the whole field so "are there rocks on screen" still answers
- L310 · `const PROTO_LOD_ANG = [0.1, 0.03];` — angular radius (radius / distance) under which a rock drops to the next
  lattice: on a phone-width canopy about eighty pixels across, then about twenty-five
- L311 · `const LOD_HYST = 1.2;` — 0.3.62: a lattice change has to clear its threshold by this factor
- L312 · `const lodMemo = new Map();` — rock key → the lattice it drew at last frame
- L314 · `const grown = new Set();` — Dust. Belt haze was cut in the chart patch because a static Points band
  read as fog; this is the opposite idea — a small parallax cloud that only
  exists within a few hundred units of the hull, so it reads as speed
  through the rocks rather than as weather.
- L314 · `const grown = new Set();` — --- grown bodies -------------------------------------------------------
  
  The instanced field above draws four hundred rocks for thirty thousand
  triangles, which is what makes a belt a belt on a phone. It is also a lie
  up close: every rock in it is one of three hulls wearing a tint.
  
  So the handful you are actually near get GROWN — Shane's asteroid
  generator (vendored at js/asteroidgen/, asked through js/bodygen/body.js)
  on Living Galaxy's ores: one of seven body kinds, aged craters and basins,
  vein networks, frost in the cold traps, metal standing proud of the
  matrix, outcrops where a seam breaks the surface — and, on the rock you
  are working, seated boulders and a halo of chips (js/render/rockfx.js). At most
  one is grown per frame and they are cached by rock key; a rock is
  deterministic, so a body built once is right forever.
  
  0.3.02: grown in the worker at the generator's own resolution and baked
  (js/bodygen/grower.js, bake.js); mounted one per frame. The outcrop
  crystals, the seated rubble and the ice clouds are gone — the seams are in
  the surface now, and a stationary rock does not wear a debris ring.
- L316 · `const BODY_R = 3400;` — grow a body inside this of the hull
- L317 · `const BODY_MIN_R = 55;` — …and only for rocks big enough to look at
- L318 · `const BODY_KEEP = 0.34;` — 0.3.28 — hysteresis on the grown set.
  
  A grown body is the rock's OWN geometry; everything else in the belt draws
  as one of a handful of class prototypes. So a rock crossing the budget
  boundary does not fade — it changes shape. The set used to be recomputed
  by rank every frame with a hard cut at the budget, and on a phone the
  budget is four: drifting through the belt at 220 u/s, nine different rocks
  fought over those four slots and swapped ten times in two and a half
  seconds. Sitting still was fine. Moving at all made the belt boil.
  
  An incumbent now carries a handicap — it is treated as `KEEP` nearer than
  it is — so a challenger has to be properly closer to take the slot, not a
  metre closer for one frame. It also keeps its body out to `FAR` rather
  than losing it the moment it passes BODY_R, so the swap happens out at the
  edge of the range where a rock subtends a few pixels, instead of at arm's
  length where you are looking at it. And a body that has just been mounted
  is not evicted for `HOLD` seconds, so a burst of arrivals cannot evict
  each other in turn.
- L318 · `const BODY_KEEP = 0.34;` — an incumbent ranks as this much of BODY_R nearer than it is
- L319 · `const BODY_FAR = 1.45;` — …and keeps its body until this multiple of BODY_R
- L320 · `const BODY_HOLD = 1.5;` — s a fresh mount is safe from eviction
- L321 · `const bodies = new Map();` — rock key → { group, unit, mesh, mount, assay, cls, used }
- L334 · `const dustMat = new THREE.PointsMaterial({ map: glowTex, color: 0x9d968b, size: 3, sizeAtt` — soft round motes: a bare PointsMaterial draws a square, and close to the hull those read as white tiles
- L353 · `const shotGeo = new THREE.BufferGeometry();` — --- ordnance ---
- L363 · `const BEAM_SEGS = 8;` — --- mining laser ------------------------------------------------------
  A segmented cutter beam from the emitter under the lens to the rock,
  chips flying off the cut, a dust plume drifting away from it — and when
  the cutter drops out, the beam breaks into its sections and each one
  shrinks to nothing in turn instead of just blinking off.
- L365 · `beamSegGeo.rotateX(Math.PI / 2);` — axis along +Z so lookAt aims it
- L373 · `const core = new THREE.Mesh(beamSegGeo, new THREE.MeshBasicMaterial({ color: 0xfff6e2, tra` — the core is drawn normally, not additively, so it still reads against a sunlit face
- L383 · `const MAX_CHIPS = 160;` — chips: a pool of points flying off the cut
- L386 · `const chipAge = new Float32Array(MAX_CHIPS).fill(-1);` — <0 = free
- L396 · `const MAX_PUFFS = 14;` — dust: a few soft puffs that swell and thin out
- L406 · `const chunkGeo = new THREE.IcosahedronGeometry(1, 0);` — --- debris ---
- L412 · `debrisMesh.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(MAX_CHUNKS` — per-instance colour allocated up front so fresh, still-glowing rubble can
  be tinted without forcing a shader recompile mid-catastrophe
- L418 · `const impBodies = new Map();` — --- super asteroids -----------------------------------------------------
  
  The rogue rocks were the one thing the rock rebuild missed. They were an
  80-face IcosahedronGeometry(1, 1) in flat brown, drawn eight at a time
  through an InstancedMesh — which is why a named body big enough to end a
  moon read as a paper bag from 290 km out, while the pebbles in the belt
  beside it had craters and ore in them.
  
  Instancing bought nothing here: there are never more than three alive
  (impactors.js, MAX_LIVE) and you fly at them one at a time. So each rogue
  gets its OWN grown body off the same generator the belt uses — a real
  taxonomic class, craters, a per-vertex mineral assay, metal standing proud
  of the matrix, outcrops where a seam breaks the surface. Three bodies at
  detail 4 is 1,500 faces, which is cheaper than the belt's far bucket.
  
  They are grown one per frame and cached by id, so the ~30 ms of growth is
  paid once per rock per session and never in a burst. Until a body exists —
  and at the quality floor, where none are grown — the rock wears a shared
  placeholder hull that is at least deformed and textured rather than round.
- L418 · `const impBodies = new Map();` — impactor id → { group, unit, mesh, mount, assay, cls, r }
- L420 · `const ROGUE_CLASSES = ["S", "S", "S", "C", "C", "C", "M", "M", "X", "B", "V", "P", "D", "E` — A rogue arrives from outside the system, so it is not drawn from a belt
  band's shortlist — it can be anything, weighted the way the sky's rock
  population is. Deterministic on the rock's own seed, so the thing you
  catalogued as a metal body is still a metal body next time you see it.
- L423 · `const _seenDrone = new Set();` — No stand-in hull any more: a rogue's body is requested the moment the rock
  exists (tens of kilometres out) and lands from the worker in well under the
  time it takes to fly close enough to see it.
- L423 · `const _seenDrone = new Set();` — --- stations: STATIONGEN hulls, grown once per port by the yard ---
- L423 · `const _seenDrone = new Set();` — reused eviction scratch, see syncContactMeshes
- L426 · `const flowMeshes = new Map();` — port heartbeat boats (hull pool instances), see syncFlow
- L427 · `const navLights = new Map();` — running lights: a strobe per hull on the board, sized so it never drops under a few pixels — a
  30 m boat is a sub-pixel speck at 2 km, but its anti-collision light is not
- L427 · `const navLights = new Map();` — id → { sprite, phase }
- L456 · `const LAMP_FULL_R = 6000;` — A port's own lighting: full inside LAMP_FULL_R, out by LAMP_OUT_R. The
  curve is eased so the last of it goes rather than lingering as a dim
  smudge, and LAMP_OUT_R sits inside sensor range on purpose — past it a
  port is a contact and a silhouette, not a light source.
- L464 · `const STATION_ANIM_R = 45000;` — rings spin, lamps blink, drones sortie inside this
- L486 · `const laneRigs = new Map();` — --- traffic lanes: the funnel out of the primary hangar mouth. Two strings of
  beads per lane along the zone's edges, a runner chasing along each (out on
  the exit lane, in on the entry lane), a translucent wedge per lane with its
  three ways ruled inside, gate rings at the mouth and the far end. Built in
  the hull's own frame and turned with it.
- L489 · `const LANE_SHOW_R = LANE_DRAW_R;` — the rig is drawn only inside this of the lane itself (5 km), brightening as you close
- L635 · `const floods = new THREE.PointLight(0xdfe8f5, 0, 4200, 1.4);` — --- hull floodlights ---
- L638 · `const droneMeshes = new Map();` — --- contacts (drones) ---
- L638 · `const droneMeshes = new Map();` — (The shared tetrahedron and cone that used to stand in for a drone whose
  design had not grown are gone — see syncContactMeshes. Nothing that flies
  is an abstract shape any more.)
- L639 · `const probeMeshes = new Map();` — your survey probes in flight (droneforge "probe" design)
- L640 · `const workMeshes = new Map();` — your work drones (drones/ops.js), one robot per drone
- L641 · `const activeFX = [];` — declared up here so clearWorld can empty them: the FX sections below fill them
- L641 · `const activeFX = [];` — impact FX, see spawnImpactFX
- L642 · `const eventRigs = new Map();` — staged cataclysm rigs, see buildEventRig
- L643 · `const bodyRings = new Map();` — the rings debris settles into, see stepBodyRings
- L687 · `const texQueue = [];` — Surfaces are expensive to paint, so the world comes up flat-shaded and
  each body gets its real skin over the following frames.
- L689 · `const texCache = new Map();` — 0.3.61 — painted skins outlive a rebuild of the SAME sky. The menu grows
  the backdrop, FLY AS grows the sky again, and every world used to come up
  flat and be repainted one a frame (100–300 ms each on a phone) all over
  again. A skin is a pure function of its arguments, so it is kept, marked
  `keep` so disposeObject passes it by, and let go when the sky changes.
- L692 · `const CLOSE_IN = 8, CLOSE_OUT = 11;` — 0.3.73 — the world you are near gets a close-up skin (js/world/textures.js
  planetPainter): same surface, 1536 px across and two more octaves, painted
  a few rows a frame once the sky's own skins are done. One world at a time;
  it hands the ordinary skin back when you leave. Tier 0–1 devices skip it.
- L692 · `const CLOSE_IN = 8, CLOSE_OUT = 11;` — radii from the centre: start painting / let go (spawn sits at ~4.6)
- L966 · `let beltHaze = null;` — --- belt haze: the belts as a band you can see from anywhere ---------
  A cloud of faint points in each belt annulus, seeded per sky. Rocks
  proper are diced out of field.js when you are inside; this is the
  far view, so the belt reads as a place before you reach it.
- L995 · `let shipId = currentShipId();` — Own hull — only drawn in the external camera mode. Forged from the
  pilot's issued hull, seeded by callsign, and re-forged on promotion.
- L1020 · `const fxRingGeo = new THREE.RingGeometry(0.88, 1, 64);` — ---- impact destruction FX --------------------------------------------
  The sim queues strikes (sim.impactFX); this drains them into animated
  meshes parented to the planet's own group, so the waves ride the spin:
  a flash at the site, shock rings walking outward across the surface, a
  blast dome for the cataclysms, and a glowing scar that cools into the
  dark crater the rebuild draws. Shared unit geometry, per-FX materials.
- L1124 · `` const SHELL_VERT = ` `` — ---- staged cataclysms & the lit sky ------------------------------------
  sim.events carries the live curve (see js/world/events/cataclysm.js); this turns each
  one into geometry that lives for the whole event rather than a one-shot
  puff: an incandescent core, a vapour plume that balloons and cools, a
  fresnel-rimmed blast shell, an ejecta curtain, supernova shock pulses,
  and the ring the debris settles into.
  
  It also lights the rest of the sky from the event. Three recycled point
  lights follow the brightest events, so a world dying BEHIND you rim-lights
  your hull from behind and the exposure lifts — you see it happen without
  seeing it. That is what a real transient does to a real eye.
- L1281 · `const eventLights = [];` — ---- the sky lights up -------------------------------------------------
- L1373 · `let camMode = 0;` — 0 = cockpit FPV, 1 = external
- L1393 · `const ext = { yaw: 0.55, pitch: 0.22, dist: 4.2, panX: 0, panY: 0 };` — --- external camera: orbit / pan / zoom around the hull ---------------
  One finger (or the mouse) orbits, the wheel or a pinch zooms, two
  fingers together pan the point the camera looks at. Angles are in the
  hull's own frame so the view rides the ship through a turn.
- L1537 · `const bakeTier = bodyBudget >= 18 ? "high" : bodyBudget >= 10 ? "full" : bodyBudget > 0 ?` — The bake tier off the same budget that decides how many bodies there are:
  a device carrying four gets coarser ones than a device carrying eighteen.
- L1543 · `const shapes = new Map();` — 0.3.62 — ONE ROCK, ONE SHAPE.
  
  Reported: a rock turned into a different rock as you closed on it, and the
  belt kept rebuilding. Both were by design. Far away a rock drew as its
  class prototype (`belt-prototype:&lt;cls>:&lt;v>`); inside BODY_R it swapped to a
  body grown off its OWN key — a different seed, so a different body kind,
  different lobes, different craters: measured 9–25% mean radial difference,
  up to 55% at the worst point of the silhouette. And every rock you passed
  filed its own grow in the worker (~150–200 ms each) and dropped it again
  when it left the budget, so a pass through the belt was a stream of
  rebuilds. (The ore `favour` alone moves the silhouette 12–21% — it spends
  the generator's draws — so it could not simply be carried across.)
  
  Now the prototype IS the rock's shape at every range. Close aboard it is
  the SAME seed and rolls grown at the device's finer lattice — the same
  surface function sampled denser, 2–3% mean difference, which reads as
  detail resolving, not as a new rock (on `low` the belt lattice is the
  prototype's own, so it is the identical mesh). Each shape is grown ONCE per
  prototype per session and shared: a close-aboard rock is a mesh on shared
  geometry with its own material only for its tint, which is the instance's
  tint to the digit. Nothing is regrown as you fly; a rock changes only when
  something happens to it (worn by the cutter, shattered, struck).
- L1543 · `const shapes = new Map();` — `${cls}:${v}` → { mount, built, unitR, owned }
- L2035 · `const sdroneGlow = new THREE.SpriteMaterial({ map: glowTex, color: 0x7df0ff, transparent:` — a port's interceptors: a blue dart with a plume, nose along its velocity
- L2037 · `const beamMat = new THREE.MeshBasicMaterial({ color: 0x7fe0ff, transparent: true, opacity:` — the tractor: a pulsing beam from the mouth to the hull while port control has the helm
- L2067 · `const _dLook = new THREE.Vector3();` — Remote drones are robots (droneforge.js over js/robotgen/): a port's interceptors and gun
  drones are its own line's design, seeded by the port's name. A contact flies the old
  placeholder for the frame or two until its design is grown, then swaps.
- L2106 · `const workBeamMat = new THREE.LineBasicMaterial({ color: 0xffa24a, transparent: true, opac` — Your work drones: drawn inside draw range and off the clamps; a cutter beam while mining.
- L2160 · `const _pDir = new THREE.Vector3();` — Your survey probes: drawn while they are in flight and inside draw range.
- L2263 · `const _liveFlow = new Set();` — The flow: port heartbeat boats, drawn from the hull pool. An instance
  shares its template's geometry — never run the disposer on one.
- L2346 · `const edgeBuf = [];` — Off-screen candidates, reused each HUD pass. There is no far-contact
  buffer any more: the canopy names nothing it cannot see on sensors, so
  there is no tier beyond `drawRange()` to rank.
- L2347 · `const _relById = new Map();` — contact id → relation, rebuilt per HUD pass
- L2348 · `const EDGE_M = 7;` — % inset of an off-screen marker from the edge
- L2349 · `const EDGE_NEAR_R = 70000;` — and anything this close gets one whatever it is
- L2803 · `window.__lgGL = { scene, camera, renderer, worldRoot, sunGroup, sun, planets, origin, aste` — dev handle — handy when the sky looks wrong
- L2805 · `const attract = mountAttract({ scene, camera, canvas, worldRoot, reduced, quality: attract` — The title card used to look out on an empty starfield: the menu camera sat
  twenty-six star-radii out and aimed at the barycentre, so every world in
  the sky rendered at under a pixel. The attract director reframes that same
  scene onto the best world in it and hangs one real forged hull in the
  foreground. It owns only what it adds, and it comes down the moment the
  sim launches.
<!-- /note -->

#### <a id="s-mountGame-rel"></a>`mountGame>rel(x, y, z, obj)`

function · L209–209

- called by: [`mountGame>syncContactMeshes`](#s-mountGame-syncContactMeshes) · [`mountGame>syncFlow`](#s-mountGame-syncFlow) · [`mountGame>syncHulks`](#s-mountGame-syncHulks) · [`mountGame>syncProbeMeshes`](#s-mountGame-syncProbeMeshes) · [`mountGame>syncRemotes`](#s-mountGame-syncRemotes) · [`mountGame>syncTraffic`](#s-mountGame-syncTraffic) · [`mountGame>syncWorkDrones`](#s-mountGame-syncWorkDrones) · [`mountGame>tick`](#s-mountGame-tick) ×6 · [`mountGame>updateLanes`](#s-mountGame-updateLanes) · [`mountGame>updateStations`](#s-mountGame-updateStations)

<!-- note:mountGame>rel -->
<!-- /note -->

#### <a id="s-mountGame-inst"></a>`mountGame>inst(geo)`

function · L291–300

- called by: [`mountGame`](#s-mountGame)

<!-- note:mountGame>inst -->
<!-- /note -->

#### <a id="s-mountGame-count"></a>`mountGame.count()`

prop · L309–309

<!-- note:mountGame.count -->
<!-- /note -->

#### <a id="s-mountGame-rogueClass"></a>`mountGame>rogueClass(m)`

function · L421–421

- called by: [`mountGame>impactorBody`](#s-mountGame-impactorBody)

<!-- note:mountGame>rogueClass -->
<!-- /note -->

#### <a id="s-mountGame-navLightFor"></a>`mountGame>navLightFor(id, color)`

function · L429–441

- called by: [`mountGame>syncFlow`](#s-mountGame-syncFlow) · [`mountGame>syncHulks`](#s-mountGame-syncHulks) · [`mountGame>syncTraffic`](#s-mountGame-syncTraffic) ×2

<!-- note:mountGame>navLightFor -->
<!-- /note -->

#### <a id="s-mountGame-placeNavLight"></a>`mountGame>placeNavLight(L, x, y, z, t, d)`

function · L442–448

- called by: [`mountGame>syncFlow`](#s-mountGame-syncFlow) · [`mountGame>syncHulks`](#s-mountGame-syncHulks) · [`mountGame>syncTraffic`](#s-mountGame-syncTraffic) ×2

<!-- note:mountGame>placeNavLight -->
<!-- /note -->

#### <a id="s-mountGame-dropNavLight"></a>`mountGame>dropNavLight(id)`

function · L449–455

- called by: [`mountGame>clearWorld`](#s-mountGame-clearWorld) · [`mountGame>syncFlow`](#s-mountGame-syncFlow) · [`mountGame>syncHulks`](#s-mountGame-syncHulks) ×2 · [`mountGame>syncTraffic`](#s-mountGame-syncTraffic) ×3

<!-- note:mountGame>dropNavLight -->
<!-- /note -->

#### <a id="s-mountGame-lampLevel"></a>`mountGame>lampLevel(d)`

function · L458–463

- called by: [`mountGame>updateStations`](#s-mountGame-updateStations)

<!-- note:mountGame>lampLevel -->
<!-- /note -->

#### <a id="s-mountGame-makeStation"></a>`mountGame>makeStation(st)`

function · L466–476

- calls: [`ensureBuilt`](../station/stationyard.js.md#s-ensureBuilt) _js/station/stationyard.js_
- called by: [`mountGame>updateStations`](#s-mountGame-updateStations)

<!-- note:mountGame>makeStation -->
- L471 · `const proxy = new THREE.Mesh(new THREE.SphereGeometry(Math.max(20, st.radius), 12, 8), new` — what a tap hits: an unseen sphere the size of the hull
<!-- /note -->

#### <a id="s-mountGame-dropProxy"></a>`mountGame>dropProxy(holder)`

function · L477–484

- called by: [`mountGame>clearWorld`](#s-mountGame-clearWorld) · [`mountGame>updateStations`](#s-mountGame-updateStations)

<!-- note:mountGame>dropProxy -->
the tap sphere is the engine's own: freed with the holder, and off the pick list
<!-- /note -->

#### <a id="s-mountGame-makeLanes"></a>`mountGame>makeLanes(st)`

function · L491–572

- calls: [`laneCentre`](../npc/lanes.js.md#s-laneCentre) _js/npc/lanes.js_ · [`lanePoint`](../npc/lanes.js.md#s-lanePoint) _js/npc/lanes.js_ ×2 · [`spreadAt`](../npc/lanes.js.md#s-spreadAt) _js/npc/lanes.js_ · [`stationLane`](../npc/lanes.js.md#s-stationLane) _js/npc/lanes.js_ · [`mountGame>makeLanes>edge`](#s-mountGame-makeLanes-edge) ×2
- called by: [`mountGame>updateStations`](#s-mountGame-updateStations)

<!-- note:mountGame>makeLanes -->
- L494 · `const origin0 = { x: 0, y: 0, z: 0, seed: st.seed, radius: st.radius, port: st.portLocal ?` — the rig lives in the unrotated hull frame; updateLanes yaws it with the port
- L508 · `const strings = [];` — marker beads: two strings per lane, along the zone's outer edges
- L508 · `const strings = [];` — { which, lat }
- L529 · `for (const which of lanes) {` — the coloured zones: a translucent wedge per lane, three ways ruled inside
- L557 · `const yaw = Math.atan2(f.dir.x, f.dir.z);` — gates: a ring at the mouth end and at the far end of each lane, sized to the zone there
<!-- /note -->

##### <a id="s-mountGame-makeLanes-edge"></a>`mountGame>makeLanes>edge(which, u, latK, vertK, out)`

function · L498–507

- calls: [`laneCentre`](../npc/lanes.js.md#s-laneCentre) _js/npc/lanes.js_ · [`spreadAt`](../npc/lanes.js.md#s-spreadAt) _js/npc/lanes.js_
- called by: [`mountGame>makeLanes`](#s-mountGame-makeLanes) ×2

<!-- note:mountGame>makeLanes>edge -->
<!-- /note -->

#### <a id="s-mountGame-updateLanes"></a>`mountGame>updateLanes(t)`

function · L573–599

- calls: [`beadLit`](../npc/lanes.js.md#s-beadLit) _js/npc/lanes.js_ · [`laneDistance`](../npc/lanes.js.md#s-laneDistance) _js/npc/lanes.js_ · [`mountGame>rel`](#s-mountGame-rel)
- via [js/station/stations.js](../station/stations.js.md): `stations.find`
- called by: [`mountGame>updateStations`](#s-mountGame-updateStations)

<!-- note:mountGame>updateLanes -->
- L574 · `if (!sim.ui?.lanesDrawn) { for (const [, g] of laneRigs) g.visible = false; return; }` — the lane rigs are a chart overlay now (CMD › Flight › Lane rigs): port control flies the
  lane for you, so by default nothing is drawn — the geometry still steers the autopilot
- L580 · `const d = laneDistance(st, sim.ship.pos);` — the lanes are an approach aid, not a landmark: nothing past LANE_SHOW_R of the lane itself, fading in from there
<!-- /note -->

#### <a id="s-mountGame-updateStations"></a>`mountGame>updateStations(dt)`

function · L601–633

- calls: [`disposeObject`](#s-disposeObject) · [`mountGame>dropProxy`](#s-mountGame-dropProxy) · [`mountGame>lampLevel`](#s-mountGame-lampLevel) · [`mountGame>makeLanes`](#s-mountGame-makeLanes) · [`mountGame>makeStation`](#s-mountGame-makeStation) · [`mountGame>rel`](#s-mountGame-rel) · [`mountGame>updateLanes`](#s-mountGame-updateLanes) · [`tick`](../stationgen/anim.js.md#s-tick) _js/stationgen/anim.js_ ×2 · [`dist3`](../world/bodies.js.md#s-dist3) _js/world/bodies.js_
- via [js/station/stations.js](../station/stations.js.md): `stations.some`
- called by: [`mountGame>tick`](#s-mountGame-tick)

<!-- note:mountGame>updateStations -->
- L617 · `if (m.visible && st.gen) {` — The hull is a shape out to STATION_DRAW_R; its LIGHTING is not. A port's
  gate lamps, roof floods, chase beads and mouth strips read at full
  strength on the approach and are gone well before sensor range, so a
  station stops being a smear of white dots visible from the far side of
  the system and becomes something you have to get close to to read.
<!-- /note -->

#### <a id="s-mountGame-clearWorld"></a>`mountGame>clearWorld()`

function · L645–671

- calls: [`releaseDrones`](../drones/droneforge.js.md#s-releaseDrones) _js/drones/droneforge.js_ · [`disposeObject`](#s-disposeObject) ×2 · [`mountGame>disposeRig`](#s-mountGame-disposeRig) · [`mountGame>dropCloseUp`](#s-mountGame-dropCloseUp) · [`mountGame>dropNavLight`](#s-mountGame-dropNavLight) · [`mountGame>dropProxy`](#s-mountGame-dropProxy)
- called by: [`mountGame>rebuildWorld`](#s-mountGame-rebuildWorld)

<!-- note:mountGame>clearWorld -->
- L646 · `for (const [, m] of stationMeshes) { scene.remove(m); dropProxy(m); }` — station ids restart at st1 every sky — never let a stale mesh answer to a new id.
  The hulls themselves are the yard's: stations.js releases them with the roster.
- L648 · `for (const fx of activeFX) for (const part of fx.parts) { fx.group.remove(part.mesh); if (` — FX are parented to planet groups that are about to go: nothing may keep pointing at them
- L651 · `for (const [, m] of bodyRings) { m.parent?.remove(m); m.geometry.dispose(); m.material.dis` — body ids repeat across skies: a ring built for the last sky's radii must not answer to this one's
- L653 · `for (const [, m] of droneMeshes) scene.remove(m);` — drones are clones of per-port designs (droneforge.js): out of the scene first, then free the designs
<!-- /note -->

#### <a id="s-mountGame-applyStar"></a>`mountGame>applyStar(star)`

function · L673–685

- calls: [`hexColor`](#s-hexColor) ×3 · [`makePlanetTexture`](../world/textures.js.md#s-makePlanetTexture) _js/world/textures.js_
- called by: [`mountGame>rebuildWorld`](#s-mountGame-rebuildWorld)

<!-- note:mountGame>applyStar -->
<!-- /note -->

#### <a id="s-mountGame-dropCloseUp"></a>`mountGame>dropCloseUp()`

function · L695–702

- called by: [`mountGame>clearWorld`](#s-mountGame-clearWorld) · [`mountGame>stepCloseUp`](#s-mountGame-stepCloseUp)

<!-- note:mountGame>dropCloseUp -->
<!-- /note -->

#### <a id="s-mountGame-stepCloseUp"></a>`mountGame>stepCloseUp()`

function · L703–729

- calls: [`mountGame>dropCloseUp`](#s-mountGame-dropCloseUp) · [`mountGame>texArgs`](#s-mountGame-texArgs) · [`bodyPosition`](../world/bodies.js.md#s-bodyPosition) _js/world/bodies.js_ · [`planetPainter`](../world/textures.js.md#s-planetPainter) _js/world/textures.js_
- called by: [`mountGame>tick`](#s-mountGame-tick)

<!-- note:mountGame>stepCloseUp -->
- L711 · `if (!near || texQueue.length) return;` — the sky's own skins come first
- L721 · `if (closeUp.painter.step(perf.tier >= 3 ? 4 : 2)) {` — ~7 ms a frame on a desktop core at 4 rows; a phone about 2–3×
<!-- /note -->

#### <a id="s-mountGame-texArgs"></a>`mountGame>texArgs(b)`

function · L730–730

- called by: [`mountGame>stepCloseUp`](#s-mountGame-stepCloseUp) · [`mountGame>texKey`](#s-mountGame-texKey) · [`mountGame>tick`](#s-mountGame-tick)

<!-- note:mountGame>texArgs -->
<!-- /note -->

#### <a id="s-mountGame-texKey"></a>`mountGame>texKey(b)`

function · L731–731

- calls: [`mountGame>texArgs`](#s-mountGame-texArgs)
- called by: [`mountGame>buildPlanet`](#s-mountGame-buildPlanet) · [`mountGame>tick`](#s-mountGame-tick)

<!-- note:mountGame>texKey -->
<!-- /note -->

#### <a id="s-mountGame-texCacheFor"></a>`mountGame>texCacheFor(sky)`

function · L732–737

- called by: [`mountGame>rebuildWorld`](#s-mountGame-rebuildWorld)

<!-- note:mountGame>texCacheFor -->
<!-- /note -->

#### <a id="s-mountGame-surfJag"></a>`mountGame>surfJag(seed, nx, ny, nz)`

function · L739–741

- calls: [`dirNoise`](../world/events/cataclysm.js.md#s-dirNoise) _js/world/events/cataclysm.js_
- called by: [`mountGame>deformCratered`](#s-mountGame-deformCratered)

<!-- note:mountGame>surfJag -->
Deterministic per-vertex jitter, hashed off the QUANTIZED surface normal so
the sphere's UV seam (duplicated vertices at the same position) jags the
same way on both sides and never cracks open.

- L740 · `return dirNoise(seed, nx, ny, nz, 4);` — kept as the low-frequency roughness term, but SMOOTH now: the old
  version hashed every vertex independently, so neighbouring vertices got
  uncorrelated displacement and every damaged world grew a coat of
  spikes. dirNoise interpolates a lattice over the direction vector, so
  neighbours move together — rough, not hairy — and it is still a pure
  function of the unit normal, so duplicated UV-seam vertices agree.
- L740 · `return dirNoise(seed, nx, ny, nz, 4);` — freq 4 puts ~3-4 vertices inside every noise cell at the damaged-world
  mesh density (96 segments), which is the difference between a rough
  rim and a pincushion
<!-- /note -->

#### <a id="s-mountGame-deformCratered"></a>`mountGame>deformCratered(geo, b, drawR)`

function · L743–789

- calls: [`mountGame>surfJag`](#s-mountGame-surfJag)
- called by: [`mountGame>buildPlanet`](#s-mountGame-buildPlanet)

<!-- note:mountGame>deformCratered -->
Real crater geometry: every recorded strike digs a bowl with a rough floor
and a thrown-up rim, and scorches the ground it dug — so a hit world stops
being a perfect sphere and big hits read as missing pieces on the limb.

- L761 · `const rough = c.rough ?? 1;` — how sharp this basin still is — a slumped one is smooth
- L764 · `disp -= (1 - u * u) * depth * (1 + j * 0.3);` — the bowl: parabolic floor, roughened, deepest at the middle
- L767 · `const w = 1 - (u - 1) / 0.4;` — the thrown-up rim just past the lip, fading out. Smooth noise
  only — this term used to be per-vertex white noise, which is what
  turned a hard-hit world into a pincushion.
- L774 · `disp = Math.max(-0.42, Math.min(0.16, disp));` — overlapping basins used to stack without limit and chew a world
  down to 0.4 R in places. A body can lose a bite, not evaporate.
<!-- /note -->

#### <a id="s-mountGame-deformShatteredCore"></a>`mountGame>deformShatteredCore(geo, b, drawR)`

function · L791–807

- calls: [`dirFbm`](../world/events/cataclysm.js.md#s-dirFbm) _js/world/events/cataclysm.js_ · [`dirNoise`](../world/events/cataclysm.js.md#s-dirNoise) _js/world/events/cataclysm.js_
- called by: [`mountGame>buildPlanet`](#s-mountGame-buildPlanet)

<!-- note:mountGame>deformShatteredCore -->
A shattered remnant is a shard, not a ball: three octaves of seam-safe
noise tear the core into an irregular lump.
<!-- /note -->

#### <a id="s-mountGame-buildPlanet"></a>`mountGame>buildPlanet(b, keepMap=)`

function · L809–889

- calls: [`hexColor`](#s-hexColor) ×2 · [`mountGame>deformCratered`](#s-mountGame-deformCratered) · [`mountGame>deformShatteredCore`](#s-mountGame-deformShatteredCore) · [`mountGame>texKey`](#s-mountGame-texKey) · [`remnantRadius`](../world/scale.js.md#s-remnantRadius) _js/world/scale.js_
- called by: [`mountGame>rebuildBody`](#s-mountGame-rebuildBody) · [`mountGame>rebuildWorld`](#s-mountGame-rebuildWorld)

<!-- note:mountGame>buildPlanet -->
- L819 · `const cachedMap = keepMap ? null : texCache.get(texKey(b));` — a rebuild hands the painted skin across: craters are vertex colour, the surface is the same
- L830 · `const seg = cratered || b.shattered ? 96 : b.radius > 1600 ? 64 : 44;` — a damaged world earns a denser mesh so the bowls resolve
- L831 · `const drawR = remnantRadius(b);` — A shattered world is a core in a cloud, not a sphere.
- L836 · `if (keepMap) mat.color.setRGB(1, 1, 1);` — the painted skin carries its own colour, as the surface job leaves it
- L849 · `if (b.kind === "gas") {` — gas giants take no crater — the strike leaves a dark storm bruise instead
<!-- /note -->

#### <a id="s-mountGame-buildOrbits"></a>`mountGame>buildOrbits()`

function · L891–908

- called by: [`mountGame>rebuildWorld`](#s-mountGame-rebuildWorld)

<!-- note:mountGame>buildOrbits -->
<!-- /note -->

#### <a id="s-mountGame-buildBeacons"></a>`mountGame>buildBeacons()`

function · L910–917

- called by: [`mountGame>rebuildWorld`](#s-mountGame-rebuildWorld)

<!-- note:mountGame>buildBeacons -->
- L915 · `beacons.push({ id: b.id, mesh, def: b });` — carry the definition on the record: BEACONS.find() per beacon per
  frame is loop-invariant work in the render loop
<!-- /note -->

#### <a id="s-mountGame-rebuildBody"></a>`mountGame>rebuildBody(id)`

function · L919–944

- calls: [`disposeObject`](#s-disposeObject) · [`mountGame>buildPlanet`](#s-mountGame-buildPlanet)
- via [js/world/bodies.js](../world/bodies.js.md): `BODIES.find`
- called by: [`mountGame>tick`](#s-mountGame-tick)

<!-- note:mountGame>rebuildBody -->
Rebuilds one world in place after it has been hit.

- L924 · `for (const fx of activeFX) if (fx.group === old.group) for (const part of fx.parts) old.gr` — FX riding the old group step off it before it is disposed and onto the new one after
- L927 · `if (ring && ring.parent === old.group) old.group.remove(ring);` — stepBodyRings re-parents it
- L928 · `const keepMap = old.mat.map;` — the painted skin survives the rebuild: only the mesh changes
<!-- /note -->

#### <a id="s-mountGame-rebuildWorld"></a>`mountGame>rebuildWorld()`

function · L946–964

- calls: [`mountGame>applyStar`](#s-mountGame-applyStar) · [`mountGame>buildBeacons`](#s-mountGame-buildBeacons) · [`mountGame>buildBeltHaze`](#s-mountGame-buildBeltHaze) · [`mountGame>buildOrbits`](#s-mountGame-buildOrbits) · [`mountGame>buildPlanet`](#s-mountGame-buildPlanet) · [`mountGame>clearWorld`](#s-mountGame-clearWorld) · [`mountGame>texCacheFor`](#s-mountGame-texCacheFor) · [`drainPool`](hullpool.js.md#s-drainPool) _js/render/hullpool.js_ · [`releaseInstance`](hullpool.js.md#s-releaseInstance) _js/render/hullpool.js_ · [`starBody`](../world/bodies.js.md#s-starBody) _js/world/bodies.js_
- called by: [`mountGame`](#s-mountGame)

<!-- note:mountGame>rebuildWorld -->
<!-- /note -->

#### <a id="s-mountGame-buildBeltHaze"></a>`mountGame>buildBeltHaze()`

function · L967–991

- calls: [`mountGame>buildBeltHaze>rnd`](#s-mountGame-buildBeltHaze-rnd) ×4
- called by: [`mountGame>rebuildWorld`](#s-mountGame-rebuildWorld)

<!-- note:mountGame>buildBeltHaze -->
Off by default: the belt is no longer a band you can see from anywhere.
Rocks resolve inside ROCK_DRAW_R and the chart carries the annulus. Set
sim.showBeltHaze = true before a sky loads to get the far view back.
<!-- /note -->

##### <a id="s-mountGame-buildBeltHaze-rnd"></a>`mountGame>buildBeltHaze>rnd()`

function · L976–976

- called by: [`mountGame>buildBeltHaze`](#s-mountGame-buildBeltHaze) ×4

<!-- note:mountGame>buildBeltHaze>rnd -->
<!-- /note -->

#### <a id="s-mountGame-refreshOwnHull"></a>`mountGame>refreshOwnHull()`

function · L998–1010

- calls: [`disposeObject`](#s-disposeObject) · [`makeShipGroup`](#s-makeShipGroup) · [`currentShipId`](../sim/sim.js.md#s-currentShipId) _js/sim/sim.js_
- called by: [`mountGame>tick`](#s-mountGame-tick)

<!-- note:mountGame>refreshOwnHull -->
<!-- /note -->

#### <a id="s-mountGame-fxMat"></a>`mountGame>fxMat(color, opacity)`

function · L1026–1028

- called by: [`mountGame>spawnImpactFX`](#s-mountGame-spawnImpactFX) ×3

<!-- note:mountGame>fxMat -->
<!-- /note -->

#### <a id="s-mountGame-placeOnSurface"></a>`mountGame>placeOnSurface(mesh, b, n, lift)`

function · L1030–1033

- called by: [`mountGame>spawnImpactFX`](#s-mountGame-spawnImpactFX) ×2

<!-- note:mountGame>placeOnSurface -->
<!-- /note -->

#### <a id="s-mountGame-spawnImpactFX"></a>`mountGame>spawnImpactFX(ev)`

function · L1035–1101

- calls: [`mountGame>easeOut`](#s-mountGame-easeOut) ×2 · [`mountGame>fxMat`](#s-mountGame-fxMat) ×3 · [`mountGame>placeOnSurface`](#s-mountGame-placeOnSurface) ×2 · [`mountGame>spawnImpactFX>add`](#s-mountGame-spawnImpactFX-add) ×5 · [`bodyById`](../world/bodies.js.md#s-bodyById) _js/world/bodies.js_
- called by: [`mountGame>stepImpactFX`](#s-mountGame-stepImpactFX)

<!-- note:mountGame>spawnImpactFX -->
- L1042 · `const flash = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color: 0xfff1d6, t` — the flash — every strike gets one
- L1053 · `const rings = ev.tier === "cataclysm" ? 3 : 2;` — shock rings walking the surface, staggered
- L1070 · `const scar = new THREE.Mesh(fxDiscGeo, fxMat(0xff6a2a, 0.85));` — the glowing scar that cools into the crater
- L1081 · `if (ev.tier === "cataclysm" && !ev.outcome) {` — a cataclysm now gets the full staged rig (stepEventFX) instead of the
  one-shot dome — this branch only still fires for the legacy path
- L1082 · `const dome = new THREE.Mesh(fxDomeGeo, fxMat(0xffb36a, 0.4));` — the blast dome
- L1093 · `const mat = p.mat;` — the world flinches: emissive spike rides on top of the thermal glow
<!-- /note -->

##### <a id="s-mountGame-spawnImpactFX-add"></a>`mountGame>spawnImpactFX>add(mesh, anim)`

function · L1040–1040

- called by: [`mountGame>spawnImpactFX`](#s-mountGame-spawnImpactFX) ×5

<!-- note:mountGame>spawnImpactFX>add -->
<!-- /note -->

#### <a id="s-mountGame-easeOut"></a>`mountGame>easeOut(u)`

function · L1103–1105

- called by: [`mountGame>spawnImpactFX`](#s-mountGame-spawnImpactFX) ×2

<!-- note:mountGame>easeOut -->
<!-- /note -->

#### <a id="s-mountGame-stepImpactFX"></a>`mountGame>stepImpactFX(dtSim)`

function · L1107–1122

- calls: [`mountGame>spawnImpactFX`](#s-mountGame-spawnImpactFX)
- via [js/sim/sim.js](../sim/sim.js.md): `sim.impactFX.shift`
- called by: [`mountGame>tick`](#s-mountGame-tick)

<!-- note:mountGame>stepImpactFX -->
<!-- /note -->

#### <a id="s-mountGame-shellMat"></a>`mountGame>shellMat(hex, opacity, power)`

function · L1140–1154

- called by: [`mountGame>buildEventRig`](#s-mountGame-buildEventRig) ×3

<!-- note:mountGame>shellMat -->
<!-- /note -->

#### <a id="s-mountGame-buildEventRig"></a>`mountGame>buildEventRig(ev)`

function · L1161–1193

- calls: [`mountGame>shellMat`](#s-mountGame-shellMat) ×3
- via [js/flight/rig.js](../flight/rig.js.md): `rig.parts.pulses.push`
- called by: [`mountGame>stepEventFX`](#s-mountGame-stepEventFX)

<!-- note:mountGame>buildEventRig -->
- L1167 · `const core = new THREE.Sprite(new THREE.SpriteMaterial({` — the incandescent core — the hottest, brightest thing in the event
- L1174 · `const plume = new THREE.Mesh(evShellGeo, shellMat(0xfff0d8, 0.55, 1.6));` — the vapour plume: opaque and incandescent, then optically thin
- L1178 · `const shell = new THREE.Mesh(evShellGeo, shellMat(0xffc07a, 0.9, 3.2));` — the blast shell — a rimmed bubble racing away from the site
<!-- /note -->

#### <a id="s-mountGame-disposeRig"></a>`mountGame>disposeRig(rig)`

function · L1195–1199

- calls: [`disposeObject`](#s-disposeObject)
- via [js/flight/rig.js](../flight/rig.js.md): `rig.host.remove`
- called by: [`mountGame>clearWorld`](#s-mountGame-clearWorld) · [`mountGame>stepEventFX`](#s-mountGame-stepEventFX)

<!-- note:mountGame>disposeRig -->
<!-- /note -->

#### <a id="s-mountGame-stepEventFX"></a>`mountGame>stepEventFX()`

function · L1203–1254

- calls: [`mountGame>buildEventRig`](#s-mountGame-buildEventRig) · [`mountGame>disposeRig`](#s-mountGame-disposeRig) · [`bodyById`](../world/bodies.js.md#s-bodyById) _js/world/bodies.js_ · [`kelvinHex`](../world/events/cataclysm.js.md#s-kelvinHex) _js/world/events/cataclysm.js_
- via [js/flight/rig.js](../flight/rig.js.md): `rig.group.getWorldPosition`, `rig.parts.pulses.forEach`
- called by: [`mountGame>tick`](#s-mountGame-tick)

<!-- note:mountGame>stepEventFX -->
- L1225 · `const plume = rig.parts.plume;` — the plume balloons out and thins — never a hard-edged ball
- L1242 · `rig.parts.pulses.forEach((ring, i) => {` — shock pulses walking out of the photosphere, staggered a third of a
  cycle apart so there is always one on its way out
<!-- /note -->

#### <a id="s-mountGame-stepBodyRings"></a>`mountGame>stepBodyRings()`

function · L1256–1279

- called by: [`mountGame>tick`](#s-mountGame-tick)

<!-- note:mountGame>stepBodyRings -->
---- rings the debris settles into ------------------------------------

- L1260 · `const p = b.kind === "star" ? { group: sunGroup } : planets.find((x) => x.id === b.id);` — the star is not in planets: its supernova remnant ring rides the sun group
- L1275 · `const st = b.ring.settle ?? 0;` — invisible while it is still a chaotic torus, resolving into a sheet
  only as the out-of-plane motion damps out
<!-- /note -->

#### <a id="s-mountGame-stepSkyLight"></a>`mountGame>stepSkyLight()`

function · L1295–1340

- called by: [`mountGame>tick`](#s-mountGame-tick)

<!-- note:mountGame>stepSkyLight -->
- L1307 · `l.distance = Math.max(g.radius * 900, 400000);` — generous reach — the point of this light is that it reaches YOU
- L1311 · `const lift = sim.skyLift ?? 0;` — exposure and fill rise with the sky, then come back down like an eye.
  Deliberately restrained: the canopy white-out is a separate thing, and
  blowing the whole frame out hides the event instead of selling it.
- L1321 · `const g0 = glows[0];` — Where the light is coming from, in screen terms. With nothing in frame
  to catch a rim light, this is what tells you an event is off to your
  left, or squarely behind you: glare washing in from that edge.
- L1328 · `const off = Math.atan2(lat, -_glareV.z) / Math.PI;` — 0 = dead ahead, 1 = square on the beam, back to 0 = dead astern
- L1331 · `const reach = Math.min(1, off * 2.1);` — push the hot spot to the canopy edge as the source leaves the frame,
  and let it fall back to an even wash once it is properly astern
- L1337 · `lum: lift * (behind ? 0.55 : 0.85),` — squarely behind you reads as a general lift, not a hot edge
<!-- /note -->

#### <a id="s-mountGame-audioState"></a>`mountGame>audioState()`

function · L1342–1365

- calls: [`batteryCap`](../flight/ship.js.md#s-batteryCap) _js/flight/ship.js_ · [`speedOf`](../flight/ship.js.md#s-speedOf) _js/flight/ship.js_ · [`inBelt`](../world/field.js.md#s-inBelt) _js/world/field.js_
- called by: [`mountGame>tick`](#s-mountGame-tick)

<!-- note:mountGame>audioState -->
Where the player is, as the bed understands it. wellDepth is the one
that earns its keep: it turns falling toward something enormous into a
drone that sags, which is mass made audible without a single number on
screen.

- L1344 · `const dom = sim.dominant;` — sim.dominant is the body itself and sim.domDist the range to its
  centre — the well is how far inside nine radii you have fallen.
<!-- /note -->

#### <a id="s-mountGame-resize"></a>`mountGame>resize()`

function · L1375–1381

- called by: [`mountGame`](#s-mountGame)

<!-- note:mountGame>resize -->
<!-- /note -->

#### <a id="s-mountGame-extZoom"></a>`mountGame>extZoom(f)`

function · L1400–1402

- called by: [`mountGame`](#s-mountGame)

<!-- note:mountGame>extZoom -->
<!-- /note -->

#### <a id="s-mountGame-extOrbit"></a>`mountGame>extOrbit(dx, dy)`

function · L1403–1406

- called by: [`mountGame>onPointerMove`](#s-mountGame-onPointerMove)

<!-- note:mountGame>extOrbit -->
<!-- /note -->

#### <a id="s-mountGame-extPan"></a>`mountGame>extPan(dx, dy)`

function · L1407–1411

- called by: [`mountGame>onPointerMove`](#s-mountGame-onPointerMove)

<!-- note:mountGame>extPan -->
<!-- /note -->

#### <a id="s-mountGame-extReset"></a>`mountGame>extReset()`

function · L1412–1414

- called by: [`mountGame`](#s-mountGame)

<!-- note:mountGame>extReset -->
<!-- /note -->

#### <a id="s-mountGame-pickAt"></a>`mountGame>pickAt(clientX, clientY)`

function · L1422–1440

- calls: [`acquireLock`](../sim/sim.js.md#s-acquireLock) _js/sim/sim.js_ ×2
- called by: [`mountGame>onPointerUp`](#s-mountGame-onPointerUp)

<!-- note:mountGame>pickAt -->
- L1432 · `acquireLock({ kind: "station", id: stId });` — A tap on a port starts a signature lock on it (same as P-LOCK with it under the reticle).
- L1437 · `acquireLock({ kind: "body", id });` — A tap on a world is the same act as putting the reticle on it: one
  lock, one nav target. (It used to set the nav target on its own,
  which is how a stale planet outlived the lock that chose it.)
<!-- /note -->

#### <a id="s-mountGame-onPointerDown"></a>`mountGame>onPointerDown(e)`

function · L1442–1461

<!-- note:mountGame>onPointerDown -->
<!-- /note -->

#### <a id="s-mountGame-onPointerMove"></a>`mountGame>onPointerMove(e)`

function · L1462–1494

- calls: [`addLook`](../core/input.js.md#s-addLook) _js/core/input.js_ · [`mountGame>extOrbit`](#s-mountGame-extOrbit) · [`mountGame>extPan`](#s-mountGame-extPan)

<!-- note:mountGame>onPointerMove -->
<!-- /note -->

#### <a id="s-mountGame-onPointerUp"></a>`mountGame>onPointerUp(e)`

function · L1495–1505

- calls: [`mountGame>pickAt`](#s-mountGame-pickAt)

<!-- note:mountGame>onPointerUp -->
- L1502 · `}` — already released
<!-- /note -->

#### <a id="s-mountGame-rockQuality"></a>`mountGame>rockQuality()`

function · L1513–1526

- called by: [`mountGame`](#s-mountGame)
- effects: storage.get `lgaa.rocks`

<!-- note:mountGame>rockQuality -->
How many grown bodies this device will carry.

Same shape as the attract screen's gate and overridable the same way
(localStorage "lgaa.rocks" → off | low | full | high), because a belt is
exactly where a phone is already working hardest.
<!-- /note -->

#### <a id="s-mountGame-releaseBody"></a>`mountGame>releaseBody(key)`

function · L1528–1535

- called by: [`mountGame`](#s-mountGame) · [`mountGame>bodyFor`](#s-mountGame-bodyFor) · [`mountGame>clearRockBuckets`](#s-mountGame-clearRockBuckets) · [`mountGame>drainBrokenRocks`](#s-mountGame-drainBrokenRocks)

<!-- note:mountGame>releaseBody -->
<!-- /note -->

#### <a id="s-mountGame-rogueKey"></a>`mountGame>rogueKey(m)`

function · L1541–1541

- called by: [`mountGame>impactorBody`](#s-mountGame-impactorBody)

<!-- note:mountGame>rogueKey -->
<!-- /note -->

#### <a id="s-mountGame-shapeKey"></a>`mountGame>shapeKey(b)`

function · L1544–1544

- called by: [`mountGame>shapeFor`](#s-mountGame-shapeFor)

<!-- note:mountGame>shapeKey -->
<!-- /note -->

#### <a id="s-mountGame-bucketOf"></a>`mountGame>bucketOf(rock)`

function · L1545–1545

- called by: [`mountGame>bodyFor`](#s-mountGame-bodyFor) · [`mountGame>updateAsteroids`](#s-mountGame-updateAsteroids) ×2

<!-- note:mountGame>bucketOf -->
<!-- /note -->

#### <a id="s-mountGame-stretchOf"></a>`mountGame>stretchOf(rock, out)`

function · L1546–1552

- called by: [`mountGame>poseBody`](#s-mountGame-poseBody) · [`mountGame>updateAsteroids`](#s-mountGame-updateAsteroids)

<!-- note:mountGame>stretchOf -->
A rock's stretch, off its seed: two axes pulled in by up to a fifth, never out,
so the rock stays inside the sphere the sim collides with. Worn by the
instance and the close-aboard body alike, or they would disagree.
<!-- /note -->

#### <a id="s-mountGame-rockTint"></a>`mountGame>rockTint(r, out)`

function · L1554–1560

- calls: [`rockLook`](../world/rockgen.js.md#s-rockLook) _js/world/rockgen.js_
- called by: [`mountGame>mountShared`](#s-mountGame-mountShared) · [`mountGame>updateAsteroids`](#s-mountGame-updateAsteroids)

<!-- note:mountGame>rockTint -->
The instance's tint for a rock — the prototype carries the class's surface,
this carries THE rock: a lightness jitter off its seed and a lean toward its ore.
<!-- /note -->

#### <a id="s-mountGame-shapeFor"></a>`mountGame>shapeFor(bucket)`

function · L1562–1585

- calls: [`mountBakedData`](../bodygen/baked.js.md#s-mountBakedData) _js/bodygen/baked.js_ · [`grow`](../bodygen/grower.js.md#s-grow) _js/bodygen/grower.js_ · [`peek`](../bodygen/grower.js.md#s-peek) _js/bodygen/grower.js_ · [`mountGame>shapeKey`](#s-mountGame-shapeKey)
- called by: [`mountGame>bodyFor`](#s-mountGame-bodyFor) · [`mountGame>updateAsteroids`](#s-mountGame-updateAsteroids)

<!-- note:mountGame>shapeFor -->
The close-aboard shape of a prototype, grown once, or null while it grows.

- L1563 · `if (!bucket?.mesh) return null;` — the field itself has not landed
- L1568 · `const rec = { mount: bucket.mount, built: bucket.mount.built, unitR: bucket.unitR, owned:` — the belt lattice is the prototype's own: the very mesh the field draws
<!-- /note -->

#### <a id="s-mountGame-bodyFor"></a>`mountGame>bodyFor(rock, dist=, now=)`

function · L1587–1612

- calls: [`mountGame>bucketOf`](#s-mountGame-bucketOf) · [`mountGame>mountShared`](#s-mountGame-mountShared) · [`mountGame>releaseBody`](#s-mountGame-releaseBody) · [`mountGame>shapeFor`](#s-mountGame-shapeFor)
- called by: [`mountGame>updateAsteroids`](#s-mountGame-updateAsteroids)

<!-- note:mountGame>bodyFor -->
The body for this rock, or null while its shape grows. The rock keeps
drawing as its prototype meanwhile — the same shape, so nothing changes
when the body takes over.

- L1594 · `let victim = null, worst = -Infinity;` — 0.3.28: evict the one that has been out of sight longest AND is
  further away than the rock asking for its slot — never the rock under
  the lock or the cutter, and never one mounted moments ago. (0.3.62: an
  eviction no longer changes what you see — the rock goes back to an
  instance of the same shape — so this is about draw calls, not looks.)
<!-- /note -->

#### <a id="s-mountGame-mountShared"></a>`mountGame>mountShared(shape, rock)`

function · L1614–1628

- calls: [`bakedMaterial`](../bodygen/baked.js.md#s-bakedMaterial) _js/bodygen/baked.js_ · [`mountGame>rockTint`](#s-mountGame-rockTint)
- called by: [`mountGame>bodyFor`](#s-mountGame-bodyFor)

<!-- note:mountGame>mountShared -->
A close-aboard rock on its prototype's shared shape: its own mesh and tint, nothing else of its own.
<!-- /note -->

##### <a id="s-mountGame-mountShared-dispose"></a>`mountGame>mountShared.dispose()`

prop · L1627–1627

<!-- note:mountGame>mountShared.dispose -->
<!-- /note -->

#### <a id="s-mountGame-poseBody"></a>`mountGame>poseBody(b, r, t)`

function · L1630–1638

- calls: [`mountGame>stretchOf`](#s-mountGame-stretchOf)
- called by: [`mountGame>updateAsteroids`](#s-mountGame-updateAsteroids) ×2

<!-- note:mountGame>poseBody -->
Place a close-aboard body exactly where, and as, its instance would be.
<!-- /note -->

#### <a id="s-mountGame-mountBody"></a>`mountGame>mountBody(d, radius)`

function · L1640–1652

- calls: [`mountBakedData`](../bodygen/baked.js.md#s-mountBakedData) _js/bodygen/baked.js_
- called by: [`mountGame>impactorBody`](#s-mountGame-impactorBody)

<!-- note:mountGame>mountBody -->
A grown body in the scene. Two groups: the outer one is where the rock is
(position, spin, and the shrink as it is cut); the inner one is the
generator's unit frame scaled up to the rock's radius, which the mesh and
any shatter field share.
<!-- /note -->

#### <a id="s-mountGame-assayFor"></a>`mountGame>assayFor(key)`

function · L1654–1656

<!-- note:mountGame>assayFor -->
The assay for a rock, if a body has been grown for it. For the survey card.
<!-- /note -->

#### <a id="s-mountGame-clearRockBuckets"></a>`mountGame>clearRockBuckets()`

function · L1658–1662

- calls: [`mountGame>releaseBody`](#s-mountGame-releaseBody)
- called by: [`mountGame>updateAsteroids`](#s-mountGame-updateAsteroids)

<!-- note:mountGame>clearRockBuckets -->
<!-- /note -->

#### <a id="s-mountGame-drainBrokenRocks"></a>`mountGame>drainBrokenRocks()`

function · L1666–1674

- calls: [`mountGame>releaseBody`](#s-mountGame-releaseBody)
- via [js/world/field.js](../world/field.js.md): `brokenRocks.shift`
- called by: [`mountGame>updateAsteroids`](#s-mountGame-updateAsteroids)

<!-- note:mountGame>drainBrokenRocks -->
Cut-out rocks go up as shatter fields in their own colours — if we grew them.
<!-- /note -->

#### <a id="s-mountGame-updateAsteroids"></a>`mountGame>updateAsteroids(t)`

function · L1677–1773

- calls: [`cancel`](../bodygen/grower.js.md#s-cancel) _js/bodygen/grower.js_ ×2 · [`pump`](../bodygen/grower.js.md#s-pump) _js/bodygen/grower.js_ · [`mountGame>bodyFor`](#s-mountGame-bodyFor) · [`mountGame>bucketOf`](#s-mountGame-bucketOf) ×2 · [`mountGame>clearRockBuckets`](#s-mountGame-clearRockBuckets) · [`mountGame>drainBrokenRocks`](#s-mountGame-drainBrokenRocks) · [`mountGame>poseBody`](#s-mountGame-poseBody) ×2 · [`mountGame>rockTint`](#s-mountGame-rockTint) · [`mountGame>shapeFor`](#s-mountGame-shapeFor) · [`mountGame>stretchOf`](#s-mountGame-stretchOf) · [`inBelt`](../world/field.js.md#s-inBelt) _js/world/field.js_ · [`nearbyRocks`](../world/field.js.md#s-nearbyRocks) _js/world/field.js_
- called by: [`mountGame>tick`](#s-mountGame-tick)

<!-- note:mountGame>updateAsteroids -->
- L1678 · `pump();` — no worker (or it failed): grow one queued body on this thread a frame
- L1688 · `if (lodMemo.size > 4 * MAX_ROCKS) lodMemo.clear();` — rocks flown past long ago
- L1691 · `grown.clear();` — Who gets grown: the nearest big rocks, plus whatever is locked or under
  the cutter — that one is the rock you are looking at, so it is never the
  one left as a prototype. One mounted per frame, no more.
- L1699 · `if (d > (held ? BODY_R * BODY_FAR : BODY_R)) continue;` — enter the set at BODY_R; leave it only well outside, so the change
  of shape happens far away rather than in front of you
- L1715 · `for (const { r } of near) {` — 0.3.28 — a body that is mounted STAYS drawn while its rock is still in
  range, even if this frame's ranking put it outside the top slice. It
  used to be hidden the moment it lost its rank, which turned a
  one-frame reordering into a rock visibly changing shape and changing
  back. The pool is already capped at the budget, so keeping them all
  drawn costs nothing that was not already paid for.
- L1722 · `for (const [key, b] of bodies) if (!grown.has(key) && b.group.visible) { b.group.visible =` — and one that really has left the range goes back to the field
- L1723 · `cancelGrowth((key) => !key.startsWith("belt:") || _wantKeys.has(key));` — a rock flown past before its body grew is not worth the worker's time
- L1730 · `if (grown.has(r.key)) { drawn++; continue; }` — it has a real body; the instance would sit inside it
- L1734 · `const prev = lodMemo.get(r.key);` — 0.3.62 — lattice hysteresis: a rock sitting on a threshold used to flip
  between 768 and 192 triangles frame to frame as it spun and drifted,
  which reads as the rock re-forming. It now has to clear the threshold
  by a fifth to change lattice, either way.
- L1744 · `const k = Math.min(1, (ROCK_DRAW_R - d) / ROCK_FADE);` — grow in across the outer slice of the range: nothing pops
- L1751 · `rockTint(r, _rcol);` — the prototype carries the class's surface; the instance carries THIS
  rock: a lightness jitter off its seed and a lean toward its ore, so the
  rock you can see is the rock you are about to cut
- L1765 · `dust.visible = drawn > 0;` — the dust box follows the hull in whole-box steps, so motes stream past
  instead of being dragged along with you
<!-- /note -->

#### <a id="s-mountGame-updateDebris"></a>`mountGame>updateDebris(t)`

function · L1776–1802

- calls: [`kelvinHex`](../world/events/cataclysm.js.md#s-kelvinHex) _js/world/events/cataclysm.js_
- called by: [`mountGame>tick`](#s-mountGame-tick)

<!-- note:mountGame>updateDebris -->
- L1781 · `if (c.driven && c.fractured != null) continue;` — a rock's own pieces are drawn by its fractured body while the impact run holds them
- L1786 · `const h = c.hot ?? 0;` — rubble thrown off a strike is still incandescent — it cools through
  the same blackbody curve the parent body does
<!-- /note -->

#### <a id="s-mountGame-releaseImpactorBody"></a>`mountGame>releaseImpactorBody(id)`

function · L1804–1811

- called by: [`mountGame`](#s-mountGame) · [`mountGame>impactorBody`](#s-mountGame-impactorBody) · [`mountGame>updateImpactors`](#s-mountGame-updateImpactors)

<!-- note:mountGame>releaseImpactorBody -->
<!-- /note -->

#### <a id="s-mountGame-impactorBody"></a>`mountGame>impactorBody(m)`

function · L1813–1823

- calls: [`rogueParams`](../bodygen/body.js.md#s-rogueParams) _js/bodygen/body.js_ · [`grow`](../bodygen/grower.js.md#s-grow) _js/bodygen/grower.js_ · [`peek`](../bodygen/grower.js.md#s-peek) _js/bodygen/grower.js_ · [`mountGame>mountBody`](#s-mountGame-mountBody) · [`mountGame>releaseImpactorBody`](#s-mountGame-releaseImpactorBody) · [`mountGame>rogueClass`](#s-mountGame-rogueClass) · [`mountGame>rogueKey`](#s-mountGame-rogueKey)
- called by: [`mountGame>updateImpactors`](#s-mountGame-updateImpactors)

<!-- note:mountGame>impactorBody -->
The grown body for one rogue rock, the cached one, or null while it grows.

- L1815 · `if (have && Math.abs(have.r - m.r) < have.r * 0.02) return have;` — a mirrored rock can have its radius corrected by the host; a body built
  at the old size would sit visibly inside or outside its own collision
<!-- /note -->

#### <a id="s-mountGame-rogueAssay"></a>`mountGame>rogueAssay(id)`

function · L1825–1827

<!-- note:mountGame>rogueAssay -->
The assay for a rogue rock, if its body has been grown. For the survey card.
<!-- /note -->

#### <a id="s-mountGame-updateImpactors"></a>`mountGame>updateImpactors(t)`

function · L1829–1844

- calls: [`mountGame>impactorBody`](#s-mountGame-impactorBody) · [`mountGame>releaseImpactorBody`](#s-mountGame-releaseImpactorBody)
- called by: [`mountGame>tick`](#s-mountGame-tick)

<!-- note:mountGame>updateImpactors -->
- L1834 · `const had = impBodies.get(m.id);` — one mount a frame, same rule the belt plays by
- L1843 · `if (impBodies.size) for (const id of [...impBodies.keys()]) if (!live.has(id)) releaseImpa` — a rock that struck, or drifted past the despawn rim, takes its body with it
<!-- /note -->

#### <a id="s-mountGame-updateShots"></a>`mountGame>updateShots()`

function · L1846–1858

- called by: [`mountGame>tick`](#s-mountGame-tick)

<!-- note:mountGame>updateShots -->
<!-- /note -->

#### <a id="s-mountGame-spawnChip"></a>`mountGame>spawnChip(vx0, vy0, vz0)`

function · L1860–1874

- called by: [`mountGame>updateMiningFX`](#s-mountGame-updateMiningFX)

<!-- note:mountGame>spawnChip -->
- L1865 · `const sp = 22 + Math.random() * 50;` — off the face, away from the beam, with a tangential kick
<!-- /note -->

#### <a id="s-mountGame-spawnPuff"></a>`mountGame>spawnPuff(vx0, vy0, vz0)`

function · L1876–1887

- called by: [`mountGame>updateMiningFX`](#s-mountGame-updateMiningFX)

<!-- note:mountGame>spawnPuff -->
<!-- /note -->

#### <a id="s-mountGame-updateMiningFX"></a>`mountGame>updateMiningFX(dt)`

function · L1889–1976

- calls: [`forwardOf`](../flight/ship.js.md#s-forwardOf) _js/flight/ship.js_ · [`rightOf`](../flight/ship.js.md#s-rightOf) _js/flight/ship.js_ · [`upOf`](../flight/ship.js.md#s-upOf) _js/flight/ship.js_ · [`mountGame>spawnChip`](#s-mountGame-spawnChip) · [`mountGame>spawnPuff`](#s-mountGame-spawnPuff)
- called by: [`mountGame>tick`](#s-mountGame-tick)

<!-- note:mountGame>updateMiningFX -->
- L1893 · `const f = forwardOf(s.yaw, s.pitch);` — the emitter sits under and to the right of the lens, on the hull
- L1896 · `laser.from.x = s.pos.x + f.x * 1.6 + r.x * 1.6 - u.x * 1.2;` — far enough off the lens axis that the beam reads as a streak from the
  bottom-right of the canopy to the cut, not a dot on the reticle
- L1903 · `const reach = Math.max(1, d - (mining.r ?? 0) * 0.9);` — the cut lands on the near face, not the centre
- L1910 · `const tv = mining.vx ?? 0, tvy = mining.vy ?? 0, tvz = mining.vz ?? 0;` — what comes off the face rides the rock's own drift, if it has one
- L1920 · `beamGroup.visible = laser.on;` — beam segments
- L1929 · `let keep = 1;` — two-beat die-off: first the line breaks into dashes — every section
  pulls in on its centre and gaps open — then the dashes go out one by
  one from the cut back toward the emitter, the bright near ones last
- L1940 · `const taper = 0.22 + 0.78 * ((i + 0.5) / BEAM_SEGS);` — thin at the emitter, full width by the cut — a taper, stepped per section
- L1948 · `let live = 0;` — chips
- L1965 · `for (const p of puffs) {` — dust
<!-- /note -->

#### <a id="s-mountGame-updateRigFX"></a>`mountGame>updateRigFX(dt)`

function · L1996–2033

- calls: [`forwardOf`](../flight/ship.js.md#s-forwardOf) _js/flight/ship.js_ · [`rightOf`](../flight/ship.js.md#s-rightOf) _js/flight/ship.js_ · [`upOf`](../flight/ship.js.md#s-upOf) _js/flight/ship.js_
- called by: [`mountGame>tick`](#s-mountGame-tick)

<!-- note:mountGame>updateRigFX -->
<!-- /note -->

#### <a id="s-mountGame-updateTractorBeam"></a>`mountGame>updateTractorBeam(t)`

function · L2048–2065

- via [js/station/stations.js](../station/stations.js.md): `stations.find`
- called by: [`mountGame>tick`](#s-mountGame-tick)

<!-- note:mountGame>updateTractorBeam -->
<!-- /note -->

#### <a id="s-mountGame-droneDesign"></a>`mountGame>droneDesign(c)`

function · L2068–2073

- calls: [`droneFor`](../drones/droneforge.js.md#s-droneFor) _js/drones/droneforge.js_
- via [js/station/stations.js](../station/stations.js.md): `stations.find`
- called by: [`mountGame>syncContactMeshes`](#s-mountGame-syncContactMeshes)

<!-- note:mountGame>droneDesign -->
<!-- /note -->

#### <a id="s-mountGame-syncContactMeshes"></a>`mountGame>syncContactMeshes()`

function · L2074–2104

- calls: [`droneBudget`](../drones/droneforge.js.md#s-droneBudget) _js/drones/droneforge.js_ · [`meshRange`](#s-meshRange) · [`mountGame>droneDesign`](#s-mountGame-droneDesign) · [`mountGame>rel`](#s-mountGame-rel) · [`mountGame>syncProbeMeshes`](#s-mountGame-syncProbeMeshes) · [`mountGame>syncWorkDrones`](#s-mountGame-syncWorkDrones) · [`dist3`](../world/bodies.js.md#s-dist3) _js/world/bodies.js_
- called by: [`mountGame>tick`](#s-mountGame-tick)

<!-- note:mountGame>syncContactMeshes -->
Everything that flies has a real hull: a generated ship or a generated
drone, and nothing else. There used to be a fallback here — a red
tetrahedron, tumbling on two axes, stood in for any drone whose design
had not grown yet or that was out of mesh range, and because the swap
only happened when `droneDesign` finally returned something, a contact
beyond mesh range kept the blob for as long as it existed.

So a lump of abstract geometry was a permanent flying object in a game
where every other hull is built by a generator. It is gone. A drone
whose design is still growing, or that is too far out for a mesh, draws
NOTHING for those frames — exactly as an NPC ship at the same distance
already did. The design keeps being requested every frame until the
budget grows it, so the gap is a frame or two, not a state.

- L2081 · `if (!bot) continue;` — no real hull yet: draw nothing at all
- L2089 · `_dLook.set(sim.ship.pos.x - origin.x, sim.ship.pos.y - origin.y, sim.ship.pos.z - origin.z` — a gun drone keeps its optics on you, with a slow station-keeping bob
- L2094 · `_seenDrone.clear();` — the eviction sweep: `contacts.some()` per mesh is O(meshes × contacts)
  with a closure allocated per mesh, every frame — 40 meshes against a
  120-entry board is 4,800 comparisons a frame. One pass to mark what is
  live, one to drop what is not, same as syncWorkDrones already does.
<!-- /note -->

#### <a id="s-mountGame-syncWorkDrones"></a>`mountGame>syncWorkDrones()`

function · L2109–2152

- calls: [`droneFor`](../drones/droneforge.js.md#s-droneFor) _js/drones/droneforge.js_ · [`releaseDrone`](../drones/droneforge.js.md#s-releaseDrone) _js/drones/droneforge.js_ · [`meshRange`](#s-meshRange) · [`mountGame>rel`](#s-mountGame-rel) · [`mountGame>unitsUseDrone`](#s-mountGame-unitsUseDrone) · [`dist3`](../world/bodies.js.md#s-dist3) _js/world/bodies.js_
- called by: [`mountGame>syncContactMeshes`](#s-mountGame-syncContactMeshes)

<!-- note:mountGame>syncWorkDrones -->
- L2113 · `if ((u.dockedAt && !u.bay) || u.state === "setup") continue;` — 0.3.15: a drone in its bay run is on the board
- L2149 · `const key = w.mesh.userData?.template;` — the last unit flying a design frees the design (droneFor's key: kind|seed|sector)
<!-- /note -->

#### <a id="s-mountGame-unitsUseDrone"></a>`mountGame>unitsUseDrone(key)`

function · L2153–2158

- called by: [`mountGame>syncWorkDrones`](#s-mountGame-syncWorkDrones)

<!-- note:mountGame>unitsUseDrone -->
<!-- /note -->

#### <a id="s-mountGame-syncProbeMeshes"></a>`mountGame>syncProbeMeshes()`

function · L2161–2182

- calls: [`droneFor`](../drones/droneforge.js.md#s-droneFor) _js/drones/droneforge.js_ · [`drawRange`](#s-drawRange) · [`mountGame>rel`](#s-mountGame-rel) · [`dist3`](../world/bodies.js.md#s-dist3) _js/world/bodies.js_
- called by: [`mountGame>syncContactMeshes`](#s-mountGame-syncContactMeshes)

<!-- note:mountGame>syncProbeMeshes -->
<!-- /note -->

#### <a id="s-mountGame-syncRemotes"></a>`mountGame>syncRemotes()`

function · L2184–2213

- calls: [`disposeObject`](#s-disposeObject) ×2 · [`makeShipGroup`](#s-makeShipGroup) · [`mountGame>rel`](#s-mountGame-rel) · [`orientCraft`](#s-orientCraft) · [`tickHull`](../ships/shipforge.js.md#s-tickHull) _js/ships/shipforge.js_
- via [js/sim/sim.js](../sim/sim.js.md): `sim.remotes.has`
- called by: [`mountGame>tick`](#s-mountGame-tick)

<!-- note:mountGame>syncRemotes -->
<!-- /note -->

#### <a id="s-mountGame-syncTraffic"></a>`mountGame>syncTraffic()`

function · L2216–2261

- calls: [`disposeObject`](#s-disposeObject) ×2 · [`drawRange`](#s-drawRange) · [`makeShipGroup`](#s-makeShipGroup) · [`meshRange`](#s-meshRange) · [`mountGame>dropNavLight`](#s-mountGame-dropNavLight) ×3 · [`mountGame>navLightFor`](#s-mountGame-navLightFor) ×2 · [`mountGame>placeNavLight`](#s-mountGame-placeNavLight) ×2 · [`mountGame>rel`](#s-mountGame-rel) · [`orientCraft`](#s-orientCraft) · [`tickHull`](../ships/shipforge.js.md#s-tickHull) _js/ships/shipforge.js_ · [`dist3`](../world/bodies.js.md#s-dist3) _js/world/bodies.js_ ×2
- via [js/npc/traffic.js](../npc/traffic.js.md): `HOSTILE_ROLES.has`, `LAW_ROLES.has`
- called by: [`mountGame>tick`](#s-mountGame-tick)

<!-- note:mountGame>syncTraffic -->
- L2222 · `if (n.visible === false) {` — inside a ring or in a lane: nothing to draw, but the hull is kept for when it comes out
- L2233 · `const dn = dist3(sim.ship.pos, n);` — a hull 80 km out is a sub-pixel dot: keep its label and its strobe, skip its mesh
- L2236 · `else if (far) dropNavLight(n.id);` — past 1.3× draw range the strobe goes too
<!-- /note -->

#### <a id="s-mountGame-syncFlow"></a>`mountGame>syncFlow()`

function · L2264–2294

- calls: [`meshRange`](#s-meshRange) · [`mountGame>dropNavLight`](#s-mountGame-dropNavLight) · [`mountGame>navLightFor`](#s-mountGame-navLightFor) · [`mountGame>placeNavLight`](#s-mountGame-placeNavLight) · [`mountGame>rel`](#s-mountGame-rel) · [`orientCraft`](#s-orientCraft) · [`instanceOf`](hullpool.js.md#s-instanceOf) _js/render/hullpool.js_ · [`releaseInstance`](hullpool.js.md#s-releaseInstance) _js/render/hullpool.js_ · [`templateFor`](hullpool.js.md#s-templateFor) _js/render/hullpool.js_ · [`warm`](hullpool.js.md#s-warm) _js/render/hullpool.js_ · [`tickHull`](../ships/shipforge.js.md#s-tickHull) _js/ships/shipforge.js_ · [`dist3`](../world/bodies.js.md#s-dist3) _js/world/bodies.js_ ×2
- called by: [`mountGame>tick`](#s-mountGame-tick)

<!-- note:mountGame>syncFlow -->
<!-- /note -->

#### <a id="s-mountGame-syncHulks"></a>`mountGame>syncHulks()`

function · L2300–2344

- calls: [`disposeObject`](#s-disposeObject) ×2 · [`drawRange`](#s-drawRange) · [`makeShipGroup`](#s-makeShipGroup) · [`meshRange`](#s-meshRange) · [`mountGame>dropNavLight`](#s-mountGame-dropNavLight) ×2 · [`mountGame>navLightFor`](#s-mountGame-navLightFor) · [`mountGame>placeNavLight`](#s-mountGame-placeNavLight) · [`mountGame>rel`](#s-mountGame-rel) · [`orientCraft`](#s-orientCraft) · [`dist3`](../world/bodies.js.md#s-dist3) _js/world/bodies.js_
- called by: [`mountGame>tick`](#s-mountGame-tick)

<!-- note:mountGame>syncHulks -->
<!-- /note -->

#### <a id="s-mountGame-projectMark"></a>`mountGame>projectMark(x, y, z)`

function · L2352–2374

- called by: [`mountGame>tick`](#s-mountGame-tick)

<!-- note:mountGame>projectMark -->
Project a world point to canopy percentages, and when it falls off the
screen — or behind the camera — clamp it to the edge with the bearing to
turn toward. `projectPoint` has always computed `behind` and nothing has
ever read it; this is what it was for.

- L2356 · `if (behind) { nx = -nx; ny = -ny; }` — behind the camera the projection mirrors through the origin, so a
  contact over your shoulder reads as being in front and on the wrong
  side. Flip it back, then treat it as off-screen by construction.
<!-- /note -->

#### <a id="s-mountGame-projectPoint"></a>`mountGame>projectPoint(x, y, z)`

function · L2376–2380

- called by: [`mountGame>projectDir`](#s-mountGame-projectDir) · [`mountGame>tick`](#s-mountGame-tick) ×15

<!-- note:mountGame>projectPoint -->
<!-- /note -->

#### <a id="s-mountGame-projectDir"></a>`mountGame>projectDir(dx, dy, dz)`

function · L2382–2385

- calls: [`mountGame>projectPoint`](#s-mountGame-projectPoint)
- called by: [`mountGame>tick`](#s-mountGame-tick) ×3

<!-- note:mountGame>projectDir -->
Projects a direction as a point far ahead of the ship.
<!-- /note -->

#### <a id="s-mountGame-tick"></a>`mountGame>tick(timestamp)`

function · L2387–2801

- calls: [`resumeAudioIfNeeded`](../audio/index.js.md#s-resumeAudioIfNeeded) _js/audio/index.js_ · [`tickAudio`](../audio/index.js.md#s-tickAudio) _js/audio/index.js_ · [`notePerf`](../core/perf.js.md#s-notePerf) _js/core/perf.js_ · [`contactView`](../flight/contacts.js.md#s-contactView) _js/flight/contacts.js_ ×2 · [`hullTag`](../flight/contacts.js.md#s-hullTag) _js/flight/contacts.js_ · [`scanFocus`](../flight/contacts.js.md#s-scanFocus) _js/flight/contacts.js_ · [`forwardOf`](../flight/ship.js.md#s-forwardOf) _js/flight/ship.js_ ×4 · [`rightOf`](../flight/ship.js.md#s-rightOf) _js/flight/ship.js_ · [`speedOf`](../flight/ship.js.md#s-speedOf) _js/flight/ship.js_ · [`upOf`](../flight/ship.js.md#s-upOf) _js/flight/ship.js_ ×2 · [`tickWorldSync`](../net/worldsync.js.md#s-tickWorldSync) _js/net/worldsync.js_ · [`fightCentre`](../npc/battles.js.md#s-fightCentre) _js/npc/battles.js_ · [`dematerialize`](#s-dematerialize) · [`drawRange`](#s-drawRange) ×3 · [`mountGame>audioState`](#s-mountGame-audioState) · [`mountGame>projectDir`](#s-mountGame-projectDir) ×3 · [`mountGame>projectMark`](#s-mountGame-projectMark) · [`mountGame>projectPoint`](#s-mountGame-projectPoint) ×15 · [`mountGame>rebuildBody`](#s-mountGame-rebuildBody) · [`mountGame>refreshOwnHull`](#s-mountGame-refreshOwnHull) · [`mountGame>rel`](#s-mountGame-rel) ×6 · [`mountGame>stepBodyRings`](#s-mountGame-stepBodyRings) · [`mountGame>stepCloseUp`](#s-mountGame-stepCloseUp) · [`mountGame>stepEventFX`](#s-mountGame-stepEventFX) · [`mountGame>stepImpactFX`](#s-mountGame-stepImpactFX) · [`mountGame>stepSkyLight`](#s-mountGame-stepSkyLight) · [`mountGame>syncContactMeshes`](#s-mountGame-syncContactMeshes) · [`mountGame>syncFlow`](#s-mountGame-syncFlow) · [`mountGame>syncHulks`](#s-mountGame-syncHulks) · [`mountGame>syncRemotes`](#s-mountGame-syncRemotes) · [`mountGame>syncTraffic`](#s-mountGame-syncTraffic) · [`mountGame>texArgs`](#s-mountGame-texArgs) · [`mountGame>texKey`](#s-mountGame-texKey) · [`mountGame>updateAsteroids`](#s-mountGame-updateAsteroids) · [`mountGame>updateDebris`](#s-mountGame-updateDebris) · [`mountGame>updateImpactors`](#s-mountGame-updateImpactors) · [`mountGame>updateMiningFX`](#s-mountGame-updateMiningFX) · [`mountGame>updateRigFX`](#s-mountGame-updateRigFX) · [`mountGame>updateShots`](#s-mountGame-updateShots) · [`mountGame>updateStations`](#s-mountGame-updateStations) · [`mountGame>updateTractorBeam`](#s-mountGame-updateTractorBeam) · [`orientCraft`](#s-orientCraft) · [`throttleCapOf`](#s-throttleCapOf) · [`tickHull`](../ships/shipforge.js.md#s-tickHull) _js/ships/shipforge.js_ · [`activeWaypoint`](../sim/sim.js.md#s-activeWaypoint) _js/sim/sim.js_ · [`pauseTick`](../sim/sim.js.md#s-pauseTick) _js/sim/sim.js_ · [`publishHud`](../sim/sim.js.md#s-publishHud) _js/sim/sim.js_ · [`spoolTime`](../sim/sim.js.md#s-spoolTime) _js/sim/sim.js_ · [`targetPosition`](../sim/sim.js.md#s-targetPosition) _js/sim/sim.js_ · [`tickSim`](../sim/sim.js.md#s-tickSim) _js/sim/sim.js_ · [`waypointPosition`](../sim/sim.js.md#s-waypointPosition) _js/sim/sim.js_ · [`tickTutorial`](../ui/tutorial.js.md#s-tickTutorial) _js/ui/tutorial.js_ · [`beaconPosition`](../world/bodies.js.md#s-beaconPosition) _js/world/bodies.js_ ×2 · [`bodyById`](../world/bodies.js.md#s-bodyById) _js/world/bodies.js_ ×2 · [`bodyPosition`](../world/bodies.js.md#s-bodyPosition) _js/world/bodies.js_ ×4 · [`dist3`](../world/bodies.js.md#s-dist3) _js/world/bodies.js_ ×12 · [`scanRadius`](../world/bodies.js.md#s-scanRadius) _js/world/bodies.js_ · [`starBody`](../world/bodies.js.md#s-starBody) _js/world/bodies.js_ ×3 · [`kelvinHex`](../world/events/cataclysm.js.md#s-kelvinHex) _js/world/events/cataclysm.js_ · [`makePlanetTexture`](../world/textures.js.md#s-makePlanetTexture) _js/world/textures.js_
- via [js/world/bodies.js](../world/bodies.js.md): `BODIES.filter`, `BODIES.filter.map`
- via [js/sim/sim.js](../sim/sim.js.md): `sim.beaconsGot.has`, `sim.remotes.values`
- via [js/npc/traffic.js](../npc/traffic.js.md): `HOSTILE_ROLES.has`, `LAW_ROLES.has`
- effects: global.write `window.__lgMarkers`

<!-- note:mountGame>tick -->
- L2393 · `notePerf(raw, dt);` — what the last frame actually cost, before anything in this one runs.
  perf.js keeps a median of these and hands the sky a detail tier, so a
  device that cannot carry a hundred and thirty hulls at full fidelity
  sheds the far field rather than the frame rate.
- L2399 · `tickAudio(audioState(), dt);` — The ambient bed reads the game once a frame and rate-limits itself
  internally. Everything it needs is gathered here rather than reached
  for from inside the audio module, so what the sound reacts to is one
  readable object instead of a web of imports.
- L2406 · `if (playing) {` — ---- floating origin ----
- L2411 · `const star = starBody();` — No world worth framing, or the attract scene is off on a weak
  device: the old slow circle around the star.
- L2421 · `sun.rotation.y += dt * 0.0012;` — ---- world transforms ----
- L2433 · `for (const b of BODIES) {` — a world that took a hit gets rebuilt with its new shape — before the FX of
  the hit are parented to it, so this frame's spawn lands on the group that stays
- L2446 · `p.group.rotation.y += dt * p.spin * 0.006;` — Axial spin you can notice over an hour, not over a minute.
- L2447 · `const bb = bodyById(p.id);` — impact heat glows ember-orange and fades as the world radiates it
  away; a resurfaced world glows from the inside at its own temperature
  and walks the blackbody curve down as it cools
- L2454 · `p.mat.emissiveIntensity = p.baseIntensity + molten * 0.62;` — enough to read as molten from orbit, not enough to flatten the
  globe into a featureless disc
- L2477 · `if (texQueue.length) {` — one surface per frame — the sky is flyable while they resolve
- L2522 · `if (playing) camMode = sim.cameraMode ?? camMode;` — ---- camera ----
- L2530 · `const f = forwardOf(s.yaw, s.pitch);` — orbit in the hull frame: forward/right/up of the nose, then the
  pilot's own yaw/pitch around it, then a pan of the look point
- L2534 · `const bx = -Math.cos(ext.yaw) * cp;` — behind the hull at yaw 0
- L2535 · `const bz = Math.sin(ext.yaw) * cp;` — around the side
- L2548 · `const f = forwardOf(s.yaw, s.pitch);` — Seat-mounted lens: the camera IS bolted to the hull, a little above
  and ahead of the centre of mass, so the nose is your line of sight.
- L2551 · `camera.quaternion.copy(ship.quaternion);` — The lens is bolted to the hull, so it simply wears the hull's
  attitude — roll included. Where you look is where the nose is.
- L2570 · `const wState = sim.warp.state;` — ---- warp ----
  After the camera is posed, and deliberately so. The near tunnel layer is
  parented to the camera's own position and orientation, and at 55,000
  units a second a frame-old camera leaves it nearly a kilometre astern —
  which looks exactly like what it is, the tunnel sliding off the back of
  the ship.
  
  `warpStrength` is the core's own progress, eased: spool builds it to a
  quarter so the sky has visibly begun to move before the core lets go,
  the run takes it the rest of the way, and a dropout drains it. Every
  visual below hangs off that one number.
- L2580 · `stars.material.opacity = 0.9 * (1 - Math.min(1, warpStrength * 2.2));` — the resting point-sky gives way to its own streaks rather than sitting
  underneath them as a second set of heads
- L2582 · `warpFx.updateWakes(traffic, origin);` — a hull under lane drive leaves a wake whether or not YOU are warping:
  it is how traffic crossing the system reads at a glance
- L2585 · `if (sim.pulse > 0 && sim.selected) {` — ---- survey pulse ----
- L2598 · `camera.updateMatrixWorld(true);` — ---- HUD ----
- L2628 · `edgeBuf.length = 0;` — ---- the working sky, and what the canopy may say about it ----
  
  The canopy is the ship's own smart HUD: the scanner and the comms
  array, drawn on the glass. So it reports what those two actually
  have, and nothing else. It used to read the roster directly and
  name every hull in range whether or not you had ever looked at one.
  
  The scanner (contacts.js) runs two beams at once and the canopy
  shows both:
  
    BROAD   everything in range, immediately: a relation colour, the
            hull class once it has one, and the kind bracket. Never a
            name — the wide sweep is capped below identification.
    FOCUS   one contact at a time, wherever you are pointing. That is
            the only thing that turns "freighter" into a name, and a
            hull stays named afterwards for as long as it is in range.
  
  A contact the scanner has nothing on gets nothing drawn. That is
  the point: an empty canopy means the array has not found anything,
  not that the sky is empty.
- L2630 · `_relById.clear();` — relation comes off the contact board, which already resolves role,
  corp standing and any flag you set by hand into one word. Every hull
  the canopy can label is inside CONTACT_R, so it is always there.
- L2639 · `if (!view) continue;` — the array has nothing on it yet
- L2649 · `` const range = view.named ? ` · ${d < 10000 ? `${Math.round(d)} u` : `${Math.round(d / 100) `` — a named contact earns its range readout; an unnamed return is
  just a class, and putting a precise distance on something you
  cannot even identify reads as knowing more than you do
- L2667 · `edgeBuf.sort((a, b) => b.rank - a.rank);` — The rim is 412 pixels wide on the device this is played on. Twenty
  arrows around it is not situational awareness, it is a border — so
  only the few that would change what you do next get one.
- L2670 · `for (const u of droneOps.units) {` — your drones by name and what they are doing; the corporations' by flag
- L2686 · `for (const n of flow) {` — the heartbeat: a boat on the board is a ship with a name; its manifest reads inside 1.5 km
- L2686 · `for (const n of flow) {` — Port shuttles. Two rules they did not used to obey:
  
    - a boat is only labelled if it HAS A HULL DRAWN. `syncFlow` skips
      the mesh when the pool has not warmed yet, and the label loop
      did not care — so a port ringed with boats showed a crowd of
      names with nothing under them. If there is no hull, there is no
      label; the array is reporting what is there, not what the sim
      knows about.
    - and they go through the scanner like everything else. A shuttle
      is `[D]`: it belongs to its port, it flies a fixed loop, it goes
      home, and nobody is filed as its captain.
- L2705 · `const eng = sim.engagement;` — a live engagement: marked wherever it is, so you can go and join it
- L2725 · `for (const h of holes) {` — a collapsed star is labelled from anywhere in the system: it is the one
  thing out there you most need to know the direction of
- L2749 · `const markers = [];` — Flight markers: prograde, retrograde, commanded heading, target.
- L2798 · `bloom.setThreshold(warpStrength > 0.05 ? 0.42 : 0.62, 0.65);` — Bloom only while there is something to bloom. Idle, this is byte for
  byte the plain render it always was; in a tunnel it is two extra
  full-screen passes, and perf.js decides whether the device can have
  them at all.
- L2799 · `const lensPass = holeFx.lens();` — a lensed disk is the one thing outside a warp tunnel that wants to bleed
<!-- /note -->

#### <a id="s-mountGame-bodyDetail"></a>`mountGame.bodyDetail()`

prop · L2803–2803

<!-- note:mountGame.bodyDetail -->
<!-- /note -->
