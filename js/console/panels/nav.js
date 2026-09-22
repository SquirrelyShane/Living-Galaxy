/* LIVING GALAXY — CONSOLE › NAV: TARGETS · SURVEY · AUTOPILOT · MARKS · CONTACTS
 *
 * The locked body and every body nearest-first, the mission autopilot's
 * status and one-step orders, waypoints with live range/bearing/elevation,
 * and the sensor contacts whose relations the turret rules read.
 */

import { button, el, group, note, row, section, fmtDist } from "../kit.js";
import { BODIES, bodyById, bodyPosition, dist3, tempLabel } from "../../bodies.js";
import { contacts } from "../../turrets.js";
import { TURRET_MODES, forwardOf, rightOf, upOf } from "../../ship.js";
import { addBodyWaypoint, addWaypoint, cycleRelation, removeWaypoint, requestScan, selectBody, setActiveWaypoint, setRelation, sim, stationStatus, toggleWarp, warpBlock, warpStatus, waypointPosition } from "../../sim.js";
import { mission, missionStatusLine, startMission, stopMission, pauseMission, resumeMission, answerAsk } from "../../mission/run.js";
import { oneStep } from "../../mission/script.js";
import * as AP from "../../autopilot.js";
import { nearbyRocks, inBelt } from "../../field.js";
import { assayRock } from "../../bodygen/body.js";
import { CLASSES } from "../../bodygen/classes.js";
import { shipFx } from "../../ship.js";
import { ariaTakeConn, ariaRelease, ariaHasConn, ariaWatchReport, preferenceReport, adviceReport } from "../../aria.js";
import { stationById } from "../../stations.js";
import { goodName } from "../../materials.js";

/* `nearestSeam` is a primitive package C exports from autopilot.js; reach it through the namespace so the panel loads either way. */
const autopilot = AP.autopilot;

const _p = { x: 0, y: 0, z: 0 };

/* ---- TARGETS --------------------------------------------------------------- */

const lockedRef = () => (sim.selected ? { kind: "locked", id: sim.selected, name: bodyById(sim.selected)?.name } : null);

function mountTargets(root, push) {
  const ship = sim.ship;

  const lock = section("Locked target");
  const lockName = row(lock, "Body");
  const lockDist = row(lock, "Distance");
  const lockG = row(lock, "Surface gravity");
  const lockYield = row(lock, "Yield tier");
  const lockTemp = row(lock, "Surface temp");
  const lockScan = row(lock, "Survey");
  const jumpRow = row(lock, "Warp core", { hint: "Spools for 6 s under heavy load. Needs clear space and a clear lane." });
  const jumpBtn = button("WARP", () => toggleWarp());
  const scanBtn = button("SURVEY", () => requestScan());
  const apprBtn = button("APPROACH", () => { const ref = lockedRef(); if (!ref) { sim.notice = "Lock a body first."; return; } if (!startMission(oneStep("APPROACH", ref, sim.autoPlan?.defaults ?? {}))) sim.notice = "The autopilot would not take it — check the conn and the core."; });
  jumpRow.value.replaceChildren(group(scanBtn, apprBtn, jumpBtn));
  const blockRow = row(lock, "Lane status");
  root.append(lock);

  const list = section("Bodies, nearest first");
  const listBody = el("div");
  list.append(listBody);
  root.append(list);

  const rows = BODIES.map((b) => {
    const r = row(listBody, b.name, { hint: `${b.stats.tierName} · ${b.stats.gEarth.toFixed(2)} g · ${Math.round(b.stats.radiusKm)} km` });
    r.row.dataset.focus = `body-${b.id}`;
    const dist = el("span", "v", "");
    r.value.replaceChildren(group(dist, button("LOCK", () => selectBody(b.id), "tiny"), button("MARK", () => addBodyWaypoint(b.id), "tiny")));
    return { id: b.id, r, dist };
  });
  let navOrder = "";

  push(() => {
    const sel = bodyById(sim.selected);
    lockName.value.textContent = sel?.name ?? "—";
    if (sel) {
      bodyPosition(sel.id, sim.time, _p);
      lockDist.value.textContent = fmtDist(dist3(ship.pos, _p));
      lockG.value.textContent = `${sel.stats.gEarth.toFixed(2)} g (${Math.round(sel.stats.escape)} u/s escape)`;
      lockYield.value.textContent = `${sel.stats.tierName} — ${sel.stats.deposits.join(", ")}`;
      lockTemp.value.textContent = tempLabel(sel);
      lockTemp.value.className = `v ${(sel.thermal ?? 0) > 25 ? "hot" : ""}`;
      lockScan.value.textContent = sim.scanned.has(sel.id) ? "logged" : "not surveyed";
    } else {
      for (const r of [lockDist, lockG, lockYield, lockTemp, lockScan]) r.value.textContent = "—";
    }
    const st = warpStatus();
    const why = st.state === "idle" ? warpBlock() : "";
    jumpBtn.disabled = st.state === "run" || (st.state === "idle" && Boolean(why));
    jumpBtn.textContent = st.state === "spool" ? `ABORT ${Math.round(st.progress * 100)}%` : st.state === "run" ? "IN WARP" : "WARP";
    jumpBtn.classList.toggle("danger", st.state === "spool");
    apprBtn.disabled = !sel;
    blockRow.value.textContent = st.state === "spool" ? "SPOOLING" : why || "LANE CLEAR";
    blockRow.value.className = `v ${why && st.state === "idle" ? "hot" : "good"}`;

    const sorted = rows.map((r) => { bodyPosition(r.id, sim.time, _p); return { r, d: dist3(ship.pos, _p) }; }).sort((a, b) => a.d - b.d);
    /* only re-seat the rows when the order actually changes — an append per row per tick is a reflow storm */
    const order = sorted.map((x) => x.r.id).join("|");
    const reorder = order !== navOrder;
    navOrder = order;
    for (const { r, d } of sorted) {
      r.dist.textContent = fmtDist(d);
      r.r.row.classList.toggle("hot", sim.selected === r.id);
      if (reorder) listBody.append(r.r.row);
    }
  });
}

