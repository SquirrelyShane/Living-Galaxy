/* LIVING GALAXY 0.3.87 — Dead Hulls: the rig.
 *
 *   node --import ./test/three-register.mjs test/rig.test.mjs
 *
 * The salvage rig is Salvage's verb: a tool of its own, beside the mining
 * laser and never running with it, that works a hulk section by section.
 * CUT is fast and takes plate only — the parts and the recorder in that
 * section are lost. STRIP is slow and hungry and brings everything out whole.
 * What it cuts loose drifts as chunks until the salvage tractor reels it in.
 *
 * This suite guards the tool (pure, a fake ship and a bound clock), its place
 * on the power bus, and then the whole loop in a real sky: cut, reel, hold,
 * skills — and that the mining laser cannot be used to print money off what
 * the rig shed.
 */
import fs from "node:fs";
import { sim, launchSim, tickSim, setRigMode, cycleRigMode, setMiningMode, cycleMiningMode, rigWanted, acquireLock, clearLock, publishHud } from "../js/sim/sim.js";
import { makePilot, pilot } from "../js/flight/pilot.js";
import { RIG, rig, rigHooks, rigBlocker, rigRange, rigTarget, hulkCut, nextSection, stepRig, resetRig } from "../js/flight/rig.js";
import { DRAW, RIG_MODES, SHED_ORDER, SHED_LABEL, TUNE_SPEC, makeShip, buildDemand, stepPower, defaultTune } from "../js/flight/ship.js";
import { HULK, hulks, spawnHulk, resetHulks, bindHulks, hulkManifest } from "../js/world/hulks.js";
import { chunks, resetDebris, addChunk, chunkMass } from "../js/world/debris.js";
import { mining, stepMining } from "../js/flight/turrets.js";
import { hullTuneFor, shipById } from "../js/ships/shipdb.js";
import { UPGRADES, upgrades } from "../js/economy/upgrades.js";
import { careerStatus, isCareerOpen } from "../js/careers/status.js";
import { MOD_LABELS } from "../js/careers/effects.js";
import { useGameStore } from "../js/core/store.js";

let pass = 0, fail = 0;
const ok = (c, m) => { if (c) pass++; else { fail++; console.error("  FAIL", m); } };
const near = (a, b, e = 1e-6) => Math.abs(a - b) <= e;
const FAR = { x: 6e7, y: 0, z: 6e7 };
const clock = { time: 100 };
const boat = (over = {}) => {
  const s = makeShip();
  s.pos = { ...FAR };
  s.rigMode = "cut";
  s.mods = { ...s.mods, salvage: 1 };
  return Object.assign(s, over);
};
const hulkAt = (id, dx, ship = "general_c", extra = {}) => spawnHulk({ id, name: `Wreck ${id}`, ship, x: FAR.x + dx, y: FAR.y, z: FAR.z, ...extra }, { intact: 1 });
const shedBy = (good) => chunks.filter((c) => c.salvage && c.good === good).reduce((a, c) => a + chunkMass(c), 0);
const fresh = () => { resetHulks(); resetDebris(); resetRig(); bindHulks(clock); };
const run = (ship, h, seconds, lock = null, dt = 0.05) => { for (let t = 0; t < seconds && hulks.includes(h); t += dt) { clock.time += dt; stepRig(ship, dt, clock.time, lock); } };

/* ---- 1. the modes, and what stops the rig ---------------------------------- */
{
  ok(RIG_MODES.map((m) => m.id).join() === "off,cut,strip" && RIG_MODES.every((m) => m.label && m.hint), "three modes: off, cut, strip");
  const s = boat();
  ok(rigBlocker(s) === null, "a powered, undocked boat with the rig on has nothing in the way");
  ok(/stowed/i.test(rigBlocker(boat({ rigMode: "off" }))), "off is stowed");
  ok(/Undock/.test(rigBlocker(boat({ dockedAt: "st1" }))), "it does not run in dock");
  const dark = boat(); dark.powered.rig = false;
  ok(/power/i.test(rigBlocker(dark)), "nor without power");
  ok(makeShip().rigMode === "off" && makeShip().powered.rig === true, "a new hull ships with the rig stowed and its bus live");
}

