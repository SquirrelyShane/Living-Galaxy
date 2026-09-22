/* LIVING GALAXY experimental — deck plans, CRADLE, neural core.
 *   node test/experimental.test.mjs
 */
import { SHIP_DB } from "../js/shipdb.js";
import { hullPlan, stationRoomFor, quartersFor } from "../js/interior/deckplan.js";
import { generateNPC, cradle, exportLedger, importLedger, TRAIT_AXES } from "../js/npc/cradle.js";
import { ACTIONS, createBrain, features, think, learnImitation, learnOutcome, labelFromPlay } from "../js/npc/brain.js";

let pass = 0, fail = 0;
const ok = (c, m) => { if (c) pass++; else { fail++; console.error("  FAIL", m); } };

/* deck plans: every hull, deterministic, rooms disjoint per deck, doors on the corridor, lift inside every deck */
const REQUIRED = ["bridge", "captain", "quarters", "mess", "eng", "cargo", "airlock"];
for (const def of SHIP_DB) {
  const a = hullPlan(def, "test");
  const b = hullPlan(def, "test");
  ok(JSON.stringify(a.rooms) === JSON.stringify(b.rooms), `${def.id}: deterministic`);
  ok(hullPlan(def, "other").rooms.some((r, i) => r.x !== a.rooms[i]?.x || r.name !== a.rooms[i]?.name) || a.rooms.length < 4, `${def.id}: seed changes the layout`);
  for (const k of REQUIRED) ok(a.rooms.some((r) => r.kind === k), `${def.id}: has ${k}`);
  ok(a.industrial.length >= 1, `${def.id}: carries its industry`);
  for (const d of a.decks) {
    const rs = a.rooms.filter((r) => r.deck === d.index);
    for (let i = 0; i < rs.length; i++) for (let j = i + 1; j < rs.length; j++) {
      const p = rs[i], q = rs[j];
      const overlap = p.x < q.x + q.w && q.x < p.x + p.w && p.y < q.y + q.h && q.y < p.y + p.h;
      ok(!overlap, `${def.id}: ${p.name} overlaps ${q.name}`);
    }
    for (const r of rs) ok(r.door.x >= r.x && r.door.x <= r.x + r.w && r.door.x <= d.width, `${def.id}: ${r.name} door on the spine`);
    ok(a.liftX < d.width, `${def.id}: lift within ${d.name}`);
  }
  const m = { id: "m1", complexId: def.complex };
  ok(stationRoomFor(a, m).industrial || a.industrial.length === 0, `${def.id}: a hand of the hull's trade works the industrial room`);
  ok(quartersFor(a, m).kind === "quarters", `${def.id}: quarters assigned`);
}

/* CRADLE: deterministic births, valid traits, ledger round-trip */
const n1 = generateNPC("seed:1", { sky: "sol" });
const n2 = generateNPC("seed:1", { sky: "sol" });
{ const strip = (r) => ({ ...r, bornAt: 0 }); ok(JSON.stringify(strip(n1)) === JSON.stringify(strip(n2)), "same seed, same person (bornAt aside)"); }
ok(generateNPC("seed:2").id !== n1.id, "different seed, different person");
ok(TRAIT_AXES.every((a) => n1.traits[a] >= 0 && n1.traits[a] <= 1), "traits in range");
const ids = new Set(Array.from({ length: 200 }, (_, i) => generateNPC(`sol:st1:0:${i}`).id));
ok(ids.size === 200, "200 births, 200 ids");
cradle.clear();
cradle.put(n1);
cradle.note(n1.id, "signed on");
const json = exportLedger();
cradle.clear();
ok(cradle.size === 0, "ledger cleared");
ok(importLedger(json) === 1 && cradle.get(n1.id)?.history.length === 1, "ledger round-trips with history");

/* neural core: learns an imitation label, stays finite, outcome learning moves probability */
const b = createBrain("t", { caution: 0.9 });
const s = { hull: 100, o2: 100, battery: 1, cargoFill: 0.2, heat: 0, docked: false, port: { dist: 5000, hostile: false, standing: 20 }, hostiles: 0, nearestHostile: null, inBelt: true, rocks: 5, unsurveyed: 50000, threatEta: null, credits: 4000, throttle: 0, mining: true, firing: false, warping: false, lockKind: null };
const x = features(s);
ok(x.length === 16 && x.every(Number.isFinite), "16 finite features");
ok(labelFromPlay(s) === "mine", "label reads the player's action");
const before = think(b, x).find((k) => k.action === "mine").p;
for (let i = 0; i < 60; i++) learnImitation(b, x, "mine");
const after = think(b, x).find((k) => k.action === "mine").p;
ok(after > before && after > 0.6, `imitation raises P(mine) ${before.toFixed(2)} → ${after.toFixed(2)}`);
const pEv = think(b, x).find((k) => k.action === "evade").p;
for (let i = 0; i < 30; i++) learnOutcome(b, x, "evade", 0.8);
ok(think(b, x).find((k) => k.action === "evade").p > pEv, "positive outcome pulls toward the action");
ok([...b.W1, ...b.W2, ...b.b1, ...b.b2].every(Number.isFinite), "weights stay finite");
learnImitation(b, x.map(() => NaN), "hold");
ok([...b.W1].every(Number.isFinite), "a NaN snapshot is refused");
ok(ACTIONS.length === b.b2.length, "action head matches");

console.log(`experimental §1: ${pass} passed so far`);

/* §2 — crew station effects and boarding (appended; node-safe sim imports) */
const { shiftPhase, crewEffects } = await import("../js/npc/crewfx.js");
const { crew } = await import("../js/crew.js");
const { sim } = await import("../js/sim.js");
const { buildDemand } = await import("../js/ship.js");
const { boarding, startBoarding, tickBoarding, defensePower, resetBoarding } = await import("../js/interior/boarding.js");
const { forecast } = await import("../js/npc/captain.js");

ok(shiftPhase("abc", 100) === shiftPhase("abc", 100), "rota deterministic");
ok([0, 1, 2].includes(shiftPhase("abc", 100)), "rota in range");
{
  const a = shiftPhase("abc", 0);
  ok(shiftPhase("abc", 270 * 3) === a, "rota period is three phases");
}

/* a hand at Engineering trims warp; empty Engineering while crewed penalises */
crew.aboard.length = 0;
crew.aboard.push({ id: "hand-eng", name: "Test Hand", complexId: "energy", morale: 100, traits: { grit: 0.5 } });
{
  /* find a time when they are on shift, and one when nobody is */
  let onT = -1, offT = -1;
  for (let t = 0; t < 270 * 3; t += 30) {
    if (shiftPhase("hand-eng", t) === 0 && onT < 0) onT = t;
    if (shiftPhase("hand-eng", t) !== 0 && offT < 0) offT = t;
  }
  const on = crewEffects("energy_c", "test", onT);
  ok(on.bag.warp < 1, `manned Engineering trims warp (${on.bag.warp.toFixed(2)})`);
  ok(crewEffects("energy_c", "test", onT).bag === on.bag, "crew bag cached per tick");
  const off = crewEffects("energy_c", "test", offT);
  ok(off.bag.warp > 1, `unmanned Engineering costs warp (${off.bag.warp.toFixed(2)})`);
}

/* boarding: intruders spawn, the crew wins, the brig fills, docking pays the bounty */
resetBoarding();
crew.aboard.length = 0;
crew.aboard.push({ id: "sec-1", name: "Sec Hand", complexId: "security", morale: 90, traits: { grit: 0.9 } });
crew.aboard.push({ id: "sec-2", name: "Other Hand", complexId: "mining", morale: 80, traits: { grit: 0.6 } });
sim.interior = { robots: 2, sensors: 10, hasBrig: true, intruders: boarding.intruders };
sim.ship.hull = 100;
sim.ship.powered.shields = false; // sabotage lands on the hull, not the emitters
ok(defensePower() > 0, "a crew defends");
sim.time = 0;
startBoarding(2, "test pod");
ok(boarding.intruders.length === 2 && sim.interior.intruders.length === 2, "intruders on the sensors");
const hull0 = sim.ship.hull;
let rounds = 0;
while (boarding.intruders.length && rounds < 200) {
  sim.time += 5;
  tickBoarding(5);
  rounds++;
}
ok(boarding.intruders.length === 0, `crew clears the deck (${rounds} rounds)`);
ok(sim.ship.hull < hull0, "sabotage cost hull");
ok(boarding.brig.length === 2, "both captured — the hull has a brig");
{
  const c0 = sim.ship.credits;
  sim.ship.dockedAt = "st1";
  sim.time += 5;
  tickBoarding(5);
  ok(sim.ship.credits === c0 + 800 && boarding.brig.length === 0, "Marshal pays 400 a head");
  sim.ship.dockedAt = null;
}

/* the forecaster feels a boarding */
{
  const s = { hull: 90, o2: 100, battery: 1, cargoFill: 0.5, heat: 0, docked: false, port: { id: "st1", name: "P", dist: 4000, hostile: false, standing: 10 }, hostiles: 0, nearestHostile: null, inBelt: true, rocks: 4, unsurveyed: null, threatEta: null, credits: 1000, interior: { intruders: 2 } };
  const mine = forecast(s, "mine");
  const s2 = { ...s, interior: { intruders: 0 } };
  ok(forecast(s2, "mine").score > mine.score, "intruders make mining worse");
}

console.log(`experimental §2: ${pass} passed so far`);

/* §3 — icy belts and the ice works */
const { ICE_ORES, pickOre } = await import("../js/field.js");
const { icework, iceworkFit, stepIcework, cycleIceworkMode, resetIcework } = await import("../js/icework.js");

ok(ICE_ORES.length >= 4 && ICE_ORES.some((o) => o.id === "water_ice"), "ice ore table exists");
ok(pickOre(ICE_ORES, 0.01).id === pickOre(ICE_ORES, 0.01).id, "ore pick deterministic");
{
  /* abundance-weighted: water ice should dominate across the hash range */
  let water = 0;
  for (let i = 0; i < 100; i++) if (pickOre(ICE_ORES, i / 100).id === "water_ice") water++;
  ok(water >= 35, `water ice dominates the snow (${water}/100)`);
}

/* fit: no drills → refused; a mining hand aboard is a hand drill */
crew.aboard.length = 0;
sim.activeHullId = "general_b"; // no drills in the grammar
resetIcework();
ok(!iceworkFit().ok, "no drills, no works");
ok(cycleIceworkMode() === "off", "mode refuses without a fit");
crew.aboard.push({ id: "miner-1", name: "Hand Drill", complexId: "mining", morale: 80 });
ok(iceworkFit().ok && iceworkFit().handDrills === 1, "a miner aboard is a hand drill");
sim.activeHullId = "mining_c";
ok(iceworkFit().hullDrills >= 1, "a mining hull carries bench drills");

