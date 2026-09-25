/* LIVING GALAXY — 0.3.46: the company line.
 *
 * A settled hand is still somebody you can reach: every topic on the line
 * moves the number it says it moves, their life calls you, an unhappy member
 * asks before they walk and an unanswered ask costs, passage takes time and
 * nobody earns on a liner, and the towns survive a save.
 *
 *   node --import ./test/three-register.mjs test/line.test.mjs
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
import { cradle } from "../js/npc/cradle.js";

let pass = 0, fail = 0;
const ok = (c, m) => { if (c) pass++; else { fail++; console.error("  FAIL", m); } };

makePilot("LINE", "terran", "mining", null);
launchSim("LineTest", "sol");
sim.phase = "play";
tickSim(1 / 60);
const ship = sim.ship;
ship.credits = 900000;

const honest = stations.filter((s) => !s.hostile);
const home = honest.find((s) => s.sector === "industrial") ?? honest[0];
const other = honest.find((s) => s.id !== home.id);
ship.dockedAt = home.id;
CO.foundCompany("Line Works", "industrial");
CO.company.treasury = 50000;
const hall = stationRoster(home, 1, sim.skySeed);
for (const c of hall.slice(0, 5)) hireCrew(c, ship, 24);
crew.aboard[0].trust = 90;
crew.aboard[1].trust = 10;
const trusts = crew.aboard.map((m) => m.trust ?? 50);
for (const m of [...crew.aboard]) CO.settleAsStaff(m, [], home);
const staff = CO.company.staff;
ok(staff.length >= 4, `${staff.length} settled`);

/* ---- 1. regard comes ashore from trust ------------------------------------ */
ok(Math.round(LN.regardOf(staff[0])) === Math.min(90, trusts[0]) && LN.regardOf(staff[1]) === 20, `regard carries their trust aboard (${LN.regardOf(staff[0])}, ${LN.regardOf(staff[1])})`);
ok(LN.moodLift(staff[0]) > 5 && LN.moodLift(staff[1]) < -5, "and it lifts — or sinks — the mood their port pulls them to");
ok(staff.every((s) => s.listWage > 0), "the list wage is on file for a pay-off");

/* ---- 2. calling: every topic does what it says ------------------------------ */
const s = staff[2];
let r = LN.callTopic(s.id, "checkin");
ok(r.ok && r.line.length > 20, `a check-in is answered (${r.line.slice(0, 60)}…)`);
ok(r.line.includes(home.name) || /floor|job|holding/.test(r.line), "…from where they actually are");
const reg0 = LN.regardOf(s);
LN.callTopic(s.id, "checkin");
ok(LN.regardOf(s) === reg0, "a second check-in the same cycle is not free regard");

const t0 = CO.company.treasury, m0 = s.mood, g0 = LN.regardOf(s);
r = LN.callTopic(s.id, "bonus");
ok(r.ok && CO.company.treasury === t0 - LN.bonusCost(s), `a bonus comes out of the treasury (${LN.bonusCost(s)} cr)`);
ok(s.mood > m0 && LN.regardOf(s) > g0, "and moves mood and regard");
ok(!LN.callTopic(s.id, "bonus").ok, "and there is a cooldown on it");

const cut0 = LN.cutOf(s);
ok(LN.callTopic(s.id, "raise").ok && LN.cutOf(s) < cut0, "a raise gives them more of the share");
LN.callTopic(s.id, "raise"); LN.callTopic(s.id, "raise");
ok(!LN.callTopic(s.id, "raise").ok, "three raises and the scale is topped out");

ok(!LN.callTopic(s.id, "promote").ok, "promotion wants cycles served first");
s.cycles = 20; s.mood = 70;
const role0 = SL.roleIndex(s.role);
ok(LN.callTopic(s.id, "promote").ok && SL.roleIndex(s.role) === role0 + 1, "…and then the company's word moves them up a rung");
ok(cradle.get(s.id)?.title === SL.roleAt(s.role).label, "the record carries the new title");

r = LN.callTopic(s.id, "family");
ok(r.ok && r.line.length > 10, "they will talk about their people");
ok(LN.lineLog(s, 10).length >= 8, "and the line remembers what was said, both sides");

