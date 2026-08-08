// Living Galaxy — the fitting bay. Replaces the old long-press weapon wheel with a
// real hardpoint screen: tap a slot, pick what goes in it, see what it costs you.
//
// Fitting is allowed anywhere (it's your ship), but *buying* still needs a station —
// that's the line the shipyard tab enforces.

import { S } from '../core/state.js';
import { HULL_SLOTS, SHIP_CLASSES } from '../core/config.js';
import { MODULES, MODULE_KEYS } from '../data/modules.js';
import { WEAPON_MODULES, WEAPON_KEYS } from '../data/weapons.js';
import { slotsFor, describeMods, fitBonuses, mountScale } from '../systems/fitting.js';
import { ownsWeapon, ownsModule, buyModule, buyWeapon, sellModule, fitSlot } from '../systems/economy.js';
import { $, el, fmtCr, fmtMass } from '../core/utils.js';
import { toast } from './toast.js';
import { magazineReport, chamber, fittedFeeds, roundsHeld } from '../systems/magazine.js';
import { FEEDS, roundsFor, dtypeOf, isAP, yieldOf } from '../systems/ordnance.js';
import { groupOf, cycleGroup, activeGroup, cycleActive, activeLabel, hasSplit, populatedGroups, ALL } from '../systems/groups.js';
import { ammoForSale, ammoStackPrice, buyAmmo } from '../systems/economy.js';
import { AMMUNITION } from '../data/crafting/ammo.js';
import { sfx } from '../systems/audio.js';
import { refreshGroupChip } from './controls.js';

let overlay, body, summary, tabs, tab = 'slots';
let picking = null;   // { kind, index } while a slot is awaiting a choice

export function initFit() {
  overlay = $('fit-overlay');
  body = $('fit-body');
  summary = $('fit-summary');
  tabs = Array.from(document.querySelectorAll('#fit-tabs .tab'));

  tabs.forEach(t => t.addEventListener('click', () => {
    tab = t.dataset.fittab;
    picking = null;
    tabs.forEach(x => x.classList.toggle('active', x === t));
    render();
    sfx.ui();
  }));
  $('fit-close').addEventListener('click', closeFit);
  $('fit-done').addEventListener('click', closeFit);
}

export function openFit() {
  if (!overlay) return;
  picking = null;
  overlay.classList.remove('hidden');
  render();
  sfx.ui();
}

export function closeFit() {
  if (overlay) overlay.classList.add('hidden');
}

export const fitOpen = () => overlay && !overlay.classList.contains('hidden');

function render() {
  if (!body) return;
  body.innerHTML = '';
  const st = S.stats, slots = slotsFor(S.player.classKey);
  const used = k => (S.fit[k] || []).filter(Boolean).length;
  summary.innerHTML =
    `<b>${st.name} hull</b> · mounts ${used('weapon')}/${slots.weapon} · ` +
    `utility ${used('utility')}/${slots.utility} · core ${used('core')}/${slots.core}<br>` +
    budgetLine(st) +
    `hold ${fmtMass(st.cargoCap)} · ` +
    `balance ${fmtCr(S.credits)}`;

  if (picking) return renderPicker();
  if (tab === 'slots') return renderSlots();
  if (tab === 'mag') return renderMagazine();
  if (tab === 'locker') return renderLocker();
  renderStats();
}

// ── hardpoints ───────────────────────────────────────────────────────
function renderSlots() {
  group('Weapon mounts', 'weapon');
  group('Utility hardpoints', 'utility');
  group('Core subsystems', 'core');
  const groups = populatedGroups();
  body.appendChild(el('div', 'dock-note',
    'Tap a hardpoint to change it, or its GRP tag to move it between triggers. ' +
    (groups.length > 1
      ? 'Barrel falloff is counted inside whichever group fires, so a split rack trades ' +
        'alpha for yield per shot.'
      : 'Everything is on one trigger; move a mount to group II to fire it separately.')));
}

