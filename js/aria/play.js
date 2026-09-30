import { sim, sellPriceAt, setTurretMode } from "../sim/sim.js";
import { stations, stationById } from "../station/stations.js";
import { holdRoom, batteryCap, roomFor, cargoTotal } from "../flight/ship.js";
import { pilot } from "../flight/pilot.js";
import { goodName } from "../economy/materials.js";
import { boardFor, acceptContract, acceptBlocker, abandonContract, deliverContracts, deliverableAt, contracts, CATEGORIES, CATEGORY_ORDER, categoryOf, hullFit, jobStatus, targetPos, timeLeft, BOARD } from "../economy/contracts.js";
import { bestRoute, sellable, tradeRoutes } from "../economy/traderoutes.js";
import { stockOf, askPrice } from "../economy/economy.js";
import { makeMission, makeStep } from "../mission/script.js";
import { mission, startMission, stopMission } from "../mission/run.js";
import { autopilot } from "../flight/autopilot.js";
import { chainReport } from "../economy/chains.js";
import { VERSION } from "../version.js";
import { PRICE_CEIL, PRICE_FLOOR } from "../economy/economy.js";
import { nests } from "../npc/rogues.js";
import { traffic } from "../npc/traffic.js";
import { sense, senseLine, forgetSenses, unpostedWork } from "./senses.js";
import { planRoute, legSeconds, tripSeconds, aimAt, lockOn, markPlace, routeLine as navLine, NAV } from "./nav.js";
import { handlingLeft, handlingLine } from "../station/dockwork.js";
import { runBusiness, bizReport, bizLine, resetBusiness, biz } from "./company.js";
import { company, hasCompany } from "../corp/company.js";
import { crew } from "../crew/ledger.js";
import { yardRepair, repairsAt, repairQuote, hullMaxOf } from "../flight/repair.js";

export const CAREER_DEPT = Object.fromEntries(
  CATEGORY_ORDER.flatMap((cat) => CATEGORIES[cat].careers.map((c) => [c, cat])),
);

export const PLAY = {
  think: 2.5,
  stuck: 1200,
  replans: 2,
  explore: 0.18,
  deptBias: 2.2,
  minCredits: 800,
  patchAt: 0.55,
  yardCool: 240,
  runAt: 0.3,
  chainBias: 1.35,
};

export const play = {
  on: false,
  name: "ARIA",
  career: "mining",
  dept: "mining",
  started: 0,
  credits0: 0,
  move: null,
  yardAt: -1e9,
  brain: { career: null, moves: {}, runs: 0, sky: null },
  stats: { decisions: 0, jobs: 0, done: 0, failed: 0, earned: 0, spent: 0 },
  log: [],
  think: 0,
};

const now = () => sim.time ?? 0;
let bizSeen = 0;

export const netWorth = () => Math.round((sim.ship.credits ?? 0) + (hasCompany() ? company.treasury : 0));
export const holdUsed = () => {
  const cap = Math.max(1, sim.ship.cargoCap ?? 1);
  return cargoTotal(sim.ship) / cap;
};
const note = (text) => { play.log.push({ t: Math.round(now()), text }); if (play.log.length > 400) play.log.shift(); };

export function scoreOf(key) {
  const m = play.brain.moves[key];
  if (!m || m.secs < 30) return 900;
  return (m.cr / (m.secs / 60)) * (1 - 0.35 * (m.fails / Math.max(1, m.runs)));
}

export function brainNote(key, secs, cr, ok) {
  const m = (play.brain.moves[key] ??= { runs: 0, secs: 0, cr: 0, fails: 0 });
  m.runs++;
  m.secs += Math.max(0, secs);
  m.cr += cr;
  if (!ok) m.fails++;
  play.brain.runs++;
}

export function brainReport() {
  return Object.entries(play.brain.moves)
    .map(([key, m]) => ({ key, ...m, perMin: m.secs > 0 ? m.cr / (m.secs / 60) : 0, score: scoreOf(key) }))
    .sort((a, b) => b.perMin - a.perMin);
}

const honest = (st) => st && !(st.hostile && !st.claimed) && st.sector !== "pirate";
const d3 = (a, b) => Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z);

