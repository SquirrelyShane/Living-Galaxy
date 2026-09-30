import { SHIP_CLASSES, EQUIP_DEFAULT, CLASS_EQUIP } from "../shipgen/data/classes.js";
import { CLASS_LOADOUT, CORE, expandLoadout } from "../shipgen/data/loadouts.js";
import { PARTS, WEAPON_PART, CATALOG } from "../shipgen/data/catalog/index.js";
import { DRIVE_TYPES } from "../shipgen/data/drives.js";
import { RNG } from "../shipgen/core/rng.js";

const TIERS = "ABCDEFG";
const tierIx = (t) => Math.max(0, TIERS.indexOf(t));

const BODY_MAP = {
  sleek:      (ix) => (ix <= 0 ? "needle" : "sleek"),
  boxy:       () => "boxy",
  industrial: () => "industrial",
  layered:    () => "layered",
  barge:      () => "industrial",
  colossus:   () => "capital",
  hab:        (ix) => (ix <= 2 ? "curved" : ix <= 4 ? "layered" : "ring"),
  capital:    () => "capital",
  tug:        () => "boxy",
  truss:      () => "cargo",
  cradle:     () => "deck",
  cargo:      () => "cargo",
  refinery:   () => "industrial",
  tanks:      () => "tanks",
  spine:      () => "tanks",
  ring:       () => "ring",
  dome:       () => "curved",
  science:    () => "science",
  war:        () => "war",
};

const NOSE_MAP = {
  sensor: "sensor", cockpit: "cockpit", cabin: "cabin", bridge: "bridge", blunt: "blunt",
  armored: "armored", spike: "spike", industrial: "industrial",
  drillhead: "industrial", collar: "blunt", grapple: "industrial", ram: "armored", scoop: "blunt",
};

const WINGS = new Set(["stub", "none", "sponson", "solar", "swept", "delta", "fin"]);

const BASE_CLASS = {
  sleek:      (ix) => (ix <= 0 ? "interceptor" : ix <= 2 ? "yacht" : "corvette"),
  boxy:       (ix) => (ix <= 1 ? "shuttle" : "stationcutter"),
  industrial: () => "miner",
  layered:    (ix) => (ix <= 3 ? "corvette" : "frigate"),
  barge:      () => "freighter",
  colossus:   (ix, complex) => COLOSSUS_CLASS[complex] ?? "cruiser",
  hab:        (ix) => (ix <= 3 ? "explorer" : "liner"),
  capital:    (ix) => (ix <= 4 ? "cruiser" : "battleship"),
  tug:        () => "stationcutter",
  truss:      () => "freighter",
  cradle:     () => "carrier",
  cargo:      () => "freighter",
  refinery:   () => "miner",
  tanks:      () => "tanker",
  spine:      () => "tanker",
  ring:       () => "liner",
  dome:       () => "orb",
  science:    () => "explorer",
  war:        () => "destroyer",
};

const COLOSSUS_CLASS = {
  mining: "miner", healthcare: "liner", shipyard: "carrier", manufacturing: "carrier",
  logistics: "freighter", energy: "tanker", construction: "carrier", agriculture: "genship",
  research: "explorer", security: "battleship", navigation: "explorer", commerce: "liner",
  communications: "explorer", terraforming: "genship", salvage: "carrier", education: "liner",
  general: "cruiser",
};

const DRIVE_LADDER = {
  mining:         ["hydrogen", "pulse",  "pulse"],
  healthcare:     ["hydrogen",   "fusion", "fusion"],
  shipyard:       ["hydrogen", "ntr",    "fusion"],
  manufacturing:  ["hydrogen", "ntr",    "fusion"],
  logistics:      ["hydrogen", "ion",    "fusion"],
  energy:         ["ntr",      "ntr",    "antimatter"],
  construction:   ["hydrogen", "pulse",  "fusion"],
  agriculture:    ["hydrogen",   "ion",    "ion"],
  research:       ["hall",     "ion",    "plasma"],
  security:       ["hydrogen",   "fusion", "plasma"],
  navigation:     ["hall",     "hall",   "plasma"],
  commerce:       ["hydrogen",   "fusion", "antimatter"],
  communications: ["hall",     "ion",    "ion"],
  terraforming:   ["hydrogen", "ntr",    "fusion"],
  salvage:        ["hydrogen", "pulse",  "pulse"],
  education:      ["hydrogen",   "ion",    "fusion"],
  general:        ["hydrogen",   "fusion", "antimatter"],
};

const FINISH = {
  healthcare: "pearl", commerce: "chrome", education: "matte", research: "matte",
  security: "matte", salvage: "matte", mining: "matte", general: "brushed",
};

