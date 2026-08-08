// Living Galaxy — interlocks.
//
// One place that answers "can the ship do this right now, and if not, why not".
//
// This exists because the guns did not need a gun. `recalcStats()` resolved a weapon
// definition from the hull class whenever the hardpoints were empty, and `updateWeapons`
// happily fell back to it — so a fresh pilot with nothing bolted on could hold FIRE and
// put rounds downrange out of a mount that was not there. That is not a weapons bug, it
// is a missing interlock, and the fix is not a guard clause in one file: it is a rule
// that every critical action asks the same question through the same door.
//
// Three properties the rest of the game depends on:
//
//   **Pure verdicts.** Every check returns { ok, code, reason } and changes nothing.
//     Callers decide whether to act, warn, or draw it grey. A check that fired a toast
//     could not be called from the HUD sixty times a second.
//   **Codes, not sentences.** `code` is stable and machine-readable — the HUD, ARIA,
//     the tutorial and the tests all key off it. `reason` is the sentence a pilot reads.
//   **Ordered by severity.** The first failure returned is the one worth telling them
//     about. "No weapon fitted" beats "insufficient energy" every time, because fixing
//     the energy would not help.
//
// `announce()` is the only impure thing here, and it is rate-limited per code so a held
// FIRE button says one thing once rather than screaming sixty times a second.

import { S } from '../core/state.js';
import { MINING, INTERLOCK, HEAT } from '../core/config.js';
import { feedOf, feedLoaded } from './magazine.js';
import { firingSlots, activeLabel } from './groups.js';
import { WEAPON_MODULES } from '../data/weapons.js';
import { status } from '../ui/toast.js';
import { sfx } from './audio.js';

const OK = Object.freeze({ ok: true, code: 'ok', reason: '' });
const no = (code, reason) => ({ ok: false, code, reason });

/** Conditions that stop everything, in the order a pilot would notice them. */
function hullState() {
  if (S.sim && S.sim.disabled) return no('disabled', 'Ship disabled — systems rebooting');
  if (S.docked) return no('docked', 'Docked — undock first');
  if (S.warp && S.warp.state === 'warping') return no('warp', 'Not while the bubble is up');
  return null;
}

// ── weapons ──────────────────────────────────────────────────────────

/**
 * Is there anything at all this ship could shoot with?
 *
 * Deliberately separate from `canFire()`: the fit screen and the HUD want to know that a
 * hardpoint is empty even while docked, when every other interlock is also failing.
 */
export function armed() {
  const m = (S.stats && S.stats.mounts) || [];
  return m.filter(w => w && w.kind !== 'utility').length > 0;
}

/** Mounts that are guns or launchers — utility buoys are not weapons. */
export const gunMounts = () => ((S.stats && S.stats.mounts) || []).filter(w => w && w.kind !== 'utility');

/**
 * The guns actually under the trigger right now. Every firing check reads this rather than
 * the whole rack: a pilot with group I selected and group I empty should be told their
 * magazines are dry, not reassured because group II still has rounds in it.
 */
export const activeGuns = () => {
  const bay = (S.fit && S.fit.weapon) || [];
  return firingSlots(S.fit)
    .map(i => WEAPON_MODULES[bay[i]])
    .filter(w => w && w.kind !== 'utility');
};

export function canFire() {
  const blocked = hullState();
  if (blocked) return blocked;

  const mounts = (S.stats && S.stats.mounts) || [];
  if (!mounts.length) return no('nofit', 'No weapon fitted — open FIT and mount one');

  if (!gunMounts().length) return no('nogun', 'Utility mounts only — no weapon fitted');

  const guns = activeGuns();
  if (!guns.length) return no('nogroup', `Group ${activeLabel()} has no guns in it`);

  // A launcher without a lock is a real state, not an error: the pilot has a weapon,
  // it simply has nothing to chase. Only complain when *every* mount needs one.
  const t = S.target;
  const haveLock = !!(t && t.kind === 'ship');
  if (!haveLock && guns.every(w => w.kind === 'missile')) {
    return no('nolock', 'Missile needs a ship lock');
  }

  // The thermal cutout is a whole-ship stop: nothing fires while the emitters are past
  // their limit, regardless of which mount you were leaning on. It clears on its own at
  // HEAT.resume, which is why this reads a latched flag rather than re-testing the
  // threshold — testing here and latching in weapons.js would be two rules for one state.
  if (S.player.overheat) return no('overheat', 'Weapons offline — thermal cutout');

  const cheapest = Math.min(...guns.map(w => w.energy || 0));
  if (S.player.energy < cheapest) return no('energy', 'Insufficient energy for weapons');

  // Every gun aboard is a dry rack: say the supply problem out loud rather than letting
  // the per-mount check report it once per barrel.
  if (guns.every(w => { const f = feedOf(w); return f && !feedLoaded(f); })) {
    return no('noammo', 'Magazines empty — no compatible rounds aboard');
  }

  return OK;
}

/**
 * Per-mount clearance, evaluated at the trigger. The cooldown clock stays in weapons.js
 * (it is per-barrel state, not a rule), everything else that could silently drop a shot
 * lives here so the reason is nameable.
 */
