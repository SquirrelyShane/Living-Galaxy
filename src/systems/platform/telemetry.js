// Living Galaxy — live telemetry. What an observer can say about the system *right now*,
// as data rather than as pixels.
//
// The system chart has always been able to draw the world; what it could not do was
// *report* it. Selecting a rock told you its ore, selecting a station told you it had a
// shipyard, and selecting a planet told you to go and orbit it — three different answers
// of three different shapes, all assembled inline inside the tap handler. An executive
// who never leaves the office deck has nothing else: the chart is the whole instrument,
// and the instrument needs to produce a reading.
//
// Two functions, deliberately pure of DOM:
//
//   feed()   — everything visible from the current eye, bucketed, with one summary line
//              each. Rebuilt on demand; the caller decides the refresh rate.
//   detail() — the full record for one object, gated by sensor resolution.
//
// The gating matters more than the fields. Ephemeris is chart data — where a body is and
// where it will be is knowable from a desk — so orbital elements are never gated. Cargo,
// condition, armament and intent are sensor data, and a contact you cannot resolve says
// so instead of leaking its manifest. Same rule the scanner already applies; this module
// just applies it to more kinds of thing.

import { S } from '../../core/state.js';
import { TAU, fmtKm, fmtCr, fmtMass, fmtNum } from '../../core/utils.js';
import { scanOrigin, liveTier, knownTier, TIER_NAME } from '../industry/scanner.js';
import { detectionRange, npcSignature } from '../combat/detection.js';
import { surveyLevel, planetInfo, asteroidDetail } from '../industry/survey.js';
import { fieldContacts } from '../flight/fields.js';
import { trafficLine } from '../npc/shoal.js';

/** How far out an asteroid is still worth listing. Rock is a short-range return. */
const ROCK_RANGE = 900;

const dist = (a, b) => a.distanceTo(b);

/** Orbital period in seconds from the angular rate the world sim actually integrates. */
function orbitalPeriod(u) {
  const w = Math.abs(u && u.orbitSpeed || 0);
  return w > 1e-9 ? TAU / w : 0;
}

/** "4 h 12 m", "38 m", "—". Periods here run from minutes to a few hours of real time. */
export function fmtPeriod(sec) {
  if (!sec || !isFinite(sec)) return '—';
  if (sec < 90) return `${Math.round(sec)} s`;
  const m = Math.round(sec / 60);
  if (m < 90) return `${m} m`;
  return `${Math.floor(m / 60)} h ${String(m % 60).padStart(2, '0')} m`;
}

/** Compass bearing from the eye to a point, so a row can say which way to look. */
export function bearingTo(from, to) {
  const a = Math.atan2(to.x - from.x, to.z - from.z);
  const deg = ((a * 180 / Math.PI) + 360) % 360;
  return `${String(Math.round(deg)).padStart(3, '0')}°`;
}

/**
 * Everything the current eye can see, in buckets.
 *
 * Bodies and stations are always listed: they are charted objects and their positions are
 * ephemeris, not a sensor return. Traffic and rock are listed only when the eye can
 * actually resolve them, using the same detection maths the chart plots with — so the
 * telemetry list and the chart never disagree about what is out there.
 *
 * Returns { from, range, tier, groups: [{ key, label, note, rows }] } where each row is
 * { obj, name, kind, dist, tier, line }.
 */
