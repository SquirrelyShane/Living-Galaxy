/* LIVING GALAXY — tongues.
 *
 * Phoneme inventories, not name lists. Each entry describes how a people or
 * a reach of sky builds a word: which sounds can open a syllable, which can
 * close one, how long words run, and how a family name is shaped — because
 * the shape of the family name is the lore. The Sef have no surname, they
 * have a hull. T-Synth have a foundry line and a number. Brann have a father.
 *
 * Fields:
 *   on / nu / co   onsets, nuclei, codas
 *   syl            weighted word length, e.g. { 2: 6, 3: 3, 1: 1 }
 *   pCoda          chance a mid-word syllable closes on a consonant
 *   pCodaEnd       the same for the last syllable
 *   pBareStart     chance a word opens on its vowel
 *   mark / pMark   an infix the tongue uses (an apostrophe, a hyphen)
 *   ban            a regex of clusters this tongue will not produce
 *   end            gendered endings { f, m, n } glued to a given name
 *   given          curated names blended in at pCurated, where a people has
 *                  recognisable ones
 *   family         how surnames are made (see familyName in names.js)
 */

/* Shared ending sets — most tongues take one of these and tilt it. */
const END_COMMON = {
  f: ["a", "ia", "ea", "is", "ina", "ela", "ys", "ara", "ita", "ova", "ana", "ira", "e"],
  m: ["us", "or", "an", "en", "ek", "os", "ar", "im", "on", "ic", "av", "ov"],
  n: ["", "el", "yn", "ar", "in", "ai", "ev", "il", "ri", "ae"],
};
const END_HARD = {
  f: ["ka", "ra", "sha", "tha", "za", "na", "ga", "kha", "ura", "ira"],
  m: ["ak", "or", "ug", "esh", "rak", "un", "gar", "oth", "urn", "ov"],
  n: ["", "ek", "ash", "ur", "orn", "ik", "agh", "esk"],
};
const END_SOFT = {
  f: ["ae", "ia", "ith", "elle", "ys", "ienne", "ia", "ea", "iel", "anne"],
  m: ["ien", "eth", "ael", "is", "ion", "oel", "en", "ias"],
  n: ["", "ae", "el", "ien", "yl", "iel", "eth"],
};

/* Terran names people actually recognise — kept in the mix because a sky
 * with nothing familiar in it reads as costume rather than a place. */
/* 0.3.32 — the wide pools behind the hand-picked ones. The lists below stay
 * exactly as they were: they are the CORE, chosen for flavour and for a
 * deliberately global spread, and they still carry that job. What they could
 * not carry was volume — 44 given names and 65 surnames meant "Piotr" 37
 * times in three thousand terrans, and a vessel callsign is built off the
 * captain's surname, so the board repeated with them. See js/naming.js. */
import { HUMAN_GIVEN_M, HUMAN_GIVEN_F, HUMAN_LAST } from "../naming.js";

/* How often a curated draw takes the hand-picked core rather than the wide
 * pool. Measured over three thousand terrans, distinct first / distinct
 * surnames / commonest first name / draws that landed on a flavour name:
 *
 *   0.40   2248 / 1698 / Esme x18    / 118
 *   0.25   2421 / 2051 / Roman x11   /  80
 *   0.15   2511 / 2272 / Petra x8    /  45
 *   0.08   2585 / 2411 / Frankie x5  /  18
 *
 * 0.2 sits where a flavour name is still a recognisable seasoning — a couple
 * per hundred people — while the commonest name is under half a percent, so
 * nothing repeats at the scale anyone actually plays at. (Before: 1266 / 65 /
 * Piotr x37.) */
const P_CORE = 0.2;
const HUMAN_WIDE = { m: HUMAN_GIVEN_M, f: HUMAN_GIVEN_F, n: [...HUMAN_GIVEN_M, ...HUMAN_GIVEN_F] };

