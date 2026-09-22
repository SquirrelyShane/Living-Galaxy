/* LIVING GALAXY experimental — the adaptive tutorial.
 *
 * Not a script; a set of checks against the live sky. Each step looks at what
 * is actually around the ship — the nearest unsurveyed world, the nearest
 * rock or debris chunk, where the belt is from here, the nearest port, who is
 * aboard — and writes its instruction from that. So it works in Sol and in a
 * rolled sky alike: every sky has a main belt and an outer ice belt, so
 * whatever the trade, the material is out there and the step can point at it.
 *
 * Steps advance on what you DO (speed, a scan, a lock, cargo climbing, a
 * dock, a hire), not on what you tap. NEXT only exists where there is
 * nothing to measure. SKIP ends it; it is remembered per device.
 */

import { acquireLock, addBodyWaypoint, addWaypointAt, logEvent, selectBody, sim } from "./sim.js";
import { BODIES, bodyPosition, currentSystem, scanRadius } from "./bodies.js";
import { nearestStation } from "./stations.js";
import { nearbyRocks } from "./field.js";
import { chunks } from "./debris.js";
import { MINE_RANGE } from "./turrets.js";
import { crew } from "./crew.js";
import { pilot } from "./pilot.js";
import { cargoTotal, speedOf } from "./ship.js";
import { interior } from "./interior/interior.js";
import { CORE_STEPS, resetCoreTrack } from "./tutorial-core.js";

const LS_KEY = "lgaa.tutorial.v1";
const CORE_KEY = "lgaa.tutorial.core.v1";

export const tutorial = {
  active: false,
  step: 0,
  done: false,
  min: false,
  /* which set of lessons is running: the intro, or a track started on demand */
  track: "intro",
  /* where the intro was when a track cut in front of it */
  resume: null,
  /* baselines captured when a step starts */
  base: {},
  ctx: null,
  ctxAge: 9,
  root: null,
};

function fmt(d) {
  if (!isFinite(d)) return "—";
  if (d < 1000) return `${Math.round(d)} u`;
  if (d < 100000) return `${(d / 100).toFixed(1)} km`;
  return `${Math.round(d / 100).toLocaleString()} km`;
}

const _p = { x: 0, y: 0, z: 0 };

/** What the tutorial can see right now. Rebuilt twice a second. */
function buildCtx() {
  const ship = sim.ship;
  const pos = ship.pos;
  const out = {
    speed: speedOf(ship, sim.frameVel),
    cargo: cargoTotal(ship),
    credits: ship.credits,
    docked: Boolean(ship.dockedAt),
    crew: crew.aboard.length,
    scanned: sim.scanned.size,
    locked: Boolean(sim.lock.locked),
    interiorOpen: Boolean(interior.open),
    home: null,
    unscanned: null,
    rock: null,
    belt: null,
    port: null,
    complex: pilot.complexId,
  };
  /* nearest world and nearest unsurveyed world */
  let bh = Infinity, bu = Infinity;
  for (const b of BODIES) {
    if (b.kind === "star") continue;
    bodyPosition(b.id, sim.time, _p);
    const d = Math.hypot(_p.x - pos.x, _p.y - pos.y, _p.z - pos.z);
    if (d < bh) { bh = d; out.home = { id: b.id, name: b.name, dist: d }; }
    if (!sim.scanned.has(b.id) && !b.shattered && d < bu) {
      bu = d;
      out.unscanned = { id: b.id, name: b.name, dist: d, scanAt: scanRadius(b) * (ship.mods?.scan ?? 1) };
    }
  }
  /* nearest cuttable thing: belt rock or impact debris */
  let br = Infinity;
  for (const r of nearbyRocks(pos, sim.time, 2)) {
    const d = Math.hypot(r.x - pos.x, r.y - pos.y, r.z - pos.z) - r.r;
    if (d < br) { br = d; out.rock = { kind: "asteroid", id: r.key, name: `${r.oreName} rock`, dist: d, x: r.x, y: r.y, z: r.z }; }
  }
  for (const c of chunks) {
    const d = Math.hypot(c.x - pos.x, c.y - pos.y, c.z - pos.z) - c.r;
    if (d < br && d < 40000) { br = d; out.rock = { kind: "debris", id: c.id, name: "impact debris", dist: d, x: c.x, y: c.y, z: c.z }; }
  }
  /* where the belt is from here: the nearest point of the main ring */
  const belt = currentSystem.belt ?? currentSystem.outerBelt;
  if (belt) {
    const rad = Math.hypot(pos.x, pos.z) || 1;
    const target = Math.min(belt.outer - 1500, Math.max(belt.inner + 1500, rad));
    const a = Math.atan2(pos.z, pos.x);
    const bx = Math.cos(a) * target, bz = Math.sin(a) * target;
    out.belt = { dist: Math.hypot(bx - pos.x, pos.y, bz - pos.z), x: bx, y: 0, z: bz, name: belt === currentSystem.outerBelt ? "the ice belt" : "the belt" };
  }
  const near = nearestStation(pos, Infinity);
  if (near) out.port = { id: near.station.id, name: near.station.name, dist: near.dist, range: near.station.radius * 4 + 220 };
  return out;
}