/* ---- AUTOPILOT ------------------------------------------------------------- */

const CAPS = [[0.25, "25%"], [0.5, "50%"], [0.75, "75%"], [1, "100%"]];
const WARPS = [["auto", "AUTO"], ["ask", "ASK"], ["never", "NEVER"]];

function mountAutopilot(root, push, ctx) {
  const defaults = () => { sim.autoPlan = sim.autoPlan ?? {}; sim.autoPlan.defaults = sim.autoPlan.defaults ?? { thrustCap: 1, warp: "auto" }; return sim.autoPlan.defaults; };

  const st = section("Mission autopilot");
  const line = row(st, "Status");
  const step = row(st, "Step");
  const phase = row(st, "Phase");
  const pwr = row(st, "Power", { hint: "throttle now · sustainable · battery" });
  const ctl = row(st, "Control");
  const stopBtn = button("STOP", () => { stopMission("stopped from the console"); }, "danger");
  const pauseBtn = button("PAUSE", () => { if (mission.state === "paused") resumeMission(); else pauseMission(); });
  ctl.value.replaceChildren(group(pauseBtn, stopBtn));
  const ask = el("div", "tcard ask hidden");
  const askHead = el("div", "head");
  const askTxt = el("b", null, "");
  askHead.append(askTxt);
  const askBody = el("div", "body");
  askBody.append(group(button("JUMP", () => answerAsk("jump"), "on"), button("SUBLIGHT", () => answerAsk("sublight")), button("ABORT", () => answerAsk("abort"), "danger")));
  ask.append(askHead, askBody);
  st.append(ask);
  root.append(st);

  const one = section("One-step orders");
  note(one, "Each flies as a one-step mission with the caps below. Edit as a mission for loops, conditions and multi-leg runs.");
  const capRow = row(one, "Thrust cap");
  const capBtns = CAPS.map(([v, l]) => button(l, () => { defaults().thrustCap = v; }, "tiny"));
  capRow.value.replaceChildren(group(...capBtns));
  const warpRow = row(one, "Warp policy", { hint: "AUTO jumps when it can; ASK parks at the align point and asks; NEVER stays sublight." });
  const warpBtns = WARPS.map(([v, l]) => button(l, () => { defaults().warp = v; }, "tiny"));
  warpRow.value.replaceChildren(group(...warpBtns));
  const go = (op, ref) => { if (!ref) { sim.notice = "Nothing to fly to."; return; } if (!startMission(oneStep(op, ref, { ...defaults() }))) sim.notice = "The autopilot would not take it — check the conn and the core."; };
  const goRow = row(one, "Locked body");
  goRow.value.replaceChildren(group(button("GOTO", () => go("GOTO", lockedRef()), "tiny"), button("APPROACH", () => go("APPROACH", lockedRef()), "tiny")));
  const mineRow = row(one, "Nearest seam");
  mineRow.value.replaceChildren(button("MINE", () => { const s = AP.nearestSeam?.(); go("MINE", s ? { kind: "point", ...s, name: "seam" } : { kind: "seam", name: "nearest seam" }); }, "tiny"));
  const dockRow = row(one, "Nearest port");
  dockRow.value.replaceChildren(button("DOCK", () => go("DOCK", { kind: "nearest-port", name: "nearest port" }), "tiny"));
  const editRow = row(one, "Plan the run");
  editRow.value.replaceChildren(button("EDIT AS MISSION", () => ctx.openConsole("work", "mission"), "tiny"));
  root.append(one);

  push(() => {
    const active = Boolean(mission.active);
    const txt = missionStatusLine() || (autopilot.on ? `${autopilot.mode.toUpperCase()} · ${autopilot.phase}` : "idle");
    line.value.textContent = txt;
    line.value.className = `v ${active || autopilot.on ? "good" : ""}`;
    const m = mission.active;
    const s = m?.steps?.[mission.stepIx];
    step.value.textContent = m ? `${mission.stepIx + 1}/${m.steps.length} ${s?.op ?? ""}${s?.target?.name ? ` ${s.target.name}` : ""}` : "—";
    phase.value.textContent = active ? `${mission.state} · ${autopilot.phase}` : autopilot.on ? autopilot.phase : "—";
    const P = autopilot.power ?? {};
    pwr.value.textContent = `${Math.round((P.throttle ?? 0) * 100)}% · ${Math.round((P.sustainable ?? 0) * 100)}% · ${Math.round((P.frac ?? 1) * 100)}%`;
    stopBtn.disabled = !active && !autopilot.on;
    pauseBtn.disabled = !active;
    pauseBtn.textContent = mission.state === "paused" ? "RESUME" : "PAUSE";
    const asking = mission.state === "asking" && mission.ask;
    ask.classList.toggle("hidden", !asking);
    if (asking) askTxt.textContent = `Jump to ${mission.ask.node?.name ?? "the node"}? ${Math.round(mission.ask.reserve ?? 0)} charge in hand.`;
    const d = defaults();
    capBtns.forEach((b, i) => b.classList.toggle("on", Math.abs(CAPS[i][0] - d.thrustCap) < 1e-6));
    warpBtns.forEach((b, i) => b.classList.toggle("on", WARPS[i][0] === d.warp));
    goRow.value.querySelectorAll("button").forEach((b) => { b.disabled = !sim.selected; });
    const port = stationStatus();
    dockRow.value.firstChild.disabled = !port;
  });
}

