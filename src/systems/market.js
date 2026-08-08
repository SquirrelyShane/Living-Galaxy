// Living Galaxy — system-wide commodity market. Every station carries its own
// price book that drifts on a slow random walk, is pulled toward the station's
// structural bias (a refinery wants ore), and moves against trade volume — NPC
// haulers and the player both leave a mark on it.

import { S } from '../core/state.js';
import { COMMODITIES, TRADE_MULT, SUPPLY } from '../core/config.js';
import { MINERALS } from '../data/belts.js';
import { makeRng } from '../core/rng.js';

const TRADED = ['ore', 'salvage', 'data'];
let rng = makeRng(1);
let driftT = 0;

export function initMarket() {
  rng = makeRng((S.seed ^ 0x9a17) >>> 0);
  S.market = { tick: 0, books: {} };
  for (const st of S.world.stations) book(st);
}

function book(st) {
  const u = st.userData;
  const b = { prices: {}, demand: {}, stock: {} };
  for (const key of TRADED) {
    const base = COMMODITIES[key].base;
    const bias = (TRADE_MULT[u.category] || {})[key] || 1;
    b.prices[key] = base * bias * (0.9 + rng.next() * 0.2);
    b.demand[key] = 0.9 + rng.next() * 0.2;
    b.stock[key] = Math.round(rng.next() * 4000);
  }
  S.market.books[u.name] = b;
  return b;
}

export const bookFor = st => (S.market && S.market.books[st.userData.name]) || book(st);

/** Live unit price at a station, floored so a market can never pay nothing. */
export function marketPrice(st, key) {
  const b = bookFor(st);
  const svc = st.userData.services || {};
  let p = b.prices[key] || COMMODITIES[key].base;
  if (key === 'ore' && svc.orePremium) p *= (1 + svc.orePremium);
  // What the station actually has right now. An empty refinery pays over the odds; a
  // full one has no reason to.
  const sc = scarcity(st, key);
  p *= 1 + (sc > 0 ? sc * SUPPLY.scarcity : sc * SUPPLY.glut);
  const spread = svc.spread != null ? svc.spread : 1;
  return Math.max(1, Math.round(p * (2 - spread) * 0.5 + p * 0.5));
}

/** Selling pushes a price down; buying pulls it up. Volume in kg. */
export function applyTrade(st, key, kg, selling = true) {
  const b = bookFor(st);
  if (!b.prices[key]) return;
  const impact = Math.min(0.22, Math.abs(kg) / 26000);
  b.prices[key] *= selling ? (1 - impact) : (1 + impact);
  b.stock[key] = Math.max(0, (b.stock[key] || 0) + (selling ? kg : -kg));
}

// ── supply chains ────────────────────────────────────────────────────
// Station modules used to be pure bonuses: a refinery raised the ore premium by a fixed
// 18% forever, whether it had any ore or not. They now consume and produce against a
// stockpile, so a refinery that has run dry genuinely bids ore up and one choking on
// stock stops paying for it. That turns the price book from noise into information — a
// high ore price somewhere means something specific is happening there.

/** What a station's fitted modules do to its stockpiles in one tick. */
export function supplyFlow(st) {
  const mods = st.userData.modules || [];
  const flow = {};
  let store = 0;
  for (const m of mods) {
    const chain = SUPPLY.chains[m.key || m];
    if (!chain) continue;
    if (chain.store) store += chain.store;
    for (const k in (chain.consumes || {})) flow[k] = (flow[k] || 0) - chain.consumes[k];
    for (const k in (chain.produces || {})) flow[k] = (flow[k] || 0) + chain.produces[k];
  }
  return { flow, capacity: SUPPLY.capacity + store };
}

/**
 * Run one tick of production. A chain that cannot get its input simply does not run —
 * it does not go negative and it does not produce from nothing, which is what makes an
 * empty stockpile a real constraint rather than a cosmetic number.
 */
function produce(st, b) {
  const { flow, capacity } = supplyFlow(st);
  for (const key in flow) {
    if (b.stock[key] === undefined) continue;
    const rate = flow[key];
    if (rate < 0 && b.stock[key] < -rate) continue;      // starved: the chain idles
    b.stock[key] = Math.max(0, Math.min(capacity, b.stock[key] + rate));
  }
  b.capacity = capacity;
  b.flow = flow;
}

/**
 * Scarcity pressure, -1 (glutted) to +1 (empty). Applied to the price so a stockpile at
 * zero pays a premium and one at capacity pays badly.
 */
export function scarcity(st, key) {
  const b = bookFor(st);
  const cap = b.capacity || SUPPLY.capacity;
  const held = b.stock[key] || 0;
  return 1 - 2 * Math.max(0, Math.min(1, held / cap));
}

/** Slow drift + mean reversion + NPC background volume + supply chains. */
export function updateMarket(dt) {
  if (!S.market) return;
  driftT += dt;
  if (driftT < 4) return;
  driftT = 0;
  S.market.tick++;

  for (const st of S.world.stations) {
    const u = st.userData;
    const b = bookFor(st);
    produce(st, b);
    for (const key of TRADED) {
      const base = COMMODITIES[key].base * ((TRADE_MULT[u.category] || {})[key] || 1);
      // random walk
      b.prices[key] *= 1 + (rng.next() - 0.5) * 0.05;
      // NPC trade pressure: high stock depresses, scarcity lifts
      const glut = (b.stock[key] || 0) / 8000;
      b.prices[key] *= 1 - Math.min(0.03, glut * 0.03);
      b.stock[key] = Math.max(0, (b.stock[key] || 0) * 0.985 + (rng.next() - 0.4) * 120);
      // mean reversion so nothing runs away
      b.prices[key] += (base - b.prices[key]) * 0.06;
      b.prices[key] = Math.max(1, b.prices[key]);
    }
  }
}

/** Best station to sell a commodity, for the assistant and the nav map. */
export function bestMarket(key) {
  let best = null, bp = -1;
  for (const st of S.world.stations) {
    const p = marketPrice(st, key);
    if (p > bp) { bp = p; best = { station: st, price: p }; }
  }
  return best;
}

/** Ore is priced by what's actually in it. */
export function oreValue(comp) {
  if (!comp) return COMMODITIES.ore.base;
  let v = 0;
  for (const k in comp) v += (comp[k] / 100) * (MINERALS[k] ? MINERALS[k].value : 5);
  return v;
}
