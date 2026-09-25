/* LIVING GALAXY 0.3.29 — the hold, as a bag you can open.
 *
 *   node --import ./test/three-register.mjs test/hold.test.mjs
 *
 * Everything the ship carried lived behind one number. The bag is the read:
 * one slot per good, with the tonnage it costs you and what it is worth where
 * you are standing — and the two things you can do to it from the seat, drop
 * it or sell it, neither of which may touch somebody else's consignment.
 */

import { sim, launchSim, tickSim } from "../js/sim.js";
import { makePilot } from "../js/pilot.js";
import { stations } from "../js/stations.js";
import { corps } from "../js/corps.js";
import { contracts, resetContracts } from "../js/contracts.js";
import { deliver } from "../js/economy.js";
import { good, bulkOf } from "../js/materials.js";
import { clearDockwork } from "../js/dockwork.js";
import { HOLD, holdSlots, holdLine, consignedNow, dropFromHold, sellFromHold, renderHold } from "../js/holdview.js";

let pass = 0, fail = 0;
const ok = (c, m) => { if (c) { pass++; if (process.env.V) console.log("  ok", m); } else { fail++; console.error("  FAIL", m); } };
const store = new Map();
globalThis.localStorage = { getItem: (k) => (store.has(k) ? store.get(k) : null), setItem: (k, v) => store.set(k, String(v)), removeItem: (k) => store.delete(k) };

makePilot("Bagman", "terran", "mining", null);
launchSim("HoldTest", "sol");
sim.phase = "play";
for (const c of corps) c.standing = 100;
for (let i = 0; i < 200; i++) tickSim(1 / 60);
const ship = sim.ship;
const st = stations.find((s) => !(s.hostile && !s.claimed));
const clear = () => { for (const k of Object.keys(ship.hold)) delete ship.hold[k]; contracts.active.length = 0; clearDockwork(); };

/* ---- an empty hold ------------------------------------------------------------------ */
{
  clear();
  ship.dockedAt = null;
  const h = holdSlots();
  ok(h.slots.length === 0 && h.used === 0, "an empty hold has no slots filled");
  ok(h.empty >= HOLD.minSlots, `and still shows ${h.empty} empty ones, so the room left is something you can see`);
  ok(h.cap > 0 && h.room > 0 && h.port === null, `it knows the hull (${h.cap}) and that you are not docked`);
}

/* ---- what is aboard ------------------------------------------------------------------ */
{
  clear();
  Object.assign(ship.hold, { iron_ore: 184, chromite: 61, water_ice: 320, platinum_ore: 7.4 });
  const h = holdSlots();
  ok(h.slots.length === 4, `four kinds aboard, four slots (${h.slots.map((s) => s.name).join(", ")})`);
  ok(h.slots.every((s) => s.qty > 0 && s.mass > 0 && s.unit > 0), "each carries its quantity, its tonnage and a price a unit");
  const iron = h.slots.find((s) => s.id === "iron_ore");
  ok(Math.abs(iron.mass - 184 * (good("iron_ore")?.mass ?? 1)) < 0.5, `tonnage is quantity × mass, not quantity (${iron.mass} t for 184)`);
  ok(h.slots.every((s, i) => i === 0 || s.worth <= h.slots[i - 1].worth), "the most valuable slot is first — the thing you would sell");
  ok(h.slots.every((s) => s.ore === true), "all four read as ore, so the bag can colour them as rock");
  /* 0.3.52: the gauge is hold units — each good at its bulk */
  const hu = h.slots.reduce((a, s) => a + s.qty * bulkOf(s.id), 0);
  ok(Math.abs(h.used - hu) < 1, `the total matches the gauge (${h.used} hu)`);
  ok(/4 kinds/.test(holdLine(h)) && /t/.test(holdLine(h)), `and it says itself in one line: ${holdLine(h)}`);
}

