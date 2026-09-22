/* LIVING GALAXY — the fleet registry.
 *
 * Every hull anyone flies in the sky is one of these. A ship def fixes the
 * silhouette grammar the forge is allowed to use, the working dimensions,
 * and the numbers the sim reads: dry mass, cargo, reactor, handling.
 *
 * Hulls are organized by industrial complex (see careers/complexes.js) and
 * rank letter — the rung of the ladder where the complex will sign the hull
 * over to you. Tier A is what a surveyor gets handed; tier G is the platform
 * a complex authority commands. The eight `general` hulls have no ladder and
 * are for open sale.
 *
 * Scale: 1 world unit = 10 m. `dims` are [length, beam, height] in units, so
 * a [2.4, 1.0, 0.6] hull is a 24 m boat. The forge normalizes to dims.
 *
 * stats:
 *   massT     dry mass, tonnes            cargo   m^3
 *   reactor   units/s (player hull is 130)
 *   thrust / turn   multipliers on the base flight constants
 *   turrets   fitted mounts               crew    berths
 */

export const SIZE_BANDS = [
  { id: "skiff",    label: "Skiff",     max: 2.0 },
  { id: "boat",     label: "Boat",      max: 4.0 },
  { id: "cutter",   label: "Cutter",    max: 7.0 },
  { id: "ship",     label: "Ship",      max: 12.0 },
  { id: "barge",    label: "Barge",     max: 20.0 },
  { id: "platform", label: "Platform",  max: 40.0 },
  { id: "colossus", label: "Colossus",  max: 999 },
];

export function sizeBand(def) {
  const L = def.dims[0];
  return SIZE_BANDS.find((b) => L <= b.max) ?? SIZE_BANDS[SIZE_BANDS.length - 1];
}

/* Tier scaling used to derive stats so 112 hulls stay consistent.
 * Each complex def below only supplies deltas where the line deviates. */
const TIER = {
  A: { dims: [1.6, 0.7, 0.45],  massT: 12,   cargo: 8,    reactor: 60,  thrust: 1.15, turn: 1.3,  turrets: 0, crew: 1 },
  B: { dims: [2.4, 1.0, 0.6],   massT: 34,   cargo: 30,   reactor: 100, thrust: 1.0,  turn: 1.1,  turrets: 1, crew: 2 },
  C: { dims: [3.6, 1.5, 0.9],   massT: 90,   cargo: 90,   reactor: 150, thrust: 0.9,  turn: 0.9,  turrets: 1, crew: 4 },
  D: { dims: [5.5, 2.2, 1.3],   massT: 260,  cargo: 260,  reactor: 230, thrust: 0.78, turn: 0.72, turrets: 2, crew: 8 },
  E: { dims: [8.5, 3.2, 2.0],   massT: 700,  cargo: 700,  reactor: 360, thrust: 0.62, turn: 0.55, turrets: 3, crew: 16 },
  F: { dims: [14, 5.2, 3.2],    massT: 2200, cargo: 2000, reactor: 600, thrust: 0.45, turn: 0.38, turrets: 4, crew: 40 },
  G: { dims: [24, 9, 5.5],      massT: 7500, cargo: 6500, reactor: 1100, thrust: 0.3, turn: 0.22, turrets: 6, crew: 120 },
};

function mk(complex, letter, name, role, grammar, blurb, over = {}) {
  const t = TIER[letter];
  return {
    id: `${complex}_${letter.toLowerCase()}`,
    complex, tier: letter, name, role, blurb,
    dims: over.dims ?? t.dims.slice(),
    stats: {
      massT: over.massT ?? t.massT,
      cargo: over.cargo ?? t.cargo,
      reactor: over.reactor ?? t.reactor,
      thrust: over.thrust ?? t.thrust,
      turn: over.turn ?? t.turn,
      turrets: over.turrets ?? t.turrets,
      crew: over.crew ?? t.crew,
    },
    grammar, // { body, nose, wings, engines:[min,max], weapons, modules:[...] }
  };
}

/* g() builds a grammar object tersely. */
function g(body, nose, wings, engines, weapons, modules) {
  return { body, nose, wings, engines, weapons, modules };
}

export const SHIP_DB = [];

