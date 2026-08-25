// Living Galaxy — automated site managers. **Experimental branch.**
//
// Behind MANAGERS.enabled, off by default, and the flag is checked at every entry point
// rather than at boot — a save made with the branch on has to load with it off and simply
// have inert managers, not a corrupt site.
//
// What this is: a per-branch policy engine that runs a planetary site while the player is
// elsewhere. What it is deliberately *not*: a solver. A solver would find the optimal site
// and there would be nothing left to decide. Each archetype instead runs an **ordered
// policy list** — walk the list, apply the first policy that fires, log why. That gives
// three properties worth more than optimality:
//
//   1. Behaviour is explainable. Every action carries the policy name that produced it,
//      so the ops panel can say "idled the smelter — preventJam" rather than "changed".
//   2. Archetypes genuinely differ. A Foreman and a Factor looking at the same brownout
//      hit different policies first and take opposite actions, because their lists differ.
//   3. It is cheap. Twenty sites at one pass per game hour costs nothing on a phone.
//
// The optimisation pass is the second half, and it is the part that makes a manager worth
// installing rather than a toggle worth flipping: once every MANAGERS.optimiseEvery
// passes, the manager re-scores the whole site against its own weights and rebalances
// what is on and what is off. That is the per-manager tuning the branch is for.

import { S } from '../core/state.js';
import { MANAGERS } from '../core/config.js';
import { MANAGER_ARCHETYPES, AUTONOMY, archetypeFor } from '../data/managers.js';
import { FACILITIES } from '../data/planetary/index.js';
import { siteById, sites, powerSatisfaction, powerDraw, powerSupply,
         stored, storageCap, workforce, installFacility, toggleFacility } from './planetary.js';
import { fund, hasCompany } from './company.js';
import { toast, status } from '../ui/toast.js';

export const enabled = () => !!MANAGERS.enabled;
export function setExperimental(on) {
  MANAGERS.enabled = !!on;
  S.settings.experimental = !!on;
  status(on ? 'Experimental subsystems enabled' : 'Experimental subsystems disabled');
  return MANAGERS.enabled;
}

const table = () => (S.managers = S.managers || {});
export const managerFor = siteId => table()[siteId] || null;
export const managerCount = () => Object.keys(table()).length;

// ── installing ───────────────────────────────────────────────────────

/**
 * Put a manager on a site. Branch decides the archetype, and the archetype is not
 * changeable afterwards — hiring a different person is what changing your mind looks like.
 */
export function installManager(siteId, branch, { autonomy = 1, paidBy = 'wallet' } = {}) {
  if (!enabled()) { toast('Experimental subsystems are off'); return null; }
  const site = siteById(siteId);
  if (!site) return null;
  if (table()[siteId]) { toast(`${site.body} already has a manager`); return null; }

  const arch = archetypeFor(branch);
  const cost = MANAGERS.hireCost;
  if (paidBy === 'company' && hasCompany()) {
    if (!fund(cost, arch.key)) { toast('The treasury cannot cover that hire'); return null; }
  } else {
    if (S.credits < cost) { toast('Not enough credits to hire a manager'); return null; }
    S.credits -= cost;
  }

  const m = {
    siteId, branch: arch.key,
    autonomy: Math.max(0, Math.min(MANAGERS.maxAutonomy, autonomy | 0)),
    hours: 0, passes: 0,
    actions: [],                 // rolling log, newest last
    score: 0, lastScore: 0
  };
  table()[siteId] = m;
  toast(`${arch.name} installed on ${site.body}`, 4200);
  return m;
}

export function dismissManager(siteId) {
  const t = table();
  if (!t[siteId]) return false;
  delete t[siteId];
  return true;
}

export function setAutonomy(siteId, level) {
  const m = table()[siteId];
  if (!m) return false;
  m.autonomy = Math.max(0, Math.min(MANAGERS.maxAutonomy, level | 0));
  return true;
}

// ── scoring ──────────────────────────────────────────────────────────
//
// One number per site, per archetype. It is not a truth — it is *that manager's opinion*,
// and the whole point is that the five archetypes disagree about the same site.

