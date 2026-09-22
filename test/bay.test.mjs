/* LIVING GALAXY 0.3.15 — the hangar, flown by real hulls.
 *
 *   node --import ./test/three-register.mjs test/bay.test.mjs
 *
 * No scenery traffic is built into a port any more, and everything that
 * enters or leaves one — named captains, flow boats, work drones, corporate
 * drones — flies the bay between the door and the clamps, with no jump at
 * either end.
 */

import { sim, launchSim } from "../js/sim.js";
import { makePilot } from "../js/pilot.js";
import { stations, stepStations } from "../js/stations.js";
import { currentSystem } from "../js/bodies.js";
import { traffic, stepTraffic } from "../js/npc/traffic.js";
import { flow, populateFlow, flowPose } from "../js/npc/flow.js";
import { lanePoint } from "../js/npc/lanes.js";
import { hasBay, bayPose, insideBay, BAY_IN_S, BAY_OUT_S } from "../js/npc/bay.js";
import { ensureBuilt } from "../js/stationyard.js";
import { npcDrones, stepNpcDrones } from "../js/drones/npcdrones.js";

let pass = 0, fail = 0;
const ok = (c, m) => { if (c) pass++; else { fail++; console.error("  FAIL", m); } };
const d3 = (a, b) => Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z);

makePilot("Bay", "terran", "mining", null);
launchSim("BayTest", "baysky");
sim.phase = "play";

const port = stations.find((s) => s.sector !== "pirate" && hasBay(s));
ok(port, `a port with a built hangar (${port?.name})`);

/* ---- no scenery -------------------------------------------------------- */
{
  let shuttles = 0, sorties = 0;
  for (const st of stations) {
    ensureBuilt(st);
    const a = st.gen?.anim;
    if (!a) continue;
    shuttles += a.traffic.filter((o) => o.userData.traffic.way).length;
    sorties += a.drones.length;
  }
  ok(shuttles === 0, `no box shuttles loop the ways (${shuttles})`);
  ok(sorties === 0, `no scenery drones sortie from the bays (${sorties})`);
}

/* ---- the path ------------------------------------------------------------ */
{
  for (const which of ["in", "out"]) for (let k = 0; k < 3; k++) {
    const door = lanePoint(port, which === "in" ? "entry" : "exit", 0, {}, k);
    const a = bayPose(port, which, 0, k, {}), b = bayPose(port, which, 1, k, {});
    const atDoor = which === "in" ? a : b, atClamps = which === "in" ? b : a;
    ok(d3(atDoor, door) < 1e-6, `${which}/${k}: the bay path ends on the lane's own door`);
    ok(insideBay(port, atClamps), `${which}/${k}: and its other end is on the clamps inside the hangar`);
    let worst = 0, inside = 0, prev = a;
    for (let i = 1; i <= 60; i++) { const p = bayPose(port, which, i / 60, k, {}); worst = Math.max(worst, d3(p, prev)); prev = p; if (insideBay(port, p)) inside++; }
    ok(worst < port.port.d * 0.2, `${which}/${k}: continuous (worst step ${worst.toFixed(2)} u)`);
    ok(inside >= 58, `${which}/${k}: every point of it is inside the hangar (${inside}/60)`);
  }
  const inA = bayPose(port, "in", 1, 1, {}), outA = bayPose(port, "out", 0, 1, {});
  ok(d3(inA, outA) > 1, "arrivals and departures have their own clamps");
}

/* ---- flow boats -------------------------------------------------------- */
{
  populateFlow(sim.skySeed, stations);
  const boats = flow.filter((n) => n.port === port.id);
  ok(boats.length > 0, `${boats.length} flow boats on ${port.name}`);
  let seenIn = 0, seenOut = 0, jumps = 0, worst = 0;
  for (const n of boats) {
    let prev = null;
    for (let t = 0; t < n.period * 1.2; t += 0.25) {
      const p = flowPose(n, t, stations, {});
      if (p.lane === "bay") { if (p.job === "approach") seenIn++; else seenOut++; ok(insideBay(port, p), `${n.name} in its bay run is inside the hangar`); }
      if (prev && prev.visible && p.visible) { const j = d3(p, prev); worst = Math.max(worst, j); if (j > 60) jumps++; }
      prev = p;
    }
  }
  ok(seenIn > 0 && seenOut > 0, `boats fly the bay both ways (${seenIn} in, ${seenOut} out samples)`);
  ok(jumps === 0, `no boat jumps between the bay and the lane (worst quarter-second step ${worst.toFixed(1)} u)`);
}

