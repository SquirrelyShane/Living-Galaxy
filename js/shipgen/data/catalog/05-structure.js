import { P, INT } from "./_part.js";
/* 05 — STRUCTURE, HULL & MECHANISMS */
export default {
  id: "d05", name: "05 Structure, Hull & Mechanisms",
  sheet: {
    materials: "Al-Li, Ti-6Al-4V, high-entropy alloys, CFRP, CNT/graphene composites, metallic-glass joints",
    interfaces: "Hardpoints for engines, tanks, radiators; pressure seals; thermal isolation pads",
    failures: "Fatigue at cutouts, MMOD penetration, hinge seize, seal leak, buckling",
    industry: "Large autoclaves, friction-stir welding, in-space truss printers",
    range: "Pressure walls rated 1–2 atm + margin; primary structure 10–25% dry mass"
  },
  groups: [
    { id: "d05.primary", name: "Primary frames & bulkheads", parts: [
      P("st.cnt",       "CNT / Graphene Composite Truss", "truss",   { size: 1.0, tags: ["structure"], mass: 0.4 }),
      P("st.tiav",      "Ti-6Al-4V Frame Segment",        "truss",   { size: 1.0, tags: ["structure"], mass: 1.1, tint: "metal" }),
      P("st.isogrid",   "Isogrid Barrel Section",         "drum",    { size: 0.9, tags: ["structure"], mass: 2.0, spin: 0, tint: "light" }),
      P("st.bulkhead",  "Load-Bearing Bulkhead",          "hatch",   { size: 0.9, tags: INT, mass: 2.0 }),
      P("st.deck",      "Internal Deck Plate",            "hatch",   { size: 0.9, tags: INT, mass: 1.2 })
    ]},
    { id: "d05.envelope", name: "External envelope", parts: [
      P("st.plate",     "External Hull Plate",            "whipple", { size: 0.9, tags: ["armor"], mass: 1.0, tint: "light" }),
      P("st.whipple",   "Whipple / Multi-Shock Shield",   "whipple", { size: 0.9, tags: ["armor"], mass: 1.4, mirror: true }),
      P("st.fairing",   "Fairing / Closeout Panel",       "whipple", { size: 0.8, tags: ["armor"], mass: 0.5, tint: "panel" }),
      P("st.viewport",  "Armored Viewport",               "airlock", { size: 0.7, tags: ["habitat"], mass: 0.6 })
    ]},
    { id: "d05.mech", name: "Mechanisms", parts: [
      P("st.boom",      "Deployable Boom",                "truss",   { size: 1.2, tags: ["deploy", "structure"], mass: 0.5, optic: true }),
      P("st.hinge",     "Hinge / Damper / Latch Set",     "hatch",   { size: 0.6, tags: INT, mass: 0.2, lamp: "#ffb03a" }),
      P("st.sepbolt",   "Separation Bolt Ring",           "hatch",   { size: 0.8, tags: INT, mass: 0.4, lamp: "#ff4a5a", ring: true, hazard: true }),
      P("st.capture",   "Docking Capture Ring",           "dock",    { size: 1.0, tags: ["dock"], mass: 1.4, kind: "hard" })
    ]},
    { id: "d05.secondary", name: "Secondary structure", parts: [
      P("st.rack",      "Equipment Rack",                 "module",  { size: 0.7, tags: INT, mass: 0.5, tint: "metal" }),
      P("st.tray",      "Cable Tray Run",                 "torquer", { size: 0.8, tags: INT, mass: 0.2 }),
      P("st.standoff",  "MMOD Stand-off Frame",           "truss",   { size: 0.7, tags: ["armor"], mass: 0.3 })
    ]}
  ]
};
