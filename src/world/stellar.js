// Living Galaxy — the star as a thing with an age.
//
// Before this, a star was four numbers picked from a table: radius, colour, temperature and
// a luminosity. `STAR_CLASSES` in genesis.js still holds that table and still picks from it,
// because a spectral class is a real thing and weighting the galaxy toward M-dwarfs is
// correct. What the table could not say is *when* — every G-type in the galaxy was the same
// G-type, at the same brightness, forever.
//
// That mattered more than it sounds, because luminosity is the single number every world in
// the system is measured against. One value per class meant every yellow dwarf's habitable
// zone sat at exactly the same radius, which meant the *only* thing distinguishing two
// G-type systems was where the dice put the orbits. Stars of the same class were
// interchangeable, and so were their worlds.
//
// So a star now carries an age, and its luminosity is a function of that age:
//
//   protostar -> main sequence -> subgiant -> red giant -> AGB
//                -> planetary nebula -> white dwarf        (M < 8 Msol)
//                -> supernova -> neutron star | black hole (M >= 8 Msol)
//
// A main-sequence star brightens through its life — roughly forty percent across the whole
// run — so a young G-type and an old one are genuinely different places to live. The
// habitable zone marches outward the entire time.
//
// ## What this is not
//
// It is not a simulation you watch. LG is a game about flying between systems, not a
// stellar laboratory, and nothing here ticks on the frame clock. `advanceEpoch` in epoch.js
// is called deliberately — at generation to place a system at its rolled age, and by the
// tests to prove the model holds across a star's whole life. The value at runtime is that
// the numbers a system is built from are the numbers of a *particular* star at a
// *particular* moment, rather than a class average.
//
// ## Why the boundaries are shared
//
// `surfaceState()` and the world catalogue's `S` bands read the same five thresholds
// (30 / 4 / 1.5 / 0.35 / 0.12). The classifier decides what a world *is* from its
// insolation; this decides what its surface is *doing* at that insolation. Those two must
// never be able to disagree, and the only way to guarantee that is for them to be one set
// of numbers rather than two lists that look alike today.
//
// Pure module: no DOM, no three.js, no imports beyond core.

/** Where a star is in its life. */
export const PHASE = {
  PROTOSTAR: 'protostar',
  MAIN_SEQUENCE: 'main_sequence',
  SUBGIANT: 'subgiant',
  RED_GIANT: 'red_giant',
  AGB: 'agb',
  PLANETARY_NEBULA: 'planetary_nebula',
  WHITE_DWARF: 'white_dwarf',
  SUPERNOVA: 'supernova',
  NEUTRON_STAR: 'neutron_star',
  STELLAR_BLACK_HOLE: 'stellar_black_hole'
};

export const PHASE_TEXT = {
  [PHASE.PROTOSTAR]: 'contracting protostar',
  [PHASE.MAIN_SEQUENCE]: 'main sequence',
  [PHASE.SUBGIANT]: 'subgiant — core hydrogen exhausted',
  [PHASE.RED_GIANT]: 'red giant — envelope expanding',
  [PHASE.AGB]: 'asymptotic giant — shedding mass',
  [PHASE.PLANETARY_NEBULA]: 'planetary nebula',
  [PHASE.WHITE_DWARF]: 'white dwarf — cooling remnant',
  [PHASE.SUPERNOVA]: 'core collapse',
  [PHASE.NEUTRON_STAR]: 'neutron star',
  [PHASE.STELLAR_BLACK_HOLE]: 'stellar-mass black hole'
};

/** Phases in which the star is no longer changing on any timescale that matters. */
export const TERMINAL = new Set([PHASE.WHITE_DWARF, PHASE.NEUTRON_STAR, PHASE.STELLAR_BLACK_HOLE]);

/** Surface states, coldest to hottest. Giants are exempt from all of it. */
export const SURFACE = {
  FROZEN: 'frozen',
  TUNDRA: 'tundra',
  TEMPERATE: 'temperate',
  ARID: 'arid',
  BARREN: 'barren',
  SCORCHED: 'scorched',
  MOLTEN: 'molten'
};

