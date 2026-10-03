import { recoveryBlocker } from "./salvage.js";
import { applyCareerDefaults as careerDefaults, createCareerStepper } from "./career.js";
import { BEACONS, BODIES, applySystem, beaconPosition, bodyById, bodyPosition, bodyVelocity, currentSystem, dist3, hashHue, refreshBody, scanRadius, heatBody, coolBodies, bodyTempK, starBody, surveyIds } from "../world/bodies.js";
import { generateSystem, rngFromSeed, spawnBodyId } from "../world/generate.js";
import { consumeLook, justPressed, sampleInput, setInjectedKeys, setInjectedPan, touch } from "../core/input.js";
import { NAV, SHIP, UI, WARN, setEngineLevel } from "../audio/index.js";
import { loadSave, skyProgress, useGameStore } from "../core/store.js";
import {
  batteryCap,
  MINING_MODES,
  RIG_MODES,
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
  roomFor,
} from "../flight/ship.js";
import { record as tapeRecord } from "../flight/recorder.js";
import { wireFab, stepFab, loadFab, resetFab } from "../economy/fabricate.js";
import { remnantRadius, surfaceGravity } from "../world/scale.js";
import { resetImpacts, startCollision, startStrike, stepImpacts } from "../world/events/impacts.js";
import { resetProbes, stepProbes } from "../flight/probes.js";
import { stepDroneOps, loadDroneOps, noteDroneKill } from "../drones/ops.js";
import { populateNpcDrones, stepNpcDrones, npcDroneHooks, npcDrones, DRONE_LINE } from "../drones/npcdrones.js";
import { board, resetBoard } from "../drones/board.js";
import { chat, post, resetChat } from "../comms/chat.js";
import { gnn, gnnPost, resetGnn } from "../comms/gnn.js";
import { benchValue } from "../economy/icework.js";
import { addChunk, bindDebris, burst, chunkMass, chunks, nearDebris, removeChunk, resetDebris, rubbleRing, stepDebris } from "../world/debris.js";
import { HULK, bindHulks, hulkById, hulkManifest, hulkVelocity, hulks, nearHulks, resetHulks, spawnHulk, stepHulks } from "../world/hulks.js";
import { addRogue, adoptImpactors, impactorWire, impactors, resetImpactors, rogueHooks as rockHooks, setImpactorAuthority, stepImpactors, threatBoard, emptyThreatBoard } from "../world/events/impactors.js";
import { HOLE, adoptHoles, collapseStar, holeRadii, holeWarpBlock, holeWire, holes, nearestHole, resetHoles, spawnTransit, stepHoles } from "../world/events/holes.js";
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
} from "../world/events/cataclysm.js";
import {
  buildStations,
  describeStation,
  dockCheck,
  nearestStation,
  resetStations,
  stationById,
  stations,
  stepStations,
} from "../station/stations.js";
import { ORES, baseValue, good, goodName, priceAt, rollOre } from "../economy/materials.js";
import { stepEconomy, stockMult, lotMult, askPrice, econReport, wantsOf, econHooks } from "../economy/economy.js";
import { labourAt } from "../station/stafflife.js";
import { bookHandling, clearDockwork, handlingLeft, handlingLine, handlingProgress, stepDockwork } from "../station/dockwork.js";
import { buildCorps, corpOfStation, corpOfVessel, corpById, blameKill, adjustStanding, standingMargin, corps } from "../corp/corps.js";
import { applyRaceToShip, applyRaceTune, loadPilot, pilot, rankStatus, savePilot, serveTime, syncMods, takePayout, title, work } from "../flight/pilot.js";
import { DEFAULT_SHIP_ID, hullTuneFor, issuedShips, shipById } from "../ships/shipdb.js";
import { yardQuote } from "../economy/shipcost.js";
import { hullPoolFor, shieldPoolFor, resistsFor } from "../flight/defence.js";
import { claim as insuranceClaim, insure, playerKey, policies, policyFor, resetInsurance } from "../economy/insurance.js";
import { crew, crewHooks, resetCrew, tickCrew } from "../crew/ledger.js";
import { loadRobots, tickRobots } from "../crew/robots.js";
import { fx as upgradeFx, loadUpgrades, upgradeResists, resistKey } from "../economy/upgrades.js";
import { tickPatchDrone, hullMaxOf } from "../flight/repair.js";
import { bookRevenue, loadCompany, tickCompany, treasuryPay } from "../corp/company.js";
import { resetHousehold } from "../crew/family.js";
import { noteKill, noteDestroyed, resetContracts, tickContracts, owedCargo } from "../economy/contracts.js";
import { resetFleet, tickFleet } from "../corp/fleet.js";
import { captain, retakeCommand, tickCaptain } from "../npc/captain.js";
import { crewEffects, updateCrewMods } from "../npc/crewfx.js";
import { eventAt, eventLine, markVesselDown, populateTraffic, resetTraffic, stepTraffic, traffic, trafficCensus, trafficDown, trafficHooks, vesselById, HOSTILE_ROLES, LAW_ROLES, SLOT_S } from "../npc/traffic.js";
import { battleHooks, fightCentre, pirateKilled, resetBattles, stepBattles } from "../npc/battles.js";
import { resetSecurity, stepSecurity, mountSecurity, assignGuards, securityHooks, securityCorp, securityReport, callForHelp, distress, nearestCall, etaOf } from "../npc/security.js";
import { stepSecLevel, resetSecLevel, secHooks, selfVictim, noteKillBySelf, noteHonestHit, noteShot, wingArrived } from "../corp/seclevel.js";
import { resetNpcCombat, stepNpcCombat, mountNpcCombat, combatHooksOut, combatReport, combatLog, damageHull } from "../npc/combat.js";
import { populateNests, stepRogues, mountRogues, rogueHooks, rogueReport, nests, waves } from "../npc/rogues.js";
import { resetPerf, notePerf, perf, perfReport } from "../core/perf.js";
import { populateFlow, resetFlow, stepFlow, flow, portPulse } from "../npc/flow.js";
import { laneOf, laneFlow, stationLane } from "../npc/lanes.js";
import { stepStationWorks, stepTractor, autoTractor, engageTractor, engagePush, releaseTractor, holdOff, tractor, worksReport, worksHooks, dockRequest, requestDock, clearDockRequest, hasDockRequest, unrequestedApproach, inDeparture, PUSH_GRACE } from "../station/stationworks.js";
import { boarding, resetBoarding, tickBoarding } from "../interior/boarding.js";
import { resetIcework, stepIcework } from "../economy/icework.js";
import { applyTerraformSnapshot, resetAtmoWorks, stepAtmoWorks, terraformSnapshot } from "../world/events/atmoworks.js";
import { autopilot, disengageAutopilot, engageAutopilot, tickAutopilot } from "../flight/autopilot.js";
import { TRACTOR_R, TRACTOR_V } from "../station/stations.js";
import { releaseBuilt, carryBuilt, dropCarried } from "../station/stationyard.js";
import { eatRocks, inBelt, nearbyRocks, resetField, rockByKey, siteMarkRock } from "../world/field.js";
import { registerAnchor, resolveAnchor } from "../world/anchors.js";
import { threatTo, avoidAim, avoidLevel, deliberate, surfaceOnly, AVOID } from "../flight/avoid.js";
import { tickContacts, resetContacts } from "../flight/contacts.js";
import { notePlayerChoice } from "../aria/aria.js";
import {
  combatHooks,
  contacts,
  fireRound,
  mining,
  npcTracer,
  resetCombat,
  shots,
  stepMining,
  stepShots,
  stepTurrets,
  syncContacts,
  turretAim, miningHooks } from "../flight/turrets.js";
import { resetRig, rig, rigHooks, rigTarget, stepRig } from "../flight/rig.js";

const WALLET_EVERY = 30;
const LOOK_GAIN = 1;

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
  engagement: null,
  clockSynced: false,
  skySeed: "",
  skyEvent: null,
  telemetry: { at: 0, credits: [], hull: [], heat: [], cargo: [], charge: [], speed: [] },
  worldAuthority: true,
  lostPorts: [],
  warp: {
    state: "idle",
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
    dropped: null,
  },
  trauma: 0,
  heat: 0,
  hullFade: 0,
  interior: null,
  market: { drought: null },
  contract: null,
  impactFX: [],
  flash: 0,
  events: [],
  skyGlow: [],
  skyLift: 0,
  cameraMode: 0,
  cruise: null,
  boostFrom: null,
  scanReports: [],
  stash: {},
  autoPlan: { onDock: "sell", loop: true, seam: null, seamOre: null },
  selfId: "",
  callsign: "",
  color: "#d7dee8",
  lastToastAt: 0,
  toast: null,
  notice: "Survey the system. Fly close and scan.",
  noticeAt: 0,
  lastNotice: "",
  wall: 0,
  pan: { x: 0, y: 0 },
  reducedMotion: false,
  broadcast: (_d) => {},
  send: (_d, _id) => {},
  netSendAcc: 0,
  pulse: 0,
  wantScan: false,
  wantJump: false,
  texLoad: { done: 0, total: 0 },
  lock: { id: null, kind: null, name: "", progress: 0, locked: false, dist: 0, angle: 0 },
  hold: { id: null, kind: null, ox: 0, oy: 0, oz: 0, has: false },
  pulseUntil: -1e6,
  threats: [],
  lastImpact: null,
  terminalOpen: false,
  termHold: false,
  log: [],
  waypoints: [],
  activeWaypoint: null,
  dominant: null,
  ui: { lanesDrawn: false },
  recorders: [],
  domDist: 0,
  altitude: 0,
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

