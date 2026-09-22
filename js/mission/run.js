/* LIVING GALAXY — the mission executor: walks a script's steps on the autopilot primitives.
 *
 * One step is live at a time. Its executor is called every autopilot tick and
 * answers "flying" | "done" | "asking" | "fail:<why>"; on "done" the run
 * advances (next tick — so the HUD sees every phase), at the end of the list
 * the loop row decides whether to go round again. Flying steps undock
 * themselves first. A warp policy of "ask" parks the ship aligned and posts
 * the question to the sys channel with JUMP / SUBLIGHT / ABORT links; the
 * NAV and WORK banners call the same `answerAsk`.
 *
 * The run is saved per sky and callsign on every step change and restored
 * paused, so a reload never flies by itself.
 */

import { sim, warpNodeById, toggleDock, sellAllOre, stashDeposit, smeltAll, canSmeltAt, tradeBuy, tradeSell, addWaypointAt, removeWaypoint, selectBody, logEvent, requestScan, throttleCap, setTurretMode, setMiningMode, toggleSystem, sellPriceAt, buyPriceAt } from "../sim.js";
import * as shipMod from "../ship.js";
import { holdRoom, BATTERY } from "../ship.js";
import { BODIES, bodyPosition, dist3 } from "../bodies.js";
import { stationById } from "../stations.js";
import { tractor } from "../stationworks.js";
import { inBelt } from "../field.js";
import { captain } from "../npc/captain.js";
import { post } from "../chat.js";
import { hasUpgrade } from "../upgrades.js";
import { makeTradeOps } from "./tradeops.js";
import { validate, evalCond, snapshot, describeRef, deserialize, serialize, makeStep, missionCore } from "./script.js";
import {
  autopilot, apLeg, apPark, apDock, apMine, apHold, bestPortFor, nearestSeam, releaseControls, resetProgress, jumpEndedShort, warpReserve, AP_POWER, busIdle,
} from "../autopilot.js";

/** state: "idle"|"running"|"paused"|"asking"|"done"|"failed" */
export const mission = {
  active: null,
  stepIx: 0,
  iter: 0,
  state: "idle",
  ask: null,
  stepStartedAt: 0,
  log: [],
  stats: { earned: 0, loops: 0, startedAt: 0 },
  noWarpFor: -1,       // step index the pilot answered SUBLIGHT for
  origin: null,        // where the mission started — the "here" ref
  run: {},             // the live step's scratch (resolved node, transient mark, retries…)
  trade: null,         // 0.3.19: the round's trade route { fromId, toId, good, qty, …, bought } — outlives a step, not a round
  key: "",             // sky:callsign the persisted run was checked for
};

/** B/A may subscribe */
export const missionHooks = { onStep: null, onAsk: null, onEnd: null };

export const RUN_KEY = () => `lgaa.mission.run.v1:${sim.skySeed}:${sim.callsign}`;
/** package D exports batteryCap(ship) from ship.js; the rated battery until it lands */
const batteryCap = (ship) => shipMod.batteryCap?.(ship) ?? BATTERY;
const FLYING = new Set(["GOTO", "APPROACH", "MINE", "SURVEY", "DOCK"]);
const _p = { x: 0, y: 0, z: 0 };
const note = (text) => { sim.notice = text; sim.noticeAt = sim.wall; };
/* 0.3.19: the trade route and the two docked trade ops live in tradeops.js (this file is on the 600-line gate) */
const T = makeTradeOps({ mission, note, ap: () => autopilot });   // a getter: autopilot.js and this file import each other
const pickRoute = T.pickRoute;

/* ---- start / stop --------------------------------------------------------- */

