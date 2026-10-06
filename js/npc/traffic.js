import { corpById } from "../corp/corps.js";
import { generateNPC, cradle } from "./cradle.js";
import { file as gdbFile } from "../corp/gdb.js";
import { rngFromSeed } from "../world/generate.js";
import { currentSystem, hashHue } from "../world/bodies.js";
import { stations as liveStations } from "../station/stations.js";
import { shipById } from "../ships/shipdb.js";
import { stationLane, subLaneFor, laneAt, LANE_U } from "./lanes.js";
import { legCargo, pickCargoAt, deliver, lift, targetFor, stockOf } from "../economy/economy.js";
import { armFlight, flyStep, coastStep, legCruise, legTime, faceVelocity, placeAt, hullPerf, usesLane, laneProfile, RUN_OUT_U, RUN_IN_U } from "./flight.js";
import { perf, farBudget } from "../core/perf.js";
import { hasBay, bayPose, bayOffset, BAY_IN_S, BAY_OUT_S } from "./bay.js";
import { coverForVessel, downScaleFor } from "../economy/insurance.js";

export const SLOT_S = 180;
export const traffic = [];
export const trafficDown = {};
export const trafficHooks = { onTransition: null, battlePose: null, onCargo: null, director: null, claimOre: null };

const DOWN_FOR = 600;
export const DEPART_S = 36;
export const ARRIVE_S = 48;
export const DEPART_U = LANE_U;
export const ARRIVE_U = LANE_U * 1.4;
export const LANE_OVERHEAD = 46;
export const MIN_TRAVEL_S = 96;

export const ROLES = {
  trader:   { complex: "commerce",  ships: ["commerce_b", "commerce_c", "general_b"],   letter: "B" },
  hauler:   { complex: "logistics", ships: ["logistics_b", "logistics_c", "logistics_d"], letter: "C" },
  supply:   { complex: "logistics", ships: ["logistics_c", "logistics_d", "construction_c"], letter: "C" },
  miner:    { complex: "mining",    ships: ["mining_a", "mining_b", "mining_c"],         letter: "B" },
  patrol:   { complex: "security",  ships: ["security_a", "security_b", "security_c"],   letter: "B" },
  security: { complex: "security",  ships: ["security_b", "security_c", "security_d"],   letter: "C" },
  pirate:   { complex: "salvage",   ships: ["general_c", "security_b", "salvage_b"],     letter: "B" },
};
export const HOSTILE_ROLES = new Set(["pirate"]);
export const LAW_ROLES = new Set(["patrol", "security"]);
const PIRATE_HUES = ["#c8463f", "#b8342e", "#d4573a", "#a83a4a"];

function pick(rng, arr) {
  return arr[Math.max(0, Math.min(arr.length - 1, Math.floor(rng() * arr.length)))];
}

function callsign(rec, rng) {
  const last = rec.name.split(" ").pop().toUpperCase().replace(/[^A-Z]/g, "").slice(0, 6);
  return `${last}-${10 + Math.floor(rng() * 89)}`;
}

const _a = { x: 0, y: 0, z: 0 };
const _b = { x: 0, y: 0, z: 0 };

function nodePos(node, n, stationList, out) {
  if (node.kind === "belt") {
    out.x = Math.cos(node.angle) * node.rad;
    out.y = node.y;
    out.z = Math.sin(node.angle) * node.rad;
    return out;
  }
  const st = stationList.find((s) => s.id === node.id) ?? stationList.find((s) => s.id === n.from) ?? stationList[0];
  if (!st) return null;
  out.x = st.x ?? 0; out.y = st.y ?? 0; out.z = st.z ?? 0;
  return out;
}

function nodeName(node, stationList) {
  if (node.kind === "belt") return "the belt";
  return stationList.find((s) => s.id === node.id)?.name ?? "a lost port";
}

