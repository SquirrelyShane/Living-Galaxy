/* LIVING GALAXY — 0.3.52: port standard time, a working life ashore, and a
 * hold that is a volume.
 *
 *   the clock: day 1 opens at 06:00, an hour is 30 s, shifts and day parts
 *   a settled hand's day: 8 h on shift, a meal, their own time, supper, 8 h
 *     asleep — a night-shift hand sleeps through the day
 *   needs move with what they are doing; pay follows the hours worked and
 *     averages out near the old share; hands on shift lift their port's lines
 *   the rolls' events lean on the hour: accidents happen at work, not in bed
 *   the hold: bulk per good, a rating curve with no ceiling, and the
 *     starter hull cutting well past the old ~250-unit wall
 *
 *   node --import ./test/three-register.mjs test/stafflife.test.mjs
 */
const store = new Map();
globalThis.localStorage = { getItem: (k) => store.get(k) ?? null, setItem: (k, v) => store.set(k, String(v)), removeItem: (k) => store.delete(k) };

import { sim, launchSim, tickSim } from "../js/sim.js";
import { makePilot } from "../js/pilot.js";
import { stations } from "../js/stations.js";
import { crew, hireCrew, stationRoster, CYCLE_SECONDS } from "../js/crew.js";
import * as CO from "../js/company.js";
import * as SL from "../js/stationlife.js";
import * as LN from "../js/staffline.js";
import * as LIFE from "../js/stafflife.js";
import * as CLK from "../js/stationclock.js";
import { bulkOf, holdForCargoRating, ALL_GOODS } from "../js/materials.js";
import { roomFor, addCargo, cargoTotal, holdRoom } from "../js/ship.js";
import { SHIP_DB, hullTuneFor } from "../js/shipdb.js";
import { econHooks } from "../js/economy.js";

let pass = 0, fail = 0;
const ok = (c, m) => { if (c) { pass++; if (process.env.V) console.log("  ok", m); } else { fail++; console.error("  FAIL", m); } };

/* ---- 1. the clock ------------------------------------------------------------ */
{
  const c0 = CLK.clockAt(0);
  ok(c0.day === 1 && c0.hhmm === "06:00" && c0.shift === "day" && c0.part === "dawn", `sky time zero is day 1, 06:00, day shift (${c0.label}, ${c0.part})`);
  ok(CLK.clockAt(30).hhmm === "07:00" && CLK.clockAt(15).hhmm === "06:30", "an hour is 30 s of sky time");
  ok(CLK.clockAt(CLK.DAY_S).day === 2 && CLK.clockAt(CLK.DAY_S).hhmm === "06:00", `a day is ${CLK.DAY_S} s`);
  const n = CLK.clockAt(16 * 30);
  ok(n.hhmm === "22:00" && n.shift === "night" && n.isNight, "22:00 is the night shift, and night");
  ok(CLK.clockAt(8 * 30).shift === "swing" && CLK.clockAt(8 * 30).part === "day", "14:00 is swing shift, in the day");
  ok(CLK.clockAt(13 * 30).part === "dusk", "19:00 is dusk");
  ok(CLK.clockAt(CLK.DAY_S * 7).week === 2 && CLK.clockAt(CLK.DAY_S * 6).weekday === "Restday", "seven days a week, the last one Restday");
  ok(CLK.secondsUntilHour(0, 22) === 16 * 30 && CLK.secondsUntilHour(0, 6) === 0, "time until an hour of the clock");
  ok(/^D1 06:00 · DAWN$/.test(CLK.clockLine(0)), `a one-line reading: ${CLK.clockLine(0)}`);
  ok(CYCLE_SECONDS === CLK.CLOCK.hourS * 3, "a pay cycle is three port hours");
}

/* ---- a sky with a company town ------------------------------------------------ */
makePilot("LIFE", "terran", "mining", null);
launchSim("LifeTest", "sol");
sim.phase = "play";
tickSim(1 / 60);
const ship = sim.ship;
ship.credits = 900000;
const honest = stations.filter((s) => !s.hostile);
const home = honest.find((s) => s.sector === "industrial") ?? honest[0];
ship.dockedAt = home.id;
CO.foundCompany("Life Works", "industrial");
CO.company.treasury = 50000;
for (const c of stationRoster(home, 1, sim.skySeed).slice(0, 6)) hireCrew(c, ship, 24);
for (const m of [...crew.aboard]) CO.settleAsStaff(m, [], home);
const staff = CO.company.staff;
ok(staff.length >= 5, `${staff.length} settled at ${home.name}`);

