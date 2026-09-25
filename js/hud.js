import { PUBLIC_ROOM, bodyById } from "./bodies.js";
import { clockAt } from "./stationclock.js";
import { BUILD_LINE } from "./version.js";
import { describeSystem, generateSystem } from "./generate.js";
import { touch } from "./input.js";
import { autoLevel, cycleMiningMode, cycleTimeScale, cycleTurretMode, launchSim, loadSky, requestJump, requestScan, resumePlay, claimPort, sensorPulse, toggleDock, togglePointerLock, returnToMenu, dismissNotice, setThrottle, setMiningMode, sim, toggleSystem } from "./sim.js";
import { mountConsole, toggleConsole } from "./console/console.js";
import { mountStationDeck } from "./stationdeck.js";
import { mountSecBadge } from "./secbadge.js";
import { mountDockBoot } from "./ui/dockboot.js";
import { mountFullscreen } from "./ui/fullscreen.js";
import { wireRecorder, settle as settleTape, record as tapeRecord, recorder } from "./recorder.js";
import { mission, missionHooks } from "./mission/run.js";
import { contacts as turretContacts } from "./turrets.js";
import { stations } from "./stations.js";
import { hullMaxOf } from "./repair.js";
import { ariaHasConn, ariaTakeConn, ariaRelease } from "./aria.js";
import { ariaPilot } from "./aria-pilot.js";
import { mountMap } from "./map.js";
import { mountCreation } from "./creation.js";
import { MINING_MODES, THROTTLE_MAX, THROTTLE_MIN, TURRET_MODES, cargoTotal } from "./ship.js";
import { setAudioMuted, unlockAudio, UI, busLevels, setBusLevel, resetMix, BUSES } from "./audio.js";
import { loadSave, randomCallsign, skyProgress, useGameStore } from "./store.js";
import { loadPilot, restorePilot } from "./pilot.js";
import { mountComms, wireCommsTest } from "./comms/comms.js";
import { connectNet, disconnectNet } from "./net.js";
import { mountInterior } from "./interior/interior.js";
import { captain, wireCaptainTest } from "./npc/captain.js";
import { connectCradle, disconnectCradle } from "./npc/cradle.js";
import { connectGdb, disconnectGdb } from "./gdb.js";
import { wireIcework } from "./icework.js";
import { wireAtmoWorks } from "./atmoworks.js";
import { wireAutopilot, nearestSeam, busOverload, autopilot as ap } from "./autopilot.js";
import { wireCompany } from "./company.js";
import { wireFamily } from "./family.js";
import { wireContracts } from "./contracts.js";
import { wireNpcChat } from "./npc/chat.js";
import { renderHold } from "./holdview.js";
import { wireFleet } from "./fleet.js";
import { startTutorial } from "./tutorial.js";
import { mountWorldSync, resetWorldSync } from "./worldsync.js";
import { mountChatbox } from "./ui/chatbox.js";

const THR_SPAN = THROTTLE_MAX - THROTTLE_MIN;   // 1.8
const NOTICE_LIFE = 7.5;                       // seconds a message card stays up
const THR_ZERO = (THROTTLE_MAX - 0) / THR_SPAN; // 0.778 from the top

function readOrient() {
  const w = window.visualViewport?.width ?? window.innerWidth;
  const h = window.visualViewport?.height ?? window.innerHeight;
  return h >= w ? "portrait" : "landscape";
}

/* THE DOCK MEASURES ITSELF.
 *
 * The right-hand chip column (.hud-tools) is bottom-anchored and grows upward.
 * The RCS pad and the dash sit on top of it, offset by --g-dock. That offset
 * used to be arithmetic over --g-tools, a count of the chips kept by hand in
 * css/glass.css — and it went stale twice: once in 0.3.06 when the fullscreen
 * chip landed, and again in 0.3.29 when HOLD did. Both times the column grew
 * past its own box and painted ARIA over AFT, DN and SCAN, which laid out
 * correctly underneath it and could not be tapped.
 *
 * So measure it. `--g-dock` is set from the column's real height, which is
 * right whatever is in it — a chip added, the mute chip unhiding, a font
 * loading late, a breakpoint changing how tall a chip is. Nothing that reads
 * --g-dock can change .hud-tools' height, so there is no feedback loop.
 *
 * A zero height means the column is display:none or not laid out yet; keep the
 * last good value rather than collapsing the pad onto the chips. */
function measureDock() {
  const doc = globalThis.document;
  const tools = doc?.querySelector(".hud-tools");
  if (!tools) return 0;
  const h = Math.round(tools.getBoundingClientRect().height);
  if (h > 0) doc.documentElement.style.setProperty("--g-dock", `${h}px`);
  return h;
}

/* THE COMMS PUCK HANGS UNDER THE SWITCHES, NOT THROUGH THEM.
 *
 * The same failure one rail over. In portrait the systems strip and the comms
 * call puck are both pinned to the right edge, and the puck's top was a fixed
 * 150 px below the top pad — a number that was under the strip when it was
 * written and is not any more. Measured: the strip now runs to y=208 and the
 * puck starts at y=160, so its pulse ring sits over ASST and its left edge
 * over CUT. Flight assist and the cutter, both untappable, both looking fine.
 *
 * So the rail is measured too: --g-rail-top is the strip's own bottom edge
 * plus a gap. comms.css takes it in portrait, where the two share a column,
 * and keeps its own number in landscape, where the strip is on the other side
 * of the canopy and there is nothing to clear.
 */
const RAIL_GAP = 8;
/* .cx-puck and .cx-answer in css/comms.css. A coarse pointer gets the bigger
 * set, and since that is the phone this game is played on, the bigger set is
 * what the slot search reserves — a slot that only fits the desktop sizes is
 * not a slot. */
const PUCK_H = 64, PUCK_W = 64;
const ANSWER_GAP = 72;          // .cx-answer offset from the rail
const ANSWER_W = 2 * 58 + 8;    // two round buttons and the gap between them

/* What the comms puck has to stay off: CONTROLS, not cards.
 *
 * The first cut of this avoided whole panels — the dash, the gauges card, the
 * route plot — and in landscape that leaves no free 58px square anywhere on a
 * 915x412 screen, because the dash alone owns the full height of the right
 * column. But most of a card is readout. Sitting over a number costs nothing;
 * sitting over the throttle's MAX button costs you the button.
 *
 * So the things to avoid are the things you press. Read live, because which
 * exist and where they sit changes with the breakpoint and the orientation. */
const PUCK_AVOID = "#hud button, #hud .sw, #hud .rcs-btn, #hud input, #hud select, #hud [role=\"button\"]";

function boxesToAvoid(doc) {
  const out = [];
  for (const el of doc.querySelectorAll(PUCK_AVOID)) {
    if (el.closest(".cx")) continue;              // the comms panel is ours to overlap
    if (el.classList.contains("hidden") || el.offsetParent === null) continue;
    const r = el.getBoundingClientRect();
    if (r.width > 2 && r.height > 2) out.push(r);
  }
  return out;
}

const hits = (a, boxes, pad = 4) => boxes.some((b) =>
  a.left < b.right + pad && a.right > b.left - pad && a.top < b.bottom + pad && a.bottom > b.top - pad);

/** How much of `a` lands on top of controls, in square pixels. */
function overlapArea(a, boxes, pad = 4) {
  let total = 0;
  for (const b of boxes) {
    const w = Math.min(a.right, b.right + pad) - Math.max(a.left, b.left - pad);
    const h = Math.min(a.bottom, b.bottom + pad) - Math.max(a.top, b.top - pad);
    if (w > 0 && h > 0) total += w * h;
  }
  return total;
}

/* Only where there is somewhere to put it. On a short screen the dash card
 * rides up until it already overlaps the strip — 360x640 has the dash at y=172
 * and the strip running to y=208, which is a collision of its own and why CUT
 * is under the throttle header there whatever the puck does. Dropping the puck
 * below the strip on a screen like that just moves it onto the throttle.
 *
 * So: publish the measured rail when the puck clears the dash at it, and leave
 * the variable unset otherwise, which falls comms.css back to its own number.
 * That leaves the short-screen case exactly as it was rather than trading one
 * covered control for six. */
