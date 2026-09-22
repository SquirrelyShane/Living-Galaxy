/* Raw stock at the bottom of every bill of materials. `kind` groups them
 * for the summary; `kgm3` lets volume-priced things (tanks, shielding)
 * convert; `cr` is a book price per tonne for the demo's estimate. */
export const MATERIALS = {
  al_li:     { name: "Al-Li 2195 alloy",           kind: "alloy",     kgm3: 2700, cr: 3200 },
  al6061:    { name: "Al 6061-T6",                 kind: "alloy",     kgm3: 2700, cr: 2100 },
  ti64:      { name: "Ti-6Al-4V alloy",            kind: "alloy",     kgm3: 4430, cr: 9800 },
  steel304:  { name: "304L stainless steel",       kind: "alloy",     kgm3: 7900, cr: 1500 },
  inconel:   { name: "Inconel 718",                kind: "alloy",     kgm3: 8190, cr: 14000 },
  cu:        { name: "OFHC copper",                kind: "alloy",     kgm3: 8960, cr: 4200 },
  w:         { name: "Tungsten",                   kind: "refractory",kgm3: 19300, cr: 22000 },
  cfrp:      { name: "Carbon-fibre laminate",      kind: "composite", kgm3: 1600, cr: 18000 },
  cnt:       { name: "CNT / graphene composite",   kind: "composite", kgm3: 1500, cr: 60000 },
  kevlar:    { name: "Kevlar / Nextel fabric",     kind: "composite", kgm3: 1440, cr: 12000 },
  kapton:    { name: "Aluminised Kapton film",     kind: "polymer",   kgm3: 1420, cr: 9000 },
  pe:        { name: "High-density polyethylene",  kind: "polymer",   kgm3: 950,  cr: 1400 },
  ptfe:      { name: "PTFE",                       kind: "polymer",   kgm3: 2200, cr: 6000 },
  epoxy:     { name: "Space-grade epoxy",          kind: "polymer",   kgm3: 1200, cr: 5000 },
  aerogel:   { name: "Silica aerogel",             kind: "insulation",kgm3: 100,  cr: 40000 },
  alumina:   { name: "Alumina ceramic",            kind: "ceramic",   kgm3: 3950, cr: 5200 },
  sic:       { name: "Silicon carbide",            kind: "ceramic",   kgm3: 3210, cr: 8500 },
  b4c:       { name: "Boron carbide",              kind: "ceramic",   kgm3: 2520, cr: 16000 },
  sapphire:  { name: "Sapphire",                   kind: "glass",     kgm3: 3980, cr: 90000 },
  fused_si:  { name: "Fused silica",               kind: "glass",     kgm3: 2200, cr: 7000 },
  si:        { name: "Silicon (rad-hard process)", kind: "semiconductor", kgm3: 2330, cr: 120000 },
  gaas:      { name: "GaAs multi-junction",        kind: "semiconductor", kgm3: 5320, cr: 400000 },
  ndfeb:     { name: "NdFeB magnet",               kind: "magnet",    kgm3: 7500, cr: 60000 },
  rebco:     { name: "REBCO superconductor tape",  kind: "superconductor", kgm3: 6500, cr: 300000 },
  li:        { name: "Li-metal cell stock",        kind: "electrochem", kgm3: 534, cr: 45000 },
  zeolite:   { name: "Zeolite sorbent",            kind: "sorbent",   kgm3: 700,  cr: 3000 },
  amine:     { name: "Amine sorbent",              kind: "sorbent",   kgm3: 900,  cr: 4000 },
  activated_c:{ name: "Activated carbon",          kind: "sorbent",   kgm3: 500,  cr: 2500 },
  pt:        { name: "Pt / Ir catalyst",           kind: "catalyst",  kgm3: 21450, cr: 30000000 },
  nafion:    { name: "Proton-exchange membrane",   kind: "polymer",   kgm3: 1980, cr: 80000 },
  hepa:      { name: "HEPA glass-fibre media",     kind: "filter",    kgm3: 200,  cr: 6000 },
  water:     { name: "Water",                      kind: "fluid",     kgm3: 1000, cr: 60 },
  nh3:       { name: "Ammonia",                    kind: "fluid",     kgm3: 682,  cr: 400 },
  nak:       { name: "NaK coolant",                kind: "fluid",     kgm3: 866,  cr: 9000 },
  lh2:       { name: "Liquid hydrogen",            kind: "propellant",kgm3: 71,   cr: 5000 },
  lox:       { name: "Liquid oxygen",              kind: "propellant",kgm3: 1141, cr: 200 },
  xe:        { name: "Xenon",                      kind: "propellant",kgm3: 3000, cr: 1200000 },
  biomass:   { name: "Plant / algae biomass",      kind: "bio",       kgm3: 400,  cr: 800 },
  nutrient:  { name: "Nutrient salts",             kind: "bio",       kgm3: 1200, cr: 1500 },
  soil:      { name: "Regolith growth medium",     kind: "bio",       kgm3: 1500, cr: 90 },
  pharma:    { name: "Pharmaceutical feedstock",   kind: "bio",       kgm3: 1000, cr: 250000 },
  hale:      { name: "HALEU fuel",                 kind: "nuclear",   kgm3: 19000, cr: 8000000 },
  he3:       { name: "Helium-3 / deuterium",       kind: "nuclear",   kgm3: 125,  cr: 40000000 },
  regolith:  { name: "Processed regolith",         kind: "isru",      kgm3: 1800, cr: 40 },
  pb:        { name: "Lead / bismuth shielding",   kind: "alloy",     kgm3: 11300, cr: 2600 },
  /* structural metals a yard can skin a hull in — each with its own look */
  al_sc:     { name: "Al-Sc 5028 alloy",           kind: "alloy",     kgm3: 2670, cr: 5400 },
  ti_beta:   { name: "β-titanium (Ti-15-3)",       kind: "alloy",     kgm3: 4760, cr: 12500 },
  hy_steel:  { name: "HY-100 armour steel",        kind: "alloy",     kgm3: 7850, cr: 2400 },
  maraging:  { name: "Maraging 350 steel",         kind: "alloy",     kgm3: 8100, cr: 7600 },
  mg_li:     { name: "Mg-Li ultralight alloy",     kind: "alloy",     kgm3: 1350, cr: 6800 },
  nb_c103:   { name: "Niobium C-103 alloy",        kind: "refractory",kgm3: 8850, cr: 48000 },
  bronze:    { name: "Aluminium bronze (C954)",    kind: "alloy",     kgm3: 7450, cr: 5100 },
  du:        { name: "Depleted uranium",           kind: "refractory",kgm3: 19100, cr: 18000 },
  ta:        { name: "Tantalum",                   kind: "refractory",kgm3: 16650, cr: 260000 },
};

