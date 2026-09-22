/* LIVING GALAXY — CONSOLE › WORK: MISSION (the autopilot's orders) · DRONES · FLEET.
 *
 * MISSION is the editor for js/mission/script.js: presets, the pilot's saved
 * list, step rows, an ADD STEP picker, a step sheet (target / until / per-step
 * overrides), the loop row, RUN, and the live card with the ask banner. The
 * editor is rebuilt on every edit (cheap, a dozen rows); only the live card
 * is refreshed per HUD frame. DRONES and FLEET live in their own modules.
 */

import { el, section, note, row, button, group, chips, card } from "../kit.js";
import { sim } from "../../sim.js";
import { BODIES } from "../../bodies.js";
import { stations } from "../../stations.js";
import { hasUpgrade } from "../../upgrades.js";
import {
  OPS, COND_KEYS, COND_OPS, WARP_POLICIES, ON_FAIL, makeMission, makeStep, validate, describeStep, describeCond, presets, loadMissions, saveMissions, serialize, deserialize, missionCore,
} from "../../mission/script.js";
import { mission, missionStatusLine, startMission, stopMission, pauseMission, resumeMission, answerAsk } from "../../mission/run.js";
import workDrones from "./work-drones.js";
import workFleet from "./work-fleet.js";
import workTape from "./work-tape.js";
import { fabReport, cancelFab } from "../../fabricate.js";
import { closeConsole } from "../console.js";
import { startCoreTutorial } from "../../tutorial.js";

const DOC = globalThis.document ?? null;
void DOC;

const CAPS = [{ id: 0.25, label: "25%" }, { id: 0.5, label: "50%" }, { id: 0.75, label: "75%" }, { id: 1, label: "100%" }, { id: 1.2, label: "OD" }];
const WARPS = WARP_POLICIES.map((w) => ({ id: w, label: w.toUpperCase() }));
const COND_UNITS = { hold: "%", charge: "%", credits: "cr", hull: "hp", time: "s", cargoOf: "u", loops: "×", docked: "" };
const tell = (msg) => { if (msg) { sim.notice = msg; sim.noticeAt = sim.wall; } };
/* A refusal the pilot can actually SEE.
 *
 * `tell` writes sim.notice, which paints on the HUD — and the console is a
 * full-screen sheet drawn OVER the HUD, so every "no" this editor ever gave
 * while it was open went somewhere the pilot could not look at. Tapping DOCK
 * under the one-step limit lit the chip, added nothing, opened no sheet and
 * said nothing: the editor looked broken rather than locked. Refusals go in
 * the panel now, and to the HUD as well for when the console is shut. */
const deny = (msg, render) => { ed.msg = msg; ed.core = false; tell(msg); render?.(); };
/* A refusal that is ALWAYS the same refusal — "you need a Mission core" — and
 * so gets the one thing a plain notice cannot give: somewhere to go. The block
 * explains the core, and SHOW ME HOW shuts the console and starts the
 * walkthrough, which finds the nearest yard that fits one and flies you there.
 * It also fires the walkthrough automatically the FIRST time, because a pilot
 * who has just been told no is exactly the pilot who needs it. */
const denyCore = (msg, render) => {
  ed.msg = msg;
  ed.core = true;
  tell(msg);
  try { startCoreTutorial(false); } catch { /* the card is a nicety, not the fix */ }
  render?.();
};

/* the editor's state survives sub-tab hops while the console is open */
const ed = { draft: null, open: null, list: null, dirty: false, msg: "", core: false };
const list = () => (ed.list ??= loadMissions());
const persist = () => { const e = saveMissions(list()); if (e) tell(`Could not save missions: ${e}`); };
/* A copy is YOURS. `builtin` is dropped along with `preset`, because the four
 * stock loops fly without a Mission core and a copy of one must not — otherwise
 * "duplicate MINE LOOP, then edit it" would be a way around the core entirely. */
const fresh = (m, name = m.name) => { const c = deserialize(serialize(m)); return makeMission({ ...c, id: undefined, name, preset: false, builtin: false, createdAt: sim.time, runs: 0 }); };
const capLabel = (v) => (v == null ? "—" : v > 1 ? "OD" : `${Math.round(v * 100)}%`);

/* ---- the live card --------------------------------------------------------- */

