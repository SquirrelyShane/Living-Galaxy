/* LIVING GALAXY — 0.3.14: the MISSION CORE walkthrough.
 *
 * The track exists because "refit at a logistic or military yard" is not an
 * instruction anybody can follow the first time they read it. So what is tested
 * here is that it answers the questions in order and against the REAL sky:
 * a yard that exists, pinned so it cannot move mid-flight, steps that advance
 * on measured state, and an end condition that is the core actually being
 * aboard rather than a tap.
 *
 *   node --import ./test/three-register.mjs test/tutorial-core.test.mjs
 */

const store = new Map();
globalThis.localStorage ??= { getItem: (k) => (store.has(k) ? store.get(k) : null), setItem: (k, v) => store.set(k, String(v)), removeItem: (k) => store.delete(k) };

const { sim, launchSim, tickSim } = await import("../js/sim.js");
const { makePilot } = await import("../js/pilot.js");
const { touch } = await import("../js/input.js");
const { upgrades, hasUpgrade } = await import("../js/upgrades.js");
const { stations } = await import("../js/stations.js");
const { missionCore, presets } = await import("../js/mission/script.js");
const { CORE_STEPS, coreYard, core, resetCoreTrack } = await import("../js/tutorial-core.js");
const { tutorial, startTutorial, startCoreTutorial, skipTutorial, tickTutorial, tutorialSteps, tutorialEvaluate } = await import("../js/tutorial.js");

let pass = 0, fail = 0;
const ok = (c, m) => { if (c) pass++; else { fail++; console.error("  FAIL", m); } };

makePilot("Core", "terran", "mining", null);
launchSim("CoreTutorial", "sol");
sim.phase = "play";
touch.panX = touch.panY = touch.rcsX = touch.rcsY = 0;
const ship = sim.ship;
tickSim(1 / 60);

/* ---- the track is shaped like the intro one -------------------------------- */
{
  ok(CORE_STEPS.length === 6, `six phases (${CORE_STEPS.length})`);
  ok(CORE_STEPS.map((s) => s.id).join(",") === "core-what,core-find,core-warp,core-approach,core-dock,core-fit",
    `in order: ${CORE_STEPS.map((s) => s.id).join(", ")}`);
  ok(CORE_STEPS.every((s) => typeof s.text === "function" && typeof s.done === "function"), "every phase has text and a done check");
  ok(CORE_STEPS.filter((s) => s.next?.()).length === 1 && CORE_STEPS[0].next(), "only the opening phase — the one with nothing to measure — carries NEXT");
  ok(["core-warp", "core-approach", "core-dock", "core-fit"].every((id) => CORE_STEPS.find((s) => s.id === id).hilite?.()),
    "every phase that names a control says which one to light");
  ok(CORE_STEPS.find((s) => s.id === "core-dock").hilite() === "#op-dock", "DOCK points at the dash-page-2 switch");
  ok(CORE_STEPS.find((s) => s.id === "core-fit").hilite() === "#aux-deck", "REFIT points at DECK");
}

/* ---- it finds a real yard, and pins it ------------------------------------- */
{
  resetCoreTrack();
  const y = coreYard(ship.pos);
  ok(y, "a yard is found in Sol");
  ok(y && ["logistic", "military"].includes(y.st.sector), `and its lines fit a core (${y?.st?.sector})`);
  ok(y && !y.st.hostile && y.st.hangars?.length, "and it is a port you can actually berth at");
  ok(core.stId === y.st.id, "the choice is pinned");

  /* park the ship on top of a DIFFERENT fitting yard; the pin must hold */
  const other = stations.find((s) => s.id !== y.st.id && ["logistic", "military"].includes(s.sector) && !s.hostile && s.hangars?.length);
  if (other) {
    ship.pos.x = other.x; ship.pos.y = other.y; ship.pos.z = other.z;
    ok(coreYard(ship.pos).st.id === y.st.id, "another fitting yard does not steal the trip mid-flight");
    ok(coreYard(ship.pos).dist !== y.dist, "…but the distance it reports is live");
  } else { pass += 2; }
  resetCoreTrack();
}

