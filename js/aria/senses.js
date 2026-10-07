import { sim, losBlocker, sellPriceAt, buyPriceAt, currentShipId } from "../sim/sim.js";
import { stations, stationById } from "../station/stations.js";
import { BODIES, bodyPosition, currentSystem, dist3 } from "../world/bodies.js";
import { wellRadius } from "../world/scale.js";
import { econReport, stockOf, shortagesOf, wantsOf } from "../economy/economy.js";
import { nearbyRocks, inBelt, depleted } from "../world/field.js";
import { contacts } from "../flight/turrets.js";
import { traffic, HOSTILE_ROLES } from "../npc/traffic.js";
import { flow } from "../npc/flow.js";
import { nests } from "../npc/rogues.js";
import { corps, corpOfStation, standingLabel } from "../corp/corps.js";
import { holdRoom, batteryCap } from "../flight/ship.js";
import { hullMaxOf, repairsAt, pricePerPoint } from "../flight/repair.js";
import { shipById } from "../ships/shipdb.js";
import { goodName, bulkOf } from "../economy/materials.js";
import { sites, sitesNear } from "../economy/sites.js";
import { boardByCategory } from "../economy/contracts.js";
import { tradeRoutes } from "../economy/traderoutes.js";
import { chainReport } from "../economy/chains.js";
import { SECTORS } from "../economy/materials.js";
import { hulks } from "../world/hulks.js";
import { ariaMind, discount, remember } from "./mind.js";
import { track, markDanger, dangers, alertsSince, alertLine, resetBelief } from "./belief.js";
import { threatOf, hazardsFrom, threatLine, THREAT } from "./threat.js";

export const SENSE = {
  hull: 0,
  space: 2,
  ports: 20,
  board: 45,
  routes: 30,
};

const cache = { hull: null, space: null, ports: null, board: null, routes: null, at: {} };
const fresh = (k) => cache[k] && (sim.time - (cache.at[k] ?? -1e9)) < SENSE[k];
const keep = (k, v) => { cache[k] = v; cache.at[k] = sim.time; return v; };

export function forgetSenses() {
  for (const k of Object.keys(cache)) if (k !== "at") cache[k] = null;
  cache.at = {};
  seen.at = -1e9; seen.pricesAt = -1e9; seen.shiftAt = -1e9; seen.last = null;
  resetBelief();
}

function staleMarket() {
  cache.routes = null; cache.board = null; cache.ports = null;
}

export const PERCEIVE = { every: 2, prices: 20, ports: 6, goods: 5, mark: 0.3, shiftEvery: 120 };
const seen = { at: -1e9, pricesAt: -1e9, shiftAt: -1e9, last: null };

const honest = (st) => st && !(st.hostile && !st.claimed) && st.sector !== "pirate";
const _p = { x: 0, y: 0, z: 0 };

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
      lines: e.lines.map((l) => ({ id: l.id, name: l.name, running: l.running, stalledOn: l.stalledOn, stalledName: l.stalledName })),
      stalled: stalled.map((l) => ({ line: l.name, good: l.stalledOn, name: l.stalledName })),
      shortages: e.shortages.slice(0, 6).map((s) => ({ id: s.id, name: goodName(s.id), mult: Number((s.mult ?? 1).toFixed(2)) })),
      wants: wantsOf(st, 4).map((w) => ({ id: w.id, name: w.name, over: Number((w.over ?? 1).toFixed(2)) })),
      gluts: e.gluts.slice(0, 4).map((g) => ({ id: g.id, name: goodName(g.id) })),
      stock: e.stock.filter((l) => l.qty >= 1).map((l) => ({ id: l.id, name: l.name, qty: l.qty, fill: Number(l.fill.toFixed(2)), ask: l.ask, bid: l.bid, trend: l.trend })),
      blocked: dist3(st, p) > 3000 ? Boolean(losBlocker(p, st, null)) : false,
    });
  }
  out.sort((a, b) => a.d - b.d);
  return keep("ports", out);
}

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

export function nearestReachablePort(s = null, except = null) {
  const ports = s?.ports ?? sensePorts();
  return ports.find((P) => P.id !== except && !P.blocked) ?? ports[0] ?? null;
}

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

export function senseLine(s = null) {
  const v = s ?? sense();
  const w = v.space.inWell;
  return `${v.system} · ${v.hull.name} ${Math.round(v.hull.hull * 100)}% hull ${Math.round(v.hull.charge * 100)}% charge · hold ${Math.round(v.hull.holdFrac * 100)}% · ${w ? `in ${w.name}'s well` : v.space.dominant ? `near ${v.space.dominant.name}` : "open space"}${v.space.hostiles.length ? ` · ${v.space.hostiles.length} hostile` : ""}${v.hull.inBelt ? ` · belt: ${v.space.rocks} rocks, ${v.space.ores.length} ores` : ""}`;
}

