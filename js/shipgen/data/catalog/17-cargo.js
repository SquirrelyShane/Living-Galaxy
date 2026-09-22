import { P, INT } from "./_part.js";
/* 17 — CARGO, LOGISTICS & PAYLOADS (mining rig lives here with ISRU in 06) */
export default {
  id: "d17", name: "17 Cargo, Logistics & Payloads",
  sheet: {
    materials: "Standard rack frames, soft-stow fabrics, planetary-protection vault alloys",
    interfaces: "Cargo collars, inventory network, science bay power/thermal, mining conveyors",
    failures: "Unsecured mass in maneuver, contamination, thermal excursion on cargo",
    industry: "Container standards, logistics robots, science instrument houses",
    range: "Racks 1U–cabinet; holds pressurized or unpressurized; ore hoppers t-class"
  },
  groups: [
    { id: "d17.racks", name: "Standardized racks & containers", parts: [
      P("cg.rack",      "Powered Cargo Rack",              "container", { size: 0.9, tags: ["cargo"], mass: 1.2, pwr: -1 }),
      P("cg.container", "Standard Cargo Container Stack",  "container", { size: 1.1, tags: ["cargo"], mass: 3.0 }),
      P("cg.softstow",  "Soft-Stow Bag Bay",               "bay",    { size: 0.9, tags: ["cargo", "deploy"], mass: 0.8, deploy: true }),
      P("cg.unpress",   "Unpressurized Hold Frame",        "truss",  { size: 1.3, tags: ["cargo", "structure"], mass: 1.6, gantry: true })
    ]},
    { id: "d17.inventory", name: "Inventory robots", parts: [
      P("cg.rfid",      "RFID / Vision Inventory Node",    "hatch",  { size: 0.5, tags: INT, mass: 0.05, pwr: -1, lamp: "#7dffbe" }),
      P("cg.invbot",    "Inventory Robot Dock",            "hatch",  { size: 0.6, tags: INT, mass: 0.2, pwr: -1, lamp: "#ffb03a" })
    ]},
    { id: "d17.mining", name: "Mining & ore handling", parts: [
      P("cg.drill",     "Regolith Drill Boom",             "drill",  { size: 1.0, tags: ["mining", "industrial"], mass: 4, pwr: -30, heat: 10, overhang: true }),
      P("cg.intake",    "Ore Intake Maw & Conveyor",       "intake", { size: 1.0, faces: ["bottom", "bow", "port", "star"], tags: ["mining", "industrial"], mass: 3, pwr: -6 }),
      P("cg.hopper",    "Ore Hopper",                      "tank",   { size: 1.1, tags: ["mining", "cargo"], mass: 2.5, tint: "panel", hazard: true }),
      P("cg.refinery",  "Regolith Refinery Drum",          "drum",   { size: 1.1, tags: ["mining", "industrial"], mass: 7, pwr: -60, heat: 90, spin: 0.55, hot: true })
    ]},
    { id: "d17.science", name: "Science bays & sample containment", parts: [
      P("cg.scilab",    "Science Optical Bench Lab",       "lab",    { size: 1.0, tags: ["science"], mass: 2.5, pwr: -8, heat: 3 }),
      P("cg.samplevault","Sample Return Vault (planetary protection)", "module", { size: 0.8, tags: ["science"], mass: 1.2, pwr: -2, heat: -2, cold: true, lamp: "#ffb03a" }),
      P("cg.interfero", "Interferometer Boom",             "truss",  { size: 1.4, tags: ["science", "sensor"], mass: 1.0, pwr: -2, optic: true }),
      P("cg.lander",    "Planetary Lander Interface",      "landerClamp", { size: 0.9, faces: ["bottom", "port", "star"], tags: ["landing", "deploy"], mass: 3 }),
      P("cg.gear",      "Landing Gear Set",                "landerClamp", { size: 0.75, faces: ["bottom", "port", "star"], tags: ["landing", "deploy"], mass: 2 })
    ]},
    { id: "d17.colony", name: "Colony / seed payloads", parts: [
      P("cg.seedbank",  "Seed Bank Vault",                 "tank",   { size: 1.0, tags: ["experimental", "cargo"], mass: 3, pwr: -3, heat: -5, tint: "algae", cold: true }),
      P("cg.printers",  "Colony Printer Set",              "container", { size: 1.0, tags: ["industrial", "cargo"], mass: 2.5 }),
      P("cg.livestock", "Livestock Cell Bank",             "module", { size: 0.9, tags: ["experimental"], mass: 1.8, pwr: -4, heat: -3, cold: true, lamp: "#ff9ad5" }),
      P("cg.genship",   "Generation-Ship Ecosystem Module","drum",   { size: 1.6, tags: ["experimental", "habitat"], mass: 20, pwr: -30, windows: true, spin: 0.25, tint: "panel", green: true })
    ]}
  ]
};
