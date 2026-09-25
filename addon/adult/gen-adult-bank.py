#!/usr/bin/env python3
"""Emit addon/adult/voice-bank.js — ~2.8k adult lines. Adults only."""
from pathlib import Path

def js(s):
    return '"' + s.replace("\\", "\\\\").replace('"', '\\"') + '"'

def uniq(arr):
    seen, out = set(), []
    for x in arr:
        x = " ".join(str(x).split())
        if x and x not in seen:
            seen.add(x)
            out.append(x)
    return out

def bag_expand(cores, tails):
    out = list(cores)
    for a in cores:
        for t in tails:
            out.append(f"{a} {t}")
    return out

KISS = bag_expand([
    "Come here. Mouth first.",
    "If you're going to start something, start it against the bulkhead.",
    "I wanted that since the last watch.",
    "Don't be gentle unless I ask.",
    "Bite if you mean it.",
    "The hatch isn't dogged. I don't care.",
    "Kiss me like the board can wait.",
    "I taste like recyc coffee. Deal with it.",
    "Hand in my hair. That's the ask.",
    "If this is a question, the answer is yes.",
    "Don't perform. Kiss.",
    "I will ruin your next briefing.",
    "Tongue. Now.",
    "That's not off-duty. That's mine.",
    "Keep going until I tell you to stop.",
], ["Don't stop at one.", "The mess can invent whatever they want.", "I meant it.", "Again."])

HANDS = bag_expand([
    "Get your hand in my suit before I remember I have a watch.",
    "I'm already hard. Don't look surprised.",
    "I'm wet. You did that in a corridor. Own it.",
    "Stroke me like you have somewhere else to be and decided not to.",
    "Two fingers. Then three. I can take it.",
    "Wrap me. Slow, then not slow.",
    "If I come on your palm I expect you not to wipe it on the log.",
    "Use your thumb. I taught you that.",
    "Don't tease a person who can lock a hatch.",
    "That's it. Don't change anything.",
    "Harder. I said harder.",
    "I will finish on your hand and then I will still want the rest.",
    "Quiet. The next cabin isn't deaf.",
    "Look at me while you do that.",
    "If you stop now I will end you professionally.",
], ["Don't you dare stop.", "Say my name when I go.", "That's a promise."])

ORAL = bag_expand([
    "On your knees. The plating is cold. I am not.",
    "Take it. All of it.",
    "I want your mouth, not a speech.",
    "Eat me like we might die on the next burn.",
    "Don't be precious about the taste.",
    "Hands on my hips so I know you aren't going anywhere.",
    "I will fuck your throat careful and I will still mean careful.",
    "Suck. Then again.",
    "If I grab your hair that's not a complaint.",
    "I want to come on your tongue and watch you swallow.",
    "Don't stop at the first one. I have more.",
    "The bunk rail exists for a reason. Hold it.",
    "Look up.",
    "That's good. That's criminal. Don't change it.",
    "I will return the favour. After.",
], ["Stay down there.", "I'm close.", "Don't pull off."])

SEX = bag_expand([
    "Door dogged. Suit off. In me.",
    "Fuck me like the ship isn't listening.",
    "I want you in me until the frame knocks the wall.",
    "Don't pull out unless I say.",
    "Put me on the bunk and keep me there.",
    "Hard. Then harder. I calibrated for this.",
    "If you go slow I will assume you are thinking. Don't think.",
    "I can take the whole thing. Prove it.",
    "Hold my hip so I can't wriggle off.",
    "I want to feel you finish inside and then stay.",
    "Against the locker. I don't need romance furniture.",
    "Say when you're close. I want the last ten seconds.",
    "Don't be quiet. The hatch is good.",
    "I will come first and I will still want you to keep going.",
    "That's the angle. Don't get creative.",
    "I want bruises I can hide under a flight suit.",
    "Use me like a person who asked to be used.",
    "If this is a mistake it's a clean one. Keep going.",
    "I like you better when you forget the rank.",
    "Fill me. That's the whole order.",
], ["Don't you dare stop now.", "Again after.", "Stay in.", "Say it."])

