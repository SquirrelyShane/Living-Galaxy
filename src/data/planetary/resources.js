// Living Galaxy — what is actually in the ground, world by world.
//
// The twenty planet types were pure decoration: a colour, a radius band and a temperature
// range. This is the table that gives each of them an economy.
//
// Richness is 0–1 and multiplies extraction rate. A world being *able* to yield something
// and being *good* at it are different claims, and both matter: an ocean world has iron
// in it, but a barren rock hands it to you.
//
// The rule followed throughout: nothing appears on a world it has no physical reason to be
// on. Helium-3 is on gas giants and airless regolith, not in an ocean. Uranium is in old
// crust and radioactive worlds. Biology is only where liquid water or a managed atmosphere
// can support it. When someone adds planet type twenty-one, they should be able to fill
// this in from the physics rather than by copying the row above.

export const PLANET_RESOURCES = {
 "lava": {
  "RAW-001": 0.8,
  "RAW-002": 0.55,
  "RAW-009": 0.6,
  "RAW-018": 0.9,
  "RAW-008": 0.5,
  "RAW-021": 0.45
 },
 "molten": {
  "RAW-001": 0.9,
  "RAW-008": 0.7,
  "RAW-009": 0.75,
  "RAW-023": 0.4,
  "RAW-020": 0.35,
  "RAW-018": 0.6
 },
 "barren": {
  "RAW-001": 0.7,
  "RAW-005": 0.85,
  "RAW-004": 0.6,
  "RAW-008": 0.6,
  "RAW-013": 0.45,
  "RAW-025": 0.7
 },
 "ironCore": {
  "RAW-001": 1.0,
  "RAW-008": 0.95,
  "RAW-021": 0.7,
  "RAW-009": 0.6,
  "RAW-002": 0.5,
  "RAW-023": 0.5
 },
 "carbon": {
  "RAW-006": 1.0,
  "RAW-025": 0.5,
  "RAW-005": 0.5,
  "RAW-019": 0.4,
  "RAW-020": 0.3
 },
 "terrestrial": {
  "RAW-001": 0.6,
  "RAW-003": 0.7,
  "RAW-004": 0.65,
  "RAW-011": 0.8,
  "RAW-016": 0.9,
  "RAW-015": 0.85,
  "RAW-019": 0.7,
  "RAW-025": 0.6,
  "BIO-001": 0.9,
  "BIO-003": 0.7
 },
 "ocean": {
  "RAW-011": 1.0,
  "RAW-016": 0.9,
  "RAW-017": 0.8,
  "RAW-022": 0.75,
  "RAW-019": 0.6,
  "BIO-002": 1.0,
  "BIO-001": 0.7,
  "BIO-010": 0.8
 },
 "desert": {
  "RAW-025": 1.0,
  "RAW-005": 0.9,
  "RAW-004": 0.7,
  "RAW-022": 0.65,
  "RAW-020": 0.4,
  "RAW-007": 0.5
 },
 "tundra": {
  "RAW-011": 0.85,
  "RAW-001": 0.55,
  "RAW-019": 0.6,
  "RAW-015": 0.6,
  "BIO-003": 0.8,
  "BIO-011": 0.6
 },
 "ice": {
  "RAW-011": 1.0,
  "RAW-024": 0.7,
  "RAW-012": 0.6,
  "RAW-017": 0.7,
  "RAW-014": 0.5
 },
 "methaneIce": {
  "RAW-012": 1.0,
  "RAW-006": 0.7,
  "RAW-011": 0.6,
  "RAW-024": 0.65,
  "RAW-017": 0.6
 },
 "methaneSea": {
  "RAW-012": 0.95,
  "RAW-006": 0.8,
  "RAW-017": 0.75,
  "BIO-003": 0.5,
  "BIO-011": 0.7
 },
 "sulfur": {
  "RAW-018": 1.0,
  "RAW-019": 0.7,
  "RAW-003": 0.5,
  "RAW-025": 0.4
 },
 "toxic": {
  "RAW-018": 0.8,
  "RAW-015": 0.7,
  "RAW-019": 0.65,
  "RAW-003": 0.5,
  "BIO-004": 0.8
 },
 "radioactive": {
  "RAW-010": 1.0,
  "RAW-007": 0.8,
  "RAW-009": 0.6,
  "RAW-021": 0.5,
  "RAW-023": 0.45
 },
 "crystalline": {
  "RAW-025": 1.0,
  "RAW-005": 0.9,
  "RAW-007": 0.85,
  "RAW-002": 0.6,
  "RAW-020": 0.5,
  "RAW-023": 0.55
 },
 "superEarth": {
  "RAW-001": 0.85,
  "RAW-002": 0.7,
  "RAW-009": 0.7,
  "RAW-007": 0.6,
  "RAW-016": 0.6,
  "RAW-011": 0.6,
  "BIO-001": 0.6
 },
 "gasGiant": {
  "RAW-017": 1.0,
  "RAW-013": 0.9,
  "RAW-014": 0.85,
  "RAW-024": 0.6,
  "RAW-015": 0.5
 },
 "heliumGiant": {
  "RAW-013": 1.0,
  "RAW-017": 0.9,
  "RAW-014": 0.7,
  "RAW-015": 0.4
 },
 "methaneGiant": {
  "RAW-012": 0.9,
  "RAW-017": 0.85,
  "RAW-006": 0.6,
  "RAW-024": 0.7,
  "RAW-014": 0.6
 }
};

export const RESOURCE_WORLDS = {};
for (const type in PLANET_RESOURCES) {
  for (const mat in PLANET_RESOURCES[type]) {
    (RESOURCE_WORLDS[mat] = RESOURCE_WORLDS[mat] || []).push(type);
  }
}

/** What a world yields, richest first. */
export function resourcesFor(planetType) {
  const r = PLANET_RESOURCES[planetType] || {};
  return Object.keys(r)
    .map(id => ({ id, richness: r[id] }))
    .sort((a, b) => b.richness - a.richness);
}

/** How good this world is at that material. 0 means it is not there at all. */
export const richnessOf = (planetType, matId) =>
  (PLANET_RESOURCES[planetType] && PLANET_RESOURCES[planetType][matId]) || 0;

/** Where to go looking for something. The survey panel's most useful question. */
export const worldsWith = matId => RESOURCE_WORLDS[matId] || [];

/** Is this a material a planet can produce at all, or does it have to be made? */
export const isPlanetary = matId => !!RESOURCE_WORLDS[matId];

