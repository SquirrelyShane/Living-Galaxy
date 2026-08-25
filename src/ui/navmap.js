// Living Galaxy — system chart. Square-root radial scale so the inner system stays
// readable while Obscura's 32,000 km orbit still fits on a phone screen.
//
// The chart is now a working instrument rather than a picture: drag to pan, pinch
// (or the +/− chips) to zoom, filter what's plotted, sweep a scan on whatever you
// selected, and drop into a chosen orbit band without flying it by hand.

import { S } from '../core/state.js';
import { $, el, fmtKm, clamp } from '../core/utils.js';
import { ORBIT_BANDS } from '../core/config.js';
import { setCourse, toggleWarp } from '../systems/flight/warp.js';
import { startApproach, startOrbit } from '../systems/flight/approach.js';
import { setTarget } from '../systems/flight/targeting.js';
import { beginScan, scanReport, liveTier, TIER_NAME, scanOrigin } from '../systems/industry/scanner.js';
import { detectionRange, npcSignature } from '../systems/combat/detection.js';
import { ROCK_CAP } from '../systems/flight/contacts.js';
import { ownerOfHull, OWN } from '../systems/company/ownership.js';

/**
 * The eye the chart is drawn from. Docked, that is the station and its array; flying, the
 * ship and its own. Everything range-based on this screen goes through here so the ring,
 * the rocks, the traffic and the scan all agree about what can be seen from where.
 */
const eye = () => scanOrigin();
import { sfx } from '../systems/platform/audio.js';
import { fieldTarget, fieldMid, parentOf } from '../systems/flight/fields.js';
import { fleetRoster } from '../systems/company/fleet.js';
import { feed, detail } from '../systems/platform/telemetry.js';
import { canPilot } from '../systems/company/career.js';

const MAX_R = 34000;
let overlay, canvas, ctx, info, scanBox, orbitMenu;
let paneChart, paneDetail, paneTel, tabDot, legendBox;
let telHead, telGroups, telDetail;
let pane = 'chart';
let btnCourse, btnTarget, btnApproach, btnScan, btnOrbit;
let open = false, timer = 0, selected = null;
let points = [];   // { x, y, obj, name, kind }
let telRows = [];  // flattened telemetry rows, index-addressed by each row's data-i
let telTimer = 0;

/**
 * Where closing the chart should put you.
 *
 * The chart used to be a leaf: whatever opened it was closed first, and closing the chart
 * left you wherever the game happened to be. From the flight bar that is correct — you
 * came from the cockpit and the cockpit is still there. From Ops it was a dead end: the
 * OPEN SYSTEM CHART button closed Ops, and closing the chart dropped you into the canopy,
 * so getting back to the fleet list meant OPS → Staff → scroll, every time. From the
 * executive deck it would be worse than a dead end, because for that career there is
 * nothing behind the chart at all.
 *
 * So the opener says where back is. `null` means the cockpit — the old behaviour, and
 * still the right one for the NAV key on the flight bar.
 */
let returnTo = null;
/** True while the chart was opened by a surface that has no flight HUD behind it. */
let detached = false;

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

  paneChart = $('navmap-chart');
  paneDetail = $('navmap-detail');
  paneTel = $('navmap-telemetry');
  telHead = $('tel-head');
  telGroups = $('tel-groups');
  telDetail = $('tel-detail');
  tabDot = $('navmap-dot');
  legendBox = $('navmap-legend');

  $('navmap-close').addEventListener('click', () => closeNavmap());

  // Telemetry rows are delegated rather than bound per row: the list is rebuilt twice a
  // second and per-row listeners on a rebuilt list is a leak with a nice syntax.
  if (telGroups) telGroups.addEventListener('click', e => {
    const t = e && e.target;
    const row = (t && typeof t.closest === 'function') ? t.closest('.tel-row') : null;
    if (!row) return;
    selectTelemetryRow(parseInt(row.dataset.i, 10));
  });
  gestures();

  document.querySelectorAll('#navmap-tabs .tab').forEach(t => {
    t.addEventListener('click', () => { showPane(t.dataset.pane); sfx.ui(); });
  });
  $('navmap-legendbtn').addEventListener('click', () => {
    const on = legendBox.classList.toggle('hidden') === false;
    $('navmap-legendbtn').classList.toggle('on', on);
    if (on) renderLegend();
    sfx.ui();
  });

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
    // The return prints on the other pane, so go there. A button whose output appears on a
    // screen you are not looking at reads as a button that did nothing.
    if (beginScan(selected.obj, selected.kind, selected.name)) { showScan(); showPane('detail'); }
  });
  btnOrbit.addEventListener('click', toggleOrbitMenu);

  setButtons(false);
}

