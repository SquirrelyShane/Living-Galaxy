// Living Galaxy — searching a debris field.
//
// A new verb, and the reason it needed to be one rather than reusing what already existed.
//
// The game had two ways to take something out of the world. **Mining** works a rock, and a
// rock is inexhaustible in practice — a belt regenerates and the loop is "keep going until
// the hold is full". **Investigating an anomaly** (`systems/lagrange.js`) is one-shot: you
// arrive, you work it once, it is gone, and the module's own comment says a one-shot place
// that regenerates is a belt with extra steps.
//
// A graveyard is neither, and the middle is the interesting part. It has a **finite amount
// in it** and yields **less each time it is worked**, so it is somewhere you come back to
// across several sessions and then, genuinely, it is picked over and the last pass is not
// worth the fuel. That shape is what makes it a place with a history rather than a vending
// machine or a locked box.
//
// ## Depletion is the whole mechanic
//
// Each search returns a fraction of what is left, and what is left is what the field
// started with minus everything taken. Two consequences follow that neither mining nor
// anomalies produce:
//
//   **Diminishing returns are legible.** The panel can honestly say a field is "picked
//   over", because that is a number and not a mood.
//
//   **The rare finds are at the bottom.** A relic is drawn against remaining mass, so a
//   field worked once probably gives salvage and a field worked eleven times has either
//   given up its relic or never had one. Somebody who works a field to exhaustion is making
//   a real bet on it.
//
// ## What a search does not do
//
// It does not gate anything. Every channel it pays into — salvage and survey data as cargo,
// crafting materials, credits, skill practice — already existed, and nothing here is a key
// that opens a door. That is the same rule `data/anomalies.js` states for its own rewards
// and it is right for the same reason: a field that gates progression turns "go and look"
// into "go and fetch".

import { S, cargoFree } from '../../core/state.js';
import { makeRng, hashString } from '../../core/rng.js';
import { toast, status } from '../../core/notify.js';
import { sfx } from '../platform/audio.js';
import { practice } from '../crew/character.js';
import { graveyards, gravePosition, GRAVEYARD } from '../../world/landmarks.js';
import { FIND_KINDS, FIND_KEYS } from '../../data/worldgen/battles.js';
import { loadHold } from '../trade/holds.js';

/** Tuning. All of it is about how fast a field runs out. */
export const SALVAGE = {
  // Fraction of what remains that one sweep recovers. A field therefore approaches empty
  // asymptotically and the operator decides when it has stopped being worth the time.
  pullFraction: [0.14, 0.26],

  // Below this, the field reports itself picked over and pays out nothing further. Without
  // a floor the asymptote means a field is never *done*, and "never done" is indistinguishable
  // from a belt.
  exhausted: 0.06,

  // Seconds a sweep takes. Long enough that it is an activity, short enough that it is not
  // a loading screen.
  sweepSeconds: 9,

  // Base tonnage in a field of scale 1.0.
  baseMass: 2400,

  // How much a relic is worth in credits per unit, before the field's own yield bias.
  relicValue: [4200, 26000],

  // Chance per sweep that live ordnance goes off in the grapple. Scaled by field hazard.
  ordnanceRisk: 0.06,
  ordnanceDamage: [4, 17]
};

// ── persistent state ─────────────────────────────────────────────────
//
// Only the depletion is stored. Everything else about a field — its name, its history, who
// fought, what it holds — is derived from the seed, so a save carries a number per worked
// field and nothing more.

export const worked = () => (S.graves = S.graves || {});

/**
 * How many sweeps this pilot has ever run. The counter contracts measure a `search` job
 * against — a lifetime total, so the baseline taken at acceptance turns it into "N more".
 *
 * A counter rather than a per-field tally on purpose: a contract to work a field does not
 * care *which* field satisfies it if the player finds a better one, in the same way a
 * bounty does not care where the kill happened. The template's brief names a field because
 * that is where the work is, not because the check is fenced to it.
 */