export function nearestPort(pos = sim.ship.pos, except = null) {
  let best = null;
  for (const st of stations) {
    if (!honest(st) || st.id === except) continue;
    const d = d3(st, pos);
    if (!best || d < best.d) best = { st, d };
  }
  return best?.st ?? null;
}

export function jobSeconds(o, from = sim.ship.pos) {
  const st = stationById(o.stationId);
  let s = NAV.berth;
  const hops = [];
  if (o.spot) hops.push(o.spot, st);
  else if (o.mech === "haul") hops.push(stationById(o.destId));
  else if (o.sourceId) hops.push(stationById(o.sourceId), st);
  else if (o.targets?.length) { for (const t of o.targets) hops.push(targetPos(t, sim.time, {})); hops.push(st); }
  else hops.push(st);
  let p = from;
  for (const h of hops) {
    if (!h) continue;
    const r = planRoute(h, p);
    if (r.blocked) return Infinity;
    s += r.secs;
    p = h;
  }
  s += (o.qty ?? 0) * 0.35;
  if (o.spot) s += (o.qty ?? 0) * 1.2;
  for (const t of o.targets ?? []) s += (t.dwell ?? 0) + 8;
  return s;
}

export function jobsFor(st, dept = play.dept, now2 = now()) {
  const fit = [];
  for (const o of boardFor(st, now2)) {
    if (acceptBlocker(o)) continue;
    if (!canFly(o)) continue;
    const secs = jobSeconds(o);
    if (!Number.isFinite(secs)) continue;
    const mine = (o.cat ?? categoryOf(o.type)) === dept;
    fit.push({ offer: o, mine, secs, perMin: (o.pay * (o.chain ? PLAY.chainBias : 1)) / Math.max(1, secs / 60) * (mine ? 1.4 : 1) });
  }
  return fit.sort((a, b) => b.perMin - a.perMin).map((f) => Object.assign(f.offer, { estSecs: Math.round(f.secs), estPerMin: Math.round(f.perMin) }));
}

export function sourceFor(good, qty, except = null) {
  let best = null;
  for (const st of stations) {
    if (!honest(st) || st.id === except) continue;
    if (stockOf(st, good) < qty) continue;
    const p = askPrice(st, good);
    if (!best || p < best.p) best = { st, p };
  }
  return best?.st ?? null;
}

export function canFly(o) {
  if (o.mech === "escort") return false;
  if (o.mech === "kill") {
    if (!hullFit().armed) return false;
    if (hullFrac() < 0.6) return false;
    if (o.markId && !traffic.some((n) => n.id === o.markId && n.job !== "down")) return false;
    if (!o.markId && !(o.nestId && nests.some((n) => n.id === o.nestId))) return false;
  }
  if (o.mech === "haul" && sim.ship.dockedAt !== o.stationId) return false;
  if ((o.mech === "deliver" || o.mech === "haul") && o.qty > roomFor(sim.ship, o.good) + (sim.ship.hold[o.good] ?? 0)) return false;
  if (o.mech === "deliver" && !o.spot && !o.salvage && o.good) {
    const src = o.sourceId && stockOf(stationById(o.sourceId), o.good) >= o.qty ? stationById(o.sourceId) : sourceFor(o.good, o.qty, o.stationId);
    if (!src) return false;
    if (askPrice(src, o.good) * o.qty > sim.ship.credits - PLAY.minCredits) return false;
    if (askPrice(src, o.good) * o.qty >= o.pay) return false;
  }
  return true;
}

const C = (k, op, v) => ({ k, op, v });

