import { logEvent, sim, sellPriceAt, currentShipId, addWaypointAt, addAnchoredWaypoint, removeWaypoint } from "../sim/sim.js";
import { stations, stationById } from "../station/stations.js";
import { corpOfStation, corpRelation, corps, adjustStanding, standingLabel } from "../corp/corps.js";
import { POWERS } from "../data/factions.js";
import { shortagesOf, wantsOf, bidPrice, askPrice, stockOf, deliver, lift } from "./economy.js";
import { goodName, baseValue, good, bulkOf, ORES, SECTORS } from "./materials.js";
import { traffic, HOSTILE_ROLES } from "../npc/traffic.js";
import { flow } from "../npc/flow.js";
import { nests } from "../npc/rogues.js";
import { rngFromSeed } from "../world/generate.js";
import { takeCargo, addCargo, roomFor } from "../flight/ship.js";
import { shipById } from "../ships/shipdb.js";
import { bookRevenue } from "../corp/company.js";
import { work, pilot } from "../flight/pilot.js";
import { BODIES, BEACONS, bodyPosition, beaconPosition, currentSystem, scanRadius } from "../world/bodies.js";
import { pickSpot, spotLine, openSite, closeSite, siteById } from "./sites.js";
import { chainOffersAt, chainVersion, noteChainAccept, noteChainDone, noteChainFail, resetChains, chainReport, wireChains, CHAIN, chainBonus } from "./chains.js";
import { bookHandling } from "../station/dockwork.js";

export const TIERS = [
  { key: "low",  name: "Standard", weight: 58, pay: 1.0,  standing: -10 },
  { key: "mid",  name: "Bonded",   weight: 30, pay: 1.35, standing: 15 },
  { key: "high", name: "Sealed",   weight: 12, pay: 1.8,  standing: 35 },
];

export const CATEGORIES = {
  mining:    { name: "Mining & Extraction",     careers: ["mining"],                                      skill: "hazardOps",     kinds: ["mine", "ice", "vein"] },
  logistics: { name: "Freight & Logistics",     careers: ["logistics"],                                   skill: "supplyChain",   kinds: ["haul", "supply", "courier"] },
  trade:     { name: "Trade & Procurement",     careers: ["commerce"],                                    skill: "commerce",      kinds: ["procure", "consign", "resupply", "tender"] },
  security:  { name: "Security & Bounties",     careers: ["security"],                                    skill: "security",      kinds: ["bounty", "escort", "patrol", "rogues"] },
  salvage:   { name: "Salvage & Recovery",      careers: ["salvage"],                                     skill: "salvage",       kinds: ["salvage", "wreck", "pod"] },
  industry:  { name: "Industry & Construction", careers: ["manufacturing", "construction", "shipyard"],  skill: "construction",  kinds: ["materials", "build", "parts"] },
  energy:    { name: "Energy & Fuel",           careers: ["energy"],                                      skill: "energySystems", kinds: ["fuel", "reactor"] },
  science:   { name: "Survey & Science",        careers: ["research", "navigation", "terraforming"],      skill: "research",      kinds: ["survey", "assay", "chart"] },
  civic:     { name: "Civic Services",          careers: ["healthcare", "education", "agriculture", "communications"], skill: "dataOps", kinds: ["medical", "food", "relay", "fieldtrip"] },
};
export const CATEGORY_ORDER = ["mining", "logistics", "trade", "security", "salvage", "industry", "energy", "science", "civic"];
const KIND_CAT = Object.fromEntries(Object.entries(CATEGORIES).flatMap(([cat, c]) => c.kinds.map((k) => [k, cat])));
export const categoryOf = (type) => KIND_CAT[type] ?? "logistics";

const SECTOR_WEIGHT = {
  industrial:   { mining: 5, industry: 5, logistics: 2, trade: 2, energy: 2, salvage: 2, science: 1, security: 1, civic: 1 },
  logistic:     { logistics: 5, trade: 5, industry: 2, energy: 2, security: 2, mining: 1, salvage: 1, science: 1, civic: 1 },
  civilian:     { civic: 5, trade: 4, logistics: 3, science: 2, energy: 2, security: 1, industry: 1, mining: 1, salvage: 1 },
  agricultural: { civic: 5, logistics: 3, trade: 3, energy: 3, science: 2, mining: 1, industry: 1, security: 1, salvage: 1 },
  military:     { security: 6, energy: 3, industry: 3, logistics: 2, salvage: 2, science: 2, trade: 1, mining: 1, civic: 1 },
  pirate:       { salvage: 5, trade: 4, security: 2, logistics: 2, mining: 2, energy: 1, industry: 1, science: 1, civic: 0 },
};
const CHARTER_LEAN = {
  economic:   { trade: 3, logistics: 3 },
  industrial: { mining: 3, industry: 3, energy: 1 },
  military:   { security: 4, energy: 1 },
  civic:      { civic: 3, science: 2, logistics: 1 },
  syndicate:  { salvage: 3, trade: 2 },
};

export const BOARD = {
  refresh: 480,
  offers: 30,
  expires: 900,
  deadline: 1500,
  abandonStanding: -12,
  lateStanding: -8,
  maxActive: 5,
  visitR: 1500,
  pay: 1.0,
};

export const contracts = { boards: new Map(), active: [], done: 0, failed: 0, seq: 1 };

function pickTier(rnd) {
  const total = TIERS.reduce((a, t) => a + t.weight, 0);
  let roll = rnd() * total;
  for (const t of TIERS) { roll -= t.weight; if (roll <= 0) return t; }
  return TIERS[0];
}
const pickOf = (rnd, arr) => arr[Math.floor(rnd() * arr.length)];
function weighted(rnd, table) {
  const e = Object.entries(table).filter(([, w]) => w > 0);
  let roll = rnd() * e.reduce((a, [, w]) => a + w, 0);
  for (const [k, w] of e) { roll -= w; if (roll <= 0) return k; }
  return e[0]?.[0];
}

const pilotCareer = () => pilot?.complexId ?? null;

export function hullFit() {
  const def = shipById(currentShipId?.() ?? null);
  const turrets = def?.stats?.turrets ?? 0;
  const armed = turrets > 0 && def?.grammar?.weapons !== "none";
  const cap = Math.max(1, Math.round(sim.ship?.cargoCap ?? 60));
  return { cap, capFor: (id) => (id ? Math.max(1, Math.floor(cap / bulkOf(id))) : cap), armed, turrets, hull: def?.name ?? "your hull" };
}
const sized = (fit, frac, lo = 4, id = null) => Math.max(lo, Math.round((fit.capFor ? fit.capFor(id) : fit.cap) * frac));
function qtyFor(fit, frac, lo, id, t) {
  const hold = sized(fit, frac, lo, id);
  const unit = Math.max(1, baseValue(id));
  const budget = (2500 + 4000 * (t?.pay ?? 1)) * Math.sqrt(Math.max(0.25, fit.cap / 400));
  return Math.max(Math.min(lo, hold), Math.min(hold, Math.floor(budget / unit)));
}

