import { ariaMind, authorize, contextualScore, decideMind, policyScore, learnOutcome, breakLine, forecast, settleForecast, riskAversion } from "./mind.js";
import { perceive, hostileWithin } from "./senses.js";
import { pathRisk } from "./threat.js";
import { wakeArm, sellValueAt, wakeJobOpen, wakeJobClose, wakeAudit } from "./wake.js";
import { sim, logEvent, setTurretMode, setMiningMode, toggleSystem } from "../sim/sim.js";
import { cargoTotal, holdRoom, batteryCap } from "../flight/ship.js";
import { stations, stationById } from "../station/stations.js";
import { BODIES, dist3 } from "../world/bodies.js";
import { captain, ariaHooks as hooks } from "../npc/captain.js";
import { autopilot, nearestSeam, busOverload, pilotInput, portHooks } from "../flight/autopilot.js";
import { mission, startMission, stopMission, EXEC } from "../mission/run.js";
import { makeMission, makeStep } from "../mission/script.js";
import { repairsAt, pricePerPoint, yardRepair, repairQuote, hullMaxOf } from "../flight/repair.js";
import { upgradeOptions, buyUpgrade, hasUpgrade, effectOf } from "../economy/upgrades.js";
import { buildOptions, orderBuild } from "../drones/ops.js";
import { orderFab, planJob as planFab, canFabAt, fabMenuAt, maxRunnable, fabQueueAt, FAB } from "../economy/fabricate.js";
import { neighbours, snapshot } from "../flight/recorder.js";
import { company, hasCompany } from "../corp/company.js";
import { pilot } from "../flight/pilot.js";
import { bestHulk, SALV } from "../mission/salvage.js";
import { hulks } from "../world/hulks.js";

export const ARIA_JOBS = ["mine", "sell", "survey", "repair", "refit", "build", "fabricate", "salvage"];
export const INVEST_JOBS = ["refit", "build"];
const LABEL_JOB = { mine: "mine", survey: "survey", dock: "sell" };

export const ariaPilot = {
  job: null,
  why: "",
  planAt: 0,
  fails: {},
  failAt: {},
  jobs: 0,
  creditsAt: 0,
  shed: false,
  investAt: 0,
  fabAt: 0,
  bought: [],
  brokeOff: 0,
  yardRun: false,
  wake: null,
};

let prefs = null;
let say = null;

export function notePlayerJob(job, weight = 1) {
  if (!prefs || !ARIA_JOBS.includes(job)) return;
  prefs.job ??= {};
  prefs.job[job] ??= { n: 0, last: 0 };
  prefs.job[job].n += weight;
  prefs.job[job].last = sim.time ?? 0;
}

export function notePlayLabel(label) {
  const job = LABEL_JOB[label];
  if (job) notePlayerJob(job, 1);
}

export function jobHabits() {
  const bag = prefs?.job ?? {};
  const total = ARIA_JOBS.reduce((a, j) => a + (bag[j]?.n ?? 0), 0);
  const share = {};
  for (const j of ARIA_JOBS) share[j] = total ? (bag[j]?.n ?? 0) / total : 0;
  return { share, total };
}

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

const YARD_RISK = 1.5;

export function bestRepairPort(ship = sim.ship) {
  let best = null, score = -Infinity;
  let hazards = [];
  try { hazards = ship === sim.ship ? perceive().hazards.filter((h) => dist3(h, ship.pos) > 2500) : []; } catch { hazards = []; }
  for (const st of stations) {
    if (st.hostile || st.sector === "pirate" || !repairsAt(st) || !st.hangars?.length) continue;
    const s = -dist3(ship.pos, st) / 100000 - pricePerPoint(st) / 20 - (hazards.length ? pathRisk([ship.pos, st], hazards).risk * YARD_RISK * riskAversion() : 0);
    if (s > score) { score = s; best = st; }
  }
  return best;
}

const hostileNear = (r = 6000) => hostileWithin(r);
const threatNow = () => { try { return perceive().threat.level; } catch { return 0; } };

