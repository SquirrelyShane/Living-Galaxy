/* LIVING GALAXY 0.3.73 — entering Sol builds the live sky once; the console does not drop you from the room.
 *
 *   node --import ./test/three-register.mjs test/solprime.test.mjs
 *
 * Reported: FLY AS into Sol, then "the entire system reloads, the sun is now
 * moved and Earth is a different colour"; and opening the console in flight
 * "seems to disconnect from the system server", closing it rerenders and
 * reconnects. */

import { sim, launchSim, tickSim, setTerminal, worldSnapshot } from "../js/sim.js";
import { makePilot } from "../js/pilot.js";
import { BODIES, bodyPosition, PUBLIC_ROOM } from "../js/bodies.js";
import { primeSol } from "../js/net.js";
import { applySolPrime, resetWorldSync, worldsync } from "../js/worldsync.js";

let pass = 0, fail = 0;
const ok = (c, m) => { if (c) { pass++; if (process.env.V) console.log("  ok", m); } else { fail++; console.error("  FAIL", m); } };
const d3 = (a, b) => Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z);

makePilot("Prime", "terran", "mining", null);
launchSim("Prime", PUBLIC_ROOM);
sim.phase = "play";

/* ---- the host's Sol: day 40, one world terraformed and cratered -------------------- */
const world = BODIES.find((b) => b.kind !== "star" && b.kind !== "gas" && !b.parent) ?? BODIES.find((b) => b.kind !== "star");
world.terraform = 3.5;
world.craters = [{ nx: 1, ny: 0, nz: 0, r: 0.1, depth: 0.02, depth0: 0.02, rough: 1, seed: 7 }];
sim.time = 40 * 86400 / 24;             // some big room age
const hostSnap = JSON.parse(JSON.stringify(worldSnapshot()));
ok(hostSnap.bodies[world.id]?.terraform === 3.5, `the host's snapshot marks ${world.name}`);

/* ---- primeSol reads the relay's answer the way a poll's solTime does --------------- */
{
  const realFetch = globalThis.fetch;
  globalThis.fetch = async (url) => {
    ok(String(url).startsWith("/net/world?room=sol"), "primeSol asks the relay for Sol's world");
    return { ok: true, json: async () => ({ wseq: 9, world: hostSnap, at: 1000, now: 1003, born: 10, worldRevision: "r9" }) };
  };
  const p = await primeSol();
  ok(p && Math.abs(p.time - (hostSnap.time + 3)) < 1e-9 && p.wseq === 9 && p.worldRevision === "r9", `time = snapshot time + its age (${p?.time?.toFixed(1)})`);
  globalThis.fetch = async () => ({ ok: true, json: async () => ({ wseq: 0, world: null, at: 0, now: 5000, born: 1000 }) });
  const empty = await primeSol();
  ok(empty && empty.time === 4000 && empty.world === null, "a Sol with no saved world: the room's age, as the poll says");
  globalThis.fetch = async () => { throw new Error("offline"); };
  ok((await primeSol()) === null, "no relay: null, and the old join runs");
  globalThis.fetch = realFetch;
}

/* ---- a fresh launch put on that clock and state before its first frame ------------- */
{
  launchSim("Prime", PUBLIC_ROOM);        // a new launch: sky time 0, clean worlds
  sim.phase = "play";
  ok(sim.time === 0 && !(BODIES.find((b) => b.id === world.id).terraform), "launch builds Sol at time 0, unmarked (what the pilot used to see first)");
  const home = sim.dominant ?? world;
  /* the hull's place relative to the world it starts beside */
  const near = BODIES.filter((b) => b.kind !== "star").map((b) => ({ b, d: d3(bodyPosition(b.id, 0, {}), sim.ship.pos) })).sort((a, b) => a.d - b.d)[0].b;
  const rel0 = (() => { const p = bodyPosition(near.id, sim.time, {}); return { x: sim.ship.pos.x - p.x, y: sim.ship.pos.y - p.y, z: sim.ship.pos.z - p.z }; })();
  resetWorldSync();
  const prime = { time: hostSnap.time, world: hostSnap, wseq: 9, worldRevision: "r9", at: performance.now() };
  ok(applySolPrime(prime), "the prime applies");
  ok(Math.abs(sim.time - hostSnap.time) < 1 && sim.clockSynced, `the sky is on the room's clock (${sim.time.toFixed(1)}) — the first poll has nothing to jump`);
  const b = BODIES.find((x) => x.id === world.id);
  ok(b.terraform === 3.5 && b.craters?.length === 1, `${world.name} already carries the host's state — nothing to re-skin a second later`);
  ok(worldsync.applied && worldsync.revisionSeen === "r9" && worldsync.wseqSeen === 9, "…and worldsync records it as the applied revision, so the first pull is skipped");
  const p1 = bodyPosition(near.id, sim.time, {});
  const rel1 = { x: sim.ship.pos.x - p1.x, y: sim.ship.pos.y - p1.y, z: sim.ship.pos.z - p1.z };
  ok(d3(rel0, rel1) < 1, `the hull keeps its place beside ${near.name} across the jump (${d3(rel0, rel1).toFixed(3)} u)`);
  void home;
}

/* ---- the console keeps you in the room ---------------------------------------------- */
{
  let sent = 0;
  sim.broadcast = (d) => { if (d?.t === "ship") sent++; };
  setTerminal(true);
  for (let i = 0; i < 20; i++) tickSim(0.05);
  ok(sent >= 8, `with the console open the ship still reports itself to the room (${sent} states in 1 s)`);
  setTerminal(false);
  sent = 0;
  for (let i = 0; i < 20; i++) tickSim(0.05);
  ok(sent >= 8, `and with it closed (${sent})`);
  sim.broadcast = () => {};
}

console.log(`solprime: ${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
