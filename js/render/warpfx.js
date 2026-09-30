import * as THREE from "three";

const SHELL_STREAK = 0.16;
const SHELL_MIN = 0.004;

const TUNNEL_N = 1100;
const TUNNEL_R = 260;
const TUNNEL_LEN = 5200;
const TUNNEL_BEHIND = 90;
const TUNNEL_SPEED = 9000;
const TUNNEL_STREAK = 900;

const WAKE_MAX = 40;
const WAKE_LEN = 0.55;
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

export function makeWarpFx(scene, starPos, shellRadius) {
  const starCount = Math.floor(starPos.length / 3);
  const shell = lineSegments(starCount, 0.95);
  scene.add(shell.mesh);

  const tunnelGroup = new THREE.Group();
  tunnelGroup.matrixAutoUpdate = true;
  scene.add(tunnelGroup);
  const tunnel = lineSegments(TUNNEL_N, 0.9);
  tunnelGroup.add(tunnel.mesh);

  const wake = lineSegments(WAKE_MAX, 0.85);
  scene.add(wake.mesh);

  const tx = new Float32Array(TUNNEL_N);
  const ty = new Float32Array(TUNNEL_N);
  const tz = new Float32Array(TUNNEL_N);
  const tshade = new Float32Array(TUNNEL_N);
  function seed(i, z) {
    const a = Math.random() * Math.PI * 2;
    const r = TUNNEL_R * (0.25 + Math.pow(Math.random(), 0.6) * 0.95);
    tx[i] = Math.cos(a) * r;
    ty[i] = Math.sin(a) * r;
    tz[i] = z;
    tshade[i] = 0.5 + Math.random() * 0.5;
  }
  for (let i = 0; i < TUNNEL_N; i++) seed(i, -Math.random() * TUNNEL_LEN);

  const dir = new Float32Array(starCount * 3);
  for (let i = 0; i < starCount; i++) {
    const x = starPos[i * 3], y = starPos[i * 3 + 1], z = starPos[i * 3 + 2];
    const l = Math.hypot(x, y, z) || 1;
    dir[i * 3] = x / l; dir[i * 3 + 1] = y / l; dir[i * 3 + 2] = z / l;
  }
  const shade = new Float32Array(starCount);
  const stretch = new Float32Array(starCount);
  for (let i = 0; i < starCount; i++) {
    shade[i] = 0.55 + Math.random() * 0.45;
    stretch[i] = 0.25 + Math.pow(Math.random(), 1.7) * 1.55;
  }

  let flash = 0;
  let lastPhase = "idle";

  return {
    bloom: 0,
    get flash() { return flash; },
    kick(v = 1) { flash = Math.max(flash, v); },

    update(dt, camera, strength, phase, budget = 1) {
      flash = Math.max(0, flash - dt * 2.2);
      if (phase !== lastPhase) {
        if (phase === "run") this.kick(1);
        else if (lastPhase === "run") this.kick(0.6);
        lastPhase = phase;
      }
      this.bloom = Math.min(1, strength * 1.25);

      camera.getWorldDirection(_fwd);

      const k = strength * strength;
      const smear = shellRadius * (SHELL_MIN + SHELL_STREAK * k);
      if (strength > 0.004) {
        shell.mesh.visible = true;
        const p = shell.pos, c = shell.col;
        _head.setRGB(0.86 + k * 0.9, 0.93 + k * 0.85, 1.0 + k * 1.1);
        for (let i = 0; i < starCount; i++) {
          const i3 = i * 3, i6 = i * 6;
          const hx = starPos[i3], hy = starPos[i3 + 1], hz = starPos[i3 + 2];
          p[i6] = hx; p[i6 + 1] = hy; p[i6 + 2] = hz;
          const len = smear * stretch[i];
          p[i6 + 3] = hx - _fwd.x * len;
          p[i6 + 4] = hy - _fwd.y * len;
          p[i6 + 5] = hz - _fwd.z * len;
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
          const near = 1 - Math.min(1, Math.abs(tz[i]) / TUNNEL_LEN);
          const g = tshade[i] * (0.25 + near * 0.75) * strength;
          c[i6] = _head.r * g; c[i6 + 1] = _head.g * g; c[i6 + 2] = _head.b * g;
          c[i6 + 3] = 0; c[i6 + 4] = 0; c[i6 + 5] = g * 0.25;
        }
        tunnel.geo.attributes.position.needsUpdate = true;
        tunnel.geo.attributes.color.needsUpdate = true;
      } else tunnel.mesh.visible = false;
    },

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
        _head.setRGB(1.5, 1.9, 2.6);
        c[i6] = _head.r; c[i6 + 1] = _head.g; c[i6 + 2] = _head.b;
        c[i6 + 3] = 0; c[i6 + 4] = 0.02; c[i6 + 5] = 0.1;
        n++;
      }
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
