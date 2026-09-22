/* LIVING GALAXY — ARIA at the conn, flying your jobs the way you fly them.
 *
 * 0.3 let ARIA hold the conn like a crew captain: every second it asked the
 * house core for a reflex and then STEERED — a pan toward the target and a
 * throttle, with no avoidance, no power rule, no warp plotting, no docking
 * lane and no idea what to do once it got somewhere. It could point at a belt;
 * it could not work one.
 *
 * The autopilot could. The mission runner (js/mission/run.js) already mines a
 * seam, docks on the lane, sells, smelts, charges and jumps, under the power
 * rule and the avoidance solver. So ARIA no longer flies the stick at all. It
 * is a PLANNER: it looks at the ship and at what YOU spend your time doing, and
 * hands the runner one job at a time —
 *
 *   repair   hull under 45%: the nearest port with a repair yard, dock, REPAIR
 *   sell     hold 85% full: dock where you sell (aria preferences lean the
 *            choice), then SELL, SMELT or STASH the way your plan is set
 *   mine     a seam, cut to 90%, then the same run to the desk
 *   survey   the nearest world not yet in the log
 *   refit    the money is in and the hull is whole: dock at a yard that fits
 *            the kit its job wants, and buy it (0.3.06)
 *   build    the company can stand a drone that does its job while the ship
 *            does something else: dock and put one on the line (0.3.06)
 *
 * — and which job is YOUR job is counted, not guessed: every five seconds of
 * your own flying is labelled by what you were doing (captain.js already takes
 * that label for the house core) and tallied under `aria.prefs.job`, and a
 * mission you start yourself counts three. ARIA picks the job you do most that
 * the ship can do right now. With nothing to go on it mines if there is a belt
 * and surveys if there is not, and says so.
 *
 * The last two are not habits and are never learned as one — you do not fly a
 * refit — so they are picked by a separate, deliberately cautious rule: a
 * reserve it will not spend, one purchase per cooldown, nothing bought with a
 * hurt hull or a hostile close, and only at a port near enough that the trip
 * costs less than the kit returns. What it buys is chosen by the job you do
 * most, because the cutter that helps a miner is worth more to you than
 * whatever happens to be cheapest.
 *
 * Touch the stick and you have the ship back. Docked, it buys hull at the yard
 * and sells a hold before it goes out again, like you would. Under fire it puts
 * the guns on CASTLE; on a bus that cannot carry itself it sheds the cutter and
 * gravity rather than standing down.
 */

import { sim, logEvent, setTurretMode, setMiningMode, toggleSystem } from "./sim.js";
import { cargoTotal, holdRoom } from "./ship.js";
import { stations, stationById } from "./stations.js";
import { BODIES, dist3 } from "./bodies.js";
import { contacts } from "./turrets.js";
import { captain, ariaHooks as hooks } from "./npc/captain.js";
import { autopilot, nearestSeam, busOverload, pilotInput } from "./autopilot.js";
import { mission, startMission, stopMission, EXEC } from "./mission/run.js";
import { makeMission, makeStep } from "./mission/script.js";
import { repairsAt, pricePerPoint, yardRepair, hullMaxOf } from "./repair.js";
import { upgradeOptions, buyUpgrade, hasUpgrade, effectOf } from "./upgrades.js";
import { buildOptions, orderBuild } from "./drones/ops.js";
import { orderFab, planJob as planFab, canFabAt, fabMenuAt, maxRunnable, fabQueueAt, FAB } from "./fabricate.js";
import { neighbours, snapshot } from "./recorder.js";
import { company, hasCompany } from "./company.js";


export const ARIA_JOBS = ["mine", "sell", "survey", "repair", "refit", "build", "fabricate"];
/* The two jobs the pilot never "does" in a way the play-labeller can see — you
 * do not fly a refit, you stop and buy one — so they are never learned as a
 * habit and are never picked by the habit weighting below. They are picked by
 * the investment rule, which is a different question: not "what does he do
 * most" but "the ship is idle, the money is in, what would make the next hour
 * better". Kept in ARIA_JOBS so failures are counted and reported like any
 * other job. */
