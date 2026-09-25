/* LIVING GALAXY — 0.3.48: the security ◆.
 *
 *   node --import ./test/three-register.mjs test/seclevel.test.mjs
 *
 * GREEN is safe and SOS brings a real wing to the player on an honest clock;
 * YELLOW is a fight in the last twenty seconds and SOS is closed; RED is heat
 * from honest kills and pilots — no SOS, the patrols read you as hostile —
 * and it cools, or it is paid, and it survives a reload.
 */
const store = new Map();
globalThis.localStorage = { getItem: (k) => store.get(k) ?? null, setItem: (k, v) => store.set(k, String(v)), removeItem: (k) => store.delete(k) };

import { sim, launchSim, tickSim, relationOf } from "../js/sim.js";
import { makePilot, pilot, serializePilot, restorePilot } from "../js/pilot.js";
import { stations } from "../js/stations.js";
import { traffic, LAW_ROLES, HOSTILE_ROLES } from "../js/npc/traffic.js";
import { distress, securityCorp, stepSecurity, callById } from "../js/npc/security.js";
import { syncContacts, contacts } from "../js/turrets.js";
import * as SEC from "../js/seclevel.js";

let pass = 0, fail = 0;
const ok = (c, m) => { if (process.env.V) console.log(c ? "  ok  " : "  FAIL", m); if (c) pass++; else { fail++; if (!process.env.V) console.error("  FAIL", m); } };

makePilot("Diamond", "terran", "security", null);
launchSim("SecTest", "sol");
sim.phase = "play";
tickSim(1 / 60);
const ship = sim.ship;
ship.dockedAt = null;
ship.credits = 100000;
ship.lastHitBy = null; ship.lastHitAt = -1e9; ship.lastFireAt = -1e9;

const t0 = () => sim.time;
const law = securityCorp();
ok(Boolean(law), `this sky is policed (${law?.name})`);

/* ---- GREEN ------------------------------------------------------------------- */
let lv = SEC.secLevel(ship, t0());
ok(lv.id === "green" && lv.label === "SAFE" && lv.canSOS, `a clean pilot is GREEN, SOS open (${lv.why ?? "open"})`);
ok(lv.corp === law.name, "and knows who is protecting them");

/* put the ship near a law hull so a wing can actually come */
const cop = traffic.find((n) => LAW_ROLES.has(n.role) && n.job !== "down");
ok(Boolean(cop), "there is a patrol in the sky");
ship.pos.x = cop.x + 6000; ship.pos.y = cop.y; ship.pos.z = cop.z;
const r = SEC.callSOS(ship, t0());
ok(r.ok && r.call?.victimId === "self" && r.call.sos, "SOS opens a call for the player");
ok(r.call.coverage === 1 && (r.call.state === "dispatched" || r.call.qrfPending), `…and the Directorate answers it (${r.call.state}, eta ${r.eta == null ? "—" : Math.round(r.eta) + "s"})`);
const wing = r.call.wing.map((id) => traffic.find((n) => n.id === id)).filter(Boolean);
ok(wing.length >= 1, `a real wing is assigned (${wing.length})`);
if (wing.length) {
  const d0 = Math.hypot(wing[0].x - ship.pos.x, wing[0].y - ship.pos.y, wing[0].z - ship.pos.z);
  for (let i = 0; i < 120; i++) tickSim(1 / 20);
  const d1 = Math.hypot(wing[0].x - ship.pos.x, wing[0].y - ship.pos.y, wing[0].z - ship.pos.z);
  ok(d1 < d0 || callById(r.call.id)?.arrivedAt, `the wing flies to the player, not to a record (${Math.round(d0)} → ${Math.round(d1)} u)`);
  ok(callById(r.call.id) && callById(r.call.id).state !== "closed", "a call from the player is not closed as 'victim gone'");
}
const again = SEC.callSOS(ship, t0());
ok(!again.ok && /already|another call/.test(again.why), `one call at a time (${again.why})`);

