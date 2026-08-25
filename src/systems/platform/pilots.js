// Living Galaxy — the pilot database. Characters that outlive a flight.
//
// ## The problem
//
// There has only ever been one save slot. `systems/platform/save.js` writes one JSON blob to
// one `localStorage` key, and starting a new game overwrites it. So a character was not a
// thing that existed — it was a property of *the* save, and creating a second pilot meant
// destroying the first. Every hour spent on a founder's standing with the nine powers, every
// licence bought, every rung climbed, lived in a slot the next new game would take.
//
// That is fine while a career is an hour long. It stops being fine the moment characters are
// meant to persist — and "keep them alive individually by saving them" is exactly the ask.
//
// ## The shape
//
// A pilot record is a **full flight snapshot plus a header**. The header is what the roster
// screen needs — name, career, level, credits, where they are, when they last flew — and it
// is denormalised on purpose: reading a roster of twenty pilots must not mean parsing twenty
// full saves to find out what to print.
//
// The snapshot inside is the same payload `save.js` writes, unchanged and unmigrated. That
// is deliberate. This file does not know the save schema, does not migrate it, and will not
// grow a second copy of the migration ladder — resuming a pilot hands the payload to
// `importSave()`, which is the one function that does know, and which has migrated every
// save this project has ever written.
//
// ## Which pilot is "the" pilot
//
// The flight slot in `localStorage` stays exactly what it was: the *current* flight,
// autosaved every thirty seconds, which is what a crash or a closed tab comes back to. This
// database is where a pilot is **parked** — on demand, and automatically when you switch to
// another one, so switching cannot lose the flight you switched away from.
//
// Two places that hold a save is a synchronisation problem, so there is one rule: the flight
// slot always wins for the active pilot, and the record is refreshed from it whenever the
// roster is read or a switch happens. The record is a copy, never the master.

import { S } from '../../core/state.js';
import { STORES, get, put, all, drop, count } from '../../core/store.js';
import { snapshot, importSave, saveGame } from './save.js';
import { LINEAGES, CORPORATIONS, CAREERS } from '../../data/origins.js';

const ACTIVE_KEY = 'lg.pilot.active';

const readActive = () => {
  try { return localStorage.getItem(ACTIVE_KEY); } catch (e) { return null; }
};
const writeActive = id => {
  try { if (id) localStorage.setItem(ACTIVE_KEY, id); else localStorage.removeItem(ACTIVE_KEY); }
  catch (e) { /* a browser that refuses is a browser with one pilot */ }
};

/** Which pilot the flight slot currently belongs to, or null for an unclaimed flight. */
export const activePilotId = () => readActive();

/**
 * A stable id for a character.
 *
 * Derived from name, origin and creation time rather than from a counter, so two pilots
 * created on two devices and later merged do not collide — and so an id survives the
 * database being cleared and restored from an export.
 */
export function pilotId(ch, created) {
  const parts = [ch.name, ch.lineage, ch.corp, ch.career, created || Date.now()].join('|');
  let h = 2166136261;
  for (let i = 0; i < parts.length; i++) { h ^= parts.charCodeAt(i); h = Math.imul(h, 16777619); }
  return 'p' + (h >>> 0).toString(36) + (created || Date.now()).toString(36).slice(-4);
}

/** The header the roster screen reads, built from live state. */
export function header(id, created) {
  const ch = S.character || {};
  const L = LINEAGES[ch.lineage], C = CORPORATIONS[ch.corp], K = CAREERS[ch.career];
  return {
    id,
    name: ch.name || 'Unnamed',
    lineage: ch.lineage, lineageName: (L && L.name) || ch.lineage,
    corp: ch.corp, corpName: (C && C.name) || ch.corp,
    career: ch.career, careerName: (K && K.name) || ch.career,
    level: ch.level || 1,
    credits: Math.round(S.credits || 0),
    playtime: Math.round(S.playtime || 0),
    hull: (S.stats && S.stats.name) || null,
    company: (S.company && S.company.name) || null,
    galaxy: { seed: (S.galaxy && S.galaxy.seed) >>> 0, node: (S.galaxy && S.galaxy.node) | 0 },
    created: created || Date.now(),
    lastPlayed: Date.now()
  };
}

