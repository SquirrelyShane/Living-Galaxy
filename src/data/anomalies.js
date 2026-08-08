// Living Galaxy — what is drifting out there.
//
// An anomaly is a one-shot place. You find it by looking, you work it once, and then it is
// worked out — which makes it the opposite of a belt, and the reason the outer system has
// somewhere to go that is not another rock.
//
// The reward channels are all channels that already exist: cargo you sell, materials the
// manufacturing queue eats, credits, and practice. Nothing here is a new currency, and
// nothing here is a key that opens a door — an anomaly that gates progression turns "go
// and look" into "go and fetch", which is the failure mode this is trying to avoid.
//
// `dust` exists on purpose. A survey that always pays is not a survey, it is a vending
// machine with a longer walk; the scouting orders in v1.00.30 learned the same thing, and
// "the scouts found nothing worth the fuel" is still the honest outcome of sending someone
// to look at empty space.

export const ANOMALY_TYPES = {
  derelict: {
    name: 'Derelict hull', icon: '☠', weight: 24,
    salvage: [180, 420], data: [0, 30], credits: [0, 0],
    materials: { 'RAW-001': [60, 180], 'RAW-008': [20, 70], 'REF-001': [10, 45] },
    desc: 'A hull that stopped somewhere nobody was going. The transponder is dead and ' +
          'the registry has no record of it under that number.'
  },
  cache: {
    name: 'Concealed cache', icon: '▣', weight: 18,
    salvage: [0, 60], data: [0, 0], credits: [900, 3400],
    materials: { 'REF-004': [15, 60], 'CMP-001': [2, 9] },
    desc: 'Sealed containers on a slow tumble with no beacon and no manifest. Somebody ' +
          'meant to come back for this.'
  },
  buoy: {
    name: 'Repeating buoy', icon: '☍', weight: 16,
    salvage: [0, 0], data: [120, 300], credits: [0, 400],
    materials: { 'CMP-003': [1, 5] },
    desc: 'Narrowband, periodic, older than the charts. The same signal a few worlds in ' +
          'this system have coming off their surface, and nobody at a station will ' +
          'discuss it on an open channel.'
  },
  shoal: {
    name: 'Trojan rock shoal', icon: '⁘', weight: 22,
    salvage: [40, 140], data: [0, 40], credits: [0, 0],
    materials: { 'RAW-005': [80, 240], 'RAW-011': [40, 160], 'RAW-006': [20, 90] },
    desc: 'Debris that never got anywhere else, swept into the one place in the orbit ' +
          'where nothing has to fight to stay put.'
  },
  knot: {
    name: 'Gravitic knot', icon: '⊛', weight: 12,
    salvage: [0, 0], data: [80, 200], credits: [0, 0],
    materials: { 'RAW-013': [10, 45], 'RAW-014': [8, 30], 'RAW-023': [2, 12] },
    hazard: true,
    desc: 'A standing distortion with nothing at the middle of it. Instruments disagree ' +
          'about where it is, and a warp core will not hold a lock anywhere near it.'
  },
  dust: {
    name: 'Cold dust', icon: '·', weight: 28,
    salvage: [0, 25], data: [0, 20], credits: [0, 0],
    materials: {},
    desc: 'Nothing. Grain, ice and the residue of something that came apart a very long ' +
          'time ago. Worth the fuel to rule out, and not much more.'
  }
};

export const ANOMALY_KEYS = Object.keys(ANOMALY_TYPES);

/** Weighted pick. `rng` is a seeded stream, so a site is the same thing on every client. */
export function rollAnomaly(rng) {
  let total = 0;
  for (const k of ANOMALY_KEYS) total += ANOMALY_TYPES[k].weight;
  let roll = rng.next() * total;
  for (const k of ANOMALY_KEYS) {
    roll -= ANOMALY_TYPES[k].weight;
    if (roll <= 0) return k;
  }
  return 'dust';
}
