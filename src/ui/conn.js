// Living Galaxy — the handoff. What flipping AP ON looks like.
//
// ## What this is, and what it is not
//
// It is **presentation**. `setAutopilot(true)` has already run by the time the first frame
// draws; ARIA is already flying, the simulation is already stepping, and if this file threw
// an exception the only consequence would be a missing animation. That property is the whole
// reason it is safe to put a seven-second sequence on a control the player will press a
// hundred times: nothing waits for it.
//
// It is not a loading screen and it is not a modal. The world keeps rendering behind it,
// dimmed — a transition that hides a firefight is a transition that gets somebody killed.
//
// ## The picture
//
// A starboard elevation of the hull with ARIA's core amidships, growing a lattice out to
// each system in turn. **Amber is a system she has not taken; green is one she has**, using
// the game's own `--amber` and `--good` rather than a palette imported from somewhere else,
// so the sequence reads as part of this cockpit and not as a cutscene bolted to it.
//
// ## Why the systems are read off the fit
//
// The drawing names POINT DEFENCE only if the fit actually mounts something, and CARGO BAY
// only if there is a hold. A schematic that claims a turret on an unarmed hauler is a
// schematic nobody believes the second time they see it — and the whole job of this sequence
// is to be believed about what ARIA now controls.
//
// ## Two directions, one drawing
//
// AP ON grows the lattice out; AP OFF retracts it. Both run the same schedule, the same
// hull and the same readouts — `dir` is the only thing that differs, and it inverts what
// `grow` and `fill` mean at a given time rather than switching to a second animation.
// A separate "shutdown sequence" file would be the same code with the eases reversed and
// two places to fix the next time the hull changes.
//
// The release is always brisk and never the long version. Taking your own ship back should
// not be a ceremony you sit through — it is an acknowledgement, and `CONN.releasePace`
// says so.
//
// ## One clock
//
// Every log line, every tendril and every percentage is a pure function of one elapsed time.
// The log is not scheduled beside the animation, it is *emitted by* it: a system owns its
// two lines and writes them on the frame it starts reaching and the frame it binds. They
// cannot drift because there is nothing to drift from.

import { S } from '../core/state.js';
import { CONN } from '../core/config.js';
import { $, clamp } from '../core/utils.js';
import { sfx } from '../systems/platform/audio.js';
import { autopilotOn } from '../systems/npc/autopilot.js';

/* ── the drawing's own coordinate space ──────────────────────
   Hull, nodes, line weights and node sizes are all in these units and
   all go through one transform. The version this was ported from drew
   the hull at one scale and placed nodes at another, which is why its
   labels floated off the parts they named. */
const BOX = { x0: -500, x1: 500, y0: -215, y1: 175 };
const BOX_W = BOX.x1 - BOX.x0;
const BOX_H = BOX.y1 - BOX.y0;

const GROUPS = { avionics: 'AVIONICS', defence: 'DEFENCE', hull: 'HULL', drive: 'DRIVE' };

/**
 * Every system the lattice can claim, on the feature it belongs to.
 *
 * `cd` is the callout direction and `cl` an optional leader length —
 * per-system, because clearing a radiator or a stack of drive bells is
 * a fact about that part of the drawing, not something a formula can be
 * told. `has` decides whether this hull carries the system at all.
 */
const SYSTEMS = [
  { id: 'sensor', label: 'SENSOR CLUSTER', x: -436, y: -14, group: 'avionics',
    cd: [-1, -0.35],
    reach: 'REACHING BOW SENSOR CLUSTER', bind: 'SENSOR CLUSTER BOUND',
    let_: 'RELEASING SENSOR CLUSTER', gone: 'SENSOR CLUSTER RELEASED' },
  { id: 'nav', label: 'FLIGHT DECK', x: -296, y: -80, group: 'avionics',
    cd: [-0.55, -1],
    reach: 'REACHING FLIGHT DECK', bind: 'FLIGHT DECK BOUND',
    let_: 'RELEASING FLIGHT DECK', gone: 'FLIGHT DECK RELEASED' },
  { id: 'life', label: 'LIFE SUPPORT', x: -188, y: 24, group: 'hull',
    cd: [-0.3, 1],
    reach: 'REACHING LIFE SUPPORT LOOP', bind: 'LIFE SUPPORT BOUND',
    let_: 'RELEASING LIFE SUPPORT LOOP', gone: 'LIFE SUPPORT RELEASED' },
  { id: 'weapon', label: 'WEAPON RACK', x: -100, y: -108, group: 'defence',
    cd: [0, -1],
    has: () => !!(S.stats.mounts && S.stats.mounts.length),
    reach: 'REACHING WEAPON RACK', bind: 'WEAPONS BOUND',
    let_: 'RELEASING WEAPON RACK', gone: 'WEAPONS RELEASED — SAFE' },
  { id: 'comms', label: 'COMMS MAST', x: 58, y: -186, group: 'avionics',
    cd: [0.55, -1],
    reach: 'REACHING COMMS MAST', bind: 'COMMS MAST BOUND',
    let_: 'RELEASING COMMS MAST', gone: 'COMMS MAST RELEASED' },
  { id: 'cargo', label: 'CARGO BAY', x: 126, y: 102, group: 'hull',
    cd: [-0.25, 1],
    has: () => (S.stats.cargoCap || 0) > 0,
    reach: 'REACHING CARGO HANDLING', bind: 'CARGO BAY BOUND',
    let_: 'RELEASING CARGO HANDLING', gone: 'CARGO BAY RELEASED' },
  { id: 'reactor', label: 'REACTOR', x: 262, y: 6, group: 'drive',
    cd: [0.1, -1], cl: 1.5,
    reach: 'REACHING REACTOR CONTAINMENT', bind: 'REACTOR SYNCHRONISED',
    let_: 'RELEASING REACTOR CONTAINMENT', gone: 'REACTOR HANDED BACK' },
  { id: 'prop', label: 'DRIVE BLOCK', x: 396, y: 14, group: 'drive',
    cd: [0.06, 1], cl: 2.1,
    reach: 'REACHING DRIVE BLOCK', bind: 'DRIVE VECTOR LOCKED',
    let_: 'RELEASING DRIVE BLOCK', gone: 'DRIVE VECTOR YOURS' }
];

