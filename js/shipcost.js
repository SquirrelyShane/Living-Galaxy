/* LIVING GALAXY — shipwright's estimate.
 *
 * Turns a registry def (shipdb.js) into an itemized bill the yard can build
 * from. The parts are the real ones: the catalogue manifest hullspec.js fits
 * for the hull (reactor plant, drive core, sensors, docks, every module the
 * grammar names, the turrets), each priced from its own bill of materials —
 * the generator's part → component → raw-material roll-up, with every raw
 * stock mapped onto a mineral the game's refineries actually sell.
 *
 * So a Claim Warden costs what its drill booms, ore hopper, kilopower plant
 * and pulse core cost in titanium, aluminium, copper and uranium at book
 * value, plus the frame and the yard's labour — and the same bill tells you
 * what to mine if you would rather bring the stock yourself.
 *
 * Exports keep their old shape: componentBill(def) → { lines, total } and
 * yardQuote(def, who) → the price this pilot pays.
 */

import { hullSpec, manifestTotals } from "./hullspec.js";
import { partBom, expandBom } from "./shipgen/data/bom.js";
import { PARTS } from "./shipgen/data/catalog/index.js";
import { MINERALS } from "./materials.js";

/* ---- raw stock bridge --------------------------------------------------- */
/* Generator raw material → game mineral. Anything unlisted falls to steel. */
export const STOCK_MAP = {
  "m.al_li": "aluminium", "m.al6061": "aluminium", "m.ti64": "titanium", "m.be": "titanium",
  "m.steel304": "stainless", "m.inconel": "superalloy", "m.hea": "superalloy", "m.metglass": "superalloy",
  "m.cu": "copper", "m.solder": "copper", "m.mo": "superalloy", "m.w": "superalloy", "m.ta": "superalloy", "m.nb": "superalloy",
  "m.cfrp": "carbon", "m.cnt": "carbon", "m.cc": "carbon", "m.activated_c": "carbon",
  "m.kevlar": "polymer", "m.kapton": "polymer", "m.ptfe": "polymer", "m.fkm": "polymer", "m.pe": "polymer",
  "m.epoxy": "polymer", "m.nafion": "polymer", "m.htpb": "polymer",
  "m.aerogel": "glass", "m.sapphire": "glass", "m.fused_si": "glass", "m.hepa": "glass",
  "m.bn": "ceramic", "m.alumina": "ceramic", "m.b4c": "ceramic", "m.sic": "ceramic", "m.zro2": "ceramic", "m.zeolite": "ceramic",
  "m.si": "silicon", "m.regolith": "silicon",
  "m.gaas": "rare_earths", "m.inp": "rare_earths", "m.gan": "rare_earths", "m.ndfeb": "rare_earths", "m.smco": "rare_earths",
  "m.nbti": "rare_earths", "m.rebco": "rare_earths", "m.lab6": "rare_earths", "m.lithium": "rare_earths",
  "m.li": "zinc", "m.amine": "organics", "m.pd": "platinum", "m.pt": "platinum",
  "m.water": "water", "m.lox": "water", "m.nh3": "ammonia", "m.hydrazine": "ammonia", "m.nak": "ammonia",
  "m.he": "hydrogen_r", "m.lh2": "hydrogen_r", "m.xe": "nitrogen", "m.lch4": "methane",
  "m.biomass": "organics", "m.nutrient": "organics", "m.pharma": "organics",
  "m.cermet": "uranium", "m.hale": "uranium", "m.pu238": "uranium", "m.he3": "helium3_r",
};

const MINERAL = new Map(MINERALS.map((m) => [m.id, m]));
/* credits per tonne of a mineral at book value (units are `mass` tonnes each) */
const perTonne = (id) => { const m = MINERAL.get(id) ?? MINERAL.get("steel"); return m.value / Math.max(0.05, m.mass); };

/* Working stock over raw: machining, testing, certification. Electronics and
 * nuclear parts carry more of it than a tank does. Tuned so the registry
 * prices out in the bands the economy was balanced against. */
const FAB = 2.6;
const DOMAIN_FAB = { d01: 1.4, d03: 1.6, d04: 1.3, d08: 2.2, d09: 2.0, d10: 1.7, d11: 1.9, d16: 1.4, d18: 1.5, d19: 1.5 };
const PRICE_K = 4.2;
/* Yard fit factor by tier. Small frames take catalogue parts at a discount
 * (entry hulls are fitted from the shelf); a colossus has every part sized
 * up to the hull. Tuned so each tier prices out where the economy — wages,
 * issue rates, starting scrip — was balanced. */
const FIT = { A: 0.5, B: 0.44, C: 0.36, D: 0.42, E: 0.56, F: 0.87, G: 1.08 };
const fitScale = (def) => FIT[def.tier] ?? 1;

const PART_PRICE = new Map();
/** Price of one catalogue part, and the raw stock (tonnes by mineral) behind it. */
export function partPrice(part) {
  const hit = PART_PRICE.get(part.id);
  if (hit) return hit;
  const stock = {};
  let raw = 0;
  if (!part.info) {
    const bom = expandBom(partBom(part));
    for (const [mat, kg] of Object.entries(bom.materials)) {
      const id = STOCK_MAP[mat] ?? "steel";
      const t = kg / 1000;
      stock[id] = (stock[id] ?? 0) + t;
      raw += t * perTonne(id);
    }
  }
  const power = Math.abs(part.pwr ?? 0) * 0.9;           // kW of switchgear, coolant and control
  const price = Math.round((raw * FAB * (DOMAIN_FAB[part.domain] ?? 1) + power + part.mass * 60) * PRICE_K);
  const out = { price, raw: Math.round(raw), stock };
  PART_PRICE.set(part.id, out);
  return out;
}