export function jobPlan(a) {
  const home = stationById(a.stationId);
  const steps = [];
  const name = `ARIA · ${a.title}`;
  let at = sim.ship.pos;
  const go = (target, label) => {
    const L = legsTo(target, at, label);
    if (!L) return false;
    steps.push(...L.steps);
    at = L.end;
    return true;
  };
  if (a.mech === "haul") {
    go(a.destId, a.destName);
  } else if (a.mech === "visit") {
    for (const t of a.targets ?? []) {
      const w = t.kind === "body" ? null : targetPos(t, sim.time, {});
      if (w) go({ x: w.x, y: w.y, z: w.z, name: t.name, kind: "point" }, t.name);
      else steps.push(makeStep("GOTO", { kind: "body", id: t.id, name: t.name }));
      steps.push(makeStep("HOLD", null, { until: C("time", ">=", Math.max(8, (t.dwell ?? 10) + 6)) }));
    }
    go(a.stationId, a.stationName);
  } else if (a.mech === "survey") {
    steps.push(makeStep("SURVEY", { kind: "body", id: a.bodyId, name: a.bodyName }));
    at = sim.ship.pos;
    go(a.stationId, a.stationName);
  } else if (a.mech === "kill") {
    const nest = a.nestId ? nests.find((n) => n.id === a.nestId) : null;
    const mark = a.markId ? traffic.find((n) => n.id === a.markId && n.job !== "down") : null;
    if (mark) steps.push(makeStep("GOTO", { kind: "point", x: mark.x, y: mark.y, z: mark.z, name: a.markName ?? "the mark" }));
    else if (nest) {
      const k = 5000 / Math.max(1, Math.hypot(nest.x, nest.z));
      steps.push(makeStep("GOTO", { kind: "point", x: nest.x * (1 + k), y: nest.y + 1200, z: nest.z * (1 + k), name: `off ${nest.name}` }));
    }
    steps.push(makeStep("HOLD", null, { until: C("time", ">=", 150) }));
    at = sim.ship.pos;
    go(a.stationId, a.stationName);
  } else if (a.spot || (a.salvage && a.good)) {
    if (holdUsed() > 0.12) {
      steps.push(makeStep("DOCK", { kind: "best-buyer" }));
      steps.push(makeStep("SELL", null, { args: { what: "all" } }));
    }
    const seam = a.spot ? { kind: "seam", x: a.spot.x, y: a.spot.y, z: a.spot.z, name: a.spot.name } : { kind: "seam" };
    if (a.spot) { const L = legsTo({ x: a.spot.x, y: a.spot.y, z: a.spot.z, name: a.spot.name, kind: "point" }, at, a.spot.name); if (L && L.steps.length > 1) { steps.push(...L.steps.slice(0, -1)); at = L.steps.length > 1 ? L.end : at; } }
    steps.push(makeStep("MINE", seam, { until: { k: "cargoOf", id: a.good, op: ">=", v: a.qty } }));
    at = a.spot ? { x: a.spot.x, y: a.spot.y, z: a.spot.z } : sim.ship.pos;
    go(a.stationId, a.stationName);
  } else if (a.good) {
    const need = Math.max(0, Math.ceil((a.qty ?? 0) - (sim.ship.hold[a.good] ?? 0)));
    if (need > 0) {
      const src = (a.sourceId && stockOf(stationById(a.sourceId), a.good) >= need ? stationById(a.sourceId) : null) ?? sourceFor(a.good, need, a.stationId);
      if (src) go(src.id, src.name); else steps.push(makeStep("DOCK", { kind: "nearest-port" }));
      steps.push(makeStep("BUY", null, { args: { good: a.good, qty: need } }));
    }
    go(a.stationId, a.stationName);
  } else {
    go(a.stationId, a.stationName);
  }
  if (!steps.length) steps.push(makeStep("DOCK", { kind: "station", id: a.stationId, name: a.stationName }));
  return makeMission({ name, steps, loop: { mode: "none" }, defaults: { thrustCap: 1, warp: "auto" }, builtin: true, aria: true, jobId: a.id, home: home?.id ?? null });
}

function legsTo(target, from, label = null) {
  const r = planRoute(target, from);
  if (r.blocked) return null;
  const out = [];
  for (let i = 0; i < r.legs.length; i++) {
    const L = r.legs[i];
    const last = i === r.legs.length - 1;
    if (last && L.kind === "station") out.push(makeStep("DOCK", { kind: "station", id: L.id, name: L.name }));
    else {
      const nx = !last ? r.legs[i + 1] : null;
      out.push(makeStep("GOTO", { kind: "point", x: L.x, y: L.y, z: L.z, name: L.name ?? label ?? "the mark" }, nx ? { args: { via: { x: nx.x, y: nx.y, z: nx.z } } } : {}));
    }
  }
  return { steps: out, end: r.legs[r.legs.length - 1], why: r.why };
}

