import {
  plotRoute, requestJump, selectBody, setNoticeAbout, sim, stationStatus, toggleDock,
  warpDestination, warpNodeById, logEvent, setThrottle, WARP, spoolTime, setMiningMode, canSmeltAt,
  sellPriceAt, warpBlock, toggleWarp, setNavTarget,
} from "../sim/sim.js";
import { threatTo, avoidAim, avoidLevel, deliberate, surfaceOnly, clearAvoidCommit, avoidCommit, blind, AVOID } from "./avoid.js";
import { setInjectedPan, touch } from "../core/input.js";
import * as shipMod from "./ship.js";
import { BATTERY, DRAW, buildDemand, forwardOf, holdRoom, lifeDraw } from "./ship.js";
import { captain, ariaHooks } from "../npc/captain.js";
import { bodyPosition, currentSystem, dist3 } from "../world/bodies.js";
import { stations, TRACTOR_V } from "../station/stations.js";
import { lanePoint } from "../npc/lanes.js";
import { requestDock } from "../station/stationworks.js";
import { inBelt, nearbyRocks, beltExit, siteMarkRock, skipMarkRock } from "../world/field.js";
import { mining, MINE_RANGE } from "./turrets.js";
import { preferenceFor } from "../aria/aria.js";
import { oneStep, makeMission, makeStep } from "../mission/script.js";
import { mission, startMission, stopMission, resumeMission, tickMission, missionStatusLine, restoreRun, answerAsk } from "../mission/run.js";
import { jobForSite } from "../economy/contracts.js";
import { goodName } from "../economy/materials.js";

const batteryCap = (ship) => shipMod.batteryCap?.(ship) ?? BATTERY;

export const autopilot = {
  on: false,
  avoiding: null,
  mode: "approach",
  targetId: null,
  phase: "idle",
  task: "",
  why: "",
  jumped: false,
  engagedAt: 0,
  chargeSince: null,
  chargeWas: 0,
  seam: null,
  siteRock: null,
  rockKey: null,
  rockSince: 0,
  skip: new Map(),
  loops: 0,
  earned: 0,
  dockedAt: 0,
  capNow: 1,
  warpAllowed: null,
  power: { throttle: 0, sustainable: 0, frac: 1, reserve: 0 },
  watch: { best: Infinity, since: 0 },
  ignore: blind,
  unstick: null,
  unstuckCount: 0,
};

export const AP_STUCK = { idleS: 14, burnS: 7, blindS: 11 };

export const AP_POWER = {
  floor: 0.2,
  band: 0.6,
  dipThrottle: 1.0,
  eco: 0.35,
  warpMargin: 120,
};

export function sustainableThrottle(ship) {
  const spare = (ship.reactor ?? 130) - busIdle(ship).load;
  return Math.max(0, Math.min(1, Math.sqrt(Math.max(0, spare) / DRAW.thrustCurve)));
}

const BUS_SWITCH = [
  ["shields", "SHLD"], ["cutter", "MINER"], ["rig", "RIG"], ["turrets", "TURR"], ["gravity", "GRAV"], ["ops", "FLOOD/SENTRY/SALVG"], ["bench", "ICE WORKS"],
];

export function busIdle(ship) {
  const d = buildDemand(ship, 0, false, 0);
  const on = {
    shields: ship.shields ? d.shields : 0,
    cutter: d.cutter,
    rig: d.rig ?? 0,
    bench: d.bench,
    turrets: ship.turretsArmed && ship.turretMode !== "off" ? d.turrets : 0,
    gravity: ship.localGravity ? DRAW.gravity : 0,
    ops: d.ops,
  };
  let load = d.base + DRAW.enginesIdle * (ship.engines ? 1 : 0) + lifeDraw(ship, true);
  for (const k in on) load += on[k];
  return { load, on };
}

export function busOverload(ship) {
  const frac = ship.charge / batteryCap(ship);
  const idle = busIdle(ship);
  const spare = (ship.reactor ?? 130) - idle.load;
  const over = frac <= AP_POWER.floor && spare < 1;
  let why = "";
  if (over) {
    const sheddable = BUS_SWITCH.filter(([k]) => idle.on[k] > 0).map(([k, label]) => [label, idle.on[k]]).sort((a, b) => b[1] - a[1]);
    const list = sheddable.map(([label, kw]) => `${label} ${Math.round(kw)}`).join(" · ");
    why = `bus ${Math.round(idle.load)} kW on a ${Math.round(ship.reactor ?? 130)} kW core, battery flat — switch off ${list || "something"} (kW)`;
  }
  return { over, spare, why };
}

export function warpReserve() {
  return WARP.minCharge + WARP.draw * spoolTime() + AP_POWER.warpMargin;
}

