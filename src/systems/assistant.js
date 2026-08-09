// Living Galaxy — assistant. A dockside AI ("ARIA") you can ask about the ship and
// the system. The heavy model runs in a Web Worker (assistant.worker.js); this module
// owns the conversation, builds the context from live game state, and ALWAYS has a
// rule-based fallback so it answers instantly even before — or without — the model.

import { S, totalMass, cargoFree } from '../core/state.js';
import { fmtCr, fmtKm, fmtMass } from '../core/utils.js';
import { tryTool, toolManifest } from './tools.js';
import { hasCompany, companyReport } from './company.js';
import { fleetOrderReport } from './orders.js';
import { diagnose, diagnoseBoard, diagnosticsFor } from '../data/npc-kb/index.js';
import { personaFor } from './npc-brain.js';

const state = {
  worker: null, ready: false, loading: false, device: null,
  onStatus: () => {}, pending: new Map(), nextId: 1
};

const SYSTEM = `You are ARIA, the terse flight AI aboard a small ship in the Solaris system.
Answer in one or two sentences, practical and in-character. You know the pilot flies a
lone hull mining the belt, trading at stations, and dodging pirates and Nexis drones.
You have instruments that answer factual questions directly — courses, prices, threats,
contracts, standing — so if the pilot asks for one of those, say so plainly and briefly
rather than guessing at numbers.`;

/** Lazy: nothing is downloaded until the pilot opens the assistant and taps Load. */
export function initAssistant(onStatus) {
  state.onStatus = onStatus || (() => {});
}

export function loadModel() {
  if (state.ready || state.loading) return;
  if (typeof Worker === 'undefined') { state.onStatus({ kind: 'nofallback' }); return; }
  state.loading = true;
  state.onStatus({ kind: 'loading', pct: 0 });
  try {
    state.worker = new Worker(new URL('./assistant.worker.js', import.meta.url), { type: 'module' });
  } catch (e) {
    state.loading = false;
    state.onStatus({ kind: 'error', msg: 'worker failed to start' });
    return;
  }
  state.worker.onmessage = ev => {
    const m = ev.data;
    if (m.t === 'progress') state.onStatus({ kind: 'loading', pct: m.pct, file: m.file });
    else if (m.t === 'ready') {
      state.ready = true; state.loading = false; state.device = m.device;
      state.onStatus({ kind: 'ready', device: m.device });
    } else if (m.t === 'reply') {
      const p = state.pending.get(m.id); if (p) { state.pending.delete(m.id); p(m.text); }
    } else if (m.t === 'error') {
      state.loading = false;
      if (m.id != null) { const p = state.pending.get(m.id); if (p) { state.pending.delete(m.id); p(null); } }
      state.onStatus({ kind: 'error', msg: m.msg });
    }
  };
  state.worker.postMessage({ t: 'load' });
}

export const modelReady = () => state.ready;
export const modelLoading = () => state.loading;

/**
 * Ask the assistant. Resolves with a string, always. Uses the model when it's ready
 * and returns something useful; otherwise the rule-based answer. Never rejects, never
 * blocks the caller.
 */
export function ask(prompt) {
  const facts = contextLine();

  // Tools first, and before the model rather than after it. A request that maps cleanly
  // onto an instrument should *use* the instrument — answering it with a sentence the
  // model generated, however well phrased, means the pilot still has to go and do the
  // thing by hand. The model is for the questions that are not requests.
  const tooled = tryTool(prompt);
  if (tooled && tooled.ok) return Promise.resolve(tooled.text);

  if (!state.ready) return Promise.resolve(ruleAnswer(prompt));
  return new Promise(resolve => {
    const id = state.nextId++;
    let settled = false;
    const finish = txt => { if (settled) return; settled = true; resolve(txt || ruleAnswer(prompt)); };
    state.pending.set(id, finish);
    // hard timeout — a slow phone must never leave the pilot hanging
    setTimeout(() => finish(null), 9000);
    state.worker.postMessage({ t: 'ask', id, system: SYSTEM, prompt: `${facts}\n\nPilot: ${prompt}` });
  });
}

// ── live context fed to the model on every question ──────────────────
function contextLine() {
  const p = S.player, st = S.stats;
  const near = nearestOf('station'), rock = beltState();
  const parts = [
    `Ship: ${st.name} hull, hull ${Math.round(p.hull)}/${Math.round(st.hullMax)},`,
    `shield ${Math.round(p.shield)}, energy ${Math.round(p.energy)}.`,
    `Credits ${fmtCr(S.credits)}. Cargo ${fmtMass(totalMass() - st.dryMass)} (${Math.round(cargoFree())} kg free).`,
    `Probes ${S.probes}.`,
    near ? `Nearest station ${near.name} ${fmtKm(near.d)}.` : 'No station in sensor range.',
    rock
  ];
  // Executive / company context — only when a company exists so non-executive
  // pilots do not carry irrelevant tokens into the prompt.
  if (hasCompany()) {
    const co = companyReport();
    if (co) {
      parts.push(
        `Company ${co.name || 'holdings'}, ${co.charter} charter, treasury ${fmtCr(co.treasury)}, ` +
        `board confidence ${Math.round((co.confidence || 0) * 100)}%.` +
        (co.hqStation ? ` Office at ${co.hqStation}${co.atHQ ? ' (you are here)' : ''}.` : '')
      );
    }
    const fleet = fleetOrderReport();
    if (fleet.length) {
      parts.push(`Fleet objectives: ${fleet.map(f =>
        `${f.asset} ${f.name}${f.remaining ? ' ' + f.remaining + 's' : ''}`).join('; ')}.`);
    }
  }
  if (S.docked) parts.push('Pilot is docked.');
  return parts.join(' ');
}

