/* LIVING GALAXY — CONSOLE › SHIP: STATUS · POWER · SYSTEMS · TRIM
 *
 * The numbers behind the gauges and every knob that has no business being a
 * thumb control: condition, the well you are in, the load ledger and shed
 * order, postures, master switches, engagement rules, trim. Each sub builds
 * its DOM once and pushes refreshers (ctx.push) that tick at HUD rate.
 */

import { button, el, group, note, pct, row, section, setBar, slider, fmtDist, fmtTime, clockOf } from "../kit.js";
import { mining, turretAim } from "../../turrets.js";
import { ring, sparkline } from "../../ui/charts.js";
import { MINING_MODES, SHED_LABEL, TUNE_SPEC, TURRET_MODES, batteryCap } from "../../ship.js";
import { moveShed, resetTune, setMiningMode, setTune, setTurretMode, sim, stationStatus, toggleSystem } from "../../sim.js";
import { useGameStore } from "../../store.js";
import { autopilot, sustainableThrottle } from "../../autopilot.js";
import { duties, dutyReport } from "../../crew/duties.js";
import { robotsSummary } from "../../crew/robots.js";
import { upgradeLines } from "../../upgrades.js";

const DOC = globalThis.document ?? null;

/* ---- postures (the CMD deck's one good idea) ----------------------------- */

export const POSTURES = [
  { id: "cruise", label: "Cruise", hint: "shields up, guns safe, assist on, sentry watching", want: { shields: true, engines: true, turretsArmed: false, assist: true, sentry: true, lights: false } },
  { id: "combat", label: "Combat", hint: "shields up, turrets armed on enemies, assist off, floods off", want: { shields: true, engines: true, turretsArmed: true, assist: false, sentry: true, lights: false }, turretMode: "enemies" },
  { id: "mining", label: "Mining", hint: "guns safe, assist on, floods on to read the rock, sentry watching", want: { shields: true, engines: true, turretsArmed: false, assist: true, sentry: true, lights: true }, miningMode: "closest" },
  { id: "docking", label: "Docking", hint: "guns safe, assist on, engines on for the tractor hand-off, floods on", want: { shields: false, engines: true, turretsArmed: false, assist: true, lights: true } },
  { id: "dark", label: "Dark", hint: "everything off but life support — a small signature, a slow hull", want: { shields: false, engines: false, turretsArmed: false, lights: false, sentry: false } },
];
const S = () => useGameStore.getState();
function sysState(k) {
  const s = S();
  if (k === "sentry") return Boolean(s.sentry);
  if (k === "lights") return Boolean(s.lights);
  if (k === "salvage") return Boolean(s.salvage);
  if (k === "matchLock") return Boolean(s.matchLock);
  return Boolean(s.systems?.[k === "turretsArmed" ? "turrets" : k]);
}
const swClick = (k) => DOC?.querySelector(`.sw[data-sys="${k}"]`)?.click();
export function postureMatches(p) { return Object.entries(p.want).every(([k, v]) => sysState(k) === v); }
export function applyPosture(p) {
  let flips = 0;
  for (const [k, v] of Object.entries(p.want)) if (sysState(k) !== v) { swClick(k); flips++; }
  if (p.turretMode) setTurretMode(p.turretMode);
  if (p.miningMode) setMiningMode(p.miningMode);
  sim.notice = `${p.label} posture — ${flips ? `${flips} switch${flips > 1 ? "es" : ""} thrown` : "already set"}.`;
  sim.noticeAt = sim.wall;
}

/* ---- STATUS ---------------------------------------------------------------- */

