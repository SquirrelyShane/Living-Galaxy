/* LIVING GALAXY — CONSOLE › CORP › TOWN: the company's people, on the line.
 *
 * Was a read-only list (corp.js, to 0.3.45). Now every row opens the company
 * line to that person (js/staffline.js): what they say, what the two of you
 * last said, and what you can do about it from wherever you are — a bonus, a
 * bigger cut, a push for promotion, passage to another port or out to the
 * ship, a clean release. Above the towns is THE LINE: what they called about,
 * newest first, with the answers an ask would take right there on the row.
 */

import { button, el, note, row, section, setBar, chips } from "../kit.js";
import { sim } from "../../sim.js";
import { company, hasCompany } from "../../company.js";
import { townReport, townLog, townLine, roleAt } from "../../stationlife.js";
import { cradle, traitLine } from "../../npc/cradle.js";
import { sigil } from "../../ui/glyphs.js";
import {
  TOPICS, callTopic, cutOf, lineLog, lineState, lineSummary, markRead, openAsk,
  regardOf, staffById, topicById, unread, whereOf,
} from "../../staffline.js";

const view = { open: null, arm: null, move: null, said: null, scrolled: null };
const ago = (at) => { const s = Math.max(0, Math.round((sim.time ?? 0) - at)); return s < 90 ? `${s}s` : s < 5400 ? `${Math.round(s / 60)}m` : `${Math.round(s / 3600)}h`; };
const moodWord = (m) => (m >= 80 ? "flying" : m >= 65 ? "good" : m >= 52 ? "fine" : m >= 40 ? "worn thin" : "done with it");

function act(staffId, topicId, arg, render) {
  const r = callTopic(staffId, topicId, arg);
  view.said = r.ok ? { id: staffId, line: r.line } : { id: staffId, line: null, why: r.why };
  if (!r.ok) sim.notice = r.why;
  view.arm = null; view.move = null;
  if (!staffById(staffId)) view.open = null;
  render();
}

/** The open line to one person: who they are now, the transcript, what you can do. */
function lineCard(s, render) {
  const c = el("div", "tcard");
  const head = el("div", "head");
  const w = whereOf(s);
  const mood = Math.round(s.mood ?? 74);
  head.append(el("b", null, `${sigil(s.id)} ${s.name}`));
  head.append(el("small", null, [
    roleAt(s.role).label, w.text, `${s.cycles ?? 0} cycles`, `mood ${mood} · ${moodWord(mood)}`,
    `regard ${Math.round(regardOf(s))}`, (s.raises ?? 0) ? `cut +${Math.round((1 - cutOf(s)) * 100)}% theirs` : null,
    s.pronouns ? `${s.pronouns.subj}/${s.pronouns.obj}` : null,
  ].filter(Boolean).join(" · ")));
  const rec = cradle.get(s.id);
  if (rec) head.append(el("small", null, traitLine(rec)));
  c.append(head);
  const body = el("div", "body");
  c.append(body);

  /* the transcript, oldest at the top so it reads like a call */
  const log = lineLog(s, 6).slice().reverse();
  const tx = el("div", "in-talk-log");
  if (!log.length) tx.append(el("p", null, "Nothing said on the line yet."));
  for (const e of log) tx.append(el("p", e.who === "you" ? "you" : "them", `${e.who === "you" ? "You" : s.name.split(" ")[0]}: ${e.text}`));
  body.append(tx);
  if (view.said?.id === s.id && view.said.why) body.append(el("p", "hot", view.said.why));

  const ask = openAsk(s);
  if (ask && !ask.lapsed) body.append(el("p", "warm", `Asking: ${ask.asks.map((a) => topicById(a)?.label.toLowerCase()).join(", or ")}.`));

  const opts = el("div", "tgroup");
  for (const t of TOPICS) {
    const why = t.ok(s);
    const arming = t.confirm && view.arm === `${s.id}:${t.id}`;
    const label = arming ? `CONFIRM — ${t.label.toUpperCase()}` : t.label.toUpperCase();
    const b = button(label, () => {
      if (why) return;
      if (t.options) { view.move = view.move === s.id ? null : s.id; render(); return; }
      if (t.confirm && !arming) { view.arm = `${s.id}:${t.id}`; render(); return; }
      act(s.id, t.id, null, render);
    }, `tiny${ask && ask.asks.includes(t.id) && !ask.answered ? " accent" : ""}${t.confirm ? " danger" : ""}`);
    b.dataset.topic = t.id;
    b.title = why ?? t.hint(s);
    if (why) { b.disabled = true; b.classList.add("locked"); }
    opts.append(b);
  }
  body.append(opts);
  const hints = el("small", null, TOPICS.map((t) => `${t.label}: ${t.ok(s) ?? t.hint(s)}`).join(" · "));
  hints.className = "tline-hints";
  body.append(hints);

  if (view.move === s.id) {
    const t = topicById("move");
    const list = t.options(s);
    const ch = chips(list.map((o) => ({ id: o.id, label: `${o.label} · ${o.hint}` })), { onPick: (id) => act(s.id, "move", id, render) });
    body.append(ch.row);
  }
  return c;
}

