/* LIVING GALAXY — what the watch actually does.
 *
 * A hull accrues *wear* — a maintenance backlog, 0..1 — from thrust, overdrive
 * and heat. Somebody at Engineering works it off and patches the hull; a
 * medic keeps morale up; a hand in the cargo bay stows the load tighter. The
 * backlog feeds back into the crew bag (warp costs more, hull gives less) and
 * once a cycle a neglected hull sours the crew and grinds the robots.
 * Contract: PLAN.md §4.4.
 */

import { crew, crewHooks, crewNote } from "../crew.js";
import { sim } from "../sim.js";
import { THROTTLE_RATED } from "../ship.js";
import { adjustMorale } from "../family.js";
import { fx as upgradeFx } from "../upgrades.js";
import { shiftPhase } from "../npc/crewfx.js";
import { currentPlan, dutyOf, postKind, KIND_LABEL } from "./roster.js";

/** wear 0..1 — the hull's maintenance backlog */
export const duties = { wear: 0, report: [], lastAt: -1, secDrilled: false, cargoStowed: false };

export const DUTY_FX = {
  eng: "maintain", med: "treat", sec: "drill", cargo: "stow", office: "book", sensor: "watch",
  bridge: "plot", agri: "tend", lab: "assay", works: "work", industry: "work",
};

const WEAR = { throttle: 0.0004, overdrive: 0.001, heat: 0.002, repair: 0.004, hull: 0.05 };
const NEGLECT = 0.6;

/** How much of a hand a hand is at their post: morale for people, condition for machines. */
export function strengthOf(m) {
  if (m.robot) return 0.5 + Math.max(0, Math.min(100, m.condition ?? 100)) / 200;
  return 0.5 + Math.max(0, Math.min(100, m.morale ?? 70)) / 200;
}

function onPost(m) {
  if (m.robot) return (m.condition ?? 100) >= 30 && !m.idle;
  return (m.morale ?? 70) >= 40;
}

/**
 * Every ~2 s from crewfx.updateCrewMods (dt in sim seconds). Rebuilds the
 * report of who is at which post, moves wear, and applies the station work.
 */
export function tickDuties(dt, time = sim.time ?? 0) {
  dt = Math.max(0, Math.min(10, Number(dt) || 0));
  const ship = sim.ship ?? {};
  const plan = currentPlan();
  const report = [];
  const at = new Map(); // kind → strength sum of hands actually working
  for (const m of crew.aboard) {
    if (m.idle) continue;
    if (!m.robot && shiftPhase(m.id, time) !== 0) continue;
    const room = dutyOf(m, plan);
    const kind = postKind(room);
    if (!kind) continue;
    const working = onPost(m);
    const strength = working ? strengthOf(m) : 0;
    report.push({ id: m.id, name: m.name, station: room.name, kind, task: DUTY_FX[kind] ?? "work", strength, working });
    if (working) at.set(kind, (at.get(kind) ?? 0) + strength);
  }
  duties.report = report;
  /* the hull wears */
  const t = Math.abs(ship.throttle ?? 0);
  const heat = Math.max(0, Math.min(1, sim.heat ?? 0));
  let w = duties.wear + (t * t * WEAR.throttle + (t > THROTTLE_RATED ? WEAR.overdrive : 0) + heat * WEAR.heat) * dt;
  /* … and Engineering works it off */
  const eng = at.get("eng") ?? 0;
  if (eng > 0) {
    w -= WEAR.repair * eng * dt;
    if ((ship.hull ?? 100) < 100) ship.hull = Math.min(100, (ship.hull ?? 100) + WEAR.hull * eng * dt);
  }
  duties.wear = Math.max(0, Math.min(1, w));
  /* the medic keeps people upright */
  const med = at.get("med") ?? 0;
  if (med > 0) for (const m of crew.aboard) if (!m.robot) adjustMorale(m, 0.01 * med * dt);
  duties.secDrilled = (at.get("sec") ?? 0) > 0;
  duties.cargoStowed = (at.get("cargo") ?? 0) > 0;
  duties.lastAt = time;
  return duties;
}

/** Per pay cycle (crewHooks.cycle): a neglected hull sours the crew and grinds the robots; a galley feeds them. */
export function tickDutiesCycle() {
  const galley = upgradeFx("moralePerCycle", 0) || 0;
  if (duties.wear > NEGLECT) {
    crewNote("Clamps and coolant untended — the hull rattles and everyone hears it.");
    for (const m of crew.aboard) {
      if (m.robot) m.condition = Math.max(0, (m.condition ?? 100) - duties.wear * 2);
      else adjustMorale(m, -2);
    }
  }
  if (galley) for (const m of crew.aboard) if (!m.robot) adjustMorale(m, galley);
}

/** { warp, hull, cargo } — multiplied into the crew bag by crewfx. */
export function dutyBag() {
  const w = duties.wear;
  return { warp: 1 + w * 0.15, hull: 1 - w * 0.08, cargo: duties.cargoStowed ? 1.03 : 1 };
}

/** For SHIP › STATUS and ROSTER → [{ id, name, station, kind, task, strength, working }] */
export function dutyReport() {
  return duties.report;
}

/** One line on the state of the hull, for talk and status rows. */
export function wearLine() {
  const w = duties.wear;
  if (w < 0.15) return "The hull is tight. Nothing on the board.";
  if (w < 0.4) return "A few clamps want torque and the coolant is due. Nothing urgent.";
  if (w < NEGLECT) return "The backlog is growing — radiators, seals, a cell that reads low.";
  return "The hull is overdue. Coolant, clamps, a cracked seal on the aft trunk. It needs an engineer.";
}

export { KIND_LABEL };

if (!crewHooks.cycle.includes(tickDutiesCycle)) crewHooks.cycle.push(tickDutiesCycle);
const reset = () => { duties.wear = 0; duties.report = []; duties.lastAt = -1; duties.secDrilled = false; duties.cargoStowed = false; };
if (!crewHooks.reset.includes(reset)) crewHooks.reset.push(reset);
