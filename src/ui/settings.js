// Living Galaxy — settings and diagnostics.
//
// Two things that had no home. Display and access options lived nowhere at all, and the
// only way to see a captured fault or a frame-time percentile was to open a console — on
// a phone, effectively never. Slice 1 built `LG.diagnostics()` and `LG.perf()` precisely
// so this panel could exist; this is it finally existing.
//
// The diagnostics half is deliberately plain text with a copy button rather than a pretty
// dashboard. What a bug report needs is something a player can paste, and what a
// dashboard gives is something they have to transcribe.

import { $, el } from '../core/utils.js';
import { S } from '../core/state.js';
import { PALETTES, PALETTE_KEYS, display, setDisplay, applyDisplay,
         nudgeTextScale } from '../systems/platform/display.js';
import { diagnostics, unpark, downloadLog, formatLog } from '../core/diagnostics.js';
import { perfStats, clock } from '../core/clock.js';
import { hudStats, resetHudStats } from './hud.js';
import { VERSION, CODENAME, SCHEMA } from '../core/version.js';
import { ACTIONS, ACTION_KEYS, bindings, bind, resetBindings, keyLabel,
         gamepad } from '../systems/platform/input.js';
import { qualityState, setQualityLevel, setAuto, LEVELS } from '../world/quality.js';
import { renderProfile } from '../world/scene.js';
import { lodReport } from '../world/lod.js';
import { trackedCount } from '../world/interpolate.js';
import { AUDIO } from '../core/config.js';
import { sfx, setBusLevel, busLevel } from '../systems/platform/audio.js';
import { netReport } from '../systems/platform/net.js';

let overlay, body, tabs;
let tab = 'display';
let timer = 0;

export function initSettings() {
  overlay = $('settings-overlay');
  body = $('settings-body');
  tabs = $('settings-tabs');
  if (!overlay) return;

  const close = $('settings-close');
  if (close) close.addEventListener('click', () => closeSettings());

  const btn = $('btn-settings');
  if (btn) btn.addEventListener('click', () => (isOpen() ? closeSettings() : openSettings()));

  if (tabs) {
    for (const t of ['display', 'render', 'audio', 'access', 'controls', 'lab', 'diagnostics']) {
      const b = el('button', 'tab' + (t === tab ? ' active' : ''), t);
      b.dataset.stab = t;
      b.addEventListener('click', () => { tab = t; sfx.ui(); render(); });
      tabs.appendChild(b);
    }
  }
  applyDisplay();
}

export const isOpen = () => overlay && !overlay.classList.contains('hidden');

export function openSettings() { if (overlay) { overlay.classList.remove('hidden'); render(); } }
export function closeSettings() { if (overlay) overlay.classList.add('hidden'); }

/** Diagnostics is live data, so it refreshes while it is on screen — and only then. */
export function tickSettings(dt) {
  if (!isOpen() || tab !== 'diagnostics') return;
  timer += dt;
  if (timer < 1) return;
  timer = 0;
  render();
}

// ── rendering ────────────────────────────────────────────────────────

function render() {
  if (!body) return;
  if (tabs) for (const b of (tabs.children || [])) {
    if (b.classList) b.classList.toggle('active', b.dataset.stab === tab);
  }
  body.innerHTML = '';
  if (tab === 'display') renderDisplay();
  else if (tab === 'render') renderRender();
  else if (tab === 'audio') renderAudio();
  else if (tab === 'access') renderAccess();
  else if (tab === 'controls') renderControls();
  else if (tab === 'lab') renderLab();
  else renderDiagnostics();
}

function toggleRow(label, desc, on, onClick) {
  const r = el('div', 'set-row');
  r.appendChild(el('div', '', `<div class="nm">${label}</div><div class="meta">${desc}</div>`));
  const b = el('button', 'buy-btn' + (on ? ' on' : ''), on ? 'ON' : 'OFF');
  b.addEventListener('click', () => { sfx.ui(); onClick(); render(); });
  r.appendChild(b);
  body.appendChild(r);
}

