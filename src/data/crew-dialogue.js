// Living Galaxy — what the people aboard actually say to each other.
//
// ## The gap this fills
//
// The crew were a spreadsheet. Seven roles, twelve traits, a morale number and an
// experience curve — a good simulation of *labour* and no simulation at all of *people*.
// You could read that a Rig tech was at 34% morale and you could not tell, from anything
// they ever said, that they minded.
//
// A ship with six people on it should sound like it. Not constantly — a radio that never
// stops is a radio you mute — but often enough that the hold, the galley and the gun deck
// are places somebody lives rather than three multipliers on a stat block.
//
// ## How a line gets chosen
//
// Four keys, narrowest first, and the narrowest hit wins:
//
//     situation × post × trait × mood
//
// A gunner and a quartermaster do not say the same thing about a fight. A Veteran and a
// Green do not say the same thing about *anything*. And the same person says a different
// thing about the same event at 20% morale than at 90%. Every line here is filed under the
// narrowest key that is actually true of it: a line that only a Glutton would say goes
// under `glutton`, and a line anybody would say goes in `any`, and the selector prefers the
// specific one when it exists. That is what stops twelve traits collapsing into a palette
// swap of the same six sentences.
//
// **Exchanges** are the other half. One person saying something is chatter; one person
// saying something and another answering is a crew. An exchange names the post that opens
// it and the post that answers, so `EXCHANGES` only fires when the ship actually carries
// both — which means a two-hander is a thing you earn by hiring, not a thing that plays
// with an empty chair.
//
// ## Rules for the corpus
//
// - **Nobody addresses the player.** These are people talking to each other, overheard.
//   ARIA talks to the pilot; the crew talk about the pilot, occasionally, in the third
//   person, and that difference is most of what makes the ship feel crewed.
// - **No line states a number.** "We are down to four days of stores" ages badly the moment
//   the balance changes; "the galley's getting thin" is true whenever it fires.
// - **Every line is complete on its own.** A reply that only parses after its opener is a
//   reply that reads as a non-sequitur the first time an exchange is cut short.
// - **Nothing here mutates anything.** Pure data, read by `systems/crew/crew-talk.js`.
//
// This file is deliberately large. A corpus this size is the difference between "the crew
// have voices" and "the crew have a catchphrase", and there is no clever way to be brief
// about it — a hundred lines of dialogue is a hundred lines of dialogue.

/**
 * The situations the ship can be in, in the order they are tested.
 *
 * Ordered by `urgency` — how much it would take to interrupt one — and the driver takes the
 * first situation that holds, exactly like `reasoner.js` takes the first node that matches.
 * `test/crew-talk.mjs` asserts the order never puts a calmer situation above a more urgent
 * one, so the two cannot drift: an event added at the bottom with urgency 3 is a red suite
 * rather than a casualty nobody mentions because the galley was thin.
 *
 * This is deliberately *not* the same list as the reasoner's tree. ARIA reasons about what
 * the ship should do; this is about what the people aboard notice, and a crew remarking on
 * something ARIA has no opinion about is most of what makes them people.
 */
export const SITUATION_ORDER = [
  // ── it is happening right now and it can kill somebody ──
  'boarding', 'underfire', 'hullcrit', 'casualty',
  // ── it is going wrong ──
  'overheat', 'firstblood', 'threatnear', 'hungry', 'broke',
  // ── the ship is doing something ──
  'warpin', 'warpout', 'docked', 'undocked', 'mining', 'oreful', 'hauling', 'wreck',
  'panelsout', 'payday', 'repaired', 'refit', 'newhire', 'promotion', 'tired', 'lowmorale',
  // ── nothing is wrong ──
  'charging', 'farmgood', 'goodmorale', 'longhaul', 'quiet'
];

