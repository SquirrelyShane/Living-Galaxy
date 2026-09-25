/* LIVING GALAXY — 0.3.53: doing something about it.
 *
 *   ABOARD (CON › CREW › GENOME): reading a hand no longer lives a watch for
 *   them; every need has an order and an order is a real watch — the effect
 *   table, a record in the LOG, one per watch; grievance is heard, not
 *   ordered; TRAIN steers study to the body's ceiling and no further;
 *   ENCOURAGE / CURB moves a learned habit the way you pressed it.
 *
 *   ASHORE (HALL / CORP › TOWN): job, shift, hours and housing change a
 *   settled hand's day; a day off and a course take their next shift; a
 *   course makes an hour of their work worth more; nights pay more; care
 *   costs the treasury.
 *
 *   node --import ./test/three-register.mjs test/orders.test.mjs
 */
const store = new Map();
globalThis.localStorage = { getItem: (k) => store.get(k) ?? null, setItem: (k, v) => store.set(k, String(v)), removeItem: (k) => store.delete(k) };

import { sim, launchSim, tickSim } from "../js/sim.js";
import { makePilot } from "../js/pilot.js";
import { stations } from "../js/stations.js";
import { crew, hireCrew, stationRoster, rapportBetween } from "../js/crew.js";
import * as DM from "../js/crew/deckmind.js";
import * as OR from "../js/crew/orders.js";
import { journal } from "../js/crew/journal.js";
import { duties } from "../js/crew/duties.js";
import { habitsLearned } from "../js/crew/learn.js";
import * as CO from "../js/company.js";
import * as LIFE from "../js/stafflife.js";
import * as CARE from "../js/staffcare.js";
import * as CLK from "../js/stationclock.js";

let pass = 0, fail = 0;
const ok = (c, m) => { if (c) { pass++; if (process.env.V) console.log("  ok", m); } else { fail++; console.error("  FAIL", m); } };

makePilot("ORDERS", "terran", "mining", null);
launchSim("OrdersTest", "sol");
sim.phase = "play";
tickSim(1 / 60);
const ship = sim.ship;
ship.credits = 900000;
const honest = stations.filter((s) => !s.hostile);
const home = honest.find((s) => s.sector === "industrial") ?? honest[0];
for (const c of stationRoster(home, 1, sim.skySeed).slice(0, 4)) hireCrew(c, ship, 12);
const [a, b, c] = crew.aboard;
ok(crew.aboard.length >= 3, `${crew.aboard.length} aboard`);
for (const m of crew.aboard) DM.needsOf(m);

/* ---- 1. reading is not living ---------------------------------------------------- */
{
  const n0 = { ...DM.needsOf(a) };
  for (let i = 0; i < 12; i++) DM.buildContext(a, { peek: true });
  const n1 = DM.needsOf(a);
  ok(["fatigue", "hunger", "social", "stress", "play", "purpose"].every((k) => n1[k] === n0[k]), "twelve peeks at a hand leave their needs where they were (the GENOME sheet used to tire them out)");
  const m0 = a.morale;
  for (const k of ["intimacy", "social", "purpose", "play"]) a.need[k] = 0.95;
  DM.buildContext(a, { peek: true });
  ok(a.morale === m0, "and a peek does not charge them morale for what they are missing");
  Object.assign(a.need, n0);
}