function renderDisplay() {
  const d = display();

  body.appendChild(el('div', 'sec-head', 'Text size'));
  const r = el('div', 'set-row');
  r.appendChild(el('div', '',
    `<div class="nm">${Math.round(d.textScale * 100)}%</div>` +
    `<div class="meta">Scales the whole interface, not just the panels</div>`));
  const minus = el('button', 'buy-btn', '−');
  const plus = el('button', 'buy-btn', '+');
  minus.addEventListener('click', () => { nudgeTextScale(-0.05); sfx.ui(); render(); });
  plus.addEventListener('click', () => { nudgeTextScale(0.05); sfx.ui(); render(); });
  const wrap = el('div', 'set-pair');
  wrap.appendChild(minus); wrap.appendChild(plus);
  r.appendChild(wrap);
  body.appendChild(r);

  toggleRow('Reduced motion', 'Stops streaks, sweeps and screen effects',
    d.reducedMotion, () => setDisplay('reducedMotion', !d.reducedMotion));
  // Sits with reduced motion rather than with audio, because that is what it is: an
  // animation on text. Somebody who turns reduced motion on is usually about to want this
  // off too, and having to hunt another tab for it is the wrong answer.
  toggleRow('Spoken dialogue', 'NPC and ARIA lines arrive a character at a time, with tone',
    S.settings.typewriter !== false,
    () => { S.settings.typewriter = S.settings.typewriter === false; render(); });
  toggleRow('Damage vignette', 'Red edge flash when the hull is hit',
    !d.hideVignette, () => setDisplay('hideVignette', !d.hideVignette));
  // Sits here for the same reason the typewriter does: it is an animation, and the person
  // turning reduced motion on is the person who wants it gone. The autopilot works
  // identically either way — the sequence never was load-bearing. See ui/conn.js.
  toggleRow('Autopilot handoff', 'ARIA\u2019s lattice claims each system when AP engages',
    S.settings.connSeq !== false,
    () => { S.settings.connSeq = S.settings.connSeq === false; render(); });
}

function renderAccess() {
  const d = display();

  body.appendChild(el('div', 'sec-head', 'Threat palette'));
  body.appendChild(el('div', 'cnote',
    'Hostile and friendly are the most important distinction in the game, and in the ' +
    'standard palette they are red and blue — the pair that red-green colour blindness ' +
    'collapses. These change what those two colours are.'));

  for (const key of PALETTE_KEYS) {
    const P = PALETTES[key];
    const c = el('div', 'ccard' + (d.palette === key ? ' on' : ''));
    c.innerHTML = `<div class="ct">${P.name}</div><div class="cb">${P.desc}</div>` +
      `<div class="cr"><span class="pip bad">hostile</span>` +
      `<span class="pip good">friendly</span></div>`;
    c.addEventListener('click', () => { setDisplay('palette', key); sfx.ui(); render(); });
    body.appendChild(c);
  }

  toggleRow('Shape markers', 'Adds a glyph to each contact so colour is never the only cue',
    d.shapeMarkers, () => setDisplay('shapeMarkers', !d.shapeMarkers));
}

