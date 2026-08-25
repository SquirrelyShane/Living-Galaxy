// Living Galaxy — the operations overlay.
//
// Two things that had no home and needed one badly.
//
// **Operations** is the dispatch board: scout teams, survey crews, reclamation units. It
// exists because everything the player owns was idle unless the player was personally
// flying it. A crew of eight and a planetary complex should be doing *something* while you
// are three systems away, and the only way to express that was a button that did not exist.
//
// **Ledger** is the money. Income, upkeep, payroll, provisions and stores were scattered
// across five panels and one of them — upkeep — was invisible entirely, which is a bad
// property for a recurring cost. A player who cannot find out why their credits are going
// down will conclude the game is broken, and they will be right to.
//
// The panel is deliberately read-mostly. It answers "where is my money going" and "what is
// out in the field"; it does not become a second place to manage a fit or a crew.

import { $, el, fmtCr, fmtKm } from '../core/utils.js';
import { S } from '../core/state.js';
import { ORDER_TYPES, ORDER_KEYS, orderReport, dispatch, dispatchBlocker,
         recall, availableCrew, assayOf } from '../systems/company/orders.js';
import { payroll, provisionHours, mouths, overseer, crewSummary } from '../systems/crew/crew.js';
import { empireReport, sites, siteReport, foundSite, foundBlocker, siteById,
         collectFrom, deliverTo, manufactureAt, upgradeCentre, upgradeBlocker, abandonSite,
         installFacility, installBlocker, toggleFacility, removeFacility } from '../systems/industry/planetary.js';
import { facilitiesFor, facility } from '../data/planetary/index.js';
import { BRANCH_KEYS } from '../data/planetary/branches.js';
import { buildableAt, materialName, BLUEPRINTS } from '../data/crafting/index.js';
import { stock, held } from '../systems/industry/crafting.js';
import { researchReport, projectList, startProject, cancelProject } from '../systems/industry/research.js';
import { FINDINGS } from '../data/research.js';

const blueprintName = id => (BLUEPRINTS[id] && BLUEPRINTS[id].name) || id;
import { craftingReport, stockUnits, jobs, cancelJob } from '../systems/industry/crafting.js';
import { activeContracts } from '../systems/trade/contracts.js';
import { reputationReport } from '../systems/company/reputation.js';
import { COMMAND_CENTRES, centreFor } from '../data/planetary/centres.js';
import { CREW } from '../core/config.js';
import { sfx } from '../systems/platform/audio.js';
import { openNavmap } from './navmap.js';
import { enabled as experimentalOn, managersReport, auditions, installManager,
         dismissManager, setAutonomy, managerFor } from '../systems/company/managers.js';
import { AUTONOMY } from '../data/npc-kb/managers.js';
import { companyReport, transfer, hqBrief, registrarBrief, registerCharter } from '../systems/company/company.js';
import { fleetOrderReport, recallFleet } from '../systems/company/orders.js';
import { diagnoseBoard } from '../data/npc-kb/index.js';
import { COMMAND_MENU } from '../data/command-menu.js';
import { commandByPath, commandById, commandRecall, commandHire, commandRelease,
         commandHullMode, commandTransfer, fleetRoster, hullsAvailable } from '../systems/company/command.js';
import { refitOptions, refitHull, commissionOptions, commissionHull,
         canCommission, hullPerformance } from '../systems/company/fleet.js';
import { trainingStatus } from '../data/npc-kb/index.js';

// Ground-store send amounts. 'all' is one tap for the common case; the fixed steps are for
// feeding one fabricator without emptying the hold into a site you may want to leave.
const SEND_STEPS = [25, 100, 500, 'all'];
let sendStep = 100;

let overlay, body, tabs;
let tab = 'orders';
let timer = 0;
/** Path of command-menu node ids for the executive dialogue tree. */
let cmdPath = [];
let cmdFlash = '';
/** Which hull's yard menu is open, if any. */
let refitFor = null;
// Which hull's details are open. One at a time: the point of the disclosure is that the
// list stays scannable, and every card expanded is the two-section layout again.
let expandHull = null;

export function initOps() {
  overlay = $('ops-overlay');
  body = $('ops-body');
  tabs = $('ops-tabs');
  if (!overlay) return;

  const close = $('ops-close');
  if (close) close.addEventListener('click', () => closeOps());

  const ops = $('btn-ops');
  if (ops) ops.addEventListener('click', () => { tab = 'orders'; toggle(); });
  const led = $('btn-ledger');
  if (led) led.addEventListener('click', () => { tab = 'ledger'; toggle(); });

  if (tabs) {
    for (const t of ['orders', 'ledger', 'holdings', 'staff', 'research']) {
      const b = el('button', 'tab' + (t === tab ? ' active' : ''), t);
      b.dataset.otab = t;
      b.addEventListener('click', () => { tab = t; sfx.ui(); render(); });
      tabs.appendChild(b);
    }
  }
}

const isOpen = () => overlay && !overlay.classList.contains('hidden');
function toggle() { isOpen() ? closeOps() : openOps(); }
export function openOps(which) { if (which) tab = which; if (overlay) { overlay.classList.remove('hidden'); render(); } }
export function closeOps() { if (overlay) overlay.classList.add('hidden'); }

/** Orders tick while you watch, so the panel refreshes — but only while it is open. */
export function tickOps(dt) {
  if (!isOpen()) return;
  timer += dt;
  if (timer < 1) return;
  timer = 0;
  render();
}

// ── rendering ────────────────────────────────────────────────────────

let openSite = null;   // site id whose operations panel is expanded

function render() {
  if (!body) return;
  if (tabs) for (const b of (tabs.children || [])) {
    if (b.classList) b.classList.toggle('active', b.dataset.otab === tab);
  }
  body.innerHTML = '';
  if (tab === 'orders') renderOrders();
  else if (tab === 'ledger') renderLedger();
  else if (tab === 'staff') renderStaff();
  else if (tab === 'research') renderResearch();
  else renderHoldings();
}