/* ---- mining ------------------------------------------------------------ */
SHIP_DB.push(
  mk("mining", "A", "Assay Skiff", "Survey scout",
    g("sleek", "sensor", "stub", [1, 2], "none", ["dish", "mast", "drill"]),
    "A spectrometer with a seat bolted behind it and a sample cutter under the nose. Files the map everyone else cuts by — and takes the first cut itself."),
  mk("mining", "B", "Ore Sled", "Single-head miner",
    g("boxy", "cockpit", "none", [2, 2], "none", ["drill", "hopper"]),
    "One drill, one hopper, no spare anything. Every entry miner's first bad payment plan."),
  mk("mining", "C", "Journeyman Rig", "Two-person cutter",
    g("industrial", "drillhead", "none", [2, 3], "light", ["drill", "hopper", "crane", "floodlights"]),
    "Licensed for vacuum shafts. The drill is rated for rock; the hull, roughly, for mistakes."),
  mk("mining", "D", "Claim Warden", "Heavy extractor",
    g("industrial", "drillhead", "sponson", [3, 4], "light", ["drill", "drill", "hopper", "silo", "crane", "radiators"]),
    "Cuts rare ore and holds the claim it cuts. The turrets are for claim law, chapter two."),
  mk("mining", "E", "Master Cut", "Mining command ship",
    g("layered", "industrial", "sponson", [3, 4], "medium", ["drill", "silo", "crane", "gantry", "dish", "radiators"]),
    "A master miner's whole cut in one hull: rigs, charges, arbitration office."),
  mk("mining", "F", "Seam Reaper", "Strip-mining barge",
    g("barge", "drillhead", "none", [4, 5], "medium", ["drill", "drill", "scoop", "silo", "silo", "gantry", "radiators", "floodlights"]),
    "Doesn't mine an asteroid so much as delete it. Foremen fight for the manifest."),
  mk("mining", "G", "Extractor-General", "Mobile mining complex",
    g("colossus", "industrial", "none", [5, 7], "heavy", ["drill", "scoop", "silo", "silo", "gantry", "gantry", "crane", "ring", "dishfarm", "radiators"]),
    "The complex authority's flagship. Belt goes in the front, quarterly numbers come out the back."),
);

/* ---- healthcare -------------------------------------------------------- */
SHIP_DB.push(
  mk("healthcare", "A", "Aid Runner", "First-response skiff",
    g("sleek", "cabin", "stub", [2, 2], "none", ["medcross", "beacon"]),
    "Carries a stretcher, a kit, and an aid hand who hasn't slept. First on scene, always."),
  mk("healthcare", "B", "Mercy Boat", "Ambulance cutter",
    g("boxy", "cabin", "stub", [2, 3], "none", ["medcross", "beacon", "pods"]),
    "A ward with engines. The back seats fold flat and the oxygen never gets metered."),
  mk("healthcare", "C", "Clinic Tender", "Mobile practice",
    g("hab", "bridge", "none", [2, 3], "none", ["medcross", "pods", "dish", "ring"]),
    "A licensed practice that makes house calls three moons wide."),
  mk("healthcare", "D", "Surgical Ship", "Specialist theatre",
    g("hab", "bridge", "solar", [3, 3], "light", ["medcross", "ring", "pods", "dish", "radiators"]),
    "Spin section for the theatre, cold berths for the ones who can wait."),
  mk("healthcare", "E", "Hospital Ship", "Full trauma hospital",
    g("capital", "bridge", "solar", [3, 4], "light", ["medcross", "ring", "ring", "pods", "dishfarm", "radiators"]),
    "White hull, red cross, and by convention nobody shoots at it. Conventions vary."),
  mk("healthcare", "F", "Quarantine Ark", "Epidemic response",
    g("hab", "blunt", "solar", [4, 5], "light", ["medcross", "ring", "pods", "pods", "tanks", "dishfarm", "radiators"]),
    "Seals a whole outbreak inside its own hull and jumps it away from everyone else."),
  mk("healthcare", "G", "Chief of Medicine", "Fleet medical command",
    g("colossus", "bridge", "solar", [5, 6], "medium", ["medcross", "ring", "ring", "pods", "gantry", "dishfarm", "lab", "radiators"]),
    "A teaching hospital, a morgue, and a ministry, all under way at once."),
);

/* ---- shipyard ---------------------------------------------------------- */
SHIP_DB.push(
  mk("shipyard", "A", "Hull Walker", "Inspection pod",
    g("sleek", "sensor", "none", [1, 2], "none", ["mast", "clamps"]),
    "Crawls other people's hulls with a torch and a fault logger. Small enough to fit in a dock shadow."),
  mk("shipyard", "B", "Rivet Boat", "Plate-work tender",
    g("boxy", "cockpit", "none", [2, 2], "none", ["crane", "clamps", "racks"]),
    "Welds what the walker flags. Carries more plate than sense."),
  mk("shipyard", "C", "Fitter's Cutter", "Systems installer",
    g("industrial", "collar", "none", [2, 3], "none", ["crane", "racks", "gantry", "floodlights"]),
    "Journeyman fitters live out of it for a whole refit. The collar mates to anything."),
  mk("shipyard", "D", "Drydock Tug", "Heavy positioning tug",
    g("tug", "grapple", "sponson", [4, 5], "light", ["clamps", "clamps", "crane", "radiators"]),
    "All engine and grip. Moves hulls ten times its mass and complains the whole burn.",
    { thrust: 1.15, massT: 400 }),
  mk("shipyard", "E", "Frame Layer", "Keel construction ship",
    g("truss", "industrial", "none", [3, 4], "light", ["gantry", "gantry", "crane", "racks", "printer", "floodlights"]),
    "Lays keels in open vacuum. The truss is the drydock; the drydock goes to the work."),
  mk("shipyard", "F", "Slipway", "Mobile drydock",
    g("cradle", "blunt", "none", [4, 6], "medium", ["gantry", "gantry", "clamps", "crane", "racks", "printer", "dishfarm", "floodlights"]),
    "A berth that flies. Ships go in broken or unbuilt and come out neither."),
  mk("shipyard", "G", "Master Yard", "Capital construction platform",
    g("colossus", "blunt", "none", [6, 8], "medium", ["gantry", "gantry", "gantry", "cradle", "crane", "printer", "racks", "dishfarm", "ring", "radiators"]),
    "Builds everything else on this list. The yardmaster's word is a launch schedule."),
);