const TERRAN_GIVEN = {
  f: ["Petra", "Juno", "Odessa", "Sera", "Mira", "Lissa", "Saskia", "Vesna", "Tamsin", "Adaeze", "Ondine",
    "Ilva", "Marisol", "Dagny", "Yelena", "Sunniva", "Thea", "Noor", "Clea", "Bettina", "Rosa", "Anouk",
    "Ingrid", "Zaria", "Lucia", "Hanne", "Priya", "Esme", "Kaya", "Solveig", "Amara", "Neve", "Ottilie",
    "Freya", "Mirren", "Salome", "Talia", "Verity", "Imogen", "Beatriz", "Hana", "Suri", "Elke", "Nadia"],
  m: ["Marn", "Vance", "Bram", "Callum", "Tycho", "Dovan", "Harrow", "Teodor", "Halvard", "Imre", "Corin",
    "Ozren", "Yusuf", "Ryo", "Kepler", "Anders", "Gideon", "Mattias", "Rafe", "Osric", "Casimir", "Emrys",
    "Tobias", "Lars", "Idris", "Ansel", "Dmitri", "Rune", "Hollis", "Barnaby", "Ferran", "Konrad", "Silas",
    "Otto", "Piotr", "Amadou", "Ewan", "Leif", "Roman", "Thaddeus", "Kwame", "Nico", "Bastian", "Ilan"],
  n: ["Ede", "Sol", "Ilya", "Rooke", "Ash", "Kestrel", "Bel", "Lior", "Quill", "Wren", "Marlow", "Bly",
    "Ren", "Sasha", "Vale", "Noa", "Kit", "Arden", "Sage", "Robin", "Emery", "Rowan", "Hale", "Lennox",
    "Onyx", "Ellis", "Cove", "Auden", "Indigo", "Linden", "Jules", "Sasha", "Ari", "Wynn"],
};
const TERRAN_LAST = ["Voss", "Andrade", "Kirchner", "Sao", "Malloy", "Deleon", "Okafor", "Straud", "Vane",
  "Cardosa", "Ilves", "Renn", "Skarsgard", "Motta", "Quill", "Ferro", "Halloran", "Mbeki", "Tanaka-Ruiz",
  "Orlov", "Sundqvist", "Achebe", "Varga", "Lindqvist", "Ashby", "Nakamura", "Petrosyan", "Delacroix",
  "Beaumont", "Osei", "Hollander", "Kaur", "Moreau", "Sandoval", "Eriksen", "Adeyemi", "Novak", "Rahman",
  "Castellanos", "Whitlock", "Oyelaran", "Bergstrom", "Iqbal", "Marchetti", "Dubois", "Nkemelu", "Solberg",
  "Aguilar", "Havel", "Tsehai", "Brandt", "Okonkwo", "Salvatierra", "Wexler", "Mbatha", "Ferreira",
  "Dagher", "Lindholm", "Espinoza", "Ravenna", "Sokolov", "Ng", "Abadi", "Kristensen", "Ocampo"];