/** Passive telemetry: the last two hours of the ship as readouts you glance at. */
function telemetryBlock(root, push) {
  const sec = section("Telemetry");
  const strip = el("div", "tele-strip");
  const rings = el("div", "tele-rings");
  const rHull = ring(el("div"), 1, { size: 46, warnLow: true });
  const rChg = ring(el("div"), 1, { size: 46, tone: "cyan", warnLow: true });
  const rHeat = ring(el("div"), 0, { size: 46, tone: "amber" });
  const rHold = ring(el("div"), 0, { size: 46, tone: "ok" });
  for (const [r, lab] of [[rHull, "HULL"], [rChg, "CHARGE"], [rHeat, "HEAT"], [rHold, "HOLD"]]) {
    const w = el("div", "tele-ring");
    w.append(r.el, el("small", null, lab));
    rings.append(w);
  }
  const sCred = sparkline(el("div"), [], { label: "CREDITS", tone: "amber", w: 140, h: 30 });
  const sHull = sparkline(el("div"), [], { label: "HULL", tone: "cyan", w: 140, h: 30, min: 0, max: 100 });
  const sSpd = sparkline(el("div"), [], { label: "SPEED", tone: "ok", w: 140, h: 30 });
  const sHeat = sparkline(el("div"), [], { label: "HEAT", tone: "hot", w: 140, h: 30, min: 0, max: 100 });
  strip.append(sCred.el, sHull.el, sSpd.el, sHeat.el);
  sec.append(rings, strip);
  root.append(sec);
  let sampledAt = "";
  push(() => {
    const T = sim.telemetry;
    const ship = sim.ship;
    rHull.update(ship.hull / 100);
    rChg.update(ship.charge / batteryCap(ship));
    rHeat.update(sim.heat);
    const held = T.cargo.length ? T.cargo[T.cargo.length - 1] / ship.cargoCap : NaN;
    rHold.update(Number.isFinite(held) ? held : 0);
    /* the sparklines only change when a sample lands (every 3 s) — no reason to rebuild them at 14 Hz */
    const stamp = `${T.at}:${T.cargo.length}`;
    if (stamp === sampledAt) return;
    sampledAt = stamp;
    sCred.update(T.credits);
    sHull.update(T.hull);
    sSpd.update(T.speed);
    sHeat.update(T.heat);
  });
}

function mountStatus(root, push) {
  const ship = sim.ship;
  telemetryBlock(root, push);

  const pos = section("Position");
  const wellRow = row(pos, "Gravity well");
  const altRow = row(pos, "Altitude");
  const escRow = row(pos, "Escape velocity", { hint: "Speed you must beat to leave this well unpowered." });
  root.append(pos);

  const cond = section("Condition");
  const hull = row(cond, "Hull integrity", { bar: true });
  const shld = row(cond, "Shield charge", { bar: true });
  const o2 = row(cond, "Cabin O2", { bar: true });
  const strain = row(cond, "Reactor strain", { bar: true, hint: "Above 25% the core starts cooking the hull." });
  root.append(cond);

  const mot = section("Motion");
  const rel = row(mot, "Speed, local frame", { hint: "Relative to the world you are at." });
  const abs = row(mot, "Speed, heliocentric");
  const gl = row(mot, "Acceleration load");
  const thr = row(mot, "Throttle");
  root.append(mot);

  const mnt = section("Maintenance");
  const wear = row(mnt, "Backlog", { bar: true, hint: "Clamps, coolant, seals — a hand on Engineering works it down." });
  const engRow = row(mnt, "On Engineering");
  const botRow = row(mnt, "Robot crew");
  root.append(mnt);

  const al = section("Alerts");
  const alBody = el("div");
  al.append(alBody);
  root.append(al);

  const lg = section("Flight log");
  const list = el("ul", "tlog");
  lg.append(list);
  root.append(lg);

  let lastLog = -1;
  push(() => {
    const dom = sim.dominant;
    wellRow.value.textContent = dom ? dom.name : "deep space";
    altRow.value.textContent = dom ? fmtDist(sim.altitude) : "—";
    escRow.value.textContent = dom ? `${Math.round(dom.stats.escape)} u/s` : "—";

    hull.value.textContent = `${Math.round(ship.hull)} / 100`;
    setBar(hull.bar, ship.hull / 100, ship.hull < 35 ? "hot" : null);
    shld.value.textContent = ship.powered.shields ? `${Math.round(ship.shieldCharge)} / 100` : "OFFLINE";
    setBar(shld.bar, ship.shieldCharge / 100, ship.powered.shields ? null : "hot");
    o2.value.textContent = ship.pressurized ? `${Math.round(ship.o2)}%` : "VENTED";
    setBar(o2.bar, ship.o2 / 100, ship.o2 < 30 ? "hot" : "ok");
    strain.value.textContent = pct(ship.strain);
    setBar(strain.bar, ship.strain, ship.strain > 0.25 ? "hot" : "warn");

    const fv = sim.frameVel;
    const rv = Math.hypot(ship.vel.x - fv.x, ship.vel.y - fv.y, ship.vel.z - fv.z);
    rel.value.textContent = `${rv.toFixed(1)} u/s`;
    abs.value.textContent = `${Math.hypot(ship.vel.x, ship.vel.y, ship.vel.z).toFixed(0)} u/s`;
    gl.value.textContent = `${ship.gLoad.toFixed(2)} g`;
    thr.value.textContent = `${Math.round(ship.throttle * 100)}%${ship.throttle > 1 ? " OVERDRIVE" : ""}`;
    thr.value.className = `v ${ship.throttle > 1 ? "hot" : ""}`;

    const w = Math.max(0, Math.min(1, duties.wear ?? 0));
    wear.value.textContent = pct(w);
    setBar(wear.bar, w, w > 0.6 ? "hot" : w > 0.3 ? "warn" : "ok");
    const eng = (dutyReport() ?? []).filter((d) => d.station === "eng" || /eng/i.test(String(d.station ?? "")));
    engRow.value.textContent = eng.length ? eng.map((d) => d.name).join(", ") : "nobody";
    engRow.value.className = `v ${eng.length ? "good" : w > 0.3 ? "hot" : ""}`;
    const rs = robotsSummary();
    botRow.value.textContent = rs?.n ? `${rs.n} · ${rs.kw.toFixed(1)} kW${rs.worst ? ` · ${rs.worst.name} ${Math.round(rs.worst.condition)}%` : ""}` : "none";
    botRow.value.className = `v ${rs?.worst && rs.worst.condition < 30 ? "hot" : ""}`;

    const want = ship.debuffs.map((x) => x.text).join("|");
    if (alBody.dataset.k !== want) {
      alBody.dataset.k = want;
      alBody.innerHTML = "";
      if (!ship.debuffs.length) alBody.append(el("div", "tempty", "All systems nominal."));
      else for (const dbf of ship.debuffs) row(alBody, dbf.text, { value: "ACTIVE" }).value.className = "v hot";
    }

    if (sim.log.length !== lastLog) {
      lastLog = sim.log.length;
      list.innerHTML = "";
      for (const e of sim.log.slice(-40).reverse()) {
        const li = el("li", e.kind);
        li.append(el("i", null, clockOf(e.t)), el("span", null, e.text));
        list.append(li);
      }
      if (!sim.log.length) list.append(el("li", null, "—"));
    }
  });
}

