/* LIVING GALAXY — simulation loop.
 *
 * Everything here is first-person and Newtonian: you sit in the seat, the
 * nose follows your eyes, and nothing decelerates you that you did not pay
 * for. Worlds are hundreds of times your length and pull like it.
 */

import { BEACONS, BODIES, applySystem, beaconPosition, bodyById, bodyPosition, bodyVelocity, currentSystem, dist3, hashHue, refreshBody, scanRadius, heatBody, coolBodies, bodyTempK, starBody, surveyIds } from "./bodies.js";
import { generateSystem, rngFromSeed, spawnBodyId } from "./generate.js";
import { consumeLook, justPressed, sampleInput, setInjectedKeys, setInjectedPan, touch } from "./input.js";
import { NAV, SHIP, UI, WARN, setEngineLevel } from "./audio.js";
import { loadSave, skyProgress, useGameStore } from "./store.js";
import {
  batteryCap,
  MINING_MODES,
  SHED_ORDER,
  THROTTLE_MAX,
  THROTTLE_MIN,
  TURRET_MODES,
  defaultTune,
  applyDamage,
  buildDemand,
  closingSpeed,
  absSpeedOf,
  addCargo,
  cargoTotal,
  forwardOf,
  holdRoom,
  takeCargo,
  gravityAt,
  makeShip,
  speedOf,
  stepAttitude,
  stepPower,
  stepTranslation,
} from "./ship.js";
import { record as tapeRecord } from "./recorder.js";
import { wireFab, stepFab, loadFab, resetFab } from "./fabricate.js";
import { remnantRadius, surfaceGravity } from "./scale.js";
import { resetImpacts, startCollision, startStrike, stepImpacts } from "./impacts.js";
import { resetProbes, stepProbes } from "./probes.js";
import { stepDroneOps, loadDroneOps, noteDroneKill } from "./drones/ops.js";
import { populateNpcDrones, stepNpcDrones } from "./drones/npcdrones.js";
import { board, resetBoard } from "./drones/board.js";
import { chat, post, resetChat } from "./chat.js";
import { gnn, gnnPost, resetGnn } from "./gnn.js";
import { benchValue } from "./icework.js";
import { addChunk, bindDebris, burst, chunkMass, chunks, nearDebris, removeChunk, resetDebris, rubbleRing, stepDebris } from "./debris.js";
import { addRogue, adoptImpactors, impactorWire, impactors, resetImpactors, setImpactorAuthority, stepImpactors, threatBoard, emptyThreatBoard } from "./impactors.js";
import { HOLE, adoptHoles, collapseStar, holeRadii, holeWarpBlock, holeWire, holes, nearestHole, resetHoles, spawnTransit, stepHoles } from "./holes.js";
import {
  OUTCOME,
  apparentGlow,
  cataclysmState,
  eventDuration,
  isCataclysmic,
  kelvinHex,
  outcomeOf,
  relaxCraters,
  ringPlan,
  supernovaDuration,
  supernovaState,
} from "./cataclysm.js";
import {
  buildStations,
  describeStation,
  dockCheck,
  nearestStation,
  resetStations,
  stationById,
  stations,
  stepStations,
} from "./stations.js";
import { ORES, baseValue, good, goodName, priceAt, rollOre } from "./materials.js";
import { stepEconomy, stockMult, lotMult, askPrice, econReport, wantsOf } from "./economy.js";
import { bookHandling, clearDockwork, handlingLeft, handlingLine, handlingProgress, stepDockwork } from "./dockwork.js";
import { buildCorps, corpOfStation, corpOfVessel, blameKill, adjustStanding, standingMargin, corps } from "./corps.js";
import { applyRaceToShip, applyRaceTune, loadPilot, pilot, rankStatus, savePilot, serveTime, syncMods, takePayout, title, work } from "./pilot.js";
import { DEFAULT_SHIP_ID, hullTuneFor, issuedShips, shipById } from "./shipdb.js";
import { yardQuote } from "./shipcost.js";
import { hullPoolFor, shieldPoolFor, resistsFor } from "./defence.js";
import { claim as insuranceClaim, insure, playerKey, policies, policyFor, resetInsurance } from "./insurance.js";
import { crew, resetCrew, tickCrew } from "./crew.js";
import { loadRobots, tickRobots } from "./crew/robots.js";
import { fx as upgradeFx, loadUpgrades, upgradeResists, resistKey } from "./upgrades.js";
import { tickPatchDrone, hullMaxOf } from "./repair.js";
import { bookRevenue, loadCompany, tickCompany, treasuryPay } from "./company.js";
import { resetHousehold } from "./family.js";
import { noteKill, noteDestroyed, resetContracts, tickContracts } from "./contracts.js";
import { resetFleet, tickFleet } from "./fleet.js";
import { captain, retakeCommand, tickCaptain } from "./npc/captain.js";
import { crewEffects, updateCrewMods } from "./npc/crewfx.js";
import { eventAt, eventLine, markVesselDown, populateTraffic, resetTraffic, stepTraffic, traffic, trafficCensus, trafficDown, trafficHooks, vesselById, HOSTILE_ROLES, LAW_ROLES, SLOT_S } from "./npc/traffic.js";
import { battleHooks, fightCentre, pirateKilled, resetBattles, stepBattles } from "./npc/battles.js";
import { resetSecurity, stepSecurity, mountSecurity, assignGuards, securityHooks, securityCorp, securityReport, callForHelp, distress, nearestCall, etaOf } from "./npc/security.js";
import { stepSecLevel, resetSecLevel, secHooks, selfVictim, noteKillBySelf, noteHonestHit } from "./seclevel.js";
import { resetNpcCombat, stepNpcCombat, mountNpcCombat, combatHooksOut, combatReport, combatLog, damageHull } from "./npc/combat.js";
import { populateNests, stepRogues, mountRogues, rogueHooks, rogueReport, nests, waves } from "./npc/rogues.js";
import { resetPerf, notePerf, perf, perfReport } from "./perf.js";
import { populateFlow, resetFlow, stepFlow, flow, portPulse } from "./npc/flow.js";
import { laneOf, laneFlow, stationLane } from "./npc/lanes.js";
import { stepStationWorks, stepTractor, autoTractor, engageTractor, engagePush, releaseTractor, holdOff, tractor, worksReport, worksHooks, dockRequest, requestDock, clearDockRequest, hasDockRequest, unrequestedApproach, inDeparture, PUSH_GRACE } from "./stationworks.js";
import { boarding, resetBoarding, tickBoarding } from "./interior/boarding.js";
import { resetIcework, stepIcework } from "./icework.js";
import { applyTerraformSnapshot, resetAtmoWorks, stepAtmoWorks, terraformSnapshot } from "./atmoworks.js";
import { autopilot, disengageAutopilot, engageAutopilot, tickAutopilot } from "./autopilot.js";
import { TRACTOR_R, TRACTOR_V } from "./stations.js";
import { releaseBuilt } from "./stationyard.js";
import { eatRocks, inBelt, nearbyRocks, resetField } from "./field.js";
import { threatTo, avoidAim, avoidLevel, deliberate, surfaceOnly, AVOID } from "./avoid.js";
import { tickContacts, resetContacts } from "./contacts.js";
import { notePlayerChoice } from "./aria.js";
import {
  combatHooks,
  contacts,
  mining,
  npcTracer,
  resetCombat,
  shots,
  stepMining,
  stepShots,
  stepTurrets,
  syncContacts,
  turretAim, miningHooks } from "./turrets.js";

const WALLET_EVERY = 30;   // seconds between wallet writes while credits move (0.3.41)
const LOOK_GAIN = 1;

/** Softens the centre of the stick without giving up the full rate at the rim. */
function expo(v, amount) {
  const a = Math.abs(v);
  return Math.sign(v) * ((1 - amount) * a + amount * a * a * a);
}
const SURFACE_PAD = 4;

export const sim = {
  time: 0,
  timeScale: 1,
  phase: "menu",
  ship: makeShip(),
  selected: "earth",
  scanned: new Set(),
  beaconsGot: new Set(),
  remotes: new Map(),
  relations: new Map(),
  engagement: null, // the live NPC firefight, if any (npc/battles.js)
  clockSynced: false,
  skySeed: "",
  skyEvent: null,
  /* passive telemetry: sampled every few seconds for the terminal's charts */
  telemetry: { at: 0, credits: [], hull: [], heat: [], cargo: [], charge: [], speed: [] },
  /* the held sky: true = we run the rocks (solo, or the room's host) */
  worldAuthority: true,
  lostPorts: [],      // station ids destroyed this sky, for the snapshot
  warp: {
    state: "idle",   // idle | spool | run
    t: 0,
    dur: 3,
    cool: 0,
    block: "",
    from: { x: 0, y: 0, z: 0 },
    to: { x: 0, y: 0, z: 0 },
    fromYaw: 0,
    fromPitch: 0,
    toYaw: 0,
    toPitch: 0,
    targetId: "",
    /* the last jump that ended short, and what ended it. A dropout is not an
     * arrival, and anything that treats it as one (the autopilot's jump-only
     * leg did) hands the stick back in the middle of whatever you dropped
     * into — which in a belt is the rocks you were trying to leave. */
    dropped: null,
  },
  trauma: 0,
  heat: 0,
  /* experimental: deck plan fade (0 hull … 1 blueprint) and the interior sensors' report */
  hullFade: 0,
  interior: null,
  /* market events: { drought: { until, mult, sectors } | null } */
  market: { drought: null },
  /* salvage contract from the news desk: { bodyId, name, rate, until, hauled, paid } | null */
  contract: null,
  /* impact FX queue the renderer drains, and the canopy white-out */
  impactFX: [],
  flash: 0,
  /* live cataclysms: staged events the renderer animates and the sky lights by.
   * Each is { id, bodyId, kind:"impact"|"supernova", sev, t, outcome, ringed } */
  events: [],
  /* every light source an event is currently throwing into the sky, whether
   * or not it is on screen: { x, y, z, hex, lum, radius, kind } */
  skyGlow: [],
  /* how much brighter the whole sky is right now, 0..1 — drives the exposure
   * bump so an event BEHIND you still reads on the hull in front of you */
  skyLift: 0,
  cameraMode: 0,
  /* held throttle (Shift+Ctrl) and the pre-boost setting to fall back to */
  cruise: null,
  boostFrom: null,
  /* remote scans and probe drops: { id, name, x, y, z, at, lines[] } */
  scanReports: [],
  /* port lockers: stationId → { goodId: qty } */
  stash: {},
  /* what the autopilot does with a full hold: sell | stash | smelt, and whether it goes back out */
  autoPlan: { onDock: "sell", loop: true, seam: null, seamOre: null },
  selfId: "",
  callsign: "",
  color: "#d7dee8",
  lastToastAt: 0,
  toast: null,
  notice: "Survey the system. Fly close and scan.",
  noticeAt: 0,
  lastNotice: "",
  /* Wall-clock seconds. The notice card is a piece of UI, not a piece of the
   * world, so it must not fade in 0.2 s at 40x time or hang forever at 1x on
   * a slow frame budget. */
  wall: 0,
  /* low-passed stick, so a flick ramps instead of stepping */
  pan: { x: 0, y: 0 },
  reducedMotion: false,
  broadcast: (_d) => {},
  send: (_d, _id) => {},
  netSendAcc: 0,
  pulse: 0,
  wantScan: false,
  wantJump: false,
  texLoad: { done: 0, total: 0 },
  /* targeting and station keeping */
  lock: { id: null, kind: null, name: "", progress: 0, locked: false, dist: 0, angle: 0 },
  hold: { id: null, kind: null, ox: 0, oy: 0, oz: 0, has: false },
  /* ops board */
  pulseUntil: -1e6,
  threats: [],
  lastImpact: null,
  /* terminal */
  terminalOpen: false,
  termHold: false,
  log: [],
  waypoints: [],
  activeWaypoint: null,
  dominant: null,
  ui: { lanesDrawn: false },   // the lane rigs are off the canopy by default: DOCK brings you in, HAIL asks the port
  domDist: 0,
  altitude: 0,
  /* velocity of the world whose well we are in — the local reference frame */
  frameVel: { x: 0, y: 0, z: 0 },
  onSystemChange: () => {},
};

const _g = { x: 0, y: 0, z: 0 };
const _bp = { x: 0, y: 0, z: 0 };
const _rcs = { x: 0, y: 0, z: 0 };
const _matchVel = { x: 0, y: 0, z: 0 };

function clamp(v, lo, hi) {
  return Math.max(lo, Math.min(hi, v));
}
function lerp(a, b, t) {
  return a + (b - a) * t;
}
function easeInOut(t) {
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
}
export function wrapPi(a) {
  return Math.atan2(Math.sin(a), Math.cos(a));
}

/* legacy helpers still used by the renderer */
export function getForward(yaw, pitch) {
  return forwardOf(yaw, pitch);
}
export function getRight(yaw) {
  return { x: Math.cos(yaw), y: 0, z: -Math.sin(yaw) };
}

/** Ring-buffer flight log, read back in the terminal. */
export function logEvent(text, kind = "info") {
  if (!text) return;
  const last = sim.log[sim.log.length - 1];
  if (last && last.text === text && sim.time - last.t < 2) return;
  sim.log.push({ t: sim.time, text, kind });
  if (sim.log.length > 80) sim.log.splice(0, sim.log.length - 80);
}

export function relationOf(id) {
  return sim.relations.get(id) ?? "neutral";
}

export const RELATIONS = ["neutral", "ally", "hostile"];

export function setRelation(id, rel) {
  sim.relations.set(id, rel);
  const c = contacts.find((x) => x.id === id);
  if (c) c.relation = rel;
  logEvent(`${c?.name ?? id} flagged ${rel}`, "relation");
}

export function cycleRelation(id) {
  const i = RELATIONS.indexOf(relationOf(id));
  const next = RELATIONS[(i + 1) % RELATIONS.length];
  setRelation(id, next);
  return next;
}

/* ---- waypoints ---------------------------------------------------------- */

let wpSeq = 1;

export function addWaypoint(name) {
  const wp = {
    id: `wp${wpSeq++}`,
    name: name || `Mark ${wpSeq - 1}`,
    x: sim.ship.pos.x,
    y: sim.ship.pos.y,
    z: sim.ship.pos.z,
  };
  sim.waypoints.push(wp);
  sim.activeWaypoint = wp.id;
  logEvent(`Waypoint ${wp.name} marked`, "gps");
  return wp;
}

/** Waypoint at a fixed point with a name — ports, impact sites, anything. */
export function addWaypointAt(name, x, y, z) {
  const wp = addWaypoint(name);
  wp.x = x; wp.y = y; wp.z = z;
  return wp;
}

export function addBodyWaypoint(id) {
  const body = bodyById(id);
  if (!body) return null;
  bodyPosition(id, sim.time, _bp);
  const wp = { id: `wp${wpSeq++}`, name: body.name, x: _bp.x, y: _bp.y, z: _bp.z, body: id };
  sim.waypoints.push(wp);
  sim.activeWaypoint = wp.id;
  logEvent(`Waypoint set on ${body.name}`, "gps");
  return wp;
}

export function removeWaypoint(id) {
  const i = sim.waypoints.findIndex((w) => w.id === id);
  if (i >= 0) sim.waypoints.splice(i, 1);
  if (sim.activeWaypoint === id) sim.activeWaypoint = sim.waypoints[0]?.id ?? null;
}

export function setActiveWaypoint(id) {
  sim.activeWaypoint = id;
}

/** Live position of a waypoint — body-locked marks track their world. */
export function waypointPosition(wp, out) {
  const o = out ?? { x: 0, y: 0, z: 0 };
  if (wp.body) return bodyPosition(wp.body, sim.time, o);
  o.x = wp.x;
  o.y = wp.y;
  o.z = wp.z;
  return o;
}

export function activeWaypoint() {
  return sim.waypoints.find((w) => w.id === sim.activeWaypoint) ?? null;
}

/* ---- cargo -------------------------------------------------------------- */

/* ---- the stash and the smelter --------------------------------------------
 * A docked hull can leave its hold at the port (a locker per port, kept in the
 * save with the sky) and, at an industrial port, run ore through the works:
 * the refine table's own ratios, for a cut of the value. Both exist so the
 * autopilot's mining loop has somewhere to put ore other than the market. */

export const SMELT_FEE = 0.06;      // share of the smelted value the works keeps
export const SMELT_SECTORS = new Set(["industrial", "military", "logistic"]);

function stashOf(stId) {
  if (!sim.stash[stId]) sim.stash[stId] = {};
  return sim.stash[stId];
}

/** Everything in the port's locker: [{ id, name, qty }]. */
export function stashAt(stId) {
  const st = sim.stash[stId] ?? {};
  return Object.entries(st).filter(([, q]) => q > 1e-6).map(([id, qty]) => ({ id, name: goodName(id), qty }));
}

/** Leave cargo at the port you are clamped to. "all" empties the hold. */
export function stashDeposit(id = "all", qty = Infinity) {
  const ship = sim.ship;
  const st = stationById(ship.dockedAt);
  if (!st) return "Not docked";
  const locker = stashOf(st.id);
  let moved = 0;
  for (const k of id === "all" ? Object.keys(ship.hold) : [id]) {
    const give = takeCargo(ship, k, qty);
    if (give > 0) { locker[k] = (locker[k] ?? 0) + give; moved += give; }
  }
  if (moved <= 0) return "Nothing to stash";
  logEvent(`Stashed ${Math.round(moved)} units at ${st.name}`, "cargo");
  return null;
}

/** Take cargo back from the locker into the hold (what fits). */
export function stashWithdraw(id = "all", qty = Infinity) {
  const ship = sim.ship;
  const st = stationById(ship.dockedAt);
  if (!st) return "Not docked";
  const locker = stashOf(st.id);
  let moved = 0;
  for (const k of id === "all" ? Object.keys(locker) : [id]) {
    const have = locker[k] ?? 0;
    const took = addCargo(ship, k, Math.min(have, qty));
    if (took > 0) { locker[k] = have - took; if (locker[k] <= 1e-6) delete locker[k]; moved += took; }
  }
  if (moved <= 0) return holdRoom(ship) <= 0 ? "Hold is full" : "Nothing in the locker";
  logEvent(`Withdrew ${Math.round(moved)} units at ${st.name}`, "cargo");
  return null;
}

/* ---- the fabrication line (js/fabricate.js) --------------------------------
 *
 * The solver is a leaf: it knows the recipe graph and nothing about stations,
 * clocks or credits. This is the world it works on.
 *
 * A job draws on the port's LOCKER plus, when the pilot is standing there, the
 * hold. A company job draws on the locker alone — nobody is aboard to unload.
 * Everything it makes lands in the locker either way, because a job outlives
 * the visit that ordered it: you queue it, you fly, you come back to parts.
 */
wireFab({
  now: () => sim.time,
  get skySeed() { return sim.skySeed; },
  get callsign() { return sim.callsign; },

  stockAt: (stId, by) => {
    const out = { ...(sim.stash[stId] ?? {}) };
    if (by === "player" && sim.ship?.dockedAt === stId) {
      for (const [k, v] of Object.entries(sim.ship.hold ?? {})) out[k] = (out[k] ?? 0) + v;
    }
    return out;
  },

  consume: (stId, by, use) => {
    const locker = stashOf(stId);
    for (const [k, want] of Object.entries(use)) {
      let left = want;
      /* the locker first: what is already ashore should go in before the hold
       * is emptied, or a pilot loses cargo they were carrying for a reason */
      const ashore = Math.min(locker[k] ?? 0, left);
      if (ashore > 0) { locker[k] -= ashore; left -= ashore; if (locker[k] <= 1e-9) delete locker[k]; }
      if (left > 1e-9 && by === "player" && sim.ship?.dockedAt === stId) takeCargo(sim.ship, k, left);
    }
  },

  deliver: (stId, by, id, qty) => {
    const locker = stashOf(stId);
    locker[id] = (locker[id] ?? 0) + qty;
  },

  pay: (by, cr, why) => {
    if (cr <= 0) return null;
    if (by === "company") return treasuryPay(cr, why, "works");
    if ((sim.ship?.credits ?? 0) < cr) return `The works want ${Math.round(cr).toLocaleString()} cr up front`;
    sim.ship.credits -= cr;
    return null;
  },

  log: (text) => { logEvent(text, "port"); post({ channel: "drones", from: "Works", text }); },
});

/* The cutter stows itself on a full hold (js/turrets.js fires this once per
 * fill). Before 0.3.11 it kept burning bus power into a beam that landed
 * nothing, which on a halved gather rate is a long time to be wasting.
 *
 * Hung at LAUNCH, not at module top level: sim.js and turrets.js are a cycle,
 * so `miningHooks` is still in its temporal dead zone while this file's body
 * runs and touching it there throws before the game ever starts. */
function wireMiningHooks() {
  miningHooks.onHoldFull = (what) => {
    if (sim.ship?.miningMode === "off") return;
    setMiningMode("off", { quiet: true });
    sim.notice = `Hold full — cutter stowed. ${what ? `${what} left in the rock.` : ""}`.trim();
    sim.noticeAt = sim.wall;
    logEvent("Hold full: mining laser stowed", "system");
  };
}

export function canSmeltAt(st) {
  return Boolean(st && SMELT_SECTORS.has(st.sector) && !(st.hostile && !st.claimed));
}

/** Run every ore in the hold through the port's works. Returns null or why not. */
export function smeltAll() {
  const ship = sim.ship;
  const st = stationById(ship.dockedAt);
  if (!st) return "Not docked";
  if (!canSmeltAt(st)) return `${st.name} has no smelter — an industrial port does`;
  let inOre = 0, outMin = 0, fee = 0;
  const made = {};
  for (const ore of ORES) {
    const have = ship.hold[ore.id] ?? 0;
    if (have <= 0 || !ore.refine) continue;
    const per = ore.refine.per * upgradeFx("smelt", 1);
    const mineral = ore.refine.mineral;
    takeCargo(ship, ore.id, have);
    const got = have * per;
    const cut = got * SMELT_FEE;
    addCargo(ship, mineral, got - cut);
    fee += cut * baseValue(mineral);
    made[mineral] = (made[mineral] ?? 0) + (got - cut);
    inOre += have; outMin += got - cut;
  }
  if (inOre <= 0) return "No ore aboard to smelt";
  st.credits += fee;
  const list = Object.entries(made).map(([m, q]) => `${Math.round(q)} ${goodName(m)}`).join(", ");
  logEvent(`Smelted ${Math.round(inOre)} ore at ${st.name} → ${list} (works kept ${Math.round(fee)} cr of value)`, "trade");
  work("supplyChain", 1.2);
  sim.notice = `Smelted: ${list}.`;
  return null;
}

/** Sell every ore and mineral aboard at the port's bid. Returns credits earned. */
export function sellAllOre() {
  const ship = sim.ship;
  const st = stationById(ship.dockedAt);
  if (!st) return 0;
  const before = ship.credits;
  let sold = 0;
  for (const k of Object.keys(ship.hold)) {
    const g = good(k);
    if (!g || (g.tier !== "ore" && g.tier !== "mineral")) continue;
    sold += ship.hold[k];
    tradeSell(k, ship.hold[k]);
  }
  /* this is a labelled example: of every desk in reach you chose this one, and
   * the size of the load is how much of a choice it was (js/aria.js) */
  if (sold > 0 && !sim.handsOff) notePlayerChoice("port", st.id, Math.min(3, 0.5 + sold / 120));
  return ship.credits - before;
}

export function jettison(id, amount) {
  const drop = takeCargo(sim.ship, id, amount === "all" ? Infinity : amount);
  if (drop > 0) logEvent(`Jettisoned ${Math.round(drop)} ${goodName(id)}`, "cargo");
}

/* ---- ports -------------------------------------------------------------- */

export function stationStatus() {
  const ship = sim.ship;
  const near = nearestStation(ship.pos, 60000);
  if (!near) return null;
  const st = near.station;
  const rel = Math.hypot(ship.vel.x - st.vx, ship.vel.y - st.vy, ship.vel.z - st.vz);
  const check = dockCheck(st, ship.pos, rel);
  return {
    station: st,
    dist: near.dist,
    rel,
    ...check,
    docked: ship.dockedAt === st.id,
    info: describeStation(st),
    works: worksReport(st),
    tractor: tractor.active && tractor.stId === st.id ? tractor : null,
  };
}

/** Pin a name over the message card so "Undocked." reads as the port, not the planet behind it. */
export function setNoticeAbout(text, name) {
  sim.notice = text;
  sim.noticeAbout = { text, name };
}

const fmtKm = (u) => `${(u / 100).toFixed(u < 10000 ? 1 : 0)} km`;