function deskSteps() {
  const onDock = sim.autoPlan?.onDock ?? "sell";
  if (onDock === "stash") return [makeStep("STASH", null, { args: { what: "all" } })];
  if (onDock === "smelt") return [makeStep("SMELT", null, { onFail: "skip" }), makeStep("SELL", null, { args: { what: "ore" } })];
  return [makeStep("SELL", null, { args: { what: "ore" } })];
}

const INVEST = {
  reserve: 15000,
  cooldown: 300,
  minHull: 0.6,
  maxRange: 2.2e5,
};

const GUESS = {
  salvor: { salvage: 0.6, survey: 0.3, mine: 0.25, sell: 0.1 },
  other: { mine: 0.6, survey: 0.4, salvage: 0.2, sell: 0.1 },
};
const WORK = ["mine", "survey", "sell", "salvage"];
const SALVOR = { mines: 0.15, forgive: 240 };

const JOB_REFITS = {
  mine: ["cutter_array", "cutter_lens", "hold_expansion", "cargo_racks", "assay_deck", "ore_sorter"],
  sell: ["hold_expansion", "cargo_racks", "broker_suite", "trade_uplink"],
  survey: ["phased_array", "sensor_mast", "probe_rack"],
  repair: ["repair_drone", "nanofoam", "plating"],
};
const ALWAYS_REFITS = ["repair_drone", "nav_core"];

const JOB_DRONES = {
  mine: ["miner", "hauler"],
  sell: ["hauler", "courier"],
  survey: ["surveyor", "relay"],
  repair: ["repair", "salvager"],
};

const inRange = (ship, st) => dist3(ship.pos, st) <= INVEST.maxRange;

const FABRULE = {
  holdMin: 0.55,
  margin: 1.4,
  lean: 0.33,
  cooldown: 90,
};

export function fabLeaning() {
  let here = null;
  try { here = snapshot(); } catch { return 0; }
  if (!here) return 0;
  let near = [];
  try { near = neighbours(here, 12, { by: "player" }); } catch { return 0; }
  if (near.length < 4) return 0;
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
    let tried = 0;
    for (const m of fabMenuAt(st)) {
      if (m.ratio < bar) break;
      if (!planFab(m.id, 1, stock).ok) continue;
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

export function refitPlan(ship = sim.ship, job = "mine") {
  const spend = Math.min(ariaMind.orders.maxPurchase, ship.credits - ariaMind.orders.reserve);
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
      const score = -rank * 100 - dist3(ship.pos, st) / 1e5;
      if (!best || score > best.score) best = { st, opt: o, rank, score };
    }
  }
  return best;
}

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

