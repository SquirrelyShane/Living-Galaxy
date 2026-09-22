/* LIVING GALAXY experimental — the deck.
 *
 * Press I (or DECK on dash page 3) and the hull dematerialises: the forged
 * mesh goes to wireframe and fades while a scan line sweeps the canopy and
 * leaves the deck plan behind it — the same blueprint ink the station decks
 * use, but this one is *your* hull, grown from its def and your callsign.
 *
 * On it: every deck stacked, every room named, the crew walking their shift
 * (station → mess → quarters on a 270 s rota), the hull's maintenance
 * robotics, the interior sensor nodes, and whoever holds the conn on the
 * bridge. The rail beside it is the sensor board: what is inside the hull
 * (allied, synthetic, robotics, intruders) and what is inside scan range
 * outside it. Tap a hand to talk — and to give them the ship.
 *
 * Mounted on <body>, like comms, so it survives the terminal and the deck.
 */

import { sim, logEvent, currentShipId } from "../sim.js";
import { VIEW } from "../audio.js";
import { setInjectedKeys, setInjectedPan } from "../input.js";
import { crew, dismissCrew } from "../crew.js";
import { mountTalk } from "../crew/talkview.js";
import { shipById } from "../shipdb.js";
import { contacts } from "../turrets.js";
import { stations } from "../stations.js";
import { hullPlan, stationRoomFor, quartersFor } from "./deckplan.js";
import { captain, transferCommand, retakeCommand, holderName, interiorReport } from "../npc/captain.js";
import { crewEffects, shiftPhase } from "../npc/crewfx.js";
import { boarding } from "./boarding.js";

export const interior = {
  open: false,
  fade: 0,            // 0 = hull solid, 1 = blueprint
  plan: null,
  planKey: "",
  peds: new Map(),    // crew id → walker
  robots: [],
  selected: null,     // crew id
  view: { zoom: 1, panX: 0, panY: 0 },
  root: null,
  canvas: null,
  ctx: null,
  lastPaint: 0,
  lastAux: 0,
  camBefore: null,
};


const $ = (id) => document.getElementById(id);
const el = (tag, cls, text) => {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (text != null) e.textContent = text;
  return e;
};

/* ---- plan + walkers ----------------------------------------------------- */

function ensurePlan() {
  const id = currentShipId();
  const key = `${id}:${sim.callsign}`;
  if (interior.planKey === key && interior.plan) return interior.plan;
  const def = shipById(id) ?? shipById("general_b");
  interior.plan = hullPlan(def, sim.callsign || "sol");
  interior.planKey = key;
  interior.peds.clear();
  interior.robots = [];
  const plan = interior.plan;
  for (let i = 0; i < plan.robots; i++) {
    const works = plan.rooms.filter((r) => r.industrial || r.kind === "eng" || r.kind === "cargo");
    const r = works[i % works.length] ?? plan.rooms[0];
    interior.robots.push({ id: `bot${i}`, deck: r.deck, room: r.id, x: r.x + 0.5 + plan.rnd() * (r.w - 1), y: r.y + 0.5 + plan.rnd() * (r.h - 1), path: [], wait: plan.rnd() * 5, speed: 0.22 });
  }
  sim.interior = { robots: plan.robots, sensors: plan.rooms.reduce((a, r) => a + r.sensors, 0), hasBrig: plan.rooms.some((r) => r.kind === "brig"), intruders: boarding.intruders, hull: plan.hullName };
  return plan;
}

function syncWalkers(plan) {
  const ids = new Set();
  for (const m of crew.aboard) {
    ids.add(m.id);
    if (!interior.peds.has(m.id)) {
      const r = stationRoomFor(plan, m);
      interior.peds.set(m.id, { id: m.id, deck: r.deck, room: r.id, x: r.x + 0.4 + plan.rnd() * (r.w - 0.8), y: r.y + 0.4 + plan.rnd() * (r.h - 0.8), path: [], wait: 1 + plan.rnd() * 3, speed: 0.4 + plan.rnd() * 0.25, phase: -1 });
    }
  }
  for (const id of [...interior.peds.keys()]) if (!ids.has(id)) interior.peds.delete(id);
}