export function powerThrottle(ship, want, jumpAhead = false) {
  const frac = ship.charge / batteryCap(ship);
  const sus = sustainableThrottle(ship);
  let cap;
  if (frac <= AP_POWER.floor) cap = 0;
  else if (frac < AP_POWER.band) cap = sus * ((frac - AP_POWER.floor) / (AP_POWER.band - AP_POWER.floor)) + sus * 0.35;
  else cap = Math.max(sus, AP_POWER.dipThrottle * Math.min(1, (frac - AP_POWER.band) / 0.25 + 0.6));
  if (jumpAhead && ship.charge < warpReserve() * 1.15) cap = Math.min(cap, sus * 0.8);
  if (frac > AP_POWER.floor) cap = Math.max(cap, AP_POWER.eco);
  const bus = busOverload(ship);
  autopilot.overload = bus.over;
  const wasCoasting = autopilot.coasting;
  autopilot.coasting = frac <= AP_POWER.floor;
  if (autopilot.on && autopilot.coasting && !wasCoasting && !bus.over) {
    const refill = Math.max(0, AP_POWER.floor * batteryCap(ship) - ship.charge) / Math.max(1, bus.spare);
    sim.notice = `Autopilot coasting — battery under ${Math.round(AP_POWER.floor * 100)}%, mains cold until it refills (~${Math.ceil(refill)} s at +${Math.round(bus.spare)} kW).`;
  }
  let t = Math.min(want, cap);
  if (t > 0 && t < AP_POWER.eco * 0.5) t = 0;
  autopilot.power = { throttle: t, sustainable: sus, frac, reserve: warpReserve() };
  return t;
}

export function drifting(target, frameVel, allowed, wasBraking = false) {
  const ship = sim.ship;
  const dx = target.x - ship.pos.x, dy = target.y - ship.pos.y, dz = target.z - ship.pos.z;
  const d = Math.hypot(dx, dy, dz) || 1;
  const vx = ship.vel.x - frameVel.x, vy = ship.vel.y - frameVel.y, vz = ship.vel.z - frameVel.z;
  const closing = (vx * dx + vy * dy + vz * dz) / d;
  const lateral = Math.sqrt(Math.max(0, vx * vx + vy * vy + vz * vz - closing * closing));
  const k = wasBraking ? 0.6 : 1;
  if (lateral > Math.max(DEAD_SLOW * 1.5, allowed * 0.35) * k) return true;
  return closing < -Math.max(DEAD_SLOW, allowed * 0.15) * k;
}

const PARK_RADII = 2.5;
const PORT_PARK = 1400;
const POINT_PARK = 500;
const DEAD_SLOW = 10;
const ROCK_STANDOFF = 0.75;
const SEAM_REACH = 25000;
const ALIGN_CEILING = 600;
const BELT_CLEAR = 3800;
const _p = { x: 0, y: 0, z: 0 };
const _v = { x: 0, y: 0, z: 0 };
const _w = { x: 0, y: 0, z: 0 };

export function planDefaults() {
  sim.autoPlan.defaults ??= { thrustCap: 1, warp: "auto" };
  return sim.autoPlan.defaults;
}

function refOfNode(node) {
  return { kind: node.kind === "point" ? "wp" : node.kind, id: node.id, name: node.name };
}

export function engageAutopilot(targetId = sim.selected, mode = "approach") {
  if (captain.holder !== "player") { sim.notice = "The conn has the ship — the autopilot stands down."; return false; }
  if (mode === "mine") return engageMiningLoop();
  const node = targetId ? warpNodeById(targetId) : null;
  if (node) ariaHooks.onPlayerJob?.(node.kind === "station" ? "sell" : node.body && !sim.scanned?.has(node.id) ? "survey" : null, 2);
  if (!node) { sim.notice = "Autopilot needs a target — lock a world, a port or a saved location."; return false; }
  if (sim.ship.dockedAt) { sim.notice = "Clamps on. Undock first."; return false; }
  const d = planDefaults();
  const m = oneStep(mode === "warp" ? "GOTO" : "APPROACH", refOfNode(node), { thrustCap: d.thrustCap ?? 1, warp: mode === "warp" ? "auto" : d.warp ?? "auto" });
  if (mode === "warp") m.steps[0].args = { jumpOnly: true };
  m.mode = mode;
  if (!startMission(m)) return false;
  autopilot.targetId = targetId;
  selectBody(targetId);
  setNoticeAbout(mode === "warp"
    ? `Nav has the core — coming about for ${node.name}, jumping when the lane is clean. Touch the stick to take it back.`
    : `Autopilot has the approach — ${node.name}. Touch the stick to take it back.`, node.name);
  logEvent(`${mode === "warp" ? "Auto-warp" : "Autopilot"} engaged — ${node.name}`, "nav");
  return true;
}

export function engageAutoWarp(targetId = sim.selected) {
  return engageAutopilot(targetId, "warp");
}

