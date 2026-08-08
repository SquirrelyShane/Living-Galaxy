// Living Galaxy — character creation.
//
// Four steps: who you are, who trained you, what you do for a living, and the person who
// will give you your first job. Every step shows the *consequences* of the choice while
// you are making it — starting skills, standing, credits, hull — because a creation
// screen that hides its own numbers is asking a new player to guess, and they will guess
// wrong and feel it two hours later.
//
// The agent step is not a choice. It is a face and a line of dialogue that changes with
// what you picked, which is the cheapest possible way to make the previous three
// decisions feel like they were about a person rather than a stat block.

import { $, el } from '../core/utils.js';
import { LINEAGES, LINEAGE_KEYS, CORPORATIONS, CAREERS, CAREER_KEYS,
         SKILLS, SKILL_KEYS, corpsFor, agentFor } from '../data/origins.js';
import { createCharacter } from '../systems/character.js';
import { beginAgentChain } from '../systems/missions.js';
import { sfx } from '../systems/audio.js';

let draft = { name: '', lineage: null, corp: null, career: null };
let step = 0;
let onDone = null;

const STEPS = ['Lineage', 'Corporation', 'Career', 'Agent'];

export function openCreation(defaultName, done) {
  draft = { name: defaultName || '', lineage: null, corp: null, career: null };
  step = 0;
  onDone = done;
  $('create-overlay').classList.remove('hidden');
  render();
}

function close() {
  $('create-overlay').classList.add('hidden');
}

// ── rendering ────────────────────────────────────────────────────────

function render() {
  $('create-steps').innerHTML = STEPS.map((s, i) =>
    `<span class="cstep${i === step ? ' on' : ''}${i < step ? ' done' : ''}">${s}</span>`).join('');

  const body = $('create-body');
  body.innerHTML = '';
  if (step === 0) renderLineage(body);
  else if (step === 1) renderCorp(body);
  else if (step === 2) renderCareer(body);
  else renderAgent(body);

  const back = $('create-back'), next = $('create-next');
  back.classList.toggle('hidden', step === 0);
  next.textContent = step === 3 ? 'Launch' : 'Continue';
  next.disabled = !stepReady();
  next.classList.toggle('disabled', !stepReady());
}

function stepReady() {
  if (step === 0) return !!draft.lineage;
  if (step === 1) return !!draft.corp;
  if (step === 2) return !!draft.career;
  return true;
}

function card(parent, { key, title, sub, body, chosen, rows, onPick }) {
  const c = el('div', 'ccard' + (chosen ? ' on' : ''));
  c.innerHTML =
    `<div class="ct">${title}</div>` +
    (sub ? `<div class="cs">${sub}</div>` : '') +
    (body ? `<div class="cb">${body}</div>` : '') +
    (rows ? `<div class="cr">${rows}</div>` : '');
  c.addEventListener('click', () => { sfx.ui(); onPick(key); });
  parent.appendChild(c);
  return c;
}

const skillRow = obj => SKILL_KEYS
  .filter(k => obj[k])
  .map(k => `<span class="pip">${SKILLS[k].name} ${obj[k] > 0 ? '+' : ''}${obj[k]}</span>`)
  .join('');

const standRow = obj => Object.keys(obj || {})
  .filter(k => obj[k])
  .map(k => `<span class="pip ${obj[k] > 0 ? 'good' : 'bad'}">${k} ${obj[k] > 0 ? '+' : ''}${obj[k]}</span>`)
  .join('');

function renderLineage(body) {
  const nameWrap = el('div', 'cname');
  nameWrap.innerHTML = '<label>Callsign</label>';
  const input = el('input');
  input.maxLength = 16;
  input.placeholder = 'Unnamed';
  input.value = draft.name;
  input.addEventListener('input', () => { draft.name = input.value; });
  nameWrap.appendChild(input);
  body.appendChild(nameWrap);

  for (const key of LINEAGE_KEYS) {
    const L = LINEAGES[key];
    card(body, {
      key, chosen: draft.lineage === key,
      title: L.name + (L.machine ? ' <span class="mach">machine-descended</span>' : ''),
      sub: L.tag,
      body: L.desc,
      rows: skillRow(L.start) + standRow(L.standing) +
            (L.signature !== 1 ? `<span class="pip good">signature ×${L.signature.toFixed(2)}</span>` : ''),
      onPick: k => {
        draft.lineage = k;
        // Corporations are lineage-gated, so a change here invalidates the next step.
        // Silently keeping a now-illegal corp would be a bug the player never sees until
        // createCharacter refuses it.
        draft.corp = null;
        render();
      }
    });
  }
}

