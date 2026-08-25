// Living Galaxy — what a company builds.
//
// The `build` role has existed since fleet contracts shipped. You could commission a
// construction hull, pay for it, watch it sit on a pad, and give it **nothing to do** —
// there was no fleet order type in the game whose `requires` list contained `build`. A
// buyable ship with no assignable job is a hole in the shop, and this file is the state
// behind closing it.
//
// Three sources of construction work, deliberately all three, because they answer
// different questions:
//
//   1. **The world's own sites** (`S.sim.sites`) — the Coalition and the pirates already
//      build things, and their scaffolds already accept delivery. A company builder can
//      turn up and get paid for the labour. Nothing new is invented; the ship makes an
//      existing system finish faster and earns for it.
//   2. **The company's own projects** — this file. An executive orders a module onto a
//      station they hold, the builder hauls and erects it, and when it completes the
//      module is *really there* with its real service bonus. This is the one that improves
//      your position rather than somebody else's.
//   3. **Contract work** — the same world sites, taken as a paid job with a quoted fee and
//      a deadline rather than as opportunistic labour.
//
// The rule from `docs/SLICE_PLAN.md` that governs all of it: **after this work, what is
// different about the world?** A construction order that pays a stipend for existing is an
// idle-clicker. Every project here ends in a thing that exists — a module bolted to a
// station, a scaffold that became a habitat — or it does not pay.

import { S } from '../../core/state.js';
import { STATION_MODULES } from '../../data/stations.js';
import { COMPANY } from '../../core/config.js';
import { fmtCr } from '../../core/utils.js';
import { status } from '../../core/notify.js';

/** Company build projects. Persisted — see systems/save.js, schema 19. */
export const projects = () => (S.company && (S.company.projects = S.company.projects || [])) || [];

let nextSeq = 1;
/** Seeded-free but monotonic: a project id only has to be unique within one save. */
function nextId() { return `pr-${(nextSeq++).toString(36)}`; }

/** Carry the counter past whatever a restored save already holds. */
function seedProjectSeq(list) {
  for (const p of list || []) {
    const n = parseInt(String(p.id || '').replace('pr-', ''), 36);
    if (n >= nextSeq) nextSeq = n + 1;
  }
}

// ── what can be built ────────────────────────────────────────────────
//
// Station modules are the catalogue, because they already exist, already have a build cost
// and a build time, and already grant a concrete service bonus when attached. A project is
// therefore a *commitment to pay for one over time* rather than a new kind of object.

/** Modules the company may order onto a station it can reach. */
export function buildable(station) {
  if (!station || !station.userData) return [];
  const u = station.userData;
  const fitted = new Set((u.modules || []).map(m => m.key));
  const free = (u.slots || 0) - (u.modules || []).length;
  return Object.entries(STATION_MODULES)
    .filter(([key]) => !fitted.has(key))
    .map(([key, def]) => ({
      key,
      name: def.name,
      cat: def.cat,
      desc: def.desc,
      // The fee is the module's own build cost. Ordering does not pay it — a project bills
      // the treasury as the work is done, so an abandoned project has cost you only what
      // was actually built.
      fee: def.build,
      hours: def.time,
      power: def.power,
      slotsFree: free,
      blocked: free <= 0 ? 'No free hardpoint on this station.' : null
    }));
}

/**
 * Order a module built.
 *
 * Deliberately does *not* charge on order. The treasury is billed per unit of progress by
 * `advanceProject()`, so a project you cancel halfway has cost you half — which is the
 * honest accounting and also the thing that makes cancelling a real decision rather than a
 * free undo.
 */
