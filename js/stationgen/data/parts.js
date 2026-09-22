/* The parts catalogue. A station module is assembled from these; each part
 * carries its mass (t), its net power (kW, + generates, − draws), its heat
 * to reject (kW), and a raw-material split (mass shares by material id)
 * that the bill of materials rolls up. Grouped by domain so the parts
 * list reads like a yard manifest. */

const P = (id, name, o) => ({ id, name, mass: 1, pwr: 0, heat: 0, ...o });

export const PART_DOMAINS = {
  st: "Structure & pressure hulls",
  pw: "Power & distribution",
  tc: "Thermal control",
  ls: "Life support",
  wt: "Water & waste",
  ag: "Agriculture",
  hb: "Habitation",
  cd: "Computing, control & comms",
  sw: "Sensors",
  dk: "Docking & hangar",
  mf: "Manufacturing & industry",
  sc: "Science",
  sf: "Safety & defence",
  cg: "Cargo & stores",
};

export const PARTS = {};
function add(list) { for (const p of list) { if (PARTS[p.id]) throw new Error(`duplicate part ${p.id}`); p.domain = p.id.split(".")[0]; PARTS[p.id] = p; } }

/* ---- structure ------------------------------------------------------------ */
add([
  P("st.pressure_section", "Pressure hull section (8 m)",   { mass: 14, bom: { al_li: 0.62, ti64: 0.18, kevlar: 0.08, kapton: 0.04, epoxy: 0.08 } }),
  P("st.ring_segment",     "Rotating ring segment (30°)",   { mass: 220, bom: { al_li: 0.55, ti64: 0.2, cfrp: 0.12, kevlar: 0.08, epoxy: 0.05 } }),
  P("st.spine_segment",    "Core spine segment (20 m)",     { mass: 180, bom: { ti64: 0.4, al_li: 0.35, steel304: 0.15, cfrp: 0.1 } }),
  P("st.truss_bay",        "Truss lattice bay (10 m)",      { mass: 6, bom: { cfrp: 0.5, ti64: 0.35, al6061: 0.15 } }),
  P("st.hull_plate",       "External hull plate",           { mass: 1.2, bom: { al_li: 0.7, kevlar: 0.2, kapton: 0.1 } }),
  P("st.whipple",          "Whipple / multi-shock shield",  { mass: 1.6, bom: { al6061: 0.5, kevlar: 0.35, kapton: 0.15 } }),
  P("st.viewport",         "Armoured viewport",             { mass: 0.8, bom: { sapphire: 0.45, fused_si: 0.3, ti64: 0.25 } }),
  P("st.bearing",          "Spin bearing & slip-ring set",  { mass: 40, pwr: -12, bom: { steel304: 0.5, ti64: 0.2, cu: 0.15, ndfeb: 0.05, ptfe: 0.1 } }),
  P("st.despin",           "Despun hub coupling",           { mass: 18, pwr: -6, bom: { steel304: 0.45, ti64: 0.3, cu: 0.15, ptfe: 0.1 } }),
  P("st.mmod_frame",       "MMOD stand-off frame",          { mass: 0.4, bom: { al6061: 0.7, cfrp: 0.3 } }),
  P("st.rad_shield",       "Reactor shadow shield",         { mass: 60, bom: { w: 0.35, pb: 0.3, b4c: 0.15, pe: 0.2 } }),
  P("st.storm_shelter",    "Storm shelter lining",          { mass: 22, bom: { pe: 0.6, water: 0.3, al_li: 0.1 } }),
]);
/* ---- power --------------------------------------------------------------- */
add([
  P("pw.solar_wing",   "Multi-junction solar wing (2 MW)", { mass: 9, pwr: 2000, bom: { gaas: 0.12, cfrp: 0.4, kapton: 0.28, cu: 0.2 } }),
  P("pw.kilo",         "Kilopower fission unit (120 kW)",  { mass: 6, pwr: 120, heat: 380, bom: { hale: 0.1, steel304: 0.35, nak: 0.15, w: 0.1, b4c: 0.1, inconel: 0.2 } }),
  P("pw.mw_plant",     "Multi-MW fission plant",           { mass: 42, pwr: 4000, heat: 9000, bom: { hale: 0.08, steel304: 0.3, inconel: 0.22, nak: 0.15, w: 0.1, b4c: 0.15 } }),
  P("pw.tokamak",      "Tokamak fusion plant",             { mass: 180, pwr: 40000, heat: 60000, bom: { rebco: 0.12, inconel: 0.3, steel304: 0.25, w: 0.15, he3: 0.01, cu: 0.17 } }),
  P("pw.brayton",      "Brayton turbo-alternator",         { mass: 4, pwr: 600, heat: 900, bom: { inconel: 0.5, steel304: 0.3, cu: 0.2 } }),
  P("pw.battery",      "Solid-state battery block",        { mass: 3.5, bom: { li: 0.45, al6061: 0.3, cu: 0.15, pe: 0.1 } }),
  P("pw.smes",         "SMES coil",                        { mass: 5, pwr: -8, bom: { rebco: 0.3, steel304: 0.4, cu: 0.2, aerogel: 0.1 } }),
  P("pw.hvdc",         "HVDC bus segment",                 { mass: 1.1, bom: { cu: 0.6, al6061: 0.2, ptfe: 0.2 } }),
  P("pw.switchgear",   "Switchgear & fault isolation",     { mass: 0.9, pwr: -2, bom: { cu: 0.4, si: 0.05, al6061: 0.35, ptfe: 0.2 } }),
  P("pw.umbilical",    "Umbilical power port",             { mass: 0.5, bom: { cu: 0.5, steel304: 0.3, ptfe: 0.2 } }),
]);
/* ---- thermal ------------------------------------------------------------- */
add([
  P("tc.radiator_wing", "Deployable radiator wing (1 MW)",  { mass: 7, heat: -1000, bom: { cfrp: 0.4, al6061: 0.3, nh3: 0.15, ti64: 0.15 } }),
  P("tc.body_rad",      "Body-mounted radiator panel",      { mass: 1.5, heat: -150, bom: { al6061: 0.6, cfrp: 0.25, nh3: 0.15 } }),
  P("tc.pumped_loop",   "Pumped two-phase loop",            { mass: 1.2, pwr: -6, bom: { steel304: 0.4, nh3: 0.3, cu: 0.3 } }),
  P("tc.heat_pipe",     "Heat-pipe network",                { mass: 0.6, bom: { al6061: 0.6, nh3: 0.2, cu: 0.2 } }),
  P("tc.cryocooler",    "Cryocooler",                       { mass: 0.8, pwr: -8, bom: { steel304: 0.5, cu: 0.3, inconel: 0.2 } }),
  P("tc.mli",           "MLI blanket (100 m²)",             { mass: 0.15, bom: { kapton: 0.9, pe: 0.1 } }),
]);
/* ---- life support -------------------------------------------------------- */
add([
  P("ls.electrolysis",  "Water electrolysis O₂ plant",     { mass: 1.4, pwr: -12, heat: 8, bom: { steel304: 0.4, nafion: 0.1, pt: 0.001, ti64: 0.25, water: 0.25 } }),
  P("ls.sabatier",      "Sabatier CO₂ reactor",            { mass: 1.0, pwr: -5, heat: 6, bom: { inconel: 0.4, steel304: 0.4, pt: 0.001, alumina: 0.2 } }),
  P("ls.sieve",         "4-bed molecular sieve",           { mass: 0.6, pwr: -3, bom: { zeolite: 0.4, al6061: 0.4, steel304: 0.2 } }),
  P("ls.amine_bed",     "Amine swing bed",                 { mass: 0.6, pwr: -3, bom: { amine: 0.4, al6061: 0.4, steel304: 0.2 } }),
  P("ls.tcc",           "Trace contaminant control",       { mass: 0.5, pwr: -2, bom: { activated_c: 0.4, al6061: 0.4, alumina: 0.2 } }),
  P("ls.hepa_bank",     "HEPA / ULPA filter bank",         { mass: 0.4, pwr: -1, bom: { hepa: 0.6, al6061: 0.4 } }),
  P("ls.chem_scrubber", "Chemical scrubber (VOC / NH₃)",   { mass: 0.9, pwr: -4, bom: { activated_c: 0.35, zeolite: 0.2, steel304: 0.3, pt: 0.001, alumina: 0.15 } }),
  P("ls.catalytic_ox",  "Catalytic oxidiser",              { mass: 0.5, pwr: -6, heat: 4, bom: { pt: 0.002, alumina: 0.5, inconel: 0.5 } }),
  P("ls.fan_bank",      "Cabin fan & duct bank",           { mass: 0.7, pwr: -4, bom: { al6061: 0.6, cu: 0.2, pe: 0.2 } }),
  P("ls.pressure_ctl",  "Pressure control assembly",       { mass: 0.4, bom: { steel304: 0.5, al6061: 0.3, ptfe: 0.2 } }),
  P("ls.o2_store",      "High-pressure O₂ / N₂ store",     { mass: 2.2, bom: { cfrp: 0.5, ti64: 0.3, lox: 0.2 } }),
  P("ls.gas_sensor",    "Cabin gas sensor net",            { mass: 0.1, pwr: -0.5, bom: { si: 0.1, al6061: 0.5, cu: 0.4 } }),
]);
/* ---- water & waste ------------------------------------------------------- */
add([
  P("wt.multifilt",    "Multifiltration & catalytic reactor", { mass: 2, pwr: -3, bom: { steel304: 0.4, activated_c: 0.2, pt: 0.001, ti64: 0.2, water: 0.2 } }),
  P("wt.urine_proc",   "Urine processor assembly",           { mass: 1, pwr: -3, bom: { steel304: 0.5, ti64: 0.3, ptfe: 0.2 } }),
  P("wt.condensate",   "Condensate recovery",                { mass: 0.6, pwr: -2, bom: { al6061: 0.5, steel304: 0.3, cu: 0.2 } }),
  P("wt.brine",        "Brine processor",                    { mass: 0.7, pwr: -3, bom: { steel304: 0.6, ptfe: 0.2, ti64: 0.2 } }),
  P("wt.water_tank",   "Potable water tank (50 t)",          { mass: 4, bom: { water: 0.85, ti64: 0.1, al_li: 0.05 } }),
  P("wt.grey_tank",    "Grey-water buffer tank",             { mass: 2.5, bom: { water: 0.8, al_li: 0.2 } }),
  P("wt.solids",       "Solids collection & drying",         { mass: 0.9, pwr: -2, bom: { steel304: 0.6, pe: 0.2, al6061: 0.2 } }),
  P("wt.pyrolysis",    "Pyrolysis / composting unit",        { mass: 1.4, pwr: -8, heat: 5, bom: { inconel: 0.4, steel304: 0.4, alumina: 0.2 } }),
  P("wt.nutrient_rec", "Nutrient recovery",                  { mass: 0.6, pwr: -2, bom: { steel304: 0.4, nafion: 0.1, pe: 0.5 } }),
]);
/* ---- agriculture --------------------------------------------------------- */
add([
  P("ag.hydro_rack",   "Hydroponic rack module",          { mass: 1.8, pwr: -7, heat: 5, bom: { al6061: 0.4, pe: 0.25, water: 0.15, nutrient: 0.05, biomass: 0.15 } }),
  P("ag.grow_lamp",    "LED grow-light array",            { mass: 0.3, pwr: -4, heat: 3, bom: { gaas: 0.05, al6061: 0.6, cu: 0.25, fused_si: 0.1 } }),
  P("ag.algae_reactor","Algae photobioreactor",           { mass: 2.2, pwr: -3, bom: { fused_si: 0.3, water: 0.4, biomass: 0.15, steel304: 0.15 } }),
  P("ag.soil_bed",     "Regolith soil bed",               { mass: 6, bom: { soil: 0.85, pe: 0.1, water: 0.05 } }),
  P("ag.seed_vault",   "Seed vault",                      { mass: 3, pwr: -3, bom: { steel304: 0.5, aerogel: 0.1, biomass: 0.1, al_li: 0.3 } }),
  P("ag.harvester",    "Harvest & processing line",       { mass: 1.5, pwr: -4, bom: { steel304: 0.6, al6061: 0.3, pe: 0.1 } }),
  P("ag.livestock",    "Cell-culture protein cell",       { mass: 1.2, pwr: -5, bom: { steel304: 0.5, biomass: 0.2, pharma: 0.05, pe: 0.25 } }),
  P("ag.glazing",      "Greenhouse glazing panel",        { mass: 0.9, bom: { fused_si: 0.6, ti64: 0.25, kevlar: 0.15 } }),
]);
/* ---- habitation ---------------------------------------------------------- */
add([
  P("hb.cabin_block",  "Cabin block (12 berths)",          { mass: 3, pwr: -3, bom: { al6061: 0.5, pe: 0.25, kevlar: 0.1, cfrp: 0.15 } }),
  P("hb.hygiene",      "Hygiene module",                   { mass: 0.9, pwr: -1, bom: { steel304: 0.4, pe: 0.4, al6061: 0.2 } }),
  P("hb.galley_line",  "Galley line (300 covers)",         { mass: 2.4, pwr: -18, heat: 12, bom: { steel304: 0.6, cu: 0.15, alumina: 0.1, pe: 0.15 } }),
  P("hb.cold_store",   "Cold store",                       { mass: 1.6, pwr: -6, bom: { steel304: 0.4, aerogel: 0.1, al6061: 0.3, cu: 0.2 } }),
  P("hb.mess_deck",    "Mess deck fit-out (200 seats)",    { mass: 2, bom: { al6061: 0.5, pe: 0.3, cfrp: 0.2 } }),
  P("hb.medbay",       "Medical bay & bioprinter",         { mass: 3, pwr: -6, bom: { steel304: 0.35, al6061: 0.3, si: 0.02, pharma: 0.08, pe: 0.25 } }),
  P("hb.exercise",     "Exercise module",                  { mass: 1.4, pwr: -2, bom: { steel304: 0.5, al6061: 0.3, pe: 0.2 } }),
  P("hb.rec",          "Recreation commons",               { mass: 2, pwr: -3, bom: { al6061: 0.5, pe: 0.3, fused_si: 0.2 } }),
  P("hb.cell_block",   "Brig cell block (8 cells)",        { mass: 2.6, pwr: -1, bom: { steel304: 0.7, ti64: 0.2, pe: 0.1 } }),
  P("hb.airlock",      "Personnel airlock",                { mass: 1.6, pwr: -1, bom: { al_li: 0.5, ti64: 0.3, ptfe: 0.1, steel304: 0.1 } }),
  P("hb.transit_car",  "Spine transit car",                { mass: 2.2, pwr: -4, bom: { al6061: 0.5, cfrp: 0.2, cu: 0.15, ndfeb: 0.05, pe: 0.1 } }),
]);
/* ---- computing, control, comms ------------------------------------------ */
add([
  P("cd.core",         "Station computing core (TMR)",     { mass: 1.2, pwr: -25, heat: 25, bom: { si: 0.1, al6061: 0.4, cu: 0.3, pe: 0.2 } }),
  P("cd.network",      "Fibre / SpaceWire backbone",       { mass: 0.6, pwr: -3, bom: { fused_si: 0.3, cu: 0.3, pe: 0.4 } }),
  P("cd.console",      "Bridge console",                   { mass: 0.3, pwr: -1, bom: { si: 0.05, al6061: 0.5, fused_si: 0.15, pe: 0.3 } }),
  P("cd.traffic_ctl",  "Traffic control suite",            { mass: 1, pwr: -6, bom: { si: 0.08, al6061: 0.4, cu: 0.3, fused_si: 0.22 } }),
  P("cd.hga",          "High-gain dish",                   { mass: 1.4, pwr: -9, bom: { cfrp: 0.5, al6061: 0.3, cu: 0.2 } }),
  P("cd.phased",       "Phased-array panel",               { mass: 0.9, pwr: -12, bom: { si: 0.05, gaas: 0.02, al6061: 0.5, cu: 0.43 } }),
  P("cd.laser_term",   "Optical laser terminal",           { mass: 0.4, pwr: -4, bom: { fused_si: 0.3, al6061: 0.5, si: 0.05, cu: 0.15 } }),
  P("cd.beacon",       "Navigation beacon",                { mass: 0.2, pwr: -0.5, bom: { al6061: 0.6, cu: 0.3, fused_si: 0.1 } }),
  P("cd.relay_mast",   "Relay mast",                       { mass: 0.8, pwr: -2, bom: { cfrp: 0.6, al6061: 0.3, cu: 0.1 } }),
]);
/* ---- sensors ------------------------------------------------------------- */
add([
  P("sw.radar",        "Approach radar",                   { mass: 0.9, pwr: -10, bom: { al6061: 0.5, cu: 0.3, si: 0.05, gaas: 0.02, pe: 0.13 } }),
  P("sw.lidar",        "Docking lidar",                    { mass: 0.4, pwr: -3, bom: { fused_si: 0.3, al6061: 0.5, si: 0.05, cu: 0.15 } }),
  P("sw.debris_radar", "Debris tracking radar",            { mass: 0.5, pwr: -5, bom: { al6061: 0.5, cu: 0.35, si: 0.05, pe: 0.1 } }),
  P("sw.telescope",    "Deep-space telescope",             { mass: 2.5, pwr: -4, bom: { fused_si: 0.3, sapphire: 0.05, cfrp: 0.4, al6061: 0.25 } }),
  P("sw.spectro",      "Imaging spectrometer",             { mass: 0.6, pwr: -3, bom: { fused_si: 0.4, al6061: 0.4, si: 0.05, cu: 0.15 } }),
  P("sw.shm",          "Structural health sensor net",     { mass: 0.2, pwr: -1, bom: { si: 0.05, cu: 0.5, pe: 0.45 } }),
]);
/* ---- docking & hangar ---------------------------------------------------- */
add([
  P("dk.hangar_frame", "Hangar mouth frame (60 m)",        { mass: 90, bom: { ti64: 0.4, al_li: 0.35, steel304: 0.15, cfrp: 0.1 } }),
  P("dk.bay_door",     "Pressure bay door leaf",           { mass: 24, pwr: -6, bom: { al_li: 0.5, ti64: 0.3, ptfe: 0.1, cu: 0.1 } }),
  P("dk.lane_gantry",  "Lane gantry & marker strip",       { mass: 3, pwr: -2, bom: { al6061: 0.6, cfrp: 0.2, cu: 0.1, fused_si: 0.1 } }),
  P("dk.clamp",        "Berthing clamp set",               { mass: 2.8, pwr: -3, bom: { steel304: 0.6, ti64: 0.3, ptfe: 0.1 } }),
  P("dk.crew_collar",  "Androgynous crew collar",          { mass: 1.2, pwr: -1, bom: { al_li: 0.5, ti64: 0.3, ptfe: 0.2 } }),
  P("dk.cargo_collar", "Cargo transfer collar",            { mass: 1.8, pwr: -1, bom: { al_li: 0.5, ti64: 0.35, ptfe: 0.15 } }),
  P("dk.fuel_port",    "Refuel / resupply port",           { mass: 1, bom: { steel304: 0.5, ti64: 0.3, ptfe: 0.2 } }),
  P("dk.tug",          "Hangar tug",                       { mass: 4, pwr: -2, bom: { al6061: 0.5, ti64: 0.2, li: 0.1, cu: 0.1, xe: 0.1 } }),
  P("dk.crane",        "Bay overhead crane",               { mass: 6, pwr: -8, bom: { steel304: 0.6, ti64: 0.2, cu: 0.2 } }),
  P("dk.field_lamp",   "Bay flood & marker lamp set",      { mass: 0.3, pwr: -3, bom: { al6061: 0.5, fused_si: 0.2, cu: 0.3 } }),
]);
/* ---- manufacturing & industry -------------------------------------------- */
add([
  P("mf.printer",      "Multi-material printer bay",       { mass: 2.5, pwr: -14, heat: 8, bom: { steel304: 0.4, al6061: 0.3, si: 0.03, cu: 0.17, pe: 0.1 } }),
  P("mf.ebeam",        "E-beam / laser sintering cell",    { mass: 2, pwr: -28, heat: 20, bom: { steel304: 0.5, cu: 0.2, inconel: 0.2, fused_si: 0.1 } }),
  P("mf.furnace",      "Plasma arc furnace",               { mass: 6, pwr: -140, heat: 120, bom: { inconel: 0.4, alumina: 0.2, steel304: 0.25, cu: 0.15 } }),
  P("mf.refinery",     "Regolith refinery drum",           { mass: 8, pwr: -70, heat: 60, bom: { steel304: 0.5, inconel: 0.2, alumina: 0.2, cu: 0.1 } }),
  P("mf.crusher",      "Crusher & sorter",                 { mass: 3.5, pwr: -30, heat: 15, bom: { steel304: 0.7, w: 0.1, cu: 0.1, pe: 0.1 } }),
  P("mf.assembly_jig", "Hull assembly jig (60 m)",         { mass: 40, pwr: -10, bom: { ti64: 0.4, steel304: 0.4, cu: 0.1, al6061: 0.1 } }),
  P("mf.weld_arm",     "Robotic weld & rivet arm",         { mass: 1.6, pwr: -9, heat: 4, bom: { ti64: 0.4, steel304: 0.3, cu: 0.15, ndfeb: 0.05, pe: 0.1 } }),
  P("mf.gantry_crane", "Yard gantry crane",                { mass: 14, pwr: -15, bom: { steel304: 0.6, ti64: 0.2, cu: 0.2 } }),
  P("mf.test_stand",   "Qualification test stand",         { mass: 2.2, pwr: -8, bom: { steel304: 0.6, al6061: 0.2, cu: 0.2 } }),
  P("mf.spares",       "Spare-part library rack",          { mass: 1.5, bom: { al6061: 0.5, steel304: 0.3, pe: 0.2 } }),
  P("mf.chem_plant",   "Chemical process skid",            { mass: 3, pwr: -20, heat: 15, bom: { steel304: 0.5, ptfe: 0.15, inconel: 0.2, pt: 0.001, alumina: 0.15 } }),
]);
/* ---- science ------------------------------------------------------------- */
add([
  P("sc.lab_bench",    "Optical bench lab",                { mass: 2.5, pwr: -8, bom: { al6061: 0.4, fused_si: 0.2, si: 0.03, steel304: 0.2, pe: 0.17 } }),
  P("sc.biolab",       "Biocontainment lab",               { mass: 3, pwr: -10, bom: { steel304: 0.5, hepa: 0.1, fused_si: 0.15, pe: 0.25 } }),
  P("sc.materials_lab","Materials & vacuum lab",           { mass: 2.4, pwr: -12, heat: 6, bom: { steel304: 0.5, cu: 0.2, inconel: 0.15, fused_si: 0.15 } }),
  P("sc.sample_vault", "Sample vault",                     { mass: 1.4, pwr: -2, bom: { steel304: 0.5, aerogel: 0.1, al_li: 0.4 } }),
  P("sc.quantum",      "Quantum computing node",           { mass: 1.2, pwr: -20, heat: 4, bom: { rebco: 0.1, si: 0.1, cu: 0.3, al6061: 0.3, aerogel: 0.2 } }),
  P("sc.centrifuge",   "Variable-g research centrifuge",   { mass: 5, pwr: -6, bom: { al_li: 0.5, ti64: 0.2, cu: 0.15, steel304: 0.15 } }),
]);
/* ---- safety & defence ---------------------------------------------------- */
add([
  P("sf.pdc",          "Point-defence cannon",             { mass: 1.4, pwr: -8, bom: { steel304: 0.5, ti64: 0.3, cu: 0.1, w: 0.1 } }),
  P("sf.rail",         "Railgun turret",                   { mass: 7, pwr: -140, heat: 40, bom: { cu: 0.3, steel304: 0.3, ti64: 0.2, w: 0.1, rebco: 0.1 } }),
  P("sf.pd_laser",     "Point-defence laser",              { mass: 1.6, pwr: -50, heat: 30, bom: { fused_si: 0.2, al6061: 0.4, cu: 0.3, si: 0.1 } }),
  P("sf.tracker",      "Fire-control tracker",             { mass: 0.5, pwr: -5, bom: { al6061: 0.5, si: 0.05, cu: 0.3, fused_si: 0.15 } }),
  P("sf.magazine",     "Magazine & autoloader",            { mass: 5, pwr: -2, bom: { steel304: 0.6, w: 0.2, cu: 0.2 } }),
  P("sf.fire_supp",    "Fire detection & suppression net", { mass: 0.5, pwr: -1, bom: { steel304: 0.4, cu: 0.2, nh3: 0.1, pe: 0.3 } }),
  P("sf.isolation",    "Rapid isolation valve set",        { mass: 0.6, bom: { steel304: 0.6, ti64: 0.2, ptfe: 0.2 } }),
  P("sf.lifeboat",     "Lifeboat pod (20 seats)",          { mass: 8, pwr: -1, bom: { al_li: 0.5, kevlar: 0.15, lox: 0.05, li: 0.1, pe: 0.2 } }),
  P("sf.armour",       "Armour plate panel",               { mass: 3, bom: { b4c: 0.3, ti64: 0.3, kevlar: 0.2, steel304: 0.2 } }),
  P("sf.sloped_plate", "Sloped composite armour slab",     { mass: 6, bom: { hy_steel: 0.4, b4c: 0.25, kevlar: 0.15, al_li: 0.2 } }),
  P("sf.blast_door",   "Armoured blast door leaf",         { mass: 40, pwr: -8, bom: { hy_steel: 0.5, ti64: 0.25, al_li: 0.15, cu: 0.1 } }),
  P("sf.barbette",     "Turret barbette & ring mount",     { mass: 9, pwr: -6, bom: { steel304: 0.5, ti64: 0.3, cu: 0.1, ndfeb: 0.1 } }),
  P("sf.laser_cannon", "Heavy laser cannon (5 MW)",        { mass: 12, pwr: -420, heat: 260, bom: { fused_si: 0.15, sapphire: 0.03, cu: 0.3, al6061: 0.3, si: 0.07, inconel: 0.15 } }),
  P("sf.vls_cell",     "Vertical launch cell",             { mass: 1.8, pwr: -1, bom: { al_li: 0.5, steel304: 0.3, pe: 0.2 } }),
  P("sf.missile",      "Interceptor missile (in-house)",   { mass: 0.9, bom: { al_sc: 0.3, cfrp: 0.2, li: 0.1, si: 0.05, w: 0.15, lox: 0.1, pe: 0.1 } }),
  P("sf.torpedo",      "Ship-killer torpedo (in-house)",   { mass: 4, bom: { al_sc: 0.25, cfrp: 0.2, li: 0.15, si: 0.05, du: 0.15, lox: 0.15, pe: 0.05 } }),
  P("sf.spinal_rail",  "Spinal mass-driver rail (40 m)",   { mass: 90, pwr: -60, heat: 20, bom: { cu: 0.35, rebco: 0.15, maraging: 0.3, ti64: 0.1, w: 0.1 } }),
  P("sf.capacitor",    "Pulse capacitor bank",             { mass: 8, pwr: -30, heat: 30, bom: { al6061: 0.3, cu: 0.3, ptfe: 0.2, pe: 0.2 } }),
  P("sf.slug",         "Mass-driver slug (in-house)",      { mass: 0.6, bom: { du: 0.5, w: 0.3, steel304: 0.2 } }),
  P("sf.siege_optic",  "Siege laser primary optic (12 m)", { mass: 22, pwr: -20, bom: { fused_si: 0.4, sapphire: 0.1, cfrp: 0.3, al_sc: 0.2 } }),
  P("sf.siege_driver", "Siege laser drive stack (120 MW)", { mass: 60, pwr: -9000, heat: 5000, bom: { cu: 0.3, gaas: 0.05, inconel: 0.25, si: 0.1, al6061: 0.3 } }),
  P("sf.shield_gen",   "Shield field generator",           { mass: 30, pwr: -2200, heat: 900, bom: { rebco: 0.25, cu: 0.25, inconel: 0.2, steel304: 0.2, aerogel: 0.1 } }),
  P("sf.shield_emit",  "Shield emitter spine",             { mass: 5, pwr: -180, heat: 60, bom: { nb_c103: 0.2, cu: 0.3, ta: 0.05, al_sc: 0.3, fused_si: 0.15 } }),
  P("sf.fc_radar",     "Fire-control radar",               { mass: 1.2, pwr: -18, bom: { al6061: 0.5, cu: 0.3, si: 0.06, gaas: 0.04, pe: 0.1 } }),
  P("sf.drone",        "Interceptor drone (in-house)",     { mass: 2.4, bom: { al_sc: 0.3, cfrp: 0.22, li: 0.14, si: 0.05, cu: 0.09, w: 0.05, xe: 0.1, pe: 0.05 } }),
  P("sf.drone_cell",   "Drone launch cell & catapult",     { mass: 2.2, pwr: -12, bom: { steel304: 0.4, al_li: 0.3, cu: 0.2, ndfeb: 0.1 } }),
  P("sf.drone_ctl",    "Drone control & datalink suite",   { mass: 0.8, pwr: -10, bom: { si: 0.1, al6061: 0.4, cu: 0.35, fused_si: 0.15 } }),
]);
/* ---- in-house munitions & drone fabrication -------------------------------- */
add([
  P("mf.drone_line",   "Drone fabrication line",           { mass: 6, pwr: -60, heat: 30, bom: { steel304: 0.4, al6061: 0.3, si: 0.05, cu: 0.15, pe: 0.1 } }),
  P("mf.munitions",    "Munitions assembly cell",          { mass: 4, pwr: -25, heat: 10, bom: { steel304: 0.5, al6061: 0.3, cu: 0.1, pe: 0.1 } }),
  P("mf.armour_press", "Armour plate press & furnace",     { mass: 14, pwr: -180, heat: 150, bom: { steel304: 0.5, inconel: 0.2, alumina: 0.15, cu: 0.15 } }),
]);
/* ---- arrays ---------------------------------------------------------------- */
add([
  P("pw.solar_petal",  "Deployable solar petal (0.5 MW)",  { mass: 2.6, pwr: 500, bom: { gaas: 0.12, cfrp: 0.4, kapton: 0.28, cu: 0.2 } }),
  P("pw.solar_sail",   "Thin-film solar sail (3 MW)",      { mass: 7, pwr: 3000, bom: { gaas: 0.06, kapton: 0.6, cfrp: 0.2, cu: 0.14 } }),
  P("pw.concentrator", "Solar concentrator dish & PV",     { mass: 5, pwr: 1200, heat: 200, bom: { al_sc: 0.4, gaas: 0.1, fused_si: 0.2, cfrp: 0.3 } }),
  P("cd.big_dish",     "Deep-space dish (60 m)",           { mass: 26, pwr: -30, bom: { cfrp: 0.5, al6061: 0.3, cu: 0.15, ndfeb: 0.05 } }),
  P("cd.array_slab",   "Phased-array slab (200 m²)",       { mass: 9, pwr: -110, heat: 40, bom: { si: 0.06, gaas: 0.04, al6061: 0.5, cu: 0.4 } }),
  P("cd.horn",         "Horn feed & waveguide set",        { mass: 0.5, pwr: -1, bom: { cu: 0.6, al6061: 0.4 } }),
]);
/* ---- cargo & stores ------------------------------------------------------ */
add([
  P("cg.container",    "Standard container stack",         { mass: 3, bom: { al6061: 0.7, steel304: 0.2, pe: 0.1 } }),
  P("cg.bonded_hold",  "Bonded warehouse hold",            { mass: 12, pwr: -3, bom: { al_li: 0.6, steel304: 0.25, pe: 0.15 } }),
  P("cg.rack",         "Powered cargo rack",               { mass: 1.2, pwr: -1, bom: { al6061: 0.7, cu: 0.1, pe: 0.2 } }),
  P("cg.fuel_tank",    "Propellant depot tank (200 t)",    { mass: 12, bom: { lh2: 0.5, lox: 0.3, al_li: 0.15, aerogel: 0.05 } }),
  P("cg.market_hall",  "Market hall fit-out",              { mass: 3, pwr: -5, bom: { al6061: 0.5, fused_si: 0.2, pe: 0.3 } }),
  P("cg.exchange",     "Commodity exchange floor",         { mass: 1.5, pwr: -6, bom: { si: 0.05, al6061: 0.5, fused_si: 0.2, pe: 0.25 } }),
  P("cg.customs",      "Customs & bonding office",         { mass: 1, pwr: -2, bom: { al6061: 0.6, si: 0.02, pe: 0.38 } }),
]);

export const PART_COUNT = Object.keys(PARTS).length;
