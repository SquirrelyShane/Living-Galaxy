/* LIVING GALAXY — port flow: the heartbeat.
 *
 * The captains in traffic.js are people — named, filed in the CRADLE,
 * running real legs across the sky. A port needs more than that to look
 * alive: a constant stream of supply boats in and goods boats out, the way
 * a body needs a pulse. That is the flow: per port, a ring of light hulls
 * cycling clamps → exit lane → gone → entry lane → clamps, phased evenly so
 * something is always arriving and something always leaving.
 *
 * Flow hulls are not individuals. They carry no captain and no ledger
 * entry; they are a manifest (what they bring, what they take), a hull
 * variant from a small pool the engine pre-forges and re-uses (hullpool.js)
 * with a scale and hue jitter so no two look alike, and a pure timetable
 * pose like everything else on the board — same seed, same stream, every
 * client. They are not contacts and cannot be shot; they are the traffic
 * you fly through, not the traffic you fight.
 */

import { rngFromSeed } from "../generate.js";
import { perf } from "../perf.js";
import { stations as liveStations } from "../stations.js";
import { stationLane, laneAt, SUBLANES, LANE_U } from "./lanes.js";
import { DEPART_S, ARRIVE_S, ARRIVE_U } from "./traffic.js";
import { hasBay, bayPose, BAY_IN_S, BAY_OUT_S } from "./bay.js";
import { SECTORS, goodName } from "../materials.js";
import { shipById } from "../shipdb.js";
import { cargoFor, deliver, lift, stockOf } from "../economy.js";

export const flow = [];

/* boats by sector: what a port of that kind sees most on its clamps */
const SECTOR_HULLS = {
  logistic:     ["logistics_a", "logistics_b", "general_b2", "commerce_b"],
  industrial:   ["mining_a", "mining_b", "manufacturing_a", "general_b2", "logistics_b"],
  civilian:     ["general_b", "commerce_a", "commerce_b", "healthcare_a", "education_a"],
  agricultural: ["agriculture_a", "agriculture_b", "general_b2", "logistics_a"],
  military:     ["security_a", "security_b", "general_b", "logistics_b"],
  pirate:       ["general_c", "salvage_a", "security_a"],
};
/* Boats per port. These used to run 24/20/16/14/12/6, which across nine ports
 * is a hundred and sixty small craft — more than the entire named roster of
 * captains, drones and raiders put together, all of them anonymous, all of
 * them milling around the same few rings. A port should look busy; it should
 * not look like the only thing in the sky is shuttle traffic.
 *
 * Roughly halved, and capped across the whole sky (FLOW_CAP) so a system with
 * a lot of ports does not quietly reintroduce the same crowd. */
const SECTOR_COUNT = { logistic: 10, industrial: 9, civilian: 7, agricultural: 6, military: 6, pirate: 3 };
export const FLOW_CAP = 58;        // the most boats the whole sky carries at once
const SECTOR_PALETTE = {
  logistic: ["#c9a24a", "#d8b365", "#b58f3a"], industrial: ["#9aa4b2", "#7d8794", "#b3bcc8"],
  civilian: ["#c2cfe0", "#dfe6f0", "#a9b8cc"], agricultural: ["#8fbf7a", "#a7d18e", "#77a566"],
  military: ["#6f8ea8", "#587a94", "#8aa6bf"], pirate: ["#b8342e", "#8e2a26", "#d4573a"],
};
export const FLOW_VARIANTS = 2;   // seeds per hull id in the pool (livery follows the variant)

/* Boats have names. Not captains — nobody is filed for them — but a hull on the
 * board reads as a ship, not as a cargo tag: a house prefix by sector, a word
 * and a pennant number, e.g. "MV TAMARIN 14" or "AG SORREL 3". */