export const MODULE_PARTS = {
  dish:        ["cm.hga"],
  dishfarm:    ["cm.hga.deep", "cm.hga", "cm.phased"],
  antenna:     ["cm.omni", "cm.uhf"],
  mast:        ["sw.lidar", "sw.plasma"],
  beacon:      ["cm.beacon", "cm.blackbox"],
  drill:       ["cg.drill"],
  hopper:      ["cg.hopper"],
  scoop:       ["cg.intake"],
  silo:        ["cg.container"],
  tanks:       ["fl.lh2", "fl.lox"],
  pods:        ["cg.container"],
  racks:       ["cg.rack"],
  crane:       ["rb.arm"],
  gantry:      ["rb.arm.heavy", "st.boom"],
  magnet:      ["dk.berth", "rb.arm.heavy"],
  clamps:      ["dk.hard"],
  collar:      ["dk.crew"],
  cradle:      ["dk.berth", "dk.tunnel", "rb.dronebay"],
  radiators:   ["tc.radwing", "tc.radwing"],
  ring:        ["hb.gravring"],
  domes:       ["hb.greenhouse"],
  greenfins:   ["wf.hydroponic", "wf.algae"],
  lab:         ["cg.scilab", "sw.spectro"],
  printer:     ["mf.printer"],
  stacks:      ["cg.refinery", "mf.furnace"],
  spool:       ["ep.smes", "ep.supercap"],
  solar:       ["pw.solar.mj", "pw.solar.mj"],
  medcross:    ["hb.medbay", "mf.biofab"],
  floodlights: ["sw.debriscam"],
};

function reactorParts(reactor) {
  if (reactor <= 70) return ["pw.asrg", "ep.battery"];
  if (reactor <= 160) return ["pw.kilo", "ep.battery"];
  if (reactor <= 400) return ["pw.mw", "ep.smes"];
  if (reactor <= 700) return ["pw.mw", "pw.brayton", "ep.smes"];
  return ["pw.tokamak", "pw.blanket", "ep.smes"];
}

const ARMS_BAND = { none: [0, 0], light: [1, 3], medium: [3, 5], heavy: [5, 8], battery: [8, 12] };

export const GEN_MAX_LENGTH_M = 90;

const SPECS = new Map();

export function hullSpec(def) {
  const hit = SPECS.get(def.id);
  if (hit && hit.def === def) return hit;
  const spec = buildSpec(def);
  SPECS.set(def.id, spec);
  return spec;
}

function buildSpec(def) {
  const gr = def.grammar;
  const ix = tierIx(def.tier);
  const band = ix <= 1 ? 0 : ix <= 3 ? 1 : 2;
  const baseKey = (BASE_CLASS[gr.body] ?? BASE_CLASS.boxy)(ix, def.complex);
  const base = SHIP_CLASSES[baseKey];
  const classKey = `lg:${def.id}`;

  const Lm = def.dims[0] * 10;
  const k = Math.min(1, GEN_MAX_LENGTH_M / Lm);
  const dims = def.dims.map((d) => d * 10 * k);
  const jit = (v, j) => [v * (1 - j), v * (1 + j)];

  const cls = {
    label: def.name,
    regime: ix <= 0 ? "vleo" : "deep",
    length: jit(dims[0], 0.04), beam: jit(dims[1], 0.08), height: jit(dims[2], 0.08),
    nose: NOSE_MAP[gr.nose] ?? base.nose,
    body: (BODY_MAP[gr.body] ?? (() => base.body))(ix),
    engines: gr.engines.slice(),
    wings: WINGS.has(gr.wings) ? gr.wings : "none",
    weapons: gr.weapons ?? "none",
    arms: base.arms.slice(),
    drive: (DRIVE_LADDER[def.complex] ?? DRIVE_LADDER.general)[band],
    cargo: Math.min(4, Math.round(def.stats.cargo / 250)),
    dishes: base.dishes, towers: base.towers,
    registry: def.id, baseClass: baseKey,
  };
  if (!SHIP_CLASSES[classKey]) {
    SHIP_CLASSES[classKey] = cls;
    CLASS_EQUIP[classKey] = { ...EQUIP_DEFAULT, ...(CLASS_EQUIP[baseKey] ?? {}) };
    CLASS_LOADOUT[classKey] = CLASS_LOADOUT[baseKey] ?? CORE;
  }

  const lo = expandLoadout(CLASS_LOADOUT[baseKey] ?? CORE);
  for (const id of Object.keys(lo)) {
    const p = PARTS[id];
    if (!p) { delete lo[id]; continue; }
    if (p.tags.includes("reactor") || p.tags.includes("weapon")) delete lo[id];
  }
  const fit = (id, n = 1) => { if (PARTS[id]) lo[id] = (lo[id] ?? 0) + n; };
  for (const id of reactorParts(def.stats.reactor)) fit(id);
  for (const m of gr.modules ?? []) for (const id of MODULE_PARTS[m] ?? []) fit(id);
  if (def.stats.crew >= 8) fit("hb.cabins", Math.floor(def.stats.crew / 8));
  if (def.stats.crew >= 16) { fit("hb.wardroom"); fit("wf.galley"); }
  if (def.stats.crew >= 40) { fit("sf.safehaven"); fit("hb.rec"); }
  const stacks = Math.round(def.stats.cargo / 250) - (lo["cg.container"] ?? 0);
  if (stacks > 0) fit("cg.container", stacks);

  const [lo0, hi0] = ARMS_BAND[gr.weapons] ?? ARMS_BAND.none;
  const rng = new RNG(`${def.id}:arms`);
  const nArms = Math.max(def.stats.turrets, gr.weapons === "none" ? 0 : rng.int(lo0, hi0));
  const weapons = [];
  if (nArms > 0) {
    const mix = cls.arms.length ? cls.arms : ["pdc"];
    fit("wp.fcs"); fit("wp.tracker");
    for (let i = 0; i < nArms; i++) {
      const fam = rng.pick(mix);
      const id = WEAPON_PART[fam];
      fit(id);
      weapons.push(fam);
      const pf = PARTS[id]?.prefab ?? "";
      const once = (mag) => { if (!lo[mag]) fit(mag); };
      if (pf === "turret_pdc" || pf === "turret_auto" || pf === "turret_flak") once("wp.mag.pdc");
      if (pf === "turret_rail" || pf === "turret_coil") once("wp.mag.rail");
      if (pf === "vls" || pf === "torpedo") once("wp.mag.missile");
    }
  }

  const drivePart = Object.values(PARTS).find((p) => p.drive === cls.drive) ?? null;

  return {
    def, classKey, baseClass: baseKey,
    drive: cls.drive, driveLabel: DRIVE_TYPES[cls.drive]?.label ?? cls.drive, drivePart,
    regime: cls.regime,
    finish: FINISH[def.complex] ?? "brushed",
    loadout: lo,
    manifest: manifestOf(lo, drivePart),
    weapons,
    genScale: k,
  };
}

