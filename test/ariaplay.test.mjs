/* LIVING GALAXY 0.3.22 — ARIA plays a career, headless.
 *
 *   node --import ./test/three-register.mjs test/ariaplay.test.mjs
 *
 * Every career maps to a department with work on the desk; the plan ARIA
 * builds for a job is a mission the player could have written; she will not
 * sign for something she cannot buy or cannot carry; the brain scores what
 * pays and leans on her own career; and a whole career run — decide, fly,
 * deliver, learn — closes jobs and makes money without a renderer, a browser
 * or a person.
 */

import { sim, launchSim, tickSim } from "../js/sim.js";
import { makePilot, pilot } from "../js/pilot.js";
import { stations, stationById } from "../js/stations.js";
import { corps } from "../js/corps.js";
import { contracts, boardFor, resetContracts, CATEGORY_ORDER, CATEGORIES, acceptContract } from "../js/contracts.js";
import { validate } from "../js/mission/script.js";
import { mission, stopMission } from "../js/mission/run.js";
import { COMPLEX_IDS } from "../js/careers/complexes.js";
import {
  play, beginPlay, stepPlay, endPlay, playReport, brainReport, brainNote, scoreOf, weightOf,
  jobPlan, jobsFor, canFly, sourceFor, movesNow, nearestPort, holdUsed, setPlayRng, netWorth, CAREER_DEPT, PLAY,
} from "../js/ariaplay.js";
import { rngFromSeed } from "../js/generate.js";
import { resetCompany, company } from "../js/company.js";
import { resetCrew, crew } from "../js/crew.js";

/* A SEEDED SKY. 0.3.33.
 *
 * beginPlay() takes a seeded generator, so ARIA's own choices were already
 * reproducible — but tickSim() runs the whole world, and combat, flight and
 * traffic roll Math.random directly. So whether a 45-minute run closed two
 * jobs or one came down to gun cooldowns and jink rolls, and this suite
 * failed about one run in three on assertions that were not about anything:
 * "1 jobs finished, 2 dropped", "40,000 -> 2,180 cr".
 *
 * A flaky suite is worse than no suite, because it teaches you to ignore it.
 * Pinned the same way test/reactive.test.mjs pins its sky — mulberry32,
 * installed before the sim is launched. The thresholds are left exactly where
 * they were: the answer to a test that fails a third of the time is to stop
 * the inputs moving, not to lower the bar until the noise fits under it. */
function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
Math.random = mulberry32(0x0a71a);

let pass = 0, fail = 0;
const ok = (c, m) => { if (c) { pass++; if (process.env.V) console.log("  ok", m); } else { fail++; console.error("  FAIL", m); } };
const store = new Map();
globalThis.localStorage = { getItem: (k) => (store.has(k) ? store.get(k) : null), setItem: (k, v) => store.set(k, String(v)), removeItem: (k) => store.delete(k) };

makePilot("ARIA-T", "terran", "mining", null);
launchSim("AriaPlay", "sol");
sim.phase = "play";
for (const c of corps) c.standing = 100;
tickSim(1 / 60); tickSim(1 / 60);
const ship = sim.ship;

/* ---- every career has a department, and every department has work ------------------ */
{
  const careers = COMPLEX_IDS;
  ok(careers.length >= 12, `${careers.length} careers in the book`);
  ok(careers.every((c) => CAREER_DEPT[c]), `every one of them maps to a department: ${careers.filter((c) => !CAREER_DEPT[c]).join(", ") || "none missing"}`);
  ok(new Set(Object.values(CAREER_DEPT)).size === CATEGORY_ORDER.length, "and every department is somebody's career");
}

/* ---- the brain --------------------------------------------------------------------- */
{
  ok(scoreOf("never-tried") === 900, "untried work is worth a look");
  beginPlay({ career: "mining", name: "T", rng: rngFromSeed("brain") });
  brainNote("board:mining:mine", 120, 4000, true);
  brainNote("board:civic:food", 120, 4000, true);
  ok(Math.round(scoreOf("board:mining:mine")) === 2000, `a run that paid 4,000 cr in two minutes scores 2,000/min (${Math.round(scoreOf("board:mining:mine"))})`);
  ok(weightOf("board:mining:mine") > weightOf("board:civic:food"), "and her own department outweighs the same money elsewhere");
  brainNote("board:mining:mine", 120, 0, false);
  ok(scoreOf("board:mining:mine") < 2000, "a dropped job costs the move its score");
  const rep = brainReport();
  ok(rep.length === 2 && rep[0].perMin >= rep[1].perMin && rep[0].key === "board:civic:food", `the report ranks by what was actually paid, not by whose career it is (${rep.map((r) => `${r.key} ${Math.round(r.perMin)}`).join(", ")})`);
}

