// Living Galaxy — what a career is allowed to do.
//
// Five careers are pilots with a specialisation. The sixth is not a pilot at all, and
// until now the only thing that said so was a comment in `data/origins.js` and a missing
// hull. Everything downstream — the flight HUD, the throttle, the steering handler, the
// renderer — was written on the assumption that there is always a ship and the player is
// always in it, and an executive quietly inherited all of it.
//
// This module is the one place that answers "may this character fly", so the answer
// cannot drift between the six or seven files that need to ask. It is deliberately tiny
// and dependency-light: `core/state` and the career table, nothing else. Anything that
// needs a *surface* decision (which HUD, which render path) asks `commandSurface()`
// rather than testing the career key itself.
//
// The lock is hard by design. An executive who can still take the stick is a pilot with
// extra menus, and the whole point of the career is that the fleet is the instrument.

import { S } from '../../core/state.js';
import { CAREERS } from '../../data/origins.js';

/** The career key on the current character, or null before creation. */
export const careerKey = () => (S.character && S.character.career) || null;

/** The career record, or null. */
const careerDef = () => CAREERS[careerKey()] || null;

/** Founders. The only career with no hull and no stick. */
export const isExecutive = () => careerKey() === 'executive';

/**
 * May this character personally fly a ship?
 *
 * False for exactly one career today, but written as a capability rather than a career
 * test so the next non-flying path — a station administrator, a factor — does not have to
 * touch every call site again.
 */
export const canPilot = () => !isExecutive();

/**
 * Which HUD owns the screen: 'flight' (canopy, throttle, weapons) or 'command' (the
 * executive deck, detached from the game world). Read by `main.js` to decide whether the
 * 3D scene is drawn at all — a command surface has nothing behind it to look at, so the
 * renderer is not asked to produce a frame nobody sees.
 */
export const commandSurface = () => (isExecutive() ? 'command' : 'flight');

/** True while the game is running under a career that never renders the world directly. */
const commandOnly = () => S.running && isExecutive();

/**
 * One line for the boot toast and the deck header. Kept here rather than in the UI so a
 * career added later cannot ship without one.
 */
export function careerLine() {
  const k = careerDef();
  if (!k) return 'Unregistered';
  return canPilot() ? `${k.name} — licensed to fly` : `${k.name} — command authority, no flight licence in use`;
}
