import { CHAINS, CHAIN_BY_ID } from "../data/chains.js";
import { stations, stationById } from "../station/stations.js";
import { sim } from "../sim/sim.js";

export { CHAINS, CHAIN_BY_ID };

export const CHAIN = {
  cool: 2400,
  carry: 900,
  hop: 4,
  bonusK: 0.5,
};
export const chainBonus = (chain) => Math.round((chain?.bonus ?? 0) * CHAIN.bonusK);

export const chains = { live: new Map(), done: new Map(), cold: new Map() };
let version = 0;
export const chainVersion = () => version;

function hash32(s) {
  let h = 0x811c9dc5;
  s = String(s);
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 0x01000193); }
  return h >>> 0;
}

const honest = (st) => st && !(st.hostile && !st.claimed) && st.sector !== "pirate";
const d3 = (a, b) => Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z);

let homes = null;
function assignHomes() {
  const ports = stations.filter(honest);
  const key = `${sim.skySeed ?? "sky"}:${ports.length}:${ports.map((s) => s.id).join(",")}`;
  if (homes?.key === key) return homes.map;
  const map = new Map();
  const load = new Map();
  const cap = Math.max(1, Math.ceil(CHAINS.length / Math.max(1, ports.length)));
  const rank = (chain, st) => hash32(`${sim.skySeed ?? "sky"}:chain:${chain.id}:${st.id}`);
  for (let round = 0; round < 3; round++) {
    for (const chain of CHAINS) {
      if (map.has(chain.id)) continue;
      const want = chain.sectors?.length ? chain.sectors : null;
      let best = null;
      for (const st of ports) {
        if (want && round < 2 && !want.includes(st.sector)) continue;
        if ((load.get(st.id) ?? 0) >= cap + round) continue;
        const h = rank(chain, st);
        if (!best || h < best.h) best = { st, h };
      }
      if (best) { map.set(chain.id, best.st.id); load.set(best.st.id, (load.get(best.st.id) ?? 0) + 1); }
    }
  }
  homes = { key, map };
  return map;
}

export function homePortOf(chain) {
  const id = assignHomes().get(chain.id);
  return (id && stationById(id)) ?? stations.find(honest) ?? null;
}

export function nextPortFrom(st, chain, idx) {
  const near = stations.filter((o) => honest(o) && o.id !== st.id).map((o) => ({ o, d: d3(o, st) })).sort((a, b) => a.d - b.d).slice(0, CHAIN.hop);
  if (!near.length) return st;
  return near[hash32(`${chain.id}:${idx}:next`) % near.length].o;
}

const cold = (id, now) => (chains.cold.get(id) ?? -Infinity) + CHAIN.cool > now;

export function chainOffersAt(st, now = sim.time) {
  if (!st) return [];
  const out = [];
  for (const e of chains.live.values()) {
    if (e.held || e.stationId !== st.id) continue;
    const chain = CHAIN_BY_ID[e.chainId];
    if (!chain) continue;
    out.push({ chain, idx: e.idx, stage: chain.stages[e.idx], first: e.idx === 0, last: e.idx === chain.stages.length - 1, of: chain.stages.length });
  }
  for (const chain of CHAINS) {
    if (chains.live.has(chain.id) || chains.done.has(chain.id) || cold(chain.id, now)) continue;
    if (homePortOf(chain)?.id !== st.id) continue;
    out.push({ chain, idx: 0, stage: chain.stages[0], first: true, last: chain.stages.length === 1, of: chain.stages.length });
  }
  return out;
}

export function chainState(id) { return chains.live.get(id) ?? null; }

export function noteChainAccept(a) {
  if (!a?.chain) return null;
  const chain = CHAIN_BY_ID[a.chain];
  if (!chain) return null;
  let e = chains.live.get(chain.id);
  if (!e) {
    e = { chainId: chain.id, idx: a.chainIdx ?? 0, stationId: a.stationId, held: null, started: sim.time, paid: 0, stages: chain.stages.length, corpId: a.corpId ?? null, corpName: a.corpName ?? "the port" };
    chains.live.set(chain.id, e);
  }
  e.idx = a.chainIdx ?? e.idx;
  e.held = a.id;
  e.stationId = a.stationId;
  version++;
  return e;
}

export function noteChainDone(a) {
  if (!a?.chain) return null;
  const chain = CHAIN_BY_ID[a.chain];
  const e = chains.live.get(a.chain);
  if (!chain || !e) return null;
  e.paid += a.pay ?? 0;
  e.held = null;
  const idx = a.chainIdx ?? e.idx;
  const next = idx + 1;
  version++;
  if (next >= chain.stages.length) {
    chains.live.delete(chain.id);
    chains.done.set(chain.id, { at: sim.time, paid: e.paid + chainBonus(chain), stages: chain.stages.length });
    return { chain, idx, last: true, bonus: chainBonus(chain), standing: chain.standing ?? 0, nextStationId: null, nextName: null, nextTitle: null };
  }
  const here = stationById(a.stationId) ?? stationById(e.stationId);
  const stage = chain.stages[next];
  const to = stage.at === "next" ? nextPortFrom(here, chain, next) : here;
  e.idx = next;
  e.stationId = to?.id ?? e.stationId;
  return { chain, idx, last: false, bonus: 0, standing: 0, nextStationId: e.stationId, nextName: to?.name ?? "the port", nextTitle: stage.title };
}

export function noteChainFail(a) {
  if (!a?.chain) return null;
  const e = chains.live.get(a.chain);
  if (!e) return null;
  chains.live.delete(a.chain);
  chains.cold.set(a.chain, sim.time);
  version++;
  return CHAIN_BY_ID[a.chain] ?? null;
}

export function chainReport() {
  return [...chains.live.values()].map((e) => {
    const chain = CHAIN_BY_ID[e.chainId];
    const st = stationById(e.stationId);
    return {
      id: e.chainId, name: chain?.name ?? e.chainId, cat: chain?.cat ?? null, blurb: chain?.blurb ?? "",
      stage: e.idx + 1, of: e.stages, held: Boolean(e.held), paid: e.paid,
      bonus: chainBonus(chain), stationId: e.stationId, stationName: st?.name ?? "—",
      title: chain?.stages[e.idx]?.title ?? "", corpName: e.corpName,
    };
  });
}

export function resetChains() {
  homes = null;
  chains.live.clear();
  chains.done.clear();
  chains.cold.clear();
  version++;
}

export function wireChains() {
  if (globalThis.window?.__lg) window.__lg.chains = { chains, CHAINS, chainOffersAt, chainReport, chainState, resetChains };
}
