// Living Galaxy — the material tree.
//
// Imported from the crafting database and split by where a material *comes from*, because
// that is what decides who can supply it: raw materials come out of a rock or a crust,
// biological ones out of a hydroponics deck or a farm, refined ones out of a smelter, and
// components out of a fabricator. A planetary industry that can do one of those cannot
// necessarily do the next.
//
// Nothing here is exotic for its own sake — every high-end material traces back through
// refining or culturing to something you can mine, grow or extract. That is the property
// that makes the whole tree buildable rather than gated behind a drop table.

export const MATERIALS = {
 "RAW-001": {
  "id": "RAW-001",
  "name": "Iron Ore",
  "category": "Metallic Ore",
  "rarity": "Common",
  "unit": "kg",
  "base_value": 2,
  "sources": [
   "Asteroid mining",
   "Planetary crust",
   "Moon regolith"
  ],
  "notes": "Primary source of iron and steel.",
  "group": "raw_mined_extracted"
 },
 "RAW-002": {
  "id": "RAW-002",
  "name": "Titanium Ore",
  "category": "Metallic Ore",
  "rarity": "Uncommon",
  "unit": "kg",
  "base_value": 12,
  "sources": [
   "Asteroid belts",
   "High-titanium planetary deposits"
  ],
  "notes": "Refines into titanium metal and alloys.",
  "group": "raw_mined_extracted"
 },
 "RAW-003": {
  "id": "RAW-003",
  "name": "Copper Ore",
  "category": "Metallic Ore",
  "rarity": "Common",
  "unit": "kg",
  "base_value": 4,
  "sources": [
   "Planetary mining",
   "Asteroid mining"
  ],
  "notes": "Essential for conductors and electronics.",
  "group": "raw_mined_extracted"
 },
 "RAW-004": {
  "id": "RAW-004",
  "name": "Aluminum Ore (Bauxite)",
  "category": "Metallic Ore",
  "rarity": "Common",
  "unit": "kg",
  "base_value": 3,
  "sources": [
   "Planetary surface mining"
  ],
  "notes": "Lightweight structural metal.",
  "group": "raw_mined_extracted"
 },
 "RAW-005": {
  "id": "RAW-005",
  "name": "Silicon-rich Regolith",
  "category": "Silicate",
  "rarity": "Common",
  "unit": "kg",
  "base_value": 1,
  "sources": [
   "Moon/planet surface",
   "Asteroids"
  ],
  "notes": "Base for silicon wafers and glass.",
  "group": "raw_mined_extracted"
 },
 "RAW-006": {
  "id": "RAW-006",
  "name": "Carbonaceous Material",
  "category": "Carbon",
  "rarity": "Common",
  "unit": "kg",
  "base_value": 3,
  "sources": [
   "Carbonaceous asteroids",
   "Cometary material"
  ],
  "notes": "Source of carbon for composites, polymers, and nanotubes.",
  "group": "raw_mined_extracted"
 },
 "RAW-007": {
  "id": "RAW-007",
  "name": "Rare Earth Ore",
  "category": "Metallic Ore",
  "rarity": "Rare",
  "unit": "kg",
  "base_value": 85,
  "sources": [
   "Specialized asteroids",
   "Planetary rare-earth deposits"
  ],
  "notes": "Neodymium, dysprosium, etc. for high-strength magnets.",
  "group": "raw_mined_extracted"
 },
 "RAW-008": {
  "id": "RAW-008",
  "name": "Nickel-Iron Alloy Chunks",
  "category": "Metallic Ore",
  "rarity": "Common",
  "unit": "kg",
  "base_value": 5,
  "sources": [
   "Metallic asteroids"
  ],
  "notes": "Directly usable or further refined.",
  "group": "raw_mined_extracted"
 },
 "RAW-009": {
  "id": "RAW-009",
  "name": "Tungsten Ore",
  "category": "Metallic Ore",
  "rarity": "Uncommon",
  "unit": "kg",
  "base_value": 28,
  "sources": [
   "High-density asteroid cores",
   "Planetary mining"
  ],
  "notes": "High melting point, dense projectiles and armor.",
  "group": "raw_mined_extracted"
 },
 "RAW-010": {
  "id": "RAW-010",
  "name": "Uranium / Thorium Ore",
  "category": "Radioactive Ore",
  "rarity": "Rare",
  "unit": "kg",
  "base_value": 120,
  "sources": [
   "Specific planetary deposits",
   "Certain asteroids"
  ],
  "notes": "Fission fuel and radiation sources (regulated).",
  "group": "raw_mined_extracted"
 },
 "RAW-011": {
  "id": "RAW-011",
  "name": "Water Ice",
  "category": "Volatile",
  "rarity": "Common",
  "unit": "kg",
  "base_value": 1,
  "sources": [
   "Comets",
   "Icy moons",
   "Asteroid ice"
  ],
  "notes": "Source of water, oxygen, and hydrogen.",
  "group": "raw_mined_extracted"
 },
 "RAW-012": {
  "id": "RAW-012",
  "name": "Methane Ice / Clathrates",
  "category": "Volatile",
  "rarity": "Common",
  "unit": "kg",
  "base_value": 2,
  "sources": [
   "Outer system moons",
   "Comets"
  ],
  "notes": "Feedstock for polymers and fuel.",
  "group": "raw_mined_extracted"
 },
 "RAW-013": {
  "id": "RAW-013",
  "name": "Helium-3",
  "category": "Gas / Isotope",
  "rarity": "Uncommon",
  "unit": "gram",
  "base_value": 450,
  "sources": [
   "Lunar regolith",
   "Gas giant atmospheres (scooping)"
  ],
  "notes": "Premium fusion fuel.",
  "group": "raw_mined_extracted"
 },
 "RAW-014": {
  "id": "RAW-014",
  "name": "Deuterium",
  "category": "Gas / Isotope",
  "rarity": "Common",
  "unit": "liter",
  "base_value": 8,
  "sources": [
   "Water electrolysis + enrichment",
   "Gas giant scooping"
  ],
  "notes": "Standard fusion fuel component.",
  "group": "raw_mined_extracted"
 },
 "RAW-015": {
  "id": "RAW-015",
  "name": "Nitrogen Gas",
  "category": "Gas",
  "rarity": "Common",
  "unit": "liter",
  "base_value": 1,
  "sources": [
   "Planetary atmospheres",
   "Cometary ices"
  ],
  "notes": "Atmosphere mix, coolants, chemical feedstock.",
  "group": "raw_mined_extracted"
 },
 "RAW-016": {
  "id": "RAW-016",
  "name": "Oxygen (extracted)",
  "category": "Gas",
  "rarity": "Common",
  "unit": "liter",
  "base_value": 1,
  "sources": [
   "Water electrolysis",
   "Regolith processing",
   "Atmospheric processing"
  ],
  "notes": "Life support and oxidizer.",
  "group": "raw_mined_extracted"
 },
 "RAW-017": {
  "id": "RAW-017",
  "name": "Hydrogen",
  "category": "Gas",
  "rarity": "Common",
  "unit": "liter",
  "base_value": 1,
  "sources": [
   "Water electrolysis",
   "Gas giant scooping"
  ],
  "notes": "Fuel, coolant, chemical feedstock.",
  "group": "raw_mined_extracted"
 },
 "RAW-018": {
  "id": "RAW-018",
  "name": "Sulfur Compounds",
  "category": "Chemical",
  "rarity": "Common",
  "unit": "kg",
  "base_value": 3,
  "sources": [
   "Volcanic worlds",
   "Certain asteroids"
  ],
  "notes": "Chemical industry feedstock.",
  "group": "raw_mined_extracted"
 },
 "RAW-019": {
  "id": "RAW-019",
  "name": "Phosphorus Compounds",
  "category": "Chemical",
  "rarity": "Uncommon",
  "unit": "kg",
  "base_value": 15,
  "sources": [
   "Planetary mining",
   "Biological recycling"
  ],
  "notes": "Critical for agriculture and biotech.",
  "group": "raw_mined_extracted"
 },
 "RAW-020": {
  "id": "RAW-020",
  "name": "Gold / Precious Metal Ore",
  "category": "Metallic Ore",
  "rarity": "Uncommon",
  "unit": "kg",
  "base_value": 60,
  "sources": [
   "Asteroid mining",
   "Planetary veins"
  ],
  "notes": "Electronics contacts, luxury, catalysts.",
  "group": "raw_mined_extracted"
 },
 "RAW-021": {
  "id": "RAW-021",
  "name": "Cobalt Ore",
  "category": "Metallic Ore",
  "rarity": "Uncommon",
  "unit": "kg",
  "base_value": 22,
  "sources": [
   "Asteroid mining",
   "Planetary deposits"
  ],
  "notes": "Alloying agent and battery chemistry.",
  "group": "raw_mined_extracted"
 },
 "RAW-022": {
  "id": "RAW-022",
  "name": "Lithium-bearing Brine / Ore",
  "category": "Metallic Ore",
  "rarity": "Uncommon",
  "unit": "kg",
  "base_value": 35,
  "sources": [
   "Brine lakes",
   "Certain asteroids"
  ],
  "notes": "Critical for high-density energy storage.",
  "group": "raw_mined_extracted"
 },
 "RAW-023": {
  "id": "RAW-023",
  "name": "Platinum Group Metals Ore",
  "category": "Metallic Ore",
  "rarity": "Rare",
  "unit": "kg",
  "base_value": 180,
  "sources": [
   "Metallic asteroids",
   "Impact sites"
  ],
  "notes": "Catalysts, high-end electronics, electrodes.",
  "group": "raw_mined_extracted"
 },
 "RAW-024": {
  "id": "RAW-024",
  "name": "Ammonia Ice",
  "category": "Volatile",
  "rarity": "Common",
  "unit": "kg",
  "base_value": 2,
  "sources": [
   "Outer system moons",
   "Comets"
  ],
  "notes": "Coolant and chemical feedstock.",
  "group": "raw_mined_extracted"
 },
 "RAW-025": {
  "id": "RAW-025",
  "name": "Silica Sand / Quartz",
  "category": "Silicate",
  "rarity": "Common",
  "unit": "kg",
  "base_value": 1,
  "sources": [
   "Planetary surfaces",
   "Asteroids"
  ],
  "notes": "Glass, optics, silicon feedstock.",
  "group": "raw_mined_extracted"
 },
 "BIO-001": {
  "id": "BIO-001",
  "name": "Hydroponic Biomass",
  "category": "Organic",
  "rarity": "Common",
  "unit": "kg",
  "base_value": 4,
  "sources": [
   "Ship/station hydroponics",
   "Planetary farms"
  ],
  "notes": "Base organic feedstock for food and bio-polymers.",
  "group": "grown_cultured_biological"
 },
 "BIO-002": {
  "id": "BIO-002",
  "name": "Algal Culture",
  "category": "Organic",
  "rarity": "Common",
  "unit": "kg",
  "base_value": 3,
  "sources": [
   "Bioreactors",
   "Aquatic farms"
  ],
  "notes": "High-yield protein, oils, and oxygen production.",
  "group": "grown_cultured_biological"
 },
 "BIO-003": {
  "id": "BIO-003",
  "name": "Fungal Mycelium",
  "category": "Organic",
  "rarity": "Common",
  "unit": "kg",
  "base_value": 5,
  "sources": [
   "Controlled growth chambers"
  ],
  "notes": "Structural bio-composites, food, and filtration.",
  "group": "grown_cultured_biological"
 },
 "BIO-004": {
  "id": "BIO-004",
  "name": "Engineered Bacterial Culture",
  "category": "Organic",
  "rarity": "Uncommon",
  "unit": "liter",
  "base_value": 25,
  "sources": [
   "Biotech labs / bioreactors"
  ],
  "notes": "Produces specific proteins, enzymes, or precursors.",
  "group": "grown_cultured_biological"
 },
 "BIO-005": {
  "id": "BIO-005",
  "name": "Medical Nanite Precursor Culture",
  "category": "Biotech",
  "rarity": "Rare",
  "unit": "dose",
  "base_value": 180,
  "sources": [
   "Specialized bioreactors"
  ],
  "notes": "Living component later programmed into medical nanites.",
  "group": "grown_cultured_biological"
 },
 "BIO-006": {
  "id": "BIO-006",
  "name": "Bio-Polymer Precursor",
  "category": "Organic",
  "rarity": "Uncommon",
  "unit": "kg",
  "base_value": 18,
  "sources": [
   "Fermentation of algal/fungal feedstock"
  ],
  "notes": "Base for advanced plastics and flexible materials.",
  "group": "grown_cultured_biological"
 },
 "BIO-007": {
  "id": "BIO-007",
  "name": "Genetic Template Samples",
  "category": "Biotech",
  "rarity": "Rare",
  "unit": "unit",
  "base_value": 350,
  "sources": [
   "Biotech research",
   "Xeno-biology"
  ],
  "notes": "Used to customize cultures and medical treatments.",
  "group": "grown_cultured_biological"
 },
 "BIO-008": {
  "id": "BIO-008",
  "name": "Nutrient Solution Concentrate",
  "category": "Organic",
  "rarity": "Common",
  "unit": "liter",
  "base_value": 6,
  "sources": [
   "Processed from biomass + minerals"
  ],
  "notes": "Feeds hydroponics and bioreactors.",
  "group": "grown_cultured_biological"
 },
 "BIO-009": {
  "id": "BIO-009",
  "name": "Spider-Silk Analog Culture",
  "category": "Organic",
  "rarity": "Uncommon",
  "unit": "kg",
  "base_value": 45,
  "sources": [
   "Specialized bioreactors"
  ],
  "notes": "Ultra-strong bio-fiber for composites and armor liners.",
  "group": "grown_cultured_biological"
 },
 "BIO-010": {
  "id": "BIO-010",
  "name": "Photosynthetic Membrane Culture",
  "category": "Organic",
  "rarity": "Uncommon",
  "unit": "m2",
  "base_value": 30,
  "sources": [
   "Biotech labs"
  ],
  "notes": "Used in advanced life support and bio-solar systems.",
  "group": "grown_cultured_biological"
 },
 "BIO-011": {
  "id": "BIO-011",
  "name": "Enzyme Cocktail (Industrial)",
  "category": "Biotech",
  "rarity": "Uncommon",
  "unit": "liter",
  "base_value": 55,
  "sources": [
   "Fermentation"
  ],
  "notes": "Accelerates chemical processing and recycling.",
  "group": "grown_cultured_biological"
 },
 "REF-001": {
  "id": "REF-001",
  "name": "Structural Steel",
  "category": "Refined Metal",
  "rarity": "Common",
  "unit": "kg",
  "base_value": 8,
  "crafted_from": "Iron Ore + Carbonaceous Material + energy",
  "notes": "Primary structural material.",
  "group": "refined_materials"
 },
 "REF-002": {
  "id": "REF-002",
  "name": "Titanium Alloy",
  "category": "Refined Metal",
  "rarity": "Uncommon",
  "unit": "kg",
  "base_value": 45,
  "crafted_from": "Titanium Ore + Aluminum + trace elements",
  "notes": "High strength-to-weight.",
  "group": "refined_materials"
 },
 "REF-003": {
  "id": "REF-003",
  "name": "Aluminum Alloy",
  "category": "Refined Metal",
  "rarity": "Common",
  "unit": "kg",
  "base_value": 12,
  "crafted_from": "Bauxite + energy",
  "notes": "Lightweight structures and housings.",
  "group": "refined_materials"
 },
 "REF-004": {
  "id": "REF-004",
  "name": "Copper Conductors",
  "category": "Refined Metal",
  "rarity": "Common",
  "unit": "m",
  "base_value": 12,
  "crafted_from": "Copper Ore refined + drawn",
  "notes": "Power and signal transmission.",
  "group": "refined_materials"
 },
 "REF-005": {
  "id": "REF-005",
  "name": "Tungsten Alloy",
  "category": "Refined Metal",
  "rarity": "Uncommon",
  "unit": "kg",
  "base_value": 55,
  "crafted_from": "Tungsten Ore + binders",
  "notes": "Dense penetrators and high-heat components.",
  "group": "refined_materials"
 },
 "REF-006": {
  "id": "REF-006",
  "name": "Rare Earth Magnets",
  "category": "Refined Component",
  "rarity": "Rare",
  "unit": "kg",
  "base_value": 320,
  "crafted_from": "Rare Earth Ore refined + sintered",
  "notes": "Essential for motors, railguns, sensors.",
  "group": "refined_materials"
 },
 "REF-007": {
  "id": "REF-007",
  "name": "Silicon Wafers",
  "category": "Semiconductor",
  "rarity": "Common",
  "unit": "unit",
  "base_value": 15,
  "crafted_from": "Silicon-rich Regolith purified",
  "notes": "Base for all circuitry.",
  "group": "refined_materials"
 },
 "REF-008": {
  "id": "REF-008",
  "name": "Carbon Nanotube Composite",
  "category": "Advanced Composite",
  "rarity": "Uncommon",
  "unit": "kg",
  "base_value": 120,
  "crafted_from": "Carbonaceous Material processed in high-energy reactors",
  "notes": "Ultra-strong structural and armor material.",
  "group": "refined_materials"
 },
 "REF-009": {
  "id": "REF-009",
  "name": "Polymer Housing / Plastics",
  "category": "Polymer",
  "rarity": "Common",
  "unit": "kg",
  "base_value": 15,
  "crafted_from": "Methane / Bio-Polymer Precursor + processing",
  "notes": "Casings, seals, non-structural parts.",
  "group": "refined_materials"
 },
 "REF-010": {
  "id": "REF-010",
  "name": "Optical Glass & Crystals",
  "category": "Optics",
  "rarity": "Uncommon",
  "unit": "unit",
  "base_value": 40,
  "crafted_from": "Silicon + controlled crystallization + dopants",
  "notes": "Lenses, focusing arrays, sensor windows.",
  "group": "refined_materials"
 },
 "REF-011": {
  "id": "REF-011",
  "name": "Coolant Fluid",
  "category": "Chemical",
  "rarity": "Common",
  "unit": "liter",
  "base_value": 6,
  "crafted_from": "Water + chemical additives (nitrogen, organics)",
  "notes": "Heat management for reactors and weapons.",
  "group": "refined_materials"
 },
 "REF-012": {
  "id": "REF-012",
  "name": "Fusion Fuel Pellets (D-T / He-3)",
  "category": "Fuel",
  "rarity": "Common",
  "unit": "unit",
  "base_value": 18,
  "crafted_from": "Deuterium + Tritium or Helium-3",
  "notes": "Reactor fuel.",
  "group": "refined_materials"
 },
 "REF-013": {
  "id": "REF-013",
  "name": "Ablative Armor Composite",
  "category": "Armor Material",
  "rarity": "Uncommon",
  "unit": "kg",
  "base_value": 75,
  "crafted_from": "Carbon Nanotube + ceramics + polymers",
  "notes": "Sacrificial heat/kinetic layer.",
  "group": "refined_materials"
 },
 "REF-014": {
  "id": "REF-014",
  "name": "High-Purity Gold / Contact Metal",
  "category": "Refined Metal",
  "rarity": "Uncommon",
  "unit": "g",
  "base_value": 8,
  "crafted_from": "Gold Ore refined",
  "notes": "Corrosion-resistant electrical contacts.",
  "group": "refined_materials"
 },
 "REF-015": {
  "id": "REF-015",
  "name": "Ceramic Composites",
  "category": "Ceramic",
  "rarity": "Uncommon",
  "unit": "kg",
  "base_value": 35,
  "crafted_from": "Silicon + aluminum oxides + processing",
  "notes": "Heat shields, insulators, armor.",
  "group": "refined_materials"
 },
 "REF-016": {
  "id": "REF-016",
  "name": "Cobalt Alloy / Superalloy",
  "category": "Refined Metal",
  "rarity": "Uncommon",
  "unit": "kg",
  "base_value": 65,
  "crafted_from": "Cobalt Ore + Nickel + processing",
  "notes": "High-temperature structural and turbine material.",
  "group": "refined_materials"
 },
 "REF-017": {
  "id": "REF-017",
  "name": "Lithium-Ion / Advanced Battery Medium",
  "category": "Energy Storage",
  "rarity": "Uncommon",
  "unit": "kg",
  "base_value": 90,
  "crafted_from": "Lithium + cobalt/graphite + electrolytes",
  "notes": "High-density portable energy storage chemistry.",
  "group": "refined_materials"
 },
 "REF-018": {
  "id": "REF-018",
  "name": "Platinum Catalyst Mesh",
  "category": "Refined Component",
  "rarity": "Rare",
  "unit": "unit",
  "base_value": 420,
  "crafted_from": "Platinum Group Metals refined",
  "notes": "Catalysts for fuel cells and chemical reactors.",
  "group": "refined_materials"
 },
 "REF-019": {
  "id": "REF-019",
  "name": "Bio-Fiber Composite",
  "category": "Composite",
  "rarity": "Uncommon",
  "unit": "kg",
  "base_value": 55,
  "crafted_from": "Spider-Silk Analog + polymers",
  "notes": "Lightweight flexible high-tensile material.",
  "group": "refined_materials"
 },
 "REF-020": {
  "id": "REF-020",
  "name": "Aerogel Insulation",
  "category": "Insulator",
  "rarity": "Uncommon",
  "unit": "kg",
  "base_value": 70,
  "crafted_from": "Silica + specialized processing",
  "notes": "Extreme thermal insulation, very low density.",
  "group": "refined_materials"
 },
 "CMP-001": {
  "id": "CMP-001",
  "name": "Basic Circuitry",
  "category": "Electronics",
  "rarity": "Common",
  "unit": "unit",
  "base_value": 25,
  "crafted_from": "Silicon Wafers + Copper Conductors + Polymer",
  "notes": "Standard PCBs and controllers.",
  "group": "intermediate_components"
 },
 "CMP-002": {
  "id": "CMP-002",
  "name": "Advanced Electronics Package",
  "category": "Electronics",
  "rarity": "Uncommon",
  "unit": "unit",
  "base_value": 180,
  "crafted_from": "High-density Silicon + Rare Earth + Gold contacts + advanced lithography",
  "notes": "Radiation-hardened processors and control systems.",
  "group": "intermediate_components"
 },
 "CMP-003": {
  "id": "CMP-003",
  "name": "Quantum Processor Core",
  "category": "Advanced Electronics",
  "rarity": "Rare",
  "unit": "unit",
  "base_value": 2500,
  "crafted_from": "Ultra-pure Silicon + specialized doping + cryogenic assembly + Exotic Matter traces",
  "notes": "High-end computation, FTL calculations, AI.",
  "group": "intermediate_components"
 },
 "CMP-004": {
  "id": "CMP-004",
  "name": "High-Energy Capacitors",
  "category": "Energy Storage",
  "rarity": "Uncommon",
  "unit": "unit",
  "base_value": 140,
  "crafted_from": "Specialized ceramics + rare earth + polymers + electrolytes",
  "notes": "Rapid discharge for weapons and emergency power.",
  "group": "intermediate_components"
 },
 "CMP-005": {
  "id": "CMP-005",
  "name": "Plasma Conduits",
  "category": "Energy System",
  "rarity": "Uncommon",
  "unit": "m",
  "base_value": 210,
  "crafted_from": "Titanium Alloy + magnetic confinement materials + ceramics",
  "notes": "Channels for high-energy plasma.",
  "group": "intermediate_components"
 },
 "CMP-006": {
  "id": "CMP-006",
  "name": "Shield Field Emitters",
  "category": "Energy System",
  "rarity": "Rare",
  "unit": "unit",
  "base_value": 850,
  "crafted_from": "Advanced Electronics + specialized crystals + rare earth + high-energy capacitors",
  "notes": "Core of energy shield systems.",
  "group": "intermediate_components"
 },
 "CMP-007": {
  "id": "CMP-007",
  "name": "Optical Focusing Array",
  "category": "Optics",
  "rarity": "Uncommon",
  "unit": "unit",
  "base_value": 95,
  "crafted_from": "Optical Glass/Crystals + precision mounts + coatings",
  "notes": "Lasers, sensors, beam weapons.",
  "group": "intermediate_components"
 },
 "CMP-008": {
  "id": "CMP-008",
  "name": "Sensor Suite Components",
  "category": "Electronics",
  "rarity": "Uncommon",
  "unit": "set",
  "base_value": 260,
  "crafted_from": "Advanced Electronics + Optical Arrays + specialized detectors",
  "notes": "Multi-spectral and gravimetric sensing.",
  "group": "intermediate_components"
 },
 "CMP-009": {
  "id": "CMP-009",
  "name": "Nano-Assembler Units",
  "category": "Advanced Component",
  "rarity": "Rare",
  "unit": "unit",
  "base_value": 1800,
  "crafted_from": "Advanced Electronics + specialized bio-cultures + precision mechanics",
  "notes": "Molecular-scale manufacturing and repair.",
  "group": "intermediate_components"
 },
 "CMP-010": {
  "id": "CMP-010",
  "name": "Antimatter Containment Cell",
  "category": "Exotic Containment",
  "rarity": "Epic",
  "unit": "unit",
  "base_value": 12000,
  "crafted_from": "Advanced magnetic materials + cryogenics + Quantum cores + ultra-pure metals",
  "notes": "Produced in specialized facilities; antimatter itself via particle accelerators.",
  "group": "intermediate_components"
 },
 "CMP-011": {
  "id": "CMP-011",
  "name": "Gravimetric Crystal Lattice",
  "category": "Exotic",
  "rarity": "Epic",
  "unit": "unit",
  "base_value": 8500,
  "crafted_from": "Specially doped crystals grown under controlled gravity + Exotic Matter infusion",
  "notes": "Interact with spacetime curvature.",
  "group": "intermediate_components"
 },
 "CMP-012": {
  "id": "CMP-012",
  "name": "Medical Nanites",
  "category": "Biotech",
  "rarity": "Rare",
  "unit": "dose",
  "base_value": 950,
  "crafted_from": "Medical Nanite Precursor Culture + programming + containment",
  "notes": "Programmable medical micro-robots.",
  "group": "intermediate_components"
 },
 "CMP-013": {
  "id": "CMP-013",
  "name": "Monofilament Cable",
  "category": "Advanced Material",
  "rarity": "Rare",
  "unit": "m",
  "base_value": 400,
  "crafted_from": "Carbon Nanotube processing into continuous filament",
  "notes": "Extremely high tensile strength.",
  "group": "intermediate_components"
 },
 "CMP-014": {
  "id": "CMP-014",
  "name": "Data Crystal / Storage Matrix",
  "category": "Electronics",
  "rarity": "Uncommon",
  "unit": "unit",
  "base_value": 65,
  "crafted_from": "Optical crystals + doping + encoding layers",
  "notes": "High-density data storage.",
  "group": "intermediate_components"
 },
 "CMP-015": {
  "id": "CMP-015",
  "name": "Polymer Sealant & Gaskets",
  "category": "Consumable",
  "rarity": "Common",
  "unit": "kg",
  "base_value": 4,
  "crafted_from": "Bio-Polymer or synthetic polymer + additives",
  "notes": "Pressure and environmental seals.",
  "group": "intermediate_components"
 },
 "CMP-016": {
  "id": "CMP-016",
  "name": "Exotic Matter Stabilized Sample",
  "category": "Exotic",
  "rarity": "Legendary",
  "unit": "gram",
  "base_value": 45000,
  "crafted_from": "Particle accelerator production or anomaly harvesting + stabilization fields",
  "notes": "Extremely energy-intensive to produce; still ultimately industrial.",
  "group": "intermediate_components"
 },
 "CMP-017": {
  "id": "CMP-017",
  "name": "Fuel Cell Stack",
  "category": "Energy System",
  "rarity": "Uncommon",
  "unit": "unit",
  "base_value": 380,
  "crafted_from": "Platinum Catalyst + polymers + membranes",
  "notes": "Efficient chemical-to-electric conversion.",
  "group": "intermediate_components"
 },
 "CMP-018": {
  "id": "CMP-018",
  "name": "High-Density Battery Pack",
  "category": "Energy Storage",
  "rarity": "Uncommon",
  "unit": "unit",
  "base_value": 220,
  "crafted_from": "Lithium chemistry + Advanced Electronics",
  "notes": "Portable and vehicle-scale energy storage.",
  "group": "intermediate_components"
 },
 "CMP-019": {
  "id": "CMP-019",
  "name": "Cryogenic Cooling Loop",
  "category": "Thermal",
  "rarity": "Uncommon",
  "unit": "unit",
  "base_value": 310,
  "crafted_from": "Titanium + Coolant + specialized pumps",
  "notes": "Required for quantum systems and some exotic weapons.",
  "group": "intermediate_components"
 },
 "CMP-020": {
  "id": "CMP-020",
  "name": "Adaptive Camouflage Membrane",
  "category": "Stealth",
  "rarity": "Rare",
  "unit": "m2",
  "base_value": 1200,
  "crafted_from": "Advanced Electronics + photochromic polymers + sensors",
  "notes": "Active visual and limited IR camouflage.",
  "group": "intermediate_components"
 }
};

export const MATERIAL_KEYS = Object.keys(MATERIALS);

/** Materials by where they come from: raw, biological, refined, component. */
export const MATERIAL_GROUPS = {
  raw_mined_extracted: 'Mined & extracted',
  grown_cultured_biological: 'Grown & cultured',
  refined_materials: 'Refined',
  intermediate_components: 'Components'
};

export const materialsIn = group => MATERIAL_KEYS.filter(k => MATERIALS[k].group === group);
export const material = id => MATERIALS[id] || null;
export const materialName = id => (MATERIALS[id] && MATERIALS[id].name) || id;

/** Tier of a material, inferred from its group. Drives what tier of industry can make it. */
const MATERIAL_TIER = {
  raw_mined_extracted: 0, grown_cultured_biological: 0,
  refined_materials: 1, intermediate_components: 2
};
export const materialTier = id => {
  const m = MATERIALS[id];
  return m ? (MATERIAL_TIER[m.group] || 0) : 0;
};
