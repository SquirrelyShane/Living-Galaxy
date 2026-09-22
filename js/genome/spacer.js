/* Living Galaxy — the SPACER genome.
 *
 * The genome engine ships ten entity types, all of them built for a fantasy
 * bestiary. None of them is a person who lives in a hull. This registers two
 * that are:
 *
 *   spacer — a crewable human being. 123 of the 256 gene slots, chosen so
 *            that every active gene is read by something the sim already
 *            simulates: watch performance, skill ceilings, temperament, who
 *            they get on with, how they age, what a child inherits. No magic,
 *            no elemental affinity, no claws, no photosynthesis — those slots
 *            stay null, which means they cost nothing to store and can never
 *            leak into a phenotype.
 *   synth  — a machine that holds a post. The same frame minus fertility,
 *            hormones, digestion and circadian drift, so a robot can run the
 *            same decision graph without ever courting anyone or getting
 *            hungry.
 *
 * Because only the active slots carry meaning, `packGenome` writes just those
 * — 123 bytes instead of 256, a 168-character string instead of 359. A ledger
 * of 500 people costs about 90 KB rather than 190 KB. `encodeGenome` from the
 * engine still works and still round-trips with the genome-agent project;
 * this is the compact form CRADLE stores.
 *
 */

import * as G from "./genome-256.js";
import { deriveCapabilities, expressContextual, createContext, lifeStage, expectedLifespan } from "./context.js";
import { RACES } from "../races.js";

const { GENES: X } = G;

/* ---- the masks ----------------------------------------------------------
 * Ranges, not a scatter of indices, because activeRanges is what the engine's
 * mask builder takes. Singletons are written [i, i] on purpose — they are the
 * genes that earned their slot on their own.
 */
export const SPACER_RANGES = [
  [0, 11],     // endurance / strength / agility / intellect families
  [12, 17],    // immunity, metabolism
  [18, 22],    // risk, curiosity, social, aggression, discipline
  [23, 25],    // learning rate, memory, pattern recognition
  [26, 29],    // height, frame, build
  [30, 32],    // skin, hair, eyes — the visible tells
  [33, 35],    // fertility, longevity, mutation rate
  [36, 38],    // recessive carriers — what skips a generation
  [39, 41],    // stress response, adaptability, instability
  [42, 46],    // vision, hearing, olfaction, touch, low-light
  [50, 50],    // toxin detection — the nose for a bad seal
  [51, 55],    // creativity, empathy, focus, strategy, intuition
  [56, 59],    // mating preference, parental care, territoriality, cooperation
  [60, 63],    // plasticity, epigenetic memory, dominance, expression rate
  [66, 66],    // cortisol
  [70, 71],    // oxytocin, adrenaline
  [74, 75],    // aging rate, regeneration
  [79, 79],    // epigenetic reset
  [88, 89],    // thermal tolerance, pressure/g tolerance
  [95, 95],    // urban adaptation — station-born
  [96, 103],   // the eight cognition sub-types
  [104, 109],  // dominance, submissiveness, altruism, kin recognition, reciprocity, coalitions
  [111, 111],  // status signalling
  [112, 115],  // monogamy, polygamy, parental investment, mate choice
  [117, 117],  // gamete quality
  [120, 121],  // global mutation, epigenetic stability
  [126, 127],  // cultural meme, phylogenetic marker
  [134, 135],  // burst and sustained speed
  [136, 136],  // pain threshold
  [138, 140],  // fatigue resistance, recovery, sleep efficiency
  [142, 142],  // inflammation control
  [144, 145],  // circadian phase and rigidity
  [149, 149],  // time perception
  [153, 154],  // vocal power, vocal complexity
  [156, 156],  // body language
  [164, 164],  // threat display
  [166, 166],  // pack tactics
  [170, 172],  // shelter drive, hoarding, flee threshold
  [174, 174],  // play drive
  [177, 177],  // path memory
  [179, 180],  // dead reckoning, celestial navigation
  [182, 183],  // depth perception, spatial mapping
  [206, 206],  // toxin metabolism
  [209, 209],  // fat storage
  [232, 232],  // bone density
  [247, 247],  // body symmetry
  [255, 255],  // sex determination
];

