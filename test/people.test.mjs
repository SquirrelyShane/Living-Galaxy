/* LIVING GALAXY — corporations for NPCs, the player's company, and the household.
 *
 *   node --import ./test/three-register.mjs test/people.test.mjs
 */

import { sim, launchSim, tickSim } from "../js/sim.js";
import { makePilot } from "../js/pilot.js";
import { stations } from "../js/stations.js";
import { corps, corpOfVessel, corpRelation, corpWars, blameKill, corpById, standingLabel } from "../js/corps.js";
import { POWERS, activeWars, relationOf } from "../js/data/factions.js";
import { traffic, vesselStatus } from "../js/npc/traffic.js";
import { flow } from "../js/npc/flow.js";
import { company, foundCompany, transfer, tickCompany, contacts, boardBrief, resetCompany, COMPANY } from "../js/company.js";
import { crew, hireCrew, stationRoster, CYCLE_SECONDS, tickCrew } from "../js/crew.js";
import { social, setSocial, household, crewTopics, couldCourt, settleFamily, familyOf, tickHousehold, canConceive, berthsUsed, overBerths, playerAsPerson, adjustTrust, adjustMorale, bumpTrust, bumpMorale, greetLine } from "../js/family.js";
import { cradle } from "../js/npc/cradle.js";

let pass = 0, fail = 0;
const ok = (c, m) => { if (c) pass++; else { fail++; console.error("  FAIL", m); } };

makePilot("People", "terran", "mining", null);
launchSim("PeopleTest", "sol");
sim.phase = "play";
const ship = sim.ship;

/* ---- powers and corporations ------------------------------------------------ */
ok(Object.keys(POWERS).length === 9 && activeWars().length >= 3, `LG's nine powers with ${activeWars().length} live wars`);
ok(corps.length === 16 && corps.every((c) => c.power && POWERS[c.power] && c.charter && c.temper), "every local outfit is chartered under a power");
{
  const law = corps.filter((c) => c.tier === "law");
  ok(law.length === 1 && !law[0].ports.length, `one Security Directorate, holding no berths of its own (${law[0]?.name})`);
  ok(POWERS[law[0].power]?.bloc === "coalition", "the directorate flies Coalition paper");
}
ok(corps.filter((c) => c.tier === "major").every((c) => POWERS[c.power].bloc === "coalition") && corps.filter((c) => c.tier === "hostile").every((c) => POWERS[c.power].bloc === "pirate"), "majors fly Coalition paper, hostiles are Outer");
const wars = corpWars();
ok(wars.length >= 3, `${wars.length} pairs of local outfits at odds (worst: ${wars[0]?.a.name} vs ${wars[0]?.b.name}, ${wars[0]?.label})`);
const a = corps[0], b = corps.find((c) => c.power === a.power && c !== a);
if (b) ok(corpRelation(a, b) >= 0.5, "two outfits under one power are allies");
ok(traffic.every((n) => corpOfVessel(n)), "every captain on the board flies a flag");
ok(flow.every((n) => corpOfVessel(n)), "every flow boat flies its port's flag");
const pirate = traffic.find((n) => n.role === "pirate");
ok(pirate && corpOfVessel(pirate).tier === "hostile", `a pirate flies a hostile flag (${corpOfVessel(pirate)?.name})`);
ok(/·/.test(vesselStatus(traffic[0])), `status names the flag: ${vesselStatus(traffic[0])}`);
{
  const trader = traffic.find((n) => n.role === "trader");
  const flag = corpOfVessel(trader);
  const before = flag.standing;
  const ally = corps.find((c) => c !== flag && corpRelation(c, flag) >= 0.5);
  const enemy = corps.find((c) => c !== flag && corpRelation(c, flag) <= -0.5);
  const allyBefore = ally?.standing, enemyBefore = enemy?.standing;
  blameKill(trader, "test kill");
  ok(flag.standing < before, `shooting a trader costs standing with ${flag.name} (${before} → ${flag.standing})`);
  if (ally) ok(ally.standing < allyBefore, `…and with its ally ${ally.name}`);
  if (enemy) ok(enemy.standing > enemyBefore, `…while its enemy ${enemy.name} approves`);
}

