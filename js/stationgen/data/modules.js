/* The module catalogue: what a station is made of.
 *
 * A module is the unit the placement solver works in. Each one has a
 * footprint in metres [w, h, d] — w across the mount, h out from the hull,
 * d along the spine — a prefab that draws it, a mount kind it can sit on,
 * a zone it wants along the station's axis (0 = command end, 1 = power
 * end), a sun preference, the crew it needs, what it does for the
 * station's balance sheet, and the parts it is assembled from.
 *
 * Zones are the realism: command and traffic control at the quiet end
 * with the windows; quarters, mess and kitchens together on the ring or
 * the habitat drum; life support and water in the middle next to the
 * people who breathe it; agriculture where the light is; industry, yards
 * and hangars at the working end; reactors last, behind a shadow shield,
 * with the radiators edge-on to the sun. */

export const ZONE = { command: 0.06, habitat: 0.3, services: 0.5, science: 0.42, industry: 0.74, docking: 0.66, power: 0.96 };

const M = (id, name, o) => ({
  id, name, family: id.split(".")[0], size: [30, 20, 30], mount: ["spine"], zone: ZONE.services, sun: null,
  crew: 4, pop: 0, pwr: 0, heat: 0, tags: [], parts: {}, ...o,
});

export const MODULES = {};
function add(list) { for (const m of list) { if (MODULES[m.id]) throw new Error(`duplicate module ${m.id}`); MODULES[m.id] = m; } }

/* ---- life support ---------------------------------------------------------- */
add([
  M("ls.core", "Life Support Core", {
    role: "atmosphere revitalisation for the whole station", prefab: "plant", size: [34, 18, 40], mount: ["spine", "ring", "arm"], zone: ZONE.services,
    crew: 12, tags: ["life", "required"],
    parts: { "ls.electrolysis": 4, "ls.sabatier": 3, "ls.o2_store": 6, "ls.pressure_ctl": 8, "ls.fan_bank": 6, "ls.gas_sensor": 24, "st.pressure_section": 5, "pw.switchgear": 3, "tc.pumped_loop": 3 },
  }),
  M("ls.air", "Air Filtration Plant", {
    role: "particulate and CO₂ scrubbing", prefab: "plant", size: [26, 14, 30], mount: ["spine", "ring", "arm"], zone: ZONE.services,
    crew: 6, tags: ["life", "required"],
    parts: { "ls.hepa_bank": 12, "ls.sieve": 6, "ls.amine_bed": 4, "ls.fan_bank": 8, "ls.tcc": 4, "st.pressure_section": 4, "pw.switchgear": 2 },
  }),
  M("ls.chem", "Chemical Filtration Plant", {
    role: "VOC, ammonia and trace-gas removal", prefab: "plant", size: [22, 14, 26], mount: ["spine", "ring", "arm"], zone: ZONE.services,
    crew: 5, tags: ["life", "required"],
    parts: { "ls.chem_scrubber": 8, "ls.catalytic_ox": 4, "ls.tcc": 6, "ls.gas_sensor": 12, "st.pressure_section": 3, "tc.heat_pipe": 4 },
  }),
  M("wt.plant", "Water Treatment Plant", {
    role: "potable water recovery and storage", prefab: "tankfarm", size: [30, 22, 36], mount: ["spine", "arm", "truss"], zone: ZONE.services,
    crew: 6, tags: ["life", "required"],
    parts: { "wt.multifilt": 4, "wt.urine_proc": 3, "wt.condensate": 4, "wt.brine": 2, "wt.water_tank": 6, "wt.grey_tank": 3, "wt.solids": 2, "wt.pyrolysis": 1, "wt.nutrient_rec": 2, "st.pressure_section": 3 },
  }),
]);

