/* Flight-performance sanity: every class × regime yields finite, plausible figures; optimiser never picks a worse hull.
 *   node --import ./test/shipgen/register-stub.mjs test/shipgen/test-flight.mjs */
import { StarshipBuilder } from "../../js/shipgen/builder/StarshipBuilder.js";
import { SHIP_CLASSES } from "../../js/shipgen/data/classes.js";
import { CLASS_LOADOUT, expandLoadout } from "../../js/shipgen/data/loadouts.js";
import { analyzeFlight, optimizeDrag, REGIMES } from "../../js/shipgen/data/flight.js";
const base = { seed: "1701", driveType: "auto", weaponSuite: "auto", armDensity: 1, scale: 1, lengthBias: 1, beamBias: 1, complexity: 0.6,
  primary: "#93a4bd", secondary: "#3b465a", accent: "#9ceeff", engine: "#7df0ff", wings: true, weapons: true, greeble: true, lights: true, windows: true };
const b = new StarshipBuilder(); let fails = 0;
const rows = [];
for (const cls of Object.keys(SHIP_CLASSES)) {
  b.build({ ...base, shipClass: cls, loadout: expandLoadout(CLASS_LOADOUT[cls]) });
  for (const rk of Object.keys(REGIMES)) {
    const f = analyzeFlight(b, rk);
    for (const k of ["mass", "frontal", "dragArea", "cd", "beta", "heatWcm2", "thrustN", "tw", "etaP", "staticMargin"]) if (!Number.isFinite(f[k])) { console.log("NON-FINITE", cls, rk, k, f[k]); fails++; }
    if (f.cd < 0.2 || f.cd > 3) { console.log("CD out of range", cls, rk, f.cd.toFixed(2)); fails++; }
    if (rk === "vleo") rows.push(`${cls.padEnd(14)} Cd ${f.cd.toFixed(2)}  CdA ${f.dragArea.toFixed(0).padStart(5)} m²  β ${f.beta.toFixed(0).padStart(6)}  life ${f.lifetimeDays.toFixed(1).padStart(6)} d  Isp ${String(f.isp).padStart(6)}  T/W ${f.tw.toFixed(2).padStart(6)}  SM ${(f.staticMargin * 100).toFixed(0).padStart(4)}%  ${f.notes.length} notes`);
  }
}
console.log(rows.join("\n"));
// optimiser on the barge: never worse, volume floor honoured
const scratch = new StarshipBuilder();
const cfg = { ...base, shipClass: "miner", loadout: expandLoadout(CLASS_LOADOUT.miner) };
let seed = 7; const rng = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
const r = optimizeDrag((c) => { scratch.build(c); return scratch; }, cfg, "vleo", { samples: 12, rng });
if (r.best.dragArea > r.base.dragArea + 1e-9) { console.log("optimiser regressed"); fails++; }
if (r.best.vol < r.base.vol * 0.9 - 1e-9) { console.log("optimiser broke the volume floor"); fails++; }
console.log(`optimiser: barge drag area ${r.base.dragArea.toFixed(0)} → ${r.best.dragArea.toFixed(0)} m² (${(r.gain * 100).toFixed(0)}% less) at ${(100 * r.best.vol / r.base.vol).toFixed(0)}% volume, ${r.tried.length} evaluations`);
// design regime must reshape geometry: streamlined interceptor has less launch drag than a deep-space build
const pair = {};
for (const dr of ["atmo", "deep"]) { b.build({ ...base, shipClass: "interceptor", designRegime: dr, loadout: expandLoadout(CLASS_LOADOUT.interceptor) }); pair[dr] = analyzeFlight(b, "launch"); pair[dr].hasOgive = !!b.noseKind && b.noseKind === "ogive"; }
console.log(`interceptor launch drag area: atmo ${pair.atmo.dragArea.toFixed(1)} m² (Cd ${pair.atmo.cd.toFixed(2)}) vs deep ${pair.deep.dragArea.toFixed(1)} m² (Cd ${pair.deep.cd.toFixed(2)}); ogive nose: ${pair.atmo.hasOgive}`);
if (pair.atmo.dragArea >= pair.deep.dragArea) { console.log("streamlining did not reduce drag"); fails++; }
// re-entry shuttle carries a heat shield and mounts nothing ventral except gear
const rootS = b.build({ ...base, shipClass: "shuttle", designRegime: "reentry", loadout: expandLoadout(CLASS_LOADOUT.shuttle) });
const shield = rootS.children.find(c => c.name === "heatshield");
const ventral = b.mounted.filter(m => m.face === "bottom" && !m.part.tags.includes("landing"));
if (!shield) { console.log("no heat shield on re-entry hull"); fails++; }
if (ventral.length) { console.log("ventral kit below the shield:", ventral.map(m => m.part.id).join(",")); fails++; }
// VLEO corvette: arrays edge-on, sensors conformal
b.build({ ...base, shipClass: "corvette", designRegime: "vleo", loadout: { "pw.solar.mj": 1, "cm.hga": 1, "sw.radar": 1, "dk.crew": 1 } });
const edge = b.mounted.filter(m => m.edgewise).length, flush = b.mounted.filter(m => m.flush).length;
const vleoF = analyzeFlight(b, "vleo"); b.build({ ...base, shipClass: "corvette", designRegime: "deep", loadout: { "pw.solar.mj": 1, "cm.hga": 1, "sw.radar": 1, "dk.crew": 1 } }); const deepF = analyzeFlight(b, "vleo");
console.log(`VLEO corvette: ${edge} edge-on wings, ${flush} conformal sensors; VLEO drag area ${vleoF.dragArea.toFixed(0)} vs deep-space build ${deepF.dragArea.toFixed(0)} m²`);
if (!edge || !flush) { console.log("VLEO adaptation missing"); fails++; }
if (vleoF.dragArea >= deepF.dragArea) { console.log("VLEO shaping did not cut drag"); fails++; }
console.log("failures:", fails); process.exit(fails ? 1 : 0);