export function engageMiningLoop(seam = null) {
  if (captain.holder !== "player") { sim.notice = "The conn has the ship — the autopilot stands down."; return false; }
  const s = seam ?? sim.autoPlan.seam ?? nearestSeam();
  if (!s) { sim.notice = "No belt in this sky to work."; return false; }
  if (!inBelt(s)) { sim.notice = `${s.name ?? "That point"} is not in a belt — nothing to cut there.`; return false; }
  sim.autoPlan.seam = { x: s.x, y: s.y, z: s.z, name: s.name ?? "the seam", ...(s.site ? { site: String(s.site) } : {}) };
  ariaHooks.onPlayerJob?.("mine", 3);
  const job = s.site ? jobForSite(s.site) : null;
  if (job) return engageJobLoop(job);
  const onDock = sim.autoPlan.onDock;
  const desk = onDock === "stash" ? [makeStep("STASH", null, { args: { what: "all" } })]
    : onDock === "smelt" ? [makeStep("SMELT", null, { onFail: "skip" }), makeStep("SELL", null, { args: { what: "ore" } })]
    : [makeStep("SELL", null, { args: { what: "ore" } })];
  const d = planDefaults();
  const m = makeMission({
    name: "MINE LOOP", builtin: true, mode: "mine",
    steps: [
      makeStep("MINE", { kind: "seam", ...sim.autoPlan.seam }, { until: { k: "hold", op: ">=", v: 0.9 } }),
      makeStep("DOCK", { kind: onDock === "smelt" ? "best-smelter" : "best-buyer" }),
      ...desk,
      makeStep("CHARGE", null, { until: { k: "charge", op: ">=", v: 0.85 } }),
    ],
    loop: sim.autoPlan.loop ? { mode: "count", count: Infinity } : { mode: "none" },
    defaults: { thrustCap: d.thrustCap ?? 1, warp: d.warp ?? "auto" },
  });
  if (!startMission(m)) return false;
  setNoticeAbout(`Mining loop on — ${sim.autoPlan.seam.name}, then ${onDock} at the best port${sim.autoPlan.loop ? ", and back out" : ""}. Touch the stick to take it back.`, "AUTO");
  logEvent(`Mining loop engaged — ${sim.autoPlan.seam.name} · on dock: ${onDock} · loop ${sim.autoPlan.loop ? "on" : "off"}`, "nav");
  return true;
}

function engageJobLoop(job) {
  const seam = sim.autoPlan.seam;
  const d = planDefaults();
  const m = makeMission({
    name: "JOB LOOP", builtin: true, mode: "mine",
    steps: [
      makeStep("MINE", { kind: "seam", ...seam }, { until: { any: [{ k: "cargoOf", id: job.good, op: ">=", v: job.qty }, { k: "hold", op: ">=", v: 0.9 }] } }),
      makeStep("DOCK", { kind: "station", id: job.stationId, name: job.stationName }),
      makeStep("DELIVER", null, { args: { site: String(job.id) } }),
      makeStep("SELL", null, { args: { what: "ore" }, onFail: "skip" }),
      makeStep("CHARGE", null, { until: { k: "charge", op: ">=", v: 0.85 } }),
    ],
    loop: { mode: "count", count: Infinity },
    defaults: { thrustCap: d.thrustCap ?? 1, warp: d.warp ?? "auto" },
  });
  if (!startMission(m)) return false;
  setNoticeAbout(`Job loop on — cut ${job.qty} ${goodName(job.good)} at ${seam.name}, deliver to ${job.stationName}. Touch the stick to take it back.`, "AUTO");
  logEvent(`Job loop engaged — ${job.title} · ${seam.name} → ${job.stationName}`, "nav");
  return true;
}

export function disengageAutopilot(why = "disengaged") {
  if (!autopilot.on && !mission.active) return;
  stopMission(why);
}

export function releaseControls() {
  if (autopilot.on && sim.warp.state === "spool") toggleWarp();
  if (autopilot.on) sim.wantJump = false;
  autopilot.on = false;
  autopilot.coasting = false;
  sim.handsOff = false;
  if (autopilot.cutterWas && sim.ship.miningMode !== autopilot.cutterWas) setMiningMode(autopilot.cutterWas, { quiet: true });
  autopilot.cutterWas = null;
  autopilot.phase = "idle";
  autopilot.task = "";
  autopilot.onLane = false;
  autopilot.warpAllowed = null;
  autopilot.capNow = 1;
  sim.dockRequestFor = null;
  autopilot.portId = null;
  autopilot.skip.clear();
  autopilot.ignore.clear();
  autopilot.unstick = null;
  autopilot.avoiding = null;
  autopilot.watch.best = Infinity;
  autopilot.watch.since = 0;
  clearAvoidCommit();
  setInjectedPan(null);
  touch.brake = false;
  setThrottle(0);
}

export function toggleAutopilot() {
  if (autopilot.on) disengageAutopilot("stood down");
  else if (mission.active && mission.state === "paused") resumeMission();
  else engageAutopilot();
}

export function cycleAutoPlan() {
  const order = ["sell", "stash", "smelt"];
  const i = order.indexOf(sim.autoPlan.onDock);
  sim.autoPlan.onDock = order[(i + 1) % order.length];
  return sim.autoPlan.onDock;
}

