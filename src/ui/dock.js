// Living Galaxy — station interface. Rebuilt from state each time a tab is opened.

import { S, cargoMass, recalcStats } from '../core/state.js';
import { COMMODITIES, UPGRADES, UPGRADE_ORDER, REPAIR_COST, PROBE, SHIP_CLASSES, CLASS_ORDER } from '../core/config.js';
import { WEAPON_MODULES, WEAPON_KEYS } from '../data/weapons.js';
import { STATION_MODULES } from '../data/stations.js';
import { MODULES, MODULE_KEYS } from '../data/modules.js';
import { describeMods } from '../systems/fitting.js';
import { CREW_ROLES, CREW_TRAITS, crewOutput, wageOf } from '../data/crew.js';
import { berths, payroll, recruitPool, hire, hireCost, medicalQuote, treatCrew } from '../systems/crew.js';
import { openFit } from './fitting.js';
import { serviceAll, serviceQuote } from '../systems/wear.js';
import { openCrew } from './crew.js';
import { $, el, fmtCr, fmtMass } from '../core/utils.js';
import { priceFor, sell, sellAll, repair, repairQuote, upgradeCost, buyUpgrade, undock, buyProbe, buyHull, ownsHull, hullPrice, upgradeLocked, upgradeReqText, buyWeapon, ownsWeapon, buyModule, ownsModule, sellModule } from '../systems/economy.js';
import { saveGame } from '../systems/save.js';
import { postPlayerJob, suggestedFee, openDeals, PLAYER } from '../systems/deals.js';
import { CHAR } from '../core/config.js';
import { SKILLS } from '../data/origins.js';
import { characterSheet, spendPoint, hasLicence, licenceReq, licencePrice,
         licenceBlocker, buyLicence } from '../systems/character.js';
import { currentMission } from '../systems/missions.js';
import { boardFor, activeContracts, acceptContract, acceptBlocker, abandonContract,
         contractProgress, timeLeft, issuerOf } from '../systems/contracts.js';
import { CONTRACTS } from '../core/config.js';

let overlay, body, tabs, nameEl, tab = 'trade';

export function initDock() {
  overlay = $('dock-overlay');
  body = $('dock-body');
  nameEl = $('dock-name');
  tabs = Array.from(document.querySelectorAll('#dock-tabs .tab'));

  tabs.forEach(t => t.addEventListener('click', () => {
    tab = t.dataset.tab;
    tabs.forEach(x => x.classList.toggle('active', x === t));
    render();
  }));
  $('dock-close').addEventListener('click', closeDock);
  $('dock-undock').addEventListener('click', () => { undock(); closeDock(); });
}

export function openDock() {
  if (!S.docked) return;
  nameEl.textContent = S.docked.userData.name;
  overlay.classList.remove('hidden');
  render();
  saveGame(true);
}

export function closeDock() {
  overlay.classList.add('hidden');
}

export const dockOpen = () => overlay && !overlay.classList.contains('hidden');

function render() {
  body.innerHTML = '';
  if (tab === 'trade') renderTrade();
  else if (tab === 'service') renderService();
  else if (tab === 'hulls') renderHulls();
  else if (tab === 'modules') renderModules();
  else if (tab === 'board') renderBoard();
  else if (tab === 'pilot') renderPilot();
  else if (tab === 'crew') renderCrewTab();
  else if (tab === 'station') renderStation();
  else renderRefit();
}

function row(title, meta, btnLabel, enabled, onClick, priceText) {
  const r = el('div', 'trade-row');
  r.appendChild(el('div', '', `<div class="nm">${title}</div><div class="meta">${meta}</div>`));
  const right = el('div', '', priceText ? `<div class="price">${priceText}</div>` : '');
  right.style.textAlign = 'right';
  const b = el('button', 'buy-btn', btnLabel);
  b.disabled = !enabled;
  b.addEventListener('click', () => { onClick(); render(); });
  right.appendChild(b);
  r.appendChild(right);
  body.appendChild(r);
}

