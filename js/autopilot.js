/* LIVING GALAXY — the autopilot: flight primitives under a mission script.
 *
 * ## What it is
 *
 * Only the player has an autopilot, and it takes orders the way a drone does:
 * a mission (js/mission/script.js) is a list of steps — go somewhere, dock,
 * mine until the hold is full, sell, charge, wait — with a thrust cap and a
 * warp policy on each. run.js walks the steps; this file is the flying:
 * `apLeg` (a leg, warp-capable), `apPark`, `apDock`, `apMine`, `apHold`,
 * `apSteer`. The HUD buttons and the chart still build one-step missions
 * through `engageAutopilot` / `engageAutoWarp` / `engageMiningLoop`.
 *
 * ## The power rule
 *
 * Rated thrust alone draws more than the reactor makes, so the throttle is a
 * function of the charge: above ~60% the mains may dip into the battery for
 * momentum, in the band between they hold the *sustainable* setting (what the
 * reactor can carry after everything else on the bus), and at the 20% floor
 * the mains go cold and the hull coasts until the reactor catches up. A
 * pending jump adds a reserve: minimum charge plus the spool's own draw, or it
 * waits. A step's thrust cap is a ceiling under that rule, never a floor.
 *
 * ## Warp policy
 *
 *   auto  — climb out of the well, charge, align, jump
 *   ask   — the same, but park aligned and ask (chat links / console banner)
 *   never — sublight only; long legs are long, go talk to the crew
 *
 * It flies through the same injected inputs the conn NPC uses and lets go the
 * moment the pilot touches the stick. It never flies while an NPC holds the conn.
 */

import {
  plotRoute, requestJump, selectBody, setNoticeAbout, sim, stationStatus, toggleDock,
  warpDestination, warpNodeById, logEvent, setThrottle, WARP, spoolTime, setMiningMode, canSmeltAt,
  sellPriceAt, warpBlock, toggleWarp,
} from "./sim.js";
import { threatTo, avoidAim, avoidLevel, deliberate, surfaceOnly, clearAvoidCommit, avoidCommit, blind, AVOID } from "./avoid.js";
import { setInjectedPan, touch } from "./input.js";
import * as shipMod from "./ship.js";
import { BATTERY, DRAW, buildDemand, forwardOf, holdRoom, lifeDraw } from "./ship.js";
import { captain, ariaHooks } from "./npc/captain.js";
import { bodyPosition, currentSystem, dist3 } from "./bodies.js";
import { stations, TRACTOR_V } from "./stations.js";
import { lanePoint } from "./npc/lanes.js";
import { requestDock } from "./stationworks.js";
import { inBelt, nearbyRocks, beltExit } from "./field.js";
import { mining, MINE_RANGE } from "./turrets.js";
import { preferenceFor } from "./aria.js";
import { oneStep, makeMission, makeStep } from "./mission/script.js";
import { mission, startMission, stopMission, resumeMission, tickMission, missionStatusLine, restoreRun, answerAsk } from "./mission/run.js";

/** package D's batteryCap(ship) once it lands; the rated battery until then */
const batteryCap = (ship) => shipMod.batteryCap?.(ship) ?? BATTERY;

export const autopilot = {
  on: false,
  avoiding: null,       // what we are dodging, for the HUD
  mode: "approach",     // warp | approach | mine — mirrored from the mission for the HUD and port control
  targetId: null,       // the node this leg is about
  phase: "idle",        // idle | climb | charge | align | ask | warp | cruise | brake | park | lane | mine | seek | dock | trade | undock | hold
  task: "",             // for the HUD: what the current step is doing
  why: "",
  jumped: false,
  engagedAt: 0,
  chargeSince: null,
  chargeWas: 0,
  seam: null,           // { x, y, z } the mining loop returns to
  rockKey: null,
  rockSince: 0,
  skip: new Map(),      // rock key → sim time until which the loop leaves it alone
  loops: 0,
  earned: 0,
  dockedAt: 0,
  capNow: 1,            // the step's thrust cap, applied under the power rule
  warpAllowed: null,    // node id the pilot answered JUMP for (warp policy "ask")
  power: { throttle: 0, sustainable: 0, frac: 1, reserve: 0 },
  /* the watchdog: an autopilot that cannot tell "being careful" from "boxed
   * in" will sit in a belt braking at gravel until the player takes the stick
   * back. These three measure progress and buy a way out of it. */
  watch: { best: Infinity, since: 0 },
  ignore: blind,        // hazard id → sim time until which the solver may not look at it (shared with the assist)
  unstick: null,        // { until, x, y, z, why } — a committed break-out burn
  unstuckCount: 0,      // for the HUD and the tests: how often it had to
};

