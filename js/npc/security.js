import { stations as liveStations } from "../station/stations.js";
import { traffic, vesselById, trafficHooks, LAW_ROLES, HOSTILE_ROLES, markVesselDown } from "./traffic.js";
import { corps, corpById, corpOfVessel, corpRelation, adjustStanding } from "../corp/corps.js";
import { flyStep, armFlight } from "./flight.js";
import { waveCap } from "../core/perf.js";

export const CALL_TTL = 300;
export const CALL_COOLDOWN = 45;
export const SCRAMBLE_S = 8;
export const RESPONSE_R = 140000;
export const ON_SCENE_R = 900;
export const HELP_SPEED = 2600;
export const HOLD_AFTER_S = 70;
export const LATE_GRACE = 25;
export const QRF_PER_PORT = 2;
export const QRF_RING = 2600;

export const distress = [];
export const securityHooks = { onCall: null, onDispatch: null, onArrive: null, onClosed: null, selfVictim: null };

function victimOf(id) {
  return id === "self" ? securityHooks.selfVictim?.() ?? null : vesselById(id);
}

let seq = 1;
let lawCorpId = null;
const lastCall = new Map();

export function resetSecurity() {
  distress.length = 0;
  lastCall.clear();
  seq = 1;
  lawCorpId = null;
}

export function securityCorp() {
  if (lawCorpId) { const c = corpById(lawCorpId); if (c) return c; }
  const c = corps.find((x) => x.tier === "law") ?? null;
  lawCorpId = c?.id ?? null;
  return c;
}

export function isLaw(n) {
  return Boolean(n && LAW_ROLES.has(n.role));
}

export function coverageFor(n) {
  if (!n) return 0;
  if (HOSTILE_ROLES.has(n.role)) return 0;
  const law = securityCorp();
  const co = corpOfVessel(n);
  if (!law || !co) return 0.6;
  if (co.id === law.id) return 1;
  const rel = corpRelation(law, co);
  const standing = (co.standing ?? 0) / 100;
  return Math.max(0, Math.min(1, 0.65 + rel * 0.3 + standing * 0.15));
}

function d3(a, b) { return Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z); }

export function callForHelp(victim, attacker, t, kind = "unknown", opts = {}) {
  if (!victim) return null;
  const open = distress.find((c) => c.victimId === victim.id && c.state !== "closed");
  if (open) {
    open.lastHitAt = t;
    open.expires = t + CALL_TTL;
    if (attacker && !open.attackerId) { open.attackerId = attacker.id; open.attackerName = attacker.name ?? "an unknown hull"; }
    return open;
  }
  const since = lastCall.get(victim.id) ?? -1e9;
  if (t - since < CALL_COOLDOWN) return null;
  lastCall.set(victim.id, t);

  const cover = opts.coverage ?? coverageFor(victim);
  const call = {
    id: `sos${seq++}`,
    at: t,
    lastHitAt: t,
    expires: t + CALL_TTL,
    victimId: victim.id,
    victimName: victim.name ?? "an unnamed hull",
    victimCorp: victim.id === "self" ? null : corpOfVessel(victim)?.id ?? null,
    attackerId: attacker?.id ?? null,
    attackerName: attacker?.name ?? "an unknown hull",
    byPlayer: Boolean(attacker?.player || attacker?.id === "self"),
    sos: victim.id === "self",
    kind,
    x: victim.x, y: victim.y, z: victim.z,
    coverage: cover,
    state: "calling",
    stationId: null,
    eta: null,
    wing: [],
    qrf: [],
    closedAt: null,
    outcome: null,
  };
  distress.push(call);
  if (distress.length > 24) distress.splice(0, distress.length - 24);
  securityHooks.onCall?.(call);
  dispatch(call, t);
  return call;
}

export function noteAttack(victimId, attacker, t, kind = "unknown") {
  const n = vesselById(victimId);
  if (!n || n.job === "down") return null;
  n.underAttack = t;
  n.lastHitBy = attacker?.id ?? null;
  return callForHelp(n, attacker, t, kind);
}

function freeResponders(call, stationList) {
  const out = [];
  for (const n of traffic) {
    if (!isLaw(n) || n.job === "down" || n.respondTo) continue;
    const d = Math.hypot(n.x - call.x, n.y - call.y, n.z - call.z);
    if (d > RESPONSE_R) continue;
    out.push({ n, d });
  }
  out.sort((a, b) => a.d - b.d);
  return out;
}

function coveringPort(call, stationList) {
  let best = null, bestD = RESPONSE_R;
  for (const st of stationList) {
    if (!st || st.sector === "pirate" || st.hostile) continue;
    const d = Math.hypot(st.x - call.x, st.y - call.y, st.z - call.z);
    const reach = st.sector === "military" ? RESPONSE_R : RESPONSE_R * 0.45;
    if (d < Math.min(bestD, reach)) { best = st; bestD = d; }
  }
  return best ? { st: best, d: bestD } : null;
}