function zoomBy(f) {
  view.zoom = clamp(view.zoom * f, 0.6, 14);
  draw();
  sfx.ui();
}

/**
 * Open the chart.
 *
 * @param {object} [opts]
 * @param {'chart'|'detail'|'telemetry'} [opts.pane]  which pane to land on
 * @param {Function} [opts.returnTo]  what to show when the chart is closed
 * @param {boolean} [opts.hideFlight] the opener has no flight HUD behind it
 * @param {string}  [opts.only]      plot only this class — 'belt', 'station', 'ship', 'planet'
 * @param {object}  [opts.focus]     { obj, kind, name } to select and centre the view on
 * @param {number}  [opts.zoom]      zoom level to use when focusing
 */
export function openNavmap(opts) {
  // v1.02.20: this refused to open while docked, which made the chart a cockpit instrument
  // and left an executive who never undocks with no way to look at the system they are
  // giving orders about. It is an observation instrument now — viewing, scanning and
  // tracking work from the pad; the things that need a ship under you do not, and say so.
  const o = opts || {};
  returnTo = typeof o.returnTo === 'function' ? o.returnTo : null;
  detached = !!o.hideFlight;
  open = true;
  overlay.classList.remove('hidden');
  overlay.classList.toggle('detached', detached);
  hideOrbitMenu();
  showPane(o.pane || 'chart');
  // Opening the chart *at* something. ARIA uses this: asked to take the ship to a rock, it
  // opens the chart filtered to mineable contacts and centred on the one it picked, so the
  // pilot sees the decision rather than only its consequence. The chart is the instrument
  // that answers "where", and an assistant that flies without showing you where is a
  // teleport button.
  if (o.only) setOnlyFilter(o.only);
  if (o.focus && o.focus.obj) focusOn(o.focus, o.zoom);
  draw();
  sfx.ui();
}

/** Turn every filter off except one, and make the chips say so. */
function setOnlyFilter(only) {
  for (const k in filters) filters[k] = (k === only);
  document.querySelectorAll('#navmap-tools .chip[data-filter]').forEach(c =>
    c.classList.toggle('on', !!filters[c.dataset.filter]));
}

/**
 * Select a contact and pan the chart onto it.
 *
 * The pan is computed from the same `project()` the draw uses rather than from a second
 * copy of the transform: solve for the offset that puts this object at the centre. A
 * separate derivation here would be a second opinion about where things are, and the two
 * would drift the first time the projection changed.
 */
export function focusOn(focus, zoom) {
  const obj = focus.obj;
  if (!obj || !obj.position) return false;
  selected = { obj, kind: focus.kind || 'asteroid', name: focus.name || 'Contact' };
  if (zoom) view.zoom = clamp(zoom, 0.6, 14);
  const w = canvas.clientWidth || 300, h = canvas.clientHeight || 300;
  const sr = Math.min(w, h) / 2 - 14;
  view.px = 0; view.py = 0;
  const [x, y] = project(obj.position.x, obj.position.z, w / 2, h / 2, sr);
  view.px = (w / 2) - x;
  view.py = (h / 2) - y;
  setButtons(true);
  showScan();
  if (info) {
    const dist = eye().pos.distanceTo(obj.position);
    info.innerHTML = `<b>${selected.name}</b> — ${selected.kind} · ${fmtKm(dist)} out` +
      (selected.kind === 'asteroid' ? ` · ore ${Math.round(obj.ore || 0)} kg` : '');
  }
  return true;
}

export function closeNavmap() {
  open = false;
  hideOrbitMenu();
  overlay.classList.add('hidden');
  overlay.classList.remove('detached');
  // Hand the screen back to whoever asked for the chart. Captured and cleared before the
  // call so a `returnTo` that reopens the chart cannot leave a stale one behind it.
  const back = returnTo;
  returnTo = null;
  detached = false;
  if (back) back();
}

