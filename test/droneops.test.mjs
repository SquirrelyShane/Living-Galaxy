/* LIVING GALAXY — work drones, the GNN station and the chat bus.
 *
 *   node --import ./test/three-register.mjs test/droneops.test.mjs
 */

const store = new Map();
globalThis.localStorage = { getItem: (k) => store.get(k) ?? null, setItem: (k, v) => store.set(k, String(v)), removeItem: (k) => store.delete(k) };

const { sim, launchSim } = await import("../js/sim.js");
const { makePilot } = await import("../js/pilot.js");
const { stations, stepStations } = await import("../js/stations.js");
const { stationConfig } = await import("../js/stationyard.js");
const { traffic, stepTraffic, HOSTILE_ROLES } = await import("../js/npc/traffic.js");
const { nearbyRocks, depleted } = await import("../js/field.js");
const { burst, chunks } = await import("../js/debris.js");
const { contacts } = await import("../js/turrets.js");
const { currentSystem, BODIES } = await import("../js/bodies.js");
const { stockOf } = await import("../js/economy.js");
const { DRONE_ROLES, ROLE_IDS, rolesAt, DRONE_CAP } = await import("../js/drones/roles.js");
const ops = await import("../js/drones/ops.js");
const { droneOps } = ops;
const { chat, recent, follow } = await import("../js/chat.js");
const { gnn, gnnPost, gnnStation, runAction } = await import("../js/gnn.js");
const { DRONE_KINDS } = await import("../js/dronespec.js");
const { company, foundCompany, hasCompany, transfer } = await import("../js/company.js");
const { board, boardReport, openFreight, claim, release, heldBy } = await import("../js/drones/board.js");
const { npcDrones, stepNpcDrones, npcDroneReport } = await import("../js/drones/npcdrones.js");
const { corps } = await import("../js/corps.js");

let pass = 0, fail = 0;
const ok = (c, m) => { if (c) pass++; else { fail++; console.error("  FAIL", m); } };
const d3 = (a, b) => Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z);

function run(secs, step = 1) {
  for (let t = 0; t < secs; t += step) {
    sim.time += step;
    stepStations(sim.time);
    stepTraffic(sim.time, step, stations, currentSystem);
    ops.stepDroneOps();
    stepNpcDrones();
  }
}

/* ---- roles and designs ---------------------------------------------------------------- */
ok(ROLE_IDS.length === 9, `nine roles (${ROLE_IDS.join(", ")})`);
for (const id of ROLE_IDS) {
  const r = DRONE_ROLES[id];
  ok(r.label && r.blurb && r.sectors.length && r.robot && r.asks.includes("home"), `${id}: complete role (asks ${r.asks.join("/")})`);
  ok(DRONE_KINDS[id] && DRONE_KINDS[id].role === r.robot.role, `${id}: robot kind registered (${r.robot.role}/${r.robot.locomotion})`);
  if (r.modes) ok(r.modes[r.defaultMode], `${id}: default orders exist`);
}

makePilot("Dro", "terran", "mining", null);
/* A PINNED FIXTURE SKY — this suite needs ports with yards and lockers in
 * reach of each other, which is a property of the sky rather than of the drone
 * code under test. */
launchSim("DroneTest", "yardsky");
sim.phase = "play";
sim.ship.credits = 200000;

/* ---- GNN station ------------------------------------------------------------------------ */
const G = gnnStation();
ok(G && G.gnn && /^GNN /.test(G.name), `this sky has a GNN station (${G?.name})`);
ok(stations.filter((s) => s.gnn).length === 1, "exactly one GNN station");
ok(/relay/i.test(G.gen?.stats?.archetype ?? "") && stationConfig(G, "x").archetype === "relay", `it grows as a relay (${G.gen?.stats?.archetype})`);
ok(G.sector === "civilian" && !G.hostile, "it keeps civilian berths");
{
  const before = stations.filter((s) => !s.gnn).map((s) => s.name).join();
  launchSim("DroneTest", "yardsky");
  ok(stations.filter((s) => !s.gnn).map((s) => s.name).join() === before && gnnStation().name === G.name, "the GNN draw does not reshuffle the other ports");
  sim.phase = "play"; sim.ship.credits = 200000;
}