function roomFor(plan, m, phase) {
  if (captain.holder === m.id) return plan.bridge;
  if (phase === 0) return stationRoomFor(plan, m);
  if (phase === 1) return plan.mess;
  return quartersFor(plan, m);
}

/* room → door → corridor → (lift, deck change) → corridor → door → room */
function routeTo(plan, p, dst) {
  const cur = plan.rooms[p.room];
  const path = [];
  path.push({ deck: cur.deck, x: cur.door.x, y: cur.y < 0 ? cur.y + cur.h - 0.2 : cur.y + 0.2 });
  path.push({ deck: cur.deck, x: cur.door.x, y: 0.5 });
  if (dst.deck !== cur.deck) {
    path.push({ deck: cur.deck, x: plan.liftX, y: 0.5 });
    path.push({ deck: dst.deck, x: plan.liftX, y: 0.5, lift: true });
  }
  path.push({ deck: dst.deck, x: dst.door.x, y: 0.5 });
  path.push({ deck: dst.deck, x: dst.door.x, y: dst.y < 0 ? dst.y + dst.h - 0.3 : dst.y + 0.3 });
  path.push({ deck: dst.deck, x: dst.x + 0.4 + plan.rnd() * (dst.w - 0.8), y: dst.y + 0.4 + plan.rnd() * (dst.h - 0.8) });
  p.path = path;
  p.target = dst.id;
}

function walk(p, dt) {
  if (p.wait > 0) { p.wait -= dt; return; }
  if (!p.path.length) return;
  const t = p.path[0];
  if (t.lift && t.deck !== p.deck) { p.deck = t.deck; p.x = t.x; p.y = t.y; p.path.shift(); p.wait = 1.2; return; }
  const dx = t.x - p.x, dy = t.y - p.y;
  const d = Math.hypot(dx, dy);
  const step = p.speed * dt;
  if (d <= step) {
    p.x = t.x; p.y = t.y; p.deck = t.deck;
    p.path.shift();
    if (!p.path.length) { p.room = p.target; p.wait = 2 + Math.random() * 5; }
  } else {
    p.x += (dx / d) * step;
    p.y += (dy / d) * step;
  }
}

/* boarders come through the airlock and go where it hurts */
function syncIntruders(plan) {
  const lock = plan.rooms.find((r) => r.kind === "airlock") ?? plan.rooms[0];
  for (const i of boarding.intruders) {
    if (i.deck == null) {
      i.deck = lock.deck;
      i.room = lock.id;
      i.x = lock.x + 0.5; i.y = lock.y + 0.5;
      i.path = []; i.wait = 0.5; i.speed = 0.5;
    }
  }
}

function tickWalkers(plan, dt) {
  for (const m of crew.aboard) {
    const p = interior.peds.get(m.id);
    if (!p) continue;
    /* the same deterministic rota crewfx.js prices — the dot on the deck IS the trim on the hull */
    const phase = captain.holder === m.id ? 0 : shiftPhase(m.id, sim.time);
    if (phase !== p.phase && !p.path.length) {
      p.phase = phase;
      const dst = roomFor(plan, m, phase);
      if (dst && dst.id !== p.room) routeTo(plan, p, dst);
    } else if (phase === 0 && !p.path.length && p.wait <= 0) {
      /* a new duty from the roster: walk to it without waiting for the next phase */
      const dst = roomFor(plan, m, 0);
      if (dst && dst.id !== p.room) routeTo(plan, p, dst);
    }
    walk(p, dt);
  }
  for (const b of interior.robots) {
    if (!b.path.length && b.wait <= 0) {
      const works = plan.rooms.filter((r) => r.industrial || r.kind === "eng" || r.kind === "cargo" || r.kind === "airlock");
      routeTo(plan, b, works[Math.floor(Math.random() * works.length)]);
    }
    walk(b, dt);
  }
  for (const i of boarding.intruders) {
    if (i.deck == null) continue;
    if (!i.path.length && i.wait <= 0) {
      const marks = plan.rooms.filter((r) => r.kind === "eng" || r.kind === "cargo" || r.kind === "bridge");
      routeTo(plan, i, marks[Math.floor(Math.random() * marks.length)]);
    }
    walk(i, dt);
  }
}