function charterOf(co) { return co?.charter ?? POWERS[co?.power]?.charter ?? "economic"; }

export function issuersAt(st) {
  const home = corpOfStation(st);
  const rnd = rngFromSeed(`${sim.skySeed ?? "sky"}:tenants:${st.id}`);
  const free = st.sector === "pirate";
  const pool = corps.filter((c) => c !== home && (free ? c.tier === "hostile" : c.tier !== "hostile") && (!home || corpRelation(c, home) > -0.5));
  const scored = pool.map((c) => ({ c, w: (c.sector === st.sector ? 3 : 1) * (0.5 + rnd()) })).sort((a, b) => b.w - a.w);
  const n = free ? 1 : 2 + (rnd() < 0.5 ? 1 : 0);
  return [home, ...scored.slice(0, n).map((x) => x.c)].filter(Boolean);
}

const _p = { x: 0, y: 0, z: 0 };
export function targetPos(t, time = sim.time, out = {}) {
  if (!t) return null;
  if (t.kind === "body") { if (!bodyPosition(t.id, time, _p)) return null; out.x = _p.x + (t.off?.x ?? 0); out.y = _p.y + (t.off?.y ?? 0); out.z = _p.z + (t.off?.z ?? 0); return out; }
  if (t.kind === "beacon") { const def = BEACONS.find((b) => b.id === t.id); if (!def) return null; const q = beaconPosition(def, time); out.x = q.x; out.y = q.y; out.z = q.z; return out; }
  if (t.kind === "station") { const st = stationById(t.id); if (!st) return null; out.x = st.x + t.off.x; out.y = st.y + t.off.y; out.z = st.z + t.off.z; return out; }
  out.x = t.x; out.y = t.y; out.z = t.z; return out;
}

export function markTarget(a) {
  const anchor = anchorFor(a);
  if (anchor) {
    const n0 = sim.waypoints.length;
    const wp = addAnchoredWaypoint(`${a.title} · ${anchor.name}`, anchor.ref, anchor.at);
    if (sim.waypoints.length === n0) return wp;
    if (wp.lost) { removeWaypoint(wp.id); return null; }
    wp.job = a.id;
    return wp;
  }
  const t = a.targets?.[Math.min(a.leg ?? 0, (a.targets?.length ?? 1) - 1)];
  const p = targetPos(t);
  if (!p) return null;
  const wp = addWaypointAt(`${a.title} · ${t.name ?? "target"}`, p.x, p.y, p.z);
  wp.job = a.id;
  return wp;
}

export function anchorFor(a) {
  if (!a) return null;
  if (a.markId) return { ref: { kind: "vessel", id: a.markId }, name: a.markName ?? "the mark" };
  if (a.boatId) return { ref: { kind: "boat", id: a.boatId }, name: a.boatName ?? "the boat" };
  if (a.nestId) return { ref: { kind: "nest", id: a.nestId }, name: a.nestName ?? "the nest" };
  const t = a.targets?.[Math.min(a.leg ?? 0, (a.targets?.length ?? 1) - 1)];
  if (!t) return null;
  const at = targetPos(t);
  if (t.kind === "point" && a.spot && siteById(a.id)) return { ref: { kind: "site", id: String(a.id) }, name: `${a.spot.name} · ${a.good ? goodName(a.good) : "ore"} rock`, at };
  if (t.kind === "body") return { ref: { kind: "body", id: t.id }, name: t.name ?? "target", at };
  if (t.kind === "beacon") return { ref: { kind: "beacon", id: t.id }, name: t.name ?? "target", at };
  if (t.kind === "station") return { ref: { kind: "station", id: t.id, off: t.off ? { ...t.off } : null }, name: t.name ?? "target", at };
  return null;
}

let spotSeq = 0;
function jobSpot(st, rnd, opts = {}) {
  const spot = pickSpot(`${sim.skySeed ?? "sky"}:${st.id}:${Math.floor(rnd() * 1e9)}:${spotSeq++}`, currentSystem, st, opts);
  return spot;
}
const rocksFor = (qty) => Math.max(4, Math.min(16, Math.ceil(qty / 350) + 4));

function withSpot(job, st, rnd, opts = {}) {
  if (!job) return job;
  const spot = jobSpot(st, rnd, opts);
  if (!spot) return job;
  job.spot = spot;
  job.siteCount = rocksFor(job.qty ?? 40);
  job.targets = [{ kind: "point", x: spot.x, y: spot.y, z: spot.z, name: spot.name, dwell: 0 }];
  job.text = `${job.text} Survey puts it in ${spotLine(spot, st)}.`;
  return job;
}

function unitBasis(st, id) {
  const top = Math.max(bidPrice(st, id), baseValue(id));
  if (good(id)?.tier === "ore") return { unit: top, k: (t) => 0.7 + 0.3 * t.pay };
  const src = cheapestSource(id, st.id);
  return { unit: src ? Math.min(top, src.p * 1.08) : top, k: (t) => 0.6 * t.pay };
}
const deliverJob = (st, id, qty, prem, fee, t, title, text) => {
  const { unit, k } = unitBasis(st, id);
  return { mech: "deliver", good: id, qty, pay: Math.round(qty * unit * (1 + prem * k(t)) + fee * t.pay), title, text };
};

function cheapestSource(id, except) {
  let best = null;
  for (const o of stations) {
    if (o.id === except || (o.hostile && !o.claimed) || stockOf(o, id) < 5) continue;
    const p = askPrice(o, id);
    if (!best || p < best.p) best = { st: o, p };
  }
  return best;
}
function bestBuyer(id, except) {
  let best = null;
  for (const o of stations) {
    if (o.id === except || (o.hostile && !o.claimed)) continue;
    const p = sellPriceAt(o, id);
    if (!best || p > best.p) best = { st: o, p };
  }
  return best;
}
const honestOthers = (st) => stations.filter((s) => s.id !== st.id && !(s.hostile && !s.claimed));

