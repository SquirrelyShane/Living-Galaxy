/* LIVING GALAXY — what a warp run looks like from inside it.
 *
 * The core already worked. `sim.warp` has run a real state machine for a long
 * time — idle → spool → run, a spool the reactor has to pay for, lane
 * blockers, hazards, dropouts that dump you at the crossing with damage and a
 * cooling core. What it did not have was a picture. Engaging a warp widened
 * the FOV to 92°, shook the camera, and moved the ship a very long way. The
 * most dramatic thing the ship can do looked like a fast zoom.
 *
 * This is the picture. Three layers, each doing a different job:
 *
 *   SHELL     the 5,200-star backdrop stretches into radial streaks along the
 *             axis you are travelling. It is what tells you the whole sky is
 *             moving, and because the shell is fixed and enormous the streaks
 *             swing correctly when you turn.
 *   TUNNEL    a close-in layer that exists only during a run: streaks in a
 *             cylinder around the flight axis, recycling as they pass. The
 *             shell says the sky is moving; this says how fast, because it is
 *             near enough to have parallax.
 *   WAKE      the same trick applied to NPC hulls under lane drive, so traffic
 *             crossing the system reads at a glance — and so the thing you
 *             cannot intercept looks like the thing you cannot intercept.
 *
 * All three are `LineSegments` with additive blending and vertex colours: no
 * new material type, no shader, no texture, and one buffer update each. The
 * glow comes from postfx.js, which is why the streak colours run above 1.0 —
 * they are meant to be thresholded, and on a device that cannot afford the
 * bloom they simply read as bright lines, which is a perfectly good fallback.
 *
 * Nothing here knows what a warp is. The engine hands it a strength and a
 * direction; everything else is geometry.
 */

import * as THREE from "three";

/* ---- shell ---------------------------------------------------------------- */

/* How far a star smears at full warp, as a fraction of the shell radius.
 * Larger than it sounds: the shell is 15,000,000 units out, so a streak has to
 * be a real slice of that to subtend any angle at all. */
const SHELL_STREAK = 0.16;
const SHELL_MIN = 0.004;          // a touch of smear even at a crawl, so spool has somewhere to go

/* ---- tunnel --------------------------------------------------------------- */

const TUNNEL_N = 1100;            // streaks in the near layer at full tier
const TUNNEL_R = 260;             // radius of the cylinder they live in
const TUNNEL_LEN = 5200;          // how far ahead they are seeded
const TUNNEL_BEHIND = 90;         // and how far past the camera before they recycle
const TUNNEL_SPEED = 9000;        // units a second at full strength
const TUNNEL_STREAK = 900;        // length of one streak at full strength

/* ---- wake ----------------------------------------------------------------- */

const WAKE_MAX = 40;              // the most drive trails drawn at once
const WAKE_LEN = 0.55;            // trail length as a fraction of the hull's speed (seconds of travel)
const WAKE_MIN = 240;
const WAKE_MAX_LEN = 26000;

const _fwd = new THREE.Vector3();
const _head = new THREE.Color();

function lineSegments(count, opacity = 1) {
  const geo = new THREE.BufferGeometry();
  const pos = new Float32Array(count * 6);
  const col = new Float32Array(count * 6);
  geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  geo.setAttribute("color", new THREE.BufferAttribute(col, 3));
  const mesh = new THREE.LineSegments(
    geo,
    new THREE.LineBasicMaterial({
      vertexColors: true,
      transparent: true,
      opacity,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    }),
  );
  mesh.frustumCulled = false;
  mesh.visible = false;
  mesh.renderOrder = 4;
  return { mesh, geo, pos, col };
}

/**
 * Build the warp layers.
 *
 *   scene        where to hang them
 *   starPos      the shell's own position buffer — the streaks reuse the exact
 *                stars that are already there, so the smear lines up with the
 *                backdrop instead of being a second, differently-placed sky
 *   shellRadius  STAR_SHELL
 */
