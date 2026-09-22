/* LIVING GALAXY — engagements: the fights the sky has without you.
 *
 * Pirates lurk on the belt approaches (npc/traffic.js). Every so often a
 * wing of them jumps a working hull — a trader on its burn out, a miner on
 * a claim — and security answers. The whole thing is a timetable, like the
 * traffic it preys on: engagement k of this sky is a pure function of
 * (seed, k), so two clients in the same room see the same ambush at the
 * same place with the same ending, and nothing needs a host.
 *
 * An engagement has a site (where the victim was when the pirates dropped
 * in), a start, a security arrival, and an end with an outcome — the
 * pirates are driven off (one goes down), the victim is lost, or both sides
 * break off. While it runs the participants are pulled off their routes
 * onto battle poses around the site: the victim runs, the pirates circle
 * it, security closes and circles wider. Tracers fly between them (turrets.js
 * shot pool, faction "npc": drawn, never lethal — the outcome is decided by
 * the seed, not by who the client thinks got hit).
 *
 * Fly inside JOIN_R of the site and you are in it: pirates take you as a
 * target, your turrets take them (they are hostile contacts), and a pirate
 * you kill during the fight pays the security bounty and saves the victim
 * regardless of what the seed had planned.
 */

import { corpOfVessel, corpRelation } from "../corps.js";
import { rngFromSeed } from "../generate.js";
import { traffic, trafficDown, trafficHooks, routePose, markVesselDown, vesselById, eventAt, HOSTILE_ROLES, LAW_ROLES } from "./traffic.js";
import { burst } from "../debris.js";
import { stations as liveStations } from "../stations.js";
import { currentSystem } from "../bodies.js";

/* reused per-tick scratch: the battle tick used to allocate four arrays a frame */
const wingBuf = [];
const lawBuf = [];
const foeBuf = [];

export const ENG_SLOT = 240;        // seconds of sky time between rolls
export const ENG_CHANCE = 0.55;     // chance a slot carries a fight
export const JOIN_R = 1400;         // fly this close and you are a participant
export const ENGAGE_R = 1600;       // pirates open up on a participant inside this
export const DISENGAGE_S = 26;      // blend back onto the timetable after the end

export const engagements = [];      // live and recently ended, oldest first
const known = new Map();            // slot → engagement (or null when the roll was quiet)
let skySeed = null;
export const battleHooks = { onStart: null, onEnd: null, onJoin: null };

export function resetBattles(seed) {
  skySeed = seed;
  known.clear();
  engagements.length = 0;
}

/* ---- the roll ------------------------------------------------------------ */

const _p = { x: 0, y: 0, z: 0 };
const preyRoles = new Set(["trader", "miner", "hauler"]);