const KINDS = {
  mine(st, rnd, t, fit) {
    const wants = Object.keys(SECTORS[st.sector]?.buys ?? {}).filter((id) => ORES.some((o) => o.id === id));
    const ore = ORES.find((o) => o.id === pickOf(rnd, wants.length ? wants : ORES.slice(0, 8).map((o) => o.id))) ?? ORES[0];
    const qty = qtyFor(fit, 0.3 + rnd() * 0.4 * t.pay, 10, ore.id, t);
    return withSpot(deliverJob(st, ore.id, qty, 0.35, 250, t, `Cut ${qty} ${ore.name}`, `The works want ${qty} ${ore.name} off the belt. Paid on delivery, over the bid.`), st, rnd);
  },
  ice(st, rnd, t, fit) {
    const id = pickOf(rnd, ["water_ice", "water_ice", "methane_ice", "ammonia_ice", "nitrogen_ice"]);
    const qty = qtyFor(fit, 0.25 + rnd() * 0.35, 10, id, t);
    return withSpot(deliverJob(st, id, qty, 0.4, 300, t, `Ice run: ${qty} ${goodName(id)}`, `${st.name}'s tanks run on ice. Bring ${qty} ${goodName(id)}.`), st, rnd, { outer: true, spread: 1.4 });
  },
  vein(st, rnd, t, fit) {
    const id = pickOf(rnd, ["pentlandite", "monazite", "platinum_ore", "iridium_ore", "uraninite", "ilmenite"]);
    const qty = qtyFor(fit, 0.05 + rnd() * 0.1, 3, id, t);
    return withSpot(deliverJob(st, id, qty, 0.5, 600, t, `Vein strike: ${qty} ${goodName(id)}`, `A buyer on ${st.name} wants rare ore — ${qty} ${goodName(id)} from a rich seam.`), st, rnd, { r: 1800 });
  },
  haul(st, rnd, t, fit) {
    const dest = pickOf(rnd, honestOthers(st));
    const lines = (st.stock ?? []).filter((l) => l.qty > 10);
    const line = pickOf(rnd, lines);
    if (!dest || !line) return null;
    const qty = Math.round(Math.min(line.qty, qtyFor(fit, 0.25 + rnd() * 0.35 * t.pay, 8, line.id, t)));
    return { mech: "haul", good: line.id, qty, destId: dest.id, destName: dest.name, pay: Math.round(qty * baseValue(line.id) * 0.2 * t.pay + 450 * t.pay), title: `Haul ${qty} ${goodName(line.id)} to ${dest.name}`, text: `Consignment: ${qty} ${goodName(line.id)} loaded here, delivered to ${dest.name}. Load on accept.` };
  },
  supply(st, rnd, t, fit) {
    const short = shortagesOf(st);
    const pick = short.length ? pickOf(rnd, short) : null;
    const id = pick?.id ?? "water";
    const qty = qtyFor(fit, 0.2 + rnd() * 0.3 * t.pay, 8, id, t);
    return deliverJob(st, id, qty, 0.3, 200, t, `Supply ${qty} ${goodName(id)}`, `${st.name} is short of ${goodName(id)}. Bring ${qty} and the desk pays on top of the bid.`);
  },
  courier(st, rnd, t, fit) {
    const dest = pickOf(rnd, honestOthers(st));
    const id = pickOf(rnd, ["chip", "sensor", "medkit", "controller", "optic"]);
    if (!dest || stockOf(st, id) < 2) return null;
    const qty = Math.min(Math.round(stockOf(st, id)), 2 + Math.floor(rnd() * 5));
    return { mech: "haul", good: id, qty, destId: dest.id, destName: dest.name, deadline: 0.6, pay: Math.round(qty * baseValue(id) * 0.15 * t.pay + 450 * t.pay), title: `Courier: ${qty} ${goodName(id)} to ${dest.name}`, text: `Bonded parcel — ${qty} ${goodName(id)} for ${dest.name}, on a short clock. Small, light, and worth more than the hull if it goes missing.` };
  },
  procure(st, rnd, t, fit) {
    const wants = Object.keys(SECTORS[st.sector]?.buys ?? {});
    const id = pickOf(rnd, wants);
    if (!id) return null;
    const src = cheapestSource(id, st.id);
    if (!src) return null;
    const qty = qtyFor(fit, 0.2 + rnd() * 0.3, 5, id, t);
    const pay = Math.round(qty * Math.max(bidPrice(st, id), src.p) * (1 + 0.18 * t.pay) + 300 * t.pay);
    return { mech: "deliver", good: id, qty, sourceId: src.st.id, sourceName: src.st.name, pay, title: `Procure ${qty} ${goodName(id)}`, text: `Buy ${qty} ${goodName(id)} wherever you can — ${src.st.name} asks ${Math.round(src.p)} cr a unit — and deliver here. The desk pays ${Math.round(pay / qty)} a unit.` };
  },
  consign(st, rnd, t, fit) {
    const lines = (st.stock ?? []).filter((l) => l.qty > 10);
    if (!lines.length) return null;
    let best = null;
    for (const l of lines) { const b = bestBuyer(l.id, st.id); if (b && (!best || b.p / Math.max(1, askPrice(st, l.id)) > best.gain)) best = { l, b, gain: b.p / Math.max(1, askPrice(st, l.id)) }; }
    if (!best || best.gain < 1.02) return null;
    const qty = Math.round(Math.min(best.l.qty, qtyFor(fit, 0.3 + rnd() * 0.3, 8, best.l.id, t)));
    return { mech: "haul", good: best.l.id, qty, destId: best.b.st.id, destName: best.b.st.name, pay: Math.round(qty * best.b.p * 0.12 * t.pay + 300 * t.pay), title: `Consignment sale: ${goodName(best.l.id)} to ${best.b.st.name}`, text: `Take ${qty} ${goodName(best.l.id)} on consignment to ${best.b.st.name}, where it fetches ${Math.round(best.b.p)} a unit. Your commission is a cut of the sale.` };
  },
  resupply(st, rnd, t, fit) {
    const dest = pickOf(rnd, honestOthers(st));
    if (!dest) return null;
    const sells = Object.keys(SECTORS[dest.sector]?.sells ?? {});
    const id = pickOf(rnd, sells);
    if (!id) return null;
    const qty = qtyFor(fit, 0.25 + rnd() * 0.3, 6, id, t);
    return { mech: "deliver", good: id, qty, sourceId: dest.id, sourceName: dest.name, pay: Math.round(qty * askPrice(dest, id) * (1 + 0.14 * t.pay) + 250 * t.pay), title: `Restock ${qty} ${goodName(id)}`, text: `${dest.name} makes ${goodName(id)} cheap. Buy ${qty} there and bring them here — the shop pays over the ask.` };
  },
  tender(st, rnd, t, fit) {
    const w = pickOf(rnd, wantsOf(st, 5));
    if (!w) return null;
    const src = cheapestSource(w.id, st.id);
    const qty = qtyFor(fit, 0.2 + rnd() * 0.3, 5, w.id, t);
    const job = deliverJob(st, w.id, qty, 0.35, 350, t, `Tender: ${qty} ${goodName(w.id)}`, `${st.name}'s buyers are tendering for ${qty} ${goodName(w.id)} at a fixed price over the bid.${src ? ` ${src.st.name} sells it at ${Math.round(src.p)} a unit.` : ""}`);
    if (src) { job.sourceId = src.st.id; job.sourceName = src.st.name; }
    return job;
  },
  bounty(st, rnd, t) {
    const pirates = traffic.filter((n) => HOSTILE_ROLES.has(n.role) && n.job !== "down");
    const mark = pickOf(rnd, pirates);
    if (!mark) return null;
    return { mech: "kill", armed: true, markId: mark.id, markName: mark.name, pay: Math.round((900 + rnd() * 900) * t.pay), title: `Bounty — ${mark.name}`, text: `Wanted off the lanes: ${mark.name} (${mark.captain}). Paid on the kill.` };
  },
  escort(st, rnd, t) {
    const boat = pickOf(rnd, flow.filter((n) => n.port === st.id));
    if (!boat) return null;
    return { mech: "escort", armed: true, boatId: boat.id, boatName: boat.name, need: 120, pay: Math.round((500 + rnd() * 600) * t.pay), title: `Escort ${boat.name}`, text: `Ride within 900 u of ${boat.name} while it runs the lanes — two minutes on station and the desk pays.` };
  },
  patrol(st, rnd, t) {
    const n = 2 + (rnd() < 0.5 ? 1 : 0);
    const targets = [];
    for (let i = 0; i < n; i++) {
      const a = rnd() * Math.PI * 2, r = 6000 + rnd() * 14000;
      targets.push({ kind: "station", id: st.id, off: { x: Math.cos(a) * r, y: (rnd() - 0.5) * 1500, z: Math.sin(a) * r }, name: `picket ${i + 1}`, dwell: 15 });
    }
    return { mech: "visit", armed: true, targets, pay: Math.round((700 + n * 250 + rnd() * 400) * t.pay), title: `Picket sweep off ${st.name}`, text: `Fly ${n} picket points around ${st.name}'s approaches and hold each for fifteen seconds. Anything hostile you meet is yours to deal with.` };
  },
  rogues(st, rnd, t) {
    const live = nests.filter((x) => x.hp > 0);
    if (!live.length) return null;
    const nest = pickOf(rnd, live);
    const n = 2 + Math.floor(rnd() * 3 * t.pay);
    return { mech: "kill", armed: true, killKind: "rogue", count: n, nestId: nest.id, nestName: nest.name, pay: Math.round((450 * n + rnd() * 400) * t.pay), title: `Drone cull — ${n} out of ${nest.name}`, text: `Rogue drones out of ${nest.name} are working the lanes. Put ${n} of them down, anywhere.` };
  },
  salvage(st, rnd, t, fit) {
    const qty = sized(fit, 0.08 + rnd() * 0.12 * t.pay, 6, "iron_ore");
    return { mech: "deliver", good: "iron_ore", qty, salvage: true, pay: Math.round(qty * 18 * t.pay + 300 * t.pay), title: `Salvage ${qty} plate`, text: `The yard buys wreck plate: ${qty} units of debris iron, tractored off whatever died out there.` };
  },
  wreck(st, rnd, t, fit) {
    const spot = jobSpot(st, rnd, { spread: 1.5, r: 1200 });
    if (!spot) return null;
    const qty = sized(fit, 0.05 + rnd() * 0.08, 4, "iron_ore");
    return { mech: "visit", targets: [{ kind: "point", x: spot.x, y: spot.y, z: spot.z, name: `the wreck in ${spot.name}`, dwell: 20 }], good: "iron_ore", qty, salvage: true, pay: Math.round((600 + qty * 20) * t.pay), title: `Recover a wreck in ${spot.name}`, text: `A hull went down in ${spotLine(spot, st)}. Fly the site, hold twenty seconds for the insurers' scan, and bring back ${qty} plate.` };
  },
  pod(st, rnd, t, fit) {
    const spot = jobSpot(st, rnd, { spread: 1.6, r: 900 });
    if (!spot) return null;
    const id = pickOf(rnd, ["steel_plate", "wiring", "motor", "ration", "medkit", "battery", "polymer", "glass"]);
    const qty = Math.max(2, qtyFor(fit, 0.04 + rnd() * 0.08, 2, id, t));
    return { mech: "visit", targets: [{ kind: "point", x: spot.x, y: spot.y, z: spot.z, name: `the pod in ${spot.name}`, dwell: 12 }], grant: { good: id, qty }, good: id, qty, pay: Math.round((400 + qty * baseValue(id) * 0.15) * t.pay), title: `Recover a cargo pod — ${goodName(id)} in ${spot.name}`, text: `A hauler lost a pod of ${qty} ${goodName(id)} in ${spotLine(spot, st)}. Fly to it, hold twelve seconds for the tractor, and bring it here. The owner pays the finder.` };
  },
  materials(st, rnd, t, fit) {
    const pool = ["steel", "stainless", "ceramic", "glass", "polymer", "bronze", "superalloy", "aluminium", "copper", "titanium"];
    const short = shortagesOf(st).map((x) => x.id).filter((id) => pool.includes(id));
    const id = pickOf(rnd, short.length ? short : pool);
    const qty = qtyFor(fit, 0.15 + rnd() * 0.25, 5, id, t);
    return deliverJob(st, id, qty, 0.3, 350, t, `Materials: ${qty} ${goodName(id)}`, `The fabricators on ${st.name} need ${qty} ${goodName(id)} for the next line run. Refine it or buy it; just bring it.`);
  },
  build(st, rnd, t, fit) {
    const dest = pickOf(rnd, honestOthers(st));
    const id = pickOf(rnd, ["girder", "steel_plate", "hull_panel"]);
    if (!dest) return null;
    const have = stockOf(st, id);
    const qty = Math.round(Math.max(3, Math.min(have > 3 ? have : 99, sized(fit, 0.1 + rnd() * 0.15, 3) / 6)));
    if (have >= qty) return { mech: "haul", good: id, qty, destId: dest.id, destName: dest.name, pay: Math.round(qty * baseValue(id) * 0.15 * t.pay + 450 * t.pay), title: `Construction lift: ${qty} ${goodName(id)} to ${dest.name}`, text: `${dest.name} is building out a ring. Lift ${qty} ${goodName(id)} from here to the site crews.` };
    return deliverJob(st, id, qty, 0.25, 450, t, `Construction: ${qty} ${goodName(id)}`, `A ring extension on ${st.name} is waiting on ${qty} ${goodName(id)}.`);
  },
  parts(st, rnd, t, fit) {
    const id = pickOf(rnd, ["motor", "pump", "bearing", "wiring", "radiator", "heat_ex", "actuator"]);
    const qty = Math.max(2, qtyFor(fit, 0.04 + rnd() * 0.06, 2, id, t));
    return deliverJob(st, id, qty, 0.25, 400, t, `Yard parts: ${qty} ${goodName(id)}`, `The yard's refit bay is short ${qty} ${goodName(id)}. Fabricate or buy — the yard pays over book.`);
  },
  fuel(st, rnd, t, fit) {
    const id = pickOf(rnd, ["deuterium_r", "hydrogen_r", "helium3_r", "water", "methane"]);
    const qty = qtyFor(fit, id === "helium3_r" || id === "deuterium_r" ? 0.05 + rnd() * 0.08 : 0.2 + rnd() * 0.3, 3, id, t);
    return deliverJob(st, id, qty, 0.3, 300, t, `Fuel: ${qty} ${goodName(id)}`, `${st.name}'s bunkers are drawing down. ${qty} ${goodName(id)} to the fuel desk.`);
  },
  reactor(st, rnd, t, fit) {
    const id = pickOf(rnd, ["uraninite", "uranium", "reactor_rod", "capacitor", "battery"]);
    const qty = Math.max(1, qtyFor(fit, 0.02 + rnd() * 0.05, 1, id, t));
    return deliverJob(st, id, qty, 0.3, 500, t, `Reactor service: ${qty} ${goodName(id)}`, `The power plant on ${st.name} is scheduling an overhaul and needs ${qty} ${goodName(id)} on the dock.`);
  },
  survey(st, rnd, t) {
    const open = BODIES.filter((b) => b.kind !== "star" && !sim.scanned?.has?.(b.id));
    const b = pickOf(rnd, open);
    if (!b) return null;
    return { mech: "survey", bodyId: b.id, bodyName: b.name, targets: [{ kind: "body", id: b.id, name: b.name }], pay: Math.round((700 + rnd() * 700) * t.pay), title: `Survey ${b.name}`, text: `The survey office wants ${b.name} on the register. Close to survey range and scan it (SCAN), then report back here.` };
  },
  assay(st, rnd, t) {
    const id = pickOf(rnd, ["cassiterite", "chromite", "ilmenite", "pentlandite", "galena", "sphalerite", "monazite"]);
    const qty = 3 + Math.floor(rnd() * 8);
    return withSpot(deliverJob(st, id, qty, 1.0, 450, t, `Assay samples: ${qty} ${goodName(id)}`, `The lab on ${st.name} is characterising ${goodName(id)} from one drift in particular. ${qty} units is plenty.`), st, rnd, { r: 1500 });
  },
  chart(st, rnd, t) {
    const b = pickOf(rnd, BEACONS);
    if (!b) return null;
    return { mech: "visit", targets: [{ kind: "beacon", id: b.id, name: b.name, dwell: 20 }], pay: Math.round((600 + rnd() * 900) * t.pay), title: `Chart the lane to ${b.name}`, text: `Fly out to ${b.name}, hold twenty seconds while the nav plot records the lane, and bring the chart home.` };
  },
  medical(st, rnd, t, fit) {
    const id = pickOf(rnd, ["medkit", "medkit", "organics", "life_scrub"]);
    const qty = Math.max(3, qtyFor(fit, id === "medkit" ? 0.04 + rnd() * 0.06 : 0.1 + rnd() * 0.15, 3, id, t));
    return deliverJob(st, id, qty, 0.35, 400, t, `Clinic supply: ${qty} ${goodName(id)}`, `The clinic on ${st.name} is running short. ${qty} ${goodName(id)}, no questions about where from.`);
  },
  food(st, rnd, t, fit) {
    const src = stations.find((s) => s.sector === "agricultural" && s.id !== st.id);
    const id = pickOf(rnd, ["ration", "organics", "fertiliser"]);
    const qty = qtyFor(fit, 0.2 + rnd() * 0.3, 6, id, t);
    const job = deliverJob(st, id, qty, 0.3, 250, t, `Galley stores: ${qty} ${goodName(id)}`, `The galleys on ${st.name} need ${qty} ${goodName(id)}.${src ? ` ${src.name} grows it.` : ""}`);
    if (src) { job.sourceId = src.id; job.sourceName = src.name; }
    return job;
  },
  relay(st, rnd, t) {
    const b = pickOf(rnd, BEACONS);
    if (!b) return null;
    return { mech: "visit", targets: [{ kind: "beacon", id: b.id, name: b.name, dwell: 30 }], pay: Math.round((500 + rnd() * 700) * t.pay), title: `Relay service at ${b.name}`, text: `The comms office needs ${b.name}'s relay re-keyed: hold within range for thirty seconds while it takes the new cipher.` };
  },
  fieldtrip(st, rnd, t) {
    const near = BODIES.filter((b) => b.kind !== "star").map((b) => { bodyPosition(b.id, sim.time, _p); return { b, d: Math.hypot(_p.x - st.x, _p.y - st.y, _p.z - st.z) }; }).sort((a, b) => a.d - b.d).slice(0, 4);
    const pick = pickOf(rnd, near);
    if (!pick) return null;
    return { mech: "visit", targets: [{ kind: "body", id: pick.b.id, off: { x: 0, y: 0, z: 0 }, name: pick.b.name, dwell: 15, near: 0.0 }], pay: Math.round((450 + rnd() * 500) * t.pay), title: `Field trip to ${pick.b.name}`, text: `The school on ${st.name} is sending a class to see ${pick.b.name} up close. Fly them out and hold a quarter minute in survey range.` };
  },
};

