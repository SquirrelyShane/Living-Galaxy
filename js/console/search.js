/* LIVING GALAXY — console global jump index.
 *
 * The survivor of the CMD deck's search + flatten: a flat list of the leaves
 * that never belonged to a panel (registered by console.js at mount) plus
 * whatever every panel's `search()` returns right now, so crew names, drone
 * names, bodies, missions and upgrades are all one keystroke away.
 *
 *   registerJump(spec), buildIndex(), query(q, limit) → hits, runHit(hit)
 */

import { closeConsole, console as con, jumpTo, noteRecent } from "./console.js";

/** Static jumps registered by console.js at mount. */
export const jumps = new Map();

export function registerJump({ id, label, hint = "", keywords = "", panel = null, sub = null, focus = null, run = null, status = null, close = false }) {
  if (!id) return null;
  const path = panel ? `${panel}${sub ? `/${sub}` : ""}${focus ? `#${focus}` : ""}` : null;
  const rec = { id, label, hint, keywords, panel, sub, focus, run, status, path, close };
  jumps.set(id, rec);
  return rec;
}

const label = (p, subId) => {
  const s = (p.subtabs ?? []).find((x) => x.id === subId);
  return s ? `${p.title} › ${s.label}` : p.title;
};

/** Rebuilds the searchable index: static jumps ∪ every panel's sub-tabs ∪ every panel's live search(). */
export function buildIndex() {
  const out = [...jumps.values()];
  for (const p of con.panels.values()) {
    const subs = p.subtabs?.length ? p.subtabs : [{ id: null, label: p.title }];
    for (const s of subs) {
      const path = s.id ? `${p.id}/${s.id}` : p.id;
      out.push({ id: `tab:${path}`, label: label(p, s.id), hint: "console panel", keywords: `${p.id} ${s.id ?? ""} panel tab`, panel: p.id, sub: s.id, focus: null, run: null, status: null, path, close: false });
    }
    let hits = [];
    try { hits = p.search?.() ?? []; } catch (e) { globalThis.console.warn(`console search ${p.id}`, e); }
    for (const h of hits) {
      const path = `${p.id}${h.sub ? `/${h.sub}` : ""}${h.focus ? `#${h.focus}` : ""}`;
      out.push({ id: h.id ?? `${path}:${h.label}`, label: h.label, hint: h.hint ?? label(p, h.sub), keywords: `${h.keywords ?? ""} ${label(p, h.sub)}`, panel: p.id, sub: h.sub ?? null, focus: h.focus ?? null, run: h.run ?? null, status: h.status ?? null, path, close: false });
    }
  }
  return out;
}

/** query(q, limit = 30) → [{ id, label, hint, path, run, status, close }]; label hits rank above keyword-only hits. */
export function query(q, limit = 30) {
  const needle = String(q ?? "").trim().toLowerCase();
  if (!needle) return [];
  const words = needle.split(/\s+/);
  const scored = [];
  for (const h of buildIndex()) {
    const lab = String(h.label ?? "").toLowerCase();
    const rest = `${h.hint ?? ""} ${h.keywords ?? ""} ${h.path ?? ""}`.toLowerCase();
    let score = 0;
    for (const w of words) {
      if (lab.startsWith(w)) score += 4;
      else if (lab.includes(w)) score += 3;
      else if (rest.includes(w)) score += 1;
      else { score = 0; break; }
    }
    if (score > 0) scored.push({ h, score });
  }
  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, limit).map((x) => x.h);
}

/** run() if present else jumpTo(path); closes the console when the leaf opens another surface. */
export function runHit(hit) {
  if (!hit) return false;
  if (typeof hit.run === "function") {
    hit.run();
    noteRecent(hit.path ?? `@${hit.id}`, hit.label);
    if (hit.close) closeConsole();
    return true;
  }
  noteRecent(hit.path, hit.label);
  return jumpTo(hit.path);
}

export const run = runHit;