const hrs = h => h >= 1 ? `${h.toFixed(1)}h` : `${Math.round(h * 60)}m`;

function renderOrders() {
  const running = orderReport();

  if (running.length) {
    body.appendChild(el('div', 'led-head', `Away · ${running.length}`));
    for (const o of running) {
      const card = el('div', 'ops-run');
      card.innerHTML =
        `<div class="oh">${o.icon} ${o.name}${o.target ? ` — ${o.target}` : ''}</div>` +
        `<div class="om">${o.crew.join(', ')} · ${hrs(o.remaining)} out</div>` +
        `<div class="bar-track slim"><div class="bar-fill shield" ` +
        `style="width:${Math.round(o.progress * 100)}%"></div></div>`;
      const b = el('button', 'buy-btn', 'RECALL');
      b.addEventListener('click', () => { recall(o.id); render(); });
      card.appendChild(b);
      body.appendChild(card);
    }
  }

  body.appendChild(el('div', 'led-head', 'Dispatch'));
  const free = availableCrew().length;
  body.appendChild(el('div', 'cnote',
    `${free} crew free. A dispatched team is off the roster until it comes back — not ` +
    'manning a post, not available for the fight you did not know was coming. That is the ' +
    'cost, and it is why sending your two best people is a decision.'));

  for (const key of ORDER_KEYS) {
    const spec = ORDER_TYPES[key];
    const target = key === 'survey' ? nearestWorld() : null;
    const why = dispatchBlocker(key, target);
    const card = el('div', 'ccard');
    card.innerHTML =
      `<div class="ct">${spec.icon} ${spec.name}</div>` +
      `<div class="cs">${spec.crew} crew · ${spec.hours[0]}–${spec.hours[1]}h · ` +
      `${Math.round(spec.risk * 100)}% risk</div>` +
      `<div class="cb">${spec.desc}</div>` +
      (target ? `<div class="cr"><span class="pip">target ${target}</span>` +
                `<span class="pip good">assay ${(assayOf(target) * 100).toFixed(0)}%</span></div>` : '');
    const b = el('button', 'buy-btn', why ? why.toUpperCase() : 'DISPATCH');
    b.disabled = !!why;
    b.addEventListener('click', () => { dispatch(key, target); render(); });
    card.appendChild(b);
    body.appendChild(card);
  }
}

/** The world a survey crew would work: whatever you are nearest to. */
function nearestWorld() {
  let best = null, bd = Infinity;
  for (const b of S.world.bodies) {
    if (b.userData.kind !== 'planet' && b.userData.kind !== 'moon') continue;
    const d = b.position.distanceToSquared(S.player.position);
    if (d < bd) { bd = d; best = b.userData.name; }
  }
  return best;
}

// ── ledger ───────────────────────────────────────────────────────────

function row(label, value, cls = '') {
  body.appendChild(el('div', 'led-row' + (cls ? ' ' + cls : ''),
    `<span>${label}</span><b>${value}</b>`));
}

/**
 * Where the money goes.
 *
 * Upkeep was the invisible one: planetary sites bill continuously and nothing on screen
 * said so. A recurring cost the player cannot find is indistinguishable from a bug, and
 * they will report it as one.
 */
function renderLedger() {
  const emp = empireReport();
  const wages = payroll();
  const prov = provisionHours();

  body.appendChild(el('div', 'led-head', 'Position'));
  row('Credits', fmtCr(S.credits));
  row('Crew', `${mouths()} aboard`);
  row('Materials held', `${Math.round(stockUnits())} units`);
  row('Jobs in build', String(jobs().length));

  // A queued job could be started and never stopped: `cancelJob()` shipped with a refund
  // curve nobody could ever collect. Listed here rather than in a panel of its own because
  // the ledger is where you come to ask what you have committed to.
  for (const j of jobs()) {
    const r = el('div', 'trade-row');
    r.appendChild(el('div', '', `<div class="nm">${blueprintName(j.item)}${j.qty > 1 ? ` \u00d7${j.qty}` : ''}</div>` +
      `<div class="meta">${hrs(j.remaining)} remaining of ${hrs(j.hours)}` +
      `${j.site ? ` · on ${j.site}` : ' · aboard'}</div>`));
    const b = el('button', 'buy-btn', 'CANCEL');
    b.addEventListener('click', () => { cancelJob(j.id); render(); });
    r.appendChild(b);
    body.appendChild(r);
  }

  body.appendChild(el('div', 'led-head', 'Recurring'));
  row('Payroll', `${fmtCr(wages)} / ${CREW.wageInterval}s`, wages ? 'bad' : '');
  row('Site upkeep', `${fmtCr(emp.upkeep)} / cycle`, emp.upkeep ? 'bad' : '');
  row('Provisions left', prov === Infinity ? '—' :
      prov > 999 ? '999h+' : hrs(prov), prov < 12 ? 'bad' : 'good');
  row('Life support', `${(mouths() * CREW.needs.powerPerCrew).toFixed(1)} MW`);

  const boss = overseer();
  row('Overseer', boss ? `${boss.name} (L${boss.level})` : 'none appointed',
      boss ? 'good' : '');

  body.appendChild(el('div', 'led-head', 'Trade'));
  const held = activeContracts();
  row('Contracts held', `${held.length} / 3`);
  row('Contract value', fmtCr(held.reduce((a, c) => a + c.pay, 0)), held.length ? 'good' : '');
  for (const r of reputationReport()) {
    row(`${r.faction} standing`, `${r.value} · ${r.label}`,
        r.hostile ? 'bad' : r.value > 20 ? 'good' : '');
  }

  body.appendChild(el('div', 'cnote',
    'Payroll runs on a timer whether or not you are docked, and site upkeep bills for ' +
    'every command centre you own. Both were previously invisible — the first thing a ' +
    'player notices about an unexplained recurring cost is that it looks like a bug.'));
}

// ── holdings ─────────────────────────────────────────────────────────