/* ---- manufacturing ----------------------------------------------------- */
SHIP_DB.push(
  mk("manufacturing", "A", "Parts Runner", "Component courier",
    g("sleek", "cockpit", "swept", [2, 2], "none", ["racks"]),
    "Hot-shots a crate of microelectronics to whoever's line is down."),
  mk("manufacturing", "B", "Bench Boat", "Field assembly van",
    g("boxy", "cabin", "none", [2, 2], "none", ["racks", "printer"]),
    "A clean bench, a printer, and a licensed tech. Assembles on-site, warranties optional."),
  mk("manufacturing", "C", "Line Tender", "Production support ship",
    g("industrial", "cabin", "none", [2, 3], "none", ["printer", "racks", "pods", "radiators"]),
    "Feeds a fabline faster than the fabline can choke."),
  mk("manufacturing", "D", "Fabricator", "Mobile production line",
    g("cargo", "blunt", "none", [3, 4], "light", ["printer", "printer", "racks", "silo", "radiators"]),
    "Raw alloy forward, finished components aft. The middle is a trade secret."),
  mk("manufacturing", "E", "Foundry Ship", "Alloy smelter",
    g("refinery", "industrial", "none", [3, 4], "light", ["printer", "silo", "tanks", "stacks", "radiators", "radiators"]),
    "Runs hot enough that the radiator array outweighs the crew section."),
  mk("manufacturing", "F", "Nanoline Barge", "Precision fabrication barge",
    g("barge", "blunt", "solar", [4, 5], "medium", ["printer", "printer", "lab", "racks", "silo", "dishfarm", "radiators"]),
    "Builds things too small to see with tolerances too fine to forgive."),
  mk("manufacturing", "G", "Prime Works", "Industrial flagship",
    g("colossus", "industrial", "none", [5, 7], "medium", ["printer", "printer", "silo", "silo", "stacks", "gantry", "lab", "dishfarm", "ring", "radiators"]),
    "An orbital factory district with a helm. Its output is measured in fleets."),
);

/* ---- logistics --------------------------------------------------------- */
SHIP_DB.push(
  mk("logistics", "A", "Manifest Skiff", "Courier",
    g("sleek", "cockpit", "swept", [2, 2], "none", ["beacon"]),
    "Documents, keys, and one sealed pouch nobody explains. Fastest thing on this page.",
    { thrust: 1.3 }),
  mk("logistics", "B", "Pallet Boat", "Light hauler",
    g("cargo", "cabin", "none", [2, 2], "none", ["pods"]),
    "Six pallets and a dream. The entry hauler's whole world."),
  mk("logistics", "C", "Wayline Hauler", "Route freighter",
    g("cargo", "cabin", "none", [2, 3], "light", ["pods", "pods", "crane"]),
    "Flies the same six ports until the route is a groove in space."),
  mk("logistics", "D", "Hazcargo Special", "Certified dangerous-goods hauler",
    g("tanks", "armored", "none", [3, 3], "light", ["tanks", "pods", "beacon", "radiators"]),
    "Placarded on every face. Other traffic gives it room, which is the point."),
  mk("logistics", "E", "Coldsleep Liner", "Passenger transport",
    g("hab", "bridge", "solar", [3, 4], "light", ["ring", "pods", "pods", "dish"]),
    "A thousand sleepers who bought tickets and a purser who counts them twice."),
  mk("logistics", "F", "Bulk Freighter", "Heavy freight barge",
    g("barge", "cabin", "none", [4, 5], "medium", ["pods", "pods", "pods", "silo", "crane", "gantry"]),
    "The spine of every colony manifest. Ugly from all angles, indispensable from most."),
  mk("logistics", "G", "Colony Train", "Just-in-time megahauler",
    g("colossus", "blunt", "none", [5, 7], "medium", ["pods", "pods", "pods", "pods", "silo", "gantry", "crane", "dishfarm", "ring"]),
    "When it arrives on schedule a colony lives. It has never not arrived on schedule."),
);

/* ---- energy ------------------------------------------------------------ */
SHIP_DB.push(
  mk("energy", "A", "Meter Skiff", "Grid survey scout",
    g("sleek", "sensor", "solar", [1, 2], "none", ["mast", "dish"]),
    "Reads other people's reactors from a polite distance and files the anomalies."),
  mk("energy", "B", "Cell Tender", "Battery logistics boat",
    g("boxy", "cabin", "solar", [2, 2], "none", ["racks", "tanks"]),
    "Hauls charged cells out and dead cells back. Sparks when it rains, and it never rains."),
  mk("energy", "C", "Line Rigger", "Transmission tech ship",
    g("truss", "cockpit", "solar", [2, 3], "none", ["mast", "crane", "solar", "dish"]),
    "Strings power relays across a system the way ancestors strung wire across valleys."),
  mk("energy", "D", "Solar Spinner", "Collector array deployer",
    g("spine", "blunt", "solar", [2, 3], "none", ["solar", "solar", "gantry", "radiators"]),
    "Unfolds mirror wings measured in hectares. Turns sunlight into somebody's rent."),
  mk("energy", "E", "Fusion Tender", "Reactor service ship",
    g("refinery", "armored", "none", [3, 4], "light", ["tanks", "spool", "lab", "radiators", "radiators"]),
    "Keeps other people's stars burning. The watch rotation is four hours because six was too many."),
  mk("energy", "F", "Fuel Barge", "Deuterium bulk tanker",
    g("tanks", "cabin", "none", [3, 5], "light", ["tanks", "tanks", "tanks", "spool", "beacon", "radiators"]),
    "A rolling bomb by any honest reading. The escort is included in the freight rate."),
  mk("energy", "G", "Grid Sovereign", "Mobile power complex",
    g("colossus", "industrial", "solar", [5, 7], "medium", ["solar", "solar", "tanks", "spool", "spool", "dishfarm", "ring", "radiators", "radiators"]),
    "Parks over a dark colony and turns the lights on. Sets the price of everything after."),
);

