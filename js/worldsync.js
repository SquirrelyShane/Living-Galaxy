/* LIVING GALAXY experimental — one sky for everyone in the room.
 *
 * The room already shares a clock (net.js chases `now - born`), which makes
 * the ports, the NPC traffic and the markets desk line up for everyone by
 * construction. What it did not share was the stuff that is rolled, not
 * computed: the rogue rocks, and what they do to worlds and ports. This
 * module closes that:
 *
 *   host     the longest-present pilot (the server elects them). They alone
 *            spawn and integrate impactors — and, since the NPC sky became
 *            something you can change rather than a closed-form function of
 *            the clock, they alone integrate the hulls as well.
 *   wstate   every 2 s the host broadcasts the live rocks, the shot-down list
 *            and the hull state; everyone else mirrors them.
 *   strike   when a rock lands on the host's screen, an event carries the
 *            body, size, speed and normal; every mirror applies the same
 *            impact — same crater, same blast, same GNN bulletin.
 *   snapshot every 20 s (and right after a strike) the host POSTs the state
 *            of the sky — damage, lost ports, climate, rocks — so a pilot
 *            who joins an hour later inherits every scar. (`worldSnapshot()`)
 *
 * Host hand-off is automatic: when the host leaves, the server names the
 * next-oldest pilot and their `worldAuthority` flips on within a poll.
 *
 * ---- why the hulls are here now ------------------------------------------
 *
 * They did not used to need to be. `poseAt(n, t)` was pure in (seed, skyTime),
 * so two clients agreed about every captain in the sky without anyone being in
 * charge — a genuinely nice property, and the reason the old sky worked with
 * no host simulation at all.
 *
 * It was also the reason nothing could ever be intercepted. A position that is
 * a closed-form function of the clock cannot be changed by anything you do to
 * it: you cannot chase it, damage it, drive it off course or destroy it and
 * have the sky agree. Buying flight that means something costs that property,
 * so the host now integrates and mirrors take its word.
 *
 * The wire is deliberately thin. A hull's ROSTER — who is flying it, for whom,
 * in what — is still a pure function of the seed and is never sent. Only what
 * has become genuinely unpredictable travels: where each hull is, what it is
 * doing, and how much of it is left. Hulls are sent nearest-the-host first and
 * capped, so a busy sky costs a bounded packet rather than a growing one; a
 * mirror keeps flying anything the packet left out on its own timetable, which
 * is exactly what `routePose` is still for.
 */

import { gnnBroadcastWire } from "./gnn.js";
import { fetchWorld, lonely, net, onMessage, onRoom, pushWorld } from "./net.js";
import { applyRemoteRockHit, applyRemoteStrike, applyWorldSnapshot, logEvent, sim, worldSnapshot } from "./sim.js";
import { adoptHoles, holeWire } from "./holes.js";
import { adoptImpactors, impactorWire, setImpactorAuthority } from "./impactors.js";
import { markVesselDown, trafficDown, traffic, vesselById } from "./npc/traffic.js";

/* How many hulls ride in a wstate packet, and how far a mirror lets a hull
 * drift from where the host last put it before it simply jumps. */
export const HULL_CAP = 46;
export const HULL_SNAP = 2600;

export const worldsync = {
  host: true,
  applied: false,      // have we applied the host's snapshot this join
  pending: false,
  wseqSeen: 0,
  revisionSeen: null,
  lastState: 0,
  lastPush: 0,
  lastImpactAt: -1,
  hostSeenAt: 0,
  stats: { strikesIn: 0, statesIn: 0, pushes: 0, pulls: 0, hullsIn: 0, hullsOut: 0 },
};

/** The hull state a mirror cannot work out for itself, nearest the host first. */
export function hullWire(pos, cap = HULL_CAP) {
  const out = [];
  for (const n of traffic) {
    if (n.job === "down") continue;
    out.push(n);
  }
  if (pos) {
    out.sort((a, b) => (
      Math.hypot(a.x - pos.x, a.y - pos.y, a.z - pos.z) - Math.hypot(b.x - pos.x, b.y - pos.y, b.z - pos.z)
    ));
  }
  const wire = [];
  for (let i = 0; i < out.length && i < cap; i++) {
    const n = out[i];
    /* rounded: this is a position on a screen, not a ledger entry, and the
     * packet goes out five times a minute over a phone's wifi */
    wire.push([
      n.id,
      Math.round(n.x), Math.round(n.y), Math.round(n.z),
      Math.round(n.vx ?? 0), Math.round(n.vy ?? 0), Math.round(n.vz ?? 0),
      Math.round((n.yaw ?? 0) * 100) / 100,
      Math.round((n.pitch ?? 0) * 100) / 100,
      n.job ?? "",
      Math.round(n.hp ?? 0),
      Math.round(n.shield ?? 0),
      n.visible === false ? 0 : 1,
      n.drive ? 1 : 0,
    ]);
  }
  return wire;
}

