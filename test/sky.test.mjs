/* LIVING GALAXY — the working sky: rookie hull, lanes, pirates, security, engagements.
 *
 *   node --import ./test/three-register.mjs test/sky.test.mjs
 */

import { sim, launchSim, currentShipId, issuedHullId, wellEdge, WARP } from "../js/sim.js";
import { makePilot } from "../js/pilot.js";
import { stations } from "../js/stations.js";
import { currentSystem, BODIES, refreshBody } from "../js/bodies.js";
import { remnantRadius, wellRadius, SHATTERED_MU } from "../js/scale.js";
import { SHIP_DB, shipById, hullTuneFor, DEFAULT_SHIP_ID } from "../js/shipdb.js";
import { traffic, poseAt, routePose, stepTraffic, trafficCensus, ROLES, HOSTILE_ROLES, LAW_ROLES, DEPART_S, ARRIVE_S } from "../js/npc/traffic.js";
import { stationLane, lanePoint, laneOf, runnerIndex, beadLit, LANE_BEADS, LANE_U } from "../js/npc/lanes.js";
import { engagementAt, engagements, stepBattles, resetBattles, ENG_SLOT, JOIN_R, pirateKilled } from "../js/npc/battles.js";
import { contacts, shots, syncContacts, stepShots, npcTracer, CONTACT_R } from "../js/turrets.js";
import { flow, populateFlow, stepFlow, flowPose, portPulse } from "../js/npc/flow.js";
import { subLaneFor, subLaneOffset, SUBLANES, SUBLANE_GAP, ZONE_HALF_W, laneFlow } from "../js/npc/lanes.js";
import { insideBay } from "../js/npc/bay.js";
import { templateFor, warm, instanceOf, releaseInstance, poolStats, drainPool } from "../js/hullpool.js";

let pass = 0, fail = 0;
const ok = (c, m) => { if (c) pass++; else { fail++; console.error("  FAIL", m); } };
const d3 = (a, b) => Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z);

/* ---- rookie start ------------------------------------------------------ */
const rookie = shipById(DEFAULT_SHIP_ID);
ok(rookie && rookie.tier === "A" && rookie.complex === "general", `default hull is the trainer (${rookie?.name})`);
ok(rookie.stats.turrets === 0 && rookie.grammar.weapons === "none", "trainer is unarmed");
ok(rookie.dims[0] < shipById("general_b").dims[0], "trainer is smaller than the Wren");
for (const d of SHIP_DB) {
  const t = hullTuneFor(d);
  ok(t.thrust > 0.2 && t.turn > 0.15 && t.reactor >= 0.85 && t.cargo >= 0.5 && t.cargo <= 4, `${d.id}: sane hull tune`);
}
ok(hullTuneFor(rookie).turn > hullTuneFor(shipById("mining_g")).turn * 3, "a skiff turns far faster than a colossus");
ok(hullTuneFor(shipById("mining_g")).reactor > hullTuneFor(rookie).reactor, "a colossus has the bigger reactor");

makePilot("Sky", "terran", "mining", null);
/* A PINNED FIXTURE SKY. This suite asserts on generated ports — their mounts,
 * their drone bays, their works — so it needs a sky that reliably contains one
 * of each thing it reaches for, rather than whatever the public room happens to
 * be seeded with today. */
launchSim("SkyTest", "baysky");
sim.phase = "play";
ok(currentShipId() === DEFAULT_SHIP_ID, `a fresh pilot flies the trainer (${currentShipId()})`);
ok(issuedHullId() === "mining_a", `the complex's A hull is what the yard signs over (${issuedHullId()})`);
sim.activeHullId = "mining_c";
ok(currentShipId() === "mining_c", "a bought hull outranks the trainer");
sim.activeHullId = null;

/* ---- lanes ------------------------------------------------------------- */
const port = stations.find((s) => s.sector !== "pirate");
ok(port, "Sol has a port");
const f = stationLane(port);
ok(Math.abs(Math.hypot(f.dir.x, f.dir.y, f.dir.z) - 1) < 1e-9, "lane direction is unit");
ok(Math.abs(f.dir.x * f.side.x + f.dir.z * f.side.z) < 1e-9, "side is perpendicular to the lane");
ok(port.port && port.gen && port.mounts, `the port is a built STATIONGEN hull with a mouth (${port.gen?.stats.archetype}, ${port.port?.form}/${port.port?.mouth})`);
ok(d3(f.entry, f.exit) < port.port.w && d3(f.entry, f.exit) > 2, `entry and exit lanes share the mouth (${d3(f.entry, f.exit).toFixed(0)} u apart at the aperture)`);
ok(d3(f.farEntry, f.farExit) > port.radius * 5, `entry and exit lanes are apart past the funnel (${d3(f.farEntry, f.farExit).toFixed(0)} u)`);
const far = lanePoint(port, "exit", 1), near = lanePoint(port, "exit", 0);
ok(Math.abs((far.x - near.x) * f.dir.x + (far.y - near.y) * f.dir.y + (far.z - near.z) * f.dir.z - LANE_U) < 1e-6, "lane runs LANE_U out from the mouth");
{
  /* the funnel: ways a few units apart at the mouth, SUBLANE_GAP apart past FUNNEL_U */
  const a0 = lanePoint(port, "entry", 0, {}, 0), b0 = lanePoint(port, "entry", 0, {}, 2), a1 = lanePoint(port, "entry", 0.5, {}, 0), b1 = lanePoint(port, "entry", 0.5, {}, 2);
  ok(d3(a0, b0) < 8 && Math.abs(d3(a1, b1) - 2 * SUBLANE_GAP) < 1e-6, `the funnel gathers the ways: ${d3(a0, b0).toFixed(1)} u at the mouth, ${d3(a1, b1).toFixed(0)} u out`);
  const m = port.port;
  const mouth = { x: port.x + m.x, y: port.y + m.y, z: port.z + m.z };
  ok(d3(mouth, near) < m.w, "the exit lane starts at the hangar mouth");
}
ok(stationLane(port) === f, "lane frame is cached per port");
const r0 = runnerIndex(0, "exit"), r1 = runnerIndex(0.5, "exit");
ok(r0 === 0 && r1 > r0, "the exit runner starts at the clamps and moves outward");
ok(runnerIndex(0, "entry") === LANE_BEADS - 1 && runnerIndex(0.5, "entry") < LANE_BEADS - 1, "the entry runner starts at the far gate and moves inward");
let litCount = 0;
for (let i = 0; i < LANE_BEADS; i++) if (beadLit(1.7, "exit", i) > 0) litCount++;
ok(litCount >= 1 && litCount <= 5, `only the runner and its trail are lit (${litCount})`);
ok(laneOf(port, lanePoint(port, "entry", 0.5))?.which === "entry", "a point on the entry lane reads as the entry lane");
ok(laneOf(port, { x: port.x + f.side.x * 9000, y: port.y, z: port.z + f.side.z * 9000 }) === null, "a point off both lanes reads as none");

