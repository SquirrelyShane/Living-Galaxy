import { P } from "./_part.js";
/* 00 — SHIP IDENTITY & ARCHITECTURE
 * Hull-level decisions. Most rows are informational (they map to the Drydock
 * class/proportion controls); the mountable ones are spine and interface hardware. */
export default {
  id: "d00", name: "00 Ship Identity & Architecture",
  sheet: {
    materials: "Keel alloys (Al-Li, Ti-6Al-4V, HEA), CFRP/CNT composite spines",
    interfaces: "Every other domain hangs off the primary load path and the block interfaces",
    failures: "Load-path fatigue, interface misregistration between generations",
    industry: "Yard industry — assembly jigs, standards, certification",
    range: "Primary structure 10–25% of dry mass on efficient designs"
  },
  groups: [
    { id: "d00.form", name: "Hull form family", parts: [
      P("id.needle",   "Needle hull (scout / interceptor)",       null, { info: true, tags: ["hull"] }),
      P("id.torus",    "Torus hull (liner / habitat)",            null, { info: true, tags: ["hull"] }),
      P("id.cluster",  "Cluster hull (freighter / tanker)",       null, { info: true, tags: ["hull"] }),
      P("id.drum",     "Worldship drum (generation ship)",        null, { info: true, tags: ["hull"] }),
      P("id.barge",    "Mining barge (industrial block)",         null, { info: true, tags: ["hull"] })
    ]},
    { id: "d00.spine", name: "Keel / spine / primary load path", parts: [
      P("id.keelseg",  "Keel Truss Segment",                      "truss",  { size: 1.2, tags: ["structure"], mass: 1.4 }),
      P("id.spinebox", "Spine Load Box",                          "module", { size: 0.9, tags: ["structure"], mass: 2.6, tint: "metal" }),
      P("id.tankskirt","Tank Skirt Ring",                         "coilBank", { size: 0.9, tags: ["structure"], mass: 1.1 })
    ]},
    { id: "d00.iface", name: "Modular block & separation interfaces", parts: [
      P("id.blockport","Modular Block Interface Plate",           "hatch",  { size: 1.0, tags: ["structure"], mass: 0.6, lamp: "#7dffbe", ring: true }),
      P("id.sepplane", "Separation Plane (frangible joint)",      "hatch",  { size: 1.1, tags: ["structure"], mass: 0.8, lamp: "#ffb03a", hazard: true }),
      P("id.jettison", "Jettison Interface (pyro / pneumatic)",   "hatch",  { size: 0.7, tags: ["structure"], mass: 0.3, lamp: "#ff4a5a", hazard: true })
    ]},
    { id: "d00.kits", name: "Class kits", parts: [
      P("id.kit.scout",  "Scout kit — low mass, high Δv",         null, { info: true, tags: ["kit"] }),
      P("id.kit.liner",  "Liner kit — crew comfort, dual hull",   null, { info: true, tags: ["kit"] }),
      P("id.kit.warship","Combatant kit — power density, armor",  null, { info: true, tags: ["kit"] }),
      P("id.kit.miner",  "Miner kit — ISRU, factory, robots",     null, { info: true, tags: ["kit"] }),
      P("id.kit.gen",    "Generation kit — full ecology, culture",null, { info: true, tags: ["kit"] })
    ]}
  ]
};
