import { sim, logEvent } from "../sim/sim.js";
import { stations, stationById } from "../station/stations.js";
import { cradle, generateNPC, ensureIdentity } from "./cradle.js";
import { catalogue } from "../corp/gdb.js";
import { corps, corpById, corpOfStation, corpRelation, adjustStanding } from "../corp/corps.js";
import { crew, crewHooks } from "../crew/ledger.js";
import { boarding } from "../interior/boarding.js";
import { bodyOf } from "../crew/deckmind.js";

export const BOARD_SIZE = 4;
export const TICKET_CYCLES = 40;
export const LIFT_COST = 9;
export const DELIVER_GAIN = 7;
export const HUNTED_AT = -55;

export const bounty = {
  boards: new Map(),
  taken: [],
  log: [],
  playerPrice: 0,
};

const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);

function note(text, kind = "crew") {
  bounty.log.unshift({ t: sim.time ?? 0, text });
  bounty.log.length = Math.min(bounty.log.length, 24);
  logEvent(text, kind);
}

function rng(seedStr) {
  let n = 0;
  for (let i = 0; i < seedStr.length; i++) n = Math.imul(n ^ seedStr.charCodeAt(i), 2654435761) >>> 0;
  let s = n || 7;
  return () => {
    s |= 0; s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const CHARGES = [
  { id: "manifest", label: "falsifying a manifest", tier: "petty", pay: [900, 2200], heat: 0.5 },
  { id: "desertion", label: "walking off a contracted berth", tier: "petty", pay: [700, 1800], heat: 0.4 },
  { id: "skimming", label: "skimming a hold", tier: "petty", pay: [1200, 2800], heat: 0.7 },
  { id: "claim", label: "jumping a filed claim", tier: "standing", pay: [2400, 5200], heat: 1 },
  { id: "sabotage", label: "sabotage of a working hull", tier: "standing", pay: [3200, 7000], heat: 1.3 },
  { id: "fence", label: "running stolen stock through a port", tier: "standing", pay: [2800, 6400], heat: 1.1 },
  { id: "mutiny", label: "taking a hull off its own captain", tier: "sealed", pay: [5000, 11000], heat: 1.6 },
  { id: "piracy", label: "piracy under another flag", tier: "sealed", pay: [6500, 14000], heat: 1.8 },
];

const TIER_GUARDS = { petty: [0, 1], standing: [1, 3], sealed: [2, 5] };

function restockOf(st) {
  return Math.floor((sim.time ?? 0) / (TICKET_CYCLES * 90));
}

export function boardAt(st) {
  if (!st?.id || st.sector === "pirate") return [];
  const restock = restockOf(st);
  const have = bounty.boards.get(st.id);
  if (have && have.restock === restock) return have.marks;

  const issuer = corpOfStation(st) ?? corps[0] ?? null;
  const r = rng(`${sim.skySeed || "sol"}:bounty:${st.id}:${restock}`);
  const ports = stations.filter((s) => s.id && s.sector !== "pirate");
  const marks = [];

  const pool = cradle.pool((rec) => rec.status !== "child" && !rec.wanted).sort((a, b) => (a.id < b.id ? -1 : 1));

  for (let i = 0; i < BOARD_SIZE; i++) {
    const charge = CHARGES[Math.floor(r() * CHARGES.length)];
    let rec = null;
    if (pool.length && r() < 0.62) {
      rec = pool[Math.floor(r() * pool.length)];
      if (marks.some((m) => m.id === rec.id)) rec = null;
    }
    if (!rec) {
      rec = generateNPC(`${sim.skySeed || "sol"}:mark:${st.id}:${restock}:${i}`, { sky: sim.skySeed });
      const held = cradle.get(rec.id);
      rec = held ?? catalogue(rec, { kind: "mark", place: st.id, sky: sim.skySeed ?? null, group: marks });
    }
    if (marks.some((m) => m.id === rec.id)) continue;
    ensureIdentity(rec);

    const candidates = corps.filter((c) => c !== issuer && (!issuer || corpRelation(c, issuer) < 0.5));
    const owner = candidates.length ? candidates[Math.floor(r() * candidates.length)] : corps[Math.floor(r() * corps.length)];
    const holed = ports[Math.floor(r() * ports.length)] ?? st;
    const [lo, hi] = charge.pay;
    const guards = TIER_GUARDS[charge.tier];

    marks.push({
      id: rec.id,
      name: rec.name,
      recId: rec.id,
      charge: charge.id,
      chargeLabel: charge.label,
      tier: charge.tier,
      heat: charge.heat,
      pay: Math.round(lo + r() * (hi - lo)),
      ownerCorp: owner?.id ?? null,
      ownerName: owner?.name ?? "no flag anyone will name",
      issuerCorp: issuer?.id ?? null,
      issuerName: issuer?.name ?? "the Marshal's office",
      holedAt: holed.id,
      holedName: holed.name,
      guards: guards[0] + Math.floor(r() * (guards[1] - guards[0] + 1)),
      restock,
      gone: false,
    });
    rec.wanted = { charge: charge.id, pay: marks[marks.length - 1].pay, by: issuer?.id ?? null, since: Math.round(sim.time ?? 0) };
    if (rec.status === "pool" || rec.status === "dismissed") cradle.put(rec);
  }

  bounty.boards.set(st.id, { restock, marks });
  return marks;
}

export function ticketsHeld() {
  return bounty.taken.filter((t) => !t.done);
}

export function takeTicket(mark) {
  if (!mark || mark.gone) return "That one is already gone";
  if (bounty.taken.some((t) => t.id === mark.id && !t.done)) return "You are already carrying that ticket";
  if (ticketsHeld().length >= 3) return "Three tickets is all the Marshal will sign to one hull";
  const t = { ...mark, takenAt: Math.round(sim.time ?? 0), expires: Math.round((sim.time ?? 0) + TICKET_CYCLES * 90), done: false, outcome: null };
  bounty.taken.push(t);
  note(`Ticket signed for ${mark.name} — ${mark.chargeLabel}, ${mark.pay} cr, believed at ${mark.holedName}.`);
  return null;
}

export function abandonTicket(id) {
  const t = bounty.taken.find((x) => x.id === id && !x.done);
  if (!t) return "No such ticket";
  t.done = true;
  t.outcome = "abandoned";
  if (t.issuerCorp) adjustStanding(t.issuerCorp, -2, `handed back the ticket on ${t.name}`);
  note(`Ticket on ${t.name} handed back.`);
  return null;
}

export function captureStrength() {
  let s = 1;
  for (const m of crew.aboard) {
    if (m.idle) continue;
    if (m.robot) { s += (m.kind === "marshal" ? 1.3 : 0.5) * ((m.condition ?? 100) / 100); continue; }
    const apt = bodyOf(m)?.apt?.security ?? 0.4;
    const skill = (m.skills?.security ?? 0) / 100;
    s += (0.3 + apt * 0.9 + skill * 0.8) * clamp((m.morale ?? 70) / 70, 0.4, 1.2);
  }
  return Math.round(s * 100) / 100;
}

export function markStrength(mark) {
  const rec = cradle.get(mark.recId);
  const g = rec ? bodyOf({ id: rec.id, raceId: rec.raceId, seed: rec.seed }) : null;
  const own = g ? 0.5 + (g.apt.security ?? 0.4) * 1.2 : 1;
  return Math.round((own + (mark.guards ?? 0) * 1.1) * 100) / 100;
}

export function canAttempt(mark, stId = sim.ship?.dockedAt) {
  if (!mark) return { ok: false, why: "no mark" };
  if (mark.gone) return { ok: false, why: "somebody else got to them" };
  if (!stId) return { ok: false, why: "you have to be docked where they are" };
  if (mark.holedAt !== stId) return { ok: false, why: `they are at ${mark.holedName}` };
  if (!boarding.brig && !hasBrig()) return { ok: false, why: "nowhere aboard to put them" };
  if (boarding.brig.length >= brigBerths()) return { ok: false, why: "the brig is full" };
  return { ok: true };
}

export function hasBrig() { return brigBerths() > 0; }
export function brigBerths() {
  return 1 + Math.max(0, Math.round((sim.ship?.mods?.brig ?? 0)));
}

export function attemptCapture(mark, opts = {}) {
  const can = canAttempt(mark, opts.stId ?? sim.ship?.dockedAt);
  if (!can.ok) return { ok: false, why: can.why };
  const t = bounty.taken.find((x) => x.id === mark.id && !x.done) ?? mark;
  if (t.attempted) return { ok: false, why: "you have had your go at them this rotation" };
  t.attempted = true;

  const mine = captureStrength();
  const theirs = markStrength(mark);
  const r = opts.rng ?? rng(`${sim.skySeed || "sol"}:take:${mark.id}:${t.takenAt ?? 0}`);
  const odds = clamp(mine / (mine + theirs), 0.08, 0.94);
  const roll = r();

  if (mark.ownerCorp) {
    adjustStanding(mark.ownerCorp, -LIFT_COST * (mark.heat ?? 1), `came for ${mark.name}`);
    for (const c of corps) {
      if (c.id === mark.ownerCorp) continue;
      const rel = corpRelation(c, corpById(mark.ownerCorp));
      if (rel >= 0.5) adjustStanding(c.id, -LIFT_COST * 0.35 * (mark.heat ?? 1), `flies with ${mark.ownerName}`);
    }
  }

  if (roll < odds) {
    const rec = cradle.get(mark.recId) ?? generateNPC(mark.recId, {});
    rec.status = "captive";
    rec.wanted = rec.wanted ?? { charge: mark.charge, pay: mark.pay, by: mark.issuerCorp };
    cradle.put(rec);
    cradle.note(rec.id, `Taken at ${mark.holedName} on a ${mark.tier} ticket — ${mark.chargeLabel}`);
    boarding.brig.push({
      id: rec.id, name: rec.name, rec, hp: 0, skill: 0,
      bounty: mark.pay, charge: mark.chargeLabel, ownerCorp: mark.ownerCorp, issuerCorp: mark.issuerCorp,
      takenAt: Math.round(sim.time ?? 0), fromTicket: true,
    });
    t.outcome = "taken";
    note(`${mark.name} is in the brig. ${mark.ownerName} will have heard by now.`, "combat");
    return { ok: true, taken: true, odds, mark };
  }

  mark.gone = roll > 0.85 + (1 - odds) * 0.1;
  t.outcome = mark.gone ? "lost" : "failed";
  note(mark.gone
    ? `${mark.name} was gone before you reached the lock-up. Somebody tipped them.`
    : `${mark.name} put two of the station's people between you and the door. Not this time.`, "combat");
  return { ok: true, taken: false, odds, gone: mark.gone, mark };
}

export function deliver(captiveId, stId = sim.ship?.dockedAt) {
  const st = stationById(stId);
  if (!st) return { ok: false, why: "you are not docked" };
  if (st.sector === "pirate") return { ok: false, why: "no Marshal takes delivery here" };
  const i = boarding.brig.findIndex((p) => p.id === captiveId);
  if (i < 0) return { ok: false, why: "not in the brig" };
  const p = boarding.brig[i];
  const health = p.state?.health ?? 100;
  if (health < 35) return { ok: false, why: `they will not take ${p.name} in that state — feed them and get the medic in first` };
  boarding.brig.splice(i, 1);

  const pay = Math.round((p.bounty ?? 400) * (health < 60 ? 0.7 : 1));
  if (sim.ship) sim.ship.credits += pay;
  if (p.issuerCorp) adjustStanding(p.issuerCorp, DELIVER_GAIN, `delivered ${p.name}`);
  if (p.ownerCorp) adjustStanding(p.ownerCorp, -4, `handed ${p.name} to the Marshal`);
  const rec = cradle.get(p.id);
  if (rec) {
    rec.status = "held";
    rec.employer = null;
    cradle.note(rec.id, `Handed to the Marshal at ${st.name}`);
    cradle.put(rec);
  }
  const t = bounty.taken.find((x) => x.id === p.id && !x.done);
  if (t) { t.done = true; t.outcome = "delivered"; }
  if (health < 60) {
    if (p.issuerCorp) adjustStanding(p.issuerCorp, -3, `handed over ${p.name} in poor shape`);
    note(`${p.name} handed over at ${st.name} — ${pay} cr, docked for the state of them.`);
  } else {
    note(`${p.name} handed over at ${st.name} — ${pay} cr.`);
  }
  return { ok: true, pay, docked: health < 60 };
}

export function release(captiveId, why = "") {
  const i = boarding.brig.findIndex((p) => p.id === captiveId);
  if (i < 0) return { ok: false, why: "not in the brig" };
  const p = boarding.brig[i];
  boarding.brig.splice(i, 1);
  if (p.ownerCorp) adjustStanding(p.ownerCorp, LIFT_COST * 0.6, `let ${p.name} go`);
  if (p.issuerCorp && p.fromTicket) adjustStanding(p.issuerCorp, -DELIVER_GAIN, `never delivered ${p.name}`);
  const rec = cradle.get(p.id);
  if (rec) {
    rec.status = "pool";
    delete rec.wanted;
    cradle.note(rec.id, `Let go by ${sim.callsign ?? "a pilot"}${why ? ` — ${why}` : ""}`);
    cradle.put(rec);
  }
  const t = bounty.taken.find((x) => x.id === p.id && !x.done);
  if (t) { t.done = true; t.outcome = "released"; }
  note(`${p.name} walked off at the lock. ${p.ownerName ?? "Their outfit"} will hear that too.`);
  return { ok: true };
}

export function ransom(captiveId) {
  const i = boarding.brig.findIndex((p) => p.id === captiveId);
  if (i < 0) return { ok: false, why: "not in the brig" };
  const p = boarding.brig[i];
  const c = p.ownerCorp ? corpById(p.ownerCorp) : null;
  if (!c) return { ok: false, why: "nobody is claiming them" };
  if (c.standing < -80) return { ok: false, why: `${c.name} will not deal with you at all` };
  const pay = Math.round((p.bounty ?? 400) * 1.45);
  boarding.brig.splice(i, 1);
  if (sim.ship) sim.ship.credits += pay;
  adjustStanding(c.id, LIFT_COST * 0.9, `sold ${p.name} back`);
  if (p.issuerCorp && p.fromTicket) adjustStanding(p.issuerCorp, -DELIVER_GAIN * 1.4, `sold ${p.name} back instead of delivering`);
  const rec = cradle.get(p.id);
  if (rec) { rec.status = "pool"; delete rec.wanted; cradle.note(rec.id, `Ransomed back to ${c.name}`); cradle.put(rec); }
  const t = bounty.taken.find((x) => x.id === p.id && !x.done);
  if (t) { t.done = true; t.outcome = "ransomed"; }
  note(`${c.name} paid ${pay} cr for ${p.name}. The Marshal will want a word.`);
  return { ok: true, pay };
}

export function tickPlayerPrice() {
  let worst = 0;
  for (const c of corps) worst = Math.min(worst, c.standing ?? 0);
  bounty.playerPrice = worst <= HUNTED_AT ? Math.round((-worst - -HUNTED_AT) * 140 + 2000) : 0;
  return bounty.playerPrice;
}

export function priceLine() {
  if (!bounty.playerPrice) return "";
  return `There is ${bounty.playerPrice} cr on this hull.`;
}

export function tickHunters(seconds) {
  hunterPool += Math.max(0, Math.min(600, Number(seconds) || 0));
  if (hunterPool < 90) return;
  hunterPool = 0;
  tickPlayerPrice();
  const now = sim.time ?? 0;
  for (const t of bounty.taken) {
    if (t.done) continue;
    if (now > t.expires) {
      t.done = true;
      t.outcome = "expired";
      if (t.issuerCorp) adjustStanding(t.issuerCorp, -3, `let the ticket on ${t.name} run out`);
      note(`The ticket on ${t.name} has run out.`);
      continue;
    }
    const held = Math.max(0, now - t.takenAt) / 90;
    if (!t.gone && held > 6 && rngRoll(`${t.id}:hunter:${Math.floor(held / 6)}`) < 0.07) {
      t.gone = true;
      const mark = [...bounty.boards.values()].flatMap((b) => b.marks).find((m) => m.id === t.id);
      if (mark) mark.gone = true;
      note(`Somebody else took ${t.name}. The ticket is dead.`);
    }
  }
}

let hunterPool = 0;
function rngRoll(seed) {
  let h = 2166136261;
  for (let i = 0; i < String(seed).length; i++) h = Math.imul(h ^ String(seed).charCodeAt(i), 16777619);
  return ((h >>> 0) % 10000) / 10000;
}

export function resetBounty() {
  bounty.boards.clear();
  bounty.taken.length = 0;
  bounty.log.length = 0;
  bounty.playerPrice = 0;
  hunterPool = 0;
}

if (!crewHooks.always.includes(tickHunters)) crewHooks.always.push(tickHunters);
if (!crewHooks.reset.includes(resetBounty)) crewHooks.reset.push(resetBounty);
