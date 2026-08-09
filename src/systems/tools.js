// Living Galaxy — ARIA's hands.
//
// Until now the assistant could only *talk*. It knew your cargo, your credits and where
// the belt was, and the best it could do with any of it was read the number back to you.
// Asking "where should I sell this ore" got a sentence; you then closed the panel, opened
// the nav map, found the station and set the course yourself.
//
// These are tools: named actions with typed arguments that ARIA can invoke against the
// live game. Each one does the thing *and* reports what it did, so the answer and the
// action are the same event rather than a suggestion followed by manual labour.
//
// Two rules shape the list.
//
// **Nothing here can lose you anything.** Tools plot courses, name markets and read state.
// None of them sells cargo, buys a hull, accepts a contract or fires a weapon. A model
// small enough to run on a phone will occasionally misread a request, and the cost of
// that must never be more than a course you did not want — which is one tap to cancel.
//
// **Every tool is callable without the model.** They are ordinary exported functions with
// a rule-based matcher in front, so the whole feature works before a model is downloaded
// and on devices that will never run one. The model makes the phrasing flexible; it is
// not what makes the tool work.

import { S, cargoFree, totalMass } from '../core/state.js';
import { fmtCr, fmtKm } from '../core/utils.js';
import { setCourse, toggleWarp, planCourse, courseLength } from './warp.js';
import { startApproach } from './approach.js';
import { setTarget } from './targeting.js';
import { bestMarket, marketPrice, scarcity } from './market.js';
import { boardFor, activeContracts, contractProgress, timeLeft } from './contracts.js';
import { reputationReport, standingLabel, standing } from './reputation.js';
import { characterSheet } from './character.js';
import { playerSignature, signatureLabel } from './detection.js';
import { perfStats } from '../core/clock.js';
import { netReport } from './net.js';
import { fieldContacts } from './fields.js';
import { watchReport, crewVitals, crewDiagnosis } from './crew-log.js';
import { diagnostics } from '../core/log.js';
import { commandFromText, commandRecall, commandCatalogue,
         commandHullMode, fleetRoster, hullsAvailable, fleetBrief } from './command.js';
import { fleetOrderReport } from './orders.js';
import { hasCompany, registerCharter, registrarBrief } from './company.js';
import { trainingBrief } from '../data/npc-kb/index.js';

const bodyNamed = name => {
  if (!name) return null;
  const want = String(name).toLowerCase();
  return S.world.bodies.find(b => (b.userData.name || '').toLowerCase() === want) ||
         S.world.bodies.find(b => (b.userData.name || '').toLowerCase().includes(want)) || null;
};

const nearest = (kind, list) => {
  let best = null, bd = Infinity;
  for (const b of (list || S.world.bodies)) {
    if (kind && b.userData && b.userData.kind !== kind) continue;
    const p = b.position || b;
    const d = p.distanceTo ? p.distanceTo(S.player.position)
                           : S.player.position.distanceTo(new THREE.Vector3(p.x, p.y, p.z));
    if (d < bd) { bd = d; best = b; }
  }
  return best ? { obj: best, dist: bd } : null;
};

/**
 * Nearest point on the nearest belt's mid-orbit, as a contact the rest of the game can
 * use. Same construction the HUD uses for its contacts list, deliberately — two different
 * ideas of what "the belt" is would diverge the moment either changed.
 */
function nearestBelt() {
  const list = fieldContacts(S.player.position);
  if (!list.length) return null;
  const c = list[0];
  return { name: c.name, dist: c.d, obj: c.obj };
}

// ── the tools ────────────────────────────────────────────────────────

