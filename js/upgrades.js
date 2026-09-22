/* LIVING GALAXY — refit upgrades.
 *
 * Bought at a yard whose sector lists them, owned per sky (they are bolted to
 * this hull, and a new sky is a new hull). Two kinds of effect: `mods` fold
 * into pilot.mods through pilot.setUpgradeMods like the crew bag does, so the
 * sim reads them from ship.mods with no new plumbing; `fx` are read where they
 * land — ship.js (reactor, battery, shield regen, thrust), sim.js (berths),
 * crew/robots.js (robot draw and wear), crew/duties.js (galley morale),
 * mission/run.js (the mission core). Contract: PLAN.md §4.8.
 */

import { currentShipId, sim } from "./sim.js";
import { shipById } from "./shipdb.js";
import { setUpgradeMods } from "./pilot.js";
import { shipFx } from "./ship.js";
import { MOD_KEYS, MOD_LABELS, defaultMods } from "./careers/effects.js";

/** { id, name, blurb, price, sector: [...], tier?: "A".."G", mods?: {…MOD_KEYS}, fx?: {...non-mod}, excludes?: [id] } */
export const UPGRADES = [
  /* ---- power and drive ---------------------------------------------------- */
  { id: "reactor_coil",  name: "Reactor coil II",        price: 4200, sector: ["industrial", "military"],     fx: { reactor: 1.10 },
    blurb: "A second coil pack on the core. Ten percent more on the bus at every trim." },
  { id: "reactor_bloom", name: "Bloom regulator",        price: 9800, sector: ["military"],  tier: "C",       fx: { reactor: 1.22, repair: -1 }, excludes: ["reactor_coil"],
    blurb: "Runs the core past its rated bloom. Twenty-two percent more on the bus, and the hull takes a point of wear a cycle for it." },
  { id: "battery_bank",  name: "Battery bank",           price: 3600, sector: ["industrial", "logistic"],     fx: { battery: 400 },
    blurb: "Four hundred more units in the cells. Longer burns, deeper reserve for the spool." },
  { id: "capacitor_farm", name: "Capacitor farm",        price: 8900, sector: ["industrial"], tier: "C",      fx: { battery: 1100, thrust: 0.96 },
    blurb: "Eleven hundred more units, and the racks weigh enough to cost four percent on the mains." },
  { id: "thrust_trim",   name: "Nozzle re-trim",         price: 3400, sector: ["industrial", "military"],     fx: { thrust: 1.12 }, mods: { gTol: 1.1 },
    blurb: "Wider throats on the mains: twelve percent more push, and you feel every bit of it." },
  { id: "inertial_gel",  name: "Inertial gel",           price: 4700, sector: ["civilian", "military"],       mods: { gTol: 0.7, hull: 1.04 },
    blurb: "Gel bladders behind the couches. A hard knock stops rattling the crew — and the frame." },

  /* ---- flight and nav ----------------------------------------------------- */
  { id: "warp_tuning",   name: "Warp coil tuning",       price: 6400, sector: ["industrial", "military"],     mods: { warp: 0.85 },
    blurb: "The spool comes up fifteen percent sooner." },
  { id: "hazard_baffle", name: "Hazard baffles",         price: 7200, sector: ["industrial", "logistic"], tier: "B", fx: { dropout: 0.6 },
    blurb: "Field baffles around the coil throat. A belt or a rock track is forty percent less likely to knock the core out mid-lane." },
  { id: "assist_servo",  name: "Assist servos",          price: 3100, sector: ["civilian", "logistic"],       fx: { assist: 1.4 },
    blurb: "Heavier RCS authority behind the flight assist — it dodges harder and trims tighter." },
  { id: "nav_core",      name: "Mission core",           price: 7500, sector: ["logistic", "military"],       fx: { missions: true },
    blurb: "A mission computer: multi-step plans, loops and conditions in the WORK editor." },
  { id: "conn_learner",  name: "Conn learning core",     price: 11000, sector: ["logistic", "military"], tier: "C", fx: { learn: 1.6, missions: true },
    blurb: "The conn watches how you fly and keeps the trace. Learns your habits sixty percent faster, and carries a mission computer." },

  /* ---- sensors and survey ------------------------------------------------- */
  { id: "sensor_mast",   name: "Long-range mast",        price: 3900, sector: ["civilian", "logistic"],       mods: { scan: 1.2, lock: 1.08 },
    blurb: "A longer mast for the survey set and a quicker lock." },
  { id: "phased_array",  name: "Phased array",           price: 8600, sector: ["military", "logistic"], tier: "B", mods: { scan: 1.45, lock: 1.3 }, fx: { resolve: 1.6 }, excludes: ["sensor_mast"],
    blurb: "Beam-steered instead of swept. Half again the survey range, a much faster lock, and contacts resolve on the nose in a third of the time." },
  { id: "assay_deck",    name: "Assay deck",             price: 5400, sector: ["industrial", "agricultural"], fx: { assay: true }, mods: { mine: 1.05 },
    blurb: "A proper mineralogy bench behind the lens: a locked rock reads out its full suite, class and in-situ value, not just its headline ore." },
  { id: "probe_rack",    name: "Deep probe rack",        price: 4900, sector: ["logistic", "civilian"],       fx: { probeRange: 1.5 },
    blurb: "Longer-legged probes and somewhere to keep them. Half again the reach on a remote scan." },

  /* ---- the cutter and the hold -------------------------------------------- */
  { id: "cutter_lens",   name: "Cutter lens",            price: 4800, sector: ["industrial"],                 mods: { mine: 1.12 }, fx: { minerRange: 150 },
    blurb: "A tighter lens on the mining laser: better yield and 150 u more reach." },
  { id: "cutter_array",  name: "Multi-head cutter",      price: 10400, sector: ["industrial"], tier: "C",     mods: { mine: 1.32, heat: 1.2 }, fx: { minerRange: 260 }, excludes: ["cutter_lens"],
    blurb: "Three heads off one core. A third more yield and far more reach — and it runs hot enough to notice." },
  { id: "cargo_racks",   name: "Cargo racking",          price: 3000, sector: ["logistic", "industrial"],     mods: { cargo: 1.15 },
    blurb: "Racking and tie-downs through the hold. Fifteen percent more fits." },
  { id: "hold_expansion", name: "Pressure-hold expansion", price: 9200, sector: ["logistic"], tier: "B",      mods: { cargo: 1.4, hull: 0.94 }, excludes: ["cargo_racks"],
    blurb: "A bulkhead moved. Forty percent more hold, and six percent less frame between you and the outside." },
  { id: "ore_sorter",    name: "Inline ore sorter",      price: 6100, sector: ["industrial"],                 fx: { smelt: 1.18 },
    blurb: "Grades and pre-concentrates at the intake, so a smelter gives you eighteen percent more back." },
  { id: "winch",         name: "Salvage winch",          price: 3300, sector: ["industrial"],                 mods: { salvage: 1.2 },
    blurb: "A heavier winch on the salvage tractor." },

  /* ---- the hull ------------------------------------------------------------ */
  /* 0.3.34 — the hull refits carry RESISTANCES now (js/defence.js), which is
   * additive percentage against a damage KIND rather than another multiplier
   * on the pool. Before this, the best armour in the game bought 0.9 seconds
   * against seven drones; plate is supposed to be the answer to being shot,
   * and now it is. Each of these is deliberately good at one thing and no
   * help at another, so a refit is a decision about what you expect to meet. */
  { id: "plating",       name: "Hardened plating",       price: 5600, sector: ["military", "industrial"],     mods: { hull: 1.15, gTol: 0.9 }, fx: { thrust: 0.97 },
    resist: { kinetic: 0.12, thermal: 0.03 },
    blurb: "Extra plate over the pressure hull. Tougher, steadier, twelve percent better against rounds — and three percent heavier on the mains." },
  { id: "ablative",      name: "Ablative jacket",        price: 4300, sector: ["military", "industrial"],     mods: { heat: 0.6 },
    resist: { thermal: 0.16 },
    blurb: "A sacrificial layer for close survey work and hot arrivals. Heat does forty percent less, and sixteen percent less again once it reaches the frame." },
  { id: "faraday_mesh",  name: "Faraday mesh",           price: 6100, sector: ["industrial", "military"], tier: "B", resist: { em: 0.18, shield_em: 0.06 },
    blurb: "A bonded mesh and a clean ground through the frame. Induced current — a hole's tides, an ion round, a bad arrival — does eighteen percent less." },
  { id: "screen_lattice", name: "Screen lattice",        price: 9400, sector: ["military", "energy"], tier: "C", resist: { shield_kinetic: 0.10, shield_thermal: 0.05 }, fx: { shieldRegen: 1.15 },
    blurb: "A standing lattice in the screen that gives it something to bite mass with. Shields stop ten percent of a round rather than none, and come back fifteen percent faster." },
  { id: "nanofoam",      name: "Nanofoam repair cells",  price: 8800, sector: ["industrial", "military"], tier: "B", fx: { repair: 2 },
    blurb: "Cells in the frame that close small breaches on their own. Two points of hull back every cycle, docked or not." },
  { id: "repair_drone",  name: "Hull-patch drone",       price: 6800, sector: ["industrial", "military", "logistic"], fx: { patchDrone: 0.6 },
    blurb: "A welding drone in a bay on your own hull. Once nothing has hit you for a few seconds it goes out and patches — on the ops bus while it works." },
  { id: "shield_cap",    name: "Shield capacitor",       price: 5200, sector: ["military"],                   fx: { shieldRegen: 1.45 },
    blurb: "The emitters recover half again as fast between hits." },
  { id: "turret_servo",  name: "Turret servos",          price: 4600, sector: ["military"],                   mods: { turret: 1.1 }, fx: { turretRange: 200 },
    blurb: "Faster servos on the mounts: quicker cycle and 200 u more reach." },

  /* ---- the people ---------------------------------------------------------- */
  { id: "quarters",      name: "Quarters refit",         price: 5000, sector: ["civilian", "industrial"],     fx: { berths: 2 },
    blurb: "Two more berths cut out of the stores." },
  { id: "spin_section",  name: "Spin section",           price: 12500, sector: ["civilian", "industrial"], tier: "C", fx: { berths: 5, moralePerCycle: 1 }, mods: { life: 1.15 },
    blurb: "A rotating ring with real gravity: five more berths and a happier crew — at fifteen percent more on life support." },
  { id: "galley",        name: "Mess galley",            price: 2800, sector: ["civilian", "agricultural"],   fx: { moralePerCycle: 1 },
    blurb: "Hot food. Every hand aboard gains a point of morale a cycle." },
  { id: "wardroom",      name: "Wardroom",               price: 6700, sector: ["civilian"], tier: "B",        fx: { moralePerCycle: 2, social: 1.35 },
    blurb: "Somewhere to sit that is not a duty station. Two morale a cycle, and shipboard friendships and courtships move a third faster." },
  { id: "scrubbers",     name: "Life-support scrubbers", price: 2400, sector: ["civilian", "agricultural"],   mods: { life: 0.75 },
    blurb: "Better scrubbers: life support draws a quarter less." },
  { id: "medbay",        name: "Medical bay",            price: 7400, sector: ["civilian", "agricultural"], tier: "B", fx: { medbay: true, moralePerCycle: 1 },
    blurb: "A real surgery instead of a kit on a bulkhead. Births and injuries aboard go well far more often, and the crew know it." },
  { id: "robot_bay",     name: "Robot charging bay",     price: 4100, sector: ["industrial"],                 fx: { robotDraw: 0.6, robotWear: 0.5 },
    blurb: "Proper cradles for the robot crew: they draw forty percent less and wear at half the rate." },
  { id: "robot_frames",  name: "Frame racks",            price: 6900, sector: ["industrial"],                 fx: { robotSlots: 2 },
    blurb: "Standing racks in the machine space: two robot frames that do not take a crew berth." },

  /* ---- the ledger ---------------------------------------------------------- */
  { id: "trade_uplink",  name: "Trade uplink",           price: 4500, sector: ["logistic", "civilian"],       mods: { sell: 1.03, buy: 0.97 },
    blurb: "Live exchange feeds at every desk. Three percent better both ways." },
  { id: "broker_suite",  name: "Broker suite",           price: 10800, sector: ["logistic"], tier: "C",       mods: { sell: 1.09, buy: 0.93, standing: 1.2 }, excludes: ["trade_uplink"],
    blurb: "A licensed broker's terminal and the standing that comes with holding one." },
  { id: "payroll_office", name: "Payroll office",        price: 5900, sector: ["civilian", "logistic"],       fx: { crewWage: 0.85 },
    blurb: "Wages filed through a company office instead of cash at the desk. Fifteen percent off the payroll, and nobody minds." },
  { id: "transponder",   name: "Civil transponder",      price: 3800, sector: ["civilian", "logistic"],       mods: { menace: 0.7, blame: 0.85 },
    blurb: "A clean civil squawk. Pirates size you up less often and the law is slower to blame you." },
  { id: "black_box",     name: "Ghost transponder",      price: 7600, sector: ["pirate", "military"], tier: "B", mods: { menace: 0.4, standing: 0.9, blame: 0.6 }, excludes: ["transponder"],
    blurb: "A transponder that answers whatever it likes. Almost nobody comes looking — and almost nobody vouches for you either." },
];