function renderHoldings() {
  const list = sites();
  if (!list.length) {
    body.appendChild(el('div', 'empty-note',
      'No planetary sites. Survey a world, then plant a command centre on it — an outpost ' +
      'is two slots and cheap, and everything else grows from there.'));
    return;
  }

  for (const s of list) {
    const r = siteReport(s.id);
    const card = el('div', 'ops-run' + (openSite === s.id ? ' open' : ''));
    card.innerHTML =
      `<div class="oh">${r.body} — ${r.centre}</div>` +
      `<div class="om">${r.ptype} · slots ${r.slots.used}/${r.slots.total} · ` +
      `power ${Math.round(r.power.satisfaction * 100)}% · pop ${r.workforce}</div>` +
      (r.building ? `<div class="om urgent">building — ${hrs(r.building)} left</div>` : '') +
      `<div class="om">store ${Math.round(r.storage.used)} / ${r.storage.cap}` +
      (assayOf(r.body) ? ` · assay +${(assayOf(r.body) * 100).toFixed(0)}%` : '') + '</div>';

    // Tap the card to open the site's operations. Everything below this line is the layer
    // that shipped in v1.00.20 with no way in: you could found a complex and read a dashboard
    // over it, and never run it. See docs/REACHABILITY_AUDIT.md.
    const open = el('button', 'buy-btn', openSite === s.id ? 'CLOSE' : 'OPERATE');
    open.addEventListener('click', () => {
      openSite = openSite === s.id ? null : s.id;
      sfx.ui(); render();
    });
    card.appendChild(open);
    body.appendChild(card);
    if (openSite === s.id) renderSiteOps(r);
  }

  const emp = empireReport();
  body.appendChild(el('div', 'cnote',
    `${emp.operational} of ${emp.sites} sites operational, ${emp.facilities} facilities, ` +
    `${Math.round(emp.stored)} units in ground storage. Upkeep ${fmtCr(emp.upkeep)} a cycle.`));

  renderFounding();
}

/**
 * Plant a command centre on the world you are in orbit around.
 *
 * `foundSite()` shipped in v1.00.20 and, until now, was called by exactly one thing: the
 * `LG` developer handle in main.js. The entire planetary industry layer — command centres,
 * facilities, extraction, storage, the assay, site managers — was reachable only from a
 * browser console.
 *
 * Which means the moon bug fixed in v1.00.40 ("no moon in the game could ever be built on")
 * was a refusal inside a code path no player could invoke. I fixed the second gate while
 * the first one did not exist. That is the thing this whole audit is about, and it is why
 * `test/reachability.mjs` now exists: it found this one, not me.
 */
function renderFounding() {
  const orbit = S.orbit && S.orbit.body;
  if (!orbit) {
    body.appendChild(el('div', 'cnote',
      'Enter orbit around a planet or a moon to plant a command centre on it.'));
    return;
  }
  const u = orbit.userData;
  const already = sites().some(s => s.body === u.name);
  body.appendChild(el('div', 'ops-head', `In orbit — ${u.name}`));
  if (already) {
    body.appendChild(el('div', 'cnote', 'You already hold ground here.'));
    return;
  }

  const options = centreFor(u.ptype);
  if (!options.length) {
    body.appendChild(el('div', 'cnote',
      `Nothing in the catalogue will sit on a ${u.typeName || u.ptype} world.`));
    return;
  }

  for (const key of options) {
    const c = COMMAND_CENTRES[key];
    const why = foundBlocker(orbit, key);
    const r = el('div', 'ops-run');
    r.innerHTML = `<div class="oh">${c.name}</div>` +
      `<div class="om">${c.slots} slots · ${c.desc || ''}</div>` +
      `<div class="om">${Object.keys(c.build).map(m => `${c.build[m]} ${m}`).join(' · ')}</div>`;
    const b = el('button', 'buy-btn', why ? why.toUpperCase() : 'ESTABLISH');
    b.disabled = !!why;
    b.addEventListener('click', () => { foundSite(orbit, key); render(); });
    r.appendChild(b);
    body.appendChild(r);
  }
}



// ── research ─────────────────────────────────────────────────────────
//
// Survey data had exactly one sink before this — you sold it. The findings row at the top is
// the important part of the screen: it is what tells a player that *where they went* decides
// what they can learn, rather than how much telemetry they happened to accumulate.
function renderResearch() {
  const r = researchReport();

  body.appendChild(el('div', 'led-head', 'Findings'));
  body.appendChild(el('div', 'cnote',
    'Gathered by putting probes down and working anomalies. What a world teaches depends ' +
    'on what it is — you cannot research cryogenics without having been anywhere cold.'));
  for (const f of r.findings) {
    row(f.name, String(f.held), f.held ? '' : 'bad');
  }
  row('Survey data in hold', `${r.data} kg`);
  row('Projects complete', `${r.done} of ${r.total}`);

  if (r.active) {
    body.appendChild(el('div', 'led-head', 'In the lab'));
    const p = el('div', 'ops-run open');
    p.innerHTML = `<div class="oh">${r.active.name}</div>` +
      `<div class="om">${r.active.left.toFixed(1)}h of ${r.active.hours}h remaining</div>`;
    const b = el('button', 'buy-btn', 'ABANDON');
    b.addEventListener('click', () => { cancelProject(); render(); });
    p.appendChild(b);
    body.appendChild(p);
  }

  body.appendChild(el('div', 'led-head', 'Projects'));
  for (const p of projectList()) {
    const card = el('div', 'ops-run' + (p.done ? ' open' : ''));
    const needs = Object.keys(p.needs || {})
      .map(k => `${p.needs[k]} ${FINDINGS[k].name.toLowerCase()}`).join(', ');
    card.innerHTML =
      `<div class="oh">${p.name}${p.done ? ' \u2014 complete' : ''}</div>` +
      `<div class="om">${p.desc}</div>` +
      `<div class="om">${needs ? `${needs} · ` : ''}${p.data} kg data · ${p.hours}h` +
      `${(p.unlocks || []).length ? ` · releases ${p.unlocks.length} blueprints` : ''}</div>`;
    if (!p.done) {
      const b = el('button', 'buy-btn', p.blocker ? p.blocker.toUpperCase() : 'BEGIN');
      b.disabled = !!p.blocker;
      b.addEventListener('click', () => { startProject(p.id); render(); });
      card.appendChild(b);
    }
    body.appendChild(card);
  }
}

