import { P } from "./_part.js";
/* 03 — POWER GENERATION */
export default {
  id: "d03", name: "03 Power Generation",
  sheet: {
    materials: "III-V PV, BeO / heat-pipe metals, Li or NaK coolants, superconducting magnets (fusion)",
    interfaces: "Primary HVDC bus, dump radiators, shadow-shield geometry, sun-tracking drives",
    failures: "Array degradation, dust opacity, coolant leak, converter seize, shield streaming",
    industry: "PV lines, nuclear shops, magnet winding, radiator fabrication",
    range: "Solar 300–500 W/kg · Kilopower kWe · industrial fission 1–100 MWe · fusion MW–GW"
  },
  groups: [
    { id: "d03.solar", name: "Solar arrays & concentrators", parts: [
      P("pw.solar.film",  "Thin-Film Solar Blanket",        "array", { sun: "seek", size: 1.2, tags: ["power", "deploy"], mass: 0.6, pwr: 45, deploy: true, tint: "solar", mirror: true }),
      P("pw.solar.mj",    "Multi-Junction Solar Wing",      "array", { sun: "seek", size: 1.1, tags: ["power", "deploy"], mass: 0.9, pwr: 70, deploy: true, tint: "solar", mirror: true }),
      P("pw.solar.conc",  "Concentrator Array",             "array", { sun: "seek", size: 1.1, tags: ["power", "deploy"], mass: 1.0, pwr: 90, deploy: true, tint: "solar", mirror: true }),
      P("pw.solar.dust",  "Dust-Clearing Solar Panel",      "array", { sun: "seek", size: 1.0, tags: ["power", "deploy"], mass: 0.8, pwr: 38, deploy: true, tint: "solar", mirror: true }),
      P("pw.suntrack",    "Sun-Tracker Drive & Slip Ring",  "cmg",   { size: 0.6, tags: ["power"], mass: 0.4, pwr: -1 })
    ]},
    { id: "d03.rtg", name: "RTG / ASRG", parts: [
      P("pw.rtg",         "Radioisotope Thermoelectric Generator", "rtg", { size: 0.8, tags: ["power"], mass: 0.9, pwr: 6, heat: 8 }),
      P("pw.asrg",        "Advanced Stirling RTG",          "rtg",   { size: 0.9, tags: ["power"], mass: 1.1, pwr: 12, heat: 9, lamp: "#ffb03a" }),
      P("pw.heatsource",  "GPHS Heat Source Module",        "module",{ size: 0.5, tags: ["power"], mass: 0.4, heat: 6, tint: "dark", lamp: "#ff8a2a" })
    ]},
    { id: "d03.fission", name: "Fission plants", parts: [
      P("pw.kilo",        "Kilopower Fission Reactor",      "reactor", { size: 0.8, tags: ["power", "reactor"], mass: 6, pwr: 120, heat: 240 }),
      P("pw.mw",          "Multi-MW Fission Plant",         "reactor", { size: 1.2, tags: ["power", "reactor"], mass: 22, pwr: 2400, heat: 4000 }),
      P("pw.namak",       "Liquid-Metal (NaK) Loop Module", "tank",  { size: 0.8, tags: ["power", "thermal"], mass: 1.8, heat: 20, tint: "metal", hazard: true })
    ]},
    { id: "d03.fusion", name: "Fusion plants", parts: [
      P("pw.tokamak",     "Tokamak Fusion Plant",           "reactor", { size: 1.3, tags: ["power", "reactor"], mass: 45, pwr: 9000, heat: 7000, torus: true }),
      P("pw.stellarator", "Stellarator Fusion Plant",       "reactor", { size: 1.3, tags: ["power", "reactor"], mass: 48, pwr: 9500, heat: 6800, torus: true }),
      P("pw.icf",         "Inertial Confinement Plant",     "reactor", { size: 1.1, tags: ["power", "reactor"], mass: 38, pwr: 7000, heat: 6000 }),
      P("pw.blanket",     "Blanket & He-3 / Tritium Handling","module",{ size: 0.9, tags: ["power"], mass: 3, pwr: -10, heat: 40, tint: "dark", lamp: "#cf8bff" })
    ]},
    { id: "d03.beam", name: "Beamed-power receivers", parts: [
      P("pw.rectenna",    "Microwave Rectenna",             "array", { sun: "seek", size: 1.4, tags: ["power"], mass: 1.2, pwr: 300, tint: "dark" }),
      P("pw.laserrx",     "Laser Power Receiver",           "optic", { sun: "seek", size: 1.3, tags: ["power"], mass: 1.4, pwr: 250, heat: 60 })
    ]},
    { id: "d03.conv", name: "Dynamic conversion", parts: [
      P("pw.stirling",    "Stirling Converter Bank",        "drum",  { size: 0.7, tags: ["power"], mass: 1.2, pwr: 40, heat: 30, spin: 2.0, tint: "metal" }),
      P("pw.brayton",     "Brayton Turbo-Alternator",       "drum",  { size: 0.8, tags: ["power"], mass: 2.0, pwr: 300, heat: 180, spin: 4.0, tint: "metal" }),
      P("pw.thermo",      "Thermoelectric Stack",           "module",{ size: 0.6, tags: ["power"], mass: 0.5, pwr: 8, heat: 6, tint: "dark" }),
      P("pw.mhd",         "MHD Generator Channel",          "module",{ size: 0.9, tags: ["power"], mass: 2.5, pwr: 600, heat: 200, lamp: "#cf8bff", tint: "dark" })
    ]}
  ]
};
