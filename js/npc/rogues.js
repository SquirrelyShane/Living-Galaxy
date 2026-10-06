import { rngFromSeed } from "../world/generate.js";
import { stations as liveStations } from "../station/stations.js";
import { currentSystem } from "../world/bodies.js";
import { traffic, removeVessel, reindexTraffic, markVesselDown, HOSTILE_ROLES } from "./traffic.js";
import { armFlight, hullPerf, flyStep } from "./flight.js";
import { worksFor } from "../station/stationworks.js";
import { waveCap, perf } from "../core/perf.js";

export const NEST_MIN = 2;
export const NEST_MAX = 3;
export const WAVE_SLOT = 210;
export const WAVE_CHANCE = 0.34;

export const TIDE = {
  swells: [[1450, 1], [640, 0.55], [3100, 0.7]],
  calm: 0.26,
  surge: 0.68,
  lift: 2.1,
  size: 0.55,
  recall: true,
};

let tideSeed = 0.37;

export function rogueTide(t = 0) {
  let sum = 0, total = 0;
  for (let i = 0; i < TIDE.swells.length; i++) {
    const [period, weight] = TIDE.swells[i];
    const phase = tideSeed * 6.283 * (i + 1.37);
    sum += (Math.sin((t / period) * 6.283 + phase) * 0.5 + 0.5) * weight;
    total += weight;
  }
  return Math.pow(sum / total, 1.7);
}

export function tideState(t = 0) {
  const p = rogueTide(t);
  return { pressure: Math.round(p * 100) / 100, calm: p < TIDE.calm, surge: p > TIDE.surge,
    word: p < TIDE.calm ? "quiet" : p > TIDE.surge ? "swarming" : "active" };
}
export const WAVE_TTL = 620;
export const REBUILD_S = 260;
export const SIEGE_R = 2400;
export const CHASE_GIVEUP = 260000;
export const SIEGE_RATE = 0.9;
export const DRONE_HULLS = ["salvage_a", "general_a", "mining_a", "salvage_b"];
export const NEST_COLOURS = ["#7f6ad8", "#5f8fbc", "#8a7f5f"];

export const nests = [];
export const waves = [];
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

const NEST_NAMES = [
  "the Ledger", "Coldwork", "the Orphan Yard", "Tally", "the Dry Dock",
  "Nine Fathom", "the Remainder", "Pale Harvest", "the Long Shift",
];

export function populateNests(seed, system = currentSystem, stationList = liveStations) {
  resetRogues(seed);
  tideSeed = rng();
  const belt = system?.belt ?? system?.outerBelt ?? { inner: 40000, outer: 70000 };
  const count = NEST_MIN + Math.floor(rng() * (NEST_MAX - NEST_MIN + 1));
  const used = new Set();
  for (let i = 0; i < count; i++) {
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
      strength: 0.7 + rng() * 0.6,
      ready: 0,
      launched: 0,
      lost: 0,
      hp: 1400 + rng() * 900,
      hpMax: 0,
      known: false,
    });
    nests[nests.length - 1].hpMax = nests[nests.length - 1].hp;
  }
  return nests;
}

export function nestById(id) { return nests.find((n) => n.id === id) ?? null; }

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