/* 0.3.65 — how a mirror takes the host's word without juddering.
 *
 * Until the persistent Sol host, a pilot alone in a sky WAS the host and never
 * received a hull packet; mirroring was a two-pilot edge case. Now every pilot
 * in Sol is a mirror, every 2 s, and each packet was a visible hop:
 *
 *   The mirror flies the hulls itself between packets, but its hull state
 *   machine (leg, bay run, clamps) is its own, so it drifts from the host's.
 *   Measured on 0.3.64 over 25 s near the player: median 128 u, p90 1.2 km
 *   apart when a packet lands. 40% of that was applied in ONE frame — a median
 *   10 and a p90 51 frames' worth of the hull's own motion, every 2 s — and the
 *   velocity was replaced outright, a kink in the path on top of the hop.
 *
 * Now:
 *   - HULL_DEAD: a disagreement under 400 u is left alone. Nobody alone in a
 *     sky can see it, and correcting it is exactly what juddered.
 *   - a larger one is held on the hull (`n.sync`) and bled off over about a
 *     second from the render loop (`blendHulls`), heading and pitch with it,
 *     and the mirror keeps its own velocity: a drift, not a hop.
 *   - a hull riding a bay run or the clamps is posed by the port every step, so
 *     a correction there lasts one frame and flickers; those are left to the port.
 *   - the packet carries `at`, the host's sky time, and the report is carried
 *     forward by its velocity before it is compared.
 *
 * Past HULL_SNAP, or when the host and the mirror disagree about whether it can
 * be seen, the two are flying different states (the host's directors have it in
 * a fight or a response the mirror never runs). The old code snapped it and let
 * the mirror's timetable fly it straight back, so the same hull teleported every
 * packet. Now it is placed once and HELD: the mirror stops running its own state
 * machine for it and dead-reckons on the host's velocity (`heldUntil`, refreshed
 * by each packet), so the next packet finds it close and blends. If the host
 * goes quiet the hold lapses after HULL_HOLD seconds and the timetable resumes. */
export const HULL_DEAD = 400;
export const HULL_BLEND = 0.8;
export const HULL_HOLD = 6;
/* how fast a blend may move a hull beyond its own motion: a correction reads as
 * drift only while it is slower than the hull (or this floor, for the slow ones) */
const BLEND_RATE_FLOOR = 150, BLEND_RATE_K = 0.6;
const MAX_AGE = 4;
const POSED = new Set(["dock", "berth", "unberth"]);

function wrapPi(a) { return Math.atan2(Math.sin(a), Math.cos(a)); }

/** Apply a host's hull packet. Anything not in it keeps flying its timetable.
 *  `at` is the host's sky time when it read the hulls; `snap` places them
 *  exactly (a host restoring its own checkpoint has no render loop to blend). */
export function adoptHulls(wire, { at = null, snap = false } = {}) {
  if (!Array.isArray(wire)) return 0;
  const age = Number.isFinite(at) ? Math.min(MAX_AGE, Math.max(0, sim.time - at)) : 0;
  let k = 0;
  for (const row of wire) {
    if (!Array.isArray(row) || row.length < 13) continue;
    const [id, x0, y0, z0, vx, vy, vz, yaw, pitch, job, hp, shield, vis, drive] = row;
    const n = vesselById(id);
    if (!n) continue;
    /* where the host's hull is NOW, not where it was when the packet left */
    const x = x0 + vx * age, y = y0 + vy * age, z = z0 + vz * age;
    const ex = x - n.x, ey = y - n.y, ez = z - n.z;
    const drift = Math.hypot(ex, ey, ez);
    const held = n.heldUntil > sim.time;
    const diverged = !snap && (drift > HULL_SNAP || (vis !== 0) !== (n.visible !== false));
    if (snap || diverged || n.visible === false) {
      /* too far wrong to reconcile, or nobody can see it: take the host's word outright */
      n.x = x; n.y = y; n.z = z;
      n.yaw = yaw; n.pitch = pitch;
      n.sync = null;
    } else if (held ? drift > 1 : drift > HULL_DEAD && !POSED.has(n.state)) {
      /* close enough to ease onto: the residual is spent a little each frame */
      n.sync = { x: ex, y: ey, z: ez, yaw: wrapPi(yaw - (n.yaw ?? 0)), pitch: pitch - (n.pitch ?? 0) };
    }
    /* a held hull flies the host's velocity; one on its own timetable keeps its own */
    if (snap || diverged || held || n.visible === false) { n.vx = vx; n.vy = vy; n.vz = vz; n.speed = Math.hypot(vx, vy, vz); }
    if (diverged || held) n.heldUntil = sim.time + HULL_HOLD;
    n.job = job || n.job;
    n.hp = hp; n.shield = shield;
    n.visible = vis !== 0;
    n.drive = drive ? 1 : 0;
    /* a mirror never runs the directors: the host decides who is hunting whom,
     * and a mirror that made its own mind up would fight a different war */
    n.hunt = null;
    n.fleeFrom = null;
    n.respondTo = null;
    k++;
  }
  return k;
}