function engagementFor(slot, stationList, system) {
  if (known.has(slot)) return known.get(slot);
  let eng = null;
  const rng = rngFromSeed(`${skySeed}:eng:${slot}`);
  const pirates = traffic.filter((n) => n.role === "pirate");
  const law = traffic.filter((n) => n.role === "security" || n.role === "patrol");
  const prey = traffic.filter((n) => preyRoles.has(n.role));
  /* a PIRATE WATCH bulletin means what it says: more raids, bigger wings */
  const watch = eventAt(skySeed, slot * ENG_SLOT + 1).kind === "pirate_watch";
  if (rng() < (watch ? 0.92 : ENG_CHANCE) && pirates.length && prey.length) {
    /* prey whose flag is at war with the raiders' flag is the prey they go for */
    const weighted = [];
    for (const v of prey) {
      let w = 1;
      const vc = corpOfVessel(v);
      for (const p of pirates) { const r = vc ? corpRelation(corpOfVessel(p), vc) : 0; if (r <= -0.5) w += 1.5; else if (r >= 0.5) w -= 0.6; }
      weighted.push({ v, w: Math.max(0.2, w) });
    }
    const total = weighted.reduce((a, x) => a + x.w, 0);
    let roll = rng() * total;
    let victim = weighted[weighted.length - 1].v;
    for (const x of weighted) { roll -= x.w; if (roll <= 0) { victim = x.v; break; } }
    /* find a moment in the slot when the victim is actually on the board */
    const t0 = slot * ENG_SLOT + 20 + rng() * 60;
    let start = -1;
    for (let dt = 0; dt < ENG_SLOT - 100; dt += 6) {
      const pose = routePose(victim, t0 + dt, stationList, system);
      if (pose.visible && pose.job !== "down") { start = t0 + dt; break; }
    }
    if (start >= 0) {
      const site = routePose(victim, start, stationList, system);
      const wing = [];
      const nWing = Math.min(pirates.length, 2 + (rng() < 0.4 ? 1 : 0) + (watch ? 1 : 0));
      const order = pirates.slice().sort(() => rng() - 0.5);
      for (let i = 0; i < nWing; i++) wing.push(order[i].id);
      const responders = law.slice().sort(() => rng() - 0.5).slice(0, Math.min(law.length, 1 + (rng() < 0.5 ? 1 : 0))).map((n) => n.id);
      const dur = 80 + rng() * 70;
      const roll = rng();
      const outcome = roll < 0.5 ? "repelled" : roll < 0.8 ? "lost" : "broken";
      const downId = outcome === "repelled" ? wing[Math.floor(rng() * wing.length)] : outcome === "lost" ? victim.id : null;
      eng = {
        id: `eng:${skySeed}:${slot}`, slot,
        victimId: victim.id, victimName: victim.name, wing, responders,
        site: { x: site.x, y: site.y, z: site.z },
        heading: site.yaw,
        start, secArrive: start + 22 + rng() * 30, end: start + dur,
        outcome, downId, downAt: start + dur - 6,
        seedK: rng(),
        joined: false, joinedAt: null, announced: false, applied: false, playerSaved: false,
      };
    }
  }
  known.set(slot, eng);
  /* only the current and previous slot are ever asked for again */
  for (const k of known.keys()) if (k < slot - 2) known.delete(k);
  if (eng) { engagements.push(eng); while (engagements.length > 8) engagements.shift(); }
  return eng;
}

/** Engagement live at sky time t, or null. Rolls the slot on first sight. */
export function engagementAt(t, stationList = liveStations, system = currentSystem) {
  if (skySeed == null) return null;
  const slot = Math.floor(Math.max(0, t) / ENG_SLOT);
  for (const s of [slot - 1, slot]) {
    if (s < 0) continue;
    const e = engagementFor(s, stationList, system);
    if (e && t >= e.start && t < e.end + DISENGAGE_S) return e;
  }
  return null;
}

/** The engagement (if any) `n` is part of at time t. */
export function engagementOf(n, t, stationList, system) {
  const e = engagementAt(t, stationList, system);
  if (!e) return null;
  if (e.victimId === n.id || e.wing.includes(n.id) || e.responders.includes(n.id)) return e;
  return null;
}

/* ---- poses --------------------------------------------------------------- */

const _route = { x: 0, y: 0, z: 0 };

