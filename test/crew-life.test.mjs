/* LIVING GALAXY — crew life: roster, duties, talk trees, bonds, robots.
 *
 *   node --import ./test/three-register.mjs test/crew-life.test.mjs
 */

import { sim, launchSim } from "../js/sim.js";
import { makePilot } from "../js/pilot.js";
import { stations } from "../js/stations.js";
import { crew, hireCrew, stationRoster, tickCrew, CYCLE_SECONDS, crewWageTotal, crewHooks, resetCrew } from "../js/crew.js";
import { crewTopics, couldCourt, adjustTrust, adjustMorale, bumpTrust, setSocial } from "../js/family.js";
import { crewEffects, shiftPhase } from "../js/npc/crewfx.js";
import { roster, setDuty, dutyOf, dutyOptions, currentPlan, ROSTER_SORTS } from "../js/crew/roster.js";
import { TREE, ROBOT_TOPICS, topicsFor, lockedTopicsFor, open, choose, memoryOf, answerFreeText, greet, tierOf, forgetTalk, TIER_NAMES } from "../js/crew/talk.js";
import { tiesOf, tieBetween, adjustRapport, makeRivals, bondFactor, tickBonds, bondsReport } from "../js/crew/bonds.js";
import { duties, tickDuties, tickDutiesCycle, dutyBag, dutyReport } from "../js/crew/duties.js";
import { stationRoomFor } from "../js/interior/deckplan.js";
import { cradle } from "../js/npc/cradle.js";

let pass = 0, fail = 0;
const ok = (c, m) => { if (c) pass++; else { fail++; console.error("  FAIL", m); } };

makePilot("Life", "terran", "mining", null);
launchSim("LifeTest", "sol");
sim.phase = "play";
const ship = sim.ship;
ship.credits = 20000;
crew.employer = "Life";
setSocial({ gender: "man", attractedTo: ["woman"], romance: "all", family: true });

/* ---- fixture: four hands with spread temperaments -------------------------- */
const port = stations.find((s) => !s.hostile);
const hall = stationRoster(port, 0, "sol");
ok(hall.length >= 4, `the hall offers ${hall.length} hands`);
const TRAITS = [
  { grit: 0.9, caution: 0.2, greed: 0.3, loyalty: 0.8, curiosity: 0.4 },
  { grit: 0.3, caution: 0.9, greed: 0.2, loyalty: 0.5, curiosity: 0.3 },
  { grit: 0.5, caution: 0.4, greed: 0.9, loyalty: 0.2, curiosity: 0.5 },
  { grit: 0.4, caution: 0.3, greed: 0.3, loyalty: 0.6, curiosity: 0.9 },
];
for (let i = 0; i < 4; i++) ok(hireCrew(hall[i], ship, 8) === null, `${hall[i].name} signed on`);
const hands = crew.aboard.slice(0, 4);
hands.forEach((m, i) => { m.traits = { ...TRAITS[i] }; m.trust = 40; m.morale = 75; });
const [A, B, C, D] = hands;

/* ---- roster: sort / filter ---------------------------------------------------- */
{
  const byName = roster({ sort: "name" }).map((r) => r.m.name);
  ok(byName.length === 4 && byName.every((n, i) => i === 0 || n >= byName[i - 1]), `sorted by name: ${byName.join(", ")}`);
  for (const s of ROSTER_SORTS) ok(roster({ sort: s }).length === 4, `sort ${s} keeps every hand`);
  A.morale = 95; B.morale = 30;
  const byMorale = roster({ sort: "morale" });
  ok(byMorale[0].m === A && byMorale.at(-1).m === B, "morale sort puts the happiest first");
  ok(roster({ sort: "morale" }).map((r) => r.m.id).join() === roster({ sort: "morale" }).map((r) => r.m.id).join(), "sort is stable");
  ok(roster({ filter: "unsettled" }).some((r) => r.m === B) && !roster({ filter: "unsettled" }).some((r) => r.m === A), "unsettled filter finds the sour hand");
  ok(roster({ filter: { kind: "robot" } }).length === 0 && roster({ filter: "human" }).length === 4, "kind filter: no robots yet");
  const t0 = [0, 1, 2, 3].map((k) => k * 270).find((t) => shiftPhase(A.id, t) === 0);
  ok(roster({ filter: "on", time: t0 }).some((r) => r.m === A) && !roster({ filter: "off", time: t0 }).some((r) => r.m === A), "shift filter follows the rota");
  B.morale = 75; A.morale = 75;
}

