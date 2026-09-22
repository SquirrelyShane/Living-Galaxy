/* Class doctrine manifests — catalog ids with optional ×count.
 * Weapons are appended from the class arms mix at generate time (see app.js doctrineLoadout).
 * Mirrors PART III of the catalog: what each class kit must have, what it can minimise. */
import { RNG } from "../core/rng.js";
import { SHIP_CLASSES } from "./classes.js";
import { WEAPON_TYPES } from "./weapons.js";
import { WEAPON_PART } from "./catalog/index.js";

export const CORE = [
  "cd.fc", "cd.spacewire", "cd.rtos", "cd.hm", "cd.secure",
  "gn.fog", "gn.startrack", "gn.atomclock",
  "ep.hvdc", "ep.fault", "ep.switchgear",
  "tc.heatpipe", "tc.coldplate",
  "at.pressure", "at.relief",
  "sf.smoke", "sf.isolation", "sf.watchdog",
  "sw.shm", "sw.acoustic",
  "sd.railpattern", "sd.timesync",
  "acs.rcs×2", "cm.omni", "cm.beacon"
];
const CREW_BASIC = ["at.electrolysis", "at.sieve", "at.tcc", "at.fans", "wf.multifilt", "wf.condensate", "hb.cabins", "hb.hygiene", "ev.airlock", "sw.cabinair"];
const CREW_FULL  = [...CREW_BASIC, "at.sabatier", "wf.urine", "wf.solids", "hb.wardroom", "hb.medbay", "hb.exercise", "hb.shelter", "hb.circadian", "sf.safehaven", "wf.galley"];

