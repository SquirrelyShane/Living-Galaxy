export const MOD_KEYS = [
  "life", "hull", "lock", "gTol", "heat", "scan",
  "mine", "turret", "sell", "buy", "cargo", "warp", "salvage",
  "standing", "blame", "menace",
];

export function defaultMods() {
  const m = {};
  for (const k of MOD_KEYS) m[k] = 1;
  return m;
}

export const MOD_LABELS = {
  life: { label: "Life support draw", up: false },
  hull: { label: "Hull integrity", up: true },
  lock: { label: "Lock speed", up: true },
  gTol: { label: "Impact shake", up: false },
  heat: { label: "Heat damage", up: false },
  scan: { label: "Survey range", up: true },
  mine: { label: "Mining yield", up: true },
  turret: { label: "Turret rate", up: true },
  sell: { label: "Sell prices", up: true },
  buy: { label: "Buy prices", up: false },
  cargo: { label: "Cargo capacity", up: true },
  warp: { label: "Warp spool time", up: false },
  salvage: { label: "Salvage rig and tractor", up: true },
  standing: { label: "Standing gains", up: true },
  blame: { label: "Standing losses", up: false },
  menace: { label: "Pirate demand range", up: false },
};

export const SPEC_EFFECTS = {
  belt_harvester: { mine: 1.15 },
  deep_core: { mine: 1.1, heat: 0.85 },
  exotic_extract: { mine: 1.08, sell: 1.06 },
  trauma: { hull: 1.1 },
  xenomedicine: { standing: 1.15 },
  cryo_revival: { life: 0.75 },
  augmetics: { gTol: 0.8, lock: 1.1 },
  capital_hulls: { hull: 1.15 },
  drive_yards: { warp: 0.85 },
  refit_stealth: { menace: 0.75, turret: 1.05 },
  microelectronics: { lock: 1.15, scan: 1.05 },
  structural_alloys: { hull: 1.12 },
  nanoline: { salvage: 1.15, buy: 0.95 },
  hazcargo: { cargo: 1.1, heat: 0.9 },
  coldsleep: { life: 0.8, cargo: 1.05 },
  colony_jit: { sell: 1.06, buy: 0.94 },
  fusion_watch: { warp: 0.9, hull: 1.05 },
  solar_radiator: { heat: 0.7 },
  exotic_power: { turret: 1.1, warp: 0.92 },
  spin_habitats: { gTol: 0.8 },
  regolith_print: { mine: 1.08, cargo: 1.05 },
  dock_arms: { salvage: 1.2 },
  hydroponics: { life: 0.7 },
  mycovats: { life: 0.8, sell: 1.03 },
  seed_vault: { standing: 1.2 },
  field_science: { scan: 1.25 },
  applied_lab: { mine: 1.06, turret: 1.06 },
  xeno_inquiry: { scan: 1.15, lock: 1.1 },
  customs: { blame: 0.8, buy: 0.96 },
  boarding: { turret: 1.15 },
  intel: { menace: 0.7, lock: 1.08 },
  tug_dock: { salvage: 1.25 },
  deep_lane: { warp: 0.8 },
  traffic_sphere: { lock: 1.2, standing: 1.05 },
  commodities: { sell: 1.08 },
  hull_finance: { buy: 0.92 },
  grey_market: { sell: 1.05, buy: 0.95, blame: 1.15 },
  relay_ops: { scan: 1.1, lock: 1.1 },
  crypto: { menace: 0.8 },
  newsnet: { standing: 1.2 },
  atmo_works: { heat: 0.85, life: 0.9 },
  insolation: { heat: 0.75 },
  biosphere: { life: 0.85, standing: 1.05 },
  live_wreck: { salvage: 1.2, hull: 1.05 },
  prize_law: { sell: 1.06, blame: 0.85 },
  rebuild: { hull: 1.1, salvage: 1.1 },
  sim_pits: { gTol: 0.85, lock: 1.05 },
  ticket_law: { standing: 1.1, blame: 0.9 },
  field_precept: { standing: 1.15 },
};

export const RACE_EFFECTS = {
  oberlin: { standing: 1.25 },
  sirrah: { blame: 0.75, menace: 0.7 },
};

export function composeMods(traits, raceId, specId) {
  const m = defaultMods();
  if (traits) {
    for (const k of ["life", "hull", "lock", "gTol", "heat", "scan"]) if (Number.isFinite(traits[k])) m[k] *= traits[k];
  }
  for (const src of [RACE_EFFECTS[raceId], specId ? SPEC_EFFECTS[specId] : null]) {
    if (!src) continue;
    for (const [k, v] of Object.entries(src)) if (k in m) m[k] *= v;
  }
  return m;
}

export function effectLines(src) {
  const out = [];
  for (const [k, v] of Object.entries(src ?? {})) {
    const L = MOD_LABELS[k];
    if (!L || Math.abs(v - 1) < 0.005) continue;
    const d = Math.round((v - 1) * 100);
    out.push({ key: k, label: L.label, value: `${d >= 0 ? "+" : ""}${d}%`, good: L.up ? d > 0 : d < 0 });
  }
  return out;
}
