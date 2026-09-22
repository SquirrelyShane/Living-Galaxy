/* LIVING GALAXY 0.3.16 — what is said on the band is true.
 *
 *   node --import ./test/three-register.mjs test/ground.test.mjs
 *
 * A hull that claims traffic around a port is at that port and the number is
 * the port's real count; a mayday comes only from a hull something is really
 * shooting, names the real attackers and hull integrity, and never from a
 * raider in the middle of its own attack; a miner reports the ores actually
 * in reach of its claim, how much, which is worth most, and the raiders and
 * rogue drones actually on the belt with it — and hauls home the ore it said
 * was paying. The speech engine's own claim topics are held to the same sky.
 */

import { sim, launchSim } from "../js/sim.js";
import { makePilot } from "../js/pilot.js";
import { stations, stepStations } from "../js/stations.js";
import { currentSystem } from "../js/bodies.js";
import { traffic, stepTraffic, HOSTILE_ROLES, trafficHooks } from "../js/npc/traffic.js";
import { flow, stepFlow } from "../js/npc/flow.js";
import { armFlight } from "../js/npc/flight.js";
import { nearbyRocks } from "../js/field.js";
import { speech, resetSpeech, syncBand, chatter, talkTo } from "../js/npc/speech.js";
import { TOPICS } from "../js/speech/npc-speech.js";
import { placeOf, portCensus, underFire, threatsNear, claimSurvey, PORT_R, BELT_THREAT_R } from "../js/npc/ground.js";
import { groundedReport, urgentReport, resetReports, reports, answerFor, transitionReport } from "../js/npc/reports.js";

let pass = 0, fail = 0;
const ok = (c, m) => { if (c) pass++; else { fail++; console.error("  FAIL", m); } };
const d3 = (a, b) => Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z);

makePilot("Ground", "terran", "mining", null);
launchSim("GroundTest", "sol");
sim.phase = "play";
for (let t = 0; t < 400; t += 5) { sim.time = t; stepStations(t); stepTraffic(t, 5); stepFlow(t); }
const now = () => sim.time;
const port = stations.find((s) => s.sector !== "pirate");
sim.ship.pos = { x: port.x + 400, y: port.y, z: port.z + 400 };
resetSpeech(sim.skySeed);
resetReports();

/* ---- the speech units are the hulls ------------------------------------------------ */
{
  const honest = traffic.filter((n) => !HOSTILE_ROLES.has(n.role) && !n.rogue && n.job !== "down");
  const n = honest[0];
  armFlight(n);
  n.hp = n.hpMax * 0.4;
  n.x = port.x + 300; n.y = port.y; n.z = port.z + 300; n.visible = true;
  const band = syncBand(sim.ship.pos, sim.skySeed);
  const u = band.find((x) => x.ref === n);
  ok(u && Math.abs(u.hp - 40) < 1e-6, `a unit's hull is the hull's real integrity (${u?.hp?.toFixed(1)})`);
  ok(u && !u.underFire, "a damaged hull nobody is shooting is not under fire");
  ok(u && u.nearestName === port.name, `and it is placed where it is: at ${u?.nearestName}`);
  n.hp = n.hpMax;
  ok(!band.some((x) => x.ref?.rogue), "rogue drones have no voice on the band");
  const far = honest.find((x) => placeOf(x).kind === "space");
  if (far) { const fu = syncBand(far, sim.skySeed).find((x) => x.ref === far); ok(fu && fu.nearestName == null, "a hull in open space is not 'off' the port it is bound for"); }
}