export function nearestSeam() {
  const ship = sim.ship;
  const belts = [];
  for (const [b, name] of [[currentSystem.belt, "the belt"], [currentSystem.outerBelt, "the outer belt"]]) {
    if (!b) continue;
    const ang = Math.atan2(ship.pos.z, ship.pos.x);
    const r = (b.inner + b.outer) / 2;
    belts.push({ x: Math.cos(ang) * r, y: 0, z: Math.sin(ang) * r, name });
  }
  belts.sort((a, b) => dist3(ship.pos, a) - dist3(ship.pos, b));
  return belts[0] ?? null;
}

let threatAt = 0;
let threat = null;

export function apThreat() { return threat; }

export function refreshThreat(force = false) {
  const now = sim.wall * 1000;
  if (!force && now - threatAt < AVOID.everyMs) return threat;
  threatAt = now;
  threat = threatTo(sim.ship.pos, sim.ship.vel, { exempt: deliberate(sim, mining), surface: surfaceOnly(sim), time: sim.time });
  return threat;
}

export function apProgress(dist, floor = 0) {
  const w = autopilot.watch;
  if (!Number.isFinite(dist)) return false;
  if (!w.since) { w.best = dist; w.since = sim.time; return false; }
  if (dist < w.best - Math.max(40, w.best * 0.0015)) { w.best = dist; w.since = sim.time; return false; }
  if (dist <= floor) { w.best = Math.min(w.best, dist); w.since = sim.time; return false; }
  if (sim.time - w.since <= AP_STUCK.idleS) return false;
  const sp = Math.hypot(sim.ship.vel.x, sim.ship.vel.y, sim.ship.vel.z);
  if (!autopilot.avoiding && sp > 30) { w.best = dist; w.since = sim.time; return false; }
  return true;
}

export function resetProgress(dist = Infinity) {
  autopilot.watch.best = dist;
  autopilot.watch.since = sim.time;
}

export function beginUnstick(why = "boxed in") {
  const ship = sim.ship;
  let ax = 0, ay = 1, az = 0;
  const ex = beltExit(ship.pos);
  if (ex) {
    ax = 0; ay = ex.sign; az = 0;
  } else {
    const c = avoidCommit();
    if (c) { ax = c.x; ay = c.y; az = c.z; }
    else {
      const f = forwardOf(ship.yaw, ship.pitch);
      ax = -f.z; ay = 0.35; az = f.x;
    }
  }
  const n = Math.hypot(ax, ay, az) || 1;
  autopilot.unstick = { until: sim.time + AP_STUCK.burnS, x: ax / n, y: ay / n, z: az / n, why };
  autopilot.unstuckCount++;
  const hz = threat;
  if (hz) autopilot.ignore.set(hz.id, sim.time + AP_STUCK.blindS);
  clearAvoidCommit();
  resetProgress();
  logEvent(`Autopilot boxed in — ${why}; breaking out`, "nav");
  return autopilot.unstick;
}

export function apUnstick() {
  const u = autopilot.unstick;
  if (!u) return false;
  if (sim.time >= u.until) { autopilot.unstick = null; resetProgress(); return false; }
  const ship = sim.ship;
  autopilot.phase = "clear";
  autopilot.task = `break out · ${u.why}`;
  apSteer(ship.pos.x + u.x * 2e5, ship.pos.y + u.y * 2e5, ship.pos.z + u.z * 2e5, 0.75, { avoid: "soft" });
  return true;
}

export function apSteer(tx, ty, tz, want, opts = false) {
  const o = opts && typeof opts === "object" ? opts : { jumpAhead: Boolean(opts) };
  const jumpAhead = Boolean(o.jumpAhead);
  const policy = o.avoid ?? "full";
  const ship = sim.ship;

  let hz = policy === "off" ? null : refreshThreat();
  let level = avoidLevel(hz);
  if (policy === "soft" && level < 3) { hz = null; level = 0; }
  let hardBrake = false;
  if (hz && level > 0) {
    avoidAim(ship.pos, ship.vel, hz, _avoid, sim.time);
    tx = _avoid.x; ty = _avoid.y; tz = _avoid.z;
    autopilot.avoiding = { name: hz.name, kind: hz.kind, t: Math.round(hz.t * 10) / 10, level, inside: Boolean(hz.inside) };
    if (level >= 2) want = Math.max(0.12, Math.min(want, 0.22));
    if (level >= 3) hardBrake = true;
  } else if (autopilot.avoiding) {
    autopilot.avoiding = null;
  }

  const dx = tx - ship.pos.x, dy = ty - ship.pos.y, dz = tz - ship.pos.z;
  const d = Math.hypot(dx, dy, dz) || 1;
  const wantYaw = Math.atan2(-dx / d, -dz / d);
  const wantPitch = Math.asin(Math.max(-1, Math.min(1, dy / d)));
  let ey = wantYaw - ship.yaw;
  while (ey > Math.PI) ey -= Math.PI * 2;
  while (ey < -Math.PI) ey += Math.PI * 2;
  const ep = wantPitch - ship.pitch;
  const f = forwardOf(ship.yaw, ship.pitch);
  const facing = (dx * f.x + dy * f.y + dz * f.z) / d;
  setInjectedPan({ x: Math.max(-1, Math.min(1, -ey * 1.7)), y: Math.max(-1, Math.min(1, ep * 1.7)) });

  if (hardBrake) {
    setThrottle(0);
    touch.brake = true;
    autopilot.phase = "avoid";
    autopilot.task = `avoid · ${hz.name}`;
    return { d, facing, avoiding: true };
  }

  const idle = level > 0 ? Math.min(want, 0.22) : 0.05;
  const shaped = facing > 0.85 ? want : facing > 0.3 ? Math.max(want * 0.35, idle) : idle;
  setThrottle(powerThrottle(ship, Math.min(shaped, autopilot.capNow), jumpAhead));
  return { d, facing, avoiding: level > 0 };
}