function group(title, kind) {
  const wrap = el('div', 'slot-group');
  wrap.appendChild(el('div', 'sg-head', title));
  const arr = S.fit[kind] || [];
  if (!arr.length) {
    wrap.appendChild(el('div', 'dock-note', 'This hull has no hardpoints of that kind.'));
    body.appendChild(wrap);
    return;
  }
  arr.forEach((key, i) => {
    const def = kind === 'weapon' ? WEAPON_MODULES[key] : MODULES[key];
    const btn = el('button', 'slot ' + kind + (def ? ' filled' : ' empty'));
    const left = el('div');
    left.innerHTML = `<div class="s-idx">${kind.toUpperCase()} ${i + 1}</div>` +
      `<div class="s-name">${def ? def.name : '— empty —'}</div>` +
      `<div class="s-meta">${def ? metaFor(kind, def, i) : 'tap to fit'}</div>`;
    btn.appendChild(left);
    const right = el('div', 'slot-right');

    // Group assignment is a separate control beside the slot rather than a mode on it.
    // Tapping a hardpoint means "change what is in it" everywhere else in this screen, and
    // overloading that tap to sometimes mean "change which trigger it answers" would make
    // the most common action ambiguous.
    if (kind === 'weapon' && def) {
      const g = el('button', 'mini-btn grp-tag', `GRP ${groupOf(i) === 2 ? 'II' : 'I'}`);
      g.addEventListener('click', ev => {
        if (ev && ev.stopPropagation) ev.stopPropagation();
        cycleGroup(i);
        refreshGroupChip();
        render();
        sfx.ui();
      });
      right.appendChild(g);
    }
    right.appendChild(el('span', 's-idx', '▸'));
    btn.appendChild(right);
    btn.addEventListener('click', () => { picking = { kind, index: i }; render(); sfx.ui(); });
    wrap.appendChild(btn);
  });
  body.appendChild(wrap);
}

function metaFor(kind, def, i) {
  if (kind === 'weapon') {
    const eff = Math.round(def.damage * S.stats.weaponMult * mountScale(i));
    return `${def.kind} · ${eff} dmg · ${(1 / def.cooldown).toFixed(1)}/s · ${def.energy} MW/shot`;
  }
  return describeMods(def.mods).join(' · ') + (def.power ? ` · ${def.power} MW` : '');
}


// ── magazines ────────────────────────────────────────────────────────
// The panel v1.00.60 shipped without. Auto-chamber was doing all the work, which meant the
// tactical choice that slice was built around was not reachable by a player at all.
function renderMagazine() {
  const feeds = fittedFeeds();
  if (!feeds.length) {
    body.appendChild(el('div', 'dock-note',
      'This fit carries no feeds — energy weapons draw from the bank and never run dry. ' +
      'Mount a projectile or missile weapon to load rounds.'));
    return;
  }

  for (const f of feeds) {
    const rep = magazineReport(f);
    const wrap = el('div', 'slot-group');
    wrap.appendChild(el('div', 'sg-head', `${rep.name} — ${rep.total} rounds aboard`));

    for (const r of rep.rounds) {
      const a = AMMUNITION[r.id];
      const row = el('button', 'pickrow mag-row' + (rep.chambered === r.id ? ' chambered owned' : ''));
      const tags = [dtypeOf(a), isAP(a) ? 'AP' : null, `T${a.tier}`,
                    `×${yieldOf(a).toFixed(2)} yield`].filter(Boolean).join(' · ');
      row.innerHTML =
        `<div><div class="p-name">${a.name}</div><div class="p-meta">${tags}</div></div>` +
        `<div class="p-price">${r.held ? r.held : '—'}</div>`;
      row.addEventListener('click', () => {
        if (!r.held) { toast(`No ${a.name} aboard`); sfx.deny(); return; }
        chamber(f, r.id);
        render();
        sfx.ui();
      });
      wrap.appendChild(row);
    }
    body.appendChild(wrap);
  }

  // Buying is a station action, same line the shipyard tab draws.
  if (!S.docked) {
    body.appendChild(el('div', 'dock-note',
      'Dock at a station to buy rounds, or queue them in the manufacturing bay.'));
    return;
  }
  const stocked = ammoForSale(S.docked).filter(id =>
    feeds.some(f => roundsFor(f).some(a => a.id === id)));
  if (!stocked.length) {
    body.appendChild(el('div', 'dock-note', 'This station stocks nothing your feeds can chamber.'));
    return;
  }
  const shop = el('div', 'slot-group');
  shop.appendChild(el('div', 'sg-head', 'Resupply'));
  for (const id of stocked) {
    const a = AMMUNITION[id];
    const price = ammoStackPrice(id);
    const row = el('button', 'pickrow' + (S.credits >= price ? ' owned' : ''));
    row.innerHTML =
      `<div><div class="p-name">${a.name} ×${a.stack_size}</div>` +
      `<div class="p-meta">${dtypeOf(a)}${isAP(a) ? ' · AP' : ''} · T${a.tier}</div></div>` +
      `<div class="p-price">${fmtCr(price)}</div>`;
    row.addEventListener('click', () => { if (buyAmmo(id)) render(); });
    shop.appendChild(row);
  }
  body.appendChild(shop);
  body.appendChild(el('div', 'dock-note',
    'Stations stock to tier 2. Anything heavier is a manufacturing job, not a shopping trip.'));
}