// ── site operations ──────────────────────────────────────────────────
//
// Five verbs that existed, were tested, and had no caller: `collectFrom`, `deliverTo`,
// `manufactureAt`, `upgradeCentre`, `abandonSite` — plus `installFacility`,
// `toggleFacility` and `removeFacility`, which the hand-written audit registry missed
// entirely. That miss is the honest limit of a hand-maintained list, and it is why the
// registry in test/reachability.mjs grew by three entries alongside this panel.
//
// Ordered by how often a player does it: take the output, feed the fabricators, run a job,
// change the buildings, then the two irreversible ones at the bottom where a mis-tap cannot
// reach them.
function renderSiteOps(r) {
  const wrap = el('div', 'site-ops');

  if (r.building) {
    wrap.appendChild(el('div', 'cnote',
      `Command centre still going up — ${hrs(r.building)} left. Nothing here works until it does.`));
    body.appendChild(wrap);
    return;
  }

  // ── the store ──
  wrap.appendChild(el('div', 'ops-head', `Ground store — ${Math.round(r.storage.used)} / ${r.storage.cap}`));
  if (!r.store.length) {
    wrap.appendChild(el('div', 'cnote', 'Nothing extracted yet.'));
  } else {
    for (const m of r.store.slice(0, 6)) {
      const row = el('div', 'trade-row');
      row.appendChild(el('div', '', `<div class="nm">${m.name}</div><div class="meta">${m.qty} units on the ground</div>`));
      const b = el('button', 'buy-btn', 'LIFT');
      b.addEventListener('click', () => { collectFrom(r.id, m.id); render(); });
      row.appendChild(b);
      wrap.appendChild(row);
    }
    const all = el('button', 'wide-btn', 'LIFT EVERYTHING');
    all.addEventListener('click', () => { collectFrom(r.id); render(); });
    wrap.appendChild(all);
  }

  // ── feeding it ──
  // Only what is actually in the hold, and only in a size that fits — a "deliver" button
  // that fails on press is the thing this whole slice is about.
  const carrying = Object.keys(stock()).filter(m => held(m) >= 10).slice(0, 5);
  if (carrying.length) {
    const room = Math.max(0, r.storage.cap - Math.round(r.storage.used));
    wrap.appendChild(el('div', 'ops-head', `Send down — ${room} of room`));

    // v1.01.98: this used to be one fixed `SEND min(held, 100)` button. `deliverTo()` has
    // taken a quantity since v1.01.20 and nothing ever offered one, so splitting a load was
    // impossible — you sent 100 or you sent 100. The step chip is shared by every row rather
    // than per-material, because the decision a player is making is "how much at a time",
    // not "how much of iron".
    const strip = el('div', 'chiprow');
    for (const step of SEND_STEPS) {
      const b = el('button', 'chip' + (step === sendStep ? ' on' : ''),
        step === 'all' ? 'ALL' : String(step));
      b.addEventListener('click', () => { sendStep = step; sfx.ui(); render(); });
      strip.appendChild(b);
    }
    wrap.appendChild(strip);

    for (const m of carrying) {
      const aboard = Math.floor(held(m));
      const qty = Math.min(sendStep === 'all' ? aboard : sendStep, aboard, room || aboard);
      const row = el('div', 'trade-row');
      row.appendChild(el('div', '', `<div class="nm">${materialName(m)}</div>` +
        `<div class="meta">${aboard} aboard</div>`));
      const b = el('button', 'buy-btn', `SEND ${qty}`);
      b.disabled = qty <= 0;
      b.addEventListener('click', () => { deliverTo(r.id, m, qty); render(); });
      row.appendChild(b);
      wrap.appendChild(row);
    }
  }

  // ── manufacturing ──
  const lines = r.facilities.filter(f => !f.building && f.on &&
    (facility(f.id) || {}).manufactures);
  if (lines.length) {
    wrap.appendChild(el('div', 'ops-head', 'Fabrication'));
    const cats = [...new Set(lines.flatMap(f => facility(f.id).manufactures))];
    for (const cat of cats) {
      const items = buildableAt(cat, r.tier).slice(0, 4);
      for (const id of items) {
        const row = el('div', 'trade-row');
        row.appendChild(el('div', '', `<div class="nm">${blueprintName(id)}</div>` +
          `<div class="meta">${cat} · built on the ground, not aboard</div>`));
        const b = el('button', 'buy-btn', 'QUEUE');
        b.addEventListener('click', () => { manufactureAt(r.id, id, 1); render(); });
        row.appendChild(b);
        wrap.appendChild(row);
      }
    }
  }

  // ── buildings ──
  wrap.appendChild(el('div', 'ops-head', `Facilities — ${r.slots.used}/${r.slots.total} slots`));
  for (const f of r.facilities) {
    const row = el('div', 'trade-row');
    row.appendChild(el('div', '', `<div class="nm">${f.name}</div>` +
      `<div class="meta">${f.building ? `building — ${hrs(f.building)}` : f.on ? 'running' : 'idle'}</div>`));
    const right = el('div', '');
    if (!f.building) {
      const t = el('button', 'buy-btn', f.on ? 'STOP' : 'START');
      t.addEventListener('click', () => { toggleFacility(r.id, f.index); render(); });
      right.appendChild(t);
    }
    const rm = el('button', 'buy-btn', 'SCRAP');
    rm.addEventListener('click', () => { removeFacility(r.id, f.index); render(); });
    right.appendChild(rm);
    row.appendChild(right);
    wrap.appendChild(row);
  }

  if (r.slots.used < r.slots.total) {
    const site = siteById(r.id);
    for (const b of BRANCH_KEYS) {
      for (const f of facilitiesFor(b, r.tier)) {
        if (r.facilities.some(x => x.id === f.id)) continue;
        const why = installBlocker(r.id, f.id);
        // Only offer what the ground could take. A list of everything in the catalogue with
        // most of it greyed out is a catalogue, not a decision.
        if (why && !/^Short/.test(why)) continue;
        const row = el('div', 'trade-row');
        row.appendChild(el('div', '', `<div class="nm">+ ${f.name}</div>` +
          `<div class="meta">${f.slots} slot${f.slots > 1 ? 's' : ''} · ${b}</div>`));
        const bt = el('button', 'buy-btn', why ? why.toUpperCase() : 'BUILD');
        bt.disabled = !!why;
        bt.addEventListener('click', () => { installFacility(r.id, f.id); render(); });
        row.appendChild(bt);
        wrap.appendChild(row);
      }
    }
  }

  // ── the two you cannot undo ──
  if (r.upgrades.length) {
    wrap.appendChild(el('div', 'ops-head', 'Upgrade command centre'));
    for (const key of r.upgrades) {
      const c = COMMAND_CENTRES[key];
      const why = upgradeBlocker(r.id, key);
      const row = el('div', 'trade-row');
      row.appendChild(el('div', '', `<div class="nm">${c.name}</div>` +
        `<div class="meta">${c.slots} slots · ${c.hours}h · ` +
        `${Object.keys(c.build).map(m => `${c.build[m]} ${materialName(m)}`).join(' · ')}</div>`));
      const b = el('button', 'buy-btn', why ? why.toUpperCase() : 'UPGRADE');
      b.disabled = !!why;
      b.addEventListener('click', () => { upgradeCentre(r.id, key); render(); });
      row.appendChild(b);
      wrap.appendChild(row);
    }
  }

  // Two taps, deliberately. Abandoning is the only action here that destroys work, and a
  // single button next to LIFT EVERYTHING is a mis-tap away from a complex.
  const ab = el('button', 'wide-btn', confirmAbandon === r.id
    ? 'CONFIRM — ABANDON AND RECOVER STORES' : 'Abandon site');
  ab.addEventListener('click', () => {
    if (confirmAbandon === r.id) { abandonSite(r.id); openSite = null; confirmAbandon = null; }
    else confirmAbandon = r.id;
    render();
  });
  wrap.appendChild(ab);

  body.appendChild(wrap);
}