/* ---- POWER ----------------------------------------------------------------- */

function mountPower(root, push) {
  const ship = sim.ship;

  const core = section("Reactor");
  const out = row(core, "Output");
  const bat = row(core, "Battery", { bar: true });
  const net = row(core, "Net");
  const life = row(core, "Time to empty / full");
  root.append(core);

  const trimSec = section("Core trim");
  const trimSpec = TUNE_SPEC.find((t) => t.key === "reactorTrim");
  const trimRefresh = slider(trimSec, trimSpec, () => ship.tune.reactorTrim, (v) => setTune("reactorTrim", v), (v) => `${Math.round((ship.reactor / Math.max(ship.tune.reactorTrim, 0.01)) * v)} kW (${v.toFixed(2)}×)`);
  root.append(trimSec);

  const led = section("Load ledger");
  /* every row reads ship.draws — what stepPower actually billed this tick —
   * so the ledger adds up to the load instead of re-deriving it with its own sums */
  const dr = (k) => () => ship.draws?.[k] ?? 0;
  const items = [
    ["Life support", dr("life"), () => true],
    ["Avionics", dr("avionics"), () => true],
    ["Mains + thrust", dr("engines"), () => ship.powered.engines],
    ["Shields", dr("shields"), () => ship.powered.shields],
    ["Turrets", dr("turrets"), () => ship.powered.turrets],
    ["Mining laser", dr("cutter"), () => ship.powered.mining && ship.miningMode !== "off"],
    ["Ice works", dr("bench"), () => (ship.draws?.bench ?? 0) > 0],
    ["Local gravity", dr("gravity"), () => ship.powered.gravity],
    ["Ops board", dr("ops"), () => ship.powered.ops && (ship.draws?.ops ?? 0) > 0],
    ["Robot crew", dr("robots"), () => (ship.draws?.robots ?? 0) > 0],
    ["Warp spool", dr("warp"), () => (ship.draws?.warp ?? 0) > 0],
  ];
  const ledRows = items.map(([label, draw, on]) => ({ r: row(led, label, { bar: true }), draw, on }));
  const apRow = row(led, "Mission autopilot", { hint: "the throttle the reactor can carry indefinitely — a leg flies at or under it" });
  root.append(led);

  const shed = section("Load shed priority");
  note(shed, "When the battery bottoms out the bus cuts from the top down until the load fits. Reorder it to suit the run.");
  const shedBody = el("div");
  shed.append(shedBody);
  root.append(shed);

  let shedKey = "";
  const drawShed = () => {
    const key = ship.shed.join(",");
    if (key === shedKey) return;
    shedKey = key;
    shedBody.innerHTML = "";
    ship.shed.forEach((k, i) => {
      const r = row(shedBody, `${i + 1}. ${SHED_LABEL[k] ?? k}`);
      r.value.replaceChildren(group(button("▲", () => moveShed(k, -1), "tiny"), button("▼", () => moveShed(k, 1), "tiny")));
    });
  };
  drawShed();

  push(() => {
    trimRefresh();
    out.value.textContent = `${Math.round(ship.reactor)} kW`;
    bat.value.textContent = `${Math.round(ship.charge)} / ${batteryCap(ship)}`;
    setBar(bat.bar, ship.charge / batteryCap(ship), ship.charge < 300 ? "hot" : null);
    const n = ship.reactor - ship.load;
    net.value.textContent = `${n >= 0 ? "+" : ""}${Math.round(n)} kW`;
    net.value.className = `v ${n < 0 ? "hot" : "good"}`;
    life.value.textContent = n < -0.5 ? `${fmtTime(ship.charge / -n)} to empty` : n > 0.5 ? `${fmtTime((batteryCap(ship) - ship.charge) / n)} to full` : "steady";
    for (const item of ledRows) {
      const live = item.on();
      const d = live ? item.draw() : 0;
      item.r.value.textContent = live ? `${Math.round(d)} kW` : "—";
      item.r.value.className = `v ${live ? "" : "warn"}`;
      setBar(item.r.bar, d / Math.max(ship.reactor, 1), live ? null : "warn");
    }
    const P = autopilot.power ?? {};
    const sus = sustainableThrottle(ship); // live: autopilot.power only refreshes while a leg flies
    apRow.value.textContent = autopilot.on ? `${Math.round((P.throttle ?? 0) * 100)}% now · ${Math.round(sus * 100)}% sustainable` : `${Math.round(sus * 100)}% sustainable`;
    drawShed();
  });
}

