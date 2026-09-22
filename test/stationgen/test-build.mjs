/* Headless build harness. Needs a real three.js:
 *   THREE=/path/to/three.module.js node --import ./tools/register.mjs tools/test-build.mjs
 * Builds every archetype at every tier over several seeds and checks the
 * contract: determinism, manifest completeness, parts and materials resolve,
 * hangars present and big enough, placement rate, animation registry. */
import * as THREE from "three";
import { buildStation, releaseStation, randomConfig, ARCHETYPE_KEYS, TIER_KEYS, MODULES, PARTS, MATERIALS, ALLOYS, REQUIRED, HANGAR, MOUTHS, HANGAR_FORMS, STYLES, STYLES_ARCH, STYLE_KEYS, FORM_KEYS, tick, doctrineFor, manifestOf, stationBom, moduleParts } from "../../js/stationgen/index.js";

/* point-in-polygon for the aperture check */
const inside = (pt, poly) => { let c = false; for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) { const [xi, yi] = poly[i], [xj, yj] = poly[j]; if ((yi > pt[1]) !== (yj > pt[1]) && pt[0] < ((xj - xi) * (pt[1] - yi)) / (yj - yi) + xi) c = !c; } return c; };
const seenForms = new Set(), seenMouths = new Set(), seenAlloys = new Set(), seenBodies = new Set();

let pass = 0, fail = 0;
const ok = (c, m) => { if (c) pass++; else { fail++; console.error("  FAIL", m); } };

/* catalogue integrity */
for (const m of Object.values(MODULES)) {
  ok(m.size.length === 3 && m.size.every((v) => v > 0), `${m.id}: size`);
  ok(m.mount.length > 0, `${m.id}: mounts`);
  ok(m.zone >= 0 && m.zone <= 1, `${m.id}: zone`);
  ok(Object.keys(m.parts).length >= 3, `${m.id}: has parts`);
  for (const id of Object.keys(m.parts)) ok(PARTS[id], `${m.id}: part ${id} exists`);
}
for (const p of Object.values(PARTS)) {
  const sum = Object.values(p.bom).reduce((a, b) => a + b, 0);
  ok(Math.abs(sum - 1) < 0.02, `${p.id}: bom shares sum to 1 (${sum.toFixed(2)})`);
  for (const m of Object.keys(p.bom)) ok(MATERIALS[m], `${p.id}: material ${m} exists`);
}
const wanted = ["ls.core", "ls.air", "ls.chem", "wt.plant", "ag.farm", "sc.rnd", "mf.shipyard", "mf.industrial", "cg.trading", "cmd.deck", "hb.brig", "hb.mess", "hb.kitchen", "hb.quarters_1", "hb.quarters_2", "hb.quarters_3", "dk.hangar"];
for (const id of wanted) ok(MODULES[id], `catalogue has ${id}`);

/* doctrine: every archetype × tier lists the essentials and closes its balance sheet */
for (const a of ARCHETYPE_KEYS) for (const t of TIER_KEYS) {
  const lo = doctrineFor(a, t);
  for (const id of ["ls.core", "ls.air", "ls.chem", "wt.plant", "ag.farm", "sc.rnd", "mf.industrial", "cg.trading", "cmd.deck", "hb.brig", "hb.mess", "hb.kitchen", "dk.hangar", "st.shelter", "sf.lifeboats", "tc.radiators"]) ok(lo[id] > 0, `${a}/${t}: doctrine fits ${id}`);
  ok(lo["mf.shipyard"] > 0 || lo["mf.fab"] > 0, `${a}/${t}: some ship manufacturing`);
  ok(lo["hb.quarters_" + { I: 1, II: 2, III: 3 }[t]] > 0, `${a}/${t}: tier quarters`);
  ok(Object.keys(lo).some((id) => MODULES[id].tags.includes("defence")), `${a}/${t}: armed`);
  const b = stationBom(manifestOf(lo));
  ok(b.pwr >= 0, `${a}/${t}: power balance closes (${Math.round(b.pwr)} kW)`);
  ok(b.heat <= 0, `${a}/${t}: heat balance closes (${Math.round(b.heat)} kW)`);
  ok(b.pop === { I: 240, II: 2400, III: 24000 }[t], `${a}/${t}: population ${b.pop}`);
  ok(b.partCount > 500 && b.massT > 1000, `${a}/${t}: ${b.partCount} parts, ${Math.round(b.massT)} t`);
}