export const CLASS_LOADOUT = {
  interceptor:   [...CORE, "ep.supercap", "cm.laser", "sw.lidar", "dk.hard", "st.whipple", "fl.xecopv", "acs.wheel"],
  fighter:       ["wp.mag.pdc", "wp.fcs", ...CORE, "ep.supercap", "cm.laser", "sw.radar", "sw.sar", "wp.tracker", "dk.hard", "st.whipple×2", "acs.cmg", "fl.xecopv", "sf.emp"],
  shuttle:       [...CORE, ...CREW_BASIC, "ep.battery", "cm.hga", "sw.radar", "dk.crew", "dk.cargo", "mt.ablator", "cg.gear", "tc.bodyrad", "fl.lox", "fl.lch4", "gn.altimeter", "cg.rack"],
  corvette:      ["wp.mag.pdc", "wp.fcs", ...CORE, ...CREW_BASIC, "pw.kilo", "ep.battery", "cm.hga", "cm.radome", "cm.omni", "sw.radar", "sw.scanhead×2", "wp.tracker", "dk.fuel", "tc.radwing×2", "acs.cmg", "st.whipple×2", "sf.debrisradar", "fl.xecopv", "ep.ppu"],
  frigate:       ["wp.mag.pdc", "wp.mag.missile", "wp.fcs", ...CORE, ...CREW_FULL, "pw.kilo", "ep.battery×2", "cm.hga", "cm.radome", "cm.laser", "cm.omni", "sw.radar", "sw.sar", "sw.scanhead×2", "wp.tracker", "dk.crew", "dk.fuel", "tc.radwing×2", "acs.cmg×2", "st.whipple×3", "sf.debrisradar", "rb.mru", "fl.xecopv×2", "ep.ppu"],
  destroyer:     ["wp.mag.rail", "wp.mag.pdc", "wp.mag.missile", "wp.coolant", "wp.fcs", "wp.chaff", ...CORE, ...CREW_FULL, "pw.mw", "ep.smes", "cm.hga", "cm.radome", "cm.laser", "sw.radar", "sw.sar", "sw.scanhead×3", "wp.tracker×2", "wp.ew", "dk.fuel", "tc.radwing×3", "acs.cmg×2", "st.whipple×4", "mt.boron×2", "sf.stealth×2", "sf.emp", "fl.lh2", "pw.brayton"],
  cruiser:       ["wp.mag.rail", "wp.mag.missile", "wp.cap", "wp.coolant", "wp.fcs", "wp.chaff", ...CORE, ...CREW_FULL, "pw.mw", "ep.smes", "ep.battery", "cm.hga.deep", "cm.radome", "cm.laser", "sw.radar", "sw.lidar", "sw.sar", "sw.scanhead×3", "wp.tracker×2", "dk.crew", "dk.cargo", "dk.fuel", "hb.gravring", "tc.radwing×3", "acs.cmg×2", "st.whipple×4", "rb.dronebay", "mf.printer", "cd.neuro", "fl.lh2", "pw.brayton", "cg.rack×2"],
  battleship:    ["wp.mag.rail×2", "wp.mag.missile×2", "wp.cap×2", "wp.coolant×2", "wp.fcs", "wp.chaff×2", "wp.mines", ...CORE, ...CREW_FULL, "pw.tokamak", "ep.smes×2", "cm.hga.deep", "cm.radome", "cm.laser", "sw.radar", "sw.sar×2", "sw.scanhead×4", "wp.tracker×3", "wp.ew", "dk.crew", "dk.cargo", "dk.fuel", "tc.radwing×4", "acs.cmg×3", "st.whipple×5", "mt.boron×3", "sf.emp", "rb.dronebay", "mf.ebeam", "pw.blanket", "fl.lh2×2"],
  carrier:       ["wp.mag.pdc", "wp.mag.missile", "wp.fcs", "wp.chaff×2", ...CORE, ...CREW_FULL, "pw.mw", "ep.smes", "ep.battery×2", "cm.hga.deep", "cm.radome", "cm.laser", "cm.relaybay", "sw.radar", "sw.lidar", "sw.scanhead×3", "wp.tracker×2", "dk.crew×2", "dk.cargo×2", "dk.fuel", "dk.tunnel", "wf.hydroponic", "hb.rec", "tc.radwing×4", "acs.cmg×3", "st.whipple×3", "rb.dronebay×2", "mf.printer", "rb.mru", "cg.container×2", "fl.lh2", "pw.brayton"],
  freighter:     [...CORE, ...CREW_BASIC, "pw.kilo", "ep.battery", "cm.hga", "cm.omni", "sw.radar", "sw.scanhead", "dk.cargo×3", "dk.fuel", "dk.hard", "dk.umbilical", "tc.radwing×2", "acs.cmg", "st.whipple×2", "rb.arm", "sf.debrisradar", "cg.container×4", "cg.rack×2", "cg.rfid", "fl.xecopv×2"],
  tanker:        [...CORE, ...CREW_BASIC, "pw.kilo", "ep.battery", "cm.hga", "sw.radar", "sw.scanhead", "dk.fuel×3", "dk.hard", "fl.umbilical×2", "fl.lh2×2", "fl.lox", "fl.he", "tc.zbo", "tc.radwing×2", "acs.cmg", "sf.debrisradar", "tc.cryo", "mt.waterwall"],
  explorer:      [...CORE, ...CREW_FULL, "pw.kilo", "pw.solar.film×2", "ep.battery", "cm.hga.deep", "cm.laser", "cm.radome", "cm.omni", "sw.radar", "sw.lidar", "gn.pulsar", "sw.ism", "sw.spectro", "sw.scanhead×2", "sw.telescope", "cg.scilab", "cg.interfero", "cg.lander", "cg.samplevault", "dk.crew", "dk.fuel", "wf.algae", "wf.hydroponic", "hb.greenhouse", "tc.radwing×2", "acs.cmg", "st.whipple", "cd.quantum", "gn.altimeter", "fl.xecopv×2"],
  miner:         [...CORE, ...CREW_BASIC, "cg.drill×3", "cg.intake", "cg.gear", "rb.arm.heavy", "cg.hopper×2", "cg.refinery", "mt.crusher", "mt.mre", "mf.furnace", "pw.kilo", "ep.battery", "cm.hga", "cm.radome", "cm.omni", "sw.lidar", "sw.radar", "sw.scanhead×2", "dk.cargo×3", "dk.fuel", "hb.shelter", "tc.radwing×3", "acs.cmg", "st.whipple×3", "sf.debrisradar", "mf.printer", "rb.dronebay", "rb.crawler×2", "cd.predict", "fl.water", "cg.container×2"],
  yacht:         [...CORE, ...CREW_BASIC, "pw.rtg", "ep.battery", "cm.hga", "cm.laser", "sw.radar", "sw.scanhead", "dk.fuel", "hb.wardroom", "hb.rec", "tc.radwing", "acs.cmg", "mt.morph×2", "st.viewport×2"],
  liner:         [...CORE, ...CREW_FULL, "pw.kilo", "ep.battery×2", "cm.hga", "cm.radome", "cm.omni×2", "sw.radar", "sw.scanhead", "dk.crew×2", "dk.cargo", "dk.fuel", "dk.tunnel", "hb.gravbearing", "wf.hydroponic×2", "hb.greenhouse", "hb.rec", "hb.culture", "tc.radwing×3", "acs.cmg×2", "st.whipple×2", "sf.debrisradar", "pw.solar.mj×2"],
  raider:        ["wp.mag.pdc", "wp.mag.missile", "wp.fcs", "wp.chaff", ...CORE, ...CREW_BASIC, "pw.kilo", "ep.supercap", "cm.laser", "sw.radar", "sw.scanhead", "wp.tracker", "dk.hard", "dk.fuel", "tc.bodyrad×2", "acs.cmg", "sf.stealth×3", "sf.emp", "fl.xecopv"],
  genship:       [...CORE, ...CREW_FULL, "pw.tokamak", "ep.smes", "cm.hga.deep", "cm.radome", "cm.laser", "sw.radar", "sw.lidar", "sw.telescope", "dk.crew×2", "dk.cargo×2", "dk.fuel", "dk.tunnel", "cg.genship", "wf.hydroponic×3", "wf.algae×2", "hb.greenhouse×2", "hb.culture", "cg.seedbank", "cg.livestock", "mf.printer", "rb.dronebay", "rb.crawler×2", "tc.radwing×4", "acs.cmg×3", "mt.polyshield×3", "mt.waterwall×2", "fl.lh2×2"],
  orb:           [...CORE, ...CREW_BASIC, "pw.solar.film×2", "ep.battery", "cm.hga", "cm.laser", "sw.radar", "sw.lidar", "sw.spectro", "sw.telescope", "gn.pulsar", "sw.scanhead×2", "cg.scilab", "cg.samplevault", "dk.crew", "dk.fuel", "tc.radwing×2", "acs.cmg", "fl.xecopv"],
  stationcutter: [...CORE, ...CREW_BASIC, "pw.kilo", "ep.battery", "cm.hga", "cm.radome", "cm.omni", "sw.radar", "sw.scanhead×2", "dk.cargo", "dk.hard×2", "dk.fuel", "dk.berth", "cg.gear", "tc.radwing×2", "acs.cmg", "st.whipple×2", "rb.arm", "rb.dronebay", "sf.debrisradar", "rb.tools", "fl.xecopv"]
};

