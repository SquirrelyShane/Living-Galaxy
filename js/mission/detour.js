import { sim, losBlocker, warpNodeById, warpDestination, addWaypointAt, removeWaypoint, logEvent } from "../sim/sim.js";
import { doglegAround } from "../aria/nav.js";

export const LEG = { detours: 3 };

const _q = { x: 0, y: 0, z: 0 };

export function makeLegs({ mission, ap, apLeg, resetProgress, legOpts }) {
  const ariaFlown = () => Boolean(mission.active && (mission.active.mode === "aria" || mission.active.aria));
  const failed = (r) => `fail:${r.replace(/^blocked:/, "")}`;

  function endDetour() {
    const d = mission.run.detour;
    if (d) removeWaypoint(d.wpId);
    mission.run.detour = null;
    ap().jumped = false;
    ap().chargeSince = null;
    resetProgress();
  }

  function legTo(s, node, extra) {
    const run = mission.run;
    if (run.detour) {
      const dn = warpNodeById(run.detour.wpId);
      const clear = sim.warp.state === "idle" && !losBlocker(sim.ship.pos, warpDestination(node, _q), node.body?.id ?? null);
      if (!dn || clear) endDetour();
      else {
        const d = apLeg(dn, legOpts(s, { graze: "go" }));
        if (d === "flying" || d === "asking") return "flying";
        if (d !== "near") return failed(d);
        endDetour();
        return "flying";
      }
    }
    const r = apLeg(node, legOpts(s, extra));
    if (r === "flying" || r === "near" || r === "asking") return r;
    if (ariaFlown() && / in lane$/.test(r) && (run.detours ?? 0) < LEG.detours) {
      const dest = warpDestination(node, _q);
      const b = losBlocker(sim.ship.pos, dest, node.body?.id ?? null);
      const mid = b ? doglegAround(sim.ship.pos, { x: dest.x, y: dest.y, z: dest.z }, b) : null;
      if (mid) {
        const wp = addWaypointAt(`clear of ${b.name}`, mid.x, mid.y, mid.z);
        wp.transient = true;
        run.detour = { wpId: wp.id, round: b.name };
        run.detours = (run.detours ?? 0) + 1;
        ap().jumped = false;
        resetProgress();
        logEvent(`${mission.active.name}: ${b.name} is across the corridor to ${node.name} — going round it`, "nav");
        return "flying";
      }
    }
    return failed(r);
  }

  return { legTo, endDetour };
}
