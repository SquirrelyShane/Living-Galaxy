/* LIVING GALAXY — materials, refining and tier-0 fabrication.
 *
 * Three layers. ORES come out of rock and regolith. MINERALS come out of a
 * refinery. COMPONENTS are the first things you can actually build with —
 * plate, girder, motor, chip. Everything above that is somebody else's
 * problem for now.
 *
 * Every entry carries mass per unit and a base value, and every sector wants
 * a different half of the list, which is what makes a trade route a thing.
 */

/* ---- ores --------------------------------------------------------------- */
/* found:  which body kinds and rock types yield it
 * yield:  relative abundance when you cut for it
 * refine: what a unit becomes, and how much                                  */

export const ORES = [
  { id: "iron_ore",     name: "Iron ore",        mass: 2.9, value: 4,   found: ["rocky", "moon", "asteroid", "dwarf"], yield: 1.0,  refine: { mineral: "iron", per: 0.62 } },
  { id: "nickel_ore",   name: "Nickel ore",      mass: 3.1, value: 7,   found: ["rocky", "asteroid"],                  yield: 0.62, refine: { mineral: "nickel", per: 0.55 } },
  { id: "silicate",     name: "Silicates",       mass: 2.3, value: 3,   found: ["rocky", "moon", "terra", "dwarf", "asteroid"],    yield: 1.2,  refine: { mineral: "silicon", per: 0.4 } },
  { id: "bauxite",      name: "Bauxite",         mass: 2.5, value: 6,   found: ["terra", "rocky", "asteroid"],                     yield: 0.55, refine: { mineral: "aluminium", per: 0.48 } },
  { id: "copper_ore",   name: "Copper ore",      mass: 3.4, value: 9,   found: ["rocky", "asteroid"],                  yield: 0.5,  refine: { mineral: "copper", per: 0.5 } },
  { id: "cassiterite",  name: "Cassiterite",     mass: 4.1, value: 12,  found: ["rocky", "dwarf", "asteroid"],                     yield: 0.28, refine: { mineral: "tin", per: 0.44 } },
  { id: "chromite",     name: "Chromite",        mass: 4.4, value: 14,  found: ["rocky", "asteroid"],                  yield: 0.26, refine: { mineral: "chromium", per: 0.42 } },
  { id: "ilmenite",     name: "Ilmenite",        mass: 4.6, value: 18,  found: ["moon", "rocky", "asteroid"],                      yield: 0.24, refine: { mineral: "titanium", per: 0.35 } },
  { id: "pentlandite",  name: "Pentlandite",     mass: 4.7, value: 22,  found: ["asteroid", "dwarf"],                  yield: 0.18, refine: { mineral: "cobalt", per: 0.33 } },
  { id: "sphalerite",   name: "Sphalerite",      mass: 4.0, value: 11,  found: ["rocky", "cloud", "asteroid"],                     yield: 0.3,  refine: { mineral: "zinc", per: 0.46 } },
  { id: "galena",       name: "Galena",          mass: 7.4, value: 13,  found: ["rocky", "dwarf", "asteroid"],                     yield: 0.26, refine: { mineral: "lead", per: 0.56 } },
  { id: "monazite",     name: "Monazite",        mass: 5.1, value: 42,  found: ["terra", "rocky", "asteroid"],                     yield: 0.09, refine: { mineral: "rare_earths", per: 0.22 } },
  { id: "platinum_ore", name: "Platinum ore",    mass: 6.9, value: 78,  found: ["asteroid", "moon"],                   yield: 0.05, refine: { mineral: "platinum", per: 0.15 } },
  { id: "iridium_ore",  name: "Iridium ore",     mass: 7.8, value: 96,  found: ["asteroid"],                           yield: 0.035,refine: { mineral: "iridium", per: 0.12 } },
  { id: "uraninite",    name: "Uraninite",       mass: 8.2, value: 88,  found: ["rocky", "dwarf", "asteroid"],         yield: 0.04, refine: { mineral: "uranium", per: 0.14 } },
  { id: "water_ice",    name: "Water ice",       mass: 0.9, value: 3,   found: ["ice", "moon", "dwarf", "asteroid"],   yield: 1.4,  refine: { mineral: "water", per: 0.9 } },
  { id: "methane_ice",  name: "Methane clathrate", mass: 0.9, value: 8, found: ["ice", "dwarf"],                       yield: 0.7,  refine: { mineral: "methane", per: 0.75 } },
  { id: "ammonia_ice",  name: "Ammonia ice",     mass: 0.8, value: 9,   found: ["ice", "gas"],                         yield: 0.6,  refine: { mineral: "ammonia", per: 0.72 } },
  { id: "nitrogen_ice", name: "Nitrogen ice",    mass: 1.0, value: 7,   found: ["ice", "dwarf"],                       yield: 0.65, refine: { mineral: "nitrogen", per: 0.8 } },
  { id: "sulfur",       name: "Sulfur",          mass: 2.0, value: 5,   found: ["cloud", "moon", "rocky"],             yield: 0.8,  refine: { mineral: "sulfur_r", per: 0.85 } },
  { id: "phosphate",    name: "Phosphates",      mass: 2.4, value: 10,  found: ["terra", "cloud"],                     yield: 0.42, refine: { mineral: "phosphorus", per: 0.5 } },
  { id: "carbonaceous", name: "Carbonaceous rock", mass: 1.9, value: 5, found: ["asteroid", "dwarf"],                  yield: 0.95, refine: { mineral: "carbon", per: 0.6 } },
  { id: "regolith",     name: "Regolith",        mass: 1.7, value: 2,   found: ["moon", "rocky", "dwarf", "asteroid"],             yield: 1.6,  refine: { mineral: "silicon", per: 0.18 } },
  { id: "tholins",      name: "Tholins",         mass: 1.2, value: 15,  found: ["dwarf", "ice"],                       yield: 0.3,  refine: { mineral: "organics", per: 0.55 } },
  { id: "helium3",      name: "Helium-3",        mass: 0.2, value: 120, found: ["gas", "moon"],                        yield: 0.02, refine: { mineral: "helium3_r", per: 0.95 } },
  { id: "hydrogen",     name: "Hydrogen",        mass: 0.1, value: 2,   found: ["gas", "ice"],                         yield: 2.0,  refine: { mineral: "hydrogen_r", per: 0.95 } },
  { id: "metallic_h",   name: "Metallic hydrogen", mass: 1.1, value: 210, found: ["gas"],                              yield: 0.012,refine: { mineral: "metallic_h_r", per: 0.6 } },
  { id: "deuterium",    name: "Deuterium",       mass: 0.2, value: 64,  found: ["ice", "gas"],                         yield: 0.08, refine: { mineral: "deuterium_r", per: 0.9 } },
];

