/* Deeper 18+ talk trees. Isolated addon.
 * Core talk.choose now keeps returning choices, so a topic can walk
 * approach → terms → act → aftercare without dumping you to the list.
 */
import { firstName } from "../../js/crew.js";
import { social, loadSocial, playerAsPerson, adjustMorale, adjustTrust } from "../../js/family.js";
import { tryConceive, conceptionOdds, canHavePrivacy } from "../../js/crew/romance.js";
import { sim } from "../../js/sim.js";
import { scene } from "./scenes.js";
import { adultLine, flavorBags } from "./voice.js";

const Q = (m, s) => `${firstName(m)}: "${s}"`;
const packOn = () => {
  try { return globalThis.localStorage?.getItem("lgaa-adult-pack") !== "off"; } catch { return true; }
};
const together = (m) => m?.partner === "player";
const beastRace = (m) => !["terran", "t-synth", "oberlin", ""].includes(String(m?.raceId ?? ""));

function seed(m, k) {
  return `${m.id}:${k}:${Math.round(sim.time ?? 0)}`;
}
function say(m, bags, k, fb) {
  return adultLine(flavorBags(m, bags), seed(m, k), fb);
}
function heatOf(m) {
  m.memory ??= { flags: {} };
  m.memory.flags ??= {};
  return m.memory.flags.adultHeat ?? 0;
}
function heat(m, n) {
  m.memory ??= { flags: {} };
  m.memory.flags ??= {};
  m.memory.flags.adultHeat = Math.max(0, Math.min(5, (m.memory.flags.adultHeat ?? 0) + n));
  return m.memory.flags.adultHeat;
}

function aftercareChoices(m) {
  return [
    { id: "stay", label: "Stay a while", cls: "accent", fx: { trust: 3, morale: 3 },
      say: () => ({ text: Q(m, say(m, "after", "stay", "Stay. The board can wait.")), choices: [] }) },
    { id: "again", label: "Again", cls: "accent", fx: { morale: 2 },
      say: () => actMenu(m, "You can have again. Say how.") },
    { id: "child", label: "Ask to try for a child", whenOk: () => social.family && together(m),
      say: () => tryChildNode(m) },
    { id: "planTalk", label: "Talk about a family, not just tonight", whenOk: () => social.family && together(m),
      say: () => familyPlanNode(m) },
    { id: "ifTakes", label: "If this cycle takes…", whenOk: () => social.family && together(m) && heatOf(m) >= 2,
      say: () => ifTakesNode(m) },
    { id: "deck", label: "Back to the watch",
      say: () => ({ text: Q(m, say(m, "after", "deck", "Go. Before I keep you.")), choices: [] }) },
  ].filter((ch) => !ch.whenOk || ch.whenOk());
}

function finishAct(m, actId, extra = "") {
  heat(m, actId === "kiss" ? 1 : 2);
  const text = `${scene(playerAsPerson(), m, actId)}${extra}`;
  return { text: `${text}\n${Q(m, say(m, actId === "kiss" ? "kiss" : "after", "fin", "Don't dress yet."))}`, choices: aftercareChoices(m) };
}

function actMenu(m, lead) {
  const priv = canHavePrivacy(m, playerAsPerson());
  const bedOk = priv.ok || priv.why === "switched off in house rules" || together(m);
  const choices = [
    { id: "kiss", label: "Kiss them", say: () => finishAct(m, "kiss") },
    { id: "hands", label: "Hands", cls: "accent", say: () => finishAct(m, "hands") },
    { id: "oral", label: "Mouth", cls: "accent", say: () => finishAct(m, "oral") },
  ];
  if (bedOk) {
    choices.push({ id: "sex", label: "Take them to bed", cls: "accent", say: () => finishAct(m, "sex") });
    if (social.family) choices.push({ id: "try", label: "Bed — and say you want a child", cls: "accent", say: () => tryChildNode(m) });
  } else {
    choices.push({ id: "noBed", label: `Bed (${priv.why})`, say: () => ({
      text: Q(m, `Not the bunk. ${priv.why}.`),
      choices: actMenu(m, "Then something else.").choices,
    }) });
  }
  choices.push({ id: "stop", label: "Stop here", say: () => ({ text: Q(m, say(m, "miss", "stop", "That's enough.")), choices: [] }) });
  return { text: Q(m, lead || say(m, "kiss", "menu", "If you're going to start something, say how.")), choices };
}

