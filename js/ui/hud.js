import { PUBLIC_ROOM, bodyById } from "../world/bodies.js";
import { clockAt } from "../station/stationclock.js";
import { BUILD_LINE } from "../version.js";
import { describeSystem, generateSystem } from "../world/generate.js";
import { touch } from "../core/input.js";
import { autoLevel, cycleMiningMode, cycleTimeScale, cycleTurretMode, launchSim, loadSky, requestJump, requestScan, resumePlay, claimPort, sensorPulse, toggleDock, togglePointerLock, returnToMenu, dismissNotice, setThrottle, setMiningMode, sim, toggleSystem } from "../sim/sim.js";
import { mountConsole, toggleConsole } from "../console/console.js";
import { mountStationDeck } from "../station/stationdeck.js";
import { mountSecBadge } from "./secbadge.js";
import { mountDockBoot } from "./dockboot.js";
import { mountFullscreen } from "./fullscreen.js";
import { wireRecorder, settle as settleTape, record as tapeRecord, recorder } from "../flight/recorder.js";
import { mission, missionHooks } from "../mission/run.js";
import { contacts as turretContacts } from "../flight/turrets.js";
import { stations } from "../station/stations.js";
import { hullMaxOf } from "../flight/repair.js";
import { ariaHasConn, ariaTakeConn, ariaRelease } from "../aria/aria.js";
import { ariaPilot } from "../aria/pilot.js";
import { mountMap } from "./map.js";
import { mountCreation } from "./creation.js";
import { account, flyPilot, newPilotSlot, deletePilot, eraseGuest, MAX_PILOTS } from "../net/account.js";
import { mountHangar } from "./hangar.js";
import { MINING_MODES, THROTTLE_MAX, THROTTLE_MIN, TURRET_MODES, cargoTotal } from "../flight/ship.js";
import { setAudioMuted, unlockAudio, UI, busLevels, setBusLevel, resetMix, BUSES } from "../audio/index.js";
import { loadSave, randomCallsign, skyProgress, useGameStore } from "../core/store.js";
import { loadPilot, restorePilot } from "../flight/pilot.js";
import { mountComms, wireCommsTest } from "../comms/comms.js";
import { connectNet, disconnectNet, primeSol } from "../net/net.js";
import { mountInterior } from "../interior/interior.js";
import { captain, wireCaptainTest } from "../npc/captain.js";
import { connectCradle, disconnectCradle } from "../npc/cradle.js";
import { connectGdb, disconnectGdb } from "../corp/gdb.js";
import { wireIcework } from "../economy/icework.js";
import { wireAtmoWorks } from "../world/events/atmoworks.js";
import { wireAutopilot, nearestSeam, busOverload, autopilot as ap } from "../flight/autopilot.js";
import { wireCompany } from "../corp/company.js";
import { wireFamily } from "../crew/family.js";
import { wireContracts } from "../economy/contracts.js";
import { wireNpcChat } from "../npc/chat.js";
import { renderHold } from "./holdview.js";
import { wireFleet } from "../corp/fleet.js";
import { startTutorial } from "./tutorial.js";
import { applySolPrime, mountWorldSync, resetWorldSync } from "../net/worldsync.js";
import { mountChatbox } from "./chatbox.js";

const THR_SPAN = THROTTLE_MAX - THROTTLE_MIN;
const NOTICE_LIFE = 7.5;
const THR_ZERO = (THROTTLE_MAX - 0) / THR_SPAN;

function readOrient() {
  const w = window.visualViewport?.width ?? window.innerWidth;
  const h = window.visualViewport?.height ?? window.innerHeight;
  return h >= w ? "portrait" : "landscape";
}

function measureDock() {
  const doc = globalThis.document;
  const tools = doc?.querySelector(".hud-tools");
  if (!tools) return 0;
  const h = Math.round(tools.getBoundingClientRect().height);
  if (h > 0) doc.documentElement.style.setProperty("--g-dock", `${h}px`);
  return h;
}

