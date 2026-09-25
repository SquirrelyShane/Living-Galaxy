/* LIVING GALAXY — what ARIA can see.
 *
 * 0.3.25. Until now the bot decided from three numbers: the board, the trade
 * routes, and how full the hold was. That is not a pilot looking out of a
 * canopy, it is a spreadsheet with a throttle — and it is why a mining run
 * would happily buy a hundred girders, why a job was taken at a port whose
 * smelter had been stalled for ten minutes, and why nobody noticed the
 * raiders on the belt the job was sending her to.
 *
 * This is the instrument panel instead. One call builds a SNAPSHOT of the
 * whole situation from the live sim — the hull, where it is and what is
 * pulling on it, what is in weapons range, the belt under the nose, every
 * honest port with its prices, its industry lines and what has stalled on
 * them, the board, the routes, the traffic and the standing — and everything
 * downstream reads that snapshot rather than reaching into the world itself.
 *
 * Two reasons it is a snapshot and not a set of getters. It is CHEAP: the
 * expensive parts (per-port ledgers, route search) are rebuilt on their own
 * cadence, not per tick. And it is HONEST: every decision in one think is made
 * against one consistent picture of the sky, the way a pilot decides from what
 * the panel said when they looked at it.
 *
 * Nothing here mutates anything. If a field is missing the sky did not have
 * it, which is a fact and not an error.
 */

import { sim, losBlocker, sellPriceAt, buyPriceAt, currentShipId } from "../sim.js";
import { stations, stationById } from "../stations.js";
import { BODIES, bodyPosition, currentSystem, dist3 } from "../bodies.js";
import { wellRadius } from "../scale.js";
import { econReport, stockOf, shortagesOf, wantsOf } from "../economy.js";
import { nearbyRocks, inBelt, depleted } from "../field.js";
import { contacts } from "../turrets.js";
import { traffic, HOSTILE_ROLES } from "../npc/traffic.js";
import { flow } from "../npc/flow.js";
import { nests } from "../npc/rogues.js";
import { corps, corpOfStation, standingLabel } from "../corps.js";
import { holdRoom, batteryCap } from "../ship.js";
import { hullMaxOf, repairsAt, pricePerPoint } from "../repair.js";
import { shipById } from "../shipdb.js";
import { goodName, bulkOf } from "../materials.js";
import { sites, sitesNear } from "../sites.js";
import { boardByCategory } from "../contracts.js";
import { tradeRoutes } from "../traderoutes.js";
import { chainReport } from "../chains.js";
import { SECTORS } from "../materials.js";

/** How stale each layer is allowed to get, in sim seconds. */
export const SENSE = {
  hull: 0,             // every look
  space: 2,            // what is around the hull
  ports: 20,           // ledgers and prices: the economy ticks every 20 s anyway
  board: 45,           // the desk re-posts every 480 s; 45 is plenty
  routes: 30,
};

const cache = { hull: null, space: null, ports: null, board: null, routes: null, at: {} };
const fresh = (k) => cache[k] && (sim.time - (cache.at[k] ?? -1e9)) < SENSE[k];
const keep = (k, v) => { cache[k] = v; cache.at[k] = sim.time; return v; };

/** Drop everything: a new sky, a new hull, a new run. */
export function forgetSenses() {
  for (const k of Object.keys(cache)) if (k !== "at") cache[k] = null;
  cache.at = {};
}

const honest = (st) => st && !(st.hostile && !st.claimed) && st.sector !== "pirate";
const _p = { x: 0, y: 0, z: 0 };

/* ---- the hull ------------------------------------------------------------------- */

export function senseHull() {
  const ship = sim.ship;
  const def = shipById(currentShipId?.() ?? null);
  const held = Object.entries(ship.hold ?? {}).filter(([, q]) => q > 0.01).sort((a, b) => b[1] - a[1]);
  const cap = Math.max(1, ship.cargoCap ?? 1);
  return {
    id: def?.id ?? null, name: def?.name ?? "hull",
    turrets: def?.stats?.turrets ?? 0,
    armed: (def?.stats?.turrets ?? 0) > 0 && def?.grammar?.weapons !== "none",
    pos: { x: ship.pos.x, y: ship.pos.y, z: ship.pos.z },
    vel: { x: ship.vel.x, y: ship.vel.y, z: ship.vel.z },
    speed: Math.hypot(ship.vel.x, ship.vel.y, ship.vel.z),
    credits: Math.round(ship.credits ?? 0),
    hull: (ship.hull ?? 100) / Math.max(1, hullMaxOf(ship)),
    charge: (ship.charge ?? 0) / Math.max(1, batteryCap(ship)),
    cargoCap: cap,
    room: holdRoom(ship),
    holdFrac: held.reduce((a, [, q]) => a + q, 0) / cap,
    hold: held.map(([id, q]) => ({ id, name: goodName(id), qty: Math.round(q) })),
    dockedAt: ship.dockedAt ?? null,
    dockedName: ship.dockedAt ? stationById(ship.dockedAt)?.name ?? null : null,
    warpCool: sim.warp?.cool ?? 0,
    warpState: sim.warp?.state ?? "idle",
    inBelt: inBelt(ship.pos),
  };
}

