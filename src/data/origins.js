// Living Galaxy — who you are before you ever touch a throttle.
//
// Four lineages, three of them human and one not quite. Every one of them is a *place*
// first: Solaris has been settled long enough that where you were raised decided what
// your body is used to, what your instincts are, and who is prepared to vouch for you.
// None of that is a stat block dressed up in prose — every line here resolves to numbers
// in systems/character.js, and the tests check that no lineage is strictly better than
// another at everything.
//
// Skills are the six things a pilot can be good at. They appear here as starting ranks
// and affinities (how fast a skill improves from doing the thing), never as flat bonuses,
// so a lineage decides where you *begin* and how fast you climb, not where you can end.

export const SKILLS = {
  gunnery:     { name: 'Gunnery',     desc: 'Weapon damage and tracking' },
  engineering: { name: 'Engineering', desc: 'Power plant output and repair' },
  extraction:  { name: 'Extraction',  desc: 'Mining yield and survey depth' },
  navigation:  { name: 'Navigation',  desc: 'Warp efficiency and handling' },
  commerce:    { name: 'Commerce',    desc: 'Prices, contracts and standing' },
  sensors:     { name: 'Sensors',     desc: 'Detection range and signature discipline' }
};
export const SKILL_KEYS = Object.keys(SKILLS);

// ── lineages ─────────────────────────────────────────────────────────
export const LINEAGES = {
  core: {
    name: 'Core-born',
    tag: 'Solaris Prime and the inner habitats',
    desc: 'Raised inside Coalition law, on stations that have never lost pressure. ' +
          'You know how the paperwork works and whose name opens which door — and every ' +
          'pirate in the belt can tell within a sentence that you have never been hungry.',
    machine: false,
    start: { gunnery: 1, engineering: 1, extraction: 0, navigation: 1, commerce: 3, sensors: 1 },
    affinity: { commerce: 1.35, navigation: 1.10, extraction: 0.80 },
    standing: { coalition: 20, pirate: -10, independent: 0 },
    signature: 1.00,
    credits: 2200,
    corps: ['meridian', 'solaris-authority']
  },

  belter: {
    name: 'Belt-born',
    tag: 'The Meridian field, third generation',
    desc: 'Born to the rock. You can read an ore seam by the sound the cutter makes and ' +
          'you have patched a hull with your gloves on more than once. Low-gravity bones ' +
          'and a deep, inherited suspicion of anyone arriving with a clipboard.',
    machine: false,
    start: { gunnery: 1, engineering: 2, extraction: 3, navigation: 1, commerce: 0, sensors: 0 },
    affinity: { extraction: 1.40, engineering: 1.20, commerce: 0.85 },
    standing: { coalition: -5, pirate: 0, independent: 25 },
    signature: 1.00,
    credits: 1400,
    corps: ['meridian-collective', 'freewake']
  },

  rim: {
    name: 'Rim drifter',
    tag: 'Obscura, Threnody, and whatever came before',
    desc: 'Out past where the patrols bother to turn around. You have flown on bad charts ' +
          'and worse fuel, and you learned navigation the way people learn a language they ' +
          'were dropped into. Nobody out there asks what you did before.',
    machine: false,
    start: { gunnery: 2, engineering: 1, extraction: 1, navigation: 3, commerce: 0, sensors: 1 },
    affinity: { navigation: 1.40, sensors: 1.15, commerce: 0.90 },
    standing: { coalition: -10, pirate: 10, independent: 10 },
    signature: 0.92,
    credits: 1600,
    corps: ['long-dark', 'freewake']
  },

  // The one that is not quite human. Nexis built minds to run its drone shoals; a small
  // number of them walked away, and the Coalition has never entirely decided what that
  // makes them. Mechanically they are the sensor lineage, and they pay for it socially.
  nexis: {
    name: 'Nexis defector',
    tag: 'Machine-descended, unaffiliated',
    desc: 'You were a mind in a shoal, and then you were not. Whatever you are now still ' +
          'reads a sensor return the way other people read a face. The Coalition tolerates ' +
          'you; Nexis wants you back; nobody offers you a drink.',
    machine: true,
    start: { gunnery: 2, engineering: 2, extraction: 0, navigation: 1, commerce: 0, sensors: 4 },
    affinity: { sensors: 1.45, gunnery: 1.15, commerce: 0.70 },
    standing: { coalition: -20, pirate: -25, independent: 5 },
    // A hull built around a machine-descended crew runs cold: fewer life-support cycles,
    // no habitation module, tighter emissions discipline. This is the one lineage that
    // changes how easy you are to see, and it is the reason to take it.
    signature: 0.80,
    credits: 1800,
    corps: ['severance', 'long-dark']
  }
};
export const LINEAGE_KEYS = Object.keys(LINEAGES);