export function buildRoster(seed, stationList, system, count) {
  const rng = rngFromSeed(`${seed}:traffic`);
  const ports = (stationList ?? []).filter((s) => s && s.id && s.sector !== "pirate");
  const holds = (stationList ?? []).filter((s) => s && s.id && s.sector === "pirate");
  const rich = perf.tier >= 2;
  const nTraders = Math.max(14, Math.min(26, Math.floor((ports.length || 2) * 3.0)));
  const nMiners = rich ? 16 : 12;
  const nHaulers = rich ? 12 : 9;
  const nSupply = Math.max(8, Math.min(18, Math.floor((ports.length || 2) * 1.8)));
  const nPatrol = rich ? 10 : 7;
  const nSecurity = rich ? 14 : 10;
  const nPirates = rich ? 18 : 13;
  const want = count ?? (nTraders + nMiners + nHaulers + nSupply + nPatrol + nSecurity + nPirates);
  const plan = [];
  const push = (role, k) => { for (let i = 0; i < k; i++) plan.push(role); };
  push("trader", nTraders);
  push("miner", nMiners);
  push("hauler", nHaulers);
  push("supply", nSupply);
  push("patrol", nPatrol);
  push("security", nSecurity);
  push("pirate", nPirates);
  while (plan.length < want) plan.push(pick(rng, ["trader", "miner", "hauler", "supply"]));
  plan.length = want;

  const belt = system?.belt ?? system?.outerBelt ?? { inner: 40000, outer: 70000 };
  const roster = [];
  for (let i = 0; i < plan.length; i++) {
    const role = plan[i];
    const spec = ROLES[role];
    const rec = generateNPC(`${seed}:cap:${role}:${i}`, { sky: seed, complexId: spec.complex, letter: spec.letter });
    const prior = cradle.get(rec.id);
    if (prior) {
      rec.name = prior.name;
      rec.gdb = prior.gdb ?? null;
      rec.history = prior.history;
      rec.brain = prior.brain ?? rec.brain;
    } else {
      gdbFile(rec, { kind: "captain", group: roster.map((v) => ({ id: v.recId, name: v.captain })), put: false });
    }
    rec.status = "captain";
    rec.employer = rec.name;
    cradle.put(rec);
    if (!prior) cradle.note(rec.id, `Holds the ${role} run in ${seed}`);

    const ship = pick(rng, spec.ships);
    const hullName = shipById(ship)?.name ?? "Hull";
    const from = ports.length ? ports[Math.floor(rng() * ports.length)] : null;
    let to = ports.length > 1 ? ports[Math.floor(rng() * ports.length)] : from;
    if (to && from && to.id === from.id && ports.length > 1) to = ports[(ports.indexOf(from) + 1) % ports.length];

    const n = {
      id: `npc:${rec.id}`,
      recId: rec.id,
      name: `${hullName} ${callsign(rec, rng)}`,
      captain: rec.name,
      captainGender: rec.gender,
      captainPronouns: rec.pronouns,
      get cover() { return coverForVessel(this); },
      role,
      ship,
      hullName,
      color: role === "pirate" ? pick(rng, PIRATE_HUES) : hashHue(rec.id),
      from: from?.id ?? null,
      to: to?.id ?? null,
      period: 90 + rng() * 160,
      phase: rng() * 10000,
      orbitR: belt.inner + rng() * Math.max(800, (belt.outer - belt.inner) * 0.85),
      omega: (0.00018 + rng() * 0.00022) * (rng() < 0.5 ? 1 : -1),
      wobble: 0.01 + rng() * 0.02,
      amp: 400 + rng() * 1400,
      traits: rec.traits,
      title: rec.title,
      complexId: rec.complexId,
      legs: null,
      way: subLaneFor(`npc:${rec.id}`),
      visible: true,
      job: "hold",
      toName: "",
      corpId: from?.corpId ?? null,
    };
    if (role === "supply") {
      n.supplyFor = to?.id ?? from?.id ?? null;
      n.corpId = to?.corpId ?? n.corpId;
    }
    if (role === "patrol" || role === "security") {
      const flags = ports.map((p) => p.corpId).filter(Boolean);
      n.corpId = flags.length ? flags[Math.floor(rng() * flags.length)] : n.corpId;
    }
    if (role === "pirate") {
      const hold = holds.length ? holds[Math.floor(rng() * holds.length)] : null;
      n.from = hold?.id ?? null;
      n.corpId = hold?.corpId ?? n.corpId;
      n.to = null;
      n.lurk = { kind: "belt", angle: rng() * Math.PI * 2, rad: belt.inner + rng() * Math.max(1, belt.outer - belt.inner), y: (rng() - 0.5) * 1200 };
      n.lurkR = 300 + rng() * 500;
      n.lurkW = (0.05 + rng() * 0.06) * (rng() < 0.5 ? 1 : -1);
      if (hold) buildPirateLegs(n, rng, stationList ?? []);
    } else if (role !== "patrol" && from) buildLegs(n, rng, ports, belt, stationList ?? []);
    roster.push(n);
  }
  return roster;
}

export function spawnVessel(spec, stationList = liveStations, system = currentSystem) {
  const rng = rngFromSeed(`${spec.seed}:spawn:${spec.id}`);
  const ports = (stationList ?? []).filter((s) => s && s.id && s.sector !== "pirate");
  const belt = system?.belt ?? system?.outerBelt ?? { inner: 40000, outer: 70000 };
  const role = spec.role ?? "miner";
  const n = {
    id: spec.id,
    recId: spec.recId ?? null,
    name: spec.name,
    captain: spec.captain ?? spec.name,
    captainGender: spec.captainGender ?? null,
    captainPronouns: spec.captainPronouns ?? null,
    role,
    ship: spec.ship,
    hullName: shipById(spec.ship)?.name ?? "Hull",
    color: spec.color ?? "#9fe8b0",
    from: spec.from,
    to: spec.to ?? spec.from,
    period: 90 + rng() * 160,
    phase: rng() * 10000,
    orbitR: belt.inner + rng() * Math.max(800, (belt.outer - belt.inner) * 0.85),
    omega: (0.00018 + rng() * 0.00022) * (rng() < 0.5 ? 1 : -1),
    wobble: 0.01 + rng() * 0.02,
    amp: 400 + rng() * 1400,
    traits: spec.traits ?? {},
    title: spec.title ?? "Captain",
    complexId: spec.complexId ?? null,
    legs: null,
    way: subLaneFor(spec.id),
    visible: true,
    job: "hold",
    toName: "",
    corpId: spec.corpId ?? null,
    company: Boolean(spec.company),
  };
  buildLegs(n, rng, ports, belt, stationList ?? []);
  const t0 = spec.now ?? 0;
  n.phase = ((n.period - (t0 % n.period)) % n.period);
  const live = { ...n, x: 0, y: 0, z: 0, yaw: 0, pitch: 0, speed: 0, vx: 0, vy: 0, vz: 0, docked: null, lane: null };
  seatHull(live, t0, stationList, system);
  traffic.push(live);
  reindexTraffic();
  return live;
}
export function removeVessel(id) {
  const i = traffic.findIndex((n) => n.id === id);
  if (i >= 0) { traffic.splice(i, 1); reindexTraffic(); }
  return i >= 0;
}

