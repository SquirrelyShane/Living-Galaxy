/* LIVING GALAXY — asteroid taxonomy, written in Living Galaxy's own ores.
 *
 * Shane's asteroid-generator drop-in shipped nine taxonomic classes (C, B, S,
 * M, V, E, D, P, X) and its own 41-species mineral catalogue. The classes are
 * the good part and they are kept; the catalogue is not, because a rock that
 * assays "chalcopyrite" and then puts "copper ore" in the hold is two games.
 * So every weight table below is rewritten in `js/materials.js` ore ids, and
 * the LOOK table in `js/rockgen.js` supplies how each one looks. There is one
 * mineral list in this game and this file does not add a second.
 *
 * The classes do NOT replace the radial bands from v0.0.4 — they sit on top of
 * them. Where you are in the belt decides which classes are PLAUSIBLE (the
 * sunward rim is differentiated metal, the cold outer fifth is carbon and
 * frost); the rock's own hash then picks one from that shortlist. So the belt
 * still reads the way it was designed to, and two rocks a hundred metres apart
 * can still be a stony chondrite and an exposed core fragment.
 */

/* Each class: how it looks in bulk, how dense it is (the assay's mass), and
 * what it is made of as weights over Living Galaxy ore ids. Weights are relative.
 *
 * `grade` is the bulk share of a cut that is cargo rather than matrix. It is a
 * separate number from what the surface SHOWS: the generator paints ore as thin
 * vein networks and spots, a few percent of the face, which is how a seam reads
 * from a cockpit — but a prospector's ticket priced off surface coverage would
 * call every rock in the belt worthless while the cutter fills the hold. So the
 * surface decides WHICH ores and in what proportion (with the class table as
 * the prior), and the class's grade decides how much of the rock is ore. A
 * metal core is mostly ore; a primitive carbonaceous body is mostly matrix. */