export const navmapOpen = () => open;

export function tickNavmap(dt) {
  if (!open) return;
  timer += dt;
  if (timer >= 0.12) {
    timer = 0;
    if (pane === 'chart') draw();
    if (selected && selected.obj && scanBox && !scanBox.classList.contains('hidden')) showScan();
  }
  // Telemetry is a list of a hundred-odd rows and refreshing it at chart rate is a lot of
  // innerHTML for numbers that move at orbital speed. Twice a second reads as live.
  if (pane === 'telemetry') {
    telTimer += dt;
    if (telTimer >= 0.5) { telTimer = 0; renderTelemetry(); }
  }
}

/**
 * Switch panes. The canvas has no size while its pane is hidden, so it is measured again on
 * the way back in — a chart drawn against a zero-width canvas comes back as a blank box,
 * which is the classic way a tabbed canvas breaks.
 */
function showPane(next) {
  pane = (next === 'detail' || next === 'telemetry') ? next : 'chart';
  paneChart.classList.toggle('hidden', pane !== 'chart');
  paneDetail.classList.toggle('hidden', pane !== 'detail');
  if (paneTel) paneTel.classList.toggle('hidden', pane !== 'telemetry');
  document.querySelectorAll('#navmap-tabs .tab').forEach(t =>
    t.classList.toggle('active', t.dataset.pane === pane));
  if (pane === 'detail') tabDot.classList.add('hidden');
  else if (pane === 'telemetry') { telTimer = 0; renderTelemetry(); }
  else { resize(); draw(); }
}

// ── telemetry pane ───────────────────────────────────────────────────
// The third pane, and the one an executive lives on. The chart answers "where is
// everything"; telemetry answers "what is everything, right now". The rows come from
// systems/telemetry.js so the same feed can be read by ARIA and asserted headlessly —
// this file only decides what it looks like.

function renderTelemetry() {
  if (!telGroups) return;
  const f = feed();
  if (telHead) {
    telHead.innerHTML =
      `<b>Live telemetry</b> — watching from ${f.from} · array ${fmtKm(f.range)}` +
      (S.stats.sensorRated && !S.docked
        ? ` <span class="tel-sub">of ${fmtKm(S.stats.sensorRated)} rated · scanner tier ${S.stats.scanTier || 0}</span>`
        : '') +
      `<br><span class="tel-sub">Charted objects are always listed. Traffic appears when ` +
      `the array can resolve it, so an empty traffic list is a quiet lane, not a fault.</span>`;
  }

  telRows = [];
  let html = '';
  for (const g of f.groups) {
    html += `<div class="tel-group"><div class="tel-gh">${g.label}` +
            `<span class="tel-c">${g.rows.length}</span></div>`;
    if (!g.rows.length) {
      html += `<div class="tel-empty">${g.note}</div>`;
    } else {
      for (const r of g.rows) {
        const i = telRows.push(r) - 1;
        const cls = r.faction === 'hostile' ? ' hostile'
                  : r.kind === 'asteroid' || r.kind === 'belt' ? ' rock' : '';
        html += `<div class="tel-row${cls}" data-i="${i}">` +
                `<span class="tr-n">${r.name}</span>` +
                `<span class="tr-l">${r.line}</span></div>`;
      }
    }
    html += '</div>';
  }
  telGroups.innerHTML = html;

  // Keep the open record live rather than freezing it at the moment it was tapped — the
  // whole claim of this pane is that the numbers are current.
  if (selected && selected.obj && telDetail && !telDetail.classList.contains('hidden')) {
    showTelemetryDetail(selected.obj, selected.kind, selected.name);
  }
}

/**
 * Select the nth row of the current telemetry feed.
 *
 * Exported because the delegated click above cannot be exercised headlessly — the test
 * DOM does not build child nodes out of an innerHTML string, so there is no row element
 * to dispatch at. This is the same entry point the handler uses, so the suite is testing
 * the real path rather than a parallel one written for it.
 */
export function selectTelemetryRow(i) {
  const rec = telRows[i];
  if (!rec) return null;
  selectFromTelemetry(rec);
  return rec;
}

/** The rows currently on the telemetry pane, for the suite and for ARIA. */
export const telemetryRows = () => telRows.slice();

