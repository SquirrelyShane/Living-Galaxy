# js/station/stationyard.js

[index](../../../README.md) · 204 lines · 28 symbols · 2 imports · 5 importers

## About

<!-- note:@file -->
LIVING GALAXY — the station yard: STATIONGEN stations in the sky.

Every port is grown once from its seed by the station generator
(js/stationgen — the same generator that ships as STATIONGEN), scaled to
the sim (1 u = 10 m) and held still in the sky: the rings and drums spin
inside it, the hull itself does not, so a hangar mouth points the same
way for everyone and the lanes can grow out of it.

What the build hands the sim, on the station record:
  st.gen     { root, anim, stats, builder, cfg }   the engine draws root, ticks anim
  st.port    the primary hangar's mouth: position, direction, side, up, the
             way spacing and aperture — npc/lanes.js builds the lane funnel on it
  st.hangars every mouth, each with an entry door (port half) and an exit
             door (starboard half): the tractor pulls in by one and pushes
             out by the other, so arrivals and departures never cross
  st.mounts  weapon mounts (kind, position, range, damage, rate, ammo) and
             drone bays and shield emitters — stationworks.js fires them
  st.works   the fabrication lines and magazines — stationworks.js runs them

Sector → archetype, radius → population tier, so a military port grows a
bastion, a civilian one a habitat city or a pilgrim sanctum, a free port a
welded hold. Same seed, same station, on every client.

- L4 · `export const SIM_SCALE = 0.14;` — metres → world units (1 u = 10 m; ports are grown a little large for the sky)
<!-- /note -->

## Imports

| line | from | names | target |
|---|---|---|---|
| 1 | `three` | `*` as `THREE` | external |
| 2 | `../stationgen/index.js` | `buildStation`, `releaseStation`, `MODULES` | [js/stationgen/index.js](../stationgen/index.js.md) |

## Imported by

- [js/render/engine.js](../render/engine.js.md) — `ensureBuilt`
- [js/sim/sim.js](../sim/sim.js.md) — `releaseBuilt`, `carryBuilt`, `dropCarried`
- [js/station/stations.js](stations.js.md) — `ensureBuilt`, `releaseBuilt`, `headingFor`, `orientStation`
- [js/station/stationworks.js](stationworks.js.md) — `mouthCoords`, `worksOf`
- test/bay.test.mjs _(outside js/)_ — `ensureBuilt`

## Exports

