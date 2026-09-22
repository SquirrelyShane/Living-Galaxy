/* LIVING GALAXY — the rogue tide: when the nests build, when they hold, and
 * how many they send.
 *
 *   node --import ./test/three-register.mjs test/rogues.test.mjs
 *
 * 0.3.30. Before this, every nest rolled the same fixed chance on the same
 * fixed cadence for ever, so the belt settled on a constant: always occupied,
 * always about the same number. What this suite pins is that the sky now has
 * weather — that it spends real, contiguous time empty, that the nests hold
 * during a lull instead of topping the belt back up, that the size of what
 * they send rides the tide, and that a wave caught out by an outgoing tide
 * goes home rather than loitering out its ten minutes.
 *
 * The last section flies a real sky for two hours and counts hulls, because
 * the complaint was about what the belt felt like, not about a curve.
 */

import { sim, launchSim } from "../js/sim.js";
import { makePilot } from "../js/pilot.js";
import { stations, stepStations } from "../js/stations.js";
import { currentSystem } from "../js/bodies.js";
import { traffic, stepTraffic } from "../js/npc/traffic.js";
import { stepNpcCombat } from "../js/npc/combat.js";
import { stepSecurity } from "../js/npc/security.js";
import {
  nests, waves, populateNests, launchWave, stepRogues, rogueReport,
  rogueTide, tideState, TIDE, WAVE_SLOT, WAVE_TTL,
} from "../js/npc/rogues.js";

/* the sky is seeded, but combat and flight roll Math.random directly, and
 * this suite asserts on hull counts — so pin it, as reactive.test.mjs does */
function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
Math.random = mulberry32(0x71de);

let pass = 0, fail = 0;
const ok = (c, m) => { if (c) pass++; else { fail++; console.error("  FAIL", m); } };

makePilot("Tidewatch", "terran", "freight", null);
launchSim("RogueTideTest", "sol");
sim.phase = "play";

/** Sample the tide over `span` seconds and describe what it did. */
function survey(span = 6 * 3600, step = 10) {
  const vals = [];
  for (let t = 0; t < span; t += step) vals.push(rogueTide(t));
  let calm = 0, surge = 0;
  let runCalm = 0, longestCalm = 0, runBusy = 0, longestBusy = 0;
  for (const p of vals) {
    if (p < TIDE.calm) { calm++; runCalm += step; longestCalm = Math.max(longestCalm, runCalm); runBusy = 0; }
    else {
      if (p > TIDE.surge) surge++;
      runCalm = 0; runBusy += step; longestBusy = Math.max(longestBusy, runBusy);
    }
  }
  return {
    vals, n: vals.length,
    calm: calm / vals.length, surge: surge / vals.length,
    longestCalm, longestBusy,
    lo: Math.min(...vals), hi: Math.max(...vals),
  };
}

/* ---- 1. the tide is a real, bounded, seeded signal ----------------------- */
{
  const s = survey();
  ok(s.lo >= 0 && s.hi <= 1, `the tide is bounded (${s.lo.toFixed(3)} … ${s.hi.toFixed(3)})`);
  ok(s.hi - s.lo > 0.5, `…and it actually travels (range ${(s.hi - s.lo).toFixed(2)})`);
  ok(rogueTide(1234.5) === rogueTide(1234.5), "the tide is a function of the clock, not of being asked");

  /* a client that joins a shared sky late must be in the same weather */
  const a = [0, 900, 1800, 2700].map(rogueTide);
  const b = [0, 900, 1800, 2700].map(rogueTide);
  ok(a.every((v, i) => v === b[i]), "two readings of the same sky agree, so a shared room shares its weather");

  /* the ^1.7 curve is there to make the bottom broad: the sky should be quiet
   * a good part of the time but not most of it */
  ok(s.calm > 0.15 && s.calm < 0.7, `the sky is quiet a real fraction of the time (${(s.calm * 100).toFixed(0)}%)`);
  ok(s.surge > 0.02, `…and it still surges (${(s.surge * 100).toFixed(0)}%)`);
  ok(s.longestCalm >= 300, `quiet comes in usable stretches, not flickers (longest ${(s.longestCalm / 60).toFixed(0)} min)`);
  ok(s.longestBusy >= 300, `…and so does busy (longest ${(s.longestBusy / 60).toFixed(0)} min)`);

  /* not a metronome: the three swells have periods that are not multiples of
   * one another, so the pattern must not repeat on the shortest one */
  const [p0] = TIDE.swells[0];
  const drift = Math.abs(rogueTide(0) - rogueTide(p0));
  ok(drift > 0.01, `the pattern does not repeat on one swell's period (drift ${drift.toFixed(3)})`);
}