export function makeWarpFx(scene, starPos, shellRadius) {
  const starCount = Math.floor(starPos.length / 3);
  const shell = lineSegments(starCount, 0.95);
  scene.add(shell.mesh);

  /* the near layer lives in its own frame: placed on the camera and turned
   * with it every frame, so its contents can be plain local coordinates and
   * the whole thing is one matrix rather than 1,100 rotations */
  const tunnelGroup = new THREE.Group();
  tunnelGroup.matrixAutoUpdate = true;
  scene.add(tunnelGroup);
  const tunnel = lineSegments(TUNNEL_N, 0.9);
  tunnelGroup.add(tunnel.mesh);

  const wake = lineSegments(WAKE_MAX, 0.85);
  scene.add(wake.mesh);

  /* tunnel particle state, in the group's local frame. The camera looks down
   * local −Z, so a streak ahead of you has negative z and walks toward +z. */
  const tx = new Float32Array(TUNNEL_N);
  const ty = new Float32Array(TUNNEL_N);
  const tz = new Float32Array(TUNNEL_N);
  const tshade = new Float32Array(TUNNEL_N);
  function seed(i, z) {
    const a = Math.random() * Math.PI * 2;
    /* biased outward: a uniform disc puts most streaks in the middle of the
     * screen where they read as noise rather than motion */
    const r = TUNNEL_R * (0.25 + Math.pow(Math.random(), 0.6) * 0.95);
    tx[i] = Math.cos(a) * r;
    ty[i] = Math.sin(a) * r;
    tz[i] = z;
    tshade[i] = 0.5 + Math.random() * 0.5;
  }
  for (let i = 0; i < TUNNEL_N; i++) seed(i, -Math.random() * TUNNEL_LEN);

  /* the shell's own direction per star, normalised once */
  const dir = new Float32Array(starCount * 3);
  for (let i = 0; i < starCount; i++) {
    const x = starPos[i * 3], y = starPos[i * 3 + 1], z = starPos[i * 3 + 2];
    const l = Math.hypot(x, y, z) || 1;
    dir[i * 3] = x / l; dir[i * 3 + 1] = y / l; dir[i * 3 + 2] = z / l;
  }
  const shade = new Float32Array(starCount);
  /* Length varies per star as well as brightness. Uniform-length streaks read
   * as a wire-frame cone — a drawn thing — because nothing in a real field of
   * light sources is that regular. The spread is what makes it look like
   * depth rather than geometry. */
  const stretch = new Float32Array(starCount);
  for (let i = 0; i < starCount; i++) {
    shade[i] = 0.55 + Math.random() * 0.45;
    stretch[i] = 0.25 + Math.pow(Math.random(), 1.7) * 1.55;
  }

  let flash = 0;
  let lastPhase = "idle";

  return {
    /** 0..1 — how much of the frame should bleed. Drives postfx. */
    bloom: 0,
    /** 0..1 — a white-out, spent down by the engine each frame. */
    get flash() { return flash; },
    /** Kick a flash: engaging and dropping out both earn one. */
    kick(v = 1) { flash = Math.max(flash, v); },

    /**
     * `strength` 0..1 is how deep into the run we are. `phase` is the core's
     * own state string, used only to notice the edges and fire a flash.
     * `budget` 0..1 scales the near layer for a device under load.
     */
    update(dt, camera, strength, phase, budget = 1) {
      flash = Math.max(0, flash - dt * 2.2);
      if (phase !== lastPhase) {
        /* entering and leaving the tunnel are both events worth seeing */
        if (phase === "run") this.kick(1);
        else if (lastPhase === "run") this.kick(0.6);
        lastPhase = phase;
      }
      this.bloom = Math.min(1, strength * 1.25);

      camera.getWorldDirection(_fwd);

      /* ---- shell ---- */
      const k = strength * strength;
      const smear = shellRadius * (SHELL_MIN + SHELL_STREAK * k);
      if (strength > 0.004) {
        shell.mesh.visible = true;
        const p = shell.pos, c = shell.col;
        /* cool at rest, hot and blue-shifted down the throat of a run */
        _head.setRGB(0.86 + k * 0.9, 0.93 + k * 0.85, 1.0 + k * 1.1);
        for (let i = 0; i < starCount; i++) {
          const i3 = i * 3, i6 = i * 6;
          const hx = starPos[i3], hy = starPos[i3 + 1], hz = starPos[i3 + 2];
          p[i6] = hx; p[i6 + 1] = hy; p[i6 + 2] = hz;
          /* the tail runs back along the direction of travel, not along the
           * star's own bearing: that is what makes the smear radiate from the
           * point you are flying at rather than from the middle of the screen */
          const len = smear * stretch[i];
          p[i6 + 3] = hx - _fwd.x * len;
          p[i6 + 4] = hy - _fwd.y * len;
          p[i6 + 5] = hz - _fwd.z * len;
          /* A star dead ahead barely moves across the eye and a star abeam
           * sweeps past fastest — so the smear is strongest on the beam and
           * the throat you are flying into stays comparatively clear. Getting
           * this backwards fills the middle of the screen with the brightest
           * lines, which is the one place you are trying to look. */
          const along = dir[i3] * _fwd.x + dir[i3 + 1] * _fwd.y + dir[i3 + 2] * _fwd.z;
          const beam = 1 - Math.abs(along);
          const gain = shade[i] * (0.18 + 0.82 * beam * beam);
          c[i6] = _head.r * gain; c[i6 + 1] = _head.g * gain; c[i6 + 2] = _head.b * gain;
          const t = gain * 0.05;
          c[i6 + 3] = t; c[i6 + 4] = t; c[i6 + 5] = t * 1.8;
        }
        shell.geo.attributes.position.needsUpdate = true;
        shell.geo.attributes.color.needsUpdate = true;
        shell.mesh.material.opacity = Math.min(1, 0.25 + strength * 0.85);
      } else shell.mesh.visible = false;

      /* ---- tunnel ---- */
      if (strength > 0.06) {
        tunnel.mesh.visible = true;
        tunnelGroup.position.copy(camera.position);
        tunnelGroup.quaternion.copy(camera.quaternion);
        const live = Math.max(80, Math.floor(TUNNEL_N * budget));
        const speed = TUNNEL_SPEED * strength;
        const len = TUNNEL_STREAK * (0.12 + strength * 0.88);
        const p = tunnel.pos, c = tunnel.col;
        _head.setRGB(0.75 + k * 1.5, 0.95 + k * 1.2, 1.25 + k * 1.4);
        for (let i = 0; i < TUNNEL_N; i++) {
          const i6 = i * 6;
          if (i >= live) { p[i6] = p[i6 + 3] = 0; p[i6 + 1] = p[i6 + 4] = 0; p[i6 + 2] = p[i6 + 5] = 0; continue; }
          tz[i] += speed * dt;
          if (tz[i] > TUNNEL_BEHIND) seed(i, -TUNNEL_LEN);
          p[i6] = tx[i]; p[i6 + 1] = ty[i]; p[i6 + 2] = tz[i];
          p[i6 + 3] = tx[i]; p[i6 + 4] = ty[i]; p[i6 + 5] = tz[i] - len;
          /* fade in as they come out of the distance and out as they pass */
          const near = 1 - Math.min(1, Math.abs(tz[i]) / TUNNEL_LEN);
          const g = tshade[i] * (0.25 + near * 0.75) * strength;
          c[i6] = _head.r * g; c[i6 + 1] = _head.g * g; c[i6 + 2] = _head.b * g;
          c[i6 + 3] = 0; c[i6 + 4] = 0; c[i6 + 5] = g * 0.25;
        }
        tunnel.geo.attributes.position.needsUpdate = true;
        tunnel.geo.attributes.color.needsUpdate = true;
      } else tunnel.mesh.visible = false;
    },

    /**
     * Drive wakes on NPC hulls. `list` is the roster, `origin` the floating
     * origin, `near` a cutoff. Only hulls with their drive lit get one, which
     * is the point: it is the readable difference between a hull you could
     * catch and one you could not.
     */
    updateWakes(list, origin, near = 1.4e6) {
      const p = wake.pos, c = wake.col;
      let n = 0;
      for (const h of list) {
        if (n >= WAKE_MAX) break;
        if (!h.drive || h.visible === false || h.job === "down") continue;
        const sp = h.speed ?? 0;
        if (sp < 400) continue;
        const d = Math.hypot(h.x - origin.x, h.y - origin.y, h.z - origin.z);
        if (d > near) continue;
        const vl = Math.hypot(h.vx ?? 0, h.vy ?? 0, h.vz ?? 0) || 1;
        const len = Math.max(WAKE_MIN, Math.min(WAKE_MAX_LEN, sp * WAKE_LEN));
        const i6 = n * 6;
        const hx = h.x - origin.x, hy = h.y - origin.y, hz = h.z - origin.z;
        p[i6] = hx; p[i6 + 1] = hy; p[i6 + 2] = hz;
        p[i6 + 3] = hx - ((h.vx ?? 0) / vl) * len;
        p[i6 + 4] = hy - ((h.vy ?? 0) / vl) * len;
        p[i6 + 5] = hz - ((h.vz ?? 0) / vl) * len;
        /* hot at the hull, gone at the tail */
        _head.setRGB(1.5, 1.9, 2.6);
        c[i6] = _head.r; c[i6 + 1] = _head.g; c[i6 + 2] = _head.b;
        c[i6 + 3] = 0; c[i6 + 4] = 0.02; c[i6 + 5] = 0.1;
        n++;
      }
      /* park the unused ones on a point rather than resizing the buffer */
      for (let i = n; i < WAKE_MAX; i++) {
        const i6 = i * 6;
        for (let j = 0; j < 6; j++) p[i6 + j] = 0;
        for (let j = 0; j < 6; j++) c[i6 + j] = 0;
      }
      wake.mesh.visible = n > 0;
      if (n > 0) {
        wake.geo.attributes.position.needsUpdate = true;
        wake.geo.attributes.color.needsUpdate = true;
      }
      return n;
    },

    dispose() {
      for (const l of [shell, tunnel, wake]) { l.geo.dispose(); l.mesh.material.dispose(); }
      scene.remove(shell.mesh, wake.mesh, tunnelGroup);
    },
  };
}