export const upgrades = { owned: [] };

export const UPGRADES_KEY = () => `lgaa.upgrades.v1:${sim.skySeed}:${sim.callsign}`;

/* fx keys that add up in units; every other numeric fx is a factor */
const ADDITIVE = new Set(["battery", "minerRange", "turretRange", "berths", "moralePerCycle", "robotSlots", "repair", "patchDrone"]);
const TIER_ORDER = "ABCDEFG";

export function hasUpgrade(id) {
  return upgrades.owned.includes(id);
}

function byId(id) {
  return UPGRADES.find((u) => u.id === id) ?? null;
}

/** Σ/Π of fx across owned (multiplicative for factors, additive for +units, OR for flags). */
export function fx(key, dflt) {
  let out = dflt;
  for (const id of upgrades.owned) {
    const v = byId(id)?.fx?.[key];
    if (v === undefined) continue;
    if (typeof v === "boolean") out = Boolean(out) || v;
    else if (ADDITIVE.has(key)) out = (out ?? 0) + v;
    else out = (out ?? 1) * v;
  }
  return out;
}

/** The hull's tier letter, for the tier gate; the trainer everyone starts in is an A. */
function hullTier() {
  return shipById(currentShipId())?.tier ?? "A";
}

/** → [{ ...u, blocker, owned }] — sector, credits, owned, hull tier, conflicts. */
export function upgradeOptions(st) {
  const sector = st?.sector ?? null;
  const credits = sim.ship?.credits ?? 0;
  return UPGRADES.map((u) => {
    const owned = hasUpgrade(u.id);
    let blocker = null;
    if (owned) blocker = "OWNED";
    else if (!sector || !u.sector.includes(sector)) blocker = `not fitted at a ${sector ?? "—"} yard`;
    else if (u.tier && TIER_ORDER.indexOf(hullTier()) < TIER_ORDER.indexOf(u.tier)) blocker = `needs a tier ${u.tier} hull`;
    else if (u.excludes?.some((x) => hasUpgrade(x))) blocker = `conflicts with ${byId(u.excludes.find((x) => hasUpgrade(x)))?.name}`;
    else if (credits < u.price) blocker = `short ${Math.ceil(u.price - credits).toLocaleString()} cr`;
    return { ...u, owned, blocker };
  });
}