/** → bool; refuses when the player does not hold the conn; replaces any running mission */
export function startMission(m) {
  if (!m) return false;
  if (captain.holder !== "player" && captain.holder !== "aria") { note("The conn has the ship — the autopilot stands down."); return false; }
  const errs = validate(m);
  if (errs.length) { note(`Mission ${m.name ?? ""}: ${errs[0].msg}${errs[0].step >= 0 ? ` (step ${errs[0].step + 1})` : ""}.`); return false; }
  if (!m.builtin && !missionCore() && (m.steps.length > 1 || (m.loop?.mode ?? "none") !== "none")) {
    note("A Mission core (refit at a logistic or military yard) is needed to fly loops and multi-step missions. One step at a time until then.");
    return false;
  }
  if (mission.active) stopMission("replaced", { quiet: true });
  const copy = deserialize(serialize(m));
  if (!copy) return false;
  /* a trade run starting at the port its route starts from does not leave it first */
  mission.trade = null;
  const s0 = copy.steps[0];
  const tradeHere = s0?.op === "DOCK" && s0.target?.kind === "trade-source" && pickRoute(true)?.fromId === sim.ship.dockedAt;
  if (sim.ship.dockedAt && FLYING.has(s0?.op) && !tradeHere && !(s0.op === "DOCK" && s0.target?.id === sim.ship.dockedAt)) copy.steps.unshift(makeStep("UNDOCK"));
  m.runs = (m.runs ?? 0) + 1;
  mission.active = copy;
  mission.stepIx = 0;
  mission.iter = 0;
  mission.state = "running";
  mission.ask = null;
  mission.noWarpFor = -1;
  mission.log = [];
  mission.stats = { earned: 0, loops: 0, startedAt: sim.time };
  mission.origin = { x: sim.ship.pos.x, y: sim.ship.pos.y, z: sim.ship.pos.z, name: "the start" };
  autopilot.cutterWas = sim.ship.miningMode; // the pilot's cutter, handed back at stand-down
  autopilot.on = true;
  autopilot.engagedAt = sim.time;
  autopilot.jumped = false;
  autopilot.chargeSince = null;
  autopilot.onLane = false;
  autopilot.warpAllowed = null;
  autopilot.rockKey = null;
  autopilot.loops = 0;
  autopilot.earned = 0;
  sim.dockRequestFor = null;
  autopilot.skip.clear();
  mirror();
  beginStep();
  saveRun();
  return true;
}

export function stopMission(why = "stopped", { quiet = false, state = "idle" } = {}) {
  const had = mission.active;
  const name = had?.name ?? "Autopilot";
  cleanupStep();
  mission.active = null;
  mission.trade = null;
  mission.state = state;
  mission.ask = null;
  mission.run = {};
  releaseControls();
  if (why !== "reset") clearRun();
  if (!had && why === "reset") return null;
  if (!quiet) {
    note(`Autopilot ${why}.`);
    logEvent(`${had && !had.builtin ? `Mission ${name} ` : "Autopilot "}${why}`, "nav");
  }
  missionHooks.onEnd?.(had, why, state);
  return null;
}

export function pauseMission() {
  if (!mission.active || mission.state === "paused") return null;
  cleanupStep();
  mission.state = "paused";
  mission.ask = null;
  releaseControls();
  note(`Mission ${mission.active.name} paused — you have the stick.`);
  saveRun();
  return null;
}

export function resumeMission() {
  if (!mission.active || mission.state !== "paused") return null;
  if (captain.holder !== "player") { note("The conn has the ship — the autopilot stands down."); return null; }
  mission.state = "running";
  autopilot.on = true;
  autopilot.jumped = false;
  autopilot.chargeSince = null;
  autopilot.onLane = false;
  sim.dockRequestFor = null;
  mirror();
  beginStep();
  note(`Mission ${mission.active.name} resumed — touch the stick to take it back.`);
  return null;
}

/** answer: "jump" | "sublight" | "abort" */
export function answerAsk(answer) {
  if (mission.state !== "asking" || !mission.ask) return null;
  const ask = mission.ask;
  if (answer === "abort") return stopMission("aborted at the ask");
  if (answer === "jump") autopilot.warpAllowed = ask.node.id;
  else if (answer === "sublight") mission.noWarpFor = ask.stepIx;
  else return null;
  mission.state = "running";
  mission.ask = null;
  logEvent(`Autopilot ask — ${answer} for ${ask.node.name}`, "nav");
  return null;
}

/* ---- per-step bookkeeping ------------------------------------------------- */