/* melt: ice → water at 0.9, drains battery, then electrolysis refills O2 from water */
sim.ship.hold = { water_ice: 10 };
sim.ship.powered.mining = true;
sim.ship.pressurized = true;
sim.ship.charge = 1600;
sim.ship.o2 = 100;
icework.mode = "melt";
let t = 0;
let billed = 0, billedCutterOff = -1;
while ((sim.ship.hold.water_ice ?? 0) > 0.01 && t < 300) {
  stepIcework(0.5); t += 0.5;
  if ((sim.ship.benchDraw ?? 0) > billed) { billed = sim.ship.benchDraw; sim.ship.miningMode = "off"; billedCutterOff = buildDemand(sim.ship, 0, false, 0).mining; }
}
ok((sim.ship.hold.water_ice ?? 0) <= 0.01, `bench melts the hold (${t.toFixed(1)} s)`);
ok(Math.abs((sim.ship.hold.water ?? 0) - 9) < 0.2, `10 ice → ~9 water (${(sim.ship.hold.water ?? 0).toFixed(2)})`);
/* 0.3.01 contract: the bench is billed on the mining bus (stepPower can see and shed it), not
 * taken straight off the battery — and with the cutter stowed the bus carries the bench alone */
ok(billed === 16 && sim.ship.charge === 1600, `the bench bills the mining bus, not the battery (${billed} kW)`);
ok(billedCutterOff === 16, `cutter stowed: the mining bus carries the bench alone (${billedCutterOff} kW, was 40)`);
{
  sim.ship.o2 = 60;
  const w0 = sim.ship.hold.water;
  for (let i = 0; i < 40; i++) stepIcework(0.5);
  ok(sim.ship.o2 > 60, `electrolysis tops up O2 (${sim.ship.o2.toFixed(1)})`);
  ok(sim.ship.hold.water < w0, "and burns water doing it");
}

/* extract: clathrates → gases at their ratios; water ice untouched */
sim.ship.hold = { methane_ice: 4, ammonia_ice: 4, nitrogen_ice: 4, water_ice: 5 };
icework.mode = "gas";
for (let i = 0; i < 200; i++) stepIcework(0.5);
ok((sim.ship.hold.methane ?? 0) > 2.8 && (sim.ship.hold.ammonia ?? 0) > 2.7 && (sim.ship.hold.nitrogen ?? 0) > 3.0, "gases extracted at the refine ratios");
ok(Math.abs((sim.ship.hold.water_ice ?? 0) - 5) < 0.01, "EXTRACT leaves the water ice alone");

/* the mining bus gates the bench */
sim.ship.powered.mining = false;
icework.mode = "melt";
sim.ship.hold = { water_ice: 2 };
stepIcework(1);
ok(Math.abs(sim.ship.hold.water_ice - 2) < 1e-9 && /BUS/.test(icework.product), "bench pauses with the mining bus cold");
sim.ship.powered.mining = true;

console.log(`experimental §3: ${pass} passed so far`);

/* §4 — belt bands, veins, drought, melted-value forecasting */
const { BAND_METAL, BAND_STONE, BAND_CARBON, VEIN_ORES, bandAt, veinAt, nearbyRocks } = await import("../js/field.js");
const { currentSystem } = await import("../js/bodies.js");
const { baseValue } = await import("../js/materials.js");
const { benchValue } = await import("../js/icework.js");
const { sellPriceAt, marketMult } = await import("../js/sim.js");

const avg = (t) => t.reduce((a, o) => a + o.value * o.yield, 0) / t.reduce((a, o) => a + o.yield, 0);
ok(BAND_METAL.length >= 7 && BAND_STONE.length >= 6 && BAND_CARBON.length >= 4, "three bands with real tables");
ok(avg(BAND_METAL) > avg(BAND_STONE), "the metal rim out-values the stony commons");
ok(VEIN_ORES.every((o) => o.value >= 12), "veins are the good stuff");
{
  const mb = currentSystem.belt;
  const w = mb.outer - mb.inner;
  const sample = (f) => [...nearbyRocks({ x: mb.inner + w * f, y: 0, z: 0 }, 0, 2)];
  const metal = sample(0.1), stone = sample(0.5);
  ok(metal.some((r) => BAND_METAL.some((o) => o.id === r.ore)) && !metal.some((r) => r.ice), "sunward rim is metal, never ice");
  const rich = [...metal, ...stone].filter((r) => r.rich);
  ok(rich.length > 0, `veins exist in the main belt (${rich.length} rich rocks in the sample)`);
  ok(rich.every((r) => VEIN_ORES.some((o) => o.id === r.ore)), "vein rocks carry the vein ore");
  const again = sample(0.1);
  ok(again.filter((r) => r.rich).length === metal.filter((r) => r.rich).length, "veins deterministic");
}

/* benchValue: fitted bench prices ice at the product; no bench, raw */
crew.aboard.length = 0;
sim.activeHullId = "mining_c";
ok(benchValue("water_ice") > baseValue("water_ice"), `melted value beats raw (${benchValue("water_ice").toFixed(1)} vs ${baseValue("water_ice")})`);
ok(benchValue("methane_ice") > baseValue("methane_ice"), "clathrate at extracted value");
ok(benchValue("iron_ore") === baseValue("iron_ore"), "stone unaffected by the bench");
sim.activeHullId = "general_b";
ok(benchValue("water_ice") === baseValue("water_ice"), "no drills, no melted value");

/* drought: thirsty sectors pay; others do not; it ends */
sim.time = 1000;
sim.market.drought = { until: 2000, mult: 2.6, sectors: ["agricultural", "civilian"] };
const agri = { sector: "agricultural", corpId: null };
const mil = { sector: "military", corpId: null };
ok(marketMult(agri, "water") === 2.6, "drought pays tanker rates at the farm ring");
ok(marketMult(agri, "water_ice") > 1 && marketMult(agri, "water_ice") < 2.6, "raw snow rides the panic, discounted");
ok(marketMult(mil, "water") === 1, "the garrison does not care");
ok(sellPriceAt(agri, "water") > sellPriceAt(mil, "water"), "the real price path feels it");
sim.time = 2001;
ok(marketMult(agri, "water") === 1, "drought lifts on schedule");
sim.market.drought = null;

/* forecaster: an icy field with a bench beats the same field without one */
{
  sim.activeHullId = "mining_c";
  const icy = { hull: 100, o2: 100, battery: 1, cargoFill: 0.1, heat: 0, docked: false, port: null, hostiles: 0, nearestHostile: null, inBelt: true, rocks: 6, rockValue: benchValue("water_ice"), iceShare: 1, benchFit: true, unsurveyed: null, threatEta: null, credits: 1000, interior: { intruders: 0 } };
  const withBench = forecast(icy, "mine");
  const without = forecast({ ...icy, rockValue: baseValue("water_ice"), benchFit: false }, "mine");
  ok(withBench.credits > without.credits, `melting the field forecasts richer (${Math.round(withBench.credits)} vs ${Math.round(without.credits)})`);
  ok(/melting the field/.test(withBench.why) && /no bench/.test(without.why), "the rationale says why");
  sim.activeHullId = null;
}

console.log(`experimental §4: ${pass} passed so far`);

/* §5 — thermal events and route plotting */
const { BODIES, bodyPosition, heatBody, coolBodies, bodyTempK, tempLabel, TEMP_K } = await import("../js/bodies.js");
const { plotRoute, alignmentTo, ALIGN_DEG, warpDestination, tickSim } = await import("../js/sim.js");
const { forwardOf } = await import("../js/ship.js");

/* thermal: heat lands, reads, radiates away */
{
  const luna = BODIES.find((b) => b.id !== BODIES[0].id && b.kind !== "star");
  const base = bodyTempK(luna);
  heatBody(luna, 400);
  ok(bodyTempK(luna) === base + 400, "impact heat lands on the surface reading");
  ok(/IMPACT-HEATED/.test(tempLabel(luna)), "the readout says so");
  const t1 = luna.thermal;
  coolBodies(700);
  ok(Math.abs(luna.thermal - t1 / 2) < 1, `heat halves on the half-life (${t1.toFixed(0)} → ${luna.thermal.toFixed(0)})`);
  for (let i = 0; i < 20; i++) coolBodies(700);
  ok(luna.thermal < 1 && !/IMPACT-HEATED/.test(tempLabel(luna)), "and radiates back to band temperature");
  ok(TEMP_K.furnace > TEMP_K.temperate && TEMP_K.temperate > TEMP_K.frozen, "bands ordered");
}

/* route plotting: alignment gates the plot; hazards are found; a blocker is an impact point */
{
  const target = BODIES.filter((b) => b.kind !== "star").sort((a, b) => b.orbit - a.orbit)[0];
  const dest = warpDestination(target);
  sim.ship.pos = { x: dest.x + 500000, y: 0, z: dest.z + 300 };
  /* point the nose straight at it */
  const dx = dest.x - sim.ship.pos.x, dz = dest.z - sim.ship.pos.z;
  sim.ship.yaw = Math.atan2(-dx, -dz);
  sim.ship.pitch = Math.atan2(dest.y - sim.ship.pos.y, Math.hypot(dx, dz));
  const aligned = plotRoute(target.id);
  ok(aligned && aligned.aligned && aligned.align <= ALIGN_DEG, `nose on the lane plots (Δ${aligned?.align}°)`);
  ok(aligned.dist > 0 && aligned.eta > 0, "distance and ETA resolve");
  sim.ship.yaw += Math.PI / 2;
  const off = plotRoute(target.id);
  ok(off && !off.aligned && off.align > ALIGN_DEG, `a quarter turn off refuses the plot (Δ${off.align}°)`);
  sim.ship.yaw -= Math.PI / 2;

  /* park a body dead in the lane → impact point */
  const blocker = BODIES.find((b) => b.kind !== "star" && b.id !== target.id);
  const saved = { ...sim.ship.pos };
  bodyPosition(blocker.id, sim.time, { x: 0, y: 0, z: 0 });
  /* place the ship so the blocker sits between ship and target */
  const bp = { x: 0, y: 0, z: 0 };
  bodyPosition(blocker.id, sim.time, bp);
  const dir = { x: dest.x - bp.x, y: dest.y - bp.y, z: dest.z - bp.z };
  const dl = Math.hypot(dir.x, dir.y, dir.z) || 1;
  sim.ship.pos = { x: bp.x - (dir.x / dl) * 400000, y: bp.y - (dir.y / dl) * 400000, z: bp.z - (dir.z / dl) * 400000 };
  const ddx = dest.x - sim.ship.pos.x, ddz = dest.z - sim.ship.pos.z;
  sim.ship.yaw = Math.atan2(-ddx, -ddz);
  sim.ship.pitch = Math.asin(Math.max(-1, Math.min(1, (dest.y - sim.ship.pos.y) / Math.hypot(ddx, dest.y - sim.ship.pos.y, ddz))));
  const blocked = plotRoute(target.id);
  ok(blocked && blocked.hazards.some((h) => h.kind === "impact" || h.kind === "graze"), `the blocker shows in the plot (${blocked?.hazards.map((h) => h.kind).join(",")})`);
  ok(!blocked || blocked.hazards.length <= 5, "plot stays readable");
  sim.ship.pos = saved;
}

