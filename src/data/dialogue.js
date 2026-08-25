// Living Galaxy — what happens when you open a channel.
//
// ## The gap this fills
//
// Hailing a station printed one line of flavour and offered a docking button. Hailing a ship
// was not possible at all. Everything in the sky was either a target or a shop, which is a
// strange thing to be true of a galaxy that has nine powers, three blocs, standing that moves
// every time you pull a trigger, and NPCs who remember you.
//
// ## Three doors, and which of them are open
//
// **Conversation** — who are you, who am I, what is going on here. First contact is its own
// branch, because meeting somebody for the first time and meeting them for the fifth are
// different conversations and pretending otherwise is what makes NPC dialogue feel like a
// vending machine.
//
// **Persuasion** — the branch with a *cost*. Talk somebody into hiring on, standing down,
// paying up, or looking the other way. It can fail, and failing costs standing, because a
// persuasion attempt that is free to try is a button you mash rather than a decision.
//
// **Station services** — the berth's side of a docking request. It scans your hold, reads
// your transponder, checks who you have been shooting, and *then* decides whether the
// conversation continues. A Coalition patrol hub does not trade with a hull that has been
// running for Drossgate, and a pirate anchorage does not open its racks to somebody flying
// a Coalition charter — unless the local staff are on the take, which some of them are.
//
// And **war**, which is not a door so much as what the doorway becomes when the thing you
// hailed already wants you dead. It is pushed to the front of the list, because a menu whose
// first item is "exchange pleasantries" while somebody has a lock on you is a menu written by
// somebody who has never been shot at.
//
// ## Rules for the corpus
//
// - **Disposition first, identity second.** What somebody says to you is governed by what
//   they think of you; who they are only colours it. That ordering is why the same station
//   can be welcoming and frosty without needing two sets of lines.
// - **Nothing here mutates anything.** Pure data. `systems/npc/parley.js` runs it.
// - **No numbers in dialogue.** Same rule as the crew corpus: a line that quotes a figure is
//   a line that goes stale the moment the figure changes.

/**
 * How the other side feels about you, worst to best.
 *
 * Five bands rather than a number, because dialogue branches on *kind* of relationship and a
 * continuous scale forces every line to pick a threshold anyway. `parley.js` derives it.
 */
export const DISPOSITION = ['hostile', 'cold', 'wary', 'neutral', 'warm', 'allied'];

/** What kind of thing you are talking to. Governs which branches exist at all. */
export const SUBJECT = {
  STATION: 'station',
  SHIP: 'ship',
  DERELICT: 'derelict'
};

// ── openers ──────────────────────────────────────────────────────────
//
// The first thing said when the channel opens. By disposition, then by whether this is a
// first contact — which is the one piece of history that changes an opener completely.

export const OPENERS = {
  station: {
    first: {
      hostile: n => `${n} control. We know that transponder. Turn around.`,
      cold:    n => `${n} control. State your business and keep it short.`,
      wary:    n => `${n} approach. You are not on our manifest. Identify.`,
      neutral: n => `${n} approach control. Reading you clear. What can we do for you?`,
      warm:    n => `${n} control — new hull on the board. Welcome in, we will find you a slot.`,
      allied:  n => `${n} control. You are on the friendly list already. Come alongside.`
    },
    known: {
      hostile: n => `${n} control. You have some nerve calling us.`,
      cold:    n => `${n}. We remember. Say your piece.`,
      wary:    n => `${n} control. Back again. Behave and this stays easy.`,
      neutral: n => `${n} control. Go ahead.`,
      warm:    n => `${n} control — good to hear you. Same slot as last time?`,
      allied:  n => `${n}. Pad is warm, the desk is open, and somebody owes you a drink.`
    }
  },
  ship: {
    first: {
      hostile: n => `${n} here. You are a long way from anyone who would miss you.`,
      cold:    n => `${n}. Make it quick.`,
      wary:    n => `${n} responding. I do not know you. Keep your distance while we talk.`,
      neutral: n => `${n} on the channel. Go ahead.`,
      warm:    n => `${n} here — always good to hear another hull out this far.`,
      allied:  n => `${n}. Good to hear a friendly voice. What do you need?`
    },
    known: {
      hostile: n => `${n}. I told you what happens next time.`,
      cold:    n => `${n}. What.`,
      wary:    n => `${n}. You again. What is it this time?`,
      neutral: n => `${n} here. Go ahead.`,
      warm:    n => `${n} — thought that was your signature. What is the word?`,
      allied:  n => `${n}. Anything you need, you have it. You know that.`
    }
  },
  derelict: {
    first: {
      neutral: n => `Nothing on the channel from ${n}. Automated beacon, and a lot of static.`
    },
    known: {
      neutral: n => `${n} is still cold. The beacon has not changed.`
    }
  }
};

// ── conversation ─────────────────────────────────────────────────────
//
// Introductions and small talk. Cheap, safe, and the only branch that is always open — a
// channel you cannot say anything harmless on is not a channel.

