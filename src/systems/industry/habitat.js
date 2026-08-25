// Living Galaxy — what keeps a hull alive on a long haul: arrays and a farm.
//
// ## Solar arrays: mobility traded for power
//
// Deployed, the arrays fill the bank from the star for nothing. Deployed, the ship cannot
// move at all. That trade is the whole mechanic, and the deployment *bar* is the part that
// makes it a decision rather than a toggle: there is a window in the middle where you have
// committed and cannot yet leave, and everything interesting about the feature happens in
// that window.
//
// The lock is real and enforced here, not suggested. `throttleLocked()` is read by the
// flight model and by every autopilot path, and `warpBlocked()` refuses a spool outright,
// because a mechanic whose constraint can be ignored by holding W is not a constraint.
//
// ## Hydroponics: the crew eat
//
// The game already had a food economy and it is a good one — `systems/crew/crew.js` draws
// `BIO-008` and `RAW-011` out of the material stock every game hour, and a crew with none
// gets progressively worse at everything rather than dying on a timer.
//
// So the farm does not invent a second one. It **produces into that stock**: beds turn
// water and power into provisions, at a rate that either keeps up with the mouths aboard or
// does not. Below a certain number of beds a ship is topping up at stations forever; above
// it, it feeds itself and can stay out indefinitely. The surplus is ordinary material —
// sellable, craftable, tradeable — because it is ordinary material.
//
// The alternative was a private `stock` number on the habitat, and it would have been
// wrong in the specific way this project keeps writing comments about: two systems with
// separate opinions about whether the crew has eaten.
//
// ## Why both run on game hours
//
// `CRAFT.gameHoursPerSecond` is the one conversion between wall time and the ship's own
// clock, and the fabricator, the lab and the galley already use it. A farm that grew on
// frame time would grow at a different rate on a phone than on a desktop, which is the kind
// of bug that only shows up in somebody else's save.

import { S } from '../../core/state.js';
import { HABITAT, CRAFT, CREW } from '../../core/config.js';
import { toast, status } from '../../core/notify.js';
import { held, addMaterial, takeMaterial } from './crafting.js';

/* The two materials the crew actually eat and drink. Same ids `systems/crew/crew.js`
   draws — named here rather than imported because that module keeps them private, and a
   third copy of the string is worse than a second one that says why it exists. */
const FOOD = 'BIO-008';
const WATER = 'RAW-011';

/** Fresh installation state. Shape is the save's, so this is the schema. */
export function blankHabitat() {
  return {
    panels: { state: 'stowed', pct: 0, output: 0 },
    // No provisions number here: the galley IS the material stock. `grown` is only a
    // running total for the readout, so a pilot can see the farm has done something.
    farm: { net: 0, days: Infinity, brownout: false, dry: false, grown: 0, carry: 0 }
  };
}

const bag = () => (S.habitat = S.habitat || blankHabitat());

/** How many arrays and beds this fit carries. Read off the modules, never stored. */
export const arrays = () => countMod('solararray');
export const beds = () => countMod('hydrobed');

function countMod(key) {
  const f = S.fit || {};
  let n = 0;
  for (const slot in f) {
    const list = f[slot];
    if (!Array.isArray(list)) continue;
    for (const k of list) if (k === key) n++;
  }
  return n;
}

// ── the arrays ───────────────────────────────────────────────────────

/**
 * How bright it is here, relative to a comfortable orbit.
 *
 * Inverse square on distance from the star, scaled by the star's own luminosity — so an
 * array is worth carrying in an inner system and nearly worthless out past the frost line,
 * which is the correct answer and also a reason for the outer system to feel different.
 */
export function insolation() {
  const star = (S.world.bodies || [])[0];
  if (!star) return 1;
  const d = star.position.distanceTo(S.player.position);
  const lum = (S.systemPlan && S.systemPlan.star && S.systemPlan.star.lum) || 1;
  // 9,000 units is where the generator puts the habitable band, so it is the natural
  // reference distance — an array at a comfortable orbit is worth exactly its rating.
  const ref = 9000 * Math.sqrt(lum);
  return Math.min(HABITAT.maxInsolation, Math.pow(ref / Math.max(ref * 0.12, d), 2));
}

export const panelState = () => bag().panels.state;
export const panelPct = () => bag().panels.pct;

/** Two decimal places, because the bar shows two and the number should be the same one. */
export const panelPctText = () => bag().panels.pct.toFixed(2) + '%';