const goodValue = (st, id) => Math.max(bidPrice(st, id), baseValue(id));

function chainOffer(st, rnd, now, fit, spec) {
  const { chain, stage, idx, last, of } = spec;
  const tier = TIERS[Math.min(TIERS.length - 1, idx >= of - 1 ? 2 : idx >= Math.floor(of / 2) ? 1 : 0)];
  const job = KINDS[stage.kind]?.(st, rnd, tier, fit);
  if (!job) return null;
  if (stage.qtyK && job.qty) {
    const ceiling = job.mech === "deliver" || job.mech === "haul" ? Math.max(4, Math.floor(fit.capFor(stage.good ?? job.good) * 0.92)) : Infinity;
    const q = Math.max(1, Math.min(ceiling, Math.round(job.qty * stage.qtyK)));
    job.pay = Math.round(job.pay * (q / job.qty));
    job.qty = q;
    if (job.siteCount) job.siteCount = rocksFor(q);
    if (job.grant) job.grant.qty = q;
  }
  if (stage.good && job.good && stage.good !== job.good) {
    const k = goodValue(st, stage.good) / Math.max(1, goodValue(st, job.good));
    job.pay = Math.round(job.pay * Math.max(0.4, Math.min(3.5, k)));
    job.good = stage.good;
    if (job.grant) job.grant.good = stage.good;
    if (job.mech === "haul") job.chainStock = true;
  }
  if (stage.payK) job.pay = Math.round(job.pay * stage.payK);
  job.pay = Math.max(300, Math.round(job.pay * BOARD.pay));
  job.title = stage.title;
  job.text = `${stage.text}${job.spot ? ` Survey puts it in ${spotLine(job.spot, st)}.` : ""}`;
  if (job.targets?.length === 1 && job.spot) job.targets[0].name = job.spot.name;
  const issuer = corpOfStation(st);
  const id = `ct${contracts.seq++}`;
  return {
    id, type: stage.kind, cat: chain.cat, tier: tier.key, tierName: `Stage ${idx + 1} of ${of}`,
    stationId: st.id, stationName: st.name,
    corpId: issuer?.id ?? null, corpName: issuer?.name ?? "the port", tenant: false,
    posted: now, expires: now + BOARD.expires * 2, standing: -10,
    chain: chain.id, chainIdx: idx, chainName: chain.name, chainBlurb: chain.blurb,
    chainOf: of, chainLast: last, chainBonus: chainBonus(chain),
    ...job,
    deadline: (job.deadline ?? 1) + CHAIN.carry / BOARD.deadline,
  };
}

