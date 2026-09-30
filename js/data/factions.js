export const BLOCS = {
  coalition:   { name: 'Coalition',   color: 0x4fd6ff, desc: 'Chartered space. Law, tariffs, and paperwork that mostly works.' },
  independent: { name: 'Independent', color: 0x54e0a0, desc: 'Everyone who signed nothing. Belters, free ports, contract crews.' },
  pirate:      { name: 'Outer',       color: 0xff5a48, desc: 'The claim-and-hold economy. Not lawless — differently lawed.' }
};
export const BLOC_KEYS = Object.keys(BLOCS);

export const POWERS = {
  meridian: {
    name: 'Meridian Combine',
    short: 'Meridian',
    bloc: 'coalition',
    color: 0x4fd6ff,
    charter: 'economic',
    temper: { gain: 1.0, loss: 1.0, memory: 0.6 },
    seat: 'the inner exchanges',
    blurb: 'The oldest chartered combine still trading under its founding name. Runs the ' +
           'clearing houses the whole inner system prices against, which is a quieter kind ' +
           'of power than a fleet and has outlasted several.',
    doctrine: 'Everything is a position. Including you.',
    hires: ['courier', 'supply', 'survey', 'escort'],
    regard: { severance: -0.5, freewake: 0.2, aurelian: 0.4, halloway: -0.2, kessler: -0.7 }
  },

  aurelian: {
    name: 'Aurelian Directorate',
    short: 'Aurelian',
    bloc: 'coalition',
    color: 0x8fb0ff,
    charter: 'military',
    temper: { gain: 0.7, loss: 1.4, memory: 0.9 },
    seat: 'the fortress line',
    blurb: 'The Coalition\'s standing navy in everything but name — chartered as a ' +
           'security contractor because a charter can be revoked and an army cannot. ' +
           'Writes the bounty schedule the rest of the inner system pays against.',
    doctrine: 'Order is a service, and it is billed.',
    hires: ['bounty', 'escort', 'patrol', 'survey'],
    regard: { kessler: -0.9, severance: -0.6, meridian: 0.4, halloway: 0.1, freewake: -0.1 }
  },

  halloway: {
    name: 'Halloway Assay',
    short: 'Halloway',
    bloc: 'coalition',
    color: 0xffb43a,
    charter: 'industrial',
    temper: { gain: 0.9, loss: 0.9, memory: 0.5 },
    seat: 'the refineries',
    blurb: 'Refines and certifies. A Halloway assay stamp is what turns a hold of rock ' +
           'into a priced commodity, which means everybody who cuts ore eventually works ' +
           'for them whether they signed anything or not.',
    doctrine: 'Unmeasured is unowned.',
    hires: ['supply', 'survey', 'salvage', 'courier'],
    regard: { severance: -0.3, meridian: -0.2, freewake: 0.3, kessler: -0.4, drossgate: 0.2 }
  },

  freewake: {
    name: 'Freewake Collective',
    short: 'Freewake',
    bloc: 'independent',
    color: 0x54e0a0,
    charter: 'logistics',
    temper: { gain: 1.3, loss: 0.8, memory: 0.3 },
    seat: 'the free ports',
    blurb: 'Not a company — a standing agreement between several thousand crews that they ' +
           'will not undercut each other and will not carry for anyone who does. It has ' +
           'no fleet and can close a lane anyway.',
    doctrine: 'Nobody flies alone twice.',
    hires: ['haul', 'courier', 'supply', 'salvage'],
    regard: { meridian: 0.2, severance: -0.8, kessler: -0.3, halloway: 0.3, drossgate: 0.1 }
  },

  kestrel: {
    name: 'Kestrel Guild',
    short: 'Kestrel',
    bloc: 'independent',
    color: 0xd8b45a,
    charter: 'military',
    temper: { gain: 1.1, loss: 1.1, memory: 0.7 },
    seat: 'the hiring halls',
    blurb: 'The mercenary register. Kestrel does not fight; it decides who is allowed to ' +
           'be hired to, and a crew struck from the roll finds every legitimate desk in ' +
           'the system suddenly fully staffed.',
    doctrine: 'A contract kept is the only credential.',
    hires: ['bounty', 'escort', 'patrol'],
    regard: { aurelian: 0.2, kessler: -0.5, severance: 0.1, freewake: 0.2, meridian: 0.1 }
  },

  drossgate: {
    name: 'Drossgate Yards',
    short: 'Drossgate',
    bloc: 'independent',
    color: 0x9a8ad0,
    charter: 'industrial',
    temper: { gain: 1.0, loss: 0.7, memory: 0.4 },
    seat: 'the breaker fields',
    blurb: 'Builds nothing new and can repair anything. Grew out of the wreck fields left ' +
           'by the Tariff War and never stopped — half the hulls in the outer system have ' +
           'a Drossgate weld somewhere in them.',
    doctrine: 'Everything comes apart. That is not a tragedy.',
    hires: ['salvage', 'supply', 'haul'],
    regard: { kessler: 0.2, halloway: 0.2, severance: -0.2, aurelian: -0.3, freewake: 0.1 }
  },

  severance: {
    name: 'Severance Holdings',
    short: 'Severance',
    bloc: 'coalition',
    color: 0xff77cc,
    charter: 'economic',
    temper: { gain: 0.6, loss: 1.6, memory: 1.0 },
    seat: 'nowhere it admits to',
    blurb: 'Chartered, listed, and audited annually by a firm it owns. Severance buys ' +
           'positions rather than cargo, and the positions it buys have a way of becoming ' +
           'correct shortly afterwards.',
    doctrine: 'Information is the only commodity that does not spoil.',
    hires: ['courier', 'survey', 'bounty'],
    regard: { meridian: -0.5, aurelian: -0.6, freewake: -0.8, kessler: 0.3, halloway: -0.3 }
  },

  kessler: {
    name: 'Kessler Compact',
    short: 'Kessler',
    bloc: 'pirate',
    color: 0xff5a48,
    charter: 'military',
    temper: { gain: 1.4, loss: 0.9, memory: 0.8 },
    seat: 'the claimed belts',
    blurb: 'The largest of the claim-and-hold powers, and the only one that keeps books. ' +
           'Kessler taxes the lanes it holds and defends them properly, which its victims ' +
           'find more insulting than raiding.',
    doctrine: 'We charge for the road. They charge for the paperwork.',
    hires: ['salvage', 'bounty', 'haul'],
    regard: { aurelian: -0.9, meridian: -0.7, severance: 0.3, drossgate: 0.2, kestrel: -0.5 }
  },

  vosk: {
    name: 'Vosk Reclamation',
    short: 'Vosk',
    bloc: 'pirate',
    color: 0xc4703a,
    charter: 'industrial',
    temper: { gain: 1.5, loss: 0.6, memory: 0.2 },
    seat: 'the wrecks',
    blurb: 'Strips what Kessler stops. Vosk crews will recover a hull with the crew still ' +
           'aboard and consider having knocked first to be the courtesy. Pays in full, ' +
           'immediately, and asks nothing.',
    doctrine: 'Salvage law is just law that arrived first.',
    hires: ['salvage', 'haul'],
    regard: { kessler: 0.4, drossgate: 0.3, aurelian: -0.7, halloway: -0.4, meridian: -0.4 }
  }
};
export const POWER_KEYS = Object.keys(POWERS);