export function toggleDock() {
  const ship = sim.ship;
  if (tractor.active) {
    const st = stationById(tractor.stId);
    if (tractor.phase === "push") {
      /* a departure is not yours to wave off: control keeps the helm until you are clear of the exit lane */
      setNoticeAbout(`${st?.name ?? "Port"} control: departure in progress — ${Math.ceil(tractor.left ?? 0)} s to release. Hands off the helm.`, st?.name ?? "PORT");
      WARN.caution();
      return false;
    }
    /* waving port control off mid-pull: the lock drops and you keep what drift you had */
    releaseTractor();
    setNoticeAbout(`${st?.name ?? "Port"} control released the tractor. You have the helm.`, st?.name ?? "PORT");
    logEvent(`Tractor lock released at ${st?.name ?? "port"}`, "port");
    return false;
  }
  if (ship.dockedAt) {
    /* 0.3.25: the clamps do not come off while the crane is still working.
     * Everything that undocks — the deck button, the autopilot, the mission
     * executor — comes through here, so this one refusal is the whole rule. */
    const wait = handlingLeft(ship.dockedAt);
    if (wait > 0) {
      const at = stationById(ship.dockedAt);
      setNoticeAbout(`${at?.name ?? "Port"} control: cargo handling — ${handlingLine()}. Clamps stay on.`, at?.name ?? "PORT");
      return false;
    }
    const st = stationById(ship.dockedAt);
    if (st) st.docked = false;
    ship.dockedAt = null;
    clearDockRequest();
    /* port control pushes you out: through the mouth, up the exit ways and clear of the lane before it lets go */
    if (st && engagePush(st, ship, sim.dockHangar ?? 0)) {
      setNoticeAbout(`Undocked from ${st.name}. Control has the helm on the way out — clamps clear, exit ways.`, st.name);
    } else setNoticeAbout(`Undocked from ${st?.name ?? "the port"}. Clamps clear.`, st?.name ?? "PORT");
    logEvent(`Undocked from ${st?.name ?? "port"}`, "port");
    return false;
  }
  const s = stationStatus();
  if (!s) {
    sim.notice = "No port in range.";
    WARN.deny();
    return false;
  }
  if (!s.ok) {
    /* too far or too fast for the lock: file the berth and hand the helm to port control — the
     * approach autopilot flies the (unmarked) entry lane at the tractor's speed limit and the
     * tractor takes the hull at the mouth. DOCK again on the way in waves it off. */
    if (s.station.hangars?.length && !(s.station.hostile && !s.station.claimed)) {
      if (autopilot.on && autopilot.targetId === s.station.id) {
        if (autopilot.mode === "approach") {
          disengageAutopilot("waved off");
          setNoticeAbout(`${s.station.name} control: approach waved off. You have the helm; the berth stands.`, s.station.name);
          return false;
        }
        /* a mining or warp leg already flying itself in only needs the berth filed */
        requestDock(s.station, sim.time);
        setNoticeAbout(`${s.station.name} control: berth granted. The tractor takes you at the mouth.`, s.station.name);
        logEvent(`Docking requested at ${s.station.name}`, "port");
        UI.commit();
        return true;
      }
      requestDock(s.station, sim.time);
      sim.dockRequestFor = s.station.id;
      const r = engageAutopilot(s.station.id, "approach");
      if (r) setNoticeAbout(`${s.station.name} control: berth granted — we have the helm. ${fmtKm(s.dist)} in at ${TRACTOR_V} u/s on the mouth; the tractor takes you there. DOCK again to wave us off.`, s.station.name);
      else setNoticeAbout(`${s.station.name} control: berth granted. Close to ${TRACTOR_V} u/s within ${TRACTOR_R * 10 / 1000} km of the mouth and the tractor takes you.`, s.station.name);
      logEvent(`Docking requested at ${s.station.name} — port control approach`, "port");
      UI.commit();
      return true;
    }
    sim.notice = `Cannot dock — ${s.why.toLowerCase()}.`;
    WARN.deny();
    return false;
  }
  if (s.station.hangars?.length && inDeparture(s.station, ship, sim.time)) {
    /* fresh off the push: no lock from the exit lane — file the berth and come back round by the entry lane */
    requestDock(s.station, sim.time);
    setNoticeAbout(`${s.station.name} control: you are outbound on our EXIT lane. Berth filed — come round onto the ENTRY lane and the tractor takes you at the funnel.`, s.station.name);
    logEvent(`Docking requested at ${s.station.name} (from the exit lane)`, "port");
    UI.commit();
    return true;
  }
  if (s.station.hangars?.length) {
    const r = engageTractor(s.station, ship, 0, "request");
    if (!r.ok) { sim.notice = `Cannot dock — ${r.why.toLowerCase()}.`; WARN.deny(); return false; }
    requestDock(s.station, sim.time);
    setNoticeAbout(`${s.station.name} control has the helm — tractor lock. Hands off the helm.`, s.station.name);
    logEvent(`Tractor lock from ${s.station.name}`, "port");
    SHIP.tractor();
    return true;
  }
  finishDock(s.station, s.info);
  return true;
}

/** The clamps take the hull: the same landing whether the tractor brought you or you were already alongside. */
function finishDock(st, info = describeStation(st)) {
  const ship = sim.ship;
  ship.dockedAt = st.id;
  st.docked = true;
  clearDockRequest();
  laneCredit(st);
  ship.vel.x = st.vx;
  ship.vel.y = st.vy;
  ship.vel.z = st.vz;
  sim.dockOffset = { x: ship.pos.x - st.x, y: ship.pos.y - st.y, z: ship.pos.z - st.z };
  setNoticeAbout(`Docked at ${st.name}. ${info.blurb}`, st.name);
  logEvent(`Docked at ${st.name} (${info.sector})`, "port");
  work("supplyChain", 2);
  SHIP.docked();
}

/** Tractor and tractor capture: runs after the ship has moved for the tick. */
function stepTractorTick(d) {
  const ship = sim.ship;
  if (tractor.active) {
    const stId = tractor.stId, hangar = tractor.hangar ?? 0, name = tractor.name;
    const r = stepTractor(d, ship);
    if (r === "docked") {
      const st = stationById(stId ?? ship.dockedAt);
      sim.dockHangar = hangar;
      const target = st ?? nearestStation(ship.pos, 5000)?.station;
      if (target) finishDock(target);
    } else if (r === "released") {
      holdOff(sim.time, PUSH_GRACE, stId);
      setNoticeAbout(`${name} control released the helm. You are clear of the funnel on the EXIT lane — fly safe.`, name);
      logEvent(`Clear of ${name}`, "port");
    }
    return;
  }
  if (sim.phase !== "play" || ship.dockedAt || sim.warp.state === "run") return;
  const st = autoTractor(ship, (s) => Math.hypot(ship.vel.x - s.vx, ship.vel.y - s.vy, ship.vel.z - s.vz), sim.time);
  if (st) {
    setNoticeAbout(`${st.name} control: we have you — tractor lock. Hands off the helm.`, st.name);
    logEvent(`Tractor lock at ${st.name}`, "port");
    SHIP.tractor();
    return;
  }
  /* on the lane or in the mouth with no berth asked for: the puck rings, the tractor stays off */
  sim.approach = unrequestedApproach(ship, sim.time);
}

export function tradeBuy(id, qty) {
  const ship = sim.ship;
  const st = stationById(ship.dockedAt);
  if (!st) return "Not docked";
  const line = st.stock.find((x) => x.id === id);
  if (!line) return "Not stocked";
  const want = Math.min(qty, line.qty, holdRoom(ship));
  const price = buyPriceAt(st, line, want);
  const take = Math.min(want, Math.floor(ship.credits / price));
  if (take <= 0) return holdRoom(ship) <= 0 ? "Hold full" : "Cannot afford";
  ship.credits -= take * price;
  line.qty -= take;
  st.credits += take * price;
  addCargo(ship, id, take);
  bookHandling(st.id, "buy", id, take, ship.mods);
  logEvent(`Bought ${take} ${goodName(id)} for ${take * price} cr`, "trade");
  work("commerce", 0.6);
  const co = corpOfStation(st);
  if (co) adjustStanding(co.id, 0.4, "trade");
  return null;
}

/**
 * What this port actually pays for a good — sector price through the owner's
 * margin. `qty` prices the whole consignment: a lot walks the port's stock
 * curve down as it lands (economy.js lotMult), so the hundred-and-sixtieth
 * girder does not fetch bare-shelf money. Left at 1 it is the marginal price,
 * which is what a shelf label and a valuation want.
 */
export function sellPriceAt(st, id, qty = 1) {
  return Math.max(1, Math.round(priceAt(st.sector, id, "buy") * lotMult(st, id, qty, +1) * standingMargin(corpOfStation(st)) * (sim.ship.mods?.sell ?? 1) * marketMult(st, id)));
}

/** Event pricing: a drought makes thirsty sectors pay tanker rates for water. */
export function marketMult(st, id) {
  const d = sim.market?.drought;
  if (d && sim.time < d.until && d.sectors.includes(st.sector)) {
    if (id === "water") return d.mult;
    if (id === "water_ice") return 1 + (d.mult - 1) * 0.55; // raw snow rides the same panic, discounted
    if (id === "ration") return 1.3;
  }
  const ev = sim.skyEvent;
  if (ev?.kind === "ice_rush" && sim.time < ev.until && (id === "water_ice" || id === "methane_ice")) {
    return ev.mult ?? 1.8;
  }
  return 1;
}

/* Shared sky bulletin. Same seed + same world-time slot = same event on
 * every client in the room. A peer can also push the payload over the
 * relay; applySkyEvent is idempotent per slot. */
function applySkyEvent(ev, local) {
  if (!ev || ev.kind === "quiet") {
    if (sim.market.drought && (!ev || sim.time >= (sim.market.drought.until ?? 0))) {
      logEvent("Drought lifted — water is back to book price", "trade");
      sim.toast = "Drought lifted. Water back to book.";
      sim.lastToastAt = sim.time;
      sim.market.drought = null;
    }
    if (sim.skyEvent?.kind && sim.skyEvent.kind !== "quiet" && (!ev || ev.kind === "quiet")) {
      sim.skyEvent = ev ?? { kind: "quiet", slot: -1 };
    }
    return;
  }
  /* a drought needs somebody thirsty: no agricultural or civilian port, no bulletin — the desk never names a ghost */
  if (ev.kind === "drought" && !stations.some((st) => (ev.sectors ?? ["agricultural", "civilian"]).includes(st.sector))) {
    ev = { kind: "quiet", slot: ev.slot, until: ev.until, seed: ev.seed };
    if (sim.skyEvent && sim.skyEvent.slot === ev.slot) return;
    sim.skyEvent = ev;
    return;
  }
  if (sim.skyEvent && sim.skyEvent.slot === ev.slot && sim.skyEvent.kind === ev.kind) return;
  sim.skyEvent = ev;
  if (ev.kind === "drought") {
    const thirsty = stations.filter((st) => (ev.sectors ?? ["agricultural", "civilian"]).includes(st.sector));
    sim.market.drought = {
      until: ev.until,
      mult: ev.mult ?? 2.4,
      sectors: ev.sectors ?? ["agricultural", "civilian"],
      ports: thirsty.map((st) => st.name),
    };
  } else if (sim.market.drought && sim.time >= (sim.market.drought.until ?? 0)) {
    sim.market.drought = null;
  }
  const msg = eventLine(ev, stations);
  if (msg) {
    logEvent(msg, ev.kind === "pirate_watch" ? "combat" : "trade");
    sim.toast = msg;
    sim.lastToastAt = sim.time;
  }
  if (local) sim.send({ t: "sky", event: ev });
}

let marketSlot = -1, marketSeed = null;   // the last event slot rolled: one roll per slot, not per frame
function stepMarket(_d) {
  if (!sim.skySeed) return;
  if (sim.market.drought && sim.time >= sim.market.drought.until) {
    logEvent("Drought lifted — water is back to book price", "trade");
    sim.toast = "Drought lifted. Water back to book.";
    sim.lastToastAt = sim.time;
    sim.market.drought = null;
  }
  const slot = Math.floor(Math.max(0, sim.time) / SLOT_S);
  if (slot === marketSlot && sim.skySeed === marketSeed) return;
  marketSlot = slot; marketSeed = sim.skySeed;
  applySkyEvent(eventAt(sim.skySeed, sim.time), true);
}

/** What this port charges you for a stocked line — the list price through your own margin. */
export function buyPriceAt(st, line, qty = 1) {
  /* the list price rides the port's stock (economy.js): bare shelves charge more,
   * a glut less — and clearing a shelf walks it up as you clear it (0.3.24) */
  return Math.max(1, Math.round(askPrice(st, line.id, qty) * (sim.ship.mods?.buy ?? 1)));
}

/** The port's ledger for the deck: lines, shortages, gluts, stock against target. */
export function portLedger(st) { return econReport(st); }
export function portWants(st, n = 3) { return wantsOf(st, n); }

export function tradeSell(id, qty) {
  const ship = sim.ship;
  const st = stationById(ship.dockedAt);
  if (!st) return "Not docked";
  /* priced as one consignment, on the curve it is about to move (0.3.24) */
  const want = Math.min(qty, ship.hold[id] ?? 0);
  const price = sellPriceAt(st, id, want);
  const give = Math.min(want, Math.floor(st.credits / Math.max(price, 1)));
  if (give <= 0) return (ship.hold[id] ?? 0) <= 0 ? "None aboard" : "Port is short of credits";
  takeCargo(ship, id, give);
  ship.credits += give * price;
  st.credits -= give * price;
  const line = st.stock.find((x) => x.id === id);
  if (line) line.qty += give;
  else st.stock.push({ id, qty: give, sell: priceAt(st.sector, id, "sell") });
  bookHandling(st.id, "sell", id, give, ship.mods);
  logEvent(`Sold ${Math.round(give)} ${goodName(id)} for ${Math.round(give * price)} cr`, "trade");
  bookRevenue(good(id)?.tier === "ore" ? "ore" : good(id)?.tier === "mineral" ? "mineral" : "trade", give * price, `Sold ${Math.round(give)} ${goodName(id)} at ${st.name}`);
  work("commerce", 0.8);
  work("supplyChain", 0.4);
  const seller = corpOfStation(st);
  if (seller) adjustStanding(seller.id, 0.6, "trade");
  return null;
}

/** Claim a free port once its guns are quiet. */
export function claimPort() {
  const s = stationStatus();
  if (!s) return "No port in range";
  const st = s.station;
  if (!st.hostile) return "Nothing to claim";
  const live = contacts.filter((c) => c.stationId === st.id && c.hp > 0).length;
  if (live > 0 || st.guards > 0) return `${st.guards || live} guns still active`;
  st.hostile = false;
  st.claimed = true;
  setNoticeAbout(`${st.name} is yours. The docking clamps answer to you now.`, st.name);
  logEvent(`Claimed ${st.name}`, "port");
  work("law", 5);
  work("command", 3);
  return null;
}

/* ---- terminal ----------------------------------------------------------- */

export function setTerminal(open) {
  sim.terminalOpen = open;
  if (!open) sim.termHold = false;
  useGameStore.getState().patchHud({ terminalOpen: open, termHold: sim.termHold });
}

export function setTermHold(on) {
  sim.termHold = on;
  useGameStore.getState().patchHud({ termHold: on });
}

export function resetTune() {
  sim.ship.tune = defaultTune();
  sim.ship.shed = [...SHED_ORDER];
  applyRaceTune(sim.ship); // factory trim still carries the race's multipliers
  logEvent("Trim reset to factory", "system");
}

export function setTune(key, value) {
  const t = sim.ship.tune;
  if (!(key in t)) return;
  t[key] = value;
  if (key === "throttleCap" && sim.ship.throttle > value) setThrottle(value);
}

export function moveShed(key, dir) {
  const list = sim.ship.shed;
  const i = list.indexOf(key);
  const j = i + dir;
  if (i < 0 || j < 0 || j >= list.length) return;
  list.splice(j, 0, list.splice(i, 1)[0]);
  logEvent(`Shed priority: ${list.join(" > ")}`, "system");
}

export function hydrateProgress() {
  const s = useGameStore.getState();
  sim.scanned = new Set(s.scanned);
  sim.beaconsGot = new Set(s.beaconsGot);
}

export function loadSky(seed) {
  sim.skySeed = seed;
  const sys = applySystem(generateSystem(seed));
  useGameStore.getState().patchHud({
    systemName: sys.name,
    beaconTotal: sys.beacons.length,
    surveyTotal: surveyIds().length,
  });
  resetField();
  resetCombat(seed);
  resetDebris();
  resetImpactors(rngFromSeed(`${seed}:rocks`));
  resetHoles();
  resetImpacts();
  /* a new sky starts quiet: no live events, no lit horizon */
  sim.events.length = 0;
  sim.skyGlow.length = 0;
  sim.skyLift = 0;
  sim.impactFX.length = 0;
  for (const b of BODIES) { b.event = null; b.ring = null; b.nova = false; b.collapsed = false; b.tidal = 0; b.moltenGlow = 0; }
  bindDebris(sim);
  resetStations();
  buildStations(sys, rngFromSeed(`${seed}:ports`), String(seed));
  stepStations(sim.time);
  buildCorps(rngFromSeed(`${seed}:corps`));
  /* 0.3.42 — standing is the pilot's, per sky: the corps are regrown from the
   * seed on every load, and until now that put every one of them back to the
   * tier default — a season of favours gone on reload. The record carries a
   * table per sky; a returning pilot gets theirs back here, before anything
   * reads it. */
  if (pilot.restored) {
    const table = pilot.record?.standing?.[String(seed)];
    if (table) for (const c of corps) if (Number.isFinite(table[c.id])) c.standing = Math.max(-100, Math.min(100, table[c.id]));
  }
  for (const st of stations) st.guards0 = st.guards ?? 0;
  sim.skySeed = seed;
  /* Before anything is POPULATED, not after. How many hulls and how many
   * shuttles a sky carries is a decision taken once and lived with; letting it
   * be taken from a frame-time measurement left over from a different sky
   * means a system built while the last one was struggling stays permanently
   * thin, even on a device that is now idle. Reset first, build at a known
   * tier, and let the budget do what it is actually for — trimming per-frame
   * detail — once the sky is running. */
  resetPerf();
  populateTraffic(seed, stations, sys);
  populateFlow(seed, stations);
  /* the corporations' own drone lines, on the same work board as yours */
  board.clock = () => sim.time;
  resetBoard();
  populateNpcDrones(seed);
  resetBattles(seed);
  /* the reactive sky: who answers a call, who is hunting whom, and what is
   * building drones out in the cold. Directors are installed in the order
   * they get to claim a hull — security first (a picket on a call flies the
   * call), then combat (anything with a fight on flies the fight), then the
   * rogues (a drone with nothing in front of it presses on to its objective). */
  resetSecurity();
  resetSecLevel();
  resetNpcCombat();
  mountSecurity();
  mountNpcCombat();
  mountRogues(trafficHooks);
  assignGuards(stations);
  populateNests(seed, sys, stations);
  wireReactiveSky();
  battleHooks.onJoin = (e) => {
    sim.toast = `You are in it — ${e.wing.length} pirate hulls on ${e.victimName}. Turrets to ENEMIES.`;
    sim.lastToastAt = sim.time;
    logEvent(`Joined the engagement at ${e.victimName}`, "combat");
    work("security", 2);
  };
  sim.onSystemChange();
  return sys;
}

/* ---- the reactive sky's own bookkeeping ---------------------------------
 *
 * Everything below is the part of the new NPC behaviour that has to reach the
 * player: the toasts, the log lines, the standing moves, and the one number
 * that changes how a fight feels — the response clock. A player deciding
 * whether to press an attack on a supply hull is deciding against that timer,
 * so it has to be honest and it has to be visible. */
function wireReactiveSky() {
  /* every round that lands on anything, from anyone */
  combatHooks.onHit = (c, damage, owner, time) => {
    if (c.kind !== "npc") return;
    const n = vesselById(c.id);
    if (!n) return;
    /* the contact already took the damage; this mirrors it back onto the hull
     * and lets the hull react to having been shot at */
    n.hp = c.hp;
    n.shield = c.shield;
    n.lastHitBy = owner;
    n.lastHitAt = time;
    const by = owner === "self" ? { id: "self", name: sim.ship?.name ?? "an unidentified hull", player: true } : vesselById(owner);
    if (!HOSTILE_ROLES.has(n.role) && !n.rogue) {
      callForHelp(n, by, time, by?.rogue ? "rogue" : by && HOSTILE_ROLES.has(by.role) ? "pirate" : owner === "self" ? "player" : "unknown");
      if (!n.fleeFrom && !LAW_ROLES.has(n.role)) { n.fleeFrom = owner; n.fleeAt = time; }
    }
  };

  /* somebody lost a hull out there, and it was not the player's doing */
  combatHooksOut.onDown = (n, byId, t) => {
    const by = byId && byId !== "self" ? vesselById(byId) : null;
    if (HOSTILE_ROLES.has(n.role) || n.rogue) {
      if (by && LAW_ROLES.has(by.role)) {
        const law = securityCorp();
        if (law) adjustStanding(law.id, 2, `destroyed ${n.name}`);
        gnnPost({ desk: "security", title: "RAIDER DOWN", body: `${by.name} destroyed ${n.name}.` });
      }
      return;
    }
    /* an honest hull was lost. The port it was carrying for notices. */
    const co = corpOfVessel(n);
    if (co) adjustStanding(co.id, -2, `lost ${n.name}`);
    if (n.role === "supply" && n.supplyFor) {
      const st = stations.find((x) => x.id === n.supplyFor);
      if (st) logEvent(`${st.name} will not get that delivery — ${n.name} was destroyed`, "combat");
    }
    sim.send({ t: "vdown", id: n.id, until: trafficDown[n.id] });
  };

  /* 0.3.48: the security ◆ — the player's own SOS, and what a fight costs you */
  securityHooks.selfVictim = selfVictim;
  secHooks.log = logEvent;
  secHooks.toast = (m) => { sim.toast = m; sim.lastToastAt = sim.time; };

  /* the clock the player is deciding against */
  securityHooks.onCall = (call) => {
    if (!call.byPlayer) return;
    noteHonestHit(call, sim.time);
    const eta = etaOf(call, sim.time);
    sim.toast = eta == null
      ? `${call.victimName} is calling for help. Nobody is coming.`
      : `${call.victimName} is calling for help — response in ${Math.round(eta)}s`;
    sim.lastToastAt = sim.time;
    logEvent(`${call.victimName} put out a distress call`, "comms");
  };
  securityHooks.onDispatch = (call) => {
    const law = securityCorp();
    logEvent(`${law?.name ?? "Security"} dispatched to ${call.victimName} — ${Math.round(etaOf(call, sim.time) ?? 0)}s out`, "comms");
  };
  securityHooks.onArrive = (call, n) => {
    if (!call.byPlayer) return;
    sim.toast = `${n.name} is on scene.`;
    sim.lastToastAt = sim.time;
  };

  /* a port's batteries, fighting something the player cannot see. Damage goes
   * through the same path a round would take, so a raider driven off a port on
   * the far side of the system carries that damage into its next fight. */
  worksHooks.onBatteryHit = (n, amount, st, time) => {
    const killed = damageHull(n, amount, `${st.id}:battery`, time);
    if (killed) logEvent(`${st.name} batteries destroyed ${n.name}`, "combat");
  };

  /* the rogues */
  rogueHooks.onLaunch = (wave, nest) => {
    if (!nest.known) return;   // you cannot be told about a nest nobody has found
    gnnPost({ desk: "security", title: "DRONE ACTIVITY", body: `A wave of ${wave.drones.length} is under way from ${nest.name} toward ${wave.target.name}.` });
  };
  rogueHooks.onSiege = (st, wave, onIt) => {
    if (st.siegeToldAt && sim.time - st.siegeToldAt < 60) return;
    st.siegeToldAt = sim.time;
    sim.toast = `${st.name} is under drone assault — ${onIt} on the hull`;
    sim.lastToastAt = sim.time;
    logEvent(`${st.name} under drone assault (${onIt})`, "combat");
    gnnPost({ desk: "security", title: "PORT UNDER ASSAULT", body: `${st.name} reports drones on the hull.` });
  };
  rogueHooks.onNestDown = (nest) => {
    logEvent(`${nest.name} has gone quiet`, "combat");
  };
}

/**
 * Station-keeping hold, nose-on to the home world. You open your eyes with
 * the planet filling a quarter of the canopy and its gravity already working
 * on you — the fastest way to learn what these worlds weigh.
 */
function seedOrbit(ship, body, time) {
  bodyPosition(body.id, time, _bp);
  const r = body.radius * 4.6;
  ship.pos.x = _bp.x + r * 0.94;
  ship.pos.y = _bp.y + r * 0.2;
  ship.pos.z = _bp.z + r * 0.27;
  /* Match the world's own orbital motion, or it simply leaves without you. */
  bodyVelocity(body.id, time, ship.vel);
  const dx = _bp.x - ship.pos.x;
  const dy = _bp.y - ship.pos.y;
  const dz = _bp.z - ship.pos.z;
  const horiz = Math.hypot(dx, dz) || 1;
  ship.yaw = Math.atan2(-dx, -dz);
  ship.pitch = clamp(Math.atan2(dy, horiz), -0.5, 0.5);
  ship.aimYaw = ship.yaw;
  ship.aimPitch = ship.pitch;
  ship.yawVel = 0;
  ship.pitchVel = 0;
  ship.roll = 0;
}