/* ---- mayday ---------------------------------------------------------------------- */
{
  resetReports();
  const victim = traffic.find((n) => n.role === "trader" && n.job !== "down");
  const raider = traffic.find((n) => HOSTILE_ROLES.has(n.role) && n.job !== "down");
  armFlight(victim); armFlight(raider);
  victim.x = port.x + 800; victim.y = port.y; victim.z = port.z; victim.visible = true;
  raider.x = victim.x + 500; raider.y = victim.y; raider.z = victim.z; raider.visible = true; raider.job = "engaged";
  ok(!underFire(victim, now()), "no hit, no fire");
  ok(urgentReport(sim.ship.pos, now())?.facts?.by !== victim.name, "nobody calls a mayday for a hull nobody is shooting");
  victim.lastHitAt = now(); victim.lastHitBy = raider.id; victim.hp = victim.hpMax * 0.55;
  const f = underFire(victim, now());
  ok(f && f.by === raider.name && f.kind === "pirate" && f.hp === 55, `a fresh hit is fire: by ${f?.by}, ${f?.kind}, hull ${f?.hp}%`);
  const may = urgentReport(sim.ship.pos, now());
  ok(may && may.kind === "mayday" && may.from.ref === victim, `the victim calls it (${may?.text})`);
  ok(may && may.text.includes(victim.name) && /55 percent/.test(may.text) && may.text.includes(port.name), "naming its hull, its real integrity, and where it really is");
  ok(!urgentReport(sim.ship.pos, now()), "and does not repeat itself on the next tick");
  /* the raider in the middle of its attack */
  raider.lastHitAt = now(); raider.lastHitBy = victim.id;
  sim.time += 60;
  const again = urgentReport(sim.ship.pos, now());
  ok(!again || again.from.ref !== raider, "a raider does not call a mayday");
  /* the speech engine's askHelp is held to the same */
  const band = syncBand(sim.ship.pos, sim.skySeed);
  const ru = band.find((x) => x.ref === raider), vu = band.find((x) => x.ref === victim);
  const law = band.find((x) => x.ref && (x.ref.role === "patrol" || x.ref.role === "security")) ?? band.find((x) => x !== vu && x !== ru);
  if (ru && law) ok(!TOPICS.askHelp.when(ru, law, speech.world.ctxFor(ru, law)), "the engine's askHelp is shut for a raider");
  victim.lastHitAt = -1e9; victim.hp = victim.hpMax; raider.lastHitAt = -1e9;
  sim.time += 60;
  const band2 = syncBand(sim.ship.pos, sim.skySeed);
  const vu2 = band2.find((x) => x.ref === victim);
  if (vu2 && law) ok(!TOPICS.askHelp.when(vu2, law, speech.world.ctxFor(vu2, law)), "and for a hull nobody is shooting any more");
}

/* ---- port traffic ------------------------------------------------------------------ */
{
  resetReports();
  let portReports = 0, honestPlace = 0, honestCount = 0;
  for (let i = 0; i < 400; i++) {
    sim.time += 7;
    stepStations(sim.time); stepTraffic(sim.time, 7); stepFlow(sim.time);
    if (i % 25 === 0) resetReports();
    const r = groundedReport(sim.ship.pos, sim.time, Math.random);
    if (!r || r.kind !== "port") continue;
    portReports++;
    const st = stations.find((s) => s.id === r.facts.station);
    if (d3(r.from.ref, st) < PORT_R) honestPlace++;
    if (r.facts.around === Math.max(0, portCensus(st).total - 1)) honestCount++;
  }
  ok(portReports > 0, `ports get reported (${portReports})`);
  ok(honestPlace === portReports, `every port report comes from a hull at that port (${honestPlace}/${portReports})`);
  ok(honestCount === portReports, `and every count is the port's real census (${honestCount}/${portReports})`);
}

