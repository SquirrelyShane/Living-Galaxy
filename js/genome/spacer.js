import * as G from "./genome-256.js";
import { deriveCapabilities, expressContextual, createContext, lifeStage, expectedLifespan } from "./context.js";
import { RACES } from "../crew/races.js";

const { GENES: X } = G;

export const SPACER_RANGES = [
  [0, 11],
  [12, 17],
  [18, 22],
  [23, 25],
  [26, 29],
  [30, 32],
  [33, 35],
  [36, 38],
  [39, 41],
  [42, 46],
  [50, 50],
  [51, 55],
  [56, 59],
  [60, 63],
  [66, 66],
  [70, 71],
  [74, 75],
  [79, 79],
  [88, 89],
  [95, 95],
  [96, 103],
  [104, 109],
  [111, 111],
  [112, 115],
  [117, 117],
  [120, 121],
  [126, 127],
  [134, 135],
  [136, 136],
  [138, 140],
  [142, 142],
  [144, 145],
  [149, 149],
  [153, 154],
  [156, 156],
  [164, 164],
  [166, 166],
  [170, 172],
  [174, 174],
  [177, 177],
  [179, 180],
  [182, 183],
  [206, 206],
  [209, 209],
  [232, 232],
  [247, 247],
  [255, 255],
];

export const SYNTH_RANGES = [
  [0, 11], [18, 22], [23, 25], [26, 29], [30, 32],
  [39, 41], [42, 46], [50, 50], [51, 55], [58, 59],
  [60, 63], [96, 103], [104, 109], [111, 111],
  [120, 121], [126, 127], [134, 136], [138, 138], [142, 142],
  [149, 149], [153, 154], [156, 156], [164, 164], [166, 166],
  [171, 172], [177, 177], [179, 180], [182, 183], [232, 232], [247, 247],
];

G.registerEntityType({
  id: "spacer",
  label: "Spacer",
  activeRanges: SPACER_RANGES,
  description: "A person who lives in a hull — full cognition and social life, no supernatural slots",
}, true);

G.registerEntityType({
  id: "synth",
  label: "Synthetic hand",
  activeRanges: SYNTH_RANGES,
  description: "A machine that holds a post — mind and frame, no metabolism, no fertility, no clock to fight",
}, true);

export const SPACER = "spacer";
export const SYNTH = "synth";

const _activeIdx = new Map();
export function activeIndices(typeId = SPACER) {
  let idx = _activeIdx.get(typeId);
  if (idx) return idx;
  const mask = G.activeMask(typeId);
  idx = [];
  for (let i = 0; i < G.GENOME_LEN; i++) if (mask[i]) idx.push(i);
  _activeIdx.set(typeId, idx);
  return idx;
}

const SKILL_GENES = {
  geology: [X.PATTERN_RECOG, X.SPATIAL_IQ, X.SENSORY_VISION],
  heavyOps: [X.STRENGTH_A, X.STRENGTH_B, X.ENDURANCE_A],
  hazardOps: [X.TOXIN_DETECT, X.TOXIN_METABOLIZE, X.FLEE_THRESHOLD, X.PAIN_THRESHOLD],
  salvage: [X.SPATIAL_IQ, X.AGILITY_B, X.CREATIVITY],
  firstAid: [X.EMPATHY, X.FOCUS, X.SENSORY_TACTILE],
  surgery: [X.AGILITY_B, X.FOCUS, X.LOGICAL_IQ],
  xenomed: [X.LOGICAL_IQ, X.ABSTRACT_THINK, X.IMMUNITY_A],
  cryonics: [X.FOCUS, X.LOGICAL_IQ, X.THERMAL_TOLERANCE],
  genetics: [X.ABSTRACT_THINK, X.PATTERN_RECOG, X.LOGICAL_IQ],
  psychiatry: [X.EMPATHY, X.EMOTIONAL_IQ, X.SOCIAL_IQ],
  hullcraft: [X.AGILITY_B, X.SPATIAL_IQ, X.ENDURANCE_B],
  propulsion: [X.LOGICAL_IQ, X.PATTERN_RECOG, X.FOCUS],
  precisionFab: [X.AGILITY_B, X.FOCUS, X.CREATIVE_IQ],
  electronics: [X.LOGICAL_IQ, X.PATTERN_RECOG, X.AGILITY_C],
  materials: [X.LOGICAL_IQ, X.MEMORY_CAP, X.SENSORY_TACTILE],
  nanofab: [X.ABSTRACT_THINK, X.FOCUS, X.CREATIVE_IQ],
  supplyChain: [X.MEMORY_CAP, X.PREDICTIVE_IQ, X.RECIPROCITY],
  navigation: [X.SPATIAL_MAPPING, X.CELESTIAL_NAV, X.DEAD_RECKONING],
  piloting: [X.AGILITY_A, X.DEPTH_PERCEPTION, X.SPATIAL_IQ, X.ADRENALINE],
  commerce: [X.SOCIAL_IQ, X.PREDICTIVE_IQ, X.STATUS_SIGNAL],
  energySystems: [X.LOGICAL_IQ, X.FOCUS, X.PATTERN_RECOG],
  lifeSupport: [X.METAB_A, X.FOCUS, X.TOXIN_DETECT],
  construction: [X.STRENGTH_B, X.SPATIAL_IQ, X.ENDURANCE_C],
  agriculture: [X.PATTERN_RECOG, X.MEMORY_CAP, X.PARENTAL_CARE],
  terraforming: [X.ABSTRACT_THINK, X.PREDICTIVE_IQ, X.THERMAL_TOLERANCE],
  research: [X.ABSTRACT_THINK, X.CURIOSITY, X.LOGICAL_IQ],
  dataOps: [X.PATTERN_RECOG, X.MEMORY_CAP, X.LOGICAL_IQ],
  security: [X.THREAT_DISPLAY, X.PACK_TACTICS, X.STRENGTH_C, X.ADRENALINE],
  command: [X.DOMINANCE, X.STRATEGY, X.VERBAL_IQ, X.COALITION_FORM],
  law: [X.VERBAL_IQ, X.MEMORY_CAP, X.LOGICAL_IQ],
};
export { SKILL_GENES };

