import { P, INT } from "./_part.js";
/* 16 — ROBOTICS, MAINTENANCE & SERVICING */
export default {
  id: "d16", name: "16 Robotics, Maintenance & Servicing",
  sheet: {
    materials: "Harmonic drives, carbon arms, blind-mate connectors, torque tools",
    interfaces: "MRU drawers on every rack, hull rails for crawlers, depot ports",
    failures: "Joint backlash, thermal bind, connector pin damage, lost tools",
    industry: "Space robotics lines, standardized MRU catalogs",
    range: "Arm reach m–tens of m; MRU swap minutes; crawler speed cm/s"
  },
  groups: [
    { id: "d16.internal", name: "Internal inspection robots", parts: [
      P("rb.freeflyer", "Internal Free-Flyer Dock",        "hatch",  { size: 0.6, tags: INT, mass: 0.2, pwr: -1, lamp: "#5fd0ff" }),
      P("rb.nde",       "NDE Inspection Head Rack",        "hatch",  { size: 0.6, tags: INT, mass: 0.2, lamp: "#ffb03a" })
    ]},
    { id: "d16.external", name: "Hull crawlers", parts: [
      P("rb.crawler",   "Hull Crawler Robot",              "crawler",{ size: 0.8, tags: ["industrial"], mass: 0.4, pwr: -1 }),
      P("rb.rail",      "Crawler Rail Segment",            "torquer",{ size: 1.0, tags: ["structure"], mass: 0.2 })
    ]},
    { id: "d16.arms", name: "Manipulator arms", parts: [
      P("rb.arm",       "Dexterous Manipulator Arm",       "grapple",{ size: 1.0, tags: ["industrial"], mass: 1.5, pwr: -4 }),
      P("rb.arm.heavy", "Heavy Grapple Arm",               "grapple",{ size: 1.3, tags: ["industrial", "mining"], mass: 3.0, pwr: -8 }),
      P("rb.tools",     "Tool Stowage & Torque Tools",     "container", { size: 0.6, tags: ["industrial"], mass: 0.3 })
    ]},
    { id: "d16.mru", name: "MRU swap systems", parts: [
      P("rb.mru",       "MRU Drawer Rack",                 "module", { size: 0.8, tags: ["industrial"], mass: 1.0, tint: "metal" }),
      P("rb.blindmate", "Blind-Mate Connector Field",      "hatch",  { size: 0.7, tags: INT, mass: 0.2, lamp: "#7dffbe", ring: true })
    ]},
    { id: "d16.depot", name: "On-orbit refuel / repair ports", parts: [
      P("rb.dronebay",  "Repair Drone Bay",                "bay",    { size: 1.0, tags: ["industrial", "deploy"], mass: 2.2, pwr: -4, deploy: true, drones: true }),
      P("rb.depotport", "Depot Servicing Port",            "umbilical", { size: 0.9, tags: ["dock", "industrial"], mass: 0.7, lamp: "#ffb03a" })
    ]}
  ]
};
