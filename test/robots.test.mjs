/* LIVING GALAXY — robot crew: the yard catalogue, buying, power, wear and persistence.
 *
 *   node --import ./test/three-register.mjs test/robots.test.mjs
 */

const store = new Map();
globalThis.localStorage = { getItem: (k) => store.get(k) ?? null, setItem: (k, v) => store.set(k, String(v)), removeItem: (k) => store.delete(k) };

import { sim, launchSim, tickSim } from "../js/sim.js";
import { makePilot } from "../js/pilot.js";
import { stations } from "../js/stations.js";
import { crew, crewWageTotal, tickCrew, CYCLE_SECONDS, stationRoster, hireCrew } from "../js/crew.js";
import { transferCommand, captain } from "../js/npc/captain.js";
import { duties } from "../js/crew/duties.js";
import {
  ROBOT_KINDS, ROBOT_SECTORS, ROBOT_IDLE_AT, robotCatalogue, buyRobot, scrapRobot, tickRobots, robotsSummary, robotsAboard,
  serviceAll, servicePrice, saveRobots, loadRobots, ROBOTS_KEY, robots,
} from "../js/crew/robots.js";
import { buyUpgrade, upgrades } from "../js/upgrades.js";

let pass = 0, fail = 0;
const ok = (c, m) => { if (c) pass++; else { fail++; console.error("  FAIL", m); } };

makePilot("Tin", "terran", "mining", null);
launchSim("RobotTest", "sol");
sim.phase = "play";
const ship = sim.ship;
tickSim(1 / 60);

const yard = stations.find((s) => ROBOT_SECTORS.includes(s.sector) && !s.hostile);
const yard2 = stations.find((s) => ROBOT_SECTORS.includes(s.sector) && !s.hostile && s !== yard);
const noYard = stations.find((s) => !ROBOT_SECTORS.includes(s.sector));
ok(yard && yard2, `the sky has two robot yards (${yard?.name}, ${yard2?.name})`);

/* ---- the catalogue ---------------------------------------------------------- */
{
  const a = robotCatalogue(yard), b = robotCatalogue(yard), c = robotCatalogue(yard2);
  ok(a.length === Object.keys(ROBOT_KINDS).length, `one design per kind (${a.length})`);
  ok(a.every((o, i) => o.designation === b[i].designation && o.price === b[i].price), "the same port prints the same tags twice");
  ok(a.some((o, i) => o.designation !== c[i].designation), "a different port prints different designs");
  ok(a.every((o) => o.price > 0 && o.kw > 0 && o.spec.massKg > 0 && o.spec.chassis), `every card has mass, chassis, kW and a price (${a[0].designation} ${a[0].label}: ${a[0].price} cr)`);
  ok(a.every((o) => /berths|short|^no/.test(o.blocker ?? "") || o.blocker === null), "blockers are berths / credits / sector only");
  if (noYard) ok(robotCatalogue(noYard).every((o) => /no robot yard/.test(o.blocker)), "a non-yard port blocks every line");
}

/* ---- buying ------------------------------------------------------------------ */
{
  /* p16: frames have their own cap — the frame-racks refit adds robot slots
   * that do not eat a crew berth — so the yard reads sim.robotCapacity and
   * falls back to the berths. A fixture has to set the one the yard reads. */
  sim.crewCapacity = 4; sim.robotCapacity = 4;
  sim.robotCapacity = 4;
  ship.credits = 50000;
  const cr0 = ship.credits;
  const err = buyRobot("engineer", yard);
  ok(err === null, `an engineer is bought (${err})`);
  const bot = crew.aboard.find((m) => m.robot);
  ok(bot && bot.kind === "engineer" && bot.wage === 0 && bot.morale === 100 && bot.condition === 100 && bot.kw === ROBOT_KINDS.engineer.kw && bot.synthetic && bot.complexId === "energy", "the member record carries the robot flags");
  ok(ship.credits < cr0, `the yard billed ${cr0 - ship.credits} cr`);
  ok(crewWageTotal() === 0, "no wage on the payroll");
  ok(crew.log[0]?.msg.includes(bot.name), "the crew log notes the signing");
  ok(buyRobot("deckhand", yard) === null, "a deckhand too");
  ok(/no robot yard/i.test(buyRobot("medic", noYard ?? { sector: "logistic", id: "x", name: "x" }) ?? ""), "no yard, no sale");
  sim.crewCapacity = 2; sim.robotCapacity = 2;
  ok(/berths/i.test(buyRobot("medic", yard) ?? ""), "berths full refuses");
  sim.crewCapacity = 4; sim.robotCapacity = 4;
  ship.credits = 10;
  ok(/short/i.test(buyRobot("medic", yard) ?? ""), "no credits refuses");
  ship.credits = 50000;
  ok(buyRobot("nothing", yard) !== null, "an unknown kind refuses");

  /* wages and morale: tickCrew leaves robots alone (crew.js, package B) */
  tickCrew(CYCLE_SECONDS + 1, ship);
  const bots = robotsAboard();
  ok(bots.every((m) => m.morale === 100 && m.wage === 0), "a pay cycle leaves robot morale at 100 and pays them nothing");
  ok(bots.every((m) => !m.partner), "robots do not pair");

  /* the conn */
  const r = transferCommand(bots[0].id);
  ok(!r.ok && /robot/.test(r.error) && captain.holder === "player", `transferCommand refuses: ${r.error}`);
}

