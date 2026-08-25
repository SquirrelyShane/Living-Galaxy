// Living Galaxy — the boardroom screen.
//
// The command surface's contract board. One screen, every desk in the system, grouped by the
// power that posts it and ordered by what that power thinks of you.
//
// The dock board it replaces for this career answers "what is on offer *here*". That was the
// right question for five careers and the wrong one for the sixth from the moment v1.02.39
// gave each station a named desk: an executive's decision is not which job to take at a
// station they are standing in, it is **whose work to take at all**, because standing with
// one power moves standing with its rivals. That decision is invisible on a screen that can
// only show you one desk.
//
// Every offer carries its own accept path — a hull, chosen here, that flies it. See
// `systems/boardroom.js` for why those two acts are one act.

import { $, el, fmtCr } from '../core/utils.js';
import { S } from '../core/state.js';
import { boardroomReport, crewFor, tender, tenderBlocker, standDown,
         CONTRACT_WORK } from '../systems/company/boardroom.js';
import { abandonContract, timeLeft } from '../systems/trade/contracts.js';
import { sfx } from '../systems/platform/audio.js';

let overlay, body, head, back;
let expanded = null;          // contract id whose hull picker is open
let restore = null;
let timer = 0;

export function initBoardroom() {
  overlay = $('boardroom-overlay');
  if (!overlay) return;
  body = $('boardroom-body');
  head = $('boardroom-head');
  back = $('boardroom-close');
  if (back) back.addEventListener('click', () => closeBoardroom());
}

const boardroomOpen = () => !!overlay && !overlay.classList.contains('hidden');

export function openBoardroom(opts = {}) {
  if (!overlay) return;
  restore = opts.returnTo || null;
  expanded = null;
  overlay.classList.remove('hidden');
  render();
}

function closeBoardroom() {
  if (!overlay) return;
  overlay.classList.add('hidden');
  const r = restore; restore = null;
  if (r) r();
}

/** Hulls fly while you read. Refresh slowly — this is a board, not an instrument. */
export function tickBoardroom(dt) {
  if (!boardroomOpen()) return;
  timer += dt;
  if (timer < 2) return;
  timer = 0;
  render();
}

const hex = n => '#' + (n >>> 0).toString(16).padStart(6, '0');
const clock = s => s >= 60 ? `${Math.floor(s / 60)}m` : `${Math.round(s)}s`;
const signed = v => (v > 0 ? '+' : '') + Math.round(v);

function render() {
  if (!body) return;
  const r = boardroomReport();
  body.innerHTML = '';

  if (head) {
    head.innerHTML =
      `<b>${r.open}</b> open · ${r.offers} posted · <b>${r.idle}</b> hull${r.idle === 1 ? '' : 's'} free`;
  }

  // ── what the company is already committed to ──
  if (r.held.length) {
    body.appendChild(el('div', 'br-head', `Under contract · ${r.held.length}`));
    for (const h of r.held) {
      const c = h.contract;
      const late = timeLeft(c) < 90;
      const card = el('div', 'br-held');
      card.innerHTML =
        `<div class="bt">${c.title}</div>` +
        `<div class="bm">${h.hull ? `${h.hull} — ${h.orderName || 'assigned'}` : 'nobody is flying this'}` +
        ` · <span class="${late ? 'urgent' : ''}">${clock(timeLeft(c))} left</span></div>` +
        `<div class="bar-track slim"><div class="bar-fill ${late ? 'hullbar' : 'shield'}" ` +
        `style="width:${Math.round(h.progress * 100)}%"></div></div>`;
      const row = el('div', 'br-acts');
      if (h.flying) {
        const sd = el('button', 'buy-btn', 'STAND DOWN');
        sd.addEventListener('click', () => { sfx.ui(); standDown(c); render(); });
        row.appendChild(sd);
      }
      const drop = el('button', 'buy-btn', 'DROP');
      drop.addEventListener('click', () => { sfx.deny(); abandonContract(c); render(); });
      row.appendChild(drop);
      card.appendChild(row);
      body.appendChild(card);
    }
  }

  // ── the desks ──
  for (const d of r.desks) {
    const dh = el('div', 'br-desk');
    dh.style.setProperty('--dacc', hex(d.color));
    dh.innerHTML =
      `<div class="bdn" style="color:${hex(d.color)}">${d.name}</div>` +
      `<div class="bdm">${d.seat} · standing ${signed(d.standing)} · ` +
      `${d.stations.length} berth${d.stations.length === 1 ? '' : 's'}</div>` +
      `<div class="bdd">${d.doctrine}</div>`;
    body.appendChild(dh);

    if (!d.offers.length) {
      body.appendChild(el('div', 'br-none', 'Nothing posted.'));
      continue;
    }

    for (const o of d.offers) {
      const c = o.contract;
      const why = tenderBlocker(c);
      const hulls = crewFor(c);
      const card = el('div', 'br-offer' + (why ? ' locked' : ''));
      card.innerHTML =
        `<div class="bt">${c.title}</div>` +
        `<div class="bm">${c.station} · ${c.skill} · ${clock(timeLeft(c))}</div>` +
        (why
          // A lock states its price. `eligibility()` already listed every gap, and a hull
          // shortage is the other kind of "no" this screen can give — both belong here in
          // words, because a padlock with no reason is what makes a board feel arbitrary.
          ? `<div class="bl">${why}</div>`
          : `<div class="bg">${hulls.length} hull${hulls.length === 1 ? '' : 's'} could fly this</div>`);

      const price = el('div', 'bp', fmtCr(c.pay));
      card.appendChild(price);

      if (!why) {
        const send = el('button', 'buy-btn', expanded === c.id ? 'CANCEL' : 'ASSIGN');
        send.addEventListener('click', () => {
          sfx.ui();
          expanded = expanded === c.id ? null : c.id;
          render();
        });
        card.appendChild(send);

        // The hull picker. Not a dropdown and not automatic: which ship goes is the actual
        // decision — a trader on a haul is slower and a gun sent hunting is not escorting
        // anything else — and picking silently for the player is picking badly on their
        // behalf in the one place they have information the game does not.
        if (expanded === c.id) {
          const pick = el('div', 'br-pick');
          for (const h of hulls) {
            const b = el('button', 'br-hull', `${h.name} · ${h.role}`);
            b.addEventListener('click', () => {
              sfx.ui();
              if (tender(c, h)) { expanded = null; render(); }
            });
            pick.appendChild(b);
          }
          card.appendChild(pick);
        }
      }
      body.appendChild(card);
    }
  }

  if (!r.desks.length) {
    body.appendChild(el('div', 'br-none', 'No desks in range. The chart will tell you why.'));
  }
}
