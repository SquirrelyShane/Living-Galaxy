/* LIVING GALAXY — 0.3.56: a fight that picked you.
 *
 * SOS used to close the moment you were in combat. Now: rogue drones or
 * pirates hitting you, and you did not go after them yourself — no P-LOCK
 * attack, no first shot; turrets returning fire is self-defence — and SOS
 * stays open. A wing that arrives to find them still on you pays a bounty for
 * the call, by what they found, and fights what is on you.
 *
 *   node --import ./test/three-register.mjs test/qrf.test.mjs
 */
const store = new Map();
globalThis.localStorage = { getItem: (k) => store.get(k) ?? null, setItem: (k, v) => store.set(k, String(v)), removeItem: (k) => store.delete(k) };

import { sim, launchSim, tickSim } from "../js/sim.js";
import { makePilot, pilot } from "../js/pilot.js";
import { traffic, LAW_ROLES, HOSTILE_ROLES } from "../js/npc/traffic.js";
import { securityCorp, callById } from "../js/npc/security.js";
import { contacts, shots, stepShots, syncContacts } from "../js/turrets.js";
import { relationOf } from "../js/sim.js";
import * as SEC from "../js/seclevel.js";

let pass = 0, fail = 0;
const ok = (c, m) => { if (c) { pass++; if (process.env.V) console.log("  ok", m); } else { fail++; console.error("  FAIL", m); } };

makePilot("QRF", "terran", "security", null);
launchSim("QrfTest", "sol");
sim.phase = "play";
tickSim(1 / 60);
const ship = sim.ship;
ship.dockedAt = null;
ship.credits = 10000;
pilot.secHeat = 0;
const law = securityCorp();
const cop = traffic.find((n) => LAW_ROLES.has(n.role) && n.job !== "down");
ship.pos.x = cop.x + 6000; ship.pos.y = cop.y; ship.pos.z = cop.z;
const t0 = sim.time + 100;

function drone(id, dx = 700) {
  const c = { id, kind: "drone", name: "Rogue drone", relation: "hostile", x: ship.pos.x + dx, y: ship.pos.y, z: ship.pos.z, vx: 0, vy: 0, vz: 0, hp: 60, shield: 0, radius: 4, cooldown: 99 };
  contacts.push(c);
  return c;
}
const hit = (id, t) => { ship.lastHitBy = id; ship.lastHitAt = t; SEC.stepSecLevel(ship, t, 0); };

/* ---- 1. a fight that picked you ---------------------------------------------------- */
SEC.resetSecLevel();
const d1 = drone("drone-q1");
hit(d1.id, t0);
let lv = SEC.secLevel(ship, t0);
ok(lv.id === "yellow", "shot at by a rogue drone: YELLOW, in combat");
ok(lv.canSOS && lv.assault?.kinds.includes("drone"), `…and SOS is OPEN — it picked you (${lv.why ?? "open"})`);
ok(lv.assault.bounty.cr === SEC.BOUNTY.drone.cr, `a wing finding it would pay ${lv.assault.bounty.cr} cr`);

/* turrets returning fire is self-defence */
ok(SEC.noteShot(d1, t0 + 1, null) === "defending", "turrets returning fire on it is self-defence");
ok(SEC.secLevel(ship, t0 + 1).canSOS, "…and SOS stays open");

/* ---- 2. a fight you picked -------------------------------------------------------------- */
ok(SEC.noteShot(d1, t0 + 2, d1.id) === "locked", "P-LOCK it and fire: that is going after it by hand");
lv = SEC.secLevel(ship, t0 + 2);
ok(!lv.canSOS && /picked/.test(lv.why), `…and SOS closes (${lv.why})`);
d1.hp = 0;
hit("drone-q2", t0 + 3);
drone("drone-q2");
ok(SEC.secLevel(ship, t0 + 3).canSOS, "once the one you picked is dead, a new attacker opens it again");

SEC.resetSecLevel();
const d3 = drone("drone-q3");
ok(SEC.noteShot(d3, t0 + 10, null) === "first", "firing on a drone that never hit you is firing first");
hit(d3.id, t0 + 11);
lv = SEC.secLevel(ship, t0 + 11);
ok(!lv.canSOS && /fired first/.test(lv.why), `…so when it shoots back, SOS is closed (${lv.why})`);
lv = SEC.secLevel(ship, t0 + 11 + SEC.SEC.pickedFor + 1);
ok(lv.id !== "yellow" || !/picked/.test(lv.why ?? ""), "a picked fight stops counting after SEC.pickedFor");