/* ---- the steps ------------------------------------------------------------ */

const STEPS = [
  {
    id: "helm",
    title: "HELM",
    text: (c) => `Push the throttle slider up and swing the nose by dragging the sky. ${c.home ? `${c.home.name} is ${fmt(c.home.dist)} off and already pulling.` : "Feel the drift."} BRAKE kills your vector.`,
    done: (c) => c.speed > 12 && (sim.ship.throttle ?? 0) > 0.05,
  },
  {
    id: "survey",
    title: "SURVEY",
    text: (c) => c.unscanned
      ? `Scan ${c.unscanned.name}: get inside ${fmt(c.unscanned.scanAt)} (now ${fmt(c.unscanned.dist)}) and tap SCAN. Surveys log what a world can be mined for.`
      : "Every world here is already surveyed.",
    action: (c) => (c.unscanned ? { label: "MARK", run: () => { addBodyWaypoint(c.unscanned.id); selectBody(c.unscanned.id); } } : null),
    done: (c, base) => !c.unscanned || c.scanned > base.scanned,
  },
  {
    id: "lock",
    title: "P-LOCK",
    text: (c) => {
      const t = c.rock && c.rock.dist < 25000 ? c.rock : c.port ?? c.home;
      return t
        ? `Put the reticle on ${t.name} (${fmt(t.dist)}) and tap P-LOCK. Rocks, debris, ports and worlds all take a signature lock — MATCH then holds station on it.`
        : "Put the reticle on anything and tap P-LOCK.";
    },
    done: (c) => c.locked,
  },
  {
    id: "earn",
    title: (c) => (c.complex === "mining" ? "CUT" : c.complex === "salvage" ? "HAUL" : "TRADE"),
    text: (c) => {
      if (c.complex === "mining") {
        if (c.rock && c.rock.dist < 25000) return `MINER is already on CLOSEST. Close to under ${fmt(MINE_RANGE)} of ${c.rock.name} (${fmt(c.rock.dist)}) and hold there — the cutter finds the face, chips fly, the hold fills.`;
        return c.belt
          ? `No rock in reach. ${c.belt.name[0].toUpperCase() + c.belt.name.slice(1)} is ${fmt(c.belt.dist)} out — MARK it and fly there (or warp toward a world past it), then close on a rock.`
          : "Find rock: watch for impact debris after a strike.";
      }
      if (c.complex === "salvage") return `SALVAGE is live. Fly through debris (${c.rock ? `${c.rock.name} ${fmt(c.rock.dist)}` : "impacts leave fields"}) inside 2200 u and the tractor brings it aboard.`;
      return `You fly the Fledgling trainer; your complex will sign over a ${c.complex} hull at the issue rate at any yard. Every port pays for what its sector is short of — the map ≡ directory lists them by trade.`;
    },
    action: (c) => (c.complex === "mining" && !(c.rock && c.rock.dist < 25000) && c.belt
      ? { label: "MARK BELT", run: () => addWaypointAt("Belt edge", c.belt.x, c.belt.y, c.belt.z) }
      : null),
    done: (c, base) => (c.complex === "mining" || c.complex === "salvage" ? c.cargo > base.cargo + 1 : true),
    next: (c) => !(c.complex === "mining" || c.complex === "salvage"),
  },
  {
    id: "dock",
    title: "DOCK",
    text: (c) => c.port
      ? `Dock at ${c.port.name} (${fmt(c.port.dist)}): inside ${fmt(c.port.range)}, under 12 u/s relative, tap DOCK. Sell the hold at the TRADE desk — AUTO flies the approach if you want it.`
      : "Find a port on the map and dock.",
    action: (c) => (c.port ? { label: "LOCK PORT", run: () => acquireLock({ kind: "station", id: c.port.id }) } : null),
    done: (c) => c.docked,
  },
  {
    id: "hire",
    title: "CREW",
    text: () => "Dock, open the HIRING HALL on the port deck and sign a hand; CONSOLE › CREW is where you talk to them. A miner brings a hand drill for the ice bench; a medic runs the medbay; any trade helps its station. Two cycles' wage up front, then payroll every cycle.",
    done: (c, base) => c.crew > base.crew,
  },
  {
    id: "deck",
    title: "DECK",
    text: () => "Tap DECK to walk your hull. Crew stand shifts, eat together, and get to know each other — bonds grow by the cycle, and when two people are drawn to each other, any pairing, it becomes something more. Partners hold each other's morale up; it shows on the crew sheet.",
    done: (c) => c.interiorOpen,
    next: () => true,
  },
  {
    id: "loop",
    title: "THE LOOP",
    text: () => "Cut, haul, sell, crew up, rank up. Every sky has a main belt and an outer ice belt, so every ore and gas is out there; ICE melts water, ATMO reworks climates, GNN calls the big strikes. Fly safe.",
    done: () => false,
    next: () => true,
  },
];