function buildLegs(n, rng, ports, belt, stationList) {
  const legs = [];
  let prev = { kind: "port", id: n.from };
  legs.push({ kind: "dock", node: prev, dur: 90 + rng() * 200 });
  const stops = n.role === "hauler" || n.role === "security" ? 3 + Math.floor(rng() * 2) : 2 + Math.floor(rng() * 2);
  for (let j = 0; j < stops; j++) {
    let next;
    if (n.role === "miner" && rng() < 0.7) {
      next = { kind: "belt", angle: rng() * Math.PI * 2, rad: belt.inner + 2000 + rng() * Math.max(1, belt.outer - belt.inner - 4000), y: (rng() - 0.5) * 1800 };
    } else {
      let p = j === 0 && n.to ? ports.find((s) => s.id === n.to) ?? ports[0] : ports[Math.floor(rng() * ports.length)];
      if (p.id === prev.id && ports.length > 1) p = ports[(ports.indexOf(p) + 1) % ports.length];
      next = { kind: "port", id: p.id };
    }
    legs.push({ kind: "travel", from: prev, to: next, dur: 0 });
    legs.push({ kind: next.kind === "belt" ? "cut" : "dock", node: next, dur: next.kind === "belt" ? 240 + rng() * 300 : n.role === "security" ? 40 + rng() * 60 : 90 + rng() * 200 });
    prev = next;
  }
  legs.push({ kind: "travel", from: prev, to: { kind: "port", id: n.from }, dur: 0 });
  let period = 0;
  const hold = Math.max(6, (shipById(n.ship)?.stats?.cargo ?? 20)) * (n.role === "hauler" ? 2.6 : n.role === "supply" ? 1.2 : n.role === "trader" ? 1.8 : 0.6);
  const acc = hullPerf(n).accel;
  for (const leg of legs) {
    if (leg.kind === "travel") {
      const A = nodePos(leg.from, n, stationList, _a), B = nodePos(leg.to, n, stationList, _b);
      const d = A && B ? Math.hypot(B.x - A.x, B.y - A.y, B.z - A.z) : 60000;
      leg.warp = Math.min(45, Math.max(3, d / 55000));
      leg.dur = Math.max(MIN_TRAVEL_S, legTime(d, acc) + LANE_OVERHEAD);
      const pa = leg.from.kind === "port" ? stationList.find((x) => x.id === leg.from.id) : null;
      const pb = leg.to.kind === "port" ? stationList.find((x) => x.id === leg.to.id) : null;
      if (pa && pb && n.role !== "security") {
        const id = legCargo(pa, pb, rng);
        if (id) leg.cargo = { id, qty: Math.round(hold * (0.6 + rng() * 0.6)) };
      } else if (!pa && pb && n.role === "miner") {
        leg.cargo = { id: pick(rng, ["iron_ore", "nickel_ore", "copper_ore", "silicate", "chromite", "ilmenite"]), qty: Math.round(hold * 1.4) };
      }
    }
    leg.start = period;
    period += leg.dur;
  }
  n.legs = legs;
  n.period = period;
  const cut = legs.find((l) => l.kind === "cut");
  n.phase = n.role === "miner" && cut ? period - cut.start : rng() * period;
}

function buildPirateLegs(n, rng, stationList) {
  const home = { kind: "port", id: n.from };
  const legs = [
    { kind: "dock", node: home, dur: 60 + rng() * 90 },
    { kind: "travel", from: home, to: n.lurk, dur: 0 },
    { kind: "cut", node: n.lurk, dur: 260 + rng() * 260 },
    { kind: "travel", from: n.lurk, to: home, dur: 0 },
  ];
  let period = 0;
  const acc = hullPerf(n).accel;
  for (const leg of legs) {
    if (leg.kind === "travel") {
      const A = nodePos(leg.from, n, stationList, _a), B = nodePos(leg.to, n, stationList, _b);
      const d = A && B ? Math.hypot(B.x - A.x, B.y - A.y, B.z - A.z) : 60000;
      leg.warp = Math.min(45, Math.max(3, d / 55000));
      leg.dur = Math.max(MIN_TRAVEL_S, legTime(d, acc) + LANE_OVERHEAD);
    }
    leg.start = period;
    period += leg.dur;
  }
  n.legs = legs;
  n.period = period;
  n.phase = rng() * period;
}

export function resetTraffic() {
  traffic.length = 0;
  reindexTraffic();
}

export function populateTraffic(seed, stationList = liveStations, system = currentSystem) {
  resetTraffic();
  const roster = buildRoster(seed, stationList, system);
  for (const n of roster) {
    const live = { ...n, x: 0, y: 0, z: 0, yaw: 0, pitch: 0, speed: 0, vx: 0, vy: 0, vz: 0, docked: null, lane: null };
    seatHull(live, 0, stationList, system);
    traffic.push(live);
  }
  reindexTraffic();
  return traffic;
}

export function poseAt(n, t, stationList = liveStations, system = currentSystem) {
  const battle = trafficHooks.battlePose?.(n, t, stationList, system);
  if (battle) return battle;
  return routePose(n, t, stationList, system);
}