/* ---- 2. an order is a watch -------------------------------------------------------- */
{
  a.need.fatigue = 0.9;
  const rows0 = journal.of(a.id, 50).length;
  const o = OR.orderFor(a, "fatigue");
  ok(o.label === "STAND DOWN" && o.action === "SLEEP" && !o.why, "Tiredness → STAND DOWN (sleep)");
  const r = OR.giveOrder(a, "fatigue");
  ok(r.ok && a.need.fatigue < 0.6, `standing them down takes the tiredness off (0.90 → ${a.need.fatigue.toFixed(2)})`);
  const rec = journal.of(a.id, 1)[0];
  ok(journal.of(a.id, 50).length === rows0 + 1 && rec.action.id === "SLEEP" && rec.action.node === "order", "and it is filed in their LOG as a watch, from an order");
  ok(rec.whatMadeMeActThis.reasoning.some((x) => /captain's orders/.test(x)), `with the reason: "${rec.whatMadeMeActThis.reasoning[0]}"`);
  const again = OR.giveOrder(a, "hunger");
  ok(!again.ok && /this watch/.test(again.why), "one order a watch");
  DM.deckmind.cycle++;
  a.need.hunger = 0.85;
  ok(OR.giveOrder(a, "hunger").ok && a.need.hunger < 0.5, `next watch, MESS CALL feeds them (${a.need.hunger.toFixed(2)})`);
}

/* ---- 3. company, closeness, the backlog --------------------------------------------- */
{
  DM.deckmind.cycle++;
  b.need.social = 0.8;
  const o = OR.orderFor(b, "social");
  const mate = crew.aboard.filter((x) => x !== b).sort((x, y) => rapportBetween(b, y) - rapportBetween(b, x))[0];
  const r0 = rapportBetween(b, o.focus);
  ok(o.focus?.id === mate.id, `SHARE A MEAL goes with whoever they get on with best (${o.hint})`);
  ok(OR.giveOrder(b, "social").ok && b.need.social < 0.8 && rapportBetween(b, o.focus) > r0, "and it brings company down and rapport up");
  ok(OR.orderFor(c, "intimacy").label === (c.partner && crew.aboard.some((x) => x.id === c.partner) ? OR.orderFor(c, "intimacy").label : "WRITE HOME"), "with no partner aboard, Closeness is a letter home");
  duties.wear = 0.7;
  DM.deckmind.cycle++;
  const w0 = duties.wear;
  ok(OR.giveOrder(c, "upkeep").ok && duties.wear < w0, `CLEAR THE BACKLOG works the hull (${w0} → ${duties.wear.toFixed(3)})`);
  duties.wear = 0.2;
}

/* ---- 4. a grievance is heard ------------------------------------------------------------- */
{
  DM.deckmind.cycle++;
  const rival = b;
  a.ties = [...(a.ties ?? []), { id: rival.id, kind: "rival" }];
  DM.buildContext(a, { peek: true });
  const g0 = a.need.grievance;
  ok(g0 > 0 && OR.grievanceCauses(a).some((x) => /rival/.test(x)), `a rival aboard is a grievance (${g0.toFixed(2)}: ${OR.grievanceCauses(a).join(", ")})`);
  const t0 = a.trust ?? 40;
  const r = OR.giveOrder(a, "grievance");
  ok(r.ok && /rival/.test(r.line), `HEAR THEM OUT — "${r.line}"`);
  ok(a.need.grievance < g0 && (a.trust ?? 40) > t0, `and it weighs less, and they trust you more (${g0.toFixed(2)} → ${a.need.grievance.toFixed(2)})`);
  DM.deckmind.cycle += DM.HEARD.cycles;
  DM.buildContext(a, { peek: true });
  ok(a.need.grievance === g0, "for a few watches — the cause is still there");
  a.ties = a.ties.filter((t) => t.kind !== "rival");
}

/* ---- 5. shore leave, and robots -------------------------------------------------------- */
{
  DM.deckmind.cycle++;
  ship.dockedAt = home.id;
  const o = OR.orderFor(b, "stress");
  ok(o.label === "SHORE LEAVE", "docked, Strain is SHORE LEAVE");
  b.need.stress = 0.8;
  const cr0 = ship.credits;
  ok(OR.giveOrder(b, "stress").ok && ship.credits === cr0 - OR.ORDER.shoreLeave && b.need.stress < 0.3, "which costs 60 cr and takes the strain off");
  ship.dockedAt = null;
  ok(OR.orderFor(b, "stress").label === "EASE OFF", "underway it is EASE OFF");
  const bot = { id: "robot-test", name: "Unit 7", robot: true, condition: 80 };
  ok(OR.orderFor(bot, "hunger").why && !OR.orderFor(bot, "upkeep").why, "a frame takes the backlog and nothing else");
}

/* ---- 6. TRAIN: to the ceiling and no further ------------------------------------------ */
{
  const body = DM.bodyOf(c);
  const [skill] = Object.entries(body.apt).sort((x, y) => x[1] - y[1])[2];   // something they are not built for
  const cap = OR.ceilingOf(c, skill);
  OR.setTraining(c, skill);
  ok(c.trainFocus === skill, `TRAIN sets what they study (${skill}, ceiling ${cap})`);
  c.skills ??= {};
  c.skills[skill] = Math.max(0, cap - 3);
  for (let i = 0; i < 8; i++) { DM.deckmind.cycle++; c.need.purpose = 0.9; OR.giveOrder(c, "purpose"); }
  ok(c.skills[skill] === cap, `GIVE A GOAL studies it up to the body's ceiling and stops there (${c.skills[skill]}/${cap})`);
  OR.setTraining(c, skill);
  ok(c.trainFocus == null, "and TRAIN again clears it");
}

/* ---- 7. ENCOURAGE / CURB --------------------------------------------------------------- */
{
  DM.deckmind.cycle++;
  const p = (k) => habitsLearned(a, DM.buildContext(a, { peek: true })).find((h) => h.kind === k).p;
  const s0 = p("study");
  ok(OR.coachHabit(a, "study", +1).ok && p("study") > s0, `ENCOURAGE study lifts it (${s0} → ${p("study")})`);
  ok(!OR.coachHabit(a, "study", +1).ok, "once a habit a watch");
  const i0 = p("idle");
  ok(OR.coachHabit(a, "idle", -1).ok && p("idle") < i0, `CURB idle lowers it (${i0} → ${p("idle")})`);
}

/* ---- 8. ashore: the settled hand's menu ------------------------------------------------ */
ship.dockedAt = home.id;
CO.foundCompany("Orders Works", "industrial");
CO.company.treasury = 50000;
for (const m of [...crew.aboard]) CO.settleAsStaff(m, [], home);
const staff = CO.company.staff;
{
  const s = staff[0];
  LIFE.ensureLife(s);
  const opts = CARE.workOptions(s);
  ok(opts.jobs.length >= 3 && opts.shifts.length === 3 && opts.hours.length === 3 && opts.housing.length === 3, "WORK and HOME offer a job, a shift, hours and a bed");
  const job = opts.jobs.find((j) => j !== s.job);
  ok(CARE.setJob(s, job) === null && s.job === job && s.dayLog[0].text.includes(job), `a new job, written in their day (${job})`);
  ok(CARE.setJob(s, "the moon") !== null, "and only a job their port has");
  s.mood = 70;
  ok(CARE.setShift(s, "night") === null && s.shift === "night", "put on nights");
  ok(CARE.setHours(s, "overtime") === null && LIFE.planAt(s, 22 + 9).id === "work", "overtime is ten hours");
  CARE.setHours(s, "standard");
  const rent0 = LIFE.housingCost();
  ok(CARE.setHousing(s, "cabin") === null && LIFE.housingCost() === rent0 + LIFE.HOUSING.cabin.cost, "a cabin costs the company every cycle");
  ok(/night shift/.test(CARE.termsLine(s)) && /cabin/i.test(CARE.termsLine(s)), `terms: ${CARE.termsLine(s)}`);

  /* nights pay more for the same hour */
  const d = staff[1];
  LIFE.ensureLife(d);
  d.shift = "day"; s.shift = "night";
  d.mood = s.mood = 74; d.needs.tired = s.needs.tired = 0.3; d.worked = s.worked = 0;
  sim.time = CLK.DAY_S * 3;   // 06:00 — day shift starts
  for (let h = 0; h < 24; h++) { sim.time += 30; LIFE.tickStaffHour(sim.time); }
  ok(s.worked > d.worked * 1.08, `a night on shift books more than a day (${s.worked.toFixed(2)} vs ${d.worked.toFixed(2)})`);

  /* a day off */
  sim.time = CLK.DAY_S * 5 + 4 * 30;   // 10:00
  const off = staff[2];
  LIFE.ensureLife(off);
  off.shift = "swing";
  const r = CARE.careAct(off, "dayoff");
  ok(r.ok && off.offShift?.kind === "off", `DAY OFF — "${r.line}"`);
  ok(LIFE.planAt(off, CLK.hoursAt(CLK.DAY_S * 5 + 9 * 30)).id === "off", "their next swing shift is a day off");
  ok(!CARE.careAct(off, "dayoff").ok, "and there is only one a day");

  /* a course */
  const t0 = CO.company.treasury;
  const k = staff[3] ?? staff[1];
  LIFE.ensureLife(k);
  k.shift = "day"; k.offShift = null; k.trained = 0; k.mood = 74; k.needs.tired = 0.3;
  const p0 = LIFE.productivity(k);
  const cost = CARE.courseCost(k);
  sim.time = CLK.DAY_S * 6 + 20 * 30;   // 02:00 — the next day shift is at 06:00
  ok(CARE.careAct(k, "course").ok && CO.company.treasury === t0 - cost, `a course costs ${cost} cr from the treasury`);
  ok(LIFE.planAt(k, CLK.hoursAt(CLK.DAY_S * 7 + 30)).id === "course", "and takes their next shift");
  for (let h = 0; h < 12; h++) { sim.time += 30; LIFE.tickStaffHour(sim.time); }
  k.mood = 74; k.needs.tired = 0.3;
  ok(k.trained === 1 && LIFE.productivity(k) > p0 && !k.offShift, `after it, an hour of their work is worth more (${p0.toFixed(2)} → ${LIFE.productivity(k).toFixed(2)})`);

  /* a meal, a night out */
  const hu = staff[1];
  hu.needs.hungry = 0.9;
  const t1 = CO.company.treasury;
  ok(CARE.careAct(hu, "meal").ok && hu.needs.hungry < 0.1 && CO.company.treasury === t1 - CARE.CARE_COST.meal, "STAND THEM A MEAL feeds them, on the company");
  hu.needs.lonely = 0.9;
  ok(CARE.careAct(hu, "night").ok && hu.needs.lonely <= 0.1, "A NIGHT OUT is company");
  ok(!CARE.careAct(hu, "night").ok, "once a day");
}

console.log(`orders: ${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
