# js/genome/context.js

[index](../../../README.md) · 234 lines · 18 symbols · 1 imports · 1 importers

## About

<!-- note:@file -->
Living Galaxy — GENOME CONTEXT, ported from the genome-agent project (v1.0) and
rewrapped as an ES module. Genes are a ceiling, not a stat line: this maps
genome + age + injury + environment + epigenetic history onto the phenotype
a hand actually works with this watch.

A spacer's "biome" is the hull they are standing in — see
js/crew/deckmind.js, which fills the context from the ship's real state.
<!-- /note -->

## Imports

| line | from | names | target |
|---|---|---|---|
| 1 | `./genome-256.js` | `*` as `G` | [js/genome/genome-256.js](genome-256.js.md) |

## Imported by

- [js/genome/spacer.js](spacer.js.md) — `deriveCapabilities`, `expressContextual`, `createContext`, `lifeStage`, `expectedLifespan`

## Exports

- [`LIFE_STAGES`](#s-LIFE_STAGES) — **no importer in scanned roots**
- [`BIOME_GENES`](#s-BIOME_GENES) — **no importer in scanned roots**
- [`CAPABILITY_SPECS`](#s-CAPABILITY_SPECS) — **no importer in scanned roots**
- [`createContext`](#s-createContext) — used by [js/genome/spacer.js](spacer.js.md)
- [`expressContextual`](#s-expressContextual) — used by [js/genome/spacer.js](spacer.js.md)
- [`recordStress`](#s-recordStress) — **no importer in scanned roots**
- [`dominantStressor`](#s-dominantStressor) — **no importer in scanned roots**
- [`deriveCapabilities`](#s-deriveCapabilities) — used by [js/genome/spacer.js](spacer.js.md)
- [`lifeStage`](#s-lifeStage) — used by [js/genome/spacer.js](spacer.js.md)
- [`expectedLifespan`](#s-expectedLifespan) — used by [js/genome/spacer.js](spacer.js.md)
- [`biomeFitness`](#s-biomeFitness) — **no importer in scanned roots**
- [`thermalComfort`](#s-thermalComfort) — **no importer in scanned roots**
- [`circadianAlertness`](#s-circadianAlertness) — **no importer in scanned roots**

## Effects

_none detected_

## Symbols

### <a id="s-GENES"></a>`GENES`

const · L3–3

<!-- note:GENES -->
<!-- /note -->

### <a id="s-clamp01"></a>`clamp01(v)`

function · L5–5

- called by: [`biomeFitness`](#s-biomeFitness) · [`circadianAlertness`](#s-circadianAlertness) · [`deriveCapabilities`](#s-deriveCapabilities) · [`expressContextual`](#s-expressContextual) ×7 · [`expressContextual>mod`](#s-expressContextual-mod) ×2 · [`recordStress`](#s-recordStress) · [`thermalComfort`](#s-thermalComfort)

<!-- note:clamp01 -->
<!-- /note -->

### <a id="s-lerp"></a>`lerp(a, b, t)`

function · L6–6

- called by: [`circadianAlertness`](#s-circadianAlertness) ×2 · [`expectedLifespan`](#s-expectedLifespan) ×2 · [`expressContextual`](#s-expressContextual) ×12 · [`expressContextual>mod`](#s-expressContextual-mod) · [`recordStress`](#s-recordStress) ×2

<!-- note:lerp -->
<!-- /note -->

### <a id="s-LIFE_STAGES"></a>`LIFE_STAGES`

const · **exported** · L8–15

<!-- note:LIFE_STAGES -->
── Life stages ─────────────────────────────────────────────────
Normalised age 0..1 across the individual's own lifespan.
<!-- /note -->

### <a id="s-lifeStage"></a>`lifeStage(t)`

function · **exported** · L17–20

- called by: [`expressContextual`](#s-expressContextual)

<!-- note:lifeStage -->
<!-- /note -->

### <a id="s-expectedLifespan"></a>`expectedLifespan(genome, baseTicks=)`

function · **exported** · L22–26

- calls: [`lerp`](#s-lerp) ×2
- called by: [`buildContext`](../crew/deckmind.js.md#s-buildContext) _js/crew/deckmind.js_

<!-- note:expectedLifespan -->
Expected lifespan in ticks for this genome, given a base species lifespan.
LONGEVITY raises it, AGING_RATE lowers it.
<!-- /note -->

### <a id="s-BIOME_GENES"></a>`BIOME_GENES`

const · **exported** · L28–39

<!-- note:BIOME_GENES -->
── Environment fit ─────────────────────────────────────────────
Maps an environment descriptor onto the adaptation genes that cover it.
<!-- /note -->

### <a id="s-biomeFitness"></a>`biomeFitness(genome, biome)`

function · **exported** · L41–47

- calls: [`clamp01`](#s-clamp01)
- called by: [`expressContextual`](#s-expressContextual)

<!-- note:biomeFitness -->
0..1 — how well this genome suits the biome. 0.5 is neutral.
<!-- /note -->

### <a id="s-thermalComfort"></a>`thermalComfort(genome, temp)`

function · **exported** · L49–54

- calls: [`clamp01`](#s-clamp01)
- called by: [`expressContextual`](#s-expressContextual)

<!-- note:thermalComfort -->
Thermal comfort 0..1. temp is -1 (lethal cold) .. 0 (ideal) .. 1 (lethal heat).
THERMAL_TOLERANCE widens the comfortable band; polar/arid adapt shift it.
<!-- /note -->

### <a id="s-circadianAlertness"></a>`circadianAlertness(genome, timeOfDay)`

function · **exported** · L56–62

- calls: [`clamp01`](#s-clamp01) · [`lerp`](#s-lerp) ×2
- called by: [`expressContextual`](#s-expressContextual)

<!-- note:circadianAlertness -->
Circadian alertness 0..1 for timeOfDay 0..1 (0 = midnight).

- L57 · `const phase = genome[GENES.CIRCADIAN_PHASE];` — 0 = nocturnal, 1 = diurnal
- L58 · `const rigidity = genome[GENES.CIRCADIAN_RIGIDITY];` — how hard the clock bites
- L59 · `const daylight = 0.5 - 0.5 * Math.cos(2 * Math.PI * timeOfDay);` — 0 at midnight, 1 at noon
<!-- /note -->

### <a id="s-createContext"></a>`createContext(init=)`

function · **exported** · L64–73

- called by: [`buildContext`](../crew/deckmind.js.md#s-buildContext) _js/crew/deckmind.js_ · [`expressContextual`](#s-expressContextual) · [`phenotype`](spacer.js.md#s-phenotype) _js/genome/spacer.js_

<!-- note:createContext -->
── Context object ──────────────────────────────────────────────

@param {Object} [init]
@param {number} [init.ageTicks]
@param {number} [init.lifespanTicks]
@param {number} [init.injury]     0..1 accumulated structural damage
@param {number} [init.fatigue]    0..1
@param {number} [init.malnutrition] 0..1
@param {string} [init.biome]
@param {number} [init.temp]       -1..1
@param {number} [init.timeOfDay]  0..1
@param {number} [init.season]     0..1
@param {number} [init.altitude]   0..1
@param {number} [init.ambientMana] 0..1
@param {number} [init.corruptionField] 0..1

- L70 · `stressLoad: 0,` — running epigenetic load, updated by recordStress()
<!-- /note -->

### <a id="s-recordStress"></a>`recordStress(genome, ctx, amount)`

function · **exported** · L75–82

- calls: [`clamp01`](#s-clamp01) · [`lerp`](#s-lerp) ×2

<!-- note:recordStress -->
Feed lived experience back into the context. Repeated stress leaves a
mark whose persistence is set by EPIGENETIC_MEMORY, and whose decay is
set by EPIGENETIC_STABILITY / EPIGENETIC_RESET.
<!-- /note -->

### <a id="s-expressContextual"></a>`expressContextual(genome, entityTypeId, ctx=)`

function · **exported** · L84–160

- calls: [`biomeFitness`](#s-biomeFitness) · [`circadianAlertness`](#s-circadianAlertness) · [`clamp01`](#s-clamp01) ×7 · [`createContext`](#s-createContext) · [`expressContextual>mod`](#s-expressContextual-mod) ×12 · [`lerp`](#s-lerp) ×12 · [`lifeStage`](#s-lifeStage) · [`thermalComfort`](#s-thermalComfort) · [`expressGenome`](genome-256.js.md#s-expressGenome) _js/genome/genome-256.js_
- called by: [`phenotype`](spacer.js.md#s-phenotype) _js/genome/spacer.js_

<!-- note:expressContextual -->
Full contextual phenotype. Starts from GenomeEngine.expressGenome()
and applies the modifiers, then reports each modifier separately so a
decision trace can cite WHY a stat is what it is.

@returns {Object} phenotype + { stage, modifiers, ceilings }

- L89 · `const plasticity = lerp(0.25, 1.0, genome[GENES.PLASTICITY_GLOBAL]);` — PLASTICITY_GLOBAL decides how much context is allowed to move a trait.
  Low plasticity = the genome wins; high = the environment wins.
- L92 · `const painLoad = ctx.injury * lerp(1.25, 0.45, genome[GENES.PAIN_THRESHOLD]);` — Injury: PAIN_THRESHOLD and INFLAMMATION_CTRL blunt it, SCAR_TISSUE
  makes old damage permanent rather than recoverable.
- L135 · `strength: mod(base.strength, physFactor),` — physical
- L141 · `intellect: mod(base.intellect, cogFactor),` — mind
- L144 · `sociability: mod(base.sociability, socFactor),` — social
- L146 · `magicCapacity: mod(base.magicCapacity, lerp(0.7, 1.25, ctx.ambientMana)),` — magical — ambient field feeds capacity
- L148 · `stage: stage.id,` — context readouts
<!-- /note -->

#### <a id="s-expressContextual-mod"></a>`expressContextual>mod(v, factor)`

function · L114–114

- calls: [`clamp01`](#s-clamp01) ×2 · [`lerp`](#s-lerp)
- called by: [`expressContextual`](#s-expressContextual) ×12

<!-- note:expressContextual>mod -->
Apply. `mod` blends toward the modified value by plasticity so a
low-plasticity creature is stubbornly itself under pressure.
<!-- /note -->

### <a id="s-CAPABILITY_SPECS"></a>`CAPABILITY_SPECS`

const · **exported** · L162–182

<!-- note:CAPABILITY_SPECS -->
── Capabilities ────────────────────────────────────────────────
A decision graph that assumes a mobile animal cannot serve a golem, a
fungus or a scholar. Capabilities are derived from which genes the entity
type actually activates plus how strongly they are expressed, and the graph
gates whole domains on them. This is what makes one graph universal instead
of ten species-specific ones.

- L163 · `mobile:      { requires: ['AGILITY_A'], genes: ['AGILITY_A', 'SPEED_SUSTAIN', 'FLEE_SPEED'` — requires:    every listed gene must be ACTIVE for this entity type
  requiresAny: at least one listed gene must be active
  genes:       what the expression score is averaged over
  threshold:   minimum expression once presence is satisfied
<!-- /note -->

### <a id="s-deriveCapabilities"></a>`deriveCapabilities(genome, entityTypeId)`

function · **exported** · L184–211

- calls: [`clamp01`](#s-clamp01) · [`deriveCapabilities>active`](#s-deriveCapabilities-active) · [`activeMask`](genome-256.js.md#s-activeMask) _js/genome/genome-256.js_
- called by: [`capabilities`](spacer.js.md#s-capabilities) _js/genome/spacer.js_

<!-- note:deriveCapabilities -->
Derive what this entity is physically and cognitively able to attempt.
A gene that the entity type does not activate contributes nothing, so a
plant is never dexterous and a construct is never metabolic regardless of
what its gene values happen to be.

@returns {Object} { mobile:bool, ..., scores:{id:0..1}, tier:string }

- L203 · `out.crafter = out.sapient && out.dexterous;` — Derived composites the graph gates whole domains on.
- L206 · `out.tier = out.crafter && out.verbal ? 'cultural'` — Behavioural tier — how far up the graph this entity can reach at all.
<!-- /note -->

#### <a id="s-deriveCapabilities-active"></a>`deriveCapabilities>active(name)`

function · L186–186

- called by: [`deriveCapabilities`](#s-deriveCapabilities)

<!-- note:deriveCapabilities>active -->
<!-- /note -->

### <a id="s-dominantStressor"></a>`dominantStressor(phenotype)`

function · **exported** · L213–228

<!-- note:dominantStressor -->
Which contextual modifier is currently hurting this agent most.
Used by the decision trace to answer "what made me take this action".
@returns {{ key:string, severity:number, label:string }|null}
<!-- /note -->
