/* LIVING GALAXY — the station deck.
 *
 * What you see when the clamps take hold. A wall of dockside CRTs — code
 * rain, crew vitals on a heart monitor, station process bars — beside the
 * working panels — only what a PORT has: market, shipyard, the desk, the
 * hiring hall, works, drone and robot yards, refit, GNN, the deck blueprint.
 * What belongs to the pilot (roster, company, fleet, logs) is the console's.
 *
 * The deck opens itself on dock, folds away on undock, and can be stowed
 * to fly the berth with the HUD.
 */

import { currentShipId, issuedHullId, sim, toggleDock, crewCapacity } from "./sim.js";
import { SHIP_DB, shipById, sizeBand } from "./shipdb.js";
import { componentBill, stockLines, yardQuote } from "./shipcost.js";
import { pilot, rankStatus } from "./pilot.js";
import { radar, traitAxes } from "./ui/charts.js";
import { glyphBar, sigil } from "./ui/glyphs.js";
import { crew, crewWageTotal, hireCrew, hireTerms, stationRoster, wageFor } from "./crew.js";
import { cradle } from "./npc/cradle.js";
import { company, hasCompany, recallStaff, staffAt } from "./company.js";
import { contracts, BOARD } from "./contracts.js";
import { renderDesk, renderHeld } from "./boardview.js";
import { renderCoverage, buyCoverage } from "./ui/coverage.js";
import { corpOfStation, standingLabel } from "./corps.js";
import { stationPlan, tickPlan, drawPlan, occupancy, roomAt } from "./blueprint.js";
import { stationById } from "./stations.js";
import { worksPanel } from "./deckworks.js";
import { DRONE_ROLES } from "./drones/roles.js";
import { droneOps, buildOptions, orderBuild, queueAt, unitsHomedAt, statusLine, pendingAsks, beginWork } from "./drones/ops.js";
import { gnn, DESKS, runAction } from "./gnn.js";
import { openConsole } from "./console/console.js";
import { marketBlock } from "./console/panels/market.js";
import { robotsPanel } from "./crew/robotyard.js";
import { refitPanel, wireDeckRepair, paintDeckRepair } from "./refityard.js";

const $ = (id) => document.getElementById(id);
const el = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; };

/* ---------------- CRT mini screens ---------------- */

const KATA = "ｱｲｳｴｵｶｷｸｹｺｻｼｽｾｿﾀﾁﾂﾃﾄﾅﾆﾇﾈﾉ0123456789$#*+=";

function mountRain(canvas) {
  const ctx = canvas.getContext("2d");
  let cols = [], acc = 0;
  const size = () => {
    canvas.width = Math.round(canvas.clientWidth * devicePixelRatio);
    canvas.height = Math.round(canvas.clientHeight * devicePixelRatio);
    const n = Math.max(8, Math.floor(canvas.width / (10 * devicePixelRatio)));
    cols = Array.from({ length: n }, () => ({ y: Math.random() * -40, v: 0.4 + Math.random() * 0.9 }));
  };
  size();
  return (dt) => {
    if (canvas.width !== Math.round(canvas.clientWidth * devicePixelRatio)) size();
    acc += dt;
    if (acc < 0.05) return;
    acc = 0;
    const w = canvas.width, h = canvas.height, fs = 10 * devicePixelRatio;
    ctx.fillStyle = "rgba(2,8,4,0.22)"; ctx.fillRect(0, 0, w, h);
    ctx.font = `${fs}px ui-monospace, monospace`;
    cols.forEach((c, i) => {
      ctx.fillStyle = "#9dffb0"; ctx.fillText(KATA[(Math.random() * KATA.length) | 0], i * fs, c.y * fs);
      ctx.fillStyle = "rgba(60,190,90,0.75)"; ctx.fillText(KATA[(Math.random() * KATA.length) | 0], i * fs, (c.y - 1) * fs);
      c.y += c.v;
      if (c.y * fs > h + 40) c.y = Math.random() * -20;
    });
  };
}

