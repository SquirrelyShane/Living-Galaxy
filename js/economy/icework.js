import { currentShipId, sim, logEvent } from "../sim/sim.js";
import { addCargo } from "../flight/ship.js";
import { shipById } from "../ships/shipdb.js";
import { crew } from "../crew/ledger.js";
import { baseValue, goodName } from "./materials.js";

export const MODES = [
  { id: "off", label: "OFF", hint: "Bench cold." },
  { id: "melt", label: "MELT", hint: "Water ice to water; a trickle cracked to breathing gas." },
  { id: "gas", label: "EXTRACT", hint: "Clathrates to methane, ammonia, nitrogen." },
];

const RECIPES = {
  melt: [["water_ice", "water", 0.9]],
  gas: [
    ["methane_ice", "methane", 0.75],
    ["ammonia_ice", "ammonia", 0.72],
    ["nitrogen_ice", "nitrogen", 0.8],
  ],
};

const RATE_PER_DRILL = 0.7;
const DRAW_KW = 16;
const ELECTROLYSIS_WATER = 0.03;
const ELECTROLYSIS_O2 = 2.4;

export const icework = {
  mode: "off",
  ran: 0,
  lastBatch: 0,
  product: "",
};

export function iceworkFit() {
  const def = shipById(currentShipId());
  const mods = def?.grammar?.modules ?? [];
  const hullDrills = mods.filter((m) => m === "drill").length + (def?.grammar?.nose === "drillhead" ? 1 : 0);
  const handDrills = crew.aboard.filter((m) => m.complexId === "mining").length;
  const drills = hullDrills + handDrills;
  return {
    ok: drills > 0,
    drills,
    hullDrills,
    handDrills,
    why: drills > 0 ? `${hullDrills} bench drill${hullDrills === 1 ? "" : "s"}${handDrills ? `, ${handDrills} hand drill${handDrills === 1 ? "" : "s"}` : ""}` : "No drills aboard — a mining hull, or a miner in the crew.",
  };
}

export function cycleIceworkMode() {
  const fit = iceworkFit();
  if (!fit.ok) {
    sim.notice = `Ice works: ${fit.why}`;
    return icework.mode;
  }
  const i = MODES.findIndex((m) => m.id === icework.mode);
  icework.mode = MODES[(i + 1) % MODES.length].id;
  sim.ship.benchOn = icework.mode !== "off";
  const m = MODES.find((x) => x.id === icework.mode);
  sim.notice = `Ice works: ${m.label}. ${m.hint}`;
  logEvent(`Ice works set to ${m.label}`, "system");
  return icework.mode;
}

export function stepIcework(dt) {
  const ship = sim.ship;
  if (ship) { ship.benchDraw = 0; ship.benchOn = icework.mode !== "off"; }
  if (icework.mode === "off") return;
  if (!ship.powered?.mining) { icework.product = "MINING BUS COLD"; return; }
  if (ship.charge < 120) { icework.product = "LOW POWER"; return; }
  const fit = iceworkFit();
  if (!fit.ok) { icework.mode = "off"; ship.benchOn = false; return; }

  const rate = RATE_PER_DRILL * fit.drills * (ship.mods?.mine ?? 1);
  let worked = false;

  for (const [from, to, per] of RECIPES[icework.mode] ?? []) {
    const have = ship.hold[from] ?? 0;
    if (have <= 0.01) continue;
    const take = Math.min(have, rate * dt);
    ship.hold[from] = have - take;
    if (ship.hold[from] < 0.01) delete ship.hold[from];
    addCargo(ship, to, take * per);
    icework.ran += take;
    icework.product = goodName(to).toUpperCase();
    worked = true;
    ship.benchDraw = DRAW_KW;
    if (icework.ran - icework.lastBatch >= 25) {
      icework.lastBatch = icework.ran;
      logEvent(`Ice works: ${Math.round(icework.ran)} units through the bench — latest ${goodName(to)}`, "cargo");
    }
    break;
  }

  if (icework.mode === "melt" && ship.pressurized && ship.powered.lifeSupport !== false) {
    const water = ship.hold.water ?? 0;
    if (water > 0.01 && ship.o2 < (ship.tune?.o2Target ?? 100) - 0.5) {
      const use = Math.min(water, ELECTROLYSIS_WATER * dt);
      ship.hold.water = water - use;
      ship.o2 = Math.min(ship.tune?.o2Target ?? 100, ship.o2 + ELECTROLYSIS_O2 * dt * (use / (ELECTROLYSIS_WATER * dt || 1)));
      icework.product = worked ? icework.product : "O2 (ELECTROLYSIS)";
      worked = true;
    }
  }

  if (!worked) icework.product = icework.mode === "melt" ? "NO WATER ICE" : "NO GAS ICE";
}

export function benchValue(oreId) {
  const raw = baseValue(oreId);
  if (!iceworkFit().ok) return raw;
  for (const mode of ["melt", "gas"]) {
    for (const [from, to, per] of RECIPES[mode]) {
      if (from === oreId) return Math.max(raw, baseValue(to) * per);
    }
  }
  return raw;
}

export function resetIcework() {
  icework.mode = "off";
  if (sim.ship) sim.ship.benchOn = false;
  icework.ran = 0;
  icework.lastBatch = 0;
  icework.product = "";
}

export function wireIcework() {
  if (typeof document === "undefined") return;
  const btn = document.getElementById("aux-ice");
  const st = document.getElementById("aux-ice-st");
  if (btn) btn.addEventListener("click", () => cycleIceworkMode());
  if (btn && st) {
    setInterval(() => {
      if (sim.phase !== "play") return;
      const m = MODES.find((x) => x.id === icework.mode);
      st.textContent = icework.mode === "off" ? (iceworkFit().ok ? "READY" : "NO FIT") : icework.product || m.label;
      btn.classList.toggle("on", icework.mode !== "off");
    }, 600);
  }
  if (globalThis.window?.__lg) window.__lg.icework = { icework, iceworkFit, cycleIceworkMode, stepIcework };
}
