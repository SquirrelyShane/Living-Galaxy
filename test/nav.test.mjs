/* Living Galaxy — wells, avoidance and the contact register.
 *
 * Three complaints from one play session, and all three are the kind that a
 * "does it throw" test would have passed:
 *
 *   the gravity well refused a jump where the HUD read 0.00 G
 *   the autopilot and the assist flew hulls into rocks and station hulls
 *   the chart drew every ship in the sky, named, at true position
 *
 * So this measures. It walks every body in a generated sky and checks the
 * well against the instruments, it points a hull at a hazard and looks at
 * what the solver says, and it runs the scanner for a while to see what it
 * has actually learned.
 *
 *   node --import ./test/three-register.mjs test/nav.test.mjs
 */

import assert from "node:assert/strict";
import { generateSystem } from "../js/generate.js";
import { applySystem, BODIES, bodyById, bodyPosition } from "../js/bodies.js";
import { remnantRadius } from "../js/scale.js";
import { sim, wellEdge, wellG, WARP } from "../js/sim.js";
import { threatTo, avoidAim, avoidLevel, deliberate, AVOID } from "../js/avoid.js";
import { SCAN, levelOf, errorOf, hullTag, classOf } from "../js/contacts.js";
import { FLOW_CAP } from "../js/npc/flow.js";
import { readFileSync } from "node:fs";

let pass = 0, fail = 0;
const t = (name, fn) => {
  try { fn(); pass++; console.log(`  ok  ${name}`); }
  catch (e) { fail++; console.log(`FAIL  ${name}\n      ${e.message}`); }
};

applySystem(generateSystem("plakur"));
const worlds = BODIES.filter((b) => b.kind !== "star");

/* ---- gravity wells ------------------------------------------------------ */

console.log("\n-- gravity wells --");

t("no well reaches past where the instruments can see it", () => {
  /* The complaint, stated as an invariant: if the HUD's G readout rounds to
   * 0.00, nothing is allowed to be holding the warp core. */
  const bad = [];
  for (const b of worlds) {
    const edge = wellEdge(b);
    const g = wellG(b, edge);
    if (g < WARP.wellFloorG) bad.push(`${b.name}: well ends at ${g.toFixed(4)} G, which reads 0.00 on the HUD`);
  }
  assert.equal(bad.length, 0, bad.slice(0, 4).join("; "));
});

t("gravity decides the edge, not the geometry", () => {
  /* The old rule put a flat four-radii floor under every world, and measured
   * across a sky that floor — not the pull — was what set the edge for every
   * moon in the system. */
  let byFloor = 0;
  for (const b of worlds) {
    if (Math.abs(wellEdge(b) - remnantRadius(b) * WARP.wellClear) < 1) byFloor++;
  }
  console.log(`      ${byFloor}/${worlds.length} wells still decided by the geometric floor`);
  assert.ok(byFloor <= worlds.length * 0.1, `${byFloor} of ${worlds.length} wells are geometry, not gravity`);
});

t("the floor only keeps you out of the atmosphere", () => {
  assert.ok(WARP.wellClear <= 1.6, `the geometric floor is ${WARP.wellClear} radii — that is a well, not a clearance`);
  for (const b of worlds) {
    assert.ok(wellEdge(b) >= remnantRadius(b), `${b.name}'s well ends inside its own surface`);
  }
});

t("a shattered world stops holding you like a whole one", () => {
  const big = worlds.reduce((a, b) => (remnantRadius(b) > remnantRadius(a) ? b : a));
  const before = wellEdge(big);
  const keptMu = big.mu;
  big.shattered = true;
  big.mu = keptMu * 0.25;
  const after = wellEdge(big);
  big.shattered = false;
  big.mu = keptMu;
  assert.ok(after < before, `blowing it up did not shrink the well (${before.toFixed(0)} -> ${after.toFixed(0)})`);
});

/* ---- collision avoidance ------------------------------------------------ */

console.log("\n-- collision avoidance --");

const target = worlds.reduce((a, b) => (remnantRadius(b) > remnantRadius(a) ? b : a));
const tp = { x: 0, y: 0, z: 0 };
bodyPosition(target.id, 0, tp);
const R = remnantRadius(target);