export const LEXICONS = {
  /* Sol and everywhere Sol shipped people. Broad, familiar, no one flavour. */
  terran: {
    on: ["b", "d", "k", "m", "n", "r", "s", "t", "v", "l", "h", "p", "g", "f", "br", "dr", "kr", "st", "tr", "gr", "cl", "sh", "th", "z", "fl", "pr"],
    nu: ["a", "a", "e", "e", "i", "i", "o", "o", "u", "ia", "ei", "io"],
    co: ["n", "r", "s", "l", "m", "d", "k", "t", "st", "nd", "rk", "ll", "ss"],
    syl: { 2: 8, 1: 1, 3: 1 }, givenSyl: { 2: 9, 1: 1 },
    pCoda: 0.32, pCodaEnd: 0.5, pBareStart: 0.12,
    noDoubleVowel: true,
    end: END_COMMON,
    given: TERRAN_GIVEN, pCurated: 0.62, wide: HUMAN_WIDE, pCore: P_CORE,
    family: { kind: "list", pool: TERRAN_LAST, wide: HUMAN_LAST, pCore: P_CORE },
  },

  /* Grown to a specification and aware of it. A handle and a foundry line. */
  tsynth: {
    on: ["k", "t", "x", "z", "v", "s", "n", "r", "d", "kr", "tr", "vr", "st", "sk", "dr", "ph", "th"],
    nu: ["a", "e", "i", "o", "y", "ei", "ie"],
    co: ["x", "n", "s", "k", "t", "r", "ct", "st", "nx", "rk"],
    syl: { 2: 7, 1: 3 }, givenSyl: { 2: 8, 1: 2 },
    pCoda: 0.42, pCodaEnd: 0.6, pBareStart: 0.06,
    noDoubleVowel: true,
    end: {
      f: ["a", "ix", "ia", "en", "ys", "ara"],
      m: ["us", "ax", "or", "es", "on", "ux"],
      n: ["", "ix", "yx", "en", "ar", "os"],
    },
    family: { kind: "line", pool: ["Ceres", "Tethys", "Iapetus", "Rhea", "Dione", "Mimas", "Pallas", "Vesta", "Hygiea", "Eunomia", "Psyche", "Kalliope", "Themis", "Interamnia"] },
  },

  /* Spin gravity a third of standard and a sky full of nothing. Airy. */
  eridian: {
    on: ["l", "v", "s", "th", "r", "n", "m", "sh", "f", "h", "y", "zh", "sl", "vr", "thr"],
    nu: ["a", "e", "e", "i", "i", "ae", "ea", "ia", "ei", "io", "o", "u", "ie"],
    co: ["n", "l", "r", "s", "th", "ss", "ln"],
    syl: { 2: 8, 3: 2 },
    pCoda: 0.2, pCodaEnd: 0.34, pBareStart: 0.22,
    noDoubleVowel: true,
    end: END_SOFT,
    family: { kind: "plain", syl: { 2: 6, 3: 2 }, suffix: ["ieth", "ael", "aren", "iel"] },
  },

  /* Deep-cold drift. Hard consonants worn smooth by long vowels. */
  vantari: {
    on: ["v", "s", "sk", "st", "thr", "k", "n", "r", "t", "sv", "fr", "gl", "kv", "hv"],
    nu: ["a", "o", "u", "ei", "au", "e", "i", "y"],
    co: ["n", "r", "st", "sk", "ld", "rn", "s", "k", "ft"],
    syl: { 2: 7, 3: 2 }, givenSyl: { 2: 9, 1: 1 },
    pCoda: 0.42, pCodaEnd: 0.62, pBareStart: 0.08,
    end: {
      f: ["a", "va", "na", "sa", "dis", "hild", "run"],
      m: ["ar", "ulf", "vid", "orn", "ek", "un", "mar"],
      n: ["", "ir", "eld", "ost", "vin", "sk"],
    },
    family: { kind: "compound", a: ["Frost", "Cold", "Storm", "Ice", "Deep", "Grim", "Snow", "Hail", "North", "Still", "Rime", "Dark"], b: ["brook", "keel", "hand", "brand", "ward", "fall", "helm", "vane", "drift", "bank", "reach", "mark"] },
  },

  /* High gravity. Short words, heavy endings, nothing decorative. */
  korrash: {
    on: ["k", "g", "d", "t", "kr", "gr", "dr", "thr", "br", "kh", "gh", "zh", "tr", "vr", "skr"],
    nu: ["a", "o", "u", "e", "i", "ur", "ar", "ai", "ou"],
    co: ["k", "g", "rk", "rg", "sh", "th", "kh", "gh", "rn", "sk", "d", "ll"],
    syl: { 2: 7, 1: 3, 3: 1 }, givenSyl: { 2: 8, 1: 2 },
    pCoda: 0.6, pCodaEnd: 0.78, pBareStart: 0.04,
    ban: /[aeiou]{3}/,
    end: END_HARD,
    family: { kind: "clan", syl: { 1: 5, 2: 5 } },
  },

  /* Born, married and buried aboard. No surname — a hull. */
  sef: {
    on: ["s", "m", "n", "l", "v", "d", "b", "r", "t", "sh", "br", "dr", "fl", "gl"],
    nu: ["a", "a", "e", "e", "i", "o", "o", "ei", "oa", "ie", "ou"],
    co: ["n", "m", "l", "r", "s", "v", "nd", "lt"],
    syl: { 2: 7, 3: 2, 1: 1 },
    pCoda: 0.26, pCodaEnd: 0.4, pBareStart: 0.14,
    end: END_COMMON,
    family: {
      kind: "of", word: "of the", syl: { 2: 6, 1: 2 },
      tail: ["", "", " Marrow", " Line", " Wake", " Keel", " Gate", " Run", " Ledger", " Hold"],
    },
  },

  /* Cinder belts. Everything sounds a little burnt. */
  ashwalker: {
    on: ["sh", "ch", "k", "s", "t", "skr", "chr", "r", "h", "thr", "str", "br", "kr", "m", "n", "v"],
    nu: ["a", "e", "i", "o", "u", "er", "or", "ai"],
    co: ["sh", "ch", "sk", "st", "rk", "sh", "t", "k", "nd", "rn"],
    syl: { 2: 8, 1: 2 }, givenSyl: { 2: 8, 1: 2 },
    pCoda: 0.55, pCodaEnd: 0.72, pBareStart: 0.1,
    end: {
      f: ["a", "ash", "ika", "esa", "ura", "eth"],
      m: ["ek", "ash", "or", "ur", "ok", "esk"],
      n: ["", "ash", "sk", "ir", "en", "urn"],
    },
    family: { kind: "compound", a: ["Ash", "Cinder", "Char", "Soot", "Ember", "Scorch", "Smoke", "Slag", "Coal", "Flint", "Dust", "Ruin"], b: ["fall", "walk", "wake", "ridge", "hand", "mark", "row", "drift", "vein", "gate", "born", "spur"] },
  },

  /* Ring farms round the giants. Liquid, nasal, nothing sharp. */
  myrrin: {
    on: ["m", "n", "l", "r", "y", "w", "ml", "nr", "v", "mn", "ly", "ny", "rh", "lh"],
    nu: ["a", "e", "i", "u", "y", "ia", "ai", "ui", "yo", "ae"],
    co: ["n", "m", "l", "r", "ll", "nn", "rr"],
    syl: { 2: 7, 3: 3 }, givenSyl: { 2: 8, 3: 2 },
    pCoda: 0.2, pCodaEnd: 0.34, pBareStart: 0.2,
    end: {
      f: ["a", "ia", "ala", "ine", "yra", "ella", "una"],
      m: ["an", "el", "ien", "aro", "oll", "ur"],
      n: ["", "in", "yl", "ary", "en", "ol"],
    },
    family: { kind: "of", word: "of", syl: { 2: 6, 3: 2 }, tail: ["", " Ring", " Reach", " Green", " Loft", " Span", " Terrace"] },
  },

  /* Subsurface warrens. Clustered consonants, deep vowels, long words. */
  delvath: {
    on: ["d", "v", "th", "g", "b", "dr", "gr", "vr", "thv", "gl", "bl", "dw", "kv", "zv"],
    nu: ["o", "u", "a", "au", "ou", "e", "i", "oa"],
    co: ["th", "d", "v", "g", "lv", "rd", "ng", "gh", "lth", "rth"],
    syl: { 2: 8, 3: 1 }, givenSyl: { 2: 9, 1: 1 },
    pCoda: 0.5, pCodaEnd: 0.68, pBareStart: 0.06,
    end: {
      f: ["a", "va", "utha", "odra", "ath", "ola"],
      m: ["ov", "uth", "dur", "oth", "agh", "or"],
      n: ["", "eth", "ud", "avh", "og", "ulv"],
    },
    family: { kind: "plain", syl: { 2: 7, 1: 2 }, suffix: ["dur", "vath", "gorn", "thul"] },
  },

  /* Raised on contract. The given name is plain; the surname is an employer. */
  oberlin: {
    on: ["b", "k", "m", "n", "r", "s", "t", "v", "l", "d", "p", "h", "gr", "br", "cl", "fr"],
    nu: ["a", "a", "e", "e", "i", "i", "o", "o", "u", "ei", "ou"],
    co: ["n", "r", "s", "l", "t", "d", "ll", "rt", "nd"],
    syl: { 2: 8, 1: 2, 3: 1 }, givenSyl: { 2: 9, 1: 1 },
    pCoda: 0.32, pCodaEnd: 0.48, pBareStart: 0.12,
    noDoubleVowel: true,
    end: END_COMMON,
    given: TERRAN_GIVEN, pCurated: 0.45, wide: HUMAN_WIDE, pCore: P_CORE,
    family: {
      kind: "corp",
      pool: ["Oberlin", "Halcyon", "Meridian", "Caldwell", "Ternary", "Auspex", "Kestrel", "Lodestar", "Arbiter", "Tessellate", "Vantage", "Ironquill", "Sable", "Continuum"],
      grade: ["Grade", "Indenture", "Charter", "Tier", "Cohort", "Clause", "Term", "Batch", "Series", "Warrant"],
    },
  },

  /* The shatter-fields. Sibilants and a glottal stop where a vowel should be. */
  haask: {
    on: ["h", "s", "sh", "k", "ss", "hs", "skh", "zh", "khr", "ts", "z", "th", "shr"],
    nu: ["aa", "a", "ee", "i", "ii", "ae", "oo", "e"],
    co: ["sk", "ss", "sh", "k", "th", "zt", "hk", "s"],
    syl: { 2: 6, 1: 3, 3: 1 }, givenSyl: { 2: 8, 1: 2 },
    pCoda: 0.58, pCodaEnd: 0.76, pBareStart: 0.1,
    mark: "'", pMark: 0.4,
    end: {
      f: ["aa", "ish", "saa", "ika", "esh"],
      m: ["ask", "ess", "kaa", "ith", "urs"],
      n: ["", "sk", "aa", "ith", "zt"],
    },
    family: { kind: "plain", syl: { 2: 6, 1: 3 }, suffix: ["ssk", "haan", "zeth"] },
  },

  /* Nobody agrees, and the Veyd have not clarified. One long name, no family. */
  veyd: {
    on: ["v", "y", "l", "s", "n", "th", "w", "r", "m", "sy", "vy", "ly", "hy"],
    nu: ["ey", "ae", "ai", "ei", "ia", "oe", "y", "ee", "a", "e", "i"],
    co: ["n", "l", "s", "th", "r", "y"],
    syl: { 2: 7, 3: 3 }, givenSyl: { 2: 7, 3: 3 },
    pCoda: 0.26, pCodaEnd: 0.46, pBareStart: 0.18,
    noDoubleVowel: true,
    ban: /[bcdgkpqtx]/,
    end: {
      f: ["ae", "eya", "iel", "ys", "aeth"],
      m: ["eyn", "ael", "ivo", "esh", "oen"],
      n: ["", "ey", "ael", "ynn", "aeth", "ioe"],
    },
    family: { kind: "none" },
  },

  /* Shipyard clans of the outer docks. You are your father's, and it shows. */
  brann: {
    on: ["b", "br", "h", "hv", "k", "s", "sk", "st", "t", "th", "g", "gr", "r", "n", "f", "fr"],
    nu: ["a", "o", "e", "ei", "au", "u", "i"],
    co: ["n", "r", "rn", "ld", "st", "lf", "rk", "nd", "g"],
    syl: { 2: 8, 3: 1, 1: 1 }, givenSyl: { 2: 9, 1: 1 },
    pCoda: 0.46, pCodaEnd: 0.64, pBareStart: 0.08,
    end: {
      f: ["a", "hild", "run", "dis", "borg", "gerd"],
      m: ["ar", "vard", "ulf", "stein", "mund", "grim"],
      n: ["", "ir", "ald", "sten", "vor"],
    },
    family: { kind: "patronym", syl: { 2: 7, 1: 3 }, f: ["sdottir", "sdatter"], m: ["sson", "sen", "sland"], n: ["sbarn", "sen", "sbrood"] },
  },

  /* Medical orders out of the old core. Soft, and always attached to a house. */
  sirrah: {
    on: ["s", "sr", "r", "l", "m", "n", "th", "sh", "v", "h", "y", "c", "ph"],
    nu: ["i", "a", "e", "ia", "ah", "ei", "ie", "ua"],
    co: ["r", "l", "n", "s", "h", "m", "rr"],
    syl: { 2: 8, 3: 2 }, givenSyl: { 2: 8, 3: 2 },
    pCoda: 0.22, pCodaEnd: 0.38, pBareStart: 0.2,
    end: END_SOFT,
    family: {
      kind: "of", word: "of", syl: { 2: 6, 3: 2 },
      tail: [" House", " Ward", " Order", " Chapter", " Hospice", " Rule", " Lantern", " Quiet"],
    },
  },

  /* Border fleets that never stood down. Clipped, and hyphenated by unit. */
  kethran: {
    on: ["k", "t", "th", "r", "n", "d", "v", "kr", "tr", "thr", "str", "g", "s", "sk"],
    nu: ["e", "a", "i", "o", "ae", "ea"],
    co: ["n", "th", "r", "k", "st", "rn", "nd", "sk", "t"],
    syl: { 2: 7, 1: 2, 3: 1 }, givenSyl: { 2: 8, 1: 2 },
    pCoda: 0.5, pCodaEnd: 0.68, pBareStart: 0.08,
    end: {
      f: ["a", "ira", "eth", "ena", "isk", "ava"],
      m: ["an", "en", "ek", "orn", "ur", "as"],
      n: ["", "en", "ir", "ath", "esk", "on"],
    },
    family: { kind: "clan", syl: { 1: 4, 2: 6 } },
  },
};

