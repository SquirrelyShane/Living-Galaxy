/* LIVING GALAXY — the body database.
 *
 * Every world in the sky is one of these. An archetype fixes what the surface
 * is made of, how it is painted, what it smells of on a survey, and what you
 * can dig out of it. The texture generator in textures.js reads `surface` to
 * decide which painter to run.
 */

export const ARCHETYPES = [
  /* ---- rocky ----------------------------------------------------------- */
  { id: "cinder", name: "Cinder world", kind: "rocky", surface: "lava", weight: 0.7,
    palette: ["#2a1410", "#5c1f10", "#a63a12", "#ff8a2b"], atmo: null, temp: "furnace",
    blurb: "Rock that never finished cooling. The night side still glows.",
    ores: ["iron_ore", "sulfur", "nickel_ore", "platinum_ore"] },
  { id: "scorched", name: "Scorched plain", kind: "rocky", surface: "barren", weight: 1.5,
    palette: ["#3a332c", "#6b5c4a", "#9a8a72", "#c4b295"], atmo: null, temp: "seared",
    blurb: "Iron plains flash-baked on the sunward side and cracked on the other.",
    ores: ["iron_ore", "silicate", "regolith", "cassiterite"] },
  { id: "ferrous", name: "Ferrous body", kind: "rocky", surface: "metallic", weight: 0.9,
    palette: ["#2e2a28", "#5e5048", "#8f7a68", "#bda88e"], atmo: null, temp: "cold",
    blurb: "Mostly core. Something stripped the mantle off it a long time ago.",
    ores: ["iron_ore", "nickel_ore", "chromite", "platinum_ore", "iridium_ore"] },
  { id: "rust", name: "Rust desert", kind: "rocky", surface: "desert", weight: 1.4,
    palette: ["#3d1f12", "#7a3a1e", "#b8663a", "#dda06a"], atmo: "#c99a78", temp: "cold",
    blurb: "Iron dust from pole to pole, and a sky too thin to breathe.",
    ores: ["iron_ore", "silicate", "sphalerite", "uraninite"] },
  { id: "canyon", name: "Canyon world", kind: "rocky", surface: "canyon", weight: 0.8,
    palette: ["#33261e", "#6b4a34", "#a3785a", "#cfa683"], atmo: "#b08a6a", temp: "cold",
    blurb: "Split end to end by a rift you could lose a fleet in.",
    ores: ["silicate", "copper_ore", "galena", "monazite"] },
  { id: "saltflat", name: "Salt flat", kind: "rocky", surface: "salt", weight: 0.6,
    palette: ["#4a4740", "#8f8a7c", "#cfc9b6", "#f0ece0"], atmo: null, temp: "cold",
    blurb: "A dry seabed, bright enough to read your instruments by.",
    ores: ["silicate", "phosphate", "sphalerite", "regolith"] },

  /* ---- terra ----------------------------------------------------------- */
  { id: "garden", name: "Garden world", kind: "terra", surface: "ocean", weight: 1.0,
    palette: ["#12314f", "#1d5a7a", "#3f7a4a", "#c8d4cf"], atmo: "#9ec4e6", temp: "temperate",
    blurb: "Open water, weather, and something down there making the oxygen.",
    ores: ["water_ice", "phosphate", "bauxite", "monazite", "silicate"] },
  { id: "archipelago", name: "Archipelago world", kind: "terra", surface: "ocean", weight: 0.7,
    palette: ["#0d2a44", "#17506e", "#4f7d52", "#dfe6e2"], atmo: "#a8cfe8", temp: "temperate",
    blurb: "Almost all sea. The land is a scatter of green punctuation.",
    ores: ["water_ice", "phosphate", "silicate", "monazite"] },
  { id: "jungle", name: "Jungle world", kind: "terra", surface: "jungle", weight: 0.6,
    palette: ["#0f2418", "#1d4a24", "#3f7a2e", "#8fae5a"], atmo: "#9fc48a", temp: "hot",
    blurb: "Wet, green and loud. The canopy shows up on radar as terrain.",
    ores: ["phosphate", "bauxite", "water_ice", "silicate"] },
  { id: "steppe", name: "Steppe world", kind: "terra", surface: "steppe", weight: 0.8,
    palette: ["#2f2a1d", "#6b5f38", "#a3924f", "#d6c98d"], atmo: "#c8c096", temp: "temperate",
    blurb: "Grass to the horizon and shallow inland seas that come and go.",
    ores: ["phosphate", "silicate", "bauxite", "copper_ore"] },
  { id: "tundra", name: "Tundra world", kind: "terra", surface: "tundra", weight: 0.7,
    palette: ["#1e2a30", "#3f5a5e", "#7d9490", "#dfe9ea"], atmo: "#b8cdd2", temp: "cold",
    blurb: "Permafrost and cold ocean. The ice caps meet in winter.",
    ores: ["water_ice", "iron_ore", "phosphate", "nitrogen_ice"] },
  { id: "dying", name: "Dying world", kind: "terra", surface: "dying", weight: 0.4,
    palette: ["#2b2118", "#5c4630", "#8c6a44", "#c9a878"], atmo: "#b09070", temp: "hot",
    blurb: "Dry seabeds, salt rings, and a biosphere down to its last argument.",
    ores: ["phosphate", "silicate", "galena", "monazite", "uraninite"] },

  /* ---- cloud ----------------------------------------------------------- */
  { id: "sulfuric", name: "Sulfuric hothouse", kind: "cloud", surface: "sulfur", weight: 1.2,
    palette: ["#5c4620", "#a37c33", "#d9b25c", "#f2dfa0"], atmo: "#e8d7b0", temp: "furnace",
    blurb: "An opaque deck of sulfuric acid over a surface at melting point.",
    ores: ["sulfur", "phosphate", "sphalerite", "silicate"] },
  { id: "hazeworld", name: "Haze world", kind: "cloud", surface: "haze", weight: 0.9,
    palette: ["#4a4436", "#867a5e", "#bdae8a", "#e2d7ba"], atmo: "#d8c3a6", temp: "hot",
    blurb: "Organic smog thick enough to fly instruments-only all the way down.",
    ores: ["sulfur", "carbonaceous", "phosphate", "tholins"] },
  { id: "greenhouse", name: "Runaway greenhouse", kind: "cloud", surface: "storm", weight: 0.6,
    palette: ["#5e3a22", "#9c5f2e", "#cf9450", "#efd39a"], atmo: "#e0b48a", temp: "furnace",
    blurb: "It had an ocean once. Now it has weather that would strip a hull.",
    ores: ["sulfur", "silicate", "sphalerite"] },

  /* ---- gas ------------------------------------------------------------- */
  { id: "banded", name: "Banded giant", kind: "gas", surface: "bands", weight: 1.6,
    palette: ["#5c4630", "#96754e", "#c9a97e", "#e8d6b4"], atmo: "#d8c09a", temp: "cold",
    blurb: "Belts and zones running in opposite directions, and a storm older than the survey.",
    ores: ["hydrogen", "helium3", "ammonia_ice", "metallic_h"] },
  { id: "stormgiant", name: "Storm giant", kind: "gas", surface: "storm", weight: 1.0,
    palette: ["#3f2a33", "#7a4553", "#b06f78", "#e0aeb0"], atmo: "#c98f97", temp: "cold",
    blurb: "The bands have broken down into a permanent brawl of cyclones.",
    ores: ["hydrogen", "helium3", "metallic_h", "deuterium"] },
  { id: "palegiant", name: "Pale giant", kind: "gas", surface: "bands", weight: 0.9,
    palette: ["#3f5460", "#6d8c96", "#a6c0c4", "#dceaea"], atmo: "#b7e4e6", temp: "frozen",
    blurb: "Methane haze, faint banding, and almost nothing to see by.",
    ores: ["hydrogen", "methane_ice", "ammonia_ice", "helium3"] },
  { id: "hotjupiter", name: "Scorched giant", kind: "gas", surface: "bands", weight: 0.4,
    palette: ["#4a1a12", "#8f3a1e", "#cf7038", "#f2b070"], atmo: "#e08a50", temp: "furnace",
    blurb: "Close enough in that its day side is boiling off into a tail.",
    ores: ["hydrogen", "metallic_h", "helium3"] },

  /* ---- ice ------------------------------------------------------------- */
  { id: "iceGiant", name: "Ice giant", kind: "ice", surface: "bands", weight: 1.3,
    palette: ["#12304a", "#1f5f86", "#4d9ab5", "#a8d8e4"], atmo: "#6b8ee0", temp: "frozen",
    blurb: "Water, ammonia and methane under crushing pressure. Wind like a wall.",
    ores: ["methane_ice", "ammonia_ice", "water_ice", "deuterium"] },
  { id: "methaneWorld", name: "Methane world", kind: "ice", surface: "methane", weight: 0.8,
    palette: ["#2b3a20", "#4f6b32", "#87a055", "#cdd8a2"], atmo: "#a8c48a", temp: "frozen",
    blurb: "Liquid methane lakes and a slow orange drizzle.",
    ores: ["methane_ice", "tholins", "nitrogen_ice", "water_ice"] },
  { id: "glacier", name: "Glacial world", kind: "ice", surface: "glacier", weight: 1.0,
    palette: ["#1c2c38", "#3f6270", "#84a8b4", "#e6f2f5"], atmo: null, temp: "frozen",
    blurb: "Ice sheets kilometres deep, fractured into a map of themselves.",
    ores: ["water_ice", "nitrogen_ice", "ammonia_ice"] },

  /* ---- moon ------------------------------------------------------------ */
  { id: "cratered", name: "Cratered moon", kind: "moon", surface: "cratered", weight: 2.0,
    palette: ["#2c2a26", "#57534c", "#8b857b", "#c2bdb2"], atmo: null, temp: "cold",
    blurb: "Grey maria and old basalt. Nothing has happened here for a long time.",
    ores: ["regolith", "ilmenite", "iron_ore", "helium3"] },
  { id: "iceMoon", name: "Ice moon", kind: "moon", surface: "iceshell", weight: 1.2,
    palette: ["#22333d", "#4a707e", "#93b6c0", "#eaf5f8"], atmo: null, temp: "frozen",
    blurb: "A cracked ice shell with something liquid keeping it warm underneath.",
    ores: ["water_ice", "ammonia_ice", "nitrogen_ice", "silicate"] },
  { id: "volcanicMoon", name: "Volcanic moon", kind: "moon", surface: "sulfurmoon", weight: 0.7,
    palette: ["#3d3210", "#8a6c19", "#d4b13c", "#f4e39a"], atmo: null, temp: "hot",
    blurb: "Tidally kneaded until it turned itself inside out. Sulfur everywhere.",
    ores: ["sulfur", "silicate", "iron_ore", "uraninite"] },
  { id: "capturedMoon", name: "Captured body", kind: "moon", surface: "carbon", weight: 0.8,
    palette: ["#1c1a18", "#38332e", "#5a5148", "#7d7166"], atmo: null, temp: "cold",
    blurb: "Dark, lumpy, and on a orbit that says it did not form here.",
    ores: ["carbonaceous", "water_ice", "tholins", "platinum_ore"] },

  /* ---- dwarf ----------------------------------------------------------- */
  { id: "snowball", name: "Snowball", kind: "dwarf", surface: "iceshell", weight: 1.3,
    palette: ["#2a3138", "#5a6a74", "#9fb0b8", "#e8f0f4"], atmo: null, temp: "frozen",
    blurb: "Nitrogen frost over a rock core, at the edge of the chart.",
    ores: ["nitrogen_ice", "water_ice", "methane_ice", "tholins"] },
  { id: "tholinDwarf", name: "Tholin dwarf", kind: "dwarf", surface: "tholin", weight: 0.9,
    palette: ["#33211a", "#6b4030", "#a8674a", "#d9a381"], atmo: null, temp: "frozen",
    blurb: "Stained red-brown by a hundred million years of slow chemistry.",
    ores: ["tholins", "carbonaceous", "water_ice", "uraninite"] },
  { id: "rubble", name: "Rubble pile", kind: "dwarf", surface: "rubble", weight: 0.8,
    palette: ["#241f1c", "#453d36", "#6b6055", "#948575"], atmo: null, temp: "cold",
    blurb: "Held together by nothing but its own weak gravity.",
    ores: ["carbonaceous", "iron_ore", "regolith", "pentlandite"] },
];