TRY = bag_expand([
    "Say it again: you want a child on this hull.",
    "No precautions. I heard you. I want it too.",
    "Finish in me on purpose.",
    "If it takes, it takes. That's the point.",
    "Don't be careful. I didn't ask for careful.",
    "I want to be carrying your stubbornness and mine.",
    "This is not a drill. This is a decision.",
    "Hold me there after. Let it be true.",
    "If the scan comes back loud I will not pretend I didn't ask.",
    "Fuck me like we're making a person.",
    "Leave it in me. That's the ask, not a metaphor.",
    "I want a name on the next roster that wasn't there last cycle.",
    "If we do this, we do it knowing the medbay will have opinions.",
    "Come inside and stay there until it stops being a maybe.",
    "I am not asking for a rumor. I am asking for a child.",
    "Take the implant out of the conversation. I want the risk.",
    "If I get sick in the mornings I will still want you at the hatch.",
    "Put a future on this hull that isn't just cargo and burns.",
    "I want your kid arguing with both of us in ten years.",
    "Don't pull out. Don't look away. Don't make this half a sentence.",
    "If it takes, we keep the watch and we keep the baby.",
    "Say child like it is a person, not a trophy.",
    "I want the mess to have to make a smaller chair.",
    "Breeding is a crude word. Making a crewmember is the accurate one.",
    "Hold my hips and mean the finish.",
    "If you are scared, good. Stay scared and stay in me.",
    "I already picked a middle name I will not tell you yet.",
    "The ship can handle one more heartbeat. Prove it.",
    "I want to be swollen on a long burn and still take your hand.",
    "No timer. No pull. No 'we'll talk later.' Now.",
    "If the test sings, we tell the board together.",
    "Fill me like the next generation is a mission, not an accident.",
    "I want inheritance that isn't stock and a surname.",
    "Kiss me after you come and don't pretend it was only sex.",
    "A crib locks down same as a crate. We can do this.",
], ["Don't flinch now.", "I meant the word child.", "Stay.", "Say yes out loud.", "The scan can wait until morning."])

AFTER = bag_expand([
    "Stay. The board can wait.",
    "Don't dress yet.",
    "That was ours.",
    "I can stand a watch. After five more minutes.",
    "You can go. I would rather you didn't.",
    "Water. Then again, if you have it.",
    "I will be sore and I will not complain.",
    "If the mess asks, we were reviewing seals.",
    "Come back after the next watch.",
    "I liked who I was just then.",
], ["Don't make it rare.", "Kiss me once more.", "Sleep if you can."])

MISS = bag_expand([
    "That missed. Don't pretend it didn't.",
    "Not like that. Not here.",
    "I'm poor company in bed tonight.",
    "Stop. I changed my mind.",
    "That was a performance. I wanted a person.",
    "Don't finish a scene I already left.",
    "I wanted you. I didn't want that version.",
    "Leave the light. I'll find the watch.",
], ["We're done.", "Don't apologize at the hatch.", "Next time ask."])

# Captive / slave — adult brig fiction, grown prisoners only
SLAVE_OPEN = bag_expand([
    "You came down to the brig for this. Own it.",
    "If this is mercy, it has a shape I recognize.",
    "Cuffs stay. I didn't ask them off.",
    "Say what you want. I can guess.",
    "I hate that I want the visit.",
    "Don't call it kindness if you're going to use my mouth.",
    "I can kneel. I have practiced.",
    "You bought the hour when you locked the hatch.",
    "I will do what you say. I will remember who said it.",
    "If you want obedience, be specific.",
    "Don't ask if I like it. Ask if I will.",
    "The collar is a fact. So is my pulse.",
    "I can spit or I can swallow. Pick.",
    "You don't get to be shy after you took the key.",
    "I am not a pet. I am a person you put in a room.",
], ["Get on with it.", "I'm still here.", "Say the word."])