/* ---- 2. a life, planned ------------------------------------------------------- */
{
  const s = staff[0];
  LIFE.ensureLife(s);
  ok(LIFE.jobsFor(home).includes(s.job) && CLK.SHIFT_IDS.includes(s.shift) && s.hours === "standard" && s.housing === "bunk", `a hand gets a job, a shift, hours and a bunk (${s.job}, ${s.shift})`);
  s.shift = "day";
  const tally = {};
  for (let h = 0; h < 24; h++) { const p = LIFE.planAt(s, 6 + h); tally[p.id === "family" ? "own" : p.id] = (tally[p.id === "family" ? "own" : p.id] ?? 0) + 1; }
  ok(tally.work === 8 && tally.sleep === 8 && tally.meal === 1 && tally.supper === 1 && tally.own === 6, `a day-shift day: ${JSON.stringify(tally)}`);
  ok(LIFE.planAt(s, 7).id === "work" && LIFE.planAt(s, 24 + 3).id === "sleep", "at work at 07:00, asleep at 03:00");
  s.shift = "night";
  ok(LIFE.planAt(s, 24 + 3).id === "work" && LIFE.planAt(s, 16).id === "sleep", "a night-shift hand works at 03:00 and sleeps through the afternoon");
  s.hours = "overtime";
  ok(LIFE.planAt(s, 22 + 9).id === "work", "overtime is ten hours on shift");
  s.hours = "part";
  ok(LIFE.planAt(s, 22 + 5).id === "meal" && LIFE.planAt(s, 22 + 4).id === "work", "part-time is five");
  s.hours = "standard";
  s.onStrikeUntil = 24 + 30;
  ok(LIFE.planAt(s, 24 + 1).id === "strike" && /picket/.test(LIFE.planAt(s, 24 + 1).label), "a strike takes the shift to the picket line");
  s.onStrikeUntil = null;
  s.transit = { to: home.id, at: 1e9 };
  ok(LIFE.planAt(s, 30).id === "transit", "and a hand on a liner is on a liner");
  s.transit = null;
  s.shift = "day";
  const line = LIFE.lifeLine(s, 30);
  ok(/on the .* · day shift · \d+ h more/.test(line), `the screens read it: "${line}"`);
}

/* ---- 3. a day on the rolls, ticked ---------------------------------------------- */
{
  for (const [i, s] of staff.entries()) { s.shift = CLK.SHIFT_IDS[i % 3]; s.mood = 74; s.needs = { tired: 0.3, hungry: 0.3, lonely: 0.3 }; s.dayLog = []; s.worked = 0; }
  const share = staff.reduce((a, s) => a + SL.incomeOf(s) * LN.cutOf(s), 0);
  const t0 = CO.company.treasury;
  CO.company.hourPool = 0; CO.company.payPool = 0;
  /* one whole port day, driven by the company's own clock */
  let lift = 1;
  const dayShift = staff.find((s) => s.shift === "day");
  const tired0 = dayShift.needs.tired;
  let tiredAtEndOfShift = null;
  for (let k = 0; k < CLK.DAY_S; k++) {
    sim.time = (sim.time ?? 0) + 1;
    CO.tickCompany(1);
    lift = Math.max(lift, LIFE.labourAt(home.id));
    if (LIFE.planAt(dayShift, CLK.hoursAt(sim.time)).id === "meal" && tiredAtEndOfShift == null) tiredAtEndOfShift = dayShift.needs.tired;
  }
  const booked = CO.company.book.filter((e) => e.kind === "wages").slice(0, 8).reduce((a, e) => a + e.delta, 0);
  ok(booked > share * 8 * 0.6 && booked < share * 8 * 1.25, `a day's wages come to about eight cycles of share (${Math.round(booked)} vs ${Math.round(share * 8)})`);
  ok(CO.company.treasury !== t0, "and land in the treasury");
  ok(tiredAtEndOfShift != null && tiredAtEndOfShift > tired0, `a shift tires them (${tired0.toFixed(2)} → ${tiredAtEndOfShift?.toFixed(2)})`);
  ok(dayShift.needs.tired < tiredAtEndOfShift, `and a night's sleep puts it back (${dayShift.needs.tired.toFixed(2)})`);
  ok(staff.every((s) => s.dayLog.length >= 4), `everybody's day is written down (${staff.map((s) => s.dayLog.length).join(",")})`);
  ok(staff.some((s) => s.dayLog.some((e) => /clocked on/.test(e.text))) && staff.some((s) => s.dayLog.some((e) => /asleep/.test(e.text))), "clocking on, and going to sleep");
  ok(lift > 1 && lift <= 1 + LIFE.LIFE.labourMax, `hands on shift lift their port's lines (×${lift.toFixed(2)})`);
  ok(econHooks.labour === LIFE.labourAt, "and the economy reads that lift");
  ok(LIFE.labourAt("no-such-port") === 1, "a port with nobody of yours on shift runs as it did");
}