export const CLASSES = {
  C: {
    id: "C", grade: 0.46, name: "C-type · Carbonaceous", tag: "Primitive, hydrated",
    base: 0x1c1d20, accent: 0x2a2e32, density: 1700, roughness: 0.72, metalness: 0.08,
    note: "Dark, water-rich survivors. Clays, organics, magnetite and ice in a matrix that has never been melted.",
    ores: {
      carbonaceous: 0.24, water_ice: 0.14, silicate: 0.1, regolith: 0.09, tholins: 0.08,
      iron_ore: 0.07, sulfur: 0.05, sphalerite: 0.05, phosphate: 0.04, pentlandite: 0.04,
      nickel_ore: 0.03, helium3: 0.02, platinum_ore: 0.006, uraninite: 0.008,
    },
  },
  B: {
    id: "B", grade: 0.5, name: "B-type · Blue carbonaceous", tag: "Altered, bright in blue",
    base: 0x242830, accent: 0x3a4654, density: 1800, roughness: 0.68, metalness: 0.1,
    note: "A C-type that has been cooked or soaked. Leaner in organics, richer in oxide and sulfate.",
    ores: {
      carbonaceous: 0.16, iron_ore: 0.14, water_ice: 0.1, sulfur: 0.08, silicate: 0.08,
      regolith: 0.07, sphalerite: 0.06, chromite: 0.06, phosphate: 0.05, pentlandite: 0.04,
      nickel_ore: 0.04, helium3: 0.02, monazite: 0.015,
    },
  },
  S: {
    id: "S", grade: 0.56, name: "S-type · Silicaceous", tag: "Stony inner-belt",
    base: 0x7a6a55, accent: 0x9c8a6e, density: 2700, roughness: 0.62, metalness: 0.18,
    note: "The ordinary chondrite: olivine and pyroxene with metal grains through it. Most of the belt is this.",
    ores: {
      silicate: 0.26, regolith: 0.16, iron_ore: 0.14, nickel_ore: 0.08, bauxite: 0.07,
      copper_ore: 0.06, chromite: 0.05, cassiterite: 0.04, sphalerite: 0.04, galena: 0.04,
      ilmenite: 0.03, monazite: 0.02, platinum_ore: 0.01,
    },
  },
  M: {
    id: "M", grade: 0.82, name: "M-type · Metallic", tag: "Exposed core",
    base: 0x5c6066, accent: 0x8a9098, density: 5300, roughness: 0.34, metalness: 0.78,
    note: "The iron-nickel heart of a body that was shattered before it cooled. What every prospector is looking for.",
    ores: {
      iron_ore: 0.3, nickel_ore: 0.2, pentlandite: 0.1, chromite: 0.08, cassiterite: 0.05,
      galena: 0.05, copper_ore: 0.05, platinum_ore: 0.045, iridium_ore: 0.035,
      ilmenite: 0.03, silicate: 0.04, uraninite: 0.01,
    },
  },
  V: {
    id: "V", grade: 0.58, name: "V-type · Vestoid", tag: "Basaltic crust",
    base: 0x3e342e, accent: 0x5a4a3e, density: 3200, roughness: 0.55, metalness: 0.16,
    note: "A chip off a body big enough to have had a crust. Basalt, titanium oxides, phosphates.",
    ores: {
      silicate: 0.24, ilmenite: 0.16, regolith: 0.12, bauxite: 0.1, phosphate: 0.09,
      iron_ore: 0.08, chromite: 0.07, monazite: 0.05, copper_ore: 0.04, sulfur: 0.03,
      uraninite: 0.015,
    },
  },
  E: {
    id: "E", grade: 0.62, name: "E-type · Enstatite", tag: "Reduced, pale",
    base: 0xc4bba8, accent: 0xddd6c6, density: 3000, roughness: 0.48, metalness: 0.28,
    note: "Formed where there was no oxygen to spare. Pale, bright, and carries its metal as free grains.",
    ores: {
      silicate: 0.24, iron_ore: 0.14, nickel_ore: 0.12, regolith: 0.1, carbonaceous: 0.08,
      sulfur: 0.08, cassiterite: 0.06, sphalerite: 0.06, bauxite: 0.05, platinum_ore: 0.02,
      monazite: 0.02,
    },
  },
  D: {
    id: "D", grade: 0.48, name: "D-type · Trojan", tag: "Red, organic-rich",
    base: 0x3a2a22, accent: 0x5a3e30, density: 1400, roughness: 0.78, metalness: 0.05,
    note: "Very red, very dark, and full of the tarry organics that only survive a long way out.",
    ores: {
      tholins: 0.24, carbonaceous: 0.18, water_ice: 0.14, methane_ice: 0.1, ammonia_ice: 0.08,
      nitrogen_ice: 0.07, regolith: 0.07, silicate: 0.05, sulfur: 0.04, helium3: 0.02, deuterium: 0.015,
    },
  },
  P: {
    id: "P", grade: 0.44, name: "P-type · Primitive", tag: "Low-albedo outer",
    base: 0x322820, accent: 0x4a3c30, density: 1600, roughness: 0.74, metalness: 0.07,
    note: "An intermediate dark body from the outer belt. Between a C and a D and not much like either.",
    ores: {
      carbonaceous: 0.2, tholins: 0.14, water_ice: 0.13, regolith: 0.12, silicate: 0.1,
      iron_ore: 0.08, methane_ice: 0.07, sulfur: 0.05, phosphate: 0.05, pentlandite: 0.03, helium3: 0.02,
    },
  },
  X: {
    id: "X", grade: 0.7, name: "X-type · Ambiguous", tag: "Metal–rock hybrid",
    base: 0x4a4e52, accent: 0x6a7076, density: 4000, roughness: 0.46, metalness: 0.5,
    note: "The spectrum will not commit. Half of these are worth nothing and half are worth the whole trip.",
    ores: {
      iron_ore: 0.2, silicate: 0.14, nickel_ore: 0.12, chromite: 0.08, pentlandite: 0.07,
      ilmenite: 0.06, galena: 0.06, copper_ore: 0.05, platinum_ore: 0.05, iridium_ore: 0.04,
      uraninite: 0.035, monazite: 0.03, cassiterite: 0.03,
    },
  },
};

export const CLASS_IDS = Object.keys(CLASSES);

/**
 * Which classes are plausible at this point in the belt.
 *
 * `band` is what js/field.js already decides from the radius — "metal" for the
 * sunward rim, "stone" for the broad middle, "carbon" for the cold outer
 * fifth, "ice" past the frost line. The shortlists overlap on purpose: a metal
 * rim is mostly M and X but an S-type in it is not a bug, it is a rock that
 * came from somewhere else.
 */
export const BAND_CLASSES = {
  metal: ["M", "M", "X", "E", "S"],
  stone: ["S", "S", "S", "V", "E", "X", "C"],
  carbon: ["C", "C", "B", "P", "D", "S"],
  ice: ["D", "P", "C", "B"],
};

/** Deterministic class for a rock: its own hash against the band's shortlist. */
export function classFor(band, h) {
  const list = BAND_CLASSES[band] ?? BAND_CLASSES.stone;
  return list[Math.min(list.length - 1, Math.floor(h * list.length))];
}

/** Abundance-weighted pick from a class's table, off one hash in [0,1). */
export function classOre(cls, h) {
  const table = CLASSES[cls]?.ores ?? CLASSES.S.ores;
  let total = 0;
  for (const w of Object.values(table)) total += w;
  let r = h * total;
  for (const [id, w] of Object.entries(table)) {
    r -= w;
    if (r <= 0) return id;
  }
  return Object.keys(table)[0];
}

/** The ore ids a class can carry at all, richest first — the assay's shortlist. */
export function classSuite(cls) {
  const table = CLASSES[cls]?.ores ?? CLASSES.S.ores;
  return Object.entries(table).sort((a, b) => b[1] - a[1]).map(([id]) => id);
}