function mountVitals(canvas) {
  const ctx = canvas.getContext("2d");
  let x = 0, beatPhase = 0;
  return (dt) => {
    const w = Math.round(canvas.clientWidth * devicePixelRatio), h = Math.round(canvas.clientHeight * devicePixelRatio);
    if (canvas.width !== w) { canvas.width = w; canvas.height = h; x = 0; ctx.fillStyle = "#020804"; ctx.fillRect(0, 0, w, h); }
    const morale = crew.aboard.length ? crew.aboard.reduce((a, m) => a + m.morale, 0) / crew.aboard.length : 80;
    const bpm = 52 + (100 - morale) * 0.9; // souring crew, racing trace
    beatPhase += dt * (bpm / 60);
    const speed = w * dt * 0.14, midY = h * 0.62;
    /* fade a column ahead of the pen */
    ctx.fillStyle = "#020804"; ctx.fillRect(x, 0, speed + 4 * devicePixelRatio, h);
    const t = beatPhase % 1;
    let y = midY + Math.sin(beatPhase * 6.3) * h * 0.015;
    if (t < 0.08) y = midY - h * 0.42 * (t / 0.08);          // R spike
    else if (t < 0.16) y = midY + h * 0.2 * ((t - 0.08) / 0.08);
    else if (t > 0.3 && t < 0.42) y = midY - h * 0.1 * Math.sin(((t - 0.3) / 0.12) * Math.PI);
    ctx.strokeStyle = morale > 45 ? "#6dffb0" : "#ff6b7a";
    ctx.lineWidth = 1.6 * devicePixelRatio;
    ctx.beginPath(); ctx.moveTo(x, ctx._ly ?? midY); ctx.lineTo(x + speed, y); ctx.stroke();
    ctx._ly = y;
    x += speed;
    if (x > w) { x = 0; ctx._ly = midY; }
    return bpm;
  };
}

/* ---------------- panels ---------------- */

let tab = "market";
let tabs = null;
let view = { zoom: 1, panX: 0, panY: 0, selected: null };
let rosterCache = null;
let paintPanel = () => {};

function row(parent, label, hint) {
  const r = el("div", "sd-row"), l = el("div", "sd-lab"), v = el("div", "sd-val");
  l.append(el("b", null, label));
  if (hint) l.append(el("small", null, hint));
  r.append(l, v);
  parent.append(r);
  return v;
}

/** A settled hand back as a hall candidate, at list wage, no bonus. */
function candidateFor(sRec) {
  return { id: sRec.id, name: sRec.name, complexId: sRec.complexId, letter: sRec.letter, title: sRec.title, wage: wageFor(sRec.complexId, sRec.letter), complexName: sRec.complexName ?? "", traits: sRec.traits, pronouns: sRec.pronouns, gender: sRec.gender, attractedTo: sRec.attractedTo };
}

function btn(text, fn, cls = "") { const b = el("button", `sd-btn ${cls}`, text); b.addEventListener("click", fn); return b; }

