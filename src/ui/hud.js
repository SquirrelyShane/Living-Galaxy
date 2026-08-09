// Living Galaxy — HUD. Text and bars refresh at 10 Hz, the contact scan at 4 Hz;
// nothing here runs per-frame except reading numbers that already exist.
//
// The contact list is bucketed rather than one flat top-8 — a belt full of rock
// used to push every station and planet off the panel, which made the list useless
// exactly where you spend most of your time.

import { S, totalMass, cargoMass } from '../core/state.js';
import { SHIP_CLASSES, CLASS_ORDER, UNIT_M, SHIP_PRICE, FLIGHT, DAMAGE } from '../core/config.js';
import { $, el, fmtCr, fmtKm, fmtMass, clamp, forward } from '../core/utils.js';
import { camera } from '../world/scene.js';
import { setTarget, clearTarget } from '../systems/targeting.js';
import { playerSignature, signatureLabel } from '../systems/detection.js';
import { switchClass, buyHull, ownsHull, hullPrice } from '../systems/economy.js';
import { status } from './toast.js';
import { openDock } from './dock.js';
import { net } from '../systems/net.js';
import { startApproach, matchTarget } from '../systems/approach.js';
import { inClaimedSpace } from '../systems/worldsim.js';
import { scanPlanet, probePlanet, surveyLevel, planetInfo, asteroidDetail } from '../systems/survey.js';
import { beginScan, scanReport, scanProgress, liveTier, TIER_NAME } from '../systems/scanner.js';
import { fieldContacts } from '../systems/fields.js';
import { lagrangeContacts, lagrangePoints, investigate, charted, isWorked, pointDistance } from '../systems/lagrange.js';
import { heatFraction } from '../systems/weapons.js';
import { fittedFeeds, magazineReport } from '../systems/magazine.js';
import { HEAT, LAGRANGE } from '../core/config.js';
import { payroll } from '../systems/crew.js';
import { setCourse } from '../systems/warp.js';
import { sfx } from '../systems/audio.js';

const E = {};
const IDS = ['system-name','status-line','credits-val','cargo-val','threat-alert',
  'energy-fill','energy-val','shield-fill','shield-val','armor-fill','armor-val',
  'heat-fill','heat-val','ammo-info',
  'hull-fill','hull-val','warp-fill','warp-val','hull-status','mass-info','expend-info','crew-info',
  'heading-val','pitch-info','spd-info','twr-info','accel-info','drift-info','sig-info','alt-info','ship-info',
  'nearest-list','contact-count','target-panel','target-name','target-kind','target-dist','target-hp','claim-alert',
  'pitch-readout','pitch-num','pitch-tick','speed-value','real-speed','speed-fill',
  'warp-core-visual','warp-core-fill','warp-status-text','warp-overlay','warp-btn',
  'target-approach','target-match','target-scan','target-probe','target-expand','target-detail','engine-glow',
  'dock-prompt','dock-target','station-return','ship-panel','btn-mine','btn-assist','btn-audio',
  'speed-streaks','damage-vignette','velocity-marker','scan-sweep','scan-bar','scan-bar-fill'];


// ── write budget ─────────────────────────────────────────────────────
// The HUD used to write every field of every panel on every rendered frame — around
// seventy DOM writes at 60 Hz, most of them setting a string to the value it already
// held. Setting `textContent` is not free: it invalidates layout for that node whether
// or not the text changed, and on a mid-range phone the HUD was measurably competing
// with the simulation for the frame.
//
// These three helpers diff against a cache and skip the write when nothing moved. The
// counters are not decoration — `LG.hudStats()` reports writes per frame, which is the
// only way to notice a regression here, since a wasteful HUD looks exactly like a
// correct one.
const cache = new Map();
let writes = 0, skipped = 0, frames = 0;

function setText(id, value) {
  const node = E[id];
  if (!node) return;
  const key = id + '\u0000t';
  if (cache.get(key) === value) { skipped++; return; }
  cache.set(key, value);
  node.textContent = value;
  writes++;
}

