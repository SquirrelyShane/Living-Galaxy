import { P, INT } from "./_part.js";
/* 08 — COMPUTING, AVIONICS & AUTONOMY (mostly internal → flush service hatches) */
export default {
  id: "d08", name: "08 Computing, Avionics & Autonomy",
  sheet: {
    materials: "Rad-hard ASICs, tantalum caps, latch-up-immune power switches",
    interfaces: "SpaceWire / TTE / TTP buses, remote interface units, every subsystem's telemetry",
    failures: "SEU/SEL, bit rot, bus babbling, software deadlock, thermal throttle",
    industry: "Rad-hard foundries, formal-methods software houses",
    range: "krad–Mrad hardness; triple modular redundancy on crewed ships"
  },
  groups: [
    { id: "d08.fc", name: "Flight computers", parts: [
      P("cd.fc",        "Rad-Hard Flight Computer (TMR)",  "hatch",  { size: 0.7, tags: INT, mass: 0.2, pwr: -1, heat: 1, lamp: "#5fd0ff" }),
      P("cd.fpga",      "FPGA / Payload Processor",        "hatch",  { size: 0.6, tags: INT, mass: 0.1, pwr: -2, heat: 2, lamp: "#cf8bff" }),
      P("cd.neuro",     "Neuromorphic AI Accelerator",     "module", { size: 0.6, tags: INT, mass: 0.4, pwr: -3, heat: 2, lamp: "#ff9ad5" }),
      P("cd.quantum",   "Quantum Co-Processor",            "module", { size: 0.6, tags: INT, mass: 0.6, pwr: -4, heat: -1, lamp: "#cf8bff", cold: true }),
      P("cd.memory",    "Mass Memory Vault",               "hatch",  { size: 0.6, tags: INT, mass: 0.2, pwr: -1, lamp: "#7dffbe" })
    ]},
    { id: "d08.bus", name: "Data buses", parts: [
      P("cd.spacewire", "SpaceWire Router",                "hatch",  { size: 0.5, tags: INT, mass: 0.05, pwr: -1, lamp: "#5fd0ff" }),
      P("cd.tte",       "Time-Triggered Ethernet Switch",  "hatch",  { size: 0.5, tags: INT, mass: 0.05, pwr: -1, lamp: "#7dffbe" }),
      P("cd.riu",       "Remote Interface Unit",           "hatch",  { size: 0.5, tags: INT, mass: 0.1, pwr: -1, lamp: "#ffb03a" })
    ]},
    { id: "d08.ai", name: "AI / autonomy stacks", parts: [
      P("cd.rtos",      "Space-Rated RTOS Core",           "hatch",  { size: 0.6, tags: INT, mass: 0.05, lamp: "#5fd0ff" }),
      P("cd.autonomy",  "Autonomy / Mission Executive",    "hatch",  { size: 0.6, tags: INT, mass: 0.05, pwr: -1, lamp: "#ff9ad5" }),
      P("cd.swarm",     "Swarm Coordination Node",         "hatch",  { size: 0.6, tags: INT, mass: 0.05, pwr: -1, lamp: "#7dffbe" })
    ]},
    { id: "d08.health", name: "Health management & security", parts: [
      P("cd.hm",        "Health-Management Agent",         "hatch",  { size: 0.6, tags: INT, mass: 0.05, pwr: -1, lamp: "#ffb03a" }),
      P("cd.predict",   "Predictive Maintenance AI",       "hatch",  { size: 0.6, tags: INT, mass: 0.05, pwr: -1, lamp: "#ffb03a" }),
      P("cd.secure",    "Secure Boot / Crypto Module",     "hatch",  { size: 0.5, tags: INT, mass: 0.05, lamp: "#ff4a5a" })
    ]}
  ]
};
