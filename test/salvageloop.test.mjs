/* LIVING GALAXY 0.3.90 — Dead Hulls: the loop.
 *
 *   node --import ./test/three-register.mjs test/salvageloop.test.mjs
 *
 * Salvage had its verb (the rig, 0.3.87) and nothing that flew it. This is
 * the rest of the career, pinned:
 *
 *   1. SALVAGE is a mission op: it validates, it has a preset, and it picks
 *      the hulk worth most for the time it costs;
 *   2. flown headless it closes on a hulk, strips it bridge last, the tractor
 *      reels the plate aboard and the op ends by itself; a low battery rests
 *      the rig rather than standing the mission down;
 *   3. a hulk somebody is working is not the one the cap throws away;
 *   4. a wreck job is a real, pinned hulk, and salvage work counts only steel
 *      that came off a hulk under the rig — mill steel does not fill it;
 *   5. a flight recorder pays at an honest port;
 *   6. ARIA plans it — the terminal player and the conn — and a pilot can
 *      start the loop by hand; a plan started by hand flies round a world;
 *   7. the tutorial's salvage branch is the rig's; the career is open;
 *   8. the open loops from 0.3.88: the break-off line lifts on a low battery,
 *      and a belt drone counts toward a cull;
 *   9. what the parity bench found: a wreck off a tethered port rides that
 *      port's world and lies on its open side; the autopilot's brake comes to
 *      rest against what it is flying to, not against the nearest world; a
 *      hulk with a raider still over it is not picked; AUTO cuts for an order
 *      and strips a wreck with no plate to spare; and a hull waiting on the
 *      core's reserve sheds load instead of sitting there.
 */
import { readFileSync } from "node:fs";

const store = new Map();
globalThis.localStorage ??= { getItem: (k) => (store.has(k) ? store.get(k) : null), setItem: (k, v) => store.set(k, String(v)), removeItem: (k) => store.delete(k) };
{ let a = 0x51ed270b; Math.random = () => { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }

const { sim, launchSim, tickSim, handInRecorders, recorderValue, losBlocker, warpDestination, warpNodeById, wellEdge } = await import("../js/sim/sim.js");
const { makePilot, pilot } = await import("../js/flight/pilot.js");
const { touch } = await import("../js/core/input.js");
const { stations } = await import("../js/station/stations.js");
const { BODIES, bodyPosition } = await import("../js/world/bodies.js");
const { contacts } = await import("../js/flight/turrets.js");
const { batteryCap, cargoTotal } = await import("../js/flight/ship.js");
const { hullMaxOf } = await import("../js/flight/repair.js");
const { hulks, spawnHulk, hulkById, resetHulks, hulkManifest, HULK, plateOf, hullForPlate } = await import("../js/world/hulks.js");
const { rig, nextSection } = await import("../js/flight/rig.js");
const { OPS, validate, makeMission, makeStep, presets, describeStep } = await import("../js/mission/script.js");
const { mission, startMission, stopMission, EXEC } = await import("../js/mission/run.js");
const { autopilot, engageSalvageLoop } = await import("../js/flight/autopilot.js");
const { SALV, bestHulk, hulkWorth, cutSeconds, rigModeFor, skipHulk, forgetSkipped, salvageReport } = await import("../js/mission/salvage.js");
const { contracts, boardFor, acceptContract, noteSalvaged, noteDestroyed, deliverableAt, deliverContracts, jobStatus, tickContracts } = await import("../js/economy/contracts.js");
const { ariaMind, resetMind, breakLine, BREAK } = await import("../js/aria/mind.js");
const { aria, wireAria } = await import("../js/aria/aria.js");
const { ariaPilot, planJob, shouldBreakOff, beginAriaWatch, ARIA_JOBS } = await import("../js/aria/pilot.js");
const { beginPlay, endPlay, movesNow, jobPlan, setPlayRng } = await import("../js/aria/play.js");
const { careerStatus, isCareerOpen, openCareers, OPEN_GATE } = await import("../js/careers/status.js");
const { tutorial, startTutorial, tutorialEvaluate, tutorialContext, skipTutorial } = await import("../js/ui/tutorial.js");
const { chunks } = await import("../js/world/debris.js");

let pass = 0, fail = 0;
const ok = (c, m) => { if (c) pass++; else { fail++; console.error("  FAIL", m); } };
const HZ = 30;
const tick = (s, each = null) => { for (let i = 0; i < s * HZ; i++) { each?.(); tickSim(1 / HZ); } };
const d3 = (a, b) => Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z);
const honest = (st) => !(st.hostile && !st.claimed) && st.sector !== "pirate" && st.hangars?.length;