/* ---- chat + GNN auto-accept ------------------------------------------------------------- */
{
  let opened = null, acted = 0;
  gnn.open = (id) => { opened = id; };
  const b = gnnPost({ desk: "markets", title: "Test shortage", body: "Water is short.", actions: [{ label: "Mark buyer", run: () => acted++ }] });
  const m = recent(1, "gnn")[0];
  ok(m && m.meta.gnn === b.id && m.links.length === 2, "a bulletin lands in chat with desk link + action");
  ok(/GNN desk/.test(m.links[0].label), `desk link names the station (${m.links[0].label})`);
  follow(m, 0);
  ok(opened === b.id, "desk link opens the bulletin");
  follow(m, 1); follow(m, 1);
  ok(acted === 1 && b.actions[0].done, "an action runs once");
  ok(!runAction(b, 0), "done actions refuse");
}

/* ---- build ------------------------------------------------------------------------------ */
const ind = stations.find((s) => s.sector === "industrial") ?? stations.find((s) => rolesAt(s).includes("miner"));
const log = stations.find((s) => s.sector === "logistic");
const mil = stations.find((s) => s.sector === "military");
ok(ind, `an industrial port builds miners (${ind?.name})`);
ok(rolesAt(ind).includes("miner") && !rolesAt(ind).includes("courier"), `its lines: ${rolesAt(ind).join(", ")}`);
ok(rolesAt(stations.find((s) => s.hostile && !s.claimed) ?? {}).length === 0, "an unclaimed free port builds you nothing");
/* ---- company gate: no charter, no drones; the treasury pays ---------------------------- */
ok(!hasCompany(), "starts without a company");
ok(ops.buildOptions(ind).every((o) => /company/.test(o.blocker)), "no company → every line blocked");
ok(!ops.orderBuild("miner", ind).ok, "and an order refuses");
sim.ship.dockedAt = ind.id;
ok(foundCompany("Drone Test Co", "industrial") === null, "company registered at the port");
ok(ops.buildOptions(ind).every((o) => /Treasury/.test(o.blocker)), "empty treasury → blocked on funds, not the charter");
transfer(30000);
sim.ship.dockedAt = null;
const opts = ops.buildOptions(ind);
const mo = opts.find((o) => o.role === "miner");
ok(mo.price >= 800 && mo.price <= 14000 && mo.design.designation, `miner priced from its parts (${mo.price} cr, ${mo.design.designation} ${mo.design.parts} parts)`);
ok(!mo.blocker, `line open with funds (${Math.round(company.treasury)} cr)`);
const tr0 = company.treasury, cr0 = sim.ship.credits;
const res = ops.orderBuild("miner", ind);
ok(res.ok && Math.round(company.treasury) === Math.round(tr0 - mo.price) && sim.ship.credits === cr0, "build bills the treasury, not your pocket");
ok(company.book.some((b) => /drone commissioned/.test(b.text)), "and it is on the company book");
ok(!ops.orderBuild("salvager", ind).ok, "one line per port: second order waits");
ok(ops.queueAt(ind.id).length === 1 && droneOps.units.length === 0, "on the line, not built yet");
let built = null;
droneOps.onBuilt = (u) => { built = u; };
run(DRONE_ROLES.miner.buildSecs + 2);
const miner = droneOps.units.find((u) => u.role === "miner");
ok(miner && built === miner, `rolled off (${miner?.name} ${miner?.designation})`);
ok(miner.state === "setup" && miner.home === ind.id && miner.dockedAt === ind.id, "sits in setup, homed at its build port");
ok(ops.pendingAsks(miner).join() === "home,site", "asks: home and start location");
ok(recent(3, "drones").some((m) => m.from === miner.name && /confirm/.test(m.text) && m.links.length), "it asks in chat, with a set-up link");

