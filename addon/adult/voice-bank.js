/** Living Galaxy voice bank v2.1.
 * Drop-in data API: BANK[category] remains an array of strings; BANK_SIZE is derived.
 * Optional picker: const voice = createVoicePicker({seed: "sol"});
 * voice.pick("greet_base", {speakerId: npc.id});
 * Keep the picker alive between turns. Create separate instances for separate worlds.
 * Existing external pickers keep working, but must adopt this helper for memory.
 * For authoritative biography, provide context entries rather than random facts:
 * voice.pick("about", {speakerId: npc.id, context: {origin: npc.origin}, entries: [
 *   {text: "I grew up on {origin}.", requires: {origin: npc.origin}, weight: 2}
 * ]});
 * Entries may use tags, weight, and exact-match requires (own context properties).
 * Missing template values exclude an entry; no eval, HTML, network or dependencies.
 * Render returned dialogue using textContent, never innerHTML.
 * Legacy dialogue still relies on the caller choosing the correct category;
 * the picker does not infer relationships, biography or world facts.
 */
export const BANK = {
  "greet_base": [
    "Captain.",
    "You're up.",
    "Board's yours.",
    "Say when.",
    "I'm here.",
    "Watch is covered.",
    "Go ahead.",
    "Listening.",
    "On the deck.",
    "What do you need.",
    "Skipper. What's the hour.",
    "Skipper. I was about to find you.",
    "Skipper. Don't let me keep you if it's nothing.",
    "Skipper. Make it quick or make it sit-down.",
    "Skipper. I have a minute. Maybe two.",
    "Skipper. If this is the payroll talk, I'm already sitting.",
    "Skipper. If this is the hull talk, I already know.",
    "Skipper. Coffee's terrible. Conversation might not be.",
    "Skipper. I left the board with a junior. You've got me.",
    "Skipper. I was heading to my bunk. This better matter.",
    "Skipper. You look like a person with a decision.",
    "Skipper. Don't salute. Just talk.",
    "Skipper. The mess can wait.",
    "Skipper. I'm not on duty. I'm also not leaving.",
    "Skipper. Ask it.",
    "Boss. What's the hour.",
    "Boss. I was about to find you.",
    "Boss. Don't let me keep you if it's nothing.",
    "Boss. Make it quick or make it sit-down.",
    "Boss. I have a minute. Maybe two.",
    "Boss. If this is the payroll talk, I'm already sitting.",
    "Boss. If this is the hull talk, I already know.",
    "Boss. Coffee's terrible. Conversation might not be.",
    "Boss. I left the board with a junior. You've got me.",
    "Boss. I was heading to my bunk. This better matter.",
    "Boss. You look like a person with a decision.",
    "Boss. Don't salute. Just talk.",
    "Boss. The mess can wait.",
    "Boss. I'm not on duty. I'm also not leaving.",
    "Boss. Ask it.",
    "You've got my attention. Where do we start?",
    "Just finishing this check. Talk while I work.",
    "Is this ship business, or can I put the board down?"
  ],
  "greet_low": [
    "Captain.",
    "…Captain.",
    "I'm here. That's the report.",
    "Don't ask if I'm fine.",
    "Say what you came to say.",
    "I showed up. Credit me that.",
    "If this is a pep talk, save it.",
    "I'm upright. Don't push it.",
    "The watch got done. That's all I've got.",
    "I don't have a smile for you today.",
    "Make it an order or make it brief.",
    "I'm not lost. I'm tired.",
    "You found me. Congratulations.",
    "I heard you coming. I stayed anyway.",
    "Don't do kind. I can't spend it today.",
    "Don't. The last cycle sat wrong.",
    "Don't. The mess is too loud.",
    "Don't. My berth is the only quiet room.",
    "Don't. I keep hearing the last ship.",
    "Don't. Payroll's a bruise I don't want poked.",
    "Don't. I slept two hours and they weren't good.",
    "Don't. Someone in the mess said my name wrong and I almost swung.",
    "Don't. I don't want company. I want a door.",
    "Not now. The last cycle sat wrong.",
    "Not now. The mess is too loud.",
    "Not now. My berth is the only quiet room.",
    "Not now. I keep hearing the last ship.",
    "Not now. Payroll's a bruise I don't want poked.",
    "Not now. I slept two hours and they weren't good.",
    "Not now. Someone in the mess said my name wrong and I almost swung.",
    "Not now. I don't want company. I want a door.",
    "Later, maybe. The last cycle sat wrong.",
    "Later, maybe. The mess is too loud.",
    "Later, maybe. My berth is the only quiet room.",
    "Later, maybe. I keep hearing the last ship.",
    "Later, maybe. Payroll's a bruise I don't want poked.",
    "Later, maybe. I slept two hours and they weren't good.",
    "Later, maybe. Someone in the mess said my name wrong and I almost swung.",
    "Later, maybe. I don't want company. I want a door.",
    "I can listen. I just haven't got much left to say.",
    "Give me one problem at a time today.",
    "I'm trying not to bring my mood onto the watch."
  ],
  "greet_partner": [
    "Captain.",
    "There you are.",
    "I kept a seat. Don't read a speech into it.",
    "Off the clock looks good on you. Don't tell the watch.",
    "I was hoping it was you and not a briefing.",
    "Come closer or don't. Hovering is worse.",
    "I left the hatch undogged. That's not an accident.",
    "If they stare, let them.",
    "Say something that isn't the run.",
    "I saved you the less burnt end. Don't make a thing of it.",
    "You're late. I noticed. That's the problem.",
    "Don't kiss me on the deck. After, though.",
    "I can do ten minutes that aren't the ship.",
    "Tell me you came for me and not the board.",
    "I already told the mess I was busy. Be the reason.",
    "Hey. I kept thinking about the last thing you said.",
    "Hey. Don't disappear into the conn for a whole cycle.",
    "Hey. I sleep better when I know which watch you're on.",
    "Hey. If you're angry, say it. I can take the straight version.",
    "Hey. If you're not angry, sit.",
    "Hey. I hate how easy this got.",
    "Hey. People asked if we were official. I didn't correct them.",
    "Hey. I almost came to the bridge. Then I didn't.",
    "You. I kept thinking about the last thing you said.",
    "You. Don't disappear into the conn for a whole cycle.",
    "You. I sleep better when I know which watch you're on.",
    "You. If you're angry, say it. I can take the straight version.",
    "You. If you're not angry, sit.",
    "You. I hate how easy this got.",
    "You. People asked if we were official. I didn't correct them.",
    "You. I almost came to the bridge. Then I didn't.",
    "There's room beside me. There usually is, for you.",
    "Can we have a conversation without checking the clock?",
    "I don't need a grand evening. A little time will do."
  ],
  "greet_trust": [
    "Captain. Say the word.",
    "You don't have to dress it up.",
    "I'm in. Ask.",
    "If you need a second body, you have one.",
    "I already decided I'd follow the ugly call.",
    "Don't thank me in advance. Just use me.",
    "The last promise still stands.",
    "I trust the hull more when you're on it.",
    "Give me the bad version first.",
    "I've been waiting on you to need something real.",
    "Say it. I'd rather hear it from you than the mess.",
    "Say it. I can carry more than the duty board thinks.",
    "Say it. If this is the hard conversation, I showed up dressed for it.",
    "Say it. You earned the short answer and the long one.",
    "Say it. I won't leak it to the watch.",
    "Say it. Point. I'll move.",
    "Go on. I'd rather hear it from you than the mess.",
    "Go on. I can carry more than the duty board thinks.",
    "Go on. If this is the hard conversation, I showed up dressed for it.",
    "Go on. You earned the short answer and the long one.",
    "Go on. I won't leak it to the watch.",
    "Go on. Point. I'll move.",
    "You can tell me when you don't know. I'll help you work it out.",
    "If you want an honest second opinion, sit down.",
    "We can disagree and still bring the ship home."
  ],
  "greet_grit": [
    "Ready when you are.",
    "I don't need a speech. I need a vector.",
    "Put me where it breaks.",
    "I've held worse in worse.",
    "Don't soften it.",
    "If it's ugly, say ugly.",
    "Boots on. Talk.",
    "I didn't sign on to stay comfortable.",
    "Give me the job that scares the junior hands.",
    "I'm not fragile. Stop treating the air like I am."
  ],
  "greet_caution": [
    "I ran the numbers again. We're fine. Probably.",
    "Before you ask: the aft seal is still the aft seal.",
    "I'd like a plan that survives contact with a Tuesday.",
    "Tell me the risk in the same sentence as the prize.",
    "I brought the readout. You can ignore it. I won't.",
    "Quiet is not the same as safe.",
    "If we're pushing her, I want a reason in writing.",
    "I sleep next to a hull that ticks. I count the ticks.",
    "Ask me after I've seen the plot, not before.",
    "I'd rather be boring and alive.",
    "Show me where we stop if the plan starts going wrong.",
    "I'd like to check the assumptions before we trust the answer.",
    "Leave us enough reserve to change our minds."
  ],
  "greet_greed": [
    "If this comes with a number, lead with the number.",
    "I'm listening. My rate is also listening.",
    "Don't buy me with praise. Buy me with the ledger.",
    "Is there a bonus hiding in this conversation.",
    "I can be loyal and expensive. Both are true.",
    "Point me at the money or point me at the bunk.",
    "I didn't come out here for the view.",
    "Fair pay, fair talk. Unfair pay, shorter talk.",
    "You want extra watch, you want extra line.",
    "Make it worth the hour."
  ],
  "greet_loyalty": [
    "You're the captain. I'm still here. That's the speech.",
    "Say where you need me.",
    "I don't shop hulls mid-run.",
    "If the watch is thin, put me on it.",
    "I told the mess this was a good ship. Don't make me a liar.",
    "I'll stand what you stand.",
    "You don't have to earn the next sentence. You earned the last ten.",
    "I keep my promises in the same room I sleep.",
    "The company can wait. This deck can't.",
    "Ask. I'll do the unpretty part."
  ],
  "greet_curiosity": [
    "What's the plan for the next rock.",
    "Tell me we aren't flying the same lane twice.",
    "I saw a ring on the chart I haven't stood under.",
    "If there's a story, I want the unedited one.",
    "Point us somewhere the log doesn't already have.",
    "I didn't come out here to memorize the same three ports.",
    "What's past the belt on this heading.",
    "Give me a reason to stay awake on the scope.",
    "I have questions. You have a conn. Let's trade.",
    "Boredom is how people get sloppy. Don't bore me.",
    "What did the scan leave out? That's the part I want to see.",
    "Got a question with no practical use whatsoever? I have several.",
    "I'd like to understand it before we put a price on it."
  ],
  "watch_eng": [
    "I'm on it. Slowly.",
    "Coolant loop first. Then the clamps people keep skipping.",
    "Engineering isn't a personality. It's a backlog.",
    "She'll hold if nobody hero-pilots her for an hour.",
    "I can hear a bearing that the board swears is fine.",
    "Give me a quiet cycle and I'll make the ticks quieter.",
    "The yard would charge you a fortune for what a hand can do with time.",
    "I don't need a promotion. I need a second wrench.",
    "If you put me here, leave me here until it's done.",
    "The reactor is a gossip. I listen.",
    "A clean diagnostic is a starting point. I still check the hardware.",
    "Let me finish the isolation check before anyone brings that circuit back.",
    "Put the symptoms in the log. Even the ones that seem unrelated."
  ],
  "watch_other": [
    "Somebody in Engineering would help. It doesn't have to be me.",
    "I'd put a body on the reactor before we push her again.",
    "Nothing that'll stop us. Plenty that should.",
    "Fixing costs a body at a console. Cheaper than a yard.",
    "The wear number is a dare. I wish we wouldn't take it.",
    "I can stand a watch that isn't mine. Say so.",
    "If the hull is the problem, stop asking the mess.",
    "I've flown ships that sounded worse. I didn't like those either.",
    "Give Engineering a name and the rest of us sleep.",
    "I notice the groans. I am not qualified to invent a fix.",
    "Put a junior on it and you'll pay twice.",
    "I'd rather be useful than optimistic.",
    "The clamps remember who last touched them. So do I.",
    "Don't wait for a red light. The amber is already a story.",
    "I can keep saying 'someone should' or you can post someone."
  ],
  "watch_posted": [
    "Aye. Clamps first.",
    "Good. I'll start with the coolant loop.",
    "Engineering. Does that come with the engineer's rate?",
    "Aye, captain. I'll find my way round the panels.",
    "Posted. Don't call me back mid-seal.",
    "I'll take the ugly shift. That's the one that matters.",
    "If the mess asks, I'm busy being useful.",
    "Copy. Reactor, then the rest.",
    "I wanted this station. I won't waste it.",
    "Leave a light on. I'll be late to dinner."
  ],
  "watch_carry": [
    "Aye. I'll keep the station I have.",
    "Carry on. That's an order I can live with.",
    "Fine. Same board, same hour.",
    "I wasn't angling for a move. Good.",
    "Then I'll stop hinting.",
    "Understood. My trade, my watch.",
    "That's cleaner. Thank you.",
    "Aye. No heroics."
  ],
  "watch_trade": [
    "Back where I'm useful. Thank you.",
    "My own tools. Finally.",
    "That's the first kind thing today.",
    "I do better work when the label matches the hands.",
    "Aye. I'll stop pretending I'm an engineer.",
    "Good. I was getting sloppy at a job that wasn't mine."
  ],
  "run_greed": [
    "We should stash, not sell — the next port pays better.",
    "This price is a trap with good lighting.",
    "Hold the cargo. Patience is a rate.",
    "If we dump it here we deserve the laugh the hall will have.",
    "I ran a back-of-the-pad number. Waiting wins.",
    "Sell thin and we fly thin. I don't like thin."
  ],
  "run_caution": [
    "Watch the reactor when the autopilot climbs. It trusts the numbers more than I do.",
    "The plot looks clean. Clean plots are where people get sloppy.",
    "I'd like a reserve burn in the plan, not in a prayer.",
    "If the lane is popular, it's also hunted.",
    "Don't let the assist fly us into a courtesy we can't afford.",
    "I want eyes on the well, not just the destination pin."
  ],
  "run_curiosity": [
    "Could we take the long lane once? There's a ring I've only seen on charts.",
    "The short way is a habit. Habits get people killed slowly.",
    "I want a look at that brown dwarf's junk, just once.",
    "There's a beacon code on the chart I don't recognize. That's a gift.",
    "If we only fly contracts we already understand, we atrophy.",
    "Point the nose at something the log hasn't named."
  ],
  "run_loyalty": [
    "It's a good run. I'll stand whatever watch it needs.",
    "You picked it. I'll make it work.",
    "Tell me the ugly part and I'll still show up.",
    "I don't need the poetry. I need the shift list.",
    "If the crew frays, put me between the fray and you.",
    "We're on it. That's enough sentence for me."
  ],
  "run_else": [
    "It's a run. They're all the same run until they aren't.",
    "Fine. We go, we come back, we count.",
    "I don't romanticize a heading.",
    "Wake me at the well.",
    "Copy the name. I'll pretend I care about the rest.",
    "As long as the pay clears, the scenery can be ugly."
  ],
  "runidle_greed": [
    "No plan on the board. A hull that isn't moving isn't earning.",
    "Dock fees eat idle ships. I can hear them chewing.",
    "Give me a contract or give me a reason we're bleeding time.",
    "The hall has work. I checked. You can also check."
  ],
  "runidle_curiosity": [
    "Nothing on the board. Point us somewhere we haven't been.",
    "Idle is a kind of rust. I can feel it.",
    "There's a whole dark out there and we're parked like a rumor.",
    "I didn't come off-world to memorize this pad."
  ],
  "runidle_caution": [
    "No plan is fine by me. A ship at rest doesn't crack.",
    "Good. Let the seals cool.",
    "I'd rather sit than invent a crisis.",
    "Stillness is a maintenance window. Take it."
  ],
  "runidle_else": [
    "No plan yet. I'll be in the mess.",
    "Call me when the pin is on the chart.",
    "I'm not bored. I'm off.",
    "The board is blank. So is my ambition today."
  ],
  "run_choice": [
    "You'll see it in the ledger.",
    "Your hull, your loss.",
    "I already watch the reactor. Now it's official.",
    "Numbers usually are, right up to the moment.",
    "I'll hold you to that, captain.",
    "Aye.",
    "Good. I like being overheard by the future.",
    "Then we do it ugly and fast. Fine.",
    "I wanted the long look. I'll live."
  ],
  "wage": [
    "It comes on time. That counts more than the number.",
    "It's under the hall rate for what I do.",
    "It's fair. I'm not here for the wage.",
    "I can live on it. I can't save on it.",
    "Don't ask if I'm happy. Ask if I bounce a payment.",
    "The first-hand rate still isn't a secret. I noticed.",
    "I've taken less for worse captains.",
    "I've taken more for worse hulls.",
    "Pay me like you want me next cycle.",
    "I didn't come to negotiate in the corridor, but here we are."
  ],
  "wage_yes": [
    "Now we're talking.",
    "You didn't have to. I'll earn it.",
    "That's the first adult conversation today.",
    "Put it in the book before the mess invents a rumor.",
    "I won't forget who moved first.",
    "Good. I like captains who can do arithmetic."
  ],
  "wage_no": [
    "Then I'm worth more than you think.",
    "Fair enough.",
    "I'll remember the number you thought I was.",
    "Fine. I'll take it out of the next bonus you invent.",
    "That's a position. It's not a good one.",
    "Aye. Cheap and clear."
  ],
  "partner_you": [
    "I keep it off the deck. Doesn't mean it isn't there.",
    "You know where I sleep, captain.",
    "Don't interview me about us in front of the coffee.",
    "I'm not a secret. I'm also not a bulletin.",
    "If you need reassurance, ask for a hand, not a speech.",
    "We're fine. The ship is louder than we are.",
    "I like who I am when the hatch is shut.",
    "Don't test it. Just come find me after the watch.",
    "Official is a word. Showing up is the proof.",
    "I already told one person in the mess to mind their board."
  ],
  "partner_good": [
    "Best thing on this hull. Don't tell them I said that.",
    "We're good. Different watches, mostly. It works.",
    "They keep me honest. I keep them fed. That's the treaty.",
    "I didn't expect to like someone this much in a tin can.",
    "If the run goes ugly, I know which bunk I'm checking first.",
    "We argue like people who plan to still be here.",
    "It's easy in the way work is easy when the tool fits.",
    "Don't reassign us to opposite shifts for fun.",
    "We don't agree on everything. We know how to come back to the conversation.",
    "It's the small things. Making room. Remembering to ask.",
    "We get to be ordinary together. Out here, that's a lot."
  ],
  "partner_thin": [
    "Honest answer? It's thin. Different watches, different tempers.",
    "We're trying. Trying is not the same as fine.",
    "Don't play counselor. Post us together or don't ask.",
    "It's not a fight. It's weather.",
    "They'd say the same if you asked. Ask them.",
    "Small ship. Big silences. We're in one.",
    "I haven't given up. I also haven't slept.",
    "If you have a spare berth with a door, that would be the actual help.",
    "We keep discussing schedules when we should be talking about us.",
    "I don't need you to take sides. I need time to work it out.",
    "I still care. That's why I don't want to pretend we're fine."
  ],
  "kids": [
    "Growing faster than the hull.",
    "I want them off a hiring-hall bench.",
    "They ask what's past the belt. I want them to find out.",
    "A deck that doesn't move. Somewhere with a school and a window.",
    "Better than the way I came up. That's the whole plan so far.",
    "Don't promise a berth unless you mean the year it takes.",
    "They know the sound of a good seal. That's a start.",
    "If we settle, I want a name on a door, not a locker.",
    "They're fine. I'm the one doing the math at 0300.",
    "Keep the ship in one piece. That's the parenting advice.",
    "I want them to have choices we didn't have.",
    "They deserve an answer when they ask why we're leaving.",
    "A family needs ordinary days too. Not everything should be an adventure."
  ],
  "expecting": [
    "Don't fuss.",
    "I'd take a quiet run if you're offering.",
    "I can work. I will also sit when I say I sit.",
    "The scan was clean. The mood is not a report.",
    "If the mess starts betting, shut it down.",
    "I need sleep more than I need congratulations.",
    "Tell the cook I exist.",
    "I'm not breakable. I am also not a crane."
  ],
  "court_yes": [
    "Yes. I was hoping you'd ask it like a person, not a briefing.",
    "Yes. Officially, if that's what you're asking.",
    "Alright. Don't make it weird in front of the watch.",
    "I already decided. You just caught up.",
    "Yes. Now we both have to be brave in public.",
    "Took you long enough.",
    "I'll take the same mess shift. That's the announcement.",
    "Yes. If you flinch tomorrow I will notice."
  ],
  "court_no": [
    "Not tonight. Ask when we both mean it.",
    "Not tonight. That isn't a never.",
    "I like you more than I like this conversation right now.",
    "Give it a cycle. I'm not a switch.",
    "No. And don't turn it into a joke so you can survive it.",
    "I heard you. I'm not ready to be heard back.",
    "Ask me docked, not between burns.",
    "Not a no forever. A no while I still have a watch to stand."
  ],
  "court_block": [
    "I know the question. I don't know you well enough to like the answer yet.",
    "It isn't you. I'm not built that way.",
    "That would make the ship smaller than it already is.",
    "I'm spoken for in the only way that matters.",
    "Don't.",
    "Kind, and no.",
    "I can work with you. I can't make a life in your cabin.",
    "The answer is in the way I didn't step closer."
  ],
  "breakup": [
    "Understood.",
    "Then that's the last kind sentence.",
    "I'll be on the board. Don't look for me in the mess.",
    "Fine. We were a good idea with a bad ending.",
    "I won't make a scene. Don't you make a rumor.",
    "Aye. Door's that way for both of us."
  ],
  "apology_open": [
    "Earlier's earlier. What do you need.",
    "I'm listening, captain.",
    "Aye. Earlier.",
    "If this is an apology, stand still while you do it.",
    "I didn't forget. I filed it.",
    "Go on. I can take a correction better than a performance."
  ],
  "apology_yes": [
    "Forgotten.",
    "That's rarer than a bonus. Thank you.",
    "Alright. We start the next watch clean.",
    "Don't do it twice. I only have one of these.",
    "Accepted. Now give me work."
  ],
  "apology_stand": [
    "Maybe I did need to hear it.",
    "Aye, captain.",
    "Then say it like a captain, not like a bruise.",
    "Fine. I'll wear it.",
    "I don't like it. I understand it."
  ],
  "promise_yes": [
    "Done. You've got me.",
    "Yes. I think yes.",
    "If the ship's going somewhere. Is it.",
    "I'd stay for the right number. That's not a threat.",
    "Shake and mean it.",
    "I don't promise often. This is one."
  ],
  "promise_no": [
    "I've left before. I don't promise what I can't keep.",
    "Ask me at the next port, when the run has a shape.",
    "Not a no. A not yet.",
    "Don't trap me with a good day.",
    "Let me see who you are after a bad cycle."
  ],
  "conn": [
    "I could. She wouldn't go anywhere fast under me. That's the point.",
    "Give it here. I've held worse in worse.",
    "Yes. And I'd make her pay while I had her.",
    "I'd take her somewhere you haven't been. Is that a yes.",
    "If you need me to. I'd rather you had it.",
    "Don't offer the conn as a compliment. Offer it as a plan."
  ],
  "free_pay": [
    "Now you're talking my language. What's the number.",
    "Pay's fair. I'm not here for the pay.",
    "It comes on time. That's all I ask.",
    "Enough to send some home.",
    "I'd take a bonus. Who wouldn't.",
    "Don't tease a raise you won't write down.",
    "The hall rate exists for a reason.",
    "I can do loyalty and arithmetic in the same minute.",
    "If the shortfall happens again I won't be polite.",
    "Credits are how this life stays a life.",
    "I didn't come out here to be spiritually compensated.",
    "Pay me, point me, leave me alone. That's the contract.",
    "You want extra duty, budget extra line.",
    "I'm not angry. I'm counting.",
    "A good captain talks money without flinching."
  ],
  "free_home": [
    "I don't go back. Doesn't mean I don't think about it.",
    "This deck's as close as I've got.",
    "Home is wherever the kids are sleeping.",
    "I outgrew the gravity. I didn't outgrow the weather.",
    "Ask me when I'm drunk. Better: don't.",
    "Some ports smell like it. I walk faster.",
    "I send money. I don't send visits.",
    "Home is a story I tell new hands so they don't ask twice.",
    "I remember the light more than the people. That says something ugly.",
    "If I go back I become someone who never left. No.",
    "There's a street I could still walk with my eyes closed. I don't.",
    "The last letter I wrote came back. That's a kind of answer.",
    "I keep a stone from there in the locker. Don't open it.",
    "Home wanted a smaller person.",
    "This hull leaks. That town drowned.",
    "What makes a place home for you? I'm still working out my answer.",
    "You can miss a place and still know why you left.",
    "Sometimes it's a routine you miss more than a room."
  ],
  "free_ship": [
    "She's holding. I check the aft seals every watch whether anyone asks.",
    "She'll take more than you think.",
    "She groans when we push her. They all do.",
    "Good hull. Better with somebody in Engineering.",
    "I've flown worse.",
    "Don't confuse quiet with healthy.",
    "I like a ship that tells the truth in ticks.",
    "If we keep skipping the little fixes we will buy a big one.",
    "She's not pretty. She's honest.",
    "Treat her like a tool and she'll last. Treat her like a miracle and she won't.",
    "I named her in my head. I won't say it because you'll laugh.",
    "The assist lies. The frame doesn't.",
    "I've heard this exact groan before, on a ship that didn't make the next port.",
    "Give her a yard week and I'll stop muttering.",
    "I trust the hull more than I trust the brochure.",
    "Ask the next watch what changed. They may have heard something we missed.",
    "A ship needs maintenance and people who feel safe reporting mistakes.",
    "I'd rather stop for a repair than name a corridor after someone."
  ],
  "free_danger": [
    "I've been boarded twice. It's loud, then it's over.",
    "I'd rather we didn't find out. Keep the turrets warm.",
    "Everyone's scared out here. The good ones work anyway.",
    "Not of them. Of the quiet after.",
    "Ask me when it's not hypothetical.",
    "Fear is information. Panic is a luxury.",
    "I can do ugly. I can't do surprised ugly.",
    "If they come, they come through the lock I already hate.",
    "Don't make me a speech about courage. Post a watch.",
    "I've seen worse than pirates. I've seen sloppy captains.",
    "The dark isn't the threat. The people who live in it are.",
    "I sleep with my boots where my hands can find them.",
    "Tell the juniors the truth or they'll invent a worse one.",
    "I'm not brave. I'm practiced.",
    "If you freeze, I won't. That's the deal.",
    "Give everyone a job they understand. Fear gets worse when you're guessing.",
    "If we get through this, let people shake afterward.",
    "Check on the quiet ones too. Not everyone asks for help."
  ],
  "free_thanks": [
    "Any time, captain.",
    "It's the job.",
    "Say it with a bonus next time.",
    "Don't make it a ceremony.",
    "I heard you. That's enough.",
    "You're welcome. Now let me work.",
    "Rare. I'll keep it.",
    "Save it for when I actually save the ship.",
    "Alright. That landed.",
    "Thanks back, if we're doing this.",
    "You're welcome. Make sure the rest of the watch hears it too.",
    "I'm glad it helped. That's enough for now.",
    "Keep looking after the crew and we're even."
  ],
  "free_sorry": [
    "Forgotten.",
    "Alright. Thank you for saying it.",
    "Don't collect apologies like stamps. Change the next hour.",
    "I can take that. I couldn't take the silence.",
    "Accepted. Work next.",
    "Say it once. Mean it. Move.",
    "I was waiting for that more than I wanted to admit.",
    "Okay. We're not even. We're continuing.",
    "I won't weaponize it later. Don't you.",
    "Good. I like captains who can do that.",
    "Tell me what will be different next time. That's where we start.",
    "I heard you. I might need a little time before it feels settled.",
    "We can repair this without pretending it never happened."
  ],
  "free_insult": [
    "Say that again when you're not the one signing the pay.",
    "Aye, captain.",
    "Noted. So is the way you said it.",
    "I'll put that in the part of my head I don't take to dinner.",
    "If you need me smaller, pick a different hand.",
    "That's a choice. Live with the version of me it makes.",
    "I can do respect. I can't do decoration.",
    "You don't get both obedience and a punching bag.",
    "Fine. I'll be professional. That's colder than you think.",
    "I'll remember the exact wording. That's not a threat. It's filing."
  ],
  "free_romance": [
    "Not on the deck, captain.",
    "If that's an ask, ask it properly.",
    "I'm with someone. You know that.",
    "Don't test a line you aren't ready to hear answered.",
    "I don't flirt for morale.",
    "Say dinner. Or don't.",
    "This corridor has ears.",
    "I like you enough to want the private version of this sentence.",
    "Careful. I might say yes and then you have a problem.",
    "That's not a joke I laugh at on a ship this small."
  ],
  "free_plan": [
    "You're the captain. Point the hull.",
    "Somewhere we haven't been. I'll take the long lane.",
    "Suits me.",
    "Give me the heading and the why.",
    "If there's no why, I'll invent a worse one.",
    "I can fly bored. I fly better with a reason.",
    "Don't surprise the watch with a well they didn't pack for.",
    "I like a plan that survives the first hour.",
    "Tell me what success looks like besides 'we didn't die.'",
    "Copy. I'll pretend I love the name of the rock."
  ],
  "free_question": [
    "Honestly? Depends who's asking. You, so: yes.",
    "I'd tell you if I knew.",
    "Ask me after the watch and I'll give you the long answer.",
    "Couldn't say, captain.",
    "Above my pay.",
    "You'd know better than me.",
    "That's a bigger question than this corridor.",
    "I can guess. Guessing is how rumors start.",
    "Sit down if you want the real version.",
    "Not in front of the board.",
    "Yes. Next question.",
    "No. Next question.",
    "I need a minute that isn't this minute.",
    "Write it in the log and I still might not answer.",
    "Try me when the ship is quiet."
  ],
  "free_other": [
    "Heard.",
    "I'm listening.",
    "Go on.",
    "Aye.",
    "If you say so.",
    "Mm.",
    "Is that an order.",
    "Say it again with the part you skipped.",
    "I can work with that.",
    "That's a sentence. I'm waiting for the second one.",
    "Copy.",
    "Fine.",
    "Don't bury the ask.",
    "I'm not a wall. I'm a person with a watch.",
    "Alright. We can do this the long way.",
    "Keep talking. I'll tell you when to stop.",
    "That's not nothing. It's also not a plan.",
    "I filed it.",
    "Sure.",
    "If this is small talk, pick a better hour."
  ],
  "free_robot": [
    "Query parsed. No directive found. Try STATUS, DIAGNOSTIC or DIRECTIVE.",
    "Acknowledged.",
    "Noted. Tone does not affect throughput.",
    "Wear logged. Assign Engineering to reduce it.",
    "Unit ready. Speech is optional.",
    "I do not require morale input.",
    "Directive unclear. Restate.",
    "Continuing current post.",
    "Condition nominal enough.",
    "That sentence contained no actionable verb."
  ],
  "beat_watch_0": [
    "You take the board next to them. The hull ticks. Neither of you fills the quiet.",
    "The scope paints the same dark it painted an hour ago. You stay anyway.",
    "Someone left a cold cup on the rail. You don't mention it.",
    "The duty board says this watch is covered. You make it true.",
    "A warning tone starts and dies. Both of you pretend that was normal."
  ],
  "beat_watch_1": [
    "Numbers are clean. I'd still rather watch them myself.",
    "I've got this side. You take the other.",
    "If you're staying, tell me what that signature on the scope is.",
    "Didn't expect company. It's not a problem.",
    "People who talk too early on a watch make mistakes. So don't.",
    "I can hear the port pump from here. That's new.",
    "Sit if you're sitting. Hovering makes the board nervous.",
    "I already ran the checklist. Run it again with me anyway."
  ],
  "beat_watch_2": [
    "You didn't have to sit this. People notice when you do.",
    "If this is about the rate, just say.",
    "Long watch. Goes faster with someone who isn't talking just to talk.",
    "I work cleaner when the chair next to me is occupied by a grown-up.",
    "Don't praise me mid-watch. Save it for the mess.",
    "I was going to brood. This is better.",
    "If something goes wrong now, at least there are two of us to swear.",
    "I like this version of the job."
  ],
  "beat_watch_ok": [
    "Same time tomorrow, if the board's free.",
    "That helped. More than I expected.",
    "I won't say I needed the company. I did.",
    "Good watch. Don't ruin it with a debrief.",
    "I'll take the next ugly hour if you take the one after.",
    "That's how you keep a hand. Not the posters."
  ],
  "beat_watch_bad": [
    "I work cleaner alone. No offence meant.",
    "Next time maybe give me the watch to myself.",
    "That was crowded.",
    "I couldn't hear the ship over the conversation.",
    "Don't sit a watch as a performance.",
    "I'm not angry. I'm done."
  ],
  "beat_mess_0": [
    "The mess is loud in the way small ships are loud. You sit.",
    "Someone is arguing about a port price like it's theology.",
    "The stew has a name tonight. Nobody believes the name.",
    "You take the bench that faces the hatch. Old habit. They notice."
  ],
  "beat_mess_1": [
    "If you're buying, I'm eating.",
    "You eat like someone who forgot they had a body. Sit properly.",
    "There's stew. It's stew. Don't ask what kind.",
    "I saved you a seat. That's not a treaty.",
    "Don't brief me over food. Food is the brief.",
    "The coffee is a hate crime. Drink it anyway.",
    "Tell me something that happened outside the duty log.",
    "We can leave the rank at the door for one meal, can't we?",
    "Sit. You don't have to earn a place at the table."
  ],
  "beat_mess_2": [
    "Crew that eats together stays. That's the whole speech.",
    "I've had worse. I've had better. This is fine.",
    "You don't have to do this. But I don't mind that you did.",
    "If the watch saw this, good. Let them.",
    "I talk less when I'm fed. That's a warning and a gift.",
    "Don't get up yet. The second bowl is the conversation."
  ],
  "beat_mess_ok": [
    "Same table tomorrow. I'll save you the less burnt end.",
    "That was a meal. I needed one of those.",
    "Alright. You can sit here again.",
    "I like you better with food in the way.",
    "Don't make it rare."
  ],
  "beat_mess_bad": [
    "I'm not good company tonight. Leave the bowl.",
    "That was crowded in a different way.",
    "I wanted silence with calories. I got an interview.",
    "Next time just send the tray.",
    "Don't turn stew into a performance review."
  ],
  "beat_confide_0": [
    "You catch them after the watch, away from the mess.",
    "The corridor by the aft lock is the only honest room on some nights.",
    "They almost walk past you. Then they don't.",
    "You don't start with how are you. You start with time."
  ],
  "beat_confide_1": [
    "If this is a performance review, just say the number.",
    "I'm upright. That's the report.",
    "You asking because you care, or because the ship needs me useful.",
    "Alright. Talk.",
    "I can do this standing. Sitting makes it a therapy session.",
    "Don't look at me like a leak."
  ],
  "beat_confide_2": [
    "Payroll's thin. I can live with thin. I can't live with surprise.",
    "I keep thinking about a port we didn't take. That's all it is.",
    "Some nights the hull sounds like the last ship. That's not your problem.",
    "I haven't told the mess. Don't you.",
    "I'm tired in a way sleep doesn't touch.",
    "If I leave, it won't be for a better rate. It'll be for a quieter head.",
    "I miss a person I can't put on this roster.",
    "I keep doing the job so I don't have to do the feeling.",
    "I keep making myself useful so I don't have to admit I'm tired.",
    "I don't need a solution before I've finished telling you the problem.",
    "Sometimes I want someone else to notice without making me ask."
  ],
  "beat_confide_ok": [
    "I don't say that to everyone. Don't make me regret the inventory.",
    "Thanks for not turning it into a speech.",
    "Alright. I can stand the next watch now.",
    "You can ask again. Not every night.",
    "That helped. I hate that it helped.",
    "You let me finish. That mattered.",
    "Nothing's fixed yet. It feels less lonely, though.",
    "Let me decide when the others hear about it."
  ],
  "beat_confide_bad": [
    "I said I was upright. I meant it. Door's that way.",
    "Don't pick at it.",
    "That was a raid, not a conversation.",
    "I gave you an inch. You brought a form.",
    "Next time just post me and skip the intimacy theater."
  ],
  "beat_walk_0": [
    "The lock cycles. They fall into step without being asked.",
    "The concourse smells like coolant and fried something.",
    "A vendor tries a greeting. Both of you ignore it like professionals.",
    "Pad lights make everyone look like they haven't slept. You haven't."
  ],
  "beat_walk_1": [
    "I always forget how wide a floor can be when it isn't a corridor.",
    "Stay where I can see the lock from. Habit.",
    "I don't window-shop. I walk. You coming or not.",
    "Don't buy me anything. Walking is enough.",
    "If we pass a bar I'm not going in. I'm also not not going in.",
    "People from the hall nod like they know us. Maybe they do."
  ],
  "beat_walk_2": [
    "People will talk. Let them. I'm tired of pretending I don't like the company.",
    "If this is a date, the next drink is on the ship.",
    "I can do another loop. Unless you've got a reason to go back.",
    "I like you better off the pad than on the board. Don't tell the board.",
    "Don't overexplain why you asked. I already came.",
    "If you take my arm I will not make a speech about it."
  ],
  "beat_walk_ok": [
    "I needed air that wasn't recycled. And I needed it with you.",
    "That was a walk I will remember on the next ugly watch.",
    "Alright. Official enough.",
    "Don't vanish into the conn the second we lock back in.",
    "I want to do that again at the next port. Say it back."
  ],
  "beat_walk_bad": [
    "That was a walk. Don't make it more than a walk.",
    "I needed air. I did not need an interview.",
    "Let's not do the long silence as a bit.",
    "I should have come alone.",
    "Don't look wounded. You asked for honest."
  ],
  "beat_dinner_0": [
    "You say it in the corridor, not the mess — dinner, not a briefing.",
    "They stop walking. That's how you know the sentence landed.",
    "A junior passes and pretends they heard nothing. They heard everything.",
    "The ship hums like it's listening. It isn't. It just hums."
  ],
  "beat_dinner_1": [
    "Dinner. On this hull that's never just dinner.",
    "Say what you mean. I can take the straight version.",
    "You're asking me. Properly.",
    "I'm already spoken for. You know that. Why are you asking it like this.",
    "If this is pity, keep your stew.",
    "If this is real, look at me when you say the rest."
  ],
  "beat_dinner_2": [
    "If I say yes, I mean it. I don't do halfway on a ship this small.",
    "Yes has a cost. I'm looking at you, trying to count it.",
    "Give me the second it takes to decide. Then I'll give you an answer.",
    "Don't put me in that position again. I like this crew.",
    "I can see the mess from here. That's not where I want to have this.",
    "Alright. Ask the second question, the one you're scared of."
  ],
  "beat_dinner_ok": [
    "Yes. Officially, if that's what you're asking. Don't make it weird in front of the watch.",
    "Yes. I was hoping you'd ask it like a person, not a briefing.",
    "Alright. Same mess shift. That's the announcement.",
    "I'm in. Don't flinch tomorrow.",
    "Yes. Now we both have to be brave in public."
  ],
  "beat_dinner_bad": [
    "No. And don't ask it like a joke next time.",
    "Not tonight. Ask when we both mean it.",
    "That would make the ship smaller than it already is.",
    "Kind, and no.",
    "I heard you. I'm not ready to be heard back."
  ],
  "beat_evening_0": [
    "The duty board is someone else's problem for an hour.",
    "They shut the hatch to the cabin like it's a habit now.",
    "Boots off is a kind of flag.",
    "The room is small. That's the point."
  ],
  "beat_evening_1": [
    "Door's dogged. Talk or sit. Both are fine.",
    "I took my boots off. That's as off-duty as I get.",
    "Come here. We've earned a night that isn't a briefing.",
    "If you start a status report I will throw a pillow with intent.",
    "I don't need a plan for the next hour.",
    "Stay where I can see you. That's not cling. That's peace."
  ],
  "beat_evening_2": [
    "I don't say this on the deck. I like who I am when it's just us.",
    "Tell me something you don't put in the log.",
    "Stay. That's the whole request.",
    "I can hear the watch changing and I do not care.",
    "If this is a mistake, it's a clean one.",
    "Don't leave in the middle of a sentence I haven't finished."
  ],
  "beat_evening_ok": [
    "That was ours. I'll be on time for the next watch. Don't look so surprised.",
    "Stay five more minutes. That's an order you can refuse.",
    "I needed that more than the ship needed us.",
    "Don't make it rare.",
    "Come back after the next watch. I'll leave the hatch honest."
  ],
  "beat_evening_bad": [
    "I'm poor company tonight. Leave the light. I'll find the watch on my own.",
    "That missed. Don't pretend it didn't.",
    "I wanted quiet. I got a performance.",
    "Go. I'm not angry. I'm empty.",
    "We can try again when I'm a person."
  ],
  "wants_pay": [
    "Payroll came up short last cycle. I'm not the only one counting.",
    "I can do thin. I can't do surprise thin.",
    "The hall would laugh at that number. Then they'd walk.",
    "Square it or say you can't. Don't smile in the middle."
  ],
  "wants_hull": [
    "It's the hull, captain. I'd rather say it to you than to the mess.",
    "The ticks are a language and I am fluent and I am tired.",
    "Post Engineering before we invent a story about luck.",
    "I'm not scared. I'm early."
  ],
  "wants_soft": [
    "Got a minute? Nothing for the log. Just a minute.",
    "I don't want a form. I want an ear.",
    "If I take this to the mess it becomes a mutiny of mood. I'd rather not.",
    "I kept it off the board. That's respect. Meet me there."
  ],
  "wants_hear": [
    "Thanks, captain. That's it, that's all.",
    "That's all I wanted to hear.",
    "Appreciated. I'll tell the others it's squared.",
    "Alright. I can work now.",
    "You didn't fix the universe. You fixed the hour. That's enough."
  ],
  "wants_later": [
    "Right. Later.",
    "I'll file it under 'the captain was busy.' That file is getting fat.",
    "Fine. I'll be here. The problem will also be here.",
    "Don't say later if you mean never."
  ],
  "mood_idle": [
    "Captain, I could use a heading.",
    "I could use a heading.",
    "Captain, The pad is making everyone mean.",
    "The pad is making everyone mean.",
    "Captain, If we sit another cycle I'll start naming the rivets.",
    "If we sit another cycle I'll start naming the rivets.",
    "Captain, Give the juniors work before they invent politics.",
    "Give the juniors work before they invent politics.",
    "Listen, I could use a heading.",
    "Listen, The pad is making everyone mean.",
    "Listen, If we sit another cycle I'll start naming the rivets.",
    "Listen, Give the juniors work before they invent politics.",
    "Plain: I could use a heading.",
    "Plain: The pad is making everyone mean.",
    "Plain: If we sit another cycle I'll start naming the rivets.",
    "Plain: Give the juniors work before they invent politics.",
    "For the log: I could use a heading.",
    "For the log: The pad is making everyone mean.",
    "For the log: If we sit another cycle I'll start naming the rivets.",
    "For the log: Give the juniors work before they invent politics."
  ],
  "mood_burn": [
    "Captain, Hold the chatter until the well lets go of us.",
    "Hold the chatter until the well lets go of us.",
    "Captain, I hate this part and I am good at this part.",
    "I hate this part and I am good at this part.",
    "Captain, If the assist twitches, I want a human on it.",
    "If the assist twitches, I want a human on it.",
    "Captain, Don't celebrate a burn before the plot agrees.",
    "Don't celebrate a burn before the plot agrees.",
    "Listen, Hold the chatter until the well lets go of us.",
    "Listen, I hate this part and I am good at this part.",
    "Listen, If the assist twitches, I want a human on it.",
    "Listen, Don't celebrate a burn before the plot agrees.",
    "Plain: Hold the chatter until the well lets go of us.",
    "Plain: I hate this part and I am good at this part.",
    "Plain: If the assist twitches, I want a human on it.",
    "Plain: Don't celebrate a burn before the plot agrees.",
    "For the log: Hold the chatter until the well lets go of us.",
    "For the log: I hate this part and I am good at this part.",
    "For the log: If the assist twitches, I want a human on it.",
    "For the log: Don't celebrate a burn before the plot agrees."
  ],
  "mood_dock": [
    "Captain, Don't lose anyone to the hall's bright ideas.",
    "Don't lose anyone to the hall's bright ideas.",
    "Captain, I want one hour that isn't the ship and then I want the ship back.",
    "I want one hour that isn't the ship and then I want the ship back.",
    "Captain, If you grant leave, grant it like you mean the return.",
    "If you grant leave, grant it like you mean the return.",
    "Captain, Ports make people brave in stupid directions.",
    "Ports make people brave in stupid directions.",
    "Listen, Don't lose anyone to the hall's bright ideas.",
    "Listen, I want one hour that isn't the ship and then I want the ship back.",
    "Listen, If you grant leave, grant it like you mean the return.",
    "Listen, Ports make people brave in stupid directions.",
    "Plain: Don't lose anyone to the hall's bright ideas.",
    "Plain: I want one hour that isn't the ship and then I want the ship back.",
    "Plain: If you grant leave, grant it like you mean the return.",
    "Plain: Ports make people brave in stupid directions.",
    "For the log: Don't lose anyone to the hall's bright ideas.",
    "For the log: I want one hour that isn't the ship and then I want the ship back.",
    "For the log: If you grant leave, grant it like you mean the return.",
    "For the log: Ports make people brave in stupid directions."
  ],
  "mood_fight": [
    "Captain, I'll be at the lock if it comes to that.",
    "I'll be at the lock if it comes to that.",
    "Captain, Don't give a speech. Give a vector.",
    "Don't give a speech. Give a vector.",
    "Captain, I can do ugly. Point.",
    "I can do ugly. Point.",
    "Captain, If they board, they board a crew that already decided.",
    "If they board, they board a crew that already decided.",
    "Listen, I'll be at the lock if it comes to that.",
    "Listen, Don't give a speech. Give a vector.",
    "Listen, I can do ugly. Point.",
    "Listen, If they board, they board a crew that already decided.",
    "Plain: I'll be at the lock if it comes to that.",
    "Plain: Don't give a speech. Give a vector.",
    "Plain: I can do ugly. Point.",
    "Plain: If they board, they board a crew that already decided.",
    "For the log: I'll be at the lock if it comes to that.",
    "For the log: Don't give a speech. Give a vector.",
    "For the log: I can do ugly. Point.",
    "For the log: If they board, they board a crew that already decided."
  ],
  "mood_after": [
    "Captain, Count the living before you count the cargo.",
    "Count the living before you count the cargo.",
    "Captain, I don't want a medal. I want a shower and a quiet board.",
    "I don't want a medal. I want a shower and a quiet board.",
    "Captain, We got lucky. Don't build a doctrine out of luck.",
    "We got lucky. Don't build a doctrine out of luck.",
    "Captain, I'll write the report. You drink the water.",
    "I'll write the report. You drink the water.",
    "Listen, Count the living before you count the cargo.",
    "Listen, I don't want a medal. I want a shower and a quiet board.",
    "Listen, We got lucky. Don't build a doctrine out of luck.",
    "Listen, I'll write the report. You drink the water.",
    "Plain: Count the living before you count the cargo.",
    "Plain: I don't want a medal. I want a shower and a quiet board.",
    "Plain: We got lucky. Don't build a doctrine out of luck.",
    "Plain: I'll write the report. You drink the water.",
    "For the log: Count the living before you count the cargo.",
    "For the log: I don't want a medal. I want a shower and a quiet board.",
    "For the log: We got lucky. Don't build a doctrine out of luck.",
    "For the log: I'll write the report. You drink the water."
  ],
  "ack": [
    "Aye.",
    "Aye, captain.",
    "Copy.",
    "Copy, captain.",
    "Heard.",
    "Heard, captain.",
    "Fine.",
    "Fine, captain.",
    "Alright.",
    "Alright, captain.",
    "Understood.",
    "Understood, captain.",
    "On it.",
    "On it, captain.",
    "Done.",
    "Done, captain.",
    "Later.",
    "Later, captain.",
    "Now.",
    "Now, captain."
  ],
  "about": [
    "Ask me one thing at a time. You'll get a better answer.",
    "There's the service record, and there's me. Where do you want to start?",
    "I'd rather tell my own story than have the mess tell it.",
    "Some of that is private. The rest we can talk about off watch.",
    "You want to know why I stayed? That's a better question.",
    "Give me a quiet table and time to answer properly.",
    "My history isn't a performance review.",
    "Start with what matters to you. I'll tell you what I can."
  ],
  "praise_ok": [
    "Just the job.",
    "Thanks, captain. That helps.",
    "Say it when the juniors can hear, or don't bother.",
    "I'll take it.",
    "Don't spend it all in one place. There's more work.",
    "Alright. I'll keep doing the thing you liked.",
    "Words are free. A bonus isn't.",
    "I know. I was there.",
    "Tell me which part worked. I'd like to get it right again.",
    "I appreciate you noticing the work before something breaks.",
    "Keep the whole watch in mind. Nobody does this alone."
  ],
  "chew": [
    "Aye.",
    "Understood, captain.",
    "I'll sharpen. Don't hover while I do it.",
    "That landed. Good. Now let me work.",
    "I can take a dressing-down. I can't take an audience.",
    "Fine. I'll be colder and better. Your call.",
    "If that was for the mess, you missed. If it was for me, copy.",
    "Give me the specific mistake. I can fix something specific.",
    "I understand the standard. Let me explain where I lost it.",
    "I'll own my part. Let's make sure we address the cause too."
  ],
  "leave": [
    "Back by the next watch.",
    "Don't spend my leave for me.",
    "I'll come back. That's the part that should matter.",
    "Sixty credits buys a night that isn't metal. Thank you.",
    "If I find trouble I'll bring it home in a bag, not a story."
  ]
};