function setHtml(id, value) {
  const node = E[id];
  if (!node) return;
  const key = id + '\u0000h';
  if (cache.get(key) === value) { skipped++; return; }
  cache.set(key, value);
  node.innerHTML = value;
  writes++;
}

/**
 * Bar widths are quantised to 0.5% before comparison. A shield regenerating at 1.6/s
 * changes the exact percentage every single frame while being visually identical, so
 * an unrounded diff would never skip anything and the cache would be pure overhead.
 */
function setWidth(id, pct) {
  const node = E[id];
  if (!node) return;
  const q = Math.round(pct * 2) / 2;
  const key = id + '\u0000w';
  if (cache.get(key) === q) { skipped++; return; }
  cache.set(key, q);
  node.style.width = q + '%';
  writes++;
}

function setFlag(id, cls, on) {
  const node = E[id];
  if (!node) return;
  const key = id + '\u0000c' + cls;
  const want = !!on;
  if (cache.get(key) === want) { skipped++; return; }
  cache.set(key, want);
  node.classList.toggle(cls, want);
  writes++;
}

/** Forget everything — after a hull swap, a load, or a settings change. */
export function invalidateHud() { cache.clear(); }

export function hudStats() {
  return {
    frames,
    writes,
    skipped,
    perFrame: frames ? +(writes / frames).toFixed(2) : 0,
    hitRate: (writes + skipped) ? +(skipped / (writes + skipped)).toFixed(3) : 0
  };
}

export function resetHudStats() { writes = 0; skipped = 0; frames = 0; }

const MESSAGES = [
  'Orbital traffic normal',
  'Mining drones active in belt sector 7',
  'Trade convoy departing Exchange Nexus',
  'Coalition patrol sweeping the outer giant',
  'Habitat ring construction phase 3',
  'Nexis signature detected — caution advised',
  'Pirate activity near the Vulcan Lagrange point',
  'Belt assay: ore grades holding',
  'Anti-biological AI broadcast intercepted',
  'Solar flare advisory in effect'
];

// Which contact tab maps to which kinds.
const CATS = {
  all:     null,
  ship:    ['ship', 'pilot'],
  station: ['station'],
  body:    ['planet', 'moon', 'star'],
  belt:    ['belt', 'asteroid'],
  deep:    ['lagrange']
};

let slowT = 0, scanT = 0, msgT = 0, msgIdx = 0, threat = false, lockedOn = false, lockAlarmT = 0;
let contacts = [], shown = [], cat = 'all';
let expanded = false, lastLock = null;
const _v = new THREE.Vector3();