/* ---- 2. two skies have different weather -------------------------------- */
{
  const here = [0, 600, 1200, 1800, 2400].map(rogueTide);
  populateNests("some-other-sky", currentSystem, stations);
  const there = [0, 600, 1200, 1800, 2400].map(rogueTide);
  ok(there.some((v, i) => Math.abs(v - here[i]) > 0.05), "a different sky is on a different tide");
  /* put the test sky back */
  populateNests("RogueTideTest", currentSystem, stations);
}

/* ---- 3. tideState reads the water --------------------------------------- */
{
  const s = survey(6 * 3600, 30);
  let sawQuiet = false, sawActive = false, sawSwarm = false, agreed = true;
  for (let t = 0; t < 6 * 3600; t += 30) {
    const st = tideState(t), p = rogueTide(t);
    if (st.calm !== p < TIDE.calm || st.surge !== p > TIDE.surge) agreed = false;
    if (st.word === "quiet") sawQuiet = true;
    else if (st.word === "active") sawActive = true;
    else if (st.word === "swarming") sawSwarm = true;
  }
  ok(agreed, "the state agrees with the thresholds it is read from");
  ok(sawQuiet && sawActive && sawSwarm, "all three words happen in a day's sky: quiet, active, swarming");
  ok(rogueReport(0).tide && typeof rogueReport(0).tide.word === "string", "the report carries the tide, so the console can say what the belt is doing");
  void s;
}

/* ---- 4. the nests hold during a lull ------------------------------------ */
{
  /* find a slot boundary deep in a quiet, and one deep in a surge */
  let lull = -1, busy = -1;
  for (let k = 0; k < 400 && (lull < 0 || busy < 0); k++) {
    const t = k * WAVE_SLOT;
    const p = rogueTide(t);
    if (lull < 0 && p < TIDE.calm * 0.7) lull = t;
    if (busy < 0 && p > TIDE.surge) busy = t;
  }
  ok(lull >= 0 && busy >= 0, `the sky offers both a lull (t=${lull}s) and a surge (t=${busy}s) to test against`);

  /* every nest ready, so the only thing that can stop a launch is the tide */
  const ready = () => { for (const n of nests) { n.ready = -1; n.hp = n.hpMax; } };

  /* many lull slots, no launches at all */
  populateNests("RogueTideTest", currentSystem, stations);
  let launched = 0;
  for (let k = 0; k < 400; k++) {
    const t = k * WAVE_SLOT;
    if (rogueTide(t) >= TIDE.calm) continue;
    ready();
    const before = waves.length;
    stepRogues(t, 1, stations, sim.ship.pos);
    launched += waves.length - before;
  }
  ok(launched === 0, `nothing launches while the tide is out (${launched} waves over every lull slot in a day)`);

  /* and the busy slots do send, so the gate is the tide and not a mistake */
  populateNests("RogueTideTest", currentSystem, stations);
  let sent = 0, rolls = 0;
  for (let k = 0; k < 400; k++) {
    const t = k * WAVE_SLOT;
    if (rogueTide(t) < TIDE.calm) continue;
    rolls++;
    ready();
    const before = waves.length;
    stepRogues(t, 1, stations, sim.ship.pos);
    sent += waves.length - before;
  }
  ok(sent > 0, `the nests do build when the tide is in (${sent} waves over ${rolls} live slots)`);
}

/* ---- 5. the size of a wave rides the tide -------------------------------- */
{
  populateNests("RogueTideTest", currentSystem, stations);
  const nest = nests[0];
  const sizes = (tide, n) => {
    const out = [];
    for (let i = 0; i < n; i++) {
      nest.ready = -1;
      const w = launchWave(nest, i * WAVE_SLOT, stations, tide);
      if (w) { out.push(w.drones.length); for (const id of w.drones) { const d = traffic.find((x) => x.id === id); if (d) d.despawn = true; } waves.length = 0; }
    }
    return out;
  };
  const low = sizes(0.05, 40), high = sizes(0.95, 40);
  const mean = (a) => a.reduce((x, y) => x + y, 0) / Math.max(1, a.length);
  ok(low.length > 20 && high.length > 20, `both tides sent enough waves to compare (${low.length} vs ${high.length})`);
  ok(mean(high) > mean(low) * 1.4, `a surge sends bigger waves than a trickle (${mean(low).toFixed(1)} vs ${mean(high).toFixed(1)} drones)`);
  ok(new Set(low.concat(high)).size > 3, `wave size is not a constant (${new Set(low.concat(high)).size} distinct sizes seen)`);
  ok(Math.min(...low) <= 2, `a quiet sky that does send something sends a couple (smallest ${Math.min(...low)})`);
}

