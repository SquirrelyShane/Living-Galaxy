/* Living Galaxy — CONSOLE › CORP › MARSHAL: the bounty board.
 *
 * Every mark here is wanted alive and belongs to somebody. The board shows
 * both halves of the arithmetic before you sign anything: what the ticket pays,
 * and whose standing it costs. Taking one is a job; taking four off the same
 * desk is picking a side.
 *
 */

import { el, section, note, row, button, group, chips, setBar, card } from "../kit.js";
import { sim } from "../../sim.js";
import { stationById } from "../../stations.js";
import { corpById, standingLabel } from "../../corps.js";
import { bounty, boardAt, takeTicket, abandonTicket, ticketsHeld, attemptCapture, canAttempt, captureStrength, markStrength, brigBerths, tickPlayerPrice, LIFT_COST } from "../../npc/bounty.js";
import { boarding } from "../../interior/boarding.js";

const view = { tab: "board" };
const TIER_CLS = { petty: "", standing: "warn", sealed: "danger" };

export function mountMarshal(root, ctx) {
  const head = section("MARSHAL'S OFFICE");
  const where = row(head, "Desk", { value: "—", hint: "dock at a lawful port to read the board" });
  const held = row(head, "Tickets signed", { value: "—", hint: "three to a hull" });
  const cells = row(head, "Brig", { value: "—" });
  const price = row(head, "On this hull", { value: "—", hint: "what you are worth to somebody else" });
  root.append(head);

  const body = el("div");
  head.append(chips([{ id: "board", label: "THE BOARD" }, { id: "held", label: "MY TICKETS" }], {
    value: view.tab, onPick: (v) => { view.tab = v; key = ""; paint(); },
  }).row);
  root.append(body);

  let key = "";
  const rebuild = () => { key = ""; paint(); };
  const paint = () => {
    const st = stationById(sim.ship?.dockedAt);
    const marks = st ? boardAt(st) : [];
    const mine = ticketsHeld();
    tickPlayerPrice();
    where.value.textContent = st ? st.name : "not docked";
    held.value.textContent = `${mine.length} / 3`;
    cells.value.textContent = `${boarding.brig.length} / ${brigBerths()}`;
    price.value.textContent = bounty.playerPrice ? `${bounty.playerPrice} cr` : "nothing";

    const k = `${view.tab}|${st?.id ?? ""}|${marks.map((m) => `${m.id}${m.gone ? 1 : 0}`).join()}|${mine.map((t) => `${t.id}${t.attempted ? 1 : 0}`).join()}|${boarding.brig.length}`;
    if (k === key) return;
    key = k;
    body.innerHTML = "";

    if (view.tab === "held") {
      if (!mine.length) body.append(el("div", "tempty", "No tickets signed. The board is at any lawful port."));
      for (const t of mine) body.append(markCard(t, rebuild, true));
      if (bounty.log.length) {
        const l = section("THE DESK'S BOOK");
        const ul = el("ul", "tlog");
        for (const x of bounty.log.slice(0, 8)) {
          const li = el("li");
          li.append(el("i", null, `C${Math.round(x.t / 90)}`), el("span", null, x.text));
          ul.append(li);
        }
        l.append(ul);
        body.append(l);
      }
      return;
    }

    if (!st) { body.append(el("div", "tempty", "Dock at a lawful port and the board is on the wall.")); return; }
    if (st.sector === "pirate") { body.append(el("div", "tempty", "There is no Marshal here. There is a different board, and it is not on the wall.")); return; }
    note(body, `Issued by ${marks[0]?.issuerName ?? "the office"}. Every name here is wanted alive.`);
    for (const m of marks) body.append(markCard(m, rebuild, false));
  };
  ctx.push(paint);
}

function markCard(m, rebuild, mine) {
  const owner = m.ownerCorp ? corpById(m.ownerCorp) : null;
  const c = card(m.name, `${m.chargeLabel} · ${m.tier}`);
  c.card.classList.add("tlogcard");
  row(c.body, "Pays", { value: `${m.pay} cr`, hint: `signed by ${m.issuerName}` });
  row(c.body, "Flies for", { value: owner?.name ?? "nobody", hint: owner ? `standing ${Math.round(owner.standing)} · ${standingLabel(owner.standing)}` : "" });
  row(c.body, "Costs you", { value: `−${Math.round(LIFT_COST * (m.heat ?? 1))} with ${owner?.name ?? "them"}`, hint: "and a share of that with everyone flying the same flag — it does not come back" });
  row(c.body, "Holed up", { value: m.holedName, hint: m.gone ? "gone — somebody else got there" : "dock there to go after them" });

  if (mine) {
    const can = canAttempt(m);
    const mineS = captureStrength(), theirs = markStrength(m);
    const odds = mineS / (mineS + theirs);
    const bar = row(c.body, "If you went now", { value: `${Math.round(odds * 100)}%`, bar: true, hint: `your ${mineS} against their ${theirs} — crew with security in them is what moves this` });
    setBar(bar.bar, odds, odds > 0.6 ? "ok" : odds > 0.35 ? "warn" : "hot");
    const acts = [];
    const go = button("GO AND GET THEM", () => {
      const r = attemptCapture(m);
      sim.notice = r.ok ? (r.taken ? `${m.name} is in the brig.` : r.gone ? `${m.name} was gone.` : `${m.name} got away from you.`) : r.why;
      rebuild();
    }, can.ok ? "accent" : "");
    if (!can.ok) { go.disabled = true; note(c.body, can.why); }
    acts.push(go);
    acts.push(button("HAND IT BACK", () => { abandonTicket(m.id); rebuild(); }, "danger"));
    c.body.append(group(...acts));
  } else {
    const b = button("SIGN FOR IT", () => { const e = takeTicket(m); sim.notice = e ?? `Ticket signed for ${m.name}.`; rebuild(); }, TIER_CLS[m.tier] || "accent");
    if (m.gone) b.disabled = true;
    c.body.append(group(b));
  }
  return c.card;
}

export { view as marshalView };