/* A machine keeps the frame and the mind and loses the biology. */
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

/** Active gene indices for a type, ascending. Cached — the codec runs per record. */
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

/* ---- race bias ----------------------------------------------------------
 * A race in Living Galaxy is already a set of multipliers that the sim honours
 * (races.js). Rather than invent a second personality system, the same
 * numbers bend the genome: a race with a strong `lock` bends pattern
 * recognition and reaction, one with cheap `life` bends metabolism down, and
 * every skill affinity bends the genes that skill reads from. So an Eridian
 * navigator is genetically a navigator, not a Terran wearing a label.
 */
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

/** The multiplier genes a race trait bends, and which way. */
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

/* Species baseline. Hands, speech and abstraction are what a person IS, not a
 * lucky roll — a spacer who drew 0.06 manual dexterity would be a spacer with
 * no hands. These genes get a human floor, and the individual variation sits
 * on top of it. */
const SPACER_BASELINE = {
  /* A bell curve on the sex gene is what made one in five people intersex.
   * Spread 2 flattens the engine's three-uniform average across the whole
   * range, so the two sides come out even and the band between is narrow. */
  [X.GENDER]: [0.5, 2],
  [X.AGILITY_B]: [0.58, 0.5],
  [X.VOCAL_COMPLEXITY]: [0.6, 0.5],
  [X.VERBAL_IQ]: [0.55, 0.6],
  [X.ABSTRACT_THINK]: [0.55, 0.6],
  [X.LOGICAL_IQ]: [0.55, 0.6],
  [X.VOCAL_POWER]: [0.5, 0.55],
};

const _profiles = new Map();