export const SURFACE_COLOR = {
  [SURFACE.FROZEN]: 0xbfe3f5,
  [SURFACE.TUNDRA]: 0x8fb6a8,
  [SURFACE.TEMPERATE]: 0x3f8f5f,
  [SURFACE.ARID]: 0xc9a05a,
  [SURFACE.BARREN]: 0x8a8378,
  [SURFACE.SCORCHED]: 0xb35a35,
  [SURFACE.MOLTEN]: 0xd94418
};

/** Human labels, for the survey panel and the dossier. */
export const SURFACE_TEXT = {
  [SURFACE.FROZEN]: 'frozen',
  [SURFACE.TUNDRA]: 'tundra',
  [SURFACE.TEMPERATE]: 'temperate',
  [SURFACE.ARID]: 'arid',
  [SURFACE.BARREN]: 'barren',
  [SURFACE.SCORCHED]: 'scorched',
  [SURFACE.MOLTEN]: 'molten'
};

// ── stellar physics ──────────────────────────────────────────────────

/** Main-sequence lifetime in Myr: t ≈ 10 Gyr · M^-2.5. */
export function lifespanMyr(massSol) {
  return 10000 * Math.pow(Math.max(0.08, massSol), -2.5);
}

/** Zero-age luminosity in solar units: L ≈ M^3.5. */
export function zamsLuminosity(massSol) {
  return Math.pow(Math.max(0.08, massSol), 3.5);
}

/**
 * The inverse — mass from a luminosity.
 *
 * This is the bridge between the two halves of the model. `STAR_CLASSES` in genesis.js is
 * authored as a luminosity table because luminosity is what the generator has always used
 * to place the habitable zone, and rewriting those numbers as masses would have silently
 * moved every orbit in every existing seed. So the class table stays the source of truth
 * and mass is derived from it, rather than the reverse.
 */
export function massFromLuminosity(lum) {
  return Math.pow(Math.max(1e-4, lum), 1 / 3.5);
}

/** Effective temperature, crude but monotonic in mass. */
export function effectiveTemp(massSol, radiusSol) {
  const L = zamsLuminosity(massSol);
  return 5772 * Math.pow(L / Math.max(1e-8, radiusSol * radiusSol), 0.25);
}

export function spectralClass(tempK) {
  if (tempK >= 30000) return 'O';
  if (tempK >= 10000) return 'B';
  if (tempK >= 7500) return 'A';
  if (tempK >= 6000) return 'F';
  if (tempK >= 5200) return 'G';
  if (tempK >= 3700) return 'K';
  return 'M';
}

/** Blackbody-ish tint for a temperature, as a packed hex colour. */
export function starColor(tempK) {
  const t = Math.max(1500, Math.min(40000, tempK));
  let r, g, b;
  if (t < 6600) {
    r = 255;
    g = 99.47 * Math.log(t / 100) - 161.12;
    b = t < 2000 ? 0 : 138.52 * Math.log(t / 100 - 10) - 305.04;
  } else {
    r = 329.7 * Math.pow(t / 100 - 60, -0.1332);
    g = 288.12 * Math.pow(t / 100 - 60, -0.0755);
    b = 255;
  }
  const c = v => Math.max(0, Math.min(255, Math.round(v))) | 0;
  return (c(r) << 16) | (c(g) << 8) | c(b);
}

/** Liquid-water band in AU, for a luminosity in solar units. */
export function habitableZone(luminosity) {
  const s = Math.sqrt(Math.max(1e-6, luminosity));
  return { inner: 0.95 * s, outer: 1.37 * s };
}

/** Where water ice survives, in AU. Everything past here keeps its volatiles. */
export function frostLine(luminosity) {
  return 4.85 * Math.sqrt(Math.max(1e-6, luminosity));
}

/** Insolation in solar constants at a given distance in AU. */
export function insolation(luminosity, aAU) {
  const d = Math.max(1e-6, aAU);
  return luminosity / (d * d);
}

