/* Living Galaxy — CONSOLE › CREW › GDB: the Galactic Database (0.3.54).
 *
 * Everyone the galaxy has produced, on one page: the census at the top (how
 * many, how many peoples, how many still alive — and the number of names two
 * people share, which should read nought), a search over name, number,
 * people, trade and title, the filters a researcher would reach for, a card
 * per person with their record, and the CHRONICLE — every line the ledger's
 * histories hold, newest first. It reads js/gdb.js and changes nothing.
 */

import { el, section, note, row, button, chips, card } from "../kit.js";
import { sim } from "../../sim.js";
import { stationById } from "../../stations.js";
import { traffic } from "../../npc/traffic.js";
import { describeNPC } from "../../npc/cradle.js";
import { census, search, entryOf, chronicle, raceName } from "../../gdb.js";

const view = { q: "", filter: "sky", open: null, page: 0 };
const PAGE = 30;

const FILTERS = [
  { id: "sky", label: "THIS SKY" },
  { id: "all", label: "GALAXY" },
  { id: "captain", label: "CAPTAINS" },
  { id: "crew", label: "CREWS" },
  { id: "hall", label: "HALLS" },
  { id: "born", label: "BORN" },
  { id: "dead", label: "DEAD" },
];

const KIND_WORD = { captain: "captain", crew: "hull crew", hall: "hiring hall", born: "born", mark: "wanted", pilot: "pilot", boarder: "boarder", person: "on file" };

function placeName(id) {
  if (!id) return "—";
  const st = stationById(id);
  if (st) return st.name;
  const v = traffic.find((x) => x.id === id);
  if (v) return v.name;
  if (String(id).startsWith("flow:")) return "a flow boat";
  return String(id);
}

const when = (ms) => {
  if (!ms) return "—";
  const d = new Date(ms);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

function personCard(id) {
  const e = entryOf(id);
  if (!e) return el("div", "tempty", "Not on file.");
  const c = card(`${e.name}`, `${e.no} · ${raceName(e.raceId)}${e.title ? ` · ${e.title}` : ""}`);
  c.card.dataset.gdbCard = id;
  row(c.body, "Status", { value: e.status === "dead" ? "deceased" : "living", hint: e.rec?.status ?? KIND_WORD[e.kind] ?? e.kind });
  row(c.body, "Filed", { value: when(e.at), hint: KIND_WORD[e.kind] ?? e.kind });
  row(c.body, "Last seen", { value: placeName(e.place), hint: when(e.seen) });
  if (e.rec) {
    note(c.body, describeNPC(e.rec));
    const hist = (e.rec.history ?? []).slice(-6).reverse();
    if (hist.length) {
      const log = el("div", "in-talk-log");
      for (const h of hist) log.append(el("p", null, `${when(h.at)} — ${h.text}`));
      c.body.append(log);
    }
  } else {
    note(c.body, "Catalogued, no full record — somebody the galaxy has met but nobody has sat down with yet. Hire them, or meet them again, and the ledger opens a file.");
  }
  return c.card;
}

export function mountGdb(root, ctx) {
  const head = section("GALACTIC DATABASE");
  note(head, "Every person this galaxy has produced, catalogued once: one name to one person, a number that is the same on every device, and the record of what became of them.");
  const stats = el("div");
  head.append(stats);
  const input = el("input", "tinput");
  input.type = "search";
  input.placeholder = "name, GDB number, people, trade…";
  input.value = view.q;
  input.autocapitalize = "none";
  input.setAttribute("aria-label", "Search the GDB");
  input.addEventListener("input", () => { view.q = input.value; view.page = 0; key = ""; paint(); });
  head.append(input);
  const fc = chips(FILTERS, { value: view.filter, onPick: (id) => { view.filter = id; view.page = 0; view.open = null; key = ""; paint(); } });
  head.append(fc.row);
  const list = section("ON FILE");
  const chron = section("THE CHRONICLE");
  root.append(head, list, chron);

  let key = "";
  let lastAt = -1e9;
  const paint = () => {
    /* the catalogue is hundreds of people: read it when asked, or every two seconds */
    const now = globalThis.performance?.now?.() ?? Date.now();
    if (key && now - lastAt < 2000) return;
    lastAt = now;
    const sky = view.filter === "all" ? null : sim.skySeed ?? null;
    const opts = { sky, limit: PAGE, offset: view.page * PAGE };
    if (["captain", "crew", "hall", "born"].includes(view.filter)) opts.kind = view.filter;
    if (view.filter === "dead") opts.alive = false;
    const res = search(view.q, opts);
    const k = `${view.q}|${view.filter}|${view.page}|${view.open}|${res.total}|${res.rows[0]?.id ?? ""}`;
    if (k === key) return;
    key = k;

    const c = census({ sky });
    stats.replaceChildren();
    row(stats, "Catalogued", { value: c.total.toLocaleString(), hint: `${c.alive.toLocaleString()} living · ${c.dead.toLocaleString()} deceased · ${c.full.toLocaleString()} full records` });
    row(stats, "Peoples", { value: String(c.peoples), hint: Object.entries(c.byRace).sort((a, b) => b[1] - a[1]).slice(0, 6).map(([r, n]) => `${raceName(r)} ${n}`).join(" · ") });
    row(stats, "Names shared", { value: String(c.sharedNames), hint: c.sharedNames ? "two people on file answer to the same name" : "no two people on file answer to the same name" });

    list.replaceChildren(list.firstChild);
    list.firstChild.textContent = `ON FILE — ${res.total.toLocaleString()}${res.total > PAGE ? ` · ${view.page * PAGE + 1}–${Math.min(res.total, (view.page + 1) * PAGE)}` : ""}`;
    if (!res.rows.length) list.append(el("div", "tempty", view.q ? "Nobody on file matches that." : "Nobody catalogued here yet."));
    for (const e of res.rows) {
      const r = row(list, `${e.status === "dead" ? "† " : ""}${e.name}`, { hint: `${e.no} · ${raceName(e.raceId)}${e.title ? ` · ${e.title}` : ""} · ${KIND_WORD[e.kind] ?? e.kind} · ${placeName(e.place)}` });
      r.row.dataset.gdb = e.id;
      const open = view.open === e.id;
      r.value.replaceChildren(button(open ? "CLOSE" : "FILE", () => { view.open = open ? null : e.id; key = ""; paint(); }, `tiny${open ? " accent" : ""}`));
      if (open) r.row.after(personCard(e.id));
    }
    if (res.total > PAGE) {
      const pages = el("div", "tgroup");
      const prev = button("◀ NEWER", () => { view.page = Math.max(0, view.page - 1); key = ""; paint(); }, "tiny");
      const next = button("OLDER ▶", () => { view.page++; key = ""; paint(); }, "tiny");
      if (view.page === 0) prev.disabled = true;
      if ((view.page + 1) * PAGE >= res.total) next.disabled = true;
      pages.append(prev, next);
      list.append(pages);
    }

    chron.replaceChildren(chron.firstChild);
    const lines = chronicle(18, { sky });
    if (!lines.length) chron.append(el("div", "tempty", "Nothing written yet."));
    const log = el("div", "in-talk-log");
    for (const l of lines) log.append(el("p", null, `${when(l.at)} · ${l.name} — ${l.text}`));
    if (lines.length) chron.append(log);
  };
  paint();
  ctx.push?.(paint);
}

export default mountGdb;
