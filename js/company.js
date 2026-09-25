/* LIVING GALAXY — your corporation.
 *
 * Ported in shape from Living Galaxy's systems/company (lg-1.04.00): a charter,
 * a treasury separate from the pilot's pocket, a book that remembers every
 * credit in and out, three board seats in deliberate tension (growth,
 * solvency, charter), and a confidence number that is what the board thinks
 * of the whole record. Slimmed for Astra: no shares market, no contracted
 * fleet yet (that is the next port), and the company's *people* are the
 * point — crew you settle at a port with their families become staff who
 * earn the company a wage share every cycle, or alumni you paid off and can
 * still find again.
 *
 * Charters are Astra's sectors, so what a port is short of and what your
 * charter says you do are the same vocabulary.
 */

import { logEvent, sim } from "./sim.js";
import { pilot } from "./pilot.js";
import { stationById } from "./stations.js";
import { corpOfStation, adjustStanding } from "./corps.js";
import { wageFor, CYCLE_SECONDS } from "./crew.js";
import { cradle } from "./npc/cradle.js";
import { tickStationLife, incomeOf, resetStationLife, stationLife } from "./stationlife.js";
import { tickLine, cutOf } from "./staffline.js";
import { tickStaffHour, takeWorked, cyclePay, housingCost } from "./stafflife.js";
import { CLOCK } from "./stationclock.js";

export const CHARTERS = {
  military:     { name: "Security Charter",     desc: "Escort, denial and ordnance. Paid by whoever is frightened.",              revenue: ["bounty", "escort"] },
  industrial:   { name: "Extraction Charter",   desc: "Rock, refining and fabrication. The front of every supply chain.",         revenue: ["ore", "mineral", "smelt"] },
  logistic:     { name: "Freight Charter",      desc: "Routes, tonnage and schedules. Boring, and it never stops paying.",        revenue: ["haul", "trade"] },
  civilian:     { name: "Trading Charter",      desc: "Spreads, contracts and paper. You move the difference, not the cargo.",    revenue: ["trade", "salvage"] },
  agricultural: { name: "Provisioning Charter", desc: "Water, food, air. The things a port stops arguing about when it runs out.", revenue: ["water", "trade"] },
};
export const CHARTER_KEYS = Object.keys(CHARTERS);

export const BOARD = [
  { key: "growth",   name: "Vahn Iridis",       role: "Expansion", wants: "assets",   line: "Build. Idle capital is capital somebody else is using." },
  { key: "solvency", name: "Auditor Peleg",     role: "Solvency",  wants: "treasury", line: "I do not care what you built. I care what it cost to keep." },
  { key: "charter",  name: "Registrar Sowande", role: "Charter",   wants: "focus",    line: "The charter is what the licence is for. Operate inside it." },
];

export const COMPANY = {
  registration: 2500,     // credits the registrar wants
  staffShare: 0.32,       // of a settled hand's list wage the company books every cycle (0.3.47: was 0.45 — money for nothing, forever)
  dependantShare: 0.08,   // a child's stipend claimed from the port, per cycle
  severance: 3,           // cycles of wage a pay-off costs
  settleFee: 400,         // what a port charges to file a family
};

export const company = {
  founded: false,
  name: "",
  charter: "industrial",
  foundedAt: 0,
  hq: null,               // stationId of the registered office
  hqSky: null,            // the sky that station is in — generated ids repeat across skies
  treasury: 0,
  book: [],               // { at, text, delta, kind }
  revenue: 0, spend: 0,
  inCharter: 0, outCharter: 0,
  confidence: 0.5,
  staff: [],              // settled hands: { id, name, title, stationId, income, since, family: [ids], role }
  alumni: [],             // paid off, recorded for future contact: { id, name, stationId, at, why, family: [ids] }
  payPool: 0,
};

export const hasCompany = () => company.founded;

/* staff and alumni are filed under sky-local station ids; entries from before skies were recorded match anywhere */
const inThisSky = (e) => e.sky == null || e.sky === sim.skySeed;

function book(text, delta, kind = "note") {
  company.book.unshift({ at: sim.time, text, delta, kind });
  if (company.book.length > 60) company.book.length = 60;
  if (delta > 0) company.revenue += delta; else company.spend -= delta;
  save();
}