/* ---- YELLOW ------------------------------------------------------------------ */
ship.lastHitBy = "some-contact"; ship.lastHitAt = t0();
lv = SEC.secLevel(ship, t0());
ok(lv.id === "yellow" && !lv.canSOS && /combat/.test(lv.why), "shot at: YELLOW, SOS closed");
lv = SEC.secLevel(ship, t0() + SEC.SEC.combatWindow + 1);
ok(lv.id !== "yellow", "and it clears once it has been quiet");
ship.lastHitBy = null;
ship.lastFireAt = t0();
ok(SEC.secLevel(ship, t0()).id === "yellow", "firing is being in a fight too");
ship.lastFireAt = -1e9;

/* ---- RED --------------------------------------------------------------------- */
const pirate = { role: "pirate", name: "a raider" };
SEC.noteKillBySelf({ n: pirate, t: t0() });
ok(SEC.heat() === 0, "a pirate is the job — no heat");
const honest = traffic.find((n) => !LAW_ROLES.has(n.role) && !HOSTILE_ROLES.has(n.role) && !n.rogue) ?? { role: "trader", name: "a trader" };
const st0 = law.standing ?? 0;
SEC.noteKillBySelf({ n: honest, t: t0() });
SEC.noteKillBySelf({ n: honest, t: t0() });
ok(SEC.secLevel(ship, t0()).id !== "red", `two honest kills: heat ${SEC.heat()} — not yet wanted`);
SEC.noteKillBySelf({ peer: true, t: t0() });
lv = SEC.secLevel(ship, t0());
ok(lv.id === "red" && lv.label === "WANTED", `and another pilot makes it RED (heat ${lv.heat})`);
ok(!lv.canSOS && /wanted/.test(lv.why), "no SOS for a wanted pilot");
ok((law.standing ?? 0) < st0, "the Directorate's standing drops when it posts you");
SEC.stepSecLevel(ship, t0(), 0);
ok(ship.outlaw === true, "the sim marks the hull an outlaw");
/* the patrols read you as hostile */
if (cop) {
  ship.pos.x = cop.x + 300; ship.pos.y = cop.y; ship.pos.z = cop.z;
  syncContacts(ship, new Map(), relationOf, t0(), 0.05);
  const c = contacts.find((x) => x.id === cop.id);
  ok(c?.relation === "hostile", `a patrol hull on the board is hostile to a wanted pilot (${c?.relation})`);
  ship.outlaw = false;
  syncContacts(ship, new Map(), relationOf, t0(), 0.05);
  ok(contacts.find((x) => x.id === cop.id)?.relation === "ally", "…and an ally to a clean one");
  ship.outlaw = true;
}

/* ---- it survives a reload, it cools, it can be paid ---------------------------- */
const rec = JSON.parse(JSON.stringify(serializePilot()));
const h = SEC.heat();
pilot.secHeat = 0;
restorePilot(rec);
ok(Math.abs(SEC.heat() - h) < 0.01, `heat rides the pilot record (${rec.secHeat})`);
SEC.stepSecLevel(ship, t0(), SEC.SEC.cool);
ok(Math.abs(SEC.heat() - (h - 1)) < 0.01, "a point cools in SEC.cool seconds");
ok(SEC.payFine(ship) === "Pay at a port — dock first", "the fine is paid at a counter, not in space");
const port = stations.find((s) => !s.hostile && s.sector !== "pirate");
ship.dockedAt = port.id;
const fine = SEC.secLevel(ship, t0()).fine;
const cr = ship.credits;
ok(SEC.payFine(ship) === null && SEC.heat() === 0 && ship.credits === cr - fine, `PAY FINE clears it (${fine} cr at ${port.name})`);
ship.dockedAt = null;
SEC.stepSecLevel(ship, t0() + 999, 0);
ok(!ship.outlaw && SEC.secLevel(ship, t0() + 999).id === "green", "and the diamond is green again");
const free = stations.find((s) => s.sector === "pirate" || (s.hostile && !s.claimed));
if (free) { pilot.secHeat = 1; ship.dockedAt = free.id; ok(/free port/.test(SEC.payFine(ship) ?? ""), "a free port keeps no Directorate counter"); ship.dockedAt = null; pilot.secHeat = 0; }

/* ---- the SOS is honest about a false alarm ------------------------------------- */
ok(SEC.SEC.falseAlarm < 0, "a wing that finds nothing costs a little standing");
ok(distress.some((c) => c.victimId === "self"), "the player's call is on the same bus as everyone's");

console.log(`seclevel: ${pass} passed, ${fail} failed`);
if (fail) process.exit(1);
