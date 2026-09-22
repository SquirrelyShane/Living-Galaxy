/* StationBuilder — the pipeline.
 *
 *   1. resolve the manifest (archetype doctrine × population tier), the
 *      architecture style and the hull alloy
 *   2. grow the hull grammar: spine / nave / core / arms / booms → slots + occupancy
 *      (spines only *plan* themselves here; they draw after placement)
 *   3. place every module on the best slot its zone, sun and neighbours allow —
 *      hangars are planned per slot: bay, blister, cut into the spine, bored into an end
 *   4. draw each placed module with its prefab in the slot's frame, from the
 *      shape grammar the style speaks
 *   5. draw the spines round the notches and trims the hangars left, then
 *      details: instanced greebles, running lamps, antennae, the shield shell
 *   6. bake statics per material, collect the animation registry, report
 *
 * Everything reads off one seeded RNG, so a (seed, config) is one station. */
import * as THREE from "three";
import { RNG } from "../core/rng.js";
import { G, makeMat, addMesh, instanced, mergeStatic, FINISHES } from "../core/geometry.js";
import { ARCHETYPES } from "../data/archetypes.js";
import { TIERS } from "../data/tiers.js";
import { STYLES_ARCH, roll } from "../data/styles.js";
import { ALLOYS } from "../data/materials.js";
import { doctrineFor, manifestOf } from "../data/doctrine.js";
import { STYLES, habitatDrum } from "./hull.js";
import { place } from "./placement.js";
import { PREFABS } from "../prefabs/modules.js";
import { hangar } from "./hangar.js";
import { frameMatrix } from "./frames.js";