export const TOOLS = {
  status: {
    desc: 'Report hull, shields, energy, cargo and credits.',
    args: [],
    run() {
      const p = S.player, st = S.stats;
      const pct = (v, m) => Math.round((v / Math.max(1, m)) * 100);
      return {
        text: `Hull ${pct(p.hull, st.hullMax)}%, armour ${pct(p.armor, st.armorMax)}%, ` +
              `shields ${pct(p.shield, st.shieldMax)}%, bank ${pct(p.energy, st.energyCap)}%. ` +
              `Hold ${Math.round(st.cargoCap - cargoFree())} of ${Math.round(st.cargoCap)} kg. ` +
              `${fmtCr(S.credits)} on the books.`,
        data: { hull: p.hull, shield: p.shield, energy: p.energy, credits: S.credits }
      };
    }
  },

  plotCourse: {
    desc: 'Set a warp course to a named body or station.',
    args: ['name'],
    run(name) {
      const target = bodyNamed(name);
      if (!target) return { text: `Nothing in this system called "${name}".`, ok: false };
      setCourse(target, target.userData.name);
      const wp = planCourse(S.player.position, target);
      const len = courseLength(S.player.position, target, wp);
      return {
        text: `Course laid to ${target.userData.name} — ${fmtKm(len)}` +
              (wp.length ? `, ${wp.length} correction${wp.length > 1 ? 's' : ''} around gravity wells.` : ', clear run.'),
        data: { name: target.userData.name, distance: len, waypoints: wp.length }
      };
    }
  },

  bestPrice: {
    desc: 'Find the station paying most for a commodity.',
    args: ['commodity'],
    run(commodity) {
      const key = String(commodity || 'ore').toLowerCase();
      if (!['ore', 'salvage', 'data'].includes(key)) return { text: `I do not price "${commodity}".`, ok: false };
      const best = bestMarket(key);
      if (!best) return { text: 'No market data.', ok: false };
      const sc = scarcity(best.station, key);
      const why = sc > 0.4 ? ' — they are short of it' : sc < -0.4 ? ' — though their stores are full' : '';
      const d = best.station.position.distanceTo(S.player.position);
      return {
        text: `${best.station.userData.name} pays ${fmtCr(best.price)} per unit for ${key}${why}. ` +
              `${fmtKm(d)} out.`,
        data: { station: best.station.userData.name, price: best.price, distance: d }
      };
    }
  },

  sellHere: {
    desc: 'What the docked or nearest station pays for what is in the hold.',
    args: [],
    run() {
      const st = S.docked || (nearest('station') || {}).obj;
      if (!st) return { text: 'No station in range.', ok: false };
      const lines = ['ore', 'salvage', 'data']
        .filter(k => S.cargo[k] > 0)
        .map(k => `${Math.round(S.cargo[k])} kg ${k} at ${fmtCr(marketPrice(st, k))}`);
      if (!lines.length) return { text: `${st.userData.name} is buying, but the hold is empty.` };
      return { text: `${st.userData.name}: ${lines.join(', ')}.`, data: { station: st.userData.name } };
    }
  },

  findBelt: {
    desc: 'Point at the nearest minable field and optionally fly there.',
    args: ['approach'],
    run(approach) {
      // A belt is not an object in the world — it is an orbital band, stored as an
      // inner radius and a width. The HUD already turns that into a synthetic contact at
      // the nearest point of the mid-orbit, and the tool has to build the *same* shape:
      // handing setTarget a raw band record gives the target panel something with no
      // position, and it fails several frames later somewhere that looks unrelated.
      const belt = nearestBelt();
      if (!belt) return { text: 'No field on the chart.', ok: false };
      // setTarget takes (obj, kind, name) and builds the descriptor itself — passing it
      // a ready-made descriptor wraps it a second time, and the double-wrapped target
      // then fails in the HUD several frames later reading a position that is one level
      // deeper than anything looks for it.
      setTarget(belt.obj, 'belt', belt.name);
      if (approach) startApproach();
      return {
        text: `${belt.name}, ${fmtKm(belt.dist)} out. ` + (approach ? 'Taking us in.' : 'Targeted.'),
        data: { name: belt.name, distance: belt.dist }
      };
    }
  },

  threats: {
    desc: 'Hostiles within sensor range, and how visible you are.',
    args: [],
    run() {
      const sig = playerSignature();
      const range = S.stats.sensor || 2000;
      const near = S.world.npcs
        .filter(n => n.userData.faction === 'hostile' && n.userData.hp > 0)
        .map(n => ({ n, d: n.position.distanceTo(S.player.position) }))
        .filter(x => x.d < range)
        .sort((a, b) => a.d - b.d);
      if (!near.length) {
        return { text: `Nothing hostile inside ${fmtKm(range)}. You are running ${signatureLabel(sig)}.`,
                 data: { count: 0, signature: sig } };
      }
      const first = near[0];
      return {
        text: `${near.length} hostile${near.length > 1 ? 's' : ''} in range — nearest is ` +
              `${first.n.userData.name} at ${fmtKm(first.d)}. You are running ${signatureLabel(sig)}.`,
        data: { count: near.length, nearest: first.n.userData.name, signature: sig }
      };
    }
  },

  contracts: {
    desc: 'Accepted work, deadlines and progress.',
    args: [],
    run() {
      const held = activeContracts();
      if (!held.length) {
        const st = S.docked;
        const offers = st ? boardFor(st).length : 0;
        return { text: st ? `Nothing accepted. ${offers} posting${offers === 1 ? '' : 's'} on this board.`
                          : 'Nothing accepted. Dock somewhere to see a board.' };
      }
      return {
        text: held.map(c =>
          `${c.title} — ${Math.round(contractProgress(c) * 100)}%, ${Math.round(timeLeft(c))}s left`).join('. '),
        data: { count: held.length }
      };
    }
  },

  standing: {
    desc: 'Where you stand with each bloc.',
    args: [],
    run() {
      const rows = reputationReport();
      return {
        text: rows.map(r => `${r.faction}: ${r.label}${r.hostile ? ' (shoot on sight)' : ''}`).join('. ') + '.',
        data: rows
      };
    }
  },

  pilot: {
    desc: 'Your own record — level, skills, licences.',
    args: [],
    run() {
      const sheet = characterSheet();
      if (!sheet) return { text: 'No pilot record on file.', ok: false };
      const top = sheet.skills.slice().sort((a, b) => b.rank - a.rank)[0];
      return {
        text: `${sheet.name}, ${sheet.lineage} ${sheet.career}, level ${sheet.level}. ` +
              `Strongest skill is ${top.key} at rank ${top.rank}. ` +
              `${sheet.points ? `${sheet.points} point${sheet.points > 1 ? 's' : ''} unspent. ` : ''}` +
              `Licensed for ${sheet.licences.join(', ') || 'nothing'}.`,
        data: sheet
      };
    }
  },

  link: {
    desc: 'Multiplayer link quality and who is simulating the system.',
    args: [],
    run() {
      const n = netReport();
      if (!n.connected) return { text: 'Flying solo — no relay.' };
      return {
        text: `Linked with ${n.pilots} other pilot${n.pilots === 1 ? '' : 's'}. ` +
              `Round trip ${n.rtt} ms. ` +
              (n.isHost ? 'You are simulating the system for everyone.'
                        : `Pilot ${n.host} is simulating the system.`),
        data: n
      };
    }
  },

  performance: {
    desc: 'Frame rate and where the time is going.',
    args: [],
    run() {
      const p = perfStats();
      return {
        text: `${p.fps} fps, ${p.avg} ms average, ${p.p95} ms at the 95th percentile.` +
              (p.stalls ? ` ${p.stalls} dropped catch-up.` : ''),
        data: p
      };
    }
  }
};