const step = () => mission.active?.steps[mission.stepIx] ?? null;

function beginStep() {
  const s = step();
  mission.run = { retries: mission.run?.retries ?? 0 };
  mission.stepStartedAt = sim.time;
  mission.noWarpFor = -1;
  autopilot.warpAllowed = null;
  autopilot.chargeSince = null;
  autopilot.onLane = false;
  autopilot.unstick = null;
  /* the progress watchdog measures one step's closure; a new step is a new
   * target and a stale best distance would read as "stuck" on the first tick */
  resetProgress();
  if (s) missionHooks.onStep?.(s, mission.stepIx);
}

function cleanupStep() {
  const r = mission.run;
  if (r?.wpId) { removeWaypoint(r.wpId); r.wpId = null; }
  autopilot.portId = null;
}

function advance() {
  const m = mission.active;
  cleanupStep();
  mission.run = {};
  mission.stepIx++;
  if (mission.stepIx >= m.steps.length) {
    mission.iter++;
    const L = m.loop ?? { mode: "none" };
    const snap = snapshot({ stepStartedAt: mission.stepStartedAt, loops: mission.iter });
    const again = L.mode === "count" ? mission.iter < (L.count ?? 1) : L.mode === "until" ? !evalCond(L.until, snap) : false;
    mission.stats.loops = mission.iter;
    autopilot.loops = mission.iter;
    if (!again) {
      const why = m.steps.length === 1 && mission.lastWhy ? mission.lastWhy : `${m.name} complete — ${mission.iter} run${mission.iter === 1 ? "" : "s"}, ${Math.round(mission.stats.earned)} cr`;
      stopMission(why, { state: "done" });
      return;
    }
    mission.stepIx = 0;
    logEvent(`${m.name}: run ${mission.iter} done, going round again`, "nav");
  }
  beginStep();
  saveRun();
}

function fail(why) {
  const s = step();
  const policy = s?.onFail ?? "abort";
  logEvent(`${mission.active?.name ?? "Mission"}: ${s?.op ?? "step"} failed — ${why}`, "nav");
  if (policy === "skip") { advance(); return; }
  if (policy === "retry" && (mission.run.retries ?? 0) < 3) { const n = (mission.run.retries ?? 0) + 1; cleanupStep(); beginStep(); mission.run.retries = n; return; }
  stopMission(`failed — ${why}`, { state: "failed" });
}

function mirror() {
  const m = mission.active;
  if (!m) return;
  autopilot.mode = m.mode ?? (m.steps.some((s) => s.op === "MINE") ? "mine" : m.steps[0]?.op === "GOTO" ? "warp" : "approach");
  autopilot.loops = mission.stats.loops;
  autopilot.earned = mission.stats.earned;
}

/** → min(step.thrustCap ?? m.defaults.thrustCap, throttleCap()) */
export function stepThrustCap(s = step()) {
  const cap = s?.thrustCap ?? mission.active?.defaults?.thrustCap ?? 1;
  return Math.max(0.1, Math.min(cap, 1.4, throttleCap()));
}

/** → step.warp ?? m.defaults.warp (SUBLIGHT answered for this step → "never") */
export function stepWarpPolicy(s = step()) {
  if (s && mission.noWarpFor === mission.stepIx && mission.active?.steps[mission.stepIx] === s) return "never";
  return s?.warp ?? mission.active?.defaults?.warp ?? "auto";
}

/* ---- targets ------------------------------------------------------------------ */

function markAt(name, p) {
  const wp = addWaypointAt(name, p.x, p.y, p.z);
  wp.transient = true;
  mission.run.wpId = wp.id;
  return warpNodeById(wp.id);
}

function nearestUnsurveyed() {
  const ship = sim.ship;
  let best = null, bd = Infinity;
  for (const b of BODIES) {
    if (b.kind === "star" || b.shattered || sim.scanned?.has(b.id)) continue;
    bodyPosition(b.id, sim.time, _p);
    const d = dist3(_p, ship.pos);
    if (d < bd) { bd = d; best = b; }
  }
  return best;
}

