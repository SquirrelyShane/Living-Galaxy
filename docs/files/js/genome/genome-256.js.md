# js/genome/genome-256.js

[index](../../../README.md) · 870 lines · 64 symbols · 0 imports · 3 importers

## About

<!-- note:@file -->
Living Galaxy — GENOME ENGINE (256-gene core), ported verbatim from the
genome-agent project (v2.2) and rewrapped as an ES module. No behavioural
change: the same seed produces the same genome here as it does there, so a
genome written by either project decodes in the other.

Living Galaxy registers its own `spacer` entity type on top of this — see
js/genome/spacer.js. Nothing in this file knows about the game.
<!-- /note -->

## Imports

_none_

## Imported by

- [js/genome/context.js](context.js.md) — `*`
- [js/genome/spacer.js](spacer.js.md) — `*`
- test/genome.test.mjs _(outside js/)_ — `G`

## Exports

- [`GENES`](#s-GENES) — used by [js/genome/context.js](context.js.md), [js/genome/spacer.js](spacer.js.md)
- [`GENE_NAMES`](#s-GENE_NAMES) — used by [js/genome/context.js](context.js.md), [js/genome/spacer.js](spacer.js.md)
- [`ENTITY_TYPES`](#s-ENTITY_TYPES) — used by [js/genome/context.js](context.js.md), [js/genome/spacer.js](spacer.js.md)
- [`GENE_CATEGORIES`](#s-GENE_CATEGORIES) — used by [js/genome/context.js](context.js.md), [js/genome/spacer.js](spacer.js.md)
- [`GENE_FAMILIES`](#s-GENE_FAMILIES) — used by [js/genome/context.js](context.js.md), [js/genome/spacer.js](spacer.js.md)
- [`SPECIES_PROFILES`](#s-SPECIES_PROFILES) — used by [js/genome/context.js](context.js.md), [js/genome/spacer.js](spacer.js.md)
- [`GENOME_LEN`](#s-GENOME_LEN) — used by [js/genome/context.js](context.js.md), [js/genome/spacer.js](spacer.js.md)
- [`NULL_GENE`](#s-NULL_GENE) — used by [js/genome/context.js](context.js.md), [js/genome/spacer.js](spacer.js.md)
- [`GENOME_FORMAT_VERSION`](#s-GENOME_FORMAT_VERSION) — used by [js/genome/context.js](context.js.md), [js/genome/spacer.js](spacer.js.md)
- [`makeRNG`](#s-makeRNG) — used by [js/genome/context.js](context.js.md), [js/genome/spacer.js](spacer.js.md)
- [`hashSeed`](#s-hashSeed) — used by [js/genome/context.js](context.js.md), [js/genome/spacer.js](spacer.js.md)
- [`drawTrait`](#s-drawTrait) — used by [js/genome/context.js](context.js.md), [js/genome/spacer.js](spacer.js.md)
- [`createBlankGenome`](#s-createBlankGenome) — used by [js/genome/context.js](context.js.md), [js/genome/spacer.js](spacer.js.md)
- [`createGenome`](#s-createGenome) — used by [js/genome/context.js](context.js.md), [js/genome/spacer.js](spacer.js.md)
- [`createRandomGenome`](#s-createRandomGenome) — used by [js/genome/context.js](context.js.md), [js/genome/spacer.js](spacer.js.md)
- [`crossover`](#s-crossover) — used by [js/genome/context.js](context.js.md), [js/genome/spacer.js](spacer.js.md)
- [`mutate`](#s-mutate) — used by [js/genome/context.js](context.js.md), [js/genome/spacer.js](spacer.js.md)
- [`getEntityType`](#s-getEntityType) — used by [js/genome/context.js](context.js.md), [js/genome/spacer.js](spacer.js.md)
- [`activeMask`](#s-activeMask) — used by [js/genome/context.js](context.js.md), [js/genome/spacer.js](spacer.js.md)
- [`buildActiveMask`](#s-buildActiveMask) — used by [js/genome/context.js](context.js.md), [js/genome/spacer.js](spacer.js.md)
- [`categoryOf`](#s-categoryOf) — used by [js/genome/context.js](context.js.md), [js/genome/spacer.js](spacer.js.md)
- [`registerEntityType`](#s-registerEntityType) — used by [js/genome/context.js](context.js.md), [js/genome/spacer.js](spacer.js.md)
- [`unregisterEntityType`](#s-unregisterEntityType) — used by [js/genome/context.js](context.js.md), [js/genome/spacer.js](spacer.js.md)
- [`listEntityTypes`](#s-listEntityTypes) — used by [js/genome/context.js](context.js.md), [js/genome/spacer.js](spacer.js.md)
- [`GenomeError`](#s-GenomeError) — used by [js/genome/context.js](context.js.md), [js/genome/spacer.js](spacer.js.md)
- [`deriveSeed`](#s-deriveSeed) — used by [js/genome/context.js](context.js.md), [js/genome/spacer.js](spacer.js.md)
- [`toGenome`](#s-toGenome) — used by [js/genome/context.js](context.js.md), [js/genome/spacer.js](spacer.js.md)
- [`cloneGenome`](#s-cloneGenome) — used by [js/genome/context.js](context.js.md), [js/genome/spacer.js](spacer.js.md)
- [`createGenomeInto`](#s-createGenomeInto) — used by [js/genome/context.js](context.js.md), [js/genome/spacer.js](spacer.js.md)
- [`spawnPopulation`](#s-spawnPopulation) — used by [js/genome/context.js](context.js.md), [js/genome/spacer.js](spacer.js.md)
- [`geneticDistance`](#s-geneticDistance) — used by [js/genome/context.js](context.js.md), [js/genome/spacer.js](spacer.js.md)
- [`relatedness`](#s-relatedness) — used by [js/genome/context.js](context.js.md), [js/genome/spacer.js](spacer.js.md)
- [`stampLineage`](#s-stampLineage) — used by [js/genome/context.js](context.js.md), [js/genome/spacer.js](spacer.js.md)
- [`hybridize`](#s-hybridize) — used by [js/genome/context.js](context.js.md), [js/genome/spacer.js](spacer.js.md)
- [`registerMigration`](#s-registerMigration) — used by [js/genome/context.js](context.js.md), [js/genome/spacer.js](spacer.js.md)
- [`loadGenome`](#s-loadGenome) — used by [js/genome/context.js](context.js.md), [js/genome/spacer.js](spacer.js.md)
- [`encodeGenome`](#s-encodeGenome) — used by [js/genome/context.js](context.js.md), [js/genome/spacer.js](spacer.js.md)
- [`decodeGenome`](#s-decodeGenome) — used by [js/genome/context.js](context.js.md), [js/genome/spacer.js](spacer.js.md)
- [`genomeFingerprint`](#s-genomeFingerprint) — used by [js/genome/context.js](context.js.md), [js/genome/spacer.js](spacer.js.md)
- [`validateGenome`](#s-validateGenome) — used by [js/genome/context.js](context.js.md), [js/genome/spacer.js](spacer.js.md)
- [`scorePolygenic`](#s-scorePolygenic) — used by [js/genome/context.js](context.js.md), [js/genome/spacer.js](spacer.js.md)
- [`scoreCategory`](#s-scoreCategory) — used by [js/genome/context.js](context.js.md), [js/genome/spacer.js](spacer.js.md)
- [`expressGenome`](#s-expressGenome) — used by [js/genome/context.js](context.js.md), [js/genome/spacer.js](spacer.js.md)
- [`attachTraits`](#s-attachTraits) — used by [js/genome/context.js](context.js.md), [js/genome/spacer.js](spacer.js.md)
- [`traitInfo`](#s-traitInfo) — used by [js/genome/context.js](context.js.md), [js/genome/spacer.js](spacer.js.md)
- [`traitReport`](#s-traitReport) — used by [js/genome/context.js](context.js.md), [js/genome/spacer.js](spacer.js.md)
- [`getGenesByCategory`](#s-getGenesByCategory) — used by [js/genome/context.js](context.js.md), [js/genome/spacer.js](spacer.js.md)
- `default` · Identifier — used by [js/genome/context.js](context.js.md), [js/genome/spacer.js](spacer.js.md)
- [`GenomeEngine`](#s-GenomeEngine) — used by [js/genome/context.js](context.js.md), [js/genome/spacer.js](spacer.js.md)

## Effects

_none detected_

## Symbols

### <a id="s-hashSeed"></a>`hashSeed(str)`

function · **exported** · L1–9

- called by: [`makeRNG`](#s-makeRNG)

<!-- note:hashSeed -->
================================================================
0. SEEDED RNG — deterministic, portable, no dependencies
================================================================

FNV-ish string -> 32-bit seed. hashSeed('orc-chief-01') -> 2748103521
<!-- /note -->

### <a id="s-makeRNG"></a>`makeRNG(seed)`

function · **exported** · L11–20

- calls: [`hashSeed`](#s-hashSeed)
- called by: [`createGenome`](#s-createGenome) · [`createGenomeInto`](#s-createGenomeInto) · [`crossover`](#s-crossover) · [`hybridize`](#s-hybridize) · [`mutate`](#s-mutate)

<!-- note:makeRNG -->
mulberry32 — 32-bit PRNG. Fast, good distribution, 2^32 period.
@param {number|string} seed
@returns {function(): number} rng() -> [0,1)
<!-- /note -->

### <a id="s-drawTrait"></a>`drawTrait(rng, mean=, spread=)`

function · **exported** · L22–26

- called by: [`createGenome`](#s-createGenome) · [`createGenomeInto`](#s-createGenomeInto)

<!-- note:drawTrait -->
Bounded quasi-normal draw. Mean-centred, never clamps (no pile-up at 0/1).
spread 0 -> exactly mean; spread 1 -> near-uniform.
@param {function} rng
@param {number} mean 0..1
@param {number} spread 0..1

- L23 · `const bell = (rng() + rng() + rng()) / 3;` — average of 3 uniforms ~= bell curve on [0,1], mean 0.5
<!-- /note -->

### <a id="s-ENTITY_TYPES_RAW"></a>`ENTITY_TYPES_RAW`

const · L28–121

<!-- note:ENTITY_TYPES_RAW -->
================================================================
1. ENTITY TYPE FLAGS — Which gene ranges each entity uses
   NOTE: geneCount is computed at load time from activeRanges.
   v2.0 had 9 of 10 hand-typed counts wrong (e.g. monster said 224,
   its ranges actually cover all 256).
================================================================

- L32 · `activeRanges: [` — v2.0 claimed 224 but listed every range. Trimmed the genuinely
  non-monster slots (microbiome, some reproductive strategy) so the
  type is actually distinct from HUMANOID.
<!-- /note -->

### <a id="s-GENES"></a>`GENES`

const · **exported** · L123–226

<!-- note:GENES -->
================================================================
2. GENE INDEX ENUM — 256 GENES
================================================================

- L124 · `ENDURANCE_A: 0, ENDURANCE_B: 1, ENDURANCE_C: 2,` — ── 1. CORE PHYSICAL PERFORMANCE (0–11) ─────────────────────────
- L129 · `IMMUNITY_A: 12, IMMUNITY_B: 13, IMMUNITY_C: 14,` — ── 2. IMMUNE & METABOLIC HEALTH (12–17) ────────────────────────
- L132 · `RISK: 18, CURIOSITY: 19, SOCIAL: 20, AGGRESSION: 21, DISCIPLINE: 22,` — ── 3. PERSONALITY & BEHAVIORAL (18–22) ─────────────────────────
- L134 · `LEARNING_RATE: 23, MEMORY_CAP: 24, PATTERN_RECOG: 25,` — ── 4. BRAIN / LEARNING MODIFIERS (23–25) ───────────────────────
- L136 · `HEIGHT_A: 26, HEIGHT_B: 27, FRAME: 28, BMI: 29,` — ── 5. PHYSICAL PHENOTYPE & MORPHOLOGY (26–29) ──────────────────
- L138 · `SKIN: 30, HAIR: 31, EYES: 32,` — ── 6. APPEARANCE & SIGNALING (30–32) ───────────────────────────
- L140 · `FERTILITY: 33, LONGEVITY: 34, MUTATION_RATE: 35,` — ── 7. EVOLUTIONARY & REPRODUCTIVE (33–35) ──────────────────────
- L142 · `RECESSIVE_0: 36, RECESSIVE_1: 37, RECESSIVE_2: 38,` — ── 8. HIDDEN / RECESSIVE / CARRIER (36–38) ─────────────────────
- L144 · `STRESS_RESPONSE: 39, ADAPTABILITY: 40, INSTABILITY: 41,` — ── 9. EPIGENETIC & REGULATORY (39–41) ──────────────────────────
- L146 · `SENSORY_VISION: 42, SENSORY_HEARING: 43, SENSORY_OLFACTION: 44,` — ── 10. SENSORY INTERFACE (42–50) ───────────────────────────────
- L150 · `CREATIVITY: 51, EMPATHY: 52, FOCUS: 53, STRATEGY: 54, INTUITION: 55,` — ── 11. ADVANCED COGNITION & CREATIVITY (51–55) ─────────────────
- L152 · `MATING_PREFERENCE: 56, PARENTAL_CARE: 57, TERRITORIALITY: 58, COOPERATION: 59,` — ── 12. SOCIAL & REPRODUCTIVE BEHAVIOR (56–59) ──────────────────
- L154 · `PLASTICITY_GLOBAL: 60, EPIGENETIC_MEMORY: 61, DOMINANCE_MOD: 62, EXPRESSION_RATE: 63,` — ── 13. REGULATORY & META-GENES (60–63) ─────────────────────────
- L156 · `TESTOSTERONE: 64, ESTROGEN: 65, CORTISOL: 66, INSULIN: 67,` — ── 14. HORMONAL & ENDOCRINE (64–71) ────────────────────────────
- L159 · `EMBRYONIC_GROWTH: 72, PUBERTY_TIMING: 73, AGING_RATE: 74, REGENERATION: 75,` — ── 15. DEVELOPMENTAL & ONTOGENY (72–79) ────────────────────────
- L162 · `GUT_MICROBIOME: 80, IMMUNE_MODULATION: 81, TOXIN_BREAKDOWN: 82, VITAMIN_SYNTHESIS: 83,` — ── 16. MICROBIOME & SYMBIONT (80–87) ───────────────────────────
- L165 · `THERMAL_TOLERANCE: 88, ALTITUDE_ADAPT: 89, AQUATIC_ADAPT: 90, ARID_ADAPT: 91,` — ── 17. ENVIRONMENTAL ADAPTATION (88–95) ────────────────────────
- L168 · `ABSTRACT_THINK: 96, EMOTIONAL_IQ: 97, SPATIAL_IQ: 98, VERBAL_IQ: 99,` — ── 18. ADVANCED COGNITION SUB-TYPES (96–103) ───────────────────
- L171 · `DOMINANCE: 104, SUBMISSIVENESS: 105, ALTRUISM: 106, KIN_RECOGNITION: 107,` — ── 19. SOCIAL HIERARCHY & GROUP DYNAMICS (104–111) ─────────────
- L174 · `MONOGAMY_BIAS: 112, POLYGAMY_BIAS: 113, PARENTAL_INVEST: 114, MATE_CHOICE: 115,` — ── 20. REPRODUCTIVE STRATEGY (112–119) ─────────────────────────
- L177 · `GLOBAL_MUTATION: 120, EPIGENETIC_STABILITY: 121, VERSION_CONTROL: 122,` — ── 21. META-REGULATORY (120–127) ───────────────────────────────
- L178 · `CHECKSUM: 123,` — RESERVED — integrity moved to the encode envelope; free slot
- L181 · `ENDURANCE_D: 128, ENDURANCE_E: 129, STRENGTH_D: 130, STRENGTH_E: 131,` — ── 22. EXPANDED PHYSICAL PERFORMANCE (128–135) ─────────────────
- L184 · `PAIN_THRESHOLD: 136, PAIN_SENSITIVITY: 137, FATIGUE_RESIST: 138, RECOVERY_RATE: 139,` — ── 23. PAIN, FATIGUE & RECOVERY (136–143) ──────────────────────
- L187 · `CIRCADIAN_PHASE: 144, CIRCADIAN_RIGIDITY: 145, SEASONAL_RESPONSE: 146, HIBERNATION_DEPTH:` — ── 24. CIRCADIAN & TEMPORAL BIOLOGY (144–151) ──────────────────
- L190 · `VOCAL_RANGE: 152, VOCAL_POWER: 153, VOCAL_COMPLEXITY: 154, MIMICRY: 155,` — ── 25. VOCALIZATION & COMMUNICATION (152–159) ──────────────────
- L193 · `BITE_FORCE: 160, CLAW_SHARPNESS: 161, VENOM_POTENCY: 162, ARMOR_DENSITY: 163,` — ── 26. COMBAT & THREAT RESPONSE (160–167) ──────────────────────
- L196 · `HUNGER_DRIVE: 168, THIRST_DRIVE: 169, SHELTER_DRIVE: 170, HOARDING: 171,` — ── 27. INSTINCT & SURVIVAL DRIVES (168–175) ────────────────────
- L199 · `HOME_RANGE: 176, PATH_MEMORY: 177, LANDMARK_RECOG: 178, DEAD_RECKONING: 179,` — ── 28. NAVIGATION & SPATIAL MEMORY (176–183) ───────────────────
- L202 · `MANA_POOL: 184, MANA_REGEN: 185, MANA_EFFICIENCY: 186, AURA_STRENGTH: 187,` — ── 29. SUPERNATURAL & METAPHYSICAL (184–199) ───────────────────
- L207 · `DIET_BREADTH: 200, CARNIVORE_BIAS: 201, HERBIVORE_BIAS: 202, OMNIVORE_FLEX: 203,` — ── 30. DIETARY & DIGESTIVE SPECIALIZATION (200–215) ────────────
- L212 · `FIRE_AFFINITY: 216, WATER_AFFINITY: 217, EARTH_AFFINITY: 218, AIR_AFFINITY: 219,` — ── 31. ELEMENTAL & MAGICAL AFFINITY (216–231) ──────────────────
- L217 · `BONE_DENSITY: 232, BONE_HOLLOW: 233, CARTILAGE_RATIO: 234, EXOSKELETON: 235,` — ── 32. SKELETAL & STRUCTURAL SPECIALIZATION (232–247) ──────────
- L222 · `CORRUPTION_RESIST: 248, CORRUPTION_SPREAD: 249, MUTATION_VOLATIL: 250, CHIMERA_POTENTIAL:` — ── 33. CORRUPTION, MUTATION & PLANAR (248–254) ─────────────────
- L225 · `GENDER: 255,` — ── 34. GENDER / SEX DETERMINATION (255) ────────────────────────
<!-- /note -->

### <a id="s-GENE_NAMES"></a>`GENE_NAMES`

const · **exported** · L228–230

<!-- note:GENE_NAMES -->
<!-- /note -->

### <a id="s-GENE_CATEGORIES"></a>`GENE_CATEGORIES`

const · **exported** · L232–267

<!-- note:GENE_CATEGORIES -->
================================================================
3. GENE CATEGORIES — the ONE taxonomy. UI, filtering, stat screens.
================================================================
<!-- /note -->

### <a id="s-_CAT_OF"></a>`_CAT_OF`

const · L269–269

<!-- note:_CAT_OF -->
index -> category key, built once
<!-- /note -->

### <a id="s-i"></a>`i`

const · L271–271

<!-- note:i -->
<!-- /note -->

### <a id="s-categoryOf"></a>`categoryOf(index)`

function · **exported** · L274–277

- called by: [`traitInfo`](#s-traitInfo)

<!-- note:categoryOf -->
@returns {{key:string,label:string,color:string}}
<!-- /note -->

### <a id="s-_MASKS"></a>`_MASKS`

const · L279–279

<!-- note:_MASKS -->
================================================================
4. DERIVED TABLES — masks, counts, polygenic families (built once)
================================================================
<!-- /note -->

### <a id="s-_maskFromRanges"></a>`_maskFromRanges(ranges)`

function · L281–285

- called by: [`ENTITY_TYPES`](#s-ENTITY_TYPES) · [`registerEntityType`](#s-registerEntityType)

<!-- note:_maskFromRanges -->
<!-- /note -->

### <a id="s-ENTITY_TYPES"></a>`ENTITY_TYPES`

const · **exported** · L287–295

- calls: [`_maskFromRanges`](#s-_maskFromRanges)

<!-- note:ENTITY_TYPES -->
<!-- /note -->

### <a id="s-_BY_ID"></a>`_BY_ID`

const · L297–297

<!-- note:_BY_ID -->
mutable: registerEntityType() adds to this at runtime
<!-- /note -->

### <a id="s-GenomeError"></a>`GenomeError`

class · **exported** · L299–306

- called by: [`createGenomeInto`](#s-createGenomeInto) · [`getEntityType`](#s-getEntityType) · [`hybridize`](#s-hybridize) · [`loadGenome`](#s-loadGenome) · [`registerEntityType`](#s-registerEntityType) ×4 · [`toGenome`](#s-toGenome)

<!-- note:GenomeError -->
<!-- /note -->

#### <a id="s-GenomeError-constructor"></a>`GenomeError.constructor(message, code, detail)`

method · L300–305

<!-- note:GenomeError.constructor -->
<!-- /note -->

### <a id="s-getEntityType"></a>`getEntityType(entityTypeId)`

function · **exported** · L308–312

- calls: [`new GenomeError`](#s-GenomeError)
- called by: [`activeMask`](#s-activeMask) · [`encodeGenome`](#s-encodeGenome) · [`expressGenome`](#s-expressGenome) · [`hybridize`](#s-hybridize) ×2

<!-- note:getEntityType -->
<!-- /note -->

### <a id="s-registerEntityType"></a>`registerEntityType(def, overwrite=)`

function · **exported** · L314–338

- calls: [`_maskFromRanges`](#s-_maskFromRanges) · [`new GenomeError`](#s-GenomeError) ×4
- called by: [`hybridize`](#s-hybridize) ×2 · [`@file`](spacer.js.md#) _js/genome/spacer.js_ ×2

<!-- note:registerEntityType -->
Register a new entity type at runtime (hybrids, mods, campaign-specific races).
v2.1 had a closed set of 10 — anything outside it threw. Production needs this open.
@param {{id:string,label?:string,activeRanges:Array<[number,number]>,description?:string}} def
@param {boolean} [overwrite=false]
<!-- /note -->

### <a id="s-unregisterEntityType"></a>`unregisterEntityType(id)`

function · **exported** · L340–343

<!-- note:unregisterEntityType -->
<!-- /note -->

### <a id="s-listEntityTypes"></a>`listEntityTypes()`

function · **exported** · L345–345

<!-- note:listEntityTypes -->
<!-- /note -->

### <a id="s-activeMask"></a>`activeMask(entityTypeId)`

function · **exported** · L347–350

- calls: [`getEntityType`](#s-getEntityType)
- called by: [`deriveCapabilities`](context.js.md#s-deriveCapabilities) _js/genome/context.js_ · [`buildActiveMask`](#s-buildActiveMask) · [`createBlankGenome`](#s-createBlankGenome) · [`createGenome`](#s-createGenome) · [`createGenomeInto`](#s-createGenomeInto) · [`crossover`](#s-crossover) · [`decodeGenome`](#s-decodeGenome) · [`geneticDistance`](#s-geneticDistance) · [`getGenesByCategory`](#s-getGenesByCategory) · [`hybridize`](#s-hybridize) ×2 · [`mutate`](#s-mutate) · [`scoreCategory`](#s-scoreCategory) · [`scorePolygenic`](#s-scorePolygenic) · [`traitReport`](#s-traitReport) · [`validateGenome`](#s-validateGenome) · [`activeIndices`](spacer.js.md#s-activeIndices) _js/genome/spacer.js_

<!-- note:activeMask -->
Shared, frozen-by-convention active mask. DO NOT MUTATE the returned array.
Use buildActiveMask() if you need an owned copy.
<!-- /note -->

### <a id="s-buildActiveMask"></a>`buildActiveMask(entityTypeId)`

function · **exported** · L352–354

- calls: [`activeMask`](#s-activeMask)

<!-- note:buildActiveMask -->
Owned copy of the active mask (safe to mutate).
<!-- /note -->

### <a id="s-GENE_FAMILIES"></a>`GENE_FAMILIES`

const · **exported** · L356–363

<!-- note:GENE_FAMILIES -->
Polygenic families: STRENGTH -> [3,4,5,130,131] etc. Built from _A.._Z suffixes.
<!-- /note -->

### <a id="s-SPECIES_PROFILES"></a>`SPECIES_PROFILES`

const · **exported** · L365–412

<!-- note:SPECIES_PROFILES -->
================================================================
5. SPECIES BIAS PROFILES
   Uniform random genes make every entity statistically identical
   mush. A profile shifts the mean/spread of specific genes so an
   avian actually reads avian. Sparse — unlisted genes use default.
   { geneIndex: [mean, spread] }
================================================================
<!-- /note -->

### <a id="s-GENOME_LEN"></a>`GENOME_LEN`

const · **exported** · L414–414

<!-- note:GENOME_LEN -->
================================================================
6. GENOME CREATION
================================================================
<!-- /note -->

### <a id="s-NULL_GENE"></a>`NULL_GENE`

const · **exported** · L415–415

<!-- note:NULL_GENE -->
Value written into inactive slots. Never use value===0 to test activity — use the mask.
<!-- /note -->

### <a id="s-createBlankGenome"></a>`createBlankGenome(entityTypeId)`

function · **exported** · L417–423

- calls: [`activeMask`](#s-activeMask)

<!-- note:createBlankGenome -->
Blank genome. Active genes -> 0.5 (neutral), inactive -> NULL_GENE.
v2.0 filled all 256 with 0.5, which disagreed with createRandomGenome's
"inactive = 0" convention and made blank genomes non-round-trippable.
@param {string} [entityTypeId] - omit for an all-0.5 scratch buffer
@returns {Float32Array}
<!-- /note -->

### <a id="s-createGenome"></a>`createGenome(entityTypeId, seed, opts=)`

function · **exported** · L425–446

- calls: [`activeMask`](#s-activeMask) · [`drawTrait`](#s-drawTrait) · [`makeRNG`](#s-makeRNG)
- called by: [`createRandomGenome`](#s-createRandomGenome) · [`spawnPopulation`](#s-spawnPopulation) · [`createSpacer`](spacer.js.md#s-createSpacer) _js/genome/spacer.js_

<!-- note:createGenome -->
Create a genome for an entity type. Deterministic when given a seed.
@param {string} entityTypeId
@param {number|string} [seed] - omit for Math.random-backed non-determinism
@param {Object} [opts]
@param {Object} [opts.profile] - override SPECIES_PROFILES entry
@param {Object} [opts.overrides] - { [geneIndex]: value } forced post-roll
@returns {Float32Array}
<!-- /note -->

### <a id="s-createRandomGenome"></a>`createRandomGenome(entityTypeId)`

function · **exported** · L448–450

- calls: [`createGenome`](#s-createGenome)

<!-- note:createRandomGenome -->
Back-compat alias for v2.0 call sites. Unseeded, uniform-ish.
<!-- /note -->

### <a id="s-crossover"></a>`crossover(parentA, parentB, entityTypeId, opts=)`

function · **exported** · L452–488

- calls: [`activeMask`](#s-activeMask) · [`makeRNG`](#s-makeRNG) · [`stampLineage`](#s-stampLineage)
- called by: [`breed`](spacer.js.md#s-breed) _js/genome/spacer.js_

<!-- note:crossover -->
================================================================
7. BREEDING — block recombination, dominance, seeded mutation
================================================================

Crossover two parents. Deterministic when seeded.

v2.0 picked each gene independently 50/50, so lineages never formed
stable family resemblance. v2.1 uses contiguous blocks (chromosome
segments) with crossover points, and actually consumes DOMINANCE_MOD.

@param {Float32Array} parentA
@param {Float32Array} parentB
@param {string} entityTypeId
@param {Object} [opts]
@param {number|string} [opts.seed]
@param {number} [opts.mutationScale=0.05] - base mutation sigma
@param {number} [opts.blockLength=16] - avg genes per inherited block
@returns {Float32Array}

- L453 · `if (typeof opts === 'number') opts = { mutationScale: opts };` — tolerate v2.0 signature: crossover(a, b, type, 0.05)
- L465 · `const dominance = (parentA[GENES.DOMINANCE_MOD] + parentB[GENES.DOMINANCE_MOD]) / 2;` — DOMINANCE_MOD: 0.5 = pure Mendelian coin-flip. Higher = the stronger
  allele wins more often, producing visibly "dominant" bloodlines.
- L476 · `if (rng() < (dominance - 0.5) * 2) base = a > b ? a : b;` — dominant allele expresses
- L478 · `const u1 = rng() || 1e-10, u2 = rng();` — Box-Muller gaussian mutation
- L481 · `if (v < 0) v = -v;` — reflect instead of clamp — avoids probability mass piling at 0 and 1
<!-- /note -->

### <a id="s-mutate"></a>`mutate(genome, entityTypeId, opts=)`

function · **exported** · L490–505

- calls: [`activeMask`](#s-activeMask) · [`makeRNG`](#s-makeRNG)

<!-- note:mutate -->
Mutate a genome in place-free fashion (returns a new array).
Useful for evolution-strategy loops without a second parent.
<!-- /note -->

### <a id="s-GENOME_FORMAT_VERSION"></a>`GENOME_FORMAT_VERSION`

const · **exported** · L507–507

<!-- note:GENOME_FORMAT_VERSION -->
================================================================
8. SERIALIZATION — 256 genes -> ~348-char base64 string
   Float32Array JSON is ~2.5KB per NPC. Quantized to Uint8 it's
   256 bytes -> 348 base64 chars, URL/localStorage/save-file sized.
   Quantization error is 1/255 (~0.4%), below perceptual relevance.
================================================================
<!-- /note -->

### <a id="s-_B64"></a>`_B64`

const · L508–508

<!-- note:_B64 -->
<!-- /note -->

### <a id="s-_bytesToB64"></a>`_bytesToB64(bytes)`

function · L510–518

- called by: [`encodeGenome`](#s-encodeGenome)

<!-- note:_bytesToB64 -->
<!-- /note -->

### <a id="s-_b64ToBytes"></a>`_b64ToBytes(str)`

function · L520–529

- called by: [`decodeGenome`](#s-decodeGenome)

<!-- note:_b64ToBytes -->
<!-- /note -->

### <a id="s-encodeGenome"></a>`encodeGenome(genome, entityTypeId)`

function · **exported** · L531–538

- calls: [`_bytesToB64`](#s-_bytesToB64) · [`genomeFingerprint`](#s-genomeFingerprint) · [`getEntityType`](#s-getEntityType)

<!-- note:encodeGenome -->
Serialize to a compact string: "1:humanoid:&lt;base64>:&lt;chk>"
@returns {string}
<!-- /note -->

### <a id="s-decodeGenome"></a>`decodeGenome(str, opts=)`

function · **exported** · L540–557

- calls: [`_b64ToBytes`](#s-_b64ToBytes) · [`activeMask`](#s-activeMask) · [`genomeFingerprint`](#s-genomeFingerprint)
- called by: [`loadGenome`](#s-loadGenome) ×2

<!-- note:decodeGenome -->
@param {string} str
@param {Object} [opts] { skipChecksum } — set to load deliberately hand-edited genomes
@returns {{ genome: Float32Array, entityTypeId: string, version: number }}
<!-- /note -->

### <a id="s-genomeFingerprint"></a>`genomeFingerprint(genome)`

function · **exported** · L559–566

- called by: [`decodeGenome`](#s-decodeGenome) · [`encodeGenome`](#s-encodeGenome)

<!-- note:genomeFingerprint -->
================================================================
9. INTEGRITY
   NOTE: v2.0 declared a CHECKSUM gene at index 123 but never wrote it.
   Writing it there is wrong anyway — 123 sits in the META range, which
   8 of the 10 entity types do not activate, and a self-referential gene
   would be inherited/mutated like any other trait. The checksum belongs
   to the serialization envelope, not the gene data. Gene 123 is now a
   RESERVED free slot; repurpose it if you need one.
================================================================

16-bit FNV fingerprint of the quantized genome. Stable across encode/decode.
<!-- /note -->

### <a id="s-validateGenome"></a>`validateGenome(genome, entityTypeId)`

function · **exported** · L568–581

- calls: [`activeMask`](#s-activeMask)

<!-- note:validateGenome -->
Structural validation. Catches corrupt save data before it reaches the sim.
@returns {{ ok: boolean, errors: string[] }}
<!-- /note -->

### <a id="s-scorePolygenic"></a>`scorePolygenic(genome, family, entityTypeId)`

function · **exported** · L583–593

- calls: [`activeMask`](#s-activeMask)
- called by: [`expressGenome>p`](#s-expressGenome-p)

<!-- note:scorePolygenic -->
================================================================
10. SCORING & PHENOTYPE
================================================================

Average a polygenic family. Mask-aware: inactive slots are excluded
rather than counted as 0, which in v2.0 silently halved scores for
non-humanoid types (an insect has STRENGTH_A..C but not D/E).
@param {Float32Array} genome
@param {string} family - e.g. 'ENDURANCE', 'STRENGTH', 'AGILITY', 'INTEL'
@param {string} [entityTypeId]
@returns {number} 0..1
<!-- /note -->

### <a id="s-scoreCategory"></a>`scoreCategory(genome, categoryKey, entityTypeId)`

function · **exported** · L595–605

- calls: [`activeMask`](#s-activeMask)

<!-- note:scoreCategory -->
Average every active gene in a GENE_CATEGORIES key.
<!-- /note -->

### <a id="s-expressGenome"></a>`expressGenome(genome, entityTypeId)`

function · **exported** · L607–642

- calls: [`expressGenome>ex`](#s-expressGenome-ex) ×17 · [`expressGenome>g`](#s-expressGenome-g) ×33 · [`expressGenome>p`](#s-expressGenome-p) ×6 · [`getEntityType`](#s-getEntityType)
- called by: [`expressContextual`](context.js.md#s-expressContextual) _js/genome/context.js_

<!-- note:expressGenome -->
Phenotype layer — raw genes -> stats a game can actually consume.
Without this every downstream project reimplements the same maths.
All outputs 0..1 unless noted.
@returns {Object}

- L611 · `const throttle = 0.5 + g(GENES.EXPRESSION_RATE);` — EXPRESSION_RATE throttles how far traits deviate from neutral
- L616 · `endurance: ex(p('ENDURANCE')),` — core
- L622 · `speed:     ex((g(GENES.SPEED_BURST) * 0.6 + g(GENES.SPEED_SUSTAIN) * 0.4)),` — derived composites
- L627 · `temperament: ex(g(GENES.AGGRESSION) - g(GENES.DISCIPLINE) * 0.5 + 0.25),` — mind / social
- L630 · `magicCapacity: ex((g(GENES.MANA_POOL) + g(GENES.MANA_REGEN) + g(GENES.MANA_EFFICIENCY)) /` — magical
- L632 · `lifespanBias: ex(g(GENES.LONGEVITY) * 0.7 + (1 - g(GENES.AGING_RATE)) * 0.3),` — life history
- L635 · `dominantElement: (() => {` — strongest elemental affinity, handy for VFX/loot tables
<!-- /note -->

#### <a id="s-expressGenome-p"></a>`expressGenome>p(f)`

function · L609–609

- calls: [`scorePolygenic`](#s-scorePolygenic)
- called by: [`expressGenome`](#s-expressGenome) ×6

<!-- note:expressGenome>p -->
<!-- /note -->

#### <a id="s-expressGenome-g"></a>`expressGenome>g(i)`

function · L610–610

- called by: [`expressGenome`](#s-expressGenome) ×33

<!-- note:expressGenome>g -->
<!-- /note -->

#### <a id="s-expressGenome-ex"></a>`expressGenome>ex(v)`

function · L612–612

- called by: [`expressGenome`](#s-expressGenome) ×17

<!-- note:expressGenome>ex -->
<!-- /note -->

### <a id="s-_TRAITS"></a>`_TRAITS`

const · L644–644

<!-- note:_TRAITS -->
================================================================
11. REPORTING / UI HELPERS
    TRAIT_DICTIONARY is optional — load genome-traits-256.js to get
    names, descriptions and analogies. These degrade to gene keys.
================================================================
<!-- /note -->

### <a id="s-attachTraits"></a>`attachTraits(dict)`

function · **exported** · L646–646

<!-- note:attachTraits -->
Attach the optional trait dictionary (called by genome-traits-256.js).
<!-- /note -->

### <a id="s-traitInfo"></a>`traitInfo(index)`

function · **exported** · L648–661

- calls: [`categoryOf`](#s-categoryOf)
- called by: [`getGenesByCategory`](#s-getGenesByCategory) · [`traitReport`](#s-traitReport)

<!-- note:traitInfo -->
<!-- /note -->

### <a id="s-traitReport"></a>`traitReport(genome, entityTypeId, opts=)`

function · **exported** · L663–675

- calls: [`activeMask`](#s-activeMask) · [`traitInfo`](#s-traitInfo)

<!-- note:traitReport -->
Trait report. v2.0 always allocated 256 objects; this filters first.
@param {Object} [opts] { activeOnly=false, categoryKey, minValue }
<!-- /note -->

### <a id="s-getGenesByCategory"></a>`getGenesByCategory(entityTypeId)`

function · **exported** · L677–689

- calls: [`activeMask`](#s-activeMask) · [`traitInfo`](#s-traitInfo)

<!-- note:getGenesByCategory -->
Genes grouped by category for UI rendering.
<!-- /note -->

### <a id="s-deriveSeed"></a>`deriveSeed(...parts)`

function · **exported** · L691–702

- called by: [`spawnPopulation`](#s-spawnPopulation)

<!-- note:deriveSeed -->
================================================================
12. PRODUCTION UTILITIES
    Sub-seed derivation, zero-alloc paths, lineage, hybrids,
    population spawning, format migration.
================================================================

Derive a stable child seed from any number of parts. Lets every
subsystem draw from its own stream — adding a new draw in one place
no longer shifts every downstream roll, which is what makes a seeded
generator actually stable across versions.
deriveSeed('world-7', 'npc', 42) -> uint32
<!-- /note -->

### <a id="s-toGenome"></a>`toGenome(src)`

function · **exported** · L704–710

- calls: [`new GenomeError`](#s-GenomeError)
- called by: [`cloneGenome`](#s-cloneGenome)

<!-- note:toGenome -->
Coerce anything array-like into a validated 256-length Float32Array.
<!-- /note -->

### <a id="s-cloneGenome"></a>`cloneGenome(genome)`

function · **exported** · L712–712

- calls: [`toGenome`](#s-toGenome)

<!-- note:cloneGenome -->
<!-- /note -->

### <a id="s-createGenomeInto"></a>`createGenomeInto(out, entityTypeId, seed, opts=)`

function · **exported** · L714–734

- calls: [`activeMask`](#s-activeMask) · [`drawTrait`](#s-drawTrait) · [`new GenomeError`](#s-GenomeError) · [`makeRNG`](#s-makeRNG)

<!-- note:createGenomeInto -->
Zero-alloc variant for hot loops (population regen, ES training).
<!-- /note -->

### <a id="s-spawnPopulation"></a>`spawnPopulation(entityTypeId, count, seed, opts=)`

function · **exported** · L736–742

- calls: [`createGenome`](#s-createGenome) · [`deriveSeed`](#s-deriveSeed)

<!-- note:spawnPopulation -->
Spawn a reproducible population. Each member gets its own derived
sub-seed, so inserting or removing one member does not reshuffle the rest.
@returns {Float32Array[]}
<!-- /note -->

### <a id="s-geneticDistance"></a>`geneticDistance(a, b, entityTypeId)`

function · **exported** · L744–752

- calls: [`activeMask`](#s-activeMask)
- called by: [`relatedness`](#s-relatedness)

<!-- note:geneticDistance -->
── Lineage ─────────────────────────────────────────────────────

Genetic distance over active genes. 0 = identical, 1 = maximally different.
Cheap enough for inbreeding checks inside a breeding loop.
<!-- /note -->

### <a id="s-relatedness"></a>`relatedness(a, b, entityTypeId)`

function · **exported** · L754–756

- calls: [`geneticDistance`](#s-geneticDistance)
- called by: [`kinship`](spacer.js.md#s-kinship) _js/genome/spacer.js_ · [`speciesBaseline`](spacer.js.md#s-speciesBaseline) _js/genome/spacer.js_

<!-- note:relatedness -->
1 - distance, clamped. Use for kin recognition and inbreeding penalties.
<!-- /note -->

### <a id="s-stampLineage"></a>`stampLineage(child, parentA, parentB, drift=, rng=, mask=)`

function · **exported** · L758–764

- called by: [`crossover`](#s-crossover) · [`hybridize`](#s-hybridize)

<!-- note:stampLineage -->
Blend PHYLO_MARKER so lineages drift measurably over generations
instead of being inherited as an untouched coin-flip. v2.1 declared
the gene and never used it.
<!-- /note -->

### <a id="s-hybridize"></a>`hybridize(a, typeA, b, typeB, opts=)`

function · **exported** · L766–823

- calls: [`activeMask`](#s-activeMask) ×2 · [`new GenomeError`](#s-GenomeError) · [`getEntityType`](#s-getEntityType) ×2 · [`makeRNG`](#s-makeRNG) · [`registerEntityType`](#s-registerEntityType) ×2 · [`stampLineage`](#s-stampLineage)

<!-- note:hybridize -->
── Hybridisation ───────────────────────────────────────────────

Cross two parents of DIFFERENT entity types. v2.1 threw on this even
though CHIMERA_POTENTIAL exists as a gene.

Genes active in both parents are crossed normally. Genes active in only
one parent are inherited from that parent, gated by the pair's average
CHIMERA_POTENTIAL — low chimera means the hybrid mostly loses the
one-sided genes, high chimera means it keeps them.

@param {Float32Array} a
@param {string} typeA
@param {Float32Array} b
@param {string} typeB
@param {Object} [opts] { seed, resultType, register=true, mutationScale, blockLength }
@returns {{ genome: Float32Array, entityTypeId: string, chimera: number }}

- L773 · `const ranges = [];` — Decide the hybrid's own mask first — shared genes always, one-sided
  genes by chimera roll. Deterministic given the seed.
- L803 · `const effectiveMut = mutationScale * (0.5 + mutRate) * (0.5 + globalMut) * (1 + chimera);` — hybrids are genetically noisier — that is the point of them
<!-- /note -->

### <a id="s-_MIGRATIONS"></a>`_MIGRATIONS`

const · L825–826

<!-- note:_MIGRATIONS -->
── Format migration ────────────────────────────────────────────

- L826 · `};` — 0: (payloadBytes) => remappedBytes    // register future upgrades here
<!-- /note -->

### <a id="s-registerMigration"></a>`registerMigration(fromVersion, fn)`

function · **exported** · L828–828

<!-- note:registerMigration -->
Register an upgrade path so old save strings keep loading.
<!-- /note -->

### <a id="s-loadGenome"></a>`loadGenome(str, opts=)`

function · **exported** · L830–836

- calls: [`decodeGenome`](#s-decodeGenome) ×2 · [`new GenomeError`](#s-GenomeError)

<!-- note:loadGenome -->
Decode any supported version, upgrading through registered migrations.
Use this at save-load boundaries instead of decodeGenome directly.
<!-- /note -->

### <a id="s-GenomeEngine"></a>`GenomeEngine`

const · **exported** · L838–852

<!-- note:GenomeEngine -->
================================================================
13. EXPORTS
================================================================

- L839 · `GENES, GENE_NAMES, ENTITY_TYPES, GENE_CATEGORIES, GENE_FAMILIES, SPECIES_PROFILES,` — data
- L842 · `makeRNG, hashSeed, drawTrait,` — rng
- L843 · `createBlankGenome, createGenome, createRandomGenome, crossover, mutate,` — lifecycle
- L844 · `getEntityType, activeMask, buildActiveMask, categoryOf,` — masks / lookup / registry
- L846 · `GenomeError, deriveSeed, toGenome, cloneGenome, createGenomeInto, spawnPopulation,` — production
- L849 · `encodeGenome, decodeGenome, genomeFingerprint, validateGenome,` — io + integrity
- L850 · `scorePolygenic, scoreCategory, expressGenome,` — scoring
- L851 · `attachTraits, traitInfo, traitReport, getGenesByCategory,` — ui
<!-- /note -->

#### <a id="s-GenomeEngine-TRAIT_DICTIONARY"></a>`GenomeEngine.TRAIT_DICTIONARY()`

prop · L841–841

<!-- note:GenomeEngine.TRAIT_DICTIONARY -->
<!-- /note -->
