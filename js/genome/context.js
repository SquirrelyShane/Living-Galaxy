/* Living Galaxy — GENOME CONTEXT, ported from the genome-agent project (v1.0) and
 * rewrapped as an ES module. Genes are a ceiling, not a stat line: this maps
 * genome + age + injury + environment + epigenetic history onto the phenotype
 * a hand actually works with this watch.
 *
 * A spacer's "biome" is the hull they are standing in — see
 * js/crew/deckmind.js, which fills the context from the ship's real state.
 */
import * as G from "./genome-256.js";

const GENES = G.GENES;

const clamp01 = v => v < 0 ? 0 : v > 1 ? 1 : v;
const lerp = (a, b, t) => a + (b - a) * t;

// ── Life stages ─────────────────────────────────────────────────
// Normalised age 0..1 across the individual's own lifespan.
const LIFE_STAGES = Object.freeze([
  { id: 'infant',   upTo: 0.06, physical: 0.22, cognitive: 0.18, social: 0.30 },
  { id: 'juvenile', upTo: 0.18, physical: 0.55, cognitive: 0.50, social: 0.65 },
  { id: 'adolescent', upTo: 0.28, physical: 0.85, cognitive: 0.78, social: 0.90 },
  { id: 'prime',    upTo: 0.62, physical: 1.00, cognitive: 1.00, social: 1.00 },
  { id: 'mature',   upTo: 0.82, physical: 0.88, cognitive: 1.00, social: 1.05 },
  { id: 'elder',    upTo: 1.01, physical: 0.58, cognitive: 0.88, social: 1.10 },
]);

function lifeStage(t) {
  for (const s of LIFE_STAGES) if (t <= s.upTo) return s;
  return LIFE_STAGES[LIFE_STAGES.length - 1];
}

/**
 * Expected lifespan in ticks for this genome, given a base species lifespan.
 * LONGEVITY raises it, AGING_RATE lowers it.
 */
function expectedLifespan(genome, baseTicks = 10000) {
  const lon = genome[GENES.LONGEVITY];
  const age = genome[GENES.AGING_RATE];
  return Math.round(baseTicks * lerp(0.55, 1.75, lon) * lerp(1.35, 0.7, age));
}

// ── Environment fit ─────────────────────────────────────────────
// Maps an environment descriptor onto the adaptation genes that cover it.
const BIOME_GENES = Object.freeze({
  temperate: [GENES.URBAN_ADAPT, GENES.FOREST_CAMO],
  forest:    [GENES.FOREST_CAMO],
  desert:    [GENES.ARID_ADAPT, GENES.WATER_EXTRACT],
  tundra:    [GENES.POLAR_ADAPT, GENES.THERMAL_TOLERANCE],
  mountain:  [GENES.ALTITUDE_ADAPT],
  cave:      [GENES.CAVE_ADAPT, GENES.NIGHT_VISION, GENES.ECHOLOCATION],
  water:     [GENES.AQUATIC_ADAPT],
  swamp:     [GENES.AQUATIC_ADAPT, GENES.TOXIN_METABOLIZE],
  urban:     [GENES.URBAN_ADAPT],
  void:      [GENES.PLANAR_ANCHOR, GENES.VOID_AFFINITY],
});

/**
 * 0..1 — how well this genome suits the biome. 0.5 is neutral.
 */
function biomeFitness(genome, biome) {
  const genes = BIOME_GENES[biome];
  if (!genes || !genes.length) return 0.5;
  let s = 0;
  for (const g of genes) s += genome[g];
  return clamp01(s / genes.length);
}

/**
 * Thermal comfort 0..1. temp is -1 (lethal cold) .. 0 (ideal) .. 1 (lethal heat).
 * THERMAL_TOLERANCE widens the comfortable band; polar/arid adapt shift it.
 */
function thermalComfort(genome, temp) {
  const tol = 0.15 + genome[GENES.THERMAL_TOLERANCE] * 0.55;
  const bias = (genome[GENES.ARID_ADAPT] - genome[GENES.POLAR_ADAPT]) * 0.25;
  const d = Math.abs(temp - bias);
  return clamp01(1 - Math.max(0, d - tol) / Math.max(0.001, 1 - tol));
}

/** Circadian alertness 0..1 for timeOfDay 0..1 (0 = midnight). */
function circadianAlertness(genome, timeOfDay) {
  const phase = genome[GENES.CIRCADIAN_PHASE];        // 0 = nocturnal, 1 = diurnal
  const rigidity = genome[GENES.CIRCADIAN_RIGIDITY];  // how hard the clock bites
  const daylight = 0.5 - 0.5 * Math.cos(2 * Math.PI * timeOfDay); // 0 at midnight, 1 at noon
  const aligned = lerp(1 - daylight, daylight, phase);
  return clamp01(lerp(0.65, aligned, 0.35 + rigidity * 0.65));
}

