/* LIVING GALAXY — 0.3.59: a port's drones are its guards and its repair crew;
 * ships are the long game.
 *
 *   the line: at most DRONE_LINE.deliveryCap delivery haulers in a whole sky;
 *     honest ports field miners, guards and repair drones; your drones untouched
 *   guards: a rogue drone inside a port's reach gets rounds, and the kill is the port's
 *   repair: your hull near a port, out of a fight, gets patched — not mid-fight,
 *     not by a port that does not like you
 *   prices: each hull tier climbs faster than the one below
 *
 *   node --import ./test/three-register.mjs test/portdrones.test.mjs
 */
const store = new Map();
globalThis.localStorage = { getItem: (k) => store.get(k) ?? null, setItem: (k, v) => store.set(k, String(v)), removeItem: (k) => store.delete(k) };

import { sim, launchSim, tickSim, relationOf } from "../js/sim.js";
import { makePilot } from "../js/pilot.js";
import { stationById, stepStations } from "../js/stations.js";
import { corps, corpById } from "../js/corps.js";
import { npcDrones, stepNpcDrones, populateNpcDrones, DRONE_LINE, npcDroneHooks } from "../js/drones/npcdrones.js";
import { DRONE_CAP } from "../js/drones/roles.js";
import { contacts, shots, stepShots, syncContacts } from "../js/turrets.js";
import { hullMaxOf } from "../js/repair.js";
import { SHIP_DB } from "../js/shipdb.js";
import { yardQuote, TIER_SCALE } from "../js/shipcost.js";

let pass = 0, fail = 0;
const ok = (c, m) => { if (c) { pass++; if (process.env.V) console.log("  ok", m); } else { fail++; console.error("  FAIL", m); } };

makePilot("PORT", "terran", "security", null);
launchSim("PortDrones", "sol");
sim.phase = "play";
tickSim(1 / 60);
const ship = sim.ship;
stepNpcDrones();

/* ---- 1. the line ------------------------------------------------------------------------ */
{
  const byRole = (r) => npcDrones.units.filter((u) => u.role === r);
  ok(byRole("hauler").length <= DRONE_LINE.deliveryCap, `delivery haulers in the whole sky: ${byRole("hauler").length} (cap ${DRONE_LINE.deliveryCap})`);
  for (const seed of ["alpha", "beta", "gamma", "delta"]) {
    const units = populateNpcDrones(seed);
    ok(units.filter((u) => u.role === "hauler").length <= DRONE_LINE.deliveryCap, `…in sky "${seed}" too (${units.filter((u) => u.role === "hauler").length})`);
  }
  populateNpcDrones(sim.skySeed);
  const honest = npcDrones.units.filter((u) => !u.hostile);
  ok(honest.every((u) => ["miner", "hauler", "repair", "combat"].includes(u.role)), "an honest port fields miners, a hauler, guards and repair drones — nothing else");
  const majors = corps.filter((c) => c.tier === "major" && c.ports.some((id) => stationById(id) && !stationById(id).gnn));
  ok(majors.every((c) => npcDrones.units.some((u) => u.corpId === c.id && u.role === "repair")), `every major corporation keeps a repair drone (${majors.length})`);
  ok(byRole("combat").filter((u) => !u.hostile).length >= 2, `and honest guards stand off the ports (${byRole("combat").filter((u) => !u.hostile).length})`);
  ok(npcDrones.units.filter((u) => u.hostile).every((u) => u.role === "combat"), "a hold still flies gun drones");
  ok(DRONE_CAP === 10, "your own company's cap is untouched");
  const census = Object.fromEntries(["miner", "hauler", "repair", "combat"].map((r) => [r, byRole(r).length]));
  ok(census.miner + census.hauler <= npcDrones.units.length * 0.65, `working drones are no longer most of the sky (${JSON.stringify(census)})`);
}