/* ---- agriculture --------------------------------------------------------- */
add([
  M("ag.farm", "Agriculture Deck", {
    role: "food, oxygen and green space under glass", prefab: "greenhouse", size: [48, 20, 60], mount: ["ring", "spine", "arm"], zone: ZONE.habitat, sun: "face",
    crew: 18, tags: ["agri", "required", "windows"],
    parts: { "ag.hydro_rack": 40, "ag.grow_lamp": 60, "ag.soil_bed": 12, "ag.harvester": 2, "ag.glazing": 48, "ag.seed_vault": 1, "wt.nutrient_rec": 2, "st.pressure_section": 6, "tc.body_rad": 4 },
  }),
  M("ag.algae", "Algae Bioreactor Farm", {
    role: "bulk O₂ and protein from photobioreactors", prefab: "tankfarm", size: [28, 18, 32], mount: ["spine", "arm", "truss"], zone: ZONE.services, sun: "face",
    crew: 4, tags: ["agri"],
    parts: { "ag.algae_reactor": 12, "ag.grow_lamp": 16, "ag.livestock": 4, "wt.nutrient_rec": 1, "st.pressure_section": 3 },
  }),
]);

/* ---- science ------------------------------------------------------------- */
add([
  M("sc.rnd", "R&D Laboratory", {
    role: "research and development wing", prefab: "labstack", size: [30, 24, 34], mount: ["spine", "arm", "ring"], zone: ZONE.science,
    crew: 24, tags: ["science", "required", "windows"],
    parts: { "sc.lab_bench": 6, "sc.biolab": 2, "sc.materials_lab": 2, "sc.sample_vault": 1, "sc.quantum": 1, "cd.core": 1, "st.pressure_section": 5, "tc.cryocooler": 3 },
  }),
  M("sc.observatory", "Observatory", {
    role: "telescopes and spectrometers on a despun mount", prefab: "observatory", size: [22, 26, 22], mount: ["end", "surface"], zone: ZONE.command, sun: "shade",
    crew: 4, tags: ["science"],
    parts: { "sw.telescope": 2, "sw.spectro": 2, "st.despin": 1, "cd.core": 1, "tc.cryocooler": 2 },
  }),
]);

/* ---- industry ------------------------------------------------------------ */
add([
  M("mf.shipyard", "Ship Manufacturing Yard", {
    role: "hull assembly on open jigs beside the hangar", prefab: "shipyard", size: [110, 60, 140], mount: ["truss", "end", "spine"], zone: ZONE.industry,
    crew: 60, tags: ["industry", "required", "yard"],
    parts: { "mf.assembly_jig": 2, "mf.gantry_crane": 2, "mf.weld_arm": 12, "mf.printer": 4, "mf.ebeam": 2, "mf.test_stand": 2, "mf.spares": 6, "st.truss_bay": 40, "dk.field_lamp": 24, "pw.hvdc": 8 },
  }),
  M("mf.industrial", "Industrial Works", {
    role: "refining, smelting and heavy process", prefab: "works", size: [50, 30, 60], mount: ["spine", "truss", "arm"], zone: ZONE.industry, sun: "shade",
    crew: 40, tags: ["industry", "required"],
    parts: { "mf.refinery": 2, "mf.furnace": 2, "mf.crusher": 2, "mf.chem_plant": 2, "tc.body_rad": 12, "st.pressure_section": 6, "pw.switchgear": 4, "pw.hvdc": 6 },
  }),
  M("mf.fab", "Fabrication Bay", {
    role: "additive and precision manufacturing", prefab: "plant", size: [30, 18, 34], mount: ["spine", "arm", "ring"], zone: ZONE.industry,
    crew: 16, tags: ["industry"],
    parts: { "mf.printer": 6, "mf.ebeam": 3, "mf.test_stand": 1, "mf.spares": 4, "st.pressure_section": 4, "tc.pumped_loop": 2 },
  }),
]);

