// Living Galaxy — crew quarters. The roster is the idle layer's front end: who's
// aboard, what department they're in, how far off the next level they are, and what
// the whole crew is currently adding to the ship.

import { S } from '../core/state.js';
import { CREW } from '../core/config.js';
import { CREW_ROLES, ROLE_KEYS, CREW_TRAITS, crewBonuses, crewOutput, wageOf,
         postOf, specialtyOf, isCross, onDuty, condition, willpowerOf, needsOf } from '../data/crew.js';
import { berths, xpNeeded, payroll, recruitPool, hire, hireCost, dismiss, retrain,
         assignPost, toggleDuty, postReport, medicalQuote, treatCrew,
         promote, demote, overseer, persuade, provisionHours } from '../systems/crew.js';
import { describeMods } from '../systems/fitting.js';
import { $, el, fmtCr, clamp } from '../core/utils.js';
import { toast } from './toast.js';
import { sfx } from '../systems/audio.js';

let overlay, body, summary, tabs, tab = 'roster';
let openCard = null;

export function initCrewUi() {
  overlay = $('crew-overlay');
  body = $('crew-body');
  summary = $('crew-summary');
  tabs = Array.from(document.querySelectorAll('#crew-tabs .tab'));

  tabs.forEach(t => t.addEventListener('click', () => {
    tab = t.dataset.crewtab;
    openCard = null;
    tabs.forEach(x => x.classList.toggle('active', x === t));
    render();
    sfx.ui();
  }));
  $('crew-close').addEventListener('click', closeCrew);
  $('crew-done').addEventListener('click', closeCrew);
}

export function openCrew() {
  if (!overlay) return;
  overlay.classList.remove('hidden');
  render();
  sfx.ui();
}

export function closeCrew() {
  if (overlay) overlay.classList.add('hidden');
}

export const crewOpen = () => overlay && !overlay.classList.contains('hidden');

function render() {
  if (!body) return;
  body.innerHTML = '';
  const n = (S.crew || []).length;
  const nextPay = Math.max(0, CREW.wageInterval - (S.crewPayT || 0));
  summary.innerHTML =
    `<b>${n}/${berths()}</b> berths filled · payroll <b>${payroll()} cr</b> every ` +
    `${CREW.wageInterval}s (next in ${Math.round(nextPay)}s)<br>` +
    `balance ${fmtCr(S.credits)} — crew earn experience whether you're flying or docked.`;

  if (tab === 'roster') return renderRoster();
  if (tab === 'hire') return renderHire();
  renderDepts();
}

// ── roster ───────────────────────────────────────────────────────────
function renderRoster() {
  if (!S.crew || !S.crew.length) {
    body.appendChild(el('div', 'dock-note',
      'No one aboard. Dock at a station and check the Recruit tab.'));
    return;
  }
  for (const c of S.crew) body.appendChild(card(c));

  const prov = provisionHours();
  body.appendChild(el('div', 'dock-note',
    prov === Infinity ? 'No crew aboard.' :
    prov < 8 ? `<b class="urgent">Provisions: ${prov < 1 ? 'none' : prov.toFixed(1) + 'h'}</b> — ` +
               'a hungry crew works worse at everything and loses morale every payroll. ' +
               'Nutrient concentrate and water ice, from the stock.'
             : `Provisions: ${prov > 999 ? '999h+' : prov.toFixed(0) + 'h'} at this headcount.`));

  const q = medicalQuote();
  if (q.crew) {
    const b = el('button', 'buy-btn',
      `TREAT ${q.crew} INJURED · ${fmtCr(q.cost)}`);
    b.disabled = !S.docked || S.credits < q.cost;
    b.addEventListener('click', () => { treatCrew(); render(); });
    body.appendChild(b);
  }

  body.appendChild(el('div', 'dock-note',
    'Experience always accrues toward what someone <b>trained</b> as, wherever they are ' +
    'standing. <b>POST</b> moves them to another station — free, reversible, and the way ' +
    'to cover a gap — but off-speciality they work at ' +
    `${Math.round(CREW.crossPenalty * 100)}% and learn far more slowly. <b>RETRAIN</b> ` +
    'changes what they are, and costs most of the progress toward their next level. ' +
    '<b>WATCH</b> stands them down: they contribute nothing and recover fast.'));
}