/**
 * What the surface is doing, from insolation and remaining volatile inventory.
 *
 * The thresholds here are the same five numbers the world catalogue's `S` bands are cut on.
 * That is deliberate and load-bearing: the classifier picks a class whose band contains the
 * body's insolation, and this decides what that insolation does to the ground. Two lists
 * that agree today drift apart the first time somebody retunes one of them.
 */
export function surfaceState(S, volatiles) {
  if (S > 30) return SURFACE.MOLTEN;
  if (S > 4) return SURFACE.SCORCHED;
  if (volatiles < 0.12) return SURFACE.BARREN;
  if (S > 1.5) return SURFACE.ARID;
  if (S > 0.35) return SURFACE.TEMPERATE;
  if (S > 0.12) return SURFACE.TUNDRA;
  return SURFACE.FROZEN;
}

/**
 * Volatile gain or loss per Myr at a given insolation.
 *
 * Negative is ablation to space and is **not** banked anywhere — see epoch.js, where the
 * reservoir cap is lowered along with the inventory. That asymmetry is the whole reason a
 * dying star is legible: a world cooked during the red-giant phase does not become an ocean
 * again when the star settles into a white dwarf and the system goes cold. It becomes a
 * frozen rock with no air, which is the correct and much bleaker answer.
 */
export function volatileRate(S) {
  if (S > 4) return -0.06;
  if (S > 1.5) return -0.012;
  if (S > 1.0) return -0.002;
  if (S < 0.35) return 0.0008;
  return 0;
}

// ── a star's own state ───────────────────────────────────────────────

/**
 * Give a star the fields deep time needs, derived from what genesis already rolled.
 *
 * `lum` from the class table is treated as the star's **zero-age** luminosity, and `star.lum`
 * is then recomputed for its actual age. A freshly-born star therefore comes out slightly
 * dimmer than its table entry and an old one brighter, which is the point.
 */
export function initStar(star, ageMyr) {
  star.massSol = massFromLuminosity(star.lum);
  star.massSol0 = star.massSol;
  star.lifespanMyr = lifespanMyr(star.massSol);
  star.ageMyr = Math.max(0, ageMyr || 0);
  star.phase = phaseFor(star.ageMyr / star.lifespanMyr, star.massSol0);
  star.lum0 = star.lum;
  return refreshStar(star);
}

/** Which phase a fractional age implies. Pure, so the tests can sweep it directly. */
export function phaseFor(f, massSol0) {
  if (f < 0.005) return PHASE.PROTOSTAR;
  if (f < 1.0) return PHASE.MAIN_SEQUENCE;
  if (f < 1.10) return PHASE.SUBGIANT;
  if (f < 1.25) return PHASE.RED_GIANT;
  if (f < 1.30) return PHASE.AGB;
  if (massSol0 >= 8) return f < 1.34 ? PHASE.SUPERNOVA
    : (massSol0 >= 20 ? PHASE.STELLAR_BLACK_HOLE : PHASE.NEUTRON_STAR);
  return f < 1.34 ? PHASE.PLANETARY_NEBULA : PHASE.WHITE_DWARF;
}

/**
 * Recompute everything derived from age, mass and phase.
 *
 * `star.lum` is what the rest of the game reads — genesis places the habitable zone from
 * it, the classifier measures insolation against it, the light rig takes its intensity from
 * it. Writing the evolved value back into the same field is what makes deep time reach the
 * whole project without every consumer learning a new name.
 */