/* ---- construction ------------------------------------------------------ */
SHIP_DB.push(
  mk("construction", "A", "Site Skiff", "Survey and stakeout",
    g("sleek", "sensor", "stub", [1, 2], "none", ["mast", "beacon"]),
    "Plants the corner beacons and argues with the terrain about the plans."),
  mk("construction", "B", "Hod Boat", "Materials shuttle",
    g("boxy", "cabin", "none", [2, 2], "none", ["racks", "crane"]),
    "Carries regolith brick and printed spar to wherever the foreman points."),
  mk("construction", "C", "Crane Cutter", "Rigging ship",
    g("industrial", "cockpit", "none", [2, 3], "none", ["crane", "crane", "clamps", "floodlights"]),
    "Two cranes and an operator who has opinions about both."),
  mk("construction", "D", "Regolith Printer", "Structure printing ship",
    g("industrial", "industrial", "none", [3, 4], "none", ["printer", "silo", "scoop", "gantry", "radiators"]),
    "Eats gray dust, extrudes habitats. The nozzle is the most insured object in the complex."),
  mk("construction", "E", "Spin Wright", "Habitat ring builder",
    g("ring", "blunt", "none", [3, 4], "light", ["ring", "gantry", "crane", "printer", "racks"]),
    "Builds the wheels people live in, one balanced spoke at a time."),
  mk("construction", "F", "Dock Master", "Berth and arm installer",
    g("cradle", "collar", "none", [4, 5], "light", ["gantry", "gantry", "clamps", "crane", "printer", "floodlights", "dish"]),
    "Every dock arm you've ever clamped to, this hull or its sisters bolted on."),
  mk("construction", "G", "World Frame", "Megastructure platform",
    g("colossus", "industrial", "none", [5, 8], "medium", ["gantry", "gantry", "gantry", "printer", "printer", "silo", "crane", "cradle", "dishfarm", "ring"]),
    "The complex authority's answer to 'that's too big to build.' It has never once been right."),
);

/* ---- agriculture ------------------------------------------------------- */
SHIP_DB.push(
  mk("agriculture", "A", "Seed Skiff", "Sampling scout",
    g("sleek", "sensor", "stub", [1, 2], "none", ["domes", "mast"]),
    "Carries a chilled case of germplasm and a soil probe. Smells faintly of loam, always."),
  mk("agriculture", "B", "Sprayer", "Crop tender boat",
    g("boxy", "cabin", "solar", [2, 2], "none", ["tanks", "greenfins"]),
    "Mists the vat rows and hums to the cultures. The humming is not in the manual."),
  mk("agriculture", "C", "Hydro Tender", "Hydroponics service ship",
    g("dome", "cabin", "solar", [2, 3], "none", ["domes", "tanks", "greenfins", "radiators"]),
    "A greenhouse with a rudder. The journeyman lives on what the beds overproduce."),
  mk("agriculture", "D", "Mycovat Hauler", "Protein vat transport",
    g("tanks", "cabin", "none", [3, 3], "none", ["tanks", "tanks", "domes", "silo"]),
    "Ferries living vats between stations. Keeps them warm, fed and unmentioned at dinner."),
  mk("agriculture", "E", "Harvest Ship", "Orbital farm",
    g("dome", "bridge", "solar", [3, 4], "light", ["domes", "domes", "greenfins", "silo", "ring", "radiators"]),
    "Acres under glass. Feeds a small station outright or a large one resentfully."),
  mk("agriculture", "F", "Granary Barge", "Bulk food carrier",
    g("barge", "cabin", "none", [4, 5], "light", ["silo", "silo", "silo", "domes", "crane", "beacon"]),
    "A harvest season under one roof. Piracy against a granary carries the oldest penalty there is."),
  mk("agriculture", "G", "Eden Ark", "Agricultural complex flagship",
    g("colossus", "bridge", "solar", [5, 7], "medium", ["domes", "domes", "domes", "ring", "silo", "silo", "greenfins", "lab", "dishfarm"]),
    "A sealed biosphere with a seed vault at its heart. If everything else fails, this is the backup."),
);