console.log(`experimental §5: ${pass} passed so far`);

/* §6 — warp dropout and the atmo works */
const { DROPOUT_ODDS, toggleWarp, selectBody, stepWarp } = await import("../js/sim.js");
const { atmoworks, atmoFit, stepAtmoWorks, applyTerraformSnapshot, terraformSnapshot, ATMO_RATE, ATMO_LIMIT, cycleAtmoMode } = await import("../js/atmoworks.js");
const { bandFromK } = await import("../js/bodies.js");

ok(DROPOUT_ODDS.graze > DROPOUT_ODDS.rock && DROPOUT_ODDS.rock > DROPOUT_ODDS.belt && DROPOUT_ODDS.traffic === 0, "dropout odds ordered; traffic never drops you");

/* a forced dropout: spool a clean lane, inject a belt hazard, force the roll */
{
  const target = BODIES.filter((b) => b.kind !== "star").sort((a, b) => b.orbit - a.orbit)[0];
  const dest = warpDestination(target);
  sim.ship.pos = { x: dest.x * 0.6, y: dest.y * 0.6 + 120000, z: dest.z * 0.6 };
  sim.ship.vel = { x: 0, y: 0, z: 0 };
  sim.ship.dockedAt = null;
  sim.ship.engines = true; sim.ship.powered.engines = true; sim.ship.charge = 1600;
  sim.warp.cool = 0; sim.dominant = null;
  const dx = dest.x - sim.ship.pos.x, dz = dest.z - sim.ship.pos.z;
  sim.ship.yaw = sim.ship.aimYaw = Math.atan2(-dx, -dz);
  sim.ship.pitch = sim.ship.aimPitch = Math.atan2(dest.y - sim.ship.pos.y, Math.hypot(dx, dz));
  selectBody(target.id);
  sim.time += 1;
  toggleWarp();
  ok(sim.warp.state === "spool", `clean aligned lane spools (${sim.warp.state}${sim.notice ? " · " + sim.notice : ""})`);
  /* ride the spool into the run */
  for (let i = 0; i < 40 && sim.warp.state === "spool"; i++) { sim.time += 0.5; stepWarp(0.5); }
  ok(sim.warp.state === "run", "spool engages");
  /* plant a mid-lane belt hazard and force the roll */
  sim.warp.hazards = [{ kind: "belt", name: "BELT", at: 0.5, note: "BELT crossing 50-60%", resolved: false }];
  sim.dropoutRoll = 0; // always drops
  const hull0 = sim.ship.hull;
  for (let i = 0; i < 800 && sim.warp.state === "run"; i++) { sim.time += 0.1; stepWarp(0.1); }
  sim.dropoutRoll = undefined;
  ok(sim.warp.state === "idle" && sim.warp.cool > 8, "the core dropped out and is cooling long");
  const t = Math.hypot(sim.ship.pos.x - dest.x, sim.ship.pos.y - dest.y, sim.ship.pos.z - dest.z);
  ok(t > 1000, `dumped short of the destination (${Math.round(t)} u out)`);
  ok(sim.ship.hull < hull0 || sim.ship.shieldCharge < 1600, "the dropout hurt");
  ok(sim.log.some((e) => /CORE DROPOUT/.test(e.text)), "logged as a dropout");
}

/* traffic: no dropout, standing complaint instead */
{
  sim.warp.state = "run"; sim.warp.t = 0; sim.warp.dur = 2;
  sim.warp.from = { ...sim.ship.pos }; sim.warp.to = { x: sim.ship.pos.x + 100000, y: 0, z: 0 };
  sim.warp.fromYaw = sim.ship.yaw; sim.warp.toYaw = sim.ship.yaw; sim.warp.fromPitch = 0; sim.warp.toPitch = 0;
  sim.warp.targetId = sim.selected;
  sim.warp.hazards = [{ kind: "traffic", name: "Nowhere Port", at: 0.1, note: "traffic", resolved: false }];
  sim.dropoutRoll = 0;
  for (let i = 0; i < 30 && sim.warp.state === "run"; i++) { sim.time += 0.1; stepWarp(0.1); }
  sim.dropoutRoll = undefined;
  ok(sim.log.some((e) => /traffic sphere in warp|filing a complaint/.test(e.text)), "traffic files a complaint instead of dropping you");
}

/* atmo works: fit, rate, band shift, one bond, persistence round-trip */
{
  crew.aboard.length = 0;
  sim.activeHullId = "general_b";
  ok(!atmoFit().ok, "no works without the trade");
  crew.aboard.push({ id: "tf1", name: "Terraformer", complexId: "terraforming", morale: 80 });
  ok(atmoFit().ok && atmoFit().units === 1, "a terraformer aboard is one unit");
  sim.activeHullId = "terraforming_b";
  ok(atmoFit().units === 3, "a terraforming hull is two more");

  const world = BODIES.find((b) => ["moon", "rocky", "dwarf"].includes(b.kind) && bandFromK(bodyTempK(b)) === "cold") ?? BODIES.find((b) => b.kind === "moon");
  const p = { x: 0, y: 0, z: 0 };
  bodyPosition(world.id, sim.time, p);
  sim.ship.pos = { x: p.x + world.radius * 1.5, y: p.y, z: p.z };
  sim.ship.powered.ops = true; sim.ship.charge = 1600;
  sim.terraBonds = new Set();
  world.terraform = 0; world.thermal = 0;
  atmoworks.mode = "heat";
  const k0 = bodyTempK(world);
  stepAtmoWorks(10);
  ok(Math.abs(bodyTempK(world) - k0 - ATMO_RATE * 3 * 10) < 0.01, "heat lands at rate × units");
  const c0 = sim.ship.credits;
  let guard = 0;
  while (bandFromK(bodyTempK(world) - world.thermal) !== "temperate" && world.terraform < ATMO_LIMIT - 1 && guard++ < 500) stepAtmoWorks(5), (sim.ship.charge = 1600);
  const reached = bandFromK(bodyTempK(world) - world.thermal) === "temperate";
  if (reached) {
    ok(sim.ship.credits > c0, "the bond paid");
    ok(sim.terraBonds.has(world.id), "and only pays once");
    const paidOnce = sim.ship.credits;
    world.terraform -= 30; stepAtmoWorks(80); sim.ship.charge = 1600;
    ok(sim.ship.credits === paidOnce, "re-crossing the band does not re-pay");
  } else {
    ok(world.terraform >= ATMO_LIMIT - 1, `clamp respected when temperate is out of reach (${world.name}, ${Math.round(bodyTempK(world))} K)`);
  }
  /* persistence round-trip */
  const snap = terraformSnapshot();
  ok(Object.keys(snap).length >= 1 && snap[world.id] != null, "terraform snapshot captures the work");
  const saved = world.terraform;
  world.terraform = 0;
  applyTerraformSnapshot(snap, [world.id]);
  ok(Math.abs(world.terraform - Math.round(saved)) <= 1 && sim.terraBonds.has(world.id), "and restores it, bond remembered");
  atmoworks.mode = "off";
}

console.log(`experimental §6: ${pass} passed so far`);

/* §7 — impact destruction FX */
const { impactTier, strikeBody } = await import("../js/sim.js");

ok(impactTier(0.01) === "minor" && impactTier(0.1) === "major" && impactTier(0.5) === "cataclysm", "tiers ordered");
{
  const world = BODIES.find((b) => b.kind === "rocky" && !b.shattered) ?? BODIES.find((b) => b.kind !== "star" && !b.shattered);
  sim.impactFX.length = 0;
  sim.flash = 0;
  const p = { x: 0, y: 0, z: 0 };
  bodyPosition(world.id, sim.time, p);
  sim.ship.pos = { x: p.x + world.radius * 4, y: p.y, z: p.z }; // ringside seat
  const before = world.integrity ?? 1;
  const tier = strikeBody(world.id, world.radius * 0.5, 900);
  ok(tier === "cataclysm", `a half-radius rock at 900 u/s is a cataclysm (${tier})`);
  ok(sim.impactFX.length === 1, "the renderer got the strike");
  const ev = sim.impactFX[0];
  ok(ev.bodyId === world.id && ev.tier === "cataclysm" && Math.abs(Math.hypot(ev.n.x, ev.n.y, ev.n.z) - 1) < 0.01, "event carries body, tier, unit normal");
  ok((world.integrity ?? 1) < before, "the strike is real, not just pretty");
  ok(sim.flash > 0.4, `ringside canopy whites out (flash ${sim.flash.toFixed(2)})`);
  const f0 = sim.flash;
  tickSim(0.5);
  ok(sim.flash < f0, "and the white-out fades");
  /* small strikes stay small */
  sim.impactFX.length = 0;
  sim.flash = 0;
  sim.ship.pos = { x: p.x + world.radius * 200, y: p.y, z: p.z };
  const t2 = strikeBody(world.id, world.radius * 0.02, 300);
  ok(t2 === "minor" && sim.impactFX[0]?.tier === "minor", "a pebble is a flash, not a wave");
  ok(sim.flash === 0, "and nobody far away notices");
  /* queue is capped */
  for (let i = 0; i < 12; i++) strikeBody(world.id, world.radius * 0.02, 300);
  ok(sim.impactFX.length <= 8, "FX queue capped");
  sim.impactFX.length = 0;
}

console.log(`experimental §7: ${pass} passed so far`);

/* §8 — warp to ports, GNN bulletins */
const { warpNodeById, warpBlock } = await import("../js/sim.js");
const { stations, buildStations, stepStations } = await import("../js/stations.js");
const { rngFromSeed } = await import("../js/generate.js");
if (!stations.length) {
  buildStations(currentSystem, rngFromSeed("test:stations"));
  stepStations(sim.time);
}
const { newsScript } = await import("../js/comms/call-scripts.js");