function renderTrade() {
  const st = S.docked;
  body.appendChild(el('div', 'dock-note',
    `${st.userData.category} hub · hold ${fmtMass(cargoMass())} of ${fmtMass(S.stats.cargoCap)} · balance ${fmtCr(S.credits)}`));

  for (const key in COMMODITIES) {
    const kg = Math.round(S.cargo[key]);
    const unit = priceFor(st, key);
    row(COMMODITIES[key].name,
      `${kg} kg aboard · ${unit} cr/kg here`,
      'Sell', kg > 0, () => sell(key),
      kg > 0 ? fmtCr(kg * unit) : '—');
  }
  const total = Object.keys(COMMODITIES).reduce((s, k) => s + Math.round(S.cargo[k]) * priceFor(st, k), 0);
  row('Sell everything', 'Empties the hold at local rates', 'Sell all', total > 0, () => sellAll(), fmtCr(total));
}

function renderService() {
  const q = repairQuote();
  body.appendChild(el('div', 'dock-note',
    `Armor ${Math.round(S.player.armor)}/${Math.round(S.stats.armorMax)} · ` +
    `hull ${Math.round(S.player.hull)}/${Math.round(S.stats.hullMax)} · balance ${fmtCr(S.credits)}`));

  row('Full repair',
    q.cost > 0
      ? `${Math.round(q.armor)} armor at ${REPAIR_COST.armor} cr · ${Math.round(q.hull)} hull at ${REPAIR_COST.hull} cr`
      : 'Nothing to fix',
    'Repair', q.cost > 0 && S.credits >= q.cost, () => repair(), q.cost > 0 ? fmtCr(q.cost) : '—');

  // Wear is a station bill like armour and hull are, and it belongs on the same tab as
  // them rather than only inside the fitting screen — a pilot who docks to repair should
  // not have to know that a second, differently-named kind of damage lives elsewhere.
  const sq = serviceQuote();
  row('Subsystem service',
    sq.count ? `${sq.count} module${sq.count === 1 ? '' : 's'} out of tolerance — worn kit gives less and draws more`
             : 'Everything in tolerance',
    'Service', sq.count > 0 && S.credits >= sq.cost,
    () => { serviceAll(); recalcStats(); },
    sq.count ? fmtCr(sq.cost) : '—');

  row('Recharge core', 'Tops the energy bank and shields', 'Recharge',
    S.player.energy < S.stats.energyCap - 1,
    () => { S.player.energy = S.stats.energyCap; S.player.shield = S.stats.shieldMax; }, 'free');

  row('Probe resupply', `${S.probes} aboard · deep-survey drones for planetary work`,
    'Buy 1', S.credits >= PROBE.cost, () => buyProbe(), fmtCr(PROBE.cost));

  row('Save flight', 'Writes progress to this device', 'Save', true, () => saveGame(false), '');

  renderFreight();
}

/**
 * Put a job on the band.
 *
 * The ledger, the haulers and the settlement path have existed since v1.01.00 and nothing in
 * the game called `postPlayerJob()` — so the half of contracts that makes a pilot a *party*
 * rather than an audience was code with a proof and no door. See docs/REACHABILITY_AUDIT.md.
 *
 * Deliberately posted out of the hold rather than as an abstract order: freight you are
 * carrying, moved by somebody else, to somewhere you are not going. That is the case a pilot
 * actually has — a full hold and no time — and it is the one the ledger was built for.
 */
function renderFreight() {
  const dests = S.world.stations.filter(s => s !== S.docked);
  const haulers = S.world.npcs.filter(n => n.userData.role === 'haul' && n.userData.hp > 0);
  const kg = Math.min(Math.floor(S.cargo.ore || 0), 2000);

  body.appendChild(el('div', 'dock-note',
    `Freight board · ${haulers.length} hauler${haulers.length === 1 ? '' : 's'} on the band`));

  if (!haulers.length) {
    body.appendChild(el('div', 'dock-note', 'Nobody is listening. Try again when traffic picks up.'));
    return;
  }
  if (kg < 100) {
    body.appendChild(el('div', 'dock-note',
      'Nothing in the hold worth moving — a job needs at least 100 kg of ore aboard.'));
    return;
  }

  // One row per plausible destination, with the fee it would take. A hauler is judged on
  // pay against what the cargo is worth *there*, so the same load is worth posting to one
  // station and not to another — which is the whole reason to show more than one.
  for (const st of dests.slice(0, 4)) {
    const dest = st.userData.name;
    const fee = suggestedFee('ore', kg, dest);
    row(`Ship ${kg} kg ore to ${dest}`,
      'A hauler takes it on their own terms — you pay on delivery',
      'Post', S.credits >= fee,
      () => {
        const deal = postPlayerJob({ commodity: 'ore', kg, pay: fee, dest });
        if (deal) { S.cargo.ore = Math.max(0, (S.cargo.ore || 0) - kg); toast(`${deal.to} has your load`); }
      },
      fmtCr(fee));
  }

  const mine = openDeals().filter(d => d.from === PLAYER);
  for (const d of mine) {
    body.appendChild(el('div', 'dock-note',
      `In transit — ${d.kg} kg to ${d.dest} with ${d.to} · ${fmtCr(d.pay)} on delivery`));
  }
}