export const SITUATIONS = {
  boarding:   { name: 'Boarders aboard',      urgency: 3, gap: 0 },
  underfire:  { name: 'Taking fire',          urgency: 3, gap: 8 },
  hullcrit:   { name: 'Hull critical',        urgency: 3, gap: 12 },
  overheat:   { name: 'Thermal cutout',       urgency: 2, gap: 18 },
  firstblood: { name: 'A kill',               urgency: 2, gap: 20 },
  threatnear: { name: 'Something on the array', urgency: 2, gap: 30 },
  warpin:     { name: 'Core spooling',        urgency: 1, gap: 40 },
  warpout:    { name: 'Dropping out',         urgency: 1, gap: 40 },
  docked:     { name: 'On the pad',           urgency: 1, gap: 45 },
  undocked:   { name: 'Off the pad',          urgency: 1, gap: 45 },
  mining:     { name: 'Cutting rock',         urgency: 1, gap: 55 },
  oreful:     { name: 'Hold full',            urgency: 1, gap: 50 },
  hauling:    { name: 'Carrying a consignment', urgency: 1, gap: 70 },
  panelsout:  { name: 'Arrays deployed',      urgency: 1, gap: 45 },
  charging:   { name: 'Charging on the arrays', urgency: 0, gap: 80 },
  farmgood:   { name: 'The farm is keeping up', urgency: 0, gap: 110 },
  hungry:     { name: 'Stores running out',   urgency: 2, gap: 60 },
  payday:     { name: 'Payroll ran',          urgency: 1, gap: 90 },
  broke:      { name: 'Payroll missed',       urgency: 2, gap: 60 },
  repaired:   { name: 'Hull work done',       urgency: 1, gap: 70 },
  refit:      { name: 'Something new fitted', urgency: 1, gap: 70 },
  newhire:    { name: 'Somebody signed on',   urgency: 1, gap: 60 },
  casualty:   { name: 'Somebody was hurt',    urgency: 3, gap: 30 },
  promotion:  { name: 'Somebody levelled',    urgency: 1, gap: 60 },
  tired:      { name: 'The watch is worn out', urgency: 1, gap: 90 },
  lowmorale:  { name: 'The mood is bad',      urgency: 1, gap: 100 },
  goodmorale: { name: 'The mood is good',     urgency: 0, gap: 120 },
  longhaul:   { name: 'A long time out',      urgency: 0, gap: 140 },
  wreck:      { name: 'Working a wreck',      urgency: 1, gap: 70 },
  quiet:      { name: 'Nothing happening',    urgency: 0, gap: 150 }
};

/* ── the corpus ──────────────────────────────────────────────────────
   Keys: `any` is everyone. `post` is by department — the role keys from data/crew.js.
   `trait` is by temperament. `mood.low` fires below CREW_TALK.lowMood and `mood.high`
   above CREW_TALK.highMood; both are optional and neither is a mood *report*, they are
   the same observation made by somebody having a bad or a good week. */