function renderDiagnostics() {
  const perf = perfStats();
  const hud = hudStats();
  const diag = diagnostics();

  body.appendChild(el('div', 'sec-head', 'Frame'));
  const stat = (k, v) => `<div class="crow"><span>${k}</span><span>${v}</span></div>`;
  body.appendChild(el('div', 'csum',
    stat('Build', `v${VERSION} · ${CODENAME} · schema ${SCHEMA}`) +
    stat('Frame rate', `${perf.fps} fps`) +
    stat('Frame time avg', `${perf.avg} ms`) +
    stat('Frame time p95', `${perf.p95} ms`) +
    stat('Worst frame', `${perf.worst} ms`) +
    stat('Sim steps', String(perf.steps || clock.steps)) +
    stat('Dropped catch-up', String(perf.stalls || clock.stalls))));

  body.appendChild(el('div', 'sec-head', 'HUD write budget'));
  body.appendChild(el('div', 'csum',
    stat('Writes per frame', String(hud.perFrame)) +
    stat('Skipped', `${Math.round(hud.hitRate * 100)}%`) +
    stat('Frames sampled', String(hud.frames))));
  const rb = el('button', 'buy-btn', 'RESET');
  rb.addEventListener('click', () => { resetHudStats(); sfx.ui(); render(); });
  body.appendChild(rb);

  const n = netReport();
  body.appendChild(el('div', 'sec-head', 'Link'));
  if (!n.connected) {
    body.appendChild(el('div', 'empty-note', 'Flying solo — no relay connected.'));
  } else {
    body.appendChild(el('div', 'csum',
      stat('Pilots', String(n.pilots)) +
      stat('Simulating the system', n.isHost ? 'you' : `pilot ${n.host}`) +
      stat('Shared ships received', String(n.ghosts)) +
      stat('Round trip', `${n.rtt} ms (best ${n.bestRtt} ms)`) +
      stat('Clock offset', `${n.offset}s${n.synced ? '' : ' — not yet synced'}`) +
      stat('Snapshot buffer', `${n.buffer} frames`) +
      stat('Reconnects', String(n.retries)) +
      stat('Traffic', `${Math.round(n.stats.bytesOut / 1024)} kB out · ${Math.round(n.stats.bytesIn / 1024)} kB in`)));
  }

  body.appendChild(el('div', 'sec-head', `Faults · ${diag.log.length}`));
  if (!diag.log.length) {
    body.appendChild(el('div', 'empty-note', 'Nothing has thrown. This is the good outcome.'));
  } else {
    if (diag.parked.length) {
      const p = el('div', 'set-row');
      p.appendChild(el('div', '',
        `<div class="nm urgent">Parked: ${diag.parked.join(', ')}</div>` +
        `<div class="meta">These systems stopped running after repeated faults</div>`));
      const b = el('button', 'buy-btn', 'RESTART');
      b.addEventListener('click', () => { unpark(); sfx.ui(); render(); });
      p.appendChild(b);
      body.appendChild(p);
    }
    const pre = el('div', 'diag-log');
    pre.textContent = diag.log.slice(-12).map(e => {
      const head = `[${e.where}] ${e.message}`;
      return e.stack ? head + '\n  ' + e.stack.split('\n').slice(0, 3).join('\n  ') : head;
    }).join('\n');
    body.appendChild(pre);

    // Physical copy for phones and for pasting into a bug report. Console is unreachable
    // on most of the devices this actually runs on; a downloadable .log is not.
    const dl = el('button', 'buy-btn', 'DOWNLOAD LOG');
    dl.addEventListener('click', () => {
      sfx.ui();
      if (!downloadLog()) {
        // Fallback: put the text on the clipboard when a blob download is unavailable.
        try {
          if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(formatLog());
          }
        } catch (_) { /* ignore */ }
      }
    });
    body.appendChild(dl);
    if (diag.logFile) {
      body.appendChild(el('div', 'cnote', `Also writing to ${diag.logFile}`));
    }
  }
}

// ── render ───────────────────────────────────────────────────────────