export class StationBuilder {
  build(cfg) {
    this.cfg = cfg;
    this.rng = new RNG(cfg.seed);
    this.arch = ARCHETYPES[cfg.archetype] ?? ARCHETYPES.tradehub;
    this.tier = TIERS[cfg.tier] ?? TIERS[this.arch.tier];
    this.styleKey = cfg.style && STYLES_ARCH[cfg.style] ? cfg.style : this.arch.style ?? "civic";
    this.styleArch = STYLES_ARCH[this.styleKey];
    this.style = cfg.hull === "auto" ? roll(this.rng, this.styleArch.hulls) : cfg.hull && STYLES[cfg.hull] ? cfg.hull : this.arch.hull;
    if (!STYLES[this.style]) this.style = this.arch.hull;
    this.alloy = cfg.alloy && ALLOYS[cfg.alloy] ? cfg.alloy : roll(this.rng, this.styleArch.alloys) ?? "al_li";
    this.sun = new THREE.Vector3(...(cfg.sun ?? [1, 0.35, 0.2])).normalize();
    this.slots = []; this.occ = []; this.placed = []; this.unplaced = []; this.partCount = 0; this.lampCount = 0;
    this.lampSpecs = [];
    this.anim = { spins: [] };
    this.hangars = [];
    this.hangarIx = 0;
    this.deferred = [];
    this.drumSlot = null;

    /* scale: the tier sets the spine; the archetype and the seed nudge it */
    const T = this.tier;
    this.L = T.spineM * cfg.scale * this.rng.range(0.9, 1.12);
    this.R = Math.max(14, this.L / 9) * cfg.girth * this.rng.range(0.92, 1.1);
    this.moduleScale = cfg.moduleScale ?? T.moduleScale;
    this.zoneOf = (z) => THREE.MathUtils.clamp((z - this.zMin) / (this.zMax - this.zMin), 0, 1);
    this.zMin = -this.L * 0.62; this.zMax = this.L * 0.62;

    this.mats = this.materials(cfg);
    const root = new THREE.Group();
    root.name = "station";

    /* 1. manifest */
    this.doctrine = cfg.manifest ? { ...cfg.manifest } : doctrineFor(cfg.archetype, cfg.tier, { hangars: cfg.hangars });
    this.manifest = manifestOf(this.doctrine);
    const needs = { ring: Boolean(this.doctrine["hb.quarters_2"]), drum: Boolean(this.doctrine["hb.quarters_3"]) };

    /* 2. hull — a drum swallows a third of any spine, so a Tier III hull grows to carry it */
    if (needs.drum && this.style !== "drum") this.L *= 1.45;
    STYLES[this.style](this, root, needs);
    if (needs.drum && this.drumSlot) { const d = habitatDrum(this, root, this.drumSlot.z, this.drumSlot.R); this.drum = d; }
    const hullBox = new THREE.Box3();
    for (const b of this.occ) hullBox.union(b);
    this.zMin = hullBox.min.z; this.zMax = hullBox.max.z;
    for (const s of this.slots) s.zone = this.zoneOf(s.pos.z);

    /* 3 + 4. place and draw */
    this.modulesRoot = new THREE.Group(); this.modulesRoot.name = "modules"; root.add(this.modulesRoot);
    let hangarIx = 0;
    const later = [];
    for (const { module: mod, count } of this.manifest) {
      for (let i = 0; i < count; i++) {
        if (mod.id === "hb.quarters_3") { this.placed.push({ module: mod, structural: true, pos: new THREE.Vector3(0, 0, this.drumSlot?.z ?? 0) }); continue; } // the drum is the hull
        const p = place(this, mod);
        if (!p) { later.push(mod); continue; }
        this.draw(p, mod.tags.includes("hangar") ? hangarIx++ : 0);
      }
    }
    for (const mod of later) {
      const p = place(this, mod, { relax: true });
      if (!p) { this.unplaced.push(mod); continue; }
      this.draw(p, mod.tags.includes("hangar") ? hangarIx++ : 0);
    }

    /* 5. the structure that waited for the hangars, then details */
    for (const fn of this.deferred) fn();
    this.deferred.length = 0;
    this.greebles(root);
    this.runningLights(root);
    this.shieldShell(root);
    this.bakeLamps(root);

    /* 6. bake */
    this.folded = cfg.merge === false ? 0 : mergeStatic(root);
    const box = new THREE.Box3().setFromObject(root);
    this.size = box.getSize(new THREE.Vector3());
    this.bounds = box;
    if (cfg.center !== false) { const c = box.getCenter(new THREE.Vector3()); root.position.sub(c); }
    return root;
  }

  count(n = 1) { this.partCount += n; }