/* ---- trade & cargo ------------------------------------------------------- */
add([
  M("cg.trading", "Trading Concourse", {
    role: "market hall, exchange floor and customs", prefab: "concourse", size: [50, 22, 50], mount: ["ring", "spine", "arm"], zone: ZONE.docking,
    crew: 30, tags: ["trade", "required", "windows"],
    parts: { "cg.market_hall": 2, "cg.exchange": 1, "cg.customs": 2, "hb.transit_car": 2, "st.pressure_section": 6, "st.viewport": 30 },
  }),
  M("cg.warehouse", "Bonded Warehouse", {
    role: "bulk cargo in bond", prefab: "warehouse", size: [40, 26, 48], mount: ["truss", "spine", "arm"], zone: ZONE.docking,
    crew: 12, tags: ["trade"],
    parts: { "cg.bonded_hold": 2, "cg.container": 24, "cg.rack": 20, "dk.crane": 1, "st.pressure_section": 4 },
  }),
  M("cg.depot", "Propellant Depot", {
    role: "cryogenic tank farm for visiting hulls", prefab: "tankfarm", size: [36, 30, 44], mount: ["truss", "end", "spine"], zone: ZONE.power, sun: "shade",
    crew: 6, tags: ["trade", "hazard"],
    parts: { "cg.fuel_tank": 4, "dk.fuel_port": 6, "tc.cryocooler": 4, "tc.mli": 60, "st.truss_bay": 8 },
  }),
]);

/* ---- command ------------------------------------------------------------- */
add([
  M("cmd.deck", "Command Deck", {
    role: "station command, with the view", prefab: "command", size: [36, 24, 30], mount: ["end", "spine"], zone: ZONE.command,
    crew: 24, tags: ["command", "required", "windows"],
    parts: { "cd.core": 2, "cd.console": 24, "cd.network": 4, "st.viewport": 40, "st.pressure_section": 4, "sf.fire_supp": 2 },
  }),
  M("cmd.traffic", "Traffic Control Tower", {
    role: "lane control and approach radar over the hangars", prefab: "tower", size: [14, 40, 14], mount: ["surface", "spine"], zone: ZONE.docking,
    crew: 10, tags: ["command", "required"],
    parts: { "cd.traffic_ctl": 2, "sw.radar": 2, "sw.lidar": 4, "cd.beacon": 4, "cd.console": 8, "st.viewport": 16, "st.pressure_section": 2 },
  }),
]);

