/* LIVING GALAXY — the CONSOLE shell.
 *
 * One sheet for everything that is not a thumb control: six panels (SHIP ·
 * NAV · CREW · WORK · MARKET · CORP), each with its own sub-tabs, a global
 * jump box that searches every panel and the static leaves that never
 * belonged to one, and a recents row for the six things you actually touch.
 *
 * The lifecycle is the old terminal's: a panel builds its DOM once per
 * open/tab change and pushes refresher closures; `paintConsole(state)` runs
 * them every HUD frame while open, so live values tick without tearing the
 * tree out from under a slider you are dragging. `sim.terminalOpen` stays the
 * flag (the sim suppresses stick/RCS while it is up; HOLD still brakes).
 *
 * No DOM at import: `mountConsole()` is the only DOM entry.
 * NOTE: the exported `console` shadows the global inside this module — use
 * `globalThis.console` for logging here.
 */

import * as kit from "./kit.js";
import { fmtDist } from "./kit.js";
import { query, registerJump, runHit, jumps } from "./search.js";
import shipPanel from "./panels/ship.js";
import navPanel from "./panels/nav.js";
import crewPanel from "./panels/crew.js";
import workPanel from "./panels/work.js";
import marketPanel from "./panels/market.js";
import corpPanel from "./panels/corp.js";
import { setTermHold, setTerminal, sim } from "../sim.js";
import { UI } from "../audio.js";
import { currentSystem } from "../bodies.js";
import { useGameStore } from "../store.js";
import { gnn } from "../gnn.js";
import { droneOps } from "../drones/ops.js";
import { openMapDirectory } from "../map.js";
import { toggleInterior } from "../interior/interior.js";
import { startTutorial } from "../tutorial.js";

/* one warning per panel, not one per repaint */
const statusFaults = new Set();

const DOC = globalThis.document ?? null;
const $ = (id) => DOC?.getElementById(id) ?? null;

export const RECENTS_KEY = "lgaa.con.recents.v1";
const PANEL_ORDER = [shipPanel, navPanel, crewPanel, workPanel, marketPanel, corpPanel];

/** Shell state. `panels` is id → panel record in registration order. */
export const console = { open: false, panel: "ship", sub: {}, recents: [], panels: new Map(), focus: null, query: "" };

/* ---- registry ------------------------------------------------------------ */

/**
 * registerPanel({ id, title, order = 0, subtabs = [],   // [{ id, label, when?: () => bool }]
 *   mount(root, ctx), paint(state, ctx), unmount?(ctx), search?() })
 * search() → [{ label, hint, sub, run?, keywords?, focus? }]
 * ctx = { sub, setSub(id), push(fn), focus, kit, openConsole, state }
 */
export function registerPanel(panel) {
  if (!panel || !panel.id) return null;
  const rec = { order: 0, subtabs: [], mount() {}, paint() {}, unmount() {}, search() { return []; }, ...panel };
  console.panels.set(rec.id, rec);
  return rec;
}

function panelOf(id) {
  return console.panels.get(id) ?? null;
}

/** The sub-tabs a panel shows right now (`when()` hides e.g. the PORT desk undocked). */
function liveSubs(p) {
  return (p?.subtabs ?? []).filter((s) => { try { return s.when ? Boolean(s.when()) : true; } catch { return true; } });
}

function subOf(p) {
  const subs = liveSubs(p);
  if (!subs.length) return null;
  const want = console.sub[p.id];
  return subs.some((s) => s.id === want) ? want : subs[0].id;
}

/* ---- open / close -------------------------------------------------------- */