export function launchSim(callsign, seed) {
  loadCompany();
  const sky = skyProgress(seed);
  sim.scanned = new Set(sky.scanned);
  sim.beaconsGot = new Set(sky.beacons);
  sim.pendingTerraform = { snap: sky.terraform ?? {}, bonds: sky.terraBonds ?? [] };
  const sys = loadSky(seed);
  const home = spawnBodyId(sys);
  const ship = makeShip();
  sim.ship = ship;
  sim.phase = "play";
  /* nothing from the last sky may point at this one: generated ids repeat */
  sim.waypoints = [];
  sim.activeWaypoint = null;
  sim.log = [];
  sim.relations.clear();
  sim.threats = [];
  sim.lastImpact = null;
  sim.dominant = null;
  sim.lock = { id: null, kind: null, name: "", progress: 0, locked: false, dist: 0, angle: 0 };
  sim.hold.has = false;
  sim.terminalOpen = false;
  sim.termHold = false;
  /* signing on is a fresh pilot's event — a returning one (0.3.42) signed on
   * the day they were made, and does not collect the standing again each launch */
  if (pilot.corpId && !pilot.restored) adjustStanding(pilot.corpId, 25, "signed on");
  sim.activeHullId = null;
  sim.ownedHulls = [];
  resetInsurance();      // policies are written against hulls, and these are new hulls
  if (pilot.restored) {
    /* the hulls the pilot bought, and the cover written on them, come back
     * with the pilot — they were swept with everything else until 0.3.42 */
    const rec = pilot.record ?? null;
    sim.ownedHulls = (rec?.hulls ?? []).filter((id) => shipById(id));
    sim.activeHullId = sim.ownedHulls.includes(rec?.activeHull) ? rec.activeHull : null;
    for (const p of rec?.cover ?? []) if (p?.key?.startsWith("player:") && sim.ownedHulls.includes(p.key.slice(7))) insure(p.key, p.tier, p.value, p.at ?? 0);
  }
  /* set the pools before anything can read them: syncHullTune refreshes these
   * every tick, but a launch must not leave `resists` null for a frame */
  syncHullDefence(ship, currentShipId());
  crew.employer = callsign;
  resetCrew();
  resetHousehold();
  resetContracts();
  resetFleet();
  resetBoarding();
  resetIcework();
  resetAtmoWorks();
  disengageAutopilot("reset");
  /* station ids restart at st1: a pull or a request held over would answer to the wrong port */
  releaseTractor();
  clearDockRequest();
  sim.approach = null;
  resetContacts();
  sim.lane = null;
  sim.dockOffset = null;
  sim.market = { drought: null };
  sim.skyEvent = null;
  sim.clockSynced = false;
  sim.time = 0;
  /* sky time restarts: nothing keyed to the old clock may still be running */
  sim.pulseUntil = -1e6;
  sim.lastToastAt = 0;
  sim.toast = null;
  sim.wrongWayWarnAt = -99;
  sim.flash = 0;
  sim.worldAuthority = true;
  setImpactorAuthority(true);
  sim.lostPorts = [];
  for (const k of Object.keys(trafficDown)) delete trafficDown[k];
  resetTelemetry();
  sim.contract = null;
  if (captain.holder !== "player") retakeCommand();
  sim.callsign = callsign;
  /* robots and refit upgrades are property: keyed by sky and callsign, so they load once both are set */
  loadRobots();
  loadUpgrades();
  sim.color = hashHue(callsign);
  sim.timeScale = 1;
  sim.warp.state = "idle";
  sim.warp.cool = 0;
  sim.trauma = 0;
  sim.heat = 0;
  sim.cameraMode = 0;
  sim.cruise = null;
  sim.boostFrom = null;
  sim.scanReports.length = 0;
  sim.stash = {};
  sim.autoPlan = { onDock: "sell", loop: true, seam: null, seamOre: null };
  sim.autoPlan.defaults ??= { thrustCap: 1, warp: "auto" };
  resetProbes();
  /* the chat bus and GNN run on sky time; your drones come back where you left them */
  chat.clock = () => sim.time;
  gnn.clock = () => sim.time;
  resetChat();
  resetGnn();
  loadDroneOps();
  /* jobs on a port's line belong to the sky, like the drones do: come back to
   * this sky and the parts are waiting where you left them on the line */
  resetFab();
  loadFab();
  wireMiningHooks();
  sim.selected = home;
  applyRaceToShip(ship);
  applyCareerDefaults(ship);
  /* 0.3.41 — the wallet comes back. Until now `ship.credits` was whatever
   * makeShip() and the race bonus issued, every launch: a session's earnings
   * were gone on reload while the corp treasury beside them survived, and
   * the account page (0.3.40) made that visible. A saved purse replaces the
   * starting one — after the race bonus, which is a fresh pilot's and must
   * not be paid again each morning. */
  const purse = loadSave().credits;
  if (Number.isFinite(purse) && purse !== null) ship.credits = purse;
  sim.walletSaved = Math.round(ship.credits);
  sim.walletAt = sim.wall;
  savePilotRecord();
  /* the sky keeps what the atmo works earned */
  applyTerraformSnapshot(sim.pendingTerraform?.snap, sim.pendingTerraform?.bonds);
  sim.pendingTerraform = null;
  const homeBody = bodyById(home);
  if (homeBody) seedOrbit(ship, homeBody, sim.time);
  touch.throttle = 0;
  ship.throttle = 0;

  const stats = homeBody?.stats;
  sim.notice = homeBody
    ? `${homeBody.name} is dead ahead — ${Math.round(stats.radiusKm)} km of it, ${stats.gEarth.toFixed(2)} g, and already pulling. Slider for thrust, drag the sky to point the nose, BRAKE to kill the drift.`
    : `${sys.name}.`;
  useGameStore.getState().setPhase("play");
  useGameStore.getState().patchHud({
    selected: home,
    timeScale: 1,
    notice: sim.notice,
    warping: false,
    systemName: sys.name,
    scanned: [...sim.scanned],
    beaconsGot: [...sim.beaconsGot],
    /* 0.3.40: the launch persist below used to write `terraform: {}` for this
     * sky (the store had none yet) and the atmo works' progress was gone until
     * the next scan or beacon wrote it back — two reloads in a row lost it. */
    terraform: terraformSnapshot(),
    terraBonds: [...(sim.terraBonds ?? [])],
    credits: Math.round(ship.credits),
    surveyComplete: sim.scanned.size >= surveyIds().length && sim.beaconsGot.size >= BEACONS.length,
  });
  useGameStore.getState().persist();
}

/** The hull comes up ready for the trade it was issued for: a miner's cutter
 * is armed, a salvager's tractor is live, a security hand's guns are warm. */
export function applyCareerDefaults(ship) {
  const cx = pilot.complexId;
  if (cx === "mining") ship.miningMode = "closest";
  if (cx === "salvage") ship.salvage = true;
  if (cx === "security") ship.turretMode = "enemies";
  return ship;
}

/** One row of the passive record every three sky-seconds; two hours' worth kept. */
const TELEMETRY_KEEP = 160;
function sampleTelemetry() {
  const T = sim.telemetry;
  const ship = sim.ship;
  T.at = sim.time;
  const push = (k, v) => { T[k].push(Number.isFinite(v) ? v : 0); if (T[k].length > TELEMETRY_KEEP) T[k].shift(); };
  push("credits", ship.credits);
  push("hull", ship.hull);
  push("heat", sim.heat * 100);
  push("cargo", cargoTotal(ship));
  push("charge", ship.charge);
  push("speed", speedOf(ship, sim.frameVel));
}

export function resetTelemetry() {
  sim.telemetry = { at: 0, credits: [], hull: [], heat: [], cargo: [], charge: [], speed: [] };
}

export function returnToMenu() {
  sim.phase = "menu";
  sim.warp.state = "idle";
  /* nothing keyed to this sky's ports may follow you out */
  releaseTractor();
  clearDockRequest();
  sim.approach = null;
  sim.lane = null;
  sim.dockOffset = null;
  sim.remotes.clear();
  resetTraffic();
  resetFlow();
  sim.clockSynced = false;
  sim.ship.vel.x = 0;
  sim.ship.vel.y = 0;
  sim.ship.vel.z = 0;
  useGameStore.getState().setPhase("menu");
  useGameStore.getState().patchHud({ joined: false, peers: [], mapOpen: false });
}

/** The hull the pilot's complex has issued them at their current rank. */
export function currentShipId() {
  if (sim.activeHullId && shipById(sim.activeHullId)) return sim.activeHullId; // a bought hull
  return DEFAULT_SHIP_ID; // the trainer everyone starts in
}

/** The hull the complex would sign over at the pilot's rank — for sale at the issue rate, not handed out. */
export function issuedHullId() {
  try {
    const line = issuedShips(pilot.complexId, rankStatus().letter);
    if (line.length) return line[line.length - 1].id;
  } catch { /* pre-creation */ }
  return null;
}

/* Flight multipliers from the active hull, refreshed when it changes. */
let _hullTune = hullTuneFor(null);
function syncHullTune(ship) {
  const id = currentShipId();
  /* a fresh makeShip() on a relaunch with the same hull id has no tune yet */
  if (_hullTune.id !== id || ship.hullTune !== _hullTune) {
    if (_hullTune.id !== id) _hullTune = hullTuneFor(shipById(id));
    ship.hullTune = _hullTune;
    ship.mods = null; // force syncMods to recompute the hold with the new hull factor
  }
  syncHullDefence(ship, id);
  return _hullTune;
}

/**
 * WHAT THIS HULL CAN TAKE (0.3.34).
 *
 * `hullMaxOf()` read `ship.hullMax ?? 100` and nothing in the game ever set
 * it, so every hull from a nine-tonne trainer to a seven-thousand-tonne
 * World Frame had the same hundred points and the same hundred of screen.
 * Tier bought thrust, cargo and reactor, and no survivability whatsoever.
 *
 * The pools are set from the flown hull here, beside the flight tune, because
 * this is already the one place that notices the hull changed. A hull refit
 * that raises the pool heals into the new headroom rather than leaving the
 * bar reading 300/920 the moment you sign for it; one that lowers it trims
 * the current value down so nothing sits over its own maximum.
 */
let _defenceFor = null;
function syncHullDefence(ship, id) {
  const modsKey = ship.mods?.hull ?? 1;
  const rk = resistKey();
  const key = `${id}:${modsKey}:${rk}`;
  if (_defenceFor === key && ship.hullMax) return;
  _defenceFor = key;
  const def = shipById(id);
  const hullWas = ship.hullMax || 100;
  const hullNow = Math.round(hullPoolFor(def) * modsKey);
  const shieldNow = shieldPoolFor(def);
  ship.hullMax = hullNow;
  ship.shieldMax = shieldNow;
  /* fitted resists are summed separately from the multiplicative mods bag —
   * see upgradeResists() for why they cannot live in it */
  ship.resists = resistsFor(def, { ...(ship.mods ?? {}), resist: upgradeResists() });
  if (hullNow > hullWas) ship.hull = Math.min(hullNow, ship.hull + (hullNow - hullWas));
  ship.hull = Math.min(ship.hull, hullNow);
  ship.shieldCharge = Math.min(ship.shieldCharge, shieldNow);
}

/* ---- lane discipline ------------------------------------------------------
 * Ports read your position against their lanes. In a lane-way you get the
 * way and the range to the clamps on the HUD. Fly a lane against its flow —
 * inbound down the exit corridor, outbound up the entry one — and port
 * control warns you, then docks your standing with the port's charter for
 * every ten seconds you keep it up. Docking through the entry lane earns a
 * little back. */
const WRONG_WAY_GRACE = 6;
function stepLaneDiscipline(dt) {
  const ship = sim.ship;
  /* control has the helm: whatever line it is flying you on is by definition the right one */
  if (tractor.active) { if (sim.lane) sim.lane.wrong = false; sim.wrongWayFor = 0; return; }
  sim.lane = null;
  if (ship.dockedAt || sim.phase !== "play") { sim.wrongWayFor = 0; return; }
  const near = nearestStation(ship.pos, 20000);
  if (!near) { sim.wrongWayFor = 0; return; }
  const st = near.station;
  const L = laneOf(st, ship.pos);
  if (!L) { sim.wrongWayFor = 0; return; }
  const f = stationLane(st);
  const rvx = ship.vel.x - st.vx, rvy = ship.vel.y - st.vy, rvz = ship.vel.z - st.vz;
  const along = rvx * f.dir.x + rvy * f.dir.y + rvz * f.dir.z;
  const speed = Math.hypot(rvx, rvy, rvz);
  const wrong = speed > 4 && Math.sign(along) === -laneFlow(L.which);
  sim.lane = { port: st.name, portId: st.id, which: L.which, way: L.way + 1, along: L.along, wrong, pulse: portPulse(st.id) };
  if (wrong) {
    sim.wrongWayFor = (sim.wrongWayFor ?? 0) + dt;
    if (sim.ui?.lanesDrawn && sim.wrongWayFor > WRONG_WAY_GRACE && sim.time - (sim.wrongWayWarnAt ?? -99) > 10) {
      sim.wrongWayWarnAt = sim.time;
      sim.toast = `${st.name} control: you are ${L.which === "exit" ? "inbound on the EXIT" : "outbound on the ENTRY"} corridor. Cross to the ${L.which === "exit" ? "entry" : "exit"} lane.`;
      sim.lastToastAt = sim.time;
      const co = corpOfStation(st);
      if (co) adjustStanding(co.id, -1, "lane violation");
      logEvent(`Lane violation at ${st.name}`, "port");
    }
  } else {
    sim.wrongWayFor = 0;
  }
}

/** Called on a successful dock: a clean entry-lane approach is remembered by the port. */
export function laneCredit(st) {
  if (sim.lane?.portId === st.id && sim.lane.which === "entry" && !sim.lane.wrong) {
    const co = corpOfStation(st);
    if (co) adjustStanding(co.id, 0.6, "clean lane approach");
    logEvent(`Clean entry-lane approach at ${st.name}`, "port");
    return true;
  }
  return false;
}

/* ---- multiplayer -------------------------------------------------------- */

export function applyRemoteState(from, data) {
  if (data.t !== "ship") return;
  let r = sim.remotes.get(from);
  if (!r) {
    r = {
      id: from,
      name: data.name ?? "Pilot",
      color: data.color ?? hashHue(from),
      x: data.x ?? 0, y: data.y ?? 0, z: data.z ?? 0,
      yaw: data.yaw ?? 0, pitch: data.pitch ?? 0, speed: data.speed ?? 0,
      tx: data.x ?? 0, ty: data.y ?? 0, tz: data.z ?? 0,
      tyaw: data.yaw ?? 0, tpitch: data.pitch ?? 0,
      last: performance.now(),
    };
    sim.remotes.set(from, r);
  }
  r.name = data.name ?? r.name;
  r.color = data.color ?? r.color;
  r.ship = data.ship ?? r.ship;
  r.tx = data.x ?? r.tx;
  r.ty = data.y ?? r.ty;
  r.tz = data.z ?? r.tz;
  r.tyaw = data.yaw ?? r.tyaw;
  r.tpitch = data.pitch ?? r.tpitch;
  r.speed = data.speed ?? r.speed;
  r.last = performance.now();
}

export function applyReliable(_from, data) {
  if (data.t === "beacon" && data.id) collectBeacon(data.id, false);
  if (data.t === "scan" && data.body && data.name) {
    sim.toast = `${data.name} surveyed ${bodyById(data.body)?.name ?? data.body}`;
    sim.lastToastAt = sim.time;
  }
  if (data.t === "sky" && data.event) applySkyEvent(data.event, false);
}

export function dropRemote(id) {
  sim.remotes.delete(id);
}

/* ---- progress ----------------------------------------------------------- */

function collectBeacon(id, local) {
  if (sim.beaconsGot.has(id)) return;
  sim.beaconsGot.add(id);
  const def = BEACONS.find((b) => b.id === id);
  sim.toast = `Recovered ${def?.name ?? "probe"}`;
  logEvent(`Recovered ${def?.name ?? "probe"} (+320 charge)`, "probe");
  work("dataOps", 3);
  work("electronics", 2);
  sim.lastToastAt = sim.time;
  if (local) {
    SHIP.collect();
    sim.trauma = Math.min(1, sim.trauma + 0.25);
    sim.ship.charge = Math.min(batteryCap(sim.ship), sim.ship.charge + 320);
    sim.send({ t: "beacon", id });
  }
  persistProgress();
}

/** The pilot record with what the sim owns: hulls bought, the active one, the cover on them. */
function savePilotRecord() {
  if (!pilot.character) return false;
  const cover = [...policies.values()].filter((p) => p.key.startsWith("player:")).map((p) => ({ key: p.key, tier: p.tier, value: p.value, at: p.at }));
  /* standing per sky: this sky's table over whatever other skies the record already holds */
  const standing = { ...(loadPilot()?.standing ?? {}) };
  if (sim.skySeed != null && corps.length) standing[String(sim.skySeed)] = Object.fromEntries(corps.map((c) => [c.id, Math.round(c.standing * 10) / 10]));
  return savePilot({ hulls: [...(sim.ownedHulls ?? [])], activeHull: sim.activeHullId ?? null, cover, standing });
}

/** Write progress and the wallet now — the tab is going away (main.js wires it). */
export function persistNow() {
  if (sim.phase !== "play" || !sim.ship) return false;
  persistProgress();
  return true;
}

function persistProgress() {
  useGameStore.getState().patchHud({
    scanned: [...sim.scanned],
    beaconsGot: [...sim.beaconsGot],
    terraform: terraformSnapshot(),
    terraBonds: [...(sim.terraBonds ?? [])],
    credits: Math.round(sim.ship?.credits ?? useGameStore.getState().credits),
    surveyComplete: sim.scanned.size >= surveyIds().length && sim.beaconsGot.size >= BEACONS.length,
  });
  useGameStore.getState().persist();
  savePilotRecord();
  sim.walletSaved = Math.round(sim.ship?.credits ?? 0);
  sim.walletAt = sim.wall;
  pilot.dirty = false;
}

/** The scanner reads what the nose is on: debris and belt rocks up close, worlds beyond. */
function tryAssay() {
  const ship = sim.ship;
  const f = forwardOf(ship.yaw, ship.pitch);
  const inCone = (x, y, z, d) => d > 1 && ((x - ship.pos.x) * f.x + (y - ship.pos.y) * f.y + (z - ship.pos.z) * f.z) / d > 0.35;
  const reach = 2600 * (ship.mods?.scan ?? 1);

  /* impact debris first — the question after a strike is always "what is in the chunks" */
  let bestChunk = null;
  for (const { c, d } of nearDebris(ship.pos, reach)) {
    if (!inCone(c.x, c.y, c.z, d)) continue;
    bestChunk = { c, d };
    break; // nearDebris is sorted
  }
  if (bestChunk) {
    const { c, d } = bestChunk;
    const mass = chunkMass(c);
    const worth = benchValue(c.good ?? "iron_ore");
    setNoticeAbout(`Debris assay — ${goodName(c.good ?? "iron_ore")}, ~${mass.toFixed(1)} units, ${worth.toFixed(1)} cr/u${ship.salvage ? ". Tractor is live." : ". SALVAGE to bring it aboard."}`, "DEBRIS");
    logEvent(`Assayed debris at ${Math.round(d)} u — ${goodName(c.good ?? "iron_ore")}, ${mass.toFixed(1)} units`, "survey");
    work("salvage", 1);
    work("geology", 0.5);
    SHIP.collect();
    return true;
  }

  /* then the field: the rock under the reticle, ore, ice, veins and all */
  let bestRock = null;
  let bestD = reach;
  for (const r of nearbyRocks(ship.pos, sim.time)) {
    const d = dist3(ship.pos, r);
    if (d < bestD && inCone(r.x, r.y, r.z, d)) {
      bestD = d;
      bestRock = { ...r, d };
    }
  }
  if (bestRock) {
    const r = bestRock;
    const worth = benchValue(r.ore) * (r.rich ? 1.6 : 1);
    const tag = r.rich ? "VEIN — rich cut" : r.ice ? "ice — bench it" : "common";
    setNoticeAbout(`Rock assay — ${r.oreName}, ${Math.round(r.r)} u body, ${tag}, ~${worth.toFixed(1)} cr/u mined${Math.round(r.worn * 100) ? `, ${Math.round(r.worn * 100)}% cut` : ""}.`, "ROCK");
    logEvent(`Assayed a ${r.oreName} rock at ${Math.round(r.d)} u${r.rich ? " — VEIN" : ""}`, "survey");
    work("geology", 1);
    NAV.contact();
    return true;
  }
  return false;
}

function tryScan() {
  const ship = sim.ship;
  /* close targets outrank the planet behind them */
  if (tryAssay()) return;
  let bestId = "";
  let best = Infinity;
  for (const b of BODIES) {
    bodyPosition(b.id, sim.time, _bp);
    const d = dist3(ship.pos, _bp);
    if (d < scanRadius(b) * (ship.mods?.scan ?? 1) && d < best) {
      best = d;
      bestId = b.id;
    }
  }
  if (!bestId) {
    sim.notice = "Nothing in survey range. Close the distance.";
    return;
  }
  const body = bodyById(bestId);
  const st = body.stats;
  /* a survey reports on what is in range; it does not re-aim the warp core.
   * (It only takes the nav target if nothing is locked at all.) */
  if (!sim.lock.id) setNavTarget(bestId);
  sim.pulse = 1;
  NAV.ping();
  const line = `${st.tierName} yield · ${st.gEarth.toFixed(2)} g · ${Math.round(st.radiusKm)} km radius · ${st.deposits.join(", ")}`;
  if (sim.scanned.has(bestId)) {
    sim.notice = `${body.name} already logged. ${line}`;
    return;
  }
  sim.scanned.add(bestId);
  sim.notice = `${body.name} surveyed. ${line}`;
  logEvent(`Surveyed ${body.name} — ${st.tierName}, ${st.gEarth.toFixed(2)} g`, "survey");
  work("geology", 3);
  work("research", 2);
  sim.toast = `Surveyed ${body.name} — ${st.tierName}`;
  sim.lastToastAt = sim.time;
  sim.trauma = Math.min(1, sim.trauma + 0.2);
  /* A survey pays out a core sample of whatever that world is made of. */
  const sampler = rngFromSeed(`${bestId}:sample`);
  /* Same source the readout uses: the archetype's deposit list, weighted to the top entry. */
  const deposits = body.arch?.ores?.length ? body.arch.ores : null;
  const hot = (body.thermal ?? 0) > 60;
  for (let i = 0; i < 3; i++) {
    const ore = deposits
      ? ORES.find((o) => o.id === deposits[Math.min(deposits.length - 1, Math.floor(sampler() * sampler() * deposits.length))]) ?? rollOre(body.kind, sampler)
      : rollOre(body.kind === "star" ? "gas" : body.kind, sampler);
    /* a hot crust: excavated metal pays a third more, volatiles are boiling away */
    const heatMul = !hot ? 1 : ore.id.endsWith("_ice") || ore.id === "tholins" ? 0.45 : 1.35;
    addCargo(sim.ship, ore.id, Math.max(1, Math.round(st.yieldRate * (0.2 + sampler() * 0.5) * heatMul)));
  }
  if (hot) logEvent(`${body.name} is impact-heated (${Math.round(bodyTempK(body))} K) — excavated metals rich, volatiles boiling off`, "survey");
  sim.send({ t: "scan", body: bestId, name: sim.callsign });
  persistProgress();
}

/* ---- warp core -----------------------------------------------------------
 *
 * A warp is not a button press, it is a commitment. The core has to spool for
 * six seconds under heavy load, and it will only hold that spool while two
 * things stay true: you are not sitting in anybody's gravity well, and the
 * straight line to the destination is clear. Break either one and the core
 * drops and has to cool.
 */

/**
 * How far out a world's well reaches for the core: where its pull drops under
 * WARP.wellG.
 *
 * The radii floor and ceiling are measured against what is LEFT of the body,
 * not what it used to be. A world you broke up is a rubble field with a core
 * in it: its `mu` is already cut, and holding the old radius in the floor was
 * what kept a dead planet blocking warp for four of its original radii in
 * every direction. `remnantRadius` is the same number the canopy draws it at.
 */
/**
 * Where a world stops holding the warp core.
 *
 * This used to be geometry with gravity as an afterthought: a flat four-radii
 * floor, whatever the body weighed. Measured across a generated sky, that
 * floor — not the pull — was what decided the edge for every moon in the
 * system, and it put the boundary where the HUD's own G readout showed 0.01.
 * Being refused a jump by a well you cannot see on the instruments is the
 * whole complaint, and it was correct.
 *
 * So gravity governs now, and the geometric floor only stops you jumping out
 * of the atmosphere. The invariant that matters: the block agrees with the
 * number on the HUD. If the readout rounds to 0.00 G, nothing holds you.
 */
export function wellEdge(body) {
  if (!body || body.kind === "star") return 0;
  const r = remnantRadius(body);
  const byGravity = Math.sqrt((body.mu ?? 0) / WARP.wellG);
  return Math.max(r * WARP.wellClear, Math.min(r * WARP.wellFar, byGravity));
}

/** The pull here, in the units the HUD prints. One source of truth. */
export function wellG(body, dist) {
  if (!body || body.kind === "star" || !(dist > 0)) return 0;
  return (body.mu ?? 0) / (dist * dist) / 25;
}

export const WARP = {
  wellG: 0.5,        // pull (u/s²; the HUD's G readout ×25) under which a world no longer holds the core
  wellClear: 1.35,   // and never inside this many radii — clear of the air and the rings, no further
  wellFar: 8,        // and never beyond this many radii, however heavy (a giant's well is still a ways out)
  wellFloorG: 0.005, // if the HUD would round the pull to 0.00 G, nothing is holding you. Ever.
  spool: 6,          // seconds to charge
  draw: 95,          // kW while spooling
  cool: 8,           // seconds of lockout after a run
  minCharge: 300,    // refuse to start below this
  losMargin: 1.4,    // corridor is this many body radii wide
  starClear: 6,      // star radii you must be beyond
};

function segmentMiss(px, py, pz, ax, ay, az, bx, by, bz) {
  const dx = bx - ax;
  const dy = by - ay;
  const dz = bz - az;
  const len2 = dx * dx + dy * dy + dz * dz;
  let t = len2 > 0 ? ((px - ax) * dx + (py - ay) * dy + (pz - az) * dz) / len2 : 0;
  t = Math.max(0, Math.min(1, t));
  return Math.hypot(px - (ax + dx * t), py - (ay + dy * t), pz - (az + dz * t));
}

const _dest = { x: 0, y: 0, z: 0 };
const _obs = { x: 0, y: 0, z: 0 };

/**
 * Anything the core will jump to: a world or a port. One shape —
 * { id, name, kind, radius, arriveR, pos(out), vel(out), body? } — so the
 * plot, the gates and the run never care which it was.
 */
export function warpNodeById(id) {
  const b = bodyById(id);
  if (b) {
    return {
      id, name: b.name, kind: "body", radius: b.radius, arriveR: b.radius * 6, body: b,
      pos: (out) => bodyPosition(b.id, sim.time, out ?? { x: 0, y: 0, z: 0 }),
      vel: (out) => bodyVelocity(b.id, sim.time, out ?? { x: 0, y: 0, z: 0 }),
    };
  }
  const st = stationById(id);
  if (st) {
    return {
      id, name: st.name, kind: "station", radius: Math.max(st.radius, 60), arriveR: 2600, body: null,
      pos: (out) => { const o = out ?? { x: 0, y: 0, z: 0 }; o.x = st.x; o.y = st.y; o.z = st.z; return o; },
      vel: (out) => { const o = out ?? { x: 0, y: 0, z: 0 }; o.x = st.vx ?? 0; o.y = st.vy ?? 0; o.z = st.vz ?? 0; return o; },
    };
  }
  /* a saved location is a warp node too: the core jumps to a point in space —
   * a belt band, a probe drop, a spot you marked off the chart */
  const wp = sim.waypoints.find((w) => w.id === id);
  if (wp) {
    if (wp.body) return warpNodeById(wp.body);
    return {
      id, name: wp.name, kind: "point", radius: 0, arriveR: POINT_ARRIVE_R, body: null, point: wp,
      pos: (out) => waypointPosition(wp, out ?? { x: 0, y: 0, z: 0 }),
      vel: (out) => { const o = out ?? { x: 0, y: 0, z: 0 }; o.x = 0; o.y = 0; o.z = 0; return o; },
    };
  }
  return null;
}