export const INVEST_JOBS = ["refit", "build"];
/* Fabricating is not an investment and not a habit either — it is what to do
 * with a hold of ore, so it sits beside "sell" rather than beside "refit". */
const LABEL_JOB = { mine: "mine", survey: "survey", dock: "sell" };

export const ariaPilot = {
  job: null,          // what it is doing now
  why: "",
  planAt: 0,          // next sim time it may plan
  fails: {},          // job → consecutive failures
  jobs: 0,            // jobs handed to the runner this watch
  creditsAt: 0,
  shed: false,
  investAt: 0,        // next sim time it may spend money on the ship or a drone
  fabAt: 0,           // next sim time it may stop at a works
  bought: [],         // what it has bought this watch, for the report
};

/* ---- your habits -------------------------------------------------------- */

let prefs = null;     // aria.prefs, bound by wireAriaPilot (aria.js imports this module)
let say = null;

/** A job the player did with their own hands. */
export function notePlayerJob(job, weight = 1) {
  if (!prefs || !ARIA_JOBS.includes(job)) return;
  prefs.job ??= {};
  prefs.job[job] ??= { n: 0, last: 0 };
  prefs.job[job].n += weight;
  prefs.job[job].last = sim.time ?? 0;
}

/** From captain.js's five-second play label. */
export function notePlayLabel(label) {
  const job = LABEL_JOB[label];
  if (job) notePlayerJob(job, 1);
}

/** Your share of each job, 0..1, and how much has been seen. */
export function jobHabits() {
  const bag = prefs?.job ?? {};
  const total = ARIA_JOBS.reduce((a, j) => a + (bag[j]?.n ?? 0), 0);
  const share = {};
  for (const j of ARIA_JOBS) share[j] = total ? (bag[j]?.n ?? 0) / total : 0;
  return { share, total };
}

/* ---- the world, as the planner reads it ---------------------------------- */

function unsurveyed() {
  const ship = sim.ship;
  let best = null, bd = Infinity;
  for (const b of BODIES) {
    if (b.kind === "star" || sim.scanned?.has(b.id)) continue;
    const d = b.orbit ?? 0;
    const here = Math.abs(Math.hypot(ship.pos.x, ship.pos.z) - d);
    if (here < bd) { bd = here; best = b; }
  }
  return best;
}

/** The yard to take a hurt hull to: near, cheap, not shooting. */
export function bestRepairPort(ship = sim.ship) {
  let best = null, score = -Infinity;
  for (const st of stations) {
    if (!repairsAt(st) || !st.hangars?.length) continue;
    const s = -dist3(ship.pos, st) / 100000 - pricePerPoint(st) / 20;
    if (s > score) { score = s; best = st; }
  }
  return best;
}

function hostileNear(r = 6000) {
  const p = sim.ship.pos;
  return contacts.some((c) => c.hp > 0 && c.relation === "hostile" && Math.hypot(c.x - p.x, c.y - p.y, c.z - p.z) < r);
}

function deskSteps() {
  const onDock = sim.autoPlan?.onDock ?? "sell";
  if (onDock === "stash") return [makeStep("STASH", null, { args: { what: "all" } })];
  if (onDock === "smelt") return [makeStep("SMELT", null, { onFail: "skip" }), makeStep("SELL", null, { args: { what: "ore" } })];
  return [makeStep("SELL", null, { args: { what: "ore" } })];
}