function rawPlanJob() {
  const ship = sim.ship;
  const hullFrac = ship.hull / hullMaxOf(ship);
  const fill = cargoTotal(ship) / Math.max(1, ship.cargoCap);
  const { share, total } = jobHabits();
  const fails = ariaPilot.fails;
  for (const k of Object.keys(fails)) if (fails[k] > 0 && sim.time - (ariaPilot.failAt[k] ??= sim.time) > SALVOR.forgive) fails[k] = 0;

  const yardRun = ariaPilot.yardRun;
  ariaPilot.yardRun = false;
  if (ariaMind.authority.repairs && (hullFrac < ariaMind.orders.repairBelow || (yardRun && hullFrac < 0.995)) && (fails.repair ?? 0) < 2) {
    const st = bestRepairPort(ship);
    if (st && !st.hostile && st.sector !== "pirate") return { job: "repair", why: `hull at ${Math.round(hullFrac * 100)}% — ${st.name} has a yard`, mission: MISSION(`repair at ${st.name}`, [makeStep("DOCK", { kind: "station", id: st.id, name: st.name }), makeStep("REPAIR")]) };
  }
  if (ariaMind.authority.fabricate && fill >= FABRULE.holdMin && sim.time >= (ariaPilot.fabAt ?? 0) && (fails.fabricate ?? 0) < 2 && !hostileNear()) {
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

  const topJob = ARIA_JOBS.filter((j) => !INVEST_JOBS.includes(j)).sort((a, b) => (share[b] ?? 0) - (share[a] ?? 0))[0] ?? "mine";
  if (sim.time >= ariaPilot.investAt && hullFrac >= INVEST.minHull && !hostileNear()) {
    if (ariaMind.authority.build && (fails.build ?? 0) < 2) {
      const b = buildPlan(ship, topJob);
      if (b) {
        return { job: "build", why: `${company.name || "the company"} can stand a ${b.opt.label.toLowerCase()} drone — ${b.opt.price.toLocaleString()} cr at ${b.st.name}`,
          mission: MISSION(`build a ${b.opt.label.toLowerCase()} at ${b.st.name}`, [
            makeStep("DOCK", { kind: "station", id: b.st.id, name: b.st.name }),
            makeStep("BUILD", null, { args: { role: b.opt.role } }),
          ]) };
      }
    }
    if (ariaMind.authority.refit && (fails.refit ?? 0) < 2) {
      const r = refitPlan(ship, topJob);
      if (r) {
        return { job: "refit", why: `${r.opt.name} at ${r.st.name} — ${r.opt.price.toLocaleString()} cr, and ${Math.round(ship.credits).toLocaleString()} in hand`,
          mission: MISSION(`refit ${r.opt.name} at ${r.st.name}`, [
            makeStep("DOCK", { kind: "station", id: r.st.id, name: r.st.name }),
            makeStep("REFIT", null, { args: { id: r.opt.id } }),
          ]) };
      }
    }
  }

  const seam = nearestSeam();
  const world = unsurveyed();
  const hulk = (fails.salvage ?? 0) < 2 ? bestHulk() : null;
  const learned = total >= 3;
  const salvor = pilot?.complexId === "salvage" || (learned && (share.salvage ?? 0) >= 0.5);
  const can = { mine: Boolean(seam) && !(salvor && (share.mine ?? 0) < SALVOR.mines), survey: Boolean(world), sell: fill > 0.15, salvage: Boolean(hulk) };
  const guess = GUESS[pilot?.complexId === "salvage" ? "salvor" : "other"];
  const weight = (j) => policyScore(j, (can[j] ? (learned && ariaMind.orders.mode !== "optimize" ? share[j] : guess[j]) + 0.05 : -1) - (fails[j] ?? 0) * 0.35 + (ariaPilot.job === j ? 0.05 : 0), snapshot());
  const pick = [...WORK].sort((a, b) => weight(b) - weight(a))[0];
  if (weight(pick) < 0) return { job: null, why: salvor && !hulk ? ((fails.salvage ?? 0) >= 2 ? "two salvage runs failed — I am not sending her at a third" : `no hulk worth the trip in this sky yet (${hulks.length} adrift) — they come with the fighting`) : "nothing this ship can do here" };
  const habit = learned ? `you ${pick === "mine" ? "mine" : pick === "survey" ? "survey" : pick === "salvage" ? "work hulks" : "run cargo"} ${Math.round(share[pick] * 100)}% of the time` : "I have not watched you long — my best guess";

  if (pick === "salvage") {
    return { job: "salvage", why: `${habit}; ${hulk.h.name}, about ${Math.round(hulk.worth).toLocaleString()} cr in it`, mission: MISSION(`salvage ${hulk.h.vesselName}`, [
      makeStep("SALVAGE", { kind: "best-hulk" }, { until: { k: "hold", op: ">=", v: 0.9 }, args: { mode: "auto", max: SALV.trip } }),
      makeStep("DOCK", { kind: "best-buyer" }),
      makeStep("SELL", null, { args: { what: "all" } }),
      makeStep("REPAIR", null, { onFail: "skip" }),
    ]) };
  }

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

export function planJob() {
  const state = { ...(snapshot() ?? {}), hull: sim.ship.hull / hullMaxOf(sim.ship), hold: cargoTotal(sim.ship) / Math.max(1, sim.ship.cargoCap), hz: hostileNear() ? 1 : 0, th: threatNow() };
  let plan = rawPlanJob();
  const permission = plan.job ? authorize(plan.job, { at: sim.time }) : { ok: true };
  if (!permission.ok) plan = { job: null, why: permission.why };
  decideMind({ action: plan.job, why: plan.why, state, steps: plan.mission?.steps.map(s => s.op) ?? [], alternatives: WORK.map(action => ({ action, ...contextualScore(action, state) })), at: sim.time });
  return plan;
}

export function shouldBreakOff(ship = sim.ship) {
  if (!ariaMind.orders.avoidHostiles || !ariaMind.authority.repairs) return null;
  if (ship.dockedAt || ship.hull / hullMaxOf(ship) >= breakLine((ship.charge ?? 0) / Math.max(1, batteryCap(ship)), ship === sim.ship ? threatNow() : 0)) return null;
  if ((ariaPilot.fails.repair ?? 0) >= 2 || !hostileNear()) return null;
  const st = bestRepairPort(ship);
  if (!st || ship.credits < pricePerPoint(st)) return null;
  return st;
}

export function beginAriaWatch() {
  ariaPilot.job = null;
  ariaPilot.brokeOff = 0;
  ariaPilot.yardRun = false;
  ariaPilot.why = "";
  ariaPilot.planAt = 0;
  ariaPilot.fails = {};
  ariaPilot.failAt = {};
  ariaPilot.jobs = 0;
  ariaPilot.shed = false;
  ariaPilot.bought = [];
  ariaPilot.investAt = 0;
  ariaPilot.fabAt = 0;
  ariaPilot.creditsAt = sim.ship?.credits ?? 0;
  if (mission.active) stopMission("ARIA has the conn", { quiet: true });
}

export function endAriaWatch() {
  if (mission.active && mission.active.mode === "aria") stopMission("ARIA stood down", { quiet: true });
  ariaPilot.job = null;
}

export function tickAriaPilot() {
  if (captain.holder !== "aria" || sim.phase !== "play") return 0;
  const ship = sim.ship;
  sim.handsOff = true;
  if (!autopilot.on && pilotInput()) { hooks.onStick?.(); return 0; }
  try { perceive(); wakeAudit(); } catch {}

  if (hostileNear() && (ship.turretMode === "off" || ship.turretMode === "passive")) { setTurretMode("castle"); say?.("Contacts close — guns on CASTLE."); }

  const bus = busOverload(ship);
  const rigRest = Boolean(mission.run?.resting) && mission.active?.steps[mission.stepIx]?.op === "SALVAGE";
  if ((bus.over || rigRest) && !ariaPilot.shed) {
    ariaPilot.shed = true;
    if (ship.localGravity) toggleSystem("localGravity");
    if (ship.lights) toggleSystem("lights");
    if (bus.over) say?.(`The bus is over the core — I have cut deck gravity${ship.miningMode !== "off" ? " and the cutter" : ""} until the battery comes back.`);
    else say?.("The rig is drinking the battery — deck gravity and the floods are off while she cuts.");
    if (bus.over && ship.miningMode !== "off") setMiningMode("off", { quiet: true });
  } else if (!bus.over && ariaPilot.shed && bus.spare > 30 && mission.active?.steps[mission.stepIx]?.op !== "SALVAGE") {
    ariaPilot.shed = false;
    if (!ship.localGravity) toggleSystem("localGravity");
  }

  if (ariaPilot.job && ariaPilot.job !== "repair" && mission.active?.mode === "aria") {
    const yard = shouldBreakOff(ship);
    if (yard) {
      ariaPilot.brokeOff++;
      ariaPilot.yardRun = true;
      say?.(`Hull at ${Math.round((ship.hull / hullMaxOf(ship)) * 100)}% with contacts close — breaking off for the yard at ${yard.name}.`);
      stopMission("breaking off for the yard", { quiet: true });
      ariaPilot.job = null;
      ariaPilot.planAt = sim.time;
    }
  }
  const running = mission.active && (mission.state === "running" || mission.state === "asking");
  if (running) return ship.credits - ariaPilot.creditsAt;

  if (ariaPilot.job && ["done", "failed"].includes(mission.state)) {
    const secs = sim.time - (ariaPilot.jobSince ?? sim.time), cr = ship.credits - (ariaPilot.jobCredits ?? ship.credits), ok = mission.state === "done";
    learnOutcome(ariaPilot.job, secs, cr, ok, sim.time);
    settleForecast(ariaPilot.job, secs, cr, ok);
    wakeJobClose(ariaPilot.wake, ariaPilot.job, ok, cr);
    ariaPilot.wake = null;
  }
  if (ariaPilot.job && mission.state === "failed") { ariaPilot.fails[ariaPilot.job] = (ariaPilot.fails[ariaPilot.job] ?? 0) + 1; ariaPilot.failAt[ariaPilot.job] = sim.time; }
  else if (ariaPilot.job && mission.state === "done") ariaPilot.fails[ariaPilot.job] = 0;
  if (ariaPilot.job) { mission.state = "idle"; ariaPilot.job = null; ariaPilot.planAt = sim.time + 2; }
  if (sim.time < ariaPilot.planAt) return ship.credits - ariaPilot.creditsAt;

  if (ship.dockedAt) {
    const st = stationById(ship.dockedAt);
    if (st && ship.hull < hullMaxOf(ship) - 1 && repairsAt(st)) {
      const q = repairQuote(st, ship);
      const r = authorize("repair", { cost: q.affordable * q.per, credits: ship.credits, at: sim.time }).ok ? yardRepair() : { ok: false };
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
    ariaPilot.jobSince = sim.time;
    ariaPilot.jobCredits = ship.credits;
    ariaPilot.wake = wakeJobOpen();
    const past = ariaMind.experience.moves[plan.job];
    const runs = past ? Math.max(1, past.w ?? past.runs) : 0;
    forecast({ key: plan.job, secs: runs ? past.secs / runs : null, cr: runs ? past.cr / runs : null, at: sim.time });
    ariaPilot.job = plan.job;
    ariaPilot.why = plan.why;
    ariaPilot.jobs++;
    say?.(`${plan.job.toUpperCase()} — ${plan.why}.`);
    logEvent(`ARIA: ${plan.job} — ${plan.why}`, "nav");
  } else {
    ariaPilot.fails[plan.job] = (ariaPilot.fails[plan.job] ?? 0) + 1;
    ariaPilot.failAt[plan.job] = sim.time;
  }
  return ship.credits - ariaPilot.creditsAt;
}

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
    const q = repairQuote(st, sim.ship);
    const a = (mission.active?.mode === "aria" || mission.active?.aria) ? authorize("repair", { cost: q.affordable * q.per, credits: sim.ship.credits, at: sim.time }) : { ok: true };
    if (!a.ok) return `fail:${a.why}`;
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
    const a = (mission.active?.mode === "aria" || mission.active?.aria) ? authorize("refit", { cost: opt.price, credits: sim.ship.credits, at: sim.time }) : { ok: true };
    if (!a.ok) return `fail:${a.why}`;
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
    const a = (mission.active?.mode === "aria" || mission.active?.aria) ? authorize("build", { cost: opt.price, at: sim.time }) : { ok: true };
    if (!a.ok) return `fail:${a.why}`;
    const r = orderBuild(role, st);
    if (!r.ok) return `fail:${String(r.why).toLowerCase()}`;
    ariaPilot.investAt = sim.time + INVEST.cooldown;
    ariaPilot.bought.push({ what: `${opt.label} drone`, cr: opt.price, where: st.name });
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
    const stock = { ...(sim.ship.hold ?? {}) };
    for (const [k, n] of Object.entries(sim.stash?.[st.id] ?? {})) stock[k] = (stock[k] ?? 0) + n;
    const quote = planFab(good, qty, stock);
    const a = (mission.active?.mode === "aria" || mission.active?.aria) ? authorize("fabricate", { cost: quote.fee, credits: sim.ship.credits, at: sim.time }) : { ok: true };
    if (!a.ok) return `fail:${a.why}`;
    const r = orderFab({ st, id: good, qty, by: "player" });
    if (!r.ok) return `fail:${String(r.why).toLowerCase()}`;
    ariaPilot.fabAt = sim.time + 90;
    mission.run.why = `${qty} × ${r.job.name} on the line at ${st.name} — ${r.job.secs} s, ${r.job.fee.toLocaleString()} cr`;
    return "done";
  };
}

export function wireAriaPilot(ariaState, speak) {
  prefs = ariaState.prefs;
  say = (text) => speak?.(text);
  registerAriaOps();
  wakeArm("conn", () => captain.holder === "aria");
  portHooks.sellValue = sellValueAt;
}

export function bindAriaPrefs(p) { prefs = p; }