/* ---- the space around it ---------------------------------------------------------- */

/**
 * Wells, contacts, rock. `well` is the radius inside which the core will not
 * hold geometry, which is the thing a pilot actually plans around.
 */
export function senseSpace() {
  if (fresh("space")) return cache.space;
  const p = sim.ship.pos;
  const wells = [];
  for (const b of BODIES) {
    if (!bodyPosition(b.id, sim.time, _p)) continue;
    const d = dist3(_p, p);
    wells.push({ id: b.id, name: b.name, kind: b.kind, x: _p.x, y: _p.y, z: _p.z, r: b.radius, well: b.well ?? wellRadius(b), d, inside: d < (b.well ?? wellRadius(b)) });
  }
  wells.sort((a, b) => a.d - b.d);
  const hostile = [];
  for (const c of contacts) {
    if (!(c.hp > 0) || c.relation !== "hostile") continue;
    hostile.push({ id: c.id, name: c.name ?? "contact", d: Math.hypot(c.x - p.x, c.y - p.y, c.z - p.z), x: c.x, y: c.y, z: c.z });
  }
  hostile.sort((a, b) => a.d - b.d);
  const rocks = inBelt(p) ? nearbyRocks(p, sim.time, 1) : [];
  const ores = new Map();
  for (const r of rocks) {
    if ((r.worn ?? 0) >= 0.97) continue;
    const e = ores.get(r.ore) ?? { id: r.ore, name: r.oreName ?? goodName(r.ore), rocks: 0, rich: 0, nearest: Infinity };
    e.rocks++;
    if (r.rich) e.rich++;
    e.nearest = Math.min(e.nearest, dist3(r, p));
    ores.set(r.ore, e);
  }
  return keep("space", {
    dominant: sim.dominant ? { id: sim.dominant.id, name: sim.dominant.name, d: sim.domDist ?? 0 } : null,
    inWell: wells.find((w) => w.inside && w.kind !== "star") ?? null,
    wells: wells.slice(0, 8),
    hostiles: hostile.slice(0, 8),
    threat: hostile.length ? hostile[0].d : Infinity,
    raiders: traffic.filter((n) => HOSTILE_ROLES.has(n.role) && n.job !== "down").length,
    nests: nests.filter((n) => n.hp > 0).map((n) => ({ id: n.id, name: n.name, x: n.x, y: n.y, z: n.z, d: Math.hypot(n.x - p.x, n.y - p.y, n.z - p.z) })).sort((a, b) => a.d - b.d),
    rocks: rocks.length,
    ores: [...ores.values()].sort((a, b) => b.rich - a.rich || a.nearest - b.nearest),
    sites: sitesNear(p, 1e9).map(({ site, d }) => ({ id: site.id, name: site.name, ore: site.ore, oreName: site.oreName, d, x: site.x, y: site.y, z: site.z })),
    openSites: sites.size,
    boats: flow.filter((b) => b.visible).length,
  });
}

/* ---- the ports -------------------------------------------------------------------- */

/**
 * Every honest port: where it is, what it pays, what it is short of, what its
 * lines are eating and what they have stalled on. A stalled smelter is a
 * standing order for the thing it stalled on, which is a mining job nobody
 * posted yet — and knowing that is the difference between a bot that reads a
 * board and a pilot who reads a port.
 */
export function sensePorts() {
  if (fresh("ports")) return cache.ports;
  const p = sim.ship.pos;
  const out = [];
  for (const st of stations) {
    if (!honest(st)) continue;
    const e = econReport(st);
    const co = corpOfStation(st);
    const stalled = e.lines.filter((l) => !l.running && l.stalledOn);
    out.push({
      id: st.id, name: st.name, sector: st.sector, x: st.x, y: st.y, z: st.z,
      d: dist3(st, p),
      credits: e.credits,
      services: SECTORS[st.sector]?.services ?? [],
      repairs: repairsAt(st),
      repairPer: repairsAt(st) ? pricePerPoint(st) : null,
      corpId: co?.id ?? null, corpName: co?.name ?? null,
      standing: co ? Math.round(co.standing) : null,
      standingLabel: co ? standingLabel(co.standing) : null,
      /* what its factories are doing right now */
      lines: e.lines.map((l) => ({ id: l.id, name: l.name, running: l.running, stalledOn: l.stalledOn, stalledName: l.stalledName })),
      stalled: stalled.map((l) => ({ line: l.name, good: l.stalledOn, name: l.stalledName })),
      shortages: e.shortages.slice(0, 6).map((s) => ({ id: s.id, name: goodName(s.id), mult: Number((s.mult ?? 1).toFixed(2)) })),
      wants: wantsOf(st, 4).map((w) => ({ id: w.id, name: w.name, over: Number((w.over ?? 1).toFixed(2)) })),
      gluts: e.gluts.slice(0, 4).map((g) => ({ id: g.id, name: goodName(g.id) })),
      /* the shelf, priced for one unit — a lot is priced when a lot is proposed */
      stock: e.stock.filter((l) => l.qty >= 1).map((l) => ({ id: l.id, name: l.name, qty: l.qty, fill: Number(l.fill.toFixed(2)), ask: l.ask, bid: l.bid, trend: l.trend })),
      blocked: dist3(st, p) > 3000 ? Boolean(losBlocker(p, st, null)) : false,
    });
  }
  out.sort((a, b) => a.d - b.d);
  return keep("ports", out);
}