const _avoid = { x: 0, y: 0, z: 0 };

const LANE_DRIFT = 40;
const PIVOT_SPEED = 80;
export function flyTheLane(node, want = 0) {
  const ship = sim.ship;
  const dest = warpDestination(node);
  const dx = dest.x - ship.pos.x, dy = dest.y - ship.pos.y, dz = dest.z - ship.pos.z;
  const d = Math.hypot(dx, dy, dz) || 1;
  const fv = sim.frameVel ?? { x: 0, y: 0, z: 0 };
  const vx = ship.vel.x - fv.x, vy = ship.vel.y - fv.y, vz = ship.vel.z - fv.z;
  const sp = Math.hypot(vx, vy, vz);
  const along = (vx * dx + vy * dy + vz * dz) / d;
  const lat = Math.hypot(vx - (along * dx) / d, vy - (along * dy) / d, vz - (along * dz) / d);
  const drifting = lat > LANE_DRIFT || along < -LANE_DRIFT;
  if (drifting && sp > PIVOT_SPEED) {
    apSteer(ship.pos.x + (vx / sp) * 1e6, ship.pos.y + (vy / sp) * 1e6, ship.pos.z + (vz / sp) * 1e6, 0, { jumpAhead: true, avoid: "soft" });
    setThrottle(0);
    touch.brake = true;
    autopilot.lining = "shed";
    return lat;
  }
  apSteer(dest.x, dest.y, dest.z, drifting ? 0 : want, { jumpAhead: true, avoid: "soft" });
  if (drifting) { setThrottle(0); touch.brake = true; }
  autopilot.lining = drifting ? "pivot" : "lane";
  return lat;
}

export function apHold() {
  setInjectedPan({ x: 0, y: 0 });
  setThrottle(0);
}

export function pilotInput() {
  return Math.abs(touch.panX) > 0.06 || Math.abs(touch.panY) > 0.06 || Math.abs(touch.rcsX) > 0.06 || Math.abs(touch.rcsY) > 0.06;
}

export function relSpeedTo(vel) {
  const s = sim.ship;
  return Math.hypot(s.vel.x - vel.x, s.vel.y - vel.y, s.vel.z - vel.z);
}

export function bestPortFor(plan = sim.autoPlan.onDock) {
  const ship = sim.ship;
  let best = null, bestScore = -Infinity;
  for (const st of stations) {
    if (st.hostile && !st.claimed) continue;
    if (!st.hangars?.length && st.mount === "pirate") continue;
    const d = dist3(ship.pos, st);
    let score = -d / 100000;
    if (plan === "smelt") score += canSmeltAt(st) ? 4 : -2;
    else if (plan === "sell") {
      let value = 0;
      for (const [k, q] of Object.entries(ship.hold)) value += sellPriceAt(st, k) * q;
      score += Math.min(6, value / 4000) + (st.credits > 4000 ? 1 : -1);
    }
    const pref = preferenceFor("port", st.id);
    score = score >= 0 ? score * pref : score / pref;
    if (score > bestScore) { bestScore = score; best = st; }
  }
  return best;
}

export function parkDistance(node) {
  return node.body ? node.radius * PARK_RADII : node.kind === "point" ? POINT_PARK : PORT_PARK;
}

export function tickAutopilot(dt) {
  restoreRun();
  sim.handsOff = autopilot.on || captain.holder !== "player";
  if (!autopilot.on) return;
  if (sim.phase !== "play") return;
  if (captain.holder !== "player" && captain.holder !== "aria") { stopMission("stood down — the conn has the ship"); return; }
  if (pilotInput()) {
    if (captain.holder === "aria") { ariaHooks.onStick?.(); return; }
    stopMission("released — you have the stick"); return;
  }
  const ship = sim.ship;
  touch.brake = false;
  const bus = ship.dockedAt ? null : busOverload(ship);
  autopilot.overload = Boolean(bus?.over);
  if (bus?.over) {
    apHold();
    autopilot.cutterWas = null;
    stopMission(`stood down — ${bus.why}`);
    return;
  }
  const op = mission.active?.steps[mission.stepIx]?.op;
  if (op !== "MINE" && ship.miningMode !== "off") setMiningMode("off", { quiet: true });
  if (sim.warp.state === "run") autopilot.jumped = true;
  if (autopilot.ignore.size > 48) {
    for (const [k, until] of autopilot.ignore) if (until <= sim.time) autopilot.ignore.delete(k);
  }
  tickMission(dt);
}