const PANELS = {
  /* the one market: PORT LEDGER / THEY SELL / THEY BUY / LOCKER & WORKS lives in console/panels/market.js */
  market(body, st) {
    marketBlock(body, st, { repaint: () => paintPanel() });
  },

  shipyard(body, st) {
    const yardish = st.sector === "industrial" || st.sector === "military";
    const issued = shipById(issuedHullId());
    const flying = shipById(currentShipId());
    const head = el("p", "sd-note", (yardish
      ? "Yard is open. Every hull in the registry, itemized and assembled to order."
      : "No slipway here — this port quotes, but only an industrial or military yard builds.")
      + ` You fly the ${flying?.name ?? "trainer"}.` + (issued ? ` Your line signs over the ${issued.name} at the issue rate.` : ""));
    body.append(head);
    const list = el("div", "sd-sec");
    const detail = el("div", "sd-sec");
    body.append(list, detail);

    let sel = sim.deckYardSel ?? issuedHullId() ?? "general_b";
    const buyer = { complexId: pilot.complexId, letter: rankStatus().letter };
    const render = () => {
      list.innerHTML = "";
      detail.innerHTML = "";
      const groups = new Map();
      for (const d of SHIP_DB) {
        if (!groups.has(d.complex)) groups.set(d.complex, []);
        groups.get(d.complex).push(d);
      }
      const picker = el("select", "sd-select");
      for (const [cx, defs] of groups) {
        const og = document.createElement("optgroup");
        og.label = cx.toUpperCase();
        for (const d of defs) {
          const o = document.createElement("option");
          o.value = d.id;
          const q = yardQuote(d, buyer);
          o.textContent = `${d.tier} · ${d.name} — ${q.total.toLocaleString()} cr${q.inLine ? " · issue" : ""}`;
          if (d.id === sel) o.selected = true;
          og.append(o);
        }
        picker.append(og);
      }
      picker.addEventListener("change", () => { sel = picker.value; sim.deckYardSel = sel; render(); });
      list.append(picker);

      const d = shipById(sel);
      const bill = componentBill(d);
      const quote = yardQuote(d, buyer);
      detail.append(el("h4", null, `${d.name.toUpperCase()} — ${d.role}`));
      detail.append(el("p", "sd-note", d.blurb));
      detail.append(el("p", "sd-note",
        `${bill.drive} · ${bill.partCount} catalogue parts, ${bill.fittedMass.toFixed(0)} t fitted · ` +
        `${bill.netPower >= 0 ? "+" : ""}${bill.netPower.toLocaleString()} kW net. Tap a line for the parts.`));
      sim.deckYardOpen = sim.deckYardOpen ?? new Set();
      for (const l of bill.lines) {
        const n = l.parts.reduce((a, p) => a + p.count, 0);
        const hint = l.parts.length ? `${n} fitted${sim.deckYardOpen.has(l.section) ? "" : " · " + l.parts.slice(0, 3).map((p) => p.name).join(", ") + (l.parts.length > 3 ? "…" : "")}` : l.detail;
        const v = row(detail, l.label, hint);
        v.append(el("span", "sd-cr", `${l.cost.toLocaleString()} cr`));
        if (!l.parts.length) continue;
        const r = v.parentElement;
        r.style.cursor = "pointer";
        r.addEventListener("click", () => { sim.deckYardOpen.has(l.section) ? sim.deckYardOpen.delete(l.section) : sim.deckYardOpen.add(l.section); render(); });
        if (!sim.deckYardOpen.has(l.section)) continue;
        for (const p of l.parts) {
          const pv = row(detail, `  ${p.count > 1 ? `${p.count}× ` : ""}${p.name}`, `${p.id} · ${p.mass.toFixed(1)} t${p.pwr ? ` · ${p.pwr > 0 ? "+" : ""}${p.pwr} kW` : ""}`);
          pv.parentElement.classList.add("sd-row-tight");
          pv.append(el("span", "sd-cr", `${(p.each * p.count).toLocaleString()} cr`));
        }
      }
      {
        const stock = stockLines(d);
        const open = sim.deckYardOpen.has("stock");
        const v = row(detail, "Raw stock", open ? `${stock.length} minerals at book value` : stock.slice(0, 4).map((r) => `${r.name} ${r.tonnes.toFixed(0)} t`).join(", ") + "…");
        v.append(el("span", "sd-cr", `${stock.reduce((a, r) => a + r.value, 0).toLocaleString()} cr`));
        v.parentElement.style.cursor = "pointer";
        v.parentElement.addEventListener("click", () => { open ? sim.deckYardOpen.delete("stock") : sim.deckYardOpen.add("stock"); render(); });
        if (open) for (const r of stock) {
          const rv = row(detail, `  ${r.name}`, `${r.tonnes >= 10 ? r.tonnes.toFixed(0) : r.tonnes.toFixed(1)} t`);
          rv.parentElement.classList.add("sd-row-tight");
          rv.append(el("span", "sd-cr", `${r.value.toLocaleString()} cr`));
        }
      }
      if (quote.scale < 1) {
        const v = row(detail, "Yard scale", `${d.tier}-frame lay-down rate`);
        v.append(el("span", "sd-cr", `−${Math.round((1 - quote.scale) * 100)}%`));
      }
      if (quote.inLine) {
        const v = row(detail, "Complex issue rate", "your line, at or below your rank");
        v.append(el("span", "sd-cr", `−${Math.round((1 - quote.issueRate) * 100)}%`));
      }
      const tv = row(detail, "ASSEMBLED", `${sizeBand(d).label} · ${Math.round(d.dims[0] * 10)} m`);
      const afford = sim.ship.credits >= quote.total;
      tv.append(el("span", "sd-cr sd-total", `${quote.total.toLocaleString()} cr`));
      const buyB = btn(yardish ? (afford ? "BUILD" : "SHORT") : "NO YARD", () => {
        if (!yardish || sim.ship.credits < quote.total) return;
        sim.ship.credits -= quote.total;
        sim.ownedHulls = sim.ownedHulls ?? [];
        sim.ownedHulls.push(d.id);
        sim.activeHullId = d.id;
        sim.requestPersist = true;   // a hull is worth a write now, not in thirty seconds (0.3.42)
        sim.notice = `${d.name} laid down, assembled, and signed over. She answers to your key now.`;
        paintPanel();
      }, afford && yardish ? "sd-accent" : "");
      buyB.disabled = !yardish || !afford;
      tv.append(buyB);
      /* cover on the hull you are actually flying, not the one in the picker —
       * you insure what you fly */
      {
        const flownId = currentShipId();
        const flown = shipById(flownId);
        if (flown) renderCoverage(detail, {
          hullId: flownId,
          hullName: flown.name,
          value: yardQuote(flown, buyer).total,
          credits: sim.ship.credits,
          docked: Boolean(sim.ship.dockedAt),
          ui: { el, row, btn },
          onBuy: (tierId) => {
            const got = buyCoverage(sim.ship, flownId, tierId, yardQuote(flown, buyer).total);
            if (got) { sim.notice = `${got.tier.toUpperCase()} cover written on ${flown.name} — ${got.payout.toLocaleString()} cr if she is lost.`; sim.requestPersist = true; }
            paintPanel();
          },
        });
      }
      if (sim.ownedHulls?.length) {
        const own = el("div", "sd-sec");
        own.append(el("h4", null, "YOUR HULLS"));
        for (const id of sim.ownedHulls) {
          const od = shipById(id);
          const v = row(own, od.name, od.role);
          const active = sim.activeHullId === id;
          v.append(btn(active ? "FLYING" : "FLY", () => { sim.activeHullId = id; sim.requestPersist = true; paintPanel(); }, active ? "sd-accent" : ""));
        }
        detail.append(own);
      }
    };
    render();
  },

  /* the WORKS tab lives in js/deckworks.js — the pilot's fabrication desk
   * plus the port's own lines. Moved out in 0.3.10: this file is on the
   * 600-line gate and that panel had to be able to grow. */
  works(body, st) { worksPanel(body, st); },

  board(body, st) {
    const co = corpOfStation(st);
    const head = el("div", "sd-sec");
    head.append(el("h4", null, `THE DESK — ${st.name}${co ? ` · ${co.name} ${standingLabel(co.standing)}` : ""}`));
    head.append(el("p", "sd-note", `Work posted by ${co?.name ?? "the port"}${co?.powerName ? ` under ${co.powerName}` : ""} and the outfits with offices on the ring, by department. Refusing is free; abandoning is not — an accepted job is a promise with a deadline and a standing penalty.`));
    /* 0.3.18: drawn by js/boardview.js, the same desk the console shows */
    const dbtn = (label, fn, on = false) => btn(label, fn, on ? "sd-accent" : "");
    const held = el("div", "sd-sec");
    held.append(el("h4", null, `IN HAND — ${contracts.active.length}/${BOARD.maxActive}`));
    renderHeld(held, st, { btn: dbtn, onChange: paintPanel });
    const offers = el("div", "sd-sec");
    offers.append(el("h4", null, "OFFERS"));
    renderDesk(offers, st, { btn: dbtn, onChange: paintPanel });
    body.append(head, held, offers);
  },

  /* 0.3.45 — the HALL. This tab was CREW and carried half the console with it:
   * the roster line, the company register, the treasury, the fleet and the
   * crew log, every one of them also a CON panel. The deck keeps what only a
   * port has — the people on this floor you can sign, and the company's own
   * people who live here. Everything else is one jump away in the console. */
  hall(body, st) {
    const cap = crewCapacity();
    const aboard = el("div", "sd-sec");
    aboard.append(el("h4", null, `BERTHS ${crew.aboard.length}/${cap} · payroll ${crewWageTotal()} cr/cycle`));
    const v = row(aboard, "Your crew", crew.aboard.length ? `${crew.aboard.length} aboard — roster, talk and duties in the console` : "No crew signed. The ship runs quiet.");
    v.append(btn("CON › CREW", () => openConsole("crew", "roster"), "sd-accent"));
    const hall = el("div", "sd-sec");
    hall.append(el("h4", null, `HIRING HALL — ${st.name}`));
    rosterCache = rosterCache?.st === st.id ? rosterCache : { st: st.id, list: stationRoster(st, 0, sim.skySeed) };
    let reveal = 0;
    for (const c of rosterCache.list) {
      if (crew.aboard.some((m) => m.id === c.id)) continue;
      const rs = cradle.get(c.id)?.status;
      if (rs === "staff" || rs === "captain" || rs === "dependant" || rs === "child") continue; // on somebody's books, or too young
      const v = row(hall, `${sigil(c.id)} ${c.name} · ${c.letter}`, `${c.title} — ${c.complexName}${c.pronouns ? ` · ${c.pronouns.subj}/${c.pronouns.obj}` : ""}`);
      const terms = hireTerms(c);
      /* the record compiles as the hall reveals it: temperament radar + the
       * two axes a captain hires on, written in glyphs and filling in turn */
      const card = el("div", "sd-person");
      const rd = radar(el("div"), traitAxes(c).map((a) => ({ ...a, value: 0.04 })), { size: 64 });
      const g1 = el("div"), g2 = el("div");
      const b1 = glyphBar(g1, { label: "GRIT", value: 0, seed: `${c.id}:grit`, cells: 10, tone: "cyan", animate: false });
      const b2 = glyphBar(g2, { label: "LOYALTY", value: 0, seed: `${c.id}:loyalty`, cells: 10, tone: "amber", animate: false });
      card.append(rd.el, g1, g2);
      const delay = 120 * reveal++;
      setTimeout(() => { rd.update(traitAxes(c)); b1.set(c.traits?.grit ?? 0.5); b2.set(c.traits?.loyalty ?? 0.5); }, delay);
      v.parentElement.classList.add("sd-row-tight");
      v.append(el("span", "sd-cr", terms.firstHand ? `${terms.wage} cr/cyc · first hand` : `${c.wage} cr/cyc · ${terms.bonus} cr bonus`), btn("SIGN", () => {
        const why = hireCrew(c, sim.ship, cap);
        if (why) sim.notice = why;
        paintPanel();
      }, "sd-accent"));
      v.parentElement.after(card);
    }
    /* the company's people who live on THIS floor — the one company list that is the port's */
    const people = el("div", "sd-sec");
    const here = staffAt(st.id).filter((p) => !p.transit);
    people.append(el("h4", null, hasCompany() ? `${company.name.toUpperCase()} — ON THIS FLOOR · ${here.length}` : "COMPANY"));
    for (const p of here) {
      const v = row(people, `${sigil(p.id)} ${p.name}`, `${p.title}${p.pronouns ? ` · ${p.pronouns.subj}/${p.pronouns.obj}` : ""} · ${p.income} cr/cycle to the company${p.family?.length ? ` · household of ${p.family.length + 1}` : ""}`);
      /* 0.3.46: the company line — talk to them without taking them back aboard */
      v.append(btn("LINE", () => openConsole("corp", "town", { focus: p.id })));
      v.append(btn("RECALL", () => {
        const sRec = recallStaff(p.id);
        if (!sRec) return;
        const cand = candidateFor(sRec);
        const why = hireCrew(cand, sim.ship, cap);
        if (why) sim.notice = why;
        paintPanel();
      }));
    }
    if (!hasCompany()) {
      const v = row(people, "No company registered", "the registrar, the treasury and the fleet are in the console");
      v.append(btn("CON › CORP", () => openConsole("corp", "company"), "sd-accent"));
    } else if (!here.length) people.append(el("p", "sd-empty", "Nobody of yours lives here. Settle a hand at this port and they earn the company a share every cycle."));
    body.append(aboard, hall, people);
  },

  blueprint(body, st) {
    const wrapEl = el("div", "sd-bp");
    const canvas = el("canvas");
    const info = el("div", "sd-bpinfo", "Tap a room. Drag to pan, pinch or wheel to zoom.");
    wrapEl.append(canvas, info);
    body.append(wrapEl);
    const plan = stationPlan(st);
    let drag = null;
    canvas.addEventListener("pointerdown", (e) => {
      drag = { x: e.clientX, y: e.clientY, moved: false };
      try { canvas.setPointerCapture(e.pointerId); } catch { /* pointer already gone */ }
    });
    canvas.addEventListener("pointercancel", () => { drag = null; });
    canvas.addEventListener("lostpointercapture", () => { drag = null; });
    canvas.addEventListener("pointermove", (e) => {
      if (!drag) return;
      const dx = e.clientX - drag.x, dy = e.clientY - drag.y;
      if (Math.abs(dx) + Math.abs(dy) > 3) drag.moved = true;
      view.panX += dx * devicePixelRatio; view.panY += dy * devicePixelRatio;
      drag.x = e.clientX; drag.y = e.clientY;
    });
    canvas.addEventListener("pointerup", (e) => {
      if (drag && !drag.moved) {
        const rect = canvas.getBoundingClientRect();
        const room = roomAt(plan, view, canvas.width, canvas.height,
          (e.clientX - rect.left) * devicePixelRatio, (e.clientY - rect.top) * devicePixelRatio);
        view.selected = room?.id ?? null;
        const occ = occupancy(plan);
        info.textContent = room
          ? `${room.name.toUpperCase()} — ${occ.get(room.id) ?? 0} inside · ${room.w * 12}×${room.h * 12} m`
          : "Tap a room. Drag to pan, pinch or wheel to zoom.";
      }
      drag = null;
    });
    canvas.addEventListener("wheel", (e) => {
      view.zoom = Math.max(0.4, Math.min(2.6, view.zoom * (1 - e.deltaY * 0.001)));
    }, { passive: true });
    body._bpCanvas = canvas;
    body._bpPlan = plan;
  },
};