function makeOffer(st, rnd, now, issuer, cat, fit, tierKey = null) {
  const kinds = CATEGORIES[cat].kinds.slice();
  for (let k = 0; k < kinds.length; k++) {
    const type = kinds.splice(Math.floor(rnd() * kinds.length), 1)[0];
    const tier = tierKey ? TIERS.find((x) => x.key === tierKey) : pickTier(rnd);
    const job = KINDS[type]?.(st, rnd, tier, fit);
    if (!job) continue;
    const id = `ct${contracts.seq++}`;
    job.pay = Math.round((job.pay ?? 0) * BOARD.pay);
    return {
      id, type, cat, tier: tier.key, tierName: tier.name, stationId: st.id, stationName: st.name,
      corpId: issuer?.id ?? null, corpName: issuer?.name ?? "the port", tenant: issuer ? issuer !== corpOfStation(st) : false,
      posted: now, expires: now + BOARD.expires * (0.6 + rnd() * 0.8), standing: tier.standing,
      ...job,
    };
  }
  return null;
}

export function boardFor(st, now = sim.time) {
  const slot = Math.floor(now / BOARD.refresh);
  const fit = hullFit();
  const key = `${st.id}:${slot}:${fit.cap}:${pilotCareer()}:${chainVersion()}`;
  let b = contracts.boards.get(st.id);
  if (!b || b.key !== key) {
    const rnd = rngFromSeed(`${sim.skySeed ?? "sky"}:board:${st.id}:${slot}`);
    const t0 = slot * BOARD.refresh;
    const issuers = issuersAt(st);
    const weights = SECTOR_WEIGHT[st.sector] ?? SECTOR_WEIGHT.civilian;
    const offers = [];
    const sig = (o) => o.chain ? `chain:${o.chain}:${o.chainIdx}` : `${o.type}:${o.good ?? ""}:${o.destId ?? ""}:${o.markId ?? ""}:${o.bodyId ?? ""}:${o.targets?.[0]?.id ?? ""}:${o.nestId ?? ""}:${o.grant?.good ?? ""}|${o.title}`;
    const add = (o) => { if (o && !offers.some((x) => sig(x) === sig(o))) { offers.push(o); return true; } return false; };
    for (const spec of chainOffersAt(st, now)) add(chainOffer(st, rnd, t0, fit, spec));
    for (const cat of CATEGORY_ORDER) {
      if (!(weights[cat] > 0)) continue;
      add(makeOffer(st, rnd, t0, issuers[Math.floor(rnd() * issuers.length)], cat, fit));
    }
    const mine = CATEGORY_ORDER.find((c) => CATEGORIES[c].careers.includes(pilotCareer()));
    if (mine) for (let k = 0, tries = 0; k < 3 && tries < 9; tries++) if (add(makeOffer(st, rnd, t0, issuers[Math.floor(rnd() * issuers.length)], mine, fit, k < 2 ? "low" : null))) k++;
    for (let i = offers.length, guard = 0; i < BOARD.offers && guard < BOARD.offers * 3; guard++) {
      const issuer = rnd() < 0.45 ? issuers[0] : issuers[1 + Math.floor(rnd() * Math.max(1, issuers.length - 1))] ?? issuers[0];
      const lean = CHARTER_LEAN[charterOf(issuer)] ?? {};
      const table = Object.fromEntries(CATEGORY_ORDER.map((c) => [c, (weights[c] ?? 0) + (weights[c] > 0 ? lean[c] ?? 0 : 0)]));
      if (add(makeOffer(st, rnd, t0, issuer, weighted(rnd, table), fit))) i++;
    }
    b = { key, offers };
    contracts.boards.set(st.id, b);
  }
  return b.offers.filter((o) => o.expires > now && !contracts.active.some((a) => a.id === o.id) && !o.taken);
}

