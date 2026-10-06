# js/world/generate.js

[index](../../../README.md) · 268 lines · 24 symbols · 3 imports · 16 importers

## About

<!-- note:@file -->
<!-- /note -->

## Imports

| line | from | names | target |
|---|---|---|---|
| 1 | `./bodies.js` | `PUBLIC_ROOM`, `SOL_BEACONS`, `SOL_BODIES` | [js/world/bodies.js](bodies.js.md) |
| 2 | `./archetypes.js` | `archetypeById`, `rollArchetypeAt`, `tempBand` | [js/world/archetypes.js](archetypes.js.md) |
| 3 | `./names.js` | `skyNaming`, `worldName`, `moonName`, `beaconName` | [js/world/names.js](names.js.md) |

## Imported by

- [js/comms/comms.js](../comms/comms.js.md) — `rngFromSeed`
- [js/drones/npcdrones.js](../drones/npcdrones.js.md) — `rngFromSeed`
- [js/economy/contracts.js](../economy/contracts.js.md) — `rngFromSeed`
- [js/flight/turrets.js](../flight/turrets.js.md) — `rngFromSeed`
- [js/npc/battles.js](../npc/battles.js.md) — `rngFromSeed`
- [js/npc/flow.js](../npc/flow.js.md) — `rngFromSeed`
- [js/npc/rogues.js](../npc/rogues.js.md) — `rngFromSeed`
- [js/npc/traffic.js](../npc/traffic.js.md) — `rngFromSeed`
- [js/sim/sim.js](../sim/sim.js.md) — `generateSystem`, `rngFromSeed`, `spawnBodyId`
- [js/ui/hud.js](../ui/hud.js.md) — `describeSystem`, `generateSystem`
- [js/world/hulks.js](hulks.js.md) — `rngFromSeed`
- test/ariaplay.test.mjs _(outside js/)_ — `rngFromSeed`
- test/economy.test.mjs _(outside js/)_ — `rngFromSeed`
- test/nav.test.mjs _(outside js/)_ — `generateSystem`
- test/npcchat.test.mjs _(outside js/)_ — `rngFromSeed`
- test/spacing.test.mjs _(outside js/)_ — `generateSystem`, `spawnBodyId`, `rngFromSeed`

## Exports