/* ---- the work on offer -------------------------------------------------------------- */

export function senseBoard() {
  if (fresh("board")) return cache.board;
  const near = sensePorts().slice(0, 6);
  const out = [];
  for (const P of near) {
    const st = stationById(P.id);
    if (!st) continue;
    for (const c of boardByCategory(st, sim.time)) {
      out.push({ portId: P.id, portName: P.name, d: P.d, cat: c.cat, name: c.name, offers: c.offers, open: c.open, best: c.best });
    }
  }
  return keep("board", { rows: out, chains: chainReport() });
}

export function senseRoutes(opts = {}) {
  if (fresh("routes") && !opts.force) return cache.routes;
  return keep("routes", tradeRoutes({ n: 10 }).map((r) => ({
    fromId: r.from.id, from: r.from.name, toId: r.to.id, to: r.to.name,
    good: r.good, name: r.name, qty: r.qty, buy: r.buy, sell: r.sell,
    margin: Math.round(r.margin), profit: Math.round(r.profit), secs: Math.round(r.secs), perMin: Math.round(r.perMin),
  })));
}

/* ---- the whole panel ---------------------------------------------------------------- */

/** One consistent picture of the sky. Everything downstream reads this. */
export function sense(opts = {}) {
  return {
    at: sim.time,
    system: currentSystem?.name ?? "system",
    hull: senseHull(),
    space: senseSpace(),
    ports: sensePorts(),
    board: senseBoard(),
    routes: senseRoutes(opts),
    standing: corps.map((c) => ({ id: c.id, name: c.name, standing: Math.round(c.standing) })).sort((a, b) => b.standing - a.standing),
  };
}

/* ---- reading the panel --------------------------------------------------------------- */

/** The port nearest the hull that a leg can actually be flown to. */
export function nearestReachablePort(s = null, except = null) {
  const ports = s?.ports ?? sensePorts();
  return ports.find((P) => P.id !== except && !P.blocked) ?? ports[0] ?? null;
}

/**
 * What a port would pay over the odds for, that somebody else has on the
 * shelf: a stalled line is a standing order nobody has posted yet.
 */
export function unpostedWork(s = null, room = holdRoom(sim.ship), purse = sim.ship.credits) {
  const ports = s?.ports ?? sensePorts();
  const out = [];
  for (const P of ports) {
    for (const want of [...P.stalled.map((x) => ({ id: x.good, why: `${x.line} is stalled on it` })), ...P.shortages.map((x) => ({ id: x.id, why: "short" }))]) {
      const st = stationById(P.id);
      if (!st) continue;
      const bid = sellPriceAt(st, want.id, Math.min(room, 40));
      let best = null;
      for (const S of ports) {
        if (S.id === P.id) continue;
        const line = S.stock.find((l) => l.id === want.id && l.qty >= 5);
        if (!line) continue;
        const src = stationById(S.id);
        const qty = Math.max(1, Math.min(Math.floor(room / bulkOf(line.id ?? want.id)), Math.floor(line.qty), Math.floor(purse / Math.max(1, line.ask))));
        const ask = buyPriceAt(src, { id: want.id }, qty);
        if (ask >= bid) continue;
        const profit = (bid - ask) * qty;
        if (!best || profit > best.profit) best = { fromId: S.id, from: S.name, ask, qty, profit };
      }
      if (best && best.profit > 400) out.push({ toId: P.id, to: P.name, good: want.id, name: goodName(want.id), bid, why: want.why, ...best });
    }
  }
  return out.sort((a, b) => b.profit - a.profit).slice(0, 8);
}

/** One line a terminal can print: what she is looking at. */
export function senseLine(s = null) {
  const v = s ?? sense();
  const w = v.space.inWell;
  return `${v.system} · ${v.hull.name} ${Math.round(v.hull.hull * 100)}% hull ${Math.round(v.hull.charge * 100)}% charge · hold ${Math.round(v.hull.holdFrac * 100)}% · ${w ? `in ${w.name}'s well` : v.space.dominant ? `near ${v.space.dominant.name}` : "open space"}${v.space.hostiles.length ? ` · ${v.space.hostiles.length} hostile` : ""}${v.hull.inBelt ? ` · belt: ${v.space.rocks} rocks, ${v.space.ores.length} ores` : ""}`;
}

void depleted;