/* How long the leg may make no progress before it is declared boxed in, and
 * how long the break-out burn runs. Measured rather than guessed: a cruise leg
 * closes on its target every second, and a mining drift between cells takes
 * about eight, so fourteen seconds of no closure is not caution. */
export const AP_STUCK = { idleS: 14, burnS: 7, blindS: 11 };

/* ---- the power rule ------------------------------------------------------- */

export const AP_POWER = {
  floor: 0.2,       // below this charge the mains go cold and the hull coasts
  band: 0.6,        // above this the mains may dip into the battery
  dipThrottle: 1.0, // …to at most rated thrust
  eco: 0.35,        // the least a leg is worth flying at (below it, coast)
  warpMargin: 120,  // charge on top of the spool's own draw before a jump is asked for
};

/** Throttle the reactor can carry indefinitely with everything else on the bus. */
export function sustainableThrottle(ship) {
  const spare = (ship.reactor ?? 130) - busIdle(ship).load;
  return Math.max(0, Math.min(1, Math.sqrt(Math.max(0, spare) / DRAW.thrustCurve)));
}

/* the consumers a pilot can switch off, as the switchboard labels them */
const BUS_SWITCH = [
  ["shields", "SHLD"], ["cutter", "MINER"], ["turrets", "TURR"], ["gravity", "GRAV"], ["ops", "FLOOD/SENTRY/SALVG"], ["bench", "ICE WORKS"],
];

/**
 * The bus at zero throttle as the pilot has it SWITCHED — not as a brownout
 * happens to have shed it this frame. Reading ship.powered here was how a
 * latched brownout made a bus that cannot carry itself look sustainable.
 */
export function busIdle(ship) {
  const d = buildDemand(ship, 0, false, 0);
  const on = {
    shields: ship.shields ? d.shields : 0,
    cutter: d.cutter,
    bench: d.bench,
    turrets: ship.turretsArmed && ship.turretMode !== "off" ? d.turrets : 0,
    gravity: ship.localGravity ? DRAW.gravity : 0,
    ops: d.ops,
  };
  let load = d.base + DRAW.enginesIdle * (ship.engines ? 1 : 0) + lifeDraw(ship, true);
  for (const k in on) load += on[k];
  return { load, on };
}

/**
 * Can the autopilot fly at all? Evaluated fresh every time it is asked —
 * 0.3 kept this as a flag that only powerThrottle refreshed, and powerThrottle
 * never ran again once the autopilot had stood down, so after the pilot shed
 * shields and the cutter every re-engage stood down on the stale verdict.
 * Over = the battery is at the floor AND the switched-on bus at idle leaves
 * the core (almost) nothing to refill it with.
 */
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

/** What a jump needs in the battery before the core is asked to spool. */
export function warpReserve() {
  return WARP.minCharge + WARP.draw * spoolTime() + AP_POWER.warpMargin;
}

/**
 * The throttle this leg may fly at right now. `want` is what the leg would
 * like (0..1); `jumpAhead` keeps a spool's reserve untouched.
 */
