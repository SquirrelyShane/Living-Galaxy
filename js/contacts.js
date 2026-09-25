/* LIVING GALAXY — the contact register.
 *
 * The chart used to draw every hull in the sky, at true position, with its
 * name, forever — the comment in map.js said so outright: "every hull on the
 * board, wherever it is". That is not a sensor picture, it is omniscience,
 * and it makes the scanner, the probes and the whole idea of a sensor range
 * decorative.
 *
 * So nothing is on the chart until you have earned it. A contact starts as
 * an unknown return and resolves while you keep the scanner on it:
 *
 *   0  nothing            not on the chart at all
 *   1  return             a blob, with a position error that shrinks
 *   2  track              hull class, heading and speed
 *   3  identified         name, corp, and what it is carrying
 *
 * Resolution is a number that rises while you look and falls when you stop,
 * so a busy lane you swept once does not stay lit for the rest of the
 * session. Four things are exempt, because you do not need a scanner to know
 * about them: your own hulls, your corp's structures, anything inside a
 * probe's footprint, and the ports, which are on the chart because they are
 * charted.
 *
 * ---- two scanners, both always running ----------------------------------
 *
 * The array does two jobs at once, the way a real one would:
 *
 *   BROAD   a wide sweep over everything in range. It is fast and it is
 *           shallow: it will tell you there is a freighter out there and
 *           whether it is shooting at you, and it will never tell you its
 *           name. Capped at `broadCap`, which sits above the track threshold
 *           and below the identification one, so a broad return can reach
 *           level 2 and can never reach level 3.
 *
 *   FOCUS   the narrow beam, on exactly ONE contact at a time. It is the only
 *           thing that can push a return past `ident` and produce a name, a
 *           flag and a manifest. It points where you point: the contact
 *           nearest your reticle inside the dish's cone, and when you are not
 *           looking at anything in particular it works down the board on its
 *           own, nearest and most interesting first.
 *
 * Once a hull has been identified it STAYS identified for as long as it is in
 * range — `known` latches. Losing a name the moment the beam moved on would
 * be realistic and would also make a busy board flicker between "freighter"
 * and "Kestrel VOSS-42" continuously, which is unreadable. Drift out of range
 * and the record ages out; meet it again and it is a stranger again.
 */

import { sim } from "./sim.js";
import { traffic } from "./npc/traffic.js";
import { flow } from "./npc/flow.js";
import { probes } from "./probes.js";
import { forwardOf } from "./ship.js";
import { shipFx } from "./ship.js";

export const SCAN = {
  /* Deliberately modest. The old sensor range was 300 km and everything
   * inside it was fully identified the instant it entered; the point of a
   * scanner is that it costs you something. */
  range: 12000,          // u — where a return can be picked up at all
  cone: 0.55,            // rad — half-angle the dish actually looks down
  omni: 0.16,            // how much of the gain you get off-axis
  gain: 0.55,            // resolution per second at ideal range, on the nose (× the phased-array refit)
  decay: 0.055,          // resolution lost per second when nothing is looking
  pulseBonus: 2.6,       // an active pulse resolves this much faster
  probeWatch: 9000,      // u — a landed probe keeps this much of the sky under watch
  /* 0.3.50 — the long-range track is gone. From 0.2.x a hull under drive
   * anywhere inside 1.4 million u put a blob on the chart, so the nav map
   * showed every NPC warping across the system, and the register kept a live
   * record for every hull in the sky at 5 Hz to do it. A contact is now what
   * the dish can actually see (`range`), and a hull with its drive lit is not
   * a contact at all until it drops out: a warp is a streak, not a track. */
  keep: 240,             // seconds a stale record is remembered before it is dropped
  /* level thresholds */
  seen: 0.14,
  track: 0.46,
  ident: 0.84,
  /* The broad sweep's ceiling. Deliberately between `track` and `ident`: wide
   * enough to class a hull and colour it, never enough to name it. Moving
   * this above `ident` would hand every name in the sky back for free. */
  broadCap: 0.62,
  broadGain: 0.42,       // how fast the wide sweep fills, per second, at ideal range
  focusGain: 0.95,       // and the narrow beam, which is the only way past `ident`
  focusCone: 0.30,       // rad — how near the reticle a contact must be to take the beam
  focusHold: 1.2,        // s — the beam stays on a target this long before it may be stolen
};

/** id -> { res, x, y, z, at, kind, ref } */
export const register = new Map();