export function apLeg(node, { cap = 1, warp = "auto", farLeg = null, graze = "hold" } = {}) {
  const ship = sim.ship;
  autopilot.capNow = cap;
  const park = parkDistance(node);
  node.pos(_p);
  const dist = dist3(_p, ship.pos);
  const far = farLeg ?? Math.max(90000, node.arriveR * 2);
  if (sim.warp.state === "spool") { autopilot.phase = "warp"; autopilot.task = `spool · ${node.name}`; flyTheLane(node, 0); return "flying"; }
  if (sim.warp.state !== "idle") { autopilot.phase = "warp"; autopilot.task = `warp · ${node.name}`; apHold(); return "flying"; }

  if (apUnstick()) return "flying";

  if (dist > far && warp !== "never") {
    const ex = beltExit(sim.ship.pos, BELT_CLEAR);
    if (!ex || ex.need <= 0) resetProgress(dist);
    if (ex && ex.need > 0) {
      autopilot.phase = "clear";
      autopilot.task = `clear the rocks · ${Math.round(ex.need / 100)} km ${ex.sign > 0 ? "up" : "down"}`;
      autopilot.why = "climbing out of the belt before plotting";
      apSteer(ship.pos.x, ship.pos.y + ex.sign * 2e5, ship.pos.z, 0.85, { jumpAhead: true });
      if (apProgress(ex.need, 0)) beginUnstick("rock on the way up");
      return "flying";
    }
    const blk = warpBlock(node.id);
    if (/WELL/.test(blk)) {
      autopilot.phase = "climb";
      autopilot.task = `climb · ${sim.dominant?.name ?? "well"}`;
      const dom = sim.dominant;
      if (dom) bodyPosition(dom.id, sim.time, _w); else { _w.x = 0; _w.y = 0; _w.z = 0; }
      const dx = ship.pos.x - _w.x, dy = ship.pos.y - _w.y, dz = ship.pos.z - _w.z;
      const d = Math.hypot(dx, dy, dz) || 1;
      const rx = dx / d, ry = dy / d, rz = dz / d;
      const dest = warpDestination(node);
      let lx = dest.x - ship.pos.x, ly = dest.y - ship.pos.y, lz = dest.z - ship.pos.z;
      const ll = Math.hypot(lx, ly, lz) || 1; lx /= ll; ly /= ll; lz /= ll;
      const lr = lx * rx + ly * ry + lz * rz;
      let px = lx - lr * rx, py = ly - lr * ry, pz = lz - lr * rz;
      const pl = Math.hypot(px, py, pz);
      if (pl > 0.05) { px /= pl; py /= pl; pz /= pl; } else { px = py = pz = 0; }
      const tilt = lr > 0 ? 1.6 : 1.0;
      const cx = rx + px * tilt, cy = ry + py * tilt, cz = rz + pz * tilt;
      const cl = Math.hypot(cx, cy, cz) || 1;
      apSteer(ship.pos.x + (cx / cl) * 1e6, ship.pos.y + (cy / cl) * 1e6, ship.pos.z + (cz / cl) * 1e6, 0.8, { jumpAhead: true, avoid: "soft" });
      return "flying";
    }
    if (/CHARGE/.test(blk) || ship.charge < warpReserve()) {
      autopilot.phase = "charge";
      autopilot.task = `charge · ${Math.round(ship.charge)}/${Math.round(warpReserve())}`;
      apHold();
      if (autopilot.chargeSince == null) { autopilot.chargeSince = sim.time; autopilot.chargeWas = ship.charge; }
      else if (sim.time - autopilot.chargeSince > 60 && ship.charge <= autopilot.chargeWas + 1) {
        return "blocked:the battery is not recovering (shed a system or cut the cutter)";
      }
      return "flying";
    }
    autopilot.chargeSince = null;
    if (blk && !/COOLING/.test(blk)) { apHold(); return `blocked:${blk.toLowerCase()}`; }
    autopilot.phase = "align";
    autopilot.task = `align · ${node.name}`;
    const dest = warpDestination(node);
    const sp = Math.hypot(ship.vel.x, ship.vel.y, ship.vel.z);
    const fast = sp > ALIGN_CEILING;
    const drift = flyTheLane(node, fast ? 0 : 0.3);
    if (fast && sp > DEAD_SLOW * 3) { setThrottle(0); touch.brake = true; }
    const route = plotRoute(node.id);
    if (drift > LANE_DRIFT * 2) { autopilot.task = `align · ${node.name} · trimming ${Math.round(drift)} u/s of drift`; return "flying"; }
    if (route?.aligned && !route.impact && sim.warp.cool <= 0) {
      const risky = graze === "hold" && route.hazards.some((h) => h.kind === "graze");
      if (risky) { autopilot.why = "well graze in the lane — holding for a cleaner plot"; return "flying"; }
      if (warp === "ask" && autopilot.warpAllowed !== node.id) { autopilot.phase = "ask"; autopilot.task = `jump? · ${node.name}`; apHold(); return "asking"; }
      autopilot.phase = "warp";
      if (sim.selected !== node.id) setNavTarget(node.id);
      if (!sim.wantJump) requestJump();
    }
    return "flying";
  }

  node.vel(_v);
  const rel = relSpeedTo(_v);
  if (dist > park * 1.6) {
    const wasBraking = autopilot.phase === "brake";
    autopilot.phase = "cruise";
    autopilot.task = `cruise · ${node.name} · ${Math.round(dist / 100)} km`;
    const allowed = Math.max(DEAD_SLOW, (dist - park) * 0.045);
    apSteer(_p.x, _p.y, _p.z, 1.0);
    if (rel > allowed * (wasBraking ? 0.9 : 1.05) || drifting(_p, _v, allowed, wasBraking)) { setThrottle(0); touch.brake = true; autopilot.phase = "brake"; }
    if (apProgress(dist, Math.max(park * 4, 2000))) beginUnstick(autopilot.avoiding ? `${autopilot.avoiding.name} in the way` : "no way through");
    return "flying";
  }
  return "near";
}