let confirmAbandon = null;

// ── staff (experimental) ─────────────────────────────────────────────
//
// The hiring desk for the automated site managers, plus the company's books when there
// is a company. Deliberately the same panel: a manager is staff, and staff have an
// employer. The tab is honest about the branch being experimental rather than hiding it,
// because a player who turns it on should know what they turned on.

function renderStaff() {
  const co = companyReport();
  if (!co) renderRegistrar(body);
  if (co) {
    const office = hqBrief();
    body.appendChild(el('div', 'led-head',
      office && office.here ? `${co.name} · Headquarters` : co.name));
    if (office) {
      body.appendChild(el('div', 'cnote', office.line +
        (office.here
          ? ' Command dialogue and fleet objectives below are the idle desk.'
          : '')));
    }
    const card = el('div', 'mgr-card');
    card.innerHTML =
      `<div class="mgr-head"><span class="mgr-name">${co.charter}</span>` +
      `<span class="mgr-obj">${Math.round(co.ownership * 100)}% held</span></div>` +
      `<div class="mgr-blurb">Treasury ${fmtCr(co.treasury)} · revenue ${fmtCr(co.revenue)} · ` +
      `paid out ${fmtCr(co.dividends)}` +
      (co.hqStation ? ` · office ${co.hqStation}` : '') +
      `</div>` +
      `<div class="mgr-score">Board confidence ${Math.round(co.confidence * 100)}%` +
      (co.focus == null ? '' : ` · ${Math.round(co.focus * 100)}% of activity inside the charter`) +
      `</div>`;
    const row = el('div', 'mgr-row');
    for (const amt of [2500, 10000]) {
      const b = el('button', 'buy-btn', `IN ${fmtCr(amt)}`);
      b.addEventListener('click', () => { transfer(amt); render(); });
      row.appendChild(b);
    }
    const draw = el('button', 'buy-btn', 'DRAW 2,500 cr');
    draw.addEventListener('click', () => { transfer(-2500); render(); });
    row.appendChild(draw);
    card.appendChild(row);
    body.appendChild(card);

    // Board diagnostic one-liner for the executive.
    const board = diagnoseBoard(S.company, co.board || []);
    if (board && board.alerts && board.alerts.length) {
      body.appendChild(el('div', 'cnote', 'Board: ' + board.alerts.join(' · ')));
    }

    // One fleet list.
    //
    // This was two: "Fleet objectives" above and "Contracted hulls" below, which meant a
    // ship on an objective appeared twice under the same name and you had to hold both in
    // your head to answer one question — what is this ship doing and can I change it. The
    // hull is the thing that exists; an objective is a state it is in. So the list is
    // hull-first, the objective reads on the card, and everything that used to be in the
    // second section is behind a disclosure rather than stacked on screen for every hull.
    renderFleet(body);

    // Curated dialogue menu — same structured orders ARIA emits.
    renderCommandMenu(body);

    // What the self-training loop has to work with.
    const tr = trainingStatus();
    body.appendChild(el('div', 'cnote',
      `ARIA corpus: ${tr.seeds} written examples, ${tr.harvested} harvested from ` +
      `${tr.events} recorded events. Written examples always outrank harvested ones.`));
  }

  if (!experimentalOn()) {
    body.appendChild(el('div', 'cnote',
      'Automated site managers are an experimental subsystem and are currently off. ' +
      'Turn them on in Settings, or from the console with LG.experimental(true). A save ' +
      'made with them on loads cleanly with them off — the managers simply go inert.'));
    return;
  }

  const running = managersReport();
  if (running.length) {
    body.appendChild(el('div', 'led-head', `Managers · ${running.length}`));
    for (const m of running) {
      const card = el('div', 'mgr-card');
      const trend = m.trend > 0.01 ? '▲' : m.trend < -0.01 ? '▼' : '·';
      card.innerHTML =
        `<div class="mgr-head"><span class="mgr-name">${m.icon} ${m.archetype} — ${m.site}</span>` +
        `<span class="mgr-obj">${m.objective}</span></div>` +
        `<div class="mgr-score">Site score ${Math.round(m.score * 100)}% ${trend} · ` +
        `${m.autonomyName} · ${m.passes} passes</div>`;
      for (const a of m.actions) {
        const line = el('div', 'mgr-act' + (a.advisory ? ' adv' : ''));
        line.textContent = (a.advisory ? 'would: ' : '') + a.why;
        card.appendChild(line);
      }
      const row = el('div', 'mgr-row');
      for (const rung of AUTONOMY) {
        const b = el('button', 'buy-btn', rung.name.toUpperCase());
        b.addEventListener('click', () => { setAutonomy(m.siteId, rung.level); render(); });
        row.appendChild(b);
      }
      const fire = el('button', 'buy-btn', 'DISMISS');
      fire.addEventListener('click', () => { dismissManager(m.siteId); render(); });
      row.appendChild(fire);
      card.appendChild(row);
      body.appendChild(card);
    }
  }

  const open = sites().filter(s => s.buildRemaining <= 0 && !managerFor(s.id));
  if (!open.length) {
    if (!running.length) body.appendChild(el('div', 'cnote',
      'No operational sites without a manager. Found one from the nav chart first.'));
    return;
  }

  body.appendChild(el('div', 'led-head', 'Hire'));
  body.appendChild(el('div', 'cnote',
    'Each archetype reads the same site differently — the score is that manager\u2019s ' +
    'opinion of it, and the line underneath is the first thing they would actually do.'));

  for (const site of open) {
    body.appendChild(el('div', 'led-head', site.body));
    for (const a of auditions(site.id).slice(0, 3)) {
      const card = el('div', 'mgr-card');
      card.innerHTML =
        `<div class="mgr-head"><span class="mgr-name">${a.icon} ${a.name}</span>` +
        `<span class="mgr-obj">${Math.round(a.score * 100)}%</span></div>` +
        `<div class="mgr-blurb">${a.blurb}</div>` +
        `<div class="mgr-score">First move: ${a.firstMove}</div>`;
      const row = el('div', 'mgr-row');
      const hire = el('button', 'buy-btn', `HIRE — ${fmtCr(6500)}`);
      hire.addEventListener('click', () => { installManager(site.id, a.key); render(); });
      row.appendChild(hire);
      card.appendChild(row);
      body.appendChild(card);
    }
  }
}