/** How close a point jump drops you (u). Inside a belt that is one cell of rock. */
export const POINT_ARRIVE_R = 1500;

/** Where a warp to a node would put you: standoff, sunward side. */
export function warpDestination(target, out) {
  const o = out ?? { x: 0, y: 0, z: 0 };
  const node = target.pos ? target : warpNodeById(target.id);
  node.pos(_bp);
  if (node.kind === "point") {
    /* a point IS the destination — the arrival clearance nudge keeps you out of any rock sitting on it */
    o.x = _bp.x; o.y = _bp.y; o.z = _bp.z;
    return o;
  }
  const offset = node.kind === "station" ? node.radius * 6 + 900 : node.radius * 3.1 + 500;
  o.x = _bp.x + offset;
  o.y = _bp.y + node.radius * 0.4;
  o.z = _bp.z;
  return o;
}

/** First body whose bulk sits in the corridor, or null if the lane is clear. */
export function losBlocker(from, to, ignoreId) {
  for (const b of BODIES) {
    if (b.id === ignoreId) continue;
    bodyPosition(b.id, sim.time, _obs);
    const miss = segmentMiss(_obs.x, _obs.y, _obs.z, from.x, from.y, from.z, to.x, to.y, to.z);
    if (miss < b.radius * WARP.losMargin) return b;
  }
  return null;
}

/**
 * Why the core will not engage right now, or "" if it will. Evaluated every
 * tick so the dash reads the truth and a spool aborts the moment it stops
 * being true.
 */
export function warpBlock(targetId) {
  const ship = sim.ship;
  const id = targetId ?? sim.selected;
  if (!id) {
    /* say WHY there is no target when the lock is on something you cannot
     * jump to — a rock, a wreck, another ship */
    if (sim.lock.id && !warpNodeById(sim.lock.id)) return "LOCK NOT A WARP NODE";
    return "NO TARGET";
  }
  const body = warpNodeById(id);
  if (!body) return "NO TARGET";
  if (ship.dockedAt) return "CLAMPS ON";
  if (!ship.engines || !ship.powered.engines) return "MAINS COLD";
  if (sim.warp.cool > 0) return `CORE COOLING ${Math.ceil(sim.warp.cool)}s`;
  if (ship.charge < WARP.minCharge) return "CHARGE LOW";

  /* Warp geometry will not hold inside a well — while the well still pulls. A world's well ends
   * where its draw falls under WARP.wellG, or WARP.wellClear radii out, whichever is farther;
   * beyond that the world may still be the strongest pull around and it does not matter. */
  const dom = sim.dominant;
  if (dom && dom.kind !== "star" && sim.domDist < wellEdge(dom)) {
    /* The readout is the authority. A world that is not registering on the
     * instruments does not get to refuse the jump, whatever the geometry
     * says — that mismatch is what made a well feel like it went on forever. */
    const g = wellG(dom, sim.domDist);
    if (g >= WARP.wellFloorG) {
      const out = Math.max(1, Math.round((wellEdge(dom) - sim.domDist) / 100));
      return `${dom.name.toUpperCase()} WELL · ${g.toFixed(2)}G · ${out} km OUT`;
    }
  }
  const hb = holeWarpBlock(ship.pos);
  if (hb) return hb;
  const star = starBody();
  if (star && !star.collapsed) {
    const dStar = Math.hypot(ship.pos.x, ship.pos.y, ship.pos.z);
    if (dStar < star.radius * WARP.starClear) return `${star.name.toUpperCase()} WELL`;
  }

  warpDestination(body, _dest);
  if (dist3(ship.pos, _dest) < body.arriveR) return "ALREADY THERE";
  const blocker = losBlocker(ship.pos, _dest, body.body?.id ?? null);
  if (blocker) return `${blocker.name.toUpperCase()} IN LANE`;
  return "";
}

export function warpStatus() {
  const w = sim.warp;
  const body = sim.selected ? warpNodeById(sim.selected) : null;
  return {
    state: w.state,
    progress: w.state === "spool" ? w.t / spoolTime() : w.state === "run" ? w.t / w.dur : 0,
    block: w.block,
    cool: w.cool,
    target: body?.name ?? null,
  };
}

/** Seconds the core needs to spool, through the pilot's drive modifier. */
export function spoolTime() {
  return WARP.spool * (sim.ship.mods?.warp ?? 1);
}

/* ---- route plotting ------------------------------------------------------
 * The nav computer only plots what the nose is looking at: point the ship at
 * the warp target and the route resolves — distance, ETA, and everything the
 * corridor crosses on the way (bodies, belts, rock tracks, port traffic,
 * projected impact points). No alignment, no plot; no plot, no spool.       */

export const ALIGN_DEG = 10;

/* A plotted hazard is a priced risk: cross it in warp and the core may drop
 * you out right there. Traffic never drops you — it fines your standing. */
export const DROPOUT_ODDS = { belt: 0.35, rock: 0.55, graze: 0.9, traffic: 0, impact: 1 };

let _routeCache = { key: "", route: null };
const _rp = { x: 0, y: 0, z: 0 };

/** Angle (deg) between the nose and the lane to `dest`. */
export function alignmentTo(dest) {
  const ship = sim.ship;
  const dx = dest.x - ship.pos.x, dy = dest.y - ship.pos.y, dz = dest.z - ship.pos.z;
  const d = Math.hypot(dx, dy, dz) || 1;
  const f = forwardOf(ship.yaw, ship.pitch);
  return (Math.acos(clamp((dx * f.x + dy * f.y + dz * f.z) / d, -1, 1)) * 180) / Math.PI;
}

/**
 * Plot the corridor to a warp target. Cached ~4 Hz per target. Returns
 * { target, dist, eta, align, aligned, hazards[], impact } — `impact` is the
 * first fatal obstruction (a body dead in the lane), hazards are everything
 * else worth a captain's eye, each with `at` (0..1 along the lane).
 */
export function plotRoute(targetId = sim.selected) {
  const body = warpNodeById(targetId);
  if (!body) return null;
  const key = `${targetId}:${Math.floor(sim.time * 4)}:${Math.round(sim.ship.yaw * 100)}:${Math.round(sim.ship.pitch * 100)}`;
  if (_routeCache.key === key) return _routeCache.route;
  const ship = sim.ship;
  const dest = warpDestination(body);
  const dist = dist3(ship.pos, dest);
  const dur = clamp(dist / 55000, 3, 45);
  const align = alignmentTo(dest);
  const hazards = [];
  let impact = null;

  /* bodies in the corridor */
  for (const b of BODIES) {
    if (b.id === body.body?.id) continue;
    bodyPosition(b.id, sim.time, _rp);
    const miss = segmentMiss(_rp.x, _rp.y, _rp.z, ship.pos.x, ship.pos.y, ship.pos.z, dest.x, dest.y, dest.z);
    if (miss < b.radius * WARP.losMargin) {
      const at = clamp(dist3(ship.pos, _rp) / Math.max(1, dist), 0, 1);
      const fatal = miss < b.radius * 1.05;
      const h = { kind: fatal ? "impact" : "graze", name: b.name, at, miss: Math.round(miss), note: fatal ? `IMPACT POINT — ${b.name} dead in the lane` : `${b.name} well graze (${Math.round(miss)} u)` };
      if (fatal && !impact) impact = h;
      hazards.push(h);
    }
  }
  /* belt crossings: sample the lane against each annulus */
  for (const [belt, label] of [[currentSystem.belt, "BELT"], [currentSystem.outerBelt, "OUTER BELT"]]) {
    if (!belt) continue;
    let enter = -1, exit = -1;
    for (let i = 0; i <= 40; i++) {
      const t = i / 40;
      const x = ship.pos.x + (dest.x - ship.pos.x) * t;
      const y = ship.pos.y + (dest.y - ship.pos.y) * t;
      const z = ship.pos.z + (dest.z - ship.pos.z) * t;
      const rad = Math.hypot(x, z);
      const inside = rad > belt.inner && rad < belt.outer && Math.abs(y) < 4200;
      if (inside && enter < 0) enter = t;
      if (inside) exit = t;
    }
    if (enter >= 0) hazards.push({ kind: "belt", name: label, at: enter, note: `${label} crossing ${Math.round(enter * 100)}–${Math.round(exit * 100)}% — dropout risks rock` });
  }
  /* impactor tracks near the lane */
  for (const m of impactors) {
    const miss = segmentMiss(m.x, m.y, m.z, ship.pos.x, ship.pos.y, ship.pos.z, dest.x, dest.y, dest.z);
    if (miss < 2600) hazards.push({ kind: "rock", name: m.name, at: clamp(dist3(ship.pos, m) / Math.max(1, dist), 0, 1), note: `${m.name} track crosses the lane (${Math.round(miss)} u)` });
  }
  /* collapsed stars and transits: a warp covers 900–1800 u a tick, so a lane
   * through a hole lands a tick inside the disk. 0.3 plotted straight through them. */
  for (const h of holes) {
    const miss = segmentMiss(h.x, h.y, h.z, ship.pos.x, ship.pos.y, ship.pos.z, dest.x, dest.y, dest.z);
    const R = holeRadii(h, {});
    if (miss >= R.danger) continue;
    const fatal = miss < R.roche;
    const hz = { kind: fatal ? "impact" : "graze", name: h.name, at: clamp(dist3(ship.pos, h) / Math.max(1, dist), 0, 1), miss: Math.round(miss), note: fatal ? `${h.name} — the lane crosses its disk` : `${h.name} tidal graze (${Math.round(miss)} u)` };
    if (fatal && !impact) impact = hz;
    hazards.push(hz);
  }
  /* port traffic — the destination port is not its own hazard */
  for (const st of stations) {
    if (st.id === body.id) continue;
    const miss = segmentMiss(st.x, st.y, st.z, ship.pos.x, ship.pos.y, ship.pos.z, dest.x, dest.y, dest.z);
    if (miss < 3200) hazards.push({ kind: "traffic", name: st.name, at: clamp(dist3(ship.pos, st) / Math.max(1, dist), 0, 1), note: `${st.name} traffic sphere (${Math.round(miss)} u)` });
  }
  hazards.sort((a, b) => a.at - b.at);

  const route = {
    target: body.name,
    targetId: body.id,
    dist: Math.round(dist),
    eta: 0, // filled below: spool + run
    dur: Math.round(dur * 10) / 10,
    align: Math.round(align),
    aligned: align <= ALIGN_DEG,
    hazards: hazards.slice(0, 5),
    impact,
  };
  route.eta = Math.round((spoolTime() + dur) * 10) / 10;
  route.kind = body.kind;
  _routeCache = { key, route };
  return route;
}

/** Tap once to spool, tap again to stand it down. */
export function toggleWarp() {
  const w = sim.warp;
  if (w.state === "spool") {
    w.state = "idle";
    NAV.dropout();
    w.t = 0;
    sim.notice = "Warp core stood down.";
    return;
  }
  if (w.state !== "idle") return;
  const block = warpBlock();
  if (block) {
    sim.notice = `Warp unavailable — ${block.toLowerCase()}.`;
    WARN.deny();
    return;
  }
  /* the nav computer wants the nose on the lane before it commits the core */
  const route = plotRoute(sim.selected);
  if (route && !route.aligned) {
    sim.notice = `Come about — ${route.align}° off the lane to ${route.target}. Point the nose to plot the route.`;
    WARN.caution();
    return;
  }
  if (route?.impact) {
    sim.notice = `Route refused — ${route.impact.note.toLowerCase()}.`;
    WARN.deny();
    return;
  }
  if (route?.hazards?.length) {
    logEvent(`Route to ${route.target}: ${route.hazards.map((h) => h.note).join("; ")}`, "nav");
  }
  w.hazards = route?.hazards?.map((h) => ({ ...h, resolved: false })) ?? [];
  w.state = "spool";
  w.t = 0;
  w.targetId = sim.selected;
  const node = warpNodeById(sim.selected);
  sim.notice = `Spooling the warp core for ${node?.name ?? "target"}. Hold the lane clear.`;
  logEvent(`Warp spool started — ${node?.name ?? "target"}`, "nav");
}

function abortSpool(reason) {
  const w = sim.warp;
  w.state = "idle";
  w.t = 0;
  w.cool = 2.5;
  sim.notice = `Warp aborted — ${reason.toLowerCase()}.`;
  logEvent(`Warp aborted: ${reason}`, "nav");
  WARN.caution();
}

/**
 * The subset of gates that can break a spool.
 *
 * This one had earlier well fix applied to `warpBlock` and NOT to itself, and
 * the two disagreeing is worse than either being wrong. The old line here was
 * "any non-star dominant body, at any range, aborts" — so a moon a million
 * units away reading 0.00 G on the instruments passed `warpBlock`, let the
 * core spool, and then killed the spool on the first tick. Cool 2.5 s, align,
 * spool, abort, forever: the hull sits there cycling and the player watches an
 * autopilot that will not jump and cannot say why. Both gates now answer to
 * the same invariant — if the readout rounds to 0.00 G, nothing is holding you.
 */
function warpBlockDuringSpool() {
  const ship = sim.ship;
  const body = warpNodeById(sim.warp.targetId);
  if (!body) return "NO TARGET";
  if (!ship.engines || !ship.powered.engines) return "MAINS COLD";
  if (ship.charge <= 1) return "BATTERY FLAT";
  const dom = sim.dominant;
  if (dom && dom.kind !== "star" && sim.domDist < wellEdge(dom) && wellG(dom, sim.domDist) >= WARP.wellFloorG) {
    return `${dom.name.toUpperCase()} WELL`;
  }
  const hb = holeWarpBlock(ship.pos);
  if (hb) return hb;
  const star = starBody();
  if (star && !star.collapsed && Math.hypot(ship.pos.x, ship.pos.y, ship.pos.z) < star.radius * WARP.starClear) {
    return `${star.name.toUpperCase()} WELL`;
  }
  warpDestination(body, _dest);
  const blocker = losBlocker(ship.pos, _dest, body.body?.id ?? null);
  if (blocker) return `${blocker.name.toUpperCase()} IN LANE`;
  return "";
}

/** The core lets go mid-run: dumped at the crossing with the hazard for company. */
function warpDropout(h, u) {
  const w = sim.warp;
  const ship = sim.ship;
  w.state = "idle";
  w.t = 0;
  w.cool = WARP.cool * 1.5;
  /* carry a chunk of lane speed into realspace — a dropout is not a parking job */
  const d = dist3(w.from, w.to) || 1;
  const k = 140 / d;
  ship.vel.x = (w.to.x - w.from.x) * k;
  ship.vel.y = (w.to.y - w.from.y) * k;
  ship.vel.z = (w.to.z - w.from.z) * k;
  sim.trauma = Math.min(1, sim.trauma + 0.7 * (ship.mods?.gTol ?? 1));
  applyDamage(ship, h.kind === "rock" ? 22 : 10, null, sim.time, "kinetic");   // a collision is mass
  w.dropped = { kind: h.kind, name: h.name ?? h.kind, at: sim.time, frac: u };
  const msg = `CORE DROPOUT at ${Math.round(u * 100)}% — ${h.note}`;
  sim.notice = msg;
  sim.toast = h.kind === "belt" ? "Core dropout — you are in the rocks" : "Core dropout";
  sim.lastToastAt = sim.time;
  logEvent(msg, "nav");
  WARN.caution();
  work("navigation", 2); // surviving one teaches you something
}

function engageWarp() {
  const w = sim.warp;
  const ship = sim.ship;
  const body = warpNodeById(w.targetId);
  if (!body) {
    abortSpool("NO TARGET");
    return;
  }
  const to = warpDestination(body);
  body.pos(_bp);
  const dx = _bp.x - to.x;
  const dy = _bp.y - to.y;
  const dz = _bp.z - to.z;
  const horiz = Math.hypot(dx, dz) || 1;
  w.dropped = null;
  w.state = "run";
  w.t = 0;
  NAV.jump();
  /* a run is a voyage: ~55k u/s in the tunnel, up to 45 s across the system */
  w.dur = clamp(dist3(ship.pos, to) / 55000, 3, 45);
  w.from = { ...ship.pos };
  w.to = to;
  w.fromYaw = ship.yaw;
  w.fromPitch = ship.pitch;
  w.toYaw = Math.atan2(-dx / horiz, -dz / horiz);
  w.toPitch = clamp(Math.atan2(dy, horiz), -0.4, 0.4);
  NAV.spool(spoolTime());
  sim.trauma = Math.min(1, sim.trauma + 0.4);
  sim.notice = `Warp to ${body.name}.`;
}

/**
 * A jump must never materialise you inside a rock. Walk the ship out of any
 * belt rock it overlaps (with a margin) — returns true if it had to move.
 */
export function clearArrival(ship) {
  if (!inBelt(ship.pos)) return false;
  let moved = false;
  for (let pass = 0; pass < 6; pass++) {
    let hit = null;
    let hitD = 0;
    for (const r of nearbyRocks(ship.pos, sim.time, 1)) {
      const d = Math.hypot(ship.pos.x - r.x, ship.pos.y - r.y, ship.pos.z - r.z);
      if (d < r.r + ARRIVE_CLEAR) { hit = r; hitD = d; break; }
    }
    if (!hit) break;
    const d = Math.max(hitD, 1);
    const want = hit.r + ARRIVE_CLEAR + 40;
    const nx = hitD > 1 ? (ship.pos.x - hit.x) / d : 0;
    const ny = hitD > 1 ? (ship.pos.y - hit.y) / d : 1;
    const nz = hitD > 1 ? (ship.pos.z - hit.z) / d : 0;
    ship.pos.x = hit.x + nx * want;
    ship.pos.y = hit.y + ny * want;
    ship.pos.z = hit.z + nz * want;
    moved = true;
  }
  return moved;
}
const ARRIVE_CLEAR = 260;
let blockAt = -1, blockFor = null, blockCool = false, blockDom = null;   // when/for what sim.warp.block was last read
const _blockAtPos = { x: 0, y: 0, z: 0 };                 // …and from where: a jump in position re-reads at once

export function stepWarp(dt) {
  const w = sim.warp;
  const ship = sim.ship;

  if (w.cool > 0) w.cool = Math.max(0, w.cool - dt);
  /* the readout, not the gate: the jump itself re-checks live. Five times a second is plenty
   * for a line of text, and warpBlock walks every body for a blocker. */
  if (w.state !== "idle") { w.block = ""; blockAt = -1; }
  else if (sim.wall - blockAt >= 0.2 || sim.selected !== blockFor || (w.cool > 0) !== blockCool || sim.dominant !== blockDom || dist3(ship.pos, _blockAtPos) > 1000) {
    w.block = warpBlock();
    blockAt = sim.wall; blockFor = sim.selected; blockCool = w.cool > 0; blockDom = sim.dominant;
    _blockAtPos.x = ship.pos.x; _blockAtPos.y = ship.pos.y; _blockAtPos.z = ship.pos.z;
  }

  if (w.state === "spool") {
    /* Re-check the gates against the live target, not the one you tapped. */
    if (sim.selected !== w.targetId) {
      abortSpool("TARGET CHANGED");
      return;
    }
    const why = warpBlockDuringSpool();
    if (why) {
      abortSpool(why);
      return;
    }
    w.t += dt;
    if (w.t >= spoolTime()) engageWarp();
    return;
  }

  if (w.state === "run") {
    w.t += dt;
    const u = easeInOut(clamp(w.t / w.dur, 0, 1));
    ship.pos.x = lerp(w.from.x, w.to.x, u);
    ship.pos.y = lerp(w.from.y, w.to.y, u);
    ship.pos.z = lerp(w.from.z, w.to.z, u);
    ship.yaw = w.fromYaw + wrapPi(w.toYaw - w.fromYaw) * u;
    ship.pitch = lerp(w.fromPitch, w.toPitch, u);
    ship.aimYaw = ship.yaw;
    ship.aimPitch = ship.pitch;
    /* every hazard the plot accepted gets its roll as the lane crosses it */
    for (const h of w.hazards ?? []) {
      if (h.resolved || u < h.at) continue;
      h.resolved = true;
      if (h.kind === "traffic") {
        const st = stations.find((x) => x.name === h.name);
        const co = st ? corpOfStation(st) : null;
        if (co) adjustStanding(co.id, -2, "cut the traffic sphere in warp");
        logEvent(`Cut ${h.name}'s traffic sphere in warp — control is filing a complaint`, "nav");
        continue;
      }
      const roll = sim.dropoutRoll ?? Math.random(); // sim.dropoutRoll: deterministic hook for tests
      /* hazard baffles do not change the lane, they change the odds of the
       * core letting go in it */
      if (roll < (DROPOUT_ODDS[h.kind] ?? 0) * upgradeFx("dropout", 1)) {
        warpDropout(h, u);
        return;
      }
    }
    if (u >= 1) {
      w.state = "idle";
      w.cool = WARP.cool;
      NAV.arrive();
      const node = warpNodeById(w.targetId);
      if (node) {
        /* Drop out matched to the target's own motion so you are not simply
         * dumped into its gravity well at rest. */
        node.vel(ship.vel);
        const moved = clearArrival(ship);
        if (node.kind === "point") {
          const rocks = inBelt(ship.pos) ? nearbyRocks(ship.pos, sim.time, 1).length : 0;
          setNoticeAbout(`${node.name}. ${rocks ? `${rocks} rocks on the board — Y for a mining mode, P-LOCK a rock.` : "Open space. Nothing on the board."}${moved ? " Dropped clear of a rock." : ""}`, node.name);
          if (node.point?.transient) removeWaypoint(node.point.id);
        } else {
          setNoticeAbout(node.body
            ? `${node.name}. ${node.body.stats.tierName} yield, ${node.body.stats.gEarth.toFixed(2)} g. V to survey.`
            : `${node.name} on the bow. Close and slow below 12 u/s to take the clamps.`, node.name);
        }
        logEvent(`Warp complete — ${node.name}`, "nav");
      }
    }
  }
}

/* ---- collisions --------------------------------------------------------- */

/**
 * A surface contact.
 *
 * `n` points OUT of the thing, `surfaceDist` is how far in we are. The subtle
 * part is the sign of the radial velocity: negative means we are still driving
 * into the surface and the bounce applies; positive means we are on our way
 * out, and killing the velocity of a hull that is already leaving is how a
 * ship gets welded to a rock. Belt rocks overlap freely — ten to a cell, radii
 * up to 700 u — so a hull wedged between two of them used to take the ×0.55
 * damping twice a frame, which is a 97% velocity cut every ten frames. No
 * amount of thrust escapes that. It read in play as "the collision avoidance
 * has me stuck inside the belt", and it was really the collision RESPONSE.
 */
function impact(ship, nx, ny, nz, surfaceDist, name) {
  const fv = sim.frameVel;
  const radial = ship.vel.x * nx + ship.vel.y * ny + ship.vel.z * nz;
  /* Only the closing speed relative to the surface hurts. */
  const speed = Math.abs(radial - (fv.x * nx + fv.y * ny + fv.z * nz));
  ship.pos.x += nx * surfaceDist;
  ship.pos.y += ny * surfaceDist;
  ship.pos.z += nz * surfaceDist;
  if (radial < 0) {
    ship.vel.x -= nx * radial * 1.15;
    ship.vel.y -= ny * radial * 1.15;
    ship.vel.z -= nz * radial * 1.15;
    ship.vel.x *= 0.55;
    ship.vel.y *= 0.55;
    ship.vel.z *= 0.55;
  }
  if (speed > 22) {
    applyDamage(ship, (speed - 22) * 0.32, null, sim.time, "kinetic");           // scraping a surface
    sim.trauma = Math.min(1, sim.trauma + Math.min(0.9, speed / 140) * (ship.mods?.gTol ?? 1));
    if (sim.time - sim.lastToastAt > 1.4) {
      SHIP.impact(0.8);
      sim.toast = `Impact — ${name}`;
      sim.lastToastAt = sim.time;
      logEvent(`Impact with ${name} at ${Math.round(speed)} u/s`, "damage");
    }
  } else if (sim.time - sim.lastToastAt > 2.5) {
    sim.toast = `Surface contact — ${name}`;
    sim.lastToastAt = sim.time;
  }
}