const RAIL_GAP = 8;
const PUCK_H = 64, PUCK_W = 64;
const ANSWER_GAP = 72;
const ANSWER_W = 2 * 58 + 8;

const PUCK_AVOID = "#hud button, #hud .sw, #hud .rcs-btn, #hud input, #hud select, #hud [role=\"button\"]";

function boxesToAvoid(doc) {
  const out = [];
  for (const el of doc.querySelectorAll(PUCK_AVOID)) {
    if (el.closest(".cx")) continue;
    if (el.classList.contains("hidden") || el.offsetParent === null) continue;
    const r = el.getBoundingClientRect();
    if (r.width > 2 && r.height > 2) out.push(r);
  }
  return out;
}

const hits = (a, boxes, pad = 4) => boxes.some((b) =>
  a.left < b.right + pad && a.right > b.left - pad && a.top < b.bottom + pad && a.bottom > b.top - pad);

function overlapArea(a, boxes, pad = 4) {
  let total = 0;
  for (const b of boxes) {
    const w = Math.min(a.right, b.right + pad) - Math.max(a.left, b.left - pad);
    const h = Math.min(a.bottom, b.bottom + pad) - Math.max(a.top, b.top - pad);
    if (w > 0 && h > 0) total += w * h;
  }
  return total;
}

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

  const slot = (right, top) => {
    const px0 = vw - right - PUCK_W, px1 = vw - right;
    const puck = { left: px0, right: px1, top, bottom: top + PUCK_H };
    let aRight = right + ANSWER_GAP;
    let a0 = vw - aRight - ANSWER_W, a1 = vw - aRight;
    if (a0 < 4) {
      aRight = right - ANSWER_GAP - ANSWER_W;
      a0 = vw - aRight - ANSWER_W; a1 = vw - aRight;
      if (a1 > vw - 4) return null;
    }
    const answer = { left: a0, right: a1, top, bottom: top + PUCK_H };
    return { puck, answer, top, bottom: top + PUCK_H, right_: right, answerRight: aRight };
  };
  const cands = [];
  if (sr && sr.height > 0) {
    cands.push(slot(padR, Math.round(sr.bottom) + RAIL_GAP));
  }
  const colLeft = vw - padR - PUCK_W - 8;
  const column = boxes.filter((b) => b.right > colLeft).sort((a, b) => a.top - b.top);
  let edge = 4;
  for (const b of column) {
    const gap = b.top - edge;
    if (gap >= PUCK_H + 4) cands.push(slot(padR, Math.round(edge + (gap - PUCK_H) / 2)));
    edge = Math.max(edge, b.bottom);
  }
  if (vh - edge >= PUCK_H + 4) cands.push(slot(padR, Math.round(edge + (vh - edge - PUCK_H) / 2)));
  for (const f of [0.30, 0.38, 0.46, 0.22, 0.54, 0.62, 0.14]) {
    cands.push(slot(padR, Math.round(vh * f)));
  }
  if (vw > vh) {
    for (const f of [0.34, 0.46, 0.22, 0.58]) {
      cands.push(slot(vw - padL - PUCK_W, Math.round(vh * f)));
    }
  }

  let best = null;
  const floor = vw <= vh && sr && sr.height > 0 ? Math.round(sr.bottom) : 4;
  for (const c of cands) {
    if (!c) continue;
    if (c.top < Math.max(4, floor) || c.bottom > vh - 4) continue;
    if (c.puck.left < 4 || c.puck.right > vw - 4) continue;
    if (c.answer.left < 0 || c.answer.right > vw) continue;
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
  root.style.removeProperty("--g-rail-top");
  root.style.removeProperty("--g-rail-right");
  root.style.removeProperty("--g-answer-right");
  return sr ? sr.height : 0;
}

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
    if (y == null) { y = el.getBoundingClientRect().top; }
    else el.style.setProperty("top", `${Math.round(y)}px`, "important");
    const shown = !el.classList.contains("hidden") && el.offsetParent !== null && getComputedStyle(el).display !== "none";
    const h = shown ? el.getBoundingClientRect().height : 0;
    if (h > 1) y += h + STACK_GAP;
  }
  stackRightColumn(doc);
}

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
  if (typeof ResizeObserver !== "undefined") {
    const ro = new ResizeObserver(() => measure());
    for (const sel of [".hud-tools", ".sys-strip"]) { const el = document.querySelector(sel); if (el) ro.observe(el); }
  }
  document.fonts?.ready?.then(measure).catch(() => {});
  for (const ms of [250, 1000, 2500, 6000]) setTimeout(measure, ms);
  return go;
}

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