const TRAIT_GENES = {
  rcs: [[X.AGILITY_A, 1], [X.AGILITY_C, 1]],
  life: [[X.METAB_A, -1], [X.METAB_B, -1], [X.FAT_STORAGE, -1]],
  hull: [[X.BONE_DENSITY, 1], [X.ENDURANCE_B, 1]],
  reactor: [[X.ENDURANCE_A, 1], [X.RECOVERY_RATE, 1]],
  hold: [[X.STRENGTH_B, 1], [X.HOARDING, 1]],
  lock: [[X.PATTERN_RECOG, 1], [X.PREDICTIVE_IQ, 1]],
  gTol: [[X.ALTITUDE_ADAPT, -1], [X.PAIN_THRESHOLD, -1]],
  heat: [[X.THERMAL_TOLERANCE, -1], [X.INFLAMMATION_CTRL, -1]],
  scan: [[X.SENSORY_VISION, 1], [X.DEPTH_PERCEPTION, 1]],
};

const SPACER_BASELINE = {
  [X.GENDER]: [0.5, 2],
  [X.AGILITY_B]: [0.58, 0.5],
  [X.VOCAL_COMPLEXITY]: [0.6, 0.5],
  [X.VERBAL_IQ]: [0.55, 0.6],
  [X.ABSTRACT_THINK]: [0.55, 0.6],
  [X.LOGICAL_IQ]: [0.55, 0.6],
  [X.VOCAL_POWER]: [0.5, 0.55],
};

const _profiles = new Map();

export function raceProfile(raceId) {
  if (_profiles.has(raceId)) return _profiles.get(raceId);
  const race = RACES.find((r) => r.id === raceId);
  const p = { default: [0.5, 0.72], ...SPACER_BASELINE };
  if (race) {
    for (const [k, v] of Object.entries(race.traits ?? {})) {
      const genes = TRAIT_GENES[k];
      if (!genes || typeof v !== "number") continue;
      const off = Math.max(-0.4, Math.min(0.4, (v - 1) * 0.9));
      for (const [gene, dir] of genes) {
        const mean = Math.max(0.12, Math.min(0.88, 0.5 + off * dir));
        p[gene] = [mean, 0.6];
      }
    }
    for (const [skill, points] of Object.entries(race.affinity ?? {})) {
      const genes = SKILL_GENES[skill];
      if (!genes) continue;
      const mean = Math.max(0.12, Math.min(0.9, 0.5 + Math.min(16, points) / 16 * 0.3));
      for (const gene of genes) {
        const have = p[gene]?.[0] ?? 0.5;
        p[gene] = [Math.max(have, mean), 0.6];
      }
    }
    if (race.id === "tsynth") {
      p.default = [0.52, 0.42];
      p[X.MUTATION_RATE] = [0.15, 0.3];
      p[X.INSTABILITY] = [0.15, 0.3];
      p[X.CIRCADIAN_RIGIDITY] = [0.2, 0.35];
    }
  }
  _profiles.set(raceId, p);
  return p;
}