/* ---- open / close -------------------------------------------------------- */

export function openInterior() {
  if (interior.open || sim.phase !== "play") return;
  interior.open = true;
  /* The engine's ambient bed reads this: inside the hull the sky cuts off
   * and the room tone comes up. A flag on sim rather than an import of this
   * module, so the engine does not take a dependency on the deck plan. */
  sim.interiorOpen = true;
  VIEW.interiorIn();
  ensurePlan();
  interior.camBefore = sim.cameraMode ?? 0;
  sim.cameraMode = 1; // the hull has to be on screen to dematerialise
  interior.root.hidden = false;
  interior.root.classList.add("in");
  interior.root.classList.remove("out");
  if (captain.holder === "player") {
    /* you left the seat: the stick goes dead until you come back */
    setInjectedKeys([]);
    setInjectedPan({ x: 0, y: 0 });
  }
  logEvent(`Deck plan up — ${interior.plan.hullName}`, "system");
}

export function closeInterior() {
  if (interior.open) { sim.interiorOpen = false; VIEW.interiorOut(); }
  if (!interior.open) return;
  interior.open = false;
  interior.root.classList.remove("in");
  interior.root.classList.add("out");
  if (captain.holder === "player") { setInjectedKeys(null); setInjectedPan(null); }
  setTimeout(() => { if (!interior.open) { interior.root.hidden = true; sim.cameraMode = interior.camBefore ?? 0; } }, 650);
}

export function toggleInterior() {
  if (interior.open) closeInterior();
  else openInterior();
}

/* ---- drawing ------------------------------------------------------------- */

