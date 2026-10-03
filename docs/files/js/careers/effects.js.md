# js/careers/effects.js

[index](../../../README.md) · 110 lines · 7 symbols · 0 imports · 8 importers

## About

<!-- note:@file -->
LIVING GALAXY — what a race and a specialisation actually do to the ship.

One flat bag of multipliers (`mods`) that the sim reads every tick. Race
traits seed it, a specialisation multiplies into it, and anything later
(crew, hull, corp perks) can multiply into it too. Every key here lands on
something the sim already simulates — the table below is the contract.

  life      life-support draw                 (ship.js  stepPower)
  hull      damage taken is divided by this    (ship.js  applyDamage, reactor strain)
  lock      signature-lock rate                (sim.js   stepLock)
  gTol      impact shake                       (sim.js   impact, onImpact)  lower is better
  heat      solar / re-entry damage            (sim.js   stepCollisions)    lower is better
  scan      survey range                       (sim.js   tryScan)
  mine      mining laser yield                 (turrets.js stepMining)
  turret    turret cycle rate                  (turrets.js stepTurrets)
  sell      what ports pay you                 (sim.js   sellPriceAt)
  buy       what ports charge you              (sim.js   buyPriceAt)   lower is better
  cargo     hold capacity                      (sim.js   syncMods)
  warp      warp spool time                    (sim.js   spoolTime)   lower is better
  salvage   tractor reach and pull             (sim.js   stepSalvage)
  standing  standing gained from good deeds    (corps.js adjustStanding)
  blame     standing lost from bad ones        (corps.js adjustStanding) lower is better
  menace    range at which pirates make demands(comms.js stepIncoming) lower is better
<!-- /note -->

## Imports

_none_

## Imported by

- [js/console/panels/corp.js](../console/panels/corp.js.md) — `MOD_LABELS`
- [js/crew/races.js](../crew/races.js.md) — `RACE_EFFECTS`, `effectLines`
- [js/economy/upgrades.js](../economy/upgrades.js.md) — `MOD_KEYS`, `MOD_LABELS`, `defaultMods`
- [js/flight/pilot.js](../flight/pilot.js.md) — `SPEC_EFFECTS`, `composeMods`, `effectLines`
- [js/flight/ship.js](../flight/ship.js.md) — `defaultMods`
- [js/npc/crewfx.js](../npc/crewfx.js.md) — `MOD_KEYS`, `defaultMods`
- test/careers.test.mjs _(outside js/)_ — `MOD_KEYS`, `SPEC_EFFECTS`, `RACE_EFFECTS`, `composeMods`
- test/rig.test.mjs _(outside js/)_ — `MOD_LABELS`

## Exports