/* ---- 2. what it picks ------------------------------------------------------- */
{
  fresh();
  const s = boat();
  ok(rigRange(s) === RIG.range && defaultTune().rigRange === RIG.range && TUNE_SPEC.some((t) => t.key === "rigRange"), `reach is ${RIG.range} u and it is on the trim sheet`);
  ok(rigTarget(s) === null, "no hulk, no target");
  const farOne = hulkAt("far", RIG.range + 300);
  ok(rigTarget(s) === null, "a hulk past reach is not a target");
  const a = hulkAt("a", 400), b = hulkAt("b", 150);
  ok(rigTarget(s).h === b, "the nearest hulk in reach is");
  ok(rigTarget(s, { kind: "hulk", id: a.id }).h === a, "unless another is locked");
  ok(rigTarget(s, { kind: "hulk", id: farOne.id }).h === b, "a lock on one out of reach falls back to the nearest");
  for (const sec of b.sections) { sec.plate = 0; sec.cut = 1; }
  ok(rigTarget(s).h === a && nextSection(b) === null, "a hulk with nothing left to cut is passed over");
  ok(nextSection(a) === a.sections[a.sections.length - 1], "sections go outermost first — the bridge is last");
}

/* ---- 3. CUT: fast, plate only ------------------------------------------------ */
{
  fresh();
  const s = boat();
  const h = hulkAt("cut", 200, "general_c", { cargo: { id: "water", qty: 100 } });
  const m0 = hulkManifest(h);
  const order = [];
  const seen = { sections: 0, recorder: null, done: 0, lost: 0, parts: 0 };
  rigHooks.onSection = (hh, sec, out) => { order.push(sec.name); seen.sections++; seen.lost += out.lost; seen.parts += out.parts; };
  rigHooks.onRecorder = (hh, kept) => { seen.recorder = kept; };
  rigHooks.onDone = () => { seen.done++; };

  const last = h.sections[h.sections.length - 1];
  const p0 = last.plate;
  run(s, h, 2);
  ok(rig.active && s.rigLive && rig.key === h.id && rig.section === last.name && rig.mode === "cut", `the arc is on the ${rig.section}`);
  ok(near(p0 - last.plate, RIG.cut * 2, 0.11), `CUT goes through ${RIG.cut} plate a second (${(p0 - last.plate).toFixed(2)} in 2 s)`);
  ok(last.cut > 0 && last.cut < 1 && near(rig.progress, hulkCut(h)) && rig.progress > 0, "and the section and the hull both read part-cut");
  ok(rig.heat > 0, "the rig warms as it works");

  run(s, h, 4000);
  ok(!hulks.includes(h) && h.dead && seen.done === 1, "worked to the end, the hulk is gone");
  ok(order.join() === [...h.sections].reverse().map((x) => x.name).join() && order[order.length - 1] === "bridge", `in order, bridge last (${order.join(" → ")})`);
  ok(near(shedBy(HULK.plate), m0.plate * RIG.cutYield, 0.06 * h.sections.length), `CUT keeps ${RIG.cutYield * 100}% of the plate (${shedBy(HULK.plate).toFixed(1)} of ${m0.plate})`);
  ok(seen.lost === m0.partCount && seen.parts === 0 && !chunks.some((c) => c.salvage && m0.parts[c.good]), `and every part goes with the cut (${seen.lost} lost)`);
  ok(near(shedBy("water"), Math.floor(m0.cargo.water * RIG.cutCargo), 1e-6), `half the hold survives it (${shedBy("water")} of ${m0.cargo.water} water)`);
  ok(seen.recorder === false && h.recorder === "destroyed", "and the recorder does not");
  ok(chunks.filter((c) => c.salvage).every((c) => c.from === h.id && c.life === RIG.chunkLife && c.remainingMass > 0), "everything it shed is marked as salvage off that hulk, and will not drift forever");
  ok(chunks.filter((c) => c.salvage).length <= h.sections.length * 6, `without flooding the debris field (${chunks.filter((c) => c.salvage).length} chunks for ${h.sections.length} sections)`);
  stepRig(s, 2, clock.time, null);
  ok(!rig.active && !s.rigLive && rig.key === null && rig.heat < 1, "with nothing left in reach the arc is out and cooling");
}