/**
 * Park the current flight as a pilot record.
 *
 * Called on demand, before every switch, and whenever the roster is opened — see the note in
 * the header about the flight slot being the master. Returns the record, or null when there
 * is no character to park (a flight that has not been through creation yet).
 */
export async function parkPilot() {
  const ch = S.character;
  if (!ch || !ch.created) return null;
  const existingId = readActive();
  const prev = existingId ? await get(STORES.pilots, existingId) : null;
  const created = (prev && prev.created) || Date.now();
  const id = existingId || pilotId(ch, created);
  // Flush the flight slot first. The snapshot below is taken from live state either way, but
  // a park that leaves the two disagreeing is the thing that turns "I switched pilots" into
  // "I lost twenty minutes".
  saveGame(true);
  const rec = Object.assign(header(id, created), { save: snapshot() });
  await put(STORES.pilots, id, rec);
  writeActive(id);
  return rec;
}

/**
 * Every pilot on file, most recently flown first.
 *
 * The active pilot's header is refreshed from live state on the way out rather than being
 * read off disk, so the roster never shows a stale level or credit balance for the flight
 * that is currently running.
 */
export async function listPilots() {
  const rows = await all(STORES.pilots);
  const activeId = readActive();
  const live = S.character && S.character.created ? activeId : null;
  const out = rows.map(r => {
    if (live && r.id === live) {
      return Object.assign({}, r, header(r.id, r.created), { save: undefined, active: true });
    }
    return Object.assign({}, r, { save: undefined, active: false });
  });
  return out.sort((a, b) => (b.lastPlayed || 0) - (a.lastPlayed || 0));
}

/** How many pilots are on file. */
export const pilotCount = () => count(STORES.pilots);

/**
 * Make a pilot the current flight.
 *
 * Parks whatever is running first — unconditionally, and before anything is read — because
 * the failure this guards against is silent and total: switch away from an unparked pilot and
 * the flight slot is overwritten with somebody else's save.
 *
 * @returns {Promise<boolean>} whether the flight slot now holds that pilot
 */
export async function resumePilot(id) {
  if (!id) return false;
  const rec = await get(STORES.pilots, String(id));
  if (!rec || !rec.save) return false;
  if (readActive() !== String(id)) await parkPilot();
  // Through `importSave`, which owns the migration ladder — see the header. A record written
  // eight schema versions ago comes back exactly as an exported save would.
  const okLoaded = importSave(JSON.stringify(rec.save));
  if (!okLoaded) return false;
  writeActive(String(id));
  rec.lastPlayed = Date.now();
  await put(STORES.pilots, String(id), rec);
  return true;
}

/**
 * Retire a pilot.
 *
 * Retiring the *active* one clears the pointer but deliberately leaves the flight slot
 * alone: the flight is still running, and taking the ship out from under a player who
 * tapped a button on a roster screen is not what that button says it does. They become an
 * unclaimed flight, which is what a pilot was before this file existed.
 */
export async function retirePilot(id) {
  if (!id) return false;
  await drop(STORES.pilots, String(id));
  if (readActive() === String(id)) writeActive(null);
  return true;
}

/**
 * Start a fresh pilot: forget the active pointer so the next `parkPilot()` files a new
 * record rather than overwriting the one that is open.
 *
 * Does not touch the flight slot — the caller is about to overwrite it by starting a new
 * game, and a function that wipes a save as a side effect of "unclaim" is a trap.
 */
export function beginNewPilot() { writeActive(null); }

/** One line per pilot for the roster. */
export function pilotLine(p) {
  const bits = [`${p.careerName || p.career}`, `level ${p.level}`];
  if (p.company) bits.push(p.company);
  bits.push(`${Math.round((p.playtime || 0) / 60)} min flown`);
  return bits.join(' · ');
}
