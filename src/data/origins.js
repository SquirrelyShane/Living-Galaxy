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

<<<<<<< HEAD
// ── who you are, before any of the rest of it ────────────────────────
//
// A frame is presentation and pronoun, and it is *not* a stat block. That is deliberate and
// it is the only defensible design: tying capability to gender would be both offensive and
// mechanically dull, and the one frame that legitimately differs — a synthetic chassis — is
// already covered by the Forged lineage, which has real trade-offs and is a *choice about
// what you are*, not a choice about how you look.
//
// So this exists to be worn, and the game refers to you correctly afterwards. `synth` is the
// exception that proves the rule: it is available to every lineage, because a person can
// present as a machine without being one, and Forged pilots exist who present as neither.
export const FRAMES = {
  fem: {
    name: 'Feminine', short: 'F',
    pronouns: { subj: 'she', obj: 'her', poss: 'her', refl: 'herself' },
    desc: 'Read as a woman by everyone who meets you.'
  },
  masc: {
    name: 'Masculine', short: 'M',
    pronouns: { subj: 'he', obj: 'him', poss: 'his', refl: 'himself' },
    desc: 'Read as a man by everyone who meets you.'
  },
  andro: {
    name: 'Androgynous', short: 'A',
    pronouns: { subj: 'they', obj: 'them', poss: 'their', refl: 'themself' },
    desc: 'Read as neither, and correct anybody who guesses.'
  },
  synth: {
    name: 'Synthetic', short: 'S',
    pronouns: { subj: 'it', obj: 'it', poss: 'its', refl: 'itself' },
    desc: 'A chassis with a person in it. Some ports will not shake your hand.',
    // Not a stat: a flag the dialogue layer reads, because a few places in the galaxy do
    // treat a synthetic chassis differently and pretending otherwise would be the blander
    // choice. It costs nothing mechanically.
    machineRead: true
  }
};
export const FRAME_KEYS = Object.keys(FRAMES);
export const DEFAULT_FRAME = 'andro';

/** The pronoun set for a frame, falling back to the neutral one. */
export const pronounsOf = key =>
  (FRAMES[key] || FRAMES[DEFAULT_FRAME]).pronouns;

=======
>>>>>>> 1935cd184c7779d3b421a28a48b3b29b1c83bc44
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
<<<<<<< HEAD
    corps: ['meridian', 'aurelian', 'severance']
=======
    corps: ['meridian', 'solaris-authority']
>>>>>>> 1935cd184c7779d3b421a28a48b3b29b1c83bc44
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
<<<<<<< HEAD
    corps: ['freewake', 'halloway', 'drossgate']
=======
    corps: ['meridian-collective', 'freewake']
>>>>>>> 1935cd184c7779d3b421a28a48b3b29b1c83bc44
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
<<<<<<< HEAD
    corps: ['kestrel', 'freewake', 'vosk']
=======
    corps: ['long-dark', 'freewake']
>>>>>>> 1935cd184c7779d3b421a28a48b3b29b1c83bc44
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
<<<<<<< HEAD
    corps: ['severance', 'drossgate', 'kessler']
=======
    corps: ['severance', 'long-dark']
>>>>>>> 1935cd184c7779d3b421a28a48b3b29b1c83bc44
  }
};
export const LINEAGE_KEYS = Object.keys(LINEAGES);