/* ---- spending the takings ------------------------------------------------
 *
 * A watch that only mines and sells ends where it started with a bigger
 * number on the credit line. A pilot does not fly that way: when the money is
 * in and the ship is sitting at a port, they buy the thing that makes the next
 * run better — a wider cutter, another hold, or a drone to work a seam while
 * they work a different one. So ARIA does too.
 *
 * It is deliberately CONSERVATIVE, because it is spending the pilot's money
 * without being asked:
 *
 *   - a reserve is never touched, so a watch can always pay for repairs and a
 *     berth after the shopping;
 *   - one purchase per cooldown, so a windfall is not converted into six
 *     refits in a row;
 *   - nothing is bought with a hurt hull — plate comes after the hull is whole,
 *     which is the order the repair job above already enforces;
 *   - a shop trip has to be NEAR. Crossing the system to buy a cargo rack
 *     costs more in lost working time than the rack returns.
 *
 * What to buy is chosen by the habit, not by price: the kit that helps the job
 * this pilot actually does is worth more than the kit that is cheapest.
 */
const INVEST = {
  reserve: 15000,     // credits ARIA will not spend, whatever is on offer
  cooldown: 300,      // sim seconds between purchases
  minHull: 0.6,       // a hurt hull gets fixed before anything gets bought
  maxRange: 2.2e5,    // how far it will go to shop (u)
};

/** The refits that pay for themselves at each job, best first. */
const JOB_REFITS = {
  mine: ["cutter_array", "cutter_lens", "hold_expansion", "cargo_racks", "assay_deck", "ore_sorter"],
  sell: ["hold_expansion", "cargo_racks", "broker_suite", "trade_uplink"],
  survey: ["phased_array", "sensor_mast", "probe_rack"],
  repair: ["repair_drone", "nanofoam", "plating"],
};
/* Wanted whatever the pilot does: a drone that welds the hull in flight, and
 * the core that lets a mission be more than one step, are force multipliers
 * for every job on the board. */
const ALWAYS_REFITS = ["repair_drone", "nav_core"];

/** The drone that does the pilot's job while the pilot does it somewhere else. */
const JOB_DRONES = {
  mine: ["miner", "hauler"],
  sell: ["hauler", "courier"],
  survey: ["surveyor", "relay"],
  repair: ["repair", "salvager"],
};

const inRange = (ship, st) => dist3(ship.pos, st) <= INVEST.maxRange;

/* ---- turning a hold of rock into parts ------------------------------------
 *
 * The planner could only ever SELL a full hold. With a fabrication line on
 * every industrial yard (0.3.10) and ports paying a premium for finished work
 * they cannot do themselves (0.3.11), the better move is often to stop at the
 * yard, put the ore on the line, and go back to cutting while it runs.
 *
 * Two things decide it, and they are deliberately different in kind:
 *
 *   THE RULE. A margin-and-proximity test — enough in the hold to be worth a
 *   stop, a yard near enough that the trip is not the cost, and a part that
 *   clears a margin bar. Predictable, and one constant to turn.
 *
 *   THE TAPE. What the PILOT does in states like this one (js/recorder.js).
 *   The rule decides whether fabricating is defensible; the tape decides
 *   whether it is what you would have done. If your own record in similar
 *   situations leans toward the works, the bar comes down; if you consistently
 *   run ore straight to the desk, it goes up and ARIA keeps selling. It can
 *   only ever move the bar by a third either way — a tape with three records
 *   in it should not be able to talk the planner into anything.
 */
const FABRULE = {
  holdMin: 0.55,      // how full before a stop is worth it
  margin: 1.4,        // what the part must be worth against its raw ore
  lean: 0.33,         // the most the tape may move that bar, either way
  cooldown: 90,       // sim seconds between fabrication stops
};

/**
 * What the pilot's own tape says about states like this one.
 * → -1 (they sell raw) … 0 (no opinion) … +1 (they fabricate)
 */
export function fabLeaning() {
  let here = null;
  try { here = snapshot(); } catch { return 0; }
  if (!here) return 0;
  let near = [];
  try { near = neighbours(here, 12, { by: "player" }); } catch { return 0; }
  if (near.length < 4) return 0;          // not enough to have an opinion
  let fab = 0, raw = 0;
  for (const n of near) {
    const a = `${n.r.kind}:${n.r.act}`.toLowerCase();
    const arg = String(n.r.arg ?? "").toLowerCase();
    if (/fab/.test(a) || /works|fabric/.test(arg) || n.r.x?.p === "works") fab++;
    else if (/sell|smelt/.test(a) || /best-buyer|best-smelter/.test(arg)) raw++;
  }
  if (!fab && !raw) return 0;
  return (fab - raw) / (fab + raw);
}