/* ---- duties: an assignment reaches crewEffects ----------------------------------- */
{
  const plan = currentPlan();
  const opts = dutyOptions(plan);
  ok(opts.some((o) => o.kind === "eng") && opts.some((o) => o.kind === "cargo") && !opts.some((o) => o.kind === "mess"), `postable rooms: ${opts.map((o) => o.kind).join(", ")}`);
  ok(setDuty(A.id, "nowhere") !== null, "an unknown room kind is refused");
  ok(setDuty(A.id, "eng") === null && A.duty === "eng" && cradle.get(A.id)?.duty === "eng", "duty written and mirrored to the ledger");
  ok(stationRoomFor(plan, A).kind === "eng" && dutyOf(A).kind === "eng", "deckplan honours the assignment");
  const t = [0, 1, 2, 3, 4, 5].map((k) => k * 270 + 1).find((x) => shiftPhase(A.id, x) === 0);
  const fx = crewEffects("general_b", "LifeTest", t);
  ok(fx.manned.get("eng")?.includes(A.name.split(" ")[0]), `crewEffects sees ${A.name.split(" ")[0]} at Engineering`);
  ok(fx.bag.warp < 1, "a manned Engineering trims warp");
  setDuty(A.id, null);
  ok(A.duty === null, "duty cleared");
}

/* ---- talk: tiers, memory, every node ---------------------------------------------- */
{
  A.trust = 10;
  const ids = topicsFor(A).map((x) => x.id);
  ok(ids.includes("station") && ids.includes("run") && !ids.includes("origin") && !ids.includes("promise"), `stranger tier: ${ids.join(", ")}`);
  /* an earlier build folded talk.js's four-name ladder into the six-rung one in
   * crew/tiers.js, so the hint names a rung on THAT — "confidant" now sits
   * above "friend" where the old four-name list topped out at "friend". */
  {
    const hint = lockedTopicsFor(A).find((x) => x.id === "promise")?.why ?? "";
    const rungs = TIER_NAMES.join("|");
    ok(new RegExp(rungs).test(hint), `locked topics carry the unlock hint (${hint})`);
    ok(TIER_NAMES.length === 4 && TIER_NAMES.includes("friend") && TIER_NAMES.includes("confidant"), `the tree's four gates are named off the ladder (${TIER_NAMES.join(" → ")})`);
  }
  A.trust = 80;
  const hi = topicsFor(A).map((x) => x.id);
  ok(hi.includes("origin") && hi.includes("fears") && hi.includes("promise") && tierOf(A) === 3, "friend tier opens the whole tree");
  ok(crewTopics(A).every((t) => hi.includes(t.id)), "the base list from family.js is still in there");
  /* a choice moves trust and is remembered */
  const before = A.trust, mBefore = A.morale;
  const o = open(A, "hopes");
  ok(o.text.length > 0 && o.choices.length === 2, `hopes: ${o.text}`);
  const r = choose(A, "hopes", "help");
  ok(r.text.length > 0 && A.trust > before && A.morale > mBefore, `choice moved trust ${before}→${A.trust}: ${r.text}`);
  ok(memoryOf(A).flags.hopeBacked && memoryOf(A).topics.hopes === 1 && memoryOf(A).log.length === 2, "remembered, with a flag");
  ok(cradle.get(A.id)?.memory?.flags?.hopeBacked, "memory mirrored to the CRADLE record");
  ok(lockedTopicsFor(A).some((x) => x.id === "hopes" && /cycle/.test(x.why)), "cooldown shows as a locked topic");
  /* promise: once, and a morale floor */
  open(A, "promise"); choose(A, "promise", "shake");
  ok(memoryOf(A).flags.promised && !topicsFor(A).some((x) => x.id === "promise"), "a promise made is not asked twice");
  A.morale = 10; for (const fn of crewHooks.cycle) fn();
  ok(A.morale >= 35, "a hand who promised keeps a floor under morale");
  A.morale = 75;
  /* every tree node, every choice, every fixture: a non-empty line, no throws */
  let lines = 0, empties = 0;
  for (const m of hands) {
    m.trust = 90;
    for (const node of TREE) {
      forgetTalk(m);
      const res = open(m, node.id, { force: true });
      if (!res.text) empties++;
      for (const ch of res.choices) {
        const c = choose(m, node.id, ch.id, { force: true });
        if (!c.text) empties++; else lines++;
        m.memory.pending = null;
        open(m, node.id, { force: true });
      }
    }
  }
  ok(empties === 0 && lines > 40, `${lines} choice lines across ${TREE.length} nodes × 4 hands, ${empties} empty`);
  ok(TREE.every((n) => typeof n.id === "string" && [0, 1, 2, 3].includes(n.tier)), "every node has an id and a tier");
  /* the greeting remembers */
  hands.forEach((m) => { forgetTalk(m); m.duty = null; m.wage = m.listWage ?? m.wage; });
  A.trust = 80; open(A, "origin"); sim.time += 120;
  ok(/Last time/.test(greet(A)), `greeting remembers: ${greet(A)}`);
  /* free text without a speech world */
  const f1 = answerFreeText(A, "how is the reactor holding?"), f2 = answerFreeText(C, "any chance of a bonus?"), f3 = answerFreeText(B, "");
  ok(typeof f1 === "string" && f1.length > 5 && /:/.test(f2) && f3.length > 0, `free text: ${f1} / ${f2}`);
  /* the old adjusters and their aliases */
  const tr = A.trust; adjustTrust(A, 5); ok(A.trust === Math.min(100, tr + 5) && bumpTrust === adjustTrust, "adjustTrust works and bumpTrust aliases it");
  adjustMorale(A, -100); ok(A.morale === 1, "morale never drops below 1"); A.morale = 75;
}