/* ---- power ------------------------------------------------------------------- */
{
  const bots = robotsAboard();
  const kw = bots.reduce((a, m) => a + m.kw, 0);
  ship.shields = false; ship.turretsArmed = false; ship.localGravity = false; ship.miningMode = "off";
  tickSim(1 / 60); tickSim(1 / 60); // the career step (tickRobots) runs after the power step: two frames to settle
  const withBots = ship.load;
  ok(Math.abs(ship.extraDraw - kw) < 1e-9, `extraDraw is Σ kW (${ship.extraDraw})`);
  const stash = bots.slice();
  for (const m of stash) crew.aboard.splice(crew.aboard.indexOf(m), 1);
  tickSim(1 / 60); tickSim(1 / 60);
  ok(ship.extraDraw === 0 && withBots - ship.load > kw - 0.5, `the bus carried ${(withBots - ship.load).toFixed(2)} more with the robots aboard`);
  crew.aboard.push(...stash);
  ok(robotsSummary().n === 2 && robotsSummary().kw === Math.round(kw * 10) / 10, `summary: ${JSON.stringify(robotsSummary())}`);
}

/* ---- wear and the engineer ---------------------------------------------------- */
{
  const [eng, hand] = robotsAboard();
  hand.condition = 100; eng.condition = 100;
  duties.wear = 0;
  /* the robot engineer restores the deckhand, nobody restores the engineer */
  tickRobots(100);
  ok(eng.condition < 100 && eng.condition > 90, `the engineer wears (${eng.condition.toFixed(1)})`);
  ok(hand.condition === 100, `the engineer keeps the deckhand at 100 (${hand.condition.toFixed(1)})`);
  /* with the engineer scrapped both decay */
  const engId = eng.id;
  const cr = ship.credits;
  ok(scrapRobot(engId) === null && ship.credits > cr && !crew.aboard.some((m) => m.id === engId), `scrap refunds ${ship.credits - cr} cr`);
  ok(scrapRobot(engId) !== null, "scrapping twice refuses");
  hand.condition = 100;
  tickRobots(100);
  ok(hand.condition < 99, `unattended, the deckhand wears (${hand.condition.toFixed(1)})`);
  duties.wear = 1;
  hand.condition = 100;
  tickRobots(100);
  ok(hand.condition < 97, `a maintenance backlog doubles the wear (${hand.condition.toFixed(1)})`);
  duties.wear = 0;
  hand.condition = 100;
  tickRobots(100 / 0.02 * 0.75);
  ok(hand.idle && hand.condition < ROBOT_IDLE_AT, `worn below ${ROBOT_IDLE_AT} the deckhand is flagged idle (${hand.condition.toFixed(1)})`);
  ok(robotsSummary().worst?.name === hand.name, "the summary names the worst frame");
  /* a human engineer restores it */
  const roster = stationRoster(yard, 0, sim.skySeed);
  const human = roster.find((c) => c.complexId === "energy") ?? roster[0];
  human.complexId = "energy";
  ok(hireCrew(human, ship, 4) === null, "a human hand signs on");
  const hm = crew.aboard.find((m) => m.id === human.id);
  hm.complexId = "energy"; hm.morale = 80;
  const before = hand.condition;
  tickRobots(100);
  ok(hand.condition > before, `the human engineer restores the deckhand (${before.toFixed(1)} → ${hand.condition.toFixed(1)})`);
  /* the yard */
  hand.condition = 40;
  ok(servicePrice() === 60 * 60, `service is 60 cr a point (${servicePrice()})`);
  ok(/yard/i.test(serviceAll(noYard ?? { sector: "logistic" }) ?? ""), "no yard, no service");
  const c2 = ship.credits;
  ok(serviceAll(yard) === null && hand.condition === 100 && !hand.idle && c2 - ship.credits === 3600, "SERVICE ALL restores every frame for the price");
  ok(serviceAll(yard) !== null, "nothing to service refuses");
  /* the charging bay */
  ship.credits = 50000;
  const ind = stations.find((s) => s.sector === "industrial" && !s.hostile);
  ok(buyUpgrade("robot_bay", ind) === null, "a charging bay is fitted");
  hand.condition = 100;
  tickRobots(100);
  ok(hand.condition > 98.9, `the bay halves the wear (${hand.condition.toFixed(1)})`);
  tickSim(1 / 60);
  ok(Math.abs(ship.extraDraw - hand.kw * 0.6) < 1e-9, `and the draw is 60% (${ship.extraDraw})`);
  upgrades.owned.length = 0;
}

/* ---- persistence -------------------------------------------------------------- */
{
  const bots = robotsAboard();
  const n = bots.length;
  bots[0].condition = 77;
  saveRobots();
  ok(store.has(ROBOTS_KEY()), `saved under ${ROBOTS_KEY()}`);
  for (const m of bots) crew.aboard.splice(crew.aboard.indexOf(m), 1);
  const back = loadRobots();
  ok(back.length === n && robotsAboard().length === n && robotsAboard()[0].condition === 77 && robotsAboard()[0].pronouns.subj === "they", "the robots come back with their condition");
  ok(loadRobots().length === 0 && robotsAboard().length === n, "loading twice does not duplicate");
  const idBefore = robots.n;
  sim.crewCapacity = 4; sim.robotCapacity = 4;
  ok(buyRobot("medic", yard) === null && crew.aboard.find((m) => m.kind === "medic").id === `bot_${idBefore + 1}`, "ids keep counting after a reload");
  /* a relaunch of the same sky restores them; a new callsign does not */
  launchSim("RobotTest", "sol");
  ok(robotsAboard().length === n + 1, `relaunching the sky brings ${robotsAboard().length} robots back`);
  launchSim("Someone", "sol");
  ok(robotsAboard().length === 0, "another pilot starts with none");
}

console.log(`robots: ${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
