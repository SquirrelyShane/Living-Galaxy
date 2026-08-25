// Living Galaxy — tuning: how NPCs think and talk.
//
// One of twelve files under `core/config/`. `config.js` was a single 1,727-line module and
// the most-imported file in the project, which made it the place every tuning value went and
// no place in particular — a new block landed wherever the last one ended.
//
// The split mirrors `src/systems/`: a number that tunes `systems/combat/` lives in
// `config/combat.js`. `core/config.js` re-exports all twelve, so every existing import is
// untouched and a caller that wants one domain can reach for it directly.
//
// Pure data. No imports, no behaviour.

// ── comms ────────────────────────────────────────────────────────────
// The log is a place people talk, not a place the game prints at you. Traffic is
// generated from what is actually happening within earshot; replies cost standing.
// ── NPC-to-NPC communication (v1.00.90) ──────────────────────────────
// The exchange layer under everything social. Bounded on purpose: with sixty ships aboard
// there are seventeen hundred pairs, and a social system that costs O(n^2) per frame is a
// social system that gets deleted the first time somebody profiles the game on a phone.
export const NPCCOMMS = {
  range: 5200,             // km — how far two ships can hold a conversation
  overhearRange: 9000,     // km — how close the player must be to pick it up (COMMS.range)
  sweepEvery: 3.5,         // s between attempts to start an exchange anywhere in the system
  attemptsPerSweep: 3,     // pairs sampled per sweep
  maxPerSweep: 2,          // exchanges actually run per sweep
  scanCap: 24,             // ships examined when looking for a partner, from a random offset
  memoryHalfLife: 2400,    // s — matches NPCAI so a relationship and a grudge fade together
  // How wary a character must be of the player before it starts passing the warning on.
  // This is what makes reputation travel at the speed of conversation rather than
  // teleporting into a global number.
  gossipThreshold: 0.34
};

export const COMMS = {
  range: 9000,               // km — beyond this a ship is out of voice range
  maxLog: 120,               // entries retained; older ones roll off
  idleChatter: [26, 70],     // s between ambient exchanges, randomised in this band
  hailCooldown: 45,          // s before the same ship hails you again
  replyWindow: 40,           // s a reply option stays live
  channels: ['local', 'trade', 'distress', 'company']
};

// ── NPC brains ───────────────────────────────────────────────────────
// The NPC_Avatar tiers. Tiers 1–2 (traits, memory, grammar) are always on and cost
// nothing worth measuring. Tier 3 — an actual language model in a worker — is `enabled`
// but does not download anything until the player asks for it in Settings → Lab, because
// a several-hundred-megabyte fetch is an opt-in, not a boot step.
export const AVATAR = {
  enabled: true,             // Tier 3 permitted at all (the model still loads on request)
  model: 'smollm2-360m',     // key into src/npc-avatar/llm/models.js
  // What comes down during the loading screen, and it is deliberately the *smaller* one.
  //
  // 360M is the better writer and stays the pick when a player asks for it from the Lab.
  // 135M is what a boot sequence can justify pulling on a first visit over a phone
  // connection: a third of the weights, a third of the wait, and quite good enough for the
  // one-line answers ARIA gives from live telemetry. The load never blocks — see
  // `ui/loading.js` — so the cost of being wrong here is a menu that opens before the model
  // does, which is the normal case anyway.
  bootModel: 'smollm2-135m',
  autoLoad: true,            // pull it during boot; Settings → Lab can still load the big one
  maxConcurrent: 1,          // one generation in flight. Do not raise this on a phone.
  cooldown: 25,              // s before the same character is asked to think again
  timeoutMs: 5000,           // a reply that misses this is abandoned, not waited on
  maxTokens: 44,             // NPC one-liners, not conversation
  temperature: 0.75,
  maxChars: 200,             // hard cap after sanitising, matched to the comms panel
  memoryCap: 12,             // episodic facts per character
  maxPersonas: 160,          // bound on the persona table across a long session
  witnessRange: 6000,        // km — close enough to have actually seen what you did
  maxWitnesses: 5,           // ships that file a memory per event, newest-nearest first
  claimRange: 900            // km — close enough to a rock that a miner calls it theirs
};