/** → null | error. Bills the ship, files the upgrade, refreshes pilot.mods. */
export function buyUpgrade(id, st) {
  const u = byId(id);
  if (!u) return "No such upgrade";
  const opt = upgradeOptions(st).find((o) => o.id === id);
  if (opt.blocker === "OWNED") return "Already fitted";
  if (opt.blocker) return opt.blocker[0].toUpperCase() + opt.blocker.slice(1);
  sim.ship.credits -= u.price;
  upgrades.owned.push(id);
  applyMods();
  saveUpgrades();
  return null;
}

/** 50% back at any yard. → null | error */
export function sellUpgrade(id) {
  const u = byId(id);
  if (!u || !hasUpgrade(id)) return "Not fitted";
  upgrades.owned.splice(upgrades.owned.indexOf(id), 1);
  sim.ship.credits += Math.round(u.price * 0.5);
  applyMods();
  saveUpgrades();
  return null;
}

/** → the product of every owned upgrade's mods over MOD_KEYS (1 where nothing applies). */
export function upgradeMods() {
  const bag = defaultMods();
  for (const id of upgrades.owned) {
    for (const [k, v] of Object.entries(byId(id)?.mods ?? {})) if (MOD_KEYS.includes(k)) bag[k] *= v;
  }
  return bag;
}