function card(c) {
  const spec = CREW_ROLES[specialtyOf(c)];
  const post = CREW_ROLES[postOf(c)];
  const trait = CREW_TRAITS[c.trait] || CREW_TRAITS.steady;
  const need = xpNeeded(c.level);
  const pct = c.level >= CREW.levelMax ? 100 : clamp((c.xp / need) * 100, 0, 100);
  const duty = onDuty(c);
  const wrap = el('div', 'crew-card' + (duty ? '' : ' off-watch'));

  wrap.appendChild(el('div', 'cc-top',
    `<span class="cc-name">${post.icon} ${c.name}</span>` +
    `<span class="cc-lvl">L${c.level}${c.level >= CREW.levelMax ? ' MAX' : ''}</span>`));

  // Trained-as and standing-at are shown separately, always. Collapsing them to one line
  // is what made the old roster read as though a crewman simply *was* their department.
  wrap.appendChild(el('div', 'cc-role',
    isCross(c)
      ? `${spec.name} standing at <b class="cross">${post.dept}</b>`
      : `${spec.name} · ${spec.dept}`));

  wrap.appendChild(el('div', 'cc-meta',
    `${trait.name} · ${condition(c)} · output ×${crewOutput(c).toFixed(2)} · ` +
    `wage ${wageOf(c)} cr`));
  if (trait.flavour) wrap.appendChild(el('div', 'cc-flavour', trait.flavour));

  const xp = el('div', 'xp-track');
  xp.appendChild(el('div', 'xp-fill')).style.width = pct + '%';
  wrap.appendChild(xp);
  wrap.appendChild(el('div', 'cc-meta',
    c.level >= CREW.levelMax ? 'Fully trained' : `${Math.round(c.xp)} / ${need} xp`));

  const bars = [
    ['Morale', c.morale ?? 1, (c.morale ?? 1) < 0.6],
    ['Rest', 1 - (c.fatigue || 0), (c.fatigue || 0) > 0.6],
    ['Health', 1 - (c.injury || 0), (c.injury || 0) > 0.3],
    // Fed and Watered are shown as *remaining*, like everything else here, so a full bar
    // is always the good state. A "hunger" bar filling up would be the only meter on the
    // screen that reads the other way round.
    ['Fed', 1 - (c.hunger || 0), (c.hunger || 0) > 0.4],
    ['Watered', 1 - (c.thirst || 0), (c.thirst || 0) > 0.4],
    ['Resolve', willpowerOf(c), willpowerOf(c) < 0.35]
  ];
  for (const [label, value, low] of bars) {
    const t = el('div', 'morale-track');
    const f = el('div', 'morale-fill' + (low ? ' low' : ''));
    f.style.width = (clamp(value, 0, 1) * 100).toFixed(0) + '%';
    t.appendChild(f);
    wrap.appendChild(t);
    wrap.appendChild(el('div', 'cc-meta', `${label} ${Math.round(clamp(value, 0, 1) * 100)}%`));
  }

  const acts = el('div', 'cc-actions');
  const postBtn = el('button', 'tiny-btn', openCard === c.id ? 'CLOSE' : 'POST');
  postBtn.addEventListener('click', () => { openCard = openCard === c.id ? null : c.id; render(); });
  acts.appendChild(postBtn);

  const watch = el('button', 'tiny-btn' + (duty ? '' : ' on'), duty ? 'STAND DOWN' : 'ON WATCH');
  watch.addEventListener('click', () => { toggleDuty(c.id); render(); });
  acts.appendChild(watch);

  // Promotion is the one action with a real opportunity cost: an overseer stops manning a
  // station, so you give up your best crewman's department bonus to lift everyone else.
  const boss = overseer();
  if (c.overseer) {
    const dem = el('button', 'tiny-btn on', 'STAND DOWN CHIEF');
    dem.addEventListener('click', () => { demote(c.id); render(); });
    acts.appendChild(dem);
  } else if (c.level >= CREW.overseerMinLevel && !boss) {
    const pro = el('button', 'tiny-btn', 'PROMOTE');
    pro.addEventListener('click', () => { promote(c.id); render(); });
    acts.appendChild(pro);
  }

  // Persuasion rolls against Resolve. It works on the pliable and bounces off the
  // stubborn — which is the same roll an enemy influence net makes, in the other direction.
  if (!c.overseer && (c.morale ?? 1) < 0.75) {
    const talk = el('button', 'tiny-btn', 'TALK ROUND');
    talk.addEventListener('click', () => { persuade(c.id, 'stay on station'); render(); });
    acts.appendChild(talk);
  }

  const payoff = el('button', 'tiny-btn', 'PAY OFF');
  payoff.addEventListener('click', () => { dismiss(c.id); render(); });
  acts.appendChild(payoff);
  wrap.appendChild(acts);

  if (openCard === c.id) {
    wrap.appendChild(el('div', 'cc-meta', 'Post to:'));
    const pick = el('div', 'role-pick');
    for (const key of ROLE_KEYS) {
      const b = el('button', key === postOf(c) ? 'on' : '',
                   CREW_ROLES[key].icon + ' ' + CREW_ROLES[key].name);
      b.addEventListener('click', () => {
        if (key === postOf(c)) { toast('Already standing there'); return; }
        assignPost(c.id, key);
        openCard = null;
        render();
      });
      pick.appendChild(b);
    }
    wrap.appendChild(pick);

    wrap.appendChild(el('div', 'cc-meta',
      `Retrain — permanent, costs ${Math.round(CREW.retrainCost * 100)}% of progress:`));
    const re = el('div', 'role-pick');
    for (const key of ROLE_KEYS) {
      if (key === specialtyOf(c)) continue;
      const b = el('button', '', CREW_ROLES[key].icon);
      b.title = 'Retrain as ' + CREW_ROLES[key].name;
      b.addEventListener('click', () => { retrain(c.id, key); openCard = null; render(); });
      re.appendChild(b);
    }
    wrap.appendChild(re);
  }
  return wrap;
}