/* ---- 4. pay follows the hours ----------------------------------------------------- */
{
  ok(LIFE.cyclePay(100, 0) === 30, "a cycle with no hours worked pays the retainer (30%)");
  ok(Math.abs(LIFE.cyclePay(100, 1) - 100) < 1e-9, "one full hour a cycle — a standard day — pays the whole share");
  ok(LIFE.cyclePay(100, 10 / 8) > LIFE.cyclePay(100, 1), "overtime pays more");
  const s = staff[1];
  s.needs.tired = 0.9; s.mood = 40;
  const lo = LIFE.productivity(s);
  s.needs.tired = 0.2; s.mood = 85;
  const hi = LIFE.productivity(s);
  ok(lo < hi && lo >= 0.3 && hi <= 1.1, `an exhausted, fed-up hand does less (${lo.toFixed(2)} vs ${hi.toFixed(2)})`);
  const cost0 = LIFE.housingCost();
  s.housing = "quarters";
  ok(LIFE.housingCost() === cost0 + LIFE.HOUSING.quarters.cost, "family quarters cost the company every cycle");
  s.housing = "bunk";
}

/* ---- 5. the rolls lean on the hour ------------------------------------------------- */
{
  const K = SL.ACTIVITY_K;
  ok(K.accident.work > 1 && K.accident.sleep < 0.5, "accidents happen at work, not in bed");
  ok(K.birth.family > 1 && K.commendation.work > 1, "births at home, commendations on the floor");
}

/* ---- 6. the line knows what hour it is --------------------------------------------- */
{
  const s = staff[2];
  s.shift = "day";
  sim.time = CLK.DAY_S * 5 + 20 * 30;   // 02:00
  s.lastCheckIn = null;
  const m0 = s.mood;
  const r = LN.callTopic(s.id, "checkin");
  ok(r.ok && /asleep|02:00|I'm up/.test(r.line), `ring them at 02:00 and you wake them ("${r.line.slice(0, 60)}…")`);
  ok(s.mood < m0, "which they do not thank you for");
  sim.time = CLK.DAY_S * 6 + 2 * 30;    // 08:00 — on shift
  s.lastCheckIn = null;
  const r2 = LN.callTopic(s.id, "checkin");
  ok(r2.ok && new RegExp(s.job).test(r2.line), `ring them on shift and they are at the ${s.job}`);
}

/* ---- 7. the hold is a volume -------------------------------------------------------- */
{
  const ores = ALL_GOODS.filter((g) => g.tier === "ore");
  ok(ores.every((g) => bulkOf(g.id) >= 0.4 && bulkOf(g.id) <= 2), `every ore packs between 0.4 and 2 hu a unit (${ores.length} ores)`);
  ok(new Set(ores.map((g) => bulkOf(g.id))).size > 3, "and they do not all pack the same — denser ore is bulkier");
  const r = [1, 12, 40, 120, 400, 1200].map(holdForCargoRating);
  ok(r.every((v, i) => i === 0 || v > r[i - 1]), `the hold grows with the cargo rating, no ceiling (${r.join(", ")})`);
  const big = Math.max(...SHIP_DB.map((d) => holdForCargoRating(d.stats?.cargo ?? 1)));
  ok(big >= 100000, `the biggest hull in the book holds ${big.toLocaleString()} hu`);
  ok(SHIP_DB.every((d) => Math.abs(hullTuneFor(d).cargo * 400 - holdForCargoRating(d.stats?.cargo ?? 1)) < 2), "and every hull's tune carries it");
  for (const k of Object.keys(ship.hold)) delete ship.hold[k];
  const fit = Math.floor(roomFor(ship, "platinum_ore"));
  ok(fit > 250, `the starter hull fits ${fit.toLocaleString()} platinum ore — past the old ~250 wall`);
  const got = addCargo(ship, "platinum_ore", 1e9);
  ok(holdRoom(ship) < 1 && cargoTotal(ship) <= ship.cargoCap + 1e-6, `a hold takes what fits and no more (${Math.round(ship.hold.platinum_ore ?? 0)} units, ${Math.round(cargoTotal(ship))}/${ship.cargoCap} hu)`);
  void got;
  for (const k of Object.keys(ship.hold)) delete ship.hold[k];
}

console.log(`stafflife: ${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