function renderHulls() {
  body.appendChild(el('div', 'dock-note', `Shipyard · balance ${fmtCr(S.credits)}`));
  for (const key of CLASS_ORDER) {
    const c = SHIP_CLASSES[key];
    const owned = ownsHull(key);
    const active = key === S.player.classKey;
    row(`${c.icon} ${c.name} hull`,
      `cargo ${Math.round(c.cargoCap)} kg · shield ${c.shieldMax} · thrust ${(c.maxThrust / 1e6).toFixed(1)} MN`,
      active ? 'In use' : owned ? 'Switch' : 'Buy', !active,
      () => { buyHull(key); render(); },
      owned ? (active ? '—' : 'owned') : fmtCr(hullPrice(key)));
  }

  body.appendChild(el('div', 'dock-note', 'Weapon modules:'));
  for (const key of WEAPON_KEYS) {
    const w = WEAPON_MODULES[key];
    const owned = ownsWeapon(key);
    const active = (S.stats.weaponDef && S.stats.weaponDef.name) === w.name;
    row(`${w.name}`,
      `${w.kind} · ${w.damage} dmg · ${(1 / w.cooldown).toFixed(1)}/s · ${w.desc}`,
      active ? 'Mounted' : owned ? 'Mount' : 'Buy', !active,
      () => { buyWeapon(key); render(); },
      owned ? (active ? '—' : 'owned') : fmtCr(w.price));
  }
}

// The shipyard sells kit; the fitting bay decides where it goes. Keeping the two
// apart stops this tab turning into a second, worse version of the fit screen.
function renderModules() {
  body.appendChild(el('div', 'dock-note', `Module bay · balance ${fmtCr(S.credits)}`));
  const open = el('button', 'buy-btn', 'Open fitting bay');
  open.addEventListener('click', () => { closeDock(); openFit(); });
  body.appendChild(open);

  body.appendChild(el('div', 'dock-note', 'Utility hardpoints:'));
  for (const key of MODULE_KEYS.filter(k => MODULES[k].slot === 'utility')) moduleRow(key);
  body.appendChild(el('div', 'dock-note', 'Core subsystems:'));
  for (const key of MODULE_KEYS.filter(k => MODULES[k].slot === 'core')) moduleRow(key);
}

function moduleRow(key) {
  const m = MODULES[key];
  const owned = ownsModule(key);
  row(m.name,
    `${describeMods(m.mods).join(' · ')}${m.power ? ' · ' + m.power + ' MW' : ''} — ${m.desc}`,
    owned ? 'Sell' : 'Buy', owned || S.credits >= m.price,
    () => { owned ? sellModule(key) : buyModule(key); },
    owned ? 'owned' : fmtCr(m.price));
}

function renderCrewTab() {
  const n = (S.crew || []).length;
  body.appendChild(el('div', 'dock-note',
    `Hiring hall · ${n}/${berths()} berths · payroll ${payroll()} cr · balance ${fmtCr(S.credits)}`));
  const open = el('button', 'buy-btn', 'Open crew quarters');
  open.addEventListener('click', () => { closeDock(); openCrew(); });
  body.appendChild(open);

  const q = medicalQuote();
  if (q.crew) {
    row('Infirmary', `${q.crew} crew need treatment`, 'Treat', S.credits >= q.cost,
        () => treatCrew(), fmtCr(q.cost));
  }

  const pool = recruitPool();
  if (!pool.length) {
    body.appendChild(el('div', 'dock-note',
      'No one on the board here right now — it turns over every few minutes.'));
    return;
  }
  body.appendChild(el('div', 'dock-note', 'Available for hire:'));
  for (const c of pool) {
    const role = CREW_ROLES[c.role];
    const trait = CREW_TRAITS[c.trait] || CREW_TRAITS.steady;
    row(`${role.icon} ${c.name}`,
      `${role.name} L${c.level} · ${trait.name} · output ×${crewOutput(c).toFixed(2)} · wage ${wageOf(c)} cr`,
      'Hire', S.credits >= hireCost(c) && n < berths(),
      () => hire(c), fmtCr(hireCost(c)));
  }
}

