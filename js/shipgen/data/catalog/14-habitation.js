import { P, INT } from "./_part.js";
/* 14 — HABITATION & CREW SYSTEMS */
export default {
  id: "d14", name: "14 Habitation & Crew Systems",
  sheet: {
    materials: "Interior composites, acoustic foams, circadian LED spectra, high-mass shelter cores",
    interfaces: "ECLSS loops, power, medical data, artificial-gravity bearing to spine",
    failures: "Mold, psychological isolation, lighting drift, medical consumable exhaustion",
    industry: "Interior outfitting yards, medical device lines, horticulture modules",
    range: "Storm shelter 10–40 g/cm²; rotating sections 2–6 rpm for partial g"
  },
  groups: [
    { id: "d14.quarters", name: "Quarters, commons, medical", parts: [
      P("hb.cabins",    "Sleep Cabin Block",               "module", { size: 1.0, tags: ["habitat"], mass: 2.4, pwr: -2, window: true, lamp: "#ffdca8" }),
      P("hb.wardroom",  "Galley / Wardroom",               "module", { size: 1.0, tags: ["habitat"], mass: 2.0, pwr: -3, window: true, lamp: "#ffdca8" }),
      P("hb.hygiene",   "Hygiene Module",                  "module", { size: 0.7, tags: ["habitat"], mass: 0.9, pwr: -1 }),
      P("hb.medbay",    "Medical Bay + Bioprinter",        "module", { size: 1.0, tags: ["habitat", "medical"], mass: 3, pwr: -6, heat: 2, lamp: "#ff4a5a", window: true }),
      P("hb.exercise",  "Exercise Module (resistive + aerobic)", "module", { size: 0.9, tags: ["habitat"], mass: 1.4, pwr: -2, window: true })
    ]},
    { id: "d14.light", name: "Lighting & circadian", parts: [
      P("hb.circadian", "Circadian Lighting Controller",   "hatch",  { size: 0.5, tags: INT, mass: 0.05, pwr: -1, lamp: "#ffdca8" }),
      P("hb.acoustic",  "Noise / Vibration Isolation Set", "hatch",  { size: 0.6, tags: INT, mass: 0.3 })
    ]},
    { id: "d14.gravity", name: "Artificial gravity", parts: [
      P("hb.gravring",  "Rotating Gravity Section",        "drum",   { size: 1.4, tags: ["habitat"], mass: 12, pwr: -10, windows: true, spin: 0.35 }),
      P("hb.gravbearing","Rotating-Section Bearing & Slip Ring", "coilBank", { size: 0.9, tags: INT, mass: 1.5, pwr: -2 }),
      P("hb.lineargrav","Linear-g Burn Plan Deck",         "hatch",  { size: 0.9, tags: INT, mass: 3 })
    ]},
    { id: "d14.shelter", name: "Storm shelters", parts: [
      P("hb.shelter",   "Radiation Storm Shelter",         "module", { size: 1.0, tags: ["habitat"], mass: 6, tint: "dark", lamp: "#ffb03a" })
    ]},
    { id: "d14.culture", name: "Rec / culture modules", parts: [
      P("hb.greenhouse","Greenhouse / Green Space",        "lab",    { size: 1.0, tags: ["habitat"], mass: 2.5, pwr: -4, green: true }),
      P("hb.rec",       "Recreation / VR Commons",         "module", { size: 1.0, tags: ["habitat"], mass: 2, pwr: -3, lamp: "#74ffb8", window: true }),
      P("hb.culture",   "Culture / Library Archive",       "module", { size: 0.8, tags: ["habitat", "experimental"], mass: 1.2, pwr: -1, lamp: "#cf8bff", window: true })
    ]}
  ]
};
