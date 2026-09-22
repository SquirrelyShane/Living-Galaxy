/* LIVING GALAXY experimental — the ice works.
 *
 * Ice in the hold is a rock. Water is a commodity, breathing gas is life, and
 * the clathrates carry methane, ammonia and nitrogen worth twice what the ice
 * sells for. The works is the drill bench that does the conversion, running
 * off the mining bus while you fly.
 *
 * Fit: the works needs drills. A hull whose grammar carries drill modules or
 * a drillhead nose qualifies on its own; otherwise every mining-complex hand
 * aboard counts as one hand drill on the bench. No drills, no works.
 *
 * Modes (AUX 4 on dash page 3, or the Cargo tab):
 *   MELT     water_ice → water (×0.9, the refine table's own number). While
 *            melting, if the cabin is pressurized and O2 is under the
 *            setpoint, a trickle of water is cracked to breathing gas —
 *            electrolysis roughly doubles the O2 recharge and burns ~0.03
 *            water/s. Deep-field endurance is a tank of snow.
 *   EXTRACT  gas ices → their gas: methane clathrate → methane (×0.75),
 *            ammonia ice → ammonia (×0.72), nitrogen ice → nitrogen (×0.8).
 *            Water ice is left alone in this mode.
 *
 * Throughput: 0.7 units/s per drill, × the pilot's `mine` modifier (race,
 * specialisation, a manned works on the deck). Draws 16 kW on the mining bus;
 * the bench pauses in a brownout rather than browning you out further.
 */

import { currentShipId, sim, logEvent } from "./sim.js";
import { addCargo } from "./ship.js";
import { shipById } from "./shipdb.js";
import { crew } from "./crew.js";
import { baseValue, goodName } from "./materials.js";

export const MODES = [
  { id: "off", label: "OFF", hint: "Bench cold." },
  { id: "melt", label: "MELT", hint: "Water ice to water; a trickle cracked to breathing gas." },
  { id: "gas", label: "EXTRACT", hint: "Clathrates to methane, ammonia, nitrogen." },
];

/* what each mode converts: [from, to, per] — `per` is the refine table's own ratio */
const RECIPES = {
  melt: [["water_ice", "water", 0.9]],
  gas: [
    ["methane_ice", "methane", 0.75],
    ["ammonia_ice", "ammonia", 0.72],
    ["nitrogen_ice", "nitrogen", 0.8],
  ],
};

const RATE_PER_DRILL = 0.7;   // units of ice per second
const DRAW_KW = 16;           // battery drain while the bench runs
const ELECTROLYSIS_WATER = 0.03; // water per second cracked for O2
const ELECTROLYSIS_O2 = 2.4;     // O2 points per second on top of life support

export const icework = {
  mode: "off",
  ran: 0,          // units processed this session (for the batch log)
  lastBatch: 0,
  product: "",     // last thing produced, for the AUX readout
};

/** Drills on the bench: the hull's own, or mining hands with hand drills. */
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

/** Called from the sim tick (sim seconds). */
export function stepIcework(dt) {
  const ship = sim.ship;
  /* billed on the mining bus by stepPower next tick — never straight off the battery */
  if (ship) { ship.benchDraw = 0; ship.benchOn = icework.mode !== "off"; }
  if (icework.mode === "off") return;
  if (!ship.powered?.mining) { icework.product = "MINING BUS COLD"; return; } // shed or vented
  if (ship.charge < 120) { icework.product = "LOW POWER"; return; } // wait out the brownout
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
    break; // one recipe at a time; the bench is small
  }

  /* electrolysis: melting crews crack a trickle of water into breathing gas */
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

/**
 * What one unit of an ore is worth to THIS ship: raw value, or the bench's
 * product value when the works is fitted and has a recipe for it. The
 * captain's forecaster prices icy fields with this.
 */
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

/** Dash AUX wiring + console access. Safe to call once from hud mount. */
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