/* ---- bonds: ties and the watch ------------------------------------------------------- */
{
  adjustRapport(A, B, 80);
  ok(tieBetween(A, B) === "friend" && tiesOf(A).some((t) => t.with === B.id && t.kind === "friend"), "rapport 80 → friend badge");
  ok(bondsReport()[0].kind === "friend", "bondsReport lists the friendship first");
  /* rival pair on the same watch lowers the bag versus the same pair apart */
  /* two hands who share a watch somewhere on the rota (offsets can make a pair never overlap) */
  let X = C, Y = D, t = null;
  outer: for (const p of hands) for (const q of hands) {
    if (p === q || p === A || q === A) continue;
    const found = [...Array(60)].map((_, k) => k * 15 + 1).find((x) => shiftPhase(p.id, x) === 0 && shiftPhase(q.id, x) === 0);
    if (found != null) { X = p; Y = q; t = found; break outer; }
  }
  ok(t != null, "a pair of hands share a watch somewhere on the rota");
  for (const m of hands) m.duty = "cargo";
  X.duty = "eng"; Y.duty = "eng";
  const apart = crewEffects("general_b", "LifeTest", t).bag.warp;
  X.bonds[Y.id] = 5; Y.bonds[X.id] = 5; makeRivals(X, Y);
  ok(tieBetween(X, Y) === "rival", "a declared rivalry at low rapport is a rival tie");
  const manned = new Map([["eng", [X.id, Y.id]]]);
  ok(bondFactor(X, manned) < 1 && bondFactor(A, new Map([["eng", [A.id, B.id]]])) > 1, "bondFactor: rival on the post < 1, friend > 1");
  const together = crewEffects("general_b", "LifeTest", t + 1).bag.warp;
  ok(together > apart && together < 1, `rivals on the same watch trim less (warp ${apart.toFixed(3)} → ${together.toFixed(3)})`);
  const cm = X.morale, dm = Y.morale;
  tickBonds();
  ok(X.morale < cm && Y.morale < dm, "rivals sharing a watch sour each cycle");
  adjustRapport(X, Y, 60);
  ok(tieBetween(X, Y) !== "rival", "rapport back up heals the rivalry");
  for (const m of hands) m.duty = null;
  /* the talk tree lets the captain take a side */
  C.bonds[D.id] = 5; D.bonds[C.id] = 5; makeRivals(C, D);
  C.trust = 40; forgetTalk(C);
  const o = open(C, "mates");
  ok(o.choices.some((x) => x.id === `mend:${D.id}`), `crewmates topic offers to mend it: ${o.choices.map((x) => x.label).join(" / ")}`);
  const r0 = C.bonds[D.id];
  choose(C, "mates", `mend:${D.id}`);
  ok(C.bonds[D.id] > r0, "mending raises rapport");
}