export function powerThrottle(ship, want, jumpAhead = false) {
  const frac = ship.charge / batteryCap(ship);
  const sus = sustainableThrottle(ship);
  let cap;
  if (frac <= AP_POWER.floor) cap = 0;
  else if (frac < AP_POWER.band) cap = sus * ((frac - AP_POWER.floor) / (AP_POWER.band - AP_POWER.floor)) + sus * 0.35;
  else cap = Math.max(sus, AP_POWER.dipThrottle * Math.min(1, (frac - AP_POWER.band) / 0.25 + 0.6));
  if (jumpAhead && ship.charge < warpReserve() * 1.15) cap = Math.min(cap, sus * 0.8);
  /* a bus with no spare still has to get somewhere: above the floor the leg
   * may fly at eco on the battery; at the floor it coasts, and if the reactor
   * cannot even carry the idle bus the pilot has to shed something */
  if (frac > AP_POWER.floor) cap = Math.max(cap, AP_POWER.eco);
  const bus = busOverload(ship);
  autopilot.overload = bus.over;
  const wasCoasting = autopilot.coasting;
  autopilot.coasting = frac <= AP_POWER.floor;
  /* say so: a ship sitting still under a live autopilot with no word why reads as broken */
  if (autopilot.on && autopilot.coasting && !wasCoasting && !bus.over) {
    const refill = Math.max(0, AP_POWER.floor * batteryCap(ship) - ship.charge) / Math.max(1, bus.spare);
    sim.notice = `Autopilot coasting — battery under ${Math.round(AP_POWER.floor * 100)}%, mains cold until it refills (~${Math.ceil(refill)} s at +${Math.round(bus.spare)} kW).`;
  }
  let t = Math.min(want, cap);
  if (t > 0 && t < AP_POWER.eco * 0.5) t = 0; // not worth the draw: coast
  autopilot.power = { throttle: t, sustainable: sus, frac, reserve: warpReserve() };
  return t;
}

/**
 * Sliding past the target instead of closing on it.
 *
 * The cruise and lane rules only ever capped TOTAL relative speed, and thrust
 * only ever pointed at the target — so a hull carrying sideways speed settled
 * into an orbit: brake one frame, thrust inward the next, speed pinned at the
 * cap and the thrust exactly the centripetal pull. From the cockpit that is the
 * approach circling a port at 4–5 km forever. A lateral component bigger than a
 * third of the allowed speed (or any real opening speed) is killed first.
 */
export function drifting(target, frameVel, allowed, wasBraking = false) {
  const ship = sim.ship;
  const dx = target.x - ship.pos.x, dy = target.y - ship.pos.y, dz = target.z - ship.pos.z;
  const d = Math.hypot(dx, dy, dz) || 1;
  const vx = ship.vel.x - frameVel.x, vy = ship.vel.y - frameVel.y, vz = ship.vel.z - frameVel.z;
  const closing = (vx * dx + vy * dy + vz * dz) / d;
  const lateral = Math.sqrt(Math.max(0, vx * vx + vy * vy + vz * vz - closing * closing));
  const k = wasBraking ? 0.6 : 1;   // hysteresis: once braking for drift, brake it well down
  if (lateral > Math.max(DEAD_SLOW * 1.5, allowed * 0.35) * k) return true;
  return closing < -Math.max(DEAD_SLOW, allowed * 0.15) * k;
}

/* ---- engage / release (the HUD and chart buttons build one-step missions) ---- */

const PARK_RADII = 2.5;      // perch over a world, in radii
const PORT_PARK = 1400;      // hold distance off a port, u
const POINT_PARK = 500;      // hold distance off a saved location, u
const DEAD_SLOW = 10;        // u/s on the doorstep
const ROCK_STANDOFF = 0.75;  // cut from this fraction of cutter range
const SEAM_REACH = 25000;    // inside this of the seam the cutter goes to work
const ALIGN_CEILING = 600;   // u/s above which coming about stops adding throttle
/* How far above the rock layer to climb before plotting.
 *
 * Climbing does NOT remove the belt crossing from the plot — the crossing is
 * an annulus test on radius, and you are standing in the annulus; the lane
 * still reads "BELT 0–3%" and the core still rolls its 35%. What it changes is
 * where a dropout PUTS you. Dropping out at 3% of the lane from 0 u altitude
 * lands the hull inside the rock layer at 140 u/s with the toast that says so;
 * dropping out from 7 km up lands it in clean space above the layer, where it
 * can turn round and go again. Same odds, survivable outcome. */
const BELT_CLEAR = 3800;
const _p = { x: 0, y: 0, z: 0 };
const _v = { x: 0, y: 0, z: 0 };
const _w = { x: 0, y: 0, z: 0 };

/** The HUD's default plan for one-step missions (NAV › AUTOPILOT edits it). */
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

/** Chart shortcut: align and jump, then hand the stick back. */
export function engageAutoWarp(targetId = sim.selected) {
  return engageAutopilot(targetId, "warp");
}

/**
 * The mining loop as a mission. `seam` is where the cutter goes to work — a
 * belt point off the chart, a probe drop, or (default) the nearest belt.
 * `sim.autoPlan.onDock` picks the desk step, `sim.autoPlan.loop` the repeat.
 */