export const powersOf = bloc => POWER_KEYS.filter(k => POWERS[k].bloc === bloc);

export const HISTORY = [
  {
    year: 0,
    title: 'The Charter',
    powers: ['meridian', 'aurelian', 'halloway'],
    shift: { 'meridian:aurelian': 0.3, 'meridian:halloway': 0.2, 'aurelian:halloway': 0.2 },
    text: 'Three combines put their names to a single set of tariffs and called the result ' +
          'the Coalition. It was a cartel agreement with a flag on it, and it held, which ' +
          'is more than anyone expected.'
  },
  {
    year: 34,
    title: 'The Assay Act',
    powers: ['halloway', 'meridian'],
    shift: { 'halloway:meridian': -0.2 },
    text: 'Halloway won the right to certify every commodity traded inside Coalition space. ' +
          'Meridian had wanted it and has been quietly funding the challenge ever since — ' +
          'a grudge conducted entirely through committees, and none the less real for it.'
  },
  {
    year: 61,
    title: 'The Tariff War',
    powers: ['meridian', 'freewake', 'aurelian'],
    shift: { 'meridian:freewake': -0.6, 'aurelian:freewake': -0.4 },
    text: 'The Coalition set a transit levy on unchartered hulls. The independent crews did ' +
          'not protest and did not fight — they simply stopped carrying, all of them, for ' +
          'nine weeks. Three inner stations went to rationing. The levy was withdrawn and ' +
          'the Freewake Collective existed as a fact from that day.'
  },
  {
    year: 63,
    title: 'The Breaker Fields',
    powers: ['drossgate', 'freewake', 'aurelian'],
    shift: { 'drossgate:freewake': 0.3, 'drossgate:aurelian': -0.3 },
    text: 'The war left more hulls than crews. The yards that grew up cutting them apart ' +
          'became Drossgate, which has never built a ship and can rebuild any of them.'
  },
  {
    year: 88,
    title: 'The Kessler Claim',
    powers: ['kessler', 'aurelian', 'meridian'],
    shift: { 'kessler:aurelian': -0.7, 'kessler:meridian': -0.5 },
    text: 'A raiding compact declared a belt corridor its own, posted a tariff, and — this ' +
          'was the part nobody was ready for — published the accounts. The Directorate has ' +
          'called it piracy for sixty years and has never once retaken the corridor.'
  },
  {
    year: 96,
    title: 'The Register',
    powers: ['kestrel', 'aurelian', 'kessler'],
    shift: { 'kestrel:aurelian': 0.3, 'kestrel:kessler': -0.4 },
    text: 'After the fourth mercenary company took Coalition money and Kessler money in the ' +
          'same quarter, the free crews wrote their own register. Kestrel decides who may ' +
          'be hired. Nobody elected it and everybody checks it.'
  },
  {
    year: 112,
    title: 'The Silent Quarter',
    powers: ['severance', 'meridian', 'freewake'],
    shift: { 'severance:meridian': -0.5, 'severance:freewake': -0.7 },
    text: 'Severance held short positions on four commodities for a quarter in which all ' +
          'four collapsed. Two inquiries found nothing, both chaired by former Severance ' +
          'counsel. The Collective has refused their cargo since, at cost to itself.'
  },
  {
    year: 127,
    title: 'The Vosk Precedent',
    powers: ['vosk', 'kessler', 'halloway'],
    shift: { 'vosk:kessler': 0.4, 'vosk:halloway': -0.4 },
    text: 'A tribunal in a station Vosk had already stripped ruled that a hull under way ' +
          'with no answering signal is salvage. The ruling has no force anywhere that ' +
          'matters and is cited constantly by people it benefits.'
  },
  {
    year: 141,
    title: 'The Quiet Merger',
    powers: ['severance', 'kessler'],
    shift: { 'severance:kessler': 0.4, 'severance:aurelian': -0.3 },
    text: 'Three Severance subsidiaries were found to be holding Kessler paper. Severance ' +
          'called it a hedging error. The Directorate called it treason and could prove ' +
          'neither, which is the position it has held ever since.'
  },
  {
    year: 158,
    title: 'Now',
    powers: [],
    shift: {},
    text: 'The Charter holds. The corridor is still Kessler\'s. Everyone is trading with ' +
          'everyone and nobody has forgotten anything.'
  }
];

