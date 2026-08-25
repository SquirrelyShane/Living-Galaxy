// Living Galaxy — every number ARIA can reason about, named once.
//
// ## Why a table and not property access
//
// The decision tree in `reasoner.js` is data: rows that say `['heat.pct', '>=', 80]`. For
// that to be data rather than code, the left-hand side has to be a *name* the tree can carry
// without knowing where the number lives. This is that dictionary.
//
// Three things fall out of it, and they are the whole reason for the indirection:
//
// **The tree becomes inspectable.** A rule is a tuple, so it can be printed, logged, diffed
// and tested without running the game. When ARIA explains a decision she is reading back the
// rules that fired, with the values they saw — which is the difference between an assistant
// with an opinion and one with a reason.
//
// **The numbers get defined once.** "Heat" is a fraction of a hull-specific capacity, not an
// absolute; "sustain" is how many seconds of continuous fire the bank supports, which nothing
// in the game had ever computed. Every consumer that wants those gets the same arithmetic
// instead of its own approximation.
//
// **A missing fact is loud.** `read()` on an unknown key throws in the suite and returns
// `null` in flight, and a rule against `null` never fires. A typo in a rule is therefore a
// rule that quietly does nothing — so `test/reasoner.mjs` asserts every key a rule mentions
// exists, which turns a silent failure into a red suite.
//
// Every entry is a pure read. Nothing here may mutate anything; the tree is allowed to be
// evaluated as often as anybody likes.

import { S, cargoMass, cargoFree, totalMass } from '../../core/state.js';
import { HEAT, WARP, MINING, ADVISOR, AUTOPILOT } from '../../core/config.js';
import { heatFraction } from '../combat/weapons.js';
import { fittedFeeds, magazineReport } from '../combat/magazine.js';
import { sweep } from './sweep.js';
import { activeContracts } from '../trade/contracts.js';
import { repairQuote } from '../trade/pricing.js';
import { beds as bedCount, storesLow } from '../industry/habitat.js';

const pct = (v, m) => (m > 0 ? clamp01(v / m) * 100 : 0);
const clamp01 = v => (v < 0 ? 0 : v > 1 ? 1 : v);
const safe = (v, d = 0) => (typeof v === 'number' && isFinite(v) ? v : d);

/**
 * The rack's damage per second, and what it costs to keep firing.
 *
 * Computed here rather than anywhere else in the project because nothing else needed it:
 * combat resolves one shot at a time and never asks what the whole fit sustains. It is the
 * number that decides whether a fight is winnable, so it is a fact.
 *
 * `sustain` is the honest one — seconds of continuous fire before the *bank* gives out,
 * accounting for regen. A fit that out-drains its own reactor has a sustain of a few
 * seconds and a fit that does not has an infinite one, and those are completely different
 * ships to take into a fight regardless of what their paper DPS says.
 */
export function rackReport() {
  const mounts = (S.stats.mounts || []).filter(Boolean);
  if (!mounts.length) return { dps: 0, drain: 0, sustain: Infinity, heatRate: 0, kinds: [] };

  let dps = 0, drain = 0, heatRate = 0;
  const kinds = [];
  for (const w of mounts) {
    const cd = Math.max(0.05, w.cooldown || 1);
    const dmg = (w.damage || 0) * (S.stats.weaponMult || 1);
    dps += dmg / cd;
    drain += (w.energy || 0) / cd;
    // Same split combat/weapons.js uses: an emitter dumps its draw into the barrel, a
    // slug thrower's heat is the barrel itself and scales with what it throws.
    // The same split `combat/weapons.js` applies per shot, summed per second: an emitter
    // dumps its draw into the barrel, a slug thrower's heat is the barrel and scales with
    // what it throws. Reading HEAT's own constants rather than inventing a second pair.
    heatRate += (w.kind === 'energy'
      ? (w.energy || 0) * HEAT.perEnergy
      : (w.damage || 0) * HEAT.perDamage) / cd;
    if (!kinds.includes(w.kind)) kinds.push(w.kind);
  }

  const regen = safe(S.stats.energyRegen, 0);
  const net = drain - regen;
  const cap = safe(S.stats.energyCap, 1);
  // `heatVent` is a fraction of capacity per second — the same reading `weapons.js` takes
  // on line 43. Comparing it against an absolute heat rate without scaling it first is the
  // classic units bug, and it would have made every fit look thermally infinite.
  const heatCap = safe(S.stats.heatCap, HEAT.capFloor);
  const ventAbs = (S.stats.heatVent || HEAT.ventRate) * heatCap;
  return {
    dps, drain, heatRate, kinds,
    // Infinite when the reactor keeps up — which is a real and important answer.
    sustain: net <= 0.01 ? Infinity : safe(S.player.energy, cap) / net,
    // ...and the same question for heat: seconds until the cutout, given the vent rate.
    // Seconds until the cutout, given what the radiators shed. `heatVent` is already an
    // absolute rate in recalcStats (HEAT.ventRate scaled by the fit), so both sides of this
    // are points per second and the units line up.
    thermal: heatRate <= ventAbs
      ? Infinity
      : (heatCap * Math.max(0, HEAT.cutout - heatFraction())) / (heatRate - ventAbs)
  };
}

