/* LIVING GALAXY — 0.3.55: you spawn where you spawn.
 *
 * Reported from the live site: the game drops you into an asteroid field,
 * then after a while throws you back to the normal spawn. A launch seats the
 * hull beside the home world at sky time 0; joining a shared sky then jumps
 * the clock by the room's whole age (day 41 = 28,890 s). shiftClock carried
 * the hull along the world's velocity in a STRAIGHT LINE for that whole
 * jump — 950,000 u off Earth, into the main belt — and a relay restart that
 * moved the room's clock back did the same the other way.
 *
 *   node --import ./test/three-register.mjs test/spawn.test.mjs
 */
const store = new Map();
globalThis.localStorage = { getItem: (k) => store.get(k) ?? null, setItem: (k, v) => store.set(k, String(v)), removeItem: (k) => store.delete(k) };

const { sim, launchSim, tickSim, shiftClock } = await import("../js/sim.js");
const { makePilot } = await import("../js/pilot.js");
const { bodyPosition, bodyVelocity } = await import("../js/bodies.js");
const { inBelt } = await import("../js/field.js");

let pass = 0, fail = 0;
const ok = (c, m) => { if (c) { pass++; if (process.env.V) console.log("  ok", m); } else { fail++; console.error("  FAIL", m); } };

makePilot("SPAWN", "terran", "mining", null);
const earth = { x: 0, y: 0, z: 0 }, ev = { x: 0, y: 0, z: 0 };
const rel = () => { bodyPosition(sim.selected, sim.time, earth); const p = sim.ship.pos; return { x: p.x - earth.x, y: p.y - earth.y, z: p.z - earth.z, d: Math.hypot(p.x - earth.x, p.y - earth.y, p.z - earth.z) }; };
const relV = () => { bodyVelocity(sim.selected, sim.time, ev); const v = sim.ship.vel; return Math.hypot(v.x - ev.x, v.y - ev.y, v.z - ev.z); };

for (const [jump, ticks, what] of [
  [28890, 3, "joining a room on day 41, the home world already found"],
  [28890, 0, "joining before the first tick has found the home world"],
  [-28890, 3, "a relay restart moving the room's clock back"],
  [400000, 3, "a room a month old"],
  [0.25, 3, "the clock chase's quarter-second nudge"],
]) {
  launchSim("SPAWN", "sol");
  sim.phase = "play";
  for (let i = 0; i < ticks; i++) tickSim(1 / 60);
  const a = rel();
  const v0 = relV();
  shiftClock(jump);
  const b = rel();
  ok(Math.abs(b.d - a.d) < 1 && Math.hypot(b.x - a.x, b.y - a.y, b.z - a.z) < 1, `${what}: the hull keeps its place beside ${sim.selected} (${Math.round(a.d)} → ${Math.round(b.d)} u)`);
  ok(Math.abs(relV() - v0) < 0.5, `…and its motion relative to it (${v0.toFixed(1)} → ${relV().toFixed(1)} u/s)`);
  ok(!inBelt(sim.ship.pos), "…and is nowhere near an asteroid belt");
  for (let i = 0; i < 120; i++) tickSim(1 / 60);
  ok(rel().d < a.d * 1.5, `two seconds on, still at the spawn (${Math.round(rel().d)} u)`);
}

console.log(`spawn: ${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