export function initHud() {
  IDS.forEach(id => { E[id] = $(id); });

  // Return from "View Outside" back into the station interface. openDock clears
  // viewOutside and re-shows the full dock overlay (including Undock).
  if (E['station-return']) {
    E['station-return'].addEventListener('click', () => {
      if (S.docked) openDock();
    });
  }

  E['nearest-list'].addEventListener('click', e => {
    const row = e.target.closest('.near-item');
    if (!row || row.dataset.i == null) return;
    const c = shown[+row.dataset.i];
    if (!c) return;
    // Toggle lock: re-tapping the same contact unlocks it
    if (S.target && S.target.obj === c.obj) {
      clearTarget();
    } else {
      // setTarget lays the course itself for anything you can fly to, so this no longer
      // needs a special case for belts — and the nav map and this list can no longer
      // disagree about where warp is pointed.
      setTarget(c.obj, c.kind, c.name, c.faction);
    }
  });

  document.querySelectorAll('#contact-tabs .ctab').forEach(b => {
    b.addEventListener('click', () => {
      cat = b.dataset.cat;
      document.querySelectorAll('#contact-tabs .ctab').forEach(x => x.classList.toggle('active', x === b));
      renderContacts();
      sfx.ui();
    });
  });

  document.querySelectorAll('.collapsible h3').forEach(h => {
    h.addEventListener('click', () => h.parentElement.classList.toggle('closed'));
  });

  E['target-approach'].addEventListener('click', () => startApproach());
  E['target-match'].addEventListener('click', () => matchTarget());
  E['target-expand'].addEventListener('click', () => {
    expanded = !expanded;
    setFlag('target-expand', 'open', expanded);
    updateTargetPanel();
  });
  E['target-scan'].addEventListener('click', () => {
    const t = S.target;
    if (!t) return;
    // Planets in orbit still take the deep survey path; everything else sweeps.
    if ((t.kind === 'planet' || t.kind === 'moon') && S.orbit && S.orbit.body === t.obj) scanPlanet(t.obj);
    beginScan(t.obj, t.kind, t.name);
    expanded = true;
    setFlag('target-expand', 'open', true);
    updateTargetPanel();
  });
  E['target-probe'].addEventListener('click', () => {
    const t = S.target;
    if (!t) return;
    // One button, two verbs, chosen by what is under the reticle. A Lagrange point is not a
    // world you probe from orbit — it is a site you go and work — but it is the same act
    // from the pilot's side: put the survey gear on the thing you are looking at and find
    // out what is there. A second button that is hidden 95% of the time would be worse.
    //
    // This is the line that made deep-space anomalies reachable at all. They shipped in
    // v1.00.50 with six types, reward tables, a one-shot rule and a schema migration, and
    // `investigate()` had no caller anywhere outside the test suite. See
    // docs/REACHABILITY_AUDIT.md.
    if (t.kind === 'lagrange') {
      const lp = lagrangePoints().find(x => x.key === (t.obj.userData || {}).lagrangeKey);
      if (lp && investigate(lp)) { expanded = true; setFlag('target-expand', 'open', true); }
      updateTargetPanel();
      return;
    }
    if (probePlanet(t.obj)) { expanded = true; setFlag('target-expand', 'open', true); updateTargetPanel(); }
  });

  updateHud(0, true);
}

// Hull selection lives in the shipyard now — the bottom bar was eating camera space.
export function markShipButtons() { /* retained for callers; the HUD bar is gone */ }

export function setThreat(v, locked) {
  if (v !== threat) {
    threat = v;
    setFlag('threat-alert', 'show', v);
  }
  lockedOn = !!locked;
  if (E['threat-alert']) {
    setText('threat-alert', lockedOn ? '⚠ LOCKED ON — EVASIVE' : '⚠ HOSTILE CONTACTS');
    setFlag('threat-alert', 'locked', lockedOn);
  }
}