makePilot("Salvor", "terran", "salvage", null);
launchSim("SalvageLoop", "sol");
sim.phase = "play";
wireAria();
touch.panX = touch.panY = touch.rcsX = touch.rcsY = 0;
sim.dropoutRoll = 1;
const ship = sim.ship;
tick(1);
const whole = () => { ship.hull = hullMaxOf(ship); ship.charge = batteryCap(ship); };
const park = (x, y, z) => { ship.dockedAt = null; ship.pos.x = x; ship.pos.y = y; ship.pos.z = z; ship.vel.x = ship.vel.y = ship.vel.z = 0; };
/* high over the ecliptic: no well, no belt, no traffic, nothing across any lane */
const OPEN = { x: 150000, y: 3200000, z: 150000 };
const clearSky = () => { resetHulks(); forgetSkipped(); chunks.length = 0; contacts.length = 0; sim.recorders.length = 0; };
const hulkAt = (dx, opts = {}, v = {}) => spawnHulk({ id: `t:${Math.random()}`, name: v.name ?? "Test Hull", ship: v.ship ?? "general_a", cargo: v.cargo ?? null, x: OPEN.x + dx, y: OPEN.y, z: OPEN.z }, { source: "test", intact: 1, ...opts });

/* ---- 1. the op, the preset, the pick ------------------------------------------- */
{
  ok(OPS.SALVAGE && typeof EXEC.SALVAGE === "function", "SALVAGE is an op with a handler");
  ok(validate(makeMission({ steps: [makeStep("SALVAGE", { kind: "best-hulk" })] })).length === 0, "SALVAGE at the best hulk validates");
  ok(validate(makeMission({ steps: [makeStep("SALVAGE", { kind: "hulk" })] })).some((e) => /no id/.test(e.msg)), "a named hulk needs its id");
  ok(validate(makeMission({ steps: [makeStep("SALVAGE", { kind: "seam" })] })).some((e) => /cannot target/.test(e.msg)), "it cannot be pointed at a seam");
  ok(validate(makeMission({ steps: [makeStep("SALVAGE", { kind: "best-hulk" }, { args: { mode: "melt" } })] })).some((e) => /mode/.test(e.msg)), "the rig mode is cut, strip or auto");
  const p = presets().find((x) => x.id === "preset-salvage");
  ok(p && p.builtin && validate(p).length === 0 && p.steps.map((s) => s.op).join(",") === "SALVAGE,DOCK,SELL,CHARGE", "SALVAGE LOOP preset: cut, dock, sell, charge");
  ok(/STRIP/.test(describeStep(p.steps[0])), `a step says its mode (${describeStep(p.steps[0])})`);

  clearSky(); park(OPEN.x, OPEN.y, OPEN.z); whole(); tick(1);
  ok(bestHulk() === null && salvageReport().best === null, "an empty sky has no best hulk");
  const poor = hulkAt(2000);
  const rich = hulkAt(30000, {}, { ship: "general_c", cargo: { id: "motor", qty: 40 } });
  const b = bestHulk();
  ok(hulkWorth(rich) > hulkWorth(poor) * 3, `the far hulk is worth several of the near one (${hulkWorth(rich)} vs ${hulkWorth(poor)})`);
  ok(b?.h === rich, `the pick is credits per second, not distance (${b?.h.name === rich.name ? "the rich one" : "the near one"}, ${Math.round((b?.score ?? 0) * 60)} cr/min)`);
  ok(hulkWorth(rich, "cut") < hulkWorth(rich, "strip"), "CUT leaves the parts and half the hold behind, and the pick knows it");
  ok(cutSeconds(poor, ship, "cut") < cutSeconds(poor, ship, "strip"), "CUT is the quicker of the two");
  skipHulk(rich.id);
  ok(bestHulk()?.h === poor, "a hulk the rig would not take is left alone for a while");
  forgetSkipped();
  rich.life = rich.age + 30;
  ok(bestHulk()?.h === poor, "a hulk that will age out before she is done is not picked");
  rich.life = HULK.life;
  const pirate = stations.find((s) => s.hostile && !s.claimed);
  if (pirate) { const under = spawnHulk({ id: "t:guns", name: "Under The Guns", ship: "general_c", cargo: { id: "motor", qty: 400 }, x: pirate.x + 3000, y: pirate.y, z: pirate.z }, { source: "test", intact: 1 }); ok(bestHulk()?.h !== under, "nor one lying under a hostile port's guns, whatever is in it"); }
  ok(rigModeFor("auto") === "strip" && rigModeFor("cut") === "cut", "auto strips while it is quiet");
  contacts.push({ id: "t:h", relation: "hostile", hp: 10, x: ship.pos.x + 900, y: ship.pos.y, z: ship.pos.z });
  ok(rigModeFor("auto") === "cut", "…and cuts when something hostile is close");
  contacts.length = 0;
}

