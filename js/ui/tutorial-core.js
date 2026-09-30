import { acquireLock, addAnchoredWaypoint, sim, warpBlock, warpDestination, warpNodeById } from "../sim/sim.js";
import { stations } from "../station/stations.js";
import { UPGRADES, hasUpgrade } from "../economy/upgrades.js";
import { missionCore, oneStep } from "../mission/script.js";
import { startMission } from "../mission/run.js";

export const core = { stId: null };

const CORE_ID = "nav_core";
const spec = () => UPGRADES.find((u) => u.id === CORE_ID) ?? { name: "Mission core", price: 7500, sector: ["logistic", "military"] };

const fmt = (d) => (!isFinite(d) ? "—" : d < 1000 ? `${Math.round(d)} u` : d < 100000 ? `${(d / 100).toFixed(1)} km` : `${Math.round(d / 100).toLocaleString()} km`);
const cr = (v) => Math.round(v).toLocaleString();
const rangeOf = (st) => st.radius * 4 + 220;

export function coreYard(pos = sim.ship?.pos) {
  if (core.stId) {
    const pinned = stations.find((s) => s.id === core.stId);
    if (pinned) return withDist(pinned, pos);
  }
  const sectors = spec().sector ?? [];
  let best = null;
  for (const st of stations) {
    if (st.hostile || !st.hangars?.length || !sectors.includes(st.sector)) continue;
    const d = dist(st, pos);
    if (!best || d < best.dist) best = withDist(st, pos);
  }
  if (best) core.stId = best.st.id;
  return best;
}

function dist(st, pos) {
  if (!pos) return Infinity;
  return Math.hypot(st.x - pos.x, st.y - pos.y, st.z - pos.z);
}
function withDist(st, pos) {
  return { st, dist: dist(st, pos), range: rangeOf(st) };
}

function autoDock(y) {
  if (!y) return;
  acquireLock({ kind: "station", id: y.st.id });
  startMission(oneStep("DOCK", { kind: "station", id: y.st.id, name: y.st.name }));
}

const warpWhy = (id) => (warpNodeById(id) ? warpBlock(id) : "NO TARGET");
const _d = { x: 0, y: 0, z: 0 };
function warpDone(id) {
  const node = warpNodeById(id);
  if (!node || !sim.ship?.pos) return false;
  warpDestination(node, _d);
  const p = sim.ship.pos;
  return Math.hypot(_d.x - p.x, _d.y - p.y, _d.z - p.z) < node.arriveR;
}

export const CORE_STEPS = [
  {
    id: "core-what",
    title: "WHAT IT IS",
    text: () => {
      const u = spec();
      return `The editor flies ONE step at a time until a ${u.name} is fitted — that is the box that remembers a plan. With it: several steps in a row, loops, and conditions like "until the hold is full". Without it the four presets still fly, because those are built in. ${cr(u.price)} cr at a ${(u.sector ?? []).join(" or ")} yard. Tap NEXT and I will find you one.`;
    },
    done: () => false,
    next: () => true,
  },
  {
    id: "core-find",
    title: "THE YARD",
    text: (c) => {
      const y = coreYard(sim.ship?.pos);
      if (!y) return "No yard in this sky fits one. Jump to another system — a logistic or military port will.";
      const short = (sim.ship?.credits ?? 0) - spec().price;
      return `${y.st.name}, a ${y.st.sector} yard, ${fmt(y.dist)} out. ${short >= 0 ? `You hold ${cr(sim.ship.credits)} cr — enough.` : `You are ${cr(-short)} cr short; sell a hold first, then come back to this.`} SET COURSE locks it and marks it; AUTO FLY hands the whole trip to the autopilot.`;
    },
    action: () => {
      const y = coreYard(sim.ship?.pos);
      return y ? { label: "SET COURSE", run: () => { acquireLock({ kind: "station", id: y.st.id }); addAnchoredWaypoint(y.st.name, { kind: "station", id: y.st.id }, y.st); } } : null;
    },
    alt: () => {
      const y = coreYard(sim.ship?.pos);
      return y ? { label: "AUTO FLY", run: () => autoDock(y) } : null;
    },
    done: () => sim.lock?.id === core.stId || sim.ship?.dockedAt === core.stId,
  },
  {
    id: "core-warp",
    title: "WARP",
    text: () => {
      const y = coreYard(sim.ship?.pos);
      if (!y) return "Jump to a system with a logistic or military yard.";
      const why = warpWhy(y.st.id);
      const head = `${fmt(y.dist)} to ${y.st.name}. Hold WARP — the core spools, then drops you in its neighbourhood.`;
      if (!why) return `${head} The core is green: hold it.`;
      return `${head} The core will not engage yet: ${why}. Wells and blocked lanes both clear by flying out a little first.`;
    },
    hilite: () => "#btn-warp",
    action: () => { const y = coreYard(sim.ship?.pos); return y ? { label: "AUTO FLY", run: () => autoDock(y) } : null; },
    done: () => { const y = coreYard(sim.ship?.pos); return Boolean(y && (warpDone(y.st.id) || sim.ship?.dockedAt === core.stId)); },
  },
  {
    id: "core-approach",
    title: "APPROACH",
    text: () => {
      const y = coreYard(sim.ship?.pos);
      if (!y) return "Close on the yard.";
      return `${y.st.name} is ${fmt(y.dist)} off. APPR beside the warp bar flies the last leg for you — it lines up on the lane and bleeds off speed. Or fly it yourself and get inside ${fmt(y.range)}.`;
    },
    hilite: () => "#btn-approach",
    action: () => { const y = coreYard(sim.ship?.pos); return y ? { label: "AUTO FLY", run: () => autoDock(y) } : null; },
    done: () => { const y = coreYard(sim.ship?.pos); return Boolean(y && (y.dist < y.range || sim.ship?.dockedAt === core.stId)); },
  },
  {
    id: "core-dock",
    title: "DOCK",
    text: () => {
      const y = coreYard(sim.ship?.pos);
      return `You are on the ring. DOCK is on DASH page 2 — tap 2, then DOCK. Port control wants you under 60 u/s relative and near a hangar mouth; if it refuses, BRAKE and try again.${y ? ` (${y.st.name}, ${fmt(y.dist)}.)` : ""}`;
    },
    hilite: () => "#op-dock",
    done: () => sim.ship?.dockedAt === core.stId || (Boolean(sim.ship?.dockedAt) && hasFit()),
  },
  {
    id: "core-fit",
    title: "REFIT",
    text: () => {
      const u = spec();
      return `Aboard the station now. DECK (dash page 3) opens the port deck; the REFIT desk is where hardware is fitted. Find ${u.name} — ${cr(u.price)} cr — and BUY. The console's MARKET › REFIT page is the same desk if you would rather not walk.`;
    },
    hilite: () => "#aux-deck",
    done: () => hasFit(),
  },
];

function hasFit() {
  return hasUpgrade(CORE_ID) || missionCore();
}

export function coreTrackSteps() {
  return CORE_STEPS.map((s) => s.id);
}
export function resetCoreTrack() {
  core.stId = null;
}