/* ---- roster ------------------------------------------------------------ */
const census = trafficCensus();
ok(census.pirate >= 3 && census.security >= 2 && census.trader >= 4 && census.miner >= 4, `roster: ${JSON.stringify(census)}`);
ok(traffic.filter((n) => n.role === "pirate").every((n) => n.lurk), "every pirate has a stretch of belt to lurk on");
ok(traffic.filter((n) => n.role === "security").every((n) => n.legs && n.period > 100), "security runs sweeps between ports");
for (const role of Object.keys(ROLES)) ok(ROLES[role].ships.every((id) => shipById(id)), `${role} hulls are registry hulls`);
ok(HOSTILE_ROLES.has("pirate") && LAW_ROLES.has("security") && LAW_ROLES.has("patrol"), "role sets");

/* outbound burns leave along the exit lane; approaches arrive along the entry lane */
let outboundOnLane = 0, outboundTotal = 0, approachOnLane = 0, approachTotal = 0;
const trader = traffic.find((n) => n.role === "trader" && n.legs);
for (const n of traffic) {
  if (!n.legs) continue;
  for (const leg of n.legs) {
    if (leg.kind !== "travel") continue;
    if (leg.from.kind === "port") {
      const st = stations.find((s) => s.id === leg.from.id);
      const p = routePose(n, leg.start + DEPART_S * 0.6 - n.phase, stations, currentSystem);
      outboundTotal++;
      if (p.job === "outbound" && laneOf(st, p)?.which === "exit") outboundOnLane++;
    }
    if (leg.to.kind === "port") {
      const st = stations.find((s) => s.id === leg.to.id);
      const p = routePose(n, leg.start + leg.dur - ARRIVE_S * 0.4 - n.phase, stations, currentSystem);
      approachTotal++;
      if (p.job === "approach" && laneOf(st, p)?.which === "entry") approachOnLane++;
    }
  }
}
ok(outboundTotal > 0 && outboundOnLane === outboundTotal, `every outbound burn rides its port's exit lane (${outboundOnLane}/${outboundTotal})`);
ok(approachTotal > 0 && approachOnLane === approachTotal, `every approach rides its port's entry lane (${approachOnLane}/${approachTotal})`);