/* ---- SYSTEMS --------------------------------------------------------------- */

function mountSystems(root, push) {
  const ship = sim.ship;

  const post = section("Posture");
  note(post, "The board set for a job in one tap. A posture names the switches it cares about; the rest are left alone.");
  const postGrid = el("div", "tmodes");
  const postBtns = POSTURES.map((p) => {
    const b = el("button", "tmode");
    b.type = "button";
    b.dataset.focus = `posture-${p.id}`;
    b.append(el("b", null, p.label), el("small", null, p.hint));
    b.addEventListener("click", () => applyPosture(p));
    postGrid.append(b);
    return { p, b };
  });
  post.append(postGrid);
  root.append(post);

  const sw = section("Master switches");
  const SWITCHES = [
    ["shields", "Shields", "28 kW up. Soaks damage before the hull does.", () => toggleSystem("shields"), () => Boolean(ship.shields)],
    ["turretsArmed", "Turrets", "15 kW armed, more while firing.", () => toggleSystem("turretsArmed"), () => Boolean(ship.turretsArmed)],
    ["engines", "Main engines", "Cold means no thrust and almost no attitude authority.", () => toggleSystem("engines"), () => Boolean(ship.engines)],
    ["pressurized", "Cabin pressure", "Vented saves power and hardens the hull, costs RCS response.", () => toggleSystem("pressurized"), () => Boolean(ship.pressurized)],
    ["localGravity", "Local gravity", "12 kW. Off buys attitude authority, costs turret tracking.", () => toggleSystem("localGravity"), () => Boolean(ship.localGravity)],
    ["assist", "Flight assist", "Trims drift you did not ask for. Off is pure momentum.", () => toggleSystem("assist"), () => Boolean(ship.assist)],
    ["lights", "Floodlights", "Read the rock up close. A bright signature.", () => swClick("lights"), () => sysState("lights")],
    ["sentry", "Threat sentry", "Watches for hostiles and calls them on the HUD.", () => swClick("sentry"), () => sysState("sentry")],
    ["salvage", "Salvage tractor", "Pulls wreck and cargo in from short range.", () => swClick("salvage"), () => sysState("salvage")],
    ["matchLock", "Match lock", "Holds your velocity to the locked target's.", () => swClick("matchLock"), () => sysState("matchLock")],
  ];
  const swRows = SWITCHES.map(([key, label, hint, flip, read]) => {
    const r = row(sw, label, { hint });
    const b = button("", flip);
    b.dataset.focus = `sys-${key}`;
    r.value.replaceChildren(b);
    return { b, read };
  });
  root.append(sw);

  const tur = section("Combat turrets — engagement rule");
  const turGrid = el("div", "tmodes");
  const turBtns = TURRET_MODES.map((m) => {
    const b = el("button", "tmode");
    b.type = "button";
    b.dataset.focus = `turret-${m.id}`;
    b.append(el("b", null, m.label), el("small", null, m.hint));
    b.addEventListener("click", () => setTurretMode(m.id));
    turGrid.append(b);
    return { id: m.id, b };
  });
  tur.append(turGrid);
  const turTarget = row(tur, "Current target");
  root.append(tur);

  const mine = section("Industrial hardpoint — mining laser");
  const mineGrid = el("div", "tmodes");
  const mineBtns = MINING_MODES.map((m) => {
    const b = el("button", "tmode");
    b.type = "button";
    b.dataset.focus = `miner-${m.id}`;
    b.append(el("b", null, m.label), el("small", null, m.hint));
    b.addEventListener("click", () => setMiningMode(m.id));
    mineGrid.append(b);
    return { id: m.id, b };
  });
  mine.append(mineGrid);
  const mineState = row(mine, "Beam");
  root.append(mine);

  const fl = section("Flight");
  const lvl = row(fl, "Level trim", { hint: "Square the nose to the ecliptic." });
  lvl.value.replaceChildren(button("TRIM", () => DOC?.getElementById("op-level")?.click(), "tiny"));
  const cam = row(fl, "Camera");
  const camBtn = button("SEAT", () => DOC?.getElementById("btn-cam")?.click(), "tiny");
  cam.value.replaceChildren(camBtn);
  const tm = row(fl, "Time scale");
  const tmBtn = button("1×", () => DOC?.getElementById("op-time")?.click(), "tiny");
  tm.value.replaceChildren(tmBtn);
  const pulse = row(fl, "Sensor pulse", { hint: "One sweep of the sky for contacts." });
  const pulseBtn = button("PULSE", () => DOC?.getElementById("op-pulse")?.click(), "tiny");
  pulse.value.replaceChildren(pulseBtn);
  const lanes = row(fl, "Lane rigs on the canopy", { hint: "Off by default — port control flies the lanes for you." });
  const lanesBtn = button("OFF", () => { sim.ui.lanesDrawn = !sim.ui.lanesDrawn; sim.notice = sim.ui.lanesDrawn ? "Lane rigs drawn. Lane discipline is back on — wrong-way runs cost standing." : "Lane rigs hidden. DOCK hands the helm to port control; HAIL asks for a berth."; sim.noticeAt = sim.wall; });
  lanes.value.replaceChildren(lanesBtn);
  root.append(fl);

  push(() => {
    for (const { p, b } of postBtns) b.classList.toggle("on", postureMatches(p));
    for (const s of swRows) {
      const on = s.read();
      s.b.textContent = on ? "ON" : "OFF";
      s.b.classList.toggle("on", on);
    }
    for (const t of turBtns) {
      t.b.classList.toggle("on", ship.turretMode === t.id);
      t.b.classList.toggle("hot", ["ffa", "allies", "neutral"].includes(t.id));
    }
    const tgt = turretAim.combat;
    turTarget.value.textContent = tgt ? `${turretAim.hasTarget ? "ENGAGING " : "tracking "}${tgt.name}` : "none in range";
    turTarget.value.className = `v ${turretAim.hasTarget ? "hot" : ""}`;
    for (const m of mineBtns) {
      m.b.classList.toggle("on", ship.miningMode === m.id);
      m.b.classList.toggle("hot", m.id === "overdrive");
    }
    mineState.value.textContent = mining.active ? `cutting — ${pct(mining.progress)}` : "idle";
    camBtn.textContent = sim.cameraMode ? "EXTERNAL" : "SEAT";
    tmBtn.textContent = `${S().timeScale}×`;
    pulseBtn.textContent = DOC?.getElementById("op-pulse-st")?.textContent || "PULSE";
    lanesBtn.textContent = sim.ui?.lanesDrawn ? "ON" : "OFF";
    lanesBtn.classList.toggle("on", Boolean(sim.ui?.lanesDrawn));
  });
}