/** Resolve a step's Ref once per step: a warp node (and the station for DOCK). */
function resolve(s) {
  const r = mission.run;
  if (r.node !== undefined) return r.node;
  const ref = s.target;
  let node = null;
  switch (ref?.kind) {
    case "locked": node = sim.selected ? warpNodeById(sim.selected) : null; break;
    case "body": node = ref.id ? warpNodeById(ref.id) : (() => { const b = nearestUnsurveyed(); return b ? warpNodeById(b.id) : null; })(); break;
    case "station": case "wp": node = warpNodeById(ref.id); break;
    case "point": node = markAt(ref.name ?? "Mission point", ref); break;
    case "here": node = markAt("the start", mission.origin ?? sim.ship.pos); break;
    case "seam": {
      const seam = typeof ref.x === "number" ? ref : sim.autoPlan.seam ?? nearestSeam();
      if (seam) { r.seam = { x: seam.x, y: seam.y, z: seam.z, name: seam.name ?? ref.name ?? "the seam" }; node = markAt(r.seam.name, r.seam); }
      break;
    }
    case "trade-source": {
      /* the top of a round: a new route from where the hull is now */
      mission.trade = null;
      const t = pickRoute();
      node = t ? warpNodeById(t.fromId) : null;
      if (!t) mission.run.noRoute = true;
      break;
    }
    case "trade-dest": {
      const t = mission.trade;
      node = t ? warpNodeById(t.toId) : null;
      break;
    }
    case "best-buyer": case "best-smelter": case "nearest-port": {
      const st = bestPortFor(ref.kind === "best-buyer" ? "sell" : ref.kind === "best-smelter" ? "smelt" : "nearest");
      node = st ? warpNodeById(st.id) : null;
      break;
    }
    default: node = null;
  }
  r.node = node;
  r.st = node && node.kind === "station" ? stationById(node.id) : null;
  autopilot.portId = r.st?.id ?? null; // sim.js flies the last leg in this port's frame
  if (node && node.id !== sim.selected) selectBody(node.id); // the core jumps to the lock
  if (node) autopilot.targetId = node.id;
  return node;
}

/** Docked hulls leave first; port control keeps the helm on the way out. → "flying" | "clear" */
function ensureUndocked() {
  const ship = sim.ship;
  if (ship.dockedAt) {
    autopilot.phase = "undock";
    autopilot.task = `undock · ${stationById(ship.dockedAt)?.name ?? "port"}`;
    autopilot.onLane = false;
    sim.dockRequestFor = null;
    if (sim.time - (mission.run.undockAt ?? -99) > 5) { mission.run.undockAt = sim.time; toggleDock(); }
    return "flying";
  }
  if (tractor.active && tractor.phase === "push") { autopilot.phase = "undock"; autopilot.task = "departure"; apHold(); return "flying"; }
  return "clear";
}

function untilMet(s) {
  return s.until ? evalCond(s.until, snapshot({ stepStartedAt: mission.stepStartedAt, loops: mission.iter })) : false;
}

const legOpts = (s, extra = {}) => ({ cap: stepThrustCap(s), warp: stepWarpPolicy(s), ...extra });

/* ---- executors ------------------------------------------------------------------ */

function legTo(s, node, extra) {
  const r = apLeg(node, legOpts(s, extra));
  if (r === "flying" || r === "near" || r === "asking") return r;
  return `fail:${r.replace(/^blocked:/, "")}`;
}

