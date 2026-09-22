/* LIVING GALAXY — remote drones are robots (droneforge.js over js/robotgen/).
 *
 * Every kind forges to a merged, nose −Z, centred robot exactly its kind's
 * length; same seed is the same machine; each port's line is its own design
 * with its sector's livery; templates share geometry/materials (flagged keep)
 * and release cleanly; the budget gates growth; the data half needs no THREE.
 *
 *   node --import ./test/three-register.mjs test/drones.test.mjs
 */

import * as THREE from "../vendor/three.module.min.js";
import { DRONE_KINDS, droneSpec, droneSummary } from "../js/dronespec.js";
import { forgeDrone, droneFor, droneBudget, droneTemplateCount, releaseDrones } from "../js/droneforge.js";
import { SPEC_VERSION } from "../js/robotgen/spec.js";

let pass = 0, fail = 0;
const ok = (c, m) => { if (c) pass++; else { fail++; console.error("  FAIL", m); } };
const box = new THREE.Box3(), size = new THREE.Vector3(), centre = new THREE.Vector3();
const sig = (g) => { const a = []; g.traverse((o) => { if (o.isMesh) a.push(o.geometry.attributes.position.count, o.material.name); }); return a.join(","); };

ok(SPEC_VERSION === "1.7.0", `robotgen v1.7 vendored (${SPEC_VERSION})`);

const SECTORS = ["logistic", "military", "industrial", "civilian", "agricultural", "pirate"];
const PORTS = ["Bastion Anchorage", "Harrow Yard", "Kell Deep Relay", "Oriel Terrace", "Vantor Hold", "Seventh Wheel"];
let worstDraws = 0, worstMs = 0, n = 0;
for (const kind of Object.keys(DRONE_KINDS)) {
  const K = DRONE_KINDS[kind];
  for (let i = 0; i < PORTS.length; i++) {
    const sector = kind === "probe" ? null : SECTORS[i];
    const t0 = performance.now();
    const g = forgeDrone(kind, PORTS[i], sector);
    const ms = performance.now() - t0;
    worstMs = Math.max(worstMs, ms); n++;
    const spec = g.userData.spec;
    ok(spec.role === K.role, `${kind}/${PORTS[i]}: career ${spec.role}`);
    ok(spec.locomotion.type === K.locomotion, `${kind}/${PORTS[i]}: chassis ${spec.locomotion.type}`);
    g.updateMatrixWorld(true);
    box.setFromObject(g); box.getSize(size); box.getCenter(centre);
    const big = Math.max(size.x, size.y, size.z);
    ok(Math.abs(big - K.len) < 1e-3, `${kind}/${PORTS[i]}: largest dimension ${big.toFixed(3)} == ${K.len}`);
    ok(centre.length() < 1e-3, `${kind}/${PORTS[i]}: centred (${centre.length().toFixed(4)})`);
    const draws = g.userData.drone.draws;
    worstDraws = Math.max(worstDraws, draws);
    ok(draws >= 1 && draws <= 6, `${kind}/${PORTS[i]}: ${draws} draws after the bake`);
    let lights = 0, unkept = 0, hasColor = false;
    g.traverse((o) => {
      if (o.isLight) lights++;
      if (o.isMesh) {
        if (!o.geometry.userData.keep || !o.material.userData.keep) unkept++;
        if (o.geometry.attributes.color && o.material.vertexColors) hasColor = true;
      }
    });
    ok(lights === 0, `${kind}: no point lights`);
    ok(unkept === 0, `${kind}: every geometry/material flagged keep`);
    ok(hasColor, `${kind}: solids baked into a vertex-coloured mesh`);
    if (sector && kind !== "probe") {
      const pal = spec.palette.name;
      const pool = { logistic: ["civic", "chrome", "glacier"], military: ["military", "security", "ferrite"], industrial: ["industrial", "hazard", "ferrite"], civilian: ["civic", "ceramic", "medical"], agricultural: ["agri", "verdigris", "ceramic"], pirate: ["void", "stealth", "rust", "biolume"] }[sector];
      ok(pool.includes(pal), `${kind}/${sector}: livery ${pal} from the sector pool`);
    }
  }
}

/* nose −Z: robotgen builds facing +Z (the plane's nose cone sits at +Z); the forge turns it */
{
  const g = forgeDrone("sdrone", "Bastion Anchorage", "military");
  const spec = droneSpec("sdrone", "Bastion Anchorage", "military");
  ok(spec.designation === g.userData.drone.designation, "spec and forge agree on designation");
  ok(Math.abs(g.children[0].rotation.y - Math.PI) < 1e-9, "robot turned to face −Z, the hull convention");
}

/* determinism */
ok(sig(forgeDrone("guard", "Vantor Hold", "pirate")) === sig(forgeDrone("guard", "Vantor Hold", "pirate")), "same seed, same machine");
ok(droneSpec("sdrone", "Harrow Yard", "industrial").designation !== droneSpec("sdrone", "Kell Deep Relay", "industrial").designation, "different ports, different designs");

/* summary (the deck's tag) is data only and matches the manifest */
{
  const s = droneSummary("sdrone", "Harrow Yard", "industrial");
  const spec = droneSpec("sdrone", "Harrow Yard", "industrial");
  ok(s.massKg === Math.round(spec.stats.massKg) && s.parts === spec.stats.partCount, `summary is the manifest (${s.designation} ${s.massKg} kg, ${s.parts} parts)`);
  ok(s.massKg > 0 && s.parts > 10 && s.costCr > 0 && s.enduranceMin > 0, `summary has a real bill (${s.costCr} cr, ${s.enduranceMin} min)`);
}

/* templates: budget, sharing, release */
releaseDrones();
droneBudget(1);
const a = droneFor("guard", "Seventh Wheel", "pirate");
const b = droneFor("guard", "Seventh Wheel", "pirate");
const c = droneFor("guard", "Oriel Terrace", "civilian");
ok(a && b, "a built design hands out clones past the budget");
ok(c === null, "a new design waits when the frame's budget is spent");
ok(droneTemplateCount() === 1, "one template for one port's line");
{
  const ma = [], mb = [];
  a.traverse((o) => o.isMesh && ma.push(o.geometry, o.material));
  b.traverse((o) => o.isMesh && mb.push(o.geometry, o.material));
  ok(ma.length && ma.every((x, i) => x === mb[i]), "clones share geometry and materials");
}
droneBudget(1);
ok(droneFor("guard", "Oriel Terrace", "civilian") !== null, "next frame grows it");
ok(droneTemplateCount() === 2, "two templates");
let geo = null; a.traverse((o) => { if (o.isMesh && !geo) geo = o.geometry; });
releaseDrones();
ok(droneTemplateCount() === 0, "release clears the designs");

console.log(`drones: ${pass} passed, ${fail} failed — ${n} designs, worst ${worstDraws} draws, worst ${worstMs.toFixed(0)} ms to grow`);
process.exit(fail ? 1 : 0);
