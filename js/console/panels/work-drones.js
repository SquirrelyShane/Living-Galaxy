/* LIVING GALAXY — CONSOLE › WORK › DRONES: the company's drones as cards.
 *
 * A straight port of the old command-deck DRONES tree (deck.js droneNode /
 * dronesBranch) into cards: one per drone with its status line, hold and hull,
 * the setup asks as chip rows (home / site / mode / work slots / routes /
 * guard / patrol through the ops.js setters), BEGIN · RECALL · RESUME · MARK ·
 * SCRAP; a build section when docked at a port with a line; the queue; and
 * the work board. Cards rebuild on any order (cheap), status text every frame.
 */

import { el, section, note, row, button, group, chips, card, pct, setBar } from "../kit.js";
import { addWaypointAt, sim } from "../../sim.js";
import { stationById } from "../../stations.js";
import { DRONE_ROLES, ASK_LABEL } from "../../drones/roles.js";
import {
  droneOps, buildOptions, orderBuild, queueAt, setHome, setSite, setMode, setGuard, addPatrol, clearPatrol, assignSlot, setRoute, beginWork, recall,
  scrapDrone, homeOptions, siteOptions, haulSlots, guardSlots, tradeRoutes, patrolOptions, statusLine, pendingAsks, holdOf,
} from "../../drones/ops.js";
import { company, hasCompany } from "../../company.js";
import { boardReport } from "../../drones/board.js";
import { npcDroneReport } from "../../drones/npcdrones.js";
import { TIERS, TIER_BY_ID, premiumFor } from "../../insurance.js";

const DOC = globalThis.document ?? null;
void DOC;

const tell = (msg) => { if (msg) { sim.notice = msg; sim.noticeAt = sim.wall; } };
const opened = new Set(); // drone ids whose setup rows are unfolded

/** One chip row for an ask: label, current pick, the options, the setter. */
function askRow(body, label, hint, opts, current, pick) {
  const r = row(body, label, { hint });
  r.value.textContent = current ?? "—";
  const list = opts.map((o) => ({ id: o.id, label: o.label, hint: o.hint ?? "" }));
  if (!list.length) { note(body, hint || "no options"); return; }
  body.append(chips(list, { value: current == null ? null : list.find((o) => o.label === current)?.id ?? null, onPick: (id) => { pick(opts.find((o) => o.id === id)); } }).row);
}

