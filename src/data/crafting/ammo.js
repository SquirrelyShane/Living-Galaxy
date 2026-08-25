// Living Galaxy — ammunition blueprints, imported from the crafting database.
// Each entry carries its own bill of materials in `materials`: material id -> quantity.

export const AMMUNITION = {
 "AMMO-001": {
  "id": "AMMO-001",
  "name": "Standard Kinetic Slugs",
  "compatible": [
   "Light Autocannon",
   "Medium Autocannon",
   "Flak Cannon"
  ],
  "damage_type": "Kinetic",
  "tier": 1,
  "unit_cost": 15,
  "stack_size": 200,
  "manuf_hours_per_stack": 4,
  "materials": {
   "REF-001": 40,
   "REF-004": 5
  },
  "notes": "Basic solid projectiles.",
  "category": "Ammunition"
 },
 "AMMO-002": {
  "id": "AMMO-002",
  "name": "Armor-Piercing Slugs",
  "compatible": [
   "Autocannon",
   "Railgun",
   "Coilgun"
  ],
  "damage_type": "Kinetic/AP",
  "tier": 2,
  "unit_cost": 45,
  "stack_size": 100,
  "manuf_hours_per_stack": 6,
  "materials": {
   "REF-002": 30,
   "REF-001": 20,
   "REF-006": 2
  },
  "notes": "Dense core for penetration.",
  "category": "Ammunition"
 },
 "AMMO-003": {
  "id": "AMMO-003",
  "name": "High-Explosive Shells",
  "compatible": [
   "Flak",
   "Autocannon"
  ],
  "damage_type": "Explosive",
  "tier": 2,
  "unit_cost": 60,
  "stack_size": 80,
  "manuf_hours_per_stack": 8,
  "materials": {
   "REF-001": 25,
   "REF-009": 15,
   "CMP-001": 8
  },
  "notes": "Proximity or impact fusing.",
  "category": "Ammunition"
 },
 "AMMO-004": {
  "id": "AMMO-004",
  "name": "Railgun Sabot Rounds",
  "compatible": [
   "Railgun",
   "Heavy Railgun"
  ],
  "damage_type": "Kinetic/AP",
  "tier": 3,
  "unit_cost": 180,
  "stack_size": 40,
  "manuf_hours_per_stack": 12,
  "materials": {
   "REF-002": 40,
   "REF-008": 15,
   "REF-006": 5
  },
  "notes": "Discarding sabot for maximum velocity.",
  "category": "Ammunition"
 },
 "AMMO-005": {
  "id": "AMMO-005",
  "name": "Tungsten Penetrator Rounds",
  "compatible": [
   "Railgun",
   "Coilgun",
   "Gauss"
  ],
  "damage_type": "Kinetic/AP",
  "tier": 3,
  "unit_cost": 220,
  "stack_size": 30,
  "manuf_hours_per_stack": 14,
  "materials": {
   "REF-005": 35,
   "REF-002": 15,
   "REF-006": 3
  },
  "notes": "Maximum density penetrators.",
  "category": "Ammunition"
 },
 "AMMO-006": {
  "id": "AMMO-006",
  "name": "Standard Homing Missiles",
  "compatible": [
   "Missile Rack",
   "Heavy Missile Rack"
  ],
  "damage_type": "Explosive",
  "tier": 2,
  "unit_cost": 850,
  "stack_size": 12,
  "manuf_hours_per_stack": 10,
  "materials": {
   "REF-002": 25,
   "CMP-002": 8,
   "REF-009": 20,
   "CMP-001": 10,
   "CMP-007": 2
  },
  "notes": "Reliable all-aspect seekers.",
  "category": "Ammunition"
 },
 "AMMO-007": {
  "id": "AMMO-007",
  "name": "Anti-Ship Torpedoes",
  "compatible": [
   "Torpedo Launcher",
   "Spinal Torpedo"
  ],
  "damage_type": "Explosive/High Yield",
  "tier": 3,
  "unit_cost": 4500,
  "stack_size": 4,
  "manuf_hours_per_stack": 24,
  "materials": {
   "REF-002": 80,
   "CMP-002": 20,
   "REF-008": 30,
   "CMP-004": 8,
   "CMP-003": 0.25
  },
  "notes": "Large warhead, slower.",
  "category": "Ammunition"
 },
 "AMMO-008": {
  "id": "AMMO-008",
  "name": "Swarm Micro-Missiles",
  "compatible": [
   "Swarm Micro-Missile Pod"
  ],
  "damage_type": "Explosive",
  "tier": 3,
  "unit_cost": 320,
  "stack_size": 48,
  "manuf_hours_per_stack": 14,
  "materials": {
   "REF-009": 40,
   "CMP-002": 12,
   "CMP-001": 15,
   "CMP-007": 4
  },
  "notes": "Overwhelm point defense.",
  "category": "Ammunition"
 },
 "AMMO-009": {
  "id": "AMMO-009",
  "name": "EMP Warhead Missiles",
  "compatible": [
   "Missile Rack",
   "Torpedo"
  ],
  "damage_type": "EMP",
  "tier": 3,
  "unit_cost": 1200,
  "stack_size": 8,
  "manuf_hours_per_stack": 16,
  "materials": {
   "REF-002": 20,
   "CMP-002": 15,
   "CMP-004": 12,
   "REF-006": 6,
   "REF-009": 15
  },
  "notes": "Disables electronics.",
  "category": "Ammunition"
 },
 "AMMO-010": {
  "id": "AMMO-010",
  "name": "Nuclear Torpedo Warhead",
  "compatible": [
   "Torpedo Launcher"
  ],
  "damage_type": "Nuclear",
  "tier": 4,
  "unit_cost": 25000,
  "stack_size": 2,
  "manuf_hours_per_stack": 48,
  "materials": {
   "REF-002": 60,
   "CMP-002": 25,
   "RAW-010": 5,
   "CMP-003": 1,
   "REF-008": 40
  },
  "notes": "Heavily restricted. Fission or fusion primary.",
  "category": "Ammunition"
 },
 "AMMO-011": {
  "id": "AMMO-011",
  "name": "Antimatter Torpedo",
  "compatible": [
   "Torpedo Launcher",
   "Spinal"
  ],
  "damage_type": "Antimatter",
  "tier": 5,
  "unit_cost": 85000,
  "stack_size": 1,
  "manuf_hours_per_stack": 72,
  "materials": {
   "REF-002": 40,
   "CMP-010": 1,
   "CMP-002": 20,
   "CMP-003": 1,
   "REF-008": 30
  },
  "notes": "Extremely high yield. Antimatter from accelerators.",
  "category": "Ammunition"
 },
 "AMMO-012": {
  "id": "AMMO-012",
  "name": "Flare & Chaff Bundles",
  "compatible": [
   "Flare Launcher",
   "EW Suite"
  ],
  "damage_type": "Countermeasure",
  "tier": 1,
  "unit_cost": 40,
  "stack_size": 50,
  "manuf_hours_per_stack": 3,
  "materials": {
   "REF-009": 20,
   "CMP-001": 8,
   "REF-004": 5,
   "CMP-007": 1
  },
  "notes": "Thermal and radar decoys.",
  "category": "Ammunition"
 },
 "AMMO-013": {
  "id": "AMMO-013",
  "name": "Sensor Probe Missiles",
  "compatible": [
   "Missile Rack"
  ],
  "damage_type": "Utility",
  "tier": 2,
  "unit_cost": 600,
  "stack_size": 6,
  "manuf_hours_per_stack": 8,
  "materials": {
   "REF-002": 15,
   "CMP-002": 12,
   "CMP-008": 3,
   "REF-009": 10,
   "CMP-014": 2
  },
  "notes": "Long-range recon, returns data.",
  "category": "Ammunition"
 },
 "AMMO-014": {
  "id": "AMMO-014",
  "name": "Incendiary / Thermite Rounds",
  "compatible": [
   "Autocannon",
   "Flak"
  ],
  "damage_type": "Thermal",
  "tier": 2,
  "unit_cost": 70,
  "stack_size": 60,
  "manuf_hours_per_stack": 7,
  "materials": {
   "REF-001": 20,
   "REF-009": 10,
   "CMP-001": 5,
   "REF-006": 1
  },
  "notes": "Continues burning after impact.",
  "category": "Ammunition"
 },
 "AMMO-015": {
  "id": "AMMO-015",
  "name": "Proximity Mine (Standard)",
  "compatible": [
   "Mine Deployment"
  ],
  "damage_type": "Explosive",
  "tier": 2,
  "unit_cost": 400,
  "stack_size": 10,
  "manuf_hours_per_stack": 10,
  "materials": {
   "REF-001": 30,
   "REF-009": 15,
   "CMP-001": 10,
   "CMP-002": 5
  },
  "notes": "Basic proximity fuse.",
  "category": "Ammunition"
 },
 "AMMO-016": {
  "id": "AMMO-016",
  "name": "Smart Mine (Networked)",
  "compatible": [
   "Mine Deployment"
  ],
  "damage_type": "Explosive",
  "tier": 3,
  "unit_cost": 1200,
  "stack_size": 6,
  "manuf_hours_per_stack": 16,
  "materials": {
   "REF-002": 25,
   "CMP-002": 15,
   "CMP-001": 10,
   "CMP-008": 2,
   "REF-009": 10
  },
  "notes": "Communicates with other mines and ships.",
  "category": "Ammunition"
 },
 "AMMO-017": {
  "id": "AMMO-017",
  "name": "Boarding Pod (Empty)",
  "compatible": [
   "Boarding Torpedo Launcher"
  ],
  "damage_type": "Boarding",
  "tier": 2,
  "unit_cost": 3500,
  "stack_size": 2,
  "manuf_hours_per_stack": 20,
  "materials": {
   "REF-002": 60,
   "REF-001": 40,
   "REF-009": 30,
   "CMP-015": 15,
   "CMP-001": 10
  },
  "notes": "Armored delivery vehicle for teams.",
  "category": "Ammunition"
 },
 "AMMO-018": {
  "id": "AMMO-018",
  "name": "Decoy Drone (Active)",
  "compatible": [
   "Decoy Drone Launcher"
  ],
  "damage_type": "Decoy",
  "tier": 2,
  "unit_cost": 1800,
  "stack_size": 4,
  "manuf_hours_per_stack": 12,
  "materials": {
   "REF-002": 20,
   "CMP-002": 12,
   "CMP-001": 10,
   "CMP-008": 2,
   "REF-009": 15
  },
  "notes": "Emulates ship signatures.",
  "category": "Ammunition"
 },
 "AMMO-019": {
  "id": "AMMO-019",
  "name": "Fragmentation Cluster Munition",
  "compatible": [
   "Cluster Bomb Bay"
  ],
  "damage_type": "Explosive/Frag",
  "tier": 2,
  "unit_cost": 950,
  "stack_size": 8,
  "manuf_hours_per_stack": 10,
  "materials": {
   "REF-001": 40,
   "REF-009": 20,
   "CMP-001": 12
  },
  "notes": "Area saturation.",
  "category": "Ammunition"
 },
 "AMMO-020": {
  "id": "AMMO-020",
  "name": "Ion Charge Warhead",
  "compatible": [
   "Missile",
   "Torpedo"
  ],
  "damage_type": "Ion",
  "tier": 3,
  "unit_cost": 1500,
  "stack_size": 6,
  "manuf_hours_per_stack": 14,
  "materials": {
   "REF-002": 20,
   "CMP-002": 15,
   "CMP-004": 15,
   "REF-006": 8,
   "REF-009": 10
  },
  "notes": "System disruption focus.",
  "category": "Ammunition"
 },
 "AMMO-021": {
  "id": "AMMO-021",
  "name": "Nanite Warhead Canister",
  "compatible": [
   "Nanite Dispenser",
   "Missile"
  ],
  "damage_type": "Nanite",
  "tier": 4,
  "unit_cost": 4500,
  "stack_size": 4,
  "manuf_hours_per_stack": 24,
  "materials": {
   "CMP-009": 8,
   "BIO-005": 10,
   "CMP-002": 10,
   "REF-009": 15
  },
  "notes": "Programmable disassembly or medical payload.",
  "category": "Ammunition"
 },
 "AMMO-022": {
  "id": "AMMO-022",
  "name": "High-Explosive Incendiary (HEI)",
  "compatible": [
   "Autocannon",
   "Flak"
  ],
  "damage_type": "Explosive/Thermal",
  "tier": 2,
  "unit_cost": 85,
  "stack_size": 50,
  "manuf_hours_per_stack": 8,
  "materials": {
   "REF-001": 20,
   "REF-009": 12,
   "CMP-001": 6,
   "RAW-018": 5
  },
  "notes": "Combined blast and fire.",
  "category": "Ammunition"
 },
 "AMMO-023": {
  "id": "AMMO-023",
  "name": "Guided Bomb (Smart)",
  "compatible": [
   "Cluster Bay",
   "Ordnance hardpoints"
  ],
  "damage_type": "Explosive",
  "tier": 3,
  "unit_cost": 2800,
  "stack_size": 4,
  "manuf_hours_per_stack": 16,
  "materials": {
   "REF-002": 30,
   "CMP-002": 12,
   "CMP-001": 8,
   "CMP-007": 3,
   "REF-009": 15
  },
  "notes": "Precision surface or ship strike.",
  "category": "Ammunition"
 },
 "AMMO-024": {
  "id": "AMMO-024",
  "name": "Coolant Cartridge (Disposable)",
  "compatible": [
   "High-energy weapons (optional)"
  ],
  "damage_type": "Utility",
  "tier": 1,
  "unit_cost": 25,
  "stack_size": 20,
  "manuf_hours_per_stack": 2,
  "materials": {
   "REF-011": 15,
   "REF-009": 5
  },
  "notes": "Emergency heat dump for overclocked weapons.",
  "category": "Ammunition"
 },
 "AMMO-025": {
  "id": "AMMO-025",
  "name": "Capacitor Overcharge Cell",
  "compatible": [
   "Energy weapons (optional boost)"
  ],
  "damage_type": "Utility",
  "tier": 2,
  "unit_cost": 180,
  "stack_size": 10,
  "manuf_hours_per_stack": 6,
  "materials": {
   "CMP-004": 4,
   "CMP-001": 3,
   "REF-009": 2
  },
  "notes": "Temporary damage boost at cost of heat and cell.",
  "category": "Ammunition"
 },
 "AMMO-026": {
  "id": "AMMO-026",
  "name": "Depleted Uranium Slugs",
  "compatible": [
   "Autocannon",
   "Railgun"
  ],
  "damage_type": "Kinetic/AP",
  "tier": 3,
  "unit_cost": 250,
  "stack_size": 40,
  "manuf_hours_per_stack": 14,
  "materials": {
   "RAW-010": 8,
   "REF-001": 20,
   "REF-002": 10
  },
  "notes": "Extremely dense. Radiation and legal issues.",
  "category": "Ammunition"
 },
 "AMMO-027": {
  "id": "AMMO-027",
  "name": "Guided Kinetic Munition",
  "compatible": [
   "Railgun",
   "Coilgun",
   "Gauss"
  ],
  "damage_type": "Kinetic/Guided",
  "tier": 3,
  "unit_cost": 400,
  "stack_size": 20,
  "manuf_hours_per_stack": 16,
  "materials": {
   "REF-002": 25,
   "CMP-002": 8,
   "CMP-001": 6,
   "REF-006": 3
  },
  "notes": "Course-correcting kinetic penetrators.",
  "category": "Ammunition"
 },
 "AMMO-028": {
  "id": "AMMO-028",
  "name": "Cruise Missile (Long Range)",
  "compatible": [
   "Cruise Missile Launcher"
  ],
  "damage_type": "Explosive",
  "tier": 3,
  "unit_cost": 3200,
  "stack_size": 4,
  "manuf_hours_per_stack": 20,
  "materials": {
   "REF-002": 40,
   "CMP-002": 15,
   "CMP-001": 10,
   "REF-009": 25,
   "CMP-008": 2,
   "CMP-004": 5
  },
  "notes": "Extended endurance and range.",
  "category": "Ammunition"
 },
 "AMMO-029": {
  "id": "AMMO-029",
  "name": "Anti-Fighter Missile",
  "compatible": [
   "Anti-Fighter Missile Pod"
  ],
  "damage_type": "Explosive",
  "tier": 2,
  "unit_cost": 280,
  "stack_size": 24,
  "manuf_hours_per_stack": 10,
  "materials": {
   "REF-002": 15,
   "CMP-002": 6,
   "CMP-001": 8,
   "REF-009": 15,
   "CMP-007": 2
  },
  "notes": "High agility, small warhead.",
  "category": "Ammunition"
 },
 "AMMO-030": {
  "id": "AMMO-030",
  "name": "Cluster Torpedo",
  "compatible": [
   "Torpedo Cluster Launcher"
  ],
  "damage_type": "Explosive",
  "tier": 3,
  "unit_cost": 3800,
  "stack_size": 3,
  "manuf_hours_per_stack": 18,
  "materials": {
   "REF-002": 50,
   "CMP-002": 12,
   "REF-008": 20,
   "CMP-001": 10,
   "CMP-004": 6
  },
  "notes": "Releases submunitions near target.",
  "category": "Ammunition"
 },
 "AMMO-031": {
  "id": "AMMO-031",
  "name": "Nuclear Mine",
  "compatible": [
   "Nuclear Mine Dispenser"
  ],
  "damage_type": "Nuclear",
  "tier": 4,
  "unit_cost": 18000,
  "stack_size": 2,
  "manuf_hours_per_stack": 36,
  "materials": {
   "REF-002": 30,
   "CMP-002": 15,
   "RAW-010": 6,
   "CMP-003": 0.5,
   "REF-008": 15
  },
  "notes": "Area denial. Heavily restricted.",
  "category": "Ammunition"
 },
 "AMMO-032": {
  "id": "AMMO-032",
  "name": "Shield-Breaker Capacitance Round",
  "compatible": [
   "Railgun",
   "Coilgun"
  ],
  "damage_type": "Kinetic/Energy",
  "tier": 3,
  "unit_cost": 350,
  "stack_size": 25,
  "manuf_hours_per_stack": 14,
  "materials": {
   "REF-002": 20,
   "CMP-004": 8,
   "REF-006": 4,
   "CMP-001": 5
  },
  "notes": "Designed to dump energy into shields on impact.",
  "category": "Ammunition"
 },
 "AMMO-033": {
  "id": "AMMO-033",
  "name": "Thermal Gel Round",
  "compatible": [
   "Autocannon",
   "Flak"
  ],
  "damage_type": "Thermal",
  "tier": 2,
  "unit_cost": 90,
  "stack_size": 50,
  "manuf_hours_per_stack": 8,
  "materials": {
   "REF-001": 15,
   "REF-009": 10,
   "REF-011": 8,
   "CMP-001": 4
  },
  "notes": "Sticky incendiary compound.",
  "category": "Ammunition"
 },
 "AMMO-034": {
  "id": "AMMO-034",
  "name": "Electronic Warfare Payload Missile",
  "compatible": [
   "Missile Rack"
  ],
  "damage_type": "EW",
  "tier": 3,
  "unit_cost": 1600,
  "stack_size": 6,
  "manuf_hours_per_stack": 14,
  "materials": {
   "REF-002": 15,
   "CMP-002": 12,
   "CMP-008": 3,
   "CMP-001": 8,
   "REF-009": 10
  },
  "notes": "Jams or spoofs on proximity.",
  "category": "Ammunition"
 },
 "AMMO-035": {
  "id": "AMMO-035",
  "name": "Repair Nanite Missile",
  "compatible": [
   "Missile Rack",
   "Nanite systems"
  ],
  "damage_type": "Utility/Repair",
  "tier": 3,
  "unit_cost": 2200,
  "stack_size": 4,
  "manuf_hours_per_stack": 16,
  "materials": {
   "CMP-009": 6,
   "CMP-012": 4,
   "CMP-002": 8,
   "REF-009": 10
  },
  "notes": "Delivers repair nanites to friendly targets.",
  "category": "Ammunition"
 },
 "AMMO-036": {
  "id": "AMMO-036",
  "name": "Smoke / Obscurant Canister",
  "compatible": [
   "Countermeasure launchers"
  ],
  "damage_type": "Utility",
  "tier": 1,
  "unit_cost": 30,
  "stack_size": 40,
  "manuf_hours_per_stack": 2,
  "materials": {
   "REF-009": 15,
   "RAW-018": 5,
   "CMP-001": 2
  },
  "notes": "Visual and some sensor obscuration.",
  "category": "Ammunition"
 },
 "AMMO-037": {
  "id": "AMMO-037",
  "name": "High-Explosive Dual-Purpose (HEDP)",
  "compatible": [
   "Autocannon",
   "Flak"
  ],
  "damage_type": "Explosive/AP",
  "tier": 2,
  "unit_cost": 95,
  "stack_size": 50,
  "manuf_hours_per_stack": 8,
  "materials": {
   "REF-001": 20,
   "REF-009": 12,
   "CMP-001": 6,
   "REF-005": 3
  },
  "notes": "Penetrates then detonates.",
  "category": "Ammunition"
 },
 "AMMO-038": {
  "id": "AMMO-038",
  "name": "Submunition Dispenser Round",
  "compatible": [
   "Flak",
   "Cluster systems"
  ],
  "damage_type": "Explosive/Frag",
  "tier": 2,
  "unit_cost": 110,
  "stack_size": 40,
  "manuf_hours_per_stack": 9,
  "materials": {
   "REF-001": 18,
   "REF-009": 15,
   "CMP-001": 8
  },
  "notes": "Releases many small projectiles.",
  "category": "Ammunition"
 },
 "AMMO-039": {
  "id": "AMMO-039",
  "name": "Quantum Entanglement Probe",
  "compatible": [
   "Special launchers"
  ],
  "damage_type": "Utility/Sensor",
  "tier": 4,
  "unit_cost": 8500,
  "stack_size": 2,
  "manuf_hours_per_stack": 30,
  "materials": {
   "CMP-003": 1,
   "CMP-002": 10,
   "CMP-014": 4,
   "CMP-008": 2,
   "REF-002": 10
  },
  "notes": "Experimental FTL-linked sensor return.",
  "category": "Ammunition"
 },
 "AMMO-040": {
  "id": "AMMO-040",
  "name": "Boarding Team Pod (Loaded)",
  "compatible": [
   "Boarding Torpedo"
  ],
  "damage_type": "Boarding",
  "tier": 2,
  "unit_cost": 12000,
  "stack_size": 1,
  "manuf_hours_per_stack": 24,
  "materials": {
   "REF-002": 50,
   "REF-001": 30,
   "REF-009": 25,
   "CMP-015": 15,
   "CMP-001": 10,
   "ITM-013": 4
  },
  "notes": "Includes basic armor and weapons for team (simplified).",
  "category": "Ammunition"
 }
};

export const AMMUNITION_KEYS = Object.keys(AMMUNITION);