/** 0.3.53: a line of spending from the care menu (js/staffcare.js). */
export function bookSpend(text, amount, kind = "care") { book(text, -Math.abs(amount), kind); }

export function suggestName() {
  const heads = ["Farside", "Longreach", "Cinder", "Meridian", "Halyard", "Quill", "Ninefold", "Bright Arc", "Tallgrass", "Ferrous"];
  const tails = { military: "Security", industrial: "Extraction", logistic: "Freight", civilian: "Trading", agricultural: "Provisions" };
  const h = heads[Math.floor((sim.time * 7 + (pilot.name?.length ?? 3)) % heads.length)];
  return `${h} ${tails[company.charter] ?? "Holdings"}`;
}

/** Incorporate at the port you are clamped to. Returns null or the reason it failed. */
export function foundCompany(name, charter = "industrial") {
  if (company.founded) return "You already hold a charter";
  const st = stationById(sim.ship.dockedAt);
  if (!st) return "Register at a port — dock first";
  if (st.hostile && !st.claimed) return "A free port keeps no registrar";
  if (!CHARTERS[charter]) return "No such charter";
  if (sim.ship.credits < COMPANY.registration) return `The registrar wants ${COMPANY.registration} cr`;
  sim.ship.credits -= COMPANY.registration;
  company.founded = true;
  company.name = String(name || suggestName()).slice(0, 28);
  company.charter = charter;
  company.foundedAt = sim.time;
  company.hq = st.id;
  company.hqSky = sim.skySeed ?? null;
  company.shareV = COMPANY.staffShare;
  company.treasury = 0;
  company.book.length = 0;
  company.staff.length = 0;
  company.confidence = 0.5;
  book(`${company.name} incorporated at ${st.name} — ${CHARTERS[charter].name}`, -COMPANY.registration, "found");
  const host = corpOfStation(st);
  if (host) adjustStanding(host.id, 6, "registered a company at their port");
  sim.notice = `${company.name} is registered. ${CHARTERS[charter].name}, office at ${st.name}.`;
  logEvent(`Incorporated ${company.name} (${CHARTERS[charter].name}) at ${st.name}`, "company");
  return null;
}

/** Move money between your pocket and the treasury (negative = draw). */
export function transfer(amount) {
  if (!company.founded) return "No company";
  if (amount > 0) {
    if (sim.ship.credits < amount) return "Not that much aboard";
    sim.ship.credits -= amount; company.treasury += amount;
    book(`Founder capital in`, amount, "capital");
  } else {
    const draw = Math.min(-amount, company.treasury);
    if (draw <= 0) return "Treasury is empty";
    company.treasury -= draw; sim.ship.credits += draw;
    book(`Founder draw`, -draw, "draw");
  }
  return null;
}

/** Pay from the treasury (drones, commissions). Returns why not, or null. */
export function treasuryPay(amount, text, kind = "drones") {
  if (!company.founded) return "No company";
  if (company.treasury < amount) return `Treasury needs ${Math.round(amount).toLocaleString()} cr (has ${Math.round(company.treasury).toLocaleString()})`;
  company.treasury -= amount;
  book(text, -amount, kind);
  return null;
}

/** Money the company's drones and hulls bring in lands in the treasury, not your pocket. */
export function treasuryEarn(amount, text, kind = "drones") {
  if (!company.founded || !(amount > 0)) return 0;
  company.treasury += amount;
  book(text, amount, kind);
  return amount;
}

/** Revenue the pilot earns that the charter covers (or does not). sim.js calls this from trade and bounties. */
export function bookRevenue(kind, amount, text) {
  if (!company.founded || amount <= 0) return;
  const inside = CHARTERS[company.charter].revenue.includes(kind);
  if (inside) company.inCharter += amount; else company.outCharter += amount;
  book(`${text} (${inside ? "in charter" : "off charter"})`, 0, "revenue");
}

/* ---- people --------------------------------------------------------------- */

/** A settled hand's cycle income to the company. */
export function staffIncome(m) {
  const list = m.listWage ?? m.wage ?? wageFor(m.complexId, m.letter);
  return Math.round(list * COMPANY.staffShare);
}

