/* LIVING GALAXY — station blueprints.
 *
 * Every station grows a deterministic deck plan from its id: rooms sized to
 * its sector, corridors joining them, and a shift of crew and dockside
 * pedestrians walking the halls. Drawn blueprint-style on a canvas — grid,
 * cyan ink, dashed pressure doors — with live occupancy per room.
 */

function mulberry(seedStr) {
  let n = 0;
  for (let i = 0; i < seedStr.length; i++) n = Math.imul(n ^ seedStr.charCodeAt(i), 2654435761) >>> 0;
  let s = n || 7;
  return () => {
    s |= 0; s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const SECTOR_ROOMS = {
  logistic: [["Warehouse A", 3, 2], ["Warehouse B", 3, 2], ["Manifest Office", 2, 1]],
  military: [["Armory", 2, 2], ["Muster Hall", 3, 1], ["Brig", 1, 1]],
  industrial: [["Shipyard Bay", 4, 3], ["Foundry", 3, 2], ["Parts Store", 2, 1]],
  civilian: [["Promenade", 4, 2], ["Habitat Block", 3, 2], ["Lounge", 2, 1]],
  agricultural: [["Hydroponics", 4, 2], ["Vat Row", 3, 2], ["Seed Store", 1, 1]],
  pirate: [["Chop Shop", 3, 2], ["Den", 2, 2], ["Stores", 2, 1]],
};

/** Grows the deck plan. Cached per station id. */
const plans = new Map();
export function stationPlan(station) {
  /* ids restart at st1 every sky, so the key carries what makes this port itself */
  const key = `${station.id}:${station.name}:${station.sector}`;
  if (plans.has(key)) return plans.get(key);
  const rnd = mulberry(`${key}:plan`);
  const rooms = [];
  const U = 46; // grid cell px at zoom 1

  const core = [
    ["Dock Ring", 4, 1], ["Concourse", 3, 2], ["Ops Deck", 2, 1],
    ["Reactor", 2, 2], ["Medbay", 2, 1], ["Crew Barracks", 2, 2],
  ];
  const sector = SECTOR_ROOMS[station.sector] ?? SECTOR_ROOMS.civilian;
  const all = [...core, ...sector];

  /* pack rooms onto a ragged two-row spine off a central corridor */
  let xTop = 0, xBot = 0;
  all.forEach(([name, w, h], i) => {
    const top = i % 2 === 0;
    const x = top ? xTop : xBot;
    const y = top ? -h : 1; // corridor band occupies y ∈ [0,1)
    rooms.push({
      id: i, name, x, y, w, h,
      door: { x: x + w / 2, y: 0.5 },   // all doors open onto the corridor
      market: name === "Concourse", yard: name === "Shipyard Bay",
    });
    if (top) xTop += w + (rnd() < 0.4 ? 1 : 0);
    else xBot += w + (rnd() < 0.4 ? 1 : 0);
  });
  const width = Math.max(xTop, xBot);
  for (const r of rooms) r.door.x = Math.min(r.door.x, width - 0.5);

  /* people: crew on shift plus dockside peds */
  const peds = [];
  const n = 8 + Math.floor(rnd() * 8);
  for (let i = 0; i < n; i++) {
    const r = rooms[Math.floor(rnd() * rooms.length)];
    peds.push({
      kind: rnd() < 0.55 ? "crew" : "ped",
      x: r.x + rnd() * r.w, y: r.y + rnd() * r.h,
      room: r.id, target: null, path: [], wait: rnd() * 4, speed: 0.35 + rnd() * 0.3,
    });
  }
  const plan = { rooms, peds, width, U, corridor: { y0: 0, y1: 1 }, rnd };
  plans.set(key, plan);
  return plan;
}

/* route: room → door → corridor walk → door → room */
function routeTo(plan, p, room) {
  const cur = plan.rooms[p.room];
  const dst = room;
  p.path = [
    { x: cur.door.x, y: (cur.y < 0 ? cur.y + cur.h - 0.2 : cur.y + 0.2) },
    { x: cur.door.x, y: 0.5 },
    { x: dst.door.x, y: 0.5 },
    { x: dst.door.x, y: (dst.y < 0 ? dst.y + dst.h - 0.3 : dst.y + 0.3) },
    { x: dst.x + 0.4 + plan.rnd() * (dst.w - 0.8), y: dst.y + 0.4 + plan.rnd() * (dst.h - 0.8) },
  ];
  p.target = dst.id;
}

export function tickPlan(plan, dt) {
  for (const p of plan.peds) {
    if (p.wait > 0) { p.wait -= dt; continue; }
    if (!p.path.length) {
      routeTo(plan, p, plan.rooms[Math.floor(plan.rnd() * plan.rooms.length)]);
      continue;
    }
    const t = p.path[0];
    const dx = t.x - p.x, dy = t.y - p.y;
    const d = Math.hypot(dx, dy);
    const step = p.speed * dt;
    if (d <= step) {
      p.x = t.x; p.y = t.y;
      p.path.shift();
      if (!p.path.length) { p.room = p.target; p.wait = 2 + plan.rnd() * 6; }
    } else {
      p.x += (dx / d) * step;
      p.y += (dy / d) * step;
    }
  }
}

export function occupancy(plan) {
  const per = new Map();
  for (const p of plan.peds) {
    if (!p.path.length) per.set(p.room, (per.get(p.room) ?? 0) + 1);
  }
  return per;
}

/** Draws one frame. view = { zoom, panX, panY, selected } */
export function drawPlan(ctx, plan, view, w, h) {
  const U = plan.U * view.zoom;
  const ox = w / 2 - (plan.width / 2) * U + view.panX;
  const oy = h / 2 + view.panY;
  ctx.clearRect(0, 0, w, h);

  /* blueprint grid */
  ctx.strokeStyle = "rgba(90,140,190,0.08)";
  ctx.lineWidth = 1;
  const g = U / 2;
  for (let x = ox % g; x < w; x += g) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke(); }
  for (let y = oy % g; y < h; y += g) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke(); }

  const X = (u) => ox + u * U;
  const Y = (u) => oy + u * U;

  /* central corridor */
  ctx.fillStyle = "rgba(110,180,230,0.07)";
  ctx.fillRect(X(0), Y(0), plan.width * U, U);
  ctx.strokeStyle = "rgba(126,200,255,0.45)";
  ctx.setLineDash([6, 4]);
  ctx.strokeRect(X(0), Y(0), plan.width * U, U);
  ctx.setLineDash([]);

  /* rooms */
  for (const r of plan.rooms) {
    const sel = view.selected === r.id;
    ctx.fillStyle = sel ? "rgba(126,231,255,0.14)" : "rgba(110,180,230,0.05)";
    ctx.fillRect(X(r.x), Y(r.y), r.w * U, r.h * U);
    ctx.strokeStyle = sel ? "#7ce7ff" : "rgba(126,200,255,0.6)";
    ctx.lineWidth = sel ? 2 : 1.2;
    ctx.strokeRect(X(r.x), Y(r.y), r.w * U, r.h * U);
    /* door tick */
    ctx.strokeStyle = "#9fe8b0";
    ctx.lineWidth = 3;
    ctx.beginPath();
    const dy = r.y < 0 ? Y(0) : Y(1);
    ctx.moveTo(X(r.door.x) - U * 0.14, dy);
    ctx.lineTo(X(r.door.x) + U * 0.14, dy);
    ctx.stroke();
    /* label */
    if (U > 26) {
      ctx.fillStyle = sel ? "#cfeeff" : "rgba(160,205,235,0.8)";
      ctx.font = `${Math.max(9, U * 0.19)}px ui-monospace, monospace`;
      ctx.fillText(r.name.toUpperCase(), X(r.x) + 5, Y(r.y) + 13);
    }
  }

  /* people */
  for (const p of plan.peds) {
    ctx.beginPath();
    ctx.arc(X(p.x), Y(p.y), Math.max(2, U * 0.06), 0, Math.PI * 2);
    ctx.fillStyle = p.kind === "crew" ? "#7ce7ff" : "#ffc857";
    ctx.fill();
  }
}

export function roomAt(plan, view, w, h, px, py) {
  const U = plan.U * view.zoom;
  const ox = w / 2 - (plan.width / 2) * U + view.panX;
  const oy = h / 2 + view.panY;
  const ux = (px - ox) / U, uy = (py - oy) / U;
  return plan.rooms.find((r) => ux >= r.x && ux <= r.x + r.w && uy >= r.y && uy <= r.y + r.h) ?? null;
}