/* builds */
const sig = (root) => { const s = []; root.traverse((o) => { if (o.isMesh) s.push(o.name, o.geometry.attributes.position.count, o.position.x.toFixed(3), o.position.z.toFixed(3)); }); return s.join(","); };
let total = 0, unplaced = 0, builds = 0, ms = 0;
for (const a of ARCHETYPE_KEYS) for (const t of TIER_KEYS) for (const seed of ["A", "B", "C"]) {
  const t0 = Date.now();
  const st = buildStation({ seed, archetype: a, tier: t });
  ms += Date.now() - t0; builds++;
  const S = st.stats;
  total += S.modules; unplaced += S.unplaced.length;
  ok(S.hangars >= 1, `${a}/${t}/${seed}: has a hangar (${S.hangars})`);
  for (const h of st.builder.hangars) {
    ok(h.w >= HANGAR.maxShip.beam * 2 && h.h >= HANGAR.maxShip.height && h.d >= HANGAR.maxShip.length * 1.2, `${a}/${t}/${seed}: mouth ${h.w}×${h.h}×${h.d} fits a ${HANGAR.maxShip.length} m hull`);
    /* the clear 110 × 50 rectangle sits inside whatever shape the mouth is */
    ok([[-54.9, 6.1], [54.9, 6.1], [54.9, 55.9], [-54.9, 55.9]].every((pt) => inside(pt, h.aperture)), `${a}/${t}/${seed}: ${h.form}/${h.mouth} aperture clears 110 × 50 above the deck`);
    ok(HANGAR_FORMS.includes(h.form) && MOUTHS[h.mouth], `${a}/${t}/${seed}: hangar form ${h.form}/${h.mouth} is known`);
    seenForms.add(h.form); seenMouths.add(h.mouth);
  }
  seenAlloys.add(S.alloy);
  ok(ALLOYS[S.alloy] && S.bom.alloy === S.alloy && STYLES_ARCH[S.style], `${a}/${t}/${seed}: style ${S.style}, alloy ${S.alloy}`);
  if (S.alloy !== "al_li") ok(S.bom.materials[S.alloy] > 0 && (S.bom.materials.al_li ?? 0) < S.bom.materials[S.alloy], `${a}/${t}/${seed}: the hull is skinned in ${S.alloy}`);
  ok(S.defence.length >= 1 && S.bom.byDomain.some((d) => d.id === "sf"), `${a}/${t}/${seed}: defences on the manifest and the parts list`);
  if (S.manifest.some((m) => m.id === "sf.drone_bay")) ok(S.inhouse["sf.drone"]?.count > 0, `${a}/${t}/${seed}: drones built in house`);
  if (st.builder.placed.some((p) => p.module.tags.includes("shield"))) { let shell = null; st.root.traverse((o) => { if (o.name === "shield") shell = o; }); ok(shell && st.anim.shields.length >= 1, `${a}/${t}/${seed}: shield shell up`); }
  ok(st.anim.drones.length === 0, `${a}/${t}/${seed}: no scenery sorties (0.3.15 — the bay's drones are real ones)`);
  if (st.builder.placed.some((p) => p.module.tags.includes("weapon"))) ok(st.anim.turrets.length >= 1, `${a}/${t}/${seed}: turrets track`);
  for (const h of st.builder.hangars) if (h.form === "recessed") ok(h.slot.spine?.notches?.length >= 1, `${a}/${t}/${seed}: recessed hangar notched its spine`);
  st.root.traverse((o) => { if (o.userData?.module) o.traverse((c) => { if (c.userData?.body) seenBodies.add(c.userData.body); }); });
  ok(st.anim.chases.length === S.hangars && st.anim.traffic.every((o) => !o.userData.traffic.way), `${a}/${t}/${seed}: lanes chase, and no scenery shuttles run the ways (0.3.15)`);
  ok(st.anim.spins.length >= 1 && st.anim.lampBatches.length >= 1 && st.anim.lampBatches.reduce((n, im) => n + im.count, 0) >= 5, `${a}/${t}/${seed}: something spins, lamps blink`);
  ok(S.unplaced.length <= S.modules * 0.3, `${a}/${t}/${seed}: ≥70% fitted (${S.placed}/${S.modules})`);
  ok(Number.isFinite(S.size.x) && S.size.z > 100, `${a}/${t}/${seed}: real size ${S.size.toArray().map((v) => v.toFixed(0)).join("×")}`);
  ok(S.bom.partKinds >= 60 && S.bom.byDomain.length >= 10, `${a}/${t}/${seed}: parts list spans ${S.bom.byDomain.length} domains`);
  /* every drawn module is on the manifest and vice versa */
  const drawn = new Set(); st.root.traverse((o) => { if (o.userData?.module) drawn.add(o.userData.module); });
  ok([...drawn].every((id) => S.manifest.some((m) => m.id === id)), `${a}/${t}/${seed}: drawn modules are on the manifest`);
  if (seed === "A") {
    const again = buildStation({ seed, archetype: a, tier: t });
    ok(sig(st.root) === sig(again.root), `${a}/${t}: deterministic`);
    releaseStation(again);
    for (let i = 0; i < 30; i++) tick(st.anim, 1 / 30, i / 30);
  }
  releaseStation(st);
}
ok(unplaced / total < 0.06, `overall fitted ${((1 - unplaced / total) * 100).toFixed(1)}%`);
ok(HANGAR_FORMS.every((f) => seenForms.has(f)), `every hangar form appears (${[...seenForms].join(", ")})`);
ok(Object.keys(MOUTHS).every((m) => seenMouths.has(m)), `every mouth shape appears (${[...seenMouths].join(", ")})`);
ok(seenAlloys.size >= 6, `hulls skinned in ${seenAlloys.size} alloys`);