/** A hull `dist` out, flying straight at the middle of `tp` at `speed`. */
const aimedAt = (dist, speed) => {
  const pos = { x: tp.x - dist, y: tp.y, z: tp.z };
  const vel = { x: speed, y: 0, z: 0 };
  return { pos, vel };
};

t("a hull flying at a world sees it coming", () => {
  /* Speeds in this game run to thousands of u/s — the screenshot that
   * prompted all this read 3526. */
  const { pos, vel } = aimedAt(R * 6, 3500);
  const hz = threatTo(pos, vel, { time: 0, includeRocks: false });
  assert.ok(hz, "nothing was flagged while flying straight at a world");
  assert.equal(hz.id, target.id, `flagged ${hz.name} instead of ${target.name}`);
  assert.ok(hz.t > 0 && hz.t < AVOID.horizon, `impact in ${hz.t}s is outside the horizon`);
});

t("a hull that will miss is left alone", () => {
  /* The failure mode that makes avoidance worse than nothing: dodging things
   * that were never in the way. */
  const pos = { x: tp.x - R * 6, y: tp.y + R * 40, z: tp.z };
  const vel = { x: 3500, y: 0, z: 0 };
  assert.equal(threatTo(pos, vel, { time: 0, includeRocks: false }), null);
});

t("what you are approaching on purpose is never a threat", () => {
  const { pos, vel } = aimedAt(R * 6, 3500);
  const exempt = new Set([target.id]);
  assert.equal(threatTo(pos, vel, { time: 0, exempt, includeRocks: false }), null,
    "the thing you locked and are flying to was treated as an obstacle");
});

t("mining and docking survive the exemption list", () => {
  /* If this breaks, the player can no longer cut a rock or take a berth —
   * which is most of the game. */
  const fakeSim = {
    ship: { dockedAt: "st7" },
    lock: { id: "rock42" },
    selected: "p3",
    dockRequestFor: "st9",
    tractor: { stationId: "st4" },
    approach: { st: { id: "st5" } },
  };
  const set = deliberate(fakeSim, { active: true, key: "rock99" });
  for (const id of ["st7", "rock42", "p3", "st9", "st4", "st5", "rock99"]) {
    assert.ok(set.has(id), `${id} was not exempt — avoidance would fight the player for it`);
  }
});

t("the dodge actually clears the hazard", () => {
  const { pos, vel } = aimedAt(R * 6, 3500);
  const hz = threatTo(pos, vel, { time: 0, includeRocks: false });
  const aim = avoidAim(pos, vel, hz);
  const miss = Math.hypot(aim.x - tp.x, aim.y - tp.y, aim.z - tp.z);
  assert.ok(miss > hz.clear, `the dodge aims ${miss.toFixed(0)} u from the centre, inside the ${hz.clear.toFixed(0)} u it needs`);
  /* and it must not be a U-turn: still broadly going where we were going */
  const fwd = { x: 1, y: 0, z: 0 };
  const to = { x: aim.x - pos.x, y: aim.y - pos.y, z: aim.z - pos.z };
  const n = Math.hypot(to.x, to.y, to.z) || 1;
  assert.ok((to.x / n) * fwd.x > 0.25, "the dodge turned the hull back the way it came");
});

t("urgency rises as the hazard gets closer", () => {
  /* Both inside the look-ahead: at nine radii a body this size is still 25 s
   * from entry, which is past the horizon on purpose — a warning you cannot
   * act on yet is noise. */
  const a = aimedAt(R * 7, 3500);
  const b = aimedAt(R * 3.2, 3500);
  const t1 = threatTo(a.pos, a.vel, { time: 0, includeRocks: false });
  const t2 = threatTo(b.pos, b.vel, { time: 0, includeRocks: false });
  assert.ok(t1 && t2, "lost the threat at one of the two ranges");
  assert.ok(t2.urgency > t1.urgency, "closing did not raise the urgency");
  assert.ok(avoidLevel(t2) >= avoidLevel(t1), "closing did not raise the response level");
});

t("a stationary hull is not dodging anything", () => {
  const pos = { x: tp.x - R * 3, y: tp.y, z: tp.z };
  assert.equal(threatTo(pos, { x: 0, y: 0, z: 0 }, { time: 0, includeRocks: false }), null);
});