/** ARIA's own location: midships on the spine, inside the hull. */
const CORE = { x: -30, y: 2 };

/* ── the outline ─────────────────────────────────────────────
   A working prospector-hauler, nose left. Straight runs where a hull is
   welded flat and a curve only at the bow, which is where a hull
   actually curves. */
const HULL = [
  [-470, -6], [-432, -30], [-352, -40],
  [-344, -80], [-252, -92], [-240, -62],
  [-168, -58], [-154, -86],
  [156, -90], [196, -68], [240, -82],
  [400, -78], [416, -52],
  [416, 58], [400, 84],
  [250, 90], [212, 70],
  [204, 112], [52, 118], [40, 84],
  [-150, 78], [-300, 58], [-402, 28], [-452, 8]
];

// ── state ────────────────────────────────────────────────────────────

let overlay, canvas, ctx, chip, chipText, logEl, systemsEl, meterEl,
    meterFill, meterPct, voiceEl, voiceMain, voiceSub, deckEl, markMeta;

let W = 0, H = 0, DPR = 1, scale = 1, originX = 0, originY = 0;
let active = false, now = 0, pace = 1, dir = 1;   // +1 binds, -1 releases
let nodes = [], groupEls = {}, callouts = {};
let coreScale = 0, coreGlow = 0, coreFill = 0, corePulse = -1, shipLit = 0;
let sealed = false, spoke = false, typed = 0;
const sparks = [], motes = [], emitted = new Set();
let T = null, chipState = '';

const sxp = x => originX + x * scale;
const syp = y => originY + y * scale;
const px = (v, min) => Math.max(min === undefined ? 0.7 : min, v * scale);

const lerp = (a, b, t) => a + (b - a) * t;
const outCubic = t => 1 - Math.pow(1 - clamp(t, 0, 1), 3);
const inOut = t => (t = clamp(t, 0, 1)) < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;

export function initConn() {
  overlay = $('conn-overlay');
  if (!overlay) return false;
  canvas = $('conn-canvas');
  ctx = canvas && canvas.getContext ? canvas.getContext('2d') : null;
  chip = $('conn-chip'); chipText = $('conn-chip-text');
  deckEl = $('conn-deck');
  logEl = $('conn-log'); systemsEl = $('conn-systems');
  meterEl = $('conn-meter'); meterFill = $('conn-meter-fill'); meterPct = $('conn-meter-pct');
  voiceEl = $('conn-voice'); voiceMain = $('conn-voice-main'); voiceSub = $('conn-voice-sub');
  markMeta = $('conn-meta');
  addEventListener('resize', resize);
  return true;
}

export const connActive = () => active;

/**
 * How long this run should take.
 *
 * The first engage on a save is the full read; everything after is brisk; anything with a
 * hostile inside sensor range is briefer still. See `CONN` for the argument.
 */
function paceFor() {
  // Handing the ship back is an acknowledgement, not a ceremony. Never the long version,
  // never scaled by whether this save has seen it before — you took your own stick back and
  // the only thing you need is confirmation that she let go.
  if (dir < 0) return CONN.releasePace;
  const range = (S.stats.sensor || 2000) * CONN.hostileRange;
  const hot = (S.world.npcs || []).some(n =>
    n.userData.faction === 'hostile' && n.userData.hp > 0 &&
    !(n.userData.ambush && !n.userData.triggered) &&
    n.position.distanceToSquared(S.player.position) < range * range);
  if (hot) return CONN.combatPace;
  return S.settings.connSeen ? CONN.pace : CONN.firstPace;
}

/** Build the schedule for this run. Derived, so nothing can be written twice. */
function schedule(p) {
  const t = {
    seed: 0.30 * p, core: 0.95 * p,
    first: 1.10 * p, stagger: 0.34 * p,
    reach: 0.85 * p, bind: 0.42 * p,
    after: 0.40 * p, voice: 0.55 * p
  };
  // Bound outward from the core, released inward toward it: the drive and the reactor go
  // back first and the eyes last, which is the order a person actually hands over a ship.
  const order = dir > 0 ? nodes : nodes.slice().reverse();
  order.forEach((n, i) => {
    n.startAt = t.first + i * t.stagger;
    n.fillAt = n.startAt + t.reach;     // bind: energy starts running out along the sheath
    n.boundAt = n.fillAt + t.bind;      // ...and the moment it is hers
    n.goneAt = n.startAt + t.bind + t.reach;   // release: the moment it is not
  });
  const last = order[order.length - 1];
  t.sealed = nodes.length ? (dir > 0 ? last.boundAt : last.goneAt) + t.after : t.core;
  t.spoke = t.sealed + t.voice;
  t.end = t.spoke + (0.9 + CONN.hold) * p + CONN.hold;
  t.preamble = dir > 0 ? [
    [0.10 * p, 'AUTOPILOT ENGAGED — ARIA'],
    [0.44 * p, 'READING VESSEL TOPOLOGY'],
    [t.core,   'CORE READY — EXTENDING']
  ] : [
    [0.06 * p, 'AUTOPILOT DISENGAGED'],
    [0.30 * p, 'STANDING DOWN — RETRACTING']
  ];
  t.closing = dir > 0 ? [
    [t.sealed,              'ALL SYSTEMS BOUND'],
    [t.sealed + 0.18 * p,   'HANDSHAKE ACCEPTED'],
    [t.spoke,               'ARIA HAS THE CONN']
  ] : [
    [t.sealed,              'LATTICE CLEAR'],
    [t.sealed + 0.14 * p,   'MANUAL CONTROL RESTORED'],
    [t.spoke,               'YOU HAVE THE CONN']
  ];
  return t;
}