function stepCollisions(ship, dt) {
  const star = starBody();
  sim.heat = 0;
  for (const b of BODIES) {
    bodyPosition(b.id, sim.time, _bp);
    const dx = ship.pos.x - _bp.x;
    const dy = ship.pos.y - _bp.y;
    const dz = ship.pos.z - _bp.z;
    const d = Math.hypot(dx, dy, dz) || 1;
    const skin = b.radius + SURFACE_PAD;
    if (b.kind === "star" && b.collapsed) {
      /* no photosphere to hit and no surface to burn: the remnant's own zones
       * (holes.js, holeOnShip) are what hurt now */
    } else if (b.kind === "star") {
      const glow = b.radius * 2.4;
      if (d < glow) {
        const t = 1 - d / glow;
        sim.heat = Math.max(sim.heat, t);
        applyDamage(ship, t * t * 26 * dt * (ship.mods?.heat ?? 1), null, sim.time, "thermal");
      }
    } else if ((b.thermal ?? 0) > 60 && d < b.radius * 2.4) {
      /* a fresh impact site radiates — a heated world is briefly a small sun */
      const t = (1 - d / (b.radius * 2.4)) * Math.min(1, b.thermal / 500);
      sim.heat = Math.max(sim.heat, t * 0.8);
      applyDamage(ship, t * t * 14 * dt * (ship.mods?.heat ?? 1), null, sim.time, "thermal");
    } else if (b.atmo && d < b.radius * 1.14) {
      const rel = speedOf(ship, sim.frameVel);
      if (rel > 60) {
        sim.heat = Math.max(sim.heat, 0.5);
        applyDamage(ship, (rel - 60) * 0.012 * dt * (ship.mods?.heat ?? 1), null, sim.time, "thermal");
      }
    }
    if (d < skin && !(b.kind === "star" && b.collapsed)) impact(ship, dx / d, dy / d, dz / d, skin - d, b.name);
  }
  if (star && !star.collapsed) {
    /* absolute floor so nothing tunnels through the photosphere */
    const d = Math.hypot(ship.pos.x, ship.pos.y, ship.pos.z);
    const minR = star.radius * 1.05;
    if (d < minR) {
      const n = minR / Math.max(d, 1);
      ship.pos.x *= n;
      ship.pos.y *= n;
      ship.pos.z *= n;
    }
  }
  if (inBelt(ship.pos)) {
    /* ONE contact a frame — the deepest. Resolving every overlapping rock in
     * turn compounds the restitution damping and pushes the hull out of one
     * rock straight into the next, which is the belt trap described above. */
    const rocks = nearbyRocks(ship.pos, sim.time, 1);
    let deep = 0, nx = 0, ny = 0, nz = 0;
    for (const r of rocks) {
      const dx = ship.pos.x - r.x;
      const dy = ship.pos.y - r.y;
      const dz = ship.pos.z - r.z;
      const d = Math.hypot(dx, dy, dz) || 1;
      const pen = r.r + SURFACE_PAD - d;
      if (pen > deep) { deep = pen; nx = dx / d; ny = dy / d; nz = dz / d; }
    }
    if (deep > 0) impact(ship, nx, ny, nz, deep, "asteroid");
  }
}

/* ---- targeting -----------------------------------------------------------
 *
 * Pointer lock. Put the reticle on something and the signature builds; look
 * away and it decays. A big close target resolves in a second or two, a small
 * far one takes real patience. Once it holds, MATCH can fly the lock's own
 * frame so the two of you hang motionless together.
 */

const LOCK_CONE = 0.32;        // rad — how close to the nose it has to be
const LOCK_BREAK = 1.05;       // rad — look this far off and a hold breaks
const _lp = { x: 0, y: 0, z: 0 };
const _lv = { x: 0, y: 0, z: 0 };

/** Everything the targeting computer can see, with a signature strength. */
export function lockCandidates() {
  const out = [];
  for (const b of BODIES) {
    bodyPosition(b.id, sim.time, _lp);
    out.push({ kind: "body", id: b.id, name: b.name, x: _lp.x, y: _lp.y, z: _lp.z, sig: b.radius });
  }
  for (const c of contacts) {
    out.push({ kind: "contact", id: c.id, name: c.name, x: c.x, y: c.y, z: c.z, sig: 14 });
  }
  for (const m of impactors) {
    out.push({ kind: "rock", id: m.id, name: m.name, x: m.x, y: m.y, z: m.z, sig: m.r });
  }
  for (const st of stations) {
    out.push({ kind: "station", id: st.id, name: st.name, x: st.x, y: st.y, z: st.z, sig: st.radius * 3 });
  }
  /* the small stuff a miner actually wants: belt rocks in the cells around
   * you and impact debris within cutter reach × a few — both were invisible
   * to the targeting computer before, which is why P-LOCK "found nothing" */
  const ship = sim.ship;
  for (const r of nearbyRocks(ship.pos, sim.time, 1)) {
    out.push({ kind: "asteroid", id: r.key, name: `${r.oreName ?? "Rock"} ${r.ice ? "ice " : ""}rock`, x: r.x, y: r.y, z: r.z, sig: r.r });
  }
  for (const { c } of nearDebris(ship.pos, LOCK_DEBRIS_RANGE)) {
    out.push({ kind: "debris", id: c.id, name: `Debris (${goodName(c.good ?? "iron_ore")})`, x: c.x, y: c.y, z: c.z, sig: Math.max(6, c.r) });
  }
  return out;
}

const LOCK_DEBRIS_RANGE = 9000;

/** A candidate's signature strength without rebuilding the whole list. */
function candidateSig(kind, id) {
  if (kind === "body") return bodyById(id)?.radius ?? 12;
  if (kind === "station") return (stations.find((s) => s.id === id)?.radius ?? 4) * 3;
  if (kind === "rock") return impactors.find((m) => m.id === id)?.r ?? 12;
  if (kind === "asteroid") return nearbyRocks(sim.ship.pos, sim.time, 1).find((r) => r.key === id)?.r ?? 12;
  if (kind === "debris") return Math.max(6, chunks.find((c) => c.id === id)?.r ?? 6);
  if (kind === "waypoint") return 400; // a saved fix resolves instantly — it is our own number
  return 14;
}

/** Live position of whatever is locked, or null if it is gone. */
export function targetPosition(kind, id, out) {
  const o = out ?? { x: 0, y: 0, z: 0 };
  if (kind === "body") {
    if (!bodyById(id)) return null;
    return bodyPosition(id, sim.time, o);
  }
  if (kind === "waypoint") {
    const wp = sim.waypoints.find((w) => w.id === id);
    return wp ? waypointPosition(wp, o) : null;
  }
  const src =
    kind === "contact"
      ? contacts.find((c) => c.id === id)
      : kind === "rock"
        ? impactors.find((m) => m.id === id)
        : kind === "station"
          ? stations.find((s) => s.id === id)
          : kind === "debris"
            ? chunks.find((c) => c.id === id)
            : kind === "asteroid"
              ? nearbyRocks(sim.ship.pos, sim.time, 2).find((r) => r.key === id && (r.worn ?? 0) < 1)
              : null;
  if (!src) return null;
  o.x = src.x;
  o.y = src.y;
  o.z = src.z;
  return o;
}

export function targetVelocity(kind, id, out) {
  const o = out ?? { x: 0, y: 0, z: 0 };
  if (kind === "body") return bodyVelocity(id, sim.time, o);
  if (kind === "waypoint") {
    const wp = sim.waypoints.find((w) => w.id === id);
    if (wp?.body) return bodyVelocity(wp.body, sim.time, o);
    o.x = 0; o.y = 0; o.z = 0;
    return o;
  }
  if (kind === "station") {
    const st = stations.find((s) => s.id === id);
    if (st) {
      o.x = st.vx ?? 0;
      o.y = st.vy ?? 0;
      o.z = st.vz ?? 0;
      return o;
    }
  }
  const src =
    kind === "contact" ? contacts.find((c) => c.id === id)
      : kind === "rock" ? impactors.find((m) => m.id === id)
        : kind === "debris" ? chunks.find((c) => c.id === id)
          : null; // belt rocks drift too slowly to matter
  o.x = src?.vx ?? 0;
  o.y = src?.vy ?? 0;
  o.z = src?.vz ?? 0;
  return o;
}

/* ---- one target, one truth ------------------------------------------------
 * There used to be two ideas of "what am I pointed at": sim.lock (the
 * signature lock) and sim.selected (what the warp core jumps to). They only
 * synced one way, and only for planets — so locking a station, a rock or a
 * contact left sim.selected holding whatever planet you had last, and the
 * next G took you there instead. Releasing a lock left it stale too, and a
 * survey silently re-pointed it. Everything that changes the nav target now
 * goes through setNavTarget, and the lock drives it.                       */

/** The only writer of sim.selected. Aborts a spool that was for something else. */
export function setNavTarget(id, why) {
  const next = id && warpNodeById(id) ? id : null;
  if (sim.selected === next) return next;
  sim.selected = next;
  if (sim.warp.state === "spool" && sim.warp.targetId !== next) {
    sim.warp.state = "idle";
    sim.warp.t = 0;
    sim.warp.cool = 2.5;
    sim.notice = "Warp aborted — target changed.";
    logEvent("Warp aborted: target changed", "nav");
    WARN.caution();
  }
  if (why) sim.notice = why;
  return next;
}

export function clearLock(why) {
  const had = sim.lock.id;
  sim.lock.id = null;
  sim.lock.kind = null;
  sim.lock.name = "";
  sim.lock.progress = 0;
  sim.lock.locked = false;
  sim.hold.has = false;
  /* dropping the lock drops the destination with it — a released lock must
   * never leave the core aimed at the last thing you happened to look at */
  setNavTarget(null);
  if (had && why) sim.notice = why;
}

/** P-LOCK: acquire whatever the reticle is nearest, or drop what you have. */
export function togglePointerLock() {
  if (sim.lock.id) {
    clearLock("Lock released.");
    return null;
  }
  const ship = sim.ship;
  const f = forwardOf(ship.yaw, ship.pitch);
  let best = null;
  let bestAngle = 0.45;
  for (const c of lockCandidates()) {
    const dx = c.x - ship.pos.x;
    const dy = c.y - ship.pos.y;
    const dz = c.z - ship.pos.z;
    const d = Math.hypot(dx, dy, dz) || 1;
    const dot = (dx * f.x + dy * f.y + dz * f.z) / d;
    const ang = Math.acos(clamp(dot, -1, 1));
    /* Prefer what you are actually pointing at, then what reads loudest. */
    const score = ang - Math.min(0.12, c.sig / (d + 1));
    if (ang < 0.45 && score < bestAngle) {
      bestAngle = score;
      best = c;
    }
  }
  if (!best) {
    const b = bodyUnderReticle();
    if (b) return acquireLock({ kind: "body", id: b.id });
    sim.notice = "Nothing under the reticle to lock.";
    WARN.deny();
    return null;
  }
  return acquireLock(best);
}

/** Starts a signature lock on a `lockCandidates()` entry (or `{kind,id}`). */
export function acquireLock(c) {
  const best = c.name ? c : lockCandidates().find((k) => k.kind === c.kind && k.id === c.id);
  if (!best) return null;
  sim.lock.id = best.id;
  sim.lock.kind = best.kind;
  sim.lock.name = best.name;
  sim.lock.progress = 0;
  sim.lock.locked = false;
  /* warp-capable kinds (worlds and ports) become the nav target; everything
   * else — rocks, debris, other ships — clears it, so the core reads NO
   * TARGET rather than quietly reusing the last planet you looked at */
  setNavTarget(warpNodeById(best.id) ? best.id : null);
  sim.notice = `Acquiring ${best.name}.`;
  return best;
}

function stepLock(dt) {
  const L = sim.lock;
  if (!L.id) return;
  const ship = sim.ship;
  if (!targetPosition(L.kind, L.id, _lp)) {
    clearLock("Lock lost — target gone.");
    return;
  }
  const dx = _lp.x - ship.pos.x;
  const dy = _lp.y - ship.pos.y;
  const dz = _lp.z - ship.pos.z;
  const d = Math.hypot(dx, dy, dz) || 1;
  const f = forwardOf(ship.yaw, ship.pitch);
  const ang = Math.acos(clamp((dx * f.x + dy * f.y + dz * f.z) / d, -1, 1));
  L.dist = d;
  L.angle = ang;

  const sig = candidateSig(L.kind, L.id);
  /* Big and close resolves fast; small and far is a slog. */
  const rate = clamp((sig / Math.max(d, 1)) * 26 + 0.16, 0.1, 1.4) * (ship.mods?.lock ?? 1);

  if (L.locked) {
    if (ang > LOCK_BREAK) {
      clearLock("Lock broken — target off the bore.");
    }
    return;
  }
  if (ang < LOCK_CONE) {
    L.progress = Math.min(1, L.progress + rate * dt);
    if (L.progress >= 1) {
      L.locked = true;
      sim.notice = `${L.name} locked. MATCH will hold station on it.`;
      logEvent(`Signature lock: ${L.name}`, "nav");
      NAV.lock();
    }
  } else {
    L.progress = Math.max(0, L.progress - dt * 0.75);
  }
}

/* ---- station keeping ---------------------------------------------------- */

const _anchorPos = { x: 0, y: 0, z: 0 };

/**
 * The point the assist should fly. Captured the moment you stop commanding
 * the ship, then carried along by whatever it is anchored to.
 */
function updateHold(ship, commanded) {
  const H = sim.hold;
  const useLock = ship.matchLock && sim.lock.locked && sim.lock.id;
  const kind = useLock ? sim.lock.kind : "body";
  const id = useLock ? sim.lock.id : sim.dominant?.id ?? null;

  if (commanded || !id) {
    H.has = false;
    H.id = id;
    H.kind = kind;
    return null;
  }
  if (!targetPosition(kind, id, _anchorPos)) {
    H.has = false;
    return null;
  }
  /* Re-anchor on a discontinuity. While the controller is actually holding you
   * never get more than a few units off, so a large error means something moved
   * you — a warp, an impact, a new anchor — and the old offset is meaningless. */
  const drifted =
    H.has &&
    Math.hypot(
      ship.pos.x - (_anchorPos.x + H.ox),
      ship.pos.y - (_anchorPos.y + H.oy),
      ship.pos.z - (_anchorPos.z + H.oz),
    ) > 800;

  if (!H.has || drifted || H.id !== id || H.kind !== kind) {
    H.id = id;
    H.kind = kind;
    H.ox = ship.pos.x - _anchorPos.x;
    H.oy = ship.pos.y - _anchorPos.y;
    H.oz = ship.pos.z - _anchorPos.z;
    H.has = true;
  }
  return { x: _anchorPos.x + H.ox, y: _anchorPos.y + H.oy, z: _anchorPos.z + H.oz };
}

/* ---- impacts -------------------------------------------------------------
 *
 * A strike is measured against the target: the same rock that leaves a scar on
 * a gas giant will end a moon. Severity drives everything downstream — crater
 * size, how much mass is thrown off, whether the world survives at all.
 */

function impactSeverity(impactorR, body, speed) {
  const ratio = impactorR / Math.max(body.radius, 1);
  return clamp(ratio * ratio * ratio * Math.pow(speed / 400, 1.4) * 0.5, 0, 1.4);
}

export function damageBody(body, severity, n, impactorR, speed, { ejecta = true } = {}) {
  body.integrity = (body.integrity ?? 1) - severity;
  body.scarred = (body.scarred ?? 0) + severity;
  const depth0 = clamp(0.06 + severity * 0.55, 0.06, 0.5);
  body.craters.push({
    nx: n.nx,
    ny: n.ny,
    nz: n.nz,
    r: Math.min(body.radius * 0.55, impactorR * 2.4),
    /* how deep the bowl digs, as a fraction of the radius — the renderer
     * carves this out of the sphere, so a cataclysm leaves a visible bite */
    depth: depth0,
    /* the shape it was born with, and how sharp its rim still is. A hot
     * world's basins slump toward a fraction of depth0 and the rim loses its
     * roughness — which is what stops a struck world staying jagged forever. */
    depth0,
    rough: 1,
    seed: (((body.craters.length + 1) * 131 + Math.round(severity * 997)) >>> 0) || 7,
  });
  if (body.craters.length > 12) body.craters.shift();

  /* mass thrown off, and with it the atmosphere if the hit was bad enough */
  body.radius = Math.max(body.baseRadius * 0.45, body.radius * (1 - severity * 0.12));
  if (severity > 0.45 && body.atmo) body.atmo = undefined;

  bodyPosition(body.id, sim.time, _bp);
  bodyVelocity(body.id, sim.time, _bv);
  /* a strike that runs the impact physics (js/impacts.js) throws its own crust */
  if (ejecta) burst({
    x: _bp.x + n.nx * body.radius * 1.05,
    y: _bp.y + n.ny * body.radius * 1.05,
    z: _bp.z + n.nz * body.radius * 1.05,
    vx: _bv.x,
    vy: _bv.y,
    vz: _bv.z,
    count: Math.min(120, 12 + Math.round(severity * 260)),
    speed: Math.max(30, body.stats.escape * (0.5 + severity)),
    size: impactorR * 0.28,
    spread: 1.1,
    nx: n.nx,
    ny: n.ny,
    nz: n.nz,
  });

  refreshBody(body);
  if (body.integrity <= 0 && !body.shattered) shatterBody(body);
  return body.shattered;
}

/* ---- staged cataclysms ---------------------------------------------------
 * A hit big enough to resurface a world is not a puff of dust and a dark
 * circle. It is an event with a life of its own: a jetting flash, a vapour
 * plume, an ejecta curtain, a magma ocean that slumps its own craters flat
 * as it cools, and a debris torus that flattens into an equatorial ring.
 * The sim owns the clock; the renderer reads the curve.
 */

let eventSeq = 1;

export function startCataclysm(body, sev, n, outcome) {
  const ev = {
    id: `cx${eventSeq++}`,
    bodyId: body.id,
    kind: "impact",
    outcome,
    sev,
    n: { x: n.nx, y: n.ny, z: n.nz },
    t: 0,
    dur: eventDuration(sev),
    ringed: false,
    radius: body.radius,
  };
  sim.events.push(ev);
  if (sim.events.length > 4) sim.events.shift();
  body.event = ev;
  return ev;
}

/** A star stops being a star. Staged like a real type-II light curve. */
export function goSupernova(bodyId) {
  const star = bodyId ? bodyById(bodyId) : starBody();
  if (!star || star.nova) return null;
  star.nova = true;
  const ev = {
    id: `sn${eventSeq++}`,
    bodyId: star.id,
    kind: "supernova",
    outcome: OUTCOME.SHATTER,
    sev: 1.4,
    n: { x: 0, y: 1, z: 0 },
    t: 0,
    dur: supernovaDuration(),
    ringed: false,
    radius: star.radius,
  };
  sim.events.push(ev);
  star.event = ev;
  sim.toast = `${star.name} HAS GONE SUPERNOVA`;
  sim.lastToastAt = sim.time;
  sim.notice = `${star.name} broke out. Shock front inbound — everything in this sky is downwind of it.`;
  logEvent(`${star.name} went supernova`, "impact");
  WARN.critical();
  return ev;
}

/** Lay the debris an event threw off into a torus that will settle to a ring. */
function layRing(body, sev, shattered) {
  const plan = ringPlan(body.radius, sev, shattered);
  bodyPosition(body.id, sim.time, _bp);
  for (let i = 0; i < plan.count; i++) {
    const a = Math.random() * Math.PI * 2;
    /* mass concentrates toward the inside, the way a real disc does */
    const f = Math.pow(Math.random(), 0.6);
    const r = plan.inner + (plan.outer - plan.inner) * f;
    /* born as a thick, inclined, crossing-orbit torus. stepDebris damps the
     * out-of-plane component far faster than the radial one, so it flattens
     * into the equatorial plane before it circularises — which is exactly
     * what collisional damping does to real impact debris. */
    const inc = (Math.random() - 0.5) * plan.tilt;
    const clump = r > plan.roche && plan.moonlets > 0;
    if (chunks.length >= 880) { const old = chunks.shift(); if (old) old.dead = true; }
    chunks.push({
      id: `d${Date.now().toString(36)}${i}`,
      x: _bp.x + Math.cos(a) * r,
      y: _bp.y + Math.sin(inc) * r,
      z: _bp.z + Math.sin(a) * r,
      vx: 0, vy: 0, vz: 0,
      r: body.radius * (clump ? 0.06 + Math.random() * 0.08 : 0.015 + Math.random() * 0.055),
      spin: (Math.random() - 0.5) * 0.5,
      seed: Math.random(),
      tint: 1,
      good: body.oreId ?? "iron_ore",
      parent: body.id,
      orbitA: a,
      orbitR: r,
      orbitY: Math.sin(inc) * r,
      /* the plane it is heading for, and how far along it is */
      orbitInc: inc,
      settle: 0,
      hot: Math.min(1, sev),
      life: 0,
      age: 0,
    });
  }
  body.ring = { inner: plan.inner, outer: plan.outer, roche: plan.roche, born: sim.time, settle: 0 };
  return plan;
}

/** Run every live event: relax the craters, light the sky, lay the rings. */
function stepCataclysms(d) {
  sim.skyGlow.length = 0;
  let lift = 0;
  for (let i = sim.events.length - 1; i >= 0; i--) {
    const ev = sim.events[i];
    const body = bodyById(ev.bodyId);
    if (!body) { sim.events.splice(i, 1); continue; }
    ev.t += d;
    const st = ev.kind === "supernova" ? supernovaState(ev.t) : cataclysmState(ev.t, ev.sev);
    ev.phase = st.phase;
    ev.lum = st.lum;
    ev.kelvin = st.kelvin;
    ev.shell = st.shell;
    ev.settle = st.settle ?? 0;
    ev.molten = st.molten ?? 0;
    ev.pulse = st.pulse ?? 0;

    /* a molten surface flows: basins slump, rims collapse. This is the fix
     * for "planets go spiky and stay that way" — the spikes are a phase, not
     * a permanent state, and what is left when it cools is a shallow basin. */
    if (relaxCraters(body, d, ev.molten)) {
      body.relaxAcc = (body.relaxAcc ?? 0) + d;
      if (body.relaxAcc > 2.5) { body.relaxAcc = 0; body.dirty = true; }
    }
    /* the world is still glowing from the inside while it is molten */
    if (ev.molten > 0.02) body.moltenGlow = ev.molten;
    else if (body.moltenGlow) body.moltenGlow = 0;

    /* the ring goes down once the curtain has had time to leave the surface */
    if (!ev.ringed && ev.t > 12 && (ev.outcome === OUTCOME.DISRUPT || ev.outcome === OUTCOME.SHATTER)) {
      ev.ringed = true;
      layRing(body, ev.sev, ev.outcome === OUTCOME.SHATTER);
      logEvent(`${body.name}: debris settling into a ring`, "impact");
    }
    if (body.ring) body.ring.settle = Math.max(body.ring.settle, ev.settle);

    /* publish the light. This is what makes an event BEHIND you visible:
     * the renderer turns it into a real light plus an exposure bump, so the
     * hull in front of you brightens even when the source is off screen. */
    if (ev.lum > 0.004) {
      bodyPosition(body.id, sim.time, _bp);
      sim.skyGlow.push({
        x: _bp.x, y: _bp.y, z: _bp.z,
        hex: kelvinHex(ev.kelvin),
        lum: ev.lum,
        radius: ev.kind === "supernova" ? body.radius * 4 : body.radius,
        kind: ev.kind,
        shell: ev.shell,
        pulse: ev.pulse,
        phase: ev.phase,
      });
      const dist = dist3(sim.ship.pos, _bp);
      lift = Math.max(lift, apparentGlow(ev.lum, ev.kind === "supernova" ? body.radius * 6 : body.radius, dist));
    }

    /* the plateau breaks and the core has nothing left holding it up */
    if (ev.kind === "supernova" && !body.collapsed && ev.t > SN_COLLAPSE_AT) collapseToHole(body);

    if (ev.t > ev.dur) {
      if (body.event === ev) body.event = null;
      body.moltenGlow = 0;
      body.dirty = true;
      sim.events.splice(i, 1);
    }
  }
  /* the eye takes a second or two to come back down */
  sim.skyLift += (lift - sim.skyLift) * Math.min(1, d * (lift > sim.skyLift ? 9 : 0.8));
}

/* Breakout + rise + plateau (cataclysm.js SN_PHASES): the moment the
 * photosphere stops being held up by recombination is when the core has gone. */
const SN_COLLAPSE_AT = 74.2;

/** A star that went supernova leaves a black hole where it was. */
export function collapseToHole(star) {
  if (!star || star.collapsed) return null;
  bodyPosition(star.id, sim.time, _bp);
  const h = collapseStar(star, _bp, sim.time);
  if (!h) return null;
  sim.toast = `${star.name} HAS COLLAPSED`;
  sim.lastToastAt = sim.time;
  sim.notice = `${star.name}'s core has fallen in. There is a black hole where the star was — the orbits hold, the light does not.`;
  logEvent(`${star.name} collapsed into a black hole (${h.name})`, "impact");
  WARN.critical();
  return h;
}

/**
 * Throw a transit remnant through the sky now (the console, a story, a test).
 * `aimBodyId` passes it inside that world's Roche limit.
 */
export function summonHole(opts = {}) {
  let aimAt = null;
  if (opts.aimBodyId) {
    const b = bodyById(opts.aimBodyId);
    if (b) {
      bodyPosition(b.id, sim.time, _bp);
      const dR = b.radius * Math.cbrt((2 * HOLE.transitMu) / Math.max(1, b.mu ?? 1));
      aimAt = { body: b, pos: { x: _bp.x, y: _bp.y, z: _bp.z }, pass: opts.pass ?? dR * 0.55 };
    }
  }
  const h = spawnTransit({ ship: sim.ship, time: sim.time, aimAt, rs: opts.rs ?? null, speed: opts.speed ?? null });
  if (opts.at) { h.x = opts.at.x; h.y = opts.at.y; h.z = opts.at.z; }
  if (opts.vel) { h.vx = opts.vel.x; h.vy = opts.vel.y; h.vz = opts.vel.z; }
  logEvent(`Collapse flash on the long-range array — ${h.name}, a stellar remnant, is falling through this system`, "impact");
  return h;
}

/* ---- what a hole does to the things the sim owns --------------------------- */

/* Filled in on each step, not here: several of these are bindings from modules
 * that cycle with this one, and touching them at load time is exactly what the
 * perf suite's "no top-level assignment through a cyclic binding" rule forbids. */
const _holeCtx = {
  time: 0, authority: true, ship: null, bodies: null, bodyPosition: null, impactors: null, chunks: null, removeChunk: null,
  stations: null, contacts: null, rocksNear: null, eatRocks: null, inBelt: null,
  damageBody: (b, sev, n, r, speed) => damageBody(b, sev, n, r, speed),
  loseStation: holeLoseStation, rakeStation: holeRakeStation, onShip: holeOnShip,
  log: (text, kind) => logEvent(text, kind ?? "impact"),
  rng: Math.random,
};

