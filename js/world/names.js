import { LEXICONS, TONGUES, DEFAULT_LEX } from "../data/lexicons.js";

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

function weighted(rnd, table) {
  let total = 0;
  for (const k in table) total += table[k];
  let r = rnd() * total;
  for (const k in table) { r -= table[k]; if (r <= 0) return k; }
  return Object.keys(table)[0];
}

const cap = (s) => (s ? s[0].toUpperCase() + s.slice(1) : s);

const DIGRAPH = /^(th|sh|ch|zh|ph|ng|ss|ll|rr|nn|kh|gh|hs|ts)$/;
const VOWEL = /[aeiouy]/;

function simpleOnsets(lex) {
  if (!lex._on1) {
    lex._on1 = lex.on.filter((o) => o.length <= 1 || DIGRAPH.test(o));
    if (!lex._on1.length) lex._on1 = lex.on.map((o) => o[0]);
  }
  return lex._on1;
}

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
  const heavy = on.length > 1 && !DIGRAPH.test(on);
  const pCoda = (last ? (lex.pCodaEnd ?? 0.55) : (lex.pCoda ?? 0.3)) * (heavy ? 0.45 : 1);
  let co = chance(rnd, pCoda) ? pick(rnd, lex.co) : "";
  if (co && heavy && co.length > 1) co = co[0];
  return { on, nu, co, text: on + nu + co };
}

function smooth(w, lex) {
  let out = w;
  out = out.replace(/(.)\1\1+/g, "$1$1");
  out = out.replace(/([bcdfgjkpqtvxz])\1/g, "$1");
  out = out.replace(/[aeiouy]{4,}/g, (m) => m.slice(0, 2));
  if (lex.noDoubleVowel) out = out.replace(/([aeiou])\1/g, "$1");
  return out;
}

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

function sayable(w, lex, want) {
  if (w.length < 2 || w.length > Math.min(11, 3 + 3 * want)) return false;
  if (!VOWEL.test(w)) return false;
  if (!/[^aeiouy]/.test(w)) return false;
  if (/[^aeiouy]{4,}/.test(w)) return false;
  for (const c of new Set(w.replace(/[aeiouy]/g, ""))) {
    if (w.split(c).length - 1 > 2) return false;
  }
  if (lex.ban && lex.ban.test(w)) return false;
  if (offensive(w)) return false;
  return true;
}

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
  const lite = cap(pick(rnd, simpleOnsets(lex)) + pick(rnd, lex.nu) + (chance(rnd, 0.4) ? pick(rnd, lex.co) : ""));
  return sayable(lite.toLowerCase(), lex, 1) ? lite : cap((best ?? "sol").slice(0, 8));
}

const AMBIGUOUS = 0.10;

function endingFor(lex, gender, rnd) {
  const set = lex.end ?? DEFAULT_LEX.end;
  if (gender === "nonbinary" || chance(rnd, AMBIGUOUS)) return pick(rnd, set.n);
  return pick(rnd, gender === "woman" ? set.f : set.m);
}

function affix(stem, end) {
  if (!end) return stem;
  const v = /[aeiouy]/i;
  if (v.test(stem.slice(-1)) && v.test(end[0])) stem = stem.slice(0, -1);
  if (stem.toLowerCase().endsWith(end.toLowerCase())) return stem;
  return (stem + end).replace(/[aeiouy]{3,}/gi, (m) => m.slice(0, 2));
}