/**
 * Settle a crew member (and whoever is theirs) at a port as company staff.
 * They earn the company a share of a wage every cycle and stay on the books.
 */
export function settleAsStaff(m, family = [], st = stationById(sim.ship.dockedAt)) {
  if (!company.founded) return "No company to settle them with — register a charter first";
  if (!st) return "Dock first";
  if (st.hostile && !st.claimed) return "A free port takes no families";
  if (sim.ship.credits < COMPANY.settleFee) return `The port wants ${COMPANY.settleFee} cr to file a household`;
  sim.ship.credits -= COMPANY.settleFee;
  const income = staffIncome(m);
  /* 0.3.46: what they thought of you aboard comes ashore with them — the
   * company line (js/staffline.js) reads it as their regard for the firm */
  const listWage = m.listWage ?? m.wage ?? wageFor(m.complexId, m.letter);
  company.staff.push({ id: m.id, name: m.name, title: m.title, complexId: m.complexId, complexName: m.complexName, letter: m.letter, traits: m.traits, gender: m.gender, pronouns: m.pronouns, attractedTo: m.attractedTo, raceId: m.raceId, stationId: st.id, sky: sim.skySeed ?? null, income, baseIncome: income, listWage, trustAboard: m.trust ?? 50, since: sim.time, family: family.map((f) => f.id), role: "staff", mood: 78, cycles: 0 });
  book(`${m.name} settled at ${st.name} as staff${family.length ? ` with ${family.length} of theirs` : ""}`, -COMPANY.settleFee, "staff");
  const rec = cradle.get(m.id);
  if (rec) { rec.status = "staff"; rec.employer = company.name; rec.station = st.id; cradle.note(rec.id, `Settled at ${st.name} on ${company.name}'s books`); }
  for (const f of family) { const r = cradle.get(f.id); if (r) { r.status = "dependant"; r.station = st.id; cradle.note(r.id, `Settled at ${st.name} with ${m.name}`); } }
  logEvent(`${m.name} settled at ${st.name} — ${income} cr/cycle to ${company.name}`, "company");
  return null;
}

/** Pay someone off and let them go, but keep the address. */
export function payOffAndRecord(m, family = [], why = "paid off", st = stationById(sim.ship.dockedAt)) {
  const wage = m.wage ?? wageFor(m.complexId, m.letter);
  const cost = Math.round(wage * COMPANY.severance);
  if (sim.ship.credits < cost) return `Severance is ${cost} cr`;
  sim.ship.credits -= cost;
  const where = st?.id ?? null;
  company.alumni.unshift({ id: m.id, name: m.name, title: m.title, complexId: m.complexId, letter: m.letter, stationId: where, sky: sim.skySeed ?? null, at: sim.time, why, family: family.map((f) => f.id), severance: cost });
  if (company.alumni.length > 80) company.alumni.length = 80;
  if (company.founded) book(`${m.name} ${why} — severance`, -cost, "severance");
  const rec = cradle.get(m.id);
  if (rec) { rec.status = "pool"; rec.employer = null; rec.station = where; rec.lastContact = { station: where, at: sim.time, by: company.name || pilot.name }; cradle.note(rec.id, `${why[0].toUpperCase()}${why.slice(1)} at ${st?.name ?? "space"} by ${company.name || pilot.name}; ${cost} cr severance`); }
  for (const f of family) { const r = cradle.get(f.id); if (r) { r.status = "pool"; r.station = where; cradle.note(r.id, `Left with ${m.name} at ${st?.name ?? "space"}`); } }
  logEvent(`${m.name} ${why} at ${st?.name ?? "space"} — ${cost} cr severance, address kept`, "company");
  return null;
}

/** Everyone the company can still reach: staff at their ports, alumni where they were last seen. */
export function contacts() {
  const out = [];
  for (const s of company.staff) out.push({ ...s, kind: "staff", where: inThisSky(s) ? stationById(s.stationId)?.name ?? "—" : "another sky" });
  for (const a of company.alumni) out.push({ ...a, kind: "alumni", where: inThisSky(a) ? stationById(a.stationId)?.name ?? "last seen in space" : "another sky" });
  return out;
}