export function mountTown(root, ctx = {}) {
  const host = el("div");
  root.append(host);
  if (ctx.focus && staffById(ctx.focus)) view.open = ctx.focus;
  let key = "";
  const render = () => {
    key = "";
    paint();
  };
  const signature = () => {
    const L = hasCompany() ? lineState() : { inbox: [] };
    return `${hasCompany()}:${company.staff.length}:${company.staff.map((s) => `${s.id}${Math.round(s.mood ?? 0)}${s.transit ? "t" : ""}${s.role}`).join(",")}:${L.inbox.length}:${unread()}:${view.open}:${view.arm}:${view.move}:${Math.floor((sim.time ?? 0) / 10)}`;
  };
  const paint = () => {
    const k = signature();
    if (k === key) return;
    key = k;
    host.replaceChildren();

    const head = section("COMPANY TOWNS");
    if (!hasCompany()) { note(head, "Register a charter and settle a hand at a port — that is how a company gets a town."); host.append(head); return; }
    note(head, townLine());
    const sum = lineSummary();
    if (sum) note(head, `The line: ${sum}. Tap LINE on anybody to call them — from anywhere in this sky.`);
    host.append(head);

    /* ---- THE LINE: they called you ---- */
    const L = lineState();
    if (L.inbox.length) {
      const inb = section(`THE LINE — ${unread()} unread`);
      for (const m of L.inbox.slice(0, 8)) {
        const s = staffById(m.staffId);
        const r = row(inb, `${m.read ? "" : "● "}${m.name}`, { hint: m.text, value: ago(m.at) });
        r.row.dataset.msg = m.id;
        if (!s) continue;
        const btns = [];
        if (m.asks && !m.answered && !m.lapsed) {
          for (const a of m.asks) {
            const t = topicById(a);
            if (!t) continue;
            if (t.options) { btns.push(button(t.label.toUpperCase(), () => { view.open = s.id; view.move = s.id; markRead(m.id); render(); }, "tiny accent")); continue; }
            const why = t.ok(s);
            const b = button(t.label.toUpperCase(), () => { markRead(m.id); act(s.id, a, null, render); }, "tiny accent");
            if (why) { b.disabled = true; b.classList.add("locked"); b.title = why; }
            btns.push(b);
          }
        } else if (m.answered) btns.push(el("span", "v good", "answered"));
        btns.push(button("LINE", () => { view.open = s.id; markRead(m.id); render(); }, "tiny"));
        r.value.replaceChildren(el("span", null, ago(m.at)), ...btns);
      }
      const clear = button("MARK ALL READ", () => { markRead(); render(); }, "tiny");
      inb.append(clear);
      host.append(inb);
    }

    const rows = townReport();
    if (!rows.length) {
      const e = section("ON THE ROLLS");
      note(e, "Nobody settled yet. CONSOLE › CREW › ROSTER, docked, to settle a hand and whoever is theirs.");
      host.append(e);
    }
    const byPort = new Map();
    for (const r of rows) {
      const k = r.s.transit ? "IN TRANSIT" : r.station;
      if (!byPort.has(k)) byPort.set(k, []);
      byPort.get(k).push(r);
    }
    for (const [port, list] of byPort) {
      const s = section(`${port.toUpperCase()} — ${list.length} on the rolls · ${list.reduce((a, r) => a + (r.s.transit ? 0 : Math.round(r.income * cutOf(r.s))), 0)} cr/cycle`);
      for (const r of list) {
        const bits = [r.role.label, `${r.cycles} cycles served`];
        if (r.s.transit) bits.push(whereOf(r.s).text);
        if (r.partner) bits.push(`with ${r.partner}`);
        if (r.children.length) bits.push(`${r.children.length} child${r.children.length === 1 ? "" : "ren"}: ${r.children.join(", ")}`);
        if (r.expecting != null) bits.push(`expecting in ${r.expecting}`);
        if (openAsk(r.s) && !openAsk(r.s).lapsed) bits.push("asking for something");
        if (r.risk) bits.push(r.risk);
        const row2 = row(s, `${r.s.name}${r.s.born ? " ·" : ""}`, { value: "", bar: true, hint: bits.join(" · ") });
        row2.row.dataset.focus = r.s.id;
        const open = view.open === r.s.id;
        row2.value.replaceChildren(el("span", null, `${Math.round(r.income * cutOf(r.s))} cr`), button(open ? "CLOSE" : "LINE", () => { view.open = open ? null : r.s.id; view.move = null; view.arm = null; render(); }, `tiny${openAsk(r.s) && !openAsk(r.s).lapsed ? " accent" : ""}`));
        setBar?.(row2.bar, r.mood / 100, r.mood < 45 ? "hot" : r.mood < 55 ? "warn" : "ok");
        if (open) row2.row.after(lineCard(r.s, render));
      }
      host.append(s);
    }

    const lg = section("THE TOWN LOG");
    const log = townLog(null, 16);
    if (!log.length) note(lg, "Quiet so far.");
    for (const e of log) row(lg, e.kind.replace(/-/g, " "), { hint: e.text, value: e.delta ? `${e.delta > 0 ? "+" : ""}${Math.round(e.delta)} cr` : "" });
    host.append(lg);
    if (view.open && view.scrolled !== view.open) { view.scrolled = view.open; host.querySelector(`[data-focus="${view.open}"]`)?.scrollIntoView?.({ block: "nearest" }); }
  };
  paint();
  ctx.push?.(paint);
}

export default mountTown;