export const NOW = HISTORY[HISTORY.length - 1].year;

const relCache = new Map();

export function relationOf(a, b) {
  if (a === b) return 1;
  const key = a + '>' + b;
  if (relCache.has(key)) return relCache.get(key);
  const A = POWERS[a], B = POWERS[b];
  if (!A || !B) return 0;

  let v = (A.regard && A.regard[b]) || 0;
  for (const e of HISTORY) {
    for (const pair of Object.keys(e.shift || {})) {
      const [x, y] = pair.split(':');
      if ((x === a && y === b) || (x === b && y === a)) v += e.shift[pair];
    }
  }
  if (A.bloc === B.bloc) v += 0.15;
  else if ((A.bloc === 'coalition' && B.bloc === 'pirate') ||
           (A.bloc === 'pirate' && B.bloc === 'coalition')) v -= 0.35;

  v = Math.max(-1, Math.min(1, v));
  relCache.set(key, v);
  return v;
}

export function relationLabel(v) {
  if (v >= 0.5) return 'allied';
  if (v >= 0.2) return 'friendly';
  if (v > -0.2) return 'correct';
  if (v > -0.5) return 'cold';
  if (v > -0.8) return 'hostile';
  return 'at war';
}

export function activeWars() {
  const out = [];
  for (let i = 0; i < POWER_KEYS.length; i++) {
    for (let j = i + 1; j < POWER_KEYS.length; j++) {
      const a = POWER_KEYS[i], b = POWER_KEYS[j];
      const v = Math.min(relationOf(a, b), relationOf(b, a));
      if (v <= -0.5) out.push({ a, b, value: v, label: relationLabel(v) });
    }
  }
  return out.sort((x, y) => x.value - y.value);
}

export const historyOf = power =>
  HISTORY.filter(e => (e.powers || []).includes(power)).slice().reverse();

export function powerFor(key) {
  if (POWERS[key]) return key;
  const list = powersOf(key);
  return list.length ? list[0] : null;
}
