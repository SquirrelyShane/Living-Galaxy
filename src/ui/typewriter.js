// Living Galaxy — text that arrives at the speed somebody says it.
//
// ## Why
//
// A generated line from an NPC appeared in the comms log fully formed, all at once, exactly
// like a log entry — because that is what it was. The dialogue system underneath it is doing
// real work (personas, memory, grammar, and now a language model), and none of that reads as
// *somebody talking* when the output materialises as a finished paragraph.
//
// Revealing it a character at a time is the oldest trick in the genre and it works for a
// reason that has nothing to do with nostalgia: it puts the line on a clock. A sentence that
// takes 1.4 seconds to arrive has a pace, and a pace is most of what makes text feel spoken.
// The tone under it does the rest — pitched per speaker, so a raider and a station controller
// are audibly different voices before you have read a word of either.
//
// ## Three rules it has to obey
//
//   1. **Never lose the text.** The full string is on the node from the first frame, as a
//      data attribute, and every exit path writes it in whole. A reveal that is interrupted
//      by a re-render, a pane switch or a tab going to sleep must leave the complete line
//      behind, not the eleven characters it got to.
//   2. **Never type the same line twice.** The comms panel rebuilds its whole list on every
//      update, so "reveal on render" would restart every visible line every time anything
//      happened. Lines are keyed, and a key that has been revealed is finished for ever.
//   3. **Always skippable.** One tap completes it. Nobody should ever be waiting on an
//      animation to find out what a pirate said.

import { sfx } from '../systems/platform/audio.js';
import { S } from '../core/state.js';

/** Characters per second, by who is speaking. A controller is brisk; a drone is not. */
const RATE = {
  you: 90,
  hail: 42,
  system: 120,
  chatter: 52,
  aria: 46
};

/** Punctuation buys a pause, as a multiple of one character's time. */
const PAUSE = { ',': 3, ';': 3, ':': 3, '.': 6, '!': 6, '?': 6, '—': 4, '…': 8 };

/** Lines already told. Keyed, so a rebuilt list does not re-type its history. */
const told = new Set();
let active = [];

/** Has this line already been revealed? */
export const alreadyTold = key => told.has(String(key));

/** Mark a line as told without animating it — for anything rendered before the panel opened. */
export function markTold(key) { told.add(String(key)); }

/** Forget everything. New game, or a cleared log. */
export function resetTypewriter() {
  finishAll();
  told.clear();
}

/** Complete every reveal in flight, immediately. */
export function finishAll() {
  for (const run of active.slice()) run.finish();
  active = [];
}

export const typingCount = () => active.length;

/**
 * Reveal `text` into `node`, one character at a time.
 *
 * @param {Element} node      where the text goes. Its content is replaced.
 * @param {string} text       the whole line
 * @param {object} [opts]
 * @param {string} [opts.key] identity — a line with a key is only ever typed once
 * @param {string} [opts.kind] 'chatter' | 'hail' | 'you' | 'system' | 'aria' — sets the rate
 * @param {number} [opts.voice] a number that picks the tone's pitch; same number, same voice
 * @param {Function} [opts.onDone]
 * @returns {object|null} a handle with `finish()`, or null if it did not animate
 */
export function type(node, text, opts) {
  const o = opts || {};
  const full = String(text == null ? '' : text);
  if (!node) return null;

  const key = o.key != null ? String(o.key) : null;
  // The full text goes on the node before anything else happens, so every early return and
  // every interruption below has the whole line to fall back on.
  node.dataset.full = full;

  const instant = !full || (key && told.has(key)) || !S.settings || S.settings.typewriter === false;
  if (instant) {
    node.textContent = full;
    if (key) told.add(key);
    if (o.onDone) o.onDone();
    return null;
  }
  if (key) told.add(key);

  const cps = RATE[o.kind] || RATE.chatter;
  const perChar = 1000 / cps;
  const voice = (o.voice == null ? 0 : o.voice) | 0;

  let i = 0, timer = 0, sinceTone = 0;
  node.textContent = '';
  node.classList.add('typing');

  const run = {
    node,
    finish() {
      if (timer) { clearTimeout(timer); timer = 0; }
      node.textContent = node.dataset.full || full;
      node.classList.remove('typing');
      const k = active.indexOf(run);
      if (k >= 0) active.splice(k, 1);
      if (o.onDone) o.onDone();
    }
  };

  const stepOnce = () => {
    if (!node.isConnected && node.isConnected !== undefined) { run.finish(); return; }
    const ch = full[i++];
    node.textContent += ch;
    // One tone every few characters, not one per character. Per character is a machine gun
    // at fifty characters a second and it is the reason typewriter sounds have a reputation.
    if (++sinceTone >= 3 && ch !== ' ') {
      sinceTone = 0;
      sfx.type(voice);
    }
    if (i >= full.length) { run.finish(); return; }
    const wait = perChar * (PAUSE[ch] || 1);
    timer = setTimeout(stepOnce, wait);
  };

  active.push(run);
  timer = setTimeout(stepOnce, perChar);
  return run;
}

/**
 * A stable voice number for a name.
 *
 * The same speaker has to sound the same every time or the effect is noise. Hashed from the
 * name rather than assigned from a counter, so it survives a reload and does not depend on
 * who spoke first.
 */
export function voiceOf(name) {
  let h = 2166136261;
  const s = String(name || '');
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  // Twenty-four rather than twelve. With twelve, five speakers in earshot collided into
  // three voices often enough for the effect to read as "some of them sound the same",
  // which is worse than not pitching at all — it implies a relationship that is not there.
  return (h >>> 0) % 24;
}
