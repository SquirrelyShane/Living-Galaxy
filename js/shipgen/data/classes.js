/* Hull classes — silhouette grammar + doctrine (drive, arms mix, weapon weight).
 * CLASS_EQUIP carries the hull-level glazing doctrine (bridge style, crew viewport density);
 * the equipment manifest itself lives in data/loadouts.js. */
export const SHIP_CLASSES = {
  interceptor: {
    label: "Recon Interceptor", regime: "atmo", length: [14, 20], beam: [2.6, 3.6], height: [2.2, 3.0],
    nose: "spike", body: "needle", engines: [1, 2], wings: "fin",
    weapons: "light", arms: ["pdc", "ciws"], drive: "vector",
    cargo: 0, dishes: 0, towers: 0
  },
  fighter: {
    label: "Strike Fighter", regime: "atmo", length: [12, 18], beam: [7, 12], height: [1.8, 2.6],
    nose: "cockpit", body: "wedge", engines: [2, 3], wings: "none",
    weapons: "medium", arms: ["pdc", "missile", "auto", "kkv"], drive: "vector",
    cargo: 0, dishes: 0, towers: 0
  },
  shuttle: {
    label: "Drop Shuttle", regime: "reentry", length: [14, 20], beam: [6, 10], height: [3.2, 5],
    nose: "cabin", body: "boxy", engines: [2, 4], wings: "stub",
    weapons: "light", arms: ["pdc"], drive: "vector",
    cargo: 1, dishes: 0, towers: 0
  },
  corvette: {
    label: "Corvette", regime: "vleo", length: [22, 32], beam: [7, 11], height: [3.4, 5.2],
    nose: "bridge", body: "layered", engines: [2, 4], wings: "sponson",
    weapons: "medium", arms: ["railgun", "pdc", "missile", "auto"], drive: "fusion",
    cargo: 0, dishes: 1, towers: 1
  },
  frigate: {
    label: "Frigate", regime: "vleo", length: [28, 42], beam: [8, 13], height: [4.5, 7],
    nose: "bridge", body: "layered", engines: [3, 5], wings: "sponson",
    weapons: "heavy", arms: ["railgun", "missile", "pdc", "torpedo", "flak"], drive: "fusion",
    cargo: 1, dishes: 1, towers: 2
  },
  destroyer: {
    label: "Destroyer", regime: "vleo", length: [34, 50], beam: [9, 14], height: [5, 8],
    nose: "armored", body: "war", engines: [3, 6], wings: "fin",
    weapons: "heavy", arms: ["coil", "torpedo", "pdc", "plasma", "flak", "kkv"], drive: "plasma",
    cargo: 0, dishes: 1, towers: 2
  },
  cruiser: {
    label: "Cruiser", regime: "deep", length: [42, 62], beam: [10, 16], height: [6, 10],
    nose: "bridge", body: "capital", engines: [4, 6], wings: "fin",
    weapons: "heavy", arms: ["beam", "railgun", "missile", "pdc", "lance", "emp"], drive: "plasma",
    cargo: 1, dishes: 2, towers: 3
  },
  battleship: {
    label: "Battleship", regime: "deep", length: [50, 74], beam: [14, 22], height: [8, 13],
    nose: "armored", body: "capital", engines: [4, 8], wings: "sponson",
    weapons: "battery", arms: ["railgun", "plasma", "missile", "pdc", "torpedo", "particle", "nuke", "cluster"], drive: "antimatter",
    cargo: 0, dishes: 2, towers: 3
  },
  carrier: {
    label: "Carrier", regime: "deep", length: [55, 80], beam: [18, 28], height: [8, 12],
    nose: "blunt", body: "deck", engines: [4, 6], wings: "none",
    weapons: "light", arms: ["pdc", "ciws", "kkv"], drive: "ion",
    cargo: 2, dishes: 2, towers: 2
  },
  freighter: {
    label: "Bulk Freighter", regime: "deep", length: [30, 52], beam: [10, 18], height: [8, 14],
    nose: "cabin", body: "cargo", engines: [2, 4], wings: "none",
    weapons: "light", arms: ["pdc"], drive: "ion",
    cargo: 4, dishes: 1, towers: 1
  },
  tanker: {
    label: "Fuel Tanker", regime: "deep", length: [32, 54], beam: [9, 15], height: [7, 11],
    nose: "cabin", body: "tanks", engines: [2, 3], wings: "none",
    weapons: "none", arms: ["pdc"], drive: "ion",
    cargo: 0, dishes: 1, towers: 0
  },
  explorer: {
    label: "Deep Explorer", regime: "deep", length: [24, 38], beam: [10, 16], height: [5, 8],
    nose: "sensor", body: "science", engines: [2, 4], wings: "solar",
    weapons: "light", arms: ["beam", "pdc"], drive: "ion",
    cargo: 1, dishes: 3, towers: 1
  },
  miner: {
    label: "Mining Barge", regime: "deep", length: [22, 36], beam: [12, 20], height: [8, 13],
    nose: "industrial", body: "industrial", engines: [2, 4], wings: "none",
    weapons: "none", arms: ["beam"], drive: "pulse",
    cargo: 2, dishes: 1, towers: 1
  },
  yacht: {
    label: "Private Yacht", regime: "atmo", length: [16, 26], beam: [5, 8], height: [3.2, 4.6],
    nose: "cockpit", body: "curved", engines: [2, 3], wings: "fin",
    weapons: "none", arms: ["pdc"], drive: "antimatter",
    cargo: 0, dishes: 1, towers: 0
  },
  liner: {
    label: "Habitat Liner", regime: "deep", length: [40, 60], beam: [22, 32], height: [22, 32],
    nose: "bridge", body: "ring", engines: [3, 5], wings: "none",
    weapons: "none", arms: ["pdc"], drive: "ion",
    cargo: 0, dishes: 2, towers: 0
  },
  raider: {
    label: "Raider", regime: "vleo", length: [20, 30], beam: [8, 13], height: [4, 6],
    nose: "armored", body: "jagged", engines: [2, 4], wings: "fin",
    weapons: "medium", arms: ["auto", "pdc", "missile", "coil"], drive: "pulse",
    cargo: 1, dishes: 1, towers: 1
  },
  genship: {
    label: "Generation Ship", regime: "deep", length: [70, 96], beam: [24, 32], height: [24, 32],
    nose: "blunt", body: "drum", engines: [4, 6], wings: "none",
    weapons: "light", arms: ["pdc", "ciws"], drive: "fusion",
    cargo: 0, dishes: 3, towers: 0
  },
  orb: {
    label: "Survey Orb", regime: "deep", length: [18, 26], beam: [12, 18], height: [12, 18],
    nose: "sensor", body: "sphere", engines: [2, 3], wings: "none",
    weapons: "none", arms: ["pdc"], drive: "hall",
    cargo: 0, dishes: 2, towers: 0
  },
  stationcutter: {
    label: "Station Cutter", regime: "vleo", length: [18, 28], beam: [8, 14], height: [4, 7],
    nose: "blunt", body: "boxy", engines: [3, 5], wings: "stub",
    weapons: "medium", arms: ["pdc", "railgun"], drive: "pulse",
    cargo: 1, dishes: 1, towers: 1
  }
};

