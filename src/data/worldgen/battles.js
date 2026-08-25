// Living Galaxy — what happened here before you arrived.
//
// A system had no past. It had nine powers who hate each other on a live relationship
// graph, a corp war the contract board pays into, and not one place in the sky where any
// of that had ever happened. The lore was a table of grudges with no geography.
//
// A **graveyard** is a grudge with coordinates. It is a place in the system where two
// named powers fought, on a date the system can tell you, leaving a debris field you can
// fly into and search. Not a container to open once — a field with a finite amount in it
// that yields less each time it is worked, so it is somewhere you *come back to* until it
// is picked over and then it is genuinely picked over.
//
// ## Derived, never stored
//
// A system's battles come out of the world seed and the system's own name, exactly the way
// `systems/lagrange.js` derives its anomalies. Nothing is written down at generation, and
// a save records only which fields have been *worked*. That is the same trade the anomaly
// layer makes and it is the right one: two players handed the same seed find the same
// wrecks in the same place, and the save stays small enough that the history of forty
// systems costs a few dozen bytes.
//
// ## Why the catalogue declares conditions
//
// Each battle kind states the circumstances under which it could have happened — how close
// to a star, whether it needs a station to have been worth defending, how long ago it can
// have been — in the same shape the world catalogue states insolation bands. The generator
// only offers kinds whose conditions the site actually satisfies.
//
// So a boarding action does not occur in empty deep space, because a boarding action needs
// something to board. A siege does not occur where there is nothing to besiege. That is the
// same rule that stops an ice world appearing in an inferno orbit, applied to history
// instead of to physics, and for the same reason: a label that contradicts its own location
// is not lore, it is noise with a proper noun in it.
//
// Pure data and pure functions. No DOM, no three.js, no state.

/**
 * What can be found in a debris field, as `commodity` channels the game already has plus
 * two that are new to salvage.
 *
 *   salvage  — hull plate, structural members, anything a breaker's yard buys by mass.
 *   data     — flight recorders, targeting logs, an intact nav core. Sells to survey desks.
 *   relic    — something the war was actually about, or something nobody has seen since.
 *              Rare, heavy in value, and the reason to search a field to the bottom.
 *   ordnance — live munitions. Worth money and worth being careful about.
 */
export const FIND_KINDS = {
  salvage:  { name: 'Salvage',        commodity: 'salvage', weight: 46, valueMult: 1.0 },
  data:     { name: 'Recovered data', commodity: 'data',    weight: 26, valueMult: 1.6 },
  ordnance: { name: 'Live ordnance',  commodity: 'salvage', weight: 18, valueMult: 2.1,
              hazard: 0.35 },
  relic:    { name: 'Relic',          commodity: 'salvage', weight: 10, valueMult: 5.4,
              rare: true }
};

export const FIND_KEYS = Object.keys(FIND_KINDS);

/**
 * The kinds of engagement a system can have had.
 *
 * `needs` is the envelope, checked against the candidate site before the kind is drawn:
 *   nearStation  — true: must be sited in a station's pocket. false: must not be.
 *   nearBelt     — the field sits in or against a rock field
 *   deepSpace    — out past every planet, where nobody was going
 *   minAgeYears / maxAgeYears — how long ago this kind of fight can have happened
 *
 * `yields` biases the find table: a siege leaves ordnance, a survey convoy ambush leaves
 * data, a lost expedition leaves relics and very little else worth lifting.
 *
 * `scale` sets how much is in the field before anyone works it, and `spread` how far the
 * debris is strewn — a running battle scatters across a wider volume than a massacre does.
 */
