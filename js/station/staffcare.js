import { company, bookSpend } from "../corp/company.js";
import { sim } from "../sim/sim.js";
import { stationById } from "./stations.js";
import { incomeOf } from "./stationlife.js";
import { HOURS, HOUSING, SHIFT_PAY, ensureLife, jobsFor, log } from "./stafflife.js";
import { SHIFTS, SHIFT_IDS, CLOCK, clockAt, hoursAt, hoursIntoShift } from "./stationclock.js";

export const CARE_COST = { meal: 8, night: 30, courseCycles: 4, courseMin: 120 };
const first = (s) => String(s?.name ?? "").split(" ")[0] || "They";
const tr = (s, k) => s?.traits?.[k] ?? 0.5;
const mood = (s, d) => { s.mood = Math.max(0, Math.min(100, (s.mood ?? 74) + d)); };
const H = () => hoursAt(sim.time ?? 0);
const dayIx = () => Math.floor(H() / CLOCK.dayH);

function canPay(n) { return company.treasury >= n || (sim.ship?.credits ?? 0) >= n; }
function payFrom(n, text) {
  if (company.treasury >= n) { company.treasury -= n; bookSpend(text, n); return true; }
  if ((sim.ship?.credits ?? 0) >= n) { sim.ship.credits -= n; bookSpend(`${text} (from your pocket)`, 0); return true; }
  return false;
}
const note = (s, text) => log(s, clockAt(sim.time ?? 0), text);

export function workOptions(s) {
  ensureLife(s);
  const st = stationById(s.stationId);
  return {
    jobs: jobsFor(st),
    shifts: SHIFT_IDS.map((id) => ({ id, label: `${id} ${String(SHIFTS[id].start).padStart(2, "0")}:00${SHIFT_PAY[id] > 1 ? ` · +${Math.round((SHIFT_PAY[id] - 1) * 100)}%` : ""}` })),
    hours: Object.values(HOURS).map((h) => ({ id: h.id, label: h.label })),
    housing: Object.values(HOUSING).map((h) => ({ id: h.id, label: `${h.label}${h.cost ? ` · ${h.cost} cr/cyc` : " · free"}` })),
  };
}

export function setJob(s, job) {
  ensureLife(s);
  if (s.transit) return "not while they are travelling";
  if (!jobsFor(stationById(s.stationId)).includes(job)) return "their port has no such job";
  if (s.job === job) return null;
  s.job = job;
  mood(s, tr(s, "curiosity") > 0.6 ? 1.5 : -1);
  note(s, `moved to the ${job}`);
  return null;
}

export function setShift(s, shift) {
  ensureLife(s);
  if (!SHIFTS[shift]) return "no such shift";
  if (s.transit) return "not while they are travelling";
  if (s.shift === shift) return null;
  const was = s.shift;
  s.shift = shift;
  mood(s, shift === "night" ? (tr(s, "greed") > 0.6 ? 0 : -3) : was === "night" ? 2 : -0.5);
  note(s, `put on the ${SHIFTS[shift].label}`);
  return null;
}

export function setHours(s, hours) {
  ensureLife(s);
  if (!HOURS[hours]) return "no such hours";
  if (s.hours === hours) return null;
  s.hours = hours;
  const greedy = tr(s, "greed") > 0.6;
  mood(s, hours === "overtime" ? (greedy ? 2 : -3) : hours === "part" ? (greedy ? -2 : 2) : 0.5);
  note(s, `hours set to ${HOURS[hours].label.toLowerCase()}`);
  return null;
}

export function setHousing(s, housing) {
  ensureLife(s);
  const h = HOUSING[housing];
  if (!h) return "no such housing";
  if (s.housing === housing) return null;
  const up = h.cost > (HOUSING[s.housing]?.cost ?? 0);
  s.housing = housing;
  mood(s, up ? 4 : -4);
  note(s, up ? `moved into ${h.label.toLowerCase()}` : `moved back to ${h.label.toLowerCase()}`);
  return null;
}

function nextShift(s) {
  const W = HOURS[s.hours]?.h ?? 8;
  const into = hoursIntoShift(SHIFTS[s.shift]?.start ?? 6, H());
  const from = into < 1 ? H() - into : H() + (CLOCK.dayH - into);
  const at = Math.round(from);
  return { from: at, to: at + W };
}