function selectFromTelemetry(rec) {
  selected = { obj: rec.obj, name: rec.name, kind: rec.kind };
  setButtons(true);
  showTelemetryDetail(rec.obj, rec.kind, rec.name);
  showScan();
  sfx.ui();
  draw();
}

function showTelemetryDetail(obj, kind, name) {
  if (!telDetail) return;
  const rep = detail(obj, kind, name);
  if (!rep) { telDetail.classList.add('hidden'); return; }
  telDetail.classList.remove('hidden');
  telDetail.innerHTML =
    `<div class="hdr">${rep.title} — ${rep.sub}</div>` +
    rep.rows.map(r => `<div class="sr"><span class="k">${r[0]}</span><span class="v">${r[1]}</span></div>`).join('') +
    (rep.note ? `<div class="note">${rep.note}</div>` : '');
}

/**
 * What the shapes mean. Read off the same values `draw()` uses rather than written out
 * beside them, so a legend cannot quietly describe a colour the chart stopped using.
 */
const LEGEND = [
  ['Bodies', [
    ['dot', '#ffdc70', 'Star'],
    ['dot', '#7ec8ff', 'Planet or moon'],
    ['sq', '#b0c4d8', 'Station — coloured by owner'],
    ['sq', 'rgba(220,190,120,.9)', 'Asteroid in sensor range'],
    ['band', 'rgba(200,170,110,.55)', 'Belt']
  ]],
  ['Traffic', [
    ['sq', 'rgba(255,90,60,.9)', 'Hostile'],
    ['sq', 'rgba(110,200,255,.7)', 'Other traffic'],
    ['sq', 'rgba(120,255,170,.95)', 'Your hull'],
    ['ring', 'rgba(120,255,170,.9)', 'Your hull, on objective']
  ]],
  ['You', [
    ['ring', 'rgba(90,200,140,.7)', 'Sensor range'],
    ['ring', 'rgba(120,255,170,.9)', 'Selected']
  ]]
];