function esc(s) {
  return String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
}

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
    try { el.setPointerCapture(e.pointerId); } catch {}
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

function bindThrottle(track, fill, thumb) {
  let pid = null;
  const set = (clientY) => {
    const r = track.getBoundingClientRect();
    const frac = Math.max(0, Math.min(1, (clientY - r.top) / r.height));
    let v = THROTTLE_MAX - frac * THR_SPAN;
    v = Math.round(v * 100) / 100;
    if (Math.abs(v) < 0.045) v = 0;
    if (Math.abs(v - 1) < 0.035) v = 1;
    setThrottle(v);
  };
  track.addEventListener("pointerdown", (e) => {
    pid = e.pointerId;
    try { track.setPointerCapture(e.pointerId); } catch {}
    set(e.clientY);
  });
  track.addEventListener("pointermove", (e) => {
    if (pid !== e.pointerId) return;
    set(e.clientY);
  });
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
    const frac = (THROTTLE_MAX - t) / THR_SPAN;
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
  } catch {}
  let hz = 0;
  for (const c of turretContacts) {
    if (c.hp > 0 && c.relation === "hostile" && Math.hypot(c.x - p.x, c.y - p.y, c.z - p.z) < 6000) hz++;
  }
  let bus = 0;
  try { const b = busOverload(ship); bus = b.demand && b.cap ? b.demand / b.cap : 0; } catch {}
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
  wireRecorder({
    sample: sampleWorld,
    who: () => (captain.holder === "aria" ? "aria" : captain.holder !== "player" ? "auto" : sim.handsOff ? "auto" : "player"),
  });
  missionHooks.onStep = (st, ix) => tapeRecord("mission", st.op, st.target?.name ?? st.target?.kind ?? null, { step: ix + 1, of: mission.active?.steps.length ?? 0, m: mission.active?.mode ?? "manual" });
  missionHooks.onEnd = (m, why, state) => tapeRecord("mission", "end", m?.name ?? null, { why: String(why).slice(0, 40), state });
  const store = useGameStore;
  const saved = store.getState();
  const startCall = (typeof localStorage !== "undefined" && store.getState().callsign) || randomCallsign();
  store.setState({ callsign: saved.callsign && saved.callsign !== "Pilot" ? saved.callsign : startCall });

  const params = new URLSearchParams(location.search);
  const initialRoom = params.get("room") || "";

  let seedKey = initialRoom && initialRoom !== PUBLIC_ROOM ? sanitizeRoom(initialRoom) : PUBLIC_ROOM;
  if (!initialRoom) {
    const sv0 = loadSave();
    if (sv0.lastSky && sv0.callsign && loadPilot()) seedKey = sv0.lastSky === PUBLIC_ROOM ? PUBLIC_ROOM : sanitizeRoom(sv0.lastSky);
  }

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
  let solPrime = null;
  const askSol = () => {
    if (solPrime && performance.now() - solPrime.asked < 20000) return solPrime.p;
    solPrime = { asked: performance.now(), p: primeSol() };
    return solPrime.p;
  };
  const queueSky = () => {
    if (seedKey === PUBLIC_ROOM) askSol();
    refreshPreview();
    clearTimeout(previewTimer);
    previewTimer = window.setTimeout(() => loadSky(seedKey), seedKey === PUBLIC_ROOM ? 40 : 240);
  };

  let launching = false;
  const go = async (seed) => {
    if (launching) return;
    launching = true;
    unlockAudio();
    clearTimeout(previewTimer);
    seedKey = seed;
    let prime = null;
    try { if (seed === PUBLIC_ROOM) prime = await askSol(); } catch { prime = null; }
    solPrime = null;
    launching = false;
    store.getState().setRoom(seed, seed === PUBLIC_ROOM);
    launchSim(store.getState().callsign.trim() || "Pilot", seed);
    startTutorial(false);
    resetWorldSync();
    mountWorldSync();
    if (prime) applySolPrime(prime);
    connectNet(seed);
    connectCradle(seed);
    connectGdb(seed);
  };

  queueSky();

  const buildEl = $("build-line");
  if (buildEl) buildEl.textContent = BUILD_LINE;

  $("callsign").addEventListener("input", (e) => store.getState().setCallsign(e.target.value));

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
    fixedSky: () => startMode === "guest" ? PUBLIC_ROOM : startMode === "hangar" ? seedKey : null,
  });
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
    if (startMode === "guest") { eraseGuest(); unlockAudio(); creation.show(); return; }
    if (loadPilot() && loadSave().callsign) {
      const name = loadSave().callsign;
      const sure = globalThis.confirm ? confirm(`Start a NEW pilot?\n\n${name}'s rank, hulls, corp, fleet, refits and purse on this device are cleared. If ${name} is synced to an account, the next sync replaces the account copy too.\n\nFly as ${name} instead to keep them.`) : true;
      if (!sure) return;
    }
    unlockAudio();
    creation.show();
  });
  let startMode = "pending";
  const hangarEl = $("hangar");
  const callLabel = $("callsign")?.closest("label");
  let hangar = null;
  const setMode = (mode) => {
    const again = startMode === mode;
    startMode = mode;
    globalThis.document?.documentElement.classList.remove("start-pending");
    if (mode === "hangar" && again && hangar) { hangar.render(); return; }
    if (callLabel) callLabel.style.display = mode === "hangar" ? "none" : "";
    if (mode === "hangar") {
      contBtn.hidden = true;
      createBtn.hidden = true;
      if (hangarEl) hangarEl.hidden = false;
      if (!seedKey || !account.pilots?.some((p) => (p.sky || "sol") === seedKey)) {
        const last = account.pilots?.[0];
        if (last?.sky && last.sky !== seedKey) { seedKey = last.sky === "public" ? PUBLIC_ROOM : last.sky; queueSky(); }
      }
      hangar = hangarEl ? mountHangar({
        root: hangarEl, account, maxPilots: MAX_PILOTS,
        system: () => seedKey,
        setSystem: (seed) => { if (seed !== seedKey) { seedKey = seed; queueSky(); } },
        rollSeed: () => makePrivateCode() + makePrivateCode().slice(0, 1),
        clean: (t) => { const s = String(t ?? "").trim(); return s ? (s.toLowerCase() === "sol" ? PUBLIC_ROOM : sanitizeRoom(s)) : ""; },
        describe: describeSeed,
        name: (seed) => generateSystem(seed).name,
        onFly: async (p, seed) => {
          if (!(await flyPilot(p.slot))) { hangar.setNote(account.error || "Could not load that pilot."); return; }
          const rec = loadPilot();
          const sv = loadSave();
          if (!rec || !sv.callsign || !restorePilot(rec)) { hangar.setNote("That pilot's record is incomplete — fly them once from the device they were made on."); return; }
          $("callsign").value = sv.callsign;
          store.getState().setCallsign(sv.callsign);
          go(seed);
        },
        onNew: (seed) => {
          if (!newPilotSlot()) { hangar.setNote(`An account keeps ${MAX_PILOTS} pilots.`); return; }
          seedKey = seed;
          unlockAudio();
          creation.show({ askName: true });
        },
        onDelete: (p) => deletePilot(p.slot),
      }) : null;
    } else if (mode === "guest") {
      if (hangarEl) hangarEl.hidden = true;
      contBtn.hidden = true;
      createBtn.hidden = false;
      createBtn.textContent = "Play as guest";
      createBtn.classList.add("btn-accent");
      createBtn.classList.remove("btn-ghost");
      if (seedKey !== PUBLIC_ROOM) { seedKey = PUBLIC_ROOM; queueSky(); }
    } else {
      if (hangarEl) hangarEl.hidden = true;
      paintStart();
    }
    if (globalThis.window?.__lgFlyQueued) {
      window.__lgFlyQueued = false;
      if (mode === "local" && contBtn && !contBtn.hidden) queueMicrotask(() => contBtn.click());
    }
  };
  const onAccount = () => setMode(!account.site ? "local" : account.user?.verified ? "hangar" : "guest");
  globalThis.document?.addEventListener("lg-account", onAccount);
  if (account.site !== null && account.status !== "probing" && account.status !== "idle") onAccount();
  setTimeout(() => { if (startMode === "pending") setMode("local"); }, 6000);
  if (globalThis.window?.__lg) window.__lg.start = { paintStart, continueRun: () => contBtn?.click(), mode: () => startMode, hangar: () => hangar };

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

  const paintThrottle = bindThrottle($("thr-track"), $("thr-fill"), $("thr-thumb"));
  paintThrottle(0);

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

  $("op-pulse").addEventListener("click", () => sensorPulse());
  $("op-level").addEventListener("click", () => autoLevel());
  $("op-time").addEventListener("click", () => cycleTimeScale());
  $("op-dock").addEventListener("click", () => toggleDock());
  $("op-claim").addEventListener("click", () => {
    const why = claimPort();
    if (why) sim.notice = `Cannot claim — ${why.toLowerCase()}.`;
  });
  $("op-threat").addEventListener("click", () => toggleSystem("sentry"));

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
  const toggleHold = () => { holdOpen = !holdOpen; if (holdOpen) paintHold(); };
  $("btn-hold").addEventListener("click", toggleHold);
  $("g-cgo-btn")?.addEventListener("click", toggleHold);
  $("hold-close").addEventListener("click", () => { holdOpen = false; });
  $("hold").addEventListener("click", (e) => { if (e.target.id === "hold") holdOpen = false; });
  $("btn-aria").addEventListener("click", () => {
    const r = ariaHasConn() ? ariaRelease() : ariaTakeConn();
    if (!r.ok) sim.notice = r.error;
    else if (!ariaHasConn()) sim.notice = "You have the conn.";
  });
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

  document.addEventListener("pointerdown", (e) => {
    const el = e.target?.closest?.("button, .btn, .tbtn, .pick, .chip");
    if (!el || el.disabled) return;
    if (el.dataset.quiet !== undefined) return;
    if (el.getAttribute("aria-pressed") !== null || el.classList.contains("sw")) UI.press();
    else UI.tap();
  }, { passive: true, capture: true });

  const paintMap = mountMap(store);

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

  let paintFailed = 0;
  const paint = (...args) => {
    try { paintAll(...args); } catch (e) {
      if (paintFailed++ < 3) globalThis.console.error("HUD paint failed (the canopy keeps drawing)", e);
    }
  };
  const paintAll = () => {
    const s = store.getState();
    const playing = s.phase !== "menu";
    if (playing) settleTape();
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

    $("i-vel").textContent = fmtNum(s.speed, s.speed < 100 ? 1 : 0);
    $("i-cls").textContent = fmtNum(s.closing, Math.abs(s.closing) < 100 ? 1 : 0);
    $("i-alt").textContent = s.dominantName ? fmtDist(s.altitude) : "—";

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

    setGauge($("g-pwr"), $("g-pwr-n"), s.chargePct, `${Math.round(s.chargePct * 100)}%`, s.chargePct < 0.18);
    const hMax = Math.max(1, s.hullMax ?? 100);
    const sMax = Math.max(1, s.shieldMax ?? 100);
    setGauge($("g-hull"), $("g-hull-n"), s.hull / hMax, `${Math.round(s.hull)}`, s.hull < hMax * 0.35);
    setGauge($("g-shld"), $("g-shld-n"), s.shieldCharge / sMax, `${Math.round(s.shieldCharge)}`, s.shieldCharge < sMax * 0.25);
    setGauge($("g-o2"), $("g-o2-n"), s.o2 / 100, `${Math.round(s.o2)}`, s.o2 < 30);
    setGauge($("g-cgo"), $("g-cgo-n"), s.cargo / s.cargoCap, `${Math.round(s.cargo)}`, false);
    if (holdOpen && sim.time - holdPaintedAt > 0.4) paintHold();

    const alarms = [...s.debuffs];
    if (s.heat > 0.35) alarms.unshift("HULL TEMPERATURE");
    const ah = alarms.slice(0, 4).map((t) => `<span>${esc(t)}</span>`).join("");
    if (ah !== alarmsHtml) {
      alarmsHtml = ah;
      $("alarms").innerHTML = ah;
    }

    stackLeftColumn();

    const about = s.noticeAbout && s.noticeAbout.text === s.notice ? s.noticeAbout.name : null;
    const named = [sel?.name, s.reticleName, near?.name].find((n) => n && s.notice?.includes(n));
    $("lock-name").textContent = about ?? named ?? (s.noticeTag || "SHIP");
    $("notice").textContent = s.notice;
    const stale = s.noticeAge > NOTICE_LIFE;
    noticeCard.classList.toggle("fading", stale);
    noticeCard.classList.toggle("hidden", s.noticeAge > NOTICE_LIFE + 1.2);

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

    flashEl.style.opacity = s.flash > 0.01 ? Math.min(1, s.flash) : 0;
    const gl = sim.glare;
    if (gl && gl.lum > 0.006) {
      glareEl.style.setProperty("--glare-x", `${gl.x.toFixed(1)}%`);
      glareEl.style.setProperty("--glare-y", `${gl.y.toFixed(1)}%`);
      glareEl.style.setProperty("--glare-rgb", `${(gl.hex >> 16) & 255}, ${(gl.hex >> 8) & 255}, ${gl.hex & 255}`);
      glareEl.style.opacity = Math.min(0.85, gl.lum).toFixed(3);
    } else if (glareEl.style.opacity !== "0") {
      glareEl.style.opacity = "0";
    }

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

    paintThrottle(s.throttle);
    $("thr-track").classList.toggle("capped", s.throttleCap < 1.001);
    $("thr-num").textContent = `${Math.round(s.throttle * 100)}`;
    $("thr-draw").textContent = `${Math.round(s.load)} / ${Math.round(s.reactor)} kW`;
    $("thr-draw").style.color = s.load > s.reactor ? "var(--danger)" : "var(--subtle)";

    for (const el of swEls) {
      const key = el.getAttribute("data-sys");
      const on = SW_STATE[key] ? SW_STATE[key](s) : false;
      el.classList.toggle("on", Boolean(on));
      const pk = SW_POWER[key];
      const shed = Boolean(on) && pk && s.powered[pk] === false;
      el.classList.toggle("shed", Boolean(shed));
      swSt.get(el).textContent = shed ? "NO PWR" : SW_LABEL[key](Boolean(on));
    }
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
    const lb = $("lockbar");
    lb.className = `lockbar ${s.locked ? "locked" : s.lockName ? "acquiring" : "idle"}`;
    $("lock-fill").style.width = `${Math.round(s.lockProgress * 100)}%`;
    $("lock-text").textContent = s.locked
      ? `LOCK · ${s.lockName} · ${fmtDist(s.lockDist)}${s.holding ? " · HOLDING" : ""}`
      : s.lockName
        ? `ACQ ${Math.round(s.lockProgress * 100)}% · ${s.lockName}`
        : "NO LOCK · P-LOCK to acquire";

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