export function dispatch(call, t, stationList = liveStations) {
  if (call.state === "closed") return call;
  if (call.coverage <= 0.05) { call.state = "unanswered"; call.eta = null; return call; }

  const want = waveCap(call.kind === "rogue" ? 4 : call.byPlayer || call.sos ? 3 : 2);
  const near = freeResponders(call, stationList);
  const port = coveringPort(call, stationList);

  const willing = call.coverage >= 1 ? want : Math.round(want * call.coverage);
  const take = Math.max(0, Math.min(willing, near.length));

  let soonest = Infinity;
  for (let i = 0; i < take; i++) {
    const { n, d } = near[i];
    n.respondTo = call.id;
    n.respondFrom = t;
    n.job = "responding";
    n.toName = call.victimName;
    call.wing.push(n.id);
    const eta = t + SCRAMBLE_S + d / HELP_SPEED;
    if (eta < soonest) soonest = eta;
  }

  if (!take && port && port.d < QRF_RING * 14) {
    call.stationId = port.st.id;
    soonest = t + SCRAMBLE_S * 1.6 + port.d / HELP_SPEED;
    call.qrfPending = true;
  } else if (port) call.stationId = port.st.id;

  if (Number.isFinite(soonest)) {
    call.eta = soonest;
    call.state = "dispatched";
    securityHooks.onDispatch?.(call);
  } else {
    call.state = "unanswered";
    call.eta = null;
  }
  return call;
}

export function etaOf(call, t) {
  if (!call || call.eta == null) return null;
  return Math.max(0, call.eta - t);
}

export function callById(id) {
  return distress.find((c) => c.id === id) ?? null;
}

export function nearestCall(pos, maxR = 60000, include = () => true) {
  let best = null, bestD = maxR;
  for (const c of distress) {
    if (c.state === "closed" || !include(c)) continue;
    const d = Math.hypot(c.x - pos.x, c.y - pos.y, c.z - pos.z);
    if (d < bestD) { best = c; bestD = d; }
  }
  return best ? { call: best, dist: bestD } : null;
}

export function flyResponse(n, t, dt) {
  if (!n.respondTo) return false;
  const call = callById(n.respondTo);
  if (!call || call.state === "closed" || t > call.expires) {
    n.respondTo = null;
    n.job = "watch";
    return false;
  }
  armFlight(n);
  const v = victimOf(call.victimId);
  const tx = v && v.job !== "down" ? v.x : call.x;
  const ty = v && v.job !== "down" ? v.y : call.y;
  const tz = v && v.job !== "down" ? v.z : call.z;
  if (v && v.job !== "down") { call.x = v.x; call.y = v.y; call.z = v.z; }

  const d = Math.hypot(n.x - tx, n.y - ty, n.z - tz);
  if (d > ON_SCENE_R) {
    n.fly.top = HELP_SPEED;
    n.job = "responding";
    flyStep(n, dt, tx, ty, tz, { standoff: ON_SCENE_R * 0.6 });
    return true;
  }
  if (!call.arrivedAt) {
    call.arrivedAt = t;
    call.state = "onscene";
    securityHooks.onArrive?.(call, n);
  }
  n.job = "engaged";
  n.engagedWith = call.attackerId;
  const foe = call.attackerId ? vesselById(call.attackerId) : null;
  const fx = foe ? foe.x : tx, fy = foe ? foe.y : ty, fz = foe ? foe.z : tz;
  n.fly.top = 460;
  flyStep(n, dt, fx, fy, fz, { standoff: 420, evade: 0.6, match: foe ? { vx: foe.vx, vy: foe.vy, vz: foe.vz } : null });
  return true;
}

export function assignGuards(stationList = liveStations) {
  const law = traffic.filter((n) => isLaw(n) && !n.guard);
  const ports = stationList.filter((s) => s && s.id && s.sector !== "pirate" && !s.hostile);
  ports.sort((a, b) => (b.sector === "military" ? 1 : 0) - (a.sector === "military" ? 1 : 0) || (b.radius ?? 0) - (a.radius ?? 0));
  let k = 0;
  for (const st of ports) {
    const want = st.sector === "military" ? QRF_PER_PORT + 1 : st.radius > 220 ? QRF_PER_PORT : 1;
    for (let i = 0; i < want && k < law.length; i++, k++) {
      const n = law[k];
      n.guard = st.id;
      n.guardPhase = (i / Math.max(1, want)) * Math.PI * 2 + (k * 0.7);
      n.guardR = QRF_RING * (0.85 + (i % 3) * 0.16);
    }
  }
  return k;
}