/**
 * Play it. Never throws, never blocks — the autopilot has already changed state.
 *
 * @param {'bind'|'release'} [mode] which direction. `bind` is AP ON, `release` is AP OFF.
 */
export function playConn(mode) {
  if (!overlay || !CONN.show || !S.settings.connSeq) return false;
  dir = mode === 'release' ? -1 : 1;

  /* Only the systems this hull actually carries. A drawing that claims a
     turret on an unarmed hauler is a drawing nobody believes twice. */
  // A release starts from a ship she already holds: every tendril is grown and lit, and
  // the sequence is about them going out. A bind starts from nothing.
  const held = dir < 0;
  nodes = SYSTEMS.filter(s => !s.has || s.has()).map((s, i) => Object.assign({}, s, {
    grow: held ? 1 : 0, fill: held ? 1 : 0, bound: held, pulseAt: -1,
    bend: ((i % 2) ? 1 : -1) * (0.7 + (i % 3) * 0.28)
  }));
  if (!nodes.length) return false;

  buildColumn();
  buildCallouts();

  pace = paceFor();
  T = schedule(pace);
  now = 0;
  active = true;
  sealed = false; spoke = false; typed = 0;
  corePulse = -1;
  // A release opens on a fully lit ship and darkens; a bind opens dark.
  coreScale = held ? 1 : 0;
  coreGlow = held ? 1 : 0;
  coreFill = held ? 1 : 0;
  shipLit = held ? 1 : 0;
  sparks.length = 0; motes.length = 0;
  emitted.clear();
  chipState = '';
  lines.length = 0;
  logEl.innerHTML = '';
  voiceMain.textContent = ''; voiceSub.textContent = '';
  voiceEl.classList.remove('in');
  deckEl.classList.remove('handoff');
  if (markMeta) {
    markMeta.textContent = (S.stats.name || 'Hull') + ' · elevation stbd · ' +
      nodes.length + ' systems';
  }
  overlay.classList.remove('hidden', 'out');
  // The cockpit chrome steps back for the duration — see css/conn.css for
  // why fading it beats dimming it, and why the alert banners do not.
  if (document.body && document.body.classList) document.body.classList.add('conn-open');
  resize();
  paint();
  return true;
}

/**
 * Stop, immediately.
 *
 * Called when the player takes the stick back — an animation still running for a system that
 * is no longer running is a lie on screen, and this one has to be able to disappear inside a
 * single frame.
 */
export function abortConn(quiet) {
  if (!active) return;
  active = false;
  if (document.body && document.body.classList) document.body.classList.remove('conn-open');
  if (!overlay) return;
  overlay.classList.add(quiet ? 'hidden' : 'out');
  if (!quiet) setTimeout(() => overlay.classList.add('hidden'), 320);
  for (const id in callouts) callouts[id].classList.remove('on', 'bound');
}

/* ── the column and callouts, built from the live node list ── */

/**
 * The readout column, built from the live node list.
 *
 * Assembled from real elements rather than an innerHTML string, and the
 * references are kept rather than queried back. Partly because a query
 * round-trip for a node you just made is silly, and partly because the
 * headless DOM in `test/stub.mjs` does not parse innerHTML into children
 * — `ui/navmap.js` carries the same note for the same reason. A panel
 * that can only be built in a browser is a panel the suite cannot check.
 */
function buildColumn() {
  if (!systemsEl) return;
  systemsEl.innerHTML = '';
  groupEls = {};

  const title = document.createElement('div');
  title.className = 'conn-col-title';
  title.textContent = 'SYSTEM INTEGRATION';
  systemsEl.appendChild(title);

  for (const key in GROUPS) {
    const members = nodes.filter(n => n.group === key).map(n => n.id);
    if (!members.length) continue;              // no rack fitted, no DEFENCE row

    const wrap = document.createElement('div');
    wrap.className = 'conn-grp';

    const head = document.createElement('div');
    head.className = 'conn-grp-head';
    const name = document.createElement('span');
    name.className = 'conn-grp-name';
    name.textContent = GROUPS[key];
    const val = document.createElement('span');
    val.className = 'conn-grp-val';
    val.textContent = '0%';
    head.appendChild(name); head.appendChild(val);

    const track = document.createElement('div');
    track.className = 'conn-grp-track';
    const fill = document.createElement('div');
    fill.className = 'conn-grp-fill';
    track.appendChild(fill);

    wrap.appendChild(head); wrap.appendChild(track);
    systemsEl.appendChild(wrap);
    groupEls[key] = { wrap, members, val, fill };
  }
}

function buildCallouts() {
  const host = $('conn-callouts');
  if (!host) return;
  host.innerHTML = '';
  callouts = {};
  for (const n of nodes) {
    const el = document.createElement('div');
    el.className = 'conn-callout';
    el.textContent = n.label;
    host.appendChild(el);
    callouts[n.id] = el;
  }
}