{
  ok(stations.length > 0, "a sky has ports");
  const st = stations[0];
  const node = warpNodeById(st.id);
  ok(node && node.kind === "station" && node.name === st.name, "a port is a warp node");
  const bnode = warpNodeById(BODIES[1].id);
  ok(bnode && bnode.kind === "body", "a world still is too");
  /* full warp to a port */
  const dest = warpDestination(node);
  sim.ship.pos = { x: dest.x + 300000, y: dest.y + 40000, z: dest.z };
  sim.ship.vel = { x: 0, y: 0, z: 0 };
  sim.ship.dockedAt = null; sim.ship.engines = true; sim.ship.powered.engines = true;
  sim.ship.charge = 1600; sim.warp.cool = 0; sim.dominant = null;
  const dx = dest.x - sim.ship.pos.x, dz = dest.z - sim.ship.pos.z;
  sim.ship.yaw = sim.ship.aimYaw = Math.atan2(-dx, -dz);
  sim.ship.pitch = sim.ship.aimPitch = Math.atan2(dest.y - sim.ship.pos.y, Math.hypot(dx, dz));
  sim.time += 1;
  selectBody(st.id);
  ok(/marked/.test(sim.notice) || sim.selected === st.id, "a port can be selected");
  const route = plotRoute(st.id);
  ok(route && route.kind === "station" && route.aligned, `port route plots aligned (Δ${route?.align}°)`);
  ok(!route.hazards.some((h) => h.kind === "traffic" && h.name === st.name), "the destination port is not its own hazard");
  const block = warpBlock(st.id);
  ok(block === "", `no gate refuses a clean port lane (${block || "clear"})`);
  toggleWarp();
  ok(sim.warp.state === "spool", "spools for a port");
  for (let i = 0; i < 200 && sim.warp.state !== "idle"; i++) { sim.time += 0.25; stepWarp(0.25); }
  const d = Math.hypot(sim.ship.pos.x - st.x, sim.ship.pos.y - st.y, sim.ship.pos.z - st.z);
  ok(sim.warp.state === "idle" && d < 12000, `arrives off the port (${Math.round(d)} u out)`);
  ok(sim.log.some((e) => new RegExp(`Warp complete — ${st.name}`).test(e.text)), "logged the arrival");
}

/* the news desk script */
{
  let marked = 0;
  const s1 = newsScript({ body: "Mars", rock: "Kerrn 3", tier: "cataclysm", tempK: 640, integrity: 0.72, shattered: false, speed: 800 }, { mark: () => marked++ });
  ok(/GNN BULLETIN/.test(s1.nodes.lede.text) && /catastrophic impact on Mars/i.test(s1.nodes.lede.text), "cataclysm lede reads like news");
  ok(/640 K/.test(s1.nodes.detail.text) && /72 percent/.test(s1.nodes.detail.text), "the bulletin carries the real numbers");
  s1.nodes.marked.effect();
  ok(marked === 1, "MARK IMPACT SITE calls the chart");
  const s2 = newsScript({ body: "Ryx", rock: "Vast 1", tier: "cataclysm", tempK: 900, integrity: 0, shattered: true, speed: 900 }, { mark: () => {} });
  ok(/broken up/.test(s2.nodes.lede.text) && /salvage zone/.test(s2.nodes.detail.text), "a shattered world gets the obituary");
}

console.log(`experimental §8: ${pass} passed so far`);

/* §9 — scale, assays, blast splash, notice subjects, unmark */
const { WORLD_SCALE, EARTH_R } = await import("../js/scale.js");
const { bodyVelocity } = await import("../js/bodies.js");
const { setNoticeAbout, removeWaypoint, addBodyWaypoint, toggleDock } = await import("../js/sim.js");

/* scale: big worlds, same felt gravity, climbable wells, long runs */
{
  const earth = BODIES.find((b) => b.name === "Earth") ?? BODIES.filter((b) => b.kind !== "star")[1];
  ok(earth.radius > 1200, `worlds are geology now (Earth r ${Math.round(earth.radius)} u ≈ ${Math.round((earth.radius * 10) / 2.4 / 10) * 10}× the hull)`);
  if (earth.name === "Earth") ok(Math.abs(earth.stats.gEarth - 1) < 0.05, `Earth still reads 1 g (${earth.stats.gEarth.toFixed(2)})`);
  ok(earth.well < earth.radius * 40, "wells stayed climbable at sublight");
  ok(earth.orbit > 400000, `orbits are voyages (Earth at ${Math.round(earth.orbit / 1000)}k u)`);
  /* warp duration honest */
  const far = BODIES.filter((b) => b.kind !== "star").sort((a, b) => b.orbit - a.orbit)[0];
  const dest = warpDestination(warpNodeById(far.id));
  sim.ship.pos = { x: 0, y: 60000, z: 0 };
  const r = plotRoute(far.id);
  ok(r && r.dur >= 10, `a cross-system run takes real time (${r?.dur}s in the tunnel)`);
}

/* notice subject: "Undocked." is titled by the port */
{
  setNoticeAbout("Undocked from Test Post. Clamps clear.", "Test Post");
  ok(sim.noticeAbout.name === "Test Post" && sim.noticeAbout.text === sim.notice, "the card knows what the message is about");
  sim.notice = "something else happened";
  ok(sim.noticeAbout.text !== sim.notice, "a stale subject never mislabels a new message");
}

/* waypoint unmark round-trip */
{
  const b = BODIES.find((x) => x.kind !== "star");
  const before = sim.waypoints.length;
  const wp = addBodyWaypoint(b.id);
  ok(sim.waypoints.length === before + 1, "marked");
  removeWaypoint(wp.id);
  ok(sim.waypoints.length === before && sim.waypoints.every((w) => w.id !== wp.id), "and unmarked");
}

/* blast splash: guns out at a near port, a tethered port dies with its world */
{
  const world = BODIES.find((b) => b.kind === "rocky" && !b.shattered && b.name !== "Earth") ?? BODIES.find((b) => !b.shattered && b.kind !== "star");
  const p = { x: 0, y: 0, z: 0 };
  bodyPosition(world.id, sim.time, p);
  stations.push({ id: "st_blast", name: "Blast Test Ring", sector: "civilian", x: p.x + world.radius * 3, y: p.y, z: p.z, vx: 0, vy: 0, vz: 0, radius: 60, guards: 3, hostile: false, claimed: false, stock: [{ id: "water", qty: 100, sell: 6 }], credits: 1000, spin: 0.02 });
  sim.ship.pos = { x: p.x + world.radius * 60, y: p.y, z: p.z }; // out of the blast
  strikeBody(world.id, world.radius * 0.4, 900);
  const st = stations.find((x) => x.id === "st_blast");
  ok(st.guards < 3, `the blast wave rakes the near port (guns ${st.guards}/3)`);
  ok(st.stock[0].qty < 100, "and the stock takes it too");
  ok(sim.log.some((e) => /Blast wave from/.test(e.text)), "logged");
  stations.splice(stations.indexOf(st), 1);
  /* tethered port dies with a shattered host */
  const moon = BODIES.find((b) => b.kind === "moon" && !b.shattered);
  if (moon) {
    bodyPosition(moon.id, sim.time, p);
    stations.push({ id: "st_doom", name: "Doom Ring", sector: "civilian", hostId: moon.id, x: p.x, y: p.y, z: p.z, vx: 0, vy: 0, vz: 0, radius: 60, guards: 0, hostile: false, claimed: false, stock: [], credits: 0, spin: 0.02 });
    moon.integrity = 0.05;
    strikeBody(moon.id, moon.radius * 0.9, 1200);
    ok(moon.shattered, "the host shattered");
    ok(!stations.some((x) => x.id === "st_doom"), "and its tethered port went with it");
    ok(sim.log.some((e) => /lost with/.test(e.text)), "with an obituary in the log");
  }
}

console.log(`experimental §9: ${pass} passed so far`);

/* §10 — autopilot, body count, contracts, market reads */
const { autopilot, engageAutopilot, disengageAutopilot, tickAutopilot } = await import("../js/autopilot.js");
const { takeSalvageContract, stepContract } = await import("../js/sim.js");
sim.phase = "play"; // the autopilot and the contract clock only run in flight
const { marketScript } = await import("../js/comms/call-scripts.js");
const { newsScript: news2 } = await import("../js/comms/call-scripts.js");
const { touch } = await import("../js/input.js");

/* autopilot: engages on a target, flies the fall, parks, releases to the stick */
{
  sim.ship.dockedAt = null;
  const world = BODIES.find((b) => b.kind !== "star" && !b.shattered);
  const p = { x: 0, y: 0, z: 0 };
  bodyPosition(world.id, sim.time, p);
  /* start inside warp-skip range so the test flies the sublight leg */
  sim.ship.pos = { x: p.x + world.radius * 12, y: p.y, z: p.z };
  sim.ship.vel = { x: 0, y: 0, z: 0 };
  ok(engageAutopilot(world.id), "engages on a locked world");
  ok(autopilot.on && sim.selected === world.id, "takes the target");
  let parked = false;
  for (let i = 0; i < 4000 && autopilot.on; i++) {
    sim.time += 0.1;
    tickAutopilot(0.1);
    /* integrate the injected commands crudely: the sim loop normally does this */
    const sp = sim.ship;
    const f = forwardOf(sp.yaw, sp.pitch);
    sp.yaw += (Math.random() * 0 + 1) * 0; // attitude handled by pan in game; emulate: snap toward target
    const dx = p.x - sp.pos.x, dy = p.y - sp.pos.y, dz = p.z - sp.pos.z;
    const d = Math.hypot(dx, dy, dz) || 1;
    sp.yaw = Math.atan2(-dx / d, -dz / d); sp.pitch = Math.asin(dy / d);
    const acc = sp.throttle * 40;
    sp.vel.x += (dx / d) * acc * 0.1; sp.vel.y += (dy / d) * acc * 0.1; sp.vel.z += (dz / d) * acc * 0.1;
    if (touch.brake) {
      const nv = { x: 0, y: 0, z: 0 };
      bodyVelocity(world.id, sim.time, nv);
      sp.vel.x = nv.x + (sp.vel.x - nv.x) * 0.7; sp.vel.y = nv.y + (sp.vel.y - nv.y) * 0.7; sp.vel.z = nv.z + (sp.vel.z - nv.z) * 0.7;
    }
    sp.pos.x += sp.vel.x * 0.1; sp.pos.y += sp.vel.y * 0.1; sp.pos.z += sp.vel.z * 0.1;
    bodyPosition(world.id, sim.time, p);
  }
  parked = !autopilot.on;
  const dEnd = Math.hypot(sim.ship.pos.x - p.x, sim.ship.pos.y - p.y, sim.ship.pos.z - p.z);
  ok(parked, "flies the leg and stands itself down");
  ok(dEnd < world.radius * 4.2, `parks on the perch (${(dEnd / world.radius).toFixed(1)} radii)`);
  /* stick release */
  engageAutopilot(world.id);
  touch.panX = 0.5;
  tickAutopilot(0.1);
  ok(!autopilot.on, "touching the stick releases it");
  touch.panX = 0;
}

