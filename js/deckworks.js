/* LIVING GALAXY — CONSOLE/DECK › WORKS: the pilot's fabrication desk, then the
 * port's own lines.
 *
 * Lifted out of js/stationdeck.js in 0.3.10, for the reason that file keeps
 * forcing: it sits exactly on the 600-line gate, so a panel that grows has to
 * grow somewhere else. This is the whole WORKS tab —
 *
 *   FABRICATION   what you can have built here, and what it eats (js/fabyard.js)
 *   DEFENCES      the guns and bays on the port's hull
 *   MAGAZINES     what they are loaded with
 *   FABRICATION   the port's OWN lines, making its munitions from traded stock
 *   WHAT THE LINES EAT   the recipes behind them
 *
 * The first is yours and the rest is the port's, which is why the pilot's desk
 * goes at the top: it is the thing they opened this tab to use.
 */

import { worksReport, RECIPES } from "./stationworks.js";
import { droneSummary } from "./dronespec.js";
import { goodName } from "./materials.js";
import { fabPanel } from "./fabyard.js";

/* The deck's own two helpers, copied rather than imported: they are four lines
 * each and importing them from stationdeck.js would make these two modules a
 * cycle for no gain. `el` is the deck's, not the console kit's — the deck
 * styles its own rows (.sd-row / .sd-lab / .sd-val). */
const el = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; };

function row(parent, label, hint) {
  const r = el("div", "sd-row"), l = el("div", "sd-lab"), v = el("div", "sd-val");
  l.append(el("b", null, label));
  if (hint) l.append(el("small", null, hint));
  r.append(l, v);
  parent.append(r);
  return v;
}

export function worksPanel(body, st) {
  /* The pilot's own fabrication desk goes first: it is the thing they came
   * to this tab to use. The port's own defence lines are below it. Its own
   * module (js/fabyard.js) because this file sits on the 600-line gate. */
  const fab = el("div", "sd-sec");
  body.append(fab);
  fabPanel(fab, st);
  const W = worksReport(st);
  const S = st.gen?.stats;
  const head = el("p", "sd-note", S
    ? `${S.archetype} · ${S.tier} · ${S.styleLabel} architecture in ${S.alloyName} · ${S.hangars} hangar mouth${S.hangars === 1 ? "" : "s"} (${(S.hangarForms ?? []).join(", ")}) · ${Math.round(S.lengthM)} m long${S.shielded ? " · shields up" : ""}`
    : "No yard record for this port.");
  body.append(head);
  if (!W) { body.append(el("p", "sd-empty", "This port has no works.")); return; }
  const def = el("div", "sd-sec");
  def.append(el("h4", null, "DEFENCES"));
  const gunNames = { pdc: "point-defence cluster", rail: "railgun battery", laser: "laser battery", missile: "missile cells", spinal: "spinal mass driver", siege: "siege laser" };
  for (const [k, n] of Object.entries(W.guns)) row(def, `${n}× ${gunNames[k] ?? k}`, k === "spinal" || k === "siege" ? "station-size" : "turrets");
  if (W.bays) {
    row(def, `${W.bays}× drone bay`, "interceptors on call");
    /* the drone line's one design (robotgen, seeded by the port) — the same machine the bays launch */
    const d = droneSummary("sdrone", st.name, st.sector);
    row(def, `${d.designation} ${d.career}`, `${d.chassis} · ${d.massKg} kg · ${d.parts} parts · ${d.enduranceMin} min`);
  }
  if (st.hostile && st.guards > 0) {
    const g = droneSummary("guard", st.name, st.sector);
    row(def, `${st.guards}× ${g.designation} gun drone`, `${g.career.toLowerCase()} · ${g.chassis} · ${g.massKg} kg`);
  }
  if (W.shielded) row(def, "shield emitters", "shell up");
  if (!Object.keys(W.guns).length && !W.bays) def.append(el("p", "sd-empty", "Unarmed."));
  body.append(def);
  const mag = el("div", "sd-sec");
  mag.append(el("h4", null, "MAGAZINES"));
  for (const m of W.mags) { const v = row(mag, m.what, `${m.have} of ${m.cap}${m.out ? ` · ${m.out} out` : ""}`); const bar = el("div", "sd-bar"); const fill = el("b", "ok"); fill.style.width = `${Math.round((m.have / Math.max(1, m.cap)) * 100)}%`; bar.append(fill); v.append(bar); }
  if (!W.mags.length) mag.append(el("p", "sd-empty", "Nothing here eats munitions."));
  body.append(mag);
  const lines = el("div", "sd-sec");
  lines.append(el("h4", null, "FABRICATION"));
  if (!W.lines.length) lines.append(el("p", "sd-empty", "No lines: this port buys its munitions."));
  for (const l of W.lines) row(lines, l, "");
  const madeBits = Object.entries(W.made).filter(([, n]) => n > 0).map(([k, n]) => `${n} ${k}${n === 1 ? "" : "s"}`);
  if (madeBits.length) lines.append(el("p", "sd-note", `Made this sky: ${madeBits.join(", ")}.`));
  if (W.stalled) lines.append(el("p", "sd-note sd-warn", `${W.stalled.what.toUpperCase()} line is STALLED — short of ${W.stalled.needName}. Sell some and it runs.`));
  const bill = el("div", "sd-sec");
  bill.append(el("h4", null, "WHAT THE LINES EAT"));
  for (const [what, R] of Object.entries(RECIPES)) {
    if (what !== "plate" && !W.mags.some((m) => m.what.startsWith(what))) continue;
    if (what === "plate" && !W.lines.some((l) => /press/.test(l))) continue;
    row(bill, `${R.batch}× ${what}`, Object.entries(R.needs).map(([id, q]) => `${q} ${goodName(id)}`).join(" · "));
  }
  body.append(lines, bill);
}

export default worksPanel;