export const LINES = {

  boarding: {
    any: [
      'Something just came through the lock. That was not the lock opening.',
      'Seal the section. Seal it now.',
      'They are inside. They are actually inside.',
      'Everyone off the corridor deck. Move.'
    ],
    post: {
      medic:  ['Anyone who is not holding something heavy gets behind me.',
               'I need the mess table clear. Now, not in a minute.'],
      gunner: ['Guns are no good to us in here. Find something with a handle.',
               'I have the aft corridor. Do not come through it.'],
      helm:   ['I cannot fly us out of a problem that is already aboard.'],
      engineer: ['Cutting power to the section. If they want it dark they can have it dark.']
    },
    trait: {
      ironNerve: ['Fine. Let them come down the corridor one at a time.'],
      cheap:     ['This is not — nobody said this happens.'],
      veteran:   ['Third time for me. Two of those went badly. Stay behind the frames.'],
      zealot:    ['They came aboard uninvited. That decides it.']
    }
  },

  underfire: {
    any: [
      'That was close aboard. That one was close.',
      'Shields are taking it. For now they are taking it.',
      'Hold onto something, this is not going to be tidy.',
      'Whoever that is, they are not shooting to scare us off.'
    ],
    post: {
      gunner:   ['Give me two more seconds on the lead and I will have them.',
                 'Racks are warm. Racks are answering.',
                 'They keep crossing our nose. I will take that trade all day.'],
      engineer: ['Bank is dropping faster than it is filling. Watch the draw.',
                 'If we keep firing at this rate something is going to trip.',
                 'Loop is holding. Loop is holding. Do not ask me again in a minute.'],
      helm:     ['I am keeping our nose on them. It is not comfortable.',
                 'If we turn now we give them the whole flank. I would rather not.'],
      medic:    ['Nobody has come to me yet. Let us keep it that way.'],
      purser:   ['If we lose the hold in this I want it on the record that I said so.'],
      rigger:   ['Rig is stowed. I am not losing a cutter head to a stray round.'],
      survey:   ['I have them resolved. Whatever they are, they are not a picket.']
    },
    trait: {
      ironNerve:['This is fine. This is a Tuesday.'],
      cheap:    ['Is it meant to sound like that? Is it meant to sound like that?'],
      veteran:  ['They are firing early. Somebody over there is nervous.'],
      obsessive:['That is a hairline in frame nine and I am going to think about it all week.'],
      drifter:  ['I have been shot at on better ships and worse ones.'],
      hollow:   ['It is very loud. It is very loud and I am very calm.']
    },
    mood: {
      low:  ['We do not get paid enough to be shot at in this thing.',
             'Of course. Of course this is how the week goes.'],
      high: ['Right. Let us give them something to think about.',
             'This crew has been through worse than this one.']
    }
  },

  hullcrit: {
    any: [
      'That is not plating any more, that is a suggestion.',
      'I can hear the frame. I should not be able to hear the frame.',
      'One more like that and we are all going to find out how good the suits are.'
    ],
    post: {
      medic:    ['I have got sealant and two hands. Somebody find me a third.',
                 'Get the bulkhead shut. I do not care what is on the other side of it.'],
      engineer: ['Hull is past where I can patch it under way. Past it.'],
      helm:     ['We need to be somewhere else. Anywhere else, and soon.'],
      purser:   ['Dump the ore if it buys us anything. I mean it, dump it.']
    },
    trait: {
      veteran: ['I have walked off a hull worse than this one. Once.'],
      zealot:  ['She has carried us this far. She will carry us out.'],
      cheap:   ['How much of this is meant to be structural?']
    }
  },

  overheat: {
    any: [
      'Cutout. Everything on the racks just went quiet.',
      'Give it thirty seconds. It cannot dump what it has not vented.',
      'It smells like hot metal down here, and it should not.'
    ],
    post: {
      gunner:   ['Guns are cold and I am not happy about it.',
                 'I had them. I had them and the rack quit on me.'],
      engineer: ['Radiators are doing what they can. Which is not much, at this rate.',
                 'We are cooking ourselves faster than we are shooting anyone.'],
      medic:    ['If the gun deck gets much hotter I am pulling somebody out of it.']
    },
    trait: {
      obsessive: ['I said the sinks were undersized. I have been saying it.'],
      veteran:   ['Every ship I have been on has been thermally optimistic.']
    }
  },

  firstblood: {
    any: [
      'They are down. That is one that will not follow us.',
      'Well. That settles what they wanted.',
      'Debris off the bow. Mind the drift.'
    ],
    post: {
      gunner: ['That is mine and I am writing it down.',
               'Good burst. Good burst, bad ship.'],
      medic:  ['Somebody was in that. I know, I know. Somebody was, though.'],
      purser: ['Anything worth picking up out of that, or are we leaving it?'],
      survey: ['Getting a return off the wreck. Worth a pass if we have the time.']
    },
    trait: {
      zealot:  ['They chose it. Every one of them chose it.'],
      cheap:   ['I have never — that was the first one I have actually seen.'],
      drifter: ['That is somebody else’s bad month, not ours.'],
      hollow:  ['I did not feel very much about that. I thought I would.']
    },
    mood: { low: ['One down. Forty thousand to go, at this rate.'] }
  },

  threatnear: {
    any: [
      'We have company on the array. Not close, not friendly.',
      'Something out there is holding station on us.',
      'That contact has changed course twice to stay with us.'
    ],
    post: {
      survey:   ['Reading them as armed. Cannot tell you whose yet.',
                 'They are running quiet. People run quiet for a reason.'],
      gunner:   ['Say the word and I will warm the racks.'],
      helm:     ['I can put distance on them if we start now rather than later.'],
      purser:   ['Full hold and an armed contact. I hate this combination.']
    },
    trait: {
      veteran:   ['That is a hunting pattern. I have flown it.'],
      ironNerve: ['Let them come. Better than wondering.'],
      quick:     ['If they were going to hail us they would have by now.']
    }
  },

  warpin: {
    any: ['Core is spooling. Everything loose gets stowed.',
          'Here we go. Mind your teeth.',
          'Spooling. Two minutes of nothing, then somewhere else.'],
    post: {
      engineer: ['Core is drawing hard. Coming up clean, though.'],
      helm:     ['Course is laid. Nothing in the way that I can see.'],
      medic:    ['Anyone who gets sick in the transition, do it in your own quarters.']
    },
    trait: { cheap: ['I have never got used to the sound it makes.'],
             ascetic: ['Good. Somewhere else is usually better.'] }
  },

  warpout: {
    any: ['We are out. Give the array a second to settle.',
          'Dropped clean. Nothing waiting for us, by the look of it.',
          'New sky. Same jobs.'],
    post: {
      survey: ['Sweeping now. Give me a moment before anybody asks.'],
      helm:   ['Nice and clean. That was a good drop.'],
      purser: ['Right. Who is buying what, here?']
    }
  },

  docked: {
    any: ['Clamps on. That is us down.',
          'Solid deck. I had forgotten what that was like.',
          'Somebody is going to the concourse and somebody is minding the ship.'],
    post: {
      purser:  ['I want two hours and the manifest and nobody talking to me.',
                'Prices here are better than the last place. Marginally.'],
      medic:   ['Anybody who has been putting off seeing me, this is the window.'],
      rigger:  ['Cutter head needs a proper bench. This is the bench.'],
      engineer:['I can get at the loop properly while we are still. Do not undock on me.'],
      helm:    ['I will be in the ship. I am always in the ship.']
    },
    trait: {
      glutton: ['There is a place on the ring that does a proper hot meal. I am going.'],
      drifter: ['Every station looks the same after the fourth one.'],
      ascetic: ['I do not need shore time. I will take the watch.'],
      quick:   ['Half the yards here run kit I have never seen. I am going to go and look.']
    },
    mood: { high: ['Good run in. Somebody is buying.'],
            low:  ['I am going to walk somewhere that is not this corridor.'] }
  },

  undocked: {
    any: ['Clamps off. We are our own problem again.',
          'Station is behind us. Back to it.',
          'Everything that was loose on the pad is loose in here now. Sort it.']
  },

  mining: {
    any: ['Beam is on the rock. Slow work, honest work.',
          'That is a good seam. Do not rush it.',
          'Watch the drift while the arm is out.'],
    post: {
      rigger: ['Cutter is running sweet. Do not touch the throttle.',
               'This one is mostly rubbish with a good middle. Give me a minute.',
               'Feed rate is where I want it. Leave it there.'],
      purser: ['Keep it clean going into the hold and I will not have to sort it later.'],
      survey: ['Assay says there is better forty degrees round the far side.'],
      engineer:['Beam draw is up. If we go dark mid-cut, that is why.']
    },
    trait: {
      obsessive: ['There is a rhythm to a good cut and this is not quite it.'],
      glutton:   ['Rock does not feed anybody. What is in the galley?'],
      natural:   ['Watch this bit. Watch — there. That is the seam opening.']
    }
  },

  oreful: {
    any: ['Hold is full. Properly full, not purser-full.',
          'Nothing else is going in there without something coming out.',
          'That is us. Somewhere to sell it, then.'],
    post: {
      purser: ['I can find you another two hundred kilos if somebody helps me restack.',
               'Full hold, and I know within a kilo what it is worth.'],
      rigger: ['Shutting the arm down. No sense cutting what we cannot carry.']
    },
    mood: { high: ['Good haul. That is a good haul.'] }
  },

  hauling: {
    any: ['Consignment is aboard and it is somebody else’s until we get there.',
          'Careful with that pallet. Careful.'],
    post: {
      purser: ['Manifest is signed. If it arrives short, that is on all of us.',
               'Whoever loaded this did not stack it. I have re-stacked it.'],
      helm:   ['Straight there, no detours. That is the deal we took.']
    },
    trait: { drifter: ['Cargo is cargo. It does not care who is carrying it.'] }
  },

  panelsout: {
    any: ['Arrays are out. Nobody touch the throttle.',
          'We are a very expensive solar farm for the next while.',
          'Do not go outside. I mean it, the wings are out.'],
    post: {
      engineer: ['Getting good current off them. Cheaper than burning fuel for it.',
                 'Every minute they are out is a minute we are not going anywhere. Worth it.'],
      helm:     ['Stick is dead until they are home. Feels wrong, that.'],
      gunner:   ['If anything shows up while we are like this, it will be quick and it will not be us.'],
      survey:   ['I have the array on full while we are sitting still. Free look around.']
    },
    trait: {
      ironNerve: ['Sitting still with the wings out. Fine. I have done worse.'],
      cheap:     ['So we just — sit here? We just sit here.'],
      veteran:   ['Old trick. Old, good trick, as long as nobody finds you.']
    }
  },

  charging: {
    any: ['Bank is coming up. Slowly, but it is coming up.',
          'Quiet, still, and charging. I have had worse afternoons.'],
    post: { engineer: ['Loop likes this. No spikes, no draw, just filling.'] },
    trait: { ascetic: ['Nothing to do and nowhere to be. This is the good part.'] }
  },

  farmgood: {
    any: ['Beds are producing. Actual green things, on this ship.',
          'Smells like a garden in the aft passage. I am not complaining.'],
    post: {
      medic:  ['Fresh food does more for this crew than half of what is in my locker.'],
      purser: ['Farm is paying for itself. Put that in the ledger.']
    },
    trait: {
      glutton: ['I have been told to stop eating the crop before it is a crop.'],
      obsessive: ['Bed four is under-producing and I intend to find out why.']
    }
  },

  hungry: {
    any: ['Galley is getting thin. Somebody should say something.',
          'Short rations tonight. Again.',
          'There is a lot of water and not a lot of anything else back there.'],
    post: {
      purser:  ['We are eating into the reserve. I would like to not be doing that.'],
      medic:   ['A hungry crew makes mistakes. That is not a mood, it is a fact.'],
      engineer:['I cannot run a watch on what is left in there.']
    },
    trait: {
      glutton: ['This is not a portion. This is a rumour of a portion.'],
      ascetic: ['I have eaten less for longer. It is fine.'],
      cheap:   ['Nobody mentioned the food when I signed.'],
      veteran: ['Ship runs out of food twice and the third time the crew runs out of patience.']
    },
    mood: { low: ['Hungry, tired and a long way out. Wonderful.'] }
  },

  payday: {
    any: ['Payroll cleared. That is a nice sound.',
          'Money in. Everybody remembers why they are here.'],
    post: { purser: ['Everyone is paid and the books balance. Do not get used to it.'] },
    trait: {
      cheap:   ['That is more than I have ever been paid at once.'],
      drifter: ['Paid. Good. That is the part I stay for.'],
      natural: ['I am worth more than that, and everyone here knows it.']
    }
  },

  broke: {
    any: ['Payroll did not run. Everyone noticed.',
          'No pay this cycle. Nobody is saying much about it.'],
    post: {
      purser: ['I cannot pay people with a good explanation.'],
      medic:  ['Unpaid crew stop looking after themselves first. Watch for it.']
    },
    trait: {
      drifter: ['I have left ships over less than this.'],
      zealot:  ['I did not come aboard for the money.'],
      veteran: ['Once is a bad month. Twice is a decision.']
    }
  },

  repaired: {
    any: ['Plating is back on. She looks like a ship again.',
          'All that noise, and now it is quiet. That is what fixed sounds like.'],
    post: {
      medic:    ['Hull is whole. Now the people.'],
      engineer: ['I have got frame nine back to spec. It was not close, but it was not far off.']
    },
    trait: { obsessive: ['I know it is repaired. I want to look at it again.'] }
  },

  refit: {
    any: ['Something new in the racks. Somebody has been spending.',
          'New kit. Let us find out what it does before we need it.'],
    post: {
      engineer: ['I will want a shakedown on that before we trust it.'],
      gunner:   ['If that is for the gun deck, it is mine and I am going to go and look at it.'],
      rigger:   ['Anything that makes the arm run cooler is welcome.']
    },
    trait: {
      quick:    ['I have read the manual. I read it on the way over.'],
      veteran:  ['New is not the same as better. We will see.'],
      natural:  ['Give me an hour with it and I will have it doing more than it says on the plate.']
    }
  },

  newhire: {
    any: ['New face aboard. Somebody show them where things are.',
          'Fresh signature on the articles.'],
    post: {
      purser: ['Another mouth on the manifest. Noted.'],
      medic:  ['I will want them through the infirmary before they touch anything.']
    },
    trait: {
      veteran:  ['Give them a week before you decide anything about them.'],
      drifter:  ['Another one. They come and they go.'],
      cheap:    ['Good. Now I am not the newest.']
    }
  },

  casualty: {
    any: ['That is somebody hurt. That is somebody actually hurt.',
          'Clear the passage — get them through, get them through.'],
    post: {
      medic:    ['I have got them. Everyone else out, you are not helping.',
                 'They will keep. They will not be on a watch for a while, but they will keep.'],
      engineer: ['That should not have been able to happen. I am going to find out why.']
    },
    trait: {
      ironNerve: ['Steady. Panicking in a corridor helps nobody.'],
      zealot:    ['They will be all right. They have to be.'],
      hollow:    ['I helped carry them and I did not feel anything and that frightens me.']
    }
  },

  promotion: {
    any: ['Somebody has finally been rated up. About time.',
          'New rating on the board. Well earned.'],
    trait: {
      natural:  ['Took long enough for somebody to notice.'],
      cheap:    ['I want that. I am going to get that.'],
      veteran:  ['Ratings are paper. Doing the job is the job. Still — well done.']
    }
  },

  tired: {
    any: ['This watch has been on too long. It shows.',
          'Somebody needs to stand down before somebody makes a mistake.',
          'I have read the same panel four times and taken in none of it.'],
    post: {
      medic:  ['I am putting somebody on their back for six hours whether they like it or not.'],
      helm:   ['I would not trust my own hands on a docking right now.']
    },
    trait: {
      glutton:   ['I am not tired. I am under-fed. There is a difference.'],
      obsessive: ['I will sleep when the fault list is empty. So, no.'],
      ascetic:   ['I can run another watch. I would rather.']
    }
  },

  lowmorale: {
    any: ['Nobody is talking much this cycle.',
          'The mess was empty at meal time. That is never a good sign.',
          'It is a long way out and it has been a long way out for a while.'],
    post: {
      medic:  ['Half this crew needs a station and a day off it, not another job.'],
      purser: ['People do sloppy work when they are unhappy and then I find it in the hold.']
    },
    trait: {
      zealot:  ['We are doing something worth doing. People forget that.'],
      drifter: ['There are other ships. I am just saying there are other ships.'],
      veteran: ['This is the bit where a crew either sorts itself out or does not.']
    }
  },

  goodmorale: {
    any: ['Good watch. Everyone doing what they are meant to.',
          'Somebody was laughing in the mess. That has been a while.',
          'This is a well-run ship at the moment and everyone knows it.'],
    trait: {
      cheap:    ['I like it here. Is that a stupid thing to say?'],
      natural:  ['Good crew. I have been on worse and been paid more.'],
      drifter:  ['I am not going anywhere for a bit. Do not make anything of it.']
    }
  },

  longhaul: {
    any: ['How long since we saw a station? Do not answer that.',
          'I have started naming the corridors. That is probably a bad sign.',
          'Everything smells like the recycler. Everything.'],
    post: {
      medic:  ['Long time out. People get strange. It is normal, it is still worth watching.'],
      survey: ['I could chart this system twice from memory by now.']
    },
    trait: {
      ascetic: ['I do not mind the long ones. Fewer people, fewer problems.'],
      glutton: ['If I have to eat another reconstituted anything.'],
      quick:   ['I have read everything aboard. Twice. Including the manuals.']
    }
  },

  wreck: {
    any: ['Careful in there. Nothing in a wreck is where it should be.',
          'Somebody’s ship. Somebody’s crew, once.',
          'Mind the edges. That plating will take a suit open.'],
    post: {
      medic:  ['If we find anybody, we bring them out. Whoever they were.'],
      purser: ['Salvage rights are murky here. Load fast.'],
      survey: ['Reading a lot of nothing and one or two somethings. Worth the pass.']
    },
    trait: {
      hollow:  ['It is very quiet in there. Quieter than space, somehow.'],
      veteran: ['Do not take the first thing you see. The good stuff is always deeper.'],
      zealot:  ['Say something for them before we start pulling it apart.']
    }
  },

  quiet: {
    any: ['Nothing on the array, nothing in the hold, nothing to do.',
          'Quiet run. I will take a quiet run.',
          'Somebody put music on before I start talking to the panels.'],
    post: {
      engineer: ['Everything is running. I do not trust it, but it is running.'],
      helm:     ['Course is holding. Course will keep holding.'],
      purser:   ['Books are square. That is my whole report.'],
      gunner:   ['Racks are cold and I am reading. Do not tell anyone.'],
      medic:    ['Nobody is hurt. It is a small thing and it is a good thing.'],
      survey:   ['Nothing new out there. I keep looking anyway.'],
      rigger:   ['Arm is stowed and greased. Ready when somebody finds a rock.']
    },
    trait: {
      obsessive: ['I have found three faults nobody else would have found. You are welcome.'],
      drifter:   ['Quiet is fine. Quiet is a long way from dull.'],
      ironNerve: ['Enjoy it. It does not stay like this.']
    }
  }
};