export function updateHud(dt, force = false) {
  const p = S.player, st = S.stats;
  frames++;

  // per-frame: only the pieces that would visibly stutter otherwise
  updateThrottleBar();
  updatePitchReadout();
  updateWarpVisuals();
  updateCanopyFx();
  updateScanFx();

  if (lockedOn && S.running && !S.docked) {
    lockAlarmT += dt;
    if (lockAlarmT >= 0.85) { lockAlarmT = 0; sfx.lockAlarm(); }
  } else {
    lockAlarmT = 0.7;
  }

  slowT += dt; scanT += dt; msgT += dt;

  if (force || slowT >= 0.1) {
    slowT = 0;
    bar('energy', p.energy, st.energyCap);
    bar('shield', p.shield, st.shieldMax);
    bar('armor', p.armor, st.armorMax);
    bar('hull', p.hull, st.hullMax);
    // Heat reads as a percentage of the hull's own capacity rather than an absolute,
    // because the number that matters is how close the cutout is, and capacity differs
    // by four-fifths between a civilian hull and a military one.
    const hf = heatFraction();
    setWidth('heat-fill', hf * 100);
    setText('heat-val', Math.round(hf * 100));
    setFlag('heat-fill', 'warning', hf >= HEAT.warn);
    setWidth('warp-fill', S.warp.charge);
    setText('warp-val', Math.round(S.warp.charge));

    const hp = (p.hull / st.hullMax) * 100;
    setText('hull-status', 'Hull integrity: ' +
      (hp <= 0 ? 'breached' : hp < 20 ? 'critical' : hp < 40 ? 'structural stress' :
       hp < 70 ? 'minor damage' : 'nominal'));
    setText('mass-info', `Mass ${fmtMass(totalMass())} · cargo ${fmtMass(cargoMass())}`);
    setText('expend-info', `Draw ${p.expend.toFixed(1)} MW`);
    // Magazines, one line, only for the feeds this fit actually has. A laser boat should
    // not be told about ammunition it will never carry.
    const feeds = fittedFeeds();
    if (!feeds.length) setText('ammo-info', p.overheat ? 'Thermal cutout — weapons offline' : 'Magazines — energy only');
    else {
      const parts = feeds.map(f => {
        const r = magazineReport(f);
        return `${r.chamberedName.split(' ')[0]} ${r.total}`;
      });
      setText('ammo-info', p.overheat ? 'Thermal cutout — weapons offline' : `Mag ${parts.join(' · ')}`);
      setFlag('ammo-info', 'dry', feeds.some(f => magazineReport(f).total === 0));
    }
    setFlag('expend-info', 'warning', p.expend > 25);
    if (E['crew-info']) {
      const n = (S.crew || []).length;
      setText('crew-info', n ? `Crew ${n} · payroll ${payroll()} cr` : 'Crew — none aboard');
    }

    const ms = p.velocity.length() * UNIT_M;
    setText('real-speed', ' · ' + Math.round(ms) + ' m/s');
    setText('spd-info', Math.round(ms) + ' m/s');
    setText('twr-info', p.twr.toFixed(2));
    setText('accel-info', p.accel.toFixed(1) + ' m/s²');
    // How much of your velocity is not going where the nose points. Zero is clean
    // flight; a big number under manual control means the RCS is out of authority
    // and you are, for the moment, a passenger.
    const driftMs = (p.drift || 0) * UNIT_M;
    setText('drift-info', Math.round(driftMs) + ' m/s');
    setFlag('drift-info', 'warn', (p.slip ?? 1) < FLIGHT.slipStall && p.speed > 0.15);
    // How loud you are. This is the number that decides how close you can get to a picket
    // before it wakes up, so it belongs on screen next to the things that change it.
    const sig = playerSignature();
    setText('sig-info', signatureLabel(sig));
    setFlag('sig-info', 'warn', sig > 1.6);
    let h = (-p.yaw * 180 / Math.PI) % 360; if (h < 0) h += 360;
    setText('heading-val', h.toFixed(0).padStart(3, '0') + '°');
    setText('pitch-info', (p.pitch * 180 / Math.PI).toFixed(1) + '°');
    setText('alt-info', fmtKm(p.position.length()));
    setText('ship-info', st.name);

    setText('credits-val', fmtCr(S.credits));

    // FIRE button reflects the whole rack, not one gun
    const fb = $('btn-fire');
    if (fb) {
      const mounts = (st.mounts && st.mounts.length) ? st.mounts : [];
      const allMissile = mounts.length && mounts.every(w => w.kind === 'missile');
      const label = mounts.length > 1 ? `FIRE ×${mounts.length}` : allMissile ? 'MISSILE' : 'FIRE';
      fb.innerHTML = (allMissile ? '🚀' : '✦') + `<span>${label}</span>`;
    }
    setText('cargo-val', `${Math.round(cargoMass())} / ${Math.round(st.cargoCap)} kg` +
      (net.connected ? ` · ${net.remotes.size + 1} pilots` : ''));

    updateTargetPanel();
    updateDockPrompt();
    setFlag('claim-alert', 'show', inClaimedSpace(S.player.position));
  }

  if (force || scanT >= 0.25) { scanT = 0; scanContacts(); renderContacts(); }

  if (msgT >= 12) {
    msgT = 0;
    if (S.warp.state === 'idle' && !S.docked) {
      msgIdx = (msgIdx + 1) % MESSAGES.length;
      status(MESSAGES[msgIdx]);
    }
  }
}

function bar(name, val, max) {
  const pct = clamp((val / max) * 100, 0, 100);
  setWidth(name + '-fill', pct);
  setText(name + '-val', Math.round(pct));
}