/**
 * PUT THE COMMS PUCK SOMEWHERE FREE.
 *
 * 0.3.31 hung it below the systems strip, measured, which fixed the common
 * portrait phone and left two screens where there is no room below the strip
 * at all: at 360x640 the dash rides up to y=172 while the strip runs to 208,
 * and in landscape the strip crosses to the left while the puck stays on the
 * right, over the throttle's preset buttons. In both, the puck was sitting on
 * controls — flight assist, the cutter, the throttle presets.
 *
 * A fixed offset cannot answer this, because what is beside the puck changes
 * with the breakpoint AND the orientation. So the puck is placed by search:
 * a handful of candidate slots, each tested against every control on screen,
 * first one that collides with nothing wins. The candidates run best-first —
 * under the strip on the right rail is still the nicest place for it — and
 * the last is the old fixed position, so a screen where genuinely nothing
 * fits ends up exactly where it used to be rather than somewhere absurd.
 *
 * Published as two variables because a free slot may not be on the right rail
 * at all; css/comms.css takes both.
 */
function measureRail() {
  const doc = globalThis.document;
  const root = doc?.documentElement;
  if (!root) return 0;
  const strip = doc.querySelector(".sys-strip");
  const vw = globalThis.innerWidth || 412;
  const vh = globalThis.innerHeight || 915;
  const padR = 10, padL = 10;
  const sr = strip ? strip.getBoundingClientRect() : null;
  const boxes = boxesToAvoid(doc);

  /* A CANDIDATE IS THE WHOLE COMMS CLUSTER, NOT JUST THE PUCK.
   *
   * 0.3.37 placed the puck and forgot that the ANSWER buttons hang off it —
   * `.cx-answer` sits at `--cx-rail-right + 72px`, i.e. further from the right
   * edge than the puck. So when the search moved the puck to the left edge,
   * it pushed the accept/reject pair clean off the side of the screen and a
   * ringing call could not be answered at all without going fullscreen.
   * Reported, and entirely my doing.
   *
   * The cluster is placed as one thing now, and the answer row takes whichever
   * side of the puck has room: its usual place to the left, or flipped to the
   * right when the puck is near the left edge. Both rects are collision-tested
   * and both must be on screen, so there is no arrangement where the puck is
   * reachable and the buttons are not. */
  const slot = (right, top) => {
    const px0 = vw - right - PUCK_W, px1 = vw - right;
    const puck = { left: px0, right: px1, top, bottom: top + PUCK_H };
    /* preferred: the answer row to the LEFT of the puck */
    let aRight = right + ANSWER_GAP;
    let a0 = vw - aRight - ANSWER_W, a1 = vw - aRight;
    if (a0 < 4) {
      /* no room that side — flip it to the right of the puck */
      aRight = right - ANSWER_GAP - ANSWER_W;
      a0 = vw - aRight - ANSWER_W; a1 = vw - aRight;
      if (a1 > vw - 4) return null;
    }
    const answer = { left: a0, right: a1, top, bottom: top + PUCK_H };
    return { puck, answer, top, bottom: top + PUCK_H, right_: right, answerRight: aRight };
  };
  /* THE PUCK STAYS ON THE RIGHT RAIL.
   *
   * 0.3.37 let the search move it to the left edge when the right was busy,
   * which was over-engineering: a pilot learns where the comms button is, and
   * a button that teleports across the canopy is worse than one that sits
   * slightly close to a switch. Reported as the icon "getting pushed to the
   * left side" — and on a phone that is not fullscreen, where the viewport is
   * short enough to crowd the right rail, that is exactly what it did.
   *
   * So the search now only chooses HOW FAR DOWN the right rail it sits. Under
   * the systems strip first, then a ladder of positions down the rail. If
   * every one of them is occupied the CSS fallback applies, which is where it
   * has always been. */
  const cands = [];
  if (sr && sr.height > 0) {
    cands.push(slot(padR, Math.round(sr.bottom) + RAIL_GAP));          // under the strip
    /* 0.3.49: never above it. "Above the strip" is the gauges card — a
     * readout, so it scored as free, and the puck spent every call parked on
     * top of PWR/HULL/SHLD in the top-right corner. Reported as the call icon
     * having "moved to the top right". Under the strip or further down. */
  }
  /* CANDIDATES FROM THE ACTUAL GAPS, not from fractions of the screen.
   *
   * A ladder at fixed fractions lands wherever it lands — at 360x740 the
   * nearest rung sat eight pixels into the dash, so the scorer picked a
   * different slot that clipped the CGO gauge button instead. Neither was
   * necessary: there was a clear 64px band between the systems strip and the
   * top of the dash, and nothing was looking for it.
   *
   * So: take everything already on this column, sort it, and offer the puck
   * each gap between one obstacle and the next. A gap that is big enough gets
   * the puck centred in it, which is both the tidiest place and the one least
   * likely to clip either neighbour when a font loads late. */
  const colLeft = vw - padR - PUCK_W - 8;
  const column = boxes.filter((b) => b.right > colLeft).sort((a, b) => a.top - b.top);
  let edge = 4;
  for (const b of column) {
    const gap = b.top - edge;
    if (gap >= PUCK_H + 4) cands.push(slot(padR, Math.round(edge + (gap - PUCK_H) / 2)));
    edge = Math.max(edge, b.bottom);
  }
  if (vh - edge >= PUCK_H + 4) cands.push(slot(padR, Math.round(edge + (vh - edge - PUCK_H) / 2)));
  /* and a fallback ladder, for a column with nothing on it to measure against */
  for (const f of [0.30, 0.38, 0.46, 0.22, 0.54, 0.62, 0.14]) {
    cands.push(slot(padR, Math.round(vh * f)));
  }
  /* LANDSCAPE ONLY: the far side is allowed.
   *
   * In portrait the right rail is the puck's home and it stays there — moving
   * it is what the "pushed to the left side" report was about. In landscape
   * the right rail is the throttle card top to bottom, so there is genuinely
   * nowhere on it that is not a control, and the opposite edge is open. The
   * layouts are different enough that the pilot is not being asked to unlearn
   * anything: the whole HUD is somewhere else in landscape already. */
  if (vw > vh) {
    for (const f of [0.34, 0.46, 0.22, 0.58]) {
      cands.push(slot(vw - padL - PUCK_W, Math.round(vh * f)));
    }
  }

  /* SCORE, DO NOT JUST TAKE THE FIRST CLEAR ONE.
   *
   * Keeping the puck on the right rail means that on a short screen there may
   * be no completely clear slot at all. "First clear one, else give up" then
   * falls back to the CSS position, which is the very place that was sitting
   * on the CUT switch. So every candidate is scored by how much of it lands on
   * controls, and the least-bad wins — zero where a clear slot exists, and the
   * smallest possible nuisance where none does. The puck is only on screen
   * during a call, so a few square pixels over a readout for the length of a
   * hail is a far better trade than moving it somewhere the pilot will not
   * look for it. */
  let best = null;
  const floor = vw <= vh && sr && sr.height > 0 ? Math.round(sr.bottom) : 4;   // portrait: nothing above the strip
  for (const c of cands) {
    if (!c) continue;
    if (c.top < Math.max(4, floor) || c.bottom > vh - 4) continue;
    if (c.puck.left < 4 || c.puck.right > vw - 4) continue;
    if (c.answer.left < 0 || c.answer.right > vw) continue;   // never off screen: it must be tappable
    /* Overlap dominates; distance from home breaks the ties. Without the
     * tiebreak the first clear gap wins, which on a tall screen is the strip
     * of sky above the gauges — technically free, and a strange place to look
     * for the comms button. Home is just under the systems strip, where it
     * has always been. */
    const home = sr && sr.height > 0 ? sr.bottom + RAIL_GAP : vh * 0.3;
    const score = (overlapArea(c.puck, boxes) + overlapArea(c.answer, boxes)) * 1000 + Math.abs(c.top - home);
    if (!best || score < best.score) best = { c, score };
  }
  if (best) {
    root.style.setProperty("--g-rail-top", `${best.c.top}px`);
    root.style.setProperty("--g-rail-right", `${best.c.right_}px`);
    root.style.setProperty("--g-answer-right", `${best.c.answerRight}px`);
    return sr ? sr.height : 0;
  }
  /* not one candidate even fit on screen: leave comms.css its own number */
  root.style.removeProperty("--g-rail-top");
  root.style.removeProperty("--g-rail-right");
  root.style.removeProperty("--g-answer-right");
  return sr ? sr.height : 0;
}

/* THE LEFT COLUMN STACKS ITSELF (0.3.49).
 *
 * Instruments, status, lock, alarms, the hazard line, the response clock, the
 * message card and the toast all hang down the left edge, and every one of
 * them had a fixed `top` in CSS. The hazard line and the response clock were
 * given the SAME top (+170), and the message card sat at +182 — so the card
 * covered "◈ RESPONSE 12s · <hull>" every time there was a message, which is
 * exactly when a fight is on. A fixed number cannot know which of these are
 * showing, so they are laid out in order, only the visible ones, each under
 * the last. Measured at most five times a second; reading layout every frame
 * after the paint has just written text would force a reflow per frame. */