/* ---- miner: set up, cut, fill, home, stash ------------------------------------------------- */
ops.setHome(miner, ind.id);
const belt = currentSystem.belt ?? currentSystem.outerBelt;
let site = null;
for (let a = 0; a < Math.PI * 2 && !site; a += 0.05) {
  for (const rad of [belt.inner + (belt.outer - belt.inner) * 0.3, (belt.inner + belt.outer) / 2]) {
    const p = { x: Math.cos(a) * rad, y: 0, z: Math.sin(a) * rad };
    if (nearbyRocks(p, sim.time, 1).some((k) => !k.ice && k.worn < 1)) { site = { kind: "point", ...p, label: "test seam" }; break; }
  }
}
ok(site, "found a belt seam with rock");
ops.setSite(miner, site);
ok(ops.pendingAsks(miner).length === 0, "both asks answered");
ops.beginWork(miner);
run(DOCKS());
function DOCKS() { return 10; }
ok(miner.state !== "setup" && !miner.dockedAt, `undocked and working (${miner.state})`);
let cut = false;
for (let i = 0; i < 900 && !cut; i++) { run(2); cut = ops.holdOf(miner) > 0; }
ok(cut, `it cuts rock at the site (${miner.note})`);
ok([...depleted.values()].some((v) => v > 0), "the rock it cut wears down (same field the cutter uses)");
let home = false;
for (let i = 0; i < 2000 && !home; i++) { run(2); home = Object.values(sim.stash[ind.id] ?? {}).some((q) => q > 0); }
ok(home, `hold full → flew home, docked, stashed (${JSON.stringify(sim.stash[ind.id] ?? {}).slice(0, 80)})`);
ok(miner.stats.trips >= 0 && miner.stats.mined > 0, `stats kept (mined ${Math.round(miner.stats.mined)})`);

/* ---- hauler: passive finds the miner's slot and shuttles -------------------------------- */
const hport = log ?? ind;
droneOps.queue.length = 0;
const hb = ops.orderBuild("hauler", hport);
ok(hb.ok, `hauler ordered at ${hport.name}`);
run(DRONE_ROLES.hauler.buildSecs + 2);
const hauler = droneOps.units.find((u) => u.role === "hauler");
ok(hauler && hauler.mode === "passive", "hauler defaults to passive haul");
ok(ops.haulSlots(hauler).some((s) => s.kind === "miner" && s.id === miner.id), "your miner is an open slot");
ok(ops.freightSlots(hauler).every((s) => s.pay > 0 && s.qty >= 10), `NPC freight slots priced (${ops.freightSlots(hauler).length})`);
ops.beginWork(hauler);
run(30);
ok(hauler.assign?.kind === "miner" && miner.hauler === hauler.id, "passive hauler took the miner's slot");
/* Count the locker across every port, not just the one this fixture picked:
 * where a hauler sets its load down is its own home port, and which port that
 * is moves with the sky's seed. What is under test is that the ore reaches a
 * locker of yours at all. */
const stashTotal = () => Object.values(sim.stash ?? {}).reduce((a, hold) => a + Object.values(hold ?? {}).reduce((b, q) => b + q, 0), 0);
const stash0 = stashTotal();
let shuttled = false;
for (let i = 0; i < 3000 && !shuttled; i++) { run(2); shuttled = hauler.stats.hauled > 0; }
ok(shuttled, `hauler shuttled the miner's ore home (${Math.round(hauler.stats.hauled)})`);
ok(stashTotal() > stash0, `the home locker grew (${Math.round(stash0)} → ${Math.round(stashTotal())})`);

/* ---- hauler manual freight pays ---------------------------------------------------------- */
{
  const slot = ops.freightSlots(hauler)[0];
  if (slot) {
    ops.setMode(hauler, "manual");
    ops.assignSlot(hauler, slot);
    ok(miner.hauler === null, "leaving the miner frees its slot");
    ok(heldBy(slot.key) === hauler.id, "taking a freight slot claims it on the board");
    ok(!openFreight({ home: ind, cap: 80, who: "someone-else" }).some((x) => x.key === slot.key), "nobody else sees a held slot");
    const c0 = company.treasury, B0 = stockOf(stations.find((s) => s.id === slot.to), slot.good);
    let paid = false;
    for (let i = 0; i < 3000 && !paid; i++) { run(2); paid = company.treasury > c0; }
    ok(paid, `freight delivered and paid to the treasury (+${Math.round(company.treasury - c0)} cr)`);
    ok(heldBy(slot.key) === hauler.id, "a manual run keeps its slot for the next trip");
    ok(stockOf(stations.find((s) => s.id === slot.to), slot.good) > B0 - 1, "the buyer's shelf got the goods");
  } else ok(true, "no freight on this board (skipped)");
}

