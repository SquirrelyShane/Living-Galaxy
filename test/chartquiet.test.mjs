/* LIVING GALAXY — 0.3.50: the chart shows what the dish sees, not the sky's traffic.
 *
 *   node --import ./test/three-register.mjs test/chartquiet.test.mjs
 *
 * Before, anything under drive inside 1.4 million u was a blob on the nav
 * map, and the register kept a record per hull in the sky to draw it. Now a
 * hull out of range is never allocated, a hull with its drive lit is not a
 * contact (and leaves the chart the moment it lights), and your own fleet is
 * still yours to see.
 */
const store = new Map();
globalThis.localStorage = { getItem: (k) => store.get(k) ?? null, setItem: (k, v) => store.set(k, String(v)), removeItem: (k) => store.delete(k) };

import { sim, launchSim, tickSim } from "../js/sim.js";
import { makePilot } from "../js/pilot.js";
import { traffic } from "../js/npc/traffic.js";
import { register, knownContacts, tickContacts, SCAN } from "../js/contacts.js";

let pass = 0, fail = 0;
const ok = (c, m) => { if (process.env.V) console.log(c ? "  ok  " : "  FAIL", m); if (c) pass++; else { fail++; if (!process.env.V) console.error("  FAIL", m); } };

makePilot("Quiet", "terran", "mining", null);
launchSim("QuietTest", "sol");
sim.phase = "play";
for (let i = 0; i < 120; i++) tickSim(1 / 20);
const ship = sim.ship;
const d = (n) => Math.hypot(n.x - ship.pos.x, (n.y ?? 0) - ship.pos.y, n.z - ship.pos.z);

const live = traffic.filter((n) => n.visible !== false);
const far = live.filter((n) => d(n) > SCAN.range && !n.company);
const lit = live.filter((n) => n.drive && !n.company);
ok(live.length > 20, `a busy sky (${live.length} hulls, ${far.length} beyond the dish, ${lit.length} under drive)`);
ok(far.every((n) => !register.has(n.id) || register.get(n.id).res === 0 || register.get(n.id).free), "nothing beyond the dish has a live return");
const shown = new Set(knownContacts().map((c) => c.id));
ok(far.every((n) => !shown.has(n.id)), "and nothing beyond the dish is on the chart");
ok(lit.every((n) => !shown.has(n.id)), "no hull under drive is on the chart");
ok(register.size <= live.filter((n) => d(n) <= SCAN.range * 1.1 || n.company).length + 40, `the register holds what is near, not the whole sky (${register.size} records for ${live.length} hulls)`);

/* a hull beside you: seen; then it lights its drive: gone at once */
const n = live.find((x) => !x.company && !x.drive) ?? live[0];
n.x = ship.pos.x + 800; n.y = ship.pos.y; n.z = ship.pos.z; n.drive = 0;
for (let i = 0; i < 20; i++) tickContacts(0.25);
ok(knownContacts().some((c) => c.id === n.id), "a hull 800 u off is a contact");
n.drive = 1;
tickContacts(0.25);
ok(!knownContacts().some((c) => c.id === n.id), "and the moment its drive lights it is off the chart");

/* your own fleet is still yours */
n.drive = 1; n.company = true; n.x = ship.pos.x + 5e5;
tickContacts(0.25);
ok(knownContacts().some((c) => c.id === n.id && c.level === 3), "your own hull stays on the chart, anywhere, even under drive");
n.company = false;

console.log(`chartquiet: ${pass} passed, ${fail} failed`);
if (fail) process.exit(1);