// ── slot picker ──────────────────────────────────────────────────────
function renderPicker() {
  const { kind, index } = picking;
  body.appendChild(el('div', 'dock-note',
    `Fitting ${kind.toUpperCase()} ${index + 1} — only kit you already own can be seated.`));

  const clear = el('button', 'pickrow');
  clear.innerHTML = '<div><div class="p-name">— leave empty —</div>' +
    '<div class="p-meta">frees the hardpoint</div></div>';
  clear.addEventListener('click', () => { fitSlot(kind, index, null); picking = null; render(); });
  body.appendChild(clear);

  const keys = kind === 'weapon' ? WEAPON_KEYS : MODULE_KEYS.filter(k => MODULES[k].slot === kind);
  let any = false;
  for (const key of keys) {
    const def = kind === 'weapon' ? WEAPON_MODULES[key] : MODULES[key];
    if (kind === 'weapon' && def.kind === 'utility') continue;
    const owned = kind === 'weapon' ? ownsWeapon(key) : ownsModule(key);
    if (!owned) continue;
    any = true;
    const seated = (S.fit[kind] || []).indexOf(key);
    const r = el('button', 'pickrow owned');
    r.innerHTML = `<div><div class="p-name">${def.name}</div>` +
      `<div class="p-meta">${kind === 'weapon' ? metaFor('weapon', def, index) : describeMods(def.mods).join(' · ')}</div></div>` +
      `<div class="p-price">${seated >= 0 && seated !== index ? 'move' : 'fit'}</div>`;
    r.addEventListener('click', () => { fitSlot(kind, index, key); picking = null; render(); });
    body.appendChild(r);
  }
  if (!any) body.appendChild(el('div', 'dock-note',
    'Nothing owned for this hardpoint yet — buy from a station shipyard.'));

  const back = el('button', 'buy-btn', 'Back');
  back.addEventListener('click', () => { picking = null; render(); });
  body.appendChild(back);
}

// ── locker / shop ────────────────────────────────────────────────────
function renderLocker() {
  const docked = !!S.docked;
  body.appendChild(el('div', 'dock-note', docked
    ? 'Docked — purchases available.'
    : 'Not docked. You can inspect the catalogue, but buying needs a station.'));

  section('Weapons', WEAPON_KEYS.filter(k => WEAPON_MODULES[k].kind !== 'utility'),
    k => WEAPON_MODULES[k], ownsWeapon,
    (k, d) => `${d.kind} · ${d.damage} dmg · ${(1 / d.cooldown).toFixed(1)}/s · ${d.desc}`,
    k => { buyWeapon(k); render(); }, null, docked);

  section('Utility modules', MODULE_KEYS.filter(k => MODULES[k].slot === 'utility'),
    k => MODULES[k], ownsModule,
    (k, d) => describeMods(d.mods).join(' · ') + (d.power ? ` · ${d.power} MW` : ''),
    k => { buyModule(k); render(); }, k => { sellModule(k); render(); }, docked);

  section('Core subsystems', MODULE_KEYS.filter(k => MODULES[k].slot === 'core'),
    k => MODULES[k], ownsModule,
    (k, d) => describeMods(d.mods).join(' · ') + (d.power ? ` · ${d.power} MW` : ''),
    k => { buyModule(k); render(); }, k => { sellModule(k); render(); }, docked);
}

function section(title, keys, defOf, ownedOf, metaOf, onBuy, onSell, docked) {
  body.appendChild(el('div', 'sg-head', title));
  for (const key of keys) {
    const d = defOf(key);
    const owned = ownedOf(key);
    const r = el('button', 'pickrow' + (owned ? ' owned' : ''));
    r.innerHTML = `<div><div class="p-name">${d.name}</div>` +
      `<div class="p-meta">${metaOf(key, d)}</div></div>` +
      `<div class="p-price">${owned ? (onSell ? 'sell ' + fmtCr(Math.round(d.price * 0.5)) : 'owned') : fmtCr(d.price)}</div>`;
    r.addEventListener('click', () => {
      if (owned) {
        if (onSell && docked) onSell(key);
        else toast(d.name + ' is already in the locker');
      } else if (!docked) {
        toast('Dock at a station to buy'); sfx.deny();
      } else onBuy(key);
    });
    body.appendChild(r);
  }
}