// ── crew and diagnostics (v1.01.30) ──────────────────────────────────
// ARIA is the natural place for this: a player asking "how is my crew" wants an *answer*,
// and a panel can only show them numbers. These tools return the ranked causes rather than
// the raw series, because the ranking is the part a person can act on.

TOOLS.crew_watch = {
  desc: 'Report the roster by who needs attention first, with morale and fatigue trends.',
  args: [],
  run() {
    const v = crewVitals();
    if (!v.count) return { text: 'No crew aboard — the ship is running on automation.', data: v };
    const rows = watchReport().slice(0, 4);
    const line = rows.map(r =>
      `${r.name} (${r.post}) morale ${Math.round(r.morale * 100)}% ${r.moraleTrend}` +
      `${r.fatigue > 0.5 ? `, fatigue ${Math.round(r.fatigue * 100)}%` : ''}`).join('; ');
    return {
      text: `${v.count} aboard, ${v.onDuty} on watch. Average morale ${Math.round(v.morale * 100)}%. ` +
            (v.atRisk ? `${v.atRisk} needing attention: ${line}.` : `Nobody needs attention. ${line}.`),
      data: v
    };
  }
};

TOOLS.crew_why = {
  desc: 'Explain why a named crew member\'s morale is where it is.',
  args: ['name'],
  run(name) {
    const c = (S.crew || []).find(x => x.name.toLowerCase().includes(String(name || '').toLowerCase()));
    if (!c) return { text: `Nobody aboard by that name.`, data: null };
    const d = crewDiagnosis(c.id, 'morale');
    if (!d.worst.length && !d.best.length) {
      return { text: `${c.name} is at ${Math.round((c.morale ?? 1) * 100)}% and nothing has moved it lately.`, data: d };
    }
    const worst = d.worst.map(w => `${w.cause} (${w.delta.toFixed(2)})`).join(', ');
    const best = d.best.map(w => `${w.cause} (+${w.delta.toFixed(2)})`).join(', ');
    return {
      text: `${c.name} is at ${Math.round((c.morale ?? 1) * 100)}% and ${d.trend.direction}.` +
            (worst ? ` Costing them: ${worst}.` : '') +
            (best ? ` Helping: ${best}.` : ''),
      data: d
    };
  }
};