/* The lesson sets. `intro` runs itself on a fresh device; `core` is started by
 * the WORK editor when it refuses an edit, and is the only one that can cut in
 * front of another — see startCoreTutorial. */
const TRACKS = { intro: STEPS, core: CORE_STEPS };
const steps = () => TRACKS[tutorial.track] ?? STEPS;

/* ---- driver ------------------------------------------------------------- */

function captureBase(c) {
  tutorial.base = { scanned: c.scanned, cargo: c.cargo, crew: c.crew, credits: c.credits };
}

export function startTutorial(force = false) {
  if (!force) {
    try { if (localStorage.getItem(LS_KEY) === "done") return false; } catch { /* no storage */ }
  }
  tutorial.track = "intro";
  tutorial.resume = null;
  tutorial.active = true;
  tutorial.done = false;
  tutorial.step = 0;
  tutorial.min = false;
  tutorial.ctx = buildCtx();
  captureBase(tutorial.ctx);
  logEvent("Tutorial running — SKIP on the card ends it", "nav");
  paint(true);
  return true;
}

/**
 * The MISSION CORE track — what the WORK editor calls when it has just told a
 * pilot they need a core. Shown once on its own; the editor's SHOW ME button
 * passes force and can bring it back any time.
 *
 * It saves whatever the intro was doing and hands the card back afterwards, so
 * a pilot who hits the mission wall three steps into the intro does not lose
 * those three steps.
 */
export function startCoreTutorial(force = false) {
  if (!force) {
    try { if (localStorage.getItem(CORE_KEY) === "done") return false; } catch { /* no storage */ }
  }
  /* Marked seen on the way IN, not on the way out. Otherwise the editor pops
   * the card again on every refusal until the core is bought, which is exactly
   * the pilot least in the mood for it. SHOW ME HOW passes force. */
  try { localStorage.setItem(CORE_KEY, "done"); } catch { /* no storage */ }
  if (tutorial.active && tutorial.track !== "core") tutorial.resume = { track: tutorial.track, step: tutorial.step };
  resetCoreTrack();
  tutorial.track = "core";
  tutorial.active = true;
  tutorial.done = false;
  tutorial.step = 0;
  tutorial.min = false;
  tutorial.ctx = buildCtx();
  captureBase(tutorial.ctx);
  logEvent("Mission core: walking you through it — SKIP ends it", "nav");
  paint(true);
  return true;
}

export function skipTutorial() {
  finish("skipped");
}

function finish(how) {
  const wasCore = tutorial.track === "core";
  try { localStorage.setItem(wasCore ? CORE_KEY : LS_KEY, "done"); } catch { /* fine */ }
  logEvent(wasCore
    ? (how === "skipped" ? "Mission core walkthrough skipped" : "Mission core fitted — loops and multi-step missions are open")
    : (how === "skipped" ? "Tutorial skipped" : "Tutorial complete"), "nav");
  clearHilite();
  /* a track that cut in front of the intro gives the card back */
  if (wasCore && tutorial.resume && how !== "skipped") {
    tutorial.track = tutorial.resume.track;
    tutorial.step = tutorial.resume.step;
    tutorial.resume = null;
    tutorial.ctx = buildCtx();
    captureBase(tutorial.ctx);
    paint(true);
    return;
  }
  tutorial.resume = null;
  tutorial.track = "intro";
  tutorial.active = false;
  tutorial.done = true;
  if (tutorial.root) tutorial.root.hidden = true;
}

function advance() {
  tutorial.step++;
  if (tutorial.step >= steps().length) { finish("done"); return; }
  captureBase(tutorial.ctx);
  logEvent(`Tutorial: ${label(steps()[tutorial.step].title, tutorial.ctx)}`, "nav");
  paint(true);
}

function label(t, c) {
  return typeof t === "function" ? t(c) : t;
}

/** Called from the render loop with real seconds. */
export function tickTutorial(dt) {
  if (!tutorial.active || sim.phase !== "play") return;
  tutorial.ctxAge += dt;
  if (tutorial.ctxAge < 0.5) return;
  tutorial.ctxAge = 0;
  const c = (tutorial.ctx = buildCtx());
  const step = steps()[tutorial.step];
  if (!step) { finish("done"); return; }
  if (step.done(c, tutorial.base)) { advance(); return; }
  paint(false);
}

/* ---- card --------------------------------------------------------------- */

let lastText = "";

