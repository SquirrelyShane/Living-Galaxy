import { P, INT } from "./_part.js";
/* 02 — PROPELLANT, FLUIDS & STORES */
export default {
  id: "d02", name: "02 Propellant, Fluids & Stores",
  sheet: {
    materials: "Ti, Al-Li, Inconel, COPV carbon overwrap, PTFE/metal seals, MLI + vapor-cooled shields",
    interfaces: "Engine feed manifolds, pressurant taps, docking umbilicals, ZBO cryocooler loop",
    failures: "Boil-off, stratification, fitting leaks, valve freeze, PMD dry-out in micro-g",
    industry: "Cryo tank winding, valve cleanrooms, leak-check stands",
    range: "Xenon COPVs tens–thousands of kg; LH2 ZBO plants need kW-class cryocoolers"
  },
  groups: [
    { id: "d02.cryo", name: "Cryogenic tanks", parts: [
      P("fl.lh2",      "LH₂ Cryogenic Dewar (ZBO)",      "tank", { size: 1.3, tags: ["fluids"], mass: 5, pwr: -4, heat: -8, tint: "light", cold: true }),
      P("fl.lox",      "LOX Tank",                        "tank", { size: 1.1, tags: ["fluids"], mass: 4, tint: "light", cold: true }),
      P("fl.lch4",     "LCH₄ Tank",                       "tank", { size: 1.1, tags: ["fluids"], mass: 3.6, tint: "light", cold: true }),
      P("fl.lxe",      "LXe Cryo Store",                  "tank", { size: 0.8, tags: ["fluids"], mass: 2.2, tint: "light", cold: true })
    ]},
    { id: "d02.hp", name: "High-pressure bottles", parts: [
      P("fl.xecopv",   "Xenon COPV",                      "sphereTank", { size: 0.9, tags: ["fluids"], mass: 1.6, hazard: true }),
      P("fl.krcopv",   "Krypton COPV",                    "sphereTank", { size: 0.9, tags: ["fluids"], mass: 1.4 }),
      P("fl.he",       "Helium Pressurant Bottle",        "sphereTank", { size: 0.6, tags: ["fluids"], mass: 0.5, tint: "light" }),
      P("fl.gn2",      "GN₂ Pressurant Bottle",           "sphereTank", { size: 0.6, tags: ["fluids"], mass: 0.5, tint: "metal" })
    ]},
    { id: "d02.stores", name: "Water, ammonia, nitrogen stores", parts: [
      P("fl.water",    "Potable Water Store",             "tank", { size: 1.0, tags: ["fluids", "life"], mass: 2.4, tint: "light" }),
      P("fl.nh3",      "Ammonia Working-Fluid Store",     "tank", { size: 0.8, tags: ["fluids", "thermal"], mass: 1.4, tint: "panel", hazard: true }),
      P("fl.n2",       "Nitrogen Makeup Store",           "sphereTank", { size: 0.7, tags: ["fluids", "life"], mass: 0.9 })
    ]},
    { id: "d02.feed", name: "Feed lines, valves, PMDs", parts: [
      P("fl.manifold", "Feed Manifold & Isolation Valves","hatch", { size: 0.9, tags: INT, mass: 0.6, lamp: "#ffb03a" }),
      P("fl.filters",  "Filters, Getters & Flow Meters",  "hatch", { size: 0.7, tags: INT, mass: 0.3, lamp: "#5fd0ff" }),
      P("fl.pmd",      "Propellant Management Device",    "hatch", { size: 0.7, tags: INT, mass: 0.4 }),
      P("fl.autogen",  "Autogenous Pressurization Tap",   "hatch", { size: 0.6, tags: INT, mass: 0.2, lamp: "#ff8a2a" })
    ]},
    { id: "d02.xfer", name: "Transfer / refueling", parts: [
      P("fl.umbilical","Refuel Umbilical Panel (QD family)","umbilical", { size: 1.0, tags: ["dock", "fluids"], mass: 0.9 }),
      P("fl.qd",       "Quick-Disconnect Cluster",        "umbilical", { size: 0.7, tags: ["fluids"], mass: 0.4 }),
      P("fl.chill",    "Chill-Down & Recycle Loop",       "module", { size: 0.7, tags: ["fluids"], mass: 0.8, pwr: -3, heat: -4, cold: true, lamp: "#bfe4ff" })
    ]}
  ]
};