function droneCard(u, render, ctx) {
  const r = DRONE_ROLES[u.role];
  const asks = pendingAsks(u);
  const c = card(u.name, `${r.label} · ${u.designation}`);
  c.card.dataset.focus = u.id;
  const b = c.body;
  const st = row(b, "Status", { value: u.state === "setup" ? "SET UP" : u.state.toUpperCase(), hint: statusLine(u) });
  const hp = row(b, "Hull", { bar: true, value: pct(u.hp / u.hpMax) });
  setBar(hp.bar, u.hp / u.hpMax, u.hp / u.hpMax < 0.35 ? "hot" : "ok");
  let hold = null;
  if (u.holdCap) { hold = row(b, "Hold", { bar: true, value: `${Math.round(holdOf(u))}/${u.holdCap}` }); setBar(hold.bar, holdOf(u) / u.holdCap, "ok"); }
  const acts = [];
  if (u.state === "setup") acts.push(button(asks.length ? "BEGIN · DEFAULTS" : "BEGIN WORK", () => { beginWork(u); render(); }, "accent"));
  if (u.recalled) acts.push(button("RESUME", () => { beginWork(u); render(); }, "accent"));
  if (u.state !== "setup" && !u.recalled) acts.push(button("RECALL", () => { recall(u); render(); }));
  acts.push(button("MARK", () => { addWaypointAt(u.name, u.x, u.y, u.z); tell(`${u.name} marked.`); }));
  acts.push(button(opened.has(u.id) ? "ORDERS ▴" : "ORDERS ▾", () => { if (opened.has(u.id)) opened.delete(u.id); else opened.add(u.id); render(); }));
  acts.push(button("SCRAP 30%", () => { scrapDrone(u); render(); }, "danger"));
  b.append(group(...acts));
  if (asks.length) note(b, `Still to confirm: ${asks.map((a) => ASK_LABEL[a].toLowerCase()).join(", ")} — or BEGIN with the defaults.`);
  if (!opened.has(u.id) && !(u.state === "setup" && asks.length)) return c.card;
  /* the asks, as chip rows */
  const home = stationById(u.home)?.name ?? "—";
  askRow(b, ASK_LABEL.home, u.answered.home ? "" : "defaulted to where it was built — keep or change",
    [{ id: u.home, label: `Keep ${home}` }, ...homeOptions(u).filter((h) => h.id !== u.home).slice(0, 12).map((h) => ({ id: h.id, label: h.label, hint: `${h.sector} · ${h.km.toLocaleString()} km` }))],
    u.answered.home ? home : null, (o) => { setHome(u, o.id); render(); });
  const wantsSite = r.asks.includes("site") || u.role === "salvager" || u.role === "harvester";
  if (wantsSite) askRow(b, ASK_LABEL.site, u.answered.site ? "" : "where it begins work",
    siteOptions(u).slice(0, 16).map((o, i) => ({ id: i, label: o.label, hint: o.vein ? "surveyed vein" : o.kind === "body" ? "world" : "", o })),
    u.site?.label ?? null, (o) => { setSite(u, o.o); render(); });
  if (r.modes) askRow(b, ASK_LABEL.mode, "", Object.entries(r.modes).map(([m, label]) => ({ id: m, label })), u.mode ? r.modes[u.mode] : null, (o) => { setMode(u, o.id); render(); });
  if (u.role === "hauler") {
    const list = haulSlots(u);
    askRow(b, "Work slots", list.length ? "your miners first, then NPC freight" : "no open slots — build a miner, or wait for the ports to run short",
      list.map((sl, i) => ({ id: i, label: sl.label, hint: sl.kind === "miner" ? "shuttle its ore home" : `${sl.km?.toLocaleString?.() ?? "—"} km of legs`, sl })),
      u.assign ? (list.find((sl) => (sl.kind === "miner" && u.assign.id === sl.id) || (u.assign.from === sl.from && u.assign.to === sl.to && u.assign.good === sl.good))?.label ?? "TAKEN") : null,
      (o) => { assignSlot(u, o.sl); render(); });
  }
  if (u.role === "courier") {
    const list = tradeRoutes(u);
    askRow(b, "Trade routes", list.length ? "buy at one port, sell at another" : "no margin on the board — ports are balanced right now",
      list.map((rt, i) => ({ id: i, label: rt.label, hint: `margin ${Math.round(rt.margin * 100)}%`, rt })), u.route?.label ?? "AUTO", (o) => { setRoute(u, o.rt); render(); });
  }
  if (u.role === "combat" || u.role === "repair") askRow(b, u.role === "repair" ? ASK_LABEL.guard : "Guard slot", "your ship, a drone, a port or a mark",
    guardSlots(u).map((g, i) => ({ id: i, label: g.label, g })), u.guard?.label ?? null, (o) => { setGuard(u, o.g); render(); });
  if (u.role === "combat") {
    const pr = row(b, "Patrol route", { value: `${u.patrol.length} PTS`, hint: u.patrol.length ? u.patrol.map((p) => p.label).join(" → ") : "no points yet" });
    pr.value.append(button("CLEAR", () => { clearPatrol(u); render(); }, "danger tiny"));
    b.append(chips(patrolOptions().slice(0, 12).map((p, i) => ({ id: i, label: `+ ${p.label}`, p })), { value: null, onPick: (id) => { addPatrol(u, patrolOptions()[id]); render(); } }).row);
  }
  void ctx;
  return c.card;
}