/* ---- research ---------------------------------------------------------- */
SHIP_DB.push(
  mk("research", "A", "Data Skiff", "Instrument runner",
    g("sleek", "sensor", "solar", [1, 2], "none", ["dish", "mast"]),
    "Swaps drives on remote instruments and doesn't look at the readings. Officially."),
  mk("research", "B", "Sample Boat", "Field collection ship",
    g("boxy", "sensor", "solar", [2, 2], "none", ["lab", "racks", "dish"]),
    "Scoops, bags, labels, refrigerates. The lab smells of solvent and priority."),
  mk("research", "C", "Survey Ship", "Instrument platform",
    g("science", "sensor", "solar", [2, 3], "none", ["dish", "dish", "lab", "mast", "solar"]),
    "Points twelve instruments at one anomaly until the anomaly explains itself."),
  mk("research", "D", "Deep Probe", "Long-range explorer",
    g("spine", "sensor", "solar", [2, 3], "light", ["dish", "lab", "tanks", "solar", "beacon"]),
    "Provisioned for two years of silence. Crewed by people who prefer it."),
  mk("research", "E", "Laboratory Ship", "Mobile institute",
    g("science", "bridge", "solar", [3, 4], "light", ["lab", "lab", "ring", "dishfarm", "radiators"]),
    "Peer review with engines. Half the papers in the sky have its callsign in the footnotes."),
  mk("research", "F", "Array Tender", "Observatory builder",
    g("truss", "sensor", "solar", [3, 4], "light", ["dishfarm", "dishfarm", "gantry", "lab", "solar", "mast"]),
    "Strings telescope arrays across empty light-hours and keeps them pointed."),
  mk("research", "G", "Hypothesis", "Research complex flagship",
    g("colossus", "sensor", "solar", [4, 6], "medium", ["lab", "lab", "lab", "dishfarm", "ring", "ring", "solar", "radiators", "mast"]),
    "The complex authority's own instrument. What it studies becomes next decade's economy."),
);

/* ---- security ---------------------------------------------------------- */
SHIP_DB.push(
  mk("security", "A", "Watch Skiff", "Picket scout",
    g("sleek", "spike", "swept", [2, 2], "light", ["dish", "beacon"]),
    "Sits on the approach lane and sees everything. Armed just enough to be believed.",
    { thrust: 1.25 }),
  mk("security", "B", "Patrol Boat", "Beat patrol",
    g("sleek", "cockpit", "delta", [2, 3], "medium", ["beacon", "floodlights"]),
    "Flies the beat, answers the calls, writes the reports. The paint scheme does half the work."),
  mk("security", "C", "Interceptor", "Fast response fighter",
    g("sleek", "spike", "swept", [2, 3], "medium", ["beacon"]),
    "Catches anything that runs. What happens after it catches them is policy, not physics.",
    { thrust: 1.35, turn: 1.3 }),
  mk("security", "D", "Escort Corvette", "Convoy protection",
    g("war", "armored", "sponson", [3, 4], "heavy", ["dish", "beacon", "radiators"]),
    "Rides shotgun on the granaries and fuel barges. Bored ninety-nine trips in a hundred."),
  mk("security", "E", "Strike Frigate", "Line warship",
    g("war", "armored", "fin", [3, 5], "heavy", ["dish", "racks", "radiators"]),
    "The complex's argument of last resort, short of the one below it on this list."),
  mk("security", "F", "Garrison Cruiser", "Sector command warship",
    g("capital", "armored", "sponson", [4, 6], "battery", ["dishfarm", "racks", "ring", "radiators"]),
    "Parks in a troubled sector until the sector stops being troubled. Usually just by parking."),
  mk("security", "G", "Bastion", "Security complex flagship",
    g("colossus", "ram", "sponson", [6, 8], "battery", ["dishfarm", "racks", "racks", "ring", "gantry", "radiators"]),
    "Carries the complex authority and the means to remain one. Rarely moves. Never has to."),
);

/* ---- navigation -------------------------------------------------------- */
SHIP_DB.push(
  mk("navigation", "A", "Buoy Skiff", "Marker maintenance",
    g("sleek", "sensor", "stub", [1, 2], "none", ["beacon", "mast"]),
    "Replaces dead lane markers. Every safe approach in the sky is its housekeeping."),
  mk("navigation", "B", "Channel Boat", "Lane survey ship",
    g("boxy", "sensor", "none", [2, 2], "none", ["beacon", "dish", "mast"]),
    "Re-measures the channels after every belt shift and files corrections nobody thanks it for."),
  mk("navigation", "C", "Pilot Cutter", "Harbor pilot transfer",
    g("sleek", "cockpit", "stub", [2, 3], "none", ["collar", "beacon", "floodlights"]),
    "Delivers a licensed pilot to anything too big to dock itself, in any weather there is.",
    { thrust: 1.2, turn: 1.25 }),
  mk("navigation", "D", "Beacon Layer", "Route infrastructure ship",
    g("spine", "blunt", "none", [2, 3], "none", ["beacon", "beacon", "racks", "gantry", "dish"]),
    "Lays a lit lane across dark space, one anchored beacon at a time."),
  mk("navigation", "E", "Chartmaster", "Deep survey vessel",
    g("science", "sensor", "solar", [3, 4], "light", ["dish", "dishfarm", "lab", "mast", "beacon"]),
    "Its charts are the legal definition of where things are. Errors get argued in court."),
  mk("navigation", "F", "Traffic Warden", "System control platform",
    g("truss", "bridge", "solar", [3, 5], "light", ["dishfarm", "dishfarm", "mast", "mast", "ring", "beacon"]),
    "Holds every approach vector in a hundred-diameter sphere in its head at once."),
  mk("navigation", "G", "Meridian", "Navigation complex flagship",
    g("colossus", "sensor", "solar", [4, 6], "medium", ["dishfarm", "dishfarm", "mast", "ring", "ring", "lab", "beacon", "radiators"]),
    "The zero point. Every chart in the settled dark measures from where this hull says it is."),
);

