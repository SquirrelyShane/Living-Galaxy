// Living Galaxy — build identity. One place that knows what this build is called,
// what save schema it writes, and how to say so on screen.
//
// Patch slices bump VERSION. SCHEMA only moves when the save payload changes shape,
// and every bump must land with a migration in systems/save.js.

export const VERSION = '1.01.70';
export const CODENAME = 'Consignment';
export const BUILD_DATE = '2026-08-09';

/** Save payload schema.
 *  v16 = v1.01.70, which persists the condition of every fitted module.
 *  v15 = v1.01.50, which persists research findings and completed projects.
 *  v14 = v1.01.40, which persists crew comfort fittings.
 *  v13 = v1.01.00, which persists open obligations between characters.
 *  v12 = v1.00.90, which persists NPC-to-NPC exchange cooldowns.
 *  v11 = v1.00.70, which persists weapon-group assignments.
 *  v10 = v1.00.50, which persists which Lagrange sites have been worked.
 *  v9 = v1.00.32, which persists NPC personas that have accumulated memory.
 *  v8 = v1.00.31, which persists training progress, the comms log, the company and the
 *  experimental site managers.
 *  v1 = pre-fit saves, v2 = 0.1 line, v3 = the 0.2/0.3 line.
 *  v7 = v1.00.20, which persists material stock, the manufacturing queue and planetary
 *  industrial sites.
 *  v6 = 0.7, which persists the contract board and what you have accepted.
 *  v5 = 0.6, which persists the pilot: lineage, corporation, career, skills, spent
 *  points, licences and agent progress.
 *  v4 = 0.5, which persists the living world: reputation, construction sites, territory
 *  claims, stations you financed, and which rocks you have already mined out.
 *  0.3 and 0.4 changed no persisted field and deliberately did not move the schema —
 *  bumping it without a reason forces every save through a pointless rewrite. */
export const SCHEMA = 16;

export const BUILD = Object.freeze({
  version: VERSION,
  codename: CODENAME,
  date: BUILD_DATE,
  schema: SCHEMA
});

/** "v0.2.0 · Foundation" — boot screen, diagnostics, save headers. */
export const versionString = () => `v${VERSION} · ${CODENAME}`;

/** Numeric compare for migration gates: '0.2.0' -> 200. */
export function versionCode(v = VERSION) {
  const [a = 0, b = 0, c = 0] = String(v).split('.').map(n => parseInt(n, 10) || 0);
  return a * 10000 + b * 100 + c;
}