const BY_KIND = new Map();
for (const a of ARCHETYPES) {
  if (!BY_KIND.has(a.kind)) BY_KIND.set(a.kind, []);
  BY_KIND.get(a.kind).push(a);
}

export function archetypesFor(kind) {
  return BY_KIND.get(kind) ?? BY_KIND.get("rocky");
}

export function archetypeById(id) {
  return ARCHETYPES.find((a) => a.id === id);
}

/** Weighted pick for a body kind. */
export function rollArchetype(kind, rnd) {
  const list = archetypesFor(kind);
  const total = list.reduce((s, a) => s + a.weight, 0);
  let r = rnd() * total;
  for (const a of list) {
    r -= a.weight;
    if (r <= 0) return a;
  }
  return list[list.length - 1];
}

/** Rough surface temperature band from where it sits, used to bias the roll. */
export function tempBand(orbit, maxOrbit) {
  const f = orbit / Math.max(maxOrbit, 1);
  if (f < 0.12) return "furnace";
  if (f < 0.28) return "hot";
  if (f < 0.5) return "temperate";
  if (f < 0.75) return "cold";
  return "frozen";
}

/** Prefer archetypes whose temperature suits the orbit, but do not force it. */
export function rollArchetypeAt(kind, rnd, band) {
  const list = archetypesFor(kind);
  const total = list.reduce((s, a) => s + a.weight * (a.temp === band ? 3.2 : 1), 0);
  let r = rnd() * total;
  for (const a of list) {
    r -= a.weight * (a.temp === band ? 3.2 : 1);
    if (r <= 0) return a;
  }
  return list[list.length - 1];
}
