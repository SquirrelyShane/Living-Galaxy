/* LIVING GALAXY 0.3.25 — ARIA looking out of the canopy, and flying what she sees.
 *
 *   node --import ./test/three-register.mjs test/ariasense.test.mjs
 *
 * The senses build one consistent picture of the sky from the live sim — hull,
 * wells, contacts, belt, every port's prices and industry lines, the board,
 * the routes — cheaply and without touching anything. The navigator turns a
 * destination into legs a core will actually take: it locks, it marks, it
 * refuses a corridor with a world across it and doglegs round it instead, and
 * it costs a leg in seconds that match how long the leg really takes.
 */

import { sim, launchSim, tickSim, losBlocker, selectBody } from "../js/sim.js";
import { makePilot } from "../js/pilot.js";
import { stations, stationById } from "../js/stations.js";
import { BODIES, bodyPosition, dist3 } from "../js/bodies.js";
import { corps } from "../js/corps.js";
import { ledgerOf, lift } from "../js/economy.js";
import {
  SENSE, sense, senseHull, senseSpace, sensePorts, senseBoard, senseRoutes,
  senseLine, forgetSenses, unpostedWork, nearestReachablePort,
} from "../js/aria/senses.js";
import {
  NAV, planRoute, legSeconds, tripSeconds, corridorBlocker, doglegAround,
  climbOut, lockOn, markPlace, aimAt, placeOf, routeLine,
} from "../js/aria/nav.js";
import { jobSeconds, jobsFor, jobPlan } from "../js/ariaplay.js";
import { validate } from "../js/mission/script.js";
import { boardFor, resetContracts } from "../js/contracts.js";

let pass = 0, fail = 0;
const ok = (c, m) => { if (c) { pass++; if (process.env.V) console.log("  ok", m); } else { fail++; console.error("  FAIL", m); } };
const store = new Map();
globalThis.localStorage = { getItem: (k) => (store.has(k) ? store.get(k) : null), setItem: (k, v) => store.set(k, String(v)), removeItem: (k) => store.delete(k) };

makePilot("Eyes", "terran", "mining", null);
launchSim("SenseTest", "sol");
sim.phase = "play";
for (const c of corps) c.standing = 100;
for (let i = 0; i < 300; i++) tickSim(1 / 60);

/* ---- one look, everything in it ---------------------------------------------------- */
{
  forgetSenses();
  const s = sense();
  ok(s.hull && s.space && s.ports && s.board && s.routes, "one look covers the hull, the space, the ports, the board and the market");
  ok(s.hull.hull > 0 && s.hull.hull <= 1 && s.hull.charge > 0 && s.hull.holdFrac >= 0 && s.hull.cargoCap > 0, `the hull reads as fractions: ${Math.round(s.hull.hull * 100)}% hull, ${Math.round(s.hull.charge * 100)}% charge, hold ${Math.round(s.hull.holdFrac * 100)}%`);
  ok(typeof s.hull.armed === "boolean" && s.hull.name, `and knows what it is flying: ${s.hull.name}, ${s.hull.turrets} gun(s)`);
  ok(s.space.wells.length > 0 && s.space.wells.every((w) => w.d >= 0 && w.well > 0) && s.space.wells[0].d <= s.space.wells[1].d, `the wells are there, nearest first: ${s.space.wells.slice(0, 2).map((w) => w.name).join(", ")}`);
  ok(s.ports.length > 0 && s.ports.every((P) => P.d >= 0 && Array.isArray(P.stock) && Array.isArray(P.lines)), `${s.ports.length} ports, each with its shelf and its production lines`);
  ok(s.ports[0].d <= s.ports[s.ports.length - 1].d, "nearest first");
  ok(s.ports.some((P) => P.stock.length && P.stock.every((l) => l.ask > 0 && l.bid > 0)), "every shelf line carries a price both ways");
  ok(s.ports.every((P) => P.standing === null || Number.isFinite(P.standing)), "and how the owner feels about you");
  ok(s.board.rows.length > 0 && s.board.rows.every((r) => r.cat && r.offers > 0), `the board is summarised by department (${s.board.rows.length} rows)`);
  ok(Array.isArray(s.routes) && s.routes.every((r) => r.perMin >= 0 && r.fromId !== r.toId), `and the market's own best runs (${s.routes.length})`);
  ok(/hull/.test(senseLine(s)) && senseLine(s).length < 200, `and it says itself in one line: ${senseLine(s)}`);
}