- [`MOD_KEYS`](#s-MOD_KEYS) · const — used by [js/economy/upgrades.js](../economy/upgrades.js.md), [js/npc/crewfx.js](../npc/crewfx.js.md), test/careers.test.mjs
- [`defaultMods`](#s-defaultMods) · function — used by [js/economy/upgrades.js](../economy/upgrades.js.md), [js/flight/ship.js](../flight/ship.js.md), [js/npc/crewfx.js](../npc/crewfx.js.md)
- [`MOD_LABELS`](#s-MOD_LABELS) · const — used by [js/console/panels/corp.js](../console/panels/corp.js.md), [js/economy/upgrades.js](../economy/upgrades.js.md), test/rig.test.mjs
- [`SPEC_EFFECTS`](#s-SPEC_EFFECTS) · const — used by [js/flight/pilot.js](../flight/pilot.js.md), test/careers.test.mjs
- [`RACE_EFFECTS`](#s-RACE_EFFECTS) · const — used by [js/crew/races.js](../crew/races.js.md), test/careers.test.mjs
- [`composeMods`](#s-composeMods) · function — used by [js/flight/pilot.js](../flight/pilot.js.md), test/careers.test.mjs
- [`effectLines`](#s-effectLines) · function — used by [js/crew/races.js](../crew/races.js.md), [js/flight/pilot.js](../flight/pilot.js.md)

## Effects

_none detected_

## Symbols

### <a id="s-MOD_KEYS"></a>`MOD_KEYS`

const · **exported** · L1–5

<!-- note:MOD_KEYS -->
<!-- /note -->

### <a id="s-defaultMods"></a>`defaultMods()`

function · **exported** · L7–11

- called by: [`composeMods`](#s-composeMods) · [`upgradeMods`](../economy/upgrades.js.md#s-upgradeMods) _js/economy/upgrades.js_ · [`makeShip`](../flight/ship.js.md#s-makeShip) _js/flight/ship.js_ · [`crewEffects`](../npc/crewfx.js.md#s-crewEffects) _js/npc/crewfx.js_

<!-- note:defaultMods -->
<!-- /note -->

### <a id="s-MOD_LABELS"></a>`MOD_LABELS`

const · **exported** · L13–30

<!-- note:MOD_LABELS -->
Human labels for the Pilot tab. `up` = is a higher number good news.
<!-- /note -->

### <a id="s-SPEC_EFFECTS"></a>`SPEC_EFFECTS`

const · **exported** · L32–82

<!-- note:SPEC_EFFECTS -->
One effect per specialisation. Modest numbers — a title, not a superpower.

- L33 · `belt_harvester: { mine: 1.15 },` — mining
- L36 · `trauma: { hull: 1.1 },` — healthcare
- L40 · `capital_hulls: { hull: 1.15 },` — shipyard
- L43 · `microelectronics: { lock: 1.15, scan: 1.05 },` — manufacturing
- L46 · `hazcargo: { cargo: 1.1, heat: 0.9 },` — logistics
- L49 · `fusion_watch: { warp: 0.9, hull: 1.05 },` — energy
- L52 · `spin_habitats: { gTol: 0.8 },` — construction
- L55 · `hydroponics: { life: 0.7 },` — agriculture
- L58 · `field_science: { scan: 1.25 },` — research
- L61 · `customs: { blame: 0.8, buy: 0.96 },` — security
- L64 · `tug_dock: { salvage: 1.25 },` — navigation
- L67 · `commodities: { sell: 1.08 },` — commerce
- L70 · `relay_ops: { scan: 1.1, lock: 1.1 },` — communications
- L73 · `atmo_works: { heat: 0.85, life: 0.9 },` — terraforming
- L76 · `live_wreck: { salvage: 1.2, hull: 1.05 },` — salvage
- L79 · `sim_pits: { gTol: 0.85, lock: 1.05 },` — education
<!-- /note -->

### <a id="s-RACE_EFFECTS"></a>`RACE_EFFECTS`

const · **exported** · L84–87

<!-- note:RACE_EFFECTS -->
Race quirks that are not plain trait multipliers.

- L85 · `oberlin: { standing: 1.25 },` — "Standing with the majors opens higher."
- L86 · `sirrah: { blame: 0.75, menace: 0.7 },` — "Neutral everywhere … hostiles think twice."
<!-- /note -->

### <a id="s-composeMods"></a>`composeMods(traits, raceId, specId)`

function · **exported** · L89–99

- calls: [`defaultMods`](#s-defaultMods)
- called by: [`pilot`](../flight/pilot.js.md#s-pilot) _js/flight/pilot.js_ · [`refreshMods`](../flight/pilot.js.md#s-refreshMods) _js/flight/pilot.js_

<!-- note:composeMods -->
Compose the bag: race traits (only the keys the sim reads), the race quirk,
then the specialisation. Pure — safe to call every time something changes.
<!-- /note -->

### <a id="s-effectLines"></a>`effectLines(src)`

function · **exported** · L101–110

- called by: [`traitLines`](../crew/races.js.md#s-traitLines) _js/crew/races.js_ · [`specEffectLines`](../flight/pilot.js.md#s-specEffectLines) _js/flight/pilot.js_ · [`specOptions`](../flight/pilot.js.md#s-specOptions) _js/flight/pilot.js_

<!-- note:effectLines -->
"Mining yield +15%" lines for one effect source.
<!-- /note -->