/** The drive is locked out while anything is out there. */
export function throttleLocked() {
  const p = bag().panels;
  return p.pct > HABITAT.lockAbove;
}

/** ...and so is the warp core, which refuses rather than silently failing to spool. */
export function warpBlocked() {
  return throttleLocked() ? 'Solar arrays deployed — stow them before the core will spool' : null;
}

/**
 * Put them out, or bring them in.
 *
 * Refuses to deploy under way, because an array unfolding at speed is a shed array. The
 * refusal names the reason: a control that declines silently reads as a broken control.
 */
export function deployPanels() {
  const p = bag().panels;
  if (!arrays()) { toast('No solar arrays fitted'); return false; }
  if (p.state === 'deployed' || p.state === 'deploying') return false;
  if (S.warp.state !== 'idle') { toast('Not while the core is running'); return false; }
  if (Math.abs(S.player.throttle) > 0.02 || (S.player.velocity && S.player.velocity.length() > 0.05)) {
    toast('Come to a stop first — the arrays will not survive it');
    return false;
  }
  p.state = 'deploying';
  status('Deploying solar arrays — the drive is locked out');
  return true;
}

export function stowPanels() {
  const p = bag().panels;
  if (p.state === 'stowed' || p.state === 'stowing') return false;
  p.state = 'stowing';
  status('Stowing solar arrays');
  return true;
}

export function togglePanels() {
  const p = bag().panels;
  return (p.state === 'stowed' || p.state === 'stowing') ? deployPanels() : stowPanels();
}

// ── the tick ─────────────────────────────────────────────────────────

export function updateHabitat(dt) {
  const h = bag();
  updateArrays(h, dt);
  updateFarm(h, dt * CRAFT.gameHoursPerSecond);
}

function updateArrays(h, dt) {
  const p = h.panels;
  const n = arrays();

  // A fit that lost its arrays mid-deployment retracts them rather than leaving the ship
  // pinned by hardware it no longer has.
  if (!n && p.pct > 0) { p.state = 'stowing'; }

  const full = HABITAT.deploySeconds;
  if (p.state === 'deploying') {
    p.pct = Math.min(100, p.pct + (100 / full) * dt);
    if (p.pct >= 100) { p.state = 'deployed'; status('Arrays deployed — charging'); }
  } else if (p.state === 'stowing') {
    p.pct = Math.max(0, p.pct - (100 / (full * HABITAT.stowScale)) * dt);
    if (p.pct <= 0) { p.state = 'stowed'; status('Arrays stowed — drive released'); }
  }

  // Output scales with how much of the array is actually facing the sun, which is the
  // deployment fraction — so a half-open array is worth half, and the bar means something
  // beyond being a timer.
  p.output = n * HABITAT.outputPerArray * insolation() * (p.pct / 100);
  if (p.output > 0) {
    S.player.energy = Math.min(S.stats.energyCap, S.player.energy + p.output * dt);
  }

  // The lock. Enforced, not advertised: `flight` reads `throttleLocked()` too, and this is
  // the belt to that braces — an autopilot or a keybind that writes throttle directly still
  // ends up at zero on the next tick.
  if (throttleLocked() && S.player.throttle !== 0) S.player.throttle = 0;
}

function updateFarm(h, gh) {
  const f = h.farm;
  const crew = (S.crew || []).length;
  const b = beds();

  const eat = crew * CREW.needs.foodPerHour;      // kg of provisions per game hour
  f.days = eat <= 0 ? Infinity : held(FOOD) / (eat * 24);

  if (b <= 0) { f.net = -eat; f.brownout = false; f.dry = false; return; }

  // A bed needs power and water. Short of either it runs at whatever share it can get,
  // which is why a big farm on a small reactor is a farm that mostly does not work — and
  // why `advise: 'power'` is a thing ARIA can conclude from watching one.
  const wantPower = b * HABITAT.powerPerBed;
  const havePower = Math.max(0, S.stats.energyRegen - S.player.expend + h.panels.output);
  const powerShare = Math.min(1, havePower / wantPower);

  const wantWater = b * HABITAT.waterPerBed * gh;
  const gotWater = wantWater <= 0 || takeMaterial(WATER, wantWater);
  f.dry = !gotWater;
  f.brownout = powerShare < 0.95;

  const rate = b * HABITAT.perBed * powerShare * (gotWater ? 1 : 0);
  f.net = rate - eat;

  // Accumulated rather than added every tick: a frame at 60 Hz grows two milligrams, and
  // `addMaterial` on a fraction that small is a lot of object churn for a number the
  // inventory rounds off anyway.
  f.carry += rate * gh;
  if (f.carry >= 0.25) {
    const give = Math.floor(f.carry * 100) / 100;
    addMaterial(FOOD, give);
    f.grown += give;
    f.carry -= give;
  }
}

