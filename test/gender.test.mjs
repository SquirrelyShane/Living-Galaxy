/* LIVING GALAXY — the sky's gender split, and whether anything on screen says so.
 *
 * an earlier patch fixed the ROLL and it still played as male-dominant, because a measured
 * 46/48/6 is invisible when the only two places in the UI that print a pronoun
 * are the hiring hall and the talk sub-line, and every other person is a name
 * in an invented tongue with nothing beside it. This suite measures both
 * halves: the ratio, and the legibility.
 *
 *   node --import ./test/three-register.mjs test/gender.test.mjs
 */
import { generateNPC, ensureIdentity, PRONOUNS, GENDERS } from "../js/npc/cradle.js";
import { genomeIdentity, SEX_SPLIT, NONBINARY_SHARE, createSpacer } from "../js/genome/spacer.js";
import { personName, givenName } from "../js/names.js";
import { LEXICONS } from "../js/data/lexicons.js";
import { RACES } from "../js/races.js";
import { genderMark, pronounOf } from "../js/crew.js";

let pass = 0, fail = 0;
const ok = (c, m) => { if (c) pass++; else { fail++; console.error("  FAIL", m); } };

/* ---- the ratio ------------------------------------------------------------ */
const N = 6000;
const tally = { woman: 0, man: 0, nonbinary: 0 };
const byRace = {};
for (let i = 0; i < N; i++) {
  const r = generateNPC(`gender:${i}`);
  tally[r.gender]++;
  (byRace[r.raceId] ??= { woman: 0, man: 0, nonbinary: 0 })[r.gender]++;
}
const pc = (v) => v / N;
console.log(`  sky: ${(pc(tally.woman) * 100).toFixed(1)}% women · ${(pc(tally.man) * 100).toFixed(1)}% men · ${(pc(tally.nonbinary) * 100).toFixed(1)}% nonbinary`);
ok(pc(tally.woman) > 0.5 && pc(tally.woman) < 0.6, `women are the majority of the sky (${(pc(tally.woman) * 100).toFixed(1)}%)`);
ok(pc(tally.man) > 0.35 && pc(tally.man) < 0.46, `men are a large minority, not a token one (${(pc(tally.man) * 100).toFixed(1)}%)`);
ok(pc(tally.nonbinary) > 0.03 && pc(tally.nonbinary) < 0.09, `nonbinary holds its share (${(pc(tally.nonbinary) * 100).toFixed(1)}%)`);
ok(pc(tally.woman) > pc(tally.man), "…and there are more women than men, which is the ask");

/* no single race is a men-only crew list */
const shares = Object.entries(byRace).map(([id, t]) => {
  const n = t.woman + t.man + t.nonbinary;
  return { id, w: t.woman / n, n };
}).sort((a, b) => a.w - b.w);
console.log(`  by race: lowest ${shares[0].id} ${(shares[0].w * 100).toFixed(0)}% · highest ${shares.at(-1).id} ${(shares.at(-1).w * 100).toFixed(0)}%`);
ok(shares[0].w > 0.44, `no race skews male (lowest is ${shares[0].id} at ${(shares[0].w * 100).toFixed(0)}% women)`);
ok(shares.length >= 12, `every race sampled (${shares.length})`);

/* ---- determinism: the same person comes back the same person -------------- */
{
  const a = generateNPC("stable:1"), b = generateNPC("stable:1");
  ok(a.gender === b.gender && a.name === b.name && a.sex === b.sex, "the same seed is the same person");
  const g = createSpacer("stable:1", "terran");
  ok(genomeIdentity(g).gender === genomeIdentity(g).gender, "identity is read, not rolled");
}

/* ---- the name has to carry it too ---------------------------------------- */
{
  /* the ending set is what a player actually reads a name's gender off, so
   * measure how often a woman's name draws from the feminine set rather than
   * the neutral one — at 18% neutral the roster defaulted male to the eye */
  let neutralish = 0;
  const M = 3000;
  for (let i = 0; i < M; i++) {
    const lex = LEXICONS.terran;
    const rnd = mulberry(`n:${i}`);
    const fem = givenName(lex, "woman", rnd);
    const neu = new Set(lex.given?.n ?? []);
    if ([...neu].some((e) => fem.toLowerCase().endsWith(String(e).toLowerCase()))) neutralish++;
  }
  const share = neutralish / M;
  console.log(`  terran women's names taking a neutral ending: ${(share * 100).toFixed(1)}%`);
  ok(share < 0.22, `a woman's name usually reads as one (${(share * 100).toFixed(1)}% neutral endings)`);
}

function mulberry(seedStr) {
  let n = 0;
  const s0 = String(seedStr);
  for (let i = 0; i < s0.length; i++) n = Math.imul(n ^ s0.charCodeAt(i), 2654435761) >>> 0;
  let s = n || 7;
  return () => { s |= 0; s = (s + 0x6d2b79f5) | 0; let t = Math.imul(s ^ (s >>> 15), 1 | s); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}

/* ---- the mark: one helper, and it works on every shape a person takes ----- */
{
  const w = generateNPC("mark:w");
  ensureIdentity(w);
  ok(pronounOf(w) === `${w.pronouns.subj}/${w.pronouns.obj}`, "pronounOf reads the record");
  ok(genderMark(w).startsWith(" · "), "genderMark is a suffix you can concatenate");
  ok(genderMark(null) === "" && pronounOf(undefined) === "", "and it is silent on a shape with no pronouns, never a placeholder");
  for (const g of GENDERS) ok(PRONOUNS[g]?.subj && PRONOUNS[g]?.obj, `${g} has a pronoun set`);
}

/* ---- captains carry it onto the hull, so the directory can print it ------- */
{
  const { buildRoster, captainLine } = await import("../js/npc/traffic.js");
  const { launchSim, sim } = await import("../js/sim.js");
  const { makePilot } = await import("../js/pilot.js");
  makePilot("Dir", "terran", "general", null);
  launchSim("GenderTest", "sol");
  const { traffic } = await import("../js/npc/traffic.js");
  const withPronouns = traffic.filter((n) => n.captainPronouns).length;
  ok(traffic.length > 10, `a roster exists (${traffic.length} hulls)`);
  ok(withPronouns === traffic.length, `every captain on the board carries pronouns (${withPronouns}/${traffic.length})`);
  const women = traffic.filter((n) => n.captainGender === "woman").length;
  console.log(`  captains in the sky: ${women}/${traffic.length} women`);
  ok(women / traffic.length > 0.38, `and the captains are not a men's club (${Math.round((women / traffic.length) * 100)}% women)`);
  const line = captainLine(traffic[0]);
  ok(/ · (she|he|they)\//.test(line), `the directory line names a person and says who they are (${line})`);
}

console.log(`gender: ${pass} passed, ${fail} failed`);
if (fail) process.exit(1);