function pickTarget(nest, t, stationList) {
  const options = [];
  for (const st of stationList) {
    if (!st || !st.id) continue;
    const d = d3(nest, st);
    if (d > 900000) continue;
    const guns = st.mounts?.length ?? 0;
    options.push({ kind: "station", id: st.id, name: st.name, x: st.x, y: st.y, z: st.z, w: 2.4 / (1 + d / 200000) / (1 + guns * 0.22) });
  }
  for (const n of traffic) {
    if (n.rogue || n.job === "down" || n.visible === false) continue;
    const d = d3(nest, n);
    if (d > 260000) continue;
    const soft = n.role === "supply" || n.role === "hauler" ? 1.8 : n.role === "miner" ? 1.4 : 0.7;
    options.push({ kind: "hull", id: n.id, name: n.name, x: n.x, y: n.y, z: n.z, w: soft / (1 + d / 90000) });
  }
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

export function launchWave(nest, t, stationList = liveStations, tide = null) {
  if (nest.hp <= 0 || t < nest.ready) return null;
  const target = pickTarget(nest, t, stationList);
  if (!target) return null;
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

export function flyRogue(n, t, dt, ctx) {
  if (!n.rogue) return false;
  const nest = nestById(n.nest);
  const wave = waves.find((w) => w.id === n.wave);
  armFlight(n);
  n.visible = true;

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
  const live = resolveTarget(tg, ctx?.stations ?? liveStations);
  if (!live) { retarget(wave, t, ctx?.stations ?? liveStations); return true; }
  if (tg.kind === "hull" && (live.drive || d3(n, live) > CHASE_GIVEUP)) { retarget(wave, t, ctx?.stations ?? liveStations); return true; }
  tg.x = live.x; tg.y = live.y; tg.z = live.z;

  n.job = "engaged";
  n.toName = tg.name;
  const d = d3(n, live);
  const spread = 260 + (n.way ?? 0) * 190;
  flyStep(n, dt, tg.x, tg.y, tg.z, { standoff: tg.kind === "hull" ? 420 : Math.max(SIEGE_R * 0.5, spread), top: 900, evade: d < 6000 ? 0.8 : 0 });
  return true;
}

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

function indexWaveVessels() {
  const index = new Map();
  for (const n of traffic) if (!index.has(n.id)) index.set(n.id, n);
  return index;
}

export function stepRogues(t, dt, stationList = liveStations, shipPos = null) {
  const slot = Math.floor(t / WAVE_SLOT);
  if (slot !== slotSeen) {
    slotSeen = slot;
    const tide = rogueTide(t);
    for (const nest of nests) {
      if (nest.hp <= 0 || t < nest.ready) continue;
      if (tide < TIDE.calm) continue;
      const chance = WAVE_CHANCE * (perf.tier >= 2 ? 1 : 0.55) * (1 + (TIDE.lift - 1) * tide);
      if (rng() < chance) launchWave(nest, t, stationList, tide);
    }
  }

  if (!waves.length) return waves;
  let vessels = indexWaveVessels();
  for (let i = waves.length - 1; i >= 0; i--) {
    const w = waves[i];
    let alive = 0;
    for (let k = w.drones.length - 1; k >= 0; k--) {
      const id = w.drones[k];
      const n = vessels.get(id);
      if (!n || n.despawn || n.job === "down" || n.hp <= 0) {
        if (n && (n.despawn || n.job === "down" || n.hp <= 0)) { removeVessel(id); vessels = indexWaveVessels(); }
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
    if (TIDE.recall && w.state !== "home" && rogueTide(t) < TIDE.calm) { w.state = "home"; w.expires = Math.min(w.expires, t + 90); }

    if (w.target.kind === "station" && w.state !== "home") {
      const st = stationList.find((s) => s.id === w.target.id);
      if (st) {
        let onIt = 0;
        for (const id of w.drones) {
          const n = vessels.get(id);
          if (n && d3(n, st) < SIEGE_R) onIt++;
        }
        if (onIt) {
          w.state = "siege";
          st.siegeUntil = t + 12;
          st.siegeBy = w.id;
          st.siegeDrones = onIt;
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
          if (rogueHooks.onSiege) { rogueHooks.onSiege(st, w, onIt, dt); vessels = indexWaveVessels(); }
        } else if (w.state === "siege") { w.state = "outbound"; st.siegeDrones = 0; }
      }
    }

    if (w.target.kind === "nest" && w.state !== "home") {
      const o = nestById(w.target.id);
      if (o && o.hp > 0) {
        let onIt = 0;
        for (const id of w.drones) {
          const n = vessels.get(id);
          if (n && d3(n, o) < SIEGE_R) onIt++;
        }
        if (onIt) {
          o.hp -= onIt * 7 * dt;
          if (o.hp <= 0) {
            o.hp = 0;
            if (rogueHooks.onNestDown) { rogueHooks.onNestDown(o, w); vessels = indexWaveVessels(); }
            for (let k = waves.length - 1; k >= 0; k--) if (waves[k].nest === o.id) waves[k].state = "home";
          }
        }
      } else w.state = "home";
    }
  }
  return waves;
}

export function mountRogues(trafficHooks) {
  const prev = trafficHooks.director;
  trafficHooks.director = (n, t, dt, ctx) => {
    if (prev && prev(n, t, dt, ctx)) return true;
    return flyRogue(n, t, dt, ctx);
  };
}

export function rogueReport(t) {
  return {
    nests: nests.map((n) => ({ id: n.id, name: n.name, hp: Math.round(n.hp), hpMax: Math.round(n.hpMax), launched: n.launched, lost: n.lost, ready: Math.max(0, Math.round(n.ready - t)), known: n.known })),
    waves: waves.map((w) => ({ id: w.id, nest: w.nest, target: w.target.name, kind: w.target.kind, drones: w.drones.length, state: w.state, left: Math.round(w.expires - t) })),
    drones: traffic.reduce((k, n) => k + (n.rogue ? 1 : 0), 0),
    tide: tideState(t),
  };
}

HOSTILE_ROLES.add("rogue");
