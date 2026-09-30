import { gnnBroadcastWire } from "../comms/gnn.js";
import { fetchWorld, lonely, net, onMessage, onRoom, pushWorld } from "./net.js";
import { applyRemoteRockHit, applyRemoteStrike, applyWorldSnapshot, logEvent, shiftClock, sim, worldSnapshot } from "../sim/sim.js";
import { adoptHoles, holeWire } from "../world/events/holes.js";
import { adoptImpactors, impactorWire, setImpactorAuthority } from "../world/events/impactors.js";
import { markVesselDown, trafficDown, traffic, vesselById } from "../npc/traffic.js";

export const HULL_CAP = 46;
export const HULL_SNAP = 2600;

export const worldsync = {
  host: true,
  applied: false,
  pending: false,
  wseqSeen: 0,
  revisionSeen: null,
  lastState: 0,
  lastPush: 0,
  lastImpactAt: -1,
  hostSeenAt: 0,
  stats: { strikesIn: 0, statesIn: 0, pushes: 0, pulls: 0, hullsIn: 0, hullsOut: 0 },
};

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

export const HULL_DEAD = 400;
export const HULL_BLEND = 0.8;
export const HULL_HOLD = 6;
const BLEND_RATE_FLOOR = 150, BLEND_RATE_K = 0.6;
const MAX_AGE = 4;
const POSED = new Set(["dock", "berth", "unberth"]);

function wrapPi(a) { return Math.atan2(Math.sin(a), Math.cos(a)); }

export function adoptHulls(wire, { at = null, snap = false } = {}) {
  if (!Array.isArray(wire)) return 0;
  const age = Number.isFinite(at) ? Math.min(MAX_AGE, Math.max(0, sim.time - at)) : 0;
  let k = 0;
  for (const row of wire) {
    if (!Array.isArray(row) || row.length < 13) continue;
    const [id, x0, y0, z0, vx, vy, vz, yaw, pitch, job, hp, shield, vis, drive] = row;
    const n = vesselById(id);
    if (!n) continue;
    const x = x0 + vx * age, y = y0 + vy * age, z = z0 + vz * age;
    const ex = x - n.x, ey = y - n.y, ez = z - n.z;
    const drift = Math.hypot(ex, ey, ez);
    const held = n.heldUntil > sim.time;
    const diverged = !snap && (drift > HULL_SNAP || (vis !== 0) !== (n.visible !== false));
    if (snap || diverged || n.visible === false) {
      n.x = x; n.y = y; n.z = z;
      n.yaw = yaw; n.pitch = pitch;
      n.sync = null;
    } else if (held ? drift > 1 : drift > HULL_DEAD && !POSED.has(n.state)) {
      n.sync = { x: ex, y: ey, z: ez, yaw: wrapPi(yaw - (n.yaw ?? 0)), pitch: pitch - (n.pitch ?? 0) };
    }
    if (snap || diverged || held || n.visible === false) { n.vx = vx; n.vy = vy; n.vz = vz; n.speed = Math.hypot(vx, vy, vz); }
    if (diverged || held) n.heldUntil = sim.time + HULL_HOLD;
    n.job = job || n.job;
    n.hp = hp; n.shield = shield;
    n.visible = vis !== 0;
    n.drive = drive ? 1 : 0;
    n.hunt = null;
    n.fleeFrom = null;
    n.respondTo = null;
    k++;
  }
  return k;
}

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

export function applySolPrime(prime) {
  if (!prime) return false;
  shiftClock(prime.time + (performance.now() - prime.at) / 1000 - sim.time);
  sim.clockSynced = true;
  if (!prime.world) return true;
  if (!applyWorldSnapshot(prime.world, { includeLive: true })) return true;
  bodySignatures = new Map(Object.entries(prime.world.bodies ?? {}).map(([id, b]) => [id, bodySignature(b)]));
  worldsync.wseqSeen = prime.wseq;
  worldsync.revisionSeen = prime.worldRevision;
  worldsync.applied = true;
  worldsync.stats.pulls++;
  logEvent(`Sol joined on its own clock (${Object.keys(prime.world.bodies ?? {}).length} worlds marked, ${(prime.world.lost ?? []).length} ports lost)`, "net");
  return true;
}

export function mountWorldSync() {
  if (mounted) return;
  mounted = true;
  onRoom(handleRoom);
  onMessage(handleMessage);
}

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
    worldsync.lastPush = 0;
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
  } finally {
    if (generation === joinGeneration) worldsync.pending = false;
  }
}

function handleMessage(from, d) {
  if (!d || typeof d !== "object") return;
  if (d.t === "strike") {
    if (worldsync.host) return;
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

export function mirrorMode() { return !worldsync.host; }