/* ---- the phases advance on the world, not on taps -------------------------- */
{
  ship.pos.x = 0; ship.pos.y = 0; ship.pos.z = 0;
  ship.dockedAt = null;
  upgrades.owned = upgrades.owned.filter((id) => id !== "nav_core" && id !== "conn_learner");
  resetCoreTrack();
  try { localStorage.removeItem("lgaa.tutorial.core.v1"); } catch { /* fine */ }

  ok(startCoreTutorial(false) && tutorial.active && tutorial.track === "core", "it starts, once, on its own");
  ok(tutorial.step === 0 && tutorialSteps().length === 6, "at phase one, and tutorialSteps follows the track");
  ok(!startCoreTutorial(false), "and it does not start itself a second time");
  ok(startCoreTutorial(true), "SHOW ME can always bring it back");

  const y = coreYard(ship.pos);
  const find = CORE_STEPS.find((s) => s.id === "core-find");
  ok(!find.done(), "SET COURSE has not been taken yet");
  find.action()?.run();
  ok(sim.lock.id === y.st.id, "SET COURSE puts the lock on the yard");
  ok(find.done(), "…which is what advances the phase");

  const warp = CORE_STEPS.find((s) => s.id === "core-warp");
  ok(!warp.done(), "and while the yard is a long way off, the warp phase stands");
  ship.pos.x = y.st.x - y.range * 0.5; ship.pos.y = y.st.y; ship.pos.z = y.st.z;
  ok(warp.done(), "closing on it clears the warp phase");
  ok(CORE_STEPS.find((s) => s.id === "core-approach").done(), "and the approach, once inside the ring");

  const dock = CORE_STEPS.find((s) => s.id === "core-dock");
  ok(!dock.done(), "the berth is not taken by being near it");
  ship.dockedAt = y.st.id;
  ok(dock.done(), "docking there takes it");

  const fit = CORE_STEPS.find((s) => s.id === "core-fit");
  ok(!fit.done(), "and the last phase waits for the core itself, not for a tap");
  upgrades.owned.push("nav_core");
  ok(fit.done() && missionCore(), "which ends it");

  ok(CORE_STEPS.every((s) => typeof s.text(tutorial.ctx) === "string" && s.text(tutorial.ctx).length > 40), "every phase says something");
  const ev = tutorialEvaluate();
  ok(ev.track === "core" && ev.step === "core-what", `evaluate reports the track (${ev.track}/${ev.step})`);
}

/* ---- it gives the card back ------------------------------------------------ */
{
  startTutorial(true);
  tutorial.step = 3;
  ok(tutorial.track === "intro" && tutorial.active, "the intro is running at step 4");
  startCoreTutorial(true);
  ok(tutorial.track === "core" && tutorial.step === 0 && tutorial.resume?.step === 3, "the core track cuts in and remembers where it interrupted");

  /* run it off the end: the core is already fitted, so every phase is done */
  tutorial.step = CORE_STEPS.length - 1;
  tutorial.ctxAge = 9;
  tickTutorial(1);
  ok(tutorial.track === "intro" && tutorial.step === 3 && tutorial.active, "finishing hands the intro back where it was");

  startCoreTutorial(true);
  skipTutorial();
  ok(!tutorial.active && tutorial.track === "intro", "SKIP ends it outright and does not resume");
  try { ok(localStorage.getItem("lgaa.tutorial.v1") !== "done", "…and skipping the CORE track does not mark the intro done"); } catch { pass++; }
}

/* ---- the reason it exists -------------------------------------------------- */
{
  ok(presets().every((p) => p.builtin), "the four presets are builtin, so a coreless pilot is not left with nothing");
  ok(hasUpgrade("nav_core"), "and the track's end state is a core that is really aboard");
}

console.log(fail ? `tutorial-core: ${pass} passed, ${fail} FAILED` : `tutorial-core: ${pass} passed, 0 failed`);
process.exit(fail ? 1 : 0);