const LEFT_STACK = ["instruments", "status", "lockbar", "alarms", "hazline", "respline", "notice-card", "toast"];
const STACK_GAP = 6;
let stackAt = 0;
function stackLeftColumn(force = false) {
  const doc = globalThis.document;
  if (!doc) return;
  const now = globalThis.performance?.now?.() ?? Date.now();
  if (!force && now - stackAt < 200) return;
  stackAt = now;
  let y = null;
  for (const id of LEFT_STACK) {
    const el = doc.getElementById(id);
    if (!el) continue;
    if (y == null) { y = el.getBoundingClientRect().top; }   // the first one stays where CSS put it
    else el.style.setProperty("top", `${Math.round(y)}px`, "important");
    const shown = !el.classList.contains("hidden") && el.offsetParent !== null && getComputedStyle(el).display !== "none";
    const h = shown ? el.getBoundingClientRect().height : 0;
    if (h > 1) y += h + STACK_GAP;
  }
  stackRightColumn(doc);
}

/* …and so does the right one, in portrait. The systems strip sat at a fixed
 * +100 under a gauges card 112 px tall, so SHLD/ENG covered the card's CGO row
 * — "top right panels overlapping". The strip now hangs from the card's real
 * bottom, and if that pushes it into the throttle card, the throttle card
 * gives up the difference (its slider row is the flexible one) rather than the
 * two being drawn on top of each other. The comms puck is re-placed whenever
 * the column moves, since it is measured against the strip. */
let rightSig = "";
function stackRightColumn(doc) {
  const g = doc.getElementById("gauges"), strip = doc.getElementById("sys-strip"), dash = doc.getElementById("dash");
  if (!g || !strip) return;
  const portrait = (globalThis.innerHeight || 0) >= (globalThis.innerWidth || 0);
  if (!portrait) {
    if (rightSig !== "land") { strip.style.removeProperty("top"); dash?.style.removeProperty("height"); rightSig = "land"; measureRail(); }
    return;
  }
  const gr = g.getBoundingClientRect();
  if (gr.height < 2) return;
  const top = Math.round(gr.bottom + STACK_GAP);
  strip.style.setProperty("top", `${top}px`, "important");
  let dashH = "";
  if (dash) {
    dash.style.removeProperty("height");
    const dr = dash.getBoundingClientRect(), sb = top + strip.getBoundingClientRect().height + STACK_GAP;
    if (dr.height > 2 && dr.top < sb) {
      dashH = `${Math.max(150, Math.round(dr.bottom - sb))}px`;
      dash.style.setProperty("height", dashH, "important");
    }
  }
  const sig = `${top}|${dashH}|${globalThis.innerWidth}x${globalThis.innerHeight}`;
  if (sig !== rightSig) { rightSig = sig; measureRail(); }
}

export function bindOrient() {
  const measure = () => { measureDock(); measureRail(); };
  const go = () => {
    document.documentElement.dataset.orient = readOrient();
    measure();
  };
  go();
  window.addEventListener("resize", go);
  window.addEventListener("orientationchange", go);
  window.visualViewport?.addEventListener("resize", go);
  /* a chip or a switch that merely unhides fires no resize event, so watch the
   * boxes themselves */
  if (typeof ResizeObserver !== "undefined") {
    const ro = new ResizeObserver(() => measure());
    for (const sel of [".hud-tools", ".sys-strip"]) { const el = document.querySelector(sel); if (el) ro.observe(el); }
  }
  /* web fonts land after first paint and change both boxes under us */
  document.fonts?.ready?.then(measure).catch(() => {});
  /* And the HUD is not laid out on the first call at all — it is `hidden`
   * until a sky is launched, so anything measured before that reads zero and
   * a slot gets chosen against a screen that is not there yet. Measured at
   * 360x740 this put the puck over the CGO gauge button, because the gauges
   * had not been painted when the search ran. A few re-measures cover the
   * gap without needing to know when the HUD appears. */
  for (const ms of [250, 1000, 2500, 6000]) setTimeout(measure, ms);
  return go;
}

/* `paint()` runs on every store update — the engine publishes at ~14 Hz — and
 * it used to resolve sixty-two element ids through document.getElementById on
 * every one of them. That is roughly nine hundred tree lookups a second on a
 * phone, for a set of elements that were written into index.html once and
 * never move.
 *
 * So the lookups are cached. The cache checks `isConnected` before handing an
 * element back, which is a single property read rather than a tree walk, and
 * which self-heals the one case that could go wrong: paint() rewrites three
 * containers with innerHTML, and anything inside those is replaced. A detached
 * node is re-resolved, so a stale handle is impossible by construction rather
 * than by remembering to invalidate. */
const elCache = new Map();

function $(id) {
  const had = elCache.get(id);
  if (had && had.isConnected) return had;
  const el = document.getElementById(id);
  if (el) elCache.set(id, el); else elCache.delete(id);
  return el;
}

function sanitizeRoom(raw) {
  const cleaned = String(raw).replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 24);
  return cleaned.length ? cleaned : PUBLIC_ROOM;
}

function makePrivateCode() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let s = "";
  for (let i = 0; i < 4; i++) s += alphabet[Math.floor(Math.random() * alphabet.length)];
  return s;
}

/** 1 unit = 10 m. Read out in units up close, kilometres once it matters. */
function fmtDist(d) {
  if (!isFinite(d)) return "—";
  const a = Math.abs(d);
  if (a < 1000) return `${Math.round(d)} u`;
  if (a < 100000) return `${(d / 100).toFixed(1)} km`;
  return `${Math.round(d / 100).toLocaleString()} km`;
}

function fmtNum(n, dp = 0) {
  return Number(n).toFixed(dp);
}

/** Names on the glass can come off the wire (peers, ports). Never let them run as markup. */
function esc(s) {
  return String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
}

/**
 * Floating-origin thumbstick. Wherever your thumb lands becomes centre, so
 * touching down never snaps the nose — you only get deflection once you
 * actually move. A small radial deadzone keeps a resting thumb from drifting.
 */
function bindPad(el, knob, onMove, onEnd) {
  const DEAD = 0.07;
  let pid = null;
  let ox = 0;
  let oy = 0;
  let radius = 1;

  const setKnob = (nx, ny) => {
    knob.style.left = `${31 + nx * 22}%`;
    knob.style.top = `${31 + ny * 22}%`;
  };

  const move = (e) => {
    if (pid !== e.pointerId) return;
    let nx = (e.clientX - ox) / radius;
    let ny = (e.clientY - oy) / radius;
    const m = Math.hypot(nx, ny);
    if (m > 1) {
      nx /= m;
      ny /= m;
    }
    setKnob(nx, ny);
    const mag = Math.hypot(nx, ny);
    if (mag < DEAD) {
      onMove(0, 0);
      return;
    }
    const scale = (mag - DEAD) / (1 - DEAD) / mag;
    onMove(nx * scale, ny * scale);
  };

  const end = (e) => {
    if (pid !== e.pointerId) return;
    pid = null;
    setKnob(0, 0);
    onEnd();
  };

  el.addEventListener("pointerdown", (e) => {
    pid = e.pointerId;
    try { el.setPointerCapture(e.pointerId); } catch { /* pointer already gone */ }
    const r = el.getBoundingClientRect();
    radius = r.width * 0.42;
    ox = e.clientX;
    oy = e.clientY;
    setKnob(0, 0);
    onMove(0, 0);
  });
  el.addEventListener("pointermove", move);
  el.addEventListener("pointerup", end);
  el.addEventListener("pointercancel", end);
}

function bindHold(el, down, up) {
  const d = (e) => {
    e.preventDefault();
    el.classList.add("on");
    try {
      el.setPointerCapture(e.pointerId);
    } catch {
      /* not capturable */
    }
    down();
  };
  const u = () => {
    el.classList.remove("on");
    up();
  };
  el.addEventListener("pointerdown", d);
  el.addEventListener("pointerup", u);
  el.addEventListener("pointercancel", u);
  el.addEventListener("pointerleave", u);
}

/* ---- throttle slider ----------------------------------------------------- */