export function boardByCategory(st, now = sim.time) {
  const list = boardFor(st, now);
  const out = [];
  for (const cat of CATEGORY_ORDER) {
    const mine = list.filter((o) => o.cat === cat);
    if (!mine.length) continue;
    const by = new Map();
    for (const o of mine) {
      const k = o.corpId ?? "port";
      if (!by.has(k)) by.set(k, { corpId: o.corpId, corpName: o.corpName, tenant: o.tenant, offers: [] });
      by.get(k).offers.push(o);
    }
    for (const g of by.values()) g.offers.sort((a, b) => (acceptBlocker(a) ? 1 : 0) - (acceptBlocker(b) ? 1 : 0) || b.pay - a.pay);
    out.push({ cat, name: CATEGORIES[cat].name, careers: CATEGORIES[cat].careers, offers: mine.length, best: Math.max(...mine.map((o) => o.pay)), open: mine.filter((o) => !acceptBlocker(o)).length, issuers: [...by.values()].sort((a, b) => (a.tenant ? 1 : 0) - (b.tenant ? 1 : 0)) });
  }
  return out;
}

export function acceptBlocker(c) {
  if (contracts.active.length >= BOARD.maxActive) return `You hold ${BOARD.maxActive} contracts already`;
  const co = c.corpId ? corps.find((x) => x.id === c.corpId) : null;
  if (co && co.standing < c.standing) return `${co.name} wants standing ${c.standing} for ${c.tierName} work — you have ${Math.round(co.standing)} (${standingLabel(co.standing)})`;
  const fit = hullFit();
  if (c.armed && !fit.armed) return `Needs an armed hull — ${fit.hull} carries no guns`;
  if (c.qty && c.good && (c.mech === "deliver" || c.mech === "haul") && c.qty > fit.cap) return `Needs ${c.qty} units of hold — ${fit.hull} carries ${fit.cap}`;
  if (c.mech === "haul") {
    const st = stationById(c.stationId);
    if (sim.ship.dockedAt !== c.stationId) return `Load at ${c.stationName}`;
    if (!c.chainStock && stockOf(st, c.good) < c.qty) return `${c.stationName} no longer holds ${c.qty} ${goodName(c.good)}`;
    const room = roomFor(sim.ship, c.good);
    if (room < c.qty) return `Hold needs room for ${c.qty} ${goodName(c.good)} (${Math.floor(room)} fit)`;
  }
  if (c.mech === "survey" && sim.scanned?.has?.(c.bodyId)) return `${c.bodyName} is already on the register`;
  return null;
}