export function scoreSite(site, arch) {
  const w = arch.weights;
  const power = powerSatisfaction(site);
  const cap = storageCap(site);
  const fill = cap > 0 ? stored(site) / cap : 0;
  const live = site.facilities.filter(f => f.on !== false && f.remaining <= 0).length;
  const total = Math.max(1, site.facilities.length);
  const upkeepDraw = powerDraw(site);
  const supply = Math.max(1, powerSupply(site));

  const throughput = live / total;
  const headroom = 1 - Math.min(1, fill);
  const efficiency = Math.min(1, supply > 0 ? upkeepDraw / supply : 0);
  const crew = Math.min(1, workforce(site) / 200);

  let s = 0, denom = 0;
  const add = (key, value) => { const k = w[key] || 0; if (k) { s += k * value; denom += k; } };
  add('throughput', throughput);
  add('power', power);
  add('storage', headroom);
  add('upkeep', 1 - efficiency * 0.5);
  add('workforce', crew);
  return denom > 0 ? s / denom : 0;
}

// ── policies ─────────────────────────────────────────────────────────
//
// Each returns an action object when it fires, or null. They never mutate directly at
// autonomy 0 — `apply()` is the only thing that touches the site, and it checks the rung.

const POLICIES = {
  /** Below the archetype's power tolerance: turn the least valuable thing off. */
  shedNonEssential(site, arch) {
    if (powerSatisfaction(site) >= arch.tolerance.power) return null;
    const victim = rankFacilities(site, arch).filter(x => x.inst.on !== false).pop();
    if (!victim) return null;
    return { policy: 'shedNonEssential', kind: 'toggle', index: victim.index, to: false,
             why: `brownout at ${(powerSatisfaction(site) * 100) | 0}% — idled ${victim.f.name}` };
  },

  /** Store filling past tolerance: throttle the extractors, not the refiners. */
  preventJam(site, arch) {
    const cap = storageCap(site);
    if (!cap) return null;
    const fill = stored(site) / cap;
    if (fill < arch.tolerance.storage) return null;
    const ext = site.facilities
      .map((inst, index) => ({ inst, index, f: FACILITIES[inst.id] }))
      .filter(x => x.f && x.f.extracts && x.inst.on !== false);
    if (!ext.length) return null;
    return { policy: 'preventJam', kind: 'toggle', index: ext[0].index, to: false,
             why: `store ${(fill * 100) | 0}% full — throttled ${ext[0].f.name}` };
  },

  /** Store has drained and something is idle for no reason: turn it back on. */
  feedRefiners(site, arch) {
    const cap = storageCap(site);
    const fill = cap > 0 ? stored(site) / cap : 0;
    if (fill > arch.tolerance.storage * 0.7) return null;
    if (powerSatisfaction(site) < arch.tolerance.power) return null;
    const off = site.facilities
      .map((inst, index) => ({ inst, index, f: FACILITIES[inst.id] }))
      .find(x => x.f && x.inst.on === false && x.inst.remaining <= 0);
    if (!off) return null;
    return { policy: 'feedRefiners', kind: 'toggle', index: off.index, to: true,
             why: `capacity available — restarted ${off.f.name}` };
  },

  /** Keep headroom rather than run at the edge. The garrison behaviour. */
  reservePower(site, arch) {
    const sat = powerSatisfaction(site);
    if (sat >= MANAGERS.brownoutTarget) return null;
    const victim = rankFacilities(site, arch).filter(x => x.inst.on !== false).pop();
    if (!victim) return null;
    return { policy: 'reservePower', kind: 'toggle', index: victim.index, to: false,
             why: `holding reserve — idled ${victim.f.name}` };
  },

  /** Anything whose draw buys nothing gets idled on economic grounds. */
  cullUneconomic(site) {
    const dead = site.facilities
      .map((inst, index) => ({ inst, index, f: FACILITIES[inst.id] }))
      .find(x => x.f && x.inst.on !== false && x.inst.remaining <= 0 &&
                 !x.f.extracts && !x.f.refines && !x.f.manufactures && (x.f.power || 0) > 0);
    if (!dead) return null;
    return { policy: 'cullUneconomic', kind: 'toggle', index: dead.index, to: false,
             why: `${dead.f.name} draws power and returns nothing — idled` };
  },

  /** Habitation is never the thing that gets switched off. */
  protectHabitation(site) {
    const hab = site.facilities
      .map((inst, index) => ({ inst, index, f: FACILITIES[inst.id] }))
      .find(x => x.f && supplyPop(x.f) > 0 && x.inst.on === false);
    if (!hab) return null;
    return { policy: 'protectHabitation', kind: 'toggle', index: hab.index, to: true,
             why: `${hab.f.name} restored — people first` };
  },

  /** Build a reactor when power is the binding constraint. Needs autonomy 2. */
  raisePower(site, arch) {
    if (powerSatisfaction(site) >= arch.tolerance.power) return null;
    const reactor = Object.values(FACILITIES)
      .filter(f => supplyPower(f) > 0)
      .sort((a, b) => (a.hours || 0) - (b.hours || 0))[0];
    if (!reactor) return null;
    return { policy: 'raisePower', kind: 'build', facility: reactor.id, needs: 2,
             why: `power short — queued ${reactor.name}` };
  },

  /** Munitions stay stocked whether or not anything is shooting. */
  stockMunitions(site) {
    const plant = site.facilities
      .map((inst, index) => ({ inst, index, f: FACILITIES[inst.id] }))
      .find(x => x.f && x.f.manufactures && x.f.manufactures.includes('ammo') && x.inst.on === false);
    if (!plant) return null;
    return { policy: 'stockMunitions', kind: 'toggle', index: plant.index, to: true,
             why: `${plant.f.name} back online — readiness` };
  },

  /** Spend spare slots on more extraction while there is headroom to hold the output. */
  expandExtraction(site, arch) {
    const cap = storageCap(site);
    const fill = cap > 0 ? stored(site) / cap : 0;
    if (fill > MANAGERS.reserveFloor * 2) return null;
    const drill = Object.values(FACILITIES)
      .filter(f => f.branch === arch.key && f.extracts)
      .sort((a, b) => (a.hours || 0) - (b.hours || 0))[0];
    if (!drill) return null;
    return { policy: 'expandExtraction', kind: 'build', facility: drill.id, needs: 2,
             why: `store has room — queued ${drill.name}` };
  }
};

