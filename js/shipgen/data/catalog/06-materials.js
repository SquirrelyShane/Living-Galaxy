import { P } from "./_part.js";
/* 06 — MATERIALS, SHIELDING & ISRU */
export default {
  id: "d06", name: "06 Materials, Shielding & ISRU",
  sheet: {
    materials: "Hydrogen-rich polymers, water walls, boron-loaded composites, ceramic tiles, self-healing resins, ISRU alloys",
    interfaces: "Storm shelter core, thermal protection to structure, regolith feed from mining rig",
    failures: "Shield cracking, hydrogen loss, tile debond, coil quench",
    industry: "Polymer extrusion, water-wall plumbing, asteroid foundry modules",
    range: "Water wall 10–40 g/cm² for solar-particle events; regolith throughput t/day class"
  },
  groups: [
    { id: "d06.rad", name: "Radiation mass shields", parts: [
      P("mt.polyshield","Hydrogen-Rich Polymer Shield",   "whipple",  { size: 1.0, tags: ["armor"], mass: 1.6, tint: "light" }),
      P("mt.waterwall", "Water-Wall Shield Tank",         "tank",     { size: 1.0, tags: ["armor"], mass: 4.0, tint: "light" }),
      P("mt.boron",     "Boron-Loaded Composite Panel",   "whipple",  { size: 0.9, tags: ["armor"], mass: 1.8, tint: "dark" }),
      P("mt.magcoil",   "Active Magnetic Shield Coil",    "coilBank", { size: 1.2, tags: ["armor"], mass: 3.0, pwr: -60, cold: true })
    ]},
    { id: "d06.tps", name: "Thermal protection", parts: [
      P("mt.tiles",     "Reusable Ceramic Tile Field",    "shield",   { size: 1.0, faces: ["bottom"], tags: ["armor"], mass: 1.5 }),
      P("mt.ablator",   "Ablative Entry Shield",          "shield",   { size: 1.2, faces: ["bottom"], tags: ["armor"], mass: 2.2 }),
      P("mt.hiecoat",   "High-ε Coating Panel",           "whipple",  { size: 0.8, tags: ["armor", "thermal"], mass: 0.3, heat: -20, tint: "dark" })
    ]},
    { id: "d06.skin", name: "Adaptive skins", parts: [
      P("mt.varem",     "Variable-Emissivity Film",       "whipple",  { size: 0.9, tags: ["armor", "thermal"], mass: 0.3, heat: -30, pwr: -1, tint: "accent" }),
      P("mt.selfheal",  "Self-Healing Resin Skin",        "whipple",  { size: 0.9, tags: ["armor"], mass: 0.5, lamp: "#7dffbe" }),
      P("mt.morph",     "Morphing Panel",                 "whipple",  { size: 0.9, tags: ["armor"], mass: 0.7, pwr: -2, tint: "accent" }),
      P("mt.living",    "Bio-Engineered Living Hull",     "whipple",  { size: 1.0, tags: ["armor", "experimental"], mass: 0.9, lamp: "#74ffb8", tint: "panel" })
    ]},
    { id: "d06.isru", name: "ISRU chain", parts: [
      P("mt.crusher",   "Crusher & Sorter",               "drum",     { size: 0.9, tags: ["mining", "industrial"], mass: 3, pwr: -25, heat: 10, spin: 0.8, tint: "dark" }),
      P("mt.mre",       "Molten-Regolith Electrolysis Cell","drum",   { size: 1.0, tags: ["mining", "industrial"], mass: 5, pwr: -150, heat: 200, spin: 0.15, hot: true }),
      P("mt.caster",    "Sintering / Casting Cell",       "module",   { size: 0.9, tags: ["industrial"], mass: 2.2, pwr: -40, heat: 60, lamp: "#ff8a2a" }),
      P("mt.blender",   "Alloy Blending Station",         "module",   { size: 0.8, tags: ["industrial"], mass: 1.4, pwr: -10, heat: 8, tint: "metal" })
    ]}
  ]
};