export const BATTLE_KINDS = {
  siege: {
    name: 'Siege',
    needs: { nearStation: true, minAgeYears: 8, maxAgeYears: 240 },
    yields: { ordnance: 2.4, salvage: 1.4, data: 0.7, relic: 0.6 },
    scale: [1.2, 2.0], spread: [1.0, 1.6], hazard: 1.35,
    blurb: 'They sat off the ring for eleven weeks and shot at it. The ring shot back. ' +
           'Most of what is out here was aimed at something.'
  },
  ambush: {
    name: 'Convoy ambush',
    // Floor of 1, not 3. Deep space two years ago matched no kind at all — an ambush is the
    // one thing that plausibly happens out there recently, and the sweep in test/missions.mjs
    // found the hole.
    needs: { nearStation: false, minAgeYears: 1, maxAgeYears: 160 },
    yields: { salvage: 2.0, data: 1.5, ordnance: 0.5, relic: 0.8 },
    scale: [0.7, 1.3], spread: [1.4, 2.4], hazard: 0.9,
    blurb: 'Somebody knew the schedule. The escorts died first and the freighters died ' +
           'strung out over half a million kilometres, which is why the field is so thin ' +
           'and so long.'
  },
  fleetAction: {
    name: 'Fleet action',
    // No upper bound on age, and it is the only kind without one. A fleet action is the
    // event a system is still named after centuries later — and structurally it is also the
    // catch-all: a site near a station and inside a belt, eight hundred years old, matched no
    // other kind, so a seed that rolled one silently generated fewer fields than it asked
    // for. `test/missions.mjs` sweeps every plausible site for exactly this.
    needs: { minAgeYears: 20 },
    yields: { salvage: 2.2, ordnance: 1.8, data: 1.2, relic: 1.0 },
    scale: [1.8, 3.2], spread: [1.6, 2.8], hazard: 1.5,
    blurb: 'Two orders of battle met here and neither withdrew in good order. It is the ' +
           'largest single mass of dead hull in the system and it is still not fully charted.'
  },
  boarding: {
    name: 'Boarding action',
    needs: { nearStation: true, minAgeYears: 2, maxAgeYears: 90 },
    yields: { relic: 1.9, data: 1.6, salvage: 1.0, ordnance: 0.4 },
    scale: [0.5, 0.9], spread: [0.5, 0.9], hazard: 1.1,
    blurb: 'Two hulls locked together and the fighting was inside. Whatever the crews were ' +
           'carrying is still aboard, because nobody who knew what it was got off.'
  },
  beltSkirmish: {
    name: 'Claim war',
    needs: { nearBelt: true, minAgeYears: 1, maxAgeYears: 70 },
    yields: { salvage: 1.8, ordnance: 1.1, data: 0.6, relic: 0.5 },
    scale: [0.6, 1.1], spread: [1.2, 2.0], hazard: 1.0,
    blurb: 'A claim dispute that stopped being about paperwork. Mining hulls are not ' +
           'warships and it shows in what is left of them.'
  },
  lostExpedition: {
    name: 'Lost expedition',
    needs: { deepSpace: true, minAgeYears: 60, maxAgeYears: 900 },
    yields: { relic: 3.0, data: 2.2, salvage: 0.6, ordnance: 0.1 },
    scale: [0.4, 0.8], spread: [0.8, 1.4], hazard: 0.6,
    blurb: 'No distress call, no wreckage pattern that reads as combat, and no record of ' +
           'the registry under that number. They came out here on purpose and they did ' +
           'not come back.'
  },
  blockadeRun: {
    name: 'Blockade run',
    needs: { nearStation: true, minAgeYears: 1, maxAgeYears: 120 },
    yields: { salvage: 1.6, data: 1.3, ordnance: 0.9, relic: 1.1 },
    scale: [0.5, 1.0], spread: [1.6, 2.6], hazard: 0.95,
    blurb: 'They tried to get past at speed with the holds full. Some of them made it. ' +
           'This is the rest, spread along the line they were flying.'
  }
};

export const BATTLE_KEYS = Object.keys(BATTLE_KINDS);

/**
 * Name fragments. A graveyard's name is the thing a pilot actually says, so it has to
 * sound like a place people have been talking about for a century rather than like a
 * catalogue entry — which means it mostly does not contain the word "battle".
 */
export const FIELD_HEAD = [
  'Hollow', 'Kessler', 'Sorrow', 'Ash', 'Long', 'Bitter', 'Quiet', 'Iron', 'Cinder',
  'Widow', 'Grave', 'Slack', 'Cold', 'Rust', 'Vane', 'Tallow', 'Mourn', 'Pale'
];

export const FIELD_TAIL = [
  'Drift', 'Reach', 'Shoal', 'Scatter', 'Field', 'Verge', 'Tangle', 'Wake', 'Spill',
  'Bank', 'Run', 'Break', 'Litter', 'Strand'
];

/** How a field is spoken about once it is old enough that nobody involved is alive. */
export const ERA_TEXT = [
  { max: 12,   text: 'still inside living memory — there are people at the ring who were here' },
  { max: 45,   text: 'a generation back; the survivors are old and they do not talk about it' },
  { max: 120,  text: 'before anyone currently flying was born' },
  { max: 400,  text: 'old enough that the registry numbers on the hulls are no longer issued' },
  { max: 1e9,  text: 'so old that which war this was is a matter of opinion' }
];

export const eraTextFor = years =>
  (ERA_TEXT.find(e => years <= e.max) || ERA_TEXT[ERA_TEXT.length - 1]).text;

/**
 * Does a battle kind fit a candidate site?
 *
 * Returns a boolean rather than a score, because this is a gate and not a preference — a
 * boarding action in empty space is not unlikely, it is nonsense, and the whole point of
 * declaring the envelope is that the generator never has to decide how nonsensical is too
 * nonsensical.
 */
export function battleFits(kind, site) {
  const n = kind.needs || {};
  if (n.nearStation === true && !site.nearStation) return false;
  if (n.nearStation === false && site.nearStation) return false;
  if (n.nearBelt === true && !site.nearBelt) return false;
  if (n.deepSpace === true && !site.deepSpace) return false;
  if (n.minAgeYears != null && site.ageYears < n.minAgeYears) return false;
  if (n.maxAgeYears != null && site.ageYears > n.maxAgeYears) return false;
  return true;
}

/** Every kind whose envelope this site satisfies. Never empty in practice — see the test. */
export const candidateBattles = site =>
  BATTLE_KEYS.filter(k => battleFits(BATTLE_KINDS[k], site));