function holeLoseStation(st, h) {
  logEvent(`${st.name} fell into ${h.name}`, "impact");
  sim.toast = `${st.name} lost to ${h.name}`;
  sim.lastToastAt = sim.time;
  st.destroyed = true;
  (sim.lostPorts ??= []).push(st.id);
  const i = stations.indexOf(st);
  if (i >= 0) dropStation(i);
}

function holeRakeStation(st, h, frac) {
  const guns = Math.min(st.guards ?? 0, Math.ceil(frac * 3));
  if (guns > 0) st.guards -= guns;
  for (const line of st.stock ?? []) line.qty = Math.max(0, Math.round(line.qty * (1 - 0.4 * frac)));
  logEvent(`Tidal shear off ${h.name} rakes ${st.name}${guns ? ` — ${guns} gun${guns > 1 ? "s" : ""} torn off` : ""}`, "impact");
}

function holeOnShip(h, zone, d, dt) {
  const ship = sim.ship;
  sim.holeZone = { zone, at: sim.time, name: h.name };
  if (zone === "horizon") {
    if (ship.hull > 0) {
      logEvent(`Crossed the event horizon of ${h.name}`, "damage");
      sim.toast = `EVENT HORIZON — ${h.name}`;
      sim.lastToastAt = sim.time;
    }
    applyDamage(ship, 1e5, null, sim.time);
    sim.trauma = 1;
    return;
  }
  const R = holeRadii(h, {});
  if (zone === "burn") {
    /* inside the ISCO the disk's own light is a furnace */
    const t = 1 - (d - R.horizon) / Math.max(1, R.burn - R.horizon);
    sim.heat = Math.max(sim.heat ?? 0, 0.6 + t * 0.4);
    applyDamage(ship, (40 + t * 160) * dt * (ship.mods?.heat ?? 1), null, sim.time, "thermal");
    sim.trauma = Math.min(1, sim.trauma + dt * 1.5);
  } else {
    const t = 1 - (d - R.burn) / Math.max(1, R.roche - R.burn);
    sim.trauma = Math.min(1, sim.trauma + dt * 0.6 * t);
    applyDamage(ship, 6 * t * dt, null, sim.time, "em");        // a hole's induced currents
  }
}

/**
 * A hull lost at a hole. The breach handler's "hull 12, dead stop" was a
 * soft-lock here: the disk or the horizon took the 12 back next tick, the stop
 * pinned the ship in place, and SPACETIME SHEAR blocked the warp out — forever
 * at a remnant, which never moves. The beacon does what the stop could not:
 * the hold is gone, the hull comes back at the nearest friendly port.
 */
function holeRescue(ship, name) {
  let best = null, bd = Infinity;
  for (const st of stations) {
    if (st.hostile && !st.claimed) continue;
    const dd = Math.hypot(st.x - ship.pos.x, st.y - ship.pos.y, st.z - ship.pos.z);
    if (dd < bd) { bd = dd; best = st; }
  }
  const lost = Math.round(cargoTotal(ship));
  ship.hold = {};
  ship.hull = 12;
  ship.shieldCharge = 0;
  sim.warp.state = "idle";
  sim.warp.t = 0;
  sim.holeZone = null;
  if (best) {
    ship.pos.x = best.x; ship.pos.y = best.y + 1400; ship.pos.z = best.z;
    ship.vel.x = best.vx ?? 0; ship.vel.y = best.vy ?? 0; ship.vel.z = best.vz ?? 0;
  } else {
    ship.vel.x = ship.vel.y = ship.vel.z = 0;
  }
  sim.toast = `Lost to ${name} — the beacon brought you in${best ? ` at ${best.name}` : ""}`;
  sim.lastToastAt = sim.time;
  logEvent(`Hull lost to ${name}${lost ? ` with ${lost} units in the hold` : ""} — recovered${best ? ` at ${best.name}` : ""}`, "damage");
  WARN.alarm();
}

/**
 * THE HULL IS GONE.
 *
 * Until 0.3.33 this could not happen: hull at or below zero clamped to twelve
 * points and said "hull breach contained", which made every fight survivable
 * and made insurance meaningless — there was nothing to insure against. Now a
 * breach is a loss, and what you walk away with is what you paid an
 * underwriter for.
 *
 * You are never stranded. The hull is struck off, the policy pays into your
 * purse, and you come to at the nearest port in whatever you still own — the
 * next hull on your books, or the trainer everyone starts in, which is what
 * `currentShipId()` falls back to when `activeHullId` is empty. A dead end
 * would be a worse game than a harsh one.
 *
 * The hold goes with the hull. So does the cover: a policy is written against
 * one hull and consumed by its loss.
 */
export function loseHull(ship, cause = "hull loss") {
  const id = currentShipId();
  const def = shipById(id);
  /* a pilot with no complex has no rank, and rankStatus() answers null for
   * them — losing a hull must not be the thing that throws */
  const buyer = { complexId: pilot.complexId ?? null, letter: rankStatus()?.letter ?? null };
  let worth = 0;
  try { worth = def ? yardQuote(def, buyer).total : 0; } catch { worth = 0; }
  const key = playerKey(id);
  const had = policyFor(key);
  const { paid, tier } = insuranceClaim(key, { at: sim.time, what: def?.name ?? "hull", by: cause });

  /* struck off the books, and fall back to whatever is left */
  sim.ownedHulls = (sim.ownedHulls ?? []).filter((h) => h !== id);
  sim.activeHullId = sim.ownedHulls.length ? sim.ownedHulls[sim.ownedHulls.length - 1] : null;
  sim.requestPersist = true;   // the loss is on the record before the next frame can be closed on

  const lostCargo = Math.round(cargoTotal(ship));
  if (paid > 0) ship.credits += paid;

  /* nearest port that will have you */
  let best = null, bd = Infinity;
  for (const st of stations) {
    if (st.hostile && !st.claimed) continue;
    const dd = Math.hypot(st.x - ship.pos.x, st.y - ship.pos.y, st.z - ship.pos.z);
    if (dd < bd) { bd = dd; best = st; }
  }

  ship.hold = {};
  ship.hull = hullMaxOf(ship);
  ship.shieldCharge = 0;
  ship.throttle = 0;
  sim.warp.state = "idle";
  sim.warp.t = 0;
  if (best) {
    ship.pos.x = best.x; ship.pos.y = best.y + 1400; ship.pos.z = best.z;
    ship.vel.x = best.vx ?? 0; ship.vel.y = best.vy ?? 0; ship.vel.z = best.vz ?? 0;
  } else {
    ship.vel.x = ship.vel.y = ship.vel.z = 0;
  }

  const flying = shipById(currentShipId());
  const settled = paid > 0
    ? `${had?.tier ? had.tier.toUpperCase() : String(tier ?? "").toUpperCase()} settled ${paid.toLocaleString()} cr`
    : "No cover — nothing settled";
  sim.toast = `${def?.name ?? "Hull"} lost — ${settled}`;
  sim.lastToastAt = sim.time;
  logEvent(
    `${def?.name ?? "Hull"} lost to ${cause}${lostCargo ? ` with ${lostCargo} units in the hold` : ""}. ` +
    `${paid > 0 ? `${settled} against a ${worth.toLocaleString()} cr hull` : `Uninsured — a ${worth.toLocaleString()} cr hull written off`}. ` +
    `Flying ${flying?.name ?? "a trainer"}${best ? ` out of ${best.name}` : ""}.`,
    "damage",
  );
  WARN.alarm();
  return { paid, tier: had?.tier ?? tier ?? null, worth, hullId: id, port: best?.id ?? null };
}

/* The dash: say it before it matters, and say it again as it gets worse. */
const HOLE_WARN = [420000, 160000, 70000];
function watchHoles() {
  for (const h of holes) {
    if (h.posted) continue;
    h.posted = true;
    gnnPost(h.kind === "remnant"
      ? { desk: "news", title: "STELLAR COLLAPSE", body: `The core of ${h.name.replace(/ remnant$/, "")} has fallen in. Astronomers confirm a black hole where the star was; the orbits hold, the light does not. Keep clear of the disk.` }
      : { desk: "news", title: "COLLAPSAR INBOUND", body: `A stellar remnant, ${h.name}, is falling through this system at ${Math.round(Math.hypot(h.vx, h.vy, h.vz) / 100)} km/s. Warp will not hold inside ${Math.round(holeRadii(h, {}).warp / 100)} km of it. Rocks, rogues and anything else in its path are being taken.` });
  }
  const near = holes.length ? nearestHole(sim.ship.pos) : null;
  sim.holeWatch = near
    ? { id: near.hole.id, name: near.hole.name, dist: near.dist, danger: near.radii.danger, closing: holeClosing(near.hole), kind: near.hole.kind }
    : null;
  if (!near) return;
  const h = near.hole;
  const level = HOLE_WARN.filter((r) => near.dist < r).length;
  if (level > (h.warned ?? 0)) {
    h.warned = level;
    const km = Math.round(near.dist / 100);
    sim.notice = level === 1
      ? `${h.name} on the long-range array, ${km} km — the stars behind it are bending. Nothing out-flies it close in; keep the range open.`
      : level === 2
        ? `${h.name} at ${km} km and ${h.gravity ? "pulling" : "holding"}. Warp will not hold inside ${Math.round(near.radii.warp / 100)} km of it.`
        : `${h.name} at ${km} km. Burn away from it NOW.`;
    sim.toast = level === 3 ? `COLLAPSAR ${km} km` : sim.toast;
    sim.lastToastAt = sim.time;
    if (level >= 2) WARN.critical(); else WARN.caution();
  }
}

function holeClosing(h) {
  const s = sim.ship;
  const dx = h.x - s.pos.x, dy = h.y - s.pos.y, dz = h.z - s.pos.z;
  const d = Math.hypot(dx, dy, dz) || 1;
  return -((h.vx - s.vel.x) * dx + (h.vy - s.vel.y) * dy + (h.vz - s.vel.z) * dz) / d;
}

function shatterBody(body) {
  body.shattered = true;
  body.integrity = 0;
  refreshBody(body);
  rubbleRing(body, 110, body.radius * 1.9);
  sim.toast = `${body.name} has broken up`;
  sim.lastToastAt = sim.time;
  logEvent(`${body.name} shattered — reduced to a rubble field`, "impact");
}

/** A strike the host saw. Mirrors apply it as if the rock had landed here too. */
export function applyRemoteStrike(ev) {
  const body = bodyById(ev.bodyId);
  const i = impactors.findIndex((x) => x.id === ev.id);
  if (i >= 0) impactors.splice(i, 1);
  if (!body || body.shattered) return null;
  onImpact({ id: ev.id, r: ev.r, name: ev.name ?? "Rock", vx: 0, vy: 0, vz: 0, remote: true }, body, ev.speed, ev.n);
  return impactTier(impactSeverity(ev.r, body, ev.speed));
}

/* ---- the held sky: snapshots ----------------------------------------------
 * Everything that has HAPPENED to a sky, small enough to post: body damage
 * and climate, ports lost or disarmed or claimed, the live rocks, who has
 * been shot down. The host publishes it; a pilot joining later applies it and
 * sees the same craters, the same missing ring. (The clock and the market
 * desk need no snapshot — both are functions of the room's shared time.)
 */
export function worldSnapshot() {
  const bodies = {};
  for (const b of BODIES) {
    if (b.kind === "star") continue;
    const changed = (b.integrity ?? 1) < 1 || b.shattered || (b.thermal ?? 0) > 1 || (b.terraform ?? 0) !== 0 || (b.craters?.length ?? 0) > 0 || Boolean(b.nova) || Boolean(b.ring);
    if (!changed) continue;
    bodies[b.id] = {
      integrity: b.integrity ?? 1, scarred: b.scarred ?? 0, radius: b.radius, shattered: Boolean(b.shattered),
      thermal: Math.round(b.thermal ?? 0), terraform: b.terraform ?? 0, atmo: b.atmo ?? null,
      nova: Boolean(b.nova), ring: b.ring ? { ...b.ring } : null,
      craters: (b.craters ?? []).map((c) => ({ nx: c.nx, ny: c.ny, nz: c.nz, r: c.r, depth: c.depth, depth0: c.depth0 ?? c.depth, rough: c.rough ?? 1, seed: c.seed })),
    };
  }
  const ports = {};
  for (const st of stations) {
    if (st.claimed || (st.sector === "pirate" && !st.hostile) || (st.guards0 != null && st.guards !== st.guards0)) {
      ports[st.id] = { guards: st.guards ?? 0, claimed: Boolean(st.claimed), hostile: Boolean(st.hostile) };
    }
  }
  return { v: 1, time: sim.time, bodies, ports, lost: [...(sim.lostPorts ?? [])], impactors: impactorWire(), holes: holeWire(), trafficDown: { ...trafficDown } };
}

export function applyWorldSnapshot(snap) {
  if (!snap || snap.v !== 1) return false;
  for (const [id, w] of Object.entries(snap.bodies ?? {})) {
    const b = bodyById(id);
    if (!b) continue;
    const wasShattered = Boolean(b.shattered);
    b.integrity = w.integrity; b.scarred = w.scarred; b.radius = w.radius;
    b.thermal = w.thermal; b.terraform = w.terraform;
    b.nova = Boolean(w.nova); b.ring = w.ring ?? null;
    if (w.atmo === null) b.atmo = undefined;
    b.craters = (w.craters ?? []).slice();
    if (w.shattered && !wasShattered) {
      b.shattered = true; b.integrity = 0;
      refreshBody(b);
      rubbleRing(b, 110, b.radius * 1.9);
    } else {
      b.shattered = w.shattered;
      refreshBody(b);
    }
  }
  const lost = new Set(snap.lost ?? []);
  if (lost.size) {
    for (let i = stations.length - 1; i >= 0; i--) if (lost.has(stations[i].id)) dropStation(i);
    sim.lostPorts = [...new Set([...(sim.lostPorts ?? []), ...lost])];
  }
  for (const [id, w] of Object.entries(snap.ports ?? {})) {
    const st = stationById(id);
    if (!st) continue;
    st.guards = w.guards; st.claimed = w.claimed; st.hostile = w.hostile;
  }
  if (snap.impactors) adoptImpactors(snap.impactors);
  if (snap.holes) {
    for (const w of snap.holes) if (w.kind === "remnant" && w.starId) { const st = bodyById(w.starId); if (st) st.collapsed = true; }
    adoptHoles(snap.holes);
  }
  for (const [id, until] of Object.entries(snap.trafficDown ?? {})) trafficDown[id] = until;
  return true;
}

/** A port off the roster: its hull back to the yard, and the core no longer aimed at it. */
function dropStation(i) {
  const st = stations[i];
  releaseBuilt(st);
  stations.splice(i, 1);
  if (sim.selected === st.id) setNavTarget(null);
}

/** How a strike reads from orbit. Minor: a flash. Major: shock rings walking
 * the surface. Cataclysm: rings, a blast dome, a glowing scar, the sky full
 * of ejecta — and if you are close, the canopy whites out. */
export function impactTier(sev) {
  if (sev < 0.05) return "minor";
  if (sev < 0.18) return "major";
  return "cataclysm";
}

/** Synthesize a strike (tests, stories, the console). Aims at the sunward face unless given a normal. */
export function strikeBody(bodyId, r = 500, speed = 800, n = null) {
  const body = bodyById(bodyId);
  if (!body || body.shattered) return null;
  bodyPosition(body.id, sim.time, _bp);
  const len = Math.hypot(_bp.x, _bp.y, _bp.z) || 1;
  const nn = n ?? { nx: -_bp.x / len, ny: -_bp.y / len, nz: -_bp.z / len };
  onImpact({ r, name: "Test Mass", vx: 0, vy: 0, vz: 0 }, body, speed, nn);
  return impactTier(impactSeverity(r, body, speed));
}

function onImpact(m, body, speed, n) {
  const sev = impactSeverity(m.r, body, speed);
  const before = body.integrity ?? 1;
  /* A real rock (not a synthesized test mass) runs the rigid-body break-up —
   * if it landed where anybody could see it; otherwise the old burst stands in. */
  let run = null;
  if (m.id) {
    bodyPosition(body.id, sim.time, _bp);
    bodyVelocity(body.id, sim.time, _bv);
    try {
      /* a mirrored strike arrives with a speed and a normal but no velocity:
       * the rock came in along the normal at that speed, relative to the world */
      const still = !m.vx && !m.vy && !m.vz;
      const rogue = still ? { ...m, vx: _bv.x - n.nx * speed, vy: _bv.y - n.ny * speed, vz: _bv.z - n.nz * speed } : m;
      run = startStrike({
        rogue, body, bodyPos: { x: _bp.x, y: _bp.y, z: _bp.z }, bodyVel: { x: _bv.x, y: _bv.y, z: _bv.z },
        normal: n, speed, sev, gSurf: surfaceGravity(body), time: sim.time, shipPos: sim.ship.pos, addChunk,
        crustColor: CRUST_TINT[body.kind] ?? CRUST_TINT.rocky,
      });
    } catch (e) {
      run = null;
      console.warn("[impacts] strike run failed, falling back to a burst", e);
    }
  }
  const gone = damageBody(body, sev, n, m.r, speed, { ejecta: !run });
  const outcome = outcomeOf(sev, gone ? 0 : body.integrity ?? 1);
  /* anything from a resurfacing upward runs the staged event */
  if (isCataclysmic(outcome)) startCataclysm(body, sev, n, outcome);
  /* the strike dumps heat: kinetic scale, capped so a moonlet does not become a star */
  heatBody(body, clamp(sev * 900 + speed * 0.35, 30, 620));
  const d = dist3(sim.ship.pos, bodyPosition(body.id, sim.time, _bp));
  sim.lastImpact = { body: body.name, rock: m.name, sev, at: sim.time, blast: null };
  /* hand the renderer the strike: where, how hard, whether the world died */
  sim.impactFX.push({ bodyId: body.id, n: { x: n.nx, y: n.ny, z: n.nz }, sev, tier: impactTier(sev), outcome, r: m.r, speed, gone, at: sim.time });
  if (sim.impactFX.length > 8) sim.impactFX.shift();
  /* a held sky: the host tells everyone the rock landed, and where */
  if (sim.worldAuthority && !m.remote) {
    sim.send({ t: "strike", id: m.id, bodyId: body.id, r: m.r, name: m.name, speed, n: { nx: n.nx, ny: n.ny, nz: n.nz }, at: sim.time });
  }
  /* close enough to a big one and the canopy whites out */
  if (d < body.radius * 30) {
    sim.flash = Math.max(sim.flash, clamp(sev * 3 * (1 - d / (body.radius * 30)), 0, 1));
  }
  /* the blast wave does not care what it hits: ports, drones, guards, pilots,
   * and you, out to a severity-scaled radius around the struck world */
  const blastR = body.radius * (2.5 + sev * 6);
  const blast = { portsHit: [], portsLost: [], kills: [] };
  for (const st of stations) {
    const ds = Math.hypot(st.x - _bp.x, st.y - _bp.y, st.z - _bp.z);
    if (gone && st.hostId === body.id) {
      /* a tethered port dies with its world */
      logEvent(`${st.name} lost with ${body.name} — no carrier from the ring`, "impact");
      sim.toast = `${st.name} lost with ${body.name}`;
      sim.lastToastAt = sim.time;
      st.destroyed = true;
      blast.portsLost.push(st.name);
      (sim.lostPorts ??= []).push(st.id);
      continue;
    }
    if (ds < blastR) {
      const hitFrac = 1 - ds / blastR;
      const guns = Math.min(st.guards ?? 0, Math.ceil(hitFrac * 2));
      if (guns > 0) st.guards -= guns;
      for (const line of st.stock ?? []) line.qty = Math.max(0, Math.round(line.qty * (1 - 0.3 * hitFrac)));
      blast.portsHit.push({ name: st.name, guns });
      logEvent(`Blast wave from ${body.name} rakes ${st.name}${guns ? ` — ${guns} gun${guns > 1 ? "s" : ""} out` : ""}`, "impact");
    }
  }
  for (let i = stations.length - 1; i >= 0; i--) if (stations[i].destroyed) dropStation(i);
  for (const c of contacts) {
    const dc = Math.hypot(c.x - _bp.x, c.y - _bp.y, c.z - _bp.z);
    if (dc < blastR && c.hp > 0) {
      c.hp -= (1 - dc / blastR) * 70;
      c.shield = Math.max(0, (c.shield ?? 0) - 40);
      if (c.hp <= 0) {
        blast.kills.push(c.name);
        logEvent(`${c.name} destroyed by the blast wave off ${body.name}`, "impact");
      }
    }
  }
  if (d < blastR) {
    applyDamage(sim.ship, (1 - d / blastR) * 34 * (sim.ship.mods?.heat ?? 1), null, sim.time, "thermal");
    sim.notice = `Blast wave from ${body.name} — brace.`;
  }
  sim.lastImpact.blast = blast;
  logEvent(
    `${m.name} struck ${body.name} at ${Math.round(speed)} u/s — integrity ${Math.round(before * 100)}% to ${Math.round(Math.max(0, body.integrity) * 100)}%, surface ${Math.round(bodyTempK(body))} K`,
    "impact",
  );
  if (!gone) {
    sim.toast = `${m.name} struck ${body.name}`;
    sim.lastToastAt = sim.time;
  }
  /* You feel a big one if you are anywhere near it. */
  if (d < body.radius * 14) {
    sim.trauma = Math.min(1, sim.trauma + clamp(sev * 2.2, 0.15, 0.9) * (sim.ship.mods?.gTol ?? 1));
    SHIP.impact(Math.min(1, sev * 2));
  }
}

/* What crust a world throws, by kind — the run's chunks carry it as colour. */
const CRUST_TINT = {
  rocky: [0.42, 0.37, 0.31], terra: [0.36, 0.33, 0.28], moon: [0.46, 0.45, 0.43], dwarf: [0.5, 0.45, 0.4],
  cloud: [0.55, 0.5, 0.38], ice: [0.62, 0.7, 0.76], gas: [0.52, 0.46, 0.38],
};

/** Two rogues met (impactors.js). Host only: a mirror is told and runs the same break-up. */
function onRogueCollision(a, b, remote = false) {
  const midX = (a.x + b.x) / 2, midY = (a.y + b.y) / 2, midZ = (a.z + b.z) / 2;
  let run = null;
  try {
    run = startCollision({ a, b, time: sim.time, shipPos: sim.ship.pos, addChunk });
  } catch (e) {
    console.warn("[impacts] collision run failed, falling back to a burst", e);
  }
  if (!run) {
    for (const m of [a, b]) burst({ x: m.x, y: m.y, z: m.z, vx: m.vx, vy: m.vy, vz: m.vz, count: 18, speed: 60, size: m.r * 0.2, good: "iron_ore", tint: 0.2 });
  }
  const d = Math.hypot(sim.ship.pos.x - midX, sim.ship.pos.y - midY, sim.ship.pos.z - midZ);
  logEvent(`${a.name} and ${b.name} collided at ${Math.round(Math.hypot(a.vx - b.vx, a.vy - b.vy, a.vz - b.vz))} u/s — both broke up`, "impact");
  if (!remote) gnnPost({ desk: "news", title: "ROCK ON ROCK", body: `${a.name} and ${b.name} met at ${Math.round(Math.hypot(a.vx - b.vx, a.vy - b.vy, a.vz - b.vz) / 100)} km/s. Both broke up; the field is salvage now, and anything big enough to leave is being catalogued.` });
  if (d < 90000) {
    sim.toast = `${a.name} × ${b.name}`;
    sim.lastToastAt = sim.time;
    sim.flash = Math.max(sim.flash, Math.min(0.6, 0.25 * (1 - d / 90000) + 0.1));
  }
  sim.lastImpact = { body: null, rock: `${a.name} × ${b.name}`, sev: 0, at: sim.time, blast: null };
  if (sim.worldAuthority && !remote) {
    const wire = (m) => ({ id: m.id, name: m.name, r: m.r, x: m.x, y: m.y, z: m.z, vx: m.vx, vy: m.vy, vz: m.vz, seed: m.seed, spin: m.spin, cls: m.cls, shape: m.shape, bodySeed: m.bodySeed });
    sim.send({ t: "rockhit", a: wire(a), b: wire(b), at: sim.time });
  }
}

/** A collision the host saw. The mirror runs it too, but spawns no rogue: the host's list carries that. */
export function applyRemoteRockHit(ev) {
  for (const id of [ev.a?.id, ev.b?.id]) {
    const i = impactors.findIndex((x) => x.id === id);
    if (i >= 0) impactors.splice(i, 1);
  }
  if (!ev.a || !ev.b) return null;
  onRogueCollision(ev.a, ev.b, true);
  return true;
}

function fragmentRogue(m) {
  const r = addRogue(m, sim.time);
  if (r) logEvent(`${r.name} — ${Math.round(r.r * 10)} m, thrown clear of the collision and on its own now`, "impact");
}
const _impactCtx = { time: 0, bodyPosition: null, bodyVelocity: null, onRogue: null };

function onShipHit(m, speed) {
  applyDamage(sim.ship, 30 + speed * 0.22, null, sim.time);
  sim.trauma = 1;
  sim.ship.vel.x += m.vx * 0.35;
  sim.ship.vel.y += m.vy * 0.35;
  sim.ship.vel.z += m.vz * 0.35;
  burst({
    x: sim.ship.pos.x, y: sim.ship.pos.y, z: sim.ship.pos.z,
    vx: sim.ship.vel.x, vy: sim.ship.vel.y, vz: sim.ship.vel.z,
    count: 26, speed: 90, size: 6, life: 40,
  });
  sim.toast = `${m.name} hit the hull`;
  sim.lastToastAt = sim.time;
  logEvent(`${m.name} struck the ship at ${Math.round(speed)} u/s`, "damage");
  SHIP.impact(0.8);
}

/* ---- ops board ---------------------------------------------------------- */