// ── Context object ──────────────────────────────────────────────

/**
 * @param {Object} [init]
 * @param {number} [init.ageTicks]
 * @param {number} [init.lifespanTicks]
 * @param {number} [init.injury]     0..1 accumulated structural damage
 * @param {number} [init.fatigue]    0..1
 * @param {number} [init.malnutrition] 0..1
 * @param {string} [init.biome]
 * @param {number} [init.temp]       -1..1
 * @param {number} [init.timeOfDay]  0..1
 * @param {number} [init.season]     0..1
 * @param {number} [init.altitude]   0..1
 * @param {number} [init.ambientMana] 0..1
 * @param {number} [init.corruptionField] 0..1
 */
function createContext(init = {}) {
  return {
    ageTicks: 0, lifespanTicks: 10000,
    injury: 0, fatigue: 0, malnutrition: 0,
    biome: 'temperate', temp: 0, timeOfDay: 0.5, season: 0.25,
    altitude: 0, ambientMana: 0.3, corruptionField: 0,
    // running epigenetic load, updated by recordStress()
    stressLoad: 0,
    ...init,
  };
}

/**
 * Feed lived experience back into the context. Repeated stress leaves a
 * mark whose persistence is set by EPIGENETIC_MEMORY, and whose decay is
 * set by EPIGENETIC_STABILITY / EPIGENETIC_RESET.
 */
function recordStress(genome, ctx, amount) {
  const persistence = genome[GENES.EPIGENETIC_MEMORY];
  const reset = genome[GENES.EPIGENETIC_RESET];
  const decay = lerp(0.08, 0.005, persistence) + reset * 0.05;
  const gain = amount * lerp(0.3, 1.2, genome[GENES.STRESS_RESPONSE]);
  ctx.stressLoad = clamp01(ctx.stressLoad * (1 - decay) + gain * 0.1);
  return ctx.stressLoad;
}

/**
 * Full contextual phenotype. Starts from GenomeEngine.expressGenome()
 * and applies the modifiers, then reports each modifier separately so a
 * decision trace can cite WHY a stat is what it is.
 *
 * @returns {Object} phenotype + { stage, modifiers, ceilings }
 */
function expressContextual(genome, entityTypeId, ctx = createContext()) {
  const base = G.expressGenome(genome, entityTypeId);
  const ageT = clamp01(ctx.ageTicks / Math.max(1, ctx.lifespanTicks));
  const stage = lifeStage(ageT);

  // PLASTICITY_GLOBAL decides how much context is allowed to move a trait.
  // Low plasticity = the genome wins; high = the environment wins.
  const plasticity = lerp(0.25, 1.0, genome[GENES.PLASTICITY_GLOBAL]);
  const adaptability = genome[GENES.ADAPTABILITY];

  // Injury: PAIN_THRESHOLD and INFLAMMATION_CTRL blunt it, SCAR_TISSUE
  // makes old damage permanent rather than recoverable.
  const painLoad = ctx.injury * lerp(1.25, 0.45, genome[GENES.PAIN_THRESHOLD]);
  const injuryPenalty = clamp01(painLoad * lerp(1.1, 0.6, genome[GENES.INFLAMMATION_CTRL]));

  const fatiguePenalty = clamp01(ctx.fatigue * lerp(1.15, 0.45, genome[GENES.FATIGUE_RESIST]));
  const hungerPenalty = clamp01(ctx.malnutrition * lerp(1.1, 0.55, genome[GENES.FAT_STORAGE]));

  const comfort = thermalComfort(genome, ctx.temp);
  const fit = biomeFitness(genome, ctx.biome);
  const alert = circadianAlertness(genome, ctx.timeOfDay);
  const altitudePenalty = clamp01((ctx.altitude - genome[GENES.ALTITUDE_ADAPT]) * 0.8);
  const stressPenalty = clamp01(ctx.stressLoad * lerp(1.0, 0.4, adaptability));

  const mods = {
    stage: stage.id,
    agePhysical: stage.physical,
    ageCognitive: stage.cognitive,
    ageSocial: stage.social,
    injuryPenalty, fatiguePenalty, hungerPenalty,
    thermalComfort: comfort, biomeFitness: fit, alertness: alert,
    altitudePenalty, stressPenalty, plasticity,
  };

  // Apply. `mod` blends toward the modified value by plasticity so a
  // low-plasticity creature is stubbornly itself under pressure.
  const mod = (v, factor) => clamp01(lerp(v, clamp01(v * factor), plasticity));

  const physFactor = stage.physical
    * (1 - injuryPenalty * 0.55)
    * (1 - fatiguePenalty * 0.40)
    * (1 - hungerPenalty * 0.35)
    * lerp(0.72, 1.0, comfort)
    * (1 - altitudePenalty * 0.5);

  const cogFactor = stage.cognitive
    * lerp(0.70, 1.0, alert)
    * (1 - fatiguePenalty * 0.45)
    * (1 - stressPenalty * 0.35)
    * (1 - injuryPenalty * 0.20);

  const socFactor = stage.social
    * (1 - stressPenalty * 0.30)
    * lerp(0.85, 1.05, fit);

  const out = {
    ...base,
    // physical
    strength: mod(base.strength, physFactor),
    endurance: mod(base.endurance, physFactor),
    agility: mod(base.agility, physFactor),
    speed: mod(base.speed, physFactor),
    toughness: mod(base.toughness, physFactor * 0.85 + 0.15),
    lethality: mod(base.lethality, physFactor),
    // mind
    intellect: mod(base.intellect, cogFactor),
    perception: mod(base.perception, cogFactor * lerp(0.8, 1.15, alert)),
    stealth: mod(base.stealth, physFactor * lerp(0.85, 1.2, 1 - ctx.timeOfDay > 0.5 ? 1 : 0.6)),
    // social
    sociability: mod(base.sociability, socFactor),
    dominanceRank: mod(base.dominanceRank, socFactor * physFactor),
    // magical — ambient field feeds capacity
    magicCapacity: mod(base.magicCapacity, lerp(0.7, 1.25, ctx.ambientMana)),
    corruption: clamp01(base.corruption + ctx.corruptionField * (1 - genome[GENES.CORRUPTION_RESIST]) * 0.5),
    // context readouts
    stage: stage.id,
    ageNormalised: ageT,
    alertness: alert,
    comfort,
    biomeFitness: fit,
    modifiers: mods,
    ceilings: {
      strength: base.strength, endurance: base.endurance, agility: base.agility,
      intellect: base.intellect, perception: base.perception,
    },
  };
  return out;
}


