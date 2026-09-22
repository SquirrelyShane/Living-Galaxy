/* LIVING GALAXY — CONSOLE › MARKET: PORT · HOLD · REFIT
 *
 * The nearest port and, docked, the one market implementation (`marketBlock`,
 * shared with the station deck); the hold with jettison and the ice bench;
 * the refit yard fragment from package D, or the owned-upgrade list; and
 * (0.3.19) ROUTES — where the money is in moving goods from here, with FLY IT.
 */

import { button, el, group, note, row, section, setBar, fmtDist } from "../kit.js";
import { good, goodName } from "../../materials.js";
import { MODES as ICE_MODES, cycleIceworkMode, icework, iceworkFit } from "../../icework.js";
import { cargoTotal } from "../../ship.js";
import { buyPriceAt, canSmeltAt, claimPort, jettison, portLedger, portWants as simPortWants, sellAllOre, sellPriceAt, sim, smeltAll, stashAt, stashDeposit, stashWithdraw, stationStatus, toggleDock, tradeBuy, tradeSell } from "../../sim.js";
import { stationById } from "../../stations.js";
import { refitPanel } from "../../refityard.js";
import { upgradeLines } from "../../upgrades.js";
import { tradeRoutes, routeLine } from "../../traderoutes.js";
import { makeMission, makeStep, presets } from "../../mission/script.js";
import { startMission } from "../../mission/run.js";
import { addWaypointAt } from "../../sim.js";

const DOC = globalThis.document ?? null;
const YARD_SECTORS = ["industrial", "military"];

/* ---- the one market ------------------------------------------------------- */

/* Station-deck builders: the defaults, so the deck's look is unchanged. */
const SD = {
  sec(title) { const s = el("div", "sd-sec"); s.append(el("h4", null, title)); return s; },
  row(parent, label, hint) {
    const r = el("div", "sd-row");
    const l = el("div", "sd-lab");
    l.append(el("b", null, label));
    if (hint) l.append(el("small", null, hint));
    const v = el("div", "sd-val");
    r.append(l, v);
    parent.append(r);
    return v;
  },
  btn(text, fn, cls = "") { const b = el("button", `sd-btn ${cls}`, text); b.type = "button"; b.addEventListener("click", fn); return b; },
  note(parent, text, warn = false) { parent.append(el("p", `sd-note${warn ? " sd-warn" : ""}`, text)); },
  empty(parent, text) { parent.append(el("p", "sd-empty", text)); },
  cr(text) { return el("span", "sd-cr", text); },
  tag(text, ok) { return el("span", ok ? "sd-cr" : "sd-subtl", text); },
};
/* Console builders: the same block in the glass kit. */
const CON = {
  sec: (title) => section(title),
  row(parent, label, hint) { const r = row(parent, label, { hint }); const g = group(); r.value.replaceChildren(g); return g; },
  btn: (text, fn, cls = "") => button(text, fn, `tiny ${cls === "sd-accent" ? "on" : ""}`.trim()),
  note: (parent, text) => note(parent, text),
  empty: (parent, text) => parent.append(el("div", "tempty", text)),
  cr: (text) => el("span", "v good", text),
  tag: (text, ok) => el("span", `v ${ok ? "good" : "warn"}`, text),
};

/**
 * marketBlock(body, st, { repaint, ui }) — PORT LEDGER / THEY SELL / THEY BUY / LOCKER & WORKS.
 * `body` is the host element, `st` the docked station, `repaint()` is called after every trade;
 * `ui` picks the builders (station deck by default, `"console"` for the glass kit).
 */