/** Mirror, every frame: spend each hull's held correction. Exponential, so a
 *  new packet arriving mid-blend simply replaces what is left of the old one. */
export function blendHulls(dt) {
  if (!(dt > 0)) return 0;
  const f = 1 - Math.exp(-Math.min(dt, 0.25) / (HULL_BLEND / 2));
  let k = 0;
  for (const n of traffic) {
    const c = n.sync;
    if (!c) continue;
    if (n.job === "down" || POSED.has(n.state)) { n.sync = null; continue; }
    let g = f;
    const want = Math.hypot(c.x, c.y, c.z) * f;
    const cap = Math.max(BLEND_RATE_FLOOR, BLEND_RATE_K * (n.speed ?? 0)) * Math.min(dt, 0.25);
    if (want > cap) g = f * cap / want;
    const dx = c.x * g, dy = c.y * g, dz = c.z * g, dyaw = c.yaw * f, dp = c.pitch * f;
    n.x += dx; n.y += dy; n.z += dz; n.yaw = (n.yaw ?? 0) + dyaw; n.pitch = (n.pitch ?? 0) + dp;
    c.x -= dx; c.y -= dy; c.z -= dz; c.yaw -= dyaw; c.pitch -= dp;
    if (Math.abs(c.x) + Math.abs(c.y) + Math.abs(c.z) < 0.5 && Math.abs(c.yaw) + Math.abs(c.pitch) < 1e-3) n.sync = null;
    k++;
  }
  return k;
}

let mounted = false;
let joinGeneration = 0;
let liveStateSeen = false;
let bodySignatures = new Map();

function bodySignature(body) {
  const fields = ["integrity", "scarred", "radius", "shattered", "terraform", "atmo", "nova"];
  const craters = (body.craters ?? []).map(c => [c.nx, c.ny, c.nz, c.r, c.depth0, c.rough, c.seed]);
  const ring = body.ring ? [body.ring.inner, body.ring.outer, body.ring.roche, body.ring.born] : null;
  return JSON.stringify([fields.map(key => body[key] ?? null), ring, craters]);
}

export function mountWorldSync() {
  if (mounted) return;
  mounted = true;
  onRoom(handleRoom);
  onMessage(handleMessage);
}

/** Call before connectNet on each launch. */
export function resetWorldSync() {
  joinGeneration++;
  liveStateSeen = false;
  bodySignatures.clear();
  worldsync.revisionSeen = null;
  worldsync.host = true;
  worldsync.applied = false;
  worldsync.pending = false;
  worldsync.wseqSeen = 0;
  worldsync.lastState = 0;
  worldsync.lastPush = 0;
  worldsync.lastImpactAt = -1;
  worldsync.hostSeenAt = 0;
  sim.worldAuthority = true;
  setImpactorAuthority(true);
}

function setHost(on) {
  if (worldsync.host === on) return;
  worldsync.host = on;
  sim.worldAuthority = on;
  setImpactorAuthority(on);
  if (on) {
    worldsync.lastPush = 0; // publish the sky as soon as we hold it
    logEvent("You hold the sky — your rocks land for everyone", "net");
  } else {
    sim.timeScale = 1;
    logEvent("Joined a held sky — mirroring the host's rocks", "net");
  }
}

function handleRoom(info) {
  if (info.offline && net.room === "sol" && net.hostId === "__sol_authority__") { setHost(false); return; }
  if (info.offline) {
    setHost(true);
    worldsync.applied = false;
    return;
  }
  setHost(info.host);
  if (!info.host && info.wseq > 0 && !worldsync.pending && (!worldsync.applied || (net.hostId === "__sol_authority__" && typeof info.worldRevision === "string" && info.worldRevision !== worldsync.revisionSeen))) pull();
}