/**
 * Two-handers.
 *
 * `open` is said by somebody in the `from` post, `reply` by somebody in the `to` post, and
 * the driver only reaches for one when the ship actually carries both. That is the point:
 * a six-berth ship with an engineer and a quartermaster has conversations a two-berth ship
 * does not, and the crew screen is not where a player should have to find that out.
 */
export const EXCHANGES = [
  { sit: 'underfire', from: 'gunner', to: 'engineer',
    open: 'I need everything you can give the racks.',
    reply: 'You are already getting more than I have. Pick your shots.' },
  { sit: 'underfire', from: 'helm', to: 'gunner',
    open: 'Holding her steady. Do something with it.',
    reply: 'Working on it. Stop moving.' },
  { sit: 'underfire', from: 'medic', to: 'helm',
    open: 'If you are going to do something violent with the ship, tell me first.',
    reply: 'I will try. No promises.' },
  { sit: 'overheat', from: 'gunner', to: 'engineer',
    open: 'The racks just quit on me. Again.',
    reply: 'They will keep quitting until somebody buys us radiators.' },
  { sit: 'mining', from: 'rigger', to: 'purser',
    open: 'Coming through with a full skip.',
    reply: 'Left side. The right side is spoken for.' },
  { sit: 'mining', from: 'survey', to: 'rigger',
    open: 'Better grade about forty degrees round.',
    reply: 'Then somebody can move the ship, because the arm does not stretch.' },
  { sit: 'oreful', from: 'purser', to: 'helm',
    open: 'Hold is full. I want a market, not a scenic route.',
    reply: 'I will take us the fast way. You will not enjoy the fast way.' },
  { sit: 'hungry', from: 'medic', to: 'purser',
    open: 'How long, honestly, on stores?',
    reply: 'Honestly? Not as long as anybody would like.' },
  { sit: 'hungry', from: 'purser', to: 'engineer',
    open: 'Could we run more beds if I found the space?',
    reply: 'You find the space, I will find the power. Somehow.' },
  { sit: 'farmgood', from: 'purser', to: 'medic',
    open: 'The beds are ahead of what the crew eats. First time.',
    reply: 'Then for once I am not the one saying we should turn back.' },
  { sit: 'panelsout', from: 'helm', to: 'engineer',
    open: 'How long until I have a throttle again?',
    reply: 'As long as it takes to bring the wings in without shearing one.' },
  { sit: 'panelsout', from: 'gunner', to: 'survey',
    open: 'Tell me the moment anything moves out there.',
    reply: 'You will know when I know. Probably sooner, the way you watch me.' },
  { sit: 'docked', from: 'engineer', to: 'purser',
    open: 'While we are still, I want the loop opened up.',
    reply: 'Then I want the hold cleared while you are in there making a mess.' },
  { sit: 'docked', from: 'medic', to: 'helm',
    open: 'You have not been off this ship in three stations.',
    reply: 'Somebody has to be aboard. It might as well be somebody who likes it.' },
  { sit: 'wreck', from: 'survey', to: 'medic',
    open: 'There is a section in there that still has pressure.',
    reply: 'Then we go in gently, and we knock.' },
  { sit: 'casualty', from: 'medic', to: 'engineer',
    open: 'This happened because something failed. Find out which something.',
    reply: 'Already looking. I will not like the answer and neither will you.' },
  { sit: 'quiet', from: 'gunner', to: 'rigger',
    open: 'Nothing to shoot, nothing to cut. What do you do with yourself?',
    reply: 'I maintain the arm. You should try it with the guns some time.' },
  { sit: 'quiet', from: 'purser', to: 'medic',
    open: 'Books are square, hold is tidy, nobody is bleeding.',
    reply: 'Do not say it out loud. You will spoil it.' },
  { sit: 'longhaul', from: 'helm', to: 'survey',
    open: 'Anything at all out there worth turning for?',
    reply: 'Not a thing. I will keep looking, since it is that or the corridors.' },
  { sit: 'newhire', from: 'veteranAny', to: 'medic',
    open: 'The new one has not stopped asking questions.',
    reply: 'Good. The ones who do not ask are the ones I end up treating.' }
];

