/* LIVING GALAXY — the security ◆ on the HUD (0.3.48).
 *
 * A small diamond in the brand pill, top left: green SAFE, yellow IN COMBAT,
 * red WANTED (js/seclevel.js decides which). Tap it for the card: who polices
 * this sky, why you are the colour you are, SOS when it is open (and the
 * reason when it is not), the live response clock once you have called, and
 * the fine when you are carrying heat and docked somewhere honest.
 */

import { sim } from "./sim.js";
import { secLevel, callSOS, payFine, SEC, LEVELS } from "./seclevel.js";
import { UI } from "./audio.js";

const DOC = globalThis.document ?? null;
const mk = (tag, cls, text) => { const n = DOC.createElement(tag); if (cls) n.className = cls; if (text != null) n.textContent = text; return n; };
const mins = (s) => (s < 90 ? `${Math.round(s)} s` : `${Math.round(s / 60)} min`);

export function mountSecBadge() {
  if (!DOC) return () => {};
  const brand = DOC.querySelector("#hud .hud-brand");
  if (!brand) return () => {};
  /* two faces of one diamond: the HUD's, and the station deck's — docked, the
   * deck covers the HUD, and that is exactly where PAY FINE lives */
  const badges = [];
  const makeBadge = (host, id) => {
    const b = mk("button", "sec-badge", null);
    b.type = "button";
    b.id = id;
    b.setAttribute("aria-label", "Security level");
    const g = mk("i", "sec-gem");
    const l = mk("b", "sec-lab", "SAFE");
    b.append(g, l);
    host.append(b);
    b.addEventListener("click", (e) => { e.stopPropagation(); open = !open; key = ""; UI?.press?.(); });
    b.addEventListener("pointerdown", (e) => e.stopPropagation());
    badges.push({ b, g, l });
    return b;
  };
  let open = false;
  let key = "";
  let said = "";
  let lastLevel = "green";
  makeBadge(brand, "sec-badge");
  const deckHead = DOC.querySelector("#station-deck .sd-head > div");
  if (deckHead) makeBadge(deckHead, "sec-badge-deck");

  const card = mk("div", "sec-card panel hidden");
  card.id = "sec-card";
  DOC.body.append(card);
  card.addEventListener("pointerdown", (e) => e.stopPropagation());

  const build = (lv) => {
    card.replaceChildren();
    const head = mk("div", "sec-head");
    const g = mk("i", `sec-gem ${lv.id}`);
    head.append(g, mk("b", null, `SECURITY · ${lv.label}`));
    const x = mk("button", "sec-x", "×");
    x.type = "button";
    x.addEventListener("click", () => { open = false; key = ""; });
    head.append(x);
    card.append(head);
    const line = lv.id === "red"
      ? `${lv.corp ?? "The Directorate"} has posted you. Its patrols will fire on sight and nobody answers your SOS. Heat ${lv.heat.toFixed(1)} of ${SEC.red} — it cools in about ${mins(lv.cools)}, or pay the fine at any honest port.`
      : lv.id === "yellow"
        ? `In combat. ${lv.corp ?? "The Directorate"} does not dispatch into a fight already running — SOS opens again ${SEC.combatWindow} s after the last shot either way.`
        : lv.corp ? `Protected by ${lv.corp}. SOS brings its quick-reaction wing to wherever you are.` : "Nobody polices this sky. There is no one to call.";
    card.append(mk("p", null, line));
    if (lv.heat > 0 && lv.id !== "red") card.append(mk("p", "sec-dim", `Heat ${lv.heat.toFixed(1)} of ${SEC.red} on file — honest hulls you destroyed. It cools in about ${mins(lv.cools)}.`));
    if (lv.sos) card.append(mk("p", "sec-live", lv.sos.eta == null ? "Your call is open. Nobody is free to send." : lv.sos.state === "onscene" ? `${lv.sos.wing} on scene.` : lv.sos.eta < 1 ? `Wing of ${lv.sos.wing} arriving.` : `Wing of ${lv.sos.wing} inbound — ${Math.ceil(lv.sos.eta)} s.`));
    const row = mk("div", "sec-row");
    const sos = mk("button", `btn sec-sos${lv.canSOS ? " on" : ""}`, "SOS · CALL QRF");
    sos.type = "button";
    sos.disabled = !lv.canSOS;
    sos.title = lv.why ?? "call the quick-reaction wing";
    sos.addEventListener("click", () => {
      const r = callSOS(sim.ship, sim.time);
      said = r.ok ? (r.eta == null ? "Called. Nobody is free to send." : `Called — wing inbound, ${Math.round(r.eta)} s.`) : r.why;
      sim.toast = `SOS — ${said}`;
      sim.lastToastAt = sim.time;
      key = "";
    });
    row.append(sos);
    if (lv.heat > 0 && sim.ship?.dockedAt) {
      const fine = mk("button", "btn sec-fine", `PAY FINE · ${lv.fine.toLocaleString()} cr`);
      fine.type = "button";
      fine.addEventListener("click", () => { const e = payFine(sim.ship); said = e ?? "Paid. The file is closed."; sim.notice = said; key = ""; });
      row.append(fine);
    }
    card.append(row);
    if (!lv.canSOS && lv.why) card.append(mk("p", "sec-dim", `SOS closed: ${lv.why}.`));
    if (said) card.append(mk("p", "sec-dim", said));
    const legend = mk("p", "sec-legend");
    for (const l of Object.values(LEVELS)) { const s = mk("span"); s.append(mk("i", `sec-gem ${l.id}`), DOC.createTextNode(` ${l.label}`)); legend.append(s); }
    card.append(legend);
  };

  return function paintSecBadge() {
    if (!sim.ship) return;
    const lv = secLevel(sim.ship, sim.time);
    if (lv.id !== lastLevel) { lastLevel = lv.id; said = ""; }
    for (const { b, g, l } of badges) {
      b.dataset.level = lv.id;
      g.className = `sec-gem ${lv.id}`;
      if (l.textContent !== lv.label) l.textContent = lv.label;
      b.title = `Security: ${lv.label}${lv.corp ? ` · ${lv.corp}` : ""}`;
    }
    card.classList.toggle("hidden", !open);
    if (!open) return;
    const k = `${lv.id}|${lv.canSOS}|${lv.why}|${lv.heat.toFixed(1)}|${lv.sos ? `${lv.sos.state}${Math.ceil(lv.sos.eta ?? -1)}` : ""}|${sim.ship.dockedAt ?? ""}|${said}`;
    if (k === key) return;
    key = k;
    build(lv);
  };
}