function tryChildNode(m) {
  loadSocial();
  const choices = [
    { id: "yes", label: "No precautions. That's the point.", cls: "accent", fx: { trust: 4 },
      say: () => conceiveFinish(m) },
    { id: "stayIn", label: "Stay in after. Mean it.", cls: "accent", fx: { trust: 3, morale: 2 },
      say: () => conceiveFinish(m, " They stay joined until the shaking stops.") },
    { id: "nameFirst", label: "Pick a name first, then try",
      say: () => nameThenTryNode(m) },
    { id: "timing", label: "Ask about timing and medbay",
      say: () => timingNode(m) },
    { id: "notYet", label: "Not the child. Just the night.",
      say: () => finishAct(m, "sex") },
    { id: "back", label: "Not that conversation",
      say: () => actMenu(m, "Fine. The other menu.") },
  ];
  const odds = conceptionOdds(m, playerAsPerson());
  const chance = social.family ? Math.round((odds.chance || 0.2) * 100) : 0;
  return {
    text: Q(m, say(m, "tryChild", "ask", "Say it again: you want a child on this hull.")) + (chance ? ` (odds ~${chance}%)` : " (families are off in HOUSE)"),
    choices,
  };
}

function conceiveFinish(m, extraNarr = "") {
  const held = social.contraception;
  social.contraception = false;
  const hit = tryConceive(m, playerAsPerson());
  social.contraception = held;
  heat(m, 2);
  const extra = extraNarr + (hit.conceived ? ` ${firstName(hit.carrier)} may be carrying.` : " Not this cycle.");
  return finishAct(m, "tryChild", extra);
}

function nameThenTryNode(m) {
  return {
    text: Q(m, say(m, "tryChild", "name", "A name is not a guarantee. It is still a promise.")),
    choices: [
      { id: "founder", label: "Use a founder name", cls: "accent", fx: { trust: 2 },
        say: () => conceiveFinish(m, " They pick a founder name and then stop being careful.") },
      { id: "new", label: "Something the hull has never heard", cls: "accent",
        say: () => conceiveFinish(m, " They invent a name that isn't in the archive.") },
      { id: "later", label: "Name after the scan",
        say: () => conceiveFinish(m, " They leave the name blank on purpose.") },
      { id: "back", label: "Back", say: () => tryChildNode(m) },
    ],
  };
}

function timingNode(m) {
  const odds = conceptionOdds(m, playerAsPerson());
  const chance = social.family ? Math.round((odds.chance || 0.2) * 100) : 0;
  return {
    text: Q(m, say(m, "tryChild", "time", "Medbay will have a window. I would rather use this one.")) + (chance ? ` (~${chance}% this cycle)` : ""),
    choices: [
      { id: "now", label: "This cycle. Tonight.", cls: "accent", fx: { trust: 3 },
        say: () => conceiveFinish(m) },
      { id: "afterBurn", label: "After the next burn",
        say: () => ({
          text: Q(m, say(m, "after", "wait", "Then we wait. I will not punish you for timing.")),
          choices: aftercareChoices(m),
        }) },
      { id: "scanFirst", label: "Get a fertility scan first", fx: { trust: 1 },
        say: () => ({
          text: Q(m, say(m, "tryChild", "scan", "Fine. Scan first. Then you come back and say the word again.")),
          choices: aftercareChoices(m),
        }) },
      { id: "back", label: "Back", say: () => tryChildNode(m) },
    ],
  };
}

