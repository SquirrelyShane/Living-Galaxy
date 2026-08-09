// Living Galaxy — research: turning what you looked at into what you know.
//
// See `src/data/research.js` for the design argument. The short version: survey data had
// exactly one sink — selling it — and blueprints had no gate at all, so a pilot's entire
// scanning career resolved to a commodity price and their manufacturing options were
// decided on their first hour.
//
// ── findings are derived from the body, not from a table ─────────────
// `fileFindings()` reads a world's own traits and its discovered surface features. There is
// no map of planet names to research categories to maintain, which matters because the
// planet table has grown twice and a whitelist would have quietly stopped covering it —
// the same failure that made `planetInfo()` speak a dead vocabulary until v1.00.40.
//
// ── one project at a time ────────────────────────────────────────────
// A queue would make research a background process a player sets and forgets. One at a time
// makes it a choice about what to know next, which is the only interesting question the
// system has.

import { S } from '../core/state.js';
import { RESEARCH, CRAFT } from '../core/config.js';
import { PROJECTS, PROJECT_KEYS, FINDINGS, FINDING_KEYS, GATED } from '../data/research.js';
import { traits } from '../data/planetary/traits.js';
import { worldOf, knownFeatures } from './survey.js';
import { FEATURES } from '../data/features.js';
import { logInfo, logNotice } from '../core/log.js';
import { toast, status } from '../ui/toast.js';
import { sfx } from './audio.js';
import { recalcStats, registerResearchBonuses } from '../core/state.js';

const CH = 'research';

export function lab() {
  if (!S.research) S.research = { findings: {}, done: [], active: null };
  if (!S.research.findings) S.research.findings = {};
  if (!Array.isArray(S.research.done)) S.research.done = [];
  return S.research;
}

export const findings = () => lab().findings;
export const findingCount = kind => lab().findings[kind] || 0;
export const isDone = id => lab().done.includes(id);
export const activeProject = () => lab().active;

// ── gathering ────────────────────────────────────────────────────────

/**
 * What kinds of finding a body yields, read off its own physics.
 *
 * A world can produce several — a cryovolcanic moon is cold *and* geologically active, and
 * pretending it is only one of those would make the outer system a single category.
 */
export function kindsOf(body) {
  const w = worldOf(body);
  const t = traits(w.type) || {};
  const out = new Set();

  if (w.tempC >= RESEARCH.hotAbove) out.add('thermal');
  if (w.tempC <= RESEARCH.coldBelow) out.add('cryo');
  if (t.solid) out.add('geologic');
  if (t.atmo || t.gas) out.add('atmos');
  if (t.water || t.temperate) out.add('biotic');

  // Features are the specific evidence. An anomaly is the only route to exotic findings,
  // which is what makes a Lagrange point worth the trip rather than a curiosity.
  for (const k of knownFeatures(body)) {
    const f = FEATURES[k];
    if (!f) continue;
    if (f.anomaly) out.add('exotic');
    if (/vent|volcan|lava/i.test(f.name)) out.add('thermal');
    if (/cryo|ice|brine/i.test(f.name)) out.add('cryo');
    if (/mat|biome|vent field/i.test(f.name)) out.add('biotic');
  }

  // Everything is at least a rock somebody looked at closely.
  if (!out.size) out.add('geologic');
  return [...out];
}

/**
 * File findings from a probe. Called by `probePlanet()`.
 *
 * Once per body: a pilot who probes the same moon eight times has not learned eight times as
 * much about cold, and without this the whole system collapses into farming the nearest
 * convenient world.
 */
export function fileFindings(body, source = 'probe') {
  const l = lab();
  const name = (body && body.userData && body.userData.name) || 'unknown';
  l.seen = l.seen || {};
  if (l.seen[name]) return [];
  l.seen[name] = true;

  const kinds = kindsOf(body);
  for (const k of kinds) l.findings[k] = (l.findings[k] || 0) + 1;
  logInfo(CH, `Findings from ${name}`, { source, name, kinds });
  return kinds;
}

/** File an exotic finding directly. Anomalies are the one source that is not a world. */
export function fileExotic(label) {
  const l = lab();
  l.findings.exotic = (l.findings.exotic || 0) + 1;
  logInfo(CH, `Exotic telemetry — ${label}`, { kinds: ['exotic'], source: 'anomaly' });
  return true;
}

// ── projects ─────────────────────────────────────────────────────────

export function projectBlocker(id) {
  const p = PROJECTS[id];
  if (!p) return 'unknown project';
  if (isDone(id)) return 'complete';
  if (lab().active) return 'lab busy';
  for (const req of (p.requires || [])) {
    if (!isDone(req)) return 'needs ' + PROJECTS[req].name;
  }
  for (const kind in (p.needs || {})) {
    if (findingCount(kind) < p.needs[kind]) {
      return `needs ${p.needs[kind] - findingCount(kind)} more ${FINDINGS[kind].name.toLowerCase()}`;
    }
  }
  if (S.cargo.data < p.data) return `needs ${Math.ceil(p.data - S.cargo.data)} kg data`;
  return null;
}