export function apPark(node) {
  const ship = sim.ship;
  node.pos(_p);
  node.vel(_v);
  const dist = dist3(_p, ship.pos);
  const rel = relSpeedTo(_v);
  const park = parkDistance(node);
  autopilot.phase = "park";
  autopilot.task = `park · ${node.name}`;
  apSteer(_p.x, _p.y, _p.z, dist > park ? (node.kind === "point" ? 0.25 : 0.2) : 0);
  if (rel > DEAD_SLOW) { setThrottle(0); touch.brake = true; }
  const near = node.kind === "point" ? dist <= park * 1.2 : dist <= park * 1.05;
  if (near && rel <= DEAD_SLOW * 1.4) {
    if (node.body) node.vel(ship.vel);
    apHold();
    return "parked";
  }
  return "flying";
}

export function apDock(st) {
  const ship = sim.ship;
  if (!st) return "lost";
  const s = stationStatus();
  const mine = s && s.station.id === st.id ? s : null;
  if (mine?.docked || ship.dockedAt === st.id) return "docked";
  if (mine?.tractor) { autopilot.phase = "dock"; autopilot.task = `tractor · ${st.name}`; apHold(); resetProgress(); return "flying"; }
  if (apUnstick()) return "flying";
  const dist = dist3(ship.pos, st);
  _v.x = st.vx ?? 0; _v.y = st.vy ?? 0; _v.z = st.vz ?? 0;
  const rel = relSpeedTo(_v);
  if (st.hangars?.length) {
    if (!sim.dockRequestFor || sim.dockRequestFor !== st.id) {
      requestDock(st, sim.time);
      sim.dockRequestFor = st.id;
    }
    autopilot.phase = "lane";
    const gate = lanePoint(st, "entry", 1, _w);
    const dGate = dist3(ship.pos, gate);
    if (!autopilot.onLane && dGate > 400) {
      autopilot.task = `entry gate · ${st.name} · ${Math.round(dGate / 100)} km`;
      const allowed = Math.max(TRACTOR_V * 0.8, (dGate - 300) * 0.05);
      apSteer(gate.x, gate.y, gate.z, 0.6);
      if (rel > allowed || drifting(gate, _v, allowed, touch.brake)) { setThrottle(0); touch.brake = true; }
      return "flying";
    }
    autopilot.onLane = true;
    if (apProgress(dist, 900)) { beginUnstick(`cannot reach ${st.name}`); autopilot.onLane = false; }
    const mouth = lanePoint(st, "entry", 0, _w);
    autopilot.task = `entry lane · ${st.name}`;
    apSteer(mouth.x, mouth.y, mouth.z, 0.3);
    if (rel > TRACTOR_V * 0.7 || drifting(mouth, _v, TRACTOR_V * 0.7, touch.brake)) { setThrottle(0); touch.brake = true; }
    return "flying";
  }
  if (mine && mine.ok) { touch.brake = false; toggleDock(); return ship.dockedAt === st.id ? "docked" : "flying"; }
  autopilot.phase = "dock";
  const ring = mine?.range ?? 900;
  const closing = mine?.dist ?? dist;
  const allowed = closing > ring ? Math.max(14, (closing - ring * 0.6) * 0.03) : DEAD_SLOW;
  autopilot.task = `pad · ${st.name}`;
  apSteer(st.x, st.y, st.z, closing > ring ? 0.35 : 0.08);
  if ((mine?.rel ?? rel) > allowed) { setThrottle(0); touch.brake = true; }
  return "flying";
}

const MINE_STANDOFF = () => (sim.ship.tune?.minerRange ?? MINE_RANGE) * ROCK_STANDOFF;
const _rock = { x: 0, y: 0, z: 0 };

export function atSeam(seam) {
  return inBelt(sim.ship.pos) && dist3(sim.ship.pos, seam) <= SEAM_REACH;
}

