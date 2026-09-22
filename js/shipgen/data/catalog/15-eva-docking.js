import { P } from "./_part.js";
/* 15 — EVA, AIRLOCKS & DOCKING.  Collars carry kind: crew | cargo | fuel | hard */
export default {
  id: "d15", name: "15 EVA, Airlocks & Docking",
  sheet: {
    materials: "Al pressure hulls, elastomer seals, Ti bearings, ortho-fabric suit layers",
    interfaces: "Umbilicals (power, data, fluids), cabin pressure control, transfer tunnels to habitat",
    failures: "Hatch seal leak, suit puncture, bearing seize, capture misalignment",
    industry: "Mechanism shops, suit lines, pressure-vessel fabrication",
    range: "Airlock cycle minutes; suit duration 6–10 h; soft-capture ±10 cm / ±5°"
  },
  groups: [
    { id: "d15.airlock", name: "Airlocks & suitports", parts: [
      P("ev.airlock",   "Personnel Airlock",               "airlock",{ size: 1.0, tags: ["dock"], mass: 1.6, pwr: -1 }),
      P("ev.suitport",  "Suitport Pair",                   "airlock",{ size: 0.8, tags: ["dock"], mass: 0.9, pwr: -1 }),
      P("ev.pumpdown",  "Pump-Down & Gas Recovery",        "module", { size: 0.6, tags: ["life"], mass: 0.5, pwr: -3, tint: "metal" })
    ]},
    { id: "d15.suit", name: "Suits & PLSS", parts: [
      P("ev.suitrack",  "EVA Suit Stowage Rack",           "container", { size: 0.7, tags: ["habitat"], mass: 0.6 }),
      P("ev.plss",      "PLSS Recharge Station",           "hatch",  { size: 0.6, tags: ["life"], mass: 0.2, pwr: -1, lamp: "#7dffbe" })
    ]},
    { id: "d15.dock", name: "Docking rings & capture", parts: [
      P("dk.crew",      "Androgynous Crew Docking Collar", "dock",   { size: 1.0, tags: ["dock"], mass: 1.2, pwr: -1, kind: "crew" }),
      P("dk.cargo",     "Cargo Transfer Collar",           "dock",   { size: 1.0, tags: ["dock"], mass: 1.8, pwr: -1, kind: "cargo" }),
      P("dk.fuel",      "Refuel / Resupply Port",          "dock",   { size: 0.9, faces: ["stern", "port", "star", "bottom", "top"], tags: ["dock"], mass: 1.0, kind: "fuel" }),
      P("dk.hard",      "Hard-Mate Structural Interface",  "dock",   { size: 1.0, tags: ["dock"], mass: 1.4, kind: "hard" }),
      P("dk.berth",     "Robotic Berthing Mechanism",      "grapple",{ size: 0.9, tags: ["dock"], mass: 1.2, pwr: -3 })
    ]},
    { id: "d15.tunnel", name: "Transfer tunnels", parts: [
      P("dk.tunnel",    "Pressurized Transfer Tunnel",     "tunnel", { size: 1.0, tags: ["dock"], mass: 1.1 }),
      P("dk.umbilical", "Docking Umbilical Set",           "umbilical", { size: 0.8, tags: ["dock"], mass: 0.5 })
    ]}
  ]
};