// ── ARIA at the stick (v1.02.58) ─────────────────────────────────────
//
// The autopilot is not a cheat and it is not a macro. It is the answer to a specific
// problem: this game asks a phone player to fly a twenty-minute ore run with their thumb on
// a 22-pixel throttle, and the interesting part of that run is the two minutes at either
// end. ARIA already had hands (`systems/platform/tools.js`); what she did not have was the
// judgement to decide what to do with them without being asked.
//
// Three rules shape every number here.
//
// **She narrates.** Every decision, every hail, every purchase goes through the comms log
// before it happens. An autopilot that silently spends your money is a bug report; one that
// says "Foundry Alpha will re-arm us for 1,240 — taking us in" is a crew member.
//
// **She yields instantly.** Any manual input at all — the stick, the throttle, a preset —
// switches her off and says so. There is no fight over the controls and no state where the
// player is pushing against something invisible.
//
// **She spends, but only on the hull.** Repair, ammunition, probes, and accepting work the
// hull is actually cleared for. She does not buy hulls, does not buy modules, does not sign
// company contracts and does not take a job the board says you are not qualified for — the
// same line `systems/platform/tools.js` has held since it was written, moved up one level.
export const AUTOPILOT = {
  review: 3.0,            // s between "is this still the right task"
  settle: 1.2,            // s of pause between finishing one task and choosing the next
  // A task that has made no progress for this long is abandoned and re-planned. The world
  // moves — a station undocks a freighter into your approach lane, a rock gets mined out by
  // somebody else — and an autopilot with no way to give up is an autopilot that hangs.
  stallAfter: 45,
  // Hull fraction below which servicing outranks everything else. 0.72 rather than something
  // dramatic like 0.4: the point of an autopilot is that you do not arrive at the fight
  // already hurt.
  repairBelow: 0.72,
  // Hold fraction at or above which selling outranks mining. Not 1.0 — a hull that mines
  // until it physically cannot hold another kilo wastes the last cut.
  sellAbove: 0.82,
  // Minimum credits ARIA will leave in the account. She will not spend you to zero on
  // ammunition, because a pilot with no money and a full magazine is stranded.
  reserve: 800,
  // How much of the bank one servicing stop may spend.
  spendShare: 0.45,
  // How close the approach has to get before she calls for a berth — measured from the
  // hull, like `DOCK.reach`, and a little wider than it so the hail lands before the pad
  // opens rather than after. The old number was 260 units of *centre* distance, which on a
  // thirty-unit berth had her hailing from two hundred kilometres out and then flying the
  // rest of it with the conversation already over.
  dockReach: 1.2,

  // ── going somewhere ───────────────────────────────────────────────
  //
  // Warp above this range, sublight below it. It used to be `sensor * 1.4`, which sounds
  // principled — "past what we can see" — and is wrong for the thing it decides: the sensor
  // array shrank when scanning tiers landed in v1.02.57, so a low-tier hull concluded that
  // a fifteen-thousand-unit crossing was within sensor reach of *nothing* and flew the whole
  // thing at a quarter throttle. What matters here is whether the crossing is worth a spool,
  // and that is a property of the distance, not of the aerial.
  warpBeyond: 3000,
  warpEnergy: 30,         // bank below which she will not commit to a spool

  // ── earning it ────────────────────────────────────────────────────
  //
  // Below this, a berth cannot fix anything: the yard wants money for the repair, the shop
  // wants money for the rounds, and docking to look at prices she cannot pay is the loop
  // this number exists to break.
  broke: 3000,
  // After a pad visit that spent nothing and signed nothing, servicing is off the menu for
  // this long unless there is cargo to sell or a consignment due. Without it she undocks,
  // re-scores, concludes the hull still needs work, and turns straight back round.
  padCooldown: 240,
  // Hunting. She will not take a fight below this much hull, will not fly further than this
  // for one, and opens fire inside this fraction of the rack's optimal range.
  huntHull: 0.55,
  huntRange: 5200,
  fireWithin: 0.92,

  // ── not doing the same failed thing forever ───────────────────────
  //
  // The watchdog used to say "that is not working, trying something else" and then hand
  // straight back to a planner with no memory, which chose the identical task and target
  // and stalled again. It is the single most visible autopilot bug there is: from outside
  // it looks like the ship is thinking, and it is actually a loop.
  //
  // So a failure is now *recorded*. Two goes at the same task-and-target and it is benched;
  // benched for four minutes, which is long enough for the world to have changed and short
  // enough that a berth is not written off for the session.
  benchAfter: 2,
  benchFor: 240,
  // ...and if every option is benched, she says so and gives the stick back rather than
  // circling. An autopilot that cannot find anything to do should be *off*.
  giveUpAfter: 3,

  // A phase that has lost the thing it was waiting for — an approach that ended, a docking
  // request nobody answered — gets this long before it counts as orphaned.
  orphanAfter: 6,

  // Burning clear of a gravity well before spooling. The core will not hold inside one, and
  // the old code simply gave up and flew the whole leg sublight instead.
  wellClearPower: 0.55,
  wellClearFor: 25,
  rearmBelow: 40,         // rounds in a feed below which she buys more
  probeFloor: 2,          // probes she likes to keep aboard
  chatterGap: 2.5         // s minimum between two things she says, so she is not a wall
};