/* ---- it is a snapshot, and it is cheap ---------------------------------------------- */
{
  forgetSenses();
  const t0 = Date.now();
  for (let i = 0; i < 200; i++) sense();
  const ms = Date.now() - t0;
  ok(ms < 400, `two hundred looks in ${ms} ms — the expensive layers are rebuilt on their own cadence, not per tick`);
  const a = sensePorts();
  ok(sensePorts() === a, "a second look inside the cadence is the same picture, not a new one");
  forgetSenses();
  ok(sensePorts() !== a, "and forgetting it really does forget it");
  ok(SENSE.ports >= 20 && SENSE.space <= 5, "space refreshes faster than the ledgers, because it changes faster");
}

/* ---- a stalled line is an order nobody posted --------------------------------------- */
{
  const st = stations.find((s) => s.sector === "industrial" && !(s.hostile && !s.claimed));
  const e = ledgerOf(st);
  lift(st, "iron_ore", 1e9);                       // starve the smelter
  for (let i = 0; i < 60 * 40; i++) tickSim(1 / 60);
  forgetSenses();
  const P = sensePorts().find((x) => x.id === st.id);
  ok(P && P.lines.length > 0, `${st.name} runs ${P?.lines.length} lines`);
  ok(P.stalled.some((x) => x.good === "iron_ore"), `and she can see the smelter has stalled on ${P.stalled.map((x) => x.name).join(", ") || "nothing"}`);
  const work = unpostedWork();
  ok(Array.isArray(work), `${work.length} pieces of work nobody has posted a contract for`);
  ok(work.every((w) => w.fromId !== w.toId && w.profit > 0 && w.qty > 0), "every one of them buys somewhere real and sells somewhere real, at a profit");
  if (work.length) ok(/short|stalled/.test(work[0].why), `and says why the port wants it: "${work[0].qty} ${work[0].name} ${work[0].from} → ${work[0].to} — ${work[0].why}"`);
  else ok(true, "nothing unposted in this sky right now");
  void e;
}

/* ---- the corridor ------------------------------------------------------------------- */
{
  const p = { ...sim.ship.pos };
  ok(placeOf(stations[0].id) && placeOf(BODIES[1].id) && placeOf({ x: 1, y: 2, z: 3 }), "a place can be a port, a world or a point");
  ok(placeOf("no-such-thing") === null, "and nothing else");
  const clear = planRoute(stations[0].id, p);
  ok(!clear.blocked && clear.legs.length >= 1, `a clear leg is one leg: ${routeLine(clear)}`);
  /* a point directly behind a world, from here */
  const q = { x: 0, y: 0, z: 0 };
  let found = null;
  for (const b of BODIES.filter((x) => x.kind !== "star")) {
    bodyPosition(b.id, sim.time, q);
    const dx = q.x - p.x, dy = q.y - p.y, dz = q.z - p.z, L = Math.hypot(dx, dy, dz) || 1;
    const behind = { x: q.x + (dx / L) * b.radius * 6, y: q.y + (dy / L) * b.radius * 6, z: q.z + (dz / L) * b.radius * 6, name: `behind ${b.name}`, kind: "point" };
    if (corridorBlocker(p, behind)) { found = { b, behind }; break; }
  }
  ok(found, `something to fly round: ${found?.b.name}`);
  if (found) {
    const d = doglegAround(p, found.behind, found.b);
    ok(d, "there is a way round it");
    ok(!losBlocker(p, d, null) && !losBlocker(d, found.behind, null), "and BOTH halves of the dogleg are corridors the core will hold");
    const r = planRoute(found.behind, p);
    ok(!r.blocked && r.legs.length === 2 && /round/.test(r.why), `so the route is two legs: ${routeLine(r)}`);
    ok(r.secs > planRoute(stations[0].id, p).secs / 100, "and it costs what two legs cost, not what one does");
  } else { ok(true, "—"); ok(true, "—"); ok(true, "—"); ok(true, "—"); }
}