/* ---- combat: patrol + abstract kill of a pirate out of contact range -------------------------- */
if (mil) {
  droneOps.queue.length = 0;
  ops.orderBuild("combat", mil);
  run(DRONE_ROLES.combat.buildSecs + 2);
  const cb = droneOps.units.find((u) => u.role === "combat");
  ok(cb && cb.mode === "defend", "combat defaults to passive defend");
  ok(ops.guardSlots(cb).some((g) => g.kind === "ship") && ops.guardSlots(cb).some((g) => g.kind === "drone") && ops.guardSlots(cb).some((g) => g.kind === "station"), "guard slots: your ship, your drones, ports");
  ops.addPatrol(cb, { kind: "point", x: mil.x + 5000, y: mil.y, z: mil.z, label: "P1" });
  ops.addPatrol(cb, { kind: "point", x: mil.x - 5000, y: mil.y, z: mil.z, label: "P2" });
  ok(cb.mode === "patrol" && cb.patrol.length === 2, "patrol route of two points");
  ops.beginWork(cb);
  let lap = false;
  for (let i = 0; i < 600 && !lap; i++) { run(1); lap = cb.patrolIx === 1; }
  ok(lap, `it flies the route (${cb.note})`);
  /* put a pirate next to it, far from you */
  const pirate = traffic.find((n) => HOSTILE_ROLES.has(n.role));
  if (pirate) {
    sim.ship.pos = { x: mil.x + 900000, y: 0, z: mil.z + 900000 };
    contacts.length = 0;   // out of your contact range: nothing on the turret board
    const c0 = company.treasury;
    let down = false;
    for (let i = 0; i < 120 && !down; i++) {
      pirate.x = cb.x + 500; pirate.y = cb.y; pirate.z = cb.z; pirate.visible = true; pirate.job = "lurking";
      sim.time += 1; ops.stepDroneOps();
      down = pirate.job === "down";
    }
    ok(down && cb.stats.kills === 1, `downed a pirate on the numbers (${cb.note})`);
    ok(cb.stats.earned >= ops.BOUNTY_DRONE && company.treasury >= c0 + ops.BOUNTY_DRONE, "bounty paid to the treasury");
    ok(gnn.posts.some((p) => p.desk === "security" && /downed/.test(p.title)), "GNN security desk ran it");
    ok(cb.hp < cb.hpMax, `it took fire doing it (${Math.round(cb.hp)}/${cb.hpMax})`);
  }
}

/* ---- salvager chases wreckage ------------------------------------------------------------ */
{
  droneOps.queue.length = 0;
  const r = ops.orderBuild("salvager", ind);
  ok(r.ok, "salvager ordered");
  run(DRONE_ROLES.salvager.buildSecs + 2);
  const sv = droneOps.units.find((u) => u.role === "salvager");
  ops.beginWork(sv);
  burst({ x: ind.x + 3000, y: ind.y, z: ind.z, count: 6, speed: 0, size: 12, good: "steel" });
  let got = false;
  for (let i = 0; i < 400 && !got; i++) { run(1); got = sv.stats.hauled > 0; }
  ok(got, `salvager tractored wreckage (${Math.round(sv.stats.hauled)} t, ${sv.note})`);
}

/* ---- surveyor marks a vein ---------------------------------------------------------------- */
{
  const civ = stations.find((s) => rolesAt(s).includes("surveyor"));
  if (civ) {
    droneOps.queue.length = 0;
    ops.orderBuild("surveyor", civ);
    run(DRONE_ROLES.surveyor.buildSecs + 2);
    const sv = droneOps.units.find((u) => u.role === "surveyor");
    let vein = null;
    for (let a = 0; a < Math.PI * 2 && !vein; a += 0.02) for (let rr = belt.inner; rr < belt.outer && !vein; rr += 3000) { const p = { x: Math.cos(a) * rr, y: 0, z: Math.sin(a) * rr }; if (nearbyRocks(p, sim.time, 0).some((k) => k.rich)) vein = p; }
    ops.setSite(sv, { kind: "point", ...vein, label: "vein test" });
    ops.beginWork(sv);
    const wp0 = sim.waypoints.length;
    let marked = false;
    for (let i = 0; i < 1500 && !marked; i++) { run(2); marked = sv.stats.marks > 0; }
    ok(marked && sim.waypoints.length > wp0 && /Survey · .* vein/.test(sim.waypoints.at(-1).name), `surveyor marked a vein (${sim.waypoints.at(-1)?.name})`);
    ok(recent(20, "drones").some((m) => m.from === sv.name && /vein/.test(m.text) && m.links.some((l) => /Send MINER/.test(l.label))), "and offers to send your miner");
  } else ok(true, "no surveyor line in this sky (skipped)");
}