- [`SIM_SCALE`](#s-SIM_SCALE) · const — **no importer in scanned roots**
- [`YARD_VERSION`](#s-YARD_VERSION) · const — **no importer in scanned roots**
- [`MOUNT_KINDS`](#s-MOUNT_KINDS) · const — **no importer in scanned roots**
- [`stationConfig`](#s-stationConfig) · function — **no importer in scanned roots**
- [`ensureBuilt`](#s-ensureBuilt) · function — used by [js/render/engine.js](../render/engine.js.md), [js/station/stations.js](stations.js.md), test/bay.test.mjs
- [`headingFor`](#s-headingFor) · function — used by [js/station/stations.js](stations.js.md)
- [`orientStation`](#s-orientStation) · function — used by [js/station/stations.js](stations.js.md)
- [`carryBuilt`](#s-carryBuilt) · function — used by [js/sim/sim.js](../sim/sim.js.md)
- [`dropCarried`](#s-dropCarried) · function — used by [js/sim/sim.js](../sim/sim.js.md)
- [`carriedCount`](#s-carriedCount) · function — **no importer in scanned roots**
- [`releaseBuilt`](#s-releaseBuilt) · function — used by [js/sim/sim.js](../sim/sim.js.md), [js/station/stations.js](stations.js.md)
- [`portFrameOf`](#s-portFrameOf) · function — **no importer in scanned roots**
- [`mountsOf`](#s-mountsOf) · function — **no importer in scanned roots**
- [`worksOf`](#s-worksOf) · function — used by [js/station/stationworks.js](stationworks.js.md)
- [`mouthCoords`](#s-mouthCoords) · function — used by [js/station/stationworks.js](stationworks.js.md)

## Effects

_none detected_

## Symbols

### <a id="s-SIM_SCALE"></a>`SIM_SCALE`

const · **exported** · L4–4

<!-- note:SIM_SCALE -->
<!-- /note -->

### <a id="s-YARD_VERSION"></a>`YARD_VERSION`

const · **exported** · L5–5

<!-- note:YARD_VERSION -->
<!-- /note -->

### <a id="s-ARCH_BY_SECTOR"></a>`ARCH_BY_SECTOR`

const · L7–14

<!-- note:ARCH_BY_SECTOR -->
<!-- /note -->

### <a id="s-MOUNT_KINDS"></a>`MOUNT_KINDS`

const · **exported** · L16–23

<!-- note:MOUNT_KINDS -->
weapon mounts: what each defence module is worth in the sky (world units, u/s, hull points)
<!-- /note -->

### <a id="s-stationConfig"></a>`stationConfig(st, skySeed=)`

function · **exported** · L25–39

- called by: [`ensureBuilt`](#s-ensureBuilt)

<!-- note:stationConfig -->
The generator config a port grows from. Deterministic in (sky seed, station).

- L28 · `const archetype = st.archetype ?? pool[pick];` — the GNN station asks for a relay
<!-- /note -->

### <a id="s-_v"></a>`_v`

const · L41–41 · **never referenced**

<!-- note:_v -->
<!-- /note -->

### <a id="s-_w"></a>`_w`

const · L41–41

<!-- note:_w -->
<!-- /note -->

### <a id="s-worldOf"></a>`worldOf(obj, x, y, z, out=)`

function · L42–42

- called by: [`dirOf`](#s-dirOf) ×2 · [`mountsOf`](#s-mountsOf) · [`mouthOf`](#s-mouthOf) ×3

<!-- note:worldOf -->
<!-- /note -->

### <a id="s-dirOf"></a>`dirOf(obj, x, y, z, out=)`

function · L43–43

- calls: [`worldOf`](#s-worldOf) ×2
- called by: [`mountsOf`](#s-mountsOf) · [`mouthOf`](#s-mouthOf) ×3

<!-- note:dirOf -->
<!-- /note -->

### <a id="s-ensureBuilt"></a>`ensureBuilt(st, skySeed=)`

function · **exported** · L45–70

- calls: [`clonePort`](#s-clonePort) ×2 · [`headingFor`](#s-headingFor) · [`mountsOf`](#s-mountsOf) · [`mouthOf`](#s-mouthOf) · [`orientStation`](#s-orientStation) · [`portFrameOf`](#s-portFrameOf) · [`stationConfig`](#s-stationConfig) · [`buildStation`](../stationgen/generate.js.md#s-buildStation) _js/stationgen/generate.js_
- called by: [`mountGame>makeStation`](../render/engine.js.md#s-mountGame-makeStation) _js/render/engine.js_ · [`buildStations`](stations.js.md#s-buildStations) _js/station/stations.js_

<!-- note:ensureBuilt -->
Grow a port once. Idempotent; cheap after the first call.

- L49 · `let g = carried.get(key);` — 0.3.61 — the same sky loaded again (the menu's preview, then FLY AS) hands
  its hulls across instead of growing every port a second time
- L53 · `root.parent?.remove(root);` — a held hull still hangs off the last engine's holder, out in the scene;
  everything below is measured in the hull's own frame, so it comes off first
- L59 · `st.radius = Math.max(12, Math.max(g.stats.size.x, g.stats.size.y, g.stats.size.z) * 0.5 *` — the hull's real size takes over from the roll that picked the tier
- L60 · `st.portLocal = portFrameOf(st);` — everything below is measured in the unrotated hull; orientStation turns it to the station's heading
<!-- /note -->

### <a id="s-clonePort"></a>`clonePort(p)`

function · L72–72

- called by: [`ensureBuilt`](#s-ensureBuilt) ×2

<!-- note:clonePort -->
<!-- /note -->

### <a id="s-headingFor"></a>`headingFor(st, orbitAngle=)`

function · **exported** · L74–82

- called by: [`stepStations`](stations.js.md#s-stepStations) _js/station/stations.js_ · [`ensureBuilt`](#s-ensureBuilt)

<!-- note:headingFor -->
The heading the hull points its primary mouth along. A tethered port keeps its mouth turned
away from its host so the lanes run out into open sky; a free port takes a heading off its seed.

- L79 · `if (h < 0.2) return seedYaw;` — a mouth that points along the hull's own up: leave it
<!-- /note -->

### <a id="s-rotY"></a>`rotY(v, out, c, s)`

function · L84–84

- called by: [`orientStation`](#s-orientStation) ×2 · [`orientStation>turn`](#s-orientStation-turn) ×2

<!-- note:rotY -->
<!-- /note -->

### <a id="s-orientStation"></a>`orientStation(st, yaw)`

function · **exported** · L85–98

- calls: [`orientStation>turn`](#s-orientStation-turn) ×2 · [`rotY`](#s-rotY) ×2
- called by: [`stepStations`](stations.js.md#s-stepStations) _js/station/stations.js_ · [`ensureBuilt`](#s-ensureBuilt)

<!-- note:orientStation -->
Turn the hull's port frame, mounts and mouths to heading `yaw` (rotation about +Y, three.js sense).

- L87 · `if (st.yaw != null) { const dy = yaw - st.yaw; if (Math.abs(Math.atan2(Math.sin(dy), Math.` — a tethered port creeps round its orbit by ~1e-6 rad a frame: a turn that small is not worth a new port frame (portVersion feeds a lanes cache)
<!-- /note -->

#### <a id="s-orientStation-turn"></a>`orientStation>turn(src, dst)`

function · L89–92

- calls: [`rotY`](#s-rotY) ×2
- called by: [`orientStation`](#s-orientStation) ×2

<!-- note:orientStation>turn -->
<!-- /note -->

### <a id="s-carried"></a>`carried`

const · L100–100

<!-- note:carried -->
0.3.61 — hulls held across a reload of the same sky, keyed by their full
build config. A port is a pure function of that config, and nothing in the
game edits a built hull (only its animation state moves), so a held hull is
the hull a fresh build would make. Anything not claimed is released.
<!-- /note -->

### <a id="s-carryBuilt"></a>`carryBuilt(list)`

function · **exported** · L101–107

- calls: [`releaseBuilt`](#s-releaseBuilt)
- called by: [`loadSky`](../sim/sim.js.md#s-loadSky) _js/sim/sim.js_

<!-- note:carryBuilt -->
Hold a roster's hulls for the next build of the same sky; the roster lets go of them.
<!-- /note -->

### <a id="s-dropCarried"></a>`dropCarried()`

function · **exported** · L108–111

- calls: [`releaseStation`](../stationgen/generate.js.md#s-releaseStation) _js/stationgen/generate.js_
- called by: [`loadSky`](../sim/sim.js.md#s-loadSky) _js/sim/sim.js_

<!-- note:dropCarried -->
Release whatever a reload did not claim.

- L109 · `for (const g of carried.values()) { try { releaseStation(g); } catch {` — already gone
<!-- /note -->

### <a id="s-carriedCount"></a>`carriedCount()`

function · **exported** · L112–112

<!-- note:carriedCount -->
<!-- /note -->

### <a id="s-releaseBuilt"></a>`releaseBuilt(st)`

function · **exported** · L114–118

- calls: [`releaseStation`](../stationgen/generate.js.md#s-releaseStation) _js/stationgen/generate.js_
- called by: [`dropStation`](../sim/sim.js.md#s-dropStation) _js/sim/sim.js_ · [`resetStations`](stations.js.md#s-resetStations) _js/station/stations.js_ · [`carryBuilt`](#s-carryBuilt)

<!-- note:releaseBuilt -->
- L116 · `try { releaseStation(st.gen); } catch {` — already gone
<!-- /note -->

### <a id="s-mouthOf"></a>`mouthOf(h)`

function · L120–142

- calls: [`dirOf`](#s-dirOf) ×3 · [`mouthOf>half`](#s-mouthOf-half) ×3 · [`worldOf`](#s-worldOf) ×3
- called by: [`ensureBuilt`](#s-ensureBuilt) · [`portFrameOf`](#s-portFrameOf)

<!-- note:mouthOf -->
A hangar's mouth in station-local world units: centre, out direction, side (+x of the bay), up.

- L137 · `berth: half(-0.5, back),` — the clamps, on the arrivals side of the bay
- L139 · `wayGap: (h.w / 2 / 3) * SIM_SCALE,` — centre-to-centre of the ways at the mouth
- L140 · `laneLen: h.d * 0.8 * SIM_SCALE,` — the gantries outside
<!-- /note -->

#### <a id="s-mouthOf-half"></a>`mouthOf>half(sgn, p)`

function · L130–130

- called by: [`mouthOf`](#s-mouthOf) ×3

<!-- note:mouthOf>half -->
one aperture, two doors: arrivals come in through the port half (−x), departures leave by the starboard half (+x).
The clamps sit on the same side of the bay, so an inbound hull and an outbound one never share a line.
<!-- /note -->

### <a id="s-portFrameOf"></a>`portFrameOf(st)`

function · **exported** · L144–153

- calls: [`mouthOf`](#s-mouthOf)
- called by: [`ensureBuilt`](#s-ensureBuilt)

<!-- note:portFrameOf -->
The port frame the lanes grow from: the first hangar's mouth.
<!-- /note -->

### <a id="s-mountsOf"></a>`mountsOf(st)`

function · **exported** · L155–176

- calls: [`dirOf`](#s-dirOf) · [`worldOf`](#s-worldOf)
- called by: [`ensureBuilt`](#s-ensureBuilt)

<!-- note:mountsOf -->
Weapon mounts, drone bays and shield emitters with their station-local positions.
<!-- /note -->

### <a id="s-worksOf"></a>`worksOf(st)`

function · **exported** · L178–196

- calls: [`worksOf>count`](#s-worksOf-count) ×4
- called by: [`worksFor`](stationworks.js.md#s-worksFor) _js/station/stationworks.js_

<!-- note:worksOf -->
Roll-up of what the port can make and hold, from its manifest.
<!-- /note -->

#### <a id="s-worksOf-count"></a>`worksOf>count(id)`

function · L180–180

- called by: [`worksOf`](#s-worksOf) ×4

<!-- note:worksOf>count -->
<!-- /note -->

#### <a id="s-worksOf-hasLine"></a>`worksOf>hasLine(part)`

function · L182–182

<!-- note:worksOf>hasLine -->
<!-- /note -->

### <a id="s-mouthCoords"></a>`mouthCoords(st, m, p)`

function · **exported** · L198–204

- called by: [`engageTractor`](stationworks.js.md#s-engageTractor) _js/station/stationworks.js_ · [`mouthAround`](stationworks.js.md#s-mouthAround) _js/station/stationworks.js_

<!-- note:mouthCoords -->
Distance from a point to a hangar mouth's plane, and where it sits across the aperture.

- L200 · `const along = px * m.dir.x + py * m.dir.y + pz * m.dir.z;` — + outside the mouth, − inside the bay
<!-- /note -->
