/* 18+ scene text. Not imported by core. */
import { adultLine, flavorBags } from "./voice.js";

function first(p) {
  return String(p?.name ?? "they").split(" ")[0];
}
function he(p) {
  return p.pronouns?.subj ?? (p.gender === "woman" ? "she" : p.gender === "man" ? "he" : "they");
}
function him(p) {
  return p.pronouns?.obj ?? (p.gender === "woman" ? "her" : p.gender === "man" ? "him" : "them");
}
function his(p) {
  return p.pronouns?.pos ?? (p.gender === "woman" ? "her" : p.gender === "man" ? "his" : "their");
}
function bodyOf(p) {
  if (p.gender === "woman") return { cock: false, cunt: true, hole: "cunt" };
  if (p.gender === "man") return { cock: true, cunt: false, hole: "ass" };
  const seed = String(p.id ?? "x");
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  const cock = Boolean(h & 1);
  const cunt = Boolean(h & 2) || !cock;
  return { cock, cunt, hole: cunt ? "cunt" : "ass" };
}

export function scene(a, b, actId = "sex") {
  const A = first(a), B = first(b);
  const ba = bodyOf(a), bb = bodyOf(b);
  if (actId === "kiss") {
    return `${A} pins ${B} to the bulkhead and kisses ${him(b)} like the watch can wait. ${he(b)} fists ${his(a)} jacket and does not let go.`;
  }
  if (actId === "hands") {
    return bb.cock
      ? `The hatch dogs. ${A} gets a hand down ${B}'s suit and strokes ${him(b)} until ${he(b)} comes against ${his(a)} palm, quiet on purpose.`
      : `The hatch dogs. ${A} puts two fingers between ${B}'s thighs and works ${him(b)} until ${he(b)} shakes and bites ${his(a)} shoulder.`;
  }
  if (actId === "oral") {
    return bb.cock
      ? `${A} takes ${B}'s cock in ${his(a)} mouth on the bunk and does not stop until ${B} spills and has to hold the rail.`
      : `${A} puts ${B} on the bunk and eats ${him(b)} out until ${he(b)} comes on ${his(a)} tongue and then does it again.`;
  }
  let pent;
  if (ba.cock && bb.cunt) pent = `${A} fucks ${B} slow, then all the way, cock in ${his(b)} cunt, bunk frame knocking the wall.`;
  else if (bb.cock && ba.cunt) pent = `${B} buries ${his(b)} cock in ${A} and stays there when they finish.`;
  else if (ba.cock && bb.cock) pent = `${A} oils up and fucks ${B}'s ass while ${B} strokes ${him(b)}self off on the same sheet.`;
  else if (ba.cunt && bb.cunt) pent = `They grind until both of them shake, strap and hands, no one keeping score.`;
  else pent = `${A} takes ${B} against the locker until neither of them can stand a watch.`;
  const trying = actId === "tryChild" ? ` They say it: they want a child on this hull.` : "";
  const bag = actId === "kiss" ? "kiss" : actId === "hands" ? "hands" : actId === "oral" ? "oral" : actId === "tryChild" ? "tryChild" : "sex";
  const quoted = adultLine(flavorBags(b, bag), `${a?.id}:${b?.id}:${actId}`, "");
  const narr = adultLine("narr", `${a?.id}:${b?.id}:n`, "");
  return `Door dogged. ${pent}${trying} ${narr} ${B}: "${quoted}"`;
}

export function pickAct(rng = Math.random, trying = false) {
  if (trying && rng() < 0.35) return "tryChild";
  if (rng() < 0.55) return "sex";
  if (rng() < 0.5) return "oral";
  if (rng() < 0.5) return "hands";
  return "kiss";
}
