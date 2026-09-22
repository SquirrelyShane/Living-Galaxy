/* LIVING GALAXY — system chart.
 *
 * An interactive plan view of the ecliptic. Drag to pan, pinch or use the
 * buttons to zoom, tap a body to pull up its readout and act on it. Moons
 * fade in as you zoom into their parent's system, because at full-system
 * scale they would be a smear on the planet.
 *
 * The chart also draws the warp lane: the straight line the core actually
 * needs, coloured by whether anything is sitting in it.
 */

import { BEACONS, BODIES, beaconPosition, bodyById, bodyPosition, currentSystem, dist3, starBody } from "./bodies.js";
import {
  acquireLock,
  addBodyWaypoint,
  addWaypoint,
  addWaypointAt,
  removeWaypoint,
  warpNodeById,
  losBlocker,
  selectBody,
  sim,
  toggleWarp,
  warpBlock,
  warpDestination,
  waypointPosition,
} from "./sim.js";
import { VIEW } from "./audio.js";
import { forwardOf } from "./ship.js";
import { stations } from "./stations.js";
import { holes, holeRadii } from "./holes.js";
import { vesselStatus, captainLine, HOSTILE_ROLES, LAW_ROLES } from "./npc/traffic.js";
import { knownContacts } from "./contacts.js";

import { SECTORS } from "./materials.js";
import { corpOfVessel, standingLabel } from "./corps.js";
import { beltBandAt, launchProbe, probes, remoteScan } from "./probes.js";
import { autopilot, disengageAutopilot, engageAutopilot, engageAutoWarp, engageMiningLoop } from "./autopilot.js";
import { mission } from "./mission/run.js";
import { openConsole } from "./console/console.js";

const S = 320;              // svg user units, square
const PAD = 14;
const MIN_SPAN = 2500;      // closest zoom, world units across
const MAX_SPAN = 4.0e6;

const _p = { x: 0, y: 0, z: 0 };
const _q = { x: 0, y: 0, z: 0 };

function fmtDist(d) {
  const a = Math.abs(d);
  if (a < 1000) return `${Math.round(d)} u`;
  if (a < 100000) return `${(d / 100).toFixed(1)} km`;
  return `${Math.round(d / 100).toLocaleString()} km`;
}

function niceSpan(u) {
  const pow = Math.pow(10, Math.floor(Math.log10(u)));
  const n = u / pow;
  return (n >= 5 ? 5 : n >= 2 ? 2 : 1) * pow;
}

const KIND_FILL = {
  star: "#ffb56b",
  gas: "#c4a07a",
  ice: "#7eb0d0",
  terra: "#6b9ac4",
  cloud: "#d4b896",
  rocky: "#9a8f84",
  moon: "#b8b2a8",
  dwarf: "#cbb9a8",
};

/* the command deck opens the directory straight onto a filter */
let _openDir = null;
let _store = null;
export function openMapDirectory(filter = "all") {
  VIEW.map();
  _store?.getState().setMapOpen(true);
  _openDir?.(filter);
}