export function levelOf(res) {
  if (res >= SCAN.ident) return 3;
  if (res >= SCAN.track) return 2;
  if (res >= SCAN.seen) return 1;
  return 0;
}

/** How far off a blob might really be, in world units. */
export function errorOf(rec, dist) {
  const raw = Math.max(120, dist * 0.07);
  return raw * Math.pow(1 - Math.min(1, rec.res), 1.6);
}

function d3(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z);
}

/* ---- the things you never have to scan ----------------------------------
 * Your own hulls are flagged `company` by fleet.js when it puts them on the
 * board, so this needs no import and cannot go stale. Ports and worlds are
 * not in here at all: they are charted, not detected, and the map draws them
 * from the body list as it always did.
 */

/** Anything sitting inside a landed probe's footprint is being watched for you. */
function probeCovers(x, y, z) {
  for (const pr of probes) {
    if (!pr.done) continue;
    const r = pr.scanR ?? SCAN.probeWatch;
    if (Math.hypot(x - pr.x, (y ?? 0) - (pr.y ?? 0), z - pr.z) <= r) return true;
  }
  return false;
}

/* ---- the tick ------------------------------------------------------------ */

let acc = 0;
const RATE = 0.2;        // the register updates at 5 Hz, not per frame

export function tickContacts(dt) {
  acc += dt;
  if (acc < RATE) return;
  const step = acc;
  acc = 0;

  const ship = sim.ship;
  if (!ship) return;
  const f = forwardOf(ship.aimYaw ?? ship.yaw, ship.aimPitch ?? ship.pitch);
  const pulsing = sim.time < (sim.pulseUntil ?? 0);
  const range = SCAN.range * (ship.mods?.scan ?? 1);

  const touch = (id, v, kind) => {
    let rec = register.get(id);
    /* Free knowledge first: your own hulls and a probe's footprint never need
     * the dish (and your own fleet stays on the chart even under drive). */
    if (v.company === true || probeCovers(v.x, v.y ?? 0, v.z)) {
      if (!rec) { rec = { id, res: 0, x: v.x, y: v.y ?? 0, z: v.z, at: sim.time, kind, ref: v }; register.set(id, rec); }
      rec.ref = v; rec.kind = kind;
      rec.res = 1;
      rec.x = v.x; rec.y = v.y ?? 0; rec.z = v.z; rec.at = sim.time;
      rec.free = true;
      return;
    }
    /* 0.3.50: out of the dish's range, or under drive — not a contact. An
     * existing record just decays (below); nothing new is allocated, so a busy
     * sky costs the register only what is actually near you. */
    const dist = d3(ship.pos, v);
    if (dist > range || v.drive) {
      if (rec) { rec.free = false; rec.ref = v; if (v.drive) rec.res = 0; }   // lit its drive: off the chart now, not a fading blob
      return;
    }
    if (!rec) {
      rec = { id, res: 0, x: v.x, y: v.y ?? 0, z: v.z, at: sim.time, kind, ref: v };
      register.set(id, rec);
    }
    rec.ref = v;
    rec.kind = kind;
    rec.free = false;

    /* ---- the broad sweep ----
     * Everything in range, every pass, up to `broadCap`. On the nose fills
     * faster than off to the side and close faster than far, so pointing the
     * ship still means something — but no amount of sweeping will name
     * anything, because the ceiling is below `ident`. */
    const dx = (v.x - ship.pos.x) / (dist || 1);
    const dy = ((v.y ?? 0) - ship.pos.y) / (dist || 1);
    const dz = (v.z - ship.pos.z) / (dist || 1);
    const dot = dx * f.x + dy * f.y + dz * f.z;
    const ang = Math.acos(Math.max(-1, Math.min(1, dot)));
    const onAxis = ang <= SCAN.cone ? 1 : Math.max(0, 1 - (ang - SCAN.cone) / 0.9);
    const aim = SCAN.omni + (1 - SCAN.omni) * onAxis;
    const closeness = 1 - Math.min(0.92, dist / range);
    const gain = shipFx.fx("resolve", 1) * aim * (0.25 + closeness) * (pulsing ? SCAN.pulseBonus : 1);

    rec.ang = ang;
    rec.dist = dist;
    rec.inRange = true;

    if (rec.res < SCAN.broadCap) rec.res = Math.min(SCAN.broadCap, rec.res + SCAN.broadGain * gain * step);
    /* the beam is applied after the sweep, once we know who has it */
    rec.gain = gain;

    /* The believed position only updates while you actually have a return —
     * that is why a stale blob sits where you last saw it and its error
     * circle grows as it ages. */
    rec.x = v.x; rec.y = v.y ?? 0; rec.z = v.z;
    rec.at = sim.time;
  };

  for (const rec of register.values()) { rec.inRange = false; rec.gain = 0; }
  for (const n of traffic) if (n.visible !== false) touch(n.id, n, "vessel");
  for (const n of flow) if (n.visible) touch(n.id, n, "boat");

  /* ---- the narrow beam ----
   * One contact at a time. It goes where you are looking; when you are not
   * looking at anything in particular it works the board itself. */
  stepFocus(step);

  /* Decay anything we did not touch this pass, and forget it eventually. */
  for (const [id, rec] of register) {
    if (rec.at === sim.time || rec.free) continue;
    rec.res = Math.max(0, rec.res - SCAN.decay * step);
    /* a name is only held while the hull is in range: drift apart and it goes
     * back to being a stranger, which is what stops one sweep of a lane
     * naming its traffic for the rest of the session */
    if (!rec.inRange) rec.known = false;
    if (rec.res <= 0 && sim.time - rec.at > SCAN.keep) register.delete(id);
  }
}