const PREFIX = { logistic: "MV", industrial: "IV", civilian: "CV", agricultural: "AG", military: "AUX", pirate: "FP" };
const WORDS = ["Tamarin", "Sorrel", "Kestrel", "Bramble", "Osprey", "Lantern", "Cinder", "Harrow", "Marlin", "Petrel", "Saffron", "Ballast", "Tallow", "Wicket", "Corvid", "Ember", "Gannet", "Halyard", "Juniper", "Kelp", "Lodestar", "Mallow", "Nettle", "Ochre", "Pintail", "Quarrel", "Rowan", "Sable", "Teal", "Umber", "Vetch", "Wren", "Yarrow", "Zephyr", "Anvil", "Brisk", "Coble", "Dory", "Ferrule", "Grist"];
export function boatName(sector, rng, i) {
  return `${PREFIX[sector] ?? "MV"} ${WORDS[Math.floor(rng() * WORDS.length)].toUpperCase()} ${1 + ((i * 7 + Math.floor(rng() * 40)) % 99)}`;
}

export function resetFlow() { flow.length = 0; }

/** Build the flow for every port in the sky. Deterministic per seed. */
export function populateFlow(seed, stationList = liveStations) {
  resetFlow();
  /* A device that is already shedding far-field detail does not want a
   * hundred shuttles either, so the flow scales with the frame budget the
   * same way everything else does. */
  const tierK = perf.tier >= 3 ? 1 : perf.tier === 2 ? 0.8 : perf.tier === 1 ? 0.6 : 0.4;
  const ports = (stationList ?? []).filter((x) => x && x.id).length || 1;
  /* and the sky-wide cap is shared out, so ten ports each get a slice rather
   * than each getting a full house */
  const share = Math.max(2, Math.floor((FLOW_CAP * tierK) / ports));
  for (const st of stationList) {
    const rng = rngFromSeed(`${seed}:flow:${st.id}`);
    const hulls = SECTOR_HULLS[st.sector] ?? SECTOR_HULLS.civilian;
    const pal = SECTOR_PALETTE[st.sector] ?? SECTOR_PALETTE.civilian;
    const count = Math.max(2, Math.min(share, Math.round((SECTOR_COUNT[st.sector] ?? 6) * tierK)));
    const sec = SECTORS[st.sector] ?? {};
    const wants = Object.keys(sec.buys ?? {});
    const sells = Object.keys(sec.sells ?? sec.buys ?? {});
    const period = 170 + rng() * 150;
    for (let i = 0; i < count; i++) {
      const ship = hulls[Math.floor(rng() * hulls.length)];
      const inbound = rng() < 0.55;
      const variant = Math.floor(rng() * FLOW_VARIANTS);
      /* what it carries: the lines' inputs in, their outputs out (economy.js); the sector lists as the fallback */
      const good = cargoFor(st, inbound, rng) ?? ((inbound ? wants : sells)[0] ?? null);
      const def = shipById(ship);
      const qty = Math.round((18 + rng() * 30) * Math.max(0.6, Math.min(3, (def?.stats?.cargo ?? 20) / 20)));
      flow.push({
        id: `flow:${st.id}:${i}`,
        port: st.id,
        ship,
        name: boatName(st.sector, rng, i),
        hullName: def?.name ?? "Boat",
        variant,
        color: pal[variant % pal.length],
        scale: 0.86 + rng() * 0.3,
        way: i % SUBLANES,
        period,
        phase: (i / count) * period + rng() * 12,
        dockFrac: 0.28 + rng() * 0.16,
        inbound, good, qty,
        manifest: good ? `${inbound ? "⇣" : "⇡"} ${goodName(good)} ×${qty}` : (inbound ? "⇣ stores" : "⇡ goods"),
        x: 0, y: 0, z: 0, yaw: 0, pitch: 0, speed: 0, visible: false, job: "docked", lane: null, moved: 0,
      });
    }
  }
  return flow;
}

const _p = { x: 0, y: 0, z: 0 };