function updateThrottleBar() {
  const t = S.player.throttle;
  setText('speed-value', Math.round(t * 100) + '%');
  setWidth('speed-fill', clamp(((t + 0.25) / 1.25) * 100, 0, 100));
  setFlag('speed-fill', 'reverse', t < 0);

  const glow = E['engine-glow'];
  if (glow) {
    const on = S.warp.state !== 'warping' && !S.docked;
    glow.style.opacity = on ? Math.min(0.95, Math.abs(t) * 0.85) : 0;
    glow.classList.toggle('reverse', t < 0);
  }
}

/** The pitch slider is gone — the number lives beside the crosshair instead. */
function updatePitchReadout() {
  const deg = S.player.pitch * 180 / Math.PI;
  const node = E['pitch-readout'];
  if (!node) return;
  setText('pitch-num', (deg >= 0 ? '+' : '') + deg.toFixed(1) + '°');
  setText('pitch-tick', Math.abs(deg) < 1 ? 'LVL' : deg > 0 ? 'UP' : 'DN');
  node.classList.toggle('steep', Math.abs(deg) > 45);
}

/** Speed streaks, damage vignette and the flight-path marker. */
function updateCanopyFx() {
  const p = S.player, st = S.stats;
  const streak = E['speed-streaks'];
  if (streak) {
    const frac = st.maxSpeed ? p.velocity.length() / st.maxSpeed : 0;
    const warping = S.warp.state === 'warping';
    streak.style.opacity = warping ? 0.9 : clamp((frac - 0.35) * 1.5, 0, 0.62).toFixed(3);
  }
  const dmg = E['damage-vignette'];
  if (dmg) {
    const hp = st.hullMax ? p.hull / st.hullMax : 1;
    dmg.style.opacity = hp > 0.6 ? 0 : clamp((0.6 - hp) * 1.9, 0, 0.85).toFixed(3);
    dmg.classList.toggle('critical', hp < 0.22);
  }

  // Flight-path marker: project the velocity direction onto the canopy.
  const vm = E['velocity-marker'];
  if (!vm) return;
  const speed = p.velocity.length();
  if (speed < 0.02 || S.docked || S.warp.state === 'warping' || !camera) {
    vm.classList.add('hidden');
    return;
  }
  _v.copy(p.position).addScaledVector(p.velocity, 400 / speed).project(camera);
  if (_v.z > 1 || Math.abs(_v.x) > 0.98 || Math.abs(_v.y) > 0.98) { vm.classList.add('hidden'); return; }
  vm.classList.remove('hidden');
  vm.style.left = ((_v.x * 0.5 + 0.5) * innerWidth) + 'px';
  vm.style.top = ((-_v.y * 0.5 + 0.5) * innerHeight) + 'px';
  const nose = forward(p.yaw, p.pitch, new THREE.Vector3());
  vm.classList.toggle('reverse', nose.dot(p.velocity) < 0);
}

function updateScanFx() {
  const active = !!(S.scan && S.scan.active);
  if (E['scan-sweep']) setFlag('scan-sweep', 'active', active);
  if (E['scan-bar']) {
    setFlag('scan-bar', 'show', active);
    if (active) setWidth('scan-bar-fill', scanProgress() * 100);
  }
}

function updateWarpVisuals() {
  const w = S.warp;
  const ov = E['warp-overlay'], btn = E['warp-btn'], vis = E['warp-core-visual'], txt = E['warp-status-text'];
  ov.className = w.state === 'spooling' ? 'active spooling' : w.state === 'warping' ? 'active warping' : '';
  btn.classList.toggle('spooling', w.state === 'spooling');
  btn.classList.toggle('warping', w.state === 'warping');
  const show = w.state !== 'idle';
  vis.classList.toggle('show', show);
  txt.classList.toggle('show', show);
  if (show) {
    setWidth('warp-core-fill', w.charge);
    txt.textContent = w.state === 'spooling' ? 'SPOOLING WARP CORE…'
      : w.state === 'warping' ? (w.dest ? 'WARP — ' + w.dest.name.toUpperCase() : 'WARP ACTIVE — TAP TO EXIT')
      : 'CORE COOLING…';
  }
}