export const EQUIP_DEFAULT = {
  drills: 0, refinery: 0, dishes: 1, arrays: 1, radome: 0, masts: 2,
  docks: 2, bridge: "canopy", crewWin: 1.0, scanners: 1, gear: 0
};
export const CLASS_EQUIP = {
  interceptor:   { dishes: 0, arrays: 0, masts: 1, docks: 1, bridge: "cockpit", crewWin: 0.15, scanners: 0 },
  fighter:       { dishes: 0, arrays: 1, masts: 1, docks: 1, bridge: "cockpit", crewWin: 0.2,  scanners: 1 },
  shuttle:       { dishes: 1, arrays: 1, docks: 2, bridge: "canopy", crewWin: 1.2, scanners: 0, gear: 1 },
  corvette:      { dishes: 1, arrays: 2, radome: 1, docks: 2, bridge: "canopy", crewWin: 0.8, scanners: 2 },
  frigate:       { dishes: 1, arrays: 2, radome: 1, docks: 3, bridge: "tower",  crewWin: 1.0, scanners: 2 },
  destroyer:     { dishes: 1, arrays: 3, radome: 1, docks: 3, bridge: "tower",  crewWin: 0.7, scanners: 3 },
  cruiser:       { dishes: 2, arrays: 3, radome: 1, docks: 4, bridge: "tower",  crewWin: 1.2, scanners: 3 },
  battleship:    { dishes: 2, arrays: 4, radome: 1, docks: 4, bridge: "tower",  crewWin: 1.0, scanners: 4 },
  carrier:       { dishes: 2, arrays: 3, radome: 1, docks: 6, bridge: "tower",  crewWin: 1.6, scanners: 3 },
  freighter:     { dishes: 1, arrays: 1, docks: 6, bridge: "canopy", crewWin: 1.4, scanners: 1 },
  tanker:        { dishes: 1, arrays: 1, docks: 5, bridge: "canopy", crewWin: 1.0, scanners: 1 },
  explorer:      { dishes: 3, arrays: 3, radome: 1, masts: 3, docks: 3, bridge: "canopy", crewWin: 1.6, scanners: 3 },
  miner:         { drills: 3, refinery: 1, dishes: 1, arrays: 2, radome: 1, masts: 2, docks: 5, bridge: "tower", crewWin: 1.5, scanners: 2, gear: 1 },
  yacht:         { dishes: 1, arrays: 1, docks: 2, bridge: "canopy", crewWin: 1.8, scanners: 1 },
  stationcutter: { dishes: 1, arrays: 2, radome: 1, docks: 4, bridge: "canopy", crewWin: 1.1, scanners: 2, gear: 1 },
  liner:         { bridge: "tower", crewWin: 2.0 },
  raider:        { bridge: "cockpit", crewWin: 0.4 },
  genship:       { bridge: "tower", crewWin: 2.2 },
  orb:           { bridge: "canopy", crewWin: 1.4 }
};