// ── Capabilities ────────────────────────────────────────────────
// A decision graph that assumes a mobile animal cannot serve a golem, a
// fungus or a scholar. Capabilities are derived from which genes the entity
// type actually activates plus how strongly they are expressed, and the graph
// gates whole domains on them. This is what makes one graph universal instead
// of ten species-specific ones.

const CAPABILITY_SPECS = Object.freeze({
  // requires:    every listed gene must be ACTIVE for this entity type
  // requiresAny: at least one listed gene must be active
  // genes:       what the expression score is averaged over
  // threshold:   minimum expression once presence is satisfied
  mobile:      { requires: ['AGILITY_A'], genes: ['AGILITY_A', 'SPEED_SUSTAIN', 'FLEE_SPEED'], threshold: 0.10 },
  dexterous:   { requires: ['AGILITY_B'], genes: ['AGILITY_B', 'CLAW_RETRACT', 'SUCKER_GRIP'], threshold: 0.12 },
  corporeal:   { requiresAny: ['FRAME', 'BONE_DENSITY', 'EXOSKELETON'], genes: ['FRAME', 'BONE_DENSITY', 'EXOSKELETON'], threshold: 0.02 },
  sapient:     { requires: ['ABSTRACT_THINK', 'LOGICAL_IQ'], genes: ['ABSTRACT_THINK', 'LOGICAL_IQ', 'STRATEGY'], threshold: 0.15 },
  verbal:      { requires: ['VOCAL_COMPLEXITY', 'VERBAL_IQ'], genes: ['VOCAL_COMPLEXITY', 'VERBAL_IQ', 'MIMICRY'], threshold: 0.15 },
  vocal:       { requires: ['VOCAL_POWER'], genes: ['VOCAL_POWER', 'VOCAL_RANGE'], threshold: 0.12 },
  arcane:      { requiresAny: ['MANA_POOL', 'SHADOW_AFFINITY', 'NECRO_AFFINITY'], genes: ['MANA_POOL', 'MANA_REGEN', 'AURA_STRENGTH', 'SHADOW_AFFINITY'], threshold: 0.15 },
  metabolic:   { requires: ['METAB_A'], genes: ['METAB_A', 'METAB_B'], threshold: 0.05 },
  sighted:     { requires: ['SENSORY_VISION'], genes: ['SENSORY_VISION', 'DEPTH_PERCEPTION'], threshold: 0.10 },
  gregarious:  { requiresAny: ['COOPERATION', 'ALTRUISM'], genes: ['SOCIAL', 'COOPERATION', 'COALITION_FORM'], threshold: 0.25 },
  territorial: { requiresAny: ['TERRITORIALITY', 'HOME_RANGE'], genes: ['TERRITORIALITY', 'HOME_RANGE'], threshold: 0.30 },
  armed:       { requiresAny: ['BITE_FORCE', 'CLAW_SHARPNESS', 'VENOM_POTENCY'], genes: ['BITE_FORCE', 'CLAW_SHARPNESS', 'VENOM_POTENCY'], threshold: 0.18 },
  fertile:     { requires: ['FERTILITY'], genes: ['FERTILITY', 'GAMETE_QUALITY'], threshold: 0.15 },
  nurturing:   { requiresAny: ['PARENTAL_CARE', 'PARENTAL_INVEST'], genes: ['PARENTAL_CARE', 'PARENTAL_INVEST'], threshold: 0.25 },
  photic:      { requires: ['PHOTOSYNTHESIS'], genes: ['PHOTOSYNTHESIS'], threshold: 0.80 },
  chemotroph:  { requires: ['CHEMOSYNTHESIS'], genes: ['CHEMOSYNTHESIS'], threshold: 0.80 },
  corrupting:  { requiresAny: ['CORRUPTION_SPREAD', 'VOID_TAINT'], genes: ['CORRUPTION_SPREAD', 'VOID_TAINT', 'NECRO_AFFINITY'], threshold: 0.30 },
  navigator:   { requiresAny: ['SPATIAL_MAPPING', 'PATH_MEMORY'], genes: ['SPATIAL_MAPPING', 'PATH_MEMORY', 'LANDMARK_RECOG'], threshold: 0.25 },
  planner:     { requires: ['STRATEGY', 'PREDICTIVE_IQ'], genes: ['STRATEGY', 'PREDICTIVE_IQ', 'FOCUS'], threshold: 0.25 },
});

