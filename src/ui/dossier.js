// Living Galaxy — the dossier screen.
//
// v1.02.36 built the individual record and tested it thoroughly; nothing in the game read
// it. `dossierReport()` existed, was green, and was called by no UI at all — which by this
// project's own reachability rule makes it a system that does not exist yet. This is the
// door.
//
// It renders **one individual**: the player, or any NPC you have a lock on. The same
// component for both, deliberately, because the whole claim of v1.02.36 is that the player
// is not a special case — they are one record among many, and a mercenary's file should be
// legible in exactly the same shape as your own.
//
// ## What it shows, and why in this order
//
//   Identity     — who, what track, where on it. The one line you came for.
//   Proficiency  — a hexagon, not a bar chart. The *shape* is the identity: a gunner and a
//                  prospector are recognisable at a glance before a number is read.
//   Standing     — nine powers, grouped by bloc, on a **diverging** scale with zero at the
//                  centre line. Standing is signed and zero is a real state (nobody has an
//                  opinion), not the bottom of a range.
//   Career track — five rungs, with the next one's requirements broken out and each shown
//                  as have-versus-need. A gate that will not say what it wants is what
//                  makes progression feel arbitrary.
//   The world    — live hostilities and the timeline, both derived from `data/factions.js`.
//
// Tapping a power opens its file: charter, doctrine, how it regards the other eight, and
// which historical events it was part of.

import { S } from '../core/state.js';
import { $, el } from '../core/utils.js';
import { playerDossier, npcDossier, dossierReport, refreshRung } from '../systems/company/dossier.js';
import { POWERS, POWER_KEYS, BLOCS, HISTORY, NOW, relationOf, relationLabel,
         activeWars, historyOf } from '../data/factions.js';
import { SKILL_KEYS } from '../data/origins.js';
import { sfx } from '../systems/platform/audio.js';

let overlay, sheet;
let subject = null;          // the dossier currently on screen
let returnTo = null;         // what to show when this closes — see ui/navmap.js
let timer = 0;

/** #rrggbb from the integer colours the data tables carry. */
const hex = n => '#' + (n >>> 0).toString(16).padStart(6, '0');

export function initDossier() {
  overlay = $('dossier-overlay');
  if (!overlay) return;
  sheet = $('power-sheet');

  const close = $('dossier-close');
  if (close) close.addEventListener('click', () => closeDossier());

  const sclose = $('power-close');
  if (sclose) sclose.addEventListener('click', () => hideSheet());
  if (sheet) sheet.addEventListener('click', e => { if (e.target === sheet) hideSheet(); });

  // Standing rows are rebuilt on every render, so the handler is delegated rather than
  // bound per row — per-row listeners on a rebuilt list is a leak with a nice syntax.
  const box = $('dossier-standing');
  if (box) box.addEventListener('click', e => {
    const t = e && e.target;
    const row = (t && typeof t.closest === 'function') ? t.closest('.dpow') : null;
    if (!row || !row.dataset.power) return;
    openPower(row.dataset.power);
  });
}

/**
 * Open the file on somebody.
 *
 * @param {object} [who]  a dossier, or null for the player's own
 * @param {object} [opts] { returnTo }
 */
export function openDossier(who, opts) {
  if (!overlay) return;
  const o = opts || {};
  returnTo = typeof o.returnTo === 'function' ? o.returnTo : null;
  subject = who || playerDossier();
  if (subject) refreshRung(subject);
  overlay.classList.remove('hidden');
  hideSheet();
  render();
  sfx.ui();
}

/** The file on whatever is currently locked, if it is a person. */
export function openLockedDossier(opts) {
  const t = S.target;
  if (!t || !t.obj || t.kind !== 'ship') { openDossier(null, opts); return; }
  const u = t.obj.userData || {};
  openDossier(npcDossier(u.name, { role: u.role, faction: u.faction }), opts);
}

export function closeDossier() {
  if (!overlay) return;
  overlay.classList.add('hidden');
  hideSheet();
  const back = returnTo;
  returnTo = null;
  if (back) back();
}

export const dossierOpen = () => !!overlay && !overlay.classList.contains('hidden');

/** The player's own numbers move while they fly, so a screen left open keeps up. */
export function tickDossier(dt) {
  if (!dossierOpen() || !subject || subject.kind !== 'player') return;
  timer += dt;
  if (timer < 1.5) return;
  timer = 0;
  subject = playerDossier();
  refreshRung(subject);
  render();
}