export function orderProject(station, moduleKey) {
  if (!S.company || !S.company.founded) return { ok: false, reason: 'No company on file.' };
  if (!station || !station.userData) return { ok: false, reason: 'No station selected.' };
  const def = STATION_MODULES[moduleKey];
  if (!def) return { ok: false, reason: 'No such module.' };

  const u = station.userData;
  if ((u.modules || []).length >= (u.slots || 0)) {
    return { ok: false, reason: `${u.name} has no free hardpoint.` };
  }
  if (projects().some(p => !p.done && p.station === u.name && p.module === moduleKey)) {
    return { ok: false, reason: `${def.name} is already on order at ${u.name}.` };
  }
  if (projects().filter(p => !p.done).length >= COMPANY.projectCap) {
    return { ok: false, reason: `The company will not carry more than ${COMPANY.projectCap} open projects.` };
  }

  const p = {
    id: nextId(),
    kind: 'module',
    module: moduleKey,
    station: u.name,
    name: `${def.name} · ${u.name}`,
    // Work is measured in credits of value installed, which makes "how far along is it"
    // and "what has it cost me" the same number. A builder converts time into this.
    need: def.build,
    progress: 0,
    spent: 0,
    done: false,
    startedAt: S.time || 0
  };
  projects().push(p);
  status(`${def.name} ordered at ${u.name} — ${fmtCr(def.build)} of work`);
  return { ok: true, project: p };
}

export function cancelConstruction(id) {
  const list = projects();
  const i = list.findIndex(p => p.id === id);
  if (i < 0) return { ok: false, reason: 'No such project.' };
  const p = list[i];
  list.splice(i, 1);
  return { ok: true, spent: p.spent,
           text: `${p.name} cancelled — ${fmtCr(p.spent)} already spent is not recoverable.` };
}

/** The open project a builder should work on, nearest first if a position is given. */
export function nextProject(fromName) {
  const open = projects().filter(p => !p.done);
  if (!open.length) return null;
  if (!fromName) return open[0];
  const here = open.find(p => p.station === fromName);
  return here || open[0];
}

/**
 * Put work into a project and bill the treasury for it.
 *
 * Returns the credits actually converted — which is zero when the treasury cannot cover
 * the work, and that is the interesting case: a company that runs out of money does not
 * get a half-price station, its builders idle at the site with nothing to install.
 */
export function advanceProject(p, credits) {
  if (!p || p.done || !(credits > 0)) return 0;
  const co = S.company;
  if (!co) return 0;
  const want = Math.min(credits, p.need - p.progress);
  const afford = Math.min(want, Math.max(0, co.treasury));
  if (afford <= 0) return 0;

  co.treasury -= afford;
  co.spend = (co.spend || 0) + afford;
  p.progress += afford;
  p.spent += afford;
  if (p.progress >= p.need - 0.5) p.readyToFit = true;
  return afford;
}

/**
 * Finish a project against a real station object.
 *
 * Split from `advanceProject` because attaching a module needs the station *mesh*, and the
 * accrual path is pure state — which is what lets the suite drive a project to completion
 * without a scene. `attach` is passed in for the same reason: this module does not import
 * the world builder.
 */
export function completeProject(p, station, attach) {
  if (!p || p.done || !p.readyToFit) return false;
  if (!station || typeof attach !== 'function') return false;
  if (!attach(station, p.module)) return false;
  p.done = true;
  p.doneAt = S.time || 0;
  status(`${p.name} — complete and online`);
  return true;
}

/** One line per project, for the fleet screen and ARIA. */
export function projectReport() {
  return projects().map(p => ({
    id: p.id,
    name: p.name,
    station: p.station,
    module: p.module,
    need: Math.round(p.need),
    progress: Math.round(p.progress),
    spent: Math.round(p.spent),
    pct: p.need > 0 ? Math.min(1, p.progress / p.need) : 0,
    done: !!p.done,
    readyToFit: !!p.readyToFit
  }));
}

// ── persistence ──────────────────────────────────────────────────────

export const serializeProjects = () => projects().filter(p => !p.done).map(p => ({
  id: p.id, kind: p.kind, module: p.module, station: p.station, name: p.name,
  need: p.need, progress: p.progress, spent: p.spent, done: false,
  readyToFit: !!p.readyToFit, startedAt: p.startedAt || 0
}));

export function restoreProjects(list) {
  if (!S.company) return;
  S.company.projects = Array.isArray(list) ? list.slice() : [];
  seedProjectSeq(S.company.projects);
}