// ── working alongside somebody (v1.02.58) ────────────────────────────
//
// Crews learn faster next to other crews. This is the mechanical form of that, and it is
// deliberately about *place* rather than about a party system: there are no groups to join,
// no invites and nothing to manage. Cut rock in the same seam as a Belt Miner and both of
// you get better at it, because that is what happens.
//
// It also does something structural. The belt used to be a place you went alone, and NPC
// miners were scenery you flew past; a bonus for proximity turns them into a reason to fly
// *to* a worked seam instead of an empty one — the same nudge that makes a real field crowd.
export const GROUPWORK = {
  interval: 4,            // s between reviews. Not per-frame; nobody's XP is that urgent.
  range: 1400,            // units — "the same area", about a belt seam wide
  perPartner: 0.35,       // multiplier added per partner working nearby
  maxPartners: 4,         // above this the seam is crowded, not collaborative
  // What counts as working. A ship holding station is not working; a ship cutting rock,
  // hauling a consignment, or flying a patrol is.
  activities: ['mine', 'haul', 'patrol', 'survey'],
  // How much of the player's own practice tick the bonus is worth at one partner. Kept
  // modest: this is a reason to fly somewhere, not a replacement for doing the work.
  playerShare: 0.5,
  npcRate: 0.02,          // proficiency points per second per partner for an NPC
  announceEvery: 90       // s — ARIA mentions the crew you are working beside, occasionally
};

// ── the handoff sequence (v1.02.59) ──────────────────────────────────
//
// The AP switch is instant and always has been — `setAutopilot(true)` engages before this
// overlay draws a single pixel, and nothing about the transition is load-bearing. What the
// sequence buys is *legibility*: a toggle that silently hands a stranger the hull, the drive
// and the guns deserves to show you which of those she is taking.
//
// The pacing is the whole design problem. A cinematic you see once is a moment; the same
// cinematic on every toggle is an obstacle between the player and their own ship. So:
//
//   - the first engage on a save runs at `firstPace` — the full read
//   - every one after runs at `pace`, about a third as long
//   - with something hostile inside sensor range it runs at `combatPace` and gets out of
//     the way, because a flourish in a firefight is a way to get somebody killed
//
// And it is interruptible at every frame: touching anything drops the autopilot (see
// `breakAutopilot` in ui/controls.js) and the overlay follows it out, because an animation
// still playing for a system that is no longer running is a lie on screen.
export const CONN = {
  show: true,
  firstPace: 1.0,
  pace: 0.42,
  combatPace: 0.30,
  // Handing the ship BACK is not a cinematic. It is one line of acknowledgement and the
  // lattice coming out, and it is the same length whether it is your first flight or your
  // hundredth — you already know what happened, you did it.
  releasePace: 0.26,
  dim: 0.82,         // how far the canopy is dimmed behind the schematic. Not
                     // opaque: the world stays legible through it, which is the
                     // whole reason this is an overlay and not a screen.
  hold: 0.45,        // s the payoff line holds before the overlay clears
  hostileRange: 1.0  // fraction of sensor range that counts as "in a fight"
};

