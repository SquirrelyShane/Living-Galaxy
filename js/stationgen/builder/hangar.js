/* The hangar bay — in five forms, with five mouth shapes.
 *
 * Every hangar clears the biggest hull the ship generator grows (96 m long,
 * 32 m across): the aperture always contains a 110 × 50 m rectangle and the
 * bay is 140 m deep. Port half of the mouth carries three entry ways, the
 * starboard half three exit ways; each way has a floor strip inside, a short
 * gantry outside with chase beads and a gate lamp. The traffic is real hulls
 * flying the bay (npc/bay.js), not dressing.
 *
 *   bay        the bay stands proud of the hull as its own hall
 *   blister    a hull mass grows round the bay — sloped plate, a vault, a rounded blister — the style's shape
 *   recessed   the bay is cut *into* a spine: the hull is notched and the mouth is flush with the skin
 *   throat     the bay bores into the end of the structure along its axis: the station's own prow is the mouth
 *   cradle     an open frame with a roof and a floor, no walls — the yard's hangar
 *
 * Mouths: rect · round · pointed (gothic) · hex · oct. The cavity is an
 * extruded tube with the aperture as its hole, so an arched mouth is an
 * arched hall inside, not a box behind a mask.
 *
 * Frame: the module frame (+Y out of the hull, +Z along the structure). For
 * bay/blister/recessed/cradle the mouth is the +Z face (`C.flip` mirrors it
 * so a station's hangars face both ways); a throat's mouth faces +Y. */
import * as THREE from "three";
import { G, addMesh, instanced, extrude, archOutline } from "../core/geometry.js";
import { roll } from "../data/styles.js";
import { ribGeo } from "../prefabs/forms.js";

export const HANGAR = { mouthW: 110, mouthH: 50, depth: 140, ways: 3, laneLen: 0.8, beads: 12, maxShip: { length: 96, beam: 32, height: 32 } };
/* aperture sizes per mouth shape: each clears a 110 × 50 m box flying 6 m above the deck */
export const MOUTHS = { rect: [110, 56], round: [140, 76], pointed: [140, 82], hex: [146, 66], oct: [150, 70] };
export const HANGAR_FORMS = ["bay", "blister", "recessed", "throat", "cradle"];
const T = 2.5; // slab thickness

/** Decide how a hangar would sit on a slot: form, mouth, outer shell and how far it sinks. Pure: no rng side effects beyond one roll. */
export function hangarPlan(B, s, relax = false) {
  const st = B.styleArch;
  const rng = B.rng;
  const allowed = {};
  const spine = s.spine;
  for (const [k, w] of Object.entries(st.hangar)) {
    if (w <= 0) continue;
    if (k === "recessed" && !(spine && spine.notchable !== false && !s.cap && spine.R * 2 >= MOUTHS.rect[0] * 0.55 && s.pos.z - HANGAR.depth / 2 >= spine.z0 + 4 && s.pos.z + HANGAR.depth / 2 <= spine.z0 + spine.L - 4)) continue;
    if (k === "throat" && !(s.cap && (spine || s.nave))) continue;
    if (k === "cradle" && !(s.kind === "truss" || s.kind === "end")) continue;
    allowed[k] = w;
  }
  /* the relaxed pass wants the smallest thing that still swallows a cruiser */
  const form = relax && !s.nave ? (allowed.throat && s.cap ? "throat" : "bay") : roll(rng, allowed) ?? "bay";
  const mouth = form === "cradle" || (relax && !s.nave) ? "rect" : (s.nave ? "pointed" : roll(rng, st.mouth) ?? "rect");
  const [Wa, Ha] = MOUTHS[mouth];
  const d = HANGAR.depth;
  /* the outer shell: a shape the style likes, big enough round the aperture */
  let outer = "rect", Wo = Wa + 2 * T, Ho = Ha + 2 * T;
  if (form === "blister" || form === "recessed" || form === "throat") {
    outer = s.nave ? "pointed" : st.forms.keep > 2 ? "oct" : st.forms.vault > 2 ? "pointed" : st.forms.dome > 1.5 || st.forms.stack > 2 ? "round" : rng.pick(["round", "oct", "rect"]);
    Wo = Wa + (outer === "rect" ? 24 : 40); Ho = Ha + (outer === "rect" ? 16 : outer === "pointed" ? 46 : 30);
    if (s.nave) { Wo = s.nave.W; Ho = s.nave.H; }
  }
  let sink = 0, lip = 6;
  if (form === "recessed") sink = Math.min(Ho - 12, spine.R * (spine.R * 2 >= Wo ? 0.72 : 1.1));
  /* on a spine the mouth faces the nearer end, away from the rings and belts amidships; elsewhere hangars alternate fore and aft */
  const flip = form !== "throat" && (spine && !s.cap ? s.pos.z < spine.zc : (B.hangarIx ?? 0) % 2 === 1);
  return { form, mouth, outer, Wa, Ha, Wo, Ho, d, sink, lip, relax, flip };
}