export function acceptContract(c) {
  const why = acceptBlocker(c);
  if (why) return why;
  const a = { ...c, accepted: sim.time, deadline: sim.time + BOARD.deadline * (c.deadline ?? 1), progress: 0, leg: 0, dwell: 0, kills: 0 };
  if (c.mech === "haul") {
    const st = stationById(c.stationId);
    if (c.chainStock && stockOf(st, c.good) < c.qty) deliver(st, c.good, c.qty - stockOf(st, c.good));
    const got = lift(st, c.good, c.qty);
    bookHandling(st.id, "buy", c.good, got, sim.ship.mods);
    sim.ship.hold[c.good] = (sim.ship.hold[c.good] ?? 0) + got;
    a.qty = got;
    a.consigned = got;
  }
  c.taken = true;
  contracts.active.push(a);
  if (a.chain) noteChainAccept(a);
  if (a.spot && a.good) {
    openSite({ id: a.id, ore: a.good, count: a.siteCount ?? 8, x: a.spot.x, y: a.spot.y, z: a.spot.z, r: a.spot.r, name: a.spot.name, title: a.title, at: sim.time, rich: a.type === "vein" });
    sim.autoPlan.seam = { x: a.spot.x, y: a.spot.y, z: a.spot.z, name: a.spot.name, site: String(a.id) };
    sim.autoPlan.seamOre = a.good;
  }
  if (a.targets?.length || a.markId || a.boatId || a.nestId) markTarget(a);
  const mins = Math.round((a.deadline - sim.time) / 60);
  logEvent(`Accepted: ${c.title} for ${c.corpName} — ${c.pay} cr, ${mins} min`, "contract");
  sim.notice = `${a.chain ? `${a.chainName} · ${a.tierName} — ` : ""}${c.title} — ${c.pay} cr on completion. ${mins} minutes.${a.targets?.length || a.markId || a.boatId || a.nestId ? " Waypoint set." : ""}`;
  return null;
}

function settle(a, ok, why) {
  contracts.active.splice(contracts.active.indexOf(a), 1);
  if (a.spot) closeSite(a.id);
  for (const w of sim.waypoints.filter((x) => x.job === a.id)) removeWaypoint(w.id);
  if (sim.autoPlan.seamOre === a.good && !contracts.active.some((x) => x.spot && x.good === a.good)) sim.autoPlan.seamOre = null;
  const sp = a.spot, sm = sim.autoPlan.seam;
  if (sp && sm && sm.x === sp.x && sm.y === sp.y && sm.z === sp.z && !contracts.active.some((x) => x.spot && x.spot.x === sp.x && x.spot.z === sp.z)) sim.autoPlan.seam = null;
  const co = a.corpId ? corps.find((x) => x.id === a.corpId) : null;
  if (ok) {
    sim.ship.credits += a.pay;
    contracts.done++;
    if (co) {
      adjustStanding(co.id, 4 + (a.tier === "high" ? 6 : a.tier === "mid" ? 3 : 0), `completed ${a.title}`);
      for (const o of corps) {
        if (o === co) continue;
        const r = corpRelation(o, co);
        if (r >= 0.5) adjustStanding(o.id, 1.5, `work for their ally ${co.name}`);
        else if (r <= -0.5) adjustStanding(o.id, -2.5, `work for their enemy ${co.name}`);
      }
    }
    const cat = a.cat ?? categoryOf(a.type);
    bookRevenue(a.type === "bounty" || a.type === "rogues" ? "bounty" : cat === "mining" ? "ore" : cat === "salvage" ? "salvage" : a.mech === "haul" ? "haul" : "trade", a.pay, `${a.title} for ${a.corpName}`);
    work(CATEGORIES[cat]?.skill ?? "commerce", 3);
    logEvent(`Completed: ${a.title} — ${a.pay} cr from ${a.corpName}`, "contract");
    sim.notice = `${a.corpName} pays ${a.pay} cr — ${a.title} done.`;
    sim.toast = `Contract complete · ${a.pay} cr`;
    sim.lastToastAt = sim.time;
    const ch = a.chain ? noteChainDone(a) : null;
    if (ch?.last) {
      sim.ship.credits += ch.bonus;
      if (co && ch.standing) adjustStanding(co.id, ch.standing, `saw ${ch.chain.name} through`);
      bookRevenue("trade", ch.bonus, `${ch.chain.name} — completion bonus`);
      logEvent(`${ch.chain.name} complete — ${ch.bonus} cr bonus from ${a.corpName}`, "contract");
      sim.notice = `${ch.chain.name} — all ${a.chainOf} stages done. ${a.corpName} pays ${(a.pay + ch.bonus).toLocaleString("en-US")} cr and remembers it.`;
      sim.toast = `${ch.chain.name} complete · +${ch.bonus} cr`;
    } else if (ch) {
      contracts.boards.delete(ch.nextStationId);
      sim.notice = `${a.pay} cr. Next: "${ch.nextTitle}" — on the board at ${ch.nextName}.`;
      sim.toast = `${ch.chain.name} · stage ${ch.idx + 1}/${a.chainOf} done`;
    }
  } else {
    contracts.failed++;
    if (a.chain) { const c2 = noteChainFail(a); if (c2) logEvent(`${c2.name} broken off at stage ${(a.chainIdx ?? 0) + 1} — the desk closes the file`, "contract"); }
    if (co) adjustStanding(co.id, why === "abandoned" ? BOARD.abandonStanding : BOARD.lateStanding, `${why} ${a.title}`);
    logEvent(`${why[0].toUpperCase()}${why.slice(1)}: ${a.title} — ${a.corpName} remembers`, "contract");
    sim.notice = `${a.title} ${why}. ${a.corpName} will remember.`;
  }
}

export function abandonContract(id) {
  const a = contracts.active.find((x) => x.id === id);
  if (!a) return;
  if (a.mech === "haul" && a.consigned) takeCargo(sim.ship, a.good, a.consigned);
  settle(a, false, "abandoned");
}