export function getForward(yaw, pitch) {
  return forwardOf(yaw, pitch);
}
export function getRight(yaw) {
  return { x: Math.cos(yaw), y: 0, z: -Math.sin(yaw) };
}

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

export function addAnchoredWaypoint(name, anchor, fallback = null, { reuse = true } = {}) {
  const had = sim.waypoints.find((w) => w.anchor && !w.lost && w.anchor.kind === anchor.kind && w.anchor.id === anchor.id && !w.anchor.off && !w.transient);
  if (reuse && had && !anchor.off) { had.name = name || had.name; sim.activeWaypoint = had.id; return had; }
  const wp = addWaypoint(name);
  wp.anchor = { ...anchor };
  const p = resolveAnchor(wp.anchor, sim.time, _ap);
  if (p) { wp.x = p.x; wp.y = p.y; wp.z = p.z; }
  else {
    if (fallback) { wp.x = fallback.x; wp.y = fallback.y; wp.z = fallback.z; }
    markLost(wp);
  }
  wp._at = sim.time;
  return wp;
}

function markLost(wp) {
  if (wp.lost) return;
  wp.lost = true;
  if (!/\(last seen\)$/.test(wp.name)) wp.name = `${wp.name} (last seen)`;
}
const _ap = { x: 0, y: 0, z: 0 };

export function waypointPosition(wp, out) {
  const o = out ?? { x: 0, y: 0, z: 0 };
  if (wp.body) return bodyPosition(wp.body, sim.time, o);
  if (wp.anchor && !wp.lost) {
    if (wp._at !== sim.time) {
      const was = wp.anchor.key;
      const p = resolveAnchor(wp.anchor, sim.time, _ap);
      if (p) {
        const dt = sim.time - (wp._at ?? sim.time);
        if (was !== wp.anchor.key) { wp.vx = 0; wp.vy = 0; wp.vz = 0; }
        else if (dt > 0) {
          wp.vx = (p.x - wp.x) / dt; wp.vy = (p.y - wp.y) / dt; wp.vz = (p.z - wp.z) / dt;
          if (Math.hypot(wp.vx, wp.vy, wp.vz) > 6000) { wp.vx = 0; wp.vy = 0; wp.vz = 0; }
        }
        wp.x = p.x; wp.y = p.y; wp.z = p.z;
      } else markLost(wp);
      wp._at = sim.time;
    }
  }
  o.x = wp.x;
  o.y = wp.y;
  o.z = wp.z;
  return o;
}

export function waypointVelocity(wp, out) {
  const o = out ?? { x: 0, y: 0, z: 0 };
  if (wp.body) return bodyVelocity(wp.body, sim.time, o);
  const live = wp.anchor && !wp.lost;
  o.x = live ? wp.vx ?? 0 : 0; o.y = live ? wp.vy ?? 0 : 0; o.z = live ? wp.vz ?? 0 : 0;
  return o;
}

const put = (out, q) => { out.x = q.x; out.y = q.y; out.z = q.z; return out; };
registerAnchor("body", (a, t, out) => (bodyById(a.id) ? bodyPosition(a.id, t, out) : null));
registerAnchor("station", (a, t, out) => {
  const st = stationById(a.id);
  if (!st) return null;
  out.x = st.x + (a.off?.x ?? 0); out.y = st.y + (a.off?.y ?? 0); out.z = st.z + (a.off?.z ?? 0);
  return out;
});
registerAnchor("asteroid", (a, t, out) => { const r = rockByKey(a.id, t); if (!r) return null; a.label = r.oreName; return put(out, r); });
registerAnchor("site", (a, t, out) => {
  const r = siteMarkRock(a.id, t, a.key);
  if (!r) return null;
  a.key = r.key; a.label = r.oreName; a.r = r.r;
  return put(out, r);
});
registerAnchor("vessel", (a, t, out) => { const n = vesselById(a.id); return n && n.job !== "down" ? put(out, n) : null; });
registerAnchor("boat", (a, t, out) => { const n = flow.find((b) => b.id === a.id); return n ? put(out, n) : null; });
registerAnchor("nest", (a, t, out) => { const n = nests.find((x) => x.id === a.id); return n && n.hp > 0 ? put(out, n) : null; });
registerAnchor("beacon", (a, t, out) => { const d = BEACONS.find((b) => b.id === a.id); return d ? put(out, beaconPosition(d, t)) : null; });
registerAnchor("rock", (a, t, out) => { const m = impactors.find((x) => x.id === a.id); return m ? put(out, m) : null; });
registerAnchor("debris", (a, t, out) => { const c = chunks.find((x) => x.id === a.id); return c ? put(out, c) : null; });
registerAnchor("hulk", (a, t, out) => { const h = hulkById(a.id); if (!h) return null; a.label = h.name; return put(out, h); });

export function activeWaypoint() {
  return sim.waypoints.find((w) => w.id === sim.activeWaypoint) ?? null;
}

export const SMELT_FEE = 0.06;
export const SMELT_SECTORS = new Set(["industrial", "military", "logistic"]);

function stashOf(stId) {
  if (!sim.stash[stId]) sim.stash[stId] = {};
  return sim.stash[stId];
}

export function stashAt(stId) {
  const st = sim.stash[stId] ?? {};
  return Object.entries(st).filter(([, q]) => q > 1e-6).map(([id, qty]) => ({ id, name: goodName(id), qty }));
}

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

function wireRigHooks() {
  rigHooks.onSection = (h, s, out) => {
    const bits = [`${out.plate} ${goodName(HULK.plate).toLowerCase()} scrap`];
    if (out.parts) bits.push(`${out.parts} parts`);
    if (out.lost) bits.push(`${out.lost} parts lost to the cut`);
    if (out.cargo) bits.push(`${out.cargo.qty} ${goodName(out.cargo.id)}`);
    logEvent(`Rig: ${s.name} off the ${h.name} — ${bits.join(", ")}`, "cargo");
    if (!sim.ship.salvage) setNoticeAbout(`The ${s.name} is cut loose and drifting. SALVG reels it in.`, "RIG");
  };
  rigHooks.onRecorder = (h, kept) => {
    if (kept) {
      sim.recorders.push({ vessel: h.vessel, name: h.vesselName, owner: h.owner ?? null, at: sim.time });
      work("law", 2);
      setNoticeAbout(`Flight recorder off the ${h.vesselName} is aboard, intact.`, "RIG");
      logEvent(`Recovered the ${h.vesselName}'s flight recorder`, "cargo");
    } else {
      setNoticeAbout(`The ${h.vesselName}'s flight recorder went with the bridge. CUT does not spare it — STRIP does.`, "RIG");
      logEvent(`The ${h.vesselName}'s flight recorder was destroyed in the cut`, "cargo");
    }
  };
  rigHooks.onDone = (h) => {
    sim.toast = `${h.vesselName} is cut up — nothing left to work`;
    sim.lastToastAt = sim.time;
    logEvent(`The ${h.name} is cut up`, "cargo");
    SHIP.collect();
  };
}

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

export function sellAllOre() {
  const ship = sim.ship;
  const st = stationById(ship.dockedAt);
  if (!st) return 0;
  const before = ship.credits;
  let sold = 0;
  const owed = owedCargo();
  sim.oreKept = {};
  for (const k of Object.keys(ship.hold)) {
    const g = good(k);
    if (!g || (g.tier !== "ore" && g.tier !== "mineral")) continue;
    const q = Math.max(0, ship.hold[k] - (owed[k] ?? 0));
    if (ship.hold[k] > q) sim.oreKept[k] = ship.hold[k] - q;
    if (q <= 0) continue;
    sold += q;
    tradeSell(k, q);
  }
  if (sold > 0 && !sim.handsOff) notePlayerChoice("port", st.id, Math.min(3, 0.5 + sold / 120));
  return ship.credits - before;
}

export function jettison(id, amount) {
  const drop = takeCargo(sim.ship, id, amount === "all" ? Infinity : amount);
  if (drop > 0) logEvent(`Jettisoned ${Math.round(drop)} ${goodName(id)}`, "cargo");
}

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

export function setNoticeAbout(text, name) {
  sim.notice = text;
  sim.noticeAbout = { text, name };
}

const fmtKm = (u) => `${(u / 100).toFixed(u < 10000 ? 1 : 0)} km`;