function renderRender() {
  const q = qualityState();
  const prof = renderProfile();

  toggleRow('Adaptive quality',
    'Watches the 95th-percentile frame time and sheds work when the frame slips',
    q.auto, () => setAuto(!q.auto));

  body.appendChild(el('div', 'sec-head', `Level · ${q.name}`));
  body.appendChild(el('div', 'cnote', q.auto
    ? `Chosen automatically — last change: ${q.lastReason}. ` +
      `${q.drops} drop${q.drops === 1 ? '' : 's'}, ${q.climbs} climb${q.climbs === 1 ? '' : 's'} this session.`
    : 'Locked manually. Turn adaptive quality back on to let it respond to the frame.'));

  for (let i = LEVELS.length - 1; i >= 0; i--) {
    const L = LEVELS[i];
    const c = el('div', 'ccard' + (q.level === i ? ' on' : ''));
    c.innerHTML = `<div class="ct">${L.name}</div>` +
      `<div class="cr">` +
      `<span class="pip">${L.pixelRatio}x pixels</span>` +
      `<span class="pip">${Math.round(L.effects * 100)}% effects</span>` +
      `<span class="pip">${L.antialias ? 'AA on' : 'AA off'}</span></div>`;
    c.addEventListener('click', () => { setAuto(false); setQualityLevel(i); sfx.ui(); render(); });
    body.appendChild(c);
  }

  if (prof.antialiasNeedsRestart) {
    body.appendChild(el('div', 'cnote',
      'Antialiasing is fixed when the graphics context is created, so this level\u2019s ' +
      'setting takes effect on the next launch. Changing it live would mean rebuilding ' +
      'every buffer on the card, which costs far more than the aliasing it removes.'));
  }

  const lod = lodReport();
  body.appendChild(el('div', 'sec-head', 'Geometry'));
  const stat2 = (k, v) => `<div class="crow"><span>${k}</span><span>${v}</span></div>`;
  body.appendChild(el('div', 'csum',
    stat2('Pixel ratio in use', String(prof.activePixelRatio)) +
    stat2('Bodies tracked', String(lod.tracked)) +
    stat2('Culled this frame', String(lod.culled)) +
    stat2('At full detail', String(lod.buckets[0] || 0)) +
    stat2('Interpolated objects', String(trackedCount()))));
}

// ── audio ────────────────────────────────────────────────────────────

function renderAudio() {
  body.appendChild(el('div', 'cnote',
    'Four buses. Alerts duck the others rather than out-shouting them \u2014 a warning ' +
    'that has to win a shouting match is a warning you miss.'));

  const LABEL = { sfx: 'Effects', alert: 'Alerts', engine: 'Engines', music: 'Music bed' };
  for (const name in AUDIO.buses) {
    const v = busLevel(name);
    const r = el('div', 'set-row');
    r.appendChild(el('div', '',
      `<div class="nm">${LABEL[name] || name}</div>` +
      `<div class="meta">${Math.round(v * 100)}%</div>` +
      `<div class="bar-track slim"><div class="bar-fill energy" style="width:${Math.round(v * 100)}%"></div></div>`));
    const pair = el('div', 'set-pair');
    const down = el('button', 'buy-btn', '\u2212');
    const up = el('button', 'buy-btn', '+');
    down.addEventListener('click', () => { setBusLevel(name, v - 0.1); sfx.ui(); render(); });
    up.addEventListener('click', () => { setBusLevel(name, v + 0.1); sfx.ui(); render(); });
    pair.appendChild(down); pair.appendChild(up);
    r.appendChild(pair);
    body.appendChild(r);
  }
}

// ── controls ─────────────────────────────────────────────────────────
// Rebinding works by listening for the *next* key pressed rather than by offering a menu
// of key names. A menu would have to enumerate every key on every layout, and would still
// be wrong for anyone whose keyboard the list did not anticipate.

let listening = null;

function captureNext(action) {
  listening = action;
  render();
  const handler = (e) => {
    e.preventDefault();
    removeEventListener('keydown', handler, true);
    listening = null;
    if (e.code !== 'Escape') bind(action, e.code);   // Escape cancels rather than binds
    render();
  };
  addEventListener('keydown', handler, true);
}

function renderControls() {
  const pad = gamepad();
  body.appendChild(el('div', 'cnote',
    pad.connected
      ? `Gamepad connected: ${pad.id}. Sticks fly, buttons follow the standard layout.`
      : 'No gamepad detected. Plug one in and it will be picked up on the next frame — ' +
        'sticks are proportional, so a quarter deflection is a quarter of the turn rate.'));

  const b = bindings();
  body.appendChild(el('div', 'sec-head', 'Key bindings'));
  for (const key of ACTION_KEYS) {
    const r = el('div', 'set-row');
    r.appendChild(el('div', '',
      `<div class="nm">${ACTIONS[key].name}</div>` +
      `<div class="meta">${b[key].map(keyLabel).join(' · ') || 'unbound'}</div>`));
    const btn = el('button', 'buy-btn' + (listening === key ? ' on' : ''),
                   listening === key ? 'PRESS…' : 'BIND');
    btn.addEventListener('click', () => { sfx.ui(); captureNext(key); });
    r.appendChild(btn);
    body.appendChild(r);
  }

  const reset = el('button', 'buy-btn', 'RESET TO DEFAULTS');
  reset.addEventListener('click', () => { resetBindings(); sfx.ui(); render(); });
  body.appendChild(reset);
}