/**
 * How far the ship's sensors resolve solid things (u). Rocks and hulls are
 * only drawn inside this; beyond it the chart shows transponders and nothing
 * else. A pulse throws it out for 30 s; a scan-rated pilot sees further.
 */
export const SENSOR_R = 30000;
/**
 * Berths, in ONE place.
 *
 * There were two: this number, which counts the quarters refit, and a second
 * one computed inline in the hiring hall straight off `shipById().stats.crew`,
 * which does not. So buying berths bought you nothing you could hire into —
 * but the robot yard reads this one, which is why a robot would still fit and
 * a person would not. Anything that asks "how many berths" asks here now.
 */
export function crewCapacity() {
  return (shipById(currentShipId())?.stats.crew ?? 2) + upgradeFx("berths", 0);
}

/** Robot frames that do NOT take a crew berth (the frame racks refit). */
export function robotCapacity() {
  return crewCapacity() + upgradeFx("robotSlots", 0);
}

/* Nanofoam closes small breaches on its own; a bloom-regulated core opens them.
 * Both land here, once a cycle, so the two cancel honestly if you fit both. */
let repairAt = 0;
function tickHullRepair() {
  const per = upgradeFx("repair", 0);
  if (!per || sim.phase !== "play") return;
  if (sim.time - repairAt < 90) return;   // one crew cycle (crew.js CYCLE_SECONDS)
  repairAt = sim.time;
  const ship = sim.ship;
  const max = ship.hullMax ?? 100;
  const was = ship.hull;
  ship.hull = Math.max(1, Math.min(max, ship.hull + per));
  if (ship.hull !== was && per < 0 && ship.hull < max * 0.35) sim.notice = "The core is running past its bloom and the frame is paying for it.";
}

export function sensorRange() {
  const base = SENSOR_R * (sim.ship?.mods?.scan ?? 1);
  return sim.time < (sim.pulseUntil ?? 0) ? base * 1.8 : base;
}

export function sensorPulse() {
  const ship = sim.ship;
  if (ship.charge < 140) {
    sim.notice = "Not enough charge for a sensor pulse.";
    WARN.deny();
    return false;
  }
  ship.charge -= 140;
  sim.pulseUntil = sim.time + 30;
  sim.notice = "Sensor pulse away. Long-range contacts held for 30 seconds.";
  logEvent("Active sensor pulse", "system");
  NAV.ping();
  return true;
}

export function pulseActive() {
  return sim.time < sim.pulseUntil;
}

export function autoLevel() {
  const ship = sim.ship;
  ship.aimPitch = 0;
  ship.roll = 0;
  sim.notice = "Levelled to the ecliptic.";
}

export function cycleTimeScale() {
  if (!sim.worldAuthority || sim.remotes.size > 0) {
    sim.timeScale = 1;
    sim.notice = "Shared sky — one room, one clock.";
    return 1;
  }
  sim.timeScale = sim.timeScale === 1 ? 8 : sim.timeScale === 8 ? 40 : 1;
  return sim.timeScale;
}

/** Salvage tractor: reels in nearby debris while it has power. */
/** Start a GNN salvage contract on a shattered world's field. */
export function takeSalvageContract(bodyId, rate) {
  const b = bodyById(bodyId);
  if (!b) return null;
  sim.contract = { bodyId, name: b.name, rate, until: sim.time + 1800, hauled: 0, paid: 0 };
  logEvent(`Salvage contract registered — ${b.name} field, ${rate} cr/u for 30 min`, "trade");
  return sim.contract;
}

export function stepContract() {
  const c = sim.contract;
  if (!c) return;
  if (sim.time > c.until) {
    logEvent(`Salvage contract on the ${c.name} field expired — ${c.paid} cr earned`, "trade");
    sim.toast = `Salvage contract expired — ${c.paid} cr earned`;
    sim.lastToastAt = sim.time;
    sim.contract = null;
    return;
  }
  /* the charter pays on the spot when you dock with contract tonnage */
  if (sim.ship.dockedAt && c.hauled > 0.5) {
    const pay = Math.round(c.hauled * c.rate);
    sim.ship.credits += pay;
    c.paid += pay;
    logEvent(`Charter pays ${pay} cr for ${Math.round(c.hauled)} units off the ${c.name} field`, "trade");
    sim.toast = `Salvage contract: +${pay} cr`;
    sim.lastToastAt = sim.time;
    c.hauled = 0;
  }
}

function stepSalvage(dt) {
  const ship = sim.ship;
  if (!ship.salvage || !ship.powered.ops) return;
  const room = ship.cargoCap - cargoTotal(ship);
  if (room <= 0) return;
  const reach = ship.mods?.salvage ?? 1;
  /* pieces an impact run still drives are overwritten every tick: they held the six slots for up to 26 s */
  const near = nearDebris(ship.pos, 2200 * reach).filter((e) => !e.c.driven);
  for (const { c, d } of near.slice(0, 6)) {
    /* pull it in, then take it aboard */
    const k = (240 * reach * dt) / Math.max(d, 1);
    c.vx += (ship.pos.x - c.x) * k;
    c.vy += (ship.pos.y - c.y) * k;
    c.vz += (ship.pos.z - c.z) * k;
    if (d < 90) {
      const mass = chunkMass(c);
      addCargo(ship, c.good ?? "iron_ore", mass);
      /* contract tonnage: anything tractored inside the contracted world's old well */
      const con = sim.contract;
      if (con && sim.time <= con.until) {
        const b = bodyById(con.bodyId);
        if (b && dist3(ship.pos, bodyPosition(b.id, sim.time, _bp)) < Math.max(b.well, b.radius * 30)) con.hauled += mass;
      }
      removeChunk(c);
    }
  }
}

/* ---- systems ------------------------------------------------------------ */

export function cycleTurretMode(dir = 1) {
  const ship = sim.ship;
  const i = TURRET_MODES.findIndex((m) => m.id === ship.turretMode);
  const next = TURRET_MODES[(i + dir + TURRET_MODES.length) % TURRET_MODES.length];
  ship.turretMode = next.id;
  ship.turretsArmed = next.id !== "off";
  sim.notice = `Turrets: ${next.label}. ${next.hint}`;
  logEvent(`Turrets set to ${next.label}`, "system");
  return next;
}

/** Jump straight to a rule — the terminal shows all of them at once. */
export function setTurretMode(id) {
  const m = TURRET_MODES.find((x) => x.id === id);
  if (!m) return;
  sim.ship.turretMode = m.id;
  sim.ship.turretsArmed = m.id !== "off";
  tapeRecord("order", "turret", m.id);
  sim.notice = `Turrets: ${m.label}. ${m.hint}`;
  logEvent(`Turrets set to ${m.label}`, "system");
  return m;
}

export function setMiningMode(id, { quiet = false } = {}) {
  const m = MINING_MODES.find((x) => x.id === id);
  if (!m) return;
  sim.ship.miningMode = m.id;
  tapeRecord("order", "cutter", m.id);
  if (quiet) return m; // the autopilot stowing its own cutter must not talk over its engage notice
  sim.notice = `Mining laser: ${m.label}. ${m.hint}`;
  logEvent(`Mining laser set to ${m.label}`, "system");
  return m;
}

export function cycleMiningMode(dir = 1) {
  const ship = sim.ship;
  const i = MINING_MODES.findIndex((m) => m.id === ship.miningMode);
  const next = MINING_MODES[(i + dir + MINING_MODES.length) % MINING_MODES.length];
  ship.miningMode = next.id;
  sim.notice = `Mining laser: ${next.label}. ${next.hint}`;
  logEvent(`Mining laser set to ${next.label}`, "system");
  return next;
}

const TOGGLE_TEXT = {
  shields: (on) => (on ? "Shields up." : "Shields down. 28 units/s back to the bus."),
  turretsArmed: (on) => (on ? "Turrets deployed." : "Turrets stowed."),
  engines: (on) => (on ? "Mains online." : "Mains cold — running dark. No thrust, no attitude authority."),
  pressurized: (on) =>
    on ? "Cabin repressurising. O2 climbing." : "Hull vented. Suit ops — clumsier hands, tougher hull.",
  localGravity: (on) => (on ? "Local gravity on." : "Local gravity off. Lighter on the sticks, 12 units/s saved."),
  assist: (on) => (on ? "Flight assist on. Lateral drift trimmed." : "Flight assist off. Pure momentum — you fly it all."),
  lights: (on) => (on ? "Hull floods on. 8 units/s." : "Hull floods off."),
  sentry: (on) => (on ? "Sentry watching for inbound rock." : "Sentry off. Nothing is watching the sky."),
  salvage: (on) => (on ? "Salvage tractor live. Debris inside 2200 u comes aboard." : "Salvage tractor stowed."),
  matchLock: (on) =>
    on ? "Matching velocity with the locked world." : "Velocity match released.",
};

export function toggleSystem(key) {
  const ship = sim.ship;
  if (key === "pressurized" && !ship.pressurized) {
    if (ship.charge < 140) {
      sim.notice = "Not enough charge to repressurise.";
      WARN.deny();
      return ship.pressurized;
    }
    ship.charge -= 140;
  }
  ship[key] = !ship[key];
  if (key === "turretsArmed") {
    if (ship.turretsArmed && ship.turretMode === "off") ship.turretMode = "castle";
    if (!ship.turretsArmed) ship.turretMode = "off";
  }
  sim.notice = TOGGLE_TEXT[key] ? TOGGLE_TEXT[key](ship[key]) : "";
  logEvent(sim.notice, "system");
  tapeRecord("order", "system", key, { on: ship[key] ? 1 : 0 });
  return ship[key];
}

export function setThrottle(v) {
  const cap = Math.min(sim.ship.tune?.throttleCap ?? THROTTLE_MAX, THROTTLE_MAX);
  const was = sim.ship.throttle;
  sim.ship.throttle = clamp(v, THROTTLE_MIN, cap);
  touch.throttle = sim.ship.throttle;
  /* A stick sends this every frame it is held. What belongs on the tape is the
   * DECISION, not the sweep, so only a tenth-of-a-notch move is filed. */
  if (Math.abs(sim.ship.throttle - was) >= 0.1) tapeRecord("order", "throttle", sim.ship.throttle.toFixed(2));
}

export function throttleCap() {
  return Math.min(sim.ship.tune?.throttleCap ?? THROTTLE_MAX, THROTTLE_MAX);
}

/* ---- main tick ---------------------------------------------------------- */

function stepShip(a, dt) {
  const ship = sim.ship;

  /* 1. Aim. Panning is pointing: the reticle IS the nose vector. */
  const look = consumeLook();
  /* Increasing yaw swings the nose to port, so stick-right has to subtract.
   * This is the single place pan reaches the heading, so the stick, the
   * keyboard and the gamepad all get the fix at once. */
  /* Expo shapes the stick, then a low-pass ramps it. Between them a thumb
   * flick becomes a sweep instead of a jerk. */
  const tune = ship.tune;
  const k = 1 - Math.exp(-dt / Math.max(tune.panSmooth, 0.01));
  sim.pan.x += (expo(a.panX, tune.panExpo) - sim.pan.x) * k;
  sim.pan.y += (expo(a.panY, tune.panExpo) - sim.pan.y) * k;
  const panRate = tune.panRate;
  ship.aimYaw -= sim.pan.x * panRate * dt;
  ship.aimYaw += look.yaw * LOOK_GAIN;
  ship.aimPitch += sim.pan.y * panRate * dt + look.pitch * LOOK_GAIN;

  /* 2. Throttle. The slider writes it directly; keys nudge it.
   * Shift is the boost — mains to the cap while it is held. Shift+Ctrl sets
   * CRUISE: the boosted setting stays after the keys lift, until anything
   * touches the thrusters (slider, steps, X, brake, RCS). */
  if (justPressed("cruise")) {
    if (sim.cruise == null) {
      sim.cruise = throttleCap();
      sim.notice = `Cruise set — mains held at ${Math.round(sim.cruise * 100)}%. Touch the thrusters to drop it.`;
    } else {
      sim.cruise = null;
      sim.notice = "Cruise off.";
    }
  }
  const sliderMoved = Math.abs(touch.throttle - ship.throttle) > 0.02;
  if (sim.cruise != null && (a.throttleZero || a.throttleStep !== 0 || a.brake || Math.hypot(a.rcsX, a.rcsY, a.rcsZ) > 0 || sliderMoved)) {
    sim.cruise = null;
    sim.notice = "Cruise dropped — you have the throttle.";
  }
  if (a.throttleZero) setThrottle(0);
  else if (a.throttleStep !== 0) setThrottle(ship.throttle + a.throttleStep * 0.55 * dt);
  else if (a.boost) {
    if (sim.boostFrom == null) sim.boostFrom = ship.throttle;
    setThrottle(throttleCap());
  } else if (sim.cruise != null) setThrottle(sim.cruise);
  else if (sim.boostFrom != null) { setThrottle(sim.boostFrom); sim.boostFrom = null; }
  else ship.throttle = clamp(touch.throttle, THROTTLE_MIN, throttleCap());
  if (!a.boost && sim.boostFrom != null) sim.boostFrom = null;

  _rcs.x = a.rcsX;
  _rcs.y = a.rcsY;
  _rcs.z = a.rcsZ;
  const rcsMag = Math.hypot(_rcs.x, _rcs.y, _rcs.z);

  /* 3. Power before motion — a brownout must derate this tick's burn. */
  /* A spooling core is the single heaviest thing on the bus. */
  const demand = buildDemand(ship, rcsMag, a.brake, sim.warp.state === "spool" ? WARP.draw : 0);
  const turretExtra = stepTurrets(ship, dt, sim.time);
  demand.turrets += turretExtra;
  syncHullTune(ship);
  stepPower(ship, dt, demand);
  ship.braking = a.brake;

  /* 4. Gravity, attitude, translation. */
  const dom = gravityAt(ship.pos, sim.time, bodyPosition, _g);
  ship.gAccel.x = _g.x;
  ship.gAccel.y = _g.y;
  ship.gAccel.z = _g.z;
  sim.dominant = dom.body;
  sim.domDist = dom.dist;
  sim.altitude = dom.body ? dom.dist - dom.body.radius : 0;
  if (dom.body) bodyVelocity(dom.body.id, sim.time, sim.frameVel);
  else {
    sim.frameVel.x = 0;
    sim.frameVel.y = 0;
    sim.frameVel.z = 0;
  }

  /* MATCH flies you into the locked target's own frame rather than the frame
   * of whatever well you happen to be in. */
  stepLock(dt);
  let frame = sim.frameVel;
  const onLock = ship.matchLock && sim.lock.locked && sim.lock.id;
  if (onLock) {
    targetVelocity(sim.lock.kind, sim.lock.id, _matchVel);
    frame = _matchVel;
  }
  /* A berth asked for: fly in the PORT's frame. The assist, the brake and the
   * hold all worked relative to the well you were in, so beside a port carried
   * round its world at 50–280 u/s, BRAKE stopped you dead in the world's frame
   * while the port sailed on — the approach chased the entry gate in circles,
   * never under the tractor's 150 u/s capture limit, and nothing ever caught the
   * ship. The port's own velocity is the only frame a docking lane makes sense in. */
  sim.dockPort = dockPortFor(ship);
  if (!onLock && sim.dockPort && !tractor.active) {
    _matchVel.x = sim.dockPort.vx ?? 0; _matchVel.y = sim.dockPort.vy ?? 0; _matchVel.z = sim.dockPort.vz ?? 0;
    frame = _matchVel;
  }
  const commanded = Math.abs(ship.throttle) > 0.02 || rcsMag > 0 || a.brake;
  const hold = updateHold(ship, commanded);

  /* What the flight assist is allowed to dodge. Computed here, where every
   * hazard source is already imported, and handed to the flight model as a
   * plain vector — ship.js must not reach back into the sim for it. */
  updateAvoidance(ship);
  tickContacts(dt);

  stepAttitude(ship, dt);
  stepTranslation(ship, dt, _rcs, a.brake, frame, hold);
  stepCollisions(ship, dt);

  if (ship.hull <= 0 && sim.holeZone && sim.time - sim.holeZone.at < 0.5 && sim.holeZone.zone !== "roche") {
    holeRescue(ship, sim.holeZone.name);
  } else if (ship.hull <= 0) {
    /* blame whatever last put a round into you, if it was recent enough to be
     * the reason — scraping a rock ten minutes ago is not what killed you */
    const hit = ship.lastHitBy && sim.time - (ship.lastHitAt ?? -1e9) < 12 ? ship.lastHitBy : null;
    loseHull(ship, hit?.name ?? hit?.captain ?? "a hull breach");
  }
}

/**
 * The shared-sky clock chase moves `sim.time` in a jump (js/net.js). Every world,
 * port and rock is a function of that clock, so they leapt a second or more
 * along their rails while the hull stayed where it was: on a slow phone, polled
 * every quarter second, a port running at 150 u/s slid 50–100 u away per poll
 * faster than any approach could close, so the autopilot circled it and nothing
 * ever came in range of the tractor. The hull now rides the jump in whatever
 * frame it is flying in — the port it is docking at, else the well it is in.
 */
export function shiftClock(dt) {
  if (!Number.isFinite(dt) || dt === 0) return;
  const ship = sim.ship;
  if (!ship || sim.phase === "menu") { sim.time += dt; return; }
  const port = ship.dockedAt ? null : dockPortFor(ship);
  let fx = 0, fy = 0, fz = 0;
  if (port) { fx = port.vx ?? 0; fy = port.vy ?? 0; fz = port.vz ?? 0; }
  else if (sim.dominant) { bodyVelocity(sim.dominant.id, sim.time, _clockV); fx = _clockV.x; fy = _clockV.y; fz = _clockV.z; }
  sim.time += dt;
  if (ship.dockedAt || tractor.active) return;   // clampDocked and the tractor re-seat the hull off the new clock
  ship.pos.x += fx * dt; ship.pos.y += fy * dt; ship.pos.z += fz * dt;
}
const _clockV = { x: 0, y: 0, z: 0 };

/** The port whose frame the hull flies in: a live berth request (yours or the autopilot's) inside 30 km. */
const DOCK_FRAME_R = 30000;
function dockPortFor(ship) {
  if (ship.dockedAt) return null;
  if (tractor.active) return stationById(tractor.stId);
  /* a berth you asked for, the one the autopilot filed, or the port the autopilot is flying to */
  const id = (dockRequest.stId && hasDockRequest(stationById(dockRequest.stId) ?? { id: null }, sim.time) ? dockRequest.stId : null)
    ?? sim.dockRequestFor ?? (autopilot.on ? autopilot.portId : null) ?? null;
  const st = id ? stationById(id) : null;
  if (!st || (st.hostile && !st.claimed)) return null;
  return Math.hypot(st.x - ship.pos.x, st.y - ship.pos.y, st.z - ship.pos.z) < DOCK_FRAME_R ? st : null;
}

/* ---- flight assist: collision avoidance --------------------------------
 * The assist trimmed drift and nothing else, so a hull under assist would
 * fly into a rock or a station at whatever speed it was carrying. It now
 * looks ahead and pushes off — but only at what you are NOT approaching on
 * purpose, because mining and docking are both "fly at that thing".
 */
const _avoidDir = { x: 0, y: 0, z: 0 };
let avoidAt = 0;

function updateAvoidance(ship) {
  const off = () => { ship.avoid = null; sim.threat = null; };
  if (!ship.assist || ship.dockedAt || sim.warp.state !== "idle" || (ship.tune?.assistGain ?? 1) <= 0.01) return off();

  const now = sim.wall * 1000;
  if (now - avoidAt >= AVOID.everyMs) {
    avoidAt = now;
    sim.threat = threatTo(ship.pos, ship.vel, { exempt: deliberate(sim, mining), surface: surfaceOnly(sim), time: sim.time });
  }
  const hz = sim.threat;
  const level = avoidLevel(hz);
  if (!hz || level < 2) {
    /* Level 1 is a warning, not a manoeuvre: the HUD says something is in the
     * way and the pilot gets to decide. The assist only takes a hand when
     * there is no longer time to. */
    ship.avoid = null;
    return;
  }

  avoidAim(ship.pos, ship.vel, hz, _avoidDir, sim.time);
  const dx = _avoidDir.x - ship.pos.x;
  const dy = _avoidDir.y - ship.pos.y;
  const dz = _avoidDir.z - ship.pos.z;
  const d = Math.hypot(dx, dy, dz) || 1;
  ship.avoid = { x: dx / d, y: dy / d, z: dz / d, level, name: hz.name, t: hz.t, inside: Boolean(hz.inside) };
}

export function tickSim(dt) {
  const d = Math.min(dt, 0.1);
  sim.wall += d;
  if (sim.phase !== "pause") sim.time += d * (sim.phase === "menu" ? 1 : sim.timeScale);
  if (sim.phase === "play" && sim.time - sim.telemetry.at >= 3) sampleTelemetry();
  sim.trauma = Math.max(0, sim.trauma - d * 1.6);
  sim.flash = Math.max(0, sim.flash - d * 0.7);
  sim.pulse = Math.max(0, sim.pulse - d * 1.8);

  for (const r of sim.remotes.values()) {
    const k = 1 - Math.exp(-10 * d);
    r.x += (r.tx - r.x) * k;
    r.y += (r.ty - r.y) * k;
    r.z += (r.tz - r.z) * k;
    r.yaw += wrapPi(r.tyaw - r.yaw) * k;
    r.pitch += (r.tpitch - r.pitch) * k;
  }

  /* the crane runs whether or not the hull is flying — it is the reason it is not */
  stepDockwork(d * (sim.phase === "play" ? sim.timeScale : 1), sim.ship?.dockedAt ?? null);

  if (sim.phase !== "play") {
    setEngineLevel(0, false, 0);
    return;
  }

  /* Stations move to THIS tick's time before anything is glued to them.
   * stepWorld() also steps them, but it runs at the end of the tick — so
   * clampDocked() and the tractor were snapping the ship relative to where
   * the station was LAST tick, and stepWorld then moved the station out from
   * under it. One frame of lag, st.v × dt of error: invisible at 16 ms,
   * a 10–30 u pop on a hitched frame — inside a 20 u aperture. A docked or
   * tractored hull now rides the station exactly; the second call inside
   * stepWorld recomputes the same rail positions and is idempotent. */
  stepStations(sim.time);

  const a = sampleInput();
  if (justPressed("terminal")) setTerminal(!sim.terminalOpen);

  /* With the terminal up you are reading gauges, not flying. New stick, RCS
   * and throttle input is ignored; the ship keeps its vector and the reactor
   * keeps working. HOLD is the one control that still reaches the thrusters. */
  if (sim.terminalOpen) {
    a.panX = 0;
    a.panY = 0;
    a.rcsX = 0;
    a.rcsY = 0;
    a.rcsZ = 0;
    a.throttleStep = 0;
    a.throttleZero = false;
    a.brake = sim.termHold;
    consumeLook();
    stepWarp(d);
    if (sim.warp.state !== "run") {
      stepShip(a, d);
      clampDocked();
      stepTractorTick(d);
      if (sim.wantScan) {
        sim.wantScan = false;
        tryScan();
      }
    }
    syncContacts(sim.ship, sim.remotes, relationOf, sim.time, d);
    stepShots(sim.ship, d, sim.time, onKill);
    /* the ore a contract named, but only while the loop is flying: your own hand at the cutter cuts whatever you point it at */
  stepMining(sim.ship, d, sim.time, sim.lock, sim.handsOff ? sim.autoPlan?.seamOre ?? null : null);
    stepWorld(d);
    setEngineLevel(speedOf(sim.ship, sim.frameVel), sim.ship.throttle > 1, sim.ship.throttle);
    return;
  }

  if (justPressed("pause")) {
    sim.phase = "pause";
    useGameStore.getState().setPhase("pause");
    return;
  }
  if (justPressed("map")) useGameStore.getState().setMapOpen(!useGameStore.getState().mapOpen);
  if (justPressed("cam")) sim.cameraMode = (sim.cameraMode + 1) % 2;
  if (justPressed("timeUp")) sim.timeScale = sim.timeScale === 1 ? 8 : sim.timeScale === 8 ? 40 : 1;
  if (justPressed("timeDown")) sim.timeScale = sim.timeScale === 40 ? 8 : 1;
  /* two pilots in one room keep one clock — time-warp would desync the sky */
  if (sim.remotes.size > 0 && sim.timeScale !== 1) sim.timeScale = 1;
  if (justPressed("tShields")) toggleSystem("shields");
  if (justPressed("tTurrets")) toggleSystem("turretsArmed");
  if (justPressed("tEngines")) toggleSystem("engines");
  if (justPressed("tLife")) toggleSystem("pressurized");
  if (justPressed("tGrav")) toggleSystem("localGravity");
  if (justPressed("tAssist")) toggleSystem("assist");
  if (justPressed("cycleTurret")) cycleTurretMode(1);
  if (justPressed("cycleMining")) cycleMiningMode(1);

  stepWarp(d);
  if (sim.warp.state !== "run") {
    stepShip(a, d);
    clampDocked();
    stepTractorTick(d);
    if (justPressed("scan") || sim.wantScan) {
      sim.wantScan = false;
      tryScan();
    }
    if (justPressed("warp") || sim.wantJump) {
      sim.wantJump = false;
      toggleWarp();
    }
  }

  syncContacts(sim.ship, sim.remotes, relationOf, sim.time, d);
  stepShots(sim.ship, d, sim.time, onKill);
  stepMining(sim.ship, d, sim.time, sim.lock);
  stepWorld(d);

  for (const b of BEACONS) {
    if (sim.beaconsGot.has(b.id)) continue;
    if (dist3(sim.ship.pos, beaconPosition(b, sim.time)) < 420) collectBeacon(b.id, true);
  }

  setEngineLevel(speedOf(sim.ship, sim.frameVel), sim.ship.throttle > 1, sim.ship.throttle);

  sim.netSendAcc += d;
  if (sim.netSendAcc >= 0.05) {
    sim.netSendAcc = 0;
    sim.broadcast({
      t: "ship",
      name: sim.callsign,
      color: sim.color,
      ship: currentShipId(),
      x: sim.ship.pos.x,
      y: sim.ship.pos.y,
      z: sim.ship.pos.z,
      yaw: sim.ship.yaw,
      pitch: sim.ship.pitch,
      speed: speedOf(sim.ship, sim.frameVel),
    });
  }
}

