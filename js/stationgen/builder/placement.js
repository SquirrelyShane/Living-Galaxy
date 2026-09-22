/* Placement: fit the manifest onto the slots.
 *
 * For every module the solver scores every free slot it is allowed to
 * mount on — how close the slot's zone is to the module's, whether the
 * slot's sun exposure matches what the module wants, whether the module
 * is next to something it likes (kitchens beside mess halls, traffic
 * control beside hangars, life support beside quarters) — then tries the
 * best slots in order until one's footprint clears the occupancy boxes.
 * A module that will not fit tries a smaller footprint twice, then is
 * recorded as unplaced (it stays on the manifest: the parts list is the
 * station's, not the picture's).
 *
 * Hangars are planned per candidate slot (hangar.js hangarPlan): the form
 * a slot allows — cut into a spine, bored into an end, a blister, a bay —
 * sets the footprint and how far it sinks into the structure. */
import * as THREE from "three";
import { slotBox, slotBoxes, frameMatrix, sunDot } from "./frames.js";
import { hangarPlan, hangarFootprint } from "./hangar.js";

const AFFINITY = {
  "hb.kitchen": ["hb.mess"], "hb.mess": ["hb.quarters_1", "hb.quarters_2", "hb.quarters_3", "hb.kitchen"],
  "ls.core": ["hb.quarters_1", "hb.quarters_2", "hb.quarters_3"], "ls.air": ["ls.core"], "ls.chem": ["ls.air", "mf.industrial"],
  "wt.plant": ["ls.core", "ag.farm"], "ag.farm": ["hb.mess", "wt.plant"], "cmd.traffic": ["dk.hangar"], "cg.trading": ["dk.hangar", "cg.warehouse"],
  "cg.warehouse": ["dk.hangar"], "mf.shipyard": ["dk.hangar", "mf.industrial"], "hb.medical": ["hb.quarters_1", "hb.quarters_2"],
  "sf.lifeboats": ["hb.quarters_1", "hb.quarters_2", "hb.quarters_3"], "st.shelter": ["hb.quarters_1", "hb.quarters_2", "hb.quarters_3"],
  "pw.storage": ["pw.solar", "pw.reactor", "pw.fusion"], "tc.radiators": ["pw.reactor", "pw.fusion", "mf.industrial"], "hb.brig": ["sf.defense", "cmd.deck"],
  "sf.pdc_cluster": ["dk.hangar", "sf.defense", "sf.missile_cells"], "sf.fire_control": ["sf.defense", "sf.laser_battery", "sf.spinal", "sf.siege_laser"],
  "sf.drone_bay": ["dk.hangar", "sf.armoury"], "sf.armoury": ["mf.industrial", "sf.missile_cells"], "sf.missile_cells": ["sf.fire_control"],
  "sf.shield": ["pw.storage", "pw.reactor", "pw.fusion"], "sf.laser_battery": ["tc.radiators", "sf.fire_control"],
};
const AVOID = {
  "hb.quarters_1": ["pw.reactor", "pw.fusion", "mf.industrial", "cg.depot", "sf.missile_cells", "sf.armoury"], "hb.quarters_2": ["pw.reactor", "pw.fusion"], "hb.mess": ["mf.industrial", "pw.reactor"],
  "ag.farm": ["pw.reactor", "pw.fusion", "mf.industrial"], "sc.rnd": ["mf.industrial", "dk.hangar"], "cg.depot": ["hb.quarters_1", "hb.mess", "ag.farm", "sf.missile_cells", "sf.spinal"],
  "pw.reactor": ["hb.quarters_1", "hb.quarters_2", "hb.mess", "ag.farm", "cmd.deck"], "pw.fusion": ["hb.quarters_1", "hb.quarters_2", "hb.mess", "ag.farm"],
  "sf.missile_cells": ["cg.depot", "hb.quarters_1", "ag.farm"], "sf.siege_laser": ["ag.farm", "hb.quarters_1"],
};

const _box = new THREE.Box3();

