// Living Galaxy — the boot sequence, as something to look at.
//
// ## Why a loading screen is not a spinner
//
// v1.02.55 has real work to do before a menu can be honest: six hundred systems to generate
// and archive, a 135-million-parameter language model to pull down, a pilot roster to read
// off IndexedDB. That is seconds, not milliseconds, and the difference between seconds that
// feel like progress and seconds that feel like a hang is entirely what is on screen.
//
// So this screen makes three promises and keeps all of them:
//
//   - **It says what it is doing.** Every task writes a line into the feed as it starts and
//     as it finishes, with counts. "Charting 384 of 640 systems" is a fact; "Loading…" is a
//     spinner with extra steps.
//   - **It never lies about progress.** The bar is driven by completed work, not by a timer.
//     A bar that fills on a schedule and then sits at 99% is the single most common way to
//     make a fast load feel slow.
//   - **It never blocks on the model.** SmolLM2-135M is a hundred-odd megabytes on a first
//     visit. It streams in behind everything else, reports into the same feed, and if it is
//     still coming when the rest is done, the menu opens anyway and the model lights ARIA up
//     whenever it lands. A first visit on a bad connection is playable in seconds.
//
// ## The art
//
// Procedurally drawn hulls, berths and worlds, fading in and out over a drifting starfield.
// Deliberately 2D canvas rather than the real renderer: the 3D scene does not exist yet at
// this point in the boot — that is the entire reason there is a loading screen — and a boot
// sequence that has to stand a scene up before it can draw its own loading screen is a boot
// sequence with a bootstrapping problem.
//
// The shapes are generated from a seeded stream rather than drawn from a sprite sheet, for
// the same reason everything else here is: this is a game about a generated galaxy, and a
// loading screen showing eight hand-drawn ships on rotation would be the one part of it that
// is not.

import { $, el } from '../core/utils.js';
import { makeRng } from '../core/rng.js';
import { LOADING_TIPS } from '../data/loading-tips.js';

let overlay, art, ctx, barFill, barPct, feed, headline, sub;
let raf = 0, t = 0, dpr = 1;
let objects = [];
let stars = [];
/**
 * Which 2D-canvas features this context actually has.
 *
 * Not paranoia and not a browser-support question — it is the headless suite. `test/ui.mjs`
 * boots the whole of `main.js` against a DOM stub whose canvas context implements the parts
 * the game uses and not gradients or ellipses, and a loading screen that hard-requires them
 * takes the entire boot test down with it. The fallbacks are flat colour, which is exactly
 * what a test needs to see and never what a browser will.
 */
let canGrad = false, canEllipse = false;
let rng = makeRng(0xC0FFEE);
let progress = 0, targetProgress = 0;
let running = false;
const lines = [];
const MAX_LINES = 7;

// ── the screen ───────────────────────────────────────────────────────

export function initLoading() {
  overlay = $('load-overlay');
  if (!overlay) return false;
  art = $('load-art');
  barFill = $('load-bar-fill');
  barPct = $('load-pct');
  feed = $('load-feed');
  headline = $('load-headline');
  sub = $('load-sub');
  if (art && art.getContext) {
    ctx = art.getContext('2d');
    canGrad = !!ctx && typeof ctx.createRadialGradient === 'function' &&
                       typeof ctx.createLinearGradient === 'function';
    canEllipse = !!ctx && typeof ctx.ellipse === 'function';
    sizeArt();
    addEventListener('resize', sizeArt);
  }
  seedStars();
  running = true;
  startTips();
  loop();
  return true;
}

function sizeArt() {
  if (!art || !ctx) return;
  const w = art.clientWidth || 320, h = art.clientHeight || 220;
  dpr = Math.min(typeof devicePixelRatio === 'number' ? devicePixelRatio : 1, 2);
  art.width = Math.max(1, Math.floor(w * dpr));
  art.height = Math.max(1, Math.floor(h * dpr));
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  seedStars();
}

function seedStars() {
  stars = [];
  const w = (art && art.clientWidth) || 320, h = (art && art.clientHeight) || 220;
  for (let i = 0; i < 90; i++) {
    stars.push({ x: rng.next() * w, y: rng.next() * h,
                 z: 0.25 + rng.next() * 0.9, s: 0.4 + rng.next() * 1.2 });
  }
}

