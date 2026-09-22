/* LIVING GALAXY 0.3.17 — conversations that carry on.
 *
 *   node --import ./test/three-register.mjs test/converse.test.mjs
 *
 * Every tree topic runs more than one turn, every path through it ends in a
 * line and never runs away; the flags a thread leaves are picked up by a later
 * conversation that reads the ship as it is now (the fund, the mate you said
 * you'd look after, payroll); one id is one topic; the greeting knows there is
 * something to pick up.
 */

import { sim, launchSim } from "../js/sim.js";
import { makePilot } from "../js/pilot.js";
import { stations } from "../js/stations.js";
import { crew, hireCrew, stationRoster, crewHooks } from "../js/crew.js";
import { setSocial } from "../js/family.js";
import { TREE, THREADS, topicsFor, open, choose, memoryOf, forgetTalk, greet } from "../js/crew/talk.js";
import { hopeFundOf } from "../js/crew/talk-threads.js";

let pass = 0, fail = 0;
const ok = (c, m) => { if (c) pass++; else { fail++; console.error("  FAIL", m); } };

makePilot("Talk", "terran", "commerce", null);
launchSim("ConverseTest", "sol");
sim.phase = "play";
const ship = sim.ship;
ship.credits = 50000;
crew.employer = "Talk";
setSocial({ gender: "man", attractedTo: ["woman"], romance: "all", family: true });
const port = stations.find((s) => !s.hostile);
for (const c of stationRoster(port, 0, "sol").slice(0, 4)) hireCrew(c, ship, 8);
const hands = crew.aboard.slice(0, 4);
const TRAITS = [
  { grit: 0.9, caution: 0.2, greed: 0.3, loyalty: 0.8, curiosity: 0.4 },
  { grit: 0.3, caution: 0.9, greed: 0.2, loyalty: 0.5, curiosity: 0.3 },
  { grit: 0.5, caution: 0.4, greed: 0.9, loyalty: 0.2, curiosity: 0.5 },
  { grit: 0.4, caution: 0.3, greed: 0.3, loyalty: 0.6, curiosity: 0.9 },
];
hands.forEach((m, i) => { m.traits = { ...TRAITS[i] }; m.trust = 90; m.morale = 80; });
const cycle = (n = 1) => { for (let k = 0; k < n; k++) { for (const m of crew.aboard) m.cyclesAboard = (m.cyclesAboard ?? 0) + 1; for (const fn of crewHooks.cycle) fn(); } };

/* ---- every topic is a conversation, not a line -------------------------------------- */
{
  let nodes = 0, deep = 0, paths = 0, empty = 0, runaway = 0, maxDepth = 0;
  const walk = (m, topic, choices, depth) => {
    for (const ch of choices) {
      /* replay to this point: open, then the path so far */
      const r = choose(m, topic, ch.id, { force: true });
      if (!r.text) empty++;
      if (r.choices?.length) {
        if (depth > 4) { runaway++; continue; }
        maxDepth = Math.max(maxDepth, depth + 1);
        walk(m, topic, r.choices, depth + 1);
      } else paths++;
      /* restore the pending list to this level for the next sibling */
      memoryOf(m).pending = { topic, choices: choicesAt.get(`${topic}:${depth}`) };
    }
  };
  const choicesAt = new Map();
  for (const m of hands) {
    for (const node of TREE) {
      forgetTalk(m);
      const o = open(m, node.id, { force: true });
      if (!o.text) empty++;
      nodes++;
      let hasFollow = false;
      for (const ch of o.choices) {
        forgetTalk(m);
        const o2 = open(m, node.id, { force: true });
        const first = memoryOf(m).pending?.choices ?? [];
        const r = choose(m, node.id, ch.id, { force: true });
        if (!r.text) empty++;
        if (r.choices?.length) {
          hasFollow = true;
          const lvl = memoryOf(m).pending.choices;
          choicesAt.set(`${node.id}:1`, lvl);
          walk(m, node.id, r.choices, 1);
        } else paths++;
        void o2; void first;
      }
      if (hasFollow) deep++;
    }
  }
  ok(empty === 0, `no empty line anywhere in the tree (${paths} complete paths)`);
  ok(runaway === 0 && maxDepth <= 4, `every thread ends (deepest ${maxDepth + 1} turns)`);
  ok(deep / nodes >= 0.8, `most topics carry on past the first answer (${deep}/${nodes} topic × hand)`);
}