// Facilities declare what they give the site under `effect`, so a reactor is
// `effect.power` and a habitation block is `effect.population`. Two readers rather than
// two spellings scattered through the policies.
const supplyPower = f => (f && f.effect && f.effect.power) || 0;
const supplyPop   = f => (f && f.effect && f.effect.population) || 0;

/** Facilities worst-first by this archetype's weights — the shed list. */
function rankFacilities(site, arch) {
  return site.facilities
    .map((inst, index) => ({ inst, index, f: FACILITIES[inst.id] }))
    .filter(x => x.f)
    .map(x => {
      let v = 0;
      if (x.f.extracts) v += (arch.weights.throughput || 0) * 1.0;
      if (x.f.refines) v += (arch.weights.throughput || 0) * 1.2;
      if (x.f.manufactures) v += (arch.weights.throughput || 0) * 1.1;
      if (supplyPop(x.f)) v += (arch.weights.workforce || 0.2) * 2.0;
      if (supplyPower(x.f)) v += (arch.weights.power || 0) * 3.0;
      v -= ((x.f.power || 0) / 200) * (arch.weights.upkeep || 0);
      return Object.assign(x, { value: v });
    })
    .sort((a, b) => b.value - a.value);
}

// ── the pass ─────────────────────────────────────────────────────────

function apply(m, site, action) {
  if (!action) return null;
  const needs = action.needs || 1;
  if (m.autonomy < needs) {
    return Object.assign({}, action, { applied: false, advisory: true });
  }
  let applied = false;
  if (action.kind === 'toggle') {
    const inst = site.facilities[action.index];
    if (inst && (inst.on !== false) !== action.to) { toggleFacility(site.id, action.index); applied = true; }
  } else if (action.kind === 'build') {
    applied = !!installFacility(site.id, action.facility);
  }
  return Object.assign({}, action, { applied, advisory: false });
}

function log(m, action) {
  if (!action) return;
  m.actions.push({ t: Math.round(S.playtime), policy: action.policy, why: action.why,
                   applied: !!action.applied, advisory: !!action.advisory });
  if (m.actions.length > 24) m.actions.splice(0, m.actions.length - 24);
}