function startJob(o) {
  const why = acceptContract(o);
  if (why) return false;
  if (o.armed || o.mech === "kill" || play.dept === "security") readyForTrouble();
  const a = contracts.active.find((x) => x.id === o.id);
  if (!a) return false;
  const m = jobPlan(a);
  if (!startMission(m)) { abandonContract(a.id); return false; }
  if (a.spot) { markPlace(`${a.title} · ${a.spot.name}`, a.spot); lockOn(a.stationId); }
  else if (a.destId) aimAt(a.destId, a.destName);
  else if (a.targets?.length) { const w = targetPos(a.targets[0], sim.time, {}); if (w) markPlace(a.title, w); lockOn(a.stationId); }
  else aimAt(a.stationId, a.stationName);
  play.move = { key: moveKeyFor(o), kind: "job", jobId: a.id, since: now(), cr0: netWorth(), note: o.title };
  play.stats.jobs++;
  note(`took "${o.title}" at ${o.stationName} — ${o.pay} cr`);
  return true;
}

export const moveKeyFor = (o) => (o.chain ? `chain:${o.cat}` : `board:${o.cat}:${o.type}`);

function startRoute() {
  const purse = Math.max(0, sim.ship.credits - PLAY.minCredits);
  let r = null;
  for (const c of tradeRoutes({ credits: purse, n: 6 })) {
    if (planRoute(c.from.id).blocked) continue;
    if (planRoute(c.to.id, c.from).blocked) continue;
    r = c;
    break;
  }
  if (!r) return false;
  const steps = [];
  let at = sim.ship.pos;
  const go = (id, nm) => { const L = legsTo(id, at, nm); if (!L) return false; steps.push(...L.steps); at = L.end; return true; };
  if (!go(r.from.id, r.from.name)) return false;
  steps.push(makeStep("BUY", null, { args: { good: r.good, qty: r.qty } }));
  if (!go(r.to.id, r.to.name)) return false;
  steps.push(makeStep("SELL", null, { args: { what: r.good } }));
  const m = makeMission({ name: `ARIA · ${r.name} to ${r.to.name}`, steps, loop: { mode: "none" }, builtin: true, aria: true });
  if (!startMission(m)) return false;
  aimAt(r.from.id, r.from.name);
  play.move = { key: "route", kind: "route", since: now(), cr0: netWorth(), note: `${r.name} ${r.from.name} → ${r.to.name}` };
  note(`route: ${r.qty} ${r.name}, ${r.from.name} → ${r.to.name}, +${Math.round(r.margin)}/unit`);
  return true;
}

function startFreeMine() {
  const m = makeMission({
    name: "ARIA · free mining",
    steps: [
      makeStep("MINE", { kind: "seam" }, { until: C("hold", ">=", 0.9) }),
      makeStep("DOCK", { kind: "best-buyer" }),
      makeStep("SELL", null, { args: { what: "ore" } }),
    ],
    loop: { mode: "none" }, builtin: true, aria: true,
  });
  if (!startMission(m)) return false;
  play.move = { key: "mine", kind: "mine", since: now(), cr0: netWorth(), note: "cutting whatever pays" };
  note("free mining");
  return true;
}

export function readyForTrouble() {
  const ship = sim.ship;
  if (ship.turretMode === "off" || !ship.turretsArmed) setTurretMode("enemies");
  ship.shields = true;
  return ship.turretsArmed;
}

export const hullFrac = () => (sim.ship.hull ?? 100) / Math.max(1, hullMaxOf(sim.ship));

function startYard() {
  if (now() - (play.yardAt ?? -1e9) < PLAY.yardCool) return false;
  const st = bestYard();
  if (!st) return false;
  if (!repairQuote(st, sim.ship).ok) return false;
  play.yardAt = now();
  const m = makeMission({
    name: "ARIA · patch the hull",
    steps: [makeStep("DOCK", { kind: "station", id: st.id, name: st.name })],
    loop: { mode: "none" }, builtin: true, aria: true,
  });
  if (!startMission(m)) return false;
  aimAt(st.id, st.name);
  play.move = { key: "yard", kind: "yard", since: now(), cr0: netWorth(), note: `${Math.round(hullFrac() * 100)}% hull → ${st.name}` };
  note(`hull at ${Math.round(hullFrac() * 100)}% — running for the yard at ${st.name}`);
  return true;
}