function updateTargetPanel() {
  const t = S.target, panel = E['target-panel'];
  if (!t) { panel.classList.add('hidden'); lastLock = null; return; }
  panel.classList.remove('hidden');
  if (t.obj !== lastLock) {
    lastLock = t.obj;
    expanded = false;
    setFlag('target-expand', 'open', false);
  }
  setText('target-name', t.name);
  setText('target-dist', fmtKm(S.player.position.distanceTo(t.obj.position)));
  if (t.kind === 'ship') {
    const u = t.obj.userData;
    setText('target-kind', u.faction === 'hostile' ? 'Hostile' : 'Coalition');
    setWidth('target-hp', clamp((u.hp / u.maxHp) * 100, 0, 100));
  } else if (t.kind === 'asteroid') {
    setText('target-kind', `Ore ${Math.round(t.obj.ore)} kg`);
    setWidth('target-hp', clamp((t.obj.ore / t.obj.oreMax) * 100, 0, 100));
  } else if (t.kind === 'belt') {
    setText('target-kind', 'mining field');
    setWidth('target-hp', 100);
  } else {
    setText('target-kind', (t.obj.userData && t.obj.userData.category) || t.kind);
    setWidth('target-hp', 100);
  }

  const planetish = t.kind === 'planet' || t.kind === 'moon';
  const orbitingIt = !!(S.orbit && S.orbit.body === t.obj);
  setFlag('target-scan', 'hidden', liveTier(t.obj) <= 0);

  if (t.kind === 'lagrange') {
    // Offered only when the site is resolved, unworked, and close enough to work — the same
    // three gates `investigate()` enforces, shown rather than discovered by being refused.
    const lp = lagrangePoints().find(x => x.key === (t.obj.userData || {}).lagrangeKey);
    const ready = !!lp && charted(lp) && !isWorked(lp.key) &&
                  pointDistance(lp, S.player.position) <= LAGRANGE.workRange;
    setFlag('target-probe', 'hidden', !ready);
    setText('target-probe', 'WORK SITE');
  } else {
    setFlag('target-probe', 'hidden', !(planetish && orbitingIt));
    setText('target-probe', 'PROBE ·' + S.probes);
  }

  setFlag('target-detail', 'hidden', !expanded);
  if (expanded) setHtml('target-detail', detailHtml(t));
}

/** Detail is now gated by scan resolution — range decides what you're allowed to know. */
function detailHtml(t) {
  const rep = scanReport(t.obj, t.kind, t.name);
  const row = (k, v) => `<div class="row"><span>${k}</span><span class="val">${v}</span></div>`;
  let h = rep.rows.map(r => row(r[0], r[1])).join('');
  // Which of your guns this hull is soft to. Without this the damage-type system is
  // arithmetic happening off-screen: the pilot has to be able to see that the drone in
  // front of them is a shield boat before choosing what to shoot it with.
  if (t.kind === 'ship' && t.obj.userData) {
    const layer = t.obj.userData.armorProfile || 'shield';
    const best = DAMAGE.types.reduce((a, b) =>
      (DAMAGE.resist[b][layer] > DAMAGE.resist[a][layer] ? b : a));
    const worst = DAMAGE.types.reduce((a, b) =>
      (DAMAGE.resist[b][layer] < DAMAGE.resist[a][layer] ? b : a));
    h += row('Defence', layer === 'shield' ? 'shielded' : layer === 'armor' ? 'plated' : 'bare hull');
    h += row('Soft to', best.toUpperCase());
    h += row('Resists', worst.toUpperCase());
  }
  if (t.kind === 'planet' || t.kind === 'moon') {
    const lvl = surveyLevel(t.name);
    if (lvl >= 2) h += row('Survey', 'probe telemetry archived');
  }
  h += `<div class="note">${rep.note}</div>`;
  return h;
}

function updateDockPrompt() {
  const el2 = E['dock-prompt'];
  if (S.dockCandidate && !S.docked) {
    setText('dock-target', S.dockCandidate.userData.name);
    el2.classList.remove('hidden');
  } else {
    el2.classList.add('hidden');
  }
  // While docked and viewing the exterior, surface a clear return path so the pilot
  // can never be stranded without the station interface (and therefore without Undock).
  const ret = E['station-return'];
  if (ret) {
    if (S.docked && S.viewOutside) ret.classList.remove('hidden');
    else ret.classList.add('hidden');
  }
  setFlag('btn-mine', 'disabled', !!S.docked);
}