export function routePose(n, t, stationList = liveStations, system = currentSystem) {
  if (n.role === "pirate" && !n.legs) {
    const L = n.lurk;
    const cx = Math.cos(L.angle) * L.rad, cz = Math.sin(L.angle) * L.rad;
    const a = n.phase * 0.01 + t * n.lurkW;
    const x = cx + Math.cos(a) * n.lurkR, z = cz + Math.sin(a) * n.lurkR;
    const y = L.y + Math.sin(t * 0.03 + n.phase) * 60;
    const yaw = Math.atan2(-Math.cos(a) * Math.sign(n.lurkW), Math.sin(a) * Math.sign(n.lurkW));
    return { x, y, z, yaw, pitch: 0, speed: Math.abs(n.lurkW) * n.lurkR, docked: null, job: "lurking", visible: true, toName: "the belt" };
  }
  if (n.role === "patrol" || !n.legs) {
    const r = n.orbitR * 1.35;
    const ang = n.phase * 0.01 + t * n.omega * 0.55;
    const x = Math.cos(ang) * r;
    const z = Math.sin(ang) * r * 0.72;
    const y = Math.cos(t * n.wobble) * n.amp * 0.4;
    return { x, y, z, yaw: ang + Math.PI / 2, pitch: 0, speed: Math.abs(n.omega) * r, docked: null, job: "watch", visible: true, toName: "" };
  }
  const period = n.period;
  const phase = ((t + n.phase) % period + period) % period;
  const leg = n.legs.find((l) => phase >= l.start && phase < l.start + l.dur) ?? n.legs[0];
  const lt = phase - leg.start;
  if (leg.kind === "dock") {
    const P = nodePos(leg.node, n, stationList, _a) ?? { x: n.orbitR, y: 0, z: 0 };
    return { x: P.x, y: P.y, z: P.z, yaw: 0, pitch: 0, speed: 0, docked: leg.node.id, job: "docked", visible: false, toName: nodeName(leg.node, stationList) };
  }
  if (leg.kind === "cut" && n.role === "pirate") {
    const P = nodePos(leg.node, n, stationList, _a);
    const a = n.phase * 0.01 + t * n.lurkW;
    const x = P.x + Math.cos(a) * n.lurkR, z = P.z + Math.sin(a) * n.lurkR, y = P.y + Math.sin(t * 0.03 + n.phase) * 60;
    const yaw = Math.atan2(-Math.cos(a) * Math.sign(n.lurkW), Math.sin(a) * Math.sign(n.lurkW));
    return { x, y, z, yaw, pitch: 0, speed: Math.abs(n.lurkW) * n.lurkR, docked: null, job: "lurking", visible: true, toName: "the belt" };
  }
  if (leg.kind === "cut") {
    const P = nodePos(leg.node, n, stationList, _a);
    const a = lt * 0.02;
    const x = P.x + Math.cos(a) * 260, y = P.y + Math.sin(a * 0.7) * 40, z = P.z + Math.sin(a) * 260;
    return { x, y, z, yaw: Math.atan2(-(P.x - x), -(P.z - z)), pitch: 0, speed: 5.2, docked: null, job: "cutting", visible: true, toName: "the belt" };
  }
  const A = nodePos(leg.from, n, stationList, _a), B = nodePos(leg.to, n, stationList, _b);
  if (!A || !B) return { x: n.orbitR, y: 0, z: 0, yaw: 0, pitch: 0, speed: 0, docked: null, job: "hold", visible: false, toName: "" };
  const dx = B.x - A.x, dy = B.y - A.y, dz = B.z - A.z;
  const L = Math.hypot(dx, dy, dz) || 1;
  const nx = dx / L, ny = dy / L, nz = dz / L;
  const toName = nodeName(leg.to, stationList);
  const cargo = leg.cargo ?? null;
  const way = n.way ?? subLaneFor(n.id);
  let dep = Math.min(LANE_OVERHEAD, leg.dur * 0.34);
  let arr = Math.min(LANE_OVERHEAD, leg.dur * 0.40);
  if (dep + arr > leg.dur * 0.92) { const k = (leg.dur * 0.92) / (dep + arr); dep *= k; arr *= k; }
  const stA = leg.from.kind === "port" ? stationList.find((s) => s.id === leg.from.id) : null;
  const stB = leg.to.kind === "port" ? stationList.find((s) => s.id === leg.to.id) : null;

  if (lt < dep) {
    const u = lt / dep;
    const out = Math.min(DEPART_U, L * 0.4) * u * u;
    const speed = (2 * Math.min(DEPART_U, L * 0.4) * u) / dep;
    if (stA) {
      const f = stationLane(stA);
      const q = laneAt(stA, "exit", out, way, _a);
      return { x: q.x, y: q.y, z: q.z, yaw: Math.atan2(-f.dir.x, -f.dir.z), pitch: 0, speed, docked: null, job: "outbound", visible: true, toName, lane: "exit", cargo, fromId: leg.from.id ?? null, toId: leg.to.id ?? null };
    }
    const yaw = Math.atan2(-dx, -dz), pitch = Math.atan2(dy, Math.hypot(dx, dz)) * 0.5;
    return { x: A.x + nx * out, y: A.y + ny * out, z: A.z + nz * out, yaw, pitch, speed, docked: null, job: "outbound", visible: true, toName, cargo, fromId: leg.from.id ?? null, toId: leg.to.id ?? null };
  }

  if (lt < leg.dur - arr) {
    const u = (lt - dep) / Math.max(1, leg.dur - arr - dep);
    const yaw = Math.atan2(-dx, -dz), pitch = Math.atan2(dy, Math.hypot(dx, dz)) * 0.5;
    const speed = L / Math.max(1, leg.dur - arr - dep);
    return { x: A.x + dx * u, y: A.y + dy * u, z: A.z + dz * u, yaw, pitch, speed, docked: null, job: usesLane(L) ? "in lane" : "outbound", visible: true, toName, cargo, fromId: leg.from.id ?? null, toId: leg.to.id ?? null };
  }

  const u = Math.min(1, (lt - (leg.dur - arr)) / Math.max(1, arr));
  const reach = Math.min(ARRIVE_U, L * 0.4);
  const inn = reach * (1 - u) * (1 - u);
  const speed = (2 * reach * (1 - u)) / Math.max(1, arr);
  if (stB) {
    const f = stationLane(stB);
    const q = laneAt(stB, "entry", inn, way, _b);
    return { x: q.x, y: q.y, z: q.z, yaw: Math.atan2(f.dir.x, f.dir.z), pitch: 0, speed, docked: null, job: "approach", visible: true, toName, lane: "entry", cargo, toId: leg.to.id ?? null };
  }
  const yaw = Math.atan2(-dx, -dz), pitch = Math.atan2(dy, Math.hypot(dx, dz)) * 0.5;
  return { x: B.x - nx * inn, y: B.y - ny * inn, z: B.z - nz * inn, yaw, pitch, speed, docked: null, job: "approach", visible: true, toName, cargo, toId: leg.to.id ?? null };
}

const DOCK_R = 70;
const LANE_OUT = LANE_U * 1.15;
const CAPTURE_MULT = 6;
const LAUNCH_TOP = 190;
const APPROACH_TOP = 240;

const NEAR_R = 42000;

function stationById(list, id) {
  if (!id) return null;
  for (let i = 0; i < list.length; i++) if (list[i].id === id) return list[i];
  return null;
}

export function legAt(n, t) {
  const period = n.period || 1;
  const phase = ((t + n.phase) % period + period) % period;
  for (let k = 0; k < n.legs.length; k++) {
    const l = n.legs[k];
    if (phase >= l.start && phase < l.start + l.dur) return { i: k, lt: phase - l.start };
  }
  return { i: 0, lt: 0 };
}

function setJob(n, job, toName) {
  if (toName !== undefined) n.toName = toName;
  if (n.job === job) return;
  const from = n.job;
  n.job = job;
  trafficHooks.onTransition?.(n, from, job);
}

function nextLeg(n, t, stationList) {
  n.legIx = (n.legIx + 1) % n.legs.length;
  enterLeg(n, t, stationList);
}

