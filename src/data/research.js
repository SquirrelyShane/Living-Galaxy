// Living Galaxy — research.
//
// ── the two halves this joins ────────────────────────────────────────
// Survey data has been produced since v1.00.40 — probes, surface features, anomaly
// telemetry — and has exactly one sink: you sell it. Every scan a pilot has ever run
// resolved to a commodity price.
//
// Blueprints, meanwhile, have never been gated. A fresh pilot with the materials could
// queue a tier-5 antimatter torpedo on their first hour.
//
// Research is the thing that joins them: knowledge you gathered becomes knowledge you have.
//
// ── findings are typed, and that is the whole design ─────────────────
// The cheap version of a research tree is a currency: bank points, spend points, get +5%.
// That is a checklist with a progress bar, and it makes *where you went* irrelevant — one
// planet's telemetry is as good as another's, so you probe whatever is nearest.
//
// Instead a project consumes **findings**, and a finding has a kind that depends on what you
// were looking at. Cryogenics cannot be researched by a pilot who has never been anywhere
// cold. Exotic work needs anomaly telemetry, which means going out to a Lagrange point and
// working it. The survey layer stops being a side income and becomes the supply line for
// everything below.
//
// ── what a project may give ──────────────────────────────────────────
//   `effects`  permanent modifiers, applied through the same `fitBonuses` path a module uses
//   `unlocks`  blueprint ids that cannot be manufactured until the project is done
//
// Only tier-5 blueprints are gated, and deliberately so: gating the whole catalogue
// retroactively would take things away from a pilot who already had them, and a slice that
// makes existing saves *worse* is a slice that should have been designed differently. The
// top seven are the antimatter-and-exotics end, which was always meant to be a project
// rather than a purchase.

/**
 * Finding kinds. Derived from what a body actually is, in `systems/research.js` — nothing
 * here is a lookup table of world names, so a new planet type files findings on its own.
 */
export const FINDINGS = {
  thermal:   { name: 'Thermal', desc: 'Hot worlds, lava fields, tidal volcanism.' },
  cryo:      { name: 'Cryogenic', desc: 'Ice, methane, subsurface oceans, the deep cold.' },
  biotic:    { name: 'Biotic', desc: 'Living chemistry, wherever it was found.' },
  geologic:  { name: 'Geologic', desc: 'Rock, ore bodies, impact structures, plate history.' },
  atmos:     { name: 'Atmospheric', desc: 'Weather, pressure, gas envelopes, cloud chemistry.' },
  exotic:    { name: 'Exotic', desc: 'Things that should not be there. Anomaly telemetry.' }
};
export const FINDING_KEYS = Object.keys(FINDINGS);

/**
 * `needs` is finding kind → count, and it is a **qualification, not a price**: findings are
 * evidence you hold, not currency you spend. Having been somewhere hot stays true after the
 * project finishes.
 *
 * That distinction is not cosmetic. v1.01.50 consumed them, and measuring the result showed
 * the tree was uncompletable on every seed tested — the projects want six thermal findings
 * in total and Solaris contains three to five hot bodies. What gates progress is the largest
 * single requirement, not the sum.
 *
 * `data` is the consumable: kilograms of raw survey telemetry, the generic half. You need
 * both the specific evidence and the bulk to work through.
 */
export const PROJECTS = {
  // ── tier 1: the things a working ship wants ──────────────────────
  sensorTuning: {
    name: 'Sensor calibration', tier: 1, hours: 4,
    data: 320, needs: { geologic: 2 },
    effects: { sensorMult: 0.12 },
    desc: 'Enough resolved bodies to know what the dish is lying about. Everything reads ' +
          'further out once you have corrected for it.'
  },
  thermalPlating: {
    name: 'Thermal plating', tier: 1, hours: 5,
    data: 360, needs: { thermal: 2 },
    effects: { heatSinkAdd: 0.18 },
    desc: 'Ablative layering copied off worlds that survive their own star. The emitters ' +
          'run longer before the cutout.'
  },
  cryoStorage: {
    name: 'Cryogenic storage', tier: 1, hours: 5,
    data: 360, needs: { cryo: 2 },
    effects: { cargoMult: 0.10 },
    desc: 'Denser volatile packing, learned from ice that has held its own for four billion ' +
          'years. More fits in the same hold.'
  },

  // ── tier 2: needs the tier below and a wider survey ──────────────
  atmosDynamics: {
    name: 'Atmospheric dynamics', tier: 2, hours: 8,
    data: 700, needs: { atmos: 3, geologic: 1 }, requires: ['sensorTuning'],
    effects: { scanTier: 1 },
    desc: 'Modelling what a gas envelope does to a return, rather than accepting it. A ' +
          'greenhouse resolves like a bare rock.'
  },
  bioSynthesis: {
    name: 'Biotic synthesis', tier: 2, hours: 9,
    data: 760, needs: { biotic: 3 }, requires: ['cryoStorage'],
    effects: { craftSpeed: 0.15 },
    desc: 'Catalysts that work at ship temperatures, from organisms that had no choice. ' +
          'The fabricator runs faster on everything.'
  },
  hardenedAlloys: {
    name: 'Hardened alloys', tier: 2, hours: 9,
    data: 760, needs: { thermal: 2, geologic: 2 }, requires: ['thermalPlating'],
    effects: { armorMult: 0.14 },
    desc: 'Grain structures from cores that cooled under pressure nothing in a foundry can ' +
          'reproduce. You can reproduce the result.'
  },

  // ── tier 3: the exotic end, and the only gated blueprints ────────
  fieldTheory: {
    name: 'Applied field theory', tier: 3, hours: 16,
    data: 1400, needs: { exotic: 2, atmos: 2 }, requires: ['atmosDynamics'],
    effects: { warpSpeedMult: 0.10 },
    desc: 'A standing distortion with nothing at the middle of it turns out to be a very ' +
          'good teacher, once you stop assuming it is broken instrumentation.'
  },
  exoticOrdnance: {
    name: 'Exotic ordnance', tier: 3, hours: 20,
    data: 1750, needs: { exotic: 3, thermal: 2 }, requires: ['hardenedAlloys', 'fieldTheory'],
    unlocks: ['WPN-022', 'WPN-034', 'WPN-048', 'WPN-049'],
    desc: 'Containment that holds long enough to be delivered. Nobody sells this over a ' +
          'counter and there is a reason for that.'
  },
  exoticSystems: {
    name: 'Exotic systems', tier: 3, hours: 18,
    data: 1650, needs: { exotic: 2, biotic: 1, cryo: 1 }, requires: ['bioSynthesis', 'fieldTheory'],
    unlocks: ['MOD-004', 'MOD-012'],
    desc: 'The same containment problem, pointed inward at something you intend to keep ' +
          'aboard permanently.'
  }
};

export const PROJECT_KEYS = Object.keys(PROJECTS);

/** Every blueprint that cannot be manufactured until something has been researched. */
export const GATED = (() => {
  const out = {};
  for (const k of PROJECT_KEYS) for (const bp of (PROJECTS[k].unlocks || [])) out[bp] = k;
  return out;
})();
