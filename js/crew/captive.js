import { sim, logEvent } from "../sim/sim.js";
import { crew, crewHooks, crewNote, wageFor } from "./ledger.js";
import { cradle } from "../npc/cradle.js";
import { boarding } from "../interior/boarding.js";
import { corpById, adjustStanding } from "../corp/corps.js";
import { bodyOf } from "./deckmind.js";
import { GENE } from "../genome/spacer.js";

export const RECRUIT_RESISTANCE = 28;
export const RECRUIT_REGARD = 55;
export const NEGLECT_DRIFT = 2.5;

const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
const r1 = (v) => Math.round(v * 10) / 10;

function rollFrom(seed) {
  let h = 2166136261;
  for (let i = 0; i < String(seed).length; i++) h = Math.imul(h ^ String(seed).charCodeAt(i), 16777619);
  return ((h >>> 0) % 10000) / 10000;
}

export function captiveState(p) {
  if (!p) return null;
  if (p.state) return p.state;
  const rec = cradle.get(p.id);
  const body = rec ? bodyOf({ id: rec.id, raceId: rec.raceId, seed: rec.seed }) : null;
  const g = body?.genome;
  const grit = body?.traits?.grit ?? 0.5;
  const loyal = body?.traits?.loyalty ?? 0.5;
  const pain = g ? (g[GENE.PAIN_THRESHOLD] ?? 0.5) : 0.5;
  p.state = {
    resistance: clamp(Math.round(52 + grit * 26 + loyal * 18 + pain * 10), 30, 100),
    regard: clamp(Math.round(22 + (1 - grit) * 14), 5, 45),
    health: 100,
    fed: 0,
    clothed: false,
    outOfCell: false,
    cycles: 0,
    attempts: 0,
    escapes: 0,
    done: {},
    log: [],
  };
  return p.state;
}

function note(p, line) {
  const st = captiveState(p);
  st.log.unshift({ t: Math.round(sim.time ?? 0), line });
  st.log.length = Math.min(st.log.length, 14);
}

export function captives() {
  return boarding.brig.map((p) => ({ p, st: captiveState(p) }));
}

export function captiveById(id) {
  return boarding.brig.find((p) => p.id === id) ?? null;
}

export const INTERACTIONS = [
  {
    id: "feed", label: "Bring them a meal", kind: "care", cooldown: 1, cost: 12,
    resist: -3.5, regard: +6, health: +4,
    why: "Hot food, off the crew's own galley. It is not nothing.",
    line: (n) => `You bring ${n} a tray from the mess. They eat all of it and hand the tray back without a word.`,
    apply: (st) => { st.fed = 0; },
  },
  {
    id: "clothe", label: "Get them clean clothes", kind: "care", cooldown: 6, cost: 35, once: true,
    resist: -4, regard: +9, health: +3,
    why: "They came aboard in what they were wearing.",
    line: (n) => `A ship suit that fits, and somewhere to wash. ${n} says thank you, and seems annoyed about saying it.`,
    apply: (st) => { st.clothed = true; },
  },
  {
    id: "talk", label: "Sit and talk", kind: "care", cooldown: 1,
    resist: -3, regard: +5,
    why: "Not an interview. Just sitting there.",
    line: (n) => `You sit outside the cell for an hour. ${n} talks about a ship they used to be on. You do not ask about the charge.`,
  },
  {
    id: "medic", label: "Have the medic look at them", kind: "care", cooldown: 4, needs: "med",
    resist: -5, regard: +11, health: +22,
    why: "Needs somebody aboard who can do it.",
    line: (n) => `Your medic goes through the hatch and spends a while. ${n} comes out of it straighter than they went in.`,
  },
  {
    id: "exercise", label: "Let them work out under watch", kind: "care", cooldown: 2, risk: 0.12,
    resist: -6, regard: +8, health: +8,
    why: "Out of the cell, with somebody on them. They will use the time to look at your locks.",
    line: (n) => `An hour in the hold with two of your crew watching. ${n} works until their hands shake, and looks at every hatch on the way back.`,
  },
  {
    id: "ease", label: "Move them out of the cell", kind: "care", cooldown: 10, once: true, risk: 0.2,
    resist: -12, regard: +18,
    why: "A berth with a door instead of a cell. The single biggest thing you can do, and the biggest risk.",
    line: (n) => `You put ${n} in a spare berth with a lock on the outside. It is still a lock. It is not the same.`,
    apply: (st) => { st.outOfCell = true; },
  },
  {
    id: "work", label: "Put them on a watch", kind: "care", cooldown: 4, needs: "eased", risk: 0.16,
    resist: -9, regard: +12,
    why: "Needs them out of the cell first. Somebody with their hands busy stops being a prisoner in their own head.",
    line: (n) => `${n} stands a watch beside your engineer. Nobody says anything about it afterwards, which is how you know it landed.`,
  },
  {
    id: "news", label: "Tell them how it stands", kind: "care", cooldown: 3,
    resist: -4, regard: +4,
    why: "What the ticket says, what their outfit has done about it, what you are minded to do.",
    line: (n, c) => `You read ${n} the ticket. ${c ? `${c} have not sent anybody.` : "Nobody has come asking."} They take that quietly.`,
  },
  {
    id: "press", label: "Press them", kind: "hard", cooldown: 1,
    resist: -7, regard: -12, health: -2,
    why: "Faster. It also ends any chance of them signing on.",
    line: (n) => `You lean on ${n} for an hour. They give you something. They will not look at you afterwards.`,
  },
  {
    id: "rations", label: "Put them on short rations", kind: "hard", cooldown: 2,
    resist: -5, regard: -16, health: -12,
    why: "Works. Costs you the person.",
    line: (n) => `${n} gets half a tray for three days. They stop asking for anything.`,
    apply: (st) => { st.fed = 3; },
  },
  {
    id: "isolate", label: "Leave them in the dark", kind: "hard", cooldown: 4,
    resist: -8, regard: -22, health: -8,
    why: "The fastest way down, and there is no way back up from it.",
    line: (n) => `The lights in the cell go off for two days. When they come back on ${n} has stopped counting.`,
    apply: (st) => { st.outOfCell = false; },
  },
];