// ── rendering ────────────────────────────────────────────────────────

function render() {
  const r = dossierReport(subject);
  if (!r) return;

  setText('dossier-name', r.name);
  setText('dossier-rung', (r.rungTitle || '').toUpperCase());
  setText('dossier-role',
    `${r.kind === 'player' ? 'You' : 'Contact'} · ${r.careerName} track · rung ${r.rung + 1} of ${r.rungs.length}`);

  // Traits and qualifications as chips. Traits are who they are; quals are what they have
  // been granted, so they read differently.
  const tags = $('dossier-tags');
  if (tags) {
    tags.innerHTML =
      (r.traits || []).map(t => `<span class="dtag hot" title="${t.effect || ''}">${t.name}</span>`).join('') +
      (r.quals || []).map(q => `<span class="dtag">${q.replace(/-/g, ' ')}</span>`).join('') +
      (r.grants || []).slice(0, 4).map(g => `<span class="dtag lo">${g.replace(/-/g, ' ')}</span>`).join('');
  }

  drawRadar(r.proficiency);
  renderSkills(r.proficiency);
  renderStanding(r);
  renderLadder(r);
  renderWorld();
}

function setText(id, v) { const n = $(id); if (n) n.textContent = v; }

// ── the hexagon ──────────────────────────────────────────────────────
//
// Drawn as SVG markup rather than into a canvas: it is six points that change twice a
// second at most, and an SVG scales with the phone's own pixel ratio for free.

function drawRadar(prof) {
  const node = $('dossier-radar');
  if (!node) return;
  const keys = SKILL_KEYS;
  const cx = 80, cy = 80, R = 58, n = keys.length;
  const out = [];
  const pt = (i, rad) => {
    const a = -Math.PI / 2 + i * 2 * Math.PI / n;
    return [cx + Math.cos(a) * rad, cy + Math.sin(a) * rad];
  };
  const poly = rad => keys.map((_, i) => pt(i, rad))
    .map((q, i) => (i ? 'L' : 'M') + q[0].toFixed(1) + ',' + q[1].toFixed(1)).join(' ') + ' Z';

  for (const g of [0.25, 0.5, 0.75, 1]) {
    out.push(`<path d="${poly(R * g)}" fill="none" stroke="rgba(96,150,168,${g === 1 ? 0.34 : 0.15})" stroke-width="1"/>`);
  }
  for (let i = 0; i < n; i++) {
    const q = pt(i, R);
    out.push(`<line x1="${cx}" y1="${cy}" x2="${q[0].toFixed(1)}" y2="${q[1].toFixed(1)}" stroke="rgba(96,150,168,.18)"/>`);
  }
  const shape = keys.map((k, i) => pt(i, R * Math.max(0.02, prof[k] || 0)))
    .map((q, i) => (i ? 'L' : 'M') + q[0].toFixed(1) + ',' + q[1].toFixed(1)).join(' ') + ' Z';
  out.push(`<path d="${shape}" fill="rgba(55,185,212,.24)" stroke="#37b9d4" stroke-width="1.8" stroke-linejoin="round"/>`);
  keys.forEach((k, i) => {
    const q = pt(i, R * Math.max(0.02, prof[k] || 0));
    out.push(`<circle cx="${q[0].toFixed(1)}" cy="${q[1].toFixed(1)}" r="2.6" fill="#54e0a0"/>`);
  });
  keys.forEach((k, i) => {
    const q = pt(i, R + 11);
    out.push(`<text x="${q[0].toFixed(1)}" y="${(q[1] + 3).toFixed(1)}" fill="#7f9aa4" ` +
             `font-size="7.5" text-anchor="middle">${k.slice(0, 4).toUpperCase()}</text>`);
  });
  node.innerHTML = out.join('');
}

function renderSkills(prof) {
  const box = $('dossier-skills');
  if (!box) return;
  box.innerHTML = SKILL_KEYS.map(k => {
    const v = Math.round((prof[k] || 0) * 100);
    return `<div class="drow"><span class="dsk">${k}</span>` +
           `<span class="dtrack"><span class="dfill" style="width:${v}%"></span></span>` +
           `<span class="dval">${v}%</span></div>`;
  }).join('');
  const best = SKILL_KEYS.reduce((a, b) => ((prof[a] || 0) >= (prof[b] || 0) ? a : b));
  setText('dossier-best', best.toUpperCase() + ' ' + Math.round((prof[best] || 0) * 100) + '%');
}

