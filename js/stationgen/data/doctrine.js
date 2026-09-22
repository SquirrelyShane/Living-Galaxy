/* Doctrine: archetype + tier → the module manifest.
 *
 * The tier gives every station its habitation set (quarters, mess halls,
 * kitchens, life support, water, farms, shelters, lifeboats in proportion
 * to the people), the archetype adds what the place is for, and the list
 * the user asked for is always present: life support, air, chemical and
 * water plants, agriculture, R&D, a yard, industry, trading, command,
 * brig, mess, kitchens, quarters. Manufacturing archetypes get the big
 * yard; everyone else gets at least a fabrication bay so the "ship
 * manufacturing" line on the manifest is never empty. */
import { MODULES } from "./modules.js";
import { ARCHETYPES } from "./archetypes.js";
import { TIERS } from "./tiers.js";
import { moduleBom } from "./bom.js";

export function expand(list) {
  const out = {};
  for (const e of list) { const [id, n] = e.split("×"); out[id] = (out[id] ?? 0) + (n ? Number(n) : 1); }
  return out;
}

/** { moduleId: count } for an archetype at a tier, before the builder trims what does not fit. */
export function doctrineFor(archKey, tierKey, opts = {}) {
  const A = ARCHETYPES[archKey] ?? ARCHETYPES.tradehub;
  const T = TIERS[tierKey] ?? TIERS[A.tier];
  const lo = {};
  const fit = (id, n = 1) => { if (!MODULES[id]) throw new Error(`doctrine names unknown module ${id}`); lo[id] = (lo[id] ?? 0) + n; };
  /* the population set */
  fit(T.quarters, T.quartersN);
  fit("hb.mess", T.mess); fit("hb.kitchen", T.kitchens);
  fit("ls.core", T.life); fit("ls.air", T.life); fit("ls.chem", Math.max(1, Math.round(T.life * 0.75)));
  fit("wt.plant", T.water); fit("ag.farm", T.farms);
  fit("st.shelter", T.shelters); fit("sf.lifeboats", Math.ceil(T.lifeboats / 2));
  if (T.medical) fit("hb.medical", T.medical);
  if (T.commons) fit("hb.commons", T.commons);
  /* the always-present set */
  fit("cmd.deck"); fit("hb.brig"); fit("sc.rnd"); fit("cg.trading"); fit("mf.industrial");
  fit(archKey === "shipyard" || archKey === "habitat" ? "mf.shipyard" : "mf.fab");
  fit("dk.hangar", opts.hangars ?? A.hangars);
  /* no station goes unarmed: close-in defence at the least, and a mast to aim it */
  fit("sf.pdc_cluster"); fit("sf.fire_control");
  /* the archetype's own kit */
  for (const [id, n] of Object.entries(expand(A.doctrine))) fit(id, n);
  /* the balance sheet closes: generation covers draw with a fifth in hand,
   * radiators cover the heat. Solar for the quiet places, reactors where
   * there is already one. */
  const balance = () => { let pwr = 0, heat = 0; for (const [id, n] of Object.entries(lo)) { const b = moduleBom(MODULES[id]); pwr += b.pwr * n; heat += b.heat * n; } return { pwr, heat }; };
  const gen = lo["pw.reactor"] || lo["pw.fusion"] || lo["pw.kilo_bank"] ? (lo["pw.fusion"] ? "pw.fusion" : "pw.reactor") : "pw.solar";
  for (let i = 0; i < 12; i++) {
    const b = balance();
    const draw = -Object.entries(lo).reduce((a, [id, n]) => a + Math.min(0, moduleBom(MODULES[id]).pwr) * n, 0);
    if (b.pwr >= draw * 0.2) break;
    fit(gen);
  }
  fit("tc.radiators");
  for (let i = 0; i < 12; i++) { if (balance().heat <= 0) break; fit("tc.radiators"); }
  return lo;
}

/** [{ module, count }] in build order: big anchors first, masts last. */
export function manifestOf(lo) {
  const order = (m) => (m.tags.includes("hangar") ? 0 : m.mount.includes("drum") ? 1 : m.mount.includes("ring") && m.family === "hb" ? 2 : m.tags.includes("yard") ? 3 : m.family === "pw" ? 4 : 5 + (m.size[0] * m.size[2] > 1500 ? 0 : 1));
  return Object.entries(lo).map(([id, count]) => ({ module: MODULES[id], count })).sort((a, b) => order(a.module) - order(b.module) || b.module.size[0] * b.module.size[2] - a.module.size[0] * a.module.size[2]);
}