TOOLS.diagnostics = {
  desc: 'Report the flight log: what has been recorded and what is going wrong.',
  args: [],
  run() {
    const d = diagnostics();
    const probs = d.problems.length
      ? ' Recent problems: ' + d.problems.map(p => p.msg).join('; ') + '.'
      : ' Nothing at warning level or above.';
    return {
      text: `${d.held} entries held of ${d.cap}${d.dropped ? `, ${d.dropped} rolled off` : ''}. ` +
            `Level ${d.level}.` + probs,
      data: d
    };
  }
};

// ── executive fleet command (v1.01.73) ───────────────────────────────
// These tools share the command-menu resolver with the Ops dialogue tree.
// A button click and a spoken request therefore emit identical structured orders.

TOOLS.fleet_status = {
  desc: 'List running fleet objectives with timers and modes.',
  args: [],
  run() {
    if (!hasCompany()) return { text: 'No company on file — fleet command is an executive surface.', ok: false };
    const list = fleetOrderReport();
    if (!list.length) return { text: 'No fleet objectives running.', data: [] };
    return {
      text: list.map(f =>
        `${f.asset}: ${f.name}` +
        (f.remaining > 0 ? ` · ${f.remaining}s left` : ' · until recalled') +
        (f.mode === 'passive' ? ' (passive)' : '')
      ).join(' · '),
      data: list
    };
  }
};

TOOLS.fleet_dispatch = {
  desc: 'Dispatch a fleet objective from plain language (patrol, extract, logistics, escort, survey, station-keep).',
  args: ['request'],
  run(request) {
    if (!hasCompany()) return { text: 'No company on file — incorporate first.', ok: false };
    const r = commandFromText(String(request || ''));
    return { text: r.text, ok: r.ok, data: r.order || null };
  }
};

TOOLS.fleet_recall = {
  desc: 'Recall a running fleet objective by asset name, type, or "last".',
  args: ['query'],
  run(query) {
    if (!hasCompany()) return { text: 'No company on file.', ok: false };
    const r = commandRecall(query);
    return { text: r.text, ok: r.ok, data: r.orderId || null };
  }
};

TOOLS.command_menu = {
  desc: 'Summarise the executive command dialogue desks and available leaves.',
  args: [],
  run() {
    const cat = commandCatalogue();
    const desks = cat.branches.map(b => b.label).join(', ');
    return {
      text: `Command desks: ${desks}. ${cat.leaves.length} dispatchable orders. ` +
            `${cat.active.length} objective(s) running.`,
      data: cat
    };
  }
};

// ── the executive surface (v1.01.80) ─────────────────────────────────
// ARIA reaches the whole executive layer, but not with the same authority the Ops panel
// has, and the split is deliberate.
//
// The rule the tool list has followed since it existed: a small model will occasionally
// misread a request, and the cost of that must never be more than a course you did not
// want. Registering a charter spends the pilot's own credits and signing a hull spends the
// treasury, so neither is a tool — they are *reports* that tell you what is on offer and
// where to commit it. Ending a contract is the same shape in reverse: undoing it costs the
// signing fee again, so it stays in Ops too.
//
// What ARIA does execute is everything reversible: dispatching an objective, recalling
// one, and setting the mode a hull defaults to. `test/tools.mjs` enforces the split by
// name and by running every tool and checking no resource moved.

