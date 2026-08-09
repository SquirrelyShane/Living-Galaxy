// Living Galaxy — system chart. Square-root radial scale so the inner system stays
// readable while Obscura's 32,000 km orbit still fits on a phone screen.
//
// The chart is now a working instrument rather than a picture: drag to pan, pinch
// (or the +/− chips) to zoom, filter what's plotted, sweep a scan on whatever you
// selected, and drop into a chosen orbit band without flying it by hand.

import { S } from '../core/state.js';
import { $, el, fmtKm, clamp } from '../core/utils.js';
import { ORBIT_BANDS } from '../core/config.js';
import { setCourse, toggleWarp } from '../systems/warp.js';
import { startApproach, startOrbit } from '../systems/approach.js';
import { setTarget } from '../systems/targeting.js';
import { beginScan, scanReport, liveTier, TIER_NAME } from '../systems/scanner.js';
import { sfx } from '../systems/audio.js';
import { fieldTarget, fieldMid, parentOf } from '../systems/fields.js';
import { fleetRoster } from '../systems/fleet.js';

const MAX_R = 34000;
let overlay, canvas, ctx, info, scanBox, orbitMenu;
let btnCourse, btnTarget, btnApproach, btnScan, btnOrbit;
let open = false, timer = 0, selected = null;
let points = [];   // { x, y, obj, name, kind }

// view transform — zoom is a multiplier on the sqrt-scaled radius
const view = { zoom: 1, px: 0, py: 0 };
const filters = { planet: true, station: true, belt: true, ship: true };

export function initNavmap() {
  overlay = $('navmap-overlay');
  canvas = $('navmap-canvas');
  ctx = canvas.getContext('2d');
  info = $('navmap-info');
  scanBox = $('navmap-scan');
  orbitMenu = $('orbit-menu');
  btnCourse = $('navmap-course');
  btnApproach = $('navmap-approach');
  btnTarget = $('navmap-target');
  btnScan = $('navmap-scanbtn');
  btnOrbit = $('navmap-orbit');

  $('navmap-close').addEventListener('click', closeNavmap);
  gestures();

  document.querySelectorAll('#navmap-tools .chip[data-filter]').forEach(c => {
    c.addEventListener('click', () => {
      const k = c.dataset.filter;
      filters[k] = !filters[k];
      c.classList.toggle('on', filters[k]);
      draw();
      sfx.ui();
    });
  });
  $('navmap-zoom-in').addEventListener('click', () => zoomBy(1.45));
  $('navmap-zoom-out').addEventListener('click', () => zoomBy(1 / 1.45));
  $('navmap-recenter').addEventListener('click', () => {
    view.zoom = 1; view.px = 0; view.py = 0; draw(); sfx.ui();
  });

  btnCourse.addEventListener('click', () => {
    if (!selected) return;
    const obj = selected.obj || beltWaypoint(selected);
    setCourse(obj, selected.name);
    closeNavmap();
    if (S.warp.state === 'idle') toggleWarp();
  });
  btnApproach.addEventListener('click', () => {
    if (!selected || !selected.obj) return;
    setTarget(selected.obj, selected.kind, selected.name, 'neutral');
    closeNavmap();
    startApproach();   // sublight — crossing the system this way takes many minutes
  });
  btnTarget.addEventListener('click', () => {
    if (!selected || !selected.obj) return;
    setTarget(selected.obj, selected.kind, selected.name, 'neutral');
    closeNavmap();
  });
  btnScan.addEventListener('click', () => {
    if (!selected || !selected.obj) return;
    if (beginScan(selected.obj, selected.kind, selected.name)) showScan();
  });
  btnOrbit.addEventListener('click', toggleOrbitMenu);

  setButtons(false);
}

function zoomBy(f) {
  view.zoom = clamp(view.zoom * f, 0.6, 14);
  draw();
  sfx.ui();
}

export function openNavmap() {
  if (S.docked) return;
  open = true;
  overlay.classList.remove('hidden');
  hideOrbitMenu();
  resize();
  draw();
  sfx.ui();
}

