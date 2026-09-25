/* LIVING GALAXY — somebody answers the radio.
 *
 * Until now nothing in this sky ever called for help and nothing ever came.
 * There was an authored distress corpus in js/speech/ that no system was
 * wired to, a `"responding"` job string that was only ever a label, and six
 * `security` hulls whose entire difference from a trader was that they
 * docked for a shorter time and carried no cargo. A pirate wing's outcome
 * was rolled from the seed before the first round was fired.
 *
 * This module is the missing half. It holds three things:
 *
 *   THE DISTRESS BUS   anything that gets shot at can put out a call. A call
 *                      names the victim, the attacker and where it happened,
 *                      and it lives for a while whether or not anyone comes.
 *
 *   THE DIRECTORATE    one chartered outfit per sky that answers those calls.
 *                      It is a real corporation in corps.js with a standing
 *                      you can move, it flies every patrol and security hull
 *                      in the roster, and it keeps a quick-reaction wing at
 *                      the ports that pay for one.
 *
 *   THE CLOCK          the part that matters to a player deciding whether to
 *                      press an attack: a dispatched response has an ETA, it
 *                      is honest, and it is on the HUD. You can read the
 *                      timer and decide to be gone before it lands.
 *
 * Response is not instant and not guaranteed. A call from the belt fringe
 * with every picket committed elsewhere goes unanswered, and the sky is
 * meant to have places where that is reliably true — which is what makes the
 * patrolled lanes worth something.
 */

import { stations as liveStations } from "../stations.js";
import { traffic, vesselById, trafficHooks, LAW_ROLES, HOSTILE_ROLES, markVesselDown } from "./traffic.js";
import { corps, corpById, corpOfVessel, corpRelation, adjustStanding } from "../corps.js";
import { flyStep, armFlight } from "./flight.js";
import { waveCap } from "../perf.js";

/* ---- tuning -------------------------------------------------------------- */

export const CALL_TTL = 300;          // a call stays open this long, answered or not
export const CALL_COOLDOWN = 45;      // one hull cannot spam the channel
export const SCRAMBLE_S = 8;          // from call to wheels-up at a port
export const RESPONSE_R = 140000;     // a call further than this from any picket or port is nobody's problem
export const ON_SCENE_R = 900;        // close enough to be "on scene" and start shooting
export const HELP_SPEED = 2600;       // the run-in speed a responding picket sustains
export const HOLD_AFTER_S = 70;       // how long a wing stays on station after the shooting stops
export const LATE_GRACE = 25;         // seconds past the ETA before the promise is re-cut or withdrawn
export const QRF_PER_PORT = 2;        // quick-reaction hulls a port keeps ringed up
export const QRF_RING = 2600;         // and the radius they ring it at

export const distress = [];           // live calls, oldest first
export const securityHooks = { onCall: null, onDispatch: null, onArrive: null, onClosed: null, selfVictim: null };

/* 0.3.48: a call can come from the player (js/seclevel.js SOS). "self" is not
 * in the traffic list, so the scene is read through a hook the sim installs. */
function victimOf(id) {
  return id === "self" ? securityHooks.selfVictim?.() ?? null : vesselById(id);
}

let seq = 1;
let lawCorpId = null;
const lastCall = new Map();           // victim id → sky time of its last call

export function resetSecurity() {
  distress.length = 0;
  lastCall.clear();
  seq = 1;
  lawCorpId = null;
}

/* ---- the directorate ------------------------------------------------------ */

/** The sky's security corporation, if this sky has one. */
export function securityCorp() {
  if (lawCorpId) { const c = corpById(lawCorpId); if (c) return c; }
  const c = corps.find((x) => x.tier === "law") ?? null;
  lawCorpId = c?.id ?? null;
  return c;
}

/** Does this hull answer to the directorate? */
export function isLaw(n) {
  return Boolean(n && LAW_ROLES.has(n.role));
}

/**
 * Whether the directorate will lift a finger for this victim. Its own hulls
 * and the ports that pay it, always; a corporation it is at odds with, only
 * grudgingly; a free port's raider, never.
 */