/* ---- commerce ---------------------------------------------------------- */
SHIP_DB.push(
  mk("commerce", "A", "Ledger Skiff", "Market courier",
    g("sleek", "cockpit", "swept", [2, 2], "none", ["beacon"]),
    "Carries price feeds between stations faster than the stations would like.",
    { thrust: 1.25 }),
  mk("commerce", "B", "Stall Boat", "Peddler's ship",
    g("boxy", "cabin", "none", [2, 2], "none", ["pods", "racks"]),
    "A market stall that undocks before questions about provenance get organized."),
  mk("commerce", "C", "Broker's Cutter", "Traveling trade office",
    g("layered", "bridge", "stub", [2, 3], "none", ["pods", "dish", "beacon"]),
    "A licensed broker, a strongroom, and a conference cabin with very good coffee."),
  mk("commerce", "D", "Auction Ship", "Mobile exchange",
    g("hab", "bridge", "none", [3, 3], "light", ["pods", "ring", "dish", "beacon"]),
    "Docks, opens its floor, moves a season of goods in a day, undocks before the taxman."),
  mk("commerce", "E", "Factor's Liner", "Trade mission flagship",
    g("capital", "bridge", "solar", [3, 4], "light", ["pods", "pods", "ring", "dishfarm", "beacon"]),
    "Arrives with samples and lawyers. Leaves with exclusivity agreements."),
  mk("commerce", "F", "Exchange Barge", "Regional market platform",
    g("barge", "bridge", "solar", [4, 5], "medium", ["pods", "pods", "ring", "ring", "dishfarm", "crane", "beacon"]),
    "The floor itself: order books, vaults, arbitration chambers, and a brig for insider traders."),
  mk("commerce", "G", "Sovereign Ledger", "Commerce complex flagship",
    g("colossus", "bridge", "solar", [5, 7], "medium", ["pods", "pods", "ring", "ring", "dishfarm", "dishfarm", "lab", "beacon", "radiators"]),
    "Where the complex authority sets the prime rate. Its arrival moves markets it hasn't docked at."),
);

/* ---- communications ---------------------------------------------------- */
SHIP_DB.push(
  mk("communications", "A", "Relay Skiff", "Antenna service",
    g("sleek", "sensor", "solar", [1, 2], "none", ["mast", "dish"]),
    "Climbs dead relays with a toolkit and a torch. The sky's least thanked job."),
  mk("communications", "B", "Signal Boat", "Field comms ship",
    g("boxy", "sensor", "solar", [2, 2], "none", ["dish", "mast", "antenna"]),
    "Patches a station's voice back into the network before anyone official notices it was gone."),
  mk("communications", "C", "Repeater Tender", "Network maintenance cutter",
    g("truss", "cockpit", "solar", [2, 3], "none", ["dish", "antenna", "crane", "racks"]),
    "Keeps a hundred repeaters honest across a belt's worth of static."),
  mk("communications", "D", "Broadcast Ship", "Transmission platform",
    g("spine", "sensor", "solar", [2, 3], "light", ["dishfarm", "antenna", "antenna", "solar"]),
    "One hull, a million listeners. The evening news comes off this deck."),
  mk("communications", "E", "Uplink Cruiser", "Deep-space trunk carrier",
    g("science", "sensor", "solar", [3, 4], "light", ["dishfarm", "dishfarm", "antenna", "lab", "radiators"]),
    "Carries the trunk lines between systems. When it goes quiet, everywhere goes quiet."),
  mk("communications", "F", "Array Barge", "Antenna farm platform",
    g("truss", "blunt", "solar", [3, 5], "light", ["dishfarm", "dishfarm", "antenna", "antenna", "mast", "gantry", "solar"]),
    "A field of dishes with a keel. Hears a hand radio three planets over."),
  mk("communications", "G", "The Word", "Communications complex flagship",
    g("colossus", "sensor", "solar", [4, 6], "medium", ["dishfarm", "dishfarm", "antenna", "antenna", "mast", "ring", "lab", "radiators"]),
    "Every packet in the settled dark is, eventually, this hull's business. It never forgets a header."),
);

