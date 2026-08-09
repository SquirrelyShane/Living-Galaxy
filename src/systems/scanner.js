// Living Galaxy — the scanner. Resolution is a function of range over sensor
// strength, not a yes/no. Far out you get a spectrometry band and a mass class;
// as you close, the assay fills in, and in orbit you get everything.
//
// Tier 0 nothing · 1 spectrometry · 2 composition · 3 detailed assay · 4 full survey

import { S } from '../core/state.js';
import { practice } from './character.js';
import { crewEvent } from './crew.js';
import { SCAN, CELESTIAL, LAGRANGE } from '../core/config.js';
import { clamp, fmtKm } from '../core/utils.js';
import { makeRng } from '../core/rng.js';
import { planetInfo, asteroidDetail, surveyLevel, knownFeatures, featureScan } from './survey.js';
import { FEATURES } from '../data/features.js';
import { transferRows } from './ephemeris.js';
import { lagrangePoints, anomalyAt, isWorked, pointDistance } from './lagrange.js';
import { kindsOf, alreadyFiled } from './research.js';
import { FINDINGS } from '../data/research.js';
import { toast, status } from '../ui/toast.js';
import { sfx } from './audio.js';
import { holdCap, holdMass, manifestOf } from './holds.js';

function hash(str) {
  let h = 2166136261;
  for (let i = 0; i < String(str).length; i++) { h ^= String(str).charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}

/**
 * How much of the return a body's atmosphere eats, as a divisor on effective sensor
 * strength. 1.0 is vacuum. A toxic greenhouse or a giant runs about 1.7.
 *
 * This is the first time the atmosphere shells in `world/system.js` mean anything
 * mechanically. It is also what makes the orbit-band choice a decision: a survey ring
 * around an airless moon resolves it completely, and the same ring around Vesper does not.
 * Discovered features push back in both directions — a polar vortex is a hole you can look
 * down, a megastorm is not.
 */
export function attenuation(obj) {
  const u = (obj && obj.userData) || {};
  const density = u.atmoDensity || 0;
  if (!density) return 1;
  const relief = clamp(featureScan(obj), -CELESTIAL.featureScanCap, CELESTIAL.featureScanCap);
  return Math.max(1, 1 + CELESTIAL.atmoScan * density * (1 - relief));
}

/** Raw resolution available at this range, before anything is remembered. */
export function tierAt(dist, sensor, bonus = 0, atten = 1) {
  const r = (dist * Math.max(atten, 1)) / Math.max(sensor, 1);
  const b = SCAN.bands;
  let t = r > b[0] ? 0 : r > b[1] ? 1 : r > b[2] ? 2 : r > b[3] ? 3 : 4;
  return clamp(t + bonus, 0, 4);
}

export function liveTier(obj) {
  if (!obj) return 0;
  const d = S.player.position.distanceTo(obj.position);
  return tierAt(d, S.stats.sensor, S.stats.scanTier || 0, attenuation(obj));
}

/** The best resolution ever achieved on this body — scans are archived. */
export const knownTier = name => (S.scans && S.scans[name]) || 0;

/** Start a sweep. The dish takes a moment; the result is filed when it completes. */
export function beginScan(obj, kind, name) {
  if (!obj) { toast('Nothing selected to scan'); sfx.deny(); return false; }
  if (S.scan && S.scan.active) { toast('Dish already sweeping'); return false; }
  const t = liveTier(obj);
  if (t <= 0) {
    toast('Out of scanner range — close the distance');
    sfx.deny();
    return false;
  }
  S.scan = { active: true, t: 0, dur: SCAN.chargeTime / (S.stats.scanRate || 1),
             obj, kind, name: name || (obj.userData && obj.userData.name) || 'contact' };
  status(`Scanning ${S.scan.name}…`);
  sfx.ui();
  return true;
}

export function updateScan(dt) {
  const s = S.scan;
  if (!s || !s.active) return;
  s.t += dt;
  if (s.t < s.dur) return;
  s.active = false;
  const t = liveTier(s.obj);
  const prev = knownTier(s.name);
  S.scans[s.name] = Math.max(prev, t);
  // A scan that told you something new is worth more practice than a repeat sweep.
  practice('sensors', t > prev ? 14 : 3);
  crewEvent('scan', 'survey', t > prev ? 1 : 0.25);
  sfx.pickup();
  if (t > prev) toast(`${s.name} — resolution ${TIER_NAME[t]}`);
  else toast(`${s.name} — no new detail at this range`);
}

export const scanProgress = () => (S.scan && S.scan.active) ? clamp(S.scan.t / S.scan.dur, 0, 1) : 0;

export const TIER_NAME = ['no return', 'spectrometry', 'composition', 'detailed assay', 'full survey'];

/**
 * Build the readout for a contact at whatever resolution we currently have.
 * Returns { tier, live, rows: [[label, value]], note }.
 */
export function scanReport(obj, kind, name) {
  const nm = name || (obj.userData && obj.userData.name) || 'contact';
  const live = liveTier(obj);
  const tier = Math.max(live, knownTier(nm));
  const dist = S.player.position.distanceTo(obj.position);
  const rows = [['Range', fmtKm(dist)], ['Resolution', TIER_NAME[tier]]];

  // A Lagrange point's identity — which planet, which side — is chart data, not sensor
  // data: you can read it off the ephemeris without pointing anything at it. What is
  // *on station* still needs the sweep, which is gated inside lagrange() by tier.
  if (kind === 'lagrange') return lagrange(obj, tier, rows);

  if (tier === 0) return { tier, live, rows, note: 'No usable return. Close to within sensor range and sweep again.' };

  // Where a body *will* be is navigation information, not sensor information, so it is
  // added for every orbital destination regardless of resolution — you can read an
  // ephemeris off the charts without pointing a dish at anything.
  if (kind === 'planet' || kind === 'moon' || kind === 'station') {
    for (const r of transferRows(obj, S.player.position, S.stats.warpSpeed)) rows.push(r);
  }

  if (kind === 'asteroid') return rock(obj, tier, rows);
  if (kind === 'planet' || kind === 'moon') return planet(obj, nm, tier, rows);
  if (kind === 'star') return star(obj, tier, rows);
  if (kind === 'station') return station(obj, tier, rows);
  if (kind === 'ship' || kind === 'pilot') return ship(obj, tier, rows);
  if (kind === 'belt') return belt(obj, tier, rows);
  return { tier, live, rows, note: 'Unclassified return.' };
}

// ── per-kind readouts ────────────────────────────────────────────────
function rock(obj, tier, rows) {
  const d = asteroidDetail(obj);
  const band = d.platinum > 4 ? 'strong platinum lines'
    : d.nickel > 22 ? 'nickel-heavy lines'
    : d.iron > 55 ? 'iron-dominant lines' : 'mixed silicate lines';
  rows.push(['Spectrum', band]);
  if (tier >= 2) {
    rows.push(['Mass', Math.round(obj.oreMax) + ' kg body']);
    rows.push(['Iron', d.iron + '%'], ['Silicates', d.silicates + '%']);
  }
  if (tier >= 3) {
    rows.push(['Nickel', d.nickel + '%'], ['Platinum', d.platinum + '%']);
    rows.push(['Remaining', Math.round(obj.ore) + ' kg']);
  }
  if (tier >= 4) rows.push(['Est. value', d.est + ' cr']);
  return { tier, live: tier, rows,
    note: tier < 4 ? 'Closer approach resolves trace metals and yield.' : 'Full assay archived.' };
}

function planet(obj, nm, tier, rows) {
  const i = planetInfo(obj);
  const u = obj.userData;
  rows.push(['Class', tier >= 2 ? (u.typeName || i.type) : bandOf(i)]);
  // Atmosphere is now a *reason* the reading is poor, not decoration. Saying so is the
  // difference between a pilot who closes the range and one who assumes the dish is broken.
  const att = attenuation(obj);
  if (att > 1.05) rows.push(['Atmosphere', att > 1.5 ? 'dense — heavy attenuation' : 'attenuating return']);
  if (tier >= 2) rows.push(['Minerals', i.minerals + '%'], ['Volatiles', i.volatiles + '%']);
  if (tier >= 3) rows.push(['Surface', i.tempC + ' °C'], ['Biosigns', i.bio + '%']);
  if (tier >= 3) rows.push(['Gravity', i.gravity.toFixed(2) + ' g']);
  if (tier >= 4 || surveyLevel(nm) >= 2) rows.push(['Anomaly', i.anomaly ? 'DETECTED' : 'none']);

  // What you have actually found on the ground, and — once you know there is more —
  // how much more. An unresolved count is the hook; the probe is how you cash it.
  const found = knownFeatures(obj);
  for (const k of found) rows.push([FEATURES[k].icon + ' Feature', FEATURES[k].name]);
  const total = i.features.length;
  if (total > found.length && tier >= 2) {
    rows.push(['Unresolved', `${total - found.length} surface return${total - found.length > 1 ? 's' : ''}`]);
  }

  // What a probe here would teach. A pilot deciding where to spend one of a limited number
  // of probes should be able to see that this world is the cold evidence they are short of,
  // rather than finding out afterwards — and a world already on file says so, because
  // probing it twice teaches nothing.
  if (tier >= 2) {
    const kinds = kindsOf(obj);
    rows.push(['Research', alreadyFiled(obj) ? 'already on file'
      : kinds.map(k => FINDINGS[k].name).join(', ')]);
  }

  const note = total > found.length && surveyLevel(nm) < 2
      ? 'Unresolved surface returns — put a probe down to read them.'
    : surveyLevel(nm) >= 2 ? 'Probe telemetry archived — sells best at economic hubs.'
    : tier >= 3 ? 'Enter orbit and launch a probe for surface truth.'
    : att > 1.5 ? 'Atmosphere is eating the return — a tighter orbit band is the only fix.'
    : 'Move to a closer orbit band for composition and biosigns.';
  return { tier, live: tier, rows, note };
}

const GAS_TYPES = new Set(['gasGiant', 'heliumGiant', 'methaneGiant']);

/** The spectrometry-only description, before the class resolves. Reads the world's own
 *  derived traits rather than four hardcoded type names, three of which had not existed
 *  since the twenty-type table landed. */
function bandOf(i) {
  if (GAS_TYPES.has(i.type)) return 'low-density giant';
  if (i.bio > 45) return 'oxygen-line body';
  if (i.volatiles > 55) return 'high-albedo volatile body';
  if (i.gravity > 1.4) return 'dense rocky body';
  return 'rocky body';
}

function star(obj, tier, rows) {
  rows.push(['Spectrum', 'G-type main sequence']);
  if (tier >= 2) rows.push(['Corona', 'lethal inside ' + Math.round((obj.userData.radius || 320) + 780) + ' km']);
  if (tier >= 3) rows.push(['Flare risk', 'moderate']);
  return { tier, live: tier, rows, note: 'Stable orbits form well outside the corona shell.' };
}

function station(obj, tier, rows) {
  const u = obj.userData;
  rows.push(['Transponder', u.category || 'unknown']);
  if (tier >= 2) rows.push(['Type', u.typeName || '—'], ['Pads', (u.services && u.services.pads) || '—']);
  if (tier >= 3 && u.modules) rows.push(['Modules', `${u.modules.length}/${u.slots} fitted`]);
  if (tier >= 4 && u.services) rows.push(['Shields', Math.round(u.services.shieldMax || 0)]);
  return { tier, live: tier, rows, note: 'Approach to hail control — the tractor handles the landing.' };
}

function ship(obj, tier, rows) {
  const u = obj.userData || {};
  rows.push(['Drive signature', u.faction === 'hostile' ? 'unregistered' : 'registered']);
  if (tier >= 2) rows.push(['Faction', u.faction || 'unknown'], ['Class', u.name || '—']);
  // v1.01.70. Mass shows a deck earlier than the manifest does, and the split is the point:
  // at tier 2 you can tell a laden ship from an empty one, which is the decision a raider
  // actually makes at range. *What* it is carrying is worth closing for.
  const cap = holdCap(u);
  if (tier >= 2 && cap) {
    const m = holdMass(u);
    rows.push(['Load', m >= 1 ? `${Math.round(m)} kg of ${Math.round(cap)} kg` : 'running empty']);
  }
  if (tier >= 3) rows.push(['Structure', Math.round(u.hp || 0) + ' / ' + (u.maxHp || 0)]);
  if (tier >= 3 && cap) {
    const man = manifestOf(u);
    if (man) rows.push(['Manifest', man]);
  }
  if (tier >= 4) rows.push(['Bounty', (u.bounty || 0) + ' cr'], ['Salvage', (u.salvage || 0) + ' kg']);
  return { tier, live: tier, rows,
    note: tier < 3 ? 'Close the range to read structure and bounty.' : 'Full profile resolved.' };
}

/**
 * A Lagrange point reads as a *place* rather than a body: there is nothing there to
 * measure, only something to find. Tier gates whether the sweep has resolved what is on
 * station, and the anomaly itself is looked up rather than described, so the scanner never
 * learns what a derelict is worth — systems/lagrange.js owns that.
 */
function lagrange(obj, tier, rows) {
  const u = obj.userData || {};
  const lp = lagrangePoints().find(x => x.key === u.lagrangeKey);
  rows.push(['Station', `${u.side === 4 ? 'leading' : 'trailing'} ${u.parentName} by 60°`]);
  if (!lp) return { tier, live: tier, rows, note: 'Point not currently charted.' };

  if (isWorked(lp.key)) {
    rows.push(['Status', 'worked out']);
    return { tier, live: tier, rows, note: 'Nothing left on station — this one is spent.' };
  }
  if (tier < LAGRANGE.chartTier) {
    rows.push(['Status', 'unresolved']);
    return { tier, live: tier, rows,
      note: 'Debris collects here. Close the range and sweep to resolve what is on station.' };
  }
  const a = anomalyAt(lp);
  if (!a) {
    rows.push(['Contact', 'none']);
    return { tier, live: tier, rows, note: 'Empty. Knowing that cost the same trip as finding something.' };
  }
  rows.push([a.def.icon + ' Contact', a.def.name]);
  if (a.def.hazard) rows.push(['Hazard', 'warp lock unstable nearby']);
  const d = pointDistance(lp, S.player.position);
  rows.push(['Range to work', d <= LAGRANGE.workRange ? 'in range' : fmtKm(d - LAGRANGE.workRange) + ' to close']);
  return { tier, live: tier, rows, note: a.def.desc };
}

function belt(obj, tier, rows) {
  const u = obj.userData || {};
  const rng = makeRng((S.seed ^ hash(u.name || 'belt')) >>> 0);
  rows.push(['Field', u.ringOf ? `ring system — ${u.ringOf}` : 'unresolved rock band']);
  if (tier >= 2) rows.push([u.ringOf ? 'Ring radius' : 'Mid-orbit', fmtKm(u.beltMid || 0)]);
  if (tier >= 3) rows.push(['Density', (rng.range(0.4, 1.8)).toFixed(2) + ' rocks/Mm³']);
  if (tier >= 4) rows.push(['Grade', ['poor', 'fair', 'good', 'rich'][Math.floor(rng.next() * 4)]]);
  return { tier, live: tier, rows,
    note: u.ringOf ? 'Ring ice is volatile-heavy — worth the trip out, and the ring moves with its planet.'
                   : 'Warp in, then MATCH a rock to start extraction.' };
}