/* ---- engagements ------------------------------------------------------- */
resetBattles(sim.skySeed);
let first = null;
for (let slot = 0; slot < 12 && !first; slot++) {
  for (let t = slot * ENG_SLOT; t < (slot + 1) * ENG_SLOT; t += 10) { const e = engagementAt(t, stations, currentSystem); if (e) { first = e; break; } }
}
ok(first, `an engagement rolls within the first dozen slots (${first?.id})`);
if (first) {
  const e = first;
  ok(e.wing.length >= 2 && e.wing.every((id) => traffic.find((n) => n.id === id)?.role === "pirate"), `a wing of ${e.wing.length} pirates`);
  ok(e.responders.length >= 1 && e.responders.every((id) => LAW_ROLES.has(traffic.find((n) => n.id === id)?.role)), "security responds");
  ok(["repelled", "lost", "broken"].includes(e.outcome), `outcome decided by the seed (${e.outcome})`);
  ok(e.secArrive > e.start && e.end > e.secArrive && e.downAt < e.end, "timeline is ordered");
  const victim = traffic.find((n) => n.id === e.victimId);
  const mid = (e.start + e.secArrive) / 2 + 5;
  const pv = poseAt(victim, mid, stations, currentSystem);
  ok(pv.job === "fleeing" && d3(pv, e.site) < 2000, `the victim runs from the site (${pv.job}, ${d3(pv, e.site).toFixed(0)} u)`);
  const pirate = traffic.find((n) => n.id === e.wing[0]);
  const pp = poseAt(pirate, mid, stations, currentSystem);
  ok(pp.job === "engaged" && d3(pp, pv) < 900, `pirates circle the victim (${d3(pp, pv).toFixed(0)} u)`);
  const law = traffic.find((n) => n.id === e.responders[0]);
  const plaw0 = poseAt(law, e.secArrive - 1, stations, currentSystem);
  const plaw1 = poseAt(law, e.secArrive + 30, stations, currentSystem);
  ok(plaw0.job !== "responding" && plaw0.job !== "engaged", "security is on its route before the call");
  ok(plaw1.job === "engaged" && d3(plaw1, e.site) < 3000, `security has closed on the site (${plaw1.job}, ${d3(plaw1, e.site).toFixed(0)} u)`);
  /* determinism: a second roll of the same slot is the same fight */
  resetBattles(sim.skySeed);
  const again = engagementAt(e.start + 1, stations, currentSystem);
  ok(again && again.id === e.id && again.outcome === e.outcome && again.downId === e.downId && d3(again.site, e.site) < 1e-6, "same seed, same ambush, same ending");
  /* after the end everyone slides back onto the timetable */
  const after = poseAt(victim, e.end + 60, stations, currentSystem);
  const route = routePose(victim, e.end + 60, stations, currentSystem);
  ok(e.outcome === "lost" || d3(after, route) < 1e-6 || !route.visible, "the victim is back on its route a minute after");

  /* the tick: tracers fly, the verdict lands, the player can join */
  const fired = [];
  sim.ship.pos.x = e.site.x + 50000; sim.ship.pos.y = e.site.y; sim.ship.pos.z = e.site.z;
  shots.length = 0;
  for (let t = e.start; t < e.start + 30; t += 1 / 30) { stepTraffic(t, 1 / 30, stations, currentSystem); stepBattles(t, 1 / 30, sim.ship.pos, (a, b, fac) => { fired.push(fac); npcTracer(a, b, fac); }, stations, currentSystem); }
  ok(fired.length > 10 && fired.every((f) => f.startsWith("npc")), `tracers fly between the fighters (${fired.length} in 30 s)`);
  ok(!engagementAt(e.start + 10, stations, currentSystem).joined, "50 km away is not in it");
  const before = shots.length;
  syncContacts(sim.ship, sim.remotes, () => "neutral", e.start + 30, 1 / 30);
  for (const c of contacts) c.hp = 1000;
  stepShots(sim.ship, 0.5, e.start + 30, () => ok(false, "an npc tracer killed something"));
  ok(contacts.filter((c) => c.kind === "npc").every((c) => c.hp === 1000), "npc tracers never damage contacts");
  ok(shots.length <= before, "tracers age out");
  ok(contacts.filter((c) => c.kind === "npc" && c.role === "pirate").every((c) => c.relation === "hostile"), "pirates are hostile contacts");
  ok(contacts.filter((c) => c.kind === "npc" && LAW_ROLES.has(c.role)).every((c) => c.relation === "ally"), "security and pickets are allies");
  sim.ship.pos.x = e.site.x + JOIN_R * 0.5; sim.ship.pos.y = e.site.y; sim.ship.pos.z = e.site.z;
  const cur = stepBattles(e.start + 31, 1 / 30, sim.ship.pos, null, stations, currentSystem);
  ok(cur && cur.id === e.id && cur.joined, "fly inside JOIN_R and you are in it");
  /* the player settles it */
  const saved = pirateKilled(e.wing[0], e.start + 35);
  ok(saved && saved.playerSaved && saved.outcome === "repelled" && saved.applied, "a pirate kill during the fight saves the victim");
  ok(engagements.length >= 1, "engagement log");
}

/* ---- lane-ways, zones, discipline -------------------------------------- */
ok(SUBLANES === 3 && Math.abs(subLaneOffset(0) + subLaneOffset(2)) < 1e-9 && subLaneOffset(1) === 0, "three lane-ways, centred");
ok(d3(f.farEntry, f.farExit) >= ZONE_HALF_W * 2 + 200, `entry and exit zones do not overlap past the funnel (${d3(f.farEntry, f.farExit).toFixed(0)} u apart)`);
{
  const ways = new Set(traffic.filter((n) => n.legs).map((n) => n.way));
  ok(ways.size === SUBLANES, `traffic spreads over all ${SUBLANES} lane-ways (${[...ways].sort().join(",")})`);
  const p = lanePoint(port, "exit", 0.4, {}, 2);
  const L = laneOf(port, p);
  ok(L?.which === "exit" && L.way === 2 && L.off < 1e-6, "a point on lane-way 3 of the exit lane reads back as such");
  ok(laneFlow("exit") === 1 && laneFlow("entry") === -1, "flow signs");
  /* wrong way: fly the exit corridor toward the clamps */
  const { stepTraffic: _st } = await import("../js/npc/traffic.js");
  sim.phase = "play";
  sim.ship.dockedAt = null;
  const q = lanePoint(port, "exit", 0.95, {}, 1);
  sim.ship.pos.x = q.x; sim.ship.pos.y = q.y; sim.ship.pos.z = q.z;
  sim.ship.vel.x = port.vx - f.dir.x * 20; sim.ship.vel.y = port.vy; sim.ship.vel.z = port.vz - f.dir.z * 20;
  sim.ship.tune.assistGain = 0; // pure momentum for the test
  const { tickSim } = await import("../js/sim.js");
  sim.toast = null;
  let warned = false;
  sim.ui.lanesDrawn = true;   // lane discipline only bites while the rigs are on the canopy
  for (let i = 0; i < 60 * 9; i++) { tickSim(1 / 60); if (sim.lane?.wrong && sim.toast && /control/.test(sim.toast)) warned = true; }
  ok(sim.lane?.which === "exit" && sim.lane.wrong, `flying the exit lane inbound reads WRONG WAY (${JSON.stringify(sim.lane && { which: sim.lane.which, way: sim.lane.way, wrong: sim.lane.wrong })})`);
  ok(warned, "port control warns after the grace period");
  sim.ship.vel.x = port.vx + f.dir.x * 30; sim.ship.vel.z = port.vz + f.dir.z * 30;
  for (let i = 0; i < 30; i++) tickSim(1 / 60);
  ok(sim.lane && !sim.lane.wrong && sim.lane.way === 2, "turn to the flow and the lane reads clean, way 2/3");
}

