import { crew, crewNote } from "./ledger.js";
import { sim } from "../sim/sim.js";
import { duties } from "./duties.js";
import { currentPlan, dutyOf, postKind } from "./roster.js";
import { shiftPhase } from "../npc/crewfx.js";
import { boarding } from "../interior/boarding.js";
import { social, loadSocial } from "./family.js";

const clamp01 = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);
const r3 = (v) => Math.round(v * 1000) / 1000;

export const ROOM_NAME = {
  eng: "Engineering", sensor: "Sensors", sec: "Security", med: "Medbay", cargo: "Cargo Bay",
  office: "Ship's Office", bridge: "Bridge", agri: "Growing Racks", lab: "Lab", works: "Works",
  industry: "Works",
};

const COMPLEX_POST = {
  engineering: "eng", energy: "eng", propulsion: "eng",
  medical: "med", security: "sec", military: "sec",
  logistics: "cargo", commerce: "office", law: "office", administration: "office",
  navigation: "bridge", command: "bridge", flight: "bridge",
  science: "lab", research: "lab", education: "lab",
  agriculture: "agri", lifeSupport: "agri",
  mining: "works", manufacturing: "works", construction: "works", industrial: "works",
};

function postFromTrade(m) {
  const id = String(m?.complexId ?? "").toLowerCase();
  for (const [k, v] of Object.entries(COMPLEX_POST)) if (id.includes(k.toLowerCase())) return v;
  return "works";
}

let _player = null;

export function playerHull() {
  if (_player) return _player;
  _player = {
    kind: "player",
    id: "player",
    get name() { return sim.callsign || "this hull"; },
    get employer() { return crew.employer ?? null; },
    get roster() { return crew.aboard; },
    get plan() { return currentPlan(); },

    state() {
      const ship = sim.ship ?? {};
      const docked = Boolean(ship.dockedAt);
      const e = sim.engagement;
      const inIt = Boolean(e && e.joined && sim.time < (e.end ?? 0) && !docked);
      return {
        alarm: boarding?.intruders?.length ? "boarding"
          : (ship.hull ?? 100) < 35 && (sim.heat ?? 0) > 0.6 ? "breach"
          : inIt ? "battle"
          : null,
        docked,
        port: ship.dockedAt ?? null,
        underway: !docked && Math.abs(ship.throttle ?? 0) > 0.05,
        hull: Math.round(ship.hull ?? 100),
        wear: r3(duties.wear),
        heat: r3(sim.heat ?? 0),
        credits: Math.round(ship.credits ?? 0),
        mounts: Boolean(ship.turretsArmed),
        stores: { drink: docked || (ship.credits ?? 0) > 200 },
        shortfall: crew.lastPay?.shortfall ?? 0,
      };
    },

    postOf(m) {
      const room = dutyOf(m, this.plan);
      return room ? { name: room.name, kind: postKind(room), id: room.id } : null;
    },
    phaseOf(m, time) { return m.robot ? 0 : shiftPhase(m.id, time); },

    addWear(d) { duties.wear = clamp01(duties.wear + d); },
    repair(d) { if (sim.ship) sim.ship.hull = Math.min(100, (sim.ship.hull ?? 100) + d); },
    flag(k) { if (k === "drilled") duties.secDrilled = true; if (k === "stowed") duties.cargoStowed = true; },
    note(msg) { crewNote(msg); },
    get romance() { loadSocial(); return social.romance !== "off"; },
    intruders() { return boarding?.intruders ?? []; },
  };
  return _player;
}

export function vesselHull(v) {
  if (v._hull) return v._hull;
  const hull = {
    kind: "npc",
    id: v.id,
    vessel: v,
    get name() { return v.name ?? v.captain ?? v.id; },
    get employer() { return v.captain ?? v.name ?? null; },
    get roster() { return v.crewList ?? []; },
    plan: null,

    state() {
      const docked = v.job === "docked" || v.job === "loading" || v.job === "berthed";
      return {
        alarm: v.underAttack ? "battle" : (v.hullPct ?? 100) < 30 ? "breach" : null,
        docked,
        port: v.toName || v.to || null,
        underway: !docked,
        hull: Math.round(v.hullPct ?? 100),
        wear: r3(v.wear ?? 0),
        heat: 0,
        credits: 0,
        mounts: v.role === "security" || v.role === "patrol" || v.role === "pirate",
        stores: { drink: docked },
        shortfall: v.payShort ? 1 : 0,
      };
    },

    postOf(m) {
      const kind = m.duty ?? postFromTrade(m);
      return { name: ROOM_NAME[kind] ?? "Works", kind, id: `${v.id}:${kind}` };
    },
    phaseOf(m, time) {
      if (m.robot) return 0;
      let h = 2166136261;
      const s = String(m.id);
      for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
      return (Math.floor((time ?? 0) / 270) + (h >>> 0)) % 3;
    },

    addWear(d) { v.wear = clamp01((v.wear ?? 0) + d); },
    repair(d) { v.hullPct = Math.min(100, (v.hullPct ?? 100) + d); },
    flag(k) { if (k === "drilled") v.drilled = true; if (k === "stowed") v.stowed = true; },
    note(msg) {
      v.crewLog ??= [];
      v.crewLog.unshift({ t: sim.time ?? 0, msg });
      v.crewLog.length = Math.min(v.crewLog.length, 12);
    },
    romance: true,
    intruders() { return []; },
  };
  Object.defineProperty(v, "_hull", { value: hull, enumerable: false, configurable: true });
  return hull;
}

export function hullOf(m) {
  if (m?.hullId && m.hullId !== "player") return m._hull ?? null;
  return playerHull();
}

export function resetHulls() { _player = null; }
