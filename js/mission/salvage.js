import { sim, addAnchoredWaypoint, removeWaypoint, warpNodeById, selectBody, setRigMode, toggleSystem, logEvent, losBlocker } from "../sim/sim.js";
import { holdRoom, batteryCap } from "../flight/ship.js";
import { hulks, hulkById, hulkManifest, HULK } from "../world/hulks.js";
import { RIG, rig, rigBlocker, nextSection, rigRange } from "../flight/rig.js";
import { chunks } from "../world/debris.js";
import { contacts } from "../flight/turrets.js";
import { stations, stationById } from "../station/stations.js";
import { baseValue } from "../economy/materials.js";
import { contracts } from "../economy/contracts.js";
import { legSeconds } from "../aria/nav.js";
import { inBelt } from "../world/field.js";
import { traffic, HOSTILE_ROLES } from "../npc/traffic.js";
import { nests } from "../npc/rogues.js";

export const SALV = {
  reach: 25000,
  reel: 45,
  tractor: 2400,
  stall: 75,
  minWorth: 500,
  portGuns: 12000,
  minLife: 120,
  skipFor: 900,
  overhead: 25,
  restAt: 0.28,
  resumeAt: 0.65,
  trip: 4,
  threatR: 6000,
  jobMargin: 1.08,
  standoff: 0.55,
  beltK: 0.4,
  hotR: 9000,
  nestR: 16000,
  stuck: 2,
  skips: 3,
};

export function rigModeFor(want = "strip", pos = sim.ship.pos, { job = null, h = null } = {}) {
  if (want !== "auto") return want === "cut" ? "cut" : "strip";
  if (job) {
    let plate = 0;
    for (const sec of h?.sections ?? []) plate += sec.plate;
    const need = Math.max(0, (job.qty ?? 0) - (job.cut ?? 0));
    return !h || plate * RIG.cutYield >= need * SALV.jobMargin || (!job.hulkId && !h.pinned) ? "cut" : "strip";
  }
  for (const c of contacts) if (c.hp > 0 && c.relation === "hostile" && d3(c, pos) < SALV.threatR) return "cut";
  return "strip";
}

const skipped = new Map();
const d3 = (a, b) => Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z);

export function forgetSkipped() {
  skipped.clear();
}

export function skipHulk(id, forS = SALV.skipFor) {
  if (id) skipped.set(id, (sim.time ?? 0) + forS);
}

export function rigRate(ship = sim.ship, mode = "strip") {
  return Math.max(0.05, (mode === "strip" ? RIG.strip : RIG.cut) * (ship.mods?.salvage ?? 1) * (ship.hullTune?.rig ?? 1));
}

export function cutSeconds(h, ship = sim.ship, mode = "strip") {
  let plate = 0;
  for (const s of h?.sections ?? []) plate += s.plate;
  return plate / rigRate(ship, mode);
}

export function hulkWorth(h, mode = "strip") {
  const m = hulkManifest(h);
  if (mode === "strip") return m.value;
  let v = m.plate * RIG.cutYield * baseValue(HULK.plate);
  for (const [id, q] of Object.entries(m.cargo)) v += Math.floor(q * RIG.cutCargo) * baseValue(id);
  return Math.round(v);
}

const underGuns = (h) => stations.some((st) => st.hostile && !st.claimed && d3(st, h) < SALV.portGuns);

export function hotHulk(h) {
  for (const n of traffic) if (HOSTILE_ROLES.has(n.role) && n.job !== "down" && Number.isFinite(n.x) && d3(n, h) < SALV.hotR) return true;
  for (const n of nests) if ((n.hp ?? 1) > 0 && Number.isFinite(n.x) && d3(n, h) < SALV.nestR) return true;
  for (const c of contacts) if (c.hp > 0 && c.relation === "hostile" && d3(c, h) < SALV.threatR) return true;
  return false;
}