function liveCard(root, push) {
  /* the subtitle has to EXIST to be written to every frame: kit.card only adds
   * the <small> when it is given a hint, and "" is not one — so the refresher
   * wrote textContent on null, and that threw out of the console paint, out of
   * the HUD paint, and out of the engine's tick before it could render. An
   * active mission plus this panel open froze the canopy for good. */
  const c = card("AUTOPILOT", "—");
  const status = el("p", "tstatus");
  const banner = el("div", "task-banner");
  const bannerText = el("p");
  banner.append(bannerText, group(
    button("JUMP", () => answerAsk("jump"), "accent"),
    button("SUBLIGHT", () => answerAsk("sublight")),
    button("ABORT", () => answerAsk("abort"), "danger"),
  ));
  const steps = el("div", "tsteps");
  const acts = group(
    button("STOP", () => stopMission("stopped"), "danger"),
    button("PAUSE", () => pauseMission()),
    button("RESUME", () => resumeMission(), "accent"),
  );
  const [bStop, bPause, bResume] = acts.children;
  c.body.append(status, banner, steps, acts);
  root.append(c.card);
  let key = "";
  push(() => {
    const m = mission.active;
    c.card.hidden = !m;
    if (!m) return;
    const sub = c.head.querySelector("small");
    if (sub) sub.textContent = `${m.name} · ${mission.state.toUpperCase()}`;
    status.textContent = `${missionStatusLine()}${sim.ship.throttle ? ` · throttle ${Math.round(sim.ship.throttle * 100)}%` : ""}`;
    banner.hidden = mission.state !== "asking";
    if (mission.ask) bannerText.textContent = `Jump to ${mission.ask.node.name}? ${Math.round(sim.ship.charge).toLocaleString()} charge in hand, ${Math.round(mission.ask.reserve).toLocaleString()} for the spool.`;
    bPause.hidden = mission.state !== "running" && mission.state !== "asking";
    bResume.hidden = mission.state !== "paused";
    bStop.hidden = false;
    const k = `${m.id}:${mission.stepIx}:${m.steps.length}`;
    if (k !== key) {
      key = k;
      steps.replaceChildren(...m.steps.map((s, i) => el("div", `tstep${i === mission.stepIx ? " on" : i < mission.stepIx ? " done" : ""}`, `${i + 1}. ${describeStep(s)}`)));
    }
  });
}

/* ---- the step sheet ------------------------------------------------------------ */

function targetOptions(op) {
  const out = [];
  const spec = OPS[op];
  if (!spec?.target) return out;
  if (op === "DOCK") out.push({ kind: "best-buyer", name: null }, { kind: "best-smelter" }, { kind: "nearest-port" }, { kind: "locked" });
  else if (op === "MINE") out.push({ kind: "seam" }, { kind: "here" }, { kind: "locked" });
  else if (op === "SURVEY") out.push({ kind: "body", name: "nearest unsurveyed" }, { kind: "locked" });
  else out.push({ kind: "locked" }, { kind: "here" }, { kind: "best-buyer" }, { kind: "nearest-port" });
  if (op !== "DOCK" && op !== "MINE") for (const b of BODIES) if (b.kind !== "star") out.push({ kind: "body", id: b.id, name: b.name });
  if (op !== "MINE" && op !== "SURVEY") for (const s of stations) if (!s.hostile || s.claimed) out.push({ kind: "station", id: s.id, name: s.name });
  if (op !== "SURVEY") for (const w of sim.waypoints) if (!w.transient) out.push({ kind: "wp", id: w.id, name: w.name });
  return out;
}
const refKey = (r) => (r ? `${r.kind}:${r.id ?? r.name ?? ""}` : "");
const refLabel = (r) => r.name ?? { "best-buyer": "best buyer", "best-smelter": "best smelter", "nearest-port": "nearest port", seam: "nearest seam", here: "here", locked: "locked target" }[r.kind] ?? r.kind;