/* ---- the company --------------------------------------------------------------- */
{
  resetCompany();
  const port = stations.find((s) => !s.hostile && s.sector === "industrial") ?? stations.find((s) => !s.hostile);
  ship.credits = 10000;
  ok(foundCompany("Test Extraction", "industrial") !== null, "no company without a berth");
  ship.dockedAt = port.id;
  ok(foundCompany("Test Extraction", "industrial") === null && company.founded && company.hq === port.id, `incorporated at ${port.name}`);
  ok(ship.credits === 10000 - COMPANY.registration, "the registrar was paid");
  ok(transfer(1000) === null && company.treasury === 1000 && transfer(-400) === null && company.treasury === 600, "capital in, draw out");
  ok(boardBrief().seats.length === 3, "three board seats");
  ship.dockedAt = null;
}

/* ---- the household ---------------------------------------------------------------- */
{
  const port = stations.find((s) => s.id === company.hq);
  ship.dockedAt = port.id;
  const roster = stationRoster(port, 0, "sol");
  const cap = 8;
  crew.employer = "People";
  /* pick a hand who could court and conceive with the captain, and a pair that could with each other */
  setSocial({ gender: "man", attractedTo: ["woman"], romance: "all", family: true });
  const me = playerAsPerson();
  /* Look across the sky's halls, not one of them. The contract under test is
   * "the sky produces a hand the captain could court", and a single port's
   * roster is eight or nine people — a sample that small will sometimes hold
   * nobody who fits, which says nothing about the sky and everything about the
   * draw. Pinning it to one port made this suite fail the first time the sky's
   * seed changed, which is not a defect it should be able to notice. */
  const hall = [];
  for (const st of stations) hall.push(...stationRoster(st, 0, "sol"));
  const her = hall.find((c) => c.gender === "woman" && c.attractedTo.includes("man") && !c.attractedTo.includes("woman"))
    ?? hall.find((c) => c.gender === "woman" && c.attractedTo.includes("man"));
  ok(her, `the sky's halls hold a woman drawn to men (${hall.length} hands across ${stations.length} ports)`);
  if (!her) { console.log(`people: ${pass} passed, ${fail + 1} failed`); process.exit(1); }
  const straight = !her.attractedTo.includes("woman");
  ok(hireCrew(her, ship, cap) === null, `${her.name} signed on`);
  const m = crew.aboard.find((x) => x.id === her.id);
  const labels = crewTopics(m).map((t) => t.id);
  ok(labels.includes("about") && labels.includes("praise") && labels.includes("bonus") && labels.includes("chew") && labels.includes("court") && labels.includes("settleStaff") && labels.includes("settlePay"), `topics: ${labels.join(", ")}`);
  ok(/she\/her/i.test(crewTopics(m).find((t) => t.id === "about").run()), "she tells you her pronouns and who she is drawn to");
  const t0 = m.trust ?? 40;
  crewTopics(m).find((t) => t.id === "praise").run();
  ok((m.trust ?? 0) > t0 || (m.traits?.greed ?? 0) > 0.7, "praise moves trust");
  ok(!couldCourt(m).ok && /trust/.test(couldCourt(m).why), `courting needs trust first (${couldCourt(m).why})`);
  for (let i = 0; i < 6; i++) crewTopics(m).find((t) => t.id === "bonus").run();
  ok(couldCourt(m).ok, "…and after a few bonuses she would say yes");
  setSocial({ gender: "woman", attractedTo: ["woman"] });
  if (straight) ok(!couldCourt(m).ok && /not drawn/.test(couldCourt(m).why), `she is not drawn to women — declines kindly (${couldCourt(m).why})`);
  else ok(couldCourt(m).ok, "she is drawn to anyone — a woman captain is fine by her");
  setSocial({ romance: "crew" });
  ok(!couldCourt(m).ok && /crew-only/.test(couldCourt(m).why), "romance set to crew-only keeps you out of it");
  setSocial({ gender: "man", attractedTo: ["woman"], romance: "all" });
  /* force the date */
  let said = "";
  for (let i = 0; i < 40 && m.partner !== "player"; i++) { sim.time += 1; said = crewTopics(m).find((t) => t.id === "court")?.run() ?? said; }
  ok(m.partner === "player", `she said yes: ${said}`);
  ok(canConceive(m, me) && !canConceive(m, { id: "x", gender: "woman", raceId: "terran" }), "conception needs one to carry and one to sire");
  /* a cycle where the dice come up: force a pregnancy */
  m.morale = 90;
  household.pregnancies.push({ carrier: m.id, sire: "player", sireName: me.name, sireRace: me.raceId, cycles: 0, due: 6 });
  for (let i = 0; i < 6; i++) tickHousehold();
  ok(household.children.length === 1 && household.pregnancies.length === 0, `a child was born aboard: ${household.children[0]?.name}`);
  const kid = cradle.get(household.children[0].id);
  ok(kid && kid.status === "child" && kid.parents.includes(m.id) && kid.parents.includes("player"), "the child is a CRADLE record with both parents");
  ok(berthsUsed() === 2 && !overBerths(2) && overBerths(1), "two children share a berth");
  ok(crewTopics(m).some((t) => t.id === "kids"), "she will talk about the child");
  /* settle the family on the company's books */
  ship.credits = 5000;
  const staffBefore = company.staff.length;
  ok(settleFamily(m.id, "staff") === null, "the family settles at the port as company staff");
  ok(company.staff.length === staffBefore + 1 && company.staff.at(-1).family.length === 1 && crew.aboard.length === 0 && household.children.length === 0, "she and the child are off the ship and on the books");
  const tBefore = company.treasury;
  tickCompany(CYCLE_SECONDS);
  ok(company.treasury > tBefore, `staff earn the company ${Math.round(company.treasury - tBefore)} cr a cycle`);
  ok(cradle.get(m.id).status === "staff" && cradle.get(kid.id).status === "dependant", "the ledger has them settled");
  /* and the other road: pay off and record */
  const him = roster.find((c) => c.gender === "man" && c.id !== her.id);
  ok(hireCrew(him, ship, cap) === null, `${him.name} signed on`);
  const m2 = crew.aboard.find((x) => x.id === him.id);
  ok(settleFamily(m2.id, "payoff") === null && crew.aboard.length === 0, "paid off and released");
  const c = contacts();
  ok(c.some((x) => x.kind === "alumni" && x.id === him.id && x.stationId === port.id) && c.some((x) => x.kind === "staff" && x.id === her.id), `contacts keep both: ${c.map((x) => `${x.name} (${x.kind} · ${x.where})`).join("; ")}`);
  ok(cradle.get(him.id).lastContact?.station === port.id, "the ledger keeps where he was last seen");
  ship.dockedAt = null;
}

/* ---- package B additions: adjusters, robots, talk tree over the base list ---- */
{
  const m = { id: "x1", name: "Test Hand", traits: {}, morale: 50, trust: 40 };
  ok(adjustTrust(m, 10) === 50 && bumpTrust === adjustTrust && adjustMorale(m, -60) === 1 && bumpMorale === adjustMorale, "adjustTrust/adjustMorale exported, old names alias them");
  const bot = { id: "bot_x", name: "EN-1 Unit", robot: true, morale: 100, trust: 100, traits: {}, attractedTo: [], gender: "nonbinary", condition: 80 };
  ok(adjustMorale(bot, -40) === 100, "a robot's morale does not move");
  ok(!couldCourt(bot).ok && couldCourt(bot).why === "it is a machine", "couldCourt refuses a machine");
  ok(/condition/.test(greetLine(bot)), `a robot greets with its condition: ${greetLine(bot)}`);
  const { topicsFor, TREE } = await import("../js/crew/talk.js");
  ok(TREE.length >= 12 && topicsFor(bot).length === 3, `talk tree has ${TREE.length} nodes; robots get 3`);
}

console.log(`people: ${pass} passed, ${fail} failed`);
if (fail) process.exit(1);
