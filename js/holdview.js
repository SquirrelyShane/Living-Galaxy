/* LIVING GALAXY — the hold, as a bag you can open.
 *
 * 0.3.29. Everything the ship carries lived behind one number: the CGO gauge,
 * a bar and a total. You could see that the hold was 84% full and nothing
 * about what was in it — not which ore, not what it was worth, not which of it
 * was somebody else's consignment you were being paid to carry and must not
 * sell. The only way to find out was to dock and read the trade desk.
 *
 * So the gauge opens. A slot grid, the way a bag is a slot grid: one slot per
 * good, the quantity on it, the tonnage it is costing you, what it is worth
 * where you are standing — and the empty slots drawn as empty, so "how much
 * room is left" is a thing you can see rather than a percentage you have to
 * think about.
 *
 * It is a READ of the hold plus the two things you can do to what is in it
 * from the seat: drop it, or sell it if you are docked somewhere that buys it.
 * Everything else about trading is still the deck's job — this is the pocket
 * you check without docking.
 */

import { sim, sellPriceAt, jettison, tradeSell, logEvent } from "./sim.js";
import { stationById } from "./stations.js";
import { good, goodName, baseValue, bulkOf } from "./materials.js";
import { holdRoom, cargoTotal } from "./ship.js";
import { contracts } from "./contracts.js";
import { classForOre } from "./sites.js";
import { handlingLeft } from "./dockwork.js";

/* resolved lazily: the module is imported long before a page exists in some
 * hosts, and captured once it is null for ever */
const doc = () => globalThis.document ?? null;

/** The smallest grid that holds what is aboard, so the bag grows with the hull. */
export const HOLD = { minSlots: 12, perRow: 4, maxSlots: 40 };

/** Goods an accepted contract has consigned to the hold: aboard, but not yours. */
export function consignedNow() {
  const out = {};
  for (const a of contracts.active) if (a.consigned && a.good) out[a.good] = (out[a.good] ?? 0) + a.consigned;
  return out;
}

/**
 * What is in the hold, as slots.
 * → { slots: [{ id, name, qty, mass, unit, worth, mine, consigned, cls, ore }],
 *     used, cap, room, mass, worth, empty, port }
 */
export function holdSlots(ship = sim.ship) {
  const st = ship.dockedAt ? stationById(ship.dockedAt) : null;
  const held = consignedNow();
  const slots = [];
  let mass = 0, worth = 0;
  for (const [id, q] of Object.entries(ship.hold ?? {})) {
    if (!(q > 0.005)) continue;
    const g = good(id);
    const qty = Math.round(q * 100) / 100;
    const cons = Math.min(qty, held[id] ?? 0);
    const unit = st ? sellPriceAt(st, id, Math.max(1, Math.floor(qty))) : baseValue(id);
    const m = qty * (g?.mass ?? 1);
    mass += m;
    worth += unit * (qty - cons);
    slots.push({
      id, name: goodName(id), qty, mass: Math.round(m * 10) / 10,
      bulk: bulkOf(id), hu: Math.round(qty * bulkOf(id) * 10) / 10,   // 0.3.52: what it takes up
      unit: Math.round(unit), worth: Math.round(unit * qty),
      consigned: Math.round(cons * 100) / 100, mine: Math.round((qty - cons) * 100) / 100,
      cls: g?.tier === "ore" ? classForOre(id) : null,
      ore: g?.tier === "ore",
    });
  }
  slots.sort((a, b) => b.worth - a.worth || a.name.localeCompare(b.name));
  const cap = Math.max(1, ship.cargoCap ?? 1);
  const used = cargoTotal(ship);
  const want = Math.min(HOLD.maxSlots, Math.max(HOLD.minSlots, Math.ceil(slots.length / HOLD.perRow + 1) * HOLD.perRow));
  return {
    slots, used: Math.round(used * 10) / 10, cap: Math.round(cap), room: Math.round(holdRoom(ship) * 10) / 10,
    mass: Math.round(mass * 10) / 10, worth: Math.round(worth),
    empty: Math.max(0, want - slots.length),
    port: st ? { id: st.id, name: st.name } : null,
    busy: ship.dockedAt ? Math.ceil(handlingLeft(ship.dockedAt)) : 0,
  };
}