/**
 * Derive what this entity is physically and cognitively able to attempt.
 * A gene that the entity type does not activate contributes nothing, so a
 * plant is never dexterous and a construct is never metabolic regardless of
 * what its gene values happen to be.
 *
 * @returns {Object} { mobile:bool, ..., scores:{id:0..1}, tier:string }
 */
function deriveCapabilities(genome, entityTypeId) {
  const mask = G.activeMask(entityTypeId);
  const active = name => { const i = GENES[name]; return i !== undefined && !!mask[i]; };
  const out = { scores: {} };

  for (const id of Object.keys(CAPABILITY_SPECS)) {
    const spec = CAPABILITY_SPECS[id];
    const presence = (!spec.requires || spec.requires.every(active))
                  && (!spec.requiresAny || spec.requiresAny.some(active));
    let sum = 0, n = 0;
    for (const name of spec.genes) {
      if (!active(name)) continue;
      sum += genome[GENES[name]]; n++;
    }
    const score = n ? sum / n : 0;
    out.scores[id] = presence ? clamp01(score) : 0;
    out[id] = presence && score >= spec.threshold;
  }

  // Derived composites the graph gates whole domains on.
  out.crafter = out.sapient && out.dexterous;
  out.social = out.gregarious && (out.verbal || out.vocal);

  // Behavioural tier — how far up the graph this entity can reach at all.
  out.tier = out.crafter && out.verbal ? 'cultural'
           : out.sapient ? 'reflective'
           : out.mobile ? 'instinctive'
           : 'sessile';
  return out;
}

/**
 * Which contextual modifier is currently hurting this agent most.
 * Used by the decision trace to answer "what made me take this action".
 * @returns {{ key:string, severity:number, label:string }|null}
 */
function dominantStressor(phenotype) {
  const m = phenotype.modifiers;
  if (!m) return null;
  const candidates = [
    { key: 'injury', severity: m.injuryPenalty, label: 'wounded' },
    { key: 'fatigue', severity: m.fatiguePenalty, label: 'exhausted' },
    { key: 'hunger', severity: m.hungerPenalty, label: 'starving' },
    { key: 'cold_heat', severity: 1 - m.thermalComfort, label: 'thermally stressed' },
    { key: 'altitude', severity: m.altitudePenalty, label: 'oxygen-starved' },
    { key: 'stress', severity: m.stressPenalty, label: 'chronically stressed' },
    { key: 'biome', severity: 1 - m.biomeFitness, label: 'out of its element' },
    { key: 'drowsy', severity: 1 - m.alertness, label: 'off its circadian peak' },
  ];
  candidates.sort((a, b) => b.severity - a.severity);
  return candidates[0].severity > 0.25 ? candidates[0] : null;
}

export {
  LIFE_STAGES, BIOME_GENES, CAPABILITY_SPECS,
  createContext, expressContextual, recordStress, dominantStressor, deriveCapabilities,
  lifeStage, expectedLifespan, biomeFitness, thermalComfort, circadianAlertness,
};