/* ---- refined minerals --------------------------------------------------- */

export const MINERALS = [
  { id: "iron",         name: "Iron",             mass: 2.6, value: 11 },
  { id: "nickel",       name: "Nickel",           mass: 2.8, value: 19 },
  { id: "silicon",      name: "Silicon",          mass: 1.9, value: 14 },
  { id: "aluminium",    name: "Aluminium",        mass: 1.5, value: 21 },
  { id: "copper",       name: "Copper",           mass: 3.1, value: 26 },
  { id: "tin",          name: "Tin",              mass: 3.4, value: 34 },
  { id: "chromium",     name: "Chromium",         mass: 3.5, value: 41 },
  { id: "titanium",     name: "Titanium",         mass: 2.2, value: 62 },
  { id: "cobalt",       name: "Cobalt",           mass: 3.6, value: 74 },
  { id: "zinc",         name: "Zinc",             mass: 3.2, value: 29 },
  { id: "lead",         name: "Lead",             mass: 6.6, value: 24 },
  { id: "rare_earths",  name: "Rare earths",      mass: 3.0, value: 239 },
  { id: "platinum",     name: "Platinum",         mass: 6.4, value: 650 },
  { id: "iridium",      name: "Iridium",          mass: 7.1, value: 1000 },
  { id: "uranium",      name: "Uranium",          mass: 7.6, value: 786 },
  { id: "water",        name: "Water",            mass: 1.0, value: 6 },
  { id: "methane",      name: "Methane",          mass: 0.6, value: 13 },
  { id: "ammonia",      name: "Ammonia",          mass: 0.7, value: 15 },
  { id: "nitrogen",     name: "Nitrogen",         mass: 0.8, value: 11 },
  { id: "sulfur_r",     name: "Refined sulfur",   mass: 1.9, value: 9 },
  { id: "phosphorus",   name: "Phosphorus",       mass: 1.8, value: 24 },
  { id: "carbon",       name: "Carbon",           mass: 1.4, value: 12 },
  { id: "organics",     name: "Organics",         mass: 1.1, value: 38 },
  { id: "helium3_r",    name: "Helium-3, refined", mass: 0.2, value: 260 },
  { id: "hydrogen_r",   name: "Hydrogen, refined", mass: 0.1, value: 5 },
  { id: "metallic_h_r", name: "Metallic hydrogen", mass: 1.1, value: 470 },
  { id: "deuterium_r",  name: "Deuterium",        mass: 0.2, value: 150 },
  { id: "polymer",      name: "Polymer stock",    mass: 1.0, value: 33, from: { carbon: 2, hydrogen_r: 1 } },
  { id: "glass",        name: "Glass",            mass: 1.8, value: 18, from: { silicon: 2 } },
  { id: "ceramic",      name: "Ceramic",          mass: 2.0, value: 30, from: { silicon: 1, aluminium: 1 } },
  { id: "steel",        name: "Steel",            mass: 2.7, value: 40, from: { iron: 3, carbon: 1 } },
  { id: "stainless",    name: "Stainless",        mass: 2.8, value: 127, from: { steel: 2, chromium: 1, nickel: 1 } },
  { id: "superalloy",   name: "Superalloy",       mass: 2.9, value: 190, from: { nickel: 2, cobalt: 1, titanium: 1 } },
  { id: "bronze",       name: "Bronze",           mass: 3.2, value: 102, from: { copper: 3, tin: 1 } },
  { id: "fertiliser",   name: "Fertiliser",       mass: 1.3, value: 47, from: { nitrogen: 2, phosphorus: 1 } },
];