function renderStation() {
  const u = S.docked.userData;
  const svc = u.services || {};
  body.appendChild(el('div', 'dock-note',
    `${u.typeName} · ${u.modules.length}/${u.slots} slots filled · net power ${svc.power > 0 ? '+' : ''}${Math.round(svc.power)}`));

  const flags = [];
  if (svc.atmo) flags.push('atmosphere');
  if (svc.crew) flags.push('gravity');
  if (svc.shieldMax > 0) flags.push(`shields ${Math.round(svc.shieldMax)}`);
  if (svc.radProtect > 0) flags.push(`rad shielding ${(svc.radProtect * 100).toFixed(0)}%`);
  if (svc.pads) flags.push(`${svc.pads} pads`);
  if (svc.drones) flags.push(`${svc.drones} drones`);
  if (svc.hasShipyard) flags.push('shipyard');
  body.appendChild(el('div', 'dock-note', flags.length ? flags.join(' · ') : 'no life support online'));

  for (const m of u.modules) {
    const def = STATION_MODULES[m.key];
    if (!def) continue;
    row(def.name, `${def.cat} · ${def.power > 0 ? '+' : ''}${def.power} pwr · ${def.desc}`,
      'Online', false, () => {}, '');
  }
  const free = u.slots - u.modules.length;
  if (free > 0) body.appendChild(el('div', 'dock-note',
    `${free} open hardpoint${free > 1 ? 's' : ''} — construction crews fit new modules automatically.`));
}

function renderRefit() {
  body.appendChild(el('div', 'dock-note', `Refits carry across every hull you own · balance ${fmtCr(S.credits)}`));

  body.appendChild(el('div', 'dock-note', 'Core refits:'));
  for (const key of UPGRADE_ORDER) {
    if (UPGRADES[key].tier !== 1) continue;
    upgradeRow(key);
  }

  body.appendChild(el('div', 'dock-note', 'Advanced modules — unlock capability, not just numbers:'));
  for (const key of UPGRADE_ORDER) {
    if (UPGRADES[key].tier !== 2) continue;
    upgradeRow(key);
  }
}

function upgradeRow(key) {
  const u = UPGRADES[key];
  const lvl = S.upgrades[key];
  const maxed = lvl >= u.max;
  const locked = upgradeLocked(key);
  const cost = upgradeCost(key);
  const tag = u.tier === 2 ? '◆ ' : '';
  const meta = locked ? `🔒 ${upgradeReqText(key)}` : u.desc;
  row(`${tag}${u.name} · L${lvl}/${u.max}`, meta,
    maxed ? 'Maxed' : locked ? 'Locked' : 'Install',
    !maxed && !locked && S.credits >= cost,
    () => buyUpgrade(key),
    maxed ? '—' : locked ? '—' : fmtCr(cost));
}


// ── pilot ────────────────────────────────────────────────────────────
// The other half of the ship. Skills that rose from what you did, points you get to
// spend, and the licences that decide what you are allowed to fly next. All of it is
// shown with its *progress*, because a rank number on its own tells a player nothing
// about whether the next one is an hour away or a week.