function renderLegend() {
  legendBox.innerHTML = LEGEND.map(([head, rows]) =>
    `<div class="hd">${head}</div>` + rows.map(([shape, colour, label]) => {
      const cls = shape === 'dot' ? 'sw dot' : shape === 'ring' ? 'sw ring' : 'sw';
      const style = shape === 'ring' ? `color:${colour}` : `background:${colour}`;
      return `<div class="lg"><span class="${cls}" style="${style}"></span>${label}</div>`;
    }).join('')).join('') +
    '<div class="hd">Off chart</div><div class="lg">Traffic your sensor cannot resolve is not plotted.</div>';
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
    const o = eye();
    const scan = o.range;
    const pp = o.pos;
    ctx.fillStyle = 'rgba(220,190,120,.9)';
    let shown = 0;
    for (const a of S.world.asteroids) {
      if (a.ore <= 0) continue;
      if (a.position.distanceToSquared(pp) > scan * scan) continue;
      const [x, y] = project(a.position.x, a.position.z, cx, cy, sr);
      ctx.fillRect(x - 1, y - 1, 2, 2);
      // The same cap the contact list carries, so a rock you can tap here is a rock you
      // can lock from the cockpit. Two different caps is how the chart and the list drifted
      // apart in the first place.
      if (shown < ROCK_CAP) points.push({ x, y, obj: a, name: a.name, kind: 'asteroid' });
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
    // The star's name comes off the system plan, not out of a string literal. This said
    // 'Solaris Prime' on every chart in every system until v1.02.33.
    const starName = (S.systemPlan && S.systemPlan.star && S.systemPlan.star.name) ||
                     (S.world.bodies[0] && S.world.bodies[0].userData &&
                      S.world.bodies[0].userData.name) || 'Star';
    dot(sx, sy, 6, '#ffdc70', starName);
    points.push({ x: sx, y: sy, obj: S.world.bodies[0], name: starName, kind: 'star' });
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

      // v1.02.00: plotted only if the sensor can actually see it. Every ship in the system
      // used to be drawn and only *tappability* was range-gated, so the chart showed you
      // the whole traffic picture of Solaris and then refused to let you touch most of it —
      // which is worse than either honest option, because it looks like information.
      //
      // Against `detectionRange`, not raw sensor range: the same asymmetry the ambush code
      // already uses. A laden hauler is a bigger return than a raider running quiet, so the
      // chart shows the freighter first and the thing hunting it last, which is the right
      // way round for a screen you check before committing to a lane.
      const o = eye();
      if (n.position.distanceToSquared(o.pos) >
          detectionRange(o.range, npcSignature(u)) ** 2) continue;

      // Somebody else's hull is still somebody's. A corp-owned ship gets a ring, so the
      // chart distinguishes "a raider" from "a Kessler raider" and "a hauler" from "a
      // Kestrel hauler" — which is what decides whether shooting it is a job or an incident.
      const own = ownerOfHull(n);
      ctx.fillStyle = hostile ? 'rgba(255,90,60,.7)' : 'rgba(110,200,255,.45)';
      ctx.fillRect(x - 1.5, y - 1.5, 3, 3);
      if (own.kind === OWN.CORP) {
        ctx.strokeStyle = hostile ? 'rgba(255,120,90,.45)' : 'rgba(150,200,240,.4)';
        ctx.beginPath(); ctx.arc(x, y, 4.5, 0, Math.PI * 2); ctx.stroke();
      }
      points.push({ x, y, obj: n, name: u.name, kind: 'ship', faction: u.faction,
                    owner: own.label });
    }
  }

  // player + scanner radius
  const o = eye();
  const [px, py] = project(o.pos.x, o.pos.z, cx, cy, sr);
  {
    const edge = project(o.pos.x + o.range, o.pos.z, cx, cy, sr);
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
    info.innerHTML = S.docked
      ? `<b>Observation — ${S.docked.userData.name}</b><br>Watching on the station array. ` +
        'Select a contact to scan or track it; flying is done from the cockpit.'
      : 'Tap a body to select it. Drag to pan, pinch to zoom.';
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
    // Distance from the eye, which is the station while docked. "1.5 Mm out" measured from
    // a ship parked inside a station is the same number, but it stops being the same number
    // the moment the chart is opened from anywhere else, and the scan tier beside it is
    // already measured from the array.
    const dist = eye().pos.distanceTo(best.obj.position);
    const u = best.obj.userData || {};
    const cat = u.category;
    const tier = liveTier(best.obj);
    const extra = best.kind === 'station' ? ' · trade, repair, refit, shipyard'
      : best.kind === 'asteroid' ? ` · ore ${Math.round(best.obj.ore)} kg`
      : best.kind === 'planet' ? ' · orbit to scan & probe' : '';
    info.innerHTML = `<b>${best.name}</b> — ${cat || best.kind} · ${fmtKm(dist)} out${extra}` +
      (best.owner ? ` · <span style="color:var(--amber)">${best.owner}</span>` : '') +
      `<br><span style="color:var(--good)">sensor: ${TIER_NAME[tier]}</span>`;
  }
  setButtons(true);
  showScan();
  // Selection does not switch panes — you are usually mid-pan and about to tap Warp. The
  // dot says there is something to read without taking the map away to say it.
  if (pane !== 'detail') tabDot.classList.remove('hidden');
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

/**
 * Which actions the chart can actually take.
 *
 * Split into the two that need a ship under you and the two that do not. Scanning and
 * locking are instrument work and run from a docked pad on the station's array; warping,
 * approaching and orbiting are flying, and a docked pilot gets a disabled button with the
 * reason on it rather than a button that fails when pressed.
 */
function setButtons(on) {
  const hasObj = !!(on && selected && selected.obj);
  const orbital = hasObj && ['planet', 'moon', 'star'].includes(selected.kind);
  // Two separate reasons a flight control can be dead, and they are not the same reason.
  // A docked pilot is temporarily grounded and the button should say so. An executive is
  // *never* at the stick — the control is not theirs to press, this session or any other
  // — so it reads as command authority rather than as a state they can undo by undocking.
  const licensed = canPilot();
  const flying = !S.docked && licensed;
  btnCourse.disabled = !on || !flying;
  btnApproach.disabled = !hasObj || !flying;
  btnOrbit.disabled = !orbital || !flying;
  btnTarget.disabled = !hasObj;
  btnScan.disabled = !hasObj;
  btnCourse.textContent = !licensed ? 'Command' : flying ? 'Warp' : 'Docked';
  btnApproach.textContent = !licensed ? 'No hull' : flying ? 'Approach' : '—';
}