/**
 * Fitted resistances, SUMMED rather than multiplied, and deliberately kept out
 * of the mods bag.
 *
 * The bag is a product over MOD_KEYS and `composeMods` walks it multiplying
 * numbers; a nested object in there would be multiplied as NaN by the first
 * race or career effect that touched it. Resists are their own thing, read
 * straight by js/sim.js when it sets the hull's defence.
 *
 * `shield_*` keys land on the screen rather than the plate — see resistsFor().
 */
export function upgradeResists() {
  const out = {};
  for (const id of upgrades.owned) {
    for (const [k, v] of Object.entries(byId(id)?.resist ?? {})) out[k] = (out[k] ?? 0) + v;
  }
  return out;
}

/** A stable string for the fitted resist set, so the sim can tell when it changed. */
export function resistKey() {
  return Object.entries(upgradeResists()).sort().map(([k, v]) => `${k}${v.toFixed(3)}`).join(",");
}

function applyMods() {
  setUpgradeMods(upgradeMods());
}

const FX_LINE = {
  reactor: (v) => `reactor ${pctOf(v)}`,
  battery: (v) => `battery +${v}`,
  shieldRegen: (v) => `shield regen ${pctOf(v)}`,
  minerRange: (v) => `cutter reach +${v} u`,
  thrust: (v) => `thrust ${pctOf(v)}`,
  missions: () => "mission plans",
  berths: (v) => `berths +${v}`,
  robotDraw: (v) => `robot draw ${pctOf(v)}`,
  robotWear: (v) => `robot wear ${pctOf(v)}`,
  moralePerCycle: (v) => `morale +${v}/cycle`,
  turretRange: (v) => `turret reach +${v} u`,
  robotSlots: (v) => `robot frames +${v}`,
  repair: (v) => (v >= 0 ? `hull +${v}/cycle` : `hull ${v}/cycle`),
  patchDrone: (v) => `hull +${v}/s in flight, off the ops bus`,
  dropout: (v) => `core dropouts ${pctOf(v)}`,
  assist: (v) => `assist authority ${pctOf(v)}`,
  resolve: (v) => `contact resolution ${pctOf(v)}`,
  probeRange: (v) => `probe reach ${pctOf(v)}`,
  smelt: (v) => `smelter return ${pctOf(v)}`,
  crewWage: (v) => `payroll ${pctOf(v)}`,
  social: (v) => `shipboard bonds ${pctOf(v)}`,
  learn: (v) => `the conn learns ${pctOf(v)} faster`,
  assay: () => "full mineral assay",
  medbay: () => "surgery aboard",
};