function oneFlourish(name) {
  let seen = false;
  let out = name.replace(/([aeiouy])\1/gi, (m) => { if (seen) return m[0]; seen = true; return m; });
  let marks = 0;
  out = out.replace(/'/g, () => (marks++ ? "" : "'"));
  return out.replace(/([a-z])\1\1+/gi, "$1$1");
}

const GIVEN_MAX = 10;

export function givenName(lex, gender, rnd) {
  if (lex.given && chance(rnd, lex.pCurated ?? 0)) {
    const set = lex.given;
    const key = gender === "nonbinary" || chance(rnd, AMBIGUOUS) ? "n" : gender === "woman" ? "f" : "m";
    const wide = lex.wide?.[key];
    const core = set[key] ?? set.n;
    const pool = wide?.length && !chance(rnd, lex.pCore ?? 1) ? wide : core;
    if (pool?.length) return pick(rnd, pool);
  }
  let stem = forgeWord(lex, rnd, weighted(rnd, lex.givenSyl ?? { 2: 7, 1: 2, 3: 2 }));
  let name = oneFlourish(affix(stem, endingFor(lex, gender, rnd)));
  for (let i = 0; i < 6 && (name.replace(/'/g, "").length > GIVEN_MAX || offensive(name)); i++) {
    stem = forgeWord(lex, rnd, i < 3 ? 2 : 1);
    name = oneFlourish(affix(stem, endingFor(lex, gender, rnd)));
  }
  return offensive(name) ? oneFlourish(cap(stem)) : name;
}

export function familyName(lex, rnd, gender) {
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
      return shape.wide?.length && !chance(rnd, shape.pCore ?? 1)
        ? pick(rnd, shape.wide)
        : pick(rnd, shape.pool);
    case "of":
      return `${shape.word ?? "of"} ${cap(stem())}${shape.tail ? pick(rnd, shape.tail) : ""}`;
    case "clan":
      return `${stem()}-${stem()}`;
    case "line": {
      const n = 1000 + Math.floor(rnd() * 8999);
      return `${pick(rnd, shape.pool)}-${n}`;
    }
    case "patronym": {
      const suf = gender === "woman" ? shape.f : gender === "man" ? shape.m : shape.n;
      return affix(stem(), pick(rnd, suf ?? shape.n));
    }
    case "corp":
      return `${pick(rnd, shape.pool)} ${pick(rnd, shape.grade)}`;
    case "compound":
      return cap(pick(rnd, shape.a) + pick(rnd, shape.b));
    default: {
      const s = cap(stem());
      return shape.suffix && chance(rnd, 0.5) ? affix(s, pick(rnd, shape.suffix)) : s;
    }
  }
}

export function familyOf(fullName) {
  const parts = String(fullName ?? "").trim().split(/\s+/);
  return parts.length > 1 ? parts.slice(1).join(" ") : "";
}

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

export function personName(race, gender, rnd = Math.random) {
  const lex = LEXICONS[race] ?? DEFAULT_LEX;
  const first = givenName(lex, gender, rnd);
  let last = familyName(lex, rnd, gender);
  for (let i = 0; i < 3 && last && echoes(first, last); i++) last = familyName(lex, rnd, gender);
  return { first, last, full: last ? `${first} ${last}` : first };
}
const bare = (w) => String(w ?? "").toLowerCase().replace(/^(of the |of )/, "").replace(/[^a-z]/g, "");
function echoes(first, last) { const a = bare(first), b = bare(last); return a.length >= 3 && b.length >= 3 && a.slice(0, 3) === b.slice(0, 3); }

export function skyTongue(seed) {
  const rnd = nameRng(`tongue:${seed}`);
  return TONGUES[Math.floor(rnd() * TONGUES.length)];
}

const CATALOGUES = ["HD", "HIP", "GJ", "LX", "TYC", "BD", "KX", "PPM", "WISE", "UCAC"];
const COLONY_HEAD = ["New", "New", "New", "Port", "Port", "Second", "Little", "Fort", "Camp", "Old"];
const COLONY_TAIL = ["Landing", "Rest", "Reach", "Hold", "Crossing", "Watch", "Fall", "Anchorage", "Shelf", "Bight", "March", "Downs"];

export function catalogueRoot(rnd) {
  const cat = pick(rnd, CATALOGUES);
  const n = 100 + Math.floor(rnd() * 9900);
  return chance(rnd, 0.5) ? `${cat} ${n}` : `${cat}-${n}`;
}

const ORBIT_LETTERS = "bcdefghijklmn";

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
      if (n.length < 4 && attempt < 8) continue;
    }
    if (!used.has(n) && !offensive(n)) { used.add(n); return { name: n, register: reg }; }
  }
  const fallback = `${sky.root} ${ORBIT_LETTERS[Math.min(info.index ?? 0, 12)]}${Math.floor(rnd() * 90) + 10}`;
  used.add(fallback);
  return { name: fallback, register: "catalogue" };
}