export function hostileWithin(r = 6000) {
  const p = sim.ship.pos;
  for (const c of contacts) if (c.hp > 0 && c.relation === "hostile" && Math.hypot(c.x - p.x, c.y - p.y, c.z - p.z) < r) return true;
  return false;
}

const TRADE_KEY = (k) => k === "route" || k === "supply" || k === "sell" || k.startsWith("board:trade") || k.startsWith("board:logistics") || k.startsWith("chain:trade") || k.startsWith("chain:logistics");

function react(a, now) {
  if (a.group === "price") {
    staleMarket();
    if (now - seen.shiftAt < PERCEIVE.shiftEvery && now >= seen.shiftAt) return;
    seen.shiftAt = now;
    discount(TRADE_KEY, 0.8, alertLine(a), now);
  } else if (a.group === "threat" && a.dir > 0) {
    remember({ at: now, kind: "sky", summary: alertLine(a), importance: 0.7, consequences: { from: a.from, to: a.to } });
    ariaMind.shift = { at: now, why: alertLine(a), moves: 0 };
  } else if (a.group === "salvage") {
    discount((k) => k === "salvage" || k.startsWith("board:salvage") || k.startsWith("chain:salvage"), 0.8, alertLine(a), now);
  }
}

function sceneOf(hull, space, threat) {
  if (hull.dockedAt) return { label: "docked", line: `docked at ${hull.dockedName ?? "port"}` };
  if (threat.band === "outgunned" || threat.band === "pressed") return { label: threat.band, line: threatLine(threat) };
  if (hull.warpState && hull.warpState !== "idle") return { label: "warp", line: "in warp" };
  if (hull.inBelt) return { label: "belt", line: `in the belt — ${space.rocks} rocks, ${space.ores.length} ores` };
  const w = space.inWell;
  return { label: "transit", line: w ? `in ${w.name}'s well` : space.dominant ? `near ${space.dominant.name}` : "open space" };
}

export function perceive(force = false) {
  const now = sim.time ?? 0;
  if (!force && seen.last && now >= seen.at && now - seen.at < PERCEIVE.every) return seen.last;
  const hull = senseHull();
  const space = senseSpace();
  const hostiles = [];
  for (const c of contacts) if (c.hp > 0 && c.relation === "hostile") hostiles.push(c);
  const threat = threatOf({ pos: hull.pos, vel: hull.vel, hull: hull.hull, charge: hull.charge, armed: hull.armed, turrets: hull.turrets }, hostiles);
  const p = hull.pos;
  for (const c of hostiles) {
    const d = Math.hypot(c.x - p.x, c.y - p.y, c.z - p.z);
    if (d <= THREAT.reach) markDanger(c, Math.min(1, PERCEIVE.mark + threat.level * 0.7), now, c.name ?? "contact");
  }
  const fresh = [];
  const feed = (a) => { if (a) { fresh.push(a); react(a, now); } };
  feed(track("hostiles", threat.n, now, { kind: "threat", scale: 1, label: "Hostiles in range", group: "threat" }));
  feed(track("raiders", space.raiders, now, { kind: "threat", scale: 1, label: "Raiders in the sky", group: "threat" }));
  feed(track("hulks", hulks.length, now, { kind: "count", scale: 1, label: "Hulks adrift", group: "salvage" }));
  if (now - seen.pricesAt >= PERCEIVE.prices || now < seen.pricesAt) {
    seen.pricesAt = now;
    const near = [];
    for (const st of stations) if (honest(st) && st.stock) near.push({ st, d: dist3(st, p) });
    near.sort((a, b) => a.d - b.d);
    const held = Object.keys(sim.ship.hold ?? {}).filter((id) => sim.ship.hold[id] > 0.01);
    for (const { st } of near.slice(0, PERCEIVE.ports)) {
      const ids = [...new Set([...held, ...wantsOf(st, 3).map((w) => w.id)])].slice(0, PERCEIVE.goods);
      for (const id of ids) {
        const px = sellPriceAt(st, id);
        feed(track(`px:${st.id}:${id}`, px, now, { kind: "price", scale: Math.max(1, px * 0.05), label: `${goodName(id)} at ${st.name}`, group: "price" }));
      }
    }
  }
  const scene = sceneOf(hull, space, threat);
  const alerts = alertsSince(now);
  ariaMind.scene = {
    at: now, label: scene.label, line: scene.line,
    threat: { level: Number(threat.level.toFixed(2)), band: threat.band, n: threat.n, nearest: Number.isFinite(threat.nearest) ? Math.round(threat.nearest) : null, closing: Math.round(threat.closing), eta: Number.isFinite(threat.eta) ? Math.round(threat.eta) : null, worst: threat.worst?.name ?? null },
    alerts: alerts.slice(0, 4).map((a) => ({ at: Math.round(a.at), line: alertLine(a) })),
  };
  seen.at = now;
  seen.last = { at: now, hull, space, threat, hazards: hazardsFrom({ hostiles, nests: space.nests, dangers: dangers(now) }), alerts, fresh, scene };
  return seen.last;
}

void depleted;
