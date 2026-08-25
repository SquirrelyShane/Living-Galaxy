// Living Galaxy — the Executive command deck.
//
// The sixth career's HUD, and deliberately not a HUD at all in the sense the other five
// use the word. There is no canopy behind it, no throttle under it and no crosshair on
// it, because an executive is not in a ship. The deck is a detached screen: the game
// world keeps simulating underneath — markets move, hulls work their objectives, NPCs
// talk to each other — and none of it is drawn until the nav map is opened.
//
// That is the point of the split rather than a side effect of it. A founder standing on
// the office deck was previously shown a cockpit with a shuttle's instruments in it,
// reading zero throttle and nominal hull for a ship they did not own, in front of a 3D
// scene rendered at 60 Hz for nobody. The deck replaces all of it with the four things
// the career actually reads — the company, the treasury, the fleet, and the system — and
// `main.js` skips the render entirely while it is up. On a phone that is most of the
// frame budget handed back.
//
// The deck owns no simulation. Every number on it is read from the system that already
// owns it (`company`, `fleet`, `orders`), so there is nothing here to keep in step.

import { S } from '../core/state.js';
import { $, el, fmtCr, fmtKm } from '../core/utils.js';
import { isExecutive, careerLine } from '../systems/company/career.js';
import { companyReport } from '../systems/company/company.js';
import { fleetRoster } from '../systems/company/fleet.js';
import { fleetOrderReport } from '../systems/company/orders.js';
import { activeContracts } from '../systems/trade/contracts.js';
import { summaryLine } from '../systems/platform/telemetry.js';
import { openNavmap } from './navmap.js';
import { openOps } from './ops.js';
import { openSettings } from './settings.js';
import { openComms } from './comms.js';
import { openAria } from './aria.js';
import { openDossier } from './dossier.js';
import { openBoardroom } from './boardroom.js';
import { openGalaxyMap } from './galaxymap.js';
import { saveGame } from '../systems/platform/save.js';
import { sfx } from '../systems/platform/audio.js';

let deck, head, sub, stats, board, foot;
let visible = false, timer = 0;

/**
 * True when the command deck owns the screen.
 *
 * `main.js` reads this to decide whether to draw the world at all, so it has to be cheap
 * and it has to be honest: it is the career *and* the fact that the deck is actually up,
 * not the career alone. A career test on its own would suppress the renderer during
 * character creation, before the deck exists to replace it.
 */
export const execHudActive = () => visible;

export function initExecDeck() {
  deck = $('exec-deck');
  if (!deck) return;
  head = $('exec-co');
  sub = $('exec-sub');
  stats = $('exec-stats');
  board = $('exec-board');
  foot = $('exec-foot');

  // The nav key. Item one of the brief: an executive needs one obvious way into the
  // chart, not a path through two menus that lands back where it started.
  bind('exec-nav', () => openNavmap({ pane: 'telemetry', returnTo: showDeck, hideFlight: true }));
  bind('exec-chart', () => openNavmap({ pane: 'chart', returnTo: showDeck, hideFlight: true }));

  // The galaxy chart, and it is a *different chart* from the one above.
  //
  // This shipped as `exec-chart2`, labelled CHART, sitting immediately beside another button
  // labelled CHART. One opened the system and one opened the galaxy, the markup gave no way
  // to tell which, and the comment attached to it described the contract board — a paste from
  // the line below that nobody caught because a comment cannot fail a test.
  //
  // Two charts is right. Two buttons called CHART is not.
  bind('exec-galaxy', () => openGalaxyMap());
  bind('exec-board', () => openBoardroom());
  bind('exec-ops', () => openOps('orders'));
  bind('exec-ledger', () => openOps('ledger'));
  bind('exec-staff', () => openOps('staff'));
  bind('exec-comms', () => openComms());
  bind('exec-aria', () => openAria());
  // No `returnTo`: the deck is a base surface at z-index 40, not an overlay, so it is
  // still underneath when the file closes. Handing it a restore callback would show it
  // a second time.
  bind('exec-dossier', () => openDossier());
  bind('exec-settings', () => openSettings());
  bind('exec-save', () => saveGame(false));
}