/* class doctrine + arms mix → manifest for one hull */
export function doctrineLoadout(clsKey, cfg) {
  const C = SHIP_CLASSES[clsKey];
  const lo = expandLoadout(CLASS_LOADOUT[clsKey] || CORE);
  const weight = C.weapons === "none" ? "light" : C.weapons;
  let count = weight === "light" ? 2 : weight === "medium" ? 4 : weight === "heavy" ? 6 : 9;
  count = Math.max(0, Math.round(count * (cfg.armDensity ?? 1) * (0.5 + (cfg.complexity ?? 0.6))));
  const mix = (cfg.weaponSuite ?? "auto") === "auto" ? (C.weapons === "none" ? [] : C.arms)
            : cfg.weaponSuite === "mixed" ? Object.keys(WEAPON_TYPES) : [cfg.weaponSuite];
  const rng = new RNG(String(cfg.seed) + ":arms");
  for (let i = 0; i < count && mix.length; i++) { const id = WEAPON_PART[rng.pick(mix)]; lo[id] = (lo[id] || 0) + 1; }
  return lo;
}

export function expandLoadout(list) {
  const out = {};
  for (const e of list) { const [id, n] = e.split("×"); out[id] = (out[id] || 0) + (n ? Number(n) : 1); }
  return out;
}
