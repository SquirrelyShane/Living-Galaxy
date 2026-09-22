/* LIVING GALAXY experimental — other pilots in the sky.
 *
 * The CRADLE does not only staff hiring halls. Every sky also carries a
 * roster of working hulls: traders running the ports, miners cutting the
 * belts, haulers on long legs, pickets on a slow watch. They are real
 * people (generateNPC) filed in the ledger as captains, flying real registry
 * hulls, on clocks derived from the sky seed and the shared world time.
 *
 * The ROSTER is still a pure function of the seed — the same sky always
 * grows the same captains in the same hulls flying for the same flags, so a
 * room agrees about who exists without anyone being in charge.
 *
 * WHERE THEY ARE is no longer. It used to be: `poseAt(n, t)` was closed-form
 * in (seed, skyTime), a hull burned 500 units out of the hangar, went
 * `visible:false` for the length of a warp lane, and reappeared 700 units
 * off the far port. Nothing was ever in between, which is why a supply run
 * popped up outside a station and vanished before you could turn toward it,
 * and why there was no such thing as intercepting one.
 *
 * Now a leg is flown. The timetable still says WHICH port is next and what
 * it is carrying; npc/flight.js flies the hull there under real thrust, and
 * it is on the board and shootable for the whole crossing. A hull carries
 * velocity, hull integrity and shields, it notices being shot at, and it can
 * be pulled off its route entirely — to run, to fight, or to answer somebody
 * else's distress call (npc/security.js).
 *
 * The cost is the old determinism, and it is paid deliberately: you cannot
 * intercept a position that is a closed-form function of the clock, because
 * nothing you do can change where it will be. So the sky is now
 * host-authoritative — the host integrates, mirrors take its word
 * (worldsync.js). `poseAt`/`routePose` survive as the PLACEMENT function:
 * they still say where a hull belongs on its timetable, which is what seeds
 * a fresh sky and what a mirror falls back to between host packets.
 *
 * Shot down? `trafficDown` keeps the id for ten minutes of sky time; that
 * map rides in the host's snapshot so the whole room sees the same gap.
 */

import { corpById } from "../corps.js";
import { generateNPC, cradle } from "./cradle.js";
import { rngFromSeed } from "../generate.js";
import { currentSystem, hashHue } from "../bodies.js";
import { stations as liveStations } from "../stations.js";
import { shipById } from "../shipdb.js";
import { stationLane, subLaneFor, laneAt, LANE_U } from "./lanes.js";
import { legCargo, pickCargoAt, deliver, lift, targetFor, stockOf } from "../economy.js";
import { armFlight, flyStep, coastStep, legCruise, legTime, faceVelocity, placeAt, hullPerf, usesLane, laneProfile, RUN_OUT_U, RUN_IN_U } from "./flight.js";
import { perf, farBudget } from "../perf.js";
import { hasBay, bayPose, bayOffset, BAY_IN_S, BAY_OUT_S } from "./bay.js";
import { coverForVessel, downScaleFor } from "../insurance.js";

export const SLOT_S = 180;          // shared-event cadence, seconds of world time
export const traffic = [];          // live NPC hulls
export const trafficDown = {};      // id → sky time it is back on its route
/* comms chatter, cargo logging, and the two override points that let other
 * modules take a hull off its timetable without this one importing them:
 *   director(n, t, dt, ctx)  flew the hull itself this tick — return true and
 *                            the timetable leaves it alone. npc/security.js
 *                            and npc/combat.js chain onto this.
 *   battlePose(n, t, ...)    the legacy pose override, kept for anything that
 *                            still wants to place a hull outright. */
export const trafficHooks = { onTransition: null, battlePose: null, onCargo: null, director: null, claimOre: null };

const DOWN_FOR = 600;
export const DEPART_S = 36;         // burn out along the exit lane before the warp
export const ARRIVE_S = 48;         // brake in along the entry lane to the clamps
export const DEPART_U = LANE_U;     // the exit lane's far gate is where the warp opens
export const ARRIVE_U = LANE_U * 1.4; // hulls drop out of the lane a little beyond the entry gate
/* the two ends of a crossing that are not cruise: out through the mouth and
 * down the exit lane under low power, and the braked run down the entry lane
 * at the far end. Costed into the timetable so `period` stays honest. */