export function bestYard(pos = sim.ship.pos) {
  let best = null, score = -Infinity;
  for (const st of stations) {
    if (!honest(st) || !repairsAt(st)) continue;
    const q = repairQuote(st, sim.ship);
    const sc = -d3(st, pos) / 100000 - (q.per ?? 20) / 20;
    if (sc > score) { score = sc; best = st; }
  }
  return best;
}

function startSupply() {
  const s = sense();
  const jobs = unpostedWork(s, holdRoom(sim.ship), Math.max(0, sim.ship.credits - PLAY.minCredits));
  const pick = jobs.find((j) => !planRoute(j.fromId).blocked && !planRoute(j.toId, stationById(j.fromId)).blocked);
  if (!pick) return false;
  const steps = [];
  let at = sim.ship.pos;
  const go = (id, nm) => { const L = legsTo(id, at, nm); if (!L) return false; steps.push(...L.steps); at = L.end; return true; };
  if (!go(pick.fromId, pick.from)) return false;
  steps.push(makeStep("BUY", null, { args: { good: pick.good, qty: pick.qty } }));
  if (!go(pick.toId, pick.to)) return false;
  steps.push(makeStep("SELL", null, { args: { what: pick.good } }));
  const m = makeMission({ name: `ARIA · ${pick.name} for ${pick.to}`, steps, loop: { mode: "none" }, builtin: true, aria: true });
  if (!startMission(m)) return false;
  aimAt(pick.fromId, pick.from);
  play.move = { key: "supply", kind: "supply", since: now(), cr0: netWorth(), note: `${pick.qty} ${pick.name} → ${pick.to} (${pick.why})` };
  note(`${pick.to} ${pick.why}: ${pick.qty} ${pick.name} from ${pick.from}, about ${Math.round(pick.profit).toLocaleString("en-US")} cr`);
  return true;
}

function startSell() {
  const have = sellable();
  if (!Object.keys(have).length) return false;
  const m = makeMission({
    name: "ARIA · sell the hold",
    steps: [makeStep("DOCK", { kind: "best-buyer" }), makeStep("SELL", null, { args: { what: "all" } })],
    loop: { mode: "none" }, builtin: true, aria: true,
  });
  if (!startMission(m)) return false;
  play.move = { key: "sell", kind: "sell", since: now(), cr0: netWorth(), note: Object.keys(have).map(goodName).join(", ") };
  return true;
}

export function movesNow() {
  const out = [];
  const st = sim.ship.dockedAt ? stationById(sim.ship.dockedAt) : nearestPort();
  if (st) {
    const list = jobsFor(st);
    const mine = list.filter((o) => (o.cat ?? categoryOf(o.type)) === play.dept).slice(0, 3);
    for (const o of [...mine, ...list.slice(0, 5)]) out.push({ key: moveKeyFor(o), start: () => startJob(o), what: o.title });
  }
  if (sim.ship.credits > PLAY.minCredits * 2 && bestRoute()) out.push({ key: "route", start: startRoute, what: "a trade route" });
  if (sim.ship.credits > PLAY.minCredits * 2 && holdRoom(sim.ship) > 5) out.push({ key: "supply", start: startSupply, what: "supply a stalled line" });
  if (play.dept === "mining" || play.brain.moves.mine) out.push({ key: "mine", start: startFreeMine, what: "free mining" });
  if (Object.keys(sellable()).length) out.push({ key: "sell", start: startSell, what: "sell the hold" });
  if (hullFrac() < PLAY.patchAt && now() - (play.yardAt ?? -1e9) > PLAY.yardCool && bestYard()) out.push({ key: "yard", start: startYard, what: "patch the hull" });
  const seen = new Set();
  return out.filter((m) => (seen.has(m.key) ? false : seen.add(m.key)));
}

let rng = Math.random;
export function setPlayRng(fn) { rng = typeof fn === "function" ? fn : Math.random; }
function rand() { return rng(); }

export function weightOf(key) {
  const mine = key.startsWith(`board:${play.dept}`) || key === `chain:${play.dept}`
    || (key === "mine" && play.dept === "mining")
    || ((key === "route" || key === "supply") && (play.dept === "trade" || play.dept === "logistics"));
  return scoreOf(key) * (mine ? PLAY.deptBias : 1);
}

