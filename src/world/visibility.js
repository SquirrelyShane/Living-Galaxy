// Living Galaxy — who gets to say a thing is invisible.
//
// `Object3D.visible` is a single boolean, and for most of this project's life exactly one
// system wrote it to any given object, so a boolean was enough. That stopped being true
// the moment two systems had opinions about the same hull:
//
//   - `systems/fleet.js` hides a docked ship, because it is inside a station ring.
//   - `world/lod.js` hides anything too small on screen to be worth drawing.
//
// Both are correct, and a boolean cannot hold both. Whichever ran second won, so a miner
// docked at a station the player was flying past would be *un*hidden by the LOD pass the
// instant it came close enough to matter — a ship inside a station, drawn, every frame.
// The failure is not a race or a bug in either system; it is that the shared field has no
// room for two reasons.
//
// So: reasons, not a boolean. Each system hides for its own reason, independently, and the
// object is visible only when nobody is hiding it. Adding a third reason later — a cloak,
// a cutscene, an editor filter — costs one constant and no coordination with the other
// two, which is the whole point.
//
// Reasons are bits rather than a Set because there will never be many of them and the mask
// lives on hot objects; an integer costs nothing to store or test.
//
// ── why `range` is not `lod` ─────────────────────────────────────────
// The fourth reason arrived in 1.02.49 and looks at first like a duplicate of the second.
// It is not, and the difference is the whole reason it needed its own bit.
//
// `lod` asks *is this too small to be worth drawing* — a screen-space question, and the
// honest answer for a station is usually "no". A habitat ring is 96 units across; at 1,900
// units it still subtends five percent of the screen, so LOD keeps it, correctly, by its
// own rule. Nothing was broken: the geometry was self-consistent and the culler was right.
//
// `range` asks a different question — *should this be resolvable from here at all* — and
// that one is about fiction, not pixels. You do not watch a station rotate from two
// thousand kilometres away with the naked eye, however many pixels it happens to cover.
// Acquisition range is a property of the class of object and of the instrument, and it has
// no screen-space form to fold into the LOD thresholds.
//
// Folding them together would also mean one system holding two opinions again, which is
// exactly the failure the file was written to end: raising the LOD cull far enough to hide
// a distant station would take every distant *ship* with it, and ships are the thing you
// most need to see coming.

/** Reasons something might be hidden. Add here, not inline at the call site. */
export const HIDE = {
  dock:  1 << 0,    // parked inside a station ring
  lod:   1 << 1,    // too small on screen to draw
  fx:    1 << 2,    // held by a presentation effect (warp tunnel, cutscene, editor)
  range: 1 << 3     // beyond the distance at which this class of thing is drawn at all
};

/**
 * Set or clear one reason. Returns the resulting visibility.
 *
 * The write to `.visible` is guarded on change: it is not a free assignment in three.js
 * for a group with children, and the LOD pass calls this for every registered object on
 * every rendered frame.
 */
export function hide(obj, reason, on = true) {
  if (!obj) return true;
  const before = obj.__hide | 0;
  const after = on ? (before | reason) : (before & ~reason);
  if (after !== before) obj.__hide = after;
  const vis = after === 0;
  if (obj.visible !== vis) obj.visible = vis;
  return vis;
}

/** Clear one reason. Sugar, because `hide(x, r, false)` reads backwards at call sites. */
export const show = (obj, reason) => hide(obj, reason, false);

/** Is this specific reason set? Not the same question as `!obj.visible`. */
export const hiddenBy = (obj, reason) => !!obj && ((obj.__hide | 0) & reason) !== 0;

/** Every reason currently set, as a mask. Diagnostics. */
export const hideMask = obj => (obj && obj.__hide | 0) || 0;

/**
 * Forget every reason and make the object visible. For teardown and tests — not for
 * "I want this shown", which is `show(obj, myReason)` and leaves other systems' opinions
 * intact.
 */
export function clearHide(obj) {
  if (!obj) return;
  obj.__hide = 0;
  obj.visible = true;
}