function bind(id, fn) {
  const b = $(id);
  if (b) b.addEventListener('click', () => { sfx.ui(); fn(); });
}

/**
 * Put the deck up and take the flight HUD down.
 *
 * The flight chrome is hidden with a class on <body> rather than element by element:
 * there are eleven separate panels involved and a list of ids here would go stale the
 * first time one of them is renamed. The stylesheet owns the list; this owns the switch.
 */
export function showDeck() {
  if (!deck || !isExecutive()) return;
  visible = true;
  document.body.classList.add('command-surface');
  deck.classList.remove('hidden');
  render();
}

export function hideDeck() {
  visible = false;
  document.body.classList.remove('command-surface');
  if (deck) deck.classList.add('hidden');
}

/** Called once after the world is up: the deck replaces the cockpit for this career. */
export function enterCommandSurface() {
  if (!isExecutive()) { hideDeck(); return false; }
  showDeck();
  return true;
}

export function tickExecDeck(dt) {
  if (!visible) return;
  timer += dt;
  if (timer < 1.2) return;
  timer = 0;
  render();
}

// ── rendering ────────────────────────────────────────────────────────

function render() {
  if (!deck || !visible) return;
  const co = companyReport();
  const hulls = fleetRoster();
  const objectives = fleetOrderReport();
  const jobs = activeContracts();

  if (head) head.textContent = co ? co.name : 'Unregistered charter';
  if (sub) {
    sub.textContent = co
      ? `${co.charter} charter · ${Math.round(co.ownership * 100)}% held · ${co.hqStation || 'no registered office'}`
      : careerLine();
  }

  if (stats) {
    stats.innerHTML = '';
    const cells = co
      ? [
          ['Treasury', fmtCr(co.treasury)],
          ['Revenue', fmtCr(co.revenue)],
          ['Spend', fmtCr(co.spend)],
          ['Board confidence', `${Math.round((co.confidence || 0) * 100)}%`],
          ['Hulls', `${hulls.length}`],
          ['On objective', `${objectives.length}`]
        ]
      : [['Treasury', '—'], ['Hulls', `${hulls.length}`], ['Contracts', `${jobs.length}`]];
    for (const [k, v] of cells) {
      const c = el('div', 'exec-cell');
      c.innerHTML = `<span class="ec-k">${k}</span><span class="ec-v">${v}</span>`;
      stats.appendChild(c);
    }
  }

  if (board) {
    board.innerHTML = '';
    board.appendChild(el('div', 'exec-head', 'Fleet'));
    if (!hulls.length) {
      board.appendChild(el('div', 'exec-note',
        'No hulls under contract. Nothing the company owns is in the system yet — sign a ' +
        'hull from OPS → Staff, then bind it to an objective. The chart will plot it the ' +
        'moment it exists.'));
    }
    const byAsset = new Map(objectives.map(o => [o.asset, o]));
    for (const h of hulls.slice(0, 8)) {
      const f = byAsset.get(h.name) || null;
      const state = h.refitting ? `in the yard · ${h.refitting}s`
                  : h.docked ? `docked · ${h.dockedAt || 'pad'}`
                  : f ? `${f.name}${f.mode === 'passive' ? ' · passive' : ''}`
                  : h.alive ? 'idle' : 'out of contact';
      const row = el('div', 'exec-row' + (h.underFire ? ' hot' : ''));
      row.innerHTML =
        `<span class="er-n">${h.name}</span>` +
        `<span class="er-s">${h.role} · ${state}</span>` +
        `<span class="er-d">${h.alive ? fmtKm(h.dist) : '—'}</span>`;
      board.appendChild(row);
    }
    if (hulls.length > 8) {
      board.appendChild(el('div', 'exec-note', `+${hulls.length - 8} more in OPS → Staff.`));
    }
  }

  if (foot) foot.textContent = summaryLine();
}
