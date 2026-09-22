/**
 * Shared skill taxonomy for the space-age career system.
 * Skills are 0–100 by default. Ranks gate on minimums; specializations
 * demand higher peaks. Characters can multi-class across complexes
 * because several skills appear in more than one track.
 */
export const SKILL_CAP = 100;

export const SKILLS = {
  // Extraction & field
  geology: {
    id: "geology",
    name: "Geology & Assay",
    domain: "field",
    description: "Reading strata, spectral signatures, claim viability, and deposit quality.",
  },
  heavyOps: {
    id: "heavyOps",
    name: "Heavy Machinery",
    domain: "field",
    description: "Drills, loaders, mag-cranes, exoframes, and industrial EVA rigs.",
  },
  hazardOps: {
    id: "hazardOps",
    name: "Hazard Operations",
    domain: "field",
    description: "Vacuum, radiation, toxic atmospheres, unstable rock, and live ordinance.",
  },
  salvage: {
    id: "salvage",
    name: "Salvage & Reclamation",
    domain: "field",
    description: "Cutting, identifying, and recovering wreckage without destroying value.",
  },

  // Medical
  firstAid: {
    id: "firstAid",
    name: "Emergency Medicine",
    domain: "medical",
    description: "Triage, trauma stabilization, and field resuscitation.",
  },
  surgery: {
    id: "surgery",
    name: "Surgery",
    domain: "medical",
    description: "Invasive procedures, implants, and reconstructive work under gravity or spin.",
  },
  xenomed: {
    id: "xenomed",
    name: "Xenomedicine",
    domain: "medical",
    description: "Non-human physiology, cross-species pathogens, and alien biochemistry.",
  },
  cryonics: {
    id: "cryonics",
    name: "Cryonics & Revival",
    domain: "medical",
    description: "Suspension, thaw protocols, and post-revival rehabilitation.",
  },
  genetics: {
    id: "genetics",
    name: "Genetics & Augmentation",
    domain: "medical",
    description: "Somatic edits, vat-grown tissue, and licensed biomods.",
  },
  psychiatry: {
    id: "psychiatry",
    name: "Crew Psychiatry",
    domain: "medical",
    description: "Long-haul isolation, cabin fever, and post-trauma support.",
  },

  // Industrial / yard
  hullcraft: {
    id: "hullcraft",
    name: "Hullcraft",
    domain: "industrial",
    description: "Plating, frames, pressure integrity, and drydock assembly.",
  },
  propulsion: {
    id: "propulsion",
    name: "Propulsion Systems",
    domain: "industrial",
    description: "Chemical, ion, fusion, and exotic drive installation and tune.",
  },
  precisionFab: {
    id: "precisionFab",
    name: "Precision Fabrication",
    domain: "industrial",
    description: "Tolerances, CNC, print-sinter, and component QC.",
  },
  electronics: {
    id: "electronics",
    name: "Electronics & Avionics",
    domain: "industrial",
    description: "Boards, buses, sensors, and shipboard control nets.",
  },
  materials: {
    id: "materials",
    name: "Materials Science",
    domain: "industrial",
    description: "Alloys, ceramics, composites, and radiation-hard matter.",
  },
  nanofab: {
    id: "nanofab",
    name: "Nanofabrication",
    domain: "industrial",
    description: "Assembler programming, feedstock purity, and runaway containment.",
  },

  // Logistics & command
  supplyChain: {
    id: "supplyChain",
    name: "Supply Chain",
    domain: "logistics",
    description: "Inventory, routing, manifests, and just-in-time colony feed.",
  },
  navigation: {
    id: "navigation",
    name: "Astrogation",
    domain: "logistics",
    description: "Plotting, traffic lanes, jump windows, and debris fields.",
  },
  piloting: {
    id: "piloting",
    name: "Piloting",
    domain: "logistics",
    description: "Small craft through capital handling in dock and deep space.",
  },
  commerce: {
    id: "commerce",
    name: "Commerce",
    domain: "logistics",
    description: "Contracts, tariffs, futures, and station market sense.",
  },

  // Infrastructure
  energySystems: {
    id: "energySystems",
    name: "Energy Systems",
    domain: "infra",
    description: "Reactors, grids, radiators, and load balancing.",
  },
  lifeSupport: {
    id: "lifeSupport",
    name: "Life Support",
    domain: "infra",
    description: "Air, water, thermal, and closed-loop ecology.",
  },
  construction: {
    id: "construction",
    name: "Habitat Construction",
    domain: "infra",
    description: "Spin habitats, regolith print, docks, and pressure architecture.",
  },
  agriculture: {
    id: "agriculture",
    name: "Bioproduction",
    domain: "infra",
    description: "Hydroponics, mycoculture, protein vats, and soil engineering.",
  },
  terraforming: {
    id: "terraforming",
    name: "Planetary Engineering",
    domain: "infra",
    description: "Atmosphere, hydrology, insolation, and multi-decade works.",
  },

  // Knowledge & security
  research: {
    id: "research",
    name: "Research Method",
    domain: "knowledge",
    description: "Experiment design, peer review, and lab discipline.",
  },
  dataOps: {
    id: "dataOps",
    name: "Data Operations",
    domain: "knowledge",
    description: "Networks, encryption, telemetry, and comms arrays.",
  },
  security: {
    id: "security",
    name: "Security Doctrine",
    domain: "security",
    description: "Force continuum, station law, boarding, and asset protection.",
  },
  command: {
    id: "command",
    name: "Command",
    domain: "security",
    description: "Crew leadership, crisis authority, and complex-scale planning.",
  },
  law: {
    id: "law",
    name: "Colonial Law",
    domain: "security",
    description: "Charters, claims, salvage rights, and corporate codes.",
  },
};

export const SKILL_LIST = Object.keys(SKILLS);

export function createEmptySkills() {
  return SKILL_LIST.reduce((acc, id) => {
    acc[id] = 0;
    return acc;
  }, {});
}
