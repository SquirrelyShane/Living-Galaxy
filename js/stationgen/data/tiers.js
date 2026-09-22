/* Population tiers. Tier III is the high-population one: a habitat drum
 * instead of pods, a ring of mess halls, life support in multiples. The
 * tier scales the hull too — a Tier III station is a small city. */
export const TIERS = {
  I:   { label: "Tier I",   pop: 240,   quarters: "hb.quarters_1", quartersN: 1, mess: 1, kitchens: 1, life: 1, water: 1, farms: 1, medical: 0, commons: 0, shelters: 1, lifeboats: 2, spineM: 300, hullScale: 1.0, moduleScale: 0.78 },
  II:  { label: "Tier II",  pop: 2400,  quarters: "hb.quarters_2", quartersN: 1, mess: 2, kitchens: 2, life: 2, water: 2, farms: 2, medical: 1, commons: 1, shelters: 2, lifeboats: 6, spineM: 440, hullScale: 1.45, moduleScale: 1.05 },
  III: { label: "Tier III", pop: 24000, quarters: "hb.quarters_3", quartersN: 1, mess: 4, kitchens: 4, life: 4, water: 3, farms: 4, medical: 2, commons: 3, shelters: 4, lifeboats: 14, spineM: 760, hullScale: 2.1, moduleScale: 1.15 },
};
export const TIER_KEYS = Object.keys(TIERS);