TOOLS.charter_options = {
  desc: 'Report the charters the current station will register, and what registration costs.',
  args: [],
  run() {
    if (hasCompany()) return { text: 'You already hold a charter.', data: null };
    const reg = registrarBrief();
    if (!reg.ok) return { text: reg.reason, ok: false };
    return {
      text: `Charters available at ${reg.station}: ` +
            reg.charters.map(c => `${c.key} (${c.name})`).join(', ') +
            `. ${fmtCr(reg.fee)} from your own credits, ${fmtCr(reg.treasury)} of it into the ` +
            `treasury. Register from Ops → Staff.`,
      data: reg
    };
  }
};

TOOLS.fleet_roster = {
  desc: 'List hulls under company contract, their roles, modes and whether they are on an objective.',
  args: [],
  run() {
    if (!hasCompany()) return { text: 'No company on file — register a charter first.', ok: false };
    const list = fleetRoster();
    if (!list.length) return { text: fleetBrief(), data: [] };
    return {
      text: list.map(h =>
        `${h.name} (${h.role}, ${h.mode})` + (h.busy ? ' — on objective' : ' — idle')
      ).join(' · '),
      data: list
    };
  }
};

TOOLS.fleet_candidates = {
  desc: 'Report which hulls in sensor range would sign a company contract, and what each would cost.',
  args: [],
  run() {
    if (!hasCompany()) return { text: 'No company on file — register a charter first.', ok: false };
    const open = hullsAvailable(8);
    if (!open.length) return { text: 'No hulls in range will sign right now. Hostiles do not take company work.', data: [] };
    return {
      text: 'Will sign: ' + open.map(c => `${c.npcName} (${c.role}, ${fmtKm(c.dist)}, ${fmtCr(c.fee)})`).join(' · ') +
            '. Sign them from Ops → Staff.',
      data: open
    };
  }
};

TOOLS.fleet_mode = {
  desc: 'Set the mode a contracted hull defaults to on its next objective — active or passive.',
  args: ['name', 'mode'],
  run(name, mode) {
    if (!hasCompany()) return { text: 'No company on file — incorporate first.', ok: false };
    const q = String(name || '').toLowerCase();
    const hit = fleetRoster().find(h => h.name.toLowerCase() === q) ||
                fleetRoster().find(h => h.name.toLowerCase().includes(q));
    if (!hit) return { text: `No contracted hull called "${name}".`, ok: false };
    const r = commandHullMode(hit.id, String(mode || '').toLowerCase() === 'passive' ? 'passive' : 'active');
    return { text: r.text, ok: r.ok };
  }
};

TOOLS.aria_corpus = {
  desc: 'Report what the self-training loop has to work with — written examples versus harvested ones.',
  args: [],
  run() {
    return { text: trainingBrief() };
  }
};


export const TOOL_KEYS = Object.keys(TOOLS);

/**
 * Invoke a tool by name. Never throws: a tool that fails returns a sentence saying so,
 * because an assistant that crashes the panel is worse than one that says "I cannot".
 */
export function callTool(name, args = []) {
  const tool = TOOLS[name];
  if (!tool) return { text: `No such instrument: ${name}.`, ok: false, tool: name };
  try {
    const out = tool.run.apply(null, args);
    return Object.assign({ ok: true, tool: name }, out);
  } catch (e) {
    return { text: `The ${name} instrument is not responding.`, ok: false, tool: name,
             error: e && e.message };
  }
}

// ── matching without a model ─────────────────────────────────────────
// Ordered most specific first. This is a matcher, not a parser: it exists so the tools
// work on a device that will never download a model, and so the panel answers instantly
// while one is still loading. The model's job is to make the phrasing flexible, not to
// make the feature exist.

