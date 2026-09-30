import { company } from "../corp/company.js";
import { sim } from "../sim/sim.js";
import { stationById } from "./stations.js";
import { stationLife } from "./stationlife.js";
import { cradle } from "../npc/cradle.js";
import { clockAt, hoursAt, hoursIntoShift, SHIFTS, SHIFT_IDS, CLOCK } from "./stationclock.js";

export const HOURS = { standard: { id: "standard", label: "Standard · 8 h", h: 8 }, overtime: { id: "overtime", label: "Overtime · 10 h", h: 10 }, part: { id: "part", label: "Part-time · 5 h", h: 5 } };
export const HOUSING = {
  bunk: { id: "bunk", label: "Bunk room", cost: 0, sleep: 1.0, mood: -2 },
  cabin: { id: "cabin", label: "Private cabin", cost: 12, sleep: 1.2, mood: 1 },
  quarters: { id: "quarters", label: "Family quarters", cost: 30, sleep: 1.35, mood: 3 },
};
export const SHIFT_PAY = { day: 1, swing: 1.05, night: 1.15 };
export const LIFE = {
  retainer: 0.3,
  perHour: 0.7,
  labourPer: 0.03,
  labourMax: 0.3,
  logMax: 14,
};

export const JOBS = {
  industrial: ["smelter line", "rolling mill", "fab bay", "dock cranes", "assay lab"],
  logistic: ["cross-dock", "bonded stores", "traffic desk", "tug crews"],
  civilian: ["habitat services", "clinic", "market hall", "schoolrooms"],
  agricultural: ["grow ring", "vat farm", "packing line", "water plant"],
  military: ["garrison ops", "armoury", "picket maintenance", "comms room"],
  pirate: ["the fence", "dockside", "the back rooms"],
};
export function jobsFor(st) { return JOBS[st?.sector] ?? JOBS.civilian; }

function hash(s) {
  let h = 2166136261;
  s = String(s);
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
}
const first = (name) => String(name ?? "").split(" ")[0];
const clamp01 = (v) => Math.max(0, Math.min(1, v));

export function ensureLife(s) {
  const st = stationById(s.stationId);
  const h = hash(s.id);
  s.shift ??= SHIFT_IDS[h % 3];
  if (!s.job || !jobsFor(st).includes(s.job)) s.job = jobsFor(st)[(h >>> 3) % jobsFor(st).length];
  s.hours ??= "standard";
  s.housing ??= "bunk";
  s.needs ??= { tired: 0.3, hungry: 0.3, lonely: 0.3 };
  s.dayLog ??= [];
  s.worked ??= 0;
  s.workedToday ??= 0;
  return s;
}

function leisureSpot(s) {
  const t = s.traits ?? {};
  const pick = [
    [t.curiosity ?? 0.5, "at the observation deck"],
    [t.greed ?? 0.5, "at the card tables"],
    [t.loyalty ?? 0.5, "at the union hall"],
    [t.grit ?? 0.5, "in the gym"],
    [t.caution ?? 0.5, "reading in their bunk"],
  ].sort((a, b) => b[0] - a[0]);
  return pick[0][1];
}

function household(s) {
  const hh = stationLife.households?.[s.id];
  const partner = hh?.partner ? (company.staff.find((o) => o.id === hh.partner)?.name ?? cradle.get(hh.partner)?.name ?? null) : null;
  return { partner, kids: (hh?.children ?? []).length };
}

export function planAt(s, H) {
  ensureLife(s);
  if (s.transit) return { id: "transit", label: "on a liner between ports", left: 0 };
  const W = HOURS[s.hours]?.h ?? 8;
  const into = hoursIntoShift(SHIFTS[s.shift]?.start ?? 6, H);
  const off = s.offShift && H >= s.offShift.from && H < s.offShift.to ? s.offShift : null;
  const blocks = [
    [W, s.onStrikeUntil && s.onStrikeUntil > H ? "strike" : off ? (off.kind === "course" ? "course" : "off") : "work"],
    [W + 1, "meal"],
    [15, "own"],
    [16, "supper"],
    [24, "sleep"],
  ];
  let prev = 0;
  for (const [end, id] of blocks) {
    if (into < end) {
      let label;
      if (id === "work") label = `on the ${s.job} · ${SHIFTS[s.shift].label}`;
      else if (id === "strike") label = "on the picket line";
      else if (id === "off") label = "a day off";
      else if (id === "course") label = `on a training course · ${SHIFTS[s.shift].label} given back`;
      else if (id === "meal") label = "in the mess";
      else if (id === "supper") label = "at supper";
      else if (id === "sleep") label = "asleep";
      else {
        const hh = household(s);
        if (hh.partner || hh.kids) {
          label = `at home${hh.partner ? ` with ${first(hh.partner)}` : ""}${hh.kids ? `${hh.partner ? " and" : " with"} the kid${hh.kids > 1 ? "s" : ""}` : ""}`;
          return { id: "family", label, into: into - prev, left: end - into };
        }
        label = leisureSpot(s);
      }
      return { id, label, into: into - prev, left: end - into };
    }
    prev = end;
  }
  return { id: "sleep", label: "asleep", into: 0, left: 0 };
}