  materials(cfg) {
    const F = FINISHES[cfg.finish ?? this.arch.palette.finish] ?? {};
    const pal = { ...this.arch.palette, ...(cfg.palette ?? {}) };
    const alloy = ALLOYS[this.alloy];
    /* the hull is the livery tinted by the metal it is skinned in */
    const hullCol = new THREE.Color(pal.hull).lerp(new THREE.Color(alloy.tint), 0.55);
    const skin = (c, o = {}) => makeMat(c, { ...o, ...F });
    return {
      hull: skin(hullCol, { metalness: alloy.metalness, roughness: alloy.roughness }),
      panel: skin(hullCol.clone().lerp(new THREE.Color(pal.dark), 0.35), { metalness: alloy.metalness * 0.9, roughness: alloy.roughness + 0.1 }),
      dark: skin(pal.dark, { metalness: 0.6, roughness: 0.5 }),
      metal: makeMat("#4c5563", { metalness: 0.9, roughness: 0.3 }),
      truss: makeMat("#6d7684", { metalness: 0.85, roughness: 0.35 }),
      accent: makeMat(pal.accent, { metalness: 0.4, roughness: 0.35, emissive: pal.accent, emissiveIntensity: 0.35 }),
      glow: makeMat(pal.glow, { metalness: 0.1, roughness: 0.4, emissive: pal.glow, emissiveIntensity: 2.2 }),
      window: makeMat("#ffe6bd", { metalness: 0, roughness: 0.5, emissive: "#ffd9a0", emissiveIntensity: 1.6 }),
      glass: makeMat("#bfe6ff", { metalness: 0.1, roughness: 0.08, emissive: "#3f7ea8", emissiveIntensity: 0.35, transparent: true, opacity: 0.55 }),
      foliage: makeMat("#3f8a4a", { metalness: 0, roughness: 0.9, emissive: "#1e4a26", emissiveIntensity: 0.35 }),
      solar: makeMat("#17305a", { metalness: 0.7, roughness: 0.2, emissive: "#0b2a66", emissiveIntensity: 0.3 }),
      radiator: makeMat("#2a2f38", { metalness: 0.3, roughness: 0.7, emissive: "#ff5a2a", emissiveIntensity: 0.35 }),
      hot: makeMat("#ffd9a0", { metalness: 0, roughness: 0.3, emissive: "#ff8a2a", emissiveIntensity: 2.5 }),
      hazard: makeMat("#ffb03a", { metalness: 0.3, roughness: 0.5, emissive: "#ffb03a", emissiveIntensity: 0.5 }),
      armour: skin(new THREE.Color(alloy.tint).lerp(new THREE.Color("#2e333a"), 0.5), { metalness: 0.7, roughness: 0.62 }),
      cargo: makeMat("#8a6d3b", { metalness: 0.4, roughness: 0.7 }),
      interior: makeMat("#3a4454", { metalness: 0.2, roughness: 0.9, emissive: "#55698a", emissiveIntensity: 1.1 }),
      laneIn: makeMat("#4fd8b8", { metalness: 0, roughness: 0.5, emissive: "#4fd8b8", emissiveIntensity: 1.8 }),
      laneOut: makeMat("#ffa040", { metalness: 0, roughness: 0.5, emissive: "#ffa040", emissiveIntensity: 1.8 }),
      bead: new THREE.MeshBasicMaterial({ color: 0xffffff, toneMapped: false }),   // unlit: the instance colour is the light
      shuttle: makeMat("#c9d2dc", { metalness: 0.6, roughness: 0.4 }),
      plume: makeMat("#9fd4ff", { metalness: 0, roughness: 0.3, emissive: "#7df0ff", emissiveIntensity: 2.4, transparent: true, opacity: 0.7 }),
      shield: makeMat("#8fd6ff", { metalness: 0, roughness: 0.2, emissive: "#6fb8ff", emissiveIntensity: 1.2, transparent: true, opacity: 0.28, side: THREE.DoubleSide, depthWrite: false }),
    };
  }

  /* one module, drawn by its prefab in the slot frame and parented to the ring if it lives on one */
  draw(p, ix = 0) {
    const g = new THREE.Group();
    g.name = `module:${p.module.id}`;
    g.userData.module = p.module.id;
    const s = p.slot;
    if (s.parent) {
      const local = { ...s, pos: s.pos.clone().sub(s.parent.position) };
      g.applyMatrix4(frameMatrix(local));
      s.parent.add(g);
    } else {
      g.applyMatrix4(p.matrix);
      this.modulesRoot.add(g);
    }
    p.group = g;
    const C = this.ctx(p, ix);
    const isHangar = p.module.tags.includes("hangar");
    const fn = isHangar ? hangar : PREFABS[p.module.prefab] ?? PREFABS.plant;
    if (isHangar && p.plan) this.reserveHangar(p);
    const r = fn(g, p.size, C);
    if (isHangar) this.hangars.push({ group: g, ...r, slot: s, plan: p.plan });
    return g;
  }