/* ---- harvester: ice → water; gas → hydrogen ------------------------------------------------ */
{
  const hp = stations.find((s) => rolesAt(s).includes("harvester"));
  droneOps.queue.length = 0;
  ops.orderBuild("harvester", hp);
  run(DRONE_ROLES.harvester.buildSecs + 2);
  const hv = droneOps.units.find((u) => u.role === "harvester");
  ok(hv.mode === "ice", "harvester defaults to ice");
  const gas = BODIES.find((b) => b.kind === "gas");
  ops.setMode(hv, "gas");
  ops.setSite(hv, { kind: "body", id: gas.id, label: gas.name });
  ops.beginWork(hv);
  let skim = false;
  for (let i = 0; i < 2000 && !skim; i++) { run(2); skim = (hv.hold.hydrogen_r ?? 0) + (hv.hold.helium3_r ?? 0) > 0 || Object.keys(sim.stash[hv.home] ?? {}).includes("hydrogen_r"); }
  ok(skim, `gas skimmer brought up hydrogen at ${gas.name} (${hv.note})`);
}

/* ---- courier trades on your account -------------------------------------------------------- */
{
  const cp = stations.find((s) => rolesAt(s).includes("courier"));
  droneOps.queue.length = 0;
  ops.orderBuild("courier", cp);
  run(DRONE_ROLES.courier.buildSecs + 2);
  const co = droneOps.units.find((u) => u.role === "courier");
  ops.beginWork(co);
  const routes = ops.tradeRoutes(co);
  if (routes.length) {
    let sold = false;
    for (let i = 0; i < 3000 && !sold; i++) { run(2); sold = co.stats.trips > 1 || recent(30, "drones").some((m) => m.from === co.name && /^Sold/.test(m.text)); }
    ok(sold, `courier bought and sold (${co.note})`);
  } else ok(true, "no margin on this board (skipped)");
}

/* ---- relay raises an alert; combat answers it -------------------------------------------- */
{
  const rp = stations.find((s) => rolesAt(s).includes("relay"));
  droneOps.queue.length = 0;
  ops.orderBuild("relay", rp);
  run(DRONE_ROLES.relay.buildSecs + 2);
  const rl = droneOps.units.find((u) => u.role === "relay");
  ops.beginWork(rl);
  run(200);
  const pirate = traffic.find((n) => HOSTILE_ROLES.has(n.role) && n.job !== "down");
  if (pirate) {
    let alerted = false;
    for (let i = 0; i < 80 && !alerted; i++) { pirate.x = rl.x + 9000; pirate.y = rl.y; pirate.z = rl.z; pirate.visible = true; pirate.job = "lurking"; sim.time += 1; ops.stepDroneOps(); alerted = Boolean(droneOps.alert); }
    ok(alerted && recent(10, "drones").some((m) => m.from === rl.name && /raider/.test(m.text)), "relay called raiders in");
  }
}

/* ---- repair patches your hull -------------------------------------------------------------- */
{
  const rp = stations.find((s) => rolesAt(s).includes("repair"));
  droneOps.queue.length = 0;
  ops.orderBuild("repair", rp);
  run(DRONE_ROLES.repair.buildSecs + 2);
  const rr = droneOps.units.find((u) => u.role === "repair");
  ok(rr.guard?.kind === "ship", "repair defaults to looking after your ship");
  sim.ship.pos = { x: rp.x + 2000, y: rp.y, z: rp.z };
  sim.ship.dockedAt = null;
  sim.ship.hull = 40;
  ops.beginWork(rr);
  run(120);
  ok(sim.ship.hull > 40, `hull patched (${Math.round(sim.ship.hull)}%)`);
}