/* ---- the heartbeat ------------------------------------------------------ */
populateFlow(sim.skySeed, stations);
ok(flow.length >= stations.length * 3, `flow: ${flow.length} boats over ${stations.length} ports`);
ok(flow.every((n) => shipById(n.ship) && n.way < SUBLANES && n.period > 100 && n.manifest), "every boat has a registry hull, a lane-way, a period and a manifest");
{
  /* The invariant is that a port BREATHES: some boats are always out and the
   * whole fleet is never out at once. Expressing that as a proportion of the
   * fleet made it luck-dependent — a trough that was twenty boats out of a
   * hundred and sixty is nine out of forty-six, and nine lands a hair under a
   * 20 % floor without anything having changed about the cycle. Sample long
   * enough to see several periods, then assert the shape directly. */
  const busy = [];
  for (let t = 0; t < 2400; t += 5) { stepFlow(t, stations); busy.push(flow.filter((n) => n.visible).length); }
  const min = Math.min(...busy), max = Math.max(...busy);
  const mean = busy.reduce((a, b) => a + b, 0) / busy.length;
  ok(min >= 2, `the ports never go completely still (low-water mark ${min} of ${flow.length})`);
  ok(max <= flow.length * 0.8, `and never launch the whole fleet at once (high-water mark ${max} of ${flow.length})`);
  ok(mean > flow.length * 0.2 && mean < flow.length * 0.65, `the duty cycle sits where the timetable says: ${Math.round((mean / flow.length) * 100)}% up on average`);
  let onLane = 0, total = 0;
  for (let t = 0; t < 600; t += 7) {
    stepFlow(t, stations);
    for (const n of flow) {
      if (!n.visible) continue;
      total++;
      const st = stations.find((s) => s.id === n.port);
      /* 0.3.15: the first and last seconds of a run are flown inside the hangar, not on a lane */
      if (n.lane === "bay") { if (insideBay(st, n)) onLane++; continue; }
      const L = laneOf(st, n);
      if (L && L.which === n.lane && L.way === n.way) onLane++;
    }
  }
  ok(total > 50 && onLane === total, `every flow boat rides its own lane-way, or is inside the bay (${onLane}/${total})`);
  const p0 = portPulse(port.id);
  ok(typeof p0.inbound === "number" && typeof p0.outbound === "number", "port pulse counts in and out");
  const a = flowPose(flow[0], 333, stations, {}), b = flowPose(flow[0], 333, stations, {});
  ok(a.x === b.x && a.job === b.job, "flow pose is pure");
}

/* ---- the hull pool ------------------------------------------------------ */
{
  drainPool();
  const want = new Set(flow.map((n) => `${n.ship}:${n.variant}:${n.color}`));
  for (const n of flow) templateFor(n.ship, n.variant, n.color);
  ok(poolStats().pending === want.size && want.size <= flow.length * 0.6, `${want.size} templates cover ${flow.length} boats`);
  const t0 = Date.now();
  let built = 0;
  while (poolStats().pending) built += warm(4);
  ok(built === want.size, `pool forged ${built} templates in ${Date.now() - t0} ms`);
  const tpl = templateFor(flow[0].ship, flow[0].variant, flow[0].color);
  const i1 = instanceOf(tpl, 0.9), i2 = instanceOf(tpl, 1.1);
  const g1 = new Set(), g2 = new Set();
  i1.traverse((o) => { if (o.isMesh) g1.add(o.geometry); });
  i2.traverse((o) => { if (o.isMesh) g2.add(o.geometry); });
  ok([...g1].every((g) => g2.has(g)), "instances share every geometry");
  ok(i1.userData.plumes.length > 0 && i1.userData.plumes[0].material !== i2.userData.plumes[0].material, "but own their plume materials");
  ok(Math.abs(i1.scale.x / i2.scale.x - 0.9 / 1.1) < 1e-6, "scale jitter per instance");
  releaseInstance(i1); releaseInstance(i2);
  ok(tpl.group.userData.gen && tpl.group.userData.def, "the template keeps its own userData after cloning");
}

/* ---- pirates berth and sortie ------------------------------------------- */
{
  const holds = stations.filter((s) => s.sector === "pirate");
  const pirates = traffic.filter((n) => n.role === "pirate");
  if (holds.length) {
    ok(pirates.every((n) => n.legs && holds.some((h) => h.id === n.from)), "every pirate berths in a free port");
    const jobs = new Set();
    for (let t = 0; t < 2400; t += 6) for (const n of pirates) jobs.add(routePose(n, t, stations, currentSystem).job);
    ok(["docked", "outbound", "in lane", "approach", "lurking"].every((j) => jobs.has(j)), `a pirate's day: ${[...jobs].join(", ")}`);
  } else ok(pirates.every((n) => n.lurk), "no hold in this sky: pirates lurk");
  ok(CONTACT_R >= 40000, "contact radius");
}