/* ---- 4. STRIP: slow, everything out whole ------------------------------------ */
{
  fresh();
  const s = boat({ rigMode: "strip" });
  const h = hulkAt("strip", 200, "general_c", { cargo: { id: "water", qty: 100 } });
  const m0 = hulkManifest(h);
  const seen = { recorder: null, parts: 0, lost: 0 };
  rigHooks.onSection = (hh, sec, out) => { seen.parts += out.parts; seen.lost += out.lost; };
  rigHooks.onRecorder = (hh, kept) => { seen.recorder = kept; };
  rigHooks.onDone = null;
  const last = h.sections[h.sections.length - 1];
  const p0 = last.plate;
  run(s, h, 2);
  ok(near(p0 - last.plate, RIG.strip * 2, 0.05) && RIG.strip < RIG.cut, `STRIP is the slow one (${(p0 - last.plate).toFixed(2)} plate in 2 s)`);
  run(s, h, 6000);
  ok(!hulks.includes(h), "it still finishes the hull");
  ok(near(shedBy(HULK.plate), m0.plate, 0.06 * h.sections.length), `all the plate comes out (${shedBy(HULK.plate).toFixed(1)} of ${m0.plate})`);
  const partsOut = Object.entries(m0.parts).every(([id, q]) => near(shedBy(id), q));
  ok(partsOut && seen.parts === m0.partCount && seen.lost === 0, `every part comes out (${seen.parts})`);
  ok(near(shedBy("water"), m0.cargo.water), "the whole hold comes out");
  ok(seen.recorder === true && h.recorder === "recovered", "and so does the recorder");
}

/* ---- 5. what makes it quicker, and where the loose plate goes ---------------- */
{
  fresh();
  const base = boat(), winch = boat(), yard = boat();
  winch.mods.salvage = 1.5;
  yard.hullTune = hullTuneFor(shipById("salvage_c"));
  const cutIn = (ship, id) => { fresh(); const h = hulkAt(id, 200); const sec = h.sections[h.sections.length - 1]; const p = sec.plate; run(ship, h, 1); return p - sec.plate; };
  const a = cutIn(base, "m1"), b = cutIn(winch, "m2"), c = cutIn(yard, "m3");
  ok(near(b / a, 1.5, 0.02), `the salvage mod speeds the rig as it speeds the tractor (${(b / a).toFixed(2)}×)`);
  ok(yard.hullTune.rig > 1 && near(c / a, yard.hullTune.rig, 0.02), `a salvage-line hull is built for it (${yard.hullTune.rig.toFixed(2)}× on a Breaker Cutter)`);
  ok(hullTuneFor(shipById("mining_c")).rig === 1 && hullTuneFor(null).rig === 1, "and no other line is");
  const tiers = "abcdefg".split("").map((t) => hullTuneFor(shipById(`salvage_${t}`)).rig);
  ok(tiers.every((v, i) => i === 0 || v > tiers[i - 1]), `rising with the tier (${tiers.map((v) => v.toFixed(1)).join(" ")})`);
  ok(MOD_LABELS.salvage.label.includes("rig"), "the mod's label says so");

  const had = [...upgrades.owned];
  upgrades.owned.length = 0;
  const bare = rigRange(base);
  upgrades.owned.push("rig_coil");
  ok(UPGRADES.some((u) => u.id === "rig_coil") && UPGRADES.some((u) => u.id === "rig_gantry") && rigRange(base) === bare + 150, "a rig coil adds its reach — and the reach is actually applied");
  upgrades.owned.length = 0; upgrades.owned.push(...had);

  fresh();
  const h = hulkAt("vel", 200, "general_c", { vx: 40, vy: 0, vz: 0 });
  run(boat(), h, 8);
  const loose = chunks.filter((c) => c.salvage);
  ok(loose.length > 0 && loose.every((c) => Math.hypot(c.vx - h.vx, c.vy - h.vy, c.vz - h.vz) <= 4.01 && Math.hypot(c.x - h.x, c.y - h.y, c.z - h.z) < 60), "loose plate leaves at the hulk's own velocity, beside it");
}