function buildSection(render) {
  const st = sim.ship.dockedAt ? stationById(sim.ship.dockedAt) : null;
  const s = section(st ? `BUILD AT ${st.name.toUpperCase()}` : "BUILD");
  if (!st) {
    if (droneOps.queue.length) for (const j of droneOps.queue) row(s, `${DRONE_ROLES[j.role].label} drone at ${stationById(j.stId)?.name ?? "port"}`, { value: `${Math.max(0, Math.round(j.done - sim.time))}s` });
    else note(s, hasCompany() ? "Dock at a port with a drone line — industrial ports build miners, logistics haulers, military combat frames." : "Register a company at a port first; drones are company property.");
    return s;
  }
  if (!hasCompany()) note(s, "Drones are company property — register a company on the port deck's Crew tab first.");
  else row(s, `${company.name} treasury`, { value: `${Math.round(company.treasury).toLocaleString()} cr`, hint: "drones are bought and paid from here; their earnings land here" });
  const opts = buildOptions(st);
  if (!opts.length) note(s, "No drone lines here — industrial ports build miners, logistics haulers, military combat frames.");
  else {
    /* 0.3.33 — cover is chosen once and applies to the next commission, so a
     * phone is not asked for a tier on every build row. A drone is the one
     * hull in this game that has always been able to die for good, which is
     * why it is the one that most wanted insuring. */
    const cover = droneOps.cover ?? null;
    const t = TIER_BY_ID[cover];
    const cr = row(s, "Cover on new drones", {
      hint: t
        ? `${t.name} — pays ${Math.round(t.payout * 100)}% of the build price if the drone is lost. Premium is added to the commission.`
        : "None. A drone lost to raiders is simply gone, and the treasury eats it.",
    });
    cr.value.textContent = t ? t.name : "none";
    cr.value.style.color = t?.hue ?? "";
    s.append(chips(
      [{ id: "none", label: "NONE", hint: "no cover" },
        ...TIERS.map((x) => ({ id: x.id, label: x.name.toUpperCase(), hint: `${Math.round(x.payout * 100)}% back · ${Math.round(x.rate * 100)}% premium` }))],
      { value: cover ?? "none", onPick: (id) => { droneOps.cover = id === "none" ? null : id; render(); } },
    ).row);
  }
  for (const o of opts) {
    const prem = droneOps.cover ? premiumFor(o.price, droneOps.cover) : 0;
    const total = o.price + prem;
    const r = row(s, `${o.label} · ${total.toLocaleString()} cr`, {
      hint: o.blocker ?? `${o.design.designation} ${o.design.career.toLowerCase()} frame · ${o.secs}s${prem ? ` · incl. ${prem.toLocaleString()} cr ${TIER_BY_ID[droneOps.cover].name.toLowerCase()} cover` : ""} · ${o.blurb}`,
    });
    r.value.append(button(o.blocker ? "✕" : "BUILD", () => {
      const res = orderBuild(o.role, st, droneOps.cover ?? null);
      tell(res.ok ? `${o.label} drone on the line — ${o.secs} s.${prem ? ` ${TIER_BY_ID[droneOps.cover].name} cover written.` : ""}` : res.why);
      render();
    }, o.blocker ? "" : "accent"));
  }
  for (const j of queueAt(st.id)) row(s, `On the line: ${DRONE_ROLES[j.role].label} drone`, { value: `${Math.max(0, Math.round(j.done - sim.time))}s` });
  return s;
}

function boardSection() {
  const s = section("WORK BOARD");
  const held = boardReport();
  const cds = npcDroneReport();
  if (!held.length && !cds.length) note(s, "Nothing on the board — no claims held, no corporate drones in this sky.");
  for (const h of held) {
    const mine = droneOps.units.find((u) => u.id === h.who);
    row(s, h.key.replace(/^freight:/, "freight · ").replace(/:/g, " → "), { value: `${Math.round(h.left / 60)}m`, hint: `held by ${mine ? mine.name : h.who.startsWith("cd:") ? "a corporation's drone" : h.who}` });
  }
  for (const c of cds.filter((x) => x.state !== "docked").slice(0, 12)) row(s, c.name, { value: c.state.toUpperCase(), hint: `${c.corp} · ${c.note}${c.assign ? ` · ${c.assign}` : ""}` });
  return s;
}

export default {
  id: "work-drones",
  title: "DRONES",
  order: 40,
  subtabs: [],
  mount(root, ctx) {
    const host = el("div", "tdrones");
    root.append(host);
    let sig = "";
    const signature = () => `${sim.ship.dockedAt}|${droneOps.queue.length}|${droneOps.units.map((u) => `${u.id}:${u.state}:${u.recalled ? 1 : 0}:${pendingAsks(u).length}`).join(",")}`;
    const render = () => {
      sig = signature();
      host.replaceChildren();
      host.append(buildSection(render));
      const s = section(`DRONES — ${droneOps.units.length}`);
      if (!droneOps.units.length) note(s, "No drones yet.");
      for (const u of droneOps.units) s.append(droneCard(u, render, ctx));
      host.append(s, boardSection());
    };
    if (ctx?.focus) opened.add(ctx.focus);
    render();
    ctx?.push?.(() => {
      if (signature() !== sig) { render(); return; }
      for (const u of droneOps.units) {
        const c = host.querySelector(`[data-focus="${u.id}"]`);
        if (!c) continue;
        const st = c.querySelector(".trow .k small");
        if (st) st.textContent = statusLine(u);
        const hp = c.querySelectorAll(".tbar > b")[0];
        if (hp) hp.style.width = pct(u.hp / u.hpMax);
        const hold = c.querySelectorAll(".tbar > b")[1];
        if (hold && u.holdCap) hold.style.width = pct(holdOf(u) / u.holdCap);
      }
    });
    return null;
  },
  paint() {},
  unmount() {},
  search() {
    return droneOps.units.map((u) => ({ label: u.name, hint: `${DRONE_ROLES[u.role].label} drone · ${u.state}`, sub: "drones", focus: u.id, keywords: `drone ${u.role} ${u.designation}`, status: () => (u.state === "setup" ? "SET UP" : u.state.toUpperCase()) }));
  },
};