/** Staff at this port who could be re-signed (walk into the hall and they come back aboard). */
export function staffAt(stId) {
  return company.staff.filter((s) => s.stationId === stId && inThisSky(s) && !s.transit); // 0.3.46: not while on a liner
}

/** Take a settled hand back aboard. */
export function recallStaff(id) {
  const i = company.staff.findIndex((s) => s.id === id);
  if (i < 0) return null;
  const s = company.staff.splice(i, 1)[0];
  book(`${s.name} recalled to the ship`, 0, "staff");
  const rec = cradle.get(s.id);
  if (rec) { rec.status = "pool"; cradle.note(rec.id, `Recalled aboard by ${company.name}`); }
  return s;
}

/* ---- the board ------------------------------------------------------------- */

export function boardBrief() {
  const c = company;
  const total = c.inCharter + c.outCharter;
  const focus = total > 0 ? c.inCharter / total : 1;
  const growth = Math.min(1, c.staff.length / 6 + Math.min(0.5, c.revenue / 20000));
  const solvency = c.treasury >= 0 ? Math.min(1, 0.5 + c.treasury / 10000) : 0.2;
  const seats = [
    { ...BOARD[0], mood: growth, verdict: growth > 0.6 ? "content" : growth > 0.3 ? "impatient" : "restless" },
    { ...BOARD[1], mood: solvency, verdict: solvency > 0.7 ? "content" : solvency > 0.4 ? "watchful" : "alarmed" },
    { ...BOARD[2], mood: focus, verdict: focus > 0.7 ? "content" : focus > 0.4 ? "pointed" : "hostile" },
  ];
  return { seats, confidence: c.confidence, staffIncome: c.staff.reduce((a, s) => a + (s.transit ? 0 : Math.round(incomeOf(s) * cutOf(s))), 0) };
}

/** Every cycle: staff earn, dependants draw, the board re-reads the record. */
export function tickCompany(seconds) {
  if (!company.founded) return;
  /* 0.3.52: the hours first — people go to work, eat and sleep on port time
   * (js/stafflife.js) — then the cycle pays for what they did in them */
  company.hourPool = (company.hourPool ?? 0) + seconds;
  company.payPool += seconds;
  while (company.hourPool >= CLOCK.hourS || company.payPool >= CYCLE_SECONDS) {
    if (company.hourPool >= CLOCK.hourS && (company.hourPool - CLOCK.hourS) >= (company.payPool - CYCLE_SECONDS)) {
      company.hourPool -= CLOCK.hourS;
      tickStaffHour((sim.time ?? 0) - company.hourPool);
      continue;
    }
    company.payPool -= CYCLE_SECONDS;
    let earned = 0;
    for (const s of company.staff) {
      if (!inThisSky(s)) continue; // their port is in a sky that is not loaded; the books catch up when it is
      if (s.transit) continue;     // 0.3.46: nobody earns on a liner
      /* 0.3.46: a raise on the company line is their share, out of ours.
       * 0.3.52: a retainer, and the rest for the hours they actually worked */
      earned += Math.round(cyclePay(incomeOf(s) * cutOf(s), takeWorked(s)));
      /* the port pays a stipend for every child on the books — a company town in miniature */
      earned += Math.round((s.family?.length ?? 0) * s.income * COMPANY.dependantShare);
    }
    if (earned > 0) { company.treasury += earned; book(`Staff wages booked (${company.staff.length} on the rolls)`, earned, "wages"); }
    const rent = housingCost();
    if (rent > 0) { company.treasury -= rent; book(`Housing for the staff`, -rent, "housing"); }
    /* and then they get on with their lives — and pick up the phone */
    tickStationLife();
    tickLine();
    const b = boardBrief();
    const target = b.seats.reduce((a, s) => a + s.mood, 0) / 3;
    company.confidence += (target - company.confidence) * 0.25;
  }
}

export function companyReport() {
  const c = company;
  return {
    founded: c.founded, name: c.name, charter: CHARTERS[c.charter]?.name ?? c.charter, hq: (c.hqSky == null || c.hqSky === sim.skySeed ? stationById(c.hq)?.name : null) ?? "—",
    treasury: Math.round(c.treasury), revenue: Math.round(c.revenue), spend: Math.round(c.spend),
    staff: c.staff.filter(inThisSky).length, alumni: c.alumni.filter(inThisSky).length, confidence: Math.round(c.confidence * 100),
    board: boardBrief().seats.map((s) => `${s.name} (${s.role}): ${s.verdict}`),
  };
}

