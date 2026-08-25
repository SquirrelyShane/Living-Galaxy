// Living Galaxy — the crew's inbox. One flag, set by whoever saw it happen.
//
// ## Why this is its own file
//
// Some of the things the crew talk about cannot be read off the ship a second later.
// "Somebody was hurt" is a state the infirmary has already started clearing; "payroll ran"
// leaves nothing behind but a number that was going to change anyway. Those have to be
// *announced* by the system that owns the event rather than sensed by the one that talks
// about it.
//
// Which means half the simulation needs to call into the talker — payroll, casualties,
// hiring, fitting, kills. And `crew-talk.js` reads contracts, the sweep and the habitat to
// work out what is going on, and those read economy, which is where fitting lives. Import
// that graph in both directions and the module cycle count goes up by twelve, which is how
// this file came to exist: it is the half of `crew-talk.js` that everybody needs, with
// nothing underneath it but `S.time`.
//
// A flag expires on its own. A missed frame costs one line of dialogue, which is the
// correct price for a missed frame — the alternative is a ship permanently stuck in a
// situation that stopped being true an hour ago.

import { S } from '../../core/state.js';

/** How long a note stays fresh. Long enough to survive a frame the talker sat out. */
const TTL = 6;

let notes = {};

/**
 * Something happened that the crew would notice.
 * @param {string} key a situation id from data/crew-dialogue.js
 */
export function crewNote(key) {
  if (!key) return false;
  notes[key] = (S.time || 0) + TTL;
  return true;
}

/** Is this note still fresh? */
export const noteFresh = key => (notes[key] || 0) > (S.time || 0);

/** Every note still standing. Diagnostics and the suite. */
export const openNotes = () => Object.keys(notes).filter(noteFresh);

export function resetCrewNotes() { notes = {}; }
