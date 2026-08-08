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
         recall, availableCrew, assayOf } from '../systems/orders.js';
import { payroll, provisionHours, mouths, overseer, crewSummary } from '../systems/crew.js';
import { empireReport, sites, siteReport, foundSite, foundBlocker } from '../systems/planetary.js';
import { craftingReport, stockUnits, jobs } from '../systems/crafting.js';
import { activeContracts } from '../systems/contracts.js';
import { reputationReport } from '../systems/reputation.js';
import { COMMAND_CENTRES, centreFor } from '../data/planetary/centres.js';
import { CREW } from '../core/config.js';
import { sfx } from '../systems/audio.js';
import { enabled as experimentalOn, managersReport, auditions, installManager,
         dismissManager, setAutonomy, managerFor } from '../systems/managers.js';
import { AUTONOMY } from '../data/managers.js';
import { companyReport, transfer } from '../systems/company.js';

let overlay, body, tabs;
let tab = 'orders';
let timer = 0;

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
    for (const t of ['orders', 'ledger', 'holdings', 'staff']) {
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

function render() {
  if (!body) return;
  if (tabs) for (const b of (tabs.children || [])) {
    if (b.classList) b.classList.toggle('active', b.dataset.otab === tab);
  }
  body.innerHTML = '';
  if (tab === 'orders') renderOrders();
  else if (tab === 'ledger') renderLedger();
  else if (tab === 'staff') renderStaff();
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
    const card = el('div', 'ops-run');
    card.innerHTML =
      `<div class="oh">${r.body} — ${r.centre}</div>` +
      `<div class="om">${r.ptype} · slots ${r.slots.used}/${r.slots.total} · ` +
      `power ${Math.round(r.power.satisfaction * 100)}% · pop ${r.workforce}</div>` +
      (r.building ? `<div class="om urgent">building — ${hrs(r.building)} left</div>` : '') +
      `<div class="om">store ${Math.round(r.storage.used)} / ${r.storage.cap}` +
      (assayOf(r.body) ? ` · assay +${(assayOf(r.body) * 100).toFixed(0)}%` : '') + '</div>';
    body.appendChild(card);
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


// ── staff (experimental) ─────────────────────────────────────────────
//
// The hiring desk for the automated site managers, plus the company's books when there
// is a company. Deliberately the same panel: a manager is staff, and staff have an
// employer. The tab is honest about the branch being experimental rather than hiding it,
// because a player who turns it on should know what they turned on.

function renderStaff() {
  const co = companyReport();
  if (co) {
    body.appendChild(el('div', 'led-head', co.name));
    const card = el('div', 'mgr-card');
    card.innerHTML =
      `<div class="mgr-head"><span class="mgr-name">${co.charter}</span>` +
      `<span class="mgr-obj">${Math.round(co.ownership * 100)}% held</span></div>` +
      `<div class="mgr-blurb">Treasury ${fmtCr(co.treasury)} · revenue ${fmtCr(co.revenue)} · ` +
      `paid out ${fmtCr(co.dividends)}</div>` +
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
