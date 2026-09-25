/* LIVING GALAXY — CONSOLE › WORK › FLEET: the company's crewed hulls.
 *
 * `fleetReport()` rows with SELL BACK, and the yard's offer (commission an
 * extract or haul hull with a member of staff in the chair) when docked at an
 * industrial or military yard — the same calls the port deck used to make. The
 * deck no longer carries a fleet at all (0.3.45).
 */

import { el, section, note, row, button } from "../kit.js";
import { sim } from "../../sim.js";
import { stationById } from "../../stations.js";
import { company, hasCompany, staffAt } from "../../company.js";
import { commissionOptions, commissionHull, decommissionHull, fleetReport, fleet } from "../../fleet.js";

const DOC = globalThis.document ?? null;
void DOC;

const tell = (msg) => { if (msg) { sim.notice = msg; sim.noticeAt = sim.wall; } };

function fleetSection(render) {
  const s = section(`FLEET — ${fleet.hulls.length} hull${fleet.hulls.length === 1 ? "" : "s"}`);
  if (!hasCompany()) { note(s, "Company hulls need a company — register one at CON › CORP › COMPANY while docked."); return s; }
  row(s, `${company.name} treasury`, { value: `${Math.round(company.treasury).toLocaleString()} cr`, hint: "hulls are bought from here; their deliveries land here" });
  if (!fleet.hulls.length) note(s, "No hulls on the board yet.");
  for (const h of fleetReport()) {
    const r = row(s, h.name, { value: `net ${h.net.toLocaleString()} cr`, hint: `${h.captainName}${h.captainPronouns ? ` · ${h.captainPronouns.subj}/${h.captainPronouns.obj}` : ""} · ${h.order} · ${h.job}${h.toName ? ` → ${h.toName}` : ""} · ${h.runs} runs · ${h.cyclesOut} cycles out` });
    r.row.dataset.focus = h.id;
    r.value.append(button("SELL BACK", () => { decommissionHull(h.id); render(); }, "danger tiny"));
  }
  return s;
}

function yardSection(render) {
  const st = sim.ship.dockedAt ? stationById(sim.ship.dockedAt) : null;
  const s = section("THE YARD");
  if (!st) { note(s, "Dock at an industrial or military yard to commission a hull."); return s; }
  if (!hasCompany()) { note(s, "Register a company first."); return s; }
  const yard = st.sector === "industrial" || st.sector === "military";
  const chairs = staffAt(st.id).filter((p) => p.role !== "captain");
  if (!yard) { note(s, "An industrial or military yard commissions company hulls."); return s; }
  if (!chairs.length) { note(s, "The yard builds for the company when a member of staff at this port can take the chair — settle a hand here first."); return s; }
  for (const order of ["extract", "haul"]) {
    for (const o of commissionOptions(order)) {
      const r = row(s, `${o.name} · ${o.tier} · ${order}`, { value: `${o.price.toLocaleString()} cr`, hint: `${order === "extract" ? "cuts the belt, ore to this floor" : "runs stock between ports"} · hold ${o.cargo} · ${chairs[0].name}${chairs[0].pronouns ? ` (${chairs[0].pronouns.subj}/${chairs[0].pronouns.obj})` : ""} in the chair` });
      r.value.append(button("COMMISSION", () => { const e = commissionHull(o.id, chairs[0].id, order, st); tell(e); render(); }, company.treasury >= o.price ? "accent" : ""));
    }
  }
  return s;
}

export default {
  id: "work-fleet",
  title: "FLEET",
  order: 40,
  subtabs: [],
  mount(root, ctx) {
    const host = el("div", "tfleet");
    root.append(host);
    let sig = "";
    const signature = () => `${sim.ship.dockedAt}|${fleet.hulls.length}|${company.founded ? 1 : 0}`;
    const render = () => { sig = signature(); host.replaceChildren(fleetSection(render), yardSection(render)); };
    render();
    ctx?.push?.(() => { if (signature() !== sig) render(); });
    return null;
  },
  paint() {},
  unmount() {},
  search() {
    return fleetReport().map((h) => ({ label: h.name, hint: `company hull · ${h.order} · ${h.job}`, sub: "fleet", focus: h.id, keywords: "fleet hull company" }));
  },
};