function manifestOf(lo, drivePart) {
  const sections = new Map();
  const push = (p, n) => {
    const key = p.domain ?? "zz";
    if (!sections.has(key)) sections.set(key, { id: key, name: p.cat ?? "Other", parts: [] });
    sections.get(key).parts.push({ id: p.id, name: p.name, count: n, mass: p.mass, pwr: p.pwr, tags: p.tags, prefab: p.prefab });
  };
  if (drivePart) push(drivePart, 1);
  for (const [id, n] of Object.entries(lo)) { const p = PARTS[id]; if (p && n > 0) push(p, n); }
  const order = new Map(CATALOG.map((c, i) => [c.id, i]));
  return [...sections.values()].sort((a, b) => (order.get(a.id) ?? 99) - (order.get(b.id) ?? 99));
}

export function manifestTotals(spec) {
  let count = 0, mass = 0, pwr = 0;
  for (const s of spec.manifest) for (const p of s.parts) { count += p.count; mass += p.mass * p.count; pwr += p.pwr * p.count; }
  return { count, mass, pwr };
}

export function genConfig(def, seed, opts = {}) {
  const spec = hullSpec(def);
  const drive = DRIVE_TYPES[spec.drive];
  const detail = opts.detail ?? "full";
  const lite = detail === "lite";
  return {
    seed: `${def.id}:${seed}`,
    shipClass: spec.classKey,
    driveType: spec.drive,
    designRegime: spec.regime,
    weaponSuite: "auto",
    loadout: lite ? liteLoadout(spec.loadout) : { ...spec.loadout },
    primary: opts.primary ?? "#8b94a3",
    secondary: opts.secondary ?? "#252b35",
    accent: opts.accent ?? "#7ce7ff",
    engine: opts.engine ?? drive?.hot ?? "#9fd4ff",
    finish: opts.finish ?? spec.finish,
    complexity: lite ? 0.25 : opts.complexity ?? 0.55,
    greeble: !lite, windows: !lite, lights: !lite,
    wings: true, weapons: true, sensors: true, scanners: true, mining: true, docking: true,
    analyze: opts.analyze ?? false,
  };
}

function liteLoadout(lo) {
  const out = {};
  for (const [id, n] of Object.entries(lo)) {
    const p = PARTS[id];
    if (!p) continue;
    if (p.tags.includes("internal") || p.prefab === "hatch" || p.prefab === "mli" || p.prefab === "whipple") continue;
    if (p.mass < 0.5 && !p.tags.includes("weapon")) continue;
    out[id] = Math.min(n, 2);
  }
  return out;
}

export function registerAll(defs) {
  for (const d of defs) hullSpec(d);
}