/** Placement footprint for a plan on a slot: [w, h, d] in the slot frame, the lift below the surface,
 * and the shift along z that reserves the approach lanes in front of the mouth. */
export function hangarFootprint(plan) {
  const lane = plan.d * HANGAR.laneLen;   // the approach stays clear of structure and modules
  if (plan.form === "throat") return { size: [plan.Wo + 4, plan.d + lane, plan.Ho + 4], lift: -(plan.d - plan.lip), zShift: 0 };
  const zShift = (plan.flip ? -1 : 1) * lane / 2;
  if (plan.form === "cradle") return { size: [plan.Wo + 16, plan.Ho + 8, plan.d + lane], lift: 0, zShift };
  return { size: [plan.Wo + 4, plan.Ho - plan.sink + 2, plan.d + lane], lift: -plan.sink, zShift };
}

/* ---- the tube: an outer outline extruded along z with the aperture as its hole ---- */
function tubeGeo(plan) {
  const key = `hangar:${plan.outer}:${plan.mouth}:${plan.Wo.toFixed(0)}x${plan.Ho.toFixed(0)}:${plan.Wa}x${plan.Ha}`;
  const outer = archOutline(plan.outer, plan.Wo, plan.Ho, 16).map(([x, y]) => [x, y]);
  const inner = archOutline(plan.mouth, plan.Wa, plan.Ha, 16).map(([x, y]) => [x, y + T]);
  return extrude(key, outer, 1, [inner], { curveSegments: 8, center: true });
}
/* a lit lining just inside the hole walls: the cavity reads as a hall from inside, invisible from outside */
function liningGeo(plan) {
  const key = `hlining:${plan.mouth}:${plan.Wa}x${plan.Ha}`;
  const outer = archOutline(plan.mouth, plan.Wa * 0.995, plan.Ha * 0.995, 16).map(([x, y]) => [x, y + T]);
  const inner = archOutline(plan.mouth, plan.Wa * 0.975, plan.Ha * 0.975, 16).map(([x, y]) => [x, y + T + 0.3]);
  return extrude(key, outer, 1, [inner], { curveSegments: 8, center: true });
}
function plateGeo(plan, grow = 1, hole = true) {
  const key = `hplate:${plan.outer}:${plan.mouth}:${plan.Wo.toFixed(0)}x${plan.Ho.toFixed(0)}:${plan.Wa}x${plan.Ha}:${grow}:${hole}`;
  const outer = archOutline(plan.outer, plan.Wo * grow, plan.Ho * grow, 16).map(([x, y]) => [x, y - (plan.Ho * grow - plan.Ho) * 0.5]);
  const inner = hole ? [archOutline(plan.mouth, plan.Wa, plan.Ha, 16).map(([x, y]) => [x, y + T])] : [];
  return extrude(key, outer, 1, inner, { curveSegments: 8, center: true });
}