/**
 * Full re-optimisation. Runs every MANAGERS.optimiseEvery passes and is the per-archetype
 * tuning proper: score the site, then walk the ranked list turning things on from the top
 * until the archetype's power tolerance would break, and off from the bottom otherwise.
 */
function optimise(m, site, arch) {
  const ranked = rankFacilities(site, arch);
  const supply = powerSupply(site);
  let budget = supply * arch.tolerance.power;
  let changed = 0;

  for (const x of ranked) {
    if (x.inst.remaining > 0) continue;
    const draw = x.f.power || 0;
    const want = draw <= budget;
    if (want) budget -= draw;
    const on = x.inst.on !== false;
    if (want !== on && m.autonomy >= 1) { toggleFacility(site.id, x.index); changed++; }
  }
  if (changed) {
    log(m, { policy: 'optimise', applied: true,
             why: `full rebalance — ${changed} facilit${changed === 1 ? 'y' : 'ies'} re-seated ` +
                  `for ${arch.objective}` });
  }
  return changed;
}

/** Advance every manager by `hours` of game time. Called from the sim phase. */
export function updateManagers(hours) {
  if (!enabled() || !(hours > 0)) return;
  const t = table();
  for (const key in t) {
    const m = t[key];
    const site = siteById(m.siteId);
    if (!site || site.buildRemaining > 0) continue;
    m.hours += hours;
    if (m.hours < MANAGERS.tickHours) continue;
    m.hours = 0;
    m.passes++;

    const arch = archetypeFor(m.branch);
    m.lastScore = m.score;
    m.score = scoreSite(site, arch);

    if (m.passes % MANAGERS.optimiseEvery === 0) { optimise(m, site, arch); continue; }

    for (const name of arch.policies) {
      const fn = POLICIES[name];
      if (!fn) continue;
      const action = fn(site, arch);
      if (!action) continue;
      log(m, apply(m, site, action));
      break;                                   // one action per pass — legible, not frantic
    }
  }
}

// ── reporting ────────────────────────────────────────────────────────

export function managerReport(siteId) {
  const m = table()[siteId];
  if (!m) return null;
  const site = siteById(m.siteId);
  const arch = archetypeFor(m.branch);
  return {
    site: site ? site.body : '—',
    siteId: m.siteId,
    archetype: arch.name,
    icon: arch.icon,
    objective: arch.objective,
    blurb: arch.blurb,
    autonomy: m.autonomy,
    autonomyName: (AUTONOMY[m.autonomy] || AUTONOMY[0]).name,
    passes: m.passes,
    score: m.score,
    trend: m.score - m.lastScore,
    actions: m.actions.slice(-8).reverse()
  };
}

export const managersReport = () => Object.keys(table()).map(id => managerReport(id)).filter(Boolean);

/** What each archetype would say about a site it does not manage — the hiring screen. */
export function auditions(siteId) {
  const site = siteById(siteId);
  if (!site) return [];
  return Object.values(MANAGER_ARCHETYPES).map(arch => ({
    key: arch.key, name: arch.name, icon: arch.icon, blurb: arch.blurb,
    objective: arch.objective,
    score: scoreSite(site, arch),
    firstMove: firstMoveOf(site, arch)
  })).sort((a, b) => b.score - a.score);
}

function firstMoveOf(site, arch) {
  for (const name of arch.policies) {
    const fn = POLICIES[name];
    if (!fn) continue;
    const a = fn(site, arch);
    if (a) return a.why;
  }
  return 'nothing — the site is already where I would want it';
}

// ── persistence ──────────────────────────────────────────────────────

export const serializeManagers = () => (Object.keys(table()).length ? table() : null);

export function restoreManagers(data) {
  S.managers = {};
  if (!data) return false;
  for (const key in data) {
    const m = data[key];
    if (!m || !MANAGER_ARCHETYPES[m.branch]) continue;
    S.managers[key] = Object.assign({ hours: 0, passes: 0, actions: [], score: 0, lastScore: 0 }, m);
  }
  return true;
}

/** Managers whose site no longer exists are dropped rather than left orphaned. */
export function reconcileManagers() {
  const live = new Set(sites().map(s => String(s.id)));
  const t = table();
  for (const key in t) if (!live.has(String(key))) delete t[key];
}
