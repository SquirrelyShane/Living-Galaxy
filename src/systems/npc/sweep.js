// Living Galaxy — ARIA's sweep. What is out there, sorted into things she can act on.
//
// ## Why this is not just the contact list
//
// `systems/flight/contacts.js` answers "what can the array resolve" and it answers it well
// — one walk, one range rule per class, shared by the chart, the list and the canopy
// brackets. What it deliberately does not do is have an *opinion*. A contact list is a
// register; every row is the same kind of thing, sorted by distance.
//
// A decision needs the opposite. "Three hostiles at 1.4 Mm" is not actionable; "one raider
// inside its own optimal and closing at 60 m/s, two more out of reach and not committed" is.
// So this file takes the register and produces a **picture**: contacts classified by what
// they mean, threats scored by how much of a problem they are *right now*, and the handful
// of aggregates a decision actually turns on.
//
// ## Closing rate is the reason this file holds state
//
// Everything else here is a pure function of the current frame. Closing rate is not — it is
// a derivative, and a derivative needs the previous sample. That is one `Map` keyed by
// object, swept of anything that has stopped being a contact, and it is the single most
// useful number in the file: a raider at 2 km opening is a raider you can ignore, and the
// same raider at 2 km closing at 80 m/s is ninety seconds from your hull.
//
// ## Threat weight
//
// Deliberately not "damage per second". A hostile's danger to you is how much it can hurt
// you, multiplied by how much of that it can currently bring to bear — a torpedo boat at
// four kilometres is carrying a lot of damage it cannot deliver. `inOptimal` is the
// difference between a contact and a problem, and it is what `reasoner.js` keys on.

import { S } from '../../core/state.js';
import { contacts, resetContacts } from '../flight/contacts.js';
import { ownerOfHull, operatorName, OWN } from '../company/ownership.js';
import { playerSignature, detectionRange } from '../combat/detection.js';
import { graveyards, gravePosition, GRAVEYARD } from '../../world/landmarks.js';
import { isExhausted, remaining } from '../industry/salvage.js';
import { SWEEP } from '../../core/config.js';

/** What a contact *is*, from ARIA's side. One word each, because decisions are keyed on it. */
export const CLASS = {
  HOSTILE: 'hostile',     // will shoot at you
  THREATENED: 'threatened', // yours, and something is shooting at it
  FRIENDLY: 'friendly',   // patrol, ally, another pilot
  MINE: 'mine',           // your hull or your company's
  NEUTRAL: 'neutral',     // ambient traffic, somebody else's business
  BERTH: 'berth',         // a station you can dock at
  BODY: 'body',           // planet, moon, star
  FIELD: 'field',         // a mining field or a ring
  WRECK: 'wreck',         // a debris field worth searching
  SITE: 'site'            // a Lagrange point or anomaly
};

const prev = new Map();     // object → { x, y, z, t } for the closing-rate derivative
let cache = null, cacheT = -1;

/**
 * Drop everything. After a jump, a load, or anything that replaces the world.
 *
 * Including the contact walk underneath, which is the part that was missing. `contacts()`
 * keeps its own tenth-of-a-second cache, so a sweep rebuilt immediately after the world
 * changed was rebuilt from the *old* contact list — and every reset in the game happens at
 * a moment when game time is not advancing, which is exactly when that cache is warm. A
 * reset that leaves the layer beneath it stale is not a reset; it is a reset-shaped delay.
 */
export function resetSweep() {
  prev.clear();
  cache = null;
  cacheT = -1;
  resetContacts();
}

const CLASS_OF = {
  station: CLASS.BERTH, planet: CLASS.BODY, moon: CLASS.BODY, star: CLASS.BODY,
  belt: CLASS.FIELD, asteroid: CLASS.FIELD, lagrange: CLASS.SITE, pilot: CLASS.FRIENDLY
};

/**
 * Classify one contact.
 *
 * Ownership beats faction, and that ordering is the point: a `worker` hull with your
 * company's contract on it is not ambient traffic, it is an asset, and something shooting
 * at it is your problem in a way that a stranger's hauler is not.
 */