export function toggleDock({ queue = false } = {}) {
  const ship = sim.ship;
  if (tractor.active) {
    const st = stationById(tractor.stId);
    if (tractor.phase === "push") {
      setNoticeAbout(`${st?.name ?? "Port"} control: departure in progress — ${Math.ceil(tractor.left ?? 0)} s to release. Hands off the helm.`, st?.name ?? "PORT");
      WARN.caution();
      return false;
    }
    releaseTractor();
    setNoticeAbout(`${st?.name ?? "Port"} control released the tractor. You have the helm.`, st?.name ?? "PORT");
    logEvent(`Tractor lock released at ${st?.name ?? "port"}`, "port");
    return false;
  }
  if (ship.dockedAt) {
    const wait = handlingLeft(ship.dockedAt);
    if (wait > 0) {
      const at = stationById(ship.dockedAt);
      if (queue) {
        if (sim.undockWhenClear === ship.dockedAt) {
          sim.undockWhenClear = null;
          setNoticeAbout(`${at?.name ?? "Port"} control: departure cancelled — clamps stay on.`, at?.name ?? "PORT");
          return false;
        }
        sim.undockWhenClear = ship.dockedAt;
        setNoticeAbout(`${at?.name ?? "Port"} control: departure booked — clamps off when the crane is done (${handlingLine()}).`, at?.name ?? "PORT");
        return false;
      }
      setNoticeAbout(`${at?.name ?? "Port"} control: cargo handling — ${handlingLine()}. Clamps stay on.`, at?.name ?? "PORT");
      return false;
    }
    sim.undockWhenClear = null;
    const st = stationById(ship.dockedAt);
    if (st) st.docked = false;
    ship.dockedAt = null;
    clearDockRequest();
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
    if (s.station.hangars?.length && !(s.station.hostile && !s.station.claimed)) {
      if (autopilot.on && autopilot.targetId === s.station.id) {
        if (autopilot.mode === "approach") {
          disengageAutopilot("waved off");
          setNoticeAbout(`${s.station.name} control: approach waved off. You have the helm; the berth stands.`, s.station.name);
          return false;
        }
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
  sim.approach = unrequestedApproach(ship, sim.time);
}

export function tradeBuy(id, qty) {
  const ship = sim.ship;
  const st = stationById(ship.dockedAt);
  if (!st) return "Not docked";
  const line = st.stock.find((x) => x.id === id);
  if (!line) return "Not stocked";
  const want = Math.min(qty, line.qty, Math.floor(roomFor(ship, id)));
  const price = buyPriceAt(st, line, want);
  const take = Math.min(want, Math.floor(ship.credits / price));
  if (take <= 0) return roomFor(ship, id) < 1 ? "Hold full" : "Cannot afford";
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

export function sellPriceAt(st, id, qty = 1) {
  return Math.max(1, Math.round(priceAt(st.sector, id, "buy") * lotMult(st, id, qty, +1) * standingMargin(corpOfStation(st)) * (sim.ship.mods?.sell ?? 1) * marketMult(st, id)));
}

export function marketMult(st, id) {
  const d = sim.market?.drought;
  if (d && sim.time < d.until && d.sectors.includes(st.sector)) {
    if (id === "water") return d.mult;
    if (id === "water_ice") return 1 + (d.mult - 1) * 0.55;
    if (id === "ration") return 1.3;
  }
  const ev = sim.skyEvent;
  if (ev?.kind === "ice_rush" && sim.time < ev.until && (id === "water_ice" || id === "methane_ice")) {
    return ev.mult ?? 1.8;
  }
  return 1;
}

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

let marketSlot = -1, marketSeed = null;
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

export function buyPriceAt(st, line, qty = 1) {
  return Math.max(1, Math.round(askPrice(st, line.id, qty) * (sim.ship.mods?.buy ?? 1)));
}

export function portLedger(st) { return econReport(st); }
export function portWants(st, n = 3) { return wantsOf(st, n); }

export function tradeSell(id, qty) {
  const ship = sim.ship;
  const st = stationById(ship.dockedAt);
  if (!st) return "Not docked";
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
  applyRaceTune(sim.ship);
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
  if (sim.skySeed === seed && stations.length) carryBuilt(stations);
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
  resetHulks();
  resetRig();
  sim.recorders.length = 0;
  resetImpactors(rngFromSeed(`${seed}:rocks`));
  resetHoles();
  resetImpacts();
  sim.events.length = 0;
  sim.skyGlow.length = 0;
  sim.skyLift = 0;
  sim.impactFX.length = 0;
  for (const b of BODIES) { b.event = null; b.ring = null; b.nova = false; b.collapsed = false; b.tidal = 0; b.moltenGlow = 0; }
  bindDebris(sim);
  bindHulks(sim);
  resetStations();
  buildStations(sys, rngFromSeed(`${seed}:ports`), String(seed));
  dropCarried();
  stepStations(sim.time);
  buildCorps(rngFromSeed(`${seed}:corps`));
  if (pilot.restored) {
    const table = pilot.record?.standing?.[String(seed)];
    if (table) for (const c of corps) if (Number.isFinite(table[c.id])) c.standing = Math.max(-100, Math.min(100, table[c.id]));
  }
  for (const st of stations) st.guards0 = st.guards ?? 0;
  sim.skySeed = seed;
  resetPerf();
  populateTraffic(seed, stations, sys);
  populateFlow(seed, stations);
  board.clock = () => sim.time;
  resetBoard();
  populateNpcDrones(seed);
  resetBattles(seed);
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

function wireReactiveSky() {
  combatHooks.onHit = (c, damage, owner, time) => {
    if (c.kind !== "npc") return;
    const n = vesselById(c.id);
    if (!n) return;
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

  combatHooksOut.onDown = (n, byId, t) => {
    leaveHulk(n, "combat");
    const by = byId && byId !== "self" ? vesselById(byId) : null;
    if (HOSTILE_ROLES.has(n.role) || n.rogue) {
      if (by && LAW_ROLES.has(by.role)) {
        const law = securityCorp();
        if (law) adjustStanding(law.id, 2, `destroyed ${n.name}`);
        gnnPost({ desk: "security", title: "RAIDER DOWN", body: `${by.name} destroyed ${n.name}.` });
      }
      return;
    }
    const co = corpOfVessel(n);
    if (co) adjustStanding(co.id, -2, `lost ${n.name}`);
    if (n.role === "supply" && n.supplyFor) {
      const st = stations.find((x) => x.id === n.supplyFor);
      if (st) logEvent(`${st.name} will not get that delivery — ${n.name} was destroyed`, "combat");
    }
    sim.send({ t: "vdown", id: n.id, until: trafficDown[n.id] });
  };

  econHooks.labour = labourAt;
  crewHooks.port = () => sim.ship?.dockedAt ?? null;

  securityHooks.selfVictim = selfVictim;
  secHooks.log = logEvent;
  secHooks.toast = (m) => { sim.toast = m; sim.lastToastAt = sim.time; };

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
    if (call.sos) {
      const pay = wingArrived(call, sim.time, sim.ship);
      if (pay && !pay.cr) { sim.toast = `${n.name} is on scene.`; sim.lastToastAt = sim.time; }
      return;
    }
    if (!call.byPlayer) return;
    sim.toast = `${n.name} is on scene.`;
    sim.lastToastAt = sim.time;
  };
  rockHooks.spare = (b) => {
    const fam = (id) => BODIES.find((x) => x.id === id)?.parent ?? id;
    const f = fam(b.id);
    if (f === fam(spawnBodyId(currentSystem))) return true;
    return stations.some((st) => st.hostId && fam(st.hostId) === f);
  };
  npcDroneHooks.hostiles = () => contacts.filter((c) => c.relation === "hostile" && c.hp > 0 && c.kind !== "cdrone");
  npcDroneHooks.fire = (u, to, targetId) => fireRound(u, to, 800, DRONE_LINE.guardDamage, u.id, "npc-port", null, targetId);
  npcDroneHooks.patchFor = (u, home) => {
    const ship = sim.ship;
    if (!ship || ship.dockedAt || ship.outlaw || sim.phase !== "play") return null;
    const max = hullMaxOf(ship);
    if (ship.hull >= max - 0.5) return null;
    if (sim.time - (ship.lastHitAt ?? -1e9) < DRONE_LINE.quietFor) return null;
    if (Math.hypot(ship.pos.x - home.x, ship.pos.y - home.y, ship.pos.z - home.z) > DRONE_LINE.repairReach) return null;
    const co = corpById(u.corpId);
    if (co && (co.standing ?? 0) < -10) return null;
    if (!u.toldAt || sim.time - u.toldAt > 300) { u.toldAt = sim.time; logEvent(`${home.name}'s repair drone is patching your hull`, "port"); }
    return { x: ship.pos.x, y: ship.pos.y, z: ship.pos.z, vx: 0, vy: 0, vz: 0, name: "your hull", heal: (a) => { ship.hull = Math.min(max, ship.hull + a); } };
  };
  combatHooks.onFire = (c, t) => noteShot(c, t, sim.lock?.id ?? null);

  worksHooks.onBatteryHit = (n, amount, st, time) => {
    const killed = damageHull(n, amount, `${st.id}:battery`, time);
    if (killed) logEvent(`${st.name} batteries destroyed ${n.name}`, "combat");
  };

  rogueHooks.onLaunch = (wave, nest) => {
    if (!nest.known) return;
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

function seedOrbit(ship, body, time) {
  bodyPosition(body.id, time, _bp);
  const r = body.radius * 4.6;
  ship.pos.x = _bp.x + r * 0.94;
  ship.pos.y = _bp.y + r * 0.2;
  ship.pos.z = _bp.z + r * 0.27;
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
  if (pilot.corpId && !pilot.restored) adjustStanding(pilot.corpId, 25, "signed on");
  sim.activeHullId = null;
  sim.ownedHulls = [];
  resetInsurance();
  if (pilot.restored) {
    const rec = pilot.record ?? null;
    sim.ownedHulls = (rec?.hulls ?? []).filter((id) => shipById(id));
    sim.activeHullId = sim.ownedHulls.includes(rec?.activeHull) ? rec.activeHull : null;
    for (const p of rec?.cover ?? []) if (p?.key?.startsWith("player:") && sim.ownedHulls.includes(p.key.slice(7))) insure(p.key, p.tier, p.value, p.at ?? 0);
  }
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
  chat.clock = () => sim.time;
  gnn.clock = () => sim.time;
  resetChat();
  resetGnn();
  loadDroneOps();
  resetFab();
  loadFab();
  wireMiningHooks();
  wireRigHooks();
  sim.selected = home;
  applyRaceToShip(ship);
  applyCareerDefaults(ship);
  const purse = loadSave().credits;
  if (Number.isFinite(purse) && purse !== null) ship.credits = purse;
  sim.walletSaved = Math.round(ship.credits);
  sim.walletAt = sim.wall;
  savePilotRecord();
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
    terraform: terraformSnapshot(),
    terraBonds: [...(sim.terraBonds ?? [])],
    credits: Math.round(ship.credits),
    surveyComplete: sim.scanned.size >= surveyIds().length && sim.beaconsGot.size >= BEACONS.length,
  });
  useGameStore.getState().persist();
}

export function applyCareerDefaults(ship) {
  return careerDefaults(ship, pilot);
}

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

export function currentShipId() {
  if (sim.activeHullId && shipById(sim.activeHullId)) return sim.activeHullId;
  return DEFAULT_SHIP_ID;
}

export function issuedHullId() {
  try {
    const line = issuedShips(pilot.complexId, rankStatus().letter);
    if (line.length) return line[line.length - 1].id;
  } catch {}
  return null;
}

let _hullTune = hullTuneFor(null);
function syncHullTune(ship) {
  const id = currentShipId();
  if (_hullTune.id !== id || ship.hullTune !== _hullTune) {
    if (_hullTune.id !== id) _hullTune = hullTuneFor(shipById(id));
    ship.hullTune = _hullTune;
    ship.mods = null;
  }
  syncHullDefence(ship, id);
  return _hullTune;
}

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
  ship.resists = resistsFor(def, { ...(ship.mods ?? {}), resist: upgradeResists() });
  if (hullNow > hullWas) ship.hull = Math.min(hullNow, ship.hull + (hullNow - hullWas));
  ship.hull = Math.min(ship.hull, hullNow);
  ship.shieldCharge = Math.min(ship.shieldCharge, shieldNow);
}

const WRONG_WAY_GRACE = 6;
function stepLaneDiscipline(dt) {
  const ship = sim.ship;
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

export function laneCredit(st) {
  if (sim.lane?.portId === st.id && sim.lane.which === "entry" && !sim.lane.wrong) {
    const co = corpOfStation(st);
    if (co) adjustStanding(co.id, 0.6, "clean lane approach");
    logEvent(`Clean entry-lane approach at ${st.name}`, "port");
    return true;
  }
  return false;
}

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

function savePilotRecord() {
  if (!pilot.character) return false;
  const cover = [...policies.values()].filter((p) => p.key.startsWith("player:")).map((p) => ({ key: p.key, tier: p.tier, value: p.value, at: p.at }));
  const standing = { ...(loadPilot()?.standing ?? {}) };
  if (sim.skySeed != null && corps.length) standing[String(sim.skySeed)] = Object.fromEntries(corps.map((c) => [c.id, Math.round(c.standing * 10) / 10]));
  return savePilot({ hulls: [...(sim.ownedHulls ?? [])], activeHull: sim.activeHullId ?? null, cover, standing });
}

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

function tryAssay() {
  const ship = sim.ship;
  const f = forwardOf(ship.yaw, ship.pitch);
  const inCone = (x, y, z, d) => d > 1 && ((x - ship.pos.x) * f.x + (y - ship.pos.y) * f.y + (z - ship.pos.z) * f.z) / d > 0.35;
  const reach = 2600 * (ship.mods?.scan ?? 1);

  for (const { h, d } of nearHulks(ship.pos, reach)) {
    if (!inCone(h.x, h.y, h.z, d)) continue;
    const m = hulkManifest(h);
    const hold = Object.entries(m.cargo).map(([id, q]) => `${q} ${goodName(id)}`).join(", ");
    setNoticeAbout(`Hulk assay — ${h.vesselName}, ${h.hullName}: ${m.left}/${m.sections} sections uncut, ~${m.plate} ${goodName(HULK.plate).toLowerCase()} scrap, ${m.partCount} parts${hold ? `, hold ${hold}` : ""}${m.box ? ", recorder aboard" : ""}.`, "HULK");
    logEvent(`Assayed the ${h.name} at ${Math.round(d)} u — ${m.sections} sections, ${m.plate} scrap, ${m.partCount} parts`, "survey");
    if (!h.assayed) { h.assayed = true; work("salvage", 1); }
    SHIP.collect();
    return true;
  }

  let bestChunk = null;
  for (const { c, d } of nearDebris(ship.pos, reach)) {
    if (!inCone(c.x, c.y, c.z, d)) continue;
    bestChunk = { c, d };
    break;
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
  const sampler = rngFromSeed(`${bestId}:sample`);
  const deposits = body.arch?.ores?.length ? body.arch.ores : null;
  const hot = (body.thermal ?? 0) > 60;
  for (let i = 0; i < 3; i++) {
    const ore = deposits
      ? ORES.find((o) => o.id === deposits[Math.min(deposits.length - 1, Math.floor(sampler() * sampler() * deposits.length))]) ?? rollOre(body.kind, sampler)
      : rollOre(body.kind === "star" ? "gas" : body.kind, sampler);
    const heatMul = !hot ? 1 : ore.id.endsWith("_ice") || ore.id === "tholins" ? 0.45 : 1.35;
    addCargo(sim.ship, ore.id, Math.max(1, Math.round(st.yieldRate * (0.2 + sampler() * 0.5) * heatMul)));
  }
  if (hot) logEvent(`${body.name} is impact-heated (${Math.round(bodyTempK(body))} K) — excavated metals rich, volatiles boiling off`, "survey");
  sim.send({ t: "scan", body: bestId, name: sim.callsign });
  persistProgress();
}

export function wellEdge(body) {
  if (!body || body.kind === "star") return 0;
  const r = remnantRadius(body);
  const byGravity = Math.sqrt((body.mu ?? 0) / WARP.wellG);
  return Math.max(r * WARP.wellClear, Math.min(r * WARP.wellFar, byGravity));
}

export function wellG(body, dist) {
  if (!body || body.kind === "star" || !(dist > 0)) return 0;
  return (body.mu ?? 0) / (dist * dist) / 25;
}

export const WARP = {
  wellG: 0.5,
  wellClear: 1.35,
  wellFar: 8,
  wellFloorG: 0.005,
  spool: 6,
  draw: 95,
  cool: 8,
  minCharge: 300,
  losMargin: 1.4,
  starClear: 6,
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
  const wp = sim.waypoints.find((w) => w.id === id);
  if (wp) {
    if (wp.body) return warpNodeById(wp.body);
    return {
      id, name: wp.name, kind: "point", radius: 0, arriveR: POINT_ARRIVE_R, body: null, point: wp,
      pos: (out) => waypointPosition(wp, out ?? { x: 0, y: 0, z: 0 }),
      vel: (out) => waypointVelocity(wp, out ?? { x: 0, y: 0, z: 0 }),
    };
  }
  return null;
}

export const POINT_ARRIVE_R = 1500;

export function warpDestination(target, out) {
  const o = out ?? { x: 0, y: 0, z: 0 };
  const node = target.pos ? target : warpNodeById(target.id);
  node.pos(_bp);
  if (node.kind === "point") {
    o.x = _bp.x; o.y = _bp.y; o.z = _bp.z;
    return o;
  }
  const offset = node.kind === "station" ? node.radius * 6 + 900 : node.radius * 3.1 + 500;
  o.x = _bp.x + offset;
  o.y = _bp.y + node.radius * 0.4;
  o.z = _bp.z;
  return o;
}

export function losBlocker(from, to, ignoreId) {
  for (const b of BODIES) {
    if (b.id === ignoreId) continue;
    bodyPosition(b.id, sim.time, _obs);
    const miss = segmentMiss(_obs.x, _obs.y, _obs.z, from.x, from.y, from.z, to.x, to.y, to.z);
    if (miss < b.radius * WARP.losMargin) return b;
  }
  return null;
}

export function warpBlock(targetId) {
  const ship = sim.ship;
  const id = targetId ?? sim.selected;
  if (!id) {
    if (sim.lock.id && !warpNodeById(sim.lock.id)) return "LOCK NOT A WARP NODE";
    return "NO TARGET";
  }
  const body = warpNodeById(id);
  if (!body) return "NO TARGET";
  if (ship.dockedAt) return "CLAMPS ON";
  if (!ship.engines || !ship.powered.engines) return "MAINS COLD";
  if (sim.warp.cool > 0) return `CORE COOLING ${Math.ceil(sim.warp.cool)}s`;
  if (ship.charge < WARP.minCharge) return "CHARGE LOW";

  const dom = sim.dominant;
  if (dom && dom.kind !== "star" && sim.domDist < wellEdge(dom)) {
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

export function spoolTime() {
  return WARP.spool * (sim.ship.mods?.warp ?? 1);
}

export const ALIGN_DEG = 10;

export const DROPOUT_ODDS = { belt: 0.35, rock: 0.55, graze: 0.9, traffic: 0, impact: 1 };

let _routeCache = { key: "", route: null };
const _rp = { x: 0, y: 0, z: 0 };

export function alignmentTo(dest) {
  const ship = sim.ship;
  const dx = dest.x - ship.pos.x, dy = dest.y - ship.pos.y, dz = dest.z - ship.pos.z;
  const d = Math.hypot(dx, dy, dz) || 1;
  const f = forwardOf(ship.yaw, ship.pitch);
  return (Math.acos(clamp((dx * f.x + dy * f.y + dz * f.z) / d, -1, 1)) * 180) / Math.PI;
}

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
  for (const m of impactors) {
    const miss = segmentMiss(m.x, m.y, m.z, ship.pos.x, ship.pos.y, ship.pos.z, dest.x, dest.y, dest.z);
    if (miss < 2600) hazards.push({ kind: "rock", name: m.name, at: clamp(dist3(ship.pos, m) / Math.max(1, dist), 0, 1), note: `${m.name} track crosses the lane (${Math.round(miss)} u)` });
  }
  for (const h of holes) {
    const miss = segmentMiss(h.x, h.y, h.z, ship.pos.x, ship.pos.y, ship.pos.z, dest.x, dest.y, dest.z);
    const R = holeRadii(h, {});
    if (miss >= R.danger) continue;
    const fatal = miss < R.roche;
    const hz = { kind: fatal ? "impact" : "graze", name: h.name, at: clamp(dist3(ship.pos, h) / Math.max(1, dist), 0, 1), miss: Math.round(miss), note: fatal ? `${h.name} — the lane crosses its disk` : `${h.name} tidal graze (${Math.round(miss)} u)` };
    if (fatal && !impact) impact = hz;
    hazards.push(hz);
  }
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
    eta: 0,
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

function warpDropout(h, u) {
  const w = sim.warp;
  const ship = sim.ship;
  w.state = "idle";
  w.t = 0;
  w.cool = WARP.cool * 1.5;
  const d = dist3(w.from, w.to) || 1;
  const k = 140 / d;
  ship.vel.x = (w.to.x - w.from.x) * k;
  ship.vel.y = (w.to.y - w.from.y) * k;
  ship.vel.z = (w.to.z - w.from.z) * k;
  sim.trauma = Math.min(1, sim.trauma + 0.7 * (ship.mods?.gTol ?? 1));
  applyDamage(ship, h.kind === "rock" ? 22 : 10, null, sim.time, "kinetic");
  w.dropped = { kind: h.kind, name: h.name ?? h.kind, at: sim.time, frac: u };
  const msg = `CORE DROPOUT at ${Math.round(u * 100)}% — ${h.note}`;
  sim.notice = msg;
  sim.toast = h.kind === "belt" ? "Core dropout — you are in the rocks" : "Core dropout";
  sim.lastToastAt = sim.time;
  logEvent(msg, "nav");
  WARN.caution();
  work("navigation", 2);
}

const WARP_TURN_IN = 0.1;
const WARP_TURN_OUT = 0.9;

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
  w.dur = clamp(dist3(ship.pos, to) / 55000, 3, 45);
  w.from = { ...ship.pos };
  w.to = to;
  w.fromYaw = ship.yaw;
  w.fromPitch = ship.pitch;
  w.toYaw = Math.atan2(-dx / horiz, -dz / horiz);
  w.toPitch = clamp(Math.atan2(dy, horiz), -0.4, 0.4);
  {
    const lx = to.x - ship.pos.x, ly = to.y - ship.pos.y, lz = to.z - ship.pos.z;
    const lh = Math.hypot(lx, lz) || 1;
    w.laneYaw = Math.atan2(-lx / lh, -lz / lh);
    w.lanePitch = clamp(Math.atan2(ly, lh), -1.2, 1.2);
  }
  NAV.spool(spoolTime());
  sim.trauma = Math.min(1, sim.trauma + 0.4);
  sim.notice = `Warp to ${body.name}.`;
}

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
let blockAt = -1, blockFor = null, blockCool = false, blockDom = null;
const _blockAtPos = { x: 0, y: 0, z: 0 };

export function stepWarp(dt) {
  const w = sim.warp;
  const ship = sim.ship;

  if (w.cool > 0) w.cool = Math.max(0, w.cool - dt);
  if (w.state !== "idle") { w.block = ""; blockAt = -1; }
  else if (sim.wall - blockAt >= 0.2 || sim.selected !== blockFor || (w.cool > 0) !== blockCool || sim.dominant !== blockDom || dist3(ship.pos, _blockAtPos) > 1000) {
    w.block = warpBlock();
    blockAt = sim.wall; blockFor = sim.selected; blockCool = w.cool > 0; blockDom = sim.dominant;
    _blockAtPos.x = ship.pos.x; _blockAtPos.y = ship.pos.y; _blockAtPos.z = ship.pos.z;
  }

  if (w.state === "spool") {
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
    const f = clamp(w.t / w.dur, 0, 1);
    const laneYaw = w.laneYaw ?? w.toYaw, lanePitch = w.lanePitch ?? w.toPitch;
    if (f < WARP_TURN_IN) {
      const k = easeInOut(f / WARP_TURN_IN);
      ship.yaw = w.fromYaw + wrapPi(laneYaw - w.fromYaw) * k;
      ship.pitch = lerp(w.fromPitch, lanePitch, k);
    } else if (f < WARP_TURN_OUT) {
      ship.yaw = laneYaw;
      ship.pitch = lanePitch;
    } else {
      const k = easeInOut((f - WARP_TURN_OUT) / (1 - WARP_TURN_OUT));
      ship.yaw = laneYaw + wrapPi(w.toYaw - laneYaw) * k;
      ship.pitch = lerp(lanePitch, w.toPitch, k);
    }
    ship.aimYaw = ship.yaw;
    ship.aimPitch = ship.pitch;
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
      const roll = sim.dropoutRoll ?? Math.random();
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

function impact(ship, nx, ny, nz, surfaceDist, name) {
  const fv = sim.frameVel;
  const radial = ship.vel.x * nx + ship.vel.y * ny + ship.vel.z * nz;
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
    applyDamage(ship, (speed - 22) * 0.32, null, sim.time, "kinetic");
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
    } else if (b.kind === "star") {
      const glow = b.radius * 2.4;
      if (d < glow) {
        const t = 1 - d / glow;
        sim.heat = Math.max(sim.heat, t);
        applyDamage(ship, t * t * 26 * dt * (ship.mods?.heat ?? 1), null, sim.time, "thermal");
      }
    } else if ((b.thermal ?? 0) > 60 && d < b.radius * 2.4) {
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

const LOCK_CONE = 0.32;
const LOCK_BREAK = 1.05;
const _lp = { x: 0, y: 0, z: 0 };
const _lv = { x: 0, y: 0, z: 0 };

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
  const ship = sim.ship;
  for (const r of nearbyRocks(ship.pos, sim.time, 1)) {
    out.push({ kind: "asteroid", id: r.key, name: `${r.oreName ?? "Rock"} ${r.ice ? "ice " : ""}rock`, x: r.x, y: r.y, z: r.z, sig: r.r });
  }
  for (const { c } of nearDebris(ship.pos, LOCK_DEBRIS_RANGE)) {
    out.push({ kind: "debris", id: c.id, name: `Debris (${goodName(c.good ?? "iron_ore")})`, x: c.x, y: c.y, z: c.z, sig: Math.max(6, c.r) });
  }
  for (const { h } of nearHulks(ship.pos, LOCK_HULK_RANGE)) {
    out.push({ kind: "hulk", id: h.id, name: h.name, x: h.x, y: h.y, z: h.z, sig: hulkSig(h) });
  }
  return out;
}

const LOCK_DEBRIS_RANGE = 9000;
const LOCK_HULK_RANGE = 40000;
const hulkSig = (h) => Math.max(14, (h?.r ?? 7) * 2);

function candidateSig(kind, id) {
  if (kind === "body") return bodyById(id)?.radius ?? 12;
  if (kind === "station") return (stations.find((s) => s.id === id)?.radius ?? 4) * 3;
  if (kind === "rock") return impactors.find((m) => m.id === id)?.r ?? 12;
  if (kind === "asteroid") return nearbyRocks(sim.ship.pos, sim.time, 1).find((r) => r.key === id)?.r ?? 12;
  if (kind === "debris") return Math.max(6, chunks.find((c) => c.id === id)?.r ?? 6);
  if (kind === "hulk") return hulkSig(hulkById(id));
  if (kind === "waypoint") return 400;
  return 14;
}

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
            : kind === "hulk"
              ? hulkById(id)
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
    if (wp) return waypointVelocity(wp, o);
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
  if (kind === "hulk") return hulkVelocity(hulkById(id), o);
  const src =
    kind === "contact" ? contacts.find((c) => c.id === id)
      : kind === "rock" ? impactors.find((m) => m.id === id)
        : kind === "debris" ? chunks.find((c) => c.id === id)
          : null;
  o.x = src?.vx ?? 0;
  o.y = src?.vy ?? 0;
  o.z = src?.vz ?? 0;
  return o;
}

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
  setNavTarget(null);
  if (had && why) sim.notice = why;
}

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

export function acquireLock(c) {
  const best = c.name ? c : lockCandidates().find((k) => k.kind === c.kind && k.id === c.id);
  if (!best) return null;
  sim.lock.id = best.id;
  sim.lock.kind = best.kind;
  sim.lock.name = best.name;
  sim.lock.progress = 0;
  sim.lock.locked = false;
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

const _anchorPos = { x: 0, y: 0, z: 0 };

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
    depth: depth0,
    depth0,
    rough: 1,
    seed: (((body.craters.length + 1) * 131 + Math.round(severity * 997)) >>> 0) || 7,
  });
  if (body.craters.length > 12) body.craters.shift();

  body.radius = Math.max(body.baseRadius * 0.45, body.radius * (1 - severity * 0.12));
  if (severity > 0.45 && body.atmo) body.atmo = undefined;

  bodyPosition(body.id, sim.time, _bp);
  bodyVelocity(body.id, sim.time, _bv);
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

function layRing(body, sev, shattered) {
  const plan = ringPlan(body.radius, sev, shattered);
  bodyPosition(body.id, sim.time, _bp);
  for (let i = 0; i < plan.count; i++) {
    const a = Math.random() * Math.PI * 2;
    const f = Math.pow(Math.random(), 0.6);
    const r = plan.inner + (plan.outer - plan.inner) * f;
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

    if (relaxCraters(body, d, ev.molten)) {
      body.relaxAcc = (body.relaxAcc ?? 0) + d;
      if (body.relaxAcc > 2.5) { body.relaxAcc = 0; body.dirty = true; }
    }
    if (ev.molten > 0.02) body.moltenGlow = ev.molten;
    else if (body.moltenGlow) body.moltenGlow = 0;

    if (!ev.ringed && ev.t > 12 && (ev.outcome === OUTCOME.DISRUPT || ev.outcome === OUTCOME.SHATTER)) {
      ev.ringed = true;
      layRing(body, ev.sev, ev.outcome === OUTCOME.SHATTER);
      logEvent(`${body.name}: debris settling into a ring`, "impact");
    }
    if (body.ring) body.ring.settle = Math.max(body.ring.settle, ev.settle);

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

    if (ev.kind === "supernova" && !body.collapsed && ev.t > SN_COLLAPSE_AT) collapseToHole(body);

    if (ev.t > ev.dur) {
      if (body.event === ev) body.event = null;
      body.moltenGlow = 0;
      body.dirty = true;
      sim.events.splice(i, 1);
    }
  }
  sim.skyLift += (lift - sim.skyLift) * Math.min(1, d * (lift > sim.skyLift ? 9 : 0.8));
}

const SN_COLLAPSE_AT = 74.2;

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
    const t = 1 - (d - R.horizon) / Math.max(1, R.burn - R.horizon);
    sim.heat = Math.max(sim.heat ?? 0, 0.6 + t * 0.4);
    applyDamage(ship, (40 + t * 160) * dt * (ship.mods?.heat ?? 1), null, sim.time, "thermal");
    sim.trauma = Math.min(1, sim.trauma + dt * 1.5);
  } else {
    const t = 1 - (d - R.burn) / Math.max(1, R.roche - R.burn);
    sim.trauma = Math.min(1, sim.trauma + dt * 0.6 * t);
    applyDamage(ship, 6 * t * dt, null, sim.time, "em");
  }
}

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

export function loseHull(ship, cause = "hull loss") {
  const id = currentShipId();
  const def = shipById(id);
  const buyer = { complexId: pilot.complexId ?? null, letter: rankStatus()?.letter ?? null };
  let worth = 0;
  try { worth = def ? yardQuote(def, buyer).total : 0; } catch { worth = 0; }
  const key = playerKey(id);
  const had = policyFor(key);
  const { paid, tier } = insuranceClaim(key, { at: sim.time, what: def?.name ?? "hull", by: cause });

  sim.ownedHulls = (sim.ownedHulls ?? []).filter((h) => h !== id);
  sim.activeHullId = sim.ownedHulls.length ? sim.ownedHulls[sim.ownedHulls.length - 1] : null;
  sim.requestPersist = true;

  const lostCargo = Math.round(cargoTotal(ship));
  if (paid > 0) ship.credits += paid;

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

export function applyRemoteStrike(ev) {
  const body = bodyById(ev.bodyId);
  const i = impactors.findIndex((x) => x.id === ev.id);
  if (i >= 0) impactors.splice(i, 1);
  if (!body || body.shattered) return null;
  onImpact({ id: ev.id, r: ev.r, name: ev.name ?? "Rock", vx: 0, vy: 0, vz: 0, remote: true }, body, ev.speed, ev.n);
  return impactTier(impactSeverity(ev.r, body, ev.speed));
}

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

export function applyWorldSnapshot(snap, { includeLive = true } = {}) {
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
  if (includeLive && snap.impactors) adoptImpactors(snap.impactors);
  if (snap.holes) {
    for (const w of snap.holes) if (w.kind === "remnant" && w.starId) { const st = bodyById(w.starId); if (st) st.collapsed = true; }
    if (includeLive) adoptHoles(snap.holes);
  }
  if (includeLive) for (const [id, until] of Object.entries(snap.trafficDown ?? {})) trafficDown[id] = until;
  return true;
}

function dropStation(i) {
  const st = stations[i];
  releaseBuilt(st);
  stations.splice(i, 1);
  if (sim.selected === st.id) setNavTarget(null);
}

export function impactTier(sev) {
  if (sev < 0.05) return "minor";
  if (sev < 0.18) return "major";
  return "cataclysm";
}

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
  let run = null;
  if (m.id) {
    bodyPosition(body.id, sim.time, _bp);
    bodyVelocity(body.id, sim.time, _bv);
    try {
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
  if (isCataclysmic(outcome)) startCataclysm(body, sev, n, outcome);
  heatBody(body, clamp(sev * 900 + speed * 0.35, 30, 620));
  const d = dist3(sim.ship.pos, bodyPosition(body.id, sim.time, _bp));
  sim.lastImpact = { body: body.name, rock: m.name, sev, at: sim.time, blast: null };
  sim.impactFX.push({ bodyId: body.id, n: { x: n.nx, y: n.ny, z: n.nz }, sev, tier: impactTier(sev), outcome, r: m.r, speed, gone, at: sim.time });
  if (sim.impactFX.length > 8) sim.impactFX.shift();
  if (sim.worldAuthority && !m.remote) {
    sim.send({ t: "strike", id: m.id, bodyId: body.id, r: m.r, name: m.name, speed, n: { nx: n.nx, ny: n.ny, nz: n.nz }, at: sim.time });
  }
  if (d < body.radius * 30) {
    sim.flash = Math.max(sim.flash, clamp(sev * 3 * (1 - d / (body.radius * 30)), 0, 1));
  }
  const blastR = body.radius * (2.5 + sev * 6);
  const blast = { portsHit: [], portsLost: [], kills: [] };
  for (const st of stations) {
    const ds = Math.hypot(st.x - _bp.x, st.y - _bp.y, st.z - _bp.z);
    if (gone && st.hostId === body.id) {
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
  if (d < body.radius * 14) {
    sim.trauma = Math.min(1, sim.trauma + clamp(sev * 2.2, 0.15, 0.9) * (sim.ship.mods?.gTol ?? 1));
    SHIP.impact(Math.min(1, sev * 2));
  }
}

const CRUST_TINT = {
  rocky: [0.42, 0.37, 0.31], terra: [0.36, 0.33, 0.28], moon: [0.46, 0.45, 0.43], dwarf: [0.5, 0.45, 0.4],
  cloud: [0.55, 0.5, 0.38], ice: [0.62, 0.7, 0.76], gas: [0.52, 0.46, 0.38],
};

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

export const SENSOR_R = 30000;
export function crewCapacity() {
  return (shipById(currentShipId())?.stats.crew ?? 2) + upgradeFx("berths", 0);
}

export function robotCapacity() {
  return crewCapacity() + upgradeFx("robotSlots", 0);
}

let repairAt = 0;
function tickHullRepair() {
  const per = upgradeFx("repair", 0);
  if (!per || sim.phase !== "play") return;
  if (sim.time - repairAt < 90) return;
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
  if (recoveryBlocker(ship)) return;
  const room = ship.cargoCap - cargoTotal(ship);
  if (room <= 0) return;
  const reach = ship.mods?.salvage ?? 1;
  const near = nearDebris(ship.pos, 2200 * reach).filter((e) => !e.c.driven);
  for (const { c, d } of near.slice(0, 6)) {
    const k = (240 * reach * dt) / Math.max(d, 1);
    c.vx += (ship.pos.x - c.x) * k;
    c.vy += (ship.pos.y - c.y) * k;
    c.vz += (ship.pos.z - c.z) * k;
    if (d < 90) {
      const mass = chunkMass(c);
      const recovered = addCargo(ship, c.good ?? "iron_ore", mass);
      if (recovered <= 0) continue;
      work("salvage", recovered * 0.5);
      work("heavyOps", recovered * 0.2);
      const con = sim.contract;
      if (con && sim.time <= con.until) {
        const b = bodyById(con.bodyId);
        if (b && dist3(ship.pos, bodyPosition(b.id, sim.time, _bp)) < Math.max(b.well, b.radius * 30)) con.hauled += recovered;
      }
      if (recovered >= mass - 1e-6) removeChunk(c);
      else c.remainingMass = mass - recovered;
    }
  }
}

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
  if (m.id !== "off") sim.ship.rigMode = "off";
  tapeRecord("order", "cutter", m.id);
  if (quiet) return m;
  sim.notice = `Mining laser: ${m.label}. ${m.hint}`;
  logEvent(`Mining laser set to ${m.label}`, "system");
  return m;
}

export function cycleMiningMode(dir = 1) {
  const ship = sim.ship;
  const i = MINING_MODES.findIndex((m) => m.id === ship.miningMode);
  const next = MINING_MODES[(i + dir + MINING_MODES.length) % MINING_MODES.length];
  ship.miningMode = next.id;
  if (next.id !== "off") ship.rigMode = "off";
  sim.notice = `Mining laser: ${next.label}. ${next.hint}`;
  logEvent(`Mining laser set to ${next.label}`, "system");
  return next;
}

export function setRigMode(id, { quiet = false } = {}) {
  const m = RIG_MODES.find((x) => x.id === id);
  if (!m) return;
  sim.ship.rigMode = m.id;
  if (m.id !== "off") sim.ship.miningMode = "off";
  tapeRecord("order", "rig", m.id);
  if (quiet) return m;
  sim.notice = `Salvage rig: ${m.label}. ${m.hint}`;
  logEvent(`Salvage rig set to ${m.label}`, "system");
  return m;
}

export function cycleRigMode(dir = 1) {
  const i = RIG_MODES.findIndex((m) => m.id === (sim.ship.rigMode ?? "off"));
  return setRigMode(RIG_MODES[(i + dir + RIG_MODES.length) % RIG_MODES.length].id);
}

export function rigWanted() {
  return sim.lock.kind === "hulk" || Boolean(rigTarget(sim.ship, null));
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
  if (Math.abs(sim.ship.throttle - was) >= 0.1) tapeRecord("order", "throttle", sim.ship.throttle.toFixed(2));
}

export function throttleCap() {
  return Math.min(sim.ship.tune?.throttleCap ?? THROTTLE_MAX, THROTTLE_MAX);
}

function stepShip(a, dt) {
  const ship = sim.ship;

  const look = consumeLook();
  const tune = ship.tune;
  const k = 1 - Math.exp(-dt / Math.max(tune.panSmooth, 0.01));
  sim.pan.x += (expo(a.panX, tune.panExpo) - sim.pan.x) * k;
  sim.pan.y += (expo(a.panY, tune.panExpo) - sim.pan.y) * k;
  const panRate = tune.panRate;
  ship.aimYaw -= sim.pan.x * panRate * dt;
  ship.aimYaw += look.yaw * LOOK_GAIN;
  ship.aimPitch += sim.pan.y * panRate * dt + look.pitch * LOOK_GAIN;

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

  const demand = buildDemand(ship, rcsMag, a.brake, sim.warp.state === "spool" ? WARP.draw : 0);
  const turretExtra = stepTurrets(ship, dt, sim.time);
  demand.turrets += turretExtra;
  syncHullTune(ship);
  stepPower(ship, dt, demand);
  ship.braking = a.brake;

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

  stepLock(dt);
  let frame = sim.frameVel;
  const onLock = ship.matchLock && sim.lock.locked && sim.lock.id;
  if (onLock) {
    targetVelocity(sim.lock.kind, sim.lock.id, _matchVel);
    frame = _matchVel;
  }
  sim.dockPort = dockPortFor(ship);
  if (!onLock && sim.dockPort && !tractor.active) {
    _matchVel.x = sim.dockPort.vx ?? 0; _matchVel.y = sim.dockPort.vy ?? 0; _matchVel.z = sim.dockPort.vz ?? 0;
    frame = _matchVel;
  }
  const commanded = Math.abs(ship.throttle) > 0.02 || rcsMag > 0 || a.brake;
  const hold = updateHold(ship, commanded);

  updateAvoidance(ship);
  tickContacts(dt);

  stepAttitude(ship, dt);
  stepTranslation(ship, dt, _rcs, a.brake, frame, hold);
  stepCollisions(ship, dt);

  if (ship.hull <= 0 && sim.holeZone && sim.time - sim.holeZone.at < 0.5 && sim.holeZone.zone !== "roche") {
    holeRescue(ship, sim.holeZone.name);
  } else if (ship.hull <= 0) {
    const hit = ship.lastHitBy && sim.time - (ship.lastHitAt ?? -1e9) < 12 ? ship.lastHitBy : null;
    loseHull(ship, hit?.name ?? hit?.captain ?? "a hull breach");
  }
}

export function shiftClock(dt) {
  if (!Number.isFinite(dt) || dt === 0) return;
  const ship = sim.ship;
  if (!ship || sim.phase === "menu") { sim.time += dt; return; }
  const port = ship.dockedAt ? null : dockPortFor(ship);
  const t0 = sim.time;
  sim.time += dt;
  if (ship.dockedAt || tractor.active) return;
  if (port) {
    ship.pos.x += (port.vx ?? 0) * dt; ship.pos.y += (port.vy ?? 0) * dt; ship.pos.z += (port.vz ?? 0) * dt;
    return;
  }
  const dom = sim.dominant ?? gravityAt(ship.pos, t0, bodyPosition, _clockG).body;
  if (!dom || dom.kind === "star") return;
  if (!bodyPosition(dom.id, t0, _clockA) || !bodyPosition(dom.id, sim.time, _clockB)) return;
  ship.pos.x += _clockB.x - _clockA.x; ship.pos.y += _clockB.y - _clockA.y; ship.pos.z += _clockB.z - _clockA.z;
  bodyVelocity(dom.id, t0, _clockA); bodyVelocity(dom.id, sim.time, _clockB);
  ship.vel.x += _clockB.x - _clockA.x; ship.vel.y += _clockB.y - _clockA.y; ship.vel.z += _clockB.z - _clockA.z;
}
const _clockA = { x: 0, y: 0, z: 0 };
const _clockB = { x: 0, y: 0, z: 0 };
const _clockG = { x: 0, y: 0, z: 0 };

const DOCK_FRAME_R = 30000;
function dockPortFor(ship) {
  if (ship.dockedAt) return null;
  if (tractor.active) return stationById(tractor.stId);
  const id = (dockRequest.stId && hasDockRequest(stationById(dockRequest.stId) ?? { id: null }, sim.time) ? dockRequest.stId : null)
    ?? sim.dockRequestFor ?? (autopilot.on ? autopilot.portId : null) ?? null;
  const st = id ? stationById(id) : null;
  if (!st || (st.hostile && !st.claimed)) return null;
  return Math.hypot(st.x - ship.pos.x, st.y - ship.pos.y, st.z - ship.pos.z) < DOCK_FRAME_R ? st : null;
}

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

  stepDockwork(d * (sim.phase === "play" ? sim.timeScale : 1), sim.ship?.dockedAt ?? null);
  if (sim.undockWhenClear) {
    if (sim.ship?.dockedAt !== sim.undockWhenClear) sim.undockWhenClear = null;
    else if (sim.phase === "play" && handlingLeft(sim.undockWhenClear) <= 0) { sim.undockWhenClear = null; toggleDock(); }
  }

  if (sim.phase !== "play") {
    setEngineLevel(0, false, 0);
    return;
  }

  stepStations(sim.time);

  const a = sampleInput();
  if (justPressed("terminal")) setTerminal(!sim.terminalOpen);

  if (sim.terminalOpen && sim.termHold) a.brake = true;

  if (justPressed("pause")) {
    sim.phase = "pause";
    useGameStore.getState().setPhase("pause");
    return;
  }
  if (justPressed("map")) useGameStore.getState().setMapOpen(!useGameStore.getState().mapOpen);
  if (justPressed("cam")) sim.cameraMode = (sim.cameraMode + 1) % 2;
  if (justPressed("timeUp")) sim.timeScale = sim.timeScale === 1 ? 8 : sim.timeScale === 8 ? 40 : 1;
  if (justPressed("timeDown")) sim.timeScale = sim.timeScale === 40 ? 8 : 1;
  if (sim.remotes.size > 0 && sim.timeScale !== 1) sim.timeScale = 1;
  if (justPressed("tShields")) toggleSystem("shields");
  if (justPressed("tTurrets")) toggleSystem("turretsArmed");
  if (justPressed("tEngines")) toggleSystem("engines");
  if (justPressed("tLife")) toggleSystem("pressurized");
  if (justPressed("tGrav")) toggleSystem("localGravity");
  if (justPressed("tAssist")) toggleSystem("assist");
  if (justPressed("cycleTurret")) cycleTurretMode(1);
  if (justPressed("cycleMining")) cycleMiningMode(1);
  if (justPressed("cycleRig")) cycleRigMode(1);

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
  if (sim.ship.rigMode !== "off" && sim.ship.miningMode !== "off") sim.ship.rigMode = "off";
  stepRig(sim.ship, d, sim.time, sim.lock);
  stepWorld(d);

  collectBeaconsNear();

  setEngineLevel(speedOf(sim.ship, sim.frameVel), sim.ship.throttle > 1, sim.ship.throttle);
  broadcastShip(d);
}

function collectBeaconsNear() {
  for (const b of BEACONS) {
    if (sim.beaconsGot.has(b.id)) continue;
    if (dist3(sim.ship.pos, beaconPosition(b, sim.time)) < 420) collectBeacon(b.id, true);
  }
}

function broadcastShip(d) {
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

function stepPorts(dt) {
  for (const st of stations) {
    if (!st.hostile || st.guards <= 0) continue;
    if ((st.truceUntil ?? -1) > sim.time) continue;
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

let stepCareerImpl;
function stepCareer(d) {
  stepCareerImpl ??= createCareerStepper({
    sim, updateCrewMods, currentShipId, crewEffects,
    boarding, tickBoarding, stepContract, stepIcework,
    stepAtmoWorks, pilot, WALLET_EVERY, persistProgress,
    stepMarket, coolBodies, syncMods, serveTime,
    takePayout, logEvent, rankStatus, mining, rig,
    work, turretAim, crewCapacity, robotCapacity,
    tickHullRepair, tickPatchDrone, tickCrew, tickRobots,
    tickCompany
  });
  stepCareerImpl(d);
}

function stepWorld(d) {
  stepStations(sim.time);
  stepTraffic(sim.time, d, stations, currentSystem, sim.soloHost ? null : sim.ship.pos);
  if (sim.worldAuthority !== false) {
    stepNpcCombat(sim.time, d, sim.ship.pos);
    stepSecurity(sim.time, d, stations);
    stepRogues(sim.time, d, stations, sim.ship.pos);
  }
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
  stepHulks(d);
  stepSalvage(d);
  sim.threats = sim.ship.sentry && sim.ship.powered.ops
    ? threatBoard(sim.ship, BODIES, bodyPosition, sim.time)
    : emptyThreatBoard();
}

export function leaveHulk(c, source = "kill") {
  if (!c || (c.kind && c.kind !== "npc")) return null;
  const n = vesselById(c.id);
  if (!n) return null;
  return spawnHulk({ id: n.id, name: n.name, ship: n.ship, role: n.role, cargo: n.cargo, radius: n.radius, yaw: n.yaw, x: c.x ?? n.x, y: c.y ?? n.y, z: c.z ?? n.z, vx: c.vx ?? n.vx, vy: c.vy ?? n.vy, vz: c.vz ?? n.vz }, { source, owner: corpOfVessel(n)?.id ?? null, at: sim.time });
}

function onKill(c, shot = null) {
  if (shot && shot.faction === "npc-port") {
    const u = npcDrones.units.find((x) => x.id === shot.owner);
    const home = u ? stationById(u.home) : null;
    sim.toast = `${home?.name ?? "A port"}'s guard drones destroyed ${c.name}`;
    sim.lastToastAt = sim.time;
    logEvent(`${u?.name ?? "A port guard"} destroyed ${c.name}`, "combat");
    burst({ x: c.x, y: c.y, z: c.z, vx: (c.vx ?? 0) * 0.3, vy: (c.vy ?? 0) * 0.3, vz: (c.vz ?? 0) * 0.3, count: 6, speed: 24, size: 8, good: "iron_ore", tint: 0.35 });
    leaveHulk(c, "guard");
    if (c.kind === "npc") { const until = markVesselDown(c.id, sim.time); const n = traffic.find((x) => x.id === c.id); if (n && HOSTILE_ROLES.has(n.role)) pirateKilled(c.id, sim.time); sim.send({ t: "vdown", id: c.id, until }); }
    return;
  }
  if (shot && shot.faction === "npc-law") {
    const n = vesselById(shot.owner);
    sim.toast = `${n?.name ?? "The wing"} destroyed ${c.name}`;
    sim.lastToastAt = sim.time;
    logEvent(`${n?.name ?? "The Directorate wing"} destroyed ${c.name}`, "combat");
    burst({ x: c.x, y: c.y, z: c.z, vx: (c.vx ?? 0) * 0.3, vy: (c.vy ?? 0) * 0.3, vz: (c.vz ?? 0) * 0.3, count: 6, speed: 24, size: 8, good: "iron_ore", tint: 0.35 });
    return;
  }
  if (shot && String(shot.owner).startsWith("pdrone-")) noteDroneKill(shot.owner);
  const byPort = shot && shot.faction === "station" && !String(shot.owner).startsWith("pdrone-");
  if (byPort) {
    const stId = String(shot.owner).split(":")[0].replace(/^sdrone-/, "").split("-")[0];
    const st = stations.find((x) => x.id === stId) ?? stations.find((x) => String(shot.owner).includes(x.id));
    sim.toast = `${st?.name ?? "Port"} guns destroyed ${c.name}`;
    sim.lastToastAt = sim.time;
    logEvent(`${st?.name ?? "Port"} guns destroyed ${c.name}`, "combat");
    burst({ x: c.x, y: c.y, z: c.z, vx: (c.vx ?? 0) * 0.3, vy: (c.vy ?? 0) * 0.3, vz: (c.vz ?? 0) * 0.3, count: c.kind === "npc" ? 14 : 6, speed: 24, size: 8, good: "iron_ore", tint: 0.35 });
    leaveHulk(c, "port");
    if (c.kind === "npc") { const until = markVesselDown(c.id, sim.time); const n = traffic.find((x) => x.id === c.id); if (n && HOSTILE_ROLES.has(n.role)) pirateKilled(c.id, sim.time); sim.send({ t: "vdown", id: c.id, until }); }
    return;
  }
  sim.toast = `${c.name} destroyed`;
  sim.lastToastAt = sim.time;
  logEvent(`${c.name} destroyed`, "combat");
  burst({ x: c.x, y: c.y, z: c.z, vx: (c.vx ?? 0) * 0.3, vy: (c.vy ?? 0) * 0.3, vz: (c.vz ?? 0) * 0.3, count: c.kind === "npc" ? 14 : 6, speed: 24, size: 8, good: "iron_ore", tint: 0.35 });
  leaveHulk(c, "kill");
  work("security", 4);
  work("command", 1);
  if (c.kind === "npc") {
    const until = markVesselDown(c.id, sim.time);
    const n = traffic.find((x) => x.id === c.id);
    noteDestroyed(n);
    if (n && HOSTILE_ROLES.has(n.role)) {
      const e = pirateKilled(c.id, sim.time);
      noteKill(c.id);
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
    noteKillBySelf({ n, t: sim.time });
    const flag = blameKill(n, `destroyed ${c.name}`);
    if (flag) logEvent(`${flag.name} will remember ${c.name}`, "combat");
    sim.send({ t: "vdown", id: c.id, until });
    return;
  }
  if (c.kind === "peer") { noteKillBySelf({ peer: true, t: sim.time }); return; }
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

export function dismissNotice() {
  sim.noticeAt = -1e6;
}
export const requestWarp = requestJump;

export function bodyUnderReticle() {
  const ship = sim.ship;
  const f = forwardOf(ship.yaw, ship.pitch);
  let best = null, bestScore = 0.3;
  for (const b of BODIES) {
    bodyPosition(b.id, sim.time, _bp);
    const dx = _bp.x - ship.pos.x, dy = _bp.y - ship.pos.y, dz = _bp.z - ship.pos.z;
    const d = Math.hypot(dx, dy, dz) || 1;
    const ang = Math.acos(clamp((dx * f.x + dy * f.y + dz * f.z) / d, -1, 1));
    const disc = Math.atan2(b.radius ?? 0, d);
    const score = Math.max(0, ang - disc);
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
    hazard: sim.threat && sim.threat.t < AVOID.horizon
      ? { name: sim.threat.name, kind: sim.threat.kind, t: Math.round(sim.threat.t * 10) / 10, level: avoidLevel(sim.threat) }
      : null,
    response: (() => {
      const near = nearestCall(ship.pos, 90000, c => c.sos || (c.byPlayer && c.attackerId !== "self"));
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
    rigMode: ship.rigMode ?? "off",
    rigActive: rig.active,
    rigProgress: rig.progress,
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
    hulks: hulks.length,
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
    traffic,
    trafficCensus,
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
    cycleRigMode,
    setTurretMode,
    setMiningMode,
    contacts,
    shots,
    mining,
  };
}

export { setInjectedKeys, setInjectedPan };

export function tickSolHost(dt) {
  const d = Math.min(Math.max(dt, 0), 0.1);
  sim.phase = "play";
  sim.timeScale = 1;
  sim.worldAuthority = true;
  sim.soloHost = true;
  sim.time += d;
  sim.wall += d;
  stepWorld(d);
}