function enterLeg(n, t, stationList) {
  const leg = n.legs[n.legIx];
  if (!leg) { n.state = "watch"; return; }
  if (leg.kind === "dock") {
    n.state = "dock";
    n.stateUntil = t + leg.dur;
    n.dockNode = leg.node;
  } else if (leg.kind === "cut") {
    n.state = "cut";
    n.stateUntil = t + leg.dur;
    n.cutNode = leg.node;
    n.cutAt = t;
  } else {
    const A = nodePos(leg.from, n, stationList, _a), B = nodePos(leg.to, n, stationList, _b);
    const L = A && B ? Math.hypot(B.x - A.x, B.y - A.y, B.z - A.z) : 60000;
    n.fly.top = legCruise(L, n.fly.accel);
    n.legLen = L;
    n.legFrom = A ? { x: A.x, y: A.y, z: A.z } : { x: n.x, y: n.y, z: n.z };
    n.lane3 = usesLane(L) ? laneProfile(L) : null;
    n.drive = 0;
    n.state = leg.from.kind === "port" ? "launch" : "cruise";
    n.stateUntil = t + legTime(L, n.fly.accel) * 3 + 120;
  }
}

export function seatHull(n, t, stationList = liveStations, system = currentSystem) {
  armFlight(n);
  const pose = routePose(n, t, stationList, system);
  placeAt(n, pose.x, pose.y, pose.z);
  n.yaw = pose.yaw; n.pitch = pose.pitch;
  n.visible = pose.visible;
  n.docked = pose.docked ?? null;
  n.toName = pose.toName ?? "";
  n.job = pose.job;
  n.cargo = pose.cargo ?? null;
  n.toId = pose.toId ?? null;
  n.respondTo = null;
  n.hunt = null;
  n.fleeFrom = null;
  if (!n.legs) { n.state = n.role === "pirate" ? "lurk" : "watch"; return n; }
  const { i, lt } = legAt(n, t);
  n.legIx = i;
  const leg = n.legs[i];
  if (leg.kind === "dock") { n.state = "dock"; n.stateUntil = t + Math.max(2, leg.dur - lt); n.dockNode = leg.node; }
  else if (leg.kind === "cut") { n.state = "cut"; n.stateUntil = t + Math.max(2, leg.dur - lt); n.cutNode = leg.node; n.cutAt = t - lt; }
  else {
    const A = nodePos(leg.from, n, stationList, _a), B = nodePos(leg.to, n, stationList, _b);
    const L = A && B ? Math.hypot(B.x - A.x, B.y - A.y, B.z - A.z) : 60000;
    n.fly.top = legCruise(L, n.fly.accel);
    n.legLen = L;
    n.legFrom = A ? { x: A.x, y: A.y, z: A.z } : { x: n.x, y: n.y, z: n.z };
    n.lane3 = usesLane(L) ? laneProfile(L) : null;
    n.drive = 0;
    n.state = "cruise";
    n.stateUntil = t + legTime(L, n.fly.accel) * 3 + 120;
    if (A && B && L > 1) {
      const u = Math.max(0.08, Math.min(0.92, lt / Math.max(1, leg.dur)));
      const v = Math.min(n.fly.top, Math.sqrt(2 * n.fly.accel * L * Math.min(u, 1 - u)));
      placeAt(n, A.x + (B.x - A.x) * u, A.y + (B.y - A.y) * u, A.z + (B.z - A.z) * u,
        ((B.x - A.x) / L) * v, ((B.y - A.y) / L) * v, ((B.z - A.z) / L) * v);
      n.visible = true;
      n.job = "outbound";
    }
  }
  return n;
}

function liftCargo(n, stationList) {
  const leg = n.legs?.[n.legIx];
  const fromId = leg?.from?.id ?? n.dockNode?.id ?? null;
  if (!leg?.cargo || !fromId) { n.cargo = leg?.cargo ?? null; return; }
  n.cargo = leg.cargo;
  n.toId = leg.to?.id ?? null;
  const st = stationById(stationList, fromId);
  const dest = n.toId ? stationById(stationList, n.toId) : null;
  const id = (st && dest && pickCargoAt(st, dest)) ?? leg.cargo.id;
  if (st?.stock) {
    let qty = leg.cargo.qty;
    if (dest) {
      const room = targetFor(dest, id) - stockOf(dest, id);
      qty = Math.max(6, Math.min(qty, Math.round(room * 0.7)));
    }
    const got = lift(st, id, qty);
    n.carrying = got > 0 ? { id, qty: got } : null;
    trafficHooks.onCargo?.(n, st, "lift", id, got);
  }
}

function deliverCargo(n, stationList, portId) {
  const st = stationById(stationList, portId);
  const had = n.cargo;
  if (st?.stock && had) {
    const id = n.carrying?.id ?? had.id;
    const q = n.carrying ? n.carrying.qty : (n.role === "miner" ? had.qty : 0);
    if (q > 0) { deliver(st, id, q); trafficHooks.onCargo?.(n, st, "deliver", id, q); }
  }
  n.carrying = null;
  n.cargo = null;
}

const SUB_S = 0.5;
const SUB_MAX = 120;

function stepHull(n, t, dt, ctx) {
  if (dt > SUB_S) {
    const steps = Math.ceil(dt / SUB_S);
    if (steps > SUB_MAX) { seatHull(n, t, ctx.stations, ctx.system); return; }
    const h = dt / steps;
    for (let k = 0; k < steps; k++) stepHullOnce(n, t - dt + h * (k + 1), h, ctx);
    return;
  }
  stepHullOnce(n, t, dt, ctx);
}

const _bay = {};
function poseBay(n, st, which) {
  bayPose(st, which, n.bayS ?? 0, n.way ?? subLaneFor(n.id), _bay, n.bayOff);
  placeAt(n, _bay.x, _bay.y, _bay.z, _bay.vx, _bay.vy, _bay.vz);
  n.speed = _bay.speed;
  n.yaw = _bay.yaw; n.pitch = _bay.pitch;
}

