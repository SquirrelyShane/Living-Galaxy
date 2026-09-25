/* LIVING GALAXY — 0.3.54: the Galactic Database.
 *
 * Reported: everybody had similar names, or the same names. Pinned here:
 *   no hall candidate is offered at two ports (37% were, on 0.3.53);
 *   no two people on file share a full name, across halls, captains, hull
 *   crews, pilots and children;
 *   nobody in one room — a hall, a hull's crew, siblings — has a given name
 *   that looks like a roommate's;
 *   a person already on file keeps their name when regenerated;
 *   a paid-off hand lives where you left them;
 *   the number is stable, the census and chronicle read true, death sticks,
 *   the first filing wins a merge, and the catalogue survives a reload.
 *
 *   node --import ./test/three-register.mjs test/gdb.test.mjs
 */
const store = new Map();
globalThis.localStorage = { getItem: (k) => store.get(k) ?? null, setItem: (k, v) => store.set(k, String(v)), removeItem: (k) => store.delete(k) };

import { sim, launchSim, tickSim } from "../js/sim.js";
import { makePilot } from "../js/pilot.js";
import { stations } from "../js/stations.js";
import { crew, hireCrew, stationRoster, dismissCrew } from "../js/crew.js";
import { traffic } from "../js/npc/traffic.js";
import { crewOf } from "../js/npc/npccrew.js";
import { cradle, generateNPC } from "../js/npc/cradle.js";
import { personName, nameRng } from "../js/names.js";
import * as G from "../js/gdb.js";

let pass = 0, fail = 0;
const ok = (c, m) => { if (c) { pass++; if (process.env.V) console.log("  ok", m); } else { fail++; console.error("  FAIL", m); } };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/* ---- 1. the pieces -------------------------------------------------------------- */
{
  ok(G.looksAlike("Thregruka Vane", "Thregargh") && G.looksAlike("Mywel", "Syywel") && !G.looksAlike("Petra", "Callum"), "look-alikes: the same opening, or the same ending");
  ok(G.looksAlike("Z'hesskiisaa", "Zhessa") && !G.looksAlike("Ash", "Asha"), "apostrophes do not hide a look-alike; short names are left alone");
  ok(/^GDB-[0-9A-Z]{6}$/.test(G.catalogueNo("npc_abc")) && G.catalogueNo("npc_abc") === G.catalogueNo("npc_abc") && G.catalogueNo("npc_abc") !== G.catalogueNo("npc_abd"), `a catalogue number is stable and theirs (${G.catalogueNo("npc_abc")})`);
  const a = generateNPC("gdb-test:a", { raceId: "haask" });
  G.file(a, { kind: "hall" });
  const b = generateNPC("gdb-test:b", { raceId: "haask" });
  b.name = a.name;   // force the clash
  const b1 = G.uniqueName(b), b2 = G.uniqueName(b);
  ok(b1 !== a.name && b1 === b2, `a taken name is re-forged, the same way every time (${a.name} → ${b1})`);
  const fam = a.name.split(" ").slice(1).join(" ");
  ok(!fam || b1.endsWith(fam), "and only the given name changes — the family is theirs");
}

/* ---- 2. a sky ---------------------------------------------------------------------- */
makePilot("GDB", "terran", "mining", null);
launchSim("GdbTest", "sol");
sim.phase = "play";
for (let i = 0; i < 240; i++) tickSim(1 / 60);
const ship = sim.ship;
ship.credits = 900000;

const halls = [];
for (const st of stations) for (let r = 0; r < 3; r++) halls.push({ st, r, list: stationRoster(st, r, sim.skySeed) });
for (const v of traffic) crewOf(v);
{
  const at = new Map(); let shared = 0, total = 0;
  for (const h of halls) for (const c of h.list) { total++; if (at.has(c.id) && at.get(c.id) !== h.st.id) shared++; else at.set(c.id, h.st.id); }
  ok(shared === 0, `no hall candidate is offered at two ports (${shared} of ${total})`);
  const alikeIn = (list) => list.some((x, i) => list.slice(i + 1).some((y) => G.looksAlike(x.name, y.name)));
  ok(!halls.some((h) => alikeIn(h.list)), `no hall has two names that look alike (${halls.length} halls)`);
  const crews = traffic.filter((v) => v.crewList?.length > 1).map((v) => v.crewList);
  ok(crews.length > 20 && !crews.some(alikeIn), `no hull crew has two names that look alike (${crews.length} crews)`);
  const c = G.census({ sky: sim.skySeed });
  ok(c.total > 300 && c.sharedNames === 0, `${c.total} people on file in this sky, and no two share a name`);
  ok(c.byKind.captain >= 40 && c.byKind.crew >= 100 && c.byKind.hall >= 40, `captains ${c.byKind.captain}, hull crews ${c.byKind.crew}, hall hands ${c.byKind.hall}`);
  ok(c.peoples >= 10, `${c.peoples} peoples`);
  const names = G.everyone().map((e) => e.name.toLowerCase());
  ok(new Set(names).size === names.length, "one name, one person — across the whole catalogue");
}