export function coverageFor(n) {
  if (!n) return 0;
  if (HOSTILE_ROLES.has(n.role)) return 0;
  const law = securityCorp();
  const co = corpOfVessel(n);
  if (!law || !co) return 0.6;
  if (co.id === law.id) return 1;
  const rel = corpRelation(law, co);
  /* standing with the directorate is the player's lever: fly clean and the
   * cavalry comes for you too */
  const standing = (co.standing ?? 0) / 100;
  return Math.max(0, Math.min(1, 0.65 + rel * 0.3 + standing * 0.15));
}

/* ---- raising a call ------------------------------------------------------- */

function d3(a, b) { return Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z); }

/**
 * Something is shooting at `victim`. Opens a call, or refreshes the one it
 * already has open. `attacker` may be a contact, a hull, or the player
 * (pass `{ id: "self", name, player: true }`).
 */
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
    eta: null,          // sky time the first responder is due on scene
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

/** Shorthand used by the combat code: an id took a hit from an id. */
export function noteAttack(victimId, attacker, t, kind = "unknown") {
  const n = vesselById(victimId);
  if (!n || n.job === "down") return null;
  n.underAttack = t;
  n.lastHitBy = attacker?.id ?? null;
  return callForHelp(n, attacker, t, kind);
}

/* ---- dispatch ------------------------------------------------------------- */

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

/** Nearest port that would send its own quick-reaction hulls. */
function coveringPort(call, stationList) {
  let best = null, bestD = RESPONSE_R;
  for (const st of stationList) {
    if (!st || st.sector === "pirate" || st.hostile) continue;
    const d = Math.hypot(st.x - call.x, st.y - call.y, st.z - call.z);
    /* a military port reaches further than a farm does */
    const reach = st.sector === "military" ? RESPONSE_R : RESPONSE_R * 0.45;
    if (d < Math.min(bestD, reach)) { best = st; bestD = d; }
  }
  return best ? { st: best, d: bestD } : null;
}

/**
 * Work out who is coming and when. Sets `call.eta` to a sky time, which is
 * what the HUD counts down — the number the player is deciding against.
 */
export function dispatch(call, t, stationList = liveStations) {
  if (call.state === "closed") return call;
  if (call.coverage <= 0.05) { call.state = "unanswered"; call.eta = null; return call; }

  const want = waveCap(call.kind === "rogue" ? 4 : call.byPlayer || call.sos ? 3 : 2);
  const near = freeResponders(call, stationList);
  const port = coveringPort(call, stationList);

  /* a roll against coverage decides whether anyone is actually free for this;
   * a marginal corporation gets a picket some of the time, not every time */
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
    /* run-in time: the distance at the speed a picket sustains, plus the
     * seconds it takes to break off whatever it was doing */
    const eta = t + SCRAMBLE_S + d / HELP_SPEED;
    if (eta < soonest) soonest = eta;
  }

  /* nothing free in the sky, but a port close enough to scramble its own */
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

/** Seconds until the first responder is on scene, or null if nobody is coming. */
export function etaOf(call, t) {
  if (!call || call.eta == null) return null;
  return Math.max(0, call.eta - t);
}

/** The call a hull is flying to, if any. */
export function callById(id) {
  return distress.find((c) => c.id === id) ?? null;
}

/** The live call nearest a point — what the HUD shows a countdown for. */
export function nearestCall(pos, maxR = 60000) {
  let best = null, bestD = maxR;
  for (const c of distress) {
    if (c.state === "closed") continue;
    const d = Math.hypot(c.x - pos.x, c.y - pos.y, c.z - pos.z);
    if (d < bestD) { best = c; bestD = d; }
  }
  return best ? { call: best, dist: bestD } : null;
}

/* ---- the responder's own flying ------------------------------------------- */

/**
 * A hull on a response flies the call, not its timetable. Returns true when
 * it has taken the hull over for this tick, so the timetable leaves it alone.
 */