/* ---- habitation ---------------------------------------------------------- */
add([
  M("hb.quarters_1", "Living Quarters — Tier I", {
    role: "cabin pods for a working crew", prefab: "podblock", size: [40, 22, 48], mount: ["spine", "arm", "ring"], zone: ZONE.habitat,
    crew: 0, pop: 240, tags: ["habitat", "windows"],
    parts: { "hb.cabin_block": 20, "hb.hygiene": 10, "hb.airlock": 2, "st.pressure_section": 8, "st.viewport": 48, "ls.fan_bank": 4 },
  }),
  M("hb.quarters_2", "Living Quarters — Tier II", {
    role: "a rotating ring section: gravity, streets, cabins", prefab: "ringsection", size: [60, 30, 60], mount: ["ring"], zone: ZONE.habitat,
    crew: 0, pop: 2400, tags: ["habitat", "windows", "gravity"],
    parts: { "st.ring_segment": 4, "hb.cabin_block": 200, "hb.hygiene": 80, "hb.airlock": 4, "st.viewport": 400, "ls.fan_bank": 24, "hb.transit_car": 4 },
  }),
  M("hb.quarters_3", "Living Quarters — Tier III", {
    role: "a full habitat drum: districts under a sky", prefab: "habdrum", size: [160, 160, 220], mount: ["drum"], zone: ZONE.habitat,
    crew: 0, pop: 24000, tags: ["habitat", "windows", "gravity"],
    parts: { "st.ring_segment": 24, "st.bearing": 2, "hb.cabin_block": 2000, "hb.hygiene": 700, "hb.airlock": 12, "st.viewport": 3000, "ls.fan_bank": 200, "hb.transit_car": 24, "st.storm_shelter": 40 },
  }),
  M("hb.mess", "Mess Hall", {
    role: "where everyone eats", prefab: "hall", size: [30, 16, 34], mount: ["ring", "spine", "arm"], zone: ZONE.habitat,
    crew: 8, tags: ["habitat", "required", "windows"],
    parts: { "hb.mess_deck": 2, "st.viewport": 20, "st.pressure_section": 4, "ls.fan_bank": 2 },
  }),
  M("hb.kitchen", "Kitchens", {
    role: "galleys and cold stores serving the mess", prefab: "plant", size: [22, 14, 26], mount: ["ring", "spine", "arm"], zone: ZONE.habitat,
    crew: 14, tags: ["habitat", "required"],
    parts: { "hb.galley_line": 3, "hb.cold_store": 4, "wt.grey_tank": 1, "ls.fan_bank": 3, "st.pressure_section": 3 },
  }),
  M("hb.brig", "Brig", {
    role: "cells and a marshal's office", prefab: "brig", size: [18, 14, 22], mount: ["spine", "ring", "arm"], zone: ZONE.command,
    crew: 6, tags: ["habitat", "required", "security"],
    parts: { "hb.cell_block": 2, "hb.airlock": 1, "sf.isolation": 2, "sf.armour": 8, "st.pressure_section": 2 },
  }),
  M("hb.medical", "Medical Centre", {
    role: "wards, surgery, quarantine", prefab: "hall", size: [26, 16, 30], mount: ["ring", "spine", "arm"], zone: ZONE.habitat,
    crew: 12, tags: ["habitat", "windows"],
    parts: { "hb.medbay": 3, "hb.hygiene": 4, "sc.biolab": 1, "st.pressure_section": 3, "ls.hepa_bank": 4 },
  }),
  M("hb.commons", "Recreation Commons", {
    role: "parks, gyms and a place to be off shift", prefab: "hall", size: [34, 18, 38], mount: ["ring", "spine"], zone: ZONE.habitat,
    crew: 6, tags: ["habitat", "windows"],
    parts: { "hb.rec": 3, "hb.exercise": 4, "st.viewport": 30, "st.pressure_section": 4 },
  }),
  M("st.shelter", "Storm Shelter", {
    role: "radiation refuge for the whole population", prefab: "shelter", size: [20, 14, 24], mount: ["spine", "ring"], zone: ZONE.habitat,
    crew: 0, tags: ["safety", "required"],
    parts: { "st.storm_shelter": 6, "wt.water_tank": 2, "ls.o2_store": 2, "hb.airlock": 2, "st.pressure_section": 3 },
  }),
]);

/* ---- power & thermal ----------------------------------------------------- */
add([
  M("pw.solar", "Solar Wing Array", {
    role: "photovoltaic wings tracking the sun", prefab: "solarwing", size: [120, 6, 60], mount: ["truss", "spine", "end"], zone: ZONE.power, sun: "face",
    crew: 2, pwr: 8000, tags: ["power"],
    parts: { "pw.solar_wing": 4, "pw.hvdc": 6, "pw.switchgear": 2, "st.truss_bay": 6, "st.bearing": 1 },
  }),
  M("pw.reactor", "Fission Plant", {
    role: "fission power behind a shadow shield", prefab: "reactor", size: [30, 30, 46], mount: ["end", "spine"], zone: ZONE.power, sun: "shade",
    crew: 10, pwr: 12000, heat: 27000, tags: ["power", "hazard"],
    parts: { "pw.mw_plant": 3, "pw.brayton": 4, "st.rad_shield": 2, "pw.hvdc": 8, "pw.switchgear": 4, "tc.pumped_loop": 6 },
  }),
  M("pw.fusion", "Fusion Plant", {
    role: "tokamak power for a city", prefab: "reactor", size: [50, 50, 70], mount: ["end", "spine"], zone: ZONE.power, sun: "shade",
    crew: 30, pwr: 40000, heat: 60000, tags: ["power", "hazard"],
    parts: { "pw.tokamak": 1, "pw.brayton": 8, "st.rad_shield": 4, "pw.hvdc": 12, "pw.switchgear": 6, "pw.smes": 4, "tc.pumped_loop": 10 },
  }),
  M("pw.kilo_bank", "Kilopower Bank", {
    role: "a rack of small fission units for an outpost", prefab: "reactor", size: [16, 16, 24], mount: ["end", "spine", "truss"], zone: ZONE.power, sun: "shade",
    crew: 3, pwr: 960, heat: 3000, tags: ["power", "hazard"],
    parts: { "pw.kilo": 8, "st.rad_shield": 1, "pw.hvdc": 3, "pw.switchgear": 2, "tc.pumped_loop": 2 },
  }),
  M("pw.storage", "Power Storage Bank", {
    role: "batteries and SMES for the night side", prefab: "plant", size: [20, 12, 24], mount: ["spine", "truss", "arm"], zone: ZONE.power,
    crew: 2, tags: ["power"],
    parts: { "pw.battery": 24, "pw.smes": 2, "pw.hvdc": 4, "pw.switchgear": 2 },
  }),
  M("tc.radiators", "Radiator Array", {
    role: "heat rejection, edge-on to the sun", prefab: "radiators", size: [90, 4, 50], mount: ["truss", "spine", "end"], zone: ZONE.power, sun: "edge",
    crew: 1, heat: -12000, tags: ["thermal", "required"],
    parts: { "tc.radiator_wing": 12, "tc.pumped_loop": 4, "tc.heat_pipe": 12, "st.truss_bay": 4 },
  }),
]);

