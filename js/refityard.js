/* LIVING GALAXY — the refit yard, a station-deck fragment.
 *
 * refitPanel(body, st) → void. Every upgrade in the UPGRADES table as a row:
 * name, blurb, effect line, price, BUY when this port's sector fits it and
 * SELL (50% back) when it is already aboard. The station deck mounts it as
 * PANELS.refit; CONSOLE › MARKET › REFIT calls the same function. Built on
 * the console kit (js/console/kit.js). Contract: PLAN.md §4.8, §6 contract 2.
 */

import { sim } from "./sim.js";
import { el, row, button, note, section } from "./console/kit.js";
import { upgradeOptions, buyUpgrade, sellUpgrade, upgradeLines, effectOf, upgrades } from "./upgrades.js";
import { repairQuote, yardRepair, repairsAt, hullMaxOf, droneRate } from "./repair.js";
import { defenceReport, KINDS } from "./defence.js";
import { currentShipId } from "./sim.js";
import { shipById } from "./shipdb.js";
import { upgradeResists } from "./upgrades.js";

const DOC = globalThis.document ?? null;

const YARDS = ["industrial", "military", "logistic", "civilian", "agricultural", "pirate"];

export function refitPanel(body, st) {
  if (!DOC || !body) return;
  const paint = () => {
    body.replaceChildren();
    build(body, st, paint);
  };
  paint();
}

function build(body, st, paint) {
  const yard = Boolean(st && YARDS.includes(st.sector));
  const opts = upgradeOptions(st);

  /* ---- the hull: buy it back by the point ---- */
  const ship = sim.ship;
  const hull = section(`HULL · ${Math.round(ship.hull)} / ${hullMaxOf(ship)}`);
  const q = repairQuote(st, ship);
  /* 0.3.34 — what this frame actually turns away. Before this there were no
   * resistances at all and the pools were a flat hundred for every hull in
   * the game, so there was nothing here worth printing. */
  {
    const def = shipById(currentShipId());
    const d = defenceReport(def, { ...(ship.mods ?? {}), resist: upgradeResists() });
    const pctRow = (label, hint, set) => {
      const r = row(hull, label, hint);
      r.value.textContent = KINDS.map((k) => `${k[0].toUpperCase()}${set[k] >= 0 ? "+" : ""}${set[k]}%`).join("  ");
    };
    note(hull, `${def?.name ?? "Hull"} · tier ${d.tier} · screen ${Math.round(ship.shieldCharge)} / ${d.shieldMax}. Kinetic is rounds and collisions, thermal is beams and heat, EM is induction.`);
    pctRow("Armour", "plate — good against mass, poor against induction", d.hull);
    pctRow("Screen", "field — bleeds off energy, poor against mass", d.shield);
  }
  if (!st || !repairsAt(st)) note(hull, st ? `${st.name} has no repair yard. Logistic, military, industrial, civilian and free ports fix hulls.` : "Dock at a port with a repair yard.");
  else if (q.need <= 0) note(hull, `Hull is whole. This yard charges ${q.per} cr a point.`);
  else {
    note(hull, `${q.need} point${q.need === 1 ? "" : "s"} down · ${q.per} cr a point here (sector and standing) · ${ship.credits.toLocaleString()} cr in hand.`);
    const r = row(hull, "Repair");
    const act = (pts, label) => {
      const qq = repairQuote(st, ship, pts);
      const b = button(`${label} · ${(qq.affordable * qq.per).toLocaleString()} CR`, () => {
        const res = yardRepair(pts);
        sim.notice = res.ok ? `${res.points} hull point${res.points === 1 ? "" : "s"} for ${res.cost.toLocaleString()} cr.` : res.why;
        paint();
      }, "on");
      b.disabled = !qq.ok;
      return b;
    };
    r.value.append(act(Math.min(25, q.need), "PATCH 25"), " ", act(null, "FULL"));
  }
  if (droneRate() > 0) note(hull, `Patch drone aboard: welds ${droneRate()} hull a second in flight once nothing has hit you for a few seconds.`);
  body.append(hull);

  /* ---- what is fitted ---- */
  const own = section(`FITTED · ${upgrades.owned.length}`);
  const lines = upgradeLines();
  if (!lines.length) note(own, "A stock hull. Nothing bolted on yet.");
  for (const l of lines) {
    const u = opts.find((o) => o.id === l.id);
    const r = row(own, l.name, { hint: l.effect, value: yard ? `${Math.round((u?.price ?? 0) * 0.5).toLocaleString()} cr back` : "" });
    if (yard) {
      const b = button("SELL", () => {
        const err = sellUpgrade(l.id);
        sim.notice = err ?? `${l.name} stripped — half back.`;
        paint();
      }, "danger");
      r.value.append(el("br"), b);
    }
  }
  body.append(own);

  /* ---- what this yard fits ---- */
  const cat = section(yard ? `REFIT YARD · ${st.name}` : "REFIT YARD");
  if (!yard) {
    note(cat, "Dock at a yard to refit. Each sector fits its own lines: industrial and military yards do power and plate, logistic and civilian yards do holds, masts and quarters.");
  } else {
    note(cat, `${st.sector[0].toUpperCase()}${st.sector.slice(1)} yard. ${sim.ship.credits.toLocaleString()} cr in hand.`);
    const here = opts.filter((o) => !o.owned && o.sector.includes(st.sector));
    const elsewhere = opts.filter((o) => !o.owned && !o.sector.includes(st.sector));
    if (!here.length) note(cat, "Nothing left on this yard's list.");
    for (const o of here) {
      const r = row(cat, o.name, { hint: `${o.blurb} ${effectOf(o)}`, value: `${o.price.toLocaleString()} cr` });
      const b = button(o.blocker ? o.blocker.toUpperCase() : "BUY", () => {
        const err = buyUpgrade(o.id, st);
        sim.notice = err ?? `${o.name} fitted.`;
        paint();
      }, o.blocker ? "" : "on");
      b.disabled = Boolean(o.blocker);
      r.value.append(el("br"), b);
    }
    if (elsewhere.length) {
      const other = section("OTHER YARDS");
      for (const o of elsewhere) row(other, o.name, { hint: effectOf(o), value: o.sector.join(" · ") });
      body.append(cat, other);
      return;
    }
  }
  body.append(cat);
}

/* The deck header's REPAIR chip (js/stationdeck.js): the whole shortfall, or as much as you can pay. */
export function wireDeckRepair(btn, after) {
  btn?.addEventListener("click", () => {
    const r = yardRepair();
    sim.notice = r.ok ? `${r.points} hull point${r.points === 1 ? "" : "s"} for ${r.cost.toLocaleString()} cr${r.why ? ` — ${r.why}` : " — hull whole"}.` : r.why;
    after?.();
  });
}

export function paintDeckRepair(btn, st) {
  if (!btn) return;
  const q = repairQuote(st);
  btn.classList.toggle("hidden", !(q.need > 0 && q.per > 0));
  if (q.need <= 0) return;
  const text = q.ok ? `REPAIR ${q.affordable} · ${(q.affordable * q.per).toLocaleString()} CR` : `REPAIR ${q.per} CR/PT`;
  if (btn.textContent !== text) btn.textContent = text;
  btn.disabled = !q.ok;
}

export default refitPanel;