function stepHullOnce(n, t, dt, ctx) {
  const SL = ctx.stations, system = ctx.system;

  const inBay = n.state === "berth" || n.state === "unberth";
  if (!inBay && trafficHooks.director?.(n, t, dt, ctx)) {
    n.visible = true;
    n.docked = null;
    return;
  }
  const posed = inBay || n.state === "launch" ? null : trafficHooks.battlePose?.(n, t, SL, system);
  if (posed) {
    if (dt > 0 && n.visible && posed.visible) { n.vx = (posed.x - n.x) / dt; n.vy = (posed.y - n.y) / dt; n.vz = (posed.z - n.z) / dt; }
    else { n.vx = 0; n.vy = 0; n.vz = 0; }
    n.x = posed.x; n.y = posed.y; n.z = posed.z;
    n.yaw = posed.yaw; n.pitch = posed.pitch; n.speed = posed.speed;
    n.docked = posed.docked; n.visible = posed.visible; n.lane = posed.lane ?? null;
    setJob(n, posed.job, posed.toName);
    return;
  }

  switch (n.state) {
    case "dock": {
      const st = stationById(SL, n.dockNode?.id);
      if (st) {
        placeAt(n, st.x, st.y, st.z, st.vx ?? 0, st.vy ?? 0, st.vz ?? 0);
      }
      n.visible = false;
      n.docked = n.dockNode?.id ?? null;
      n.speed = 0;
      n.drive = 0;
      setJob(n, "docked", st?.name ?? n.toName);
      if (t >= n.stateUntil) {
        n.docked = null;
        nextLeg(n, t, SL);
        if (n.state === "launch" || n.state === "cruise") {
          liftCargo(n, SL);
          n.visible = true;
          setJob(n, "outbound", nodeName(n.legs[n.legIx]?.to ?? {}, SL));
          if (n.state === "launch" && st && hasBay(st)) {
            n.state = "unberth";
            n.bayS = 0;
            n.bayAt = st.id;
            n.bayOff = null;
            poseBay(n, st, "out");
          }
        }
      }
      return;
    }

    case "unberth":
    case "berth": {
      const st = stationById(SL, n.bayAt);
      const out = n.state === "unberth";
      if (!st || !hasBay(st)) { n.bayS = 1; }
      else {
        n.bayS = Math.min(1, (n.bayS ?? 0) + dt / (out ? BAY_OUT_S : BAY_IN_S));
        poseBay(n, st, out ? "out" : "in");
      }
      n.visible = true;
      n.lane = "bay";
      if (n.bayS >= 1) {
        n.lane = null;
        n.bayAt = null;
        n.bayOff = null;
        if (out) { n.state = "launch"; }
        else nextLeg(n, t, SL);
      }
      return;
    }

    case "launch": {
      const leg = n.legs[n.legIx];
      const st = stationById(SL, leg?.from?.id);
      if (!st) { n.state = "cruise"; return; }
      const q = laneAt(st, "exit", LANE_OUT, n.way ?? subLaneFor(n.id), _a);
      n.visible = true;
      n.lane = "exit";
      setJob(n, "outbound", nodeName(leg.to, SL));
      const rem = flyStep(n, dt, q.x, q.y, q.z, { top: LAUNCH_TOP, match: { vx: st.vx ?? 0, vy: st.vy ?? 0, vz: st.vz ?? 0 } });
      if (rem < Math.max(120, n.speed * dt * 1.6)) {
        n.state = "cruise";
        n.lane = null;
      }
      return;
    }

    case "cruise": {
      const leg = n.legs[n.legIx];
      if (!leg) { n.state = "watch"; return; }
      const B = nodePos(leg.to, n, SL, _b);
      if (!B) { n.state = "watch"; return; }
      n.visible = true;
      n.lane = null;
      setJob(n, "outbound", nodeName(leg.to, SL));
      const st = leg.to.kind === "port" ? stationById(SL, leg.to.id) : null;

      const gate = st ? laneAt(st, "entry", LANE_U, n.way ?? subLaneFor(n.id), _a) : null;
      const gx = gate ? gate.x : B.x, gy = gate ? gate.y : B.y, gz = gate ? gate.z : B.z;
      const capture = ARRIVE_U * CAPTURE_MULT;
      let gateDistance;
      if (st) {
        const dx = n.x - st.x, dy = n.y - st.y, dz = n.z - st.z;
        gateDistance = Math.hypot(n.x - gx, n.y - gy, n.z - gz);
        if (dx * dx + dy * dy + dz * dz < capture * capture || gateDistance < capture * 0.7) { n.drive = 0; n.state = "approach"; return; }
      }

      const match = st ? { vx: st.vx ?? 0, vy: st.vy ?? 0, vz: st.vz ?? 0 } : null;
      const L3 = n.lane3;
      if (L3 && L3.top > 0) {
        const F = n.legFrom ?? { x: n.x, y: n.y, z: n.z };
        const dOut = Math.hypot(n.x - F.x, n.y - F.y, n.z - F.z);
        const dIn = gateDistance ?? Math.hypot(n.x - gx, n.y - gy, n.z - gz);
        if (dOut > RUN_OUT_U && dIn > RUN_IN_U) {
          n.drive = 1;
          n.lane = "drive";
          setJob(n, "in lane", nodeName(leg.to, SL));
          const k = Math.max(0, (dIn - RUN_IN_U)) / Math.max(1, dIn);
          const px = n.x + (gx - n.x) * k, py = n.y + (gy - n.y) * k, pz = n.z + (gz - n.z) * k;
          flyStep(n, dt, px, py, pz, { top: L3.top, accel: L3.accel, match });
          if (t > n.stateUntil) nextLeg(n, t, SL);
          return;
        }
        n.drive = 0;
      }

      if (st) {
        flyStep(n, dt, gx, gy, gz, { standoff: capture * 0.4, match });
      } else {
        const rem = flyStep(n, dt, B.x, B.y, B.z, { standoff: 240 });
        if (rem < Math.max(300, n.speed * dt * 1.6)) { nextLeg(n, t, SL); return; }
      }
      if (t > n.stateUntil) nextLeg(n, t, SL);
      return;
    }

    case "approach": {
      const leg = n.legs[n.legIx];
      const st = stationById(SL, leg?.to?.id);
      if (!st) { n.state = "cruise"; return; }
      n.visible = true;
      n.lane = "entry";
      setJob(n, "approach", st.name ?? "");
      const way = n.way ?? subLaneFor(n.id);
      const f = stationLane(st);
      const mouth = laneAt(st, "entry", 0, way, _a);
      const d = Math.hypot(n.x - mouth.x, n.y - mouth.y, n.z - mouth.z);
      const along = (n.x - mouth.x) * f.dir.x + (n.y - mouth.y) * f.dir.y + (n.z - mouth.z) * f.dir.z;
      const goalAlong = Math.max(0, Math.min(LANE_U * 1.2, along - 220));
      const q = laneAt(st, "entry", goalAlong, way, _b);
      const pre = { x: n.x, y: n.y, z: n.z };
      const top = hasBay(st) ? Math.max(24, Math.min(APPROACH_TOP, d * 0.45)) : APPROACH_TOP;
      flyStep(n, dt, q.x, q.y, q.z, { top, match: { vx: st.vx ?? 0, vy: st.vy ?? 0, vz: st.vz ?? 0 } });
      if (hasBay(st) && d < 600) {
        const rvx = n.vx - (st.vx ?? 0), rvy = n.vy - (st.vy ?? 0), rvz = n.vz - (st.vz ?? 0);
        const rv = Math.hypot(rvx, rvy, rvz), cap = Math.max(24, d * 0.45);
        if (rv > cap) {
          const k = cap / rv;
          const nx = (st.vx ?? 0) + rvx * k, ny = (st.vy ?? 0) + rvy * k, nz = (st.vz ?? 0) + rvz * k;
          n.x += (nx - n.vx) * dt; n.y += (ny - n.vy) * dt; n.z += (nz - n.vz) * dt;
          n.vx = nx; n.vy = ny; n.vz = nz;
          n.speed = Math.hypot(nx, ny, nz);
        }
      }
      const relSp = hasBay(st) ? Math.hypot(n.vx - (st.vx ?? 0), n.vy - (st.vy ?? 0), n.vz - (st.vz ?? 0)) : n.speed;
      if (d < Math.max(DOCK_R, relSp * dt * 1.6)) {
        deliverCargo(n, SL, leg.to.id);
        n.lane = null;
        if (hasBay(st)) {
          n.state = "berth";
          n.bayS = 0;
          n.bayAt = st.id;
          n.bayOff = bayOffset(st, "in", n.way ?? subLaneFor(n.id), pre);
          poseBay(n, st, "in");
        } else nextLeg(n, t, SL);
      }
      return;
    }

    case "cut": {
      const P = nodePos(n.cutNode ?? { kind: "belt", angle: 0, rad: n.orbitR, y: 0 }, n, SL, _a);
      n.visible = true;
      if (n.role === "pirate") {
        setJob(n, "lurking", "the belt");
        const a = n.phase * 0.01 + t * n.lurkW;
        flyStep(n, dt, P.x + Math.cos(a) * n.lurkR, P.y + Math.sin(t * 0.03 + n.phase) * 60, P.z + Math.sin(a) * n.lurkR, { top: 260 });
      } else {
        setJob(n, "cutting", "the belt");
        const a = (t - (n.cutAt ?? t)) * 0.02;
        flyStep(n, dt, P.x + Math.cos(a) * 260, P.y + Math.sin(a * 0.7) * 40, P.z + Math.sin(a) * 260, { top: 70 });
      }
      if (t >= n.stateUntil) {
        if (n.role === "miner") {
          const next = n.legs[(n.legIx + 1) % n.legs.length];
          const ore = trafficHooks.claimOre?.(P, t);
          if (next?.cargo && ore) n.carrying = { id: ore, qty: next.cargo.qty };
        }
        nextLeg(n, t, SL);
      }
      return;
    }

    case "lurk": {
      const L = n.lurk ?? { angle: 0, rad: n.orbitR, y: 0 };
      const cx = Math.cos(L.angle) * L.rad, cz = Math.sin(L.angle) * L.rad;
      const a = n.phase * 0.01 + t * n.lurkW;
      n.visible = true;
      setJob(n, "lurking", "the belt");
      flyStep(n, dt, cx + Math.cos(a) * n.lurkR, L.y + Math.sin(t * 0.03 + n.phase) * 60, cz + Math.sin(a) * n.lurkR, { top: 260 });
      return;
    }

    case "hold": {
      n.visible = true;
      setJob(n, "hold", n.toName ?? "");
      n.vx *= Math.max(0, 1 - dt * 1.2);
      n.vy *= Math.max(0, 1 - dt * 1.2);
      n.vz *= Math.max(0, 1 - dt * 1.2);
      coastStep(n, dt);
      return;
    }

    default: {
      const r = n.orbitR * 1.35;
      const ang = n.phase * 0.01 + t * n.omega * 0.55;
      n.visible = true;
      setJob(n, "watch", n.toName ?? "");
      flyStep(n, dt, Math.cos(ang) * r, Math.cos(t * n.wobble) * n.amp * 0.4, Math.sin(ang) * r * 0.72, { top: 620 });
      return;
    }
  }
}

