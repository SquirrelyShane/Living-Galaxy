import { P } from "./_part.js";
/* 19 — MANUFACTURING & INDUSTRIAL BAYS */
export default {
  id: "d19", name: "19 Manufacturing & Industrial Bays",
  sheet: {
    materials: "Metal / polymer / ceramic feedstocks, powder atomizers, e-beam guns, CMM optics",
    interfaces: "ISRU chain feed, MRU library, power and thermal for hot cells",
    failures: "Powder contamination, gun cathode wear, metrology drift",
    industry: "This bay is the industrial path — ships become nodes in a distributed shipyard network",
    range: "Printers cm–m build volumes; qualification stands vac / vibe / leak"
  },
  groups: [
    { id: "d19.additive", name: "Additive machines", parts: [
      P("mf.printer",   "Multi-Material Printer Bay",      "module", { size: 0.9, tags: ["industrial"], mass: 2.0, pwr: -12, heat: 6, lamp: "#ffb03a", window: true }),
      P("mf.wirearc",   "Wire-Arc Deposition Cell",        "module", { size: 0.8, tags: ["industrial"], mass: 1.6, pwr: -20, heat: 15, lamp: "#ff8a2a" }),
      P("mf.ebeam",     "E-Beam / Laser Sintering Cell",   "module", { size: 0.8, tags: ["industrial"], mass: 1.8, pwr: -25, heat: 18, lamp: "#ff8a2a" }),
      P("mf.vacnode",   "In-Space Vacuum Printing Node",   "truss",  { size: 1.1, tags: ["industrial"], mass: 1.2, pwr: -8, gantry: true })
    ]},
    { id: "d19.foundry", name: "Foundry / CVD / sintering", parts: [
      P("mf.furnace",   "Plasma Arc Furnace",              "drum",   { size: 0.9, tags: ["industrial"], mass: 5, pwr: -120, heat: 180, spin: 0.2, hot: true, tint: "dark" }),
      P("mf.cvd",       "CVD Chamber",                     "module", { size: 0.8, tags: ["industrial"], mass: 1.5, pwr: -15, heat: 10, lamp: "#cf8bff" }),
      P("mf.isotope",   "Isotope Separation Unit",         "drum",   { size: 0.8, tags: ["industrial"], mass: 3, pwr: -40, heat: 20, spin: 1.2 }),
      P("mf.atomizer",  "Recycle Shredder & Powder Atomizer","drum", { size: 0.8, tags: ["industrial"], mass: 2.2, pwr: -18, heat: 8, spin: 1.6, tint: "metal" })
    ]},
    { id: "d19.shops", name: "Optics & electronics shops", parts: [
      P("mf.optics",    "Precision Optics Shop",           "module", { size: 0.8, tags: ["industrial"], mass: 1.2, pwr: -6, lamp: "#bfe4ff", window: true }),
      P("mf.pickplace", "Electronics Pick-and-Place Cell", "module", { size: 0.7, tags: ["industrial"], mass: 0.8, pwr: -4, lamp: "#5fd0ff" }),
      P("mf.mems",      "MEMS Foundry",                    "module", { size: 0.7, tags: ["industrial"], mass: 1.0, pwr: -10, heat: 4, lamp: "#5fd0ff" }),
      P("mf.scwire",    "Superconductor Wire Line",        "coilBank", { size: 0.9, tags: ["industrial"], mass: 1.4, pwr: -8, cold: true }),
      P("mf.biofab",    "Biofabrication Lab",              "module", { size: 0.9, tags: ["industrial", "medical"], mass: 1.6, pwr: -6, lamp: "#74ffb8", window: true })
    ]},
    { id: "d19.spares", name: "Spare-part libraries & QA", parts: [
      P("mf.spares",    "Spare-Part Library Rack",         "container", { size: 0.9, tags: ["industrial"], mass: 1.5 }),
      P("mf.cmm",       "Metrology Cell (CMM / laser tracker)", "module", { size: 0.7, tags: ["industrial"], mass: 0.9, pwr: -3, lamp: "#7dffbe" }),
      P("mf.qualstand", "Qualification Test Stand (vac / vibe / leak)", "module", { size: 0.9, tags: ["industrial"], mass: 2.0, pwr: -8, heat: 4, tint: "metal" })
    ]}
  ]
};