// ── recruitment ──────────────────────────────────────────────────────
function renderHire() {
  if (!S.docked) {
    body.appendChild(el('div', 'dock-note',
      'Recruiting happens dockside. Bring the ship in and the hiring hall will have people waiting.'));
    return;
  }
  const pool = recruitPool();
  if (!pool.length) {
    body.appendChild(el('div', 'dock-note', 'Nobody left on the board here. Try another station.'));
    return;
  }
  const free = berths() - (S.crew || []).length;
  body.appendChild(el('div', 'dock-note',
    free > 0 ? `${free} berth${free > 1 ? 's' : ''} free aboard.`
             : 'No free berths — pay someone off first, or fly a hull with more core slots.'));

  for (const c of pool) {
    const role = CREW_ROLES[c.role];
    const trait = CREW_TRAITS[c.trait] || CREW_TRAITS.steady;
    const cost = hireCost(c);
    const r = el('button', 'pickrow');
    r.innerHTML = `<div><div class="p-name">${role.icon} ${c.name}</div>` +
      `<div class="p-meta">${role.name} L${c.level} · ${trait.name} · ` +
      `output ×${crewOutput(c).toFixed(2)} · wage ${wageOf(c)} cr</div></div>` +
      `<div class="p-price">${fmtCr(cost)}</div>`;
    r.addEventListener('click', () => { hire(c); render(); });
    body.appendChild(r);
  }
}

// ── posts ────────────────────────────────────────────────────────────
// The department view answers "where are my people and what is each station worth",
// which is a different question from the roster's "how is this person doing" — and it
// is the one you ask before a fight rather than after one.
function renderDepts() {
  for (const r of postReport()) {
    const row = el('div', 'dept-row' + (r.manned ? '' : ' unmanned'));
    const who = r.crew.length
      ? r.crew.map(x => x.name + (x.cross ? ' (covering)' : '')).join(', ')
      : 'unmanned';
    row.appendChild(el('div', '',
      `<div class="d-name">${r.icon} ${r.name}</div>` +
      `<div class="d-meta">${r.desc}</div>` +
      `<div class="d-meta">${who}</div>`));
    row.appendChild(el('div', 'd-val', r.output ? '×' + r.output.toFixed(2) : '—'));
    body.appendChild(row);
  }

  const bonus = crewBonuses(S.crew);
  const lines = describeMods(bonus);
  body.appendChild(el('div', 'dock-note',
    lines.length ? 'Crew currently contributing: ' + lines.join(' · ')
                 : 'No crew contribution — the ship is running on automation alone.'));

  const auto = el('button', 'buy-btn' + (S.settings.autoRotate !== false ? ' on' : ''),
    `AUTO-ROTATE WATCH: ${S.settings.autoRotate !== false ? 'ON' : 'OFF'}`);
  auto.addEventListener('click', () => {
    S.settings.autoRotate = S.settings.autoRotate === false;
    sfx.ui();
    render();
  });
  body.appendChild(auto);
  body.appendChild(el('div', 'dock-note',
    'With auto-rotate on, an exhausted crewman is relieved by a rested one and stood ' +
    'down — but never if they are the last body at a manned post. A short-handed ship ' +
    'stays short-handed, and says so in the numbers rather than quietly fixing itself.'));
}