/** metric chips × op chips × numeric stepper; writes into holder[key] */
function condBuilder(holder, key, onChange) {
  const wrap = el("div", "tcond");
  const c = holder[key] ?? null;
  const leaf = c && !c.all && !c.any && c.not === undefined ? c : null;
  const on = chips([{ id: "none", label: "NONE" }, ...COND_KEYS.map((k) => ({ id: k, label: k === "cargoOf" ? "cargo" : k }))], {
    value: leaf?.k ?? "none",
    onPick: (k) => {
      if (k === "none") holder[key] = null;
      else holder[key] = k === "docked" ? { k, op: "==", v: true } : { k, op: ">=", v: k === "hold" || k === "charge" ? 0.9 : k === "time" ? 60 : k === "credits" ? 10000 : 1, ...(k === "cargoOf" ? { id: "iron_ore" } : {}) };
      onChange();
    },
  });
  wrap.append(on.row);
  if (leaf && leaf.k !== "docked") {
    const ops = chips(COND_OPS.map((o) => ({ id: o, label: o })), { value: leaf.op, onPick: (o) => { leaf.op = o; onChange(); } });
    const frac = leaf.k === "hold" || leaf.k === "charge";
    const step = frac ? 0.05 : leaf.k === "credits" ? 500 : leaf.k === "time" ? 15 : 1;
    const inp = el("input", "tinput");
    inp.type = "number"; inp.step = String(frac ? 5 : step); inp.value = String(frac ? Math.round(leaf.v * 100) : leaf.v);
    inp.addEventListener("change", () => { const v = Number(inp.value); if (isFinite(v)) { leaf.v = frac ? v / 100 : v; onChange(); } });
    const nudge = (d) => { leaf.v = Math.max(0, +(leaf.v + d).toFixed(3)); onChange(); };
    const num = group(button("−", () => nudge(-step)), inp, el("span", "unit", COND_UNITS[leaf.k] ?? ""), button("+", () => nudge(step)));
    wrap.append(ops.row, num);
    if (leaf.k === "cargoOf") {
      const id = el("input", "tinput"); id.placeholder = "good id"; id.value = leaf.id ?? "";
      id.addEventListener("change", () => { leaf.id = id.value.trim(); onChange(); });
      wrap.append(id);
    }
  } else if (leaf?.k === "docked") {
    wrap.append(chips([{ id: true, label: "DOCKED" }, { id: false, label: "IN FLIGHT" }], { value: leaf.v, onPick: (v) => { leaf.v = v; onChange(); } }).row);
  }
  return wrap;
}

function stepSheet(m, ix, render) {
  const s = m.steps[ix];
  const spec = OPS[s.op] ?? {};
  const c = card(`STEP ${ix + 1} · ${spec.label ?? s.op}`, describeStep(s));
  const b = c.body;
  if (spec.target) {
    b.append(el("p", "tlab", "Target"));
    const opts = targetOptions(s.op);
    b.append(chips(opts.map((r) => ({ id: refKey(r), label: refLabel(r) })), { value: refKey(s.target), onPick: (id) => { s.target = { ...opts.find((r) => refKey(r) === id) }; render(); } }).row);
  }
  if (s.op === "SELL" || s.op === "STASH") {
    b.append(el("p", "tlab", "What"));
    b.append(chips([{ id: "ore", label: "ORE" }, { id: "all", label: "ALL" }], { value: s.args?.what ?? "ore", onPick: (w) => { s.args = { ...s.args, what: w }; render(); } }).row);
  }
  if (s.op === "BUY") {
    b.append(el("p", "tlab", "Good · quantity"));
    const good = el("input", "tinput"); good.placeholder = "best margin"; good.value = s.args?.good ?? "";
    good.addEventListener("change", () => { s.args = { ...s.args, good: good.value.trim() || null }; render(); });
    const qty = el("input", "tinput"); qty.type = "number"; qty.value = String(s.args?.qty ?? 20);
    qty.addEventListener("change", () => { s.args = { ...s.args, qty: Math.max(1, Math.round(Number(qty.value) || 1)) }; render(); });
    b.append(group(good, qty));
  }
  if (s.op === "SET") {
    b.append(el("p", "tlab", "Turret rule · cutter"));
    b.append(chips([{ id: "", label: "—" }, "enemies", "all", "safe"].map((x) => (typeof x === "string" ? { id: x, label: x ? x.toUpperCase() : "—" } : x)), { value: s.args?.turretMode ?? "", onPick: (v) => { s.args = { ...s.args, turretMode: v || undefined }; render(); } }).row);
    b.append(chips([{ id: "", label: "—" }, { id: "off", label: "OFF" }, { id: "closest", label: "CLOSEST" }, { id: "overdrive", label: "OVERDRIVE" }], { value: s.args?.miningMode ?? "", onPick: (v) => { s.args = { ...s.args, miningMode: v || undefined }; render(); } }).row);
  }
  if (spec.until !== undefined || s.op === "HOLD" || s.op === "MINE" || s.op === "CHARGE" || s.op === "WAIT") {
    b.append(el("p", "tlab", "Until"));
    b.append(condBuilder(s, "until", render));
  }
  b.append(el("p", "tlab", "Thrust cap · warp · on fail (blank = mission default)"));
  b.append(chips([{ id: "", label: "DEFAULT" }, ...CAPS], { value: s.thrustCap ?? "", onPick: (v) => { if (v === "") delete s.thrustCap; else s.thrustCap = v; render(); } }).row);
  b.append(chips([{ id: "", label: "DEFAULT" }, ...WARPS], { value: s.warp ?? "", onPick: (v) => { if (v === "") delete s.warp; else s.warp = v; render(); } }).row);
  b.append(chips(ON_FAIL.map((f) => ({ id: f, label: f.toUpperCase() })), { value: s.onFail ?? "abort", onPick: (v) => { s.onFail = v; render(); } }).row);
  b.append(group(
    button("▲", () => { if (ix > 0) { m.steps.splice(ix - 1, 2, m.steps[ix], m.steps[ix - 1]); ed.open = ix - 1; render(); } }),
    button("▼", () => { if (ix < m.steps.length - 1) { m.steps.splice(ix, 2, m.steps[ix + 1], m.steps[ix]); ed.open = ix + 1; render(); } }),
    button("DELETE STEP", () => { m.steps.splice(ix, 1); ed.open = null; render(); }, "danger"),
    button("CLOSE", () => { ed.open = null; render(); }),
  ));
  return c.card;
}