/* ---- 6. the mining laser cannot work what the rig shed ----------------------- */
{
  fresh();
  const s = boat({ rigMode: "off", miningMode: "closest" });
  s.powered.mining = true;
  const gold = addChunk({ x: FAR.x + 120, y: FAR.y, z: FAR.z, vx: 0, vy: 0, vz: 0, r: 8, good: "controller", remainingMass: 2, salvage: true });
  stepMining(s, 1, clock.time, null);
  ok(!mining.active && !(s.hold.controller > 0) && gold.r === 8, "a salvage chunk is not something the mining laser can cut (two controllers are two controllers, not a seam of them)");
  addChunk({ x: FAR.x + 140, y: FAR.y, z: FAR.z, vx: 0, vy: 0, vz: 0, r: 8, good: "iron_ore" });
  stepMining(s, 1, clock.time, null);
  ok(mining.active && s.hold.iron_ore > 0, "ordinary debris still is");
  mining.active = false;
}

/* ---- 7. its place on the power bus -------------------------------------------- */
{
  const s = makeShip();
  ok(buildDemand(s, 0, false).rig === 0, "stowed, the rig draws nothing");
  s.rigMode = "strip";
  ok(buildDemand(s, 0, false).rig === DRAW.rigIdle, `on with nothing to cut it idles at ${DRAW.rigIdle} kW`);
  s.rigLive = true;
  ok(buildDemand(s, 0, false).rig === DRAW.rigStrip && DRAW.rigStrip > DRAW.rigCut, `stripping it pulls ${DRAW.rigStrip} kW`);
  s.rigMode = "cut";
  ok(buildDemand(s, 0, false).rig === DRAW.rigCut, `cutting, ${DRAW.rigCut}`);
  stepPower(s, 1 / 60, buildDemand(s, 0, false));
  const t = s.draws;
  const sum = t.life + t.avionics + t.engines + t.shields + t.turrets + t.cutter + t.bench + t.rig + t.gravity + t.ops + t.robots + t.warp;
  ok(t.rig === DRAW.rigCut && s.powered.rig === true, "the ledger bills it as its own line");
  ok(near(sum, s.load, 0.01), `and the ledger still adds up to the load (${sum.toFixed(2)} vs ${s.load.toFixed(2)})`);
  ok(SHED_ORDER.indexOf("rig") === SHED_ORDER.indexOf("mining") + 1 && SHED_LABEL.rig && s.shed.includes("rig"), "it sheds right after the mining laser");

  const flat = makeShip();
  flat.rigMode = "strip"; flat.rigLive = true; flat.charge = 0; flat.throttle = 1; flat.extraDraw = 60; flat.tune.reactorTrim = 0.8;
  let offAt = -1, debuff = false;
  for (let i = 0; i < 600 && offAt < 0; i++) {
    stepPower(flat, 1 / 60, buildDemand(flat, 0, false));
    if (flat.powered.rig === false) { offAt = i; debuff = flat.debuffs.some((d) => d.tag === "rig"); }
  }
  ok(offAt >= 0 && debuff && flat.draws.rig === 0, "a flat battery sheds the rig, says so, and stops billing it");
  ok(/power/i.test(rigBlocker(flat)), "and a shed rig does not cut");
  fresh();
  const h = hulkAt("dark", 200);
  flat.pos = { ...FAR };
  stepRig(flat, 1, clock.time, null);
  ok(!rig.active && h.sections.every((x) => x.cut === 0), "not a scratch");
}