/**
 * The best fabrication stop for what is in the hold right now.
 * → { st, good, name, qty, margin, plan } | null
 */
export function fabStop(ship = sim.ship) {
  const hold = { ...(ship.hold ?? {}) };
  if (!Object.keys(hold).length) return null;
  const bar = FABRULE.margin * (1 - FABRULE.lean * fabLeaning());
  let best = null;
  for (const st of stations) {
    if (st.hostile || !st.hangars?.length || !inRange(ship, st)) continue;
    if (!canFabAt(st)) continue;
    if (fabQueueAt(st.id).length >= FAB.perPort) continue;
    const stock = { ...hold, ...{} };
    for (const [k, v] of Object.entries(sim.stash?.[st.id] ?? {})) stock[k] = (stock[k] ?? 0) + v;
    /* Walk the menu in margin order and stop once a few are actually MAKEABLE.
     *
     * The first cut of this took the top ten by margin and planned those, which
     * looks sensible and is wrong: a hold of iron ore and carbon makes steel
     * plate at 1.57x, and steel plate is nowhere near the top ten (heat
     * exchangers and battery blocks are, and that ore cannot touch them). So
     * ARIA stood in a belt full of usable ore and concluded there was nothing
     * to build.
     *
     * One cheap `planJob(…, 1, …)` says whether a line is possible at all; only
     * the ones that pass are worth the binary search in `maxRunnable`. Four
     * candidates is plenty and keeps this affordable at planner cadence. */
    let tried = 0;
    for (const m of fabMenuAt(st)) {
      if (m.ratio < bar) break;                  // the menu is sorted; the rest are worse
      if (!planFab(m.id, 1, stock).ok) continue; // cannot make even one from this hold
      const qty = maxRunnable(m.id, stock, 50);
      if (qty < 1) continue;
      const plan = planFab(m.id, qty, stock);
      if (!plan.ok) continue;
      const worth = plan.outValue * m.ratio - dist3(ship.pos, st) / 1000;
      if (!best || worth > best.worth) best = { st, good: m.id, name: m.name, qty, margin: m.ratio, plan, worth };
      if (++tried >= 4) break;
    }
  }
  return best;
}



/**
 * The best refit ARIA can afford, at a port it is willing to fly to.
 * → { st, opt, rank } | null
 */
export function refitPlan(ship = sim.ship, job = "mine") {
  const spend = ship.credits - INVEST.reserve;
  if (spend <= 0) return null;
  const want = [...ALWAYS_REFITS.filter((id) => !hasUpgrade(id)), ...(JOB_REFITS[job] ?? [])];
  if (!want.length) return null;
  let best = null;
  for (const st of stations) {
    if (st.hostile || !st.hangars?.length || !inRange(ship, st)) continue;
    for (const o of upgradeOptions(st)) {
      if (o.owned || o.blocker || !o.sector.includes(st.sector) || o.price > spend) continue;
      const rank = want.indexOf(o.id);
      if (rank < 0) continue;
      /* earlier in the want list wins; distance only breaks a tie */
      const score = -rank * 100 - dist3(ship.pos, st) / 1e5;
      if (!best || score > best.score) best = { st, opt: o, rank, score };
    }
  }
  return best;
}

/**
 * The best drone ARIA can have built, at a port it is willing to fly to.
 * Drones come out of the COMPANY treasury, not the ship's credit line, so the
 * reserve above does not apply — `buildOptions` already refuses when the
 * treasury is short, the drone cap is reached, or the line is busy.
 * → { st, opt, rank } | null
 */