// ── corporations ─────────────────────────────────────────────────────
// Who trained you and who still has your file. A corp is a smaller, sharper choice than
// a lineage: it moves standing and starting kit, not how fast you learn.
export const CORPORATIONS = {
  'solaris-authority': {
    name: 'Solaris Authority',
    bloc: 'coalition',
    motto: 'Order is a service.',
    desc: 'System government. Customs, patrol licensing, the pads at Meridian High. ' +
          'A file with them opens stations and closes belts.',
    standing: { coalition: 15, pirate: -12 },
    credits: 900, probes: 1,
    perk: 'Coalition pads and a clean record',
    bonus: { dockDiscount: 0.08 }
  },
  meridian: {
    name: 'Meridian Shipwrights',
    bloc: 'coalition',
    motto: 'We build the thing you are standing in.',
    desc: 'The yard that fits most of the hulls in this system. Staff rates on refits, ' +
          'and a standing invitation to any shipyard pad.',
    standing: { coalition: 8 },
    credits: 1500,
    perk: 'Staff rates on refits and repairs',
    bonus: { repairDiscount: 0.25, upgradeDiscount: 0.10 }
  },
  'meridian-collective': {
    name: 'Belt Collective',
    bloc: 'independent',
    motto: 'The rock does not care who owns it.',
    desc: 'Not a company so much as an agreement between crews who would rather not be ' +
          'bought. Shares tools, shares claims, remembers debts.',
    standing: { independent: 18, coalition: -5 },
    credits: 700,
    perk: 'Collective tooling — better yield per cycle',
    bonus: { miningMult: 0.12 }
  },
  freewake: {
    name: 'Freewake Haulage',
    bloc: 'independent',
    motto: 'Anything, anywhere, no questions on the manifest.',
    desc: 'Independent freight. Thin margins, long legs, and a habit of not looking too ' +
          'hard at what is in the hold.',
    standing: { independent: 12, pirate: 5, coalition: -8 },
    credits: 1200,
    perk: 'Overbuilt holds',
    bonus: { cargoPct: 0.15 }
  },
  'long-dark': {
    name: 'The Long Dark',
    bloc: 'independent',
    motto: 'Someone has to go first.',
    desc: 'A survey outfit that is mostly three people and a very good sensor package. ' +
          'They map the rim on speculation and sell what they find.',
    standing: { independent: 10 },
    credits: 1000, probes: 3,
    perk: 'Survey package — deeper scans, spare probes',
    bonus: { scanRate: 0.30, sensorMult: 0.10 }
  },
  severance: {
    name: 'Severance',
    bloc: 'independent',
    motto: 'We were all something else first.',
    desc: 'A mutual-aid network of Nexis defectors that officially does not exist. ' +
          'Cold-running hardware, forged transponders, and nobody who will testify.',
    standing: { independent: 8, pirate: -10 },
    credits: 1300,
    perk: 'Emissions discipline — harder to see',
    bonus: { signatureMult: -0.12 }
  }
};
export const CORP_KEYS = Object.keys(CORPORATIONS);

// ── career paths ─────────────────────────────────────────────────────
// A career decides the hull you start in, the licence you already hold, and which of
// the six skills your agent will teach you first. It does not lock anything out — every
// other licence is buyable later, at a price your skills bring down.
export const CAREERS = {
  enforcer: {
    name: 'Enforcer',
    icon: '⚔',
    desc: 'Bounty work. You are paid to end arguments other people started.',
    hull: 'military', weapon: 'gauss',
    licence: 'military',
    skills: ['gunnery', 'engineering'],
    start: { gunnery: 2 },
    agent: 'vasquez'
  },
  prospector: {
    name: 'Prospector',
    icon: '⛏',
    desc: 'Rock, ore, and the patience to sit in a field for six hours.',
    hull: 'industrial', weapon: 'scatter',
    licence: 'industrial',
    skills: ['extraction', 'engineering'],
    start: { extraction: 2 },
    agent: 'okonkwo'
  },
  hauler: {
    name: 'Hauler',
    icon: '📦',
    desc: 'Freight. Unglamorous, dependable, and the only job that pays while you sleep.',
    hull: 'logistics', weapon: 'pulse',
    licence: 'logistics',
    skills: ['navigation', 'commerce'],
    start: { navigation: 2 },
    agent: 'brant'
  },
  broker: {
    name: 'Broker',
    icon: '💰',
    desc: 'You do not move cargo. You move the difference between two prices.',
    hull: 'economic', weapon: 'pulse',
    licence: 'economic',
    skills: ['commerce', 'sensors'],
    start: { commerce: 2 },
    agent: 'delacroix'
  },
  pathfinder: {
    name: 'Pathfinder',
    icon: '◐',
    desc: 'Survey work on the rim. Charts nobody has, sold to people who need them.',
    hull: 'civilian', weapon: 'pulse',
    licence: 'civilian',
    skills: ['sensors', 'navigation'],
    start: { sensors: 2 },
    agent: 'ives'
  },

  // The sixth path, and the only one that does not start with a job. An executive starts
  // with a *charter*: a registered company, a treasury that is not their wallet, and a
  // board of three who disagree with each other about what success is. The hull is a
  // courier because a founder still has to be somewhere; the point of the start is the
  // company, and the site managers in systems/managers.js are its staff.
  executive: {
    name: 'Executive',
    icon: '⌗',
    desc: 'You did not take a job. You registered a company and put your own name on the ' +
          'liability. A hull, a treasury, and three board members who will read the ' +
          'numbers whether you send them or not.',
    hull: 'economic', weapon: 'pulse',
    licence: 'economic',
    skills: ['commerce', 'engineering'],
    start: { commerce: 1, engineering: 1 },
    agent: 'okarie',
    company: { charter: 'economic' }
  }
};
export const CAREER_KEYS = Object.keys(CAREERS);