function draw() {
  const plan = interior.plan;
  const c = interior.canvas;
  const ctx = interior.ctx;
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  const w = c.clientWidth, h = c.clientHeight;
  if (c.width !== Math.round(w * dpr) || c.height !== Math.round(h * dpr)) { c.width = Math.round(w * dpr); c.height = Math.round(h * dpr); }
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, w, h);

  /* fit every deck stacked */
  const gap = 1.6;
  const totalH = plan.decks.reduce((a, d) => a + (d.bottom - d.top) + gap, 0) - gap;
  const maxW = Math.max(...plan.decks.map((d) => d.width));
  const U = Math.max(14, Math.min(plan.U, (w - 40) / maxW, (h - 40) / totalH)) * interior.view.zoom;
  const ox = w / 2 - (maxW / 2) * U + interior.view.panX;
  let oy = h / 2 - (totalH / 2) * U + interior.view.panY;

  /* grid */
  ctx.strokeStyle = "rgba(90,140,190,0.08)";
  ctx.lineWidth = 1;
  const g = U / 2;
  for (let x = ox % g; x < w; x += g) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke(); }
  for (let y = oy % g; y < h; y += g) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke(); }

  interior.deckOrigins = [];
  for (const d of plan.decks) {
    const base = oy - d.top * U; // y of corridor top (grid 0)
    interior.deckOrigins[d.index] = { ox, oy: base, U };
    const X = (u) => ox + u * U, Y = (u) => base + u * U;
    /* deck label */
    ctx.fillStyle = "rgba(160,205,235,0.55)";
    ctx.font = `${Math.max(9, U * 0.22)}px ui-monospace, monospace`;
    ctx.fillText(`${d.name} · ${plan.hullName.toUpperCase()}`, X(0), Y(d.top) - 4);
    /* corridor */
    ctx.fillStyle = "rgba(110,180,230,0.07)";
    ctx.fillRect(X(0), Y(0), d.width * U, U);
    ctx.strokeStyle = "rgba(126,200,255,0.45)";
    ctx.setLineDash([6, 4]);
    ctx.strokeRect(X(0), Y(0), d.width * U, U);
    ctx.setLineDash([]);
    /* lift */
    if (plan.decks.length > 1) {
      ctx.strokeStyle = "#ffc857";
      ctx.lineWidth = 1.5;
      ctx.strokeRect(X(plan.liftX - 0.35), Y(0.15), U * 0.7, U * 0.7);
      ctx.fillStyle = "rgba(255,200,87,0.7)";
      ctx.font = `${Math.max(8, U * 0.16)}px ui-monospace, monospace`;
      ctx.fillText("LIFT", X(plan.liftX - 0.3), Y(0.6));
    }
    for (const r of plan.rooms.filter((r) => r.deck === d.index)) {
      const sel = interior.selected && interior.peds.get(interior.selected)?.room === r.id;
      const isBridge = r.kind === "bridge";
      ctx.fillStyle = sel ? "rgba(126,231,255,0.14)" : isBridge ? "rgba(126,231,255,0.08)" : r.industrial ? "rgba(255,200,87,0.05)" : "rgba(110,180,230,0.05)";
      ctx.fillRect(X(r.x), Y(r.y), r.w * U, r.h * U);
      ctx.strokeStyle = sel ? "#7ce7ff" : r.kind === "brig" ? "rgba(255,120,120,0.7)" : "rgba(126,200,255,0.6)";
      ctx.lineWidth = sel ? 2 : 1.2;
      ctx.strokeRect(X(r.x), Y(r.y), r.w * U, r.h * U);
      /* door */
      ctx.strokeStyle = "#9fe8b0";
      ctx.lineWidth = 3;
      ctx.beginPath();
      const dy = r.y < 0 ? Y(0) : Y(1);
      ctx.moveTo(X(r.door.x) - U * 0.14, dy);
      ctx.lineTo(X(r.door.x) + U * 0.14, dy);
      ctx.stroke();
      /* sensor nodes: diamonds in the corners */
      ctx.fillStyle = "rgba(159,232,176,0.8)";
      for (let i = 0; i < r.sensors; i++) {
        const sx = i === 0 ? X(r.x) + 5 : X(r.x + r.w) - 5;
        const sy = Y(r.y + r.h) - 5;
        ctx.beginPath(); ctx.moveTo(sx, sy - 3); ctx.lineTo(sx + 3, sy); ctx.lineTo(sx, sy + 3); ctx.lineTo(sx - 3, sy); ctx.closePath(); ctx.fill();
      }
      if (U > 18) {
        ctx.fillStyle = sel ? "#cfeeff" : "rgba(160,205,235,0.8)";
        ctx.font = `${Math.max(8, U * 0.19)}px ui-monospace, monospace`;
        ctx.fillText(r.name.toUpperCase(), X(r.x) + 4, Y(r.y) + 11);
      }
    }
  }

  /* people */
  const P = (p) => { const o = interior.deckOrigins[p.deck]; return [o.ox + p.x * o.U, o.oy + p.y * o.U, o.U]; };
  for (const b of interior.robots) {
    const [x, y, u] = P(b);
    ctx.fillStyle = "#ffc857";
    ctx.fillRect(x - Math.max(2, u * 0.05), y - Math.max(2, u * 0.05), Math.max(4, u * 0.1), Math.max(4, u * 0.1));
  }
  for (const m of crew.aboard) {
    const p = interior.peds.get(m.id);
    if (!p) continue;
    const [x, y, u] = P(p);
    const r = Math.max(2.5, u * 0.07);
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fillStyle = m.synthetic ? "#c9a8ff" : m.morale < 35 ? "#ff8c8c" : "#7ce7ff";
    ctx.fill();
    if (captain.holder === m.id) { ctx.strokeStyle = "#fff2aa"; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(x, y, r + 3, 0, Math.PI * 2); ctx.stroke(); }
    if (interior.selected === m.id) { ctx.strokeStyle = "#7ce7ff"; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(x, y, r + 5, 0, Math.PI * 2); ctx.stroke(); }
    if (u > 18) { ctx.fillStyle = "rgba(207,238,255,0.85)"; ctx.font = `${Math.max(8, u * 0.16)}px ui-monospace, monospace`; ctx.fillText(m.name.split(" ")[0], x + r + 3, y + 3); }
  }
  /* you */
  const cap = plan.bridge;
  const o = interior.deckOrigins[cap.deck];
  const yx = o.ox + (cap.x + cap.w * 0.5) * o.U, yy = o.oy + (cap.y + cap.h * 0.55) * o.U;
  ctx.beginPath(); ctx.arc(yx, yy, Math.max(3, o.U * 0.08), 0, Math.PI * 2);
  ctx.fillStyle = "#fff2aa"; ctx.fill();
  if (captain.holder === "player") { ctx.strokeStyle = "#fff2aa"; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(yx, yy, Math.max(3, o.U * 0.08) + 3, 0, Math.PI * 2); ctx.stroke(); }
  if (o.U > 18) { ctx.fillStyle = "#fff2aa"; ctx.font = `${Math.max(8, o.U * 0.16)}px ui-monospace, monospace`; ctx.fillText((sim.callsign || "YOU").toUpperCase(), yx + 8, yy + 3); }
  /* intruders */
  for (const i of boarding.intruders) {
    if (i.deck == null) continue;
    const [x, y, u] = P(i);
    ctx.fillStyle = "#ff5f5f";
    ctx.beginPath(); ctx.moveTo(x, y - u * 0.09); ctx.lineTo(x + u * 0.08, y + u * 0.07); ctx.lineTo(x - u * 0.08, y + u * 0.07); ctx.closePath(); ctx.fill();
    if (u > 18) { ctx.fillStyle = "#ff8c8c"; ctx.font = `${Math.max(8, u * 0.14)}px ui-monospace, monospace`; ctx.fillText(`${Math.max(0, Math.round(i.hp))}%`, x + u * 0.12, y + 3); }
  }
}