export const LANE_OVERHEAD = 46;
/* and a travel leg is never shorter than one: clearing a ring, crossing, and
 * coming back down onto clamps is not something a hull does in a few seconds,
 * however close the two ports happen to be right now */
export const MIN_TRAVEL_S = 96;

/* Who works the sky. Pirates fly out of the free ports (or lurk on the belt
 * if the sky has none); security runs sweeps between the ports and answers
 * engagements — see npc/battles.js. */
export const ROLES = {
  trader:   { complex: "commerce",  ships: ["commerce_b", "commerce_c", "general_b"],   letter: "B" },
  hauler:   { complex: "logistics", ships: ["logistics_b", "logistics_c", "logistics_d"], letter: "C" },
  /* Station supply: the runs the ports actually eat. A supply hull is slow,
   * fat, lightly armed and always bound somewhere that needs what it has —
   * which makes it the thing worth escorting and the thing worth taking. */
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

/** Deterministic roster for this sky. Always the same captains for a seed. */
export function buildRoster(seed, stationList, system, count) {
  const rng = rngFromSeed(`${seed}:traffic`);
  const ports = (stationList ?? []).filter((s) => s && s.id && s.sector !== "pirate");
  const holds = (stationList ?? []).filter((s) => s && s.id && s.sector === "pirate");
  /* A busier sky than the 47–56 hulls this used to carry. The ceiling is not
   * a guess about the device: perf.js measures the frame and the far field
   * thins itself out, so the roster is written for the sky the game wants and
   * the budget decides how much of it gets stepped in detail this frame. */
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
    rec.status = "captain";
    rec.employer = rec.name;
    const prior = cradle.get(rec.id);
    if (prior) {
      rec.history = prior.history;
      rec.brain = prior.brain ?? rec.brain;
    }
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
      /* who is flying it, not just what it is called. The open channel names
       * people now, and the SHIPS directory says whose hull it is — both need
       * this off the vessel without a CRADLE lookup per frame. */
      captainGender: rec.gender,
      captainPronouns: rec.pronouns,
      /* what this operator carries, if anything — a fact about them, seeded
       * off the id, so it is the same for every client in the room */
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
      /* the flag: the home port's corporation (corps.js), a hold's for a pirate, a
       * major's for the law. Filled below; corpOfVessel() falls back to the port. */
      corpId: from?.corpId ?? null,
    };
    if (role === "supply") {
      /* a supply run is named for its destination, not its origin — the port
       * waiting on it is the one whose stock moves when it does or does not
       * arrive, and it is the name the open channel uses */
      n.supplyFor = to?.id ?? from?.id ?? null;
      n.corpId = to?.corpId ?? n.corpId;
    }
    if (role === "patrol" || role === "security") {
      const flags = ports.map((p) => p.corpId).filter(Boolean);
      n.corpId = flags.length ? flags[Math.floor(rng() * flags.length)] : n.corpId;
    }
    if (role === "pirate") {
      /* a hold to lurk out of, and a stretch of belt to watch the lanes from */
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

/**
 * A hull added to the board after the roster was built — the company's own.
 * Same shape, same legs machinery: a miner cuts the belt and brings ore home,
 * a hauler runs stock between ports. Returns the live entry.
 */
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
  /* start on the pad at home so the first thing it does is leave */
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

/* The timetable: dock at home, then stops (ports, or belt claims for miners), then home. */
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
  /* the hull's own thrust decides how long a crossing takes, so the timetable
   * is costed against the hull that flies it. `n.period` therefore still means
   * what it says: one full circuit of this captain's route. */
  const acc = hullPerf(n).accel;
  for (const leg of legs) {
    if (leg.kind === "travel") {
      const A = nodePos(leg.from, n, stationList, _a), B = nodePos(leg.to, n, stationList, _b);
      const d = A && B ? Math.hypot(B.x - A.x, B.y - A.y, B.z - A.z) : 60000;
      leg.warp = Math.min(45, Math.max(3, d / 55000)); // kept: the chart and the comms desk read it
      leg.dur = Math.max(MIN_TRAVEL_S, legTime(d, acc) + LANE_OVERHEAD);
      /* a port-to-port leg carries something the far end eats (economy.js); a miner's belt run is empty going out */
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
  /* miners open on the claim; everyone else somewhere on the loop */
  const cut = legs.find((l) => l.kind === "cut");
  n.phase = n.role === "miner" && cut ? period - cut.start : rng() * period;
}

/* A pirate's day: berth in the hold, burn out its exit lane, warp to the
 * belt, lurk, warp home, brake in on the entry lane. Same legs machinery as
 * the honest traffic, so the hold sees streams too. */
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
    /* give it thrust, hull, shields and guns, then put it where its timetable
     * says it is — spread along the crossings, not all sitting on clamps */
    seatHull(live, 0, stationList, system);
    traffic.push(live);
  }
  reindexTraffic();
  return traffic;
}

/**
 * Where this hull is at world time `t`. Pure: same inputs, same pose.
 * Returns { x, y, z, yaw, pitch, speed, docked, job, visible, toName }.
 */
export function poseAt(n, t, stationList = liveStations, system = currentSystem) {
  /* an engagement (npc/battles.js) takes the hull off its timetable */
  const battle = trafficHooks.battlePose?.(n, t, stationList, system);
  if (battle) return battle;
  return routePose(n, t, stationList, system);
}

/** The timetable pose alone — what the hull would be doing if nobody were shooting. */
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
  /* travel: down the exit lane, across, up the entry lane.
   *
   * These are the same three parts the hull actually flies (npc/flight.js) —
   * the run out of the port, the crossing, the run in — costed as fractions
   * of the leg rather than integrated. The two ends are bounded by
   * LANE_OVERHEAD, which is exactly what the timetable charged for them, and
   * squeezed proportionally on a leg too short to spend that long in a lane.
   * A hull is never `visible:false` mid-crossing any more: the only thing
   * that takes it off the board is being inside a station ring. */
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
    /* the crossing: somewhere between the two lane gates, on the board */
    const u = (lt - dep) / Math.max(1, leg.dur - arr - dep);
    const yaw = Math.atan2(-dx, -dz), pitch = Math.atan2(dy, Math.hypot(dx, dz)) * 0.5;
    const speed = L / Math.max(1, leg.dur - arr - dep);
    /* "in lane" used to mean GONE — visible:false, off the contact board, not
     * shootable. It now means the drive is lit: fast, but on the board and
     * tracked the whole way, which is the difference between a supply run you
     * can plan an interception against and one that simply is not there. */
    return { x: A.x + dx * u, y: A.y + dy * u, z: A.z + dz * u, yaw, pitch, speed, docked: null, job: usesLane(L) ? "in lane" : "outbound", visible: true, toName, cargo, fromId: leg.from.id ?? null, toId: leg.to.id ?? null };
  }

  const u = Math.min(1, (lt - (leg.dur - arr)) / Math.max(1, arr));
  const reach = Math.min(ARRIVE_U, L * 0.4);
  const inn = reach * (1 - u) * (1 - u);
  const speed = (2 * reach * (1 - u)) / Math.max(1, arr);
  if (stB) {
    /* in along the port's entry lane, the funnel gathering it to the mouth */
    const f = stationLane(stB);
    const q = laneAt(stB, "entry", inn, way, _b);
    return { x: q.x, y: q.y, z: q.z, yaw: Math.atan2(f.dir.x, f.dir.z), pitch: 0, speed, docked: null, job: "approach", visible: true, toName, lane: "entry", cargo, toId: leg.to.id ?? null };
  }
  const yaw = Math.atan2(-dx, -dz), pitch = Math.atan2(dy, Math.hypot(dx, dz)) * 0.5;
  return { x: B.x - nx * inn, y: B.y - ny * inn, z: B.z - nz * inn, yaw, pitch, speed, docked: null, job: "approach", visible: true, toName, cargo, toId: leg.to.id ?? null };
}