export function mountMap(store) {
  _store = store;
  const svg = document.getElementById("map-svg");
  const plot = document.querySelector(".chart-plot");
  const sheet = {
    empty: document.getElementById("sheet-empty"),
    body: document.getElementById("sheet-body"),
    name: document.getElementById("sheet-name"),
    sub: document.getElementById("sheet-sub"),
    tier: document.getElementById("sheet-tier"),
    stats: document.getElementById("sheet-stats"),
    lane: document.getElementById("sheet-lane"),
  };

  /* view state, in world units */
  const view = { cx: 0, cz: 0, span: 0, mode: "ship" };
  let picked = null;          // body / port / waypoint id
  let pickedVessel = null;    // a transponder on the chart
  let pickedPoint = null;     // free space: { x, y, z, title, sub }
  let fitted = false;
  let sheetKey = "";          // what the stat block was last built for — only rebuild when it changes
  let planAt = -1;            // last time the plan row was repainted (sim.wall)
  const statsHtml = (key, html) => {
    if (key === sheetKey) return;
    sheetKey = key;
    sheet.stats.innerHTML = html();
  };

  const worldToU = (x, z) => ({
    u: PAD + ((x - view.cx) / view.span + 0.5) * (S - PAD * 2),
    v: PAD + ((z - view.cz) / view.span + 0.5) * (S - PAD * 2),
  });
  const pxPerUnit = () => (S - PAD * 2) / view.span;

  /** The whole chart, Pluto to Pluto. */
  function fitSystem() {
    const maxOrbit = Math.max(...BODIES.filter((b) => !b.parent).map((b) => b.orbit), 1000);
    view.cx = 0;
    view.cz = 0;
    view.span = maxOrbit * 2.35;
    view.mode = "system";
    fitted = true;
  }

  /**
   * Your own neighbourhood. A real system is mostly empty, so the full view
   * crushes the inner worlds into one smear — this is the useful default.
   */
  function fitShip() {
    const r = Math.hypot(sim.ship.pos.x, sim.ship.pos.z);
    /* Frame the star and the ship together — where you are only means
     * something next to what you are orbiting. */
    view.cx = sim.ship.pos.x * 0.5;
    view.cz = sim.ship.pos.z * 0.5;
    view.span = Math.max(60000, r * 2.4);
    view.mode = "ship";
    fitted = true;
  }

  function centreOn(x, z, span) {
    view.cx = x;
    view.cz = z;
    if (span) view.span = Math.max(MIN_SPAN, Math.min(MAX_SPAN, span));
    view.mode = "free";
  }

  function zoom(factor, ax, az) {
    const next = Math.max(MIN_SPAN, Math.min(MAX_SPAN, view.span * factor));
    if (ax != null) {
      /* keep the anchor point under the finger */
      const k = next / view.span;
      view.cx = ax + (view.cx - ax) * k;
      view.cz = az + (view.cz - az) * k;
    }
    view.span = next;
    view.mode = "free";
  }

  /* ---- input ---- */

  const pointers = new Map();
  let dragged = 0;
  let pinchStart = 0;
  let spanStart = 0;

  const svgPoint = (e) => {
    const r = svg.getBoundingClientRect();
    const u = ((e.clientX - r.left) / r.width) * S;
    const v = ((e.clientY - r.top) / r.height) * S;
    return { u, v };
  };
  const uToWorld = (u, v) => ({
    x: view.cx + ((u - PAD) / (S - PAD * 2) - 0.5) * view.span,
    z: view.cz + ((v - PAD) / (S - PAD * 2) - 0.5) * view.span,
  });

  svg.addEventListener("pointerdown", (e) => {
    try { svg.setPointerCapture(e.pointerId); } catch { /* pointer already gone */ }
    closeMenu();
    pointers.set(e.pointerId, { ...svgPoint(e), cx: e.clientX, cy: e.clientY });
    dragged = 0;
    if (pointers.size === 2) {
      const [a, b] = [...pointers.values()];
      pinchStart = Math.hypot(a.u - b.u, a.v - b.v) || 1;
      spanStart = view.span;
    }
  });

  svg.addEventListener("pointermove", (e) => {
    if (!pointers.has(e.pointerId)) return;
    const prev = pointers.get(e.pointerId);
    const now = { ...svgPoint(e), cx: e.clientX, cy: e.clientY };
    pointers.set(e.pointerId, now);
    if (pointers.size === 2) {
      const [a, b] = [...pointers.values()];
      const d = Math.hypot(a.u - b.u, a.v - b.v) || 1;
      view.span = Math.max(MIN_SPAN, Math.min(MAX_SPAN, spanStart * (pinchStart / d)));
      view.mode = "free";
      dragged += 20;
      return;
    }
    const du = now.u - prev.u;
    const dv = now.v - prev.v;
    dragged += Math.hypot(du, dv);
    const k = view.span / (S - PAD * 2);
    view.cx -= du * k;
    view.cz -= dv * k;
    view.mode = "free";
  });

  const release = (e) => {
    if (!pointers.has(e.pointerId)) return;
    const at = pointers.get(e.pointerId);
    pointers.delete(e.pointerId);
    if (pointers.size === 0 && dragged < 6) tapAt(at.u, at.v, e.clientX, e.clientY);
  };
  svg.addEventListener("pointerup", release);
  svg.addEventListener("pointercancel", release);
  svg.addEventListener("wheel", (e) => {
    e.preventDefault();
    const at = svgPoint(e);
    const w = uToWorld(at.u, at.v);
    zoom(e.deltaY > 0 ? 1.18 : 1 / 1.18, w.x, w.z);
  }, { passive: false });

  /** What sits under a tap: the nearest world, port, saved location or transponder inside a thumb radius. */
  function hitAt(u, v) {
    let best = null;
    let bestD = 22;
    const consider = (x, z, hit, r = bestD) => {
      const s = worldToU(x, z);
      const d = Math.hypot(s.u - u, s.v - v);
      if (d < r && d < bestD) { bestD = d; best = hit; }
    };
    for (const b of BODIES) {
      if (b.parent && !moonsVisible(b)) continue;
      bodyPosition(b.id, sim.time, _p);
      consider(_p.x, _p.z, { kind: "body", id: b.id, name: b.name, x: _p.x, y: _p.y, z: _p.z });
    }
    for (const st of stations) consider(st.x, st.z, { kind: "station", id: st.id, name: st.name, x: st.x, y: st.y, z: st.z });
    for (const w of sim.waypoints) {
      waypointPosition(w, _q);
      consider(_q.x, _q.z, { kind: "waypoint", id: w.id, name: w.name, x: _q.x, y: _q.y, z: _q.z, wp: w });
    }
    /* Only what is actually drawn is tappable. Picking a hull the chart does
     * not show would hand the player a name the scanner has not earned. */
    for (const c of knownContacts()) {
      consider(c.x, c.z, { kind: "vessel", id: c.id, name: c.name, x: c.x, y: c.y, z: c.z, vessel: c.ref, contact: c }, c.kind === "boat" ? 10 : 14);
    }
    return best;
  }

  /** A tap anywhere: pick what is there (or the empty spot) and open the menu on it. */
  function tapAt(u, v, cx, cy) {
    const hit = hitAt(u, v);
    pickedVessel = null;
    pickedPoint = null;
    if (hit && (hit.kind === "body" || hit.kind === "station" || hit.kind === "waypoint")) {
      picked = hit.id;
      if (hit.kind !== "waypoint") selectBody(hit.id);
    } else if (hit) {
      picked = null;
      pickedVessel = hit.vessel;
      if (!hit.flow) acquireLock({ kind: "contact", id: hit.vessel.id });
    } else {
      picked = null;
      const w = uToWorld(u, v);
      const band = beltBandAt(w.x, w.z);
      pickedPoint = {
        x: w.x, y: 0, z: w.z,
        title: band ? (band.label === "belt" ? "BELT" : "OUTER BELT") : "OPEN SPACE",
        sub: band ? band.band : `${fmtDist(Math.hypot(w.x, w.z))} from ${starBody()?.name ?? "the star"}`,
      };
    }
    drawSheet();
    openMenu(hit, cx, cy);
  }

  /* ---- the tap menu ------------------------------------------------------
   * A small tree on the spot you tapped: what it is, how far, and the acts —
   * WARP (nav aligns and jumps), APPROACH (the whole leg, autopilot), PROBE,
   * SCAN, SAVE. Free space gets the same acts: the core will jump to a point. */
  const menu = document.createElement("div");
  menu.className = "chart-menu hidden";
  menu.id = "map-menu";
  menu.innerHTML = `<div class="cm-head"><b id="cm-title">—</b><span id="cm-sub">—</span><button type="button" class="cm-x" id="cm-close" aria-label="Close">×</button></div><div class="cm-acts" id="cm-acts"></div>`;
  plot.append(menu);
  const cmTitle = menu.querySelector("#cm-title");
  const cmSub = menu.querySelector("#cm-sub");
  const cmActs = menu.querySelector("#cm-acts");
  menu.querySelector("#cm-close").addEventListener("click", closeMenu);
  menu.addEventListener("pointerdown", (e) => e.stopPropagation());
  let menuTarget = null;

  function closeMenu() {
    menu.classList.add("hidden");
    menuTarget = null;
  }

  /** The spot a menu act works on: the tapped thing, or the free point. */
  function actPoint() {
    if (menuTarget) return { x: menuTarget.x, y: menuTarget.y, z: menuTarget.z, name: menuTarget.name };
    if (pickedPoint) return { x: pickedPoint.x, y: pickedPoint.y, z: pickedPoint.z, name: pickedPoint.title === "OPEN SPACE" ? "Mark" : pickedPoint.title };
    return null;
  }

  /** A warp node id for the target: the thing itself, or a saved point in space (transient unless SAVE made it). */
  function nodeFor(persist) {
    if (menuTarget?.kind === "body" || menuTarget?.kind === "station" || menuTarget?.kind === "waypoint") return menuTarget.id;
    const p = actPoint();
    if (!p) return null;
    /* reuse a saved location already sitting on this spot */
    const have = sim.waypoints.find((w) => !w.body && Math.hypot(w.x - p.x, w.z - p.z) < 2000);
    if (have) { if (persist) have.transient = false; return have.id; }
    const n = sim.waypoints.filter((w) => !w.body).length + 1;
    const wp = addWaypointAt(`${p.name} ${n}`, p.x, p.y, p.z);
    wp.transient = !persist;
    return wp.id;
  }

  const MENU_ACTS = {
    warp: { label: "WARP", run: () => { const id = nodeFor(false); if (!id) return; picked = id; if (engageAutoWarp(id)) store.getState().setMapOpen(false); } },
    approach: { label: "APPROACH", run: () => { const id = nodeFor(false); if (!id) return; picked = id; if (engageAutopilot(id)) store.getState().setMapOpen(false); } },
    lock: { label: "LOCK", run: () => { if (menuTarget?.kind === "vessel") acquireLock({ kind: "contact", id: menuTarget.id }); else if (menuTarget) selectBody(menuTarget.id); } },
    probe: { label: "PROBE", run: () => { const p = actPoint(); if (p) launchProbe(p.x, p.y, p.z); } },
    scan: { label: "SCAN", run: () => { const p = actPoint(); if (!p) return; const rep = remoteScan(p.x, p.y, p.z, p.name); if (rep) { if (pickedPoint) pickedPoint.report = rep; drawSheet(); } } },
    save: { label: "SAVE", run: () => {
      if (menuTarget?.kind === "body") { addBodyWaypoint(menuTarget.id); return; }
      if (menuTarget?.kind === "station") { const wp = addWaypoint(menuTarget.name); wp.x = menuTarget.x; wp.y = menuTarget.y; wp.z = menuTarget.z; return; }
      if (menuTarget?.kind === "waypoint") { menuTarget.wp.transient = false; sim.notice = `${menuTarget.name} kept.`; return; }
      if (menuTarget?.kind === "vessel") { addWaypointAt(`${menuTarget.name} (last seen)`, menuTarget.x, menuTarget.y, menuTarget.z); return; }
      const id = nodeFor(true); if (id) { picked = id; pickedPoint = null; sim.notice = "Location saved. It is a warp node now — WARP or APPROACH from the chart, or G with it locked."; drawSheet(); }
    } },
    forget: { label: "FORGET", run: () => { if (menuTarget?.kind === "waypoint") { removeWaypoint(menuTarget.id); picked = null; drawSheet(); } } },
    mine: { label: "MINE HERE", run: () => { const p = actPoint(); if (!p) return; const band = beltBandAt(p.x, p.z); if (engageMiningLoop({ x: p.x, y: p.y, z: p.z, name: band ? `${band.label} seam` : p.name })) store.getState().setMapOpen(false); } },
    centre: { label: "CENTRE", run: () => { const p = actPoint(); if (p) centreOn(p.x, p.z, Math.max(MIN_SPAN, view.span * 0.35)); } },
  };

  function openMenu(hit, cx, cy) {
    menuTarget = hit;
    let acts;
    if (!hit) {
      cmTitle.textContent = pickedPoint.title;
      cmSub.textContent = `${pickedPoint.sub} · ${fmtDist(dist3(sim.ship.pos, pickedPoint))}`;
      acts = beltBandAt(pickedPoint.x, pickedPoint.z) ? ["warp", "approach", "mine", "probe", "scan", "save"] : ["warp", "approach", "probe", "scan", "save", "centre"];
    } else if (hit.kind === "vessel") {
      cmTitle.textContent = hit.name;
      cmSub.textContent = `${hit.flow ? `${hit.vessel.hullName ?? "flow boat"} · ${hit.vessel.job ?? ""}` : `${vesselStatus(hit.vessel).split(" — ")[0]} · ${captainLine(hit.vessel)}`} · ${fmtDist(dist3(sim.ship.pos, hit))}`;
      acts = ["lock", "probe", "scan", "save", "centre"];
    } else if (hit.kind === "waypoint") {
      cmTitle.textContent = hit.name;
      cmSub.textContent = `saved location · ${fmtDist(dist3(sim.ship.pos, hit))}`;
      acts = beltBandAt(hit.x, hit.z) ? ["warp", "approach", "mine", "probe", "scan", "forget"] : ["warp", "approach", "probe", "scan", "forget", "centre"];
    } else {
      cmTitle.textContent = hit.name;
      cmSub.textContent = `${hit.kind === "station" ? "port" : bodyById(hit.id)?.kind ?? "world"} · ${fmtDist(dist3(sim.ship.pos, hit))}`;
      acts = ["warp", "approach", "probe", "scan", "save", "centre"];
    }
    cmActs.innerHTML = "";
    for (const k of acts) {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "tbtn";
      b.textContent = MENU_ACTS[k].label;
      b.addEventListener("click", () => { MENU_ACTS[k].run(); if (k !== "scan" && k !== "probe") closeMenu(); else openMenu(menuTarget, cx, cy); });
      cmActs.append(b);
    }
    /* park it beside the tap, inside the plot */
    const pr = plot.getBoundingClientRect();
    menu.classList.remove("hidden");
    const mw = menu.offsetWidth || 180;
    const mh = menu.offsetHeight || 120;
    let x = cx - pr.left + 10;
    let y = cy - pr.top + 10;
    if (x + mw > pr.width - 6) x = Math.max(6, cx - pr.left - mw - 10);
    if (y + mh > pr.height - 6) y = Math.max(6, pr.height - mh - 6);
    menu.style.left = `${x}px`;
    menu.style.top = `${y}px`;
  }

  /** A moon only earns a dot once its orbit is a few pixels wide. */
  function moonsVisible(b) {
    return b.orbit * pxPerUnit() > 5;
  }

  /* ---- the directory: filter the sky, tap to select ----------------------
   * The chart shows where things are; the directory answers "what is there
   * at all" — every port (by sector), world, and waypoint, nearest first.
   * A drought buyer wears its multiplier. */
  const DIR_FILTERS = [
    { id: "all", label: "ALL" },
    { id: "ports", label: "PORTS" },
    { id: "agricultural", label: "AGRI" },
    { id: "civilian", label: "CIV" },
    { id: "industrial", label: "IND" },
    { id: "logistic", label: "LOG" },
    { id: "military", label: "MIL" },
    { id: "pirate", label: "FREE" },
    { id: "worlds", label: "WORLDS" },
    { id: "traffic", label: "SHIPS" },
    { id: "marked", label: "MARKED" },
  ];
  let dirOpen = false;
  let dirFilter = "all";
  const dirPanel = document.getElementById("map-dir");
  const dirChips = document.getElementById("dir-chips");
  const dirRows = document.getElementById("dir-rows");
  for (const f of DIR_FILTERS) {
    const b = document.createElement("button");
    b.textContent = f.label;
    b.dataset.f = f.id;
    b.addEventListener("click", () => { dirFilter = f.id; drawDirectory(); });
    dirChips.append(b);
  }
  document.getElementById("map-list").addEventListener("click", () => {
    dirOpen = !dirOpen;
    dirPanel.classList.toggle("hidden", !dirOpen);
    if (dirOpen) drawDirectory();
  });
  _openDir = (f) => {
    dirFilter = f;
    dirOpen = true;
    dirPanel.classList.remove("hidden");
    drawDirectory();
  };

  function dirEntries() {
    const ship = sim.ship;
    const drought = sim.market?.drought;
    const droughtOn = drought && sim.time < drought.until;
    const out = [];
    if (dirFilter === "traffic") {
      /* Resolved contacts only, nearest first. An unknown return is listed as
       * one — it is on the board, you just do not know what it is yet. */
      const list = knownContacts()
        .map((c) => ({ c, d: Math.hypot(c.x - ship.pos.x, c.y - ship.pos.y, c.z - ship.pos.z) }))
        .sort((a, b) => a.d - b.d);
      for (const { c, d } of list) {
        const n = c.ref;
        out.push({
          id: null, vessel: c.level >= 2 ? n : null, contact: c,
          name: c.level >= 3 ? c.name : c.level >= 2 ? `${c.name} · unidentified` : "unknown return",
          d,
          /* the captain half of vesselStatus used to be thrown away here, so
           * the SHIPS directory was a list of hulls with nobody in them */
          tag: c.level >= 3 && n ? `${vesselStatus(n).split(" — ")[0]} · ${captainLine(n)}` : c.level >= 2 ? "tracking" : `resolving ${Math.round(c.res * 100)}%`,
          cls: c.level >= 2 && (n?.role === "patrol" || n?.role === "security") ? "ally" : c.level >= 2 && n?.role === "pirate" ? "hot" : "",
        });
      }
      return out;
    }
    for (const st of stations) {
      const sectorMatch = dirFilter === st.sector;
      if (dirFilter !== "all" && dirFilter !== "ports" && dirFilter !== "marked" && !sectorMatch) {
        if (dirFilter === "worlds") continue;
        if (!sectorMatch) continue;
      }
      if (dirFilter === "worlds") continue;
      const isDrought = droughtOn && drought.sectors.includes(st.sector);
      out.push({
        id: st.id, name: st.name, d: dist3(ship.pos, st),
        tag: `${st.sector.slice(0, 4)}${st.hostile && !st.claimed ? " · GUNS" : ""}${isDrought ? ` · ${drought.mult}× WATER` : ""}`,
        cls: st.hostile && !st.claimed ? "hot" : isDrought ? "drought" : "",
      });
    }
    if (dirFilter === "all" || dirFilter === "worlds" || dirFilter === "marked") {
      for (const b of BODIES) {
        if (b.kind === "star") continue;
        if (dirFilter !== "worlds" && b.parent) continue; // moons clutter ALL; WORLDS shows them
        bodyPosition(b.id, sim.time, _p);
        out.push({ id: b.id, name: b.name, d: dist3(ship.pos, _p), tag: `${b.kind}${sim.scanned.has(b.id) ? "" : " · unsurveyed"}${(b.thermal ?? 0) > 25 ? " · HOT" : ""}`, cls: (b.thermal ?? 0) > 25 ? "hot" : "" });
      }
    }
    if (dirFilter === "marked") {
      const ids = new Set(out.map((o) => o.id));
      const keep = [];
      for (const w of sim.waypoints) {
        const hit = out.find((o) => o.id === w.body || o.name === w.name);
        if (hit) keep.push(hit);
        else keep.push({ id: null, wp: w, name: w.name, d: dist3(sim.ship.pos, w), tag: "waypoint", cls: "" });
      }
      return keep.sort((a, b) => a.d - b.d);
    }
    return out.sort((a, b) => a.d - b.d);
  }

  function drawDirectory() {
    if (!dirOpen) return;
    for (const b of dirChips.children) b.classList.toggle("on", b.dataset.f === dirFilter);
    const rows = dirEntries();
    dirRows.innerHTML = "";
    if (!rows.length) {
      const e = document.createElement("div");
      e.className = "dir-empty";
      e.textContent = dirFilter === "agricultural" ? "No agricultural ports in this sky — a drought here has no buyers." : dirFilter === "traffic" ? "Everyone is docked or in a lane right now." : "Nothing under this filter in this sky.";
      dirRows.append(e);
      return;
    }
    for (const r of rows.slice(0, 40)) {
      const row = document.createElement("button");
      row.className = `dir-row ${r.cls}`;
      row.innerHTML = `<span class="nm">${svgEsc(r.name)}</span><span class="tag">${svgEsc(r.tag)}</span><span class="d">${svgEsc(fmtDist(r.d))}</span>`;
      row.addEventListener("click", () => {
        if (r.id) {
          picked = r.id;
          selectBody(r.id);
          const port = stations.find((x) => x.id === r.id);
          if (port) centreOn(port.x, port.z, Math.max(MIN_SPAN, 60000));
          else { bodyPosition(r.id, sim.time, _p); centreOn(_p.x, _p.z, Math.max(MIN_SPAN, 90000)); }
          drawSheet();
        } else if (r.wp) {
          centreOn(r.wp.x, r.wp.z, Math.max(MIN_SPAN, 60000));
        } else if (r.vessel) {
          centreOn(r.vessel.x, r.vessel.z, Math.max(MIN_SPAN, 40000));
          acquireLock({ kind: "contact", id: r.vessel.id });
        }
        dirOpen = false;
        dirPanel.classList.add("hidden");
      });
      dirRows.append(row);
    }
  }

  document.getElementById("map-in").addEventListener("click", () => zoom(1 / 1.6));
  document.getElementById("map-out").addEventListener("click", () => zoom(1.6));
  /* One button, two useful framings: your neighbourhood and the whole chart. */
  document.getElementById("map-fit").addEventListener("click", () => {
    if (view.mode === "ship") fitSystem();
    else fitShip();
  });

  /* the loop's plan lives under the sheet: what a full hold does, and whether it goes back out */
  /* (ON DOCK / REPEAT live in the mission editor now: CONSOLE › WORK › MISSION) */
  const planRow = document.createElement("div");
  planRow.className = "sheet-plan";
  planRow.style.gridTemplateColumns = "1.4fr 1fr";
  planRow.innerHTML = `<button type="button" class="tbtn" id="plan-loop">MINE LOOP</button><button type="button" class="tbtn" id="plan-edit">PLAN…</button>`;
  document.getElementById("map-sheet").append(planRow);
  const planPaint = () => {
    const on = autopilot.on && Boolean(mission.active);
    planRow.querySelector("#plan-loop").textContent = on ? `${mission.active.name}: ${autopilot.phase.toUpperCase()} · STOP` : "MINE LOOP";
    planRow.querySelector("#plan-loop").classList.toggle("on", on);
  };
  planRow.querySelector("#plan-edit").addEventListener("click", () => { store.getState().setMapOpen(false); openConsole("work", "mission"); });
  planRow.querySelector("#plan-loop").addEventListener("click", () => {
    if (autopilot.on && mission.active) { disengageAutopilot(mission.active.name === "MINE LOOP" ? "loop stopped" : "stopped"); planPaint(); return; }
    const p = pickedPoint ?? (picked ? (() => { const w = sim.waypoints.find((x) => x.id === picked); if (!w) return null; waypointPosition(w, _p); return { x: _p.x, y: _p.y, z: _p.z, name: w.name }; })() : null);
    const seam = p && beltBandAt(p.x, p.z) ? p : null;
    if (engageMiningLoop(seam)) store.getState().setMapOpen(false);
    planPaint();
  });
  planPaint();

  document.getElementById("sheet-lock").addEventListener("click", () => {
    if (picked) selectBody(picked);
  });
  document.getElementById("sheet-warp").addEventListener("click", () => {
    if (sim.warp.state === "spool" || sim.warp.state === "run") { toggleWarp(); return; }
    const id = picked ?? (pickedPoint ? nodeFor(false) : null);
    if (!id) return;
    picked = id;
    /* the chart flies the jump: nav comes about, plots, spools — no nose-wrangling from a map */
    if (engageAutoWarp(id)) store.getState().setMapOpen(false);
  });
  document.getElementById("sheet-mark").addEventListener("click", () => {
    if (!picked) return;
    const wpPicked = sim.waypoints.find((w) => w.id === picked);
    if (wpPicked) { removeWaypoint(wpPicked.id); sim.notice = `${wpPicked.name} forgotten.`; picked = null; drawSheet(); return; }
    const port = stations.find((x) => x.id === picked);
    const name = port?.name ?? bodyById(picked)?.name;
    /* MARK toggles: a second press takes the diamond back off the canopy */
    const have = sim.waypoints.find((w) => w.body === picked || w.name === name);
    if (have) {
      removeWaypoint(have.id);
      sim.notice = `${name} unmarked.`;
      return;
    }
    if (port) {
      const wp = addWaypoint(port.name);
      wp.x = port.x; wp.y = port.y; wp.z = port.z;
      return;
    }
    addBodyWaypoint(picked);
  });
  document.getElementById("sheet-centre").addEventListener("click", () => {
    if (!picked) return;
    const wpPicked = sim.waypoints.find((w) => w.id === picked);
    if (wpPicked) { waypointPosition(wpPicked, _p); centreOn(_p.x, _p.z, Math.max(MIN_SPAN, 40000)); return; }
    const port = stations.find((x) => x.id === picked);
    if (port) { centreOn(port.x, port.z, Math.max(MIN_SPAN, 60000)); return; }
    const b = bodyById(picked);
    bodyPosition(picked, sim.time, _p);
    centreOn(_p.x, _p.z, Math.max(MIN_SPAN, b.soi === Infinity ? b.radius * 60 : b.soi * 3.2));
  });

  /* ---- drawing ---- */

  function svgEsc(t) {
    return String(t).replace(/&/g, "&amp;").replace(/</g, "&lt;");
  }

  function drawSheet() {
    /* a picked port gets its own card */
    const port = picked ? stations.find((x) => x.id === picked) : null;
    if (port) {
      sheet.empty.classList.add("hidden");
      sheet.body.classList.remove("hidden");
      const d = dist3(sim.ship.pos, port);
      sheet.name.textContent = port.name;
      sheet.sub.textContent = `${port.sector} port${port.hostile && !port.claimed ? " · GUNS UP" : ""} · ${fmtDist(d)}`;
      sheet.tier.textContent = port.hostile && !port.claimed ? "HOSTILE" : "PORT";
      sheet.tier.dataset.tier = port.hostile && !port.claimed ? "0" : "3";
      statsHtml(`port:${port.id}:${port.guards ?? 0}:${port.stock?.length ?? 0}:${Math.round(port.credits ?? 0)}:${port.claimed ? 1 : 0}`, () => [
        ["SECTOR", port.sector],
        ["GUNS", `${port.guards ?? 0}`],
        ["DOCK", "slow < 12 u/s"],
        ["STOCK", `${port.stock?.length ?? 0} lines`],
        ["CREDITS", `${Math.round(port.credits ?? 0)}`],
        ["CLAIMED", port.claimed ? "yours" : "—"],
      ]
        .map(([k, v]) => `<div>${k}<b>${svgEsc(v)}</b></div>`)
        .join(""));
      return;
    }
    const wp = picked ? sim.waypoints.find((w) => w.id === picked) : null;
    if (wp) {
      sheet.empty.classList.add("hidden");
      sheet.body.classList.remove("hidden");
      waypointPosition(wp, _p);
      const d = dist3(sim.ship.pos, _p);
      const rep = sim.scanReports.find((r) => Math.hypot(r.x - _p.x, r.z - _p.z) < 2000);
      const band = beltBandAt(_p.x, _p.z);
      sheet.name.textContent = wp.name;
      sheet.sub.textContent = `saved location${wp.transient ? " (jump point)" : ""} · ${fmtDist(d)}`;
      sheet.tier.textContent = rep ? (rep.kind === "probe" ? "PROBED" : "SCANNED") : "FIX";
      sheet.tier.dataset.tier = "1";
      statsHtml(`wp:${wp.id}:${rep ? `${rep.kind}:${rep.lines.length}` : `${band ? band.band : ""}:${Math.round(_p.x / 100)}:${Math.round(_p.z / 100)}`}`, () => (rep
        ? rep.lines.slice(0, 6).map((l) => `<div class="wide"><b>${svgEsc(l)}</b></div>`)
        : [["WHERE", band ? band.band : "open space"], ["X / Z", `${Math.round(_p.x / 100)} / ${Math.round(_p.z / 100)} km`], ["ASSAY", "—  tap it: SCAN or PROBE"]].map(([k, v]) => `<div>${k}<b>${svgEsc(v)}</b></div>`)
      ).join(""));
      return;
    }
    if (pickedVessel) {
      const n = pickedVessel;
      sheet.empty.classList.add("hidden");
      sheet.body.classList.remove("hidden");
      sheet.name.textContent = n.name;
      sheet.sub.textContent = `${n.hullName ?? n.role ?? "hull"} · transponder · ${fmtDist(dist3(sim.ship.pos, n))}`;
      sheet.tier.textContent = HOSTILE_ROLES.has(n.role) ? "HOSTILE" : LAW_ROLES.has(n.role) ? "LAW" : "CIVIL";
      sheet.tier.dataset.tier = HOSTILE_ROLES.has(n.role) ? "0" : "2";
      statsHtml(`v:${n.id}:${n.role}:${n.job}:${Math.round(n.speed ?? 0)}:${n.manifest ?? n.cargo?.good ?? ""}`, () => {
        const flag = corpOfVessel(n);
        return [
          ["FLAG", flag ? `${flag.name} · ${standingLabel(flag.standing)}` : "—"],
          ["ROLE", n.role ?? (n.port ? "flow" : "—")],
          ["JOB", n.job ?? "—"],
          ["SPEED", `${Math.round(n.speed ?? 0)} u/s`],
          ["CARGO", n.manifest ?? n.cargo?.good ?? "—"],
        ].map(([k, v]) => `<div>${k}<b>${svgEsc(v)}</b></div>`).join("");
      });
      return;
    }
    if (pickedPoint) {
      const pp = pickedPoint;
      sheet.empty.classList.add("hidden");
      sheet.body.classList.remove("hidden");
      const rep = pp.report ?? sim.scanReports.find((r) => Math.hypot(r.x - pp.x, r.z - pp.z) < 2000);
      sheet.name.textContent = pp.title;
      sheet.sub.textContent = `${pp.sub} · ${fmtDist(dist3(sim.ship.pos, pp))}`;
      sheet.tier.textContent = rep ? (rep.kind === "probe" ? "PROBED" : "SCANNED") : "UNSURVEYED";
      sheet.tier.dataset.tier = "1";
      statsHtml(`pt:${pp.title}:${Math.round(pp.x / 100)}:${Math.round(pp.z / 100)}:${rep ? `${rep.kind}:${rep.lines.length}` : ""}`, () => (rep
        ? rep.lines.slice(0, 6).map((l) => `<div class="wide"><b>${svgEsc(l)}</b></div>`)
        : [["X / Z", `${Math.round(pp.x / 100)} / ${Math.round(pp.z / 100)} km`], ["ASSAY", "— SCAN in reach, PROBE beyond"], ["WARP", "the core jumps to a point"]].map(([k, v]) => `<div>${k}<b>${svgEsc(v)}</b></div>`)
      ).join(""));
      return;
    }
    const b = picked ? bodyById(picked) : null;
    sheet.empty.classList.toggle("hidden", Boolean(b));
    sheet.body.classList.toggle("hidden", !b);
    if (!b) return;
    const st = b.stats;
    bodyPosition(b.id, sim.time, _p);
    const d = dist3(sim.ship.pos, _p);
    sheet.name.textContent = b.name;
    sheet.sub.textContent = `${b.kind}${b.parent ? ` · moon of ${bodyById(b.parent)?.name ?? "—"}` : ""} · ${fmtDist(d)}`;
    sheet.tier.textContent = st.tierName;
    sheet.tier.dataset.tier = String(st.tier);
    statsHtml(`b:${b.id}:${sim.scanned.has(b.id) ? 1 : 0}`, () => [
      ["RADIUS", `${Math.round(st.radiusKm)} km`],
      ["× SHIP", `${Math.round(st.shipLengths)}`],
      ["MASS", `${st.mass < 0.01 ? st.mass.toFixed(3) : st.mass.toFixed(2)} ⊕`],
      ["SURF G", `${st.gEarth.toFixed(2)} g`],
      ["ESCAPE", `${Math.round(st.escape)} u/s`],
      ["SURVEY", sim.scanned.has(b.id) ? "logged" : "—"],
    ]
      .map(([k, v]) => `<div>${k}<b>${svgEsc(v)}</b></div>`)
      .join(""));
  }

  function laneState() {
    if (!picked) return { text: pickedPoint ? "WARP jumps the core to this point — nav aligns for you." : "—", ok: Boolean(pickedPoint) };
    const b = bodyById(picked) ?? stations.find((x) => x.id === picked) ?? sim.waypoints.find((w) => w.id === picked);
    if (!b) return { text: "—", ok: false };
    if (picked !== sim.selected) return { text: "Lock it to check the lane.", ok: false };
    const why = sim.warp.state === "spool" ? "" : warpBlock(picked);
    if (sim.warp.state === "spool") return { text: "Core spooling — hold the lane.", ok: true };
    return why ? { text: `Warp blocked — ${why.toLowerCase()}`, ok: false } : { text: "Lane clear — warp ready.", ok: true };
  }

  return function paintMap(state) {
    if (!state.mapOpen) {
      fitted = false;
      closeMenu();
      return;
    }
    if (!fitted) {
      fitShip();
      picked = sim.selected;
      drawSheet();
    }
    /* the plan row ticks once a second, and only while the chart is up */
    if (sim.wall - planAt >= 1 || planAt < 0) {
      planAt = sim.wall;
      planPaint();
    }

    const ship = sim.ship;
    const px = pxPerUnit();
    const parts = [];

    /* belt annulus */
    for (const belt of [currentSystem.belt, currentSystem.outerBelt]) {
      if (!belt) continue;
      const c = worldToU(0, 0);
      const ri = belt.inner * px;
      const ro = belt.outer * px;
      if (ro > 3) {
        parts.push(
          `<circle cx="${c.u}" cy="${c.v}" r="${(ri + ro) / 2}" fill="none" stroke="#3a3630" stroke-width="${Math.max(1, ro - ri)}" stroke-opacity="0.5" />`,
        );
      }
    }

    /* orbit rings */
    for (const b of BODIES) {
      if (!b.orbit) continue;
      let cu;
      let cv;
      if (b.parent) {
        if (!moonsVisible(b)) continue;
        bodyPosition(b.parent, sim.time, _q);
        const c = worldToU(_q.x, _q.z);
        cu = c.u;
        cv = c.v;
      } else {
        const c = worldToU(0, 0);
        cu = c.u;
        cv = c.v;
      }
      const r = b.orbit * px;
      if (r < 2 || r > S * 6) continue;
      parts.push(
        `<circle cx="${cu}" cy="${cv}" r="${r}" fill="none" stroke="${b.parent ? "#2b2f38" : "#262a33"}" stroke-width="0.7" />`,
      );
    }

    /* warp lane — worlds and ports alike */
    if (picked && picked === sim.selected) {
      const b = warpNodeById(picked);
      if (b) {
        const to = warpDestination(b);
        const a = worldToU(ship.pos.x, ship.pos.z);
        const z = worldToU(to.x, to.z);
        const blocker = losBlocker(ship.pos, to, b.body?.id ?? null);
        const col = blocker ? "#c45c5c" : "#7d9a7e";
        parts.push(
          `<line x1="${a.u}" y1="${a.v}" x2="${z.u}" y2="${z.v}" stroke="${col}" stroke-width="1" stroke-dasharray="${blocker ? "3 3" : "6 4"}" stroke-opacity="0.85" />`,
        );
        if (blocker) {
          bodyPosition(blocker.id, sim.time, _q);
          const m = worldToU(_q.x, _q.z);
          parts.push(`<circle cx="${m.u}" cy="${m.v}" r="7" fill="none" stroke="#c45c5c" stroke-width="1" />`);
        }
      }
    }

    /* ports — pickable, ringed when selected */
    for (const st of stations) {
      const p = worldToU(st.x, st.z);
      const col = st.hostile ? "#c45c5c" : SECTORS[st.sector]?.colour ?? "#7fb8c9";
      const on = st.id === picked;
      parts.push(
        `<g transform="translate(${p.u} ${p.v})">${on ? `<circle cx="0" cy="0" r="7.5" fill="none" stroke="#7ce7ff" stroke-width="1.2" />` : ""}<rect x="-3.4" y="-3.4" width="6.8" height="6.8" fill="none" stroke="${col}" stroke-width="1.1" /><circle cx="0" cy="0" r="1.2" fill="${col}" />${on || pxPerUnit() * 3000 > 26 ? `<text x="9" y="3" fill="${col}" font-size="9">${svgEsc(st.name)}</text>` : ""}</g>`,
      );
    }

    /* collapsed stars: the shadow, the danger ring at true scale, and for a
     * transit the next minute of its line — so the chart says which way to go */
    for (const h of holes) {
      const c = worldToU(h.x, h.z);
      const R = holeRadii(h, {});
      const rr = Math.max(9, R.danger * px);
      const lead = worldToU(h.x + h.vx * 60, h.z + h.vz * 60);
      if (h.kind === "transit") parts.push(`<line x1="${c.u}" y1="${c.v}" x2="${lead.u}" y2="${lead.v}" stroke="#c45c5c" stroke-width="1" stroke-dasharray="3 3" stroke-opacity="0.9" />`);
      parts.push(
        `<g transform="translate(${c.u} ${c.v})"><circle cx="0" cy="0" r="${rr.toFixed(1)}" fill="none" stroke="#c45c5c" stroke-width="0.9" stroke-dasharray="4 3" /><circle cx="0" cy="0" r="4.2" fill="#000" stroke="#e8eef6" stroke-width="1.3" /><text x="${(rr + 4).toFixed(1)}" y="3" fill="#e08a8a" font-size="9">${svgEsc(h.name)}</text></g>`,
      );
    }

    /* survey probes */
    for (const bc of BEACONS) {
      if (sim.beaconsGot.has(bc.id)) continue;
      const p = beaconPosition(bc, sim.time);
      const s = worldToU(p.x, p.z);
      parts.push(`<rect x="${s.u - 1.6}" y="${s.v - 1.6}" width="3.2" height="3.2" fill="#7d9a7e" opacity="0.85" />`);
    }

    /* waypoints */
    const labels = [];
    for (const w of sim.waypoints) {
      waypointPosition(w, _q);
      const s = worldToU(_q.x, _q.z);
      const on = w.id === sim.activeWaypoint;
      const pk = w.id === picked;
      parts.push(
        `<g transform="translate(${s.u} ${s.v}) rotate(45)"><rect x="-3" y="-3" width="6" height="6" fill="none" stroke="${pk ? "#7ce7ff" : "#7fb8c9"}" stroke-width="${on || pk ? 1.4 : 0.8}" />${pk ? `<rect x="-6" y="-6" width="12" height="12" fill="none" stroke="#7ce7ff" stroke-width="0.7" />` : ""}</g>`,
      );
      if (pk || px * 20000 > 30) labels.push({ u: s.u + 7, v: s.v + 3, name: w.name, on: pk, rank: pk ? 2 : 0, col: "#7fb8c9" });
      /* the lane to a picked point, coloured by what sits in it */
      if (pk && picked === sim.selected) {
        const a = worldToU(ship.pos.x, ship.pos.z);
        const blocker = losBlocker(ship.pos, _q, null);
        parts.push(`<line x1="${a.u}" y1="${a.v}" x2="${s.u}" y2="${s.v}" stroke="${blocker ? "#c45c5c" : "#7d9a7e"}" stroke-width="1" stroke-dasharray="6 4" stroke-opacity="0.85" />`);
      }
    }

    /* Contacts, and only contacts.
     *
     * This used to draw every hull in the sky at true position with its name
     * attached, which made the scanner and the probes ornamental. What goes
     * on the chart now is what the register says you have actually resolved
     * (contacts.js): a level-1 return is a blob inside a circle of how wrong
     * it might be, a level-2 track gets a hull arrow and a class, and only a
     * level-3 identification gets a name.
     *
     * Your own hulls and anything under a probe come through at level 3
     * without being scanned — you do not need a dish to know where your own
     * ships are. */
    const showShipNames = px * 20000 > 30;
    for (const c of knownContacts()) {
      const sp2 = worldToU(c.x, c.z);
      if (sp2.u < -10 || sp2.u > S + 10 || sp2.v < -10 || sp2.v > S + 10) continue;
      const on = pickedVessel === c.ref || sim.lock.id === c.id;
      const hostile = c.role && HOSTILE_ROLES.has(c.role);
      const lawful = c.role && LAW_ROLES.has(c.role);
      const col = c.level < 2 ? "#7e8a99" : hostile ? "#ff7a5a" : lawful ? "#8fd6ff" : c.kind === "boat" ? "#9fb3c8" : "#cfd8e4";

      if (c.level < 2) {
        /* An unknown return: where it might be, not where it is. */
        const rad = Math.max(2.5, Math.min(26, c.err * px));
        parts.push(`<circle cx="${sp2.u}" cy="${sp2.v}" r="${rad.toFixed(1)}" fill="${col}" fill-opacity="0.07" stroke="${col}" stroke-width="0.6" stroke-opacity="0.45" stroke-dasharray="2 3" />`);
        parts.push(`<circle cx="${sp2.u}" cy="${sp2.v}" r="1.6" fill="${col}" fill-opacity="0.8" />`);
        continue;
      }

      const f2 = forwardOf(c.yaw ?? 0, 0);
      const ang = (Math.atan2(f2.x, -f2.z) * 180) / Math.PI;
      if (c.kind === "boat" && c.level < 3) {
        parts.push(`<circle cx="${sp2.u}" cy="${sp2.v}" r="${on ? 2.2 : 1.3}" fill="${col}" fill-opacity="${on ? 1 : 0.7}" />`);
      } else {
        parts.push(`<g transform="translate(${sp2.u} ${sp2.v}) rotate(${ang})"><path d="M0 -3.6 L2.6 2.8 L0 1.4 L-2.6 2.8 Z" fill="${col}" fill-opacity="${on ? 1 : 0.85}" />${on ? `<circle r="6.5" fill="none" stroke="${col}" stroke-width="0.9" />` : ""}</g>`);
      }
      /* A track has a class, not a name — the name is level 3. */
      if (showShipNames || on) labels.push({ u: sp2.u + 6, v: sp2.v + 3, name: c.name, on, rank: on ? 2 : c.level >= 3 ? 0 : -1, col });
    }

    /* probes in flight and their drops; scan reports as faint rings */
    for (const pr of probes) {
      const a = worldToU(pr.sx, pr.sz);
      const b = worldToU(pr.tx, pr.tz);
      const c = worldToU(pr.x, pr.z);
      if (!pr.done) parts.push(`<line x1="${a.u}" y1="${a.v}" x2="${b.u}" y2="${b.v}" stroke="#7d9a7e" stroke-width="0.7" stroke-dasharray="1.5 2.5" stroke-opacity="0.7" />`);
      parts.push(pr.done
        ? `<circle cx="${c.u}" cy="${c.v}" r="4" fill="none" stroke="#7d9a7e" stroke-width="1" />`
        : `<g transform="translate(${c.u} ${c.v})"><path d="M0 -3.5 L3 3 L-3 3 Z" fill="#9fe8b0" /></g>`);
    }
    for (const r of sim.scanReports) {
      if (r.kind !== "scan") continue;
      const c = worldToU(r.x, r.z);
      parts.push(`<circle cx="${c.u}" cy="${c.v}" r="5" fill="none" stroke="#7fb8c9" stroke-width="0.7" stroke-dasharray="2 2" stroke-opacity="0.6" />`);
    }
    /* the free point under the menu */
    if (pickedPoint) {
      const c = worldToU(pickedPoint.x, pickedPoint.z);
      parts.push(`<g transform="translate(${c.u} ${c.v})"><line x1="-6" y1="0" x2="6" y2="0" stroke="#7ce7ff" stroke-width="0.8" /><line x1="0" y1="-6" x2="0" y2="6" stroke="#7ce7ff" stroke-width="0.8" /><circle r="4" fill="none" stroke="#7ce7ff" stroke-width="0.8" /></g>`);
    }

    /* bodies */
    for (const b of BODIES) {
      if (b.parent && !moonsVisible(b)) continue;
      bodyPosition(b.id, sim.time, _p);
      const s = worldToU(_p.x, _p.z);
      if (s.u < -30 || s.u > S + 30 || s.v < -30 || s.v > S + 30) continue;
      /* true size once it is big enough to matter, otherwise a legible dot */
      const trueR = b.radius * px;
      const r = Math.max(b.kind === "star" ? 3.5 : b.parent ? 1.8 : 2.6, Math.min(trueR, 60));
      const on = b.id === picked;
      const done = sim.scanned.has(b.id);
      parts.push(
        `<circle cx="${s.u}" cy="${s.v}" r="${r}" fill="${KIND_FILL[b.kind] ?? "#8a8f9a"}" fill-opacity="${done ? 1 : 0.75}" />`,
      );
      if (on) {
        parts.push(
          `<circle cx="${s.u}" cy="${s.v}" r="${r + 4}" fill="none" stroke="#eceef2" stroke-width="1" />`,
        );
      }
      if (b.id === sim.selected && !on) {
        parts.push(
          `<circle cx="${s.u}" cy="${s.v}" r="${r + 3}" fill="none" stroke="#c9d2dc" stroke-width="0.7" stroke-dasharray="2 2" />`,
        );
      }
      const lu = s.u + r + 3;
      const inFrame = lu > 2 && lu < S - 8 && s.v > 8 && s.v < S - 4;
      if (inFrame && (!b.parent || r > 2.4 || on)) {
        labels.push({ u: lu, v: s.v + 3, name: b.name, on, rank: on ? 2 : b.parent ? 0 : 1 });
      }
    }

    /* the ship: heading tick and velocity vector */
    const sp = worldToU(ship.pos.x, ship.pos.z);
    const f = forwardOf(ship.yaw, 0);
    parts.push(
      `<line x1="${sp.u}" y1="${sp.v}" x2="${sp.u + f.x * 11}" y2="${sp.v + f.z * 11}" stroke="#eceef2" stroke-width="1" />`,
    );
    const fv = sim.frameVel;
    const vx = ship.vel.x - fv.x;
    const vz = ship.vel.z - fv.z;
    const vm = Math.hypot(vx, vz);
    if (vm > 0.5) {
      const k = Math.min(26, 6 + vm * 0.06) / vm;
      parts.push(
        `<line x1="${sp.u}" y1="${sp.v}" x2="${sp.u + vx * k}" y2="${sp.v + vz * k}" stroke="#7d9a7e" stroke-width="1" stroke-dasharray="2 2" />`,
      );
    }
    parts.push(`<circle cx="${sp.u}" cy="${sp.v}" r="2.6" fill="#eceef2" />`);
    parts.push(`<circle cx="${sp.u}" cy="${sp.v}" r="6" fill="none" stroke="#eceef2" stroke-opacity="0.35" />`);

    /* Drop labels that would land on top of one another — the inner system is
     * genuinely crowded at chart scale and a pile of text helps nobody. */
    labels.sort((a, z) => z.rank - a.rank);
    const placed = [];
    const text = [];
    for (const l of labels) {
      if (placed.some((q) => Math.abs(q.u - l.u) < 34 && Math.abs(q.v - l.v) < 9)) continue;
      placed.push(l);
      text.push(
        `<text x="${l.u}" y="${l.v}" fill="${l.on ? "#eceef2" : l.col ?? "#8a8f9a"}" font-size="7.5" font-family="ui-monospace,monospace">${svgEsc(l.name)}</text>`,
      );
    }
    svg.innerHTML = parts.join("") + text.join("");

    /* how wide the chart is, so zoom level is always legible */
    document.getElementById("map-scale").textContent =
      `${fmtDist(niceSpan(view.span))} · ${view.mode === "ship" ? "your space" : view.mode === "system" ? "system" : "free"}`;

    document.getElementById("map-title").textContent = state.systemName;

    /* sheet is cheap to keep live */
    if (picked || pickedPoint || pickedVessel) {
      drawSheet();
      const lane = laneState();
      sheet.lane.textContent = lane.text;
      sheet.lane.classList.toggle("ok", lane.ok);
      sheet.lane.classList.toggle("bad", !lane.ok);
      const hardBlock = picked && picked === sim.selected && sim.warp.state === "idle" ? warpBlock(picked) : "";
      document.getElementById("sheet-warp").disabled =
        sim.warp.state === "run" || (!picked && !pickedPoint) || Boolean(pickedVessel) || /WELL|CLAMPS|MAINS|CHARGE|ALREADY/.test(hardBlock);
      document.getElementById("sheet-warp").textContent = sim.warp.state === "spool" ? "ABORT" : "WARP";
      document.getElementById("sheet-mark").textContent = picked && sim.waypoints.some((w) => w.id === picked) ? "FORGET" : "MARK";
    }
  };
}