/* ---- 3. identity stands ------------------------------------------------------------- */
{
  const cap = cradle.get(traffic[0].recId);
  const was = cap.name;
  const again = generateNPC(cap.seed, {});
  again.name = "Somebody Else";
  const back = G.file(again, { kind: "captain" });
  ok(back.name === was && cradle.get(cap.id).name === was, `a person on file keeps their name when made again (${was})`);
  const lite = traffic.find((v) => v.crewList?.length)?.crewList[0];
  const twin = { ...lite, name: "Not Them" };
  G.catalogue(twin, { kind: "crew" });
  ok(twin.name === lite.name, "…and so does somebody who only had a light entry");
}

/* ---- 4. the hall and your crew -------------------------------------------------------- */
{
  const home = stations.find((s) => !s.hostile);
  ship.dockedAt = home.id;
  const hall = stationRoster(home, 7, sim.skySeed);
  hireCrew(hall[0], ship, 12);
  hireCrew(hall[1], ship, 12);
  const next = stationRoster(home, 8, sim.skySeed);
  const clash = next.filter((c) => !crew.aboard.some((m) => m.id === c.id) && crew.aboard.some((m) => G.looksAlike(m.name, c.name)));
  ok(clash.length === 0, "a new hall does not offer a name that looks like one of your crew's");
  const m = crew.aboard[0];
  const other = stations.find((s) => !s.hostile && s.id !== home.id);
  ship.dockedAt = other.id;
  dismissCrew(m.id);
  ok(cradle.get(m.id).station === other.id && cradle.get(m.id).status === "dismissed", "a paid-off hand lives where you left them");
  let seenAtOther = false, seenAtHome = false;
  for (let r = 20; r < 40; r++) {
    if (stationRoster(other, r, sim.skySeed).some((c) => c.id === m.id)) seenAtOther = true;
    if (stationRoster(home, r, sim.skySeed).some((c) => c.id === m.id)) seenAtHome = true;
  }
  ok(seenAtOther, `and turns up in that port's hall again (${other.name})`);
  void seenAtHome;   // a drifter may still wander into another port's hall — that is allowed
  ship.dockedAt = null;
}

/* ---- 5. reading it ---------------------------------------------------------------------- */
{
  const someone = G.everyone().find((e) => e.full && e.kind === "hall");
  const r = G.search(someone.name.split(" ")[0]);
  ok(r.rows.some((e) => e.id === someone.id), `search finds them by name (${someone.name})`);
  ok(G.search(someone.no).rows.some((e) => e.id === someone.id), `and by number (${someone.no})`);
  ok(G.search("", { kind: "captain", limit: 5 }).rows.every((e) => e.kind === "captain"), "and filters by kind");
  const d0 = G.census().dead;
  G.markDead(someone.id, "a test");
  ok(G.census().dead === d0 + 1 && G.entryOf(someone.id).status === "dead", "death is filed");
  const lite = G.everyone().find((e) => !e.full && e.status !== "dead");
  G.markDead(lite.id, "lost with the hull");
  ok(G.chronicle(400).some((l) => l.id === lite.id && /lost with the hull/.test(l.text)), "and written in the chronicle");
  ok(G.chronicle(5).length === 5 && G.chronicle(5).every((l, i, a) => i === 0 || a[i - 1].at >= l.at), "the chronicle reads newest first");
}

/* ---- 6. merging, and a reload --------------------------------------------------------------- */
{
  const e = G.everyone().find((x) => !x.full);
  const n = G.mergeEntries([{ ...e, name: "Later Name", at: (e.at ?? 0) + 1000 }]);
  ok(n === 0 && G.entryOf(e.id).name === e.name, "a later filing from another device does not rename anybody");
  G.mergeEntries([{ id: "remote-only", name: "Remote Person", raceId: "sef", kind: "crew", at: 5, seen: 5, status: "alive" }]);
  ok(G.entryOf("remote-only")?.name === "Remote Person", "somebody only another device met is catalogued here too");
  await sleep(1100);   // the debounced write
  const raw = JSON.parse(store.get("lgaa.gdb.v1") ?? "{}");
  ok(raw.entries?.some((x) => x.id === "remote-only") && raw.entries.length > 100, `the catalogue is written to the device (${raw.entries?.length} light entries)`);
}

/* ---- 7. the forge ------------------------------------------------------------------------------ */
{
  const rnd = nameRng("flourish");
  const haask = Array.from({ length: 600 }, (_, i) => personName("haask", ["man", "woman", "nonbinary"][i % 3], rnd).first);
  ok(haask.every((n) => (n.match(/([aeiouy])\1/gi) ?? []).length <= 1 && (n.match(/'/g) ?? []).length <= 1), `a Haask name carries one doubled vowel and one mark at most (${haask.slice(0, 5).join(", ")})`);
  const all = ["terran", "korrash", "haask", "veyd", "eridian", "brann"].flatMap((r) => Array.from({ length: 300 }, (_, i) => personName(r, ["man", "woman"][i % 2], rnd)));
  ok(all.every((p) => p.first.replace(/'/g, "").length <= 10), "no given name runs past ten letters");
  ok(all.concat(haask.map((first) => ({ first }))).every((p) => !/([a-z])\1\1/i.test(p.first)), "and none has the same letter three times running");
  const echo = all.filter((p) => p.last && p.first.slice(0, 3).toLowerCase() === p.last.replace(/^(of the |of )/, "").slice(0, 3).toLowerCase());
  ok(echo.length <= all.length * 0.005, `a family name rarely echoes the given name (${echo.length}/${all.length})`);
}

console.log(`gdb: ${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