/* ---- the editor ------------------------------------------------------------------- */

function editor(root, ctx) {
  const host = el("div", "tmission");
  root.append(host);
  const core = () => missionCore();   /* either core — js/mission/run.js */
  const render = () => {
    host.replaceChildren();
    if (ed.msg) {
      const w = section(ed.core ? "⚠ MISSION CORE NEEDED" : "⚠ NOT DONE");
      note(w, ed.msg);
      if (ed.core) {
        note(w, "A Mission core is the box that remembers a plan: several steps in a row, loops, and conditions like \"until the hold is full\". 7,500 cr at a logistic or military yard — or 11,000 for the Conn learning core, which carries one. The four presets above fly without it.");
        note(w, "SHOW ME HOW closes the console and walks you through it: the nearest yard that fits one, the warp, the approach, the berth, and which desk sells it.");
      }
      const r = row(w, "", { value: "" });
      if (ed.core) r.value.append(button("SHOW ME HOW", () => { ed.msg = ""; ed.core = false; startCoreTutorial(true); closeConsole(); }, "accent"), " ");
      r.value.append(button("OK", () => { ed.msg = ""; ed.core = false; render(); }, "tiny"));
      host.append(w);
    }
    /* presets */
    /* What is on the ports' lines, wherever you are. A fabrication job runs on
     * sim time at a berth you have probably already left, so without this the
     * only way to know how it was getting on was to fly back and open the deck. */
    const jobs = fabReport();
    if (jobs.length) {
      const fs = section(`PORT LINES · ${jobs.length}`);
      for (const j of jobs) {
        const r = row(fs, `${j.qty} × ${j.name}`, {
          hint: `${j.port}${j.by === "company" ? " · company" : ""} · ${j.left > 0 ? `${j.left >= 90 ? `${Math.round(j.left / 60)} min` : `${j.left} s`} left` : "finishing"} · into the locker`,
          value: `${Math.round(j.frac * 100)}%`,
        });
        r.value.append(el("br"), button("PULL", () => { cancelFab(j.id); tell(`${j.name} pulled off the line at ${j.port}.`); }, "danger tiny"));
      }
      root.append(fs);
    }

    /* The four stock loops. They are `builtin`, so RUN flies them whether or
     * not a Mission core is aboard — the core gates missions you WRITE, and
     * gating the ones the game ships with left a coreless pilot with no
     * multi-step autopilot at all. COPY lifts one into the editor, and that
     * copy is yours, and gated. */
    const sp = section("PRESETS");
    note(sp, "Built in — these fly with no Mission core fitted. COPY makes one yours to edit.");
    for (const p of presets()) {
      const L = p.loop ?? { mode: "none" };
      const r = row(sp, p.name, { hint: `${p.steps.length} steps · loop ${L.mode === "none" ? "none" : L.mode === "count" ? `×${L.count === Infinity ? "∞" : L.count}` : `until ${describeCond(L.until)}`}` });
      r.value.append(group(
        button("RUN", () => {
          if (startMission(p)) { ed.msg = ""; ed.core = false; ctx.openConsole?.("nav", "autopilot"); return; }
          deny(sim.notice || `${p.name} would not start.`, render);
        }, "accent"),
        button("COPY", () => { ed.draft = fresh(p); ed.open = null; ed.msg = ""; ed.core = false; render(); }),
      ));
    }
    host.append(sp);
    /* the saved list */
    const ss = section("SAVED MISSIONS");
    if (!list().length) note(ss, "Nothing saved yet — pick a preset or build one below, then SAVE.");
    for (const m of list()) {
      const r = row(ss, m.name, { hint: `${m.steps.length} step${m.steps.length === 1 ? "" : "s"} · loop ${m.loop.mode === "none" ? "none" : m.loop.mode === "count" ? `×${m.loop.count === Infinity ? "∞" : m.loop.count}` : `until ${describeCond(m.loop.until)}`} · ${m.runs ?? 0} runs` });
      r.value.append(group(
        button("RUN", () => { if (startMission(m)) { persist(); ctx.openConsole?.("nav", "autopilot"); } }, "accent"),
        button("EDIT", () => { ed.draft = deserialize(serialize(m)); ed.open = null; render(); }),
        button("DUP", () => { list().push(fresh(m, `${m.name} copy`)); persist(); render(); }),
        button("DEL", () => { const i = list().indexOf(m); if (i >= 0) list().splice(i, 1); persist(); render(); }, "danger"),
      ));
    }
    host.append(ss);
    /* the draft */
    const m = ed.draft ??= makeMission({ name: "New mission", steps: [], createdAt: sim.time });
    const se = section("EDITOR");
    if (!core()) note(se, "Without a Mission core (refit at a logistic or military yard) the autopilot flies one step at a time; loops and multi-step missions wait for the core.");
    const name = el("input", "tinput"); name.value = m.name; name.placeholder = "mission name";
    name.addEventListener("change", () => { m.name = name.value.trim() || "Mission"; });
    row(se, "Name").value.append(name);
    const dCap = row(se, "Thrust cap", { hint: "a ceiling under the power rule" });
    dCap.value.append(chips(CAPS, { value: m.defaults.thrustCap, onPick: (v) => { m.defaults.thrustCap = v; } }).row);
    const dWarp = row(se, "Warp", { hint: "auto jumps · ask parks aligned and asks · never is sublight only" });
    dWarp.value.append(chips(WARPS, { value: m.defaults.warp, onPick: (v) => { m.defaults.warp = v; } }).row);
    /* steps */
    const errs = validate(m);
    m.steps.forEach((s, i) => {
      const bad = errs.find((e) => e.step === i);
      const r = row(se, `${i + 1}. ${describeStep(s)}`, { hint: bad ? `⚠ ${bad.msg}` : "" });
      r.row.classList.add("tstep-row");
      r.value.append(button(ed.open === i ? "CLOSE" : "EDIT", () => { ed.open = ed.open === i ? null : i; render(); }));
      if (ed.open === i) se.append(stepSheet(m, i, render));
    });
    const add = el("div", "tadd");
    /* The one-step limit is stated BEFORE it is hit, not after. Without a
     * Mission core a mission is one step, and a row of chips that all look
     * tappable is a promise the editor cannot keep. */
    const locked = !core() && m.steps.length >= 1;
    add.append(el("p", "tlab", locked ? "ADD STEP · LOCKED" : "ADD STEP"));
    if (locked) note(add, "One step at a time until a Mission core is fitted — refit at a logistic or military yard. The presets above still run as they are.");
    const addRow = chips(Object.entries(OPS).map(([id, o]) => ({ id, label: o.label.toUpperCase() })), {
      value: null,
      onPick: (op) => {
        if (locked) { denyCore("One step at a time until a Mission core is fitted.", render); return; }
        const t = targetOptions(op)[0] ?? null;
        m.steps.push(makeStep(op, t ? { ...t } : null));
        ed.open = m.steps.length - 1;
        ed.msg = "";
        render();
      },
    }).row;
    if (locked) for (const b of addRow.children) b.disabled = true;
    add.append(addRow);
    se.append(add);
    /* loop */
    const L = m.loop;
    const lr = row(se, "Loop", { hint: L.mode === "until" ? `until ${describeCond(L.until)}` : "" });
    lr.value.append(chips([{ id: "none", label: "NONE" }, { id: "count", label: "×N" }, { id: "until", label: "UNTIL" }], {
      value: L.mode,
      onPick: (mode) => {
        if (mode !== "none" && !core()) { denyCore("Loops need a Mission core — refit at a logistic or military yard.", render); return; }
        m.loop = mode === "none" ? { mode } : mode === "count" ? { mode, count: L.count ?? 3 } : { mode, until: L.until ?? { k: "credits", op: ">=", v: 50000 } };
        render();
      },
    }).row);
    if (L.mode === "count") {
      const cnt = el("b", null, L.count === Infinity ? "∞" : String(L.count));
      se.append(group(button("−", () => { L.count = L.count === Infinity ? 9 : Math.max(1, L.count - 1); render(); }), cnt, button("+", () => { L.count = L.count === Infinity ? Infinity : L.count + 1; render(); }), button("∞", () => { L.count = Infinity; render(); })));
    }
    if (L.mode === "until") se.append(condBuilder(L, "until", render));
    for (const e of errs.filter((x) => x.step < 0)) note(se, `⚠ ${e.msg}`);
    se.append(group(
      button("RUN", () => {
        if (startMission(m)) { ed.msg = ""; ctx.openConsole?.("nav", "autopilot"); return; }
        /* startMission already put its reason on sim.notice, behind this sheet */
        deny(sim.notice || "The autopilot would not take that mission.", render);
      }, "accent"),
      button("SAVE", () => { const i = list().findIndex((x) => x.id === m.id); if (i >= 0) list()[i] = m; else list().push(m); persist(); tell(`${m.name} saved.`); render(); }),
      button("NEW", () => { ed.draft = null; ed.open = null; render(); }),
    ));
    host.append(se);
  };
  render();
}