export function hangar(g, size, C) {
  const plan = C.plan ?? { form: "bay", mouth: "rect", outer: "rect", Wa: 110, Ha: 50, Wo: 115, Ho: 55, d: 140, sink: 0, lip: 6 };
  const { mats, rng } = C;
  const st = C.style;
  const { Wa, Ha, Wo, Ho, d, form } = plan;
  const bay = new THREE.Group();
  bay.name = `hangar:${form}:${plan.mouth}`;
  g.add(bay);
  if (form === "throat") {
    /* mouth out along +Y (the axis at an end cap), the arch's apex along +Z of the frame (world "up" on a cap) */
    bay.rotation.setFromRotationMatrix(new THREE.Matrix4().makeBasis(new THREE.Vector3(-1, 0, 0), new THREE.Vector3(0, 0, 1), new THREE.Vector3(0, 1, 0)));
    bay.position.set(0, -d / 2 + plan.lip, -Ho / 2);
  }
  else { if (plan.flip) bay.rotation.y = Math.PI; bay.position.y = -plan.sink; }
  const add = (geo, mat, ...a) => addMesh(bay, geo, mat, ...a);
  const shell = st.forms.keep > 2 ? mats.armour : mats.hull;
  const zm = d / 2;

  if (form === "cradle") {
    /* floor, four posts, roof frame, a lattice roof — open sides */
    add(G.box(), mats.hull, 0, T / 2, 0, 0, 0, 0, Wo + 8, T, d);
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) add(G.box(), mats.truss, sx * (Wo / 2 + 2), Ho / 2, sz * d * 0.46, 0, 0, 0, 3, Ho, 3);
    for (const sx of [-1, 1]) add(G.box(), mats.truss, sx * (Wo / 2 + 2), Ho, 0, 0, 0, 0, 3, 3, d * 0.95);
    const ribs = Math.max(4, Math.round(d / 18));
    for (let i = 0; i <= ribs; i++) add(G.box(), mats.truss, 0, Ho, -d / 2 + (d * i) / ribs, 0, 0, 0, Wo + 8, 2.5, 2.5);
    add(G.box(), mats.panel, 0, Ho + 1.6, 0, 0, 0, 0, Wo * 0.9, 0.6, d * 0.9);
    C.count(9 + ribs);
  } else {
    /* the tube, its back plate, the mouth frame */
    add(tubeGeo(plan), shell, 0, 0, 0, 0, 0, 0, 1, 1, d);
    add(liningGeo(plan), mats.interior, 0, 0, -T, 0, 0, 0, 1, 1, d - 2 * T);
    add(plateGeo(plan, 1, false), mats.dark, 0, 0, -zm + 1.5, 0, 0, 0, 1, 1, 3);
    add(plateGeo(plan, 1.06, true), st.forms.keep > 2 ? mats.armour : mats.metal, 0, 0, zm + 1, 0, 0, 0, 1, 1, 4);
    /* ribs along the outside: arch ribs, armour bands or box frames by style */
    const ribs = Math.max(3, Math.round(d / rng.range(18, 30)));
    for (let i = 0; i < ribs; i++) {
      const z = -d / 2 + (d * (i + 0.5)) / ribs;
      if (plan.outer === "pointed" || plan.outer === "round") add(ribGeo(plan.outer, 0.05), mats.dark, 0, -Ho * 0.02, z, 0, 0, 0, Wo * 1.05, Ho * 1.05, 2.4);
      else if (st.forms.keep > 2) add(G.box(), mats.dark, 0, Ho + 1.2, z, 0, 0, 0, Wo + 6, 2.4, 4);
      else { add(G.box(), mats.dark, 0, Ho + 1, z, 0, 0, 0, Wo + 3, 2, 3); for (const s of [-1, 1]) add(G.box(), mats.dark, s * (Wo / 2 + 1), Ho / 2, z, 0, 0, 0, 2, Ho, 3); }
    }
    /* style dressing on the shell */
    if (st.decor.includes("buttress")) for (let i = 0; i < ribs; i++) for (const s of [-1, 1]) { const z = -d / 2 + (d * (i + 0.5)) / ribs; add(G.box(), mats.panel, s * (Wo / 2 + Ho * 0.22), Ho * 0.5, z, 0, 0, s * 0.5, 1.8, Ho * 0.8, 2.6); add(G.cone(4), mats.dark, s * (Wo / 2 + Ho * 0.42), Ho * 0.24, z, 0, Math.PI / 4, 0, 2.5, 5, 2.5); }
    if (st.decor.includes("plates")) for (let i = 0; i < ribs; i++) for (const s of [-1, 1]) { const z = -d / 2 + (d * (i + 0.5)) / ribs; add(G.box(), mats.armour, s * (Wo / 2 + 2), Ho * 0.5, z, 0, 0, s * 0.3, 2.2, Ho * 0.85, d / ribs * 0.85); }
    if (st.decor.includes("pipes")) for (let i = 0; i < 3; i++) add(G.cyl(8), mats.metal, (i - 1) * Wo * 0.3, Ho + 3 + i, 0, Math.PI / 2, 0, 0, 0.8, d * 0.9, 0.8);
    if (st.decor.includes("spire") && form !== "throat") { add(G.cyl(8), mats.hull, 0, Ho + 8, -d * 0.3, 0, 0, 0, 3, 16, 3); add(G.cone(8), mats.panel, 0, Ho + 24, -d * 0.3, 0, 0, 0, 3.6, 16, 3.6); C.lamp(0, Ho + 33, -d * 0.3, st.lampColor, "pulse", 2); }
    /* lit edge strip round the mouth and a floor lip */
    add(G.box(), mats.glow, 0, Ha + T + 0.6, zm + 3.2, 0, 0, 0, Wa * 0.8, 0.5, 0.5);
    add(G.box(), mats.glow, 0, T + 0.4, zm + 3.2, 0, 0, 0, Wa, 0.5, 0.5);
    C.count(6 + ribs * 2);
    /* bay doors: two leaves, parted to the sides, drifting a little */
    for (const s of [-1, 1]) {
      const leaf = add(G.box(), st.forms.keep > 2 ? mats.armour : mats.panel, s * (Wa * 0.5 - Wa * 0.06), Ha / 2 + T, zm - T * 1.2, 0, 0, 0, Wa * 0.12, Ha * 0.96, T * 0.8);
      leaf.userData.door = { axis: "x", base: leaf.position.x, amp: Wa * 0.02, speed: 0.08, phase: s > 0 ? 0 : Math.PI, sign: s };
      add(G.box(), mats.hazard, s * (Wa * 0.5 - Wa * 0.06), Ha * 0.5 + T, zm - T * 1.2 + 0.5, 0, 0, 0, Wa * 0.1, 1.2, 0.4);
      C.count(2);
    }
  }
  /* an apron where a blister meets the hull */
  if (form === "blister") { add(G.frustum(0.86, 4), shell, 0, 3, 0, 0, Math.PI / 4, 0, (Wo + 20) / 1.414, 6, (d + 12) / 1.414); C.count(); }
  if (form === "throat") { add(plateGeo(plan, 1.14, true), shell, 0, 0, zm - 2, 0, 0, 0, 1, 1, 10); C.count(); }

  /* the ways: three in on the port half, three out on the starboard half */
  const laneLen = d * HANGAR.laneLen;
  const half = Wa / 2;
  const wayW = half / HANGAR.ways;
  const beadItems = [];
  const stripY = T + 0.3;
  const ways = [];
  for (let k = 0; k < HANGAR.ways * 2; k++) {
    const entry = k < HANGAR.ways;
    const x = -half + wayW * (k + 0.5);
    const mat = entry ? mats.laneIn : mats.laneOut;
    add(G.box(), mat, x, stripY, -d * 0.1, 0, 0, 0, wayW * 0.7, 0.3, d * 0.75);
    for (const s of [-1, 1]) add(G.box(), mats.metal, x + s * wayW * 0.45, T, zm + laneLen / 2, 0, 0, 0, 0.8, 0.8, laneLen);
    for (let i = 0; i < HANGAR.beads; i++) {
      const z = zm + (laneLen * (i + 0.5)) / HANGAR.beads;
      for (const s of [-1, 1]) beadItems.push({ x: x + s * wayW * 0.45, y: T + 1.2, z, sx: 0.8, way: k, i, entry });
    }
    C.count(3);
    ways.push({ x, entry, z0: zm + laneLen, z1: -d * 0.42 });
  }
  const beads = instanced(bay, G.sphere(6, 4), mats.bead, beadItems, "chase");
  beads.userData.chase = { items: beadItems, beads: HANGAR.beads, inCol: new THREE.Color(mats.laneIn.color), outCol: new THREE.Color(mats.laneOut.color), dim: 0.16, speed: 0.9 };
  /* floods on the roof, a lamp at each way's gate */
  for (let i = 0; i < 4; i++) for (const s of [-1, 1]) C.lampOn(bay, s * Wa * 0.3, Ha + T * 0.6, -d / 2 + (d * (i + 0.5)) / 4, "#fff2d6", "steady", 2.2);
  for (const wy of ways) C.lampOn(bay, wy.x, T + 3, wy.z0 + 1.5, wy.entry ? "#4fd8b8" : "#ffa040", "blink", 2.4);
  /* 0.3.15: no scenery traffic. The box shuttles that looped the ways and the
   * parked box tug were stand-ins for hulls that vanished at the mouth; the
   * real ones fly the bay now (npc/bay.js). The draws they made are still
   * made, so every seed grows the same hull it always did. */
  for (const wy of ways) {
    const n = 1 + (rng.chance(0.5) ? 1 : 0);
    for (let i = 0; i < n; i++) { rng.next(); rng.range(0, 10); }
    void wy;
  }
  /* a crane on the roof rails */
  if (form !== "cradle") { const crane = addMesh(bay, G.box(), mats.metal, 0, Ha + T * 0.4, 0, 0, 0, 0, Wa * 0.96, 2, 4); crane.userData.traffic = { axis: "z", amp: d * 0.35, speed: 0.1, phase: 0 }; }
  C.count(2);
  return { w: Wa, h: Ha, d, ways, form, mouth: plan.mouth, outer: plan.outer, aperture: archOutline(plan.mouth, Wa, Ha, 16) };
}