/* ---- 6. a wave caught out by the tide goes home -------------------------- */
{
  populateNests("RogueTideTest", currentSystem, stations);
  /* a surge slot to launch on, and a lull far enough after it that the wave
   * would still have time on its clock */
  let busy = -1;
  for (let k = 0; k < 400 && busy < 0; k++) if (rogueTide(k * WAVE_SLOT) > TIDE.surge) busy = k * WAVE_SLOT;
  const nest = nests[0];
  nest.ready = -1;
  const w = launchWave(nest, busy, stations, rogueTide(busy));
  ok(w && w.state === "outbound", `a wave launches into the surge (${w ? w.drones.length : 0} drones)`);

  let lull = -1;
  for (let t = busy + 30; t < busy + WAVE_TTL - 60 && lull < 0; t += 10) if (rogueTide(t) < TIDE.calm) lull = t;
  if (lull > 0) {
    const had = w.expires;
    stepRogues(lull, 1, stations, sim.ship.pos);
    ok(w.state === "home", `the tide goes out from under it and it breaks off (t+${Math.round(lull - busy)}s, ${WAVE_TTL - Math.round(lull - busy)}s still on its clock)`);
    ok(w.expires < had, `…and it is not left to loiter (clock pulled in by ${Math.round(had - w.expires)}s)`);
  } else {
    /* this sky's tide does not ebb inside one wave's life — assert the rule
     * directly rather than skipping it */
    w.state = "outbound";
    const quiet = (() => { for (let t = 0; t < 40000; t += 10) if (rogueTide(t) < TIDE.calm) return t; return -1; })();
    w.expires = quiet + WAVE_TTL;
    stepRogues(quiet, 1, stations, sim.ship.pos);
    ok(w.state === "home", "a live wave is recalled by a lull");
    ok(w.expires <= quiet + 90, "…and its clock is pulled in");
  }
  ok(TIDE.recall === true, "recall is on: a lull empties the belt rather than waiting it out");
}

/* ---- 7. what the belt actually feels like -------------------------------- */
{
  const t0 = Date.now();
  makePilot("Tidewatch", "terran", "freight", null);
  launchSim("BeltFeel", "sol");
  sim.phase = "play";

  const SPAN = 2 * 3600, STEP = 2, SAMPLE = 30;
  const counts = [];
  let next = 0;
  for (let t = 0; t < SPAN; t += STEP) {
    sim.time += STEP;
    stepStations(sim.time);
    stepTraffic(sim.time, STEP, stations, currentSystem, sim.ship.pos);
    stepNpcCombat(sim.time, STEP, sim.ship.pos);
    stepSecurity(sim.time, STEP, stations);
    stepRogues(sim.time, STEP, stations, sim.ship.pos);
    if (sim.time >= next) {
      next = sim.time + SAMPLE;
      let n = 0;
      for (const v of traffic) if (v.rogue && v.job !== "down" && !v.despawn) n++;
      counts.push(n);
    }
  }
  const empty = counts.filter((c) => c === 0).length;
  const hi = Math.max(...counts);
  const mean = counts.reduce((a, b) => a + b, 0) / counts.length;
  let run = 0, longestEmpty = 0;
  for (const c of counts) { if (c === 0) { run++; longestEmpty = Math.max(longestEmpty, run); } else run = 0; }

  ok(empty > 0, `the belt is genuinely empty some of the time (${(empty / counts.length * 100).toFixed(0)}% of samples over two hours)`);
  ok(longestEmpty * SAMPLE >= 120, `…for long enough to fly through (longest clear run ${(longestEmpty * SAMPLE / 60).toFixed(0)} min)`);
  ok(hi >= 8, `…and it still swarms when the tide is in (peak ${hi} drones)`);
  ok(hi - Math.min(...counts) > 5, `the number is not a constant (${Math.min(...counts)} … ${hi}, mean ${mean.toFixed(1)})`);

  const ms = Date.now() - t0;
  console.log(`  belt: two hours of sky in ${ms} ms — ${(empty / counts.length * 100).toFixed(0)}% clear, peak ${hi}, mean ${mean.toFixed(1)} drones`);
}

console.log(`rogues: ${pass} passed, ${fail} failed`);
if (fail) process.exitCode = 1;