// ── layout ───────────────────────────────────────────────────────────

function resize() {
  if (!ctx || !active) return;
  W = innerWidth; H = innerHeight;
  DPR = Math.min(typeof devicePixelRatio === 'number' ? devicePixelRatio : 1, 2);
  canvas.width = Math.round(W * DPR);
  canvas.height = Math.round(H * DPR);
  canvas.style.width = W + 'px';
  canvas.style.height = H + 'px';
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0);

  /* Margins are for the CALLOUTS, not the hull: a fit that only accounts
     for the drawing puts the bow sensor's label off the left edge, and
     the label is part of the drawing. Deliberately does not touch node
     state — resizing must not restart the sequence. */
  const narrow = W < 780;
  const availW = W * (narrow ? 0.93 : 0.76);
  const availH = H * (narrow ? 0.34 : 0.50);
  scale = Math.min(availW / BOX_W, availH / BOX_H);
  originX = W * 0.5 - (BOX.x0 + BOX.x1) * 0.5 * scale;
  originY = H * (narrow ? 0.27 : 0.39) - (BOX.y0 + BOX.y1) * 0.5 * scale;
}

/** A quadratic bow from the core to a node, bent perpendicular to the run. */
function bow(n, t) {
  const ax = sxp(CORE.x), ay = syp(CORE.y);
  const bx = sxp(n.x), by = syp(n.y);
  const dx = bx - ax, dy = by - ay;
  const len = Math.hypot(dx, dy) || 1;
  const b = n.bend * len * 0.15;
  const mx = (ax + bx) * 0.5 + (-dy / len) * b;
  const my = (ay + by) * 0.5 + (dx / len) * b;
  const u = 1 - t;
  return { x: u * u * ax + 2 * u * t * mx + t * t * bx,
           y: u * u * ay + 2 * u * t * my + t * t * by };
}

// ── the tick ─────────────────────────────────────────────────────────

export function tickConn(dt) {
  if (!active) return;

  /* The picture must never outlive the thing it is about. Binding, that means she stopped
     flying — the player took the stick, the drives died, a dock completed. Releasing, it
     means the opposite: AP came back on mid-retraction, and a lattice drawing itself out of
     a ship she is flying again is nonsense. Either way the overlay follows the system. */
  if (dir > 0 ? !autopilotOn() : autopilotOn()) { abortConn(); return; }

  now += dt;

  for (const [at, text] of T.preamble) if (now >= at) emit('p' + at, at, text, 'system');

  if (now < T.seed) { coreScale = 0; coreGlow = 0; }
  else if (now < T.core) {
    const k = outCubic((now - T.seed) / (T.core - T.seed));
    coreScale = lerp(0.2, 1, k);
    coreGlow = lerp(0.25, 0.7, k);
  } else coreScale = 1;

  for (const n of nodes) {
    const local = now - n.startAt;
    if (local <= 0) continue;

    if (dir > 0) {
      // Reach, then bind. Amber sheath grows out; green energy runs along it.
      if (!emitted.has('r' + n.id)) emit('r' + n.id, n.startAt, n.reach, 'pending');
      n.grow = clamp(outCubic(local / T.reach), 0, 1);
      if (now >= n.fillAt) {
        n.fill = clamp(inOut((now - n.fillAt) / T.bind), 0, 1);
        if (n.fill >= 1 && !n.bound) {
          n.bound = true;
          n.pulseAt = now;
          emit('b' + n.id, n.boundAt, n.bind, 'bound');
          sfx.ui();
          spark(sxp(n.x), syp(n.y), 11);
          for (let i = 0; i < 4; i++) { const q = bow(n, Math.random()); mote(q.x, q.y); }
        }
      }
    } else {
      // The same two phases, run backwards: the green drains out of the sheath first —
      // she lets go of the system before the connection to it goes — and only then does
      // the sheath itself retract into the core.
      if (!emitted.has('l' + n.id)) emit('l' + n.id, n.startAt, n.let_, 'bound');
      if (local < T.bind) {
        n.fill = clamp(1 - inOut(local / T.bind), 0, 1);
        n.grow = 1;
      } else {
        n.fill = 0;
        n.grow = clamp(1 - outCubic((local - T.bind) / T.reach), 0, 1);
      }
      if (n.fill <= 0 && n.bound) {
        n.bound = false;
        n.pulseAt = now;
        emit('g' + n.id, n.goneAt, n.gone, 'pending');
        sfx.ui();
        spark(sxp(n.x), syp(n.y), 7);
      }
    }
  }

  const ratio = nodes.filter(n => n.bound).length / nodes.length;
  coreFill = lerp(coreFill, ratio, 1 - Math.pow(0.001, dt));
  coreGlow = lerp(coreGlow, 0.42 + coreFill * 0.58, 1 - Math.pow(0.02, dt));
  shipLit = lerp(shipLit, ratio, 1 - Math.pow(0.06, dt));

  const settled = dir > 0 ? nodes.every(n => n.bound) : nodes.every(n => !n.bound);
  if (!sealed && now >= T.sealed && settled) {
    sealed = true;
    corePulse = now;
    // A bind lands on the two-tone dock chime; a release is a single note going away.
    if (dir > 0) sfx.dock(); else sfx.warpDrop();
  }
  for (const [at, text] of T.closing) if (now >= at) emit('c' + at, at, text, 'bound');

  if (!spoke && now >= T.spoke) {
    spoke = true;
    voiceEl.classList.add('in');
    /* The readouts recede so the payoff is the only thing competing for
       the eye — and, incidentally, so nothing collides with it. */
    deckEl.classList.add('handoff');
  }
  typeVoice(dt);

  if (now >= T.end) {
    if (dir > 0) S.settings.connSeen = true;   // the long version is a first-time thing
    abortConn();
    return;
  }

  for (let i = sparks.length - 1; i >= 0; i--) {
    const s = sparks[i];
    s.life -= dt; s.x += s.vx * dt; s.y += s.vy * dt;
    s.vx *= 0.93; s.vy *= 0.93;
    if (s.life <= 0) sparks.splice(i, 1);
  }
  for (let i = motes.length - 1; i >= 0; i--) {
    const m = motes[i];
    m.life -= dt; m.x += m.vx * dt; m.y += m.vy * dt;
    m.vx *= 0.985; m.vy *= 0.985;
    if (m.life <= 0) motes.splice(i, 1);
  }

  paint();
  draw();
}