export function createSpacer(seed, raceId = "terran", typeId = SPACER) {
  return G.createGenome(typeId, `spacer:${raceId}:${seed}`, { profile: raceProfile(raceId) });
}

const B64 = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_";
const B64I = (() => { const m = new Int16Array(128).fill(-1); for (let i = 0; i < 64; i++) m[B64.charCodeAt(i)] = i; return m; })();
export const PACK_VERSION = 1;

function bytesToB64(bytes) {
  let s = "";
  for (let i = 0; i < bytes.length; i += 3) {
    const a = bytes[i], b = bytes[i + 1] ?? 0, c = bytes[i + 2] ?? 0;
    const n = (a << 16) | (b << 8) | c;
    s += B64[(n >> 18) & 63] + B64[(n >> 12) & 63];
    if (i + 1 < bytes.length) s += B64[(n >> 6) & 63];
    if (i + 2 < bytes.length) s += B64[n & 63];
  }
  return s;
}

function b64ToBytes(str, len) {
  const out = new Uint8Array(len);
  let o = 0;
  for (let i = 0; i < str.length && o < len; i += 4) {
    const c = [0, 1, 2, 3].map((k) => (i + k < str.length ? B64I[str.charCodeAt(i + k)] : -1));
    if (c[0] < 0 || c[1] < 0) break;
    const n = (c[0] << 18) | (c[1] << 12) | (Math.max(0, c[2]) << 6) | Math.max(0, c[3]);
    out[o++] = (n >> 16) & 255;
    if (c[2] >= 0 && o < len) out[o++] = (n >> 8) & 255;
    if (c[3] >= 0 && o < len) out[o++] = n & 255;
  }
  return out;
}

export function packGenome(genome, typeId = SPACER) {
  const idx = activeIndices(typeId);
  const bytes = new Uint8Array(idx.length);
  for (let i = 0; i < idx.length; i++) bytes[i] = Math.round(Math.max(0, Math.min(1, genome[idx[i]])) * 255);
  let h = 2166136261;
  for (let i = 0; i < bytes.length; i++) h = Math.imul(h ^ bytes[i], 16777619);
  h >>>= 0;
  return `p${PACK_VERSION}:${typeId}:${bytesToB64(bytes)}:${B64[(h >> 12) & 63]}${B64[(h >> 6) & 63]}${B64[h & 63]}`;
}

export function unpackGenome(str) {
  const parts = String(str).split(":");
  if (parts.length < 3 || parts[0][0] !== "p") throw new Error("Not a packed genome");
  if (+parts[0].slice(1) !== PACK_VERSION) throw new Error(`Unsupported packed genome v${parts[0].slice(1)}`);
  const typeId = parts[1];
  const idx = activeIndices(typeId);
  const bytes = b64ToBytes(parts[2], idx.length);
  if (parts[3]) {
    let h = 2166136261;
    for (let i = 0; i < bytes.length; i++) h = Math.imul(h ^ bytes[i], 16777619);
    h >>>= 0;
    const chk = B64[(h >> 12) & 63] + B64[(h >> 6) & 63] + B64[h & 63];
    if (chk !== parts[3]) throw new Error("Genome checksum mismatch — the record was edited or truncated");
  }
  const genome = new Float32Array(G.GENOME_LEN);
  for (let i = 0; i < idx.length; i++) genome[idx[i]] = bytes[i] / 255;
  return { genome, typeId };
}

export function fingerprint(genome, typeId = SPACER) {
  const idx = activeIndices(typeId);
  let h = 2166136261;
  for (const i of idx) h = Math.imul(h ^ (Math.round(Math.max(0, Math.min(1, genome[i])) * 255) & 255), 16777619);
  return (h >>> 0).toString(36).toUpperCase().padStart(7, "0");
}

const clamp01 = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);
const r2 = (v) => Math.round(v * 100) / 100;

