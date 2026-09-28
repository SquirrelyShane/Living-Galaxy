/* LIVING GALAXY 0.3.75 — UNDOCK after accepting a job.
 *
 *   node --import ./test/three-register.mjs test/undock.test.mjs
 *
 * Reported: "at the board, once accepted a contract and hitting undock it
 * doesn't undock". A haul LOADS on accept, and loading books crane time; the
 * clamps stay on until it is done (0.3.25). The refusal was a notice on the
 * HUD, which the station deck covers — the button simply did nothing. */

import { sim, launchSim, tickSim, toggleDock } from "../js/sim.js";
import { makePilot } from "../js/pilot.js";
import { stations } from "../js/stations.js";
import { corps } from "../js/corps.js";
import { boardFor, acceptContract, contracts, resetContracts, BOARD } from "../js/contracts.js";
import { handlingLeft, clearDockwork } from "../js/dockwork.js";
import { releaseTractor } from "../js/stationworks.js";

let pass = 0, fail = 0;
const ok = (c, m) => { if (c) { pass++; if (process.env.V) console.log("  ok", m); } else { fail++; console.error("  FAIL", m); } };

makePilot("Undock", "terran", "trading", null);
launchSim("UndockTest", "fixture");
sim.phase = "play";
const ship = sim.ship;
for (const c of corps) c.standing = 100;
ship.credits = 1e7;
const honest = stations.filter((s) => !(s.hostile && !s.claimed) && s.sector !== "pirate");

/* a haul that loads here */
resetContracts();
let st = null, job = null;
for (let k = 0; k < 60 && !job; k++) for (const s of honest) {
  const o = boardFor(s, sim.time + BOARD.refresh * (40 + k)).find((x) => x.mech === "haul" && x.stationId === s.id);
  if (o) { st = s; job = o; break; }
}
ok(job, `a haul to accept (${job?.title} at ${st?.name})`);
sim.time = Math.max(sim.time, job.posted);
ship.dockedAt = st.id; st.docked = true;
const why = acceptContract(job);
ok(why === null, `accepted (${why})`);
const left = handlingLeft(st.id);
ok(left > 0, `accepting loaded the cargo: the crane holds the clamps for ${Math.ceil(left)} s`);

/* the old behaviour, still the rule for a plain toggle (autopilot, missions) */
ok(toggleDock() === false && ship.dockedAt === st.id, "a plain undock waits for the crane (the rule since 0.3.25)");

/* the deck's press: booked, and it goes by itself */
toggleDock({ queue: true });
ok(ship.dockedAt === st.id && sim.undockWhenClear === st.id, `the deck's UNDOCK books the departure (${sim.notice})`);
toggleDock({ queue: true });
ok(sim.undockWhenClear == null && ship.dockedAt === st.id, "a second press cancels it");
toggleDock({ queue: true });
let t = 0;
while (ship.dockedAt && t < left + 30) { tickSim(0.1); t += 0.1; }
ok(!ship.dockedAt && t >= left - 0.5, `the clamps came off by themselves when the crane finished (${t.toFixed(1)} s after ${left.toFixed(1)} s of loading)`);
ok(sim.undockWhenClear == null, "…and the booking is spent");

/* nothing on the crane: UNDOCK is immediate, as ever */
clearDockwork();
releaseTractor();          // the last departure's push, which would otherwise say "hands off the helm"
ship.dockedAt = st.id; st.docked = true; ship.vel.x = ship.vel.y = ship.vel.z = 0;
toggleDock({ queue: true });
ok(!ship.dockedAt, "nothing loading: UNDOCK undocks at once");

console.log(`undock: ${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
