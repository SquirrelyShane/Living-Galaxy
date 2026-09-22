/* LIVING GALAXY — the robot yard, a station-deck fragment.
 *
 * robotsPanel(body, st) → void. Catalogue cards for the port's ROBOTGEN
 * designs (designation, career and chassis, mass, kW, price, BUY), the
 * robots you own with condition bars, SERVICE ALL and SCRAP. The station
 * deck mounts it as PANELS.robots; CONSOLE › CREW may mount it too. Built
 * on the console kit (js/console/kit.js) so the rows share the glass look
 * and the ≥44 px tap targets. Contract: PLAN.md §4.7, §6 contract 2.
 */

import { sim } from "../sim.js";
import { crew } from "../crew.js";
import { el, row, button, group, setBar, note, section } from "../console/kit.js";
import {
  ROBOT_SECTORS, robotCatalogue, buyRobot, scrapRobot, robotsAboard, serviceAll, servicePrice, robotsSummary,
} from "./robots.js";

const DOC = globalThis.document ?? null;

function tone(c) {
  return c < 30 ? "hot" : c < 60 ? "warn" : "ok";
}

export function robotsPanel(body, st) {
  if (!DOC || !body) return;
  const paint = () => {
    body.replaceChildren();
    build(body, st, paint);
  };
  paint();
}

function build(body, st, paint) {
  const yard = Boolean(st && ROBOT_SECTORS.includes(st.sector));
  const ship = sim.ship;

  /* ---- the catalogue ---- */
  const cat = section(yard ? `ROBOT YARD · ${st.name}` : "ROBOT YARD");
  if (!yard) {
    note(cat, `No robot line at a ${st?.sector ?? "—"} port. Industrial, civilian and military yards print crew frames.`);
  } else {
    note(cat, `One design per line, printed for this yard. Robots draw no wage and keep no morale; they want power and a service now and then. Berths ${Math.max(0, sim.crewCapacity - crew.aboard.length)} free of ${sim.crewCapacity}.`);
    for (const o of robotCatalogue(st)) {
      const d = o.spec;
      const r = row(cat, `${o.designation} · ${o.label}`, {
        hint: `${d.career} frame · ${d.chassis} · ${d.massKg.toLocaleString()} kg · ${d.parts} parts · ${o.kw} kW`,
        value: `${o.price.toLocaleString()} cr`,
      });
      const b = button(o.blocker ? o.blocker.toUpperCase() : "BUY", () => {
        const err = buyRobot(o.kind, st);
        sim.notice = err ?? `${o.designation} is aboard and on the rota.`;
        paint();
      }, o.blocker ? "" : "on");
      b.disabled = Boolean(o.blocker);
      r.value.append(el("br"), b);
    }
  }
  body.append(cat);

  /* ---- the robots you own ---- */
  const bots = robotsAboard();
  const own = section(`ROBOT CREW · ${bots.length}`);
  if (!bots.length) note(own, "No robots aboard.");
  for (const m of bots) {
    const c = Math.round(m.condition ?? 100);
    const r = row(own, m.name, {
      hint: `${m.title} · ${m.kw} kW${m.idle ? " · NEEDS SERVICE" : ""}`,
      bar: true,
      value: `${c}%`,
    });
    setBar(r.bar, c / 100, tone(c));
    if (m.idle) r.row.classList.add("warn");
    const scrap = button("SCRAP", () => {
      const err = scrapRobot(m.id);
      sim.notice = err ?? `${m.name} scrapped — 40% back.`;
      paint();
    }, "danger");
    r.value.append(el("br"), scrap);
  }
  if (bots.length) {
    const s = robotsSummary();
    const cost = servicePrice();
    row(own, "Power on the bus", { value: `${s.kw} kW`, hint: s.worst ? `worst frame ${s.worst.name} at ${s.worst.condition}%` : "" });
    const svc = button(cost > 0 ? `SERVICE ALL · ${cost.toLocaleString()} cr` : "ALL SERVICED", () => {
      const err = serviceAll(st);
      sim.notice = err ?? "Robot crew serviced.";
      paint();
    }, "on");
    svc.disabled = !yard || cost <= 0 || (ship?.credits ?? 0) < cost;
    if (!yard && cost > 0) note(own, "Dock at an industrial, civilian or military yard to service them; an engineer at Engineering does it slowly under way.");
    own.append(group(svc));
  }
  body.append(own);
}

export default robotsPanel;
