/* LIVING GALAXY — name reuse, measured.
 *
 *   node --import ./test/three-register.mjs test/naming.test.mjs
 *
 * Reported: ports and people repeat their names. Both halves were true and
 * both were arithmetic rather than opinion.
 *
 *   Ports came from 5 sector prefixes x 7 suffixes = 35 per sector, 175 in
 *   the whole game. Measured: 42% of ports across twelve systems carried a
 *   name another port also had, and one system in five had a duplicate inside
 *   itself — two ports on the same chart, same name.
 *
 *   Terran people drew a curated given name 62% of the time from a pool of
 *   122, and a surname from a flat list of 65. Over three thousand: "Piotr"
 *   37 times, 65 distinct surnames. A vessel's callsign is built from its
 *   captain's surname, so the contact board repeated with them.
 *
 * What this suite pins is the fix and, as much as it can, the things the fix
 * was not allowed to break: the alien tongues, the deliberate family shapes,
 * and — the one that actually bit — the world itself. A name is not allowed
 * to move a station.
 */

import { stationName, openSkyNames, reserveNames, portNameSpace, HUMAN_LAST, HUMAN_GIVEN_M, HUMAN_GIVEN_F } from "../js/naming.js";
import { personName, offensive } from "../js/names.js";
import { LEXICONS } from "../js/data/lexicons.js";

let pass = 0, fail = 0;
const ok = (c, m) => { if (c) pass++; else { fail++; console.error("  FAIL", m); } };
function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const SECTORS = ["military", "industrial", "civilian", "agricultural", "pirate"];

/* ---- 1. the port name space ---------------------------------------------- */
{
  const space = portNameSpace();
  ok(space.total > 5000, `the port name space is thousands, not dozens (${space.total}, was 175)`);
  ok(space.suffixes >= 18, `the suffix list grew (${space.suffixes}, was 7)`);
}

/* ---- 2. no two ports in one sky share a name ----------------------------- */
{
  let dupSystems = 0, ports = 0;
  const SKIES = 400, PER = 10;
  for (let s = 0; s < SKIES; s++) {
    openSkyNames(`sky${s}`);
    const names = [];
    for (let i = 0; i < PER; i++) names.push(stationName(SECTORS[i % SECTORS.length]));
    ports += names.length;
    if (new Set(names.map((n) => n.toLowerCase())).size !== names.length) dupSystems++;
  }
  ok(dupSystems === 0, `no system contains two ports with one name (${dupSystems} of ${SKIES}, ${ports} ports; was one system in five)`);
}

/* ---- 3. …and they do not repeat much across skies either ----------------- */
{
  const all = [];
  for (let s = 0; s < 40; s++) {
    openSkyNames(`wide${s}`);
    for (let i = 0; i < 10; i++) all.push(stationName(SECTORS[i % SECTORS.length]));
  }
  const counts = new Map();
  for (const n of all) counts.set(n, (counts.get(n) ?? 0) + 1);
  const shared = [...counts.values()].filter((c) => c > 1).reduce((a, c) => a + c, 0);
  const pct = shared / all.length * 100;
  ok(pct < 12, `across 40 systems only ${pct.toFixed(0)}% of ports share a name with another (${all.length} ports; was 42%)`);
}