// ── standing ─────────────────────────────────────────────────────────

function renderStanding(r) {
  const box = $('dossier-standing');
  if (!box) return;
  let html = '';
  for (const bk of ['coalition', 'independent', 'pirate']) {
    const rows = r.standing.filter(x => x.bloc === bk);
    if (!rows.length) continue;
    html += `<div class="dbloc"><span class="ddot" style="background:${hex(BLOCS[bk].color)}"></span>` +
            `${BLOCS[bk].name}</div>`;
    for (const p of rows) {
      const w = Math.abs(p.value) / 2;                 // −100..100 across a half-width bar
      const col = p.value > 0 ? 'var(--good)' : p.value < 0 ? 'var(--hostile)' : 'transparent';
      const cls = p.value > 0 ? 'pos' : p.value < 0 ? 'neg' : 'zero';
      const side = p.value >= 0 ? `left:50%;width:${w}%` : `right:50%;width:${w}%`;
      html += `<div class="dpow" data-power="${p.key}">` +
              `<span class="dpn" style="color:${hex(p.color)}">${p.name}</span>` +
              `<span class="dptrack"><span class="dpzero"></span>` +
              `<span class="dpbar" style="background:${col};${side}"></span></span>` +
              `<span class="dpv ${cls}">${p.value > 0 ? '+' : ''}${p.value}</span></div>`;
    }
  }
  box.innerHTML = html;
  const known = r.standing.filter(p => p.value !== 0).length;
  setText('dossier-standsum', `${known} / ${r.standing.length} KNOWN`);
}

// ── the ladder ───────────────────────────────────────────────────────

function renderLadder(r) {
  const box = $('dossier-ladder');
  if (!box) return;
  setText('dossier-track', (r.careerName || '').toUpperCase());

  box.innerHTML = r.rungs.map((rung, i) => {
    const done = i < r.rung, here = i === r.rung;
    const isNext = r.next && i === r.next.index;
    let needs = '';
    if (isNext) {
      const rows = [];
      // Every missing requirement, with have-versus-need. `nextRung()` already computed
      // the gap; this only decides how it looks.
      for (const m of r.next.missing) {
        if (m.kind === 'skill') {
          rows.push(needRow(m.key, `${Math.round(m.have * 100)}/${Math.round(m.need * 100)}%`,
                            m.have / m.need, false));
        } else if (m.kind === 'standing') {
          const p = POWERS[m.key];
          rows.push(needRow(`${m.name} standing`, `${Math.round(m.have)}/${Math.round(m.need)}`,
                            m.have / m.need, false, p && hex(p.color)));
        } else if (m.kind === 'qual') {
          rows.push(`<div class="dneed"><span class="dnl">papers: ${m.key.replace(/-/g, ' ')}</span>` +
                    `<span class="dnv" style="color:var(--hostile)">none</span></div>`);
        }
      }
      // Requirements already satisfied still show, met, so the rung reads as a checklist
      // rather than as a list of complaints.
      const missingKeys = new Set(r.next.missing.map(m => m.kind + ':' + m.key));
      for (const k of Object.keys((r.next.needs && r.next.needs.skills) || {})) {
        if (missingKeys.has('skill:' + k)) continue;
        rows.push(needRow(k, 'met', 1, true));
      }
      for (const k of Object.keys((r.next.needs && r.next.needs.standing) || {})) {
        if (missingKeys.has('standing:' + k)) continue;
        const p = POWERS[k];
        rows.push(needRow(`${(p && p.short) || k} standing`, 'met', 1, true, p && hex(p.color)));
      }
      needs = `<div class="dneeds">${rows.join('')}</div>`;
    }
    return `<div class="drung${done ? ' done' : ''}${here ? ' here' : ''}">` +
           `<span class="dnode">${done ? '✓' : i + 1}</span>` +
           `<span><span class="drt">${rung.title}</span>` +
           (isNext && r.next.grants && r.next.grants.length
             ? `<div class="dgr">opens ${r.next.grants.join(' · ')}</div>` : '') +
           needs + `</span></div>`;
  }).join('');

  const note = $('dossier-next');
  if (note) note.textContent = r.next ? r.next.why : 'Top of the track — nothing left to prove.';
}