/* ---- what she will and will not sign for --------------------------------------------- */
{
  resetContracts();
  const st = stations.find((s) => !(s.hostile && !s.claimed));
  const list = jobsFor(st, "mining", sim.time);
  ok(list.length > 0, `${list.length} of ${boardFor(st, sim.time).length} postings at ${st.name} are ones she can fly`);
  ok(list.every((o) => o.mech !== "escort"), "no escorts — she cannot shadow a boat yet, and says so instead of failing one");
  ok(!list.some((o) => (o.mech === "deliver" || o.mech === "haul") && o.qty > ship.cargoCap), "nothing bigger than the hold");
  const buys = list.filter((o) => o.mech === "deliver" && !o.spot && !o.salvage && o.good);
  ok(buys.every((o) => sourceFor(o.good, o.qty, o.stationId)), `every buy-and-bring job she took has a port that actually stocks it (${buys.length} of them)`);
  const fake = { mech: "deliver", good: "superalloy", qty: 1e6, pay: 10, stationId: st.id, type: "materials", cat: "industry" };
  ok(!canFly(fake), "a million units of superalloy is not a job, it is a wish");
}

/* ---- the plans are missions ------------------------------------------------------------ */
{
  resetContracts();
  const seen = new Set();
  let built = 0;
  for (const s of stations.filter((x) => !(x.hostile && !x.claimed))) {
    for (const o of boardFor(s, sim.time)) {
      if (seen.has(o.mech) && seen.size > 4) continue;
      if (!canFly(o)) continue;
      const a = { ...o, leg: 0, progress: 0 };
      const m = jobPlan(a);
      const errs = validate(m);
      ok(errs.length === 0, `${o.mech} · ${o.type}: ${m.steps.map((x) => x.op).join(" > ")}${errs.length ? ` — ${errs[0].msg}` : ""}`);
      seen.add(o.mech);
      built++;
      if (built > 7) break;
    }
    if (built > 7) break;
  }
  ok(built >= 4, `${built} job plans built and every one validates as a mission you could have written yourself`);
}

/* ---- a career run, flown --------------------------------------------------------------- */
{
  resetContracts();
  stopMission("test");
  resetCompany();
  resetCrew();
  ship.credits = 30000;
  for (const k of Object.keys(ship.hold)) delete ship.hold[k];
  const st = nearestPort();
  ok(st, `nearest port: ${st?.name}`);
  beginPlay({ career: "mining", name: "ARIA-T", rng: rngFromSeed("aria-play-test") });
  ok(play.on && play.dept === "mining" && play.credits0 === ship.credits, "she has the conn");
  ok(movesNow().length > 0, `${movesNow().length} things she could do right now`);
  const cr0 = netWorth();
  let ticks = 0;
  while (ticks++ < 60 * 60 * 45 && play.stats.done < 2) { tickSim(1 / 60); stepPlay(1 / 60); }
  const r = playReport();
  ok(play.stats.decisions > 0, `${r.decisions} decisions taken`);
  ok(play.stats.done >= 2, `${r.done} jobs finished, ${r.failed} dropped, in ${Math.round(r.secs / 60)} min of sky`);
  ok(r.credits > cr0, `and the business grew: ${cr0.toLocaleString("en-US")} → ${r.credits.toLocaleString("en-US")} cr (${r.perMin}/min) — purse ${r.purse.toLocaleString("en-US")}${r.business?.treasury ? ` + treasury ${r.business.treasury.toLocaleString("en-US")}` : ""}`);
  ok(brainReport().length >= 1 && brainReport()[0].runs >= 1, `the brain came away with ${brainReport().length} scored move(s): ${brainReport()[0].key} at ${Math.round(brainReport()[0].perMin)} cr/min`);
  ok(holdUsed() >= 0 && holdUsed() <= 1.02, "the hold never went over");
  const out = endPlay();
  ok(!play.on && !mission.active && out.brain.moves && out.report.career === "mining", "and she hands the conn back with a brain that can be written to a file");
  ok(JSON.parse(JSON.stringify(out.brain)).moves[brainReport()[0].key], "the brain survives a round trip through JSON");
}

