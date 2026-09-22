/* LIVING GALAXY — the rogue drones, and where they come from.
 *
 * "Rogue drone" used to be a string. One contact type in turrets.js, spawned
 * on a dice roll within four kilometres of the player whenever the player was
 * near the belt, flying straight at them, despawning at sixteen kilometres,
 * dropping steel into their hold when killed. It existed only where the
 * player was standing, it only ever attacked the player, and nothing else in
 * the sky knew it was there.
 *
 * Now they come from somewhere and they are going somewhere.
 *
 *   A NEST is a derelict — a dead yard, a cracked hauler, a mining platform
 *   nobody came back for — with something still running in it that is building
 *   drones out of whatever drifts past. Two or three per sky, seeded, out in
 *   the belt and the cold parts of the system where nobody patrols.
 *
 *   A WAVE is what comes out. It has a target picked before it launches: a
 *   port, a hull working the lanes, or a rival nest — because two machine
 *   intelligences building drones out of the same belt are competitors, and
 *   the sky is more interesting when the monsters have their own quarrel.
 *
 * A wave's drones are ordinary roster hulls with `rogue` set, which is the
 * whole trick: they fly with npc/flight.js, fight with npc/combat.js, show on
 * the board and the chart like anything else, get shot at by station
 * batteries, and provoke a distress call from whatever they jump. Nothing had
 * to learn about them specially.
 *
 * They are not a faction and they do not negotiate. There is no hailing a
 * nest and no paying it off.
 */

import { rngFromSeed } from "../generate.js";
import { stations as liveStations } from "../stations.js";
import { currentSystem } from "../bodies.js";
import { traffic, removeVessel, reindexTraffic, markVesselDown, HOSTILE_ROLES } from "./traffic.js";
import { armFlight, hullPerf, flyStep } from "./flight.js";
import { worksFor } from "../stationworks.js";
import { waveCap, perf } from "../perf.js";

/* ---- tuning -------------------------------------------------------------- */

export const NEST_MIN = 2;
export const NEST_MAX = 3;
export const WAVE_SLOT = 210;        // seconds between a nest's launch rolls
export const WAVE_CHANCE = 0.34;     // and the chance a roll sends one

/* ---- the tide -----------------------------------------------------------
 *
 * 0.3.30. Every nest rolled on the same fixed chance for ever, so the sky
 * settled on a constant: three nests, a launch about every three and a half
 * minutes, waves living ten — roughly fifteen rogue drones in the belt at all
 * times, always, whatever else was happening. Reported as exactly that: they
 * swarm the belts, they are always there, and there are always about the same
 * number of them.
 *
 * A derelict yard putting drones together out of belt scrap is not a tap. It
 * builds up, it spends itself, and it goes quiet for a while. So there is a
 * TIDE: a slow pressure on the whole sky, made of three seeded swells at
 * different periods, that spends real time at the bottom.
 *
 * Under `calm` the sky is genuinely empty — nothing launches, and anything
 * still out there is recalled rather than left to expire. Over `surge` the
 * nests are busy and the waves run large. In between is ordinary. The periods
 * are deliberately not multiples of each other, so the pattern does not repeat
 * on a schedule you could set a clock by.
 *
 * It is deterministic in the sky seed and in the clock, which means every
 * client in a shared sky is in the same weather without a byte crossing the
 * wire — the same trick the belt and the timetables already use. */
export const TIDE = {
  swells: [[1450, 1], [640, 0.55], [3100, 0.7]],   // period (s), weight
  calm: 0.26,        // below this the sky is quiet and nests hold
  surge: 0.68,       // above this they are busy
  lift: 2.1,         // launch chance at full surge, × the base
  size: 0.55,        // …and how much of the wave size rides the tide
  recall: true,      // a wave caught out by a lull goes home rather than expiring
};

let tideSeed = 0.37;

/** Pressure on the sky, 0…1, deterministic in the sky seed and the clock. */
export function rogueTide(t = 0) {
  let sum = 0, total = 0;
  for (let i = 0; i < TIDE.swells.length; i++) {
    const [period, weight] = TIDE.swells[i];
    const phase = tideSeed * 6.283 * (i + 1.37);
    sum += (Math.sin((t / period) * 6.283 + phase) * 0.5 + 0.5) * weight;
    total += weight;
  }
  /* squared, so the bottom is broad and flat: long quiets, sharp surges */
  return Math.pow(sum / total, 1.7);
}

