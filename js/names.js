/* LIVING GALAXY — the name forge.
 *
 * One assembler, many tongues. Names are built out of phonemes rather than
 * drawn from a list, so the supply is effectively bottomless and a name
 * carries information: a Korrash sounds like a Korrash, a world in the
 * Oph reach sounds like its neighbours, and a rock that has been on the
 * charts long enough to kill something has earned a name instead of a
 * designation.
 *
 * Everything here is seeded and pure. Pass an rng in and the same seed gives
 * the same sky on every device; pass nothing and it rolls.
 *
 *   personName("korrash", "woman", rnd)   -> { first, last, full }
 *   worldName(sky, { kind, arch, settled }, rnd)
 *   moonName(parentName, index, sky, rnd)
 *   rockName(seq, radius, rnd)
 *   skyTongue(seed)                       -> a lexicon every world in one
 *                                            system is named from
 */

import { LEXICONS, TONGUES, DEFAULT_LEX } from "./data/lexicons.js";

/* ---- seeding ------------------------------------------------------------ */

export function nameRng(seedStr) {
  let n = 0;
  const s0 = String(seedStr ?? "");
  for (let i = 0; i < s0.length; i++) n = Math.imul(n ^ s0.charCodeAt(i), 2654435761) >>> 0;
  let s = n || 7;
  return () => {
    s |= 0; s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const pick = (rnd, a) => a[Math.floor(rnd() * a.length)];
const chance = (rnd, p) => rnd() < p;

/** Weighted pick over a { key: weight } table. Returns the key. */
function weighted(rnd, table) {
  let total = 0;
  for (const k in table) total += table[k];
  let r = rnd() * total;
  for (const k in table) { r -= table[k]; if (r <= 0) return k; }
  return Object.keys(table)[0];
}

const cap = (s) => (s ? s[0].toUpperCase() + s.slice(1) : s);

/* ---- the assembler ------------------------------------------------------
 * A word is a run of syllables. Each syllable is onset + nucleus + coda,
 * any of which a tongue may leave empty. The rules that matter are the ones
 * that stop it sounding like keyboard mash: no three of the same letter, no
 * coda that collides with the next onset, and a tongue-specific ban list.
 */

const DIGRAPH = /^(th|sh|ch|zh|ph|ng|ss|ll|rr|nn|kh|gh|hs|ts)$/;
const VOWEL = /[aeiouy]/;

/** Onsets a syllable may take when the one before it closed on a consonant. */
function simpleOnsets(lex) {
  if (!lex._on1) {
    lex._on1 = lex.on.filter((o) => o.length <= 1 || DIGRAPH.test(o));
    if (!lex._on1.length) lex._on1 = lex.on.map((o) => o[0]);
  }
  return lex._on1;
}

/* A syllable knows what came before it. That one fact is what separates a
 * name from keyboard mash: a closed syllable is followed by a light onset,
 * never by another three-consonant cluster, and no sound is used twice
 * running. */
function syllable(lex, rnd, { first, last, prevCoda, prevOn }) {
  let on;
  if (first && chance(rnd, lex.pBareStart ?? 0.12)) {
    on = "";
  } else {
    const pool = prevCoda ? simpleOnsets(lex) : lex.on;
    on = pick(rnd, pool);
    if (on && on === prevOn) on = pick(rnd, pool);
    if (prevCoda && on && prevCoda.slice(-1) === on[0]) on = "";
  }
  const nu = pick(rnd, lex.nu);
  /* A cluster onset has already spent the syllable's consonant budget. */
  const heavy = on.length > 1 && !DIGRAPH.test(on);
  const pCoda = (last ? (lex.pCodaEnd ?? 0.55) : (lex.pCoda ?? 0.3)) * (heavy ? 0.45 : 1);
  let co = chance(rnd, pCoda) ? pick(rnd, lex.co) : "";
  if (co && heavy && co.length > 1) co = co[0];
  return { on, nu, co, text: on + nu + co };
}

/** Clean up the joins between syllables without flattening the tongue. */
function smooth(w, lex) {
  let out = w;
  out = out.replace(/(.)\1\1+/g, "$1$1");                 // no trebles
  out = out.replace(/([bcdfgjkpqtvxz])\1/g, "$1");        // stops don't double
  out = out.replace(/[aeiouy]{4,}/g, (m) => m.slice(0, 2));
  if (lex.noDoubleVowel) out = out.replace(/([aeiou])\1/g, "$1");
  return out;
}

/* A forge that draws from phonemes will eventually draw something the player
 * did not want to read on a crew manifest. Cheap to check, embarrassing to
 * skip: "Clitor" came out of the Oberlin tongue on the second sampling run.
 * HARD fragments are rejected anywhere in a word; EDGE fragments only where
 * they start or end one, so ordinary names like Kassar and Titania survive. */
const HARD = ["fuck", "shit", "cunt", "nigg", "rape", "slut", "whor", "twat", "wank",
  "bitch", "penis", "vagin", "clit", "semen", "scrot", "testic", "anus", "feces",
  "faeces", "dildo", "bollock", "bastard", "spunk", "turd", "retard", "tranny",
  "chink", "wetback", "molest", "incest", "pedo", "nonce", "spastic", "tits", "titty"];
const EDGE = ["ass", "cock", "dick", "piss", "fag", "cum", "jap", "homo",
  "gook", "kike", "coon", "spic", "queer", "prick", "crap"];

export function offensive(w) {
  const s = w.toLowerCase();
  for (const f of HARD) if (s.includes(f)) return true;
  for (const f of EDGE) if (s.startsWith(f) || s.endsWith(f)) return true;
  return false;
}

/* A word nobody could say out loud is not a name. Four cheap checks catch
 * nearly all of them. */
function sayable(w, lex, want) {
  if (w.length < 2 || w.length > Math.min(11, 3 + 3 * want)) return false;
  if (!VOWEL.test(w)) return false;
  if (!/[^aeiouy]/.test(w)) return false;                 // all vowels is not a word either
  if (/[^aeiouy]{4,}/.test(w)) return false;              // four consonants in a row
  /* The same consonant three times over reads as a stutter, not a tongue. */
  for (const c of new Set(w.replace(/[aeiouy]/g, ""))) {
    if (w.split(c).length - 1 > 2) return false;
  }
  if (lex.ban && lex.ban.test(w)) return false;
  if (offensive(w)) return false;
  return true;
}

/**
 * Build a raw word in a tongue. `syl` overrides the tongue's own length
 * table — worlds want longer words than call signs do.
 */
export function forgeWord(lex, rnd, syl) {
  const want = Math.min(4, Number(syl ?? weighted(rnd, lex.syl ?? { 2: 6, 3: 3, 1: 1 })));
  let best = null;
  for (let attempt = 0; attempt < 12; attempt++) {
    let w = "";
    let prevCoda = "";
    let prevOn = "";
    for (let i = 0; i < want; i++) {
      const s = syllable(lex, rnd, { first: i === 0, last: i === want - 1, prevCoda, prevOn });
      w += s.text;
      prevCoda = s.co;
      prevOn = s.on;
    }
    w = smooth(w, lex);
    if (!best && w.length >= 2) best = w;
    if (!sayable(w, lex, want)) continue;
    if (lex.mark && chance(rnd, lex.pMark ?? 0)) {
      const at = 1 + Math.floor(rnd() * Math.max(1, w.length - 2));
      w = w.slice(0, at) + lex.mark + w.slice(at);
    }
    return cap(w);
  }
  /* Twelve rejects means the tongue is a tight one. Fall back to its
   * simplest possible shape rather than shipping mush. */
  const lite = cap(pick(rnd, simpleOnsets(lex)) + pick(rnd, lex.nu) + (chance(rnd, 0.4) ? pick(rnd, lex.co) : ""));
  return sayable(lite.toLowerCase(), lex, 1) ? lite : cap((best ?? "sol").slice(0, 8));
}

/* ---- people -------------------------------------------------------------
 * Gender rides on the ending rather than on a separate word list, which is
 * how most real tongues do it and what makes the supply bottomless. A share
 * of every draw takes the neutral set regardless, so a crew list still tells
 * you less than a face does — the same intent the three-pool split had, with
 * four orders of magnitude more names behind it.
 */

/* How often a given name takes the neutral ending set instead of its own.
 *
 * 18% was chosen so a crew list tells you less than a face does, which is a
 * nice idea and the wrong call for this game: the tongues are invented, so a
 * player has no ear for them, and a name with no gender signal does not read
 * as ambiguous — it reads as male, which is the default anyone brings to a
 * sci-fi crew roster. At 10% the ending still varies without the whole list
 * defaulting one way. */
const AMBIGUOUS = 0.10;

function endingFor(lex, gender, rnd) {
  const set = lex.end ?? DEFAULT_LEX.end;
  if (gender === "nonbinary" || chance(rnd, AMBIGUOUS)) return pick(rnd, set.n);
  return pick(rnd, gender === "woman" ? set.f : set.m);
}

/** Glue an ending on without stacking vowels or repeating the last sound. */
function affix(stem, end) {
  if (!end) return stem;
  const v = /[aeiouy]/i;
  if (v.test(stem.slice(-1)) && v.test(end[0])) stem = stem.slice(0, -1);
  if (stem.toLowerCase().endsWith(end.toLowerCase())) return stem;
  /* The join is where vowel piles come from: "Waero" + "ioe". Trim it here
   * rather than shipping something nobody can pronounce. */
  return (stem + end).replace(/[aeiouy]{3,}/gi, (m) => m.slice(0, 2));
}

export function givenName(lex, gender, rnd) {
  /* Curated names stay in the mix for the tongues that have them — a sky
   * with no familiar names in it reads as costume rather than place.
   *
   * 0.3.32: there are two curated pools now, not one. `given` is the CORE —
   * forty-odd names chosen by hand for flavour and for a deliberately global
   * spread, the ones that make a terran deck sound like a terran deck.
   * `wide` is thousands, vendored, behind it. Before this there was only the
   * core, and it showed: "Piotr" came up 37 times in three thousand terrans.
   * Drawing mostly from the wide pool fixes the repetition; still drawing
   * from the core often enough keeps the flavour that was picked on purpose. */
  if (lex.given && chance(rnd, lex.pCurated ?? 0)) {
    const set = lex.given;
    const key = gender === "nonbinary" || chance(rnd, AMBIGUOUS) ? "n" : gender === "woman" ? "f" : "m";
    const wide = lex.wide?.[key];
    const core = set[key] ?? set.n;
    const pool = wide?.length && !chance(rnd, lex.pCore ?? 1) ? wide : core;
    if (pool?.length) return pick(rnd, pool);
  }
  let stem = forgeWord(lex, rnd, weighted(rnd, lex.givenSyl ?? { 2: 7, 1: 2, 3: 2 }));
  let name = affix(stem, endingFor(lex, gender, rnd));
  /* A given name is something somebody shouts across a deck. Eleven letters
   * is already generous; past that, take the short form of the tongue. */
  /* The join can make one the syllables never held: "Cli" + "tor". */
  for (let i = 0; i < 6 && (name.length > 12 || offensive(name)); i++) {
    stem = forgeWord(lex, rnd, 2);
    name = affix(stem, endingFor(lex, gender, rnd));
  }
  return offensive(name) ? cap(stem) : name;
}

/**
 * Family name. Tongues carry a `family` shape describing how their people
 * are placed — a clan, a crèche contract, a barge, a foundry line — and it
 * is that shape, not a surname list, that makes Sef read as Sef.
 */
export function familyName(lex, rnd, gender) {
  /* The join is where these appear — "Skanu" + "sdatter" makes a word the
   * syllables never held. Six tries, then the bare stem. */
  for (let i = 0; i < 6; i++) {
    const n = buildFamily(lex, rnd, gender);
    if (!offensive(n)) return n;
  }
  return "";
}

function buildFamily(lex, rnd, gender) {
  const shape = lex.family ?? { kind: "plain" };
  const stem = () => forgeWord(lex, rnd, weighted(rnd, shape.syl ?? { 2: 6, 3: 3, 1: 1 }));
  switch (shape.kind) {
    case "none":
      return "";
    case "list":
      /* same core/wide split as the given names: the hand-picked pool carries
       * the flavour, the vendored one carries the variety (0.3.32) */
      return shape.wide?.length && !chance(rnd, shape.pCore ?? 1)
        ? pick(rnd, shape.wide)
        : pick(rnd, shape.pool);
    case "of":                       // "of the Long Marrow" — barge and order folk
      return `${shape.word ?? "of"} ${cap(stem())}${shape.tail ? pick(rnd, shape.tail) : ""}`;
    case "clan":                     // "Ostrek-Vane" — shipyard and border clans
      return `${stem()}-${stem()}`;
    case "line": {                   // "Tethys-4417" — spec-born, and they know it
      const n = 1000 + Math.floor(rnd() * 8999);
      return `${pick(rnd, shape.pool)}-${n}`;
    }
    case "patronym": {               // "Halvarsdottir" — the outer docks
      const suf = gender === "woman" ? shape.f : gender === "man" ? shape.m : shape.n;
      return affix(stem(), pick(rnd, suf ?? shape.n));
    }
    case "corp":                     // "Oberlin Grade" — raised on contract
      return `${pick(rnd, shape.pool)} ${pick(rnd, shape.grade)}`;
    case "compound":                 // "Ashfall", "Cinderwake"
      return cap(pick(rnd, shape.a) + pick(rnd, shape.b));
    default: {
      const s = cap(stem());
      return shape.suffix && chance(rnd, 0.5) ? affix(s, pick(rnd, shape.suffix)) : s;
    }
  }
}

/** The family part of a full name — everything after the given name. */
export function familyOf(fullName) {
  const parts = String(fullName ?? "").trim().split(/\s+/);
  return parts.length > 1 ? parts.slice(1).join(" ") : "";
}

/**
 * What a child born aboard is called. Most tongues hand the family name
 * straight down; the Brann do not have one to hand down, they have a father,
 * so a Brann child is named off whichever parent's given name they take. The
 * Veyd have no family name at all and the child gets none either.
 */
export function childFamily(sire, carrier, gender, raceId, rnd = Math.random) {
  const lex = LEXICONS[raceId] ?? DEFAULT_LEX;
  const shape = lex.family ?? { kind: "plain" };
  if (shape.kind === "none") return "";
  if (shape.kind === "patronym") {
    const stem = String(sire?.name ?? carrier?.name ?? "").trim().split(/\s+/)[0];
    if (stem) {
      const suf = gender === "woman" ? shape.f : gender === "man" ? shape.m : shape.n;
      for (let i = 0; i < 6; i++) {
        const n = affix(stem, pick(rnd, suf ?? shape.n ?? [""]));
        if (!offensive(n)) return n;
      }
    }
  }
  return familyOf(sire?.name) || familyOf(carrier?.name) || familyName(lex, rnd, gender);
}

/**
 * A whole person. `race` is a race id from races.js; anything unknown falls
 * back to the common tongue, so a new race added later still gets names.
 */
export function personName(race, gender, rnd = Math.random) {
  const lex = LEXICONS[race] ?? DEFAULT_LEX;
  const first = givenName(lex, gender, rnd);
  const last = familyName(lex, rnd, gender);
  return { first, last, full: last ? `${first} ${last}` : first };
}

/* ---- worlds -------------------------------------------------------------
 * Every system picks one tongue and names its worlds from it, so a sky
 * hangs together — you can hear that Ophiath and Ophelune are neighbours.
 * On top of that sit two other registers. A world nobody lives on often
 * never got past its survey designation; a world people settled usually
 * carries the name of whoever was first onto it.
 */

export function skyTongue(seed) {
  const rnd = nameRng(`tongue:${seed}`);
  return TONGUES[Math.floor(rnd() * TONGUES.length)];
}

const CATALOGUES = ["HD", "HIP", "GJ", "LX", "TYC", "BD", "KX", "PPM", "WISE", "UCAC"];
const COLONY_HEAD = ["New", "New", "New", "Port", "Port", "Second", "Little", "Fort", "Camp", "Old"];
const COLONY_TAIL = ["Landing", "Rest", "Reach", "Hold", "Crossing", "Watch", "Fall", "Anchorage", "Shelf", "Bight", "March", "Downs"];

/** A survey designation for a star: "HD 4181", "LX-2276". */
export function catalogueRoot(rnd) {
  const cat = pick(rnd, CATALOGUES);
  const n = 100 + Math.floor(rnd() * 9900);
  return chance(rnd, 0.5) ? `${cat} ${n}` : `${cat}-${n}`;
}

const ORBIT_LETTERS = "bcdefghijklmn";

/**
 * Name a world.
 *
 *   sky   { tongue, root, seed }  from skyNaming()
 *   info  { kind, arch, settled, index }
 *
 * `index` is the orbital slot, used for catalogue letters so that the
 * designations count outward the way a real catalogue does.
 */
export function worldName(sky, info, rnd = Math.random, used = new Set()) {
  const lex = sky.tongue ?? DEFAULT_LEX;
  const reg = registerFor(info, rnd);
  for (let attempt = 0; attempt < 14; attempt++) {
    let n;
    if (reg === "catalogue") {
      n = `${sky.root} ${ORBIT_LETTERS[Math.min(info.index ?? 0, ORBIT_LETTERS.length - 1)]}`;
      if (used.has(n)) n = `${sky.root} ${ORBIT_LETTERS[Math.min(info.index ?? 0, ORBIT_LETTERS.length - 1)]}${1 + attempt}`;
    } else if (reg === "colonist") {
      n = colonistName(lex, rnd);
    } else {
      n = forgeWord(lex, rnd, weighted(rnd, { 2: 5, 3: 5, 4: 1 }));
      /* "Gur" is a grunt, not a world. Anything a tongue coughs up that
       * short gets sent back once before it goes on a chart. */
      if (n.length < 4 && attempt < 8) continue;
    }
    if (!used.has(n) && !offensive(n)) { used.add(n); return { name: n, register: reg }; }
  }
  const fallback = `${sky.root} ${ORBIT_LETTERS[Math.min(info.index ?? 0, 12)]}${Math.floor(rnd() * 90) + 10}`;
  used.add(fallback);
  return { name: fallback, register: "catalogue" };
}

/* Which register a world gets is the whole point of the mix: a designation
 * should mean "nobody ever cared enough", so it belongs on the cold margins
 * and the hostile rock, not on half the chart. A nav list that is mostly
 * <star> b, <star> d, <star> g is less varied than what it replaced. */
function registerFor(info, rnd) {
  const k = info.kind;
  const r = rnd();
  if (info.settled) return r < 0.55 ? "colonist" : r < 0.97 ? "spoken" : "catalogue";
  if (k === "terra") return r < 0.45 ? "colonist" : r < 0.95 ? "spoken" : "catalogue";
  if (k === "gas" || k === "ice") return r < 0.72 ? "spoken" : r < 0.78 ? "colonist" : "catalogue";
  if (k === "dwarf") return r < 0.44 ? "spoken" : "catalogue";   // the chart's margin
  return r < 0.62 ? "spoken" : r < 0.72 ? "colonist" : "catalogue";     // rocky, cloud
}

/* Somebody got here first and the name stuck. Half the time that somebody
 * left a surname on it; the rest of the time they named it for what it was
 * on the day they landed. */
const COLONY_VIRTUE = ["Providence", "Patience", "Concord", "Remembrance", "Endeavour", "Solace",
  "Refuge", "Amity", "Constance", "Harvest", "Reprieve", "Errand", "Covenant", "Respite"];

function colonistName(lex, rnd) {
  const who = familyName(LEXICONS.terran, rnd, "man").split(" ")[0].replace(/-.*$/, "");
  const r = rnd();
  if (r < 0.2) return `${pick(rnd, COLONY_HEAD)} ${who}`;
  if (r < 0.38) return `${who}'s ${pick(rnd, COLONY_TAIL)}`;
  if (r < 0.52) return `${forgeWord(lex, rnd, 2)} ${pick(rnd, COLONY_TAIL)}`;
  if (r < 0.64) return `${pick(rnd, COLONY_HEAD)} ${forgeWord(lex, rnd, 2)}`;
  if (r < 0.78) return pick(rnd, COLONY_VIRTUE);
  if (r < 0.88) return `${pick(rnd, COLONY_VIRTUE)} ${pick(rnd, COLONY_TAIL)}`;
  return `${who} ${pick(rnd, COLONY_TAIL)}`;
}

const ROMAN = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI", "XII"];

/**
 * Moons take their parent's name far more often than not, because that is
 * how charts work — but which form they take depends on what the parent is.
 * A catalogue world's moons are numbered off the designation; a named world's
 * moons get Roman numerals, a diminutive, or a name of their own.
 */
export function moonName(parent, index, sky, rnd = Math.random, used = new Set()) {
  const lex = sky.tongue ?? DEFAULT_LEX;
  const isDesignation = /\d/.test(parent) || / [b-n]$/.test(parent);
  const r = rnd();
  let n;
  if (isDesignation) {
    n = `${parent} ${ROMAN[index] ?? index + 1}`;
  } else if (r < 0.46) {
    n = `${parent} ${ROMAN[index] ?? index + 1}`;
  } else if (r < 0.62) {
    n = `${shorten(parent)} ${index === 0 ? "Major" : "Minor"}`;
  } else if (r < 0.72) {
    n = `${pick(rnd, ["Lesser", "Little", "Outer", "Far"])} ${parent}`;
  } else {
    n = forgeWord(lex, rnd, weighted(rnd, { 2: 6, 3: 3 }));
  }
  if (used.has(n) || offensive(n)) n = `${parent} ${ROMAN[index] ?? index + 1}`;
  if (used.has(n)) n = `${parent} ${ROMAN[index] ?? index + 1}-${Math.floor(rnd() * 9) + 1}`;
  used.add(n);
  return n;
}

/** "Ophiath" -> "Ophia". Enough to read as the same word, shorter on a chart. */
function shorten(w) {
  const base = w.split(" ")[0];
  if (base.length <= 4) return base;
  const cut = base.replace(/[bcdfghjklmnpqrstvwxz]+$/i, "");
  return cut.length >= 3 ? cut : base.slice(0, base.length - 1);
}

/** Everything one system needs to name itself consistently. */
export function skyNaming(seed) {
  const rnd = nameRng(`sky:${seed}`);
  const tongue = skyTongue(seed);
  /* Most stars carry a name somebody gave them; the rest never got past the
   * survey catalogue. Either way that is what the designations count off, so
   * a sky reads as one place: Kesune, Kesune b, Kesune c — or LX-2276 and
   * LX-2276 b, if nobody ever cared enough to name it. */
  const cat = catalogueRoot(rnd);
  const named = chance(rnd, 0.72);
  const star = named ? forgeWord(tongue, rnd, weighted(rnd, { 2: 6, 3: 4 })) : cat;
  return { seed, tongue, star, root: star, catalogue: cat, named, rnd };
}

/* ---- rogue rocks --------------------------------------------------------
 * A rock gets a provisional designation the moment a survey sees it, the way
 * the real minor-planet catalogues do it: year, a half-month letter, an order
 * letter, and a cycle count. Most rocks die as a designation. The big ones —
 * the ones that end a moon — get talked about, and a thing that gets talked
 * about gets a name.
 */

const HALF_MONTH = "ABCDEFGHJKLMNOPQRSTUVWXY";      // no I, as the real scheme goes
const ORDER = "ABCDEFGHJKLMNOPQRSTUVWXYZ";
const ROCK_ADJ = ["Grey", "Pale", "Black", "Long", "Iron", "Cold", "Broken", "Red", "Blind", "Hollow", "Sable", "Ninefold", "Slow", "Bitter"];
const ROCK_NOUN = ["Sister", "Hook", "Mote", "Tooth", "Fall", "Widow", "Cinder", "Wake", "Anvil", "Hammer", "Spur", "Veil", "Harrow", "Bell", "Scythe", "Mourner"];
const ROCK_SOLO = ["Ashfall", "Longfall", "Cutwash", "Deadlight", "Farrow", "Kerrn", "Vosk", "Halbrand", "Caldera", "Wanderer", "Nightjar", "Stonecrop", "Gallows", "Ossuary", "Blackmouth", "Threnody"];

/** A believable survey year, stable for the life of a sky. */
export function surveyYear(rnd) {
  return 2340 + Math.floor(rnd() * 60);
}

/**
 * Name a rogue rock.
 *
 *   seq     the spawn counter, so designations never collide
 *   radius  in world units — big rocks earn a spoken name
 *   year    the sky's survey year (surveyYear), optional
 */
export function rockName(seq, radius, rnd = Math.random, year, taken) {
  const y = year ?? surveyYear(rnd);
  /* Built entirely out of seq, because a designation that rolls any part of
   * itself is a designation that can collide — and a catalogue with two
   * entries under one number is not a catalogue. The half-month letter walks
   * forward a step each time the order letters wrap, exactly as the real
   * scheme does, so the numbers read like a survey working through a year. */
  const cycle = Math.floor(seq / ORDER.length);
  const ord = ORDER[seq % ORDER.length];
  const half = HALF_MONTH[(Math.floor(y * 7) + cycle) % HALF_MONTH.length];
  const desig = `${y} ${half}${ord}${cycle > 0 ? cycle : ""}`;

  /* Big enough to be worth a name, and not every big one gets one. */
  const big = radius > 420;
  const huge = radius > 700;
  if (!big || !chance(rnd, huge ? 0.85 : 0.3)) return desig;

  /* A designation is unique by construction; a spoken name is not. If this
   * sky already has a Grey Sister on the boards, roll again — and if the
   * dice keep landing there, ship the designation rather than a second one. */
  for (let attempt = 0; attempt < 6; attempt++) {
    const n = spokenRock(rnd);
    if (offensive(n)) continue;
    if (!taken || !taken.has(n)) { taken?.add(n); return n; }
  }
  return desig;
}

function spokenRock(rnd) {

  const r = rnd();
  /* The fixed list is the smallest branch on purpose — two rocks called
   * Wanderer in one session is exactly the problem this replaced. */
  if (r < 0.12) return pick(rnd, ROCK_SOLO);
  if (r < 0.48) return `${pick(rnd, ROCK_ADJ)} ${pick(rnd, ROCK_NOUN)}`;
  if (r < 0.66) return `The ${pick(rnd, ROCK_ADJ)} ${pick(rnd, ROCK_NOUN)}`;
  if (r < 0.82) {
    /* Named for whoever first put it on a chart. */
    const who = familyName(LEXICONS.terran, rnd, "woman").split(" ")[0].replace(/-.*$/, "");
    return chance(rnd, 0.5) ? `${who} ${Math.floor(rnd() * 900) + 100}` : `${who}'s ${pick(rnd, ROCK_NOUN)}`;
  }
  const word = forgeWord(LEXICONS.ashwalker, rnd, 2);
  return chance(rnd, 0.5) ? `${word} ${pick(rnd, ROCK_NOUN)}` : `${pick(rnd, ROCK_ADJ)} ${word}`;
}

/* ---- odds and ends ------------------------------------------------------ */

/** Beacons, buoys and other hardware somebody bolted a label to. */
export function beaconName(sky, i, rnd = Math.random) {
  for (let a = 0; a < 5; a++) {
    const n = buildBeacon(sky, i, rnd);
    if (!offensive(n)) return n;
  }
  return `${sky.root} Mark ${i + 1}`;
}

function buildBeacon(sky, i, rnd) {
  const tags = ["Relay", "Probe", "Cache", "Buoy", "Sond", "Tag", "Mark", "Picket", "Hark", "Listener"];
  const tag = pick(rnd, tags);
  const r = rnd();
  if (r < 0.35) return `${tag} ${i + 1}`;
  if (r < 0.6) return `${sky.root} ${tag} ${i + 1}`;
  if (r < 0.85) return `${forgeWord(sky.tongue ?? DEFAULT_LEX, rnd, 2)} ${tag}`;
  return `${tag}-${String.fromCharCode(65 + (i % 26))}${Math.floor(rnd() * 90) + 10}`;
}

export { LEXICONS };