function crewAt(px, py) {
  for (const m of crew.aboard) {
    const p = interior.peds.get(m.id);
    if (!p) continue;
    const o = interior.deckOrigins?.[p.deck];
    if (!o) continue;
    const x = o.ox + p.x * o.U, y = o.oy + p.y * o.U;
    if (Math.hypot(px - x, py - y) < Math.max(8, o.U * 0.16)) return m;
  }
  return null;
}

/* ---- the rail ------------------------------------------------------------ */

function paintRail() {
  const plan = interior.plan;
  const rep = interior.rep;
  $("in-hull").textContent = `${plan.hullName.toUpperCase()} · TIER ${plan.tier} · ${plan.decks.length} DECK${plan.decks.length > 1 ? "S" : ""}`;
  $("in-conn").textContent = `CONN: ${holderName().toUpperCase()}${captain.goal ? ` · ${captain.goal.action.toUpperCase()}` : ""}`;
  const r = interiorReport();
  rep.innerHTML = "";
  const line = (k, v, cls) => { const d = el("div", `in-row ${cls ?? ""}`); d.append(el("span", "k", k), el("span", "v", String(v))); rep.append(d); };
  line("ALLIED", r.allied, "good");
  line("SYNTHETIC", r.synthetic, r.synthetic ? "syn" : "");
  line("ROBOTICS", r.robotics, "amber");
  line("SENSOR NODES", r.sensors);
  line("INTRUDERS", r.intruders, r.intruders ? "hot" : "");
  if (boarding.brig.length) line("IN THE BRIG", boarding.brig.map((b) => b.name.split(" ")[0]).join(", "), "amber");
  if (boarding.pods.length) line("BREACH POD", `${Math.max(0, Math.round(boarding.pods[0].eta - sim.time))} s`, "hot");
  if (r.lowMorale.length) line("UNSETTLED", r.lowMorale.join(", "), "hot");

  /* who is at a console right now, and what it is doing for the hull */
  const fx = crewEffects(interior.planKey.split(":")[0], sim.callsign, sim.time);
  const man = $("in-manned");
  man.innerHTML = "";
  if (!crew.aboard.length) man.append(el("div", "in-empty", "No watch to stand."));
  else if (!fx.manned.size) man.append(el("div", "in-empty", "Whole crew off shift — mess and quarters."));
  for (const [kind, names] of fx.manned) {
    const label = kind === "industry" ? (plan.industrial[0]?.name ?? "Works") : ({ eng: "Engineering", sensor: "Sensors", sec: "Security", med: "Medbay", cargo: "Cargo", office: "Office", bridge: "Bridge", agri: "Agri", lab: "Lab", quarters: "Quarters", mess: "Mess", airlock: "Airlock", brig: "Brig", captain: "Cabin", works: "Works" }[kind] ?? kind);
    const d = el("div", "in-row good");
    d.append(el("span", "k", label.toUpperCase()), el("span", "v", names.join(", ")));
    man.append(d);
  }
  if (crew.aboard.length > 0 && !fx.manned.has("eng") && fx.plan.rooms.some((x) => x.kind === "eng")) {
    const d = el("div", "in-row hot");
    d.append(el("span", "k", "ENGINEERING"), el("span", "v", "UNMANNED"));
    man.append(d);
  }

  /* outside: scan range */
  const scan = (sim.ship.mods?.scan ?? 1) * 12000;
  const out = $("in-scan");
  out.innerHTML = "";
  const p = sim.ship.pos;
  const items = [];
  for (const c of contacts) if (c.hp > 0) { const d = Math.hypot(c.x - p.x, c.y - p.y, c.z - p.z); if (d <= scan) items.push({ name: c.name, tag: c.kind === "peer" ? "PILOT" : c.kind.toUpperCase(), rel: c.relation, d }); }
  for (const st of stations) { const d = Math.hypot(st.x - p.x, st.y - p.y, st.z - p.z); if (d <= scan) items.push({ name: st.name, tag: "PORT", rel: st.hostile && !st.claimed ? "hostile" : "neutral", d }); }
  items.sort((a, b) => a.d - b.d);
  if (!items.length) out.append(el("div", "in-empty", `Nothing inside ${Math.round(scan / 1000)}k u.`));
  for (const it of items.slice(0, 8)) {
    const d = el("div", `in-row ${it.rel === "hostile" ? "hot" : it.rel === "ally" ? "good" : ""}`);
    d.append(el("span", "k", `${it.tag} ${it.name}`), el("span", "v", `${Math.round(it.d)} u`));
    out.append(d);
  }

  /* crew list — rebuilt only when it changes, so a tap never lands on a detached button */
  const list = $("in-crew");
  const key = crew.aboard.map((m) => `${m.id}:${interior.peds.get(m.id)?.room}:${interior.selected === m.id}:${captain.holder === m.id}`).join("|");
  if (key === interior.crewKey) return;
  interior.crewKey = key;
  list.innerHTML = "";
  if (!crew.aboard.length) list.append(el("div", "in-empty", "No hands aboard. Hire at a port's hiring hall."));
  for (const m of crew.aboard) {
    const pd = interior.peds.get(m.id);
    const room = pd ? plan.rooms[pd.room]?.name : "—";
    const b = el("button", `in-hand ${interior.selected === m.id ? "sel" : ""} ${captain.holder === m.id ? "conn" : ""}`);
    b.append(el("span", "nm", m.name), el("span", "st", `${m.title} · ${room}${captain.holder === m.id ? " · CONN" : ""}`));
    b.addEventListener("click", () => { interior.selected = m.id; paintDialogue(); paintRail(); });
    list.append(b);
  }
}