function needRow(label, value, frac, met, colour) {
  const pct = Math.max(0, Math.min(100, (frac || 0) * 100));
  return `<div class="dneed"><span class="dnl"${colour ? ` style="color:${colour}"` : ''}>${label}</span>` +
         `<span class="dnv"${met ? ' style="color:var(--good)"' : ''}>${value}</span>` +
         `<span class="dnbar"><span class="dnfill${met ? ' met' : ''}" style="width:${pct}%"></span></span></div>`;
}

// ── the world around them ────────────────────────────────────────────

function renderWorld() {
  const wars = activeWars();
  setText('dossier-warcount', `${wars.length} ACTIVE`);
  const wbox = $('dossier-wars');
  if (wbox) {
    wbox.innerHTML = wars.length
      ? wars.map(w =>
          `<div class="dwar"><span class="dwl" style="color:${hex(POWERS[w.a].color)}">${POWERS[w.a].short}</span>` +
          `<span class="dwm">${w.label}</span>` +
          `<span class="dwr" style="color:${hex(POWERS[w.b].color)}">${POWERS[w.b].short}</span></div>`).join('')
      : '<div class="dnote">Nobody is currently at open hostilities.</div>';
  }

  setText('dossier-now', 'CR ' + NOW);
  const hbox = $('dossier-history');
  if (hbox) {
    hbox.innerHTML = HISTORY.slice().reverse().map(e =>
      `<div class="dev"><div class="devh"><span class="devt">${e.title}</span>` +
      `<span class="devy">CR ${e.year}</span></div>` +
      `<div class="devb">${e.text}</div>` +
      `<div class="devp">${(e.powers || []).map(p =>
        `<span style="color:${hex(POWERS[p].color)};border-color:${hex(POWERS[p].color)}">${POWERS[p].short}</span>`
      ).join('')}</div></div>`).join('');
  }
}

// ── one power's file ─────────────────────────────────────────────────

export function openPower(key) {
  const p = POWERS[key];
  if (!p || !sheet) return;
  setText('power-name', p.name);
  const nameNode = $('power-name');
  if (nameNode) nameNode.style.color = hex(p.color);
  setText('power-meta', `${BLOCS[p.bloc].name} · ${p.charter} charter · seated at ${p.seat}`);
  setText('power-blurb', p.blurb);
  setText('power-doctrine', '“' + p.doctrine + '”');

  const rels = $('power-rels');
  if (rels) {
    rels.innerHTML = POWER_KEYS.filter(o => o !== key).map(o => {
      const v = relationOf(key, o);
      const w = Math.abs(v) * 50;
      const col = v > 0 ? 'var(--good)' : 'var(--hostile)';
      const side = v >= 0 ? `left:50%;width:${w}%` : `right:50%;width:${w}%`;
      return `<div class="drel"><span style="color:${hex(POWERS[o].color)}">${POWERS[o].short}</span>` +
             `<span class="dptrack"><span class="dpzero"></span>` +
             `<span class="dpbar" style="background:${col};${side}"></span></span>` +
             `<span class="drl" style="color:${col}">${relationLabel(v)}</span></div>`;
    }).join('');
  }

  const hist = $('power-history');
  if (hist) {
    const list = historyOf(key);
    hist.innerHTML = list.length
      ? list.map(e => `<div class="dev"><div class="devh"><span class="devt">${e.title}</span>` +
                      `<span class="devy">CR ${e.year}</span></div></div>`).join('')
      : '<div class="dnote">No recorded involvement.</div>';
  }

  // What this power thinks of *you*, which is the reason the screen is open.
  const you = $('power-standing');
  if (you && subject) {
    const v = Math.round((subject.standing && subject.standing[key]) || 0);
    you.textContent = v === 0
      ? `${p.short} has no opinion of ${subject.kind === 'player' ? 'you' : subject.name} yet.`
      : `${p.short} standing: ${v > 0 ? '+' : ''}${v}`;
    you.style.color = v > 0 ? 'var(--good)' : v < 0 ? 'var(--hostile)' : 'var(--ink-dim)';
  }

  sheet.classList.remove('hidden');
  sfx.ui();
}

function hideSheet() { if (sheet) sheet.classList.add('hidden'); }