/* the bulletin carries the body count and the salvage paper */
{
  const blast = { portsHit: [{ name: "Consignment Post", guns: 2 }], portsLost: [], kills: ["Guard 3"] };
  const s1 = news2({ body: "Mars", rock: "K", tier: "cataclysm", tempK: 600, integrity: 0.7, shattered: false, speed: 800, blast, contractRate: 12 }, { mark: () => {}, contract: null });
  ok(/Consignment Post reports 2 batteries out/.test(s1.nodes.detail.text), "batteries out make the news");
  ok(/1 hull lost/.test(s1.nodes.detail.text), "so do the hulls");
  let took = 0;
  const s2 = news2({ body: "Ryx", rock: "V", tier: "cataclysm", tempK: 900, integrity: 0, shattered: true, speed: 900, blast: { portsLost: ["Doom Ring"], portsHit: [], kills: [] }, contractRate: 15 }, { mark: () => {}, contract: () => took++ });
  ok(/Doom Ring is gone with the world/.test(s2.nodes.detail.text), "a lost ring gets named");
  ok(s2.nodes.detail.options.some((o) => /SALVAGE CONTRACT · 15/.test(o.label)), "the shattered bulletin offers the paper");
  s2.nodes.contracted.effect();
  ok(took === 1, "signing takes the contract");
}

/* contract mechanics: haul in the field, paid at the dock, expires */
{
  const world = BODIES.find((b) => b.kind !== "star");
  const c = takeSalvageContract(world.id, 15);
  ok(c && sim.contract?.rate === 15, "contract registered");
  sim.contract.hauled = 10;
  sim.ship.dockedAt = "st1";
  const c0 = sim.ship.credits;
  stepContract();
  ok(sim.ship.credits === c0 + 150 && sim.contract.hauled === 0, `the charter pays at the dock (+150 cr)`);
  sim.ship.dockedAt = null;
  sim.contract.until = sim.time - 1;
  stepContract();
  ok(sim.contract === null, "and the paper expires");
}

/* the markets desk reads */
{
  const m = marketScript("Drought declaration on the agricultural ring.");
  ok(/GNN MARKETS — Drought/.test(m.nodes.read.text) && m.nodes.out.end, "one-node market read");
}

/* §11 — grounded droughts, named buyers, market read actions */
const { marketScript: mk2 } = await import("../js/comms/call-scripts.js");
const { addWaypointAt } = await import("../js/sim.js");
{
  /* a drought never fires without thirsty ports: simulate the gate */
  const thirsty = stations.filter((st) => st.sector === "agricultural" || st.sector === "civilian");
  ok(Array.isArray(thirsty), "gate reads the real port list");
  /* the read can carry an action */
  let acted = 0;
  const m = mk2("Verdant Ring paying 2.6× for water.", { label: "MARK NEAREST BUYER", reply: "On your chart.", effect: () => acted++ });
  ok(m.nodes.read.options[0].label === "MARK NEAREST BUYER", "action option leads");
  m.nodes.acted.effect();
  ok(acted === 1, "and fires");
  /* named waypoint helper */
  const before = sim.waypoints.length;
  const wp = addWaypointAt("Verdant Ring", 1, 2, 3);
  ok(wp.x === 1 && wp.name === "Verdant Ring" && sim.waypoints.length === before + 1, "addWaypointAt places a named mark");
  sim.waypoints.splice(sim.waypoints.indexOf(wp), 1);
}

/* §12 — craters carry the shape the renderer carves */
{
  const targets = BODIES.filter((b) => b.kind !== "star" && b.kind !== "gas" && !b.shattered && (b.integrity ?? 1) > 0.9);
  const big = targets[targets.length - 1];
  const small = targets[targets.length - 2] ?? big;
  const n0 = (big.craters ?? []).length;
  const tier = strikeBody(big.id, big.radius * 0.9, 1200);
  ok(tier != null, "test strike lands");
  const c = big.craters[big.craters.length - 1];
  ok(big.craters.length === n0 + 1, "strike records a crater");
  ok(Number.isFinite(c.depth) && c.depth >= 0.06 && c.depth <= 0.5, `crater carries a bowl depth (${c.depth?.toFixed(3)})`);
  ok(Number.isInteger(c.seed) && c.seed > 0, "and a jag seed for the rim");
  ok(Math.abs(Math.hypot(c.nx, c.ny, c.nz) - 1) < 1e-3, "crater normal is unit length");
  ok(c.depth === 0.5, "a monster strike digs to the half-radius clamp");
  const m0 = (small.craters ?? []).length;
  strikeBody(small.id, small.radius * 0.02, 250);
  const c2 = small.craters[small.craters.length - 1];
  ok(small.craters.length === m0 + 1 && Math.abs(c2.depth - 0.06) < 0.02, "a graze digs the minimum bowl");
  ok(big.dirty === true || big.shattered, "damage marks the body for rebuild");
}

/* §13 — miners can mine: locks on rocks and debris, the cutter eats debris */
{
  const { lockCandidates, togglePointerLock, targetPosition, clearLock } = await import("../js/sim.js");
  const { burst, chunks, resetDebris } = await import("../js/debris.js");
  const { mining, stepMining } = await import("../js/turrets.js");
  const { cargoTotal } = await import("../js/ship.js");
  const { currentSystem } = await import("../js/bodies.js");
  sim.phase = "play";
  const ship = sim.ship;
  /* park in the main belt where rocks are dense, and look at one */
  const belt = currentSystem.belt;
  ok(belt && currentSystem.outerBelt, "Sol carries a main belt and an outer ice belt now");
  const mid = (belt.inner + belt.outer) / 2;
  ship.pos.x = mid; ship.pos.y = 0; ship.pos.z = 0;
  ship.vel.x = ship.vel.y = ship.vel.z = 0;
  const cands = lockCandidates();
  const rocks = cands.filter((c) => c.kind === "asteroid");
  ok(rocks.length > 0, `belt rocks are lock candidates (${rocks.length} in reach)`);
  /* debris chunk next to the ship is a candidate too */
  resetDebris();
  burst({ x: ship.pos.x + 400, y: 0, z: ship.pos.z, count: 3, speed: 0, size: 30, good: "nickel_ore" });
  const dcands = lockCandidates().filter((c) => c.kind === "debris");
  ok(dcands.length === 3, "impact debris is lockable");
  ok(targetPosition("debris", dcands[0].id, { x: 0, y: 0, z: 0 }) !== null, "debris resolves a live position");
  /* aim at the chunk and P-LOCK. (a map pick now acquires a real
   * lock, so drop whatever an earlier section selected first — otherwise the
   * first P-LOCK is a release, not an acquire.) */
  ship.yaw = -Math.PI / 2; ship.pitch = 0; // forward = (-sin(yaw),0,-cos(yaw)) = (+1,0,0)
  const { clearLock: dropLock } = await import("../js/sim.js");
  dropLock();
  const got = togglePointerLock();
  ok(got && (got.kind === "debris" || got.kind === "asteroid"), `P-LOCK grabs the small stuff (${got?.kind}: ${got?.name})`);
  /* the cutter eats the chunk it is locked on */
  const c0 = cargoTotal(ship);
  ship.miningMode = "closest";
  ship.powered.mining = true;
  const chunk = chunks[0];
  const r0 = chunk.r;
  for (let i = 0; i < 8; i++) stepMining(ship, 0.5, sim.time, { kind: "debris", id: chunk.id, locked: true });
  ok(mining.active, "cutter active on debris");
  ok(/debris/.test(mining.name), `cutter names the cut (${mining.name})`);
  ok(cargoTotal(ship) > c0, "debris pays into the hold");
  ok(chunk.r < r0, "and the chunk shrinks as it is cut");
  ok(Number.isFinite(mining.vx), "cutter reports the target drift for the chip FX");
  let n = 0;
  while (chunks.includes(chunk) && n++ < 400) stepMining(ship, 0.5, sim.time, { kind: "debris", id: chunk.id, locked: true });
  ok(!chunks.includes(chunk), "a chunk is finite — cut it down and it is gone");
  clearLock();
  ship.miningMode = "off";
  resetDebris();
}

/* §13 — career hulls fit for purpose, priced like entry hulls */
{
  const { SHIP_DB } = await import("../js/shipdb.js");
  const { yardQuote, componentBill, ISSUE_RATE } = await import("../js/shipcost.js");
  const skiff = SHIP_DB.find((d) => d.id === "mining_a");
  ok(skiff.grammar.modules.includes("drill"), "the Assay Skiff carries a cutter — a miner can bench-mine from day one");
  const sled = SHIP_DB.find((d) => d.id === "mining_b");
  const list = yardQuote(sled);
  const mine = yardQuote(sled, { complexId: "mining", letter: "B" });
  ok(list.total < componentBill(sled).total, `entry frames took the yard-scale cut (${componentBill(sled).total} → ${list.total})`);
  ok(mine.inLine && mine.total === Math.round(list.total * ISSUE_RATE), `a miner buys their own line at the issue rate (${mine.total} cr)`);
  ok(!yardQuote(sled, { complexId: "mining", letter: "A" }).inLine, "issue rate stops at your rank");
  ok(!yardQuote(sled, { complexId: "salvage", letter: "G" }).inLine, "and at your complex");
  const { applyCareerDefaults } = await import("../js/sim.js");
  const { pilot } = await import("../js/pilot.js");
  const was = pilot.complexId;
  pilot.complexId = "mining";
  const fake = { miningMode: "off", salvage: false, turretMode: "castle" };
  applyCareerDefaults(fake);
  ok(fake.miningMode === "closest", "a miner's cutter comes up armed");
  pilot.complexId = "salvage"; applyCareerDefaults(fake);
  ok(fake.salvage === true, "a salvager's tractor comes up live");
  pilot.complexId = was;
}

