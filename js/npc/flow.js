import { rngFromSeed } from "../world/generate.js";
import { perf } from "../core/perf.js";
import { stations as liveStations } from "../station/stations.js";
import { stationLane, laneAt, SUBLANES, LANE_U } from "./lanes.js";
import { DEPART_S, ARRIVE_S, ARRIVE_U } from "./traffic.js";
import { hasBay, bayPose, BAY_IN_S, BAY_OUT_S } from "./bay.js";
import { SECTORS, goodName } from "../economy/materials.js";
import { shipById } from "../ships/shipdb.js";
import { cargoFor, deliver, lift, stockOf } from "../economy/economy.js";

export const flow = [];

const SECTOR_HULLS = {
  logistic:     ["logistics_a", "logistics_b", "general_b2", "commerce_b"],
  industrial:   ["mining_a", "mining_b", "manufacturing_a", "general_b2", "logistics_b"],
  civilian:     ["general_b", "commerce_a", "commerce_b", "healthcare_a", "education_a"],
  agricultural: ["agriculture_a", "agriculture_b", "general_b2", "logistics_a"],
  military:     ["security_a", "security_b", "general_b", "logistics_b"],
  pirate:       ["general_c", "salvage_a", "security_a"],
};
const SECTOR_COUNT = { logistic: 10, industrial: 9, civilian: 7, agricultural: 6, military: 6, pirate: 3 };
export const FLOW_CAP = 58;
const SECTOR_PALETTE = {
  logistic: ["#c9a24a", "#d8b365", "#b58f3a"], industrial: ["#9aa4b2", "#7d8794", "#b3bcc8"],
  civilian: ["#c2cfe0", "#dfe6f0", "#a9b8cc"], agricultural: ["#8fbf7a", "#a7d18e", "#77a566"],
  military: ["#6f8ea8", "#587a94", "#8aa6bf"], pirate: ["#b8342e", "#8e2a26", "#d4573a"],
};
export const FLOW_VARIANTS = 2;

const PREFIX = { logistic: "MV", industrial: "IV", civilian: "CV", agricultural: "AG", military: "AUX", pirate: "FP" };
const WORDS = ["Tamarin", "Sorrel", "Kestrel", "Bramble", "Osprey", "Lantern", "Cinder", "Harrow", "Marlin", "Petrel", "Saffron", "Ballast", "Tallow", "Wicket", "Corvid", "Ember", "Gannet", "Halyard", "Juniper", "Kelp", "Lodestar", "Mallow", "Nettle", "Ochre", "Pintail", "Quarrel", "Rowan", "Sable", "Teal", "Umber", "Vetch", "Wren", "Yarrow", "Zephyr", "Anvil", "Brisk", "Coble", "Dory", "Ferrule", "Grist"];
export function boatName(sector, rng, i) {
  return `${PREFIX[sector] ?? "MV"} ${WORDS[Math.floor(rng() * WORDS.length)].toUpperCase()} ${1 + ((i * 7 + Math.floor(rng() * 40)) % 99)}`;
}

export function resetFlow() { flow.length = 0; }

export function populateFlow(seed, stationList = liveStations) {
  resetFlow();
  const tierK = perf.tier >= 3 ? 1 : perf.tier === 2 ? 0.8 : perf.tier === 1 ? 0.6 : 0.4;
  const ports = (stationList ?? []).filter((x) => x && x.id).length || 1;
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

export function flowPose(n, t, stationList = liveStations, out = {}) {
  const st = stationList.find((s) => s.id === n.port);
  if (!st) { out.visible = false; out.job = "docked"; return out; }
  const phase = ((t + n.phase) % n.period + n.period) % n.period;
  const dock = n.period * n.dockFrac;
  const away = n.period - dock - DEPART_S - ARRIVE_S;
  if (phase < dock) {
    out.x = st.x; out.y = st.y; out.z = st.z; out.visible = false; out.job = "docked"; out.lane = null; out.speed = 0;
    return out;
  }
  const f = stationLane(st);
  let lt = phase - dock;
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

export function stepFlow(t, stationList = liveStations) {
  for (const n of flow) {
    const was = n.job;
    flowPose(n, t, stationList, n);
    if (was === undefined || was === n.job || !n.good) continue;
    const st = stationList.find((s) => s.id === n.port);
    if (!st) continue;
    if (n.inbound && was === "approach" && n.job === "docked") { const had = stockOf(st, n.good); n.moved += Math.max(0, deliver(st, n.good, n.qty) - had); }
    else if (!n.inbound && was === "docked" && n.job === "outbound") n.moved += lift(st, n.good, n.qty);
  }
  return flow;
}

export function flowNear(pos, range) {
  return flow
    .filter((n) => n.visible)
    .map((n) => ({ n, d: Math.hypot(n.x - pos.x, n.y - pos.y, n.z - pos.z) }))
    .filter((e) => e.d < range)
    .sort((a, b) => a.d - b.d);
}

export function portPulse(stId) {
  let inbound = 0, outbound = 0;
  for (const n of flow) if (n.port === stId && n.visible) { if (n.job === "approach") inbound++; else outbound++; }
  return { inbound, outbound };
}
