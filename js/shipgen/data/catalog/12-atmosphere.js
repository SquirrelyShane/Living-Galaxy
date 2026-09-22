import { P, INT } from "./_part.js";
/* 12 — LIFE SUPPORT: ATMOSPHERE */
export default {
  id: "d12", name: "12 Life Support — Atmosphere",
  sheet: {
    materials: "Stainless / Ti plumbing, zeolite beds, Ru / Pd catalysts, HEPA media",
    interfaces: "Water loop (electrolysis feed), N₂ makeup store, cabin pressure sensors, power bus",
    failures: "Bed breakthrough, fan seize, electrolysis membrane dry-out, microbial bloom",
    industry: "Sorbent lines, catalyst shops, fan/duct fabrication",
    range: "Crew of 4–6: several kW; >95% O₂ recovery with Sabatier + electrolysis"
  },
  groups: [
    { id: "d12.o2", name: "O₂ generation", parts: [
      P("at.electrolysis","Water Electrolysis O₂ Plant",   "module", { size: 0.8, tags: ["life"], mass: 1.2, pwr: -8, heat: 3, lamp: "#7dffbe" }),
      P("at.soxe",      "Solid-Oxide Electrolyzer",        "module", { size: 0.7, tags: ["life"], mass: 1.0, pwr: -9, heat: 5, lamp: "#ffb03a" }),
      P("at.emergo2",   "Emergency O₂ Candles & Masks",    "hatch",  { size: 0.6, tags: ["life", "safety"], mass: 0.3, lamp: "#ff4a5a" })
    ]},
    { id: "d12.co2", name: "CO₂ removal / reduction", parts: [
      P("at.sieve",     "4-Bed Molecular Sieve",           "module", { size: 0.6, tags: ["life"], mass: 0.5, pwr: -2, heat: 1 }),
      P("at.amine",     "Amine Swing-Bed",                 "module", { size: 0.6, tags: ["life"], mass: 0.5, pwr: -2, heat: 1, tint: "dark" }),
      P("at.sabatier",  "Sabatier Reactor",                "module", { size: 0.7, tags: ["life"], mass: 0.9, pwr: -4, heat: 5, lamp: "#ffb03a" }),
      P("at.bosch",     "Bosch Reactor",                   "module", { size: 0.7, tags: ["life"], mass: 1.0, pwr: -6, heat: 6, lamp: "#ff8a2a" })
    ]},
    { id: "d12.trace", name: "Trace contaminant & filtration", parts: [
      P("at.tcc",       "Trace Contaminant Control",       "module", { size: 0.6, tags: ["life"], mass: 0.4, pwr: -2 }),
      P("at.hepa",      "HEPA / Microbial Filter Bank",    "hatch",  { size: 0.6, tags: INT, mass: 0.1 }),
      P("at.fans",      "Fan / Duct / Silencer Set",       "hatch",  { size: 0.7, tags: INT, mass: 0.3, pwr: -1 })
    ]},
    { id: "d12.press", name: "Cabin pressure control", parts: [
      P("at.pressure",  "Cabin Pressure Control Assembly", "hatch",  { size: 0.7, tags: INT, mass: 0.3, pwr: -1 }),
      P("at.n2makeup",  "N₂ Makeup Regulator",             "hatch",  { size: 0.5, tags: INT, mass: 0.1 }),
      P("at.relief",    "Positive-Pressure Relief Valve",  "hatch",  { size: 0.5, tags: INT, mass: 0.05, lamp: "#ffb03a", hazard: true })
    ]}
  ]
};
