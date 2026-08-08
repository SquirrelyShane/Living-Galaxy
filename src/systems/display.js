// Living Galaxy — display and access settings.
//
// The game has accumulated a lot of meaning encoded in colour: red is hostile, blue is
// friendly, amber is a warning, green is good. Roughly one man in twelve cannot reliably
// separate the first two of those, which means a meaningful fraction of players have been
// reading the contacts list and the threat banner by position and hoping.
//
// Everything here works by setting a class on <html> and letting CSS custom properties do
// the rest. No JavaScript branches on the palette, so a new colour scheme is a stylesheet
// change and cannot introduce a logic bug. The same applies to text scale and motion.

import { S } from '../core/state.js';
import { DISPLAY } from '../core/config.js';

export const PALETTES = {
  standard: { name: 'Standard', desc: 'Red hostile, blue friendly' },
  deuter:   { name: 'Deutan-safe', desc: 'Orange hostile, blue friendly — for red-green' },
  trit:     { name: 'Tritan-safe', desc: 'Magenta hostile, teal friendly — for blue-yellow' },
  mono:     { name: 'High contrast', desc: 'Shape and brightness carry the meaning' }
};
export const PALETTE_KEYS = Object.keys(PALETTES);

const root = () => (typeof document !== 'undefined' && document.documentElement) || null;

export function defaults() {
  return {
    palette: 'standard',
    textScale: 1,
    reducedMotion: false,
    hideVignette: false,
    shapeMarkers: false     // adds a glyph to contacts so colour is never the only cue
  };
}

/** Read the live settings, filling in anything a save predates. */
export function display() {
  if (!S.settings.display) S.settings.display = defaults();
  else S.settings.display = Object.assign(defaults(), S.settings.display);
  return S.settings.display;
}

/**
 * Push settings into the document. Idempotent, so it is safe to call on every change
 * and on load without tracking what was applied last.
 */
export function applyDisplay() {
  const d = display();
  const r = root();
  if (!r || !r.classList) return d;

  for (const k of PALETTE_KEYS) r.classList.toggle('pal-' + k, d.palette === k);
  r.classList.toggle('reduced-motion', !!d.reducedMotion);
  r.classList.toggle('no-vignette', !!d.hideVignette);
  r.classList.toggle('shape-markers', !!d.shapeMarkers);

  const scale = Math.max(DISPLAY.minScale, Math.min(DISPLAY.maxScale, d.textScale || 1));
  d.textScale = scale;
  if (r.style) r.style.fontSize = Math.round(DISPLAY.baseFont * scale) + 'px';
  return d;
}

export function setDisplay(key, value) {
  const d = display();
  if (!(key in d)) return false;
  d[key] = value;
  applyDisplay();
  return true;
}

/** Step the text scale, for a pair of +/− buttons. */
export function nudgeTextScale(delta) {
  const d = display();
  setDisplay('textScale', Math.round((d.textScale + delta) * 20) / 20);
  return display().textScale;
}

export function cyclePalette() {
  const d = display();
  const i = PALETTE_KEYS.indexOf(d.palette);
  setDisplay('palette', PALETTE_KEYS[(i + 1) % PALETTE_KEYS.length]);
  return display().palette;
}

/**
 * Whether an effect that moves a lot should run at all. Screen shake, speed streaks and
 * the damage vignette all ask this rather than checking the setting themselves, so
 * "reduced motion" has one definition instead of five.
 */
export const motionOk = () => !display().reducedMotion;