export function marketBlock(body, st, { repaint = () => {}, ui = "deck" } = {}) {
  const U = ui === "console" ? CON : SD;
  const L = portLedger(st);
  const byId = new Map(L.stock.map((x) => [x.id, x]));
  /* a shelf meter: five cells against the port's target, an arrow for the last pass, a word for the extremes */
  const shelf = (x) => {
    if (!x) return "";
    const cells = Math.max(0, Math.min(5, Math.round(x.fill * 2.5)));
    const meter = "▮".repeat(cells) + "▯".repeat(5 - cells);
    const arrow = x.trend > 0.5 ? " ▲" : x.trend < -0.5 ? " ▼" : " ·";
    const tag = x.fill < 0.25 ? " SHORT" : x.fill > 2.2 ? " GLUT" : "";
    return `${meter}${arrow}${tag}`;
  };
  /* the ledger: what the port is short of (and pays for), what its lines are doing */
  const led = U.sec("PORT LEDGER");
  const running = L.lines.filter((l) => l.running).length;
  U.note(led, `${running}/${L.lines.length} lines running · treasury ${L.credits.toLocaleString()} cr · ${L.moved.toLocaleString()} u moved through the doors`);
  for (const l of L.lines) {
    const v = U.row(led, l.name, l.running ? "running" : l.stalledName ? `stalled — no ${l.stalledName}` : "cold");
    v.append(U.tag(l.running ? "RUN" : "STALL", l.running));
  }
  if (L.shortages.length) U.note(led, `Short of ${L.shortages.slice(0, 4).map((x) => `${x.name} (pays ${x.pays} cr, ×${x.mult.toFixed(1)})`).join(", ")}.`, true);
  const buy = U.sec("THEY SELL");
  for (const line of st.stock) {
    if (line.qty <= 0.5) continue;
    const x = byId.get(line.id);
    const v = U.row(buy, goodName(line.id), `${Math.round(line.qty)} in stock  ${shelf(x)}`);
    v.append(U.cr(`${buyPriceAt(st, line)} cr`),
      U.btn("×1", () => { tradeBuy(line.id, 1); repaint(); }),
      U.btn("×10", () => { tradeBuy(line.id, 10); repaint(); }));
  }
  const sell = U.sec("THEY BUY");
  const ids = Object.keys(sim.ship.hold).filter((id) => sim.ship.hold[id] > 0.01);
  if (!ids.length) U.empty(sell, "Nothing aboard to sell.");
  for (const id of ids) {
    const price = sellPriceAt(st, id);
    const base = good(id)?.value ?? 1;
    const x = byId.get(id);
    const v = U.row(sell, goodName(id), `${Math.round(sim.ship.hold[id])} aboard${price > base * 1.05 ? " · wanted here" : ""}${x ? `  ${shelf(x)}` : ""}`);
    v.append(U.cr(`${price} cr`),
      U.btn("×10", () => { tradeSell(id, 10); repaint(); }),
      U.btn("ALL", () => { tradeSell(id, Infinity); repaint(); }));
  }
  /* the locker and the works: where a full hold goes when it is not for sale */
  const hold = U.sec("LOCKER & WORKS");
  const locker = stashAt(st.id);
  const lockerLine = locker.length ? locker.map((x) => `${Math.round(x.qty)} ${x.name}`).join(", ") : "empty";
  const v = U.row(hold, `Locker at ${st.name}`, lockerLine);
  v.append(U.btn("STASH ALL", () => { const e = stashDeposit("all"); if (e) sim.notice = e; repaint(); }),
    U.btn("WITHDRAW", () => { const e = stashWithdraw("all"); if (e) sim.notice = e; repaint(); }));
  const w = U.row(hold, "Smelter", canSmeltAt(st) ? `runs every ore aboard through the works — refine ratios, ${Math.round(6)}% of the value kept` : "no works here — an industrial, military or logistic port smelts");
  if (canSmeltAt(st)) w.append(U.btn("SMELT ALL", () => { const e = smeltAll(); if (e) sim.notice = e; repaint(); }));
  w.append(U.btn("SELL ALL ORE", () => { const got = sellAllOre(); sim.notice = got > 0 ? `Sold ore and minerals for ${Math.round(got)} cr.` : "Nothing the port buys."; repaint(); }));
  /* 0.3.19: where this shelf sells for more — the trader's first question at any desk */
  const out = U.sec("ROUTES FROM HERE");
  const rs = tradeRoutes({ only: { from: st.id }, pos: st, n: 3 });
  if (!rs.length) U.empty(out, "Nothing on this shelf sells for more anywhere else right now, with your hold and purse.");
  for (const r of rs) {
    const v2 = U.row(out, `${r.name} → ${r.to.name}`, `${r.qty} × +${Math.round(r.margin)} cr · ~${Math.max(1, Math.round(r.secs / 60))} min`);
    v2.append(U.cr(`+${Math.round(r.profit).toLocaleString()} cr`), U.btn("FLY IT", () => { flyRoute(r); repaint(); }, "sd-accent"));
  }
  body.append(led, buy, sell, hold, out);
}