export function apMine(seam) {
  const ship = sim.ship;
  if (apUnstick()) return "cutting";
  if (!seam || !atSeam(seam)) { if (ship.miningMode !== "off") setMiningMode("off"); return "offSeam"; }
  const full = holdRoom(ship) < 1;
  const wantCutter = !full;
  if (wantCutter && ship.miningMode === "off") setMiningMode("closest");
  if (!wantCutter && ship.miningMode !== "off") setMiningMode("off");

  const all = nearbyRocks(ship.pos, sim.time, 1);
  const want = sim.autoPlan.seamOre;
  const onOre = want ? all.filter((r) => r.ore === want && (r.worn ?? 0) < 0.97) : null;
  const rocks = onOre?.length ? onOre : all;
  const marked = seam.site ? siteMarkRock(seam.site, sim.time, autopilot.siteRock)?.key ?? null : null;
  autopilot.siteRock = marked;
  let best = null, bestScore = -Infinity;
  for (const r of rocks) {
    if ((r.worn ?? 0) >= 0.97) continue;
    if ((autopilot.skip.get(r.key) ?? 0) > sim.time) continue;
    const d = dist3(ship.pos, r) - r.r;
    const wanted = sim.autoPlan.seamOre && r.ore === sim.autoPlan.seamOre ? 6 : 0;
    const score = (wanted + (r.rich ? 3 : 0) + Math.min(2, r.r / 200) - d / 3000 + (r.key === autopilot.rockKey ? 1.5 : 0) + (r.key === marked ? 8 : 0)) * preferenceFor("ore", r.ore);
    if (score > bestScore) { bestScore = score; best = r; }
  }
  if (!best) {
    autopilot.phase = "seek";
    autopilot.task = want && onOre?.length === 0 ? `seek · ${want.replace(/_/g, " ")}` : "seek · next cell";
    const ang = Math.atan2(ship.pos.z, ship.pos.x) + 0.02;
    const rad = Math.hypot(ship.pos.x, ship.pos.z);
    apSteer(Math.cos(ang) * rad, 0, Math.sin(ang) * rad, 0.35);
    resetProgress();
    return all.length ? "seeking" : "noRock";
  }
  if (best.key !== autopilot.rockKey) { autopilot.rockKey = best.key; autopilot.rockSince = sim.time; resetProgress(); }
  autopilot.ignore.set(best.key, sim.time + 3);
  autopilot.phase = "mine";
  autopilot.task = `cut · ${best.oreName}${best.rich ? " VEIN" : ""} · ${Math.round(holdRoom(ship))} room`;
  _rock.x = best.x; _rock.y = best.y; _rock.z = best.z;
  const surface = dist3(ship.pos, best) - best.r;
  const standoff = MINE_STANDOFF();
  const rel = Math.hypot(ship.vel.x, ship.vel.y, ship.vel.z);
  if (surface > standoff) {
    const allowed = Math.max(6, (surface - standoff) * 0.06);
    apSteer(_rock.x, _rock.y, _rock.z, 0.35);
    if (rel > allowed) { setThrottle(0); touch.brake = true; }
    if (apProgress(surface, standoff * 1.5)) beginUnstick(`cannot close on the ${best.oreName}`);
  } else {
    apSteer(_rock.x, _rock.y, _rock.z, 0);
    if (rel > 4) touch.brake = true;
  }
  if (sim.time - autopilot.rockSince > 240 && !mining.active) {
    autopilot.skip.set(autopilot.rockKey, sim.time + 900);
    if (autopilot.rockKey === marked) {
      skipMarkRock(marked, sim.time + 900);
      const next = siteMarkRock(seam.site, sim.time);
      if (next && next.key !== marked) logEvent(`Could not close on the marked ${best.oreName} — mark moved to the next rock of ${seam.name ?? "the seam"}`, "nav");
      autopilot.siteRock = next?.key ?? null;
    }
    autopilot.rockKey = null; autopilot.rockSince = sim.time;
  }
  return "cutting";
}

export function jumpEndedShort(node, dist) {
  const drop = sim.warp.dropped;
  if (!drop || sim.time - drop.at >= 30) return null;
  return dist > Math.max(node.arriveR * 3, 60000) ? drop : null;
}

export function wireAutopilot() {
  if (typeof document === "undefined") return;
  const btn = document.getElementById("aux-auto");
  const st = document.getElementById("aux-auto-st");
  if (btn) btn.addEventListener("click", () => toggleAutopilot());
  if (btn && st) {
    setInterval(() => {
      if (sim.phase !== "play") return;
      st.textContent = mission.active ? missionStatusLine() : sim.selected ? "READY" : "NO TGT";
      btn.classList.toggle("on", autopilot.on);
    }, 500);
  }
  if (globalThis.window?.__lg) window.__lg.autopilot = { autopilot, engageAutopilot, engageAutoWarp, engageMiningLoop, disengageAutopilot, tickAutopilot, powerThrottle, sustainableThrottle, warpReserve, cycleAutoPlan, bestPortFor, mission, startMission, stopMission, answerAsk };
}