/* ---- the yard: STATIONGEN ports, works, defences, the tractor ----------- */
{
  const { tickSim, toggleDock } = await import("../js/sim.js");
  const { stepStationWorks, stepProduction, stepDefences, stepStationDrones, worksFor, worksReport, tractor, engageTractor, releaseTractor, mouthAround, RECIPES, requestDock, clearDockRequest, dockRequest, unrequestedApproach, holdOff } = await import("../js/stationworks.js");
  const { mouthCoords, MOUNT_KINDS } = await import("../js/stationyard.js");
  ok(stations.every((s) => s.gen && s.gen.stats && s.port && s.hangars?.length >= 1), `every port in the sky is a built hull with a hangar (${stations.length} ports)`);
  ok(stations.every((s) => s.gen.root.scale.x < 1 && s.radius > 10), "hulls are scaled to the sim");
  const archs = new Set(stations.map((s) => s.gen.stats.archetype));
  ok(archs.size >= 3, `the sky grows several archetypes: ${[...archs].join(", ")}`);
  const mil = stations.find((s) => s.sector === "military");
  if (mil) ok(mil.gen.stats.archetype === "Military Bastion" && mil.mounts.some((m) => m.kind === "spinal") && mil.mounts.some((m) => m.kind === "dronebay"), "a military port is a bastion with a spinal gun and drone bays");
  ok(stations.every((s) => s.mounts.some((m) => m.kind === "pdc")), "no port is unarmed: every one has point defence");
  /* a tethered port turns its mouth away from its host */
  const teth = stations.find((s) => s.mount === "tethered");
  if (teth) {
    const { bodyById, bodyPosition } = await import("../js/bodies.js");
    const hp = bodyPosition(teth.hostId, sim.time, {});
    const away = { x: teth.x - hp.x, y: 0, z: teth.z - hp.z }; const L = Math.hypot(away.x, away.z) || 1;
    const dot = (teth.port.dir.x * away.x + teth.port.dir.z * away.z) / L / (Math.hypot(teth.port.dir.x, teth.port.dir.z) || 1);
    ok(dot > 0.95, `a tethered port's mouth faces away from its host (cos ${dot.toFixed(2)})`);
  }

  /* production: lines eat stock, magazines fill, a short line stalls and names the material */
  const armed = stations.find((s) => s.sector !== "pirate" && worksFor(s)?.needs.slug && worksFor(s).lines.munitions > 0) ?? stations.find((s) => worksFor(s)?.lines.munitions > 0);
  if (armed) {
    const w = worksFor(armed);
    w.stock.slug = 0;
    const steel = armed.stock.find((l) => l.id === "steel") ?? (armed.stock.push({ id: "steel", qty: 0, sell: 1 }), armed.stock[armed.stock.length - 1]);
    const ti = armed.stock.find((l) => l.id === "titanium") ?? (armed.stock.push({ id: "titanium", qty: 0, sell: 1 }), armed.stock[armed.stock.length - 1]);
    steel.qty = 50; ti.qty = 0;
    for (let i = 0; i < 60 * 30; i++) stepProduction(armed, 1 / 30, 1000 + i / 30);
    ok(w.stalls.slug && w.stalls.slug.need === "titanium" && w.stalled?.what === "slug", `the munitions line stalls short of titanium (${JSON.stringify(w.stalled)})`);
    ti.qty = 20;
    const s0 = steel.qty;
    for (let i = 0; i < 60 * 30; i++) stepProduction(armed, 1 / 30, 2000 + i / 30);
    ok(w.stock.slug > 0 && steel.qty < s0 && !w.stalls.slug, `sell it titanium and the line runs: ${w.stock.slug} slugs from ${(s0 - steel.qty).toFixed(1)} steel`);
    const R = worksReport(armed);
    ok(R && R.mags.some((m) => m.what === "slugs") && Object.keys(R.guns).length >= 1, "the works report reads magazines and guns");
  } else ok(false, "some port has a munitions line");

  /* defence: a port's guns take a hostile of the player's, not the player */
  const port2 = stations.find((s) => s.sector !== "pirate" && s.mounts.some((m) => m.kind === "rail" || m.kind === "pdc"));
  {
    const m = port2.mounts.find((x) => x.kind === "pdc") ?? port2.mounts[0];
    contacts.length = 0;
    const foe = { id: "test-pirate", kind: "npc", name: "Test pirate", relation: "hostile", hp: 60, shield: 0, radius: 6, x: port2.x + m.x + 300, y: port2.y + m.y, z: port2.z + m.z, vx: port2.vx, vy: port2.vy, vz: port2.vz };
    contacts.push(foe);
    sim.ship.pos.x = port2.x + 4000; sim.ship.pos.y = port2.y; sim.ship.pos.z = port2.z;
    shots.length = 0;
    for (let i = 0; i < 90; i++) stepDefences(port2, 1 / 30, 5000 + i / 30, sim.ship);
    ok(shots.some((s) => s.faction === "station"), `the port's mounts fire on a hostile (${shots.filter((s) => s.faction === "station").length} rounds, ${port2.guns.firing} mounts on it)`);
    ok(!shots.some((s) => s.faction === "hostile"), "and none at the player");
    let dead = null;
    /* How long a kill takes depends on how many mounts this port generated and
     * of what kind, which moves with the sky's seed. The contract is that the
     * rounds land and the hostile dies, not that it dies inside eight seconds —
     * so give it a window wide enough for the thinnest battery the generator
     * can produce, and let the assertion be about the outcome. */
    for (let i = 0; i < 30 * 60 && !dead; i++) { stepDefences(port2, 1 / 30, 6000 + i / 30, sim.ship); stepShots(sim.ship, 1 / 30, 6000 + i / 30, (c, sh) => { dead = { c, sh }; }); }
    ok(dead && dead.c.id === "test-pirate" && dead.sh.faction === "station", "and the rounds kill it");
    /* drones: a bay sends interceptors and gets them back */
    const bayPort = stations.find((s) => s.sector !== "pirate" && s.mounts.some((x) => x.kind === "dronebay"));
    if (bayPort) {
      contacts.length = 0;
      const w = worksFor(bayPort); w.stock.drone = Math.max(w.stock.drone, 6);
      const b = bayPort.mounts.find((x) => x.kind === "dronebay");
      const foe2 = { id: "test-pirate-2", kind: "npc", name: "Test pirate", relation: "hostile", hp: 1e9, shield: 0, radius: 6, x: bayPort.x + b.x + 1500, y: bayPort.y + b.y, z: bayPort.z + b.z, vx: bayPort.vx, vy: bayPort.vy, vz: bayPort.vz };
      contacts.push(foe2);
      const d0 = w.stock.drone;
      for (let i = 0; i < 30 * 6; i++) stepStationDrones(bayPort, 1 / 30, 7000 + i / 30, sim.ship);
      const out = contacts.filter((c) => c.kind === "sdrone");
      ok(out.length >= 2 && w.stock.drone < d0, `drone bays launch interceptors: ${out.length} out, ${w.stock.drone} left in the cells`);
      const gap0 = Math.hypot(out[0].x - foe2.x, out[0].y - foe2.y, out[0].z - foe2.z);
      for (let i = 0; i < 30 * 20; i++) stepStationDrones(bayPort, 1 / 30, 7006 + i / 30, sim.ship);
      const gap1 = Math.hypot(out[0].x - foe2.x, out[0].y - foe2.y, out[0].z - foe2.z);
      ok(gap1 < gap0 && shots.some((s) => s.faction === "station" && s.kind === "drone"), `drones close on the hostile (${gap0.toFixed(0)} → ${gap1.toFixed(0)} u) and shoot`);
      contacts.length = 0;
      /* Fly until they are actually back in the cells rather than budgeting a
       * flat minute for it. How long the trip home takes depends on how far the
       * chase carried them and where this port generated its bay — neither of
       * which this assertion is about. */
      let home = false;
      for (let i = 0; i < 30 * 600 && !home; i++) {
        stepStationDrones(bayPort, 1 / 30, 8000 + i / 30, sim.ship);
        home = !contacts.some((c) => c.kind === "sdrone") && w.stock.drone === d0;
      }
      ok(home, `with nothing to fight the drones come home (${w.stock.drone} of ${d0} in the cells)`);
    }
    contacts.length = 0; shots.length = 0;
  }
  /* a hostile free port turns its guns on you */
  const hold = stations.find((s) => s.sector === "pirate");
  if (hold) {
    shots.length = 0;
    const m = hold.mounts.find((x) => x.kind === "pdc") ?? hold.mounts[0];
    sim.ship.pos.x = hold.x + m.x + 400; sim.ship.pos.y = hold.y + m.y; sim.ship.pos.z = hold.z + m.z;
    for (let i = 0; i < 60; i++) stepDefences(hold, 1 / 30, 9000 + i / 30, sim.ship);
    ok(shots.some((s) => s.faction === "hostile"), "a hostile free port's guns fire on the player");
    shots.length = 0;
  }

  /* the tractor: a hull in the mouth with no berth is left alone (control hails it); with a berth it is taken */
  {
    const st = stations.find((s) => s.sector !== "pirate");
    const m = st.hangars[0];
    const park = () => {
      sim.ship.pos.x = st.x + m.x + m.dir.x * 10; sim.ship.pos.y = st.y + m.y + m.dir.y * 10; sim.ship.pos.z = st.z + m.z + m.dir.z * 10;
      sim.ship.vel.x = st.vx - m.dir.x * 6; sim.ship.vel.y = st.vy - m.dir.y * 6; sim.ship.vel.z = st.vz - m.dir.z * 6;
      sim.ship.tune.assistGain = 0; sim.ship.throttle = 0;
    };
    sim.ship.dockedAt = null; releaseTractor(); clearDockRequest(); holdOff(sim.time, 0);
    park();
    const hit = mouthAround(sim.ship);
    ok(hit && hit.st.id === st.id, `inside the aperture the port sees you (${hit && JSON.stringify({ along: +hit.c.along.toFixed(0), lat: +hit.c.lat.toFixed(0), vert: +hit.c.vert.toFixed(0) })})`);
    for (let i = 0; i < 30; i++) tickSim(1 / 30);
    ok(!tractor.active && !sim.ship.dockedAt, "no berth asked for: no tractor lock");
    const ap = unrequestedApproach(sim.ship, sim.time);
    ok(ap && ap.st.id === st.id && ap.where === "mouth" && sim.approach?.st.id === st.id, `…but port control wants a word (${ap?.where})`);
    /* REQUEST DOCK (comms or the DOCK button) files a berth; from then on the mouth or the entry lane takes you */
    requestDock(st, sim.time);
    park();
    tickSim(1 / 30);
    ok(tractor.active && tractor.stId === st.id && tractor.why === "flew in", `with a berth the mouth takes you (${tractor.T?.toFixed(1)} s pull)`);
    let ticks = 0;
    while (tractor.active && ticks < 30 * 60) { tickSim(1 / 30); ticks++; }
    ok(!tractor.active && sim.ship.dockedAt === st.id && !dockRequest.stId, `the tractor lands you on the clamps in ${(ticks / 30).toFixed(1)} s and the request is spent`);
    const c = mouthCoords(st, m, sim.ship.pos);
    ok(c.along < 0 && Math.abs(c.lat) < m.w * 0.5, `docked inside the bay (along ${c.along.toFixed(0)} u)`);
    /* undock: control pushes you out through the mouth and clear of the lane, then lets go; no re-lock */
    toggleDock();
    ok(!sim.ship.dockedAt && tractor.active && tractor.phase === "push", "undocking hands the helm to control for the push out");
    ticks = 0;
    while (tractor.active && ticks < 30 * 90) { tickSim(1 / 30); ticks++; }
    const c2 = mouthCoords(st, m, sim.ship.pos);
    const rv = { x: sim.ship.vel.x - st.vx, y: sim.ship.vel.y - st.vy, z: sim.ship.vel.z - st.vz };
    ok(!sim.ship.dockedAt && c2.along > m.d * 2 && rv.x * m.dir.x + rv.y * m.dir.y + rv.z * m.dir.z > 10, `released clear of the mouth (${c2.along.toFixed(0)} u out) with way on, in ${(ticks / 30).toFixed(1)} s`);
    for (let i = 0; i < 30 * 20; i++) tickSim(1 / 30);
    ok(!tractor.active && !sim.ship.dockedAt, "…and nothing re-docks you on the way out");
    /* the lane path: a berth filed from far out, then flying the entry lane into the funnel */
    holdOff(sim.time, 0);
    sim.ship.pos.x = st.x + m.x + m.dir.x * 2500; sim.ship.pos.y = st.y + m.y + m.dir.y * 2500 + 60; sim.ship.pos.z = st.z + m.z + m.dir.z * 2500;
    sim.ship.vel.x = st.vx; sim.ship.vel.y = st.vy; sim.ship.vel.z = st.vz;
    const took = toggleDock();
    ok(took && !tractor.active && dockRequest.stId === st.id, "DOCK from far out files a berth instead of a lock");
    const q = lanePoint(st, "entry", 0.2, {}, 1);
    sim.ship.pos.x = q.x; sim.ship.pos.y = q.y; sim.ship.pos.z = q.z;
    sim.ship.vel.x = st.vx - f.dir.x * 20; sim.ship.vel.y = st.vy - f.dir.y * 20; sim.ship.vel.z = st.vz - f.dir.z * 20;
    tickSim(1 / 30);
    ok(tractor.active && tractor.why === "lane", "on the entry lane inside the funnel the tractor reaches out");
    ticks = 0;
    while (tractor.active && ticks < 30 * 120) { tickSim(1 / 30); ticks++; }
    ok(sim.ship.dockedAt === st.id, `and walks you in from the lane (${(ticks / 30).toFixed(1)} s)`);
    toggleDock();
    while (tractor.active) tickSim(1 / 30);
    releaseTractor(); sim.ship.dockedAt = null; clearDockRequest();
  }

  /* the tick order: stations move to THIS tick's time before anything is glued to
   * them. stepStations used to run only inside stepWorld, at the END of the tick,
   * so clampDocked and the tractor snapped the ship to where the station was LAST
   * tick and stepWorld then moved the station out from under it — st.v × dt of
   * error, which at the browser's 0.1 s hitch clamp is a 10–30 u pop inside a
   * 20 u aperture (seen as smoke-docking's "push by the exit half" and hulls
   * clipping the bay on hitched frames). A docked hull rides the clamps exactly. */
  {
    const { stepStations } = await import("../js/stations.js");
    const st = stations.find((s) => s.sector !== "pirate");
    const spd = Math.hypot(st.vx, st.vy, st.vz);
    ok(spd * 0.1 > 1, `the station moves enough per hitched frame for the lag to matter (${(spd * 0.1).toFixed(1)} u per 0.1 s)`);
    sim.ship.dockedAt = st.id;
    sim.dockOffset = { x: st.hangars[0].berth.x, y: st.hangars[0].berth.y, z: st.hangars[0].berth.z };
    let worst = 0;
    for (let i = 0; i < 12; i++) {
      tickSim(0.1);                                  // the clamped hitch-frame dt
      const err = Math.hypot(sim.ship.pos.x - (st.x + sim.dockOffset.x), sim.ship.pos.y - (st.y + sim.dockOffset.y), sim.ship.pos.z - (st.z + sim.dockOffset.z));
      if (err > worst) worst = err;
    }
    ok(worst < 1e-6, `a docked hull sits on the clamps of the station's post-tick position, hitched frames included (worst ${worst.toFixed(3)} u off)`);
    sim.ship.dockedAt = null; sim.dockOffset = null;
    stepStations(sim.time);
  }

  /* one aperture, two doors: in by the port half, out by the starboard half; the push lets go up the
   * exit lane outside the tractor's reach, and the port leaves an outbound hull alone */
  {
    const { inDeparture, departure, PUSH_GRACE } = await import("../js/stationworks.js");
    const { TRACTOR_R } = await import("../js/stations.js");
    const { LANE_U, RELEASE_U, laneDistance, LANE_DRAW_R } = await import("../js/npc/lanes.js");
    const st = stations.find((s) => s.sector !== "pirate");
    const m = st.hangars[0];
    ok(m.entry && m.exit && m.berth && d3(m.entry, m.exit) > 2 && d3(m.entry, m.exit) < m.w, `every mouth has an entry door and an exit door (${d3(m.entry, m.exit).toFixed(1)} u apart)`);
    ok(RELEASE_U * LANE_U > TRACTOR_R * 1.2, `the release point (${RELEASE_U * LANE_U} u) is outside the tractor's reach (${TRACTOR_R} u)`);
    holdOff(sim.time, 0);
    sim.ship.tune.assistGain = 1;
    sim.ship.pos.x = st.x + m.x + m.dir.x * 60; sim.ship.pos.y = st.y + m.y + m.dir.y * 60; sim.ship.pos.z = st.z + m.z + m.dir.z * 60;
    sim.ship.vel.x = st.vx; sim.ship.vel.y = st.vy; sim.ship.vel.z = st.vz;
    ok(toggleDock() && tractor.active && tractor.phase === "pull", "DOCK inside the reach takes a lock");
    let inLat = null;
    for (let i = 0; tractor.active && i < 30 * 60; i++) { tickSim(1 / 30); const c = mouthCoords(st, m, sim.ship.pos); if (inLat == null && c.along < 0) inLat = c.lat; }
    ok(sim.ship.dockedAt === st.id && inLat != null && inLat < -m.w * 0.1, `the pull crosses the sill on the ENTRY side (lat ${inLat?.toFixed(1)} u)`);
    const cb = mouthCoords(st, m, sim.ship.pos);
    ok(cb.lat < 0, `the clamps are on the arrivals side of the bay (lat ${cb.lat.toFixed(1)} u)`);
    toggleDock();
    ok(tractor.active && tractor.phase === "push", "undock: the push");
    ok(!toggleDock() && tractor.active && tractor.phase === "push", "DOCK during the push does not wave control off");
    let outLat = null, wrong = false;
    for (let i = 0; tractor.active && i < 30 * 90; i++) { tickSim(1 / 30); const c = mouthCoords(st, m, sim.ship.pos); if (outLat == null && c.along > 0) outLat = c.lat; if (sim.lane?.wrong) wrong = true; }
    ok(outLat != null && outLat > m.w * 0.1, `the push crosses the sill on the EXIT side (lat ${outLat?.toFixed(1)} u)`);
    ok(!wrong, "no wrong-way call while control has the helm");
    const cr = mouthCoords(st, m, sim.ship.pos);
    const dm = Math.hypot(st.x + m.x - sim.ship.pos.x, st.y + m.y - sim.ship.pos.y, st.z + m.z - sim.ship.pos.z);
    ok(dm > TRACTOR_R && sim.lane?.which === "exit" && !sim.lane.wrong, `released ${dm.toFixed(0)} u off the mouth on the exit lane (along ${cr.along.toFixed(0)})`);
    ok(departure.stId === st.id && inDeparture(st, sim.ship, sim.time), "the port has you as outbound");
    /* flight assist brings a hands-off hull to a stop out there; the port still does not reach for it */
    for (let i = 0; i < 30 * (PUSH_GRACE + 5); i++) tickSim(1 / 30);
    const rv = Math.hypot(sim.ship.vel.x - st.vx, sim.ship.vel.y - st.vy, sim.ship.vel.z - st.vz);
    ok(!tractor.active && !sim.ship.dockedAt && !sim.approach, `hands off for ${PUSH_GRACE + 5} s: no lock, no lane hail (rel ${rv.toFixed(1)} u/s)`);
    /* a DOCK tap from the exit lane files a berth; it does not lock */
    sim.ship.pos.x = st.x + m.x + m.dir.x * 120; sim.ship.pos.y = st.y + m.y + m.dir.y * 120; sim.ship.pos.z = st.z + m.z + m.dir.z * 120;
    const q = lanePoint(st, "exit", 0.3, {}, 1); sim.ship.pos.x = q.x; sim.ship.pos.y = q.y; sim.ship.pos.z = q.z;
    sim.ship.vel.x = st.vx + f.dir.x * 10; sim.ship.vel.y = st.vy + f.dir.y * 10; sim.ship.vel.z = st.vz + f.dir.z * 10;
    tickSim(1 / 30);
    ok(inDeparture(st, sim.ship, sim.time), "still outbound: riding the exit lane after the clock runs out");
    ok(toggleDock() && !tractor.active && dockRequest.stId === st.id, "DOCK from the exit lane files a berth, no lock");
    /* come round onto the entry lane inbound and the berth is honoured */
    const e = lanePoint(st, "entry", 0.3, {}, 1); sim.ship.pos.x = e.x; sim.ship.pos.y = e.y; sim.ship.pos.z = e.z;
    sim.ship.vel.x = st.vx - f.dir.x * 15; sim.ship.vel.y = st.vy - f.dir.y * 15; sim.ship.vel.z = st.vz - f.dir.z * 15;
    tickSim(1 / 30);
    ok(tractor.active && tractor.why === "lane", "…and the entry lane takes you in");
    while (tractor.active) tickSim(1 / 30);
    ok(sim.ship.dockedAt === st.id, "docked again by the entry door");
    toggleDock(); while (tractor.active) tickSim(1 / 30);
    releaseTractor(); sim.ship.dockedAt = null; clearDockRequest(); holdOff(sim.time, 0);
    /* the rig is drawn only near the lane itself */
    const on = lanePoint(st, "exit", 0.8), X = LANE_DRAW_R + f.gap + ZONE_HALF_W + 300, off = { x: st.x + f.side.x * X, y: st.y + f.side.y * X, z: st.z + f.side.z * X };
    ok(laneDistance(st, on) === 0 && laneDistance(st, off) > LANE_DRAW_R, `lane distance: ${laneDistance(st, on).toFixed(0)} u on it, ${laneDistance(st, off).toFixed(0)} u well off it`);
  }
}

