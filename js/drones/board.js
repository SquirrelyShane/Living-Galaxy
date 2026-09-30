import { stations } from "../station/stations.js";
import { stockOf, bidPrice, shortagesOf } from "../economy/economy.js";
import { goodName } from "../economy/materials.js";

export const board = { claims: new Map(), clock: () => 0 };

export const FREIGHT_RATE = 0.14;

const d3 = (a, b) => Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z);
export const freightKey = (s) => `freight:${s.from}:${s.to}:${s.good}`;

export function claim(key, who, ttl = 900) {
  const c = board.claims.get(key);
  const now = board.clock();
  if (c && c.who !== who && c.until > now) return false;
  board.claims.set(key, { who, until: now + ttl });
  return true;
}
export function touch(key, who, ttl = 900) { const c = board.claims.get(key); if (c && c.who === who) c.until = board.clock() + ttl; }
export function release(key, who = null) { const c = board.claims.get(key); if (c && (!who || c.who === who)) board.claims.delete(key); }
export function heldBy(key) { const c = board.claims.get(key); return c && c.until > board.clock() ? c.who : null; }
export function releaseAll(who) { for (const [k, c] of board.claims) if (c.who === who) board.claims.delete(k); }
export function resetBoard() { board.claims.clear(); }

export function openFreight({ home, cap = 80, who = null, n = 8, maxKm = Infinity } = {}) {
  const ports = stations.filter((s) => (!s.hostile || s.claimed) && !s.gnn);
  const out = [];
  for (const B of ports) {
    for (const sh of shortagesOf(B).slice(0, 3)) {
      let A = null, ad = Infinity;
      for (const s of ports) {
        if (s === B || stockOf(s, sh.id) < 30) continue;
        const d = home ? d3(s, home) : 0;
        if (d < ad) { ad = d; A = s; }
      }
      if (!A) continue;
      const qty = Math.min(cap, Math.floor(stockOf(A, sh.id) * 0.3));
      if (qty < 8) continue;
      const slot = { kind: "freight", from: A.id, to: B.id, good: sh.id, qty };
      const key = freightKey(slot);
      const holder = heldBy(key);
      if (holder && holder !== who) continue;
      slot.pay = Math.round(qty * bidPrice(B, sh.id) * FREIGHT_RATE);
      slot.km = Math.round(((home ? d3(A, home) : 0) + d3(A, B)) / 100);
      if (slot.km > maxKm) continue;
      slot.key = key;
      slot.label = `${goodName(sh.id)} ×${qty}, ${A.name} → ${B.name} (${slot.pay} cr)`;
      out.push(slot);
    }
  }
  return out.sort((a, b) => b.pay / (b.km + 50) - a.pay / (a.km + 50)).slice(0, n);
}

export function boardReport() {
  const now = board.clock();
  return [...board.claims].filter(([, c]) => c.until > now).map(([key, c]) => ({ key, who: c.who, left: Math.round(c.until - now) }));
}