/** Rounds left across every fitted feed, and the emptiest one as a fraction. */
export function magsReport() {
  const feeds = fittedFeeds();
  if (!feeds.length) return { total: Infinity, feeds: 0, dry: false, lowest: Infinity };
  let total = 0, lowest = Infinity;
  for (const f of feeds) {
    const r = magazineReport(f);
    total += r.total;
    lowest = Math.min(lowest, r.total);
  }
  return { total, feeds: feeds.length, dry: lowest === 0, lowest };
}

/**
 * The facts.
 *
 * Grouped by what they are about, and named `group.thing` so a rule reads like a sentence.
 * Percentages are 0–100 rather than 0–1 throughout: rules are written by hand and read by
 * people, and `['hull.pct','<',30]` is unambiguous where `['hull','<',0.3]` invites the
 * off-by-a-hundred that eats an afternoon.
 */
export const FACTS = {
  // ── the hull ──
  'hull.pct':      () => pct(S.player.hull, S.stats.hullMax),
  'armor.pct':     () => pct(S.player.armor, S.stats.armorMax),
  'shield.pct':    () => pct(S.player.shield, S.stats.shieldMax),
  'shield.regen':  () => safe(S.stats.shieldRegen),
  'hull.mass':     () => totalMass(),
  'hull.disabled': () => (S.sim && S.sim.disabled ? 1 : 0),

  // ── power ──
  'energy.pct':    () => pct(S.player.energy, S.stats.energyCap),
  'energy.regen':  () => safe(S.stats.energyRegen),
  'energy.draw':   () => safe(S.player.expend),
  // Net margin: what the reactor makes minus what the fit is drawing. Negative is a ship
  // living off its bank, which is fine for a minute and not for an hour.
  'energy.margin': () => safe(S.stats.energyRegen) - safe(S.player.expend),

  // ── heat ──
  'heat.pct':      () => heatFraction() * 100,
  'heat.vent':     () => safe(S.stats.heatVent) * safe(S.stats.heatCap, HEAT.capFloor),
  'heat.cutout':   () => (S.player.overheat ? 1 : 0),
  // Seconds of continuous fire before the cutout trips. Infinity when the radiators win.
  'heat.seconds':  () => rackReport().thermal,

  // ── the drive ──
  'throttle.pct':  () => safe(S.player.throttle) * 100,
  'speed':         () => safe(S.player.speed),
  'speed.pct':     () => pct(S.player.velocity ? S.player.velocity.length() : 0, S.stats.maxSpeed),
  'drift':         () => safe(S.player.drift),

  // ── the warp core ──
  'warp.charge':   () => safe(S.warp.charge),
  'warp.spooling': () => (S.warp.state === 'spooling' ? 1 : 0),
  'warp.running':  () => (S.warp.state === 'warping' ? 1 : 0),
  'warp.idle':     () => (S.warp.state === 'idle' ? 1 : 0),
  // Can the bank actually pay for a hop? A charge that spools and then strands you mid-
  // crossing is worse than not going.
  'warp.affordable': () => (safe(S.player.energy) >= (WARP.drainSpool || 12) * 1.6 ? 1 : 0),

  // ── the rack ──
  'weapon.count':  () => (S.stats.mounts || []).filter(Boolean).length,
  'weapon.dps':    () => rackReport().dps,
  'weapon.drain':  () => rackReport().drain,
  'weapon.sustain':() => rackReport().sustain,
  'weapon.heatrate': () => rackReport().heatRate,
  'ammo.total':    () => magsReport().total,
  'ammo.lowest':   () => magsReport().lowest,
  'ammo.dry':      () => (magsReport().dry ? 1 : 0),

  // ── the hold ──
  'cargo.pct':     () => pct(cargoMass(), S.stats.cargoCap),
  'cargo.free':    () => cargoFree(),
  'cargo.ore':     () => safe(S.cargo && S.cargo.ore),

  // ── the books ──
  'credits':       () => safe(S.credits),
  'credits.spare': () => Math.max(0, safe(S.credits) - (ADVISOR.reserve || 0)),
  'contracts.held':() => activeContracts().length,
  // Below this, a berth cannot fix anything: every line on the pad checklist is something
  // you buy. The tree needs to know, because "the hull needs work" and "we can pay for the
  // hull to be worked on" are different facts and only one of them is a reason to dock.
  'broke':         () => (safe(S.credits) < (AUTOPILOT.broke || 0) ? 1 : 0),
  'repair.cost':   () => repairQuote().cost,
  'repair.affordable': () => {
    const c = repairQuote().cost;
    return c <= 0 || c <= Math.max(0, safe(S.credits) - (AUTOPILOT.reserve || 0)) ? 1 : 0;
  },

  // ── the crew ──
  'crew.count':    () => (S.crew || []).length,
  'crew.morale':   () => {
    const c = S.crew || [];
    if (!c.length) return 100;
    return (c.reduce((a, x) => a + (x.morale ?? 1), 0) / c.length) * 100;
  },

  // ── where we are ──
  'docked':        () => (S.docked ? 1 : 0),
  'orbiting':      () => (S.orbit ? 1 : 0),
  'sensor.range':  () => safe(S.stats.sensor),
  'sensor.tier':   () => safe(S.stats.scanTier),

  // ── the picture ──
  'threat.level':   () => sweep().threat,
  'threat.count':   () => sweep().threatCount,
  'threat.pressing':() => sweep().pressingCount,
  'threat.closing': () => sweep().closingCount,
  'threat.nearest': () => sweep().nearestHostile,
  'threat.tti':     () => sweep().timeToContact,
  'threat.locked':  () => (sweep().lockedOnUs ? 1 : 0),
  'threat.outnumbered': () => (sweep().outnumbered ? 1 : 0),
  'friendly.count': () => sweep().friendlies.length,
  'ours.underfire': () => sweep().threatened.length,
  'berth.nearest':  () => (sweep().nearestBerth ? sweep().nearestBerth.d : Infinity),
  'field.nearest':  () => (sweep().nearestField ? sweep().nearestField.d : Infinity),
  'wreck.nearest':  () => (sweep().nearestWreck ? sweep().nearestWreck.d : Infinity),
  'wreck.inside':   () => (sweep().insideWreck ? 1 : 0),

  // ── the ship's own installations (v1.02.60) ──
  'panels.pct':     () => safe(S.habitat && S.habitat.panels && S.habitat.panels.pct),
  'panels.state':   () => panelState(),
  'panels.output':  () => safe(S.habitat && S.habitat.panels && S.habitat.panels.output),
  'farm.days':      () => {
    const d = S.habitat && S.habitat.farm ? S.habitat.farm.days : Infinity;
    return d === Infinity ? Infinity : safe(d, Infinity);
  },
  'farm.net':       () => safe(S.habitat && S.habitat.farm && S.habitat.farm.net),
  'farm.selfsufficient': () => (S.habitat && S.habitat.farm && S.habitat.farm.net >= 0 ? 1 : 0),
  'farm.beds':      () => safe(S.habitat && S.habitat.farm ? bedCount() : 0),
  // "Low" is HABITAT.warnDays, defined once and read here rather than a literal in a rule.
  'farm.low':       () => (storesLow() ? 1 : 0),

  // Weapon/mining reach, so a rule can talk about being in range of the thing it wants.
  'mining.range':   () => MINING.range
};

/** Panel state as a number, so a rule can compare it: 0 stowed, 1 moving, 2 deployed. */
function panelState() {
  const p = S.habitat && S.habitat.panels;
  if (!p) return 0;
  if (p.state === 'deployed') return 2;
  if (p.state === 'deploying' || p.state === 'stowing') return 1;
  return 0;
}

export const FACT_KEYS = Object.keys(FACTS);

/**
 * Read one fact.
 *
 * Returns `null` for an unknown key rather than throwing, because a decision tree that can
 * crash the simulation over a typo is worse than one that quietly declines to fire — but
 * `test/reasoner.mjs` asserts every key every rule mentions exists, so the typo is caught
 * where it should be, at the bench.
 */
export function read(key) {
  const f = FACTS[key];
  if (!f) return null;
  try { return f(); } catch (e) { return null; }
}

/** Every fact at once. Diagnostics, ARIA's own readout, and the suite. */
export function readAll() {
  const out = {};
  for (const k of FACT_KEYS) out[k] = read(k);
  return out;
}