export const searchCount = () => (S.graveSweeps | 0);

/** How much of a field remains, 0..1. A field never visited is untouched. */
export const remaining = key => {
  const w = worked()[key];
  return w === undefined ? 1 : Math.max(0, w);
};

export const isExhausted = key => remaining(key) <= SALVAGE.exhausted;

export const serializeGraves = () => Object.assign({}, worked());
export function restoreGraves(d) {
  S.graves = {};
  if (d) for (const k of Object.keys(d)) S.graves[k] = d[k];
}

// ── finding the field you are in ─────────────────────────────────────

const _p = { x: 0, y: 0, z: 0 };

/** The debris field the player is inside, or null. */
export function fieldAt(pos) {
  const at = pos || S.player.position;
  for (const g of graveyards()) {
    gravePosition(g, _p);
    const d = Math.hypot(_p.x - at.x, _p.y - at.y, _p.z - at.z);
    if (d <= g.radius + GRAVEYARD.searchRange) return g;
  }
  return null;
}

/** Distance to a field's centre, for the HUD and the approach code. */
export function fieldDistance(g, from) {
  const at = from || S.player.position;
  gravePosition(g, _p);
  return Math.hypot(_p.x - at.x, _p.y - at.y, _p.z - at.z);
}

// ── the search ───────────────────────────────────────────────────────

/**
 * Which find a sweep turns up.
 *
 * The field's own `yields` bias multiplies the base weight, so what a fight left behind
 * follows from what kind of fight it was — a siege is heavy with ordnance, a lost
 * expedition is mostly relics and records and very little worth lifting by mass.
 *
 * The rare channels are additionally gated on how much of the field is left, which is the
 * mechanic's whole point: a relic is at the bottom of a field, not scattered evenly through
 * it. Working a field once and leaving is a decision with a cost.
 */
export function rollFind(g, rng, left) {
  const weights = FIND_KEYS.map(k => {
    const base = FIND_KINDS[k].weight * ((g.yields && g.yields[k]) || 1);
    // A rare find is proportionally likelier the further into a field you have dug.
    if (FIND_KINDS[k].rare) return base * Math.max(0.05, 1 - left) * 1.8;
    return base;
  });
  let total = 0;
  for (const w of weights) total += w;
  let roll = rng.next() * total;
  for (let i = 0; i < FIND_KEYS.length; i++) {
    roll -= weights[i];
    if (roll <= 0) return FIND_KEYS[i];
  }
  return FIND_KEYS[0];
}

/**
 * Work the field once.
 *
 * Returns a report rather than mutating the UI, so the same call serves the panel, the
 * fleet layer (a salvage hull working a field on standing orders) and the tests. `dry` runs
 * the numbers without taking anything, which is what the panel uses to show an estimate.
 */
