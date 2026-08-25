// Living Galaxy — the main menu: how big a galaxy, and whose life you are living in it.
//
// Two controls that did not exist before v1.02.55, and they answer two different questions.
//
// **Scale.** How much galaxy to build. `depth` is how many systems get pregenerated and
// archived; `density` is how much is inside each one. Both default high, because the
// complaint that produced them was that the place felt thin, and a default that has to be
// found in a menu is a default nobody has. See `GEN` in `core/config/world.js` for why the
// two are separate knobs rather than one "quality" slider.
//
// **Pilots.** The roster. Until now there was one save slot and starting a new game took the
// old character with it; a pilot is now a record in its own database that outlives any
// particular flight — `systems/platform/pilots.js` has the whole argument.
//
// A note on where the settings live: `localStorage`, not the flight save. They are chosen
// *before* a flight exists and they describe the galaxy every flight will be generated into,
// so putting them in a save would mean the first game could not have them and the second
// would inherit the first's.

import { $, el, fmtCr } from '../core/utils.js';
import { GEN } from '../core/config.js';
import { listPilots, resumePilot, retirePilot, beginNewPilot, pilotLine } from '../systems/platform/pilots.js';

const KEY = 'lg.gen';

/** The scale the player last chose, or the defaults. Never throws, never returns junk. */
export function genSettings() {
  let raw = null;
  try { raw = localStorage.getItem(KEY); } catch (e) { /* private mode */ }
  let saved = null;
  try { saved = raw ? JSON.parse(raw) : null; } catch (e) { saved = null; }
  const depth = clampStep(saved && saved.depth, GEN.depth);
  const density = clampStep(saved && saved.density, GEN.density);
  return { depth, density };
}

export function setGenSettings(next) {
  const v = { depth: clampStep(next.depth, GEN.depth), density: clampStep(next.density, GEN.density) };
  try { localStorage.setItem(KEY, JSON.stringify(v)); } catch (e) { /* nothing to remember with */ }
  return v;
}

/**
 * A number in range, or the default.
 *
 * The `== null` guard is not defensive noise — it is the bug `test/boot.mjs` caught. With
 * nothing saved, `saved && saved.depth` is `null`, and `Number(null)` is **0**, which is
 * perfectly finite and clamps to the minimum. So a first-ever boot silently came up at
 * depth 32 and density 0.5 — the smallest galaxy the sliders can express — while the menu
 * and the config both said the default was large. Missing and zero are different facts and
 * an `isFinite` check cannot tell them apart.
 */
function clampStep(v, spec) {
  if (v == null || v === '') return spec.default;
  const n = Number(v);
  if (!isFinite(n)) return spec.default;
  return Math.max(spec.min, Math.min(spec.max, n));
}

/**
 * Roughly how long a rebuild will take, in seconds.
 *
 * A guess, and labelled as one on screen. It exists because a slider that can quietly turn a
 * three-second boot into a forty-second one owes the player a number before they drag it,
 * not after. Calibrated against generation cost per system at density 1 and scaled linearly —
 * generation is dominated by the planet loop, which is linear in density.
 */
export function estimateSeconds(depth, density) {
  // Two costs, and on a fast machine the second one dominates — which is not the obvious
  // half. Generating a system is a fraction of a millisecond; the build yields a frame
  // between chunks so the loading art keeps moving, and those yielded frames are a floor
  // that no amount of CPU gets below. Measured at ~0.2 ms per system on a desktop, so the
  // per-system term is set for a phone at roughly eight times that and the whole thing errs
  // high. A slider that promises 13 seconds and takes 6 is a good surprise.
  const frames = Math.ceil(depth / GEN.chunk) / 60;
  const gen = depth * 0.0016 * (0.6 + density * 0.5);
  return Math.max(1, Math.round(frames + gen));
}

// ── the panel ────────────────────────────────────────────────────────

let onRebuild = null, onResume = null, onNew = null;
let pending = null;

/**
 * @param {object} hooks
 * @param {Function} hooks.rebuild  (settings) => Promise — rebuild the archive at this scale
 * @param {Function} hooks.resume   (pilotId) => void — this pilot is the flight now
 * @param {Function} hooks.newPilot () => void — start a fresh one
 */