const PATTERNS = [
  // Executive fleet commands — specific enough not to steal pilot navigation phrases
  // like "send me to the belt". Require a fleet verb or an objective noun.
  [/\b(recall|cancel|abort)\b.*\b(fleet|patrol|escort|hauler|cutter|objective|order|wing)\b/i,
   m => ['fleet_recall', [m[0]]]],
  [/\b(recall|cancel)\b\s+(last|all|patrol|escort|extract|logistics|hauler|cutter)\b/i,
   m => ['fleet_recall', [m[2] || 'last']]],
  [/\b(fleet status|objectives? running|what is the fleet doing)\b/i, () => ['fleet_status', []]],
  [/\b(command menu|command desks?|what can i dispatch)\b/i, () => ['command_menu', []]],
  [/\b(dispatch|assign)\b.+\b(patrol|escort|extract|haul|logistics|survey|station[- ]?keep|wing|cutter|hauler)\b/i,
   m => ['fleet_dispatch', [m[0]]]],
  [/\b(send|order)\b.+\b(patrol|escort|cutter|hauler|wing|fleet)\b.+/i,
   m => ['fleet_dispatch', [m[0]]]],
  [/\b(patrol the|start a patrol|escort the|station[- ]?keep|logistics run|haul cargo|extract ore|mining quota|survey pass|lane watch)\b.+/i,
   m => ['fleet_dispatch', [m[0]]]],
  [/\b(patrol|escort)\b.*\b(sector|station|lane|30|90|seconds?|minutes?)\b/i,
   m => ['fleet_dispatch', [m[0]]]],

  // Mining comes before course-plotting on purpose: "take me to the belt" matches both,
  // and the specific answer is the useful one. Ordering is the whole disambiguation
  // strategy here — a matcher that tried to score every pattern would be a parser, and a
  // parser is what the model is for.
  [/\b(belt|asteroids?|rocks?|mining?)\b.*\b(take|fly|go|approach|head)\b/i, () => ['findBelt', [true]]],
  [/\b(take|fly|go|head)\b.*\b(belt|asteroids?|rocks?|mine|mining)\b/i, () => ['findBelt', [true]]],
  [/\b(belt|asteroids?|rocks?)\b|\bwhere\b.*\bmine\b/i, () => ['findBelt', [false]]],

  [/\b(course|plot|navigate|set course|take me|fly|head)\b.*?\b(?:to|for)\s+([a-z0-9' -]+)/i,
   m => ['plotCourse', [m[2].trim().replace(/[.?!]+$/, '')]]],

  [/\b(where|who|best)\b.*\b(sell|price|buy|pays?|paying)\b.*\b(ore|salvage|data)\b/i,
   m => ['bestPrice', [m[3]]]],
  [/\b(ore|salvage|data)\b.*\b(sell|price|worth|pays?)\b/i, m => ['bestPrice', [m[1]]]],
  [/\b(sell|price|pays?|paying|buying|market)\b.*\b(here|this station|docked|local)\b/i,
   () => ['sellHere', []]],
  [/\b(here|this station|local)\b.*\b(sell|price|pays?|paying|buying|worth)\b/i,
   () => ['sellHere', []]],

  [/\b(threats?|hostiles?|pirates?|drones?|danger|enemies|enemy)\b/i, () => ['threats', []]],
  [/\b(am i (seen|visible|hidden)|signature|how loud)\b/i, () => ['threats', []]],
  [/\b(contracts?|jobs?|work|deadlines?|board|assignments?)\b/i, () => ['contracts', []]],
  [/\b(standing|reputation|factions?|blocs?|who likes)\b/i, () => ['standing', []]],
  [/\b(skills?|levels?|licen[cs]es?|my record|who am i|my pilot)\b/i, () => ['pilot', []]],
  [/\b(links?|multiplayer|relays?|pings?|hosts?|latency)\b/i, () => ['link', []]],
  [/\b(fps|frames?|performance|lag|stutter)\b/i, () => ['performance', []]],
  [/\b(status|report|how are we|ship state|hulls?|shields?|armou?r)\b/i, () => ['status', []]]
];

/** @returns {{tool:string, args:Array}|null} */
export function matchTool(text) {
  const q = String(text || '');
  for (const [re, build] of PATTERNS) {
    const m = q.match(re);
    if (m) {
      const [tool, args] = build(m);
      return { tool, args };
    }
  }
  return null;
}

/** Try to answer with a tool. Returns null when nothing matches, so the caller falls through. */
export function tryTool(text) {
  const hit = matchTool(text);
  if (!hit) return null;
  return callTool(hit.tool, hit.args);
}

/** The tool list, for a model prompt or for a help panel. */
export function toolManifest() {
  return TOOL_KEYS.map(k => ({ name: k, desc: TOOLS[k].desc, args: TOOLS[k].args }));
}