/**
 * Say what is happening.
 *
 * @param {string} text
 * @param {string} [kind] 'ok' | 'warn' | '' — colours the line, nothing more
 */
export function note(text, kind) {
  lines.push({ text, kind: kind || '' });
  while (lines.length > MAX_LINES) lines.shift();
  if (!feed) return;
  feed.innerHTML = lines.map((l, i) => {
    const dim = (i < lines.length - 1) ? ' dim' : '';
    return `<div class="lf ${l.kind}${dim}">${l.text}</div>`;
  }).join('');
}

/** Replace the last line rather than adding one — for a task that counts up. */
export function tick(text, kind) {
  if (lines.length) lines[lines.length - 1] = { text, kind: kind || '' };
  else lines.push({ text, kind: kind || '' });
  if (!feed) return;
  feed.innerHTML = lines.map((l, i) => {
    const dim = (i < lines.length - 1) ? ' dim' : '';
    return `<div class="lf ${l.kind}${dim}">${l.text}</div>`;
  }).join('');
}

/** Where the bar should be, 0..1. Eased toward, never snapped — see `loop`. */
export function setProgress(v) {
  targetProgress = Math.max(0, Math.min(1, v));
}

export function setHeadline(main, subtitle) {
  if (headline) headline.textContent = main;
  if (sub && subtitle != null) { sub.textContent = subtitle; subHeldUntil = now() + 4000; }
}

// ── the voice (v1.04) ────────────────────────────────────────────────
// A rotating tip/lore line in the sub slot, shuffled once per boot so a returning
// player is not greeted by the same first sentence forever. A *real* subtitle from
// the pipeline always wins: setHeadline holds the slot for a few seconds and the
// rotation only writes into silence.
let subHeldUntil = 0, tipTimer = null, tipOrder = [];
const now = () => Date.now();

function startTips() {
  tipOrder = LOADING_TIPS.map((t, i) => i).sort(() => Math.random() - 0.5);
  let at = 0;
  const show = () => {
    if (!sub || now() < subHeldUntil) return;
    sub.textContent = LOADING_TIPS[tipOrder[at++ % tipOrder.length]];
  };
  show();
  tipTimer = setInterval(show, 5000);
}
function stopTips() { if (tipTimer) { clearInterval(tipTimer); tipTimer = null; } }

/** Hand the screen over. The art keeps running until the fade finishes. */
export function finishLoading() {
  setProgress(1);
  stopTips();
  if (!overlay) return;
  overlay.classList.add('done');
  setTimeout(() => {
    overlay.classList.add('hidden');
    running = false;
    if (raf) cancelAnimationFrame(raf);
    raf = 0;
  }, 620);
}

export const loadingVisible = () => !!overlay && !overlay.classList.contains('hidden');

// ── the animation ────────────────────────────────────────────────────

function loop() {
  if (!running) return;
  raf = requestAnimationFrame(loop);
  const dt = 1 / 60;
  t += dt;

  // The bar eases toward its target rather than jumping. A pregeneration chunk finishing is
  // a step function, and a bar that teleports in sixteen-system increments reads as broken
  // even though it is the more truthful of the two.
  progress += (targetProgress - progress) * Math.min(1, dt * 6);
  if (barFill) barFill.style.width = (progress * 100).toFixed(1) + '%';
  if (barPct) barPct.textContent = Math.round(progress * 100) + '%';

  if (ctx) draw(dt);
}