/* ---- the flown timetable -------------------------------------------------
 *
 * The legs are still the plan: dock here, then that port, then the belt, then
 * home, carrying this. What changed is that the hull now FLIES the plan
 * instead of being placed along it. Each hull holds a state and its own
 * clock, and the states are exactly the phases of a real port call:
 *
 *   dock      on the clamps inside the ring. Off the board, riding with the
 *             port (ports move), until its turnaround is up.
 *   launch    out through the mouth and down the exit lane under low power.
 *             On the board from the moment it clears the doors.
 *   cruise    the crossing. Thrust up to the leg's cruise speed, hold it,
 *             brake for the far end. This is the part that did not exist —
 *             minutes of open space where a hull can be met, hailed, escorted
 *             or taken.
 *   approach  captured by the destination's entry lane, braking to the mouth.
 *   cut       a miner on its claim, or a pirate on its lurk.
 *   watch     a picket's sweep.
 *
 * Nothing here teleports and nothing goes `visible:false` except while it is
 * genuinely inside a station ring.
 */

const DOCK_R = 70;                  // close enough to the mouth to be on the clamps
const LANE_OUT = LANE_U * 1.15;     // the launch ends a little past the far gate
const CAPTURE_MULT = 6;             // entry-lane capture distance, in ARRIVE_U
const LAUNCH_TOP = 190;             // hulls leave the mouth slowly; it is a doorway
const APPROACH_TOP = 240;

