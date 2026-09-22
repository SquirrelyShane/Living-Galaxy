/* Every mounted part must touch hull/structure geometry (its footprint box, slightly grown, intersects a hull-ish box). */
import { StarshipBuilder } from "../../js/shipgen/builder/StarshipBuilder.js";
import { SHIP_CLASSES } from "../../js/shipgen/data/classes.js";
import { PARTS, WEAPON_PART } from "../../js/shipgen/data/catalog/index.js";
import { CLASS_LOADOUT, expandLoadout } from "../../js/shipgen/data/loadouts.js";
import { RNG } from "../../js/shipgen/core/rng.js";
const base = { seed: "1701", driveType: "auto", weaponSuite: "auto", armDensity: 1, scale: 1, lengthBias: 1, beamBias: 1, complexity: 0.6,
  primary: "#93a4bd", secondary: "#3b465a", accent: "#9ceeff", engine: "#7df0ff", wings: true, weapons: true, greeble: true, lights: true, windows: true };
const b = new StarshipBuilder();
let loose = 0, total = 0; const byPart = {}, byVol = {};
for (const cls of Object.keys(SHIP_CLASSES)) for (const seed of ["1701", "ZK-4412", "7"]) {
  const lo = expandLoadout(CLASS_LOADOUT[cls]);
  b.build({ ...base, shipClass: cls, seed, loadout: lo });
  const hullish = b.occ.filter(o => o.raw);
  for (const m of b.mounted) {
    total++;
    const grown = m.box.clone().expandByScalar(b.U * 0.05);
    // for curved volumes the part must sit on the tangent band, not a phantom box corner
    const touching = hullish.filter(o => o.raw.intersectsBox(grown));
    const onSurface = touching.some(o => {
      if (!o.vol || !o.vol.shape) return true;
      const c = m.box.getCenter(new (m.box.min.constructor)());
      const V = o.vol, du = (m.face === "top" || m.face === "bottom") ? (c.x - V.x) / (V.w / 2) : (m.face === "port" || m.face === "star") ? (c.y - V.y) / (V.h / 2) : (c.x - V.x) / (V.w / 2);
      const dv = (m.face === "bow" || m.face === "stern") ? (c.y - V.y) / (V.h / 2) : (c.z - V.z) / (V.d / 2);
      if (V.shape === "ring") { const end = m.face === "bow" || m.face === "stern"; const r = Math.hypot(du, dv); return end ? (r >= 0.55 && r <= 1.0) : Math.abs(du) <= 0.25; }
      return V.shape === "cyl" ? (m.face === "bow" || m.face === "stern" ? du * du + dv * dv <= 0.36 : Math.abs(du) <= 0.3) : du * du + dv * dv <= 0.2;
    });
    if (!touching.length || !onSurface) {
      loose++; byPart[m.part.id] = (byPart[m.part.id] || 0) + 1;
      const key = cls + ":" + m.face; byVol[key] = (byVol[key] || 0) + 1;
    }
  }
}
console.log(`loose parts: ${loose} / ${total}`);
console.log("by part:", Object.entries(byPart).sort((a, c) => c[1] - a[1]).slice(0, 10).map(([k, v]) => k + ":" + v).join("  "));
console.log("by class:face:", Object.entries(byVol).sort((a, c) => c[1] - a[1]).slice(0, 12).map(([k, v]) => k + ":" + v).join("  "));
// explorer detail
b.build({ ...base, shipClass: "explorer", seed: "1701", loadout: expandLoadout(CLASS_LOADOUT.explorer) });
console.log("explorer hullVols:"); for (const v of b.hullVols) console.log("  ", [v.x, v.y, v.z, v.w, v.h, v.d].map(n => n.toFixed(1)).join(" "));
console.log("mainPool:", b.mainPool.length, b.mainPool.map(v => `${v.w.toFixed(1)}x${v.h.toFixed(1)}x${v.d.toFixed(1)}@${v.x.toFixed(1)},${v.y.toFixed(1)},${v.z.toFixed(1)}`).join(" | "));