function classify(c) {
  if (c.kind === 'ship' || c.kind === 'pilot') {
    const own = ownerOfHull(c.obj);
    if (own.mine) {
      const u = c.obj.userData || {};
      // Under fire recently enough to still be a live situation.
      const hit = (S.time - (u.lastHit || -999)) < SWEEP.underFireFor;
      return hit ? CLASS.THREATENED : CLASS.MINE;
    }
    if (own.kind === OWN.PILOT) return CLASS.FRIENDLY;
    if (c.faction === 'hostile') return CLASS.HOSTILE;
    if (c.faction === 'friendly') return CLASS.FRIENDLY;
    return CLASS.NEUTRAL;
  }
  return CLASS_OF[c.kind] || CLASS.NEUTRAL;
}

/**
 * How fast the gap is shrinking, in units per second. Positive is closing.
 *
 * Sampled against the last sweep rather than differentiated per frame: the sweep runs a few
 * times a second, which is a long enough baseline for the number to be stable and a short
 * enough one for it to be current. A per-frame derivative of two orbiting positions is
 * mostly numerical noise.
 */
function closing(obj, now) {
  const p = S.player.position;
  const o = obj.position;
  const d = Math.hypot(o.x - p.x, o.y - p.y, o.z - p.z);
  const was = prev.get(obj);
  prev.set(obj, { d, t: now });
  if (!was || now - was.t <= 0) return 0;
  return (was.d - d) / (now - was.t);
}

/** How much of a problem this hostile is, right now. */
function threatOf(c, u) {
  const reach = u.range || 0;
  const inOptimal = reach > 0 && c.d <= reach;
  // Damage it can put out per second at all...
  const dps = (u.dmg || 0) / Math.max(0.2, u.pcool || 1);
  // ...times how much of that it can currently deliver. A standoff hull outside its own
  // reach is carrying its whole magazine and none of its threat.
  const bring = inOptimal ? 1 : reach > 0 ? Math.max(0.08, Math.min(1, reach / Math.max(1, c.d))) : 0.1;
  const locked = u.locked ? SWEEP.lockedWeight : 1;
  return { dps, inOptimal, weight: dps * bring * locked };
}

/**
 * The picture.
 *
 * Cached for `SWEEP.interval` — the reasoner asks every tick, the HUD asks when it repaints,
 * and ARIA's dialogue asks whenever the player says something. One walk serves all three.
 */
export function sweep(force) {
  const now = S.time || 0;
  if (!force && cache && now - cacheT < SWEEP.interval) return cache;
  cacheT = now;

  const list = contacts();
  const seen = new Set();
  const rows = [];

  for (const c of list) {
    const cls = classify(c);
    const u = (c.obj && c.obj.userData) || {};
    const moving = cls === CLASS.HOSTILE || cls === CLASS.FRIENDLY ||
                   cls === CLASS.MINE || cls === CLASS.THREATENED || cls === CLASS.NEUTRAL;
    if (moving) seen.add(c.obj);
    const row = {
      obj: c.obj, kind: c.kind, name: c.name, faction: c.faction,
      cls, d: c.d,
      operator: c.owner || (u.name ? operatorName(u) : null),
      mine: !!c.mine,
      closing: moving ? closing(c.obj, now) : 0,
      hp: u.hp !== undefined ? u.hp : null,
      hpFrac: u.maxHp ? u.hp / u.maxHp : null,
      // How loud you are to *it*. A picket that cannot resolve you is not yet a threat,
      // whatever its guns say — the same asymmetry the ambush code and the chart use.
      seesUs: u.sensor ? c.d <= detectionRange(u.sensor, playerSignature()) : true,
      ore: c.ore !== undefined ? c.ore : null
    };
    if (cls === CLASS.HOSTILE) Object.assign(row, threatOf(c, u));
    rows.push(row);
  }

  // Wrecks are not contacts — they are places, charted like a Lagrange point, and the
  // contact walk has no reason to know about them. ARIA does: a worked-out field and a
  // fresh one are different answers to "is there anything here worth stopping for".
  const range = (S.stats.sensor || 2000) * SWEEP.wreckReach;
  const gp = { x: 0, y: 0, z: 0 };
  for (const g of graveyards()) {
    gravePosition(g, gp);
    const p = S.player.position;
    const d = Math.hypot(gp.x - p.x, gp.y - p.y, gp.z - p.z);
    if (d > range) continue;
    rows.push({
      obj: null, grave: g, kind: 'wreck', name: g.name, cls: CLASS.WRECK,
      d, closing: 0, faction: 'neutral', operator: null, mine: false,
      spent: isExhausted(g.key), left: remaining(g.key),
      inside: d <= g.radius + GRAVEYARD.searchRange
    });
  }

  // Forget anything that has stopped being a contact, or the derivative map is a slow leak
  // holding references to despawned hulls for the rest of the session.
  if (prev.size > seen.size + SWEEP.staleSlack) {
    for (const k of [...prev.keys()]) if (!seen.has(k)) prev.delete(k);
  }

  rows.sort((a, b) => a.d - b.d);
  cache = summarise(rows);
  return cache;
}

