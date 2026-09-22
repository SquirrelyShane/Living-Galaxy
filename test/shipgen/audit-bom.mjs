/* Deep BOM audit: every part resolves to raw materials, has structure AND fasteners, and its
 * bill weighs what the catalog says. Components must themselves be consistent. Hulls too.
 *   node --import ./test/shipgen/register-stub.mjs test/shipgen/audit-bom.mjs */
import { PARTS } from "../../js/shipgen/data/catalog/index.js";
import { MATERIALS, COMPONENTS } from "../../js/shipgen/data/materials.js";
import { partBom, expandBom, bomMass, hullBom, shipBom } from "../../js/shipgen/data/bom.js";
import { StarshipBuilder } from "../../js/shipgen/builder/StarshipBuilder.js";
import { SHIP_CLASSES } from "../../js/shipgen/data/classes.js";
import { CLASS_LOADOUT, expandLoadout } from "../../js/shipgen/data/loadouts.js";

let fails = 0; const warn = [];
// components
for (const [id, c] of Object.entries(COMPONENTS)) {
  let s = 0;
  for (const [k, q] of Object.entries(c.bom)) { if (MATERIALS[k]) s += q; else if (COMPONENTS[k]) s += q * COMPONENTS[k].kg; else { console.log("COMPONENT unresolved", id, k); fails++; } }
  if (Math.abs(s - c.kg) / c.kg > 0.15) { console.log("COMPONENT mass", id, c.kg, s.toFixed(2)); fails++; }
}
// cycles
const seen = new Set(); const stack = new Set();
function visit(id) { if (stack.has(id)) { console.log("CYCLE at", id); fails++; return; } if (seen.has(id)) return; stack.add(id); for (const k of Object.keys(COMPONENTS[id].bom)) if (COMPONENTS[k]) visit(k); stack.delete(id); seen.add(id); }
for (const id of Object.keys(COMPONENTS)) visit(id);
// parts
const used = new Set(); let n = 0, worst = 0, totalComps = 0, noFunc = [];
for (const p of Object.values(PARTS)) {
  if (p.info) continue; n++;
  const bom = partBom(p);
  const lines = Object.keys(bom); totalComps += lines.length;
  if (!lines.length) { console.log("EMPTY BOM", p.id); fails++; continue; }
  for (const c of lines) used.add(c);
  const hasFastener = lines.some(c => c.startsWith("c.bolt") || c === "c.rivet" || c === "c.weld_wire");
  const hasStructure = lines.some(c => /^c\.(plate_|frame_|truss_|honeycomb|cfrp_panel|tube_|whipple_layer|mli|bracket)/.test(c));
  const functional = lines.filter(c => !/^c\.(plate_|frame_|truss_|honeycomb|cfrp_panel|tube_|whipple_layer|mli|bracket|bolt|rivet|weld_wire|harness|standoff|metglass|adhesive|insert)/.test(c));
  if (!hasFastener) { console.log("NO FASTENERS", p.id); fails++; }
  if (!hasStructure) { console.log("NO STRUCTURE", p.id); fails++; }
  const structural = p.tags.some(t => ["structure", "armor"].includes(t)) || ["mli", "whipple", "truss", "shield"].includes(p.prefab);
  if (!functional.length && !structural) noFunc.push(p.id);
  const roll = expandBom(bom);
  const matMass = Object.values(roll.materials).reduce((s, v) => s + v, 0);
  const err = Math.abs(matMass - p.mass * 1000) / (p.mass * 1000);
  worst = Math.max(worst, err);
  // tolerance: 5%, or one 6 kg stock unit on very small parts (a 20 kg box cannot use half a plate)
  if (err > 0.05 && Math.abs(matMass - p.mass * 1000) > 6) { console.log("MASS MISMATCH", p.id, (p.mass * 1000).toFixed(0), "kg declared vs", matMass.toFixed(0)); fails++; }
  if (roll.fasteners < 50) { console.log("TOO FEW FASTENERS", p.id, roll.fasteners); fails++; }
}
if (noFunc.length) { console.log("NO FUNCTIONAL COMPONENTS (structure + fasteners only):", noFunc.join(", ")); fails += noFunc.length; }
const unused = Object.keys(COMPONENTS).filter(c => !used.has(c) && !["c.plate_hea", "c.honeycomb"].includes(c));
// hull BOMs
const b = new StarshipBuilder();
const base = { seed: "1701", driveType: "auto", weaponSuite: "auto", armDensity: 1, scale: 1, lengthBias: 1, beamBias: 1, complexity: 0.6,
  primary: "#93a4bd", secondary: "#3b465a", accent: "#9ceeff", engine: "#7df0ff", wings: true, weapons: true, greeble: true, lights: true, windows: true };
for (const cls of Object.keys(SHIP_CLASSES)) {
  b.build({ ...base, shipClass: cls, loadout: expandLoadout(CLASS_LOADOUT[cls]) });
  const h = hullBom(b); const roll = expandBom(h.bom);
  if (Object.keys(h.bom).length < 10 || roll.fasteners < 500) { console.log("THIN HULL BOM", cls); fails++; }
  if (cls === "miner") {
    const ship = shipBom(b, PARTS, Object.values(PARTS).find(p => p.drive === b.drive));
    const top = Object.entries(ship.materials).sort((a, c) => c[1] - a[1]).slice(0, 8).map(([k, v]) => `${MATERIALS[k].name} ${(v / 1000).toFixed(1)}t`).join(" · ");
    console.log(`MINING BARGE ship BOM: ${(ship.massKg / 1000).toFixed(0)} t of stock, ${ship.fasteners.toLocaleString()} fasteners, ${Object.keys(ship.components).length} component types\n  top materials: ${top}`);
  }
}
console.log(`\nparts audited: ${n}  components: ${Object.keys(COMPONENTS).length} (${unused.length} unused: ${unused.join(", ") || "none"})  materials: ${Object.keys(MATERIALS).length}`);
console.log(`avg BOM lines per part: ${(totalComps / n).toFixed(1)}  worst mass error: ${(worst * 100).toFixed(1)}%  failures: ${fails}`);
process.exit(fails ? 1 : 0);