/** Sets sim.terminalOpen via setTerminal(true); the paint loop builds the DOM. */
export function openConsole(panelId = null, subId = null, opts = { focus: null }) {
  /* Three different sounds, because these are three different events: the
   * console coming up, a panel changing under an open console, and a sub-tab
   * inside one. Playing the same cue for all three is how a UI ends up
   * sounding like one repeated tone. */
  const wasOpen = console.open;
  const wasPanel = console.panel;
  const wasSub = console.sub[panelId ?? console.panel];
  if (panelId && console.panels.has(panelId)) console.panel = panelId;
  if (panelId && subId) console.sub[panelId] = subId;
  if (!wasOpen) UI.panel();
  else if (console.panel !== wasPanel) UI.press();
  else if (subId && subId !== wasSub) UI.tab();
  console.focus = opts?.focus ?? null;
  console.open = true;
  shell.dirty = true;
  if (!sim.terminalOpen) setTerminal(true);
  else if (shell.mounted) build();
  return true;
}

export function closeConsole() {
  if (console.open) UI.close();
  console.open = false;
  if (sim.terminalOpen) setTerminal(false);
  return false;
}

export function toggleConsole() {
  return sim.terminalOpen ? closeConsole() : openConsole();
}

/** "work/drones#d3" → openConsole("work","drones",{focus:"d3"}) */
export function jumpTo(path) {
  if (typeof path !== "string" || !path) return false;
  const [route, focus = null] = path.split("#");
  const [panel, sub = null] = route.split("/");
  return openConsole(panel || null, sub || null, { focus });
}

/* ---- recents ------------------------------------------------------------- */

function loadRecents() {
  try { console.recents = JSON.parse(globalThis.localStorage?.getItem(RECENTS_KEY) || "[]").slice(0, 6); } catch { console.recents = []; }
}
function saveRecents() {
  try { globalThis.localStorage?.setItem(RECENTS_KEY, JSON.stringify(console.recents.slice(0, 6))); } catch { /* fine */ }
}
/** Remember a jump: `{ path, label }`, path is "panel/sub#focus" or "@jumpId" for run-only leaves. */
export function noteRecent(path, label) {
  if (!path) return;
  console.recents = [{ path, label }, ...console.recents.filter((r) => r.path !== path)].slice(0, 6);
  saveRecents();
  paintRecents();
}

/* ---- the sheet ----------------------------------------------------------- */

const shell = { mounted: false, dirty: false, refreshers: [], built: null, ctx: null, open: false };

function makeCtx(p) {
  const sub = subOf(p);
  return {
    sub,
    setSub(id) { console.sub[p.id] = id; build(); },
    push(fn) { shell.refreshers.push(fn); },
    focus: console.focus,
    kit,
    openConsole,
    state: useGameStore.getState(),
  };
}

function paintTabs() {
  const tabs = $("con-tabs");
  if (!tabs) return;
  for (const b of tabs.querySelectorAll("button[data-panel]")) {
    const on = b.dataset.panel === console.panel;
    b.classList.toggle("on", on);
    if (on) b.scrollIntoView?.({ inline: "center", block: "nearest" });
  }
  const p = panelOf(console.panel);
  const strip = $("con-subtabs");
  const subs = liveSubs(p);
  strip.innerHTML = "";
  strip.hidden = !subs.length;
  const cur = subOf(p);
  for (const s of subs) {
    const b = kit.el("button", `con-sub${s.id === cur ? " on" : ""}`, s.label);
    b.type = "button";
    b.dataset.sub = s.id;
    b.addEventListener("click", () => { console.sub[p.id] = s.id; console.focus = null; build(); b.scrollIntoView?.({ inline: "center", block: "nearest", behavior: "smooth" }); });
    strip.append(b);
  }
  $("con-title").textContent = p ? p.title : "CONSOLE";
}

/** Tear down and rebuild the body for the current panel/sub. */
function build() {
  const body = $("con-body");
  if (!body) return;
  if (shell.built && shell.ctx) { try { shell.built.unmount?.(shell.ctx); } catch (e) { globalThis.console.warn("console unmount", e); } }
  shell.refreshers = [];
  body.innerHTML = "";
  body.scrollTop = 0;
  const p = panelOf(console.panel) ?? PANEL_ORDER[0];
  console.panel = p.id;
  paintTabs();
  const ctx = makeCtx(p);
  shell.ctx = ctx;
  shell.built = p;
  try { p.mount(body, ctx); } catch (e) { globalThis.console.error(`console panel ${p.id}`, e); body.append(kit.el("div", "tempty", "This panel failed to build — see the browser console.")); }
  runRefreshers();
  shell.dirty = false;
  if (console.focus) {
    const node = body.querySelector(`[data-focus="${CSS.escape(String(console.focus))}"]`);
    if (node) { node.classList.add("focus"); node.scrollIntoView?.({ block: "center" }); }
  }
}