/* ---- the named captains -------------------------------------------------- */
{
  const T0 = sim.time;
  const watched = new Map();
  let berth = 0, unberth = 0, jumps = 0, outside = 0, docked = 0, launched = 0;
  const step = 0.25;
  for (let i = 0; i < 2400; i++) {
    sim.time = T0 + i * step;
    stepStations(sim.time);
    stepTraffic(sim.time, step, stations, currentSystem);
    for (const n of traffic) {
      const prev = watched.get(n.id);
      if (n.state === "berth" || n.state === "unberth") {
        const st = stations.find((s) => s.id === n.bayAt);
        if (n.state === "berth") berth++; else unberth++;
        if (!n.visible) outside++;
        if (st && n.bayS > 0.45 && !insideBay(st, n)) outside++;
        if (prev && prev.visible && n.visible && prev.at === st?.id) {
          /* measured in the port's frame: the port itself is moving */
          const rel = Math.hypot((n.x - st.x) - (prev.x - prev.sx), (n.y - st.y) - (prev.y - prev.sy), (n.z - st.z) - (prev.z - prev.sz));
          /* a hull on the lane is integrated to the next tick while its port is not yet (flyStep's frame
           * match), so the step across the handover carries one tick of the port's own travel */
          const carry = prev.state === n.state ? 0 : Math.hypot(st.vx ?? 0, st.vy ?? 0, st.vz ?? 0) * step;
          if (rel - carry > 40) jumps++;
        }
      }
      if (prev?.state === "berth" && n.state === "dock") docked++;
      if (prev?.state === "unberth" && n.state === "launch") launched++;
      if (prev && prev.state === "launch" && n.state === "launch" && prev.at) {
        const st = stations.find((s) => s.id === prev.at);
        if (st && Math.hypot((n.x - st.x) - (prev.x - prev.sx), (n.y - st.y) - (prev.y - prev.sy), (n.z - st.z) - (prev.z - prev.sz)) > 120) jumps++;
      }
      const at = n.bayAt ?? (n.state === "approach" ? n.legs?.[n.legIx]?.to?.id : n.state === "launch" ? n.legs?.[n.legIx]?.from?.id : null);
      const st = stations.find((s) => s.id === at) ?? { x: 0, y: 0, z: 0 };
      watched.set(n.id, { state: n.state, visible: n.visible, x: n.x, y: n.y, z: n.z, sx: st.x, sy: st.y, sz: st.z, at });
    }
  }
  ok(berth > 0 && docked > 0, `captains fly in through the door and onto the clamps (${berth} samples, ${docked} berthed)`);
  ok(unberth > 0 && launched > 0, `and off the clamps and out through the exit door (${unberth} samples, ${launched} launched)`);
  ok(outside === 0, `a hull in its bay run is visible and inside the hangar (${outside} misses)`);
  ok(jumps === 0, `with no jump in the port's frame (${jumps})`);
}

/* ---- corporate drones ---------------------------------------------------- */
{
  let bayed = 0, inside = 0;
  const T0 = sim.time;
  for (let i = 0; i < 1600; i++) {
    sim.time = T0 + i * 0.5;
    stepStations(sim.time);
    stepNpcDrones();
    for (const u of npcDrones.units) if (u.bay) { bayed++; const st = stations.find((s) => s.id === u.dockedAt); if (st && u.bay.s > 0.45 && insideBay(st, u)) inside++; }
  }
  ok(bayed > 0, `corporate drones dock and launch through the hangar (${bayed} samples)`);
  ok(inside > 0, `and are inside it on the way (${inside})`);
}

console.log(`bay: ${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
