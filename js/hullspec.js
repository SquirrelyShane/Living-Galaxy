/* LIVING GALAXY — hull specification bridge.
 *
 * The fleet registry (shipdb.js) describes a hull the LIVING GALAXY way: a silhouette
 * grammar, working dimensions and the numbers the sim reads. The ship
 * generator (js/shipgen/, the NEWSHIPGEN extraction of ORBITAL YARD) builds
 * hulls its own way: a class, a doctrine, a drive family and a parts list
 * drawn from a 346-part catalogue.
 *
 * This module is the translation. For every registry def it derives:
 *
 *   - a synthetic generator class registered as `lg:<def.id>` — the
 *     def's own body / nose / wings / engine count / weapon weight in the
 *     generator's vocabulary, so the silhouette the registry promises is the
 *     silhouette the generator grows;
 *   - a drive family, a design regime and a livery finish;
 *   - the buildable parts list: the base class doctrine, re-fitted for the
 *     def's reactor, crew and turret count, plus one catalogue part (or a
 *     small set) for every module the grammar names. The list is a property
 *     of the def, not of the seed, so every Ore Sled carries the same
 *     manifest and the yard can price it before a single mesh exists.
 *
 * Everything here is pure data; nothing touches three.js.
 */

import { SHIP_CLASSES, EQUIP_DEFAULT, CLASS_EQUIP } from "./shipgen/data/classes.js";
import { CLASS_LOADOUT, CORE, expandLoadout } from "./shipgen/data/loadouts.js";
import { PARTS, WEAPON_PART, CATALOG } from "./shipgen/data/catalog/index.js";
import { DRIVE_TYPES } from "./shipgen/data/drives.js";
import { RNG } from "./shipgen/core/rng.js";

const TIERS = "ABCDEFG";
const tierIx = (t) => Math.max(0, TIERS.indexOf(t));

/* ---- grammar → generator vocabulary ------------------------------------ */

/* Registry bodies that the generator does not know, translated by tier. */
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
  dome:       () => "curved",   // the generator's sphere hull mounts almost nothing
  science:    () => "science",
  war:        () => "war",
};

const NOSE_MAP = {
  sensor: "sensor", cockpit: "cockpit", cabin: "cabin", bridge: "bridge", blunt: "blunt",
  armored: "armored", spike: "spike", industrial: "industrial",
  drillhead: "industrial", collar: "blunt", grapple: "industrial", ram: "armored", scoop: "blunt",
};

const WINGS = new Set(["stub", "none", "sponson", "solar", "swept", "delta", "fin"]);

/* Which generator class each registry body borrows its doctrine (base parts
 * list, glazing, arms mix) from. Colossus hulls are the G-tier flagships and
 * take their doctrine from the complex that commissions them. */
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

/* Drive family by complex, promoted with tier. Index into the list by tier
 * band: [A–B, C–D, E–G]. */
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

/* Registry module → catalogue parts. Each entry is the kit the yard fits for
 * that word in the grammar; a module named twice is fitted twice. */
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

/* Reactor plant by registry output (units/s). */
function reactorParts(reactor) {
  if (reactor <= 70) return ["pw.asrg", "ep.battery"];
  if (reactor <= 160) return ["pw.kilo", "ep.battery"];
  if (reactor <= 400) return ["pw.mw", "ep.smes"];
  if (reactor <= 700) return ["pw.mw", "pw.brayton", "ep.smes"];
  return ["pw.tokamak", "pw.blanket", "ep.smes"];
}

/* Weapon count band from the grammar word — the same bands the old forge used. */
const ARMS_BAND = { none: [0, 0], light: [1, 3], medium: [3, 5], heavy: [5, 8], battery: [8, 12] };

/* The generator sizes its parts against the hull, but clamps them to a
 * 0.75–2.4 m "bay". A 240 m colossus built at true scale would carry parts
 * the size of rivets, so hulls are grown no longer than this and scaled up
 * by the forge afterwards. */
export const GEN_MAX_LENGTH_M = 90;

/* ---- the spec ---------------------------------------------------------- */

const SPECS = new Map();

/** Generator-side description of a registry def. Cached per def id. */
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

  /* Dimensions: registry units are 10 m each. Grow at true scale up to the
   * cap, keeping the def's proportions. */
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

  /* ---- parts list ----------------------------------------------------- */
  const lo = expandLoadout(CLASS_LOADOUT[baseKey] ?? CORE);
  /* Strip what the registry overrides: the reactor plant and the arms. */
  for (const id of Object.keys(lo)) {
    const p = PARTS[id];
    if (!p) { delete lo[id]; continue; }
    if (p.tags.includes("reactor") || p.tags.includes("weapon")) delete lo[id];
  }
  const fit = (id, n = 1) => { if (PARTS[id]) lo[id] = (lo[id] ?? 0) + n; };
  for (const id of reactorParts(def.stats.reactor)) fit(id);
  for (const m of gr.modules ?? []) for (const id of MODULE_PARTS[m] ?? []) fit(id);
  /* Crew spaces scale with berths; the doctrine kits assume a handful. */
  if (def.stats.crew >= 8) fit("hb.cabins", Math.floor(def.stats.crew / 8));
  if (def.stats.crew >= 16) { fit("hb.wardroom"); fit("wf.galley"); }
  if (def.stats.crew >= 40) { fit("sf.safehaven"); fit("hb.rec"); }
  /* Cargo frames: one container stack per 250 m³ beyond what the kit fitted. */
  const stacks = Math.round(def.stats.cargo / 250) - (lo["cg.container"] ?? 0);
  if (stacks > 0) fit("cg.container", stacks);

  /* Arms: the grammar band, never fewer than the fitted mounts, rolled from
   * the base doctrine's arms mix on the def id — same manifest every seed. */
  const [lo0, hi0] = ARMS_BAND[gr.weapons] ?? ARMS_BAND.none;
  const rng = new RNG(`${def.id}:arms`);
  const nArms = Math.max(def.stats.turrets, gr.weapons === "none" ? 0 : rng.int(lo0, hi0));
  const weapons = [];
  if (nArms > 0) {
    const mix = cls.arms.length ? cls.arms : ["pdc"];
    /* Magazines and fire control come with the first mount. */
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

/* Ordered, sectioned view of a loadout for the yard and the registry page. */
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

/** Total fitted parts, mass (t) and net power (kW) of a spec's manifest. */
export function manifestTotals(spec) {
  let count = 0, mass = 0, pwr = 0;
  for (const s of spec.manifest) for (const p of s.parts) { count += p.count; mass += p.mass * p.count; pwr += p.pwr * p.count; }
  return { count, mass, pwr };
}

/** Build config for the generator: the spec plus a seed and the livery. */
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

/* Traffic and remote hulls keep the silhouette and the big fittings but drop
 * the sub-metre clutter so a dozen ships on screen stay cheap on a phone. */
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

/** Every registry def, warmed so SHIP_CLASSES knows all of them. */
export function registerAll(defs) {
  for (const d of defs) hullSpec(d);
}
