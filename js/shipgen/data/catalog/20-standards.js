import { P, INT } from "./_part.js";
/* 20 — STANDARDS & CROSS-CUTTING INTERFACES */
export default {
  id: "d20", name: "20 Standards & Cross-Cutting Interfaces",
  sheet: {
    materials: "Rail / rack patterns, QD families, pinout classes, MRU size grades 1U–cabinet",
    interfaces: "Everything — this domain is the interface",
    failures: "Generation drift: a part that no longer mates with the ship it was built for",
    industry: "Yard industry — certification regimes and multi-generation upgrade rules",
    range: "Hatch diameters, handhold loads, voltage classes fixed for the ship's lifetime"
  },
  groups: [
    { id: "d20.mech", name: "Mechanical / fluid / power / data standards", parts: [
      P("sd.railpattern","Standard Bolt / Rail Pattern Plate","hatch",{ size: 0.9, tags: ["structure"], mass: 0.3, lamp: "#7dffbe", ring: true }),
      P("sd.qdfamily",  "Fluid QD Family Panel",           "umbilical", { size: 0.8, tags: ["fluids"], mass: 0.4 }),
      P("sd.pinout",    "Power Pinout / Voltage-Class Port","umbilical",{ size: 0.7, tags: ["structure"], mass: 0.3, lamp: "#ffb03a" }),
      P("sd.timesync",  "Data Protocol & Time-Sync Node",  "hatch",  { size: 0.5, tags: INT, mass: 0.05, pwr: -1, lamp: "#5fd0ff" })
    ]},
    { id: "d20.mru", name: "Modular replaceable units", parts: [
      P("sd.mru1u",     "MRU Grade 1U Bay",                "hatch",  { size: 0.6, tags: INT, mass: 0.1 }),
      P("sd.mrucab",    "MRU Cabinet Bay",                 "module", { size: 0.9, tags: INT, mass: 0.8, tint: "metal" })
    ]},
    { id: "d20.qual", name: "Qualification regimes", parts: [
      P("sd.radqual",   "Radiation / Thermal Qualification Tag", "hatch", { size: 0.5, tags: INT, mass: 0.02, lamp: "#ffb03a" }),
      P("sd.isrucert",  "ISRU Manufacturing Certification", "hatch", { size: 0.5, tags: INT, mass: 0.02, lamp: "#5fd0ff" }),
      P("sd.human",     "Human-Factors Standard (hatch / handhold)", "hatch", { size: 0.5, tags: INT, mass: 0.02, lamp: "#7dffbe" })
    ]},
    { id: "d20.upgrade", name: "Multi-generation upgrade rules", parts: [
      P("sd.genlock",   "Generation Compatibility Key",    "hatch",  { size: 0.5, tags: INT, mass: 0.02, lamp: "#cf8bff", ring: true })
    ]}
  ]
};