/* ---- the contact register ----------------------------------------------- */

console.log("\n-- contacts --");

t("the levels are ordered and reachable", () => {
  assert.equal(levelOf(0), 0);
  assert.equal(levelOf(SCAN.seen), 1);
  assert.equal(levelOf(SCAN.track), 2);
  assert.equal(levelOf(SCAN.ident), 3);
  assert.equal(levelOf(1), 3);
  assert.ok(SCAN.seen < SCAN.track && SCAN.track < SCAN.ident, "the thresholds are not in order");
});

t("scan range is modest, not the old three hundred kilometres", () => {
  console.log(`      identification range ${(SCAN.range / 100).toFixed(0)} km`);
  assert.ok(SCAN.range <= 20000, `${SCAN.range} u is still most of a system`);
});

t("the error circle shrinks as a contact resolves, and never inverts", () => {
  const at = 8000;
  const wide = errorOf({ res: 0.15 }, at);
  const mid = errorOf({ res: 0.55 }, at);
  const tight = errorOf({ res: 0.95 }, at);
  console.log(`      at ${(at / 100).toFixed(0)} km: ${wide.toFixed(0)} u -> ${mid.toFixed(0)} u -> ${tight.toFixed(0)} u`);
  assert.ok(wide > mid && mid > tight, "the uncertainty did not shrink with resolution");
  assert.ok(tight >= 0, "negative uncertainty");
  assert.ok(errorOf({ res: 1 }, at) < errorOf({ res: 0 }, at) * 0.1, "a fully resolved contact is still a blob");
});

t("a distant contact is blurrier than a close one at the same resolution", () => {
  assert.ok(errorOf({ res: 0.3 }, 12000) > errorOf({ res: 0.3 }, 1200));
});

t("resolving takes real time, and letting go loses it", () => {
  /* Straight from the constants: the design is "dwell on it", so the numbers
   * have to make dwelling meaningful without being tedious. */
  const bestCase = SCAN.gain * 1 * (0.25 + 1);
  const toIdent = SCAN.ident / bestCase;
  const toFade = SCAN.ident / SCAN.decay;
  console.log(`      best case ${toIdent.toFixed(1)}s to identify, ${toFade.toFixed(0)}s to fade`);
  assert.ok(toIdent > 0.8, `${toIdent.toFixed(1)}s is instant — the scanner may as well not exist`);
  assert.ok(toIdent < 20, `${toIdent.toFixed(1)}s to identify one hull is tedious`);
  assert.ok(toFade > toIdent * 2, "contacts fade faster than they resolve");
});

/* ---- what the sky is allowed to tell you --------------------------------
 *
 * A name is an IDENTIFICATION. Nothing may hand the player a hull's name for
 * something the sensors have not resolved, and the two places that could are
 * the chart (contacts.js, which is careful) and the canopy (engine.js, which
 * historically was not: it reads the roster directly).
 *
 * A canopy label needs a browser to render, so what is pinned here is the
 * rule rather than the pixels — the long-range band cannot reach a naming
 * level, and the label loop culls on the sensor radius. Both have been got
 * wrong before: a "track" tier once put hull names on the canopy from
 * fourteen thousand kilometres out. */
t("0.3.50: no long-range band — nothing beyond the dish, nothing under drive", () => {
  assert.equal(SCAN.track_r, undefined, "the 1.4 million u coarse-return band is gone");
  const src = readFileSync("js/contacts.js", "utf8");
  assert.ok(/if \(dist > range \|\| v\.drive\)/.test(src), "a hull out of range or with its drive lit is not touched");
  assert.ok(/if \(v\.drive\) rec\.res = 0/.test(src), "and one that lights its drive leaves the chart at once");
});

t("a level-1 return is unnamed, a level-2 return is a class, only level 3 is a name", () => {
  /* mirrors the disclosure ladder in knownContacts() */
  const src = readFileSync("js/contacts.js", "utf8");
  const line = src.split("\n").find((l) => l.includes("name: level >="));
  assert.ok(line, "knownContacts no longer gates `name` by level");
  assert.ok(/level >= 3 \? rec\.ref\?\.name/.test(line), "a real name must require level 3");
  assert.ok(/: "unknown"/.test(line), "and anything below a class must read unknown");
});