/* Hull frame: keel, skin, frames, decks — priced on the registry's dry mass
 * and length, as before, and given a stock split so the raw bill is whole. */
function frameLine(def) {
  const s = def.stats;
  const L = def.dims[0];
  const cost = s.massT * 14 + L * 120;
  const t = s.massT * 0.55; // structure share of dry mass; the fittings carry the rest
  return {
    label: "Hull frame", detail: `${Math.round(L * 10)} m keel, ${s.massT.toLocaleString()} t dry`, cost: Math.round(cost),
    section: "frame", parts: [],
    stock: { aluminium: t * 0.5, titanium: t * 0.2, stainless: t * 0.18, ceramic: t * 0.07, polymer: t * 0.05 },
  };
}

export const SECTION_LABEL = {
  d00: "Architecture", d01: "Propulsion", d02: "Fluids & stores", d03: "Power plant", d04: "Storage & distribution",
  d05: "Structure & mechanisms", d06: "Shielding & ISRU", d07: "Thermal", d08: "Computing", d09: "Guidance & nav",
  d10: "Communications", d11: "Sensors", d12: "Life support — air", d13: "Water, waste & food", d14: "Habitation",
  d15: "EVA & docking", d16: "Robotics", d17: "Cargo & payloads", d18: "Defence", d19: "Manufacturing", d20: "Interfaces",
};

const BILLS = new Map();

/**
 * The itemized bill. `lines` is one row per catalogue section (plus the
 * frame and the yard's labour) with `parts: [{ id, name, count, each }]`
 * behind it, so a panel can show the summary or unfold the whole manifest.
 * `stock` is the raw mineral bill in tonnes; `partCount` the fitted total.
 */
export function componentBill(def) {
  const hit = BILLS.get(def.id);
  if (hit && hit.def === def) return hit;
  const spec = hullSpec(def);
  const fit = fitScale(def);
  const lines = [frameLine(def)];
  const stock = { ...lines[0].stock };
  for (const sec of spec.manifest) {
    const parts = [];
    let cost = 0;
    for (const p of sec.parts) {
      const pp = partPrice(PARTS[p.id]);
      const each = Math.round(pp.price * fit);
      parts.push({ id: p.id, name: p.name, count: p.count, each, mass: p.mass, pwr: p.pwr });
      cost += each * p.count;
      for (const [id, t] of Object.entries(pp.stock)) stock[id] = (stock[id] ?? 0) + t * p.count;
    }
    const n = parts.reduce((a, p) => a + p.count, 0);
    const names = parts.map((p) => (p.count > 1 ? `${p.name} ×${p.count}` : p.name)).join(", ");
    lines.push({ label: SECTION_LABEL[sec.id] ?? sec.name, detail: `${n} fitted — ${names}`, cost: Math.round(cost), section: sec.id, parts });
  }
  const parts = lines.reduce((a, l) => a + l.cost, 0);
  const labour = Math.round(parts * 0.18);
  lines.push({ label: "Yard labour", detail: "18% of parts", cost: labour, section: "labour", parts: [] });
  const totals = manifestTotals(spec);
  const bill = {
    def, lines, total: parts + labour, stock,
    partCount: totals.count, fittedMass: totals.mass, netPower: totals.pwr,
    drive: spec.driveLabel, baseClass: spec.baseClass,
  };
  BILLS.set(def.id, bill);
  return bill;
}

/** The raw stock bill as rows the deck can print, heaviest first. */
export function stockLines(def) {
  const { stock } = componentBill(def);
  return Object.entries(stock)
    .map(([id, t]) => ({ id, name: MINERAL.get(id)?.name ?? id, tonnes: t, value: Math.round(t * perTonne(id)) }))
    .filter((r) => r.tonnes >= 0.05)
    .sort((a, b) => b.tonnes - a.tonnes);
}

/* Entry hulls were priced like flagships. Two corrections a real yard makes:
 * small frames are cheap to lay down (A/B tiers take a scale discount), and a
 * complex sells its own line to its own members at the issue rate.
 *
 * 0.3.59 — and then the ladder was too short. A mining career on the starter
 * made a D-tier hull in under an hour and a flagship in an afternoon, while
 * 0.3.52's holds made every size up worth more to own. Ships are the long game
 * now: the starter tier costs half again what it did, and each tier above it
 * climbs faster than the one below — a D is an evening's saving, an F a
 * company's, and a G is what corporations are for. (Tier: 0.3.58 → 0.3.59
 * multiplier on the part bill: A 0.55 → 0.8, B 0.7 → 1.6, C 0.85 → 2.6,
 * D 1 → 4.5, E 1 → 6.5, F 1 → 9, G 1 → 14.) */
export const TIER_SCALE = { A: 0.8, B: 1.6, C: 2.6, D: 4.5, E: 6.5, F: 9, G: 14 };
export const ISSUE_RATE = 0.45; // members pay 45% for hulls in their line, up to their rank

/**
 * What the yard actually charges this pilot.
 * @param def    registry def
 * @param who    { complexId, letter } — the buyer's complex and rank letter
 */
export function yardQuote(def, who = null) {
  const bill = componentBill(def);
  const scale = TIER_SCALE[def.tier] ?? 1;
  const list = Math.round(bill.total * scale);
  const order = "ABCDEFG";
  const inLine = who?.complexId && def.complex === who.complexId && order.indexOf(def.tier) <= order.indexOf(who.letter ?? "A");
  const total = inLine ? Math.round(list * ISSUE_RATE) : list;
  return { lines: bill.lines, parts: bill.total, list, total, inLine, scale, issueRate: inLine ? ISSUE_RATE : 1 };
}