// ── executive command dialogue menu ──────────────────────────────────
// Walks COMMAND_MENU. Leaves call commandByPath so the UI and ARIA share one
// resolver. cmdPath is the stack of selected node ids; empty = top level.

// ── the registrar's desk ─────────────────────────────────────────────
// The way into the executive layer for a pilot who did not take the career. Before
// v1.01.80 this panel simply had nothing in it for them and no explanation of why.

function renderRegistrar(parent) {
  const reg = registrarBrief();
  parent.appendChild(el('div', 'led-head', 'Companies register'));

  if (!reg.ok) {
    parent.appendChild(el('div', 'cnote',
      reg.reason + ' A charter is what opens fleet objectives, the command tree and the board.'));
    return;
  }

  parent.appendChild(el('div', 'cnote',
    `Register a charter at ${reg.station}. ${fmtCr(reg.fee)} from your own credits, of which ` +
    `${fmtCr(reg.treasury)} capitalises the treasury. You would hold ` +
    `${Math.round(reg.ownership * 100)}% — less than a founder who started with the career.`));

  for (const c of reg.charters) {
    const card = el('div', 'mgr-card');
    card.innerHTML =
      `<div class="mgr-head"><span class="mgr-name">${c.name}</span>` +
      `<span class="mgr-obj">${c.key}</span></div>` +
      `<div class="mgr-blurb">${c.desc}</div>`;
    const row = el('div', 'mgr-row');
    const go = el('button', 'buy-btn', 'REGISTER');
    go.addEventListener('click', () => {
      const r = registerCharter(c.key);
      cmdFlash = r.ok ? `${r.company.name} registered.` : r.reason;
      sfx.ui();
      render();
    });
    row.appendChild(go);
    card.appendChild(row);
    parent.appendChild(card);
  }
}

// ── the fleet ────────────────────────────────────────────────────────
// One card per hull, because the hull is the thing that exists and an objective is a state
// it is in. The summary line answers "what is this ship doing"; the disclosure answers
// "and what shape is it in", which is a question you ask about one ship at a time and not
// about all of them at once.
//
// The per-hull ACTIVE/PASSIVE pair is the toggle strip OPEN_ITEMS carried from v1.01.73 —
// mode was selectable inside a menu leaf and nowhere else, so you could not say "this ship
// holds passive" as a standing property of the ship.