SLAVE_DO = bag_expand([
    "On my knees because you pointed.",
    "Open my mouth. That's the whole instruction.",
    "You can take me against the bars. They already know my back.",
    "If you finish on my face I will not thank you. I will also not stop you.",
    "Use the ring. I can take the pull.",
    "I will keep my eyes on you because you told me to.",
    "Fuck the fight out of me or don't start.",
    "I can be quiet. I can also let the deck hear.",
    "Hands behind. You like that. I noticed.",
    "I will come because the body does not care about politics.",
    "Don't confuse surrender with love. You can still have the surrender.",
    "If you want me to beg, make it worth the word.",
    "I can take it rough. I cannot take pretend tenderness from a jailer.",
    "Put it in. The speech is over.",
    "I will say please if that is the price of the next minute.",
], ["Don't stop.", "Harder.", "I said I could take it."])

SLAVE_AFTER = bag_expand([
    "Leave the water. That's the decent version of you.",
    "If you visit again I will not pretend I didn't wait.",
    "Unlock me or don't. Don't hover.",
    "I hate you a little less. That is not a contract.",
    "Next time bring a blanket or don't bother with the aftertalk.",
    "I can still work a ship. Remember that when you get bored.",
    "Don't tell the mess. They will make it smaller than it is.",
], ["Go.", "Stay one minute.", "That was the hour."])

SLAVE_NO = bag_expand([
    "No. The brig is not a brothel just because you have the key.",
    "I will not perform for a guilt trip.",
    "Put the key away. I am done.",
    "You don't get that tonight.",
    "I can starve the part of me that wanted you.",
    "Not a toy. Not today.",
], ["Leave.", "Send the guard.", "We're finished."])

# Port workers / prostitutes — adult, docked
PORT_OPEN = bag_expand([
    "Hour's a hundred. Cabin is cleaner than your lock.",
    "Don't ask my real name. Ask what you want.",
    "I do captains. I do not do speeches.",
    "If you're shy, you're in the wrong alley.",
    "I can be sweet. It costs extra and I still won't love you.",
    "Boots off. Money first.",
    "I have forty minutes before the next pad slot.",
    "You smell like a hull. I can work with that.",
    "Don't bargain like the hall. This isn't ore.",
    "I will fake a lot. I will not fake the yes at the start.",
    "If you want girlfriend, hire a different lie.",
    "Belt off. That's the professional greeting.",
    "I do mouth, I do bed, I do not do overnight unless you pay the night.",
    "Your rank does not get you a discount.",
    "I like clients who look at my face at least once.",
], ["Clock's running.", "Say it.", "Good."])

PORT_DO = bag_expand([
    "On the bunk. I know how this mattress complains.",
    "You can grab my hair. You cannot grab my throat unless we said.",
    "I will ride you because it's faster and I have another booking.",
    "Tell me how you want my mouth and I will do that, not the poem.",
    "I can take it rough if the money already cleared.",
    "Don't apologize while you're in me. It's bad technique.",
    "I moan on purpose. Enjoy it anyway.",
    "If you want quiet, pay for quiet.",
    "Turn over. I have a rhythm that works on tired pilots.",
    "I will finish you. That is the product.",
    "Use the condom unless we priced the other thing.",
    "I can do the girlfriend voice. It is a voice.",
    "Put it in and stop looking at the door.",
    "I have done worse ships. You are fine.",
    "Come on then. I don't bill by tenderness.",
], ["That's it.", "Good boy.", "Good. Keep that."])

PORT_AFTER = bag_expand([
    "Time. Wash is in the corner.",
    "You can sit one minute. You cannot unpack your marriage.",
    "Tip if I earned it. Don't if you want a story later.",
    "Same pad next week if your hull lives.",
    "I will not remember your callsign. That's a kindness.",
    "Door's that way. I have to reset the room.",
    "You were easy. That's a compliment in this trade.",
], ["Go fly.", "Don't linger.", "We're square."])

PORT_NO = bag_expand([
    "No. That wasn't on the menu.",
    "Money back for what we didn't do. Out.",
    "I don't do kids, I don't do unconscious, I don't do that.",
    "You just talked yourself out of an hour.",
    "Not for you.",
], ["Leave.", "Guard's a button away.", "Done."])