function battlePoseRaw(n, e, t) {
  const S = e.site;
  const k = t - e.start;
  const h = hash(n.id) * Math.PI * 2;
  if (n.id === e.victimId) {
    /* run along the old heading, jinking */
    const fx = -Math.sin(e.heading), fz = -Math.cos(e.heading);
    const run = 7.5 * k;
    const jink = Math.sin(k * 0.55 + h) * 90;
    const x = S.x + fx * run - fz * jink, z = S.z + fz * run + fx * jink, y = S.y + Math.sin(k * 0.4 + h) * 40;
    const lost = e.outcome === "lost" && t >= e.downAt;
    return { x, y, z, yaw: e.heading + Math.sin(k * 0.55 + h) * 0.3, pitch: 0, speed: 8, docked: null, job: lost ? "down" : "fleeing", visible: !lost, toName: "the pirates" };
  }
  const wing = e.wing.indexOf(n.id);
  if (wing >= 0) {
    if (e.outcome === "repelled" && e.downId === n.id && t >= e.downAt) return { x: S.x, y: S.y, z: S.z, yaw: 0, pitch: 0, speed: 0, docked: null, job: "down", visible: false, toName: "" };
    /* circle the victim, each pirate on its own ring */
    const vx = -Math.sin(e.heading) * 7.5 * k, vz = -Math.cos(e.heading) * 7.5 * k;
    const r = 240 + wing * 110;
    const w = (0.32 - wing * 0.05) * (wing % 2 ? -1 : 1);
    const a = h + k * w;
    const x = S.x + vx + Math.cos(a) * r, z = S.z + vz + Math.sin(a) * r, y = S.y + Math.sin(k * 0.5 + h) * 70;
    const yaw = Math.atan2(-(-Math.sin(a) * w), -(Math.cos(a) * w));
    return { x, y, z, yaw, pitch: 0, speed: Math.abs(w) * r, docked: null, job: "engaged", visible: true, toName: e.victimName };
  }
  const idx = e.responders.indexOf(n.id);
  if (idx >= 0) {
    if (t < e.secArrive) return null; // still on its route until the call comes
    const k2 = t - e.secArrive;
    const vx = -Math.sin(e.heading) * 7.5 * k, vz = -Math.cos(e.heading) * 7.5 * k;
    const close = Math.max(0, 1 - k2 / 18); // 18 s to close from 1800 u out
    const r = 480 + idx * 140 + close * 1800;
    const a = h + k2 * 0.22 * (idx % 2 ? -1 : 1);
    const x = S.x + vx + Math.cos(a) * r, z = S.z + vz + Math.sin(a) * r, y = S.y + 60 + Math.sin(k2 * 0.3 + h) * 50;
    const yaw = close > 0 ? Math.atan2(-(S.x + vx - x), -(S.z + vz - z)) : Math.atan2(Math.sin(a) * (idx % 2 ? -1 : 1), -Math.cos(a) * (idx % 2 ? -1 : 1));
    return { x, y, z, yaw, pitch: 0, speed: close > 0 ? 100 : 0.22 * r, docked: null, job: close > 0 ? "responding" : "engaged", visible: true, toName: "the engagement" };
  }
  return null;
}

/** trafficHooks.battlePose: the pose an engagement gives `n`, or null for the timetable. */
function battlePose(n, t, stationList, system) {
  const e = engagementOf(n, t, stationList, system);
  if (!e) return null;
  if (t < e.end) return battlePoseRaw(n, e, t);
  /* disengage: slide from the last battle pose back onto the route */
  const u = Math.min(1, (t - e.end) / DISENGAGE_S);
  const from = battlePoseRaw(n, e, e.end);
  if (!from) return null;
  if (from.job === "down") return from;
  const to = routePose(n, t, stationList, system);
  if (!to.visible) return u > 0.5 ? to : { ...from, job: "engaged", toName: "" };
  const s = u * u * (3 - 2 * u);
  return { ...to, x: from.x + (to.x - from.x) * s, y: from.y + (to.y - from.y) * s, z: from.z + (to.z - from.z) * s, job: u < 0.8 ? to.job : to.job };
}
trafficHooks.battlePose = battlePose;

function hash(s) {
  let n = 0;
  for (let i = 0; i < s.length; i++) n = Math.imul(n ^ s.charCodeAt(i), 2654435761) >>> 0;
  return (n % 100000) / 100000;
}

/** Where the fight is right now: the victim while it is on the board, else
 * the lead pirate, else the site it started at. */
const _fc = { x: 0, y: 0, z: 0 };
export function fightCentre(e, out = _fc) {
  const v = vesselById(e.victimId);
  let lead = v && v.visible !== false ? v : null;
  if (!lead) for (const id of e.wing) { const n = vesselById(id); if (n && n.visible !== false) { lead = n; break; } }
  const p = lead ?? e.site;
  out.x = p.x; out.y = p.y; out.z = p.z;
  return out;
}

/* ---- the tick ------------------------------------------------------------ */