/* ---- 2. flown: close, strip, reel, done; and the rig rests on a low battery ---- */
{
  clearSky(); park(OPEN.x, OPEN.y, OPEN.z); whole(); tick(1);
  ship.hold = {}; ship.cargoCap = Math.max(ship.cargoCap, 2000); ship.rigMode = "off";
  const h = hulkAt(3000, {}, { name: "Loop Test", cargo: { id: "water", qty: 20 } });
  const plate = hulkManifest(h).plate, parts = hulkManifest(h).partCount, water = hulkManifest(h).cargoCount;
  ok(startMission(makeMission({ name: "by hand", builtin: true, steps: [makeStep("SALVAGE", { kind: "hulk", id: h.id, name: h.name }, { args: { mode: "strip" } })] })), "a hand-started SALVAGE mission starts");
  let sawRig = false, order = [], rested = false, resumed = false, sawCharge = false;
  for (let i = 0; i < 420 * HZ && mission.active; i++) {
    tickSim(1 / HZ);
    if (rig.active && rig.key === h.id) { sawRig = true; if (order.at(-1) !== rig.section) order.push(rig.section); }
    /* halfway through, drain the battery once: the rig must be rested, not the mission stood down */
    if (sawRig && !rested && (ship.hold.steel ?? 0) > 2) { ship.charge = batteryCap(ship) * 0.25; rested = true; }
    if (rested && !resumed) { if (autopilot.phase === "charge" && ship.rigMode === "off") sawCharge = true; if (sawCharge && ship.rigMode === "strip") resumed = true; }
  }
  ok(sawRig, "she closed on the hulk and the rig took it");
  ok(order.at(-1) === "bridge" && order.length >= 2, `sections in order, bridge last (${order.join(" → ")})`);
  ok(sawCharge && resumed, "a battery at 25% rested the rig, and it came back on when the battery did");
  ok(mission.state === "done" && !mission.active, `the op ended by itself (${mission.state})`);
  ok(!hulkById(h.id), "the hulk is cut up and gone");
  ok(Math.abs((ship.hold.steel ?? 0) - plate) < 2, `STRIP brought all the plate aboard through the tractor (${Math.round(ship.hold.steel ?? 0)} of ${plate})`);
  const gotParts = Object.entries(ship.hold).filter(([k]) => k !== "steel" && k !== "water").reduce((a, [, q]) => a + q, 0);
  ok(gotParts === parts && water > 0 && (ship.hold.water ?? 0) === water, `…and the parts and what was left in its hold with it (${gotParts}/${parts} parts, ${ship.hold.water ?? 0}/${water} water)`);
  ok(sim.recorders.length === 1 && sim.recorders[0].tier, "the flight recorder is aboard, with the hull's tier on it");
  ok(ship.rigMode === "off", "the rig goes back to how the pilot had it");
  ok(!sim.waypoints.some((w) => w.transient), "no mission mark is left behind");
}