export function engageMiningLoop(seam = null) {
  if (captain.holder !== "player") { sim.notice = "The conn has the ship — the autopilot stands down."; return false; }
  const s = seam ?? sim.autoPlan.seam ?? nearestSeam();
  if (!s) { sim.notice = "No belt in this sky to work."; return false; }
  if (!inBelt(s)) { sim.notice = `${s.name ?? "That point"} is not in a belt — nothing to cut there.`; return false; }
  sim.autoPlan.seam = { x: s.x, y: s.y, z: s.z, name: s.name ?? "the seam" };
  ariaHooks.onPlayerJob?.("mine", 3);
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

/** Stops whatever mission is flying (or is parked paused) and hands the stick back. */
export function disengageAutopilot(why = "disengaged") {
  if (!autopilot.on && !mission.active) return;
  stopMission(why);
}

/** Drop the controls at zero: the stick comes back the way a spring throttle should. */
export function releaseControls() {
  /* a jump the autopilot spooled is the autopilot's: stopping it must not
   * leave the core counting down to a jump nobody is flying any more */
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

/** Cycle what the loop does with a full hold. */
export function cycleAutoPlan() {
  const order = ["sell", "stash", "smelt"];
  const i = order.indexOf(sim.autoPlan.onDock);
  sim.autoPlan.onDock = order[(i + 1) % order.length];
  return sim.autoPlan.onDock;
}

/* ---- helpers ------------------------------------------------------------- */

export function nearestSeam() {
  const ship = sim.ship;
  const belts = [];
  /* sample each annulus at the ship's own bearing: the closest stretch of belt */
  for (const [b, name] of [[currentSystem.belt, "the belt"], [currentSystem.outerBelt, "the outer belt"]]) {
    if (!b) continue;
    const ang = Math.atan2(ship.pos.z, ship.pos.x);
    const r = (b.inner + b.outer) / 2;
    belts.push({ x: Math.cos(ang) * r, y: 0, z: Math.sin(ang) * r, name });
  }
  belts.sort((a, b) => dist3(ship.pos, a) - dist3(ship.pos, b));
  return belts[0] ?? null;
}

/** Steer at a point; `want` is the leg's ideal throttle, shaped by the cap and the power rule. */
/* The solver is not cheap enough to run per frame and does not need to be:
 * at five hertz a hazard twenty seconds out is still seen a hundred times
 * before it matters. */
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

/* ---- the watchdog ---------------------------------------------------------
 *
 * Avoidance is a negotiation with the world and it can lose. Inside a belt the
 * old solver would brake at a pebble, lose steerage, find the pebble again and
 * brake harder — and the only thing that ever broke the cycle was the player
 * taking the stick. So the autopilot now measures whether it is actually
 * getting anywhere, and when it is not, it stops being polite.
 *
 * Two escapes, in order of how much they give up:
 *   1. a committed break-out burn along the cheapest way out — straight up or
 *      down out of the belt disc if we are in one, otherwise along whichever
 *      way round the dodge was already committed to, and
 *   2. a blind window on the hazard that boxed us in, so the solver stops
 *      re-raising the same alarm the moment we start moving again.
 */
export function apProgress(dist, floor = 0) {
  const w = autopilot.watch;
  if (!Number.isFinite(dist)) return false;
  if (!w.since) { w.best = dist; w.since = sim.time; return false; }
  /* "closer" has to mean meaningfully closer, or jitter on a 300 km leg reads
   * as progress forever */
  if (dist < w.best - Math.max(40, w.best * 0.0015)) { w.best = dist; w.since = sim.time; return false; }
  /* The last few hundred metres are SUPPOSED to crawl — that is the braking
   * curve, not an obstruction — so the watchdog stands down on the doorstep
   * and leaves the terminal approach to apPark, which converges on its own. */
  if (dist <= floor) { w.best = Math.min(w.best, dist); w.since = sim.time; return false; }
  if (sim.time - w.since <= AP_STUCK.idleS) return false;
  /* Being slow is not being stuck. Fire only when something is in the way, or
   * when the hull has effectively stopped and is not getting going again. */
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
    /* A belt is six kilometres thick and three hundred thousand wide. Up is
     * always the short way out, and above the layer there is nothing to dodge. */
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

/** True while a break-out burn owns the ship; it flies it as a side effect. */
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

/**
 * Steer at a point — going around anything in the way.
 *
 * Every autopilot mode flies through here, which is why the avoidance lives
 * in this one function rather than in each of them: the hull used to drive
 * into rocks and station hulls at whatever throttle the leg had asked for,
 * because nothing between the plan and the thrusters ever looked ahead.
 */
export function apSteer(tx, ty, tz, want, opts = false) {
  const o = opts && typeof opts === "object" ? opts : { jumpAhead: Boolean(opts) };
  const jumpAhead = Boolean(o.jumpAhead);
  /* "full" dodges anything the solver raises; "soft" only reacts once the
   * thing is genuinely close, which is what an alignment or a break-out burn
   * needs — a leg that re-aims five times a second never finishes anything;
   * "off" is for steps that are flying at a hazard on purpose. */
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
    /* Steering alone only works while there is time to turn. Inside that,
     * shed speed as well; inside *that*, brake — but do NOT stop steering.
     * Zeroing the stick here was the deadlock: a hull that brakes without
     * turning stops in front of the same hazard and brakes at it again. */
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
  /* stick-right REDUCES yaw in the flight model — the error goes in negated */
  setInjectedPan({ x: Math.max(-1, Math.min(1, -ey * 1.7)), y: Math.max(-1, Math.min(1, ep * 1.7)) });

  if (hardBrake) {
    setThrottle(0);
    touch.brake = true;
    autopilot.phase = "avoid";
    autopilot.task = `avoid · ${hz.name}`;
    return { d, facing, avoiding: true };
  }

  /* A hull that is dodging is trying to get PAST something, so the usual
   * "barely move until you are pointed at it" shaping is wrong here: the aim
   * point is 90° off by construction, and 5% throttle beside a moon is how a
   * leg spends four minutes going nowhere. */
  const idle = level > 0 ? Math.min(want, 0.22) : 0.05;
  const shaped = facing > 0.85 ? want : facing > 0.3 ? Math.max(want * 0.35, idle) : idle;
  setThrottle(powerThrottle(ship, Math.min(shaped, autopilot.capNow), jumpAhead));
  return { d, facing, avoiding: level > 0 };
}

const _avoid = { x: 0, y: 0, z: 0 };

export function apHold() {
  setInjectedPan({ x: 0, y: 0 });
  setThrottle(0);
}

/** Player touched anything that flies the ship. */
export function pilotInput() {
  return Math.abs(touch.panX) > 0.06 || Math.abs(touch.panY) > 0.06 || Math.abs(touch.rcsX) > 0.06 || Math.abs(touch.rcsY) > 0.06;
}

export function relSpeedTo(vel) {
  const s = sim.ship;
  return Math.hypot(s.vel.x - vel.x, s.vel.y - vel.y, s.vel.z - vel.z);
}

/** The port worth the trip for this hold: nearest that pays, or can smelt, or any port. */
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
    /* a thumb on the scale for the port you actually use. It is a lean, not a
     * rule — the autopilot still finds you the better price, it just stops
     * driving past the desk you always sell at to do it. */
    /* (a lean on a negative score has to divide, or it pushes the favourite AWAY — 0.3.19) */
    const pref = preferenceFor("port", st.id);
    score = score >= 0 ? score * pref : score / pref;
    if (score > bestScore) { bestScore = score; best = st; }
  }
  return best;
}

export function parkDistance(node) {
  return node.body ? node.radius * PARK_RADII : node.kind === "point" ? POINT_PARK : PORT_PARK;
}

/* ---- the tick --------------------------------------------------------------- */

export function tickAutopilot(dt) {
  restoreRun();
  /* who is flying, for anything that wants to know whether a choice was YOURS
   * — js/aria.js only learns from the player's own hands */
  sim.handsOff = autopilot.on || captain.holder !== "player";
  if (!autopilot.on) return;
  if (sim.phase !== "play") return;
  if (captain.holder !== "player" && captain.holder !== "aria") { stopMission("stood down — the conn has the ship"); return; }
  if (pilotInput()) {
    /* the stick is the pilot's: touching it takes the ship back from ARIA too */
    if (captain.holder === "aria") { ariaHooks.onStick?.(); return; }
    stopMission("released — you have the stick"); return;
  }
  const ship = sim.ship;
  touch.brake = false;
  const bus = ship.dockedAt ? null : busOverload(ship);
  autopilot.overload = Boolean(bus?.over);
  if (bus?.over) {
    apHold();
    /* the pilot is about to shed load: do not switch the cutter back on under them */
    autopilot.cutterWas = null;
    stopMission(`stood down — ${bus.why}`);
    return;
  }
  /* the cutter is the biggest optional draw on the bus: it only runs while a MINE step is cutting.
   * cutterWas is the PILOT's setting, taken once at engage (mission/run.js startMission) — 0.3
   * re-took it every tick, so a cutter apMine had switched on came back on at stand-down */
  const op = mission.active?.steps[mission.stepIx]?.op;
  if (op !== "MINE" && ship.miningMode !== "off") setMiningMode("off", { quiet: true });
  if (sim.warp.state === "run") autopilot.jumped = true;
  if (autopilot.ignore.size > 48) {
    for (const [k, until] of autopilot.ignore) if (until <= sim.time) autopilot.ignore.delete(k);
  }
  tickMission(dt);
}

/**
 * A leg: climb out of a well, wait for charge, align and jump (per the warp
 * policy), then the sublight fall with braking room priced in. Returns
 * "flying" while it has the ship, "near" once the target is inside its park
 * distance, "asking" when policy "ask" wants an answer, "blocked:<why>" when
 * the core cannot be used and the leg cannot go on.
 */
export function apLeg(node, { cap = 1, warp = "auto", farLeg = null, graze = "hold" } = {}) {
  const ship = sim.ship;
  autopilot.capNow = cap;
  const park = parkDistance(node);
  node.pos(_p);
  const dist = dist3(_p, ship.pos);
  const far = farLeg ?? Math.max(90000, node.arriveR * 2);
  if (sim.warp.state !== "idle") { autopilot.phase = "warp"; autopilot.task = `warp · ${node.name}`; apHold(); return "flying"; }

  /* A break-out burn owns the ship until it is done. */
  if (apUnstick()) return "flying";

  if (dist > far && warp !== "never") {
    /* Rocks before wells.
     *
     * Aligning for a jump inside a belt cannot work: the avoidance rewrites
     * the aim five times a second to miss gravel, the 10° alignment gate never
     * closes, and the leg loops forever trying to warp — which is exactly what
     * it looked like from the cockpit. A belt is a thin disc, so the answer is
     * not to fight through it but to climb out of it; above the layer there is
     * no gravel to dodge and the plot is clean. It costs a few seconds. */
    /* Climbing, charging, aligning and clearing the rocks all stand still with
     * respect to the target on purpose, so the progress watchdog has nothing to
     * measure and must not arm — otherwise a perfectly healthy spool reads as
     * being boxed in and the leg breaks out of its own alignment. */
    const ex = beltExit(sim.ship.pos, BELT_CLEAR);
    if (!ex || ex.need <= 0) resetProgress(dist);
    if (ex && ex.need > 0) {
      autopilot.phase = "clear";
      autopilot.task = `clear the rocks · ${Math.round(ex.need / 100)} km ${ex.sign > 0 ? "up" : "down"}`;
      autopilot.why = "climbing out of the belt before plotting";
      /* full avoidance here, not soft: this is the one leg that is flown
       * THROUGH the rocks on purpose, and there is no alignment gate to
       * protect. The watchdog measures the climb itself — a hull that has
       * stopped gaining altitude has something on the nose. */
      apSteer(ship.pos.x, ship.pos.y + ex.sign * 2e5, ship.pos.z, 0.85, { jumpAhead: true });
      if (apProgress(ex.need, 0)) beginUnstick("rock on the way up");
      return "flying";
    }
    const blk = warpBlock(node.id); // live, not last tick's — the target may have just changed
    if (/WELL/.test(blk)) {
      autopilot.phase = "climb";
      autopilot.task = `climb · ${sim.dominant?.name ?? "well"}`;
      const dom = sim.dominant;
      if (dom) bodyPosition(dom.id, sim.time, _w); else { _w.x = 0; _w.y = 0; _w.z = 0; }
      const dx = ship.pos.x - _w.x, dy = ship.pos.y - _w.y, dz = ship.pos.z - _w.z;
      const d = Math.hypot(dx, dy, dz) || 1;
      apSteer(ship.pos.x + (dx / d) * 1e6, ship.pos.y + (dy / d) * 1e6, ship.pos.z + (dz / d) * 1e6, 0.8, { jumpAhead: true, avoid: "soft" });
      return "flying";
    }
    if (/CHARGE/.test(blk) || ship.charge < warpReserve()) {
      /* the core wants a full battery: mains off, hold attitude, let the reactor catch up */
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
    /* Coming about is not a reason to keep accelerating. A leg that aligns,
     * waits out a cooldown, aligns again — which is what a run of dropouts
     * looks like — used to add 0.3 throttle every pass and end up hundreds of
     * thousands of units off on a vector nobody asked for. Above the align
     * ceiling the mains come off and the brake goes on; the nose still swings. */
    const sp = Math.hypot(ship.vel.x, ship.vel.y, ship.vel.z);
    const fast = sp > ALIGN_CEILING;
    /* soft: hold the lane unless something is genuinely about to be hit. A
     * full dodge here fights the alignment gate and neither ever wins. */
    apSteer(dest.x, dest.y, dest.z, fast ? 0 : 0.3, { jumpAhead: true, avoid: "soft" });
    if (fast && sp > DEAD_SLOW * 3) { setThrottle(0); touch.brake = true; }
    const route = plotRoute(node.id);
    if (route?.aligned && !route.impact && sim.warp.cool <= 0) {
      const risky = graze === "hold" && route.hazards.some((h) => h.kind === "graze");
      if (risky) { autopilot.why = "well graze in the lane — holding for a cleaner plot"; return "flying"; }
      if (warp === "ask" && autopilot.warpAllowed !== node.id) { autopilot.phase = "ask"; autopilot.task = `jump? · ${node.name}`; apHold(); return "asking"; }
      autopilot.phase = "warp";
      if (!sim.wantJump) requestJump();
    }
    return "flying";
  }

  /* the fall down the well */
  node.vel(_v);
  const rel = relSpeedTo(_v);
  if (dist > park * 1.6) {
    const wasBraking = autopilot.phase === "brake";
    autopilot.phase = "cruise";
    autopilot.task = `cruise · ${node.name} · ${Math.round(dist / 100)} km`;
    const allowed = Math.max(DEAD_SLOW, (dist - park) * 0.045);
    apSteer(_p.x, _p.y, _p.z, 1.0);
    /* a deadband, or the HUD flickers cruise/brake every other frame on the
     * approach and the throttle chatters with it. (It never worked: the phase
     * had already been overwritten with "cruise" two lines up.) */
    if (rel > allowed * (wasBraking ? 0.9 : 1.05) || drifting(_p, _v, allowed, wasBraking)) { setThrottle(0); touch.brake = true; autopilot.phase = "brake"; }
    /* this is the only part of a leg that is supposed to close the range, so
     * it is the only part the watchdog judges */
    if (apProgress(dist, Math.max(park * 4, 2000))) beginUnstick(autopilot.avoiding ? `${autopilot.avoiding.name} in the way` : "no way through");
    return "flying";
  }
  return "near";
}

/** The doorstep: kill the drift and sit off the node. Returns "flying" | "parked". */
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

/** A port approach: file the berth, ride the entry lane in, let the tractor take the hull. */
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
    /* the lane: far gate first, then down it to the mouth under the tractor's speed limit */
    /* file the berth directly: toggleDock() would read an approach already flying as a wave-off */
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
    /* inside the funnel under speed, port control's own tractor (autoTractor) takes the hull */
    return "flying";
  }
  /* an old-style pad: close, dead slow, request */
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

/* ---- the cutter ----------------------------------------------------------------- */

const MINE_STANDOFF = () => (sim.ship.tune?.minerRange ?? MINE_RANGE) * ROCK_STANDOFF;
const _rock = { x: 0, y: 0, z: 0 };

/** True when the ship is on the seam: in a belt and within reach of the point. */
export function atSeam(seam) {
  return inBelt(sim.ship.pos) && dist3(sim.ship.pos, seam) <= SEAM_REACH;
}

/**
 * A rock under the cutter. Returns "offSeam" (fly there first), "cutting",
 * "seeking" (thin cell — drifting to the next) or "noRock". The cutter only
 * runs when there is something to cut and room to keep it.
 */
export function apMine(seam) {
  const ship = sim.ship;
  if (apUnstick()) return "cutting";
  if (!seam || !atSeam(seam)) { if (ship.miningMode !== "off") setMiningMode("off"); return "offSeam"; }
  const full = holdRoom(ship) < 1;
  const wantCutter = !full;
  if (wantCutter && ship.miningMode === "off") setMiningMode("closest");
  if (!wantCutter && ship.miningMode !== "off") setMiningMode("off");

  const all = nearbyRocks(ship.pos, sim.time, 1);
  /* 0.3.22: on a job that named an ore, cut THAT ore. The hold is the scarce
   * thing, not the rock — a loop that fills it with whatever was nearest docks
   * with an unfinished order and a hold full of somebody else's cargo. Other
   * rock is still cut when there is none of the wanted ore in reach. */
  const want = sim.autoPlan.seamOre;
  const onOre = want ? all.filter((r) => r.ore === want && (r.worn ?? 0) < 0.97) : null;
  const rocks = onOre?.length ? onOre : all;
  let best = null, bestScore = -Infinity;
  for (const r of rocks) {
    if ((r.worn ?? 0) >= 0.97) continue;
    if ((autopilot.skip.get(r.key) ?? 0) > sim.time) continue;
    const d = dist3(ship.pos, r) - r.r;
    /* same idea at the cutter: you cut the ores you cut */
    /* 0.3.22: a job that named an ore is a job about THAT ore. A belt vein of
     * something else is worth cutting on a free run and worth nothing on a
     * contract — the loop used to wander off onto whatever was richest nearby
     * and dock with a full hold and an unfilled order. */
    const wanted = sim.autoPlan.seamOre && r.ore === sim.autoPlan.seamOre ? 6 : 0;
    const score = (wanted + (r.rich ? 3 : 0) + Math.min(2, r.r / 200) - d / 3000 + (r.key === autopilot.rockKey ? 1.5 : 0)) * preferenceFor("ore", r.ore);
    if (score > bestScore) { bestScore = score; best = r; }
  }
  if (!best) {
    /* thin cell: drift along the belt to the next one */
    autopilot.phase = "seek";
    autopilot.task = want && onOre?.length === 0 ? `seek · ${want.replace(/_/g, " ")}` : "seek · next cell";
    const ang = Math.atan2(ship.pos.z, ship.pos.x) + 0.02;
    const rad = Math.hypot(ship.pos.x, ship.pos.z);
    apSteer(Math.cos(ang) * rad, 0, Math.sin(ang) * rad, 0.35);
    resetProgress();
    return all.length ? "seeking" : "noRock";
  }
  if (best.key !== autopilot.rockKey) { autopilot.rockKey = best.key; autopilot.rockSince = sim.time; resetProgress(); }
  /* The rock we are flying AT is not a hazard. `deliberate()` only exempts it
   * once the cutter has actually latched, which left the approach dodging the
   * very rock it was sent to mine — it would sidle up to within cutter range,
   * flinch, and start again. The blind window closes on its own. */
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
    /* on station: keep the nose on it and kill the drift */
    apSteer(_rock.x, _rock.y, _rock.z, 0);
    if (rel > 4) touch.brake = true;
  }
  /* a rock that the cutter cannot reach for a long while is skipped */
  if (sim.time - autopilot.rockSince > 240 && !mining.active) { autopilot.skip.set(autopilot.rockKey, sim.time + 900); autopilot.rockKey = null; autopilot.rockSince = sim.time; }
  return "cutting";
}

/**
 * Did that jump ARRIVE, or did the core drop us short?
 *
 * A dropout used to be reported to the mission as "jump complete — target on
 * the bow", which handed the stick back wherever the core let go — in a belt,
 * that is the rocks you were trying to leave, 650 km from anywhere, and the
 * only thing to do is press AUTO again and watch it happen again. Returns the
 * dropout worth going again for, or null when the jump really is over.
 */
export function jumpEndedShort(node, dist) {
  const drop = sim.warp.dropped;
  if (!drop || sim.time - drop.at >= 30) return null;
  return dist > Math.max(node.arriveR * 3, 60000) ? drop : null;
}

/** AUX 6 wiring + console access. */
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