/* ---- terraforming ------------------------------------------------------ */
SHIP_DB.push(
  mk("terraforming", "A", "Climate Skiff", "Atmospheric sampler",
    g("sleek", "sensor", "solar", [1, 2], "none", ["tanks", "mast"]),
    "Dips into dead atmospheres and brings back bottled bad news."),
  mk("terraforming", "B", "Seeder Boat", "Aerosol dispersal ship",
    g("boxy", "cabin", "solar", [2, 2], "none", ["tanks", "greenfins", "domes"]),
    "Salts clouds with engineered spores. Some of them even take."),
  mk("terraforming", "C", "Ice Wrangler", "Volatile tug",
    g("tug", "grapple", "none", [3, 4], "none", ["clamps", "tanks", "beacon"]),
    "Drags comet fragments onto very precise collision courses. Legally, weather.",
    { thrust: 1.1 }),
  mk("terraforming", "D", "Gas Miner", "Atmosphere processor",
    g("refinery", "scoop", "none", [3, 4], "none", ["scoop", "tanks", "tanks", "stacks", "radiators"]),
    "Skims a gas giant's shoulder and cracks what it swallows into something breathable."),
  mk("terraforming", "E", "Mirror Tender", "Orbital reflector ship",
    g("spine", "blunt", "solar", [3, 4], "light", ["solar", "solar", "gantry", "dish", "radiators"]),
    "Aims continent-sized mirrors. Moves winter. Files the paperwork after."),
  mk("terraforming", "F", "Worldworks Barge", "Planetary engineering platform",
    g("barge", "industrial", "none", [4, 6], "light", ["scoop", "tanks", "tanks", "stacks", "printer", "gantry", "silo", "radiators"]),
    "Rebuilds a planet's water cycle from orbit. Timescale: careers. Plural."),
  mk("terraforming", "G", "Genesis Engine", "Terraforming complex flagship",
    g("colossus", "scoop", "solar", [5, 8], "medium", ["scoop", "tanks", "tanks", "stacks", "stacks", "ring", "lab", "dishfarm", "gantry", "radiators"]),
    "Arrives at a dead world with a schedule for its first rain. Has kept that schedule twice."),
);

/* ---- salvage ----------------------------------------------------------- */
SHIP_DB.push(
  mk("salvage", "A", "Picker Skiff", "Debris scout",
    g("sleek", "grapple", "stub", [1, 2], "none", ["magnet", "mast"]),
    "Tags drifting wreck worth more than the fuel to reach it. Usually right."),
  mk("salvage", "B", "Scrap Boat", "Light salvager",
    g("boxy", "grapple", "none", [2, 2], "none", ["magnet", "crane", "racks"]),
    "Cuts, grabs, and hauls. The hold smells of scorched insulation and margin."),
  mk("salvage", "C", "Breaker Cutter", "Wreck processing ship",
    g("industrial", "grapple", "none", [2, 3], "light", ["magnet", "crane", "clamps", "silo", "floodlights"]),
    "Peels a dead hull like fruit and sorts it into bins by alloy grade."),
  mk("salvage", "D", "Reclaimer", "Heavy salvage ship",
    g("industrial", "grapple", "sponson", [3, 4], "light", ["magnet", "magnet", "crane", "gantry", "silo", "floodlights"]),
    "Brings back the ships that don't come back. Claim law rides in the second seat."),
  mk("salvage", "E", "Graveyard Tender", "Fleet-wreck harvester",
    g("barge", "grapple", "none", [3, 5], "medium", ["magnet", "gantry", "gantry", "silo", "silo", "crane", "radiators"]),
    "Works old battlefields by beacon light. Logs the names it finds before the cutting starts."),
  mk("salvage", "F", "Hulk Render", "Capital breaker barge",
    g("cradle", "grapple", "none", [4, 6], "medium", ["gantry", "gantry", "magnet", "clamps", "silo", "silo", "printer", "floodlights"]),
    "Swallows capital wrecks whole into its cradle and returns them to the commodity index."),
  mk("salvage", "G", "Last Rights", "Salvage complex flagship",
    g("colossus", "grapple", "none", [5, 7], "heavy", ["gantry", "gantry", "magnet", "magnet", "cradle", "silo", "silo", "ring", "dishfarm", "floodlights"]),
    "Whatever dies in the dark belongs, eventually, to this hull. The name is a promise kept both ways."),
);

/* ---- education --------------------------------------------------------- */
SHIP_DB.push(
  mk("education", "A", "Primer Skiff", "Circuit teacher's ship",
    g("sleek", "cabin", "stub", [1, 2], "none", ["beacon"]),
    "One teacher, forty stations a year, and a hold full of slates. School comes to you."),
  mk("education", "B", "Schoolboat", "Mobile classroom",
    g("boxy", "cabin", "solar", [2, 2], "none", ["pods", "dish"]),
    "Two classrooms and a simulator bay. The field trips are the whole sky."),
  mk("education", "C", "Trades Tender", "Certification workshop ship",
    g("hab", "cabin", "none", [2, 3], "none", ["racks", "printer", "pods", "dish"]),
    "Where journeymen sit their tickets. Half the certs in the complex were signed aboard."),
  mk("education", "D", "Simulator Ship", "Training platform",
    g("hab", "bridge", "solar", [3, 3], "none", ["ring", "pods", "lab", "dish"]),
    "Full-motion bridge sims for every hull in this registry. Crashing here is encouraged."),
  mk("education", "E", "Campus Ship", "Traveling academy",
    g("capital", "bridge", "solar", [3, 4], "light", ["ring", "pods", "pods", "lab", "domes", "dishfarm"]),
    "A residential college under way: lecture halls, labs, dorms, and one very patient registrar."),
  mk("education", "F", "Archive Barge", "Library and records platform",
    g("hab", "blunt", "solar", [3, 5], "light", ["pods", "pods", "lab", "lab", "ring", "dishfarm", "radiators"]),
    "Everything anyone has learned, in triplicate, behind blast doors. Lending terms are generous."),
  mk("education", "G", "Alma Mater", "Education complex flagship",
    g("colossus", "bridge", "solar", [4, 6], "light", ["ring", "ring", "pods", "lab", "lab", "domes", "dishfarm", "radiators"]),
    "The university that owns the universities. Its graduation list is next year's org chart."),
);

