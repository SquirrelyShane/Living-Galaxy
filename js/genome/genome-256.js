/* Living Galaxy — GENOME ENGINE (256-gene core), ported verbatim from the
 * genome-agent project (v2.2) and rewrapped as an ES module. No behavioural
 * change: the same seed produces the same genome here as it does there, so a
 * genome written by either project decodes in the other.
 *
 * Living Galaxy registers its own `spacer` entity type on top of this — see
 * js/genome/spacer.js. Nothing in this file knows about the game.
 */


// ================================================================
// 0. SEEDED RNG — deterministic, portable, no dependencies
// ================================================================

/** FNV-ish string -> 32-bit seed. hashSeed('orc-chief-01') -> 2748103521 */
function hashSeed(str) {
  let h = 2166136261 >>> 0;
  const s = String(str);
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }
  return h >>> 0;
}

/**
 * mulberry32 — 32-bit PRNG. Fast, good distribution, 2^32 period.
 * @param {number|string} seed
 * @returns {function(): number} rng() -> [0,1)
 */
function makeRNG(seed) {
  let a = (typeof seed === 'number' ? seed : hashSeed(seed)) >>> 0;
  return function rng() {
    a = (a + 0x6D2B79F5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Bounded quasi-normal draw. Mean-centred, never clamps (no pile-up at 0/1).
 * spread 0 -> exactly mean; spread 1 -> near-uniform.
 * @param {function} rng
 * @param {number} mean 0..1
 * @param {number} spread 0..1
 */
function drawTrait(rng, mean = 0.5, spread = 1) {
  // average of 3 uniforms ~= bell curve on [0,1], mean 0.5
  const bell = (rng() + rng() + rng()) / 3;
  const v = mean + (bell - 0.5) * spread * 2;
  return v < 0 ? 0 : v > 1 ? 1 : v;
}

// ================================================================
// 1. ENTITY TYPE FLAGS — Which gene ranges each entity uses
//    NOTE: geneCount is computed at load time from activeRanges.
//    v2.0 had 9 of 10 hand-typed counts wrong (e.g. monster said 224,
//    its ranges actually cover all 256).
// ================================================================
const ENTITY_TYPES_RAW = {
  HUMANOID: {
    id: 'humanoid',
    label: 'Humanoid NPC',
    activeRanges: [[0, 255]],
    description: 'Full sapient being — uses every gene slot',
  },
  ANIMAL: {
    id: 'animal',
    label: 'Animal',
    activeRanges: [
      [0, 17], [26, 29], [30, 32], [33, 35], [36, 41], [42, 50],
      [56, 59], [64, 71], [72, 79], [80, 87], [88, 95], [104, 119],
      [128, 151], [152, 167], [168, 183], [200, 215], [232, 247], [255, 255],
    ],
    description: 'Non-sapient fauna — instinct-driven, no abstract thought or culture',
  },
  MONSTER: {
    id: 'monster',
    label: 'Monster / Mythic Beast',
    // v2.0 claimed 224 but listed every range. Trimmed the genuinely
    // non-monster slots (microbiome, some reproductive strategy) so the
    // type is actually distinct from HUMANOID.
    activeRanges: [
      [0, 63], [64, 79], [88, 95], [96, 119], [120, 127],
      [128, 199], [200, 215], [216, 231], [232, 247], [248, 255],
    ],
    description: 'Mythic, supernatural, or mutated entity — partial sapience, high physical',
  },
  PLANT: {
    id: 'plant',
    label: 'Plant / Fungal',
    activeRanges: [
      [12, 17], [33, 35], [36, 41], [72, 79], [80, 87], [88, 95],
      [200, 215], [232, 247], [255, 255],
    ],
    description: 'Sessile organism — no locomotion, sensory, or cognition genes',
  },
  UNDEAD: {
    id: 'undead',
    label: 'Undead / Revenant',
    activeRanges: [
      [0, 11], [18, 22], [26, 29], [30, 32], [42, 50], [51, 55],
      [96, 103], [104, 111], [128, 151], [168, 183], [216, 231],
      [248, 254], [255, 255],
    ],
    description: 'Reanimated entity — no metabolism, degraded cognition, supernatural traits',
  },
  CONSTRUCT: {
    id: 'construct',
    label: 'Construct / Golem / Automaton',
    activeRanges: [
      [0, 11], [23, 25], [26, 29], [42, 50], [51, 55], [96, 103],
      [128, 143], [216, 231], [232, 247],
    ],
    description: 'Artificial entity — no biology, mechanical/magical stats only',
  },
  SPIRIT: {
    id: 'spirit',
    label: 'Spirit / Elemental / Fey',
    activeRanges: [
      [18, 22], [42, 50], [51, 63], [96, 111], [152, 167],
      [168, 199], [216, 231], [248, 254], [255, 255],
    ],
    description: 'Non-corporeal or semi-corporeal entity — pure supernatural & cognition',
  },
  INSECT: {
    id: 'insect',
    label: 'Insect / Arachnid / Swarm',
    activeRanges: [
      [0, 8], [12, 17], [26, 29], [30, 32], [33, 35], [42, 50],
      [56, 59], [64, 71], [72, 79], [88, 95], [104, 111], [112, 119],
      [160, 167], [168, 183], [200, 215], [232, 247], [255, 255],
    ],
    description: 'Arthropod — hive dynamics, exoskeleton, minimal cognition',
  },
  AQUATIC: {
    id: 'aquatic',
    label: 'Aquatic / Deep-Sea',
    activeRanges: [
      [0, 17], [26, 32], [33, 41], [42, 50], [56, 59], [64, 79],
      [80, 87], [88, 95], [104, 119], [128, 151], [152, 167], [168, 183],
      [200, 215], [232, 247], [255, 255],
    ],
    description: 'Water-dwelling entity — pressure, electrosense, aquatic locomotion',
  },
  AVIAN: {
    id: 'avian',
    label: 'Avian / Flying',
    activeRanges: [
      [0, 17], [26, 32], [33, 41], [42, 50], [56, 59], [64, 79],
      [80, 87], [88, 95], [104, 119], [128, 151], [152, 167],
      [168, 183], [200, 215], [232, 247], [255, 255],
    ],
    description: 'Flying entity — hollow bones, magneto-navigation, aerial combat',
  },
};

// ================================================================
// 2. GENE INDEX ENUM — 256 GENES
// ================================================================
const GENES = Object.freeze({
  // ── 1. CORE PHYSICAL PERFORMANCE (0–11) ─────────────────────────
  ENDURANCE_A: 0, ENDURANCE_B: 1, ENDURANCE_C: 2,
  STRENGTH_A: 3, STRENGTH_B: 4, STRENGTH_C: 5,
  AGILITY_A: 6, AGILITY_B: 7, AGILITY_C: 8,
  INTEL_A: 9, INTEL_B: 10, INTEL_C: 11,

  // ── 2. IMMUNE & METABOLIC HEALTH (12–17) ────────────────────────
  IMMUNITY_A: 12, IMMUNITY_B: 13, IMMUNITY_C: 14,
  METAB_A: 15, METAB_B: 16, METAB_C: 17,

  // ── 3. PERSONALITY & BEHAVIORAL (18–22) ─────────────────────────
  RISK: 18, CURIOSITY: 19, SOCIAL: 20, AGGRESSION: 21, DISCIPLINE: 22,

  // ── 4. BRAIN / LEARNING MODIFIERS (23–25) ───────────────────────
  LEARNING_RATE: 23, MEMORY_CAP: 24, PATTERN_RECOG: 25,

  // ── 5. PHYSICAL PHENOTYPE & MORPHOLOGY (26–29) ──────────────────
  HEIGHT_A: 26, HEIGHT_B: 27, FRAME: 28, BMI: 29,

  // ── 6. APPEARANCE & SIGNALING (30–32) ───────────────────────────
  SKIN: 30, HAIR: 31, EYES: 32,

  // ── 7. EVOLUTIONARY & REPRODUCTIVE (33–35) ──────────────────────
  FERTILITY: 33, LONGEVITY: 34, MUTATION_RATE: 35,

  // ── 8. HIDDEN / RECESSIVE / CARRIER (36–38) ─────────────────────
  RECESSIVE_0: 36, RECESSIVE_1: 37, RECESSIVE_2: 38,

  // ── 9. EPIGENETIC & REGULATORY (39–41) ──────────────────────────
  STRESS_RESPONSE: 39, ADAPTABILITY: 40, INSTABILITY: 41,

  // ── 10. SENSORY INTERFACE (42–50) ───────────────────────────────
  SENSORY_VISION: 42, SENSORY_HEARING: 43, SENSORY_OLFACTION: 44,
  SENSORY_TACTILE: 45, NIGHT_VISION: 46, THERMAL_SENSE: 47,
  ELECTRO_SENSE: 48, MAGNETO_SENSE: 49, TOXIN_DETECT: 50,

  // ── 11. ADVANCED COGNITION & CREATIVITY (51–55) ─────────────────
  CREATIVITY: 51, EMPATHY: 52, FOCUS: 53, STRATEGY: 54, INTUITION: 55,

  // ── 12. SOCIAL & REPRODUCTIVE BEHAVIOR (56–59) ──────────────────
  MATING_PREFERENCE: 56, PARENTAL_CARE: 57, TERRITORIALITY: 58, COOPERATION: 59,

  // ── 13. REGULATORY & META-GENES (60–63) ─────────────────────────
  PLASTICITY_GLOBAL: 60, EPIGENETIC_MEMORY: 61, DOMINANCE_MOD: 62, EXPRESSION_RATE: 63,

  // ── 14. HORMONAL & ENDOCRINE (64–71) ────────────────────────────
  TESTOSTERONE: 64, ESTROGEN: 65, CORTISOL: 66, INSULIN: 67,
  THYROID: 68, GROWTH_HORMONE: 69, OXYTOCIN: 70, ADRENALINE: 71,

  // ── 15. DEVELOPMENTAL & ONTOGENY (72–79) ────────────────────────
  EMBRYONIC_GROWTH: 72, PUBERTY_TIMING: 73, AGING_RATE: 74, REGENERATION: 75,
  NEURAL_PRUNING: 76, MYELINATION: 77, STEM_CELL: 78, EPIGENETIC_RESET: 79,

  // ── 16. MICROBIOME & SYMBIONT (80–87) ───────────────────────────
  GUT_MICROBIOME: 80, IMMUNE_MODULATION: 81, TOXIN_BREAKDOWN: 82, VITAMIN_SYNTHESIS: 83,
  MOOD_INFLUENCE: 84, PATHOGEN_RESIST: 85, ENERGY_HARVEST: 86, CHEMICAL_SIGNAL: 87,

  // ── 17. ENVIRONMENTAL ADAPTATION (88–95) ────────────────────────
  THERMAL_TOLERANCE: 88, ALTITUDE_ADAPT: 89, AQUATIC_ADAPT: 90, ARID_ADAPT: 91,
  FOREST_CAMO: 92, CAVE_ADAPT: 93, POLAR_ADAPT: 94, URBAN_ADAPT: 95,

  // ── 18. ADVANCED COGNITION SUB-TYPES (96–103) ───────────────────
  ABSTRACT_THINK: 96, EMOTIONAL_IQ: 97, SPATIAL_IQ: 98, VERBAL_IQ: 99,
  LOGICAL_IQ: 100, CREATIVE_IQ: 101, SOCIAL_IQ: 102, PREDICTIVE_IQ: 103,

  // ── 19. SOCIAL HIERARCHY & GROUP DYNAMICS (104–111) ─────────────
  DOMINANCE: 104, SUBMISSIVENESS: 105, ALTRUISM: 106, KIN_RECOGNITION: 107,
  RECIPROCITY: 108, COALITION_FORM: 109, RITUAL_BEHAVIOR: 110, STATUS_SIGNAL: 111,

  // ── 20. REPRODUCTIVE STRATEGY (112–119) ─────────────────────────
  MONOGAMY_BIAS: 112, POLYGAMY_BIAS: 113, PARENTAL_INVEST: 114, MATE_CHOICE: 115,
  COURTSHIP_DISPLAY: 116, GAMETE_QUALITY: 117, GESTATION_LENGTH: 118, LITTER_SIZE: 119,

  // ── 21. META-REGULATORY (120–127) ───────────────────────────────
  GLOBAL_MUTATION: 120, EPIGENETIC_STABILITY: 121, VERSION_CONTROL: 122,
  CHECKSUM: 123, // RESERVED — integrity moved to the encode envelope; free slot
  EXTINCTION_RISK: 124, SPECIATION_TRIGGER: 125, CULTURAL_MEME: 126, PHYLO_MARKER: 127,

  // ── 22. EXPANDED PHYSICAL PERFORMANCE (128–135) ─────────────────
  ENDURANCE_D: 128, ENDURANCE_E: 129, STRENGTH_D: 130, STRENGTH_E: 131,
  AGILITY_D: 132, AGILITY_E: 133, SPEED_BURST: 134, SPEED_SUSTAIN: 135,

  // ── 23. PAIN, FATIGUE & RECOVERY (136–143) ──────────────────────
  PAIN_THRESHOLD: 136, PAIN_SENSITIVITY: 137, FATIGUE_RESIST: 138, RECOVERY_RATE: 139,
  SLEEP_EFFICIENCY: 140, WOUND_CLOTTING: 141, INFLAMMATION_CTRL: 142, SCAR_TISSUE: 143,

  // ── 24. CIRCADIAN & TEMPORAL BIOLOGY (144–151) ──────────────────
  CIRCADIAN_PHASE: 144, CIRCADIAN_RIGIDITY: 145, SEASONAL_RESPONSE: 146, HIBERNATION_DEPTH: 147,
  MIGRATION_URGE: 148, TIME_PERCEPTION: 149, ULTRADIAN_CYCLE: 150, LUNAR_SENSITIVITY: 151,

  // ── 25. VOCALIZATION & COMMUNICATION (152–159) ──────────────────
  VOCAL_RANGE: 152, VOCAL_POWER: 153, VOCAL_COMPLEXITY: 154, MIMICRY: 155,
  BODY_LANGUAGE: 156, PHEROMONE_OUTPUT: 157, BIOLUMINESCENCE: 158, ECHOLOCATION: 159,

  // ── 26. COMBAT & THREAT RESPONSE (160–167) ──────────────────────
  BITE_FORCE: 160, CLAW_SHARPNESS: 161, VENOM_POTENCY: 162, ARMOR_DENSITY: 163,
  THREAT_DISPLAY: 164, FLEE_SPEED: 165, PACK_TACTICS: 166, AMBUSH_INSTINCT: 167,

  // ── 27. INSTINCT & SURVIVAL DRIVES (168–175) ────────────────────
  HUNGER_DRIVE: 168, THIRST_DRIVE: 169, SHELTER_DRIVE: 170, HOARDING: 171,
  FLEE_THRESHOLD: 172, FREEZE_RESPONSE: 173, PLAY_DRIVE: 174, GROOMING: 175,

  // ── 28. NAVIGATION & SPATIAL MEMORY (176–183) ───────────────────
  HOME_RANGE: 176, PATH_MEMORY: 177, LANDMARK_RECOG: 178, DEAD_RECKONING: 179,
  CELESTIAL_NAV: 180, SCENT_TRAIL: 181, DEPTH_PERCEPTION: 182, SPATIAL_MAPPING: 183,

  // ── 29. SUPERNATURAL & METAPHYSICAL (184–199) ───────────────────
  MANA_POOL: 184, MANA_REGEN: 185, MANA_EFFICIENCY: 186, AURA_STRENGTH: 187,
  SPIRIT_SIGHT: 188, SOUL_RESILIENCE: 189, NECRO_AFFINITY: 190, LIFE_AFFINITY: 191,
  CHAOS_AFFINITY: 192, ORDER_AFFINITY: 193, DIVINATION_SENSE: 194, SUMMONING_BOND: 195,
  ENCHANT_RESIST: 196, CURSE_SUSCEPT: 197, BLESSING_RECEPT: 198, PLANAR_ANCHOR: 199,

  // ── 30. DIETARY & DIGESTIVE SPECIALIZATION (200–215) ────────────
  DIET_BREADTH: 200, CARNIVORE_BIAS: 201, HERBIVORE_BIAS: 202, OMNIVORE_FLEX: 203,
  CELLULOSE_DIGEST: 204, CARRION_TOLERANCE: 205, TOXIN_METABOLIZE: 206, MINERAL_EXTRACT: 207,
  WATER_EXTRACT: 208, FAT_STORAGE: 209, PROTEIN_SYNTH: 210, FERMENTATION: 211,
  COPROPHAGY_TRAIT: 212, PHOTOSYNTHESIS: 213, CHEMOSYNTHESIS: 214, NUTRIENT_SENSE: 215,

  // ── 31. ELEMENTAL & MAGICAL AFFINITY (216–231) ──────────────────
  FIRE_AFFINITY: 216, WATER_AFFINITY: 217, EARTH_AFFINITY: 218, AIR_AFFINITY: 219,
  SHADOW_AFFINITY: 220, LIGHT_AFFINITY: 221, NATURE_AFFINITY: 222, BLOOD_AFFINITY: 223,
  PSYCHIC_AFFINITY: 224, TIME_AFFINITY: 225, GRAVITY_AFFINITY: 226, SOUND_AFFINITY: 227,
  VOID_AFFINITY: 228, DREAM_AFFINITY: 229, RUNE_AFFINITY: 230, ALCHEMY_AFFINITY: 231,

  // ── 32. SKELETAL & STRUCTURAL SPECIALIZATION (232–247) ──────────
  BONE_DENSITY: 232, BONE_HOLLOW: 233, CARTILAGE_RATIO: 234, EXOSKELETON: 235,
  SHELL_THICKNESS: 236, SPINE_FLEXIBILITY: 237, LIMB_COUNT: 238, LIMB_REGEN: 239,
  WING_SPAN: 240, TAIL_LENGTH: 241, HORN_ANTLER: 242, TUSK_FANG: 243,
  CLAW_RETRACT: 244, WEBBED_DIGITS: 245, SUCKER_GRIP: 246, BODY_SYMMETRY: 247,

  // ── 33. CORRUPTION, MUTATION & PLANAR (248–254) ─────────────────
  CORRUPTION_RESIST: 248, CORRUPTION_SPREAD: 249, MUTATION_VOLATIL: 250, CHIMERA_POTENTIAL: 251,
  PLANAR_BLEED: 252, VOID_TAINT: 253, DIVINE_SPARK: 254,

  // ── 34. GENDER / SEX DETERMINATION (255) ────────────────────────
  GENDER: 255,
});

const GENE_NAMES = Object.freeze(
  Object.keys(GENES).reduce((acc, k) => { acc[GENES[k]] = k; return acc; }, new Array(256))
);

// ================================================================
// 3. GENE CATEGORIES — the ONE taxonomy. UI, filtering, stat screens.
// ================================================================
const GENE_CATEGORIES = Object.freeze({
  PHYSICAL:       { label: 'Core Physical',              color: '#e74c3c', range: [0, 11] },
  IMMUNE_METAB:   { label: 'Immune & Metabolic',         color: '#2ecc71', range: [12, 17] },
  PERSONALITY:    { label: 'Personality',                color: '#f39c12', range: [18, 22] },
  BRAIN:          { label: 'Brain & Learning',           color: '#3498db', range: [23, 25] },
  MORPHOLOGY:     { label: 'Morphology',                 color: '#9b59b6', range: [26, 29] },
  APPEARANCE:     { label: 'Appearance',                 color: '#e91e63', range: [30, 32] },
  EVOLUTIONARY:   { label: 'Evolutionary',               color: '#607d8b', range: [33, 35] },
  RECESSIVE:      { label: 'Recessive / Hidden',         color: '#795548', range: [36, 38] },
  EPIGENETIC:     { label: 'Epigenetic & Regulatory',    color: '#00bcd4', range: [39, 41] },
  SENSORY:        { label: 'Sensory',                    color: '#ff9800', range: [42, 50] },
  ADV_COGNITION:  { label: 'Advanced Cognition',         color: '#2196f3', range: [51, 55] },
  SOCIAL_REPRO:   { label: 'Social & Reproductive',      color: '#ff5722', range: [56, 59] },
  REGULATORY:     { label: 'Meta-Regulatory',            color: '#009688', range: [60, 63] },
  HORMONAL:       { label: 'Hormonal & Endocrine',       color: '#cddc39', range: [64, 71] },
  DEVELOPMENTAL:  { label: 'Developmental',              color: '#8bc34a', range: [72, 79] },
  MICROBIOME:     { label: 'Microbiome & Symbiont',      color: '#4caf50', range: [80, 87] },
  ENVIRONMENT:    { label: 'Environmental Adaptation',   color: '#00796b', range: [88, 95] },
  COGNITION_SUB:  { label: 'Cognition Sub-Types',        color: '#5c6bc0', range: [96, 103] },
  HIERARCHY:      { label: 'Social Hierarchy',           color: '#ef5350', range: [104, 111] },
  REPRO_STRAT:    { label: 'Reproductive Strategy',      color: '#ec407a', range: [112, 119] },
  META:           { label: 'Meta & Lineage',             color: '#78909c', range: [120, 127] },
  EXP_PHYSICAL:   { label: 'Expanded Physical',          color: '#d32f2f', range: [128, 135] },
  PAIN_RECOVERY:  { label: 'Pain, Fatigue & Recovery',   color: '#c62828', range: [136, 143] },
  CIRCADIAN:      { label: 'Circadian & Temporal',       color: '#1565c0', range: [144, 151] },
  VOCAL_COMM:     { label: 'Vocalization & Comms',       color: '#6a1b9a', range: [152, 159] },
  COMBAT:         { label: 'Combat & Threat',            color: '#b71c1c', range: [160, 167] },
  INSTINCT:       { label: 'Instinct & Survival',        color: '#33691e', range: [168, 175] },
  NAVIGATION:     { label: 'Navigation & Spatial',       color: '#0277bd', range: [176, 183] },
  SUPERNATURAL:   { label: 'Supernatural & Metaphysical',color: '#4a148c', range: [184, 199] },
  DIETARY:        { label: 'Dietary & Digestive',        color: '#558b2f', range: [200, 215] },
  ELEMENTAL:      { label: 'Elemental & Magical',        color: '#e65100', range: [216, 231] },
  SKELETAL:       { label: 'Skeletal & Structural',      color: '#3e2723', range: [232, 247] },
  CORRUPTION:     { label: 'Corruption & Planar',        color: '#311b92', range: [248, 254] },
  GENDER_SLOT:    { label: 'Sex Determination',          color: '#880e4f', range: [255, 255] },
});

// index -> category key, built once
const _CAT_OF = new Array(256);
for (const [key, def] of Object.entries(GENE_CATEGORIES)) {
  for (let i = def.range[0]; i <= def.range[1]; i++) _CAT_OF[i] = key;
}

/** @returns {{key:string,label:string,color:string}} */
function categoryOf(index) {
  const key = _CAT_OF[index];
  return key ? { key, label: GENE_CATEGORIES[key].label, color: GENE_CATEGORIES[key].color } : null;
}

// ================================================================
// 4. DERIVED TABLES — masks, counts, polygenic families (built once)
// ================================================================
const _MASKS = new Map();

function _maskFromRanges(ranges) {
  const mask = new Uint8Array(256);
  for (const [lo, hi] of ranges) for (let i = lo; i <= hi; i++) mask[i] = 1;
  return mask;
}

const ENTITY_TYPES = Object.freeze(
  Object.fromEntries(Object.entries(ENTITY_TYPES_RAW).map(([k, et]) => {
    const mask = _maskFromRanges(et.activeRanges);
    let count = 0;
    for (let i = 0; i < 256; i++) count += mask[i];
    _MASKS.set(et.id, mask);
    return [k, Object.freeze({ ...et, geneCount: count })];
  }))
);

// mutable: registerEntityType() adds to this at runtime
const _BY_ID = Object.fromEntries(Object.values(ENTITY_TYPES).map(et => [et.id, et]));

class GenomeError extends Error {
  constructor(message, code, detail) {
    super(message);
    this.name = 'GenomeError';
    this.code = code || 'GENOME_ERROR';
    if (detail) this.detail = detail;
  }
}

function getEntityType(entityTypeId) {
  const et = _BY_ID[entityTypeId];
  if (!et) throw new GenomeError(`Unknown entity type: ${entityTypeId}`, 'UNKNOWN_TYPE', { have: Object.keys(_BY_ID) });
  return et;
}

/**
 * Register a new entity type at runtime (hybrids, mods, campaign-specific races).
 * v2.1 had a closed set of 10 — anything outside it threw. Production needs this open.
 * @param {{id:string,label?:string,activeRanges:Array<[number,number]>,description?:string}} def
 * @param {boolean} [overwrite=false]
 */
function registerEntityType(def, overwrite = false) {
  if (!def || !def.id) throw new GenomeError('registerEntityType needs an id', 'BAD_TYPE_DEF');
  if (_BY_ID[def.id] && !overwrite) throw new GenomeError(`Entity type already registered: ${def.id}`, 'DUPLICATE_TYPE');
  if (!Array.isArray(def.activeRanges) || !def.activeRanges.length) {
    throw new GenomeError(`Entity type ${def.id} needs activeRanges`, 'BAD_TYPE_DEF');
  }
  for (const r of def.activeRanges) {
    if (!Array.isArray(r) || r.length !== 2 || r[0] < 0 || r[1] > 255 || r[0] > r[1]) {
      throw new GenomeError(`Bad range ${JSON.stringify(r)} on ${def.id}`, 'BAD_RANGE');
    }
  }
  const mask = _maskFromRanges(def.activeRanges);
  let count = 0; for (let i = 0; i < 256; i++) count += mask[i];
  const et = Object.freeze({
    id: def.id,
    label: def.label || def.id,
    description: def.description || '',
    activeRanges: def.activeRanges.map(r => [r[0], r[1]]),
    geneCount: count,
    custom: true,
  });
  _MASKS.set(def.id, mask);
  _BY_ID[def.id] = et;
  return et;
}

function unregisterEntityType(id) {
  if (_BY_ID[id] && _BY_ID[id].custom) { delete _BY_ID[id]; _MASKS.delete(id); return true; }
  return false;
}

function listEntityTypes() { return Object.keys(_BY_ID); }

/**
 * Shared, frozen-by-convention active mask. DO NOT MUTATE the returned array.
 * Use buildActiveMask() if you need an owned copy.
 */
function activeMask(entityTypeId) {
  getEntityType(entityTypeId);
  return _MASKS.get(entityTypeId);
}

/** Owned copy of the active mask (safe to mutate). */
function buildActiveMask(entityTypeId) {
  return Uint8Array.from(activeMask(entityTypeId));
}

/** Polygenic families: STRENGTH -> [3,4,5,130,131] etc. Built from _A.._Z suffixes. */
const GENE_FAMILIES = Object.freeze(
  Object.keys(GENES).reduce((acc, k) => {
    const m = /^(.+)_([A-Z])$/.exec(k);
    if (!m) return acc;
    (acc[m[1]] = acc[m[1]] || []).push(GENES[k]);
    return acc;
  }, {})
);

// ================================================================
// 5. SPECIES BIAS PROFILES
//    Uniform random genes make every entity statistically identical
//    mush. A profile shifts the mean/spread of specific genes so an
//    avian actually reads avian. Sparse — unlisted genes use default.
//    { geneIndex: [mean, spread] }
// ================================================================
const SPECIES_PROFILES = Object.freeze({
  humanoid: { default: [0.5, 0.7] },
  animal: {
    default: [0.5, 0.8],
    [GENES.INTEL_A]: [0.2, 0.3], [GENES.INTEL_B]: [0.2, 0.3], [GENES.INTEL_C]: [0.2, 0.3],
    [GENES.HUNGER_DRIVE]: [0.7, 0.4], [GENES.SENSORY_OLFACTION]: [0.75, 0.4],
  },
  monster: {
    default: [0.55, 0.9],
    [GENES.AGGRESSION]: [0.75, 0.4], [GENES.ARMOR_DENSITY]: [0.7, 0.5],
    [GENES.MUTATION_VOLATIL]: [0.7, 0.5], [GENES.MANA_POOL]: [0.65, 0.6],
  },
  plant: {
    default: [0.5, 0.7],
    [GENES.PHOTOSYNTHESIS]: [0.9, 0.2], [GENES.CELLULOSE_DIGEST]: [0.85, 0.25],
    [GENES.AGING_RATE]: [0.25, 0.4],
  },
  undead: {
    default: [0.45, 0.7],
    [GENES.PAIN_SENSITIVITY]: [0.05, 0.15], [GENES.RECOVERY_RATE]: [0.15, 0.3],
    [GENES.NECRO_AFFINITY]: [0.85, 0.25], [GENES.CORRUPTION_SPREAD]: [0.7, 0.5],
  },
  construct: {
    default: [0.5, 0.6],
    [GENES.PAIN_SENSITIVITY]: [0.0, 0.05], [GENES.BONE_DENSITY]: [0.85, 0.25],
    [GENES.FATIGUE_RESIST]: [0.9, 0.2],
  },
  spirit: {
    default: [0.5, 0.8],
    [GENES.MANA_POOL]: [0.8, 0.35], [GENES.MANA_REGEN]: [0.75, 0.4],
    [GENES.PLANAR_ANCHOR]: [0.3, 0.4], [GENES.AURA_STRENGTH]: [0.75, 0.4],
  },
  insect: {
    default: [0.45, 0.8],
    [GENES.EXOSKELETON]: [0.9, 0.2], [GENES.LITTER_SIZE]: [0.85, 0.25],
    [GENES.COOPERATION]: [0.75, 0.4],
  },
  aquatic: {
    default: [0.5, 0.8],
    [GENES.AQUATIC_ADAPT]: [0.95, 0.15], [GENES.ELECTRO_SENSE]: [0.7, 0.5],
    [GENES.CARTILAGE_RATIO]: [0.7, 0.4],
  },
  avian: {
    default: [0.5, 0.8],
    [GENES.BONE_HOLLOW]: [0.9, 0.2], [GENES.WING_SPAN]: [0.8, 0.35],
    [GENES.MAGNETO_SENSE]: [0.75, 0.4], [GENES.BONE_DENSITY]: [0.2, 0.3],
  },
});

// ================================================================
// 6. GENOME CREATION
// ================================================================

const GENOME_LEN = 256;
/** Value written into inactive slots. Never use value===0 to test activity — use the mask. */
const NULL_GENE = 0;

/**
 * Blank genome. Active genes -> 0.5 (neutral), inactive -> NULL_GENE.
 * v2.0 filled all 256 with 0.5, which disagreed with createRandomGenome's
 * "inactive = 0" convention and made blank genomes non-round-trippable.
 * @param {string} [entityTypeId] - omit for an all-0.5 scratch buffer
 * @returns {Float32Array}
 */
function createBlankGenome(entityTypeId) {
  const g = new Float32Array(GENOME_LEN);
  if (!entityTypeId) { g.fill(0.5); return g; }
  const mask = activeMask(entityTypeId);
  for (let i = 0; i < GENOME_LEN; i++) g[i] = mask[i] ? 0.5 : NULL_GENE;
  return g;
}

/**
 * Create a genome for an entity type. Deterministic when given a seed.
 * @param {string} entityTypeId
 * @param {number|string} [seed] - omit for Math.random-backed non-determinism
 * @param {Object} [opts]
 * @param {Object} [opts.profile] - override SPECIES_PROFILES entry
 * @param {Object} [opts.overrides] - { [geneIndex]: value } forced post-roll
 * @returns {Float32Array}
 */
function createGenome(entityTypeId, seed, opts = {}) {
  const mask = activeMask(entityTypeId);
  const rng = seed === undefined ? Math.random : makeRNG(seed);
  const profile = opts.profile || SPECIES_PROFILES[entityTypeId] || {};
  const dflt = profile.default || [0.5, 0.8];

  const g = new Float32Array(GENOME_LEN);
  for (let i = 0; i < GENOME_LEN; i++) {
    if (!mask[i]) { g[i] = NULL_GENE; continue; }
    const p = profile[i] || dflt;
    g[i] = drawTrait(rng, p[0], p[1]);
  }

  if (opts.overrides) {
    for (const [k, v] of Object.entries(opts.overrides)) {
      const i = +k;
      if (mask[i]) g[i] = Math.max(0, Math.min(1, v));
    }
  }

  return g;
}

/** Back-compat alias for v2.0 call sites. Unseeded, uniform-ish. */
function createRandomGenome(entityTypeId) {
  return createGenome(entityTypeId, undefined, { profile: { default: [0.5, 1] } });
}

// ================================================================
// 7. BREEDING — block recombination, dominance, seeded mutation
// ================================================================

/**
 * Crossover two parents. Deterministic when seeded.
 *
 * v2.0 picked each gene independently 50/50, so lineages never formed
 * stable family resemblance. v2.1 uses contiguous blocks (chromosome
 * segments) with crossover points, and actually consumes DOMINANCE_MOD.
 *
 * @param {Float32Array} parentA
 * @param {Float32Array} parentB
 * @param {string} entityTypeId
 * @param {Object} [opts]
 * @param {number|string} [opts.seed]
 * @param {number} [opts.mutationScale=0.05] - base mutation sigma
 * @param {number} [opts.blockLength=16] - avg genes per inherited block
 * @returns {Float32Array}
 */
function crossover(parentA, parentB, entityTypeId, opts = {}) {
  // tolerate v2.0 signature: crossover(a, b, type, 0.05)
  if (typeof opts === 'number') opts = { mutationScale: opts };
  const { seed, mutationScale = 0.05, blockLength = 16 } = opts;

  const mask = activeMask(entityTypeId);
  const rng = seed === undefined ? Math.random : makeRNG(seed);
  const child = new Float32Array(GENOME_LEN);

  const mutRateGene = (parentA[GENES.MUTATION_RATE] + parentB[GENES.MUTATION_RATE]) / 2;
  const globalMut   = (parentA[GENES.GLOBAL_MUTATION] + parentB[GENES.GLOBAL_MUTATION]) / 2;
  const instability = (parentA[GENES.INSTABILITY] + parentB[GENES.INSTABILITY]) / 2;
  const effectiveMut = mutationScale * (0.5 + mutRateGene) * (0.5 + globalMut) * (0.75 + instability * 0.5);

  // DOMINANCE_MOD: 0.5 = pure Mendelian coin-flip. Higher = the stronger
  // allele wins more often, producing visibly "dominant" bloodlines.
  const dominance = (parentA[GENES.DOMINANCE_MOD] + parentB[GENES.DOMINANCE_MOD]) / 2;

  let fromA = rng() < 0.5;
  let blockLeft = 1 + Math.floor(rng() * blockLength * 2);

  for (let i = 0; i < GENOME_LEN; i++) {
    if (blockLeft-- <= 0) { fromA = !fromA; blockLeft = 1 + Math.floor(rng() * blockLength * 2); }
    if (!mask[i]) { child[i] = NULL_GENE; continue; }

    const a = parentA[i], b = parentB[i];
    let base = fromA ? a : b;
    if (rng() < (dominance - 0.5) * 2) base = a > b ? a : b; // dominant allele expresses

    // Box-Muller gaussian mutation
    const u1 = rng() || 1e-10, u2 = rng();
    const noise = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
    let v = base + noise * effectiveMut;
    // reflect instead of clamp — avoids probability mass piling at 0 and 1
    if (v < 0) v = -v;
    if (v > 1) v = 2 - v;
    child[i] = v < 0 ? 0 : v > 1 ? 1 : v;
  }

  if (mask[GENES.PHYLO_MARKER]) stampLineage(child, parentA, parentB, 0.02, rng);
  return child;
}

/**
 * Mutate a genome in place-free fashion (returns a new array).
 * Useful for evolution-strategy loops without a second parent.
 */
function mutate(genome, entityTypeId, opts = {}) {
  const { seed, scale = 0.05, rate = 1 } = opts;
  const mask = activeMask(entityTypeId);
  const rng = seed === undefined ? Math.random : makeRNG(seed);
  const out = Float32Array.from(genome);
  for (let i = 0; i < GENOME_LEN; i++) {
    if (!mask[i] || rng() > rate) continue;
    const u1 = rng() || 1e-10, u2 = rng();
    const noise = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
    let v = out[i] + noise * scale;
    if (v < 0) v = -v;
    if (v > 1) v = 2 - v;
    out[i] = v < 0 ? 0 : v > 1 ? 1 : v;
  }
  return out;
}

// ================================================================
// 8. SERIALIZATION — 256 genes -> ~348-char base64 string
//    Float32Array JSON is ~2.5KB per NPC. Quantized to Uint8 it's
//    256 bytes -> 348 base64 chars, URL/localStorage/save-file sized.
//    Quantization error is 1/255 (~0.4%), below perceptual relevance.
// ================================================================

const GENOME_FORMAT_VERSION = 1;
const _B64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';

function _bytesToB64(bytes) {
  let out = '';
  for (let i = 0; i < bytes.length; i += 3) {
    const a = bytes[i], b = bytes[i + 1] || 0, c = bytes[i + 2] || 0;
    const n = (a << 16) | (b << 8) | c;
    out += _B64[(n >> 18) & 63] + _B64[(n >> 12) & 63] + _B64[(n >> 6) & 63] + _B64[n & 63];
  }
  return out;
}

function _b64ToBytes(str) {
  const lut = {};
  for (let i = 0; i < 64; i++) lut[_B64[i]] = i;
  const out = [];
  for (let i = 0; i < str.length; i += 4) {
    const n = (lut[str[i]] << 18) | (lut[str[i + 1]] << 12) | ((lut[str[i + 2]] || 0) << 6) | (lut[str[i + 3]] || 0);
    out.push((n >> 16) & 255, (n >> 8) & 255, n & 255);
  }
  return Uint8Array.from(out);
}

/**
 * Serialize to a compact string: "1:humanoid:<base64>:<chk>"
 * @returns {string}
 */
function encodeGenome(genome, entityTypeId) {
  getEntityType(entityTypeId);
  const bytes = new Uint8Array(GENOME_LEN);
  for (let i = 0; i < GENOME_LEN; i++) bytes[i] = Math.round(Math.max(0, Math.min(1, genome[i])) * 255);
  const fp = genomeFingerprint(genome);
  const chk = _B64[(fp >> 12) & 63] + _B64[(fp >> 6) & 63] + _B64[fp & 63];
  return `${GENOME_FORMAT_VERSION}:${entityTypeId}:${_bytesToB64(bytes)}:${chk}`;
}

/**
 * @param {string} str
 * @param {Object} [opts] { skipChecksum } — set to load deliberately hand-edited genomes
 * @returns {{ genome: Float32Array, entityTypeId: string, version: number }}
 */
function decodeGenome(str, opts = {}) {
  const parts = String(str).split(':');
  if (parts.length < 3) throw new Error('Malformed genome string');
  const version = +parts[0];
  if (version !== GENOME_FORMAT_VERSION) throw new Error(`Unsupported genome format v${version}`);
  const entityTypeId = parts[1];
  const mask = activeMask(entityTypeId);
  const bytes = _b64ToBytes(parts[2]);
  if (bytes.length < GENOME_LEN) throw new Error('Truncated genome payload');
  const genome = new Float32Array(GENOME_LEN);
  for (let i = 0; i < GENOME_LEN; i++) genome[i] = mask[i] ? bytes[i] / 255 : NULL_GENE;
  if (parts[3] && !opts.skipChecksum) {
    const fp = genomeFingerprint(genome);
    const chk = _B64[(fp >> 12) & 63] + _B64[(fp >> 6) & 63] + _B64[fp & 63];
    if (chk !== parts[3]) throw new Error('Genome checksum mismatch — data corrupt or edited');
  }
  return { genome, entityTypeId, version };
}

// ================================================================
// 9. INTEGRITY
//    NOTE: v2.0 declared a CHECKSUM gene at index 123 but never wrote it.
//    Writing it there is wrong anyway — 123 sits in the META range, which
//    8 of the 10 entity types do not activate, and a self-referential gene
//    would be inherited/mutated like any other trait. The checksum belongs
//    to the serialization envelope, not the gene data. Gene 123 is now a
//    RESERVED free slot; repurpose it if you need one.
// ================================================================

/** 16-bit FNV fingerprint of the quantized genome. Stable across encode/decode. */
function genomeFingerprint(genome) {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < GENOME_LEN; i++) {
    h ^= Math.round(Math.max(0, Math.min(1, genome[i])) * 255) & 255;
    h = Math.imul(h, 16777619) >>> 0;
  }
  return h & 0xFFFF;
}

/**
 * Structural validation. Catches corrupt save data before it reaches the sim.
 * @returns {{ ok: boolean, errors: string[] }}
 */
function validateGenome(genome, entityTypeId) {
  const errors = [];
  if (!genome || genome.length !== GENOME_LEN) {
    return { ok: false, errors: [`Expected ${GENOME_LEN} genes, got ${genome && genome.length}`] };
  }
  const mask = activeMask(entityTypeId);
  for (let i = 0; i < GENOME_LEN; i++) {
    const v = genome[i];
    if (!Number.isFinite(v)) { errors.push(`Gene ${i} (${GENE_NAMES[i]}) is not finite`); continue; }
    if (v < 0 || v > 1) errors.push(`Gene ${i} (${GENE_NAMES[i]}) out of range: ${v}`);
    if (!mask[i] && v !== NULL_GENE) errors.push(`Gene ${i} (${GENE_NAMES[i]}) is inactive for ${entityTypeId} but non-null`);
  }
  return { ok: errors.length === 0, errors };
}

// ================================================================
// 10. SCORING & PHENOTYPE
// ================================================================

/**
 * Average a polygenic family. Mask-aware: inactive slots are excluded
 * rather than counted as 0, which in v2.0 silently halved scores for
 * non-humanoid types (an insect has STRENGTH_A..C but not D/E).
 * @param {Float32Array} genome
 * @param {string} family - e.g. 'ENDURANCE', 'STRENGTH', 'AGILITY', 'INTEL'
 * @param {string} [entityTypeId]
 * @returns {number} 0..1
 */
function scorePolygenic(genome, family, entityTypeId) {
  const idxs = GENE_FAMILIES[family];
  if (!idxs || idxs.length === 0) return 0;
  const mask = entityTypeId ? activeMask(entityTypeId) : null;
  let sum = 0, n = 0;
  for (const i of idxs) {
    if (mask && !mask[i]) continue;
    sum += genome[i]; n++;
  }
  return n ? sum / n : 0;
}

/** Average every active gene in a GENE_CATEGORIES key. */
function scoreCategory(genome, categoryKey, entityTypeId) {
  const cat = GENE_CATEGORIES[categoryKey];
  if (!cat) return 0;
  const mask = entityTypeId ? activeMask(entityTypeId) : null;
  let sum = 0, n = 0;
  for (let i = cat.range[0]; i <= cat.range[1]; i++) {
    if (mask && !mask[i]) continue;
    sum += genome[i]; n++;
  }
  return n ? sum / n : 0;
}

/**
 * Phenotype layer — raw genes -> stats a game can actually consume.
 * Without this every downstream project reimplements the same maths.
 * All outputs 0..1 unless noted.
 * @returns {Object}
 */
function expressGenome(genome, entityTypeId) {
  const et = getEntityType(entityTypeId);
  const p = (f) => scorePolygenic(genome, f, entityTypeId);
  const g = (i) => genome[i];
  // EXPRESSION_RATE throttles how far traits deviate from neutral
  const throttle = 0.5 + g(GENES.EXPRESSION_RATE);
  const ex = (v) => Math.max(0, Math.min(1, 0.5 + (v - 0.5) * throttle));

  return {
    entityType: et.id,
    // core
    endurance: ex(p('ENDURANCE')),
    strength:  ex(p('STRENGTH')),
    agility:   ex(p('AGILITY')),
    intellect: ex(p('INTEL')),
    immunity:  ex(p('IMMUNITY')),
    metabolism: ex(p('METAB')),
    // derived composites
    speed:     ex((g(GENES.SPEED_BURST) * 0.6 + g(GENES.SPEED_SUSTAIN) * 0.4)),
    toughness: ex((g(GENES.ARMOR_DENSITY) + g(GENES.BONE_DENSITY) + g(GENES.PAIN_THRESHOLD)) / 3),
    lethality: ex((g(GENES.BITE_FORCE) + g(GENES.CLAW_SHARPNESS) + g(GENES.VENOM_POTENCY)) / 3),
    stealth:   ex((g(GENES.FOREST_CAMO) + g(GENES.AMBUSH_INSTINCT) + g(GENES.SHADOW_AFFINITY)) / 3),
    perception: ex((g(GENES.SENSORY_VISION) + g(GENES.SENSORY_HEARING) + g(GENES.SENSORY_OLFACTION)) / 3),
    // mind / social
    temperament: ex(g(GENES.AGGRESSION) - g(GENES.DISCIPLINE) * 0.5 + 0.25),
    sociability: ex((g(GENES.SOCIAL) + g(GENES.COOPERATION) + g(GENES.EMPATHY)) / 3),
    dominanceRank: ex(g(GENES.DOMINANCE) - g(GENES.SUBMISSIVENESS) * 0.5 + 0.25),
    // magical
    magicCapacity: ex((g(GENES.MANA_POOL) + g(GENES.MANA_REGEN) + g(GENES.MANA_EFFICIENCY)) / 3),
    corruption: ex((g(GENES.VOID_TAINT) + g(GENES.CORRUPTION_SPREAD) + (1 - g(GENES.CORRUPTION_RESIST))) / 3),
    // life history
    lifespanBias: ex(g(GENES.LONGEVITY) * 0.7 + (1 - g(GENES.AGING_RATE)) * 0.3),
    sex: g(GENES.GENDER) < 0.45 ? 'female' : g(GENES.GENDER) > 0.55 ? 'male' : 'intersex',
    sexValue: g(GENES.GENDER),
    // strongest elemental affinity, handy for VFX/loot tables
    dominantElement: (() => {
      const el = GENE_CATEGORIES.ELEMENTAL.range;
      let best = -1, bestI = -1;
      for (let i = el[0]; i <= el[1]; i++) if (genome[i] > best) { best = genome[i]; bestI = i; }
      return best > 0.6 ? { gene: GENE_NAMES[bestI], value: best } : null;
    })(),
  };
}

// ================================================================
// 11. REPORTING / UI HELPERS
//     TRAIT_DICTIONARY is optional — load genome-traits-256.js to get
//     names, descriptions and analogies. These degrade to gene keys.
// ================================================================

let _TRAITS = null;

/** Attach the optional trait dictionary (called by genome-traits-256.js). */
function attachTraits(dict) { _TRAITS = dict; return dict; }

function traitInfo(index) {
  const t = _TRAITS && _TRAITS[index];
  const cat = categoryOf(index);
  return {
    index,
    key: GENE_NAMES[index],
    name: t ? t.name : GENE_NAMES[index],
    shortDesc: t ? t.shortDesc : '',
    analogy: t ? t.analogy : '',
    category: cat ? cat.label : '',
    categoryKey: cat ? cat.key : '',
    color: cat ? cat.color : '#888',
  };
}

/**
 * Trait report. v2.0 always allocated 256 objects; this filters first.
 * @param {Object} [opts] { activeOnly=false, categoryKey, minValue }
 */
function traitReport(genome, entityTypeId, opts = {}) {
  const mask = activeMask(entityTypeId);
  const { activeOnly = false, categoryKey, minValue } = opts;
  const range = categoryKey && GENE_CATEGORIES[categoryKey] ? GENE_CATEGORIES[categoryKey].range : [0, 255];
  const report = [];
  for (let i = range[0]; i <= range[1]; i++) {
    const active = !!mask[i];
    if (activeOnly && !active) continue;
    if (minValue !== undefined && genome[i] < minValue) continue;
    report.push({ ...traitInfo(i), value: genome[i], active });
  }
  return report;
}

/** Genes grouped by category for UI rendering. */
function getGenesByCategory(entityTypeId) {
  const mask = entityTypeId ? activeMask(entityTypeId) : null;
  const groups = {};
  for (const [catKey, catDef] of Object.entries(GENE_CATEGORIES)) {
    const genes = [];
    for (let i = catDef.range[0]; i <= catDef.range[1]; i++) {
      if (mask && !mask[i]) continue;
      genes.push(traitInfo(i));
    }
    if (genes.length) groups[catDef.label] = { key: catKey, color: catDef.color, genes };
  }
  return groups;
}

// ================================================================
// 12. PRODUCTION UTILITIES
//     Sub-seed derivation, zero-alloc paths, lineage, hybrids,
//     population spawning, format migration.
// ================================================================

/**
 * Derive a stable child seed from any number of parts. Lets every
 * subsystem draw from its own stream — adding a new draw in one place
 * no longer shifts every downstream roll, which is what makes a seeded
 * generator actually stable across versions.
 * deriveSeed('world-7', 'npc', 42) -> uint32
 */
function deriveSeed(...parts) {
  let h = 2166136261 >>> 0;
  for (const part of parts) {
    const s = typeof part === 'number' ? ('#' + part) : String(part);
    for (let i = 0; i < s.length; i++) {
      h ^= s.charCodeAt(i);
      h = Math.imul(h, 16777619) >>> 0;
    }
    h ^= 0x9E3779B9; h = Math.imul(h, 16777619) >>> 0;
  }
  return h >>> 0;
}

/** Coerce anything array-like into a validated 256-length Float32Array. */
function toGenome(src) {
  if (src instanceof Float32Array && src.length === GENOME_LEN) return src;
  if (!src || src.length !== GENOME_LEN) {
    throw new GenomeError(`Expected ${GENOME_LEN} genes, got ${src && src.length}`, 'BAD_LENGTH');
  }
  return Float32Array.from(src);
}

function cloneGenome(genome) { return Float32Array.from(toGenome(genome)); }

/** Zero-alloc variant for hot loops (population regen, ES training). */
function createGenomeInto(out, entityTypeId, seed, opts = {}) {
  if (!(out instanceof Float32Array) || out.length !== GENOME_LEN) {
    throw new GenomeError('createGenomeInto needs a 256-length Float32Array', 'BAD_BUFFER');
  }
  const mask = activeMask(entityTypeId);
  const rng = seed === undefined ? Math.random : makeRNG(seed);
  const profile = opts.profile || SPECIES_PROFILES[entityTypeId] || {};
  const dflt = profile.default || [0.5, 0.8];
  for (let i = 0; i < GENOME_LEN; i++) {
    if (!mask[i]) { out[i] = NULL_GENE; continue; }
    const p = profile[i] || dflt;
    out[i] = drawTrait(rng, p[0], p[1]);
  }
  if (opts.overrides) {
    for (const k of Object.keys(opts.overrides)) {
      const i = +k;
      if (mask[i]) out[i] = Math.max(0, Math.min(1, opts.overrides[k]));
    }
  }
  return out;
}

/**
 * Spawn a reproducible population. Each member gets its own derived
 * sub-seed, so inserting or removing one member does not reshuffle the rest.
 * @returns {Float32Array[]}
 */
function spawnPopulation(entityTypeId, count, seed, opts = {}) {
  const out = new Array(count);
  for (let i = 0; i < count; i++) {
    out[i] = createGenome(entityTypeId, deriveSeed(seed, entityTypeId, i), opts);
  }
  return out;
}

// ── Lineage ─────────────────────────────────────────────────────

/**
 * Genetic distance over active genes. 0 = identical, 1 = maximally different.
 * Cheap enough for inbreeding checks inside a breeding loop.
 */
function geneticDistance(a, b, entityTypeId) {
  const mask = entityTypeId ? activeMask(entityTypeId) : null;
  let sum = 0, n = 0;
  for (let i = 0; i < GENOME_LEN; i++) {
    if (mask && !mask[i]) continue;
    sum += Math.abs(a[i] - b[i]); n++;
  }
  return n ? sum / n : 0;
}

/** 1 - distance, clamped. Use for kin recognition and inbreeding penalties. */
function relatedness(a, b, entityTypeId) {
  return Math.max(0, 1 - geneticDistance(a, b, entityTypeId) * 2);
}

/**
 * Blend PHYLO_MARKER so lineages drift measurably over generations
 * instead of being inherited as an untouched coin-flip. v2.1 declared
 * the gene and never used it.
 */
function stampLineage(child, parentA, parentB, drift = 0.02, rng = Math.random, mask = null) {
  if (mask && !mask[GENES.PHYLO_MARKER]) return child;
  const m = (parentA[GENES.PHYLO_MARKER] + parentB[GENES.PHYLO_MARKER]) / 2;
  let v = m + (rng() - 0.5) * 2 * drift;
  child[GENES.PHYLO_MARKER] = v < 0 ? 0 : v > 1 ? 1 : v;
  return child;
}

// ── Hybridisation ───────────────────────────────────────────────

/**
 * Cross two parents of DIFFERENT entity types. v2.1 threw on this even
 * though CHIMERA_POTENTIAL exists as a gene.
 *
 * Genes active in both parents are crossed normally. Genes active in only
 * one parent are inherited from that parent, gated by the pair's average
 * CHIMERA_POTENTIAL — low chimera means the hybrid mostly loses the
 * one-sided genes, high chimera means it keeps them.
 *
 * @param {Float32Array} a
 * @param {string} typeA
 * @param {Float32Array} b
 * @param {string} typeB
 * @param {Object} [opts] { seed, resultType, register=true, mutationScale, blockLength }
 * @returns {{ genome: Float32Array, entityTypeId: string, chimera: number }}
 */
function hybridize(a, typeA, b, typeB, opts = {}) {
  const { seed, mutationScale = 0.05, blockLength = 16, register = true } = opts;
  const mA = activeMask(typeA), mB = activeMask(typeB);
  const rng = seed === undefined ? Math.random : makeRNG(seed);

  const chimera = (a[GENES.CHIMERA_POTENTIAL] + b[GENES.CHIMERA_POTENTIAL]) / 2 || 0.5;

  // Decide the hybrid's own mask first — shared genes always, one-sided
  // genes by chimera roll. Deterministic given the seed.
  const ranges = [];
  const hybridMask = new Uint8Array(GENOME_LEN);
  for (let i = 0; i < GENOME_LEN; i++) {
    const both = mA[i] && mB[i];
    const either = mA[i] || mB[i];
    if (both) hybridMask[i] = 1;
    else if (either && rng() < chimera) hybridMask[i] = 1;
  }
  for (let i = 0; i < GENOME_LEN; i++) {
    if (!hybridMask[i]) continue;
    const start = i;
    while (i + 1 < GENOME_LEN && hybridMask[i + 1]) i++;
    ranges.push([start, i]);
  }
  if (!ranges.length) throw new GenomeError('Hybrid has no active genes', 'EMPTY_HYBRID');

  const resultType = opts.resultType || `hybrid-${typeA}-${typeB}`;
  if (register && !_BY_ID[resultType]) {
    registerEntityType({
      id: resultType,
      label: `Hybrid (${getEntityType(typeA).label} × ${getEntityType(typeB).label})`,
      description: `Runtime hybrid of ${typeA} and ${typeB}`,
      activeRanges: ranges,
    });
  } else if (register) {
    registerEntityType({ id: resultType, label: _BY_ID[resultType].label, activeRanges: ranges }, true);
  }

  const mutRate = (a[GENES.MUTATION_RATE] + b[GENES.MUTATION_RATE]) / 2;
  const globalMut = (a[GENES.GLOBAL_MUTATION] + b[GENES.GLOBAL_MUTATION]) / 2;
  // hybrids are genetically noisier — that is the point of them
  const effectiveMut = mutationScale * (0.5 + mutRate) * (0.5 + globalMut) * (1 + chimera);

  const child = new Float32Array(GENOME_LEN);
  let fromA = rng() < 0.5;
  let blockLeft = 1 + Math.floor(rng() * blockLength * 2);

  for (let i = 0; i < GENOME_LEN; i++) {
    if (blockLeft-- <= 0) { fromA = !fromA; blockLeft = 1 + Math.floor(rng() * blockLength * 2); }
    if (!hybridMask[i]) { child[i] = NULL_GENE; continue; }
    let base;
    if (mA[i] && mB[i]) base = fromA ? a[i] : b[i];
    else base = mA[i] ? a[i] : b[i];
    const u1 = rng() || 1e-10, u2 = rng();
    let v = base + Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2) * effectiveMut;
    if (v < 0) v = -v;
    if (v > 1) v = 2 - v;
    child[i] = v < 0 ? 0 : v > 1 ? 1 : v;
  }
  stampLineage(child, a, b, 0.08, rng, hybridMask);
  return { genome: child, entityTypeId: resultType, chimera };
}

// ── Format migration ────────────────────────────────────────────

const _MIGRATIONS = {
  // 0: (payloadBytes) => remappedBytes    // register future upgrades here
};

/** Register an upgrade path so old save strings keep loading. */
function registerMigration(fromVersion, fn) { _MIGRATIONS[fromVersion] = fn; }

/**
 * Decode any supported version, upgrading through registered migrations.
 * Use this at save-load boundaries instead of decodeGenome directly.
 */
function loadGenome(str, opts = {}) {
  const parts = String(str).split(':');
  const v = +parts[0];
  if (v === GENOME_FORMAT_VERSION) return decodeGenome(str, opts);
  if (!_MIGRATIONS[v]) throw new GenomeError(`No migration path from genome format v${v}`, 'NO_MIGRATION', { version: v });
  return decodeGenome(_MIGRATIONS[v](str), opts);
}

// ================================================================
// 13. EXPORTS
// ================================================================
const GenomeEngine = {
  // data
  GENES, GENE_NAMES, ENTITY_TYPES, GENE_CATEGORIES, GENE_FAMILIES, SPECIES_PROFILES,
  GENOME_LEN, NULL_GENE, GENOME_FORMAT_VERSION,
  get TRAIT_DICTIONARY() { return _TRAITS; },
  // rng
  makeRNG, hashSeed, drawTrait,
  // lifecycle
  createBlankGenome, createGenome, createRandomGenome, crossover, mutate,
  // masks / lookup / registry
  getEntityType, activeMask, buildActiveMask, categoryOf,
  registerEntityType, unregisterEntityType, listEntityTypes,
  // production
  GenomeError, deriveSeed, toGenome, cloneGenome, createGenomeInto, spawnPopulation,
  geneticDistance, relatedness, stampLineage, hybridize,
  registerMigration, loadGenome,
  // io + integrity
  encodeGenome, decodeGenome, genomeFingerprint, validateGenome,
  // scoring
  scorePolygenic, scoreCategory, expressGenome,
  // ui
  attachTraits, traitInfo, traitReport, getGenesByCategory,
};

export {
  GENES, GENE_NAMES, ENTITY_TYPES, GENE_CATEGORIES, GENE_FAMILIES, SPECIES_PROFILES,
  GENOME_LEN, NULL_GENE, GENOME_FORMAT_VERSION,
  makeRNG, hashSeed, drawTrait,
  createBlankGenome, createGenome, createRandomGenome, crossover, mutate,
  getEntityType, activeMask, buildActiveMask, categoryOf,
  registerEntityType, unregisterEntityType, listEntityTypes,
  GenomeError, deriveSeed, toGenome, cloneGenome, createGenomeInto, spawnPopulation,
  geneticDistance, relatedness, stampLineage, hybridize,
  registerMigration, loadGenome,
  encodeGenome, decodeGenome, genomeFingerprint, validateGenome,
  scorePolygenic, scoreCategory, expressGenome,
  attachTraits, traitInfo, traitReport, getGenesByCategory,
};

export default GenomeEngine;
export { GenomeEngine };