/* ---- 3. the cap does not take a hulk from under the beam ------------------------ */
{
  clearSky();
  const worked = hulkAt(1000, {}, { name: "Being Worked" });
  worked.busyUntil = sim.time + 60;
  for (let i = 0; i < HULK.max + 10; i++) hulkAt(5000 + i * 500, {}, { name: `Filler ${i}` });
  ok(hulks.length === HULK.max && hulkById(worked.id), `the sky filled to its cap of ${HULK.max} and the hulk being worked is still there`);
  worked.busyUntil = sim.time - 1;
  hulkAt(90000);
  ok(!hulkById(worked.id), "left alone, it is the oldest and goes like any other");
}

/* ---- 4. jobs on hulks ------------------------------------------------------------- */
{
  clearSky(); contracts.active.length = 0; ship.hold = {}; ship.dockedAt = null;
  const offers = stations.filter(honest).flatMap((s) => boardFor(s));
  const w = offers.find((o) => o.type === "wreck");
  const pl = offers.find((o) => o.type === "salvage");
  ok(w && pl, "the board carries wreck and plate work");
  ok(w.good === HULK.plate && pl.good === HULK.plate && w.pay > w.qty * 41 && pl.pay > pl.qty * 41, `both ask for hull steel and pay more than a shelf does (${pl.qty} for ${pl.pay} cr, ${w.qty} for ${w.pay} cr)`);
  ok(acceptContract(w) === null, `accepted "${w.title}"`);
  const a = contracts.active.find((x) => x.id === w.id);
  const h = hulkById(a.hulkId);
  ok(h && h.pinned && h.source === "contract", "signing puts a real, pinned hulk at the site");
  ok(hulkManifest(h).plate >= a.qty * 1.1 && plateOf(hullForPlate(a.qty)) >= a.qty, `…with enough plate on it for the order (${hulkManifest(h).plate} for ${a.qty})`);
  ok(sim.waypoints.some((x) => x.job === a.id && x.anchor?.kind === "hulk"), "and the waypoint is anchored to the hulk itself");
  ok(/rig on/.test(jobStatus(a)), `the job says what to do (${jobStatus(a)})`);
  const st = stations.find((s) => s.id === a.stationId);
  ship.dockedAt = st.id; ship.hold = { steel: a.qty + 5 };
  ok(!deliverableAt(st.id).includes(a), "a hold full of mill steel does not fill it — nothing came off a hulk");
  ok(noteSalvaged("steel", 7, "some-other-hulk") === 0 && a.cut === 0, "nor does plate off some other hulk, while this wreck is still there");
  noteSalvaged("steel", a.qty, a.hulkId);
  ok(a.cut === a.qty && deliverableAt(st.id).includes(a), "plate reeled off the wreck does");
  const cr = ship.credits;
  ok(deliverContracts(st.id) === a.pay && ship.credits === cr + a.pay && (ship.hold.steel ?? 0) === 5, `delivered and paid ${a.pay} cr`);
  ok(h.pinned === false, "the wreck is released to age out with the rest");

  /* an open plate job takes plate off any hulk */
  ok(acceptContract(pl) === null, `accepted "${pl.title}"`);
  const b = contracts.active.find((x) => x.id === pl.id);
  ok(b.cut === 0 && !b.hulkId && /any hulk/.test(jobStatus(b)), `an open plate job (${jobStatus(b)})`);
  noteSalvaged("steel", 3, "whatever");
  ok(b.cut === 3, "counts plate off whatever hulk it came from");
  tickContracts(0.1);
  ok(Math.abs(b.progress - 3 / b.qty) < 1e-6, "and its progress is the count, not the hold");
  contracts.active.length = 0; ship.hold = {}; ship.dockedAt = null;
}

/* ---- 5. a recorder pays ---------------------------------------------------------- */
{
  const st = stations.find(honest);
  sim.recorders.length = 0;
  sim.recorders.push({ name: "Wren", tier: "B", at: sim.time }, { name: "Kestrel", tier: "D", at: sim.time });
  const due = recorderValue({ tier: "B" }) + recorderValue({ tier: "D" });
  ship.dockedAt = null;
  ok(handInRecorders() === 0 && sim.recorders.length === 2, "nothing is paid in space");
  const bad = stations.find((s) => s.hostile && !s.claimed);
  if (bad) { ship.dockedAt = bad.id; ok(handInRecorders() === 0, "nor at a free port"); }
  ship.dockedAt = st.id;
  const cr = ship.credits;
  ok(handInRecorders() === due && ship.credits === cr + due && sim.recorders.length === 0, `an honest port's adjuster pays for both (${due} cr), a bigger hull more`);
  ship.dockedAt = null;
}

