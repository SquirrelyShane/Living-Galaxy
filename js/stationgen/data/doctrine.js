import { MODULES } from "./modules.js";
import { ARCHETYPES } from "./archetypes.js";
import { TIERS } from "./tiers.js";
import { moduleBom } from "./bom.js";

export function expand(list) {
  const out = {};
  for (const e of list) { const [id, n] = e.split("×"); out[id] = (out[id] ?? 0) + (n ? Number(n) : 1); }
  return out;
}

export function doctrineFor(archKey, tierKey, opts = {}) {
  const A = ARCHETYPES[archKey] ?? ARCHETYPES.tradehub;
  const T = TIERS[tierKey] ?? TIERS[A.tier];
  const lo = {};
  const fit = (id, n = 1) => { if (!MODULES[id]) throw new Error(`doctrine names unknown module ${id}`); lo[id] = (lo[id] ?? 0) + n; };
  fit(T.quarters, T.quartersN);
  fit("hb.mess", T.mess); fit("hb.kitchen", T.kitchens);
  fit("ls.core", T.life); fit("ls.air", T.life); fit("ls.chem", Math.max(1, Math.round(T.life * 0.75)));
  fit("wt.plant", T.water); fit("ag.farm", T.farms);
  fit("st.shelter", T.shelters); fit("sf.lifeboats", Math.ceil(T.lifeboats / 2));
  if (T.medical) fit("hb.medical", T.medical);
  if (T.commons) fit("hb.commons", T.commons);
  fit("cmd.deck"); fit("hb.brig"); fit("sc.rnd"); fit("cg.trading"); fit("mf.industrial");
  fit(archKey === "shipyard" || archKey === "habitat" ? "mf.shipyard" : "mf.fab");
  fit("dk.hangar", opts.hangars ?? A.hangars);
  fit("sf.pdc_cluster"); fit("sf.fire_control");
  for (const [id, n] of Object.entries(expand(A.doctrine))) fit(id, n);
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

export function manifestOf(lo) {
  const order = (m) => (m.tags.includes("hangar") ? 0 : m.mount.includes("drum") ? 1 : m.mount.includes("ring") && m.family === "hb" ? 2 : m.tags.includes("yard") ? 3 : m.family === "pw" ? 4 : 5 + (m.size[0] * m.size[2] > 1500 ? 0 : 1));
  return Object.entries(lo).map(([id, count]) => ({ module: MODULES[id], count })).sort((a, b) => order(a.module) - order(b.module) || b.module.size[0] * b.module.size[2] - a.module.size[0] * a.module.size[2]);
}