function pctOf(v) {
  const d = Math.round((v - 1) * 100);
  return `${d >= 0 ? "+" : ""}${d}%`;
}

/** "Mining yield +12% · cutter reach +150 u" for one upgrade. */
export function effectOf(u) {
  const bits = [];
  for (const [k, v] of Object.entries(u.mods ?? {})) bits.push(`${MOD_LABELS[k]?.label ?? k} ${pctOf(v)}`);
  for (const [k, v] of Object.entries(u.fx ?? {})) bits.push(FX_LINE[k] ? FX_LINE[k](v) : `${k} ${v}`);
  return bits.join(" · ");
}

/** → [{ id, name, effect }] for every owned upgrade. */
export function upgradeLines() {
  return upgrades.owned.map(byId).filter(Boolean).map((u) => ({ id: u.id, name: u.name, effect: effectOf(u) }));
}

export function saveUpgrades() {
  try { globalThis.localStorage?.setItem(UPGRADES_KEY(), JSON.stringify(upgrades.owned)); } catch { /* quota, or no window */ }
  return null;
}

/** Restores this sky's fit and pushes its mods into the pilot. Called by launchSim after resetCrew(). */
export function loadUpgrades() {
  let list = [];
  try {
    const raw = globalThis.localStorage?.getItem(UPGRADES_KEY());
    if (raw) list = JSON.parse(raw);
  } catch { list = []; }
  upgrades.owned.length = 0;
  for (const id of Array.isArray(list) ? list : []) if (byId(id) && !upgrades.owned.includes(id)) upgrades.owned.push(id);
  applyMods();
  return upgrades.owned;
}

/* ship.js reads its fx through this hook so it never has to import the sim */
shipFx.fx = fx;