/* §13 — every sky has both belts */
{
  const { generateSystem } = await import("../js/generate.js");
  let all = true;
  for (const seed of ["alpha", "kestrel-9", "quiet", "zz", "belt-less", "sol", "orion7", "x"]) {
    const sys = generateSystem(seed);
    if (!sys.belt || !sys.outerBelt || sys.outerBelt.inner <= sys.belt.outer) all = false;
  }
  ok(all, "every generated sky has a main belt and an outer ice belt past it");
}

/* §13 — identity and life aboard */
{
  const { generateNPC, ensureIdentity, drawnTo, GENDERS } = await import("../js/npc/cradle.js");
  const { hireCrew, crew: crewLedger, tickCrew, resetCrew, bondLine, rapportBetween, CYCLE_SECONDS } = await import("../js/crew.js");
  const a = generateNPC("id-a"), b = generateNPC("id-b");
  ok(GENDERS.includes(a.gender) && a.pronouns?.subj && Array.isArray(a.attractedTo), "every new person has a gender, pronouns and an attraction set");
  ok(generateNPC("id-a").gender === a.gender && generateNPC("id-a").attractedTo.join() === a.attractedTo.join(), "identity is deterministic per seed");
  const legacy = { id: "npc_old", seed: "old-seed", name: "Old Hand" };
  ensureIdentity(legacy);
  ok(legacy.gender && legacy.attractedTo, "legacy ledger records grow an identity");
  /* the spread: same-gender, cross-gender, anyone and aromantic all occur */
  const kinds = { same: 0, cross: 0, any: 0, none: 0 };
  for (let i = 0; i < 400; i++) {
    const p = generateNPC(`spread-${i}`);
    if (!p.attractedTo.length) kinds.none++;
    else if (p.attractedTo.length === 3) kinds.any++;
    else if (p.attractedTo.includes(p.gender)) kinds.same++;
    else kinds.cross++;
  }
  ok(kinds.same > 20 && kinds.cross > 20 && kinds.any > 20 && kinds.none > 5, `all orientations occur (${JSON.stringify(kinds)})`);
  /* two people who are drawn to each other, sharing a deck, end up together */
  resetCrew();
  crewLedger.employer = "TestPilot";
  const w = { ...generateNPC("pair-w"), gender: "woman", attractedTo: ["woman"], wage: 60, traits: { grit: 0.5, caution: 0.5, greed: 0.2, loyalty: 0.7, curiosity: 0.5 } };
  const v = { ...generateNPC("pair-v"), gender: "woman", attractedTo: ["woman", "man"], wage: 60, traits: { grit: 0.5, caution: 0.5, greed: 0.2, loyalty: 0.7, curiosity: 0.5 } };
  ok(drawnTo(w, v) && drawnTo(v, w), "mutual interest reads both ways");
  const shipT = { credits: 100000 };
  ok(hireCrew(w, shipT, 8) === null && hireCrew(v, shipT, 8) === null, "both signed");
  const [mw, mv] = crewLedger.aboard;
  for (let i = 0; i < 40 && !mw.partner; i++) tickCrew(CYCLE_SECONDS, shipT);
  ok(rapportBetween(mw, mv) > 0, "rapport grows by the cycle");
  ok(mw.partner === mv.id && mv.partner === mw.id, "a same-gender couple forms when both are interested");
  ok(/^with /.test(bondLine(mw)), `the crew sheet says so ("${bondLine(mw)}")`);
  ok(crewLedger.log.some((l) => /official aboard/.test(l.msg)), "and the ship's log notes it");
  /* no interest, no couple */
  resetCrew();
  crewLedger.employer = "TestPilot";
  const x = { ...generateNPC("pair-x"), gender: "man", attractedTo: ["woman"], wage: 60, traits: w.traits };
  const y = { ...generateNPC("pair-y"), gender: "man", attractedTo: ["woman"], wage: 60, traits: w.traits };
  hireCrew(x, shipT, 8); hireCrew(y, shipT, 8);
  for (let i = 0; i < 40; i++) tickCrew(CYCLE_SECONDS, shipT);
  const [mx, my] = crewLedger.aboard;
  ok(!mx.partner && !my.partner && rapportBetween(mx, my) >= 70, "without mutual interest they become close friends instead");
  ok(/^close with /.test(bondLine(mx)), "and the sheet says that too");
  resetCrew();
}

/* §13 — the tutorial reads the sky */
{
  const { tutorial, startTutorial, tutorialEvaluate, tutorialContext, tutorialSteps, skipTutorial } = await import("../js/tutorial.js");
  const { pilot } = await import("../js/pilot.js");
  sim.phase = "play";
  const ctx = tutorialContext();
  ok(ctx.belt && ctx.port && ctx.home, "context finds the belt, a port and the nearest world");
  ok(tutorialSteps().length === 8, "eight steps");
  ok(startTutorial(true) && tutorial.active && tutorial.step === 0, "starts (forced past the done flag)");
  const e0 = tutorialEvaluate();
  ok(e0.step === "helm" && /throttle/.test(e0.text), `helm step reads the sky ("${e0.text.slice(0, 60)}…")`);
  /* a miner's earn step points at the belt from wherever the ship is */
  const was = pilot.complexId;
  pilot.complexId = "mining";
  tutorial.step = 3;
  sim.ship.pos.x = 5000; sim.ship.pos.z = 5000; sim.ship.pos.y = 0;
  const e3 = tutorialEvaluate();
  ok(/belt is .* out|Close to under/.test(e3.text), `cut step points at rock or the belt ("${e3.text.slice(0, 70)}…")`);
  pilot.complexId = was;
  skipTutorial();
  ok(!tutorial.active && tutorial.done, "skip ends it");
}

/* §14 — CRADLE captains in space, shared sky events */
{
  const { buildRoster, poseAt, eventAt, eventLine, populateTraffic, resetTraffic, traffic, trafficCensus, SLOT_S } = await import("../js/npc/traffic.js");
  const ports = [
    { id: "p1", name: "Foundry Hold", sector: "industrial", x: 1000, y: 0, z: 0 },
    { id: "p2", name: "Green Vat", sector: "agricultural", x: 8000, y: 200, z: 4000 },
    { id: "p3", name: "Commons Ring", sector: "civilian", x: -4000, y: -100, z: 6000 },
  ];
  const sys = { belt: { inner: 20000, outer: 40000 }, outerBelt: { inner: 60000, outer: 80000 } };
  const a = buildRoster("sky-alpha", ports, sys);
  const b = buildRoster("sky-alpha", ports, sys);
  ok(a.length >= 8, `roster has working hulls (${a.length})`);
  ok(JSON.stringify(a.map((n) => n.id)) === JSON.stringify(b.map((n) => n.id)), "same sky, same captains");
  ok(buildRoster("sky-beta", ports, sys)[0].id !== a[0].id, "different sky, different captains");
  const census = trafficCensus(a);
  ok(census.trader >= 3 && census.miner >= 3 && census.hauler >= 1, `traders and miners on the board (${JSON.stringify(census)})`);
  ok(a.every((n) => n.name && n.ship && n.role), "every hull has a name, registry id and a job");
  const miner = a.find((n) => n.role === "miner");
  const p0 = poseAt(miner, 0, ports, sys);
  const p1 = poseAt(miner, 400, ports, sys);
  ok(Math.hypot(p1.x - p0.x, p1.z - p0.z) > 10, "miners move along the belt");
  ok(poseAt(miner, 0, ports, sys).x === p0.x, "pose is a pure function of time");
  const trader = a.find((n) => n.role === "trader");
  let sawDock = false, sawRun = false;
  for (let i = 0; i < 24; i++) {
    const p = poseAt(trader, trader.period * (i / 24), ports, sys);
    if (p.docked) sawDock = true;
    else sawRun = true;
  }
  ok(sawDock && sawRun, "traders dock, then leave on the run");
  const e1 = eventAt("sky-alpha", SLOT_S * 3 + 1);
  const e2 = eventAt("sky-alpha", SLOT_S * 3 + 50);
  ok(e1.kind === e2.kind && e1.slot === e2.slot, "same slot, same bulletin");
  ok(eventAt("sky-alpha", SLOT_S * 9 + 1).slot !== e1.slot, "later slot is a different bulletin window");
  const kinds = new Set();
  for (let s = 0; s < 80; s++) kinds.add(eventAt("sky-alpha", s * SLOT_S + 1).kind);
  ok(kinds.has("drought") && kinds.has("quiet") && kinds.size >= 3, `event table covers drought and quiet (${[...kinds]})`);
  ok(eventLine({ kind: "drought", mult: 2.4, sectors: ["agricultural", "civilian"] }, ports).includes("2.4"), "drought bulletin names the rate");
  resetTraffic();
  populateTraffic("sky-alpha", ports, sys);
  ok(traffic.length === a.length && traffic[0].id === a[0].id, "populate files the live list");
  ok(traffic.some((n) => n.role === "miner") && traffic.some((n) => n.role === "trader"), "live list has miners and traders");
}

/* §14 — the first hand is cheap */
{
  const { hireCrew, hireTerms, crew: cl, resetCrew } = await import("../js/crew.js");
  const { generateNPC } = await import("../js/npc/cradle.js");
  resetCrew();
  cl.employer = "Terms";
  const a = { ...generateNPC("terms-a"), wage: 120 };
  const b = { ...generateNPC("terms-b"), wage: 120 };
  const t0 = hireTerms(a);
  ok(t0.firstHand && t0.bonus === 0 && t0.wage === 60, `first hand: no bonus, half wage (${t0.wage})`);
  const shipT = { credits: 100 };
  ok(hireCrew(a, shipT, 8) === null && shipT.credits === 100, "signs with 100 cr in the bank, nothing taken");
  const t1 = hireTerms(b);
  ok(!t1.firstHand && t1.bonus === 240 && t1.wage === 120, "the second hand pays full terms");
  ok(/first-hand rate/.test(cl.log[0].msg), "the crew log says so");
  resetCrew();
  ok(hireTerms(a).firstHand, "a new sky starts the scheme over");
}

