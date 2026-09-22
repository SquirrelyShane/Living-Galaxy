import { P, INT } from "./_part.js";
/* 13 — LIFE SUPPORT: WATER, WASTE, FOOD */
export default {
  id: "d13", name: "13 Life Support — Water, Waste, Food",
  sheet: {
    materials: "Membranes, catalytic reactors, LED grow arrays, photobioreactor glass",
    interfaces: "Atmosphere loop, nutrient recycling, galley, medical",
    failures: "Membrane fouling, biofilm, crop blight, water off-spec",
    industry: "Life industry — sorbents, bioreactors, medical, food",
    range: "~3–5 kg water per person-day before recovery; closed-loop target >95%"
  },
  groups: [
    { id: "d13.water", name: "Water recovery", parts: [
      P("wf.urine",     "Urine Processor Assembly",        "module", { size: 0.7, tags: ["life"], mass: 0.9, pwr: -3, heat: 2, tint: "dark" }),
      P("wf.condensate","Humidity Condensate Recovery",    "module", { size: 0.6, tags: ["life"], mass: 0.5, pwr: -2 }),
      P("wf.multifilt", "Multifiltration & Catalytic Reactor","tank",{ size: 0.9, tags: ["life"], mass: 1.8, pwr: -3, tint: "light" }),
      P("wf.polish",    "Potable Polish & Residual",       "hatch",  { size: 0.6, tags: INT, mass: 0.2, lamp: "#5fd0ff" })
    ]},
    { id: "d13.waste", name: "Waste processing", parts: [
      P("wf.solids",    "Solids Collection & Drying",      "module", { size: 0.7, tags: ["life"], mass: 0.8, pwr: -2, heat: 3, tint: "dark" }),
      P("wf.pyro",      "Pyrolysis / Composting Unit",     "module", { size: 0.8, tags: ["life"], mass: 1.2, pwr: -6, heat: 8, lamp: "#ff8a2a" }),
      P("wf.brine",     "Brine Processor",                 "module", { size: 0.6, tags: ["life"], mass: 0.6, pwr: -3, heat: 2 })
    ]},
    { id: "d13.food", name: "Growth chambers / bioreactors", parts: [
      P("wf.hydroponic","Hydroponic Rack Module",          "module", { size: 1.0, tags: ["life", "habitat"], mass: 1.6, pwr: -6, lamp: "#74ffb8", tint: "panel", window: true }),
      P("wf.algae",     "Algae Photobioreactor",           "tank",   { size: 0.9, tags: ["life"], mass: 2.0, pwr: -3, tint: "algae" }),
      P("wf.cellag",    "Cellular Agriculture Cell",       "module", { size: 0.8, tags: ["life", "experimental"], mass: 1.2, pwr: -5, lamp: "#ff9ad5", window: true }),
      P("wf.galley",    "Galley & Packaged Stores",        "container", { size: 0.9, tags: ["habitat"], mass: 2.0, pwr: -1 })
    ]},
    { id: "d13.nutrient", name: "Nutrient recycling", parts: [
      P("wf.nutrient",  "Nutrient Recovery System",        "module", { size: 0.6, tags: ["life"], mass: 0.5, pwr: -2, lamp: "#74ffb8" })
    ]}
  ]
};