export function canFireMount(w) {
  if (!w) return no('empty', 'Empty hardpoint');
  if (S.player.energy < (w.energy || 0)) return no('energy', 'Insufficient energy for weapons');
  if (w.kind === 'missile') {
    const t = S.target;
    if (!t || t.kind !== 'ship') return no('nolock', 'Missile needs a ship lock');
  }
  // A mount that eats rounds and has none is not a fault, it is a supply problem — and it
  // is per-mount, because a fit can run its lasers dry-magazine all day while the
  // autocannon sits silent. Energy weapons have no feed and never reach this line.
  const feed = feedOf(w);
  if (feed && !feedLoaded(feed)) return no('noammo', 'Magazine empty — no compatible rounds aboard');
  return OK;
}

// ── mining ───────────────────────────────────────────────────────────

export function canMine() {
  const blocked = hullState();
  if (blocked) return blocked;
  if (S.warp && S.warp.state !== 'idle') return no('warp', 'Cut the warp core before mining');

  // The cutter is hull-mounted rather than a module, so the capability check is on the
  // hull's extraction rating. A refit that zeroes it (or a future hull with no head at
  // all) now turns the beam off honestly instead of quietly mining nothing.
  if (!(S.stats && S.stats.miningMult > 0)) return no('nocutter', 'This hull carries no cutter head');

  // A cutter head is a structural mount. Below the safety floor the arm will not run —
  // this is the one interlock that makes a beaten-up hull stop working before it dies.
  const frac = S.stats.hullMax > 0 ? S.player.hull / S.stats.hullMax : 1;
  if (frac < INTERLOCK.cutterHullFloor) {
    return no('hull', 'Cutter locked out — hull integrity below safety floor');
  }

  if (S.player.energy < MINING.energy * INTERLOCK.cutterEnergyMargin) {
    return no('energy', 'Energy too low for the mining beam');
  }
  return OK;
}

// ── warp ─────────────────────────────────────────────────────────────

export function canWarp() {
  if (S.sim && S.sim.disabled) return no('disabled', 'Warp core offline — ship disabled');
  if (S.docked) return no('docked', 'Undock before engaging warp');
  if (S.player.energy < INTERLOCK.warpEnergy) {
    return no('energy', `Warp core needs at least ${INTERLOCK.warpEnergy} energy`);
  }
  return OK;
}

// ── sensors ──────────────────────────────────────────────────────────

export function canScan(obj) {
  if (!obj) return no('notarget', 'Nothing selected to scan');
  if (S.sim && S.sim.disabled) return no('disabled', 'Sensors offline — ship disabled');
  if (S.scan && S.scan.active) return no('busy', 'Dish already sweeping');
  if (!(S.stats && S.stats.sensor > 0)) return no('nosensor', 'No sensor package online');
  return OK;
}

export function canProbe() {
  if (S.sim && S.sim.disabled) return no('disabled', 'Probe bay offline — ship disabled');
  if (!(S.probes > 0)) return no('noprobes', 'No probes in the bay');
  return OK;
}

// ── docking ──────────────────────────────────────────────────────────

export function canDock() {
  if (S.sim && S.sim.disabled) return no('disabled', 'Docking computer offline — ship disabled');
  if (S.docked) return no('docked', 'Already docked');
  if (S.warp && S.warp.state !== 'idle') return no('warp', 'Drop out of warp before docking');
  return OK;
}

// ── announcing ───────────────────────────────────────────────────────
// Rate-limited per code. A held trigger with an empty hardpoint should tell the pilot
// once, then shut up until something changes.

const said = new Map();

/**
 * Say a verdict out loud, at most once per `INTERLOCK.repeat` seconds per code.
 * @returns {boolean} true if it actually spoke — handy for tests.
 */
export function announce(v, { sound = true } = {}) {
  if (!v || v.ok) return false;
  const last = said.get(v.code);
  if (last != null && S.time - last < INTERLOCK.repeat) return false;
  said.set(v.code, S.time);
  status(v.reason);
  if (sound) sfx.deny();
  return true;
}

/** Forget what has been said — used on respawn, load and by the tests. */
export function resetAnnounce() { said.clear(); }

// ── reporting ────────────────────────────────────────────────────────

/**
 * Every interlock at once. The HUD greys buttons off this, ARIA answers "why can't I
 * shoot" off this, and the tutorial waits on it.
 */
export function interlockReport() {
  return {
    fire: canFire(),
    mine: canMine(),
    warp: canWarp(),
    dock: canDock(),
    probe: canProbe(),
    armed: armed(),
    mounts: ((S.stats && S.stats.mounts) || []).map(w => (w ? w.name : null))
  };
}

/** One short line naming whatever is currently offline. '' when the ship is nominal. */
export function interlockLine() {
  const r = interlockReport();
  const out = [];
  if (!r.fire.ok) out.push('WPN ' + r.fire.code);
  if (!r.mine.ok && r.mine.code !== 'warp') out.push('CUT ' + r.mine.code);
  if (!r.warp.ok) out.push('WRP ' + r.warp.code);
  return out.join(' · ');
}