  /* a recessed hangar notches its spine; a throat trims the end it bores into */
  reserveHangar(p) {
    const s = p.slot, plan = p.plan, sp = s.spine;
    if (!sp) return;
    if (plan.form === "recessed") {
      sp.notches.push({ a: Math.atan2(s.normal.y, s.normal.x), w: plan.Wo + 3, sink: plan.sink, z0: s.pos.z - plan.d / 2 - 1, z1: s.pos.z + plan.d / 2 + 1 });
    } else if (plan.form === "throat") {
      const reach = plan.d - plan.lip;
      if (s.normal.z < 0) sp.trim.lo = Math.max(sp.trim.lo, s.pos.z + reach - sp.z0);
      else sp.trim.hi = Math.max(sp.trim.hi, sp.z0 + sp.L - (s.pos.z - reach));
      if (s.prow) sp.noProw = true;
    }
  }

  ctx(p, ix) {
    const B = this;
    const parent = () => p.group ?? B.modulesRoot;
    return {
      mats: this.mats, rng: this.rng, style: this.styleArch, alloy: this.alloy, flip: ix % 2 === 1, G, plan: p.plan ?? null,
      add: (geo, mat, x, y, z, rx, ry, rz, sx, sy, sz) => addMesh(parent(), geo, mat, x, y, z, rx, ry, rz, sx, sy, sz),
      addTo: (par, geo, mat, x, y, z, rx, ry, rz, sx, sy, sz) => addMesh(par, geo, mat, x, y, z, rx, ry, rz, sx, sy, sz),
      child: (name = "part") => { const g = new THREE.Group(); g.name = name; parent().add(g); return g; },
      count: (n = 1) => B.count(n),
      lamp: (x, y, z, color = "#ffffff", mode = "blink", base = 2.4) => B.lamp(parent(), x, y, z, color, mode, base),
      lampOn: (par, x, y, z, color = "#ffffff", mode = "blink", base = 2.4) => B.lamp(par, x, y, z, color, mode, base),
    };
  }

  /* lamps are recorded now and baked into one instanced batch per spinning group at the end: a
   * Tier III city has hundreds of them, and one draw call each was most of the station's cost */
  lamp(parent, x, y, z, color, mode, base) {
    const spec = { parent, x, y, z, color, mode, period: mode === "strobe" ? 2.4 : 1.8 + this.rng.range(0, 1.2), phase: this.rng.range(0, 3), base };
    this.lampSpecs.push(spec);
    this.lampCount++;
    return spec;
  }

  bakeLamps(root) {
    root.updateMatrixWorld(true);
    const batches = new Map();   // spinning ancestor (or root) → items
    const p = new THREE.Vector3(), inv = new THREE.Matrix4();
    for (const sp of this.lampSpecs) {
      let host = sp.parent, anc = root;
      while (host && host !== root) { if (host.userData?.spin) { anc = host; break; } host = host.parent; }
      if (!sp.parent.parent && sp.parent !== root) continue;   // orphaned group: skip
      p.set(sp.x, sp.y, sp.z).applyMatrix4(sp.parent.matrixWorld);
      inv.copy(anc.matrixWorld).invert();
      p.applyMatrix4(inv);
      let list = batches.get(anc);
      if (!list) { list = []; batches.set(anc, list); }
      list.push({ x: p.x, y: p.y, z: p.z, sx: 0.9, color: new THREE.Color(sp.color), mode: sp.mode, period: sp.period, phase: sp.phase, base: sp.base });
    }
    for (const [anc, items] of batches) {
      const im = instanced(anc, G.sphere(6, 4), this.mats.bead, items, "lamps");
      im.userData.lamps = { items };
    }
    this.lampSpecs.length = 0;
  }