export const EXEC = {
  GOTO(s) {
    const node = resolve(s);
    if (!node) return "fail:lost the target";
    if (sim.ship.dockedAt && sim.ship.dockedAt === node.id) { mission.run.why = `docked at ${node.name}`; return "done"; }
    if (ensureUndocked() === "flying") return "flying";
    node.pos(_p);
    const dist = dist3(_p, sim.ship.pos);
    if (s.args?.jumpOnly) {
      if (autopilot.jumped && sim.warp.state !== "run") {
        /* a dropout is not an arrival — see jumpEndedShort() */
        const drop = jumpEndedShort(node, dist);
        if (!drop) { apHold(); mission.run.why = `jump complete — ${node.name} on the bow, you have the stick`; return "done"; }
        mission.run.drops = (mission.run.drops ?? 0) + 1;
        if (mission.run.drops > 3) { apHold(); return `fail:the core keeps dropping out on ${drop.name} — plot a shorter hop`; }
        logEvent(`Dropout on ${drop.name} at ${Math.round(drop.frac * 100)}% — going again (${mission.run.drops}/3)`, "nav");
        autopilot.jumped = false;
        sim.warp.dropped = null;
      }
      if (dist <= Math.max(node.arriveR, 2000) && sim.warp.state === "idle") { apHold(); mission.run.why = `already at ${node.name} — you have the stick`; return "done"; }
      return legTo(s, node, { farLeg: node.arriveR * 1.5, graze: "go" });
    }
    const r = legTo(s, node);
    if (r !== "near") return r;
    if (apPark(node) !== "parked") return "flying";
    mission.run.why = node.body ? `holding over ${node.name} — survey and works range` : `holding at ${node.name}`;
    return "done";
  },
  APPROACH(s) {
    const node = resolve(s);
    if (!node) return "fail:lost the target";
    if (sim.ship.dockedAt && sim.ship.dockedAt === node.id) { mission.run.why = `docked at ${node.name}`; return "done"; }
    if (ensureUndocked() === "flying") return "flying";
    const r = legTo(s, node);
    if (r !== "near") return r;
    if (node.kind === "station") {
      const d = apDock(mission.run.st);
      if (d === "lost") return "fail:lost the port";
      if (d === "docked") { mission.run.why = `docked at ${node.name}`; return "done"; }
      return "flying";
    }
    if (apPark(node) !== "parked") return "flying";
    mission.run.why = node.body ? `holding over ${node.name} — survey and works range` : `holding at ${node.name}`;
    return "done";
  },
  DOCK(s) {
    const node = resolve(s);
    const st = mission.run.st;
    if (mission.run.noRoute) return "fail:no trade route pays from here — nothing sells for more elsewhere than it costs here, with this hold and purse";
    if (s.target?.kind === "trade-dest" && !mission.trade) return "fail:no route on the books — the run has to start at its source";
    if (!node || !st) return "fail:no port to dock at";
    if (sim.ship.dockedAt === st.id) { mission.run.why = `docked at ${st.name}`; return "done"; }
    if (ensureUndocked() === "flying") return "flying";
    if (!mission.run.logged) { mission.run.logged = true; logEvent(`${mission.active.name}: heading for ${st.name}`, "nav"); }
    const r = legTo(s, node);
    if (r !== "near") return r;
    const d = apDock(st);
    if (d === "lost") return "fail:lost the port";
    if (d === "docked") { mission.run.why = `docked at ${st.name}`; return "done"; }
    return "flying";
  },
  UNDOCK() {
    if (ensureUndocked() === "flying") return "flying";
    mission.run.why = "clamps clear";
    return "done";
  },
  MINE(s) {
    const ship = sim.ship;
    if (untilMet(s) || holdRoom(ship) < 1) { apHold(); mission.run.why = "hold full"; return "done"; }
    /* battery flat outside the belt: nothing to be done here but leave */
    if (ship.charge / batteryCap(ship) <= AP_POWER.floor && !inBelt(ship.pos) && sim.time - mission.stepStartedAt > 5) { apHold(); mission.run.why = "battery flat"; return "done"; }
    const node = resolve(s);
    const seam = mission.run.seam;
    if (!node || !seam) return "fail:no seam to work";
    if (ensureUndocked() === "flying") return "flying";
    const r = apMine(seam);
    if (r !== "offSeam") return "flying";
    const leg = legTo(s, node);
    if (leg !== "near") return leg;
    if (apPark(node) !== "parked") return "flying";
    if (!inBelt(ship.pos)) return `fail:${seam.name} is not in a belt, nothing to cut here`;
    autopilot.phase = "seek";
    return "flying";
  },
  SELL: (s) => T.SELL(s),
  STASH(s) {
    const st = stationById(sim.ship.dockedAt);
    if (!st) return "fail:not docked";
    autopilot.phase = "trade"; autopilot.task = `stash · ${st.name}`;
    const e = stashDeposit(s.args?.what && s.args.what !== "ore" ? s.args.what : "all");
    if (e) return `fail:stash refused (${e.toLowerCase()})`;
    mission.run.why = `hold stashed at ${st.name}`;
    return "done";
  },
  SMELT() {
    const st = stationById(sim.ship.dockedAt);
    if (!st) return "fail:not docked";
    autopilot.phase = "trade"; autopilot.task = `smelt · ${st.name}`;
    if (!canSmeltAt(st)) return "fail:no works here";
    const e = smeltAll();
    if (e) return `fail:smelt refused (${e.toLowerCase()})`;
    mission.run.why = `ore smelted at ${st.name}`;
    return "done";
  },
  BUY: (s) => T.BUY(s),
  CHARGE(s) {
    const ship = sim.ship;
    autopilot.phase = "charge";
    const frac = ship.charge / batteryCap(ship); // live: autopilot.power only refreshes while a leg flies
    autopilot.task = `charging · ${Math.round(frac * 100)}%`;
    if (!ship.dockedAt) apHold();
    if (untilMet(s) || (!s.until && frac >= 0.85)) { mission.run.why = "charged"; return "done"; }
    if (!ship.dockedAt && sim.time - mission.stepStartedAt > 60 && busIdle(ship).load >= ship.reactor) return "fail:the bus draws more than the core makes — nothing to charge with";
    /* a port that cannot fill the bank is not worth a night: the old loop left after four minutes */
    if (ship.dockedAt && sim.time - mission.stepStartedAt > 240) { mission.run.why = "charged enough"; return "done"; }
    return "flying";
  },
  WAIT(s) {
    autopilot.phase = "hold"; autopilot.task = `wait · ${Math.round(sim.time - mission.stepStartedAt)}s`;
    if (!sim.ship.dockedAt) apHold();
    return untilMet(s) || (!s.until && sim.time - mission.stepStartedAt >= 60) ? "done" : "flying";
  },
  HOLD(s) {
    autopilot.phase = "hold"; autopilot.task = "station-keeping";
    if (!sim.ship.dockedAt) apHold();
    return untilMet(s) ? "done" : "flying";
  },
  SURVEY(s) {
    const node = resolve(s);
    if (!node || !node.body) return "fail:no world to survey";
    if (sim.scanned?.has(node.id) && !mission.run.requested) { mission.run.why = `${node.name} already logged`; return "done"; }
    if (ensureUndocked() === "flying") return "flying";
    const r = legTo(s, node);
    if (r !== "near") return r;
    if (apPark(node) !== "parked") return "flying";
    autopilot.phase = "park"; autopilot.task = `survey · ${node.name}`;
    if (!mission.run.requested) { mission.run.requested = sim.time; requestScan(); return "flying"; }
    if (sim.scanned?.has(node.id) || sim.time - mission.run.requested > 3) { mission.run.why = `${node.name} surveyed`; return "done"; }
    return "flying";
  },
  SET(s) {
    const a = s.args ?? {};
    if (a.turretMode) setTurretMode(a.turretMode);
    if (a.miningMode) setMiningMode(a.miningMode);
    if (a.system?.key) { const on = Boolean(sim.ship[a.system.key]); if (on !== Boolean(a.system.on)) toggleSystem(a.system.key); }
    if (a.posture && globalThis.document) globalThis.document.querySelector(`[data-posture="${a.posture}"]`)?.click();
    mission.run.why = "set";
    return "done";
  },
};

