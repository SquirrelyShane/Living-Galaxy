import { COMPLEXES, RANK_LETTERS } from "../careers/complexes.js";
import { shipFx } from "../flight/ship.js";
import { cradle, drawnTo, ensureIdentity, generateNPC, genomeOf } from "../npc/cradle.js";
import { file as gdbFile } from "../corp/gdb.js";
import { genomeCompat, kinship, KIN_BLOCK, kinLabel } from "../genome/spacer.js";

export const CYCLE_SECONDS = 90;
const WAGE_SHARE = 0.2;

function mulberry(seedStr) {
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

export function wageFor(complexId, letter) {
  const c = COMPLEXES[complexId];
  const rank = c?.ranks?.find((r) => r.letter === letter);
  return Math.max(50, Math.round((rank?.pay ?? 900) * WAGE_SHARE));
}

export function stationRoster(station, restock = 0, sky = "sol") {
  const rnd = mulberry(`${station.id}:${sky}:roster:${restock}`);
  const n = 4 + Math.floor(rnd() * 4);
  const out = [];
  const locals = cradle.pool((r) => r.station === station.id).sort((a, b) => (a.seed < b.seed ? -1 : 1));
  const pool = [...locals, ...locals.filter((r) => r.status === "dismissed").flatMap((r) => [r, r, r, r, r, r])];
  const drifters = cradle.pool((r) => r.status === "dismissed" && r.station && r.station !== station.id);
  const returning = Math.min(pool.length, Math.floor(n / 2));
  for (let i = 0; i < returning; i++) {
    const rec = pool[Math.floor(rnd() * pool.length)];
    if (out.some((x) => x.id === rec.id)) continue;
    out.push(candidateFrom(rec));
  }
  if (drifters.length && rnd() < 0.25) {
    const rec = drifters[Math.floor(rnd() * drifters.length)];
    if (!out.some((x) => x.id === rec.id)) out.push(candidateFrom(rec));
  }
  for (let i = 0; out.length < n && i < n * 3; i++) {
    const letter = RANK_LETTERS[Math.min(4, Math.floor(rnd() * rnd() * 7))];
    const rec = generateNPC(`${sky}:${station.id}:${restock}:${i}`, { letter, sky });
    const have = cradle.get(rec.id);
    if (have && (have.status === "aboard" || have.status === "captain") && crew.aboard.some((m) => m.id === have.id)) continue;
    if (out.some((x) => x.id === rec.id)) continue;
    const filed = have ?? gdbFile(rec, { kind: "hall", place: station.id, group: [...crew.aboard, ...out] });
    out.push(candidateFrom(filed));
  }
  return out;
}

function candidateFrom(rec) {
  ensureIdentity(rec);
  return {
    id: rec.id,
    name: rec.name,
    raceId: rec.raceId,
    synthetic: Boolean(rec.synthetic),
    gender: rec.gender,
    pronouns: rec.pronouns,
    attractedTo: rec.attractedTo,
    complexId: rec.complexId,
    complexName: rec.complexName,
    letter: rec.letter,
    title: rec.title,
    wage: wageFor(rec.complexId, rec.letter),
    pulse: rec.pulse,
    traits: rec.traits,
    genome: rec.genome,
    genomeType: rec.genomeType,
    fingerprint: rec.fingerprint,
    aptitude: rec.aptitude,
    tells: rec.tells,
    seed: rec.seed,
    returning: (rec.history?.length ?? 0) > 0,
  };
}

export const crewHooks = { onCycle: null, cycle: [], reset: [], always: [], port: null };

export const crew = {
  employer: null,
  aboard: [],
  payPool: 0,
  lastPay: null,
  log: [],
  hires: 0,
};

export const FIRST_HAND_WAGE = 0.5;

export function hireTerms(candidate) {
  const firstHand = crew.hires === 0 && crew.aboard.length === 0;
  const wage = firstHand ? Math.max(20, Math.round(candidate.wage * FIRST_HAND_WAGE)) : candidate.wage;
  return { bonus: firstHand ? 0 : candidate.wage * 2, wage, firstHand };
}

function note(msg) {
  crew.log.unshift({ t: Date.now(), msg });
  crew.log.length = Math.min(crew.log.length, 30);
}

export function crewWageTotal() {
  const raw = crew.aboard.reduce((a, m) => a + (m.robot ? 0 : m.wage), 0);
  return Math.round(raw * shipFx.fx("crewWage", 1));
}

export const firstName = (m) => String(m?.name ?? "").split(" ")[0];

export const pronounOf = (m) => (m?.pronouns ? `${m.pronouns.subj}/${m.pronouns.obj}` : "");

export const genderMark = (m, sep = " · ") => (m?.pronouns ? `${sep}${pronounOf(m)}` : "");

export function hireCrew(candidate, ship, capacity) {
  if (crew.aboard.length >= capacity) return "No berths free";
  if (crew.aboard.some((m) => m.id === candidate.id)) return "Already aboard";
  const terms = hireTerms(candidate);
  if (ship.credits < terms.bonus) return `Signing bonus is ${terms.bonus} cr`;
  ship.credits -= terms.bonus;
  crew.hires++;
  crew.aboard.push({ ...candidate, wage: terms.wage, listWage: candidate.wage, firstHand: terms.firstHand, morale: 78, cyclesAboard: 0, bonds: {}, partner: null });
  note(terms.firstHand
    ? `${candidate.name} signed on at the first-hand rate — ${candidate.title}, ${terms.wage} cr/cycle, no bonus`
    : `${candidate.name} signed on — ${candidate.title}, ${terms.wage} cr/cycle`);
  const rec = cradle.get(candidate.id);
  if (rec) {
    rec.status = "aboard";
    rec.employer = crew.employer;
    cradle.note(rec.id, `Signed on with ${crew.employer ?? "a pilot"} as ${candidate.title}`);
  }
  return null;
}

export function dismissCrew(id) {
  const i = crew.aboard.findIndex((m) => m.id === id);
  if (i < 0) return;
  note(`${crew.aboard[i].name} paid off and dismissed`);
  fileDeparture(crew.aboard[i], "dismissed", `Paid off and dismissed by ${crew.employer ?? "a pilot"}`);
  crew.aboard.splice(i, 1);
}

function fileDeparture(m, status, text) {
  partingWords(m);
  const rec = cradle.get(m.id);
  if (!rec) return;
  rec.status = status;
  rec.employer = null;
  const port = crewHooks.port?.() ?? null;
  if (port) rec.station = port;
  rec.cyclesServed = (rec.cyclesServed ?? 0) + (m.cyclesAboard ?? 0);
  cradle.note(rec.id, text);
}

const _genomeCache = new Map();
function genomeFor(m) {
  if (!m?.id) return null;
  if (_genomeCache.has(m.id)) return _genomeCache.get(m.id);
  const rec = cradle.get(m.id);
  const g = rec ? genomeOf(rec) : null;
  _genomeCache.set(m.id, g);
  return g;
}
export function forgetGenome(id) { if (id) _genomeCache.delete(id); else _genomeCache.clear(); }

export function compat(a, b) {
  const ta = a.traits ?? {}, tb = b.traits ?? {};
  const d = (k) => Math.abs((ta[k] ?? 0.5) - (tb[k] ?? 0.5));
  let c = 3 - d("loyalty") * 3 - d("caution") * 2 + (1 - d("curiosity")) * 1.5;
  if ((ta.greed ?? 0) > 0.7 && (tb.greed ?? 0) > 0.7) c -= 3;
  if (a.morale > 60 && b.morale > 60) c += 1;
  const ga = genomeFor(a), gb = genomeFor(b);
  if (ga && gb) c = c * 0.45 + genomeCompat(ga, gb) * 0.55;
  return c;
}

export function relatedTo(a, b) {
  const ga = genomeFor(a), gb = genomeFor(b);
  return ga && gb ? kinship(ga, gb) : 0;
}

export function kinLineBetween(a, b) { return kinLabel(relatedTo(a, b)); }

export function rapportBetween(a, b) {
  return a?.bonds?.[b?.id] ?? 0;
}

export function bondLine(m) {
  if (m.partner) {
    const p = crew.aboard.find((x) => x.id === m.partner);
    if (p) return `with ${p.name}`;
  }
  let best = null;
  for (const o of crew.aboard) {
    if (o.id === m.id) continue;
    const r = rapportBetween(m, o);
    if (r >= 70 && (!best || r > best.r)) best = { o, r };
  }
  return best ? `close with ${best.o.name}` : "";
}

function stepBonds() {
  const list = crew.aboard;
  for (let i = 0; i < list.length; i++) {
    for (let j = i + 1; j < list.length; j++) {
      const a = list[i], b = list[j];
      a.bonds ??= {}; b.bonds ??= {};
      const r = Math.max(0, Math.min(100, (a.bonds[b.id] ?? 0) + 4 + compat(a, b)));
      a.bonds[b.id] = r; b.bonds[a.id] = r;
      const rnd = mulberry(`${a.id}:${b.id}:${a.cyclesAboard}:${b.cyclesAboard}`);
      if (a.robot || b.robot) continue;
      if (relatedTo(a, b) >= KIN_BLOCK) continue;
      if (!a.partner && !b.partner && r >= 55 && drawnTo(a, b) && drawnTo(b, a) && rnd() < 0.35) {
        a.partner = b.id; b.partner = a.id;
        a.morale = Math.min(100, a.morale + 8); b.morale = Math.min(100, b.morale + 8);
        note(`${a.name} and ${b.name} have been taking the same mess shift. It's official aboard.`);
        for (const [x, y] of [[a, b], [b, a]]) {
          const rec = cradle.get(x.id);
          if (rec) { rec.partner = y.id; cradle.note(rec.id, `Together with ${y.name} aboard ${crew.employer ?? "a ship"}`); }
        }
      }
    }
  }
  for (const m of list) {
    if (!m.partner) continue;
    if (m.partner === "player") { m.morale = Math.min(100, m.morale + 3); continue; }
    const p = list.find((x) => x.id === m.partner);
    if (!p) { m.partner = null; continue; }
    m.morale = Math.min(100, m.morale + 3);
    if (m.morale < 20 && mulberry(`${m.id}:split:${m.cyclesAboard}`)() < 0.25) {
      note(`${m.name} and ${p.name} have called it off. The mess is quiet.`);
      m.partner = null; p.partner = null;
      m.morale -= 12; p.morale = Math.max(1, p.morale - 12);
      m.bonds[p.id] = Math.max(0, (m.bonds[p.id] ?? 0) - 30); p.bonds[m.id] = m.bonds[p.id];
      for (const x of [m, p]) { const rec = cradle.get(x.id); if (rec) { rec.partner = null; cradle.note(rec.id, "Split up aboard ship"); } }
    }
  }
}

function partingWords(m) {
  if (!m.partner || m.partner === "player") { if (m.partner) { const rec = cradle.get(m.id); if (rec) rec.partner = null; m.partner = null; } return; }
  const p = crew.aboard.find((x) => x.id === m.partner && x !== m);
  const rec = cradle.get(m.id);
  if (rec) rec.partner = null;
  if (!p) return;
  p.partner = null;
  p.morale = Math.max(1, p.morale - 25);
  note(`${p.name} took ${m.name}'s leaving hard.`);
  const prec = cradle.get(p.id);
  if (prec) { prec.partner = null; cradle.note(prec.id, `${m.name} left the ship; they had been together`); }
}

export function tickCrew(seconds, ship) {
  for (const fn of crewHooks.always) { try { fn(seconds); } catch (e) { globalThis.console?.warn?.("crew always hook", e); } }
  if (!crew.aboard.length) { crew.payPool = 0; return; }
  crew.payPool += seconds;
  while (crew.payPool >= CYCLE_SECONDS) {
    crew.payPool -= CYCLE_SECONDS;
    let paid = 0;
    let shortfall = 0;
    for (const m of crew.aboard) {
      m.cyclesAboard++;
      if (m.robot) continue;
      if (ship.credits >= m.wage) {
        ship.credits -= m.wage;
        paid += m.wage;
        m.morale = Math.min(100, m.morale + 2);
      } else {
        shortfall += m.wage;
        m.morale -= 15;
      }
    }
    crew.lastPay = { total: crewWageTotal(), paid, shortfall };
    if (shortfall > 0) note(`Payroll short by ${shortfall} cr — morale is dropping`);
    stepBonds();
    crewHooks.onCycle?.();
    for (const fn of crewHooks.cycle) { try { fn(); } catch (e) { globalThis.console?.warn?.("crew cycle hook", e); } }
    for (const m of [...crew.aboard]) {
      if (!m.robot && m.morale <= 0) {
        note(`${m.name} walked over unpaid wages`);
        fileDeparture(m, "pool", `Walked off ${crew.employer ?? "a ship"} over unpaid wages`);
        crew.aboard.splice(crew.aboard.indexOf(m), 1);
      }
    }
  }
}

export function resetCrew() {
  for (const m of crew.aboard) fileDeparture(m, "pool", `Paid off when ${crew.employer ?? "the pilot"} left the sky`);
  for (const rec of cradle.all()) {
    if ((rec.status === "aboard" || rec.status === "captain") && rec.employer === crew.employer && !crew.aboard.some((m) => m.id === rec.id)) {
      rec.status = "pool"; rec.employer = null; cradle.put(rec);
    }
  }
  crew.aboard.length = 0;
  crew.payPool = 0;
  crew.lastPay = null;
  crew.log.length = 0;
  crew.hires = 0;
  forgetGenome();
  for (const fn of crewHooks.reset) { try { fn(); } catch {} }
}

export function crewNote(msg) {
  note(msg);
}