function renderPilot() {
  const sheet = characterSheet();
  if (!sheet) {
    body.appendChild(el('div', 'empty-note',
      'No pilot record on file. This flight predates pilot registration.'));
    return;
  }

  const head = el('div', 'pilot-head');
  head.innerHTML =
    `<div class="pn">${sheet.name}</div>` +
    `<div class="pr">${sheet.lineage} · ${sheet.corp}</div>` +
    `<div class="pr">${sheet.career} · level ${sheet.level}</div>` +
    `<div class="bar-track slim"><div class="bar-fill energy" style="width:${
       Math.round(100 * sheet.xp / Math.max(1, sheet.toNext))}%"></div></div>` +
    `<div class="pr">${sheet.xp} / ${sheet.toNext} xp` +
    (sheet.points ? ` · <span class="pts">${sheet.points} point${sheet.points > 1 ? 's' : ''} to spend</span>` : '') +
    `</div>`;
  body.appendChild(head);

  const m = currentMission();
  if (m) {
    const job = el('div', 'pilot-job');
    job.innerHTML =
      `<div class="jh">${sheet.agent ? sheet.agent.name : 'Assignment'} · ${m.index}/${m.total}</div>` +
      `<div class="jt">${m.title}</div><div class="jb">${m.brief}</div>`;
    body.appendChild(job);
  }

  body.appendChild(el('div', 'sec-head', 'Skills'));
  for (const sk of sheet.skills) {
    const r = el('div', 'skill-row');
    const aff = sk.affinity !== 1 ? ` <span class="aff">×${sk.affinity.toFixed(2)}</span>` : '';
    r.appendChild(el('div', '',
      `<div class="nm">${SKILLS[sk.key].name} <span class="rk">${sk.rank}</span>${aff}</div>` +
      `<div class="meta">${SKILLS[sk.key].desc}</div>` +
      `<div class="bar-track slim"><div class="bar-fill shield" style="width:${
        Math.round(sk.progress * 100)}%"></div></div>`));
    const b = el('button', 'buy-btn', '+');
    b.disabled = sheet.points <= 0 || sk.rank >= CHAR.maxRank;
    b.addEventListener('click', () => { spendPoint(sk.key); render(); });
    r.appendChild(b);
    body.appendChild(r);
  }

  body.appendChild(el('div', 'sec-head', 'Licences'));
  for (const hull of CLASS_ORDER) {
    const held = hasLicence(hull);
    const req = licenceReq(hull);
    const blocked = licenceBlocker(hull);
    const price = licencePrice(hull);
    row(
      `${SHIP_CLASSES[hull].icon} ${SHIP_CLASSES[hull].name}`,
      held ? 'Certified' : req ? `${req.skill} rank ${req.rank}` : 'No certification path',
      held ? 'HELD' : 'CERTIFY',
      !blocked,
      () => buyLicence(hull),
      held ? '' : (price != null ? fmtCr(price) : '')
    );
  }
}


// ── contract board ───────────────────────────────────────────────────
// Held contracts first, because a deadline you have already committed to matters more
// than an offer you have not. Everything shows its clock: an offer that expires and a
// job that is overdue are the two states a player must never be surprised by.

function clock(sec) {
  const m = Math.floor(sec / 60), s2 = Math.round(sec % 60);
  return m > 0 ? `${m}m ${String(s2).padStart(2, '0')}s` : `${s2}s`;
}

function renderBoard() {
  const held = activeContracts();

  if (held.length) {
    body.appendChild(el('div', 'sec-head', `Accepted · ${held.length}/${CONTRACTS.maxActive}`));
    for (const c of held) {
      const pct = Math.round(contractProgress(c) * 100);
      const late = timeLeft(c) < 60;
      const r = el('div', 'trade-row');
      r.appendChild(el('div', '',
        `<div class="nm">${c.title}</div>` +
        `<div class="meta">${c.issuer} · ${c.progress|0}/${c.target} · ` +
        `<span class="${late ? 'urgent' : ''}">${clock(timeLeft(c))} left</span></div>` +
        `<div class="bar-track slim"><div class="bar-fill ${late ? 'hullbar' : 'shield'}" ` +
        `style="width:${pct}%"></div></div>`));
      const right = el('div', '', `<div class="price">${fmtCr(c.pay)}</div>`);
      right.style.textAlign = 'right';
      const b = el('button', 'buy-btn', 'DROP');
      b.addEventListener('click', () => { abandonContract(c); render(); });
      right.appendChild(b);
      r.appendChild(right);
      body.appendChild(r);
    }
  }

  const st = S.docked;
  if (!st) { body.appendChild(el('div', 'empty-note', 'Dock at a station to see its board.')); return; }

  const offers = boardFor(st);
  body.appendChild(el('div', 'sec-head', `${st.userData.name} · posting as ${issuerOf(st)}`));
  if (!offers.length) {
    body.appendChild(el('div', 'empty-note', 'Nothing posted right now. The board turns over every few minutes.'));
    return;
  }

  for (const c of offers) {
    const blocked = acceptBlocker(c);
    row(
      c.title,
      `${c.brief}<br><span class="meta">expires in ${clock(timeLeft(c))} · +${c.rep} standing · ${c.skill}</span>`,
      blocked ? 'LOCKED' : 'ACCEPT',
      !blocked,
      () => acceptContract(c),
      fmtCr(c.pay)
    );
  }
}
