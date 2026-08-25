// Living Galaxy — who can see whom.
//
// Ambushes used to trigger on a fixed fraction of the lurker's sensor radius. Cross the
// line and it woke up; stay outside and it never would, no matter what you were doing.
// Nothing a pilot could choose made any difference — you could barrel through the belt at
// full burn with your guns lit and be exactly as detectable as a cold hull coasting.
//
// Detection is a contest now: their sensor against your signature. Signature is something
// you control — cut the throttle, hold your fire, stay out of warp, fly a small hull, run
// an empty hold — so sneaking past a picket is a thing you can actually do, and the belt
// stops being a coin flip.

import { S, totalMass } from '../core/state.js';
import { DETECT } from '../core/config.js';
import { signatureScale } from './character.js';

/**
 * The player's current signature multiplier. 1.0 is a reference hull cruising.
 * Below 1 is quieter than reference; above 1 is louder.
 */
export function playerSignature() {
  const p = S.player, st = S.stats;
  if (!st) return DETECT.baseSignature;

  // Mass: a laden hauler is a bigger return than an empty scout. Square-rooted, because
  // radar cross-section does not scale linearly with tonnage and a 20x cargo difference
  // should not make a 20x difference to being seen.
  const massRatio = Math.sqrt(Math.max(0.1, totalMass() / DETECT.massRef));
  let sig = DETECT.baseSignature * (1 + (massRatio - 1) * DETECT.massWeight);

  // Drives: thrust is the loud part, and it is the part you can stop doing.
  sig *= 1 + Math.abs(p.throttle) * DETECT.throttleWeight;

  // Firing and warping are both unmissable.
  if (S.time - p.lastShot < 1.5) sig *= DETECT.firingBoost;
  if (S.warp.state === 'warping' || S.warp.state === 'spooling') sig *= DETECT.warpBoost;

  // Lineage, corporation and Sensors rank all fold in here: a Nexis defector flying for
  // Severance with sensor training is genuinely, measurably harder to find than a
  // Core-born broker doing the same thing in the same hull.
  sig *= signatureScale();

  return Math.max(DETECT.silentFloor, sig);
}

/** Same idea for an NPC, from what little it has: size and whether it is under way. */
export function npcSignature(u) {
  const size = (u.size || 9) / 9;
  let sig = DETECT.baseSignature * (1 + (Math.sqrt(size) - 1) * DETECT.massWeight);
  if (u.target) sig *= 1.15;
  if (S.time - (u.lastShot ?? -99) < 1.5) sig *= DETECT.firingBoost;
  return Math.max(DETECT.silentFloor, sig);
}

/**
 * How far away `sensor` can resolve a contact of `signature`.
 * Linear in signature: halving your signature halves the range at which you are seen,
 * which is a rule a pilot can hold in their head while flying.
 */
export const detectionRange = (sensor, signature) => sensor * signature;

/** Can a watcher with this sensor see the player right now, at this distance? */
export function playerDetected(sensor, distance, sig) {
  return distance <= detectionRange(sensor, sig !== undefined ? sig : playerSignature());
}

/**
 * The range at which a lurking ambusher commits. Deliberately shorter than plain
 * detection: seeing something and breaking cover for it are different decisions, and an
 * ambusher that springs the moment it can see you is not an ambusher.
 */
export function ambushRange(sensor, sig) {
  return detectionRange(sensor, sig !== undefined ? sig : playerSignature()) * DETECT.ambushFactor;
}

/** For the HUD: how loud you are, in words. */
export function signatureLabel(sig = playerSignature()) {
  if (sig <= 0.5) return 'silent running';
  if (sig <= 0.85) return 'quiet';
  if (sig <= 1.3) return 'nominal';
  if (sig <= 2.2) return 'loud';
  return 'lit up';
}