export function buildPlan(ship = sim.ship, job = "mine") {
  if (!hasCompany()) return null;
  const want = JOB_DRONES[job] ?? [];
  if (!want.length) return null;
  let best = null;
  for (const st of stations) {
    if (st.hostile || !st.hangars?.length || !inRange(ship, st)) continue;
    for (const o of buildOptions(st)) {
      if (o.blocker) continue;
      const rank = want.indexOf(o.role);
      if (rank < 0) continue;
      const score = -rank * 100 - dist3(ship.pos, st) / 1e5;
      if (!best || score > best.score) best = { st, opt: o, rank, score };
    }
  }
  return best;
}

const MISSION = (name, steps) => makeMission({ name: `ARIA · ${name}`, builtin: true, mode: "aria", steps, loop: { mode: "none" }, defaults: { thrustCap: 1, warp: "auto" } });

/**
 * What ARIA would do next, and why. Pure over the ship and your habits — the
 * tests call it directly. → { job, why, mission } | { job: null, why }
 */
export function planJob() {
  const ship = sim.ship;
  const hullFrac = ship.hull / hullMaxOf(ship);
  const fill = cargoTotal(ship) / Math.max(1, ship.cargoCap);
  const { share, total } = jobHabits();
  const fails = ariaPilot.fails;

  if (hullFrac < 0.45 && (fails.repair ?? 0) < 2) {
    const st = bestRepairPort(ship);
    if (st) return { job: "repair", why: `hull at ${Math.round(hullFrac * 100)}% — ${st.name} has a yard`, mission: MISSION(`repair at ${st.name}`, [makeStep("DOCK", { kind: "station", id: st.id, name: st.name }), makeStep("REPAIR")]) };
  }
  /* A hold worth stopping for: the works before the desk, when the numbers and
   * the pilot's own habits both say so. Ahead of "sell" because it is a BETTER
   * answer to the same question — a full hold — not a different one. */
  if (fill >= FABRULE.holdMin && sim.time >= (ariaPilot.fabAt ?? 0) && (fails.fabricate ?? 0) < 2 && !hostileNear()) {
    const f = fabStop(ship);
    if (f) {
      const lean = fabLeaning();
      return { job: "fabricate", why: `${f.qty} × ${f.name} at ${f.st.name} — ${f.margin.toFixed(2)}× the ore${lean > 0.2 ? ", and you work the same way" : lean < -0.2 ? ", though you usually sell raw" : ""}`,
        mission: MISSION(`${f.name} at ${f.st.name}`, [
          makeStep("DOCK", { kind: "station", id: f.st.id, name: f.st.name }),
          makeStep("FAB", null, { args: { good: f.good, qty: f.qty } }),
          ...deskSteps(),
        ]) };
    }
  }
  if ((fill >= 0.85 || holdRoom(ship) < 1) && (fails.sell ?? 0) < 2) {
    return { job: "sell", why: `hold ${Math.round(fill * 100)}% full`, mission: MISSION("to the desk", [makeStep("DOCK", { kind: sim.autoPlan?.onDock === "smelt" ? "best-smelter" : "best-buyer" }), ...deskSteps()]) };
  }

  /* The money is in, the hull is whole and nothing is urgent: buy the thing
   * that makes the next run better. Between the hold-full check above and the
   * work below on purpose — it must never come before getting a full hold to
   * the desk (that is what pays for it) and never after picking up a new seam
   * (which would mean breaking off a cut to go shopping). */
  const topJob = ARIA_JOBS.filter((j) => !INVEST_JOBS.includes(j)).sort((a, b) => (share[b] ?? 0) - (share[a] ?? 0))[0] ?? "mine";
  if (sim.time >= ariaPilot.investAt && hullFrac >= INVEST.minHull && !hostileNear()) {
    if ((fails.build ?? 0) < 2) {
      const b = buildPlan(ship, topJob);
      if (b) {
        return { job: "build", why: `${company.name || "the company"} can stand a ${b.opt.label.toLowerCase()} drone — ${b.opt.price.toLocaleString()} cr at ${b.st.name}`,
          mission: MISSION(`build a ${b.opt.label.toLowerCase()} at ${b.st.name}`, [
            makeStep("DOCK", { kind: "station", id: b.st.id, name: b.st.name }),
            makeStep("BUILD", null, { args: { role: b.opt.role } }),
          ]) };
      }
    }
    if ((fails.refit ?? 0) < 2) {
      const r = refitPlan(ship, topJob);
      if (r) {
        return { job: "refit", why: `${r.opt.name} at ${r.st.name} — ${r.opt.price.toLocaleString()} cr, and ${ship.credits.toLocaleString()} in hand`,
          mission: MISSION(`refit ${r.opt.name} at ${r.st.name}`, [
            makeStep("DOCK", { kind: "station", id: r.st.id, name: r.st.name }),
            makeStep("REFIT", null, { args: { id: r.opt.id } }),
          ]) };
      }
    }
  }

  const seam = nearestSeam();
  const world = unsurveyed();
  const can = { mine: Boolean(seam), survey: Boolean(world), sell: fill > 0.15 };
  const learned = total >= 3;
  const weight = (j) => (can[j] ? (learned ? share[j] : j === "mine" ? 0.6 : j === "survey" ? 0.4 : 0.1) + 0.05 : -1) - (fails[j] ?? 0) * 0.35 + (ariaPilot.job === j ? 0.05 : 0);
  const pick = ["mine", "survey", "sell"].sort((a, b) => weight(b) - weight(a))[0];
  if (weight(pick) < 0) return { job: null, why: "nothing this ship can do here" };
  const habit = learned ? `you ${pick === "mine" ? "mine" : pick === "survey" ? "survey" : "run cargo"} ${Math.round(share[pick] * 100)}% of the time` : "I have not watched you long — my best guess";

  if (pick === "mine") {
    return { job: "mine", why: `${habit}; ${seam.name}`, mission: MISSION(`mine ${seam.name}`, [
      makeStep("MINE", { kind: "seam", x: seam.x, y: seam.y, z: seam.z, name: seam.name }, { until: { k: "hold", op: ">=", v: 0.9 } }),
      makeStep("DOCK", { kind: sim.autoPlan?.onDock === "smelt" ? "best-smelter" : "best-buyer" }),
      ...deskSteps(),
      makeStep("REPAIR", null, { onFail: "skip" }),
    ]) };
  }
  if (pick === "survey") {
    return { job: "survey", why: `${habit}; ${world.name} is not in the log`, mission: MISSION(`survey ${world.name}`, [makeStep("SURVEY", { kind: "body", id: world.id, name: world.name })]) };
  }
  return { job: "sell", why: `${habit}; ${Math.round(fill * 100)}% in the hold`, mission: MISSION("to the desk", [makeStep("DOCK", { kind: "best-buyer" }), ...deskSteps()]) };
}