/* ---- the tick ------------------------------------------------------------------- */

function beginAsk(node) {
  if (mission.state === "asking") return;
  mission.state = "asking";
  mission.ask = { stepIx: mission.stepIx, node: { id: node.id, name: node.name }, reserve: warpReserve() };
  post({
    channel: "sys", from: "AUTOPILOT",
    text: `Jump to ${node.name}? ${Math.round(sim.ship.charge).toLocaleString()} charge in hand, ${Math.round(mission.ask.reserve).toLocaleString()} for the spool.`,
    links: [
      { label: "JUMP", run: () => answerAsk("jump") },
      { label: "SUBLIGHT", run: () => answerAsk("sublight") },
      { label: "ABORT", run: () => answerAsk("abort") },
    ],
  });
  missionHooks.onAsk?.(mission.ask);
}

/** called by autopilot.tickAutopilot every tick it has the ship */
export function tickMission(dt) {
  void dt;
  const m = mission.active;
  if (!m || (mission.state !== "running" && mission.state !== "asking")) return null;
  const s = step();
  if (!s) { advance(); return null; }
  mirror();
  autopilot.capNow = stepThrustCap(s);
  const exec = EXEC[s.op];
  if (!exec) { fail(`unknown op ${s.op}`); return null; }
  const r = exec(s);
  if (r === "asking") { beginAsk(mission.run.node); return null; }
  if (mission.state === "asking") { mission.state = "running"; mission.ask = null; }
  if (r === "done") { mission.lastWhy = mission.run.why ?? null; advance(); }
  else if (typeof r === "string" && r.startsWith("fail:")) fail(r.slice(5));
  return null;
}