// ── the voice ────────────────────────────────────────────────────────

/* Two lines each way. The release is deliberately shorter and hands you something
   useful rather than restating what just happened — she has been flying, she knows
   what state she is giving back, and saying so is the difference between an
   acknowledgement and an announcement. */
const VOICE = {
  bind: ['I have the conn.',
         'Hull, drive and guns are mine until you take them back. Touch anything and they are yours.'],
  release: ['She\u2019s yours.',
            'Stick is live and the racks are warm. I will keep watching \u2014 say the word and I will take her again.']
};

function typeVoice(dt) {
  if (!spoke) return;
  const [main, sub] = VOICE[dir > 0 ? 'bind' : 'release'];
  const total = main.length + sub.length;
  if (typed >= total) return;
  typed = Math.min(total, typed + dt * (58 / pace));
  const n = Math.floor(typed);
  const mainN = Math.min(main.length, n);
  voiceMain.textContent = main.slice(0, mainN);
  voiceSub.textContent = sub.slice(0, Math.max(0, n - main.length));
}

// ── the log ──────────────────────────────────────────────────────────

function stamp(sec) {
  return '+' + sec.toFixed(1).padStart(4, '0');
}

/**
 * Write one line.
 *
 * The rail is held as an array and re-rendered, rather than appended to and
 * trimmed with `removeChild`. Eight rows is nothing to rewrite, it keeps the
 * cap in one expression instead of a loop, and it does not depend on DOM
 * mutation the headless suite has no reason to implement — `ui/loading.js`
 * keeps its feed the same way.
 */
const lines = [];

function emit(key, at, text, kind) {
  if (emitted.has(key)) return;
  emitted.add(key);
  lines.push({ at, text, kind: kind || 'system' });
  while (lines.length > 8) lines.shift();
  if (!logEl) return;
  logEl.innerHTML = lines.map(l =>
    '<div class="conn-line ' + l.kind + '"><span class="t">' + stamp(l.at) +
    '</span><span class="m">' + l.text + '</span></div>').join('');
}

// ── readouts ─────────────────────────────────────────────────────────

/** One number per system: reaching is 40% of it, binding the other 60%.
    The bar therefore moves while a tendril is still growing, which is
    what makes the words, the lines and the percentage read as one
    event rather than three that happen near each other. */
const progressOf = n => clamp(n.grow * 0.4 + n.fill * 0.6, 0, 1);

export const connProgress = () =>
  nodes.length ? nodes.reduce((a, n) => a + progressOf(n), 0) / nodes.length : 0;

function setChip(text, bound) {
  const key = text + bound;
  if (key === chipState) return;
  chipState = key;
  chipText.textContent = text;
  chip.classList.toggle('bound', bound);
}

function paint() {
  const overall = connProgress();
  meterFill.style.width = (overall * 100).toFixed(1) + '%';
  meterPct.textContent = Math.round(overall * 100) + '%';
  meterEl.classList.toggle('bound', nodes.every(n => n.bound));

  for (const key in groupEls) {
    const g = groupEls[key];
    let s = 0;
    for (const id of g.members) s += progressOf(nodes.find(n => n.id === id));
    const v = s / g.members.length;
    g.fill.style.width = (v * 100).toFixed(1) + '%';
    g.val.textContent = Math.round(v * 100) + '%';
    g.wrap.classList.toggle('done', g.members.every(id => nodes.find(n => n.id === id).bound));
  }

  const count = nodes.filter(n => n.bound).length;
  if (dir > 0) {
    if (spoke) setChip('ARIA HAS THE CONN', true);
    else if (sealed) setChip('SYNCHRONISING', true);
    else if (now >= T.first) setChip('BINDING ' + count + '/' + nodes.length, false);
    else setChip('LATTICE SEED', false);
  } else {
    /* The chip reads amber all the way through a release and only the *last* state is
       green-free: green means she has it, and the whole point of this direction is that
       she is giving it up. */
    if (spoke) setChip('YOU HAVE THE CONN', false);
    else if (sealed) setChip('LATTICE CLEAR', false);
    else setChip('RELEASING ' + (nodes.length - count) + '/' + nodes.length, false);
  }
}

// ── drawing ──────────────────────────────────────────────────────────

function hullStroke(a, w) {
  ctx.strokeStyle = 'rgba(' + Math.round(lerp(27, 96, shipLit)) + ',' +
    Math.round(lerp(58, 158, shipLit)) + ',' +
    Math.round(lerp(82, 196, shipLit)) + ',' + a + ')';
  ctx.lineWidth = px(w === undefined ? 1.6 : w, 0.7);
}

function poly(pts, close) {
  ctx.beginPath();
  ctx.moveTo(sxp(pts[0][0]), syp(pts[0][1]));
  for (let i = 1; i < pts.length; i++) ctx.lineTo(sxp(pts[i][0]), syp(pts[i][1]));
  if (close) ctx.closePath();
}