/** Sparse `{ geneIndex: [mean, spread] }` bias for a race id. Built once per race. */
export function raceProfile(raceId) {
  if (_profiles.has(raceId)) return _profiles.get(raceId);
  const race = RACES.find((r) => r.id === raceId);
  const p = { default: [0.5, 0.72], ...SPACER_BASELINE };
  if (race) {
    for (const [k, v] of Object.entries(race.traits ?? {})) {
      const genes = TRAIT_GENES[k];
      if (!genes || typeof v !== "number") continue;
      /* traits are multipliers around 1; 1.2 is a strong race, 0.85 a weak one */
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
    /* the foundry lines are built to a specification: less spread, more uniform */
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

/** Deterministic genome for a person. Same seed + race = same body, always. */
export function createSpacer(seed, raceId = "terran", typeId = SPACER) {
  return G.createGenome(typeId, `spacer:${raceId}:${seed}`, { profile: raceProfile(raceId) });
}

/* ---- the compact codec ---------------------------------------------------
 * `p1:<type>:<base64 of the active bytes>:<checksum>` — only the slots the
 * type activates, so the string length tracks how much genome the type
 * actually uses. Decoding rebuilds a full 256-slot Float32Array with the
 * inactive slots nulled, which is the shape everything downstream expects.
 */
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

/** Genome → the short string CRADLE stores. */
export function packGenome(genome, typeId = SPACER) {
  const idx = activeIndices(typeId);
  const bytes = new Uint8Array(idx.length);
  for (let i = 0; i < idx.length; i++) bytes[i] = Math.round(Math.max(0, Math.min(1, genome[idx[i]])) * 255);
  let h = 2166136261;
  for (let i = 0; i < bytes.length; i++) h = Math.imul(h ^ bytes[i], 16777619);
  h >>>= 0;
  return `p${PACK_VERSION}:${typeId}:${bytesToB64(bytes)}:${B64[(h >> 12) & 63]}${B64[(h >> 6) & 63]}${B64[h & 63]}`;
}

/** The short string → { genome, typeId }. Throws on a corrupt or foreign payload. */
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

/**
 * Short, stable, human-readable id for a genome — shown on the crew sheet and
 * quoted in the ledger. The engine's own fingerprint is 16 bits, which
 * collides inside a ledger of a few hundred people; this is a 32-bit hash over
 * the active slots only, so two people with the same code really do have the
 * same genome for this entity type.
 */
export function fingerprint(genome, typeId = SPACER) {
  const idx = activeIndices(typeId);
  let h = 2166136261;
  for (const i of idx) h = Math.imul(h ^ (Math.round(Math.max(0, Math.min(1, genome[i])) * 255) & 255), 16777619);
  return (h >>> 0).toString(36).toUpperCase().padStart(7, "0");
}

/* ---- reading a genome into the game -------------------------------------- */

const clamp01 = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);
const r2 = (v) => Math.round(v * 100) / 100;

/**
 * The five axes CRADLE has always carried, grown from genes instead of a die
 * roll. Existing records keep their numbers — this is what new ones get, and
 * what a child inherits.
 */
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

/** 0..1 per skill — the ceiling this body sets on what they can learn. */
export function skillAptitude(genome) {
  const out = {};
  for (const [skill, genes] of Object.entries(SKILL_GENES)) {
    let s = 0, n = 0;
    for (const i of genes) { const v = genome[i]; if (v > 0) { s += v; n++; } }
    out[skill] = n ? r2(s / n) : 0.5;
  }
  return out;
}

/** Resting heart rate, from metabolism and the clock. The old `pulse` field. */
export function genomePulse(genome) {
  const g = (i) => genome[i] ?? 0.5;
  return Math.round(48 + (1 - g(X.ENDURANCE_A)) * 22 + g(X.METAB_A) * 14 + g(X.ADRENALINE) * 8);
}

/* A stable 0..1 read off a genome that is not any one gene — for the rolls
 * that should be deterministic per person without spending a gene slot on
 * them. Same genome, same number, on every device. */
function genomeRoll(genome, salt = "") {
  let h = 2166136261;
  for (let i = 0; i < salt.length; i++) h = Math.imul(h ^ salt.charCodeAt(i), 16777619);
  for (const i of [X.PHYLO_MARKER, X.RECESSIVE_0, X.RECESSIVE_1, X.RECESSIVE_2, X.CULTURAL_MEME, X.GENDER]) {
    h = Math.imul(h ^ (Math.round((genome[i] ?? 0.5) * 255) & 255), 16777619);
  }
  return ((h >>> 0) % 100000) / 100000;
}

/**
 * Identity from the genome.
 *
 * Two different things, which v2 ran together and got wrong. GENDER is the
 * body's SEX, and the engine draws every gene on a bell curve — so a band wide
 * enough to mean anything swallowed a fifth of the population and the sky came
 * out 40/40/20. The sex is now read off the same gene against a flat
 * distribution (`SEX_UNIFORM` in the spacer profile), which puts it back at
 * roughly even with a narrow intersex band.
 *
 * GENDER IDENTITY is a separate roll off the genome as a whole: the large
 * majority of people are the gender their body is, a few are not, and a few
 * are neither. Attraction is its own gene again on top of that.
 */
/**
 * Where the sex gene is cut.
 *
 * This used to be an even split and the measured sky came out 46/48/6, which
 * is correct and still read as male-dominant in play — because a sky is not a
 * census, it is the forty faces you actually meet, and the two things that
 * decide how those forty read are the NAME and whether anything on screen ever
 * says otherwise. Both of those are fixed elsewhere (names.js dropped the
 * ambiguous-ending rate, and the rosters, the hiring hall, the SHIPS directory
 * and the open channel all carry pronouns now).
 *
 * This is the other half, asked for directly: the cut moved so the sky runs
 * about 55% women / 40% men / 5% nonbinary. It is one number, it is the only
 * number that sets the ratio, and it is here rather than spread across the
 * generators so it can be moved back in one edit.
 */
export const SEX_SPLIT = { female: 0.615, male: 0.625 };   // the band between is intersex
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

/** The things you can see across a mess hall. Used by the crew sheet and talk. */
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

/** One line of it, for a card. */
export function tellLine(genome) {
  const t = genomeTells(genome);
  return `${t.heightCm} cm, ${t.build}, ${t.hair} hair and ${t.eyes} eyes${t.lowLight ? ", reads a dark deck fine" : ""}`;
}

/* Capabilities every registered crew type has by construction. The engine
 * derives presence from the mask and degree from the genes; for a person the
 * presence of hands and language is not in question, so these are floored
 * true and the score is left alone to say how much of it they have. */
const FLOOR = {
  spacer: ["mobile", "dexterous", "corporeal", "sapient", "verbal", "vocal", "sighted", "metabolic", "planner"],
  synth: ["mobile", "dexterous", "corporeal", "sapient", "verbal", "vocal", "sighted", "planner"],
};

/** What this body and mind are able to attempt. Gates whole branches of the deck graph. */
export function capabilities(genome, typeId = SPACER) {
  const c = deriveCapabilities(genome, typeId);
  for (const k of FLOOR[typeId] ?? []) c[k] = true;
  if (typeId === SYNTH) { c.fertile = false; c.nurturing = false; c.metabolic = false; }
  c.crafter = c.sapient && c.dexterous;
  c.social = c.gregarious && (c.verbal || c.vocal);
  c.tier = c.crafter && c.verbal ? "cultural" : c.sapient ? "reflective" : c.mobile ? "instinctive" : "sessile";
  return c;
}

/** Contextual phenotype for a hand standing in a specific hull, right now. */
export function phenotype(genome, typeId = SPACER, ctx = createContext()) {
  return expressContextual(genome, typeId, ctx);
}

export { createContext, lifeStage, expectedLifespan };

/* The engine's relatedness() is a raw similarity: two unrelated people of the
 * same species already read about 0.5, because they are the same species. What
 * the game wants is the coefficient of relationship — 0 for strangers, 0.5 for
 * a parent or a full sibling, 0.25 for a half-sibling — so the species baseline
 * is measured once per entity type and divided out. The measurement is over
 * fixed seeds, so it is the same number on every device. */
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

/** Coefficient of relationship, 0..1. 0.5 is a parent or a full sibling. */
export function kinship(a, b, typeId = SPACER) {
  if (!a || !b) return 0;
  const base = speciesBaseline(typeId);
  const raw = G.relatedness(a, b, typeId);
  return r2(Math.max(0, Math.min(1, (raw - base) / Math.max(0.05, 1 - base))));
}

/** Above this, two people are family and the deck graph will not court them. */
export const KIN_BLOCK = 0.22;

/** "half-sibling" and the rest, for the crew sheet. */
export function kinLabel(k) {
  if (k >= 0.4) return "immediate family";
  if (k >= 0.2) return "half-sibling or closer";
  if (k >= 0.1) return "cousins";
  if (k >= 0.05) return "distant kin";
  return "no relation on file";
}

/**
 * How well two people fit, from their genomes rather than five rounded
 * numbers: shared outlook helps, opposite clocks help (someone has to hold
 * the other watch), two dominants clash, two hoarders clash over one hold.
 * −5…+5, the same scale crew.js's compat() has always spoken.
 */
export function genomeCompat(ga, gb) {
  if (!ga || !gb) return 0;
  const d = (i) => Math.abs((ga[i] ?? 0.5) - (gb[i] ?? 0.5));
  const both = (i) => ((ga[i] ?? 0.5) + (gb[i] ?? 0.5)) / 2;
  let c = 1.5;
  c += (1 - d(X.COOPERATION)) * 1.6;          // the same idea of a favour owed
  c += (1 - d(X.SOCIAL)) * 0.8;
  c += both(X.EMPATHY) * 1.2;                 // either one of them noticing helps
  c += d(X.CIRCADIAN_PHASE) * 0.9;            // opposite clocks share a hull well
  c -= d(X.DISCIPLINE) * 1.4;                 // one tidy, one not: this is the fight
  c -= both(X.AGGRESSION) * 1.8;
  c -= Math.min(ga[X.DOMINANCE] ?? 0.5, gb[X.DOMINANCE] ?? 0.5) * 1.6;
  c -= Math.min(ga[X.HOARDING] ?? 0.5, gb[X.HOARDING] ?? 0.5) * 1.2;
  c -= d(X.CULTURAL_MEME) * 0.6;              // they were raised on different decks
  return Math.max(-5, Math.min(5, r2(c)));
}

/** A child of two people. Real heredity — blocks, dominance, mutation, lineage stamp. */
export function breed(gA, gB, seed, typeId = SPACER) {
  return G.crossover(gA, gB, typeId, { seed: `breed:${seed}`, mutationScale: 0.045, blockLength: 12 });
}

export { G as engine, X as GENE };
