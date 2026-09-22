import { P, INT } from "./_part.js";
/* 01 — PROPULSION.  drive: rows select the main-drive family; the rest mount. */
export default {
  id: "d01", name: "01 Propulsion",
  sheet: {
    materials: "Mo / C-C grids, BN channel walls, SmCo/NdFeB cusps, Cu-alloy chamber liners, CERMET or carbide NTR fuel",
    interfaces: "HV power, xenon / LH2 lines, data bus, structural hardpoints, radiator straps, gimbal actuators",
    failures: "Grid sputter-through, cathode poisoning, channel erosion, injector burnout, turbine overspeed, control-drum jam",
    industry: "EDM/laser grid shops → vacuum cathode lines → rad-hard PPU fabs; turbopump shops; nuclear fuel fabrication",
    range: "Ion Isp 2.5–10k s @ 20 mN–1 N · Hall 1.5–3k s · chem 320–465 s @ kN–MN · NTR 850–1000 s"
  },
  groups: [
    { id: "d01.a", name: "01A Electric propulsion", parts: [
      P("prop.gridion",   "Gridded Ion Thruster",             null, { drive: "ion", tags: ["drive"], mass: 6, pwr: -180, heat: 40 }),
      P("prop.ion.cathode","Hollow Cathode (LaB6 / BaO-W)",   "module", { size: 0.5, tags: INT, mass: 0.2, pwr: -4, heat: 2, tint: "dark" }),
      P("prop.ion.anode", "Anode + Gas Distributor",          "hatch",  { size: 0.7, tags: INT, mass: 0.3, lamp: "#ffb03a" }),
      P("prop.ion.cusps", "Magnetic Cusp Rings",              "coilBank", { size: 0.7, tags: INT, mass: 0.8, pwr: -6 }),
      P("prop.ion.grids", "Grid Optics (screen / accel / decel)", "hatch", { size: 0.8, tags: INT, mass: 0.4, lamp: "#5fd0ff" }),
      P("prop.ion.ppu",   "Ion PPU (beam / discharge / neutralizer)", "module", { size: 0.7, tags: INT, mass: 0.9, pwr: -12, heat: 6, lamp: "#ffb03a" }),
      P("prop.ion.neut",  "Neutralizer Assembly",             "module", { size: 0.45, tags: INT, mass: 0.2, pwr: -2, heat: 1, tint: "metal" }),
      P("prop.hall",      "Hall-Effect Thruster",             null, { drive: "hall", tags: ["drive"], mass: 5, pwr: -140, heat: 35 }),
      P("prop.hall.channel","BN Annular Channel + Guard Rings","hatch", { size: 0.7, tags: INT, mass: 0.3 }),
      P("prop.hall.mag",  "Hall Magnetic Circuit",            "coilBank", { size: 0.65, tags: INT, mass: 0.7, pwr: -5 }),
      P("prop.feep",      "FEEP Emitter Array",               null, { drive: "micro", tags: ["drive"], mass: 1.5, pwr: -40, heat: 8 }),
      P("prop.colloid",   "Colloid / Electrospray Thruster",  null, { drive: "micro", tags: ["drive"], mass: 1.2, pwr: -30, heat: 6 }),
      P("prop.mpd",       "MPD Thruster",                     null, { drive: "plasma", tags: ["drive"], mass: 9, pwr: -900, heat: 220 }),
      P("prop.pit",       "Pulsed Inductive Thruster",        null, { drive: "pulse", tags: ["drive"], mass: 7, pwr: -400, heat: 90 }),
      P("prop.vasimr",    "VASIMR",                           null, { drive: "plasma", tags: ["drive"], mass: 11, pwr: -1200, heat: 260 }),
      P("prop.cluster",   "Cluster Frame & Gimbal Plate",     "truss",  { size: 1.0, tags: ["structure"], mass: 1.2, gantry: true })
    ]},
    { id: "d01.b", name: "01B Chemical / hybrid", parts: [
      P("prop.biprop",    "Liquid Bipropellant Main Engine",  null, { drive: "hydrogen", tags: ["drive"], mass: 8, pwr: -6, heat: 60 }),
      P("prop.turbopump", "Turbopump Set (fuel + ox)",        "drum",   { size: 0.7, tags: INT, mass: 1.4, pwr: -3, heat: 20, spin: 3.5, tint: "metal" }),
      P("prop.feedsys",   "Engine Feed / Purge Valve Block",  "module", { size: 0.6, tags: INT, mass: 0.5, tint: "metal", lamp: "#ffb03a" }),
      P("prop.srb",       "Solid Rocket Booster (strap-on)",  "srb",    { size: 1.0, faces: ["port", "star", "bottom"], tags: ["booster"], mass: 14, mirror: true }),
      P("prop.hybrid",    "Hybrid Motor Pod",                 "srb",    { size: 0.8, faces: ["port", "star", "bottom"], tags: ["booster"], mass: 8, mirror: true }),
      P("prop.ullage",    "Ullage Motor Pair",                "rcs",    { size: 0.8, tags: ["acs"], mass: 0.4, mirror: true })
    ]},
    { id: "d01.c", name: "01C Nuclear thermal", parts: [
      P("prop.ntr",       "NTR Core Module",                  null, { drive: "ntr", tags: ["drive"], mass: 18, pwr: 40, heat: 400 }),
      P("prop.ntr.drums", "Control Drum Actuators",           "coilBank", { size: 0.7, tags: INT, mass: 0.6, pwr: -2 }),
      P("prop.ntr.shield","NTR Shadow Shield",                "shield", { size: 0.9, faces: ["bottom", "top"], tags: ["armor"], mass: 4 }),
      P("prop.nep",       "Nuclear-Electric Hybrid String",   null, { drive: "ion", tags: ["drive"], mass: 16, pwr: 200, heat: 300 })
    ]},
    { id: "d01.d", name: "01D Fusion / high-energy", parts: [
      P("prop.fus.dhe3",  "Fusion Drive Core (D-He3)",        null, { drive: "fusion", tags: ["drive"], mass: 40, pwr: 900, heat: 1400 }),
      P("prop.fus.pb11",  "Fusion Drive Core (p-B11)",        null, { drive: "fusion", tags: ["drive"], mass: 46, pwr: 1100, heat: 1200 }),
      P("prop.antimatter","Antimatter-Catalyzed Drive",       null, { drive: "antimatter", tags: ["drive"], mass: 32, pwr: 400, heat: 1800 }),
      P("prop.warp",      "Warp Field Generator (research)",  null, { drive: "gravitic", tags: ["drive"], mass: 60, pwr: -5000, heat: 900 })
    ]},
    { id: "d01.e", name: "01E Beamed / sail / magnetic sail", parts: [
      P("prop.sail",      "Photon / Laser Sail (deployable)", "sail",   { sun: "seek", size: 1.2, faces: ["top", "bottom"], tags: ["deploy"], mass: 2 }),
      P("prop.magsail",   "Magnetic Sail Coil",               "coilBank", { size: 1.1, tags: ["deploy"], mass: 2.4, pwr: -30, cold: true }),
      P("prop.beamrx",    "Beam-Riding Receiver Panel",       "array",  { sun: "seek", size: 1.2, tags: ["power"], mass: 1.0, pwr: 200, tint: "dark", mirror: true })
    ]},
    { id: "d01.f", name: "01F Attitude control", parts: [
      P("acs.rcs",        "RCS Thruster Quad",                "rcs",    { size: 0.7, tags: ["acs"], mass: 0.4, mirror: true }),
      P("acs.rcs.dual",   "Dual-Mode RCS Pod",                "rcs",    { size: 0.85, tags: ["acs"], mass: 0.6, mirror: true }),
      P("acs.cmg",        "Control Moment Gyro",              "cmg",    { size: 0.8, tags: ["acs"], mass: 1.6, pwr: -3 }),
      P("acs.wheel",      "Reaction Wheel Assembly",          "cmg",    { size: 0.6, tags: ["acs"], mass: 0.5, pwr: -1, fast: true }),
      P("acs.torquer",    "Magnetorquer Rod",                 "torquer",{ size: 0.8, tags: ["acs"], mass: 0.3, pwr: -1 })
    ]}
  ]
};