/** A one-off run of a route on the autopilot: dock at the source, buy, dock at the buyer, sell that. */
export function flyRoute(r) {
  const m = makeMission({
    name: `TRADE · ${r.name}`, builtin: true,
    steps: [
      makeStep("DOCK", { kind: "station", id: r.from.id, name: r.from.name }),
      makeStep("BUY", null, { args: { good: r.good, qty: r.qty } }),
      makeStep("DOCK", { kind: "station", id: r.to.id, name: r.to.name }),
      makeStep("SELL", null, { args: { what: r.good } }),
    ],
  });
  if (startMission(m)) sim.notice = `Flying ${routeLine(r)}.`;
  return m;
}

/* ---- ROUTES ---------------------------------------------------------------- */

function mountRoutes(root, push) {
  const host = el("div");
  root.append(host);
  let key = "";
  push(() => {
    const k = `${Math.round(sim.time / 5)}|${Math.round(sim.ship.credits / 200)}|${Math.round(cargoTotal(sim.ship))}|${sim.ship.dockedAt ?? ""}`;
    if (k === key) return;
    key = k;
    host.innerHTML = "";
    const head = section("Trade routes");
    note(head, `Every buy-here-sell-there run from where you are, with your hold (${Math.round(sim.ship.cargoCap - cargoTotal(sim.ship))} free) and your purse (${Math.round(sim.ship.credits).toLocaleString()} cr), at the prices the ports trade at right now — ranked by credits a minute, the flight to the source included. Legs with a world across the line are left out.`);
    const tr = presets().find((p) => p.id === "preset-trade");
    const r0 = row(head, "TRADE RUN", { hint: "the autopilot picks the best route each round, five rounds" });
    r0.value.replaceChildren(button("RUN", () => { startMission(tr); key = ""; }, "tiny on"));
    host.append(head);
    const list = section("Best from here");
    const rs = tradeRoutes({ n: 8 });
    if (!rs.length) list.append(el("div", "tempty", "No route pays from here with this hold and purse. Sell down or top up, and look again."));
    for (const r of rs) {
      const rr = row(list, `${r.name}: ${r.from.name} → ${r.to.name}`, { hint: `buy ${r.qty} at ${r.buy} · sell at ${r.sell} · +${Math.round(r.margin)} a unit · ~${Math.max(1, Math.round(r.secs / 60))} min · ${Math.round(r.perMin).toLocaleString()} cr/min` });
      rr.value.replaceChildren(group(el("span", "v good", `+${Math.round(r.profit).toLocaleString()}`),
        button("FLY IT", () => { flyRoute(r); key = ""; }, "tiny on"),
        button("MARK", () => { addWaypointAt(`Buy ${r.name} · ${r.from.name}`, r.from.x, r.from.y, r.from.z); sim.notice = `Waypoint: ${r.from.name}`; }, "tiny")));
    }
    host.append(list);
  });
}

/** portWants(st) → [{ good, label, short, pays, mult }] — "what they are short of". */
export function portWants(st) {
  if (!st) return [];
  return (simPortWants(st, 4) ?? []).map((x) => ({ good: x.id, label: x.name, short: x.over > 1.05, pays: x.pays, mult: x.mult }));
}

/* ---- PORT ------------------------------------------------------------------ */