/** Pure pose of a flow hull at sky time t. */
export function flowPose(n, t, stationList = liveStations, out = {}) {
  const st = stationList.find((s) => s.id === n.port);
  if (!st) { out.visible = false; out.job = "docked"; return out; }
  const f = stationLane(st);
  const phase = ((t + n.phase) % n.period + n.period) % n.period;
  const dock = n.period * n.dockFrac;
  const away = n.period - dock - DEPART_S - ARRIVE_S;   // gone: somewhere else, off the board
  if (phase < dock) {
    out.x = st.x; out.y = st.y; out.z = st.z; out.visible = false; out.job = "docked"; out.lane = null; out.speed = 0;
    return out;
  }
  let lt = phase - dock;
  /* 0.3.15: a port with a built hangar puts the first seconds of a departure
   * and the last seconds of an arrival INSIDE the bay (npc/bay.js) — off the
   * clamps and out through the exit door, in through the entry door and down
   * onto them. The lane part of each run is the rest of the same budget, so
   * the timetable (and every transition the ledger keys on) is unchanged. */
  const bay = hasBay(st);
  const bOut = bay ? BAY_OUT_S : 0, bIn = bay ? BAY_IN_S : 0;
  if (lt < DEPART_S) {
    if (lt < bOut) {
      bayPose(st, "out", lt / bOut, n.way, out);
      out.visible = true; out.job = "outbound"; out.lane = "bay";
      return out;
    }
    const u = (lt - bOut) / (DEPART_S - bOut);
    const d = LANE_U * u * u;
    laneAt(st, "exit", d, n.way, _p); out.x = _p.x; out.y = _p.y; out.z = _p.z;
    out.yaw = Math.atan2(-f.dir.x, -f.dir.z); out.pitch = 0; out.speed = (2 * LANE_U * u) / (DEPART_S - bOut);
    out.visible = true; out.job = "outbound"; out.lane = "exit";
    return out;
  }
  lt -= DEPART_S;
  if (lt < away) { out.visible = false; out.job = "away"; out.lane = null; out.speed = 0; return out; }
  const la = lt - away;
  const laneT = ARRIVE_S - bIn;
  if (la >= laneT && bay) {
    bayPose(st, "in", Math.min(1, (la - laneT) / bIn), n.way, out);
    out.visible = true; out.job = "approach"; out.lane = "bay";
    return out;
  }
  const u = Math.min(1, la / laneT);
  const d = ARRIVE_U * (1 - u) * (1 - u);
  laneAt(st, "entry", d, n.way, _p); out.x = _p.x; out.y = _p.y; out.z = _p.z;
  out.yaw = Math.atan2(f.dir.x, f.dir.z); out.pitch = 0; out.speed = (2 * ARRIVE_U * (1 - u)) / laneT;
  out.visible = true; out.job = "approach"; out.lane = "entry";
  return out;
}

/** Advance every flow hull. Cheap: a few dozen pure evaluations — plus the cargo: an inbound
 * boat that reaches the clamps delivers, an outbound one that leaves them lifts. */
export function stepFlow(t, stationList = liveStations) {
  for (const n of flow) {
    const was = n.job;
    flowPose(n, t, stationList, n);
    if (was === undefined || was === n.job || !n.good) continue;
    const st = stationList.find((s) => s.id === n.port);
    if (!st) continue;
    if (n.inbound && was === "approach" && n.job === "docked") { const had = stockOf(st, n.good); n.moved += Math.max(0, deliver(st, n.good, n.qty) - had); }   // only what the floor actually took
    else if (!n.inbound && was === "docked" && n.job === "outbound") n.moved += lift(st, n.good, n.qty);
  }
  return flow;
}

/** Flow hulls on the board near a point, nearest first. */
export function flowNear(pos, range) {
  return flow
    .filter((n) => n.visible)
    .map((n) => ({ n, d: Math.hypot(n.x - pos.x, n.y - pos.y, n.z - pos.z) }))
    .filter((e) => e.d < range)
    .sort((a, b) => a.d - b.d);
}

/** How busy a port's clamps are right now: hulls on its lanes. */
export function portPulse(stId) {
  let inbound = 0, outbound = 0;
  for (const n of flow) if (n.port === stId && n.visible) { if (n.job === "approach") inbound++; else outbound++; }
  return { inbound, outbound };
}
