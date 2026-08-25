// Living Galaxy — build identity. One place that knows what this build is called,
// what save schema it writes, and how to say so on screen.
//
// Patch slices bump VERSION. SCHEMA only moves when the save payload changes shape,
// and every bump must land with a migration in systems/save.js.

export const VERSION = '1.04.00';
export const CODENAME = 'The Front Door';
export const BUILD_DATE = '2026-08-25';

/** Save payload schema.
 *  v23 = v1.02.55, which persists the *density* the system was generated at. The main menu
 *  can now scale how much is in a system, and density is an input to `generateSystem()` —
 *  so a save that carried only a seed would reopen in a system with a different number of
 *  worlds in it the first time the player moved the slider. Same argument as the layout
 *  field in v18: a seed is only deterministic for a given generator *and its arguments*.
 *  Older saves migrate to 1.0, which is exactly what they were generated at.
 *  v22 = v1.02.44, which persists *where in the galaxy* a flight is: a galaxy seed and a node
 *  index. `S.seed` is now derived from those rather than being the root fact, so the system the
 *  game renders is a real node on a real chart instead of an unplaced one. A pre-22 save keeps
 *  the system it has always had — nothing is regenerated, for the same reason the v17 migration
 *  pinned old saves to Solaris — and is *placed* on the chart at a node whose star class matches
 *  the one it is actually orbiting, so the marker and the sky agree.
 *  v21 = v1.02.39, which persists a contract's issuing power and its tier.
 *  v20 = v1.02.36, which persists individual dossiers — standing with each of the nine
 *  powers, earned qualifications, career rung and seeded traits, for the player and for
 *  every NPC who has done something worth remembering. Derived NPC records are not saved:
 *  they rebuild from the world seed and their own name. Older saves arrive with an empty
 *  table and the player's dossier is rebuilt from their character sheet on first read.
 *  v19 = v1.02.35, which persists the company's construction order book. A build project
 *  is a commitment to pay for a station module over time, so it has to survive a reload
 *  mid-build or the treasury spent on it vanishes with nothing to show. Arrives empty for
 *  every older save.
 *  v18 = v1.02.33, which persists which system layout a flight is in ('solaris' for every
 *  save written before procedural generation existed, 'procedural' for anything generated)
 *  and the generator version that produced it. See the v17 migration in systems/save.js:
 *  a pre-18 save is declared to be in the authored Solaris, because everything it records
 *  about the world is keyed by name and regenerating its seed would rename all of it.
 *  v17 = v1.01.80, which persists the NPC knowledge-base diagnostic log, contracted
 *  hulls and fleet objectives. (v1.01.81–1.02.30 changed no persisted field; schema stays 17.)
 *  v16 = v1.01.70, which persists the condition of every fitted module.
 *  (v1.01.71–75 did not change the save payload; schema stays 16.)
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
export const SCHEMA = 23;

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
