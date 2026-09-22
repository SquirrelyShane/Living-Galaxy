/* Headless check of the portable layer: buildShip() facade, the idle animation registry,
 * and the ops layer driven through an injected host (no WebGL, no DOM).
 *   node --import ./test/shipgen/register-stub.mjs test/shipgen/test-ops.mjs */
import * as THREE from "three";
import { buildShip, randomConfig, shipBounds, releaseShip } from "../../js/shipgen/generate.js";
import { newRegistry, collectInto, tick } from "../../js/shipgen/anim.js";
import { setOpsHost } from "../../js/shipgen/ops/host.js";
import { rig } from "../../js/shipgen/ops/rig.js";
import { ops, opsBind, opsUpdate, doScan, startMining, stopMining, aimAngles } from "../../js/shipgen/ops/ops.js";
import { fx } from "../../js/shipgen/ops/fx.js";
import { SHIP_CLASSES } from "../../js/shipgen/data/classes.js";

let fails = 0;
const bad = (...m) => { console.log("FAIL", ...m); fails++; };

/* the host project's own container for transient effects */
const scene = new THREE.Group();
setOpsHost({ scene, toast: () => {} });

/* ---- 1. facade: every class builds, reports stats, and animates ------ */
let animatedTotal = 0;
for (const cls of Object.keys(SHIP_CLASSES)) {
  const s = buildShip({ shipClass: cls, seed: "1701" });
  if (!s.root || !s.root.children.length) bad(cls, "empty hull");
  if (!s.stats.partCount) bad(cls, "no parts mounted");
  if (!Number.isFinite(s.stats.flight.cd)) bad(cls, "flight cd not finite");
  if (!(s.stats.bom.massKg > 0)) bad(cls, "bom mass", s.stats.bom.massKg);
  const n = Object.values(s.anim).reduce((a, v) => a + v.length, 0);
  animatedTotal += n;
  if (!n) bad(cls, "nothing animated");
  const b = shipBounds(s.root);
  if (!(b.radius > 0)) bad(cls, "degenerate bounds");
  releaseShip(s.root);
}

/* ---- 2. determinism: same seed + config → identical geometry --------- */
const sig = (r) => { let n = 0, acc = 0; r.traverse(o => { n++; acc += o.position.x + o.position.y * 3 + o.position.z * 7 + o.scale.x * 11; }); return n + ":" + acc.toFixed(6); };
const a = buildShip({ shipClass: "frigate", seed: "ZK-4412" });
const b = buildShip({ shipClass: "frigate", seed: "ZK-4412" });
if (sig(a.root) !== sig(b.root)) bad("not deterministic\n  " + sig(a.root) + "\n  " + sig(b.root));
const c = buildShip({ shipClass: "frigate", seed: "ZK-4413" });
if (sig(a.root) === sig(c.root)) bad("seed had no effect");

/* ---- 3. toggles actually prune the loadout --------------------------- */
const armed = buildShip({ shipClass: "frigate", seed: "7" });
const unarmed = buildShip({ shipClass: "frigate", seed: "7", weapons: false });
if (!armed.stats.weapons.length) bad("frigate built unarmed by default");
if (unarmed.stats.weapons.length) bad("weapons:false still mounted", unarmed.stats.weapons);

/* ---- 4. idle animation tick is finite and moves things --------------- */
const reg = collectInto(newRegistry(), armed.root);
const plume = reg.plumes[0];
const before = plume ? plume.scale.y : null;
for (let i = 0, t = 0; i < 120; i++) { t += 1 / 60; tick(reg, 1 / 60, t, { throttle: 0.9 }); }
if (plume && !Number.isFinite(plume.scale.y)) bad("plume scale went non-finite");
if (plume && plume.scale.y === before) bad("throttle did not drive the plume");
armed.root.traverse(o => { if (!Number.isFinite(o.position.x) || !Number.isFinite(o.rotation.y)) bad("NaN transform after tick on", o.name || o.type); });

/* ---- 5. ops: bind, fire every turret + launcher, mine, dock, scan ----- */
const shooter = buildShip({ shipClass: "cruiser", seed: "NX-9001", weaponSuite: "mixed" });
opsBind(shooter.root, { builder: shooter.builder });
if (!rig.turrets.length && !rig.launchers.length) bad("cruiser bound with no weapon mounts");
if (!rig.size) bad("rig.size not taken from the injected builder");
if (!scene.children.length) bad("target drone / rock never parented to the injected scene");

const mounts = rig.turrets.length + rig.launchers.length;
ops.firing = true; ops.fireEnd = 1e9;
let t = 0;
for (let i = 0; i < 600; i++) { t += 1 / 60; opsUpdate(1 / 60, t); }
ops.firing = false;
for (let i = 0; i < 120; i++) { t += 1 / 60; opsUpdate(1 / 60, t); }

const miner = buildShip({ shipClass: "miner", seed: "OR-2210" });
opsBind(miner.root, { builder: miner.builder });
ops.mining = true; startMining();
for (let i = 0; i < 300; i++) { t += 1 / 60; opsUpdate(1 / 60, t); }
ops.mining = false; stopMining();
ops.docked = true; ops.deploy = 0;
for (let i = 0; i < 180; i++) { t += 1 / 60; opsUpdate(1 / 60, t); }
doScan(t);
for (let i = 0; i < 180; i++) { t += 1 / 60; opsUpdate(1 / 60, t); }
miner.root.traverse(o => { if (!Number.isFinite(o.position.x) || !Number.isFinite(o.scale.y)) bad("NaN on miner after ops", o.name || o.type); });
if (!Number.isFinite(rig.U)) bad("rig.U non-finite");

/* effects must clean themselves up. RCS puffs fire on a random timer, so quiet the
 * thrusters first, then let every live effect run out its lifetime: what is left should be
 * exactly the two persistent props opsBind parks there (target drone + ore body). */
ops.rcs = false;
for (let i = 0; i < 900; i++) { t += 1 / 60; opsUpdate(1 / 60, t); }
const parked = scene.children.length;
if (fx.length) bad("fx list not drained:", fx.length, "effects still live");
if (parked !== 2) bad("host scene should hold only the drone + rock, holds", parked);
ops.rcs = true;

/* ---- 6. randomConfig round-trips through the builder ----------------- */
for (let i = 0; i < 12; i++) {
  const cfg = randomConfig("fleet-" + i);
  const s = buildShip(cfg);
  if (!s.stats.partCount) bad("randomConfig build empty", cfg.shipClass, cfg.seed);
}

console.log(fails ? `\n${fails} FAILURES` : `ops/anim/facade ok — ${Object.keys(SHIP_CLASSES).length} classes, ${animatedTotal} animated nodes, ${mounts} mounts exercised, host scene parked at ${parked}`);
process.exit(fails ? 1 : 0);