// ── ARIA's sweep (v1.02.60) ──────────────────────────────────────────
//
// The tactical picture, as opposed to the contact list. See `systems/npc/sweep.js` for why
// those are different things.
export const SWEEP = {
  interval: 0.35,        // s between rebuilds. The reasoner, the HUD and her dialogue share one.
  // A hull of yours counts as "under fire" for this long after the last round landed.
  // Long enough that a lull mid-fight does not read as the fight being over.
  underFireFor: 6,
  // How much a hostile's threat weight is multiplied when it has a firing solution on you.
  // A lock is the difference between being shot at and being hit.
  lockedWeight: 1.9,
  // Below this closing rate a contact is not usefully "coming at you" — it is orbital
  // motion and sensor jitter, and treating it as an approach makes the tree twitchy.
  closingFloor: 4,
  wreckReach: 2.4,       // multiples of sensor range at which a charted wreck is known
  staleSlack: 12         // how far the derivative map may drift before it is swept
};

// ── the advisory channel (v1.02.60) ──────────────────────────────────
//
// Where ARIA's authority stops. She flies, she spends on consumables, and when she concludes
// the *fit* is the bottleneck she opens a case instead of a wallet. See systems/npc/advisor.js.
export const ADVISOR = {
  // Never spends below this, and never recommends something that would.
  reserve: 2500,
  // Seconds between raising the same case. Deliberately long: a recommendation repeated
  // every minute is a nag, and a nag teaches the player to ignore the channel rather than
  // the message.
  cooldown: 420,
  keep: 12               // how many advisories the panel holds
};

// ── opening a channel (v1.02.62) ─────────────────────────────────────
//
// Disposition bands, and the arithmetic of talking somebody round. Every number here is a
// threshold the dialogue branches on, which is why they are in one block: "what does this
// faction think of me" was previously answered in four places with four different cut-offs.
export const PARLEY = {
  // Standing bands. Below `hostileBelow` they will not talk; above `alliedAbove` they will
  // do almost anything. The middle three are where the game is.
  hostileBelow: -60,
  coldBelow:    -25,
  waryBelow:     -5,
  warmAbove:     35,
  alliedAbove:   70,

  // Persuasion. `difficulty` lives on the attempt; these are what the *pilot* brings.
  perCommerce: 0.055,       // per rank of Commerce
  perStanding: 0.22,        // per unit of normalised standing (-1..1)
  dispositionBonus: { hostile: -0.30, cold: -0.14, wary: -0.05,
                      neutral: 0, warm: 0.10, allied: 0.20 },
  // Never certain and never impossible. A negotiation with a guaranteed outcome is a button.
  floor: 0.05,
  ceiling: 0.93,

  // What it moves. Winning is worth less than losing costs, so trying everything on every
  // hull is a strategy that slowly makes the galaxy colder.
  winStanding: 2,
  loseStanding: -3,
  declareStanding: -12,
  tributeStanding: 4,

  // Being shaken down. Scales with the hold, because that is what they can see.
  tributeFloor: 1200,
  tributePerKg: 3.5,

  logKeep: 24
};