t("the canopy names nothing outside sensor range", () => {
  const src = readFileSync("js/engine.js", "utf8").replace(/\/\*[\s\S]*?\*\//g, "");
  assert.ok(/const nameR = drawRange\(\);/.test(src), "the label loop no longer takes its cull radius from the sensors");
  assert.ok(/if \(d > nameR\) continue;/.test(src), "the label loop no longer culls on it");
  assert.ok(!/TRACK_R/.test(src), "a canopy tier beyond sensor range is back");
  assert.ok(!/kind: `track /.test(src), "a `track` label class is back on the canopy");
});

/* ---- the canopy is the scanner's readout --------------------------------- */

t("the broad sweep can class a hull and can never name one", () => {
  assert.ok(SCAN.broadCap > SCAN.track, `the wide sweep must reach a hull class (${SCAN.broadCap} vs track ${SCAN.track})`);
  assert.ok(SCAN.broadCap < SCAN.ident, `and must stop short of a name (${SCAN.broadCap} vs ident ${SCAN.ident})`);
  assert.equal(levelOf(SCAN.broadCap), 2, "so a broad return tops out at level 2");
});

t("only the narrow beam reaches an identification", () => {
  assert.ok(SCAN.focusGain > SCAN.broadGain, "the beam must out-resolve the sweep, or focusing buys nothing");
  assert.ok(SCAN.focusCone > 0 && SCAN.focusCone <= SCAN.cone, "the beam is narrower than the dish it lives in");
  assert.ok(SCAN.focusHold > 0, "without a hold the beam restarts on a new hull every time the nose moves");
});

t("the kind bracket tells you who is flying it, not what it is", () => {
  assert.equal(hullTag({ id: "npc:x", role: "trader" }), "N", "a crewed hull");
  assert.equal(hullTag({ id: "npc:x", company: true }), "P", "one of yours");
  assert.equal(hullTag({ id: "p1", kind: "peer" }), "P", "another pilot");
  assert.equal(hullTag({ id: "drone-4", kind: "drone" }), "D", "a deployed drone");
  assert.equal(hullTag({ id: "sdrone-st1-2", kind: "sdrone" }), "D", "a port's interceptor");
  assert.equal(hullTag({ id: "pdrone-3" }), "D", "one of your work drones, by id alone");
  assert.equal(hullTag({ id: "rog:nest1:7", rogue: true }), "R", "nobody's machine");
  assert.equal(hullTag(null), "N", "and it never returns nothing");
  /* the tag survives at level 1, so it must not depend on knowing the class */
  assert.equal(classOf({ role: "pirate" }), "warship");
  assert.equal(classOf(null), "contact");
});

t("nothing that flies is an abstract placeholder shape", () => {
  const src = readFileSync("js/engine.js", "utf8");
  assert.ok(!/placeholderDrone/.test(src), "the placeholder drone is back");
  assert.ok(!/TetrahedronGeometry/.test(src), "a tetrahedron is flying again");
  assert.ok(/no real hull yet: draw nothing at all/.test(src), "the draw-nothing fallback was removed");
});

t("a port's shuttle is a drone, and the sky is not made of them", () => {
  assert.equal(hullTag({ id: "flow:st3:7" }), "D", "a flow boat belongs to its port");
  assert.equal(hullTag({ id: "x", port: "st3" }), "D", "…by its port field too");
  assert.ok(FLOW_CAP <= 80, `${FLOW_CAP} shuttles is more than the whole named roster`);
});

t("nothing is labelled on the canopy without a hull under it", () => {
  const src = readFileSync("js/engine.js", "utf8").replace(/\/\*[\s\S]*?\*\//g, "");
  assert.ok(/if \(!flowMeshes\.has\(n\.id\)\) continue;/.test(src), "flow boats can be named with no mesh again");
  assert.ok(/for \(const n of flow\)[\s\S]{0,400}contactView\(n\.id\)/.test(src), "flow boats bypass the scanner again");
});

console.log(`\nnav: ${pass} passed, ${fail} failed`);
if (fail) process.exit(1);
