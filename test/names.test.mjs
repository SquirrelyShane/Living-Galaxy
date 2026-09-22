/* Living Galaxy — the name forge.
 *
 * Variety is a number, not a vibe, so this suite measures it: how many
 * distinct names a tongue actually yields at scale, how often two people in
 * the same hiring hall share one, whether a race is still recognisable from
 * its names alone, and whether every word the forge ships is a word a person
 * could say. It also pins the things that are easy to break by accident —
 * the gender ratio, the seeded determinism, and the family-name shapes that
 * carry the lore.
 *
 *   node test/names.test.mjs
 */

import assert from "node:assert/strict";
import {
  nameRng, forgeWord, personName, givenName, familyName, familyOf, childFamily,
  worldName, moonName, rockName, beaconName, skyNaming, skyTongue, surveyYear, offensive,
} from "../js/names.js";
import { LEXICONS, TONGUES } from "../js/data/lexicons.js";

let pass = 0, fail = 0;
const t = async (name, fn) => {
  try { await fn(); pass++; console.log(`  ok  ${name}`); }
  catch (e) { fail++; console.log(`FAIL  ${name}\n      ${e.message}`); }
};

const RACES = Object.keys(LEXICONS);
const distinct = (arr) => new Set(arr).size;

/* ---- the assembler ------------------------------------------------------ */

console.log("\n-- assembler --");