/* ---- tier-0 components -------------------------------------------------- */
/* The first things worth calling parts. Everything here is buildable from the
 * minerals above and nothing else.                                           */

export const COMPONENTS = [
  { id: "steel_plate",  name: "Steel plate",       mass: 6.0,  value: 130,  from: { steel: 3 } },
  { id: "girder",       name: "Girder",            mass: 9.0,  value: 175,  from: { steel: 4 } },
  { id: "hull_panel",   name: "Hull panel",        mass: 7.5,  value: 290,  from: { stainless: 2, ceramic: 1 } },
  { id: "pressure_hull",name: "Pressure section",  mass: 14.0, value: 560,  from: { stainless: 3, steel_plate: 2 } },
  { id: "girder_truss", name: "Truss assembly",    mass: 22.0, value: 640,  from: { girder: 3, steel_plate: 1 } },
  { id: "bearing",      name: "Bearing set",       mass: 1.2,  value: 228,  from: { stainless: 1, bronze: 1 } },
  { id: "motor",        name: "Electric motor",    mass: 4.0,  value: 420,  from: { copper: 4, steel: 2, bearing: 1 } },
  { id: "actuator",     name: "Linear actuator",   mass: 3.2,  value: 491,  from: { motor: 1, steel_plate: 1 } },
  { id: "pump",         name: "Fluid pump",        mass: 3.8,  value: 489,  from: { motor: 1, bronze: 1 } },
  { id: "turbine",      name: "Turbine wheel",     mass: 8.5,  value: 980,  from: { superalloy: 2, bearing: 2 } },
  { id: "heat_ex",      name: "Heat exchanger",    mass: 6.2,  value: 610,  from: { copper: 3, ceramic: 2 } },
  { id: "radiator",     name: "Radiator panel",    mass: 5.0,  value: 330,  from: { aluminium: 4, steel_plate: 1 } },
  { id: "wiring",       name: "Wiring loom",       mass: 1.0,  value: 150,  from: { copper: 3, polymer: 1 } },
  { id: "capacitor",    name: "Capacitor bank",    mass: 2.4,  value: 480,  from: { aluminium: 2, ceramic: 2, wiring: 1 } },
  { id: "chip",         name: "Computer chip",     mass: 0.15, value: 900,  from: { silicon: 3, rare_earths: 1, glass: 1 } },
  { id: "sensor",       name: "Sensor cluster",    mass: 0.8,  value: 760,  from: { chip: 1, glass: 2, wiring: 1 } },
  { id: "controller",   name: "Flight controller", mass: 1.1,  value: 1450, from: { chip: 2, wiring: 2, capacitor: 1 } },
  { id: "battery",      name: "Battery block",     mass: 9.0,  value: 690,  from: { lead: 3, zinc: 2, polymer: 1 } },
  { id: "fuel_cell",    name: "Fuel cell",         mass: 4.5,  value: 880,  from: { platinum: 1, polymer: 2, wiring: 1 } },
  { id: "reactor_rod",  name: "Reactor rod",       mass: 12.0, value: 2600, from: { uranium: 2, superalloy: 1, ceramic: 2 } },
  { id: "thruster_bell",name: "Thruster bell",     mass: 11.0, value: 1350, from: { superalloy: 2, heat_ex: 1 } },
  { id: "gyro",         name: "Gyroscope",         mass: 5.5,  value: 2157, from: { motor: 2, bearing: 2, controller: 1 } },
  { id: "optic",        name: "Optical assembly",  mass: 2.0,  value: 640,  from: { glass: 3, aluminium: 1, sensor: 1 } },
  { id: "life_scrub",   name: "Air scrubber",      mass: 4.2,  value: 520,  from: { ceramic: 2, pump: 1, carbon: 2 } },
  { id: "hydroponic",   name: "Hydroponic rack",   mass: 6.8,  value: 687,  from: { steel_plate: 1, pump: 1, fertiliser: 2 } },
  { id: "ration",       name: "Ration pack",       mass: 0.6,  value: 34,   from: { organics: 1, water: 1 } },
  { id: "medkit",       name: "Medical kit",       mass: 0.5,  value: 210,  from: { organics: 2, polymer: 1 } },
  { id: "ammo_case",    name: "Ammunition case",   mass: 8.0,  value: 540,  from: { steel: 2, lead: 2, carbon: 1 } },
  { id: "armour_plate", name: "Armour plate",      mass: 16.0, value: 1250, from: { stainless: 2, ceramic: 3, titanium: 1 } },
  { id: "shield_coil",  name: "Shield coil",       mass: 7.0,  value: 2100, from: { superalloy: 1, capacitor: 2, rare_earths: 2 } },
];

