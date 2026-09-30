import { company, staffAt } from "../corp/company.js";
import { cradle, generateNPC, drawnTo, ensureIdentity, genomeOf, PRONOUNS } from "../npc/cradle.js";
import { file as gdbFile, markDead } from "../corp/gdb.js";
import { breed, packGenome, fingerprint, genomeTraits, genomeIdentity, skillAptitude, SPACER, kinship } from "../genome/spacer.js";
import { childFamily, nameRng } from "../world/names.js";
import { stationById } from "./stations.js";
import { adjustStanding, corpOfStation } from "../corp/corps.js";
import { logEvent, sim } from "../sim/sim.js";
import { COMPLEXES } from "../careers/complexes.js";
import { post } from "../comms/chat.js";
import { hearFrom, moodLift } from "./staffline.js";
import { planAt } from "./stafflife.js";
import { hoursAt } from "./stationclock.js";

export const STATION_ADULT = 36;
const EVENT_CHANCE = 0.10;
const MAX_LOG = 60;

export const stationLife = {
  log: [],
  households: {},
  kids: [],
  standing: {},
};

export function resetStationLife() {
  stationLife.log.length = 0;
  stationLife.households = {};
  stationLife.kids.length = 0;
  stationLife.standing = {};
}

function note(kind, who, text, stId, delta = 0) {
  stationLife.log.unshift({ at: sim.time, stationId: stId, kind, who: who?.name ?? who ?? "", text, delta });
  if (stationLife.log.length > MAX_LOG) stationLife.log.length = MAX_LOG;
  logEvent(text, "company");
  try { hearFrom(kind, who, text); } catch {}
  return text;
}