function familyPlanNode(m) {
  loadSocial();
  return {
    text: Q(m, say(m, "tryChild", "plan", "A child is watches and sick nights, not just a finish. Ask the real question.")),
    choices: [
      { id: "ready", label: "I am ready to raise one on this ship", cls: "accent", fx: { trust: 4, morale: 2 },
        say: () => tryChildNode(m) },
      { id: "adopt", label: "Adoption or guardianship, not a pregnancy", fx: { trust: 3 },
        say: () => ({
          text: Q(m, say(m, "after", "adopt", "Then we file it like adults. The bunk can wait for celebration.")),
          choices: aftercareChoices(m),
        }) },
      { id: "duties", label: "Talk watches, school, and who holds the baby",
        say: () => ({
          text: Q(m, say(m, "after", "duty", "I will take midwatch if you take mornings. That is the romance.")),
          choices: [
            { id: "try", label: "Then try tonight", cls: "accent", say: () => tryChildNode(m) },
            { id: "hold", label: "Hold the plan", say: () => ({ text: Q(m, say(m, "after", "hold", "Held. I am still here.")), choices: [] }) },
          ],
        }) },
      { id: "wait", label: "Not ready. Keep the night.",
        say: () => finishAct(m, "sex") },
    ],
  };
}

function ifTakesNode(m) {
  return {
    text: Q(m, say(m, "tryChild", "if", "If the scan is loud, we do not hide it in a locker.")),
    choices: [
      { id: "tell", label: "We tell the board together", cls: "accent", fx: { trust: 3 },
        say: () => conceiveFinish(m, " They agree the board hears it from both of them.") },
      { id: "keep", label: "Keep it ours until the second month",
        say: () => conceiveFinish(m, " They keep the secret small and the hatch dogged.") },
      { id: "justTalk", label: "Just talk. No trying yet.",
        say: () => ({ text: Q(m, say(m, "after", "just", "Talk is allowed. I like you better when you plan.")), choices: aftercareChoices(m) }) },
    ],
  };
}

function cabinOpen(m, c) {
  loadSocial();
  if (!together(m)) {
    return {
      text: Q(m, heatOf(m) > 0
        ? say(m, "kiss", "almost", "You keep starting this in corridors.")
        : say(m, "kiss", "ask", "If that's a question, ask it with your mouth or don't.")),
      choices: [
        { id: "ask", label: "Ask them to the cabin", cls: "accent", fx: { trust: 1 },
          say: () => ({
            text: Q(m, say(m, "kiss", "yes", "Door. Now.")),
            choices: [
              { id: "in", label: "Go in", cls: "accent", say: () => actMenu(m, say(m, "sex", "in", "Suit off.")) },
              { id: "out", label: "Not tonight", fx: { morale: -1 }, say: () => ({ text: Q(m, say(m, "miss", "out", "Then don't start it.")), choices: [] }) },
            ],
          }) },
        { id: "kissHere", label: "Kiss them here", say: () => finishAct(m, "kiss") },
        { id: "drop", label: "Drop it", say: () => ({ text: Q(m, say(m, "miss", "drop", "Good.")), choices: [] }) },
      ],
    };
  }
  const h = heatOf(m);
  const lead = h >= 3
    ? say(m, "sex", "hot", "You know where the hatch is. Don't brief me.")
    : h >= 1
      ? say(m, "kiss", "warm", "Come here. Mouth first.")
      : say(m, "after", "home", "Door's dogged if you want it to be.");
  return {
    text: Q(m, lead),
    choices: [
      { id: "in", label: "Shut the hatch", cls: "accent", say: () => actMenu(m) },
      { id: "talkFirst", label: "Talk first",
        say: () => ({
          text: Q(m, say(m, "after", "talk", "Talk or sit. Both are fine.")),
          choices: [
            { id: "want", label: "Tell them what you want", cls: "accent",
              say: () => actMenu(m, say(m, "mix_talk", "want", "Say it.")) },
            { id: "them", label: "Ask what they want",
              say: () => actMenu(m, say(m, "mix_partner", "them", "I want you to fuck me.")) },
            { id: "soft", label: "Just stay close", fx: { trust: 2, morale: 2 },
              say: () => ({ text: Q(m, say(m, "after", "soft", "Don't dress yet.")), choices: aftercareChoices(m) }) },
          ],
        }) },
      { id: "quick", label: "Quick, before the watch", cls: "accent", say: () => finishAct(m, heatOf(m) >= 2 ? "sex" : "hands") },
      { id: "family", label: "Talk family", whenOk: () => social.family && together(m),
        say: () => familyPlanNode(m) },
    ].filter((ch) => !ch.whenOk || ch.whenOk()),
  };
}