export function feed() {
  const o = scanOrigin();
  const p = o.pos;
  const groups = [];

  // ── celestial bodies ──────────────────────────────────────────────
  const bodies = [];
  const stations = [];
  for (const b of (S.world.bodies || [])) {
    const u = b.userData || {};
    const d = dist(p, b.position);
    const row = { obj: b, name: u.name, kind: u.kind, dist: d, tier: liveTier(b) };
    if (u.kind === 'station') {
      const svc = u.services || {};
      row.line = `${u.typeName || u.category || 'station'} · ${fmtKm(d)}` +
        (S.docked === b ? ' · you are here' : '') +
        (svc.shipyard ? ' · shipyard' : '');
      stations.push(row);
    } else {
      const lvl = surveyLevel(u.name);
      row.line = `${u.typeName || u.kind} · ${fmtKm(d)} · orbit ${fmtKm(u.orbitRadius || 0)}` +
        (lvl >= 1 ? ` · surveyed` : '');
      bodies.push(row);
    }
  }
  bodies.sort((a, b) => a.dist - b.dist);
  stations.sort((a, b) => a.dist - b.dist);

  groups.push({ key: 'bodies', label: 'Celestial bodies', rows: bodies,
    note: 'Charted. Position and period are ephemeris and do not need a sweep.' });
  groups.push({ key: 'stations', label: 'Stations', rows: stations,
    note: 'Charted installations. Services resolve at composition or better.' });

  // ── traffic ───────────────────────────────────────────────────────
  // Same visibility rule the chart draws with: a quiet hull at the edge of the dish is
  // not on this list, and neither is an ambusher that has not committed.
  const traffic = [];
  for (const n of (S.world.npcs || [])) {
    const u = n.userData || {};
    if (u.hp <= 0 || (u.ambush && !u.triggered)) continue;
    const d = dist(p, n.position);
    if (d > detectionRange(o.range, npcSignature(u))) continue;
    const t = liveTier(n);
    traffic.push({
      obj: n, name: u.name, kind: 'ship', dist: d, tier: t, faction: u.faction,
      line: `${u.role || 'ship'} · ${u.faction || 'neutral'} · ${fmtKm(d)}` +
            (t >= 2 ? ` · hull ${Math.round(100 * u.hp / (u.maxHp || 1))}%` : ' · unresolved')
    });
  }
  traffic.sort((a, b) => a.dist - b.dist);
  // The note carries the population, and every number in it is a real ship.
  //
  // This is the honest way to make a thousand-hull system *legible* from a screen that can
  // only list the ones the dish can resolve. The alternative — plotting distant traffic the
  // array cannot see — is the exact failure `ui/navmap.js` was fixed for in v1.02.00: it
  // looks like information and is not. What the pane says instead is how many hulls are
  // under way, how many the simulation is holding in full, and how many are resolved. All
  // three are true, and the gap between the first and the last is the point.
  groups.push({ key: 'traffic', label: 'Traffic in scan range', rows: traffic,
    note: 'Detection is signature-weighted — a laden freighter shows before a quiet raider. ' +
          trafficLine(traffic.length) });

  // ── fields and rock ───────────────────────────────────────────────
  const fields = [];
  for (const c of fieldContacts(p, o.range * 2.2)) {
    fields.push({ obj: c.obj, name: c.name, kind: 'belt', dist: c.d, tier: 0,
      line: `mining field · ${fmtKm(c.d)}` });
  }
  const rock = [];
  for (const a of (S.world.asteroids || [])) {
    const d = dist(p, a.position);
    if (d > Math.min(o.range, ROCK_RANGE)) continue;
    rock.push({ obj: a, name: a.name, kind: 'asteroid', dist: d, tier: liveTier(a),
      line: `${fmtMass(a.ore || 0)} ore · ${fmtKm(d)}` });
  }
  rock.sort((a, b) => a.dist - b.dist);
  groups.push({ key: 'fields', label: 'Fields & rock', rows: fields.concat(rock.slice(0, 12)),
    note: 'Rock is a short return; the fields themselves are charted.' });

  return {
    from: o.from,
    range: o.range,
    groups,
    counts: groups.reduce((m, g) => (m[g.key] = g.rows.length, m), {})
  };
}

/**
 * The full record for one object.
 *
 * Returns { title, sub, tier, rows: [[label, value]], note }. Rows above the sensor gate
 * are omitted rather than blanked — a field showing "—" reads as a broken instrument,
 * where a shorter panel plus the note reads as a limit of the dish.
 */