/* ---- TRIM ------------------------------------------------------------------ */

function mountTrim(root, push, ctx) {
  const ship = sim.ship;
  const trim = section("Handling and hardpoint trim");
  const refreshers = TUNE_SPEC.filter((t) => t.key !== "reactorTrim").map((spec) =>
    slider(trim, spec, () => ship.tune[spec.key], (v) => setTune(spec.key, v), (v) => `${spec.step >= 1 ? Math.round(v) : v.toFixed(2)}${spec.unit ?? ""}`));
  const resetRow = row(trim, "Factory trim");
  resetRow.value.replaceChildren(button("RESET ALL", () => resetTune(), "danger"));
  root.append(trim);

  const refit = section("Refit");
  const refitBody = el("div");
  refit.append(refitBody);
  const yardRow = row(refit, "Yard");
  const yardBtn = button("MARKET › REFIT", () => ctx.openConsole("market", "refit"), "tiny");
  yardRow.value.replaceChildren(yardBtn);
  root.append(refit);

  let key = "";
  push(() => {
    for (const f of refreshers) f();
    const lines = upgradeLines() ?? [];
    const k = lines.map((l) => `${l.name}:${l.effect}`).join("|");
    if (k !== key) {
      key = k;
      refitBody.innerHTML = "";
      if (!lines.length) refitBody.append(el("div", "tempty", "Factory fit. Nothing bolted on."));
      for (const l of lines) row(refitBody, l.name, { value: l.effect ?? "" });
    }
    const s = stationStatus();
    const yard = s?.docked && ["industrial", "military"].includes(s.info?.sector);
    const yk = yard ? `${s.station.name} fits upgrades` : "dock at an industrial or military yard";
    if (yardRow.row.dataset.k !== yk) {
      yardRow.row.dataset.k = yk;
      yardRow.key.querySelector("small")?.remove();
      yardRow.key.append(el("small", null, yk));
    }
  });
}