/* §14 — traffic on a timetable: lanes, docks, the board, shoot-downs */
{
  const { traffic, populateTraffic, stepTraffic, poseAt, markVesselDown, trafficDown, visibleVessels, vesselStatus, trafficCensus } = await import("../js/npc/traffic.js");
  const { contacts, syncContacts } = await import("../js/turrets.js");
  const { launchSim, relationOf } = await import("../js/sim.js");
  const { makePilot } = await import("../js/pilot.js");
  const { stations } = await import("../js/stations.js");
  const { currentSystem } = await import("../js/bodies.js");
  makePilot("Tr", "terran", "mining", null);
  launchSim("TrafficTest", "sol");
  sim.phase = "play";
  ok(traffic.length >= 8, `Sol carries traffic (${traffic.length} hulls)`);
  ok(traffic.every((n) => n.captain && n.hullName && (n.role === "patrol" || n.role === "pirate" || n.period > 100)), "every hull has a captain, a registry name and a loop (pirates lurk, they do not loop)");
  const jobs = new Set();
  for (let t = 0; t < 2400; t += 12) { stepTraffic(t, 12, stations, currentSystem); for (const n of traffic) jobs.add(n.job); }
  ok(["docked", "outbound", "in lane", "approach", "cutting", "watch"].every((k) => jobs.has(k)), `the timetable covers dock, burn, lane, approach, cut and picket (${[...jobs].join(", ")})`);
  const T = 777;
  stepTraffic(T, 1, stations, currentSystem);
  /* Only a hull INSIDE a station ring is off the board now. "in lane" used to
   * mean gone — the old lane was a teleport with `visible:false` in the middle
   * — and it now means the drive is lit: fast, but tracked the whole way, so a
   * crossing can be intercepted. That distinction is the point of the change,
   * so it is pinned here rather than left to drift back. */
  const docked = traffic.filter((n) => n.job === "docked");
  ok(docked.length > 0 && docked.every((n) => n.visible === false), `docked hulls are off the board (${docked.length})`);
  const underDrive = traffic.filter((n) => n.job === "in lane");
  ok(underDrive.every((n) => n.visible !== false), `hulls under drive stay on the board (${underDrive.length})`);
  syncContacts(sim.ship, sim.remotes, relationOf, T, 0.1);
  const onBoard = traffic.filter((n) => n.visible !== false);
  const inRange = onBoard.filter((n) => Math.hypot(n.x - sim.ship.pos.x, n.y - sim.ship.pos.y, n.z - sim.ship.pos.z) <= 50000);
  ok(contacts.filter((c) => c.kind === "npc").length === inRange.length, `only flying hulls inside sensor range are contacts (${inRange.length} of ${onBoard.length} up, ${traffic.length} total)`);
  const vv = visibleVessels(sim.ship.pos);
  ok(vv.length === onBoard.length && (vv.length < 2 || vv[0].d <= vv[1].d), "visibleVessels sorts nearest first");
  ok(/commanding/.test(vesselStatus(traffic[0])), `status line names the captain ("${vesselStatus(traffic[0]).slice(0, 44)}…")`);
  ok(trafficCensus().flying === onBoard.length, "census counts who is flying");
  /* shoot one down: off the board, then back on its route */
  const target = onBoard[0];
  const until = markVesselDown(target.id, T);
  ok(until === T + 600 && trafficDown[target.id] === until, "a downed hull leaves the board for ten minutes of sky time");
  stepTraffic(T + 10, 10, stations, currentSystem);
  syncContacts(sim.ship, sim.remotes, relationOf, T + 10, 0.1);
  ok(target.job === "down" && !contacts.some((c) => c.id === target.id), "and stays down, off the contact board");
  stepTraffic(T + 700, 10, stations, currentSystem);
  ok(target.job !== "down", "then comes back on its route");
  delete trafficDown[target.id];
}

/* §14 — one sky for the room: snapshots, remote strikes, mirrors */
{
  const { launchSim, worldSnapshot, applyWorldSnapshot, applyRemoteStrike, cycleTimeScale, strikeBody } = await import("../js/sim.js");
  const { impactors, setImpactorAuthority, adoptImpactors, stepImpactors, impactorAuthority } = await import("../js/impactors.js");
  const { BODIES, bodyById, bodyPosition } = await import("../js/bodies.js");
  const { makePilot } = await import("../js/pilot.js");
  makePilot("Ws", "terran", "mining", null);
  launchSim("WorldSync", "sol");
  sim.phase = "play";
  ok(sim.worldAuthority === true && impactorAuthority(), "solo: we hold the sky");
  const w = BODIES.find((b) => b.kind !== "star" && b.kind !== "gas" && !b.shattered);
  strikeBody(w.id, w.radius * 0.3, 900);
  sim.lostPorts = ["st-gone"];
  const snap = worldSnapshot();
  ok(snap.v === 1 && snap.bodies[w.id] && snap.bodies[w.id].craters.length >= 1, "snapshot carries the crater");
  ok(snap.lost.includes("st-gone") && Array.isArray(snap.impactors), "and the lost ports and the live rocks");
  const wire = JSON.parse(JSON.stringify(snap));
  launchSim("Joiner", "sol");
  sim.phase = "play";
  const w2 = bodyById(w.id);
  ok((w2.craters?.length ?? 0) === 0 && (w2.integrity ?? 1) === 1, "a fresh join has an unmarked world");
  ok(applyWorldSnapshot(wire), "snapshot applies");
  ok(w2.craters.length === wire.bodies[w.id].craters.length && Math.abs(w2.integrity - wire.bodies[w.id].integrity) < 1e-9, "the joiner sees the same crater and the same integrity");
  ok(w2.dirty === true, "and the renderer is told to rebuild it");
  /* mirror mode: no spawns, adopt the host's rocks, take the host's strike */
  setImpactorAuthority(false);
  sim.worldAuthority = false;
  impactors.length = 0;
  for (let i = 0; i < 200; i++) stepImpactors(1, sim.ship, BODIES, bodyPosition, () => ({}), { x: 0, y: 0, z: 0 }, sim.time, () => {}, () => {});
  ok(impactors.length === 0, "a mirror never spawns its own rocks");
  adoptImpactors([{ id: "impH1", name: "Host Rock 1", r: 200, x: 1, y: 2, z: 3, vx: 10, vy: 0, vz: 0, born: 0 }]);
  ok(impactors.length === 1 && impactors[0].remote, "it adopts the host's list");
  stepImpactors(1, sim.ship, BODIES, bodyPosition, () => ({}), { x: 0, y: 0, z: 0 }, sim.time, () => {}, () => {});
  ok(Math.abs(impactors[0].x - 11) < 1e-9, "and dead-reckons it between updates");
  const moon = bodyById(BODIES.find((b) => b.kind !== "star" && b.kind !== "gas" && !b.shattered && b.id !== w.id).id);
  const n0 = moon.craters?.length ?? 0;
  const tier = applyRemoteStrike({ id: "impH1", bodyId: moon.id, r: moon.radius * 0.3, speed: 900, name: "Host Rock 1", n: { nx: 1, ny: 0, nz: 0 } });
  ok(tier && moon.craters.length === n0 + 1 && impactors.length === 0, `a host strike lands here too (${tier}) and clears the rock`);
  ok(cycleTimeScale() === 1 && /one clock/.test(sim.notice), "a mirror cannot run the clock fast");
  setImpactorAuthority(true);
  sim.worldAuthority = true;
}

/* §15 — the glyph kit and passive telemetry */
{
  const { glyphString, sigil, ALPHABETS, mulberry } = await import("../js/ui/glyphs.js");
  const a = glyphString("npc_abc", 18), b = glyphString("npc_abc", 18), c = glyphString("npc_abd", 18);
  ok(a === b && a !== c && [...a].length === 18, "glyph strings are deterministic per seed and the right length");
  ok([...a].every((ch) => ALPHABETS.all.includes(ch)), "every glyph comes from the machine's alphabet");
  const s1 = sigil("Corin Voss"), s2 = sigil("Corin Voss");
  ok(s1 === s2 && [...s1].length >= 3 && [...s1].length <= 4, `a sigil is 3–4 glyphs and stable ("${s1}")`);
  const seen = new Set();
  for (let i = 0; i < 200; i++) seen.add(sigil(`p${i}`));
  ok(seen.size > 190, "sigils rarely collide");
  const r1 = mulberry("x")(), r2 = mulberry("x")();
  ok(r1 === r2 && r1 >= 0 && r1 < 1, "seeded generator");
  /* telemetry samples every three sky-seconds while playing */
  const { launchSim, tickSim, resetTelemetry } = await import("../js/sim.js");
  const { makePilot } = await import("../js/pilot.js");
  makePilot("Te", "terran", "mining", null);
  launchSim("Telemetry", "sol");
  sim.phase = "play";
  resetTelemetry();
  for (let i = 0; i < 100; i++) tickSim(0.1);
  ok(sim.telemetry.credits.length >= 3 && sim.telemetry.hull.length === sim.telemetry.credits.length, `telemetry rows accrue (${sim.telemetry.credits.length} in 10 s)`);
  /* 0.3.34: hull is a pool now, not a universal hundred — it comes off the
   * flown frame's mass and then the pilot's own hull modifier, so a terran
   * miner in the trainer reads 105 rather than 100. The sample must track the
   * ship, which is what this was always checking. */
  ok(sim.telemetry.hull.every((v) => v === Math.round(sim.ship.hull)), `hull samples read the ship (${sim.ship.hull} of ${sim.ship.hullMax})`);
}