/**
 * Run the open panel's refreshers, and let none of them out.
 *
 * The console paints from the HUD paint, which the ENGINE calls inside its
 * frame tick (sim.publishHud → store → hud paint). So a refresher that threw
 * took the whole tick with it, every frame, before the renderer ran: the canopy
 * froze solid and nothing short of a reload brought it back. A panel that
 * cannot draw a line is a panel with a stale line, not a dead game — it is
 * dropped from the list and logged once.
 */
function runRefreshers() {
  const fs = shell.refreshers;
  for (let i = 0; i < fs.length; i++) {
    try { fs[i](); } catch (e) {
      fs.splice(i, 1);
      i--;
      globalThis.console.error(`console ${console.panel}: a refresher threw and was dropped`, e);
    }
  }
}

function paintRecents() {
  const rec = $("con-recents");
  if (!rec) return;
  rec.innerHTML = "";
  for (const r of console.recents) {
    const chip = kit.el("button", "cmd-chip", r.label);
    chip.type = "button";
    chip.addEventListener("click", () => {
      if (r.path.startsWith("@")) { const j = jumps.get(r.path.slice(1)); if (j) runHit(j); }
      else jumpTo(r.path);
    });
    rec.append(chip);
  }
  $("con-foot").hidden = !console.recents.length;
}

function paintHits() {
  const hits = $("con-hits");
  const body = $("con-body");
  const q = console.query.trim();
  const show = q.length > 0;
  hits.hidden = !show;
  body.hidden = show;
  $("con-tabs").hidden = show;
  $("con-subtabs").hidden = show || $("con-subtabs").childElementCount === 0;
  if (!show) return;
  hits.innerHTML = "";
  const list = query(q);
  if (!list.length) hits.append(kit.el("div", "cmd-empty", "Nothing by that name."));
  for (const h of list) {
    const b = kit.el("button", "cmd-row leaf");
    b.type = "button";
    const sig = kit.el("span", "cmd-sig", "·");
    const main = kit.el("span", "cmd-main");
    main.append(kit.el("span", "cmd-label", h.label), kit.el("span", "cmd-hint", h.hint || ""));
    const st = kit.el("span", "cmd-st", "");
    /* A panel's status() is arbitrary application code, and swallowing every
     * error class from it means a panel that throws renders as a blank cell
     * forever — indistinguishable from one that legitimately has no status.
     * Show that it broke, and say once in the log which one. */
    try {
      st.textContent = h.status?.() ?? "";
    } catch (err) {
      st.textContent = "!";
      st.title = `status failed: ${err?.message ?? err}`;
      if (!statusFaults.has(h.label)) {
        statusFaults.add(h.label);
        console.warn(`[console] status() threw for "${h.label}":`, err);
      }
    }
    b.classList.toggle("set", /●/.test(st.textContent) || st.textContent === "ON");
    b.append(sig, main, st, kit.el("span", "cmd-chev", "›"));
    b.addEventListener("click", () => act(h));
    hits.append(b);
  }
}

function act(h) {
  const q = $("con-q");
  if (q) q.value = "";
  console.query = "";
  runHit(h);
  if (sim.terminalOpen) { paintHits(); if (h.path) build(); }
}

/* ---- static jumps: the leaves that never belonged to a panel -------------- */

const click = (id) => () => DOC?.getElementById(id)?.click();
const stText = (id, dflt = "—") => () => DOC?.getElementById(id)?.textContent ?? dflt;
const onOff = (b) => (b ? "ON" : "OFF");
const S = () => useGameStore.getState();

