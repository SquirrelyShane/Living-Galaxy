/* Bills of materials.
 *
 *   partBom(part)         → { materialId: kg }
 *   moduleParts(module)   → [{ part, count }]
 *   moduleBom(module)     → { kg, materials, cr }
 *   stationBom(manifest)  → the whole station rolled up: parts by domain,
 *                           materials by kind, mass, power, heat, crew, cost
 */
import { PARTS, PART_DOMAINS } from "./parts.js";
import { MATERIALS, FAB_RATE } from "./materials.js";

/* Domains whose primary structural alloy (al_li) is swapped for the hull alloy the style rolled. */
const SKINNED = new Set(["st", "dk"]);
const SKINNED_PARTS = new Set(["sf.armour", "sf.sloped_plate", "sf.blast_door", "sf.barbette", "cg.bonded_hold", "cg.container"]);
export function partBom(p, alloy = null) {
  const out = {};
  const kg = p.mass * 1000;
  const swap = alloy && alloy !== "al_li" && (SKINNED.has(p.domain) || SKINNED_PARTS.has(p.id));
  for (const [m, share] of Object.entries(p.bom)) { const k = swap && m === "al_li" ? alloy : m; out[k] = (out[k] ?? 0) + kg * share; }
  return out;
}

export function partCost(p, alloy = null) {
  let cr = 0;
  for (const [m, kg] of Object.entries(partBom(p, alloy))) {
    const mat = MATERIALS[m];
    if (!mat) throw new Error(`unknown material ${m} on ${p.id}`);
    cr += (kg / 1000) * mat.cr * (FAB_RATE[mat.kind] ?? 2);
  }
  /* control, wiring and certification scale with the part's power handling */
  cr += Math.abs(p.pwr) * 120 + Math.abs(p.heat) * 40;
  return Math.round(cr);
}

export function moduleParts(mod) {
  return Object.entries(mod.parts).map(([id, count]) => {
    const part = PARTS[id];
    if (!part) throw new Error(`module ${mod.id} lists unknown part ${id}`);
    return { part, count };
  });
}

export function moduleBom(mod, alloy = null) {
  const materials = {};
  let kg = 0, cr = 0, pwr = mod.pwr ?? 0, heat = mod.heat ?? 0;
  for (const { part, count } of moduleParts(mod)) {
    for (const [m, g] of Object.entries(partBom(part, alloy))) { materials[m] = (materials[m] ?? 0) + g * count; kg += g * count; }
    cr += partCost(part, alloy) * count;
    if (!mod.pwr) pwr += part.pwr * count;
    if (!mod.heat) heat += part.heat * count;
  }
  return { kg, materials, cr, pwr, heat };
}

/** Whole-station roll-up over a manifest: [{ module, count }]. `alloy` is the hull alloy the structure is skinned in. */
export function stationBom(manifest, alloy = null) {
  const parts = {};          // partId → count
  const materials = {};      // materialId → kg
  const byDomain = {};       // domain → { label, parts: [{ id, name, count, mass, each }], mass, cr }
  const byKind = {};         // material kind → kg
  let kg = 0, cr = 0, pwr = 0, heat = 0, crew = 0, pop = 0, labour = 0;
  for (const { module: mod, count: n } of manifest) {
    const mb = moduleBom(mod, alloy);
    kg += mb.kg * n; cr += mb.cr * n; pwr += mb.pwr * n; heat += mb.heat * n; crew += mod.crew * n; pop += (mod.pop ?? 0) * n;
    for (const [m, g] of Object.entries(mb.materials)) materials[m] = (materials[m] ?? 0) + g * n;
    for (const { part, count } of moduleParts(mod)) parts[part.id] = (parts[part.id] ?? 0) + count * n;
  }
  for (const [id, count] of Object.entries(parts)) {
    const p = PARTS[id];
    const d = byDomain[p.domain] ??= { id: p.domain, label: PART_DOMAINS[p.domain] ?? p.domain, parts: [], mass: 0, cr: 0 };
    const each = partCost(p, alloy);
    d.parts.push({ id, name: p.name, count, mass: p.mass, each, pwr: p.pwr, heat: p.heat });
    d.mass += p.mass * count; d.cr += each * count;
  }
  for (const d of Object.values(byDomain)) d.parts.sort((a, b) => b.each * b.count - a.each * a.count);
  for (const [m, g] of Object.entries(materials)) { const k = MATERIALS[m].kind; byKind[k] = (byKind[k] ?? 0) + g; }
  labour = Math.round(cr * 0.22);
  /* what the station makes for itself from traded stock: drones, missiles, slugs, plate */
  const inhouse = {};
  for (const [id, count] of Object.entries(parts)) if (/\(in-house\)/.test(PARTS[id].name)) inhouse[id] = { name: PARTS[id].name.replace(" (in-house)", ""), count, mass: PARTS[id].mass * count, materials: partBom(PARTS[id], alloy) };
  const defence = manifest.filter((m) => m.module.tags.includes("defence")).map((m) => ({ id: m.module.id, name: m.module.name, count: m.count }));
  return {
    alloy, inhouse, defence,
    parts, partCount: Object.values(parts).reduce((a, b) => a + b, 0), partKinds: Object.keys(parts).length,
    materials, byKind, byDomain: Object.values(byDomain).sort((a, b) => b.cr - a.cr),
    massT: kg / 1000, cr: cr + labour, labour, pwr, heat, crew, pop,
  };
}