/* ---- 8. the module stays out of the sim's import cycle ------------------------ */
{
  const src = fs.readFileSync(new URL("../js/flight/rig.js", import.meta.url), "utf8");
  ok(!/sim\/sim\.js|from "\.\.\/sim\//.test(src), "flight/rig.js does not import the sim (hooks, like the mining laser)");
}

/* ---- 9. the loop, in a sky ---------------------------------------------------- */
makePilot("Rigger", "terran", "salvage", null);
launchSim("RigTest", "fixture");
sim.phase = "play";
for (let i = 0; i < 60; i++) tickSim(1 / 60);
const ship = sim.ship;
ship.dockedAt = null;
{
  ok(ship.rigMode === "strip" && ship.salvage === true && ship.miningMode === "off", "a salvage pilot's hull comes with the rig on STRIP and the tractor live");
  ok(rig.active === false && ship.draws.rig === DRAW.rigIdle, "idling, with no hulk about");

  setMiningMode("closest");
  ok(ship.rigMode === "off", "the mining laser and the rig never run together: laser on, rig stowed");
  setRigMode("cut");
  ok(ship.miningMode === "off" && ship.rigMode === "cut", "rig on, laser stowed");
  cycleMiningMode(1);
  ok(ship.miningMode === "closest" && ship.rigMode === "off", "the same from the cycle key");
  ship.rigMode = "strip";
  tickSim(1 / 60);
  ok(ship.rigMode === "off" && ship.miningMode === "closest", "and if both are ever set, the tick stows the rig");
  setMiningMode("off");
  ok(cycleRigMode(1).id === "cut" && cycleRigMode(1).id === "strip" && cycleRigMode(1).id === "off", "U cycles off → cut → strip → off");
  ok(setRigMode("nonsense") === undefined && ship.rigMode === "off", "an unknown mode is refused");

  ok(rigWanted() === false, "with no hulk about the quick switch means the mining laser");
  ship.hold = {}; ship.cargoCap = 5000;
  const sk0 = { ...pilot.character.skills };
  const h = spawnHulk({ id: "loop", name: "Loop", ship: "general_c", cargo: { id: "water", qty: 40 }, x: ship.pos.x + 220, y: ship.pos.y, z: ship.pos.z }, { source: "test", intact: 1 });
  const m0 = hulkManifest(h);
  ok(rigWanted() === true, "with one in reach it means the rig");
  clearLock();
  acquireLock({ kind: "hulk", id: h.id });
  setRigMode("strip");
  tickSim(1 / 30);
  tickSim(1 / 30);
  publishHud();
  const hud = useGameStore.getState();
  ok(rig.active && hud.rigMode === "strip" && hud.rigActive === true && hud.rigProgress >= 0, "the arc is on, and the HUD store knows");
  ok(ship.draws.rig === DRAW.rigStrip, "and the bus is billing a strip (from the tick after the arc lights)");
  let secs = 0;
  while (hulks.includes(h) && secs < 900) { tickSim(1 / 30); secs += 1 / 30; }
  ok(!hulks.includes(h) && secs < 900, `the hull is worked through (${Math.round(secs)} s on a salvage trainer)`);
  for (let i = 0; i < 900 && chunks.some((c) => c.salvage); i++) tickSim(1 / 30);
  ok(!chunks.some((c) => c.salvage), "the tractor reels in everything the rig shed");
  ok(near(ship.hold[HULK.plate] ?? 0, m0.plate, 0.5), `the plate is in the hold (${(ship.hold[HULK.plate] ?? 0).toFixed(1)} of ${m0.plate} ${HULK.plate})`);
  ok(Object.entries(m0.parts).every(([id, q]) => near(ship.hold[id] ?? 0, q, 1e-6)), `so is every part (${m0.partCount})`);
  ok(near(ship.hold.water ?? 0, m0.cargo.water, 1e-6), "and its cargo");
  ok(sim.recorders.length === 1 && sim.recorders[0].vessel === "loop", "the recorder is logged aboard");
  const sk = pilot.character.skills;
  ok(sk.salvage > (sk0.salvage ?? 0) && sk.hullcraft > (sk0.hullcraft ?? 0) && sk.law > (sk0.law ?? 0), `the verb trains all three of Salvage's primaries (salvage +${sk.salvage - (sk0.salvage ?? 0)}, hullcraft +${sk.hullcraft - (sk0.hullcraft ?? 0)}, law +${sk.law - (sk0.law ?? 0)})`);
  ok(sim.lock.id === null || sim.lock.id !== h.id, "and the lock on a hulk that is gone lets go");

  const d = spawnHulk({ id: "docked", name: "Docked", ship: "general_a", x: ship.pos.x + 150, y: ship.pos.y, z: ship.pos.z }, { source: "test", intact: 1 });
  ship.dockedAt = "st1";
  setRigMode("cut");
  rig.active = false;
  stepRig(ship, 1, sim.time, null);
  ok(!rig.active && d.sections.every((x) => x.cut === 0), "docked, the rig does not run");
  ship.dockedAt = null;
}

/* ---- 10. readiness ------------------------------------------------------------- */
{
  const st = careerStatus("salvage");
  ok(st.has.includes("verb") && st.missing.join() === "aria,bench,smoke", `Salvage has its verb; still to earn: ${st.missing.join(", ")}`);
  ok(!isCareerOpen("salvage"), "so it is not open yet");
}

console.log(`rig: ${pass} passed, ${fail} failed`);
if (fail) process.exit(1);