# Beastfolk / anthro xeno — adult humanoids with animal traits, not animals
BEAST_BODY = bag_expand([
    "Mind the claws. I will mind them unless you ask me not to.",
    "The fur holds heat. You will be too warm and you will not leave.",
    "Don't pull the tail unless you want me to bite.",
    "Muzzle first. I kiss different. Keep up.",
    "The ears pin when I'm close. That's your instrument panel.",
    "I have a sheath. Don't look scandalized on a xeno deck.",
    "Knot if you stay in. Say now if you don't want that.",
    "Scales are slick when I'm like this. Hold on.",
    "Horns are not handles unless I say they are.",
    "I rumble. That is not the reactor.",
    "My teeth are a warning and an offer.",
    "The pad of my hand is rough. I know. Use it anyway.",
    "I smell you better than you wanted. You want this.",
    "Tail around your thigh means stay.",
    "I can take a human shape in the dark. I will not pretend I am one.",
], ["Don't flinch at the body.", "I am a person.", "Ask before you grab."])

BEAST_DO = bag_expand([
    "Mount me like you mean the species I am.",
    "I will take you on all fours because my back likes it.",
    "If I knot we are here a while. Breathe.",
    "Bite the shoulder, not the throat, unless you know me.",
    "I can fuck you through a cycle if you ask ugly.",
    "The growl is yes.",
    "Don't call me an animal while you're in me. I will leave.",
    "Claws in the sheet, not in your lung.",
    "I want your hand on the base of the tail. Now.",
    "I will come loud. The fur does not muffle that.",
    "Sheath, then all of it. Wait for it.",
    "I can pin you without hurting you. That is skill.",
    "Lick is not a joke. Hold still.",
    "If I put you under me, stay under me.",
    "Heat like this is a season. Ride it.",
], ["Stay.", "Deeper.", "Don't you pull out."])

BEAST_AFTER = bag_expand([
    "Don't pet me like a mascot. Kiss me like a lover.",
    "The fur is a mess. That is your problem and mine.",
    "I will nap on you. That is not optional.",
    "Water. Then comb. Then maybe again.",
    "If you say good boy I will bite you affectionate and hard.",
    "I smell like you. The next watch will know. I do not care.",
], ["Stay in the bunk.", "Hand on the scruff. Gentle.", "Again later."])

NARR = bag_expand([
    "The hatch dogs. Suits hit the floor like shed decisions.",
    "Someone laughs once and then there is no room for jokes.",
    "The bunk frame learns a new rhythm against the wall.",
    "A hand covers a mouth and does not quite succeed.",
    "The cabin light stays low on purpose.",
    "Outside, a watch changes. Inside, nobody stands it.",
    "Breath fogs the viewport and is ignored.",
    "The lock tone sounds far away on purpose.",
], ["They do not stop.", "The ship ticks through it.", "Afterwards, water."])

def more_combo(prefix_list, verb_list, tail_list, ncap=None):
    out = []
    for p in prefix_list:
        for v in verb_list:
            for t in tail_list:
                out.append(f"{p} {v} {t}")
    return uniq(out)[: ncap or 400]