/* ---- somebody else's cargo ------------------------------------------------------------ */
{
  clear();
  Object.assign(ship.hold, { steel_plate: 40, iron_ore: 20 });
  contracts.active.push({ id: "c1", consigned: 40, good: "steel_plate", mech: "haul" });
  ok(consignedNow().steel_plate === 40, "the bag knows what is consigned");
  const h = holdSlots();
  const plate = h.slots.find((s) => s.id === "steel_plate");
  ok(plate.consigned === 40 && plate.mine === 0, "a fully consigned lot is none of it yours");
  ok(h.worth > 0 && h.worth < 40 * plate.unit, "and it is not counted in what the hold is worth to you");
  ok(/consigned/.test(dropFromHold("steel_plate") ?? ""), "you cannot dump it — that is a contract, not cargo");
  ok((ship.hold.steel_plate ?? 0) === 40, "…and it is still aboard after trying");
  ship.dockedAt = st.id;
  ok(/not yours to sell/.test(sellFromHold("steel_plate") ?? ""), "nor sell it");
  ship.dockedAt = null;
  /* a partial consignment leaves the rest yours */
  contracts.active.length = 0;
  contracts.active.push({ id: "c2", consigned: 25, good: "steel_plate", mech: "haul" });
  const h2 = holdSlots();
  const p2 = h2.slots.find((s) => s.id === "steel_plate");
  ok(p2.consigned === 25 && p2.mine === 15, "a partial consignment leaves the remainder yours (15 of 40)");
  ok(dropFromHold("steel_plate") === null && Math.round(ship.hold.steel_plate) === 25, "dumping takes only your share and leaves theirs");
}

/* ---- dropping and selling -------------------------------------------------------------- */
{
  clear();
  ship.dockedAt = null;
  Object.assign(ship.hold, { iron_ore: 100 });
  ok(/Dock first/.test(sellFromHold("iron_ore") ?? ""), "you cannot sell from the seat in open space");
  ok(dropFromHold("iron_ore", 40) === null && Math.round(ship.hold.iron_ore) === 60, "but you can drop part of a lot (100 → 60)");
  ok(dropFromHold("iron_ore") === null && !(ship.hold.iron_ore > 0.01), "and all of it");
  ok(/Nothing of that/.test(dropFromHold("iron_ore") ?? ""), "dumping what is not aboard says so rather than pretending");
  /* docked, it sells at the port's price and the money lands */
  clear();
  ship.dockedAt = st.id;
  ship.credits = 10000;
  st.credits = 1e9;
  deliver(st, "iron_ore", 10);
  Object.assign(ship.hold, { iron_ore: 120 });
  const before = ship.credits;
  const h = holdSlots();
  ok(h.port?.id === st.id && /docked at/.test(holdLine(h)) === false, `the bag knows it is docked at ${h.port?.name}`);
  ok(sellFromHold("iron_ore") === null, "sold from the bag");
  ok(ship.credits > before && !(ship.hold.iron_ore > 0.01), `${Math.round(ship.credits - before).toLocaleString("en-US")} cr for it, and the hold is clear`);
  ship.dockedAt = null;
}

/* ---- and it draws ----------------------------------------------------------------------- */
{
  clear();
  Object.assign(ship.hold, { iron_ore: 184, chromite: 61 });
  contracts.active.push({ id: "c3", consigned: 61, good: "chromite", mech: "haul" });
  const made = [];
  const node = () => ({ cls: "", kids: [], txt: "", className: "", dataset: {}, style: {}, classList: { add() {}, toggle() {} },
    set textContent(v) { this.txt = v; }, get textContent() { return this.txt; },
    append(...k) { this.kids.push(...k); }, addEventListener() {}, prepend(...k) { this.kids.unshift(...k); } });
  globalThis.document = { createElement: (t) => { const n = node(); n.tag = t; made.push(n); return n; } };
  const host = node();
  const h = renderHold(host, {});
  delete globalThis.document;
  const flat = (n, out = []) => { out.push(n); for (const k of n.kids ?? []) flat(k, out); return out; };
  const all = flat(host);
  const slots = all.filter((n) => String(n.className).startsWith("hv-slot"));
  ok(h && slots.length === 2 + h.empty, `${slots.length} slots drawn: ${h.slots.length} full and ${h.empty} empty`);
  ok(slots.filter((n) => /empty/.test(n.className)).length === h.empty, "the empty ones are marked empty");
  ok(slots.some((n) => /consigned/.test(n.className)), "the consigned one is marked consigned");
  const buttons = all.filter((n) => n.tag === "button");
  ok(buttons.length > 0 && buttons.every((n) => /hv-btn/.test(n.className)), `${buttons.length} actions offered`);
  ok(!buttons.some((n) => n.txt === "SELL"), "no SELL in open space");
  ok(all.some((n) => /hv-bar/.test(n.className)) && all.some((n) => /hv-sum/.test(n.className)), "with the fill bar and the summary above them");
  clear();
}

resetContracts();
console.log(`hold: ${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