function renderFleet(parent) {
  const hulls = fleetRoster();
  const orders = fleetOrderReport();
  const byAsset = new Map(orders.map(o => [o.asset, o]));

  parent.appendChild(el('div', 'led-head',
    `Fleet · ${hulls.length} hull${hulls.length === 1 ? '' : 's'}` +
    (orders.length ? ` · ${orders.length} on objective` : '')));

  // Straight to the chart. Every objective on this screen is about a place — a belt, a
  // lane, a body to survey — and the only way to see where any of it is was to close Ops,
  // find the NAV key on the flight bar and open it from there. An executive who never
  // leaves the office deck should still be able to look at the system.
  //
  // v1.02.31: it now comes *back*. The old button closed Ops and opened the chart with no
  // memory of where it had been, so closing the chart dropped you into the canopy and the
  // only route to this list was OPS → Staff → scroll again — the "one layer back" dead end
  // the brief called out. The chart takes a return path now, and both entries hand it one
  // that reopens this tab.
  {
    const nav = el('div', 'mgr-row');
    const back = () => openOps('staff');
    const chart = el('button', 'buy-btn', 'SYSTEM CHART');
    chart.addEventListener('click', () => { closeOps(); openNavmap({ pane: 'chart', returnTo: back }); });
    nav.appendChild(chart);
    const tel = el('button', 'buy-btn', 'LIVE TELEMETRY');
    tel.addEventListener('click', () => { closeOps(); openNavmap({ pane: 'telemetry', returnTo: back }); });
    nav.appendChild(tel);
    parent.appendChild(nav);
  }

  if (!hulls.length) {
    parent.appendChild(el('div', 'cnote',
      'No hulls under contract. Objectives bind to a real ship, so the command tree has ' +
      'nothing to dispatch until you sign one. Patrol earns while a hostile is on the lane, ' +
      'extract and logistics bank what they move, survey deepens a body\'s assay, and a ' +
      'picket reports what crosses its scope.'));
  }

  for (const h of hulls) {
    const card = el('div', 'mgr-card');
    const f = byAsset.get(h.name) || null;
    const state = h.refitting ? `in the yard · ${h.refitting}s`
                : h.docked ? `docked · ${h.dockedAt || 'pad'}`
                : f ? `${f.name}${f.mode === 'passive' ? ' · passive' : ''}`
                : h.busy ? 'on objective' : 'idle';
    const perf = hullPerformance(h.id);
    const open = expandHull === h.id;

    // The summary. One line of what it is doing, and — when it is doing something — what
    // that has produced, because a countdown on its own was the v1.01.91 complaint.
    const pct = f ? Math.round((f.progress || 0) * 100) : 0;
    card.innerHTML =
      `<div class="mgr-head"><span class="mgr-name">${h.name}</span>` +
      `<span class="mgr-obj">${h.role} · ${state}</span></div>` +
      (f
        ? `<div class="mgr-blurb">` +
          (f.target && f.target !== 'belt' ? `Target ${f.target} · ` : '') +
          (f.remaining > 0 ? `${f.remaining}s remaining · ${pct}%` : 'Until recalled') +
          `</div>` + (f.work ? `<div class="mgr-score">${f.work}</div>` : '')
        : `<div class="mgr-blurb">${h.alive ? 'No objective' : 'Out of contact'}</div>`) +
      (h.underFire ? '<div class="mgr-score" style="color:#ffb020">UNDER FIRE</div>' : '');

    // Everything the old second section showed, one ship at a time.
    if (open) {
      card.innerHTML +=
        `<div class="mgr-blurb">` +
        `${h.owner === 'player' ? 'Your ship' : 'Company property'}<br>` +
        (h.alive
          ? `Hull ${h.hp}/${h.maxHp} · ${fmtKm(h.dist)} out · upkeep ${fmtCr(h.upkeep)}/cycle` +
            // Cargo. Its absence was the reported bug: a hull carrying 2,344 kg read as
            // idle while a scan of the same ship showed a full manifest.
            (h.holdCap > 0
              ? `<br>Hold ${Math.round(h.hold)} / ${Math.round(h.holdCap)} kg` +
                (h.holdPct >= 0.9 ? ' · full' : '') +
                (h.runningIn ? ` · running in to ${h.berth || 'a berth'}` : '')
              : '')
          : 'Out of contact — the contract closes if it stays that way') +
        `<br>Default mode: ${h.mode}` +
        (perf && perf.delivered ? ` · run in ${perf.delivered} kg · earned ${fmtCr(perf.earned)}` : '') +
        `</div>`;
    }

    const top = el('div', 'mgr-row');
    const dis = el('button', 'buy-btn' + (open ? ' on' : ''), open ? 'DETAILS ▴' : 'DETAILS ▾');
    dis.addEventListener('click', () => {
      expandHull = open ? null : h.id;
      sfx.ui();
      render();
    });
    top.appendChild(dis);
    // Recall stays on the summary. It is the one action you take without wanting to read
    // anything first, and burying it behind a disclosure would make an idle-command screen
    // slower than the command menu it exists to replace.
    if (f) {
      const rc = el('button', 'buy-btn', 'RECALL');
      rc.addEventListener('click', () => { recallFleet(f.id); render(); });
      top.appendChild(rc);
    }
    card.appendChild(top);

    if (!open) { parent.appendChild(card); continue; }

    const row = el('div', 'mgr-row');
    for (const m of ['active', 'passive']) {
      const b = el('button', 'buy-btn' + (h.mode === m ? ' on' : ''), m.toUpperCase());
      b.addEventListener('click', () => {
        commandHullMode(h.id, m);
        sfx.ui();
        render();
      });
      row.appendChild(b);
    }
    // Refit is what turns a conscripted patrol ship into something that can mine. The
    // hull has to be idle and near a yard, so the options are shown with their blocker
    // rather than hidden — a button that is not there teaches nothing.
    if (!h.busy && !h.refitting) {
      const ref = el('button', 'buy-btn', 'REFIT ▾');
      ref.addEventListener('click', () => {
        refitFor = refitFor === h.id ? null : h.id;
        sfx.ui();
        render();
      });
      row.appendChild(ref);
    }
    // Ownership. A founder lending their own ship to the company, or taking one back out
    // of it, is an ordinary thing to want to do — and the difference between a hull bought
    // with the treasury and one bought with your own credits has to be visible before it
    // can be changed.
    // Only the one direction. `transferHull` refused player-ward transfers at v1.02.00 —
    // a hull the treasury paid for stays on the company books — so a TO ME button was a
    // button whose only outcome was a refusal message.
    if (h.owner === 'player') {
      const xfer = el('button', 'buy-btn', 'TO COMPANY');
      xfer.addEventListener('click', () => {
        const r = commandTransfer(h.id, 'company');
        cmdFlash = r.text;
        sfx.ui();
        render();
      });
      row.appendChild(xfer);
    }

    const rel = el('button', 'buy-btn', 'RELEASE');
    rel.addEventListener('click', () => {
      const r = commandRelease(h.id);
      cmdFlash = r.text;
      sfx.ui();
      render();
    });
    row.appendChild(rel);
    card.appendChild(row);

    if (refitFor === h.id) {
      const yard = el('div', 'site-ops');
      yard.appendChild(el('div', 'ops-head', 'Yard conversion — paid by the company'));
      for (const o of refitOptions(h.id)) {
        const line = el('div', 'mgr-row');
        const b = el('button', 'buy-btn', `${o.name.toUpperCase()} · ${fmtCr(o.fee)}`);
        b.addEventListener('click', () => {
          const r = refitHull(h.id, o.role);
          cmdFlash = r.ok ? `${h.name} into the yard — ${o.name} in ${o.seconds}s` : r.reason;
          refitFor = null;
          sfx.ui();
          render();
        });
        line.appendChild(b);
        yard.appendChild(line);
        yard.appendChild(el('div', 'mgr-blurb', o.desc));
      }
      card.appendChild(yard);
    }

    parent.appendChild(card);
  }

  // Buying a hull outright. The shipyard on the Ledger tab replaces *your* ship, which is
  // not on the roster and cannot be given an objective — this is the one that adds a ship
  // the company can actually command.
  const comm = el('div', 'led-head', 'Commission a hull');
  parent.appendChild(comm);
  const cgate = canCommission('mine');
  if (!cgate.ok && /dock/i.test(cgate.reason || '')) {
    parent.appendChild(el('div', 'cnote', 'Ships are ordered at a station — dock to place an order.'));
  } else {
    for (const o of commissionOptions()) {
      const card = el('div', 'mgr-card');
      card.innerHTML =
        `<div class="mgr-head"><span class="mgr-name">${o.name}</span>` +
        `<span class="mgr-obj">${o.branch}</span></div>` +
        `<div class="mgr-blurb">${o.desc}</div>`;
      const line = el('div', 'mgr-row');
      const b = el('button', 'buy-btn', `ORDER ${fmtCr(o.fee)}`);
      b.addEventListener('click', () => {
        const r = commissionHull(o.role);
        cmdFlash = r.ok ? `${r.contract.name} delivered.` : r.reason;
        sfx.ui();
        render();
      });
      line.appendChild(b);
      card.appendChild(line);
      parent.appendChild(card);
    }
  }

  const open = hullsAvailable(6);
  if (!open.length) {
    parent.appendChild(el('div', 'cnote',
      'No hulls in range will sign right now. Hostiles do not take company work.'));
    return;
  }

  parent.appendChild(el('div', 'led-head', 'Will sign'));
  for (const c of open) {
    const card = el('div', 'mgr-card');
    card.innerHTML =
      `<div class="mgr-head"><span class="mgr-name">${c.npcName}</span>` +
      `<span class="mgr-obj">${c.role}</span></div>` +
      `<div class="mgr-blurb">${c.faction} · hull ${c.hp}/${c.maxHp} · ${fmtKm(c.dist)} out</div>`;
    const row = el('div', 'mgr-row');
    const hire = el('button', 'buy-btn', `SIGN ${fmtCr(c.fee)}`);
    hire.addEventListener('click', () => {
      const r = commandHire(c.npcName);
      cmdFlash = r.text;
      sfx.ui();
      render();
    });
    row.appendChild(hire);
    card.appendChild(row);
    parent.appendChild(card);
  }
}