const _ctx = { stations: null, system: null, t: 0, dt: 0, shipPos: null };

export function stepTraffic(t, dt, stationList = liveStations, system = currentSystem, shipPos = null) {
  _ctx.stations = stationList;
  _ctx.system = system;
  _ctx.t = t;
  _ctx.dt = dt;
  _ctx.shipPos = shipPos;

  const { stride } = farBudget(traffic.length);
  const px = shipPos?.x ?? 0, py = shipPos?.y ?? 0, pz = shipPos?.z ?? 0;
  const near2 = NEAR_R * NEAR_R;

  for (let i = 0; i < traffic.length; i++) {
    const n = traffic[i];
    if (!n.fly) armFlight(n);

    const down = trafficDown[n.id];
    if (down && down > t) {
      if (n.job !== "down") { const from = n.job; n.job = "down"; trafficHooks.onTransition?.(n, from, "down"); }
      n.visible = false;
      n.speed = 0;
      n.vx = 0; n.vy = 0; n.vz = 0;
      continue;
    }
    if (n.job === "down") {
      delete trafficDown[n.id];
      n.heldUntil = 0;
      n.hp = n.hpMax ?? n.hp;
      n.shield = n.shieldMax ?? n.shield;
      n.underAttack = 0;
      seatHull(n, t, stationList, system);
      continue;
    }

    if (n.heldUntil) {
      if (n.heldUntil > t) { coastStep(n, dt); continue; }
      n.heldUntil = 0;
    }

    let step = dt;
    if (shipPos && stride > 1) {
      const dx = n.x - px, dy = n.y - py, dz = n.z - pz;
      if (dx * dx + dy * dy + dz * dz > near2) {
        n.lag = (n.lag ?? 0) + dt;
        if ((i + perf.frames) % stride !== 0) { coastStep(n, dt); continue; }
        step = n.lag;
        n.lag = 0;
      } else n.lag = 0;
    }
    stepHull(n, t, step, _ctx);
  }
  return traffic;
}