// ── agents ───────────────────────────────────────────────────────────
// One agent per career, and each greets you differently depending on what you are. The
// greeting is not decoration: a Nexis defector walking into a Coalition bounty office is
// a different conversation, and the game should say so out loud.
export const AGENTS = {
  vasquez: {
    name: 'Adjutant Rea Vasquez',
    role: 'Coalition bounty liaison',
    bloc: 'coalition',
    station: 'shipyard',
    greet: {
      core: 'Another Prime kid with a gun licence. Try to come back with the hull.',
      belter: 'Belt crew, in a gunship. Good. You already know what it costs to lose one.',
      rim: 'Rim ticket. Half of you turn pirate inside a year. Prove me wrong.',
      nexis: 'I read your file twice. I still signed it. Do not make that my problem.',
      any: 'You shoot what the board says, when the board says. Clear?'
    }
  },
  okonkwo: {
    name: 'Foreman Deni Okonkwo',
    role: 'Meridian field survey',
    bloc: 'independent',
    station: 'refinery',
    greet: {
      core: 'Inner-system hands. You will blister. Bring gloves and do not complain.',
      belter: 'You already know the work. I will skip the safety lecture.',
      rim: 'You want steady money for once. The belt can do that, if you can sit still.',
      nexis: 'You will out-survey every crew I have. They will hate you. Dig anyway.',
      any: 'Ore is ore. Fill the hold, bring it back, get paid.'
    }
  },
  brant: {
    name: 'Dispatcher Ilse Brant',
    role: 'Freewake route control',
    bloc: 'independent',
    station: 'trade',
    greet: {
      core: 'Coalition manifest training. Useful, right up until it is not.',
      belter: 'You know the field better than my charts do. Fly it.',
      rim: 'Long legs, bad charts, no escort. You will feel at home.',
      nexis: 'You do not sleep. Do you understand what that is worth to a dispatcher?',
      any: 'Cargo on, cargo off, on time. That is the whole job.'
    }
  },
  delacroix: {
    name: 'Factor Yves Delacroix',
    role: 'Independent market factor',
    bloc: 'independent',
    station: 'trade',
    greet: {
      core: 'You were raised on the right side of the spread. Use it.',
      belter: 'You have been underpaid your whole life. Now you know what it looks like.',
      rim: 'You have seen prices nobody in here believes. Bring me proof.',
      nexis: 'You can hold every price in the system in your head. That is unfair. Continue.',
      any: 'Buy low, sell high, and never fall in love with the cargo.'
    }
  },
  okarie: {
    name: 'Registrar Ada Okarie',
    role: 'Solaris commercial registry',
    bloc: 'coalition',
    station: 'trade',
    greet: {
      core: 'Your family has three charters on file already. This one is yours. Do not lose it.',
      belter: 'A belter with a charter. Half the registry thinks it is a clerical error. Prove them wrong slowly.',
      rim: 'Rim address, Coalition charter. That combination gets audited. Keep your books clean.',
      nexis: 'The statute never said a founder had to be born. It also never said you would be welcome.',
      any: 'You are liable for everything the company does. Sign here, and understand what that means.'
    }
  },
  ives: {
    name: 'Cartographer Sun Ives',
    role: 'The Long Dark, survey',
    bloc: 'independent',
    station: 'science',
    greet: {
      core: 'You have never been anywhere that was not already mapped. Fixing that.',
      belter: 'You read rock. Now read whole worlds.',
      rim: 'You have already been further out than most of my charts. Write it down.',
      nexis: 'Your sensor discipline is better than my equipment. Go and look at something.',
      any: 'Find something nobody has looked at. Look at it properly. Come back.'
    }
  }
};
export const AGENT_KEYS = Object.keys(AGENTS);

/** The agent for a career, with the greeting line for a given lineage resolved. */
export function agentFor(careerKey, lineageKey) {
  const career = CAREERS[careerKey];
  if (!career) return null;
  const a = AGENTS[career.agent];
  if (!a) return null;
  return Object.assign({ key: career.agent, line: a.greet[lineageKey] || a.greet.any }, a);
}

/** Corporations open to a lineage, as full records. */
export function corpsFor(lineageKey) {
  const l = LINEAGES[lineageKey];
  if (!l) return [];
  return l.corps.map(k => Object.assign({ key: k }, CORPORATIONS[k])).filter(c => c.name);
}