export function bestHulk({ from = sim.ship.pos, reach = Infinity, mode = "strip", ship = sim.ship, except = null, home = null, need = null, hot = false } = {}) {
  const now = sim.time ?? 0;
  let best = null;
  for (const h of hulks) {
    if (h.dead || h.id === except || !nextSection(h)) continue;
    if ((skipped.get(h.id) ?? -1) > now) continue;
    const d = d3(h, from);
    if (d > reach) continue;
    let worth = hulkWorth(h, mode);
    if (worth < SALV.minWorth || underGuns(h)) continue;
    if (h.source === "contract" && h.pinned) continue;
    if (d > 1 && losBlocker(from, h, null)) continue;
    if (!hot && hotHulk(h)) continue;
    let cut = cutSeconds(h, ship, mode);
    if (need != null) {
      const plate = hulkManifest(h).plate * (mode === "cut" ? RIG.cutYield : 1);
      const take = Math.min(need, plate);
      cut *= take / Math.max(1, plate);
      worth = take;
    }
    const secs = legSeconds(from, h) + cut + SALV.overhead + (home ? legSeconds(h, home) : 0);
    if (!h.pinned && h.life - h.age < secs + SALV.minLife) continue;
    const score = (worth / secs) * (inBelt(h) ? SALV.beltK : 1);
    if (!best || score > best.score) best = { h, d, worth, secs, score };
  }
  return best;
}

export function salvageReport(ship = sim.ship) {
  const b = bestHulk({ ship });
  return { hulks: hulks.length, best: b ? { id: b.h.id, name: b.h.name, d: Math.round(b.d), worth: b.worth, secs: Math.round(b.secs), perMin: Math.round(b.score * 60) } : null };
}

const jobOf = (s) => (s.args?.job != null ? contracts.active.find((a) => String(a.id) === String(s.args.job)) ?? null : null);
const jobFilled = (a) => Boolean(a) && (a.cut ?? 0) >= (a.qty ?? 0) - 1e-6;