/* Far-field detail. A hull the player cannot see does not need a full
 * steering solution sixty times a second, but it must still get where it is
 * going on time — so it is stepped with the dt it missed rather than skipped. */
const NEAR_R = 42000;               // inside this, always stepped in full

function stationById(list, id) {
  if (!id) return null;
  for (let i = 0; i < list.length; i++) if (list[i].id === id) return list[i];
  return null;
}

/** Which leg the timetable says the hull is on at `t`, and how far into it. */
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

/** Advance to the next leg of the timetable and enter the state it calls for. */
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
    /* a travel leg: cost the crossing once, here */
    const A = nodePos(leg.from, n, stationList, _a), B = nodePos(leg.to, n, stationList, _b);
    const L = A && B ? Math.hypot(B.x - A.x, B.y - A.y, B.z - A.z) : 60000;
    n.fly.top = legCruise(L, n.fly.accel);
    n.legLen = L;
    n.legFrom = A ? { x: A.x, y: A.y, z: A.z } : { x: n.x, y: n.y, z: n.z };
    n.lane3 = usesLane(L) ? laneProfile(L) : null;
    n.drive = 0;
    n.state = leg.from.kind === "port" ? "launch" : "cruise";
    n.stateUntil = t + legTime(L, n.fly.accel) * 3 + 120;   // a generous watchdog, not a schedule
  }
}

/**
 * Put a hull where its timetable says it belongs and give it the state to
 * match. Used to seed a fresh sky, to bring one back after being shot down,
 * and by a mirror that has lost the host.
 */
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
    /* drop it somewhere sensible along the crossing rather than at the mouth,
     * so a fresh sky does not have forty hulls all leaving port at once */
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

/* the cargo moves, unchanged in meaning: lifted from the port it leaves,
 * delivered to the port it reaches. Only the trigger moved, from a pose
 * transition to an undock and a touchdown. */
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
    /* A commercial run loads against the far port's SHORTFALL, not against
     * its own hold. Nobody freights a barge of stainless to a port whose
     * shelves are already full of it — and if they did, the sky's own traffic
     * would keep every port permanently topped up, every shortage would close
     * before anyone could act on it, and the work board the player (and the
     * corporations) haul against would have nothing on it. Load what is
     * wanted; the rest of the hold stays empty and the hull is smaller for it. */
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

/* ---- the per-hull tick --------------------------------------------------- */

/* The longest slice of time a hull is ever integrated in one go. In play a
 * tick is 1/60 s and the far-field stride hands over at most a few frames'
 * worth, so this never bites; it exists because a test, a tab that was
 * backgrounded, or a sky change can hand over a much larger dt, and flying a
 * ninety-second step as one Euler jump puts hulls through stations. */
