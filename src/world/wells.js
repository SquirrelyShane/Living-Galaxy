// Living Galaxy — gravity wells, made visible.
//
// The wells have been real since v1.02.34. `systems/navplan.js` runs a visibility-graph A\*
// around them, `systems/warp.js` refuses to hold a course inside one, `systems/fleet-work.js`
// brakes company hulls that enter one, and getting the star's own well right was worth an
// eleven-fold improvement in fleet throughput. Seven patches of load-bearing simulation.
//
// **Nothing has ever drawn them.**
//
// So a player watching a freighter swing wide around a gas giant sees a ship taking a strange
// route for no reason, and the reasonable conclusion is that the pathing is broken. The single
// most consequential piece of physics in the flight model has been invisible for its entire
// life, and every complaint about ships "not flying straight" is a complaint about a thing the
// game declined to show.
//
// ## What is drawn, and what is not
//
// The shell sits at `wellRadius(u)` — the exact number the planner reads, not an approximation
// of it, imported from the module that owns the formula. If the two ever disagree the picture
// is a lie, and a lie about where the obstacles are is worse than no picture.
//
// The shell is a **boundary, not a volume**. Filling the sphere would hide the planet inside
// it and read as fog; a thin surface reads as an edge you cross, which is what a well
// behaves like — the flight model changes state at the boundary and does nothing gradual
// inside it.
//
// Brightness carries **strength**, because that is the fact a pilot needs: a well you can
// cross under power and a well that will hold you are different problems.

import { S } from '../core/state.js';
import { WELLS } from '../core/config.js';
import { wellRadius } from '../systems/flight/warp.js';
import { setField, clearField, showField, sphereShell } from './pointfield.js';

const KIND = { star: 1, planet: 1, moon: 1 };
const key = name => 'well:' + name;

let built = [];

/** Wipe every shell — a new world, a load, a system change. */
function clearWells() {
  for (const k of built) clearField(k);
  built = [];
}

/**
 * Build a shell for every body that has a well, from the same numbers the planner uses.
 *
 * Called once when the system is built rather than per frame: a well's radius is a function of
 * the body's gravity and radius, and neither of those changes while you are flying.
 */
export function buildWells() {
  clearWells();
  if (!WELLS.show) return 0;

  for (const b of (S.world.bodies || [])) {
    const u = b.userData;
    if (!u || !KIND[u.kind]) continue;
    if (!(u.gravity > 0)) continue;

    const r = wellRadius(u);
    // A well the ship is bigger than is not worth a shell — it would render as a smudge on the
    // hull and add nothing. `arriveRadius` is the same floor warp uses to decide a body is not
    // worth dropping out for, so the two agree about what counts as negligible.
    if (r < WELLS.minRadius) continue;

    // Count scales with the *surface area* the shell has to suggest, not with the radius, or a
    // star's shell is as sparse as a moon's and reads as a scatter instead of a boundary.
    const area = (r / WELLS.refRadius) ** 2;
    const n = Math.round(Math.max(WELLS.minPoints,
                                  Math.min(WELLS.maxPoints, WELLS.basePoints * Math.sqrt(area))));

    // Strength: how much of the well's pull is worth respecting, normalised against the
    // biggest well in the system so one body being enormous does not flatten everything else.
    const strength = Math.min(1, r / WELLS.strongRadius);
    const col = [
      WELLS.cool[0] + (WELLS.hot[0] - WELLS.cool[0]) * strength,
      WELLS.cool[1] + (WELLS.hot[1] - WELLS.cool[1]) * strength,
      WELLS.cool[2] + (WELLS.hot[2] - WELLS.cool[2]) * strength
    ];

    const k = key(u.name);
    setField(k, sphereShell(b.position.x, b.position.y, b.position.z, r, n),
             { color: col, size: WELLS.pointSize, alpha: WELLS.alpha * (0.6 + strength * 0.4) });
    built.push(k);
    // The shell is placed in world space at build time, so it has to be rebuilt when the body
    // moves. Bodies orbit — see `refreshWells`.
    b.userData.__wellR = r;
    b.userData.__wellN = n;
    b.userData.__wellCol = col;
  }
  return built.length;
}

/**
 * Follow the orbits.
 *
 * Bodies move, and a shell placed once would be left behind within a minute of play. Rebuilt on
 * a slow cadence rather than per frame — a planet crosses a small fraction of its own well in a
 * second, so the shell being a few frames stale is invisible, and repacking eight hundred points
 * every frame to chase a body that has moved four metres is exactly the kind of work this layer
 * exists to avoid.
 */
let t = 0;
export function refreshWells(dt) {
  if (!WELLS.show || !built.length) return;
  t += dt;
  if (t < WELLS.refresh) return;
  t = 0;
  for (const b of (S.world.bodies || [])) {
    const u = b.userData;
    if (!u || !u.__wellR) continue;
    setField(key(u.name),
             sphereShell(b.position.x, b.position.y, b.position.z, u.__wellR, u.__wellN),
             { color: u.__wellCol, size: WELLS.pointSize,
               alpha: WELLS.alpha * (0.6 + Math.min(1, u.__wellR / WELLS.strongRadius) * 0.4) });
  }
}

/** The chart and the settings screen both want to switch these off. */
export function setWellsVisible(on) {
  for (const k of built) showField(k, on);
}

export const wellCount = () => built.length;