/* ---- 4. a port still says what kind of place it is ------------------------ */
{
  /* the sector word is the anchor and the whole reason this did not just
   * become a generic name generator */
  const ANCHOR = {
    military: /Bastion|Picket|Redoubt|Muster|Garrison/,
    industrial: /Forge|Smelt|Yard|Kiln|Foundry/,
    agricultural: /Grange|Vat|Furrow|Harvest|Green/,
    pirate: /Hookfall|Blackreach|Sump|The Nail|Cutter's Rest/,
  };
  for (const [sector, re] of Object.entries(ANCHOR)) {
    openSkyNames(`anchor:${sector}`);
    const names = Array.from({ length: 200 }, () => stationName(sector));
    const anchored = names.filter((n) => re.test(n)).length;
    const floor = sector === "pirate" ? 0.95 : 0.6;
    ok(anchored / names.length >= floor, `a ${sector} port still reads as one (${Math.round(anchored / names.length * 100)}% carry a sector word)`);
  }
  /* and no "Ember The Nail Terminal" — a word that is already a phrase does
   * not take an adjective */
  openSkyNames("phrase");
  const bad = Array.from({ length: 400 }, () => stationName("pirate")).filter((n) => /\S+\s+(The Nail|Cutter's Rest)/.test(n));
  ok(bad.length === 0, `sector words that are already phrases are left alone (${bad.length} malformed${bad.length ? `: ${bad[0]}` : ""})`);
}

/* ---- 5. naming a port does not move it ----------------------------------- */
{
  /* The first cut of this drew from the station builder's own generator a
   * variable number of times, which shifted every later draw: Sol quietly
   * went from eight ports to eleven and five suites failed, none of them
   * about names. stationName() must cost the caller's generator nothing. */
  openSkyNames("cost");
  const rnd = mulberry32(0x1234);
  const before = Array.from({ length: 5 }, () => rnd());
  const rnd2 = mulberry32(0x1234);
  for (let i = 0; i < 20; i++) stationName(SECTORS[i % SECTORS.length]);
  const after = Array.from({ length: 5 }, () => rnd2());
  ok(before.every((v, i) => v === after[i]), "naming twenty ports draws nothing from the caller's generator");
}

/* ---- 6. the same sky names the same ports -------------------------------- */
{
  const run = () => { openSkyNames("repeat"); return Array.from({ length: 12 }, (_, i) => stationName(SECTORS[i % SECTORS.length])); };
  const a = run(), b = run();
  ok(a.every((n, i) => n === b[i]), "the same sky gets the same ports twice");
  openSkyNames("other");
  const c = Array.from({ length: 12 }, (_, i) => stationName(SECTORS[i % SECTORS.length]));
  ok(c.some((n, i) => n !== a[i]), "a different sky gets different ports");
}

/* ---- 7. a reserved name is not handed out -------------------------------- */
{
  openSkyNames("reserve");
  const taken = Array.from({ length: 30 }, (_, i) => stationName(SECTORS[i % SECTORS.length]));
  openSkyNames("reserve");
  reserveNames(taken);
  const next = Array.from({ length: 30 }, (_, i) => stationName(SECTORS[i % SECTORS.length]));
  const clash = next.filter((n) => taken.some((t) => t.toLowerCase() === n.toLowerCase()));
  ok(clash.length === 0, `a reserved name is never issued (${clash.length} clashes)`);
}

/* ---- 8. the human pools ---------------------------------------------------*/
{
  ok(HUMAN_LAST.length >= 7000, `the surname pool is thousands (${HUMAN_LAST.length}, terran had 65)`);
  ok(HUMAN_GIVEN_M.length > 1000 && HUMAN_GIVEN_F.length > 4000, `both first-name pools are whole (${HUMAN_GIVEN_M.length} m, ${HUMAN_GIVEN_F.length} f)`);
  ok(new Set(HUMAN_LAST).size === HUMAN_LAST.length, "the surname pool has no duplicates in it");

  /* the pools are pre-filtered, so the forge's own check never has to fire on
   * one at runtime */
  const dirty = [...HUMAN_LAST, ...HUMAN_GIVEN_M, ...HUMAN_GIVEN_F]
    .filter((n) => String(n).split(/[^A-Za-z']+/).some((w) => w && offensive(w)));
  ok(dirty.length === 0, `every vendored name passes the forge's own filter (${dirty.length} would not${dirty.length ? `: ${dirty.slice(0, 3)}` : ""})`);

  /* alphabetical stride, not a head: the sample must span the alphabet */
  const letters = new Set(HUMAN_LAST.map((n) => n[0].toUpperCase()));
  ok(letters.size >= 20, `the trimmed surnames span the alphabet (${letters.size} initials, a head-trim would give ~1)`);
}

/* ---- 9. terran people stopped repeating ---------------------------------- */
{
  const draw = (race, n = 3000) => {
    const r = mulberry32(0x99);
    const out = { first: [], last: [] };
    for (let i = 0; i < n; i++) { const p = personName(race, i % 2 ? "man" : "woman", r); out.first.push(p.first); out.last.push(p.last); }
    return out;
  };
  const t = draw("terran");
  const firsts = new Set(t.first).size, lasts = new Set(t.last).size;
  ok(lasts > 1500, `terran surnames are no longer a short list (${lasts} in 3000; was 65)`);
  ok(firsts > 2000, `…nor are terran given names (${firsts} in 3000; was 1266)`);
  const counts = new Map();
  for (const f of t.first) counts.set(f, (counts.get(f) ?? 0) + 1);
  const worst = Math.max(...counts.values());
  ok(worst <= 15, `and no single given name dominates (commonest appears ${worst} times in 3000; "Piotr" was 37)`);

  /* the hand-picked core is still in there — it was chosen for a deliberately
   * global spread and losing it would flatten terran space */
  const CORE = LEXICONS.terran.given;
  const coreSet = new Set([...CORE.f, ...CORE.m, ...CORE.n]);
  const fromCore = t.first.filter((f) => coreSet.has(f)).length;
  ok(fromCore >= 20, `the hand-picked names still season the mix (${fromCore} draws in 3000)`);
}

/* ---- 10. the alien tongues were not touched ------------------------------ */
{
  /* ~2,900 distinct in 3,000 before this patch, and the patch must not have
   * gone near them */
  for (const race of ["korrash", "haask", "tsynth", "eridian", "sef"]) {
    const r = mulberry32(0x99);
    const out = [];
    for (let i = 0; i < 1500; i++) out.push(personName(race, i % 2 ? "man" : "woman", r).first);
    ok(new Set(out).size > 1300, `${race} first names are still their own (${new Set(out).size} in 1500)`);
    ok(!LEXICONS[race].wide, `${race} was given no human pool`);
  }

  /* and the deliberate family SHAPES are lore, not small pools to fill: the
   * veyd have no family name, the vantari have a 12x12 compound */
  ok(LEXICONS.veyd.family.kind === "none", "the veyd still have no family name");
  ok(LEXICONS.vantari.family.kind === "compound", "the vantari still carry a compound, not a surname list");
  ok(LEXICONS.tsynth.family.kind === "line", "t-synth still carry a foundry line and a number");
}

console.log(`naming: ${pass} passed, ${fail} failed`);
if (fail) process.exitCode = 1;
