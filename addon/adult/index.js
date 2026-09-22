import "./legacy-addon.js"; // Non-graphic family legacy conversations.
/* 18+ addon entry. Safe to delete this folder.
 * Registers beats, a house-rules chip, and private-night narration.
 */

import { addHook, addons } from "../../js/crew/hooks.js";
import { social, loadSocial, setSocial, playerAsPerson, adjustMorale, adjustTrust } from "../../js/family.js";
import { firstName, crewNote } from "../../js/crew.js";
import { scene, pickAct } from "./scenes.js";
import { adultLine, flavorBags } from "./voice.js";
import { sim } from "../../js/sim.js";
import { tryConceive, conceptionOdds, canHavePrivacy } from "../../js/crew/romance.js";
import { adultTopics } from "./trees.js";

addons.mark("adult", true);

const KEY = "lgaa-adult-pack";
function packOn() {
  try { return globalThis.localStorage?.getItem(KEY) !== "off"; } catch { return true; }
}
function setPack(on) {
  try { globalThis.localStorage?.setItem(KEY, on ? "on" : "off"); } catch { /* */ }
}

function together(m) {
  return m?.partner === "player";
}

addHook("beats", () => {
  if (!packOn()) return [];
  loadSocial();
  return [
    {
      id: "kiss",
      label: "Kiss them",
      kind: "romance",
      ms: 640,
      when: (m) => !m.robot && (together(m) || social.romance === "all"),
      steps: (m) => [
        `You step in close enough that ${firstName(m)} has to decide.`,
        `${firstName(m)}: "${together(m) ? "Finally." : "That's a question. Ask it with your mouth or don't."}"`,
        scene(playerAsPerson(), m, "kiss"),
        null,
      ],
      resolve(m, rng) {
        const ok = rng() < (together(m) ? 0.8 : 0.45);
        if (ok) {
          adjustTrust(m, 3); adjustMorale(m, 4);
          return { ok, trust: 0, morale: 0, line: `${firstName(m)}: "Do that again when the watch changes."`, tag: "+trust +morale" };
        }
        adjustTrust(m, -3); adjustMorale(m, -2);
        return { ok, line: `${firstName(m)}: "Not like that. Not here."`, tag: "−trust" };
      },
    },
    {
      id: "bed",
      label: "Take them to bed",
      kind: "romance",
      ms: 820,
      when: (m) => !m.robot && together(m) && packOn(),
      steps: (m) => [
        `You nod at the cabin. ${firstName(m)} dogs the hatch without being told.`,
        `${firstName(m)}: "If this is a briefing, you're overdressed."`,
        scene(playerAsPerson(), m, "sex"),
        null,
      ],
      resolve(m, rng) {
        const gate = canHavePrivacy(m, playerAsPerson());
        if (!gate.ok && gate.why !== "switched off in house rules") {
          adjustMorale(m, -2);
          return { ok: false, line: `${firstName(m)}: "${gate.why}."`, tag: "−morale" };
        }
        const ok = rng() < 0.72;
        if (ok) {
          adjustTrust(m, 5); adjustMorale(m, 8);
          let extra = "";
          if (social.family && !social.contraception) {
            const hit = tryConceive(m, playerAsPerson(), rng);
            if (hit.conceived) extra = ` ${firstName(hit.carrier)} may be carrying.`;
          }
          return { ok, line: `${firstName(m)}: "Stay. The board can wait."${extra}`, tag: "+trust +morale" };
        }
        adjustTrust(m, -2); adjustMorale(m, -5);
        return { ok, line: `${firstName(m)}: "That missed. Don't pretend it didn't."`, tag: "−morale" };
      },
    },
    {
      id: "tryChild",
      label: "Try for a child",
      kind: "romance",
      ms: 860,
      when: (m) => !m.robot && together(m) && social.family && packOn(),
      steps: (m) => [
        `You say it before the hatch shuts. A child. On this hull.`,
        `${firstName(m)}: "Say it again so I know you meant it."`,
        scene(playerAsPerson(), m, "tryChild"),
        null,
      ],
      resolve(m, rng) {
        const odds = conceptionOdds(m, playerAsPerson());
        const held = social.contraception;
        social.contraception = false;
        const hit = tryConceive(m, playerAsPerson(), rng);
        social.contraception = held;
        if (hit.conceived) {
          adjustTrust(m, 6); adjustMorale(m, 6);
          return { ok: true, line: `${firstName(m)}: "Then we did it on purpose." Chance was ${Math.round((odds.chance ?? 0) * 100)}%.`, tag: "expecting · +trust +morale" };
        }
        adjustTrust(m, 2); adjustMorale(m, 3);
        return { ok: false, line: `${firstName(m)}: "Not this time. We can try when the run is quieter."`, tag: "+trust · no conception" };
      },
    },
    {
      id: "collar",
      label: "The collar stays on",
      kind: "romance",
      ms: 780,
      when: (m) => !m.robot && packOn() && (together(m) || m.captive || m.collar || m.status === "captive"),
      steps: (m) => {
        const s = `${m.id}:sl:${Math.round(sim.time ?? 0)}`;
        return [
          adultLine("slave_open", s, "You came down here for this. Own it."),
          `${firstName(m)}: "${adultLine(flavorBags(m, "slave_do"), s + "1")}"`,
          scene(playerAsPerson(), m, "sex"),
          null,
        ];
      },
      resolve(m, rng) {
        const ok = rng() < 0.62;
        if (ok) {
          adjustTrust(m, 2); adjustMorale(m, 3);
          return { ok, line: `${firstName(m)}: "${adultLine("slave_after", m.id)}"`, tag: "+morale" };
        }
        adjustTrust(m, -6); adjustMorale(m, -4);
        return { ok, line: `${firstName(m)}: "${adultLine("slave_no", m.id)}"`, tag: "−trust −morale" };
      },
    },
    {
      id: "padHour",
      label: "An hour on the pad",
      kind: "romance",
      ms: 720,
      when: (m) => !m.robot && packOn() && Boolean(sim.ship?.dockedAt),
      steps: (m) => {
        const s = `${m.id}:pt:${Math.round(sim.time ?? 0)}`;
        return [
          adultLine("port_open", s, "Hour's a hundred. Cabin is cleaner than your lock."),
          `${firstName(m)}: "${adultLine(flavorBags(m, "port_do"), s + "1")}"`,
          scene(playerAsPerson(), m, "sex"),
          null,
        ];
      },
      resolve(m, rng) {
        if ((sim.ship?.credits ?? 0) < 100) {
          return { ok: false, line: `${firstName(m)}: "${adultLine("port_no", m.id + ":broke", "Pay first.")}"`, tag: "−" };
        }
        sim.ship.credits -= 100;
        const ok = rng() < 0.8;
        if (ok) {
          adjustMorale(m, 4);
          return { ok, line: `${firstName(m)}: "${adultLine("port_after", m.id)}"`, tag: "−100cr +morale" };
        }
        adjustMorale(m, -2);
        return { ok, line: `${firstName(m)}: "${adultLine("port_no", m.id)}"`, tag: "−100cr −morale" };
      },
    },
    {
      id: "xeno",
      label: "Ask for the body they have",
      kind: "romance",
      ms: 800,
      when: (m) => !m.robot && packOn() && together(m) && !["terran", "t-synth", "oberlin"].includes(m.raceId),
      steps: (m) => {
        const s = `${m.id}:xb:${Math.round(sim.time ?? 0)}`;
        return [
          adultLine("beast_body", s, "I can take a human shape in the dark. I will not pretend I am one."),
          `${firstName(m)}: "${adultLine(flavorBags(m, "beast_do"), s + "1")}"`,
          scene(playerAsPerson(), m, "sex"),
          null,
        ];
      },
      resolve(m, rng) {
        const ok = rng() < 0.74;
        if (ok) {
          adjustTrust(m, 5); adjustMorale(m, 7);
          return { ok, line: `${firstName(m)}: "${adultLine("beast_after", m.id)}"`, tag: "+trust +morale" };
        }
        adjustTrust(m, -3); adjustMorale(m, -3);
        return { ok, line: `${firstName(m)}: "${adultLine("miss", m.id)}"`, tag: "−trust −morale" };
      },
    },
  ];
});