async function pull() {
  worldsync.pending = true;
  const generation = joinGeneration;
  try {
    const j = await fetchWorld();
    if (generation !== joinGeneration || !j?.world || j.world.v !== 1) return;
    const first = !worldsync.applied;
    // Later snapshots repair durable changes only. Never rewind the two-second live stream.
    const bodies = {};
    const nextSignatures = new Map();
    for (const [id, body] of Object.entries(j.world.bodies ?? {})) {
      const signature = bodySignature(body);
      nextSignatures.set(id, signature);
      if (first || signature !== bodySignatures.get(id)) bodies[id] = body;
    }
    const includeLive = first && !liveStateSeen;
    if (applyWorldSnapshot({ ...j.world, bodies }, { includeLive })) {
      bodySignatures = nextSignatures;
      worldsync.wseqSeen = j.wseq ?? 0;
      worldsync.revisionSeen = j.worldRevision ?? null;
      worldsync.stats.pulls++;
      worldsync.applied = true;
      if (first) {
        sim.toast = "Sky synced with the host";
        sim.lastToastAt = sim.time;
        logEvent(`Sky snapshot applied (${Object.keys(j.world.bodies ?? {}).length} worlds marked, ${(j.world.lost ?? []).length} ports lost)`, "net");
      }
    }
  } catch {
    /* next poll retries the unacknowledged revision */
  } finally {
    if (generation === joinGeneration) worldsync.pending = false;
  }
}

function handleMessage(from, d) {
  if (!d || typeof d !== "object") return;
  if (d.t === "strike") {
    if (worldsync.host) return; // our own strikes are already on the ground
    applyRemoteStrike(d);
    worldsync.stats.strikesIn++;
  } else if (d.t === "rockhit") {
    if (worldsync.host) return;
    applyRemoteRockHit(d);
    worldsync.stats.strikesIn++;
  } else if (d.t === "wstate") {
    if (worldsync.host) return;
    liveStateSeen = true;
    worldsync.hostSeenAt = performance.now();
    worldsync.stats.statesIn++;
    if (Array.isArray(d.impactors)) adoptImpactors(d.impactors);
    if (Array.isArray(d.holes)) adoptHoles(d.holes);
    if (d.trafficDown) for (const [id, until] of Object.entries(d.trafficDown)) trafficDown[id] = until;
    if (Array.isArray(d.hulls)) worldsync.stats.hullsIn = adoptHulls(d.hulls, { at: d.at });
  } else if (d.t === "vdown") {
    markVesselDown(d.id, sim.time);
    if (Number.isFinite(d.until)) trafficDown[d.id] = d.until;
  }
}

/** From the render loop. Host duties live here. */
let lastBlend = 0;
export function tickWorldSync() {
  const now = performance.now();
  const dt = lastBlend ? (now - lastBlend) / 1000 : 0;
  lastBlend = now;
  if (sim.phase !== "play") return;
  if (!worldsync.host) { blendHulls(dt); return; }
  if (!net.online) return;
  const alone = lonely();
  if (!alone && now - worldsync.lastState > 2000) {
    worldsync.lastState = now;
    const hulls = hullWire(sim.ship?.pos ?? null);
    worldsync.stats.hullsOut = hulls.length;
    sim.send({ t: "wstate", at: sim.time, impactors: impactorWire(), holes: holeWire(), trafficDown, hulls });
  }
  const impactAt = sim.lastImpact?.at ?? -1;
  const changed = impactAt !== worldsync.lastImpactAt;
  if (changed || now - worldsync.lastPush > (alone ? 60000 : 20000)) {
    worldsync.lastPush = now;
    worldsync.lastImpactAt = impactAt;
    pushWorld({ ...worldSnapshot(), gnn: net.room === "sol" ? gnnBroadcastWire() : [] }).then(() => worldsync.stats.pushes++).catch(() => {});
  }
}

export function wireWorldSyncTest() {
  if (globalThis.window?.__lg) window.__lg.worldsync = { worldsync, worldSnapshot, applyWorldSnapshot, tickWorldSync, hullWire, adoptHulls, blendHulls };
}

/**
 * A mirror steps the sky too — it has to, or hulls would freeze between
 * packets — but it does not get to decide anything. `sim.worldAuthority` is
 * the flag every director already checks through here.
 */
export function mirrorMode() { return !worldsync.host; }