function ensureRoot() {
  if (tutorial.root) return tutorial.root;
  if (typeof document === "undefined") return null;
  const hud = document.getElementById("hud");
  if (!hud) return null;
  const root = document.createElement("div");
  root.className = "tutor panel";
  root.id = "tutor";
  root.innerHTML = `
    <button type="button" class="tutor-head" id="tutor-head"><b id="tutor-title">TUTORIAL</b><span id="tutor-n">1/${STEPS.length}</span></button>
    <p id="tutor-text"></p>
    <div class="tutor-row">
      <button type="button" class="btn" id="tutor-act" hidden></button>
      <button type="button" class="btn" id="tutor-alt" hidden></button>
      <button type="button" class="btn" id="tutor-next" hidden>NEXT</button>
      <button type="button" class="btn tutor-skip" id="tutor-skip">SKIP</button>
    </div>`;
  hud.append(root);
  root.querySelector("#tutor-head").addEventListener("click", () => { tutorial.min = !tutorial.min; root.classList.toggle("min", tutorial.min); });
  root.querySelector("#tutor-skip").addEventListener("click", skipTutorial);
  root.querySelector("#tutor-next").addEventListener("click", () => advance());
  root.querySelector("#tutor-act").addEventListener("click", () => {
    steps()[tutorial.step]?.action?.(tutorial.ctx)?.run();
  });
  root.querySelector("#tutor-alt").addEventListener("click", () => {
    steps()[tutorial.step]?.alt?.(tutorial.ctx)?.run();
  });
  tutorial.root = root;
  return root;
}

/* The control a step is talking about, lit up.
 *
 * "Tap DOCK" is worth very little when DOCK is one of twenty switches on the
 * second dash page. A step names a selector, this pulses it, and exactly one
 * thing is ever lit at a time.
 *
 * It is an ATTRIBUTE and not a class on purpose. The HUD owns the className of
 * the controls worth pointing at — hud.js writes `warpBar.className` outright
 * every frame — so a class here survives about 16 ms on the one button the
 * walkthrough most needs to point at. An attribute nobody else writes survives
 * a repaint, and still reaches CSS. */
const HI = "data-tutor-hi";
let hiliteSel = "";

function clearHilite() {
  if (typeof document === "undefined") return;
  for (const e of document.querySelectorAll(`[${HI}]`)) e.removeAttribute(HI);
  hiliteSel = "";
}

/* Re-applied on every paint rather than latched, for the same reason: a HUD
 * repaint can take the mark off, and a latched selector would claim it was
 * already lit while the step pointed at nothing. */
function setHilite(sel) {
  if (typeof document === "undefined") return;
  if (sel !== hiliteSel) clearHilite();
  hiliteSel = sel || "";
  if (!sel) return;
  const t = document.querySelector(sel);
  if (t && !t.hasAttribute(HI)) t.setAttribute(HI, "1");
}

function paint(force) {
  const root = ensureRoot();
  if (!root) return;
  root.hidden = !tutorial.active;
  if (!tutorial.active) { clearHilite(); return; }
  const c = tutorial.ctx;
  const step = steps()[tutorial.step];
  if (!step) return;
  const text = step.text(c);
  setHilite(step.hilite?.(c) ?? "");
  if (!force && text === lastText) return;
  lastText = text;
  root.classList.toggle("tutor-core", tutorial.track === "core");
  root.querySelector("#tutor-title").textContent = `${tutorial.track === "core" ? "MISSION CORE" : "TUTORIAL"} · ${label(step.title, c)}`;
  root.querySelector("#tutor-n").textContent = `${tutorial.step + 1}/${steps().length}`;
  root.querySelector("#tutor-text").textContent = text;
  const act = step.action?.(c);
  const actB = root.querySelector("#tutor-act");
  actB.hidden = !act;
  if (act) actB.textContent = act.label;
  const alt = step.alt?.(c);
  const altB = root.querySelector("#tutor-alt");
  altB.hidden = !alt;
  if (alt) altB.textContent = alt.label;
  root.querySelector("#tutor-next").hidden = !step.next?.(c);
}

/** Test/console access: step list and a synchronous evaluate. */
export function tutorialSteps() {
  return steps().map((s) => s.id);
}
export function tutorialContext() {
  return buildCtx();
}
export function tutorialEvaluate() {
  const c = (tutorial.ctx = buildCtx());
  const step = steps()[tutorial.step];
  return { track: tutorial.track, step: step?.id, text: step?.text(c), done: step?.done(c, tutorial.base), hilite: step?.hilite?.(c) ?? null };
}

export function wireTutorialTest() {
  if (globalThis.window?.__lg) window.__lg.tutorial = { tutorial, startTutorial, startCoreTutorial, skipTutorial, tickTutorial, tutorialEvaluate, tutorialContext, tutorialSteps };
}
