/* LIVING GALAXY 0.3.93 — scrap rides the clock.
 *
 *   node --import ./test/three-register.mjs test/scrapcarry.test.mjs
 *
 * In a held sky the relay nudges a pilot's clock onto the shared one
 * (js/net/net.js → shiftClock) whenever it is more than a quarter second out:
 * every poll on a device running under ten frames a second, and after any long
 * frame on one that is not. shiftClock carried the ship along its world's
 * orbit, and a hulk follows its world by itself — but the plate adrift between
 * them was left where it was. Near Earth that is 39 u a second of correction,
 * and since 0.3.92 plate is only aboard inside 9 u. Pinned here:
 *
 *   1. a correction, forward or back, leaves loose scrap exactly where it was
 *      relative to the ship, at the speed it had relative to the ship;
 *   2. what is not adrift beside her is left alone: a chunk an impact run is
 *      driving, a ring chunk on its orbit, anything past CLOCK_CARRY_R;
 *   3. flown: with the clock corrected 0.7 s every second — a slow device in
 *      Sol — plate shed 150 u off comes aboard.
 */
const store = new Map();
globalThis.localStorage ??= { getItem: (k) => (store.has(k) ? store.get(k) : null), setItem: (k, v) => store.set(k, String(v)), removeItem: (k) => store.delete(k) };

const { sim, launchSim, tickSim, shiftClock, CLOCK_CARRY_R } = await import("../js/sim/sim.js");
const { makePilot } = await import("../js/flight/pilot.js");
const { BODIES, bodyPosition, bodyVelocity } = await import("../js/world/bodies.js");
const { chunks, addChunk } = await import("../js/world/debris.js");
const { spawnHulk, resetHulks } = await import("../js/world/hulks.js");
const { batteryCap } = await import("../js/flight/ship.js");

let pass = 0, fail = 0;
const ok = (c, m) => { if (c) pass++; else { fail++; console.error("  FAIL", m); } };
const HZ = 30;

makePilot("Salvor", "terran", "salvage", null);
launchSim("ScrapCarry", "sol");
sim.phase = "play";
const ship = sim.ship;
for (let i = 0; i < HZ; i++) tickSim(1 / HZ);

const earth = BODIES.find((b) => b.id === "earth");
const _p = { x: 0, y: 0, z: 0 }, _v = { x: 0, y: 0, z: 0 };
function overEarth() {
  bodyPosition(earth.id, sim.time, _p); bodyVelocity(earth.id, sim.time, _v);
  ship.dockedAt = null;
  ship.pos.x = _p.x + earth.radius * 3; ship.pos.y = _p.y; ship.pos.z = _p.z;
  ship.vel.x = _v.x; ship.vel.y = _v.y; ship.vel.z = _v.z;
  ship.charge = batteryCap(ship);
  chunks.length = 0; resetHulks();
  for (let i = 0; i < 5; i++) tickSim(1 / HZ);
}
const plate = (dx, extra = {}) => addChunk({ x: ship.pos.x + dx, y: ship.pos.y, z: ship.pos.z, vx: ship.vel.x, vy: ship.vel.y, vz: ship.vel.z, r: 0.5, good: "steel", remainingMass: 5, salvage: true, life: 1800, ...extra });
const off = (o) => Math.hypot(o.x - ship.pos.x, o.y - ship.pos.y, o.z - ship.pos.z);
const rel = (c) => Math.hypot(c.vx - ship.vel.x, c.vy - ship.vel.y, c.vz - ship.vel.z);

/* ---- 1. a correction leaves scrap where it was, relative to the ship ------------ */
{
  overEarth();
  ship.salvage = false;
  ok(sim.dominant?.id === "earth" && Math.hypot(_v.x, _v.y, _v.z) > 10, `she is in Earth's frame, and it is moving (${Math.hypot(_v.x, _v.y, _v.z).toFixed(1)} u/s)`);
  const c = plate(30);
  const h = spawnHulk({ id: "t:carry", name: "Carry", ship: "general_a", x: ship.pos.x - 60, y: ship.pos.y, z: ship.pos.z }, { source: "test", intact: 1 });
  const d0 = off(c), r0 = rel(c), h0 = off(h);
  shiftClock(0.8);
  ok(Math.abs(off(c) - d0) < 0.01, `0.8 s forward: the plate is still ${d0.toFixed(1)} u off (${off(c).toFixed(2)})`);
  ok(Math.abs(rel(c) - r0) < 0.01, `…and still at rest beside her (${rel(c).toFixed(3)} u/s)`);
  tickSim(1 / HZ);
  ok(Math.abs(off(h) - h0) < 0.5, `the hulk rode its world as before (${off(h).toFixed(2)} u)`);
  const d1 = off(c);
  shiftClock(-0.5);
  ok(Math.abs(off(c) - d1) < 0.01, `0.5 s back: the same (${off(c).toFixed(2)} u)`);
}

/* ---- 2. what is not adrift beside her is left alone ------------------------------- */
{
  overEarth();
  ship.salvage = false;
  const driven = plate(40, { driven: true });
  const ring = plate(50, { orbitR: 1000, parent: "earth", orbitA: 0, orbitY: 0 });
  const far = plate(CLOCK_CARRY_R + 500);
  const at = (c) => [c.x, c.y, c.z].join(",");
  const a = at(driven), b = at(ring), f = at(far);
  shiftClock(0.8);
  ok(at(driven) === a, "a chunk an impact run is driving is not touched");
  ok(at(ring) === b, "a ring chunk keeps its orbit");
  ok(at(far) === f, `past ${CLOCK_CARRY_R} u nothing is carried`);
}

/* ---- 3. flown: a slow device in Sol still gets its plate ---------------------- */
{
  overEarth();
  ship.salvage = true;
  ship.powered.ops = true;
  ship.cargoCap = Math.max(ship.cargoCap, 2000);
  const had = ship.hold.steel ?? 0;
  const c = plate(150);
  let aboardAt = null, worst = 0;
  for (let s = 0; s < 20 && aboardAt === null; s++) {
    for (let i = 0; i < 3; i++) tickSim(0.1);
    shiftClock(0.7);
    if (!c.dead) worst = Math.max(worst, s > 6 ? off(c) : 0);
    if ((ship.hold.steel ?? 0) > had) aboardAt = s + 1;
  }
  ok(aboardAt !== null, `plate shed 150 u off comes aboard under a 0.7 s correction every second (${aboardAt === null ? `never — it sat ${worst.toFixed(0)} u off` : `${aboardAt} s`})`);
}

console.log(`scrapcarry: ${pass} passed, ${fail} failed`);
if (fail) process.exit(1);