/* ---- MARKS ----------------------------------------------------------------- */

function mountMarks(root, push) {
  const mark = section("Mark a position");
  note(mark, "At these distances a bearing is worth more than a map. The active mark draws in the canopy and reads out on the HUD.");
  const nameRow = row(mark, "Name");
  const input = el("input", "tinput");
  input.placeholder = "Optional";
  input.maxLength = 18;
  nameRow.value.replaceChildren(group(input, button("MARK HERE", () => { addWaypoint(input.value.trim()); input.value = ""; rebuild(); })));
  root.append(mark);

  const list = section("Waypoints");
  const body = el("div");
  list.append(body);
  root.append(list);

  let key = "";
  function rebuild() {
    const k = sim.waypoints.map((w) => w.id).join(",") + "|" + sim.activeWaypoint;
    if (k === key) return;
    key = k;
    body.innerHTML = "";
    if (!sim.waypoints.length) { body.append(el("div", "tempty", "No marks set.")); return; }
    for (const w of sim.waypoints) {
      const active = w.id === sim.activeWaypoint;
      const r = row(body, w.name, { hint: w.body ? "tracks the body" : "fixed point" });
      const dist = el("span", "v", "");
      r.value.replaceChildren(group(dist,
        button(active ? "ACTIVE" : "SET", () => { setActiveWaypoint(w.id); rebuild(); }, active ? "on tiny" : "tiny"),
        button("DEL", () => { removeWaypoint(w.id); rebuild(); }, "danger tiny")));
      r.row.dataset.wp = w.id;
      r.row.dataset.focus = `wp-${w.id}`;
      r.row.__dist = dist;
    }
  }
  rebuild();

  push(() => {
    rebuild();
    const ship = sim.ship;
    const f = forwardOf(ship.yaw, ship.pitch);
    const rt = rightOf(ship.yaw);
    const up = upOf(ship.yaw, ship.pitch);
    for (const node of body.querySelectorAll("[data-wp]")) {
      const w = sim.waypoints.find((x) => x.id === node.dataset.wp);
      if (!w || !node.__dist) continue;
      waypointPosition(w, _p);
      const dx = _p.x - ship.pos.x, dy = _p.y - ship.pos.y, dz = _p.z - ship.pos.z;
      const d = Math.hypot(dx, dy, dz) || 1;
      const fwd = (dx * f.x + dy * f.y + dz * f.z) / d;
      const side = (dx * rt.x + dy * rt.y + dz * rt.z) / d;
      const vert = (dx * up.x + dy * up.y + dz * up.z) / d;
      const bearing = Math.round((Math.atan2(side, fwd) * 180) / Math.PI);
      const elev = Math.round((Math.asin(Math.max(-1, Math.min(1, vert))) * 180) / Math.PI);
      node.__dist.textContent = `${fmtDist(d)} · ${bearing >= 0 ? "R" : "L"}${Math.abs(bearing)}° ${elev >= 0 ? "U" : "D"}${Math.abs(elev)}°`;
    }
  });
}