/* ---- focus ---------------------------------------------------------------- */

export const focus = { id: null, since: -1e9, res: 0 };

/**
 * Pick and drive the narrow beam. Preference order:
 *
 *   1. what you have locked, if it is in range — an explicit choice wins
 *   2. the unidentified contact nearest your reticle, inside `focusCone`
 *   3. otherwise, work the board: nearest first among what is not yet named
 *
 * A held target is not given up for `focusHold` seconds, so sweeping the nose
 * across a crowded lane does not restart the beam on a new hull every frame
 * and finish none of them.
 */
function stepFocus(step) {
  const held = focus.id ? register.get(focus.id) : null;
  const heldLive = held && held.inRange && !held.free && !held.known;
  const locked = sim.lock?.id ? register.get(sim.lock.id) : null;

  let pick = null;
  if (locked && locked.inRange && !locked.free && !locked.known) {
    pick = locked;
  } else if (heldLive && sim.time - focus.since < SCAN.focusHold) {
    pick = held;
  } else {
    /* nearest the reticle, inside the cone */
    let best = null, bestAng = SCAN.focusCone;
    for (const rec of register.values()) {
      if (!rec.inRange || rec.free || rec.known) continue;
      if (rec.ang < bestAng) { best = rec; bestAng = rec.ang; }
    }
    /* Nothing under the reticle: work the board on its own. Nearest first,
     * but not blindly — a port's flow boats are anonymous by construction and
     * identifying one tells you "hull", so an array that spends itself on the
     * three boats orbiting a station while a raider closes is working hard
     * and telling you nothing. Crewed hulls outrank boats, and something
     * already resolved most of the way is finished before a new one starts. */
    if (!best) {
      let bestScore = -Infinity;
      for (const rec of register.values()) {
        if (!rec.inRange || rec.free || rec.known) continue;
        const score = (rec.kind === "boat" ? -1.2 : 0)
          + rec.res * 1.4                       // finish what is nearly done
          - rec.dist / Math.max(1, SCAN.range);  // and prefer what is close
        if (score > bestScore) { bestScore = score; best = rec; }
      }
    }
    pick = best ?? (heldLive ? held : null);
  }

  if (!pick) { focus.id = null; focus.res = 0; return; }
  if (pick.id !== focus.id) { focus.id = pick.id; focus.since = sim.time; }

  const rate = SCAN.focusGain * (pick.gain || 0.25);
  pick.res = Math.min(1, pick.res + rate * step);
  if (pick.res >= SCAN.ident) pick.known = true;
  focus.res = pick.res;
}

/**
 * What the chart is allowed to draw. Each entry carries its level and its
 * position error so the map can show an honest blob rather than a dot it has
 * no right to.
 */