/* ---- a follow-up answers what was just said ---------------------------------------- */
{
  const m = hands[1];
  forgetTalk(m);
  const o = open(m, "hopes", { force: true });
  const r = choose(m, "hopes", "help", { force: true });
  ok(o.choices.length === 2 && r.choices.length >= 2, `hopes → help carries on: ${r.text}`);
  ok(r.choices.every((c) => !o.choices.some((x) => x.label === c.label)), `with new answers, not the old ones again (${r.choices.map((c) => c.label).join(" / ")})`);
  const credits0 = ship.credits;
  const r2 = choose(m, "hopes", "match", { force: true });
  ok(r2.text && !r2.choices.length && memoryOf(m).flags.hopeFund === "matched", "matching the fund ends the thread with a promise on file");
  ok(memoryOf(m).log.length === 3, "and every turn is in their memory");
  /* the thread's other end */
  ok(!topicsFor(m).some((t) => t.id === "t-hope"), "the follow-up waits for time to pass");
  cycle(3);
  const saved = hopeFundOf(m);
  ok(saved > 0 && ship.credits < credits0, `three cycles on, the fund holds ${saved} cr and the ship paid its match (${credits0} → ${ship.credits})`);
  const t = topicsFor(m).find((x) => x.id === "t-hope");
  ok(t && /^↻/.test(t.label), `the next part is on the board: ${t?.label}`);
  const g = greet(m);
  ok(/pick up from last time/.test(g), `and the greeting says so: ${g}`);
  const h = open(m, "t-hope");
  ok(h.text.includes(saved.toLocaleString("en-US")), `picking it up names the real fund: ${h.text}`);
  const gift = choose(m, "t-hope", "gift");
  ok(hopeFundOf(m) === saved + 250 && gift.text.includes((saved + 250).toLocaleString("en-US")), "adding to it moves the number they say back");
}

/* ---- "I'll talk to them" comes back with how they are now --------------------------- */
{
  const [m, low] = [hands[0], hands[2]];
  for (const x of hands) x.morale = 80;
  low.morale = 30;
  forgetTalk(m);
  open(m, "mess", { force: true });
  const r = choose(m, "mess", "talk", { force: true });
  ok(memoryOf(m).flags.looksAfter === low.id && r.choices.length, `mess → "I'll talk to ${low.name.split(" ")[0]}" is filed and carries on: ${r.text}`);
  choose(m, "mess", "first", { force: true });
  cycle(1);
  low.morale = 55;
  const t = topicsFor(m).find((x) => x.id === "t-looked");
  ok(t && t.label.includes(low.name.split(" ")[0]), `the next conversation asks after them: ${t?.label}`);
  const o = open(m, "t-looked");
  ok(/Better/.test(o.text), `and reads their morale as it is now (30 → 55): ${o.text}`);
  low.morale = 10;
  memoryOf(m).flags.looksAfterMorale = 30;
  memoryOf(m).used["t-looked"] = -99;
  const o2 = open(m, "t-looked");
  ok(/Worse/.test(o2.text), `and says so when it has gone the other way: ${o2.text.slice(0, 60)}…`);
}

/* ---- a promise about pay is held to payroll ------------------------------------------ */
{
  const m = hands[3];
  forgetTalk(m);
  open(m, "lastBerth", { force: true });
  choose(m, "lastBerth", "here", { force: true });
  choose(m, "lastBerth", "every", { force: true });
  ok(memoryOf(m).flags.payPromise, "promised pay on the cycle");
  crew.lastPay = { total: 400, paid: 300, shortfall: 100 };
  const t = topicsFor(m).find((x) => x.id === "t-pay");
  ok(t, "a short payroll brings it back");
  const o = open(m, "t-pay");
  ok(/100 short/.test(o.text) && o.choices.some((c) => c.id === "settle"), `naming the real shortfall: ${o.text}`);
  const c0 = ship.credits;
  choose(m, "t-pay", "settle");
  ok(ship.credits === c0 - 100 && crew.lastPay.shortfall === 0, "and settling it pays it");
}

/* ---- one id, one topic --------------------------------------------------------------- */
{
  for (const m of hands) {
    const ids = topicsFor(m).map((t) => t.id);
    ok(new Set(ids).size === ids.length, `${m.name}: no two topics share an id (${ids.length})`);
  }
  ok(THREADS.every((n) => n.id.startsWith("t-") && /^↻/.test(typeof n.label === "string" ? n.label : "↻")), "every thread is marked as a continuation");
}

console.log(`converse: ${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
