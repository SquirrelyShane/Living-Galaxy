/* LIVING GALAXY — chain contracts: work that remembers you.
 *
 * 0.3.21. A one-off job is a transaction. A CHAIN is a relationship: four or
 * five stages posted one at a time, each one an ordinary board job built from
 * a kind the game already knows how to complete, strung on a story that moves
 * — a furnace relit charge by charge, a manifest that keeps not saying what is
 * in the case, a ring section built out girder by girder. Finish a stage and
 * the next one is waiting, here or at the port the desk sends you to; finish
 * the last and it pays a bonus and a block of standing on top of the stage.
 *
 * This module is the state machine only. The prose and the stage plan are
 * data (js/data/chains.js); the offers themselves are built by contracts.js
 * from the kind each stage names, so a chain can never ask for a mechanic the
 * game does not have. The dependency runs one way: contracts.js → chains.js.
 *
 *   chainOffersAt(st)   what this port should post right now
 *   noteChainAccept(a)  a stage was taken
 *   noteChainDone(a)    a stage was delivered → advance, or finish and pay
 *   noteChainFail(a)    abandoned or late → the chain drops, cools off, returns
 */

import { CHAINS, CHAIN_BY_ID } from "./data/chains.js";
import { stations, stationById } from "./stations.js";
import { sim } from "./sim.js";

export { CHAINS, CHAIN_BY_ID };

export const CHAIN = {
  cool: 2400,          // s a failed chain stays off the boards
  carry: 900,          // s of extra deadline a chain stage gets over a one-off
  hop: 4,              // how many nearby ports an "at: next" stage may pick from
};

/** live: chainId → { chainId, idx, stationId, held, started, paid, stages } */
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

/**
 * Where a chain begins. Every chain has exactly ONE home port in a sky, and no
 * port hoards them: the chains are dealt out in order, each to the best-hashing
 * port of a sector it belongs in that is not already carrying its share. So a
 * chain is a place you can go back to, and a tour of the sky turns up work you
 * have not seen. Worked out once per sky and cached.
 */
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

/** A port for an `at: "next"` stage: one of the nearest few, picked by the stage. */
export function nextPortFrom(st, chain, idx) {
  const near = stations.filter((o) => honest(o) && o.id !== st.id).map((o) => ({ o, d: d3(o, st) })).sort((a, b) => a.d - b.d).slice(0, CHAIN.hop);
  if (!near.length) return st;
  return near[hash32(`${chain.id}:${idx}:next`) % near.length].o;
}

const cold = (id, now) => (chains.cold.get(id) ?? -Infinity) + CHAIN.cool > now;

/**
 * What this port should post right now:
 *   [{ chain, idx, stage, first, last, of }]
 * A live chain's pending stage if it is due here; otherwise the openers whose
 * home port this is and that are not running, finished or cooling off.
 */
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

/** Is this chain running, and how far in? */
export function chainState(id) { return chains.live.get(id) ?? null; }

/** A stage offer was accepted. */
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

/**
 * A stage was delivered. Advances the chain and says what happened:
 *   { chain, idx, last, bonus, standing, nextStationId, nextName, nextTitle }
 * `bonus`/`standing` are non-zero only on the closing stage; settle() pays them.
 */
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
    chains.done.set(chain.id, { at: sim.time, paid: e.paid + (chain.bonus ?? 0), stages: chain.stages.length });
    return { chain, idx, last: true, bonus: chain.bonus ?? 0, standing: chain.standing ?? 0, nextStationId: null, nextName: null, nextTitle: null };
  }
  const here = stationById(a.stationId) ?? stationById(e.stationId);
  const stage = chain.stages[next];
  const to = stage.at === "next" ? nextPortFrom(here, chain, next) : here;
  e.idx = next;
  e.stationId = to?.id ?? e.stationId;
  return { chain, idx, last: false, bonus: 0, standing: 0, nextStationId: e.stationId, nextName: to?.name ?? "the port", nextTitle: stage.title };
}

/** Abandoned, expired or failed: the chain drops and cools off before it returns. */
export function noteChainFail(a) {
  if (!a?.chain) return null;
  const e = chains.live.get(a.chain);
  if (!e) return null;
  chains.live.delete(a.chain);
  chains.cold.set(a.chain, sim.time);
  version++;
  return CHAIN_BY_ID[a.chain] ?? null;
}

/** For the console and the board: every chain running, with where it stands. */
export function chainReport() {
  return [...chains.live.values()].map((e) => {
    const chain = CHAIN_BY_ID[e.chainId];
    const st = stationById(e.stationId);
    return {
      id: e.chainId, name: chain?.name ?? e.chainId, cat: chain?.cat ?? null, blurb: chain?.blurb ?? "",
      stage: e.idx + 1, of: e.stages, held: Boolean(e.held), paid: e.paid,
      bonus: chain?.bonus ?? 0, stationId: e.stationId, stationName: st?.name ?? "—",
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