/* ---- docking ------------------------------------------------------------- */
add([
  M("dk.hangar", "Hangar Bay", {
    role: "a lit mouth a hundred and ten metres across — three ways in, three ways out", prefab: "hangar", size: [110, 50, 140], mount: ["spine", "surface", "end", "truss"], zone: ZONE.docking,
    crew: 20, tags: ["docking", "required", "hangar"],
    parts: { "dk.hangar_frame": 1, "dk.bay_door": 2, "dk.lane_gantry": 6, "dk.clamp": 12, "dk.tug": 3, "dk.crane": 2, "dk.field_lamp": 40, "cd.beacon": 6, "sw.lidar": 6, "st.pressure_section": 6 },
  }),
  M("dk.docking", "Docking Cluster", {
    role: "collars and berths for small craft", prefab: "dockcluster", size: [28, 24, 28], mount: ["end", "surface", "arm"], zone: ZONE.docking,
    crew: 6, tags: ["docking"],
    parts: { "dk.crew_collar": 6, "dk.cargo_collar": 2, "dk.fuel_port": 2, "dk.clamp": 4, "pw.umbilical": 6, "dk.field_lamp": 8 },
  }),
]);

/* ---- comms, sensors, defence --------------------------------------------- */
add([
  M("cd.comms", "Comms Array", {
    role: "dishes and phased arrays on a mast", prefab: "commsmast", size: [16, 40, 16], mount: ["end", "surface", "truss"], zone: ZONE.command,
    crew: 4, tags: ["comms", "required"],
    parts: { "cd.hga": 2, "cd.phased": 4, "cd.laser_term": 2, "cd.relay_mast": 1, "cd.beacon": 2, "cd.network": 2 },
  }),
  M("sw.sensors", "Sensor Mast", {
    role: "approach and debris radar", prefab: "sensormast", size: [10, 30, 10], mount: ["surface", "end", "truss"], zone: ZONE.docking,
    crew: 2, tags: ["sensors", "required"],
    parts: { "sw.radar": 2, "sw.debris_radar": 2, "sw.lidar": 2, "sw.shm": 4, "cd.relay_mast": 1 },
  }),
  M("sf.defense", "Railgun Battery", {
    role: "a twin railgun turret on a barbette, with its own magazine", prefab: "battery", size: [20, 14, 20], mount: ["surface", "end", "truss", "spine", "arm"], zone: ZONE.docking,
    crew: 8, tags: ["defence", "weapon"],
    parts: { "sf.rail": 2, "sf.barbette": 1, "sf.pdc": 2, "sf.tracker": 2, "sf.magazine": 2, "sf.slug": 400, "sf.armour": 12, "sf.capacitor": 2 },
  }),
  M("sf.pdc_cluster", "Point-Defence Cluster", {
    role: "close-in cannon and laser mounts covering the approaches", prefab: "pdc", size: [12, 9, 12], mount: ["surface", "spine", "truss", "arm", "ring", "end"], zone: ZONE.docking,
    crew: 3, tags: ["defence", "weapon", "required"],
    parts: { "sf.pdc": 4, "sf.pd_laser": 2, "sf.tracker": 2, "sf.magazine": 1, "sf.armour": 4 },
  }),
  M("sf.laser_battery", "Laser Battery", {
    role: "heavy laser cannon in an armoured lens turret", prefab: "laserturret", size: [18, 16, 18], mount: ["surface", "spine", "truss", "arm", "end"], zone: ZONE.docking,
    crew: 6, tags: ["defence", "weapon"],
    parts: { "sf.laser_cannon": 1, "sf.barbette": 1, "sf.tracker": 2, "sf.capacitor": 4, "tc.radiator_wing": 2, "sf.armour": 10 },
  }),
  M("sf.missile_cells", "Missile Cells", {
    role: "vertical launch cells with in-house interceptors and torpedoes", prefab: "vls", size: [22, 8, 30], mount: ["spine", "surface", "truss", "arm"], zone: ZONE.docking,
    crew: 6, tags: ["defence", "weapon"],
    parts: { "sf.vls_cell": 24, "sf.missile": 48, "sf.torpedo": 8, "sf.fc_radar": 1, "sf.magazine": 2, "sf.armour": 8, "mf.munitions": 1 },
  }),
  M("sf.spinal", "Spinal Mass Driver", {
    role: "a station-size gun down the axis: rails, capacitor rings and a muzzle you could fly through", prefab: "spinal", size: [30, 30, 40], mount: ["end", "spine"], zone: ZONE.command, sun: "shade",
    crew: 30, tags: ["defence", "weapon", "capital"],
    parts: { "sf.spinal_rail": 4, "sf.capacitor": 24, "sf.slug": 200, "sf.magazine": 4, "pw.smes": 6, "tc.pumped_loop": 6, "sf.fc_radar": 2, "sf.armour": 30, "mf.munitions": 1 },
  }),
  M("sf.siege_laser", "Siege Laser", {
    role: "a station-size beam on a gimballed twelve-metre optic", prefab: "siege", size: [40, 36, 40], mount: ["surface", "end", "truss", "spine"], zone: ZONE.docking, sun: "shade",
    crew: 20, tags: ["defence", "weapon", "capital"],
    parts: { "sf.siege_optic": 1, "sf.siege_driver": 1, "sf.capacitor": 16, "sf.barbette": 1, "tc.radiator_wing": 6, "tc.pumped_loop": 4, "sf.fc_radar": 2, "sf.armour": 20 },
  }),
  M("sf.shield", "Shield Emitter Array", {
    role: "field generator and emitter spines projecting a shield section", prefab: "shieldnode", size: [20, 26, 20], mount: ["surface", "spine", "truss", "arm", "end", "ring"], zone: ZONE.services,
    crew: 6, tags: ["defence", "shield"],
    parts: { "sf.shield_gen": 1, "sf.shield_emit": 6, "sf.capacitor": 8, "pw.smes": 2, "tc.pumped_loop": 3, "cd.core": 1 },
  }),
  M("sf.drone_bay", "Drone Bay", {
    role: "launch cells and a fabrication line: drones built in house from traded stock", prefab: "dronebay", size: [30, 14, 36], mount: ["spine", "surface", "truss", "arm", "end"], zone: ZONE.docking,
    crew: 14, tags: ["defence", "hangar-lite", "drones"],
    parts: { "sf.drone_cell": 12, "sf.drone": 24, "sf.drone_ctl": 2, "mf.drone_line": 1, "mf.spares": 2, "dk.clamp": 12, "dk.field_lamp": 8, "st.pressure_section": 3 },
  }),
  M("sf.fire_control", "Fire-Control Mast", {
    role: "targeting radar and datalinks for every gun on the hull", prefab: "sensormast", size: [10, 26, 10], mount: ["surface", "end", "truss", "spine"], zone: ZONE.docking,
    crew: 4, tags: ["defence", "sensors"],
    parts: { "sf.fc_radar": 3, "sw.lidar": 2, "cd.core": 1, "cd.relay_mast": 1, "sf.tracker": 2 },
  }),
  M("sf.armoury", "Armoury & Plate Works", {
    role: "armour pressed and munitions filled from traded metal", prefab: "plant", size: [26, 16, 30], mount: ["spine", "truss", "arm"], zone: ZONE.industry, sun: "shade",
    crew: 16, tags: ["defence", "industry"],
    parts: { "mf.armour_press": 1, "mf.munitions": 2, "mf.drone_line": 1, "sf.sloped_plate": 20, "mf.spares": 2, "st.pressure_section": 3, "tc.body_rad": 4 },
  }),
]);