/**
 * Advance engagements: fire the decided outcome when its time comes, spawn
 * tracers between the fighters, notice the player joining. `shipPos` is the
 * player's position; `fireNpc(from, to)` pushes a cosmetic tracer.
 */
export function stepBattles(t, dt, shipPos, fireNpc, stationList = liveStations, system = currentSystem) {
  const e = engagementAt(t, stationList, system);
  if (!e) return null;
  if (!e.announced) { e.announced = true; battleHooks.onStart?.(e); }
  const live = t < e.end;
  if (live) {
    const c = fightCentre(e);
    if (!e.joined && shipPos && Math.hypot(shipPos.x - c.x, shipPos.y - c.y, shipPos.z - c.z) < JOIN_R) {
      e.joined = true;
      e.joinedAt = t;
      battleHooks.onJoin?.(e);
    }
    /* tracers: every fighter shoots its foe on its own cadence */
    if (fireNpc) {
      /* Four fresh arrays and nine linear scans of `traffic`, every tick, for
       * the whole length of an engagement. The ids do not change while the
       * engagement runs — only who is still visible does — so resolve through
       * the roster's own id index and fill three arrays that are reused. */
      const victim = vesselById(e.victimId);
      wingBuf.length = 0;
      for (const id of e.wing) { const n = vesselById(id); if (n && n.visible) wingBuf.push(n); }
      lawBuf.length = 0;
      for (const id of e.responders) { const n = vesselById(id); if (n && n.visible && n.job === "engaged") lawBuf.push(n); }
      const wing = wingBuf;
      const law = lawBuf;
      foeBuf.length = 0;
      if (victim && victim.visible) foeBuf.push(victim);
      for (const n of law) foeBuf.push(n);
      const foesOfPirates = foeBuf;
      for (let i = 0; i < wing.length; i++) {
        const p = wing[i];
        const rate = 1.4;
        const ph = hash(p.id + ":fire");
        if (((t * rate + ph) % 1) < dt * rate && foesOfPirates.length) {
          const tgt = foesOfPirates[Math.floor(((t * 0.37 + ph) % 1) * foesOfPirates.length)];
          fireNpc(p, tgt, "npc-pirate");
        }
      }
      for (let i = 0; i < law.length; i++) {
        const s = law[i];
        const ph = hash(s.id + ":fire");
        if (((t * 1.8 + ph) % 1) < dt * 1.8 && wing.length) fireNpc(s, wing[Math.floor(((t * 0.29 + ph) % 1) * wing.length)], "npc-law");
      }
      if (victim && victim.visible && wing.length && ((t * 0.7 + hash(victim.id)) % 1) < dt * 0.7) fireNpc(victim, wing[0], "npc-law");
    }
    /* the seed's verdict, unless the player already settled it */
    if (!e.applied && t >= e.downAt) {
      e.applied = true;
      if (e.downId && !e.playerSaved) {
        const w = vesselById(e.downId);
        markVesselDown(e.downId, t);
        /* a wreck: hull plate the salvage tractor can take */
        if (w) burst({ x: w.x, y: w.y, z: w.z, vx: (w.vx ?? 0) * 0.3, vy: (w.vy ?? 0) * 0.3, vz: (w.vz ?? 0) * 0.3, count: 16, speed: 22, size: 9, good: "iron_ore", tint: 0.35 });
      }
      battleHooks.onEnd?.(e);
    }
  }
  return e;
}

/** A pirate died to the player during a live engagement: the victim is saved. */
export function pirateKilled(id, t) {
  const e = engagementAt(t);
  if (!e || !e.wing.includes(id)) return null;
  if (!e.applied) {
    e.playerSaved = true;
    e.outcome = "repelled";
    e.downId = id;
    e.applied = true;
    battleHooks.onEnd?.(e);
  }
  return e;
}

export function isHostileRole(role) { return HOSTILE_ROLES.has(role); }
export function isLawRole(role) { return LAW_ROLES.has(role); }
export { trafficDown };