function roll(seed) {
  let h = 2166136261;
  const s = String(seed);
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  h ^= h >>> 13; h = Math.imul(h, 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

const traitOf = (s, k) => s?.traits?.[k] ?? 0.5;

export const ROLES = [
  { id: "staff", label: "On the rolls", mult: 1 },
  { id: "senior", label: "Senior hand", mult: 1.35 },
  { id: "supervisor", label: "Floor supervisor", mult: 1.8 },
  { id: "manager", label: "Station manager", mult: 2.4 },
  { id: "director", label: "Regional director", mult: 3.2 },
];
export const roleAt = (id) => ROLES.find((r) => r.id === id) ?? ROLES[0];
export const roleIndex = (id) => Math.max(0, ROLES.findIndex((r) => r.id === id));

export function incomeOf(s) {
  return Math.round((s.baseIncome ?? s.income ?? 0) * roleAt(s.role === "staff" || !s.role ? "staff" : s.role).mult);
}

const EVENTS = [
  {
    id: "promotion", good: true,
    weight: (s, st) => (roleIndex(s.role) >= ROLES.length - 1 || (s.cycles ?? 0) < 14 * (roleIndex(s.role) + 1) ? 0
      : 1.1 + traitOf(s, "loyalty") * 1.4 + (st?.sector === "industrial" ? 0.4 : 0)),
    run(s, st) {
      const next = ROLES[Math.min(ROLES.length - 1, roleIndex(s.role) + 1)];
      s.role = next.id;
      s.income = incomeOf(s);
      const rec = cradle.get(s.id);
      if (rec) { rec.title = next.label; cradle.note(rec.id, `Made ${next.label} at ${st?.name ?? "the port"}`); }
      return note("promotion", s, `${s.name} is ${next.label} at ${st?.name ?? "the port"} — ${s.income} cr/cycle now.`, st?.id, 0);
    },
  },
  {
    id: "commendation", good: true,
    weight: (s, st) => 0.7 + traitOf(s, "grit") * 1.2 + (st?.sector === "military" ? 0.6 : 0),
    run(s, st) {
      const corp = st ? corpOfStation(st) : null;
      if (corp) adjustStanding(corp.id, 2, `${s.name} commended at ${st.name}`);
      company.confidence = Math.min(1, (company.confidence ?? 0.5) + 0.03);
      return note("commendation", s, `${st?.name ?? "The port"} commended ${s.name} — the company's name goes up with it.`, st?.id);
    },
  },
  {
    id: "windfall", good: true,
    weight: (s, st) => 0.35 + traitOf(s, "curiosity") * 0.6 + (st?.sector === "logistic" ? 0.4 : 0),
    run(s, st) {
      const cr = Math.round(s.income * (1.5 + roll(`${s.id}:wf:${sim.time}`) * 4));
      company.treasury += cr;
      return note("windfall", s, `${s.name} turned a contract nobody else wanted at ${st?.name ?? "the port"} — ${cr} cr to the treasury.`, st?.id, cr);
    },
  },
  {
    id: "marriage", good: true,
    weight: (s, st) => (household(s).partner ? 0 : 1.6 + traitOf(s, "loyalty") * 1.2),
    run(s, st) {
      const here = staffAt(s.stationId).filter((o) => o.id !== s.id && !household(o).partner);
      const rec = cradle.get(s.id);
      if (rec) ensureIdentity(rec);
      const match = here.find((o) => {
        const orec = cradle.get(o.id);
        if (orec) ensureIdentity(orec);
        return orec && rec && drawnTo(rec, orec) && drawnTo(orec, rec) && kinOK(rec, orec);
      });
      if (!match) return null;
      household(s).partner = match.id;
      household(match).partner = s.id;
      for (const p of [s, match]) { const r = cradle.get(p.id); if (r) { r.partner = p === s ? match.id : s.id; cradle.put(r); cradle.note(r.id, `Married at ${st?.name ?? "the port"}`); } }
      company.confidence = Math.min(1, (company.confidence ?? 0.5) + 0.02);
      return note("marriage", s, `${s.name} and ${match.name} were married at ${st?.name ?? "the port"}. Both stay on the rolls.`, st?.id);
    },
  },
  {
    id: "birth", good: true,
    weight: (s, st) => (household(s).partner && (household(s).children?.length ?? 0) < 4 ? 2.2 : 0),
    run(s, st) { return bearChild(s, st); },
  },
  {
    id: "feud",
    weight: (s, st) => 0.8 + traitOf(s, "greed") * 1.1 - traitOf(s, "loyalty") * 0.5,
    run(s, st) {
      const here = staffAt(s.stationId).filter((o) => o.id !== s.id);
      if (!here.length) return null;
      const o = here[Math.floor(roll(`${s.id}:feud:${sim.time}`) * here.length)];
      s.mood = (s.mood ?? 70) - 12;
      o.mood = (o.mood ?? 70) - 8;
      return note("feud", s, `${s.name} and ${o.name} are not speaking. The floor at ${st?.name ?? "the port"} has taken a side.`, st?.id);
    },
  },
  {
    id: "strike",
    weight: (s, st) => ((s.mood ?? 70) < 45 ? 1.6 + (45 - (s.mood ?? 70)) / 20 : 0),
    run(s, st) {
      const lost = Math.round(s.income * 3);
      company.treasury = Math.max(0, company.treasury - lost);
      s.onStrikeUntil = hoursAt(sim.time) + 24;
      company.confidence = Math.max(0, (company.confidence ?? 0.5) - 0.05);
      return note("strike", s, `${s.name} has stopped work at ${st?.name ?? "the port"} over the rate. Three cycles of their share gone.`, st?.id, -lost);
    },
  },
  {
    id: "firing",
    weight: (s, st) => ((s.mood ?? 70) < 38 ? 1.1 : 0.06) + traitOf(s, "greed") * 0.35 - traitOf(s, "loyalty") * 0.4,
    run(s, st) {
      removeStaff(s, "let go");
      const corp = st ? corpOfStation(st) : null;
      if (corp) adjustStanding(corp.id, -1, `${s.name} let go at ${st.name}`);
      return note("firing", s, `${s.name} was let go at ${st?.name ?? "the port"}. The address stays in the book.`, st?.id);
    },
  },
  {
    id: "accident",
    weight: (s, st) => 0.3 + (st?.sector === "industrial" ? 0.4 : 0) - traitOf(s, "caution") * 0.4,
    run(s, st) {
      const survived = roll(`${s.id}:acc:${sim.time}`) > 0.12;
      if (survived) {
        s.mood = (s.mood ?? 70) - 15;
        return note("accident", s, `A press line let go at ${st?.name ?? "the port"}. ${s.name} will keep the hand. The floor is shut for a cycle.`, st?.id);
      }
      return kill(s, st, `an industrial accident`);
    },
  },
  {
    id: "incident",
    weight: (s, st) => (st?.sector === "pirate" || st?.hostile ? 1.0 : 0.08) + traitOf(s, "greed") * 0.3,
    run(s, st) {
      const survived = roll(`${s.id}:inc:${sim.time}`) > 0.22;
      if (survived) {
        s.mood = (s.mood ?? 70) - 20;
        return note("incident", s, `${s.name} was jumped in a service corridor at ${st?.name ?? "the port"} and is not saying by whom.`, st?.id);
      }
      return kill(s, st, `an incident the port has closed the file on`);
    },
  },
  {
    id: "transfer",
    weight: (s) => 0.5 + traitOf(s, "curiosity") * 1.1,
    run(s, st) {
      const elsewhere = company.staff.filter((o) => o.stationId !== s.stationId).map((o) => o.stationId);
      const to = elsewhere.length ? stationById(elsewhere[Math.floor(roll(`${s.id}:tr:${sim.time}`) * elsewhere.length)]) : null;
      if (!to) return null;
      s.stationId = to.id;
      const rec = cradle.get(s.id);
      if (rec) { rec.station = to.id; cradle.note(rec.id, `Transferred to ${to.name}`); }
      return note("transfer", s, `${s.name} has moved to ${to.name}. Same rolls, different floor.`, to.id);
    },
  },
];

export const ACTIVITY_K = {
  accident: { work: 2.2, sleep: 0.1, family: 0.4, own: 0.5, meal: 0.3, supper: 0.3 },
  incident: { own: 1.6, work: 0.6, sleep: 0.3, family: 0.5 },
  marriage: { family: 1.2, own: 1.5, work: 0.4, sleep: 0.3 },
  birth: { family: 1.6, work: 0.5 },
  commendation: { work: 1.8, sleep: 0.4 },
  windfall: { work: 1.4, own: 1.2 },
  feud: { work: 1.3, own: 1.2, sleep: 0.2 },
};

function kinOK(a, b) {
  const ga = genomeOf(a), gb = genomeOf(b);
  if (!ga || !gb) return true;
  try { return kinship(ga, gb) < 0.22; } catch { return true; }
}

function household(s) {
  stationLife.households[s.id] ??= { partner: null, children: [], since: sim.time };
  return stationLife.households[s.id];
}

function removeStaff(s, why) {
  const i = company.staff.indexOf(s);
  if (i >= 0) company.staff.splice(i, 1);
  const h = household(s);
  if (h.partner) { const p = household({ id: h.partner }); p.partner = null; }
  const rec = cradle.get(s.id);
  if (rec) { rec.status = "pool"; rec.employer = null; cradle.note(rec.id, `Off ${company.name}'s rolls — ${why}`); }
}

function kill(s, st, how) {
  removeStaff(s, how);
  const rec = cradle.get(s.id);
  if (rec) { rec.status = "dead"; rec.diedAt = sim.time; cradle.note(rec.id, `Died at ${st?.name ?? "a port"} — ${how}`); markDead(rec.id, `at ${st?.name ?? "a port"} — ${how}`); }
  company.confidence = Math.max(0, (company.confidence ?? 0.5) - 0.06);
  for (const o of staffAt(s.stationId)) o.mood = (o.mood ?? 70) - 10;
  const h = household(s);
  const heir = (h.children ?? []).map((id) => stationLife.kids.find((k) => k.id === id)).find(Boolean);
  const text = `${s.name} died at ${st?.name ?? "a port"} — ${how}.${heir ? ` ${heir.name} is on the books as theirs.` : ""}`;
  post({ channel: "gnn", from: "COMPANY", text, tone: "bad" });
  return note("death", s, text, st?.id);
}

export function bearChild(s, st, sireOverride = null) {
  const h = household(s);
  const partnerId = sireOverride ?? h.partner;
  const a = cradle.get(s.id);
  const b = partnerId ? cradle.get(partnerId) : null;
  if (a) ensureIdentity(a);
  if (b) ensureIdentity(b);
  if (!a) return null;
  const seed = `${s.id}:${partnerId ?? "solo"}:${Math.round(sim.time)}:${stationLife.kids.length}`;
  const genome = a.genome && b?.genome ? safeBreed(a.genome, b.genome, seed) : null;
  const raceId = (seed.length % 2 && b ? b : a).raceId ?? a.raceId;
  const child = generateNPC(`stationchild:${seed}`, { raceId, letter: "F", genome: genome ?? undefined, parents: [a.id, b?.id].filter(Boolean), newborn: true });
  child.parents = [a.id, b?.id].filter(Boolean);
  child.status = "dependant";
  child.title = "Child";
  child.complexName = "—";
  child.letter = "—";
  child.station = s.stationId;
  if (genome) {
    child.genome = packGenome(genome, SPACER);
    child.genomeType = SPACER;
    child.fingerprint = fingerprint(genome, SPACER);
    child.traits = genomeTraits(genome);
    child.aptitude = skillAptitude(genome);
    const id = genomeIdentity(genome);
    child.gender = id.gender;
    child.pronouns = PRONOUNS[id.gender];
    child.attractedTo = id.attractedTo;
  }
  const surname = childFamily(b ?? a, a, child.gender, child.raceId ?? raceId, nameRng(`sname:${seed}`));
  child.name = surname ? `${child.name.split(" ")[0]} ${surname}` : child.name.split(" ")[0];
  gdbFile(child, { kind: "born", place: s.stationId, group: [a, b, ...h.children.map((id) => cradle.get(id))].filter(Boolean) });
  const kid = { id: child.id, name: child.name, parents: child.parents, stationId: s.stationId, age: 0, gender: child.gender, pronouns: child.pronouns };
  stationLife.kids.push(kid);
  h.children.push(child.id);
  if (b) household({ id: b.id }).children.push(child.id);
  return note("birth", s, `${child.name} was born at ${st?.name ?? "the port"} — ${s.name}${b ? ` and ${b.name}` : ""}'s. On the books as a dependant.`, st?.id);
}

function safeBreed(a, b, seed) {
  try { return breed(a, b, seed, SPACER); } catch { return null; }
}

export function carryPregnancyAshore(carrierId, sireId, cyclesLeft, stationId) {
  const s = company.staff.find((x) => x.id === carrierId);
  if (!s) return null;
  household(s).expecting = { sire: sireId, due: Math.max(1, cyclesLeft) };
  const st = stationById(stationId ?? s.stationId);
  return note("expecting", s, `${s.name} settled at ${st?.name ?? "the port"} expecting. The company's first station birth is on the way.`, st?.id);
}

export function tickStationLife() {
  if (!company.founded) return;
  const cycle = Math.round((sim.time ?? 0) / 90);

  for (const k of [...stationLife.kids]) {
    k.age++;
    if (k.age < STATION_ADULT) continue;
    stationLife.kids.splice(stationLife.kids.indexOf(k), 1);
    const rec = cradle.get(k.id);
    const st = stationById(k.stationId);
    if (!rec) continue;
    const parent = company.staff.find((s) => k.parents.includes(s.id));
    const cx = parent ? COMPLEXES[parent.complexId] : null;
    rec.status = "staff";
    rec.employer = company.name;
    rec.station = k.stationId;
    rec.complexId = parent?.complexId ?? rec.complexId;
    rec.complexName = (cx?.name ?? rec.complexName ?? "—").replace(/ Complex$/, "");
    rec.letter = "E";
    rec.title = cx?.ranks?.find((r) => r.letter === "E")?.title ?? "Hand";
    cradle.put(rec);
    const base = Math.round((parent ? parent.baseIncome ?? parent.income : 40) * 0.8);
    company.staff.push({
      id: rec.id, name: rec.name, title: rec.title, complexId: rec.complexId, complexName: rec.complexName,
      letter: rec.letter, traits: rec.traits, gender: rec.gender, pronouns: rec.pronouns, attractedTo: rec.attractedTo,
      raceId: rec.raceId, stationId: k.stationId, sky: sim.skySeed ?? null, baseIncome: base, income: base,
      since: sim.time, family: [], role: "staff", mood: 78, cycles: 0, born: true,
    });
    note("coming-of-age", rec, `${rec.name} has come of age at ${st?.name ?? "the port"} and gone onto the rolls — family, not a hire.`, k.stationId);
  }

  for (const s of [...company.staff]) {
    const st = stationById(s.stationId);
    s.baseIncome ??= s.income;
    s.cycles = (s.cycles ?? 0) + 1;
    s.mood ??= 74;
    const target = 55 + (company.confidence ?? 0.5) * 40 + (st?.hostile ? -20 : 0) + moodLift(s);
    s.mood += (target - s.mood) * 0.12;

    if (s.transit) continue;

    const h = household(s);
    if (h.expecting) {
      h.expecting.due--;
      if (h.expecting.due <= 0) { const sire = h.expecting.sire; h.expecting = null; bearChild(s, st, sire); }
      continue;
    }

    const r = roll(`${s.id}:life:${cycle}`);
    if (r > EVENT_CHANCE) continue;
    const act = planAt(s, hoursAt(sim.time)).id;
    const weights = EVENTS.map((e) => Math.max(0, e.weight(s, st)) * (ACTIVITY_K[e.id]?.[act] ?? 1));
    const total = weights.reduce((a, b) => a + b, 0);
    if (total <= 0) continue;
    let pick = roll(`${s.id}:pick:${cycle}`) * total;
    for (let i = 0; i < EVENTS.length; i++) {
      pick -= weights[i];
      if (pick <= 0) { EVENTS[i].run(s, st); break; }
    }
  }
}

export function townReport(stationId = null) {
  const rows = company.staff
    .filter((s) => !stationId || s.stationId === stationId)
    .map((s) => {
      const h = household(s);
      return {
        s, role: roleAt(s.role), income: incomeOf(s), mood: Math.round(s.mood ?? 74), cycles: s.cycles ?? 0,
        partner: h.partner ? company.staff.find((o) => o.id === h.partner)?.name ?? cradle.get(h.partner)?.name ?? null : null,
        children: (h.children ?? []).map((id) => stationLife.kids.find((k) => k.id === id)?.name ?? cradle.get(id)?.name).filter(Boolean),
        expecting: h.expecting ? h.expecting.due : null,
        station: stationById(s.stationId)?.name ?? "—",
        risk: (s.mood ?? 74) < 40 ? "at risk of walking" : (s.mood ?? 74) < 55 ? "unsettled" : "",
      };
    });
  rows.sort((a, b) => b.income - a.income);
  return rows;
}

export function townLog(stationId = null, n = 14) {
  return stationLife.log.filter((e) => !stationId || e.stationId === stationId).slice(0, n);
}

export function townLine() {
  const rows = townReport();
  if (!rows.length) return "Nobody settled yet — a hand with a family and a port is how a company gets a town.";
  const kids = stationLife.kids.length;
  const risk = rows.filter((r) => r.risk).length;
  return `${rows.length} on the rolls · ${rows.reduce((a, r) => a + r.income, 0)} cr/cycle · ${kids} child${kids === 1 ? "" : "ren"} growing${risk ? ` · ${risk} unsettled` : ""}`;
}