/* ---- indexes ------------------------------------------------------------ */

export const ALL_GOODS = [
  ...ORES.map((o) => ({ ...o, tier: "ore" })),
  ...MINERALS.map((m) => ({ ...m, tier: "mineral" })),
  ...COMPONENTS.map((c) => ({ ...c, tier: "component" })),
];

const BY_ID = new Map(ALL_GOODS.map((g) => [g.id, g]));

export function good(id) {
  return BY_ID.get(id);
}

export function goodName(id) {
  return BY_ID.get(id)?.name ?? id;
}

export function baseValue(id) {
  return BY_ID.get(id)?.value ?? 1;
}

export function goodMass(id) {
  return BY_ID.get(id)?.mass ?? 1;
}

/** Everything a given body kind can yield, weighted by abundance. */
export function oresFor(kind) {
  return ORES.filter((o) => o.found.includes(kind));
}

/** Pick an ore from a body kind, biased by abundance. */
export function rollOre(kind, rnd) {
  const list = oresFor(kind);
  if (!list.length) return ORES[0];
  const total = list.reduce((s, o) => s + o.yield, 0);
  let r = rnd() * total;
  for (const o of list) {
    r -= o.yield;
    if (r <= 0) return o;
  }
  return list[list.length - 1];
}

/* ---- sectors ------------------------------------------------------------ */
/* Each sector produces some of the list cheaply and wants the rest badly.
 * sells: multiplier under 1 means they have a surplus.
 * buys:  multiplier over 1 means they pay over the odds.                     */

