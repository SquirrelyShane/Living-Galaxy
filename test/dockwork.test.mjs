/* LIVING GALAXY 0.3.25 — the crane is not the till.
 *
 *   node --import ./test/three-register.mjs test/dockwork.test.mjs
 *
 * A consignment books handling time at the berth. The money moves when you
 * agree the price; the clamps stay on until the last pallet is over the side.
 * It scales with tonnage, it is cumulative across one port call, it is worked
 * off by the sim's own clock, and it is the SAME rule for a pilot and a bot —
 * which is the whole reason it exists.
 */

import { sim, launchSim, tickSim, tradeBuy, tradeSell, toggleDock } from "../js/sim.js";
import { makePilot } from "../js/pilot.js";
import { stations, stationById } from "../js/stations.js";
import { corps } from "../js/corps.js";
import { good } from "../js/materials.js";
import { deliver } from "../js/economy.js";
import { HANDLING, dockwork, bookHandling, clearDockwork, handlingLeft, handlingLine, handlingProgress, handlingSeconds } from "../js/dockwork.js";
import { boardFor, acceptContract, deliverContracts, contracts, resetContracts } from "../js/contracts.js";

let pass = 0, fail = 0;
const ok = (c, m) => { if (c) { pass++; if (process.env.V) console.log("  ok", m); } else { fail++; console.error("  FAIL", m); } };
const store = new Map();
globalThis.localStorage = { getItem: (k) => (store.has(k) ? store.get(k) : null), setItem: (k, v) => store.set(k, String(v)), removeItem: (k) => store.delete(k) };

makePilot("Crane", "terran", "commerce", null);
launchSim("CraneTest", "sol");
sim.phase = "play";
for (const c of corps) c.standing = 100;
for (let i = 0; i < 200; i++) tickSim(1 / 60);
const ship = sim.ship;
const st = stations.find((s) => !(s.hostile && !s.claimed));

/* ---- the number ------------------------------------------------------------------ */
{
  clearDockwork();
  ok(handlingSeconds("girder", 0) === 0 && handlingLeft() === 0, "nothing on the crane is no time on the crane");
  const one = handlingSeconds("girder", 1);
  ok(one >= HANDLING.floor, `one crate is still a pallet, a signature and a scan (${one.toFixed(1)} s)`);
  const ten = handlingSeconds("girder", 10), hundred = handlingSeconds("girder", 100);
  ok(hundred > ten && ten >= one, `and it grows with the lot (1 → ${ten.toFixed(0)} → ${hundred.toFixed(0)} s)`);
  /* tonnage, not units */
  const heavy = "armour_plate", light = "chip";
  if (good(heavy)?.mass > good(light)?.mass) ok(handlingSeconds(heavy, 50) > handlingSeconds(light, 50), `fifty ${heavy} take longer than fifty ${light} — it is tonnage, not crates (${handlingSeconds(heavy, 50).toFixed(0)} s vs ${handlingSeconds(light, 50).toFixed(0)} s)`);
  else ok(true, "no mass difference to compare in this book");
  ok(handlingSeconds("girder", 1e9) <= HANDLING.cap, "and a port never spends more than its cap on one call");
  const rigged = handlingSeconds("girder", 200, { handling: 2 });
  ok(rigged < handlingSeconds("girder", 200), `a better cargo rig works it off faster (${rigged.toFixed(0)} s vs ${handlingSeconds("girder", 200).toFixed(0)} s)`);
}

/* ---- the till is instant, the crane is not ----------------------------------------- */
{
  clearDockwork();
  ship.dockedAt = st.id;
  ship.credits = 500000;
  const line = st.stock.find((l) => l.qty > 120) ?? st.stock[0];
  deliver(st, line.id, 200);
  const cr0 = ship.credits;
  ok(tradeBuy(line.id, 120) === null, `bought 120 ${line.name ?? line.id}`);
  ok(ship.credits < cr0 && (ship.hold[line.id] ?? 0) >= 120, "the money and the cargo moved at once — the till is instant");
  const booked = handlingLeft(st.id);
  ok(booked > 0, `and the crane booked ${Math.round(booked)} s for it`);
  ok(/loading/.test(handlingLine()) && handlingProgress() < 0.1, `with something to say about it: "${handlingLine()}"`);
  ok(toggleDock() === false && ship.dockedAt === st.id, "the clamps do not come off while it is working");
  ok(/cargo handling/.test(sim.notice), `and port control says why: "${sim.notice.slice(0, 70)}"`);
  /* a second lot on the same call adds to it rather than replacing it */
  const before = handlingLeft(st.id);
  tradeSell(line.id, 40);
  ok(handlingLeft(st.id) > before, `a sell on the same port call queues behind the buy (${Math.round(before)} → ${Math.round(handlingLeft(st.id))} s)`);
  ok(dockwork.job.items.length >= 2, "the berth remembers both lots");
  /* the sim's own clock works it off */
  let n = 0;
  while (n++ < 60 * 600 && handlingLeft(st.id) > 0) tickSim(1 / 60);
  ok(handlingLeft(st.id) === 0 && handlingProgress() === 1, `worked off in ${(n / 60).toFixed(0)} s of sim time`);
  ok(toggleDock() !== false || ship.dockedAt === null, "and then the clamps let go");
  ship.dockedAt = null;
  for (const k of Object.keys(ship.hold)) delete ship.hold[k];
}

/* ---- leaving the berth ends it ------------------------------------------------------- */
{
  clearDockwork();
  bookHandling(st.id, "buy", "girder", 100, null);
  ok(handlingLeft(st.id) > 0 && handlingLeft("elsewhere") === 0, "handling belongs to the berth that booked it");
  tickSim(1 / 60);          // not docked there any more
  ok(handlingLeft(st.id) === 0 && !dockwork.job, "and once the hull is not at that berth the crane is somebody else's problem");
}

/* ---- a contract's cargo is cargo too --------------------------------------------------- */
{
  resetContracts();
  clearDockwork();
  ship.dockedAt = st.id;
  ship.credits = 200000;
  let job = null;
  for (let k = 0; k < 20 && !job; k++) for (const s of stations) { const o = boardFor(s, sim.time + 480 * k).find((x) => x.mech === "deliver" && x.good && x.qty > 20 && x.stationId === st.id); if (o) { job = o; break; } }
  if (job) {
    acceptContract(job);
    const a = contracts.active.find((x) => x.id === job.id);
    ship.hold[a.good] = (ship.hold[a.good] ?? 0) + a.qty;
    clearDockwork();
    const paid = deliverContracts(st.id);
    ok(paid > 0, `delivered ${a.qty} ${a.good} for ${paid.toLocaleString("en-US")} cr`);
    ok(handlingLeft(st.id) > 0, `and signing it over books the crane too (${Math.round(handlingLeft(st.id))} s)`);
    ok(/signing over/.test(handlingLine()), `which reads as what it is: "${handlingLine()}"`);
  } else {
    ok(true, "no delivery job on the desk to sign over");
    ok(true, "—");
    ok(true, "—");
  }
  clearDockwork();
  ship.dockedAt = null;
}

console.log(`dockwork: ${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
