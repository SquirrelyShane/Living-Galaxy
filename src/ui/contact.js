// Living Galaxy — the contact panel. A channel you can actually say something on.
//
// Thin, like every panel in this project: `systems/npc/parley.js` decides what may be said
// and what happens when it is, and this draws the result. The only judgement here is
// presentation — which is not nothing, because the two things that make a dialogue readable
// are both presentation decisions:
//
// **The odds are printed on the button.** A persuasion attempt shows its chance before you
// take it. Hiding it would make every negotiation a coin flip with extra steps; showing it
// makes taking a one-in-five a decision you made on purpose.
//
// **The scan is itemised.** When a berth refuses you, the panel says which of the three
// checks failed. "Refused" is a wall; "your record is fine, your transponder is fine, and
// you are carrying forty kilos of something we would have to confiscate" is a problem with
// an answer — dump it, sell it elsewhere, or talk them into losing the paperwork.

import { $, el, fmtCr } from '../core/utils.js';
import { S } from '../core/state.js';
import { openParley, closeParley, branchesFor, choose, parleyLog, parleySession,
         chanceOf, tributePrice, contactable as canContact, runScan } from '../systems/npc/parley.js';
import { requestDocking } from '../systems/flight/approach.js';
import { sfx } from '../systems/platform/audio.js';
import { type as typeLine, voiceOf, finishAll } from './typewriter.js';

let overlay, logEl, actsEl, nameEl, subEl, seq = 1;

export const contactable = canContact;

export function initContact() {
  overlay = $('contact-overlay');
  if (!overlay) return;
  logEl = $('contact-log');
  actsEl = $('contact-acts');
  nameEl = $('contact-name');
  subEl = $('contact-sub');
  $('contact-close').addEventListener('click', close);
  // Tapping the transcript skips the typing, exactly like the comms log and the ARIA panel.
  logEl.addEventListener('click', () => finishAll());
}

export function openContact(obj) {
  if (!overlay) return false;
  const s = openParley(obj);
  if (!s) return false;
  nameEl.textContent = s.name;
  subEl.textContent = `${s.kind} · ${s.faction} · ${s.disp}${s.first ? ' · first contact' : ''}`;
  overlay.classList.remove('hidden');
  overlay.classList.toggle('hostile', s.disp === 'hostile');
  logEl.innerHTML = '';
  render();
  sfx.ui();
  return true;
}

function close() {
  finishAll();
  closeParley();
  if (overlay) overlay.classList.remove('hostile');
  if (overlay) overlay.classList.add('hidden');
  sfx.ui();
}

export const contactOpen = () => !!overlay && !overlay.classList.contains('hidden');

/** Redraw the transcript and the buttons from whatever the session now says. */
function render() {
  const s = parleySession();
  if (!s) { close(); return; }

  // The transcript. Rebuilt rather than appended for the same reason `ui/conn.js` does it:
  // the headless stub has no real child nodes, and a re-render is cheap at this size.
  const lines = parleyLog();
  logEl.innerHTML = '';
  lines.forEach((l, i) => {
    const row = el('div', 'ct-line' + (l.who === 'You' ? ' you' : ''));
    row.appendChild(el('span', 'ct-who', l.who));
    const body = el('span', 'ct-text', '');
    row.appendChild(body);
    logEl.appendChild(row);
    // Only the newest line types itself out. Replaying the whole call every render would be
    // unreadable and would restart mid-sentence every time a button was pressed.
    if (i === lines.length - 1 && l.who !== 'You') {
      typeLine(body, l.text, { key: 'ct:' + (seq++), kind: 'npc', voice: voiceOf(l.who),
                               onDone: scroll });
    } else body.textContent = l.text;
  });
  scroll();

  // The scan, itemised, when there is one.
  actsEl.innerHTML = '';
  if (s.service) actsEl.appendChild(scanCard(s.service));

  for (const b of branchesFor(s)) {
    const group = el('div', 'ct-group' + (b.urgent ? ' urgent' : ''));
    group.appendChild(el('div', 'ct-group-head', b.label));
    for (const o of b.options) {
      const btn = el('button', 'ct-opt');
      btn.appendChild(el('span', 'ct-opt-label', o.label));
      if (b.id === 'persuasion') {
        const pct = Math.round(chanceOf(o.id, s) * 100);
        const odds = el('span', 'ct-odds' + (pct >= 60 ? ' good' : pct >= 30 ? ' even' : ' long'),
                        pct + '%');
        btn.appendChild(odds);
      }
      if (b.id === 'war' && o.id === 'tribute') {
        btn.appendChild(el('span', 'ct-odds', fmtCr(tributePrice(s))));
      }
      btn.addEventListener('click', () => act(b.id, o.id));
      group.appendChild(btn);
    }
    actsEl.appendChild(group);
  }
}

function scanCard(v) {
  const card = el('div', 'ct-scan' + (v.ok ? ' ok' : ' bad'));
  card.appendChild(el('div', 'ct-scan-head', 'Clearance scan'));
  card.appendChild(scanRow('Transponder', v.identOk ? 'accepted' : 'refused', v.identOk));
  card.appendChild(scanRow('Cargo', v.bribed ? 'not examined'
                                  : v.contraband ? `${v.load} kg of ${v.banned.join(', ')}`
                                  : 'clean', !v.contraband));
  card.appendChild(scanRow('Record', v.recordOk ? 'in good standing' : 'flagged', v.recordOk));
  return card;
}

function scanRow(label, value, ok) {
  const r = el('div', 'ct-scan-row' + (ok ? '' : ' bad'));
  r.appendChild(el('span', '', label));
  r.appendChild(el('span', 'ct-scan-val', value));
  return r;
}

function act(branch, id) {
  const r = choose(branch, id);
  if (!r) { render(); return; }
  if (r.kind === 'dock') {
    const s = parleySession();
    const obj = s && s.obj;
    close();
    if (obj) requestDocking(obj);
    return;
  }
  if (r.kind === 'end' || r.kind === 'fight' || r.kind === 'paid') { close(); return; }
  sfx.ui();
  render();
}

function scroll() { if (logEl) logEl.scrollTop = logEl.scrollHeight; }

/** For the suite. */
export { runScan };
