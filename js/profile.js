/* LIVING GALAXY — the run profile: what belongs to a pilot, and what outlives them.
 *
 * Everything the game keeps between sessions lived in one flat pile of
 * localStorage keys, and nothing ever swept it. So a corporation founded by a
 * pilot you retired was still on the books when you made a new one, the old
 * callsign was still on the save, the old hands were still filed as "aboard",
 * and a page refresh — or a server restart, for the shared half — brought all
 * of it straight back. You cannot start over in a game that will not let you.
 *
 * The fix is to say out loud which of those three things each key is:
 *
 *   DEVICE_KEYS   belong to the machine. Audio mix, rock quality, whether the
 *                 attract loop has been seen. A new pilot does not re-tune the
 *                 speakers, and wiping these would be rude.
 *
 *   RUN_KEYS      belong to ONE pilot's run. Their corporation, their fleet,
 *                 their callsign and sky progress, their refits, robots,
 *                 missions, drones, console history, tutorial state. These are
 *                 the ones that leaked. A new pilot clears every one of them.
 *
 *   LEARNED_KEYS  belong to the human at the controls rather than the character
 *                 on the hull — the preference net ARIA flies by, and the house
 *                 brain an NPC captain carries. Deliberately kept: you are the
 *                 same pilot whatever you call yourself this time, and throwing
 *                 away a session of learned flying to rename a character would
 *                 be a worse bug than the one this file fixes.
 *
 * The CRADLE (lgaa.cradle.v1) is in none of them on purpose. It is the sky's
 * population, not the pilot's — the hand you dismissed at Foundry Hold should
 * still be at Kessler Reach two pilots later. What a new run clears there is
 * only the EMPLOYMENT: anybody filed as aboard or captained by the pilot who
 * just walked goes back in the pool, so the hiring halls fill again. That is
 * `releaseEmployed()` in js/npc/cradle.js, and the server does the same on its
 * side, because an "aboard" flag is a fact about one client's run and has no
 * business being written to a shared ledger at all.
 *
 * This module is a LEAF. It touches storage and nothing else, so it can be
 * imported from anywhere without dragging the sim in behind it.
 *
 * 0.3.40: the same three lists say what an ACCOUNT carries. js/account.js
 * syncs RUN_KEYS + RUN_PREFIXES + LEARNED_KEYS + the profile record to the
 * website and leaves DEVICE_KEYS and the cradle where they are.
 */

/* 0.3.54: the galaxy's population — the CRADLE's full records and the Galactic
 * Database's catalogue. Not the pilot's (no account sync, no clearing on a new
 * run) and not the device's settings: they are who lives in the sky. */
export const SKY_KEYS = [
  "lgaa.cradle.v1",       // js/npc/cradle.js — full records of people
  "lgaa.gdb.v1",          // js/gdb.js — the catalogue of everyone, one name to one person
];

export const DEVICE_KEYS = [
  "lgaa.audio.mix",       // js/audio/graph.js — the mixer
  "lgaa.rocks",           // js/engine.js — asteroid quality tier
  "lgaa.dockcine",        // js/ui/dockboot.js — the berth boot sequence on/off
  "lgaa.fullscreen",      // js/ui/fullscreen.js — the canopy edge-to-edge, restored on the next tap
  "lgaa.lens",            // js/holefx.js — the black-hole lens: on / off / by frame budget
  "lgaa.attract",         // js/engine.js — attract loop seen
  "lgaa-adult-pack",      // addon/adult/ — the opt-in gate for the mature pack
  "lgaa.npcchat.v1",      // js/npc/chat.js — the rating the NPC band is allowed to speak at
  "lgaa.account.v1",      // js/account.js — which account version THIS DEVICE last synced to
  "lgaa.news.seen.v1",    // js/account.js — site bulletins already put on the GNN desk here
];

export const LEARNED_KEYS = [
  "lgaa.aria.v1",         // js/aria.js — the preference net, learned from how you fly
  "lgaa.housebrain.v1",   // js/npc/captain.js — the NPC captain's neural core
  "lgaa.tape.v1",         // js/recorder.js — the (state, action, outcome) tape the pilot leaves behind
];

export const RUN_KEYS = [
  "lgaa-company",         // js/company.js — the corporation, its name, book and board
  "lgaa-fleet",           // js/fleet.js — owned hulls
  "lgaa-social",          // js/family.js — the household: partners, children, standing
  "lgaa-save-v1",         // js/store.js — callsign, per-sky scanned/beacons/terraform
  "lgaa-save-v0",         // js/store.js — the legacy save it upgrades from
  "lgaa.con.recents.v1",  // js/console/console.js — command history
  "lgaa.tutorial.v1",     // js/tutorial.js — which lessons are done
  "lgaa.tutorial.core.v1", // js/tutorial.js — the MISSION CORE walkthrough, shown once
  "lgaa.pilot.v1",        // js/pilot.js — the pilot record: race, career, rank, skills, hulls, cover (0.3.42)
];