export const BANK_SIZE = Object.values(BANK).reduce((n, rows) => n + rows.length, 0);
export const VOICE_BANK_VERSION = '2.1.0';

const own = (obj, key) => Object.prototype.hasOwnProperty.call(obj, key);
const object = value => value !== null && typeof value === 'object';
const normalized = text => text.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, ' ').trim();
// Group near-identical address variants so changing "Captain" to "Boss" is not novelty.
const family = text => normalized(text.replace(/^(captain|skipper|boss|hey)[.!?,:;]\s+/i, ''));
const limit = (value, fallback, max) => Number.isFinite(value)
  ? Math.max(1, Math.min(max, Math.floor(value))) : fallback;

export function createVoiceRng(seed = 'living-galaxy') {
  let state = 2166136261;
  for (const char of String(seed)) state = Math.imul(state ^ char.codePointAt(0), 16777619);
  const random = () => {
    state = (state + 0x6D2B79F5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t ^= t + Math.imul(t ^ (t >>> 7), 61 | t);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  random.getState = () => state >>> 0;
  random.setState = value => {
    if (!Number.isInteger(value) || value < 0 || value > 0xffffffff)
      throw new TypeError('Invalid voice RNG state.');
    state = value | 0;
  };
  return random;
}

/** Bounded per-speaker memory; seeded instances reproduce the same sequence of calls.
 * Options: bank, seed, rng, historySize (12), maxSpeakers (512).
 * pick(category, {speakerId, context, tags, entries, fallback}) -> string.
 * entries overrides that category for this call, including an intentionally empty [].
 * Preferred tags boost weights; requires is a hard constraint. There is no automatic
 * cross-category fallback: a rejected romance line must not become an acceptance.
 * History spans categories. If all candidates are recent, least-recently used wins.
 * reset(speakerId) clears that speaker; reset() clears all memory (not RNG state).
 */
export function createVoicePicker(options = {}) {
  options = object(options) ? options : {};
  const bank = object(options.bank) ? options.bank : BANK;
  const managedRng = typeof options.rng !== 'function' && own(options, 'seed');
  const rng = typeof options.rng === 'function' ? options.rng
    : own(options, 'seed') ? createVoiceRng(options.seed) : Math.random;
  const historySize = limit(options.historySize, 12, 256);
  const maxSpeakers = limit(options.maxSpeakers, 512, 10000);
  const memories = new Map();

  function pick(category, request = {}) {
    request = object(request) ? request : {};
    const fallback = typeof request.fallback === 'string' ? request.fallback : '';
    if (typeof category !== 'string') return fallback;
    const rows = own(request, 'entries') ? request.entries
      : own(bank, category) ? bank[category]
      : bank === BANK && own(CONTEXT_BANK, category) ? CONTEXT_BANK[category] : null;
    if (!Array.isArray(rows)) return fallback;
    const context = object(request.context) ? request.context : {};
    const tags = new Set(Array.isArray(request.tags) ? request.tags : []);
    const candidates = [];
    const seen = new Set();
    for (const row of rows) {
      const entry = typeof row === 'string' ? {text: row} : row;
      if (!object(entry) || typeof entry.text !== 'string') continue;
      if (own(entry, 'requires')) {
        if (!object(entry.requires) || Array.isArray(entry.requires)) continue;
        if (!Object.entries(entry.requires).every(([key, value]) =>
          own(context, key) && context[key] === value)) continue;
      }
      if (own(entry, 'excludes')) {
        if (!object(entry.excludes) || Array.isArray(entry.excludes)) continue;
        if (Object.entries(entry.excludes).some(([key, value]) =>
          own(context, key) && context[key] === value)) continue;
      }
      let missing = false;
      const text = entry.text.replace(/\{([\w]+)\}/g, (_, key) => {
        const value = own(context, key) ? context[key] : undefined;
        if ((typeof value !== 'string' && typeof value !== 'number') ||
            (typeof value === 'number' && !Number.isFinite(value)) || value === '') {
          missing = true;
          return '';
        }
        return String(value);
      }).trim();
      const id = normalized(text);
      if (missing || !id || seen.has(id)) continue;
      const weight = own(entry, 'weight') ? entry.weight : 1;
      if (!Number.isFinite(weight) || weight <= 0) continue;
      const matches = Array.isArray(entry.tags) ?
        new Set(entry.tags.filter(tag => tags.has(tag))).size : 0;
      candidates.push({text, family: typeof entry.family === 'string' && entry.family.trim()
        ? 'explicit:' + entry.family.trim() : family(text), weight: Math.min(weight, 1e6) * (1 + Math.min(matches, 8))});
      seen.add(id);
    }
    if (!candidates.length) return fallback;
    const speaker = String(request.speakerId ?? 'default');
    const history = memories.get(speaker) || [];
    // Select a semantic family first: a family with many wording variants gets
    // no more probability mass than one with a single equally weighted line.
    const groups = new Map();
    for (const item of candidates) {
      if (!groups.has(item.family)) groups.set(item.family, []);
      groups.get(item.family).push(item);
    }
    let available = [...groups.keys()].filter(key => !history.includes(key));
    if (!available.length) {
      const oldest = [...groups.keys()].reduce((n, key) => Math.min(n, history.lastIndexOf(key)), Infinity);
      available = [...groups.keys()].filter(key => history.lastIndexOf(key) === oldest);
    }
    function choose(items, getWeight) {
      const weights = items.map(getWeight);
      const total = weights.reduce((a, b) => a + b, 0);
      const random = rng();
      if (!Number.isFinite(random) || random < 0 || random >= 1)
        throw new RangeError('Voice RNG must return a finite number in [0, 1).');
      let cursor = random * total;
      for (let i = 0; i < items.length; i++) {
        cursor -= weights[i];
        if (cursor < 0) return items[i];
      }
      return items[items.length - 1];
    }
    const selected = choose(available, key => groups.get(key).reduce((n, x) => Math.max(n, x.weight), 0));
    const result = choose(groups.get(selected), item => item.weight).text;
    const next = history.filter(key => key !== selected);
    next.push(selected);
    memories.delete(speaker);
    memories.set(speaker, next.slice(-historySize));
    if (memories.size > maxSpeakers) memories.delete(memories.keys().next().value);
    return result;
  }
  function reset(speakerId) {
    if (arguments.length === 0) memories.clear();
    else memories.delete(String(speakerId));
  }
  // JSON-safe save data. Only seeded, internally managed RNGs support exact replay.
  // External RNG and Math.random snapshots restore dialogue memory only.
  function snapshot() {
    return {version: 1, rngState: managedRng ? rng.getState() : null,
      speakers: [...memories].map(([id, history]) => [id, [...history]])};
  }
  function restore(saved) {
    if (!object(saved) || saved.version !== 1 || !Array.isArray(saved.speakers) ||
        saved.speakers.length > maxSpeakers)
      throw new TypeError('Invalid or oversized voice snapshot.');
    const next = new Map();
    for (const row of saved.speakers) {
      if (!Array.isArray(row) || row.length !== 2 || typeof row[0] !== 'string' ||
          !Array.isArray(row[1]) || row[1].length > historySize ||
          row[1].some(x => typeof x !== 'string') ||
          new Set(row[1]).size !== row[1].length || next.has(row[0]))
        throw new TypeError('Invalid speaker memory.');
      next.set(row[0], [...row[1]]);
    }
    if (saved.rngState !== null && (!Number.isInteger(saved.rngState) ||
        saved.rngState < 0 || saved.rngState > 0xffffffff))
      throw new TypeError('Invalid saved RNG state.');
    if ((saved.rngState !== null) !== managedRng)
      throw new TypeError('Snapshot and picker RNG modes differ.');
    // Commit only after validating the entire snapshot.
    if (managedRng) rng.setState(saved.rngState);
    memories.clear();
    for (const [id, history] of next) memories.set(id, history);
  }
  return {pick, reset, snapshot, restore};
}

/** Optional fact-driven categories, deliberately separate from legacy string arrays.
 * Missing facts exclude the line; an empty result means no eligible dialogue.
 * Supply only facts known to THIS speaker, rather than the entire world record.
 * No template or picker writes back into NPC/game state.
 *
 * voice.pick('family_legacy', {speakerId: npc.id, context: {
 *   founderName: 'Mara Venn', familyName: 'Venn', founderKnown: true
 * }, tags: ['reflective']});
 *
 * Caller defines the field names below as an adapter to its own NPC schema.
 * Booleans must be explicit true values, not strings or truthy placeholders.
 * For custom entries: family groups paraphrases; tags bias selection;
 * requires is ALL exact matches; excludes blocks ANY exact match.
 *
 * Save: gameSave.voice = voice.snapshot();
 * Load: voice.restore(gameSave.voice);
 * Use the same bank/options and a seeded picker for exact continuation.
 * Shared RNG means interleaving calls from different NPCs affects their choices.
 * Snapshots contain supplied dialogue facts in normalized history strings;
 * retain them with the corresponding world save, not as public telemetry.
 */
export const CONTEXT_BANK = {
  family_legacy: [
    {text: '{founderName} is where our family records begin. That is not necessarily where our story began.', requires: {founderKnown: true}, tags: ['reflective'], family: 'founder-record'},
    {text: 'People hear {familyName} and think they already know me. I would rather they ask.', tags: ['guarded'], family: 'name-expectations'},
    {text: 'Being a {familyName} gives me a history. It does not decide what I do next.', tags: ['independent'], family: 'name-expectations'},
    {text: 'I want to know what {founderName} was like on an ordinary day. Family records rarely tell you that.', requires: {founderKnown: true}, tags: ['curious'], family: 'founder-person'},
    {text: 'If we pass the {familyName} story on, we should leave room for the mistakes too.', tags: ['honest'], family: 'legacy-honesty'}
  ],
  family_memory: [
    {text: 'The part I remember about {relativeName} is this: {familyMemory}', requires: {memoryKnown: true}, tags: ['reflective'], family: 'relative-memory'},
    {text: 'When you ask about {relativeName}, that is where my mind goes: {familyMemory}', requires: {memoryKnown: true}, tags: ['warm'], family: 'relative-memory'},
    {text: 'I have not forgotten {relativeName}. I just do not always want to talk about them.', requires: {relativeKnown: true}, tags: ['guarded'], family: 'relative-boundary'}
  ],
  family_future: [
    {text: 'I want {childName} to choose a future, not inherit my unfinished arguments.', requires: {hasChild: true}, tags: ['warm'], family: 'child-choice'},
    {text: 'Ask me what I want for {childName}? Time to grow up without having to be useful.', requires: {hasChild: true}, tags: ['protective'], family: 'child-time'},
    {text: '{partnerName} and I need to make that decision together. A duty roster cannot make it for us.', requires: {hasPartner: true, familyPlanningDiscussed: true}, tags: ['practical'], family: 'family-planning'}
  ],
  company_ties: [
    {text: 'I work for {companyName}. That tells you who pays me, not everything I believe.', requires: {employed: true}, tags: ['independent'], family: 'employment'},
    {text: 'At {companyName}, my job is {jobTitle}. Judge me by how I do it.', requires: {employed: true}, tags: ['practical'], family: 'employment'},
    {text: 'My family owns a stake in {companyName}. I should say that before we discuss the contract.', requires: {familyOwnsStake: true}, tags: ['honest'], family: 'ownership-disclosure'},
    {text: '{relativeName} worked for {companyName}. Their experience is part of why I ask so many questions.', requires: {relativeEmployedThere: true}, tags: ['cautious'], family: 'family-employment'},
    {text: 'I used to work for {formerCompanyName}. Used to. Please keep that distinction in the record.', requires: {formerEmploymentKnown: true}, tags: ['guarded'], family: 'former-employment'}
  ],
  personal_origin: [
    {text: 'I grew up on {origin}. What would you like to know about it?', requires: {originKnown: true}, tags: ['open'], family: 'origin'},
    {text: '{origin} is where I grew up. Whether I call it home is a longer conversation.', requires: {originKnown: true}, tags: ['reflective'], family: 'origin'},
    {text: 'I signed on for a reason: {joiningReason}', requires: {joiningReasonKnown: true}, family: 'joining-reason'}
  ],
  event_recall: [
    {text: 'About {eventName}: {eventMemory}', requires: {witnessedEvent: true}, tags: ['reflective'], family: 'event-memory'},
    {text: 'I was there for {eventName}. My account is only one account, but I can give it.', requires: {witnessedEvent: true}, tags: ['honest'], family: 'event-account'},
    {text: 'I heard about {eventName}. I was not there, so I will not pretend I know how it felt.', requires: {heardEvent: true, witnessedEvent: false}, family: 'event-hearsay'}
  ],
  promise_followup: [
    {text: 'You said you would {promiseAction}. Is that still the plan?', requires: {promisePending: true}, excludes: {promiseKept: true, promiseBroken: true}, family: 'promise-pending'},
    {text: 'Thank you for following through on {promiseLabel}. I noticed.', requires: {promiseKept: true}, excludes: {promisePending: true}, tags: ['warm'], family: 'promise-kept'},
    {text: 'We need to talk about {promiseLabel}. Tell me what changed.', requires: {promiseBroken: true}, excludes: {promiseKept: true}, tags: ['direct'], family: 'promise-broken'}
  ],
  relationship_checkin: [
    {text: '{partnerName} and I are doing well. I would like to keep making time for that.', requires: {hasPartner: true, relationshipState: 'good'}, excludes: {relationshipPrivate: true}, family: 'partner-good'},
    {text: 'Things with {partnerName} are strained. I can tell you that without asking you to take sides.', requires: {hasPartner: true, relationshipState: 'strained'}, excludes: {relationshipPrivate: true}, family: 'partner-strained'},
    {text: '{partnerName} deserves to hear it from me first. Let me have that conversation.', requires: {hasPartner: true, relationshipPrivate: true}, tags: ['guarded'], family: 'partner-privacy'}
  ]
};