/* ---- the panel ------------------------------------------------------------------------ */

export default {
  id: "work",
  title: "WORK",
  order: 40,
  subtabs: [{ id: "mission", label: "MISSION" }, { id: "drones", label: "DRONES" }, { id: "fleet", label: "FLEET" }, { id: "tape", label: "TAPE" }],
  mount(root, ctx) {
    const sub = ctx?.sub ?? "mission";
    if (sub === "drones") return workDrones.mount(root, ctx);
    if (sub === "fleet") return workFleet.mount(root, ctx);
    if (sub === "tape") return workTape.mount(root, ctx);
    ed.list = loadMissions();
    liveCard(root, ctx.push);
    editor(root, ctx);
    return null;
  },
  paint(state, ctx) {
    const sub = ctx?.sub ?? "mission";
    if (sub === "drones") return workDrones.paint(state, ctx);
    if (sub === "fleet") return workFleet.paint(state, ctx);
    if (sub === "tape") return workTape.paint(state, ctx);
    return null;
  },
  unmount(ctx) {
    workDrones.unmount?.(ctx);
    workFleet.unmount?.(ctx);
    workTape.unmount?.(ctx);
    ed.open = null;
  },
  search() {
    const out = [];
    for (const m of loadMissions()) out.push({ label: m.name, hint: `mission · ${m.steps.length} steps`, sub: "mission", keywords: "mission autopilot", run: () => { if (!startMission(m)) return; } });
    for (const p of presets()) out.push({ label: `Preset ${p.name}`, hint: "mission preset", sub: "mission", keywords: "mission preset autopilot loop" });
    if (mission.active) out.push({ label: "Stop mission", hint: missionStatusLine(), sub: "mission", keywords: "autopilot stop", run: () => stopMission("stopped") });
    return [...out, ...workDrones.search(), ...workFleet.search(), ...workTape.search()];
  },
};