/* ---- a world that was broken up stops holding the core ----------------------
 * Reported from play: a planet was shattered and its gravity well went on
 * blocking warp from as far out as it ever had. `mu` was cut on the shatter
 * but nothing else was — the SoI that picks the local frame, the solver's
 * well cutoff and the warp block's radii floor were all still measured
 * against the planet that used to be there.
 */
{
  const b = BODIES.find((x) => x.kind !== "star" && !x.shattered && (x.radius ?? 0) > 600);
  ok(Boolean(b), "there is a world big enough to break");
  const was = { edge: wellEdge(b), well: b.well, soi: b.soi, mass: b.mass, mu: b.mu, r: b.radius };
  ok(was.edge > 0 && was.soi > 0, `${b.name} intact: warp blocked to ${(was.edge / was.r).toFixed(1)} radii`);

  b.shattered = true;
  b.integrity = 0;
  refreshBody(b);

  ok(remnantRadius(b) === b.radius * 0.4, "the remnant is the 0.4 radii the canopy already drew");
  ok(Math.abs(b.mu / was.mu - SHATTERED_MU) < 1e-6, "mu is what is left of it");
  ok(Math.abs(b.mass / was.mass - SHATTERED_MU) < 1e-6, "and so is the mass index — that was the missing half");
  ok(b.soi < was.soi * 0.8, `the local frame no longer reaches as far (SoI ${Math.round(was.soi)} → ${Math.round(b.soi)} u)`);
  ok(b.well < was.well * 0.5, `nor does the solver's well (${Math.round(was.well)} → ${Math.round(b.well)} u)`);
  const edge = wellEdge(b);
  ok(edge < was.edge * 0.75, `and warp is clear far sooner (${Math.round(was.edge)} → ${Math.round(edge)} u)`);
  ok(edge / was.r < 4, `in the radii the planet used to have: ${(was.edge / was.r).toFixed(1)} → ${(edge / was.r).toFixed(1)}`);
  ok(edge >= remnantRadius(b) * WARP.wellClear - 1e-6, "but a rubble field still holds the core for its own first few radii");

  /* and an intact world is untouched by any of it */
  const c = BODIES.find((x) => x.kind !== "star" && !x.shattered && x.id !== b.id);
  ok(Math.abs(wellEdge(c) - Math.max(c.radius * WARP.wellClear, Math.min(c.radius * WARP.wellFar, Math.sqrt(c.mu / WARP.wellG)))) < 1e-6,
    `an intact world blocks exactly as it always did (${c.name}, ${(wellEdge(c) / c.radius).toFixed(1)} radii)`);
  ok(Math.abs(wellRadius(c) - c.well) < 1e-6, "and its solver well is unchanged");

  b.shattered = false;
  b.integrity = 1;
  refreshBody(b);
}

console.log(`sky: ${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
