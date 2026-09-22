/* Living Galaxy — CONSOLE › CREW › SKY: the other hundred and sixty watches.
 *
 * Every hull on the board has people on it now. This is where you read them:
 * nearest first, what kind of run they are on, how the watch is holding up,
 * how far behind the hull's maintenance is, and — for the ones close enough
 * to overhear — the last thing their deck actually decided and why.
 *
 * It is a listening post, not a control panel. Nothing here gives orders to
 * another ship's crew; the only thing you can do about a sour watch is dock
 * where they are about to walk off and be the better berth.
 *
 */

import { el, section, note, row, button, chips, setBar, card } from "../kit.js";
import { sim } from "../../sim.js";
import { traffic } from "../../npc/traffic.js";
import { npcCrews, moodOf, vesselJournal, NEAR_U, DESERT_AT, STRIKE_AT, WORK_BUDGET } from "../../npc/npccrew.js";
import { fmtDist } from "../kit.js";

const view = { filter: "near", openId: null };

const FILTERS = [
  { id: "near", label: "NEAREST" },
  { id: "sour", label: "SOUR" },
  { id: "hostile", label: "PIRATES" },
  { id: "all", label: "ALL" },
];

const moodTone = (m) => (m == null ? "warn" : m < STRIKE_AT ? "hot" : m < DESERT_AT ? "hot" : m < 50 ? "warn" : "ok");
const moodWord = (m) => (m == null ? "unread" : m < STRIKE_AT ? "struck" : m < DESERT_AT ? "sour" : m < 50 ? "grumbling" : m < 75 ? "steady" : "good");

function distOf(v) {
  const p = sim.ship?.pos;
  if (!p || v.x == null) return Infinity;
  return Math.hypot(v.x - p.x, v.y - p.y, v.z - p.z);
}

function rows() {
  const list = traffic.filter((v) => v.crewList?.length || v.derelict);
  const withD = list.map((v) => ({ v, d: distOf(v), mood: v.mood ?? moodOf(v) }));
  const f = view.filter;
  const kept = withD.filter(({ v, mood }) => {
    if (f === "sour") return v.derelict || v.strike || v.mutinied || (mood != null && mood < DESERT_AT);
    if (f === "hostile") return v.role === "pirate" || v.mutinied;
    return true;
  });
  kept.sort((a, b) => a.d - b.d);
  return f === "all" ? kept : kept.slice(0, 12);
}

function vesselCard(e, rebuild) {
  const { v, d, mood } = e;
  const c = card(v.name, `${v.role}${v.hullName ? ` · ${v.hullName}` : ""} · ${Number.isFinite(d) ? fmtDist(d) : "off the board"}`);
  c.card.dataset.id = v.id;
  if (v.derelict) {
    note(c.body, "A hulk. Nobody came back for it.");
    return c.card;
  }
  const watch = row(c.body, "Watch", { value: `${moodWord(mood)} · ${mood ?? "—"}`, bar: true, hint: `${v.crewList.length} aboard` });
  setBar(watch.bar, (mood ?? 0) / 100, moodTone(mood));
  const wear = row(c.body, "Hull backlog", { value: `${Math.round((v.wear ?? 0) * 100)}%`, bar: true, hint: v.strike ? "nobody is working it" : "" });
  setBar(wear.bar, v.wear ?? 0, (v.wear ?? 0) > 0.6 ? "hot" : (v.wear ?? 0) > 0.3 ? "warn" : "ok");
  if (v.payShort) row(c.body, "Pay", { value: "behind", hint: "the hull has not been earning" });
  if (v.mutinied) note(c.body, "The crew are flying it themselves now. The captain is in the hold.");

  const near = d < NEAR_U;
  c.body.append(button(view.openId === v.id ? "LOG ▾" : "LOG", () => { view.openId = view.openId === v.id ? null : v.id; rebuild(); }));
  if (view.openId === v.id) {
    const log = el("div");
    if (!near) {
      log.append(el("div", "tempty", "Too far out to overhear. Close to sensor range and their deck reads back."));
    } else {
      const recs = vesselJournal(v, 4);
      if (!recs.length) log.append(el("div", "tempty", "Nothing filed from this deck yet — it has been drifting, not deciding."));
      for (const r of recs) {
        const chain = r.whatMadeMeActThis.reasoning;
        const why = chain[chain.length - 2] ?? chain[chain.length - 1] ?? "";
        const line = el("div", "tfx", `${r.agent.name} — ${r.action.label}. ${why}`);
        log.append(line);
      }
      if ((v.crewLog ?? []).length) {
        log.append(el("div", "tlabel", "OVERHEARD"));
        const ul = el("ul", "tlog");
        for (const x of v.crewLog.slice(0, 4)) {
          const li = el("li");
          li.append(el("i", null, `${Math.round(x.t)}s`), el("span", null, x.msg));
          ul.append(li);
        }
        log.append(ul);
      }
    }
    c.body.append(log);
  }
  return c.card;
}

export function mountSky(root, ctx) {
  const head = section("THE SKY");
  note(head, "Every hull out there is carrying people. This is what their watches look like from here.");
  const budget = row(head, "Simulated", { value: "—", hint: `a fixed ${WORK_BUDGET} full watches a cycle, nearest first; the rest drift` });
  const built = row(head, "Crews on file", { value: "—" });
  root.append(head);

  const listSec = section("WATCHES");
  listSec.append(chips(FILTERS, { value: view.filter, onPick: (id) => { view.filter = id; view.openId = null; key = ""; paint(); } }).row);
  const list = el("div");
  listSec.append(list);
  root.append(listSec);

  const evSec = section("WHAT CAME OVER THE BAND");
  const evBody = el("div");
  evSec.append(evBody);
  root.append(evSec);

  let key = "";
  const rebuild = () => { key = ""; paint(); };
  const paint = () => {
    budget.value.textContent = `${npcCrews.stepped} stood · ${npcCrews.drifted} drifted`;
    built.value.textContent = `${npcCrews.built} hulls · ${npcCrews.people} hands`;
    const rs = rows();
    const k = rs.map((e) => `${e.v.id}:${e.mood}:${Math.round((e.v.wear ?? 0) * 20)}:${e.v.strike ? 1 : 0}:${e.v.derelict ? 1 : 0}`).join("|") + `|${view.openId}|${view.filter}|${npcCrews.events.length}`;
    if (k === key) return;
    key = k;
    list.innerHTML = "";
    if (!rs.length) list.append(el("div", "tempty", "No crewed hulls on the board yet — they build nearest first."));
    for (const e of rs) list.append(vesselCard(e, rebuild));
    evBody.innerHTML = "";
    if (!npcCrews.events.length) evBody.append(el("div", "tempty", "Quiet out there."));
    const ul = el("ul", "tlog");
    for (const e of npcCrews.events.slice(0, 10)) {
      const li = el("li", e.kind === "mutiny" || e.kind === "derelict" ? "combat" : "");
      li.append(el("i", null, e.kind.toUpperCase()), el("span", null, e.text));
      ul.append(li);
    }
    if (npcCrews.events.length) evBody.append(ul);
  };
  ctx.push(paint);
}

export { view as skyView };