export function knownContacts() {
  const out = [];
  const ship = sim.ship;
  for (const rec of register.values()) {
    const level = effLevel(rec);
    if (level <= 0) continue;
    const dist = ship ? d3(ship.pos, rec) : 0;
    out.push({
      id: rec.id,
      level,
      res: rec.res,
      kind: rec.kind,
      x: rec.x, y: rec.y, z: rec.z,
      err: rec.free ? 0 : errorOf(rec, dist),
      age: ship ? sim.time - rec.at : 0,
      ref: rec.ref,
      /* What the player is actually allowed to be told at this level. */
      name: level >= 3 ? rec.ref?.name ?? "contact" : level >= 2 ? classOf(rec.ref) : "unknown",
      role: level >= 2 ? rec.ref?.role ?? null : null,
      corpId: level >= 3 ? rec.ref?.corpId ?? null : null,
      cargo: level >= 3 ? rec.ref?.cargo ?? null : null,
      yaw: level >= 2 ? rec.ref?.yaw ?? 0 : null,
    });
  }
  return out;
}

/* ---- what kind of thing is flying it ------------------------------------
 *
 * Four tags, and the distinction each one draws is about WHO IS IN THE LOOP,
 * not about size or armament:
 *
 *   P  a person at a console — another pilot in the room, or one of your own
 *      company hulls, which answer to you
 *   N  a crewed hull with somebody in the chair: the sky's own captains
 *   D  a deployed drone. Launched by a ship or a port, belongs to it, goes
 *      home to it: work drones, interceptors, a corporation's line
 *   R  an autonomous robotic hull with no crew and no parent — the nests'
 *      machines, which are nobody's and are not going home
 *
 * The tag is what the bracket on the canopy reads, and it is deliberately the
 * first thing you learn about a contact: it survives at level 1, before the
 * scanner knows the hull class and long before it knows a name, because an
 * unidentified return that is somebody's drone and an unidentified return
 * that is a crewed ship are different problems.
 */
export function hullTag(v) {
  if (!v) return "N";
  if (v.rogue) return "R";
  if (v.company === true || v.kind === "peer" || v.peer === true) return "P";
  if (v.kind === "drone" || v.kind === "sdrone" || v.kind === "cdrone") return "D";
  if (v.corpDrone || v.dronesOut != null) return "D";
  const id = String(v.id ?? "");
  if (id.startsWith("pdrone-") || id.startsWith("cd:") || id.startsWith("sdrone-") || id.startsWith("drone-")) return "D";
  /* a port's own shuttle: belongs to the ring, flies a fixed loop, goes home,
   * and nobody is filed as its captain */
  if (id.startsWith("flow:") || v.port != null) return "D";
  if (id.startsWith("rog:")) return "R";
  return "N";
}

/** A hull class, without a name attached to it. */
export function classOf(v) {
  if (!v) return "contact";
  const r = v.role ?? "";
  if (r === "pirate" || r === "security" || r === "patrol") return "warship";
  if (r === "miner") return "miner";
  if (r === "hauler" || r === "trader") return "freighter";
  return v.hullClass ?? "hull";
}

/** One contact's level, for the HUD and the lock computer. */
/** The level a record actually discloses at, `known` included. */
export function effLevel(rec) {
  if (!rec) return 0;
  if (rec.free) return 3;
  if (rec.known && rec.inRange) return 3;
  return levelOf(rec.res);
}

export function levelFor(id) {
  return effLevel(register.get(id));
}

/**
 * Everything the canopy is allowed to say about one contact, in one lookup.
 * `level` 0 means say nothing at all.
 */
export function contactView(id) {
  const rec = register.get(id);
  if (!rec) return null;
  const level = effLevel(rec);
  if (level <= 0) return null;
  return {
    level,
    res: rec.res,
    /* level 1 is a return and nothing more; 2 knows what shape it is; only 3
     * has a name, and only the beam produces a 3 */
    label: level >= 3 ? (rec.ref?.name ?? "contact") : level >= 2 ? classOf(rec.ref) : "unknown",
    named: level >= 3,
    focused: focus.id === id,
    dist: rec.dist ?? 0,
  };
}

/** What the narrow beam is working on right now, for the HUD readout. */
export function scanFocus() {
  const rec = focus.id ? register.get(focus.id) : null;
  if (!rec) return null;
  const level = effLevel(rec);
  return {
    id: rec.id,
    res: rec.res,
    level,
    /* how far through identification the beam is, which is the bar worth
     * showing: broad already got it to `broadCap` for free */
    progress: Math.max(0, Math.min(1, (rec.res - SCAN.broadCap) / Math.max(0.01, 1 - SCAN.broadCap))),
    name: level >= 3 ? rec.ref?.name : level >= 2 ? classOf(rec.ref) : "unknown return",
  };
}

export function resetContacts() {
  register.clear();
  acc = 0;
  focus.id = null;
  focus.since = -1e9;
  focus.res = 0;
}
