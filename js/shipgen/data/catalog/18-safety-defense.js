import { P, INT } from "./_part.js";
/* 18 — SAFETY, SURVIVABILITY & DEFENSE.
 * Weapon effectors are catalog-level only; construction detail is out of scope. */
export default {
  id: "d18", name: "18 Safety, Survivability & Defense",
  sheet: {
    materials: "Water-mist / inert suppressants, rapid isolation valves, EMP cages, tracking sensor optics",
    interfaces: "Every pressurized volume, collision-avoidance to GNC, defense suite to power bus",
    failures: "False alarms, valve hang-up, watchdog loops, effector overheating",
    industry: "Safety-critical systems houses; class-optional defense yards",
    range: "Isolation seconds; avoidance burns m/s; point-defense engagement km"
  },
  groups: [
    { id: "d18.fire", name: "Fire detection / suppression", parts: [
      P("sf.smoke",     "Smoke / CO / Flame Detector Net", "hatch",  { size: 0.5, tags: INT, mass: 0.05, lamp: "#ff4a5a" }),
      P("sf.suppress",  "Central Suppressant Manifold",    "hatch",  { size: 0.7, tags: INT, mass: 0.4, lamp: "#ff8a2a", hazard: true }),
      P("sf.extinguish","Portable Extinguisher Rack",      "hatch",  { size: 0.5, tags: INT, mass: 0.1, lamp: "#ff4a5a" })
    ]},
    { id: "d18.press", name: "Depress isolation", parts: [
      P("sf.isolation", "Rapid Isolation Valve Set",       "hatch",  { size: 0.7, tags: INT, mass: 0.4, lamp: "#ffb03a" }),
      P("sf.patch",     "Hull Patch Kit Locker",           "hatch",  { size: 0.5, tags: INT, mass: 0.1 }),
      P("sf.safehaven", "Safe-Haven Volume",               "module", { size: 1.0, tags: ["habitat", "safety"], mass: 4, tint: "dark", lamp: "#7dffbe" })
    ]},
    { id: "d18.collision", name: "Collision avoidance", parts: [
      P("sf.debrisradar","Debris Tracking Radar",          "sensorPod", { size: 0.7, tags: ["sensor", "scanner", "defense"], mass: 0.3, pwr: -4 }),
      P("sf.avoid",     "Avoidance-Burn Planner",          "hatch",  { size: 0.5, tags: INT, mass: 0.05, pwr: -1, lamp: "#5fd0ff" })
    ]},
    { id: "d18.harden", name: "Hardening & redundancy", parts: [
      P("sf.emp",       "EMP / ESD Hardening Cage",        "hatch",  { size: 0.8, tags: INT, mass: 0.6, lamp: "#ffb03a" }),
      P("sf.watchdog",  "Watchdog Power-Off Module",       "hatch",  { size: 0.5, tags: INT, mass: 0.05, lamp: "#ff4a5a" }),
      P("sf.stealth",   "Low-Observability Coating Panel", "whipple",{ size: 1.0, tags: ["armor", "defense"], mass: 0.4, tint: "stealth" })
    ]},
    { id: "d18.defense", name: "Point-defense & EW suite (class-dependent)", parts: [
      P("wp.tracker",   "Fire-Control Tracking Sensor",    "scanner",{ size: 0.8, tags: ["sensor", "scanner", "defense"], mass: 0.5, pwr: -5 }),
      P("wp.pdlaser",   "Point-Defense Laser",             "turret_beam",  { size: 0.7, tags: ["weapon", "defense", "turret"], mass: 1.2, pwr: -40, heat: 15, mirror: true }),
      P("wp.pdc",       "Point-Defense Cannon",            "turret_pdc",   { size: 0.6, tags: ["weapon", "turret", "defense"], mass: 1.0, pwr: -5, mirror: true }),
      P("wp.kinetic",   "Kinetic Interceptor Mount",       "turret_pdc",   { size: 0.8, tags: ["weapon", "defense", "turret"], mass: 1.0, pwr: -6, mirror: true }),
      P("wp.rail",      "Railgun Turret",                  "turret_rail",  { size: 1.3, tags: ["weapon", "turret"], mass: 6, pwr: -120, heat: 40, mirror: true }),
      P("wp.beam",      "Beam Turret",                     "turret_beam",  { size: 1.0, tags: ["weapon", "turret"], mass: 3, pwr: -90, heat: 50, mirror: true }),
      P("wp.plasma",    "Plasma Cannon",                   "turret_plasma",{ size: 1.2, tags: ["weapon", "turret"], mass: 5, pwr: -200, heat: 120, mirror: true }),
      P("wp.vls",       "Missile VLS Cell Block",          "vls",    { size: 1.1, tags: ["weapon", "launcher"], mass: 5, pwr: -3, mirror: true }),
      P("wp.torp",      "Torpedo Tubes",                   "torpedo",{ size: 1.4, tags: ["weapon", "launcher"], faces: ["port", "star", "bottom", "top"], mass: 7, pwr: -4, mirror: true }),
      P("wp.ew",        "Electronic Protection Suite",     "array",  { size: 0.8, tags: ["defense", "comm"], mass: 0.7, pwr: -20, heat: 6, tint: "dark", mirror: true }),
      P("wp.coil",      "Coilgun Turret",                  "turret_coil",     { size: 1.2, tags: ["weapon", "turret"], mass: 5, pwr: -140, heat: 45, mirror: true }),
      P("wp.auto",      "Autocannon Turret",               "turret_auto",     { size: 0.9, tags: ["weapon", "turret"], mass: 2.2, pwr: -8, heat: 6, mirror: true }),
      P("wp.flak",      "Flak Turret (proximity shells)",  "turret_flak",     { size: 1.0, tags: ["weapon", "turret", "defense"], mass: 2.8, pwr: -10, heat: 8, mirror: true }),
      P("wp.lance",     "Plasma Lance",                    "turret_lance",    { size: 1.3, tags: ["weapon", "turret"], mass: 7, pwr: -400, heat: 220, mirror: true }),
      P("wp.particle",  "Particle Beam",                   "turret_particle", { size: 1.3, tags: ["weapon", "turret"], mass: 9, pwr: -600, heat: 260, cold: true, mirror: true }),
      P("wp.ciws",      "Laser CIWS",                      "turret_ciws",     { size: 0.7, tags: ["weapon", "turret", "defense"], mass: 1.4, pwr: -60, heat: 20, mirror: true }),
      P("wp.kkv",       "Kinetic-Kill Interceptor Cells",  "vls",    { size: 1.0, tags: ["weapon", "launcher", "defense"], mass: 4, pwr: -3, ammo: "kkv", mirror: true }),
      P("wp.nuke",      "Nuclear Standoff Missile Cell",   "vls",    { size: 1.2, tags: ["weapon", "launcher"], mass: 8, pwr: -4, ammo: "nuke", mirror: true }),
      P("wp.emp",       "EMP Missile Cell",                "vls",    { size: 1.0, tags: ["weapon", "launcher"], mass: 4.5, pwr: -3, ammo: "emp", mirror: true }),
      P("wp.cluster",   "Cluster Munition Cell",           "vls",    { size: 1.1, tags: ["weapon", "launcher"], mass: 5, pwr: -3, ammo: "cluster", mirror: true }),
      P("wp.chaff",     "Chaff / Decoy Dispenser",         "chaff",  { size: 0.8, tags: ["defense", "launcher"], mass: 0.6, pwr: -1, mirror: true }),
      P("wp.mines",     "Drift-Mine Layer",                "minelayer", { size: 1.0, tags: ["weapon", "launcher"], mass: 6, pwr: -2 })
    ]},
    { id: "d18.ammo", name: "Magazines, ammunition & weapon support", parts: [
      P("wp.mag.rail",  "Railgun Slug Magazine",           "module", { size: 0.8, tags: ["weapon", "ammo"], mass: 3, tint: "dark", lamp: "#ffb03a" }),
      P("wp.mag.pdc",   "PDC / Autocannon Ammo Drum",      "drum",   { size: 0.7, tags: ["weapon", "ammo"], mass: 2.4, spin: 0, tint: "dark" }),
      P("wp.mag.missile","Missile Magazine & Autoloader",  "module", { size: 1.0, tags: ["weapon", "ammo"], mass: 6, pwr: -3, tint: "dark", lamp: "#ff4a5a" }),
      P("wp.mag.flak",  "Flak Shell Magazine",             "module", { size: 0.7, tags: ["weapon", "ammo"], mass: 2, tint: "dark", lamp: "#ffb03a" }),
      P("wp.ammo.slug", "Tungsten Slug Pallet (200)",      "container", { size: 0.7, tags: ["weapon", "ammo"], mass: 1.6 }),
      P("wp.ammo.shell","Cased Shell Pallet (2000)",       "container", { size: 0.7, tags: ["weapon", "ammo"], mass: 1.2 }),
      P("wp.ammo.missile","Missile Reload Canister (9)",   "container", { size: 0.9, tags: ["weapon", "ammo"], mass: 3.5 }),
      P("wp.cap",       "Laser Capacitor Bank",            "coilBank", { size: 0.9, tags: ["weapon", "storage"], mass: 2.5, heat: 10 }),
      P("wp.coolant",   "Weapon Coolant Loop",             "module", { size: 0.7, tags: ["weapon", "thermal"], mass: 1.2, pwr: -4, heat: -150, cold: true, lamp: "#bfe4ff" }),
      P("wp.fcs",       "Fire-Control Computer",           "hatch",  { size: 0.7, tags: ["weapon", "internal"], mass: 0.3, pwr: -2, lamp: "#ff4a5a" })
    ]}
  ]
};