export function search(g, opts = {}) {
  if (!g) return { ok: false, reason: 'no field' };

  const left = remaining(g.key);
  if (left <= SALVAGE.exhausted) {
    return { ok: false, reason: 'picked over', left, exhausted: true };
  }

  const dist = fieldDistance(g);
  if (!opts.ignoreRange && dist > g.radius + GRAVEYARD.searchRange) {
    return { ok: false, reason: 'out of range', dist };
  }

  // Seeded on the field and on how many sweeps have been run, so a search is reproducible
  // but not identical every time — the same field on the same pass gives the same find on
  // any client, which is what a shared galaxy needs.
  const pass = Math.round((1 - left) * 1000);
  const rng = makeRng((S.seed ^ hashString(g.key + ':' + pass)) >>> 0);

  const frac = SALVAGE.pullFraction[0] +
    rng.next() * (SALVAGE.pullFraction[1] - SALVAGE.pullFraction[0]);
  const pulled = left * frac;

  const kind = rollFind(g, rng, left);
  const spec = FIND_KINDS[kind];
  const mass = Math.round(SALVAGE.baseMass * g.scale * pulled * (0.7 + rng.next() * 0.6));

  const report = {
    ok: true, kind, kindName: spec.name, field: g.name, key: g.key,
    mass, left: Math.max(0, left - pulled),
    commodity: spec.commodity,
    credits: 0, hull: 0, hazard: false
  };

  // A relic is a credit payout rather than tonnage — it is one object, and its worth is not
  // a function of how much it weighs.
  if (kind === 'relic') {
    report.credits = Math.round(
      SALVAGE.relicValue[0] + rng.next() * (SALVAGE.relicValue[1] - SALVAGE.relicValue[0]));
    report.mass = Math.max(1, Math.round(mass * 0.05));
  }

  // Live ordnance is worth more and occasionally objects to being handled.
  if (kind === 'ordnance' && rng.next() < SALVAGE.ordnanceRisk * (g.hazard || 1)) {
    report.hazard = true;
    report.hull = Math.round(
      SALVAGE.ordnanceDamage[0] + rng.next() * (SALVAGE.ordnanceDamage[1] - SALVAGE.ordnanceDamage[0]));
  }

  if (opts.dry) return report;

  // ── commit ──
  const free = cargoFree ? cargoFree() : Infinity;
  const taken = Math.min(report.mass, Math.max(0, free));
  report.taken = taken;
  report.spilled = report.mass - taken;

  if (taken > 0) {
    if (typeof loadHold === 'function') loadHold(report.commodity, taken);
    else S.cargo[report.commodity] = (S.cargo[report.commodity] || 0) + taken;
  }
  if (report.credits) S.credits += report.credits;
  if (report.hull) S.player.hull = Math.max(1, (S.player.hull || 100) - report.hull);

  worked()[g.key] = report.left;
  S.graveSweeps = (S.graveSweeps | 0) + 1;
  practice('sensors', 14);
  practice('extraction', 8);

  return report;
}

/** A short line for the log and the panel. Assembled here so every surface says it the same way. */
export function searchLine(r) {
  if (!r.ok) {
    if (r.exhausted) return 'Nothing left here worth the grapple time.';
    if (r.reason === 'out of range') return 'Too far out to work the field.';
    return 'No field here.';
  }
  const bits = [];
  if (r.kind === 'relic') {
    bits.push(`Relic recovered from ${r.field} — ${r.credits.toLocaleString('en-US')} cr`);
  } else {
    bits.push(`${r.kindName} from ${r.field} — ${r.taken} kg`);
    if (r.spilled > 0) bits.push(`${r.spilled} kg left floating, hold is full`);
  }
  if (r.hazard) bits.push(`ordnance cooked off in the grapple, −${r.hull} hull`);
  if (r.left <= SALVAGE.exhausted) bits.push('field is picked over');
  return bits.join(' · ');
}

/** Run a sweep at whatever field the player is in, and report it. The UI entry point. */
export function searchHere() {
  const g = fieldAt();
  if (!g) { status('No debris field in range.'); return { ok: false, reason: 'no field' }; }
  const r = search(g);
  if (!r.ok) { status(searchLine(r)); return r; }
  toast(searchLine(r));
  sfx(r.hazard ? 'hit' : 'pickup');
  return r;
}

/** How picked-over a field is, as a word. For the panel and the survey report. */
export function fieldState(g) {
  const left = remaining(g.key);
  if (left <= SALVAGE.exhausted) return 'picked over';
  if (left > 0.85) return 'undisturbed';
  if (left > 0.55) return 'lightly worked';
  if (left > 0.28) return 'well worked';
  return 'nearly stripped';
}

/** Everything a dossier wants to say about a field. */
export function fieldReport(g) {
  const left = remaining(g.key);
  return {
    name: g.name,
    kind: g.kind,
    age: g.ageYears,
    era: g.eraText,
    between: g.belligerentNames.join(' and '),
    anchor: g.anchor,
    state: fieldState(g),
    left,
    exhausted: left <= SALVAGE.exhausted,
    radius: g.radius,
    blurb: g.blurb,
    distance: fieldDistance(g)
  };
}