function paintDialogue() {
  const box = $("in-talk");
  const m = crew.aboard.find((x) => x.id === interior.selected);
  if (!m) { box.hidden = true; interior.talkRefresh?.stop?.(); interior.talkRefresh = null; return; }
  box.hidden = false;
  const closeTalk = () => { interior.selected = null; interior.talkRefresh?.stop?.(); interior.talkRefresh = null; paintDialogue(); paintRail(); };
  const extra = [];
  if (captain.holder === "player" && !m.robot) extra.push({ label: "Take the conn", cls: "accent", run: () => { const r = transferCommand(m.id); paintRail(); return r.ok ? connLine(m) : r.error; } });
  else if (captain.holder === m.id) extra.push({ label: "Stand down — I have the ship", cls: "danger", run: () => { retakeCommand(); paintRail(); return `${m.name.split(" ")[0]}: "Aye. She's yours."`; } });
  extra.push({ label: "Dismiss", cls: "danger", run: () => { if (captain.holder === m.id) retakeCommand(); dismissCrew(m.id); closeTalk(); } });
  extra.push({ label: "Close", run: closeTalk });
  /* the shared talk view (crew/talkview.js) — the console's CREW › TALK mounts the same thing */
  interior.talkRefresh?.stop?.();
  interior.talkRefresh = mountTalk(box, m.id, { onChange: paintRail, extra, btnClass: "btn tiny" });
  if (captain.holder === m.id && captain.log.length) {
    const lg = el("div", "in-talk-log");
    for (const e of captain.log.slice(0, 4)) lg.append(el("div", null, e.text));
    box.append(lg);
  }
}