- [`rngFromSeed`](#s-rngFromSeed) · function — used by [js/comms/comms.js](../comms/comms.js.md), [js/drones/npcdrones.js](../drones/npcdrones.js.md), [js/economy/contracts.js](../economy/contracts.js.md), [js/flight/turrets.js](../flight/turrets.js.md), [js/npc/battles.js](../npc/battles.js.md), [js/npc/flow.js](../npc/flow.js.md), [js/npc/rogues.js](../npc/rogues.js.md), [js/npc/traffic.js](../npc/traffic.js.md), [js/sim/sim.js](../sim/sim.js.md), [js/world/hulks.js](hulks.js.md), test/ariaplay.test.mjs, test/economy.test.mjs, test/npcchat.test.mjs, test/spacing.test.mjs
- [`generateSystem`](#s-generateSystem) · function — used by [js/sim/sim.js](../sim/sim.js.md), [js/ui/hud.js](../ui/hud.js.md), test/nav.test.mjs, test/spacing.test.mjs
- [`spawnBodyId`](#s-spawnBodyId) · function — used by [js/sim/sim.js](../sim/sim.js.md), test/spacing.test.mjs
- [`describeSystem`](#s-describeSystem) · function — used by [js/ui/hud.js](../ui/hud.js.md)

## Effects

_none detected_

## Symbols

### <a id="s-xmur3"></a>`xmur3(str)`

function · L4–15

- called by: [`rngFromSeed`](#s-rngFromSeed)

<!-- note:xmur3 -->
<!-- /note -->

### <a id="s-mulberry32"></a>`mulberry32(seed)`

function · L16–23

- called by: [`rngFromSeed`](#s-rngFromSeed)

<!-- note:mulberry32 -->
<!-- /note -->

### <a id="s-rngFromSeed"></a>`rngFromSeed(seed)`

function · **exported** · L24–26

- calls: [`mulberry32`](#s-mulberry32) · [`xmur3`](#s-xmur3)
- called by: [`step`](../comms/comms.js.md#s-step) _js/comms/comms.js_ · [`populateNpcDrones`](../drones/npcdrones.js.md#s-populateNpcDrones) _js/drones/npcdrones.js_ · [`boardFor`](../economy/contracts.js.md#s-boardFor) _js/economy/contracts.js_ · [`issuersAt`](../economy/contracts.js.md#s-issuersAt) _js/economy/contracts.js_ · [`resetCombat`](../flight/turrets.js.md#s-resetCombat) _js/flight/turrets.js_ · [`engagementFor`](../npc/battles.js.md#s-engagementFor) _js/npc/battles.js_ · [`populateFlow`](../npc/flow.js.md#s-populateFlow) _js/npc/flow.js_ · [`resetRogues`](../npc/rogues.js.md#s-resetRogues) _js/npc/rogues.js_ · [`buildRoster`](../npc/traffic.js.md#s-buildRoster) _js/npc/traffic.js_ · [`eventAt`](../npc/traffic.js.md#s-eventAt) _js/npc/traffic.js_ · [`spawnVessel`](../npc/traffic.js.md#s-spawnVessel) _js/npc/traffic.js_ · [`loadSky`](../sim/sim.js.md#s-loadSky) _js/sim/sim.js_ ×3 · [`tryScan`](../sim/sim.js.md#s-tryScan) _js/sim/sim.js_ · [`generateSystem`](#s-generateSystem) · [`spawnHulk`](hulks.js.md#s-spawnHulk) _js/world/hulks.js_

<!-- note:rngFromSeed -->
<!-- /note -->

### <a id="s-range"></a>`range(rng, a, b)`

function · L27–29

- called by: [`generateSystem`](#s-generateSystem) ×27 · [`irange`](#s-irange)

<!-- note:range -->
<!-- /note -->

### <a id="s-irange"></a>`irange(rng, a, b)`

function · L30–32

- calls: [`range`](#s-range)
- called by: [`generateSystem`](#s-generateSystem) ×7

<!-- note:irange -->
<!-- /note -->

### <a id="s-pick"></a>`pick(rng, arr)`

function · L33–35

- called by: [`generateSystem`](#s-generateSystem) ×2 · [`makeBody`](#s-makeBody) ×2

<!-- note:pick -->
<!-- /note -->

### <a id="s-chance"></a>`chance(rng, p)`

function · L36–38

- called by: [`generateSystem`](#s-generateSystem) ×16

<!-- note:chance -->
<!-- /note -->

### <a id="s-ROCKY"></a>`ROCKY`

const · L39–39

<!-- note:ROCKY -->
<!-- /note -->

### <a id="s-CLOUD"></a>`CLOUD`

const · L40–40

<!-- note:CLOUD -->
<!-- /note -->

### <a id="s-TERRA"></a>`TERRA`

const · L41–41

<!-- note:TERRA -->
<!-- /note -->

### <a id="s-GAS"></a>`GAS`

const · L42–42

<!-- note:GAS -->
<!-- /note -->

### <a id="s-ICE"></a>`ICE`

const · L43–43

<!-- note:ICE -->
<!-- /note -->

### <a id="s-DWARF"></a>`DWARF`

const · L44–44

<!-- note:DWARF -->
<!-- /note -->

### <a id="s-MOON"></a>`MOON`

const · L45–45

<!-- note:MOON -->
<!-- /note -->

### <a id="s-STARS"></a>`STARS`

const · L46–54

<!-- note:STARS -->
<!-- /note -->

### <a id="s-pickWeighted"></a>`pickWeighted(rng, arr)`

function · L56–64

- called by: [`generateSystem`](#s-generateSystem)

<!-- note:pickWeighted -->
<!-- /note -->

### <a id="s-SETTLED_ARCH"></a>`SETTLED_ARCH`

const · L65–65

<!-- note:SETTLED_ARCH -->
Worlds used to be one root plus one tail — 27 x 14, three hundred and
seventy-eight names for every body in every sky, shared between stars,
planets and moons. They come out of js/world/names.js now: each system draws a
tongue and names its worlds from it, so a sky sounds like one place, and a
world that nobody settled often never got past its survey designation.

Archetypes that mean somebody could actually live there. A world with
people on it tends to be named after whoever got there first.
<!-- /note -->

### <a id="s-atmoFor"></a>`atmoFor(kind, color)`

function · L66–70

- called by: [`makeBody`](#s-makeBody)

<!-- note:atmoFor -->
<!-- /note -->

### <a id="s-HINTS"></a>`HINTS`

const · L71–80

<!-- note:HINTS -->
<!-- /note -->

### <a id="s-BLURBS"></a>`BLURBS`

const · L81–90

<!-- note:BLURBS -->
<!-- /note -->

### <a id="s-makeBody"></a>`makeBody(rng, partial)`

function · L91–99

- calls: [`archetypeById`](archetypes.js.md#s-archetypeById) _js/world/archetypes.js_ · [`atmoFor`](#s-atmoFor) · [`pick`](#s-pick) ×2
- called by: [`generateSystem`](#s-generateSystem) ×3

<!-- note:makeBody -->
- L92 · `const archAtmo = partial.arch ? archetypeById(partial.arch)?.atmo : undefined;` — An archetype that names its own atmosphere colour gets it (applied in
  scaleBody); only arch-less bodies fall back to the generic kind tint.
<!-- /note -->

### <a id="s-generateSystem"></a>`generateSystem(seedRaw)`

function · **exported** · L100–250

- calls: [`rollArchetypeAt`](archetypes.js.md#s-rollArchetypeAt) _js/world/archetypes.js_ ×2 · [`tempBand`](archetypes.js.md#s-tempBand) _js/world/archetypes.js_ · [`chance`](#s-chance) ×16 · [`irange`](#s-irange) ×7 · [`makeBody`](#s-makeBody) ×3 · [`pick`](#s-pick) ×2 · [`pickWeighted`](#s-pickWeighted) · [`range`](#s-range) ×27 · [`rngFromSeed`](#s-rngFromSeed) · [`beaconName`](names.js.md#s-beaconName) _js/world/names.js_ · [`moonName`](names.js.md#s-moonName) _js/world/names.js_ · [`skyNaming`](names.js.md#s-skyNaming) _js/world/names.js_ · [`worldName`](names.js.md#s-worldName) _js/world/names.js_
- called by: [`loadSky`](../sim/sim.js.md#s-loadSky) _js/sim/sim.js_ · [`mountHud.systemName`](../ui/hud.js.md#s-mountHud-systemName) _js/ui/hud.js_ · [`mountHud>describeSeed`](../ui/hud.js.md#s-mountHud-describeSeed) _js/ui/hud.js_ · [`mountHud>refreshPreview`](../ui/hud.js.md#s-mountHud-refreshPreview) _js/ui/hud.js_ · [`mountHud>setMode.name`](../ui/hud.js.md#s-mountHud-setMode-name) _js/ui/hud.js_

<!-- note:generateSystem -->
- L109 · `outerBelt: { inner: 190, outer: 232, count: 260 },` — the Kuiper belt: Sol's ice country, so every gas and volatile is
  cuttable here too — no sky is short of anything a bench can use
- L134 · `const flavour = rng();` — Systems vary a lot more than Sol does: some are all rock, some are a
  chain of giants, some carry a world that already came apart.
- L135 · `const rocky = flavour < 0.22;` — dense inner system, few giants
- L136 · `const giants = flavour > 0.78;` — giant chain
- L183 · `const band = tempBand(s + 0.5, slots.length);` — Where it sits decides what it probably is.
- L185 · `const { name } = worldName(sky, { kind: slot.kind, arch: arch.id, index: pIndex, settled:` — And what it is decides how it got its name.
- L201 · `if (slot.kind !== "gas" && slot.kind !== "star" && chance(rng, 0.07)) planet.bornShattered` — Some systems have already had their catastrophe.
- L227 · `if (!belt) {` — Every sky gets a main belt and an outer ice belt. The main belt's bands
  carry every metal, stone and carbon ore; the outer belt carries every
  ice and gas — so whatever the trade, and whichever sky the tutorial
  finds itself in, the material it needs exists somewhere out there.
<!-- /note -->

### <a id="s-spawnBodyId"></a>`spawnBodyId(system)`

function · **exported** · L251–257

- called by: [`launchSim`](../sim/sim.js.md#s-launchSim) _js/sim/sim.js_ · [`wireReactiveSky`](../sim/sim.js.md#s-wireReactiveSky) _js/sim/sim.js_

<!-- note:spawnBodyId -->
<!-- /note -->

### <a id="s-describeSystem"></a>`describeSystem(system)`

function · **exported** · L258–268

- called by: [`mountHud>describeSeed`](../ui/hud.js.md#s-mountHud-describeSeed) _js/ui/hud.js_

<!-- note:describeSystem -->
<!-- /note -->