/* ---- the belt ---------------------------------------------------------------------- */
{
  resetReports();
  const belt = currentSystem.belt ?? currentSystem.outerBelt;
  let claim = null;
  for (let a = 0; a < Math.PI * 2 && !claim; a += 0.05) {
    const rad = (belt.inner + belt.outer) / 2;
    const p = { x: Math.cos(a) * rad, y: 0, z: Math.sin(a) * rad };
    if (nearbyRocks(p, sim.time, 1).filter((k) => k.worn < 1).length > 8) claim = p;
  }
  ok(claim, "a claim with rock on it");
  const miner = traffic.find((n) => n.role === "miner" && n.job !== "down");
  armFlight(miner);
  Object.assign(miner, { x: claim.x, y: claim.y, z: claim.z, visible: true, job: "cutting", state: "cut" });
  /* park every raider and drone far away first */
  for (const n of traffic) if ((HOSTILE_ROLES.has(n.role) || n.rogue) && d3(n, claim) < BELT_THREAT_R * 2) { n.x += 1e6; }
  const s = claimSurvey(miner, sim.time);
  ok(s.rocks > 0 && s.ores.length >= 1 && s.units > 0, `the survey reads the rock: ${s.ores.map((e) => `${e.id} ${e.units}`).join(", ")}`);
  const ids = new Set(nearbyRocks(claim, sim.time, 1).filter((k) => k.worn < 1).map((k) => k.ore));
  ok(s.ores.every((e) => ids.has(e.id)), "every ore it names is on a rock in reach");
  ok(s.ores.every((e, i) => i === 0 || e.value <= s.ores[i - 1].value), "ranked by value");
  let r = transitionReport(miner, "cutting", sim.time);
  ok(r && r.kind === "claim" && r.from.ref === miner, `the miner reports its claim (${r?.text})`);
  ok(r && r.text.toLowerCase().includes((s.pays ?? s.common).name.toLowerCase()), "naming the ore it is cutting");
  if (s.best && s.common && s.best.id !== s.common.id) ok(r.text.toLowerCase().includes(s.best.name.toLowerCase()) && /units/.test(r.text), "and the richest ore in reach, with an amount");
  ok(/no raiders or drones/i.test(r.text) && r.facts.pirates === 0 && r.facts.rogues === 0, "a clean belt is called clean");
  /* a raider on the belt */
  resetReports();
  const raider = traffic.find((n) => HOSTILE_ROLES.has(n.role) && n.job !== "down");
  Object.assign(raider, { x: claim.x + 2500, y: claim.y, z: claim.z, visible: true, job: "lurking" });
  r = transitionReport(miner, "cutting", sim.time);
  ok(r && r.facts.pirates === 1 && /raider/.test(r.text) && /25 km/.test(r.text), `a raider on the belt is called, with its range (${r?.text.split(". ").slice(-2).join(". ")})`);
  /* a rogue drone */
  resetReports();
  const drone = { id: "rog:test:1", name: "TEST 101", role: "rogue", rogue: true, nest: "nest1", captain: "no one", x: claim.x - 1800, y: claim.y, z: claim.z, visible: true, job: "hunting" };
  traffic.push(drone);
  r = transitionReport(miner, "cutting", sim.time);
  ok(r && r.facts.rogues === 1 && /rogue drone/.test(r.text), "a rogue drone on the belt is called");
  traffic.splice(traffic.indexOf(drone), 1);
  raider.x += 1e6;
  /* and what it hauls home is what it said pays */
  const P = { x: claim.x, y: claim.y, z: claim.z };
  const want = trafficHooks.claimOre(P, sim.time);
  ok(want === (s.pays?.id ?? null), `a finished claim sends home the ore with the most money in it (${want})`);
  /* asking it */
  const a = answerFor(miner, "ore", sim.time);
  ok(a && a.toLowerCase().includes(s.ores[0].name.toLowerCase()), `asked about ore, it names what is there (${a})`);
  const dz = answerFor(miner, "danger", sim.time);
  ok(dz && /nothing hostile/i.test(dz), `asked about danger on a clean belt, it says so (${dz})`);
  const said = talkTo(miner, "what's the ore like on your claim?", sim.time);
  ok(said && said.text.toLowerCase().includes(s.ores[0].name.toLowerCase()), `and the same answer comes back through a call (${said?.text})`);
}

/* ---- the engine's own claims, over a long band --------------------------------------- */
{
  resetSpeech(sim.skySeed);
  let lane = 0, laneBad = 0, help = 0, helpBad = 0, clear = 0, clearBad = 0, route = 0, rounds = 0;
  for (let i = 0; i < 300; i++) {
    sim.time += 11;
    stepStations(sim.time); stepTraffic(sim.time, 11); stepFlow(sim.time);
    const ex = chatter(sim.ship.pos, sim.time, Math.random, { skySeed: sim.skySeed });
    if (!ex) continue;
    rounds++;
    const opener = ex.lines[0]?.from;
    if (ex.topic === "laneReport") { lane++; if (opener?.where?.kind !== "port") laneBad++; }
    if (ex.topic === "askHelp") { help++; if (!opener?.underFire || HOSTILE_ROLES.has(opener.ref?.role)) helpBad++; }
    if (ex.topic === "positionReport") { clear++; if (opener?.ref && threatsNear(opener.ref).count) clearBad++; }
    if (ex.topic === "routeAdvice") route++;
  }
  ok(rounds > 40, `the band still talks (${rounds} exchanges)`);
  ok(laneBad === 0, `every lane report comes from a hull at a port (${lane - laneBad}/${lane})`);
  ok(helpBad === 0, `every call for help comes from a hull under fire (${help - helpBad}/${help})`);
  ok(clearBad === 0, `"the board is clear" is only said when it is (${clear - clearBad}/${clear})`);
  ok(route === 0, "the ungrounded route gossip is off");
}

for (const e of reports.log.slice(-12)) console.log("  ·", e.kind, e.speaker, "—", e.text);
console.log(`ground: ${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
