/* LIVING GALAXY — drawing an impact run.
 *
 * js/impacts.js decides what breaks and where every piece goes; this draws it,
 * with the asteroid generator's own Impact Lab shaders (vendored at
 * js/asteroidgen/impact-shaders.js and fracture.js):
 *
 *   the rock      its grown body cut into solid chunks. Detached chunks are
 *                 placed from the run's rigid-body track (centre + orientation
 *                 in the mesh's frame), glow from the heat of the break and cool,
 *                 and — being asteroid pieces — pull themselves round into new
 *                 small asteroids a second or two after they leave
 *   the blast     a dust sheet across the contact normal, sparks, and meshed
 *                 ejecta rocks, all moving analytically in the vertex shader
 *   the aftermath dust shed off each tumbling piece (the swirl lines) and the
 *                 spray off every secondary contact, flushed from the run as it
 *                 emits them into fixed GPU buffers
 *   the flash     a flash shell and two shock rings on the contact
 *
 * Everything sits in one group per run, placed at the run's frame (the struck
 * world's centre, or the pair's centre of mass) relative to the floating origin
 * and scaled by the run's `L`, so the Lab's shaders see the units they were
 * written in.
 *
 * Crust thrown off a world is not drawn here: those pieces are ordinary debris
 * chunks and the engine's debris mesh draws them (hot, while the run says so).
 */

import * as THREE from "three";
import { IMPACT_SHADERS } from "./asteroidgen/impact-shaders.js";
import { FRACTURE_MAX, createFractureUniforms } from "./asteroidgen/fracture.js";
import { DustBuffer, RockBuffer, chunkLocal } from "./asteroidgen/impact-sim.js";
import { makeRockGeometry } from "./asteroidgen/debris.js";
import { RNG } from "./asteroidgen/rng.js";
import { patchGeneratorShaders } from "./bodygen/gl.js";
import { runs, IMPACTS } from "./impacts.js";

const COARSE = typeof matchMedia === "function" && matchMedia("(pointer: coarse)").matches;
const DUST_CAP = COARSE ? 2200 : 4000;
const ROCK_CAP = COARSE ? 200 : 360;
const AFTER = 12;          // seconds the ejecta is kept after its run lets the pieces go
const SLOW = 0.035;