function bindThrottle(track, fill, thumb) {
  let pid = null;
  const set = (clientY) => {
    const r = track.getBoundingClientRect();
    const frac = Math.max(0, Math.min(1, (clientY - r.top) / r.height));
    let v = THROTTLE_MAX - frac * THR_SPAN;
    /* 1% detents, and a magnet on the zero stop */
    v = Math.round(v * 100) / 100;
    if (Math.abs(v) < 0.045) v = 0;
    if (Math.abs(v - 1) < 0.035) v = 1;
    setThrottle(v);
  };
  track.addEventListener("pointerdown", (e) => {
    pid = e.pointerId;
    try { track.setPointerCapture(e.pointerId); } catch { /* pointer already gone */ }
    set(e.clientY);
  });
  track.addEventListener("pointermove", (e) => {
    if (pid !== e.pointerId) return;
    set(e.clientY);
  });
  /* the slider is momentary: let go and it springs back to zero. Held thrust is a preset. */
  const end = (e) => {
    if (pid !== e.pointerId) return;
    pid = null;
    setThrottle(0);
    heldPreset = null;
  };
  let heldPreset = null;
  const presets = [...document.querySelectorAll("#thr-presets [data-thr]")];
  for (const b of presets) b.addEventListener("click", () => { const v = Number(b.dataset.thr); heldPreset = v; setThrottle(v); });
  track.addEventListener("pointerup", end);
  track.addEventListener("pointercancel", end);

  return function paintThrottle(t) {
    const frac = (THROTTLE_MAX - t) / THR_SPAN; // 0 at top
    const topPct = frac * 100;
    const zeroPct = THR_ZERO * 100;
    if (t >= 0) {
      fill.style.top = `${topPct}%`;
      fill.style.height = `${Math.max(0, zeroPct - topPct)}%`;
    } else {
      fill.style.top = `${zeroPct}%`;
      fill.style.height = `${Math.max(0, topPct - zeroPct)}%`;
    }
    fill.classList.toggle("rev", t < 0);
    fill.classList.toggle("od", t > 1);
    for (const b of presets) b.classList.toggle("on", Math.abs(Number(b.dataset.thr) - t) < 0.005 && t === heldPreset);
    thumb.style.top = `${topPct}%`;
  };
}

/* ---- markers ------------------------------------------------------------- */

/* Every mark on the glass says what it is. Nothing unexplained. */
const MARKER = {
  prograde: { glyph: "▲", label: "PRO" },
  retrograde: { glyph: "▼", label: "RET" },
  aim: { glyph: "+", label: "" },
  engaged: { glyph: "◻", label: "FIRING" },
  tracked: { glyph: "◻", label: "TRACK" },
  mining: { glyph: "◈", label: "CUT" },
  waypoint: { glyph: "", label: "MARK" },
  lock: { glyph: "⊕", label: "LOCK" },
};

function paintMarkers(box) {
  const list = window.__lgMarkers ?? [];
  if (!list.length) {
    if (box.childElementCount) box.innerHTML = "";
    return;
  }
  box.innerHTML = list
    .map((m) => {
      const d = MARKER[m.kind] ?? { glyph: "", label: "" };
      const cap = m.kind === "lock" && m.pct != null ? `${Math.round(m.pct * 100)}%` : d.label;
      return `<span class="${m.kind}" style="left:${m.x}%;top:${m.y}%">${d.glyph}${cap ? `<b>${cap}</b>` : ""}</span>`;
    })
    .join("");
}

/* ---- mount --------------------------------------------------------------- */

/* The tape's read of the world (js/recorder.js).
 *
 * It lives here rather than in sim.js because the numbers it wants are spread
 * across four modules that all import sim — the seam finder and the bus rule
 * from the autopilot, the contact list from the turrets, the mission step from
 * the runner — and a sampler in sim.js would have to import every one of them
 * back. The HUD already depends on all of it.
 *
 * Distances go out in KILOMETRES, not units: a feature that runs to six figures
 * swamps a 0..1 hull fraction in any distance metric that is not hand-weighted,
 * and km keeps the whole vector inside roughly the same decade.
 */
const TURRET_IX = { off: 0, passive: 1, castle: 2, free: 3 };
const CUTTER_IX = { off: 0, closest: 1, locked: 2 };
const PHASE_IX = { menu: 0, play: 1, pause: 2, dead: 3 };

function sampleWorld() {
  const ship = sim.ship;
  if (!ship) return null;
  const p = ship.pos;
  let portKm = -1;
  for (const st of stations) {
    const d = Math.hypot(st.x - p.x, st.y - p.y, st.z - p.z) / 1000;
    if (portKm < 0 || d < portKm) portKm = d;
  }
  let seamKm = -1;
  try {
    const seam = nearestSeam();
    if (seam) seamKm = Math.hypot(seam.x - p.x, seam.y - p.y, seam.z - p.z) / 1000;
  } catch { /* no field loaded yet */ }
  let hz = 0;
  for (const c of turretContacts) {
    if (c.hp > 0 && c.relation === "hostile" && Math.hypot(c.x - p.x, c.y - p.y, c.z - p.z) < 6000) hz++;
  }
  let bus = 0;
  try { const b = busOverload(ship); bus = b.demand && b.cap ? b.demand / b.cap : 0; } catch { /* pre-launch */ }
  return {
    t: sim.time,
    hull: ship.hull / Math.max(1, hullMaxOf(ship)),
    hold: cargoTotal(ship) / Math.max(1, ship.cargoCap),
    cr: ship.credits,
    spd: Math.hypot(ship.vel.x, ship.vel.y, ship.vel.z),
    chg: ship.charge / Math.max(1, ship.batteryCap ?? ship.charge ?? 1),
    dk: ship.dockedAt ? 1 : 0,
    ap: ap.on ? 1 : 0,
    ms: mission.active ? mission.stepIx + 1 : 0,
    hz,
    tm: TURRET_IX[ship.turretMode] ?? 0,
    mm: CUTTER_IX[ship.miningMode] ?? 0,
    ph: PHASE_IX[sim.phase] ?? 0,
    seam: seamKm,
    port: portKm,
    bus,
  };
}

/* 0.3.29 — the hold panel: open state and its own repaint, throttled, because
 * the bag changes while the cutter runs and a per-frame rebuild of a slot grid
 * on a phone is not free. */
let holdOpen = false;
let holdPaintedAt = -1e9;
function paintHold() {
  const host = document.getElementById("hold-body");
  if (!host) return;
  holdPaintedAt = sim.time;
  renderHold(host, { onChange: () => { holdPaintedAt = -1e9; } });
}