// ── corporations ─────────────────────────────────────────────────────
// Who trained you and who still has your file. A corp is a smaller, sharper choice than
// a lineage: it moves standing and starting kit, not how fast you learn.
<<<<<<< HEAD
// ── corporations ─────────────────────────────────────────────────────
//
// Who trained you and who still has your file. A corp is a smaller, sharper choice than
// a lineage: it moves standing and starting kit, not how fast you learn.
//
// ## Why these are the nine powers and not six other names (v1.02.37)
//
// v1.02.36 introduced nine **powers** in `data/factions.js` — the organisations standing
// is now held with — while leaving this table as six *unrelated* employers. Four of them
// shared a key with a power and described a different organisation entirely, which meant
// the same word meant two things depending on which file you were in:
//
//   `meridian`    here: a shipyard.        In factions: a clearing house.
//   `freewake`    here: a freight company. In factions: "not a company" — a crew pact.
//   `severance`   here: an **independent** mutual-aid network of Nexis defectors.
//                 In factions: a listed **Coalition** finance house that shorts commodities.
//
// That last one is not drift, it is a contradiction — and `CORP_POWERS` was quietly
// granting a defector +22 standing with the finance house they were defecting from. The
// other two employers, `meridian-collective` and `long-dark`, had no power at all, so
// their standing had to be hand-mapped onto organisations they were never described as
// working for.
//
// One vocabulary now. Every employer **is** a power's hiring arm, keyed by that power, so
// `CORP_POWERS` is a straight identity and there is nothing left to keep in step. Nine
// instead of six, so every organisation in the game is one you can have come from.
//
// The perks were audited at the same time. Three of them — `dockDiscount`, `upgradeDiscount`
// and `tradeBonus` — were being summed by `characterBonuses()` and then dropped: two never
// reached `S.stats` at all and the third reached it and was read by nobody. Two of the six
// starting employers had a perk that changed no number in the game. They are wired now
// (see `systems/economy.js`), and every perk below uses a bonus key something consumes.
export const CORPORATIONS = {
  meridian: {
    name: 'Meridian Combine',
    bloc: 'coalition',
    motto: 'Everything is a position. Including you.',
    desc: 'Clearing houses, not cargo. You came up reading the book rather than the ' +
          'manifest, and you still price a hold before you look inside it.',
    standing: { coalition: 12 },
    credits: 1500,
    perk: 'A seat at the book — better prices both ways',
    bonus: { tradeBonus: 0.10 }
  },
  aurelian: {
    name: 'Aurelian Directorate',
    bloc: 'coalition',
    motto: 'Order is a service, and it is billed.',
    desc: 'Customs, patrol licensing, and the pads at every fortress berth. A file with ' +
          'them opens stations and closes belts.',
    standing: { coalition: 15, pirate: -12 },
    credits: 900, probes: 1,
    perk: 'Directorate papers — cheaper at any pad',
    bonus: { dockDiscount: 0.18 }
  },
  halloway: {
    name: 'Halloway Assay',
    bloc: 'coalition',
    motto: 'Unmeasured is unowned.',
    desc: 'You learned the trade on a certification floor, which means you can tell what ' +
          'a seam is worth by looking at it and you cut it cleaner than most.',
    standing: { coalition: 8 },
    credits: 1100,
    perk: 'Assay training — more out of every cycle',
    bonus: { miningMult: 0.14 }
  },
  severance: {
    name: 'Severance Holdings',
    bloc: 'coalition',
    motto: 'Information is the only commodity that does not spoil.',
    desc: 'Listed, audited, and impossible to get a straight answer out of. They kept ' +
          'your file and gave you a transponder that reads as somebody else.',
    standing: { coalition: 6, pirate: -8 },
    credits: 1300,
    perk: 'A quiet transponder — harder to see',
    bonus: { signatureMult: -0.12 }
  },
  freewake: {
    name: 'Freewake Collective',
    bloc: 'independent',
    motto: 'Nobody flies alone twice.',
    desc: 'Not a company so much as an agreement between crews who would rather not be ' +
          'bought. Shares tools, shares claims, remembers debts.',
    standing: { independent: 18, coalition: -5 },
=======
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
>>>>>>> 1935cd184c7779d3b421a28a48b3b29b1c83bc44
    credits: 1200,
    perk: 'Overbuilt holds',
    bonus: { cargoPct: 0.15 }
  },
<<<<<<< HEAD
  kestrel: {
    name: 'Kestrel Guild',
    bloc: 'independent',
    motto: 'A contract kept is the only credential.',
    desc: 'The register that decides who may be hired. You are on the roll, which is ' +
          'worth more than any letter of reference and easier to lose.',
    standing: { independent: 12 },
    credits: 1000,
    perk: 'Registered gun — trained on the rack',
    bonus: { weaponMult: 0.12 }
  },
  drossgate: {
    name: 'Drossgate Yards',
    bloc: 'independent',
    motto: 'Everything comes apart. That is not a tragedy.',
    desc: 'Breaker fields and welding arcs. You have taken more hulls apart than most ' +
          'pilots have flown, and the yards still charge you staff rates.',
    standing: { independent: 10 },
    credits: 1400,
    perk: 'Staff rates on refits and repairs',
    bonus: { repairDiscount: 0.25, upgradeDiscount: 0.12 }
  },
  kessler: {
    name: 'Kessler Compact',
    bloc: 'pirate',
    motto: 'We charge for the road. They charge for the paperwork.',
    desc: 'You crewed for the compact that taxes the corridor and keeps books about it. ' +
          'The Directorate has a name for that; the corridor has a toll booth.',
    standing: { pirate: 20, coalition: -18 },
    credits: 1600,
    perk: 'Corridor navigation — faster in the bubble',
    bonus: { warpSpeedMult: 0.12 }
  },
  vosk: {
    name: 'Vosk Reclamation',
    bloc: 'pirate',
    motto: 'Salvage law is just law that arrived first.',
    desc: 'Wreck work. Nobody asks what the hull was doing before it stopped answering, ' +
          'and the arms you learned on will pull anything out of anything.',
    standing: { pirate: 14, coalition: -12 },
    credits: 1000,
    perk: 'Recovery rigging — a bigger hold and a longer reach',
    bonus: { cargoPct: 0.10, sensorMult: 0.08 }
=======
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
>>>>>>> 1935cd184c7779d3b421a28a48b3b29b1c83bc44
  }
};
export const CORP_KEYS = Object.keys(CORPORATIONS);