export function nowOf(s, t) {
  const p = planAt(s, hoursAt(t));
  return { ...p, leftS: Math.round(p.left * CLOCK.hourS) };
}

export function productivity(s) {
  const mood = s.mood ?? 74;
  const tired = s.needs?.tired ?? 0.3;
  const trained = Math.min(3, s.trained ?? 0) * 0.06;
  return Math.max(0.3, Math.min(1.1 + trained, (0.45 + (mood / 100) * 0.55 + trained) * (tired > 0.75 ? 0.7 : 1)));
}

export function log(s, c, text) {
  ensureLife(s);
  s.dayLog.unshift({ day: c.day, hhmm: c.hhmm, text });
  if (s.dayLog.length > LIFE.logMax) s.dayLog.length = LIFE.logMax;
}

const NEEDS = {
  work:     [0.055,  0.05,   0.015,  0],
  strike:   [0.03,   0.05,   -0.02,  -0.3],
  off:      [-0.02,  0.03,   -0.1,   0.6],
  course:   [0.03,   0.05,   -0.04,  0.2],
  meal:     [0.0,    -0.45,  -0.05,  0.2],
  supper:   [0.0,    -0.45,  -0.06,  0.2],
  own:      [0.01,   0.03,   -0.07,  0.3],
  family:   [0.015,  0.03,   -0.14,  0.6],
  sleep:    [-0.11,  0.02,   0.005,  0],
  transit:  [0.02,   0.03,   0.02,   -0.1],
};

const onShift = new Map();

export function tickStaffHour(t) {
  const c = clockAt(t);
  const H = hoursAt(t);
  onShift.clear();
  for (const s of company.staff) {
    if (s.sky != null && s.sky !== sim.skySeed) continue;
    ensureLife(s);
    if (s.offShift && H >= s.offShift.to) s.offShift = null;
    const p = planAt(s, H);
    const d = NEEDS[p.id] ?? NEEDS.own;
    const house = HOUSING[s.housing] ?? HOUSING.bunk;
    const n = s.needs;
    n.tired = clamp01(n.tired + (d[0] < 0 ? d[0] * house.sleep : d[0]));
    n.hungry = clamp01(n.hungry + d[1]);
    n.lonely = clamp01(n.lonely + d[2]);
    const lean = (0.45 - n.tired) * 0.5 + (0.45 - n.hungry) * 0.35 + (0.45 - n.lonely) * 0.35 + d[3] + house.mood * 0.05;
    s.mood = Math.max(0, Math.min(100, (s.mood ?? 74) + lean));
    if (p.id === "work") {
      const w = productivity(s) * (SHIFT_PAY[s.shift] ?? 1);
      s.worked += w;
      s.workedToday += 1;
      onShift.set(s.stationId, (onShift.get(s.stationId) ?? 0) + 1);
    }
    if (p.id !== s.lastAct) {
      if (p.id === "course" && s.lastAct !== "course") s.trained = Math.min(3, (s.trained ?? 0) + 1);
      if (p.id === "work") log(s, c, `clocked on — ${s.job}`);
      else if (s.lastAct === "work") log(s, c, `off shift after ${s.workedToday} h${p.id === "meal" ? ", to the mess" : ""}`);
      else log(s, c, p.label);
      if (p.id === "sleep") s.workedToday = 0;
      s.lastAct = p.id;
    }
  }
}

export function takeWorked(s) {
  const h = s.worked ?? 0;
  s.worked = 0;
  return h;
}

export function cyclePay(share, workedHours) {
  return share * (LIFE.retainer + LIFE.perHour * workedHours);
}

export function labourAt(stationId) {
  return 1 + Math.min(LIFE.labourMax, (onShift.get(stationId) ?? 0) * LIFE.labourPer);
}

export function lifeLine(s, t = sim.time) {
  const n = nowOf(s, t ?? 0);
  if (n.id === "transit") return n.label;
  const left = Math.max(0, n.left ?? 0);
  return `${n.label} · ${left >= 1 ? `${Math.round(left)} h more` : `${Math.max(1, Math.round(left * 60))} min more`}`;
}

const word = (v, w) => w[v < 0.3 ? 0 : v < 0.6 ? 1 : v < 0.8 ? 2 : 3];
export function needsOf(s) {
  ensureLife(s);
  const n = s.needs;
  return [
    { id: "tired", label: "Tiredness", v: n.tired, word: word(n.tired, ["rested", "a long day", "tired", "dead on their feet"]) },
    { id: "hungry", label: "Hunger", v: n.hungry, word: word(n.hungry, ["fed", "peckish", "hungry", "starving"]) },
    { id: "lonely", label: "Company", v: n.lonely, word: word(n.lonely, ["good company", "a bit alone", "lonely", "isolated"]) },
  ];
}
export function needsLine(s) { return needsOf(s).map((x) => x.word).join(" · "); }

export function dayLogOf(s, n = 6) { ensureLife(s); return s.dayLog.slice(0, n); }

export function housingCost() {
  return company.staff.reduce((a, s) => a + (HOUSING[s.housing]?.cost ?? 0), 0);
}