/* ---- 3. not every attacker ---------------------------------------------------------------- */
SEC.resetSecLevel();
hit("some-honest-hull", t0 + 20);
lv = SEC.secLevel(ship, t0 + 20);
ok(!lv.canSOS && /combat/.test(lv.why), "shot at by something that is not a drone or a pirate: SOS closed as before");
SEC.resetSecLevel();
const pirate = traffic.find((n) => HOSTILE_ROLES.has(n.role) && !n.rogue && n.role !== "rogue" && n.job !== "down");
if (pirate) {
  hit(pirate.id, t0 + 30);
  lv = SEC.secLevel(ship, t0 + 30);
  ok(lv.canSOS && lv.assault.kinds.includes("pirate"), `a pirate on you opens it too (${pirate.name})`);
  ok(lv.assault.bounty.cr > SEC.BOUNTY.drone.cr && lv.assault.bounty.cr <= SEC.BOUNTY.pirate.max, `and a pirate is worth more than a drone (${lv.assault.bounty.cr} cr)`);
}
const many = Array.from({ length: 40 }, (_, i) => ({ id: `x${i}`, kind: "pirate" }));
ok(SEC.bountyFor(many).cr <= SEC.SEC.bonusCap && SEC.bountyFor(many).standing <= SEC.SEC.standingCap, "one call pays out a capped amount");

/* ---- 4. the call, and the wing ------------------------------------------------------------ */
SEC.resetSecLevel();
const d5 = drone("drone-q5");
hit(d5.id, t0 + 40);
const r = SEC.callSOS(ship, t0 + 40);
ok(r.ok && r.call.attackerId === d5.id && r.call.assault, `SOS under attack names who is on you (${r.call?.attackerName})`);
const cr0 = ship.credits, s0 = law.standing ?? 0;
const pay = SEC.wingArrived(r.call, t0 + 60, ship);
ok(pay?.cr === SEC.BOUNTY.drone.cr && ship.credits === cr0 + pay.cr, `the wing finds it still at you: ${pay?.cr} cr for the call`);
ok((law.standing ?? 0) > s0, `and ${law.name} remembers it (+${pay?.standing})`);
ok(SEC.wingArrived(r.call, t0 + 61, ship) === null, "paid once per call");

/* the wing fights it: rounds go at the drone and land */
const n = cop;
n.respondTo = r.call.id;
if (!r.call.wing.includes(n.id)) r.call.wing.push(n.id);
r.call.arrivedAt = t0 + 60;
r.call.state = "onscene";
n.x = d5.x + 500; n.y = d5.y; n.z = d5.z;
n.visible = true;
const shots0 = shots.filter((s) => s.faction === "npc-law").length;
let t = t0 + 61;
let fired = 0;
for (let i = 0; i < 30 * 20 && d5.hp > 0; i++) {
  t += 1 / 30;
  syncContacts(ship, new Map(), relationOf, t, 1 / 30);   // the sim's own order: board, then rounds
  d5.cooldown = 99;
  if (i % 30 === 0) hit(d5.id, t);
  const before = shots.length;
  SEC.stepSecLevel(ship, t, 1 / 30);
  fired += Math.max(0, shots.length - before);
  stepShots(ship, 1 / 30, t, () => {});
}
void shots0;
ok(fired > 0, `the wing puts rounds on the drone (${fired} in flight across the fight)`);
ok(d5.hp < 60, `and they land (${Math.max(0, Math.round(d5.hp))} hp left)`);
ok(SEC.heat() === 0, "a kill by the wing is not yours — no heat");

/* ---- 5. a wing that finds nothing still pays nothing ---------------------------------------- */
r.call.state = "closed";   // the last call is done with
SEC.resetSecLevel();
const d6 = drone("drone-q6");
hit(d6.id, t0 + 200);
const r2 = SEC.callSOS(ship, t0 + 200 + SEC.SEC.sosCooldown);
d6.hp = 0;
const cr1 = ship.credits;
const pay2 = r2.ok ? SEC.wingArrived(r2.call, t0 + 260 + SEC.SEC.sosCooldown, ship) : { cr: 0 };
ok(pay2?.cr === 0 && ship.credits === cr1, "no bounty when what was on you is already dead");

console.log(`qrf: ${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