function registerFor(info, rnd) {
  const k = info.kind;
  const r = rnd();
  if (info.settled) return r < 0.55 ? "colonist" : r < 0.97 ? "spoken" : "catalogue";
  if (k === "terra") return r < 0.45 ? "colonist" : r < 0.95 ? "spoken" : "catalogue";
  if (k === "gas" || k === "ice") return r < 0.72 ? "spoken" : r < 0.78 ? "colonist" : "catalogue";
  if (k === "dwarf") return r < 0.44 ? "spoken" : "catalogue";
  return r < 0.62 ? "spoken" : r < 0.72 ? "colonist" : "catalogue";
}

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

function shorten(w) {
  const base = w.split(" ")[0];
  if (base.length <= 4) return base;
  const cut = base.replace(/[bcdfghjklmnpqrstvwxz]+$/i, "");
  return cut.length >= 3 ? cut : base.slice(0, base.length - 1);
}

export function skyNaming(seed) {
  const rnd = nameRng(`sky:${seed}`);
  const tongue = skyTongue(seed);
  const cat = catalogueRoot(rnd);
  const named = chance(rnd, 0.72);
  const star = named ? forgeWord(tongue, rnd, weighted(rnd, { 2: 6, 3: 4 })) : cat;
  return { seed, tongue, star, root: star, catalogue: cat, named, rnd };
}

const HALF_MONTH = "ABCDEFGHJKLMNOPQRSTUVWXY";
const ORDER = "ABCDEFGHJKLMNOPQRSTUVWXYZ";
const ROCK_ADJ = ["Grey", "Pale", "Black", "Long", "Iron", "Cold", "Broken", "Red", "Blind", "Hollow", "Sable", "Ninefold", "Slow", "Bitter"];
const ROCK_NOUN = ["Sister", "Hook", "Mote", "Tooth", "Fall", "Widow", "Cinder", "Wake", "Anvil", "Hammer", "Spur", "Veil", "Harrow", "Bell", "Scythe", "Mourner"];
const ROCK_SOLO = ["Ashfall", "Longfall", "Cutwash", "Deadlight", "Farrow", "Kerrn", "Vosk", "Halbrand", "Caldera", "Wanderer", "Nightjar", "Stonecrop", "Gallows", "Ossuary", "Blackmouth", "Threnody"];

export function surveyYear(rnd) {
  return 2340 + Math.floor(rnd() * 60);
}

export function rockName(seq, radius, rnd = Math.random, year, taken) {
  const y = year ?? surveyYear(rnd);
  const cycle = Math.floor(seq / ORDER.length);
  const ord = ORDER[seq % ORDER.length];
  const half = HALF_MONTH[(Math.floor(y * 7) + cycle) % HALF_MONTH.length];
  const desig = `${y} ${half}${ord}${cycle > 0 ? cycle : ""}`;

  const big = radius > 420;
  const huge = radius > 700;
  if (!big || !chance(rnd, huge ? 0.85 : 0.3)) return desig;

  for (let attempt = 0; attempt < 6; attempt++) {
    const n = spokenRock(rnd);
    if (offensive(n)) continue;
    if (!taken || !taken.has(n)) { taken?.add(n); return n; }
  }
  return desig;
}

function spokenRock(rnd) {

  const r = rnd();
  if (r < 0.12) return pick(rnd, ROCK_SOLO);
  if (r < 0.48) return `${pick(rnd, ROCK_ADJ)} ${pick(rnd, ROCK_NOUN)}`;
  if (r < 0.66) return `The ${pick(rnd, ROCK_ADJ)} ${pick(rnd, ROCK_NOUN)}`;
  if (r < 0.82) {
    const who = familyName(LEXICONS.terran, rnd, "woman").split(" ")[0].replace(/-.*$/, "");
    return chance(rnd, 0.5) ? `${who} ${Math.floor(rnd() * 900) + 100}` : `${who}'s ${pick(rnd, ROCK_NOUN)}`;
  }
  const word = forgeWord(LEXICONS.ashwalker, rnd, 2);
  return chance(rnd, 0.5) ? `${word} ${pick(rnd, ROCK_NOUN)}` : `${pick(rnd, ROCK_ADJ)} ${word}`;
}

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