export function mountHud() {
  bindOrient();
  /* The tape. `who` is what keeps ARIA from training on itself: the same
   * record shape, a different label, and the readers default to the player's
   * own hands (js/recorder.js). */
  wireRecorder({
    sample: sampleWorld,
    who: () => (captain.holder === "aria" ? "aria" : captain.holder !== "player" ? "auto" : sim.handsOff ? "auto" : "player"),
  });
  /* Missions go on the tape through the runner's own hooks rather than a call
   * inside it: js/mission/run.js already fires onStep as each step begins and
   * onEnd when a run finishes, nothing had claimed either, and a record per
   * STEP is better training data than one per mission — "docked, so sell" and
   * "hold full, so break off and go home" are separate decisions and the tape
   * should hold them separately. */
  missionHooks.onStep = (st, ix) => tapeRecord("mission", st.op, st.target?.name ?? st.target?.kind ?? null, { step: ix + 1, of: mission.active?.steps.length ?? 0, m: mission.active?.mode ?? "manual" });
  missionHooks.onEnd = (m, why, state) => tapeRecord("mission", "end", m?.name ?? null, { why: String(why).slice(0, 40), state });
  const store = useGameStore;
  const saved = store.getState();
  const startCall = (typeof localStorage !== "undefined" && store.getState().callsign) || randomCallsign();
  store.setState({ callsign: saved.callsign && saved.callsign !== "Pilot" ? saved.callsign : startCall });

  const params = new URLSearchParams(location.search);
  const initialRoom = params.get("room") || "";

  /* The seed IS the sky. Sol is the shared one; anything else grows its own. */
  let seedKey = initialRoom && initialRoom !== PUBLIC_ROOM ? sanitizeRoom(initialRoom) : PUBLIC_ROOM;

  $("callsign").value = store.getState().callsign;

  const describeSeed = (seed) => {
    const sys = generateSystem(seed);
    const st = describeSystem(sys);
    const moonWord = st.moons === 1 ? "moon" : "moons";
    const extras = [
      st.belts ? (st.belts > 1 ? `${st.belts} belts` : "belt") : "",
      st.shattered ? `${st.shattered} shattered` : "",
      st.ringed ? "rings" : "",
    ].filter(Boolean);
    return `${sys.name} · ${st.star} star · ${st.planets} worlds · ${st.moons} ${moonWord}${extras.length ? ` · ${extras.join(" · ")}` : ""}`;
  };

  const refreshPreview = () => {
    const prog = skyProgress(seedKey);
    const sys = generateSystem(seedKey);
    $("sys-line").textContent = describeSeed(seedKey);
    $("stat-survey").textContent = `${prog.scanned.length}/${sys.bodies.length} worlds`;
    $("stat-probes").textContent = `${prog.beacons.length}/${sys.beacons.length}`;
  };

  let previewTimer = 0;
  const queueSky = () => {
    refreshPreview();
    clearTimeout(previewTimer);
    previewTimer = window.setTimeout(() => loadSky(seedKey), seedKey === PUBLIC_ROOM ? 40 : 240);
  };

  const go = (seed) => {
    unlockAudio();
    clearTimeout(previewTimer);
    seedKey = seed;
    store.getState().setRoom(seed, seed === PUBLIC_ROOM);
    launchSim(store.getState().callsign.trim() || "Pilot", seed);
    /* first flight on this device gets the walkthrough; it reads the sky it is in */
    startTutorial(false);
    /* same sky, same room: whoever else typed this name is on your sensors —
     * one host runs the rocks, one clock runs the ports and the traffic */
    resetWorldSync();
    mountWorldSync();
    connectNet(seed);
    connectCradle(seed);
    connectGdb(seed);
  };

  queueSky();

  /* one place knows what this build is (js/version.js); the start card just
   * prints it, so the tab title, the HUD corner and this line cannot drift */
  const buildEl = $("build-line");
  if (buildEl) buildEl.textContent = BUILD_LINE;

  $("callsign").addEventListener("input", (e) => store.getState().setCallsign(e.target.value));

  /* Pilot creation. The backdrop keeps rendering behind it, which is how the
   * surfaces get painted before you ever reach the cockpit. */
  const creation = mountCreation({
    rollSeed: () => makePrivateCode() + makePrivateCode().slice(0, 1),
    onSeed: (seed) => {
      seedKey = seed;
      queueSky();
    },
    describe: (seed) => describeSeed(seed),
    systemName: (seed) => generateSystem(seed).name,
    loadedSeed: () => seedKey,
    normalizeSeed: (seed) => (seed === "sol" ? PUBLIC_ROOM : sanitizeRoom(seed)),
    onLaunch: (seed) => go(seed === "sol" ? PUBLIC_ROOM : sanitizeRoom(seed)),
  });
  /* 0.3.42 — FLY AS <callsign>. A device with a pilot record and a save flies
   * on as that pilot: race, rank, skills, hulls, cover, purse, corp, fleet,
   * into the sky they were last in. "New pilot" is the creation screen as
   * before, which is a NEW RUN and sweeps all of that — so it asks first. */
  const contBtn = $("btn-continue");
  const createBtn = $("btn-create");
  const paintStart = () => {
    const rec = loadPilot();
    const sv = loadSave();
    const can = Boolean(rec && sv.callsign);
    if (contBtn) {
      contBtn.hidden = !can;
      if (can) contBtn.textContent = `Fly as ${sv.callsign}`;
    }
    createBtn.textContent = can ? "New pilot" : "Create pilot";
    createBtn.classList.toggle("btn-accent", !can);
    createBtn.classList.toggle("btn-ghost", can);
  };
  paintStart();
  contBtn?.addEventListener("click", () => {
    const rec = loadPilot();
    const sv = loadSave();
    if (!rec || !sv.callsign || !restorePilot(rec)) { paintStart(); return; }
    $("callsign").value = sv.callsign;
    store.getState().setCallsign(sv.callsign);
    const sky = sv.lastSky || PUBLIC_ROOM;
    if (sky !== seedKey) { seedKey = sky; refreshPreview(); }
    go(sky);
  });
  createBtn.addEventListener("click", () => {
    if (loadPilot() && loadSave().callsign) {
      const name = loadSave().callsign;
      const sure = globalThis.confirm ? confirm(`Start a NEW pilot?\n\n${name}'s rank, hulls, corp, fleet, refits and purse on this device are cleared. If ${name} is synced to an account, the next sync replaces the account copy too.\n\nFly as ${name} instead to keep them.`) : true;
      if (!sure) return;
    }
    unlockAudio();
    creation.show();
  });
  if (globalThis.window?.__lg) window.__lg.start = { paintStart, continueRun: () => contBtn?.click() };

  /* --- pan stick: this is the nose --- */
  bindPad(
    $("stick"),
    $("stick-knob"),
    (nx, ny) => {
      touch.panX = nx;
      touch.panY = -ny;
    },
    () => {
      touch.panX = 0;
      touch.panY = 0;
    },
  );

  /* --- RCS cluster --- */
  const RCS_MAP = {
    left: ["rcsX", -1],
    right: ["rcsX", 1],
    up: ["rcsY", 1],
    down: ["rcsY", -1],
    fwd: ["rcsZ", 1],
    aft: ["rcsZ", -1],
  };
  document.querySelectorAll("[data-rcs]").forEach((el) => {
    const [axis, dir] = RCS_MAP[el.getAttribute("data-rcs")];
    bindHold(
      el,
      () => {
        touch[axis] = dir;
      },
      () => {
        if (touch[axis] === dir) touch[axis] = 0;
      },
    );
  });
  bindHold(
    $("btn-brake"),
    () => {
      touch.brake = true;
    },
    () => {
      touch.brake = false;
    },
  );

  /* --- throttle --- */
  const paintThrottle = bindThrottle($("thr-track"), $("thr-fill"), $("thr-thumb"));
  paintThrottle(0);

  /* --- dash pages --- */
  const PAGE_NAME = { 1: "FLIGHT", 2: "OPS", 3: "COMMS" };
  let dashPage = 1;
  const setPage = (n) => {
    dashPage = n;
    for (const p of [1, 2, 3]) $(`dash-page-${p}`).classList.toggle("hidden", p !== n);
    $("dash-tabs").querySelectorAll("button").forEach((b) => {
      b.classList.toggle("on", Number(b.getAttribute("data-page")) === n);
    });
    $("dash-page-name").textContent = PAGE_NAME[n];
  };
  $("dash-tabs")
    .querySelectorAll("button[data-page]")
    .forEach((b) => b.addEventListener("click", () => setPage(Number(b.getAttribute("data-page")))));
  setPage(1);

  /* --- switchboard (both pages share the data-sys contract) --- */
  /* The cutter: one tap on / off, remembering which mode it was in.
   *
   * It is NOT on the data-sys contract because it is not a boolean — off,
   * closest and overdrive — and the pilot asked for a switch, not a cycle. So
   * the switch toggles between off and whatever it was last set to, and
   * OVERDRIVE stays where it always was (the CON, and the existing cycle) for
   * when you actually want it. */
  let lastCut = "closest";
  $("sw-cut")?.addEventListener("click", () => {
    const ship = sim.ship;
    if (ship.miningMode !== "off") { lastCut = ship.miningMode; setMiningMode("off"); }
    else setMiningMode(lastCut === "off" ? "closest" : lastCut);
  });
  document.querySelectorAll(".sw[data-sys]").forEach((el) => {
    el.addEventListener("click", () => toggleSystem(el.getAttribute("data-sys")));
  });
  $("mode-turret").addEventListener("click", () => cycleTurretMode(1));
  $("mode-mining").addEventListener("click", () => cycleMiningMode(1));

  /* --- ops board --- */
  $("op-pulse").addEventListener("click", () => sensorPulse());
  $("op-level").addEventListener("click", () => autoLevel());
  $("op-time").addEventListener("click", () => cycleTimeScale());
  $("op-dock").addEventListener("click", () => toggleDock());
  $("op-claim").addEventListener("click", () => {
    const why = claimPort();
    if (why) sim.notice = `Cannot claim — ${why.toLowerCase()}.`;
  });
  $("op-threat").addEventListener("click", () => toggleSystem("sentry"));

  /* --- actions --- */
  $("btn-survey").addEventListener("click", () => requestScan());
  $("btn-plock").addEventListener("click", () => togglePointerLock());
  $("btn-warp").addEventListener("click", () => requestJump());
  $("btn-con").addEventListener("click", () => toggleConsole());
  $("btn-cam").addEventListener("click", () => {
    sim.cameraMode = (sim.cameraMode + 1) % 2;
  });
  $("btn-pause").addEventListener("click", () => {
    sim.phase = "pause";
    store.getState().setPhase("pause");
  });
  $("btn-resume").addEventListener("click", () => resumePlay());
  /* farm the neural core: while an NPC holds the conn, let them fly at 40× */
  $("btn-tutor").addEventListener("click", () => {
    resumePlay();
    startTutorial(true);
  });
  $("btn-watch").addEventListener("click", () => {
    if (captain.holder === "player") return;
    sim.timeScale = 40;
    resumePlay();
    sim.notice = `${captain.member?.name ?? "The conn"} flying the watch at 40×. Pause to interrupt.`;
  });
  $("btn-menu").addEventListener("click", () => {
    disconnectNet();
    disconnectCradle();
    disconnectGdb();
    returnToMenu();
    queueSky();
  });
  $("btn-map").addEventListener("click", () => store.getState().setMapOpen(true));
  /* 0.3.29 — the bag opens from the tools row (always there) and from the CGO
   * gauge (landscape only — the gauge strip is display:none in portrait, which
   * is how the game is actually held). */
  const toggleHold = () => { holdOpen = !holdOpen; if (holdOpen) paintHold(); };
  $("btn-hold").addEventListener("click", toggleHold);
  $("g-cgo-btn")?.addEventListener("click", toggleHold);
  $("hold-close").addEventListener("click", () => { holdOpen = false; });
  $("hold").addEventListener("click", (e) => { if (e.target.id === "hold") holdOpen = false; });
  /* ARIA: one tap hands it the ship, one tap (or the stick) takes it back */
  $("btn-aria").addEventListener("click", () => {
    const r = ariaHasConn() ? ariaRelease() : ariaTakeConn();
    if (!r.ok) sim.notice = r.error;
    else if (!ariaHasConn()) sim.notice = "You have the conn.";
  });
  /* Fullscreen: the phone's own bars off the canopy. The request has to come
   * from this tap — the module refuses to ask any other way — and if the
   * browser turns it down the reason goes on the HUD rather than nowhere. */
  mountFullscreen({
    button: $("btn-full"),
    onChange: (on, why) => { if (why) sim.notice = why; },
  });
  $("btn-map-close").addEventListener("click", () => store.getState().setMapOpen(false));
  $("btn-mute").addEventListener("click", () => {
    const next = !store.getState().muted;
    store.getState().setMuted(next);
    setAudioMuted(next);
    if (!next) UI.toggleOn();
  });

  /* ---- the mixer ----
   * Five named buses and a master, saved to localStorage. The reason it
   * exists rather than one volume: an engine bed you cannot turn down
   * without also turning down the collision alarm is an engine bed the
   * player mutes, and then they lose the alarm too. */
  {
    const rows = $("mix-rows");
    const levels = busLevels();
    const paintRow = (name) => {
      const row = document.createElement("div");
      row.className = "mix-row";
      const lab = document.createElement("label");
      lab.textContent = name;
      const r = document.createElement("input");
      r.type = "range"; r.min = "0"; r.max = "100"; r.step = "1";
      r.value = String(Math.round((levels[name] ?? 0.6) * 100));
      r.setAttribute("aria-label", `${name} level`);
      const b = document.createElement("b");
      b.textContent = r.value;
      r.addEventListener("input", () => { b.textContent = r.value; setBusLevel(name, Number(r.value) / 100); });
      row.append(lab, r, b);
      rows.append(row);
      return r;
    };
    const sliders = Object.fromEntries(["master", ...BUSES].map((n) => [n, paintRow(n)]));
    $("btn-mix-reset").addEventListener("click", () => {
      resetMix();
      const now = busLevels();
      for (const [n, el] of Object.entries(sliders)) {
        el.value = String(Math.round((now[n] ?? 0.6) * 100));
        el.nextSibling.textContent = el.value;
      }
      UI.press();
    });
  }

  /* One delegated listener instead of a cue on every button in the game.
   * Anything that wants a different sound fires its own and marks itself
   * data-quiet, so this never doubles up. */
  document.addEventListener("pointerdown", (e) => {
    const el = e.target?.closest?.("button, .btn, .tbtn, .pick, .chip");
    if (!el || el.disabled) return;
    if (el.dataset.quiet !== undefined) return;
    if (el.getAttribute("aria-pressed") !== null || el.classList.contains("sw")) UI.press();
    else UI.tap();
  }, { passive: true, capture: true });

  const paintMap = mountMap(store);

  /* --- switch labels --- */
  /* Short enough to survive a 60px switch cap on a small phone. */
  const SW_LABEL = {
    shields: (on) => (on ? "UP" : "DOWN"),
    turretsArmed: (on) => (on ? "ARMED" : "STOW"),
    engines: (on) => (on ? "ON" : "COLD"),
    pressurized: (on) => (on ? "PRESS" : "VENT"),
    localGravity: (on) => (on ? "ON" : "ZERO"),
    assist: (on) => (on ? "ON" : "OFF"),
    lights: (on) => (on ? "ON" : "OFF"),
    sentry: (on) => (on ? "WATCH" : "OFF"),
    salvage: (on) => (on ? "REEL" : "OFF"),
    matchLock: (on) => (on ? "HOLD" : "OFF"),
  };
  const SW_POWER = {
    shields: "shields",
    turretsArmed: "turrets",
    engines: "engines",
    pressurized: "lifeSupport",
    localGravity: "gravity",
    assist: null,
    lights: "ops",
    sentry: "ops",
    salvage: "ops",
    matchLock: null,
  };
  const SW_STATE = {
    shields: (s) => s.systems.shields,
    turretsArmed: (s) => s.systems.turrets,
    engines: (s) => s.systems.engines,
    pressurized: (s) => s.systems.pressurized,
    localGravity: (s) => s.systems.gravity,
    assist: (s) => s.systems.assist,
    lights: (s) => s.lights,
    sentry: (s) => s.sentry,
    salvage: (s) => s.salvage,
    matchLock: (s) => s.matchLock,
  };
  const swEls = [...document.querySelectorAll(".sw[data-sys]")];
  const swSt = new Map(swEls.map((el) => [el, el.querySelector(".st")]));
  let alarmsHtml = "";

  const setGauge = (bar, num, pct, text, low) => {
    bar.style.width = `${Math.max(0, Math.min(100, pct * 100))}%`;
    num.textContent = text;
    bar.parentElement.parentElement.classList.toggle("low", low);
  };

  $("notice-card").addEventListener("click", () => dismissNotice());

  const canopy = $("canopy");
  const markerBox = $("markers");
  const noticeCard = $("notice-card");
  const warpBar = $("btn-warp");
  const flashEl = $("impact-flash");
  const glareEl = $("sky-glare");
  let routeKey = "";
  const rowEl = (kind, text, cls) => {
    const d = document.createElement("div");
    d.className = `route-row ${cls ?? ""}`;
    d.textContent = text;
    return d;
  };
  const warpFill = $("warp-fill");
  const warpState = $("warp-state");
  const paintConsole = mountConsole();
  const paintDeck = mountStationDeck();
  const paintSec = mountSecBadge();
  /* 0.3.52 — port standard time on the title bar: the day, the hour, and a
   * glyph for the part of it. The whole HUD carries the part as data-part so
   * the night can dim it. Repaints only when the minute turns. */
  let clockKey = "";
  const paintClock = () => {
    const c = clockAt(sim.time);
    const k = `${c.day}|${c.hhmm}`;
    if (k === clockKey) return;
    clockKey = k;
    const el = $("hud-clock");
    const glyph = c.part === "night" ? "☾" : c.part === "day" ? "☀" : "◐";
    el.textContent = `${glyph} D${c.day} ${c.hhmm}`;
    el.title = `Port standard time · ${c.weekday}, day ${c.day} (week ${c.week}) · ${c.hhmm} · ${c.part} · ${c.shift} shift on the docks`;
    el.dataset.part = c.part;
    const hud = document.getElementById("hud");
    if (hud && hud.dataset.part !== c.part) hud.dataset.part = c.part;
  };
  const paintDockBoot = mountDockBoot();
  const paintChat = mountChatbox() ?? (() => {});

  /* The HUD paints from the ENGINE's frame tick (sim.publishHud → store → here),
   * so anything that throws in a panel, the chart or a readout used to take the
   * tick with it — before the renderer ran. One bad line froze the canopy every
   * frame until the page was reloaded. The HUD is allowed to be wrong for a
   * frame; the game is not allowed to stop drawing. */
  let paintFailed = 0;
  const paint = (...args) => {
    try { paintAll(...args); } catch (e) {
      if (paintFailed++ < 3) globalThis.console.error("HUD paint failed (the canopy keeps drawing)", e);
    }
  };
  const paintAll = () => {
    const s = store.getState();
    const playing = s.phase !== "menu";
    /* Close out any tape record whose outcome window has run (js/recorder.js).
     * Cheap: it only touches records whose window has already closed. */
    if (playing) settleTape();
    /* surface loader on the creation screen */
    if (creation.isOpen()) creation.progress(sim.texLoad?.done ?? 0, sim.texLoad?.total ?? 0);
    $("start").classList.toggle("hidden", playing || creation.isOpen());
    $("hud").classList.toggle("hidden", !playing);
    canopy.classList.toggle("hidden", !playing || sim.cameraMode !== 0);
    $("pause").classList.toggle("hidden", s.phase !== "pause");
    $("btn-watch")?.classList.toggle("hidden", s.phase !== "pause" || captain.holder === "player");
    $("map").classList.toggle("hidden", !s.mapOpen);
    $("hold").classList.toggle("hidden", !holdOpen);
    $("btn-hold").classList.toggle("on", holdOpen);
    $("btn-hold").textContent = s.cargo > 0 ? `HOLD ${Math.round((s.cargo / Math.max(1, s.cargoCap)) * 100)}%` : "HOLD";
    paintDeck(s);
    paintDockBoot();
    if (!playing) return;
    paintChat();
    paintSec();
    $("btn-cam").textContent = sim.cameraMode === 0 ? "FPV" : "EXT";
    { const b = $("btn-aria"); const on = ariaHasConn(); b.classList.toggle("on", on); b.title = on ? `ARIA · ${ariaPilot.job ?? "planning"} — tap or touch the stick to take it back` : "Hand ARIA the conn"; }

    const sel = s.selected ? bodyById(s.selected) : undefined;
    const near = bodyById(s.nearest);
    $("hud-sky").textContent = s.isPublic ? s.systemName : `${s.systemName} · ${s.room}`;
    paintClock();

    /* instruments */
    $("i-vel").textContent = fmtNum(s.speed, s.speed < 100 ? 1 : 0);
    $("i-cls").textContent = fmtNum(s.closing, Math.abs(s.closing) < 100 ? 1 : 0);
    $("i-alt").textContent = s.dominantName ? fmtDist(s.altitude) : "—";

    /* Collision warning. Level 1 is the ship telling you; 2 and 3 are the
     * ship doing something about it, so the line says which — a hull that
     * turns on its own without saying why reads as a bug. */
    const hz = s.hazard;
    const hazEl = $("hazline");
    if (hz) {
      hazEl.classList.remove("hidden");
      hazEl.classList.toggle("warn", hz.level <= 1);
      hazEl.classList.toggle("act", hz.level >= 2);
      const verb = hz.level >= 3 ? "BRAKING" : hz.level >= 2 ? "AVOIDING" : "IN THE WAY";
      $("haz-text").textContent = `⚠ ${verb} · ${hz.name} · ${hz.t.toFixed(1)}s`;
    } else {
      hazEl.classList.add("hidden");
    }
    /* The response clock beneath the hazard line. `RESPONSE 41s` is a number
     * you can act on; `NO RESPONSE` is the same information and the reason to
     * act differently. */
    const rp = s.response;
    const rEl = $("respline");
    if (rEl) {
      if (rp) {
        rEl.classList.remove("hidden");
        rEl.classList.toggle("warn", rp.mine === true);
        rEl.classList.toggle("act", rp.eta != null && rp.eta <= 15 && !rp.onScene);
        rEl.classList.toggle("none", rp.eta == null && !rp.onScene);
        const who = rp.victim.length > 18 ? `${rp.victim.slice(0, 17)}…` : rp.victim;
        $("resp-text").textContent = rp.onScene
          ? `◈ ON SCENE · ${who}`
          : rp.eta == null
            ? `◈ NO RESPONSE · ${who}`
            : `◈ RESPONSE ${rp.eta}s · ${who}`;
      } else rEl.classList.add("hidden");
    }

    $("i-g").textContent = (s.dominantG / 25).toFixed(2);
    $("instruments").classList.toggle("hot", s.heat > 0.2);

    /* gauges */
    setGauge($("g-pwr"), $("g-pwr-n"), s.chargePct, `${Math.round(s.chargePct * 100)}%`, s.chargePct < 0.18);
    /* 0.3.34: the pools come off the flown hull, so these are fractions of
     * THIS ship's maximum, not of a universal hundred. A 920-point G frame
     * used to peg the bar at 9x full and read "920" with no scale on it. */
    const hMax = Math.max(1, s.hullMax ?? 100);
    const sMax = Math.max(1, s.shieldMax ?? 100);
    setGauge($("g-hull"), $("g-hull-n"), s.hull / hMax, `${Math.round(s.hull)}`, s.hull < hMax * 0.35);
    setGauge($("g-shld"), $("g-shld-n"), s.shieldCharge / sMax, `${Math.round(s.shieldCharge)}`, s.shieldCharge < sMax * 0.25);
    setGauge($("g-o2"), $("g-o2-n"), s.o2 / 100, `${Math.round(s.o2)}`, s.o2 < 30);
    setGauge($("g-cgo"), $("g-cgo-n"), s.cargo / s.cargoCap, `${Math.round(s.cargo)}`, false);
    if (holdOpen && sim.time - holdPaintedAt > 0.4) paintHold();

    /* alarms */
    const alarms = [...s.debuffs];
    if (s.heat > 0.35) alarms.unshift("HULL TEMPERATURE");
    const ah = alarms.slice(0, 4).map((t) => `<span>${esc(t)}</span>`).join("");
    if (ah !== alarmsHtml) {
      alarmsHtml = ah;
      $("alarms").innerHTML = ah;
    }

    /* 0.3.49: the left column stacks itself (see stackLeftColumn) */
    stackLeftColumn();

    /* transient message card */
    /* the card is titled by what the message is ABOUT when it says so — "Undocked." reads as the port */
    const about = s.noticeAbout && s.noticeAbout.text === s.notice ? s.noticeAbout.name : null;
    /* … else by the lock, else by what the reticle is on, else by the nearest
     * world — but only when the message is about it. 0.3.49: tapping TURR or
     * ENG printed "EARTH" over "Turrets armed", because a message about the
     * ship took its title from whatever planet was closest. A name the text
     * does not mention is not what it is about: those are the ship's. */
    const named = [sel?.name, s.reticleName, near?.name].find((n) => n && s.notice?.includes(n));
    $("lock-name").textContent = about ?? named ?? (s.noticeTag || "SHIP");
    $("notice").textContent = s.notice;
    const stale = s.noticeAge > NOTICE_LIFE;
    noticeCard.classList.toggle("fading", stale);
    noticeCard.classList.toggle("hidden", s.noticeAge > NOTICE_LIFE + 1.2);

    /* always-on one-liner */
    const dom = s.dominantName ? `${s.dominantName} ${fmtDist(s.altitude)}` : "deep space";
    const wp = s.waypointName ? ` · ◈ ${s.waypointName} ${fmtDist(s.waypointDist)}` : "";
    const contact = s.targetName
      ? `${s.targetHostile ? "ENGAGING" : "trk"} ${s.targetName}`
      : `${s.contacts} contacts`;
    const tf = s.traffic;
    const sky = tf ? ` · ${tf.flying + (s.flowUp ?? 0)} up · ${tf.trader} trd/${tf.miner} min/${tf.pirate ?? 0} pir` : "";
    const fight = s.engagement ? ` · ⚔ ${s.engagement}` : "";
    const lane = s.tractor ? ` · ${s.tractor.phase === "push" ? "⇡ DEPARTURE" : "⇣ TRACTOR LOCK"} ${s.tractor.name} · ${s.tractor.left}s` : s.approach ? ` · ${s.approach.name} ${s.approach.where === "mouth" ? "MOUTH" : "ENTRY LANE"} — no berth: hail (o) or DOCK` : s.dockRequest ? ` · BERTH ${s.dockRequest.name} — take the entry lane` : s.lane ? ` · ${s.lane.wrong ? "⚠ WRONG WAY" : `${s.lane.which.toUpperCase()} LANE ${s.lane.way}/3`} ${Math.round(s.lane.along / 100)} km ${s.lane.port}` : "";
    const ev = s.skyEvent && s.skyEvent !== "quiet" ? ` · ${String(s.skyEvent).replace("_", " ")}` : "";
    const net = s.peers?.length ? ` · ${s.peers.length + 1} pilots` : "";
    $("status").textContent =
      `${dom}${wp} · ${contact}${sky}${lane}${fight}${ev}${net} · SUR ${s.scanned.length}/${s.surveyTotal} · PRB ${s.beaconsGot.length}/${s.beaconTotal} · ${s.timeScale}×`;
    $("btn-mute").textContent = s.muted ? "Un" : "M";
    $("btn-con").classList.toggle("on", s.terminalOpen);

    /* a nearby cataclysm whites the canopy out */
    flashEl.style.opacity = s.flash > 0.01 ? Math.min(1, s.flash) : 0;
    /* the glare of something enormous happening off the side of the canopy */
    const gl = sim.glare;
    if (gl && gl.lum > 0.006) {
      glareEl.style.setProperty("--glare-x", `${gl.x.toFixed(1)}%`);
      glareEl.style.setProperty("--glare-y", `${gl.y.toFixed(1)}%`);
      glareEl.style.setProperty("--glare-rgb", `${(gl.hex >> 16) & 255}, ${(gl.hex >> 8) & 255}, ${gl.hex & 255}`);
      glareEl.style.opacity = Math.min(0.85, gl.lum).toFixed(3);
    } else if (glareEl.style.opacity !== "0") {
      glareEl.style.opacity = "0";
    }

    /* warp core */
    const ws = s.warpState;
    const running = ws === "run";
    const spooling = ws === "spool";
    warpBar.className = `warpbar ${running ? "run" : spooling ? "spool" : s.warpBlock ? "blocked" : "ready"}`;
    warpFill.style.width = `${running || spooling ? Math.min(100, s.warpProgress * 100) : 0}%`;
    warpState.textContent = running
      ? "IN WARP"
      : spooling
        ? `SPOOL ${Math.round(s.warpProgress * 100)}%`
        : s.warpBlock || (s.route && !s.route.aligned ? `ALIGN Δ${s.route.align}°` : "READY");

    /* route card: the plot only resolves once the nose is on the lane */
    const rc = $("route-card");
    const r = s.route;
    if (!r || running) {
      rc.classList.add("hidden");
      routeKey = "";
    } else {
      rc.classList.remove("hidden");
      const rk = `${r.targetId}:${r.aligned}:${r.align}:${r.hazards.map((h) => h.note).join("|")}:${Boolean(r.impact)}`;
      if (rk !== routeKey) {
        routeKey = rk;
        $("route-target").textContent = `ROUTE · ${r.target.toUpperCase()}`;
        $("route-eta").textContent = r.aligned ? `${fmtDist(r.dist)} · ${r.eta}s` : `Δ${r.align}° — come about`;
        const hz = $("route-hazards");
        hz.innerHTML = "";
        if (!r.aligned) {
          hz.append(rowEl("plot", "Point the nose at the target to plot the lane", ""));
        } else if (r.impact) {
          hz.append(rowEl("impact", r.impact.note, "hot"));
        } else if (!r.hazards.length) {
          hz.append(rowEl("clear", "Lane clear", "good"));
        } else {
          for (const h of r.hazards) hz.append(rowEl(h.kind, `${Math.round(h.at * 100)}% · ${h.note}`, h.kind === "graze" || h.kind === "rock" ? "warn" : ""));
        }
      }
      rc.classList.toggle("bad", Boolean(r.impact));
      rc.classList.toggle("unaligned", !r.aligned);
    }

    /* throttle */
    paintThrottle(s.throttle);
    /* Grey the overdrive band out when the limiter rules it out. */
    $("thr-track").classList.toggle("capped", s.throttleCap < 1.001);
    $("thr-num").textContent = `${Math.round(s.throttle * 100)}`;
    $("thr-draw").textContent = `${Math.round(s.load)} / ${Math.round(s.reactor)} kW`;
    $("thr-draw").style.color = s.load > s.reactor ? "var(--danger)" : "var(--subtle)";

    /* switchboard */
    for (const el of swEls) {
      const key = el.getAttribute("data-sys");
      const on = SW_STATE[key] ? SW_STATE[key](s) : false;
      el.classList.toggle("on", Boolean(on));
      const pk = SW_POWER[key];
      const shed = Boolean(on) && pk && s.powered[pk] === false;
      el.classList.toggle("shed", Boolean(shed));
      swSt.get(el).textContent = shed ? "NO PWR" : SW_LABEL[key](Boolean(on));
    }
    /* the cutter switch, painted from the MODE rather than a boolean */
    {
      const b = $("sw-cut");
      if (b) {
        const mode = sim.ship?.miningMode ?? "off";
        const on = mode !== "off";
        b.classList.toggle("on", on);
        const st = b.querySelector(".st");
        const label = mode === "overdrive" ? "O/DRIVE" : on ? "CUTTING" : "OFF";
        if (st && st.textContent !== label) st.textContent = label;
        b.title = on ? "Stow the mining laser" : "Run the mining laser on the nearest rock";
      }
    }
    const tm = TURRET_MODES.find((m) => m.id === s.turretMode);
    $("mode-turret-st").textContent = tm?.label ?? "OFF";
    $("mode-turret").classList.toggle("hot", ["ffa", "enemies", "allies", "neutral"].includes(s.turretMode));
    $("mode-turret").classList.toggle("cold", s.turretMode === "off" || s.turretMode === "passive");
    /* pointer lock */
    const lb = $("lockbar");
    lb.className = `lockbar ${s.locked ? "locked" : s.lockName ? "acquiring" : "idle"}`;
    $("lock-fill").style.width = `${Math.round(s.lockProgress * 100)}%`;
    $("lock-text").textContent = s.locked
      ? `LOCK · ${s.lockName} · ${fmtDist(s.lockDist)}${s.holding ? " · HOLDING" : ""}`
      : s.lockName
        ? `ACQ ${Math.round(s.lockProgress * 100)}% · ${s.lockName}`
        : "NO LOCK · P-LOCK to acquire";

    /* ops readouts */
    $("op-pulse-st").textContent = s.pulse ? `${Math.ceil(s.pulseLeft)}s` : s.charge < 140 ? "LOW" : "READY";
    $("op-pulse").classList.toggle("on", s.pulse);
    $("op-time-st").textContent = `${s.timeScale}×`;
    const port = s.port;
    $("op-dock-st").textContent = s.dockedAt
      ? "UNDOCK"
      : s.tractor
        ? s.tractor.phase === "push" ? "DEPART" : "ABORT"
      : port
        ? port.ok
          ? "READY"
          : `${Math.round(port.dist / 100)}km`
        : "—";
    $("op-dock").classList.toggle("on", Boolean(s.dockedAt));
    $("op-claim-st").textContent = port && port.hostile ? (port.guards > 0 ? `${port.guards} GUNS` : "READY") : "—";
    $("op-claim").classList.toggle("hot", Boolean(port && port.hostile && port.guards > 0));
    $("op-time").classList.toggle("hot", s.timeScale > 1);
    const th = s.threat;
    $("op-threat-st").textContent = !s.sentry
      ? "OFF"
      : th
        ? th.target
          ? `${th.target.body} ${Math.round(th.target.t)}s`
          : `${Math.round(th.dist / 100)} km`
        : "CLEAR";
    $("op-threat").classList.toggle("hot", Boolean(th && th.target));

    const mm = MINING_MODES.find((m) => m.id === s.miningMode);
    $("mode-mining-st").textContent = s.miningActive ? `CUT ${Math.round(s.miningProgress * 100)}%` : (mm?.label ?? "OFF");
    $("mode-mining").classList.toggle("hot", s.miningMode === "overdrive");
    $("mode-mining").classList.toggle("cold", s.miningMode === "off");

    /* world labels + flight markers */
    /* Two optional extras on a label, both presentational:
     *   a    an off-screen marker's bearing, handed to CSS as a custom
     *        property so the arrow rotates without the painter needing to
     *        know what an arrow looks like
     *   tag  the kind bracket — P player, N crewed NPC, D drone, R robot —
     *        as its own element so it can carry its own size and colour
     *        without the label text inheriting either */
    $("labels").innerHTML = s.labels
      .map((l) => {
        const a = Number.isFinite(l.a) ? `;--a:${Number(l.a).toFixed(1)}deg` : "";
        const tag = l.tag ? `<i class="tag t${esc(l.tag)}">[${esc(l.tag)}]</i>` : "";
        return `<span class="${esc(l.kind)}" style="left:${Number(l.x)}%;top:${Number(l.y)}%${a}">${tag}${esc(l.name)}</span>`;
      })
      .join("");
    paintMarkers(markerBox);
    $("heat-wash").style.opacity = String(Math.min(0.85, s.heat));

    if (s.toast) {
      $("toast").textContent = s.toast;
      $("toast").classList.remove("hidden");
    } else {
      $("toast").classList.add("hidden");
    }
    paintMap(s);
    paintConsole(s);
  };

  store.subscribe(paint);
  paint();

  /* the channel overlay lives on the HUD and ticks itself off sim time */
  mountComms();
  wireCommsTest();
  mountInterior();
  wireCaptainTest();
  wireIcework();
  wireAtmoWorks();
  wireAutopilot();
  wireCompany();
  wireFamily();
  wireContracts();
  wireNpcChat();
  wireFleet();
}
