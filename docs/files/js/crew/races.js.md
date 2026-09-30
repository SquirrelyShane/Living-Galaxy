# js/crew/races.js

[index](../../../README.md) · 205 lines · 7 symbols · 1 imports · 11 importers

## About

<!-- note:@file -->
LIVING GALAXY — races.

Every trait here lands on something the sim already simulates. A race that
"runs cold" really does draw less life support; one that "reads the well"
really does lock faster. Nothing is flavour-only.

traits are multipliers unless noted:
  rcs      attitude and thruster authority
  life     life-support draw (lower is better)
  hull     hull integrity
  reactor  reactor output
  hold     cargo capacity
  lock     signature-lock speed
  gTol     tolerance to acceleration and impact shake (lower shake is better)
  heat     resistance to solar and re-entry heating (lower damage is better)
  scan     survey range
  credits  flat starting credits
<!-- /note -->

## Imports

| line | from | names | target |
|---|---|---|---|
| 1 | `../careers/effects.js` | `RACE_EFFECTS`, `effectLines` | [js/careers/effects.js](../careers/effects.js.md) |

## Imported by

- [js/console/panels/corp.js](../console/panels/corp.js.md) — `raceById`, `traitLines`
- [js/corp/gdb.js](../corp/gdb.js.md) — `RACES`
- [js/crew/family.js](family.js.md) — `RACES`
- [js/crew/talkview.js](talkview.js.md) — `RACES`
- [js/flight/pilot.js](../flight/pilot.js.md) — `RACES`, `raceById`, `traitsOf`
- [js/genome/spacer.js](../genome/spacer.js.md) — `RACES`
- [js/npc/cradle.js](../npc/cradle.js.md) — `RACES`
- [js/npc/speech.js](../npc/speech.js.md) — `RACES`
- [js/ui/creation.js](../ui/creation.js.md) — `RACES`, `raceById`, `traitLines`, `traitsOf`
- test/careers.test.mjs _(outside js/)_ — `RACES`
- test/gender.test.mjs _(outside js/)_ — `RACES`

## Exports

- [`RACES`](#s-RACES) · const — used by [js/corp/gdb.js](../corp/gdb.js.md), [js/crew/family.js](family.js.md), [js/crew/talkview.js](talkview.js.md), [js/flight/pilot.js](../flight/pilot.js.md), [js/genome/spacer.js](../genome/spacer.js.md), [js/npc/cradle.js](../npc/cradle.js.md), [js/npc/speech.js](../npc/speech.js.md), [js/ui/creation.js](../ui/creation.js.md), test/careers.test.mjs, test/gender.test.mjs
- [`RACE_IDS`](#s-RACE_IDS) · const — **no importer in scanned roots**
- [`raceById`](#s-raceById) · function — used by [js/console/panels/corp.js](../console/panels/corp.js.md), [js/flight/pilot.js](../flight/pilot.js.md), [js/ui/creation.js](../ui/creation.js.md)
- [`traitsOf`](#s-traitsOf) · function — used by [js/flight/pilot.js](../flight/pilot.js.md), [js/ui/creation.js](../ui/creation.js.md)
- [`traitLines`](#s-traitLines) · function — used by [js/console/panels/corp.js](../console/panels/corp.js.md), [js/ui/creation.js](../ui/creation.js.md)

## Effects

_none detected_

## Symbols

### <a id="s-RACES"></a>`RACES`

const · **exported** · L3–169

<!-- note:RACES -->
<!-- /note -->

### <a id="s-RACE_IDS"></a>`RACE_IDS`

const · **exported** · L171–171

<!-- note:RACE_IDS -->
<!-- /note -->

### <a id="s-raceById"></a>`raceById(id)`

function · **exported** · L173–175

- called by: [`mountPilot`](../console/panels/corp.js.md#s-mountPilot) _js/console/panels/corp.js_ ×2 · [`traitsOf`](#s-traitsOf) · [`makePilot`](../flight/pilot.js.md#s-makePilot) _js/flight/pilot.js_ · [`mountCreation>render`](../ui/creation.js.md#s-mountCreation-render) _js/ui/creation.js_ · [`mountCreation>renderCompile`](../ui/creation.js.md#s-mountCreation-renderCompile) _js/ui/creation.js_ · [`mountCreation>renderRace`](../ui/creation.js.md#s-mountCreation-renderRace) _js/ui/creation.js_

<!-- note:raceById -->
<!-- /note -->

### <a id="s-DEFAULT_TRAITS"></a>`DEFAULT_TRAITS`

const · L177–179

<!-- note:DEFAULT_TRAITS -->
<!-- /note -->

### <a id="s-traitsOf"></a>`traitsOf(id)`

function · **exported** · L181–183

- calls: [`raceById`](#s-raceById)
- called by: [`traitLines`](#s-traitLines) · [`applyRaceToShip`](../flight/pilot.js.md#s-applyRaceToShip) _js/flight/pilot.js_ · [`applyRaceTune`](../flight/pilot.js.md#s-applyRaceTune) _js/flight/pilot.js_ · [`raceTraits`](../flight/pilot.js.md#s-raceTraits) _js/flight/pilot.js_ · [`refreshMods`](../flight/pilot.js.md#s-refreshMods) _js/flight/pilot.js_ · [`syncMods`](../flight/pilot.js.md#s-syncMods) _js/flight/pilot.js_ · [`mountCreation>renderCompile`](../ui/creation.js.md#s-mountCreation-renderCompile) _js/ui/creation.js_

<!-- note:traitsOf -->
<!-- /note -->

### <a id="s-traitLines"></a>`traitLines(id)`

function · **exported** · L185–205

- calls: [`effectLines`](../careers/effects.js.md#s-effectLines) _js/careers/effects.js_ · [`traitLines>add`](#s-traitLines-add) ×9 · [`traitsOf`](#s-traitsOf)
- called by: [`mountPilot`](../console/panels/corp.js.md#s-mountPilot) _js/console/panels/corp.js_ · [`mountCreation>renderRace`](../ui/creation.js.md#s-mountCreation-renderRace) _js/ui/creation.js_

<!-- note:traitLines -->
Human-readable deltas, for the creation screen.
<!-- /note -->

#### <a id="s-traitLines-add"></a>`traitLines>add(label, v, higherIsBetter)`

function · L188–192

- called by: [`traitLines`](#s-traitLines) ×9

<!-- note:traitLines>add -->
Always show the raw change; `higherIsBetter` decides how it reads.
<!-- /note -->