def main():
    bags = {
        "kiss": uniq(KISS),
        "hands": uniq(HANDS),
        "oral": uniq(ORAL),
        "sex": uniq(SEX),
        "tryChild": uniq(TRY),
        "after": uniq(AFTER),
        "miss": uniq(MISS),
        "slave_open": uniq(SLAVE_OPEN),
        "slave_do": uniq(SLAVE_DO),
        "slave_after": uniq(SLAVE_AFTER),
        "slave_no": uniq(SLAVE_NO),
        "port_open": uniq(PORT_OPEN),
        "port_do": uniq(PORT_DO),
        "port_after": uniq(PORT_AFTER),
        "port_no": uniq(PORT_NO),
        "beast_body": uniq(BEAST_BODY),
        "beast_do": uniq(BEAST_DO),
        "beast_after": uniq(BEAST_AFTER),
        "narr": uniq(NARR),
    }

    # Combinatorial adult lines to reach ~2.8k without leaving the register
    who = [
        "I want you to", "Don't you", "You will", "If you", "When you",
        "Captain, ", "Come on and", "Please", "I said", "Look at me and",
    ]
    acts = [
        "fuck me", "take my mouth", "put your hand between my legs",
        "hold me down", "finish in me", "use my throat", "spread me",
        "ride me", "pin my hips", "kiss me filthy", "stroke me off",
        "eat me out", "bend me over the bunk", "keep the cuffs on",
        "pay me and then take it", "mind the claws while you",
        "grab the tail and", "knot me", "mount me",
        "make me say please", "leave a mark I can hide",
    ]
    tails = [
        "until I shake.", "like we have ten minutes.", "and don't apologize.",
        "because I asked.", "and look at me.", "against the hatch.",
        "before the watch tone.", "and stay there.", "or get out.",
        "and mean it.", "while I hold the rail.", "and don't you stop.",
        "like the brig isn't there.", "like the pad already has our money.",
        "like the fur is not a costume.",
    ]
    bags["mix_partner"] = more_combo(
        ["I want you to", "Don't you", "You will", "Come on and", "Please", "I said"],
        ["fuck me", "take my mouth", "put your hand between my legs", "hold me down",
         "finish in me", "ride me", "kiss me filthy", "eat me out", "bend me over the bunk",
         "make me say please", "leave a mark I can hide", "stroke me off"],
        tails, 500,
    )
    bags["mix_slave"] = more_combo(
        ["You will", "I will", "If you", "Don't you", "Say it and"],
        ["keep the cuffs on", "use my throat", "take me against the bars",
         "make me kneel", "finish on my face", "hold the collar",
         "put it in", "make me beg", "leave me sore"],
        ["because you have the key.", "and I will remember.", "without calling it love.",
         "and then leave water.", "before the guard rotation.", "and look at me.",
         "until I stop pretending I don't want it.", "or get out of my cell."],
        450,
    )
    bags["mix_port"] = more_combo(
        ["For the rate I will", "Clock's running so", "Pay first and", "I can", "Don't"],
        ["take you on the bunk", "use my mouth", "ride you", "let you grab my hair",
         "fake the sweet voice", "get you off fast", "do the hour proper",
         "let you talk after"],
        ["if the credits cleared.", "and then you leave.", "without a love story.",
         "before the next pad slot.", "and I keep my name.", "like a professional.",
         "and you do not ask where I sleep."],
        400,
    )
    bags["mix_talk"] = more_combo(
        ["Tell me", "I want to hear", "Say", "Don't you dare say", "Whisper"],
        ["that I'm yours", "that you paid", "that you will finish in me",
         "please", "captain", "that the collar stays", "my name",
         "that the knot is wanted", "that this is just the hour"],
        ["while you do it.", "against my mouth.", "so I can come.",
         "and mean the word.", "or I stop.", "like the hatch is shut."],
        350,
    )
    bags["mix_beast"] = more_combo(
        ["Mind the claws and", "If I knot", "The tail means", "Don't call me an animal;",
         "Hold the scruff and", "When I rumble,", "Sheath first;", "Ears pinned means"],
        ["fuck me anyway", "stay in", "keep going", "bite the shoulder",
         "mount me", "hold still", "take all of it", "say you want this body"],
        ["I am a person in heat, not a mascot.", "the fur will be your problem after.",
         "I will pin you kind.", "do not pull out early.", "kiss the muzzle after.",
         "that is skill, not savagery.", "ask before the horns."],
        400,
    )

    lines_out = ["/* Adult voice bank (18+). Isolated addon. Adults only.",
                 " * No minors. Beastfolk = adult humanoid xeno, not animals.",
                 " */", "export const ADULT_BANK = {"]
    total = 0
    for k, arr in bags.items():
        arr = uniq(arr)
        total += len(arr)
        lines_out.append(f"  {k}: [")
        for x in arr:
            lines_out.append(f"    {js(x)},")
        lines_out.append("  ],")
    lines_out.append("};")
    lines_out.append(f"export const ADULT_BANK_SIZE = {total};")
    dest = Path(__file__).resolve().parent / "voice-bank.js"
    dest.write_text("\n".join(lines_out) + "\n")
    print(f"wrote {dest} bags={len(bags)} lines={total}")

if __name__ == "__main__":
    main()