export const INTERACTION_BY_ID = Object.fromEntries(INTERACTIONS.map((a) => [a.id, a]));

export function canInteract(p, actionId) {
  const a = INTERACTION_BY_ID[actionId];
  if (!a) return { ok: false, why: "no such thing" };
  const st = captiveState(p);
  if (!st) return { ok: false, why: "nobody there" };
  if (a.once && st.done[a.id] != null) return { ok: false, why: "already done" };
  const cycle = st.cycles;
  const last = st.done[a.id];
  if (last != null && cycle - last < a.cooldown) return { ok: false, why: `again in ${a.cooldown - (cycle - last)} cycle${a.cooldown - (cycle - last) === 1 ? "" : "s"}` };
  if (a.cost && (sim.ship?.credits ?? 0) < a.cost) return { ok: false, why: `${a.cost} cr` };
  if (a.needs === "med" && !crew.aboard.some((m) => !m.robot && (m.skills?.firstAid ?? 0) > 20)) return { ok: false, why: "nobody aboard can" };
  if (a.needs === "eased" && !st.outOfCell) return { ok: false, why: "they are still in the cell" };
  return { ok: true };
}

export function interact(p, actionId, rng = Math.random) {
  const can = canInteract(p, actionId);
  if (!can.ok) return { ok: false, why: can.why };
  const a = INTERACTION_BY_ID[actionId];
  const st = captiveState(p);

  if (a.cost && sim.ship) sim.ship.credits -= a.cost;
  const warmth = 0.7 + (st.regard / 100) * 0.8;
  const d = a.resist ?? 0;
  st.resistance = clamp(st.resistance + (d < 0 ? d * (a.kind === "hard" ? 1 : warmth) : d), 0, 100);
  const rg = a.regard ?? 0;
  st.regard = clamp(st.regard + (rg > 0 ? rg * (1 - st.regard / 125) : rg), 0, 100);
  st.health = clamp(st.health + (a.health ?? 0), 1, 100);
  st.done[a.id] = st.cycles;
  a.apply?.(st);

  const corp = p.ownerCorp ? corpById(p.ownerCorp)?.name : null;
  const line = a.line(p.name.split(" ")[0], corp);
  note(p, line);

  let escaped = false;
  if (a.risk && rng() < a.risk * (st.resistance / 100)) escaped = tryEscape(p, rng, "during " + a.label.toLowerCase());
  return { ok: true, line, resistance: r1(st.resistance), regard: r1(st.regard), escaped };
}

export function canRecruit(p) {
  const st = captiveState(p);
  if (!st) return { ok: false, why: "nobody there" };
  if (crew.aboard.length >= (sim.crewCapacity ?? 2)) return { ok: false, why: "no berth free" };
  if (st.resistance > RECRUIT_RESISTANCE) return { ok: false, why: `still ${Math.round(st.resistance)} — too hard yet` };
  if (st.regard < RECRUIT_REGARD) return { ok: false, why: `they do not think enough of you (${Math.round(st.regard)})` };
  const rec = cradle.get(p.id);
  const body = rec ? bodyOf({ id: rec.id, raceId: rec.raceId, seed: rec.seed }) : null;
  const loyal = body?.traits?.loyalty ?? 0.5;
  const corp = p.ownerCorp ? corpById(p.ownerCorp) : null;
  const theirSide = corp ? clamp((corp.standing ?? 0) / 100, -1, 1) : 0;
  const chance = clamp(
    0.28 + (st.regard - RECRUIT_REGARD) / 90 + (RECRUIT_RESISTANCE - st.resistance) / 70
    - loyal * 0.22 - Math.max(0, theirSide) * 0.2 - st.attempts * 0.12,
    0.05, 0.92,
  );
  return { ok: true, chance: Math.round(chance * 100) / 100 };
}