function seg(pairs) {
  ctx.beginPath();
  for (const [x1, y1, x2, y2] of pairs) {
    ctx.moveTo(sxp(x1), syp(y1));
    ctx.lineTo(sxp(x2), syp(y2));
  }
}

function drawShip() {
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';

  poly(HULL, true);
  ctx.fillStyle = 'rgba(8,26,38,' + (0.52 + shipLit * 0.16) + ')';
  ctx.fill();
  hullStroke(0.88 + shipLit * 0.12, 1.9);
  ctx.stroke();

  poly([[-330, -72], [-258, -84], [-254, -54], [-330, -48]], true);
  ctx.fillStyle = 'rgba(47,106,146,' + (0.16 + shipLit * 0.18) + ')';
  ctx.fill();
  hullStroke(0.75, 1.2); ctx.stroke();
  seg([[-306, -76, -304, -50], [-282, -80, -280, -52]]);
  hullStroke(0.5, 0.9); ctx.stroke();

  /* the turret is only drawn on a hull that has one */
  if (nodes.some(n => n.id === 'weapon')) {
    poly([[-128, -84], [-120, -102], [-80, -102], [-72, -86]], true);
    hullStroke(0.8, 1.3); ctx.stroke();
    ctx.beginPath();
    ctx.arc(sxp(-100), syp(-108), px(13, 2), 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(8,26,38,.9)'; ctx.fill();
    hullStroke(0.85, 1.3); ctx.stroke();
    seg([[-110, -113, -146, -126], [-108, -104, -144, -114]]);
    hullStroke(0.7, 1.2); ctx.stroke();
  }

  seg([[52, -90, 52, -180], [66, -90, 66, -170], [52, -180, 66, -170],
       [52, -152, 100, -168], [52, -128, 92, -140], [52, -152, 18, -164],
       [52, -114, 66, -110]]);
  hullStroke(0.75, 1.2); ctx.stroke();
  ctx.beginPath();
  ctx.arc(sxp(58), syp(-188), px(9, 1.6), 0, Math.PI * 2);
  hullStroke(0.8, 1.2); ctx.stroke();

  for (const d of [-1, 1]) {
    poly([[254, d * 74], [318, d * 152], [364, d * 144], [330, d * 70]], true);
    ctx.fillStyle = 'rgba(8,26,38,' + (0.34 + shipLit * 0.14) + ')';
    ctx.fill();
    hullStroke(0.62, 1.2); ctx.stroke();
    const fins = [];
    for (let i = 1; i <= 3; i++) {
      const k = i / 4;
      fins.push([lerp(254, 330, k), d * lerp(74, 70, k), lerp(318, 364, k), d * lerp(152, 144, k)]);
    }
    seg(fins);
    hullStroke(0.28, 0.9); ctx.stroke();
  }

  const drive = nodes.find(n => n.id === 'prop');
  for (const [y, k] of [[-30, 1.0], [16, 0.86], [56, 0.7]]) {
    poly([[416, y - 26 * k], [468, y - 34 * k], [468, y + 34 * k], [416, y + 26 * k]], true);
    ctx.fillStyle = 'rgba(10,32,26,' + (0.42 + shipLit * 0.28) + ')';
    ctx.fill();
    hullStroke(0.82, 1.3); ctx.stroke();
    if (drive && drive.fill > 0) {
      seg([[421, y - 22 * k, 421, y + 22 * k]]);
      ctx.strokeStyle = 'rgba(84,224,160,' + (0.8 * drive.fill) + ')';
      ctx.lineWidth = px(4, 1.6);
      ctx.stroke();
    }
  }

  ctx.beginPath();
  ctx.arc(sxp(-436), syp(-14), px(16, 2.5), 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(8,26,38,.92)'; ctx.fill();
  hullStroke(0.85, 1.3); ctx.stroke();
  seg([[-470, -6, -500, -18], [-470, -6, -498, 4], [-452, 8, -488, 6]]);
  hullStroke(0.55, 1.1); ctx.stroke();

  seg([[-240, -62, -240, 66], [-154, -86, -154, 76], [-40, -88, -40, 82],
       [60, -90, 60, 84], [160, -90, 160, 84], [240, -82, 240, 88]]);
  hullStroke(0.2, 1); ctx.stroke();

  for (const [cx, r] of [[-100, 32], [10, 30]]) {
    ctx.beginPath();
    ctx.ellipse(sxp(cx), syp(6), px(r, 2), px(r * 0.92, 2), 0, 0, Math.PI * 2);
    hullStroke(0.26, 1); ctx.stroke();
  }

  if (nodes.some(n => n.id === 'cargo')) {
    for (let i = 0; i < 4; i++) {
      const x = 58 + i * 37;
      poly([[x, 88], [x + 31, 88], [x + 31, 112], [x, 112]], true);
      hullStroke(0.24, 0.9); ctx.stroke();
    }
  }

  poly([[240, -14], [252, -34], [276, -34], [288, -14],
        [288, 22], [276, 42], [252, 42], [240, 22]], true);
  ctx.fillStyle = 'rgba(8,26,38,.7)'; ctx.fill();
  hullStroke(0.42, 1.1); ctx.stroke();

  ctx.save();
  ctx.setLineDash([px(10, 3), px(8, 3)]);
  seg([[-450, 2, 412, 2]]);
  hullStroke(0.2, 1); ctx.stroke();
  ctx.restore();

  const ticks = [[-440, 132, 400, 132]];
  for (let x = -440; x <= 400; x += 60) ticks.push([x, 132, x, 140]);
  seg(ticks);
  hullStroke(0.22, 1); ctx.stroke();
}

function drawCore() {
  const cx = sxp(CORE.x), cy = syp(CORE.y);
  const r = px(34, 3) * coreScale;
  if (r < 0.8) return;

  ctx.save();
  ctx.translate(cx, cy);
  const halo = ctx.createRadialGradient(0, 0, r * 0.2, 0, 0, r * 3.2);
  halo.addColorStop(0, 'rgba(84,224,160,' + (0.22 * coreGlow) + ')');
  halo.addColorStop(0.5, 'rgba(31,120,90,' + (0.08 * coreGlow) + ')');
  halo.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = halo;
  ctx.beginPath(); ctx.arc(0, 0, r * 3.2, 0, Math.PI * 2); ctx.fill();

  ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(4,26,20,' + (0.62 + coreFill * 0.2) + ')';
  ctx.fill();
  ctx.strokeStyle = 'rgba(84,224,160,' + (0.34 + coreGlow * 0.44) + ')';
  ctx.lineWidth = Math.max(1, px(1.6, 1));
  ctx.stroke();

  ctx.globalAlpha = 0.22 + coreGlow * 0.3;
  for (let i = 0; i < 14; i++) {
    const a = (i / 14) * Math.PI * 2 + now * 0.5;
    const len = r * (0.5 + Math.sin(now * 4 + i) * 0.14);
    ctx.beginPath();
    ctx.moveTo(0, 0); ctx.lineTo(Math.cos(a) * len, Math.sin(a) * len);
    ctx.strokeStyle = 'rgba(180,255,215,0.55)';
    ctx.lineWidth = Math.max(0.6, px(0.9, 0.6));
    ctx.stroke();
  }
  ctx.globalAlpha = 1;

  const fr = r * (0.26 + coreFill * 0.62);
  const g = ctx.createRadialGradient(0, 0, 0, 0, 0, fr);
  g.addColorStop(0, 'rgba(223,251,236,' + (0.95 * coreGlow) + ')');
  g.addColorStop(0.5, 'rgba(84,224,160,' + (0.66 * coreGlow) + ')');
  g.addColorStop(1, 'rgba(16,80,56,' + (0.1 * coreGlow) + ')');
  ctx.beginPath(); ctx.arc(0, 0, fr, 0, Math.PI * 2);
  ctx.fillStyle = g; ctx.fill();
  ctx.restore();

  if (corePulse >= 0) {
    const age = now - corePulse;
    if (age < 1.6 * pace) {
      const p = outCubic(age / (1.6 * pace));
      ctx.beginPath();
      ctx.arc(cx, cy, r + p * Math.min(W, H) * 0.45, 0, Math.PI * 2);
      ctx.strokeStyle = (dir > 0 ? 'rgba(84,224,160,' : 'rgba(255,180,58,') + (1 - p) * 0.5 + ')';
      ctx.lineWidth = Math.max(1, 3 * (1 - p));
      ctx.stroke();
    }
  }
}

function drawTendril(n) {
  if (n.grow <= 0.005) return;
  const STEPS = 26;
  const pts = [];
  for (let i = 0; i <= STEPS; i++) pts.push(bow(n, i / STEPS));
  const growTo = Math.max(1, Math.round(n.grow * STEPS));

  const run = (to, style, w, glow) => {
    ctx.beginPath();
    ctx.moveTo(pts[0].x, pts[0].y);
    for (let i = 1; i <= to; i++) ctx.lineTo(pts[i].x, pts[i].y);
    if (glow) { ctx.shadowColor = '#54e0a0'; ctx.shadowBlur = 11; }
    ctx.strokeStyle = style;
    ctx.lineWidth = w;
    ctx.stroke();
    ctx.shadowBlur = 0;
  };

  ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  run(growTo, 'rgba(255,180,58,' + (0.2 + n.grow * 0.3) + ')', px(9, 2.2), false);

  if (n.fill > 0.005) {
    const fillTo = Math.max(1, Math.round(n.fill * growTo));
    run(fillTo, 'rgba(84,224,160,0.9)', px(6, 1.6), true);
    run(fillTo, 'rgba(223,251,236,0.92)', px(2.4, 0.8), false);
  }

  if (n.bound && n.pulseAt >= 0) {
    const age = now - n.pulseAt;
    const dur = 0.7 * pace;
    if (age < dur) {
      const k = outCubic(age / dur);
      const p = bow(n, 1 - k);
      ctx.beginPath();
      ctx.arc(p.x, p.y, px(8, 2.4) * (0.55 + (1 - k) * 0.6), 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(223,251,236,' + (1 - k) + ')';
      ctx.shadowColor = '#54e0a0'; ctx.shadowBlur = 14;
      ctx.fill(); ctx.shadowBlur = 0;
    }
  }
}

function calloutOffset(n) {
  const d = Math.hypot(n.cd[0], n.cd[1]) || 1;
  return { dx: n.cd[0] / d, dy: n.cd[1] / d, len: px(52, 34) * (n.cl || 1) };
}

function drawNode(n) {
  if (n.grow <= 0.02) return;
  const x = sxp(n.x), y = syp(n.y);
  const r = px(11, 3.5);
  const col = n.bound ? '84,224,160' : '255,180,58';
  const a = 0.28 + n.grow * 0.48 + (n.bound ? 0.24 : 0);

  const k = r + px(7, 3), t = px(5, 2.5);
  ctx.strokeStyle = 'rgba(' + col + ',' + (a * 0.8) + ')';
  ctx.lineWidth = Math.max(1, px(1.3, 1));
  ctx.beginPath();
  ctx.moveTo(x - k, y - k + t); ctx.lineTo(x - k, y - k); ctx.lineTo(x - k + t, y - k);
  ctx.moveTo(x + k - t, y - k); ctx.lineTo(x + k, y - k); ctx.lineTo(x + k, y - k + t);
  ctx.moveTo(x + k, y + k - t); ctx.lineTo(x + k, y + k); ctx.lineTo(x + k - t, y + k);
  ctx.moveTo(x - k + t, y + k); ctx.lineTo(x - k, y + k); ctx.lineTo(x - k, y + k - t);
  ctx.stroke();

  if (!n.bound) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(now * 3 + n.x * 0.01);
    ctx.beginPath();
    ctx.arc(0, 0, r + px(3, 1.5), 0, Math.PI * 0.55);
    ctx.strokeStyle = 'rgba(255,180,58,0.55)';
    ctx.lineWidth = Math.max(1, px(1.4, 1));
    ctx.stroke();
    ctx.restore();
  }

  const lead = calloutOffset(n);
  ctx.beginPath();
  ctx.moveTo(x + lead.dx * (r + px(3, 2)), y + lead.dy * (r + px(3, 2)));
  ctx.lineTo(x + lead.dx * (lead.len - px(4, 3)), y + lead.dy * (lead.len - px(4, 3)));
  ctx.strokeStyle = 'rgba(' + col + ',' + (a * 0.5) + ')';
  ctx.lineWidth = Math.max(0.8, px(1, 0.8));
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(x, y, r * 0.55, 0, Math.PI * 2);
  if (n.bound) {
    const g = ctx.createRadialGradient(x, y, 0, x, y, r * 0.55);
    g.addColorStop(0, 'rgba(223,251,236,0.98)');
    g.addColorStop(1, 'rgba(31,180,110,0.82)');
    ctx.fillStyle = g;
    ctx.shadowColor = '#54e0a0'; ctx.shadowBlur = 12;
  } else {
    ctx.fillStyle = 'rgba(255,180,58,' + (0.28 + n.grow * 0.45) + ')';
  }
  ctx.fill();
  ctx.shadowBlur = 0;
}

function placeCallouts() {
  for (const n of nodes) {
    const el = callouts[n.id];
    if (!el) continue;
    const o = calloutOffset(n);
    const x = sxp(n.x) + o.dx * o.len;
    const y = syp(n.y) + o.dy * o.len;
    const alignRight = o.dx < -0.35, alignLeft = o.dx > 0.35;
    /* Kept inside the viewport whatever the fit decided. A callout that
       runs off the edge is worse than one a few pixels closer to its
       part, and the leader still points at the right thing. */
    const w = el.offsetWidth || 90;
    const before = alignRight ? w : alignLeft ? 0 : w * 0.5;
    const after = alignRight ? 0 : alignLeft ? w : w * 0.5;
    el.style.left = clamp(x, 10 + before, W - 10 - after) + 'px';
    el.style.top = clamp(y, 40, H - 40) + 'px';
    el.style.transform = 'translate(' +
      (alignRight ? '-100%' : alignLeft ? '0' : '-50%') + ', -50%)';
    el.classList.toggle('on', n.grow > 0.4);
    el.classList.toggle('bound', n.bound);
  }
}

function spark(x, y, count) {
  for (let i = 0; i < count; i++) {
    const a = Math.random() * Math.PI * 2;
    const v = 28 + Math.random() * 85;
    const life = (0.45 + Math.random() * 0.5) * pace;
    sparks.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v,
                  life, max: life, size: 1 + Math.random() * 1.9 });
  }
}
function mote(x, y) {
  const life = (0.9 + Math.random() * 1.2) * pace;
  motes.push({ x, y, vx: (Math.random() - .5) * 14, vy: (Math.random() - .5) * 14,
               life, max: life, size: 0.7 + Math.random() * 1.3 });
}