/** Every post that appears anywhere in the corpus, for the suite. */
export const SITUATION_KEYS = Object.keys(SITUATIONS);

/**
 * Pick the narrowest pool that applies.
 *
 * Order is trait, then post, then mood, then everyone — narrowest first, because a Veteran
 * gunner in a bad mood should sound like a veteran before they sound like a gunner, and a
 * line that exists for exactly this person is always the better line.
 *
 * @returns {string[]} candidate lines, possibly empty
 */
export function poolFor(situation, post, trait, mood) {
  const L = LINES[situation];
  if (!L) return [];
  const out = [];
  if (trait && L.trait && L.trait[trait]) out.push(...L.trait[trait]);
  if (post && L.post && L.post[post]) out.push(...L.post[post]);
  if (mood && L.mood && L.mood[mood]) out.push(...L.mood[mood]);
  if (!out.length && L.any) out.push(...L.any);
  return out;
}

/** Exchanges available for a situation, given the posts actually aboard. */
export function exchangesFor(situation, posts) {
  const have = new Set(posts || []);
  return EXCHANGES.filter(x => x.sit === situation &&
    (x.from === 'veteranAny' || have.has(x.from)) && have.has(x.to));
}

/** How many distinct lines the corpus holds. Diagnostics, and a number worth watching. */
export function corpusSize() {
  let n = 0;
  for (const k in LINES) {
    const L = LINES[k];
    n += (L.any || []).length;
    for (const p in (L.post || {})) n += L.post[p].length;
    for (const t in (L.trait || {})) n += L.trait[t].length;
    for (const m in (L.mood || {})) n += L.mood[m].length;
  }
  return n + EXCHANGES.length * 2;
}