function renderCorp(body) {
  const list = corpsFor(draft.lineage);
  const L = LINEAGES[draft.lineage];
  body.appendChild(el('div', 'cnote')).textContent =
    `${L.name} pilots come out of two houses. Neither is a career — this is who has your file.`;

  for (const C of list) {
    const perks = [];
    if (C.credits) perks.push(`<span class="pip good">+${C.credits} cr</span>`);
    if (C.probes) perks.push(`<span class="pip good">+${C.probes} probes</span>`);
    card(body, {
      key: C.key, chosen: draft.corp === C.key,
      title: C.name,
      sub: `${C.bloc} · “${C.motto}”`,
      body: C.desc + `<div class="perk">${C.perk}</div>`,
      rows: perks.join('') + standRow(C.standing),
      onPick: k => { draft.corp = k; render(); }
    });
  }
}

function renderCareer(body) {
  body.appendChild(el('div', 'cnote')).textContent =
    'Your career decides the hull you launch in and the one licence you already hold. ' +
    'Every other hull is earned later — nothing here is locked out for good.';

  for (const key of CAREER_KEYS) {
    const K = CAREERS[key];
    card(body, {
      key, chosen: draft.career === key,
      title: `${K.icon} ${K.name}`,
      sub: `${K.hull} hull · ${K.licence} licence · ${K.weapon}`,
      body: K.desc,
      rows: skillRow(K.start) +
            K.skills.map(s => `<span class="pip">${SKILLS[s].name} focus</span>`).join(''),
      onPick: k => { draft.career = k; render(); }
    });
  }
}

function renderAgent(body) {
  const a = agentFor(draft.career, draft.lineage);
  const L = LINEAGES[draft.lineage], C = CORPORATIONS[draft.corp], K = CAREERS[draft.career];

  const head = el('div', 'agent');
  head.innerHTML =
    `<div class="an">${a.name}</div><div class="ar">${a.role}</div>` +
    `<div class="aq">“${a.line}”</div>`;
  body.appendChild(head);

  const totals = {};
  for (const k of SKILL_KEYS) totals[k] = (L.start[k] || 0) + (K.start[k] || 0);
  const stand = {};
  for (const b of ['coalition', 'pirate', 'independent']) {
    stand[b] = (L.standing[b] || 0) + (C.standing[b] || 0);
  }

  const sum = el('div', 'csum');
  sum.innerHTML =
    `<div class="crow"><span>Pilot</span><span>${draft.name || 'Unnamed'}</span></div>` +
    `<div class="crow"><span>Lineage</span><span>${L.name}</span></div>` +
    `<div class="crow"><span>Corporation</span><span>${C.name}</span></div>` +
    `<div class="crow"><span>Career</span><span>${K.name}</span></div>` +
    `<div class="crow"><span>Hull</span><span>${K.hull}</span></div>` +
    `<div class="crow"><span>Credits</span><span>${(L.credits || 0) + (C.credits || 0)}</span></div>` +
    `<div class="cr">${skillRow(totals)}</div>` +
    `<div class="cr">${standRow(stand)}</div>`;
  body.appendChild(sum);
}

// ── wiring ───────────────────────────────────────────────────────────

export function initCreation() {
  $('create-next').addEventListener('click', () => {
    if (!stepReady()) return;
    sfx.ui();
    if (step < 3) { step++; render(); return; }
    const ch = createCharacter(draft);
    if (!ch) { sfx.deny(); return; }     // should be unreachable; the UI gates every step
    beginAgentChain();
    close();
    if (onDone) onDone(ch);
  });

  $('create-back').addEventListener('click', () => {
    if (step === 0) return;
    sfx.ui();
    step--;
    render();
  });
}