export function scoreSlot(mod, s, sun, placed, relax = false, throatW = 0) {
  if (s.taken) return -Infinity;
  const isHangar = mod.tags.includes("hangar");
  if (s.cap && !mod.mount.includes("end")) return -Infinity;
  if (!mod.mount.includes(s.kind)) { if (!relax || s.kind === "end") return -Infinity; }
  let sc = -Math.abs(s.zone - mod.zone) * 10 + (mod.mount.includes(s.kind) ? 1.5 : 0);
  const d = sunDot(s, sun);
  if (mod.sun === "face") sc += d * 4;
  else if (mod.sun === "shade") sc += -d * 4;
  else if (mod.sun === "edge") sc += (1 - Math.abs(d)) * 3;
  /* neighbours: things it likes within 90 m, things it avoids within 140 m */
  const likes = AFFINITY[mod.id] ?? [], avoid = AVOID[mod.id] ?? [];
  for (const p of placed) {
    if (!p.pos) continue; // structural (the drum) has no slot
    const dist = p.pos.distanceTo(s.pos);
    if (likes.includes(p.module.id) && dist < 90) sc += 2.5 - dist / 60;
    if (avoid.includes(p.module.id) && dist < 140) sc -= 4 - dist / 50;
  }
  /* hard points want guns; the nave wants its great door; caps want a throat when the style likes one */
  if (s.hard && mod.tags.includes("weapon")) sc += 3;
  if (s.nave) sc += isHangar ? 8 : -6;
  if (s.cap && isHangar) sc += Math.min(3, (throatW ?? 0) - 1);
  /* big things want big slots */
  if (mod.size[0] > s.width) sc -= (mod.size[0] - s.width) / 30;
  return sc;
}

const _own = new THREE.Box3();
/* a footprint may touch the structure it sits on (its slot's owner, or any structure box the slot lies on) but nothing else */
function clear(boxes, occ, s, pad = 1.5) {
  for (const b of boxes) {
    _box.copy(b).expandByScalar(pad);
    for (const o of occ) {
      if (o === s.owner) continue;
      if (!_box.intersectsBox(o)) continue;
      if (o.userData !== "module" && _own.copy(o).expandByScalar(2.5).containsPoint(s.pos)) continue;
      return false;
    }
  }
  return true;
}

/**
 * Place `mod` once. Returns the placement { module, slot, size, matrix,
 * pos, plan? } or null. `B` is the builder: slots, occ, placed, sun, rng, styleArch.
 */
export function place(B, mod, { relax = false } = {}) {
  const isHangar = mod.tags.includes("hangar");
  const throatW = B.styleArch?.hangar?.throat ?? 0;
  const scored = [];
  for (const s of B.slots) {
    const sc = scoreSlot(mod, s, B.sun, B.placed, relax, throatW);
    if (sc > -Infinity) scored.push({ s, sc: sc + B.rng.range(0, 0.8) });
  }
  scored.sort((a, b) => b.sc - a.sc);
  for (const shrink of isHangar ? [1] : relax ? [0.8, 0.65, 0.5] : [1, 0.85, 0.7]) {
    for (const entry of scored.slice(0, isHangar ? scored.length : 40)) {
      const s = entry.s;
      let size, lift = 0, plan = null, zShift = 0;
      if (isHangar) { plan = entry.plan ??= hangarPlan(B, s, relax); const f = hangarFootprint(plan); size = f.size; lift = f.lift; zShift = f.zShift; }
      else size = mod.size.map((v) => v * shrink * B.moduleScale);
      let boxes = slotBoxes(s, size, lift, 45, zShift);
      if (!clear(boxes, B.occ, s)) {
        /* a hangar may face the other way if its approach is blocked */
        if (!plan || plan.form === "throat") continue;
        plan.flip = !plan.flip; zShift = -zShift;
        boxes = slotBoxes(s, size, lift, 45, zShift);
        if (!clear(boxes, B.occ, s)) { plan.flip = !plan.flip; continue; }
      }
      s.taken = true;
      if (isHangar) B.hangarIx = (B.hangarIx ?? 0) + 1;
      /* neighbours inside the footprint go too (the bay itself, not its approach) */
      const box = plan ? slotBox(s, [size[0], size[1], plan.d], lift, 0) : slotBox(s, size, lift, zShift);
      for (const o of B.slots) if (!o.taken && o !== s && box.containsPoint(o.pos) && o.pos.distanceTo(s.pos) < Math.max(size[0], size[2]) * 0.5) o.taken = true;
      for (const b of boxes) { b.userData = "module"; B.occ.push(b); }
      const p = { module: mod, slot: s, size, shrink, lift, plan, matrix: frameMatrix(s), pos: s.pos.clone(), box, boxes };
      B.placed.push(p);
      return p;
    }
  }
  return null;
}