/** Everything the lab could show, with why each one is or is not available. */
export const projectList = () => PROJECT_KEYS.map(id => ({
  id, ...PROJECTS[id], done: isDone(id), blocker: projectBlocker(id)
}));

export function startProject(id) {
  const why = projectBlocker(id);
  if (why) { toast(why); sfx.deny(); return false; }
  const p = PROJECTS[id];
  // The telemetry is consumed. Research is what survey data is *for*, and a project that
  // left the cargo in the hold to be sold afterwards would be a free upgrade.
  S.cargo.data = Math.max(0, S.cargo.data - p.data);
  for (const kind in (p.needs || {})) {
    lab().findings[kind] -= p.needs[kind];
  }
  lab().active = { id, left: p.hours };
  logNotice(CH, `Research begun — ${p.name}`, { id, hours: p.hours });
  status(`Research — ${p.name}`);
  toast(`${p.name} under way — ${p.hours}h`);
  sfx.pickup();
  return true;
}

/** Abandon. The telemetry is already spent — stopping does not give it back. */
export function cancelProject() {
  const a = lab().active;
  if (!a) return false;
  lab().active = null;
  logNotice(CH, `Research abandoned — ${PROJECTS[a.id].name}`, { id: a.id });
  toast(`${PROJECTS[a.id].name} abandoned — the telemetry is gone`);
  return true;
}

export function updateResearch(dt) {
  const a = lab().active;
  if (!a) return false;
  a.left -= dt * CRAFT.gameHoursPerSecond;
  if (a.left > 0) return false;

  lab().active = null;
  lab().done.push(a.id);
  const p = PROJECTS[a.id];
  logNotice(CH, `Research complete — ${p.name}`, { id: a.id, unlocks: p.unlocks || [] });
  toast(`${p.name} complete` +
        ((p.unlocks || []).length ? ` — ${p.unlocks.length} blueprints released` : ''), 4600);
  sfx.pickup();
  recalcStats();
  return true;
}

// ── what it bought you ───────────────────────────────────────────────

/**
 * The accumulated effects of everything researched, in the same shape `fitBonuses()` returns
 * so `recalcStats()` can add them without learning what a research project is.
 */
export function researchBonuses() {
  const out = {};
  for (const id of lab().done) {
    const e = PROJECTS[id] && PROJECTS[id].effects;
    for (const k in (e || {})) out[k] = (out[k] || 0) + e[k];
  }
  return out;
}

/**
 * Can this blueprint be manufactured yet?
 *
 * Only the seven tier-5 entries are gated, and only by the project that names them. Gating
 * the whole catalogue retroactively would take things away from a pilot who already had
 * them — a slice that makes an existing save *worse* is one that should have been designed
 * differently.
 */
export function blueprintUnlocked(id) {
  const project = GATED[id];
  return !project || isDone(project);
}

export const lockReason = id => {
  const project = GATED[id];
  if (!project || isDone(project)) return null;
  return `${PROJECTS[project].name} not researched`;
};

export function researchReport() {
  const a = lab().active;
  return {
    findings: FINDING_KEYS.map(k => ({ kind: k, name: FINDINGS[k].name, held: findingCount(k) })),
    data: Math.round(S.cargo.data),
    done: lab().done.length,
    total: PROJECT_KEYS.length,
    active: a ? { id: a.id, name: PROJECTS[a.id].name, left: a.left, hours: PROJECTS[a.id].hours } : null
  };
}

// ── persistence ──────────────────────────────────────────────────────
export const serializeResearch = () => ({
  findings: Object.assign({}, lab().findings),
  done: lab().done.slice(),
  active: lab().active ? Object.assign({}, lab().active) : null,
  seen: Object.assign({}, lab().seen || {})
});

export function restoreResearch(d) {
  const findingsIn = {};
  for (const k of FINDING_KEYS) {
    const v = d && Number(d.findings && d.findings[k]);
    if (Number.isFinite(v) && v > 0) findingsIn[k] = Math.floor(v);
  }
  const done = (d && Array.isArray(d.done) ? d.done : []).filter(id => !!PROJECTS[id]);
  let active = null;
  if (d && d.active && PROJECTS[d.active.id] && !done.includes(d.active.id)) {
    active = { id: d.active.id, left: Math.max(0, Number(d.active.left) || 0) };
  }
  S.research = { findings: findingsIn, done, active, seen: (d && d.seen) || {} };
  return true;
}

// Register at import time, the way character.js does. See core/state.js.
registerResearchBonuses(researchBonuses);