/* ---- a second career, cold ---------------------------------------------------------------- */
{
  resetContracts();
  stopMission("test");
  resetCompany();
  resetCrew();
  ship.credits = 40000;
  beginPlay({ career: "commerce", name: "ARIA-C", rng: rngFromSeed("aria-trade-test") });
  ok(play.dept === "trade", "commerce sits in Trade & Procurement");
  const cr0 = netWorth();
  let ticks = 0;
  while (ticks++ < 60 * 60 * 35 && play.stats.done < 1) { tickSim(1 / 60); stepPlay(1 / 60); }
  ok(play.stats.done >= 1, `a trader closed ${play.stats.done} job(s) too`);
  ok(netWorth() > cr0, `${cr0.toLocaleString("en-US")} → ${netWorth().toLocaleString("en-US")} cr (purse + treasury)`);
  endPlay();
}

/* ---- the pit screen ------------------------------------------------------------------- */
{
  const { makeScreen, colourFor, bar, plain, CAREER_COLOUR } = await import("../tools/aria-tty.mjs");
  const careers = COMPLEX_IDS;
  ok(careers.every((c) => CAREER_COLOUR[c]), `every career has a colour of its own: ${careers.filter((c) => !CAREER_COLOUR[c]).join(", ") || "none missing"}`);
  const hues = careers.map((c) => colourFor(c).fg);
  ok(new Set(hues).size === hues.length, `and no two careers share one (${hues.length} hues)`);
  ok(colourFor("not-a-career").fg > 0, "an unknown career still gets a colour rather than an exception");
  ok(plain(bar(0.5, 10)).length === 10 && plain(bar(2, 10)).length === 10 && plain(bar(-1, 10)).length === 10 && plain(bar(NaN, 10)).length === 10, "a bar is always exactly as wide as it was asked to be, whatever it is given");
  ok(plain(bar(0, 8)) === "░".repeat(8) && plain(bar(1, 8)) === "█".repeat(8), "empty and full read as empty and full");
  /* a screen with no TTY prints one line per change instead of repainting */
  const said = [];
  const write = process.stdout.write.bind(process.stdout);
  process.stdout.write = (x) => { said.push(String(x)); return true; };
  let logged = [];
  const clog = console.log;
  console.log = (...a) => logged.push(a.join(" "));
  try {
    const sc = makeScreen({ career: "mining", name: "T", hull: "Ore Sled", sky: "sol", server: "-", minutes: 1, speed: 8, tty: false });
    const r = playReport();
    sc.draw(r); sc.draw(r);
    ok(!sc.live && said.length === 1, `piped output writes once for an unchanged state (${said.length})`);
    const sc2 = makeScreen({ career: "commerce", name: "T2", hull: "Hauler", sky: "sol", server: "-", minutes: 1, speed: 8, tty: true, cols: 80 });
    said.length = 0;
    sc2.draw({ ...r, best: [{ key: "route", perMin: 900, runs: 2, fails: 0 }], log: [{ t: 10, text: "hello" }] });
    const frame = said.join("");
    ok(said.length > 15, `a live screen paints a whole frame (${said.length} lines)`);
    ok(said.every((l) => plain(l.replace(/^[\r\n]|\n$/g, "")).length <= 96), "and no line overruns the width it was given");
    ok(/PURSE/.test(frame) && /WHAT PAYS/.test(frame) && /hello/.test(frame), "with the purse, what it has learned, and the events under it");
    ok(frame.includes("\u001b[38;5;220m"), "in the career's own colour");
  } finally {
    process.stdout.write = write;
    console.log = clog;
  }
}

/* ---- the report a screen is drawn from --------------------------------------------- */
{
  const r = playReport();
  for (const k of ["hold", "charge", "hull"]) ok(r[k] >= 0 && r[k] <= 1.02, `${k} is a fraction a bar can draw (${r[k].toFixed(2)})`);
  ok(typeof r.cargoCap === "number" && r.cargoCap > 0 && typeof r.holdQty === "number", "with the raw hold numbers beside it");
  ok(Array.isArray(r.log) && Array.isArray(r.best), "the events and the brain come with it, so a screen needs nothing else");
  ok(r.progress === null || (r.progress >= 0 && r.progress <= 1), "job progress is a fraction or nothing");
}

console.log(`ariaplay: ${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