function padOpen(m) {
  if ((sim.ship?.credits ?? 0) < 100) {
    return { text: Q(m, say(m, "port_no", "broke", "Pay first.")), choices: [{ id: "ok", label: "Back off", say: () => ({ text: Q(m, "Clock's not running."), choices: [] }) }] };
  }
  return {
    text: Q(m, say(m, "port_open", "hi", "Hour's a hundred. Cabin is cleaner than your lock.")),
    choices: [
      { id: "pay", label: "Pay 100 cr", cls: "accent", fx: { credits: -100, morale: 2 },
        say: () => ({
          text: Q(m, say(m, "port_do", "paid", "Belt off. That's the professional greeting.")),
          choices: [
            { id: "mouth", label: "Mouth", cls: "accent", say: () => finishAct(m, "oral") },
            { id: "bed", label: "Bed", cls: "accent", say: () => finishAct(m, "sex") },
            { id: "hands", label: "Hands only", say: () => finishAct(m, "hands") },
            { id: "sweet", label: "Ask for the girlfriend voice",
              say: () => ({
                text: Q(m, say(m, "port_do", "sweet", "I can do the girlfriend voice. It is a voice.")),
                choices: [
                  { id: "bed2", label: "Then the bed", cls: "accent", say: () => finishAct(m, "sex") },
                  { id: "done", label: "That's the hour", say: () => ({ text: Q(m, say(m, "port_after", "out", "Door's that way.")), choices: [] }) },
                ],
              }) },
          ],
        }) },
      { id: "haggle", label: "Haggle",
        say: () => ({
          text: Q(m, say(m, "port_open", "hag", "Don't bargain like the hall. This isn't ore.")),
          choices: [
            { id: "pay2", label: "Pay the hundred", cls: "accent", fx: { credits: -100 }, say: () => actMenu(m, say(m, "port_do", "ok", "Clock's running.")) },
            { id: "no", label: "Walk", say: () => ({ text: Q(m, say(m, "port_no", "walk", "You just talked yourself out of an hour.")), choices: [] }) },
          ],
        }) },
      { id: "no", label: "Not that", say: () => ({ text: Q(m, say(m, "port_no", "no", "No. That wasn't on the menu.")), choices: [] }) },
    ],
  };
}

function collarOpen(m) {
  return {
    text: Q(m, say(m, "slave_open", "door", "You came down to the brig for this. Own it.")),
    choices: [
      { id: "ask", label: "Ask what they will do",
        say: () => ({
          text: Q(m, say(m, "slave_open", "ask", "If you want obedience, be specific.")),
          choices: [
            { id: "mouth", label: "Mouth", cls: "accent", say: () => finishAct(m, "oral") },
            { id: "bars", label: "Against the bars", cls: "accent", say: () => finishAct(m, "sex") },
            { id: "kneel", label: "Kneel and wait", fx: { trust: -1 },
              say: () => ({
                text: Q(m, say(m, "slave_do", "kneel", "On my knees because you pointed.")),
                choices: [
                  { id: "mouth2", label: "Then mouth", cls: "accent", say: () => finishAct(m, "oral") },
                  { id: "up", label: "Get them up", fx: { trust: 2 }, say: () => ({ text: Q(m, say(m, "slave_after", "up", "Unlock me or don't. Don't hover.")), choices: [] }) },
                ],
              }) },
            { id: "no", label: "Leave the key idle", fx: { trust: 3 },
              say: () => ({ text: Q(m, say(m, "slave_no", "leave", "Put the key away. I am done.")), choices: [] }) },
          ],
        }) },
      { id: "take", label: "Don't ask", cls: "danger", fx: { trust: -2 },
        say: () => finishAct(m, "sex") },
      { id: "out", label: "This was a check-in", fx: { trust: 2 },
        say: () => ({ text: Q(m, say(m, "slave_after", "check", "Leave the water. That's the decent version of you.")), choices: [] }) },
    ],
  };
}