  /* instanced greebles over the hull skin: vents, hatches, pipe stubs, plates — coarse or fine by style */
  greebles(root) {
    const items = [];
    const coarse = this.styleArch.greeble === "coarse", plates = this.styleArch.greeble === "plates";
    const n = Math.round(this.cfg.complexity * (coarse ? 180 : 260) * this.tier.hullScale);
    const free = this.slots.filter((s) => !s.taken && (s.kind === "spine" || s.kind === "truss"));
    for (let i = 0; i < n && free.length; i++) {
      const s = this.rng.pick(free);
      const m = frameMatrix(s);
      const local = new THREE.Vector3(this.rng.range(-s.width * 0.4, s.width * 0.4), 0.2, this.rng.range(-12, 12)).applyMatrix4(m);
      const q = new THREE.Quaternion().setFromRotationMatrix(m);
      const e = new THREE.Euler().setFromQuaternion(q);
      const k = coarse ? 1.8 : plates ? 1.4 : 1;
      items.push({ x: local.x, y: local.y, z: local.z, rx: e.x, ry: e.y, rz: e.z, sx: this.rng.range(1.2, 4) * k, sy: this.rng.range(0.4, 1.8) * (plates ? 0.6 : 1), sz: this.rng.range(1.2, 5) * k, color: this.rng.chance(0.2) ? this.arch.palette.accent : this.rng.chance(0.5) ? this.arch.palette.dark : this.arch.palette.hull });
    }
    if (items.length) instanced(root, G.box(), plates ? this.mats.armour : this.mats.panel, items, "greebles");
    const tip = this.slots.find((s) => s.cap && s.zone < 0.5);
    if (tip) {
      const whips = [];
      const nw = this.rng.int(3, 7);
      for (let i = 0; i < nw; i++) whips.push({ x: tip.pos.x + this.rng.range(-this.R * 0.5, this.R * 0.5), y: tip.pos.y + this.rng.range(-this.R * 0.5, this.R * 0.5), z: tip.pos.z - this.R * 0.8, rx: Math.PI / 2, sx: 0.25, sy: this.rng.range(8, 24), sz: 0.25 });
      instanced(root, G.cyl(5), this.mats.metal, whips, "whips");
    }
    this.count(items.length);
  }

  /* running lights: red port, green starboard, white on the extremities */
  runningLights(root) {
    const b = new THREE.Box3();
    for (const o of this.occ) b.union(o);
    const c = b.getCenter(new THREE.Vector3());
    const pts = [
      [b.min.x, c.y, c.z, "#ff3344"], [b.max.x, c.y, c.z, "#33ff66"],
      [c.x, b.max.y, b.min.z, "#ffffff"], [c.x, b.max.y, b.max.z, "#ffffff"], [c.x, b.min.y, c.z, "#ffffff"],
    ];
    for (const [x, y, z, col] of pts) this.lamp(root, x, y, z, col, col === "#ffffff" ? "strobe" : "blink", 3);
  }

  /* the shield: when emitters are fitted, a faint faceted shell breathes round the whole structure */
  shieldShell(root) {
    const emitters = this.placed.filter((p) => p.module.tags.includes("shield")).length;
    this.shielded = emitters > 0;
    if (!this.shielded || this.cfg.shieldShell === false) return;
    const b = new THREE.Box3();
    for (const o of this.occ) b.union(o);
    const size = b.getSize(new THREE.Vector3()), c = b.getCenter(new THREE.Vector3());
    const shell = addMesh(root, G.ico(2), this.mats.shield, c.x, c.y, c.z, 0, 0, 0, size.x * 0.62 + 40, size.y * 0.62 + 40, size.z * 0.56 + 40);
    shell.name = "shield";
    shell.renderOrder = 10;
    shell.userData.shield = { phase: this.rng.range(0, 6), base: 0.03 + 0.01 * Math.min(4, emitters) };
    const wire = addMesh(root, G.ico(2), makeMat("#8fd6ff", { emissive: "#6fb8ff", emissiveIntensity: 1.5, transparent: true, opacity: 0.05, depthWrite: false }), c.x, c.y, c.z, 0, 0, 0, size.x * 0.62 + 41, size.y * 0.62 + 41, size.z * 0.56 + 41);
    wire.material.wireframe = true;
    wire.name = "shield-wire";
    wire.renderOrder = 11;
    wire.userData.shield = { phase: this.rng.range(0, 6), base: 0.05 };
    this.count(2);
  }
}