/* ---- duties: wear ---------------------------------------------------------------------- */
{
  duties.wear = 0;
  for (const m of hands) m.duty = "cargo";
  const t0 = [...Array(60)].map((_, k) => k * 45 + 1).find((x) => hands.every((m) => shiftPhase(m.id, x) !== 0 || dutyOf(m).kind !== "eng"));
  ship.throttle = 1.4; sim.heat = 0;
  for (let i = 0; i < 6; i++) tickDuties(10, t0);
  const w1 = duties.wear;
  ok(w1 > 0.05, `wear rises under overdrive with nobody on Engineering (${w1.toFixed(3)})`);
  ok(dutyBag().warp > 1 && dutyBag().hull < 1, "the duty bag prices the backlog");
  ok(dutyReport().every((d) => d.kind !== "eng"), "report shows no engineer");
  A.duty = "eng"; A.morale = 90;
  const t1 = [...Array(60)].map((_, k) => k * 45 + 1).find((x) => shiftPhase(A.id, x) === 0);
  ship.throttle = 0; ship.hull = 80;
  for (let i = 0; i < 6; i++) tickDuties(10, t1);
  ok(duties.wear < w1, `…and falls with an engineer on watch (${duties.wear.toFixed(3)})`);
  ok(ship.hull > 80, "the engineer patches the hull");
  ok(dutyReport().some((d) => d.id === A.id && d.task === "maintain" && d.working), "report names the engineer");
  duties.wear = 0.8;
  const morale = hands.map((m) => m.morale);
  tickDutiesCycle();
  ok(hands.every((m, i) => m.morale < morale[i]), "a neglected hull sours the crew each cycle");
  duties.wear = 0; ship.throttle = 0; ship.hull = 100;
  for (const m of hands) m.duty = null;
}

/* ---- robots -------------------------------------------------------------------------------- */
{
  const bot = { id: "bot_t1", robot: true, kind: "engineer", name: "EN-7 Kettle", designation: "EN-7", title: "Engineer", complexId: "energy", complexName: "Energy", letter: "—", wage: 0, listWage: 0, morale: 100, trust: 100, traits: { grit: 1, caution: 0.5, greed: 0, loyalty: 1, curiosity: 0.2 }, gender: "nonbinary", pronouns: { subj: "they", obj: "them", pos: "their" }, attractedTo: [], synthetic: true, condition: 60, kw: 1.6, partner: null, bonds: {}, cyclesAboard: 0 };
  crew.aboard.push(bot);
  for (const m of hands) m.morale = 75;
  const wages = crewWageTotal();
  ok(wages === hands.reduce((a, m) => a + m.wage, 0), "a robot draws no wage");
  ship.credits = 0;
  tickCrew(CYCLE_SECONDS, ship);
  ok(bot.morale === 100 && crew.aboard.includes(bot), "an unpaid cycle leaves the robot at 100 and aboard");
  ok(hands.every((m) => m.morale < 75), "…while the humans soured");
  ship.credits = 20000;
  ok(!couldCourt(bot).ok && /machine/.test(couldCourt(bot).why), `no dinner: ${couldCourt(bot).why}`);
  const rt = topicsFor(bot).map((x) => x.id);
  ok(rt.length === 3 && !rt.includes("court") && !rt.includes("bonus") && ROBOT_TOPICS.length === 3, `robot tree: ${rt.join(", ")}`);
  for (const id of rt) { const o = open(bot, id); ok(o.text.length > 0 && o.choices.length > 0, `robot ${id}: ${o.text}`); ok(choose(bot, id, o.choices[0].id).text.length > 0, `robot ${id} choice answers`); }
  bot.duty = "eng";
  const fx = crewEffects("general_b", "LifeTest", 5);
  ok(fx.manned.get("eng")?.includes("EN-7"), "a robot stands every watch");
  const strength = 0.5 + 60 / 200;
  const expect = 1 + (0.9 - 1) * strength * bondFactor(bot, fx.mannedIds);
  ok(Math.abs(fx.bag.warp - expect) < 1e-9 || fx.manned.get("eng").length > 1, `robot strength is 0.5 + condition/200 (${fx.bag.warp.toFixed(4)})`);
  bot.idle = true;
  ok(!crewEffects("general_b", "LifeTest", 6).manned.get("eng")?.includes("EN-7"), "an idle robot is skipped");
  ok(roster({ filter: "robot" }).length === 1 && roster({ filter: "unsettled" }).some((r) => r.m === bot), "roster filters find the robot, and flags it for service");
  adjustMorale(bot, -50);
  ok(bot.morale === 100, "adjustMorale leaves a robot alone");
  ok(answerFreeText(bot, "how is the hull?").length > 0, "a robot answers free text");
  crew.aboard.splice(crew.aboard.indexOf(bot), 1);
}

/* ---- reset ---------------------------------------------------------------------------------- */
duties.wear = 0.5;
resetCrew();
ok(duties.wear === 0 && crew.aboard.length === 0, "resetCrew clears the crew and the backlog");

console.log(`crew-life: ${pass} passed, ${fail} failed`);
if (fail) process.exit(1);