/* ---- the watch ---------------------------------------------------------- */

export function beginAriaWatch() {
  ariaPilot.job = null;
  ariaPilot.why = "";
  ariaPilot.planAt = 0;
  ariaPilot.fails = {};
  ariaPilot.jobs = 0;
  ariaPilot.shed = false;
  ariaPilot.bought = [];
  /* A fresh watch may shop straight away — the pilot handed over on purpose. */
  ariaPilot.investAt = 0;
  ariaPilot.fabAt = 0;
  ariaPilot.creditsAt = sim.ship?.credits ?? 0;
  /* whatever you had the autopilot doing is yours; ARIA plans its own */
  if (mission.active) stopMission("ARIA has the conn", { quiet: true });
}

export function endAriaWatch() {
  if (mission.active && mission.active.mode === "aria") stopMission("ARIA stood down", { quiet: true });
  ariaPilot.job = null;
}

/** Called from captain.tickCaptain every tick ARIA holds the conn. → earned this watch */
export function tickAriaPilot() {
  if (captain.holder !== "aria" || sim.phase !== "play") return 0;
  const ship = sim.ship;
  sim.handsOff = true;
  /* between jobs too: the stick is yours */
  if (!autopilot.on && pilotInput()) { hooks.onStick?.(); return 0; }

  /* guns: under fire, answer it */
  if (hostileNear() && (ship.turretMode === "off" || ship.turretMode === "passive")) { setTurretMode("castle"); say?.("Contacts close — guns on CASTLE."); }

  /* a bus that cannot refill itself: shed rather than stand down */
  const bus = busOverload(ship);
  if (bus.over && !ariaPilot.shed) {
    ariaPilot.shed = true;
    if (ship.localGravity) toggleSystem("localGravity");
    if (ship.lights) toggleSystem("lights");
    say?.(`The bus is over the core — I have cut deck gravity${ship.miningMode !== "off" ? " and the cutter" : ""} until the battery comes back.`);
    if (ship.miningMode !== "off") setMiningMode("off", { quiet: true });
  } else if (!bus.over && ariaPilot.shed && bus.spare > 30) {
    ariaPilot.shed = false;
    if (!ship.localGravity) toggleSystem("localGravity");
  }

  const running = mission.active && (mission.state === "running" || mission.state === "asking");
  if (running) return ship.credits - ariaPilot.creditsAt;

  /* the last job ended: book it */
  if (ariaPilot.job && mission.state === "failed") ariaPilot.fails[ariaPilot.job] = (ariaPilot.fails[ariaPilot.job] ?? 0) + 1;
  else if (ariaPilot.job && mission.state === "done") ariaPilot.fails[ariaPilot.job] = 0;
  if (ariaPilot.job) { mission.state = "idle"; ariaPilot.job = null; ariaPilot.planAt = sim.time + 2; }
  if (sim.time < ariaPilot.planAt) return ship.credits - ariaPilot.creditsAt;

  /* docked between jobs: do at the desk what you would */
  if (ship.dockedAt) {
    const st = stationById(ship.dockedAt);
    if (st && ship.hull < hullMaxOf(ship) - 1 && repairsAt(st)) {
      const r = yardRepair();
      if (r.ok) say?.(`Bought ${r.points} hull at ${st.name} for ${r.cost.toLocaleString()} cr.`);
    }
  }

  const plan = planJob();
  ariaPilot.planAt = sim.time + 4;
  if (!plan.mission) {
    if (ariaPilot.why !== plan.why) say?.(`Holding — ${plan.why}.`);
    ariaPilot.why = plan.why;
    return ship.credits - ariaPilot.creditsAt;
  }
  if (startMission(plan.mission)) {
    ariaPilot.job = plan.job;
    ariaPilot.why = plan.why;
    ariaPilot.jobs++;
    say?.(`${plan.job.toUpperCase()} — ${plan.why}.`);
    logEvent(`ARIA: ${plan.job} — ${plan.why}`, "nav");
  } else {
    ariaPilot.fails[plan.job] = (ariaPilot.fails[plan.job] ?? 0) + 1;
  }
  return ship.credits - ariaPilot.creditsAt;
}