export function genomeTraits(genome) {
  const g = (i) => genome[i] ?? 0.5;
  return {
    grit: r2(clamp01((g(X.PAIN_THRESHOLD) * 0.3 + g(X.FATIGUE_RESIST) * 0.3 + g(X.ENDURANCE_A) * 0.2 + (1 - g(X.FLEE_THRESHOLD)) * 0.2))),
    caution: r2(clamp01((g(X.DISCIPLINE) * 0.35 + (1 - g(X.RISK)) * 0.35 + g(X.PREDICTIVE_IQ) * 0.3))),
    greed: r2(clamp01((g(X.HOARDING) * 0.4 + g(X.STATUS_SIGNAL) * 0.3 + (1 - g(X.ALTRUISM)) * 0.3))),
    loyalty: r2(clamp01((g(X.COOPERATION) * 0.3 + g(X.RECIPROCITY) * 0.25 + g(X.KIN_RECOGNITION) * 0.2 + g(X.OXYTOCIN) * 0.25))),
    curiosity: r2(clamp01((g(X.CURIOSITY) * 0.45 + g(X.CREATIVE_IQ) * 0.3 + g(X.ABSTRACT_THINK) * 0.25))),
  };
}

export function skillAptitude(genome) {
  const out = {};
  for (const [skill, genes] of Object.entries(SKILL_GENES)) {
    let s = 0, n = 0;
    for (const i of genes) { const v = genome[i]; if (v > 0) { s += v; n++; } }
    out[skill] = n ? r2(s / n) : 0.5;
  }
  return out;
}

export function genomePulse(genome) {
  const g = (i) => genome[i] ?? 0.5;
  return Math.round(48 + (1 - g(X.ENDURANCE_A)) * 22 + g(X.METAB_A) * 14 + g(X.ADRENALINE) * 8);
}

function genomeRoll(genome, salt = "") {
  let h = 2166136261;
  for (let i = 0; i < salt.length; i++) h = Math.imul(h ^ salt.charCodeAt(i), 16777619);
  for (const i of [X.PHYLO_MARKER, X.RECESSIVE_0, X.RECESSIVE_1, X.RECESSIVE_2, X.CULTURAL_MEME, X.GENDER]) {
    h = Math.imul(h ^ (Math.round((genome[i] ?? 0.5) * 255) & 255), 16777619);
  }
  return ((h >>> 0) % 100000) / 100000;
}

export const SEX_SPLIT = { female: 0.615, male: 0.625 };
export const NONBINARY_SHARE = 0.05;
export const TRANS_SHARE = 0.03;

export function genomeIdentity(genome, fallbackRnd = null) {
  const g = (i) => genome[i] ?? 0.5;
  const sexV = g(X.GENDER);
  const sex = sexV < SEX_SPLIT.female ? "female" : sexV > SEX_SPLIT.male ? "male" : "intersex";

  const roll = genomeRoll(genome, "identity");
  let gender;
  if (roll < NONBINARY_SHARE) gender = "nonbinary";
  else if (sex === "intersex") gender = roll < NONBINARY_SHARE + 0.35 ? "woman" : roll < NONBINARY_SHARE + 0.7 ? "man" : "nonbinary";
  else if (roll < NONBINARY_SHARE + TRANS_SHARE) gender = sex === "female" ? "man" : "woman";
  else gender = sex === "female" ? "woman" : "man";

  const pref = g(X.MATING_PREFERENCE);
  const mono = g(X.MONOGAMY_BIAS), poly = g(X.POLYGAMY_BIAS);
  let attractedTo;
  if (pref < 0.08) attractedTo = [];
  else if (pref < 0.26) attractedTo = ["woman", "man", "nonbinary"];
  else if (pref < 0.46) attractedTo = [gender];
  else attractedTo = gender === "nonbinary"
    ? ["nonbinary", g(X.MATE_CHOICE) < 0.5 ? "woman" : "man"]
    : [gender === "woman" ? "man" : "woman"];
  if (gender !== "nonbinary" && pref >= 0.46 && g(X.MATE_CHOICE) > 0.86) attractedTo.push("nonbinary");
  if (fallbackRnd && !attractedTo.length && fallbackRnd() < 0) attractedTo = [gender];
  return { sex, gender, attractedTo, monogamous: mono >= poly, sexValue: r2(sexV) };
}