/* ---- CONTACTS -------------------------------------------------------------- */

function mountContacts(root, push) {
  const ship = sim.ship;
  const head = section("Sensor contacts");
  note(head, "Relations drive the NEUTRAL, ENEMIES and ALLIES turret rules. CASTLE ignores all of this and only answers what shoots you.");
  const rule = row(head, "Active rule");
  const quick = row(head, "Bulk");
  quick.value.replaceChildren(group(button("ALL HOSTILE", () => bulk("hostile"), "tiny danger"), button("ALL NEUTRAL", () => bulk("neutral"), "tiny")));
  root.append(head);

  const list = section("Tracked");
  const body = el("div");
  list.append(body);
  root.append(list);

  let key = "";
  push(() => {
    const mode = TURRET_MODES.find((m) => m.id === ship.turretMode);
    rule.value.textContent = ship.turretsArmed ? (mode?.label ?? "OFF") : "STOWED";
    rule.value.className = `v ${["ffa", "allies", "neutral", "enemies"].includes(ship.turretMode) ? "hot" : ""}`;
    const k = contacts.map((c) => `${c.id}:${c.relation}`).join(",");
    if (k !== key) {
      key = k;
      body.innerHTML = "";
      if (!contacts.length) body.append(el("div", "tempty", "Nothing on sensors."));
      for (const c of contacts) {
        const r = row(body, c.name, { hint: `${c.kind} · hull ${Math.round(c.hp)}` });
        const dist = el("span", "v", "");
        r.value.replaceChildren(group(dist, button(c.relation.toUpperCase(), (e) => { cycleRelation(c.id); e.target.textContent = c.relation.toUpperCase(); key = ""; }, `tiny ${c.relation === "hostile" ? "danger" : c.relation === "ally" ? "on" : ""}`)));
        r.row.dataset.cid = c.id;
        r.row.dataset.focus = `contact-${c.id}`;
        r.row.__dist = dist;
      }
    }
    for (const node of body.querySelectorAll("[data-cid]")) {
      const c = contacts.find((x) => x.id === node.dataset.cid);
      if (!c || !node.__dist) continue;
      const d = Math.hypot(c.x - ship.pos.x, c.y - ship.pos.y, c.z - ship.pos.z);
      const inRange = d < ship.tune.turretRange;
      node.__dist.textContent = `${fmtDist(d)}${inRange ? " · IN RANGE" : ""}`;
      node.__dist.className = `v ${inRange ? "warn" : ""}`;
    }
  });
  function bulk(rel) { for (const c of contacts) if (c.relation !== rel) setRelation(c.id, rel); key = ""; }
}

/* ---- ARIA ------------------------------------------------------------------
 *
 * What the ship's core has learned from watching you, and the button that
 * lets it fly. It is not a second autopilot — it holds the conn the way a crew
 * captain does — and the core it flies with is the one that has been taking a
 * label off your own hands since the first time you took the stick.
 */
