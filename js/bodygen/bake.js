export function faceGrids(n) {
  const N1 = n + 1;
  const keyToId = new Map();
  const grids = new Int32Array(6 * N1 * N1);
  const c = [0, 0, 0];
  let next = 0, f = 0;
  for (let k = 0; k < 3; k++) {
    const u = (k + 1) % 3, v = (k + 2) % 3;
    for (const side of [0, n]) {
      for (let j = 0; j <= n; j++) {
        for (let i = 0; i <= n; i++) {
          c[k] = side; c[u] = i; c[v] = j;
          const key = (c[0] * N1 + c[1]) * N1 + c[2];
          let id = keyToId.get(key);
          if (id === undefined) { id = next++; keyToId.set(key, id); }
          grids[(f * N1 + j) * N1 + i] = id;
        }
      }
      f++;
    }
  }
  return grids;
}

const clamp01 = (x) => (x < 0 ? 0 : x > 1 ? 1 : x);

export function bakeLattice(src, H, L) {
  if (H % L) throw new Error(`bake: L=${L} does not divide H=${H}`);
  const N1 = H + 1, step = H / L, M1 = L + 1;
  const grids = faceGrids(H);
  const W = 3 * N1, Ht = 2 * N1;
  const texA = new Uint8Array(W * Ht * 4);
  const texB = new Uint8Array(W * Ht * 4);
  let emitMax = 0;
  for (let i = 0; i < src.emit.length; i++) if (src.emit[i] > emitMax) emitMax = src.emit[i];
  const texC = emitMax > 1e-4 ? new Uint8Array(W * Ht * 4) : null;

  for (let f = 0; f < 6; f++) {
    const ox = (f % 3) * N1, oy = Math.floor(f / 3) * N1;
    for (let j = 0; j <= H; j++) {
      for (let i = 0; i <= H; i++) {
        const id = grids[(f * N1 + j) * N1 + i];
        const t = ((oy + j) * W + ox + i) * 4;
        texA[t] = Math.round(Math.sqrt(clamp01(src.color[id * 3])) * 255);
        texA[t + 1] = Math.round(Math.sqrt(clamp01(src.color[id * 3 + 1])) * 255);
        texA[t + 2] = Math.round(Math.sqrt(clamp01(src.color[id * 3 + 2])) * 255);
        texA[t + 3] = Math.round(clamp01(src.metal[id]) * 255);
        texB[t] = Math.round((src.normal[id * 3] * 0.5 + 0.5) * 255);
        texB[t + 1] = Math.round((src.normal[id * 3 + 1] * 0.5 + 0.5) * 255);
        texB[t + 2] = Math.round((src.normal[id * 3 + 2] * 0.5 + 0.5) * 255);
        texB[t + 3] = Math.round(clamp01(src.rough[id]) * 255);
        if (texC) {
          texC[t] = Math.round(clamp01(src.emit[id * 3] / emitMax) * 255);
          texC[t + 1] = Math.round(clamp01(src.emit[id * 3 + 1] / emitMax) * 255);
          texC[t + 2] = Math.round(clamp01(src.emit[id * 3 + 2] / emitMax) * 255);
          texC[t + 3] = 255;
        }
      }
    }
  }

  const vpf = M1 * M1;
  const positions = new Float32Array(6 * vpf * 3);
  const normals = new Float32Array(6 * vpf * 3);
  const colors = new Float32Array(6 * vpf * 3);
  const uvs = new Float32Array(6 * vpf * 2);
  const index = new Uint32Array(6 * L * L * 6);
  let ti = 0;
  for (let f = 0; f < 6; f++) {
    const ox = (f % 3) * N1, oy = Math.floor(f / 3) * N1;
    const base = f * vpf;
    for (let j = 0; j <= L; j++) {
      for (let i = 0; i <= L; i++) {
        const hi = i * step, hj = j * step;
        const id = grids[(f * N1 + hj) * N1 + hi];
        const o = base + j * M1 + i;
        for (let a = 0; a < 3; a++) {
          positions[o * 3 + a] = src.position[id * 3 + a];
          normals[o * 3 + a] = src.normal[id * 3 + a];
          colors[o * 3 + a] = src.color[id * 3 + a];
        }
        uvs[o * 2] = (ox + hi + 0.5) / W;
        uvs[o * 2 + 1] = (oy + hj + 0.5) / Ht;
      }
    }
    const far = f % 2 === 1;
    for (let j = 0; j < L; j++) {
      for (let i = 0; i < L; i++) {
        const a = base + j * M1 + i, b = a + 1, cc = a + M1 + 1, d = a + M1;
        if (far) { index[ti++] = a; index[ti++] = b; index[ti++] = cc; index[ti++] = a; index[ti++] = cc; index[ti++] = d; }
        else { index[ti++] = a; index[ti++] = cc; index[ti++] = b; index[ti++] = a; index[ti++] = d; index[ti++] = cc; }
      }
    }
  }
  return { H, L, W, Ht, texA, texB, texC, emitScale: emitMax, positions, normals, colors, uvs, index };
}