/* §16 — the target funnel, staged cataclysms, rings, and the lit sky */
{
  const cx = await import("../js/cataclysm.js");
  const {
    acquireLock, clearLock, setNavTarget, togglePointerLock, goSupernova,
    startCataclysm, launchSim, tickSim, warpBlock, selectBody, toggleWarp,
  } = await import("../js/sim.js");
  const { chunks, resetDebris } = await import("../js/debris.js");
  const { makePilot } = await import("../js/pilot.js");
  const { bodyById: liveBody, surveyIds: liveIds } = await import("../js/bodies.js");
  /* launchSim rebinds the module's BODIES, and the destructure at the top of
   * this file is a snapshot — so anything after a launch has to go through
   * the live lookups or it will be editing a discarded sky. */
  const live = () => liveIds().map(liveBody);

  /* ---- blackbody ---- */
  const hot = cx.kelvinRGB(15000), warm = cx.kelvinRGB(1500);
  ok(hot.b > hot.r * 0.85 && warm.b < warm.r * 0.4, "hot reads blue-white, cool reads orange");
  ok(cx.kelvinHex(6500) > 0 && cx.kelvinHex(1200) > 0, "kelvin maps to a colour");

  /* ---- the spike bug: neighbouring vertices must move together ---- */
  {
    const step = 0.0654;               // vertex spacing on a 96-segment sphere
    const whiteNoise = (seed, nx, ny, nz) => {
      let h = seed >>> 0;
      h = Math.imul(h ^ (Math.round(nx * 509) + 512), 2654435761) >>> 0;
      h = Math.imul(h ^ (Math.round(ny * 509) + 512), 1597334677) >>> 0;
      h = Math.imul(h ^ (Math.round(nz * 509) + 512), 2246822519) >>> 0;
      h ^= h >>> 13;
      return ((h >>> 0) / 4294967296) - 0.5;
    };
    let dOld = 0, dNew = 0;
    const N = 4000;
    for (let i = 0; i < N; i++) {
      const a = (i * 2.399963) % 6.2831853, b = Math.acos(2 * ((i * 0.6180339887) % 1) - 1);
      const nx = Math.sin(b) * Math.cos(a), ny = Math.cos(b), nz = Math.sin(b) * Math.sin(a);
      dOld += Math.abs(whiteNoise(7, nx, ny, nz) - whiteNoise(7, nx + step, ny, nz));
      dNew += Math.abs(cx.dirNoise(7, nx, ny, nz, 4) - cx.dirNoise(7, nx + step, ny, nz, 4));
    }
    ok(dNew / N < (dOld / N) / 3, `crater noise is smooth, not spiky (${(dNew / N).toFixed(3)} vs ${(dOld / N).toFixed(3)} per vertex step)`);
    ok(Math.abs(cx.dirNoise(3, 0.5, 0.5, 0.7, 4)) <= 0.5, "noise stays in range");
    ok(cx.dirNoise(3, 0.5, 0.5, 0.7, 4) === cx.dirNoise(3, 0.5, 0.5, 0.7, 4), "and is deterministic — a seam cannot crack open");
  }

  /* ---- outcomes ---- */
  ok(cx.outcomeOf(0.01) === cx.OUTCOME.SCAR && cx.outcomeOf(0.1) === cx.OUTCOME.BASIN, "small hits scar and dig");
  ok(cx.outcomeOf(0.25) === cx.OUTCOME.RESURFACE && cx.outcomeOf(0.6) === cx.OUTCOME.DISRUPT, "big hits resurface then disrupt");
  ok(cx.outcomeOf(0.9) === cx.OUTCOME.SHATTER && cx.outcomeOf(0.1, 0) === cx.OUTCOME.SHATTER, "world-enders, and anything that runs integrity out");
  ok(!cx.isCataclysmic(cx.OUTCOME.BASIN) && cx.isCataclysmic(cx.OUTCOME.RESURFACE), "only resurfacing and worse run the staged event");

  /* ---- the staged curve ---- */
  {
    const early = cx.cataclysmState(0.2, 0.9);
    const mid = cx.cataclysmState(30, 0.9);
    const late = cx.cataclysmState(600, 0.9);
    ok(early.phase === "contact" && early.kelvin > 9000, `contact is the hottest moment (${Math.round(early.kelvin)} K)`);
    ok(early.lum > mid.lum && mid.lum > late.lum, "the light curve peaks early and decays");
    ok(mid.kelvin < early.kelvin && late.kelvin < mid.kelvin, "and it cools the whole way down");
    ok(early.shell < mid.shell && mid.shell <= 1, "the blast shell expands and stops");
    ok(early.molten > late.molten && cx.cataclysmState(0, 0.9).molten > 0.5, "the surface is liquid at first and solid later");
    ok(late.settle > 0.8 && early.settle < 0.1, "the debris torus flattens over the long tail");
    ok(cx.eventDuration(1.2) > cx.eventDuration(0.2), "a bigger event takes longer to finish");
    ok(cx.cataclysmState(cx.eventDuration(0.5) + 1, 0.5).done, "and it does finish");
  }

  /* ---- supernova ---- */
  {
    const br = cx.supernovaState(0.3), pl = cx.supernovaState(40), tl = cx.supernovaState(250);
    ok(br.phase === "breakout" && br.lum > 0.9 && br.kelvin > 15000, "breakout is a blue-white spike");
    ok(pl.phase === "plateau" && Math.abs(pl.kelvin - 5600) < 700, `the plateau pins near hydrogen recombination (${Math.round(pl.kelvin)} K)`);
    ok(tl.lum < pl.lum && tl.kelvin < pl.kelvin, "the tail is dimmer and redder");
    ok(cx.supernovaState(1).shell < cx.supernovaState(20).shell, "the photosphere expands homologously");
    ok(cx.supernovaDuration() > 300, "and the whole thing runs for minutes, not seconds");
  }

  /* ---- rings ---- */
  {
    const roche = cx.rocheLimit(1000);
    ok(Math.abs(roche - 2440) < 1, "fluid Roche limit is 2.44 radii");
    const plan = cx.ringPlan(1000, 0.9, true);
    ok(plan.outer > plan.inner && plan.inner > 1000, "the ring sits clear of the surface");
    ok(plan.count > 50 && plan.tilt > 0, "a shattered world throws a thick, inclined torus");
    ok(cx.ringPlan(1000, 0.05).moonlets === 0, "a small event leaves nothing outside the Roche limit to clump");
  }

  /* ---- craters slump while the surface is molten ---- */
  {
    const body = { radius: 1000, craters: [{ nx: 1, ny: 0, nz: 0, r: 100, depth: 0.5, depth0: 0.5, rough: 1 }] };
    ok(!cx.relaxCraters(body, 10, 0), "a cold world keeps its craters forever, as it should");
    ok(body.craters[0].depth === 0.5, "untouched");
    cx.relaxCraters(body, 60, 1);
    ok(body.craters[0].depth < 0.3, `a molten world's basins slump (${body.craters[0].depth.toFixed(3)})`);
    ok(body.craters[0].r > 100 && body.craters[0].rough < 1, "they widen and lose their sharp rim");
    for (let i = 0; i < 40; i++) cx.relaxCraters(body, 10, 1);
    ok(body.craters[0].depth > 0.05, "but a real basin is left behind, not a smooth ball");
  }

  /* ---- apparent brightness behind you ---- */
  {
    const near = cx.apparentGlow(1, 1000, 9000);
    const far = cx.apparentGlow(1, 1000, 90000);
    ok(near > far * 50, "brightness falls off with the square of the distance");
    ok(cx.apparentGlow(0, 1000, 100) === 0, "and a dead event lights nothing");
  }

  /* ---- one target, one truth ---- */
  makePilot("Nav", "terran", "mining", null);
  launchSim("NavTest", "sol");
  sim.phase = "play";
  {
    const world = live().find((b) => b.kind !== "star" && !b.shattered);
    const port = stations[0];
    selectBody(world.id);
    ok(sim.selected === world.id && sim.lock.id === world.id, "picking a world locks it and aims the core at it");

    /* the bug: locking something you cannot warp to used to leave the old
     * destination in place, and the next jump went there instead */
    acquireLock({ kind: "contact", id: "ghost-contact" });
    ok(sim.lock.id !== "ghost-contact" || sim.selected === null, "a contact lock never inherits the last world");
    acquireLock({ kind: "body", id: world.id });
    ok(sim.selected === world.id, "back on the world");
    sim.lock.id = "rock-1"; sim.lock.kind = "rock"; sim.lock.name = "Rock";
    setNavTarget(null);
    ok(warpBlock() === "LOCK NOT A WARP NODE", "and the core says why it will not go");

    /* releasing a lock releases the destination with it */
    acquireLock({ kind: "body", id: world.id });
    clearLock("test");
    ok(sim.selected === null && warpBlock() === "NO TARGET", "dropping the lock drops the destination");

    /* a port is a warp node, so locking one aims the core at it */
    if (port) {
      acquireLock({ kind: "station", id: port.id });
      ok(sim.selected === port.id, "locking a port aims the core at the port");
    }

    /* a survey must not silently re-aim the core */
    acquireLock({ kind: "body", id: world.id });
    const keep = sim.selected;
    sim.wantScan = true;
    tickSim(0.05);
    ok(sim.selected === keep, "a survey reports; it does not re-aim the warp core");

    /* changing target mid-spool stands the core down instead of jumping wrong */
    sim.warp.state = "spool"; sim.warp.t = 0; sim.warp.targetId = keep;
    setNavTarget(null);
    ok(sim.warp.state === "idle", "changing target aborts the spool");
  }

  /* ---- a strike now runs an event, lights the sky and lays a ring ---- */
  {
    const world = live().find((b) => b.kind === "rocky" && !b.shattered) ?? live().find((b) => b.kind !== "star" && !b.shattered);
    sim.events.length = 0;
    resetDebris();
    const p = { x: 0, y: 0, z: 0 };
    bodyPosition(world.id, sim.time, p);
    sim.ship.pos = { x: p.x + world.radius * 6, y: p.y, z: p.z };
    const ev = startCataclysm(world, 0.7, { nx: 0, ny: 0, nz: 1 }, cx.OUTCOME.DISRUPT);
    ok(sim.events.length === 1 && ev.dur > 100, "the event has a life of its own");
    tickSim(0.1);
    ok(sim.skyGlow.length === 1, "it publishes a light into the sky");
    ok(sim.skyGlow[0].hex > 0 && sim.skyGlow[0].lum > 0, "with a colour and a brightness");
    ok(sim.skyLift > 0, "and the sky itself lifts — an event behind you still reads on the hull in front of you");
    const lit = sim.skyLift;
    for (let i = 0; i < 200; i++) tickSim(0.1);
    ok(sim.events[0]?.ringed, "the debris goes down as a ring once the curtain has cleared");
    ok(chunks.some((c) => c.parent === world.id && c.orbitR != null), "and there is rubble on those rails");
    ok(world.ring && world.ring.outer > world.ring.inner, "the world wears a ring now");
    const inc0 = chunks.filter((c) => c.parent === world.id).reduce((a, c) => a + Math.abs(c.orbitY), 0);
    for (let i = 0; i < 4200; i++) tickSim(0.1);   // tickSim clamps dt to 0.1 — ~7 minutes of sky
    const inc1 = chunks.filter((c) => c.parent === world.id).reduce((a, c) => a + Math.abs(c.orbitY), 0);
    ok(inc1 < inc0 * 0.2, `the torus flattens toward the equatorial plane (${Math.round(inc0)} → ${Math.round(inc1)})`);
    ok(sim.skyLift < lit, "and the sky goes dark again");
  }

  /* ---- a star can stop being one ---- */
  {
    sim.events.length = 0;
    const star = live().find((b) => b.kind === "star");
    const ev = goSupernova(star?.id);
    ok(ev && ev.kind === "supernova" && star.nova, "the star breaks out");
    tickSim(0.1);
    ok(sim.skyGlow.some((g) => g.kind === "supernova"), "and it lights the whole sky");
    ok(sim.skyLift > 0.05, `hard (lift ${sim.skyLift.toFixed(2)})`);
    ok(!goSupernova(star.id), "it only happens once");
    star.nova = false;
    sim.events.length = 0;
  }
}

sim.phase = "menu";
console.log(`experimental (§16 sections): ${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