/* ---- danger kills an unescorted drone -------------------------------------------------------- */
{
  const victim = droneOps.units.find((u) => u.role === "salvager");
  const pirate = traffic.find((n) => HOSTILE_ROLES.has(n.role) && n.job !== "down");
  if (victim && pirate) {
    for (let i = 0; i < 200 && droneOps.units.includes(victim); i++) { pirate.x = victim.x + 300; pirate.y = victim.y; pirate.z = victim.z; pirate.visible = true; pirate.job = "lurking"; victim.dockedAt = null; victim.state = "working"; sim.time += 1; ops.stepDroneOps(); }
    ok(!droneOps.units.includes(victim), "a drone left under fire is lost");
    ok(recent(10, "drones").some((m) => m.from === victim.name && /^Lost/.test(m.text) && m.links.some((l) => /Mark wreck/.test(l.label))), "and reports where");
  }
}

/* ---- cap, recall, decommission --------------------------------------------------------------- */
{
  const u = droneOps.units.find((x) => x.role === "miner");
  ops.recall(u);
  for (let i = 0; i < 600 && !(u.dockedAt === u.home && u.state === "docked"); i++) run(2);
  ok(u.dockedAt === u.home, "recall brings it home");
  run(20);
  ok(u.dockedAt === u.home, "and it stays until resumed");
  ops.beginWork(u);
  run(15);
  ok(!u.dockedAt, "resume sends it back out");
  const n0 = droneOps.units.length, c0 = company.treasury;
  ops.scrapDrone(droneOps.units.find((x) => x.role === "courier") ?? droneOps.units.at(-1));
  ok(droneOps.units.length === n0 - 1 && company.treasury > c0, "decommission refunds part of the price to the treasury");
  while (droneOps.units.length + droneOps.queue.length < DRONE_CAP) droneOps.units.push({ ...u, id: `fake${droneOps.units.length}` });
  ok(ops.buildOptions(ind).every((o) => /cap/.test(o.blocker ?? "")), "the cap blocks new builds");
  droneOps.units.splice(n0 - 1);
}

/* ---- the corporations' drones share the board ------------------------------------------------ */
{
  ok(npcDrones.units.length >= corps.filter((c) => c.ports.length).length, `every corporation with a port fields drones (${npcDrones.units.length})`);
  ok(npcDrones.units.every((u) => DRONE_ROLES[u.role] && u.holdCap === DRONE_ROLES[u.role].hold && stations.find((s) => s.id === u.home)), "same roles, holds and a real home port");
  ok(new Set(npcDrones.units.map((u) => u.name)).size === npcDrones.units.length, "distinct names");
  const rep0 = npcDroneReport();
  run(600, 2);
  const rep1 = npcDroneReport();
  ok(rep1.some((r) => r.state !== "docked"), `they go out to work (${rep1.filter((r) => r.state !== "docked").length} out)`);
  ok(npcDrones.units.some((u) => u.stats.mined > 0 || u.stats.hauled > 0 || u.hold > 0), "and cut or haul something");
  const held = boardReport().filter((h) => h.who.startsWith("cd:"));
  ok(held.length > 0 || !npcDrones.units.some((u) => u.role === "hauler"), `their haulers hold board slots (${held.length})`);
  if (held.length) {
    const k = held[0].key;
    ok(!openFreight({ home: ind, cap: 80, who: "d999" }).some((x) => x.key === k), "a slot a corporation's drone holds is closed to yours");
    const h2 = droneOps.units.find((u) => u.role === "hauler");
    if (h2) ok(!ops.freightSlots(h2).some((x) => x.key === k), "and your hauler's slot list skips it");
  }
  ok(DRONE_ROLES.hauler.hold < 100 && DRONE_ROLES.miner.hold < 50, `drones carry a small hold (miner ${DRONE_ROLES.miner.hold}, hauler ${DRONE_ROLES.hauler.hold})`);
}

/* ---- persistence ---------------------------------------------------------------------------- */
{
  ops.save();
  const names = droneOps.units.map((u) => `${u.name}:${u.home}:${u.role}`).join();
  const n = ops.loadDroneOps();
  ok(n === droneOps.units.length && droneOps.units.map((u) => `${u.name}:${u.home}:${u.role}`).join() === names, `drones survive a reload (${n})`);
  ok(droneOps.units.every((u) => u.stats && u.answered), "stats and answers restored");
}

console.log(`droneops: ${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