export const CONVERSATION = {
  introduce: {
    label: 'Introduce yourself',
    once: true,                      // first contact only
    lines: {
      hostile: 'Save it. We know who you are and we know who you fly for.',
      cold:    'Noted. I will not pretend that changes anything.',
      wary:    'Right. Well. Now we have both said a name at each other.',
      neutral: 'Good to put a name to a signature. We will log it.',
      warm:    'Pleased to meet you properly. We will remember the hull.',
      allied:  'About time. You have been on our board for a while.'
    },
    // Making yourself known is worth something, but only where somebody was undecided.
    standing: { hostile: 0, cold: 0, wary: 1, neutral: 1, warm: 1, allied: 0 }
  },
  local: {
    label: 'Ask what is going on here',
    lines: {
      hostile: 'You will find out.',
      cold:    'Same as everywhere. People take things and other people object.',
      wary:    'Quiet, mostly. Quiet the way a held breath is quiet.',
      neutral: 'Traffic is up, escorts are short, and the belts are being worked hard.',
      warm:    'Between us — there is more armed traffic through here than the board admits.',
      allied:  'Straight answer: somebody is buying salvage above market and not saying why.'
    }
  },
  work: {
    label: 'Ask if there is work',
    lines: {
      hostile: 'There is a bounty. It is yours. That is the work.',
      cold:    'Not for you.',
      wary:    'Maybe. Read the board like everybody else.',
      neutral: 'Board is posted. Take what your hull is cleared for.',
      warm:    'There is a run nobody wants. Ask at the desk and use my name.',
      allied:  'Always. And you get first refusal, which is more than most get.'
    }
  },
  part: {
    label: 'End the call',
    lines: {
      hostile: 'Do not call again.',
      cold:    'Fine.',
      wary:    'Keep clear.',
      neutral: 'Safe flying.',
      warm:    'Good hunting out there.',
      allied:  'Watch your back. Call if it goes wrong.'
    }
  }
};

// ── war ──────────────────────────────────────────────────────────────
//
// Pushed to the front when the other side is hostile. Two ways out of a fight and one way
// deeper into it, which is the right shape: a hostile encounter you cannot talk your way out
// of at all is just a health bar with a face on it.

export const WAR = {
  standdown: {
    label: 'Tell them to stand down',
    lines: {
      hostile: 'You are giving *us* orders. That is funny. Say it again with more guns.',
      cold:    'And if we do not?'
    }
  },
  tribute: {
    label: 'Offer to pay them off',
    lines: {
      hostile: 'Money. Now there is a language. Show it and we will talk.',
      cold:    'Everything is for sale. Even us. Especially us.'
    }
  },
  threaten: {
    label: 'Threaten them',
    lines: {
      hostile: 'Try it.',
      cold:    'You are one hull. We are a policy.'
    }
  },
  declare: {
    label: 'Open fire',
    lines: {
      hostile: 'Finally. Something honest.',
      cold:    'You have just made this very simple.'
    }
  }
};

// ── persuasion ───────────────────────────────────────────────────────
//
// The branch that can fail. Each entry names what it is trying to achieve, how hard that is
// before modifiers, and what it says on the way in, out and down.

export const PERSUASION = {
  hire: {
    label: 'Offer them a berth',
    subject: 'ship',
    difficulty: 0.55,
    ask: 'We have a berth open and we pay on time. Fly with us.',
    win: 'I have flown for worse. All right. Send the papers.',
    lose: 'I have a ship. What I do not have is a reason to leave it.'
  },
  standdown: {
    label: 'Talk them out of the fight',
    subject: 'ship',
    difficulty: 0.78,
    ask: 'Nobody here gets paid for dying. Break off and we both go home.',
    win: 'You are not worth the plating. Going. Do not follow.',
    lose: 'We are already being paid for exactly this.'
  },
  discount: {
    label: 'Talk the price down',
    subject: 'station',
    difficulty: 0.5,
    ask: 'Your rates are a suggestion and we both know it.',
    win: 'Fine. Off the record, and do not tell the next hull.',
    lose: 'The rate is the rate. There is a queue behind you.'
  },
  passage: {
    label: 'Ask them to look the other way',
    subject: 'station',
    difficulty: 0.72,
    ask: 'Some of what we are carrying is nobody’s business. Including yours.',
    win: 'The scanner has been unreliable all week. Terrible equipment.',
    lose: 'That is exactly the sort of thing the scanner is for.'
  },
  contract: {
    label: 'Ask them to fly for you',
    subject: 'ship',
    difficulty: 0.62,
    ask: 'One run, our terms, your hull. Say a number.',
    win: 'One run. And I want half up front, because I have met people before.',
    lose: 'Not for what you are offering, and not with that hull.'
  }
};

// ── station services ─────────────────────────────────────────────────
//
// What a berth does before it decides whether to keep talking: reads the transponder, scans
// the hold, and looks up who you have been shooting.

export const SERVICE_STEPS = [
  { id: 'ident',  line: n => `${n} is reading your transponder.` },
  { id: 'scan',   line: n => `${n} is running a cargo scan.` },
  { id: 'record', line: n => `${n} is pulling your record.` }
];

export const SERVICE_VERDICT = {
  refused: {
    hostile: n => `${n} control: this berth is closed to you. Permanently, as far as we are concerned.`,
    cold:    n => `${n} control: we are not taking your business. Try a port with lower standards.`
  },
  contraband: n => `${n} control: that scan came back wrong. Dump it, declare it, or leave.`,
  bribed:  n => `${n} control: the scan came back clean. Funny old machine.`,
  clear: {
    wary:    n => `${n} control: cleared, conditionally. We will be watching the hold.`,
    neutral: n => `${n} control: cleared. Pad services and the trade desk are open to you.`,
    warm:    n => `${n} control: cleared, and the desk knows your name. Anything you need.`,
    allied:  n => `${n} control: cleared to all services. Refit, board, brokerage, the lot.`
  }
};

/**
 * What a bloc will not have aboard a hull it is clearing.
 *
 * Contraband is *relative*, which is the entire point of it: raw ore is raw ore everywhere,
 * and salvage stripped off a Coalition patrol wreck is evidence at a Coalition berth and
 * merchandise at an Outer one. A single "illegal goods" flag would have been simpler and
 * would have thrown away the only interesting thing about smuggling.
 */
export const CONTRABAND = {
  coalition:   ['salvage'],
  pirate:      ['data'],
  independent: []
};

/** How much of a load a berth will overlook before it counts as running contraband. */
export const CONTRABAND_FLOOR = 40;