/** What the tide is doing, in a word — for the band, the console and the log. */
export function tideState(t = 0) {
  const p = rogueTide(t);
  return { pressure: Math.round(p * 100) / 100, calm: p < TIDE.calm, surge: p > TIDE.surge,
    word: p < TIDE.calm ? "quiet" : p > TIDE.surge ? "swarming" : "active" };
}
export const WAVE_TTL = 620;         // a wave that has achieved nothing goes home
export const REBUILD_S = 260;        // a nest that lost a wave needs this long before the next
export const SIEGE_R = 2400;         // close enough to a port to be working on it
export const CHASE_GIVEUP = 260000;  // a wave stops chasing a hull that has outrun it
export const SIEGE_RATE = 0.9;       // stock destroyed per drone per second inside SIEGE_R
export const DRONE_HULLS = ["salvage_a", "general_a", "mining_a", "salvage_b"];
export const NEST_COLOURS = ["#7f6ad8", "#5f8fbc", "#8a7f5f"];

export const nests = [];             // live nests
export const waves = [];             // live waves
export const rogueHooks = { onLaunch: null, onSiege: null, onNestDown: null };

let seq = 1;
let rng = Math.random;
let slotSeen = -1;

export function resetRogues(seed) {
  for (const w of waves) for (const id of w.drones) removeVessel(id);
  nests.length = 0;
  waves.length = 0;
  seq = 1;
  slotSeen = -1;
  rng = rngFromSeed(`${seed ?? "sky"}:rogues`);
}

const d3 = (a, b) => Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z);

/* ---- the nests ----------------------------------------------------------- */

const NEST_NAMES = [
  "the Ledger", "Coldwork", "the Orphan Yard", "Tally", "the Dry Dock",
  "Nine Fathom", "the Remainder", "Pale Harvest", "the Long Shift",
];

/** Seed this sky's nests. Deterministic in the seed: the same sky, the same derelicts. */
export function populateNests(seed, system = currentSystem, stationList = liveStations) {
  resetRogues(seed);
  /* the tide's phase belongs to the sky, so two pilots in one room get the
   * same quiet and the same swarm without exchanging anything */
  tideSeed = rng();
  const belt = system?.belt ?? system?.outerBelt ?? { inner: 40000, outer: 70000 };
  const count = NEST_MIN + Math.floor(rng() * (NEST_MAX - NEST_MIN + 1));
  const used = new Set();
  for (let i = 0; i < count; i++) {
    /* far enough out that a port's guns are not the answer, and far enough
     * from each other that their waves have to cross open space to meet */
    const a = (i / count) * Math.PI * 2 + rng() * 0.8;
    const r = belt.inner + rng() * Math.max(2000, belt.outer - belt.inner) * 1.15;
    let name = NEST_NAMES[Math.floor(rng() * NEST_NAMES.length)];
    while (used.has(name)) name = NEST_NAMES[(NEST_NAMES.indexOf(name) + 1) % NEST_NAMES.length];
    used.add(name);
    nests.push({
      id: `nest${i + 1}`,
      name,
      x: Math.cos(a) * r,
      y: (rng() - 0.5) * 2600,
      z: Math.sin(a) * r,
      colour: NEST_COLOURS[i % NEST_COLOURS.length],
      strength: 0.7 + rng() * 0.6,      // how big its waves run
      ready: 0,                          // sky time it can launch again
      launched: 0,
      lost: 0,
      hp: 1400 + rng() * 900,
      hpMax: 0,
      known: false,                      // has anyone seen it yet
    });
    nests[nests.length - 1].hpMax = nests[nests.length - 1].hp;
  }
  return nests;
}

export function nestById(id) { return nests.find((n) => n.id === id) ?? null; }

/* ---- launching ----------------------------------------------------------- */