export function makeSalvage({ mission, ap, apPark, apHold, legTo, untilMet, ensureUndocked, resetProgress }) {
  function drop(run) {
    if (run.wpId) { removeWaypoint(run.wpId); run.wpId = null; }
    run.node = undefined;
    run.hulkId = null;
    run.idleSince = null;
  }

  function mark(run, h) {
    if (run.wpId) removeWaypoint(run.wpId);
    const wp = addAnchoredWaypoint(h.name, { kind: "hulk", id: h.id }, h, { reuse: false });
    wp.transient = true;
    run.wpId = wp.id;
    run.node = warpNodeById(wp.id);
    if (run.node) run.node.park = Math.max(150, rigRange(sim.ship) * SALV.standoff);
    run.hulkId = h.id;
    run.idleSince = null;
    run.stuck0 = ap().unstuckCount ?? 0;
    resetProgress();
    ap().targetId = wp.id;
    if (run.node && sim.selected !== wp.id) selectBody(wp.id);
    logEvent(`${mission.active.name}: working the ${h.name}`, "nav");
    return run.node;
  }

  function pick(s, run) {
    const ref = s.target ?? { kind: "best-hulk" };
    if (ref.kind === "hulk") { const h = hulkById(ref.id); return h && nextSection(h) ? h : null; }
    if (ref.kind === "locked" && !run.cut && sim.lock?.kind === "hulk") { const h = hulkById(sim.lock.id); if (h && nextSection(h)) return h; }
    const job = jobOf(s);
    if (job) return bestHulk({ mode: "cut", home: stationById(job.stationId), need: Math.max(1, (job.qty ?? 0) - (job.cut ?? 0)) })?.h ?? null;
    return bestHulk({ reach: run.cut ? s.args?.reach ?? SALV.reach : Infinity, mode: s.args?.mode === "cut" ? "cut" : "strip" })?.h ?? null;
  }

  const looseNear = () => {
    const p = sim.ship.pos;
    let n = 0;
    for (const c of chunks) if (c.salvage && d3(c, p) < SALV.tractor) n++;
    return n;
  };

  return function SALVAGE(s) {
    const ship = sim.ship;
    const run = mission.run;
    const job = jobOf(s);
    if (s.args?.job != null && !job) { drop(run); mission.run.why = "the job is closed"; return "done"; }
    if (jobFilled(job)) { drop(run); mission.run.why = `${job.qty} ${HULK.plate} cut for ${job.title}`; return "done"; }
    if (untilMet(s) || holdRoom(ship) < 1) { drop(run); apHold(); mission.run.why = "hold full"; return "done"; }
    if (ensureUndocked() === "flying") return "flying";

    let h = run.hulkId ? hulkById(run.hulkId) : null;
    if (run.hulkId && (!h || !nextSection(h))) {
      if (run.worked === run.hulkId) { run.cut = (run.cut ?? 0) + 1; run.reelUntil = sim.time + SALV.reel; }
      drop(run);
      h = null;
    }
    if (h) h.busyUntil = Math.max(h.busyUntil ?? 0, sim.time + 30);
    if (!h && run.reelUntil) {
      const loose = looseNear();
      if (loose && sim.time < run.reelUntil) {
        if (!ship.salvage) toggleSystem("salvage");
        apHold();
        ap().phase = "salvage";
        ap().task = `reel · ${loose} loose`;
        return "flying";
      }
      run.reelUntil = null;
    }
    if (!h) {
      if (s.args?.max && (run.cut ?? 0) >= s.args.max) { mission.run.why = `${run.cut} hulk${run.cut === 1 ? "" : "s"} cut`; return "done"; }
      h = pick(s, run);
      if (!h) {
        if (run.cut) { mission.run.why = "nothing left worth cutting in reach"; return "done"; }
        return s.target?.kind === "hulk" ? "fail:the wreck is gone" : "fail:no hulk worth the trip";
      }
      if (!mark(run, h)) return "fail:lost the hulk";
    }

    const mode = rigModeFor(s.args?.mode ?? "strip", ship.pos, { job, h });
    if (s.target?.kind !== "hulk" && (ap().unstuckCount ?? 0) - (run.stuck0 ?? 0) >= SALV.stuck) {
      logEvent(`${mission.active.name}: no clean way in to the ${h.name} — leaving it`, "nav");
      skipHulk(h.id);
      drop(run);
      return "flying";
    }
    const charge = (ship.charge ?? 0) / Math.max(1, batteryCap(ship));
    if (charge <= SALV.restAt) run.resting = true;
    else if (charge >= SALV.resumeAt) run.resting = false;
    const want = run.resting ? "off" : mode;
    if ((ship.rigMode ?? "off") !== want) setRigMode(want, { quiet: true });
    const leg = legTo(s, run.node);
    if (typeof leg === "string" && leg.startsWith("fail:") && s.target?.kind !== "hulk" && (run.skips ?? 0) < SALV.skips) {
      run.skips = (run.skips ?? 0) + 1;
      logEvent(`${mission.active.name}: cannot reach the ${h.name} (${leg.slice(5)}) — taking another`, "nav");
      skipHulk(h.id);
      drop(run);
      apHold();
      return "flying";
    }
    if (leg !== "near") return leg;
    apPark(run.node);
    if (!ship.salvage) toggleSystem("salvage");
    if (run.resting) {
      ap().phase = "charge";
      ap().task = `rig rested · ${Math.round(charge * 100)}% → ${Math.round(SALV.resumeAt * 100)}%`;
      run.idleSince = null;
      return "flying";
    }
    ap().phase = "salvage";
    ap().task = `${mode} · ${h.vesselName}${rig.active && rig.key === h.id ? ` · ${rig.section}` : ""} · ${Math.round(holdRoom(ship))} room`;

    if (rig.active && rig.key === h.id) run.worked = h.id;
    if (rig.active) run.idleSince = null;
    else {
      run.idleSince ??= sim.time;
      if (sim.time - run.idleSince > SALV.stall) {
        const why = rigBlocker(ship) ?? "out of reach";
        skipHulk(h.id);
        drop(run);
        if (s.target?.kind === "hulk") return `fail:the rig will not take the wreck — ${why.toLowerCase()}`;
        logEvent(`${mission.active.name}: the rig will not take the ${h.name} (${why.toLowerCase()}) — leaving it`, "nav");
      }
    }
    return "flying";
  };
}