export function makeImpactFx({ scene, origin, camera, renderer }) {
  patchGeneratorShaders();
  const views = new Map();   // run id → view
  const rockVariants = [0, 1, 2, 3].map((v) => makeRockGeometry(new RNG(700 + v), { detail: v === 0 ? 1 : 2 }));
  const light = {
    uSunDir: { value: new THREE.Vector3(1, 0.3, 0) },
    uSunColor: { value: new THREE.Color(0.9, 0.85, 0.76) },
    uAmbient: { value: new THREE.Color(0.05, 0.055, 0.07) },
  };
  const _size = new THREE.Vector2();
  const _m = new THREE.Matrix4();
  let clock = 0;

  function pxScale() {
    renderer.getDrawingBufferSize(_size);
    return (_size.y * 0.5) / Math.tan(THREE.MathUtils.degToRad(camera.fov * 0.5));
  }

  function build(run) {
    const group = new THREE.Group();
    group.scale.setScalar(run.L);
    scene.add(group);
    const view = { run, group, rocks: [], dust: null, dustGeo: null, rockBuf: null, rockMeshes: [], sprite: null, rockUni: null, flash: null, rings: [], endedAt: null, emittedAt: 0 };

    /* the fractured rock(s) */
    run.rocks.forEach((fr, bi) => {
      const uniforms = createFractureUniforms();
      const material = new THREE.ShaderMaterial({
        defines: { FRACTURE_MAX, FRACTURE_MORPH: "" },
        uniforms: { ...uniforms, ...light },
        vertexShader: IMPACT_SHADERS.bodyVertex,
        fragmentShader: IMPACT_SHADERS.bodyFragment,
        side: THREE.DoubleSide,
      });
      const mesh = new THREE.Mesh(fr.geometry, material);
      mesh.frustumCulled = false;
      const pose = run.impactPose[bi];
      mesh.position.fromArray(pose.pos);
      mesh.quaternion.set(pose.q[0], pose.q[1], pose.q[2], pose.q[3]);
      mesh.scale.setScalar(pose.scale ?? 1);
      group.add(mesh);
      /* which run pieces are this rock's chunks */
      const pieceOf = new Map();
      run.sim.pieces.forEach((P, i) => { if (P.kind === "fragment" && P.body === (run.kind === "strike" ? 1 : bi) && !P.crust) pieceOf.set(P.k, i); });
      const planBody = run.plan.bodies[run.kind === "strike" ? 1 : bi];
      for (const d of planBody.detached) {
        const c = fr.fracture.centroids[d.k];
        uniforms.uChunkA.value.set([c[0], c[1], c[2], 0], d.k * 4);
        uniforms.uChunkB.value.set([c[0], c[1], c[2], d.seed], d.k * 4);
        uniforms.uChunkC.value.set([d.heat, 1, 1, d.reform], d.k * 4);
      }
      uniforms.uCoreHeat.value = 1;
      uniforms.uVeinScale.value = 2.4 / fr.fracture.radius;
      uniforms.uVeins.value = Math.min(1, 0.4 + run.plan.relativeSpeed * 0.25);
      /* a rock that did not break all the way keeps a survivor */
      const survivor = run.sim.pieces.findIndex((P) => P.kind === "survivor" && P.body === (run.kind === "strike" ? 1 : bi));
      view.rocks.push({ fr, mesh, uniforms, pieceOf, pose, survivor });
    });

    /* the blast */
    const E = run.ejecta;
    const sprite = { uTime: { value: 0 }, uImpact: { value: 0 }, uPx: { value: 600 }, uDrag: { value: 0.3 }, uSlow: { value: SLOW } };
    view.sprite = sprite;
    const dust = new DustBuffer(DUST_CAP);
    dust.pushBlast(E.dust, 0);
    view.dust = dust;
    view.dustGeo = spritePoints(group, dust, sprite, false);
    const sparks = { ...E.sparks, t0: new Float32Array(E.sparks.pos.length / 3) };
    spritePoints(group, sparks, sprite, true);
    const rockBuf = new RockBuffer(ROCK_CAP, rockVariants.length);
    rockBuf.pushBlast(E.rocks, 0);
    view.rockBuf = rockBuf;
    const rockUni = { uTime: sprite.uTime, uImpact: sprite.uImpact, uDrag: { value: 0.25 }, uSlow: { value: SLOW }, ...light };
    view.rockUni = rockUni;
    const rockMat = new THREE.ShaderMaterial({ uniforms: rockUni, vertexShader: IMPACT_SHADERS.rockVertex, fragmentShader: IMPACT_SHADERS.rockFragment });
    for (let v = 0; v < rockVariants.length; v++) {
      const geo = rockVariants[v].clone();
      const n = rockBuf.per;
      const o = v * n;
      const mesh = new THREE.InstancedMesh(geo, rockMat, n);
      mesh.instanceMatrix = new THREE.InstancedBufferAttribute(rockBuf.matrix.subarray(o * 16, (o + n) * 16), 16);
      mesh.instanceColor = new THREE.InstancedBufferAttribute(rockBuf.color.subarray(o * 3, (o + n) * 3), 3);
      geo.setAttribute("aVel", new THREE.InstancedBufferAttribute(rockBuf.vel.subarray(o * 3, (o + n) * 3), 3));
      geo.setAttribute("aSpin", new THREE.InstancedBufferAttribute(rockBuf.spin.subarray(o * 4, (o + n) * 4), 4));
      geo.setAttribute("aSpin2", new THREE.InstancedBufferAttribute(rockBuf.spin2.subarray(o * 4, (o + n) * 4), 4));
      geo.setAttribute("aHeat", new THREE.InstancedBufferAttribute(rockBuf.heat.subarray(o * 2, (o + n) * 2), 2));
      geo.setAttribute("aT0", new THREE.InstancedBufferAttribute(rockBuf.t0.subarray(o, o + n), 1));
      mesh.frustumCulled = false;
      group.add(mesh);
      view.rockMeshes.push(mesh);
    }

    /* the flash */
    const C = new THREE.Vector3().fromArray(run.contact);
    const N = new THREE.Vector3().fromArray(run.normal);
    const power = Math.min(2.2, run.plan.relativeSpeed / 1.6);
    const flash = new THREE.Mesh(new THREE.SphereGeometry(1, 24, 12), new THREE.MeshBasicMaterial({ color: 0xfff3d8, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false }));
    flash.position.copy(C);
    group.add(flash);
    view.flash = { mesh: flash, power };
    for (let i = 0; i < 2; i++) {
      const ring = new THREE.Mesh(new THREE.TorusGeometry(1, i ? 0.02 : 0.045, 8, 72), new THREE.MeshBasicMaterial({ color: i ? 0x9fd4ff : 0xffe6c0, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false }));
      ring.position.copy(C);
      ring.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), N);
      group.add(ring);
      view.rings.push(ring);
    }
    views.set(run.id, view);
    return view;
  }

  function spritePoints(group, S, uniforms, spark) {
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(S.pos, 3));
    g.setAttribute("aVel", new THREE.BufferAttribute(S.vel, 3));
    g.setAttribute("aData", new THREE.BufferAttribute(S.data, 4));
    g.setAttribute("aColor", new THREE.BufferAttribute(S.color, 3));
    g.setAttribute("aT0", new THREE.BufferAttribute(S.t0, 1));
    const m = new THREE.ShaderMaterial({
      uniforms,
      vertexShader: IMPACT_SHADERS.spriteVertex,
      fragmentShader: IMPACT_SHADERS.spriteFragment,
      defines: spark ? { SPARK: "" } : {},
      transparent: true,
      depthWrite: false,
      blending: spark ? THREE.AdditiveBlending : THREE.NormalBlending,
    });
    const p = new THREE.Points(g, m);
    p.frustumCulled = false;
    p.renderOrder = spark ? 3 : 2;
    group.add(p);
    return g;
  }

  function flush(view) {
    const sim = view.run.sim;
    if (!sim.emitted.length) return;
    for (const r of sim.emitted) (r.kind === 3 ? view.rockBuf : view.dust).push(r);
    sim.emitted.length = 0;
    if (view.dust.dirty) {
      for (const k of ["position", "aVel", "aData", "aColor", "aT0"]) view.dustGeo.attributes[k].needsUpdate = true;
      view.dust.dirty = false;
    }
    if (view.rockBuf.dirty) {
      for (const m of view.rockMeshes) {
        m.instanceMatrix.needsUpdate = true;
        m.instanceColor.needsUpdate = true;
        for (const k of ["aVel", "aSpin", "aSpin2", "aHeat", "aT0"]) m.geometry.attributes[k].needsUpdate = true;
      }
      view.rockBuf.dirty = false;
    }
  }

  function dispose(view) {
    view.group.traverse((o) => {
      if (o.isInstancedMesh) o.dispose(); // frees instanceMatrix/instanceColor on the GPU
      if (o.geometry && !rockVariants.includes(o.geometry)) {
        /* the fractured rock's geometry belongs to the run, and the run is gone */
        o.geometry.dispose();
      }
      if (o.material) o.material.dispose();
    });
    view.group.removeFromParent();
    views.delete(view.run.id);
  }

  function update(dt) {
    clock += dt;
    const live = new Set();
    for (const run of runs) {
      live.add(run.id);
      if (!views.has(run.id)) build(run);
    }
    const px = pxScale();
    for (const view of [...views.values()]) {
      const run = view.run;
      if (!live.has(run.id) && view.endedAt == null) view.endedAt = clock;
      const age = view.endedAt == null ? run.age : IMPACTS.seconds + (clock - view.endedAt);
      if (view.endedAt != null && clock - view.endedAt > AFTER) { dispose(view); continue; }

      view.group.position.set(run.frame.x - origin.x, run.frame.y - origin.y, run.frame.z - origin.z);
      light.uSunDir.value.set(-run.frame.x, -run.frame.y, -run.frame.z).normalize();
      view.sprite.uTime.value = age;
      view.sprite.uPx.value = px * run.L;

      /* the pieces: from the rigid-body track while the run holds them, and the
       * rock meshes go when the run lets the pieces become ordinary debris */
      const ended = view.endedAt != null;
      for (const rk of view.rocks) {
        rk.mesh.visible = !ended;
        if (ended) continue;
        const u = rk.uniforms;
        u.uTime.value = age;
        let mp = rk.pose.pos, mq = rk.pose.q;
        if (rk.survivor >= 0) {
          const s = run.sim.stateAt(rk.survivor, Math.min(age, run.sim.t));
          mp = s.pos; mq = s.q;
          rk.mesh.position.fromArray(mp);
          rk.mesh.quaternion.set(mq[0], mq[1], mq[2], mq[3]);
        }
        const scale = rk.pose.scale ?? 1;
        for (const [k, idx] of rk.pieceOf) {
          const s = run.sim.stateAt(idx, Math.min(age, run.sim.t));
          const P = run.sim.pieces[idx];
          const L = chunkLocal(mp, mq, scale, s.pos, s.q);
          const o = k * 4;
          const chunk = run.chunks.get(idx);
          u.uChunkB.value.set([L.centre[0], L.centre[1], L.centre[2], P.seed || 0], o);
          u.uChunkC.value[o] = Math.min(1.2, (P.heat ?? 0) * Math.exp(-age * (P.cool ?? 0.4)) + (P.heatBump ?? 0));
          /* a piece the tractor or the cutter already took is not there */
          u.uChunkC.value[o + 1] = chunk && !chunk.dead ? 1 : 0;
          u.uChunkD.value.set(L.q, o);
        }
      }
      if (!ended) flush(view);

      /* flash + rings */
      const f = view.flash;
      const ft = age;
      f.mesh.visible = ft < 1.6;
      if (f.mesh.visible) {
        f.mesh.scale.setScalar(0.6 + ft * 5 * f.power);
        f.mesh.material.opacity = Math.max(0, 0.9 * (1 - ft / 1.6)) * Math.min(1, f.power);
      }
      view.rings.forEach((ring, i) => {
        const rt = ft - i * 0.12;
        ring.visible = rt > 0 && rt < 3.2;
        if (!ring.visible) return;
        ring.scale.setScalar(0.5 + rt * (i ? 7 : 4.5) * Math.max(0.6, f.power));
        ring.material.opacity = Math.max(0, 0.8 * (1 - rt / 3.2));
      });
    }
  }

  function disposeAll() {
    for (const v of [...views.values()]) dispose(v);
    for (const g of rockVariants) g.dispose();
  }

  return { update, dispose: disposeAll, get views() { return views; } };
}
