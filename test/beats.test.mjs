/* Living Galaxy — staged social acts, and the ways they used to go wrong.
 *
 *   node --import ./test/three-register.mjs test/beats.test.mjs
 */

import { sim, launchSim } from "../js/sim.js";
import { makePilot } from "../js/pilot.js";
import { stations } from "../js/stations.js";
import { crew, hireCrew, stationRoster, dismissCrew, resetCrew } from "../js/crew.js";
import { cradle } from "../js/npc/cradle.js";
import { setSocial, social, trustOf, couldCourt, pairWithPlayer, bumpTrust } from "../js/family.js";
import { addHook, runHooks, addons } from "../js/crew/hooks.js";
import { CORE_BEATS, beatsFor, playBeat, isRunning, stopAllBeats, advanceBeat } from "../js/crew/beats.js";

let pass = 0, fail = 0;
const ok = (c, m) => { if (c) pass++; else { fail++; console.error("  FAIL", m); } };
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
/* 0.3.17: a beat waits on the captain — answer every stage (the first answer offered) to play it through */
const drive = (stop, pickIx = 0) => { for (let k = 0; k < 20 && stop.stage?.(); k++) { const st = stop.stage(); stop.advance(st.choices[Math.min(pickIx, st.choices.length - 1)].id); } };

makePilot("Beat", "terran", "security", null);
launchSim("BeatTest", "sol");
sim.phase = "play";
const ship = sim.ship;
ship.credits = 500000;
sim.crewCapacity = 10;
setSocial({ romance: "all", family: true, gender: "woman", attractedTo: ["man", "woman"] });
for (const c of stationRoster(stations[0], 0, sim.skySeed).slice(0, 5)) hireCrew(c, ship, 10);
ship.dockedAt = stations[0].id;
ok(crew.aboard.length >= 4, `${crew.aboard.length} hands aboard`);

/* ---- 1. the shape of a beat ---------------------------------------------------- */

{
  ok(CORE_BEATS.length >= 6, `${CORE_BEATS.length} core acts`);
  ok(CORE_BEATS.every((b) => b.id && b.label && b.kind && (typeof b.scene === "function" || typeof b.steps === "function") && typeof b.resolve === "function"),
    "every one has an id, a label, a scene (0.3.17; steps for an addon's) and a resolve");
  const dinner = CORE_BEATS.find((b) => b.id === "dinner");
  ok(dinner.replaces === "court", "the staged dinner declares it replaces the one-tap topic, so the list has no twin labels");
  const list = beatsFor(crew.aboard[0]);
  ok(list.length > 0 && list.every((b) => !b.when || b.when(crew.aboard[0])), "beatsFor only offers what is actually available");
  const robot = { id: "r1", robot: true, traits: {} };
  ok(beatsFor(robot).every((b) => b.kind !== "romance"), "and never offers a machine a romance");
}

/* ---- 2. a one-step beat used to throw ------------------------------------------
 * `finish()` cleared an interval declared after the synchronous first tick, so
 * any beat that resolved immediately died on a temporal-dead-zone error before
 * it ever reached its outcome.
 */

{
  addHook("beats", () => [{
    id: "onestep", label: "One step", kind: "friend", ms: 40,
    steps: () => ["the only line"],
    resolve: () => ({ ok: true, trust: 1, line: "done" }),
  }]);
  const m = crew.aboard[0];
  let done = null, threw = null;
  try { drive(playBeat(m, "onestep", { onDone: (r) => { done = r; }, rng: () => 0 })); } catch (e) { threw = e.message; }
  ok(threw === null, `a one-step act does not throw (${threw ?? "clean"})`);
  ok(done?.ok === true, "and reaches its outcome");
  ok(done?.tag === "+trust", `with a tag built from what actually landed: "${done?.tag}"`);

  /* a beat whose steps blow up is survivable too */
  addHook("beats", () => [{ id: "broken", label: "Broken", kind: "friend", ms: 40, steps: () => { throw new Error("nope"); }, resolve: () => ({ ok: false, line: "—" }) }]);
  let done2 = null, threw2 = null;
  try { drive(playBeat(crew.aboard[0], "broken", { onDone: (r) => { done2 = r; }, rng: () => 0 })); } catch (e) { threw2 = e.message; }
  ok(threw2 === null && done2 !== null, "and an act whose lines throw still finishes rather than hanging the panel");
}

/* ---- 3. one at a time ----------------------------------------------------------
 * Switching hands mid-act used to leave the first one ticking against a panel
 * nobody was looking at, and it still applied its outcome.
 */

