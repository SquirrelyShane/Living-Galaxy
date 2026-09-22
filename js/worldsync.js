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

/** Apply a host's hull packet. Anything not in it keeps flying its timetable. */
export function adoptHulls(wire) {
  if (!Array.isArray(wire)) return 0;
  let k = 0;
  for (const row of wire) {
    if (!Array.isArray(row) || row.length < 13) continue;
    const [id, x, y, z, vx, vy, vz, yaw, pitch, job, hp, shield, vis, drive] = row;
    const n = vesselById(id);
    if (!n) continue;
    const drift = Math.hypot(n.x - x, n.y - y, n.z - z);
    if (drift > HULL_SNAP) {
      /* too far wrong to reconcile: take the host's word outright */
      n.x = x; n.y = y; n.z = z;
    } else {
      /* close enough to ease onto, so a mirror does not judder every 2 s */
      n.x += (x - n.x) * 0.4;
      n.y += (y - n.y) * 0.4;
      n.z += (z - n.z) * 0.4;
    }
    n.vx = vx; n.vy = vy; n.vz = vz;
    n.yaw = yaw; n.pitch = pitch;
    n.job = job || n.job;
    n.hp = hp; n.shield = shield;
    n.visible = vis !== 0;
    n.drive = drive ? 1 : 0;
    n.speed = Math.hypot(vx, vy, vz);
    /* a mirror never runs the directors: the host decides who is hunting whom,
     * and a mirror that made its own mind up would fight a different war */
    n.hunt = null;
    n.fleeFrom = null;
    n.respondTo = null;
    k++;
  }
  return k;
}

let mounted = false;

export function mountWorldSync() {
  if (mounted) return;
  mounted = true;
  onRoom(handleRoom);
  onMessage(handleMessage);
}

/** Call before connectNet on each launch. */
export function resetWorldSync() {
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
  if (info.offline) {
    setHost(true);
    worldsync.applied = false;
    return;
  }
  setHost(info.host);
  if (!info.host && !worldsync.applied && info.wseq > 0 && !worldsync.pending) pull();
}

async function pull() {
  worldsync.pending = true;
  try {
    const j = await fetchWorld();
    if (j?.world && applyWorldSnapshot(j.world)) {
      worldsync.wseqSeen = j.wseq ?? 0;
      worldsync.stats.pulls++;
      sim.toast = "Sky synced with the host";
      sim.lastToastAt = sim.time;
      logEvent(`Sky snapshot applied (${Object.keys(j.world.bodies ?? {}).length} worlds marked, ${(j.world.lost ?? []).length} ports lost)`, "net");
    }
    worldsync.applied = true;
  } catch {
    /* next poll tries again */
  } finally {
    worldsync.pending = false;
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
    worldsync.hostSeenAt = performance.now();
    worldsync.stats.statesIn++;
    if (Array.isArray(d.impactors)) adoptImpactors(d.impactors);
    if (Array.isArray(d.holes)) adoptHoles(d.holes);
    if (d.trafficDown) for (const [id, until] of Object.entries(d.trafficDown)) trafficDown[id] = until;
    if (Array.isArray(d.hulls)) worldsync.stats.hullsIn = adoptHulls(d.hulls);
  } else if (d.t === "vdown") {
    markVesselDown(d.id, sim.time);
    if (Number.isFinite(d.until)) trafficDown[d.id] = d.until;
  }
}

/** From the render loop. Host duties live here. */
export function tickWorldSync() {
  if (sim.phase !== "play" || !net.online || !worldsync.host) return;
  const now = performance.now();
  const alone = lonely();
  if (!alone && now - worldsync.lastState > 2000) {
    worldsync.lastState = now;
    const hulls = hullWire(sim.ship?.pos ?? null);
    worldsync.stats.hullsOut = hulls.length;
    sim.send({ t: "wstate", impactors: impactorWire(), holes: holeWire(), trafficDown, hulls });
  }
  const impactAt = sim.lastImpact?.at ?? -1;
  const changed = impactAt !== worldsync.lastImpactAt;
  if (changed || now - worldsync.lastPush > (alone ? 60000 : 20000)) {
    worldsync.lastPush = now;
    worldsync.lastImpactAt = impactAt;
    pushWorld(worldSnapshot()).then(() => worldsync.stats.pushes++).catch(() => {});
  }
}

export function wireWorldSyncTest() {
  if (globalThis.window?.__lg) window.__lg.worldsync = { worldsync, worldSnapshot, applyWorldSnapshot, tickWorldSync, hullWire, adoptHulls };
}

/**
 * A mirror steps the sky too — it has to, or hulls would freeze between
 * packets — but it does not get to decide anything. `sim.worldAuthority` is
 * the flag every director already checks through here.
 */
export function mirrorMode() { return !worldsync.host; }