function drawParticles() {
  for (const s of sparks) {
    const a = s.life / s.max;
    ctx.beginPath(); ctx.arc(s.x, s.y, s.size * a, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(223,251,236,' + a + ')'; ctx.fill();
  }
  for (const m of motes) {
    const a = m.life / m.max;
    ctx.beginPath(); ctx.arc(m.x, m.y, m.size * a, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(84,224,160,' + (a * 0.5) + ')'; ctx.fill();
  }
}

function draw() {
  if (!ctx) return;
  ctx.clearRect(0, 0, W, H);

  /* The canopy is dimmed, not replaced — the world is still rendering
     behind this and a transition that hides a firefight is a transition
     that gets somebody killed. */
  const g = ctx.createRadialGradient(originX, originY, 0, originX, originY, Math.max(W, H) * 0.75);
  g.addColorStop(0, 'rgba(10,26,36,' + (CONN.dim * 0.94) + ')');
  g.addColorStop(0.42, 'rgba(6,16,25,' + CONN.dim + ')');
  g.addColorStop(1, 'rgba(1,3,5,' + Math.min(1, CONN.dim + 0.06) + ')');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);

  drawShip();
  for (const n of nodes) drawTendril(n);
  for (const n of nodes) drawNode(n);
  drawCore();
  drawParticles();
  placeCallouts();
}

/** Diagnostics, and the suite. */
export const connReport = () => ({
  active, pace,
  mode: dir > 0 ? 'bind' : 'release',
  systems: nodes.map(n => n.id),
  bound: nodes.filter(n => n.bound).map(n => n.id),
  progress: Math.round(connProgress() * 100)
});
