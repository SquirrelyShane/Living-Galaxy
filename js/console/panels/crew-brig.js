/* Living Galaxy — CONSOLE › CREW › BRIG.
 *
 * Whoever you took, and what you are doing about them. Two bars that move in
 * opposite directions if you are careless: how far they are from giving you
 * anything, and what they make of you. Everything on the humane side moves
 * both the right way, slowly. Everything on the hard side buys the first with
 * the second — which is fine if you only ever wanted the ticket cashed.
 *
 */

import { el, section, note, row, button, group, chips, setBar, card } from "../kit.js";
import { sim } from "../../sim.js";
import { genderMark } from "../../crew.js";
import { boarding } from "../../interior/boarding.js";
import { corpById } from "../../corps.js";
import { captives, INTERACTIONS, canInteract, interact, canRecruit, recruit, guardStrength, RESIST_WORD, REGARD_WORD, RECRUIT_RESISTANCE, RECRUIT_REGARD } from "../../crew/captive.js";
import { deliver, release, ransom, brigBerths } from "../../npc/bounty.js";

const view = { openId: null, showHard: false };

export function mountBrig(root, ctx) {
  const head = section("BRIG");
  note(head, "A ticket is a person. What you do with the days you hold them decides which of the three doors they leave by.");
  const cells = row(head, "Cells", { value: "—", hint: "a refit adds more" });
  const watch = row(head, "Watch on them", { value: "—", bar: true, hint: "crew and marshals aboard; a thin watch is an open hatch" });
  root.append(head);

  const list = el("div");
  root.append(list);

  let key = "";
  const rebuild = () => { key = ""; paint(); };
  const paint = () => {
    const rows = captives();
    cells.value.textContent = `${boarding.brig.length} / ${brigBerths()}`;
    const g = guardStrength();
    watch.value.textContent = g.toFixed(2);
    setBar(watch.bar, Math.min(1, g / 2.2), g < 0.8 ? "hot" : g < 1.4 ? "warn" : "ok");

    const k = rows.map(({ p, st }) => `${p.id}:${Math.round(st.resistance)}:${Math.round(st.regard)}:${Math.round(st.health)}:${st.cycles}:${st.outOfCell ? 1 : 0}`).join("|")
      + `|${view.openId}|${view.showHard}|${sim.ship?.dockedAt ?? ""}`;
    if (k === key) return;
    key = k;
    list.innerHTML = "";
    if (!rows.length) {
      list.append(el("div", "tempty", "Nobody in the brig. The Marshal's board is on CORP › MARSHAL."));
      return;
    }
    for (const r of rows) list.append(captiveCard(r, rebuild));
  };
  ctx.push(paint);
}

function captiveCard({ p, st }, rebuild) {
  const owner = p.ownerCorp ? corpById(p.ownerCorp) : null;
  const c = card(p.name, `${p.charge ?? "boarding this hull"}${genderMark(p)}${owner ? ` · ${owner.name}` : ""}`);
  c.card.dataset.id = p.id;

  const res = row(c.body, "Resistance", { value: `${Math.round(st.resistance)} · ${RESIST_WORD(st.resistance)}`, bar: true, hint: `an offer needs ${RECRUIT_RESISTANCE} or under` });
  setBar(res.bar, st.resistance / 100, st.resistance > RECRUIT_RESISTANCE ? "hot" : "ok");
  const reg = row(c.body, "What they make of you", { value: `${Math.round(st.regard)} · ${REGARD_WORD(st.regard)}`, bar: true, hint: `an offer needs ${RECRUIT_REGARD} or over` });
  setBar(reg.bar, st.regard / 100, st.regard < 30 ? "hot" : st.regard < RECRUIT_REGARD ? "warn" : "ok");
  const hp = row(c.body, "Condition", { value: `${Math.round(st.health)}%`, bar: true, hint: st.health < 35 ? "no Marshal will take them like this" : st.outOfCell ? "out of the cell" : "in the cell" });
  setBar(hp.bar, st.health / 100, st.health < 35 ? "hot" : st.health < 70 ? "warn" : "ok");
  row(c.body, "Held", { value: `${st.cycles} cycle${st.cycles === 1 ? "" : "s"}`, hint: p.bounty ? `ticket pays ${p.bounty} cr` : "no ticket on them" });

  const open = view.openId === p.id;
  const acts = [
    button(open ? "CLOSE" : "OPEN CELL", () => { view.openId = open ? null : p.id; rebuild(); }, open ? "" : "accent"),
  ];
  const rc = canRecruit(p);
  acts.push(button(rc.ok ? `OFFER A BERTH · ${Math.round(rc.chance * 100)}%` : "OFFER A BERTH", () => {
    const r = recruit(p);
    sim.notice = r.ok ? (r.signed ? `${p.name} has signed on.` : `${p.name} turned it down.`) : r.why;
    rebuild();
  }, rc.ok ? "accent" : ""));
  if (!rc.ok) acts[acts.length - 1].disabled = true;
  if (sim.ship?.dockedAt) {
    acts.push(button("HAND OVER", () => { const r = deliver(p.id); sim.notice = r.ok ? `${p.name} handed over — ${r.pay} cr.` : r.why; rebuild(); }));
    acts.push(button("SELL BACK", () => { const r = ransom(p.id); sim.notice = r.ok ? `Ransomed — ${r.pay} cr.` : r.why; rebuild(); }));
  }
  acts.push(button("LET THEM GO", () => { release(p.id); sim.notice = `${p.name} walked.`; rebuild(); }, "danger"));
  c.body.append(group(...acts));

  if (open) {
    const care = INTERACTIONS.filter((a) => a.kind === "care");
    const hard = INTERACTIONS.filter((a) => a.kind === "hard");
    c.body.append(el("div", "tlabel", "WHAT YOU CAN DO"));
    for (const a of care) c.body.append(actionRow(p, a, rebuild));
    c.body.append(chips([{ id: "no", label: "HIDE THE OTHER WAY" }, { id: "yes", label: "SHOW IT" }], {
      value: view.showHard ? "yes" : "no", onPick: (v) => { view.showHard = v === "yes"; rebuild(); },
    }).row);
    if (view.showHard) {
      c.body.append(el("div", "tlabel", "THE OTHER WAY"));
      note(c.body, "Faster, and it ends any chance of them signing on. A Marshal will still take them; nobody else will.");
      for (const a of hard) c.body.append(actionRow(p, a, rebuild));
    }
    if (st.log.length) {
      c.body.append(el("div", "tlabel", "THE BOOK"));
      const ul = el("ul", "tlog");
      for (const x of st.log.slice(0, 6)) {
        const li = el("li");
        li.append(el("i", null, `C${Math.round(x.t / 90)}`), el("span", null, x.line));
        ul.append(li);
      }
      c.body.append(ul);
    }
  }
  return c.card;
}

function actionRow(p, a, rebuild) {
  const can = canInteract(p, a.id);
  const wrap = el("div", "trow");
  const k = el("div", "k");
  k.append(document.createTextNode(a.label));
  k.append(el("small", null, can.ok ? a.why : `${a.why} — ${can.why}`));
  const v = el("div", "v");
  const b = button(a.cost ? `${a.cost} cr` : "DO", () => {
    const r = interact(p, a.id);
    sim.notice = r.ok ? (r.escaped ? `${p.name} is off the ship.` : r.line) : r.why;
    rebuild();
  }, a.kind === "hard" ? "danger" : "");
  if (!can.ok) b.disabled = true;
  v.append(b);
  wrap.append(k, v);
  return wrap;
}

export { view as brigView };