/** "84 of 420 · 6 kinds · 1,240 t · 38,900 cr" */
export function holdLine(h = holdSlots()) {
  const kinds = h.slots.length;
  return `${Math.round(h.used).toLocaleString("en-US")} of ${h.cap.toLocaleString("en-US")} hu · ${kinds} kind${kinds === 1 ? "" : "s"} · ${h.mass.toLocaleString("en-US")} t${h.worth ? ` · ${h.worth.toLocaleString("en-US")} cr` : ""}`;
}

/* ---- what you can do to it from the seat --------------------------------------- */

/** Drop it. Never somebody else's consignment — that is a contract, not cargo. */
export function dropFromHold(id, amount = "all") {
  const h = holdSlots();
  const slot = h.slots.find((s) => s.id === id);
  if (!slot) return "Nothing of that aboard";
  if (slot.mine <= 0) return `All of that ${slot.name} is consigned — abandon the contract to be rid of it`;
  const want = amount === "all" ? slot.mine : Math.min(amount, slot.mine);
  jettison(id, want);
  return null;
}

/** Sell it, if you are docked somewhere and it is yours. */
export function sellFromHold(id, amount = "all") {
  if (!sim.ship.dockedAt) return "Dock first";
  const h = holdSlots();
  const slot = h.slots.find((s) => s.id === id);
  if (!slot) return "Nothing of that aboard";
  if (slot.mine <= 0) return `That ${slot.name} is consigned — it is not yours to sell`;
  const want = amount === "all" ? slot.mine : Math.min(amount, slot.mine);
  const why = tradeSell(id, want);
  if (!why) logEvent(`Sold ${Math.round(want)} ${slot.name} from the hold`, "trade");
  return why;
}

/* ---- the panel ------------------------------------------------------------------ */

const mk = (tag, cls, text) => { const n = doc().createElement(tag); if (cls) n.className = cls; if (text != null) n.textContent = text; return n; };

/**
 * Draw the bag into `host`. `onChange` repaints after an action.
 * Pure DOM: no styling decisions here beyond the class names css/style.css owns.
 */
export function renderHold(host, { onChange = null } = {}) {
  if (!doc() || !host) return;
  host.textContent = "";
  const h = holdSlots();

  const head = mk("div", "hv-head");
  head.append(mk("div", "hv-sum", holdLine(h)));
  const bar = mk("div", "hv-bar");
  const fill = mk("b");
  fill.style.width = `${Math.max(0, Math.min(100, (h.used / h.cap) * 100))}%`;
  if (h.used / h.cap > 0.97) fill.classList.add("full");
  bar.append(fill);
  head.append(bar);
  head.append(mk("div", "hv-where", h.port ? (h.busy ? `docked at ${h.port.name} · cargo handling, ${h.busy} s` : `docked at ${h.port.name} — prices are theirs`) : "in flight — values are book, not a buyer's"));
  host.append(head);

  const grid = mk("div", "hv-grid");
  for (const s of h.slots) {
    const cell = mk("div", `hv-slot${s.consigned >= s.qty ? " consigned" : ""}${s.ore ? " ore" : ""}`);
    if (s.cls) cell.dataset.cls = s.cls;
    cell.append(mk("div", "hv-qty", s.qty >= 1000 ? `${Math.round(s.qty / 100) / 10}k` : String(Math.round(s.qty))));
    cell.append(mk("div", "hv-nm", s.name));
    cell.append(mk("div", "hv-meta", `${s.mass} t · ${s.unit.toLocaleString("en-US")} cr`));
    if (s.consigned > 0) cell.append(mk("div", "hv-cons", s.consigned >= s.qty ? "consigned" : `${Math.round(s.consigned)} consigned`));
    const acts = mk("div", "hv-acts");
    if (s.mine > 0) {
      if (h.port) {
        const sell = mk("button", "hv-btn sell", "SELL");
        sell.type = "button";
        sell.addEventListener("click", () => { const e = sellFromHold(s.id); if (e) sim.notice = e; onChange?.(); });
        acts.append(sell);
      }
      const drop = mk("button", "hv-btn drop", "DUMP");
      drop.type = "button";
      drop.addEventListener("click", () => { const e = dropFromHold(s.id); if (e) sim.notice = e; onChange?.(); });
      acts.append(drop);
    }
    cell.append(acts);
    grid.append(cell);
  }
  for (let i = 0; i < h.empty; i++) grid.append(mk("div", "hv-slot empty"));
  host.append(grid);

  if (!h.slots.length) host.append(mk("p", "hv-none", "The hold is empty. Ore goes in here when you cut it, and cargo when you buy or load it."));
  return h;
}