export function refreshStar(star) {
  const f = star.ageMyr / Math.max(1e-6, star.lifespanMyr);
  const base = zamsLuminosity(star.massSol);

  switch (star.phase) {
    case PHASE.PROTOSTAR:
      star.lum = base * 0.4;
      star.radiusSol = Math.pow(star.massSol, 0.8) * 1.6;
      break;
    case PHASE.MAIN_SEQUENCE:
      // Steady brightening across the whole main sequence — the slow march that moves the
      // habitable zone outward past worlds that used to sit in it.
      star.lum = base * (1 + 0.4 * Math.max(0, f));
      star.radiusSol = Math.pow(star.massSol, 0.8) * (1 + 0.25 * Math.max(0, f));
      break;
    case PHASE.SUBGIANT:
      star.lum = base * (1.4 + 6 * (f - 1) / 0.1);
      star.radiusSol = Math.pow(star.massSol, 0.8) * (1.25 + 20 * (f - 1) / 0.1);
      break;
    case PHASE.RED_GIANT: {
      const g = Math.min(1, Math.max(0, (f - 1.10) / 0.15));
      star.lum = base * (7 + 1500 * g);
      star.radiusSol = Math.pow(star.massSol, 0.8) * (21 + 180 * g);
      break;
    }
    case PHASE.AGB: {
      const g = Math.min(1, Math.max(0, (f - 1.25) / 0.05));
      star.lum = base * (1500 + 2500 * g);
      star.radiusSol = Math.pow(star.massSol, 0.8) * (200 + 120 * g);
      break;
    }
    case PHASE.PLANETARY_NEBULA:
      star.lum = base * 400;
      star.radiusSol = Math.pow(star.massSol, 0.8) * 20;
      break;
    case PHASE.WHITE_DWARF:
      star.lum = 0.0015;
      star.radiusSol = 0.013;
      break;
    case PHASE.SUPERNOVA:
      star.lum = 1e9;
      star.radiusSol = Math.pow(star.massSol, 0.8) * 400;
      break;
    case PHASE.NEUTRON_STAR:
      star.lum = 0.0005;
      star.radiusSol = 0.00002;
      break;
    case PHASE.STELLAR_BLACK_HOLE:
      star.lum = 0;
      star.radiusSol = 1e-5;
      break;
    default:
      break;
  }

  star.tempK = Math.round(effectiveTemp(star.massSol, Math.max(1e-4, star.radiusSol)));
  star.spectral = spectralClass(star.tempK);
  star.hz = habitableZone(star.lum);
  star.frostAU = frostLine(star.lum);
  star.phaseText = PHASE_TEXT[star.phase] || star.phase;
  return star;
}

/**
 * Advance the star by dtMyr.
 *
 * Returns `{ events, massLossFactor }`. The mass-loss factor is `M_before / M_after`, which
 * the caller multiplies into every orbit — a star shedding its envelope makes every orbit
 * expand, and expressing that as a change to the orbit rather than a force applied to a
 * moving body is what makes million-year steps safe to take in one jump.
 */
export function advanceStar(star, dtMyr) {
  const events = [];
  if (!star.lifespanMyr) return { events, massLossFactor: 1 };

  if (TERMINAL.has(star.phase)) {
    star.ageMyr += dtMyr;
    return { events, massLossFactor: 1 };
  }

  const before = star.massSol;
  star.ageMyr += dtMyr;
  const prev = star.phase;
  star.phase = phaseFor(star.ageMyr / star.lifespanMyr, star.massSol0);

  // AGB winds shed the envelope; what is left of a sun-like star is about 55% of it.
  if (star.phase === PHASE.AGB || star.phase === PHASE.PLANETARY_NEBULA) {
    const target = star.massSol0 * 0.55;
    const rate = (star.massSol0 - target) / 60;          // per Myr
    star.massSol = Math.max(target, star.massSol - rate * dtMyr);
  }
  if (star.phase === PHASE.WHITE_DWARF) star.massSol = star.massSol0 * 0.55;
  if (star.phase === PHASE.NEUTRON_STAR) star.massSol = 1.4;
  if (star.phase === PHASE.STELLAR_BLACK_HOLE) star.massSol = star.massSol0 * 0.3;

  refreshStar(star);

  if (star.phase !== prev) {
    events.push({
      type: 'stellar_phase',
      phase: star.phase,
      text: PHASE_TEXT[star.phase],
      ageMyr: star.ageMyr,
      lum: star.lum
    });
  }

  return { events, massLossFactor: star.massSol > 0 ? before / star.massSol : 1 };
}

/** Photospheric radius in AU — what actually swallows an inner planet. 1 Rsol ≈ 0.00465 AU. */
export function photosphereAU(star) {
  return (star.radiusSol || 1) * 0.00465;
}
