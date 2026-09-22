import { P, INT } from "./_part.js";
/* 04 — ENERGY STORAGE & DISTRIBUTION */
export default {
  id: "d04", name: "04 Energy Storage & Distribution",
  sheet: {
    materials: "Li-metal / solid-electrolyte cells, Cu/Al buswork, SiC or GaN switches",
    interfaces: "Every load on the ship; PPUs, umbilical power ports, grounding straps",
    failures: "Thermal runaway, bus short, converter ripple, connector arcing in vacuum",
    industry: "Cell lines, power-electronics fabs, harness shops",
    range: "Bus 28 V / 120 V / 300–1000 V class; conversion efficiency 90–98%"
  },
  groups: [
    { id: "d04.store", name: "Storage", parts: [
      P("ep.battery",   "Solid-State Battery Pack",       "module",   { size: 0.9, tags: ["storage"], mass: 2.4, heat: 4, lamp: "#7dffbe" }),
      P("ep.supercap",  "Supercapacitor Bank",            "coilBank", { size: 0.8, tags: ["storage"], mass: 1.2, heat: 3 }),
      P("ep.flywheel",  "Flywheel on Magnetic Bearings",  "cmg",      { size: 0.9, tags: ["storage"], mass: 2.0, heat: 2, fast: true }),
      P("ep.smes",      "SMES Coil",                      "coilBank", { size: 1.1, tags: ["storage"], mass: 3.5, pwr: -6, heat: -2, cold: true })
    ]},
    { id: "d04.conv", name: "Conversion", parts: [
      P("ep.dcdc",      "DC-DC Converter Rack",           "module",   { size: 0.6, tags: INT, mass: 0.6, heat: 5, lamp: "#ffb03a", tint: "metal" }),
      P("ep.inverter",  "Inverter Bank",                  "module",   { size: 0.6, tags: INT, mass: 0.7, heat: 6, lamp: "#ffb03a" }),
      P("ep.ppu",       "Thruster PPU Cabinet",           "module",   { size: 0.7, tags: INT, mass: 0.9, pwr: -12, heat: 8, lamp: "#cf8bff" })
    ]},
    { id: "d04.dist", name: "Distribution", parts: [
      P("ep.hvdc",      "Primary HVDC Bus",               "hatch",    { size: 0.8, tags: INT, mass: 0.5, heat: 3, lamp: "#ffb03a" }),
      P("ep.lvbus",     "Secondary LV Bus",               "hatch",    { size: 0.6, tags: INT, mass: 0.3, heat: 1, lamp: "#7dffbe" }),
      P("ep.switchgear","Switchgear & Current Limiters",  "hatch",    { size: 0.7, tags: INT, mass: 0.4, heat: 2, lamp: "#ff8a2a" }),
      P("ep.ground",    "Grounding / Bonding Strap Node", "hatch",    { size: 0.5, tags: INT, mass: 0.1 }),
      P("ep.umbport",   "Umbilical Power Port",           "umbilical",{ size: 0.8, tags: ["dock"], mass: 0.5, lamp: "#ffb03a" }),
      P("ep.wireless",  "Inductive Power Node",           "hatch",    { size: 0.6, tags: INT, mass: 0.2, pwr: -1, lamp: "#5fd0ff", ring: true })
    ]},
    { id: "d04.prot", name: "Protection", parts: [
      P("ep.fault",     "Fault-Isolation Module",         "hatch",    { size: 0.7, tags: INT, mass: 0.3, lamp: "#ff4a5a" }),
      P("ep.arcfault",  "Arc-Fault Detector",             "hatch",    { size: 0.5, tags: INT, mass: 0.1, lamp: "#ff4a5a" }),
      P("ep.loadshed",  "Load-Shed Controller",           "hatch",    { size: 0.5, tags: INT, mass: 0.1, lamp: "#ffb03a" })
    ]}
  ]
};