/* ---- 2. guards ---------------------------------------------------------------------------- */
{
  const guard = npcDrones.units.find((u) => u.role === "combat" && !u.hostile);
  const home = stationById(guard.home);
  guard.state = "outbound"; guard.dockedAt = null; guard.bay = null;
  guard.x = home.x + 300; guard.y = home.y; guard.z = home.z;
  ship.dockedAt = null;
  ship.pos.x = home.x + 9000; ship.pos.y = home.y; ship.pos.z = home.z;
  const rogue = { id: "drone-port1", kind: "drone", name: "Rogue drone", relation: "hostile", x: home.x + 900, y: home.y, z: home.z, vx: 0, vy: 0, vz: 0, hp: 60, shield: 0, radius: 4, cooldown: 99 };
  contacts.push(rogue);
  ok(npcDroneHooks.hostiles().includes(rogue), "the sim shows the guards what is hostile");
  const kills = [];
  let fired = 0;
  for (let i = 0; i < 30 * 40 && rogue.hp > 0; i++) {
    sim.time += 1 / 30;
    stepStations(sim.time);
    syncContacts(ship, new Map(), relationOf, sim.time, 1 / 30);
    rogue.cooldown = 99;
    rogue.x = home.x + 900; rogue.y = home.y; rogue.z = home.z;   // it is working a hull off the port, and the port rides its orbit
    rogue.vx = home.vx ?? 0; rogue.vy = home.vy ?? 0; rogue.vz = home.vz ?? 0;
    const before = shots.length;
    stepNpcDrones();
    fired += Math.max(0, shots.length - before);
    stepShots(ship, 1 / 30, sim.time, (c, s) => kills.push([c, s]));
  }
  ok(fired > 0, `${guard.name} puts rounds on a rogue drone off ${home.name} (${fired})`);
  ok(rogue.hp <= 0, `and they land until it is dead (${Math.max(0, Math.round(rogue.hp))} hp left)`);
  ok(kills.length > 0 && kills.every(([, s]) => s?.faction === "npc-port"), `the kill is the port's, not yours (${kills.length})`);
  const idx = contacts.indexOf(rogue); if (idx >= 0) contacts.splice(idx, 1);
  for (let i = 0; i < 30; i++) { sim.time += 1 / 30; stepStations(sim.time); syncContacts(ship, new Map(), relationOf, sim.time, 1 / 30); stepNpcDrones(); }
  ok(guard.state === "patrol" && /guarding/.test(guard.note), `and back to guarding the port (${guard.note})`);
}

/* ---- 3. repair ------------------------------------------------------------------------------ */
{
  const rep = npcDrones.units.find((u) => u.role === "repair");
  const home = stationById(rep.home);
  const co = corpById(rep.corpId);
  rep.state = "outbound"; rep.dockedAt = null; rep.bay = null;
  rep.x = home.x + 200; rep.y = home.y; rep.z = home.z;
  ship.dockedAt = null; ship.outlaw = false;
  ship.pos.x = home.x + 1200; ship.pos.y = home.y; ship.pos.z = home.z;
  const max = hullMaxOf(ship);
  const run = (secs) => { for (let i = 0; i < secs * 4; i++) { sim.time += 0.25; stepNpcDrones(); } };

  ship.hull = max * 0.5; ship.lastHitAt = sim.time;
  run(10);
  ok(ship.hull === max * 0.5, "mid-fight, the repair drone keeps off");

  ship.lastHitAt = sim.time - DRONE_LINE.quietFor - 1;
  const h0 = ship.hull;
  run(60);
  ok(ship.hull > h0 && ship.hull <= max, `out of the fight, ${home.name}'s repair drone patches your hull (${Math.round(h0)} → ${Math.round(ship.hull)} of ${Math.round(max)})`);
  ok(rep.state === "repairing" && /patching/.test(rep.note), `…and says so (${rep.note})`);

  const was = co.standing;
  co.standing = -30;
  const h1 = ship.hull;
  run(20);
  ok(ship.hull === h1, "a port that does not like you does not fix you");
  co.standing = was;

  ship.pos.x = home.x + DRONE_LINE.repairReach + 2000;
  const h2 = ship.hull;
  run(20);
  ok(ship.hull === h2, "and it does not chase you across the system");
}

/* ---- 4. ships are the long game ----------------------------------------------------------------- */
{
  const avg = {};
  for (const d of SHIP_DB) (avg[d.tier] ??= []).push(yardQuote(d).list);
  const tiers = Object.keys(TIER_SCALE).filter((t) => avg[t]);
  const mean = (t) => avg[t].reduce((a, b) => a + b, 0) / avg[t].length;
  ok(tiers.every((t, i) => i === 0 || mean(t) > mean(tiers[i - 1]) * 1.8), `each tier costs well over the one below (${tiers.map((t) => `${t} ${Math.round(mean(t) / 1000)}k`).join(", ")})`);
  ok(mean("G") > 4000000, "a capital hull is a career's work");
  ok(tiers.every((t, i) => i === 0 || TIER_SCALE[t] > TIER_SCALE[tiers[i - 1]]), "the scale only climbs");
}

console.log(`portdrones: ${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