function scanContacts() {
  const p = S.player.position;
  const range = S.stats.sensor;
  const r2 = range * range;
  contacts = [];

  for (const n of S.world.npcs) {
    const u = n.userData;
    if (u.hp <= 0 || (u.ambush && !u.triggered)) continue;   // lurkers stay dark
    const d2 = n.position.distanceToSquared(p);
    if (d2 < r2) contacts.push({ obj: n, kind: 'ship', name: u.name,
      faction: u.faction, d: Math.sqrt(d2) });
  }
  for (const b of S.world.bodies) {
    const d2 = b.position.distanceToSquared(p);
    if (d2 < r2) contacts.push({ obj: b, kind: b.userData.kind, name: b.userData.name,
      faction: 'neutral', d: Math.sqrt(d2) });
  }
  for (const r of net.remotes.values()) {
    const d2 = r.group.position.distanceToSquared(p);
    if (d2 < r2) contacts.push({ obj: r.group, kind: 'pilot', name: '◈ ' + r.name,
      faction: 'friendly', d: Math.sqrt(d2) });
  }
  const rockR2 = Math.min(r2, 900 * 900);
  for (const a of S.world.asteroids) {
    const d2 = a.position.distanceToSquared(p);
    if (d2 < rockR2) contacts.push({ obj: a, kind: 'asteroid', name: a.name,
      faction: 'rock', d: Math.sqrt(d2), ore: a.ore });
  }

  // Named fields as whole-field contacts so they appear in the list and can be locked or
  // warped to. The geometry lives in systems/fields.js — a ring is centred on its planet
  // and a belt on the star, and this file no longer needs to know which.
  for (const c of fieldContacts(p, range * 2.2)) {
    contacts.push({ obj: c.obj, kind: 'belt', name: c.name,
      faction: 'neutral', d: c.d, beltMid: c.obj.userData.beltMid });
  }

  // Lagrange points are places, not bodies — derived, mesh-free, and always on the charts
  // whether or not anything is on station. See systems/lagrange.js.
  for (const c of lagrangeContacts(p, range * 2.2)) {
    contacts.push({ obj: c.obj, kind: 'lagrange', name: c.name, faction: 'neutral', d: c.d });
  }

  contacts.sort((a, b) => a.d - b.d);
}

function renderContacts() {
  const want = CATS[cat];
  const pool = want ? contacts.filter(c => want.includes(c.kind)) : contacts;

  // On the "all" tab, cap each bucket so a dense belt can't bury the stations.
  let list;
  if (!want) {
    const caps = { asteroid: 2, ship: 3, station: 2, planet: 2, moon: 1, star: 1, belt: 1, pilot: 2, lagrange: 2 };
    const seen = {};
    list = pool.filter(c => {
      const k = c.kind;
      seen[k] = (seen[k] || 0) + 1;
      return seen[k] <= (caps[k] ?? 2);
    }).slice(0, 8);
  } else {
    list = pool.slice(0, 10);
  }
  shown = list;

  if (E['contact-count']) setText('contact-count', String(pool.length));

  if (!list.length) {
    setHtml('nearest-list', `<div class="near-item empty">${
      cat === 'all' ? 'No contacts in range' : 'None of this type in range'}</div>`);
    return;
  }
  const locked = S.target && S.target.obj;
  setHtml('nearest-list', list.map((c, i) => {
    const cls = c.faction === 'hostile' ? 'hostile' : c.faction === 'friendly' ? 'friendly'
      : (c.kind === 'asteroid' || c.kind === 'belt') ? 'rock' : '';
    const lock = c.obj === locked ? ' locked' : '';
    return `<div class="near-item ${cls}${lock}" data-i="${i}">` +
      `<span class="nm">${c.name}</span><span class="dist">${fmtKm(c.d)}</span></div>`;
  }).join(''));
}

/** Exposed for the nav map and tests. */
export const contactList = () => contacts;
export const contactCategory = () => cat;