function decide() {
  const opts = movesNow();
  if (!opts.length) return false;
  const yard = hullFrac() < PLAY.patchAt ? opts.find((o) => o.key === "yard") : null;
  if (yard) { play.stats.decisions++; if (yard.start()) return true; }
  const explore = rand() < PLAY.explore;
  const pick = explore ? opts[Math.floor(rand() * opts.length)] : opts.reduce((a, b) => (weightOf(a.key) >= weightOf(b.key) ? a : b));
  play.stats.decisions++;
  return pick.start();
}

function finishMove(ok, why) {
  const m = play.move;
  if (!m) return;
  const secs = Math.max(1, now() - m.since);
  const cr = netWorth() - m.cr0;
  brainNote(m.key, secs, cr, ok);
  play.stats[ok ? "done" : "failed"]++;
  if (cr > 0) play.stats.earned += cr; else play.stats.spent -= cr;
  note(`${ok ? "done" : `dropped (${why})`}: ${m.note} — ${cr >= 0 ? "+" : ""}${Math.round(cr)} cr in ${Math.round(secs)}s`);
  play.move = null;
}

export function beginPlay({ career = pilot?.complexId ?? "mining", name = "ARIA", brain = null, rng: seedRng = null } = {}) {
  if (seedRng) setPlayRng(seedRng);
  play.on = true;
  play.name = name;
  play.career = career;
  play.dept = CAREER_DEPT[career] ?? "mining";
  play.started = now();
  play.credits0 = netWorth();
  play.move = null;
  play.yardAt = -1e9;
  play.log = [];
  forgetSenses();
  resetBusiness();
  bizSeen = 0;
  play.stats = { decisions: 0, jobs: 0, done: 0, failed: 0, earned: 0, spent: 0 };
  const taken = adoptBrain(brain);
  play.brain = { career, sky: sim.skySeed, runs: taken.runs, moves: taken.moves, why: taken.why };
  note(`${name} takes the conn — ${career} (${CATEGORIES[play.dept]?.name ?? play.dept})`);
  return play;
}

export function stepPlay(dt) {
  if (!play.on) return;
  if (sim.ship.dockedAt && deliverableAt(sim.ship.dockedAt).length) {
    const got = deliverContracts(sim.ship.dockedAt);
    if (got > 0 && play.move?.kind === "job") { finishMove(true, "delivered"); stopMission("done"); }
  }
  if (sim.ship.dockedAt) {
    const per = Math.round((netWorth() - play.credits0) / Math.max(1, (now() - play.started) / 60));
    const did = runBusiness(play.dept, Math.max(0, per));
    if (did) for (; bizSeen < biz.log.length; bizSeen++) note(biz.log[bizSeen].text);
  }
  if (sim.ship.dockedAt && hullFrac() < 0.995 && repairsAt(stationById(sim.ship.dockedAt)) && sim.ship.credits > PLAY.minCredits) {
    const r = yardRepair(null);
    if (r.ok) note(`patched ${r.points} hull point${r.points === 1 ? "" : "s"} for ${Math.round(r.cost).toLocaleString("en-US")} cr`);
    play.yardAt = now();
    if (play.move?.kind === "yard") { finishMove(true, "patched"); stopMission("done"); return; }
  }
  if (play.move && play.move.kind !== "yard" && hullFrac() < PLAY.runAt && now() - (play.yardAt ?? -1e9) > PLAY.yardCool && repairQuote(bestYard() ?? null, sim.ship).ok) {
    const a0 = play.move.jobId ? contracts.active.find((x) => x.id === play.move.jobId) : null;
    if (a0) abandonContract(a0.id);
    stopMission("breaking off");
    finishMove(false, `hull at ${Math.round(hullFrac() * 100)}%`);
    startYard();
    return;
  }
  const m = play.move;
  if (m) {
    const a = m.jobId ? contracts.active.find((x) => x.id === m.jobId) : null;
    if (a && a.good && a.qty && holdUsed() > 0.95 && (sim.ship.hold[a.good] ?? 0) < a.qty && !m.cleared) {
      m.cleared = true;
      if (startMission(jobPlan(a))) { note(`hold full and the order short — clearing it first`); return; }
    }
    if (m.kind === "job" && !a) { finishMove(true, "closed"); stopMission("done"); return; }
    if (a && timeLeft(a) <= 0) { abandonContract(a.id); stopMission("late"); finishMove(false, "ran out of time"); return; }
    if (!mission.active) {
      if (a && (m.replans ?? 0) < PLAY.replans) { m.replans = (m.replans ?? 0) + 1; if (startMission(jobPlan(a))) { note(`re-flying "${a.title}" (pass ${m.replans + 1})`); return; } }
      finishMove(!a, "mission ended");
      if (a) abandonContract(a.id);
      return;
    }
    if (now() - m.since > PLAY.stuck) { stopMission("stuck"); if (a) abandonContract(a.id); finishMove(false, "stuck"); return; }
    return;
  }
  play.think -= dt;
  if (play.think > 0) return;
  play.think = PLAY.think;
  if (!decide()) play.think = PLAY.think * 4;
}

