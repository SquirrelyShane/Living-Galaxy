import { P, INT } from "./_part.js";
/* 10 — COMMUNICATIONS & NETWORKING */
export default {
  id: "d10", name: "10 Communications & Networking",
  sheet: {
    materials: "CFRP dishes, InP lasers, low-noise amplifiers, radiation-hard modems",
    interfaces: "Gimbal pointing from GNC, DTN storage, power for TWTAs / lasers",
    failures: "Pointing loss, dust on optics, amplifier degradation, buffer overflow on long delay",
    industry: "Antenna shops, photonics fabs, RF power lines",
    range: "RF kbps–hundreds of Mbps; optical Mbps–Gbps at interplanetary range with large apertures"
  },
  groups: [
    { id: "d10.rf", name: "RF high-gain and omni", parts: [
      P("cm.hga",       "High-Gain Parabolic Antenna",     "dish",   { size: 1.0, tags: ["comm", "sensor"], mass: 0.6, pwr: -4 }),
      P("cm.hga.deep",  "Deep-Space High-Gain Dish",       "dish",   { size: 1.5, tags: ["comm", "sensor"], mass: 1.4, pwr: -9 }),
      P("cm.phased",    "Phased-Array Panel",              "array",  { size: 0.9, tags: ["comm", "sensor"], mass: 0.9, pwr: -12, heat: 4, tint: "dark", mirror: true }),
      P("cm.omni",      "Low-Gain Omni Whip",              "mast",   { size: 0.8, tags: ["comm"], mass: 0.05 }),
      P("cm.uhf",       "UHF Proximity / EVA Antenna",     "mast",   { size: 0.6, tags: ["comm"], mass: 0.03 }),
      P("cm.radome",    "Navigation Radome",               "radome", { size: 1.0, tags: ["comm", "sensor"], mass: 0.8, pwr: -5 })
    ]},
    { id: "d10.optical", name: "Optical laser terminals", parts: [
      P("cm.laser",     "Optical Laser Comm Terminal",     "optic",  { size: 0.8, tags: ["comm"], mass: 0.3, pwr: -3, lamp: "#ff4a5a" }),
      P("cm.laser.lg",  "Large-Aperture Laser Terminal",   "optic",  { size: 1.2, tags: ["comm"], mass: 0.9, pwr: -8, lamp: "#ff4a5a" })
    ]},
    { id: "d10.net", name: "DTN routers & networks", parts: [
      P("cm.dtn",       "DTN Router & Store",              "hatch",  { size: 0.6, tags: INT, mass: 0.1, pwr: -1, lamp: "#5fd0ff" }),
      P("cm.mesh",      "Intra-Ship Fiber / Mesh Node",    "hatch",  { size: 0.5, tags: INT, mass: 0.05, lamp: "#7dffbe" }),
      P("cm.quantum",   "Quantum Key / Entanglement Node", "module", { size: 0.6, tags: ["comm", "experimental"], mass: 0.5, pwr: -6, heat: -2, lamp: "#cf8bff", cold: true }),
      P("cm.relaybay",  "Mesh-Relay Drone Bay",            "bay",    { size: 0.9, tags: ["comm", "deploy"], mass: 1.5, pwr: -2, deploy: true })
    ]},
    { id: "d10.beacon", name: "Emergency beacons", parts: [
      P("cm.beacon",    "Emergency Beacon",                "beacon", { size: 0.7, tags: ["comm", "safety"], mass: 0.1 }),
      P("cm.blackbox",  "Flight Recorder (ejectable)",     "beacon", { size: 0.6, tags: ["safety"], mass: 0.2, lamp: "#ff8a2a" })
    ]}
  ]
};