const cargoOk = (a) => !a.good || !a.qty || (sim.ship.hold[a.good] ?? 0) >= a.qty;

export function deliverableAt(stId = sim.ship.dockedAt) {
  if (!stId) return [];
  return contracts.active.filter((a) => {
    const mech = a.mech ?? (a.type === "haul" ? "haul" : a.type === "bounty" ? "kill" : a.type === "escort" ? "escort" : "deliver");
    if (mech === "deliver") return a.stationId === stId && cargoOk(a);
    if (mech === "haul") return a.destId === stId && cargoOk(a);
    if (mech === "visit") return a.stationId === stId && a.progress >= 1 && cargoOk(a);
    return a.stationId === stId && a.progress >= 1;
  });
}

export function owedCargo() {
  const out = {};
  for (const a of contracts.active) {
    const mech = a.mech ?? "deliver";
    if (mech !== "deliver" || !a.good || !(a.qty > 0)) continue;
    out[a.good] = (out[a.good] ?? 0) + a.qty;
  }
  return out;
}

export function jobForSite(siteId) {
  if (siteId == null) return null;
  const a = contracts.active.find((x) => String(x.id) === String(siteId));
  return a && (a.mech ?? "deliver") === "deliver" && a.good && a.qty > 0 && a.stationId ? a : null;
}

export function deliverContracts(stId = sim.ship.dockedAt) {
  let paid = 0;
  for (const a of deliverableAt(stId)) {
    if (a.good && a.qty) {
      if ((sim.ship.hold[a.good] ?? 0) < a.qty) continue;
      const got = takeCargo(sim.ship, a.good, a.qty);
      const st = stationById(stId);
      if (st?.stock) deliver(st, a.good, got);
      bookHandling(stId, "deliver", a.good, got, sim.ship.mods);

    }
    paid += a.pay;
    settle(a, true);
  }
  return paid;
}

export function noteKill(vesselId) {
  for (const a of contracts.active) if (a.type === "bounty" && a.markId === vesselId) { a.progress = 1; sim.notice = `${a.markName} is down — the bounty pays at ${a.stationName}.`; }
}

export function noteDestroyed(n) {
  if (!n) return;
  for (const a of contracts.active) {
    if (a.killKind === "rogue" && n.rogue && a.progress < 1) {
      a.kills = (a.kills ?? 0) + 1;
      a.progress = Math.min(1, a.kills / a.count);
      if (a.progress >= 1) sim.notice = `${a.count} drones down — the cull pays at ${a.stationName}.`;
    }
  }
}

const _d = (a, b) => Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z);
const _t = {};

export function visitRadius(t) {
  if (t?.r) return t.r;
  if (t?.kind === "body") { const b = BODIES.find((x) => x.id === t.id); if (b) return Math.max(BOARD.visitR, scanRadius(b) * 0.9); }
  return BOARD.visitR;
}

export function tickContracts(dt) {
  for (const a of [...contracts.active]) {
    if (a.type === "escort") {
      const boat = flow.find((n) => n.id === a.boatId);
      if (boat?.visible && _d(boat, sim.ship.pos) < 900) { a.onStation = (a.onStation ?? 0) + dt; a.progress = Math.min(1, a.onStation / a.need); }
    }
    if (a.salvage && a.mech === "deliver" && a.progress < 1) {
      a.progress = Math.min(1, (sim.ship.hold[a.good] ?? 0) / a.qty);
    }
    if (a.mech === "survey" && a.progress < 1 && sim.scanned?.has?.(a.bodyId)) {
      a.progress = 1;
      sim.notice = `${a.bodyName} is on the register — report to ${a.stationName}.`;
    }
    if (a.mech === "visit" && a.progress < 1) {
      const T = a.targets[a.leg ?? 0];
      const p = T && targetPos(T, sim.time, _t);
      if (p && _d(p, sim.ship.pos) < visitRadius(T)) {
        a.dwell = (a.dwell ?? 0) + dt;
        if (a.dwell >= (T.dwell ?? 10)) {
          if (a.grant && !a.granted) { const got = addCargo(sim.ship, a.grant.good, a.grant.qty); a.granted = got; }
          a.leg = (a.leg ?? 0) + 1;
          a.dwell = 0;
          a.progress = a.leg / a.targets.length;
          if (a.leg < a.targets.length) { markTarget(a); sim.notice = `${T.name ?? "Point"} done — next: ${a.targets[a.leg].name ?? "the next point"}.`; }
          else sim.notice = `${a.title}: done out here — report to ${a.stationName}.`;
        }
      } else if (a.dwell) a.dwell = Math.max(0, a.dwell - dt * 0.5);
    }
    if (sim.time > a.deadline) { if (a.mech === "haul" && a.consigned) takeCargo(sim.ship, a.good, a.consigned); settle(a, false, "expired"); }
  }
}

export function timeLeft(a) { return Math.max(0, a.deadline - sim.time); }

export function jobStatus(a) {
  const mech = a.mech ?? "deliver";
  if (mech === "visit") return a.progress >= 1 ? `report to ${a.stationName}` : `${a.targets[a.leg]?.name ?? "target"} (${(a.leg ?? 0) + 1}/${a.targets.length})${a.dwell ? ` · holding ${Math.round(a.dwell)}s/${a.targets[a.leg]?.dwell ?? 10}s` : ""}`;
  if (mech === "survey") return a.progress >= 1 ? `report to ${a.stationName}` : `scan ${a.bodyName}`;
  if (mech === "kill") return a.progress >= 1 ? `pays at ${a.stationName}` : a.killKind === "rogue" ? `${a.kills ?? 0}/${a.count} drones` : `hunt ${a.markName}`;
  if (mech === "escort") return `${Math.round((a.progress ?? 0) * 100)}% on station · pays at ${a.stationName}`;
  const have = Math.min(a.qty, Math.round(sim.ship.hold[a.good] ?? 0));
  const where = mech === "haul" ? a.destName : a.stationName;
  const site = a.spot && siteById(a.id);
  return `${have}/${a.qty} ${goodName(a.good)} · ${have < a.qty && site ? `cut it in ${a.spot.name}` : `deliver at ${where}`}${a.sourceName && have < a.qty ? ` · sold at ${a.sourceName}` : ""}`;
}

export function resetContracts() {
  contracts.boards.clear();
  resetChains();
  for (const a of contracts.active) if (a.spot) closeSite(a.id);
  contracts.active.length = 0;
}

export function wireContracts() {
  wireChains();
  if (globalThis.window?.__lg) window.__lg.contracts = { contracts, chainReport, boardFor, boardByCategory, acceptContract, acceptBlocker, abandonContract, deliverableAt, deliverContracts, tickContracts, TIERS, BOARD, CATEGORIES };
}