/* the sanctum bores its hangar through the great west door; the bastion mounts a spinal gun and a siege laser */
{
  const st = buildStation({ seed: "PILGRIM", archetype: "sanctum" });
  ok(st.stats.hangarForms.includes("throat/pointed"), `sanctum: the great door is the hangar (${st.stats.hangarForms})`);
  ok(st.stats.hull === "cathedral" && st.stats.style === "cathedral", "sanctum: cathedral grammar and style");
  releaseStation(st);
  const m = buildStation({ seed: "FORT", archetype: "military" });
  for (const id of ["sf.spinal", "sf.siege_laser", "sf.shield", "sf.drone_bay", "sf.defense", "sf.pdc_cluster", "sf.missile_cells", "sf.laser_battery"]) ok(m.builder.placed.some((p) => p.module.id === id), `military: ${id} mounted`);
  ok(m.stats.hull === "bastion" && m.stats.shielded && m.anim.drones.length === 0 && m.anim.turrets.length >= 6, `military: bastion, shielded, ${m.anim.drones.length} drones, ${m.anim.turrets.length} turrets`);
  releaseStation(m);
}

/* a recessed hangar really cuts the skin: the notched segment is an owned extrusion under the spine group */
{
  let found = 0;
  for (const seed of ["N1", "N2", "N3", "N4", "N5", "N6"]) {
    const st = buildStation({ seed, archetype: "habitat", tier: "II", merge: false });
    if (!st.builder.hangars.some((h) => h.form === "recessed")) { releaseStation(st); continue; }
    let owned = 0; st.root.traverse((o) => { if (o.parent?.name === "spine" && o.geometry?.userData?.owned) owned++; });
    ok(owned >= 1, `${seed}: notched spine segments drawn (${owned})`);
    found++;
    releaseStation(st);
  }
  ok(found >= 1, `recessed hangars occur on the habitat spine (${found} of 6 seeds)`);
}

/* every station is the first of its kind: the same module on two seeds takes two shapes */
{
  const sig = (g) => { const parts = []; g.traverse((o) => { if (o.isMesh) parts.push(`${o.geometry.uuid}:${o.scale.x.toFixed(1)},${o.scale.y.toFixed(1)},${o.scale.z.toFixed(1)}`); }); return parts.sort().join("|"); };
  const mods = (st) => { const m = {}; st.root.traverse((o) => { if (o.userData?.module && !m[o.userData.module]) m[o.userData.module] = sig(o); }); return m; };
  let same = 0, diff = 0;
  for (const a of ["tradehub", "military", "sanctum", "foundry", "research"]) {
    const A = mods(buildStation({ seed: "V1", archetype: a, merge: false })), Bm = mods(buildStation({ seed: "V2", archetype: a, merge: false }));
    for (const id of Object.keys(A)) if (Bm[id]) { if (A[id] === Bm[id]) same++; else diff++; }
  }
  ok(diff / (same + diff) > 0.85, `module shapes vary across seeds: ${diff} of ${same + diff} differ`);
  /* and across styles: the same archetype built in another language is another station */
  const civic = mods(buildStation({ seed: "S", archetype: "tradehub", merge: false })), goth = mods(buildStation({ seed: "S", archetype: "tradehub", style: "cathedral", merge: false }));
  let sd = 0, ss = 0; for (const id of Object.keys(civic)) if (goth[id]) { if (civic[id] === goth[id]) ss++; else sd++; }
  ok(sd / (ss + sd) > 0.8, `style changes the shapes: ${sd} of ${ss + sd} differ`);
}
for (const style of STYLE_KEYS) { const st = buildStation({ seed: "T", archetype: "tradehub", style, hull: "auto" }); ok(st.stats.style === style && st.stats.hangars >= 1 && STYLES[st.stats.hull], `style ${style} builds on hull ${st.stats.hull}`); releaseStation(st); }
for (const style of Object.keys(STYLES)) { const st = buildStation({ seed: "S", archetype: "tradehub", hull: style }); ok(st.stats.hull === style && st.stats.hangars >= 1, `hull grammar ${style} builds`); releaseStation(st); }
const rc = randomConfig("x"); ok(ARCHETYPE_KEYS.includes(rc.archetype) && TIER_KEYS.includes(rc.tier), "randomConfig is plausible");
console.log(`stationgen: ${pass} passed, ${fail} failed — ${builds} builds, ${Math.round(ms / builds)} ms avg`);
process.exit(fail ? 1 : 0);