function draw(dt) {
  const w = art.clientWidth, h = art.clientHeight;
  ctx.clearRect(0, 0, w, h);

  // starfield — parallax by depth, drifting to port
  for (const s of stars) {
    s.x -= s.z * 6 * dt;
    if (s.x < -2) { s.x = w + 2; s.y = rng.next() * h; }
    ctx.fillStyle = `rgba(150,205,240,${0.10 + s.z * 0.30})`;
    ctx.fillRect(s.x, s.y, s.s, s.s);
  }

  // Keep three specimens on screen. Spawned rather than pooled so the mix keeps changing
  // for as long as the load takes — a short load shows three, a long one shows twenty.
  while (objects.length < 3) objects.push(spawn(w, h));
  for (let i = objects.length - 1; i >= 0; i--) {
    const o = objects[i];
    o.age += dt;
    if (o.age > o.life) { objects.splice(i, 1); continue; }
    // fade in over the first fifth, out over the last third
    const inK = Math.min(1, o.age / (o.life * 0.2));
    const outK = Math.min(1, (o.life - o.age) / (o.life * 0.33));
    o.alpha = Math.min(inK, outK);
    o.x += o.vx * dt;
    o.y += o.vy * dt;
    o.spin += o.spinRate * dt;
    drawObject(o);
  }
  drawLabels();

  frame(w, h);
}

function spawn(w, h) {
  const kind = ['hull', 'hull', 'station', 'planet'][Math.floor(rng.next() * 4)];
  const life = 5.5 + rng.next() * 4;
  const scale = kind === 'planet' ? 22 + rng.next() * 30 : 16 + rng.next() * 26;
  // Inset by the object's own size, so a big world does not spawn half outside the frame and
  // then drift the rest of the way out.
  const mx = Math.min(w * 0.35, scale + 12), my = Math.min(h * 0.35, scale + 14);
  return {
    kind,
    seed: Math.floor(rng.next() * 0xffffff),
    x: mx + rng.next() * Math.max(1, w - mx * 2),
    y: my + rng.next() * Math.max(1, h - my * 2),
    vx: (rng.next() - 0.5) * 9,
    vy: (rng.next() - 0.5) * 5,
    scale,
    spin: rng.next() * 6.28,
    spinRate: (rng.next() - 0.5) * 0.4,
    hue: 190 + rng.next() * 40,
    age: 0, life, alpha: 0
  };
}

function drawObject(o) {
  ctx.save();
  ctx.translate(o.x, o.y);
  ctx.globalAlpha = o.alpha;
  if (o.kind === 'planet') drawPlanet(o);
  else {
    ctx.rotate(o.spin);
    if (o.kind === 'station') drawStation(o);
    else drawHull(o);
  }
  ctx.restore();
}

/**
 * Labels, in a pass of their own after every object is drawn.
 *
 * Two reasons, and the second is the one that showed up on screen. A name that tumbles with
 * the ship cannot be read, so it is drawn outside the rotation — and a name drawn inside the
 * object loop is painted over by whatever is drawn next, which is exactly what a gas giant
 * spawning on top of a freighter did. Text last, always, and flipped to the other side of
 * its object rather than clipped by the frame.
 */
function drawLabels() {
  const w = art.clientWidth, h = art.clientHeight;
  ctx.save();
  ctx.font = '8px ui-monospace,monospace';
  for (const o of objects) {
    const text = labelFor(o);
    const tw = ctx.measureText ? (ctx.measureText(text).width || text.length * 4.8) : text.length * 4.8;
    const right = o.x + o.scale * 0.8;
    const lx = (right + tw + 6 > w) ? Math.max(3, o.x - o.scale * 0.8 - tw) : right + 3;
    const ly = Math.min(h - 4, o.y + o.scale * 0.8 + 9);
    ctx.globalAlpha = o.alpha * 0.8;
    // A dark backing stroke, because a label crossing the limb of a bright world is
    // otherwise unreadable exactly where it is most likely to land.
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = 'rgba(2,8,16,.85)';
    if (ctx.strokeText) ctx.strokeText(text, lx, ly);
    ctx.fillStyle = 'rgba(150,210,240,.95)';
    ctx.fillText(text, lx, ly);
  }
  ctx.restore();
}

const HULL_HEAD = ['KV', 'TR', 'MX', 'AS', 'DN', 'LR', 'PX', 'VG'];
const STATION_HEAD = ['Anvil', 'Spindle', 'Vault', 'Keel', 'Lantern', 'Rampart'];
const WORLD_HEAD = ['Ael', 'Kro', 'Nyx', 'Vel', 'Thr', 'Ob', 'Pyr', 'Lys'];
const WORLD_TAIL = ['ara', 'is', 'yx', 'eth', 'ora', 'ynth'];