/** Roll the rows up into the handful of numbers a decision actually turns on. */
function summarise(rows) {
  const by = k => rows.filter(r => r.cls === k);
  const hostiles = by(CLASS.HOSTILE);
  const threat = hostiles.reduce((a, r) => a + (r.weight || 0), 0);
  const pressing = hostiles.filter(r => r.inOptimal && r.seesUs);
  const nearestHostile = hostiles[0] || null;
  const closingHostiles = hostiles.filter(r => r.closing > SWEEP.closingFloor);

  const berths = by(CLASS.BERTH);
  const fields = by(CLASS.FIELD);
  const wrecks = by(CLASS.WRECK).filter(w => !w.spent);

  return {
    at: S.time || 0,
    rows,
    hostiles, friendlies: by(CLASS.FRIENDLY), mine: by(CLASS.MINE),
    threatened: by(CLASS.THREATENED), neutrals: by(CLASS.NEUTRAL),
    berths, bodies: by(CLASS.BODY), fields, wrecks, sites: by(CLASS.SITE),

    // The aggregates. Every one of these is something the tree compares against.
    threat,                                   // total weighted danger
    threatCount: hostiles.length,
    pressingCount: pressing.length,           // ...that can actually reach you
    closingCount: closingHostiles.length,
    nearestHostile: nearestHostile ? nearestHostile.d : Infinity,
    nearestHostileClosing: nearestHostile ? nearestHostile.closing : 0,
    // Seconds until the nearest closing hostile is on top of you, or Infinity.
    timeToContact: nearestHostile && nearestHostile.closing > SWEEP.closingFloor
      ? Math.max(0, nearestHostile.d / nearestHostile.closing) : Infinity,
    lockedOnUs: hostiles.some(r => r.obj && r.obj.userData && r.obj.userData.locked),
    outnumbered: hostiles.length > by(CLASS.FRIENDLY).length + 1,

    nearestBerth: berths[0] || null,
    nearestField: fields[0] || null,
    nearestWreck: wrecks[0] || null,
    insideWreck: wrecks.some(w => w.inside)
  };
}

/** One line for ARIA to say, or for the log. */
export function sweepLine(s = sweep()) {
  const bits = [];
  if (s.threatCount) {
    bits.push(`${s.threatCount} hostile${s.threatCount === 1 ? '' : 's'}` +
      (s.pressingCount ? `, ${s.pressingCount} inside reach` : ', none in reach yet'));
  } else bits.push('nothing hostile on the array');
  if (s.mine.length) bits.push(`${s.mine.length} of ours`);
  if (s.threatened.length) bits.push(`${s.threatened.length} of ours under fire`);
  if (s.berths.length) bits.push(`${s.berths.length} berth${s.berths.length === 1 ? '' : 's'}`);
  if (s.fields.length) bits.push(`${s.fields.length} field${s.fields.length === 1 ? '' : 's'}`);
  if (s.wrecks.length) bits.push(`${s.wrecks.length} wreck${s.wrecks.length === 1 ? '' : 's'} unworked`);
  return bits.join(' · ') + '.';
}