/* the drone lines: what this port builds, what is on the line, who calls it home */
PANELS.drones = (body, st) => {
  const opts = buildOptions(st);
  const sec = el("div", "sd-sec");
  sec.append(el("h4", null, "DRONE LINES"));
  if (opts.length && !hasCompany()) { const v = row(sec, "Drones are company property", "Register a company at CON › CORP while you are docked; the yard bills the treasury and your drones earn into it."); v.append(btn("REGISTRAR", () => openConsole("corp", "company"), "sd-accent")); }
  else if (opts.length) row(sec, `${company.name} treasury`, "the yard bills the treasury; drone earnings land there").append(el("span", "sd-note", `${Math.round(company.treasury).toLocaleString()} cr`));
  if (!opts.length) sec.append(el("p", "sd-empty", "This port builds no drones. Industrial ports build miners, salvagers and harvesters; logistics ports haulers and couriers; military ports combat frames."));
  for (const o of opts) {
    const v = row(sec, `${o.label} · ${o.design.designation}`, `${o.blurb} ${o.design.career} frame, ${o.design.chassis}, ${o.design.massKg} kg, ${o.design.parts} parts.`);
    v.append(el("span", "sd-note", `${o.price.toLocaleString()} cr · ${o.secs}s`));
    const b = btn(o.blocker ?? "BUILD", () => { const r = orderBuild(o.role, st); sim.notice = r.ok ? `${o.label} drone on the line — ${o.secs} s. It will ask for its orders when it rolls off.` : r.why; paintPanel(); }, o.blocker ? "" : "sd-accent");
    b.disabled = Boolean(o.blocker);
    v.append(b);
  }
  body.append(sec);
  const q = queueAt(st.id);
  if (q.length) {
    const qs = el("div", "sd-sec");
    qs.append(el("h4", null, "ON THE LINE"));
    for (const j of q) { const v = row(qs, `${DRONE_ROLES[j.role].label} drone`, `ready in ${Math.max(0, Math.round(j.done - sim.time))} s`); const bar = el("div", "sd-bar"); const f = el("b", "ok"); f.style.width = `${Math.round(Math.min(1, (sim.time - j.start) / Math.max(1, j.done - j.start)) * 100)}%`; bar.append(f); v.append(bar); }
    body.append(qs);
  }
  const mine = unitsHomedAt(st.id);
  const hs = el("div", "sd-sec");
  hs.append(el("h4", null, `HOMED HERE · ${mine.length}`));
  if (!mine.length) hs.append(el("p", "sd-empty", droneOps.units.length ? "None of your drones call this port home." : "You have no drones yet."));
  for (const u of mine) {
    const v = row(hs, `${u.name} · ${DRONE_ROLES[u.role].label}`, statusLine(u));
    if (u.state === "setup") v.append(btn(pendingAsks(u).length ? "SET UP" : "BEGIN", () => (pendingAsks(u).length ? openConsole("work", "drones", { focus: u.id }) : (beginWork(u), paintPanel())), "sd-accent"));
    else v.append(btn("ORDERS", () => openConsole("work", "drones", { focus: u.id })));
  }
  body.append(hs);
};