export const CARE = [
  {
    id: "dayoff", label: "Day off",
    hint: () => "their next shift given back · no pay for it",
    ok(s) {
      if (s.transit) return "travelling";
      if (s.offShift) return s.offShift.kind === "course" ? "on a course that shift" : "already has one coming";
      if (s.lastDayOff === dayIx()) return "one a day";
      return null;
    },
    run(s) {
      const n = nextShift(s);
      s.offShift = { ...n, kind: "off" };
      s.lastDayOff = dayIx();
      mood(s, 4);
      note(s, "given a day off");
      return tr(s, "loyalty") > 0.65 ? `${first(s)}: "You sure? …All right. Thank you."` : `${first(s)}: "I won't argue."`;
    },
  },
  {
    id: "meal", label: "Stand them a meal",
    hint: () => `${CARE_COST.meal} cr · fed, and a little less alone`,
    ok(s) {
      if (s.transit) return "travelling";
      if (s.lastMealH != null && H() - s.lastMealH < 3) return "they have just eaten on you";
      return canPay(CARE_COST.meal) ? null : `needs ${CARE_COST.meal} cr`;
    },
    run(s) {
      if (!payFrom(CARE_COST.meal, `A meal for ${s.name}`)) return null;
      s.needs.hungry = 0.05;
      s.needs.lonely = Math.max(0, s.needs.lonely - 0.1);
      s.lastMealH = H();
      mood(s, 1);
      note(s, "a meal on the company");
      return `${first(s)}: "Real food. I'll take it."`;
    },
  },
  {
    id: "night", label: "A night out",
    hint: () => `${CARE_COST.night} cr · company, and a late one`,
    ok(s) {
      if (s.transit) return "travelling";
      if (s.lastNightOut === dayIx()) return "one a day";
      return canPay(CARE_COST.night) ? null : `needs ${CARE_COST.night} cr`;
    },
    run(s) {
      if (!payFrom(CARE_COST.night, `A night out for ${s.name}`)) return null;
      s.needs.lonely = 0.1;
      s.needs.tired = Math.min(1, s.needs.tired + 0.1);
      s.lastNightOut = dayIx();
      mood(s, 3);
      note(s, "a night out on the company");
      return `${first(s)}: "I needed that more than I knew."`;
    },
  },
  {
    id: "course", label: "Send on a course",
    hint: (s) => `${courseCost(s)} cr · their next shift spent training · +6% an hour worked (${Math.min(3, s.trained ?? 0)}/3)`,
    ok(s) {
      if (s.transit) return "travelling";
      if ((s.trained ?? 0) >= 3) return "nothing more a course can teach them";
      if (s.offShift) return "their next shift is already given back";
      return canPay(courseCost(s)) ? null : `needs ${courseCost(s)} cr`;
    },
    run(s) {
      if (!payFrom(courseCost(s), `Training course for ${s.name}`)) return null;
      s.offShift = { ...nextShift(s), kind: "course" };
      mood(s, 2);
      note(s, "booked on a training course");
      return tr(s, "curiosity") > 0.55 ? `${first(s)}: "Finally, something new."` : `${first(s)}: "If it's paid, I'll sit through it."`;
    },
  },
];

export function courseCost(s) { return Math.max(CARE_COST.courseMin, Math.round(incomeOf(s) * CARE_COST.courseCycles)); }
export const careById = (id) => CARE.find((c) => c.id === id) ?? null;

export function careAct(s, id) {
  if (!s || !company.staff.includes(s)) return { ok: false, why: "Not on the rolls" };
  ensureLife(s);
  const c = careById(id);
  if (!c) return { ok: false, why: "No such thing" };
  const why = c.ok(s);
  if (why) return { ok: false, why };
  const line = c.run(s);
  return line == null ? { ok: false, why: "It did not go through" } : { ok: true, line };
}

export function termsLine(s) {
  ensureLife(s);
  return `${s.job} · ${SHIFTS[s.shift]?.label ?? s.shift} · ${HOURS[s.hours]?.label ?? s.hours} · ${HOUSING[s.housing]?.label ?? s.housing}${s.trained ? ` · ${s.trained} course${s.trained === 1 ? "" : "s"}` : ""}${s.offShift ? ` · next shift ${s.offShift.kind === "course" ? "on a course" : "off"}` : ""}`;
}