await t("every tongue yields a sayable word, ten thousand times over", () => {
  const bad = [];
  for (const [id, lex] of Object.entries(LEXICONS)) {
    const rnd = nameRng(`say:${id}`);
    for (let i = 0; i < 700; i++) {
      const w = forgeWord(lex, rnd);
      if (!/^[A-Z]/.test(w)) bad.push(`${id}: "${w}" not capitalised`);
      if (!/[aeiouy]/i.test(w)) bad.push(`${id}: "${w}" has no vowel`);
      if (/[^a-z'æ]/i.test(w)) bad.push(`${id}: "${w}" has a stray character`);
      if (/[^aeiouy']{4,}/i.test(w)) bad.push(`${id}: "${w}" is four consonants deep`);
      if (w.length < 2 || w.length > 13) bad.push(`${id}: "${w}" is ${w.length} long`);
    }
  }
  assert.equal(bad.length, 0, bad.slice(0, 6).join("; "));
});

await t("sky tongues are sayable too", () => {
  const bad = [];
  TONGUES.forEach((lex, i) => {
    const rnd = nameRng(`tongue:${i}`);
    for (let k = 0; k < 500; k++) {
      const w = forgeWord(lex, rnd);
      if (!/[aeiouy]/i.test(w) || /[^aeiouy]{4,}/i.test(w) || w.length > 13) bad.push(`${i}: ${w}`);
    }
  });
  assert.equal(bad.length, 0, bad.slice(0, 6).join("; "));
});

await t("no tongue leans on its fallback", () => {
  /* forgeWord falls back to a one-syllable shape when twelve tries all get
   * rejected. If a tongue is doing that often, its phonotactics are too
   * tight and the variety claim is hollow. */
  const thin = [];
  for (const [id, lex] of Object.entries(LEXICONS)) {
    const rnd = nameRng(`thin:${id}`);
    const words = Array.from({ length: 400 }, () => forgeWord(lex, rnd, 2));
    const shortest = words.filter((w) => w.length <= 3).length;
    if (shortest > 60) thin.push(`${id}: ${shortest}/400 came out tiny`);
  }
  assert.equal(thin.length, 0, thin.join("; "));
});

await t("the same seed gives the same name on every device", () => {
  const a = Array.from({ length: 50 }, (_, i) => personName("korrash", "woman", nameRng(`det:${i}`)).full);
  const b = Array.from({ length: 50 }, (_, i) => personName("korrash", "woman", nameRng(`det:${i}`)).full);
  assert.deepEqual(a, b);
});

/* ---- how much variety, exactly ------------------------------------------ */

console.log("\n-- variety --");

await t("each race yields 4,000+ distinct full names in 5,000 draws", () => {
  const thin = [];
  for (const r of RACES) {
    const rnd = nameRng(`vary:${r}`);
    const names = Array.from({ length: 5000 }, () => personName(r, ["woman", "man", "nonbinary"][Math.floor(rnd() * 3)], rnd).full);
    const d = distinct(names);
    console.log(`      ${r.padEnd(10)} ${d} distinct / 5000`);
    if (d < 4000) thin.push(`${r}: ${d}`);
  }
  assert.equal(thin.length, 0, `thin pools: ${thin.join(", ")}`);
});

await t("a forty-hand hiring hall has no two people with the same name", () => {
  /* The number that actually matters: a duplicate the player can see. */
  let clashes = 0;
  const halls = 400;
  for (let h = 0; h < halls; h++) {
    const rnd = nameRng(`hall:${h}`);
    const names = Array.from({ length: 40 }, () => personName(RACES[Math.floor(rnd() * RACES.length)], ["woman", "man", "nonbinary"][Math.floor(rnd() * 3)], rnd).full);
    if (distinct(names) < names.length) clashes++;
  }
  console.log(`      ${clashes}/${halls} halls carried a duplicate`);
  assert.ok(clashes <= halls * 0.02, `${clashes} of ${halls} halls had a duplicate`);
});

await t("given names alone survive a forty-hand hall most of the time", () => {
  /* First names are what the crew panel shows, so they collide sooner than
   * full names do. This is the honest, harsher number. */
  let clashes = 0;
  const halls = 400;
  for (let h = 0; h < halls; h++) {
    const rnd = nameRng(`first:${h}`);
    const names = Array.from({ length: 40 }, () => personName(RACES[Math.floor(rnd() * RACES.length)], "woman", rnd).first);
    if (distinct(names) < names.length) clashes++;
  }
  console.log(`      ${clashes}/${halls} halls repeated a given name`);
  assert.ok(clashes <= halls * 0.3, `${clashes} of ${halls}`);
});

/* ---- a name tells you what somebody is ---------------------------------- */

console.log("\n-- tongues stay apart --");

await t("no two races share more than a sliver of their name space", () => {
  const sets = {};
  for (const r of RACES) {
    const rnd = nameRng(`overlap:${r}`);
    sets[r] = new Set(Array.from({ length: 2500 }, () => personName(r, "man", rnd).first));
  }
  const bad = [];
  for (let i = 0; i < RACES.length; i++) {
    for (let j = i + 1; j < RACES.length; j++) {
      const a = sets[RACES[i]], b = sets[RACES[j]];
      let shared = 0;
      for (const n of a) if (b.has(n)) shared++;
      const frac = shared / Math.min(a.size, b.size);
      if (frac > 0.12) bad.push(`${RACES[i]}/${RACES[j]} share ${(frac * 100).toFixed(0)}%`);
    }
  }
  /* terran and oberlin both draw on the curated human pool by design. */
  const allowed = new Set(["terran/oberlin"]);
  const real = bad.filter((b) => !allowed.has(b.split(" ")[0]));
  assert.equal(real.length, 0, real.join("; "));
});

await t("the family name carries the lore", () => {
  const rnd = nameRng("lore");
  /* Veyd have no family name at all. */
  for (let i = 0; i < 60; i++) assert.equal(familyOf(personName("veyd", "woman", rnd).full), "");
  /* Sef are named for a hull, not a house. */
  const sef = Array.from({ length: 40 }, () => personName("sef", "man", rnd).full);
  assert.ok(sef.every((n) => n.includes(" of the ")), sef[0]);
  /* T-Synth carry a foundry line and a number. */
  const syn = Array.from({ length: 40 }, () => personName("tsynth", "nonbinary", rnd).full);
  assert.ok(syn.every((n) => /-\d{4}$/.test(n)), syn[0]);
  /* Oberlin are an employer and a grade. */
  const ob = Array.from({ length: 40 }, () => personName("oberlin", "woman", rnd).full);
  assert.ok(ob.every((n) => n.split(" ").length >= 3), ob[0]);
  /* Korrash are two halves of a clan. */
  const ko = Array.from({ length: 40 }, () => personName("korrash", "man", rnd).full);
  assert.ok(ko.every((n) => familyOf(n).includes("-")), ko[0]);
});

await t("Brann children are named off a parent, not a surname", () => {
  const rnd = nameRng("brann-child");
  const sire = { name: "Halvard Torsson" };
  const carrier = { name: "Ingrid Skeisdottir" };
  const d = childFamily(sire, carrier, "woman", "brann", rnd);
  const s = childFamily(sire, carrier, "man", "brann", rnd);
  assert.ok(d.startsWith("Halvard"), d);
  assert.ok(/sdottir|sdatter/.test(d), d);
  assert.ok(s.startsWith("Halvard") && /sson|sen|sland/.test(s), s);
});

await t("every other race hands the family name straight down", () => {
  const rnd = nameRng("inherit");
  assert.equal(childFamily({ name: "Petra Voss" }, { name: "Mira Renn" }, "woman", "terran", rnd), "Voss");
  assert.equal(childFamily({ name: "Noil of the Sind Gate" }, null, "man", "sef", rnd), "of the Sind Gate");
  assert.equal(childFamily({ name: "Vyael" }, { name: "Leys" }, "woman", "veyd", rnd), "");
});

await t("familyOf does not mistake the last word for the family", () => {
  assert.equal(familyOf("Noil of the Sind Gate"), "of the Sind Gate");
  assert.equal(familyOf("Saskia Kestrel Charter"), "Kestrel Charter");
  assert.equal(familyOf("Vyael"), "");
  assert.equal(familyOf(""), "");
  assert.equal(familyOf(undefined), "");
});

/* ---- gender ------------------------------------------------------------- */

console.log("\n-- gender --");

await t("women's names stay readable as women's names", () => {
  /* earlier fix was that a sky which is half women should not read as a sky
   * of men. Endings carry that now, so the share of ambiguous draws is what
   * has to stay put — not too high, and not zero either. */
  const bad = [];
  for (const r of RACES) {
    const rnd = nameRng(`amb:${r}`);
    const f = Array.from({ length: 3000 }, () => givenName(LEXICONS[r], "woman", rnd));
    const m = new Set(Array.from({ length: 3000 }, () => givenName(LEXICONS[r], "man", rnd)));
    const shared = f.filter((n) => m.has(n)).length / f.length;
    if (shared > 0.34) bad.push(`${r}: ${(shared * 100).toFixed(0)}% of women's names also turn up as men's`);
  }
  assert.equal(bad.length, 0, bad.join("; "));
});

await t("nonbinary crew draw from the neutral endings every time", () => {
  const rnd = nameRng("nb");
  const nb = new Set(Array.from({ length: 2000 }, () => givenName(LEXICONS.terran, "nonbinary", rnd)));
  const women = new Set(Array.from({ length: 2000 }, () => givenName(LEXICONS.terran, "woman", rnd)));
  let overlap = 0;
  for (const n of nb) if (women.has(n)) overlap++;
  /* Some overlap is the point — the ambiguous share — but it is a share. */
  assert.ok(overlap / nb.size < 0.3, `${overlap}/${nb.size}`);
});

/* ---- worlds ------------------------------------------------------------- */

console.log("\n-- worlds --");

await t("a sky sounds like one place", () => {
  const a = skyTongue("alpha"), b = skyTongue("alpha"), c = skyTongue("bravo");
  assert.equal(a, b, "the same seed must pick the same tongue");
  assert.ok(TONGUES.includes(a));
  assert.ok(TONGUES.includes(c));
});

await t("registers are mixed, and designations stay the minority", () => {
  const counts = { spoken: 0, catalogue: 0, colonist: 0 };
  for (let s = 0; s < 300; s++) {
    const sky = skyNaming(`sky${s}`);
    const rnd = nameRng(`worlds${s}`);
    const used = new Set();
    const kinds = ["rocky", "rocky", "cloud", "terra", "rocky", "gas", "gas", "ice", "ice", "dwarf"];
    kinds.forEach((k, i) => {
      counts[worldName(sky, { kind: k, index: i, settled: k === "terra" && i % 2 === 0 }, rnd, used).register]++;
    });
  }
  const total = counts.spoken + counts.catalogue + counts.colonist;
  for (const k of Object.keys(counts)) console.log(`      ${k.padEnd(10)} ${(counts[k] / total * 100).toFixed(1)}%`);
  assert.ok(counts.catalogue / total < 0.4, `catalogue names are ${(counts.catalogue / total * 100).toFixed(0)}% of the chart`);
  assert.ok(counts.colonist / total > 0.05, "nobody ever settled anywhere");
  assert.ok(counts.spoken / total > 0.4, "hardly anything has a name");
});

await t("no two bodies in one sky share a name", () => {
  let clashes = 0;
  for (let s = 0; s < 400; s++) {
    const sky = skyNaming(`dup${s}`);
    const rnd = nameRng(`dup${s}`);
    const used = new Set([sky.star]);
    const names = [];
    for (let i = 0; i < 11; i++) {
      const w = worldName(sky, { kind: ["rocky", "terra", "gas", "ice", "dwarf"][i % 5], index: i }, rnd, used).name;
      names.push(w);
      for (let m = 0; m < 4; m++) names.push(moonName(w, m, sky, rnd, used));
    }
    if (distinct(names) < names.length) clashes++;
  }
  assert.equal(clashes, 0, `${clashes}/400 skies had a duplicate body name`);
});

await t("worlds are worth saying out loud", () => {
  const bad = [];
  for (let s = 0; s < 200; s++) {
    const sky = skyNaming(`say${s}`);
    const rnd = nameRng(`say${s}`);
    const used = new Set();
    for (let i = 0; i < 10; i++) {
      const { name, register } = worldName(sky, { kind: ["rocky", "terra", "gas", "ice", "dwarf"][i % 5], index: i }, rnd, used);
      if (register === "spoken" && name.length < 4) bad.push(name);
      if (name.length > 26) bad.push(name);
    }
  }
  assert.equal(bad.length, 0, bad.slice(0, 5).join(", "));
});

await t("moons read off their parent, and a designated parent numbers its moons", () => {
  const sky = skyNaming("moons");
  const rnd = nameRng("moons");
  const off = Array.from({ length: 200 }, (_, i) => moonName("Kesune", i % 5, sky, rnd, new Set()));
  assert.ok(off.filter((n) => n.includes("Kesune")).length > off.length * 0.5, "moons drifted away from their parent");
  const desig = Array.from({ length: 40 }, (_, i) => moonName("LX 5511 c", i % 5, sky, rnd, new Set()));
  assert.ok(desig.every((n) => n.startsWith("LX 5511 c ")), desig.find((n) => !n.startsWith("LX 5511 c ")));
});

await t("beacons do not all read the same", () => {
  const sky = skyNaming("beacons");
  const rnd = nameRng("beacons");
  const names = Array.from({ length: 400 }, (_, i) => beaconName(sky, i % 8, rnd));
  assert.ok(distinct(names) > 200, `${distinct(names)}/400`);
});

/* ---- rogue rocks -------------------------------------------------------- */

console.log("\n-- rogue rocks --");

await t("small rocks get a designation, huge ones usually get a name", () => {
  const rnd = nameRng("rocks");
  const y = surveyYear(rnd);
  const small = Array.from({ length: 300 }, (_, i) => rockName(i + 1, 180, rnd, y));
  assert.ok(small.every((n) => n.startsWith(String(y))), small.find((n) => !n.startsWith(String(y))));
  const huge = Array.from({ length: 300 }, (_, i) => rockName(i + 1, 900, rnd, y, new Set()));
  const named = huge.filter((n) => !n.startsWith(String(y))).length;
  console.log(`      ${named}/300 of the big ones earned a name`);
  assert.ok(named > 150, `${named}/300`);
});

await t("designations never collide within a sky", () => {
  const rnd = nameRng("desig");
  const y = surveyYear(rnd);
  const names = Array.from({ length: 800 }, (_, i) => rockName(i + 1, 100, rnd, y));
  assert.equal(distinct(names), names.length);
});

await t("a sky does not hold two rocks with the same spoken name", () => {
  for (let s = 0; s < 60; s++) {
    const rnd = nameRng(`sky-rock${s}`);
    const y = surveyYear(rnd);
    const taken = new Set();
    const spoken = [];
    for (let i = 1; i <= 120; i++) {
      const n = rockName(i, 900, rnd, y, taken);
      if (!n.startsWith(String(y))) spoken.push(n);
    }
    assert.equal(distinct(spoken), spoken.length, `sky ${s} repeated ${spoken.find((n, i) => spoken.indexOf(n) !== i)}`);
  }
});

await t("rock names carry real variety", () => {
  const rnd = nameRng("rockvary");
  const taken = new Set();
  const names = Array.from({ length: 3000 }, (_, i) => rockName(i + 1, 900, rnd, 2371, taken));
  const spoken = new Set(names.filter((n) => !/^\d{4} /.test(n)));
  console.log(`      ${spoken.size} distinct spoken rock names`);
  assert.ok(spoken.size > 300, `${spoken.size}`);
});

/* ---- nothing the player would rather not read --------------------------- */

console.log("\n-- the guard --");

await t("the guard catches what it is for, and spares what it is not", () => {
  assert.ok(offensive("Clitor"));
  assert.ok(offensive("Skanusdatter"));
  assert.ok(offensive("Frostwater"));      // "twat" sits inside it
  assert.ok(!offensive("Kassar"));         // "ass" is not at either edge
  assert.ok(!offensive("Titania"));
  assert.ok(!offensive("Petrosyan"));
  assert.ok(!offensive("Kirchner"));
});

await t("half a million names come out clean", () => {
  /* The forge draws from phonemes, so it will eventually draw something the
   * player would rather not read on a crew manifest. Checked per word — a
   * fragment that only exists because two names sit next to each other
   * ("Sera Petrosyan") is not something anybody sees. */
  const dirty = [];
  const check = (n) => { for (const w of String(n).split(/[^A-Za-z']+/)) if (w && offensive(w)) dirty.push(n); };
  for (const r of RACES) {
    const rnd = nameRng(`clean:${r}`);
    for (let i = 0; i < 12000; i++) check(personName(r, ["woman", "man", "nonbinary"][i % 3], rnd).full);
  }
  for (let s = 0; s < 1500; s++) {
    const sky = skyNaming(`clean${s}`);
    const rnd = nameRng(`clean${s}`);
    const used = new Set();
    const taken = new Set();
    check(sky.star);
    for (let i = 0; i < 10; i++) {
      const w = worldName(sky, { kind: ["rocky", "terra", "gas", "ice", "dwarf"][i % 5], index: i, settled: i === 3 }, rnd, used).name;
      check(w);
      for (let m = 0; m < 3; m++) check(moonName(w, m, sky, rnd, used));
      check(rockName(i + 1, 900, rnd, 2371, taken));
      check(beaconName(sky, i, rnd));
    }
  }
  assert.equal(dirty.length, 0, [...new Set(dirty)].slice(0, 6).join(", "));
});

/* ---- the sim still runs ------------------------------------------------- */

console.log("\n-- integration --");

await t("generateSystem names a whole sky without a collision", async () => {
  const { generateSystem } = await import("../js/generate.js");
  for (const seed of ["orion", "kesune", "drift-7", "vega", "a", "zzz"]) {
    const sys = generateSystem(seed);
    const names = sys.bodies.map((b) => b.name).concat(sys.beacons.map((b) => b.name));
    assert.equal(distinct(names), names.length, `${seed}: duplicate body name`);
    assert.ok(sys.name && sys.name.length >= 2, `${seed}: no star name`);
    assert.ok(sys.catalogue, `${seed}: no catalogue designation`);
    for (const n of names) assert.ok(n.length <= 30 && n.trim() === n, `${seed}: bad name "${n}"`);
  }
});

await t("the same seed gives the same sky twice", async () => {
  const { generateSystem } = await import("../js/generate.js");
  const a = generateSystem("repeatable").bodies.map((b) => b.name);
  const b = generateSystem("repeatable").bodies.map((b) => b.name);
  assert.deepEqual(a, b);
});

await t("Sol is untouched", async () => {
  const { generateSystem } = await import("../js/generate.js");
  const sol = generateSystem("");
  assert.equal(sol.name, "Sol");
  assert.ok(sol.bodies.some((b) => b.name === "Earth"), "Sol lost its worlds");
});

console.log(`\nnames: ${pass} passed, ${fail} failed`);
if (fail) process.exit(1);