// ── readout ──────────────────────────────────────────────────────────
function renderStats() {
  const st = S.stats, base = SHIP_CLASSES[S.player.classKey];
  const g = el('div', 'statgrid');
  const line = (k, v, cmp) => {
    g.appendChild(el('div', 'k', k));
    let cls = 'v';
    if (cmp !== undefined) cls += cmp > 0.001 ? ' delta-up' : cmp < -0.001 ? ' delta-dn' : '';
    g.appendChild(el('div', cls, v));
  };
  line('Max thrust', (st.maxThrust / 1e6).toFixed(2) + ' MN', st.maxThrust - base.maxThrust);
  line('Top speed', (st.maxSpeed * 1000).toFixed(0) + ' m/s', st.maxSpeed - base.maxSpeed);
  line('Handling', st.turnRate.toFixed(2) + ' rad/s', st.turnRate - base.turnRate);
  line('Cargo', fmtMass(st.cargoCap), st.cargoCap - base.cargoCap);
  line('Shield', Math.round(st.shieldMax) + ' (+' + st.shieldRegen.toFixed(1) + '/s)', st.shieldMax - base.shieldMax);
  line('Armor', Math.round(st.armorMax), st.armorMax - base.armorMax);
  line('Hull', Math.round(st.hullMax), st.hullMax - base.hullMax);
  line('Energy', Math.round(st.energyCap) + ' (+' + st.energyRegen.toFixed(1) + '/s)', st.energyCap - base.energyCap);
  line('Sensors', Math.round(st.sensor) + ' km', st.sensor - base.sensor);
  line('Scan bonus', '+' + (st.scanTier || 0) + ' tier', st.scanTier || 0);
  line('Warp cruise', Math.round(st.warpSpeed) + ' u/s', st.warpSpeed - base.warpSpeed);
  line('Weapon mult', st.weaponMult.toFixed(2) + '×', st.weaponMult - base.weaponMult);
  line('Mining mult', st.miningMult.toFixed(2) + '×', st.miningMult - base.miningMult);
  line('Interception', Math.round((st.pointDef || 0) * 100) + '%', st.pointDef || 0);
  line('Nanite repair', st.naniteArmor.toFixed(1) + ' / ' + st.naniteHull.toFixed(1) + ' /s', st.naniteArmor);
  line('Module draw', (st.fitPower || 0).toFixed(1) + ' MW', -(st.fitPower || 0));
  const bd = st.budget || {};
  line('Power budget', `${(bd.power || 0).toFixed(1)} / ${(bd.powerCap || 0).toFixed(1)} MW`,
       bd.powerPenalty ? -1 : 0);
  line('CPU budget', `${(bd.cpu || 0).toFixed(1)} / ${(bd.cpuCap || 0).toFixed(1)} tf`,
       bd.cpuPenalty ? -1 : 0);
  if (bd.powerPenalty) line('Power overload', `−${Math.round(bd.powerPenalty * 100)}% shields & recharge`, -1);
  if (bd.cpuPenalty) line('CPU overload', `−${Math.round(bd.cpuPenalty * 100)}% sensors & tracking`, -1);
  body.appendChild(g);

  const mods = fitBonuses(S.fit);
  const lines = describeMods(mods);
  body.appendChild(el('div', 'dock-note',
    lines.length ? 'Fitted contribution: ' + lines.join(' · ') : 'Nothing fitted beyond the bare hull.'));
}


/**
 * The two budgets, inline at the top of the fitting screen. Shown as a fraction rather
 * than a bar because the number people need is "how much headroom is left", and a bar
 * that is 96% full and a bar that is 104% full look almost identical at phone size —
 * which is exactly the distinction that matters here.
 */
function budgetLine(st) {
  const b = st.budget || {};
  const cls = v => v > 1.05 ? 'over' : v > 0.9 ? 'tight' : '';
  return `power <b class="${cls(b.powerRatio || 0)}">${(b.power || 0).toFixed(1)}/${(b.powerCap || 0).toFixed(0)}</b> · ` +
         `cpu <b class="${cls(b.cpuRatio || 0)}">${(b.cpu || 0).toFixed(1)}/${(b.cpuCap || 0).toFixed(0)}</b> · `;
}
