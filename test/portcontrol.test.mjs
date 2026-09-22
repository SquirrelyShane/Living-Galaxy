/* LIVING GALAXY — docking with the lanes off the canopy: DOCK from far out files a berth and hands
 * the helm to port control (approach autopilot at the tractor's speed limit); the tractor takes
 * the hull at the mouth; UNDOCK pushes it out and releases it clear; DOCK on the way in waves
 * port control off and leaves the berth standing; a hostile hold refuses.
 *   node --import ./test/three-register.mjs test/portcontrol.test.mjs */
import { sim, launchSim, tickSim, toggleDock } from "../js/sim.js";
import { makePilot } from "../js/pilot.js";
import { stations, TRACTOR_V } from "../js/stations.js";
import { tractor, dockRequest } from "../js/stationworks.js";
import { autopilot } from "../js/autopilot.js";

let pass = 0, fail = 0;
const ok = (c, m) => { if (c) pass++; else { fail++; console.error("  FAIL", m); } };

makePilot("Ctl", "terran", "commerce", null);
launchSim("PortControl", "sol");
sim.phase = "play";
ok(sim.ui?.lanesDrawn === false, "lane rigs off the canopy by default");

const st = stations.find((s) => s.sector !== "pirate" && s.hangars?.length && !s.gnn);
const m = st.hangars[0];
const rel = () => Math.hypot(sim.ship.vel.x - st.vx, sim.ship.vel.y - st.vy, sim.ship.vel.z - st.vz);
const dist = () => Math.hypot(sim.ship.pos.x - st.x, sim.ship.pos.y - st.y, sim.ship.pos.z - st.z);
function placeFar() {
  sim.ship.pos.x = st.x + m.x + m.dir.x * 600 + m.side.x * 120; sim.ship.pos.y = st.y + m.y + m.dir.y * 600 + 60; sim.ship.pos.z = st.z + m.z + m.dir.z * 600 + m.side.z * 120;
  sim.ship.vel.x = st.vx; sim.ship.vel.y = st.vy; sim.ship.vel.z = st.vz;
  sim.ship.yaw = 2.1; sim.ship.pitch = 0.3; sim.ship.throttle = 0;
}
placeFar();
sim.ship.charge = 1500;

/* DOCK from 6 km: berth + port control */
const took = toggleDock();
ok(took && /berth granted/.test(sim.notice) && /helm/.test(sim.notice), `DOCK files the berth and port control takes the helm ("${sim.notice.slice(0, 60)}…")`);
ok(autopilot.on && autopilot.mode === "approach" && autopilot.targetId === st.id, "approach autopilot engaged on the port");
ok(dockRequest.stId === st.id, "berth on file");
let captured = null, vNear = 0, t = 0;
while (!sim.ship.dockedAt && t < 900) {
  tickSim(1 / 30); t += 1 / 30;
  if (dist() < 400) vNear = Math.max(vNear, rel());
  if (!captured && tractor.active) captured = { t: +t.toFixed(1), v: +rel().toFixed(1), why: tractor.why, phase: tractor.phase };
}
ok(captured && captured.v <= TRACTOR_V * 2.5, `the tractor took the hull at ${captured?.v} u/s after ${captured?.t} s (${captured?.why})`);
ok(sim.ship.dockedAt === st.id, `docked hands-off in ${t.toFixed(0)} s`);
ok(!autopilot.on, "port control signs off on the clamps");
ok(vNear <= TRACTOR_V * 2.5 + 1, `never faster than the tractor could hold inside 4 km (${vNear.toFixed(0)} u/s)`);

/* UNDOCK: the push */
toggleDock();
let pushed = false, released = null;
for (let i = 0; i < 30 * 120 && !released; i++) {
  tickSim(1 / 30);
  if (tractor.active && tractor.phase === "push") pushed = true;
  if (pushed && !tractor.active && !sim.ship.dockedAt) {
    const px = sim.ship.pos.x - st.x - m.x, py = sim.ship.pos.y - st.y - m.y, pz = sim.ship.pos.z - st.z - m.z;
    released = { off: Math.round(Math.hypot(px, py, pz)), along: Math.round(px * m.dir.x + py * m.dir.y + pz * m.dir.z) };
  }
}
ok(pushed && released && released.along > 250, `UNDOCK: pushed out and released ${released?.off} u off the mouth (along ${released?.along})`);
for (let i = 0; i < 30 * 20; i++) tickSim(1 / 30);
ok(!sim.ship.dockedAt && !tractor.active, "no re-lock after release");

/* DOCK again mid-approach waves port control off; the berth stands */
placeFar();
sim.ship.charge = 1500;
toggleDock();
/* Fly until port control actually has the helm rather than counting out ten
 * seconds and hoping. How long the handover takes depends on where the port
 * generated and how far `placeFar()` put us from its mouth — both of which move
 * with the sky's seed, and neither of which this assertion is about. */
let flying = false;
for (let i = 0; i < 30 * 60 && !flying; i++) { tickSim(1 / 30); flying = autopilot.on && !sim.ship.dockedAt; }
ok(flying, "flying in");
toggleDock();
ok(!autopilot.on && /waved off/.test(sim.notice) && dockRequest.stId === st.id, "second DOCK: waved off, berth still on file");
/* the helm is yours: port control stays off. A hull left drifting down the funnel at the
 * tractor's speed with a berth on file is still the tractor's to take — that is manual docking. */
let manual = 0, flownIn = false;
ok(sim.ship.throttle === 0, "wave-off hands the stick back at zero throttle");
while (!sim.ship.dockedAt && manual < 60) { tickSim(1 / 30); manual += 1 / 30; if (autopilot.on) flownIn = true; }
ok(!flownIn, "with the helm back nobody flies you in");
ok(!sim.ship.dockedAt || tractor.why === "lane" || tractor.why === "mouth", `if it docked, the tractor took it (${tractor.why ?? "not docked"})`);

/* a hostile hold refuses */
const hold = stations.find((s) => s.hostile && !s.claimed && s.hangars?.length);
if (hold) {
  const hm = hold.hangars[0];
  sim.ship.pos.x = hold.x + hm.x + hm.dir.x * 600; sim.ship.pos.y = hold.y + hm.y + hm.dir.y * 600; sim.ship.pos.z = hold.z + hm.z + hm.dir.z * 600;
  sim.ship.vel.x = hold.vx; sim.ship.vel.y = hold.vy; sim.ship.vel.z = hold.vz;
  const r = toggleDock();
  ok(!r && !autopilot.on, `a hostile hold gives no berth (${sim.notice.slice(0, 50)})`);
}

console.log(`portcontrol: ${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