/* ---- status ------------------------------------------------------------------------ */

/** → "MINE LOOP · 2/3 DOCK Foundry Hold · lane · 3 loops · 12,400 cr" */
export function missionStatusLine() {
  const m = mission.active;
  if (!m) return "";
  const s = step();
  const parts = [m.name];
  if (mission.state === "paused") parts.push("PAUSED");
  if (mission.state === "asking") parts.push("ASK");
  if (s) parts.push(`${mission.stepIx + 1}/${m.steps.length} ${s.op}${s.target ? ` ${mission.run?.node?.name ?? describeRef(s.target)}` : ""}`);
  if (mission.state !== "paused" && autopilot.phase && autopilot.phase !== "idle") parts.push(autopilot.phase);
  if (mission.stats.loops) parts.push(`${mission.stats.loops} loop${mission.stats.loops === 1 ? "" : "s"}`);
  if (mission.stats.earned) parts.push(`${Math.round(mission.stats.earned).toLocaleString()} cr`);
  return parts.join(" · ");
}

/* ---- persistence ------------------------------------------------------------------- */

export function saveRun() {
  try {
    const ls = globalThis.localStorage;
    if (!ls || !mission.active || !sim.skySeed) return;
    ls.setItem(RUN_KEY(), JSON.stringify({ mission: JSON.parse(serialize(mission.active)), stepIx: mission.stepIx, iter: mission.iter, stats: mission.stats, trade: mission.trade }));
  } catch { /* storage is a convenience */ }
}

export function clearRun() {
  try { globalThis.localStorage?.removeItem(RUN_KEY()); } catch { /* ignore */ }
}

/** On the first tick in a sky: a saved run comes back paused — a reload never flies by itself. */
export function restoreRun() {
  const key = `${sim.skySeed}:${sim.callsign}`;
  if (mission.key === key) return false;
  mission.key = key;
  if (mission.active || !sim.skySeed) return false;
  try {
    const raw = globalThis.localStorage?.getItem(RUN_KEY());
    if (!raw) return false;
    const o = JSON.parse(raw);
    const m = deserialize(o.mission);
    if (!m || !m.steps.length) return false;
    mission.active = m;
    mission.stepIx = Math.min(o.stepIx ?? 0, m.steps.length - 1);
    mission.iter = o.iter ?? 0;
    mission.stats = { earned: 0, loops: 0, startedAt: sim.time, ...(o.stats ?? {}) };
    mission.trade = o.trade ?? null;          // a trade round comes back with the route it bought for
    mission.state = "paused";
    mission.run = {};
    mission.origin = { x: sim.ship.pos.x, y: sim.ship.pos.y, z: sim.ship.pos.z, name: "the start" };
    note(`Mission ${m.name} restored, paused at step ${mission.stepIx + 1} — RESUME from NAV › AUTOPILOT.`);
    return true;
  } catch {
    return false;
  }
}