function makeDrone(nest, i, t) {
  const hull = DRONE_HULLS[Math.floor(rng() * DRONE_HULLS.length)];
  const a = rng() * Math.PI * 2, p = rng() * Math.PI - Math.PI / 2;
  const r = 140 + rng() * 260;
  const n = {
    id: `rog:${nest.id}:${seq++}`,
    recId: null,
    name: `${nest.name.replace(/^the /, "").toUpperCase()} ${100 + Math.floor(rng() * 899)}`,
    captain: "no one",
    captainGender: null,
    captainPronouns: null,
    role: "rogue",
    rogue: true,
    nest: nest.id,
    ship: hull,
    hullName: "Drone",
    color: nest.colour,
    from: null,
    to: null,
    corpId: null,
    legs: null,
    period: 600,
    phase: rng() * 600,
    orbitR: Math.hypot(nest.x, nest.z),
    omega: 0.0003,
    wobble: 0.02,
    amp: 400,
    traits: {},
    title: "",
    complexId: null,
    way: i % 3,
    visible: true,
    job: "watch",
    toName: "",
    state: "watch",
    x: nest.x + Math.cos(a) * Math.cos(p) * r,
    y: nest.y + Math.sin(p) * r,
    z: nest.z + Math.sin(a) * Math.cos(p) * r,
    yaw: 0, pitch: 0, speed: 0, vx: 0, vy: 0, vz: 0,
    docked: null, lane: null,
  };
  armFlight(n);
  /* a drone is small, quick and brittle: it wins by arriving in numbers */
  const p2 = hullPerf({ role: "rogue", ship: hull });
  n.fly.accel = p2.accel;
  n.fly.turn = p2.turn;
  n.fly.top = 900;
  n.hpMax = 70 + Math.round(rng() * 50);
  n.hp = n.hpMax;
  n.shieldMax = 20;
  n.shield = 20;
  n.radius = 4;
  n.gun = { dmg: 7, rate: 1.5, range: 1050, speed: 560, mounts: 1, cool: rng() * 1.5 };
  return n;
}

/** Pick what a nest sends its next wave at. */
function pickTarget(nest, t, stationList) {
  const options = [];
  /* a port: the nearer and the less defended, the more attractive */
  for (const st of stationList) {
    if (!st || !st.id) continue;
    const d = d3(nest, st);
    if (d > 900000) continue;
    const guns = st.mounts?.length ?? 0;
    options.push({ kind: "station", id: st.id, name: st.name, x: st.x, y: st.y, z: st.z, w: 2.4 / (1 + d / 200000) / (1 + guns * 0.22) });
  }
  /* a hull working the lanes: a supply run is the softest thing in the sky */
  for (const n of traffic) {
    if (n.rogue || n.job === "down" || n.visible === false) continue;
    const d = d3(nest, n);
    if (d > 260000) continue;
    const soft = n.role === "supply" || n.role === "hauler" ? 1.8 : n.role === "miner" ? 1.4 : 0.7;
    options.push({ kind: "hull", id: n.id, name: n.name, x: n.x, y: n.y, z: n.z, w: soft / (1 + d / 90000) });
  }
  /* a rival nest: they are building out of the same belt */
  for (const o of nests) {
    if (o === nest || o.hp <= 0) continue;
    options.push({ kind: "nest", id: o.id, name: o.name, x: o.x, y: o.y, z: o.z, w: 1.5 / (1 + d3(nest, o) / 160000) });
  }
  if (!options.length) return null;
  let total = 0;
  for (const o of options) total += o.w;
  let r = rng() * total;
  for (const o of options) { r -= o.w; if (r <= 0) return o; }
  return options[options.length - 1];
}

/** Send a wave. Returns it, or null if the nest is not ready or nothing is worth hitting. */
export function launchWave(nest, t, stationList = liveStations, tide = null) {
  if (nest.hp <= 0 || t < nest.ready) return null;
  const target = pickTarget(nest, t, stationList);
  if (!target) return null;
  /* 0.3.30 — the size rides the tide as well as the roll, so a quiet sky that
   * does send something sends two, and a swarm is a swarm. A flat 3–8 every
   * time is what made the belt feel like a fixed cost. */
  const p = tide == null ? rogueTide(t) : tide;
  const swell = 1 - TIDE.size + TIDE.size * 2 * p;
  const want = waveCap(Math.max(1, Math.round((1.5 + rng() * 5.5) * nest.strength * swell)));
  const wave = {
    id: `wave${seq++}`,
    nest: nest.id,
    at: t,
    expires: t + WAVE_TTL,
    target,
    drones: [],
    state: "outbound",
    kills: 0,
  };
  for (let i = 0; i < want; i++) {
    const d = makeDrone(nest, i, t);
    d.wave = wave.id;
    d.target = target;
    traffic.push(d);
    wave.drones.push(d.id);
  }
  reindexTraffic();
  nest.launched++;
  nest.ready = t + WAVE_SLOT;
  waves.push(wave);
  rogueHooks.onLaunch?.(wave, nest);
  return wave;
}