/* Hull alloys: what the structure is skinned and framed in. The style rolls
 * one per station; it tints the hull material and takes over the primary
 * structural share (al_li) in every structure, docking and armour part. */
export const ALLOYS = {
  al_li:    { name: "Al-Li",        tint: "#c9d0d8", metalness: 0.62, roughness: 0.38 },
  al6061:   { name: "Al 6061",      tint: "#b8bdc4", metalness: 0.55, roughness: 0.48 },
  al_sc:    { name: "Al-Sc",        tint: "#d6dce4", metalness: 0.68, roughness: 0.3 },
  ti64:     { name: "Ti-6-4",       tint: "#9a9ca4", metalness: 0.7, roughness: 0.42 },
  ti_beta:  { name: "β-Ti",         tint: "#8f96a8", metalness: 0.72, roughness: 0.36 },
  steel304: { name: "304L steel",   tint: "#8d9299", metalness: 0.8, roughness: 0.4 },
  hy_steel: { name: "HY-100",       tint: "#4d5560", metalness: 0.55, roughness: 0.66 },
  maraging: { name: "Maraging",     tint: "#6b6a70", metalness: 0.75, roughness: 0.44 },
  inconel:  { name: "Inconel",      tint: "#7c7a6c", metalness: 0.8, roughness: 0.38 },
  mg_li:    { name: "Mg-Li",        tint: "#c2c8c0", metalness: 0.4, roughness: 0.6 },
  bronze:   { name: "Al-bronze",    tint: "#a9845a", metalness: 0.85, roughness: 0.34 },
  nb_c103:  { name: "Nb C-103",     tint: "#6f6a78", metalness: 0.78, roughness: 0.4 },
};
export const ALLOY_KEYS = Object.keys(ALLOYS);

/* Fabrication rate over raw stock, by material kind: what the yard adds
 * turning stock into a certified part. */
export const FAB_RATE = {
  alloy: 2.4, refractory: 3.2, composite: 3.0, polymer: 1.8, insulation: 1.6, ceramic: 2.6, glass: 2.2,
  semiconductor: 4.0, magnet: 2.0, superconductor: 3.5, electrochem: 2.0, sorbent: 1.5, catalyst: 1.3,
  filter: 1.6, fluid: 1.05, propellant: 1.05, bio: 1.2, nuclear: 2.5, isru: 1.2,
};