/* the company is the pilot's, not the sky's: it lives in localStorage beside the save */
const SAVE_KEY = "lgaa-company";
let loaded = false;
let saveTimer = 0;
function flushSave() {
  saveTimer = 0;
  try { localStorage.setItem(SAVE_KEY, JSON.stringify(serializeCompany())); } catch { /* quota, or no window */ }
}
/* the book writes a line per credit moved: coalesce the stringify, and flush before the tab goes */
function save() {
  if (saveTimer) return;
  saveTimer = setTimeout(flushSave, 1500);
  saveTimer.unref?.(); // node: do not hold the process open for a save
}
export const saveCompany = save;
/** Write a pending debounced save now (the account sync snapshots storage and must not read a 1.5 s-old book). */
export function flushCompany() { if (saveTimer) { clearTimeout(saveTimer); flushSave(); } }
if (globalThis.window?.addEventListener) window.addEventListener("pagehide", () => { if (saveTimer) { clearTimeout(saveTimer); flushSave(); } });
export function loadCompany() {
  if (loaded) return;
  loaded = true;
  try {
    const raw = typeof localStorage !== "undefined" ? localStorage.getItem(SAVE_KEY) : null;
    if (raw) restoreCompany(JSON.parse(raw));
  } catch { /* corrupt or absent */ }
}

export function resetCompany() {
  if (saveTimer) { clearTimeout(saveTimer); saveTimer = 0; }
  try { localStorage.removeItem(SAVE_KEY); } catch { /* ignore */ }
  company.founded = false; company.name = ""; company.hq = null; company.hqSky = null; company.treasury = 0;
  company.book.length = 0; company.staff.length = 0; company.alumni.length = 0;
  company.revenue = 0; company.spend = 0; company.inCharter = 0; company.outCharter = 0; company.confidence = 0.5; company.payPool = 0; company.hourPool = 0;
  company.line = { inbox: [], seq: 1 };
  company.shareV = COMPANY.staffShare;
  resetStationLife();
}

/* 0.3.46: the towns ride in the company's save. Households, the children
 * growing up on the stations and the town log were never written anywhere, so
 * a reload quietly un-married everybody and the kids were gone. Same key, no
 * new storage: they are the company's people. */
export function serializeCompany() {
  if (!company.founded) return null;
  const life = { households: stationLife.households, kids: stationLife.kids, standing: stationLife.standing, log: stationLife.log.slice(0, 30) };
  return { ...company, book: company.book.slice(0, 30), line: company.line ? { ...company.line, inbox: company.line.inbox.slice(0, 30) } : undefined, life };
}
export function restoreCompany(data) {
  if (!data || !data.founded) return;
  const { life, ...rest } = data;
  Object.assign(company, rest);
  company.shareV = rest.shareV ?? null;   // a save from before the stamp has none
  /* 0.3.49: 0.3.47 cut the staff share 45% → 32%, but only for hands settled
   * after it; everyone already on the rolls kept booking 45% forever. Re-rate
   * them once, off their list wage. Station-born family keep their own number. */
  if (company.shareV !== COMPANY.staffShare) {
    for (const s of company.staff) {
      if (s.born) continue;
      const list = s.listWage ?? wageFor(s.complexId, s.letter);
      if (!(list > 0)) continue;
      s.baseIncome = Math.round(list * COMPANY.staffShare);
      s.income = incomeOf(s);
    }
    company.shareV = COMPANY.staffShare;
  }
  if (life) {
    stationLife.households = life.households ?? {};
    stationLife.kids.splice(0, stationLife.kids.length, ...(life.kids ?? []));
    stationLife.standing = life.standing ?? {};
    stationLife.log.splice(0, stationLife.log.length, ...(life.log ?? []));
  }
}

/** Console access. */
export function wireCompany() {
  if (globalThis.window?.__lg) window.__lg.company = { company, foundCompany, transfer, settleAsStaff, payOffAndRecord, contacts, recallStaff, boardBrief, tickCompany, companyReport, CHARTERS };
}