function registerStaticJumps() {
  const J = (spec) => registerJump(spec);
  J({ id: "map", label: "System map", hint: "chart, warp nodes, marks", keywords: "chart", run: () => S().setMapOpen(true), close: true });
  for (const [f, label] of [["ports", "Ports"], ["agricultural", "Agricultural ports"], ["civilian", "Civilian ports"], ["industrial", "Industrial ports"], ["logistic", "Logistics ports"], ["military", "Military ports"], ["pirate", "Free ports"], ["worlds", "Worlds"], ["traffic", "Ships flying"], ["marked", "Marked"]]) {
    J({ id: `dir-${f}`, label: `Directory: ${label}`, hint: "nearest first, on the chart", keywords: "directory list", run: () => openMapDirectory(f), close: true });
  }
  J({ id: "deck", label: "Deck plan", hint: "walk your hull, talk to the crew", keywords: "interior walk", status: stText("aux-deck-st"), run: () => toggleInterior(), close: true });
  J({ id: "hail", label: "Hail", hint: "call the nearest port or ship", keywords: "comms call", status: stText("aux-hail-st"), run: click("aux-hail"), close: true });
  J({ id: "listen", label: "Listen — open channels", hint: "hear the band", keywords: "comms radio", status: stText("aux-listen-st"), run: click("aux-listen") });
  J({ id: "chan", label: "Comms channel", hint: "local / band / sys", keywords: "comms", status: stText("aux-comms-st"), run: click("aux-comms") });
  J({ id: "cam", label: "Camera", hint: "seat or external", keywords: "view fpv", status: () => (sim.cameraMode ? "EXTERNAL" : "SEAT"), run: click("btn-cam") });
  J({ id: "time", label: "Time scale", hint: "1× · 4× · 40×", keywords: "speed clock", status: () => `${S().timeScale}×`, run: click("op-time") });
  J({ id: "pause", label: "Pause", hint: "the sky keeps turning", run: click("btn-pause"), close: true });
  J({ id: "tutor", label: "Run tutorial", hint: "the walkthrough from the top", keywords: "help", run: () => startTutorial(true), close: true });
  J({ id: "mute", label: "Mute", hint: "audio", keywords: "sound audio", status: () => onOff(S().muted), run: click("btn-mute") });
  J({ id: "lanes", label: "Lane rigs on the canopy", hint: "draw the ports' entry/exit ways — port control flies them for you", keywords: "lanes canopy", status: () => onOff(sim.ui?.lanesDrawn), run: () => { sim.ui.lanesDrawn = !sim.ui.lanesDrawn; sim.notice = sim.ui.lanesDrawn ? "Lane rigs drawn. Lane discipline is back on — wrong-way runs cost standing." : "Lane rigs hidden. DOCK hands the helm to port control; HAIL asks for a berth."; sim.noticeAt = sim.wall; } });
  J({ id: "plock", label: "Signature lock", hint: "pointer lock on the reticle", keywords: "lock target", status: () => (S().locked ? `● ${S().lockName}` : S().lockName ? `… ${S().lockName}` : "NO LOCK"), run: click("btn-plock") });
  J({ id: "level", label: "Level trim", hint: "square the nose to the plane", keywords: "flight attitude", status: () => "TRIM", run: click("op-level") });
  J({ id: "pulse", label: "Sensor pulse", hint: "one sweep of the sky", keywords: "scan sensors", status: stText("op-pulse-st", "READY"), run: click("op-pulse") });
  J({ id: "scan", label: "Survey scan", hint: "log the locked world", keywords: "survey", status: () => `${S().scanned.length}/${S().surveyTotal}`, run: click("btn-survey") });
  J({ id: "dock", label: "Dock / undock", hint: "inside the ring, under 12 u/s", keywords: "port clamps", status: stText("op-dock-st"), run: click("op-dock") });
  J({ id: "claim", label: "Claim port", hint: "a hostile port with its guns down", keywords: "capture", status: stText("op-claim-st"), run: click("op-claim") });
  J({ id: "atmo", label: "Atmo works", hint: "heat or cool the world you orbit", keywords: "atmosphere terraform", status: stText("aux-atmo-st"), run: click("aux-atmo") });
  for (const [t, label] of [["market", "Market"], ["shipyard", "Shipyard"], ["crew", "Hiring hall"], ["board", "Board"], ["works", "Works"], ["drones", "Drone lines"], ["robots", "Robots"], ["refit", "Refit"], ["blueprint", "Blueprint"], ["log", "Port log"]]) {
    J({ id: `port-${t}`, label: `Port: ${label}`, hint: "the station deck, when docked", keywords: "station deck docked", status: () => (sim.ship?.dockedAt ? "DOCKED" : "NOT DOCKED"),
      run: () => { if (!sim.ship?.dockedAt) { sim.notice = "Dock first — the port deck opens on the clamps."; return; } $("sd-reopen")?.click(); DOC?.querySelector(`#sd-tabs button[data-sd="${t}"]`)?.click(); }, close: true });
  }
}