/* ---- REPAIR, REFIT and BUILD as mission steps ---------------------------
 *
 * The runner's op table is open (js/mission/run.js exports EXEC), so ARIA's
 * three docked-only ops are registered here rather than built into the runner:
 * they are the planner's vocabulary, and a pilot writing a mission by hand can
 * use them too now that they are in OPS (js/mission/script.js).
 *
 * All three follow the runner's contract: return "done", or "fail:<reason>",
 * and put a sentence on `mission.run.why` for the WORK card.
 */

function registerAriaOps() {
  registerRefitOp();
  registerBuildOp();
  registerFabOp();
  if (EXEC.REPAIR) return;
  EXEC.REPAIR = () => {
    const st = stationById(sim.ship.dockedAt);
    if (!st) return "fail:not docked";
    autopilot.phase = "trade"; autopilot.task = `repair · ${st.name}`;
    if (sim.ship.hull >= hullMaxOf(sim.ship) - 0.5) { mission.run.why = "hull whole"; return "done"; }
    const r = yardRepair();
    if (!r.ok) return `fail:${r.why.toLowerCase()}`;
    mission.run.why = `${r.points} hull for ${r.cost.toLocaleString()} cr at ${st.name}`;
    return "done";
  };
}

function registerRefitOp() {
  if (EXEC.REFIT) return;
  EXEC.REFIT = () => {
    const st = stationById(sim.ship.dockedAt);
    if (!st) return "fail:not docked";
    const id = mission.active?.steps[mission.stepIx]?.args?.id;
    if (!id) return "fail:no refit named";
    autopilot.phase = "trade"; autopilot.task = `refit · ${st.name}`;
    if (hasUpgrade(id)) { mission.run.why = "already fitted"; return "done"; }
    const opt = upgradeOptions(st).find((o) => o.id === id);
    if (!opt) return "fail:this yard does not fit that";
    if (opt.blocker) return `fail:${opt.blocker.toLowerCase()}`;
    const err = buyUpgrade(id, st);
    if (err) return `fail:${String(err).toLowerCase()}`;
    ariaPilot.investAt = sim.time + INVEST.cooldown;
    ariaPilot.bought.push({ what: opt.name, cr: opt.price, where: st.name });
    mission.run.why = `${opt.name} fitted at ${st.name} for ${opt.price.toLocaleString()} cr — ${effectOf(opt)}`;
    return "done";
  };
}

