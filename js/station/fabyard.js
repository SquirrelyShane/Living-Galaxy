import { sim } from "../sim/sim.js";
import { el, row, button, note, section } from "../console/kit.js";
import { goodName } from "../economy/materials.js";
import { hasCompany, company } from "../corp/company.js";
import {
  FAB, fabMenuAt, planJob, orderFab, cancelFab, fabQueueAt, canFabAt, maxRunnable,
} from "../economy/fabricate.js";

const DOC = globalThis.document ?? null;

const view = { pick: null, step: 0, by: "player" };

const LADDER = [1, 5, 10, 25, 50, 100, "max"];

const n0 = (v) => Math.round(v).toLocaleString();
const qty2 = (v) => (v >= 10 ? Math.round(v) : Math.round(v * 10) / 10);
const mins = (s) => (s >= 90 ? `${Math.round(s / 60)} min` : `${Math.round(s)} s`);

function stockFor(st, by) {
  const out = { ...(sim.stash?.[st.id] ?? {}) };
  if (by === "player" && sim.ship?.dockedAt === st.id) {
    for (const [k, v] of Object.entries(sim.ship.hold ?? {})) out[k] = (out[k] ?? 0) + v;
  }
  return out;
}

export function fabPanel(body, st) {
  if (!DOC || !body) return;
  const paint = () => { body.replaceChildren(); build(body, st, paint); };
  paint();
}

function build(body, st, paint) {
  if (!canFabAt(st)) {
    const s = section("FABRICATION");
    note(s, `${st?.name ?? "This port"} has no fabrication line. An industrial yard builds anything; other ports build what they sell.`);
    body.append(s);
    return;
  }

  const running = fabQueueAt(st.id);
  const liveSec = section(`ON THE LINE · ${running.length} / ${FAB.perPort}`);
  if (!running.length) note(liveSec, "Nothing running. A job keeps going while you fly — come back for it.");
  for (const j of running) {
    const left = Math.max(0, j.done - sim.time);
    const r = row(liveSec, `${j.qty} × ${j.name}`, {
      hint: `${j.by === "company" ? `${company.name || "the company"}'s account` : "your account"} · ${left > 0 ? `${mins(left)} left` : "finishing"} · lands in the locker`,
      value: `${Math.round(100 * Math.min(1, (sim.time - j.start) / Math.max(1, j.secs)))}%`,
    });
    r.value.append(el("br"), button("PULL", () => {
      const c = cancelFab(j.id);
      sim.notice = c.ok ? `${j.name} pulled — materials back in ${st.name}'s locker.` : c.why;
      paint();
    }, "danger tiny"));
  }
  body.append(liveSec);

  const menu = fabMenuAt(st);
  const cat = section(`LINES · ${st.name}`);
  note(cat, "Ore in, parts out. A job cascades the whole way down — it smelts what it must and uses what you already hold first. The multiple is what the part is worth against the raw ore it eats.");
  for (const m of menu) {
    const good = m.ratio >= 1.25 ? "on" : m.ratio >= 1 ? "" : "danger";
    const r = row(cat, m.name, {
      hint: `${m.tier} · ${n0(m.value)} cr · ${n0(m.raw)} cr of ore`,
      value: `${m.ratio >= 10 ? "10+" : m.ratio.toFixed(2)}×`,
    });
    if (m.ratio < 1) r.value.classList?.add?.("warn");
    const b = button(view.pick === m.id ? "PICKED" : "PICK", () => {
      view.pick = view.pick === m.id ? null : m.id;
      paint();
    }, view.pick === m.id ? "on" : good);
    r.value.append(el("br"), b);
  }
  body.append(cat);

  if (!view.pick || !canFabAt(st, view.pick)) return;

  const by = view.by === "company" && hasCompany() ? "company" : "player";
  const stock = stockFor(st, by);
  const rung = LADDER[view.step] ?? 1;
  const most = maxRunnable(view.pick, stock);
  const qty = rung === "max" ? Math.max(1, most) : rung;
  const plan = planJob(view.pick, qty, stock);
  const q = section(`JOB · ${qty} × ${goodName(view.pick)}`);

  const qr = row(q, "Quantity", { hint: `tap to step: ${LADDER.map((x) => (x === "max" ? "MAX" : x)).join(" · ")}`, value: "" });
  qr.value.append(button(rung === "max" ? `MAX · ${most || "—"}` : String(qty), () => {
    view.step = (view.step + 1) % LADDER.length;
    paint();
  }, "on"));

  if (hasCompany()) {
    const who = row(q, "Account", { hint: "a company job runs while you are elsewhere and draws on the locker alone", value: "" });
    who.value.append(
      button("MINE", () => { view.by = "player"; paint(); }, by === "player" ? "on" : "tiny"), " ",
      button("COMPANY", () => { view.by = "company"; paint(); }, by === "company" ? "on" : "tiny"),
    );
  }

  const cons = Object.entries(plan.use).filter(([, v]) => v > 0.01)
    .sort((a, b) => b[1] - a[1]).map(([k, v]) => `${qty2(v)} ${goodName(k)}`);
  note(q, cons.length ? `Consumes: ${cons.join(", ")} — ${n0(plan.mass)} kg.` : "Consumes nothing you are holding.");

  if (plan.summary?.length > 1) {
    note(q, `Line: ${plan.summary.map((s) => `${qty2(s.qty)} ${goodName(s.id)}`).join(" → ")}`);
  }

  if (!plan.ok) {
    note(q, `SHORT — bring ${Object.entries(plan.need).map(([k, v]) => `${Math.ceil(v)} ${goodName(k)}`).join(", ")}.`);
  } else {
    row(q, "Run time", { value: mins(plan.secs), hint: "sim time — TIME ×8 and ×40 run the line too" });
    row(q, "Works fee", { value: `${n0(plan.fee)} cr`, hint: by === "company" ? `from ${company.name || "the treasury"}` : `${n0(sim.ship.credits)} cr in hand` });
    row(q, "Worth", { value: `${n0(plan.outValue)} cr`, hint: `${plan.margin >= 1 ? "better than" : "WORSE than"} selling the ore raw (${plan.margin.toFixed(2)}×)` });
  }

  const act = row(q, "", { value: "" });
  const go = button(`ORDER ${qty} × ${goodName(view.pick).toUpperCase()}`, () => {
    const r = orderFab({ st, id: view.pick, qty, by });
    sim.notice = r.ok
      ? `${qty} × ${goodName(view.pick)} on the line at ${st.name} — ${mins(r.job.secs)}, lands in the locker.`
      : r.why;
    paint();
  }, plan.ok ? "accent" : "");
  go.disabled = !plan.ok;
  act.value.append(go);
  body.append(q);
}

export default fabPanel;