{
  stopAllBeats();
  const a = crew.aboard[0], b = crew.aboard[1];
  playBeat(a, "watch", { rng: () => 0 });
  ok(isRunning(a.id), "one act running");
  playBeat(b, "watch", { rng: () => 0 });
  ok(!isRunning(a.id) && isRunning(b.id), "starting another cancels the first — one captain, one conversation");
  let busy = null;
  playBeat(b, "mess", { onDone: (r) => { busy = r; }, rng: () => 0 });
  ok(busy?.cancelled && busy.tag === "busy", "and asking the same hand for a second act answers the caller rather than dropping it");
  stopAllBeats();
  ok(!isRunning(b.id), "stopAllBeats clears the board");
}

/* ---- 4. somebody who leaves does not finish the conversation -------------------- */

{
  stopAllBeats();
  const m = crew.aboard[3];
  const trustBefore = trustOf(m);
  let done = null;
  const stopM = playBeat(m, "mess", { onDone: (r) => { done = r; }, rng: () => 0 });
  dismissCrew(m.id);
  drive(stopM);
  ok(!crew.aboard.includes(m), `${m.name} was paid off mid-act`);
  ok(done?.cancelled === true, `and the act was dropped rather than resolved (${done?.tag})`);
  ok(Math.abs(trustOf(m) - trustBefore) < 0.01, "with nothing applied to somebody who is not aboard");
  ok(!isRunning(m.id), "and nothing left running behind them");
}

/* ---- 5. a new sky is a clean board ---------------------------------------------- */

{
  const m = crew.aboard[0];
  const id = m.id;
  playBeat(m, "watch", { rng: () => 0 });
  ok(isRunning(id), "an act is running");
  resetCrew();
  ok(!isRunning(id), "resetCrew clears it — a stale entry used to lock that person out of every act for the session");
}

/* ---- 6. the outcome has to match the label ------------------------------------
 * The port walk advertised "+spark" and then dropped it, because a captain is
 * not on the crew's own ladder and the apply step skipped anything without a
 * second crew member to spark with.
 */

ship.credits = 500000;
for (const c of stationRoster(stations[1] ?? stations[0], 1, sim.skySeed).slice(0, 4)) hireCrew(c, ship, 10);
ship.dockedAt = stations[0].id;

{
  const m = crew.aboard[0];
  const walk = CORE_BEATS.find((b) => b.id === "walk");
  const res = walk.resolve(m, () => 0);
  ok(res.spark > 0 && res.with === undefined, "the walk still resolves with a spark and nobody to spend it on");
  const before = trustOf(m);
  let done = null;
  drive(playBeat(m, "walk", { onDone: (r) => { done = r; }, rng: () => 0 }));
  ok(done?.applied, "the act reports what it applied");
  ok(trustOf(m) > before, `and the spark landed as standing with the captain (${Math.round(before)} → ${Math.round(trustOf(m))})`);
  ok((done.applied.trust ?? 0) > (res.trust ?? 0), "which is more than the flat trust the line alone would have given");
}

/* ---- 7. asking somebody to dinner ---------------------------------------------
 * The staged act set `m.partner = "player"` on its own: no ledger entry, no
 * line in the crew log, and no check that they were drawn to you at all.
 */

{
  const m = crew.aboard.find((x) => !x.robot && !x.partner) ?? crew.aboard[0];
  const dinner = CORE_BEATS.find((b) => b.id === "dinner");

  /* somebody who would refuse in conversation is not offered the act */
  const cold = couldCourt(m);
  if (!cold.ok) {
    ok(dinner.when(m) === false || Boolean(m.partner), `not offered while ${cold.why}`);
    const res = dinner.resolve(m, () => 0);
    ok(res.ok === false && m.partner !== "player", "and a forced resolve refuses rather than pairing you anyway");
  }

  /* earn it, then ask */
  bumpTrust(m, 100);
  const can = couldCourt(m);
  if (can.ok) {
    const logBefore = crew.log.length;
    const res = dinner.resolve(m, () => 0);
    ok(res.ok && m.partner === "player", `${m.name} said yes`);
    const rec = cradle.get(m.id);
    ok(rec?.partner === "player", "the ledger knows — it used to have no idea");
    ok((rec.history ?? []).some((h) => /captain/i.test(h.text)), "with a line in their record");
    ok(crew.log.length > logBefore && crew.log.some((x) => /official aboard/i.test(x.msg)), "and a line in the crew log");
    ok(beatsFor(m).every((b) => b.id !== "dinner"), "and they are not asked again");
  } else {
    ok(true, `could not reach a yes this run: ${can.why}`);
  }
}

/* ---- 8. pairWithPlayer is the one door ------------------------------------------ */

