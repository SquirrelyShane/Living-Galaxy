// Living Galaxy — the magazine.
//
// `systems/ordnance.js` says what a round *is*. This says what you are carrying, what is
// chambered, and what happens when you pull the trigger with an empty rack.
//
// Two deliberate shapes:
//
//   **One chambered round per feed, not per mount.** Three autocannons on one hull share a
//   magazine, because they share a supply chain and because asking a pilot to set the same
//   round three times is a chore dressed as a decision. When weapon groups arrive, the
//   group is what will carry the choice — and a feed is already the right granularity for
//   that.
//
//   **Fractional draw, integer stock.** A high-rate autocannon that ate a whole round per
//   trigger frame would empty a 200-slug stack in half a minute. Feeds draw a fraction of
//   a round per shot (`ORDNANCE.roundsPerShot`) and the remainder is carried, so the stock
//   number a player sees only ever moves by whole rounds and a burst weapon is not a
//   different economy from a heavy one.

import { S } from '../../core/state.js';
import { AMMUNITION } from '../../data/crafting/ammo.js';
import { WEAPON_MODULES } from '../../data/weapons.js';
import { WEAPON_FEED, FEEDS, feedIds } from './ordnance.js';
import { status } from '../../core/notify.js';

export const ammoStock = () => (S.ammo = S.ammo || {});
export const loadout = () => (S.loadout = S.loadout || {});

/**
 * Rounds of a given id aboard.
 *
 * Rounded *up*, not down. Stock is fractional internally so a burst weapon can draw a
 * third of a round per trigger frame; a part-expended round is still a round you have, and
 * flooring would show a pilot 9 slugs the instant they touched the trigger on a full rack
 * of 10. The count only steps when a whole round has actually gone.
 */
export const roundsHeld = id => Math.ceil(ammoStock()[id] || 0);

/** The feed a mounted weapon definition draws from, or null for an energy weapon. */
export function feedOf(def) {
  if (!def || !def.name) return null;
  for (const k in WEAPON_MODULES) {
    if (WEAPON_MODULES[k].name === def.name) return WEAPON_FEED[k] || null;
  }
  return null;
}

/**
 * What is chambered in a feed right now.
 *
 * If nothing is selected — or the selection has run out — the cheapest compatible round
 * still aboard is chambered automatically. A pilot who never opens the loadout panel
 * should never be told their guns are empty while there are slugs in the hold; the panel
 * is for *choosing*, not for the basic case working.
 */
export function chambered(feedKey) {
  if (!FEEDS[feedKey]) return null;
  const chosen = loadout()[feedKey];
  if (chosen && roundsHeld(chosen) > 0) return AMMUNITION[chosen] || null;
  for (const id of feedIds(feedKey)) {
    if (roundsHeld(id) > 0) { loadout()[feedKey] = id; return AMMUNITION[id]; }
  }
  return null;
}

/** Choose a round. Refuses one the feed cannot chamber rather than silently ignoring it. */
export function chamber(feedKey, id) {
  if (!FEEDS[feedKey] || !AMMUNITION[id]) return false;
  if (!feedIds(feedKey).includes(id)) return false;
  loadout()[feedKey] = id;
  status(`${FEEDS[feedKey].name} — ${AMMUNITION[id].name}`);
  return true;
}

/** Total rounds aboard for a feed, across every compatible type. */
export const feedRounds = feedKey =>
  feedIds(feedKey).reduce((n, id) => n + roundsHeld(id), 0);

/** Is there anything at all this feed could fire? */
export const feedLoaded = feedKey => !!chambered(feedKey);

/**
 * Spend rounds. `qty` may be fractional; the shortfall is carried on the stock itself, so
 * the visible count only ever steps by whole rounds.
 */
export function drawRounds(feedKey, qty = 1) {
  const a = chambered(feedKey);
  if (!a) return false;
  const stock = ammoStock();
  const have = stock[a.id] || 0;
  const spent = Math.min(have, qty);
  stock[a.id] = have - spent;
  if (stock[a.id] <= 0) {
    delete stock[a.id];
    // Re-chamber immediately so the *next* trigger pull uses whatever is left rather than
    // reporting empty for one frame and then working again.
    const next = chambered(feedKey);
    status(next ? `${FEEDS[feedKey].name} switched to ${next.name}`
                : `${FEEDS[feedKey].name} empty`);
  }
  return spent > 0;
}

/** Put rounds aboard — manufacturing delivery, a station purchase, a salvage find. */
export function addRounds(id, qty) {
  if (!AMMUNITION[id] || !(qty > 0)) return false;
  const stock = ammoStock();
  stock[id] = (stock[id] || 0) + qty;
  return true;
}

/**
 * Everything the loadout panel needs for one feed: what is chambered, what else could be,
 * and how many of each is aboard.
 */
export function magazineReport(feedKey) {
  const now = chambered(feedKey);
  return {
    feed: feedKey,
    name: FEEDS[feedKey] ? FEEDS[feedKey].name : feedKey,
    chambered: now ? now.id : null,
    chamberedName: now ? now.name : 'empty',
    total: feedRounds(feedKey),
    rounds: feedIds(feedKey).map(id => ({
      id, name: AMMUNITION[id].name, tier: AMMUNITION[id].tier,
      cost: AMMUNITION[id].unit_cost, held: roundsHeld(id)
    }))
  };
}

/** Every feed the current fit actually has, so the panel shows racks and not a catalogue. */
export function fittedFeeds() {
  const seen = [];
  for (const w of ((S.stats && S.stats.mounts) || [])) {
    const f = feedOf(w);
    if (f && !seen.includes(f)) seen.push(f);
  }
  return seen;
}

// ── persistence ──────────────────────────────────────────────────────
// Stock already travelled with the crafting payload. The chambered selection is new, and
// it is dropped rather than repaired if it names a round this build no longer has — the
// auto-chamber above will pick something on the first shot.
export const serializeLoadout = () => Object.assign({}, loadout());
export function restoreLoadout(d) {
  const out = {};
  for (const k in (d || {})) {
    if (FEEDS[k] && AMMUNITION[d[k]] && feedIds(k).includes(d[k])) out[k] = d[k];
  }
  S.loadout = out;
  return true;
}