export function flyResponse(n, t, dt) {
  if (!n.respondTo) return false;
  const call = callById(n.respondTo);
  if (!call || call.state === "closed" || t > call.expires) {
    n.respondTo = null;
    n.job = "watch";
    return false;
  }
  armFlight(n);
  /* the scene follows the victim while the victim is still flying */
  const v = victimOf(call.victimId);
  const tx = v && v.job !== "down" ? v.x : call.x;
  const ty = v && v.job !== "down" ? v.y : call.y;
  const tz = v && v.job !== "down" ? v.z : call.z;
  if (v && v.job !== "down") { call.x = v.x; call.y = v.y; call.z = v.z; }

  const d = Math.hypot(n.x - tx, n.y - ty, n.z - tz);
  if (d > ON_SCENE_R) {
    /* the run-in: flat out, nose on the scene */
    n.fly.top = HELP_SPEED;
    n.job = "responding";
    flyStep(n, dt, tx, ty, tz, { standoff: ON_SCENE_R * 0.6 });
    return true;
  }
  /* on scene: mark the arrival once, then hold a firing position on the
   * attacker if there is one to hold on */
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

/* ---- port quick-reaction wings ------------------------------------------- */

/**
 * Ports that pay for security keep hulls ringed up outside the mouth. These
 * are ordinary roster hulls with a `guard` assignment; they orbit their port
 * until a call inside their reach pulls them off it.
 */
export function assignGuards(stationList = liveStations) {
  const law = traffic.filter((n) => isLaw(n) && !n.guard);
  const ports = stationList.filter((s) => s && s.id && s.sector !== "pirate" && !s.hostile);
  /* biggest and most exposed first: military, then by radius */
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

/** A guard hull's patrol ring around its port. Returns true if it flew the hull. */
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

/* ---- the tick ------------------------------------------------------------- */

/**
 * Age the calls, retire the ones nobody is shooting at any more, and send
 * the wings home. Everything that flies a hull happens through the director
 * hook installed below; this is only the bookkeeping.
 */
export function stepSecurity(t, dt, stationList = liveStations) {
  for (let i = distress.length - 1; i >= 0; i--) {
    const c = distress[i];
    if (c.state === "closed") {
      if (t - (c.closedAt ?? t) > 120) distress.splice(i, 1);
      continue;
    }
    /* a pending port scramble becomes real hulls once the scramble time is up */
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

    /* A promise with a clock on it has to come good or be withdrawn. If the
     * ETA has come and gone and nothing is on scene — the wing was destroyed
     * on the way, or pulled onto something nearer — try once more off whoever
     * is free now, and if there is nobody, say so. A timer that counts past
     * zero and keeps counting is worse than no timer. */
    if (c.state === "dispatched" && c.eta != null && !c.arrivedAt && t > c.eta + LATE_GRACE) {
      const stillComing = c.wing.some((id) => { const n = vesselById(id); return n && n.respondTo === c.id && n.job !== "down"; });
      if (!stillComing) {
        c.wing.length = 0;
        c.eta = null;
        c.state = "calling";
        dispatch(c, t, stationList);
        if (c.state !== "dispatched") { c.state = "unanswered"; c.eta = null; }
      } else {
        /* somebody is still inbound, just slower than the estimate: re-cut the
         * clock off where they actually are rather than leaving it at zero */
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
    const quiet = t - (c.lastHitAt ?? c.at) > HOLD_AFTER_S;

    if (t > c.expires || victimGone || quiet) {
      c.state = "closed";
      c.closedAt = t;
      c.outcome = victimGone ? "lost" : c.arrivedAt ? "covered" : "broke off";
      for (const id of c.wing) {
        const n = vesselById(id);
        if (n && n.respondTo === c.id) { n.respondTo = null; n.engagedWith = null; n.job = n.guard ? "watch" : "watch"; }
      }
      /* the directorate's record: a call it reached is worth something to it */
      const law = securityCorp();
      if (law && c.arrivedAt && !victimGone) adjustStanding(law.id, 1, `covered ${c.victimName}`);
      securityHooks.onClosed?.(c);
    }
  }
  return distress;
}

/**
 * The director: given a hull and a tick, fly it if security has a claim on
 * it. Installed onto `trafficHooks` so traffic.js never has to import this
 * module and the two can be reasoned about separately.
 */
export function mountSecurity() {
  const prev = trafficHooks.director;
  trafficHooks.director = (n, t, dt, ctx) => {
    if (flyResponse(n, t, dt)) return true;
    if (flyGuard(n, t, dt, ctx?.stations ?? liveStations)) return true;
    return prev ? prev(n, t, dt, ctx) : false;
  };
}

/** Everything the console and the HUD want to know about the response picture. */
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