const SUB_S = 0.5;
const SUB_MAX = 120;          // beyond a minute of catch-up, the timetable is the honest answer

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

  /* anything with a claim on this hull flies it: a security response, a
   * pirate run-in, a hull that is running for its life (npc/combat.js,
   * npc/security.js). The timetable waits. */
  if (trafficHooks.director?.(n, t, dt, ctx)) {
    n.visible = true;
    n.docked = null;
    return;
  }
  /* the legacy outright-pose override, for anything still using it */
  const posed = trafficHooks.battlePose?.(n, t, SL, system);
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
        /* riding the clamps: the port moves and the hull moves with it */
        placeAt(n, st.x, st.y, st.z, st.vx ?? 0, st.vy ?? 0, st.vz ?? 0);
      }
      n.visible = false;
      n.docked = n.dockNode?.id ?? null;
      n.speed = 0;
      n.drive = 0;
      setJob(n, "docked", st?.name ?? n.toName);
      if (t >= n.stateUntil) {
        /* clamps off. The cargo comes off the port's shelves now, on the same
         * tick the hull reads as outbound — a watcher sampling one tick must
         * see the manifest and the job agree. */
        n.docked = null;
        nextLeg(n, t, SL);
        if (n.state === "launch" || n.state === "cruise") {
          liftCargo(n, SL);
          n.visible = true;
          setJob(n, "outbound", nodeName(n.legs[n.legIx]?.to ?? {}, SL));
          /* 0.3.15: off the clamps and out through the bay, not out of the station's middle */
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
      /* 0.3.15 — the hangar, flown: the departures clamps to the exit door, or
       * the entry door to the arrivals clamps (npc/bay.js). Kinematic, riding
       * the port, the same path every client computes. */
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
        /* clear of the mouth and the funnel: open the throttle and cross */
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

      /* the lane gate at the far end, if the destination is a port: the hull
       * aims at the lane rather than the hull plating the whole way in */
      const gate = st ? laneAt(st, "entry", LANE_U, n.way ?? subLaneFor(n.id), _a) : null;
      const gx = gate ? gate.x : B.x, gy = gate ? gate.y : B.y, gz = gate ? gate.z : B.z;
      const capture = ARRIVE_U * CAPTURE_MULT;
      if (st) {
        const d = Math.hypot(n.x - st.x, n.y - st.y, n.z - st.z);
        const dg = Math.hypot(n.x - gx, n.y - gy, n.z - gz);
        if (d < capture || dg < capture * 0.7) { n.drive = 0; n.state = "approach"; return; }
      }

      const match = st ? { vx: st.vx ?? 0, vy: st.vy ?? 0, vz: st.vz ?? 0 } : null;
      const L3 = n.lane3;
      if (L3 && L3.top > 0) {
        /* how far out of the origin, and how far still to run */
        const F = n.legFrom ?? { x: n.x, y: n.y, z: n.z };
        const dOut = Math.hypot(n.x - F.x, n.y - F.y, n.z - F.z);
        const dIn = Math.hypot(n.x - gx, n.y - gy, n.z - gz);
        if (dOut > RUN_OUT_U && dIn > RUN_IN_U) {
          /* drive lit. The goal is the DROP POINT — RUN_IN_U short of the far
           * end — so the arrive-brake sheds the drive on its own, and the hull
           * comes out of the lane already slow. It stays visible throughout:
           * a lane transit you can see is a transit you can get ahead of. */
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

      /* sublight: the run out of the port, the run in to the far one, and
       * every short leg from end to end */
      if (st) {
        flyStep(n, dt, gx, gy, gz, { standoff: capture * 0.4, match });
      } else {
        const rem = flyStep(n, dt, B.x, B.y, B.z, { standoff: 240 });
        if (rem < Math.max(300, n.speed * dt * 1.6)) { nextLeg(n, t, SL); return; }
      }
      /* watchdog: a leg that somehow cannot be finished does not strand a hull */
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
      /* How far down the lane the hull is — a PROJECTION onto the lane axis,
       * not the range to the mouth. The funnel offsets the lane sideways, so
       * the two are not the same number, and using the range as if it were
       * one gives a goal that sits further out than the hull does: the hull
       * flies to it, recomputes the same goal, and parks in the funnel for
       * good. Project, and the goal always lies inboard. */
      const along = (n.x - mouth.x) * f.dir.x + (n.y - mouth.y) * f.dir.y + (n.z - mouth.z) * f.dir.z;
      const goalAlong = Math.max(0, Math.min(LANE_U * 1.2, along - 220));
      const q = laneAt(st, "entry", goalAlong, way, _b);
      /* 0.3.15: the last few hundred units come down to a creep, so the hull
       * reaches the entry door at the pace it flies the bay rather than
       * stopping dead on the aperture */
      const pre = { x: n.x, y: n.y, z: n.z };   // where the hull is in the port's frame at this tick (flyStep integrates it to the next)
      const top = hasBay(st) ? Math.max(24, Math.min(APPROACH_TOP, d * 0.45)) : APPROACH_TOP;
      flyStep(n, dt, q.x, q.y, q.z, { top, match: { vx: st.vx ?? 0, vy: st.vy ?? 0, vz: st.vz ?? 0 } });
      if (hasBay(st) && d < 600) {
        /* the harbour brake: a heavy hull that came off the cruise hot is
         * walked down to the creep by the port's own beam, so nothing enters
         * the bay at cruise speed */
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
      /* the gate has to be at least as wide as one step of travel, or a
       * coarse tick flies straight through it and the hull orbits forever */
      /* (the step is measured in the port's frame: a tethered port's own orbit is hundreds of u/s and is not travel) */
      const relSp = hasBay(st) ? Math.hypot(n.vx - (st.vx ?? 0), n.vy - (st.vy ?? 0), n.vz - (st.vz ?? 0)) : n.speed;
      if (d < Math.max(DOCK_R, relSp * dt * 1.6)) {
        deliverCargo(n, SL, leg.to.id);
        n.lane = null;
        if (hasBay(st)) {
          /* 0.3.15: through the entry door and down onto the clamps — the hull stays on the board until it is on them */
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
        /* 0.3.16: a miner hauls home what its claim actually holds — the ore
         * with the most money in reach (npc/ground.js claimSurvey) — not a
         * name drawn when the timetable was written. What it said on the band
         * about its seam and what lands on the port's shelf are the same ore. */
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
      /* a pirate with no hold to fly out of: it lives on its stretch of belt */
      const L = n.lurk ?? { angle: 0, rad: n.orbitR, y: 0 };
      const cx = Math.cos(L.angle) * L.rad, cz = Math.sin(L.angle) * L.rad;
      const a = n.phase * 0.01 + t * n.lurkW;
      n.visible = true;
      setJob(n, "lurking", "the belt");
      flyStep(n, dt, cx + Math.cos(a) * n.lurkR, L.y + Math.sin(t * 0.03 + n.phase) * 60, cz + Math.sin(a) * n.lurkR, { top: 260 });
      return;
    }

    case "hold": {
      /* No timetable and no orders: hold position. A hull in this state used
       * to fall through to the picket ellipse and fly off on a sweep it was
       * never assigned — which is wrong for a company hull between contracts,
       * a hull whose route was cleared, and anything a caller is holding on
       * purpose. */
      n.visible = true;
      setJob(n, "hold", n.toName ?? "");
      n.vx *= Math.max(0, 1 - dt * 1.2);
      n.vy *= Math.max(0, 1 - dt * 1.2);
      n.vz *= Math.max(0, 1 - dt * 1.2);
      coastStep(n, dt);
      return;
    }

    default: {
      /* watch: a picket's long ellipse through the inner system */
      const r = n.orbitR * 1.35;
      const ang = n.phase * 0.01 + t * n.omega * 0.55;
      n.visible = true;
      setJob(n, "watch", n.toName ?? "");
      flyStep(n, dt, Math.cos(ang) * r, Math.cos(t * n.wobble) * n.amp * 0.4, Math.sin(ang) * r * 0.72, { top: 620 });
      return;
    }
  }
}

/* ---- the tick ------------------------------------------------------------ */

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

    /* shot down: off the board until its clock is up, then seated back onto
     * the timetable wherever that now puts it */
    const down = trafficDown[n.id];
    if (down && down > t) {
      if (n.job !== "down") { const from = n.job; n.job = "down"; trafficHooks.onTransition?.(n, from, "down"); }
      n.visible = false;
      n.speed = 0;
      n.vx = 0; n.vy = 0; n.vz = 0;
      continue;
    }
    if (n.job === "down") {
      /* its ten minutes are up: a replacement hull under the same name takes
       * the run over, which is why the roster count never sags */
      delete trafficDown[n.id];
      n.hp = n.hpMax ?? n.hp;
      n.shield = n.shieldMax ?? n.shield;
      n.underAttack = 0;
      seatHull(n, t, stationList, system);
      continue;
    }

    /* Far field: stepped on a stride with the time it missed, coasting in
     * between. `shipPos` null (tests, headless) means everything is near. */
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

/**
 * A hull was destroyed: off the board for a while, then back on its route.
 * Returns the sky time it returns.
 *
 * 0.3.33 — how long "a while" is now depends on who was underwriting it. An
 * operator with platinum cover has the money to replace the hull and is back
 * in under half the time; one with nothing at all takes a third longer than
 * the base. That is the whole mechanical meaning of NPC insurance, and it is
 * the right one: you can read a lane's underwriting off how well it keeps its
 * traffic after a bad week. Seeded off the vessel id, so a shared sky agrees
 * without exchanging anything.
 */
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
    /* whatever had a claim on it lets go */
    n.respondTo = null;
    n.hunt = null;
    n.fleeFrom = null;
    n.engagedWith = null;
  }
  return trafficDown[id];
}

/* `traffic` is an array because everything that draws it walks it in order.
 * It is also looked up BY ID constantly — the battle tick alone resolved nine
 * ids per frame with `traffic.find()`, which against 150 hulls is 1,350 string
 * comparisons a frame for the life of an engagement. So the array carries an
 * index beside it, rebuilt lazily after any push/splice/clear. The array stays
 * the source of truth; the Map is only ever a view of it. */
const hullIx = new Map();
let hullIxDirty = true;

/** Mark the hull index stale — after any push/splice/clear of `traffic`. */
export function reindexTraffic() {
  hullIxDirty = true;
}

let hullIxLen = -1;

export function vesselById(id) {
  /* self-healing on the array's length as well as on reindexTraffic(), because
   * `traffic` is exported and a caller (or a test) can mutate it directly */
  if (hullIxDirty || traffic.length !== hullIxLen) {
    hullIx.clear();
    for (const n of traffic) hullIx.set(n.id, n);
    hullIxDirty = false;
    hullIxLen = traffic.length;
  }
  return hullIx.get(id) ?? null;
}

/** "Ilya Voss · she/her" — the person in the chair, for anything that lists hulls. */
export function captainLine(n) {
  const p = n?.captainPronouns;
  return `${n?.captain ?? n?.name ?? "unknown"}${p ? ` · ${p.subj}/${p.obj}` : ""}`;
}

/** "on approach to Bastion Anchorage — Ilya Voss · she/her commanding" */
export function vesselStatus(n) {
  /* npc/npccrew.js writes `crewTag` onto a vessel once it has a crew worth
   * mentioning — a strike, a mutiny, a hull nobody is maintaining. Read as a
   * plain string so this module never has to know that crews exist. */
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

/** Everyone currently on the board, nearest first. */
export function visibleVessels(pos) {
  return traffic
    .filter((n) => n.visible !== false)
    .map((n) => ({ n, d: Math.hypot(n.x - pos.x, n.y - pos.y, n.z - pos.z) }))
    .sort((a, b) => a.d - b.d);
}

/* ---- shared sky events -------------------------------------------------- */

export const EVENT_KINDS = ["quiet", "drought", "ice_rush", "pirate_watch", "convoy"];

/**
 * The event that is live at `t` in this sky. Same seed + same slot = same
 * bulletin on every client. `quiet` means the markets desk has nothing.
 * About one slot in four carries something — a bulletin every ten or twelve
 * minutes, not every three.
 */
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
    if (!named.length) return null; // no thirsty port, no bulletin
    return `DROUGHT DECLARATION — ${named.join(", ")} paying ${ev.mult}× for water`;
  }
  if (ev.kind === "ice_rush") return `ICE RUSH — outer belt ice paying ${ev.mult}× at the bench`;
  if (ev.kind === "pirate_watch") return "PIRATE WATCH — pickets report heat on the belt approaches";
  if (ev.kind === "convoy") return `CONVOY WINDOW — ${ev.legs} logistics legs running the inner ports`;
  return null;
}

/** Count of live hulls by role, for the HUD and tests. */
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
