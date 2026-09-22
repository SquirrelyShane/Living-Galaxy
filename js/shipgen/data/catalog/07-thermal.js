import { P, INT } from "./_part.js";
/* 07 — THERMAL CONTROL */
export default {
  id: "d07", name: "07 Thermal Control",
  sheet: {
    materials: "Al or Ti radiators, ammonia / propylene working fluids, gold or aluminized Kapton MLI",
    interfaces: "Cold plates on every hot box, pumped loops, radiator wings, cryocooler for sensors / SC",
    failures: "Radiator MMOD puncture, pump cavitation, louver jam, MLI tear",
    industry: "Radiator panel fabrication, heat-pipe charging lines, MLI layup",
    range: "Reject 1 kW to many MW; deployable wings dominate large ships"
  },
  groups: [
    { id: "d07.reject", name: "Radiators & louvers", parts: [
      P("tc.radwing",   "Deployable Radiator Wing",       "array",  { sun: "avoid", size: 1.2, tags: ["thermal", "deploy"], mass: 0.8, heat: -600, deploy: true, tint: "radiator", mirror: true }),
      P("tc.bodyrad",   "Body-Mounted Radiator",          "array",  { sun: "avoid", size: 1.0, tags: ["thermal"], mass: 0.6, heat: -250, tint: "radiator", mirror: true }),
      P("tc.louver",    "Louvered Radiator",              "louver", { sun: "avoid", size: 1.0, tags: ["thermal"], mass: 0.7, heat: -300, mirror: true }),
      P("tc.varem",     "Variable-ε Radiator",            "array",  { sun: "avoid", size: 1.0, tags: ["thermal", "deploy"], mass: 0.7, heat: -450, deploy: true, tint: "radiator", mirror: true })
    ]},
    { id: "d07.transport", name: "Heat pipes / pumped loops", parts: [
      P("tc.heatpipe",  "Loop Heat Pipe Network",         "hatch",  { size: 0.8, tags: INT, mass: 0.4, heat: -40 }),
      P("tc.pumploop",  "Pumped Two-Phase Loop",          "module", { size: 0.7, tags: ["thermal"], mass: 0.9, pwr: -4, heat: -120, tint: "metal", lamp: "#5fd0ff" }),
      P("tc.coldplate", "Cold Plate Bank",                "hatch",  { size: 0.7, tags: INT, mass: 0.3, heat: -30 })
    ]},
    { id: "d07.cryo", name: "Cryocoolers", parts: [
      P("tc.cryo",      "Cryocooler (sensors / SC)",      "module", { size: 0.6, tags: ["thermal"], mass: 0.6, pwr: -6, heat: -30, cold: true, lamp: "#bfe4ff" }),
      P("tc.zbo",       "Zero-Boil-Off Plant",            "module", { size: 0.9, tags: ["thermal", "fluids"], mass: 1.6, pwr: -15, heat: -60, cold: true, lamp: "#bfe4ff" }),
      P("tc.vcs",       "Vapor-Cooled Shield Wrap",       "mli",    { size: 0.9, tags: ["thermal"], mass: 0.2, heat: -10 })
    ]},
    { id: "d07.insul", name: "Insulation & buffers", parts: [
      P("tc.mli",       "MLI Blanket",                    "mli",    { size: 1.0, tags: ["thermal"], mass: 0.1, heat: -5 }),
      P("tc.aerogel",   "Aerogel / VIP Panel",            "whipple",{ size: 0.9, tags: ["thermal", "armor"], mass: 0.2, heat: -5, tint: "light" }),
      P("tc.pcm",       "Phase-Change Buffer",            "module", { size: 0.7, tags: ["thermal"], mass: 1.0, heat: -80, tint: "light" })
    ]}
  ]
};