/* ---- the panel ------------------------------------------------------------- */

const SUBS = { status: mountStatus, power: mountPower, systems: mountSystems, trim: mountTrim };

export default {
  id: "ship",
  title: "SHIP",
  order: 10,
  subtabs: [{ id: "status", label: "STATUS" }, { id: "power", label: "POWER" }, { id: "systems", label: "SYSTEMS" }, { id: "trim", label: "TRIM" }],
  mount(root, ctx) { (SUBS[ctx.sub] ?? mountStatus)(root, ctx.push, ctx); },
  paint() {},
  unmount() {},
  search() {
    const out = [];
    for (const p of POSTURES) out.push({ label: `Posture: ${p.label}`, hint: p.hint, sub: "systems", focus: `posture-${p.id}`, keywords: "posture board", run: () => applyPosture(p), status: () => (postureMatches(p) ? "● SET" : "") });
    for (const [k, label] of [["shields", "Shields"], ["engines", "Main engines"], ["turretsArmed", "Turrets armed"], ["assist", "Flight assist"], ["pressurized", "Cabin pressure"], ["localGravity", "Local gravity"], ["lights", "Floodlights"], ["sentry", "Threat sentry"], ["salvage", "Salvage tractor"], ["matchLock", "Match lock"]]) {
      out.push({ label, hint: "master switch", sub: "systems", focus: `sys-${k}`, keywords: "switch system", status: () => (sysState(k) ? "ON" : "OFF") });
    }
    for (const m of TURRET_MODES) out.push({ label: `Turret rule: ${m.label}`, hint: m.hint ?? "", sub: "systems", focus: `turret-${m.id}`, keywords: "turret engagement rule guns", run: () => setTurretMode(m.id), status: () => (sim.ship?.turretMode === m.id ? "● SET" : "") });
    for (const m of MINING_MODES) out.push({ label: `Mining cutter: ${m.label}`, hint: m.hint ?? "", sub: "systems", focus: `miner-${m.id}`, keywords: "miner laser cutter", run: () => setMiningMode(m.id), status: () => (sim.ship?.miningMode === m.id ? "● SET" : "") });
    out.push({ label: "Load shed priority", hint: "what the bus cuts first", sub: "power", keywords: "power battery reactor" });
    out.push({ label: "Reactor trim", hint: "core output slider", sub: "power", keywords: "power" });
    out.push({ label: "Flight log", hint: "the last forty lines", sub: "status", keywords: "log events" });
    out.push({ label: "Trim sliders", hint: "handling and hardpoint trim", sub: "trim", keywords: "tune handling" });
    return out;
  },
};
