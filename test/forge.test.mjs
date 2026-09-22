/* LIVING GALAXY — ship forge sanity.
 *
 * Every hull in the registry must forge through the ship generator
 * (js/shipgen/) to a group the engine can fly: centred, exactly the registry
 * length, nose to -Z, with the userData contract the engine and the yard
 * read (def, seed, parts, plumes, glow, gen). Same def + seed twice must be
 * the same hull; lite builds must be cheap.
 *
 *   node --import ./test/three-register.mjs test/forge.test.mjs
 */

import * as THREE from "../vendor/three.module.min.js";
import { SHIP_DB } from "../js/shipdb.js";
import { forgeShip, forgeShipScaled, tickHull, releaseHull } from "../js/shipforge.js";
import { hullSpec } from "../js/hullspec.js";

let pass = 0;
let fail = 0;
const ok = (cond, msg) => {
  if (cond) pass++;
  else {
    fail++;
    console.error("  FAIL", msg);
  }
};

function meshCount(g) {
  let n = 0;
  g.traverse((o) => { if (o.isMesh) n++; });
  return n;
}
function signature(g) {
  const sig = [];
  g.traverse((o) => { if (o.isMesh) sig.push(o.geometry.attributes.position.count, o.position.x.toFixed(4), o.position.z.toFixed(4)); });
  return sig.join(",");
}

const _box = new THREE.Box3();
const _size = new THREE.Vector3();
const _centre = new THREE.Vector3();

let totalFull = 0, totalLite = 0, worstLite = 0;
const t0 = Date.now();
for (const def of SHIP_DB) {
  const a = forgeShip(def, { seed: 7 });
  const b = forgeShip(def, { seed: 7 });
  const na = meshCount(a);
  totalFull += na;
  ok(na >= 5, `${def.id}: forges ≥5 meshes (${na})`);
  ok(signature(a) === signature(b), `${def.id}: deterministic for a seed`);
  ok(signature(a) !== signature(forgeShip(def, { seed: 8 })), `${def.id}: a different seed is a different hull`);

  _box.setFromObject(a);
  _box.getSize(_size);
  _box.getCenter(_centre);
  ok(Math.abs(_size.z - def.dims[0]) < 0.02, `${def.id}: length normalized to ${def.dims[0]} u (got ${_size.z.toFixed(3)})`);
  ok(_centre.length() < def.dims[0] * 0.1, `${def.id}: centred on origin (${_centre.length().toFixed(3)})`);
  ok(_size.x > 0.05 && _size.y > 0.05, `${def.id}: has beam and height`);

  const u = a.userData;
  ok(u.def === def && u.seed?.seed === 7, `${def.id}: userData.def / seed`);
  ok(u.parts > 0, `${def.id}: userData.parts (${u.parts})`);
  ok(Array.isArray(u.plumes) && u.plumes.length >= def.grammar.engines[0], `${def.id}: plumes ≥ ${def.grammar.engines[0]} (${u.plumes?.length})`);
  ok(u.glow === (u.plumes[0] ?? null), `${def.id}: glow is the first plume`);
  ok(u.gen?.builder && u.gen?.anim && u.gen?.stats && u.gen?.spec === hullSpec(def), `${def.id}: generator handle`);
  const bare = u.gen.builder.unmounted.filter((m) => !(m.part ?? m).tags?.includes("internal")).length;
  ok(bare <= 20, `${def.id}: ≤20 exterior parts left unmounted (${bare} of ${u.gen.stats.unmounted})`);

  let lights = 0;
  a.traverse((o) => { if (o.isLight) lights++; });
  ok(lights === 0, `${def.id}: no point lights in an engine build`);

  /* Animation must run without throwing on both builds. */
  tickHull(a, 1 / 60, 1.0, { throttle: 0.9 });
  tickHull(a, 1 / 60, 1.5, { throttle: 0.0 });

  const lite = forgeShip(def, "traffic", { detail: "lite" });
  const nl = meshCount(lite);
  totalLite += nl;
  worstLite = Math.max(worstLite, nl);
  ok(nl < na, `${def.id}: lite build has fewer draws (${nl} < ${na})`);
  ok(nl <= 120, `${def.id}: lite build ≤120 draws (${nl})`);
  ok(lite.userData.plumes.length >= 1, `${def.id}: lite keeps its plumes`);
  tickHull(lite, 1 / 60, 2.0, { throttle: 0.5 });

  releaseHull(a); releaseHull(b); releaseHull(lite);
  ok(a.userData.gen === null, `${def.id}: releaseHull drops the generator handle`);
}

/* Scaled convenience keeps its footprint promise. */
const gb = SHIP_DB.find((d) => d.id === "general_b");
if (gb) {
  const g = forgeShipScaled(gb, "x", {}, 4.8);
  _box.setFromObject(g);
  _box.getSize(_size);
  ok(Math.abs(_size.z - 4.8) < 0.05, `general_b scaled to 4.8 u (${_size.z.toFixed(3)})`);
}

/* Shared unit geometry must survive an engine disposal pass. */
{
  const g = forgeShip(SHIP_DB[0], "k");
  let shared = 0, unflagged = 0;
  g.traverse((o) => { if (o.geometry?.userData?.shared) { shared++; if (!o.geometry.userData.keep) unflagged++; } });
  ok(unflagged === 0, `shared generator geometry is flagged keep (${shared} shared, ${unflagged} unflagged)`);
}

const ms = Date.now() - t0;
console.log(`forge: ${pass} passed, ${fail} failed — ${SHIP_DB.length} hulls, avg ${Math.round(totalFull / SHIP_DB.length)} draws full / ${Math.round(totalLite / SHIP_DB.length)} lite (worst lite ${worstLite}), ${ms} ms`);
process.exit(fail ? 1 : 0);