/* ---- the drones' own flying ---------------------------------------------- */

/**
 * A rogue drone flies its wave's target unless npc/combat.js has already
 * given it something closer to shoot. Installed as a director downstream of
 * combat, so a drone that has found prey fights it and the rest press on.
 */
export function flyRogue(n, t, dt, ctx) {
  if (!n.rogue) return false;
  const nest = nestById(n.nest);
  const wave = waves.find((w) => w.id === n.wave);
  armFlight(n);
  n.visible = true;

  /* no wave left, or recalled: head home and dissolve back into the nest */
  if (!wave || wave.state === "home") {
    if (!nest) return false;
    n.job = "watch";
    n.toName = nest.name;
    const d = d3(n, nest);
    if (d < 400) { n.despawn = true; return true; }
    flyStep(n, dt, nest.x, nest.y, nest.z, { top: 900 });
    return true;
  }

  const tg = wave.target;
  /* the target may have moved, been destroyed, or docked */
  const live = resolveTarget(tg, ctx?.stations ?? liveStations);
  if (!live) { retarget(wave, t, ctx?.stations ?? liveStations); return true; }
  /* a hull that lit its drive is gone and is not coming back into reach: a
   * wave that keeps chasing it flies out of the system and achieves nothing.
   * Pick something else while there is still time on the clock. */
  if (tg.kind === "hull" && (live.drive || d3(n, live) > CHASE_GIVEUP)) { retarget(wave, t, ctx?.stations ?? liveStations); return true; }
  tg.x = live.x; tg.y = live.y; tg.z = live.z;

  n.job = "engaged";
  n.toName = tg.name;
  const d = d3(n, live);
  /* a swarm spreads out on the way in so a point-defence cluster cannot take
   * the whole wave with one traverse */
  const spread = 260 + (n.way ?? 0) * 190;
  flyStep(n, dt, tg.x, tg.y, tg.z, { standoff: tg.kind === "hull" ? 420 : Math.max(SIEGE_R * 0.5, spread), top: 900, evade: d < 6000 ? 0.8 : 0 });
  return true;
}

/** The wave's objective is gone or unreachable: pick another, or go home. */
function retarget(wave, t, stationList) {
  const nest = nestById(wave.nest);
  const next = nest ? pickTarget(nest, t, stationList) : null;
  if (!next || t > wave.expires - 60) { wave.state = "home"; return null; }
  wave.target = next;
  wave.state = "outbound";
  for (const id of wave.drones) { const d = traffic.find((x) => x.id === id); if (d) d.target = next; }
  return next;
}

function resolveTarget(tg, stationList) {
  if (tg.kind === "station") return stationList.find((s) => s.id === tg.id) ?? null;
  if (tg.kind === "nest") { const o = nestById(tg.id); return o && o.hp > 0 ? o : null; }
  const n = traffic.find((x) => x.id === tg.id);
  return n && n.job !== "down" && n.visible !== false ? n : null;
}

/* ---- the tick ------------------------------------------------------------ */