export function markVesselDown(id, t) {
  const n0 = vesselById(id);
  trafficDown[id] = t + DOWN_FOR * (n0 ? downScaleFor(n0) : 1);
  const n = vesselById(id);
  if (n) {
    n.visible = false;
    n.job = "down";
    n.hp = 0;
    n.speed = 0;
    n.vx = 0; n.vy = 0; n.vz = 0;
    n.respondTo = null;
    n.hunt = null;
    n.fleeFrom = null;
    n.engagedWith = null;
  }
  return trafficDown[id];
}

const hullIx = new Map();
let hullIxDirty = true;

export function reindexTraffic() {
  hullIxDirty = true;
}

let hullIxLen = -1;

export function vesselById(id) {
  if (hullIxDirty || traffic.length !== hullIxLen) {
    hullIx.clear();
    for (const n of traffic) hullIx.set(n.id, n);
    hullIxDirty = false;
    hullIxLen = traffic.length;
  }
  return hullIx.get(id) ?? null;
}

export function captainLine(n) {
  const p = n?.captainPronouns;
  return `${n?.captain ?? n?.name ?? "unknown"}${p ? ` · ${p.subj}/${p.obj}` : ""}`;
}

export function vesselStatus(n) {
  const tag = n.crewTag ? ` · ${n.crewTag}` : "";
  const who = `${captainLine(n)} commanding${n.corpId && corpById(n.corpId) ? ` · ${corpById(n.corpId).name}` : ""}${tag}`;
  switch (n.job) {
    case "docked": return `docked at ${n.toName} — ${who}`;
    case "outbound": return n.role === "supply" ? `running supplies to ${n.toName} — ${who}` : `outbound for ${n.toName} — ${who}`;
    case "in lane": return `under drive for ${n.toName} — ${who}`;
    case "approach": return `on approach to ${n.toName} — ${who}`;
    case "cutting": return `cutting in the belt — ${who}`;
    case "watch": return `on picket sweep — ${who}`;
    case "lurking": return `lurking on the belt approaches — ${who}`;
    case "engaged": return `in a firefight${n.toName ? ` with ${n.toName}` : ""} — ${who}`;
    case "fleeing": return `running from ${n.toName} — ${who}`;
    case "responding": return `responding to ${n.toName} — ${who}`;
    case "down": return `off the board — ${who}`;
    default: return `holding — ${who}`;
  }
}

export function visibleVessels(pos) {
  return traffic
    .filter((n) => n.visible !== false)
    .map((n) => ({ n, d: Math.hypot(n.x - pos.x, n.y - pos.y, n.z - pos.z) }))
    .sort((a, b) => a.d - b.d);
}

export const EVENT_KINDS = ["quiet", "drought", "ice_rush", "pirate_watch", "convoy"];

export function eventAt(seed, t) {
  const slot = Math.floor(Math.max(0, t) / SLOT_S);
  const rng = rngFromSeed(`${seed}:skyevt:${slot}`);
  const roll = rng();
  let kind = "quiet";
  if (roll < 0.09) kind = "drought";
  else if (roll < 0.15) kind = "ice_rush";
  else if (roll < 0.21) kind = "pirate_watch";
  else if (roll < 0.26) kind = "convoy";
  const until = (slot + 1) * SLOT_S + rng() * SLOT_S * 0.4;
  const base = { kind, slot, until, seed };
  if (kind === "drought") {
    return { ...base, mult: Math.round((2.1 + rng() * 1.4) * 10) / 10, sectors: ["agricultural", "civilian"] };
  }
  if (kind === "ice_rush") {
    return { ...base, mult: Math.round((1.6 + rng() * 0.8) * 10) / 10, good: "water_ice" };
  }
  if (kind === "pirate_watch") {
    return { ...base, heat: 0.35 + rng() * 0.4 };
  }
  if (kind === "convoy") {
    return { ...base, legs: 2 + Math.floor(rng() * 3) };
  }
  return base;
}

export function eventLine(ev, ports = []) {
  if (!ev || ev.kind === "quiet") return null;
  if (ev.kind === "drought") {
    const named = ports.filter((s) => ev.sectors.includes(s.sector)).map((s) => s.name).slice(0, 3);
    if (!named.length) return null;
    return `DROUGHT DECLARATION — ${named.join(", ")} paying ${ev.mult}× for water`;
  }
  if (ev.kind === "ice_rush") return `ICE RUSH — outer belt ice paying ${ev.mult}× at the bench`;
  if (ev.kind === "pirate_watch") return "PIRATE WATCH — pickets report heat on the belt approaches";
  if (ev.kind === "convoy") return `CONVOY WINDOW — ${ev.legs} logistics legs running the inner ports`;
  return null;
}

export function trafficCensus(list = traffic) {
  const out = { total: list.length, trader: 0, miner: 0, hauler: 0, supply: 0, patrol: 0, security: 0, pirate: 0, flying: 0, docked: 0, crossing: 0, responding: 0, fighting: 0, fleeing: 0, down: 0 };
  for (const n of list) {
    if (out[n.role] != null) out[n.role]++;
    if (n.job === "down") { out.down++; continue; }
    if (n.visible !== false) out.flying++;
    if (n.job === "docked") out.docked++;
    else if (n.job === "outbound" || n.job === "approach") out.crossing++;
    if (n.respondTo) out.responding++;
    if (n.job === "engaged") out.fighting++;
    if (n.job === "fleeing") out.fleeing++;
  }
  return out;
}