function registerBuildOp() {
  if (EXEC.BUILD) return;
  EXEC.BUILD = () => {
    const st = stationById(sim.ship.dockedAt);
    if (!st) return "fail:not docked";
    const role = mission.active?.steps[mission.stepIx]?.args?.role;
    if (!role) return "fail:no drone role named";
    autopilot.phase = "trade"; autopilot.task = `build · ${st.name}`;
    const opt = buildOptions(st).find((o) => o.role === role);
    if (!opt) return "fail:this port has no line for that drone";
    if (opt.blocker) return `fail:${opt.blocker.toLowerCase()}`;
    const r = orderBuild(role, st);
    if (!r.ok) return `fail:${String(r.why).toLowerCase()}`;
    ariaPilot.investAt = sim.time + INVEST.cooldown;
    ariaPilot.bought.push({ what: `${opt.label} drone`, cr: opt.price, where: st.name });
    /* The drone is on the LINE, not off it — it rolls off on its own timer and
     * asks for its orders on the drone channel. The mission's job is done when
     * the order is placed; standing at the berth watching a build finish is
     * exactly the kind of idling ARIA is supposed to avoid. */
    mission.run.why = `${opt.label} drone on the line at ${st.name} — ${opt.secs} s, ${opt.price.toLocaleString()} cr from the treasury`;
    return "done";
  };
}

function registerFabOp() {
  if (EXEC.FAB) return;
  EXEC.FAB = () => {
    const st = stationById(sim.ship.dockedAt);
    if (!st) return "fail:not docked";
    const args = mission.active?.steps[mission.stepIx]?.args ?? {};
    const good = args.good;
    const qty = args.qty ?? 1;
    if (!good) return "fail:no part named";
    autopilot.phase = "trade"; autopilot.task = `works · ${st.name}`;
    if (!canFabAt(st, good)) return "fail:this port has no line for that";
    const r = orderFab({ st, id: good, qty, by: "player" });
    if (!r.ok) return `fail:${String(r.why).toLowerCase()}`;
    /* The job is ON the line, not off it — it finishes on sim time and lands in
     * this port's locker. Standing at the berth watching it is exactly the kind
     * of idling the planner exists to avoid, so the step is done once it is
     * placed, the same call BUILD makes. */
    ariaPilot.fabAt = sim.time + 90;
    mission.run.why = `${qty} × ${r.job.name} on the line at ${st.name} — ${r.job.secs} s, ${r.job.fee.toLocaleString()} cr`;
    return "done";
  };
}

/** aria.js calls this once the module graph has loaded. */
export function wireAriaPilot(ariaState, speak) {
  prefs = ariaState.prefs;
  say = (text) => speak?.(text);
  registerAriaOps();
}

/** aria.js swaps prefs objects on load; keep the binding current. */
export function bindAriaPrefs(p) { prefs = p; }