function renderCommandMenu(parent) {
  parent.appendChild(el('div', 'led-head', 'Command dialogue'));
  if (cmdFlash) {
    parent.appendChild(el('div', 'cnote', cmdFlash));
    cmdFlash = '';
  }

  // Breadcrumb / back
  if (cmdPath.length) {
    const crumb = el('div', 'mgr-row');
    const back = el('button', 'buy-btn', '← Back');
    back.addEventListener('click', () => { cmdPath.pop(); render(); });
    crumb.appendChild(back);
    const root = el('button', 'buy-btn', 'Top');
    root.addEventListener('click', () => { cmdPath = []; render(); });
    crumb.appendChild(root);
    parent.appendChild(crumb);
    parent.appendChild(el('div', 'cnote', trailLabel(cmdPath)));
  } else {
    parent.appendChild(el('div', 'cnote',
      'Choose a desk. Every option ends in a structured fleet order — the same object ARIA emits when you ask in plain language.'));
  }

  const nodes = currentMenuNodes();
  if (!nodes.length) {
    parent.appendChild(el('div', 'cnote', 'No further options on this path.'));
    return;
  }

  for (const n of nodes) {
    const card = el('div', 'mgr-card');
    const isLeaf = !!n.order;
    card.innerHTML =
      `<div class="mgr-head"><span class="mgr-name">${n.label}</span>` +
      `<span class="mgr-obj">${isLeaf ? orderTag(n) : '›'}</span></div>` +
      (n.prompt ? `<div class="mgr-blurb">${n.prompt}</div>` : '');

    if (isLeaf) {
      const row = el('div', 'mgr-row');
      const go = el('button', 'buy-btn', 'Dispatch');
      go.addEventListener('click', () => {
        const path = cmdPath.concat(n.id);
        const r = commandByPath(path);
        cmdFlash = r.text;
        if (r.ok) cmdPath = [];
        render();
      });
      row.appendChild(go);
      card.appendChild(row);
    } else {
      card.style.cursor = 'pointer';
      card.addEventListener('click', () => { cmdPath = cmdPath.concat(n.id); render(); });
    }
    parent.appendChild(card);
  }
}

function currentMenuNodes() {
  let nodes = COMMAND_MENU;
  for (const id of cmdPath) {
    const hit = nodes.find(n => n.id === id);
    if (!hit) return [];
    nodes = hit.children || [];
  }
  return nodes;
}

function trailLabel(path) {
  const labels = [];
  let nodes = COMMAND_MENU;
  for (const id of path) {
    const hit = nodes.find(n => n.id === id);
    if (!hit) break;
    labels.push(hit.label);
    nodes = hit.children || [];
  }
  return labels.join(' › ');
}

function orderTag(n) {
  const o = n.order || {};
  const bits = [o.type];
  if (o.durationSec > 0) bits.push(o.durationSec + 's');
  else bits.push('hold');
  if (o.mode === 'passive') bits.push('passive');
  return bits.join(' · ');
}
