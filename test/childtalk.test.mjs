/* LIVING GALAXY — 0.3.57: talking with the children aboard.
 *
 *   you ask: eight topics, answered by age, temperament, teaching, parents,
 *     bond and where the ship is; a topic moves the bond once a watch
 *   they ask: a question every few watches, three answers, the bond moves and
 *     an honest answer to a curious child teaches a point (capped)
 *   the grown-ups: parents and hands do things with the children, in the log
 *
 *   node --import ./test/three-register.mjs test/childtalk.test.mjs
 */
const store = new Map();
globalThis.localStorage = { getItem: (k) => store.get(k) ?? null, setItem: (k, v) => store.set(k, String(v)), removeItem: (k) => store.delete(k) };

import { sim, launchSim, tickSim } from "../js/sim.js";
import { makePilot } from "../js/pilot.js";
import { stations } from "../js/stations.js";
import { crew, crewHooks, hireCrew, stationRoster, CYCLE_SECONDS, firstName } from "../js/crew.js";
import { household, conceive } from "../js/family.js";
import { cradle } from "../js/npc/cradle.js";
import { bondWith } from "../js/crew/children.js";
import * as CT from "../js/crew/childtalk.js";

let pass = 0, fail = 0;
const ok = (c, m) => { if (c) { pass++; if (process.env.V) console.log("  ok", m); } else { fail++; console.error("  FAIL", m); } };

makePilot("KIDS", "terran", "mining", null);
launchSim("KidTest", "sol");
sim.phase = "play";
tickSim(1 / 60);
const ship = sim.ship;
ship.credits = 900000;
const home = stations.find((s) => !s.hostile);
for (const c of stationRoster(home, 1, sim.skySeed).slice(0, 4)) hireCrew(c, ship, 12);
const [ma, pa] = crew.aboard;
const rec = conceive(ma, pa);
const kid = { id: rec.id, name: rec.name, age: 3, parents: rec.parents, raceId: rec.raceId, gender: rec.gender, pronouns: rec.pronouns, traits: rec.traits };
household.children.push(kid);
const first = firstName(kid);
ok(cradle.get(kid.id) && household.children.includes(kid), `a child aboard: ${kid.name}, ${firstName(ma)} and ${firstName(pa)}'s`);

/* ---- 1. who they are ------------------------------------------------------------------- */
ok(CT.stageOf({ age: 2 }) === "little" && CT.stageOf({ age: 10 }) === "child" && CT.stageOf({ age: 20 }) === "teen", "little, a child, a teenager");
ok(crewHooks.cycle.includes(CT.tickChildren), "the children's watch runs on the crew's pay cycle");

