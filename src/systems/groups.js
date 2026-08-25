// Living Galaxy — weapon groups.
//
// v1.00.60 made the *type* of round a decision and then gave a pilot no way to act on it
// mid-fight: every mount fired together, so a rack of kinetic and a rack of EM went out at
// the same target on the same trigger and the choice collapsed back into "carry whatever is
// best on average". Groups are what make it a decision you take while the shooting is
// happening — kinetic at the plated raider, EM at the shield boat.
//
// ── the group is a property of the slot, not of the gun ──────────────
// Assignment is keyed on the hardpoint index in `S.fit.weapon`, not on the weapon key and
// not on the position in `S.stats.mounts`. `mountedWeapons()` drops empty slots, so mount 2
// and hardpoint 2 are different things the moment a pilot leaves a slot open — keying on
// the mount index would silently reassign a pilot's groups every time they unfitted
// something.
//
// ── falloff is measured inside the volley that fires ─────────────────
// `MULTI_GUN_FALLOFF` docks each barrel past the first. When only one group fires, the
// index that matters is the index within *that* group: firing two of four guns should not
// pay the fourth barrel's penalty on a gun that is now the second one shooting.
//
// That is what makes splitting a rack a real trade rather than a strict loss. Fire
// everything and you get maximum alpha at the worst average yield; alternate two groups and
// each volley is smaller but every barrel is near the front of its own queue. Neither is
// the right answer to every fight, which is the whole point.

import { S } from '../core/state.js';

/** The groups that exist. Two is the number a thumb can drive on a phone. */
export const GROUP_KEYS = [1, 2];

/** 1, 2, or 'all' — which group the trigger currently fires. */
export const ALL = 'all';

export function groupState() {
  if (!S.groups || typeof S.groups !== 'object') S.groups = { slots: {}, active: ALL };
  if (!S.groups.slots) S.groups.slots = {};
  if (!S.groups.active) S.groups.active = ALL;
  return S.groups;
}

/** Which group a hardpoint belongs to. Unassigned hardpoints are group 1. */
export function groupOf(slot) {
  const g = groupState().slots[slot];
  return GROUP_KEYS.includes(g) ? g : 1;
}

export function setGroup(slot, group) {
  if (!GROUP_KEYS.includes(group)) return false;
  groupState().slots[slot] = group;
  return true;
}

/** Move a hardpoint to the next group. What the panel's tap does. */
export function cycleGroup(slot) {
  const next = groupOf(slot) === 1 ? 2 : 1;
  setGroup(slot, next);
  return next;
}

export const activeGroup = () => groupState().active;

export function setActive(g) {
  if (g !== ALL && !GROUP_KEYS.includes(g)) return false;
  groupState().active = g;
  return true;
}

/** I → II → ALL → I. The order a thumb expects from a three-state chip. */
export function cycleActive() {
  const now = activeGroup();
  const next = now === 1 ? 2 : now === 2 ? ALL : 1;
  setActive(next);
  return next;
}

/** Does this hardpoint fire on the current trigger? */
export const slotFires = slot => activeGroup() === ALL || groupOf(slot) === activeGroup();

/**
 * Which groups the current fit actually has guns in.
 *
 * The group chip is hidden until this returns more than one, because a control that does
 * nothing is worse than no control: it invites a tap, changes a label, and produces no
 * difference a pilot can see.
 */
export function populatedGroups(fit = S.fit) {
  const weapons = (fit && fit.weapon) || [];
  const out = [];
  weapons.forEach((key, i) => {
    if (!key) return;
    const g = groupOf(i);
    if (!out.includes(g)) out.push(g);
  });
  return out.sort();
}

export const hasSplit = fit => populatedGroups(fit).length > 1;

/** Short label for the fire control and the chip. */
export function activeLabel() {
  const a = activeGroup();
  return a === ALL ? 'ALL' : a === 2 ? 'II' : 'I';
}

/**
 * Hardpoint indices that fire this trigger, in slot order.
 *
 * Returned as slot indices rather than mounts so the caller can look up both the weapon and
 * its group, and so the falloff index is the position within this volley.
 */
export function firingSlots(fit = S.fit) {
  const weapons = (fit && fit.weapon) || [];
  const out = [];
  weapons.forEach((key, i) => { if (key && slotFires(i)) out.push(i); });
  return out;
}

// ── persistence ──────────────────────────────────────────────────────
// Assignments for hardpoints that no longer exist are dropped rather than kept: a pilot who
// switches from a four-mount military hull to a two-mount civilian one and back should not
// find their old group four still lurking.
export const serializeGroups = () => ({
  slots: Object.assign({}, groupState().slots),
  active: activeGroup()
});

export function restoreGroups(d, slotCount = Infinity) {
  const slots = {};
  for (const k in ((d && d.slots) || {})) {
    const i = Number(k);
    if (!Number.isInteger(i) || i < 0 || i >= slotCount) continue;
    if (GROUP_KEYS.includes(d.slots[k])) slots[i] = d.slots[k];
  }
  const active = d && (d.active === ALL || GROUP_KEYS.includes(d.active)) ? d.active : ALL;
  S.groups = { slots, active };
  return true;
}
