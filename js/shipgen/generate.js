import * as THREE from "three";
import { RNG } from "./core/rng.js";
import { StarshipBuilder } from "./builder/StarshipBuilder.js";
import { SHIP_CLASSES } from "./data/classes.js";
import { DRIVE_TYPES } from "./data/drives.js";
import { WEAPON_TYPES } from "./data/weapons.js";
import { FACTION_PALETTES } from "./data/palettes.js";
import { PARTS } from "./data/catalog/index.js";
import { doctrineLoadout, expandLoadout, CLASS_LOADOUT } from "./data/loadouts.js";
import { analyzeFlight } from "./data/flight.js";
import { shipBom } from "./data/bom.js";
import { newRegistry, collectInto, disposeShip } from "./anim.js";

export const DEFAULT_CFG = {
  seed: "1701",
  shipClass: "corvette",
  driveType: "auto",
  weaponSuite: "auto",
  designRegime: "auto",
  armDensity: 1,
  scale: 1,
  lengthBias: 1,
  beamBias: 1,
  complexity: 0.6,
  primary: "#93a4bd",
  secondary: "#3b465a",
  accent: "#9ceeff",
  engine: "#7df0ff",
  finish: "brushed",
  wings: true,
  weapons: true,
  greeble: true,
  lights: true,
  windows: true,
  sensors: true,
  scanners: true,
  mining: true,
  docking: true,
};

const TAG_GATES = [
  ["sensors",  ["sensor", "comm"]],
  ["scanners", ["scanner"]],
  ["mining",   ["mining"]],
  ["docking",  ["dock"]],
  ["weapons",  ["weapon", "launcher"]],
];

export function loadoutFor(cfg) {
  const raw = cfg.loadout ? { ...cfg.loadout } : doctrineLoadout(cfg.shipClass, cfg);
  const out = {};
  for (const [id, n] of Object.entries(raw)) {
    const p = PARTS[id];
    if (!p || n <= 0) continue;
    const isScanner = p.tags.includes("scanner");
    let drop = false;
    for (const [key, tags] of TAG_GATES) {
      if (cfg[key] !== false) continue;
      if (tags.includes("scanner") !== isScanner) continue;
      if (tags.some((t) => p.tags.includes(t))) drop = true;
    }
    if (!drop) out[id] = n;
  }
  return out;
}

export function normalizeConfig(opts = {}) {
  const cfg = { ...DEFAULT_CFG, ...opts };
  cfg.seed = String(cfg.seed ?? DEFAULT_CFG.seed);
  if (!SHIP_CLASSES[cfg.shipClass]) cfg.shipClass = DEFAULT_CFG.shipClass;
  for (const k of ["armDensity", "scale", "lengthBias", "beamBias", "complexity"]) cfg[k] = Number(cfg[k]);
  return cfg;
}

export function buildShip(opts = {}) {
  const { analyze = true, regime, builder: reuse, ...rest } = opts;
  const cfg = normalizeConfig(rest);
  cfg.loadout = loadoutFor(cfg);

  const builder = reuse || new StarshipBuilder();
  const root = builder.build(cfg);

  const anim = collectInto(newRegistry(), root);

  const stats = {
    className: SHIP_CLASSES[cfg.shipClass].label,
    seed: cfg.seed,
    drive: builder.drive,
    driveLabel: (DRIVE_TYPES[builder.drive] || {}).label || builder.drive,
    regime: builder.regimeKey,
    regimeLabel: builder.aero.label,
    size: builder.size,
    partCount: builder.partCount,
    lampCount: builder.lampCount || 0,
    docks: builder.docks.map((d) => d.kind),
    unmounted: builder.unmounted.length,
    weapons: [...new Set(builder.mounted.filter((m) => m.part.tags.includes("weapon")).map((m) => m.part.name))],
  };

  if (analyze) {
    stats.flight = analyzeFlight(builder, regime || builder.aero.analysis || "deep");
    stats.bom = shipBom(builder, PARTS, Object.values(PARTS).find((p) => p.drive === builder.drive) || null);
  }

  return { root, builder, cfg, anim, stats };
}

export function releaseShip(root) { return disposeShip(root); }

export function randomConfig(seed = Math.random().toString(36).slice(2), overrides = {}) {
  const rng = new RNG(String(seed));
  const classes = Object.keys(SHIP_CLASSES);
  const drives = Object.keys(DRIVE_TYPES);
  const arms = Object.keys(WEAPON_TYPES);
  const pal = FACTION_PALETTES[Math.floor(rng.next() * FACTION_PALETTES.length)];
  return {
    ...DEFAULT_CFG,
    seed: String(seed),
    shipClass: classes[Math.floor(rng.next() * classes.length)],
    driveType: rng.next() < 0.55 ? "auto" : drives[Math.floor(rng.next() * drives.length)],
    weaponSuite: rng.next() < 0.6 ? "auto" : (rng.next() < 0.5 ? "mixed" : arms[Math.floor(rng.next() * arms.length)]),
    scale: +rng.range(0.75, 1.45).toFixed(2),
    lengthBias: +rng.range(0.8, 1.3).toFixed(2),
    beamBias: +rng.range(0.8, 1.25).toFixed(2),
    complexity: +rng.range(0.45, 0.95).toFixed(2),
    armDensity: +rng.range(0.6, 1.6).toFixed(2),
    primary: pal.primary, secondary: pal.secondary, accent: pal.accent, engine: pal.engine,
    finish: pal.finish || "brushed",
    ...overrides,
  };
}

export function shipBounds(root) {
  const box = new THREE.Box3().setFromObject(root);
  const size = box.getSize(new THREE.Vector3());
  return { box, size, center: box.getCenter(new THREE.Vector3()), radius: Math.max(size.x, size.y, size.z) * 0.5 };
}

export { StarshipBuilder, SHIP_CLASSES, DRIVE_TYPES, WEAPON_TYPES, FACTION_PALETTES, PARTS, CLASS_LOADOUT, expandLoadout };