function labelFor(o) {
  const r = makeRng(o.seed);
  if (o.kind === 'planet') {
    return WORLD_HEAD[Math.floor(r.next() * WORLD_HEAD.length)] +
           WORLD_TAIL[Math.floor(r.next() * WORLD_TAIL.length)];
  }
  if (o.kind === 'station') {
    return STATION_HEAD[Math.floor(r.next() * STATION_HEAD.length)] + ' ' +
           (1 + Math.floor(r.next() * 12));
  }
  return HULL_HEAD[Math.floor(r.next() * HULL_HEAD.length)] + '-' +
         String(100 + Math.floor(r.next() * 890));
}

/**
 * A hull silhouette: a nose, a swept hull, engine blocks.
 *
 * Mirrored about the centreline rather than drawn twice, because an asymmetric spaceship
 * looks like a mistake and a symmetric one drawn as two independent random walks looks like
 * two mistakes.
 */
function drawHull(o) {
  const r = makeRng(o.seed);
  const s = o.scale;
  const nose = 0.9 + r.next() * 0.5;
  const waist = 0.18 + r.next() * 0.28;
  const shoulder = 0.35 + r.next() * 0.4;
  const tail = 0.5 + r.next() * 0.35;
  const stroke = `hsla(${o.hue},70%,72%,.9)`;

  ctx.beginPath();
  ctx.moveTo(0, -s * nose);
  ctx.lineTo(s * waist, -s * 0.25);
  ctx.lineTo(s * shoulder, s * 0.15);
  ctx.lineTo(s * shoulder * 0.72, s * tail);
  ctx.lineTo(-s * shoulder * 0.72, s * tail);
  ctx.lineTo(-s * shoulder, s * 0.15);
  ctx.lineTo(-s * waist, -s * 0.25);
  ctx.closePath();
  ctx.fillStyle = `hsla(${o.hue},32%,16%,.75)`;
  ctx.fill();
  ctx.lineWidth = 1;
  ctx.strokeStyle = stroke;
  ctx.stroke();

  // panel lines, so the shape reads as built rather than as a polygon
  ctx.globalAlpha *= 0.5;
  for (let i = 0; i < 3; i++) {
    const y = -s * 0.3 + i * s * 0.32;
    ctx.beginPath();
    ctx.moveTo(-s * shoulder * 0.7, y);
    ctx.lineTo(s * shoulder * 0.7, y);
    ctx.stroke();
  }
  ctx.globalAlpha /= 0.5;

  // engine bloom
  if (canGrad) {
    const glow = ctx.createRadialGradient(0, s * tail, 0, 0, s * tail, s * 0.5);
    glow.addColorStop(0, 'rgba(120,240,255,.85)');
    glow.addColorStop(1, 'rgba(120,240,255,0)');
    ctx.fillStyle = glow;
  } else ctx.fillStyle = 'rgba(120,240,255,.4)';
  ctx.beginPath();
  ctx.arc(0, s * tail, s * 0.5, 0, Math.PI * 2);
  ctx.fill();
}

/** A berth: a habitation ring, spokes, a spine and a few module boxes on it. */
function drawStation(o) {
  const r = makeRng(o.seed);
  const s = o.scale;
  const spokes = 3 + Math.floor(r.next() * 4);
  const modules = 3 + Math.floor(r.next() * 5);
  ctx.strokeStyle = `hsla(${o.hue},60%,70%,.9)`;
  ctx.lineWidth = 1.4;
  ctx.beginPath(); ctx.arc(0, 0, s * 0.85, 0, Math.PI * 2); ctx.stroke();
  ctx.lineWidth = 1;
  ctx.beginPath(); ctx.arc(0, 0, s * 0.62, 0, Math.PI * 2); ctx.stroke();
  for (let i = 0; i < spokes; i++) {
    const a = (i / spokes) * Math.PI * 2;
    ctx.beginPath();
    ctx.moveTo(Math.cos(a) * s * 0.14, Math.sin(a) * s * 0.14);
    ctx.lineTo(Math.cos(a) * s * 0.85, Math.sin(a) * s * 0.85);
    ctx.stroke();
  }
  ctx.fillStyle = `hsla(${o.hue},40%,26%,.9)`;
  ctx.fillRect(-s * 0.13, -s * 0.13, s * 0.26, s * 0.26);
  ctx.strokeRect(-s * 0.13, -s * 0.13, s * 0.26, s * 0.26);
  for (let i = 0; i < modules; i++) {
    const a = r.next() * Math.PI * 2;
    const d = s * (0.62 + r.next() * 0.28);
    const bs = s * (0.07 + r.next() * 0.09);
    ctx.fillRect(Math.cos(a) * d - bs / 2, Math.sin(a) * d - bs / 2, bs, bs);
    ctx.strokeRect(Math.cos(a) * d - bs / 2, Math.sin(a) * d - bs / 2, bs, bs);
  }
}