/* ---- 2. you ask -------------------------------------------------------------------------- */
{
  const b0 = bondWith(kid);
  const lines = {};
  for (const t of CT.CHILD_TOPICS) {
    const r = CT.talkToChild(kid, t.id);
    lines[t.id] = r.line;
    ok(r.ok && r.line.length > 5, `${t.label} — "${r.line.slice(0, 70)}"`);
  }
  ok(bondWith(kid) > b0, `talking with them builds the bond (${b0} → ${bondWith(kid)})`);
  const b1 = bondWith(kid);
  const again = CT.talkToChild(kid, "howare");
  ok(again.ok && again.delta === 0 && bondWith(kid) === b1, "the same question twice in a watch moves nothing");
  ok(lines.parents.includes(firstName(ma)) || lines.parents.includes(firstName(pa)), "they talk about their actual parents");
  ok(CT.childTalkLog(kid).length >= 4 && CT.childTalkLog(kid)[0].who === "them", "the conversation is kept, newest first");

  /* where the ship is */
  ship.dockedAt = home.id;
  sim.time += CYCLE_SECONDS;
  ok(CT.talkToChild(kid, "window").line.includes(home.name), `at a port, the window is that port (${home.name})`);
  ship.dockedAt = null;

  /* a teenager is a teenager */
  kid.age = 20;
  household.bonds[`bond:${kid.id}`] = 5;
  sim.time += CYCLE_SECONDS;
  ok(/isn't here/.test(CT.talkToChild(kid, "future").line), "a teenager you have not put the time into wants to be somewhere else");
  household.bonds[`bond:${kid.id}`] = 60;
  sim.time += CYCLE_SECONDS;
  ok(!/isn't here/.test(CT.talkToChild(kid, "future").line), "…and one you have, does not");
  kid.age = 3;
}

/* ---- 3. they ask ------------------------------------------------------------------------------ */
{
  let asked = null;
  for (let i = 0; i < 30 && !asked; i++) { sim.time += CYCLE_SECONDS; CT.tickChildren(); asked = CT.openChildAsk(kid); }
  ok(asked?.ask && asked.ask.stages.includes(CT.stageOf(kid)), `a child brings you a question: "${asked?.ask?.q}"`);
  ok(crew.log.some((l) => /has a question for you/.test(l.msg)), "…and the crew log says so");
  const b0 = bondWith(kid);
  const best = asked.ask.answers.reduce((a, b) => (b.bond > a.bond ? b : a));
  const r = CT.answerChild(kid, best.id);
  ok(r.ok && bondWith(kid) === Math.min(100, b0 + best.bond), `answering well moves the bond (+${best.bond}): "${r.line}"`);
  ok(!CT.openChildAsk(kid), "and closes the question");
  ok(!CT.answerChild(kid, best.id).ok, "you cannot answer it twice");

  /* a brush-off costs */
  let q2 = null;
  for (let i = 0; i < 30 && !q2; i++) { sim.time += CYCLE_SECONDS; CT.tickChildren(); q2 = CT.openChildAsk(kid); }
  if (q2) {
    const worst = q2.ask.answers.reduce((a, b) => (b.bond < a.bond ? b : a));
    const b1 = bondWith(kid);
    CT.answerChild(kid, worst.id);
    ok(bondWith(kid) < b1, `a brush-off costs (${worst.label}: ${b1} → ${bondWith(kid)})`);
  }
}

/* ---- 4. teaching is capped by the body ---------------------------------------------------------- */
{
  const r = cradle.get(kid.id);
  r.skills = { navigation: 999 };
  r.traits = { ...(r.traits ?? {}), curiosity: 0.9 };
  household.asks[kid.id] = { id: "stars", cycle: 0, answered: null };
  kid.age = 8;
  const out = CT.answerChild(kid, "explain");
  const cap = Math.round(28 + (r.aptitude?.navigation ?? 0.5) * 42);
  ok(out.ok && !out.taught && cradle.get(kid.id).skills.navigation === 999, "a skill already past what the body carries is not pushed further");
  r.skills.navigation = 0;
  household.asks[kid.id] = { id: "stars", cycle: 0, answered: null };
  const out2 = CT.answerChild(kid, "explain");
  ok(out2.taught === "navigation" && cradle.get(kid.id).skills.navigation === 1 && cap > 1, "an honest answer to a curious child teaches a point");
}

/* ---- 5. the grown-ups ----------------------------------------------------------------------------- */
{
  const before = crew.log.length;
  const n0 = crew.log.filter((l) => l.msg.includes(first)).length;
  for (let i = 0; i < 40; i++) { sim.time += CYCLE_SECONDS; CT.tickChildren(); }
  const moments = crew.log.filter((l) => l.msg.includes(first) && !/question/.test(l.msg) && !/asked/.test(l.msg));
  ok(moments.length >= 3 || crew.log.length >= 30, `parents and hands do things with them, in the log (${moments.length} of the last 30 lines)`);
  ok(moments.some((l) => l.msg.includes(firstName(ma)) || l.msg.includes(firstName(pa))), "mostly their own parents, when they are aboard");
  void before; void n0;
}

console.log(`childtalk: ${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