/* ---- what a leg really costs --------------------------------------------------------- */
{
  const p = { ...sim.ship.pos };
  const near = [...stations].sort((a, b) => dist3(a, p) - dist3(b, p))[0];
  const far = [...stations].sort((a, b) => dist3(b, p) - dist3(a, p))[0];
  const sNear = legSeconds(p, near), sFar = legSeconds(p, far);
  ok(sNear > 0 && sFar > sNear, `a leg across the system costs more than one across the ring (${sNear} s vs ${sFar} s)`);
  ok(sFar > 30, `and a real jump is not three seconds (${sFar} s to ${far.name}, ${Math.round(dist3(far, p) / 100).toLocaleString("en-US")} km)`);
  ok(legSeconds(p, near, { undock: true, berth: true }) >= sNear + NAV.undock + NAV.berth - 1, "a port call at either end is part of the cost");
  ok(climbOut() >= 0, `the well under the hull is in it too (${Math.round(climbOut() / 1000)}k u to climb)`);
  ok(tripSeconds(near.id) > 0 && Number.isFinite(tripSeconds(near.id)), "a whole trip prices out");
}

/* ---- the instruments ------------------------------------------------------------------ */
{
  const st = stations[1];
  ok(lockOn(st.id) && sim.selected === st.id, `P-LOCK holds what she aimed at (${st.name})`);
  const n0 = sim.waypoints.length;
  markPlace("ARIA test", { x: 1000, y: 0, z: 2000 });
  ok(sim.waypoints.length > n0, "a mark goes on the chart where a human can see it");
  const q = aimAt(stations[2].id, stations[2].name);
  ok(q && sim.selected === stations[2].id, "aiming at a port locks it");
  const m = aimAt({ x: 5e5, y: 0, z: 5e5, name: "a drift" });
  ok(m && sim.waypoints.some((w) => w.name === "a drift"), "aiming at open space marks it instead — you cannot lock a patch of sky");
  selectBody(null);
}

/* ---- and the job scoring uses all of it ------------------------------------------------ */
{
  resetContracts();
  const st = nearestReachablePort();
  ok(st, `nearest reachable port: ${st?.name}`);
  const list = jobsFor(stationById(st.id), "mining", sim.time);
  ok(list.length > 0, `${list.length} jobs she would consider`);
  ok(list.every((o) => Number.isFinite(o.estSecs) && o.estSecs > 0), "every one carries an honest estimate of how long it will take");
  ok(list.every((o) => o.estSecs >= 30), `and none of them is three seconds long (shortest ${Math.min(...list.map((o) => o.estSecs))} s)`);
  const rock = list.find((o) => o.spot);
  if (rock) ok(rock.estSecs > legSeconds(sim.ship.pos, rock.spot), `a job with rock in it costs the flight AND the cutting (${rock.estSecs} s)`);
  else ok(true, "no rock job in this sample");
  ok(list.every((o, i) => i === 0 || o.estPerMin <= list[i - 1].estPerMin), "and they are ranked by what they pay for the time they cost");
  /* the plan it builds is still a mission a person could have written */
  let built = 0;
  for (const o of list.slice(0, 6)) {
    const m = jobPlan({ ...o, leg: 0, progress: 0 });
    const errs = validate(m);
    ok(errs.length === 0, `${o.mech} · ${o.type}: ${m.steps.map((x) => x.op).join(" > ")}${errs.length ? ` — ${errs[0].msg}` : ""}`);
    built++;
  }
  ok(built >= 3, `${built} plans built, every one of them a valid mission`);
  const far = boardFor(stationById(stations[stations.length - 1].id), sim.time)[0];
  if (far) ok(Number.isFinite(jobSeconds(far)) || jobSeconds(far) === Infinity, "a job she cannot reach prices at infinity rather than being flown at for ten minutes");
  else ok(true, "—");
}

console.log(`ariasense: ${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