function mountPort(root, push) {
  const head = section("Nearest port");
  const nameRow = row(head, "Port");
  const sectorRow = row(head, "Sector");
  const mountRow = row(head, "Mount");
  const distRow = row(head, "Range / closing");
  const dockRow = row(head, "Docking clamps", { hint: "Inside the ring and under 12 u/s relative." });
  const dockBtn = button("DOCK", () => toggleDock());
  const claimBtn = button("CLAIM", () => { const why = claimPort(); if (why) sim.notice = `Cannot claim — ${why.toLowerCase()}.`; }, "danger");
  dockRow.value.replaceChildren(group(claimBtn, dockBtn));
  const blurb = el("p");
  head.append(blurb);
  root.append(head);

  const wants = section("What they are short of");
  const wantsBody = el("div");
  wants.append(wantsBody);
  root.append(wants);

  const desk = el("div");
  root.append(desk);

  let wantsKey = "";
  let deskKey = "";
  push(() => {
    const s = stationStatus();
    if (!s) {
      nameRow.value.textContent = "none in range";
      for (const r of [sectorRow, mountRow, distRow]) r.value.textContent = "—";
      blurb.textContent = "Ports show up on the chart and in the canopy once you are inside 600 km.";
      dockBtn.disabled = true;
      claimBtn.disabled = true;
      if (wantsKey !== "none") { wantsKey = "none"; wantsBody.innerHTML = ""; wantsBody.append(el("div", "tempty", "—")); }
      if (deskKey !== "none") { deskKey = "none"; desk.innerHTML = ""; }
      return;
    }
    const st = s.station;
    nameRow.value.textContent = st.name;
    sectorRow.value.textContent = s.info.sector;
    mountRow.value.textContent = s.info.mount;
    distRow.value.textContent = `${fmtDist(s.dist)} · ${s.rel.toFixed(0)} u/s`;
    blurb.textContent = s.info.blurb;
    dockBtn.textContent = s.docked ? "UNDOCK" : "DOCK";
    dockBtn.disabled = !s.docked && !s.ok;
    dockBtn.classList.toggle("on", s.docked);
    claimBtn.disabled = !st.hostile || st.guards > 0;
    claimBtn.textContent = st.hostile ? (st.guards > 0 ? `${st.guards} GUNS` : "CLAIM") : "CLAIM";

    const pw = portWants(st);
    const wk = `${st.id}|${pw.map((x) => `${x.good}:${x.pays}`).join(",")}`;
    if (wk !== wantsKey) {
      wantsKey = wk;
      wantsBody.innerHTML = "";
      if (!pw.length) wantsBody.append(el("div", "tempty", "Nothing in particular."));
      for (const x of pw) {
        const r = row(wantsBody, x.label, { hint: `×${x.mult.toFixed(1)} over book`, value: `${x.pays} cr` });
        r.value.className = `v ${x.short ? "good" : ""}`;
      }
    }

    const ids = Object.keys(sim.ship.hold).filter((id) => sim.ship.hold[id] > 0.01);
    const dk = s.docked
      ? `${st.id}|${Math.round(sim.ship.credits)}|${st.stock.map((x) => `${x.id}:${Math.round(x.qty)}`).join(",")}|${ids.map((id) => `${id}:${Math.round(sim.ship.hold[id])}`).join(",")}`
      : `closed:${s.ok ? "ok" : s.why}`;
    if (dk !== deskKey) {
      deskKey = dk;
      desk.innerHTML = "";
      if (!s.docked) {
        const sec = section("Market");
        sec.append(el("div", "tempty", s.ok ? "Dock to trade." : `Dock to trade — ${s.why}`));
        desk.append(sec);
      } else marketBlock(desk, st, { ui: "console", repaint: () => { deskKey = ""; } });
    }
  });
}

/* ---- HOLD ------------------------------------------------------------------ */

function mountHold(root, push) {
  const ship = sim.ship;

  const hold = section("Hold");
  const total = row(hold, "Capacity", { bar: true });
  const creditRow = row(hold, "Credits");
  root.append(hold);

  /* the drill bench: ice → water / gas, run from here or the AUX page */
  const works = section("Ice works");
  works.dataset.focus = "ice-works";
  const fitRow = row(works, "Bench");
  const modeRow = row(works, "Mode");
  const modeBtn = button("OFF", () => { cycleIceworkMode(); }, "");
  modeRow.value.replaceChildren(modeBtn);
  const runRow = row(works, "Through the bench");
  note(works, "Melt water ice into water (a trickle cracked to breathing gas when O2 runs low); extract methane, ammonia and nitrogen from the clathrates. Runs off the mining bus.");
  root.append(works);

  const man = section("Manifest");
  const manBody = el("div");
  man.append(manBody);
  root.append(man);

  let key = null;
  const drawManifest = () => {
    const ids = Object.keys(ship.hold).filter((id) => ship.hold[id] > 0.01);
    const k = ids.map((id) => `${id}:${Math.round(ship.hold[id])}`).join(",");
    if (k === key) return;
    key = k;
    manBody.innerHTML = "";
    if (!ids.length) { manBody.append(el("div", "tempty", "Hold is empty.")); return; }
    ids.sort((a, b) => ship.hold[b] - ship.hold[a]);
    for (const id of ids) {
      const g = good(id);
      const r = row(manBody, g?.name ?? id, { hint: `${g?.tier ?? "cargo"} · ${g?.mass ?? 1} t/unit · base ${g?.value ?? 1} cr` });
      r.value.replaceChildren(group(
        el("span", "v", `${Math.round(ship.hold[id])}`),
        button("−10", () => { jettison(id, 10); key = ""; }, "tiny"),
        button("DUMP", () => { jettison(id, "all"); key = ""; }, "tiny danger")));
    }
  };
  drawManifest();

  push(() => {
    const fit = iceworkFit();
    fitRow.value.textContent = fit.why;
    fitRow.value.className = `v ${fit.ok ? "good" : "hot"}`;
    const m = ICE_MODES.find((x) => x.id === icework.mode);
    modeBtn.textContent = m?.label ?? "OFF";
    modeBtn.disabled = !fit.ok && icework.mode === "off";
    runRow.value.textContent = icework.ran > 0 ? `${Math.round(icework.ran)} units · ${icework.product || "—"}` : icework.mode === "off" ? "—" : icework.product || "—";
    const t = cargoTotal(ship);
    total.value.textContent = `${Math.round(t)} / ${ship.cargoCap}`;
    setBar(total.bar, t / ship.cargoCap, t / ship.cargoCap > 0.9 ? "warn" : null);
    creditRow.value.textContent = `${Math.round(ship.credits).toLocaleString()} cr`;
    drawManifest();
  });
}