/* ---- 6. ARIA plans it; a pilot starts it by hand --------------------------------- */
{
  clearSky(); park(OPEN.x, OPEN.y, OPEN.z); whole(); tick(1);
  ship.hold = {}; ship.credits = 1500;
  const h = hulkAt(4000, {}, { ship: "general_c", name: "Plan Test" });

  /* the conn */
  resetMind(); aria.prefs.job = {}; beginAriaWatch();
  ok(ARIA_JOBS.includes("salvage"), "salvage is one of ARIA's jobs");
  let p = planJob();
  ok(p.job === "salvage" && p.mission.steps[0].op === "SALVAGE" && p.mission.steps.some((s) => s.op === "SELL" && s.args.what === "all") && validate(p.mission).length === 0, `a salvage pilot's ARIA goes for the hulk (${p.job} — ${p.why})`);
  pilot.complexId = "mining";
  p = planJob();
  ok(p.job !== "salvage", `a miner's does not, unwatched (${p.job})`);
  pilot.complexId = "salvage";

  /* the terminal player */
  setPlayRng(() => 0.99);
  beginPlay({ career: "salvage", name: "SALV" });
  ok(movesNow().some((m) => m.key === "salvage"), "the terminal player has a free-salvage move when there is a hulk");
  contracts.active.length = 0;
  const w = stations.filter(honest).flatMap((s) => boardFor(s)).find((o) => o.type === "wreck" && !o.taken);
  ok(w && acceptContract(w) === null, "a wreck job is signed");
  const a = contracts.active.find((x) => x.id === w.id);
  const m = jobPlan(a);
  const sv = m.steps.find((s) => s.op === "SALVAGE");
  ok(sv && sv.target.kind === "hulk" && sv.target.id === a.hulkId && String(sv.args.job) === String(a.id) && sv.args.mode === "auto", "her plan for it puts the rig on that hulk, for that job");
  ok(validate(m).length === 0 && m.steps.at(-1).op === "DOCK", "and ends at the port that posted it");
  endPlay(); contracts.active.length = 0;

  /* by hand */
  park(OPEN.x, OPEN.y, OPEN.z); whole(); tick(1);
  ok(engageSalvageLoop() && mission.active?.name === "SALVAGE LOOP" && mission.active.steps[0].op === "SALVAGE", `SALVAGE from the console starts the loop (${sim.notice})`);
  stopMission("test", { quiet: true });
  clearSky();
  ok(engageSalvageLoop() === false && /No hulk/.test(sim.notice), "with no hulk in the sky it says so and starts nothing");
}

/* ---- 6b. a plan started by hand flies round a world ------------------------------ */
{
  const st = stations.filter(honest)[0];
  const dest = warpDestination(warpNodeById(st.id), { x: 0, y: 0, z: 0 });
  const p = { x: 0, y: 0, z: 0 };
  let spot = null;
  for (const b of BODIES) {
    if (b.kind === "star" || !bodyPosition(b.id, sim.time, p)) continue;
    const d = d3(p, dest);
    if (d < 300000) continue;
    const out = Math.max(wellEdge(b) * 2.5, b.radius * 12, 60000);
    const q = { x: p.x + ((p.x - dest.x) / d) * out, y: p.y + ((p.y - dest.y) / d) * out, z: p.z + ((p.z - dest.z) / d) * out };
    if (losBlocker(q, dest, null)?.id === b.id) { spot = q; break; }
  }
  park(spot.x, spot.y, spot.z); whole(); tick(1);
  ok(startMission(makeMission({ name: "two steps", builtin: true, steps: [makeStep("DOCK", { kind: "station", id: st.id, name: st.name }), makeStep("CHARGE")] })), "a two-step plan with a world across its first lane starts");
  let detoured = false;
  tick(15, () => { if (mission.run?.detour) detoured = true; });
  ok(detoured && mission.state === "running", `it takes the dogleg and keeps flying (${mission.state})`);
  stopMission("test", { quiet: true });
  tick(10);
}