/* ---- general market hulls (no ladder) ---------------------------------- */
SHIP_DB.push(
  mk("general", "A", "Fledgling", "Trainer skiff",
    g("sleek", "cockpit", "stub", [1, 1], "none", ["beacon"]),
    "One seat, one engine, one beacon so they can find you. Every pilot's first hull — nimble, cheap, and forgiving of the mistakes you are about to make.",
    { dims: [1.4, 0.6, 0.38], massT: 9, cargo: 12, reactor: 80, thrust: 1.2, turn: 1.45, turrets: 0, crew: 1 }),
  mk("general", "B", "Wren", "Personal runabout",
    g("sleek", "cockpit", "swept", [1, 2], "none", []),
    "The hull everyone learns on and half the sky never stops flying.", { thrust: 1.1 }),
  mk("general", "B", "Packmule", "Utility boat",
    g("boxy", "cabin", "stub", [2, 2], "none", ["pods", "crane"]),
    "Does a bit of everything badly and all of it cheaply."),
  mk("general", "C", "Kestrel", "Sport yacht",
    g("sleek", "cockpit", "fin", [2, 3], "light", ["beacon"]),
    "Fast, pretty, and insured for more than it cost.", { thrust: 1.3, turn: 1.2 }),
  mk("general", "C", "Vagrant", "Live-aboard wanderer",
    g("hab", "cabin", "solar", [2, 3], "light", ["pods", "domes", "dish"]),
    "A home that never has to pick a port. Registered everywhere, taxed nowhere."),
  mk("general", "D", "Caravel", "Independent trader",
    g("cargo", "bridge", "stub", [2, 3], "medium", ["pods", "pods", "crane", "dish"]),
    "The free trader's classic. Every hard-luck story in every port bar starts on one."),
  mk("general", "D", "Longhaul", "Deep-space tramp",
    g("tanks", "cabin", "none", [3, 3], "light", ["tanks", "pods", "dish", "radiators"]),
    "Provisions for anywhere, contracts from anyone. Asks the destination second."),
  mk("general", "E", "Companion", "Expedition mothership",
    g("layered", "bridge", "sponson", [3, 4], "medium", ["pods", "ring", "crane", "dishfarm", "racks"]),
    "Carries smaller dreams in its hold: skiffs, drones, and whoever flies them."),
  mk("general", "F", "Sovereign's Errand", "Private capital yacht",
    g("capital", "bridge", "fin", [4, 5], "heavy", ["ring", "pods", "dishfarm", "domes", "radiators"]),
    "Somebody's entire fortune with engines on it. The escort fleet is also the entourage."),
);

/* Fix duplicate ids for general hulls (two share a tier letter). */
{
  const seen = new Map();
  for (const d of SHIP_DB) {
    const n = seen.get(d.id) ?? 0;
    seen.set(d.id, n + 1);
    if (n > 0) d.id = `${d.id}${n + 1}`;
  }
}

/* ---- lookups ------------------------------------------------------------ */

const BY_ID = new Map(SHIP_DB.map((d) => [d.id, d]));

export function shipById(id) {
  return BY_ID.get(id) ?? null;
}

export function shipsForComplex(complexId) {
  return SHIP_DB.filter((d) => d.complex === complexId);
}

/** Hulls a member of `complexId` at rank `letter` may be issued (their line, up to rank). */
export function issuedShips(complexId, letter) {
  const order = "ABCDEFG";
  const cap = order.indexOf(letter);
  if (cap < 0) return [];
  return SHIP_DB.filter((d) => d.complex === complexId && order.indexOf(d.tier) <= cap);
}

export function complexesInDb() {
  return [...new Set(SHIP_DB.map((d) => d.complex))];
}

/* Every pilot starts in the trainer. The complex's own line is bought at the
 * yard at the issue rate as rank allows — see shipcost.js yardQuote. */
export const DEFAULT_SHIP_ID = "general_a";

/* Flight-side multipliers the sim reads off the active hull, so a rookie
 * skiff and a colossus fly differently: thrust and attitude straight from
 * the registry, reactor and hold on a softened curve (the player's base
 * hull is 130 u/s and 400 m³; a skiff should feel small, not unflyable). */
export function hullTuneFor(def) {
  const s = def?.stats;
  if (!s) return { thrust: 1, turn: 1, reactor: 1, cargo: 1, id: null };
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  return {
    id: def.id,
    thrust: clamp(s.thrust, 0.25, 1.6),
    turn: clamp(s.turn, 0.18, 1.8),
    /* floor at the stock 130 kW core: at 0.85 the starter hulls idled their own
     * default loadout (shields, turrets, gravity, sentry, cutter) at 101 of 110 kW
     * and every regen tick put the bus over — "overloaded everywhere" from launch */
    reactor: clamp((s.reactor / 130) ** 0.35, 1, 2.2),
    cargo: clamp((s.cargo / 30) ** 0.5, 0.5, 4),
  };
}