function mountAria(root) {
  const w = ariaWatchReport();
  const s = section(w.flying ? "ARIA — HAS THE CONN" : "ARIA — THE SHIP'S CORE");
  row(s, "Watched", { value: `${w.observations.toLocaleString()}`, hint: "labelled examples taken off the way you fly" });
  row(s, "Scored", { value: `${w.outcomes.toLocaleString()}`, hint: "decisions it has since graded against what happened" });
  if (w.flying) {
    row(s, "This watch", { value: `${w.jobs} job${w.jobs === 1 ? "" : "s"}`, hint: `${w.heldFor}s at the conn · ${w.earned >= 0 ? "+" : ""}${w.earned} cr${w.job ? ` · now ${w.job}: ${w.why}` : ""}` });
    const c = row(s, "Conn");
    c.value.append(button("STAND DOWN", () => { const r = ariaRelease(); sim.notice = r.ok ? "You have the conn." : r.error; }, "danger"));
  } else {
    const c = row(s, "Conn", { hint: w.observations < 40 ? "it will fly, but it has not watched you for long" : "flies the way you do" });
    c.value.append(button("TAKE THE CONN", () => { const r = ariaTakeConn(); if (!r.ok) sim.notice = r.error; }, "accent"));
  }
  note(s, w.observations < 40
    ? "Fly it yourself for a while first. Every few seconds of your own flying is one more example it has to go on."
    : "It works the ship the way you do — the job you spend your time on, flown by the autopilot — and hands it back the moment you touch the stick. The ARIA button on the flight HUD does the same.");
  { const h = w.habits; if (h.total) row(s, "Your jobs", { value: ["mine", "sell", "survey"].map((j) => `${j} ${Math.round(h.share[j] * 100)}%`).join(" · "), hint: "what it will pick when it has the conn" }); }
  root.append(s);

  for (const [kind, label, unit] of [["port", "WHERE YOU SELL", "sales"], ["ore", "WHAT YOU CUT", "cuts"]]) {
    const rows = preferenceReport(kind).slice(0, 6);
    if (!rows.length) continue;
    const p = section(label);
    for (const r of rows) {
      const st2 = kind === "port" ? stationById(r.key) : null;
      const name = st2?.name ?? goodName(r.key) ?? r.key;
      row(p, name, { value: `${r.n} ${unit}`, bar: true, hint: `${Math.round(r.share * 100)}% of them · the autopilot leans ×${r.lean.toFixed(2)}` });
    }
    note(p, "A lean, not a rule — it will still take you to the better price, it just stops driving past the desk you always use.");
    root.append(p);
  }

  const a = adviceReport();
  if (a.length) {
    const ad = section("WHAT IT STOPPED TELLING YOU");
    for (const r of a) row(ad, r.kind, { value: r.muted ? "muted" : `${Math.round(r.rate * 100)}%`, hint: `${r.shown} raised · ${r.acted} acted on · ${r.ignored} ignored${r.muted ? " — it has stopped raising this" : ""}` });
    root.append(ad);
  }
}

/* ---- SURVEY ----------------------------------------------------------------
 *
 * What the locked rock actually is. The class, the mineral suite, and a
 * prospector's ticket priced off what a cutter would recover — the same
 * numbers the canopy is painting, because both come out of js/bodygen/.
 *
 * Without the assay deck refit you get the headline and the class, which is
 * what a survey set can tell from a spectrum. With it you get the whole suite.
 */
export function lockedRock() {
  const id = sim.lock?.id;
  if (!id || !inBelt(sim.ship.pos)) return null;
  return nearbyRocks(sim.ship.pos, sim.time, 2).find((r) => r.key === id) ?? null;
}