addHook("talkTopics", (m) => (packOn() ? adultTopics(m) : []));

addHook("onPrivateNight", (a, b, res) => {
  if (!packOn()) return;
  const act = pickAct(Math.random, Boolean(social.family && !social.contraception));
  const text = scene(a, b, act);
  crewNote(text);
  if (res) res.scene = text;
});

addHook("houseRules", (rules, api) => {
  const doc = globalThis.document;
  if (!doc || !rules) return;
  const row = doc.createElement("div");
  row.className = "trow";
  const k = doc.createElement("div");
  k.className = "tk";
  k.textContent = "18+ scenes";
  const v = doc.createElement("div");
  v.className = "tv";
  v.textContent = "addon pack — delete addon/adult to remove";
  row.append(k, v);
  rules.append(row);
  const chips = doc.createElement("div");
  chips.className = "tgroup";
  const mk = (id, label) => {
    const b = doc.createElement("button");
    b.type = "button";
    b.className = "tchip" + ((id === "on") === packOn() ? " on" : "");
    b.textContent = label;
    b.addEventListener("click", () => {
      setPack(id === "on");
      if (id === "on") api.setSocial?.({ adult: true });
      for (const x of chips.querySelectorAll("button")) x.classList.toggle("on", x === b);
    });
    return b;
  };
  chips.append(mk("off", "OFF"), mk("on", "ON"));
  rules.append(chips);
});

console.info("[addon] adult pack loaded — delete addon/adult to strip 18+ content");