export function closeNavmap() {
  open = false;
  hideOrbitMenu();
  overlay.classList.add('hidden');
}

export const navmapOpen = () => open;

export function tickNavmap(dt) {
  if (!open) return;
  timer += dt;
  if (timer < 0.12) return;
  timer = 0;
  draw();
  if (selected && selected.obj && scanBox && !scanBox.classList.contains('hidden')) showScan();
}

function resize() {
  const r = canvas.getBoundingClientRect();
  const dpr = Math.min(devicePixelRatio, 2);
  canvas.width = Math.max(1, Math.floor(r.width * dpr));
  canvas.height = Math.max(1, Math.floor(r.height * dpr));
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

// ── gestures ─────────────────────────────────────────────────────────
// One pointer pans (and taps, if it barely moved); two pointers pinch-zoom.
function gestures() {
  const active = new Map();
  let moved = 0, pinch0 = 0, zoom0 = 1;

  canvas.addEventListener('pointerdown', e => {
    active.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (active.size === 1) moved = 0;
    if (active.size === 2) { pinch0 = spread(active); zoom0 = view.zoom; }
    try { canvas.setPointerCapture(e.pointerId); } catch (_) {}
    e.preventDefault();
  });

  canvas.addEventListener('pointermove', e => {
    const prev = active.get(e.pointerId);
    if (!prev) return;
    const dx = e.clientX - prev.x, dy = e.clientY - prev.y;
    prev.x = e.clientX; prev.y = e.clientY;

    if (active.size >= 2) {
      const d = spread(active);
      if (pinch0 > 4) view.zoom = clamp(zoom0 * (d / pinch0), 0.6, 14);
    } else {
      view.px += dx; view.py += dy;
      moved += Math.abs(dx) + Math.abs(dy);
    }
    draw();
  });

  const end = e => {
    const prev = active.get(e.pointerId);
    active.delete(e.pointerId);
    if (prev && active.size === 0 && moved < 8) onTap(e);
    if (active.size < 2) pinch0 = 0;
  };
  canvas.addEventListener('pointerup', end);
  canvas.addEventListener('pointercancel', e => { active.delete(e.pointerId); });

  canvas.addEventListener('wheel', e => {
    zoomBy(e.deltaY < 0 ? 1.16 : 1 / 1.16);
    e.preventDefault();
  }, { passive: false });
}

function spread(map) {
  const [a, b] = [...map.values()];
  return Math.hypot(a.x - b.x, a.y - b.y);
}

// ── projection ───────────────────────────────────────────────────────
function project(x, z, cx, cy, sr) {
  const r = Math.hypot(x, z);
  const rr = Math.sqrt(Math.min(r, MAX_R) / MAX_R) * sr * view.zoom;
  const a = Math.atan2(z, x);
  return [cx + Math.cos(a) * rr + view.px, cy + Math.sin(a) * rr + view.py];
}

const ringR = (r, sr) => Math.sqrt(Math.min(r, MAX_R) / MAX_R) * sr * view.zoom;

function draw() {
  const w = canvas.clientWidth, h = canvas.clientHeight;
  const cx = w / 2, cy = h / 2, sr = Math.min(w, h) / 2 - 14;
  ctx.clearRect(0, 0, w, h);
  points = [];
  const ox = cx + view.px, oy = cy + view.py;

  // Four named belts as shaded annuli — each independently selectable for warp
  if (S.world.belts && filters.belt) {
    for (const belt of S.world.belts) {
      // A ring is drawn where its planet is, not as an annulus about the star — its
      // `inner`/`width` are radii from the parent. It gets a tappable point at the
      // planet's position instead, which is where warping to it actually takes you.
      if (belt.parentName) {
        const parent = parentOf(belt);
        if (!parent) continue;
        const [px, py] = project(parent.position.x, parent.position.z, cx, cy, sr);
        ctx.strokeStyle = 'rgba(200,220,240,.55)';
        ctx.beginPath(); ctx.ellipse(px, py, 7, 2.6, 0, 0, Math.PI * 2); ctx.stroke();
        points.push({ x: px, y: py - 6, obj: null, name: belt.name, kind: 'belt',
                      beltMid: fieldMid(belt), beltKey: belt.key });
        continue;
      }
      const lo = belt.inner, hi = belt.inner + belt.width;
      const rlo = ringR(lo, sr), rhi = ringR(hi, sr);
      ctx.fillStyle = 'rgba(180,150,90,.09)';
      ctx.beginPath();
      ctx.arc(ox, oy, rhi, 0, Math.PI * 2);
      ctx.arc(ox, oy, rlo, 0, Math.PI * 2, true);
      ctx.fill('evenodd');
      ctx.strokeStyle = 'rgba(200,170,110,.30)';
      ctx.setLineDash([3, 4]);
      const midR = (rlo + rhi) / 2;
      ctx.beginPath(); ctx.arc(ox, oy, midR, 0, Math.PI * 2); ctx.stroke();
      ctx.setLineDash([]);
      points.push({
        x: ox, y: oy - midR, obj: null, name: belt.name, kind: 'belt',
        beltMid: (lo + hi) / 2, beltKey: belt.key
      });
    }
  }

  // orbit rings
  ctx.strokeStyle = 'rgba(60,130,210,.18)';
  ctx.lineWidth = 1;
  for (const b of S.world.bodies) {
    const u = b.userData;
    if (u.kind === 'planet' && !filters.planet) continue;
    if (u.kind === 'station' && !filters.station) continue;
    if (u.kind !== 'planet' && u.kind !== 'station') continue;
    ctx.beginPath();
    ctx.arc(ox, oy, ringR(u.orbitRadius, sr), 0, Math.PI * 2);
    ctx.stroke();
  }

  // single asteroids ONLY within the ship's scanner range
  if (filters.belt) {
    const scan = S.stats.sensor;
    const pp = S.player.position;
    ctx.fillStyle = 'rgba(220,190,120,.9)';
    let shown = 0;
    for (const a of S.world.asteroids) {
      if (a.ore <= 0) continue;
      if (a.position.distanceToSquared(pp) > scan * scan) continue;
      const [x, y] = project(a.position.x, a.position.z, cx, cy, sr);
      ctx.fillRect(x - 1, y - 1, 2, 2);
      if (shown < 40) points.push({ x, y, obj: a, name: a.name, kind: 'asteroid' });
      shown++;
    }
    if (shown) {
      ctx.fillStyle = 'rgba(220,190,120,.6)';
      ctx.font = '8px ui-monospace,monospace';
      ctx.fillText(`${shown} rocks in scanner range`, 8, h - 8);
    }
  }

  // star
  {
    const [sx, sy] = project(0, 0, cx, cy, sr);
    dot(sx, sy, 6, '#ffdc70', 'Solaris Prime');
    points.push({ x: sx, y: sy, obj: S.world.bodies[0], name: 'Solaris Prime', kind: 'star' });
  }

  for (const b of S.world.bodies) {
    const u = b.userData;
    if (u.kind === 'planet' && filters.planet) {
      const [x, y] = project(b.position.x, b.position.z, cx, cy, sr);
      dot(x, y, 5, '#7ec8ff', u.name);
      points.push({ x, y, obj: b, name: u.name, kind: 'planet' });
    } else if (u.kind === 'station' && filters.station) {
      const [x, y] = project(b.position.x, b.position.z, cx, cy, sr);
      square(x, y, 4, '#' + u.color.toString(16).padStart(6, '0'), u.name);
      points.push({ x, y, obj: b, name: u.name, kind: 'station' });
    }
  }

  // ships — hostiles as red blips, everything else faint, all now tappable
  if (filters.ship) {
    // Contracted hulls are plotted whatever the sensor says. The company knows where its
    // own ships are — that is what a contract is — and an executive commanding a fleet
    // they cannot see on the chart was the last thing in the command console that only
    // existed as a list. On objective they are drawn brighter with a ring; idle ones are
    // marked but quiet.
    const contracted = new Map();
    for (const c of fleetRoster()) contracted.set(c.name, c);

    for (const n of S.world.npcs) {
      const u = n.userData;
      const mine = contracted.get(u.name);
      if (u.hp <= 0 || (u.ambush && !u.triggered)) continue;
      const hostile = u.faction === 'hostile';
      const [x, y] = project(n.position.x, n.position.z, cx, cy, sr);

      if (mine) {
        ctx.fillStyle = mine.busy ? 'rgba(120,255,170,.95)' : 'rgba(120,255,170,.55)';
        ctx.fillRect(x - 2, y - 2, 4, 4);
        if (mine.busy) {
          ctx.strokeStyle = 'rgba(120,255,170,.7)';
          ctx.beginPath(); ctx.arc(x, y, 5.5, 0, Math.PI * 2); ctx.stroke();
        }
        points.push({ x, y, obj: n, name: u.name, kind: 'ship', faction: u.faction,
                      contract: mine.id, objective: mine.busy });
        continue;
      }

      ctx.fillStyle = hostile ? 'rgba(255,90,60,.7)' : 'rgba(110,200,255,.45)';
      ctx.fillRect(x - 1.5, y - 1.5, 3, 3);
      if (n.position.distanceToSquared(S.player.position) < S.stats.sensor * S.stats.sensor)
        points.push({ x, y, obj: n, name: u.name, kind: 'ship', faction: u.faction });
    }
  }

  // player + scanner radius
  const [px, py] = project(S.player.position.x, S.player.position.z, cx, cy, sr);
  {
    const edge = project(S.player.position.x + S.stats.sensor, S.player.position.z, cx, cy, sr);
    const rr = Math.hypot(edge[0] - px, edge[1] - py);
    ctx.strokeStyle = 'rgba(90,200,140,.25)';
    ctx.setLineDash([2, 4]);
    ctx.beginPath(); ctx.arc(px, py, rr, 0, Math.PI * 2); ctx.stroke();
    ctx.setLineDash([]);
  }
  ctx.strokeStyle = '#fff';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(px, py, 5, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(px, py);
  ctx.lineTo(px - Math.sin(S.player.yaw) * 13, py - Math.cos(S.player.yaw) * 13);
  ctx.stroke();

  // course line to the selection, so the chart shows intent
  if (selected) {
    const p = points.find(p2 => (selected.obj ? p2.obj === selected.obj : p2.name === selected.name));
    if (p) {
      ctx.strokeStyle = 'rgba(92,224,138,.35)';
      ctx.setLineDash([4, 5]);
      ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(p.x, p.y); ctx.stroke();
      ctx.setLineDash([]);
      ctx.strokeStyle = '#5ce08a';
      ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.arc(p.x, p.y, 11, 0, Math.PI * 2); ctx.stroke();
    }
  }

  // zoom readout
  ctx.fillStyle = 'rgba(140,190,220,.55)';
  ctx.font = '8px ui-monospace,monospace';
  ctx.fillText(`×${view.zoom.toFixed(1)}`, 8, 12);
}

function dot(x, y, r, color, label) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
  labelAt(x, y, r, label);
}

function square(x, y, s, color, label) {
  ctx.fillStyle = color;
  ctx.fillRect(x - s, y - s, s * 2, s * 2);
  labelAt(x, y, s, label);
}

function labelAt(x, y, r, label) {
  ctx.fillStyle = 'rgba(190,220,245,.7)';
  ctx.font = '9px ui-monospace,monospace';
  ctx.fillText(label, x + r + 3, y + 3);
}

// The belt has no single body, so warping "to the belt" aims at the nearest point
// on the belt's mid-radius circle — a synthetic target the warp drive can chase.
function beltWaypoint(sel) {
  const f = (S.world.belts || []).find(x => x.key === sel.beltKey);
  if (f) return fieldTarget(f, S.player.position);
  // A selection with no field behind it (a stale tap, a restored session) still has to
  // produce something warpable rather than a null the drive will choke on.
  const p = S.player.position;
  const ang = Math.atan2(p.z, p.x);
  const r = sel.beltMid || 0;
  return {
    position: new THREE.Vector3(Math.cos(ang) * r, 0, Math.sin(ang) * r),
    userData: { name: sel.name || 'Asteroid Belt', radius: 0, kind: 'belt', beltMid: r }
  };
}

function onTap(e) {
  const rect = canvas.getBoundingClientRect();
  const mx = e.clientX - rect.left, my = e.clientY - rect.top;
  let best = null, bd = 30 * 30;
  for (const p of points) {
    const d = (p.x - mx) ** 2 + (p.y - my) ** 2;
    if (d < bd) { bd = d; best = p; }
  }
  hideOrbitMenu();
  if (!best) {
    selected = null;
    info.textContent = 'Tap a body to select it. Drag to pan, pinch to zoom.';
    if (scanBox) scanBox.classList.add('hidden');
    setButtons(false);
    draw();
    return;
  }

  selected = best;
  if (best.kind === 'belt') {
    const f = (S.world.belts || []).find(x => x.key === best.beltKey);
    info.innerHTML = f && f.parentName
      ? `<b>${best.name}</b> — planetary ring · ${fmtKm(best.beltMid)} from ${f.parentName} · volatile-rich`
      : `<b>${best.name}</b> — mining field · mid-orbit ${fmtKm(best.beltMid)} · warp in, then MATCH a rock`;
  } else {
    const dist = S.player.position.distanceTo(best.obj.position);
    const u = best.obj.userData || {};
    const cat = u.category;
    const tier = liveTier(best.obj);
    const extra = best.kind === 'station' ? ' · trade, repair, refit, shipyard'
      : best.kind === 'asteroid' ? ` · ore ${Math.round(best.obj.ore)} kg`
      : best.kind === 'planet' ? ' · orbit to scan & probe' : '';
    info.innerHTML = `<b>${best.name}</b> — ${cat || best.kind} · ${fmtKm(dist)} out${extra}` +
      `<br><span style="color:var(--good)">sensor: ${TIER_NAME[tier]}</span>`;
  }
  setButtons(true);
  showScan();
  sfx.ui();
  draw();
}

function showScan() {
  if (!scanBox || !selected || !selected.obj) { if (scanBox) scanBox.classList.add('hidden'); return; }
  const rep = scanReport(selected.obj, selected.kind, selected.name);
  scanBox.classList.remove('hidden');
  scanBox.innerHTML =
    `<div class="hdr">Sensor return — ${TIER_NAME[rep.tier]}</div>` +
    rep.rows.map(r => `<div class="sr"><span class="k">${r[0]}</span><span class="v">${r[1]}</span></div>`).join('') +
    `<div class="note">${rep.note}</div>`;
}

// ── orbit band menu ──────────────────────────────────────────────────
function toggleOrbitMenu() {
  if (!orbitMenu) return;
  if (!orbitMenu.classList.contains('hidden')) { hideOrbitMenu(); return; }
  if (!selected || !selected.obj) return;
  const kind = selected.kind;
  if (kind !== 'planet' && kind !== 'moon' && kind !== 'star') return;

  const list = $('orbit-menu-list');
  list.innerHTML = '';
  const radius = (selected.obj.userData && selected.obj.userData.radius) || 40;
  for (const band of ORBIT_BANDS) {
    const r = Math.round(radius * band.mult);
    const b = el('button', 'om-item');
    b.innerHTML = `<span><span>${band.name}</span><br><span class="om-note">${band.note}</span></span>` +
      `<span class="om-r">${fmtKm(r)}</span>`;
    b.addEventListener('click', () => {
      setTarget(selected.obj, selected.kind, selected.name, 'neutral');
      hideOrbitMenu();
      closeNavmap();
      startOrbit(band.mult, band.name);
    });
    list.appendChild(b);
  }
  orbitMenu.classList.remove('hidden');
  sfx.ui();
}

function hideOrbitMenu() {
  if (orbitMenu) orbitMenu.classList.add('hidden');
}

function setButtons(on) {
  const hasObj = !!(on && selected && selected.obj);
  const orbital = hasObj && ['planet', 'moon', 'star'].includes(selected.kind);
  btnCourse.disabled = !on;
  btnTarget.disabled = !hasObj;
  btnApproach.disabled = !hasObj;
  btnScan.disabled = !hasObj;
  btnOrbit.disabled = !orbital;
}