<<<<<<< HEAD
/**
 * Employers that no longer exist under that name, and where their people went.
 *
 * The v1.02.37 rewrite retired three keys and changed what two others describe. A save is
 * allowed to carry any of them — `character.corp` is persisted — and `createCharacter()`
 * refuses an unknown corporation by returning null, which on a load path is a character
 * that silently fails to rebuild. So the old names resolve rather than fail.
 *
 * Two of these are lossy and it is worth being straight about which:
 *
 *   `meridian` still exists as a key but is now the Combine (a clearing house) rather than
 *   the Shipwrights (a yard). A pilot who joined for staff rates on refits now works for
 *   the book instead. The yard perk did not vanish — it moved to Drossgate, which is the
 *   organisation that actually repairs things.
 *
 *   `severance` still exists as a key but has flipped bloc. It was described here as an
 *   independent mutual-aid network of Nexis defectors and in `data/factions.js` as a
 *   listed Coalition finance house. Both cannot be true; the finance house won, because
 *   it is the one nine powers' worth of politics is built around.
 */
export const CORP_ALIASES = {
  'solaris-authority':   'aurelian',    // customs, patrol licensing, the pads — the Directorate
  'meridian-collective': 'freewake',    // a crew agreement by another name
  'long-dark':           'kestrel'      // rim independents; the register is where they ended up
};

/** Canonical employer key, tolerating a retired one from an old save. */
export const resolveCorp = key => (CORPORATIONS[key] ? key : (CORP_ALIASES[key] || key));

=======
>>>>>>> 1935cd184c7779d3b421a28a48b3b29b1c83bc44
// ── where a birth and an employer actually leave you (v1.02.36) ──────
//
// Lineage and corporation used to grant standing with a whole *bloc* — twenty points of
// "Coalition", which is three organisations who disagree with each other about everything.
// These are the same head start expressed against the powers that would actually have an
// opinion, and they are the only thing that moves standing away from zero at creation.
//
// Kept beside the tables rather than inside them so `systems/reputation.js` can go on
// reading the bloc numbers for the coarse questions it is still right about.
export const LINEAGE_POWERS = {
  core:   { meridian: 18, aurelian: 12, halloway: 8, kessler: -14, vosk: -10 },
  belter: { freewake: 22, drossgate: 14, halloway: -6, meridian: -8, aurelian: -10 },
  rim:    { kestrel: 16, drossgate: 12, vosk: 8, aurelian: -12, meridian: -8 },
  nexis:  { severance: 14, drossgate: 10, aurelian: -18, kestrel: -8, halloway: -6 }
};

export const CORP_POWERS = {
<<<<<<< HEAD
  // A straight identity plus the rivalries the employment implies. Because every employer
  // *is* a power now, there is nothing here that can disagree with `data/factions.js` —
  // which is the whole reason the table was rewritten.
  meridian:  { meridian: 20, severance: -10 },
  aurelian:  { aurelian: 18, meridian: 8, kessler: -18 },
  halloway:  { halloway: 20, drossgate: 6, vosk: -10 },
  severance: { severance: 22, freewake: -18, aurelian: -10 },
  freewake:  { freewake: 20, kestrel: 8, severance: -14 },
  kestrel:   { kestrel: 20, aurelian: 6, kessler: -12 },
  drossgate: { drossgate: 20, halloway: 8, aurelian: -6 },
  kessler:   { kessler: 22, aurelian: -20, meridian: -10 },
  vosk:      { vosk: 20, kessler: 10, halloway: -12 }
=======
  'solaris-authority':  { aurelian: 16, meridian: 10, kessler: -18 },
  'meridian':           { meridian: 20, severance: -10 },
  'meridian-collective':{ freewake: 16, meridian: 8, severance: -12 },
  'freewake':           { freewake: 20, kestrel: 8, severance: -14 },
  'long-dark':          { vosk: 14, drossgate: 10, aurelian: -14 },
  'severance':          { severance: 22, freewake: -18, aurelian: -10 }
>>>>>>> 1935cd184c7779d3b421a28a48b3b29b1c83bc44
};

/** The creation head start for a lineage + corporation, merged. */
export function startingStanding(lineage, corp) {
  const out = {};
  const add = t => { for (const k of Object.keys(t || {})) out[k] = (out[k] || 0) + t[k]; };
  add(LINEAGE_POWERS[lineage]);
  add(CORP_POWERS[corp]);
  return out;
}


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
          'liability. A treasury, three board members who will read the numbers whether ' +
          'you send them or not — and no ship. You start on the office deck. What you fly ' +
          'is the first thing you decide.',
    hull: 'economic', weapon: 'pulse',
    licence: 'economic',
    // Licensed for a freighter and in possession of none. See createCharacter().
    shipless: true,
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
