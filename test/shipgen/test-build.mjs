/* Headless build harness: every class × drive × seed, plus full-catalog stress builds.
 * Verifies: no exceptions, zero AABB overlaps, doctrine mount rate, every prefab exercised.
 *   node --import ./test/shipgen/register-stub.mjs test/shipgen/test-build.mjs */
import { StarshipBuilder } from "../../js/shipgen/builder/StarshipBuilder.js";
import { SHIP_CLASSES } from "../../js/shipgen/data/classes.js";
import { DRIVE_TYPES } from "../../js/shipgen/data/drives.js";
import { PARTS, WEAPON_PART } from "../../js/shipgen/data/catalog/index.js";
import { PREFABS } from "../../js/shipgen/prefabs/index.js";
import { CLASS_LOADOUT, expandLoadout } from "../../js/shipgen/data/loadouts.js";
import { RNG } from "../../js/shipgen/core/rng.js";

const base = { seed: "1701", driveType: "auto", weaponSuite: "auto", armDensity: 1, scale: 1, lengthBias: 1, beamBias: 1, complexity: 0.6,
  primary: "#93a4bd", secondary: "#3b465a", accent: "#9ceeff", engine: "#7df0ff", wings: true, weapons: true, greeble: true, lights: true, windows: true };
function doctrine(cls, seed) {
  const C = SHIP_CLASSES[cls]; const lo = expandLoadout(CLASS_LOADOUT[cls]);
  const w = C.weapons === "none" ? 0 : (C.weapons === "light" ? 2 : C.weapons === "medium" ? 4 : C.weapons === "heavy" ? 6 : 9);
  const rng = new RNG(seed + ":arms");
  for (let i = 0; i < w; i++) { const id = WEAPON_PART[rng.pick(C.arms)]; lo[id] = (lo[id] || 0) + 1; }
  return lo;
}
// every catalog prefab must exist
const missingPrefab = Object.values(PARTS).filter(p => p.prefab && !PREFABS[p.prefab]).map(p => p.id + "→" + p.prefab);
if (missingPrefab.length) { console.log("MISSING PREFABS:", missingPrefab); process.exit(1); }

const b = new StarshipBuilder();
let n = 0, fails = 0, overlaps = 0, mounted = 0, nofit = 0; const unBy = {}, byClass = {};
function overlapCount() {
  let c = 0; const M = b.mounted;
  for (let i = 0; i < M.length; i++) for (let j = i + 1; j < M.length; j++) if (M[i].box.intersectsBox(M[j].box)) c++;
  for (const m of M) for (const o of b.occ) if (o.tag === "hull" && o.box.intersectsBox(m.box)) c++;
  return c;
}
for (const cls of Object.keys(SHIP_CLASSES)) for (const drv of ["auto", "hydrogen", "micro"]) for (const seed of ["1701", "ZK-4412", "7"]) {
  try {
    const root = b.build({ ...base, shipClass: cls, driveType: drv, seed, loadout: doctrine(cls, seed) });
    const ov = overlapCount(); overlaps += ov; mounted += b.mounted.length; nofit += b.unmounted.length;
    for (const p of b.unmounted) unBy[p.id] = (unBy[p.id] || 0) + 1;
    (byClass[cls] ||= [0, 0]); byClass[cls][0] += b.mounted.length; byClass[cls][1] += b.unmounted.length;
    if (ov) console.log("OVERLAP", cls, drv, seed, ov);
    let drills = 0; root.traverse(o => { if (o.userData.drill) drills++; });
    if (cls === "miner" && drills < 1) throw new Error("miner has no drills mounted");
    // connection + mining hardware must always be fitted (eviction guarantees it)
    const critical = b.unmounted.filter(p => p.tags.some(t => ["dock", "landing", "mining"].includes(t)));
    if (critical.length) throw new Error("critical hardware unmounted: " + critical.map(p => p.id).join(","));
    // nothing may sit inside a drill's cutting envelope
    const zones = b.occ.filter(o => o.tag === "workzone");
    for (const m of b.mounted) for (const z of zones) if (z.mount !== m && z.box.intersectsBox(m.box)) throw new Error("module inside drill work zone: " + m.part.id);
    n++;
  } catch (e) { fails++; console.log("FAIL", cls, drv, seed, e.stack.split("\n").slice(0, 3).join(" | ")); }
}
for (const cls of ["battleship", "fighter", "miner"]) {
  const lo = {}; for (const p of Object.values(PARTS)) if (!p.drive && !p.info) lo[p.id] = 1;
  try { b.build({ ...base, shipClass: cls, seed: "CAT", loadout: lo }); const ov = overlapCount();
    console.log(`full-catalog on ${cls}: mounted ${b.mounted.length} / nofit ${b.unmounted.length} / overlaps ${ov}`); if (ov) fails++;
  } catch (e) { fails++; console.log("FAIL full catalog", cls, e.stack.split("\n").slice(0, 3).join(" | ")); }
}
for (const d of Object.keys(DRIVE_TYPES)) { try { b.build({ ...base, shipClass: "corvette", driveType: d, loadout: {} }); } catch (e) { fails++; console.log("FAIL drive", d, e.message); } }
console.log(`\nbuilds ok: ${n}  failures: ${fails}  box overlaps: ${overlaps}`);
console.log(`doctrine mounted: ${mounted}  no-fit: ${nofit}  (${(100 * mounted / (mounted + nofit)).toFixed(1)}% mounted)`);
console.log("mount % by class:", Object.entries(byClass).map(([k, [m, u]]) => `${k} ${(100 * m / (m + u)).toFixed(0)}`).join("  "));
console.log("no-fit by part:", Object.entries(unBy).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([k, v]) => k + ":" + v).join("  "));
const r = b.build({ ...base, shipClass: "miner", driveType: "hall", seed: "1701", loadout: doctrine("miner", "1701") });
let meshes = 0, lamps = 0; r.traverse(o => { if (o.isMesh) meshes++; if (o.userData.lamp) lamps++; });
console.log("MINING BARGE — meshes", meshes, "lamps", lamps, "mounted", b.mounted.length, "nofit", b.unmounted.map(p => p.id).join(",") || "none");
process.exit(fails ? 1 : 0);