/* ---- 7. the tutorial and the gate ------------------------------------------------- */
{
  clearSky(); park(OPEN.x, OPEN.y, OPEN.z); whole(); tick(1);
  startTutorial(true);
  tutorial.step = 3;
  let e = tutorialEvaluate();
  ok(e.title === "RIG" && /Salvage board/.test(e.text) && e.action === null, "with no hulk about, the salvage step is RIG and points at the board");
  const far = hulkAt(400000, {}, { name: "Far One" });
  e = tutorialEvaluate();
  ok(/Far One/.test(e.text) && e.action === "MARK HULK", `a distant hulk is named and can be marked ("${e.text.slice(0, 60)}…")`);
  const near = hulkAt(1500, {}, { name: "Near One" });
  e = tutorialEvaluate();
  ok(/Near One/.test(e.text) && /STRIP/.test(e.text) && /recorder/.test(e.text), "one in reach is the lesson: close, hold, STRIP keeps the recorder");
  ok(tutorialContext().hulk?.id === near.id, "the context carries the nearest hulk");
  pilot.complexId = "mining";
  ok(tutorialEvaluate().title === "CUT", "a miner's step is still CUT");
  pilot.complexId = "salvage";
  skipTutorial();
  void far;

  const s = careerStatus("salvage");
  ok(s.open && isCareerOpen("salvage") && OPEN_GATE.every((g) => s.has.includes(g)) && s.missing.length === 0, "Salvage has all nine and is open");
  ok(openCareers().includes("mining") && openCareers().length === 2, `two careers open (${openCareers().join(", ")})`);
}

/* ---- 8. the open loops from 0.3.88 ------------------------------------------------ */
{
  resetMind();
  ok(breakLine(1) === ariaMind.orders.repairBelow && breakLine(0.1) === Math.min(BREAK.top, ariaMind.orders.repairBelow + BREAK.lift), `the break-off line is the repair line, lifted on a low battery (${breakLine(1)} → ${breakLine(0.1)})`);
  clearSky(); park(OPEN.x, OPEN.y, OPEN.z); whole(); ship.credits = 20000; ship.dockedAt = null;
  beginAriaWatch();
  contacts.push({ id: "t:h", relation: "hostile", hp: 10, x: ship.pos.x + 500, y: ship.pos.y, z: ship.pos.z });
  ship.hull = hullMaxOf(ship) * 0.68;
  ok(shouldBreakOff() === null, "hull at 68%, full battery, a contact close: she works on");
  ship.charge = batteryCap(ship) * 0.15;
  ok(shouldBreakOff() !== null, "the same hull with the battery at 15% breaks off — the run home is a coast");
  ariaPilot.yardRun = true;
  const p = planJob();
  ok(p.job === "repair", `…and the plan after a break-off is the yard, though the hull is over the repair line (${p.job})`);
  contacts.length = 0; whole();

  contracts.active.length = 0;
  const cull = { id: "cull-test", type: "rogues", mech: "kill", killKind: "rogue", count: 2, kills: 0, progress: 0, deadline: sim.time + 999, stationId: stations[0].id, stationName: stations[0].name, title: "Drone cull" };
  contracts.active.push(cull);
  noteDestroyed({ rogue: true });
  ok(cull.kills === 1 && cull.progress === 0.5, "a rogue drone down counts toward a cull");
  ok(/c\.kind === "drone" && !c\.stationId && !c\.corpDrone\) noteDestroyed\(\{ rogue: true \}\)/.test(readFileSync(new URL("../js/sim/sim.js", import.meta.url), "utf8")), "and the belt's own drones are reported as exactly that when they die");
  contracts.active.length = 0;
}