/* The other half, and the half that made this bug so hard to see.
 *
 * Five subsystems do not write a fixed key — they write one keyed by the sky
 * and the CALLSIGN:
 *
 *     lgaa.upgrades.v1:<skySeed>:<callsign>
 *
 * which means removeItem("lgaa.upgrades.v1") removes nothing at all, and a
 * sweep written against the bare names would have looked like it worked while
 * clearing none of them. It also means the keys never stop accumulating — one
 * set per name you have ever flown under — and that flying under an OLD name
 * hands you that pilot's refits, robots, missions and part-flown contracts
 * back — which is how a retired pilot's kit follows you into a new run.
 *
 * So these are cleared by PREFIX, over the whole of localStorage. The trailing
 * colon is deliberate: it matches `lgaa.missions.v1:Vex` and never some
 * future `lgaa.missions.v1b`.
 */
export const RUN_PREFIXES = [
  "lgaa.upgrades.v1:",    // js/upgrades.js — refits fitted
  "lgaa.robots.v1:",      // js/crew/robots.js — the robot roster
  "lgaa.missions.v1:",    // js/mission/script.js — mission board state
  "lgaa.mission.run.v1:", // js/mission/run.js — a mission part-flown
  "lgaa.drones.v1:",      // js/drones/ops.js — drone standing orders
  "lgaa.fab.v1:",         // js/fabricate.js — jobs on the ports' fabrication lines
];

export const PROFILE_KEY = "lgaa.profile.v1";

const store = () => {
  try { return globalThis.localStorage ?? null; } catch { return null; }
};

function read() {
  try {
    const raw = store()?.getItem(PROFILE_KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* corrupt or absent */ }
  return null;
}

function write(p) {
  try { store()?.setItem(PROFILE_KEY, JSON.stringify(p)); } catch { /* quota, or no window */ }
}

/** A short, sortable, collision-proof id. Not a seed — nothing is rolled off it. */
function mintId() {
  const t = Date.now().toString(36);
  const r = Math.floor(Math.random() * 0x1000000).toString(36).padStart(5, "0");
  return `${t}-${r}`;
}

/** The run in progress, or null before a pilot has ever been made on this device. */
export function profile() {
  return read();
}

/** The current run's id, or "" if there is not one yet. */
export function runId() {
  return read()?.id ?? "";
}

/** The callsign the current run was created under. */
export function runCallsign() {
  return read()?.callsign ?? "";
}

/**
 * Wipe every key that belongs to one pilot's run. Device settings and the
 * learned nets are left alone; so is the CRADLE, which is the sky's, not
 * the pilot's. Returns the keys that were actually holding something, which
 * is what makes this testable rather than hopeful.
 */
export function clearRun() {
  const ls = store();
  if (!ls) return [];
  const had = [];
  for (const k of RUN_KEYS) {
    try {
      if (ls.getItem(k) != null) had.push(k);
      ls.removeItem(k);
    } catch { /* ignore one bad key rather than abandon the sweep */ }
  }
  /* the callsign-suffixed families: enumerate rather than guess the suffix.
   * Collect first, delete after — removing while iterating an index-based
   * Storage renumbers it underneath you and skips every other key. */
  const doomed = [];
  try {
    for (let i = 0; i < (ls.length ?? 0); i++) {
      const k = ls.key(i);
      if (k && RUN_PREFIXES.some((p) => k.startsWith(p))) doomed.push(k);
    }
  } catch { /* a Storage without length/key: the fixed keys above are still swept */ }
  for (const k of doomed) {
    try { ls.removeItem(k); had.push(k); } catch { /* ignore */ }
  }
  return had;
}

/**
 * Begin a new pilot's run: clear the last one off the device and file who this
 * one is. Call it BEFORE the new pilot is built, so nothing written during
 * creation is swept away behind it.
 *
 * @returns { id, callsign, createdAt, cleared } — `cleared` is the keys that
 *          actually had a previous run in them.
 */
export function startRun(callsign) {
  const previous = read();
  const cleared = clearRun();
  const p = {
    id: mintId(),
    callsign: String(callsign ?? "").trim() || "Pilot",
    createdAt: Date.now(),
    previous: previous?.id ?? null,
    previousCallsign: previous?.callsign ?? null,
  };
  write(p);
  return { ...p, cleared };
}

/** Rename the run in place — the pilot is the same person, the name changed. */
export function renameRun(callsign) {
  const p = read();
  if (!p) return startRun(callsign);
  p.callsign = String(callsign ?? "").trim() || p.callsign;
  write(p);
  return p;
}

/** Console/testing: forget the run entirely, profile record and all. */
export function forgetRun() {
  const cleared = clearRun();
  try { store()?.removeItem(PROFILE_KEY); } catch { /* ignore */ }
  return cleared;
}