export function stepRogues(t, dt, stationList = liveStations, shipPos = null) {
  /* launch rolls, on the shared slot cadence */
  const slot = Math.floor(t / WAVE_SLOT);
  if (slot !== slotSeen) {
    slotSeen = slot;
    const tide = rogueTide(t);
    for (const nest of nests) {
      if (nest.hp <= 0 || t < nest.ready) continue;
      /* 0.3.30: nothing builds during a lull. The nest is still there, it is
       * just not sending anything, which is what makes the belt worth flying
       * through some of the time. */
      if (tide < TIDE.calm) continue;
      /* a busy sky sends fewer: the budget decides how much of this the
       * device can carry, not a guess about the device */
      const chance = WAVE_CHANCE * (perf.tier >= 2 ? 1 : 0.55) * (1 + (TIDE.lift - 1) * tide);
      if (rng() < chance) launchWave(nest, t, stationList, tide);
    }
  }

  /* waves: siege, expiry, and cleaning up the dead */
  for (let i = waves.length - 1; i >= 0; i--) {
    const w = waves[i];
    let alive = 0;
    for (let k = w.drones.length - 1; k >= 0; k--) {
      const id = w.drones[k];
      const n = traffic.find((x) => x.id === id);
      if (!n || n.despawn || n.job === "down" || n.hp <= 0) {
        if (n && (n.despawn || n.job === "down" || n.hp <= 0)) removeVessel(id);
        w.drones.splice(k, 1);
        continue;
      }
      alive++;
    }
    if (!alive) {
      const nest = nestById(w.nest);
      if (nest) { nest.lost++; nest.ready = Math.max(nest.ready, t + REBUILD_S); }
      waves.splice(i, 1);
      continue;
    }
    if (t > w.expires && w.state !== "home") w.state = "home";
    /* 0.3.30: the tide went out from under them — they break off and go home
     * rather than hanging about until their ten minutes are up */
    if (TIDE.recall && w.state !== "home" && rogueTide(t) < TIDE.calm) { w.state = "home"; w.expires = Math.min(w.expires, t + 90); }

    /* a wave sitting on a port is taking it apart */
    if (w.target.kind === "station" && w.state !== "home") {
      const st = stationList.find((s) => s.id === w.target.id);
      if (st) {
        let onIt = 0;
        for (const id of w.drones) {
          const n = traffic.find((x) => x.id === id);
          if (n && d3(n, st) < SIEGE_R) onIt++;
        }
        if (onIt) {
          w.state = "siege";
          st.siegeUntil = t + 12;
          st.siegeBy = w.id;
          st.siegeDrones = onIt;
          /* they are not raiding it, they are eating it: the magazines and the
           * drone racks go first, which is exactly what the port needs to
           * fight them off. A siege left alone disarms the port that is
           * under it. */
          const w2 = worksFor(st);
          if (w2?.stock) {
            const bite = SIEGE_RATE * onIt * dt;
            for (const k of ["drone", "missile", "slug"]) {
              if (!(w2.stock[k] > 0)) continue;
              const took = Math.min(w2.stock[k], bite);
              w2.stock[k] -= took;
              break;
            }
          }
          if (Array.isArray(st.stock)) {
            const line = st.stock[Math.floor(rng() * st.stock.length)];
            if (line && line.qty > 0) line.qty = Math.max(0, line.qty - SIEGE_RATE * onIt * dt * 0.6);
          }
          rogueHooks.onSiege?.(st, w, onIt, dt);
        } else if (w.state === "siege") { w.state = "outbound"; st.siegeDrones = 0; }
      }
    }

    /* and a wave sitting on a rival nest is dismantling it */
    if (w.target.kind === "nest" && w.state !== "home") {
      const o = nestById(w.target.id);
      if (o && o.hp > 0) {
        let onIt = 0;
        for (const id of w.drones) {
          const n = traffic.find((x) => x.id === id);
          if (n && d3(n, o) < SIEGE_R) onIt++;
        }
        if (onIt) {
          o.hp -= onIt * 7 * dt;
          if (o.hp <= 0) {
            o.hp = 0;
            rogueHooks.onNestDown?.(o, w);
            /* its own drones go with it */
            for (let k = waves.length - 1; k >= 0; k--) if (waves[k].nest === o.id) waves[k].state = "home";
          }
        }
      } else w.state = "home";
    }
  }
  return waves;
}

/**
 * Install the director. Chain-safe, and deliberately LAST in the chain: a
 * drone that npc/combat.js has put onto a target fights that target, and only
 * one with nothing in front of it presses on toward the wave's objective.
 */
export function mountRogues(trafficHooks) {
  const prev = trafficHooks.director;
  trafficHooks.director = (n, t, dt, ctx) => {
    if (prev && prev(n, t, dt, ctx)) return true;
    return flyRogue(n, t, dt, ctx);
  };
}

/** Everything the console and the news desk want. */
export function rogueReport(t) {
  return {
    nests: nests.map((n) => ({ id: n.id, name: n.name, hp: Math.round(n.hp), hpMax: Math.round(n.hpMax), launched: n.launched, lost: n.lost, ready: Math.max(0, Math.round(n.ready - t)), known: n.known })),
    waves: waves.map((w) => ({ id: w.id, nest: w.nest, target: w.target.name, kind: w.target.kind, drones: w.drones.length, state: w.state, left: Math.round(w.expires - t) })),
    drones: traffic.reduce((k, n) => k + (n.rogue ? 1 : 0), 0),
    tide: tideState(t),
  };
}

/* rogues are hostile to everything with a crew, which is what makes station
 * batteries and the directorate answer them without being told to */
HOSTILE_ROLES.add("rogue");