// ── rule-based fallback: covers the common questions with real numbers ──
function ruleAnswer(qRaw) {
  const q = qRaw.toLowerCase();
  const p = S.player, st = S.stats;
  const has = (...w) => w.some(x => q.includes(x));

  if (has('hello', 'hi ', 'hey', 'aria')) return 'ARIA online. Ask about the ship, the belt, or where to sell.';
  if (has('hull', 'health', 'damage', 'repair'))
    return `Hull ${Math.round(p.hull)}/${Math.round(st.hullMax)}, armor ${Math.round(p.armor)}, shield ${Math.round(p.shield)}. ${p.hull < st.hullMax * 0.6 ? 'Dock and repair before the next fight.' : 'Structure is holding.'}`;
  if (has('energy', 'power', 'warp'))
    return `Energy ${Math.round(p.energy)}/${Math.round(st.energyCap)}. Warp needs 25 to spool; a system crossing eats most of the bank.`;
  if (has('credit', 'money', 'rich', 'balance')) return `Balance ${fmtCr(S.credits)}.`;
  if (has('cargo', 'hold', 'ore', 'full'))
    return `Hold: ${Math.round(S.cargo.ore)} kg ore, ${Math.round(S.cargo.salvage)} kg salvage, ${Math.round(S.cargo.data)} kg survey data — ${Math.round(cargoFree())} kg free.`;
  if (has('sell', 'trade', 'market')) {
    const s = nearestOf('station');
    return s ? `${s.name} is ${fmtKm(s.d)} out. Industrial hubs pay best for ore, economic for salvage and survey data.`
             : 'No station on sensors — warp to one from the nav map.';
  }
  if (has('mine', 'belt', 'asteroid')) return beltState();
  if (has('pirate', 'enemy', 'threat', 'danger', 'hostile')) {
    const h = countHostiles();
    return h ? `${h} hostile contact(s) in sensor range. Watch belt and planet shadows — some lie in ambush.` : 'No hostiles on sensors. Ambushers stay dark until you close, though.';
  }
  if (has('probe', 'scan', 'planet', 'survey'))
    return `${S.probes} probe(s) aboard. Approach a planet to stable orbit, SCAN, then PROBE for surface data you can sell.`;
  if (has('dock', 'station', 'land'))
    return 'Lock a station, hit APPROACH — control hails you at range, then the tractor lands you.';
  if (has('help', 'what', 'how', 'tip'))
    return 'Mine the belt, sell at a station, refit, survive. APPROACH and MATCH do the flying; NAV plots warp.';

  // Executive / company
  if (hasCompany() && has('company', 'treasury', 'board', 'charter', 'executive', 'holdings')) {
    const board = diagnoseBoard(S.company);
    if (board) return board.brief;
    const co = companyReport();
    return co
      ? `${co.name}: ${co.charter} charter, treasury ${fmtCr(co.treasury)}, confidence ${Math.round((co.confidence || 0) * 100)}%.`
      : 'Company books are not online.';
  }
  if (hasCompany() && has('fleet', 'objective', 'patrol', 'dispatch', 'order')) {
    const fleet = fleetOrderReport();
    if (!fleet.length) return 'No fleet objectives running. Dispatch patrol, extract, logistics or escort from Ops.';
    return fleet.map(f =>
      `${f.asset}: ${f.name}` +
      (f.remaining ? ` · ${f.remaining}s left` : ' · until recalled') +
      (f.mode === 'passive' ? ' (passive)' : '')
    ).join(' · ');
  }

  // Per-NPC diagnostic / "who is X"
  if (has('who is', "who's", 'tell me about', 'diagnose', 'profile')) {
    const name = extractName(qRaw);
    if (name) {
      const npc = findNpcByName(name);
      if (npc) {
        const persona = personaFor(npc.userData);
        const report = diagnose(Object.assign({}, npc.userData, persona || {}));
        return report.brief;
      }
      const events = diagnosticsFor(name, 3);
      if (events.length) {
        return `${name} — recent: ${events.map(e => e.summary).join('; ')}.`;
      }
    }
  }

  return `Systems nominal. Hull ${Math.round(p.hull)}, energy ${Math.round(p.energy)}, ${fmtCr(S.credits)}. Ask about cargo, threats, or where to sell.`;
}

function extractName(q) {
  const m = q.match(/(?:who is|who's|tell me about|diagnose|profile)\s+([A-Za-z0-9][A-Za-z0-9 \-]{1,24})/i);
  return m ? m[1].trim().replace(/[?.!]+$/, '') : null;
}

function findNpcByName(name) {
  const lower = name.toLowerCase();
  for (const n of S.world.npcs || []) {
    if (n.userData && n.userData.name && n.userData.name.toLowerCase() === lower) return n;
  }
  return null;
}

function nearestOf(kind) {
  const src = kind === 'station' ? S.world.stations : S.world.bodies;
  let best = null, bd = Infinity;
  for (const b of src) {
    const d = b.position.distanceToSquared(S.player.position);
    if (d < bd) { bd = d; best = { name: b.userData.name, d: Math.sqrt(d) }; }
  }
  return best && best.d < S.stats.sensor * 6 ? best : best;   // stations are always worth naming
}
function countHostiles() {
  let n = 0;
  for (const s of S.world.npcs)
    if (s.userData.faction === 'hostile' && s.userData.hp > 0 && !(s.userData.ambush && !s.userData.triggered) &&
        s.position.distanceToSquared(S.player.position) < S.stats.sensor * S.stats.sensor) n++;
  return n;
}
function beltState() {
  let live = 0, ore = 0;
  for (const a of S.world.asteroids) if (a.ore > 0) { live++; ore += a.ore; }
  return `Belt: ${live} rocks with ore, ~${fmtMass(ore)} total. MATCH a rock, then hold MINE.`;
}