export function recruit(p, rng = Math.random) {
  const can = canRecruit(p);
  if (!can.ok) return { ok: false, why: can.why };
  const st = captiveState(p);
  st.attempts++;
  if (rng() >= can.chance) {
    st.regard = clamp(st.regard - 8, 0, 100);
    st.resistance = clamp(st.resistance + 6, 0, 100);
    note(p, `You put it to them. ${p.name.split(" ")[0]} says no, and means it.`);
    return { ok: true, signed: false, chance: can.chance };
  }

  const rec = cradle.get(p.id);
  const i = boarding.brig.indexOf(p);
  if (i >= 0) boarding.brig.splice(i, 1);
  const wage = wageFor(rec?.complexId, rec?.letter);
  const member = {
    ...(rec ?? {}),
    id: p.id, name: p.name,
    wage, listWage: wage, morale: 62, cyclesAboard: 0, bonds: {}, partner: null,
    turned: true, fromBrig: true,
  };
  delete member.journal;
  delete member.history;
  crew.aboard.push(member);
  crew.hires++;
  if (rec) {
    rec.status = "aboard";
    rec.employer = crew.employer;
    delete rec.wanted;
    cradle.note(rec.id, `Signed on with ${crew.employer ?? "a pilot"} out of their brig`);
    cradle.put(rec);
  }
  if (p.ownerCorp) adjustStanding(p.ownerCorp, -14, `turned ${p.name}`);
  if (p.issuerCorp && p.fromTicket) adjustStanding(p.issuerCorp, -10, `never delivered ${p.name}`);
  crewNote(`${p.name} has signed on. They came aboard in cuffs.`);
  logEvent(`${p.name} turned — signed on off the brig`, "crew");
  return { ok: true, signed: true, chance: can.chance, member };
}

export function guardStrength() {
  let g = 0.4;
  for (const m of crew.aboard) {
    if (m.idle) continue;
    if (m.robot) { g += m.kind === "marshal" ? 0.5 : 0.15; continue; }
    g += 0.12 + (m.skills?.security ?? 0) / 260;
  }
  return Math.round(g * 100) / 100;
}

function tryEscape(p, rng, when = "") {
  const st = captiveState(p);
  const odds = clamp((st.resistance / 100) * (1 - clamp(guardStrength() / 2.2, 0, 0.85)) * (st.outOfCell ? 1.6 : 1), 0, 0.6);
  if (rng() >= odds) {
    note(p, `${p.name.split(" ")[0]} tried the hatch${when ? ` ${when}` : ""}. It held.`);
    st.escapes++;
    st.resistance = clamp(st.resistance + 4, 0, 100);
    return false;
  }
  const i = boarding.brig.indexOf(p);
  if (i >= 0) boarding.brig.splice(i, 1);
  const rec = cradle.get(p.id);
  if (rec) {
    rec.status = "pool";
    cradle.note(rec.id, `Got off ${sim.callsign ?? "a hull"}'s brig${when ? ` ${when}` : ""}`);
    cradle.put(rec);
  }
  if (p.issuerCorp && p.fromTicket) adjustStanding(p.issuerCorp, -6, `lost ${p.name}`);
  crewNote(`${p.name} is off the ship. The brig hatch is open and nobody saw it.`);
  logEvent(`${p.name} escaped the brig`, "combat");
  return true;
}

export function tickCaptives() {
  for (const p of [...boarding.brig]) {
    const st = captiveState(p);
    st.cycles++;
    st.fed++;

    if (st.fed > 2) { st.health = clamp(st.health - 3, 1, 100); st.regard = clamp(st.regard - 3, 0, 100); }
    if (!st.clothed) st.regard = clamp(st.regard - 0.6, 0, 100);
    if (!st.outOfCell) st.health = clamp(st.health - 0.6, 1, 100);

    const touched = Object.values(st.done).some((c) => st.cycles - c <= 1);
    st.resistance = clamp(st.resistance + (touched ? -0.4 : NEGLECT_DRIFT), 0, 100);

    if (st.health < 25) st.regard = clamp(st.regard - 2, 0, 100);

    if (rollFrom(`${p.id}:esc:${st.cycles}`) < 0.1) tryEscape(p, () => rollFrom(`${p.id}:roll:${st.cycles}`), "on the night watch");
  }
  return boarding.brig.length;
}

const RESIST_WORD = (v) => (v > 80 ? "stone" : v > 60 ? "hard" : v > 40 ? "wearing" : v > RECRUIT_RESISTANCE ? "close" : "would listen");
const REGARD_WORD = (v) => (v < 20 ? "hates you" : v < 40 ? "wary" : v < RECRUIT_REGARD ? "civil" : v < 75 ? "warm" : "owes you one");

export function captiveLine(p) {
  const st = captiveState(p);
  return `${p.name} — ${RESIST_WORD(st.resistance)} (${Math.round(st.resistance)}), ${REGARD_WORD(st.regard)} (${Math.round(st.regard)}), health ${Math.round(st.health)}%${st.outOfCell ? ", out of the cell" : ""}`;
}

export { RESIST_WORD, REGARD_WORD };

const reset = () => { for (const p of boarding.brig) delete p.state; };
if (!crewHooks.cycle.includes(tickCaptives)) crewHooks.cycle.push(tickCaptives);
if (!crewHooks.reset.includes(reset)) crewHooks.reset.push(reset);