/* ---- REFIT ----------------------------------------------------------------- */

function mountRefit(root, push) {
  const host = el("div");
  root.append(host);
  let key = "";
  push(() => {
    const st = sim.ship.dockedAt ? stationById(sim.ship.dockedAt) : null;
    const yard = st && YARD_SECTORS.includes(st.sector);
    const lines = upgradeLines() ?? [];
    const k = yard ? `yard:${st.id}:${Math.round(sim.ship.credits)}:${lines.length}` : `own:${lines.map((l) => l.name).join(",")}`;
    if (k === key) return;
    key = k;
    host.innerHTML = "";
    if (yard) {
      const sec = section(`Refit — ${st.name}`);
      const body = el("div");
      sec.append(body);
      refitPanel(body, st);
      if (!body.childElementCount) body.append(el("div", "tempty", "The yard has nothing on the rack today."));
      host.append(sec);
      return;
    }
    const own = section("Fitted upgrades");
    if (!lines.length) own.append(el("div", "tempty", "Factory fit. Nothing bolted on."));
    for (const l of lines) row(own, l.name, { value: l.effect ?? "" });
    note(own, st ? `${st.name} has no yard — dock at an industrial or military yard to refit.` : "Dock at an industrial or military yard to refit.");
    host.append(own);
  });
}

/* ---- the panel ------------------------------------------------------------- */

const SUBS = { port: mountPort, hold: mountHold, routes: mountRoutes, refit: mountRefit };

export default {
  id: "market",
  title: "MARKET",
  order: 50,
  subtabs: [{ id: "port", label: "PORT" }, { id: "hold", label: "HOLD" }, { id: "routes", label: "ROUTES" }, { id: "refit", label: "REFIT" }],
  mount(root, ctx) { (SUBS[ctx.sub] ?? mountPort)(root, ctx.push, ctx); },
  paint() {},
  unmount() {},
  search() {
    const out = [
      { label: "Ice works", hint: "melt water ice, extract clathrates", sub: "hold", focus: "ice-works", keywords: "bench drill water gas", status: () => DOC?.getElementById("aux-ice-st")?.textContent ?? "—" },
      { label: "Manifest", hint: "what is in the hold, jettison", sub: "hold", keywords: "cargo hold dump" },
      { label: "Nearest port", hint: "dock, claim, the market", sub: "port", keywords: "station trade market" },
      { label: "Refit", hint: "upgrades at a yard", sub: "refit", keywords: "upgrade yard" },
      { label: "Trade routes", hint: "buy here, sell there — FLY IT", sub: "routes", keywords: "trade route profit margin haul arbitrage" },
    ];
    for (const id of Object.keys(sim.ship?.hold ?? {})) if (sim.ship.hold[id] > 0.01) out.push({ label: `Hold: ${goodName(id)}`, hint: `${Math.round(sim.ship.hold[id])} aboard`, sub: "hold", keywords: "cargo good" });
    return out;
  },
};