{
  const other = crew.aboard.find((x) => !x.robot && x.partner !== "player");
  if (other) {
    setSocial({ romance: "crew" });
    const r = pairWithPlayer(other);
    ok(r.ok === false, `with romance set to crew-only it refuses: ${r.why}`);
    setSocial({ romance: "all" });
    ok(pairWithPlayer({ id: "x", robot: true }).ok === false, "and never pairs you with a machine");
  } else ok(true, "nobody spare to try it with");
}

/* ---- 9. hooks ------------------------------------------------------------------- */

{
  ok(typeof addHook === "function" && typeof runHooks === "function", "the hook bus is there");
  const off = addHook("houseRules", () => { throw new Error("addon blew up"); });
  let threw = null;
  try { runHooks("houseRules", null, {}); } catch (e) { threw = e.message; }
  ok(threw === null, "a hook that throws cannot take the panel down with it");
  off();
  ok(typeof addons.adult === "boolean", `the pack flag is readable (adult: ${addons.adult})`);
  ok(runHooks("nosuchbucket").length === 0, "an unknown bucket is empty, not an error");
}

/* ---- 10. 0.3.17: nothing plays itself ---------------------------------------------
 * A beat used to run on a setInterval — the bar filled, three unrelated lines
 * went by and the outcome landed without the captain touching anything. */

{
  stopAllBeats();
  const m = crew.aboard.find((x) => !x.robot);
  const steps = [];
  let done = null;
  const stop = playBeat(m, "watch", { onStep: (s) => steps.push(s), onDone: (r) => { done = r; }, rng: () => 0.5 });
  await wait(3000);
  ok(steps.length === 1 && !done && isRunning(m.id), `three seconds on, the scene is still on its first stage, waiting (${steps.length} step shown)`);
  ok(steps[0].choices.length >= 2 && steps[0].choices.every((c) => c.id && c.label), `and it offers the captain answers: ${steps[0].choices.map((c) => c.label).join(" / ")}`);
  ok(!stop.advance("no-such-answer") && steps.length === 1, "an answer that is not on offer moves nothing");
  ok(advanceBeat(m.id, steps[0].choices[0].id) && steps.length === 2, "answering moves it on one stage");
  ok(/^You: "/.test(steps[1].line), `and the next stage opens with what you said: ${steps[1].line.slice(0, 70)}…`);
  ok(steps[1].frac > steps[0].frac && steps[1].frac < 1, "the bar moves with the answer, and only with it");
  drive(stop);
  ok(done && !done.cancelled && done.answered.length === 3, `played through: ${done?.answered.map((a) => a.choice).join(" → ")} → ${done?.tag}`);
}

/* what the captain says moves the odds, through the same roll an addon's resolve makes */
{
  const m = crew.aboard.find((x) => !x.robot);
  const outcome = (pick) => { stopAllBeats(); let r = null; const st = playBeat(m, "confide", { onDone: (x) => { r = x; }, rng: () => 0.42 }); drive(st, pick); return r; };
  const warm = outcome(0), cold = outcome(2);
  ok(warm && cold && warm.lean > cold.lean, `answers lean the scene: warm ${warm?.lean} vs blunt ${cold?.lean}`);
  let flips = 0;
  const keepT = m.trust, keepM = m.morale;
  for (const roll of [0.3, 0.45, 0.6, 0.72, 0.8, 0.86, 0.9, 0.94, 0.97, 0.99]) {
    m.trust = 10; m.morale = 45;             // a hand the scene could go either way with
    stopAllBeats(); let a = null, b = null;
    drive(playBeat(m, "mess", { onDone: (x) => { a = x; }, rng: () => roll }), 0);
    stopAllBeats();
    m.trust = 10; m.morale = 45;
    drive(playBeat(m, "mess", { onDone: (x) => { b = x; }, rng: () => roll }), 2);
    if (a.ok !== b.ok) flips++;
  }
  m.trust = keepT; m.morale = keepM;
  ok(flips >= 1, `on the same roll, how you answer can decide it (${flips} of 10 rolls flipped)`);
  stopAllBeats();
}

/* every core scene is written to be answered, and reads as one conversation */
{
  const m = crew.aboard.find((x) => !x.robot);
  for (const b of CORE_BEATS) {
    const sc = b.scene(m);
    ok(Array.isArray(sc) && sc.length >= 2 && sc.every((st) => st.line && st.line.length > 20 && st.choices?.length >= 1), `${b.id}: ${sc.length} stages, each a line and its answers`);
    ok(sc.every((st) => st.choices.every((c) => typeof c.lean === "number" && typeof c.say === "function")), `${b.id}: every answer leans and speaks`);
  }
}

console.log(`beats: ${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