// ── buying stores ────────────────────────────────────────────────────

/**
 * Is the galley running low?
 *
 * One threshold, read by the report, the line ARIA says and the `farm.low` fact the tree
 * compares against — rather than each of the three carrying its own idea of "low" and
 * disagreeing at the edges. A ship with no mouths aboard is never low.
 */
export function storesLow() {
  const h = bag();
  if (!(S.crew || []).length) return false;
  return h.farm.days <= HABITAT.warnDays;
}

export const storeQuote = kg => Math.ceil(Math.max(0, kg) * HABITAT.storePrice);

/**
 * Top the galley up at a berth. Returns kilograms actually loaded.
 *
 * Buys into the material stock, so what is bought here is the same provisions the crew
 * draw, the fabricator can consume and the market will take back.
 */
export function buyStores(kg, station = S.docked) {
  if (!station) { toast('Dock first'); return 0; }
  const room = Math.max(0, HABITAT.storeCap - held(FOOD));
  const want = Math.max(0, Math.min(kg, room));
  if (want <= 0) { toast('The galley is full'); return 0; }
  const cost = storeQuote(want);
  if (cost > S.credits) { toast('Not enough credits for that'); return 0; }
  S.credits -= cost;
  addMaterial(FOOD, want);
  toast(`${Math.round(want)} kg of provisions aboard`);
  return want;
}

// ── readouts ─────────────────────────────────────────────────────────

export function habitatReport() {
  const h = bag();
  const crew = (S.crew || []).length;
  return {
    arrays: arrays(),
    panels: h.panels.state,
    pct: h.panels.pct,
    pctText: panelPctText(),
    output: +h.panels.output.toFixed(2),
    insolation: +insolation().toFixed(2),
    locked: throttleLocked(),
    beds: beds(),
    stock: Math.round(held(FOOD)),
    water: Math.round(held(WATER)),
    cap: HABITAT.storeCap,
    grown: Math.round(h.farm.grown),
    net: +h.farm.net.toFixed(2),
    days: h.farm.days === Infinity ? Infinity : +h.farm.days.toFixed(1),
    selfSufficient: crew > 0 && h.farm.net >= 0,
    low: storesLow(),
    warnDays: HABITAT.warnDays,
    starving: crew > 0 && held(FOOD) <= 0,
    brownout: h.farm.brownout,
    dry: h.farm.dry,
    crew
  };
}

/** One line, for ARIA and the panel. */
export function habitatLine() {
  const r = habitatReport();
  const bits = [];
  bits.push(r.arrays ? `${r.arrays} array${r.arrays === 1 ? '' : 's'} ${r.panels} ${r.pctText}` : 'no arrays fitted');
  if (r.output > 0) bits.push(`+${r.output} MW`);
  if (r.beds) {
    bits.push(`${r.beds} bed${r.beds === 1 ? '' : 's'}, ` +
      (r.selfSufficient ? 'self-sufficient' : `${r.days === Infinity ? '∞' : r.days} days of stores`));
  } else if (r.crew) bits.push(`${r.days === Infinity ? '∞' : r.days} days of stores, no farm`);
  if (r.low && !r.starving) bits.push(`under ${r.warnDays} days of stores`);
  if (r.brownout) bits.push('beds are power-starved');
  if (r.dry) bits.push('beds are dry — no water aboard');
  if (r.starving) bits.push('the galley is empty');
  return bits.join(' · ');
}

export const serializeHabitat = () => JSON.parse(JSON.stringify(bag()));

export function restoreHabitat(d) {
  if (!d) return false;
  const h = blankHabitat();
  if (d.panels) Object.assign(h.panels, d.panels);
  if (d.farm) Object.assign(h.farm, d.farm);
  // A save written mid-deployment comes back mid-deployment, but never in a state the
  // machine cannot leave: an unknown state is stowed.
  if (!['stowed', 'deploying', 'deployed', 'stowing'].includes(h.panels.state)) {
    h.panels.state = h.panels.pct >= 100 ? 'deployed' : 'stowed';
  }
  S.habitat = h;
  return true;
}

export function resetHabitat() { S.habitat = blankHabitat(); }