/* the robot yard and the refit rack: package D's deck fragments */
PANELS.robots = robotsPanel;
PANELS.refit = refitPanel;

/* the GNN station's own desk: the full archive, every bulletin's actions */
PANELS.gnn = (body, st) => {
  body.append(el("p", "sd-note", `${st.name} — the Galactic News Network's relay for this sky. Bulletins are accepted as they land; this is the archive.`));
  for (const [desk, info] of Object.entries(DESKS)) {
    const posts = gnn.posts.filter((p) => p.desk === desk).slice().reverse();
    const sec = el("div", "sd-sec");
    sec.append(el("h4", null, `${info.label.toUpperCase()} · ${posts.length}`));
    if (!posts.length) sec.append(el("p", "sd-empty", "Nothing filed."));
    for (const b of posts.slice(0, 8)) {
      const v = row(sec, b.title || info.tag, b.body);
      b.actions.forEach((a, i) => { const x = btn(a.done ? "DONE" : a.label.toUpperCase(), () => { runAction(b, i); paintPanel(); }); x.disabled = a.done; v.append(x); });
    }
    body.append(sec);
  }
};

/* ---------------- mount ---------------- */

export function mountStationDeck() {
  const root = $("station-deck");
  const body = $("sd-body");
  tabs = $("sd-tabs");
  const rain1 = mountRain($("sd-rain1"));
  const rain2 = mountRain($("sd-rain2"));
  const vitals = mountVitals($("sd-vitals"));
  let open = false, stowed = false, lastDock = null, lastT = performance.now();

  paintPanel = () => {
    const st = stationById(sim.ship.dockedAt);
    if (!st) return;
    body.innerHTML = "";
    PANELS[tab](body, st);
  };

  tabs.querySelectorAll("button[data-sd]").forEach((b) => {
    b.addEventListener("click", () => {
      tab = b.getAttribute("data-sd");
      tabs.querySelectorAll("button").forEach((x) => x.classList.toggle("on", x === b));
      paintPanel();
    });
  });
  $("sd-stow").addEventListener("click", () => { stowed = true; });
  $("sd-reopen").addEventListener("click", () => { stowed = false; });
  $("sd-undock").addEventListener("click", () => { toggleDock(); });
  wireDeckRepair($("sd-repair"), () => { if (tab === "refit") paintPanel(); });
  root.addEventListener("pointerdown", (e) => e.stopPropagation());

  return function paintDeck(state) {
    const dockedAt = state.dockedAt;
    if (dockedAt && dockedAt !== lastDock) { stowed = false; tab = "market"; view = { zoom: 1, panX: 0, panY: 0, selected: null }; rosterCache = null; }
    lastDock = dockedAt;
    const want = Boolean(dockedAt) && state.phase === "play" && !stowed;
    if (want !== open) {
      open = want;
      root.classList.toggle("hidden", !open);
      if (open) {
        const st = stationById(dockedAt);
        $("sd-title").textContent = st?.name?.toUpperCase() ?? "PORT";
        $("sd-sub").textContent = `${st?.sector ?? ""} deck · clamps engaged`;
        const gnnTab = tabs.querySelector('button[data-sd="gnn"]');
        if (gnnTab) gnnTab.hidden = !st?.gnn;
        if (st?.gnn) tab = "gnn";
        tabs.querySelectorAll("button").forEach((x) => x.classList.toggle("on", x.getAttribute("data-sd") === tab));
        paintPanel();
      }
    }
    /* HUD chip to reopen a stowed deck */
    $("sd-reopen").classList.toggle("hidden", !(dockedAt && stowed));
    if (!open) return;

    const now = performance.now();
    const dt = Math.min(0.1, (now - lastT) / 1000);
    lastT = now;
    rain1(dt); rain2(dt);
    const bpm = vitals(dt) ?? 60;
    $("sd-bpm").textContent = `${Math.round(bpm)} BPM · ${crew.aboard.length} SOULS`;
    $("sd-credits").textContent = `${Math.round(sim.ship.credits).toLocaleString()} CR`;
    paintDeckRepair($("sd-repair"), stationById(dockedAt));

    /* progress bar screen — station processes, ticking on their own clocks */
    const t = now / 1000;
    const bars = $("sd-procs").children;
    const st = stationById(dockedAt);
    const vals = [Math.sin(t * 0.23) * 0.5 + 0.5, (t * 0.031 + (st?.id?.length ?? 0) * 0.13) % 1, Math.sin(t * 0.11 + 2) * 0.5 + 0.5, (t * 0.017) % 1];
    for (let i = 0; i < bars.length; i++) { const f = bars[i].querySelector("b"); if (f) f.style.width = `${Math.round(vals[i] * 100)}%`; }

    /* the drone lines tick while you watch */
    if (tab === "drones" && now - (body._dronesAt ?? 0) > 1500) { body._dronesAt = now; paintPanel(); }

    /* blueprint live tick */
    if (tab === "blueprint" && body._bpCanvas) {
      const c = body._bpCanvas;
      const w = Math.round(c.clientWidth * devicePixelRatio), h = Math.round(c.clientHeight * devicePixelRatio);
      if (c.width !== w) { c.width = w; c.height = h; }
      tickPlan(body._bpPlan, dt);
      drawPlan(c.getContext("2d"), body._bpPlan, view, w, h);
    }
  };
}

/** The deck's panels by id — test/deck.test.mjs holds index.html's tab row to it. */
export const deckTabs = () => Object.keys(PANELS);