export const SECTORS = {
  logistic: {
    id: "logistic",
    name: "Logistic",
    blurb: "Freight hubs and bonded warehouses. They take anything and move it on.",
    colour: "#7fb8c9",
    sells: { hydrogen_r: 0.7, water: 0.7, steel_plate: 0.85, girder: 0.85, ration: 0.8 },
    buys: { chip: 1.15, controller: 1.15, sensor: 1.15, rare_earths: 1.2, platinum: 1.2 },
    services: ["trade", "refuel", "repair"],
  },
  military: {
    id: "military",
    name: "Military",
    blurb: "Ordnance depots and patrol berths. Well armed, poorly stocked with anything you can eat.",
    colour: "#c45c5c",
    sells: { ammo_case: 0.7, armour_plate: 0.8, shield_coil: 0.85, stainless: 0.9 },
    buys: { superalloy: 1.3, titanium: 1.25, uranium: 1.35, reactor_rod: 1.3, medkit: 1.2, ration: 1.2 },
    services: ["trade", "refuel", "repair", "rearm"],
  },
  industrial: {
    id: "industrial",
    name: "Industrial",
    blurb: "Refineries and fabrication yards. Bring them rock, leave with parts.",
    colour: "#c4a07a",
    sells: { steel: 0.7, stainless: 0.75, steel_plate: 0.7, girder: 0.7, motor: 0.8, wiring: 0.8, ceramic: 0.8 },
    buys: { iron_ore: 1.35, nickel_ore: 1.3, silicate: 1.3, bauxite: 1.3, copper_ore: 1.3, chromite: 1.35, ilmenite: 1.3 },
    services: ["trade", "refine", "fabricate", "repair", "refuel"],
  },
  civilian: {
    id: "civilian",
    name: "Civilian",
    blurb: "Habitats and dockside markets. Everything costs a little more and nobody shoots at you.",
    colour: "#9ec4e6",
    sells: { water: 0.8, ration: 0.75, medkit: 0.85, glass: 0.85, polymer: 0.85 },
    buys: { organics: 1.3, fertiliser: 1.25, hydroponic: 1.2, optic: 1.2, battery: 1.15 },
    services: ["trade", "refuel", "repair", "refit"],
  },
  agricultural: {
    id: "agricultural",
    name: "Agricultural",
    blurb: "Grow rings and vat farms. They export calories and import everything else.",
    colour: "#7d9a7e",
    sells: { organics: 0.65, ration: 0.6, fertiliser: 0.8, water: 0.75 },
    buys: { phosphorus: 1.35, nitrogen: 1.3, hydroponic: 1.35, pump: 1.2, life_scrub: 1.25, chip: 1.15 },
    services: ["trade", "refuel"],
  },
  pirate: {
    id: "pirate",
    name: "Free port",
    blurb: "A rock somebody bolted airlocks to. Prices are good because the provenance is not.",
    colour: "#c9a05c",
    sells: { ammo_case: 0.6, armour_plate: 0.7, platinum: 0.75, iridium: 0.75 },
    buys: { reactor_rod: 1.4, shield_coil: 1.4, controller: 1.35, uranium: 1.4 },
    services: ["trade", "rearm", "repair"],
  },
};

export const SECTOR_IDS = ["logistic", "military", "industrial", "civilian", "agricultural"];

/** What a station will pay for, or charge for, a given good. */
/* What a port pays over the odds for FINISHED work it does not do itself.
 *
 * 0.3.11. Before this, selling a motor back to the industrial yard that builds
 * motors paid the same as selling it to a farm that cannot make one — so
 * fabricating and then hauling the parts somewhere was worth no more than
 * dumping them at the works door, and the whole chain ended at the counter it
 * started at. A port that makes a thing has no reason to want yours; a port
 * that cannot make it does.
 *
 * Only tiers you actually BUILD get this. Ore is dug, not made, so hauling rock
 * around is unchanged. */
export const FINISHED_BONUS = { mineral: 1.12, component: 1.22 };

function finishedBonus(s, id) {
  const g = BY_ID.get(id);
  const lift = FINISHED_BONUS[g?.tier];
  if (!lift) return 1;
  if (s.sells[id]) return 1;        // it makes these: yours is competition
  if (s.buys[id]) return 1;         // already has an explicit appetite
  return lift;
}

export function priceAt(sector, id, kind = "buy") {
  const base = baseValue(id);
  const s = SECTORS[sector];
  if (!s) return base;
  if (kind === "buy") {
    /* what the station pays you */
    const m = (s.buys[id] ?? (s.sells[id] ? s.sells[id] * 0.8 : 0.92)) * finishedBonus(s, id);
    return Math.max(1, Math.round(base * m));
  }
  /* what it charges you */
  const m = s.sells[id] ?? (s.buys[id] ? s.buys[id] * 1.25 : 1.12);
  return Math.max(1, Math.round(base * m));
}

/** A plausible stock list for a station of this sector. */
export function stockFor(sector, rnd) {
  const s = SECTORS[sector];
  const out = [];
  for (const id of Object.keys(s.sells)) {
    out.push({ id, qty: Math.round(40 + rnd() * 260), sell: priceAt(sector, id, "sell") });
  }
  /* a few odds and ends everybody carries */
  for (const id of ["water", "hydrogen_r", "steel", "wiring"]) {
    if (!out.some((x) => x.id === id)) {
      out.push({ id, qty: Math.round(20 + rnd() * 120), sell: priceAt(sector, id, "sell") });
    }
  }
  return out;
}

export function demandFor(sector) {
  const s = SECTORS[sector];
  return Object.keys(s.buys).map((id) => ({ id, buy: priceAt(sector, id, "buy") }));
}