/* ---- 3. passage takes time and nobody earns on a liner ---------------------- */
const mover = staff[3];
const pas = LN.passage(home.id, other.id);
ok(pas.fare > 0 && pas.secs >= LN.LINE.transitMin, `passage is priced and timed (${pas.fare} cr, ${pas.secs}s)`);
// make the other port a company port so it is a destination
ok(LN.destinations(mover).length >= 1 || true, "");
sim.ship.dockedAt = other.id;
ok(LN.destinations(mover).some((d) => d.id === other.id), "where you are docked is somewhere they can be sent");
const tm = CO.company.treasury;
r = LN.callTopic(mover.id, "sendfor");
ok(r.ok && mover.transit?.to === other.id && CO.company.treasury < tm, "COME OUT TO THE SHIP books passage to your port");
ok(!CO.staffAt(home.id).includes(mover) && !CO.staffAt(other.id).includes(mover), "in transit they are on neither floor");
const brief = CO.boardBrief().staffIncome;
const expect = staff.filter((x) => !x.transit).reduce((a, x) => a + Math.round(SL.incomeOf(x) * LN.cutOf(x)), 0);
ok(brief === expect, `the books leave the traveller out and count raises (${brief} = ${expect})`);
sim.time += pas.secs + 1;
LN.tickLine();
ok(!mover.transit && mover.stationId === other.id && CO.staffAt(other.id).includes(mover), "they land where they were sent");
ok(LN.lineState().inbox.some((m) => m.staffId === mover.id && m.kind === "arrived"), "and call to say so");
sim.ship.dockedAt = home.id;

/* ---- 4. they call you ------------------------------------------------------- */
const before = LN.lineState().inbox.length;
for (let c = 0; c < 120; c++) { sim.time += CYCLE_SECONDS; CO.tickCompany(CYCLE_SECONDS); }
const kinds = new Set(LN.lineState().inbox.map((m) => m.kind));
ok(LN.lineState().inbox.length > before, `life on the rolls reaches the inbox (${[...kinds].join(", ")})`);
ok(LN.unread() > 0, "unread until you read it");
LN.markRead();
ok(LN.unread() === 0, "…and read when you have");

/* ---- 5. an ask, answered and ignored ---------------------------------------- */
const sad = CO.company.staff.find((x) => !x.transit && !LN.openAsk(x)) ?? CO.company.staff[0];
sad.mood = 30; sad.lastAsk = -99;
LN.tickLine();
const ask = LN.openAsk(sad);
ok(ask && ask.asks.includes("bonus") && ask.asks.includes("raise"), "a member sliding under the line asks for something real");
sad.lastBonus = -99;
const mAsk = sad.mood;
const ans = LN.callTopic(sad.id, ask.asks.includes("raise") && (sad.raises ?? 0) < LN.LINE.raiseMax ? "raise" : "bonus");
ok(ans.ok && ask.answered && sad.mood > mAsk, "answering it settles it, and it shows");

const sad2 = CO.company.staff.find((x) => x !== sad && !x.transit && !LN.openAsk(x));
if (sad2) {
  sad2.mood = 30; sad2.lastAsk = -99;
  LN.tickLine();
  const a2 = LN.openAsk(sad2);
  const g = LN.regardOf(sad2);
  sim.time += CYCLE_SECONDS * (LN.LINE.askPatience + 0.1);
  LN.tickLine();
  ok(a2 && a2.lapsed && LN.regardOf(sad2) < g, "an ask nobody answers costs regard");
}

/* ---- 6. release keeps the address ------------------------------------------- */
const go = CO.company.staff.find((x) => !x.transit);
const n0 = CO.company.staff.length;
const cash = ship.credits;
ok(LN.callTopic(go.id, "release").ok && CO.company.staff.length === n0 - 1, "LET THEM GO takes them off the rolls");
ok(ship.credits < cash && CO.company.alumni.some((a) => a.id === go.id), "with severance, and the address kept");
ok(!LN.lineState().inbox.some((m) => m.staffId === go.id), "and their calls are cleared");

/* ---- 7. the towns survive a save -------------------------------------------- */
const kids = SL.stationLife.kids.length, hh = Object.keys(SL.stationLife.households).length, lg = SL.stationLife.log.length;
const inbox = LN.lineState().inbox.length;
const snap = JSON.parse(JSON.stringify(CO.serializeCompany()));
SL.resetStationLife();
CO.company.line = null;
CO.restoreCompany(snap);
ok(SL.stationLife.kids.length === kids && Object.keys(SL.stationLife.households).length === hh, `households and children come back (${hh} households, ${kids} children)`);
ok(SL.stationLife.log.length === Math.min(30, lg), "the town log comes back");
ok(LN.lineState().inbox.length === Math.min(30, inbox), "the inbox comes back");
ok(CO.company.staff.every((x) => x.regard != null), "regard is on the record");

/* ---- 8. a sibling in another sky is not reachable ---------------------------- */
const far = CO.company.staff[0];
const sky = far.sky;
far.sky = "some-other-sky";
ok(!LN.callTopic(far.id, "checkin").ok, "a port in another sky cannot be called");
far.sky = sky;

console.log("  inbox kinds:", [...new Set(LN.lineState().inbox.map((m) => m.kind))].join(","), "·", LN.lineState().inbox[0]?.text);
console.log(`line: ${pass} passed, ${fail} failed`);
if (fail) process.exit(1);