export const brainSig = () => `${VERSION}:${PRICE_FLOOR}-${PRICE_CEIL}:${BOARD.pay ?? 1}`;

export function brainOut() {
  return { sig: brainSig(), career: play.career, sky: play.brain.sky, runs: play.brain.runs, moves: play.brain.moves, saved: Math.round(now()) };
}

export function adoptBrain(saved, sky = sim.skySeed) {
  if (!saved?.moves) return { moves: {}, runs: 0, why: "empty — first run in this sky" };
  if (saved.sky && saved.sky !== sky) return { moves: {}, runs: 0, why: `learned in "${saved.sky}", not this sky — starting clean` };
  if (saved.sig !== brainSig()) return { moves: {}, runs: 0, why: `learned under ${saved.sig ?? "an older build"}, the rules have moved — starting clean` };
  return { moves: { ...saved.moves }, runs: saved.runs ?? 0, why: `${Object.keys(saved.moves).length} moves from ${saved.runs ?? 0} earlier runs` };
}

export function playReport() {
  const secs = Math.max(1, now() - play.started);
  const ship = sim.ship;
  const cr = netWorth() - play.credits0;
  const a = play.move?.jobId ? contracts.active.find((x) => x.id === play.move.jobId) : null;
  const held = Object.entries(ship.hold ?? {}).sort((x, y) => y[1] - x[1]);
  const run = chainReport()[0] ?? null;
  return {
    name: play.name, career: play.career, dept: play.dept,
    secs: Math.round(secs), credits: netWorth(), purse: Math.round(ship.credits), net: Math.round(cr),
    perMin: Math.round(cr / (secs / 60)),
    ...play.stats,
    hold: holdUsed(),
    holdQty: held.reduce((t, [, q]) => t + q, 0),
    cargoCap: ship.cargoCap ?? 0,
    holdTop: held.length ? `${Math.round(held[0][1])} ${goodName(held[0][0])}` : "",
    charge: (ship.charge ?? 0) / Math.max(1, batteryCap(ship)),
    hull: hullFrac(),
    move: play.move ? `${play.move.key}${play.move.note ? ` · ${play.move.note}` : ""}` : null,
    moveKey: play.move?.key ?? null,
    moveForS: play.move ? Math.round(now() - play.move.since) : null,
    jobLine: a ? jobStatus(a) : play.move?.note ?? null,
    progress: a ? jobProgress(a) : null,
    deadline: a ? Math.max(0, timeLeft(a)) / Math.max(1, BOARD.deadline) : null,
    deadlineS: a ? Math.round(timeLeft(a)) : null,
    chain: run ? `${run.name} · stage ${run.stage}/${run.of}${run.held ? " · in hand" : ` · next at ${run.stationName}`}` : null,
    task: autopilot.task ?? null,
    sees: senseLine(),
    biz: bizLine(),
    business: bizReport(),
    crew: crew.aboard.length,
    handling: handlingLeft(sim.ship.dockedAt) > 0 ? handlingLine() : null,
    held: contracts.active.length,
    chains: chainReport().length,
    best: brainReport().slice(0, 4),
    log: play.log,
  };
}

export function jobProgress(a) {
  if (!a) return null;
  if ((a.mech === "deliver" || a.mech === "haul") && a.good && a.qty) return Math.max(0, Math.min(1, (sim.ship.hold[a.good] ?? 0) / a.qty));
  return Math.max(0, Math.min(1, a.progress ?? 0));
}

export function endPlay() {
  if (play.move) finishMove(false, "run ended");
  stopMission("run ended");
  play.on = false;
  return { report: playReport(), brain: brainOut(), log: play.log };
}

void sellPriceAt;