function xenoOpen(m) {
  return {
    text: Q(m, say(m, "beast_body", "ask", "I can take a human shape in the dark. I will not pretend I am one.")),
    choices: [
      { id: "asIs", label: "As they are", cls: "accent",
        say: () => ({
          text: Q(m, say(m, "beast_body", "asis", "Don't flinch at the body. I am a person.")),
          choices: [
            { id: "tail", label: "Ask about the tail",
              say: () => ({
                text: Q(m, say(m, "beast_body", "tail", "Don't pull the tail unless you want me to bite.")),
                choices: [
                  { id: "bed", label: "Then the bunk", cls: "accent", say: () => finishAct(m, "sex") },
                  { id: "mouth", label: "Muzzle first", cls: "accent", say: () => finishAct(m, "kiss") },
                ],
              }) },
            { id: "knot", label: "Ask if they knot",
              say: () => ({
                text: Q(m, say(m, "beast_body", "knot", "Knot if you stay in. Say now if you don't want that.")),
                choices: [
                  { id: "yes", label: "Stay in", cls: "accent", say: () => finishAct(m, "sex") },
                  { id: "no", label: "Not that", say: () => actMenu(m, say(m, "beast_after", "no", "Kiss the muzzle after.")) },
                ],
              }) },
            { id: "bed", label: "Take them to bed", cls: "accent", say: () => finishAct(m, "sex") },
          ],
        }) },
      { id: "soft", label: "Go slow", fx: { trust: 2 },
        say: () => actMenu(m, say(m, "beast_after", "slow", "Don't pet me like a mascot. Kiss me like a lover.")) },
      { id: "no", label: "Not tonight", say: () => ({ text: Q(m, say(m, "miss", "xno", "Don't flinch now — or do, and leave.")), choices: [] }) },
    ],
  };
}

export function adultTopics(m) {
  if (!packOn() || !m || m.robot) return [];
  loadSocial();
  const topics = [];
  topics.push({
    id: "adultCabin",
    label: together(m) ? "The cabin" : "Ask them somewhere private",
    cls: "accent",
    tier: together(m) ? 0 : 1,
    cooldown: 0,
    when: () => social.romance !== "off",
    say: cabinOpen,
  });
  if (sim.ship?.dockedAt) {
    topics.push({
      id: "adultPad",
      label: "An hour on the pad",
      cls: "accent",
      tier: 0,
      cooldown: 1,
      say: padOpen,
    });
  }
  if (together(m) || m.captive || m.collar || m.status === "captive") {
    topics.push({
      id: "adultCollar",
      label: "The collar stays on",
      tier: 1,
      cooldown: 1,
      say: collarOpen,
    });
  }
  if (together(m) && beastRace(m)) {
    topics.push({
      id: "adultXeno",
      label: "The body they have",
      cls: "accent",
      tier: 0,
      cooldown: 1,
      say: xenoOpen,
    });
  }
  if (together(m) && social.family) {
    topics.push({
      id: "adultFamily",
      label: "A child on this hull",
      cls: "accent",
      tier: 0,
      cooldown: 1,
      say: familyPlanNode,
    });
  }
  return topics;
}
