/* LIVING GALAXY — the seam between the name forge and the vendored pools.
 *
 * js/names.js is the forge: phoneme lexicons per tongue, family shapes that
 * carry the lore, survey-year catalogue conventions. It is not going anywhere
 * and most of the sky is still named by it. This file exists because two
 * corners of the naming system were not forged at all — they were lookup
 * tables — and they had run out.
 *
 * WHAT WAS MEASURED (0.3.32, before):
 *
 *   Ports came from 5 sector prefixes × 7 suffixes = 35 names per sector,
 *   175 in the whole game. Across twelve systems, 42% of ports carried a name
 *   another port also had, and 20% of eight-port systems had a duplicate
 *   inside one system.
 *
 *   Terran people drew a curated given name 62% of the time from a pool of
 *   122, and a surname from a flat list of 65. Over three thousand terrans:
 *   "Piotr" 37 times, 65 distinct surnames — and since a vessel's callsign is
 *   built from its captain's surname, the board repeated with them.
 *
 * WHAT THIS DOES NOT TOUCH. The alien tongues measured ~2,900 distinct first
 * names in 3,000 and are left exactly alone — a korrash called "Aaliyah
 * Aardema" would be a bug, not a fix. Nor are the deliberate family SHAPES:
 * the vantari 12×12 compound (144), the ashwalker's, and the veyd having no
 * family name at all are lore, not small pools that need filling.
 *
 * The vendored pools and their licences are in js/vendor/stellar-names/.
 */

import { NameGenerator } from "./vendor/stellar-names/index.js";
import { CLASSIFIED_NAMES } from "./vendor/stellar-names/classified-names.js";

/* ---- people -------------------------------------------------------------
 * Offered to js/data/lexicons.js for the tongues whose names are meant to
 * sound like Earth's. The forge still does the other 38% of the work, so a
 * terran sky keeps a few invented names in it rather than reading as a
 * phone book. */
export const HUMAN_GIVEN_M = CLASSIFIED_NAMES.male;
export const HUMAN_GIVEN_F = CLASSIFIED_NAMES.female;
export const HUMAN_LAST = CLASSIFIED_NAMES.surname;

/* ---- ports --------------------------------------------------------------
 *
 * The sector word is the anchor and it stays: a port called Bastion or Smelt
 * or Hookfall tells you what kind of place you are docking at before the
 * market screen does, and that is worth more than raw variety. What was
 * missing was everything around it.
 *
 * Three shapes, so a system's roster does not read as one template:
 *
 *   A  Copper Forge Works        an adjective on the sector word
 *   B  Smelt Station             the old bare shape, kept so the game still
 *                                sounds like itself
 *   C  Meridian-4417 Exchange    a port a company owns and named after itself
 *
 * C is weighted by sector: a shipping combine builds industrial and civilian
 * ports, and does not build Hookfall.
 */
const SECTOR_WORDS = {
  military: ["Bastion", "Picket", "Redoubt", "Muster", "Garrison"],
  industrial: ["Forge", "Smelt", "Yard", "Kiln", "Foundry"],
  civilian: ["Haven", "Commons", "Terrace", "Quarter", "Landing"],
  agricultural: ["Grange", "Vat", "Furrow", "Harvest", "Green"],
  pirate: ["Hookfall", "Blackreach", "Sump", "The Nail", "Cutter's Rest"],
};
/* the game's own suffixes first, then the ones the vendored list adds */
const SUFFIX = [
  "Station", "Platform", "Anchorage", "Ring", "Post", "Works", "Hold",
  "Orbital", "Exchange", "Shipyard", "Citadel", "Spindle", "Gateway",
  "Relay", "Depot", "Terminal", "Habitat", "Outpost",
];
/* how often a sector's ports are company-built */
const CORPORATE = { industrial: 0.3, civilian: 0.22, military: 0.1, agricultural: 0.12, pirate: 0 };

let namer = null;
let namerSeed = null;

/**
 * Prime the port namer for a sky. Deterministic in the seed, and `unique` is
 * on, so two ports in one system cannot collide by construction rather than
 * by being lucky.
 */
export function openSkyNames(skySeed = "sky") {
  namerSeed = String(skySeed);
  namer = new NameGenerator({ seed: `${namerSeed}:ports` });
  return namer;
}

/** Keep a name off the table — a port already placed, a fixed landmark. */
export function reserveNames(list) {
  if (namer && list?.length) namer.reserve(list.filter((s) => typeof s === "string" && s.trim()));
}

/**
 * A port name for `sector`.
 *
 * IT DOES NOT TOUCH THE CALLER'S GENERATOR. The station builder threads one
 * seeded `rnd` through the whole roster — radii, orbits, mounts, works — and
 * the first version of this drew from it a VARIABLE number of times depending
 * on which shape it picked. That shifted every draw after it, so changing a
 * name changed where the port was, which hull was parked at it and what the
 * market held: eight suites failed, none of them about names. A name is not
 * allowed to move a station.
 *
 * So the words come from the sky's own namer and nothing else. Same sky, same
 * ports in the same places as before this patch — only better named.
 */
export function stationName(sector) {
  if (!namer) openSkyNames(namerSeed ?? "sky");
  const words = SECTOR_WORDS[sector] ?? SECTOR_WORDS.civilian;
  const corp = CORPORATE[sector] ?? 0.15;
  const rnd = () => namer.random();

  for (let attempt = 0; attempt < 40; attempt++) {
    const roll = rnd();
    let out;
    if (roll < corp) {
      /* C — a company port. The vendored generator owns the house names and
       * the hull number, and we take the word off the front of its result. */
      const raw = namer.name("station", { style: "corporate", unique: false });
      out = `${raw.split(" ")[0]} ${pick(rnd, SUFFIX)}`;
    } else if (roll < corp + 0.16) {
      /* B — the bare shape the game shipped with */
      out = `${pick(rnd, words)} ${pick(rnd, SUFFIX)}`;
    } else {
      /* A — an adjective on the sector word. Some sector words are already
       * phrases — "The Nail", "Cutter's Rest" — and "Ember The Nail Terminal"
       * is not a place. Those take the bare shape instead. */
      const word = pick(rnd, words);
      if (/^The\s|'s\s/.test(`${word} `)) out = `${word} ${pick(rnd, SUFFIX)}`;
      else out = `${pick(rnd, namer.data.frontier)} ${word} ${pick(rnd, SUFFIX)}`;
    }
    const key = out.toLocaleLowerCase("en-US");
    if (!namer.used.has(key)) { namer.used.add(key); return out; }
  }
  /* forty collisions in a row means the shapes above are exhausted for this
   * sector, which the counts say cannot happen — but never hand back a
   * duplicate silently, and never throw in the middle of building a sky */
  return `${pick(rnd, words)} ${pick(rnd, SUFFIX)} ${1 + Math.floor(rnd() * 99)}`;
}

function pick(rnd, arr) {
  return arr[Math.max(0, Math.min(arr.length - 1, Math.floor(rnd() * arr.length)))];
}

/** How big the port name space actually is, for the tests and the log. */
export function portNameSpace() {
  const adj = new NameGenerator({ seed: "count" }).data.frontier.length;
  const perSector = (w) => w * SUFFIX.length + adj * w * SUFFIX.length;
  let total = 0;
  for (const w of Object.values(SECTOR_WORDS)) total += perSector(w.length);
  return { adjectives: adj, suffixes: SUFFIX.length, total };
}