export function initMenu(hooks) {
  onRebuild = hooks && hooks.rebuild;
  onResume = hooks && hooks.resume;
  onNew = hooks && hooks.newPilot;

  const depth = $('gen-depth'), density = $('gen-density');
  const cur = genSettings();
  if (depth) {
    depth.min = String(GEN.depth.min);
    depth.max = String(GEN.depth.max);
    depth.step = String(GEN.depth.step);
    depth.value = String(cur.depth);
    depth.addEventListener('input', () => onSlide());
    depth.addEventListener('change', () => commit());
  }
  if (density) {
    // The density slider is integer-stepped and divided by ten, because a range input with a
    // fractional step reports floating-point noise ("1.4000000000000001") on some browsers,
    // and a menu that displays that is a menu that looks broken.
    density.min = String(Math.round(GEN.density.min * 10));
    density.max = String(Math.round(GEN.density.max * 10));
    density.step = '1';
    density.value = String(Math.round(cur.density * 10));
    density.addEventListener('input', () => onSlide());
    density.addEventListener('change', () => commit());
  }
  const apply = $('gen-apply');
  if (apply) apply.addEventListener('click', () => {
    const want = readSliders();
    setGenSettings(want);
    pending = null;
    markPending();
    if (onRebuild) onRebuild(want);
  });

  const nb = $('pilot-new');
  if (nb) nb.addEventListener('click', () => {
    beginNewPilot();
    if (onNew) onNew();
  });

  const list = $('pilot-list');
  if (list) list.addEventListener('click', e => {
    const row = e.target && typeof e.target.closest === 'function' ? e.target.closest('.pilot-row') : null;
    if (!row) return;
    const id = row.dataset.id;
    if (e.target.classList && e.target.classList.contains('pilot-retire')) {
      retirePilot(id).then(() => refreshRoster());
      return;
    }
    if (onResume) onResume(id);
  });

  onSlide();
  refreshRoster();
}

function readSliders() {
  const depth = $('gen-depth'), density = $('gen-density');
  return {
    depth: depth ? Number(depth.value) : genSettings().depth,
    density: density ? Number(density.value) / 10 : genSettings().density
  };
}

function onSlide() {
  const want = readSliders();
  const cur = genSettings();
  const dv = $('gen-depth-val'), sv = $('gen-density-val'), note = $('gen-note');
  if (dv) dv.textContent = `${want.depth} systems`;
  if (sv) sv.textContent = `${want.density.toFixed(1)}×`;
  pending = (want.depth !== cur.depth || want.density !== cur.density) ? want : null;
  if (note) {
    note.textContent = pending
      ? `Rebuild the archive: about ${estimateSeconds(want.depth, want.density)}s.`
      : 'Depth is how many systems are charted before you fly. Density is how much is in each one.';
  }
  markPending();
}

function markPending() {
  const apply = $('gen-apply');
  if (!apply) return;
  apply.classList.toggle('hidden', !pending);
}

/** Write the current slider values through, without rebuilding. */
function commit() {
  // Deliberately does *not* rebuild. Dragging a slider to see what the numbers say should
  // not cost forty seconds of regeneration; the APPLY button is the commitment.
  onSlide();
}

/** Redraw the roster from the database. */
export function refreshRoster() {
  const list = $('pilot-list');
  if (!list) return Promise.resolve([]);
  return listPilots().then(rows => {
    if (!rows.length) {
      list.innerHTML = '<div class="pilot-empty">No pilots on file. Power up to create one.</div>';
      return rows;
    }
    list.innerHTML = rows.map(p =>
      `<div class="pilot-row${p.active ? ' active' : ''}" data-id="${p.id}">` +
      `<div class="pr-main"><span class="pr-name">${escapeHtml(p.name)}</span>` +
      `<span class="pr-line">${escapeHtml(pilotLine(p))}</span></div>` +
      `<span class="pr-cr">${fmtCr(p.credits || 0)}</span>` +
      `<button class="pilot-retire" title="Retire">✕</button></div>`
    ).join('');
    return rows;
  });
}

function escapeHtml(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** Put a line under the menu title saying what the archive holds. */
export function setArchiveLine(text) {
  const n = $('gen-archive');
  if (n) n.textContent = text;
}