function mountSurvey(root) {
  const rock = lockedRock();
  const s = section("SURVEY");
  if (!rock) {
    note(s, inBelt(sim.ship.pos)
      ? "Nothing locked. P-LOCK a rock and the survey set reads it."
      : "No belt here. The survey set works on rock, not on worlds.");
    root.append(s);
    return;
  }
  const full = Boolean(shipFx.fx("assay", false));
  const a = assayRock(rock);
  const k = CLASSES[a.cls];

  row(s, "Class", { value: a.cls, hint: `${k.name} — ${k.tag}` });
  row(s, "Body", { value: a.shapeLabel ?? "—", hint: `${a.craterCount ?? 0} craters${(a.frostPct ?? 0) >= 1 ? ` · frost in ${Math.round(a.frostPct)}% of the cold traps` : ""}` });
  note(s, k.note);
  row(s, "Span", { value: `${Math.round(rock.r * 2 * 10)} m`, hint: `${rock.ice ? "icy body" : "rocky body"}${rock.rich ? " · rich seam called" : ""}` });
  row(s, "Worked", { value: `${Math.round((rock.worn ?? 0) * 100)}%`, bar: true, hint: rock.worn >= 0.97 ? "cut out" : "what the cutter has taken" });
  row(s, "Headline", { value: a.suite[0]?.name ?? "—", hint: `${(a.suite[0]?.pct ?? 0).toFixed(0)}% of the face` });
  root.append(s);

  const t = section(full ? "RECOVERABLE SUITE" : "SUITE — ASSAY DECK NOT FITTED");
  if (!full) {
    note(t, "A survey set reads the headline off the spectrum and stops there. An assay deck (industrial or agricultural yard) reads the whole suite, the tonnage and the ticket.");
    row(t, "Estimated", { value: "—", hint: `${a.suite.length} distinct species detected, unresolved` });
  } else {
    for (const r of a.suite) {
      row(t, r.name, { value: `${Math.round(r.units)} u`, bar: true, hint: `${r.pct.toFixed(1)}% of the face · ${Math.round(r.value).toLocaleString()} cr` });
    }
    row(t, "In situ", { value: `${Math.round(a.value).toLocaleString()} cr`, hint: `${Math.round(a.units)} units recoverable at this cutter rate · hold mass ${Math.round(a.holdMass)}` });
    if (a.worn > 0.02) note(t, `Priced on what is left: ${Math.round(a.worn * 100)}% of this rock is already in somebody's hold.`);
  }
  root.append(t);
}

/* ---- the panel ------------------------------------------------------------- */

const SUBS = { targets: mountTargets, survey: mountSurvey, autopilot: mountAutopilot, aria: mountAria, marks: mountMarks, contacts: mountContacts };

export default {
  id: "nav",
  title: "NAV",
  order: 20,
  subtabs: [{ id: "targets", label: "TARGETS" }, { id: "survey", label: "SURVEY" }, { id: "autopilot", label: "AUTOPILOT" }, { id: "aria", label: "ARIA" }, { id: "marks", label: "MARKS" }, { id: "contacts", label: "CONTACTS" }],
  mount(root, ctx) { (SUBS[ctx.sub] ?? mountTargets)(root, ctx.push, ctx); },
  paint() {},
  unmount() {},
  search() {
    const out = [];
    for (const b of BODIES) out.push({ label: b.name, hint: `${b.stats.tierName} · lock or mark`, sub: "targets", focus: `body-${b.id}`, keywords: `body world ${b.stats.deposits?.join(" ") ?? ""}`, status: () => (sim.selected === b.id ? "● LOCKED" : "") });
    for (const w of sim.waypoints ?? []) out.push({ label: `Mark: ${w.name}`, hint: w.body ? "tracks the body" : "fixed point", sub: "marks", focus: `wp-${w.id}`, keywords: "waypoint mark", status: () => (sim.activeWaypoint === w.id ? "● ACTIVE" : "") });
    for (const c of contacts) out.push({ label: c.name, hint: `${c.kind} · ${c.relation}`, sub: "contacts", focus: `contact-${c.id}`, keywords: "contact sensor" });
    out.push({ label: "Warp", hint: "spool the core at the locked body", sub: "targets", keywords: "jump core", run: () => toggleWarp() });
    out.push({ label: "Approach autopilot", hint: "fly to the locked body", sub: "autopilot", keywords: "auto fly", status: () => (mission.active ? missionStatusLine() : autopilot.on ? "ON" : "READY") });
    out.push({ label: "Mark here", hint: "a waypoint where you are", sub: "marks", keywords: "waypoint gps" });
    out.push({ label: "ARIA", hint: "hand the conn to the core that learned from you", sub: "aria", keywords: "assistant learn conn autopilot core", status: () => (ariaHasConn() ? "● FLYING" : `${ariaWatchReport().observations} seen`) });
    out.push({ label: "Survey the locked rock", hint: "class, mineral suite and a prospector's ticket", sub: "survey", keywords: "assay ore mineral prospect rock class", status: () => (lockedRock() ? "● LOCKED" : "NO ROCK") });
    return out;
  },
};