export const DEFAULT_LEX = LEXICONS.terran;

/* ---- sky tongues --------------------------------------------------------
 * Every system names its worlds from one of these, so the bodies in a sky
 * sound like neighbours. Deliberately not the same set as the race tongues:
 * a world is named by whoever charted it first, and the charts are older
 * than anyone currently flying.
 */
export const TONGUES = [
  { /* the old survey tongue — this is what p10's ROOTS/TAILS sounded like */
    on: ["k", "v", "p", "th", "c", "m", "oph", "t", "ir", "n", "s", "h", "d", "y", "q", "r", "l", "x", "z", "b"],
    nu: ["a", "e", "i", "o", "u", "ae", "ia", "eo", "y", "au"],
    co: ["s", "r", "n", "l", "th", "x", "ph", "m", "ss", "nd"],
    syl: { 2: 6, 3: 3 }, pCoda: 0.3, pCodaEnd: 0.5, pBareStart: 0.18,
  },
  { /* liturgical — long, vowel-heavy, named by whoever came with a telescope and a creed */
    on: ["s", "th", "l", "m", "n", "r", "v", "c", "h", "y", "ph", "chr", "sl"],
    nu: ["a", "e", "i", "ia", "ae", "ei", "io", "ea", "au", "ou"],
    co: ["n", "l", "s", "th", "m", "r"],
    syl: { 3: 5, 2: 5 }, pCoda: 0.16, pCodaEnd: 0.34, pBareStart: 0.26,
  },
  { /* the hard reaches — short and blunt, named by people in a hurry */
    on: ["k", "g", "d", "t", "br", "kr", "gr", "dr", "st", "tr", "vr", "zg", "pl"],
    nu: ["a", "o", "u", "e", "ur", "or"],
    co: ["k", "g", "rk", "st", "sk", "rn", "d", "th", "ng"],
    syl: { 2: 7, 1: 2, 3: 1 }, pCoda: 0.54, pCodaEnd: 0.7, pBareStart: 0.06,
  },
  { /* meltwater tongue — flowing, lots of l and r */
    on: ["l", "r", "m", "n", "v", "w", "fl", "gl", "bl", "sl", "y", "h", "rh"],
    nu: ["a", "e", "i", "o", "u", "ua", "ai", "eo", "ui", "oa"],
    co: ["l", "n", "r", "m", "ll", "rn", "s"],
    syl: { 2: 6, 3: 4 }, pCoda: 0.2, pCodaEnd: 0.38, pBareStart: 0.2,
  },
  { /* the sibilant charts — hissing names for hot skies */
    on: ["s", "sh", "z", "ts", "sk", "st", "x", "th", "ch", "zh", "sp", "r", "n", "k"],
    nu: ["a", "i", "e", "ae", "o", "ea", "y", "u"],
    co: ["s", "sh", "ss", "x", "sk", "th", "z", "n", "r"],
    syl: { 2: 7, 3: 2 }, pCoda: 0.5, pCodaEnd: 0.66, pBareStart: 0.12, noDoubleVowel: true,
  },
  { /* deep-field designation tongue — heavy on stops, reads like machine output */
    on: ["k", "t", "p", "x", "v", "q", "z", "kt", "px", "tz", "qu", "dr", "br"],
    nu: ["a", "e", "i", "o", "y", "ei", "ou"],
    co: ["x", "k", "t", "z", "ct", "nx", "rk", "pt"],
    syl: { 2: 7, 1: 2, 3: 1 }, pCoda: 0.46, pCodaEnd: 0.64, pBareStart: 0.06, noDoubleVowel: true,
  },
  { /* nasal tongue — hummed names, common in the ring reaches */
    on: ["m", "n", "ng", "mn", "nm", "l", "y", "w", "h", "r", "v"],
    nu: ["a", "u", "o", "i", "ia", "ua", "ao", "uu"],
    co: ["m", "n", "ng", "nn", "l"],
    syl: { 2: 6, 3: 4 }, pCoda: 0.3, pCodaEnd: 0.44, pBareStart: 0.22,
  },
  { /* the old colonial tongue — vaguely familiar, half-remembered Earth */
    on: ["b", "c", "d", "f", "g", "l", "m", "n", "p", "r", "s", "t", "v", "tr", "br", "cl", "st", "gr"],
    nu: ["a", "e", "i", "o", "u", "ia", "io", "ea", "au"],
    co: ["n", "s", "r", "l", "m", "t", "nt", "st", "rd", "ll"],
    syl: { 2: 7, 3: 3 }, pCoda: 0.36, pCodaEnd: 0.52, pBareStart: 0.16,
  },
];