/* ---- array variants ---------------------------------------------------------- */
add([
  M("pw.solar_fan", "Solar Petal Fan", {
    role: "a radial fan of deployable petals on a tracking hub", prefab: "solarfan", size: [90, 8, 90], mount: ["truss", "spine", "end", "surface"], zone: ZONE.power, sun: "face",
    crew: 2, pwr: 6000, tags: ["power"],
    parts: { "pw.solar_petal": 12, "pw.hvdc": 5, "pw.switchgear": 2, "st.bearing": 1, "st.truss_bay": 3 },
  }),
  M("pw.solar_sail", "Solar Sail Array", {
    role: "a single thin-film sail on catenary booms", prefab: "solarsail", size: [140, 6, 100], mount: ["truss", "end", "spine"], zone: ZONE.power, sun: "face",
    crew: 1, pwr: 9000, tags: ["power"],
    parts: { "pw.solar_sail": 3, "pw.hvdc": 6, "pw.switchgear": 2, "st.truss_bay": 8, "st.bearing": 1 },
  }),
  M("pw.concentrators", "Concentrator Field", {
    role: "dishes focusing sun on PV cells", prefab: "concentrators", size: [70, 20, 60], mount: ["truss", "spine", "end", "surface"], zone: ZONE.power, sun: "face",
    crew: 2, pwr: 4800, heat: 800, tags: ["power"],
    parts: { "pw.concentrator": 4, "pw.hvdc": 4, "pw.switchgear": 2, "tc.body_rad": 4, "st.truss_bay": 3 },
  }),
  M("cd.big_dish", "Deep-Space Dish", {
    role: "a sixty-metre dish on a steerable yoke", prefab: "bigdish", size: [60, 40, 60], mount: ["end", "surface", "truss", "spine"], zone: ZONE.command,
    crew: 3, tags: ["comms"],
    parts: { "cd.big_dish": 1, "cd.horn": 2, "cd.laser_term": 1, "cd.network": 2, "st.bearing": 1 },
  }),
  M("cd.phased_slab", "Phased-Array Slabs", {
    role: "flat panels that steer beams without moving", prefab: "phasedslab", size: [40, 6, 30], mount: ["spine", "surface", "truss", "ring", "arm"], zone: ZONE.command,
    crew: 2, tags: ["comms"],
    parts: { "cd.array_slab": 3, "cd.network": 2, "cd.beacon": 1, "tc.heat_pipe": 4 },
  }),
  M("sf.lifeboats", "Lifeboat Rack", {
    role: "pods for a fifth of the population", prefab: "lifeboats", size: [24, 10, 30], mount: ["surface", "spine", "ring"], zone: ZONE.habitat,
    crew: 0, tags: ["safety", "required"],
    parts: { "sf.lifeboat": 8, "hb.airlock": 2, "dk.clamp": 8 },
  }),
]);

export const MODULE_COUNT = Object.keys(MODULES).length;
export const REQUIRED = Object.values(MODULES).filter((m) => m.tags.includes("required")).map((m) => m.id);