export function flyGuard(n, t, dt, stationList = liveStations) {
  if (!n.guard) return false;
  const st = stationList.find((s) => s.id === n.guard);
  if (!st) return false;
  armFlight(n);
  const w = 0.16 * (n.guardR ? QRF_RING / n.guardR : 1);
  const a = n.guardPhase + t * w * 0.08;
  const r = n.guardR ?? QRF_RING;
  const gx = st.x + Math.cos(a) * r;
  const gy = st.y + Math.sin(a * 0.6) * r * 0.18;
  const gz = st.z + Math.sin(a) * r;
  n.fly.top = 520;
  n.job = "watch";
  n.toName = st.name ?? "";
  flyStep(n, dt, gx, gy, gz, { match: { vx: st.vx ?? 0, vy: st.vy ?? 0, vz: st.vz ?? 0 } });
  return true;
}

export function stepSecurity(t, dt, stationList = liveStations) {
  for (let i = distress.length - 1; i >= 0; i--) {
    const c = distress[i];
    if (c.state === "closed") {
      if (t - (c.closedAt ?? t) > 120) distress.splice(i, 1);
      continue;
    }
    if (c.qrfPending && c.eta != null && t > c.at + SCRAMBLE_S * 1.6) {
      c.qrfPending = false;
      const st = stationList.find((s) => s.id === c.stationId);
      if (st) {
        const guards = traffic.filter((n) => n.guard === st.id && !n.respondTo && n.job !== "down");
        for (const g of guards.slice(0, waveCap(2))) {
          g.respondTo = c.id;
          g.respondFrom = t;
          c.wing.push(g.id);
        }
        if (!guards.length) { c.state = "unanswered"; c.eta = null; }
      }
    }

    if (c.state === "dispatched" && c.eta != null && !c.arrivedAt && t > c.eta + LATE_GRACE) {
      const stillComing = c.wing.some((id) => { const n = vesselById(id); return n && n.respondTo === c.id && n.job !== "down"; });
      if (!stillComing) {
        c.wing.length = 0;
        c.eta = null;
        c.state = "calling";
        dispatch(c, t, stationList);
        if (c.state !== "dispatched") { c.state = "unanswered"; c.eta = null; }
      } else {
        let soonest = Infinity;
        for (const id of c.wing) {
          const n = vesselById(id);
          if (!n || n.respondTo !== c.id) continue;
          const d = Math.hypot(n.x - c.x, n.y - c.y, n.z - c.z);
          soonest = Math.min(soonest, t + d / HELP_SPEED);
        }
        c.eta = Number.isFinite(soonest) ? soonest : null;
        if (c.eta == null) c.state = "unanswered";
      }
    }

    const victim = victimOf(c.victimId);
    const victimGone = !victim || victim.job === "down";
    const quiet = t - Math.max(c.lastHitAt ?? c.at, c.sos && c.eta != null && !c.arrivedAt ? c.eta : -Infinity) > HOLD_AFTER_S;

    if (t > c.expires || victimGone || quiet) {
      c.state = "closed";
      c.closedAt = t;
      c.outcome = victimGone ? "lost" : c.arrivedAt ? "covered" : "broke off";
      for (const id of c.wing) {
        const n = vesselById(id);
        if (n && n.respondTo === c.id) { n.respondTo = null; n.engagedWith = null; n.job = n.guard ? "watch" : "watch"; }
      }
      const law = securityCorp();
      if (law && c.arrivedAt && !victimGone) adjustStanding(law.id, 1, `covered ${c.victimName}`);
      securityHooks.onClosed?.(c);
    }
  }
  return distress;
}

export function mountSecurity() {
  const prev = trafficHooks.director;
  trafficHooks.director = (n, t, dt, ctx) => {
    if (flyResponse(n, t, dt)) return true;
    if (flyGuard(n, t, dt, ctx?.stations ?? liveStations)) return true;
    return prev ? prev(n, t, dt, ctx) : false;
  };
}

export function securityReport(t) {
  const open = distress.filter((c) => c.state !== "closed");
  return {
    corp: securityCorp()?.name ?? null,
    open: open.length,
    dispatched: open.filter((c) => c.state === "dispatched").length,
    onScene: open.filter((c) => c.state === "onscene").length,
    unanswered: open.filter((c) => c.state === "unanswered").length,
    responders: traffic.filter((n) => n.respondTo).length,
    guards: traffic.filter((n) => n.guard).length,
    next: open.reduce((best, c) => {
      const e = etaOf(c, t);
      return e != null && (best == null || e < best) ? e : best;
    }, null),
  };
}