function connLine(m) {
  const f = m.name.split(" ")[0];
  const t = m.traits ?? {};
  if (t.caution > 0.6) return `${f}: "I have the conn. We're not doing anything stupid while I hold it."`;
  if (t.greed > 0.6) return `${f}: "I have the conn. Let's make this hull pay."`;
  return `${f}: "I have the conn."`;
}

/* ---- mount ---------------------------------------------------------------- */

export function mountInterior() {
  if (interior.root) return interior;
  const root = el("div", "in-root");
  root.id = "interior";
  root.hidden = true;
  root.innerHTML = `
    <div class="in-sweep"></div>
    <div class="in-head">
      <div><b id="in-hull">—</b><span id="in-conn">—</span></div>
      <button type="button" class="btn icon-btn" id="in-close" aria-label="Back to the seat">SEAT</button>
    </div>
    <canvas class="in-canvas" id="in-canvas"></canvas>
    <aside class="in-rail">
      <h4>INTERIOR SENSORS</h4><div id="in-rep"></div>
      <h4>WATCH</h4><div id="in-manned"></div>
      <h4>SCAN RANGE</h4><div id="in-scan"></div>
      <h4>HANDS ABOARD</h4><div id="in-crew"></div>
    </aside>
    <div class="in-talk" id="in-talk" hidden></div>`;
  document.body.append(root);
  interior.root = root;
  interior.canvas = root.querySelector("#in-canvas");
  interior.ctx = interior.canvas.getContext("2d");
  interior.rep = root.querySelector("#in-rep");
  root.querySelector("#in-close").addEventListener("click", closeInterior);

  interior.canvas.addEventListener("pointerdown", (e) => {
    const rect = interior.canvas.getBoundingClientRect();
    const m = crewAt(e.clientX - rect.left, e.clientY - rect.top);
    interior.selected = m?.id ?? null;
    paintDialogue(); paintRail();
  });
  window.addEventListener("keydown", (e) => {
    const t = e.target;
    if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA")) return;
    if (e.code === "KeyI" && sim.phase === "play") toggleInterior();
    if (e.code === "Escape" && interior.open) closeInterior();
  });
  $("aux-deck")?.addEventListener("click", toggleInterior);

  let last = performance.now();
  const loop = () => {
    requestAnimationFrame(loop);
    const now = performance.now();
    const dt = Math.min(0.1, (now - last) / 1000);
    last = now;
    /* the fade is on the wall clock; the hull is a thing you can see dissolve */
    interior.fade += (interior.open ? 1 : -1) * dt * 1.8;
    interior.fade = Math.max(0, Math.min(1, interior.fade));
    sim.hullFade = interior.fade;
    if (sim.phase !== "play" && interior.open) closeInterior();
    if (now - interior.lastAux > 500) {
      interior.lastAux = now;
      const st = $("aux-deck-st");
      if (st) st.textContent = interior.open ? "OPEN" : captain.holder !== "player" ? "NPC CONN" : "READY";
      $("aux-deck")?.classList.toggle("hot", captain.holder !== "player");
    }
    if (!interior.open && interior.fade <= 0) return;
    const plan = ensurePlan();
    syncWalkers(plan);
    syncIntruders(plan);
    if (sim.phase === "play") tickWalkers(plan, dt * (sim.timeScale ?? 1));
    draw();
    if (now - interior.lastPaint > 500) { interior.lastPaint = now; paintRail(); interior.talkRefresh?.(); }
  };
  requestAnimationFrame(loop);
  if (window.__lg) window.__lg.interior = { interior, openInterior, closeInterior, ensurePlan };
  return interior;
}