/* ---- mount --------------------------------------------------------------- */

/** Returns paintConsole(state) for hud.js. */
export function mountConsole() {
  if (!console.panels.size) for (const p of PANEL_ORDER) registerPanel(p);
  if (!jumps.size) registerStaticJumps();
  /* hooks from chat links and drone prompts open the console where they point */
  gnn.open = (id) => openConsole("corp", "gnn", { focus: id });
  droneOps.openDrone = (id) => openConsole("work", "drones", { focus: id });
  droneOps.onBuilt = (u) => { if (sim.ship.dockedAt && sim.ship.dockedAt === u.home) openConsole("work", "drones", { focus: u.id }); };
  if (globalThis.window?.__lg) window.__lg.console = { console, openConsole, closeConsole, toggleConsole, jumpTo, query, registerJump };

  const root = $("console");
  if (!root) return function paintConsole() {};
  loadRecents();
  const holdBtn = $("con-hold");
  const qEl = $("con-q");
  $("con-tabs").querySelectorAll("button[data-panel]").forEach((b) => {
    b.addEventListener("click", () => { console.panel = b.dataset.panel; console.focus = null; build(); });
  });
  $("con-close").addEventListener("click", () => closeConsole());
  holdBtn.addEventListener("click", () => setTermHold(!sim.termHold));
  qEl.addEventListener("input", () => { console.query = qEl.value; paintHits(); });
  qEl.addEventListener("keydown", (e) => {
    if (e.key === "Enter") { const first = query(console.query.trim())[0]; if (first) act(first); }
    if (e.key === "Escape") { qEl.value = ""; console.query = ""; paintHits(); }
  });
  /* Taps inside the console must never reach the canvas look-drag. */
  root.addEventListener("pointerdown", (e) => e.stopPropagation());
  shell.mounted = true;

  return function paintConsole(state) {
    /* Panels capture the live ship object, so never survive a relaunch. */
    const want = state.terminalOpen && state.phase === "play";
    if (want !== shell.open) {
      shell.open = want;
      console.open = want;
      root.classList.toggle("hidden", !want);
      if (want) { qEl.value = ""; console.query = ""; paintHits(); paintRecents(); build(); }
      else { console.focus = null; }
    }
    if (!want) return;
    if (shell.dirty) build();
    $("con-sub").textContent = `${sim.callsign || "Pilot"} · ${currentSystem.name}${state.isPublic ? "" : ` · ${state.room ?? ""}`}`;
    $("t-vel").textContent = state.speed.toFixed(state.speed < 100 ? 1 : 0);
    $("t-alt").textContent = state.dominantName ? fmtDist(state.altitude) : "—";
    $("t-pwr").textContent = `${Math.round(state.chargePct * 100)}%`;
    $("t-hull").textContent = `${Math.round(state.hull)}`;
    holdBtn.classList.toggle("on", sim.termHold);
    holdBtn.textContent = sim.termHold ? "HOLDING" : "HOLD";
    if (console.query) return;
    runRefreshers();
    try { shell.built?.paint?.(state, shell.ctx); } catch (e) { globalThis.console.warn("console paint", e); }
  };
}