export function genomeTells(genome) {
  const g = (i) => genome[i] ?? 0.5;
  const pick = (v, list) => list[Math.min(list.length - 1, Math.floor(v * list.length))];
  const height = 152 + Math.round((g(X.HEIGHT_A) * 0.6 + g(X.HEIGHT_B) * 0.4) * 46);
  return {
    heightCm: height,
    build: pick(g(X.FRAME) * 0.5 + g(X.BMI) * 0.5, ["spare", "lean", "solid", "heavy-set"]),
    eyes: pick(g(X.EYES), ["grey", "pale blue", "green", "hazel", "amber", "brown", "near-black"]),
    hair: pick(g(X.HAIR), ["white", "ash", "sandy", "red", "chestnut", "dark brown", "black"]),
    skin: pick(g(X.SKIN), ["paper", "fair", "olive", "bronze", "brown", "deep brown"]),
    voice: pick(g(X.VOCAL_POWER), ["quiet", "level", "carrying", "loud"]),
    lowLight: g(X.NIGHT_VISION) > 0.72,
    symmetry: r2(g(X.BODY_SYMMETRY)),
  };
}

export function tellLine(genome) {
  const t = genomeTells(genome);
  return `${t.heightCm} cm, ${t.build}, ${t.hair} hair and ${t.eyes} eyes${t.lowLight ? ", reads a dark deck fine" : ""}`;
}

const FLOOR = {
  spacer: ["mobile", "dexterous", "corporeal", "sapient", "verbal", "vocal", "sighted", "metabolic", "planner"],
  synth: ["mobile", "dexterous", "corporeal", "sapient", "verbal", "vocal", "sighted", "planner"],
};

export function capabilities(genome, typeId = SPACER) {
  const c = deriveCapabilities(genome, typeId);
  for (const k of FLOOR[typeId] ?? []) c[k] = true;
  if (typeId === SYNTH) { c.fertile = false; c.nurturing = false; c.metabolic = false; }
  c.crafter = c.sapient && c.dexterous;
  c.social = c.gregarious && (c.verbal || c.vocal);
  c.tier = c.crafter && c.verbal ? "cultural" : c.sapient ? "reflective" : c.mobile ? "instinctive" : "sessile";
  return c;
}

export function phenotype(genome, typeId = SPACER, ctx = createContext()) {
  return expressContextual(genome, typeId, ctx);
}

export { createContext, lifeStage, expectedLifespan };

const _baseline = new Map();
function speciesBaseline(typeId) {
  if (_baseline.has(typeId)) return _baseline.get(typeId);
  const sample = [];
  const races = RACES.slice(0, 8).map((r) => r.id);
  for (let i = 0; i < 3; i++) for (const r of races) sample.push(createSpacer(`baseline:${i}`, r, typeId));
  let sum = 0, n = 0;
  for (let i = 0; i < sample.length; i++) {
    for (let j = i + 1; j < sample.length; j++) { sum += G.relatedness(sample[i], sample[j], typeId); n++; }
  }
  const b = n ? sum / n : 0.5;
  _baseline.set(typeId, b);
  return b;
}

export function kinship(a, b, typeId = SPACER) {
  if (!a || !b) return 0;
  const base = speciesBaseline(typeId);
  const raw = G.relatedness(a, b, typeId);
  return r2(Math.max(0, Math.min(1, (raw - base) / Math.max(0.05, 1 - base))));
}

export const KIN_BLOCK = 0.22;

export function kinLabel(k) {
  if (k >= 0.4) return "immediate family";
  if (k >= 0.2) return "half-sibling or closer";
  if (k >= 0.1) return "cousins";
  if (k >= 0.05) return "distant kin";
  return "no relation on file";
}

export function genomeCompat(ga, gb) {
  if (!ga || !gb) return 0;
  const d = (i) => Math.abs((ga[i] ?? 0.5) - (gb[i] ?? 0.5));
  const both = (i) => ((ga[i] ?? 0.5) + (gb[i] ?? 0.5)) / 2;
  let c = 1.5;
  c += (1 - d(X.COOPERATION)) * 1.6;
  c += (1 - d(X.SOCIAL)) * 0.8;
  c += both(X.EMPATHY) * 1.2;
  c += d(X.CIRCADIAN_PHASE) * 0.9;
  c -= d(X.DISCIPLINE) * 1.4;
  c -= both(X.AGGRESSION) * 1.8;
  c -= Math.min(ga[X.DOMINANCE] ?? 0.5, gb[X.DOMINANCE] ?? 0.5) * 1.6;
  c -= Math.min(ga[X.HOARDING] ?? 0.5, gb[X.HOARDING] ?? 0.5) * 1.2;
  c -= d(X.CULTURAL_MEME) * 0.6;
  return Math.max(-5, Math.min(5, r2(c)));
}

export function breed(gA, gB, seed, typeId = SPACER) {
  return G.crossover(gA, gB, typeId, { seed: `breed:${seed}`, mutationScale: 0.045, blockLength: 12 });
}

export { G as engine, X as GENE };