const _gImp = { x: 0, y: 0, z: 0 };
const _bv = { x: 0, y: 0, z: 0 };

/** Everything that happens out there whether or not you are looking. */
/** Free ports keep guns. They only wake up when somebody is close enough to rob. */
function stepPorts(dt) {
  for (const st of stations) {
    if (!st.hostile || st.guards <= 0) continue;
    if ((st.truceUntil ?? -1) > sim.time) continue; // toll paid — the watch stays in its holes
    const d = Math.hypot(st.x - sim.ship.pos.x, st.y - sim.ship.pos.y, st.z - sim.ship.pos.z);
    if (d > 12000) continue;
    let live = 0;
    for (const c of contacts) if (c.stationId === st.id && c.hp > 0) live++;
    if (live >= st.guards) continue;
    const a = Math.random() * Math.PI * 2;
    contacts.push({
      id: `guard-${st.id}-${Math.random().toString(36).slice(2, 7)}`,
      kind: "drone",
      name: `${st.name} gun`,
      relation: "hostile",
      stationId: st.id,
      x: st.x + Math.cos(a) * st.radius * 4,
      y: st.y + (Math.random() - 0.5) * st.radius * 2,
      z: st.z + Math.sin(a) * st.radius * 4,
      vx: st.vx, vy: st.vy, vz: st.vz,
      hp: 70 + Math.random() * 50,
      shield: 30,
      radius: 5,
      cooldown: Math.random() * 2,
    });
  }
}

/**
 * Clamps are clamps. A docked hull rides the ring wherever the ring goes —
 * including at 8x and 40x, where the port outruns anything the hold could
 * follow and the ship would otherwise be left hanging in space.
 */
function clampDocked() {
  const ship = sim.ship;
  if (!ship.dockedAt) return;
  const st = stationById(ship.dockedAt);
  if (!st) {
    ship.dockedAt = null;
    return;
  }
  const o = sim.dockOffset ?? (sim.dockOffset = { x: 0, y: st.radius * 1.5, z: 0 });
  ship.pos.x = st.x + o.x;
  ship.pos.y = st.y + o.y;
  ship.pos.z = st.z + o.z;
  ship.vel.x = st.vx;
  ship.vel.y = st.vy;
  ship.vel.z = st.vz;
}

/**
 * The ladder advances off the work, not off a menu. Every second you spend
 * cutting rock, holding a lock, hauling cargo or being shot at pays the skill
 * that shift would actually have taught you.
 */
let _crewFxAt = -10;
function stepCareer(d) {
  const ship = sim.ship;
  if (sim.time - _crewFxAt > 2) {
    _crewFxAt = sim.time;
    updateCrewMods(currentShipId(), sim.callsign, sim.time);
    const fx = crewEffects(currentShipId(), sim.callsign, sim.time);
    sim.interior = {
      hull: fx.plan.hullName,
      robots: fx.plan.robots,
      sensors: fx.plan.rooms.reduce((a, r) => a + r.sensors, 0),
      hasBrig: fx.plan.rooms.some((r) => r.kind === "brig"),
      intruders: boarding.intruders,
    };
  }
  tickBoarding(d);
  stepContract();
  stepIcework(d);
  stepAtmoWorks(d);
  /* the wallet: a credit moved and half a minute passed since the last write —
   * scans and beacons write at once, this is for the trade that never scans */
  if ((Math.abs(Math.round(sim.ship.credits) - (sim.walletSaved ?? 0)) >= 1 || pilot.dirty) && sim.wall - (sim.walletAt ?? 0) >= WALLET_EVERY) sim.requestPersist = true;
  if (sim.requestPersist) { sim.requestPersist = false; persistProgress(); }
  stepMarket(d);
  coolBodies(d);
  syncMods(ship);
  serveTime(d, { docked: Boolean(ship.dockedAt) });
  /* the ladder pays every cycle; the statement prints when you next dock */
  const pay = takePayout();
  if (pay > 0) {
    ship.credits += pay;
    sim.payAccrued = (sim.payAccrued ?? 0) + pay;
  }
  if (ship.dockedAt && (sim.payAccrued ?? 0) > 0) {
    logEvent(`Payroll cleared: +${sim.payAccrued} cr as ${rankStatus()?.title ?? "crew"}`, "trade");
    sim.payAccrued = 0;
  }
  if (mining.assay) {
    logEvent(mining.assay, "survey");
    sim.toast = mining.assay;
    sim.lastToastAt = sim.time;
    mining.assay = null;
    work("geology", 2); // a called-in vein is real prospecting
  }
  if (mining.active) {
    work("geology", d * 0.6);
    work("heavyOps", d * 0.45);
    if (ship.miningMode === "overdrive") work("hazardOps", d * 0.25);
  }
  if (ship.salvage && ship.powered.ops) work("salvage", d * 0.5);
  if (Math.abs(ship.throttle) > 0.05) work("piloting", d * 0.22);
  if (sim.warp.state === "spool" || sim.warp.state === "run") work("navigation", d * 0.8);
  if (sim.lock.locked) work("dataOps", d * 0.3);
  if (turretAim.firing) work("security", d * 0.9);
  if (ship.dockedAt) work("commerce", d * 0.35);
  sim.crewCapacity = crewCapacity();
  sim.robotCapacity = robotCapacity();
  tickHullRepair(d);
  tickPatchDrone(d);
  tickCrew(d, ship);
  tickRobots(d);
  tickCompany(d);
  if (sim.heat > 0.2) work("hazardOps", d * 0.5);
  if (!ship.pressurized) work("lifeSupport", d * 0.3);
  if (ship.brownout) work("energySystems", d * 0.6);
}

function stepWorld(d) {
  stepStations(sim.time);
  /* the player's position is what decides the far-field detail budget and
   * which fights fly real rounds, so the sky is told where the player is */
  stepTraffic(sim.time, d, stations, currentSystem, sim.ship.pos);
  /* A mirror flies the hulls — it has to, or they would freeze between the
   * host's packets — but it does not get to decide anything. Who is hunting
   * whom, who called for help and what a nest launched are the host's to
   * settle, and a mirror that made its own mind up would be fighting a
   * different war in the same sky. worldsync.js overwrites the outcome. */
  if (sim.worldAuthority !== false) {
    stepNpcCombat(sim.time, d, sim.ship.pos);
    stepSecurity(sim.time, d, stations);
    stepRogues(sim.time, d, stations, sim.ship.pos);
  }
  /* the security ◆ is the pilot's, not the sky's: every client steps its own (0.3.48) */
  stepSecLevel(sim.ship, sim.time, d, { authority: sim.worldAuthority !== false });

  sim.engagement = stepBattles(sim.time, d, sim.ship.pos, npcTracer, stations, currentSystem);
  stepFlow(sim.time, stations);
  stepEconomy(d, stations);
  stepLaneDiscipline(d);
  stepCareer(d);
  tickCaptain(d);
  tickAutopilot(d);
  stepProbes(d);
  stepDroneOps();
  stepFab(sim.time);
  stepNpcDrones();
  tickContracts(d);
  tickFleet(d);
  stepPorts(d);
  stepStationWorks(d, sim.time, sim.ship);
  stepImpactors(d, sim.ship, BODIES, bodyPosition, gravityAt, _gImp, sim.time, onImpact, onShipHit, onRogueCollision);
  _holeCtx.time = sim.time;
  _holeCtx.authority = sim.worldAuthority !== false;
  _holeCtx.ship = sim.ship;
  _holeCtx.bodies = BODIES;
  _holeCtx.stations = stations;
  _holeCtx.contacts = contacts;
  _holeCtx.bodyPosition = bodyPosition;
  _holeCtx.impactors = impactors;
  _holeCtx.chunks = chunks;
  _holeCtx.removeChunk = removeChunk;
  _holeCtx.rocksNear = nearbyRocks;
  _holeCtx.eatRocks = eatRocks;
  _holeCtx.inBelt = inBelt;
  stepHoles(d, _holeCtx);
  watchHoles();
  _impactCtx.time = sim.time;
  _impactCtx.bodyPosition = bodyPosition;
  _impactCtx.bodyVelocity = bodyVelocity;
  _impactCtx.onRogue = sim.worldAuthority !== false ? fragmentRogue : null;
  stepImpacts(d, _impactCtx);
  stepCataclysms(d);
  stepDebris(d, gravityAt, _gImp);
  stepSalvage(d);
  /* both branches hand back the SAME array — the `: []` used to allocate a
   * fresh empty one every tick the sentry was off, which is most of them */
  sim.threats = sim.ship.sentry && sim.ship.powered.ops
    ? threatBoard(sim.ship, BODIES, bodyPosition, sim.time)
    : emptyThreatBoard();
}

function onKill(c, shot = null) {
  /* one of your work drones made the kill: it is yours — bounty, standing, the lot */
  if (shot && String(shot.owner).startsWith("pdrone-")) noteDroneKill(shot.owner);
  const byPort = shot && shot.faction === "station" && !String(shot.owner).startsWith("pdrone-");
  if (byPort) {
    /* a port's guns or drones made the kill: the debris is theirs, the bounty is not */
    const stId = String(shot.owner).split(":")[0].replace(/^sdrone-/, "").split("-")[0];
    const st = stations.find((x) => x.id === stId) ?? stations.find((x) => String(shot.owner).includes(x.id));
    sim.toast = `${st?.name ?? "Port"} guns destroyed ${c.name}`;
    sim.lastToastAt = sim.time;
    logEvent(`${st?.name ?? "Port"} guns destroyed ${c.name}`, "combat");
    burst({ x: c.x, y: c.y, z: c.z, vx: (c.vx ?? 0) * 0.3, vy: (c.vy ?? 0) * 0.3, vz: (c.vz ?? 0) * 0.3, count: c.kind === "npc" ? 14 : 6, speed: 24, size: 8, good: "iron_ore", tint: 0.35 });
    if (c.kind === "npc") { const until = markVesselDown(c.id, sim.time); const n = traffic.find((x) => x.id === c.id); if (n && HOSTILE_ROLES.has(n.role)) pirateKilled(c.id, sim.time); sim.send({ t: "vdown", id: c.id, until }); }
    return;
  }
  sim.toast = `${c.name} destroyed`;
  sim.lastToastAt = sim.time;
  logEvent(`${c.name} destroyed`, "combat");
  /* what is left of it drifts where it died — the tractor takes plate */
  burst({ x: c.x, y: c.y, z: c.z, vx: (c.vx ?? 0) * 0.3, vy: (c.vy ?? 0) * 0.3, vz: (c.vz ?? 0) * 0.3, count: c.kind === "npc" ? 14 : 6, speed: 24, size: 8, good: "iron_ore", tint: 0.35 });
  work("security", 4);
  work("command", 1);
  /* a working hull: that was somebody's crew. Its owners remember, and so does the room. */
  if (c.kind === "npc") {
    const until = markVesselDown(c.id, sim.time);
    const n = traffic.find((x) => x.id === c.id);
    noteDestroyed(n);                     // 0.3.18: a drone cull on the desk counts every drone you put down
    if (n && HOSTILE_ROLES.has(n.role)) {
      /* a pirate: the charters pay for that, and so does anyone they were working over */
      const e = pirateKilled(c.id, sim.time);
      noteKill(c.id);
      /* 0.3.47: 420 + 6/t + 600 for a rescue was a starter hull every eight kills */
      const bounty = 240 + Math.round((shipById(n.ship)?.stats.massT ?? 30) * 4) + (e ? 350 : 0);
      sim.ship.credits += bounty;
      bookRevenue("bounty", bounty, `Bounty on ${c.name}`);
      sim.toast = e ? `${c.name} destroyed — ${e.victimName} saved. Bounty ${bounty} cr` : `${c.name} destroyed. Bounty ${bounty} cr`;
      logEvent(`Bounty ${bounty} cr on ${c.name}`, "combat");
      for (const st of stations) {
        if (st.sector === "military" || (e && st.id === traffic.find((x) => x.id === e.victimId)?.from)) {
          const co = corpOfStation(st);
          if (co) adjustStanding(co.id, e ? 10 : 5, `destroyed the pirate ${c.name}`);
        }
      }
      const raiders = corpOfVessel(n);
      if (raiders) adjustStanding(raiders.id, -6, `destroyed ${c.name}`);
      const saved = e ? corpOfVessel(traffic.find((x) => x.id === e.victimId)) : null;
      if (saved) adjustStanding(saved.id, 8, `saved ${e.victimName}`);
      work("security", e ? 8 : 4);
      sim.send({ t: "vdown", id: c.id, until });
      return;
    }
    /* an honest hull: its flag remembers, its flag's allies remember, its flag's enemies approve */
    noteKillBySelf({ n, t: sim.time });   // 0.3.48: and so does the Directorate
    const flag = blameKill(n, `destroyed ${c.name}`);
    if (flag) logEvent(`${flag.name} will remember ${c.name}`, "combat");
    sim.send({ t: "vdown", id: c.id, until });
    return;
  }
  /* another pilot: the heaviest thing the Directorate files (0.3.48) */
  if (c.kind === "peer") { noteKillBySelf({ peer: true, t: sim.time }); return; }
  /* Somebody owned that gun. */
  if (c.stationId) {
    const st = stationById(c.stationId);
    const co = st ? corpOfStation(st) : null;
    if (co) adjustStanding(co.id, -6, `lost a gun at ${st.name}`);
  }
  if (c.stationId) {
    const st = stationById(c.stationId);
    if (st && st.guards > 0) {
      st.guards -= 1;
      if (st.guards === 0) {
        sim.toast = `${st.name} is quiet — it can be claimed`;
        sim.lastToastAt = sim.time;
        logEvent(`${st.name} defences down`, "port");
        work("security", 6);
      }
    }
  }
}

export function pauseTick() {
  sampleInput();
  if (justPressed("pause")) resumePlay();
}

export function resumePlay() {
  sim.phase = "play";
  useGameStore.getState().setPhase("play");
}

export function selectBody(id) {
  const st = stationById(id);
  const body = st ? null : bodyById(id);
  const wp = st || body ? null : sim.waypoints.find((w) => w.id === id);
  if (wp?.body) return selectBody(wp.body);
  if (wp) {
    setNavTarget(id);
    if (sim.lock.id !== id) acquireLock({ kind: "waypoint", id, name: wp.name });
    sim.activeWaypoint = id;
    sim.notice = `${wp.name} set as the jump point. Point the nose and G to warp, or let the chart fly it.`;
    useGameStore.getState().patchHud({ selected: id, notice: sim.notice });
    return;
  }
  if (!st && !body) return;
  setNavTarget(id);
  /* a pick off the map is a real lock, not a second parallel notion of
   * "selected" — so the HUD, MATCH and the autopilot all agree with it */
  if (sim.lock.id !== id) {
    acquireLock({ kind: st ? "station" : "body", id });
  }
  if (st) {
    setNoticeAbout(`${st.name} marked. ${st.sector} port. Point the nose and G to warp.`, st.name);
    return;
  }
  sim.notice = `${body.name} locked. ${body.stats.tierName} yield, ${body.stats.gEarth.toFixed(2)} g. G to warp.`;
  useGameStore.getState().patchHud({ selected: id, notice: sim.notice });
}

export function requestJump() {
  sim.wantJump = true;
}
export function requestScan() {
  sim.wantScan = true;
}

/** Tap the card to send it away early. */
export function dismissNotice() {
  sim.noticeAt = -1e6;
}
/* legacy alias */
export const requestWarp = requestJump;

/** The world under the reticle: smallest angle off the nose inside 0.3 rad, big discs winning ties. */
export function bodyUnderReticle() {
  const ship = sim.ship;
  const f = forwardOf(ship.yaw, ship.pitch);
  let best = null, bestScore = 0.3;
  for (const b of BODIES) {
    bodyPosition(b.id, sim.time, _bp);
    const dx = _bp.x - ship.pos.x, dy = _bp.y - ship.pos.y, dz = _bp.z - ship.pos.z;
    const d = Math.hypot(dx, dy, dz) || 1;
    const ang = Math.acos(clamp((dx * f.x + dy * f.y + dz * f.z) / d, -1, 1));
    const disc = Math.atan2(b.radius ?? 0, d);          // apparent radius
    const score = Math.max(0, ang - disc);               // inside the disc counts as dead on
    if (score < bestScore) { bestScore = score; best = b; }
  }
  return best;
}

function nearestBody() {
  let id = BODIES[0]?.id ?? "sun";
  let best = Infinity;
  for (const b of BODIES) {
    const dd = dist3(sim.ship.pos, bodyPosition(b.id, sim.time, _bp));
    if (dd < best) {
      best = dd;
      id = b.id;
    }
  }
  return { id, dist: best };
}

export function publishHud(labels, plots) {
  const ship = sim.ship;
  const near = nearestBody();
  const scanned = [...sim.scanned];
  const beaconsGot = [...sim.beaconsGot];
  const complete = scanned.length >= surveyIds().length && beaconsGot.length >= BEACONS.length;
  if (complete && !useGameStore.getState().surveyComplete) {
    sim.notice = "Survey complete. The system is mapped.";
    sim.toast = "Survey complete";
    sim.lastToastAt = sim.time;
  }
  /* Any code path that writes a new notice restarts its clock, so the card
   * can fade on its own instead of parking on the canopy forever. */
  if (sim.notice !== sim.lastNotice) {
    sim.lastNotice = sim.notice;
    sim.noticeAt = sim.wall;
  }
  const toastAge = sim.time - sim.lastToastAt;
  const dom = sim.dominant;
  const wp = activeWaypoint();
  let wpDist = 0;
  let wpName = null;
  if (wp) {
    waypointPosition(wp, _bp);
    wpDist = dist3(ship.pos, _bp);
    wpName = wp.name;
  }
  useGameStore.getState().patchHud({
    speed: speedOf(ship, sim.frameVel),
    absSpeed: absSpeedOf(ship),
    closing: closingSpeed(ship, sim.frameVel),
    throttle: ship.throttle,
    boost: ship.throttle > 1,
    nearest: near.id,
    nearestDist: near.dist,
    selected: sim.selected,
    scanned,
    beaconsGot,
    timeScale: sim.timeScale,
    labels,
    surveyComplete: complete,
    warping: sim.warp.state === "run",
    warpState: sim.warp.state,
    flash: sim.flash,
    noticeAbout: sim.noticeAbout ?? null,
    route: sim.selected && sim.warp.state !== "run" && !sim.ship.dockedAt ? plotRoute(sim.selected) : null,
    warpProgress:
      sim.warp.state === "spool"
        ? sim.warp.t / spoolTime()
        : sim.warp.state === "run"
          ? sim.warp.t / sim.warp.dur
          : 0,
    warpBlock: sim.warp.block,
    /* `hazard`, not `threat` — the payload already carries a `threat` for the
     * warp route's obstruction list further down, and a duplicate key in an
     * object literal is silently won by the last one. This read as the
     * avoidance not working at all. */
    hazard: sim.threat && sim.threat.t < AVOID.horizon
      ? { name: sim.threat.name, kind: sim.threat.kind, t: Math.round(sim.threat.t * 10) / 10, level: avoidLevel(sim.threat) }
      : null,
    /* The response clock. A player deciding whether to press an attack on a
     * supply hull is deciding against this number, so it is on the canopy and
     * it is honest: seconds until the first responder is on scene, or the fact
     * that nobody is coming. It shows for any call near enough to matter, not
     * only the player's own — a fight you are flying past is a fight you can
     * join, and knowing when the law arrives is the whole decision. */
    response: (() => {
      const near = nearestCall(ship.pos, 90000);
      if (!near) return null;
      const c = near.call;
      const eta = etaOf(c, sim.time);
      return {
        victim: c.victimName,
        mine: Boolean(c.byPlayer),
        state: c.state,
        onScene: Boolean(c.arrivedAt),
        wing: c.wing.length,
        eta: eta == null ? null : Math.round(eta),
        dist: Math.round(near.dist),
      };
    })(),
    warpCool: sim.warp.cool,
    heat: sim.heat,
    bodyPlots: plots,
    shipXZ: { x: ship.pos.x, z: ship.pos.z },
    notice: sim.notice,
    noticeAge: sim.wall - sim.noticeAt,
    toast: toastAge < 2.6 ? sim.toast : null,
    systemName: currentSystem.name,
    /* cockpit instrumentation */
    charge: ship.charge,
    chargePct: ship.charge / batteryCap(ship),
    load: ship.load,
    reactor: ship.reactor,
    hull: ship.hull,
    hullMax: ship.hullMax ?? 100,
    shieldCharge: ship.shieldCharge,
    shieldMax: ship.shieldMax ?? 100,
    o2: ship.o2,
    gLoad: ship.gLoad,
    debuffs: ship.debuffs.map((x) => x.text),
    brownout: ship.brownout,
    systems: {
      engines: ship.engines,
      shields: ship.shields,
      turrets: ship.turretsArmed,
      pressurized: ship.pressurized,
      gravity: ship.localGravity,
      assist: ship.assist,
    },
    powered: { ...ship.powered },
    turretMode: ship.turretMode,
    miningMode: ship.miningMode,
    targetName: turretAim.combat?.name ?? null,
    targetHostile: turretAim.hasTarget,
    contacts: contacts.length,
    traffic: trafficCensus(),
    flowUp: flow.reduce((a, n) => a + (n.visible ? 1 : 0), 0),
    lane: sim.lane,
    tractor: tractor.active ? { name: tractor.name, left: Math.round(tractor.left ?? tractor.T), progress: tractor.progress ?? 0, why: tractor.why, phase: tractor.phase } : null,
    dockRequest: dockRequest.stId ? { name: dockRequest.name, id: dockRequest.stId } : null,
    approach: sim.approach ? { name: sim.approach.st.name, where: sim.approach.where } : null,
    engagement: sim.engagement && sim.time < sim.engagement.end
      ? `${sim.engagement.victimName} ${Math.round(dist3(sim.ship.pos, fightCentre(sim.engagement)) / 100)} km${sim.engagement.joined ? " IN" : ""}`
      : null,
    skyEvent: sim.skyEvent?.kind ?? "quiet",
    clockSynced: sim.clockSynced,
    miningActive: mining.active,
    miningProgress: mining.progress,
    cargo: cargoTotal(ship),
    cargoCap: ship.cargoCap,
    reticleName: bodyUnderReticle()?.name ?? null,
    dominantName: dom?.name ?? null,
    dominantG: dom ? (dom.mu / Math.max(sim.domDist * sim.domDist, 1)) : 0,
    altitude: sim.altitude,
    escapeV: dom ? dom.stats.escape : 0,
    throttleCap: throttleCap(),
    terminalOpen: sim.terminalOpen,
    termHold: sim.termHold,
    waypointName: wpName,
    waypointDist: wpDist,
    strain: ship.strain,
    lights: ship.lights,
    sentry: ship.sentry,
    salvage: ship.salvage,
    matchLock: ship.matchLock,
    pulse: pulseActive(),
    pulseLeft: Math.max(0, sim.pulseUntil - sim.time),
    debris: chunks.length,
    impactors: impactors.length,
    threat: sim.threats[0] ?? null,
    pilotTitle: title(),
    rank: rankStatus(),
    skyLift: sim.skyLift,
    lockName: sim.lock.name || null,
    lockProgress: sim.lock.progress,
    locked: sim.lock.locked,
    lockDist: sim.lock.dist,
    holding: ship.holding,
    credits: Math.round(ship.credits),
    dockedAt: ship.dockedAt,
    port: (() => {
      const s = stationStatus();
      if (!s) return null;
      return {
        id: s.station.id,
        name: s.station.name,
        sector: s.info.sector,
        mount: s.info.mount,
        colour: s.info.colour,
        dist: s.dist,
        rel: s.rel,
        ok: s.ok,
        why: s.why,
        docked: s.docked,
        hostile: s.station.hostile,
        guards: s.station.guards,
      };
    })(),
  });
}

export function wireControlsTest() {
  window.__lg = {
    sim,
    /* the reactive sky, for the headless smokes and the console: the roster
     * itself, who is answering what, what the nests are doing, and what the
     * frame budget has decided the device can carry */
    traffic,
    trafficCensus,
    /* 0.3: collapsed stars and the impact runs, for the smokes and the console */
    holes: { holes, summonHole, collapseToHole, goSupernova },
    security: { distress, securityReport, securityCorp, etaOf, nearestCall },
    npcCombat: { combatReport, combatLog },
    rogues: { nests, waves, rogueReport },
    perf,
    perfReport,
    setTerminal,
    setTermHold,
    setTune,
    resetTune,
    moveShed,
    cycleRelation,
    setRelation,
    addWaypoint,
    addBodyWaypoint,
    removeWaypoint,
    setActiveWaypoint,
    jettison,
    logEvent,
    togglePointerLock,
    clearLock,
    toggleDock,
    tradeBuy,
    tradeSell,
    claimPort,
    stationStatus,
    stations,
    sensorPulse,
    autoLevel,
    cycleTimeScale,
    damageBody,
    impactors,
    chunks,
    threats: () => sim.threats,
    toggleWarp,
    warpBlock,
    warpStatus,
    warpNodeById,
    warpDestination,
    clearArrival,
    sensorRange,
    losBlocker,
    dismissNotice,
    ship: () => sim.ship,
    getYaw: () => sim.ship.yaw,
    getSpeed: () => speedOf(sim.ship, sim.frameVel),
    setThrottle,
    setKeys: (codes) => setInjectedKeys(codes),
    setPan: (x, y) => setInjectedPan(x === null ? null : { x, y }),
    toggleSystem,
    cycleTurretMode,
    cycleMiningMode,
    setTurretMode,
    setMiningMode,
    contacts,
    shots,
    mining,
  };
}

export { setInjectedKeys, setInjectedPan };