/** Everything a bug report needs, as one pasteable string. */
export function diagnosticReport() {
  return JSON.stringify({
    build: VERSION, codename: CODENAME, schema: SCHEMA,
    seed: S.seed, playtime: Math.round(S.playtime || 0),
    perf: perfStats(), hud: hudStats(), diagnostics: diagnostics()
  }, null, 2);
}


// ── the lab ──────────────────────────────────────────────────────────
//
// The experimental branch, exposed honestly rather than hidden behind a console call.
// The rule the flag has to satisfy is that turning it *off* is always safe: managers go
// inert, sites keep every facility they have, and the save still loads. Nothing here is
// a one-way door.

function renderLab() {
  body.appendChild(el('div', 'sec-head', 'Experimental subsystems'));
  body.appendChild(el('div', 'set-note',
    'Automated site managers: one archetype per branch, each with its own objective, ' +
    'its own ordered policy list and its own periodic re-optimisation pass. A Foreman ' +
    'and a Factor looking at the same brownout will do different things, and both will ' +
    'tell you which policy made them do it. Turning this off leaves managers inert ' +
    'rather than removing anything \u2014 your sites keep every facility they have.'));
  toggleRow('Automated managers', 'Hire them from Operations \u2192 Staff',
    experimentalOn(), () => setExperimental(!experimentalOn()));

  body.appendChild(el('div', 'sec-head', 'NPC minds'));
  const br = brainsReport();
  body.appendChild(el('div', 'set-note',
    'Every NPC already has a personality, a memory and a voice \u2014 those cost nothing ' +
    'and are always on. This switch controls the top tier only: a small language model, ' +
    'run in a worker on your own device, that rewrites a hail in the speaker\u2019s own ' +
    'words. It is asked at most once per conversation and the game never waits on it \u2014 ' +
    'if it is slow, absent or fails, you keep the line you already had.'));
  toggleRow('Language-model dialogue', `Tier 3 \u00b7 ${br.model} \u00b7 ${br.personas} characters known`,
    br.enabled, () => { setBrainsEnabled(!brainsReport().enabled); render(); });

  const lr = el('div', 'set-row');
  lr.appendChild(el('div', '',
    `<div class="nm">Model: ${br.llm.status}</div>` +
    `<div class="meta">Several hundred MB, downloaded once and cached by the browser. ` +
    `Wi-Fi recommended.</div>`));
  const lb = el('button', 'buy-btn', br.llm.status === 'ready' ? 'LOADED' : 'DOWNLOAD');
  lb.addEventListener('click', () => { sfx.ui(); loadBrainModel(); render(); });
  lr.appendChild(lb);
  body.appendChild(lr);

  body.appendChild(el('div', 'sec-head', 'Flight training'));
  body.appendChild(el('div', 'set-note',
    'Seven observation-based stages. It never blocks a control and never takes the ship \u2014 ' +
    'it watches for the thing happening and closes the stage when it does.'));
  const r = el('div', 'set-row');
  r.appendChild(el('div', '',
    `<div class="nm">${tutorialDone() ? 'Completed' : 'In progress'}</div>` +
    `<div class="meta">Restarting it does not touch your ship, cargo or standing</div>`));
  const b = el('button', 'buy-btn', 'RESTART');
  b.addEventListener('click', () => { sfx.ui(); startTutorial(); renderTutorialCard(); render(); });
  r.appendChild(b);
  body.appendChild(r);
}