/** A world: a lit disc, banding, a terminator, and sometimes a ring. */
function drawPlanet(o) {
  const r = makeRng(o.seed);
  const s = o.scale;
  const hue = Math.floor(r.next() * 360);
  const bands = 2 + Math.floor(r.next() * 5);
  const ringed = r.next() < 0.35;

  ctx.beginPath(); ctx.arc(0, 0, s, 0, Math.PI * 2);
  if (canGrad) {
    const g = ctx.createRadialGradient(-s * 0.3, -s * 0.3, s * 0.1, 0, 0, s);
    g.addColorStop(0, `hsla(${hue},55%,58%,1)`);
    g.addColorStop(0.65, `hsla(${hue},48%,30%,1)`);
    g.addColorStop(1, `hsla(${hue},40%,8%,1)`);
    ctx.fillStyle = g;
  } else ctx.fillStyle = `hsla(${hue},48%,34%,1)`;
  ctx.fill();

  // banding, clipped to the disc
  ctx.save();
  ctx.clip();
  ctx.globalAlpha *= 0.28;
  for (let i = 0; i < bands; i++) {
    const y = -s + (i + r.next()) * (s * 2 / bands);
    ctx.fillStyle = `hsla(${hue + 20},60%,${30 + r.next() * 40}%,1)`;
    ctx.fillRect(-s, y, s * 2, s * (0.06 + r.next() * 0.14));
  }
  ctx.restore();

  ctx.beginPath(); ctx.arc(0, 0, s, 0, Math.PI * 2);
  ctx.strokeStyle = `hsla(${hue},60%,70%,.5)`;
  ctx.lineWidth = 1;
  ctx.stroke();

  if (ringed && canEllipse) {
    ctx.save();
    ctx.rotate(-0.4);
    ctx.strokeStyle = `hsla(${hue + 40},50%,72%,.55)`;
    ctx.lineWidth = s * 0.12;
    ctx.beginPath();
    ctx.ellipse(0, 0, s * 1.7, s * 0.4, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }
}

/** Corner brackets and a sweep — the frame that says "instrument", not "photo". */
function frame(w, h) {
  const k = 14;
  ctx.strokeStyle = 'rgba(80,190,225,.45)';
  ctx.lineWidth = 1;
  const corner = (x, y, sx, sy) => {
    ctx.beginPath();
    ctx.moveTo(x, y + sy * k); ctx.lineTo(x, y); ctx.lineTo(x + sx * k, y);
    ctx.stroke();
  };
  corner(1, 1, 1, 1); corner(w - 1, 1, -1, 1);
  corner(1, h - 1, 1, -1); corner(w - 1, h - 1, -1, -1);

  const sweepY = ((t * 0.32) % 1) * h;
  if (canGrad) {
    const grad = ctx.createLinearGradient(0, sweepY - 18, 0, sweepY + 18);
    grad.addColorStop(0, 'rgba(90,220,255,0)');
    grad.addColorStop(0.5, 'rgba(90,220,255,.16)');
    grad.addColorStop(1, 'rgba(90,220,255,0)');
    ctx.fillStyle = grad;
  } else ctx.fillStyle = 'rgba(90,220,255,.08)';
  ctx.fillRect(0, sweepY - 18, w, 36);
}