/* ---- 9. what the parity bench found ---------------------------------------------- */
{
  const { traffic } = await import("../js/npc/traffic.js");
  const { matchFrame } = await import("../js/flight/autopilot.js");
  const { tendBus, PLAY } = await import("../js/aria/play.js");
  const { RIG } = await import("../js/flight/rig.js");

  clearSky(); contracts.active.length = 0; ship.hold = {}; park(OPEN.x, OPEN.y, OPEN.z); whole();
  const w = stations.filter((s) => honest(s) && s.hostId).flatMap((s) => boardFor(s)).filter((o) => o.type === "wreck" && o.wreckAt?.off && !o.taken).find((o) => acceptContract(o) === null);
  ok(Boolean(w), "a tethered port posts a wreck job she can sign");
  if (w) {
    const a = contracts.active.find((x) => x.id === w.id);
    const st = stations.find((x) => x.id === a.stationId);
    const h = hulkById(a.hulkId);
    const host = { x: 0, y: 0, z: 0 };
    bodyPosition(st.hostId, sim.time, host);
    ok(a.wreckAt.off.x * (st.x - host.x) + a.wreckAt.off.z * (st.z - host.z) > 0, "the wreck lies on the open side of the port, not through the world behind it");
    ok(h.parent === st.hostId, `and rides that world, inside its sphere of influence or not (${h.parent})`);
    const d0 = d3(h, st), p0 = { x: h.x, y: h.y, z: h.z };
    tick(60);
    ok(Math.abs(d3(h, st) - d0) < 200 && d3(h, p0) > 600, `a minute on it is still ${Math.round(d3(h, st) / 100)} km off the port, ${Math.round(d3(h, p0) / 100)} km from where it was signed`);
    contracts.active.length = 0;
  }

  clearSky(); park(OPEN.x, OPEN.y, OPEN.z); whole();
  matchFrame({ x: 12, y: 0, z: -7 });
  ok(sim.apFrame.x === 12 && sim.apFrame.until > sim.time, "the autopilot names the velocity its brake is to match");
  tick(25, () => { matchFrame({ x: 12, y: 0, z: -7 }); touch.brake = true; });
  ok(Math.hypot(ship.vel.x - 12, ship.vel.y, ship.vel.z + 7) < 2, `the brake comes to rest against it (${ship.vel.x.toFixed(1)}, ${ship.vel.z.toFixed(1)})`);
  tick(25, () => { touch.brake = true; });
  ok(Math.hypot(ship.vel.x, ship.vel.y, ship.vel.z) < 2, "and against the local frame again a moment after the autopilot stops asking");
  touch.brake = false;

  clearSky(); park(OPEN.x, OPEN.y, OPEN.z);
  const hh = hulkAt(3000);
  ok(bestHulk()?.h === hh, "a quiet hulk is picked");
  traffic.push({ id: "t:raider", role: "pirate", job: "hunt", x: hh.x + 2000, y: hh.y, z: hh.z });
  ok(bestHulk() === null && bestHulk({ hot: true })?.h === hh, "not with a raider still over it — unless the pilot asks for it");
  traffic.pop();
  const plate = hulkManifest(hh).plate;
  ok(rigModeFor("auto", ship.pos, { job: { qty: 40, cut: 0 }, h: hh }) === "cut", "AUTO on an open plate order is CUT: the order wants plate");
  hh.pinned = true;
  ok(rigModeFor("auto", ship.pos, { job: { qty: Math.round(plate * RIG.cutYield), cut: 0, hulkId: hh.id }, h: hh }) === "strip", "AUTO on a wreck with no plate to spare is STRIP, which loses none");
  ok(rigModeFor("auto", ship.pos, { job: { qty: Math.round(plate * 0.5), cut: 0, hulkId: hh.id }, h: hh }) === "cut", "and CUT when the wreck has plenty");
  ok(RIG.cut / RIG.strip === 2.5 && RIG.strip >= 1, `the rig keeps its 2.5:1 and now works at a salvor's pace (${RIG.strip}/s strip, ${RIG.cut}/s cut)`);

  clearSky(); park(OPEN.x, OPEN.y, OPEN.z); whole();
  beginPlay({ career: "salvage", name: "Bus", rng: Math.random });
  ship.charge = batteryCap(ship) * 0.55;
  if (!ship.localGravity) ship.localGravity = true;
  ship.salvage = true;
  stopMission("test");
  tendBus();
  ok(ship.localGravity && ship.salvage, "at 55% with nothing asked of the core she sheds nothing");
  autopilot.on = true; autopilot.phase = "charge"; autopilot.chargeSince = sim.time - PLAY.chargeWait - 1;
  for (let i = 0; i < 6; i++) tendBus();
  ok(!ship.localGravity && !ship.salvage, "ten seconds short of the core's reserve, gravity and the tractor come off the bus");
  autopilot.on = false; autopilot.phase = "idle"; autopilot.chargeSince = null;
  endPlay();
}

console.log(`salvageloop: ${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