export function detail(obj, kind, name) {
  if (!obj) return null;
  const u = obj.userData || {};
  const k = kind || u.kind || 'contact';
  const nm = name || u.name || 'contact';
  const o = scanOrigin();
  const d = dist(o.pos, obj.position);
  const live = liveTier(obj);
  const tier = Math.max(live, knownTier(nm));
  const rows = [
    ['Range', fmtKm(d)],
    ['Bearing', bearingTo(o.pos, obj.position)],
    ['Resolution', TIER_NAME[tier]]
  ];
  let note = '';

  if (k === 'planet' || k === 'moon' || k === 'star') {
    rows.push(['Class', u.typeName || k]);
    rows.push(['Radius', fmtKm(u.radius || 0)]);
    if (u.gravity != null) rows.push(['Surface g', `${Number(u.gravity).toFixed(2)} g`]);
    if (u.tempC != null) rows.push(['Mean temp', `${u.tempC} °C`]);
    rows.push(['Atmosphere', u.atmo ? `present · ${(u.atmoDensity || 0).toFixed(2)} opacity` : 'none']);
    rows.push(['Orbit radius', fmtKm(u.orbitRadius || 0)]);
    rows.push(['Orbital period', fmtPeriod(orbitalPeriod(u))]);
    if (u.parent && u.parent.userData) rows.push(['Primary', u.parent.userData.name]);
    const lvl = surveyLevel(nm);
    rows.push(['Survey', lvl >= 2 ? 'probe telemetry archived' : lvl >= 1 ? 'orbital scan on file' : 'none']);
    if (lvl >= 1 && k !== 'star') {
      // planetInfo() returns a record, not rows — the shape is chosen here so the survey
      // system is free to add fields without every readout in the game changing with it.
      const inf = planetInfo(obj);
      if (inf) {
        rows.push(['Minerals', `${inf.minerals} / 99`]);
        rows.push(['Volatiles', `${inf.volatiles} / 99`]);
        rows.push(['Biosignature', `${inf.bio} / 99`]);
        if (inf.anomaly) rows.push(['Anomaly', 'reading does not fit the class']);
        if (inf.features && inf.features.length) rows.push(['Features', String(inf.features.length)]);
      }
    }
    note = lvl >= 1
      ? 'Archived survey. Deeper detail needs a probe in the atmosphere.'
      : 'Orbital elements are chart data. Composition needs a ship on station.';
    return { title: nm, sub: u.typeName || k, tier, rows, note };
  }

  if (k === 'station') {
    const svc = u.services || {};
    rows.push(['Type', u.typeName || 'installation']);
    rows.push(['Category', u.category || '—']);
    rows.push(['Orbit radius', fmtKm(u.orbitRadius || 0)]);
    rows.push(['Orbital period', fmtPeriod(orbitalPeriod(u))]);
    if (tier >= 2) {
      const on = Object.keys(svc).filter(key => svc[key] === true);
      rows.push(['Services', on.length ? on.join(', ') : 'none declared']);
      if (svc.sensorRange) rows.push(['Array reach', fmtKm(svc.sensorRange)]);
      rows.push(['Berths', String(u.slots || 0)]);
    }
    if (S.docked === obj) rows.push(['Status', 'your hull is on this pad']);
    note = tier >= 2
      ? 'Service list is what the pad advertises, not what it has in stock.'
      : 'Too far to read the pad. Services resolve at composition or better.';
    return { title: nm, sub: u.category ? `${u.category} station` : 'station', tier, rows, note };
  }

  if (k === 'ship' || k === 'pilot') {
    if (tier < 1) {
      return { title: nm, sub: 'unresolved contact', tier, rows,
        note: 'A return with no shape to it. Nothing further until the range closes.' };
    }
    rows.push(['Role', u.role || 'unknown']);
    rows.push(['Faction', u.faction || 'neutral']);
    if (tier >= 2) {
      rows.push(['Hull', `${Math.round(100 * (u.hp || 0) / (u.maxHp || 1))}%`]);
      rows.push(['Rated speed', `${Math.round(u.speed || 0)} m/s`]);
      rows.push(['Signature', npcSignature(u).toFixed(2)]);
    }
    if (tier >= 3) {
      if (u.holdCap) rows.push(['Hold', `${fmtMass(u.hold || 0)} / ${fmtMass(u.holdCap)}`]);
      if (u.dmg) rows.push(['Armament', `${u.weaponClass || 'standard'} · ${u.dtype || 'kinetic'}`]);
      if (u.bounty) rows.push(['Bounty', fmtCr(u.bounty)]);
      if (u.target) rows.push(['Engaged', 'yes — currently holding a lock']);
    }
    note = tier >= 3 ? 'Full return. Manifest and armament are current as of this sweep.'
         : tier >= 2 ? 'Partial return. Manifest needs a detailed assay.'
         : 'Bare contact. Close the range for condition and intent.';
    return { title: nm, sub: `${u.faction || 'neutral'} ${u.role || 'ship'}`, tier, rows, note };
  }

  if (k === 'asteroid') {
    rows.push(['Ore remaining', fmtMass(obj.ore || 0)]);
    if (obj.valuePerKg) rows.push(['Assay value', `${obj.valuePerKg.toFixed(2)} cr/kg`]);
    if (tier >= 2) {
      const a = asteroidDetail(obj);
      rows.push(['Iron', `${a.iron}%`]);
      rows.push(['Nickel', `${a.nickel}%`]);
      rows.push(['Platinum', `${a.platinum}%`]);
      rows.push(['Silicates', `${a.silicates}%`]);
      rows.push(['Estimated take', fmtCr(a.est)]);
    }
    note = tier >= 2 ? 'Rock. Value is decided by what the nearest market is short of.'
                     : 'Mass return only. Composition needs a closer look.';
    return { title: nm, sub: 'asteroid', tier, rows, note };
  }

  if (k === 'belt') {
    rows.push(['Field', nm]);
    if (u.beltMid) rows.push(['Mid-orbit', fmtKm(u.beltMid)]);
    note = 'A field is a place, not a body. Objectives bind to it; a hull works it.';
    return { title: nm, sub: 'mining field', tier, rows, note };
  }

  return { title: nm, sub: k, tier, rows, note: '' };
}

/** One-line summary for the deck header: how much is out there right now. */
export function summaryLine() {
  const f = feed();
  const c = f.counts;
  return `${fmtNum(c.bodies || 0)} bodies · ${fmtNum(c.stations || 0)} stations · ` +
         `${fmtNum(c.traffic || 0)} in traffic · watching from ${f.from}`;
}
